"""A gathered curtain panel (rooms; tintable: painted white with pale fold shadows). Unit size: hangs from y = 1 (top,
x -0.5 .. 0.5) to y = 0, folds in z, gathered by a tie-back at y 0.38 toward -x (outer side). scenery.js /
dress-room.js scale it (x width, y height) and mirror it (scale.x < 0) for the right side. Layer 'tie': the tie-back
band and a tassel (white: tinted gold)."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from skit import SProp

p = SProp('prop_curtain', base=0xffffff)
NX, NY, TIE = 14, 18, 0.38


def span(y):
    """left and right edge of the curtain at height y (gathered at the tie, outer side = -x)"""
    if y >= TIE:
        k = ((y - TIE) / (1 - TIE)) ** 0.8
        return (-0.5 + 0.0 * k, -0.18 + 0.68 * k)
    k = (TIE - y) / TIE
    return (-0.48 - 0.05 * k, -0.18 + 0.5 * k ** 0.8)


verts, faces, grid = [], [], {}
for j in range(NY + 1):
    y = j / NY
    x0, x1 = span(y)
    w = x1 - x0
    amp = 0.05 + 0.1 * (1 - min(1, w / 1.0))
    for i in range(NX + 1):
        u = i / NX
        x = x0 + w * u
        z = amp * math.sin(u * math.pi * 5) + 0.05
        for s, dz in ((0, 0.0), (1, -0.05)):
            grid[(i, j, s)] = len(verts)
            verts.append((x, y, z + dz))
for s in (0, 1):
    for j in range(NY):
        for i in range(NX):
            q = (grid[(i, j, s)], grid[(i + 1, j, s)], grid[(i + 1, j + 1, s)], grid[(i, j + 1, s)])
            faces.append(q if s == 0 else q[::-1])
for j in range(NY):
    for i, i2 in ((0, 0), (NX, NX)):
        q = (grid[(i, j, 1)], grid[(i, j, 0)], grid[(i, j + 1, 0)], grid[(i, j + 1, 1)])
        faces.append(q if i == 0 else q[::-1])
for i in range(NX):
    for j, j2 in ((0, 0), (NY, NY)):
        q = (grid[(i, j, 0)], grid[(i, j, 1)], grid[(i + 1, j, 1)], grid[(i + 1, j, 0)])
        faces.append(q if j == 0 else q[::-1])
p.mesh(verts, faces, bevel=0.0)
p.paint_fn(lambda q, n: n.x < -0.35 or n.x > 0.75, 0xe2dce4)
p.layer('tie', base=0xffffff)
x0, x1 = span(TIE)
pts = []
for k in range(17):
    a = k / 16 * math.tau
    pts.append(((x0 + x1) / 2 + (x1 - x0) / 2 * 1.08 * math.cos(a), TIE + 0.012 * math.sin(a * 2), 0.03 + 0.11 * math.sin(a)))
p.tube(pts, 0.025, closed=True, rseg=6)
p.tube([(x0 - 0.02, TIE, 0.06), (x0 - 0.04, TIE - 0.1, 0.07)], 0.014, rseg=5)
p.lathe([(0, 0), (0.045, 0.01), (0.05, 0.07), (0.02, 0.12), (0, 0.13)], pos=(x0 - 0.04, TIE - 0.23, 0.07), seg=10)
p.layer('skin')
p.extras['outline'] = 0.02
p.build()
