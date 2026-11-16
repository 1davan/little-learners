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

ONLY = [s for s in os.environ.get('ONLY', '').split(',') if s]
WHITE, INK = 0xffffff, 0x3a2838
TAU = math.tau
TRUNK, TRUNK_D = 0x9a6a43, 0x7c5232
LEAF, LEAF_D, LEAF_L = 0x58c45e, 0x3f9a3a, 0x7fd66a


def tree():
    p = Prop('prop_m_tree', base=WHITE, target_faces=5200, voxel=0.03)
    puffs = [((0, 2.75, 0), 1.25), ((-0.95, 2.35, 0.1), 0.85), ((0.95, 2.4, 0.05), 0.88), ((0, 3.55, -0.1), 0.85),
             ((-0.6, 3.25, 0.4), 0.72), ((0.62, 3.3, 0.35), 0.7), ((0.0, 2.2, 0.55), 0.78), ((-0.35, 2.75, 0.8), 0.62), ((0.45, 2.6, 0.78), 0.6)]
    # the front puffs go in a second tinted layer ('tint2'), so each keeps a crisp ink outline over the canopy
    for i, (c, r) in enumerate(puffs):
        if c[2] > 0.3:
            p.layer('tint2', base=WHITE, target_faces=2600, voxel=0.03)
        p.blob(c, (r, r * 0.92, r * 0.95), group='p%d' % i)
        p.paint_fn(lambda q, n: n.y < -0.5, 0xe2e2e2)
        p.layer('skin')
    p.layer('trunk', base=TRUNK, target_faces=1400, voxel=0.025)
    p.lathe(rounded([(0, 0), (0.48, 0), (0.36, 0.12), (0.27, 0.6), (0.22, 1.6), (0.24, 2.3), (0, 2.4)], 0.08, n=4), seg=24)
    p.capsule((0.1, 1.55, 0), (0.62, 2.05, 0.15), 0.11, group='br', r2=0.08)
    p.capsule((-0.08, 1.75, 0), (-0.55, 2.15, 0.2), 0.1, group='br2', r2=0.07)
    p.paint_fn(lambda q, n: abs(((math.atan2(q.x, q.z) + 4) * 5) % 1 - 0.5) < 0.07 and q.y > 0.25 and q.y < 1.5, TRUNK_D)
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
    p = Prop('prop_m_mound', base=0x8a5a3a, target_faces=1400, voxel=0.018)
    p.blob((0, 0.05, 0), (0.78, 0.3, 0.6), group='m')
    for i, (x, z) in enumerate([(-0.4, 0.3), (0.45, 0.25), (0.1, -0.35), (-0.2, -0.2)]):
        p.blob((x, 0.18, z), (0.18, 0.1, 0.15), group='m')
    p.paint_fn(lambda q, n: q.y < 0.06, 0x734a2e)
    p.layer('leaves', base=LEAF, target_faces=1600, voxel=0.014)
    # a tuft of broad, rounded strawberry leaves round the back and sides (the berries sit in front)
    for k in range(7):
        a = math.radians(-120 + k * 40)
        d = (math.sin(a), math.cos(a))
        for t, w in [(0.12, 0.09), (0.26, 0.15), (0.38, 0.13)]:
            p.blob((d[0] * t * 1.3, 0.3 + t * 0.5, -d[1] * t * 0.9 - 0.1), (0.12, 0.045, w), rot=(0, math.degrees(a) + 90, -35), group='l%d' % k)
    p.paint_fn(lambda q, n: n.y < 0.1, LEAF_D)
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
    p = Prop('prop_m_watermelon', base=0x45a83f, target_faces=3000, voxel=0.018)
    p.blob((0, 0.8, 0), (1.25, 0.8, 0.95), group='m')
    # wavy dark stripes running end to end (along x)
    def stripe(q, n):
        a = math.atan2(q.y - 0.8, q.z) / TAU * 12 + 0.25 * math.sin(q.x * 7)
        return abs(a - round(a)) < 0.18
    p.paint_fn(stripe, 0x2b6e2a)
    p.paint_fn(lambda q, n: abs(q.x) > 1.2, 0x7cc95c)
    p.layer('shine', base=0xcff5c0, target_faces=200, voxel=0.012)
    p.blob((-0.5, 1.4, 0.55), (0.28, 0.06, 0.02), rot=(-50, -15, 15), group='sh')
    p.layer('skin')
    p.layer('stem', base=0x6a8a3a, target_faces=300, voxel=0.012)
    p.tube([(1.2, 0.85, 0), (1.32, 0.95, 0), (1.36, 1.08, 0.05)], 0.05, rseg=8)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 1.6, 0))
    p.extras['outline'] = 0.032
    p.build()


def mushroom():
    p = Prop('prop_m_mushroom', base=WHITE, target_faces=2600, voxel=0.018)
    # cap (tinted): a soft dome with a rolled rim
    p.lathe(rounded([(0, 1.0), (1.05, 1.0), (1.12, 1.12), (1.0, 1.45), (0.6, 1.72), (0, 1.8)], 0.12, n=5), seg=48)
    p.paint_fn(lambda q, n: n.y < -0.3, 0xd8d8d8)
    p.layer('stem', base=0xfff1d6, target_faces=1400, voxel=0.016)
    p.lathe(rounded([(0, 0), (0.5, 0), (0.42, 0.25), (0.38, 0.8), (0.42, 1.05), (0, 1.05)], 0.1, n=4), seg=36)
    p.ring((0, 0.85, 0), 0.4, 0.06, seg=36, rseg=8)
    p.paint_fn(lambda q, n: q.y > 1.0, 0xf2dcb8)
    p.layer('skin')
    p.layer('spots', base=WHITE, target_faces=1400, voxel=0.01)
    prof = rounded([(0, 1.0), (1.05, 1.0), (1.12, 1.12), (1.0, 1.45), (0.6, 1.72), (0, 1.8)], 0.12, n=5)
    top = [q for q in prof if q[1] >= 1.12]

    def r_at(y):
        for (r0, y0), (r1, y1) in zip(top, top[1:]):
            if (y0 - y) * (y1 - y) <= 0 and y0 != y1:
                return r0 + (r1 - r0) * (y - y0) / (y1 - y0)
        return 0.0
    for k, (a, y) in enumerate([(0, 1.79), (0.45, 1.5), (-0.55, 1.47), (1.55, 1.42), (-1.6, 1.4), (2.6, 1.55), (-2.5, 1.6), (0.95, 1.68), (-1.0, 1.7)]):
        r = r_at(y) + 0.005
        nx, ny = (r_at(y - 0.02) - r_at(y + 0.02)), 0.04
        l = math.hypot(nx, ny); nx, ny = nx / l, ny / l
        d = (nx * math.sin(a), ny, nx * math.cos(a)) if k else (0, 1, 0)
        c = (r * math.sin(a), y, r * math.cos(a)) if k else (0, 1.8, 0)
        pitch = -math.degrees(math.asin(max(-1, min(1, d[1]))))
        yaw = math.degrees(math.atan2(d[0], d[2]))
        rr = 0.16 if k else 0.2
        p.blob(c, (rr, rr * 0.85, 0.035), rot=(pitch, yaw, 0), group='s%d' % k)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 1.8, 0))
    p.face((0, 0.6, 0.0), 0.42, bone='body', faceScale=0.9)
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
