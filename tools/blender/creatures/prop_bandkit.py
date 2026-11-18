"""Barn band kit (app/src/lessons/band-props.js). Game space: x right, y up, z toward the camera, floor y = 0.
ONLY=prop_drumstick,prop_bandbell tools/blender/build.sh prop_bandkit builds a subset.

  prop_drumstick   Pip's drumstick: a turned wooden stick along +z from its grip (origin), a fat round red tip at
                   z 0.84 (r 0.08), a red grip band. ~0.92 long.
  prop_bandriser   the band riser: a wooden platform 7.6 wide (x -3.8..3.8), 1.75 deep (z -0.875..0.875), top at
                   y 1.5, plank deck, a gold rope trim; three steps down at the right end (x 3.8..5.0, step tops
                   1.125 / 0.75 / 0.375). Skin = the gathered fabric skirt on the front (white: tinted per level).
  prop_pumpkindrum a pumpkin turned drum: eight soft lobes, radius 1.0, flat shoulder; a cream skin (layer 'head',
                   white: the game flashes it) lashed on with rope cords that zig-zag down to a rope band; a leaf
                   and a curly tendril at the back. extras: top (head height 0.98), headR (0.56).
  prop_bandbell    a chunky riveted cowbell hanging from a sturdy wooden A-frame (2.7 tall, feet at x +-1.2): bone
                   'swing' pivots the bell at (0, 2.62, 0); a dark mouth, a rolled lip, two rows of rivets, a clapper
                   ball in the mouth. Skin = the gold bell (tint white: unique, flashable). Layer 'accent' = strap and
                   band (white: tinted red / blue). extras: H 2.7, bellMid (middle of the bell), bellZ 0.
  prop_fairylights two turned wooden posts (x -7.6 and +7.6, 6.0 tall, ball finials) and the cable sagging between
                   them from y 5.6 (sag 0.75 at the middle) with 15 dark bulb sockets; the game hangs glowing bulbs
                   under the sockets. Origin = the middle between the posts on the ground.
  prop_bandstage   the evening-concert round stage (an oval 5.6 x 4.2, its top at y 0.06, sunk into the ground) with a
                   lower step ring, a gold rim and soft concentric rings; origin = centre.
  prop_theatre     the little theatre (L2): a deep red back cloth 19 wide x 7.2 tall with soft folds (z 0), two turned
                   wooden proscenium posts at x +-9.3 with a top beam at y 6.9, and a scalloped red valance with a gold
                   fringe hanging from the beam. Origin = the middle of the back cloth on the ground. (The draped
                   side curtains are prop_curtain, tinted red, placed by the game.)
"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded, TAU
from skit import SProp
from mathutils import Vector

ONLY = [k for k in os.environ.get('ONLY', '').split(',') if k]
want = lambda n: not ONLY or n in ONLY
WOOD, WOOD_D, WOOD_L = 0xc98b4f, 0xa86f3c, 0xdba066
RED, RED_D = 0xe0453a, 0xb8322c
GOLD, GOLD_D = 0xf2b51d, 0xd99a12


def drumstick():
    p = Prop('prop_drumstick', base=WOOD_L, target_faces=500, voxel=0.008, smooth=3)
    p.quadriflow = False
    p.lathe(rounded([(0, 0.0), (0.042, 0.0), (0.046, 0.12), (0.04, 0.5), (0.03, 0.8), (0, 0.84)], 0.02, n=2), rot=(90, 0, 0), seg=14)
    p.paint_fn(lambda q, n: 0.03 < q.z < 0.2, RED)              # grip band
    p.layer('tip', base=RED, target_faces=300, voxel=0.008)
    p.blob((0, 0, 0.85), (0.08, 0.08, 0.085), group='tip')
    p.paint_fn(lambda q, n: n.y > 0.55 and n.z > 0.2 and q.x < 0.0, 0xff8a7a)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 0, 0.9))
    p.extras['outline'] = 0.012
    p.build()


def riser():
    W, D, TOP = 7.6, 1.75, 1.5
    HW, HD = W / 2, D / 2
    STEP_W = 0.4
    p = SProp('prop_bandriser', base=0xdcdcdc, target_faces=2600)
    # the gathered fabric skirt on the front: a slab with a soft scalloped hem, pleats as clean paint bands
    hem = []
    N = 12
    for i in range(N):
        x0 = -HW + 0.06 + (W - 0.12) * i / N
        for k in range(9):
            u = k / 8
            if i and k == 0:
                continue
            hem.append((x0 + (W - 0.12) / N * u, 0.2 - math.sin(u * math.pi) * 0.14))
    poly = [(-HW + 0.06, TOP - 0.16), (HW - 0.06, TOP - 0.16)] + hem[::-1]
    p.prism(poly, HD - 0.02, HD + 0.07, bevel=0.025)
    p.paint_fn(lambda q, n: q.z > HD - 0.03 and abs(((q.x + HW) % (W / N)) - W / N / 2) < W / N * 0.2, 0xf6f6f6)
    # the platform: deck, frame and steps (wood)
    p.layer('deck', base=WOOD, target_faces=1800)
    p.box((0, TOP / 2, 0), (HW, TOP / 2, HD), bevel=0.05)
    p.paint_fn(lambda q, n: n.y > 0.7 and abs(((q.z + HD) % 0.44) - 0.22) > 0.2, WOOD_D)       # plank grooves (along x)
    p.paint_fn(lambda q, n: n.y > 0.7 and abs(((q.x + HW) % 2.17) - 1.085) > 1.065, WOOD_D)  # plank ends
    p.paint_fn(lambda q, n: n.y < 0.3 and q.y < 0.14, WOOD_D)
    for k, h in enumerate((1.125, 0.75, 0.375)):
        x0 = HW + k * STEP_W
        p.box((x0 + STEP_W / 2 + 0.02, h / 2, 0), (STEP_W / 2 + 0.02, h / 2, HD * 0.8), bevel=0.04)
    p.paint_fn(lambda q, n: q.x > HW + 0.03 and n.y > 0.7, WOOD_L)                           # light step treads
    p.layer('trim', base=GOLD, target_faces=900)
    p.tube([(-HW - 0.02, TOP - 0.1, HD + 0.08), (HW + 0.02, TOP - 0.1, HD + 0.08)], 0.05, rseg=8)
    for x in (-HW + 0.1, HW - 0.1):
        p.cyl((x, 0, HD + 0.09), 0.07, TOP - 0.1, bevel=0.03, seg=12)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, TOP, 0))
    p.extras['argMode'] = 'tint'; p.extras['argDefault'] = 0xe8a23c
    p.extras['outline'] = 0.026
    p.build()


def pumpkindrum():
    p = Prop('prop_pumpkindrum', base=0xff8a1f, target_faces=3600, voxel=0.014, smooth=3)
    p.quadriflow = False
    LOBES, HT, TOPR = 8, 1.2, 0.7
    rows, seg = 40, 112

    def prof_r(t):
        # a round pumpkin: tucked in at the bottom, full at the middle, a flat shoulder where the skin sits
        r = 0.32 + 0.68 * math.sin(math.pi * min(t, 0.999)) ** 0.5
        if t > 0.88:
            k = (t - 0.88) / 0.12
            r = r + (TOPR - r) * k ** 1.5
        return r
    lobe = lambda a: 1 - 0.1 * (0.5 - 0.5 * math.cos(LOBES * a)) ** 0.7       # soft lobes, valleys every 45 deg
    V, F = [], []
    for i in range(rows + 1):
        t = i / rows
        y = 0.02 + HT * t
        r = prof_r(t)
        for k in range(seg):
            a = k / seg * TAU
            # the lobes fade out toward the flat shoulder so the skin sits on a clean round rim
            lb = 1 - (1 - lobe(a)) * (1 - max(0, (t - 0.8) / 0.2)) * min(1, t / 0.15)
            V.append((r * lb * math.sin(a), y, r * lb * math.cos(a)))
    for i in range(rows):
        for k in range(seg):
            k2 = (k + 1) % seg
            F.append((i * seg + k, i * seg + k2, (i + 1) * seg + k2, (i + 1) * seg + k))
    c0 = len(V); V.append((0, 0.0, 0)); c1 = len(V); V.append((0, 0.02 + HT, 0))
    for k in range(seg):
        F.append((c0, (k + 1) % seg, k)); F.append((c1, rows * seg + k, rows * seg + (k + 1) % seg))
    p.mesh(V, F)
    TOPY = 0.02 + HT

    def valley(q, n):
        a = math.atan2(q.x, q.z)
        return (0.5 - 0.5 * math.cos(LOBES * a)) > 0.93 and 0.1 < q.y < 0.02 + HT * 0.84 + 0.04
    p.paint_fn(valley, 0xe36a14)                                                  # crease lines as paint
    p.paint_fn(lambda q, n: q.y < 0.07, 0xe36a14)
    p.paint_fn(lambda q, n: q.z > 0.3 and abs(math.atan2(q.x, q.z) + 0.5) < 0.09 and 0.35 < q.y < 0.95, 0xffae55)  # a shine stripe
    # the drum skin on the shoulder, held by a rope hoop and short cords down to a rope band
    p.layer('head', base=0xffffff, target_faces=800, voxel=0.01)
    p.cyl((0, TOPY - 0.04, 0), TOPR - 0.02, 0.08, bevel=0.035, seg=56)
    p.layer('rope', base=0xc98a50, target_faces=1800, voxel=0.01)
    p.ring((0, TOPY + 0.02, 0), TOPR, 0.042, seg=72, rseg=8)
    tb = 0.84
    yb = 0.02 + HT * tb
    rb = prof_r(tb) + 0.025
    p.ring((0, yb, 0), rb, 0.03, seg=96, rseg=8)
    NC = 8
    for k in range(NC):
        a0 = k / NC * TAU
        a1 = (k + 0.5) / NC * TAU
        top = (TOPR * math.sin(a0), TOPY + 0.02, TOPR * math.cos(a0))
        bot = (rb * math.sin(a1), yb + 0.01, rb * math.cos(a1))
        top2 = (TOPR * math.sin(a0 + TAU / NC), TOPY + 0.02, TOPR * math.cos(a0 + TAU / NC))
        midr = lambda u: prof_r(tb + (1 - tb) * u) + 0.03
        for A, B in ((top, bot), (bot, top2)):
            pts = []
            for j in range(6):
                u = j / 5
                x, y, z = (A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u, A[2] + (B[2] - A[2]) * u)
                tt = (y - 0.02) / HT
                rr = max(prof_r(min(1, max(0, tt))) + 0.02, math.hypot(x, z))
                k2 = rr / max(1e-4, math.hypot(x, z))
                pts.append((x * k2, y, z * k2))
            p.tube(pts, 0.017, rseg=6)
    # a leaf and a curly tendril at the back
    p.layer('leaf', base=0x5cb84a, target_faces=700, voxel=0.01)
    p.blob((0.5, TOPY - 0.12, -0.55), (0.3, 0.05, 0.2), rot=(14, -42, 16), group='leaf')
    p.paint_fn(lambda q, n: abs((q.x - 0.5) * 0.74 + (q.z + 0.55) * 0.67) < 0.025, 0x3f9a3a)
    p.tube([(0.62, TOPY - 0.2, -0.45), (0.78, TOPY - 0.12, -0.45), (0.86, TOPY - 0.02, -0.36), (0.8, TOPY + 0.02, -0.27), (0.74, TOPY - 0.04, -0.27)], 0.022, rseg=6)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 1.3, 0))
    p.extras['top'] = TOPY + 0.04
    p.extras['headR'] = TOPR - 0.04
    p.extras['outline'] = 0.026
    p.build()


def bandbell():
    H = 2.7
    PIV = H - 0.08
    p = Prop('prop_bandbell', base=0xf2b51d, target_faces=2400, voxel=0.012, smooth=3)
    p.quadriflow = False
    # the bell: a soft rounded-square bell, flaring to a rolled lip; hangs from the strap under the pivot
    by1, by0 = PIV - 0.34, PIV - 0.34 - 1.12
    V, F = [], []
    rows, segs = 14, 48
    for i in range(rows + 1):
        t = i / rows
        y = by1 - (by1 - by0) * t
        r = 0.42 + (0.72 - 0.42) * t ** 1.4
        for k in range(segs):
            a = k / segs * TAU + math.pi / 4
            sq = 1 / max(abs(math.cos(a)), abs(math.sin(a))) ** 0.55      # soft rounded square
            V.append((r * sq * math.cos(a) * 0.86, y, r * sq * math.sin(a) * 0.62))
    for i in range(rows):
        for k in range(segs):
            k2 = (k + 1) % segs
            F.append((i * segs + k, i * segs + k2, (i + 1) * segs + k2, (i + 1) * segs + k))
    c0 = len(V); V.append((0, by1 + 0.03, 0)); c1 = len(V); V.append((0, by0 + 0.1, 0))
    for k in range(segs):
        F.append((c0, (k + 1) % segs, k)); F.append((c1, rows * segs + k, rows * segs + (k + 1) % segs))
    p.mesh(V, F)
    p.paint_fn(lambda q, n: q.y < by0 + 0.06 and n.y < -0.5, 0x4a2e1a)                  # the dark mouth
    p.paint_fn(lambda q, n: n.z > 0.3 and q.x < -0.1 and abs(q.x + 0.26) < 0.06 and by0 + 0.25 < q.y < by1 - 0.12, 0xffe08a)  # shine
    # rolled lip, rivets (a darker gold, own layer for a crisp edge)
    p.layer('lip', base=GOLD_D, target_faces=900, voxel=0.01)
    V2 = []
    for k in range(segs):
        a = k / segs * TAU + math.pi / 4
        sq = 1 / max(abs(math.cos(a)), abs(math.sin(a))) ** 0.55
        V2.append((0.765 * sq * math.cos(a) * 0.86, by0 + 0.03, 0.765 * sq * math.sin(a) * 0.62))
    p.tube(V2, 0.045, closed=True, rseg=8)
    for row, y in enumerate((by1 - 0.12, by0 + 0.2)):
        t = (by1 - y) / (by1 - by0)
        r = 0.42 + (0.72 - 0.42) * t ** 1.4
        for s in (-1, 1):
            for x in (-0.5, 0.0, 0.5):
                px = x * r * 0.86 * 0.82
                pz = s * r * 0.62 * (1.0 if abs(x) < 0.1 else 0.93)
                p.blob((px, y, pz + s * 0.02), (0.035, 0.035, 0.03), group='rv%d%d%d' % (row, s > 0, int(x * 10) + 5))
    # strap + band in the accent colour
    p.layer('accent', base=0xffffff, target_faces=700, voxel=0.01)
    p.box((0, PIV - 0.18, 0), (0.09, 0.2, 0.05), bevel=0.03)
    yb = by1 - 0.3
    t = 0.3
    rb = 0.42 + (0.72 - 0.42) * t ** 1.4
    V3 = []
    for k in range(segs):
        a = k / segs * TAU + math.pi / 4
        sq = 1 / max(abs(math.cos(a)), abs(math.sin(a))) ** 0.55
        V3.append((rb * 1.03 * sq * math.cos(a) * 0.86, yb, rb * 1.03 * sq * math.sin(a) * 0.62))
    p.tube(V3, 0.05, closed=True, rseg=6)
    # the clapper hanging in the mouth
    p.layer('clapper', base=0x6b4424, target_faces=200, voxel=0.008)
    p.blob((0, by0 - 0.08, 0), (0.13, 0.13, 0.13), group='cl')
    p.capsule((0, by0 - 0.0, 0), (0, by0 + 0.45, 0), 0.035, group='clr')
    # the A-frame stand: two splayed legs each side meeting under a chunky top bar
    p.layer('stand', base=WOOD, target_faces=1800, voxel=0.012)
    for sx in (-1, 1):
        for sz in (-1, 1):
            p.tube([(sx * 1.2, 0.05, sz * 0.42), (sx * 0.95, H - 0.05, sz * 0.05)], 0.07, rseg=10)
        p.blob((sx * 1.2, 0.07, 0), (0.12, 0.07, 0.5), group='ft%d' % (sx > 0))          # a foot plank under each A
        p.tube([(sx * 1.13, 0.75, -0.3), (sx * 1.13, 0.75, 0.3)], 0.05, rseg=8)          # a rung across each A
    p.tube([(-1.12, H, 0), (1.12, H, 0)], 0.1, rseg=12)
    for sx in (-1, 1):
        p.blob((sx * 1.15, H, 0), (0.13, 0.13, 0.13), group='cap%d' % (sx > 0))
    p.ring((0, PIV, 0), 0.1, 0.03, rot=(90, 0, 0), seg=16, rseg=6)                       # the hook ring
    p.paint_fn(lambda q, n: q.y < 0.15, WOOD_D)
    p.layer('skin')
    swing = lambda q: abs(q.x) < 0.75 and q.y < PIV + 0.02 and q.y > 0.4 and abs(q.z) < 0.6
    p.bone('body', (0, 0, -0.6), (0, H, -0.6), region=lambda q: not swing(q))
    p.bone('swing', (0, PIV, 0), (0, PIV + 0.4, 0), parent='body', region=swing)
    p.extras['argMode'] = 'tint'; p.extras['argDefault'] = 0xffffff
    p.extras['H'] = H
    p.extras['bellMid'] = (by0 + by1) / 2
    p.extras['bellZ'] = 0.0
    p.extras['outline'] = 0.022
    p.build()


def fairylights():
    X, TOP, SAG, N = 7.6, 5.6, 0.75, 15
    p = SProp('prop_fairylights', base=WOOD, target_faces=2400)
    for sx in (-1, 1):
        x = sx * X
        p.lathe(rounded([(0, 0), (0.3, 0), (0.3, 0.16), (0.16, 0.24), (0.12, 0.6), (0.1, 3.0), (0.09, 5.4), (0.12, 5.55), (0.1, 5.75), (0, 5.75)], 0.04, n=2), pos=(x, 0, 0), seg=18)
        p.blob((x, 5.95, 0), (0.17, 0.17, 0.17), group='fin%d' % (sx > 0))
    p.paint_fn(lambda q, n: q.y < 0.25 or (5.5 < q.y < 5.62), WOOD_D)
    p.layer('cable', base=0x4a4250, target_faces=1600)
    pts = []
    for i in range(41):
        t = i / 40
        pts.append((-X + 2 * X * t, TOP - math.sin(t * math.pi) * SAG, 0.0))
    p.tube(pts, 0.03, rseg=6)
    for i in range(N):
        t = (i + 0.5) / N
        x, y = -X + 2 * X * t, TOP - math.sin(t * math.pi) * SAG
        p.cyl((x, y - 0.17, 0.02), 0.07, 0.14, r2=0.06, bevel=0.02, seg=12)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 6, 0))
    p.extras['outline'] = 0.018
    p.build()


def bandstage():
    RX, RZ = 5.6, 4.2
    p = SProp('prop_bandstage', base=0x5a4a8a, target_faces=2400, hard=False)
    p.lathe(rounded([(0, -0.3), (1.0, -0.3), (1.0, 0.06), (0, 0.06)], 0.02, n=2), scale=(RX, RZ), seg=96)
    ring = lambda q: math.hypot(q.x / RX, q.z / RZ)
    p.paint_fn(lambda q, n: n.y > 0.7 and 0.55 < ring(q) < 0.62, 0x6c5ca0)
    p.paint_fn(lambda q, n: n.y > 0.7 and 0.25 < ring(q) < 0.3, 0x6c5ca0)
    p.layer('step', base=0x463870, target_faces=1600)
    p.lathe(rounded([(0.98, -0.3), (1.06, -0.3), (1.06, 0.02), (0.98, 0.02)], 0.015, n=2), scale=(RX, RZ), seg=96)
    p.layer('rim', base=GOLD, target_faces=1400)
    pts = [(RX * 1.0 * math.sin(a), 0.06, RZ * 1.0 * math.cos(a)) for a in [k / 96 * TAU for k in range(96)]]
    p.tube(pts, 0.035, closed=True, rseg=6)
    for k in range(16):
        a = k / 16 * TAU
        p.blob((RX * 1.03 * math.sin(a), 0.02, RZ * 1.03 * math.cos(a)), (0.08, 0.04, 0.08), group='stud%d' % k)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 1, 0))
    p.extras['outline'] = 0.02
    p.build()


def theatre():
    W, HT = 19.0, 7.2
    PX, BEAM = 9.3, 6.9
    p = SProp('prop_theatre', base=0x9a2236, target_faces=4000, hard=False)
    # the back cloth: soft vertical folds
    NX, NY = 120, 12
    V, F = [], []
    fold = lambda x: 0.12 * math.sin(x * 2.2) + 0.04 * math.sin(x * 5.3 + 1.0)
    for j in range(NY + 1):
        y = HT * j / NY
        for i in range(NX + 1):
            x = -W / 2 + W * i / NX
            for dz in (0.06, -0.06):
                V.append((x, y, fold(x) + dz))
    idx = lambda i, j, s: (j * (NX + 1) + i) * 2 + s
    for j in range(NY):
        for i in range(NX):
            F.append((idx(i, j, 0), idx(i + 1, j, 0), idx(i + 1, j + 1, 0), idx(i, j + 1, 0)))
            F.append((idx(i, j + 1, 1), idx(i + 1, j + 1, 1), idx(i + 1, j, 1), idx(i, j, 1)))
    for j in range(NY):
        for i in (0, NX):
            q = (idx(i, j, 1), idx(i, j, 0), idx(i, j + 1, 0), idx(i, j + 1, 1))
            F.append(q if i == 0 else q[::-1])
    for i in range(NX):
        for j in (0, NY):
            q = (idx(i, j, 0), idx(i, j, 1), idx(i + 1, j, 1), idx(i + 1, j, 0))
            F.append(q if j == 0 else q[::-1])
    p.mesh(V, F)
    p.paint_fn(lambda q, n: math.sin(q.x * 2.2) < -0.55, 0x7f1a2c)                 # fold shadows, clean bands
    p.paint_fn(lambda q, n: q.y < 0.35, 0x7f1a2c)
    # proscenium posts and the beam
    p.layer('frame', base=WOOD, target_faces=2000)
    for sx in (-1, 1):
        p.lathe(rounded([(0, 0), (0.42, 0), (0.42, 0.3), (0.28, 0.42), (0.24, 1.0), (0.22, BEAM - 0.5), (0.3, BEAM - 0.35), (0.3, BEAM), (0, BEAM)], 0.05, n=2), pos=(sx * PX, 0, 0.6), seg=20)
    p.box((0, BEAM + 0.2, 0.6), (PX + 0.45, 0.28, 0.32), bevel=0.08)
    p.paint_fn(lambda q, n: q.y < 0.32 or abs(q.y - (BEAM - 0.42)) < 0.05, WOOD_D)
    # the scalloped valance with a gold fringe
    p.layer('valance', base=0xc9283a, target_faces=2400)
    poly = [(-PX - 0.2, BEAM - 0.05), (PX + 0.2, BEAM - 0.05)]
    NS = 14
    hem = []
    for i in range(NS + 1):
        x = PX + 0.2 - (2 * PX + 0.4) * i / NS
        if i < NS:
            for k in range(1, 8):
                u = k / 8
                hem.append((x - (2 * PX + 0.4) / NS * u, BEAM - 0.75 - math.sin(u * math.pi) * 0.32))
        hem.append((x, BEAM - 0.75))
    p.prism(poly + hem, 0.85, 1.0, bevel=0.03)
    p.paint_fn(lambda q, n: q.y > BEAM - 0.25, 0xa81f30)
    p.layer('fringe', base=GOLD, target_faces=1400)
    pts = []
    for i in range(NS):
        x0 = PX + 0.2 - (2 * PX + 0.4) * i / NS
        for k in range(9):
            u = k / 8
            pts.append((x0 - (2 * PX + 0.4) / NS * u, BEAM - 0.75 - math.sin(u * math.pi) * 0.32 - 0.02, 1.02))
    p.tube(pts, 0.045, rseg=6)
    for i in range(NS):
        x = PX + 0.2 - (2 * PX + 0.4) * (i + 0.5) / NS
        p.blob((x, BEAM - 1.2, 1.02), (0.07, 0.11, 0.07), group='tas%d' % i)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, HT, 0))
    p.extras['outline'] = 0.024
    p.build()


for n, fn in [('prop_drumstick', drumstick), ('prop_bandriser', riser), ('prop_pumpkindrum', pumpkindrum), ('prop_bandbell', bandbell),
              ('prop_fairylights', fairylights), ('prop_bandstage', bandstage), ('prop_theatre', theatre)]:
    if want(n):
        fn()
