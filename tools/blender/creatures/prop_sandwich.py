"""Triangle sandwich (Where's Crab? picnic). Lies flat: a right-angled triangle about 0.95 x 0.95, 0.42 tall, origin
at the middle of the bottom. Soft white bread with golden crusts, wavy lettuce, a cheese slice and tomato peeking out."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

BREAD, CRUST, LETTUCE, CHEESE, TOMATO = 0xfff4dc, 0xe0a85a, 0x6fcf4a, 0xffd23f, 0xff5a4a
L = 0.95
tri = rounded([(-L / 2, -L / 2), (L / 2, -L / 2), (-L / 2, L / 2)], 0.1, n=3, closed=True)
tri = [(x, y) for x, y, *_ in tri]


def slab(poly, y0, y1, scale=1.0, wobble=0.0):
    cx = sum(x for x, _ in poly) / len(poly); cz = sum(z for _, z in poly) / len(poly)
    pts = []
    for i, (x, z) in enumerate(poly):
        k = scale + wobble * math.sin(i * 2.3)
        pts.append((cx + (x - cx) * k, cz + (z - cz) * k))
    m = len(pts)
    verts = [(cx, y0, cz)] + [(x, y0, z) for x, z in pts] + [(cx, y1, cz)] + [(x, y1, z) for x, z in pts]
    k = m + 1
    faces = []
    for i in range(m):
        j = (i + 1) % m
        faces += [(0, 1 + i, 1 + j), (k, k + 1 + j, k + 1 + i), (1 + i, k + 1 + i, k + 1 + j, 1 + j)]
    p.mesh(verts, faces)


p = Prop('prop_sandwich', base=BREAD, target_faces=420, voxel=0.014, smooth=3)
p.quadriflow = False
slab(tri, 0.0, 0.14)
slab(tri, 0.28, 0.42)
p.paint_fn(lambda q, n: abs(n.y) < 0.6, CRUST)
p.layer('lettuce', base=LETTUCE, target_faces=260, voxel=0.012)
dense = []
for i in range(len(tri)):
    a, b = tri[i], tri[(i + 1) % len(tri)]
    for t in range(4):
        dense.append((a[0] + (b[0] - a[0]) * t / 4, a[1] + (b[1] - a[1]) * t / 4))
slab(dense, 0.13, 0.19, scale=1.1, wobble=0.04)
p.layer('cheese', base=CHEESE, target_faces=160, voxel=0.012)
slab(tri, 0.19, 0.235, scale=1.04)
p.blob((L / 2 - 0.02, 0.18, -L / 2 + 0.06), (0.07, 0.07, 0.06), group='drip')
p.layer('tomato', base=TOMATO, target_faces=160, voxel=0.012)
for x, z in ((0.05, 0.12), (-0.24, -0.05)):
    p.cyl((x, 0.235, z), 0.2, 0.05, bevel=0.02, seg=20)
p.layer('skin')
p.bone('root', (0, 0, 0), (0, 0.4, 0))
p.extras['outline'] = 0.016
p.build()
