"""Treats and small things for the meadow games (Apple count, Feelings, Shape house goodies, Big and small scatter).
Models: prop_m_cupcake, prop_m_donut, prop_m_sweet, prop_m_ladybug, prop_m_worm, prop_m_plate, prop_m_balloon, prop_m_acorn, prop_m_leaf,
prop_m_snowball, prop_m_petal, prop_m_drop, prop_m_coin, prop_m_gem.   ONLY=prop_m_donut tools/blender/build.sh prop_meadow_treats
Centred on the origin (things the game simulates as balls) unless noted. Tintable ones: sweet, balloon, leaf, gem
(argMode 'tint'). Layers named shine* are gloss stickers (the game hides their ink outline)."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded, circle_poly, star_poly

ONLY = [s for s in os.environ.get('ONLY', '').split(',') if s]
WHITE, INK = 0xffffff, 0x3a2838
TAU = math.tau


# ---------- crisp hard-surface helpers (same ideas as prop_meadow_toys.py / prop_meadow_shapes.py) ----------
# CProp: a layer marked raw() is joined exactly as modelled (no voxel remesh / decimate / smoothing), so analytic lathes,
# sweeps and stickers keep perfectly clean silhouettes; facepaint() colours it face by face from each face's centre (for
# layers whose colour borders already lie on mesh edges: lathe rings, grid lines), else lib's crisp paint cuts the
# borders in. pillow() builds a sticker from a 2D outline with an UNDERCUT side wall (it leans back under the top), so
# the game's inverted-hull ink draws a closed line all round it. lens() is a free-standing double-sided leaf / flap.
import bpy, bmesh
from mathutils import Vector, Matrix


class CProp(Prop):
    def raw(self, out_from=None):
        """out_from: a game-space point; open patches in this layer (printed spots, eyes) are turned to face away from it"""
        self.layers[self._cur]['raw'] = True
        self.layers[self._cur]['out_from'] = out_from
        return self

    def facepaint(self):
        self.layers[self._cur]['facepaint'] = True
        return self

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
        bm = bmesh.new()
        bm.from_mesh(skin.data)
        bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
        bmesh.ops.triangulate(bm, faces=bm.faces[:], quad_method='BEAUTY', ngon_method='BEAUTY')
        outward(bm)
        if L.get('out_from') is not None:
            from lib import G
            o = G(L['out_from'])
            bm.normal_update()
            bmesh.ops.reverse_faces(bm, faces=[f for f in bm.faces if f.normal.dot(f.calc_center_median() - o) < 0])
        bm.to_mesh(skin.data)
        bm.free()
        for f in skin.data.polygons:
            f.use_smooth = True
        skin.data.update()
        return skin

    def _paint(self, skin):
        if not self.layers[self._cur].get('facepaint'):
            return super()._paint(skin)
        me = skin.data
        inv = Matrix(((1, 0, 0), (0, 0, 1), (0, -1, 0)))
        attr = me.color_attributes.new('Col', 'FLOAT_COLOR', 'CORNER')
        for poly in me.polygons:
            gp, gn = inv @ Vector(poly.center), inv @ Vector(poly.normal)
            col = self.base
            for kind, data, c in self.paints:
                if kind == 'fn' and data(gp, gn):
                    col = c
            for li in poly.loop_indices:
                attr.data[li].color = col
        me.color_attributes.active_color = attr
        mat = bpy.data.materials.new(self.kind + '_' + self._cur)
        mat.use_nodes = True
        nt = mat.node_tree
        vc = nt.nodes.new('ShaderNodeVertexColor')
        vc.layer_name = 'Col'
        nt.links.new(vc.outputs['Color'], nt.nodes.get('Principled BSDF').inputs['Base Color'])
        me.materials.append(mat)


def outward(bm):
    """make every closed island face outward (signed volume > 0)"""
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
        under = h * 1.15
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


def disc(p, poly, to3d, h=0.012, depth=0.02):
    """a cheap flat sticker (top fan, straight wall, bottom fan): for tiny dark details that need no ink"""
    poly = ccw([q[:2] for q in poly])
    m = len(poly)
    cx = sum(x for x, y in poly) / m
    cy = sum(y for x, y in poly) / m
    verts = [to3d(cx, cy, h)] + [to3d(x, y, h) for x, y in poly] + [to3d(x, y, -depth) for x, y in poly] + [to3d(cx, cy, -depth)]
    faces = [(0, 1 + i, 1 + (i + 1) % m) for i in range(m)]
    faces += [(1 + i, 1 + m + i, 1 + m + (i + 1) % m, 1 + (i + 1) % m) for i in range(m)]
    faces += [(2 * m + 1, 1 + m + (i + 1) % m, 1 + m + i) for i in range(m)]
    p.mesh([tuple(v) for v in verts], faces)


def lens(p, poly, to3d, t=0.02, rings=(0.4, 0.75)):
    """a free-standing double-sided lens (leaf, petal, flap) from a 2D outline: thickest (t each side) in the middle,
    a sharp-ish rim; to3d(x, y, z) maps outline coords + offset along the lens normal to game space"""
    poly = ccw([q[:2] for q in poly])
    m = len(poly)
    cx = sum(x for x, y in poly) / m
    cy = sum(y for x, y in poly) / m
    R = [(s, t * (1 - s * s) ** 0.6 + 0.0015) for s in rings]
    verts = [to3d(cx, cy, t)]
    for s, z in R:
        verts += [to3d(cx + (x - cx) * s, cy + (y - cy) * s, z) for x, y in poly]
    verts += [to3d(x, y, 0) for x, y in poly]
    for s, z in reversed(R):
        verts += [to3d(cx + (x - cx) * s, cy + (y - cy) * s, -z) for x, y in poly]
    verts.append(to3d(cx, cy, -t))
    nr = 2 * len(R) + 1
    faces = [(0, 1 + i, 1 + (i + 1) % m) for i in range(m)]
    for k in range(nr - 1):
        a0, b0 = 1 + k * m, 1 + (k + 1) * m
        for i in range(m):
            j = (i + 1) % m
            faces.append((a0 + i, b0 + i, b0 + j, a0 + j))
    last, c = 1 + (nr - 1) * m, len(verts) - 1
    faces += [(c, last + (i + 1) % m, last + i) for i in range(m)]
    p.mesh([tuple(v) for v in verts], faces)


def frame(o, u, n):
    """to3d for a flat local frame: origin o, in-plane axis u (x), normal n (z); y = n x u"""
    o, n = Vector(o), Vector(n).normalized()
    u = (Vector(u) - n * Vector(u).dot(n)).normalized()
    v = n.cross(u)
    return lambda x, y, z: o + u * x + v * y + n * z


def on_ball(R, d, spin=0.0, c=(0, 0, 0)):
    """to3d for a sticker on a sphere of radius R (centre c) centred in direction d, turned by spin (deg)"""
    d = Vector(d).normalized(); c = Vector(c)
    up = Vector((0, 1, 0)) if abs(d.y) < 0.95 else Vector((1, 0, 0))
    u = up.cross(d).normalized()
    v = d.cross(u)
    cs, sn = math.cos(math.radians(spin)), math.sin(math.radians(spin))
    def f(x, y, z):
        x, y = x * cs - y * sn, x * sn + y * cs
        r = math.hypot(x, y)
        if r < 1e-9:
            return c + d * (R + z)
        a = r / R
        return c + (d * math.cos(a) + (u * x + v * y) / r * math.sin(a)) * (R + z)
    return f


def on_plane(o, n, up=(0, 1, 0), spin=0.0):
    """to3d for a sticker on a flat face through o with outward normal n"""
    n = Vector(n).normalized(); o = Vector(o)
    upv = Vector(up)
    if abs(upv.dot(n)) > 0.95:
        upv = Vector((0, 0, -1)) if abs(n.y) > 0.95 else Vector((0, 1, 0))
    u = upv.cross(n).normalized()
    v = n.cross(u)
    cs, sn = math.cos(math.radians(spin)), math.sin(math.radians(spin))
    return lambda x, y, z: o + u * (x * cs - y * sn) + v * (x * sn + y * cs) + n * z


def rrect(w, h, r, n=4):
    """rounded rectangle outline, half sizes w, h, corner radius r"""
    return [q[:2] for q in rounded([(-w, -h), (w, -h), (w, h), (-w, h)], r, n=n, closed=True)]


def spun(poly, deg):
    c, s = math.cos(math.radians(deg)), math.sin(math.radians(deg))
    return [(x * c - y * s, x * s + y * c) for x, y in poly]


def leaf_poly(L, W, n=7, tip=1.6):
    """a pointed leaf outline from its base (0, 0) to its tip (0, L), half width W"""
    right = []
    for i in range(1, n):
        t = i / n
        right.append((W * math.sin(math.pi * t ** 0.85) ** 0.9 * (1 - t) ** (0.15 * tip), L * t))
    return [(0, 0)] + right + [(0, L)] + [(-x, y) for x, y in reversed(right)]
# ---------- end of helpers ----------



def sphere_prof(R, n=24):
    return [(R * math.sin(math.pi * i / n), -R * math.cos(math.pi * i / n)) for i in range(n + 1)]


def on_sphere(p, R, d, size, group, lift=0.0, c=(0, 0, 0)):
    l = math.sqrt(sum(x * x for x in d)); d = [x / l for x in d]
    pitch = -math.degrees(math.asin(max(-1, min(1, d[1]))))
    yaw = math.degrees(math.atan2(d[0], d[2]))
    p.blob(tuple(c[i] + d[i] * (R + lift) for i in range(3)), size, rot=(pitch, yaw, 0), group=group)


def done(p, h, outline=0.02, tint=None):
    if not any(b[0] == 'body' for b in p.bones):
        p.bone('body', (0, -h, 0), (0, h, 0))
    if tint is not None:
        p.extras['argMode'] = 'tint'
        p.extras['argDefault'] = tint
    p.extras['outline'] = outline
    p.build()


def cupcake():
    CUP, FROST, CHERRY = 0x6ec6ff, 0xffb3d1, 0xe8143a
    p = Prop('prop_m_cupcake', base=FROST, target_faces=1800, voxel=0.011)
    # pleated paper cup: bottom at y -0.44, top at -0.02
    prof = []
    for i in range(13):
        y = -0.44 + 0.42 * i / 12
        prof.append((0.3 + 0.1 * i / 12, y))
    p.lathe([(0, -0.44)] + prof + [(0.38, -0.02), (0, -0.02)], seg=40)
    # frosting: a swirl of three soft tiers and a peak
    for k, (y, r, h) in enumerate([(0.03, 0.45, 0.13), (0.17, 0.36, 0.12), (0.3, 0.24, 0.11), (0.4, 0.11, 0.09)]):
        p.blob((0, y, 0), (r, h, r), group='fr')
    pleat = lambda q, n: q.y < -0.02
    p.paint_fn(pleat, CUP)
    p.paint_fn(lambda q, n: q.y < -0.04 and q.y > -0.42 and abs(((math.atan2(q.x, q.z) + 4) * 18 / TAU) % 1 - 0.5) < 0.12, 0x52b4f0)
    p.layer('cherry', base=CHERRY, target_faces=300, voxel=0.008)
    p.blob((0, 0.53, 0), (0.1, 0.1, 0.1), group='c')
    p.tube([(0, 0.6, 0), (0.03, 0.68, 0), (0.08, 0.73, 0)], 0.016, rseg=6)
    p.paint_fn(lambda q, n: q.y > 0.6, 0x6a8a3a)
    p.layer('skin')
    p.layer('sprinkles', base=0xffd23f, target_faces=600, voxel=0.006)
    cols = [0xffd23f, 0x4a90ff, 0xffffff, 0x5fd068, 0xa77bff]
    spr = []
    for i in range(14):
        a = i * 2.39996
        y = 0.04 + (i % 3) * 0.12
        r = [0.44, 0.35, 0.23][i % 3]
        x, z = r * math.sin(a), r * math.cos(a)
        p.blob((x * 1.04, y + 0.1, z * 1.04), (0.045, 0.018, 0.018), rot=(0, math.degrees(a) + 40 * i, 20), group='s%d' % i)
        spr.append(((x * 1.04, y + 0.1, z * 1.04), cols[i % len(cols)]))
    for (c, col) in spr:
        p.paint(None, c, (0.05, 0.05, 0.05), col)
    p.layer('skin')
    # a birthday candle (shown in Feelings only)
    p.layer('candle', base=0xffd23f, target_faces=300, voxel=0.008)
    p.cyl((0.0, 0.38, 0.0), 0.045, 0.36, bevel=0.015, seg=12)
    p.tube([(0, 0.74, 0), (0, 0.8, 0)], 0.01, rseg=5)
    p.paint_fn(lambda q, n: int((q.y - 0.38) / 0.06) % 2 == 0 and q.y < 0.74, 0xff8fc0)
    p.paint_fn(lambda q, n: q.y > 0.74, INK)
    p.layer('skin')
    p.bone('body', (0, -0.44, 0), (0, 0.5, 0))
    p.anchor('wick', (0, 0.84, 0))
    done(p, 0.45, 0.022)


def donut():
    DOUGH, ICE = 0xe0a45e, 0xff7ab8
    p = Prop('prop_m_donut', base=DOUGH, target_faces=1600, voxel=0.011)
    p.ring((0, 0, 0), 0.31, 0.19, rot=(90, 0, 0), seg=40, rseg=16)
    p.paint_fn(lambda q, n: abs(math.hypot(q.x, q.y) - 0.31) > 0.16, 0xc98a4a)
    # icing on the front: a wavy dripping edge
    p.layer('icing', base=ICE, target_faces=1400, voxel=0.009)
    # icing: the same ring pushed forward (its back hides inside the dough) plus drips over the outer edge
    p.ring((0, 0, 0.045), 0.31, 0.175, rot=(90, 0, 0), seg=48, rseg=16)
    for i in range(9):
        a = i / 9 * TAU + 0.4
        l = 0.05 + 0.05 * (i % 3 == 0)
        p.capsule((0.47 * math.cos(a), 0.47 * math.sin(a), 0.1), (0.5 * math.cos(a), 0.5 * math.sin(a) - l, 0.08), 0.045, group='d%d' % i, r2=0.05)
    p.layer('skin')
    p.layer('sprinkles', base=0xffd23f, target_faces=700, voxel=0.006)
    cols = [0xffd23f, 0x4a90ff, 0xffffff, 0x5fd068, 0xa77bff]
    for i in range(16):
        a = i / 16 * TAU + 0.2
        rr = 0.31 + 0.08 * math.sin(i * 2.7)
        c = (rr * math.cos(a), rr * math.sin(a), 0.215 - 0.03 * abs(math.sin(i * 2.7)))
        p.blob(c, (0.048, 0.018, 0.018), rot=(0, 0, math.degrees(a * 3 + i)), group='s%d' % i)
        p.paint(None, c, (0.06, 0.06, 0.06), cols[i % len(cols)])
    p.layer('skin')
    done(p, 0.5, 0.022)


def sweet():
    p = Prop('prop_m_sweet', base=WHITE, target_faces=2600, voxel=0.008)
    p.blob((0, 0, 0), (0.33, 0.3, 0.3), group='b')
    for s in (-1, 1):
        # a clean twisted neck and a soft pleated fan (three broad pleats)
        p.blob((s * 0.34, 0, 0), (0.07, 0.075, 0.075), group='b')
        for k in range(3):
            a = math.radians(-32 + 32 * k)
            p.blob((s * (0.47 + 0.03 * math.cos(a)), 0.16 * math.sin(a) * 1.3, 0), (0.1, 0.06, 0.085), rot=(0, 0, s * math.degrees(a)), group='f%d%d' % (s, k))
    p.paint_fn(lambda q, n: abs(q.x) > 0.37, 0xeeeeee)
    p.layer('stripes', base=WHITE, target_faces=1000, voxel=0.006)
    for k in (-0.5, 0.5):                                  # two bold diagonal stripes, set into the wrapper
        pts, rad = [], []
        for i in range(16):
            t = -1 + 2 * i / 15
            y = t * 0.27
            x = k * 0.2 + y * 0.45
            z = math.sqrt(max(0.0, 1 - (x / 0.335) ** 2 - (y / 0.305) ** 2)) * 0.305 - 0.01
            pts.append((x, y, z))
            rad.append(0.012 + 0.036 * math.sqrt(max(0.0, 1 - t * t)))
        p.tube(pts, rad, rseg=10)
    p.layer('skin')
    p.layer('shine', base=WHITE, target_faces=120, voxel=0.006)
    p.blob((-0.15, 0.17, 0.22), (0.05, 0.025, 0.01), rot=(-30, -30, 30), group='sh')
    p.layer('skin')
    done(p, 0.35, 0.02, tint=0x9b5de5)


def prof_seg(prof, q):
    """index of the lathe profile segment nearest a game-space point (for painting whole lathe bands)"""
    r, y = math.hypot(q.x, q.z), q.y
    best, bi = 1e9, 0
    for i, ((r0, y0), (r1, y1)) in enumerate(zip(prof, prof[1:])):
        dx, dy = r1 - r0, y1 - y0
        t = max(0.0, min(1.0, ((r - r0) * dx + (y - y0) * dy) / (dx * dx + dy * dy + 1e-12)))
        d = math.hypot(r - r0 - dx * t, y - y0 - dy * t)
        if d < best:
            best, bi = d, i
    return bi


def fan(p, poly_rings, to3d, lift=0.003):
    """an open, flat-lying printed patch (no ink): a centre point and rings of 2D outline points mapped onto a
    host surface by to3d(x, y, z) and lifted just off it. poly_rings: [ring0, ring1, ...] from the inside out."""
    m = len(poly_rings[0])
    verts = [to3d(0, 0, lift)] + [to3d(x, y, lift) for ring in poly_rings for x, y in ring]
    faces = [(0, 1 + i, 1 + (i + 1) % m) for i in range(m)]
    for k in range(len(poly_rings) - 1):
        a0, b0 = 1 + k * m, 1 + (k + 1) * m
        faces += [(a0 + i, b0 + i, b0 + (i + 1) % m, a0 + (i + 1) % m) for i in range(m)]
    p.mesh([tuple(v) for v in verts], faces)


def ladybug():
    # tiny (~600 triangles): a glossy red dome split down the middle by a crisp dark seam (a mesh column), a dark
    # rim round the bottom, six round printed spots, a gloss highlight, and a round black head with big white eyes
    RED, DARK = 0xff3b3b, 0x2a2030
    C = Vector((0, -0.012, -0.015)); rx, ry, rz = 0.198, 0.138, 0.205
    S = lambda th, ph: C + Vector((rx * math.sin(th) * math.cos(ph), ry * math.cos(th) * math.cos(ph), rz * math.sin(ph)))
    def on_shell(th0, ph0):
        dth = (S(th0 + 1e-3, ph0) - S(th0 - 1e-3, ph0)).length / 2e-3
        dph = (S(th0, ph0 + 1e-3) - S(th0, ph0 - 1e-3)).length / 2e-3
        def f(x, y, z):
            th, ph = th0 + x / dth, ph0 + y / dph
            q = S(th, ph)
            n = Vector(((q.x - C.x) / rx ** 2, (q.y - C.y) / ry ** 2, (q.z - C.z) / rz ** 2)).normalized()
            return q + n * z
        return f
    p = CProp('prop_m_ladybug', base=RED).raw().facepaint()
    THS, THR = 0.065, 2.07
    side = [THS, 0.4, 0.75, 1.08, 1.38, 1.64, 1.86, THR, 2.32]
    TH = [-t for t in reversed(side)] + side
    PH = [-math.pi / 2 + math.pi * i / 10 for i in range(11)]
    nT = len(TH)
    verts = [S(th, ph) for ph in PH for th in TH]
    faces = [(i * nT + j, i * nT + j + 1, (i + 1) * nT + j + 1, (i + 1) * nT + j) for i in range(10) for j in range(nT - 1)]
    c = len(verts)
    verts.append(C + Vector((0, ry * math.cos(2.32) - 0.012, 0)))
    rim = [i * nT + nT - 1 for i in range(11)] + [i * nT for i in reversed(range(11))]
    faces += [(c, rim[k + 1], rim[k]) for k in range(len(rim) - 1)]
    p.mesh([tuple(v) for v in verts], faces)
    th_of = lambda q: math.atan2((q.x - C.x) / rx, (q.y - C.y) / ry)
    p.paint_fn(lambda q, n: abs(th_of(q)) < THS or abs(th_of(q)) > THR or n.y < -0.6, DARK)
    # round black spots (open printed patches lying on the shell: no ink, perfectly round)
    p.layer('spots', base=DARK).raw(out_from=tuple(C))
    for s in (-1, 1):
        for th, ph, r in ((0.5, 0.42, 0.042), (1.02, -0.12, 0.04), (0.48, -0.66, 0.036)):
            fan(p, [circle_poly(r, n=12)], on_shell(s * th, ph), lift=0.003)
    p.layer('skin')
    p.layer('shine', base=WHITE).raw(out_from=tuple(C))
    fan(p, [spun(rrect(0.015, 0.036, 0.0145, n=2), 62)], on_shell(-0.78, 0.2), lift=0.004)
    p.layer('skin')
    # the head: a round black dome facing +z (its back hidden in the shell)
    HC, HR = Vector((0, -0.022, 0.19)), 0.09
    p.layer('head', base=DARK).raw()
    prof = [(0, -0.06), (HR * 0.95, -0.06)] + [(HR * math.cos(a), HR * math.sin(a)) for a in [math.radians(t) for t in (0, 32, 62, 90)]]
    prof[-1] = (0, HR)
    p.lathe(prof, pos=tuple(HC), rot=(90, 0, 0), seg=20)
    p.layer('skin')
    # big friendly eyes: white printed discs with dark pupils and a tiny catchlight
    eye = lambda s: on_ball(HR, (s * 0.42, 0.3, 0.86), c=tuple(HC), spin=0)
    p.layer('eyes', base=WHITE).raw(out_from=tuple(HC))
    for s in (-1, 1):
        fan(p, [circle_poly(0.034, n=14, sy=1.12)], eye(s), lift=0.002)
    p.layer('skin')
    p.layer('shine_pupils', base=DARK).raw(out_from=tuple(HC))                   # (named shine*: no ink needed on a dark pupil)
    for s in (-1, 1):
        fan(p, [[(x - s * 0.004, y - 0.007) for x, y in circle_poly(0.021, n=12, sy=1.1)]], eye(s), lift=0.0038)
    p.layer('skin')
    p.layer('shine_eyes', base=WHITE).raw(out_from=tuple(HC))
    for s in (-1, 1):
        fan(p, [[(x + 0.005 - s * 0.003, y + 0.001) for x, y in circle_poly(0.0078, n=8)]], eye(s), lift=0.006)
    p.layer('skin')
    p.bone('body', (0, -0.12, 0), (0, 0.14, 0))
    done(p, 0.12, 0.014)


def worm():
    PINK = 0xff9ec0
    p = Prop('prop_m_worm', base=PINK, target_faces=1600, voxel=0.012)
    # standing up out of the ground (segments stacked), head on top facing +z
    ys = [0.0, 0.26, 0.52, 0.78]
    for i, y in enumerate(ys):
        r = 0.2 - i * 0.015
        p.blob((0, y, 0), (r, 0.16, r), group='s')
    p.blob((0, 1.05, 0.02), (0.25, 0.23, 0.23), group='head')
    p.paint_fn(lambda q, n: any(abs(q.y - (y + 0.13)) < 0.02 for y in ys[:3]), 0xf07aa4)
    p.bone('body', (0, -0.15, 0), (0, 0.13, 0))
    p.bone('w1', (0, 0.13, 0), (0, 0.39, 0), parent='body')
    p.bone('w2', (0, 0.39, 0), (0, 0.65, 0), parent='w1')
    p.bone('w3', (0, 0.65, 0), (0, 0.85, 0), parent='w2')
    p.bone('head', (0, 0.85, 0), (0, 1.3, 0), parent='w3')
    p.face((0, 1.05, 0.0), 0.23, bone='head', faceScale=1.0)
    p.extras['outline'] = 0.024
    p.build()


def plate():
    # a china plate with a real raised rim: flat well (items rest on y 0.045, as before), a sloping rim rising to a
    # rolled lip (top y 0.135), a pink band round the rim and a foot ring underneath. 1.28 across, base on y 0.
    p = CProp('prop_m_plate', base=WHITE).raw().facepaint()
    prof = [(0, 0.045), (0.2, 0.045), (0.36, 0.045), (0.4, 0.047), (0.43, 0.056), (0.47, 0.075), (0.52, 0.098), (0.565, 0.115),
            (0.6, 0.127), (0.625, 0.134), (0.638, 0.128), (0.64, 0.116), (0.632, 0.1), (0.6, 0.082), (0.5, 0.045), (0.44, 0.022),
            (0.42, 0.003), (0.4, 0.0), (0.36, 0.003), (0.34, 0.014), (0.2, 0.016), (0, 0.016)]
    p.lathe(prof, seg=44)
    # colour whole lathe bands (by profile segment), so every border is a perfectly round ring
    p.paint_fn(lambda q, n: 6 <= prof_seg(prof, q) <= 8, 0xffb3d1)
    p.paint_fn(lambda q, n: prof_seg(prof, q) >= 12, 0xe8e4ee)
    p.bone('body', (0, 0, 0), (0, 0.13, 0))
    p.extras['outline'] = 0.018
    p.build()


def balloon():
    p = Prop('prop_m_balloon', base=WHITE, target_faces=1300, voxel=0.012)
    prof = []
    for i in range(29):
        t = math.pi * i / 28
        r = 0.5 * math.sin(t) * (1 + 0.1 * math.cos(t))
        y = -0.58 * math.cos(t) + 0.04 * math.sin(t) ** 2
        prof.append((r, y))
    prof[0] = (0, prof[0][1]); prof[-1] = (0, prof[-1][1])
    p.lathe(prof, seg=40)
    p.lathe(rounded([(0, -0.7), (0.09, -0.71), (0.04, -0.6), (0.06, -0.56), (0, -0.55)], 0.02, n=2), seg=16)
    p.paint_fn(lambda q, n: q.y < -0.57, 0xdadada)
    p.layer('string', base=0xf4efe6, target_faces=300, voxel=0.006)
    pts = [(0.03 * math.sin(i * 0.9), -0.7 - i * 0.075, 0.02 * math.cos(i * 0.7)) for i in range(11)]
    p.tube(pts, 0.014, rseg=5)
    p.layer('skin')
    p.layer('shine', base=WHITE, target_faces=200, voxel=0.006)
    p.blob((-0.22, 0.26, 0.4), (0.06, 0.12, 0.015), rot=(-30, -30, 25), group='sh')
    p.blob((-0.3, 0.02, 0.4), (0.025, 0.035, 0.012), rot=(-10, -40, 0), group='sh2')
    p.layer('skin')
    p.bone('body', (0, -0.7, 0), (0, 0.6, 0))
    done(p, 0.6, 0.024, tint=0x4a90ff)


def acorn():
    p = Prop('prop_m_acorn', base=0xd9954f, target_faces=260, voxel=0.01, smooth=3)
    p.lathe(rounded([(0, -0.27), (0.08, -0.25), (0.17, -0.12), (0.19, 0.04), (0.17, 0.1), (0, 0.1)], 0.05, n=3), seg=20)
    p.layer('cap', base=0x7a5232, target_faces=220, voxel=0.009)
    p.lathe(rounded([(0, 0.03), (0.2, 0.03), (0.225, 0.1), (0.18, 0.17), (0.06, 0.2), (0, 0.2)], 0.04, n=3), seg=20)
    p.tube([(0, 0.18, 0), (0.01, 0.25, 0), (0.04, 0.29, 0)], 0.025, rseg=5)
    p.paint_fn(lambda q, n: (int((q.x + 1) * 22) + int((q.z + 1) * 22) + int((q.y + 1) * 22)) % 2 == 0 and q.y < 0.17, 0x6a4428)
    p.layer('skin')
    p.layer('shine', base=0xffe9c4, target_faces=80, voxel=0.005)
    p.blob((-0.08, -0.06, 0.16), (0.022, 0.05, 0.01), rot=(0, -30, 10), group='sh')
    p.layer('skin')
    done(p, 0.27, 0.016)


def leaf():
    p = Prop('prop_m_leaf', base=WHITE, target_faces=500, voxel=0.009, smooth=2)
    # a flat pointed leaf lying in the xz plane (tip toward +x), soft midrib and veins
    for t, w in [(0.0, 0.06), (0.08, 0.1), (0.17, 0.115), (0.26, 0.1), (0.34, 0.07), (0.41, 0.035)]:
        p.blob((t, 0, 0), (0.07, 0.025, w), group='l')
    vein = lambda q, n: abs(q.z) < 0.01 and q.x > -0.03 and q.x < 0.42 or any(abs(q.z - s * (q.x - x0) * 0.9) < 0.009 and 0 < s * q.z < 0.08 and q.x > x0 for s in (-1, 1) for x0 in (0.04, 0.14, 0.24))
    p.paint_fn(vein, 0xd4d4d4)
    p.layer('stem', base=0x7a5232, target_faces=80, voxel=0.006)
    p.tube([(-0.02, 0, 0), (-0.14, 0.01, 0.02)], 0.018, rseg=5)
    p.layer('skin')
    p.bone('body', (-0.1, 0, 0), (0.4, 0, 0))
    done(p, 0.1, 0.014, tint=0xffa040)


def snowball():
    # a clean round snowball, gently hand-packed (soft low lumps, no ragged outline): white on top shading to two crisp
    # pale-blue bands underneath, so its form reads on white snow
    R = 0.21
    p = CProp('prop_m_snowball', base=WHITE).raw().facepaint()
    NL, NA = 14, 20
    lump = lambda th, ph: 1 + 0.02 * math.sin(3 * ph + 0.7) * math.sin(2 * th + 0.4) + 0.015 * math.cos(2 * ph - 1.1) * math.sin(th) ** 2
    verts, faces = [], []
    for i in range(NL + 1):
        th = math.pi * i / NL
        for j in range(NA):
            ph = math.tau * j / NA
            r = R * lump(th, ph)
            verts.append((r * math.sin(th) * math.sin(ph), r * math.cos(th), r * math.sin(th) * math.cos(ph)))
    for i in range(NL):
        for j in range(NA):
            j2 = (j + 1) % NA
            faces.append((i * NA + j, (i + 1) * NA + j, (i + 1) * NA + j2, i * NA + j2))
    p.mesh(verts, faces)
    row = lambda q: int(math.acos(max(-1.0, min(1.0, q.y / q.length))) / (math.pi / NL))     # the latitude row of a face
    p.paint_fn(lambda q, n: row(q) >= 8, 0xd2e3f7)
    p.paint_fn(lambda q, n: row(q) >= 11, 0xa9c6ea)
    done(p, 0.22, 0.016)


def petal():
    p = Prop('prop_m_petal', base=0xff8fc0, target_faces=900, voxel=0.005, smooth=3)
    p.quadriflow = False
    # a smooth teardrop petal lying flat (narrow base at -x, round end at +x), gently cupped, with a centre crease
    for k in range(9):
        t = k / 8
        x = -0.15 + 0.29 * t
        w = 0.025 + 0.085 * math.sin(math.pi * min(1.0, 0.12 + t * 0.78)) ** 0.9
        p.blob((x, 0.012 * t * t, 0), (0.05, 0.026, w), group='p')
    p.blob((0, -0.03, 0), (0.25, 0.02, 0.2), group='p', negative=True)          # cupped: a shallow dish underneath
    p.paint_fn(lambda q, n: q.x < -0.09, 0xffc2dc)
    p.paint_fn(lambda q, n: abs(q.z) < 0.009 and -0.1 < q.x < 0.09 and n.y > 0.5, 0xf27aae)          # centre crease
    done(p, 0.05, 0.01)


def drop():
    p = Prop('prop_m_drop', base=0x7fd0ff, target_faces=260, voxel=0.006, smooth=2)
    p.lathe(rounded([(0, -0.1), (0.07, -0.08), (0.09, -0.02), (0.05, 0.07), (0.0, 0.14)], 0.03, n=3), seg=16)
    p.layer('shine', base=WHITE, target_faces=60, voxel=0.004)
    p.blob((-0.03, -0.02, 0.07), (0.014, 0.028, 0.006), group='sh')
    p.layer('skin')
    done(p, 0.12, 0.01)


def coin():
    GOLD, GOLD_D = 0xffc93b, 0xe0a020
    p = Prop('prop_m_coin', base=GOLD, target_faces=900, voxel=0.006, smooth=2)
    p.lathe(rounded([(0, -0.035), (0.18, -0.035), (0.19, 0.0), (0.18, 0.035), (0, 0.035)], 0.015, n=3), rot=(90, 0, 0), seg=48)
    p.paint_fn(lambda q, n: math.hypot(q.x, q.y) > 0.17 or abs(n.z) < 0.5, GOLD_D)
    # a crisp raised star on both faces, its own layer (clean edge, finely meshed so the points stay sharp and smooth)
    p.layer('star', base=0xfff2a6, target_faces=1400, voxel=0.0025)
    poly = star_poly(0.115, inner=0.5, soft=4)
    for zz in (1, -1):
        verts = [(0, 0, zz * 0.025)] + [(x, y, zz * 0.025) for x, y in poly] + [(0, 0, zz * 0.05)] + [(x, y, zz * 0.05) for x, y in poly]
        m = len(poly)
        faces = []
        k = m + 1
        for i in range(m):
            j = (i + 1) % m
            faces.append((0, 1 + j, 1 + i)); faces.append((k, k + 1 + i, k + 1 + j)); faces.append((1 + i, 1 + j, k + 1 + j, k + 1 + i))
        p.mesh(verts, faces)
    p.layer('skin')
    done(p, 0.19, 0.012)


def gem():
    p = Prop('prop_m_gem', base=WHITE, target_faces=300, voxel=0.007, smooth=1)
    # a chunky cut jewel: crown on top, pavilion below
    prof = [(0, -0.2), (0.21, 0.0), (0.21, 0.03), (0.13, 0.12), (0, 0.12)]
    p.lathe(prof, seg=8)
    p.paint_fn(lambda q, n: n.y > 0.85, 0xf2f2f2)
    p.paint_fn(lambda q, n: n.y < 0 and int((math.atan2(q.x, q.z) + 4) / (TAU / 8)) % 2 == 0, 0xc4c4c4)
    p.paint_fn(lambda q, n: n.y > 0 and n.y < 0.85 and int((math.atan2(q.x, q.z) + 4) / (TAU / 8)) % 2 == 1, 0xdadada)
    p.layer('shine', base=WHITE, target_faces=80, voxel=0.004)
    p.blob((-0.05, 0.12, 0.03), (0.04, 0.008, 0.02), group='sh')
    p.layer('skin')
    done(p, 0.2, 0.014, tint=0x9b6bd9)


MODELS = dict(prop_m_cupcake=cupcake, prop_m_donut=donut, prop_m_sweet=sweet, prop_m_ladybug=ladybug, prop_m_worm=worm, prop_m_plate=plate,
              prop_m_balloon=balloon, prop_m_acorn=acorn, prop_m_leaf=leaf, prop_m_snowball=snowball, prop_m_petal=petal, prop_m_drop=drop,
              prop_m_coin=coin, prop_m_gem=gem)
for name, fn in MODELS.items():
    if not ONLY or name in ONLY:
        fn()
