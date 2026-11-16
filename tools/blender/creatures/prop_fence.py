"""Picket fence (farm scenery, Peekaboo pots), tintable (white paint x the fence colour). One repeatable section
1.7 long from x = 0 to 1.7 (skin: four round-topped pickets on two rails) and a 'post' at x = 0 (square post with a
ball cap, 1.4 tall). scenery.js instances them along the fence."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from skit import SProp, arc

L, SH = 1.7, 0xe2ddd6
p = SProp('prop_fence', base=0xffffff)
p.layers['skin'].update(segs=1, psegs=1)
for i in range(4):
    x = L * (i + 0.5) / 4
    w, h = 0.11, 1.08
    top = [(x - w, 0.06), (x + w, 0.06), (x + w, h - w)] + arc(x, h - w, w, 0, 180, 4)[1:-1] + [(x - w, h - w)]
    p.prism(top, 0.0, 0.075, bevel=0.025)
for y in (0.34, 0.8):
    p.box((L / 2, y, -0.045), (L / 2 + 0.02, 0.065, 0.045), bevel=0.025)
p.layer('post', base=0xffffff)
p.layers['post'].update(segs=1)
p.box((0, 0.66, -0.02), (0.1, 0.66, 0.1), bevel=0.035)
p.lathe([(0, 0), (0.1, 0.0), (0.135, 0.1), (0.11, 0.2), (0, 0.26)], pos=(0, 1.28, -0.02), seg=8)
p.box((0, 1.31, -0.02), (0.12, 0.025, 0.12), bevel=0.012)
p.layer('skin')
p.extras['outline'] = 0.022
p.build()
