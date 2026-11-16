"""Home icon for Barn band: a red toy drum (radius 1.0, 0.95 tall) with gold rims, cream zig-zag cords, a cream drum
skin with a soft centre ring, and two drumsticks with red ball tips resting crossed on the top."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

RED, RED_D, GOLD, CORD, SKIN, WOOD = 0xe0533f, 0xb93a2c, 0xffd23f, 0xfff6e6, 0xfff3dc, 0xe8b070
H = 0.95
p = Prop('prop_icon_drum', base=RED, target_faces=2400, voxel=0.018)
p.lathe(rounded([(0, 0.02), (0.95, 0.02), (1.0, H - 0.03), (0, H - 0.03)], 0.03, n=2), seg=56)
p.paint_fn(lambda q, n: n.y > 0.7, SKIN)

p.layer('rims', base=GOLD, target_faces=1100, voxel=0.014)
for y, r in ((0.08, 0.972), (H - 0.06, 1.018)):
    p.ring((0, y, 0), r, 0.07, seg=64, rseg=8)
p.paint_fn(lambda q, n: n.y < -0.5, 0xe8a317)

p.layer('cords', base=CORD, target_faces=900, voxel=0.012)
N = 10
pts = []
for i in range(N * 2):
    a = i / (N * 2) * math.tau
    y = 0.2 if i % 2 == 0 else H - 0.18
    r = 0.955 + 0.045 * y / H + 0.02
    pts.append((r * math.sin(a), y, r * math.cos(a)))
p.tube(pts, 0.03, closed=True, rseg=6)

p.layer('head', base=SKIN, target_faces=900, voxel=0.012)
p.lathe(rounded([(0, H - 0.05), (0.96, H - 0.05), (0.95, H + 0.0), (0.5, H + 0.035), (0, H + 0.04)], 0.02, n=2), seg=56)
p.paint_fn(lambda q, n: 0.32 < math.hypot(q.x, q.z) < 0.4 and n.y > 0.5, 0xf2dcb4)

p.layer('sticks', base=WOOD, target_faces=1000, voxel=0.012)
STX = []
# two sticks crossed in an X, their butts resting on the back of the skin, ball tips raised toward the viewer
for s, dz in ((-1, 0.04), (1, -0.04)):
    a0 = (s * 0.45, H + 0.06, -0.42 + dz)
    a1 = (-s * 0.48, H + 0.62, 0.32 + dz)
    p.tube([a0, a1], [0.045, 0.036], rseg=8)
    d = [a1[i] - a0[i] for i in range(3)]
    L = math.sqrt(sum(v * v for v in d))
    tip = tuple(a1[i] + d[i] / L * 0.07 for i in range(3))
    p.blob(tip, (0.1, 0.1, 0.1), group='tip%d' % s)
    STX.append(tip)
for k, t in enumerate(STX):
    p.paint('tip%d' % k, t, (0.13, 0.13, 0.13), 0xff5a5a)
p.layer('skin')
p.bone('body', (0, 0, 0), (0, 1.0, 0))
p.extras['outline'] = 0.026
p.build()
