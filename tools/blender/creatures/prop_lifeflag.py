"""Lifeguard flag pole (Bear's nose, level 2). Origin at the foot: a white pole 4.4 tall with a ball on top, and a
red-over-yellow flag (1.0 x 0.72) flying to +x from the top on bone 'flag' (rotation.y flutters it)."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop

H = 4.4
p = Prop('prop_lifeflag', base=0xfffaf0, target_faces=900, voxel=0.016, smooth=3)
p.quadriflow = False
p.cyl((0, 0, 0), 0.07, H, bevel=0.02, seg=16)
p.blob((0, H + 0.04, 0), (0.1, 0.1, 0.1), group='ball')
p.lathe([(0, 0), (0.3, 0), (0.12, 0.12), (0, 0.16)], seg=24)
p.paint_fn(lambda q, n: q.y < 0.16, 0xf2cf7e)
p.layer('flag', base=0xff5a5a, target_faces=900, voxel=0.012)
p.quadriflow = False
FW, FH, Y1 = 1.0, 0.72, H - 0.05
nx, ny = 12, 6
z = lambda x, y: 0.06 * math.sin(x / FW * math.pi * 1.8) * (x / FW)
verts, faces, idx = [], [], {}
for s, d in ((0, -0.022), (1, 0.022)):
    for i in range(nx + 1):
        for j in range(ny + 1):
            x = 0.05 + FW * i / nx; y = Y1 - FH * j / ny
            idx[s, i, j] = len(verts); verts.append((x, y - 0.03 * (x / FW) ** 2, z(x, y) + d))
for i in range(nx):
    for j in range(ny):
        faces.append((idx[1, i, j], idx[1, i + 1, j], idx[1, i + 1, j + 1], idx[1, i, j + 1]))
        faces.append((idx[0, i, j], idx[0, i, j + 1], idx[0, i + 1, j + 1], idx[0, i + 1, j]))
for i in range(nx):
    faces.append((idx[0, i, 0], idx[0, i + 1, 0], idx[1, i + 1, 0], idx[1, i, 0]))
    faces.append((idx[0, i, ny], idx[1, i, ny], idx[1, i + 1, ny], idx[0, i + 1, ny]))
for j in range(ny):
    faces.append((idx[0, 0, j], idx[1, 0, j], idx[1, 0, j + 1], idx[0, 0, j + 1]))
    faces.append((idx[0, nx, j], idx[0, nx, j + 1], idx[1, nx, j + 1], idx[1, nx, j]))
p.mesh(verts, faces)
p.paint_fn(lambda q, n: q.y < Y1 - FH / 2 - 0.03 * (q.x / FW) ** 2, 0xffd23f)
for y in (Y1 - 0.12, Y1 - FH + 0.12):
    p.blob((0.05, y, 0), (0.06, 0.05, 0.06), group='clip%d' % int(y * 10))
p.layer('skin')
isflag = lambda q: q.x > 0.04 and q.y > Y1 - FH - 0.1
p.bone('root', (0, 0, 0), (0, H, 0), region=lambda q: not isflag(q))
p.bone('flag', (0, Y1 - FH / 2, 0), (0, Y1 + 0.3, 0), parent='root', region=isflag)
p.extras['outline'] = 0.018
p.build()
