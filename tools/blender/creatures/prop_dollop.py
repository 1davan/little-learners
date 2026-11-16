"""A dollop of sun cream (Bear's nose 'nose' gear). Sits on a surface facing +z (base in the xy plane): a soft
three-tier white swirl about 0.3 wide ending in a curly tip, with a pale-blue shadow ring at its foot."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop

p = Prop('prop_dollop', base=0xfffdf6, target_faces=500, voxel=0.006, smooth=3)
for i, (z, r) in enumerate(((0.035, 0.15), (0.1, 0.105), (0.155, 0.065))):
    p.blob((0, 0, z), (r, r * 0.92, 0.045), group='t%d' % i)
p.capsule((0.0, 0.0, 0.17), (0.035, 0.04, 0.235), 0.03, r2=0.016, group='tip', steps=5)
p.paint_fn(lambda q, n: q.z < 0.015, 0xd9eef7)
p.bone('root', (0, -0.15, 0), (0, 0.15, 0))
p.extras['outline'] = 0.008
p.build()
