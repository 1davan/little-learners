"""A clump of three wheat stalks (farm scenery wheat rows; tinted per season: heads painted white, stalks light grey).
About 1.2 tall, base at the origin. Each ear is a column of plump grains with a few whiskers."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from skit import SProp

HEAD, STALK, LEAF = 0xffffff, 0xc9c9b0, 0xb5c49a
p = SProp('prop_wheat', base=HEAD)
STALKS = [((-0.12, 0, 0.02), (-0.2, 1.05, 0.0), 0.12), ((0.02, 0, -0.04), (0.04, 1.22, -0.02), 0.0), ((0.13, 0, 0.05), (0.22, 0.98, 0.06), -0.14)]
for (b, t, lean) in STALKS:
    p.tube([b, ((b[0] + t[0]) / 2, t[1] * 0.5, (b[2] + t[2]) / 2), t], 0.036, rseg=8)
    # the ear: an elongated, slightly zig-zag spindle (reads as stacked grains)
    prof = [(0, 0)]
    for i in range(1, 16):                       # fat ear: a column of plump grain bumps
        u = i / 16
        r = 0.105 * math.sin(math.pi * min(1, u * 1.1)) ** 0.6 * (1.0 if i % 2 else 0.8)
        prof.append((r, 0.5 * u))
    prof.append((0, 0.52))
    p.lathe(prof, pos=t, rot=(0, 0, math.degrees(lean)), seg=10)
    c, s_ = math.cos(lean), math.sin(lean)
    top = (t[0] - s_ * 0.5, t[1] + c * 0.5, t[2])
    for w in (-0.05, 0.0, 0.05):
        p.tube([top, (top[0] - s_ * 0.16 + w, top[1] + 0.16, top[2])], 0.013, rseg=5)
p.paint_fn(lambda q, n: q.y < 0.97 and not (q.y > 0.9 and abs(q.x) > 0.17), STALK)
# a leaf curling off the middle stalk
p.lathe([(0, 0), (0.05, 0.05), (0.055, 0.3), (0.0, 0.55)], pos=(0.03, 0.35, -0.02), rot=(0, 0, -55), seg=10, scale=(1, 0.35))
p.paint_fn(lambda q, n: 0.3 < q.y < 0.8 and q.x > 0.06 and q.y < 0.35 + (q.x - 0.03) * 1.6, LEAF)
p.extras['outline'] = 0.018
p.build()
