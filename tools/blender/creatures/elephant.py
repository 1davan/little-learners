import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from lib import Creature

SKIN = 0xa9b3d2   # soft lavender-blue grey
LIGHT = 0xc4cbe4  # belly / trunk tip
DARK = 0x8a93b5   # tail tuft, hair
PINK = 0xffaec8   # inner ears
NAIL = 0xfff3e0   # toenails

FACE_R = 1.2       # a flatter face sphere: the smile is wide enough for its corners to show beside the trunk
EYE_Y = 1.8
MOUTH_Y = 1.22    # the code smile sits low on the face, its corners peeking out either side of the trunk root


class Elephant(Creature):
    def _empties(self, ao):
        # slide the face sphere so the smile ring sits just in front of the cheeks beside the trunk, and report where
        # the eyes land against the head surface
        f = self.face_info
        R = f['radius']
        cx, cy, _ = f['center']
        zmax = max(self.surface(x * R, cy + y * R, z_from=0.95).z
                   for x in (-0.22, -0.18, 0.18, 0.22) for y in (-0.25, -0.3, -0.36))
        cz = zmax + 0.015 - (math.sqrt(R * R - (0.3 * R) ** 2) - 0.03 * R)
        f['center'] = (cx, cy, cz)
        o = f['opts']
        ex, ey = o['eyeX'] * R, o['eyeY'] * R
        pz = cz + math.sqrt(R * R - ex * ex - ey * ey) - 0.12 * 0.14 * R * o['eyeSize']
        hs = self.surface(ex, cy + ey)
        print('FACE cz %.3f eye z %.3f head surface %.3f' % (cz, pz, hs.z))
        super()._empties(ao)


c = Elephant('elephant', base=SKIN, target_faces=12500)

# ---- body: a chunky round barrel with a proper rump, and a neck into the head ----
c.blob((0, 0.9, -0.4), (0.7, 0.6, 0.74))
c.blob((0, 0.78, 0.0), (0.58, 0.5, 0.44))
c.blob((0, 1.2, 0.08), (0.5, 0.34, 0.42))             # neck
# ---- head: big and round, sits forward and up ----
HX, HY, HZ = 0, 1.66, 0.3
c.blob((HX, HY, HZ), (0.76, 0.7, 0.64))
c.mirror(lambda s: c.blob((s * 0.3, 1.42, 0.5), (0.28, 0.24, 0.28)))   # chubby cheeks

# ---- trunk: slimmer, grows from the face, hangs clear of the chest and curls up at the tip ----
TRUNK = [(0, 1.42, 0.9), (0, 1.2, 1.06), (0, 1.0, 1.12), (0, 0.88, 1.24), (0, 0.96, 1.38)]
c.curve(TRUNK, [0.16, 0.14, 0.125, 0.115, 0.12], group='trunk', per=6)
c.blob((0, 1.47, 0.82), (0.17, 0.16, 0.15), group='trunk')

# ---- ears: big plump flappy ears, cupped on the front ----
EAR_A = 40
def ear(s):
    g = 'ear' + str(s)
    t = math.radians(-s * EAR_A)
    nx, nz = math.sin(t), math.cos(t)            # ear's front normal
    c.blob((s * 1.02, 1.58, -0.02), (0.52, 0.56, 0.11), rot=(0, -s * EAR_A, s * 8), group=g)
    c.blob((s * 0.66, 1.68, 0.1), (0.18, 0.32, 0.1), rot=(0, -s * EAR_A, 0), group=g)   # root
    # cupping: scoop the front face out a little, leaving a soft rim
    c.blob((s * 1.02 + nx * 0.13, 1.56, -0.02 + nz * 0.13), (0.4, 0.44, 0.08), rot=(0, -s * EAR_A, s * 8),
           group=g, negative=True)
c.mirror(ear)

# ---- baby hair: three little sprigs on top ----
for i, (dx, dz, lean) in enumerate(((-0.08, 0.2, -0.1), (0.0, 0.24, 0.0), (0.08, 0.2, 0.1))):
    c.curve([(dx, 2.3, dz), (dx + lean * 0.5, 2.42, dz + 0.02), (dx + lean, 2.5, dz + 0.06)], [0.05, 0.045, 0.04],
            group='tuft%d' % i, per=4)
c.paint('hair', (0, 2.45, 0.24), (0.3, 0.2, 0.25), DARK, only=lambda p: p.y > 2.34)

# ---- legs: stumpy pillars with flat round feet, each its own group (owned rigidly by its leg bone) ----
LEGS = {'legF.L': (-0.4, 0.26), 'legF.R': (0.4, 0.26), 'legB.L': (-0.42, -0.86), 'legB.R': (0.42, -0.86)}
for name, (x, z) in LEGS.items():
    c.capsule((x, 0.66, z), (x, 0.24, z), 0.25, r2=0.26, group=name)
    c.blob((x, 0.13, z + 0.02), (0.28, 0.13, 0.28), group=name)

# ---- tail: thin with a little tuft ----
c.curve([(0, 0.98, -1.12), (0, 0.78, -1.24), (0.03, 0.58, -1.24)], [0.06, 0.05, 0.045], group='tail', per=4)
c.blob((0.03, 0.5, -1.23), (0.08, 0.11, 0.08), group='tail')

# ---- paint ----
c.paint('belly', (0, 0.48, -0.3), (0.5, 0.26, 0.66), LIGHT, only=lambda p: p.y < 0.6 and abs(p.x) < 0.5)
def inner_ear(p, n):
    # pink only on the front (cupped) face of each ear, inside a rim of grey
    s = 1 if p.x > 0 else -1
    if p.x * s < 0.72:
        return False
    t = math.radians(-s * EAR_A)
    fx, fz = math.sin(t), math.cos(t)          # ear front normal
    ux, uz = math.cos(t), -math.sin(t)         # ear in-plane horizontal axis
    dx, dy, dz = p.x - s * 1.02, p.y - 1.57, p.z + 0.02
    u = dx * ux + dz * uz
    return (u / 0.4) ** 2 + (dy / 0.44) ** 2 < 1 and n.x * fx + n.z * fz > 0.2
c.paint_fn(inner_ear, PINK)
c.paint('trunk_tip', (0, 0.98, 1.44), (0.15, 0.15, 0.06), LIGHT)
c.paint('tuft', (0.03, 0.5, -1.23), (0.1, 0.13, 0.1), DARK)
# toenails: three cream crescents on the front of each foot
for name, (x, z) in LEGS.items():
    for a in (-0.6, 0, 0.6):
        nx, nz = x + math.sin(a) * 0.27, z + 0.02 + math.cos(a) * 0.27
        c.paint('nail', (nx, 0.11, nz), (0.08, 0.075, 0.06), NAIL, rot=(0, math.degrees(a), 0))

# ---- rig ----
c.bone('body', (0, 0.3, -0.35), (0, 1.2, -0.35))
c.group_rules['body'] = ['main', 'tail']
c.bone('head', (HX, 1.12, HZ), (HX, 2.2, HZ), parent='body',
       region=lambda p: (p.y > 1.15 and p.z > -0.25) or p.y > 1.45)
c.neck = (1.08, 1.32)
c.group_rules['head'] = ['main', 'trunk', 'ear-1', 'ear1', 'tuft0', 'tuft1', 'tuft2']
# one stiff spring bone per ear: the plump ear flaps as a whole from its root instead of folding in half and
# flipping inside-out on every footfall
c.mirror(lambda s: c.chain('ear' + ('.L' if s < 0 else '.R'), [(s * 0.62, 1.66, 0.1), (s * 1.4, 1.52, -0.26)], 'head',
                           region=(lambda p, s=s: p.x * s > 0.74)))
for s in (-1, 1):
    c.group_rules['ear.%s.1' % ('L' if s < 0 else 'R')] = ['ear' + str(s)]
# three trunk segments (not four): the springs still swing and curl it, but it can't whip round like a hose
c.chain('trunk', [(0, 1.47, 0.84), (0, 1.12, 1.09), (0, 0.88, 1.24), (0, 0.98, 1.42)], 'head')
for i in range(1, 4):
    c.group_rules['trunk.%d' % i] = ['trunk']
for name, (x, z) in LEGS.items():
    c.bone(name, (x, 0.72, z), (x, 0.05, z), parent='body')
    c.group_rules[name] = [name]
c.chain('tail', [(0, 0.98, -1.12), (0, 0.78, -1.24), (0.03, 0.44, -1.23)], 'body')
for i in (1, 2):
    c.group_rules['tail.%d' % i] = ['tail']

FY = MOUTH_Y + 0.3 * FACE_R
# eyes/brows keep the size they had on a 0.92 face; cheeks are painted on the skin instead (a 1.5 face's
# cheeks would float off the sides of the head)
c.face(center=(0, FY, 0.3), radius=FACE_R, snap=False, eyeX=0.33 / FACE_R, eyeY=(EYE_Y - FY) / FACE_R,
       eyeSize=0.92 / FACE_R, browY=0.3 * 0.92 / FACE_R, cheeks=0)
c.mirror(lambda s: c.decal('blush', (s * 0.5, 1.54), (0.1, 0.065, 0.12), 0xffa3bd))
c.anchor('nose', (0, 1.0, 1.4), 'trunk.3')
for k, p in dict(eyeL=(-0.33, 1.8), eyeR=(0.33, 1.8), mouth=(0.22, 1.32),
                 tummy=(0, 0.55, 0.4), handL=(-0.4, 0.3, 0.5), handR=(0.4, 0.3, 0.5),
                 footL=(-0.4, 0.14, 0.53), footR=(0.4, 0.14, 0.53), earL=(-1.0, 1.58, 0.12), earR=(1.0, 1.58, 0.12)).items():
    c.anchor(k, p, 'head' if p[1] > 1.2 else 'body')
c.build()
