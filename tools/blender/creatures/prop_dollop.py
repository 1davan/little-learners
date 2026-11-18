"""A dab of sun cream (Bear's nose: the 'nose' gear, worn on the bridge of the nose so the nose stays visible).
Lies on a surface facing +z (base in the xy plane): a small soft white smear about 0.3 wide and only 0.07 thick,
with a soft little peak in the middle, and a pale-blue shade line round its foot."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop

p = Prop('prop_dollop', base=0xfffdf6, target_faces=700, voxel=0.005, smooth=4)
p.resolution = 0.008
# the dab: one smooth flat oval pad with a soft little peak in the middle (no ridges: they inked as creases)
p.blob((0, 0, 0.02), (0.14, 0.085, 0.028), group='pad', stiffness=2.2)
p.blob((0.01, 0.005, 0.045), (0.05, 0.045, 0.035), group='pad', stiffness=2.0)
p.paint_fn(lambda q, n: q.z < 0.008, 0xcfe7f3)
p.bone('root', (0, -0.15, 0), (0, 0.15, 0))
p.extras['outline'] = 0.008
p.build()
