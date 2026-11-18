"""Brick letters picture: G is for Grapes. A plump bunch of purple grapes (about 1.7 wide, 2.4 tall): fifteen round
grapes in an upside-down cone, each with its own little highlight, a curly brown stem and a big green vine leaf.
Origin = bottom centre."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop

GRAPE, GRAPE_D, SHINE = 0x8f52d9, 0x6f3cb8, 0xd2b2ff
STEM, LEAF, LEAF_L = 0x7a4a2a, 0x4cc75a, 0x9be86f
p = Prop('prop_word_grapes', base=GRAPE, target_faces=4200, voxel=0.013)
r = 0.25
rows = [(4, 1.8), (4, 1.38), (3, 0.97), (2, 0.58), (1, 0.25)]
centres = []
for ri, (n, y) in enumerate(rows):
    for i in range(n):
        x = (i - (n - 1) / 2) * r * 2.02
        z = 0.1 if (i + ri) % 2 == 0 else -0.04
        centres.append((x, y, z))
# a few at the back so the bunch is round, not flat
centres += [(-0.22, 1.6, -0.3), (0.22, 1.6, -0.3), (0, 1.2, -0.28)]
for k, c in enumerate(centres):
    p.blob(c, (r * 0.97, r * 1.04, r * 0.97), group='g%d' % k, stiffness=2.6)
# every grape gets the same small round highlight (up-left, toward the light), and a darker rim where grapes meet
L = (-0.42, 0.5, 0.76)
def nearest(q):
    return min(centres, key=lambda c: (q.x - c[0]) ** 2 + (q.y - c[1]) ** 2 + (q.z - c[2]) ** 2)
def lit(q):
    c = nearest(q); d = (q.x - c[0], q.y - c[1], q.z - c[2]); m = math.sqrt(sum(v * v for v in d)) or 1
    return (d[0] * L[0] + d[1] * L[1] + d[2] * L[2]) / m
p.paint_fn(lambda q, n: lit(q) > 0.93, SHINE)
p.paint_fn(lambda q, n: lit(q) < -0.2 and q.z > -0.1, GRAPE_D)
p.layer('stem', base=STEM, target_faces=600, voxel=0.01)
p.tube([(0.0, 1.95, 0), (0.02, 2.15, 0), (-0.06, 2.32, 0), (0.05, 2.42, 0)], [0.08, 0.075, 0.065, 0.06], rseg=10)
p.tube([(0.02, 2.12, 0), (0.25, 2.2, 0.05), (0.32, 2.36, 0.08), (0.2, 2.42, 0.08), (0.18, 2.32, 0.08)], 0.025, rseg=6)
p.layer('leaf', base=LEAF, target_faces=900, voxel=0.01)
LX, LY, ROT = -0.42, 2.2, math.radians(35)
pts = []
for i in range(60):
    t = i / 60 * math.tau
    r = 0.5 * (0.62 + 0.38 * abs(math.cos(t * 2.5))) * (0.75 + 0.25 * math.sin(t))
    x, y = r * math.cos(t), r * math.sin(t) * 0.92
    pts.append((LX + x * math.cos(ROT) - y * math.sin(ROT), LY + x * math.sin(ROT) + y * math.cos(ROT)))
verts = [(x, y, 0.02) for x, y in pts] + [(x, y, 0.12) for x, y in pts]
n = len(pts)
p.mesh(verts, [tuple(range(n - 1, -1, -1)), tuple(range(n, 2 * n))] + [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)])
# three clean pale veins painted on the leaf's front (no loose strokes)
def vein(q):
    dx, dy = q.x - LX, q.y - (LY - 0.05)
    for a in (-50, 0, 50):
        ar = math.radians(a) + ROT + math.pi / 2
        ux, uy = math.cos(ar), math.sin(ar)
        t = dx * ux + dy * uy
        if 0 < t < 0.36 and abs(dx * uy - dy * ux) < 0.022 * (1 - t / 0.5):
            return True
    return False
p.paint_fn(lambda q, n: q.z > 0.1 and vein(q), LEAF_L)
p.layer('skin')
p.bone('body', (0, 0, 0), (0, 2.2, 0))
p.extras['outline'] = 0.022
p.build()
