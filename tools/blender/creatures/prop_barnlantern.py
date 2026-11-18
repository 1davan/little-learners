"""A barn lantern hung on the wall (Share the snacks, Level 2). Origin = where the bracket meets the wall; the lantern hangs
0.42 in front of it. About 0.95 tall: a curled iron bracket, a ring handle, a dark domed cap, a warm glowing glass body
with four thin cage bars, and a round base."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

IRON, GLASS, GLOW, BRASS = 0x3e3440, 0xffe08a, 0xfff3c4, 0xc98b4f
Z = 0.42
p = Prop('prop_barnlantern', base=GLASS, target_faces=1400, voxel=0.01)
# the glass: a soft barrel
p.lathe(rounded([(0, -0.62), (0.17, -0.62), (0.22, -0.45), (0.2, -0.24), (0.15, -0.2), (0, -0.2)], 0.04, n=3), pos=(0, 0, Z), seg=40)
p.paint_fn(lambda q, n: math.hypot(q.x, q.z - Z) < 0.2 and -0.52 < q.y < -0.3 and n.z > 0.2 and abs(q.x) < 0.09, GLOW)

p.layer('iron', base=IRON, target_faces=1800, voxel=0.01)
p.lathe(rounded([(0, -0.2), (0.2, -0.2), (0.12, -0.08), (0.05, -0.04), (0, -0.04)], 0.03, n=3), pos=(0, 0, Z), seg=36)   # cap
p.lathe(rounded([(0, -0.72), (0.2, -0.72), (0.22, -0.64), (0.18, -0.6), (0, -0.6)], 0.02, n=3), pos=(0, 0, Z), seg=36)  # base
for k in range(4):
    a = k / 4 * math.tau + math.pi / 4
    pts = [(0.215 * math.sin(a) * f, y, Z + 0.215 * math.cos(a) * f) for f, y in ((0.9, -0.62), (1.02, -0.45), (0.94, -0.24), (0.75, -0.2))]
    p.tube(pts, 0.018, rseg=6)
p.ring((0, 0.04, Z), 0.08, 0.02, rot=(90, 0, 0), rseg=6)   # handle ring
# the bracket: a bar out from the wall with a little curl underneath
p.tube([(0, 0.13, 0.0), (0, 0.13, Z * 0.6), (0, 0.12, Z), (0, 0.08, Z + 0.03)], 0.03, rseg=8)
p.tube([(0, -0.25, 0.0), (0, -0.1, 0.12), (0, 0.04, 0.24), (0, 0.11, 0.3)], 0.022, rseg=8)
p.box((0, -0.05, 0.02), (0.07, 0.24, 0.025), bevel=0.012)   # wall plate
p.layer('skin')
p.bone('body', (0, -0.75, Z), (0, 0.15, Z))
p.extras['outline'] = 0.012
p.build()
