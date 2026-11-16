"""Gold sticker crown for a game the child has 3+ stickers in (home menu). Base at y 0, band radius ~0.42, five rounded
points with pearl tips, three jewels round the band and a soft cream lining at the top of the band."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

GOLD, GOLD_D, GOLD_L, PEARL = 0xffcc33, 0xe8a317, 0xffe27a, 0xfff6e2
p = Prop('prop_icon_crown', base=GOLD, target_faces=1500, voxel=0.012)
R, H, T = 0.42, 0.24, 0.05
# band: a hollow flared ring
p.lathe(rounded([(R - T, 0.0), (R, 0.0), (R + 0.04, H), (R + 0.04 - T, H)], 0.02, n=2), seg=64, closed=True)
p.ring((0, 0.02, 0), R + 0.005, 0.04, seg=64, rseg=8)
# five points: chunky flattened cones leaning slightly out
for i in range(5):
    a = math.tau * i / 5
    r = R + 0.025
    p.cyl((r * math.sin(a), H - 0.08, r * math.cos(a)), 0.15, 0.4, r2=0.025, rot=(9, math.degrees(a), 0), scale=(1, 0.42), bevel=0.03, seg=28)
p.paint_fn(lambda q, n: q.y < 0.07 or n.y < -0.4, GOLD_D)
p.paint_fn(lambda q, n: q.y > 0.4, GOLD_L)
# pearls on the tips
p.layer('pearls', base=PEARL, target_faces=400, voxel=0.01)
for i in range(5):
    a = math.tau * i / 5
    r = R + 0.09
    p.blob((r * math.sin(a), H + 0.33, r * math.cos(a)), (0.07, 0.07, 0.07), group='p%d' % i)
# jewels on the band (front, left, right)
p.layer('jewels', base=0xff5a7a, target_faces=450, voxel=0.01)
JC = [(0, 0xff4f6d), (-0.75, 0x4a90ff), (0.75, 0x5fd068), (-1.9, 0xa77bff), (1.9, 0x3fd0e0)]
for a, c in JC:
    r = R + 0.06
    p.blob((r * math.sin(a), H * 0.52, r * math.cos(a)), (0.075, 0.075, 0.045), rot=(0, math.degrees(a), 0), group='j%.1f' % a)
for a, c in JC:
    r = R + 0.06
    p.paint("j", (r * math.sin(a), H * 0.52, r * math.cos(a)), (0.11, 0.11, 0.11), c)
p.layer('skin')
p.bone('body', (0, 0, 0), (0, 0.6, 0))
p.extras['outline'] = 0.02
p.build()
