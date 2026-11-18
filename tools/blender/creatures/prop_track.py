"""Toy train track (Pattern parade, level 2). Origin on the sand under the middle. A long wooden trestle bridge 14 wide:
a chunky deck beam (top at y 1.84) on fat A-frame legs with cross bars, 16 chunky dark sleepers jutting past the\nbeam and two fat rounded silver rails (top at about y 1.98, as before) at z +-0.32."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from skit import SProp

TOP, L = 1.84, 14.0
WOOD, WOOD_D, SLEEPER, RAIL = 0xc98b4f, 0xa86f3a, 0x8a5a3c, 0xaab6c8
p = SProp('prop_track', base=WOOD)          # hard-surface: crisp bevelled boxes, no remesh seams
p.box((0, TOP - 0.16, 0), (L / 2, 0.16, 0.5), bevel=0.08)                    # chunky deck beam
p.box((0, TOP - 0.36, 0), (L / 2 - 0.1, 0.06, 0.4), bevel=0.04)             # under-ledge
for x in (-6, -3, 0, 3, 6):
    for s in (-1, 1):
        a = math.radians(10) * s
        h = TOP - 0.32
        p.box((x + s * 0.22, h / 2, 0), (0.13, h / 2 + 0.02, 0.13), rot=(0, 0, -math.degrees(a)), bevel=0.06)   # fat A-frame legs
        p.box((x + s * 0.4, 0.06, 0), (0.2, 0.06, 0.2), bevel=0.04)                                            # feet pads
    p.box((x, TOP * 0.42, 0), (0.48, 0.08, 0.11), bevel=0.04)                                                 # cross bar
p.paint_fn(lambda q, n: q.y < TOP - 0.33, WOOD_D)
p.paint_fn(lambda q, n: abs(q.y - (TOP - 0.16)) < 0.02 and q.z > 0.45, WOOD_D)        # plank seam along the beam
p.layer('sleepers', base=SLEEPER)
n = 16
for i in range(n):
    x = -L / 2 + 0.45 + (L - 0.9) * i / (n - 1)
    p.box((x, TOP + 0.03, 0), (0.17, 0.05, 0.62), bevel=0.04)
p.layer('rails', base=RAIL)
for z in (-0.32, 0.32):
    p.box((0, TOP + 0.075, z), (L / 2, 0.07, 0.09), bevel=0.05)               # fat rounded rails, top kept at ~1.98
p.paint_fn(lambda q, n: n.y > 0.7, 0xeef2f8)
p.layer('skin')
p.bone('root', (0, 0, 0), (0, TOP, 0))
p.extras['outline'] = 0.03
p.build()
