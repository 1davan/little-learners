"""Wall shelf (rooms): a white plank 2.6 wide (top at y 0.06, back against z = -0.25) on two curly brackets.
Layer 'toys': a red ball with a white stripe and three toy blocks sitting on it (the bedroom shelf)."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from skit import SProp, dome_profile, arc

p = SProp('prop_shelf', base=0xffffff)
p.box((0, 0, 0), (1.3, 0.06, 0.25), bevel=0.04)
for s in (-1, 1):
    br = [(0, 0), (0.0, -0.36)] + arc(0.0, -0.36, 0.3, 270, 360, 5)[1:] + [(0.3, -0.06), (0.3, 0.0)]
    br = [(0, -0.06), (0, -0.42)] + [(0.34 * (1 - math.cos(a)), -0.42 + 0.36 * math.sin(a)) for a in [i / 6 * math.pi / 2 for i in range(1, 7)]]
    p.prism([(z - 0.245, y) for z, y in br], s * 0.95 - 0.04, s * 0.95 + 0.04, axis='x', bevel=0.02)
p.paint_fn(lambda q, n: n.y < -0.6 and q.y < -0.05, 0xe6e2ee)
p.layer('toys', base=0xff5a5a)
p.lathe(dome_profile(0.32, 0.32, n=7, base=0) , pos=(-0.8, 0.38, 0.05), seg=18)
p.lathe(dome_profile(0.32, 0.32, n=7, base=0), pos=(-0.8, 0.38, 0.05), rot=(180, 0, 0), seg=18)
p.paint_fn(lambda q, n: abs(q.x + 0.8 - (q.y - 0.38) * 0.4) < 0.06 and q.x < -0.3, 0xffffff)
for x, col, h in ((0.1, 0x5ab4ff, 0.5), (0.55, 0xffd23f, 0.4), (0.95, 0x5fd068, 0.6)):
    p.box((x, 0.06 + h / 2, 0.05), (0.18, h / 2, 0.18), bevel=0.05)
p.paint_fn(lambda q, n: q.x > -0.2 and q.x < 0.33, 0x5ab4ff)
p.paint_fn(lambda q, n: q.x > 0.33 and q.x < 0.75, 0xffd23f)
p.paint_fn(lambda q, n: q.x > 0.75, 0x5fd068)
p.layer('skin')
p.extras['outline'] = 0.022
p.build()
