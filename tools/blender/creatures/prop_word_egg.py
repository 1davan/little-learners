"""Brick letters picture: E is for Egg. A big smooth egg (1.7 wide, 2.2 tall), creamy white with a few round soft
freckles, a warm shadow at the base and a clean shine painted on the shell (no outline round it). Origin = bottom
centre."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import rounded
from skit import SProp

SHELL, SHELL_D, FRECK, SHINE = 0xfff4e0, 0xf1dcbc, 0xd9b48a, 0xffffff
p = SProp('prop_word_egg', hard=True, base=SHELL, target_faces=5000)
prof = [(0, 0.0), (0.45, 0.05), (0.72, 0.25), (0.85, 0.6), (0.84, 0.98), (0.72, 1.4), (0.5, 1.82), (0.25, 2.08), (0, 2.16)]
pr = rounded(prof, 0.15, n=5)
# resample the profile finely so the paint cuts are round
fine = []
for i in range(len(pr) - 1):
    a, b = pr[i], pr[i + 1]
    for k in range(1):
        t = k / 1
        fine.append((a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t))
fine.append(pr[-1])
fine[0] = (0, 0.0); fine[-1] = (0, 2.16)
p.lathe(fine, seg=44)
p.paint_fn(lambda q, n: q.y < 0.3, SHELL_D)
for (x, y, r) in [(0.3, 1.5, 0.07), (-0.22, 1.2, 0.06), (0.45, 0.85, 0.055), (-0.5, 0.72, 0.06), (0.1, 0.55, 0.05), (-0.06, 1.78, 0.045), (0.58, 1.22, 0.045)]:
    p.paint_fn(lambda q, n, x=x, y=y, r=r: q.z > 0.2 and (q.x - x) ** 2 + (q.y - y) ** 2 < r * r, FRECK)
# the shine: a tilted soft oval and a little dot above it
p.paint_fn(lambda q, n: q.z > 0.35 and ((q.x + 0.36) * 0.94 + (q.y - 1.42) * 0.34) ** 2 / 0.012 + ((q.y - 1.42) * 0.94 - (q.x + 0.36) * 0.34) ** 2 / 0.05 < 1, SHINE)
p.paint_fn(lambda q, n: q.z > 0.3 and (q.x + 0.18) ** 2 + (q.y - 1.76) ** 2 < 0.045 ** 2, SHINE)
p.bone('body', (0, 0, 0), (0, 2.1, 0))
p.extras['outline'] = 0.024
p.build()
