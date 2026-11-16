"""Home icon for Feelings: a glossy yellow balloon (the game mounts its code face on it) on a wavy string, tied to a little
pink gift-box weight on the pedestal. Balloon centre ~(0, 2.2), ~1.9 across, base at y 0."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

YEL, YEL_D, YEL_L = 0xffc83a, 0xf0a020, 0xffe9a0
p = Prop('prop_icon_balloon', base=YEL, target_faces=3000, voxel=0.018)
# a slightly egg-shaped balloon that narrows to the knot
p.blob((0, 2.25, 0), (0.92, 0.95, 0.86), group='bal')
p.blob((0, 1.62, 0), (0.42, 0.42, 0.4), group='bal')
p.blob((0, 1.3, 0), (0.12, 0.12, 0.12), group='bal')
# the knot: a little ring and a flared lip
p.blob((0, 1.16, 0), (0.1, 0.08, 0.1), group='knot')
p.blob((0, 1.08, 0), (0.13, 0.05, 0.13), group='knot')
p.paint_fn(lambda q, n: q.y < 1.24, YEL_D)
p.paint('shine', (-0.48, 2.72, 0.62), (0.13, 0.24, 0.3), YEL_L, rot=(0, 0, -35))
p.paint('shine2', (-0.62, 2.38, 0.6), (0.06, 0.07, 0.3), YEL_L)

# string: a soft wave down to the weight
p.layer('string', base=0xfff6e6, target_faces=500, voxel=0.01)
pts = []
for k in range(25):
    t = k / 24
    y = 1.06 - t * 0.78
    pts.append((0.06 * math.sin(t * 9) + 0.08 * t, y, 0.05 * t))
p.tube(pts, 0.022, rseg=6)

# the weight: a tiny pink present with a ribbon
p.layer('weight', base=0xff8fc0, target_faces=900, voxel=0.012)
p.box((0.08, 0.15, 0.05), (0.16, 0.15, 0.16), rot=(0, 20, 0), bevel=0.05)
p.layer('ribbon', base=0xfff1a0, target_faces=800, voxel=0.01)
for rot in ((0, 20, 0), (0, 110, 0)):
    p.box((0.08, 0.15, 0.05), (0.04, 0.155, 0.165), rot=rot, bevel=0.015)
for s in (-1, 1):
    p.blob((0.08 + s * 0.08, 0.33, 0.05), (0.08, 0.05, 0.035), rot=(0, 20, s * 25), group='bow%d' % s)
p.layer('skin')
p.bone('body', (0, 0, 0), (0, 3.2, 0))
p.face(center=(0, 2.25, 0), radius=0.86, bone='body', faceScale=1.0)
p.extras['outline'] = 0.03
p.build()
