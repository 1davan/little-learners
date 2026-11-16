"""Swim flipper (Bear's nose 'feet' gear). Lies flat, toes toward +z; origin at the heel of the foot pocket. A rounded
foot pocket (a shade darker) and a wide duck-foot blade 0.8 long that fans out to three rounded toes, with two
raised ribs. Tintable (argMode 'tint', green)."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

p = Prop('prop_flipper', base=0xffffff, target_faces=1200, voxel=0.01, smooth=3)
p.quadriflow = False
p.blob((0, 0.085, 0.13), (0.15, 0.085, 0.17), group='pocket')
p.blob((0, 0.06, 0.28), (0.14, 0.05, 0.12), group='pocket')
side = [(0.13, 0.22), (0.17, 0.45), (0.27, 0.72)]
toes = []
for k in range(3):
    cx = (k - 1) * 0.18
    for i in range(7):
        a = math.pi * i / 6
        toes.append((cx + 0.09 * math.cos(math.pi - a), 0.8 + 0.08 * math.sin(a)))
poly = [(-x, z) for x, z in side] + toes + [(x, z) for x, z in reversed(side)]
poly = [(x, z) for x, z, *_ in rounded(poly, 0.04, n=2, closed=True)]
m = len(poly)
verts = []
for y in (0.012, 0.06):
    verts.append((0, y, 0.5))
    verts += [(x, y - 0.02 * max(0, z - 0.3), z) for x, z in poly]
k = m + 1
faces = []
for i in range(m):
    j = (i + 1) % m
    faces += [(0, 1 + i, 1 + j), (k, k + 1 + j, k + 1 + i), (1 + i, k + 1 + i, k + 1 + j, 1 + j)]
p.mesh(verts, faces)
for s in (-1, 1):
    p.capsule((s * 0.09, 0.06, 0.32), (s * 0.18, 0.05, 0.74), 0.022, group='rib%d' % s, steps=8)
p.paint_fn(lambda q, n: q.z < 0.33 and q.y > 0.07, 0xd0d0d0)
p.bone('root', (0, 0, 0), (0, 0.3, 0))
p.extras['argMode'] = 'tint'
p.extras['argDefault'] = 0x5fd068
p.extras['outline'] = 0.012
p.build()
