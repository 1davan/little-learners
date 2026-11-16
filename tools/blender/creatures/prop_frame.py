"""Framed picture (rooms): a chunky white frame 1.3 x 1.0 (origin = centre, back on z = 0), a sky 'canvas' layer
(white: tinted per picture) and an 'art' layer: a sunny day - yellow sun, green hills, a little white cloud."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from skit import SProp, rounded, dome_profile

p = SProp('prop_frame', base=0xffffff)
for (x, y, w, h) in ((0, 0.43, 0.65, 0.08), (0, -0.43, 0.65, 0.08), (-0.57, 0, 0.08, 0.5), (0.57, 0, 0.08, 0.5)):
    p.box((x, y, 0.07), (w, h, 0.07), bevel=0.035)
p.layer('canvas', base=0xffffff)
p.box((0, 0, 0.03), (0.52, 0.38, 0.03), bevel=0.01)
p.layer('art', base=0x5fd068)
hill = [(-0.5, -0.36)] + [(-0.5 + 0.62 * t, -0.36 + 0.3 * math.sin(math.pi * t)) for t in [i / 8 for i in range(1, 8)]] + [(0.12, -0.36)]
p.prism(hill, 0.05, 0.07, bevel=0.008)
hill2 = [(-0.1, -0.36)] + [(-0.1 + 0.6 * t, -0.36 + 0.2 * math.sin(math.pi * t)) for t in [i / 8 for i in range(1, 8)]] + [(0.5, -0.36)]
p.prism(hill2, 0.055, 0.075, bevel=0.008)
p.lathe(dome_profile(0.12, 0.03, n=3), pos=(0.27, 0.15, 0.05), rot=(90, 0, 0), seg=16)
for k, (x, y, r) in enumerate(((-0.28, 0.16, 0.08), (-0.18, 0.19, 0.1), (-0.08, 0.16, 0.07))):
    p.lathe(dome_profile(r, 0.025, n=2), pos=(x, y, 0.05), rot=(90, 0, 0), seg=12)
p.paint_fn(lambda q, n: q.x > 0.1 and q.y > 0.0 and q.z > 0.04, 0xffd23f)
p.paint_fn(lambda q, n: q.x < 0.0 and q.y > 0.05, 0xffffff)
p.paint_fn(lambda q, n: q.y < -0.0 and q.x > -0.1 and q.z > 0.072, 0x4fc060)
p.layer('skin')
p.extras['outline'] = 0.02
p.build()
