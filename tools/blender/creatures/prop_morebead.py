"""One round bead for the match-up links in Which has more? (a chain of these joins each pair). Radius 0.1, centred
on its origin; a tiny threading hole top and bottom is implied by a small cream band; a crisp shine sticker.
Tintable (argMode 'tint'), default sunny yellow."""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop

p = Prop('prop_morebead', base=0xffffff, target_faces=500, voxel=0.006, smooth=2)
p.blob((0, 0, 0), (0.1, 0.092, 0.1), group='bead')
p.paint_fn(lambda q, n: abs(q.y) > 0.075, 0xf2e6c8)
p.layer('shine', base=0xffffff, target_faces=80, voxel=0.004)
p.quadriflow = False
p.blob((-0.035, 0.035, 0.088), (0.024, 0.02, 0.012), group='s')
p.layer('skin')
p.bone('body', (0, -0.1, 0), (0, 0.1, 0))
p.extras['argMode'] = 'tint'
p.extras['argDefault'] = 0xffc83a
p.extras['outline'] = 0.012
p.build()
