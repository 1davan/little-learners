"""Round hay bale lying on its side (farm scenery, Moo, Barn band), radius 0.7, 1.1 long along x, resting on y = 0.
Golden straw roll with a darker rolled spiral on both ends, two twine bands and a few loose straws."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from skit import SProp

HAY, HAY_D, HAY_L, TWINE = 0xf0c648, 0xd9a92e, 0xf8dc78, 0xa86f3a
R, HL = 0.7, 0.55
p = SProp('prop_hayroll', base=HAY)
p.cyl((-HL, R, 0), R, 2 * HL, rot=(0, 0, -90), bevel=0.14, seg=24)
p.paint_fn(lambda q, n: abs(q.x) > HL - 0.08 and math.hypot(q.y - R, q.z) < R - 0.16, HAY_L)
p.layer('spiral', base=HAY_D)
for s in (-1, 1):
    pts = []
    for i in range(36):
        t = i / 35
        a = t * math.tau * 2.6
        r = 0.08 + t * (R - 0.26)
        pts.append((s * (HL + 0.005), R + r * math.sin(a), r * math.cos(a) * s))
    p.tube(pts, 0.03, rseg=4)
p.layer('twine', base=TWINE)
for x in (-0.22, 0.22):
    p.ring((x, R, 0), R + 0.012, 0.032, rot=(0, 0, 90), seg=24, rseg=4)
for k, (x, a) in enumerate([(-0.4, 0.4), (-0.05, -0.3), (0.3, 0.2), (0.45, -0.5)]):
    y0 = R + R * 0.96
    p.tube([(x, y0, 0.0), (x + math.sin(a) * 0.12, y0 + 0.12, 0.08 + 0.05 * k)], 0.02, rseg=5)
p.paint_fn(lambda q, n: q.y > 2 * R - 0.05, HAY_L)
p.layer('skin')
p.extras['outline'] = 0.025
p.build()
