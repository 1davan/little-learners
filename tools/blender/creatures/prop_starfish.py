"""Starfish (beach sand, Patterns / Where / More items). A puffy five-armed star of radius 1 in the XY plane facing
+z (thickness along z, back flat at z = -0.08), tintable (painted white); cream bumps along the arms in layer 'dots'.
scenery.js scales it to the asked radius and lays it flat on the sand."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from skit import SProp, dome_profile

p = SProp('prop_starfish', base=0xffffff)
NT, NR = 60, 6


def Rof(t):
    k = abs(math.cos(t * 2.5 - math.pi * 1.25))     # arms at 90 deg and every 72 deg
    return 0.42 + 0.58 * k ** 1.6


verts, faces = [], []
verts.append((0, 0, 0.26))           # top centre
grid = {}
for i in range(1, NR + 1):
    f = i / NR
    for j in range(NT):
        t = j / NT * math.tau
        R = Rof(t)
        r = R * f
        h = 0.26 * (1 - f ** 2.2) ** 0.55 * (0.75 + 0.25 * R) + 0.02
        grid[(i, j)] = len(verts)
        verts.append((r * math.cos(t), r * math.sin(t), h))
for j in range(NT):
    faces.append((0, grid[(1, j)], grid[(1, (j + 1) % NT)]))
for i in range(1, NR):
    for j in range(NT):
        j2 = (j + 1) % NT
        faces.append((grid[(i, j)], grid[(i + 1, j)], grid[(i + 1, j2)], grid[(i, j2)]))
# underside: the rim drops to a flat back
bot = len(verts)
for j in range(NT):
    x, y, z = verts[grid[(NR, j)]]
    verts.append((x * 0.96, y * 0.96, -0.06))
verts.append((0, 0, -0.08))
c = len(verts) - 1
for j in range(NT):
    j2 = (j + 1) % NT
    faces.append((grid[(NR, j)], bot + j, bot + j2, grid[(NR, j2)]))
    faces.append((c, bot + j2, bot + j))
p.mesh(verts, faces)
p.layer('dots', base=0xfff4e0)
for a in range(5):
    t = math.pi / 2 + a * math.tau / 5
    for k, rr in enumerate((0.3, 0.52, 0.74)):
        R = 1.0
        h = 0.26 * (1 - (rr / R) ** 2.2) ** 0.55 + 0.02
        for s in ((0,) if k == 2 else (-1, 1)):
            tt = t + s * 0.11 / max(rr, 0.2) * (1 if k < 2 else 0)
            p.lathe(dome_profile(0.06 - k * 0.01, 0.05, n=3), pos=(rr * math.cos(tt), rr * math.sin(tt), h - 0.02), rot=(90, 0, 0), seg=8)
p.layer('skin')
p.extras['outline'] = 0.02
p.build()
