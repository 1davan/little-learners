"""Leaf plate (Share the snacks, garden party). A big soft leaf 2.6 long x 1.8 wide lying flat (pointed tip toward +x,
a curled stalk at -x), top at y ~0.15, two-tone halves either side of a pale midrib, with a tintable rim ring (skin
layer, the game lights it gold) laid on it."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

LEAF, LEAF_D, RIB = 0x62c85a, 0x4fb04a, 0xb6e88a
p = Prop('prop_leafplate', base=0xffffff, target_faces=900, voxel=0.014, smooth=3)
ring = []
for i in range(72):
    a = i / 72 * math.tau
    x, z = 1.16 * math.cos(a), 0.8 * math.sin(a)
    ring.append((x, 0.165 + 0.05 * (x * x / 1.7 + z * z / 0.86), z))
p.tube(ring, 0.055, closed=True, rseg=10)
p.layer('leaf', base=LEAF, target_faces=1800, voxel=0.016)
# outline: an ellipse-ish leaf with a pointed tip at +x
N = 64
V, F = [], []
pts = []
for i in range(N):
    a = i / N * math.tau
    x, z = math.cos(a), math.sin(a)
    rx = 1.32 + 0.12 * max(0, x) ** 6
    w = 0.93 * (1 - 0.12 * max(0, x) ** 2)
    px, pz = x * rx, z * w * (1 - 0.35 * max(0, x) ** 8)
    pts.append((px, pz))
for y, k in ((0.02, 0.97), (0.11, 1.0), (0.15, 0.985)):
    for px, pz in pts:
        cup = 0.05 * (px * px / 1.7 + pz * pz / 0.86)    # gently cupped: the edges curl up
        V.append((px * k, y + cup, pz * k))
for ring in range(2):
    for i in range(N):
        j = (i + 1) % N
        a, b = ring * N + i, ring * N + j
        F.append((a, b, b + N, a + N))
c0 = len(V); V.append((0, 0.02, 0)); c1 = len(V); V.append((0, 0.14, 0))
for i in range(N):
    j = (i + 1) % N
    F.append((c0, j, i)); F.append((c1, 2 * N + i, 2 * N + j))
p.mesh(V, F)
p.paint_fn(lambda q, n: q.z < -0.025 + 0.04 * q.x, LEAF_D)
p.paint_fn(lambda q, n: abs(q.z - 0.04 * q.x + 0.0) < 0.03 and n.y > 0.5 and q.x > -1.2, RIB)
p.layer('stalk', base=0x4fa84a, target_faces=200, voxel=0.012)
p.tube([(-1.25, 0.08, 0), (-1.55, 0.07, 0.04), (-1.72, 0.1, 0.16), (-1.68, 0.15, 0.3)], [0.06, 0.05, 0.04, 0.035], rseg=8)
p.layer('skin')
p.bone('body', (0, 0, 0), (0, 0.2, 0))
p.extras['argMode'] = 'tint'
p.extras['argDefault'] = 0xff5a5a
p.extras['outline'] = 0.02
p.build()
