"""Boardwalk (Pattern parade, level 1). Origin on the sand under the middle. A deck of 12 chunky planks (13 wide, 1.4
deep, top at y 2.25, 0.3 thick) on two long beams, standing on eight round posts. Planks alternate two warm wood tones
and have little nail heads; post tops peek above the deck at both ends. Root bone 'root' (no idle sway)."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

TOP, TH, W, D = 2.25, 0.3, 13.0, 1.4
WOOD, WOOD_L, WOOD_D, NAIL = 0xc98b4f, 0xd9a066, 0xa86f3a, 0x6b4a33
p = Prop('prop_boardwalk', base=WOOD, target_faces=4200, voxel=0.028, smooth=3)
N = 12
pw = W / N
for i in range(N):
    x = -W / 2 + pw * (i + 0.5)
    dy = (0.012, -0.01, 0.006, -0.004)[i % 4]
    p.box((x, TOP - TH / 2 + dy, 0), (pw / 2 - 0.035, TH / 2, D / 2 - (0.0 if i % 3 else 0.03)), rot=(0, (i % 5 - 2) * 0.4, 0), bevel=0.06)
for z in (-0.45, 0.45):                                  # beams under the planks
    p.box((0, TOP - TH - 0.1, z), (W / 2 - 0.25, 0.11, 0.1), bevel=0.04)
POSTS = (-5.9, -2.0, 2.0, 5.9)
for x in POSTS:
    for z in (-0.52, 0.52):
        top = TOP + (0.18 if abs(x) > 5 else -TH - 0.05)
        p.cyl((x, 0, z), 0.17, top, r2=0.15, bevel=0.07, seg=18)
        if abs(x) > 5:
            p.blob((x, top, z), (0.15, 0.07, 0.15), group='cap%d%d' % (x * 10, z * 10))
plank = lambda q: int(math.floor((q.x + W / 2) / pw))
p.paint_fn(lambda q, n: q.y > TOP - TH - 0.02 and abs(q.z) < D / 2 + 0.05 and plank(q) % 2 == 1, WOOD_L)
p.paint_fn(lambda q, n: q.y < TOP - TH - 0.02 or (abs(q.x) > 5.7 and q.y > TOP + 0.02), WOOD_D)
# nail heads: two at each end of every plank (top face)
def nail(q, n):
    if q.y < TOP - 0.04 or n.y < 0.6:
        return False
    cx = -W / 2 + pw * (plank(q) + 0.5)
    return any(math.hypot(q.x - (cx + sx * pw * 0.22), q.z - sz * 0.5) < 0.045 for sx in (-1, 1) for sz in (-1, 1))
p.paint_fn(nail, NAIL)
p.bone('root', (0, 0, 0), (0, TOP, 0))
p.extras['outline'] = 0.03
p.build()
