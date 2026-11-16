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
p.lathe([(0, 0), (0.85, 0), (0.8, 0.3), (0.55, 1.6), (0.42, 2.0), (0.3, 2.15), (0, 2.18)], pos=(X, -2.6, 0.4), seg=20, scale=(1, 0.42))
p.lathe(dome_profile(0.4, 0.42, n=6), pos=(X, -0.48, 0.36), seg=16, scale=(1, 0.8))
p.lathe(dome_profile(0.4, 0.25, n=5), pos=(X, -0.48, 0.36), rot=(180, 0, 0), seg=16, scale=(1, 0.8))
for s in (-1, 1):
    p.box((X + s * 0.42, -1.9, 0.7), (0.18, 0.14, 0.04), rot=(0, 0, s * 6), bevel=0.03)
for k in range(3):
    p.box((X, -0.95 - k * 0.42, 0.72 - k * 0.035), (0.1, 0.035, 0.03), bevel=0.015)
p.paint_fn(lambda q, n: abs(q.x - X) < 0.12 and -1.9 < q.y < -0.8 and q.z > 0.71, 0x5a4a80)
p.paint_fn(lambda q, n: q.y > -0.6 and q.z > 0.66 and math.hypot(q.x - X, q.y + 0.48) < 0.22, 0xe8b820)
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
