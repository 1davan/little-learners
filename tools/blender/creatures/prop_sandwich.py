"""Triangle sandwich (Where's Crab? picnic). Lies flat: a right-angled triangle about 0.95 x 0.95, 0.42 tall, origin
at the middle of the bottom. Soft white bread with golden crusts, wavy lettuce, a cheese slice and tomato peeking out."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from skit import SProp, rounded

BREAD, CRUST, LETTUCE, CHEESE, TOMATO = 0xfff4dc, 0xe0a85a, 0x6fcf4a, 0xffd23f, 0xff5a4a
L = 0.95
tri = rounded([(-L / 2, -L / 2), (L / 2, -L / 2), (-L / 2, L / 2)], 0.1, n=3, closed=True)
tri = [(x, y) for x, y, *_ in tri]


def slab(poly, y0, y1, scale=1.0, wobble=0.0, bevel=0.04):
    cx = sum(x for x, _ in poly) / len(poly); cz = sum(z for _, z in poly) / len(poly)
    pts = []
    for i, (x, z) in enumerate(poly):
        k = scale + wobble * math.sin(i * 2.3)
        pts.append((cx + (x - cx) * k, cz + (z - cz) * k))
    p.prism(pts, y0, y1, bevel=bevel, axis='y')


p = SProp('prop_sandwich', base=BREAD)          # crisp bevelled slices: clean toast faces, a crust band round the edge
slab(tri, 0.0, 0.14)
slab(tri, 0.28, 0.42)
p.paint_fn(lambda q, n: abs(n.y) < 0.55, CRUST)
p.layer('lettuce', base=LETTUCE)
dense = []
for i in range(len(tri)):
    a, b = tri[i], tri[(i + 1) % len(tri)]
    for t in range(4):
        dense.append((a[0] + (b[0] - a[0]) * t / 4, a[1] + (b[1] - a[1]) * t / 4))
slab(dense, 0.135, 0.19, scale=1.1, wobble=0.04, bevel=0.02)
p.layer('cheese', base=CHEESE)
slab(tri, 0.19, 0.235, scale=1.04, bevel=0.015)
p.lathe([(0, 0.0), (0.06, 0.0), (0.07, 0.05), (0.04, 0.09), (0, 0.1)], pos=(L / 2 - 0.03, 0.12, -L / 2 + 0.07), seg=14)   # a cheese drip
p.layer('tomato', base=TOMATO)
for x, z in ((0.05, 0.12), (-0.24, -0.05)):
    p.cyl((x, 0.235, z), 0.2, 0.05, bevel=0.02, seg=28)
p.paint_fn(lambda q, n: n.y > 0.6 and any(math.hypot(q.x - x, q.z - z) < 0.12 for x, z in ((0.05, 0.12), (-0.24, -0.05))), 0xff7a6a)
p.layer('skin')
p.bone('root', (0, 0, 0), (0, 0.4, 0))
p.extras['outline'] = 0.016
p.build()
