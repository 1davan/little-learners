"""Toy drum shell (tintable). Unit size radius 1.0 x height 1.0 (the game scales to r, h); gold rims top and bottom,
cream zig-zag cords. The drum head (top skin) stays code-built so the games can flash and squash it."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

p = Prop('prop_drum', base=0xeeeeee, target_faces=2400, voxel=0.018)
p.lathe(rounded([(0, 0.02), (0.95, 0.02), (1.0, 0.98), (0, 0.98)], 0.03, n=2), seg=56)
p.layer('rims', base=0xffd23f, target_faces=1600, voxel=0.014)
for y in (0.08, 0.92):
    p.ring((0, y, 0), (0.952 if y < 0.5 else 0.998) + 0.02, 0.07, seg=64, rseg=8)
p.layer('cords', base=0xfff6e6, target_faces=1400, voxel=0.012)
N = 8
pts = []
for i in range(N * 2 + 1):
    a = i / (N * 2) * math.tau
    y = 0.18 if i % 2 == 0 else 0.82
    r = 0.955 + 0.045 * y + 0.035
    pts.append((r * math.sin(a), y, r * math.cos(a)))
p.tube(pts[:-1], 0.05, closed=True, rseg=10)
p.layer('rims')
for i in range(N * 2):                                    # round studs where the cord turns on the rims
    a = i / (N * 2) * math.tau
    y = 0.12 if i % 2 == 0 else 0.88
    r = (0.952 if y < 0.5 else 0.998) + 0.09
    p.blob((r * math.sin(a), y, r * math.cos(a)), (0.055, 0.055, 0.04), rot=(0, math.degrees(a), 0), group='st%d' % i)
p.layer('skin')
p.bone('body', (0, 0, 0), (0, 1.0, 0))
p.extras['argMode'] = 'tint'
p.extras['argDefault'] = 0xd94f3d
p.extras['outline'] = 0.024
p.build()
