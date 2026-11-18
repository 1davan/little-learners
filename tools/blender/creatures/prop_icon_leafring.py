"""Autumn pedestal trim (home menu): seven fallen leaves (orange, red, yellow) lying round the rim of a home pedestal,
a couple drooping over the edge. In pedestal space: the leaves ride the soft top at radius ~1.15, y ~0.23."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop

LEAF = [(0, 0), (0.07, 0.04), (0.12, 0.12), (0.13, 0.22), (0.1, 0.31), (0.05, 0.38), (0.0, 0.42), (-0.05, 0.38), (-0.1, 0.31), (-0.13, 0.22), (-0.12, 0.12), (-0.07, 0.04)]
COLS = [(0xff8a1f, 0xd96a10), (0xe8503a, 0xbb3524), (0xffc23a, 0xe09a18)]
p = Prop('prop_icon_leafring', base=0xff8a1f, target_faces=4000, voxel=0.009)
SPOTS = [(k / 10 * math.tau, 1.13 + 0.05 * ((k * 3) % 4) / 3, 0.0) for k in range(10)]
leaves = []
for k, (a, r, droop) in enumerate(SPOTS):
    yaw = a + math.pi / 2 + 0.28 * (1 if k % 2 else -1)       # lying along the ring, alternately tipped in / out
    s = 1.6 + 0.15 * ((k * 37) % 5) / 4
    cx, cz = r * math.sin(a), r * math.cos(a)
    dx, dz = math.sin(yaw), math.cos(yaw)       # leaf axis on the ground
    nx, nz = math.cos(yaw), -math.sin(yaw)
    def P(x, y, dy, cx=cx, cz=cz, dx=dx, dz=dz, nx=nx, nz=nz, s=s):
        x, y = x * s, (y - 0.21) * s
        px, pz = cx + dx * y + nx * x, cz + dz * y + nz * x
        rr = math.hypot(px, pz)
        h = 0.235 - max(0, rr - 1.3) * 0.9 + 0.12 * x * x / s      # lies on the top, drops over the edge, cupped
        return (px, h + dy, pz)
    m = len(LEAF)
    th = 0.05
    verts = [P(0, 0.21, -th / 2)] + [P(x, y, -th / 2) for x, y in LEAF] + [P(0, 0.21, th / 2)] + [P(x, y, th / 2) for x, y in LEAF]
    kk = m + 1
    faces = []
    for i in range(m):
        j = (i + 1) % m
        faces += [(0, 1 + j, 1 + i), (kk, kk + 1 + i, kk + 1 + j), (1 + i, 1 + j, kk + 1 + j, kk + 1 + i)]
    p.mesh(verts, faces)
    leaves.append((cx, cz, dx, dz, nx, nz, s, k))
for cx, cz, dx, dz, nx, nz, s, k in leaves:
    c, cd = COLS[k % 3]
    p.paint_fn(lambda q, n, cx=cx, cz=cz: math.hypot(q.x - cx, q.z - cz) < 0.42, c)
    def rib(q, n, cx=cx, cz=cz, dx=dx, dz=dz, nx=nx, nz=nz, s=s):
        u = (q.x - cx) * dx + (q.z - cz) * dz
        v = (q.x - cx) * nx + (q.z - cz) * nz
        return abs(v) < 0.02 and -0.17 * s < u < 0.17 * s and n.y > 0.3
    p.paint_fn(rib, cd)
p.bone('body', (0, 0, 0), (0, 0.3, 0))
p.extras['outline'] = 0.016
p.build()
