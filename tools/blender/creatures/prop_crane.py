"""Toy tower crane (the world map's Building-site island). Origin = floor centre under the mast, jib reaching to +x.
About 7.3 tall, jib tip at x 4.3, counter-jib to x -1.8. Chunky toy proportions.
Layers (static, one draw each):
  skin   yellow: a square lattice mast (corner posts, rungs, diagonal braces), the slewing platform, the cab, the jib
         and counter-jib beams with braces, the A-frame peak, the trolley
  metal  grey: the concrete foot, the counterweight blocks, the tie bars from the peak, the cable and the hook
  glass  the cab windows
  load   a pallet of three toy bricks (red, blue, yellow) hanging from the hook"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from skit import SProp

YEL, YEL_D, GREY, GREY_D, GLASS = 0xffc21a, 0xe0a010, 0x8a8f9a, 0x6a6f7a, 0xbfe6ff
M, TOP = 0.32, 5.6            # mast half width, mast top
JY = TOP + 0.55               # jib centre height
JX0, JX1 = -1.8, 4.3          # counter-jib end, jib tip
HX, HY = 3.1, 3.0             # hook x, hook block y

p = SProp('prop_crane', base=YEL)
for sx in (-1, 1):
    for sz in (-1, 1):
        p.box((sx * M, (0.5 + TOP) / 2, sz * M), (0.075, (TOP - 0.5) / 2, 0.075), bevel=0.03)
step = 0.72
n = int((TOP - 0.6) / step)
for i in range(n + 1):
    y = 0.6 + i * step
    for sx in (-1, 1):
        p.box((sx * M, y, 0), (0.05, 0.05, M), bevel=0.02)
        p.box((0, y, sx * M), (M, 0.05, 0.05), bevel=0.02)
    if i < n:
        ang = math.degrees(math.atan2(step, 2 * M))
        half = math.hypot(step, 2 * M) / 2
        k = 1 if i % 2 else -1
        for s in (-1, 1):
            p.box((0, y + step / 2, s * M), (half, 0.04, 0.04), rot=(0, 0, k * ang), bevel=0.015)
            p.box((s * M, y + step / 2, 0), (0.04, 0.04, half), rot=(-k * ang, 0, 0), bevel=0.015)
p.box((0, TOP + 0.08, 0), (0.5, 0.1, 0.5), bevel=0.04)                         # slewing platform
p.box((0.42, TOP + 0.55, 0.42), (0.36, 0.34, 0.3), bevel=0.08)                 # cab
for s in (-1, 1):                                                               # jib: two chords + braces
    p.box(((JX1 + 0.5) / 2, JY + s * 0.18, 0), ((JX1 - 0.5) / 2, 0.06, 0.16), bevel=0.03)
for k in range(9):
    x = 0.75 + k * (JX1 - 0.95) / 8
    p.box((x, JY, 0), (0.035, 0.18, 0.12), rot=(0, 0, 35 if k % 2 else -35), bevel=0.012)
p.box(((JX0 - 0.4) / 2, JY, 0), ((-JX0 - 0.4) / 2 + 0.2, 0.16, 0.2), bevel=0.05)   # counter-jib
p.cyl((0, TOP + 0.2, 0), 0.28, 1.6, r2=0.06, seg=4, rot=(0, 45, 0), bevel=0.04)     # peak
p.box((HX, JY - 0.3, 0), (0.22, 0.09, 0.2), bevel=0.04)                          # trolley
p.paint_fn(lambda q, n: n.y < -0.6, YEL_D)

p.layer('metal', base=GREY)
p.box((0, 0.25, 0), (0.75, 0.25, 0.75), bevel=0.08)                             # concrete foot
for i, x in enumerate((-1.35, -1.68)):
    p.box((x, JY - 0.45, 0), (0.15, 0.38, 0.28), bevel=0.05)                    # counterweights
PEAK = (0, TOP + 1.75, 0)
for tx in (JX1 - 0.1, JX0 + 0.15):
    p.tube([PEAK, (tx, JY + 0.2, 0)], 0.035, rseg=6)
p.cyl((0, TOP + 1.7, 0), 0.08, 0.12, seg=10, bevel=0.03)
p.tube([(HX, JY - 0.4, 0), (HX, HY + 0.2, 0)], 0.022, rseg=6)                   # cable
p.box((HX, HY + 0.1, 0), (0.16, 0.13, 0.13), bevel=0.04)                        # hook block
hook = [(HX + 0.12 * math.sin(a), HY - 0.18 - 0.12 * (1 - math.cos(a)), 0) for a in [math.pi * (0.1 + 1.3 * k / 10) for k in range(11)]]
p.tube([(HX, HY - 0.03, 0)] + hook, 0.035, rseg=6)
for s in (-1, 1):                                                               # slings to the pallet
    p.tube([(HX, HY - 0.2, 0), (HX + s * 0.55, HY - 0.95, 0)], 0.015, rseg=4)
p.paint_fn(lambda q, n: q.y < 0.52 and q.y > 0.45, GREY_D)
p.paint_fn(lambda q, n: abs(q.x - HX) < 0.17 and abs(q.y - HY - 0.1) < 0.14, 0xff5a3a)

p.layer('glass', base=GLASS)
p.box((0.42, TOP + 0.62, 0.725), (0.27, 0.17, 0.02), bevel=0.01)
p.box((0.79, TOP + 0.62, 0.42), (0.02, 0.17, 0.2), bevel=0.01)

p.layer('load', base=0xffffff)
p.box((HX, HY - 1.02, 0), (0.62, 0.05, 0.36), bevel=0.02)                        # pallet board
for i, (dx, dy, col) in enumerate(((-0.3, 0, 0xff4f4f), (0.3, 0, 0x3f8cff), (0, 0.36, 0xffd23a))):
    p.box((HX + dx, HY - 0.82 + dy, 0), (0.28, 0.14, 0.3), bevel=0.05)
    for sx in (-0.13, 0.13):
        p.cyl((HX + dx + sx, HY - 0.68 + dy, 0), 0.08, 0.06, seg=12, bevel=0.02)
p.paint_fn(lambda q, n: q.y < HY - 0.96, 0xc8955a)
p.paint_fn(lambda q, n: q.y >= HY - 0.96 and q.y < HY - 0.61 and q.x < HX, 0xff4f4f)
p.paint_fn(lambda q, n: q.y >= HY - 0.96 and q.y < HY - 0.61 and q.x >= HX, 0x3f8cff)
p.paint_fn(lambda q, n: q.y >= HY - 0.61, 0xffd23a)
p.layer('skin')
p.extras['outline'] = 0.024
p.build()
