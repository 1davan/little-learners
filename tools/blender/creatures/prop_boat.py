"""Little toy rowing boat (Where's Crab? boat). A real boat shape 4.0 long x 2.1 wide: a pointed bow at +x with a
rising sheer and cutwater, a broad rounded stern at -x, rim at y ~0.95 amidships, hollow (the friend sits inside on a
flat plank deck, top at y 0.44, well above the waterline at y ~0.24 so water never shows inside). Red hull with a
white stripe and a white gunwale ('trim'), plank deck, a bench across the stern, a stout mast and a big yellow pennant
with a white stripe ('flag')."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

RED, RED_D, RED_IN, WHITE, WOOD, YEL = 0xff5a4a, 0xe0453a, 0xb8443a, 0xfffaf0, 0xc98b4f, 0xffd23f
L, HW, T = 2.0, 1.05, 0.08            # half length, half width, wall thickness
NS, NP = 40, 24                        # stations along x, points round each half cross-section


def half_w(u):
    """plan half-width at u (0 = stern, 1 = bow): a broad rounded stern, fullest just aft of the middle, pointed bow"""
    return HW * max(0.0, math.sin(math.pi * (0.16 + 0.84 * u))) ** 0.62 + 0.004


def rim_y(u):
    return 0.95 + 0.16 * u ** 3 + 0.03 * (1 - u) ** 3


def keel_y(u):
    return 0.03 + 0.55 * u ** 5 + 0.06 * (1 - u) ** 4


def section(u, inset=0.0):
    """U cross-section points (z, y) from the left gunwale under the keel to the right gunwale"""
    w, top, bot = half_w(u) - inset, rim_y(u), keel_y(u) + inset
    w = max(w, 0.003)
    pts = []
    for k in range(NP + 1):
        ph = math.pi * k / NP
        s = math.sin(ph)
        pts.append((-w * math.cos(ph), top - (top - bot) * s ** 0.55))
    return pts


verts, faces = [], []
rings = []
for i in range(NS + 1):
    u = i / NS
    x = -L + 2 * L * u
    tin = T * min(1.0, (1 - u) * 6)          # the walls merge into a solid stem at the very bow
    loop = [(x, y, z) for z, y in section(u)] + [(x, y, z) for z, y in section(u, tin)[::-1]]
    rings.append(len(verts))
    verts += loop
m = 2 * (NP + 1)
for i in range(NS):
    a, b = rings[i], rings[i + 1]
    for k in range(m):
        k2 = (k + 1) % m
        faces.append((a + k, a + k2, b + k2, b + k))
faces.append(tuple(rings[0] + k for k in range(m))[::-1])
faces.append(tuple(rings[-1] + k for k in range(m)))
p = Prop('prop_boat', base=RED, target_faces=4800, voxel=0.018)
p.mesh(verts, faces)


def u_of(x):
    return min(1.0, max(0.0, (x + L) / (2 * L)))


def inside(q, n):
    u = u_of(q.x)
    w = half_w(u) - T * 0.6
    return abs(q.z) < w and q.y > keel_y(u) + T * 0.5 and (n.y > 0.4 or n.z * q.z < 0 or abs(q.z) < w - 0.02)


p.paint_fn(lambda q, n: q.y < 0.2 and not inside(q, n), RED_D)
p.paint_fn(inside, RED_IN)

p.layer('trim', base=WHITE, target_faces=2600, voxel=0.014)
# white gunwale running round the top edge, and a stripe along each side at the waterline height
gun = []
for i in range(NS + 1):
    u = i / NS
    gun.append((-L + 2 * L * u, rim_y(u) + 0.005, -(half_w(u) - T * 0.5)))
for i in range(NS, -1, -1):
    u = i / NS
    gun.append((-L + 2 * L * u, rim_y(u) + 0.005, half_w(u) - T * 0.5))
p.tube(gun[:-1], 0.075, closed=True, rseg=10)
for s in (-1, 1):
    st = []
    for i in range(2, NS - 3):
        u = i / NS
        top, bot, w = rim_y(u), keel_y(u), half_w(u)
        yb = 0.55 + 0.1 * u ** 3
        ph = math.asin(min(1.0, max(0.0, ((top - yb) / (top - bot)) ** (1 / 0.55))))
        st.append((-L + 2 * L * u, yb, s * (w * math.cos(ph) + 0.012)))
    p.tube(st, 0.05, rseg=8)
p.layer('wood', base=WOOD, target_faces=2400, voxel=0.014)
# floorboards: a deck following the hull plan (top 0.44), tucked into the walls
DY0, DY1 = 0.38, 0.44
deck = []
for i in range(2, NS - 4):
    u = i / NS
    sec = section(u, T)
    wd = max(abs(z) for z, y in sec if y <= DY1 + 0.02) if any(y <= DY1 + 0.02 for z, y in sec) else 0.0
    deck.append((-L + 2 * L * u, wd + 0.03))
poly = [(x, -w) for x, w in deck] + [(x, w) for x, w in deck[::-1]]
mm = len(poly)
p.mesh([(x, y, z) for y in (DY0, DY1) for x, z in poly],
       [tuple(range(mm)), tuple(range(2 * mm - 1, mm - 1, -1))] + [(i, (i + 1) % mm, mm + (i + 1) % mm, mm + i) for i in range(mm)])
bw = half_w(u_of(-1.15)) - T
p.box((-1.15, 0.7, 0), (0.2, 0.06, bw), bevel=0.04)                              # bench across the stern
p.cyl((-1.55, 0.3, 0), 0.07, 1.75, bevel=0.03, seg=16)                           # stout mast
p.paint_fn(lambda q, n: DY0 - 0.01 < q.y < DY1 + 0.02 and n.y > 0.7 and min(abs(q.z - k * 0.24) for k in (-3, -2, -1, 0, 1, 2, 3)) < 0.016, 0xa56a38)
p.paint_fn(lambda q, n: q.y > 0.75 and abs(q.x + 1.15) < 0.3 and n.y > 0.7, 0xd99a5c)
p.layer('flag', base=YEL, target_faces=700, voxel=0.01)
FX, FY0, FY1 = -1.52, 1.5, 2.0
p.mesh([(FX, FY1, -0.035), (FX, FY0, -0.035), (FX + 0.72, (FY0 + FY1) / 2, -0.035), (FX, FY1, 0.035), (FX, FY0, 0.035), (FX + 0.72, (FY0 + FY1) / 2, 0.035)],
       [(0, 1, 2), (3, 5, 4), (0, 3, 4, 1), (1, 4, 5, 2), (2, 5, 3, 0)])
p.blob((-1.55, 2.1, 0), (0.1, 0.1, 0.1), group='ball')
p.paint_fn(lambda q, n: 0.22 < q.x - FX < 0.34 and q.y < 2.05, WHITE)
p.paint_fn(lambda q, n: q.y > 2.02, 0xff5a4a)
p.layer('skin')
p.bone('body', (0, 0, 0), (0, 0.95, 0))
p.extras['outline'] = 0.026
p.build()
