"""Toy spade (Bear's nose gear and toys, Splash wash sand). Upright, blade down: about 1.0 long, centred on the origin,
facing +z. Tintable scoop blade (argMode 'tint', blue by default) with a rolled edge, and a yellow handle with a
chunky T-grip on its own layer."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

p = Prop('prop_spade', base=0xffffff, target_faces=700, voxel=0.01, smooth=3)
p.quadriflow = False
# blade: a slightly scooped rounded shield shape
outline = rounded([(-0.17, -0.1), (0.17, -0.1), (0.15, -0.38), (0, -0.5), (-0.15, -0.38)], 0.07, n=4, closed=True)
outline = [(x, y) for x, y, *_ in outline]
cx, cy = 0, -0.28
m = len(outline)
verts = []
for d in (-0.03, 0.03):
    verts.append((cx, cy, d - 0.03))
    verts += [(x, y, d + 0.04 * (x / 0.17) ** 2) for x, y in outline]
k = m + 1
faces = []
for i in range(m):
    j = (i + 1) % m
    faces += [(0, 1 + j, 1 + i), (k, k + 1 + i, k + 1 + j), (1 + i, 1 + j, k + 1 + j, k + 1 + i)]
p.mesh(verts, faces)
p.cyl((0, -0.14, 0), 0.06, 0.12, bevel=0.02, seg=14)
p.paint_fn(lambda q, n: q.y < -0.47 or q.y > -0.16, 0xd6d6d6)
p.layer('handle', base=0xffd23f, target_faces=400, voxel=0.01)
p.quadriflow = False
p.cyl((0, -0.06, 0), 0.04, 0.48, bevel=0.015, seg=12)
p.tube([(-0.12, 0.44, 0), (0.12, 0.44, 0)], 0.05, rseg=10)
p.blob((0, 0.44, 0), (0.06, 0.06, 0.06), group='g')
p.layer('skin')
p.bone('root', (0, -0.5, 0), (0, 0.5, 0))
p.extras['argMode'] = 'tint'
p.extras['argDefault'] = 0x4a90ff
p.extras['outline'] = 0.012
p.build()
