"""Scallop shell (tintable, default pink) for the home icon of Which has more?. A ribbed fan lying flat (hinge at the
back, -z), domed up to ~0.2, ~1.0 wide, with two little hinge ears. Paint is light grey/white so the tint shows; the
grooves between the ribs are a shade darker."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

p = Prop('prop_icon_shell', base=0xffffff, target_faces=3000, voxel=0.01)
HZ = -0.36
R, NR, NT = 0.66, 14, 72
A0, A1 = math.radians(-66), math.radians(66)
NRIB = 9
verts, faces, idx = [(0, 0.05, HZ)], [], {}
for i in range(1, NR + 1):
    r = R * i / NR
    for j in range(NT + 1):
        t = A0 + (A1 - A0) * j / NT
        rib = 0.5 + 0.5 * math.cos((t - A0) / (A1 - A0) * NRIB * math.tau - math.pi)
        rr = r * (1 + 0.02 * rib * (r / R))                                   # ribs gently scallop the rim
        h = 0.085 + 0.19 * max(0.0, 1 - (r / R) ** 2) ** 0.5 + 0.016 * rib * (r / R)    # a fat rounded lip all round
        idx[(i, j)] = len(verts)
        verts.append((rr * math.sin(t), h, HZ + rr * math.cos(t)))
for j in range(NT):
    faces.append((0, idx[(1, j + 1)], idx[(1, j)]))
for i in range(1, NR):
    for j in range(NT):
        faces.append((idx[(i, j)], idx[(i, j + 1)], idx[(i + 1, j + 1)], idx[(i + 1, j)]))
base = len(verts)
rim = [idx[(NR, j)] for j in range(NT + 1)]
verts.append((0, 0.0, HZ))
for j in range(NT + 1):
    x, y, z = verts[rim[j]]
    verts.append((x * 0.9, 0.0, HZ + (z - HZ) * 0.9))
for j in range(NT):
    faces.append((base, base + 1 + j, base + 2 + j))
    faces.append((rim[j], rim[j + 1], base + 2 + j, base + 1 + j))
for side, j in ((0, 0), (1, NT)):
    chain = [0] + [idx[(i, j)] for i in range(1, NR + 1)] + [base + 1 + j, base]
    faces.append(tuple(chain if side else chain[::-1]))
p.mesh(verts, faces)
for s in (-1, 1):
    p.box((s * 0.14, 0.045, HZ - 0.03), (0.12, 0.04, 0.07), rot=(0, s * 18, 0), bevel=0.035)      # the hinge ears


def groove(q, n):
    r = math.hypot(q.x, q.z - HZ)
    if r < 0.16 or n.y < 0.15:
        return False
    t = math.atan2(q.x, q.z - HZ)
    return math.cos((t - A0) / (A1 - A0) * NRIB * math.tau - math.pi) < -0.5


p.paint_fn(groove, 0xdedede)
p.paint_fn(lambda q, n: n.y < -0.3, 0xe8e8e8)
p.paint_fn(lambda q, n: math.hypot(q.x, q.z - HZ) < 0.14 and n.y > 0, 0xd2d2d2)
p.bone('body', (0, 0, 0), (0, 0.3, 0))
p.extras['argMode'] = 'tint'
p.extras['argDefault'] = 0xffb6c9
p.extras['outline'] = 0.02
p.build()
