"""Clover bunch (Who says moo? cow and sheep treats). ~0.55 across, origin at the bottom: a low clump of five
three-leaf clovers on short stalks, each leaflet a clean chunky heart (notch outward) with the pale chevron real
clover has, and a round pink clover flower (a globe of little florets, deeper pink at the base) on its own stalk."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop
from mathutils import Vector

LEAF, LEAF_D, CHEV, STALK = 0x5cc455, 0x46a843, 0xa6e690, 0x6fb84a
p = Prop('prop_clover', base=LEAF, target_faces=2600, voxel=0.0055, smooth=3)
p.quadriflow = False
p.resolution = 0.008

# heart outline: tip at u = 0 (the stalk end), the notch at the outer end; u along the leaf, v across
HEART = []
for i in range(36):
    t = math.tau * i / 36
    hx = 16 * math.sin(t) ** 3
    hy = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
    HEART.append(((hy + 17) / 29.0, hx / 32.0))          # u 0..1, v -0.5..0.5
LEAVES = []      # (centre base, d, side, nrm, L) for painting


def leaflet(base, d, side, nrm, L, W, T=0.013, cup=1.2):
    n = len(HEART)
    verts = []
    for s in (-1, 1):
        for u, v in HEART:
            uu, vv = u * L, v * W * 2
            lift = cup * vv * vv + 0.25 * cup * (uu * 0.4) ** 2      # cupped a little upward at the edges
            pnt = base + d * uu + side * vv + nrm * (lift + s * T * (1 - 0.5 * u))
            verts.append(tuple(pnt))
    faces = [tuple(range(n))[::-1], tuple(range(n, 2 * n))] + [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)]
    p.mesh(verts, faces)
    LEAVES.append((base, d, side, nrm, L, W))


# five clovers: (direction around y, tilt from up, distance out, height)
CL = [(-0.95, 0.62, 0.13, 0.12), (0.95, 0.6, 0.13, 0.13), (0.0, 0.45, 0.1, 0.2), (3.14, 0.55, 0.12, 0.16)]
for ci, (ay, tilt, dist, h) in enumerate(CL):
    c = Vector((math.sin(ay) * dist, h, math.cos(ay) * dist))
    nrm = Vector((math.sin(ay) * math.sin(tilt), math.cos(tilt), math.cos(ay) * math.sin(tilt))).normalized()
    t1 = nrm.cross(Vector((0, 1, 0))).normalized()
    t2 = nrm.cross(t1).normalized()
    for k in range(3):
        a = k * math.tau / 3 + ci * 1.1 + 0.5
        d = (t1 * math.cos(a) + t2 * math.sin(a)).normalized()
        side = nrm.cross(d).normalized()
        leaflet(c - d * 0.006, d, side, nrm, 0.15, 0.072, cup=0.6)
    p.capsule((0, 0.0, 0), tuple(c - nrm * 0.01), 0.016, group='st%d' % ci)


def chevron(q, n):
    for base, d, side, nrm, L, W in LEAVES:
        r = Vector(q) - base
        h = r.dot(nrm)
        if abs(h) > 0.06:
            continue
        u, v = r.dot(d) / L, r.dot(side) / (W * 2)
        if 0.15 < u < 0.85 and abs(v) < 0.34 and abs(u - (0.34 + 0.8 * abs(v))) < 0.085:
            return True
    return False


def underside(q, n):
    for base, d, side, nrm, L, W in LEAVES:
        r = Vector(q) - base
        if -0.02 < r.dot(d) < L * 1.05 and abs(r.dot(side)) < W * 1.1 and abs(r.dot(nrm)) < 0.05:
            return Vector(n).dot(nrm) < -0.3
    return False


p.paint_fn(lambda q, n: q.y < 0.07, STALK)
p.paint_fn(underside, LEAF_D)
p.paint_fn(lambda q, n: chevron(q, n) and not underside(q, n), CHEV)

p.layer('flower', base=0xff9ec6, target_faces=1400, voxel=0.0045)
FC = Vector((0.0, 0.3, 0.02))
p.blob(tuple(FC), (0.048, 0.044, 0.048), group='fl')
golden = 2.39996
for i in range(30):
    yy = 1 - (i + 0.5) / 30 * 1.35                   # top hemisphere and a bit below the equator
    rr = math.sqrt(max(0.0, 1 - yy * yy))
    a = i * golden
    dvec = Vector((rr * math.cos(a), yy, rr * math.sin(a))).normalized()
    tip = FC + dvec * 0.075
    p.capsule(tuple(FC + dvec * 0.035), tuple(tip), 0.017, r2=0.011, group='fl', steps=3)
p.paint_fn(lambda q, n: q.y < FC.y - 0.02, 0xe8578f)
p.paint_fn(lambda q, n: (Vector(q) - FC).length > 0.072 and q.y > FC.y - 0.01, 0xffc4dc)
p.layer('fstalk', base=STALK, target_faces=160, voxel=0.006)
p.capsule((0, 0.0, 0), (0.0, 0.25, 0.02), 0.016, group='fs')
p.blob((0.0, 0.235, 0.02), (0.05, 0.016, 0.05), group='calyx')
p.layer('skin')
p.bone('body', (0, 0, 0), (0, 0.35, 0))
p.extras['outline'] = 0.008
p.build()
