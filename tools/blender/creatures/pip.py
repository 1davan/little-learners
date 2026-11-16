import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from lib import Creature
from mathutils import Vector, Matrix, Euler

# Pip the chick: the narrator and mascot. A big round yellow head on a soft egg body, feathery wings, a
# pointed orange beak, a curly sprout tuft and three-toed orange feet. The head bone's origin is the head's
# centre (hats are added in game at head-local y 0.45-0.62), so keep the top of the head round.
# Wings and legs are their own layers (own ink line), each owned rigidly by its bone: a flap or a wave swings
# a clean paddle out of the shoulder and never stretches the flank.
YEL = 0xffd23f
YEL_D = 0xffb92a
CREAM = 0xfff6cf
FLUFF = 0xfffbe6
BEAK = 0xff9a32
BEAK_D = 0xf07a28
FOOT = 0xff9f3f

HY = 1.55   # head centre

c = Creature('pip', base=YEL)

def sheet(pts, radii, normal, group, flat=0.42, per=5, stiffness=2.0):
    """Blobs along a Catmull-Rom curve, each flattened across a fixed sheet normal: a soft flat paddle."""
    P = [Vector(p) for p in pts]
    N0 = Vector(normal).normalized()
    Pe = [P[0]] + P + [P[-1]]
    def cr(p0, p1, p2, p3, t):
        return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3)
    for i in range(len(P) - 1):
        for k in range(per + (1 if i == len(P) - 2 else 0)):
            t = k / per
            p = cr(Pe[i], Pe[i + 1], Pe[i + 2], Pe[i + 3], t)
            dp = cr(Pe[i], Pe[i + 1], Pe[i + 2], Pe[i + 3], min(1, t + 0.02)) - cr(Pe[i], Pe[i + 1], Pe[i + 2], Pe[i + 3], max(0, t - 0.02))
            r = radii[i] + (radii[i + 1] - radii[i]) * t
            ty = dp.normalized()
            tz = (N0 - ty * N0.dot(ty)).normalized()
            tx = ty.cross(tz)
            e = Matrix((tx, ty, tz)).transposed().to_euler('XYZ')
            c.blob(tuple(p), (r, r * 0.9, r * flat), rot=tuple(math.degrees(a) for a in e), group=group, stiffness=stiffness)

def in_group(p, groups, grow=1.1):
    for g in groups:
        for e in c.groups[g]:
            m = Euler([math.radians(a) for a in e['rot']]).to_matrix().inverted()
            d = m @ (Vector(p) - Vector(e['pos']))
            sx, sy, sz = e['size']
            if (d.x / (sx * grow)) ** 2 + (d.y / (sy * grow)) ** 2 + (d.z / (sz * grow)) ** 2 <= 1:
                return True
    return False

# ---------- body: soft egg, a touch wider at the bottom ----------
c.blob((0, 0.66, 0), (0.52, 0.5, 0.5))
c.blob((0, 0.44, 0.02), (0.53, 0.32, 0.48))
c.blob((0, 1.1, -0.02), (0.44, 0.22, 0.4))                         # neck blend: one soft shape, no peanut pinch
# ---------- head: its own family so it stays a big round ball sitting on the body ----------
c.blob((0, HY, 0), (0.8, 0.72, 0.7), group='head')
c.mirror(lambda s: c.blob((s * 0.46, HY - 0.25, 0.04), (0.2, 0.16, 0.2), group='head'))   # fluffy low cheeks

# ---------- beak: a little pointed cone, its own family ----------
c.blob((0, 1.5, 0.62), (0.13, 0.11, 0.12), group='beak', stiffness=2.5)
c.blob((0, 1.49, 0.76), (0.085, 0.075, 0.09), group='beak', stiffness=2.5)
c.blob((0, 1.48, 0.87), (0.04, 0.035, 0.05), group='beak', stiffness=2.5)

# ---------- sprout tuft: one curl sweeping up and forward + a small back wisp ----------
TOP = HY + 0.7
c.curve([(0, TOP - 0.1, 0.02), (0.02, TOP + 0.1, 0.0), (0.08, TOP + 0.24, 0.06), (0.14, TOP + 0.24, 0.17), (0.12, TOP + 0.16, 0.2)],
        [0.09, 0.08, 0.065, 0.05, 0.038], group='tuft', per=5)
c.curve([(-0.04, TOP - 0.1, -0.06), (-0.1, TOP + 0.04, -0.1), (-0.18, TOP + 0.1, -0.1)], [0.06, 0.045, 0.028], group='tuft', per=4)

# ---------- tail: a perky three-feather fan ----------
sheet([(0, 0.62, -0.42), (0, 0.82, -0.66), (0, 1.0, -0.8)], [0.13, 0.14, 0.08], (0, -0.8, -1), 'tailB', flat=0.5)
c.mirror(lambda s: sheet([(s * 0.07, 0.6, -0.42), (s * 0.13, 0.76, -0.62), (s * 0.18, 0.88, -0.74)], [0.11, 0.12, 0.08],
                         (s * 0.4, -0.8, -1), 'tailA' if s < 0 else 'tailC', flat=0.5))

# ---------- paint ----------
c.decal('belly', (0, 0.6), (0.4, 0.4, 0.3), CREAM)
for x, y in ((-0.22, 0.88), (0, 0.92), (0.22, 0.88), (-0.33, 0.76), (0.33, 0.76)):   # scalloped fluffy top edge
    c.decal('fluff', (x, y), (0.13, 0.1, 0.25), FLUFF)
c.paint_group(['tailA', 'tailB', 'tailC'], YEL_D)
c.paint_group('beak', BEAK, only=lambda p: in_group(p, ('beak',), 1.25))
c.paint_group('beak', BEAK_D, only=lambda p: in_group(p, ('beak',), 1.25) and p.y < 1.465)

# ---------- wings: own layer, a feathery paddle hanging from a root ball sunk in the shoulder ----------
c.layer('wings', base=YEL_D, target_faces=1600)
WROOT = {}
def wing(s):
    g = 'wingL' if s < 0 else 'wingR'
    root = (s * 0.5, 1.02, 0.04)
    WROOT[s] = root
    c.blob(root, (0.12, 0.12, 0.12), group=g)
    # broad soft paddle, its flat face turned half forward so a raised wing shows its face
    n = Vector((s * 0.72, 0.1, 0.68)).normalized()
    pts = [(s * 0.52, 1.0, 0.05), (s * 0.64, 0.84, 0.08), (s * 0.71, 0.66, 0.08), (s * 0.74, 0.56, 0.07)]
    sheet(pts, [0.12, 0.19, 0.19, 0.13], n, g, flat=0.42)
    # three soft feather tips across the trailing end (each its own family so the scallops stay distinct)
    t = (Vector(pts[-1]) - Vector(pts[1])).normalized()
    w = n.cross(t).normalized()
    if w.y < 0:
        w = -w
    for k, r in ((-1, 0.085), (0, 0.1), (1, 0.08)):
        a = Vector(pts[-1]) + w * (k * 0.1) - t * 0.02
        b = a + t * (0.09 - abs(k) * 0.025) + w * (k * 0.025)
        sheet([tuple(a), tuple(b)], [r, r * 0.8], n, g + 'f' + str(k + 1), flat=0.48, per=3)
c.mirror(wing)

# ---------- legs + three-toed feet: own layer ----------
c.layer('legs', base=FOOT, target_faces=1600)
def foot(s):
    g = 'legL' if s < 0 else 'legR'
    c.capsule((s * 0.24, 0.34, 0.08), (s * 0.25, 0.08, 0.16), 0.065, group=g, r2=0.06)
    c.blob((s * 0.25, 0.07, 0.18), (0.11, 0.065, 0.11), group=g)
    for a in (-0.6, 0, 0.6):
        a2 = a + s * 0.2
        c.capsule((s * 0.25, 0.06, 0.18), (s * 0.25 + math.sin(a2) * 0.26, 0.055, 0.18 + math.cos(a2) * 0.26),
                  0.07, r2=0.055, group=g)
c.mirror(foot)
c.layer('skin')

# ---------- rig ----------
c.bone('body', (0, 0.15, 0), (0, 1.1, 0))
c.group_rules['body'] = ['main', 'head', 'tuft']
c.bone('head', (0, HY, 0), (0, 2.3, 0), parent='body', region=lambda p: p.y > 1.12)
c.chain('tuft', [(0, TOP - 0.12, 0.02), (0.02, TOP + 0.1, 0.0), (0.13, TOP + 0.24, 0.15)], 'head')
c.group_rules['tuft.1'] = ['tuft']
c.group_rules['tuft.2'] = ['tuft']
c.bone('tail.1', (0, 0.6, -0.4), (0, 0.98, -0.78), parent='body', group=['tailA', 'tailB', 'tailC'])
for s in (-1, 1):
    L = '.L' if s < 0 else '.R'
    g = 'wingL' if s < 0 else 'wingR'
    c.bone('wing' + L, WROOT[s], (s * 0.76, 0.48, 0.06), parent='body')
    c.group_rules['wing' + L] = [g, g + 'f0', g + 'f1', g + 'f2']
    c.bone('leg' + L, (s * 0.24, 0.34, 0.08), (s * 0.25, 0.06, 0.16), parent='body')
    c.group_rules['leg' + L] = ['legL' if s < 0 else 'legR']

c.face(center=(0, HY, 0.0), radius=0.76, mouth=0, faceScale=1.0, eyeSize=1.24)
for k, p in dict(nose=(0, 1.5), eyeL=(-0.28, 1.65), eyeR=(0.28, 1.65), mouth=(0, 1.42),
                 tummy=(0, 0.66), handL=(-0.76, 0.5, 0.06), handR=(0.76, 0.5, 0.06),
                 footL=(-0.3, 0.05, 0.38), footR=(0.3, 0.05, 0.38), earL=(-0.6, 1.66, 0.1), earR=(0.6, 1.66, 0.1)).items():
    c.anchor(k, p, 'head' if p[1] > 1.18 else 'body')
c.build()
