"""Seed packet (Grow a flower). A puffy paper packet 0.95 wide x 1.15 tall standing on the ground, with a crimped top,
a sky-blue picture window holding a big red flower (yellow middle, green stem and leaf) and a few seeds printed below."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop

PAPER, PAPER_D, CRIMP = 0xfff1c9, 0xf0dca6, 0xffd23f
SKY, RED, YEL, GRN, SEED = 0xa8dcff, 0xff5a5a, 0xffd23f, 0x4fb84a, 0x8a5a34
W2, H2, D2 = 0.46, 0.5, 0.13
p = Prop('prop_seedbag', base=PAPER, target_faces=2400, voxel=0.012)
p.box((0, 0.52, 0), (W2, H2 - 0.02, D2), bevel=0.1)
p.blob((0, 0.55, 0), (W2 - 0.08, H2 - 0.12, D2 + 0.05), group='puff')            # a little pillowy
p.paint_fn(lambda q, n: q.z < -0.05, PAPER_D)

# crimped top: a zig-zag strip of teeth
p.layer('crimp', base=CRIMP, target_faces=700, voxel=0.01)
p.box((0, 1.05, 0), (W2 + 0.01, 0.06, 0.06), bevel=0.03)
for i in range(9):
    x = -W2 + 0.05 + i * (2 * W2 - 0.1) / 8
    p.blob((x, 1.12, 0), (0.055, 0.05, 0.05), rot=(0, 0, 45), group='t%d' % i)

# picture: a sky window with a flower (stickers stacked on the front)
FZ = D2 + 0.085
p.layer('pic', base=SKY, target_faces=1600, voxel=0.009)
p.box((0, 0.6, FZ - 0.02), (0.34, 0.3, 0.02), bevel=0.06)
p.paint_fn(lambda q, n: q.y < 0.4, 0x8fd06a)                                       # grass strip
p.layer('petals', base=RED, target_faces=700, voxel=0.007)
for k in range(5):
    a = math.pi / 2 + k * math.tau / 5
    p.blob((0.115 * math.cos(a), 0.69 + 0.115 * math.sin(a), FZ + 0.01), (0.07, 0.07, 0.02), group='petal%d' % k)
p.layer('mid', base=YEL, target_faces=200, voxel=0.007)
p.blob((0, 0.69, FZ + 0.03), (0.06, 0.06, 0.02), group='mid')
p.layer('stem', base=GRN, target_faces=400, voxel=0.007)
p.box((0, 0.48, FZ), (0.02, 0.13, 0.012), bevel=0.01)
p.blob((0.075, 0.47, FZ + 0.005), (0.075, 0.032, 0.012), rot=(0, 0, 25), group='leaf')
                     # grass strip

p.layer('seeds', base=SEED, target_faces=300, voxel=0.008)
for i, x in enumerate((-0.2, 0, 0.2)):
    p.blob((x, 0.18, D2 + 0.06), (0.035, 0.05, 0.02), rot=(0, 0, 20 - i * 20), group='s%d' % i)
p.layer('skin')
p.bone('body', (0, 0, 0), (0, 1.1, 0))
p.extras['outline'] = 0.018
p.build()
