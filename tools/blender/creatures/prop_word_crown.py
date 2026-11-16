"""Brick letters picture: Q is for Queen's crown. A shiny gold crown (about 1.7 wide, 1.5 tall): a round band with
five tall points topped by pearls, red velvet puffing up inside, and red, blue and green gems round the band.
Origin = bottom centre."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

GOLD, GOLD_D, GOLD_L, VELVET, VELVET_L, PEARL = 0xffc21a, 0xe09a10, 0xffe27a, 0xd8283c, 0xff5a68, 0xfff8ee
p = Prop('prop_word_crown', base=GOLD, target_faces=4000, voxel=0.013)
R = 0.78
p.lathe(rounded([(R - 0.1, 0.0), (R + 0.04, 0.0), (R + 0.06, 0.5), (R - 0.06, 0.5)], 0.04, n=2), seg=64, closed=True)
for k in range(5):
    a = k / 5 * math.tau
    for t in range(6):
        u = t / 5
        rr = R - 0.02 - u * 0.08
        p.blob((math.sin(a) * rr, 0.48 + u * 0.82, math.cos(a) * rr), (0.21 * (1 - u * 0.78), 0.13, 0.06 + 0.02 * (1 - u)), rot=(0, math.degrees(a), 0), group='pt%d' % k)
p.paint_fn(lambda q, n: q.y < 0.1 or (0.4 < q.y < 0.5), GOLD_D)
p.paint_fn(lambda q, n: 0.15 < q.y < 0.22, GOLD_L)
p.layer('velvet', base=VELVET, target_faces=1200, voxel=0.014)
p.blob((0, 0.55, 0), (0.7, 0.4, 0.7))
p.paint('vl', (-0.3, 0.85, 0.35), (0.22, 0.1, 0.2), VELVET_L)
p.layer('pearls', base=PEARL, target_faces=900, voxel=0.009)
for k in range(5):
    a = k / 5 * math.tau
    rr = R - 0.1
    p.blob((math.sin(a) * (rr - 0.04), 1.42, math.cos(a) * (rr - 0.04)), (0.11, 0.11, 0.11), group='pe%d' % k)
p.blob((0, 1.0, 0), (0.12, 0.12, 0.12), group='top')
p.layer('gems', base=0xff3a4a, target_faces=900, voxel=0.009)
GEMS = [0xff3a4a, 0x3f8cff, 0x4cc75a, 0x3f8cff, 0x4cc75a]
for k in range(5):
    a = k / 5 * math.tau
    p.blob((math.sin(a) * (R + 0.07), 0.27, math.cos(a) * (R + 0.07)), (0.1, 0.13, 0.05), rot=(0, math.degrees(a), 0), group='gm%d' % k)
    p.paint('gc%d' % k, (math.sin(a) * (R + 0.07), 0.27, math.cos(a) * (R + 0.07)), (0.2, 0.2, 0.2), GEMS[k])
p.layer('skin')
p.bone('body', (0, 0, 0), (0, 1.3, 0))
p.extras['outline'] = 0.022
p.build()
