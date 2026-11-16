"""Brick letters picture: E is for Egg. A big smooth egg (1.7 wide, 2.2 tall), creamy white with a few soft freckles,
a warm shadow at the base and a shine. Origin = bottom centre."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

SHELL, SHELL_D, FRECK = 0xfff4e0, 0xf1dcbc, 0xd9b48a
p = Prop('prop_word_egg', base=SHELL, target_faces=3000, voxel=0.014)
prof = [(0, 0.0), (0.45, 0.05), (0.72, 0.25), (0.85, 0.6), (0.84, 0.98), (0.72, 1.4), (0.5, 1.82), (0.25, 2.08), (0, 2.16)]
p.lathe(rounded(prof, 0.15, n=5), seg=56)
p.paint_fn(lambda q, n: q.y < 0.32, SHELL_D)
for i, (x, y, s) in enumerate([(0.3, 1.5, 0.06), (-0.22, 1.2, 0.05), (0.45, 0.85, 0.045), (-0.5, 0.7, 0.05), (0.1, 0.55, 0.04), (-0.08, 1.75, 0.035), (0.6, 1.25, 0.035)]):
    p.decal('f%d' % i, (x, y), (s, s * 0.8, 0.2), FRECK)
p.layer('shine', base=0xffffff, target_faces=300, voxel=0.008)
p.blob((-0.34, 1.42, 0.6), (0.1, 0.22, 0.045), rot=(-12, -30, 15), group='s1')
p.layer('skin')
p.bone('body', (0, 0, 0), (0, 2.1, 0))
p.extras['outline'] = 0.024
p.build()
