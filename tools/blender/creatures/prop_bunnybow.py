"""A ribbon bow for the bunnies' ears (Share the snacks). Tintable (argMode 'tint'; the knot is layer 'tintknot', which the
game gives the same tinted material): two puffy loops that swell toward their ends, a round knot with its own ink edge,
and two short flat ribbon tails. About 0.6 wide, facing +z."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop

TINT, TINT_D, WHITE = 0xffffff, 0xe2e2e2, 0xffffff
p = Prop('prop_bunnybow', base=TINT, target_faces=1800, voxel=0.008)
for s in (-1, 1):
    p.blob((s * 0.19, 0.035, 0), (0.12, 0.125, 0.07), rot=(0, 0, s * 10), group='loop%d' % s)
    p.blob((s * 0.09, 0.015, 0.0), (0.075, 0.065, 0.05), group='loop%d' % s)
    p.blob((s * 0.085, -0.13, 0.0), (0.045, 0.1, 0.022), rot=(0, 0, s * 28), group='tail%d' % s)
# the inside of each loop a touch deeper, toward the knot
p.paint_fn(lambda q, n: abs(q.x) < 0.12 and q.y > -0.05, TINT_D)
p.layer('tintknot', base=TINT, target_faces=500, voxel=0.007)
p.blob((0, 0.012, 0.035), (0.068, 0.075, 0.06), group='knot')
p.layer('shine', base=WHITE, target_faces=200, voxel=0.006)
for s in (-1, 1):
    p.blob((s * 0.22, 0.095, 0.062), (0.035, 0.02, 0.012), rot=(0, 0, s * 20), group='hi%d' % s)
p.layer('skin')
p.bone('body', (0, -0.25, 0), (0, 0.2, 0))
p.extras['argMode'] = 'tint'
p.extras['argDefault'] = 0xff5a5a
p.extras['outline'] = 0.012
p.build()
