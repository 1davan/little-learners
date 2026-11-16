"""Jam jar (Splash wash: where the jam came from). Origin on the sand under the jar: a round jar of strawberry jam
(r 0.36, 0.7 tall) with a glassy rim and shine, a gingham lid lying beside it, a label with a strawberry, a drip
down the side and a puddle of jam on the sand."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

JAM, JAM_D, GLASS, LABEL, BERRY, LEAF, RED, WHITE = 0xc2185b, 0x9a1048, 0xf0f6ff, 0xfff1c9, 0xff3b5c, 0x5fd068, 0xff5a5a, 0xfffaf0
p = Prop('prop_jamjar', base=JAM, target_faces=1200, voxel=0.012, smooth=3)
p.quadriflow = False
p.lathe(rounded([(0, 0), (0.36, 0), (0.37, 0.56), (0.3, 0.64), (0.3, 0.7), (0, 0.7)], 0.05, n=3), seg=32)
p.blob((-0.2, 0.62, 0.22), (0.08, 0.12, 0.05), group='drip')
p.blob((-0.5, 0.015, 0.3), (0.28, 0.025, 0.18), group='puddle')
p.paint_fn(lambda q, n: q.y > 0.6 and math.hypot(q.x, q.z) > 0.28, GLASS)
p.paint_fn(lambda q, n: q.y < 0.04 and math.hypot(q.x, q.z) < 0.4, JAM_D)
p.layer('label', base=LABEL, target_faces=400, voxel=0.01)
p.quadriflow = False
p.lathe(rounded([(0.355, 0.2), (0.385, 0.2), (0.385, 0.46), (0.355, 0.46)], 0.01, n=2), seg=32, a0=-1.1, a1=1.1, closed=True)
p.layer('berry', base=BERRY, target_faces=200, voxel=0.008)
p.blob((0, 0.32, 0.39), (0.07, 0.08, 0.03), group='b')
p.layer('leaf', base=LEAF, target_faces=100, voxel=0.006)
p.blob((0, 0.405, 0.385), (0.06, 0.02, 0.02), group='l')
p.layer('shine', base=0xffffff, target_faces=120, voxel=0.008)
p.quadriflow = False
p.box((-0.25, 0.32, 0.26), (0.03, 0.14, 0.015), rot=(0, -45, 0), bevel=0.012)
p.layer('lid', base=RED, target_faces=500, voxel=0.012)
p.quadriflow = False
p.cyl((0.62, 0, 0.2), 0.3, 0.09, bevel=0.03, seg=28)
p.paint_fn(lambda q, n: (math.floor((q.x - 0.62) / 0.1) + math.floor((q.z - 0.2) / 0.1)) % 2 == 0 and n.y > 0.6, WHITE)
p.layer('skin')
p.bone('root', (0, 0, 0), (0, 0.8, 0))
p.extras['outline'] = 0.016
p.build()
