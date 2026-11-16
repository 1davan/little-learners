"""Child's bed (Home world: the bedroom). Seen side-on: the long axis is x (headboard at x -1.75, foot at +1.75),
1.9 wide (z -0.95..0.95), origin = floor centre. Mattress top at y 0.86.
Layers (static):
  skin     honey wood: an arched headboard with a heart cut-out look (painted), a lower footboard, side rails, round feet
  mattress white mattress with a pale blue stripe
  duvet    painted white with soft grey stars and a turned-down fold (tinted per room)
  pillow   a plump white pillow"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from skit import SProp, rounded

WOOD, WOOD_D = 0xe0a868, 0xc08850
L, Wd = 1.75, 0.95

p = SProp('prop_bed', base=WOOD)
head = rounded([(-Wd - 0.08, 0.0), (Wd + 0.08, 0.0), (Wd + 0.08, 1.75), (0.0, 2.15), (-Wd - 0.08, 1.75)], 0.28, n=4, closed=True)
p.prism(head, -L - 0.1, -L + 0.1, bevel=0.05, axis='x')
foot = rounded([(-Wd - 0.08, 0.0), (Wd + 0.08, 0.0), (Wd + 0.08, 1.15), (0.0, 1.35), (-Wd - 0.08, 1.15)], 0.22, n=4, closed=True)
p.prism(foot, L - 0.1, L + 0.1, bevel=0.05, axis='x')
for s in (-1, 1):
    p.box((0, 0.48, s * (Wd + 0.02)), (L, 0.13, 0.07), bevel=0.04)          # side rails
for sx in (-1, 1):                                                           # knobs on the posts
    for sz in (-1, 1):
        y = 1.8 if sx < 0 else 1.2
        p.lathe([(0, 0), (0.1, 0.02), (0.13, 0.12), (0.08, 0.24), (0, 0.26)], pos=(sx * L, y - 0.1, sz * (Wd + 0.02)), seg=14)
p.paint_fn(lambda q, n: n.y < -0.5, WOOD_D)
# a heart painted on the headboard and the footboard (both faces)
def heart(cx, cy, s):
    def f(q, n):
        x, y = q.z / s, (q.y - cy) / s
        return (x * x + y * y - 1) ** 3 - x * x * y ** 3 < 0
    return f
p.paint_fn(lambda q, n: abs(q.x) > L - 0.12 and abs(n.x) > 0.7 and heart(0, 1.45 if q.x < 0 else 0.95, 0.28 if q.x < 0 else 0.2)(q, n), 0xff7fa8)

p.layer('mattress', base=0xffffff)
p.box((0, 0.72, 0), (L - 0.1, 0.14, Wd - 0.04), bevel=0.08)
p.paint_fn(lambda q, n: abs(q.y - 0.72) < 0.03, 0xbfe0ff)

p.layer('duvet', base=0xffffff)
p.box((0.42, 0.92, 0), (L - 0.42, 0.1, Wd + 0.04), bevel=0.09)              # the duvet on top
for s in (-1, 1):
    p.box((0.42, 0.66, s * (Wd + 0.06)), (L - 0.44, 0.25, 0.04), bevel=0.03)  # hanging over the sides
p.box((-0.92, 0.98, 0), (0.24, 0.07, Wd + 0.07), bevel=0.06)                 # turned-down fold
p.paint_fn(lambda q, n: q.x < -0.66, 0xf2f2f2)
import random
random.seed(4)
stars = [(random.uniform(-0.5, 1.5), random.uniform(-0.8, 0.8)) for _ in range(9)]
side = [(random.uniform(-0.4, 1.5), random.uniform(0.5, 0.95)) for _ in range(6)]
def star_at(q, n):
    if q.x < -0.62:
        return False
    if n.y > 0.6:
        return any(math.hypot(q.x - x, q.z - z) < 0.09 for x, z in stars)
    if abs(n.z) > 0.6:
        return any(math.hypot(q.x - x, q.y - y) < 0.08 for x, y in side)
    return False
p.paint_fn(star_at, 0xd6dcea)

p.layer('pillow', base=0xffffff)
p.blob((-1.28, 1.08, 0), (0.32, 0.17, 0.62))
p.blob((-1.28, 1.08, 0.48), (0.28, 0.15, 0.2))
p.blob((-1.28, 1.08, -0.48), (0.28, 0.15, 0.2))
p.paint_fn(lambda q, n: n.y < -0.3, 0xe6ecf4)
p.layer('skin')
p.extras['outline'] = 0.024
p.build()
