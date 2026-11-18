"""Rainy pedestal trim (home menu): a wobbly-edged rain puddle the pedestal stands in, ~3.8 x 2.6, a sliver thick, sky
blue with a lighter rim and two white glints. Lies on the ground (y 0..0.03)."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from skit import SProp
p = SProp('prop_icon_puddle', base=0x8fc8ee)          # one clean closed mesh: no remesh, crisp edge
M = 64
poly = []
for i in range(M):
    a = math.tau * i / M
    r = 1 + 0.09 * math.sin(3 * a + 0.4) + 0.06 * math.sin(5 * a + 1.3) + 0.04 * math.sin(7 * a)
    poly.append((1.9 * r * math.sin(a), 1.3 * r * math.cos(a)))
# a soft lens: the wobbly outline extruded with a rounded edge (0.06 thick so it has a clean ink outline)
rings = [(1.0, 0.0), (0.985, 0.03), (0.95, 0.052), (0.9, 0.06)] + [(0.9 * (1 - k / 9), 0.06) for k in range(1, 9)]
verts, faces = [(0, 0.0, 0)], []
for sc, y in rings:
    verts += [(x * sc, y, z * sc) for x, z in poly]
verts.append((0, 0.06, 0))
top = len(verts) - 1
for i in range(M):
    j = (i + 1) % M
    faces.append((0, 1 + i, 1 + j))
    for r in range(len(rings) - 1):
        a0, a1 = 1 + r * M, 1 + (r + 1) * M
        faces.append((a0 + i, a1 + i, a1 + j, a0 + j))
    last = 1 + (len(rings) - 1) * M
    faces.append((top, last + j, last + i))
p.mesh(verts, faces)
p.paint_fn(lambda q, n: (q.x / 1.9) ** 2 + (q.z / 1.3) ** 2 > 0.76, 0xb4dcf6)


def ripple(q, n):
    for cx, cz, r in ((0.55, -0.15, 0.42), (0.55, -0.15, 0.22)):
        d = math.hypot((q.x - cx) / 1.25, q.z - cz)
        if abs(d - r) < 0.03:
            return True
    return False


p.paint_fn(lambda q, n: ripple(q, n) and n.y > 0.5, 0xd6efff)
p.paint_fn(lambda q, n: n.y > 0.5 and (((q.x + 1.0) * 0.9 + (q.z - 0.72) * 0.43) ** 2 / 0.09 + (-(q.x + 1.0) * 0.43 + (q.z - 0.72) * 0.9) ** 2 / 0.004 < 1
                                      or (q.x + 0.62) ** 2 / 0.012 + (q.z - 0.92) ** 2 / 0.003 < 1), 0xffffff)
p.bone('body', (0, 0, 0), (0, 0.1, 0))
p.extras['outline'] = 0.016
p.build()
