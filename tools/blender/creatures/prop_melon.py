"""Watermelon slice (beach snacks). Stands upright facing +z: a fat wedge, point up, about 1.2 wide and 0.95 tall,
0.36 deep, centred on the origin. Red flesh, a pale band and a striped green rind round the curved bottom, and
dark seeds on both faces."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop

RED, PALE, GREEN, GREEN_D, SEED = 0xff5a6e, 0xe6f7b8, 0x52b947, 0x2f8f3a, 0x3a2838
AY, RR, HA = 0.5, 1.12, math.radians(33)      # apex y, radius from the apex, half angle
p = Prop('prop_melon', base=RED, target_faces=520, voxel=0.014, smooth=3)
poly = [(0, AY - 0.02)] + [(RR * math.sin(a), AY - RR * math.cos(a)) for a in [-HA + 2 * HA * i / 20 for i in range(21)]]
cx = sum(x for x, _ in poly) / len(poly); cy = sum(y for _, y in poly) / len(poly)
verts, faces = [], []
m = len(poly)
for z in (-0.17, 0.17):
    verts.append((cx, cy, z))
    verts += [(x, y, z) for x, y in poly]
k = m + 1
for i in range(m):
    j = (i + 1) % m
    faces += [(0, 1 + j, 1 + i), (k, k + 1 + i, k + 1 + j), (1 + i, 1 + j, k + 1 + j, k + 1 + i)]
p.mesh(verts, faces)
dist = lambda q: math.hypot(q.x, q.y - AY)
p.paint_fn(lambda q, n: dist(q) > RR - 0.2, PALE)
p.paint_fn(lambda q, n: dist(q) > RR - 0.1, GREEN)
p.paint_fn(lambda q, n: dist(q) > RR - 0.1 and math.cos(math.atan2(q.x, AY - q.y) * 28) > 0.3, GREEN_D)
p.layer('seeds', base=SEED, target_faces=200, voxel=0.008)
for d in (1, -1):
    for x, y in ((-0.22, -0.15), (0.0, -0.22), (0.22, -0.15), (-0.1, 0.08), (0.1, 0.08)):
        p.blob((x, y, 0.165 * d), (0.035, 0.055, 0.02), rot=(0, 0, -x * 60), group='s%d%d%d' % (d, int(x * 100), int(y * 100)))
p.layer('skin')
p.bone('root', (0, -0.6, 0), (0, 0.5, 0))
p.extras['outline'] = 0.016
p.build()
