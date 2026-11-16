"""Woven picnic basket (Where's Crab? 'in'). 2.0 wide x 1.0 tall x 1.5 deep, hollow; woven sides, a darker rim, an arched
handle across the top and a red-and-white checked cloth draped over one corner."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop

W, H, D, T = 2.0, 1.0, 1.5, 0.1
WEAVE, WEAVE_D, WEAVE_L, IN = 0xd99a4e, 0xb9783a, 0xe8b46a, 0x9a6430
hw, hd = W / 2, D / 2
p = Prop('prop_picnic', base=WEAVE, target_faces=3600, voxel=0.018)
p.box((0, T / 2, 0), (hw, T / 2, hd), bevel=0.05)
p.box((0, H / 2, hd - T / 2), (hw, H / 2, T / 2), bevel=0.05)
p.box((0, H / 2, -hd + T / 2), (hw, H / 2, T / 2), bevel=0.05)
for s in (-1, 1):
    p.box((s * (hw - T / 2), H / 2, 0), (T / 2, H / 2, hd), bevel=0.05)
inside = lambda q: abs(q.x) < hw - T + 0.02 and abs(q.z) < hd - T + 0.02 and q.y > T - 0.02


def weave(q, n):
    if inside(q):
        return False
    u = q.x if abs(n.z) > abs(n.x) else q.z
    return (int(math.floor(u / 0.2)) + int(math.floor(q.y / 0.2))) % 2 == 0
p.paint_fn(weave, WEAVE_L)
p.paint_fn(lambda q, n: inside(q), IN)
p.layer('rim', base=WEAVE_D, target_faces=1800, voxel=0.016)
rim = [(-hw + 0.03, H, -hd + 0.03), (hw - 0.03, H, -hd + 0.03), (hw - 0.03, H, hd - 0.03), (-hw + 0.03, H, hd - 0.03)]
from kit import rounded
p.tube(rounded(rim, 0.15, n=4, closed=True), 0.07, closed=True, rseg=8)
p.tube([(-hw + 0.08, H, 0)] + [(-(hw - 0.08) * math.cos(math.radians(a)), H + 0.8 * math.sin(math.radians(a)), 0) for a in range(10, 171, 10)] + [(hw - 0.08, H, 0)], 0.065, rseg=8)
p.layer('cloth', base=0xffffff, target_faces=1400, voxel=0.012)
# a checked napkin draped over the back-left corner
for (x, y, z, rx, rz) in ((-0.62, H + 0.03, -0.42, 8, -6), (-0.95, H - 0.18, -0.4, 0, -80)):
    p.box((x, y, z), (0.36, 0.025, 0.34), rot=(rx, 0, rz), bevel=0.02)
p.paint_fn(lambda q, n: (int(math.floor((q.x + 2) / 0.17)) + int(math.floor((q.z + 2) / 0.17)) + int(math.floor((q.y + 2) / 0.17))) % 2 == 0, 0xff5a5a)
p.layer('skin')
p.bone('body', (0, 0, 0), (0, H, 0))
p.extras['outline'] = 0.024
p.build()
