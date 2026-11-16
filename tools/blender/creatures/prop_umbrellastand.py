"""Umbrella stand (cosy rainy room): a plum pot 1.0 tall (origin = floor centre) holding a furled red umbrella and a
furled green one with crook handles (layer 'brollies')."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from skit import SProp, dome_profile

p = SProp('prop_umbrellastand', base=0x8a6ad0)
p.lathe([(0, 0), (0.36, 0), (0.4, 0.05), (0.38, 0.9), (0.44, 0.95), (0.44, 1.02), (0.34, 1.02), (0.32, 0.92), (0, 0.92)], seg=20)
p.paint_fn(lambda q, n: 0.3 < q.y < 0.45, 0xb197fc)
p.layer('brollies', base=0xff4b4b)
for dx, rz, col in ((-0.12, 8, 0xff4b4b), (0.14, -9, 0x3fae4a)):
    c, s = math.cos(math.radians(rz)), math.sin(math.radians(rz))
    base = (dx, 0.2, 0)
    prof = [(0, 0), (0.05, 0.02), (0.16, 0.5), (0.2, 0.95), (0.12, 1.3), (0.03, 1.45), (0, 1.47)]
    p.lathe(prof, pos=base, rot=(0, 0, rz), seg=8)
    tip = (dx - s * 1.47, 0.2 + c * 1.47, 0)
    p.tube([tip, (tip[0] - s * 0.25, tip[1] + c * 0.25, 0)] + [(tip[0] - s * 0.25 + 0.11 - 0.11 * math.cos(a), tip[1] + c * 0.25 + 0.11 * math.sin(a), 0) for a in [k * math.pi / 6 for k in range(1, 7)]], 0.03, rseg=6)
p.paint_fn(lambda q, n: q.x > 0.02 and q.y < 1.75, 0x3fae4a)
p.paint_fn(lambda q, n: q.y > 1.62, 0x6a5a7a)
p.paint_fn(lambda q, n: q.y < 1.75 and q.y > 0.9 and abs(math.sin((q.y + q.x * 0.3) * 9)) < 0.18, 0xfffaf0)
p.layer('skin')
p.extras['outline'] = 0.022
p.build()
