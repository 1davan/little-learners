"""A gathered curtain panel (rooms; tintable: painted white with soft pale pleat shadows). Unit size: hangs from y = 1
(top, x -0.5 .. 0.5) to y = 0, folds in z, gathered by a tie-back at y 0.38 toward -x (outer side). scenery.js /
dress-room.js scale it (x width, y height) and mirror it (scale.x < 0) for the right side. Five soft rounded pleats
(a thick smooth cloth, finely tessellated so the folds and the ink stay clean), a gentle flare at the hem.
Layer 'tie': a chunky rounded tie-back band with a knot and a fat tassel (white: tinted gold)."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from skit import SProp

p = SProp('prop_curtain', base=0xffffff)
NX, NY, TIE, PLEATS, THICK = 40, 26, 0.38, 5, 0.07
SHADOW = 0xdcd3e3


def span(y):
    """left and right edge of the curtain at height y (gathered at the tie, outer side = -x)"""
    if y >= TIE:
        k = ((y - TIE) / (1 - TIE)) ** 0.8
        return (-0.5, -0.2 + 0.7 * k)
    k = (TIE - y) / TIE
    return (-0.49 - 0.04 * k, -0.2 + 0.46 * k ** 0.75)


def fold(u, w):
    """z of the cloth at u (0..1 across) for a panel currently w wide: rounded pleats, deeper where gathered"""
    amp = 0.028 * min(1.0, w / 1.0) ** 2           # gentle rounded folds (sharp valleys trap the ink)
    s = math.sin(u * math.pi * 2 * PLEATS - math.pi / 2)
    return amp * s + 0.06


verts, faces, grid = [], [], {}
for j in range(NY + 1):
    y = j / NY
    x0, x1 = span(y)
    w = x1 - x0
    for i in range(NX + 1):
        u = i / NX
        x = x0 + w * u
        z = fold(u, w)
        for s, dz in ((0, THICK / 2), (1, -THICK / 2)):
            grid[(i, j, s)] = len(verts)
            verts.append((x, y, z + dz))
for s in (0, 1):
    for j in range(NY):
        for i in range(NX):
            q = (grid[(i, j, s)], grid[(i + 1, j, s)], grid[(i + 1, j + 1, s)], grid[(i, j + 1, s)])
            faces.append(q if s == 0 else q[::-1])
for j in range(NY):
    for i in (0, NX):
        q = (grid[(i, j, 1)], grid[(i, j, 0)], grid[(i, j + 1, 0)], grid[(i, j + 1, 1)])
        faces.append(q if i == 0 else q[::-1])
for i in range(NX):
    for j in (0, NY):
        q = (grid[(i, j, 0)], grid[(i, j, 1)], grid[(i + 1, j, 1)], grid[(i + 1, j, 0)])
        faces.append(q if j == 0 else q[::-1])
p.mesh(verts, faces, bevel=0.0)


def valley(q, n):
    """the inner half of every pleat (where the cloth folds back) gets the soft shadow tone: clean vertical bands"""
    x0, x1 = span(min(1, max(0, q.y)))
    u = (q.x - x0) / max(1e-4, x1 - x0)
    s = math.sin(u * math.pi * 2 * PLEATS - math.pi / 2)
    return s < -0.55 and q.y < 0.985


p.paint_fn(valley, SHADOW)
p.layer('tie', base=0xffffff)
x0, x1 = span(TIE)
cx, hw = (x0 + x1) / 2, (x1 - x0) / 2 * 1.06
pts = []
for k in range(32):
    a = k / 32 * math.tau
    pts.append((cx + hw * math.cos(a), TIE + 0.01 * math.sin(a * 2), 0.05 + 0.13 * math.sin(a)))
p.tube(pts, 0.034, closed=True, rseg=10)
KX = x0 - 0.01
p.lathe([(0, -0.045), (0.05, -0.04), (0.06, 0.0), (0.05, 0.04), (0, 0.045)], pos=(KX, TIE, 0.08), rot=(90, 0, 0), seg=16)  # knot
p.tube([(KX, TIE - 0.02, 0.1), (KX - 0.012, TIE - 0.1, 0.11), (KX - 0.02, TIE - 0.15, 0.11)], 0.016, rseg=8)          # cord
p.lathe([(0, 0), (0.055, 0.01), (0.07, 0.07), (0.06, 0.12), (0.03, 0.15), (0, 0.16)], pos=(KX - 0.02, TIE - 0.32, 0.11), seg=18)  # tassel
p.ring((KX - 0.02, TIE - 0.185, 0.11), 0.035, 0.013, seg=16, rseg=6)                                                  # tassel collar
p.paint_fn(lambda q, n: q.y < TIE - 0.16 and q.y > TIE - 0.205, 0xe8dcc8)
p.layer('skin')
p.extras['outline'] = 0.02
p.build()
