"""Feelings stages and big set dressing (each stands on y = 0, flat top at y = 3.0 where Pip and the props stand).
  prop_m_hill       L1 picnic hill: grassy mound, top radius ~3.3, base ~4.1, with a red-and-white blanket on top that
                  drapes over the front edge (layer 'blanket').
  prop_m_playtable  L2 wooden play table 7.4 x 2.8 top at 3.0, red edge band, chunky coloured legs.
  prop_m_rug        a round striped play rug (radius 6.2, scale it flat in z in game).
  prop_m_stump      L3 big tree stump, top radius 3.1, growth rings, bark ridges and roots, moss.
  prop_m_rings      stacking-rings toy (~1.1 tall).
ONLY=prop_m_hill tools/blender/build.sh prop_meadow_stage"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

ONLY = [s for s in os.environ.get('ONLY', '').split(',') if s]
TOP = 3.0
TAU = math.tau
GRASS, GRASS_D, GRASS_L = 0x7cc95c, 0x62b04a, 0x96dc72


def hill():
    p = Prop('prop_m_hill', base=GRASS, target_faces=6400, voxel=0.04)
    # a soft round hill (gentle sides, flat top at TOP for Pip and the props)
    prof = [(0, 0), (4.55, 0), (4.3, 0.6), (3.85, 1.8), (3.45, 2.6), (3.3, TOP - 0.12), (0, TOP - 0.12)]
    p.lathe(rounded(prof, 0.35, n=6), seg=80)

    def rh(y):  # the hill's outer radius at height y (its straight profile segments)
        pts = prof[1:6]
        for (r0, y0), (r1, y1) in zip(pts, pts[1:]):
            if y0 <= y <= y1:
                return r0 + (r1 - r0) * (y - y0) / (y1 - y0)
        return pts[-1][0]
    # grass tufts round the foot
    for i in range(26):
        a = i / 26 * TAU + 0.13
        r = 4.4 - 0.1 * (i % 3)
        p.blob((r * math.sin(a), 0.22 + 0.06 * (i % 2), r * math.cos(a)), (0.32, 0.24, 0.22), rot=(0, math.degrees(a), 0), group='t%d' % i)
    p.paint_fn(lambda q, n: q.y > TOP - 0.2 and n.y > 0.8, GRASS_L)
    p.paint_fn(lambda q, n: q.y < 0.45, GRASS_D)
    # little painted daisies dotted on the slope
    for i in range(30):
        a = i * 2.39996
        y = 0.6 + (i * 0.37) % 2.0
        r = rh(y) + 0.03
        p.paint(None, (r * math.sin(a), y, r * math.cos(a)), (0.1, 0.1, 0.1), [0xffffff, 0xffd23f, 0xff8fc0][i % 3])
    # blanket on top, draped over the front edge
    p.layer('blanket', base=0xffffff, target_faces=4000, voxel=0.025)
    W, Z0, Z1 = 2.45, -0.8, 2.75
    p.box((0, TOP - 0.05, (Z0 + Z1) / 2), (W, 0.05, (Z1 - Z0) / 2), bevel=0.04)
    a0, a1 = -0.62, 0.62
    ys = [1.75 + i * 0.1 for i in range(11)]
    loop = [(rh(y) + 0.03, y) for y in reversed(ys)] + [(rh(ys[0]) + 0.08, ys[0] - 0.05)] + [(rh(y) + 0.11, y) for y in ys]
    loop += [(3.42, TOP - 0.02), (3.25, TOP + 0.06), (2.7, TOP + 0.0), (2.7, TOP - 0.06), (3.25, TOP - 0.06)]
    p.lathe(loop, seg=40, a0=a0, a1=a1, closed=True)
    def check(q, n):
        if q.y > TOP - 0.2 and n.y > 0.3:
            i, j = math.floor(q.x / 0.6), math.floor((q.z - 0.2) / 0.6)
        else:
            a = math.atan2(q.x, q.z)
            i, j = math.floor(a * 3.4 / 0.6), math.floor((TOP - q.y) / 0.5)
        return (i + j) % 2 == 0
    p.paint_fn(check, 0xff5a5a)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, TOP, 0))
    p.extras['outline'] = 0.035
    p.build()


def playtable():
    WOOD, WOOD_D, RED = 0xe8a95c, 0xc98a44, 0xff6f61
    p = Prop('prop_m_playtable', base=WOOD, target_faces=4200, voxel=0.03)
    p.box((0, TOP - 0.18, 0), (3.7, 0.18, 1.4), bevel=0.12)
    # wood grain stripes along the top
    p.paint_fn(lambda q, n: n.y > 0.8 and abs(((q.z + 2) * 2.2 + 0.15 * math.sin(q.x * 1.3)) % 1 - 0.5) < 0.06, WOOD_D)
    p.layer('band', base=RED, target_faces=1600, voxel=0.025)
    p.box((0, TOP - 0.42, 0), (3.78, 0.1, 1.48), bevel=0.08)
    p.paint_fn(lambda q, n: abs(n.y) < 0.5 and abs(((q.x + 4) * 1.2) % 1 - 0.5) < 0.18, 0xffd23f)
    p.layer('skin')
    p.layer('legs', base=0x4a90ff, target_faces=1800, voxel=0.025)
    for sx in (-1, 1):
        for sz in (-1, 1):
            p.cyl((sx * 3.2, 0, sz * 1.08), 0.27, TOP - 0.5, r2=0.24, bevel=0.1, seg=20)
            p.blob((sx * 3.2, 0.12, sz * 1.08), (0.34, 0.14, 0.34), group='foot%d%d' % (sx, sz))
    p.paint_fn(lambda q, n: (q.x > 0) == (q.z > 0), 0x5fd068)
    p.paint_fn(lambda q, n: q.y < 0.26, 0xffd23f)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, TOP, 0))
    p.extras['outline'] = 0.032
    p.build()


def rug():
    p = Prop('prop_m_rug', base=0xffd23f, target_faces=3000, voxel=0.03)
    p.lathe(rounded([(0, 0), (6.2, 0), (6.28, 0.05), (6.2, 0.1), (0, 0.1)], 0.04, n=2), seg=96)
    cols = [0xffd23f, 0x4a90ff, 0xff8fc0, 0x5fd068, 0xffffff]
    def ring(k):
        return lambda q, n: math.hypot(q.x, q.z) < 6.0 - k * 1.2
    for k in range(1, 5):
        p.paint_fn(ring(k), cols[k])
    p.paint_fn(lambda q, n: math.hypot(q.x, q.z) > 5.85, 0xff6f61)
    p.bone('body', (0, 0, 0), (0, 0.1, 0))
    p.extras['outline'] = 0.02
    p.build()


def stump():
    BARK, BARK_D, WOODF, RING = 0x9a6a43, 0x7c5232, 0xe9c38f, 0xc89a64
    p = Prop('prop_m_stump', base=BARK, target_faces=6400, voxel=0.04)
    prof = rounded([(0, 0), (3.75, 0), (3.4, 0.5), (3.15, 1.6), (3.1, TOP - 0.1), (3.0, TOP), (0, TOP)], 0.18, n=4)
    p.lathe(prof, seg=64)
    # bark ridges
    for i in range(16):
        a = i / 16 * TAU + 0.1
        pts = [((3.2 + 0.25 * (1 - y / TOP) ** 2) * math.sin(a + 0.05 * y), y, (3.2 + 0.25 * (1 - y / TOP) ** 2) * math.cos(a + 0.05 * y)) for y in (0.3, 1.2, 2.1, 2.7)]
        p.tube(pts, 0.13, rseg=8)
    # roots
    for i in range(6):
        a = i / 6 * TAU + 0.35
        p.capsule((3.3 * math.sin(a), 0.5, 3.3 * math.cos(a)), (4.3 * math.sin(a), 0.12, 4.3 * math.cos(a)), 0.32, group='r%d' % i, r2=0.16)
    p.paint_fn(lambda q, n: q.y > TOP - 0.06 and n.y > 0.7 and math.hypot(q.x, q.z) < 2.95, WOODF)
    def rings(q, n):
        if not (q.y > TOP - 0.06 and n.y > 0.7):
            return False
        d = math.hypot(q.x, q.z) + 0.08 * math.sin(math.atan2(q.x, q.z) * 3)
        return d < 2.95 and abs((d / 0.75) % 1 - 0.5) < 0.05
    p.paint_fn(rings, RING)
    p.paint_fn(lambda q, n: q.y < TOP - 0.1 and abs(((math.atan2(q.x, q.z) + 4) * 16 / TAU) % 1 - 0.5) < 0.12, BARK_D)
    # moss patches on the shady side
    p.paint_fn(lambda q, n: q.y < 0.9 and n.y > 0.4 and math.hypot(q.x, q.z) > 3.2 and math.sin(math.atan2(q.x, q.z) * 3) > 0.3, 0x6fbf4f)
    p.bone('body', (0, 0, 0), (0, TOP, 0))
    p.extras['outline'] = 0.035
    p.build()


def rings():
    p = Prop('prop_m_rings', base=0xf2d16b, target_faces=2400, voxel=0.012)
    p.cyl((0, 0, 0), 0.42, 0.12, r2=0.4, bevel=0.05, seg=32)
    p.cyl((0, 0.1, 0), 0.07, 0.95, bevel=0.03, seg=12)
    p.blob((0, 1.08, 0), (0.12, 0.12, 0.12), group='knob')
    p.layer('stack', base=0xff5a5a, target_faces=2400, voxel=0.012)
    cols = [0xff5a5a, 0xff9f3f, 0xffd23f, 0x5fd068]
    for i in range(4):
        p.ring((0, 0.22 + i * 0.21, 0), 0.3 - i * 0.045, 0.11 - i * 0.008, seg=40, rseg=12)
    for i in range(1, 4):
        y0 = 0.22 + i * 0.21 - 0.105
        p.paint_fn(lambda q, n, y0=y0, c=cols[i]: q.y > y0, cols[i])
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 1.2, 0))
    p.extras['outline'] = 0.02
    p.build()


MODELS = dict(prop_m_hill=hill, prop_m_playtable=playtable, prop_m_rug=rug, prop_m_stump=stump, prop_m_rings=rings)
for name, fn in MODELS.items():
    if not ONLY or name in ONLY:
        fn()
