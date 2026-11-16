"""Autumn level hat (home menu): three glossy autumn leaves (orange, red, yellow) fanned up like a little crown, each a
pointed oval with a darker midrib and a stalk, with an acorn tucked in at the front. Base at y 0, ~0.8 across."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

LEAF = [(0, 0), (0.07, 0.04), (0.13, 0.13), (0.15, 0.24), (0.12, 0.35), (0.06, 0.44), (0.0, 0.5), (-0.06, 0.44), (-0.12, 0.35), (-0.15, 0.24), (-0.13, 0.13), (-0.07, 0.04)]
LEAVES = [(-0.62, 0xff8a1f, 0xd96a10, 0.85, -0.02), (0.0, 0xe8503a, 0xbb3524, 1.0, -0.06), (0.62, 0xffc23a, 0xe09a18, 0.85, -0.02)]
p = Prop('prop_icon_hat_leaves', base=0xff8a1f, target_faces=1300, voxel=0.01)


def leaf(a, scale, z, th=0.045, base=(0, 0.05)):
    ca, sa = math.cos(a), math.sin(a)
    def P(x, y, dz):
        x, y = x * scale, y * scale + 0.06
        # gentle cup: edges lift toward the viewer
        zz = z + dz + 0.25 * (x * x) / scale
        return (base[0] + y * sa + x * ca, base[1] + y * ca - x * sa, zz)
    m = len(LEAF)
    verts = [P(0, 0.22, -th / 2)] + [P(x, y, -th / 2) for x, y in LEAF] + [P(0, 0.22, th / 2)] + [P(x, y, th / 2) for x, y in LEAF]
    k = m + 1
    faces = []
    for i in range(m):
        j = (i + 1) % m
        faces += [(0, 1 + j, 1 + i), (k, k + 1 + i, k + 1 + j), (1 + i, 1 + j, k + 1 + j, k + 1 + i)]
    p.mesh(verts, faces)
    # stalk
    p.tube([(base[0], base[1] - 0.04, z), (base[0] + 0.07 * sa, base[1] + 0.07 * ca, z)], 0.022, rseg=6)


for a, c, cd, sc, z in LEAVES:
    leaf(a, sc, z)
for a, c, cd, sc, z in LEAVES:
    p.paint_fn(lambda q, n, a=a: abs(math.atan2(q.x, q.y - 0.02) - a) < 0.31, c)
    def rib(q, n, a=a, sc=sc):
        u = q.x * math.sin(a) + (q.y - 0.05) * math.cos(a)
        v = q.x * math.cos(a) - (q.y - 0.05) * math.sin(a)
        return 0.1 < u < 0.5 * sc and abs(v) < 0.013 and abs(n.z) > 0.4
    p.paint_fn(rib, cd)
p.paint_fn(lambda q, n: q.y < 0.1 and math.hypot(q.x, q.y) < 0.11, 0x8a5a3b)

p.layer('acorn', base=0xc98b4f, target_faces=500, voxel=0.01)
AX, AY, AZ = 0.17, 0.1, 0.12
p.blob((AX, AY, AZ), (0.1, 0.12, 0.1), group='nut')
p.blob((AX, AY - 0.11, AZ), (0.03, 0.03, 0.03), group='nut')
p.blob((AX, AY + 0.07, AZ), (0.12, 0.06, 0.12), group='cap')
p.tube([(AX, AY + 0.12, AZ), (AX + 0.03, AY + 0.18, AZ)], 0.018, rseg=6)
p.paint_fn(lambda q, n: q.y > AY + 0.04, 0x7a5230)
p.paint('shine', (AX - 0.04, AY - 0.01, AZ + 0.08), (0.025, 0.035, 0.03), 0xe8b07a)
p.layer('skin')
p.bone('body', (0, 0, 0), (0, 0.5, 0))
p.extras['outline'] = 0.02
p.build()
