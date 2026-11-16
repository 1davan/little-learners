import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from lib import Creature
from mathutils import Vector, Matrix, Euler

# Baby chick (hides in the Peekaboo pots): a fluffy yellow egg-ball with a curly head tuft, little feathery
# wings, a small orange beak, a three-feather tail fan and orange feet on short shins.
# The chick is ONE ball (no neck), so there is no head bone: the face rides the body bone and the whole
# ball turns as one. Wings and legs are their own layers (own outline), each owned rigidly by its bone, so a
# flap swings a clean paddle out of the shoulder instead of stretching the flank.
# Sculpted at the old 0.55 size (about 0.95 tall); argScale = 1/0.55 makes makeChick(s) match the old size.
S = 0.55
YEL = 0xffd84a
BELLY = 0xfff7cf
WING = 0xffb420
BEAK = 0xff8f2a
FEET = 0xff962e

c = Creature('chick', base=YEL, voxel=0.0105, resolution=0.017)

def v(p):
    return tuple(x * S for x in p)

def blob(pos, size, group='main', rot=(0, 0, 0), stiffness=2.0):
    c.blob(v(pos), v(size), rot=rot, group=group, stiffness=stiffness)

def capsule(a, b, r, group, r2=None):
    c.capsule(v(a), v(b), r * S, group=group, r2=None if r2 is None else r2 * S)

def curve(pts, radii, group, per=4):
    c.curve([v(p) for p in pts], [r * S for r in radii], group=group, per=per)

def sheet(pts, radii, normal, group, flat=0.42, per=5, stiffness=2.0):
    """Blobs along a Catmull-Rom curve, each flattened across a fixed sheet normal: a soft flat paddle."""
    P = [Vector(v(p)) for p in pts]
    N0 = Vector(normal).normalized()
    Pe = [P[0]] + P + [P[-1]]
    def cr(p0, p1, p2, p3, t):
        return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3)
    for i in range(len(P) - 1):
        for k in range(per + (1 if i == len(P) - 2 else 0)):
            t = k / per
            p = cr(Pe[i], Pe[i + 1], Pe[i + 2], Pe[i + 3], t)
            dp = cr(Pe[i], Pe[i + 1], Pe[i + 2], Pe[i + 3], min(1, t + 0.02)) - cr(Pe[i], Pe[i + 1], Pe[i + 2], Pe[i + 3], max(0, t - 0.02))
            r = (radii[i] + (radii[i + 1] - radii[i]) * t) * S
            ty = dp.normalized()
            tz = (N0 - ty * N0.dot(ty)).normalized()
            tx = ty.cross(tz)
            e = Matrix((tx, ty, tz)).transposed().to_euler('XYZ')
            c.blob(tuple(p), (r, r * 0.9, r * flat), rot=tuple(math.degrees(a) for a in e), group=group, stiffness=stiffness)

# ---------- body: one fluffy egg, a touch wider at the bottom, sitting up on little shins ----------
blob((0, 0.88, 0), (0.6, 0.66, 0.6))
blob((0, 0.6, 0.02), (0.62, 0.4, 0.56))
blob((0, 0.9, 0.2), (0.5, 0.42, 0.42))                       # face plate: a calm, flat front for the eyes
c.mirror(lambda s: blob((s * 0.5, 1.04, -0.04), (0.16, 0.13, 0.16)))   # fluffy cheek puffs
c.mirror(lambda s: blob((s * 0.44, 1.16, -0.1), (0.13, 0.11, 0.13)))

# ---------- beak: its own family, small and pointy ----------
blob((0, 0.77, 0.6), (0.16, 0.11, 0.11), group='beak', stiffness=2.5)
blob((0, 0.76, 0.71), (0.1, 0.072, 0.09), group='beak', stiffness=2.5)
blob((0, 0.75, 0.81), (0.045, 0.04, 0.05), group='beak', stiffness=2.5)

# ---------- curly tuft on top ----------
curve([(0, 1.46, 0.0), (0.0, 1.64, -0.02), (0.07, 1.76, 0.05), (0.15, 1.74, 0.15), (0.13, 1.66, 0.18)], [0.085, 0.072, 0.056, 0.042, 0.032], 'tuft')
curve([(-0.05, 1.46, -0.03), (-0.14, 1.6, -0.05), (-0.24, 1.62, -0.03)], [0.065, 0.05, 0.03], 'tuft')
curve([(0.05, 1.46, -0.06), (0.12, 1.58, -0.12), (0.2, 1.6, -0.14)], [0.055, 0.042, 0.026], 'tuft')

# ---------- tail: a little three-feather fan ----------
sheet([(0, 0.66, -0.46), (0, 0.86, -0.7), (0, 1.04, -0.84)], [0.12, 0.13, 0.08], (0, -0.8, -1), 'tailB', flat=0.5)
c.mirror(lambda s: sheet([(s * 0.1, 0.64, -0.46), (s * 0.2, 0.8, -0.66), (s * 0.27, 0.94, -0.78)], [0.1, 0.11, 0.07],
                         (s * 0.4, -0.8, -1), 'tailA' if s < 0 else 'tailC', flat=0.5))

# ---------- paint ----------
def in_group(p, groups, grow=1.1):
    for g in groups:
        for e in c.groups[g]:
            m = Euler([math.radians(a) for a in e['rot']]).to_matrix().inverted()
            d = m @ (Vector(p) - Vector(e['pos']))
            sx, sy, sz = e['size']
            if (d.x / (sx * grow)) ** 2 + (d.y / (sy * grow)) ** 2 + (d.z / (sz * grow)) ** 2 <= 1:
                return True
    return False
c.decal('belly', (0, 0.4 * S), (0.34 * S, 0.27 * S, 0.3 * S), BELLY)
for x, y in ((-0.17, 0.6), (0, 0.63), (0.17, 0.6)):           # scalloped fluffy top edge of the belly
    c.decal('fluff', (x * S, y * S), (0.12 * S, 0.09 * S, 0.3 * S), BELLY)
c.paint_group(['tailA', 'tailB', 'tailC'], WING)
c.paint_group('beak', BEAK, only=lambda p: in_group(p, ('beak',), 1.25))

# ---------- wings: their own layer, a feathery paddle hanging from a root ball sunk in the shoulder ----------
c.layer('wings', base=WING, target_faces=1600)
def wing(s):
    g = 'wingL' if s < 0 else 'wingR'
    blob((s * 0.52, 0.94, 0.04), (0.1, 0.1, 0.1), group=g)      # root ball, hidden in the body
    # a broad soft mitten of a wing: its flat face turned half forward, so a raised wing shows its face
    n = Vector((s * 0.72, 0.1, 0.68)).normalized()
    pts = [(s * 0.54, 0.93, 0.05), (s * 0.63, 0.82, 0.07), (s * 0.7, 0.68, 0.07), (s * 0.74, 0.58, 0.06)]
    sheet(pts, [0.1, 0.16, 0.17, 0.12], n, g, flat=0.45)
    # three soft feather tips across the trailing end of the paddle
    t = (Vector(pts[-1]) - Vector(pts[1])).normalized()
    w = n.cross(t).normalized()
    if w.y < 0:
        w = -w
    # (each its own little family so they stay three distinct rounded feathers, not one flat end)
    for k, r in ((-1, 0.08), (0, 0.09), (1, 0.075)):
        a = Vector(pts[-1]) + w * (k * 0.09) - t * 0.02
        b = a + t * (0.08 - abs(k) * 0.025) + w * (k * 0.02)
        sheet([tuple(a), tuple(b)], [r, r * 0.8], n, g + 'f' + str(k + 1), flat=0.5, per=3)
c.mirror(wing)

# ---------- legs: own layer, a short visible shin and three stubby toes ----------
c.layer('legs', base=FEET, target_faces=1400)
def leg(s):
    g = 'legL' if s < 0 else 'legR'
    capsule((s * 0.21, 0.42, 0.06), (s * 0.22, 0.1, 0.17), 0.045, g, r2=0.042)
    blob((s * 0.22, 0.07, 0.2), (0.1, 0.06, 0.1), group=g)
    for a in (-0.6, 0, 0.6):
        a2 = a + s * 0.15
        capsule((s * 0.22, 0.055, 0.2), (s * 0.22 + math.sin(a2) * 0.2, 0.05, 0.2 + math.cos(a2) * 0.2), 0.06, g, r2=0.05)
c.mirror(leg)
c.layer('skin')

# ---------- rig: no head bone (the ball turns as one); limbs rigid ----------
c.bone('body', v((0, 0.2, 0)), v((0, 0.9, 0)))
c.group_rules['body'] = ['main', 'beak']
c.chain('tuft', [v((0, 1.42, 0)), v((0, 1.64, -0.02)), v((0.14, 1.76, 0.12))], 'body')
c.group_rules['tuft.1'] = ['tuft']
c.group_rules['tuft.2'] = ['tuft']
c.bone('tail.1', v((0, 0.56, -0.46)), v((0, 0.9, -0.76)), parent='body')
c.group_rules['tail.1'] = ['tailA', 'tailB', 'tailC']
for s in (-1, 1):
    L = '.L' if s < 0 else '.R'
    c.bone('wing' + L, v((s * 0.53, 0.94, 0.03)), v((s * 0.77, 0.48, 0.06)), parent='body')
    g = 'wingL' if s < 0 else 'wingR'
    c.group_rules['wing' + L] = [g, g + 'f0', g + 'f1', g + 'f2']
    c.bone('leg' + L, v((s * 0.21, 0.42, 0.06)), v((s * 0.22, 0.08, 0.16)), parent='body')
    c.group_rules['leg' + L] = ['legL' if s < 0 else 'legR']

c.face(center=v((0, 0.9, 0)), radius=0.7 * S, bone='body', mouth=0, faceScale=1.0, eyeSize=1.32, eyeX=0.44, eyeY=0.13)
for k, p in dict(nose=(0, 0.79), eyeL=(-0.22, 0.94), eyeR=(0.22, 0.94), mouth=(0, 0.72),
                 tummy=(0, 0.52), handL=(-0.76, 0.5, 0.06), handR=(0.76, 0.5, 0.06),
                 footL=(-0.26, 0.05, 0.38), footR=(0.26, 0.05, 0.38), earL=(-0.5, 1.06, 0.05), earR=(0.5, 1.06, 0.05)).items():
    pos = (p[0] * S, p[1] * S) if len(p) == 2 else v(p)
    c.anchor(k, pos, 'body')

c.extras['argMode'] = 'scale'
c.extras['argScale'] = 1 / S
c.extras['outline'] = 0.018
c.build()
