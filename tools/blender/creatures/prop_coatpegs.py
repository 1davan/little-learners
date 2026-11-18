"""Coat pegs (cosy rainy room): a wooden peg rail 4 wide (origin = its centre, back on the wall z = 0) with three
pegs; a yellow raincoat with hood, toggles and pockets (layer 'coat', on the left peg) and a red-and-white stripy
scarf (layer 'scarf', on the middle peg)."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from skit import SProp, dome_profile

p = SProp('prop_coatpegs', base=0x9a7a5a)
p.box((0, 0, 0.1), (2.0, 0.2, 0.1), bevel=0.06)
for i in range(3):
    x = -1.3 + i * 1.3
    p.cyl((x, -0.1, 0.18), 0.07, 0.3, rot=(90, 0, 0), seg=10, bevel=0.03)
    p.lathe(dome_profile(0.1, 0.08, n=3), pos=(x, -0.1, 0.46), rot=(90, 0, 0), seg=10)
p.layer('coat', base=0xffd23f)
X = -1.3
# a yellow raincoat hanging from the left peg: an A-line body, two sleeves hanging at its sides, a hood bunched up at
# the top where it hangs, big round toggle buttons down the front and two patch pockets
p.lathe([(0, 0), (0.85, 0), (0.8, 0.3), (0.58, 1.6), (0.45, 2.0), (0.32, 2.15), (0, 2.18)], pos=(X, -2.6, 0.42), seg=28, scale=(1, 0.55))
p.lathe(dome_profile(0.42, 0.44, n=6), pos=(X, -0.5, 0.38), seg=20, scale=(1, 0.85))
p.lathe(dome_profile(0.42, 0.26, n=5), pos=(X, -0.5, 0.38), rot=(180, 0, 0), seg=20, scale=(1, 0.85))
for s in (-1, 1):
    p.tube([(X + s * 0.45, -0.72, 0.42), (X + s * 0.72, -1.3, 0.46), (X + s * 0.86, -1.85, 0.5)], [0.17, 0.16, 0.15], rseg=12)
    p.cyl((X + s * 0.87, -2.03, 0.5), 0.15, 0.1, seg=16, bevel=0.03)                 # cuffs
    p.box((X + s * 0.4, -2.0, 0.78), (0.19, 0.16, 0.05), rot=(0, 0, s * 6), bevel=0.04)  # patch pockets
for k in range(3):
    p.cyl((X, -0.98 - k * 0.42, 0.76 - k * 0.04), 0.075, 0.05, rot=(90, 0, 0), seg=16, bevel=0.02)   # big round buttons
p.paint_fn(lambda q, n: q.z > 0.72 and any(math.hypot(q.x - X, q.y + 0.98 + k * 0.42) < 0.08 for k in range(3)), 0x4a90d9)
p.paint_fn(lambda q, n: q.y > -0.62 and q.z > 0.62 and math.hypot(q.x - X, q.y + 0.5) < 0.26, 0xe8b820)
p.paint_fn(lambda q, n: q.y < -1.97 and abs(q.x - X) > 0.7, 0xe8b820)
p.layer('scarf', base=0xff4b4b)
p.layers['scarf'].update(segs=1)
for side, dx, L in ((0, -0.12, 2.1), (1, 0.14, 1.7)):
    for k in range(int(L / 0.3)):
        y = -0.25 - k * 0.3 - 0.15
        p.box((dx + 0.02 * math.sin(k * 1.3 + side), y, 0.36 + 0.03 * side), (0.17, 0.148, 0.045), rot=(0, 0, 3 * math.sin(k + side)), bevel=0.03)
p.lathe(dome_profile(0.2, 0.12, n=3), pos=(0, -0.12, 0.34), rot=(90, 0, 0), seg=12, scale=(1.4, 1))
p.paint_fn(lambda q, n: q.y < -0.25 and int((-q.y - 0.25) / 0.3) % 2 == 1, 0xffffff)
for side, dx, L in ((0, -0.12, 2.1), (1, 0.14, 1.7)):
    for k in range(5):
        p.box((dx - 0.12 + k * 0.06, -0.25 - L + 0.02, 0.36 + 0.03 * side), (0.012, 0.09, 0.012), bevel=0.0)
p.layer('skin')
p.extras['outline'] = 0.022
p.build()
