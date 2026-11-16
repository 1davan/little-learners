"""Grow a flower: one plant leaf. Its root is the origin and it grows along +x (0.72 long, 0.32 wide, a soft point and a
gentle curl toward the camera at the tip), its blade facing +z: two-tone halves either side of a pale midrib, the same both sides (the game turns it
round for the left leaf)."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop

LEAF, LEAF_D, RIB = 0x62c85a, 0x4fb04a, 0xa6e07a
p = Prop('prop_growleaf', base=LEAF, target_faces=700, voxel=0.009, smooth=3)
p.quadriflow = False
N, M = 28, 9
V, F = [], []
def at(t, s, side):
    x = 0.04 + 0.68 * t
    w = 0.16 * math.sin(math.pi * min(1, t ** 0.8)) ** 0.85 * (1 - 0.15 * t)
    z = s * w
    th = side * (0.024 * (1 - t ** 2) + 0.005)
    # the blade faces the camera (+z), curling gently toward it at the tip and cupped along the midrib
    return (x, z + 0.05 * t ** 2, th + 0.06 * t ** 2.2 - 0.035 * (s * s) * t)
for side in (-1, 1):
    for i in range(N + 1):
        for j in range(M + 1):
            V.append(at(i / N, -1 + 2 * j / M, side))
W = M + 1; off = (N + 1) * W
for i in range(N):
    for j in range(M):
        a, b, c, d = i * W + j, i * W + j + 1, (i + 1) * W + j + 1, (i + 1) * W + j
        F.append((a, b, c, d)); F.append((off + a, off + d, off + c, off + b))
for i in range(N):
    for j in (0, M):
        a, d = i * W + j, (i + 1) * W + j
        F.append((a, d, off + d, off + a))
for j in range(M):
    F.append((j, off + j, off + j + 1, j + 1))
    a = N * W + j
    F.append((a, a + 1, off + a + 1, off + a))
p.mesh(V, F)
p.capsule((0.0, 0.0, 0), (0.12, 0.0, 0), 0.03, group='petiole')
p.paint_fn(lambda q, n: q.y < 0.05 * ((q.x - 0.04) / 0.68) ** 2 - 0.012, LEAF_D)
p.paint_fn(lambda q, n: abs(q.y - 0.05 * ((q.x - 0.04) / 0.68) ** 2) < 0.012 and q.x > 0.06 and q.x < 0.62 and q.z > 0, RIB)
p.bone('body', (0, 0, 0), (0.7, 0, 0))
p.extras['outline'] = 0.012
p.build()
