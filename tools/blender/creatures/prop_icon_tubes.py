"""Home icon for Colour tubes: three chunky toy tubes (red, blue, yellow) standing in a wooden rack, each with a ball of
its colour bobbing in the mouth. ~2.3 wide, tubes 1.75 tall, base at y 0."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

WOOD, WOOD_D, WOOD_L = 0xe2a764, 0xc2834a, 0xf0c48a
TUBES = [(-0.76, 0xff5a5a, 0xc93a3a, 0xff9a9a), (0.0, 0x4a90ff, 0x2d64c8, 0x9cc4ff), (0.76, 0xffd23f, 0xd9a520, 0xfff0a0)]
BALL = {0: 0xff6e6e, 1: 0x5c9cff, 2: 0xffdc55}
R, T, Y0, Y1 = 0.3, 0.06, 0.12, 1.62

p = Prop('prop_icon_tubes', base=WOOD, target_faces=1500, voxel=0.016)
# the wooden rack: a chunky rounded block with a bevelled top
p.box((0, 0.19, 0), (1.17, 0.19, 0.44), bevel=0.13)
p.paint_fn(lambda q, n: n.y > 0.6, WOOD_L)
p.paint_fn(lambda q, n: q.y < 0.06, WOOD_D)

# tubes: hollow walls with a rolled lip, own layer so the colour edges are crisp and inked
p.layer('tubes', base=0xffffff, target_faces=2400, voxel=0.014)
for x, c, cd, cl in TUBES:
    wall = rounded([(0, Y0), (R, Y0), (R, Y1), (R - T, Y1), (R - T, Y0 + 0.5), (0, Y0 + 0.5)], 0.03, n=2)
    p.lathe(wall, pos=(x, 0, 0), seg=40)
    p.ring((x, Y1 + 0.005, 0), R - T * 0.4, 0.055, seg=40, rseg=8)
    p.ring((x, 0.42, 0), R + 0.01, 0.045, seg=40, rseg=8)      # collar where the tube sits in the rack


def tube_of(q):
    return min(range(3), key=lambda i: abs(q.x - TUBES[i][0]))


for i, (x, c, cd, cl) in enumerate(TUBES):
    near = lambda q, n, x=x: abs(q.x - x) < 0.38
    p.paint_fn(near, c)
    # inside of the mouth (darker)
    p.paint_fn(lambda q, n, x=x: abs(q.x - x) < 0.38 and math.hypot(q.x - x, q.z) < R - 0.02 and ((n.x * (q.x - x) + n.z * q.z) < 0 or n.y > 0.5) and q.y < Y1 - 0.02, cd)
    # a glossy highlight stripe on the front-left
    def hl(q, n, x=x):
        if abs(q.x - x) > 0.38 or q.y < 0.62 or q.y > Y1 - 0.18:
            return False
        a = math.atan2(q.x - x, q.z)
        return -0.75 < a < -0.42 and math.hypot(q.x - x, q.z) > R - 0.02
    p.paint_fn(hl, cl)
    p.paint_fn(lambda q, n, x=x: abs(q.x - x) < 0.38 and q.y > Y1 - 0.06, cl)       # lighter rolled lip

# balls peeking out of each mouth
p.layer('balls', base=0xffffff, target_faces=1500, voxel=0.012)
for i, (x, c, cd, cl) in enumerate(TUBES):
    p.blob((x, Y1 + 0.2 + (0.08 if i == 1 else 0), 0.0), (0.23, 0.23, 0.23), group='b%d' % i)
for i, (x, c, cd, cl) in enumerate(TUBES):
    p.paint_fn(lambda q, n, x=x: abs(q.x - x) < 0.4, BALL[i])
    p.paint('shine%d' % i, (x - 0.09, Y1 + 0.31 + (0.08 if i == 1 else 0), 0.18), (0.065, 0.055, 0.1), 0xffffff)
p.layer('skin')
p.bone('body', (0, 0, 0), (0, 2.0, 0))
p.extras['outline'] = 0.026
p.build()
