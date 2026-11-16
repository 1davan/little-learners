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
    p = Prop('prop_m_sweet', base=WHITE, target_faces=1400, voxel=0.01)
    p.blob((0, 0, 0), (0.33, 0.3, 0.3), group='b')
    for s in (-1, 1):
        # twisted neck and a pleated fan
        p.blob((s * 0.34, 0, 0), (0.07, 0.08, 0.08), group='b')
        for k in range(5):
            a = math.radians(-40 + 20 * k)
            p.blob((s * (0.48 + 0.04 * math.cos(a)), 0.15 * math.sin(a) * 1.4, 0), (0.1, 0.035, 0.09), rot=(0, 0, s * math.degrees(a)), group='f%d' % s)
    p.paint_fn(lambda q, n: abs(q.x) > 0.36, 0xe4e4e4)
    p.paint_fn(lambda q, n: abs(q.x) > 0.42 and int((math.atan2(q.y, abs(q.x) - 0.36) + 2) * 6) % 2 == 0, 0xcfcfcf)
    p.layer('stripes', base=WHITE, target_faces=600, voxel=0.007)
    for k in (-1, 0, 1):
        pts = []
        for i in range(12):
            t = -1 + 2 * i / 11
            y = t * 0.27
            x = k * 0.14 + y * 0.45
            z = math.sqrt(max(0.0, 1 - (x / 0.335) ** 2 - (y / 0.305) ** 2)) * 0.305
            pts.append((x, y, z))
        p.tube(pts, 0.03, rseg=6)
    p.layer('skin')
    p.layer('shine', base=WHITE, target_faces=120, voxel=0.006)
    p.blob((-0.15, 0.17, 0.22), (0.05, 0.025, 0.01), rot=(-30, -30, 30), group='sh')
    p.layer('skin')
    done(p, 0.35, 0.022, tint=0x9b5de5)


def ladybug():
    p = Prop('prop_m_ladybug', base=0xff3030, target_faces=420, voxel=0.009, smooth=2)
    p.blob((0, 0.0, 0), (0.2, 0.13, 0.22), group='shell')
    p.paint_fn(lambda q, n: abs(q.x) < 0.012 and q.y > 0.0, 0x2a2030)
    for x, z in [(0.09, 0.06), (-0.09, 0.06), (0.08, -0.1), (-0.08, -0.1), (0.13, -0.01), (-0.13, -0.01)]:
        p.paint(None, (x, 0.11, z), (0.045, 0.06, 0.045), 0x2a2030)
    p.layer('head', base=0x2a2030, target_faces=200, voxel=0.008)
    p.blob((0, -0.01, 0.2), (0.1, 0.08, 0.08), group='h')
    p.layer('skin')
    p.layer('eyes', base=WHITE, target_faces=80, voxel=0.005)
    for s in (-1, 1):
        p.blob((s * 0.045, 0.03, 0.275), (0.025, 0.028, 0.012), group='e%d' % s)
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
    p = Prop('prop_m_plate', base=WHITE, target_faces=700, voxel=0.012)
    p.lathe(rounded([(0, 0), (0.42, 0), (0.6, 0.07), (0.64, 0.1), (0.58, 0.1), (0.44, 0.045), (0, 0.045)], 0.025, n=3), seg=40)
    p.paint_fn(lambda q, n: math.hypot(q.x, q.z) > 0.53 and n.y > 0.3, 0xffb3d1)
    p.bone('body', (0, 0, 0), (0, 0.1, 0))
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
    p = Prop('prop_m_snowball', base=WHITE, target_faces=420, voxel=0.01, smooth=2)
    p.blob((0, 0, 0), (0.2, 0.2, 0.2), group='s')
    for i, d in enumerate([(0.6, 0.6, 0.5), (-0.7, 0.3, 0.6), (0.1, -0.5, 0.8), (-0.3, 0.8, -0.4), (0.7, -0.2, -0.6)]):
        l = math.sqrt(sum(x * x for x in d))
        p.blob(tuple(x / l * 0.13 for x in d), (0.1, 0.1, 0.1), group='s')
    p.paint_fn(lambda q, n: n.y < -0.35, 0xc6dcf2)
    done(p, 0.22, 0.016)


def petal():
    p = Prop('prop_m_petal', base=0xff8fc0, target_faces=240, voxel=0.007, smooth=2)
    p.blob((0, 0, 0), (0.14, 0.035, 0.1), group='p')
    p.blob((0.1, 0.0, 0), (0.07, 0.03, 0.08), group='p')
    p.paint_fn(lambda q, n: q.x < -0.08, 0xffc2dc)
    done(p, 0.05, 0.012)


def drop():
    p = Prop('prop_m_drop', base=0x7fd0ff, target_faces=260, voxel=0.006, smooth=2)
    p.lathe(rounded([(0, -0.1), (0.07, -0.08), (0.09, -0.02), (0.05, 0.07), (0.0, 0.14)], 0.03, n=3), seg=16)
    p.layer('shine', base=WHITE, target_faces=60, voxel=0.004)
    p.blob((-0.03, -0.02, 0.07), (0.014, 0.028, 0.006), group='sh')
    p.layer('skin')
    done(p, 0.12, 0.01)


def coin():
    GOLD, GOLD_D = 0xffc93b, 0xe0a020
    p = Prop('prop_m_coin', base=GOLD, target_faces=300, voxel=0.008, smooth=2)
    p.lathe(rounded([(0, -0.035), (0.18, -0.035), (0.19, 0.0), (0.18, 0.035), (0, 0.035)], 0.015, n=2), rot=(90, 0, 0), seg=28)
    p.paint_fn(lambda q, n: math.hypot(q.x, q.y) > 0.17 or abs(n.z) < 0.5, GOLD_D)
    p.layer('star', base=0xfff2a6, target_faces=280, voxel=0.0035)
    from mathutils import Vector
    poly = star_poly(0.115, inner=0.48)
    for zz in (1, -1):
        verts = [(0, 0, zz * 0.025)] + [(x, y, zz * 0.025) for x, y in poly] + [(0, 0, zz * 0.055)] + [(x, y, zz * 0.055) for x, y in poly]
        m = len(poly)
        faces = []
        k = m + 1
        for i in range(m):
            j = (i + 1) % m
            faces.append((0, 1 + j, 1 + i)); faces.append((k, k + 1 + i, k + 1 + j)); faces.append((1 + i, 1 + j, k + 1 + j, k + 1 + i))
        p.mesh(verts, faces)
    p.layer('skin')
    done(p, 0.19, 0.014)


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
