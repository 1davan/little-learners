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


def finish(p, h):
    p.bone('body', (0, -h, 0), (0, h, 0))
    p.extras['argMode'] = 'tint'
    p.extras['argDefault'] = 0xff4b4b
    p.extras['outline'] = 0.02
    p.build()


def apple():
    p = Prop('prop_m_apple', base=0xffffff, target_faces=1300, voxel=0.011)
    prof = roundprof(0.49, 0.42, top=0.12, bot=0.05, bulge=0.07)
    p.lathe(prof, seg=40)
    p.paint_fn(lambda q, n: math.hypot(q.x, q.z) < 0.12 and q.y > 0.22, DIMPLE)
    stem(p, [(0, 0.26, 0), (0.01, 0.4, 0), (0.05, 0.53, 0.0)], 0.034)
    leaf(p, (0.04, 0.45, 0.02), 0.3, 0.16, yaw=-25, tilt=20)
    shine(p, prof, 0.16, ang=-0.6)
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
    p = Prop('prop_m_plum', base=0xffffff, target_faces=1300, voxel=0.011)
    prof = roundprof(0.44, 0.47, top=0.05, bot=0.0, bulge=-0.04)
    p.lathe(prof, seg=40, scale=(0.94, 0.94))
    # the crease down one side
    p.paint_fn(lambda q, n: abs(math.atan2(q.x, q.z) - 0.75) < 0.045 and q.y > -0.25 and q.y < 0.42, 0xa8a8a8)
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
    p = Prop('prop_m_blueberry', base=0xffffff, target_faces=1200, voxel=0.011)
    prof = rounded([(0, -0.38), (0.25, -0.38), (0.43, -0.2), (0.46, 0.04), (0.41, 0.24), (0.25, 0.37), (0.12, 0.36), (0, 0.32)], 0.08, n=4)
    p.lathe(prof, seg=40)
    # the five-pointed crown: little sepals round a dark well
    for k in range(5):
        a = k / 5 * math.tau
        p.blob((0.12 * math.sin(a), 0.355, 0.12 * math.cos(a)), (0.035, 0.035, 0.065), rot=(-20, math.degrees(a), 0), group='crown')
    p.paint_fn(lambda q, n: math.hypot(q.x, q.z) < 0.17 and q.y > 0.3, 0x6c6c78)
    shine(p, prof, 0.1, ang=-0.6, w=0.055, h=0.1)
    finish(p, 0.42)


def cherry():
    p = Prop('prop_m_cherry', base=0xffffff, target_faces=1300, voxel=0.011)
    prof = roundprof(0.46, 0.4, top=0.1, bot=0.02, bulge=0.04)
    p.lathe(prof, seg=40)
    p.paint_fn(lambda q, n: math.hypot(q.x, q.z) < 0.1 and q.y > 0.27, DIMPLE)
    p.layer('stem', base=0x6aa83a, target_faces=300, voxel=0.008)
    pts = [(0, 0.3, 0), (0.02, 0.45, 0), (0.07, 0.62, 0), (0.15, 0.78, 0), (0.24, 0.9, 0)]
    p.tube(pts, [0.032, 0.03, 0.028, 0.026, 0.026], rseg=8)
    p.layer('skin')
    leaf(p, (0.24, 0.9, 0.0), 0.28, 0.13, yaw=-10, tilt=-10)
    shine(p, prof, 0.13, ang=-0.6)
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
    p.layer('shine', base=0xffffff, target_faces=500, voxel=0.006)
    for i, (x, y, z) in enumerate(P):
        if z >= 0.04:
            r = 0.14
            p.blob((x - 0.05, y + 0.055, z + r * 0.84), (0.022, 0.034, 0.01), rot=(-25, -20, -20), group='s%d' % i)
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
