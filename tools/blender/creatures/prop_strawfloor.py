"""Barn floor (Share the snacks, Level 2): warm wooden floorboards running left to right, 24 wide x 10.4 deep, top at
y ~0.03 (the slab sinks below the ground); each board is its own soft plank with a clean ink edge (two shades, dark gaps).
Soft clumps of straw lie only round the sides and the front corners, so nothing pokes into a bowl, the bench or the bin."""
import sys, os, math, random
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop

WOOD_A, WOOD_B, GAP = 0xdcaa6a, 0xd09c5c, 0x8a5a30
STRAW, STRAW_D = 0xf4d262, 0xdcb440
W, D = 12.0, 5.2
BW = 0.8   # board pitch (along z)
p = Prop('prop_strawfloor', base=GAP, target_faces=500, voxel=0.06, smooth=1)
p.quadriflow = False
p.box((0, -0.16, 0), (W, 0.12, D), bevel=0.03)
n = int(2 * D / BW)
for lay, col in (('boardA', WOOD_A), ('boardB', WOOD_B)):
    p.layer(lay, base=col, target_faces=9000, voxel=0.035)
    for i in range(n + 1):
        if (i % 2) != (lay == 'boardB'):
            continue
        z = -D + BW * (i + 0.5)
        if z > D:
            continue
        # boards break at staggered joints
        cut = -W + 3.1 * (i % 4) + 1.2
        segs = [(-W, cut), (cut, cut + 7.6), (cut + 7.6, W)] if cut + 7.6 < W else [(-W, cut), (cut, W)]
        for a, b in segs:
            if b - a < 0.4:
                continue
            p.box(((a + b) / 2, -0.03, z), ((b - a) / 2 - 0.03, 0.06, BW / 2 - 0.03), bevel=0.04)

random.seed(7)
p.layer('straw', base=STRAW, target_faces=1600, voxel=0.02)
p.layer('strawD', base=STRAW_D, target_faces=1200, voxel=0.02)
k = 0
def clump(x, z, s=1.0):
    global k
    for j in range(3):
        p._cur = 'straw' if (k % 3) else 'strawD'
        a = random.uniform(0, math.pi)
        p.blob((x + random.uniform(-0.25, 0.25) * s, 0.05, z + random.uniform(-0.15, 0.15) * s),
               (random.uniform(0.32, 0.5) * s, 0.055, random.uniform(0.08, 0.12) * s), rot=(0, math.degrees(a), 0), group='c%d' % k)
        k += 1
for _ in range(22):
    side = random.choice((-1, 1))
    clump(side * random.uniform(6.0, 11.0), random.uniform(-4.0, 4.6), random.uniform(0.8, 1.2))
for _ in range(8):
    side = random.choice((-1, 1))
    clump(side * random.uniform(3.2, 5.6), random.uniform(3.4, 4.8), random.uniform(0.7, 1.0))
p.layer('skin')
p.bone('body', (0, -0.3, 0), (0, 0.3, 0))
p.extras['outline'] = 0.02
p.build()
