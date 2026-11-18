"""Sea shells for the sand (instanced, tinted per copy: painted white with pale-grey grooves). Skin: a scallop fan
0.42 wide lying convex-up, hinge toward -z, with little ears. Layer 'swirl': a soft-serve spiral whelk 0.34 long."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from skit import SProp

p = SProp('prop_shell', base=0xffffff)
R, NR, NT = 0.21, 12, 60
A0, A1 = math.radians(-62), math.radians(62)
top, bot = [], []
verts, faces = [(0, 0.03, -0.1)], []
idx = {}
for i in range(1, NR + 1):
    r = R * i / NR
    for j in range(NT + 1):
        t = A0 + (A1 - A0) * j / NT
        rib = 0.5 + 0.5 * math.cos(t * 15)                       # 7-8 soft round ribs
        rr = r * (1 + 0.035 * rib * (r / R))                      # ribs scallop the rim
        h = 0.03 + 0.07 * max(0.0, 1 - (r / R) ** 2) ** 0.5 * 0.9 + 0.012 * rib * (r / R)
        idx[(i, j)] = len(verts)
        verts.append((rr * math.sin(t), h, -0.1 + rr * math.cos(t)))
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
p.paint_fn(lambda q, n: n.y > 0.2 and math.cos(math.atan2(q.x, q.z + 0.1) * 15) < -0.45 and math.hypot(q.x, q.z + 0.1) > 0.07, 0xe8e3ec)
p.layer('swirl', base=0xffffff)
p.layers['swirl'].update(remesh=True, quadriflow=False, voxel=0.005, target_faces=2600)
# a whelk standing on its opening, apex up (scenery.js lays it on its side): a pointed cone spiral of four whorls with
# a pale spiral groove along every suture, a flared lip round the mouth and a pink inside
TURNS, Y0, HGT = 3.6, 0.07, 0.28
PITCH = HGT / TURNS
pts, rad = [], []
for i in range(80):
    u = i / 79
    a = u * math.tau * TURNS
    rr_ = 0.062 * (1 - u) ** 1.05 + 0.002
    pts.append((rr_ * math.cos(a), Y0 + u * HGT, rr_ * math.sin(a)))
    rad.append(0.05 * (1 - u) ** 1.1 + 0.006)
p.tube(pts, rad, rseg=14)
p.lathe([(0, 0), (0.012, 0.0), (0.0, 0.05)], pos=(0, Y0 + HGT - 0.01, 0), seg=10)     # sharp little apex
p.ring((0.064, 0.075, -0.01), 0.058, 0.017, rot=(90, 0, 0), seg=28, rseg=8)         # flared lip round the mouth
p.tube([(0.03, 0.05, 0.0), (0.0, 0.0, 0.0)], [0.028, 0.016], rseg=8)               # siphon canal


def groove(q, n):
    """on the suture between two whorls: half a pitch above the helix at this angle"""
    a = math.atan2(q.z, q.x) % math.tau
    y = q.y - Y0 - a / math.tau * PITCH
    f = (y / PITCH) % 1.0
    return abs(f - 0.5) < 0.09 and Y0 + PITCH * 0.4 < q.y < Y0 + HGT - 0.02 and math.hypot(q.x, q.z) > 0.012


p.paint_fn(groove, 0xcfc4d8)
p.paint_fn(lambda q, n: n.y < -0.2 and q.y < 0.08, 0xe8e3ec)
p.paint_fn(lambda q, n: math.hypot(q.x - 0.064, q.y - 0.075) < 0.05 and q.z < 0.03 and n.z < -0.3, 0xffc8d6)
p.layer('skin')
p.extras['outline'] = 0.016
path = p.build()
# direct uses show the two shells side by side (rest pose only: 'swirl' rides the 'root' joint, moved aside; the raw
# layers that scenery.js instances are unchanged)
from glbpost import Glb
Glb(path).bind_layer('swirl', 'root').unparent('body').move('root', lift=(0.3, 0.12, 0), turn_x=65).move('body', lift=(-0.25, 0.1, 0), turn_x=60).save()
