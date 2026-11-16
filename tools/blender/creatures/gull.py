import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from lib import Creature

# A friendly herring gull: white head and chest, soft grey back and wings, black wingtips with white "mirror" spots,
# a long yellow hooked bill with the red spot, orange feet. Built to read as a GULL (not a chick or a penguin):
# sleek head on a short neck, a long body tilted forward, wingtips crossing over a fanned tail.
WHITE = 0xfbf8f2
GREY = 0xa9b4c8
GREY_DK = 0x98a3b9
TIP = 0x4a4258
BEAK = 0xffd23f
SPOT = 0xff5a5a
FEET = 0xffa45a

c = Creature('gull', base=WHITE, target_faces=9000)


def flat_curve(pts, radii, flat, group, per=4):
    """Blobs along a Catmull-Rom curve, each squashed across x (the wing's thickness), so the curve reads as one
    tapered feather paddle in the y-z plane (lib's curve() flattens along the tangent instead)."""
    from mathutils import Vector
    P = [Vector(p) for p in pts]
    Pe = [P[0]] + P + [P[-1]]
    def cr(p0, p1, p2, p3, t):
        return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3)
    for i in range(len(P) - 1):
        for k in range(per):
            t = k / per
            p = cr(Pe[i], Pe[i + 1], Pe[i + 2], Pe[i + 3], t)
            r = radii[i] + (radii[i + 1] - radii[i]) * t
            c.blob(tuple(p), (r * flat, r, r), group=group)
    c.blob(tuple(P[-1]), (radii[-1] * flat, radii[-1], radii[-1]), group=group)


# ---- body: plump, longer than tall, chest forward and tail end lifted ----
c.blob((0, 0.64, 0.08), (0.4, 0.37, 0.4))                  # chest
c.blob((0, 0.72, -0.3), (0.33, 0.28, 0.4), rot=(-20, 0, 0))   # back / rump, lifted toward the tail
c.blob((0, 0.52, 0.02), (0.33, 0.22, 0.34))                # soft belly
# ---- neck + head: head ~0.42 on a short visible neck ----
HY, HZ = 1.3, 0.14
c.blob((0, 0.98, 0.08), (0.25, 0.22, 0.25))                # neck
c.blob((0, HY, HZ), (0.42, 0.38, 0.43))                    # head: a little long front-to-back, flat-ish crown
c.blob((0, HY - 0.02, HZ + 0.2), (0.27, 0.25, 0.26))       # forehead sloping into the bill (the gull profile)
c.blob((0, HY - 0.14, HZ + 0.14), (0.3, 0.2, 0.26))        # cheeks / chin
# ---- tail: three scalloped feathers fanned behind ----
for ang, ln in ((-24, 0.3), (0, 0.34), (24, 0.3)):
    a = math.radians(ang)
    c.blob((math.sin(a) * ln * 0.55, 0.8, -0.56 - math.cos(a) * ln * 0.55), (0.1, 0.045, 0.17), rot=(-18, ang, 0), group='tail')

# ---- bill: long, yellow, tilted down 12 deg with a little hook; red spot on the lower mandible ----
c.layer('beak', base=BEAK, target_faces=1400)
TILT = math.radians(7)
def bp(d, dy=0.0):
    return (0, HY - 0.08 - math.sin(TILT) * d + dy, HZ + 0.36 + math.cos(TILT) * d)
c.curve([bp(0.0), bp(0.2), bp(0.38), bp(0.44, 0.005)], [0.095, 0.075, 0.058, 0.045], group='beak')
c.curve([bp(0.42, 0.01), bp(0.49, -0.02), bp(0.5, -0.07), bp(0.47, -0.1)], [0.045, 0.04, 0.03, 0.02], group='beak')   # hooked tip
c.blob(bp(0.3, -0.06), (0.06, 0.04, 0.12), rot=(12, 0, 0), group='beak')                # gonys bulge
c.paint('spot', (0, bp(0.34)[1] - 0.075, bp(0.34)[2]), (0.12, 0.05, 0.065), SPOT)
c.layer('skin')

# ---- wings: one-piece tapered paddles lying along the sides, black tips crossing over the tail (own layer) ----
c.layer('wings', base=GREY, target_faces=2600)
def wing(s):
    g = 'wing' + str(s)
    c.blob((s * 0.34, 0.96, 0.03), (0.1, 0.1, 0.1), group=g)       # root ball, sunk in the shoulder
    flat_curve([(s * 0.38, 0.98, 0.02), (s * 0.44, 0.84, -0.1), (s * 0.43, 0.72, -0.36), (s * 0.34, 0.66, -0.68),
                (s * 0.22, 0.64, -0.92)], [0.1, 0.24, 0.19, 0.1, 0.035], 0.32, g)
c.mirror(wing)
c.mirror(lambda s: c.paint('tip', (s * 0.27, 0.65, -0.9), (0.25, 0.2, 0.3), TIP))
c.mirror(lambda s: c.paint('mirror', (s * 0.36, 0.67, -0.76), (0.09, 0.045, 0.05), WHITE))
c.layer('skin')

# ---- legs + webbed feet ----
c.layer('legs', base=FEET, target_faces=2000)
def leg(s):
    c.capsule((s * 0.15, 0.34, 0.02), (s * 0.15, 0.06, 0.06), 0.045, group='leg' + str(s))
    c.blob((s * 0.16, 0.04, 0.16), (0.12, 0.04, 0.15), group='foot' + str(s))
    for a in (-0.5, 0, 0.5):
        c.capsule((s * 0.16, 0.04, 0.08), (s * 0.16 + math.sin(a) * 0.14, 0.04, 0.08 + math.cos(a) * 0.2), 0.035, group='foot' + str(s))
c.mirror(leg)
c.layer('skin')

# ---- paint: grey mantle over the back, grey tail top ----
c.paint('mantle', (0, 0.86, -0.4), (0.42, 0.36, 0.34), GREY_DK, only=lambda p: p.y > 0.5)
c.paint('mantle2', (0, 0.98, -0.3), (0.34, 0.2, 0.3), GREY_DK, only=lambda p: p.z < -0.02)
c.mirror(lambda s: c.decal('blush', (s * 0.25, HY - 0.1), (0.075, 0.05, 0.1), 0xffb3c0))
c.paint('tail', (0, 0.84, -0.78), (0.3, 0.1, 0.32), GREY_DK)

# ---- rig ----
WROOT = lambda s: (s * 0.38, 0.98, 0.02)
WTIP = lambda s: (s * 0.22, 0.64, -0.92)
# roll (degrees) that turns the lib's default local Z of the left wing bone onto A x T, where A = the folded wing
# (root -> tip) and T = (-0.65, 0.6, -0.45), the up-and-out raised direction (measured in game: Z = (0.72, 0.69, -0.12))
WING_ROLL = 43.5
c.neck = (0.95, 1.08)
c.bone('body', (0, 0.2, 0), (0, 0.95, 0))
c.group_rules['body'] = ['main', 'tail']
c.bone('head', (0, 0.98, HZ), (0, 1.7, HZ), parent='body', region=lambda p: p.y > 0.86)
c.group_rules['head'] = ['main', 'beak']
for s, side in ((-1, 'L'), (1, 'R')):
    # The bone lies along the swept-back wing, rolled so its local Z (the axis games turn with rotation.z) is
    # A x T: a raise swings the folded wing from lying along the body (A) to up-and-out (T), like a real bird
    # opening its wing, instead of sticking out sideways as a flat plank.
    c.bone('wing.' + side, WROOT(s), WTIP(s), parent='body', roll=-WING_ROLL * s)
    c.group_rules['wing.' + side] = ['wing' + str(s)]
    c.bone('leg.' + side, (s * 0.15, 0.36, 0.02), (s * 0.16, 0.04, 0.16), parent='body')
    c.group_rules['leg.' + side] = ['leg' + str(s), 'foot' + str(s)]
c.bone('tail.1', (0, 0.76, -0.48), (0, 0.84, -0.92), parent='body')
c.group_rules['tail.1'] = ['tail']

c.face(center=(0, HY + 0.02, HZ), radius=0.56, mouth=0, eyeX=0.36, eyeY=0.16, eyeSize=1.15, browY=0.3, cheeks=0)
for k, p in dict(nose=(0, HY - 0.1, HZ + 0.7), eyeL=(-0.2, HY + 0.1), eyeR=(0.2, HY + 0.1), mouth=(0, HY - 0.15, HZ + 0.5),
                 tummy=(0, 0.6), handL=(-0.46, 0.7, -0.1), handR=(0.46, 0.7, -0.1),
                 footL=(-0.16, 0.05, 0.3), footR=(0.16, 0.05, 0.3)).items():
    c.anchor(k, p, 'head' if p[1] > 0.95 else 'body')
c.build()
