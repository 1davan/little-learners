"""A chubby toy fish (Share the snacks, Which has more?), swimming toward +x, side toward the camera. About 1.05 long,
0.62 tall. A round blue body with one soft curved pale belly, a big fan tail, a rounded top fin and a little side fin
on each side (all orange, each its own shape with a clean ink edge), a big friendly eye on both sides and a smile."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop

BLUE, BELLY, FIN, FIN_D = 0x4a90ff, 0xcfe9ff, 0xffa52e, 0xf08a1a
WHITE, INK = 0xffffff, 0x2e2238

p = Prop('prop_fish', base=BLUE, target_faces=3200, voxel=0.011)
p.blob((0.02, 0, 0), (0.38, 0.29, 0.2))                               # body
p.blob((0.19, 0.01, 0), (0.24, 0.25, 0.19))                           # round head
p.blob((-0.27, 0, 0), (0.17, 0.14, 0.11))                             # tail root
# one soft curved belly: below a gentle smile-shaped line from the chin to the tail root
p.paint_fn(lambda q, n: q.y < -0.11 - 0.3 * (q.x - 0.05) ** 2 and q.x > -0.33 and q.x < 0.42, BELLY)

p.layer('fins', base=FIN, target_faces=1800, voxel=0.009)
# fan tail: two rounded lobes meeting at the tail root, with a soft notch between
p.blob((-0.5, 0.12, 0), (0.17, 0.1, 0.04), rot=(0, 0, -38), group='tailU')
p.blob((-0.5, -0.12, 0), (0.17, 0.1, 0.04), rot=(0, 0, 38), group='tailD')
p.blob((-0.4, 0, 0), (0.1, 0.1, 0.045), group='tailR')
# rounded top fin and a small bottom fin
p.blob((-0.03, 0.29, 0), (0.16, 0.09, 0.035), rot=(0, 0, 14), group='finTop')
p.blob((-0.12, -0.26, 0), (0.08, 0.05, 0.03), rot=(0, 0, -20), group='finBot')
# a little side fin on each side, tucked behind the eye
for s in (-1, 1):
    p.blob((0.02, -0.07, s * 0.2), (0.1, 0.055, 0.025), rot=(0, 0, 32), group='side%d' % s)
p.paint_fn(lambda q, n: (q.x < -0.56 and abs(q.y) > 0.04) or q.y > 0.33, FIN_D)

# eyes both sides (white + dark pupil with a highlight) and a smile
p.layer('eyes', base=WHITE, target_faces=700, voxel=0.008)
for s in (-1, 1):
    p.blob((0.25, 0.08, s * 0.165), (0.105, 0.11, 0.065), group='eye%d' % s)
p.layer('ink', base=INK, target_faces=700, voxel=0.008)
for s in (-1, 1):
    p.blob((0.275, 0.075, s * 0.222), (0.05, 0.058, 0.024), group='pup%d' % s)
    p.tube([(0.33, -0.03, s * 0.175), (0.37, -0.058, s * 0.15), (0.405, -0.05, s * 0.115), (0.425, -0.025, s * 0.085)], 0.015, rseg=6)
p.layer('shine', base=WHITE, target_faces=200, voxel=0.006)
for s in (-1, 1):
    p.blob((0.292, 0.1, s * 0.254), (0.021, 0.021, 0.01), group='hi%d' % s)
p.layer('skin')

p.bone('body', (0, -0.3, 0), (0, 0.3, 0))
p.extras['outline'] = 0.016
p.build()
