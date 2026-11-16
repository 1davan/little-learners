"""Brick letters picture: T is for Tree. A round, fluffy storybook tree (about 2.0 wide, 2.7 tall): a sturdy brown
trunk with flared roots and a little knot hole, and a big cloud of green leaf puffs with sunny highlights.
Origin = bottom centre."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop

LEAF, LEAF_D, LEAF_L, BARK, BARK_D, HOLE = 0x4cc75a, 0x34a548, 0x8ee070, 0x9a6a3e, 0x7a4f2c, 0x4a2f1c
p = Prop('prop_word_tree', base=BARK, target_faces=4000, voxel=0.016)
p.capsule((0, 0.05, 0), (0, 1.25, 0), 0.24, r2=0.18, group='trunk')
for a in (0, 120, 240):
    ar = math.radians(a + 20)
    p.blob((math.sin(ar) * 0.26, 0.1, math.cos(ar) * 0.26), (0.18, 0.12, 0.18), group='trunk')
for s in (-1, 1):
    p.capsule((0, 1.05, 0), (s * 0.38, 1.45, 0.05), 0.11, r2=0.08, group='br%d' % s)
p.paint_fn(lambda q, n: q.y < 0.2, BARK_D)
p.decal('hole', (0.05, 0.62), (0.08, 0.11, 0.2), HOLE)
p.layer('canopy', base=LEAF, target_faces=2600, voxel=0.018)
for (x, y, z, r) in [(0, 1.95, 0.0, 0.78), (-0.6, 1.62, 0.1, 0.55), (0.62, 1.66, 0.08, 0.56), (-0.3, 2.42, 0.0, 0.5), (0.35, 2.38, 0.05, 0.5), (0, 1.55, 0.35, 0.5), (0, 1.85, -0.4, 0.6)]:
    p.blob((x, y, z), (r, r * 0.92, r), stiffness=2.6, group='c')
p.paint_fn(lambda q, n: n.y < -0.35, LEAF_D)
for i, (x, y, s) in enumerate([(-0.35, 2.3, 0.2), (0.3, 2.05, 0.16), (-0.65, 1.8, 0.14), (0.62, 1.75, 0.12), (0.0, 2.6, 0.12)]):
    p.decal('hl%d' % i, (x, y), (s, s * 0.7, 0.25), LEAF_L)
p.layer('skin')
p.bone('body', (0, 0, 0), (0, 2.8, 0))
p.extras['outline'] = 0.026
p.build()
