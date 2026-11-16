import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from lib import Creature

# The shell is painted a light neutral: in game makeCrab(colour) multiplies it by the colour (argMode 'tint').
SHELL = 0xfaf3f0
SPOT = 0xd9b8b2      # freckles: a clear shade deeper than the shell after tinting
BELLY = 0xfff1e0
TIP = 0xb89a9a       # darker pincer tips after tinting
INK = 0x3a2838
WHITE = 0xffffff



class Crab(Creature):
    def _empties(self, ao):
        # The code face spans eyeballs AND mouth: eyes (eyeX/eyeY) land on the stalk eyeballs, the code mouth (which
        # sits at -0.3R) lands on the shell front, so sad/joy/angry change the mouth too. Slide the face sphere so
        # the mouth just touches the shell, and report where the pupils land vs the eyeball fronts.
        f = self.face_info
        R = f['radius']
        cx, cy, _ = f['center']
        # the smile/frown are flat rings in a plane at zAt(-0.3R) - 0.03R: keep that plane just in front of the
        # shell over the whole mouth area, so no part of the smile gets buried
        zmax = max(self.surface(x * R, cy + y * R).z for x in (-0.2, -0.1, 0, 0.1, 0.2) for y in (-0.25, -0.3, -0.38, -0.46))
        cz = zmax + 0.012 - (math.sqrt(R * R - (0.3 * R) ** 2) - 0.03 * R)
        f['center'] = (cx, cy, cz)
        o = f['opts']
        ex, ey = o['eyeX'] * R, o['eyeY'] * R
        pz = cz + math.sqrt(R * R - ex * ex - ey * ey) - 0.12 * 0.14 * R * o['eyeSize']
        print('FACE cz %.3f mouth y %.3f pupil z %.3f eyeball front %.3f' % (cz, cy - 0.3 * R, pz, EYE_Z + EYE_R))
        super()._empties(ao)


c = Crab('crab', base=SHELL, target_faces=10500)
c.neck = (9, 10)     # no body->head ramp: the head bone carries the whole shell (see rig)

# ---- shell: wide, round, soft, a little brow ridge over the face ----
c.blob((0, 0.6, 0), (0.8, 0.42, 0.6))
c.blob((0, 0.42, 0.02), (0.72, 0.28, 0.55))
# socket bumps where the stalks grow out of the shell
c.mirror(lambda s: c.blob((s * 0.22, 0.93, 0.27), (0.13, 0.08, 0.12)))

# ---- eye stalks (skin) + eyeballs (untinted white layer) ----
FACE_R = 1.1                   # code-face radius (eyes on the eyeballs, mouth on the shell)
EYE_X, EYE_Y, EYE_Z, EYE_R = 0.315, 1.47, 0.38, 0.235
def stalk(s):
    g = 'stalk' + str(s)
    c.capsule((s * 0.21, 0.9, 0.27), (s * EYE_X, EYE_Y - 0.14, EYE_Z), 0.075, r2=0.068, group=g)
    # little cup the eyeball sits in
    c.blob((s * (EYE_X + 0.02), EYE_Y - 0.16, EYE_Z - 0.01), (0.17, 0.1, 0.15), group=g)
c.mirror(stalk)

# ---- claws: out sideways at rest (so a +raise lifts them up and out), big open pincer pointing up ----
PALM = (1.25, 0.59)
TILT = math.radians(36)        # pincer leans outward, so a +raise swings it straight up instead of over the eyes
def claw(s):
    def r(x, y, z):
        dx, dy = x - PALM[0], y - PALM[1]
        return (s * (PALM[0] + dx * math.cos(TILT) + dy * math.sin(TILT)), PALM[1] - dx * math.sin(TILT) + dy * math.cos(TILT), z)
    a = 'arm' + str(s)
    c.blob((s * 0.72, 0.52, 0.22), (0.13, 0.13, 0.13), group=a)                  # shoulder ball, sunk in the shell
    c.capsule((s * 0.72, 0.52, 0.22), (s * 1.05, 0.55, 0.36), 0.105, r2=0.095, group=a)
    g = 'claw' + str(s)
    c.blob((s * 1.25, 0.59, 0.38), (0.25, 0.22, 0.19), rot=(0, 0, s * 20 - s * 36), group=g)   # palm
    # big outer finger curling over, small inner one: a clear open "C" opening upward
    c.curve([r(1.36, 0.73, 0.38), r(1.42, 0.91, 0.38), r(1.36, 1.09, 0.38), r(1.22, 1.17, 0.38)],
            [0.13, 0.12, 0.09, 0.05], group=g, flat=0.75)
    c.curve([r(1.12, 0.75, 0.38), r(1.06, 0.89, 0.38), r(1.09, 0.99, 0.38)], [0.1, 0.08, 0.05],
            group=g + 'i', flat=0.75)
c.mirror(claw)

# ---- 3 jointed walking legs a side: front pair forward, back pair back ----
LEGS = [(0.0, 22), (-0.18, 0), (-0.36, -22)]   # (hip z, sweep angle in degrees: + = forward)
def legs(s):
    for i, (hz, ang) in enumerate(LEGS):
        g = f'leg{s}{i}'
        k = 1 - abs(i - 1) * 0.06
        a = math.radians(ang)
        hip = (s * 0.6, 0.32, hz)
        def at(r, y):
            return (s * (0.6 + (r - 0.6) * math.cos(a)), y, hz + (r - 0.6) * math.sin(a))
        c.curve([hip, at(0.95 * k, 0.42), at(1.1 * k, 0.07)], [0.13, 0.115, 0.085], group=g)
        c.blob(at(1.11 * k, 0.07), (0.09, 0.08, 0.09), group=g)            # soft rounded toe
c.mirror(legs)

# ---- paint ----
def tips(s):
    for (x, y, rr) in ((1.22, 1.17, (0.11, 0.09, 0.12)), (1.09, 1.0, (0.07, 0.07, 0.09))):
        dx, dy = x - PALM[0], y - PALM[1]
        c.paint('tip', (s * (PALM[0] + dx * math.cos(TILT) + dy * math.sin(TILT)), PALM[1] - dx * math.sin(TILT) + dy * math.cos(TILT), 0.38), rr, TIP)
c.mirror(tips)
for (x, y, r) in [(-0.52, 0.84, 0.1), (0.54, 0.8, 0.085), (-0.42, 0.62, 0.06), (0.4, 0.9, 0.07)]:
    c.decal('spot', (x, y), (r, r, r), SPOT)
# freckles on the back too
for (x, y, z, r) in [(0.3, 0.86, -0.42, 0.1), (-0.34, 0.9, -0.36, 0.09), (0.0, 0.98, -0.2, 0.08)]:
    c.paint('spotb', (x, y, z), (r, r, r * 1.4), SPOT)

MY = 0.74

# ---- pale underside: own layer so it stays cream whatever the shell colour ----
c.layer('belly', base=BELLY, target_faces=1500)
c.blob((0, 0.27, 0.06), (0.75, 0.16, 0.58), group='b')
c.layer('skin')

# ---- eyeballs: own layer, so the tint never reaches them ----
c.layer('eyes', base=WHITE, target_faces=1400)
c.mirror(lambda s: c.blob((s * EYE_X, EYE_Y, EYE_Z), (EYE_R, EYE_R * 1.05, EYE_R), group='eye' + str(s)))
c.layer('skin')

# ---- rig ----
# 'head' carries the whole shell with its rigid eye stalks, mouth and code face: when the crab looks at the child it
# turns its whole little self (a crab has no neck), so the eyes, pupils and mouth always stay welded together.
STALKS = ['stalk-1', 'stalk1']
LEGG = {s: [f'leg{s}{i}' for i in range(3)] for s in (-1, 1)}
c.bone('body', (0, 0.04, 0), (0, 0.3, 0))
c.group_rules['body'] = []           # the body bone only carries the gait bob and roll
c.bone('head', (0, 0.3, 0), (0, 1.2, 0), parent='body')
c.group_rules['head'] = ['main', 'b', 'm', 'eye-1', 'eye1'] + STALKS
for s, side in ((-1, 'L'), (1, 'R')):
    c.bone('claw.' + side, (s * 0.72, 0.52, 0.22), (s * 1.25, 0.6, 0.38), parent='head')
    c.group_rules['claw.' + side] = ['arm' + str(s), 'claw' + str(s), 'claw' + str(s) + 'i']
    c.bone('leg.' + side, (s * 0.6, 0.34, -0.18), (s * 1.08, 0.04, -0.18), parent='head')
    c.group_rules['leg.' + side] = LEGG[s]

FY = 0.77 + 0.3 * FACE_R       # face centre: its mouth line (-0.3R) at y 0.77 on the shell front
c.face(center=(0, FY, 0), radius=FACE_R, bone='head', snap=False, cheeks=0,
       eyeX=EYE_X / FACE_R, eyeY=(EYE_Y - FY) / FACE_R, eyeSize=0.12 / (0.14 * FACE_R), browY=0.25)
c.extras['argMode'] = 'tint'
c.extras['argDefault'] = 0xff5a4a

for k, (p, b) in dict(eyeL=((-EYE_X, EYE_Y, EYE_Z + EYE_R), 'head'), eyeR=((EYE_X, EYE_Y, EYE_Z + EYE_R), 'head'),
                      mouth=((0, MY - 0.05), 'body'), tummy=((0, 0.45), 'body'),
                      handL=((-1.25, 0.62, 0.56), 'claw.L'), handR=((1.25, 0.62, 0.56), 'claw.R'),
                      footL=((-1.0, 0.06, 0.1), 'leg.L'), footR=((1.0, 0.06, 0.1), 'leg.R')).items():
    c.anchor(k, p, b)
c.build()
