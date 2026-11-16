"""Wall mirror frame (Dress Monkey bedroom): a chunky pink rounded frame round a 2.5 x 4.75 opening (origin = the
opening's centre, facing +z), gold knobs at the corners (layer 'gold') and a big pink bow on top (layer 'bow')."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from skit import SProp, rounded, dome_profile

HW, HH, R = 1.3, 2.43, 0.17
p = SProp('prop_mirror', base=0xff9ec4)
path = rounded([(-HW, -HH), (HW, -HH), (HW, HH), (-HW, HH)], 0.35, n=5, closed=True)
p.tube([(x, y, 0) for x, y in path], R, closed=True, rseg=10)
p.paint_fn(lambda q, n: q.z > 0.12 and n.z > 0.9, 0xffb8d3)
p.layer('gold', base=0xffc531)
for sx in (-1, 1):
    for sy in (-1, 1):
        p.lathe(dome_profile(0.24, 0.24, n=5) , pos=(sx * (HW - 0.08), sy * (HH - 0.08), 0.02), rot=(90, 0, 0), seg=14)
        p.lathe(dome_profile(0.24, 0.12, n=4), pos=(sx * (HW - 0.08), sy * (HH - 0.08), 0.02), rot=(-90, 0, 0), seg=14)
p.paint_fn(lambda q, n: q.z > 0.2, 0xffe08a)
p.layer('bow', base=0xff6fa8)
for s in (-1, 1):
    loop = [(0.0, 0.0), (s * 0.18, 0.2), (s * 0.48, 0.26), (s * 0.58, 0.05), (s * 0.5, -0.18), (s * 0.2, -0.12)]
    pts = rounded(loop, 0.12, n=4, closed=True)
    p.prism([(x, y) for x, y, *_ in pts][::s], -0.07, 0.07, bevel=0.05, at=(0, HH + 0.3, 0.12))
    p.prism([(s * 0.05, -0.05), (s * 0.18, -0.08), (s * 0.34, -0.5), (s * 0.18, -0.44), (s * 0.06, -0.12)][::s], -0.05, 0.05, bevel=0.03, at=(0, HH + 0.3, 0.1))
p.lathe(dome_profile(0.14, 0.12, n=4), pos=(0, HH + 0.3, 0.14), rot=(90, 0, 0), seg=12, scale=(1, 1.2))
p.paint_fn(lambda q, n: math.hypot(q.x, q.y - HH - 0.3) < 0.15 and q.z > 0.18, 0xff4b8a)
p.layer('skin')
p.extras['outline'] = 0.025
p.build()
