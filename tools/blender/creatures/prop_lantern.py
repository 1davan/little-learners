"""Paper lantern (beach sunset/night, home decorations). A ribbed paper body (height 0.62, centre at the origin) painted
white with pale ribs - scenery.js tints it and draws it unlit so it glows; dark wooden caps, a hanging loop and a little
red tassel in layer 'caps'."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from skit import SProp

p = SProp('prop_lantern', base=0xffffff)
prof = [(0, -0.31)]
for i in range(1, 16):
    t = i / 16
    y = -0.31 + 0.62 * t
    r = 0.27 * math.sin(math.pi * t) ** 0.6
    if i % 3 == 0:
        r *= 0.93
    prof.append((max(r, 0.12), y))
prof.append((0, 0.31))
p.lathe(prof, seg=18)
p.paint_fn(lambda q, n: any(abs(q.y - (-0.31 + 0.62 * k / 16)) < 0.012 for k in (3, 6, 9, 12, 15)), 0xe8e0dc)
p.layer('caps', base=0x5a3a2a)
for y, s in ((0.27, 1), (-0.27, -1)):
    p.cyl((0, y - (0.0 if s > 0 else 0.07), 0), 0.13, 0.07, seg=14, bevel=0.02)
p.ring((0, 0.42, 0), 0.07, 0.015, rot=(90, 0, 0), seg=14, rseg=5)
p.tube([(0, 0.34, 0), (0, 0.36, 0)], 0.02, rseg=5)
p.cyl((0, -0.46, 0), 0.04, 0.12, r2=0.025, seg=8, bevel=0.01)
p.tube([(0, -0.34, 0), (0, -0.36, 0)], 0.015, rseg=5)
p.paint_fn(lambda q, n: q.y < -0.36, 0xff5a5a)
p.layer('skin')
p.extras['outline'] = 0.02
p.build()
