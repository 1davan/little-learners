"""Toy train wagon (Pattern parade, level 2). Origin on the rails under the middle; things ride on its floor at y 0.29.
A rounded open tub (1.36 long, 1.0 deep, walls to y 0.62) on a dark chassis, tintable body (argMode 'tint'), white
rolled rim, four chunky wheels with yellow hubs on bones 'wheel.F' / 'wheel.B' (rotation.z spins them), and couplers."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

BODY, RIM, DARK, HUB = 0xffffff, 0xfffaf0, 0x4a3a52, 0xffd23f
FL, WT, HX, HZ = 0.29, 0.07, 0.66, 0.5
p = Prop('prop_traincart', base=BODY, target_faces=2200, voxel=0.02, smooth=3)
p.box((0, FL - 0.06, 0), (HX, 0.06, HZ), bevel=0.04)                      # floor
for s in (-1, 1):
    p.box((s * (HX - WT / 2), 0.45, 0), (WT / 2, 0.18, HZ), bevel=0.035)
    p.box((0, 0.45, s * (HZ - WT / 2)), (HX, 0.18, WT / 2), bevel=0.035)
p.paint_fn(lambda q, n: q.y < FL - 0.07, 0xd8d8d8)
p.layer('rim', base=RIM, target_faces=700, voxel=0.016)
pts = rounded([(-HX + 0.03, 0.635, -HZ + 0.03), (HX - 0.03, 0.635, -HZ + 0.03), (HX - 0.03, 0.635, HZ - 0.03), (-HX + 0.03, 0.635, HZ - 0.03)], 0.12, n=4, closed=True)
p.tube(pts, 0.05, closed=True, rseg=10)
p.layer('chassis', base=DARK, target_faces=600, voxel=0.018)
p.box((0, 0.13, 0), (HX - 0.12, 0.06, HZ - 0.12), bevel=0.03)
for s in (-1, 1):
    p.box((s * (HX + 0.12), 0.18, 0), (0.12, 0.035, 0.06), bevel=0.02)
    p.blob((s * (HX + 0.24), 0.18, 0), (0.05, 0.06, 0.08), group='cp%d' % s)
p.layer('wheels', base=DARK, target_faces=900, voxel=0.014)
WX, WY, WR = 0.42, 0.05, 0.17
for x in (-WX, WX):
    for z in (-HZ - 0.03, HZ + 0.03):
        p.cyl((x, WY, z - 0.05 * (1 if z > 0 else -1)), WR, 0.1, rot=(90 if z > 0 else -90, 0, 0), bevel=0.03, seg=24)
p.layer('hubs', base=HUB, target_faces=300, voxel=0.01)
for x in (-WX, WX):
    for z in (-HZ - 0.03, HZ + 0.03):
        sz = 1 if z > 0 else -1
        p.blob((x, WY, z + sz * 0.065), (0.07, 0.07, 0.035), group='h%d%d' % (x * 10, sz))
        p.blob((x + 0.1, WY + 0.04, z + sz * 0.06), (0.025, 0.025, 0.02), group='b%d%d' % (x * 10, sz))
p.layer('skin')
wheel = lambda x: (lambda q: abs(q.x - x) < WR + 0.03 and q.y < WY + WR + 0.03 and abs(q.z) > HZ - 0.02)
p.bone('root', (0, 0, 0), (0, 0.6, 0), region=lambda q: not (wheel(-WX)(q) or wheel(WX)(q)))
p.bone('wheel.F', (WX, WY, 0), (WX, WY + 0.3, 0), parent='root', region=wheel(WX))
p.bone('wheel.B', (-WX, WY, 0), (-WX, WY + 0.3, 0), parent='root', region=wheel(-WX))
p.extras['argMode'] = 'tint'
p.extras['argDefault'] = 0x4a90ff
p.extras['outline'] = 0.022
p.build()
