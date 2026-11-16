"""Sea shells for the sand (instanced, tinted per copy: painted white with pale-grey grooves). Skin: a scallop fan
0.42 wide lying convex-up, hinge toward -z, with little ears. Layer 'swirl': a soft-serve spiral whelk 0.34 long."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from skit import SProp

p = SProp('prop_shell', base=0xffffff)
R, NR, NT = 0.21, 5, 22
A0, A1 = math.radians(-62), math.radians(62)
top, bot = [], []
verts, faces = [(0, 0.03, -0.1)], []
idx = {}
for i in range(1, NR + 1):
    r = R * i / NR
    for j in range(NT + 1):
        t = A0 + (A1 - A0) * j / NT
        rib = 0.012 * abs(math.cos(t * 7.5)) * (r / R)
        h = 0.03 + 0.07 * max(0.0, 1 - (r / R) ** 2) ** 0.5 * 0.9 + rib
        idx[(i, j)] = len(verts)
        verts.append((r * math.sin(t), h, -0.1 + r * math.cos(t)))
for j in range(NT):
    faces.append((0, idx[(1, j + 1)], idx[(1, j)]))
for i in range(1, NR):
    for j in range(NT):
        faces.append((idx[(i, j)], idx[(i, j + 1)], idx[(i + 1, j + 1)], idx[(i + 1, j)]))
# underside: a flat plate under the rim
base = len(verts)
rim = [idx[(NR, j)] for j in range(NT + 1)]
verts.append((0, 0.0, -0.1))
for j in range(NT + 1):
    x, y, z = verts[rim[j]]
    verts.append((x * 0.98, 0.0, -0.1 + (z + 0.1) * 0.98))
for j in range(NT):
    faces.append((base, base + 1 + j, base + 2 + j))
    faces.append((rim[j], rim[j + 1], base + 2 + j, base + 1 + j))
for i in range(1, NR + 1):
    pass
# close the two straight sides (hinge to rim) with fans to the underside centre
for side, j in ((0, 0), (1, NT)):
    chain = [0] + [idx[(i, j)] for i in range(1, NR + 1)] + [base + 1 + j, base]
    faces.append(tuple(chain if side else chain[::-1]))
p.mesh(verts, faces)
for s in (-1, 1):
    p.box((s * 0.05, 0.025, -0.115), (0.045, 0.022, 0.03), rot=(0, s * 15, 0), bevel=0.015)
p.paint_fn(lambda q, n: n.y > 0.3 and abs(math.cos(math.atan2(q.x, q.z + 0.1) * 7.5)) < 0.35 and math.hypot(q.x, q.z + 0.1) > 0.06, 0xe4e0e8)
p.layer('swirl', base=0xffffff)
pts, rad = [], []
for i in range(40):
    u = i / 39
    a = u * math.tau * 3.2
    rr_ = 0.13 * (1 - u) + 0.01
    pts.append((-0.12 + u * 0.3, 0.1 + 0.01 * math.sin(a), 0.0) if False else (rr_ * math.cos(a), 0.06 + u * 0.26, rr_ * math.sin(a)))
    rad.append(0.07 * (1 - u) + 0.022)
p.tube(pts, rad, rseg=8)
p.paint_fn(lambda q, n: n.y < -0.2, 0xe4e0e8)
p.layer('skin')
p.extras['outline'] = 0.016
p.build()
