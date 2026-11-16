"""Little meadow flowers (scenery makeFlower), three kinds, each a pair of layers: the green stem with leaves (and the
yellow eye) never tinted, and the petals painted white so makeFlower's colour tints them.
  skin / daisy_p   daisy: eight soft petals round a domed yellow eye, head tipped up toward the camera
  prim / prim_p    primrose: five wide heart petals round a small yellow eye
  tulip / tulip_p  tulip: a cup of six rounded petals on a straight stem with two long leaves
About 0.75 tall, flower head centred near (0, 0.53, 0) like the old ball flower."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop
from mathutils import Matrix, Vector

STEM, LEAF, EYE, EYE_L, PETAL, PETAL_IN = 0x4aa84a, 0x5cc45a, 0xffc53a, 0xffe27a, 0xffffff, 0xe6e6e6
HEAD = Vector((0, 0.53, 0.02))
TILT = math.radians(-22)          # head tipped back so its face looks up toward the camera
p = Prop('prop_scene_flower', base=STEM, target_faces=280, voxel=0.01, smooth=5)


def head_rot(az, cup):
    """rotation of a petal: cupped forward, spun to angle az round the eye, then the head's tilt"""
    M = Matrix.Rotation(TILT, 3, 'X') @ Matrix.Rotation(az, 3, 'Z') @ Matrix.Rotation(cup, 3, 'X')
    return tuple(math.degrees(a) for a in M.to_euler('XYZ'))


def at_head(x, y, z=0.0):
    return tuple(HEAD + Matrix.Rotation(TILT, 3, 'X') @ Vector((x, y, z)))


def stem(top, bend=0.03):
    pts = [(0, 0, 0), (bend, top * 0.35, 0.0), (bend * 0.5, top * 0.7, 0.01), (0, top, HEAD.z)]
    p.tube(pts, [0.03, 0.026, 0.024, 0.022], rseg=8)


def leaf(y, side, length=0.16, up=35, wid=0.06):
    a = math.radians(up)
    cx, cy = side * math.cos(a) * length * 0.55, y + math.sin(a) * length * 0.55
    p.blob((cx, cy, 0.02), (length * 0.55, wid, 0.022), rot=(0, 0, side * up), group='leaf%d%d' % (side, int(y * 100)))


def eye(r, h):
    p.blob(at_head(0, 0, 0.03), (r, r, h), rot=(math.degrees(TILT), 0, 0), group='eye')


def eye_paint(r):
    # the eye is yellow with a lighter cap on its face; the rest of this layer is stem green
    loc = lambda q: Matrix.Rotation(-TILT, 3, 'X') @ (q - Vector(at_head(0, 0, 0.03)))
    is_eye = lambda q: (loc(q).x / (r * 1.12)) ** 2 + (loc(q).y / (r * 1.12)) ** 2 + (loc(q).z / 0.07) ** 2 < 1 and loc(q).z > -0.035
    p.paint_fn(lambda q, n: is_eye(q), EYE)
    p.paint_fn(lambda q, n: is_eye(q) and math.hypot(loc(q).x, loc(q).y) < r * 0.5, EYE_L)


def petal_paint(r_in):
    p.paint_fn(lambda q, n: (q - Vector(at_head(0, 0, 0.0))).length < r_in, PETAL_IN)


# ---------- daisy ----------
stem(HEAD.y - 0.1)
leaf(0.13, 1); leaf(0.22, -1, length=0.14)
eye(0.075, 0.05)
eye_paint(0.075)
p.layer('daisy_p', base=PETAL, target_faces=400, voxel=0.008)
for k in range(8):
    az = k / 8 * math.tau
    d = 0.135
    p.blob(at_head(-math.sin(az) * d, math.cos(az) * d, -0.005), (0.05, 0.098, 0.028), rot=head_rot(az, math.radians(-12)), group='p%d' % k)
petal_paint(0.07)

# ---------- primrose ----------
p.layer('prim', base=STEM, target_faces=280, voxel=0.01)
stem(HEAD.y - 0.1, bend=-0.03)
leaf(0.1, -1, length=0.17, up=28, wid=0.07); leaf(0.16, 1, length=0.15, up=40)
eye(0.05, 0.035)
eye_paint(0.05)
p.layer('prim_p', base=PETAL, target_faces=400, voxel=0.008)
for k in range(5):
    az = k / 5 * math.tau
    d = 0.118
    p.blob(at_head(-math.sin(az) * d, math.cos(az) * d, -0.01), (0.075, 0.084, 0.028), rot=head_rot(az, math.radians(-10)), group='p%d' % k)
petal_paint(0.06)

# ---------- tulip ----------
p.layer('tulip', base=STEM, target_faces=280, voxel=0.01)
p.tube([(0, 0, 0), (0, 0.25, 0), (0, 0.5, 0)], [0.03, 0.027, 0.025], rseg=8)
for s_, (ln, ang, y0) in ((1, (0.2, 22, 0.02)), (-1, (0.17, 30, 0.06))):
    a = math.radians(ang)
    p.blob((s_ * math.sin(a) * ln * 0.8, y0 + math.cos(a) * ln * 0.8, 0.015), (0.05, ln, 0.026), rot=(0, 0, -s_ * ang), group='tl%d' % s_)
p.paint_fn(lambda q, n: abs(q.x) > 0.032, LEAF)
p.layer('tulip_p', base=PETAL, target_faces=400, voxel=0.008)
for k in range(3):
    for inner in (False, True):
        az = k / 3 * math.tau + (math.pi / 3 if inner else 0)
        r, y, h, w = (0.04, 0.635, 0.105, 0.07) if inner else (0.06, 0.6, 0.12, 0.085)
        M = Matrix.Rotation(az, 3, 'Y') @ Matrix.Rotation(math.radians(5 if inner else 12), 3, 'X')
        rot = tuple(math.degrees(v) for v in M.to_euler('XYZ'))
        p.blob((math.sin(az) * r, y, math.cos(az) * r), (w, h, 0.045), rot=rot, group='p%d%d' % (k, inner))
p.blob((0, 0.55, 0), (0.085, 0.07, 0.085), group='base')
p.paint_fn(lambda q, n: q.y < 0.53, PETAL_IN)

p.layer('skin')
p.bone('body', (0, 0, 0), (0, 0.7, 0))
p.extras['argMode'] = 'tint'
p.extras['argDefault'] = 0xff8fc0
p.extras['outline'] = 0.012
p.build()
