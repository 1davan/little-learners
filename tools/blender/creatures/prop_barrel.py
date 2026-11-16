"""Wooden barrel (Peekaboo pots). Radius 1.0 at the ends, 1.13 at the belly, 1.8 tall; painted staves, three grey hoops,
a lighter lid with a cross plank."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

WOOD, WOOD_D, LID, HOOP = 0xb8763e, 0x8f5428, 0xd9965a, 0x6f7584
H = 1.8
r_at = lambda y: 1.0 + 0.13 * math.sin(math.pi * y / H)
p = Prop('prop_barrel', base=WOOD, target_faces=3400, voxel=0.02)
prof = [(0, 0)] + [(r_at(H * i / 12), H * i / 12) for i in range(13)] + [(0, H)]
p.lathe(rounded(prof, 0.06, n=3), seg=60)


def stave(q, n):
    if q.y < 0.04 or q.y > H - 0.04:
        return False
    a = math.atan2(q.x, q.z) / math.tau * 14
    return abs(a - round(a)) < 0.06
p.paint_fn(stave, WOOD_D)
p.paint_fn(lambda q, n: q.y > H - 0.03 and n.y > 0.7, LID)
p.paint_fn(lambda q, n: q.y > H - 0.03 and n.y > 0.7 and abs(q.x) < 0.07, WOOD_D)
p.layer('hoops', base=HOOP, target_faces=1600, voxel=0.016)
for y in (0.22, H / 2, H - 0.22):
    p.ring((0, y, 0), r_at(y) + 0.015, 0.055, seg=64, rseg=8)
p.layer('skin')
p.bone('body', (0, 0, 0), (0, H, 0))
p.extras['outline'] = 0.026
p.build()
