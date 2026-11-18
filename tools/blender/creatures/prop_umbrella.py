"""Open umbrella (farm rainy day): a soft eight-panel canopy radius 1.0 (tintable: painted white) with scalloped edge
and white tip knobs, a wooden shaft and a curly crook handle (layer 'stick'). Canopy apex at y 2.25, shaft from y 0."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from skit import SProp, TAU

R, TOP, EDGE, TH = 1.05, 2.3, 1.72, 0.06
p = SProp('prop_umbrella', base=0xffffff)
NT, NR = 96, 14                       # 12 columns per panel: the rib columns are exact mesh columns (crisp seams)


def canopy_y(r, t):
    """height of the canopy at radius r, angle t: a soft dome, each panel sagging a little between its ribs"""
    sag = 0.07 * abs(math.sin(4 * t)) * (r / R) ** 2
    return TOP - (TOP - EDGE) * (r / R) ** 1.5 - sag


def edge_r(t):
    return R * (1 - 0.05 * abs(math.sin(4 * t)))          # the hem scallops in between the rib tips


verts, faces, grid = [], [], {}
for s_, dy in ((0, 0.0), (1, -TH)):
    grid[(s_, 'c')] = len(verts); verts.append((0, TOP + dy + (0.0 if s_ == 0 else 0.0), 0))
    for i in range(1, NR + 1):
        f = i / NR
        for j in range(NT):
            t = j / NT * TAU
            r = edge_r(t) * f
            grid[(s_, i, j)] = len(verts)
            verts.append((r * math.sin(t), canopy_y(r, t) + dy, r * math.cos(t)))
for s_ in (0, 1):
    for j in range(NT):
        j2 = (j + 1) % NT
        tri = (grid[(s_, 'c')], grid[(s_, 1, j)], grid[(s_, 1, j2)])
        faces.append(tri if s_ == 0 else tri[::-1])
        for i in range(1, NR):
            q = (grid[(s_, i, j)], grid[(s_, i + 1, j)], grid[(s_, i + 1, j2)], grid[(s_, i, j2)])
            faces.append(q if s_ == 0 else q[::-1])
for j in range(NT):
    j2 = (j + 1) % NT
    faces.append((grid[(0, NR, j)], grid[(1, NR, j)], grid[(1, NR, j2)], grid[(0, NR, j2)]))
p.mesh(verts, faces)
p.paint_fn(lambda q, n: n.y < -0.2, 0xe6e6e6)
p.paint_fn(lambda q, n: n.y > -0.2 and min(abs(((math.atan2(q.x, q.z) % TAU) - k * TAU / 8 + math.pi) % TAU - math.pi) for k in range(8)) * max(0.05, math.hypot(q.x, q.z)) < 0.012, 0xdcdcdc)   # seams
p.layer('stick', base=0x8a5a3b)
p.cyl((0, 0.35, 0), 0.04, TOP - 0.3, seg=12, bevel=0.015)
p.tube([(0, 0.4, 0)] + [(0.13 - 0.13 * math.cos(t), 0.4 - 0.13 * math.sin(t) * 1.0, 0) for t in [i / 8 * math.pi for i in range(1, 9)]], 0.055, rseg=10)
p.lathe([(0, 0), (0.07, 0), (0.06, 0.08), (0.03, 0.2), (0, 0.24)], pos=(0, TOP - 0.02, 0), seg=14)
for i in range(8):
    a = i / 8 * TAU
    p.lathe([(0, -0.045), (0.04, -0.04), (0.05, 0), (0.04, 0.04), (0, 0.045)], pos=(R * math.sin(a), canopy_y(R, a) - 0.05, R * math.cos(a)), seg=12)
p.paint_fn(lambda q, n: q.y > TOP - 0.05 or (q.y > EDGE - 0.1 and q.y < EDGE + 0.02 and math.hypot(q.x, q.z) > R - 0.06), 0xfffaf0)
p.layer('skin')
p.extras['outline'] = 0.022
p.build()
