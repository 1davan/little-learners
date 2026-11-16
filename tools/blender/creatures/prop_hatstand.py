"""Shop-window hat stand: a round wooden foot, a slim pole and a cream head form (skin), plus three mini hats that sit
on the head at y 1.0 (each its own layer, tinted: 'top' top hat, 'party' party cone, 'sun' wide sun hat) and their fixed
colour trims ('topband' pink band, 'partypom' white pompom, 'sunflower' pink flower)."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from skit import SProp, dome_profile

WOOD = 0x9a7a5a
p = SProp('prop_hatstand', base=WOOD)
p.lathe([(0, 0), (0.26, 0), (0.28, 0.04), (0.22, 0.09), (0.05, 0.1), (0, 0.1)], seg=16)
p.cyl((0, 0.08, 0), 0.04, 0.6, seg=8, bevel=0.015)
p.lathe(dome_profile(0.24, 0.26, n=6) , pos=(0, 0.84, 0), seg=16)
p.lathe(dome_profile(0.24, 0.2, n=5), pos=(0, 0.84, 0), rot=(180, 0, 0), seg=16)
p.paint_fn(lambda q, n: q.y > 0.62, 0xfff1e6)
HY = 1.02
p.layer('top', base=0xffffff)
p.cyl((0, HY, 0), 0.4, 0.05, seg=20, bevel=0.02)
p.cyl((0, HY + 0.03, 0), 0.25, 0.5, r2=0.27, seg=20, bevel=0.05)
p.layer('topband', base=0xff6fa8)
p.cyl((0, HY + 0.05, 0), 0.275, 0.11, r2=0.278, seg=20, bevel=0.015)
p.layer('party', base=0xffffff)
p.lathe([(0, 0), (0.27, 0), (0.26, 0.04), (0.04, 0.58), (0, 0.6)], pos=(0, HY - 0.02, 0), seg=18)
p.layer('partypom', base=0xffffff)
p.lathe(dome_profile(0.09, 0.09, n=4), pos=(0, HY + 0.6, 0), seg=10)
p.lathe(dome_profile(0.09, 0.09, n=4), pos=(0, HY + 0.6, 0), rot=(180, 0, 0), seg=10)
p.layer('sun', base=0xffffff)
p.lathe([(0, 0), (0.58, 0), (0.6, 0.02), (0.56, 0.05), (0.3, 0.06)] + dome_profile(0.28, 0.24, n=6, base=0.04)[2:], pos=(0, HY - 0.05, 0), seg=24)
p.layer('sunflower', base=0xff5a8a)
for i in range(5):
    a = i / 5 * math.tau
    p.lathe(dome_profile(0.06, 0.03, n=2), pos=(0.24 + 0.055 * math.cos(a), HY + 0.1 + 0.055 * math.sin(a), 0.12), rot=(90, 0, 0), seg=8)
p.lathe(dome_profile(0.04, 0.03, n=2), pos=(0.24, HY + 0.1, 0.14), rot=(90, 0, 0), seg=8)
p.paint_fn(lambda q, n: math.hypot(q.x - 0.24, q.y - HY - 0.1) < 0.035 and q.z > 0.15, 0xffd23f)
p.layer('skin')
p.extras['outline'] = 0.02
p.build()
