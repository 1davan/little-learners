"""Rainbow (Where's Crab? after the rain). Origin at the middle of the ground line: a chunky six-band arch (outer
radius 3.3, inner 1.95, 0.32 deep) with a fluffy white cloud at each foot."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, TAU

COLS = [0xff5a5a, 0xffb020, 0xffe14d, 0x5fd068, 0x4a90ff, 0xa77bff]
R0, R1, T = 3.3, 1.95, 0.16
p = Prop('prop_rainbow', base=COLS[0], target_faces=2600, voxel=0.022, smooth=3)
p.quadriflow = False
# the arch: a half annulus in the xy plane with a rounded edge, built as a closed lathe about the z axis
prof = []
for k in range(13):
    a = math.pi * k / 12
    prof.append((R1 + 0.0 + (R0 - R1) * 0.5 - (R0 - R1) * 0.5 * math.cos(a), T * math.sin(a) * 1.0))
for k in range(13):
    a = math.pi * k / 12
    prof.append((R1 + (R0 - R1) * 0.5 + (R0 - R1) * 0.5 * math.cos(a), -T * math.sin(a)))
p.lathe(prof, rot=(90, 0, 90), a0=0.0, a1=math.pi, seg=40, closed=True)
band = (R0 - R1) / 6
for i, c in enumerate(COLS[1:], 1):
    p.paint_fn(lambda q, n, i=i: math.hypot(q.x, q.y) < R0 - band * i, c)
p.layer('clouds', base=0xfffaf0, target_faces=1200, voxel=0.02)
for s in (-1, 1):
    cx = s * (R0 + R1) / 2
    for dx, dy, r in ((0, 0.15, 0.55), (-0.5, -0.05, 0.4), (0.5, -0.05, 0.42), (0.0, -0.15, 0.45)):
        p.blob((cx + dx, dy, 0.1), (r, r * 0.85, r * 0.75), group='c%d' % s)
p.paint_fn(lambda q, n: q.y < -0.3, 0xdfe6f2)
p.layer('skin')
p.bone('root', (0, 0, 0), (0, R0, 0))
p.extras['outline'] = 0.026
p.build()
