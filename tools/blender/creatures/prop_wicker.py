"""Wicker basket full of straw (Share the snacks, Apple count, Peekaboo pots cover, the hedgehog's basket). Top radius
1.5, bottom 1.1, rim at y 1.0; the straw bed inside is at y 0.62 where the fruit lands. A warm woven body with three
clean raised weave bands (their own ink edges), a chunky braided rim with the two side handles (layer 'braid') and a
soft straw lining (layer 'straw'); the layer names stay as the games expect (pots hides braid and straw)."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

WEAVE, BAND, BRAID, STRAW = 0xdeac6c, 0xa86f3a, 0xc08648, 0xf2d06a
R, RB, H, T = 1.5, 1.1, 1.0, 0.1
p = Prop('prop_wicker', base=WEAVE, target_faces=4200, voxel=0.02)
p.lathe(rounded([(0, 0), (RB, 0), (R, H - 0.04), (R - T, H - 0.04), (RB - T * 0.8, 0.12), (0, 0.12)], 0.06, n=4), seg=64)
r_at = lambda y: RB + (R - RB) * y / H

# three raised weave bands
p.layer('bands', base=BAND, target_faces=2400, voxel=0.016)
for y in (0.2, 0.45, 0.7):
    r0 = r_at(y) - 0.03
    p.lathe([(r0, y - 0.055), (r_at(y - 0.055) + 0.035, y - 0.055), (r_at(y + 0.055) + 0.035, y + 0.055), (r0 + 0.02, y + 0.055)], seg=96, closed=True)

p.layer('braid', base=BRAID, target_faces=2400, voxel=0.016)
for ph in (0, math.pi):
    pts = []
    for i in range(121):
        a = i / 120 * math.tau
        rr = R - T / 2 + 0.05 * math.cos(a * 18 + ph)
        pts.append((rr * math.sin(a), H - 0.01 + 0.05 * math.sin(a * 18 + ph), rr * math.cos(a)))
    p.tube(pts[:-1], 0.075, closed=True, rseg=8)
for s in (-1, 1):
    p.tube([(s * (R - 0.02), H - 0.25, -0.32)] + [(s * (R + 0.2 * math.sin(math.radians(a))), H - 0.25 + 0.3 * math.sin(math.radians(a)), -0.32 * math.cos(math.radians(a))) for a in range(15, 166, 15)] + [(s * (R - 0.02), H - 0.25, 0.32)], 0.065, rseg=8)

p.layer('straw', base=STRAW, target_faces=1600, voxel=0.02)
r_in = lambda y: (RB - T * 0.8) + (R - T - (RB - T * 0.8)) * (y - 0.12) / (H - 0.16) - 0.03
p.lathe(rounded([(0, 0.1), (r_in(0.12), 0.1), (r_in(0.58), 0.56), (0, 0.6)], 0.05, n=3), seg=48)
for i in range(16):
    a = i * 2.4
    rr = 0.35 + (i % 4) * 0.25
    p.blob((rr * math.sin(a), 0.58, rr * math.cos(a)), (0.3, 0.06, 0.13), rot=(0, math.degrees(a) + 40, 0), group='tufts')
p.layer('skin')
p.bone('body', (0, 0, 0), (0, H, 0))
p.extras['outline'] = 0.028
p.build()
