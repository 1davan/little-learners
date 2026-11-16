"""Grow a flower: the four blooms, one model each (ONLY=prop_bloom_daisy tools/blender/build.sh prop_bloom builds one).
Each faces +z, its centre on the origin (the tulip's cup base sits at y -0.2), with a code face (face anchor on the centre)
and every petal on its own bone petal.1..n (in game petal1..; bone head at the petal's root) so the game can unfurl
the petals one by one by scaling the bones. A green calyx sits behind/below the centre where the stem joins.
  prop_bloom_daisy      twelve white spoon petals round a domed yellow eye (r ~0.62)
  prop_bloom_sunflower  two rings of pointed golden petals round a big brown seed disc (r ~0.82)
  prop_bloom_rose       two rings of round cupped pink petals round a deep pink heart (r ~0.58)
  prop_bloom_tulip      a red cup of five tall rounded petals (0.75 tall)"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop
from mathutils import Vector, Matrix

ONLY = [k for k in os.environ.get('ONLY', '').split(',') if k]


def flat(p, pos, axis, normal, size, group):
    yv = Vector(axis).normalized(); zv = Vector(normal); zv = (zv - yv * zv.dot(yv)).normalized(); xv = yv.cross(zv)
    e = Matrix((xv, yv, zv)).transposed().to_euler('XYZ')
    p.blob(tuple(pos), size, rot=tuple(math.degrees(v) for v in e), group=group)


def radial(p, n, r0, r1, radii, z, cup, prefix, phase=0.0, flatk=0.28, bones=None):
    """n petals from radius r0 to r1 in the xy plane (facing +z), each a flattened blob curve; cup bends tips toward +z."""
    for i in range(n):
        a = phase + i / n * math.tau + math.pi / 2
        d = Vector((math.cos(a), math.sin(a), 0))
        pts = []
        for k in range(len(radii)):
            t = k / (len(radii) - 1)
            r = r0 + (r1 - r0) * t
            pts.append(tuple(d * r + Vector((0, 0, z + cup * t * t))))
        g = '%s%d' % (prefix, i)
        p.curve(pts, radii, group=g, flat=flatk, per=4)
        if bones is not None:
            bones.append((pts[0], pts[-1], g))


def finish(p, bones, face_r, face_scale, outline=0.016, face_y=0.0, calyx=(0, 0, -0.1), face_z=None, calyx_r=0.16):
    p.layer('calyx', base=0x4f9e3a, target_faces=300, voxel=0.012)
    p.blob(calyx, (calyx_r, calyx_r, calyx_r * 0.65), group='calyx')
    p.layer('skin')
    p.bone('body', (0, -0.3, 0), (0, 0.3, 0))
    for i, (h, t, g) in enumerate(bones):
        p.bone('petal.%d' % (i + 1), h, t, parent='body', group=g)
    if face_z is None:
        p.face(center=(0, face_y, 0), radius=face_r, bone='body', faceScale=face_scale)
    else:
        p.face(center=(0, face_y, face_z), radius=face_r, bone='body', faceScale=face_scale, snap=False)
    p.extras['outline'] = outline
    p.build()


def daisy():
    p = Prop('prop_bloom_daisy', base=0xffffff, target_faces=2600, voxel=0.01, smooth=3)
    p.resolution = 0.012
    bones = []
    radial(p, 12, 0.15, 0.56, [0.035, 0.07, 0.085, 0.08, 0.055], 0.0, 0.06, 'p', bones=bones)
    p.paint_fn(lambda q, n: math.hypot(q.x, q.y) < 0.24, 0xf2f0ea)
    p.layer('eye', base=0xffd23f, target_faces=700, voxel=0.01)
    p.blob((0, 0, 0.04), (0.23, 0.23, 0.11), group='eye')
    p.paint_fn(lambda q, n: math.hypot(q.x, q.y) > 0.19, 0xffb52e)
    finish(p, bones, 0.23, 0.95)


def sunflower():
    p = Prop('prop_bloom_sunflower', base=0xffd23f, target_faces=3600, voxel=0.011, smooth=3)
    p.resolution = 0.012
    bones = []
    radial(p, 12, 0.3, 0.78, [0.05, 0.1, 0.11, 0.085, 0.04], 0.0, 0.07, 'p', bones=bones)
    radial(p, 12, 0.3, 0.72, [0.05, 0.095, 0.1, 0.08, 0.04], -0.05, 0.03, 'q', phase=math.tau / 24, bones=bones)
    p.paint_fn(lambda q, n: q.z < -0.03, 0xffb21e)
    p.layer('disc', base=0x8a5a2e, target_faces=900, voxel=0.011)
    p.blob((0, 0, 0.03), (0.38, 0.38, 0.12), group='disc')
    p.paint_fn(lambda q, n: math.hypot(q.x, q.y) > 0.3, 0x6b4226)
    finish(p, bones, 0.36, 1.45, outline=0.018)


def rose():
    # the heart (with the face) is the skin; two rings of big round petals behind it
    p = Prop('prop_bloom_rose', base=0xff5f9e, target_faces=700, voxel=0.01, smooth=3)
    p.resolution = 0.012
    p.blob((0, 0, 0.1), (0.2, 0.2, 0.13), group='heart')
    p.paint_fn(lambda q, n: math.hypot(q.x, q.y) > 0.155, 0xe8478a)
    p.layer('petals', base=0xffa3cc, target_faces=2400, voxel=0.01)
    bones = []
    radial(p, 5, 0.14, 0.43, [0.1, 0.17, 0.2, 0.17], -0.08, 0.04, 'p', bones=bones, flatk=0.3)
    radial(p, 5, 0.1, 0.3, [0.09, 0.14, 0.15, 0.12], -0.01, 0.06, 'q', phase=math.tau / 10, bones=bones, flatk=0.36)
    p.paint_fn(lambda q, n: q.z > -0.02 and math.hypot(q.x, q.y) < 0.36, 0xff80b6)
    finish(p, bones, 0.2, 0.95)


def tulip():
    p = Prop('prop_bloom_tulip', base=0xff4b6b, target_faces=2400, voxel=0.01, smooth=3)
    p.resolution = 0.012
    bones = []
    # the classic tulip: a front petal, two side petals leaning out with pointed tips, one behind - three points on top
    W = [0.07, 0.13, 0.165, 0.17, 0.15, 0.1, 0.035]
    for i, (lean, z, h, wk) in enumerate([(0.0, -0.1, 0.62, 1.0), (-0.42, -0.03, 0.6, 0.95), (0.42, -0.03, 0.6, 0.95), (0.0, 0.07, 0.56, 1.05)]):
        g = 'p%d' % i
        base = Vector((0.0, -0.2, z))
        d = Vector((math.sin(lean), math.cos(lean), 0))
        nrm = Vector((0, 0, 1)) if i != 0 else Vector((0, 0, -1))
        for k, w in enumerate(W):
            t = k / (len(W) - 1)
            pt = base + d * h * t + Vector((0, 0, 0.05 * math.sin(t * math.pi) * (1 if i == 3 else 0)))
            flat(p, pt, d, Vector((0, 0, 1)), (w * wk, max(0.05, h / (len(W) - 1) * 0.8), 0.06 + 0.02 * (1 - t)), g)
        bones.append((tuple(base), tuple(base + d * h), g))
    p.paint_fn(lambda q, n: q.y < -0.05, 0xe8384f)
    p.paint_fn(lambda q, n: q.z < -0.06 and q.y > -0.05, 0xd92f48)
    finish(p, bones, 0.27, 0.8, face_y=0.08, calyx=(0, -0.22, -0.02), calyx_r=0.08)


for name, fn in [('prop_bloom_daisy', daisy), ('prop_bloom_sunflower', sunflower), ('prop_bloom_rose', rose), ('prop_bloom_tulip', tulip)]:
    if not ONLY or name in ONLY:
        fn()
