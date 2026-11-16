"""Home icon for Shape house: a toy shape-sorter cottage. Cream walls, a chunky coral roof with a chimney, a round attic
window, and the three shapes (red circle, blue square, yellow triangle) as raised blocks on the front. ~2.4 wide, ~2.75
tall, base at y 0."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

WALL, WALL_D, ROOF, ROOF_D, ROOF_L = 0xfff1d6, 0xf0d9b0, 0xff6b5a, 0xd94a3d, 0xff8f7f
W, HW, D = 1.1, 1.62, 0.5     # half width, wall height, half depth


def prism(p, poly, z0, z1, center=(0, 0, 0)):
    """extrude a star-shaped 2D polygon [(x, y)...] from z0 to z1"""
    cx, cy, cz = center
    m = len(poly)
    verts = [(cx, cy, cz + z0)] + [(cx + x, cy + y, cz + z0) for x, y in poly] + [(cx, cy, cz + z1)] + [(cx + x, cy + y, cz + z1) for x, y in poly]
    k = m + 1
    faces = []
    for i in range(m):
        j = (i + 1) % m
        faces.append((0, 1 + j, 1 + i))
        faces.append((k, k + 1 + i, k + 1 + j))
        faces.append((1 + i, 1 + j, k + 1 + j, k + 1 + i))
    p.mesh(verts, faces)


p = Prop('prop_icon_house', base=WALL, target_faces=1800, voxel=0.018)
p.box((0, HW / 2, 0), (W, HW / 2, D), bevel=0.14)
# gable
gable = rounded([(-W + 0.04, HW - 0.15), (W - 0.04, HW - 0.15), (0, HW + 0.8)], 0.12, n=3, closed=True)
cen = (0, sum(y for _, y in gable) / len(gable))
prism(p, [(x, y - cen[1]) for x, y in gable], -D + 0.05, D - 0.05, center=(0, cen[1], 0))
p.paint_fn(lambda q, n: q.y < 0.16, WALL_D)
# doorstep shading under the eaves
p.paint_fn(lambda q, n: n.z < -0.5, WALL_D)

# roof: two chunky slabs meeting at the ridge, with eaves overhang, and a chimney
p.layer('roof', base=ROOF, target_faces=1400, voxel=0.018)
ang = math.degrees(math.atan2(0.8, W))
for s in (-1, 1):
    p.box((s * 0.6, HW + 0.43, 0), (0.72, 0.1, D + 0.14), rot=(0, 0, -s * ang), bevel=0.09)
p.tube([(0, HW + 0.82, -D - 0.12), (0, HW + 0.82, D + 0.12)], 0.1, rseg=10)
p.box((0.58, HW + 0.72, -0.12), (0.13, 0.25, 0.13), bevel=0.05)
p.box((0.58, HW + 0.96, -0.12), (0.17, 0.06, 0.17), bevel=0.04)
p.paint_fn(lambda q, n: n.y < -0.3, ROOF_D)
p.paint_fn(lambda q, n: q.y > HW + 0.88 and abs(q.x - 0.58) < 0.2, ROOF_L)

# attic window
p.layer('window', base=0x9ad8ff, target_faces=600, voxel=0.01)
p.cyl((0, HW + 0.22, D - 0.08), 0.19, 0.12, rot=(90, 0, 0), bevel=0.02, seg=28)
p.ring((0, HW + 0.22, D + 0.04), 0.19, 0.035, rot=(90, 0, 0), seg=32, rseg=6)
p.paint_fn(lambda q, n: math.hypot(q.x, q.y - HW - 0.22) > 0.165, 0xffffff)
p.paint('glint', (-0.06, HW + 0.29, D + 0.05), (0.05, 0.04, 0.05), 0xe8f7ff)

# the three shapes on the front wall
p.layer('shapes', base=0xffffff, target_faces=1500, voxel=0.011)
SY = 0.86
p.cyl((-0.66, SY, D - 0.06), 0.25, 0.16, rot=(90, 0, 0), bevel=0.05, seg=32)
p.box((0.0, SY, D + 0.02), (0.23, 0.23, 0.08), bevel=0.05)
tri = rounded([(-0.28, -0.2), (0.28, -0.2), (0, 0.29)], 0.06, n=3, closed=True)
prism(p, tri, D - 0.06, D + 0.1, center=(0.66, SY - 0.02, 0))
p.paint_fn(lambda q, n: q.x < -0.35, 0xff5a5a)
p.paint_fn(lambda q, n: abs(q.x) < 0.33, 0x4a90ff)
p.paint_fn(lambda q, n: q.x > 0.33, 0xffd23f)
p.layer('skin')
p.bone('body', (0, 0, 0), (0, 2.6, 0))
p.extras['outline'] = 0.026
p.build()
