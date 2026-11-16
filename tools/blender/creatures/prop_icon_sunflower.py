"""Home icon for Grow a flower: a sunflower growing out of a soil mound (the game plants it in a terracotta prop_pot).
Soil mound radius 0.62 with its top at y ~0.06; a gently curved stem, two leaves, a big golden flower head (~1.2
across) facing the viewer at y ~1.75, with a brown seed centre. Base at y 0."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

SOIL, SOIL_D, STEM, LEAF, LEAF_D = 0x7a4f2e, 0x5e3a20, 0x4f9e3a, 0x62c84a, 0x46a83c
PET, PET_D, SEED, SEED_L = 0xffd23f, 0xf5a623, 0x7a4a24, 0xa86b3c
FY, FZ = 1.78, 0.16
p = Prop('prop_icon_sunflower', base=SOIL, target_faces=1200, voxel=0.016)
p.blob((0, 0.0, 0), (0.62, 0.07, 0.62), group='soil')
for k, (x, z) in enumerate([(-0.3, 0.25), (0.35, 0.1), (0.05, -0.35), (-0.25, -0.2)]):
    p.blob((x, 0.05, z), (0.12, 0.05, 0.1), group='clod%d' % k)
p.paint_fn(lambda q, n: n.y < 0.3, SOIL_D)

p.layer('plant', base=STEM, target_faces=1800, voxel=0.014)
stem = [(0, 0.0, 0), (0.06, 0.5, 0.02), (0.02, 1.1, 0.06), (0, FY - 0.15, FZ - 0.08)]
p.curve(stem, [0.075, 0.07, 0.065, 0.06], group='stem', per=5)
LEAVES = []
for s, y, L, ang in ((-1, 0.5, 0.5, 28), (1, 0.85, 0.46, 22)):
    a = math.radians(ang)
    d = (s * math.cos(a), math.sin(a))
    c = (s * 0.06 + d[0] * L * 0.55, y + d[1] * L * 0.55, 0.06)
    p.blob(c, (L * 0.5, 0.16, 0.04), rot=(-12, 0, s * ang), group='leaf%d' % s)
    p.blob((s * 0.06 + d[0] * L * 0.92, y + d[1] * L * 0.92, 0.07), (0.1, 0.06, 0.03), rot=(-12, 0, s * ang), group='leaf%d' % s)
    p.tube([(s * 0.03, y - 0.04, 0.03), (s * 0.06 + d[0] * 0.12, y + d[1] * 0.12, 0.05)], 0.03, rseg=6)
    LEAVES.append((s, y, d, L))


def midrib(q, n):
    for s, y, d, L in LEAVES:
        u = (q.x - s * 0.06) * d[0] + (q.y - y) * d[1]
        v = -(q.x - s * 0.06) * d[1] + (q.y - y) * d[0]
        if 0.08 < u < L * 0.9 and abs(v) < 0.018 and n.z > 0.3:
            return True
    return False


p.paint_fn(lambda q, n: abs(q.x) > 0.1 and n.z >= -0.2, LEAF)
p.paint_fn(lambda q, n: abs(q.x) > 0.1 and n.z < -0.2, LEAF_D)
p.paint_fn(midrib, LEAF_D)

p.layer('petals', base=PET, target_faces=1700, voxel=0.013)
PETAL = [(0, 0), (0.06, 0.05), (0.1, 0.16), (0.1, 0.27), (0.07, 0.35), (0.0, 0.39), (-0.07, 0.35), (-0.1, 0.27), (-0.1, 0.16), (-0.06, 0.05)]


def petal(a, r0, scale, z, th, tilt):
    """a flat rounded petal pointing out at angle a (0 = up), base at radius r0, tilted forward by tilt"""
    ca, sa = math.cos(a), math.sin(a)
    cy = 0.2 * scale
    def P(x, y, dz):
        x, y = x * scale, y * scale
        rr = r0 + y
        zz = z + dz + tilt * y
        return (rr * sa + x * ca, FY + rr * ca - x * sa, zz)
    m = len(PETAL)
    verts = [P(0, 0.2, -th / 2)] + [P(x, y, -th / 2) for x, y in PETAL] + [P(0, 0.2, th / 2)] + [P(x, y, th / 2) for x, y in PETAL]
    k = m + 1
    faces = []
    for i in range(m):
        j = (i + 1) % m
        faces += [(0, 1 + j, 1 + i), (k, k + 1 + i, k + 1 + j), (1 + i, 1 + j, k + 1 + j, k + 1 + i)]
    p.mesh(verts, faces)


NP = 11
for i in range(NP):
    petal(math.tau * i / NP, 0.24, 1.0, FZ, 0.06, 0.12)
for i in range(NP):
    petal(math.tau * (i + 0.5) / NP, 0.22, 0.85, FZ - 0.07, 0.05, 0.05)
p.paint_fn(lambda q, n: q.z < FZ - 0.045 + 0.05 * max(0, math.hypot(q.x, q.y - FY) - 0.22), PET_D)

p.layer('centre', base=SEED, target_faces=900, voxel=0.012)
p.blob((0, FY, FZ + 0.02), (0.3, 0.3, 0.1), group='c')
p.paint_fn(lambda q, n: math.hypot(q.x, q.y - FY) > 0.22, SEED_L)
for k in range(7):
    a = math.tau * k / 7 + 0.3
    p.paint('dot%d' % k, (0.12 * math.sin(a), FY + 0.12 * math.cos(a), FZ + 0.12), (0.03, 0.03, 0.06), SEED_L)
p.layer('skin')
p.bone('body', (0, 0, 0), (0, 2.2, 0))
p.extras['outline'] = 0.024
p.build()
