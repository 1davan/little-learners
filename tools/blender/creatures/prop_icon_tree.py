"""Home icon for Apple count: a chunky toy apple tree. Trunk with a root flare and a knot hole; a bumpy cloud canopy in
its own layer 'canopy' painted in greys so the game tints it (green, or orange in autumn) with the layer material;
three big shiny apples (layer 'apples'); snow caps (layer 'cloth_snow', hidden until worn) for winter. ~3.6 tall."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

BARK, BARK_D, BARK_L, HOLE = 0x9a6440, 0x7a4a2c, 0xb07a50, 0x4a2c1a
p = Prop('prop_icon_tree', base=BARK, target_faces=1400, voxel=0.018)
p.lathe(rounded([(0, 0), (0.46, 0), (0.33, 0.12), (0.26, 0.55), (0.22, 1.3), (0.2, 1.9), (0, 1.9)], 0.08, n=4), seg=36)
# two stubby branches up into the canopy
p.curve([(0.05, 1.3, 0), (0.35, 1.7, 0.05), (0.55, 1.95, 0.05)], [0.15, 0.12, 0.1], group='br1')
p.curve([(-0.05, 1.4, 0), (-0.3, 1.8, 0.05), (-0.45, 2.05, 0.0)], [0.14, 0.11, 0.09], group='br2')
# root toes
for a in (-60, 0, 65, 180):
    r = math.radians(a)
    p.blob((0.32 * math.sin(r), 0.08, 0.32 * math.cos(r)), (0.13, 0.08, 0.13), rot=(0, a, 0), group='root%d' % a)
p.paint_fn(lambda q, n: q.y < 0.1, BARK_D)
p.paint('hole', (0.02, 0.85, 0.3), (0.075, 0.11, 0.12), HOLE)
p.paint('holerim', (0.02, 0.85, 0.24), (0.1, 0.14, 0.12), BARK_D)
p.paint('hole2', (0.02, 0.85, 0.3), (0.07, 0.1, 0.12), HOLE)
p.paint('lite', (-0.12, 1.0, 0.25), (0.06, 0.4, 0.1), BARK_L)

# canopy: one bumpy cloud of leaves (painted grey-scale for tinting: light top, darker underside)
p.layer('canopy', base=0xffffff, target_faces=2600, voxel=0.022)
BUMPS = [((0, 2.55, 0), (1.15, 0.9, 0.95)), ((-0.85, 2.3, 0.05), (0.72, 0.62, 0.72)), ((0.85, 2.35, 0.05), (0.72, 0.62, 0.72)),
         ((-0.4, 3.1, 0.0), (0.68, 0.56, 0.66)), ((0.45, 3.12, 0.0), (0.64, 0.54, 0.62)), ((0.0, 1.95, 0.25), (0.85, 0.42, 0.7)),
         ((0, 2.6, -0.45), (0.95, 0.75, 0.6))]
for c, s in BUMPS:
    p.blob(c, s, group='leaf')
p.paint_fn(lambda q, n: n.y < -0.35, 0xb9b9b9)
p.paint_fn(lambda q, n: n.y < 0.1 and n.y >= -0.35, 0xdedede)

# apples
p.layer('apples', base=0xff4b4b, target_faces=1300, voxel=0.011)
APPLES = [(-0.62, 2.4, 0.97), (0.62, 2.8, 0.84), (0.06, 1.95, 1.0)]
for i, (x, y, z) in enumerate(APPLES):
    prof = [(r * 1.25, y * 1.25) for r, y in rounded([(0, -0.2), (0.14, -0.22), (0.25, -0.06), (0.25, 0.1), (0.15, 0.2), (0.04, 0.16), (0, 0.13)], 0.07, n=4)]
    p.lathe(prof, pos=(x, y, z), rot=(14, 0, -8 + i * 8), seg=28)
    p.tube([(x, y + 0.15, z + 0.03), (x + 0.04, y + 0.33, z + 0.06)], 0.034, rseg=6)
    p.blob((x + 0.16, y + 0.28, z + 0.07), (0.14, 0.055, 0.085), rot=(0, 0, 25), group='lf%d' % i)
for i, (x, y, z) in enumerate(APPLES):
    p.paint('stem%d' % i, (x + 0.04, y + 0.3, z + 0.06), (0.06, 0.12, 0.06), 0x7a4a2c)
    p.paint('lf%d' % i, (x + 0.18, y + 0.29, z + 0.07), (0.15, 0.07, 0.1), 0x4fb84a)
    p.paint('sh%d' % i, (x - 0.11, y + 0.09, z + 0.28), (0.075, 0.06, 0.1), 0xffb0a0)

# winter: snow caps over the top bumps
p.layer('cloth_snow', base=0xffffff, target_faces=1100, voxel=0.02)
for (cx, cy, cz), (sx, sy, sz) in BUMPS:
    if cy < 2.4:
        continue
    p.blob((cx, cy + sy * 0.62, cz), (sx * 0.86, sy * 0.42, sz * 0.86), group='snow')
p.paint_fn(lambda q, n: n.y < -0.2, 0xe4eefa)
p.layer('skin')
p.bone('body', (0, 0, 0), (0, 3.6, 0))
p.extras['outline'] = 0.03
p.build()
