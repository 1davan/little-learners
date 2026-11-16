"""Striped deck chair (Where's Crab?). Seat (canvas) at y 1.15, 2.1 wide, room underneath between the legs; the canvas
back leans back at z -0.85; wooden frame with arm rests. Blue + white canvas stripes are separate layers (crisp)."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

SEAT, W = 1.15, 2.1
WOOD, WOOD_D, BLUE, WHITE = 0xc98b4f, 0xa86f3a, 0x4a90ff, 0xfffaf0
p = Prop('prop_chair', base=WOOD, target_faces=2600, voxel=0.018)
hw = W / 2
for s in (-1, 1):
    x = s * (hw - 0.02)
    for z in (-0.62, 0.62):
        p.box((x, (SEAT - 0.05) / 2, z), (0.07, (SEAT - 0.05) / 2, 0.07), bevel=0.04)     # legs
    p.box((x, SEAT - 0.06, 0), (0.08, 0.06, 0.78), bevel=0.04)                           # seat rails
    p.box((x, SEAT + 0.45, 0.05), (0.09, 0.05, 0.75), bevel=0.04)                        # arm rests
    p.box((x, SEAT + 0.2, 0.62), (0.06, 0.25, 0.06), bevel=0.03)                         # arm posts
    # back uprights, leaning back
    p.box((x, SEAT + 0.62, -0.88), (0.07, 0.75, 0.07), rot=(-18, 0, 0), bevel=0.04)
    p.blob((x, SEAT + 0.47, 0.82), (0.11, 0.08, 0.11), group='knob%d' % s)
p.box((0, 0.35, 0.62), (hw, 0.05, 0.05), bevel=0.03)                                     # front stretcher
p.box((0, SEAT + 1.33, -1.1), (hw + 0.05, 0.07, 0.07), rot=(-18, 0, 0), bevel=0.04)       # top bar
p.paint_fn(lambda q, n: n.y < -0.6, WOOD_D)

NS = 5
sw = W / NS


def strips(odd):
    for i in range(NS):
        if (i % 2 == 1) != odd:
            continue
        x = -hw + sw * (i + 0.5)
        p.box((x, SEAT - 0.02, 0.05), (sw / 2 - 0.004, 0.045, 0.72), bevel=0.035)
        p.box((x, SEAT + 0.66, -0.86), (sw / 2 - 0.004, 0.62, 0.04), rot=(-18, 0, 0), bevel=0.035)
p.layer('blue', base=BLUE, target_faces=1600, voxel=0.016)
strips(False)
p.layer('white', base=WHITE, target_faces=1200, voxel=0.016)
strips(True)
p.layer('skin')
p.bone('body', (0, 0, 0), (0, SEAT, 0))
p.extras['outline'] = 0.024
p.build()
