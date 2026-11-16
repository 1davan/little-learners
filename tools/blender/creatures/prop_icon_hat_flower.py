"""Sunset level hat (home menu): a big pink tropical flower tucked on the head, its face tilted toward the viewer:
five round petals, a deep pink heart, a yellow stamen and two glossy leaves. Base at y 0, ~0.75 across."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded
from mathutils import Euler, Vector, Matrix

TILT = Matrix.Rotation(math.radians(38), 3, 'X')     # flower faces +y, tilted so it faces up-and-toward +z
C0 = Vector((0, 0.13, 0.02))
def P(x, y, z):
    return tuple(C0 + TILT @ Vector((x, y, z)))
def R(a):
    m = TILT @ Matrix.Rotation(a, 3, 'Y')
    return tuple(math.degrees(v) for v in m.to_euler('XYZ'))

p = Prop('prop_icon_hat_flower', base=0xff7aa8, target_faces=1300, voxel=0.011)
for i in range(5):
    a = math.tau * i / 5 + 0.35
    p.blob(P(0.2 * math.sin(a), 0.02, 0.2 * math.cos(a)), (0.15, 0.035, 0.17), rot=R(a), group='pt%d' % i)
cen = Vector(P(0, 0, 0))
p.paint_fn(lambda q, n: (Vector(q) - cen).length < 0.14, 0xff4f86)
p.paint_fn(lambda q, n: (Vector(q) - cen).length < 0.07, 0xd92f68)
p.layer('leaves', base=0x4fb84a, target_faces=700, voxel=0.012)
for s in (-1, 1):
    p.blob((s * 0.27, 0.07, -0.14), (0.18, 0.035, 0.09), rot=(0, s * 35, s * 12), group='lf%d' % s)
p.paint_fn(lambda q, n: n.y < 0, 0x3d9a3a)
p.layer('stamen', base=0xffd23f, target_faces=500, voxel=0.01)
s0, s1 = P(0, 0.03, 0), P(0.03, 0.2, 0.05)
p.tube([s0, s1], 0.02, rseg=6)
p.blob(s1, (0.05, 0.05, 0.05), group='tip')
p.layer('skin')
p.bone('body', (0, 0, 0), (0, 0.4, 0))
p.extras['outline'] = 0.02
p.build()
