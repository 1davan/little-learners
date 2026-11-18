"""Inside the barn (Share the snacks, Level 2): the back wall seen from inside. 24 wide x 6.6 tall, front face at z ~+0.2.
Vertical red planks, each its own soft board with a clean ink edge (two alternating shades, dark gaps between them), a
chunky wooden hay-loft beam at y 4.3 with hay spilling over it, two sturdy posts at x +-7.2 with corner braces, a skirting
board along the floor and a ceiling beam at the top."""
import sys, os, math, random
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop

RED_A, RED_B, GAP = 0xd84c3d, 0xc94236, 0x6e2620
WOOD, WOOD_D = 0xa8703f, 0x8a5a30
HAY, HAY_D = 0xf2cd5a, 0xe2b844
W, H = 12.0, 6.6
PW = 0.92   # plank pitch
p = Prop('prop_barnback', base=GAP, target_faces=600, voxel=0.06, smooth=1)
p.quadriflow = False
p.box((0, H / 2, -0.12), (W, H / 2, 0.1), bevel=0.03)     # the dark backing that shows between the planks
n = int(2 * W / PW)
for lay, col in (('plankA', RED_A), ('plankB', RED_B)):
    p.layer(lay, base=col, target_faces=9000, voxel=0.035)
    for i in range(n):
        if (i % 2) != (lay == 'plankB'):
            continue
        x = -W + PW * (i + 0.5)
        p.box((x, H / 2, 0.02), (PW / 2 - 0.035, H / 2 - 0.02, 0.07), bevel=0.05)

p.layer('wood', base=WOOD, target_faces=3000, voxel=0.03)
p.box((0, 4.3, 0.3), (W, 0.24, 0.2), bevel=0.08)            # hay-loft beam
p.box((0, 6.45, 0.25), (W, 0.2, 0.2), bevel=0.06)            # ceiling beam
p.box((0, 0.16, 0.18), (W, 0.16, 0.08), bevel=0.04)          # skirting board
p.layer('posts', base=WOOD_D, target_faces=1600, voxel=0.03)
for sx in (-1, 1):
    x = sx * 7.2
    p.box((x, H / 2, 0.36), (0.26, H / 2, 0.2), bevel=0.07)  # post
    p.box((x - sx * 0.62, 3.72, 0.34), (0.12, 0.62, 0.12), rot=(0, 0, sx * 45), bevel=0.04)  # brace
p.layer('bolts', base=0x4a3a3a, target_faces=400, voxel=0.012)
for sx in (-1, 1):
    for y in (4.15, 4.45):
        p.blob((sx * 7.2, y, 0.58), (0.055, 0.055, 0.03), group='b%d%d' % (sx, int(y * 10)))

# hay spilling over the loft beam, in soft clumps of two shades
random.seed(4)
for lay, col in (('hay', HAY), ('hayD', HAY_D)):
    p.layer(lay, base=col, target_faces=1800, voxel=0.03)
x = -W + 0.3
i = 0
while x < W - 0.3:
    w = 0.5 + random.random() * 0.5
    h = 0.22 + random.random() * 0.22
    p._cur = 'hay' if i % 2 == 0 else 'hayD'
    p.blob((x, 4.62 + h * 0.4, 0.14), (w * 0.62, h, 0.3), group='h%d' % i)
    if random.random() < 0.45:
        p.blob((x + 0.1, 4.48, 0.42), (0.16, 0.2, 0.1), rot=(0, 0, random.uniform(-25, 25)), group='d%d' % i)
    x += w
    i += 1
p.layer('skin')
p.bone('body', (0, 0, 0), (0, H, 0))
p.extras['outline'] = 0.03
p.build()
