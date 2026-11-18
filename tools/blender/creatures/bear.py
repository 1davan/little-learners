import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from lib import Creature

# Bear: chunky chibi teddy. Big round head (~52% of the height), soft pear body, A-pose arms with a clear armpit,
# short visible legs, a round tail, a proud muzzle with the code mouth sitting on it.
FUR = 0xb37a4c      # warm honey-brown
CREAM = 0xf6dcb4    # muzzle, tummy
INNER = 0xf0bfa4    # inner ear
PAD = 0xe39a8c      # rosy paw pads
NOSE = 0x4b2f3e     # dark warm cocoa-plum


def ell(center, size, rotz=0.0):
    """Ellipsoid test (rotated about z by rotz degrees) for paint_fn."""
    from mathutils import Vector, Euler
    import math as _m
    C, S = Vector(center), Vector(size)
    M = Euler((0, 0, _m.radians(rotz))).to_matrix().inverted()
    def f(p):
        d = M @ (p - C)
        return (d.x / S.x) ** 2 + (d.y / S.y) ** 2 + (d.z / S.z) ** 2 <= 1.0
    return f

c = Creature('bear', base=FUR, target_faces=11000)

HY = 1.74           # head centre height
R = 0.64            # face sphere radius

# ---------- body: chunky soft pear, lifted so the legs show ----------
c.blob((0, 0.84, 0), (0.5, 0.46, 0.46))
c.blob((0, 0.58, 0.03), (0.52, 0.3, 0.47))
c.blob((0, 1.16, 0), (0.34, 0.18, 0.32))                # neck blend
# ---------- head: big, round, a bit wide ----------
c.blob((0, HY, 0), (0.78, 0.66, 0.66))
c.mirror(lambda s: c.blob((s * 0.36, HY - 0.2, 0.22), (0.28, 0.22, 0.26)))   # cheeks
# muzzle: a proud soft oval so the profile isn't flat
c.blob((0, HY - 0.2, 0.35), (0.34, 0.22, 0.26))
c.blob((0, HY - 0.05, 0.5), (0.16, 0.1, 0.17))         # snout bridge under the nose
c.blob((0, HY - 0.03, 0.7), (0.112, 0.072, 0.08), group='nose')

# ---------- ears: round, cupped ----------
def ear(s):
    g = 'ear' + ('L' if s < 0 else 'R')
    c.blob((s * 0.55, HY + 0.52, -0.06), (0.235, 0.225, 0.12), rot=(0, 0, -s * 25), group=g)
    c.blob((s * 0.57, HY + 0.53, 0.07), (0.135, 0.135, 0.065), rot=(0, 0, -s * 25), group=g, negative=True)
    c.blob((s * 0.46, HY + 0.38, -0.06), (0.14, 0.12, 0.1), group=g)   # root into the skull
c.mirror(ear)

# ---------- arms: A-pose, a real gap to the torso; a root ball sunk at the shoulder pivot ----------
SH = lambda s: (s * 0.38, 1.06, 0.06)
def arm(s):
    g = 'arm' + ('L' if s < 0 else 'R')
    c.blob(SH(s), (0.15, 0.15, 0.15), group=g)
    c.capsule((s * 0.44, 1.04, 0.07), (s * 0.82, 0.73, 0.16), 0.145, r2=0.135, group=g)
    c.blob((s * 0.9, 0.66, 0.18), (0.165, 0.16, 0.16), group=g)
c.mirror(arm)
# ---------- legs + feet ----------
def leg(s):
    g = 'leg' + ('L' if s < 0 else 'R')
    c.capsule((s * 0.3, 0.44, 0.04), (s * 0.31, 0.18, 0.1), 0.19, r2=0.175, group=g)
    c.blob((s * 0.32, 0.12, 0.2), (0.21, 0.125, 0.28), rot=(0, s * 8, 0), group=g)
c.mirror(leg)
# ---------- round tail ----------
c.blob((0, 0.54, -0.47), (0.12, 0.12, 0.12), group='tail')
c.blob((0, 0.52, -0.6), (0.17, 0.165, 0.15), group='tail')

# ---------- paint ----------
c.decal('tummy', (0, 0.72), (0.36, 0.36, 0.25), CREAM)
c.decal('muzzle', (0, HY - 0.21), (0.35, 0.23, 0.25), CREAM)
c.paint('nose', (0, HY - 0.03, 0.7), (0.125, 0.085, 0.1), NOSE, only=lambda p: p.z > 0.66)
for s in (-1, 1):   # front-facing skin only, so no colour shows on the back of the ear
    f = ell((s * 0.57, HY + 0.53, 0.05), (0.155, 0.155, 0.1), -s * 25)
    c.paint_fn(lambda p, n, f=f: f(p) and n.z > 0.25, INNER)
c.mirror(lambda s: c.paint('palm', (s * 0.92, 0.64, 0.33), (0.11, 0.1, 0.07), PAD))
c.mirror(lambda s: c.paint('sole', (s * 0.33, 0.12, 0.48), (0.14, 0.09, 0.07), PAD))

# ---------- rig ----------
c.neck = (1.14, 1.32)
c.bone('body', (0, 0.3, 0), (0, 1.2, 0))
c.group_rules['body'] = ['main']
c.bone('head', (0, 1.3, 0), (0, 2.4, 0), parent='body', region=lambda p: p.y > 1.12)
c.group_rules['head'] = ['main', 'nose', 'earL', 'earR']
for s, n in ((-1, 'L'), (1, 'R')):
    c.chain('ear.' + n, [(s * 0.48, HY + 0.38, -0.06), (s * 0.58, HY + 0.62, -0.06)], 'head')
    c.group_rules['ear.%s.1' % n] = ['ear' + n]
    c.bone('arm.' + n, SH(s), (s * 0.9, 0.66, 0.18), parent='body')
    c.group_rules['arm.' + n] = ['arm' + n]
    c.bone('leg.' + n, (s * 0.3, 0.44, 0.04), (s * 0.32, 0.08, 0.2), parent='body')
    c.group_rules['leg.' + n] = ['leg' + n]
c.bone('tail.1', (0, 0.53, -0.44), (0, 0.53, -0.72), parent='body')
c.group_rules['tail.1'] = ['tail']

MY = 0.0
MZ = 0.02
c.face(center=(0, HY, 0.0), radius=R, faceScale=1.0, mouthY=MY, mouthZ=MZ)
for k, p in dict(nose=(0, HY - 0.03), eyeL=(-0.36 * R, HY + 0.12 * R), eyeR=(0.36 * R, HY + 0.12 * R),
                 mouth=(0, HY - 0.3 * R + MY), tummy=(0, 0.72),
                 handL=(-0.92, 0.64), handR=(0.92, 0.64),
                 footL=(-0.33, 0.1), footR=(0.33, 0.1), earL=(-0.56, HY + 0.51), earR=(0.56, HY + 0.51)).items():
    c.anchor(k, p, 'head' if p[1] > 1.2 else 'body')
# WORDS batch 6 body-part anchors (head top, left code-face cheek, mid left arm, left leg)
c.anchor('head', (0, HY + 0.5), 'head')
c.anchor('cheek', (-0.58 * R, HY - 0.12 * R), 'head')
c.anchor('armL', (-0.63, 0.88), 'arm.L')
c.anchor('legL', (-0.3, 0.3), 'leg.L')
c.build()
