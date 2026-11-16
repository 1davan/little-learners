"""Inflatable paddling pool (Bear's nose, level 2). Origin on the sand at its centre: two stacked fat rings (blue below,
white above; centre radius 1.5, outer edge about 1.85, top at y 0.92) round a water disc at y 0.6 with ripples, plus
a little valve. The game puts a static floor at the water line so toys float on it."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop

BLUE, BLUE_D, WHITE, WATER, WATER_L = 0x4a90ff, 0x3a74d8, 0xfffaf0, 0x7fd8ee, 0xc4f1fb
p = Prop('prop_pool', base=BLUE, target_faces=2600, voxel=0.02, smooth=3)
p.ring((0, 0.33, 0), 1.5, 0.33, seg=56, rseg=14)
p.blob((0, 0.33, 0), (1.3, 0.1, 1.3), group='floor')
p.paint_fn(lambda q, n: q.y < 0.08, BLUE_D)
p.layer('white', base=WHITE, target_faces=1800, voxel=0.018)
p.ring((0, 0.73, 0), 1.5, 0.21, seg=56, rseg=12)
p.blob((0.3, 0.85, 1.67), (0.06, 0.05, 0.06), group='valve')
p.layer('water', base=WATER, target_faces=700, voxel=0.018)
p.quadriflow = False
p.cyl((0, 0.45, 0), 1.42, 0.17, bevel=0.03, seg=48)
p.paint_fn(lambda q, n: q.y > 0.58 and any(abs(math.hypot(q.x - 0.25, q.z + 0.1) - r) < 0.035 for r in (0.3, 0.6)), WATER_L)
p.layer('skin')
p.bone('root', (0, 0, 0), (0, 0.9, 0))
p.extras['outline'] = 0.024
p.build()
