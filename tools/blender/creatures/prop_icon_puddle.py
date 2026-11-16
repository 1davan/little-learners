"""Rainy pedestal trim (home menu): a wobbly-edged rain puddle the pedestal stands in, ~3.8 x 2.6, a sliver thick, sky
blue with a lighter rim and two white glints. Lies on the ground (y 0..0.03)."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop

p = Prop('prop_icon_puddle', base=0x8fc8ee, target_faces=900, voxel=0.014)
M = 64
poly = []
for i in range(M):
    a = math.tau * i / M
    r = 1 + 0.09 * math.sin(3 * a + 0.4) + 0.06 * math.sin(5 * a + 1.3) + 0.04 * math.sin(7 * a)
    poly.append((1.9 * r * math.sin(a), 1.3 * r * math.cos(a)))
verts = [(0, 0.0, 0)] + [(x, 0.0, z) for x, z in poly] + [(0, 0.03, 0)] + [(x, 0.03, z) for x, z in poly]
k = M + 1
faces = []
for i in range(M):
    j = (i + 1) % M
    faces += [(0, 1 + i, 1 + j), (k, k + 1 + j, k + 1 + i), (1 + i, k + 1 + i, k + 1 + j, 1 + j)]
p.mesh(verts, faces)
p.paint_fn(lambda q, n: (q.x / 1.9) ** 2 + (q.z / 1.3) ** 2 > 0.78, 0xb4dcf6)
p.paint('g1', (-1.05, 0.03, 0.75), (0.32, 0.05, 0.06), 0xffffff, rot=(0, -25, 0))
p.paint('g2', (-0.72, 0.03, 0.9), (0.12, 0.05, 0.05), 0xffffff, rot=(0, -25, 0))
p.bone('body', (0, 0, 0), (0, 0.1, 0))
p.extras['outline'] = 0.014
p.build()
