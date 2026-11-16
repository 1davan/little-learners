"""Sand heap with a toy spade stuck in it (Splash wash: where the sand came from). Origin on the beach under the heap:
a soft lumpy mound about 1.9 wide and 0.55 tall with a bucket-shaped turret on top, ripples, two little shells, and a
spade (red handle, yellow blade) stuck in at an angle."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

SAND, SAND_D, SAND_L = 0xe8c787, 0xd2ad66, 0xf4dca4
p = Prop('prop_sandpile', base=SAND, target_faces=1600, voxel=0.018, smooth=4)
p.blob((0, 0.05, 0), (0.95, 0.4, 0.75), group='heap')
p.blob((-0.3, 0.1, 0.2), (0.5, 0.36, 0.45), group='heap')
p.blob((0.35, 0.05, -0.15), (0.5, 0.32, 0.45), group='heap')
p.blob((0, -0.35, 0), (1.4, 0.35, 1.2), group='cut', negative=True)
p.lathe(rounded([(0, 0.35), (0.28, 0.35), (0.24, 0.68), (0, 0.68)], 0.04, n=3), pos=(-0.15, 0, 0.05), seg=24)
for i in range(6):
    a = i / 6 * math.tau
    p.box((-0.15 + 0.22 * math.sin(a), 0.72, 0.05 + 0.22 * math.cos(a)), (0.05, 0.05, 0.05), rot=(0, math.degrees(a), 0), bevel=0.02)
p.paint_fn(lambda q, n: abs(q.y - 0.5) < 0.02 and math.hypot(q.x + 0.15, q.z - 0.05) < 0.3, SAND_D)
p.paint_fn(lambda q, n: q.y < 0.06, SAND_D)
p.paint_fn(lambda q, n: n.y > 0.85 and q.y > 0.3 and math.hypot(q.x + 0.15, q.z - 0.05) > 0.3, SAND_L)
p.layer('shells', base=0xffb6c9, target_faces=200, voxel=0.01)
p.blob((0.45, 0.28, 0.5), (0.09, 0.07, 0.05), rot=(-30, 20, 0), group='s1')
p.blob((-0.6, 0.2, 0.52), (0.07, 0.06, 0.04), rot=(-30, -20, 0), group='s2')
p.paint('s2c', (-0.6, 0.2, 0.52), (0.1, 0.1, 0.1), 0xa8e0ff)
p.layer('blade', base=0xffd23f, target_faces=300, voxel=0.01)
p.quadriflow = False
ang = math.radians(28)
bx, by = 0.55, 0.28
def rot(x, y):
    return (bx + x * math.cos(ang) + y * math.sin(ang), by - x * math.sin(ang) + y * math.cos(ang))
outline = rounded([(-0.15, 0.0), (0.15, 0.0), (0.13, -0.26), (0, -0.36), (-0.13, -0.26)], 0.06, n=3, closed=True)
poly = [rot(x, y) for x, y, *_ in outline]
cx, cy = rot(0, -0.15)
m = len(poly)
verts = []
for d in (-0.025, 0.025):
    verts.append((cx, cy, 0.05 + d))
    verts += [(x, y, 0.05 + d) for x, y in poly]
k = m + 1
faces = []
for i in range(m):
    j = (i + 1) % m
    faces += [(0, 1 + j, 1 + i), (k, k + 1 + i, k + 1 + j), (1 + i, 1 + j, k + 1 + j, k + 1 + i)]
p.mesh(verts, faces)
p.layer('handle', base=0xff5a5a, target_faces=300, voxel=0.01)
p.quadriflow = False
a0 = rot(0, 0.0); a1 = rot(0, 0.62)
p.tube([(a0[0], a0[1], 0.05), (a1[0], a1[1], 0.05)], 0.035, rseg=8)
g0 = rot(-0.1, 0.62); g1 = rot(0.1, 0.62)
p.tube([(g0[0], g0[1], 0.05), (g1[0], g1[1], 0.05)], 0.045, rseg=8)
p.layer('skin')
p.bone('root', (0, 0, 0), (0, 0.8, 0))
p.extras['outline'] = 0.018
p.build()
