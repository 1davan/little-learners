"""Garden-party rug (Share the snacks, Level 3): a big soft oval crochet rug, 14 wide x 7.4 deep, top at y ~0.07.
A lilac body, a cream band and a pink inner band (each its own raised ring with a clean ink edge), a scalloped pink
border of soft round bobbles, and a ring of small yellow flower dots in the cream band."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop

LILAC, CREAM, PINK, YEL, PINK_D = 0xb08cff, 0xfff1dc, 0xff9fc8, 0xffd23f, 0xf07fb0
A, B = 6.7, 3.4   # body half-sizes (x, z)
p = Prop('prop_partyrug', base=LILAC, target_faces=9000, voxel=0.03, smooth=2)
p.quadriflow = True
p.lathe([(0, 0.0), (1.0, 0.0), (1.0, 0.055), (0, 0.055)], scale=(A, B), seg=96)


def band(name, col, r0, r1, h=0.08, tf=3000):
    p.layer(name, base=col, target_faces=tf, voxel=0.025)
    p.lathe([(r0, 0.02), (r1, 0.02), (r1, h), (r0, h)], scale=(A, B), seg=120, closed=True)
band('cream', CREAM, 0.74, 0.86)
band('pink', PINK, 0.52, 0.58)

# scalloped border: soft bobbles all round the edge
p.layer('scallop', base=PINK, target_faces=5000, voxel=0.025)
N = 64
for i in range(N):
    a = i / N * math.tau
    x, z = (A + 0.1) * math.sin(a), (B + 0.1) * math.cos(a)
    p.blob((x, 0.05, z), (0.26, 0.07, 0.26), group='s%d' % i)
# little flower dots round the cream band
p.layer('dots', base=YEL, target_faces=1600, voxel=0.015)
M = 28
for i in range(M):
    a = (i + 0.5) / M * math.tau
    x, z = 0.8 * A * math.sin(a), 0.8 * B * math.cos(a)
    p.blob((x, 0.085, z), (0.09, 0.022, 0.09), group='d%d' % i)
p.layer('skin')
p.bone('body', (0, -0.1, 0), (0, 0.2, 0))
p.extras['outline'] = 0.016
p.build()
