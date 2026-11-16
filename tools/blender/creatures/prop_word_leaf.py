"""Brick letters picture: L is for Leaf. A big glossy green leaf (about 1.4 wide, 2.3 tall with its stalk), gently
curved like a boat, a pointed tip, a pale centre vein with side veins, and a short stalk. Faces the camera, leaning a
little. Origin = the stalk end."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop

LEAF, LEAF_D, VEIN, STALK = 0x4cc75a, 0x36a849, 0xa6ec7a, 0x6a9a2e
p = Prop('prop_word_leaf', base=LEAF, target_faces=3200, voxel=0.012)
Y0, Y1 = 0.35, 2.25
def half_w(t):          # leaf outline half width along its length (t 0 = base, 1 = tip)
    return 0.68 * math.sin(math.pi * min(1, t * 1.05) ** 0.8) * (1 - 0.15 * t)
N = 28
outline = []
for i in range(N + 1):
    t = i / N
    outline.append((half_w(t), Y0 + (Y1 - Y0) * t))
pts = [(x, y) for x, y in outline] + [(-x, y) for x, y in reversed(outline[1:-1])]
th = 0.05
def bend(x, y):        # a gentle boat-shaped cup toward the camera
    return 0.22 * (x / 0.7) ** 2
verts = [(x, y, bend(x, y) - th) for x, y in pts] + [(x, y, bend(x, y) + th) for x, y in pts]
n = len(pts)
faces = [tuple(range(n - 1, -1, -1)), tuple(range(n, 2 * n))] + [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)]
p.mesh(verts, faces)
p.paint_fn(lambda q, n: n.z < -0.3, LEAF_D)
p.layer('veins', base=VEIN, target_faces=1000, voxel=0.008)
p.tube([(0, Y0 + 0.02, 0.06), (0, (Y0 + Y1) / 2, 0.06), (0, Y1 - 0.18, 0.06)], [0.04, 0.032, 0.015], rseg=8)
for k in range(4):
    y = Y0 + 0.35 + k * 0.33
    for s in (-1, 1):
        L = half_w((y - Y0) / (Y1 - Y0)) * 0.75
        p.tube([(0, y, 0.06), (s * L * 0.5, y + 0.12, 0.06 + bend(s * L * 0.5, 0)), (s * L, y + 0.22, 0.06 + bend(L, 0))], [0.022, 0.018, 0.01], rseg=6)
p.layer('stalk', base=STALK, target_faces=300, voxel=0.01)
p.tube([(0.02, 0.0, 0), (0.0, 0.2, 0.0), (0, Y0 + 0.05, 0.0)], [0.05, 0.05, 0.055], rseg=8)
p.layer('skin')
p.bone('body', (0, 0, 0), (0, Y1, 0))
p.extras['outline'] = 0.022
p.build()
