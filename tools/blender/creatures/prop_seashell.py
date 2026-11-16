"""Scallop shell for the beach games (pattern pieces, loose bits, toys; beach.js makeShell). Stands upright facing +z,
hinge at the bottom: about 1.7 wide, 0.95 tall, 0.4 deep, centred on the origin. Tintable (argMode 'tint'): the domed,
ribbed fan is white with light-grey rib grooves, so a tint gives a two-tone shell; the hinge ears are a shade darker.
Root bone is 'root' (not 'body'), so the game's idle sway never wobbles a prop. (prop_shell is the scenery's shell.)"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop

HY = -0.46                 # hinge
R, TH = 0.95, math.radians(64)
N = 9                      # ribs
D = 0.2                    # front dome depth
p = Prop('prop_seashell', base=0xffffff, target_faces=520, voxel=0.011, smooth=3)


def edge(t):               # fan radius at angle t (scalloped rim: each rib bulges a little)
    return R * (1 + 0.035 * math.cos(N * (t / TH) * math.pi * 0.5 * 2 + math.pi))


def zf(u, t):              # front surface height: a dome with ribs
    s = math.sin(math.pi * min(1, u) ** 0.85) ** 0.6 * (1 - 0.15 * u)
    side = max(0.0, math.cos((t / TH) * math.pi / 2)) ** 0.55
    rib = 0.05 * (0.5 + 0.5 * math.cos(N * (t / TH) * math.pi)) * min(1, u * 2.2)
    return (D * s + rib) * side


nt, nu = 64, 22
C0 = 0.035                 # rim half-thickness: the fan is a soft solid slab, never a knife edge
verts, faces = [], []
idx = {}
for si, side in enumerate((1, -1)):
    for i in range(nt + 1):
        t = -TH + 2 * TH * i / nt
        for j in range(nu + 1):
            u = j / nu
            r = edge(t) * u
            z = zf(u, t) + C0 if side > 0 else -0.4 * zf(u, t) - C0
            idx[si, i, j] = len(verts)
            verts.append((r * math.sin(t), HY + r * math.cos(t), z))
for i in range(nt):
    for j in range(nu):
        f = (idx[0, i, j], idx[0, i + 1, j], idx[0, i + 1, j + 1], idx[0, i, j + 1])
        b = (idx[1, i, j], idx[1, i, j + 1], idx[1, i + 1, j + 1], idx[1, i + 1, j])
        faces += [f, b]
for i in range(nt):                       # rim strip
    faces.append((idx[0, i, nu], idx[0, i + 1, nu], idx[1, i + 1, nu], idx[1, i, nu]))
for j in range(nu):                       # the two straight sides of the fan
    faces.append((idx[0, 0, j], idx[0, 0, j + 1], idx[1, 0, j + 1], idx[1, 0, j]))
    faces.append((idx[0, nt, j + 1], idx[0, nt, j], idx[1, nt, j], idx[1, nt, j + 1]))
p.mesh(verts, faces)
# hinge ears (the little wings either side of the hinge)
for s in (-1, 1):
    cx = s * 0.13
    p.mesh([(cx - 0.13, HY - 0.02, -0.04), (cx + 0.13, HY - 0.02, -0.04), (cx + 0.11 * s, HY + 0.17, -0.04), (cx - 0.02 * s, HY + 0.17, -0.04),
            (cx - 0.13, HY - 0.02, 0.07), (cx + 0.13, HY - 0.02, 0.07), (cx + 0.11 * s, HY + 0.17, 0.05), (cx - 0.02 * s, HY + 0.17, 0.05)],
           [(0, 1, 2, 3), (7, 6, 5, 4), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)])
p.blob((0, HY + 0.04, 0.02), (0.1, 0.08, 0.07), group='hinge')


def groove(q, n):
    t = math.atan2(q.x, q.y - HY)
    u = math.hypot(q.x, q.y - HY) / R
    return q.z > 0.015 and u > 0.22 and abs(t) < TH * 0.97 and math.cos(N * (t / TH) * math.pi) < -0.35


p.paint_fn(groove, 0xdedede)
p.paint_fn(lambda q, n: math.hypot(q.x, q.y - HY) < 0.2 or (abs(q.x) > 0.12 and q.y < HY + 0.2), 0xd2d2d2)
p.bone('root', (0, HY, 0), (0, HY + 0.9, 0))
p.extras['argMode'] = 'tint'
p.extras['argDefault'] = 0xff9ec0
p.extras['outline'] = 0.014
p.build()
