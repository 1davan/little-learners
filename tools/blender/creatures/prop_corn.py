"""Corn on the cob (Share the snacks, Who says moo? hen treats). Centred on the origin, the cob points up: a plump golden cob
(y -0.4 .. +0.46, radius 0.18) with rows of bumpy kernels (crisp darker gaps) and three green husk leaves wrapped round
its bottom half, peeling outward at their tips, and a little stalk stub underneath."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

KERN, GAP, TIP = 0xffd23f, 0xe0a21c, 0xffe27a
HUSK, HUSK_D = 0x8fd45c, 0x5faf42
p = Prop('prop_corn', base=KERN, target_faces=1300, voxel=0.009, smooth=2)
prof = rounded([(0.0, -0.42), (0.13, -0.4), (0.175, -0.25), (0.182, 0.05), (0.168, 0.25), (0.13, 0.4), (0.06, 0.47), (0.0, 0.48)], 0.06, n=5)


def r_of(y):
    if y <= prof[0][1]:
        return 0.0
    for (r0, y0), (r1, y1) in zip(prof, prof[1:]):
        if y0 <= y <= y1:
            return r0 + (r1 - r0) * (y - y0) / max(1e-6, y1 - y0)
    return 0.0


COLS, KH = 10, 0.088     # kernels round the cob, kernel height


def cell(a, y):
    """(u, v) in [0,1) inside the kernel cell at angle a, height y (rows staggered)."""
    fa = (a / math.tau) * COLS
    i = math.floor(fa)
    u = fa - i
    v = (y + 0.5 + (KH * 0.5 if i % 2 else 0)) / KH
    return u, v - math.floor(v)


def bump(a, y):
    u, v = cell(a, y)
    du, dv = (u - 0.5) * 2, (v - 0.5) * 2
    return max(0.0, 1 - (du ** 4 + dv ** 4)) ** 0.6


SEG, NY = 84, 130
ys = [-0.42 + 0.9 * k / NY for k in range(NY + 1)]
verts, faces = [], []
for y in ys[1:-1]:
    for i in range(SEG):
        a = math.tau * i / SEG
        r = r_of(y)
        if -0.36 < y < 0.43:
            r += 0.02 * bump(a, y) * min(1, r / 0.1)
        verts.append((r * math.sin(a), y, r * math.cos(a)))
nr = len(ys) - 2
for k in range(nr - 1):
    for i in range(SEG):
        j = (i + 1) % SEG
        faces.append((k * SEG + i, k * SEG + j, (k + 1) * SEG + j, (k + 1) * SEG + i))
bot = len(verts); verts.append((0, ys[0], 0))
top = len(verts); verts.append((0, ys[-1], 0))
for i in range(SEG):
    j = (i + 1) % SEG
    faces.append((bot, j, i))
    faces.append((top, (nr - 1) * SEG + i, (nr - 1) * SEG + j))
p.mesh(verts, faces)


def alt(q, n):    # every other kernel a touch deeper gold (a soft checker, no thin lines to go ragged)
    if not (-0.36 < q.y < 0.44):
        return False
    a = math.atan2(q.x, q.z) % math.tau
    i = math.floor((a / math.tau) * COLS)
    j = math.floor((q.y + 0.5 + (KH * 0.5 if i % 2 else 0)) / KH)
    return (i + j) % 2 == 0
p.paint_fn(alt, 0xffc21e)
p.paint_fn(lambda q, n: q.y > 0.44, TIP)

# husk leaves: three soft curved sheets hugging the bottom half of the cob, pointed tips peeling outward
p.layer('husk', base=HUSK, target_faces=900, voxel=0.009)


def sheet(a0, y0, y1, hw0, thick=0.022, flare=0.11, rows=16, cols=10):
    def at(t, sv, side):
        y = y0 + (y1 - y0) * t
        hw = hw0 * (1 - t ** 1.7) * (0.9 + 0.1 * math.sin(t * 3))
        a = a0 + sv * hw + 0.08 * math.sin(t * 2.5)
        rr = r_of(min(y, 0.4)) + 0.018 + flare * max(0, (t - 0.45) / 0.55) ** 1.8 + side * thick
        return (rr * math.sin(a), y, rr * math.cos(a))
    V, F = [], []
    for side in (0, 1):
        for i in range(rows + 1):
            for j in range(cols + 1):
                V.append(at(i / rows, -1 + 2 * j / cols, side))
    W = cols + 1
    off = (rows + 1) * W
    for i in range(rows):
        for j in range(cols):
            a, b, c, d = i * W + j, i * W + j + 1, (i + 1) * W + j + 1, (i + 1) * W + j
            F.append((a, d, c, b))
            F.append((off + a, off + b, off + c, off + d))
    for i in range(rows):      # the two long edges
        for j in (0, cols):
            a, d = i * W + j, (i + 1) * W + j
            F.append((a, off + a, off + d, d) if j == 0 else (a, d, off + d, off + a))
    for j in range(cols):      # bottom edge
        a, b = j, j + 1
        F.append((a, b, off + b, off + a))
    p.mesh(V, F)


for a0, y1, hw in [(0.25, 0.14, 1.2), (2.35, 0.04, 1.15), (4.3, 0.2, 1.2)]:
    sheet(a0, -0.43, y1, hw)
p.paint_fn(lambda q, n: q.y < -0.34, HUSK_D)
p.layer('stalk', base=0xb6d47a, target_faces=120, voxel=0.01)
p.cyl((0, -0.56, 0), 0.05, 0.12, r2=0.06, bevel=0.02, seg=12)
p.layer('skin')
p.bone('body', (0, -0.5, 0), (0, 0.48, 0))
p.extras['outline'] = 0.015
p.build()
