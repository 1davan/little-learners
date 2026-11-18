"""Floor lamp (rainy room): a round plum foot, a slim pole 4 tall (origin = floor centre) and a soft drum shade with a
scalloped hem (layer 'shade', drawn unlit so it glows) with a pull cord (layer 'cord')."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from skit import SProp, dome_profile, rounded

p = SProp('prop_floorlamp', base=0x5a4a80)
p.lathe(rounded([(0, 0), (0.55, 0), (0.57, 0.07), (0.42, 0.2), (0.14, 0.27), (0, 0.27)], 0.05, n=3), seg=32)
p.cyl((0, 0.2, 0), 0.095, 3.68, seg=20, bevel=0.03)
for yy in (1.3, 2.6):                                    # turned beads on the pole
    p.lathe(rounded([(0, -0.1), (0.13, -0.08), (0.16, 0.0), (0.13, 0.08), (0, 0.1)], 0.04, n=3), pos=(0, yy, 0), seg=20)
p.lathe(rounded([(0, 0), (0.18, 0), (0.12, 0.12), (0, 0.14)], 0.03, n=2), pos=(0, 3.78, 0), seg=20)
p.layer('shade', base=0xfff1c0)
prof = [(0.42, 0), (0.44, 0.02), (0.68, 0.76), (0.7, 0.8)]
inner = [(0.66, 0.8), (0.64, 0.78), (0.4, 0.02), (0.38, 0.0)]
p.lathe(prof + inner, pos=(0, 3.85, 0), seg=40, closed=True)
for i in range(12):                                     # clean scalloped fringe under the shade
    a = i / 12 * math.tau
    p.lathe(dome_profile(0.13, 0.11, n=4), pos=(0.66 * math.sin(a), 3.86, 0.66 * math.cos(a)), rot=(180, 0, 0), seg=14, scale=(1, 0.55))
p.paint_fn(lambda q, n: q.y < 3.86, 0xffd6a0)
p.layer('cord', base=0xffc531)
p.tube([(0.3, 3.95, 0.2), (0.32, 3.45, 0.24)], 0.018, rseg=6)
p.lathe(rounded([(0, 0), (0.05, 0.02), (0.06, 0.08), (0, 0.12)], 0.02, n=2), pos=(0.32, 3.34, 0.24), seg=12)
p.layer('skin')
p.extras['outline'] = 0.022
p.build()
