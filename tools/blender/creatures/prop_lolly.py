"""Ice lolly (Bear's nose 'mouth' snack). Upright facing +z, about 1.0 tall, centred: a rounded two-tone popsicle
(tintable top, argMode 'tint', orange by default; the lower third a paler shade)
on a wooden stick."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop

p = Prop('prop_lolly', base=0xffffff, target_faces=600, voxel=0.012, smooth=3)
p.box((0, 0.12, 0), (0.19, 0.3, 0.085), bevel=0.08)
p.blob((0.0, 0.42, 0), (0.19, 0.08, 0.085), group='top')
p.paint_fn(lambda q, n: q.y < -0.05, 0xd8d8d8)
p.paint_fn(lambda q, n: abs(q.y + 0.05) < 0.02, 0xffffff)
p.layer('stick', base=0xe0b98c, target_faces=200, voxel=0.01)
p.quadriflow = False
p.box((0, -0.3, 0), (0.05, 0.2, 0.025), bevel=0.02)
p.layer('skin')
p.bone('root', (0, -0.5, 0), (0, 0.5, 0))
p.extras['argMode'] = 'tint'
p.extras['argDefault'] = 0xff9f3f
p.extras['outline'] = 0.012
p.build()
