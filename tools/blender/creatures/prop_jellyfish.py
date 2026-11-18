"""Glowing jellyfish (beach night sea). A scalloped dome bell (radius 0.45, rim at y 0) painted white with paler
spots - scenery.js tints it and draws it unlit; a sleepy-happy face (layer 'face': eyes, cheeks); five wavy tapering
tentacles (layer 'tentacles', tinted lighter)."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from skit import SProp

p = SProp('prop_jellyfish', base=0xffffff)
NT, NP = 64, 14
verts, faces = [(0, 0.38, 0)], []
grid = {}
for i in range(1, NP + 1):
    a = (math.pi / 2) * i / NP
    for j in range(NT):
        t = j / NT * math.tau
        sc = 1 + 0.035 * math.cos(8 * t) * (i / NP) ** 4                      # soft round scallops at the hem
        r = 0.45 * math.sin(a) * sc
        y = 0.38 * math.cos(a) - 0.035 * (0.5 + 0.5 * math.cos(8 * t)) * (i / NP) ** 6
        grid[(i, j)] = len(verts)
        verts.append((r * math.sin(t), y, r * math.cos(t)))
for j in range(NT):
    faces.append((0, grid[(1, j)], grid[(1, (j + 1) % NT)]))
for i in range(1, NP):
    for j in range(NT):
        j2 = (j + 1) % NT
        faces.append((grid[(i, j)], grid[(i + 1, j)], grid[(i + 1, j2)], grid[(i, j2)]))
# underside: a shallow inward dish
c = len(verts)
verts.append((0, 0.06, 0))
for j in range(NT):
    j2 = (j + 1) % NT
    faces.append((grid[(NP, j)], c, grid[(NP, j2)]))
p.mesh(verts, faces)
p.paint_fn(lambda q, n: (math.hypot(q.x + 0.2, q.y - 0.3) < 0.06 or math.hypot(q.x - 0.24, q.y - 0.32) < 0.045 or math.hypot(q.x - 0.05, q.y - 0.36) < 0.04) and q.z < 0.1, 0xf0f0f0)
p.layer('face', base=0x3a2838)
for s in (-1, 1):
    pts = [(s * 0.14 + 0.06 * math.cos(a), 0.2 + 0.045 * math.sin(a), 0) for a in [math.pi * k / 6 for k in range(7)]]
    z = lambda x, y: (max(0.0, 0.45 ** 2 * (1 - (y / 0.38) ** 2) - x * x)) ** 0.5 + 0.005
    p.tube([(x, y, z(x, y)) for x, y, _ in pts], 0.014, rseg=5)
    x, y = s * 0.24, 0.12
    p.lathe([(0, 0), (0.05, 0), (0.05, 0.012), (0, 0.014)], pos=(x, y, z(x, y) - 0.008), rot=(70, s * 30, 0), seg=10)
p.paint_fn(lambda q, n: q.y < 0.16, 0xff9ac4)
p.layer('tentacles', base=0xffffff)
for k in range(5):
    a = k / 5 * math.tau + 0.3
    x0, z0 = 0.26 * math.sin(a), 0.26 * math.cos(a)
    pts, rad = [], []
    for i in range(10):
        t = i / 9
        pts.append((x0 * (1 - 0.3 * t) + 0.06 * math.sin(t * 7 + k), 0.04 - 0.75 * t, z0 * (1 - 0.3 * t) + 0.06 * math.cos(t * 7 + k)))
        rad.append(0.045 * (1 - t) + 0.012)
    p.tube(pts, rad, rseg=6)
p.layer('skin')
p.extras['outline'] = 0.02
p.build()
