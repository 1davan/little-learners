"""Beach towel lying flat (Pattern parade choices, Where's Crab?, Bear's nose). 3.0 x 2.0 (x by z), about 0.07 thick,
origin under the middle on the sand. Soft rounded corners and a gentle crumple; seven bands across x: four tinted
(argMode 'tint', the main skin) and three white bands on layer 'white'; little white tassels along both short ends."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop

W, D, T = 3.0, 2.0, 0.07
p = Prop('prop_towel', base=0xffffff, target_faces=1600, voxel=0.016, smooth=3)
p.quadriflow = False


def wave(x, z):
    return 0.012 * math.sin(x * 2.3 + 0.4) * math.cos(z * 1.7) + 0.008 * math.sin(z * 3.1 + x)


def slab(x0, x1, z0, z1, y0, y1, nx=8, nz=10):
    verts, faces = [], []
    idx = {}
    for side, yy in ((0, y0), (1, y1)):
        for i in range(nx + 1):
            for j in range(nz + 1):
                x = x0 + (x1 - x0) * i / nx; z = z0 + (z1 - z0) * j / nz
                idx[side, i, j] = len(verts)
                verts.append((x, yy + wave(x, z), z))
    for i in range(nx):
        for j in range(nz):
            faces.append((idx[1, i, j], idx[1, i, j + 1], idx[1, i + 1, j + 1], idx[1, i + 1, j]))
            faces.append((idx[0, i, j], idx[0, i + 1, j], idx[0, i + 1, j + 1], idx[0, i, j + 1]))
    for i in range(nx):
        faces.append((idx[0, i, 0], idx[1, i, 0], idx[1, i + 1, 0], idx[0, i + 1, 0]))
        faces.append((idx[0, i + 1, nz], idx[1, i + 1, nz], idx[1, i, nz], idx[0, i, nz]))
    for j in range(nz):
        faces.append((idx[0, 0, j + 1], idx[1, 0, j + 1], idx[1, 0, j], idx[0, 0, j]))
        faces.append((idx[0, nx, j], idx[1, nx, j], idx[1, nx, j + 1], idx[0, nx, j + 1]))
    p.mesh(verts, faces)


slab(-W / 2, W / 2, -D / 2, D / 2, 0.0, T, nx=30, nz=20)
for c in (-1, 1):                         # soften the corners a little (rounded blobs fill them)
    pass
bw = W / 7
p.layer('white', base=0xfffaf0, target_faces=1200, voxel=0.012)
p.quadriflow = False
for k in (1, 3, 5):
    x0 = -W / 2 + bw * k
    slab(x0, x0 + bw, -D / 2 + 0.002, D / 2 - 0.002, T - 0.012, T + 0.012, nx=4, nz=16)
p.layer('fringe', base=0xfffaf0, target_faces=600, voxel=0.01)
p.quadriflow = False
for s in (-1, 1):
    for j in range(9):
        z = -D / 2 + 0.14 + (D - 0.28) * j / 8
        x = s * (W / 2 + 0.01)
        p.tube([(x, T * 0.5 + wave(x, z), z), (x + s * 0.12, 0.025, z + 0.01 * (j % 2))], 0.022, rseg=6)
        p.blob((x + s * 0.13, 0.025, z + 0.01 * (j % 2)), (0.03, 0.025, 0.03), group='t%d%d' % (s, j))
p.layer('skin')
p.bone('root', (0, 0, 0), (0, 0.5, 0))
p.extras['argMode'] = 'tint'
p.extras['argDefault'] = 0x4ab0ff
p.extras['outline'] = 0.012
p.build()
