"""Rubber duck (Splash wash tub, Bear's nose toys). Faces +x; origin under its middle; about 1.0 long and 0.95 tall.
A plump yellow body with a perky tail, a big round head, a flat orange bill, wing bumps and shiny eyes on both sides."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop

YEL, YEL_D, BILL, INK = 0xffd23f, 0xf2b52a, 0xff9f3f, 0x3a2838
p = Prop('prop_duckie', base=YEL, target_faces=1400, voxel=0.014, smooth=4)
p.blob((-0.04, 0.26, 0), (0.46, 0.26, 0.36), group='body')
p.blob((-0.42, 0.4, 0), (0.12, 0.13, 0.12), rot=(0, 0, 35), group='body')          # tail
p.blob((0.22, 0.66, 0), (0.25, 0.25, 0.24), group='head')
p.blob((0.12, 0.47, 0), (0.17, 0.14, 0.17), group='head')
for s in (-1, 1):
    p.blob((-0.08, 0.32, s * 0.33), (0.2, 0.1, 0.05), rot=(0, 0, -15), group='wing%d' % s)
p.paint_fn(lambda q, n: q.y < 0.07, YEL_D)
p.layer('bill', base=BILL, target_faces=300, voxel=0.01)
p.blob((0.48, 0.6, 0), (0.12, 0.05, 0.12), group='bill')
p.blob((0.46, 0.56, 0), (0.1, 0.035, 0.1), group='bill')
p.layer('eyes', base=INK, target_faces=160, voxel=0.008)
for s in (-1, 1):
    p.blob((0.33, 0.72, s * 0.17), (0.045, 0.06, 0.035), rot=(0, s * 35, 0), group='e%d' % s)
p.layer('shine', base=0xffffff, target_faces=60, voxel=0.006)
for s in (-1, 1):
    p.blob((0.345, 0.745, s * 0.195), (0.015, 0.015, 0.01), group='h%d' % s)
p.layer('skin')
p.bone('root', (0, 0, 0), (0, 0.9, 0))
p.extras['outline'] = 0.018
p.build()
