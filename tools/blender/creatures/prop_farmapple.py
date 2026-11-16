"""Farm apple (Share the snacks, Who says moo? pig treats, Barn band bits). Tintable (default red; green apples pass a green):
a plump apple ~0.6 wide centred on the origin (bottom y -0.26, top dimple y +0.22) with a soft top dimple, a brown stem,
one leaf and (the game adds the shine spot)."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

p = Prop('prop_farmapple', base=0xffffff, target_faces=520, voxel=0.012, smooth=3)
p.quadriflow = False     # (quadriflow balloons tiny low-poly targets)
prof = rounded([(0.0, 0.2), (0.07, 0.235), (0.17, 0.262), (0.27, 0.205), (0.312, 0.07), (0.3, -0.07), (0.245, -0.2),
                (0.15, -0.262), (0.06, -0.255), (0.0, -0.235)], 0.06, n=4)
p.lathe(prof, seg=40)
p.paint_fn(lambda q, n: q.y < -0.215 and math.hypot(q.x, q.z) < 0.13, 0xc8c8c8)      # the little bottom dimple
p.paint_fn(lambda q, n: q.y > 0.2 and math.hypot(q.x, q.z) < 0.09, 0xd8d8d8)          # shade in the top dimple

p.layer('stem', base=0x7a4a26, target_faces=80, voxel=0.008)
p.tube([(0, 0.17, 0), (0.008, 0.26, 0), (0.035, 0.34, 0)], [0.028, 0.024, 0.02], rseg=8)
p.layer('leaf', base=0x5cc45a, target_faces=120, voxel=0.008)
p.blob((0.115, 0.315, 0.02), (0.1, 0.022, 0.055), rot=(8, -10, 22), group='leaf')
p.paint_fn(lambda q, n: abs((q.y - 0.315) - (q.x - 0.115) * 0.4) < 0.007 and q.x > 0.04, 0x3f9a3e)   # midrib
p.layer('skin')
p.bone('body', (0, -0.26, 0), (0, 0.26, 0))
p.extras['argMode'] = 'tint'
p.extras['argDefault'] = 0xf0453a
p.extras['outline'] = 0.014
p.build()
