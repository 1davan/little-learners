"""Mud puddle (Splash wash: where the mud came from). Origin on the sand under its middle; about 2.8 x 1.8 and flat:
a soft raised light-brown rim round a dark glossy mud pool, a couple of lumps, a bubble and a footprint."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop

RIM, MUD, MUD_D, SHINE = 0x9a6a3c, 0x6b4423, 0x553419, 0x9c7656
p = Prop('prop_mud', base=MUD, target_faces=1400, voxel=0.018, smooth=3)
p.quadriflow = False
N = 40
def rr(a):
    return 1.0 + 0.1 * math.sin(a * 3 + 0.5) + 0.06 * math.sin(a * 5 + 2.0)
pts = [(1.4 * rr(a) * math.cos(a), 0.9 * rr(a) * math.sin(a)) for a in [i / N * math.tau for i in range(N)]]
verts = [(0, 0.0, 0)] + [(x, 0.0, z) for x, z in pts] + [(0, 0.07, 0)] + [(x * 0.97, 0.06, z * 0.97) for x, z in pts]
k = N + 1
faces = []
for i in range(N):
    j = (i + 1) % N
    faces += [(0, 1 + i, 1 + j), (k, k + 1 + j, k + 1 + i), (1 + i, k + 1 + i, k + 1 + j, 1 + j)]
p.mesh(verts, faces)
p.paint_fn(lambda q, n: (q.x / 1.4) ** 2 + (q.z / 0.9) ** 2 > 0.72, RIM)
p.paint_fn(lambda q, n: n.y > 0.7 and ((q.x + 0.35) ** 2 / 0.09 + (q.z + 0.15) ** 2 / 0.02) < 1, SHINE)
p.layer('lumps', base=MUD_D, target_faces=500, voxel=0.012)
for x, z, r in ((-0.55, 0.15, 0.17), (0.6, -0.2, 0.13), (0.15, 0.4, 0.1)):
    p.blob((x, 0.06, z), (r, r * 0.45, r), group='l%d' % int(x * 100))
p.blob((0.25, 0.1, -0.1), (0.09, 0.09, 0.09), group='bubble')
p.paint('bub', (0.25, 0.1, -0.1), (0.1, 0.1, 0.1), RIM)
p.layer('skin')
p.bone('root', (0, 0, 0), (0, 0.4, 0))
p.extras['outline'] = 0.014
p.build()
