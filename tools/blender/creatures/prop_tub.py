"""Wooden wash tub (Wash, level 2). Top radius 1.15, bottom 0.95, rim at y 0.95; hollow (the game lays its water disc at
0.96). Painted staves, two blue-grey metal hoops and two wooden side handles."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

WOOD, WOOD_D, WOOD_IN, HOOP = 0xc98448, 0xa96a36, 0x8a5428, 0x8a93a8
R, RB, H, T = 1.15, 0.95, 0.95, 0.1
p = Prop('prop_tub', base=WOOD, target_faces=4000)
p.lathe(rounded([(0, 0), (RB, 0), (R, H), (R - T, H), (RB - T, 0.45), (0, 0.45)], 0.05, n=4), seg=60)
for s in (-1, 1):
    p.box((s * (R + 0.05), H - 0.05, 0), (0.1, 0.09, 0.2), bevel=0.06)          # handle lugs
r_at = lambda y: RB + (R - RB) * y / H
p.paint_fn(lambda q, n: (n.x * q.x + n.z * q.z) < 0 and q.y > 0.4 and math.hypot(q.x, q.z) < r_at(q.y) - 0.04, WOOD_IN)


def stave_line(q, n):
    if math.hypot(q.x, q.z) < r_at(q.y) - 0.05 or abs(q.x) > R:
        return False
    a = math.atan2(q.x, q.z) / math.tau * 18
    return abs(a - round(a)) < 0.09
p.paint_fn(stave_line, WOOD_D)

p.layer('hoops', base=HOOP, target_faces=1400)
for y in (0.22, 0.75):
    p.ring((0, y, 0), r_at(y) + 0.015, 0.045, seg=60, rseg=8)
p.layer('skin')
p.bone('body', (0, 0, 0), (0, H, 0))
p.extras['outline'] = 0.024
p.build()
