"""Sand heap with a toy spade stuck in it (Splash wash: where the sand came from). Origin on the beach under the heap:
a lumpy slumped sand heap about 1.9 wide and 0.5 tall with a scalloped wet-sand foot, a bucket-moulded castle turret
on top (four chunky merlons, a dark arched door), two shells pressed into the side (layer 'shells'), and a toy spade
stuck in at a jaunty angle with its yellow blade showing (layer 'blade') on a red shaft with a T grip (layer 'handle')."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

SAND, SAND_D, SAND_L, WET = 0xeccb8a, 0xd8b26c, 0xf6e0ae, 0xcfa462
p = Prop('prop_sandpile', base=SAND, target_faces=3200, voxel=0.014, smooth=4)
# slumped heap: a broad base, a middle hump, a few lumps that slid down the sides
p.blob((0, 0.0, 0), (0.98, 0.3, 0.78), group='heap', stiffness=1.8)
p.blob((-0.08, 0.18, 0.0), (0.62, 0.3, 0.52), group='heap', stiffness=1.8)
for x, z, r in ((0.62, 0.32, 0.26), (-0.66, 0.28, 0.24), (0.3, -0.5, 0.28), (-0.45, -0.42, 0.25), (0.05, 0.55, 0.22)):
    p.blob((x, 0.06, z), (r * 1.2, r * 0.6, r), group='heap', stiffness=1.8)
p.blob((0, -0.4, 0), (1.6, 0.4, 1.3), group='heap', negative=True)
# bucket-moulded turret: slightly tapered drum with four merlons
TX, TZ, TY = -0.12, 0.02, 0.36
p.lathe(rounded([(0, TY), (0.3, TY), (0.255, TY + 0.36), (0, TY + 0.36)], 0.035, n=3), pos=(TX, 0, TZ), seg=32)
for i in range(4):
    a = i / 4 * math.tau + math.pi / 4
    p.box((TX + 0.2 * math.sin(a), TY + 0.41, TZ + 0.2 * math.cos(a)), (0.075, 0.06, 0.06), rot=(0, math.degrees(a), 0), bevel=0.025)


def door(q, n):
    dx, dy = q.x - TX, q.y - TY
    return q.z > TZ + 0.15 and n.z > 0.5 and abs(dx) < 0.075 and 0.0 < dy < 0.17 + 0.0 * dx and (dy < 0.1 or math.hypot(dx, dy - 0.1) < 0.075)


p.paint_fn(lambda q, n: q.y < 0.07 and math.hypot(q.x / 1.0, q.z / 0.8) > 0.75 + 0.05 * math.sin(math.atan2(q.z, q.x) * 9), WET)   # scalloped wet foot
p.paint_fn(lambda q, n: n.y > 0.8 and q.y > 0.22 and math.hypot(q.x - TX, q.z - TZ) > 0.33, SAND_L)
p.paint_fn(lambda q, n: abs(q.y - (TY + 0.18)) < 0.018 and math.hypot(q.x - TX, q.z - TZ) < 0.31, SAND_D)   # bucket ridge line
p.paint_fn(door, 0xb98a4a)
p.layer('shells', base=0xffb6c9, target_faces=500, voxel=0.008)
# a pink scallop and a little blue-white whelk pressed into the front of the heap
for i in range(5):
    a = math.radians(-50 + 25 * i)
    p.blob((0.3 + 0.08 * math.sin(a), 0.22 + 0.08 * math.cos(a), 0.6), (0.045, 0.09, 0.035), rot=(-35, 0, -math.degrees(a)), group='s1')
p.blob((0.3, 0.16, 0.6), (0.06, 0.045, 0.04), rot=(-35, 0, 0), group='s1')
for k in range(4):
    u = k / 3
    p.blob((-0.62 + 0.08 * u, 0.17 + 0.02 * u, 0.5 - 0.02 * u), (0.055 * (1 - 0.6 * u), 0.05 * (1 - 0.6 * u), 0.045 * (1 - 0.6 * u)), group='s2')
p.paint_fn(lambda q, n: q.x < -0.3, 0xcfe9ff)
p.layer('blade', base=0xffd23f, target_faces=500, voxel=0.008)
p.quadriflow = False
ang = math.radians(24)
bx, by, bz = 0.58, 0.5, 0.1


def rot(x, y):
    return (bx + x * math.cos(ang) + y * math.sin(ang), by - x * math.sin(ang) + y * math.cos(ang))


outline = rounded([(-0.17, 0.06), (0.17, 0.06), (0.16, -0.24), (0, -0.36), (-0.16, -0.24)], 0.07, n=4, closed=True)
poly = [rot(x, y) for x, y, *_ in outline]
cx, cy = rot(0, -0.12)
m = len(poly)
verts = []
for d in (-0.03, 0.03):
    verts.append((cx, cy, bz + d))
    verts += [(x, y, bz + d + 0.04 * (1 - abs(x - cx) / 0.2) * 0) for x, y in poly]
k = m + 1
faces = []
for i in range(m):
    j = (i + 1) % m
    faces += [(0, 1 + j, 1 + i), (k, k + 1 + i, k + 1 + j), (1 + i, 1 + j, k + 1 + j, k + 1 + i)]
p.mesh(verts, faces)
s0, s1 = rot(0, 0.04), rot(0, 0.14)
p.tube([(s0[0], s0[1], bz), (s1[0], s1[1], bz)], 0.05, rseg=10)          # socket collar
p.paint_fn(lambda q, n: (q.x - bx) * math.sin(ang) + (q.y - by) * math.cos(ang) > 0.03, 0xf5b324)
p.layer('handle', base=0xff5a5a, target_faces=500, voxel=0.008)
p.quadriflow = False
a0 = rot(0, 0.1); a1 = rot(0, 0.7)
p.tube([(a0[0], a0[1], bz), (a1[0], a1[1], bz)], 0.04, rseg=10)
g0 = rot(-0.13, 0.72); g1 = rot(0.13, 0.72)
p.tube([(g0[0], g0[1], bz), (g1[0], g1[1], bz)], 0.05, rseg=10)
p.layer('skin')
p.bone('root', (0, 0, 0), (0, 0.8, 0))
p.extras['outline'] = 0.018
p.build()
