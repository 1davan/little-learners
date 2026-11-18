"""Palm tree (beach scenery). A trunk of six flared, ringed segments leaning gently to +x (crown at about (1.05, 4.45)),
seven big arching fronds (each ~2.4 long, about as wide as the trunk is tall) with a raised midrib and deep leaflet notches (layer 'fronds', painted white/grey: scenery.js tints them
per season and flutters them about the crown), and four chunky coconuts (layer 'nuts')."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from skit import SProp, dome_profile
from mathutils import Vector, Matrix

BARK, BARK_D, NUT, NUT_D = 0xc48a54, 0xa06a3c, 0x7a5230, 0x5e3c22
p = SProp('prop_palm', base=BARK)
x = y = 0.0
for i in range(6):
    rb = 0.25 - i * 0.017
    lean = -0.08 * i
    prof = [(0, 0), (rb, 0), (rb * 0.94, 0.5), (rb * 1.2, 0.66), (rb * 1.14, 0.76), (rb * 0.9, 0.8), (0, 0.8)]
    p.lathe(prof, pos=(x, y, 0), rot=(0, 0, math.degrees(lean)), seg=12)
    y += 0.72
    x += 0.07 * i
CROWN = Vector((x + 0.02, y + 0.12, 0))
print('CROWN', tuple(CROWN))
p.paint_fn(lambda q, n: (n.y > 0.25), BARK_D)

p.layer('fronds', base=0xffffff)
NF = 7
for f in range(NF):
    az = f / NF * math.tau + 0.3
    d = Vector((math.cos(az), 0, math.sin(az)))
    side = Vector((-math.sin(az), 0, math.cos(az)))
    L = 2.35 + 0.25 * math.sin(f * 2.3)
    rise = 0.6 + 0.15 * math.cos(f * 1.7)
    N = 40
    top, bot = [], []
    for k in range(N + 1):
        u = k / N
        c = CROWN + d * (L * u) + Vector((0, rise * math.sin(math.pi * u * 0.75) - 1.35 * u * u, 0))
        w = 0.52 * math.sin(math.pi * min(1.0, u * 1.04)) ** 0.6 * (0.8 + 0.2 * math.cos(k * math.pi / 2) if 1 < k < N - 1 else 1.0)
        if k == 0:
            w = 0.04
        fold = 0.12 * w / 0.52
        mid = c + Vector((0, 0.05, 0))
        top.append([c - side * w - Vector((0, fold, 0)), mid, c + side * w - Vector((0, fold, 0))])
        bot.append([c - side * w - Vector((0, fold + 0.045, 0)), c - Vector((0, 0.04, 0)), c + side * w - Vector((0, fold + 0.045, 0))])
    verts, faces = [], []
    for k in range(N + 1):
        verts += [tuple(v) for v in top[k]] + [tuple(v) for v in bot[k]]
    for k in range(N):
        a, b = k * 6, (k + 1) * 6
        faces += [(a, b, b + 1, a + 1), (a + 1, b + 1, b + 2, a + 2)]                 # top
        faces += [(a + 3, a + 4, b + 4, b + 3), (a + 4, a + 5, b + 5, b + 4)]         # bottom
        faces += [(a, a + 3, b + 3, b), (a + 2, b + 2, b + 5, a + 5)]                 # edges
    e = N * 6
    faces += [(0, 1, 2, 5, 4, 3), (e + 0, e + 3, e + 4, e + 5, e + 2, e + 1)]
    p.mesh(verts, faces)
p.paint_fn(lambda q, n: n.y < -0.3, 0xd2d2d2)
p.layer('nuts', base=NUT)
for i in range(4):
    a = i * 1.65 + 0.4
    c = (CROWN.x + math.cos(a) * 0.26, CROWN.y - 0.36 - 0.06 * (i % 2), math.sin(a) * 0.26 + 0.08)
    p.lathe(dome_profile(0.22, 0.25, n=6, base=0), pos=c, rot=(180, 0, 0), seg=16)
    p.lathe(dome_profile(0.22, 0.2, n=5), pos=c, seg=16)
p.paint_fn(lambda q, n: n.y < -0.6, NUT_D)
p.layer('skin')
p.extras['outline'] = 0.025
p.build()
