"""Toadstool (meadow autumn): a chunky cream stalk with a little skirt under a round red cap with white spots and a
cream gill underside. About 0.62 tall and 0.6 wide, standing on y = 0. One layer for the stalk, one for the cap
(spots painted crisp)."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

STALK, STALK_D, CAP, SPOT, GILL = 0xfff1d6, 0xf0dcb8, 0xe8503a, 0xfffaf0, 0xf6dcb4
p = Prop('prop_scene_mushroom', base=STALK, target_faces=240, voxel=0.01, smooth=4)
p.lathe(rounded([(0, 0), (0.15, 0), (0.12, 0.08), (0.1, 0.3), (0.1, 0.42), (0, 0.42)], 0.04, n=3), seg=28)
p.ring((0, 0.3, 0), 0.105, 0.025, seg=28, rseg=8)          # the little skirt
p.paint_fn(lambda q, n: q.y < 0.05, STALK_D)

p.layer('cap', base=CAP, target_faces=440, voxel=0.01)
cap = rounded([(0, 0.66), (0.2, 0.62), (0.3, 0.5), (0.31, 0.4), (0.26, 0.37), (0.1, 0.4), (0, 0.41)], 0.06, n=4)
p.lathe(cap, seg=40)
SPOTS = [(0, 0.66, 0.0, 0.06)] + [(0.2 * math.sin(a), 0.6, 0.2 * math.cos(a), 0.05) for a in (0.3, 1.5, 2.6, 3.8, 5.0)] + \
        [(0.29 * math.sin(a), 0.47, 0.29 * math.cos(a), 0.04) for a in (0.9, 2.1, 3.2, 4.4, 5.6)]
p.paint_fn(lambda q, n: any((q - __import__('mathutils').Vector((x, y, z))).length < r for x, y, z, r in SPOTS), SPOT)
p.paint_fn(lambda q, n: n.y < -0.4 and q.y < 0.42, GILL)
p.layer('skin')

p.bone('body', (0, 0, 0), (0, 0.66, 0))
p.extras['outline'] = 0.014
p.build()
