"""Seaweed clump (Bear's nose rock pool). Origin at its root on the sand: four wavy ribbon fronds (two greens) about
1.3 tall growing from a little holdfast, each frond tapering to a rounded tip."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop

p = Prop('prop_seaweed', base=0x3f9f5e, target_faces=1300, voxel=0.014, smooth=3)
p.quadriflow = False
FR = [(-0.25, 1.15, -18, 0.0), (-0.05, 1.35, -4, 1.3), (0.15, 1.2, 10, 2.4), (0.32, 0.9, 24, 3.7)]
for k, (x0, h, lean, ph) in enumerate(FR):
    pts, rad = [], []
    for i in range(24):
        t = i / 23
        y = h * t
        x = x0 + math.sin(math.radians(lean)) * y + 0.08 * math.sin(t * 7 + ph) * t
        pts.append((x, y, 0.06 * math.cos(t * 5 + ph)))
        rad.append(0.085 * (1 - t * 0.5))
    for (x, y, z), r in zip(pts, rad):
        p.blob((x, y, z), (r * 1.25, r * 1.25, r * 0.55), group='f%d' % k)
p.blob((0.03, 0.04, 0), (0.3, 0.07, 0.18), group='hold')
p.paint_fn(lambda q, n: math.sin(q.x * 9 + 1.0) > 0.0 and q.y > 0.1, 0x5cbf6a)
p.paint_fn(lambda q, n: q.y < 0.1, 0x6b8a4a)
p.bone('root', (0, 0, 0), (0, 1.3, 0))
p.extras['outline'] = 0.016
p.build()
