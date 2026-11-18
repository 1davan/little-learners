"""Story props for the meadow games (Feelings stories, Big and small presents / toy box, Apple count tables).
  prop_m_giftbox   present box 1.0 x 0.8 x 1.0, origin at the base. TINT = paper; layer 'ribbon' (white, the game
                   recolours it).
  prop_m_giftlid   its lid 1.12 x 0.22 x 1.12 centred on the origin, with a big bow; TINT = paper, layer 'ribbon'.
  prop_m_cone      waffle cone, tip at y 0, rim at y 1.0 (radius 0.33).
  prop_m_scoop     ice-cream scoop (radius ~0.4, centred), TINT = flavour; cherry layer.
  prop_m_cup       picnic cup 0.6 tall centred, TINT; white rim and dots.
  prop_m_bolt      flat lightning bolt, top at y 0 (hangs down to -2.1).
  prop_m_jackbox   jack-in-the-box box 1.0 cube on y 0, crank on bone 'crank' (spins about its own axis, rotation.y).
  prop_m_jacklid   its lid, hinged at the origin (back edge), reaching +z 1.05.
  prop_m_jack      the clown on a spring (spring from y 0, head at ~1.2) with a code face.
  prop_m_spider    a round fuzzy spider (radius ~0.42) with a code face.
  prop_m_dirt      a dirt mound ring (mole hole), radius ~0.65.
  prop_m_mole      the mole (pops up out of the hole), body base at y -0.1, code face.
  prop_m_butterfly wings on bones wing.L / wing.R (rotation.z flaps), TINT = upper wings, lying flat, head +z.
  prop_m_bee       a round bee facing +z with a code face, wings on bones wing.L / wing.R (rotation.z flaps).
  prop_m_toybox    red toy box 2.2 x 1.4 x 1.4 with a yellow lid propped open.
  prop_m_blanket   checked picnic blanket 9.4 x 2.4 (flat, on y 0).
  prop_m_tray      baking tray 8.6 x 2.1 with a lip, and an oven mitt.
  prop_m_table     oval party table (top at y 2.43, 7.8 x 3.5) with a pink cloth and bunting.
ONLY=prop_m_cup tools/blender/build.sh prop_meadow_story"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded, circle_poly, star_poly, rot_m

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
    def raw(self, up=False):
        """up=True: open patches in this layer (printed stitches...) are turned to face up"""
        self.layers[self._cur]['raw'] = True
        self.layers[self._cur]['up'] = up
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
        if L.get('up'):
            bm.normal_update()
            bmesh.ops.reverse_faces(bm, faces=[f for f in bm.faces if f.normal.z < 0])
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


def rr_loop(hw, hh, rc, ncorner=6, nside=(4, 4)):
    """a closed rounded-rectangle loop in 2D (a, b), half sizes hw x hh, corner radius rc, as [(point, outward normal)]
    counter-clockwise from the middle of the right side; straight sides get nside extra samples (plus ones hugging
    each corner so the flats keep flat normals)"""
    out = []
    corners = [(hw - rc, hh - rc, 0), (-hw + rc, hh - rc, 90), (-hw + rc, -hh + rc, 180), (hw - rc, -hh + rc, 270)]
    for k, (cx, cy, a0) in enumerate(corners):
        # the straight side leading into this corner
        px, py, pa = corners[k - 1]
        if k == 0:
            s0, s1 = (hw, -hh + rc), (hw, hh - rc)
        elif k == 1:
            s0, s1 = (hw - rc, hh), (-hw + rc, hh)
        elif k == 2:
            s0, s1 = (-hw, hh - rc), (-hw, -hh + rc)
        else:
            s0, s1 = (-hw + rc, -hh), (hw - rc, -hh)
        nrm = [(1, 0), (0, 1), (-1, 0), (0, -1)][k]
        n = nside[k % 2]
        L = math.hypot(s1[0] - s0[0], s1[1] - s0[1])
        e = min(0.02, L * 0.1)
        ts = [e / L] + [i / n for i in range(1, n)] + [1 - e / L] if L > 1e-6 else []
        for t in ts:
            out.append(((s0[0] + (s1[0] - s0[0]) * t, s0[1] + (s1[1] - s0[1]) * t), nrm))
        for i in range(ncorner + 1):
            a = math.radians(a0 + 90 * i / ncorner)
            out.append(((cx + rc * math.cos(a), cy + rc * math.sin(a)), (math.cos(a), math.sin(a))))
    # rotate the list so it starts mid right side
    return out


def sweep(p, path, prof, closed=True, caps=True):
    """sweep a closed 2D cross-section prof [(b, n)...] along path [(P, N, B)...] (game-space points, unit outward normal,
    unit cross axis): vertex = P + B * b + N * n"""
    m, k = len(prof), len(path)
    verts = [tuple(Vector(P) + Vector(B) * b + Vector(N) * n) for P, N, B in path for b, n in prof]
    faces = []
    for i in range(k if closed else k - 1):
        i2 = (i + 1) % k
        for j in range(m):
            j2 = (j + 1) % m
            faces.append((i * m + j, i2 * m + j, i2 * m + j2, i * m + j2))
    if not closed and caps:
        for i in (0, k - 1):
            c = len(verts)
            verts.append(tuple(sum((Vector(verts[i * m + j]) for j in range(m)), Vector()) / m))
            faces += [(c, i * m + j, i * m + (j + 1) % m) for j in range(m)]
    p.mesh(verts, faces)


def band_prof(w, t, lip=0.007, under=None, depth=0.03):
    """cross-section of a raised ribbon band (half width w, thickness t) with a rounded lip and an undercut foot, so the
    inverted-hull ink draws both its edges"""
    under = t * 1.15 if under is None else under
    return [(-w + lip, t), (w - lip, t), (w, t - lip * 0.7), (w - under, 0.0), (w - under, -depth),
            (-w + under, -depth), (-w + under, 0.0), (-w, t - lip * 0.7)]
# ---------- end of helpers ----------



def slab(p, poly, z, thick, rot=(0, 0, 0), off=(0, 0, 0)):
    from mathutils import Vector
    M = rot_m(rot)
    m = len(poly)
    verts = []
    for d in (z - thick / 2, z + thick / 2):
        verts.append(tuple(M @ Vector((0, 0, d)) + Vector(off)))
        for x, y in poly:
            verts.append(tuple(M @ Vector((x, y, d)) + Vector(off)))
    faces = []
    k = m + 1
    for i in range(m):
        j = (i + 1) % m
        faces.append((0, 1 + j, 1 + i)); faces.append((k, k + 1 + i, k + 1 + j)); faces.append((1 + i, 1 + j, k + 1 + j, k + 1 + i))
    p.mesh(verts, faces)


def fin(p, h0, h1, outline=0.022, tint=None):
    if not any(b[0] == 'body' for b in p.bones):
        p.bone('body', (0, h0, 0), (0, h1, 0))
    if tint is not None:
        p.extras['argMode'] = 'tint'
        p.extras['argDefault'] = tint
    p.extras['outline'] = outline
    p.build()


GIFT_W = 0.12          # ribbon half width, the same on the box and the lid (both are scaled alike by the games)


def wrap_path(hw, hh, rc, cy, axis, keep=lambda ang: True, ncorner=6):
    """a ribbon path round a rounded box cross-section: hw = half size along the band's travel on the floor (z for an
    x-band, x for a z-band), hh = half height, centre height cy. keep(normal angle in degrees, 0 = front / side,
    90 = up) picks the part of the loop the ribbon covers. Returns [(P, N, B)] ready for sweep()."""
    L = rr_loop(hw, hh, rc, ncorner=ncorner, nside=(3, 5))
    ang = lambda n: math.degrees(math.atan2(n[1], n[0])) % 360
    mask = [keep(ang(n)) for _, n in L]
    if not all(mask):
        k = next(i for i in range(len(L)) if mask[i] and not mask[i - 1])
        L, mask = L[k:] + L[:k], mask[k:] + mask[:k]
        L = [e for e, m in zip(L, mask) if m]
    out = []
    for (a, b), (na, nb) in L:
        if axis == 'x':      # band across x: travels in the (z, y) plane
            out.append(((0, cy + b, a), (0, nb, na), (1, 0, 0)))
        else:                # band across z: travels in the (x, y) plane
            out.append(((a, cy + b, 0), (na, nb, 0), (0, 0, 1)))
    return out


def giftbox():
    # a crisp present: a rounded box (exact geometry, no remesh wobble) wrapped in a fat raised ribbon cross (the same
    # width as the lid's), its edges undercut so both get a clean ink line; it ends just round the bottom edges, so the
    # box still stands flat on y 0. Box 1.0 x 0.8 x 1.0 (ribbon +0.022 / +0.026 proud), origin at the base.
    p = CProp('prop_m_giftbox', base=WHITE).raw()
    p.box((0, 0.4, 0), (0.5, 0.4, 0.5), bevel=0.07)
    p.layer('ribbon', base=WHITE).raw()
    side = lambda a: a <= 225 or a >= 315          # everything but the underside
    sweep(p, wrap_path(0.5, 0.4, 0.07, 0.4, 'x', side), band_prof(GIFT_W, 0.016), closed=False)
    sweep(p, wrap_path(0.5, 0.4, 0.07, 0.4, 'z', side), band_prof(GIFT_W, 0.02), closed=False)
    p.layer('skin')
    fin(p, 0, 0.8, 0.024, tint=0xa77bff)


def giftlid():
    # the lid: a rounded slab 1.12 x 0.22 x 1.12 centred EXACTLY on the origin (x / z symmetric, so a lid placed at
    # x = z = 0 sits centred on the box), the same fat ribbon cross wrapping over its edges, and a plump bow: two
    # puffy teardrop loops, a round knot and two tails with V-cut ends lying on the lid top.
    p = CProp('prop_m_giftlid', base=WHITE).raw()
    p.box((0, 0, 0), (0.56, 0.11, 0.56), bevel=0.06)
    p.layer('ribbon', base=WHITE).raw()
    lid_keep = lambda a: not (250 < a < 290)
    sweep(p, wrap_path(0.56, 0.11, 0.06, 0.0, 'x', lid_keep), band_prof(GIFT_W, 0.016), closed=False)
    sweep(p, wrap_path(0.56, 0.11, 0.06, 0.0, 'z', lid_keep), band_prof(GIFT_W, 0.02), closed=False)
    TOP = 0.11 + 0.02                                  # top of the ribbon cross
    for s in (-1, 1):
        # a puffy loop, pinched where it meets the knot, standing up and leaning back a little
        pts, rad = [], []
        N = 28
        for k in range(N):
            a = k / N * TAU
            out = (1 + math.cos(a)) / 2                        # 1 at the outer tip, 0 at the knot
            x = 0.24 + 0.17 * math.cos(a)
            y = TOP + 0.15 + math.sin(a) * (0.055 + 0.085 * out)
            z = -0.02 - 0.09 * out
            pts.append((s * x, y, z))
            rad.append(0.045 + 0.028 * out)
        p.tube(pts, rad, closed=True, rseg=12)
        # a tail lying on the lid top, out toward the front corner, with a V notch in its end
        tail = [(0.0, -0.05), (0.07, -0.08), (0.36, -0.36), (0.3, -0.42), (0.27, -0.33), (0.2, -0.43), (0.12, -0.39), (-0.02, 0.02)]
        pillow(p, [(s * x, y) for x, y in tail], on_plane((0, 0.11, 0.02), (0, 1, 0)), h=0.042, depth=0.03, rings=(0.6,))
    # the knot: a plump round button
    p.lathe(rounded([(0, -0.08), (0.085, -0.075), (0.1, 0.0), (0.085, 0.075), (0, 0.085)], 0.04, n=3), pos=(0, TOP + 0.13, 0.03), rot=(90, 0, 0), scale=(1.1, 0.95), seg=20)
    p.paint_fn(lambda q, n: q.y > TOP + 0.03 and abs(q.x) > 0.11 and n.z < -0.35, 0xe2e0ea)          # loop insides in shade
    p.layer('skin')
    fin(p, -0.11, 0.4, 0.022, tint=0xa77bff)


def cone():
    WAF, WAF_D = 0xe0a85a, 0xc0883e
    p = Prop('prop_m_cone', base=WAF, target_faces=7000, voxel=0.006)
    p.lathe(rounded([(0, 0.0), (0.05, 0.06), (0.3, 0.88), (0.36, 0.92), (0.36, 1.0), (0.3, 1.02), (0, 1.0)], 0.03, n=3), seg=48)

    def grid(q, n):
        # a clean diagonal criss-cross waffle: two families of evenly spaced spiral lines
        a = math.atan2(q.x, q.z)
        u, v = a * 1.27 + q.y * 5.2, a * 1.27 - q.y * 5.2
        return (abs(u - round(u)) < 0.09 or abs(v - round(v)) < 0.09) and q.y < 0.87
    p.paint_fn(grid, WAF_D)
    p.paint_fn(lambda q, n: q.y > 0.9, 0xd89a4c)
    p.bone('body', (0, 0, 0), (0, 1.0, 0))
    p.extras['outline'] = 0.02
    p.build()


def scoop():
    p = Prop('prop_m_scoop', base=WHITE, target_faces=2600, voxel=0.009)
    p.blob((0, 0.04, 0), (0.37, 0.33, 0.37), group='s')
    for k in range(9):                                                   # a clean drippy hem
        a = k / 9 * TAU
        p.blob((0.35 * math.sin(a), -0.2, 0.35 * math.cos(a)), (0.11, 0.09 + 0.03 * (k % 2), 0.11), group='s')
    p.layer('cherry', base=0xe8143a, target_faces=500, voxel=0.007)
    p.blob((0.03, 0.42, 0.05), (0.1, 0.1, 0.1), group='c')
    p.tube([(0.03, 0.5, 0.05), (0.06, 0.6, 0.04), (0.12, 0.66, 0.02)], 0.017, rseg=8)
    p.paint_fn(lambda q, n: q.y > 0.52, 0x6a8a3a)
    p.paint_fn(lambda q, n: q.y < 0.5 and n.x < -0.3 and n.y > 0.3, 0xff6a80)
    p.layer('skin')
    # one soft glossy highlight lying flush on the scoop (smooth lens, so its edge inks as a clean oval, not a scribble)
    from mathutils import Vector
    p.layer('shine', base=WHITE, target_faces=500, voxel=0.0028)
    d = Vector((-0.48, 0.42, 0.77)).normalized()
    k = 1.0 / math.sqrt((d.x / 0.37) ** 2 + (d.y / 0.33) ** 2 + (d.z / 0.37) ** 2)          # hit point on the scoop ellipsoid
    nrm = Vector((d.x / 0.37 ** 2, d.y / 0.33 ** 2, d.z / 0.37 ** 2)).normalized()
    pos = Vector((0, 0.04, 0)) + d * k - nrm * 0.004
    rot = Vector((0, 1, 0)).rotation_difference(nrm).to_euler('XYZ')
    p.lathe(rounded([(0, 0), (0.05, 0), (0.042, 0.014), (0, 0.018)], 0.008, n=2), pos=tuple(pos),
            rot=tuple(math.degrees(v) for v in rot), scale=(0.8, 1.3), seg=24)                     # a smooth glossy lens
    p.layer('skin')
    fin(p, -0.3, 0.4, 0.022, tint=0x5fd068)


def cup():
    p = Prop('prop_m_cup', base=WHITE, target_faces=1800, voxel=0.008)
    p.lathe(rounded([(0, -0.3), (0.24, -0.3), (0.32, 0.27), (0.28, 0.27), (0.21, -0.24), (0, -0.24)], 0.025, n=3), seg=48)
    p.paint_fn(lambda q, n: math.hypot(q.x, q.z) < 0.21 + 0.07 * (q.y + 0.24) / 0.51 + 0.02 and q.y > -0.25, 0xb0b0b0)
    p.paint_fn(lambda q, n: q.y < -0.27 and math.hypot(q.x, q.z) > 0.2, 0xe2e2e2)
    # a clean white rolled rim and a white foot ring (no little stuck-on dots: they inked as scribbles)
    p.layer('rim', base=WHITE, target_faces=900, voxel=0.007)
    p.ring((0, 0.27, 0), 0.312, 0.038, seg=48, rseg=10)
    p.ring((0, -0.285, 0), 0.25, 0.025, seg=48, rseg=8)
    p.layer('skin')
    fin(p, -0.3, 0.3, 0.02, tint=0x4a90ff)


def bolt():
    p = Prop('prop_m_bolt', base=0xffd23f, target_faces=700, voxel=0.012)
    pts = [(0, 0), (0.55, 0), (0.12, -0.8), (0.58, -0.8), (-0.3, -2.1), (0.02, -1.02), (-0.42, -1.02)]
    poly = rounded(pts, 0.05, n=2, closed=True)
    slab(p, [q[:2] for q in poly], 0, 0.18)
    p.paint_fn(lambda q, n: n.z < 0.5 and n.z > -0.5, 0xf0b52a)
    p.bone('body', (0, -2.1, 0), (0, 0, 0))
    p.extras['outline'] = 0.03
    p.build()


def jackbox():
    p = Prop('prop_m_jackbox', base=0xff5a5a, target_faces=1600, voxel=0.014)
    p.box((0, 0.5, 0), (0.5, 0.5, 0.5), bevel=0.07)
    p.layer('deco', base=0xffd23f, target_faces=1200, voxel=0.008)
    slab(p, [q[:2] for q in [(x, y) for x, y in star_poly(0.3, 0.5)]], 0.5, 0.03, off=(0, 0.5, 0))
    slab(p, [(0, 0.28), (0.28, 0), (0, -0.28), (-0.28, 0)], 0.5, 0.03, rot=(0, 90, 0), off=(0, 0.5, 0))
    slab(p, [(0, 0.28), (0.28, 0), (0, -0.28), (-0.28, 0)], 0.5, 0.03, rot=(0, -90, 0), off=(0, 0.5, 0))
    p.paint_fn(lambda q, n: abs(q.x) > 0.45, 0x4a90ff)
    p.layer('skin')
    # the crank on the left side, on its own bone (spins about its own axis)
    p.layer('crankarm', base=0xffd23f, target_faces=600, voxel=0.01)
    p.capsule((-0.5, 0.55, 0), (-0.66, 0.55, 0), 0.045, group='axle')
    p.capsule((-0.64, 0.55, 0), (-0.64, 0.8, 0), 0.04, group='arm')
    p.capsule((-0.64, 0.8, 0), (-0.76, 0.8, 0), 0.05, group='grip', r2=0.06)
    p.layer('skin')
    is_crank = lambda q: q.x < -0.53
    p.bone('body', (0, 0, 0), (0, 1.0, 0), region=lambda q: not is_crank(q))
    p.bone('crank', (-0.5, 0.55, 0), (-0.75, 0.55, 0), parent='body', region=is_crank)
    p.extras['outline'] = 0.024
    p.build()


def jacklid():
    p = Prop('prop_m_jacklid', base=0x4a90ff, target_faces=800, voxel=0.012)
    p.box((0, 0.06, 0.525), (0.53, 0.06, 0.53), bevel=0.05)
    p.blob((0, 0.13, 0.525), (0.1, 0.05, 0.1), group='knob')
    p.paint_fn(lambda q, n: q.y > 0.11 and math.hypot(q.x, q.z - 0.525) < 0.12, 0xffd23f)
    fin(p, 0, 0.12, 0.022)


def jack():
    p = Prop('prop_m_jack', base=0xfff0dd, target_faces=1600, voxel=0.012)
    p.blob((0, 1.2, 0), (0.42, 0.4, 0.38), group='head')
    p.layer('spring', base=0xe6e6ee, target_faces=900, voxel=0.01)
    pts = [(0.18 * math.cos(t), 0.02 + t / TAU * 0.16, 0.18 * math.sin(t)) for t in [i * 0.4 for i in range(int(6 * TAU / 0.4))]]
    p.tube(pts, 0.04, rseg=6)
    p.layer('skin')
    p.layer('hat', base=0xa77bff, target_faces=600, voxel=0.01)
    p.lathe(rounded([(0, 1.5), (0.3, 1.5), (0.04, 2.05), (0, 2.06)], 0.04, n=2), seg=24)
    p.blob((0, 2.1, 0), (0.1, 0.1, 0.1), group='pom')
    p.paint_fn(lambda q, n: q.y > 2.0, 0xffd23f)
    p.paint_fn(lambda q, n: abs(((q.y - 1.5) / 0.14) % 1 - 0.5) < 0.2 and q.y < 1.95, 0xff8fc0)
    p.layer('skin')
    p.layer('hair', base=0xff9f3f, target_faces=600, voxel=0.01)
    for s in (-1, 1):
        for k, (dy, dz) in enumerate([(0.12, 0.0), (-0.05, -0.05), (0.25, -0.1)]):
            p.blob((s * 0.4, 1.2 + dy, dz), (0.12, 0.12, 0.12), group='h%d%d' % (s, k))
    p.layer('skin')
    p.layer('nose', base=0xff3b4e, target_faces=200, voxel=0.007)
    p.blob((0, 1.13, 0.4), (0.09, 0.08, 0.08), group='n')
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 2.1, 0))
    p.face((0, 1.2, 0.0), 0.38, bone='body', faceScale=0.9)
    p.extras['outline'] = 0.022
    p.build()


def spider():
    BODY = 0x5a4a6e
    p = Prop('prop_m_spider', base=BODY, target_faces=1800, voxel=0.012)
    p.blob((0, 0, 0), (0.42, 0.4, 0.38), group='b')
    for k in range(18):
        y = 1 - 2 * (k + 0.5) / 18
        r = math.sqrt(1 - y * y); a = k * 2.4
        p.blob((0.36 * r * math.cos(a), 0.36 * y, 0.32 * r * math.sin(a) - 0.04), (0.09, 0.09, 0.09), group='b', stiffness=2.4)
    p.layer('legs', base=0x4a3a5a, target_faces=1600, voxel=0.01)
    for s in (-1, 1):
        for i in range(4):
            z = (i - 1.5) * 0.17
            pts = [(s * 0.3, -0.05, z), (s * 0.62, 0.18, z * 1.3), (s * 0.82, -0.18, z * 1.5), (s * 0.9, -0.42, z * 1.6)]
            p.tube(pts, [0.05, 0.045, 0.04, 0.035], rseg=6)
            p.blob((s * 0.9, -0.43, z * 1.6), (0.055, 0.04, 0.055), group='f%d%d' % (s, i))
    p.layer('skin')
    p.bone('body', (0, -0.45, 0), (0, 0.45, 0))
    p.face((0, 0.02, 0), 0.38, bone='body', faceScale=1.0)
    p.extras['outline'] = 0.022
    p.build()


def dirt():
    p = Prop('prop_m_dirt', base=0x7a5232, target_faces=900, voxel=0.014)
    p.lathe(rounded([(0.3, 0.0), (0.66, 0.0), (0.56, 0.16), (0.42, 0.2), (0.36, 0.12), (0.3, 0.02)], 0.05, n=3), seg=32, closed=True)
    for k in range(7):
        a = k / 7 * TAU + 0.3
        p.blob((0.58 * math.sin(a), 0.07, 0.58 * math.cos(a)), (0.12, 0.08, 0.12), group='c%d' % k)
    p.paint_fn(lambda q, n: math.hypot(q.x, q.z) < 0.38, 0x4a3020)
    fin(p, 0, 0.2, 0.02)


def mole():
    p = Prop('prop_m_mole', base=0x7a6a80, target_faces=2400, voxel=0.01)
    p.blob((0, 0.3, 0), (0.42, 0.5, 0.38), group='b')
    for s in (-1, 1):                                                     # small round ears
        p.blob((s * 0.3, 0.68, 0.0), (0.09, 0.08, 0.05), rot=(0, 0, s * 25), group='ear%d' % s)
    p.decal('belly', (0, 0.12), (0.25, 0.24, 0.3), 0xb2a4bc)             # a pale tummy patch
    p.paint_fn(lambda q, n: q.y > 0.6 and abs(q.x) > 0.24 and n.z > 0.2 and abs(n.x) > 0.3, 0xff9ec4)   # pink inner ears
    p.layer('nose', base=0xff8fc0, target_faces=500, voxel=0.007)
    p.blob((0, 0.42, 0.42), (0.11, 0.09, 0.09), group='n')
    p.paint_fn(lambda q, n: n.y > 0.5 and q.x < 0, 0xffc2dc)
    p.layer('skin')
    p.layer('paws', base=0xffb3d1, target_faces=900, voxel=0.008)
    for s in (-1, 1):
        p.blob((s * 0.32, 0.18, 0.3), (0.14, 0.07, 0.11), rot=(0, 0, s * 20), group='p%d' % s)
        for k in range(3):
            p.blob((s * (0.3 + (k - 1) * 0.07), 0.15, 0.4), (0.03, 0.03, 0.04), group='p%d' % s)
    p.layer('skin')
    p.layer('whiskers', base=0x4a3a5a, target_faces=400, voxel=0.005)
    for s in (-1, 1):
        for k, dy in enumerate((0.04, -0.01)):
            p.tube([(s * 0.1, 0.42 + dy, 0.43), (s * 0.2, 0.43 + dy * 1.6, 0.42), (s * 0.29, 0.45 + dy * 2.4, 0.37)], [0.011, 0.009, 0.006], rseg=6)
    p.layer('skin')
    p.bone('body', (0, -0.2, 0), (0, 0.8, 0))
    p.face((0, 0.5, 0), 0.36, bone='body', faceScale=0.9, noseColor=None)
    p.extras['outline'] = 0.022
    p.build()


def butterfly():
    p = Prop('prop_m_butterfly', base=WHITE, target_faces=1600, voxel=0.01)
    # wings lying flat (xz plane), head toward +z; upper wings tinted, lower wings in layer 'lower'
    for s in (-1, 1):
        p.blob((s * 0.3, 0, 0.08), (0.27, 0.025, 0.22), rot=(0, s * -20, 0), group='u%d' % s)
    p.paint_fn(lambda q, n: math.hypot(abs(q.x) - 0.36, q.z - 0.12) < 0.08, 0xf2f2f2)
    p.layer('lower', base=0xffd23f, target_faces=800, voxel=0.01)
    for s in (-1, 1):
        p.blob((s * 0.22, -0.005, -0.2), (0.17, 0.022, 0.15), rot=(0, s * 25, 0), group='l%d' % s)
    p.layer('skin')
    p.layer('bod', base=INK, target_faces=500, voxel=0.008)
    p.capsule((0, 0.02, -0.25), (0, 0.02, 0.28), 0.05, group='b')
    p.blob((0, 0.03, 0.32), (0.07, 0.07, 0.07), group='b')
    for s in (-1, 1):
        p.tube([(s * 0.03, 0.06, 0.36), (s * 0.08, 0.14, 0.48), (s * 0.12, 0.16, 0.52)], 0.012, rseg=5)
    p.layer('skin')
    wing = lambda s: (lambda q: q.x * s > 0.05)
    p.bone('body', (0, 0, -0.3), (0, 0, 0.35), region=lambda q: abs(q.x) <= 0.05)
    p.bone('wing.L', (-0.05, 0, 0), (-0.55, 0, 0), parent='body', region=wing(-1))
    p.bone('wing.R', (0.05, 0, 0), (0.55, 0, 0), parent='body', region=wing(1))
    p.extras.update(argMode='tint', argDefault=0xa77bff, outline=0.016)
    p.build()


def bee():
    p = Prop('prop_m_bee', base=0xffd23f, target_faces=1800, voxel=0.011)
    p.blob((0, 0, 0), (0.4, 0.36, 0.36), group='b')
    p.blob((0, 0.02, -0.22), (0.3, 0.27, 0.25), group='b')
    p.capsule((0, -0.02, -0.46), (0, -0.05, -0.56), 0.05, group='sting', r2=0.02)
    p.paint_fn(lambda q, n: abs(q.z + 0.08) < 0.06 or abs(q.z + 0.3) < 0.06 or q.z < -0.5, 0x3a2838)
    p.layer('wings', base=0xeaf6ff, target_faces=700, voxel=0.009)
    for s in (-1, 1):
        p.blob((s * 0.3, 0.36, -0.12), (0.22, 0.08, 0.13), rot=(0, 0, s * -35), group='w%d' % s)
        p.blob((s * 0.2, 0.32, -0.3), (0.13, 0.06, 0.09), rot=(0, 0, s * -30), group='w2%d' % s)
    p.layer('skin')
    p.layer('antenna', base=0x3a2838, target_faces=300, voxel=0.007)
    for s in (-1, 1):
        p.tube([(s * 0.1, 0.3, 0.12), (s * 0.15, 0.45, 0.16), (s * 0.2, 0.52, 0.12)], 0.015, rseg=5)
        p.blob((s * 0.2, 0.53, 0.12), (0.035, 0.035, 0.035), group='a%d' % s)
    p.layer('skin')
    isw = lambda s: (lambda q: q.y > 0.3 and q.x * s > 0.06 and q.z < 0.0)
    p.bone('body', (0, -0.35, 0), (0, 0.4, 0), region=lambda q: not (isw(-1)(q) or isw(1)(q)))
    p.bone('wing.L', (-0.08, 0.32, -0.15), (-0.5, 0.45, -0.15), parent='body', region=isw(-1))
    p.bone('wing.R', (0.08, 0.32, -0.15), (0.5, 0.45, -0.15), parent='body', region=isw(1))
    p.face((0, 0.0, 0), 0.34, bone='body', faceScale=1.0)
    p.extras['outline'] = 0.02
    p.build()


def toybox():
    p = Prop('prop_m_toybox', base=0xd94f3d, target_faces=2000, voxel=0.02)
    p.box((0, 0.7, 0), (1.1, 0.7, 0.7), bevel=0.1)
    p.paint_fn(lambda q, n: n.z > 0.6 and abs(q.x) < 0.7 and abs(q.y - 0.7) < 0.42, 0xff7a6a)
    p.layer('lid', base=0xffd23f, target_faces=900, voxel=0.018)
    p.box((0, 1.55, -0.95), (1.15, 0.1, 0.72), rot=(-62, 0, 0), bevel=0.06)
    p.layer('skin')
    p.layer('toys', base=0x4a90ff, target_faces=900, voxel=0.015)
    p.blob((-0.5, 1.45, 0.05), (0.28, 0.28, 0.28), group='ball')
    p.box((0.45, 1.45, 0.0), (0.22, 0.22, 0.22), rot=(0, 30, 15), bevel=0.05)
    p.paint_fn(lambda q, n: q.x > 0.1, 0x5fd068)
    p.layer('skin')
    p.layer('star', base=0xffffff, target_faces=500, voxel=0.01)
    slab(p, star_poly(0.3, 0.5), 0.71, 0.04, off=(0, 0.7, 0))
    p.layer('skin')
    fin(p, 0, 1.6, 0.03)


def blanket():
    # a soft checked picnic cloth 9.4 x 2.4 lying on y 0: even square checks (4 rows x 17, cut exactly on mesh lines, so
    # every border is dead straight), a darker hem all round with white running stitches, softly rounded edges and a
    # few gentle folds out at the back and the ends. The middle band, where the game sets the plates, is flat at y 0.08.
    W, D, HEM, TOPY = 4.7, 1.2, 0.15, 0.08
    RED, RED_D, CREAM = 0xff7a7a, 0xe25858, 0xffffff
    p = CProp('prop_m_blanket', base=CREAM).raw().facepaint()
    NC, NR = 17, 4
    cx = (W - HEM) * 2 / NC
    cz = (D - HEM) * 2 / NR
    xs = sorted(set([-W, -W + 0.05, W - 0.05, W] + [round(-W + HEM + cx * i / 2, 6) for i in range(2 * NC + 1)] + [-W + HEM * 0.5, W - HEM * 0.5]))
    zs = sorted(set([-D, -D + 0.05, D - 0.05, D] + [round(-D + HEM + cz * i / 3, 6) for i in range(3 * NR + 1)] + [-D + HEM * 0.5, D - HEM * 0.5]))

    def sm(a, b, t):
        t = max(0.0, min(1.0, (t - a) / (b - a)))
        return t * t * (3 - 2 * t)

    def hgt(x, z):
        h = TOPY
        # gentle folds: a soft wave along the back edge and lifted, rippled ends (clear of the plates' band)
        h += 0.07 * sm(-0.72, -1.15, z) * (0.5 + 0.5 * math.sin(x * 1.25 + 0.6))
        h += 0.1 * sm(3.95, 4.7, abs(x)) * (0.55 + 0.45 * math.sin(z * 2.6 + (1.3 if x > 0 else -0.4)))
        h += 0.025 * sm(0.75, 1.15, z) * (0.5 + 0.5 * math.sin(x * 1.7 - 0.8))
        # the edge rolls softly down
        e = min(W - abs(x), D - abs(z))
        return h - 0.035 * (1 - min(1.0, e / 0.05)) ** 2

    nx, nz = len(xs), len(zs)
    verts = [(x, hgt(x, z), z) for z in zs for x in xs]
    faces = [(j * nx + i, j * nx + i + 1, (j + 1) * nx + i + 1, (j + 1) * nx + i) for j in range(nz - 1) for i in range(nx - 1)]
    # the side wall down to the floor and a flat underside
    ring = [i for i in range(nx)] + [j * nx + nx - 1 for j in range(1, nz)] + [(nz - 1) * nx + i for i in range(nx - 2, -1, -1)] + [j * nx for j in range(nz - 2, 0, -1)]
    base = len(verts)
    verts += [(verts[k][0], 0.0, verts[k][2]) for k in ring]
    m = len(ring)
    faces += [(ring[k], base + k, base + (k + 1) % m, ring[(k + 1) % m]) for k in range(m)]
    faces.append(tuple(base + k for k in range(m)))
    p.mesh(verts, faces)

    def kind(q, n):
        if abs(q.x) > W - HEM or abs(q.z) > D - HEM or n.y < 0.3:
            return 'hem'
        return 'red' if (int(math.floor((q.x + W - HEM) / cx)) + int(math.floor((q.z + D - HEM) / cz))) % 2 == 0 else 'white'
    p.paint_fn(lambda q, n: kind(q, n) == 'red', RED)
    p.paint_fn(lambda q, n: kind(q, n) == 'hem', RED_D)
    # white running stitches along the hem (printed: open strips lying just on the cloth)
    p.layer('stitch', base=CREAM).raw(up=True)
    off = HEM * 0.5
    for (x0, z0, x1, z1) in ((-W + off, -D + off, W - off, -D + off), (W - off, -D + off, W - off, D - off),
                             (W - off, D - off, -W + off, D - off), (-W + off, D - off, -W + off, -D + off)):
        L = math.hypot(x1 - x0, z1 - z0)
        n = int(L / 0.2)
        ux, uz = (x1 - x0) / L, (z1 - z0) / L
        for k in range(n):
            t0, t1 = (k + 0.25) * L / n, (k + 0.75) * L / n
            a = (x0 + ux * t0, z0 + uz * t0); b = (x0 + ux * t1, z0 + uz * t1)
            wx, wz = -uz * 0.016, ux * 0.016
            q = [(a[0] - wx, a[1] - wz), (b[0] - wx, b[1] - wz), (b[0] + wx, b[1] + wz), (a[0] + wx, a[1] + wz)]
            p.mesh([(x, hgt(x, z) + 0.004, z) for x, z in q], [(0, 1, 2, 3)])
    p.layer('skin')
    fin(p, 0, 0.1, 0.02)


def tray():
    # a proper baking tray 8.6 x 2.1: a flat floor (cookies sit on y 0.16, as before), a sloped wall rising to a fat
    # rolled rim (top y ~0.34), loop handles at both ends, and the red oven mitt lying by the right-hand handle.
    HW, HD, RC, FLOOR = 4.3, 1.05, 0.3, 0.16
    METAL, METAL_L, METAL_D = 0xaab6c6, 0xd8e0ea, 0x8794a8
    p = CProp('prop_m_tray', base=METAL).raw().facepaint()
    # one closed shell: a cross-section (offset from the rim line, height) swept round the rounded-rectangle rim, from
    # the inner edge of the floor, up the wall, over the rolled rim and down under to the underside, closed by a flat
    # floor fan and a flat underside fan (the inset first / last rings keep the wall's tilted normals off the flats)
    wall = [(-0.27, FLOOR), (-0.2, FLOOR), (-0.13, FLOOR + 0.004), (-0.09, FLOOR + 0.03), (-0.06, FLOOR + 0.1),
            (-0.042, 0.3), (-0.03, 0.335), (-0.005, 0.355), (0.025, 0.352), (0.045, 0.33), (0.045, 0.3), (0.025, 0.24), (0.0, 0.1),
            (-0.02, 0.05), (-0.06, 0.03), (-0.2, 0.03), (-0.27, 0.03)]
    loop = rr_loop(HW, HD, RC, ncorner=7, nside=(3, 12))
    m, k = len(loop), len(wall)
    verts = [(a + na * d, y, b + nb * d) for (a, b), (na, nb) in loop for d, y in wall] + [(0, FLOOR, 0), (0, 0.03, 0)]
    faces = [(i * k + j, ((i + 1) % m) * k + j, ((i + 1) % m) * k + j + 1, i * k + j + 1) for i in range(m) for j in range(k - 1)]
    cf, cu = m * k, m * k + 1
    faces += [(cf, ((i + 1) % m) * k, i * k) for i in range(m)] + [(cu, i * k + k - 1, ((i + 1) % m) * k + k - 1) for i in range(m)]
    p.mesh(verts, faces)
    p.paint_fn(lambda q, n: q.y > 0.3, METAL_L)                                    # the rolled rim catches the light
    p.paint_fn(lambda q, n: n.y < -0.5, METAL_D)
    # loop handles at both ends
    p.layer('handles', base=METAL_L).raw()
    for s in (-1, 1):
        pts = [(s * (HW - 0.05), 0.31, -0.5), (s * (HW + 0.2), 0.33, -0.46), (s * (HW + 0.36), 0.34, -0.25), (s * (HW + 0.38), 0.34, 0.0),
               (s * (HW + 0.36), 0.34, 0.25), (s * (HW + 0.2), 0.33, 0.46), (s * (HW - 0.05), 0.31, 0.5)]
        p.tube(rounded(pts, 0.12, n=3), 0.08, rseg=10)
    p.layer('skin')
    # the oven mitt lying on the floor by the right-hand end, clear of the handle (cuff toward the back)
    MC, A = Vector((4.95, 0.0, 1.0)), math.radians(-35)
    U, V = Vector((math.sin(A), 0, math.cos(A))), Vector((math.cos(A), 0, -math.sin(A)))      # long axis (to the tip), across
    at = lambda u, v, y: tuple(MC + U * u + V * v + Vector((0, y, 0)))
    p.layer('mitt', base=0xff6f6f, target_faces=900, voxel=0.013)
    p.blob(at(0.05, 0, 0.13), (0.3, 0.12, 0.42), rot=(0, math.degrees(A), 0), group='m')
    p.blob(at(-0.38, 0, 0.13), (0.3, 0.12, 0.26), rot=(0, math.degrees(A), 0), group='m')
    p.blob(at(0.12, -0.36, 0.11), (0.12, 0.1, 0.2), rot=(0, math.degrees(A) - 25, 0), group='th')
    p.paint_fn(lambda q, n: (q - MC).dot(U) < -0.4, 0xffffff)                                 # a white cuff
    p.layer('skin')
    fin(p, 0, 0.3, 0.022)


def table():
    # the party table keeps its top (y 2.43, oval 7.8 x 3.5) and pink cloth, but now stands on four chunky turned
    # wooden legs with round feet, visible under the cloth's scalloped hem (it no longer reads as floating)
    TOPY = 2.43
    p = CProp('prop_m_table', base=0xffffff).raw()
    p.lathe(rounded([(0, TOPY - 0.12), (3.9, TOPY - 0.12), (3.95, TOPY - 0.05), (3.9, TOPY), (0, TOPY)], 0.04, n=3), scale=(1, 0.45), seg=64)
    a_of = lambda q: math.atan2(q.x, q.z / 0.46) % TAU
    trim = lambda q: q.y < hem(a_of(q)) + 0.2 - 0.002          # the trim rows: below hem + 0.2 (they follow the scallops)
    p.paint_fn(lambda q, n: n.y > 0.5, 0xfff3e0)
    # the cloth (not 'cloth*': the game hides those layers): an exact drum hanging from the rim (oval like the top) to a
    # scalloped hem with a white scalloped trim band (the trim rows follow the scallops, so its edges are clean)
    p.layer('skirt', base=0xff9ec8).raw().facepaint()
    NSC, PER = 24, 5
    NA = NSC * PER

    def hem(a):
        f = (a / TAU * NSC) % 1.0
        return 1.2 + 0.13 * (1 - math.sin(math.pi * f) ** 0.8)
    rows = lambda hb: [(0, TOPY - 0.02), (2.0, TOPY - 0.02), (3.96, TOPY - 0.02), (4.05, TOPY - 0.05), (4.1, TOPY - 0.12), (4.12, TOPY - 0.3),
                       (4.17, 1.85), (4.21, 1.62), (4.245, hb + 0.24), (4.255, hb + 0.2), (4.285, hb + 0.04), (4.3, hb + 0.005),
                       (4.28, hb - 0.004), (4.2, hb), (0, 1.26)]
    NP = len(rows(1.2))
    verts = []
    for i in range(NA):
        a = TAU * i / NA
        for r, y in rows(hem(a)):
            verts.append((r * math.sin(a), y, r * math.cos(a) * 0.46))
    faces = [(i * NP + j, ((i + 1) % NA) * NP + j, ((i + 1) % NA) * NP + j + 1, i * NP + j + 1) for i in range(NA) for j in range(NP - 1)]
    p.mesh(verts, faces)
    p.paint_fn(lambda q, n: n.y > -0.5 and q.y < 1.62 - 0.001 and q.y > 1.1 and math.hypot(q.x, q.z / 0.46) > 4.2 and trim(q), 0xffffff)
    p.paint_fn(lambda q, n: n.y < -0.5, 0xffd6e8)
    p.layer('skin')
    p.layer('bunting', base=0xffd23f, target_faces=1400, voxel=0.016)
    cols = [0xffd23f, 0xffffff, 0x4a90ff]
    for i in range(9):
        a = -1.25 + i * (2.5 / 8)
        x, z = 4.2 * math.sin(a), 4.2 * 0.46 * math.cos(a) + 0.03
        p.blob((x, 1.72, z), (0.17, 0.17, 0.04), rot=(0, math.degrees(math.atan2(math.sin(a) * 0.46, math.cos(a))), 0), group='d%d' % i)
        p.paint(None, (x, 1.72, z), (0.22, 0.22, 0.3), cols[i % 3])
    p.layer('skin')
    p.layer('leg', base=0xd29558).raw().facepaint()
    for x in (-2.85, 2.85):
        for z in (-0.78, 0.78):
            leg = [(0, 0.0), (0.22, 0.0), (0.3, 0.03), (0.35, 0.09), (0.36, 0.15), (0.34, 0.21), (0.3, 0.25), (0.26, 0.3),
                   (0.255, 0.45), (0.265, 0.75), (0.29, 1.05), (0.3, 1.3), (0, 1.3)]
            p.lathe(leg, pos=(x, 0, z), seg=16)
    p.paint_fn(lambda q, n: q.y < 0.25, 0xa8703e)                 # round darker feet (the border is a profile ring)
    p.layer('skin')
    fin(p, 0, TOPY, 0.028)


MODELS = dict(prop_m_giftbox=giftbox, prop_m_giftlid=giftlid, prop_m_cone=cone, prop_m_scoop=scoop, prop_m_cup=cup, prop_m_bolt=bolt,
              prop_m_jackbox=jackbox, prop_m_jacklid=jacklid, prop_m_jack=jack, prop_m_spider=spider, prop_m_dirt=dirt, prop_m_mole=mole,
              prop_m_butterfly=butterfly, prop_m_bee=bee, prop_m_toybox=toybox, prop_m_blanket=blanket, prop_m_tray=tray, prop_m_table=table)
for name, fn in MODELS.items():
    if not ONLY or name in ONLY:
        fn()
