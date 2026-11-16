"""Watering can (Grow a flower). Tintable (makeWateringCan / the level colour): the round body, top handle and spout are
painted white; the sprinkler rose and the daisy sticker are their own layers. Spout points to +x; anchor 'rose' =
where the water comes out."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded, circle_poly

TINT, TINT_D, ROSE, ROSE_D, PET, MID = 0xffffff, 0xd2d2d2, 0xffd23f, 0xe0a020, 0xffffff, 0xffb02e
p = Prop('prop_can', base=TINT, target_faces=3200, voxel=0.014)
body = rounded([(0, 0), (0.5, 0), (0.62, 0.3), (0.6, 0.7), (0.42, 0.92), (0.2, 0.98), (0.2, 1.04), (0.0, 1.04)], 0.08, n=4)
p.lathe(body, seg=48)
p.ring((0, 1.03, 0), 0.19, 0.035, seg=24, rseg=8)                                  # filler lip
p.ring((0, 0.04, 0), 0.5, 0.045, seg=48, rseg=8)                                   # foot
# top handle arching over the back half
p.tube([(-0.5, 0.72, 0)] + [(-0.12 - 0.36 * math.cos(math.radians(a)), 0.95 + 0.33 * math.sin(math.radians(a)), 0) for a in range(15, 166, 15)] + [(0.28, 0.9, 0)], 0.06, rseg=10)
# spout: from the low front up and out
S0, S1 = (0.45, 0.3, 0), (1.1, 0.98, 0)
p.tube([S0, (0.75, 0.6, 0), S1], [0.12, 0.08, 0.065], rseg=12)
p.paint_fn(lambda q, n: q.y < 0.09 and q.x < 0.5, TINT_D)

# sprinkler rose: a flared cup on the spout tip, facing along the spout
p.layer('rose', base=ROSE, target_faces=700, voxel=0.01)
d = (S1[0] - 0.75, S1[1] - 0.6)
ang = math.degrees(math.atan2(d[0], d[1]))          # tilt from +y toward +x
p.lathe(rounded([(0, -0.02), (0.08, -0.02), (0.19, 0.16), (0.19, 0.2), (0, 0.2)], 0.03, n=3), pos=S1, rot=(0, 0, -ang), seg=28)
tip = (S1[0] + 0.2 * math.sin(math.radians(ang)), S1[1] + 0.2 * math.cos(math.radians(ang)), 0)
p.paint_fn(lambda q, n: math.dist((q.x, q.y, q.z), tip) < 0.2 and (n.x * math.sin(math.radians(ang)) + n.y * math.cos(math.radians(ang))) > 0.7
           and int((q.z + 0.2) / 0.07) % 2 == int((q.y + 0.2) / 0.07) % 2, ROSE_D)

# daisy sticker on both sides
p.layer('deco', base=PET, target_faces=900, voxel=0.008)
for s in (-1, 1):
    for k in range(6):
        a = k * math.tau / 6
        p.blob((0.14 * math.cos(a), 0.5 + 0.14 * math.sin(a), s * 0.625), (0.068, 0.068, 0.022), group='petal%d%d' % (s, k))
p.layer('mid', base=MID, target_faces=200, voxel=0.007)
for s in (-1, 1):
    p.blob((0, 0.5, s * 0.64), (0.07, 0.07, 0.025), group='mid%d' % s)
p.layer('skin')

p.bone('body', (0, 0, 0), (0, 1.0, 0))
p.anchor('rose', tip, 'body')
p.extras['argMode'] = 'tint'
p.extras['argDefault'] = 0x4a90ff
p.extras['outline'] = 0.022
p.build()
