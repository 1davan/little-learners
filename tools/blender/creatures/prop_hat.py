"""Big floppy straw sun hat (Where's Crab?): brim radius 1.8 with a soft wavy edge, a round crown (top ~1.15), a pink
ribbon band and a bow at the front right."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

STRAW, STRAW_D, STRAW_L, PINK, PINK_D = 0xf2d16b, 0xd9b04a, 0xf8e08e, 0xff8fc0, 0xe86fa4
p = Prop('prop_hat', base=STRAW, target_faces=3600, voxel=0.018)
# brim: a thin disc that droops toward the edge, crown on top
pts = []
for i in range(0, 11):
    r = 0.9 + 0.9 * i / 10
    pts.append((r, 0.2 - 0.12 * (i / 10) ** 2))
brim = [(0, 0.06), (0.9, 0.06)] + [(r, y - 0.07) for r, y in pts[1:]] + [(1.82, 0.1)] + [(r, y + 0.03) for r, y in reversed(pts)] + [(0, 0.23)]
p.lathe(rounded(brim, 0.03, n=2), seg=64)
p.lathe(rounded([(0, 0.15), (0.95, 0.15), (0.95, 0.55), (0.8, 1.0), (0.4, 1.15), (0, 1.17)], 0.25, n=6), seg=56)
p.paint_fn(lambda q, n: (int(math.atan2(q.x, q.z) * 9) % 2 == 0) and math.hypot(q.x, q.z) > 1.0, STRAW_L)
p.paint_fn(lambda q, n: n.y < -0.5, STRAW_D)
p.layer('band', base=PINK, target_faces=1400, voxel=0.014)
p.lathe([(0.9, 0.2), (0.985, 0.2), (0.985, 0.48), (0.9, 0.48)], seg=56, closed=True)
for s in (-1, 1):
    p.blob((0.55 + s * 0.2, 0.36, 0.85), (0.2, 0.13, 0.08), rot=(0, 30, -s * 15), group='bow%d' % s)
p.blob((0.55, 0.36, 0.9), (0.08, 0.08, 0.07), group='knot')
p.paint_fn(lambda q, n: q.z > 0.6 and n.y < -0.3, PINK_D)
p.layer('skin')
p.bone('body', (0, 0, 0), (0, 1.15, 0))
p.extras['outline'] = 0.026
p.build()
