"""Brick letters picture: N is for Nest. A cosy round twig nest (about 2.2 wide, 0.8 tall) with criss-cross twigs
round the rim and three pale blue speckled eggs peeking out. Origin = bottom centre."""
import sys, os, math, random
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

NEST, NEST_D, TWIG, TWIG_L, EGG, FRECK = 0xb07a45, 0x8a5a30, 0x9a6a3a, 0xc99a5e, 0xa8dcf5, 0x6fb0d8
p = Prop('prop_word_nest', base=NEST, target_faces=3600, voxel=0.016)
# a thick bowl wall (closed cross-section loop)
p.lathe(rounded([(0.55, 0.05), (0.95, 0.12), (1.1, 0.42), (1.05, 0.72), (0.85, 0.7), (0.8, 0.45), (0.55, 0.3), (0.0, 0.28), (0.0, 0.05)], 0.12, n=3), seg=56)
p.paint_fn(lambda q, n: n.y > 0.3 and math.hypot(q.x, q.z) < 0.82, NEST_D)
random.seed(4)
p.layer('twigs', base=TWIG, target_faces=2600, voxel=0.01)
for k in range(26):
    a = k / 26 * math.tau + random.uniform(-0.1, 0.1)
    y = random.uniform(0.25, 0.7)
    r = 1.05 + random.uniform(-0.05, 0.05)
    da = random.uniform(0.35, 0.55) * (1 if k % 2 else -1)
    dy = random.uniform(-0.18, 0.18)
    p0 = (math.sin(a) * r, y, math.cos(a) * r)
    p1 = (math.sin(a + da) * (r + 0.04), y + dy, math.cos(a + da) * (r + 0.04))
    mid = ((p0[0] + p1[0]) / 2 * 1.04, (p0[1] + p1[1]) / 2 + 0.03, (p0[2] + p1[2]) / 2 * 1.04)
    p.tube([p0, mid, p1], 0.035, rseg=6)
p.paint_fn(lambda q, n: (int((math.atan2(q.x, q.z) + 4) * 7) % 3) == 0, TWIG_L)
egg = rounded([(0, 0.0), (0.2, 0.03), (0.28, 0.17), (0.27, 0.33), (0.18, 0.5), (0, 0.56)], 0.06, n=3)
# three eggs, each its own mesh so they stay three distinct eggs with their own ink line
# (spaced so no two eggs touch: widest radius 0.33, centres >= 0.68 apart)
for i, (x, z, rz) in enumerate([(0.0, -0.42, 0), (-0.41, 0.13, 14), (0.41, 0.13, -14)]):
    p.layer('egg%d' % i, base=EGG, target_faces=700, voxel=0.01)
    p.lathe([(a * 1.18, b * 1.18) for a, b in egg], pos=(x, 0.33 + (0.07 if i == 0 else 0), z), rot=(0, 0, rz), seg=28)
    for j, (dx, dy) in enumerate([(-0.08, 0.95), (0.07, 0.78), (0.1, 1.05)]):
        p.decal('fr%d%d' % (i, j), (x + dx, dy + (0.08 if i == 0 else 0)), (0.045, 0.035, 0.12), FRECK)
p.layer('skin')
p.bone('body', (0, 0, 0), (0, 0.9, 0))
p.extras['outline'] = 0.024
p.build()
