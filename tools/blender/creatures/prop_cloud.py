"""Grumpy rain cloud (Where's Crab? 'Rain!'). About 2.7 wide and 1.6 tall, centred on the origin, facing +z: a puffy
blue-grey cloud, paler on top and darker underneath, with the game's expressive face mounted on its front (setFace
'angry' while it rains, 'happy' when it blows away)."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop

TOP, MID, BOT = 0xeef3fb, 0xcbd8ee, 0xa9bad8
p = Prop('prop_cloud', base=MID, target_faces=2200, voxel=0.024, smooth=4)
p.blob((0, -0.18, 0.05), (1.35, 0.42, 0.6), group='cloud')                         # flat-ish belly
for i, (x, y, r) in enumerate(((-1.05, 0.0, 0.48), (-0.5, 0.32, 0.6), (0.18, 0.5, 0.7), (0.82, 0.22, 0.55), (1.25, -0.08, 0.4))):
    p.blob((x, y, 0.0), (r, r, r * 0.9), group='puff%d' % i)                     # round puffs along the top
p.paint_fn(lambda q, n: n.y > 0.55 and q.y > -0.1, TOP)
p.paint_fn(lambda q, n: q.y < -0.42 and n.y < 0.2, BOT)
p.bone('root', (0, -0.6, 0), (0, 0.8, 0))
p.face((0, -0.05, 0.62), 0.62, bone='root', faceScale=1.0)
p.extras['outline'] = 0.026
p.build()
