"""Smooth beach boulder (Bear's nose rock pool, Splash wash sponge rock). Origin on the sand under its middle; about
2.4 wide, 1.8 deep, 0.95 tall. Tintable (argMode 'tint', grey by default): a soft pebble with a paler top, a few
darker speckles and a lighter chip on the front."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop

p = Prop('prop_rock', base=0xffffff, target_faces=1100, voxel=0.024, smooth=4)
p.blob((0, 0.38, 0), (1.15, 0.52, 0.85), group='rock')
p.blob((0.35, 0.5, -0.1), (0.75, 0.45, 0.65), rot=(0, 20, 8), group='rock')
p.blob((-0.45, 0.32, 0.15), (0.65, 0.36, 0.6), rot=(0, -10, -6), group='rock')
p.blob((0, -0.3, 0), (1.6, 0.3, 1.3), group='cut', negative=True)
p.paint_fn(lambda q, n: n.y > 0.75, 0xffffff)
p.paint_fn(lambda q, n: n.y <= 0.75, 0xe2e2e2)
p.paint_fn(lambda q, n: q.y < 0.12, 0xc8c8c8)
for x, y, z, r in ((-0.6, 0.55, 0.62, 0.05), (0.5, 0.42, 0.72, 0.04), (0.1, 0.8, 0.45, 0.035), (0.85, 0.6, 0.35, 0.045), (-0.25, 0.3, 0.8, 0.03)):
    p.paint('sp%d' % int(x * 100), (x, y, z), (r, r, r * 3), 0xb4b4b4)
p.bone('root', (0, 0, 0), (0, 1, 0))
p.extras['argMode'] = 'tint'
p.extras['argDefault'] = 0xb7b2a6
p.extras['outline'] = 0.026
p.build()
