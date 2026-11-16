"""Little sailboat (beach sunset scenery). Hull 3.2 long (bow at +x), waterline near y 0, tintable (painted white);
a white gunwale, wooden deck, mast and boom and a yellow pennant in layer 'trim'; the mainsail (aft, layer 'sail') and
the jib (forward, layer 'sail2') are separate layers so each can be tinted."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from skit import SProp
from mathutils import Vector

p = SProp('prop_sailboat', base=0xffffff)
NS, NU = 16, 9
DECK = 0.38


def w_of(u):     # half beam along the hull, u 0 (stern) .. 1 (bow)
    return 0.6 * (math.sin(math.pi * (0.18 + 0.82 * u)) ** 0.75) if u < 0.999 else 0.0


def d_of(u):
    return 0.55 * (1 - 0.55 * u ** 2)


def sheer(u):
    return 0.12 * u ** 2.2 + 0.03 * (1 - u) ** 3


verts, faces, rings = [], [], []
for i in range(NS + 1):
    u = i / NS
    x = -1.6 + 3.2 * u
    w, d = max(w_of(u), 0.015), d_of(u)
    top = DECK + sheer(u)
    ring = []
    for j in range(NU + 1):
        a = math.pi * j / NU                       # 0 .. pi from +z side round the keel to -z
        ring.append(len(verts))
        verts.append((x, top - d * math.sin(a) ** 0.85, w * math.cos(a)))
    rings.append(ring)
for i in range(NS):
    for j in range(NU):
        faces.append((rings[i][j], rings[i][j + 1], rings[i + 1][j + 1], rings[i + 1][j]))
# deck (top) and transom (stern) caps
faces.append(tuple(rings[0][::-1]))
deck = [rings[i][0] for i in range(NS + 1)] + [rings[i][NU] for i in range(NS, -1, -1)]
faces.append(tuple(deck))
p.mesh(verts, faces, bevel=0.04)
p.paint_fn(lambda q, n: q.y < 0.04, 0xe6e6e6)
p.layer('trim', base=0xfffaf0)
pts = [(-1.6 + 3.2 * i / NS, DECK + sheer(i / NS) + 0.02, max(w_of(i / NS), 0.015) + 0.01) for i in range(NS + 1)]
pts += [(x, y, -z) for x, y, z in pts[::-1]]
p.tube(pts, 0.05, closed=True, rseg=6)
deck_pts = [(-1.6 + 3.2 * i / NS, max(w_of(i / NS) - 0.07, 0.0)) for i in range(1, NS - 1)]
p.prism([(x, z) for x, z in deck_pts] + [(x, -z) for x, z in deck_pts[::-1]], DECK + 0.0, DECK + 0.05, axis='y', bevel=0.015)   # deck
p.cyl((-0.15, DECK, 0), 0.06, 2.65, r2=0.045, seg=10, bevel=0.02)               # mast
p.box((-0.75, DECK + 0.42, 0), (0.62, 0.035, 0.035), bevel=0.015)               # boom
p.prism([(0, 0), (0.42, 0.12), (0, 0.24)], -0.015, 0.015, bevel=0.008, at=(-0.13, DECK + 2.48, 0))   # pennant
p.paint_fn(lambda q, n: q.y > DECK + 2.45 and q.x > -0.08, 0xffd23f)
p.paint_fn(lambda q, n: (abs(q.x + 0.15) < 0.08 and q.y > DECK + 0.08) or (q.y > DECK + 0.38 and q.y < DECK + 0.47 and q.x < -0.1) or (q.y < DECK + 0.07 and q.y > DECK + 0.005 and abs(q.z) < max(w_of(min(max((q.x + 1.6) / 3.2, 0), 1)) - 0.05, 0.0)), 0xc98a50)


def sail(x0, y0, x1, y1, x2, y2, belly, layer):
    """a softly billowed triangular sail between three corners in the XZ=0 plane (bellied toward +z)"""
    p.layer(layer, base=0xffffff)
    N = 7
    verts, faces = [], []
    A, B, C = Vector((x0, y0, 0)), Vector((x1, y1, 0)), Vector((x2, y2, 0))
    idx = {}
    for i in range(N + 1):
        for j in range(N + 1 - i):
            a, b = i / N, j / N
            c = 1 - a - b
            P = A * c + B * a + C * b
            bz = belly * 27 * a * b * c
            for s, dz in ((0, 0.02), (1, -0.02)):
                idx[(i, j, s)] = len(verts)
                verts.append((P.x, P.y, P.z + bz + dz))
    for s in (0, 1):
        for i in range(N):
            for j in range(N - i):
                t1 = (idx[(i, j, s)], idx[(i + 1, j, s)], idx[(i, j + 1, s)])
                faces.append(t1 if s == 0 else t1[::-1])
                if j < N - i - 1:
                    t2 = (idx[(i + 1, j, s)], idx[(i + 1, j + 1, s)], idx[(i, j + 1, s)])
                    faces.append(t2 if s == 0 else t2[::-1])
    edge = [(i, 0) for i in range(N + 1)] + [(N - j, j) for j in range(1, N + 1)] + [(0, j) for j in range(N - 1, 0, -1)]
    for k in range(len(edge)):
        e0, e1 = edge[k], edge[(k + 1) % len(edge)]
        faces.append((idx[(e0[0], e0[1], 0)], idx[(e0[0], e0[1], 1)], idx[(e1[0], e1[1], 1)], idx[(e1[0], e1[1], 0)]))
    p.mesh(verts, faces, bevel=0.012)
sail(-0.22, DECK + 0.5, -1.32, DECK + 0.5, -0.22, DECK + 2.42, 0.07, 'sail')
sail(-0.08, DECK + 0.3, 1.45, DECK + 0.22, -0.08, DECK + 2.2, 0.06, 'sail2')
p.layer('skin')
p.extras['outline'] = 0.024
p.build()
