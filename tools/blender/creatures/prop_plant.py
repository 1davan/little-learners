"""Potted plant (rooms): a white pot with a rim (origin = floor centre, 0.8 tall) and a bushy plant of soft
tapering leaves (layer 'leaves')."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from skit import SProp, dome_profile
from mathutils import Vector, Euler

p = SProp('prop_plant', base=0xffffff)
p.lathe([(0, 0), (0.42, 0), (0.5, 0.62), (0.58, 0.64), (0.58, 0.8), (0.46, 0.8), (0.44, 0.7), (0, 0.7)], seg=20)
p.paint_fn(lambda q, n: q.y > 0.63, 0xffd6e6)
p.layer('leaves', base=0x58c45e)
p.layers['leaves'].update(psegs=1)
LEAF = [(0, 0)] + [(0.16 * math.sin(math.pi * t / 7) ** 0.7, 0.75 * t / 7) for t in range(1, 7)] + [(0, 0.75)]
leaf = LEAF + [(-x, y) for x, y in LEAF[::-1][1:-1]]
for i in range(9):
    a = i / 9 * math.tau + 0.2
    tilt = 25 + 22 * (i % 3)
    R = Euler((math.radians(-tilt), a, 0), 'YXZ').to_matrix()
    verts = []
    for d in (-0.025, 0.025):
        for x, y in leaf:
            v = R @ Vector((x, y, d))
            verts.append((v.x, v.y + 0.66, v.z))
    n = len(leaf)
    faces = [tuple(range(n)), tuple(range(2 * n - 1, n - 1, -1))] + [(k, n + k, n + (k + 1) % n, (k + 1) % n) for k in range(n)]
    p.mesh(verts, faces, bevel=0.012)
p.paint_fn(lambda q, n: n.y < -0.2, 0x46a84e)
p.layer('skin')
p.extras['outline'] = 0.02
p.build()
