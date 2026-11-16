"""Parade flag on a stick (Pattern parade leader). Origin at the foot of the stick: a wooden stick 1.5 tall with a gold
knob, and a waving swallow-tail flag (0.6 x 0.38) at the top, tintable (argMode 'tint') with a white star."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, star_poly

p = Prop('prop_flag', base=0xffffff, target_faces=700, voxel=0.012, smooth=3)
p.quadriflow = False
FW, FH, Y0 = 0.62, 0.4, 1.02
outline = [(0, 0), (FW, 0), (FW - 0.13, FH / 2), (FW, FH), (0, FH)]
z = lambda x: 0.05 * math.sin(x / FW * math.pi * 1.6)
cx = sum(x for x, _ in outline) / 5; cy = sum(y for _, y in outline) / 5
verts, faces = [], []
dense = []
for i in range(len(outline)):
    a, b = outline[i], outline[(i + 1) % len(outline)]
    for t in range(6):
        dense.append((a[0] + (b[0] - a[0]) * t / 6, a[1] + (b[1] - a[1]) * t / 6))
m = len(dense)
for d in (-0.025, 0.025):
    verts.append((0.06 + cx, Y0 + cy, z(cx) + d))
    verts += [(0.06 + x, Y0 + y, z(x) + d) for x, y in dense]
k = m + 1
for i in range(m):
    j = (i + 1) % m
    faces += [(0, 1 + j, 1 + i), (k, k + 1 + i, k + 1 + j), (1 + i, 1 + j, k + 1 + j, k + 1 + i)]
p.mesh(verts, faces)
p.layer('stick', base=0xc98b4f, target_faces=400, voxel=0.012)
p.quadriflow = False
p.cyl((0, 0, 0), 0.035, 1.46, bevel=0.015, seg=12)
p.layer('knob', base=0xffc23f, target_faces=120, voxel=0.01)
p.blob((0, 1.48, 0), (0.06, 0.06, 0.06), group='k')
p.layer('star', base=0xfffaf0, target_faces=200, voxel=0.008)
p.quadriflow = False
for d in (1, -1):
    sp = star_poly(0.1, inner=0.48)
    vs = [(0.06 + 0.26 + x, Y0 + FH / 2 + y, z(0.26 + x) + d * 0.028) for x, y in sp]
    vs2 = [(a, b, c + d * 0.02) for a, b, c in vs]
    n = len(sp)
    v = [(0.32, Y0 + FH / 2, z(0.26) + d * 0.028)] + vs + [(0.32, Y0 + FH / 2, z(0.26) + d * 0.048)] + vs2
    f = []
    kk = n + 1
    for i in range(n):
        j = (i + 1) % n
        f += [(0, 1 + j, 1 + i), (kk, kk + 1 + i, kk + 1 + j), (1 + i, 1 + j, kk + 1 + j, kk + 1 + i)]
    p.mesh(v, f)
p.layer('skin')
p.bone('root', (0, 0, 0), (0, 1.5, 0))
p.extras['argMode'] = 'tint'
p.extras['argDefault'] = 0xff5a5a
p.extras['outline'] = 0.014
p.build()
