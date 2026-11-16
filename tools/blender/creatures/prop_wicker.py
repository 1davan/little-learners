"""Wicker basket full of straw (Apple count, the hedgehog's basket). Top radius 1.5, bottom 1.1, rim at y 1.0, a braided
rim, two side handles and woven bands; the straw bed inside is at y 0.62 where the fruit lands."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

WEAVE, WEAVE_D, WEAVE_L, BRAID, STRAW, STRAW_D = 0xd09a5a, 0xa8723c, 0xe2b276, 0xb07a40, 0xf2d06a, 0xd9b048
R, RB, H, T = 1.5, 1.1, 1.0, 0.1
p = Prop('prop_wicker', base=WEAVE, target_faces=5200, voxel=0.02)
p.lathe(rounded([(0, 0), (RB, 0), (R, H - 0.04), (R - T, H - 0.04), (RB - T * 0.8, 0.12), (0, 0.12)], 0.06, n=4), seg=64)
r_at = lambda y: RB + (R - RB) * y / H


def weave(q, n):
    if math.hypot(q.x, q.z) < r_at(q.y) - 0.05:
        return False
    a = math.atan2(q.x, q.z) / math.tau * 28
    row = int((q.y + 0.02) / 0.16)
    return (int(math.floor(a)) + row) % 2 == 0
p.paint_fn(weave, WEAVE_L)
p.paint_fn(lambda q, n: math.hypot(q.x, q.z) > r_at(q.y) - 0.05 and abs(((q.y + 0.02) / 0.16) % 1 - 0.0) < 0.12, WEAVE_D)

p.layer('braid', base=BRAID, target_faces=2200, voxel=0.016)
for ph in (0, math.pi):
    pts = []
    for i in range(121):
        a = i / 120 * math.tau
        rr = R - T / 2 + 0.05 * math.cos(a * 18 + ph)
        pts.append((rr * math.sin(a), H - 0.01 + 0.05 * math.sin(a * 18 + ph), rr * math.cos(a)))
    p.tube(pts[:-1], 0.075, closed=True, rseg=8)
for s in (-1, 1):
    p.tube([(s * (R - 0.02), H - 0.25, -0.32)] + [(s * (R + 0.2 * math.sin(math.radians(a))), H - 0.25 + 0.3 * math.sin(math.radians(a)), -0.32 * math.cos(math.radians(a))) for a in range(15, 166, 15)] + [(s * (R - 0.02), H - 0.25, 0.32)], 0.06, rseg=8)
p.paint_fn(lambda q, n: (n.y > 0.3) and (int((math.atan2(q.x, q.z) + 4) * 20) % 2 == 0), WEAVE_L)

p.layer('straw', base=STRAW, target_faces=1600, voxel=0.02)
r_in = lambda y: (RB - T * 0.8) + (R - T - (RB - T * 0.8)) * (y - 0.12) / (H - 0.16) - 0.03
p.lathe(rounded([(0, 0.1), (r_in(0.12), 0.1), (r_in(0.58), 0.56), (0, 0.6)], 0.05, n=3), seg=48)
for i in range(16):
    a = i * 2.4
    rr = 0.35 + (i % 4) * 0.25
    p.blob((rr * math.sin(a), 0.6, rr * math.cos(a)), (0.3, 0.06, 0.12), rot=(0, math.degrees(a) + 40, 0), group='s%d' % i)
p.paint_fn(lambda q, n: (int((q.x + q.z * 0.7) * 9) % 3) == 0 and q.y > 0.55, STRAW_D)
p.layer('skin')
p.bone('body', (0, 0, 0), (0, H, 0))
p.extras['outline'] = 0.03
p.build()
