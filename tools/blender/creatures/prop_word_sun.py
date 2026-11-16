"""Brick letters picture: S is for Sun. A happy round sun (about 2.4 across with its rays): a plump golden face disc
with rosy cheeks and a code face, ringed by twelve soft triangular rays in alternating orange and yellow.
Bones body + head (the whole sun) so it can beam at you. Origin = bottom of the lowest ray."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop

SUN, SUN_D, RAY, RAY2, CHEEK = 0xffd23a, 0xf2b81e, 0xffa22e, 0xffc23a, 0xff9a7a
p = Prop('prop_word_sun', base=SUN, target_faces=3600, voxel=0.014)
CY = 1.2
p.blob((0, CY, 0), (0.74, 0.74, 0.5))
p.paint_fn(lambda q, n: n.z < -0.45, SUN_D)
for s in (-1, 1):
    p.decal('ck%d' % s, (s * 0.38, CY - 0.18), (0.13, 0.09, 0.2), CHEEK)
p.layer('rays', base=RAY, target_faces=2200, voxel=0.012)
for k in range(12):
    a = k / 12 * math.tau + math.pi / 2
    L = 0.42 if k % 2 == 0 else 0.3
    for t in range(5):
        u = t / 4
        r = 0.72 + u * L
        w = 0.17 * (1 - u * 0.8) + 0.02
        p.blob((math.cos(a) * r, CY + math.sin(a) * r, 0), (w, 0.08, 0.13 * (1 - u * 0.5) + 0.03), rot=(0, 0, math.degrees(a) - 90), group='r%d' % k)
for k in range(12):
    a = k / 12 * math.tau + math.pi / 2
    if k % 2:
        p.paint('rc%d' % k, (math.cos(a) * 0.95, CY + math.sin(a) * 0.95, 0), (0.3, 0.3, 0.4), RAY2)
p.layer('skin')
p.bone('body', (0, 0, 0), (0, 0.4, 0), region=lambda q: False)
p.bone('head', (0, 0.4, 0), (0, 2.3, 0), parent='body')
p.face(center=(0, CY + 0.05, 0.0), radius=0.6, faceScale=1.0)
p.extras['outline'] = 0.024
p.build()
