"""Garden things for the meadow games (Apple count hosts, Big and small harvest, Feelings stump, Shape house goodies).
Models (all standing on y = 0, facing +z):
  prop_m_tree       fluffy tree, unit size (trunk to ~2.2, canopy centre ~2.7, ~4.1 tall). TINT = canopy colour
                  (leaf green / blossom pink); layer 'snow' = snow caps (hide unless snowy); layer 'trunk' keeps brown.
  prop_m_bush       a wide round bush ~3.2 wide, 1.9 tall; layer 'flowers' (little blossoms, can be hidden).
  prop_m_mound      a soil mound with a leafy tuft (strawberry patch), ~1.5 wide.
  prop_m_sunflower  ~3.3 tall, head (with the game's code face) facing +z at the top.
  prop_m_pumpkin    ~2 wide, 1.75 tall with stem, leaf and curly vine.
  prop_m_watermelon ~2.5 wide, 1.65 tall, wavy stripes.
  prop_m_mushroom   stem + dome cap (TINT = cap colour), white spots, a code face on the stem; ~1.9 tall.
  prop_m_flower     a little flower ~0.65 tall, TINT = petal colour.
ONLY=prop_m_tree tools/blender/build.sh prop_meadow_garden"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded, circle_poly, star_poly

# ---------- crisp hard-surface helpers ----------
# RawProp: a layer marked raw() is joined exactly as modelled (no voxel remesh), so analytic lathes, rings and stickers
# keep perfectly clean edges. pillow() builds a sticker / panel from a 2D outline: a flat top, a small rounded lip and an
# UNDERCUT side wall (it leans back under the top), so the game's inverted-hull ink draws a closed line all round it
# whenever it is seen within ~40 deg of head-on (a plain upright wall only inks the edges that face away).
import bpy, bmesh
from mathutils import Vector, Matrix


class RawProp(Prop):
    def raw(self, hard=False):
        self.layers[self._cur]['raw'] = True
        self.layers[self._cur]['hard'] = hard
        return self

    def _metaballs(self):
        objs = super()._metaballs()
        if self.layers[self._cur].get('hard'):
            for ob in objs:
                for md in getattr(ob, 'modifiers', []):
                    if md.type == 'BEVEL':
                        md.limit_method = 'ANGLE'
                        md.harden_normals = True
        return objs

    def _paint(self, skin):
        """facepaint layers: every face takes the colour at its centre, with no border cutting - for patterns that are
        laid out along the mesh's own grid lines (lathe columns / rows), so borders are exact and cost no triangles"""
        L = self.layers[self._cur]
        if not L.get('facepaint'):
            return super()._paint(skin)
        me = skin.data
        for old in list(me.color_attributes):
            me.color_attributes.remove(old)
        attr = me.color_attributes.new('Col', 'FLOAT_COLOR', 'CORNER')
        inv = Matrix(((1, 0, 0), (0, 0, 1), (0, -1, 0)))
        for poly in me.polygons:
            gp, gn = inv @ poly.center, inv @ poly.normal
            c = self.base
            for kind, fn, col in self.paints:
                if kind == 'fn' and fn(gp, gn):
                    c = col
            for li in poly.loop_indices:
                attr.data[li].color = c
        me.color_attributes.active_color = attr
        me.materials.append(bpy.data.materials.new(self.kind + '_skin'))

    def _skin(self):
        L = self.layers[self._cur]
        if not L.get('raw'):
            return super()._skin()
        objs = self._metaballs()
        bpy.context.view_layer.update()
        dg = bpy.context.evaluated_depsgraph_get()
        meshes = []
        for ob in objs:
            me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
            mo = bpy.data.objects.new(ob.name + '_mesh', me)
            bpy.context.scene.collection.objects.link(mo)
            meshes.append(mo)
        for ob in objs:
            bpy.data.objects.remove(ob)
        bpy.ops.object.select_all(action='DESELECT')
        for m in meshes:
            m.select_set(True)
        bpy.context.view_layer.objects.active = meshes[0]
        if len(meshes) > 1:
            bpy.ops.object.join()
        skin = bpy.context.view_layer.objects.active
        skin.name = skin.data.name = self.kind if self._cur == 'skin' else self._cur
        if not L.get('hard'):
            bm = bmesh.new()
            bm.from_mesh(skin.data)
            bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
            bmesh.ops.triangulate(bm, faces=bm.faces[:])
            outward(bm)
            bm.to_mesh(skin.data)
            bm.free()
        for f in skin.data.polygons:
            f.use_smooth = True
        skin.data.update()
        return skin


def outward(bm):
    """make every closed island face outward (signed volume > 0); bmesh's recalc guesses wrong on thin undercut stickers"""
    bm.faces.ensure_lookup_table()
    done = [False] * len(bm.faces)
    for f0 in bm.faces:
        if done[f0.index]:
            continue
        isl, stack = [], [f0]
        done[f0.index] = True
        while stack:
            f = stack.pop()
            isl.append(f)
            for e in f.edges:
                for g in e.link_faces:
                    if not done[g.index]:
                        done[g.index] = True
                        stack.append(g)
        c = sum((v.co for f in isl for v in f.verts), Vector()) / sum(len(f.verts) for f in isl)
        vol = 0.0
        for f in isl:
            a = f.verts[0].co - c
            for i in range(1, len(f.verts) - 1):
                vol += a.dot((f.verts[i].co - c).cross(f.verts[i + 1].co - c))
        if vol < 0:
            bmesh.ops.reverse_faces(bm, faces=isl)

def ccw(poly):
    a = sum(poly[i - 1][0] * poly[i][1] - poly[i][0] * poly[i - 1][1] for i in range(len(poly)))
    return list(poly) if a > 0 else list(reversed(poly))


def off_poly(poly, d):
    """offset a CCW polygon along its vertex normals by d (+ outward), miter limited"""
    m = len(poly)
    out = []
    for i in range(m):
        (x0, y0), (x1, y1), (x2, y2) = poly[i - 1], poly[i], poly[(i + 1) % m]
        a = (y1 - y0, x0 - x1); b = (y2 - y1, x1 - x2)
        la = math.hypot(*a) or 1; lb = math.hypot(*b) or 1
        a = (a[0] / la, a[1] / la); b = (b[0] / lb, b[1] / lb)
        nx, ny = a[0] + b[0], a[1] + b[1]
        l = math.hypot(nx, ny) or 1
        nx, ny = nx / l, ny / l
        c = max(0.55, nx * a[0] + ny * a[1])
        out.append((x1 + nx * d / c, y1 + ny * d / c))
    return out


def pillow(p, poly, to3d, h=0.016, depth=0.03, under='auto', lip=0.005, rings=(0.45, 0.8)):
    """a raised sticker from a star-shaped 2D outline; to3d(x, y, z) maps outline coords + height above the host surface
    to game space (z = 0 on the surface)."""
    poly = ccw([q[:2] for q in poly])
    if under == 'auto':
        under = h * 1.15          # ~50 deg undercut: the ink then starts right at the sticker's edge (no gap)
    m = len(poly)
    cx = sum(x for x, y in poly) / m
    cy = sum(y for x, y in poly) / m
    top = off_poly(poly, -lip)
    R = [([(cx + (x - cx) * s, cy + (y - cy) * s) for x, y in top], h) for s in rings]
    R.append((top, h))
    R.append((poly, h - lip * 0.7))
    if under is not None:
        R.append((off_poly(poly, -under), 0.0))
        R.append((off_poly(poly, -under), -depth))
    else:
        R.append((poly, -depth))
    verts = [to3d(cx, cy, h)]
    for ring, z in R:
        verts += [to3d(x, y, z) for x, y in ring]
    verts.append(to3d(cx, cy, -depth))
    faces = [(0, 1 + i, 1 + (i + 1) % m) for i in range(m)]
    for k in range(len(R) - 1):
        a0, b0 = 1 + k * m, 1 + (k + 1) * m
        for i in range(m):
            j = (i + 1) % m
            faces.append((a0 + i, b0 + i, b0 + j, a0 + j))
    last, c = 1 + (len(R) - 1) * m, len(verts) - 1
    faces += [(c, last + (i + 1) % m, last + i) for i in range(m)]
    p.mesh([tuple(v) for v in verts], faces)


def rrect(w, h, r, n=4):
    """rounded rectangle outline, half sizes w, h, corner radius r"""
    return [q[:2] for q in rounded([(-w, -h), (w, -h), (w, h), (-w, h)], r, n=n, closed=True)]


def fillet_poly(pts, radii, n=5):
    """a polygon with every corner replaced by a true circular arc (radius per corner, or one radius for all)"""
    P = [Vector((x, y, 0)) for x, y in pts]
    m = len(P)
    rs = radii if isinstance(radii, (list, tuple)) else [radii] * m
    out = []
    for i in range(m):
        p0, p1, p2 = P[i - 1], P[i], P[(i + 1) % m]
        a, b = (p0 - p1).normalized(), (p2 - p1).normalized()
        th = a.angle(b) / 2
        t = rs[i] / math.tan(th)
        s_, e_ = p1 + a * t, p1 + b * t
        c = p1 + (a + b).normalized() * (rs[i] / math.sin(th))
        v0, v1 = s_ - c, e_ - c
        ang = math.atan2(v0.x * v1.y - v0.y * v1.x, v0.dot(v1))
        for k in range(n + 1):
            q = Matrix.Rotation(ang * k / n, 3, 'Z') @ v0 + c
            out.append((q.x, q.y))
    return out


ONLY = [s for s in os.environ.get('ONLY', '').split(',') if s]
WHITE, INK = 0xffffff, 0x3a2838
TAU = math.tau
TRUNK, TRUNK_D = 0x9a6a43, 0x7c5232
LEAF, LEAF_D, LEAF_L = 0x58c45e, 0x3f9a3a, 0x7fd66a


def tree():
    p = RawProp('prop_m_tree', base=WHITE, target_faces=5200, voxel=0.03)
    puffs = [((0, 2.75, 0), 1.25), ((-0.95, 2.35, 0.1), 0.85), ((0.95, 2.4, 0.05), 0.88), ((0, 3.55, -0.1), 0.85),
             ((-0.6, 3.25, 0.4), 0.72), ((0.62, 3.3, 0.35), 0.7), ((0.0, 2.2, 0.55), 0.78), ((-0.35, 2.75, 0.8), 0.62), ((0.45, 2.6, 0.78), 0.6)]
    # the front puffs go in a second tinted layer ('tint2'), so each keeps a crisp ink outline over the canopy;
    # plain tint (the toon light does the shading - no painted shadow, so no ragged borders in the creases)
    for i, (c, r) in enumerate(puffs):
        if c[2] > 0.3:
            p.layer('tint2', base=WHITE, target_faces=2600, voxel=0.03)
        p.blob(c, (r, r * 0.92, r * 0.95), group='p%d' % i)
        p.layer('skin')
    # trunk: a clean revolved trunk with a soft root flare tucked under at the ground (so its ink closes at the base),
    # two branch stubs up into the crown, and three long lens-shaped bark stripes
    p.layer('trunk', base=TRUNK).raw()
    prof = [(0, 0), (0.36, 0), (0.43, 0.02), (0.46, 0.06), (0.42, 0.12), (0.34, 0.24), (0.29, 0.45), (0.26, 0.7), (0.24, 0.95),
            (0.23, 1.2), (0.225, 1.45), (0.23, 1.7), (0.24, 2.0), (0.22, 2.3), (0, 2.4)]
    p.lathe(rounded(prof, 0.05, n=2), seg=28)
    for a, b, r0, r1 in (((0.05, 1.5, 0), (0.62, 2.05, 0.15), 0.12, 0.08), ((-0.05, 1.7, 0), (-0.55, 2.15, 0.2), 0.11, 0.07)):
        A, B = Vector(a), Vector(b)
        p.tube([tuple(A.lerp(B, t)) for t in (0, 0.33, 0.66, 1)], [r0, r0 * 0.9 + r1 * 0.1, r0 * 0.5 + r1 * 0.5, r1], rseg=10)
    rad = lambda y: 0.26 if y > 0.6 else 0.3
    stripes = [(-0.45, 0.32, 1.05, 0.05), (0.18, 0.55, 1.4, 0.045), (0.75, 0.25, 0.85, 0.04)]

    def bark(q, n):
        if q.y < 0.2 or q.y > 1.5 or math.hypot(q.x, q.z) > 0.36:
            return False
        a = math.atan2(q.x, q.z)
        for ac, y0, y1, w in stripes:
            if y0 < q.y < y1:
                t = (q.y - y0) / (y1 - y0)
                half = w * math.sin(math.pi * t) ** 0.7 / rad(q.y)
                if abs(a - ac - 0.08 * math.sin(t * 3.0)) < half:
                    return True
        return False
    p.paint_fn(bark, TRUNK_D)
    p.layer('skin')
    p.layer('snow', base=WHITE, target_faces=1800, voxel=0.03)
    for i, (c, r) in enumerate(puffs):
        if c[1] > 2.5:
            p.blob((c[0], c[1] + r * 0.5, c[2]), (r * 0.82, r * 0.42, r * 0.82), group='s%d' % i)
    p.paint_fn(lambda q, n: n.y < 0.2, 0xdde9f6)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 4.0, 0))
    p.extras.update(argMode='tint', argDefault=LEAF, outline=0.035)
    p.build()


def bush():
    p = Prop('prop_m_bush', base=LEAF, target_faces=3200, voxel=0.025)
    puffs = [((-1.05, 0.7, 0), 0.82), ((0, 0.82, 0.05), 0.95), ((1.05, 0.7, 0), 0.82), ((-0.5, 1.35, -0.15), 0.7), ((0.55, 1.38, -0.12), 0.72),
             ((-0.45, 0.55, 0.5), 0.6), ((0.5, 0.55, 0.5), 0.6)]
    for i, (c, r) in enumerate(puffs):
        p.blob(c, (r, r * 0.9, r * 0.85), group='p%d' % i)
    p.paint_fn(lambda q, n: n.y < -0.3, LEAF_D)
    p.paint_fn(lambda q, n: n.y > 0.75 and q.y > 1.6, LEAF_L)
    p.layer('flowers', base=0xffffff, target_faces=700, voxel=0.012)
    fl = [(-1.4, 0.9, 0.55), (-0.2, 1.55, 0.45), (1.25, 1.1, 0.6), (0.65, 0.35, 0.95), (-0.9, 0.3, 0.85)]
    for k, (x, y, z) in enumerate(fl):
        for j in range(5):
            a = j / 5 * TAU
            p.blob((x + 0.08 * math.cos(a), y + 0.08 * math.sin(a), z), (0.065, 0.065, 0.03), group='f%d' % k)
        p.paint(None, (x, y, z + 0.02), (0.045, 0.045, 0.06), 0xffd23f)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 1.9, 0))
    p.extras['outline'] = 0.035
    p.build()


def mound():
    """a strawberry-patch soil mound: flat-bottomed (base on y = 0, a tucked-under foot so its ink closes at the ground),
    a soft raised rim round a darker dug-soil dip, and a little strawberry plant (layer 'leaves') - trefoil leaves on
    short stalks fanning round the back and sides, and one white flower."""
    p = RawProp('prop_m_mound', base=0x8a5a3a).raw()
    SZ = 0.78
    prof = [(0, 0), (0.64, 0), (0.72, 0.02), (0.765, 0.07), (0.74, 0.15), (0.67, 0.24), (0.58, 0.3), (0.48, 0.32), (0.4, 0.3),
            (0.3, 0.265), (0.15, 0.25), (0, 0.25)]
    p.lathe(rounded(prof, 0.04, n=2), scale=(1, SZ), seg=30)
    ell = lambda q: math.hypot(q.x, q.z / SZ)
    p.paint_fn(lambda q, n: ell(q) < 0.62 and q.y > 0.22, 0xa36b45)
    p.paint_fn(lambda q, n: ell(q) < 0.4 and q.y > 0.2, 0x6c4429)
    p.layer('leaves', base=LEAF, target_faces=1700, voxel=0.01)
    root = Vector((0, 0.24, -0.08))
    # a bushy rosette of trefoil strawberry leaves: three round leaflets each (separate soft pieces, so the ink shows
    # the three lobes) on short stalks, round the back and sides, tilted up to face the camera
    for k, (deg, reach, up, sc) in enumerate([(-112, 0.22, 0.13, 0.95), (-62, 0.24, 0.2, 1.0), (-20, 0.2, 0.25, 1.0),
                                              (22, 0.2, 0.24, 1.0), (64, 0.24, 0.19, 1.0), (112, 0.22, 0.12, 0.95), (180, 0.1, 0.22, 0.9)]):
        a = math.radians(deg)
        d = Vector((math.sin(a), 0, -math.cos(a)))
        tip = root + d * reach + Vector((0, up, 0))
        p.capsule(tuple(root), tuple(tip), 0.024, group='st', r2=0.018)
        side = Vector((-d.z, 0, d.x))
        for j, off in enumerate((0.0, -1.0, 1.0)):
            dd = (d * math.cos(off * 0.95) + Vector((0, 0.35, 0)) + side * math.sin(off * 0.95)).normalized()
            s_ = sc * (1.0 if off == 0 else 0.88)
            c = tip + dd * 0.1 * s_
            yaw = math.degrees(math.atan2(dd.x, dd.z))
            p.blob(tuple(c), (0.078 * s_, 0.024, 0.095 * s_), rot=(-30, yaw, 0), group='lf%d_%d' % (k, j))
    # one white strawberry flower with a yellow middle on its own short stalk at the front, facing out
    fc = Vector((0.1, 0.37, 0.13))
    p.capsule(tuple(root), tuple(fc - Vector((0, 0.05, 0.07))), 0.016, group='st')
    for i in range(5):
        a = TAU * i / 5 + 0.3
        p.blob(tuple(fc + Vector((0.052 * math.cos(a), 0.052 * math.sin(a), 0))), (0.044, 0.044, 0.016), group='fl')
    p.blob(tuple(fc + Vector((0, 0, 0.02))), (0.03, 0.03, 0.02), group='fc')
    p.paint_group('st', 0x4f9e3a)
    p.paint_group('fl', 0xffffff)
    p.paint_group('fc', 0xffd23f)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 0.6, 0))
    p.extras['outline'] = 0.026
    p.build()


def sunflower():
    H = 3.0
    p = Prop('prop_m_sunflower', base=0x5a3a1e, target_faces=2600, voxel=0.016)
    # the seed disc (head) facing +z
    p.blob((0, H, 0.05), (0.56, 0.56, 0.2), group='disc')
    p.paint_fn(lambda q, n: (math.hypot(q.x, q.y - H) > 0.45 or n.z < 0.3), 0x7a4a26)
    p.layer('petals', base=0xffd23f, target_faces=2200, voxel=0.014)
    for k in range(14):
        a = k / 14 * TAU
        for t, w in [(0.6, 0.17), (0.82, 0.2), (1.02, 0.12)]:
            p.blob((t * math.cos(a), H + t * math.sin(a), -0.02 - 0.05 * t), (0.17, w, 0.06), rot=(0, 0, math.degrees(a)), group='p%d' % k)
    p.paint_fn(lambda q, n: math.hypot(q.x, q.y - H) < 0.66, 0xffb820)
    p.layer('skin')
    p.layer('stem', base=0x4f9e3a, target_faces=1600, voxel=0.016)
    p.tube([(0, 0, 0), (0.05, 0.8, 0), (-0.04, 1.8, 0), (0, H - 0.2, -0.05)], [0.1, 0.09, 0.085, 0.08], rseg=10)
    for s, y in ((1, 1.1), (-1, 1.8)):
        for t, w in [(0.18, 0.14), (0.38, 0.2), (0.58, 0.14), (0.72, 0.06)]:
            p.blob((s * t, y + t * 0.35, 0.02), (0.13, w * 0.9, 0.04), rot=(-10, 0, s * 25), group='l%d' % s)
    p.paint_fn(lambda q, n: abs(q.x) > 0.1 and abs(q.z - 0.02) < 0.012, 0x3f8a2e)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, H + 0.8, 0))
    p.face((0, H, 0.0), 0.5, bone='body', faceScale=1.0)
    p.extras['outline'] = 0.028
    p.build()


def pumpkin():
    p = Prop('prop_m_pumpkin', base=0xff8a2a, target_faces=3200, voxel=0.018)
    NL = 8
    for i in range(NL):
        a = i / NL * TAU
        p.blob((0.52 * math.sin(a), 0.74, 0.52 * math.cos(a)), (0.48, 0.72, 0.62), rot=(0, math.degrees(a), 0), group='l%d' % i)
    p.blob((0, 0.74, 0), (0.9, 0.7, 0.9), group='core')
    p.paint_fn(lambda q, n: (math.cos(math.atan2(q.x, q.z) * NL + math.pi) > 0.82 and q.y > 0.2) or q.y > 1.36, 0xe0661a)
    p.layer('stem', base=0x6a8a3a, target_faces=900, voxel=0.014)
    p.tube([(0, 1.25, 0), (0.02, 1.5, 0), (0.1, 1.68, 0), (0.22, 1.74, 0)], [0.11, 0.095, 0.085, 0.07], rseg=10)
    # curly vine and a leaf
    pts = [(0.15 + 0.12 * math.cos(t), 1.42 + 0.03 * t, 0.15 + 0.12 * math.sin(t)) for t in [i * 0.5 for i in range(14)]]
    p.tube(pts, 0.025, rseg=6)
    for t, w in [(0.15, 0.16), (0.32, 0.24), (0.5, 0.2), (0.64, 0.08)]:
        p.blob((-0.12 - t * 0.9, 1.42 + t * 0.2, 0.15), (0.16, 0.03, w), rot=(-15, 20, 12), group='leaf')
    p.paint_fn(lambda q, n: q.x < -0.1 and abs(q.z - 0.15) < 0.015, 0x4f7a2a)
    p.layer('skin')
    p.layer('shine', base=0xffd8a8, target_faces=200, voxel=0.01)
    p.blob((-0.42, 1.05, 0.62), (0.07, 0.17, 0.02), rot=(-20, -35, 10), group='sh')
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 1.7, 0))
    p.extras['outline'] = 0.032
    p.build()


def watermelon():
    """an oval watermelon lying on its side: a smooth flattened-bottom shell whose grid follows the wavy stripes, so the
    stripe borders are exact mesh lines (no ragged paint); light-green ends, a little curly stem, one soft shine."""
    p = RawProp('prop_m_watermelon', base=0x45a83f).raw()
    p.layers['skin']['facepaint'] = True
    AX, RY, RZ, CY = 1.25, 0.85, 0.95, 0.85
    NS = 10                                   # stripes round the melon
    wob = lambda x: 0.25 * math.sin(x * 7)
    avals = []
    for k in range(NS):
        avals += [k - 0.18, k, k + 0.18, k + 0.42, k + 0.66]
    vv = [math.pi * i / 40 for i in range(41)]
    x_end = 1.2
    vv += [math.acos(x_end / AX), math.acos(-x_end / AX)]
    vv = sorted(set(round(v, 6) for v in vv))
    def pt(v, a):
        x = AX * math.cos(v)
        th = (a - wob(x)) * TAU / NS
        rho = math.sin(v)
        y = RY * rho * math.sin(th)
        z = RZ * rho * math.cos(th)
        return Vector((x, y, z))
    verts, faces = [], []
    na = len(avals)
    for v in vv:
        for a in avals:
            verts.append(pt(v, a))
    # soft flat spot underneath so it sits level: squash everything below the floor line smoothly up onto it
    k = 0.14
    for q in verts:
        yy = q.y + CY
        q.y = (yy + 0.06 + math.sqrt((yy - 0.06) ** 2 + k * k)) / 2
    ymin = min(q.y for q in verts)
    for q in verts:
        q.y -= ymin
    for i in range(len(vv) - 1):
        for j in range(na):
            j2 = (j + 1) % na
            faces.append((i * na + j, i * na + j2, (i + 1) * na + j2, (i + 1) * na + j))
    p.mesh([tuple(q) for q in verts], faces)

    def stripe(q, n):
        C = 2 * (q.y + ymin) - 0.12              # undo the bottom squash to get back to the grid's own coordinates
        yy = 0.06 + (C * C - k * k) / (2 * C)
        a = math.atan2((yy - CY) / RY, q.z / RZ) / TAU * NS + wob(q.x)
        return abs(a - round(a)) < 0.18
    p.paint_fn(stripe, 0x2b6e2a)
    p.paint_fn(lambda q, n: abs(q.x) > x_end, 0x7cc95c)
    # one soft gloss highlight up on the front-left shoulder (no ink: layers named shine*)
    p.layer('shine', base=0xd8f7c8).raw()
    E = Vector((AX, RY, RZ)); O = Vector((0, CY - ymin + 0.004, 0))
    def on_melon(d, spin):
        d = Vector(d).normalized()
        def surf(pp):
            r = pp - O
            t = 1 / math.sqrt((r.x / E.x) ** 2 + (r.y / E.y) ** 2 + (r.z / E.z) ** 2)
            sp = O + r * t
            nn = Vector(((sp.x - O.x) / E.x ** 2, (sp.y - O.y) / E.y ** 2, (sp.z - O.z) / E.z ** 2)).normalized()
            return sp, nn
        c, nrm = surf(O + Vector((d.x * E.x, d.y * E.y, d.z * E.z)))
        u = Vector((0, 1, 0)).cross(nrm).normalized(); v = nrm.cross(u)
        cs, sn = math.cos(math.radians(spin)), math.sin(math.radians(spin))
        def f(x, y, z):
            x, y = x * cs - y * sn, x * sn + y * cs
            sp, nn = surf(c + u * x + v * y)
            return sp + nn * z
        return f
    pillow(p, rrect(0.05, 0.17, 0.048, n=4), on_melon((-0.42, 0.62, 0.66), -55), h=0.01, depth=0.03, under=None, lip=0.006, rings=(0.5,))
    p.layer('skin')
    p.layer('stem', base=0x6a8a3a).raw()
    p.tube([(1.18, 0.76, 0), (1.3, 0.8, 0), (1.38, 0.9, 0.03), (1.37, 1.0, 0.07)], [0.055, 0.05, 0.045, 0.04], rseg=8)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 1.6, 0))
    p.extras['outline'] = 0.032
    p.build()


def mushroom():
    """a toadstool: a smooth dome cap (TINT) with a crisp lighter underside, raised white spot stickers (inked), and a
    chubby cream stem carrying the game's code face with big matching eyes."""
    p = RawProp('prop_m_mushroom', base=WHITE).raw()
    cap = rounded([(0, 1.0), (1.05, 1.0), (1.12, 1.12), (1.0, 1.45), (0.6, 1.72), (0, 1.8)], 0.12, n=4)
    p.lathe(cap, seg=40)
    p.paint_fn(lambda q, n: q.y < 1.035, 0xe6d2c8)
    # stem: soft, slightly bellied, tucked foot (its ink closes at the ground); a touch darker up under the cap
    p.layer('stem', base=0xfff1d6).raw()
    p.lathe(rounded([(0, 0), (0.44, 0), (0.5, 0.05), (0.49, 0.2), (0.46, 0.55), (0.44, 0.85), (0.45, 1.02), (0, 1.04)], 0.06, n=3), seg=28)
    p.paint_fn(lambda q, n: q.y > 0.93, 0xf2dcb8)
    p.layer('skin')
    # white spots: raised round stickers that follow the dome
    p.layer('spots', base=WHITE).raw()
    top = [q for q in cap if q[1] >= 1.12]

    def r_at(y):
        for (r0, y0), (r1, y1) in zip(top, top[1:]):
            if (y0 - y) * (y1 - y) <= 0 and y0 != y1:
                return r0 + (r1 - r0) * (y - y0) / (y1 - y0)
        return 0.0
    def g(pp):            # > 0 outside the dome
        if pp.y >= 1.8:
            return 1.0
        if pp.y <= 1.12:
            return math.hypot(pp.x, pp.z) - 1.12
        return math.hypot(pp.x, pp.z) - r_at(pp.y)
    def on_dome(a, y, spin=0.0):
        if y >= 1.799:
            c, nrm = Vector((0, 1.8, 0)), Vector((0, 1, 0))
        else:
            r = r_at(y)
            c = Vector((r * math.sin(a), y, r * math.cos(a)))
            dr = (r_at(y - 0.01) - r_at(y + 0.01)) / 0.02
            nrm = Vector((math.sin(a), dr, math.cos(a))).normalized()
        up = Vector((0, 1, 0)) if abs(nrm.y) < 0.95 else Vector((0, 0, -1))
        u = up.cross(nrm).normalized(); v = nrm.cross(u)
        def f(x, yy, z):
            pp = c + u * x + v * yy
            lo, hi = -0.25, 0.25
            for _ in range(30):
                m = (lo + hi) / 2
                if g(pp + nrm * m) > 0:
                    hi = m
                else:
                    lo = m
            return pp + nrm * ((lo + hi) / 2 + z)
        return f
    for k, (a, y, rr) in enumerate([(0, 1.8, 0.2), (0.45, 1.5, 0.16), (-0.55, 1.47, 0.16), (1.55, 1.42, 0.16), (-1.6, 1.4, 0.16),
                                    (2.6, 1.55, 0.16), (-2.5, 1.6, 0.16), (0.95, 1.68, 0.12), (-1.0, 1.7, 0.12)]):
        pillow(p, circle_poly(rr, n=16), on_dome(a, y), h=0.02, rings=(0.5,))
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 1.8, 0))
    p.face((0, 0.55, 0.0), 0.5, bone='body', faceScale=1.0, eyeSize=1.45, eyeX=0.37, eyeY=0.1)
    p.extras.update(argMode='tint', argDefault=0xe8453c, outline=0.03)
    p.build()


def flower():
    p = Prop('prop_m_flower', base=WHITE, target_faces=900, voxel=0.008)
    for k in range(5):
        a = k / 5 * TAU + math.pi / 2
        p.blob((0.13 * math.cos(a), 0.55 + 0.13 * math.sin(a), 0.0), (0.1, 0.1, 0.035), group='p%d' % k)
    p.paint_fn(lambda q, n: math.hypot(q.x, q.y - 0.55) < 0.07, 0xe0e0e0)
    p.layer('centre', base=0xffd23f, target_faces=200, voxel=0.007)
    p.blob((0, 0.55, 0.03), (0.07, 0.07, 0.045), group='c')
    p.layer('skin')
    p.layer('stem', base=0x4fae45, target_faces=400, voxel=0.008)
    p.tube([(0, 0, 0), (0.02, 0.25, 0), (0, 0.5, -0.02)], 0.025, rseg=6)
    for t, w in [(0.06, 0.04), (0.13, 0.055), (0.2, 0.03)]:
        p.blob((t, 0.18 + t * 0.3, 0), (0.05, 0.02, w), rot=(-20, 0, 25), group='lf')
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 0.7, 0))
    p.extras.update(argMode='tint', argDefault=0xff8fc0, outline=0.016)
    p.build()


MODELS = dict(prop_m_tree=tree, prop_m_bush=bush, prop_m_mound=mound, prop_m_sunflower=sunflower, prop_m_pumpkin=pumpkin,
              prop_m_watermelon=watermelon, prop_m_mushroom=mushroom, prop_m_flower=flower)
for name, fn in MODELS.items():
    if not ONLY or name in ONLY:
        fn()
