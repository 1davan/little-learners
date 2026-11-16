"""Toys and craft things for the meadow games (Colour tubes L1 + L3, Big and small, Feelings, Shape house goodies).
Models: prop_m_toyball, prop_m_beachball, prop_m_pompom, prop_m_puffstar, prop_m_block, prop_m_crayon, prop_m_paintpot, prop_m_car,
prop_m_brush, prop_m_button, prop_m_marble.   ONLY=prop_m_car tools/blender/build.sh prop_meadow_toys  builds a subset.

All TINTABLE (argMode 'tint'): the main colour is painted white/grey and multiplied by the game's colour; white details,
wheels, paper wrappers and metal are separate layers that keep their colours. Layers named shine* are gloss stickers
(the game hides their ink outline). Faces (smiley ball, pompom, star) are the game's expressive code face on a
face anchor (bone 'body'). Everything centred on the origin unless noted, facing +z."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded, circle_poly, star_poly

ONLY = [s for s in os.environ.get('ONLY', '').split(',') if s]
WHITE, INK = 0xffffff, 0x3a2838
TAU = math.tau


def sphere_prof(R, n=24):
    return [(R * math.sin(math.pi * i / n), -R * math.cos(math.pi * i / n)) for i in range(n + 1)]


def on_sphere(p, R, d, size, group, lift=0.0):
    """a flat blob (size = (w, h, thickness)) lying on a sphere of radius R in unit direction d"""
    l = math.sqrt(sum(c * c for c in d)); d = [c / l for c in d]
    pitch = -math.degrees(math.asin(max(-1, min(1, d[1]))))
    yaw = math.degrees(math.atan2(d[0], d[2]))
    p.blob(tuple(c * (R + lift) for c in d), size, rot=(pitch, yaw, 0), group=group)


def disc_on_sphere(p, R, d, rad, thick=0.03):
    """a flat round sticker disc tangent to a sphere of radius R in direction d"""
    from mathutils import Vector
    l = math.sqrt(sum(c * c for c in d)); d = Vector([c / l for c in d])
    up = Vector((0, 1, 0)) if abs(d.y) < 0.95 else Vector((1, 0, 0))
    u = up.cross(d).normalized(); v = d.cross(u)
    n = 20
    verts, faces = [], []
    for k, off in enumerate((-thick * 0.6, thick * 0.4)):
        c = d * (R + off)
        verts.append(tuple(c))
        for i in range(n):
            a = TAU * i / n
            verts.append(tuple(c + u * (rad * math.cos(a)) + v * (rad * math.sin(a))))
    m = n + 1
    for i in range(n):
        j = (i + 1) % n
        faces.append((0, 1 + j, 1 + i)); faces.append((m, m + 1 + i, m + 1 + j))
        faces.append((1 + i, 1 + j, m + 1 + j, m + 1 + i))
    p.mesh(verts, faces)


def cap_on_sphere(p, R, d, ang, t_in=0.02, t_out=0.012, n=6):
    """a spherical-cap sticker (hugs the ball exactly) centred on direction d, angular radius ang (radians)"""
    l = math.sqrt(sum(c * c for c in d)); d = [c / l for c in d]
    th = math.degrees(math.acos(max(-1, min(1, d[1])))); ph = math.degrees(math.atan2(d[0], d[2]))
    ro, ri = R + t_out, R - t_in
    prof = [(0, ro)] + [(ro * math.sin(ang * i / n), ro * math.cos(ang * i / n)) for i in range(1, n + 1)]
    prof += [(ri * math.sin(ang * i / n), ri * math.cos(ang * i / n)) for i in range(n, 0, -1)] + [(0, ri)]
    p.lathe(prof, rot=(th, ph, 0), seg=20)


def fib(n):
    out = []
    for i in range(n):
        y = 1 - 2 * (i + 0.5) / n
        r = math.sqrt(1 - y * y)
        a = i * 2.39996
        out.append((r * math.cos(a), y, r * math.sin(a)))
    return out


def slab(p, poly, z, thick, rot=(0, 0, 0)):
    """a flat prism from a 2D polygon (around its own origin) at depth z facing +z, rotated by rot (deg) about the origin"""
    from kit import rot_m
    from mathutils import Vector
    M = rot_m(rot)
    m = len(poly)
    verts = []
    for d in (z - thick / 2, z + thick / 2):
        verts.append(tuple(M @ Vector((0, 0, d))))
        for x, y in poly:
            verts.append(tuple(M @ Vector((x, y, d))))
    faces = []
    k = m + 1
    for i in range(m):
        j = (i + 1) % m
        faces.append((0, 1 + j, 1 + i))
        faces.append((k, k + 1 + i, k + 1 + j))
        faces.append((1 + i, 1 + j, k + 1 + j, k + 1 + i))
    p.mesh(verts, faces)


def tinted(p, h, default, outline=0.022):
    if not any(b[0] == 'body' for b in p.bones):
        p.bone('body', (0, -h, 0), (0, h, 0))
    p.extras['argMode'] = 'tint'
    p.extras['argDefault'] = default
    p.extras['outline'] = outline
    p.build()


def toyball():
    R = 0.44
    p = Prop('prop_m_toyball', base=WHITE, target_faces=1300, voxel=0.011)
    p.lathe(sphere_prof(R), seg=44)
    # white band (a tilted ring round the ball)
    p.layer('band', base=WHITE, target_faces=700, voxel=0.008)
    band = [(R + 0.014) * math.sin(math.radians(a)) for a in (80, 100)]
    prof = [((R + 0.014) * math.sin(math.radians(a)), (R + 0.014) * math.cos(math.radians(a))) for a in range(78, 103, 3)]
    prof += [((R - 0.02) * math.sin(math.radians(a)), (R - 0.02) * math.cos(math.radians(a))) for a in range(102, 77, -3)]
    p.lathe(prof, rot=(24, 0, -14), seg=60, closed=True)
    p.layer('skin')
    # a white star on the front
    p.layer('star', base=WHITE, target_faces=300, voxel=0.007)
    p.sticker(star_poly(0.13, inner=0.48), 0.13, lambda y: math.sqrt(max(0.01, R * R - y * y)), thick=0.02, ang=0.25, lift=0.004)
    p.layer('skin')
    # polka dots all round (shown for the dotty ball)
    p.layer('dots', base=WHITE, target_faces=1100, voxel=0.006)
    for i, d in enumerate(fib(14)):
        cap_on_sphere(p, R, d, 0.2)
    p.layer('skin')
    p.layer('shine', base=WHITE, target_faces=160, voxel=0.006)
    on_sphere(p, R, (-0.45, 0.5, 0.74), (0.05, 0.085, 0.012), 'sh', lift=0.004)
    p.layer('skin')
    p.bone('body', (0, -R, 0), (0, R, 0))
    p.face((0, 0.0, 0.0), 0.44, bone='body', faceScale=0.95)
    tinted(p, R, 0xff5a5a, 0.022)


def beachball():
    R = 0.44
    p = Prop('prop_m_beachball', base=WHITE, target_faces=1300, voxel=0.011)
    p.lathe(sphere_prof(R), seg=48)
    p.layer('white', base=WHITE, target_faces=1200, voxel=0.008)
    prof = sphere_prof(R + 0.012, 30)
    for k in range(3):
        a0 = k * TAU / 3 - TAU / 12
        p.lathe(prof, a0=a0, a1=a0 + TAU / 6, seg=12)
    p.lathe(rounded([(0, R - 0.02), (0.1, R - 0.02), (0.1, R + 0.02), (0, R + 0.035)], 0.015, n=2), seg=20)
    p.lathe(rounded([(0, -R - 0.035), (0.1, -R - 0.02), (0.1, -R + 0.02), (0, -R + 0.02)], 0.015, n=2), seg=20)
    p.layer('skin')
    p.layer('shine', base=WHITE, target_faces=160, voxel=0.006)
    on_sphere(p, R, (-0.42, 0.52, 0.74), (0.05, 0.085, 0.012), 'sh', lift=0.008)
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
    p = Prop('prop_m_block', base=WHITE, target_faces=1200, voxel=0.011)
    p.box((0, 0, 0), (S, S, S), bevel=0.1)
    # a raised panel border on each face, painted a touch darker
    p.paint_fn(lambda q, n: max(abs(q.x), abs(q.y), abs(q.z)) > S - 0.02 and sorted([abs(q.x), abs(q.y), abs(q.z)])[1] > S - 0.09, 0xdcdcdc)
    p.layer('deco', base=WHITE, target_faces=1400, voxel=0.005)
    st = star_poly(0.25, inner=0.5)
    slab(p, st, S + 0.005, 0.03)
    slab(p, st, S + 0.005, 0.03, rot=(0, 180, 0))
    circ = circle_poly(0.17, n=28)
    slab(p, circ, S + 0.005, 0.03, rot=(0, 90, 0))
    slab(p, circ, S + 0.005, 0.03, rot=(0, -90, 0))
    sq = rounded([(-0.15, -0.15), (0.15, -0.15), (0.15, 0.15), (-0.15, 0.15)], 0.04, n=2, closed=True)
    slab(p, [q[:2] for q in sq], S + 0.005, 0.03, rot=(-90, 0, 0))
    slab(p, [q[:2] for q in sq], S + 0.005, 0.03, rot=(90, 0, 0))
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
    p = Prop('prop_m_paintpot', base=WHITE, target_faces=1500, voxel=0.011)
    H, R = 0.56, 0.36
    p.lathe(rounded([(0, -H / 2), (R - 0.02, -H / 2), (R, H / 2 - 0.08), (R + 0.04, H / 2 - 0.04), (R + 0.04, H / 2), (R - 0.04, H / 2), (R - 0.05, H / 2 - 0.05), (0, H / 2 - 0.05)], 0.03, n=3), seg=40)
    # paint drips over the rim
    for k, (a, l) in enumerate([(0.35, 0.16), (-0.3, 0.1), (1.2, 0.12), (-1.5, 0.2), (2.6, 0.13)]):
        x, z = (R + 0.03) * math.sin(a), (R + 0.03) * math.cos(a)
        p.capsule((x, H / 2 - 0.02, z), (x, H / 2 - l, z), 0.045, group='drip%d' % k, r2=0.05)
    p.paint_fn(lambda q, n: q.y > H / 2 - 0.08 and n.y > 0.6 and math.hypot(q.x, q.z) < R - 0.02, 0xcfcfcf)
    p.layer('label', base=WHITE, target_faces=600, voxel=0.008)
    p.lathe([(R + 0.002, -0.17), (R + 0.022, -0.17), (R + 0.032, 0.08), (R + 0.012, 0.08)], seg=40, closed=True, a0=-1.1, a1=1.1)
    p.layer('skin')
    p.layer('labelink', base=INK, target_faces=200, voxel=0.006)
    for s in (-1, 1):
        p.blob((s * 0.09, -0.02, R + 0.04), (0.035, 0.045, 0.012), group='e%d' % s)
    p.layer('skin')
    tinted(p, 0.3, 0xffd23f)


def car():
    p = Prop('prop_m_car', base=WHITE, target_faces=1800, voxel=0.011)
    # facing +x (drives to the right); body + cab one clay piece
    p.box((0, 0.0, 0), (0.5, 0.15, 0.27), bevel=0.12)
    p.box((-0.07, 0.2, 0), (0.27, 0.15, 0.24), bevel=0.11)
    p.blob((0.38, 0.06, 0), (0.12, 0.08, 0.22), group='nose')
    p.layer('glass', base=0xd8f2ff, target_faces=500, voxel=0.007)
    p.box((-0.07, 0.22, 0.0), (0.22, 0.09, 0.245), bevel=0.04)
    p.box((-0.07, 0.22, 0.0), (0.275, 0.09, 0.19), bevel=0.04)
    p.paint_fn(lambda q, n: abs(q.x + 0.07) < 0.025 and abs(n.z) > 0.6, 0xffffff)
    p.layer('skin')
    p.layer('wheels', base=0x403848, target_faces=1100, voxel=0.008)
    for x in (-0.3, 0.3):
        for z in (-0.26, 0.26):
            p.cyl((x, -0.16, 0.2 if z > 0 else -0.2), 0.14, 0.11, rot=(90 if z > 0 else -90, 0, 0), bevel=0.035, seg=20)
    p.paint_fn(lambda q, n: math.hypot(q.x - (0.3 if q.x > 0 else -0.3), q.y + 0.16) < 0.06 and abs(q.z) > 0.32, 0xf2f2f2)
    p.layer('skin')
    p.layer('lights', base=0xfff2a0, target_faces=240, voxel=0.006)
    for z in (-0.15, 0.15):
        p.blob((0.49, 0.06, z), (0.025, 0.045, 0.045), group='l%d' % (z > 0))
    p.layer('skin')
    p.bone('body', (0, -0.3, 0), (0, 0.4, 0))
    tinted(p, 0.35, 0x4a90ff)


def brush():
    p = Prop('prop_m_brush', base=WHITE, target_faces=1300, voxel=0.009)
    # upright artist's brush: long tapered handle (tinted), silver ferrule, cream bristles dipped in paint (tinted tip)
    p.lathe(rounded([(0, -0.62), (0.05, -0.61), (0.06, -0.4), (0.085, 0.0), (0.09, 0.1), (0, 0.1)], 0.03, n=3), seg=16)
    p.blob((0, 0.5, 0), (0.1, 0.12, 0.075), group='tip')
    p.blob((0, 0.63, 0), (0.05, 0.07, 0.04), group='tip')
    p.layer('bristle', base=0xf6e7c8, target_faces=500, voxel=0.008)
    p.blob((0, 0.33, 0), (0.115, 0.13, 0.085), group='br')
    p.blob((0, 0.24, 0), (0.1, 0.05, 0.08), group='br')
    p.layer('skin')
    p.layer('ferrule', base=0xd6dde8, target_faces=500, voxel=0.008)
    p.lathe([(0.075, 0.07), (0.115, 0.07), (0.105, 0.24), (0.07, 0.24)], seg=24, closed=True)
    p.ring((0, 0.12, 0), 0.112, 0.016, seg=24, rseg=6)
    p.layer('skin')
    p.layer('shine', base=WHITE, target_faces=100, voxel=0.006)
    p.blob((-0.05, -0.2, 0.07), (0.012, 0.16, 0.008), group='sh')
    p.layer('skin')
    p.bone('body', (0, -0.62, 0), (0, 0.7, 0))
    tinted(p, 0.6, 0x5fd068)


def button():
    p = Prop('prop_m_button', base=WHITE, target_faces=1400, voxel=0.01)
    # a chunky sewing button facing +z, four holes
    p.blob((0, 0, 0), (0.46, 0.46, 0.09), group='b', stiffness=3)
    for x, y in [(-0.1, -0.1), (0.1, -0.1), (-0.1, 0.1), (0.1, 0.1)]:
        p.blob((x, y, 0), (0.05, 0.05, 0.3), group='b', negative=True, stiffness=3)
    p.ring((0, 0, 0.0), 0.39, 0.065, rot=(90, 0, 0), seg=48, rseg=10)
    p.paint_fn(lambda q, n: math.hypot(q.x, q.y) < 0.3 and abs(n.z) > 0.5, 0xe0e0e0)
    p.paint_fn(lambda q, n: min(math.hypot(q.x - x, q.y - y) for x, y in [(-0.1, -0.1), (0.1, -0.1), (-0.1, 0.1), (0.1, 0.1)]) < 0.075, 0x8c8c8c)
    p.layer('shine', base=WHITE, target_faces=160, voxel=0.006)
    p.blob((-0.2, 0.26, 0.09), (0.07, 0.025, 0.01), rot=(0, 0, 35), group='sh')
    p.layer('skin')
    p.bone('body', (0, -0.46, 0), (0, 0.46, 0))
    tinted(p, 0.46, 0xff5a5a)


def marble():
    R = 0.2
    p = Prop('prop_m_marble', base=WHITE, target_faces=420, voxel=0.008)
    p.lathe(sphere_prof(R, 14), seg=20)
    p.layer('swirl', base=WHITE, target_faces=200, voxel=0.006)
    pts = []
    for i in range(24):
        t = i / 23
        a = -1.2 + 2.6 * t
        y = -0.13 + 0.26 * t
        r = math.sqrt(max(0.0, R * R - y * y)) + 0.002
        pts.append((r * math.sin(a), y, r * math.cos(a)))
    p.tube(pts, 0.028, rseg=6)
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
