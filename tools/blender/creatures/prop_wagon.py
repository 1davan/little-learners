"""Chunky toy beach wagon (Which has more? cart holder). 4.3 wide, 1.3 deep; the bed floor (where things stand) is at
y 0.62 and the inner side walls at x +-2.02. A deep tub of a body with rounded corners: the low front wall (top at
y 1.0) lets you see what is inside, the back and side walls stand a little higher; a soft white rolled rim runs round
the top. Four chunky wheels with yellow hubs; the pull handle is folded down in front, its grip resting on the sand
(it never points sideways into a friend). Tintable (makeHolder colour): the body is painted white in the skin; the
wooden floor, rim, wheels, hubs and handle are their own layers."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop

FY = 0.62                 # floor top
HX, HZ = 2.18, 0.66       # outer half sizes of the body
WT = 0.13                 # wall thickness
YF, YB = 0.84, 1.12        # front wall top (low: what is inside shows), back/side wall top
WOOD, WOOD_D, TYRE, HUB, RIM = 0xd39a5e, 0xb07a44, 0x4a3a48, 0xffd23f, 0xfffaf0


def rrect(hx, hz, r, n=6):
    pts = []
    for cx, cz, a0 in ((hx - r, hz - r, 0), (-(hx - r), hz - r, 90), (-(hx - r), -(hz - r), 180), (hx - r, -(hz - r), 270)):
        for k in range(n + 1):
            a = math.radians(a0 + 90 * k / n)
            pts.append((cx + r * math.cos(a), cz + r * math.sin(a)))
    return pts


def top_y(x, z):
    """the wall top height: low at the front, sweeping up round the sides to the back"""
    t = (HZ - z) / (2 * HZ)                  # 0 at the front, 1 at the back
    t = max(0.0, min(1.0, t * 1.25 - 0.05))
    s = t * t * (3 - 2 * t)
    return YF + (YB - YF) * s


p = Prop('prop_wagon', base=0xffffff, target_faces=3200, voxel=0.018, smooth=3)
p.quadriflow = False
# ---- the body: a hollow rounded tub (outer and inner walls, a solid bottom slab), tinted ----
R0 = 0.3
lo = rrect(HX, HZ, R0)
li = rrect(HX - WT, HZ - WT, R0 - WT * 0.8)
m = len(lo)
verts, faces = [], []
YB0 = FY - 0.16                             # underside of the body
for (x, z) in lo: verts.append((x, YB0 + 0.06, z))                # 0..m-1 outer bottom (slightly tucked)
for (x, z) in lo: verts.append((x, top_y(x, z), z))               # m..2m-1 outer top
for (x, z) in li: verts.append((x, top_y(x, z) - 0.01, z))        # 2m.. inner top
for (x, z) in li: verts.append((x, FY - 0.04, z))                 # 3m.. inner bottom (under the wooden floor)
for k in range(m):
    k2 = (k + 1) % m
    faces.append((k, k2, m + k2, m + k))                          # outer wall
    faces.append((m + k, m + k2, 2 * m + k2, 2 * m + k))           # top lip
    faces.append((2 * m + k, 2 * m + k2, 3 * m + k2, 3 * m + k))   # inner wall
faces.append(tuple(range(m))[::-1])                                # underside
faces.append(tuple(range(3 * m, 4 * m)))                           # inner floor cap
p.mesh(verts, faces)
# outer bottom edge soft: a slab under it
p.box((0, YB0 + 0.04, 0), (HX - 0.12, 0.06, HZ - 0.1), bevel=0.05)
# a darker band inside the walls so the inside reads as inside
p.paint_fn(lambda q, n: abs(q.x) < HX - WT * 0.5 and abs(q.z) < HZ - WT * 0.5 and q.y > FY - 0.05, 0xe2e2e2)

# ---- wooden floor planks ----
p.layer('wood', base=WOOD, target_faces=900, voxel=0.016)
p.quadriflow = False
p.box((0, FY - 0.05, 0), (HX - WT - 0.01, 0.05, HZ - WT - 0.01), bevel=0.02)
p.paint_fn(lambda q, n: (int((q.x + 3) / 0.62) % 2) == 1, WOOD_D)
# axle blocks under the body
for x in (-1.35, 1.35):
    p.box((x, 0.38, 0), (0.14, 0.09, HZ + 0.05), bevel=0.04)

# ---- the rolled rim round the top ----
p.layer('rim', base=RIM, target_faces=1300, voxel=0.014)
p.quadriflow = False
mid = rrect(HX - WT / 2, HZ - WT / 2, R0 - WT * 0.4, n=8)
p.tube([(x, top_y(x, z) + 0.02, z) for x, z in mid], 0.085, closed=True, rseg=10)

# ---- wheels and hubs ----
p.layer('wheels', base=TYRE, target_faces=2200)
for x in (-1.35, 1.35):
    for z in (-HZ - 0.1, HZ + 0.1):
        p.cyl((x, 0.36, z - 0.09), 0.36, 0.18, rot=(90, 0, 0), bevel=0.07, seg=32)
p.layer('hubs', base=HUB, target_faces=600, voxel=0.012)
for x in (-1.35, 1.35):
    for z in (-HZ - 0.1, HZ + 0.1):
        sz = 1 if z > 0 else -1
        p.blob((x, 0.36, z + sz * 0.1), (0.14, 0.14, 0.05), group='hub%d%d' % (x > 0, z > 0))

# ---- the handle, folded down in front: from a bracket under the front wall to a T-grip on the sand ----
p.layer('handle', base=TYRE, target_faces=800, voxel=0.014)
p.quadriflow = False
p.box((0, FY - 0.1, HZ + 0.02), (0.16, 0.08, 0.06), bevel=0.03)
p.tube([(0, FY - 0.1, HZ + 0.06), (0, 0.32, HZ + 0.55), (0, 0.1, HZ + 1.05)], 0.05, rseg=10)
p.layer('grip', base=0xff5a5a, target_faces=500, voxel=0.012)
p.quadriflow = False
p.capsule((-0.3, 0.1, HZ + 1.08), (0.3, 0.1, HZ + 1.08), 0.08, group='grip')
p.layer('skin')

p.bone('body', (0, 0, 0), (0, FY, 0))
p.extras['argMode'] = 'tint'
p.extras['argDefault'] = 0x4a90ff
p.extras['outline'] = 0.024
p.build()
