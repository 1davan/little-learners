"""Toy fruit for the meadow games (Apple count, Colour tubes, Shape house goodies, Big and small scatter).
One script, many models: prop_m_apple, prop_m_pear, prop_m_orange, prop_m_plum, prop_m_lemon, prop_m_strawberry, prop_m_blueberry,
prop_m_cherry, prop_m_banana, prop_m_grapes.  (ONLY=prop_m_apple,prop_m_pear tools/blender/build.sh prop_meadow_fruit  builds a subset.)

Every fruit is TINTABLE (argMode 'tint'): the body is painted white / light grey and the game multiplies it by the
fruit's colour (red apple, green pear, a golden one, the colour game's red / blue / yellow / green). Stems, leaves,
seeds and the little white shine are separate layers that keep their own colours.
Centred on the origin (the game simulates them as balls), body radius ~0.45-0.5, facing +z.
Layer 'shine' is a small gloss sticker; the game hides its ink outline. Layers 'tint*' are tinted like the skin."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded, circle_poly, star_poly

ONLY = [s for s in os.environ.get('ONLY', '').split(',') if s]
STEM, LEAF, LEAF_D, SEED = 0x7a5232, 0x5cbf4a, 0x3f9a3a, 0xfff0a0
DIMPLE = 0xb4b4b4


# ---------- crisp hard-surface helpers (same ideas as prop_meadow_toys.py / prop_meadow_shapes.py) ----------
# CProp: a layer marked raw() is joined exactly as modelled (no voxel remesh / decimate / smoothing), so analytic lathes,
# sweeps and stickers keep perfectly clean silhouettes; facepaint() colours it face by face from each face's centre (for
# layers whose colour borders already lie on mesh edges: lathe rings, grid lines), else lib's crisp paint cuts the
# borders in. pillow() builds a sticker from a 2D outline with an UNDERCUT side wall (it leans back under the top), so
# the game's inverted-hull ink draws a closed line all round it. lens() is a free-standing double-sided leaf / flap.
import bpy, bmesh
from mathutils import Vector, Matrix


class CProp(Prop):
    def raw(self):
        self.layers[self._cur]['raw'] = True
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



def prof_r(prof, y):
    """radius of a (r, y) profile (y increasing along the outer side) at height y"""
    best = 0
    for (r0, y0), (r1, y1) in zip(prof, prof[1:]):
        if (y0 - y) * (y1 - y) <= 0 and y0 != y1:
            best = max(best, r0 + (r1 - r0) * (y - y0) / (y1 - y0))
    return best


def roundprof(R=0.48, H=0.42, top=0.08, bot=0.04, bulge=0.06, n=28, tw=0.28, bw=0.25):
    """a smooth fruit outline (r, y) from the bottom pole to the top pole: wider shoulders (bulge), dimpled poles"""
    pts = []
    for i in range(n + 1):
        t = math.pi * i / n
        r = R * math.sin(t) ** 0.8 * (1 - bulge * math.cos(t))
        y = -H * math.cos(t) - top * math.exp(-((math.pi - t) / tw) ** 2) + bot * math.exp(-(t / bw) ** 2)
        pts.append((r, y))
    pts[0] = (0, pts[0][1]); pts[-1] = (0, pts[-1][1])
    return pts


def shine(p, prof, y, ang=-0.62, w=0.05, h=0.1, rot=0):
    p.layer('shine', base=0xffffff, target_faces=160, voxel=0.006)
    poly = [(x * math.cos(rot) - yy * math.sin(rot), x * math.sin(rot) + yy * math.cos(rot)) for x, yy in circle_poly(1, n=16, sx=w, sy=h)]
    p.sticker(poly, y, lambda yy: prof_r(prof, yy), thick=0.018, ang=ang, lift=0.004)
    p.layer('skin')


def leaf(p, pos, length=0.2, width=0.09, yaw=0, tilt=25, name='leaf'):
    """a soft pointed leaf from pos outward along +x (turned by yaw about y, tilted up by tilt degrees)"""
    p.layer(name, base=LEAF, target_faces=360, voxel=0.008)
    a, t = math.radians(yaw), math.radians(tilt)
    d = (math.cos(a) * math.cos(t), math.sin(t), -math.sin(a) * math.cos(t))
    for i, (k, w) in enumerate([(0.18, 0.55), (0.42, 0.95), (0.66, 0.8), (0.86, 0.42)]):
        c = (pos[0] + d[0] * length * k, pos[1] + d[1] * length * k, pos[2] + d[2] * length * k)
        p.blob(c, (length * 0.2, width * 0.2, width * w * 0.5), rot=(-50, yaw, tilt), group='leaf')
    # a darker midrib
    p.paint_fn(lambda q, n: abs((q.z - pos[2]) * math.cos(a) + (q.x - pos[0]) * math.sin(a)) < 0.008 and n.y > 0.2, LEAF_D)
    p.layer('skin')


def stem(p, pts, r=0.03, col=STEM):
    p.layer('stem', base=col, target_faces=200, voxel=0.008)
    p.tube(pts, [r * (1.0 - 0.25 * i / (len(pts) - 1)) for i in range(len(pts))], rseg=8)
    p.layer('skin')


def on_wall(prof, cy, ang):
    """to3d for a sticker wrapped round a lathe wall (profile prof) at height cy, turned ang radians from +z toward +x;
    z = radial height above the wall"""
    def f(x, y, z):
        r0 = max(prof_r(prof, cy + y), 1e-3)
        a = ang + x / r0
        return Vector(((r0 + z) * math.sin(a), cy + y, (r0 + z) * math.cos(a)))
    return f


SHINE = dict(h=0.006, depth=0.022, under=None, lip=0.004, rings=(0.5,))


def gloss(p, to3d, w=0.032, h=0.08, spin=-28, dot=(0.0, -0.13, 0.022), n=4):
    """a fat pill-shaped gloss highlight (plus a little round dot under it) - layer 'shine' (the game hides its ink)"""
    p.layer('shine', base=0xffffff).raw()
    pillow(p, spun(rrect(w, h, w * 0.96, n=n), spin), to3d, **SHINE)
    if dot:
        dx, dy, r = dot
        a = math.radians(spin)
        pillow(p, [(dx * math.cos(a) - dy * math.sin(a) + x, dx * math.sin(a) + dy * math.cos(a) + y) for x, y in circle_poly(r, n=10)], to3d, **SHINE)
    p.layer('skin')


def stalk(p, pts, r0, r1, col=STEM, name='stem'):
    """a clean round stalk (raw tube, tapering r0 -> r1, flat cut end)"""
    p.layer(name, base=col).raw()
    P = rounded(pts, 0.06, n=3)
    n = len(P)
    p.tube(P, [r0 + (r1 - r0) * i / (n - 1) for i in range(n)], rseg=8)
    p.layer('skin')


def leaf2(p, base, d, nrm, L, W, bend=0.8, name='leaf', t=0.016):
    """a broad two-tone leaf (a crisp darker half split along the midrib) from base along d, its face toward nrm,
    curling gently toward nrm"""
    d = Vector(d).normalized()
    n = (Vector(nrm) - d * Vector(nrm).dot(d)).normalized()
    s = d.cross(n)
    o = Vector(base)
    p.layer(name, base=LEAF).raw()
    lens(p, leaf_poly(L, W, n=8), lambda x, y, z: o + d * y + s * x + n * (z + bend * (y * y + 0.6 * x * x)), t=t)
    p.paint_fn(lambda q, nn: (q - o).dot(s) > 0, LEAF_D)
    p.layer('skin')


def finish(p, h):
    p.bone('body', (0, -h, 0), (0, h, 0))
    p.extras['argMode'] = 'tint'
    p.extras['argDefault'] = 0xff4b4b
    p.extras['outline'] = 0.02
    p.build()


def apple():
    p = CProp('prop_m_apple', base=0xffffff).raw()
    prof = roundprof(0.49, 0.42, top=0.14, bot=0.05, bulge=0.07, n=26, tw=0.3)
    p.lathe(prof, seg=30)
    # a crisp darker dimple: the border sits between two lathe rings just inside the top crest
    k = max(range(len(prof)), key=lambda i: prof[i][1])
    RD = (prof[k][0] + prof[k + 1][0]) / 2
    p.paint_fn(lambda q, n: math.hypot(q.x, q.z) < RD and q.y > 0.1, DIMPLE)
    stalk(p, [(0, 0.27, 0), (0.0, 0.41, 0), (0.022, 0.51, 0), (0.065, 0.575, 0.0)], 0.044, 0.036)
    # a big leaf from the stalk, out to the right, its face turned to the front camera (all under y ~0.6, as before)
    leaf2(p, (0.03, 0.47, 0.02), (0.93, 0.25, 0.12), (-0.18, 0.3, 0.94), 0.37, 0.12, bend=0.6)
    gloss(p, on_wall(prof, 0.13, -0.52), w=0.045, h=0.095, spin=-24, dot=(0.0, -0.155, 0.028))
    finish(p, 0.45)


def pear():
    p = Prop('prop_m_pear', base=0xffffff, target_faces=1400, voxel=0.011)
    prof = rounded([(0, -0.44), (0.22, -0.47), (0.41, -0.37), (0.47, -0.17), (0.43, 0.02), (0.32, 0.16), (0.24, 0.3), (0.21, 0.45), (0.14, 0.56), (0.05, 0.59), (0, 0.575)], 0.07, n=4)
    p.lathe(prof, seg=40)
    p.paint_fn(lambda q, n: math.hypot(q.x, q.z) < 0.07 and q.y > 0.55, DIMPLE)
    stem(p, [(0, 0.56, 0), (0.02, 0.68, 0), (0.07, 0.78, 0)], 0.03)
    leaf(p, (0.04, 0.68, 0.02), 0.27, 0.14, yaw=-30, tilt=18)
    shine(p, prof, -0.12, ang=-0.62, w=0.055, h=0.11)
    finish(p, 0.45)


def orange():
    p = Prop('prop_m_orange', base=0xffffff, target_faces=1400, voxel=0.011)
    prof = roundprof(0.5, 0.46, top=0.03, bot=0.02, bulge=0.0)
    p.lathe(prof, seg=44)
    p.paint_fn(lambda q, n: math.hypot(q.x, q.z) < 0.07 and q.y > 0.4, DIMPLE)
    # green star calyx on top
    p.layer('calyx', base=LEAF_D, target_faces=200, voxel=0.007)
    for k in range(5):
        a = k / 5 * math.tau
        p.blob((0.05 * math.sin(a), 0.455, 0.05 * math.cos(a)), (0.03, 0.015, 0.055), rot=(0, math.degrees(a), 0), group='c')
    p.layer('skin')
    stem(p, [(0, 0.44, 0), (0.01, 0.55, 0), (0.03, 0.62, 0)], 0.03)
    leaf(p, (0.03, 0.56, 0.02), 0.28, 0.15, yaw=-25, tilt=15)
    shine(p, prof, 0.17, ang=-0.6)
    finish(p, 0.47)


def plum():
    p = Prop('prop_m_plum', base=0xffffff, target_faces=3200, voxel=0.008)
    prof = roundprof(0.44, 0.47, top=0.05, bot=0.0, bulge=-0.04)
    p.lathe(prof, seg=56, scale=(0.94, 0.94))
    # the crease down one side: one smooth gently curved band, a soft shade darker (finely meshed: no jagged edge)
    SEAM = math.atan2(0.68, 0.73)
    p.paint_fn(lambda q, n: abs(math.atan2(q.x, q.z) - SEAM - 0.08 * math.sin((q.y + 0.3) / 0.7 * math.pi)) < 0.07 and -0.28 < q.y < 0.4, 0xb4b4b4)
    p.paint_fn(lambda q, n: math.hypot(q.x, q.z) < 0.06 and q.y > 0.38, DIMPLE)
    stem(p, [(0, 0.42, 0), (0.0, 0.52, 0), (0.03, 0.6, 0)], 0.026)
    leaf(p, (0.02, 0.53, 0.02), 0.26, 0.14, yaw=-150, tilt=15)
    shine(p, prof, 0.12, ang=-0.55, w=0.045, h=0.11)
    finish(p, 0.45)


def lemon():
    p = Prop('prop_m_lemon', base=0xffffff, target_faces=1200, voxel=0.011)
    p.blob((0, 0, 0), (0.5, 0.39, 0.39), group='b')
    for s in (-1, 1):
        p.blob((s * 0.5, 0.01, 0), (0.1, 0.085, 0.085), group='b')
        p.blob((s * 0.6, 0.015, 0), (0.05, 0.045, 0.045), group='b')
    p.paint_fn(lambda q, n: abs(q.x) > 0.62, 0xd2d2d2)
    leaf(p, (-0.05, 0.36, 0.02), 0.28, 0.15, yaw=-25, tilt=30)
    p.layer('shine', base=0xffffff, target_faces=160, voxel=0.006)
    p.blob((-0.2, 0.2, 0.3), (0.1, 0.035, 0.012), rot=(-35, -25, 12), group='sh')
    p.layer('skin')
    p.bone('body', (0, -0.4, 0), (0, 0.4, 0))
    p.extras.update(argMode='tint', argDefault=0xfff04a, outline=0.02)
    p.build()


def strawberry():
    p = Prop('prop_m_strawberry', base=0xffffff, target_faces=1400, voxel=0.011)
    prof = rounded([(0, -0.56), (0.09, -0.52), (0.26, -0.3), (0.42, -0.02), (0.46, 0.2), (0.4, 0.36), (0.2, 0.44), (0, 0.42)], 0.09, n=4)
    p.lathe(prof, seg=40)
    # seeds: little golden pips in rows (own layer)
    p.layer('seeds', base=SEED, target_faces=700, voxel=0.006)
    for row in range(5):
        y = 0.24 - row * 0.15
        n = [11, 11, 9, 7, 4][row]
        for k in range(n):
            a = (k + 0.5 * (row % 2)) / n * math.tau
            r = prof_r(prof, y) - 0.005
            p.blob((r * math.sin(a), y, r * math.cos(a)), (0.026, 0.04, 0.026), rot=(0, math.degrees(a), 0), group='s%d_%d' % (row, k))
    p.layer('skin')
    # leafy green calyx and a stalk
    p.layer('leaf', base=LEAF, target_faces=600, voxel=0.008)
    for k in range(6):
        a = k / 6 * math.tau + 0.3
        d = (math.sin(a), math.cos(a))
        for t, w in [(0.08, 0.06), (0.17, 0.07), (0.26, 0.045)]:
            p.blob((d[0] * t, 0.43 - t * 0.28, d[1] * t), (0.05, 0.022, w), rot=(0, math.degrees(a) + 90, 18), group='l%d' % k)
    p.blob((0, 0.44, 0), (0.1, 0.04, 0.1), group='c')
    p.paint_fn(lambda q, n: q.y < 0.385, LEAF_D)
    p.layer('skin')
    stem(p, [(0, 0.44, 0), (0.01, 0.53, 0), (0.04, 0.6, 0)], 0.032, col=LEAF_D)
    shine(p, prof, 0.12, ang=-0.62, w=0.05, h=0.1)
    finish(p, 0.5)


def blueberry():
    # small and used by the dozen: kept to ~650 triangles. A plump round berry with a five-pointed crown (painted a shade
    # darker than the berry) standing up round a dark top well, and a gloss highlight.
    p = CProp('prop_m_blueberry', base=0xffffff).raw().facepaint()
    prof = [(0.455 * math.sin(math.pi * i / 13) ** 0.75, -0.37 * math.cos(math.pi * i / 13)) for i in range(14)]
    prof[0], prof[-1] = (0, -0.35), (0, 0.3)
    p.lathe(prof, seg=16)
    # (the crown is part of the skin mesh, so every caller tints it with the berry, a shade darker)
    N, verts, faces = 25, [], []
    for i in range(N):
        a = i / N * math.tau
        f = ((math.cos(5 * a) + 1) / 2) ** 1.5
        sec = [(0.07, 0.285), (0.125 + 0.05 * f, 0.31), (0.095 + 0.07 * f, 0.35 + 0.06 * f)]
        verts += [(r * math.sin(a), y, r * math.cos(a)) for r, y in sec]
    for i in range(N):
        j = (i + 1) % N
        for k in range(3):
            k2 = (k + 1) % 3
            faces.append((i * 3 + k, j * 3 + k, j * 3 + k2, i * 3 + k2))
    p.mesh(verts, faces)
    # face by face (no extra cuts: the crown is its own piece and the well is the lathe's top fan)
    top = prof[::-1][:5]                                    # the profile from the top pole outward

    def above_body(q):
        r = math.hypot(q.x, q.z)
        for (r0, y0), (r1, y1) in zip(top, top[1:]):
            if r0 <= r <= r1:
                return q.y > y0 + (y1 - y0) * (r - r0) / (r1 - r0) + 0.004
        return False
    p.paint_fn(lambda q, n: q.y > 0.28 and math.hypot(q.x, q.z) < 0.2 and above_body(q), 0x9a9aac)          # the crown
    p.paint_fn(lambda q, n: math.hypot(q.x, q.z) < 0.13 and 0.29 < q.y < 0.35 and n.y > 0.5 and not above_body(q), 0x55556a)   # the well
    p.layer('shine', base=0xffffff).raw()
    pillow(p, spun(rrect(0.036, 0.075, 0.034, n=3), -22), on_wall(prof, 0.1, -0.55), h=0.006, depth=0.022, under=None, lip=0.004, rings=())
    p.layer('skin')
    finish(p, 0.42)


def cherry():
    p = CProp('prop_m_cherry', base=0xffffff).raw()
    prof = roundprof(0.46, 0.4, top=0.11, bot=0.03, bulge=0.04, n=22, tw=0.3)
    p.lathe(prof, seg=28)
    k = max(range(len(prof)), key=lambda i: prof[i][1])
    RD = (prof[k][0] + prof[k + 1][0]) / 2
    p.paint_fn(lambda q, n: math.hypot(q.x, q.z) < RD and q.y > 0.1, DIMPLE)
    # a long springy stalk, thick enough to read against green leaves, with a leaf at the top
    stalk(p, [(0, 0.27, 0), (0.0, 0.45, 0.0), (0.05, 0.64, 0.0), (0.14, 0.8, 0.0), (0.24, 0.9, 0.0)], 0.04, 0.032, col=0x5f8a2c)
    leaf2(p, (0.22, 0.89, 0.01), (0.92, 0.12, 0.2), (-0.15, 0.4, 0.9), 0.36, 0.115, bend=0.7)
    gloss(p, on_wall(prof, 0.12, -0.52), w=0.042, h=0.09, spin=-24, dot=(0.0, -0.15, 0.026))
    p.bone('body', (0, -0.42, 0), (0, 0.9, 0))
    p.extras.update(argMode='tint', argDefault=0xd8143a, outline=0.02)
    p.build()


def banana():
    p = Prop('prop_m_banana', base=0xffffff, target_faces=1400, voxel=0.011)
    pts, radii = [], []
    N = 7
    for i in range(N):
        t = i / (N - 1)
        a = math.radians(200 + 140 * t)
        pts.append((0.55 * math.cos(a), 0.42 + 0.55 * math.sin(a), 0))
        radii.append(0.06 + 0.12 * math.sin(math.pi * t) ** 0.6)
    p.curve(pts, radii, group='b', per=5)
    # soft ridges along the peel
    p.paint_fn(lambda q, n: abs(n.z) < 0.16 and abs(q.x) < 0.42, 0xe4e4e4)
    p.layer('tips', base=0x6b4a2a, target_faces=260, voxel=0.007)
    e0, e1 = pts[0], pts[-1]
    p.blob((e0[0] - 0.03, e0[1] + 0.05, 0), (0.04, 0.045, 0.04), group='t0')
    p.capsule((e1[0] - 0.01, e1[1] - 0.02, 0), (e1[0] + 0.04, e1[1] + 0.1, 0), 0.04, group='t1', r2=0.035)
    p.layer('skin')
    p.layer('shine', base=0xffffff, target_faces=160, voxel=0.006)
    for i in range(3):
        t = 0.38 + i * 0.06
        a = math.radians(200 + 140 * t)
        p.blob((0.55 * math.cos(a) * 0.98, 0.42 + 0.55 * math.sin(a) * 0.98 + 0.03, 0.15), (0.05, 0.025, 0.012), rot=(0, 0, math.degrees(a) + 90), group='sh')
    p.layer('skin')
    p.bone('body', (0, -0.2, 0), (0, 0.4, 0))
    p.extras.update(argMode='tint', argDefault=0xffd23f, outline=0.02)
    p.build()


def grapes():
    p = Prop('prop_m_grapes', base=0xffffff, target_faces=2200, voxel=0.011)
    P = [(-0.26, 0.25, 0.0), (0, 0.27, 0.05), (0.26, 0.25, 0.0), (-0.13, 0.04, 0.1), (0.13, 0.04, 0.1), (-0.37, 0.07, -0.1), (0.37, 0.07, -0.1),
         (0, -0.17, 0.1), (-0.24, -0.15, -0.02), (0.24, -0.15, -0.02), (0, -0.37, 0.04), (0, 0.16, -0.17), (-0.13, -0.02, -0.17), (0.13, -0.02, -0.17)]
    # alternate berries go in a second tinted layer ('tint2', tinted by the game like the skin) so each berry keeps
    # its own ink outline where it overlaps its neighbour
    front = [i for i, q in enumerate(P) if q[2] >= 0.04 and i % 2 == 1]
    for i, (x, y, z) in enumerate(P):
        r = 0.14 if y > -0.3 else 0.125
        if i in front:
            p.layer('tint2', base=0xffffff, target_faces=900, voxel=0.01)
        p.blob((x, y, z), (r, r * 1.05, r), group='g%d' % i)
        p.layer('skin')
    # one small round highlight per front grape: a smooth flush lens (clean oval ink, no scribble)
    p.layer('shine', base=0xffffff, target_faces=1400, voxel=0.004)
    for i, (x, y, z) in enumerate(P):
        if z >= 0.04:
            r = 0.14
            d = (-0.38, 0.42, 0.82)
            p.blob((x + d[0] * r * 0.97, y + d[1] * r * 0.97, z + d[2] * r * 0.97), (0.03, 0.03, 0.008), rot=(-25, -25, 0), group='s%d' % i)
    p.layer('skin')
    stem(p, [(0, 0.3, -0.02), (0.0, 0.44, -0.02), (0.05, 0.54, -0.02)], 0.034, col=0x6b4a2a)
    p.layer('leaf', base=LEAF, target_faces=500, voxel=0.008)
    for k, (dx, dy, s) in enumerate([(0.0, 0.0, 1.0), (-0.1, -0.05, 0.75), (0.1, -0.05, 0.75)]):
        p.blob((0.2 + dx, 0.48 + dy, -0.05), (0.09 * s, 0.025, 0.08 * s), rot=(0, 0, 25), group='lf')
    p.paint_fn(lambda q, n: abs(q.z + 0.05) < 0.008 and n.y > 0.2, LEAF_D)
    p.layer('skin')
    p.bone('body', (0, -0.45, 0), (0, 0.5, 0))
    p.extras.update(argMode='tint', argDefault=0x5fd068, outline=0.02)
    p.build()


MODELS = dict(prop_m_apple=apple, prop_m_pear=pear, prop_m_orange=orange, prop_m_plum=plum, prop_m_lemon=lemon, prop_m_strawberry=strawberry,
              prop_m_blueberry=blueberry, prop_m_cherry=cherry, prop_m_banana=banana, prop_m_grapes=grapes)
for name, fn in MODELS.items():
    if not ONLY or name in ONLY:
        fn()
