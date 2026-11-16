"""Flowerpot (tintable, default terracotta). Unit size: rim radius 1.0, base radius 0.63, 1.3 tall, upright and hollow
(soil goes in the top). A rolled rim band, a cream stripe, and a drainage hole underneath - the farm's makePot turns it
upside down (hole on top) to hide things under it; Grow a flower uses it upright as a planter."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

BODY, RIM, INSIDE, CREAM, HOLE = 0xececec, 0xffffff, 0x8c8c8c, 0xfff1d6, 0x4a2a1a
RB, RT, H, RH = 0.63, 0.86, 1.3, 0.27      # base r, body top r, total height, rim band height
p = Prop('prop_pot', base=BODY, target_faces=3600)
y0 = H - RH
outer = [(0, 0), (RB, 0), (RT, y0), (1.0, y0), (1.0, H), (0.88, H), (0.75, y0 - 0.12), (RB - 0.1, 0.14), (0, 0.14)]
p.lathe(rounded(outer, 0.06, n=4), seg=56)
inward = lambda q, n: (n.x * q.x + n.z * q.z) < -0.2 * math.hypot(q.x, q.z) or (n.y > 0.6 and 0.05 < q.y < y0)
p.paint_fn(lambda q, n: q.y < H - 0.06 and q.y > 0.05 and math.hypot(q.x, q.z) < 0.92 and inward(q, n), INSIDE)
p.paint_fn(lambda q, n: q.y > y0 - 0.02 and not (math.hypot(q.x, q.z) < 0.92 and inward(q, n)), RIM)

p.layer('band', base=CREAM, target_faces=900, voxel=0.014)
yb = 0.52
rb = RB + (RT - RB) * yb / y0
p.lathe([(rb - 0.03, yb - 0.08), (rb + 0.03, yb - 0.07), (rb + 0.045, yb), (rb + 0.03 + 0.012, yb + 0.07), (rb - 0.03 + 0.012, yb + 0.08)], seg=56, closed=True)
p.layer('hole', base=HOLE, target_faces=200, voxel=0.01)
p.cyl((0, -0.012, 0), 0.17, 0.03, bevel=0.01, seg=20)
p.layer('skin')

p.bone('body', (0, 0, 0), (0, H, 0))
p.extras['argMode'] = 'tint'
p.extras['argDefault'] = 0xd9774a
p.extras['outline'] = 0.026
p.build()
