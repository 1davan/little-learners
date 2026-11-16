"""Open umbrella (farm rainy day): a soft eight-panel canopy radius 1.0 (tintable: painted white) with scalloped edge
and white tip knobs, a wooden shaft and a curly crook handle (layer 'stick'). Canopy apex at y 2.25, shaft from y 0."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from skit import SProp, TAU

R, TOP, EDGE, TH = 1.05, 2.3, 1.72, 0.06
p = SProp('prop_umbrella', base=0xffffff)
for i in range(8):
    a0, a1 = i / 8 * TAU + 0.003, (i + 1) / 8 * TAU - 0.003
    prof = []
    for k in range(7):
        r = R * k / 6
        prof.append((r, TOP - (TOP - EDGE) * (r / R) ** 1.5))
    lower = [(r, y - TH) for r, y in reversed(prof)]
    p.lathe(prof + lower, a0=a0, a1=a1, seg=6)
p.paint_fn(lambda q, n: n.y < -0.2, 0xe6e6e6)
p.layer('stick', base=0x8a5a3b)
p.cyl((0, 0.35, 0), 0.03, TOP - 0.3, seg=8, bevel=0.01)
p.tube([(0, 0.4, 0)] + [(0.13 - 0.13 * math.cos(t), 0.4 - 0.13 * math.sin(t) * 1.0, 0) for t in [i / 8 * math.pi for i in range(1, 9)]], 0.045, rseg=8)
p.lathe([(0, 0), (0.06, 0), (0.05, 0.08), (0.025, 0.2), (0, 0.24)], pos=(0, TOP - 0.02, 0), seg=10)
for i in range(8):
    a = i / 8 * TAU
    p.lathe([(0, -0.04), (0.035, -0.035), (0.045, 0), (0.035, 0.035), (0, 0.04)], pos=(R * math.sin(a), EDGE - 0.04, R * math.cos(a)), seg=8)
p.paint_fn(lambda q, n: q.y > TOP - 0.05 or (q.y > EDGE - 0.1 and q.y < EDGE + 0.02 and math.hypot(q.x, q.z) > R - 0.06), 0xfffaf0)
p.layer('skin')
p.extras['outline'] = 0.022
p.build()
