"""Pip's beach sun hat (worn on Pip's head bone, see app/src/engine/piphat.js). A soft coral sun hat: a round crown that
fits over Pip's head (opening 0.84 x 0.76 at y 0, so Pip's head - 0.74 x 0.64 at the wearing height - stays inside), a wide
gently drooping brim (radius ~1.3) with a stitched ring, a cream band and a pink flower tucked on the right-front.
Hat space: base of the crown at y 0, front +z."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded
from mathutils import Vector, Matrix

CORAL, CORAL_D, CORAL_L, CREAM, PINK, PINK_D, YEL = 0xff7466, 0xe85a50, 0xff8f80, 0xfff3dc, 0xff8fc0, 0xe8609a, 0xffd23f
SZ = 0.9   # crown and brim are a touch narrower front-to-back, like the head
p = Prop('prop_pip_sunhat', base=CORAL, target_faces=2400, voxel=0.013)
# crown: a soft dome
p.lathe(rounded([(0, -0.02), (0.84, -0.02), (0.83, 0.18), (0.74, 0.38), (0.5, 0.52), (0, 0.55)], 0.12, n=5), scale=(1, SZ), seg=56)
# brim: a soft disc that droops toward its edge (a closed cross-section loop, ~0.055 thick, rounded rim)
top = [(0.78, 0.07), (0.95, 0.055), (1.1, 0.02), (1.22, -0.03), (1.3, -0.075)]
bot = [(r, y - 0.055) for r, y in top]
p.lathe(rounded(top + [(1.33, -0.105)] + list(reversed(bot)), 0.025, n=2, closed=True), scale=(1, SZ), seg=64, closed=True)
p.paint_fn(lambda q, n: n.y < -0.4, CORAL_D)
# a stitched ring around the brim and a lighter top on the crown
p.paint_fn(lambda q, n: n.y > 0.4 and 1.1 < math.hypot(q.x, q.z / SZ) < 1.135 and (int(math.atan2(q.x, q.z) * 30) % 2 == 0), CORAL_L)
p.paint_fn(lambda q, n: q.y > 0.47 and n.y > 0.6, CORAL_L)

# band
p.layer('band', base=CREAM, target_faces=700, voxel=0.011)
p.lathe([(0.81, 0.04), (0.86, 0.04), (0.855, 0.19), (0.81, 0.19)], scale=(1, SZ), seg=56, closed=True)
p.paint_fn(lambda q, n: n.y < -0.5, 0xeadcc0)

# flower on the band, facing out at 50 degrees right of front
A = math.radians(50)
OUT = Vector((math.sin(A), 0.25, math.cos(A) * SZ)).normalized()
C0 = Vector((0.87 * math.sin(A), 0.14, 0.87 * math.cos(A) * SZ)) + OUT * 0.05
M = Vector((0, 0, 1)).rotation_difference(OUT).to_matrix()   # flower local +z -> OUT
def P(x, y, z):
    return tuple(C0 + M @ Vector((x, y, z)))
def R(a):
    m = M @ Matrix.Rotation(a, 3, 'Z')
    return tuple(math.degrees(v) for v in m.to_euler('XYZ'))
p.layer('flower', base=PINK, target_faces=900, voxel=0.009)
for i in range(5):
    a = math.tau * i / 5 + 0.3
    p.blob(P(0.16 * math.cos(a), 0.16 * math.sin(a), 0), (0.13, 0.11, 0.035), rot=R(a), group='pt%d' % i)
cen = Vector(P(0, 0, 0))
p.paint_fn(lambda q, n: (Vector(q) - cen).length < 0.1, PINK_D)
p.layer('heart', base=YEL, target_faces=200, voxel=0.008)
p.blob(P(0, 0, 0.035), (0.06, 0.06, 0.04), group='c')
p.layer('skin')
p.bone('body', (0, 0, 0), (0, 0.55, 0))
p.extras['outline'] = 0.02
p.build()
