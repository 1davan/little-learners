"""Clothes rail (dressing room): a gold frame 4.8 wide, bar at y 4.5 (origin = floor centre), splayed feet with little
pink wheels (layer 'wheels'). Layers 'dress' and 'top' are hanging garments (tinted) built from their hook at the
origin downward, each on its own wooden hanger (layer 'hanger', hook at the origin)."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from skit import SProp, dome_profile, rounded

GOLD = 0xffc93a
p = SProp('prop_clothesrail', base=GOLD)
for s in (-1, 1):
    p.cyl((s * 2.3, 0.25, 0), 0.07, 4.25, seg=10, bevel=0.03)
    p.box((s * 2.3, 0.18, 0), (0.08, 0.08, 0.7), bevel=0.04)
    p.lathe(dome_profile(0.13, 0.13, n=4), pos=(s * 2.3, 4.5, 0), seg=12)
p.cyl((-2.3, 4.5, 0), 0.06, 4.6, rot=(0, 0, -90), seg=10, bevel=0.02)
p.layer('wheels', base=0xff8fc0)
for s in (-1, 1):
    for z in (-0.62, 0.62):
        p.cyl((s * 2.3 - 0.04, 0.1, z), 0.1, 0.08, rot=(0, 0, -90), seg=12, bevel=0.03)
p.layer('hanger', base=0x9a7a5a)
p.tube([(0.0, -0.14, 0)] + [(0.07 * math.sin(a), 0.03 + 0.07 * math.cos(a), 0) for a in [math.pi * k / 6 for k in range(0, 9)]], 0.018, rseg=5)
p.tube([(-0.42, -0.32, 0), (-0.1, -0.16, 0), (0.0, -0.14, 0), (0.1, -0.16, 0), (0.42, -0.32, 0)], 0.035, rseg=6)
p.paint_fn(lambda q, n: q.y > -0.15 and abs(q.x) < 0.1, 0x8a8aa0)
p.layer('dress', base=0xffffff)
prof = [(0, -0.28), (0.2, -0.28), (0.24, -0.5), (0.2, -0.75), (0.34, -0.95), (0.55, -1.5), (0.62, -1.75), (0.58, -1.82), (0, -1.82)]
p.lathe(prof, seg=20, scale=(1, 0.42))
for s in (-1, 1):
    p.box((s * 0.14, -0.33, 0.0), (0.04, 0.06, 0.08), bevel=0.03)
p.paint_fn(lambda q, n: -0.98 < q.y < -0.86, 0xe8e0f0)
p.layer('top', base=0xffffff)
p.box((0, -0.65, 0), (0.36, 0.38, 0.11), bevel=0.09)
for s in (-1, 1):
    p.box((s * 0.47, -0.42, 0), (0.15, 0.2, 0.1), rot=(0, 0, s * 35), bevel=0.07)
p.paint_fn(lambda q, n: q.y > -0.34 and abs(q.x) < 0.14 and q.z > 0.05, 0xe8e0f0)
p.layer('skin')
p.extras['outline'] = 0.022
p.build()
