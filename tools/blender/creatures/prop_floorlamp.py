"""Floor lamp (rainy room): a round plum foot, a slim pole 4 tall (origin = floor centre) and a soft drum shade with a
scalloped hem (layer 'shade', drawn unlit so it glows) with a pull cord (layer 'cord')."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from skit import SProp, dome_profile

p = SProp('prop_floorlamp', base=0x5a4a80)
p.lathe([(0, 0), (0.45, 0), (0.47, 0.05), (0.35, 0.14), (0.08, 0.18), (0, 0.18)], seg=18)
p.cyl((0, 0.15, 0), 0.055, 3.75, seg=10, bevel=0.02)
p.layer('shade', base=0xfff1c0)
prof = [(0.42, 0), (0.44, 0.02), (0.68, 0.76), (0.7, 0.8)]
inner = [(0.66, 0.8), (0.64, 0.78), (0.4, 0.02), (0.38, 0.0)]
p.lathe(prof + inner, pos=(0, 3.85, 0), seg=24, closed=True)
for i in range(16):
    a = i / 16 * math.tau
    p.lathe(dome_profile(0.07, 0.05, n=2), pos=(0.7 * math.sin(a), 3.85 + 0.0, 0.7 * math.cos(a)), rot=(180, 0, 0), seg=6)
p.paint_fn(lambda q, n: q.y < 3.86, 0xffd6a0)
p.layer('cord', base=0xffc531)
p.tube([(0.3, 3.95, 0.2), (0.32, 3.4, 0.24)], 0.012, rseg=4)
p.lathe(dome_profile(0.04, 0.05, n=2), pos=(0.32, 3.35, 0.24), seg=8)
p.layer('skin')
p.extras['outline'] = 0.022
p.build()
