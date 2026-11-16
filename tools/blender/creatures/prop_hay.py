"""Hay bale (Peekaboo pots). 2.5 wide x 1.8 tall x 1.9 deep, soft rounded block with straw streaks, two brown twine bands
and a few loose straws sticking out of the top."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop

HAY, HAY_D, HAY_L, TWINE = 0xf0c648, 0xd9a92e, 0xf8dc78, 0xa86f3a
p = Prop('prop_hay', base=HAY, target_faces=3600, voxel=0.02)
p.box((0, 0.9, 0), (1.25, 0.9, 0.95), bevel=0.22)


def streak(q, n):
    k = (q.x * 3.1 + q.y * 7.3 + q.z * 2.3)
    return (math.sin(k * 3.0) + math.sin(q.y * 23 + q.x * 5) * 0.6) > 1.1
p.paint_fn(streak, HAY_D)
p.paint_fn(lambda q, n: (math.sin(q.x * 17 + q.y * 3) + math.sin(q.z * 13 - q.y * 9)) > 1.5, HAY_L)
p.layer('twine', base=TWINE, target_faces=1600, voxel=0.014)
for x in (-0.62, 0.62):
    pts = [(x, 0.9 + 0.93 * math.sin(a), 0.98 * math.cos(a)) for a in [i / 40 * math.tau for i in range(40)]]
    # squarish loop around the bale
    sq = []
    for a in [i / 64 * math.tau for i in range(64)]:
        c, s_ = math.cos(a), math.sin(a)
        k = 1 / max(abs(c), abs(s_)) ** 0.85
        sq.append((x, 0.9 + 0.93 * s_ * min(k, 1.25), 0.98 * c * min(k, 1.25) * 0.98))
    p.tube(sq, 0.045, closed=True, rseg=8)
p.layer('straws', base=HAY_L, target_faces=900, voxel=0.01)
for i in range(7):
    x = -1.0 + i * 0.33
    p.capsule((x, 1.72, -0.3 + (i % 3) * 0.3), (x + (0.18 if i % 2 else -0.18), 2.02, -0.3 + (i % 3) * 0.3 + 0.05), 0.03, r2=0.018, group='s%d' % i)
p.layer('skin')
p.bone('body', (0, 0, 0), (0, 1.8, 0))
p.extras['outline'] = 0.026
p.build()
