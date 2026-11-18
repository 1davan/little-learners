"""Brick letters picture: A is for Apple. A big shiny red apple (about 1.8 wide, 2.1 tall with the stem): wider at the
shoulders than the base, soft dimples top and bottom, a curved brown stem, a green leaf with a pale vein and a white
shine on the upper left. Origin = bottom centre."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

RED, RED_D, RED_L = 0xff4040, 0xd92f3a, 0xff7060
STEM, LEAF, LEAF_L = 0x7a4a2a, 0x4cc75a, 0x9be86f
p = Prop('prop_word_apple', base=RED, target_faces=2500, voxel=0.014)
prof = [(0, 0.1), (0.3, 0.03), (0.62, 0.1), (0.86, 0.32), (0.97, 0.66), (0.98, 0.98), (0.9, 1.26), (0.7, 1.46), (0.44, 1.54), (0.2, 1.44), (0, 1.36)]
p.lathe(rounded(prof, 0.2, n=5), seg=56)
p.paint_fn(lambda q, n: q.y < 0.42 and n.y < 0.2, RED_D)                       # a deeper red underneath
p.paint('blush', (-0.45, 1.05, 0.55), (0.42, 0.34, 0.5), RED_L, rot=(0, 0, 30))  # a sunny blush on the upper left
# stem and leaf
p.layer('stem', base=STEM, target_faces=500, voxel=0.01)
p.tube([(0, 1.3, 0), (0.0, 1.55, 0), (0.05, 1.75, 0), (0.13, 1.9, 0.0)], [0.085, 0.08, 0.07, 0.065], rseg=10)
p.layer('leaf', base=LEAF, target_faces=900, voxel=0.008)
# a real little leaf: a pointed oval folded along its centre (a crease you can see), curving down at the tip
import mathutils
LR = mathutils.Euler((math.radians(-62), math.radians(-12), math.radians(22))).to_matrix()   # face toward us, pointing up and right
NU, NV, TH = 14, 6, 0.03
def lsurf(u, v, side):
    hw = 0.26 * math.sin(math.pi * min(1.0, u * 1.03) ** 0.8) + 0.008
    x = 0.8 * u
    y = -0.12 * u * u + 0.07 * abs(v)            # folded up along the crease, drooping at the tip
    z = v * hw
    w = LR @ mathutils.Vector((x, y + side * TH, z))
    return (0.1 + w.x, 1.7 + w.y, 0.08 + w.z)
lv, lf = [], []
for side in (-1, 1):
    for i in range(NU + 1):
        for j in range(NV + 1):
            lv.append(lsurf(i / NU, -1 + 2 * j / NV, side))
W = NV + 1; off = (NU + 1) * W
for i in range(NU):
    for j in range(NV):
        a_, b_, c_, d_ = i * W + j, i * W + j + 1, (i + 1) * W + j + 1, (i + 1) * W + j
        lf.append((a_, b_, c_, d_)); lf.append((off + a_, off + d_, off + c_, off + b_))
for i in range(NU):
    for j in (0, NV):
        a_, d_ = i * W + j, (i + 1) * W + j
        lf.append((a_, off + a_, off + d_, d_) if j == 0 else (a_, d_, off + d_, off + a_))
for j in range(NV):
    lf.append((j, off + j, off + j + 1, j + 1)); a_ = NU * W + j; lf.append((a_, a_ + 1, off + a_ + 1, off + a_))
p.mesh(lv, lf)
p.paint_fn(lambda q, n: n.y < -0.3, 0x36a849)
# the shine
p.layer('shine', base=0xffffff, target_faces=300, voxel=0.008)
p.blob((-0.38, 1.12, 0.87), (0.12, 0.2, 0.05), rot=(-8, -23, 22), group='s1')
p.blob((-0.2, 1.4, 0.82), (0.055, 0.055, 0.04), rot=(-25, -14, 0), group='s2')
p.layer('skin')
p.bone('body', (0, 0, 0), (0, 1.6, 0))
p.extras['outline'] = 0.024
p.build()
