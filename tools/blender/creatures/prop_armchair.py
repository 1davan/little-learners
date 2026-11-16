"""Cosy armchair (rainy room): a chunky rounded chair (tinted: painted white) 2.8 wide, seat top at y 1.05, origin =
floor centre, back toward -z; little wooden feet (layer 'feet'), a yellow round cushion (layer 'cushion') and a pink
knitted blanket over one arm (layer 'blanket')."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from skit import SProp, dome_profile

p = SProp('prop_armchair', base=0xffffff)
p.box((0, 0.68, 0.1), (1.12, 0.32, 0.82), bevel=0.22)                 # seat base
p.box((0, 1.08, 0.18), (1.05, 0.14, 0.72), bevel=0.13)               # seat cushion
p.box((0, 1.75, -0.66), (1.3, 0.95, 0.3), bevel=0.28)                # back
for s in (-1, 1):
    p.box((s * 1.22, 1.05, 0.05), (0.3, 0.58, 0.92), bevel=0.26)     # arms
    p.cyl((s * 1.22, 1.62, 0.97), 0.3, 0.06, rot=(90, 0, 0), seg=18, bevel=0.03)
p.paint_fn(lambda q, n: n.y < -0.5, 0xd8d0e8)
p.paint_fn(lambda q, n: q.z > 0.97 and abs(q.x) > 0.95 and q.y > 1.3, 0xe6def0)
p.layer('feet', base=0x7a5a3a)
for sx in (-1, 1):
    for sz in (-1, 1):
        p.lathe([(0, 0), (0.07, 0), (0.1, 0.36), (0, 0.38)], pos=(sx * 1.2, 0, sz * 0.7 - 0.1), seg=8)
p.layer('cushion', base=0xffd23f)
p.lathe(dome_profile(0.5, 0.2, n=5), pos=(-0.5, 1.75, -0.28), rot=(70, 0, 18), seg=18)
p.lathe(dome_profile(0.5, 0.2, n=5), pos=(-0.5, 1.75, -0.28), rot=(250, 0, -18), seg=18)
p.paint_fn(lambda q, n: math.hypot(q.x + 0.5, q.y - 1.75) < 0.08, 0xffb020)
p.layer('blanket', base=0xff8fc0)
pts = []
for k in range(9):
    t = k / 8
    pts.append((0.95 + 0.05 * math.sin(t * 6), 1.75 - 1.1 * t, 0.2 + 0.25 * math.sin(t * 3)))
for i, (x, y, z) in enumerate(pts):
    p.box((x, y, z), (0.42, 0.075, 0.05), rot=(70 + 15 * math.sin(i), 0, -8), bevel=0.04)
p.paint_fn(lambda q, n: (int((1.8 - q.y) / 0.25) % 2) == 1, 0xffd6e6)
p.layer('skin')
p.extras['outline'] = 0.024
p.build()
