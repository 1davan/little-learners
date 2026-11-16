"""A soft chunky chocolate-chip cookie (Which has more? cookies), facing +z, centred on the origin, radius ~0.36."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

DOUGH, EDGE, CHIP = 0xe0a868, 0xc98a4a, 0x5a3220
p = Prop('prop_cookie', base=DOUGH, target_faces=1600, voxel=0.01)
# a puffy disc with a wavy rim
prof = rounded([(0, -0.07), (0.33, -0.07), (0.36, 0.0), (0.33, 0.075), (0, 0.085)], 0.05, n=4)
p.lathe(prof, rot=(90, 0, 0), seg=40)
for k in range(9):
    a = k / 9 * math.tau
    p.blob((math.cos(a) * 0.3, math.sin(a) * 0.3, 0), (0.08, 0.08, 0.07), group='lump')
p.paint_fn(lambda q, n: math.hypot(q.x, q.y) > 0.31 or q.z < -0.03, EDGE)

p.layer('chips', base=CHIP, target_faces=700, voxel=0.008)
for i, (r, a) in enumerate([(0, 0), (0.17, 0.3), (0.19, 1.6), (0.2, 2.9), (0.16, 4.1), (0.21, 5.2), (0.08, 2.2)]):
    x, y = r * math.cos(a), r * math.sin(a)
    p.blob((x, y, 0.075), (0.045, 0.04, 0.035), rot=(0, 0, i * 40), group='c%d' % i)
p.layer('skin')
p.bone('body', (0, -0.35, 0), (0, 0.35, 0))
p.extras['outline'] = 0.014
p.build()
