"""Street lamp (hat shop street): a 4.2 tall plum post on a stepped foot with a curly bracket, a lantern head with a
glowing glass globe (layer 'glass', drawn unlit) under a plum cap with a finial (layer 'cap')."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from skit import SProp, dome_profile

PLUM = 0x5a4a80
p = SProp('prop_streetlamp', base=PLUM)
p.lathe([(0, 0), (0.3, 0), (0.3, 0.12), (0.2, 0.18), (0.18, 0.4), (0.1, 0.5), (0, 0.5)], seg=16)
p.cyl((0, 0.45, 0), 0.08, 3.6, r2=0.065, seg=10, bevel=0.02)
p.lathe([(0, 0), (0.14, 0), (0.16, 0.06), (0.12, 0.12), (0, 0.12)], pos=(0, 4.0, 0), seg=12)
p.layer('glass', base=0xfff4c4)
p.lathe([(0, 0)] + [(0.3 * math.sin(math.pi * t / 8) ** 0.8 + 0.06 * (t / 8 < 0.2), 0.62 * t / 8) for t in range(1, 8)] + [(0, 0.62)], pos=(0, 4.1, 0), seg=16)
p.layer('cap', base=PLUM)
p.lathe([(0, 0), (0.42, 0), (0.42, 0.04), (0.2, 0.26), (0.06, 0.3), (0, 0.3)], pos=(0, 4.66, 0), seg=16)
p.lathe(dome_profile(0.08, 0.08, n=3) , pos=(0, 4.95, 0), seg=10)
p.lathe(dome_profile(0.08, 0.06, n=3), pos=(0, 4.95, 0), rot=(180, 0, 0), seg=10)
p.ring((0, 4.1, 0), 0.2, 0.03, seg=16, rseg=5)
p.layer('skin')
p.extras['outline'] = 0.022
p.build()
