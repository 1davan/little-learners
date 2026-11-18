"""Grumpy rain cloud (Where's Crab? 'Rain!'). About 2.7 wide and 1.6 tall, centred on the origin, facing +z: a smooth
puffy cloud of five big overlapping round lobes over a flattened belly, pale on top, blue-grey underneath with a crisp
darker underside band, and the game's expressive face (big eyes, mouth, cheeks) mounted on its front (setFace 'angry'
while it rains, 'happy' when it blows away)."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop

TOP, MID, BOT = 0xf2f6fd, 0xd3def1, 0xa9bad8
p = Prop('prop_cloud', base=MID, target_faces=7000, voxel=0.014, smooth=12)
# a soft flattened belly: three overlapping ellipsoids so the bottom is broad and gently flat
for x, r in ((-0.62, 0.62), (0.0, 0.72), (0.62, 0.62)):
    p.blob((x, -0.24, 0.02), (r, 0.42, 0.55), group='belly', stiffness=1.6)
# five round lobes along the top, biggest in the middle (all one group so the crevices stay soft)
LOBES = ((-1.02, -0.08, 0.5), (-0.52, 0.26, 0.6), (0.14, 0.42, 0.7), (0.76, 0.2, 0.58), (1.18, -0.12, 0.44))
for i, (x, y, r) in enumerate(LOBES):
    p.blob((x, y, -0.02), (r, r, r * 0.86), group='lobe%d' % i)       # each lobe its own group: soft creases between
    p.blob((x, -0.62, 0), (r * 1.3, 0.28, r * 1.3), group='lobe%d' % i, negative=True)
p.blob((0, -0.62, 0), (1.6, 0.28, 1.2), group='belly', negative=True)        # flat underside
p.paint_fn(lambda q, n: n.y > 0.62 and q.y > 0.12, TOP)
p.paint_fn(lambda q, n: q.y < -0.44, BOT)
p.bone('root', (0, -0.6, 0), (0, 0.8, 0))
p.face((0, 0.06, 0.62), 0.62, bone='root', faceScale=1.75)
p.extras['outline'] = 0.026
p.build()
