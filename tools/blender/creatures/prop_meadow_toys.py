"""Toys and craft things for the meadow games (Colour tubes L1 + L3, Big and small, Feelings, Shape house goodies).
Models: prop_m_toyball, prop_m_beachball, prop_m_pompom, prop_m_puffstar, prop_m_block, prop_m_crayon, prop_m_paintpot, prop_m_car,
prop_m_brush, prop_m_button, prop_m_marble.   ONLY=prop_m_car tools/blender/build.sh prop_meadow_toys  builds a subset.

All TINTABLE (argMode 'tint'): the main colour is painted white/grey and multiplied by the game's colour; white details,
wheels, paper wrappers and metal are separate layers that keep their colours. Layers named shine* are gloss stickers
(the game hides their ink outline). Faces (smiley ball, pompom, star) are the game's expressive code face on a
face anchor (bone 'body'). Everything centred on the origin unless noted, facing +z."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded, circle_poly, star_poly, rot_m

ONLY = [s for s in os.environ.get('ONLY', '').split(',') if s]
WHITE, INK = 0xffffff, 0x3a2838
TAU = math.tau


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


def on_ball(R, d, spin=0.0):
    """to3d for a sticker on a sphere of radius R (centre at origin) centred in direction d, turned by spin (deg)"""
    d = Vector(d).normalized()
    up = Vector((0, 1, 0)) if abs(d.y) < 0.95 else Vector((1, 0, 0))
    u = up.cross(d).normalized()
    v = d.cross(u)
    cs, sn = math.cos(math.radians(spin)), math.sin(math.radians(spin))
    def f(x, y, z):
        x, y = x * cs - y * sn, x * sn + y * cs
        r = math.hypot(x, y)
        if r < 1e-9:
            return d * (R + z)
        a = r / R
        return (d * math.cos(a) + (u * x + v * y) / r * math.sin(a)) * (R + z)
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


def rstar(ro, ri, rt=0.03, rv=0.022, n=5, rot=90, arc=5):
    """a five-point star with properly rounded tips (radius rt) and valleys (rv)"""
    pts = []
    for i in range(n * 2):
        a = math.radians(rot + 180 * i / n)
        r = ro if i % 2 == 0 else ri
        pts.append((r * math.cos(a), r * math.sin(a)))
    return fillet_poly(pts, [rt if i % 2 == 0 else rv for i in range(n * 2)], n=arc)


def rtri(r, rr=0.04):
    return fillet_poly([(r * math.cos(math.radians(90 + 120 * i)), r * math.sin(math.radians(90 + 120 * i)) - r * 0.12) for i in range(3)], rr, n=6)


def sphere_prof(R, n=24):
    return [(R * math.sin(math.pi * i / n), -R * math.cos(math.pi * i / n)) for i in range(n + 1)]


def on_sphere(p, R, d, size, group, lift=0.0):
    """a flat blob (size = (w, h, thickness)) lying on a sphere of radius R in unit direction d"""
    l = math.sqrt(sum(c * c for c in d)); d = [c / l for c in d]
    pitch = -math.degrees(math.asin(max(-1, min(1, d[1]))))
    yaw = math.degrees(math.atan2(d[0], d[2]))
    p.blob(tuple(c * (R + lift) for c in d), size, rot=(pitch, yaw, 0), group=group)


def fib(n):
    out = []
    for i in range(n):
        y = 1 - 2 * (i + 0.5) / n
        r = math.sqrt(1 - y * y)
        a = i * 2.39996
        out.append((r * math.cos(a), y, r * math.sin(a)))
    return out


def tinted(p, h, default, outline=0.022):
    if not any(b[0] == 'body' for b in p.bones):
        p.bone('body', (0, -h, 0), (0, h, 0))
    p.extras['argMode'] = 'tint'
    p.extras['argDefault'] = default
    p.extras['outline'] = outline
    p.build()


def band_ring(p, R, half_w, rot, h=0.018, depth=0.03, under=0.02, lip=0.005, seg=56, steps=6):
    """a raised band round a ball (radius R) with undercut, inked edges: a ring section revolved about the tilted axis"""
    w = half_w / R
    def P(rho, th):
        return (rho * math.sin(th), rho * math.cos(th))
    c = math.pi / 2
    a0, a1 = c - w + lip / R, c + w - lip / R
    prof = [P(R + h, a0 + (a1 - a0) * i / steps) for i in range(steps + 1)]
    prof += [P(R + h - lip * 0.7, c + w), P(R, c + w - under / R), P(R - depth, c + w - under / R),
             P(R - depth, c - w + under / R), P(R, c - w + under / R), P(R + h - lip * 0.7, c - w)]
    p.lathe(prof, rot=rot, seg=seg, closed=True)


def toyball():
    R = 0.44
    p = RawProp('prop_m_toyball', base=WHITE).raw()
    p.lathe(sphere_prof(R, 18), seg=36)
    # white band round the ball: a clean raised ring, inked on both edges
    p.layer('band', base=WHITE).raw()
    band_ring(p, R, 0.07, rot=(24, 0, -14))
    p.layer('skin')
    # a white star sticker on the front (inked all round)
    p.layer('star', base=WHITE).raw()
    pillow(p, rstar(0.15, 0.072, rt=0.028, rv=0.02, arc=4), on_ball(R, (0.104, 0.15, 0.405)), h=0.013)
    p.layer('skin')
    # polka dots all round (shown for the dotty ball)
    p.layer('dots', base=WHITE).raw()
    for d in fib(14):
        pillow(p, circle_poly(0.085, n=14), on_ball(R, d), h=0.012, rings=(0.5,))
    p.layer('skin')
    # one neat rounded gloss highlight (no ink)
    p.layer('shine', base=WHITE).raw()
    pillow(p, rrect(0.026, 0.068, 0.025, n=4), on_ball(R, (-0.5, 0.5, 0.71), spin=-38), h=0.006, depth=0.02, under=None, lip=0.004, rings=(0.5,))
    p.layer('skin')
    p.bone('body', (0, -R, 0), (0, R, 0))
    p.face((0, 0.0, 0.0), 0.44, bone='body', faceScale=0.95)
    tinted(p, R, 0xff5a5a, 0.022)


def shell_patch(p, f, us, vs, t_out, t_in):
    """a thin closed shell over the (u, v) grid of the surface f(u, v, z) (z = height off the surface)"""
    nu, nv = len(us), len(vs)
    verts = [tuple(f(u, v, z)) for z in (t_out, t_in) for u in us for v in vs]
    ix = lambda L, i, j: L * nu * nv + i * nv + j
    faces = []
    for i in range(nu - 1):
        for j in range(nv - 1):
            faces.append((ix(0, i, j), ix(0, i + 1, j), ix(0, i + 1, j + 1), ix(0, i, j + 1)))
            faces.append((ix(1, i, j), ix(1, i, j + 1), ix(1, i + 1, j + 1), ix(1, i + 1, j)))
    loop = [(0, j) for j in range(nv)] + [(i, nv - 1) for i in range(1, nu)] + [(nu - 1, j) for j in range(nv - 2, -1, -1)] + [(i, 0) for i in range(nu - 2, 0, -1)]
    for k in range(len(loop)):
        (i0, j0), (i1, j1) = loop[k], loop[(k + 1) % len(loop)]
        faces.append((ix(0, i0, j0), ix(1, i0, j0), ix(1, i1, j1), ix(0, i1, j1)))
    p.mesh(verts, faces)


def edge_lin(a, b, n, e=0.012):
    """n+1 samples from a to b plus extra ones just inside each end (keeps the edge normals out of the face)"""
    mid = [a + (b - a) * i / n for i in range(1, n)]
    return [a, a + e * (1 if b > a else -1)] + mid + [b - e * (1 if b > a else -1), b]


def beachball():
    R = 0.44
    p = RawProp('prop_m_beachball', base=WHITE).raw()
    p.lathe(sphere_prof(R, 18), seg=40)
    # three white lune panels from pole to pole (crisp printed borders, no ink: layers named shine* lose their outline)
    p.layer('shine_panels', base=WHITE).raw()
    sph = lambda th, ph, z: ((R + z) * math.sin(th) * math.sin(ph), (R + z) * math.cos(th), (R + z) * math.sin(th) * math.cos(ph))
    for k in range(3):
        a0 = k * TAU / 3 + TAU / 12      # a coloured panel faces the front, white ones either side
        shell_patch(p, sph, edge_lin(0.2, math.pi - 0.2, 16), edge_lin(a0, a0 + TAU / 6, 5, 0.01), 0.004, -0.014)
    p.layer('skin')
    # round white buttons where the panels meet (top and bottom), inked
    p.layer('cap', base=WHITE).raw()
    for d in ((0, 1, 0), (0, -1, 0)):
        pillow(p, circle_poly(0.11, n=20), on_ball(R, d), h=0.022)
    p.paint_fn(lambda q, n: math.hypot(q.x, q.z) < 0.038 and abs(q.y) > R, 0xdfe6ee)
    p.layer('skin')
    p.layer('shine', base=WHITE).raw()
    pillow(p, rrect(0.026, 0.07, 0.025, n=4), on_ball(R, (-0.3, 0.52, 0.8), spin=-30), h=0.007, depth=0.02, under=None, lip=0.004, rings=(0.5,))
    p.layer('skin')
    tinted(p, R, 0x4a90ff)


def pompom():
    p = Prop('prop_m_pompom', base=WHITE, target_faces=2400, voxel=0.011, smooth=2)
    p.blob((0, 0, 0), (0.34, 0.34, 0.34), group='core')
    for i, d in enumerate(fib(46)):
        p.blob(tuple(c * 0.34 for c in d), (0.105, 0.105, 0.105), group='core', stiffness=2.6)
    p.paint_fn(lambda q, n: (q.x * n.x + q.y * n.y + q.z * n.z) / max(0.01, q.length) < 0.75, 0xd6d6d6)
    p.bone('body', (0, -0.45, 0), (0, 0.45, 0))
    p.face((0, -0.02, 0.0), 0.43, bone='body', faceScale=0.92)
    tinted(p, 0.45, 0xffd23f)


def puffstar():
    p = Prop('prop_m_puffstar', base=WHITE, target_faces=1600, voxel=0.011)
    p.blob((0, 0, 0), (0.27, 0.27, 0.17), group='s')
    for k in range(5):
        a = math.radians(90 + 72 * k)
        for i in range(7):
            t = i / 6
            r = 0.2 - 0.13 * t
            L = 0.12 + 0.39 * t
            p.blob((L * math.cos(a), L * math.sin(a), 0), (r, r, r * 0.78), group='s')
    p.paint_fn(lambda q, n: abs(n.z) < 0.35, 0xe6e6e6)
    p.layer('shine', base=WHITE, target_faces=160, voxel=0.006)
    p.blob((-0.12, 0.3, 0.115), (0.03, 0.07, 0.01), rot=(-12, -18, 20), group='sh')
    p.layer('skin')
    p.bone('body', (0, -0.45, 0), (0, 0.5, 0))
    p.face((0, -0.02, 0.0), 0.3, bone='body', faceScale=1.0)
    tinted(p, 0.45, 0xffd23f)


def block():
    S = 0.39
    p = RawProp('prop_m_block', base=WHITE).raw(hard=True)
    # a chunky rounded toy cube: true flat faces (hardened normals, so the toon light never bands across a face)
    p.box((0, 0, 0), (S, S, S), bevel=0.11)
    # a raised, inked sticker in the middle of every face, well clear of the rounded edges
    p.layer('deco', base=WHITE).raw()
    star = rstar(0.215, 0.1, rt=0.035, rv=0.03, arc=4)
    faces = [((0, 0, 1), star), ((0, 0, -1), star),
             ((1, 0, 0), rtri(0.2, 0.045)), ((-1, 0, 0), rrect(0.14, 0.14, 0.045, n=4)),
             ((0, 1, 0), circle_poly(0.155, n=24)), ((0, -1, 0), circle_poly(0.155, n=24))]
    for n, poly in faces:
        o = tuple(c * S for c in n)
        pillow(p, poly, on_plane(o, n), h=0.018)
    p.layer('skin')
    tinted(p, S, 0x5fd068)


def crayon():
    p = Prop('prop_m_crayon', base=WHITE, target_faces=1100, voxel=0.01)
    L, R = 0.42, 0.17
    # lying along x, tip at +x
    p.lathe(rounded([(0, -L), (R, -L), (R, L), (0.06, L + 0.3), (0, L + 0.31)], 0.04, n=3), rot=(0, 0, -90), seg=10)
    p.layer('paper', base=WHITE, target_faces=700, voxel=0.008)
    p.lathe([(R - 0.01, -L + 0.06), (R + 0.022, -L + 0.06), (R + 0.022, L - 0.08), (R - 0.01, L - 0.08)], rot=(0, 0, -90), seg=10, closed=True)
    p.paint_fn(lambda q, n: abs(q.x - (-L + 0.17)) < 0.035 or abs(q.x - (L - 0.19)) < 0.035, INK)
    p.paint_fn(lambda q, n: abs(q.x) < 0.14 and q.y > 0.0 and abs(q.z) < 0.12, 0xf2f2f2)
    p.layer('skin')
    p.bone('body', (-L, 0, 0), (L, 0, 0))
    tinted(p, L, 0xff5a5a)


def paintpot():
    """a round paint pot brimming with (tinted) paint that drips over the rim and down onto the white label, a brush in it"""
    p = RawProp('prop_m_paintpot', base=WHITE).raw()
    YB, YT, R = -0.29, 0.17, 0.31
    # the pot (tinted): a tucked-under foot, softly bellied wall, a fat rolled rim; inside wall a shade darker
    wall = [(0, YB), (R - 0.06, YB), (R - 0.01, YB + 0.035), (R + 0.014, YB + 0.13), (R + 0.02, YB + 0.27), (R + 0.01, YT - 0.06),
            (R, YT - 0.01), (R - 0.045, YT - 0.01), (R - 0.05, YT - 0.06), (0, YT - 0.06)]
    p.lathe(rounded(wall, 0.03, n=2), seg=32)
    p.ring((0, YT, 0), R - 0.008, 0.042, seg=32, rseg=8)
    p.paint_fn(lambda q, n: math.hypot(q.x, q.z) < R - 0.03 and q.y > YT - 0.07, 0xbcbcbc)
    # a white label band round the middle of the wall (inked edges)
    p.layer('label', base=WHITE).raw()
    y0, y1 = -0.17, -0.04
    lab = [(R + 0.01, y0), (R + 0.036, y0 + 0.006), (R + 0.04, y0 + 0.016), (R + 0.04, y1 - 0.016), (R + 0.036, y1 - 0.006), (R + 0.01, y1),
           (R - 0.03, y1 - 0.01), (R - 0.03, y0 + 0.01)]
    p.lathe(lab, seg=32, closed=True)
    p.layer('skin')
    # the paint (tinted): one gooey piece - a brimming pool that spills over the rim in fat drips ending in round drops
    p.layer('tint_paint', base=WHITE, voxel=0.009, target_faces=1300)
    p.blob((0, YT + 0.012, 0), (R - 0.01, 0.034, R - 0.01), group='paint')
    for a, l, w in [(0.32, 0.25, 1.0), (-0.55, 0.15, 0.85), (1.85, 0.2, 0.95), (-2.1, 0.12, 0.8), (3.0, 0.16, 0.85)]:
        sx, cz = math.sin(a), math.cos(a)
        # the drip rides ON the wall / label (centre well out from the surface, so its ink isn't hidden by the label)
        surf = lambda y: R + 0.04 if y0 - 0.01 < y < y1 + 0.01 else R + 0.016
        ya, yb = YT - 0.04 - l * 0.55, YT - 0.03 - l
        prof = [(R - 0.02, YT + 0.03, 0.05), (R + 0.035, YT + 0.025, 0.052), (R + 0.055, YT - 0.035, 0.042),
                (surf(ya) + 0.032 * 0.6, ya, 0.032), (surf(yb) + 0.045 * 0.6, yb, 0.045)]
        p.curve([(r * sx, y, r * cz) for r, y, _ in prof], [rad * w for _, _, rad in prof], group='paint', per=3)
    p.layer('skin')
    # a chunky paintbrush standing in the paint, leaning back to the right: silver ferrule, wooden handle, round end
    p.layer('brush', base=0xdca066).raw()
    rot = (-12, 0, -24)
    base = Vector((0.06, YT - 0.05, -0.06))
    p.lathe(rounded([(0, 0.0), (0.05, 0.0), (0.052, 0.15), (0.034, 0.19), (0.036, 0.29), (0.047, 0.35), (0.044, 0.38), (0.03, 0.398), (0.0, 0.405)], 0.015, n=2),
            pos=tuple(base), rot=rot, seg=14)
    ax = rot_m(rot) @ Vector((0, 1, 0))
    p.paint_fn(lambda q, n: (q - base).dot(ax) < 0.165, 0xd2dbe6)
    p.paint_fn(lambda q, n: abs((q - base).dot(ax) - 0.12) < 0.012, 0xa4b1c2)
    p.layer('skin')
    p.bone('body', (0, YB, 0), (0, 0.5, 0))
    tinted(p, 0.3, 0xffd23f)


def car():
    p = RawProp('prop_m_car', base=WHITE, target_faces=1800)
    # facing +x (drives to the right); body + cab one clay piece
    p.box((0, 0.0, 0), (0.5, 0.15, 0.27), bevel=0.11)
    p.box((-0.07, 0.2, 0), (0.27, 0.15, 0.24), bevel=0.085)
    p.blob((0.38, 0.06, 0), (0.12, 0.08, 0.22), group='nose')
    # windows: raised, inked glass panes on the cab (two each side, windscreen, rear), each with a white glint
    p.layer('glass', base=0xc4e9ff).raw()
    cz, cx0, cx1, cy = 0.24 - 0.006, -0.34 + 0.006, 0.20 - 0.006, 0.215
    for s in (-1, 1):
        for xc, hw in ((-0.205, 0.075), (0.045, 0.085)):
            pillow(p, rrect(hw, 0.062, 0.03, n=2), on_plane((xc, cy, s * cz), (0, 0, s)), h=0.014, rings=(0.5,))
    pillow(p, rrect(0.165, 0.062, 0.035, n=2), on_plane((cx1, cy, 0), (1, 0, 0)), h=0.014, rings=(0.5,))
    pillow(p, rrect(0.15, 0.055, 0.035, n=2), on_plane((cx0, cy, 0), (-1, 0, 0)), h=0.014, rings=(0.5,))
    glint = lambda q, n: (abs(n.z) > 0.5 and abs(((q.x + 0.205 if q.x < -0.08 else q.x - 0.045) - (q.y - cy) * 0.9) + 0.02) < 0.016) or \
        (n.x > 0.5 and abs((q.z - (q.y - cy) * 1.1) + 0.06) < 0.02) or (n.x < -0.5 and abs((q.z + (q.y - cy) * 1.1) - 0.05) < 0.018)
    p.paint_fn(lambda q, n: glint(q, n) and max(abs(n.x), abs(n.z)) > 0.9, 0xffffff)
    p.layer('skin')
    # chunky soft tyres
    p.layer('wheels', base=0x4a4250).raw()
    tyre = rounded([(0, -0.055), (0.07, -0.055), (0.145, -0.055), (0.145, 0.055), (0.07, 0.055), (0, 0.055)], 0.04, n=2)
    for x in (-0.3, 0.3):
        for z in (-0.255, 0.255):
            p.lathe(tyre, pos=(x, -0.16, z), rot=(90, 0, 0), seg=18)
    p.layer('skin')
    # hubcaps: raised silver discs with a little centre cap (inked)
    p.layer('hubs', base=0xe6ebf2).raw()
    for x in (-0.3, 0.3):
        for s in (-1, 1):
            pillow(p, circle_poly(0.072, n=16), on_plane((x, -0.16, s * 0.31), (0, 0, s)), h=0.018, rings=(0.55,))
    p.paint_fn(lambda q, n: math.hypot(q.x - (0.3 if q.x > 0 else -0.3), q.y + 0.16) < 0.028 and abs(q.z) > 0.325, 0x9aa6b6)
    p.layer('skin')
    # head lamps (front) and red tail lamps (back)
    p.layer('lights', base=0xfff2a0).raw()
    for z in (-0.15, 0.15):
        pillow(p, circle_poly(0.042, n=14), on_plane((0.497, 0.06, z), (1, 0, 0)), h=0.014, rings=())
        pillow(p, rrect(0.03, 0.022, 0.018, n=2), on_plane((-0.497, 0.03, z * 1.2), (-1, 0, 0)), h=0.012, rings=())
    p.paint_fn(lambda q, n: q.x < 0, 0xff6a5a)
    p.layer('skin')
    p.bone('body', (0, -0.3, 0), (0, 0.4, 0))
    tinted(p, 0.35, 0x4a90ff)


def brush():
    p = Prop('prop_m_brush', base=WHITE, target_faces=1800, voxel=0.007)
    # upright artist's brush: long tapered handle (tinted), a clean silver ferrule with two crimp rings, cream bristles
    # that taper to a soft point, the point dipped in paint (tinted, part of the skin)
    p.lathe(rounded([(0, -0.62), (0.05, -0.61), (0.06, -0.4), (0.085, 0.0), (0.09, 0.1), (0, 0.1)], 0.03, n=3), seg=24)
    p.lathe(rounded([(0, 0.44), (0.088, 0.45), (0.075, 0.53), (0.04, 0.62), (0, 0.68)], 0.03, n=3), seg=24, scale=(1, 0.78))   # dipped tip
    p.layer('bristle', base=0xf6e7c8, target_faces=900, voxel=0.006)
    p.lathe(rounded([(0, 0.2), (0.1, 0.22), (0.112, 0.3), (0.1, 0.4), (0.085, 0.47), (0, 0.48)], 0.03, n=3), seg=24, scale=(1, 0.78))
    p.layer('skin')
    p.layer('ferrule', base=0xd6dde8, target_faces=900, voxel=0.006)
    p.lathe(rounded([(0.07, 0.06), (0.112, 0.06), (0.108, 0.25), (0.07, 0.25)], 0.012, n=2), seg=32, closed=True)
    for y in (0.11, 0.17):
        p.ring((0, y, 0), 0.112, 0.014, seg=32, rseg=8)
    p.paint_fn(lambda q, n: q.z > 0.04 and q.x < -0.02 and n.z > 0.3, 0xf2f6fb)
    p.layer('skin')
    p.layer('shine', base=WHITE, target_faces=100, voxel=0.006)
    p.blob((-0.05, -0.2, 0.07), (0.012, 0.16, 0.008), group='sh')
    p.layer('skin')
    p.bone('body', (0, -0.62, 0), (0, 0.7, 0))
    tinted(p, 0.6, 0x5fd068)


def button():
    p = Prop('prop_m_button', base=WHITE, target_faces=3600, voxel=0.006)
    # a chunky sewing button facing +z: a dished face inside a raised rolled rim, four clean round holes (dark crisp
    # circles on a finely meshed face, so their edges stay round)
    HOLES = [(-0.1, -0.1), (0.1, -0.1), (-0.1, 0.1), (0.1, 0.1)]
    prof = [(0, 0.045)] + [(0.31 * k / 12, 0.045 + 0.012 * (k / 12) ** 2) for k in range(1, 13)] + [(0.4, 0.07), (0.45, 0.04), (0.46, 0.0), (0.45, -0.05), (0.4, -0.07), (0, -0.07)]
    p.lathe(rounded(prof, 0.03, n=3), rot=(90, 0, 0), seg=72)
    p.ring((0, 0, 0.055), 0.385, 0.05, rot=(90, 0, 0), seg=72, rseg=12)
    p.paint_fn(lambda q, n: math.hypot(q.x, q.y) < 0.33 and n.z > 0.5, 0xe6e6e6)
    p.paint_fn(lambda q, n: min(math.hypot(q.x - x, q.y - y) for x, y in HOLES) < 0.05 and q.z > 0.02, 0x6e6e78)
    p.layer('shine', base=WHITE, target_faces=160, voxel=0.006)
    p.blob((-0.2, 0.26, 0.11), (0.07, 0.025, 0.012), rot=(0, 0, 35), group='sh')
    p.layer('skin')
    p.bone('body', (0, -0.46, 0), (0, 0.46, 0))
    tinted(p, 0.46, 0xff5a5a)


def marble():
    R = 0.2
    p = Prop('prop_m_marble', base=WHITE, target_faces=1400, voxel=0.006)
    p.lathe(sphere_prof(R, 20), seg=32)
    # one smooth S-shaped swirl ribbon set into the glass (tapering to nothing at both ends: no blunt end caps)
    p.layer('swirl', base=WHITE, target_faces=700, voxel=0.005)
    pts = []
    for i in range(64):                      # a closed wavy ribbon round the marble (no ends to ink)
        a = i / 64 * math.tau
        y = 0.07 * math.sin(2 * a) + 0.03 * math.sin(a)
        r = math.sqrt(max(0.0, R * R - y * y)) - 0.008
        pts.append((r * math.sin(a), y, r * math.cos(a)))
    p.tube(pts, 0.03, closed=True, rseg=12)
    p.layer('skin')
    p.layer('shine', base=WHITE, target_faces=80, voxel=0.005)
    on_sphere(p, R, (-0.45, 0.55, 0.7), (0.03, 0.045, 0.008), 'sh', lift=0.002)
    p.layer('skin')
    tinted(p, R, 0x7fd6ff, 0.016)


MODELS = dict(prop_m_toyball=toyball, prop_m_beachball=beachball, prop_m_pompom=pompom, prop_m_puffstar=puffstar, prop_m_block=block,
              prop_m_crayon=crayon, prop_m_paintpot=paintpot, prop_m_car=car, prop_m_brush=brush, prop_m_button=button, prop_m_marble=marble)
for name, fn in MODELS.items():
    if not ONLY or name in ONLY:
        fn()
