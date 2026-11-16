"""Beach umbrella pole (Where's Crab? umbrella, Bear's nose umbrella). Origin at the foot, 3.1 tall (the game scales
it): a white pole with red bands, a chunky tilt joint, a cap on top and a little heap of sand round its foot."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

H = 3.1
p = Prop('prop_pole', base=0xfffaf0, target_faces=900, voxel=0.014, smooth=3)
p.quadriflow = False
p.cyl((0, 0.05, 0), 0.075, H - 0.05, bevel=0.03, seg=16)
p.blob((0.1, 1.56, 0), (0.06, 0.06, 0.05), group='knob')
p.layer('bands', base=0xff5a5a, target_faces=500, voxel=0.01)
p.quadriflow = False
for y in (0.5, 0.85, 2.1, 2.45):
    p.cyl((0, y, 0), 0.086, 0.16, bevel=0.025, seg=16)
p.cyl((0, 1.44, 0), 0.122, 0.24, bevel=0.05, seg=20)
p.layer('sand', base=0xf2cf7e, target_faces=400, voxel=0.016)
p.quadriflow = False
p.lathe(rounded([(0, 0), (0.42, 0), (0.2, 0.13), (0.09, 0.2), (0, 0.2)], 0.06, n=3), seg=28)
p.blob((0.3, 0.03, 0.12), (0.12, 0.05, 0.1), group='lump')
p.paint_fn(lambda q, n: q.y < 0.03, 0xd9b062)
p.layer('skin')
p.bone('root', (0, 0, 0), (0, H, 0))
p.extras['outline'] = 0.014
p.build()
