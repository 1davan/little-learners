"""Wooden lantern post (beach sunset/night): a 2.4 tall post on a little stone base, a curly iron arm at the top with a
hook end at (0.48, 2.14, 0) where the lantern (makeLantern) hangs."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from skit import SProp, dome_profile

H = 2.4
p = SProp('prop_lanternpost', base=0x9a6a44)
p.cyl((0, 0.1, 0), 0.075, H - 0.1, r2=0.065, seg=10, bevel=0.025)
p.lathe(dome_profile(0.1, 0.1, n=4), pos=(0, H, 0), seg=10)
p.lathe(dome_profile(0.24, 0.16, n=4), pos=(0, 0, 0), seg=10, scale=(1.1, 0.9))
p.paint_fn(lambda q, n: q.y < 0.15, 0xc8c2d6)
p.layer('arm', base=0x5a4a6a)
pts = [(0.0, H - 0.12, 0), (0.22, H - 0.1, 0), (0.42, H - 0.08, 0), (0.5, H - 0.12, 0), (0.48, H - 0.18, 0)]
p.tube(pts, 0.025, rseg=6)
curl = [(0.06 + 0.1 * math.cos(a), H - 0.26 + 0.1 * math.sin(a), 0) for a in [math.pi / 2 + i * 0.5 for i in range(9)]]
p.tube([(0.0, H - 0.16, 0)] + curl, 0.018, rseg=5)
p.tube([(0.48, H - 0.18, 0), (0.48, H - 0.26, 0)], 0.012, rseg=4)
p.layer('skin')
p.extras['outline'] = 0.02
p.build()
