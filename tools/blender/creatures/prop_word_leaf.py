"""Brick letters picture: L is for Leaf. A big glossy green leaf (about 1.4 wide, 2.2 tall with its stalk): a real
leaf outline (round shoulders, a pointed tip), cupped like a little boat and curling toward us at the tip, a pale
centre vein with four pairs of side veins painted on (no loose ink strokes), a darker underside and a short stalk.
Origin = the stalk end."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from skit import SProp

LEAF, LEAF_D, VEIN, STALK = 0x4cc75a, 0x2f9a45, 0xb6f08a, 0x6a9a2e
p = SProp('prop_word_leaf', hard=True, base=LEAF, target_faces=3000)
Y0, Y1 = 0.3, 2.2
NU, NV, TH = 34, 12, 0.045


def half_w(u):             # the outline: round shoulders, a long point
    return 0.7 * math.sin(math.pi * min(1.0, u * 1.02) ** 0.75) * (1 - 0.2 * u) + 0.012


def surf(u, v, side):
    x = v * half_w(u)
    y = Y0 + (Y1 - Y0) * u
    z = 0.26 * v * v + 0.32 * u ** 3          # cupped across, curling toward us at the tip
    return (x, y, z + side * TH * (1 - 0.6 * u))


verts, faces = [], []
for side in (-1, 1):
    for i in range(NU + 1):
        for j in range(NV + 1):
            verts.append(surf(i / NU, -1 + 2 * j / NV, side))
W = NV + 1
off = (NU + 1) * W
for i in range(NU):
    for j in range(NV):
        a, b, c, d = i * W + j, i * W + j + 1, (i + 1) * W + j + 1, (i + 1) * W + j
        faces.append((a, d, c, b))                       # back
        faces.append((off + a, off + b, off + c, off + d))   # front
for i in range(NU):                                      # the rim
    for j in (0, NV):
        a, d = i * W + j, (i + 1) * W + j
        f = (a, d, off + d, off + a)
        faces.append(f if j == NV else f[::-1])
for j in range(NV):
    a, b = j, j + 1
    faces.append((a, b, off + b, off + a)[::-1])
    a, b = NU * W + j, NU * W + j + 1
    faces.append((a, b, off + b, off + a))
p.mesh(verts, faces, bevel=0)


def uv(q):
    u = max(0.0, min(1.0, (q.y - Y0) / (Y1 - Y0)))
    return u, q.x / max(0.02, half_w(u))


p.paint_fn(lambda q, n: n.z < -0.2, LEAF_D)
p.paint_fn(lambda q, n: n.z > -0.2 and abs(uv(q)[1]) < 0.07 and uv(q)[0] < 0.93, VEIN)
for k in range(4):
    u0 = 0.16 + 0.19 * k
    p.paint_fn(lambda q, n, u0=u0: n.z > -0.2 and 0.07 < abs(uv(q)[1]) < 0.72 and abs(uv(q)[0] - (u0 + 0.16 * abs(uv(q)[1]))) < 0.013, VEIN)
# the short stalk
p.layer('stalk', base=STALK)
p.tube([(0.0, 0.0, 0.02), (0.0, 0.16, 0.02), (0, Y0 + 0.06, 0.0)], [0.05, 0.05, 0.055], rseg=10)
p.layer('skin')
p.bone('body', (0, 0, 0), (0, Y1, 0))
p.extras['outline'] = 0.022
p.build()
