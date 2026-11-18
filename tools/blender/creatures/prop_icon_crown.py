"""Gold sticker crown for a game the child has 3+ stickers in (home menu). Base at y 0, band radius ~0.42, about 0.8
tall: a fat flared gold band with a rolled foot, five chunky rounded points each topped by a seated pearl, red velvet
puffing up inside, and five big round jewels round the band (layers 'pearls', 'jewels', 'velvet')."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

GOLD, GOLD_D, GOLD_L, PEARL = 0xffc21a, 0xe09a10, 0xffe27a, 0xfff8ee
p = Prop('prop_icon_crown', base=GOLD, target_faces=3000, voxel=0.008)
R, H = 0.42, 0.27
p.lathe(rounded([(R - 0.06, 0.0), (R + 0.03, 0.0), (R + 0.045, H), (R - 0.035, H)], 0.025, n=2), seg=64, closed=True)
p.ring((0, 0.03, 0), R + 0.03, 0.035, seg=64, rseg=10)              # rolled foot
TIP = []
for k in range(5):
    a = k / 5 * math.tau
    for t in range(7):
        u = t / 6
        rr = R - 0.005 - u * 0.04
        p.blob((math.sin(a) * rr, H - 0.02 + u * 0.4, math.cos(a) * rr), (0.12 * (1 - u * 0.7), 0.07, 0.035 + 0.012 * (1 - u)),
               rot=(0, math.degrees(a), 0), group='pt%d' % k)
    TIP.append((math.sin(a) * (R - 0.045), H + 0.43, math.cos(a) * (R - 0.045)))
p.paint_fn(lambda q, n: q.y < 0.065 or (H - 0.035 < q.y < H + 0.005 and math.hypot(q.x, q.z) > R - 0.01), GOLD_D)
p.layer('velvet', base=0xd8283c, target_faces=700, voxel=0.01)
p.blob((0, 0.3, 0), (0.37, 0.22, 0.37))
p.paint('vl', (-0.15, 0.47, 0.18), (0.12, 0.06, 0.1), 0xff5a68)
p.layer('pearls', base=PEARL, target_faces=700, voxel=0.006)
for k, (x, y, z) in enumerate(TIP):
    p.blob((x, y, z), (0.06, 0.06, 0.06), group='pe%d' % k)
p.layer('jewels', base=0xff3a4a, target_faces=800, voxel=0.006)
GEMS = [0xff3a4a, 0x3f8cff, 0x4cc75a, 0xa77bff, 0x3fd0e0]
for k in range(5):
    a = k / 5 * math.tau
    c = (math.sin(a) * (R + 0.045), H * 0.55, math.cos(a) * (R + 0.045))
    p.blob(c, (0.058, 0.07, 0.03), rot=(0, math.degrees(a), 0), group='gm%d' % k)
    p.paint('gc%d' % k, c, (0.11, 0.11, 0.11), GEMS[k])
p.layer('skin')
p.bone('body', (0, 0, 0), (0, 0.6, 0))
p.extras['outline'] = 0.016
p.build()
