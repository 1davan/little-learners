"""Home icon for Splash wash: a sky-blue clawfoot bathtub heaped with foam, a yellow sponge resting on the rim and a few
loose bubbles. Oval, ~2.5 long x 1.4 deep, rim at y ~1.0, foam to ~1.45. (The game sits a rubber duck in the foam.)"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

TUB, TUB_D, RIM, INSIDE, GOLD = 0x8fd0ff, 0x5fa8e8, 0xffffff, 0xd6eefc, 0xffcc33
SX, SZ = 1.2, 0.62
p = Prop('prop_icon_bath', base=TUB, target_faces=2000, voxel=0.018)
wall = rounded([(0, 0.2), (0.8, 0.2), (0.98, 0.5), (1.0, 0.98), (0.91, 0.98), (0.86, 0.42), (0, 0.4)], 0.08, n=4)
p.lathe(wall, scale=(SX, SZ), seg=64)
p.ring((0, 0.98, 0), 0.955, 0.07, scale=(SX, SZ), seg=72, rseg=10)
p.paint_fn(lambda q, n: q.y > 0.9, RIM)
p.paint_fn(lambda q, n: q.y > 0.9 and n.y < -0.2, 0xe6f2fb)
p.paint_fn(lambda q, n: q.y < 0.3, TUB_D)
# claw feet
p.layer('feet', base=GOLD, target_faces=600, voxel=0.012)
for sx in (-1, 1):
    for sz in (-1, 1):
        x, z = sx * 0.72, sz * 0.3
        p.blob((x, 0.2, z), (0.1, 0.1, 0.1), group='leg%d%d' % (sx, sz))
        p.blob((x + sx * 0.05, 0.08, z + sz * 0.04), (0.12, 0.08, 0.12), group='paw%d%d' % (sx, sz))
p.paint_fn(lambda q, n: q.y > 0.22, 0xe8a317)

# foam heaped over the rim
p.layer('foam', base=0xffffff, target_faces=1800, voxel=0.02)
FOAM = [(-0.78, 1.04, 0.08, 0.26), (-0.45, 1.1, 0.16, 0.3), (-0.06, 1.12, 0.14, 0.32), (0.34, 1.1, 0.16, 0.29), (0.7, 1.04, 0.08, 0.25),
        (-0.62, 1.06, -0.15, 0.27), (-0.22, 1.12, -0.12, 0.3), (0.2, 1.12, -0.12, 0.3), (0.58, 1.06, -0.14, 0.26),
        (-0.3, 1.36, 0.02, 0.24), (0.12, 1.4, 0.0, 0.26), (-0.08, 1.6, -0.02, 0.17), (0.45, 1.3, 0.0, 0.18), (-0.62, 1.27, 0.0, 0.16),
        (-0.95, 1.0, 0.0, 0.17), (0.95, 1.0, -0.05, 0.16)]
for k, (x, y, z, r) in enumerate(FOAM):
    p.blob((x, y, z), (r, r * 0.95, r), group='foam%d' % k)
p.paint_fn(lambda q, n: n.y < -0.05, 0xd4ebfb)
p.paint_fn(lambda q, n: n.y < -0.55, 0xbfe0f7)

# sponge on the right end of the rim
p.layer('sponge', base=0xffe066, target_faces=700, voxel=0.012)
p.box((1.08, 1.12, 0.12), (0.26, 0.13, 0.18), rot=(0, -20, -18), bevel=0.07)
p.paint_fn(lambda q, n: (q.y - 1.12) * math.cos(math.radians(18)) + (q.x - 1.08) * math.sin(math.radians(18)) > 0.06, 0x6fd08c)
for k, (dx, dy) in enumerate([(-0.12, -0.03), (0.02, 0.0), (0.14, -0.05), (-0.04, -0.07)]):
    p.paint('pore%d' % k, (1.08 + dx, 1.08 + dy, 0.33), (0.025, 0.025, 0.06), 0xd9b640)

# loose bubbles drifting up
p.layer('bubbles', base=0xe6f6ff, target_faces=500, voxel=0.012)
for k, (x, y, z, r) in enumerate([(-0.95, 1.55, 0.2, 0.13), (-0.6, 1.8, 0.1, 0.1), (0.75, 1.6, 0.15, 0.12), (0.5, 1.95, 0.0, 0.08)]):
    p.blob((x, y, z), (r, r, r), group='bb%d' % k)
    p.paint('bs%d' % k, (x - r * 0.35, y + r * 0.35, z + r * 0.8), (r * 0.3, r * 0.25, r * 0.3), 0xffffff)
p.layer('skin')
p.bone('body', (0, 0, 0), (0, 1.2, 0))
p.extras['outline'] = 0.026
p.build()
