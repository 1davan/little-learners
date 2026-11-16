"""Tuft of long grass with flowers (Splash wash: where the grass stains came from). Origin on the sand under the tuft:
a clump of chunky blades (two greens) about 1.3 wide and 1.1 tall, a pink flower on a stem and a little daisy."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop

G1, G2, G3 = 0x58b43a, 0x7fc24a, 0x3f8f2e
p = Prop('prop_grass', base=G1, target_faces=1600, voxel=0.014, smooth=3)
p.quadriflow = False
import random
random.seed(3)
for k in range(11):
    x0 = -0.5 + k * 0.1 + random.uniform(-0.03, 0.03)
    z0 = random.uniform(-0.15, 0.15)
    h = 0.65 + random.uniform(0, 0.45) * (1 - abs(x0) * 1.2)
    lean = (x0 * 0.9) + random.uniform(-0.15, 0.15)
    for i in range(14):
        t = i / 13
        x = x0 + lean * t * t * h * 0.6
        r = 0.055 * (1 - t * 0.75)
        p.blob((x, h * t, z0 + 0.03 * t), (r, r * 1.3, r * 0.6), group='b%d' % k)
p.blob((0, 0.03, 0), (0.6, 0.06, 0.25), group='base')
p.paint_fn(lambda q, n: math.sin(q.x * 31) > 0.3, G2)
p.paint_fn(lambda q, n: q.y < 0.12, G3)
p.layer('stem', base=G3, target_faces=200, voxel=0.01)
p.quadriflow = False
p.tube([(0.15, 0.0, 0.1), (0.2, 0.5, 0.12), (0.25, 0.95, 0.14)], 0.025, rseg=6)
p.tube([(-0.3, 0.0, 0.15), (-0.33, 0.3, 0.17), (-0.38, 0.55, 0.2)], 0.02, rseg=6)
p.layer('flower', base=0xff8fc0, target_faces=400, voxel=0.01)
for i in range(5):
    a = i / 5 * math.tau
    p.blob((0.25 + 0.1 * math.cos(a), 0.98 + 0.1 * math.sin(a), 0.16), (0.08, 0.08, 0.035), group='p%d' % i)
p.layer('daisy', base=0xfffaf0, target_faces=300, voxel=0.008)
for i in range(7):
    a = i / 7 * math.tau
    p.blob((-0.38 + 0.06 * math.cos(a), 0.57 + 0.06 * math.sin(a), 0.22), (0.045, 0.025, 0.015), rot=(0, 0, math.degrees(a)), group='d%d' % i)
p.layer('mid', base=0xffd23f, target_faces=120, voxel=0.006)
p.blob((0.25, 0.98, 0.2), (0.05, 0.05, 0.03), group='m1')
p.blob((-0.38, 0.57, 0.24), (0.03, 0.03, 0.02), group='m2')
p.layer('skin')
p.bone('root', (0, 0, 0), (0, 1.0, 0))
p.extras['outline'] = 0.014
p.build()
