"""Toy train track (Pattern parade, level 2). Origin on the sand under the middle. A long wooden trestle bridge 14 wide:
a beam (top at y 1.84) on A-frame legs, dark sleepers across it and two silver rails (top at about y 1.95) at z +-0.32."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop

TOP, L = 1.84, 14.0
WOOD, WOOD_D, SLEEPER, RAIL = 0xc98b4f, 0xa86f3a, 0x8a5a3c, 0xc9d1de
p = Prop('prop_track', base=WOOD, target_faces=3600, voxel=0.028, smooth=3)
p.box((0, TOP - 0.13, 0), (L / 2, 0.13, 0.5), bevel=0.06)
for x in (-6, -3, 0, 3, 6):
    for s in (-1, 1):
        a = math.radians(12) * s
        h = TOP - 0.26
        p.box((x + s * math.sin(a) * h / 2 * 0 + s * 0.17, h / 2, 0), (0.09, h / 2, 0.09), rot=(0, 0, -math.degrees(a)), bevel=0.04)
    p.box((x, TOP * 0.45, 0), (0.42, 0.06, 0.08), bevel=0.03)
p.paint_fn(lambda q, n: q.y < TOP - 0.27, WOOD_D)
p.layer('sleepers', base=SLEEPER, target_faces=1400, voxel=0.02)
n = 20
for i in range(n):
    x = -L / 2 + 0.35 + (L - 0.7) * i / (n - 1)
    p.box((x, TOP + 0.035, 0), (0.12, 0.04, 0.48), bevel=0.03)
p.layer('rails', base=RAIL, target_faces=900, voxel=0.018)
for z in (-0.32, 0.32):
    p.tube([(-L / 2, TOP + 0.1, z), (L / 2, TOP + 0.1, z)], 0.04, rseg=10)
p.layer('skin')
p.bone('root', (0, 0, 0), (0, TOP, 0))
p.extras['outline'] = 0.028
p.build()
