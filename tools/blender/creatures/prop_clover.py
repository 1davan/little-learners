"""Clover bunch (Who says moo? cow and sheep treats). ~0.55 across, origin at the bottom: five round three-leaf clovers
(each leaflet a soft heart) on short stalks, bunched together and facing up/out, and a pink clover flower on top."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop
from mathutils import Vector, Matrix

LEAF, LEAF_L, STALK = 0x56c050, 0x7fd666, 0x6fb84a
p = Prop('prop_clover', base=LEAF, target_faces=1000, voxel=0.008, smooth=4)
p.quadriflow = False
p.resolution = 0.011


def flat_blob(pos, axis, normal, size, group):
    yv = Vector(axis).normalized(); zv = Vector(normal); zv = (zv - yv * zv.dot(yv)).normalized(); xv = yv.cross(zv)
    e = Matrix((xv, yv, zv)).transposed().to_euler('XYZ')
    p.blob(tuple(pos), size, rot=tuple(math.degrees(v) for v in e), group=group)


# five clovers: (direction around y, tilt from up, distance out, height)
CL = [(-1.2, 0.85, 0.15, 0.1), (-0.25, 0.6, 0.13, 0.17), (0.8, 0.8, 0.16, 0.11), (2.0, 0.9, 0.14, 0.09), (3.3, 0.7, 0.12, 0.14)]
for ci, (ay, tilt, dist, h) in enumerate(CL):
    c = Vector((math.sin(ay) * dist, h, math.cos(ay) * dist))
    nrm = Vector((math.sin(ay) * math.sin(tilt), math.cos(tilt), math.cos(ay) * math.sin(tilt))).normalized()
    t1 = nrm.cross(Vector((0, 1, 0))).normalized()
    t2 = nrm.cross(t1).normalized()
    for k in range(3):      # each leaflet is a heart: two round lobes side by side, the dip toward the outside
        a = k * math.tau / 3 + ci * 0.7
        d = t1 * math.cos(a) + t2 * math.sin(a)
        side = nrm.cross(d).normalized()
        for s in (-1, 1):
            flat_blob(c + d * 0.07 + side * s * 0.032, d + side * s * 0.35, nrm, (0.042, 0.055, 0.016), 'c%dl%d' % (ci, k))
    p.capsule((0, 0.0, 0), tuple(c - nrm * 0.01), 0.02, group='st%d' % ci)
p.paint_fn(lambda q, n: q.y < 0.06, STALK)
p.paint_fn(lambda q, n: n.y > 0.75 and q.y > 0.12, LEAF_L)
p.layer('flower', base=0xff9ec6, target_faces=360, voxel=0.008)
for i in range(14):
    a = i * 2.39996
    r = 0.05 * math.sqrt(i + 0.5) / math.sqrt(14)
    p.blob((0.0 + r * math.cos(a), 0.29 + 0.035 * (1 - r / 0.05), 0.02 + r * math.sin(a)), (0.03, 0.04, 0.03), group='fl')
p.blob((0.0, 0.26, 0.02), (0.055, 0.045, 0.055), group='fl')
p.paint_fn(lambda q, n: q.y < 0.265, 0xff7fb0)
p.layer('fstalk', base=STALK, target_faces=80, voxel=0.008)
p.capsule((0, 0.0, 0), (0.0, 0.24, 0.02), 0.018, group='fs')
p.layer('skin')
p.bone('body', (0, 0, 0), (0, 0.35, 0))
p.extras['outline'] = 0.012
p.build()
