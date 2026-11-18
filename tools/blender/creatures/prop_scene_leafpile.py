"""A heap of autumn leaves (meadow autumn): a rounded heap (about 2.4 wide, 1.4 deep, 0.55 tall, flat on y = 0) built from
tiers of big, distinct overlapping leaves radiating from the middle - pointed oak-ish leaves with a few lobes, in orange, red and gold, each
with a darker centre vein - and two leaves that have slid off onto the ground in front."""
import sys, os, math, random
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop
from mathutils import Vector

ORANGE, RED, GOLD = 0xff8a1f, 0xe8503a, 0xffc23a
VEIN = {ORANGE: 0xd9661a, RED: 0xb8382c, GOLD: 0xe09a1a}
p = Prop('prop_scene_leafpile', base=0xd9662a, target_faces=4200, voxel=0.011, smooth=2)
p.quadriflow = False
A, C = 1.0, 0.62                             # heap half-width (x) and half-depth (z)
p.blob((0, 0.12, 0), (0.62, 0.3, 0.38), group='core')                          # hidden core so no gaps show through
p.blob((0, -0.5, 0), (1.6, 0.5, 1.2), group='core', negative=True)


def leaf_outline(L, W, lobes=3):
    """a pointed leaf with soft lobes: (u, v), u 0 (stem) .. 1 (tip), v across"""
    pts = []
    n = 28
    for i in range(n + 1):
        u = i / n
        w = W * math.sin(math.pi * u) ** 0.8 * (1 - 0.35 * u)
        w *= 1 + 0.16 * math.cos(u * math.pi * 2 * lobes)          # lobes
        pts.append((u * L, w))
    return pts + [(u, -v) for u, v in pts[::-1][1:-1]]


LEAVES = []


def leaf(pos, nrm, yaw, L, W, col, thick=0.05):
    nrm = Vector(nrm).normalized()
    ref = Vector((math.cos(yaw), 0, math.sin(yaw)))
    d = (ref - nrm * ref.dot(nrm)).normalized()
    side = nrm.cross(d).normalized()
    base = Vector(pos) - d * (L * 0.5)
    outl = leaf_outline(L, W)
    m = len(outl)
    verts = []
    for s in (-1, 1):
        for u, v in outl:
            curl = 0.06 * (u / L) ** 2 + 0.5 * v * v           # leaf edges and tip curl up a little
            verts.append(tuple(base + d * u + side * v + nrm * (curl + s * thick * 0.5)))
    faces = [tuple(range(m))[::-1], tuple(range(m, 2 * m))] + [(i, (i + 1) % m, m + (i + 1) % m, m + i) for i in range(m)]
    p.mesh(verts, faces)
    LEAVES.append((base, d, side, nrm, L, W, col))


random.seed(7)
cols = [ORANGE, RED, GOLD]
# the heap is built from tiers of big leaves radiating out from the middle like a rosette, each tier smaller, higher
# and steeper, so its silhouette is a pile of distinct scalloped leaves (no mound shows)
TIERS = [(0.03, 9, 0.28, 0.78, 14), (0.2, 7, 0.2, 0.64, 28), (0.37, 5, 0.12, 0.54, 36), (0.52, 3, 0.04, 0.46, 34)]
i = 0
for ti, (y, cnt, r0, L, tilt) in enumerate(TIERS):
    for k in range(cnt):
        az = (k + 0.5 * ti + 0.2 * random.random()) / cnt * math.tau
        dx, dz = math.cos(az), math.sin(az) * C / A
        dd = Vector((dx, 0, dz)).normalized()
        t = math.radians(tilt + 6 * random.random())
        nrm = Vector((0, math.cos(t), 0)) + dd * math.sin(t)                    # outer end lower: leaves slope outward
        centre = Vector((dd.x * (r0 + L * 0.42) * A, y + 0.02 * random.random(), dd.z * (r0 + L * 0.42) * A))
        leaf(tuple(centre), nrm, math.atan2(dd.z, dd.x) + random.uniform(-0.25, 0.25), L, 0.26 * L / 0.7, cols[i % 3])
        i += 1
# two leaves slid off onto the ground in front
leaf((1.1, 0.03, 0.62), (0.08, 1, 0.12), 0.6, 0.6, 0.22, RED)
leaf((-1.05, 0.03, 0.66), (-0.08, 1, 0.1), 2.4, 0.56, 0.2, GOLD)


def owner(q):
    best, bd = None, 1e9
    for lf in LEAVES:
        base, d, side, nrm, L, W, col = lf
        r = Vector(q) - base
        u, v, h = r.dot(d), r.dot(side), r.dot(nrm)
        if -0.03 < u < L + 0.03 and abs(v) < W * 1.25 and -0.06 < h < 0.12:
            # later (upper) leaves win where they overlap
            bd = h
            best = lf
    return best


def col_of(c):
    def f(q, n):
        lf = owner(q)
        return lf is not None and lf[6] == c
    return f


def vein(q, n):
    lf = owner(q)
    if lf is None:
        return False
    base, d, side, nrm, L, W, col = lf
    r = Vector(q) - base
    u, v = r.dot(d), r.dot(side)
    return 0.04 < u < L * 0.86 and abs(v) < 0.018 and Vector(n).dot(nrm) > 0.2


p.paint_fn(lambda q, n: owner(q) is None, 0xd4602a)         # the mound peeking between the leaves
for c in cols:
    p.paint_fn(col_of(c), c)
for c in cols:
    p.paint_fn(lambda q, n, c=c: vein(q, n) and owner(q)[6] == c, VEIN[c])
p.bone('body', (0, 0, 0), (0, 0.6, 0))
p.extras['outline'] = 0.02
p.build()
