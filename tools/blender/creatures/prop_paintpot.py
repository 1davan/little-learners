"""Paint tin with a brush (Splash wash: where the paint came from). Origin on the sand under the tin: a cream tin
(r 0.42, 0.6 tall) with a rolled rim and a label band, full of paint, with a drip down the front, a puddle on the
sand and a brush leaning in. The paint (surface, drip, puddle, brush tip) is the tintable skin (argMode 'tint')."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

TIN, TIN_D, LABEL, WOOD, METAL = 0xfff6e6, 0xd9cdb6, 0xffffff, 0xa0623a, 0xc9d1de
p = Prop('prop_paintpot', base=0xffffff, target_faces=900, voxel=0.012, smooth=3)
p.quadriflow = False
p.cyl((0, 0.5, 0), 0.39, 0.075, bevel=0.03, seg=32)                                # paint surface
p.blob((0.14, 0.45, 0.39), (0.07, 0.13, 0.04), group='drip')                        # drip over the rim
p.blob((0.14, 0.3, 0.42), (0.055, 0.08, 0.035), group='drip')
p.blob((0.62, 0.015, 0.4), (0.3, 0.025, 0.2), group='puddle')
p.blob((0.95, 0.012, 0.55), (0.07, 0.015, 0.06), group='splat2')
p.capsule((-0.14, 0.44, -0.02), (-0.08, 0.62, -0.02), 0.07, r2=0.055, group='tip', steps=4)
p.layer('tin', base=TIN, target_faces=900, voxel=0.014)
p.quadriflow = False
wall = rounded([(0, 0), (0.42, 0), (0.42, 0.6), (0.36, 0.6), (0.36, 0.06), (0, 0.06)], 0.03, n=3)
p.lathe(wall, seg=36)
p.ring((0, 0.6, 0), 0.4, 0.04, seg=36, rseg=8)
p.paint_fn(lambda q, n: abs(q.y - 0.3) < 0.13 and math.hypot(q.x, q.z) > 0.39, 0xffd9a0)
p.paint_fn(lambda q, n: q.y < 0.05, TIN_D)
p.layer('brush', base=WOOD, target_faces=400, voxel=0.01)
p.quadriflow = False
p.tube([(-0.05, 0.7, -0.02), (0.22, 1.3, -0.02)], 0.035, rseg=8)
p.layer('ferrule', base=METAL, target_faces=200, voxel=0.008)
p.quadriflow = False
p.tube([(-0.09, 0.6, -0.02), (-0.04, 0.72, -0.02)], 0.06, rseg=10)
p.layer('skin')
p.bone('root', (0, 0, 0), (0, 1.0, 0))
p.extras['argMode'] = 'tint'
p.extras['argDefault'] = 0xff4b6b
p.extras['outline'] = 0.016
p.build()
