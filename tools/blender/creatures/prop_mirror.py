"""Wall mirror frame (Dress Monkey bedroom): a chunky pink rounded frame round a 2.26 x 4.52 opening (origin = the
opening's centre, facing +z) with a pale inner moulding, gold ball knobs at the corners (layer 'gold'), a big pink bow
on top (layer 'bow') and the mirror glass (layer 'glass': pale blue with two white shine streaks, set back at z -0.06).
dress-room.js draws only the frame, knobs and bow (its reflection shows through the opening); direct uses (word cards)
show the glass too."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from skit import SProp, rounded, dome_profile

IW, IH = 1.13, 2.26                 # inner half-size of the opening (kept: the game's reflection fills it)
R = 0.25                            # frame tube radius (chunky)
HW, HH = IW + R * 0.9, IH + R * 0.9
p = SProp('prop_mirror', base=0xff9ec4)
path = rounded([(-HW, -HH), (HW, -HH), (HW, HH), (-HW, HH)], 0.4, n=6, closed=True)
p.tube([(x, y, 0) for x, y, *_ in path], R, closed=True, rseg=14)
ipath = rounded([(-IW, -IH), (IW, -IH), (IW, IH), (-IW, IH)], 0.22, n=6, closed=True)
p.tube([(x, y, 0.06) for x, y, *_ in ipath], 0.075, closed=True, rseg=10)          # inner moulding bead
p.paint_fn(lambda q, n: max(abs(q.x) - IW, abs(q.y) - IH) < 0.1 and q.z > -0.05, 0xffd0e2)
p.paint_fn(lambda q, n: n.z < -0.5, 0xf08ab2)
p.layer('gold', base=0xffc531)
for sx in (-1, 1):
    for sy in (-1, 1):
        c = (sx * (HW - 0.06), sy * (HH - 0.06), 0.05)
        p.lathe(dome_profile(0.25, 0.25, n=6), pos=c, rot=(90, 0, 0), seg=18)
        p.lathe(dome_profile(0.25, 0.14, n=4), pos=c, rot=(-90, 0, 0), seg=18)
p.paint_fn(lambda q, n: q.z > 0.2 and n.z > 0.75, 0xffe08a)
p.layer('bow', base=0xff6fa8)
BY = HH + 0.4
for s in (-1, 1):
    loop = [(0.0, 0.0), (s * 0.26, 0.32), (s * 0.72, 0.4), (s * 0.86, 0.08), (s * 0.73, -0.26), (s * 0.28, -0.17)]
    pts = rounded(loop, 0.14, n=5, closed=True)
    p.prism([(x, y) for x, y, *_ in pts][::s], -0.09, 0.09, bevel=0.07, at=(0, BY, 0.14))
    p.prism([(s * 0.05, -0.05), (s * 0.2, -0.09), (s * 0.4, -0.58), (s * 0.27, -0.6), (s * 0.2, -0.5), (s * 0.06, -0.14)][::s], -0.06, 0.06, bevel=0.04, at=(0, BY, 0.12))
p.lathe(dome_profile(0.16, 0.14, n=5), pos=(0, BY, 0.18), rot=(90, 0, 0), seg=16, scale=(1, 1.2))
p.paint_fn(lambda q, n: math.hypot(q.x, q.y - BY) < 0.17 and q.z > 0.22, 0xff4b8a)
p.paint_fn(lambda q, n: n.z < -0.4, 0xf0559a)
p.layer('glass', base=0xcfeaf8)
p.box((0, 0, -0.06), (IW + 0.12, IH + 0.12, 0.03), bevel=0.02)


def shine(q, n):
    if n.z < 0.5:
        return False
    d = q.y - 0.9 * q.x                     # two diagonal streaks, upper left
    return (0.9 < d < 1.25 or 1.45 < d < 1.58) and q.y > -0.4
p.paint_fn(shine, 0xffffff)
p.paint_fn(lambda q, n: n.z > 0.5 and q.y - 0.9 * q.x < -1.6, 0xb9dff3)
p.layer('skin')
p.extras['outline'] = 0.025
p.build()
