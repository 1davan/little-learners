"""A chubby toy fish (Which has more? fish), swimming toward +x, side toward the camera. About 1.05 long, 0.6 tall.
Soft body with a forked tail, a top fin and a little side fin, a white band, a big friendly eye and a smile."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop

BLUE, BLUE_D, BELLY, FIN = 0x4a90ff, 0x3a74d8, 0xbfe2ff, 0xffb02e
WHITE, INK = 0xffffff, 0x2e2238

p = Prop('prop_fish', base=BLUE, target_faces=2600, voxel=0.012)
p.blob((0.03, 0, 0), (0.42, 0.3, 0.22))                               # body
p.blob((0.2, 0.0, 0), (0.25, 0.25, 0.19))                             # round head
p.blob((-0.3, 0, 0), (0.18, 0.15, 0.12))                              # tail root
# forked tail (own groups so the lobes stay crisp)
p.blob((-0.5, 0.14, 0), (0.16, 0.1, 0.05), rot=(0, 0, -35), group='tailU')
p.blob((-0.5, -0.14, 0), (0.16, 0.1, 0.05), rot=(0, 0, 35), group='tailD')
p.blob((-0.02, 0.3, 0), (0.17, 0.1, 0.04), rot=(0, 0, 18), group='finTop')
p.blob((0.05, -0.08, 0.2), (0.1, 0.06, 0.035), rot=(0, 0, 30), group='finSide')
p.paint_fn(lambda q, n: q.y < -0.12 and q.x > -0.3, BELLY)
p.paint_fn(lambda q, n: q.x < -0.38 or q.y > 0.27 or (q.z > 0.2 and q.y < -0.02 and -0.06 < q.x < 0.18), FIN)
p.paint_fn(lambda q, n: abs(q.x + 0.12) < 0.055 and q.y < 0.26 and q.x > -0.3, WHITE)      # band
p.paint_fn(lambda q, n: abs(q.x - 0.06) < 0.03 and abs(q.y) < 0.25 and q.y < 0.26, BLUE_D)

# eyes both sides (white + dark pupil with a highlight) and a smile
p.layer('eyes', base=WHITE, target_faces=700, voxel=0.008)
for s in (-1, 1):
    p.blob((0.27, 0.07, s * 0.17), (0.085, 0.09, 0.05), group='eye%d' % s)
p.layer('ink', base=INK, target_faces=700, voxel=0.008)
for s in (-1, 1):
    p.blob((0.29, 0.065, s * 0.21), (0.05, 0.058, 0.025), group='pup%d' % s)
    p.tube([(0.36, -0.06, s * 0.155), (0.4, -0.085, s * 0.13), (0.43, -0.07, s * 0.1)], 0.014, rseg=6)
p.layer('shine', base=WHITE, target_faces=200, voxel=0.006)
for s in (-1, 1):
    p.blob((0.305, 0.09, s * 0.232), (0.018, 0.018, 0.01), group='hi%d' % s)
p.layer('skin')

p.bone('body', (0, -0.3, 0), (0, 0.3, 0))
p.extras['outline'] = 0.016
p.build()
