import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from lib import Creature
from mathutils import Vector, Matrix, Euler

# Rubber-duck style duckling: a round yellow hull with a tipped-up tail, a pale belly, a big round head with a
# curly crown tuft, a wide flat orange spoon bill and orange webbed feet. Swept-back wings are their own layer,
# owned rigidly by the wing bones, so a flap lifts a clean wing off the flank without stretching it.
# Built at twice the old code duck's size (old makeDuck(1) stands ~1.4 tall); argScale halves it back.
YEL = 0xffd23f
YEL_DK = 0xffb926
BELLY = 0xfff0a8
BILL = 0xff9a3c
BILL_DK = 0xf07c2a
NOSTRIL = 0xc8642a
FOOT = 0xff9a3c

c = Creature('duck', base=YEL, target_faces=11000)
c.extras['argMode'] = 'scale'
c.extras['argScale'] = 0.5
c.extras['outline'] = 0.045   # model is shown at half size or less

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

def _in(p, e, grow=1.12):
    m = Euler([math.radians(a) for a in e['rot']]).to_matrix().inverted()
    d = m @ (Vector(p) - Vector(e['pos']))
    sx, sy, sz = e['size']
    return (d.x / (sx * grow)) ** 2 + (d.y / (sy * grow)) ** 2 + (d.z / (sz * grow)) ** 2 <= 1

def in_group(p, groups, grow=1.15):
    for g in groups:
        for e in c.groups[g]:
            m = Euler([math.radians(a) for a in e['rot']]).to_matrix().inverted()
            d = m @ (Vector(p) - Vector(e['pos']))
            sx, sy, sz = e['size']
            if (d.x / (sx * grow)) ** 2 + (d.y / (sy * grow)) ** 2 + (d.z / (sz * grow)) ** 2 <= 1:
                return True
    return False

# ---- body: round rubber-duck hull, tail tipped up behind ----
c.blob((0, 0.76, -0.1), (0.76, 0.56, 0.92))
c.blob((0, 0.74, 0.3), (0.62, 0.5, 0.56))            # breast
c.blob((0, 1.32, 0.14), (0.38, 0.24, 0.36))          # neck blend
c.curve([(0, 0.88, -0.62), (0, 1.08, -0.98), (0, 1.38, -1.2)], [0.4, 0.22, 0.07], flat=0.7, per=4)   # tail flick
# ---- head: big and round ----
HY, HZ = 1.9, 0.2
c.blob((0, HY, HZ), (0.62, 0.6, 0.58), group='head')
c.mirror(lambda s: c.blob((s * 0.3, HY - 0.2, HZ + 0.22), (0.24, 0.2, 0.2), group='head'))   # cheeks

# ---- bill: wide, flat, rounded spoon ----
BY, BZ = HY - 0.24, HZ + 0.52
c.blob((0, BY + 0.04, BZ + 0.16), (0.32, 0.13, 0.3), rot=(-12, 0, 0), group='head', stiffness=2.5)   # upper: wide spoon (melts softly into the face)
c.blob((0, BY + 0.05, BZ - 0.04), (0.24, 0.12, 0.16), group='head', stiffness=2.5)                   # root: melts into the face (no crease)
c.blob((0, BY - 0.09, BZ + 0.1), (0.25, 0.07, 0.22), rot=(8, 0, 0), group='billLo', stiffness=2.5)  # lower
# ---- head tuft: Pip's curl plus a little wisp ----
TOP = HY + 0.6
c.curve([(0, TOP - 0.12, HZ), (0, TOP + 0.1, HZ - 0.04), (0.02, TOP + 0.27, HZ + 0.04), (0.03, TOP + 0.29, HZ + 0.18), (0.02, TOP + 0.19, HZ + 0.24)],
        [0.11, 0.09, 0.07, 0.055, 0.042], group='tuft', per=5)
c.curve([(-0.03, TOP - 0.1, HZ - 0.06), (-0.12, TOP + 0.06, HZ - 0.12), (-0.22, TOP + 0.12, HZ - 0.14)], [0.07, 0.05, 0.03], group='tuft', per=4)
c.curve([(0.04, TOP - 0.1, HZ - 0.04), (0.13, TOP + 0.03, HZ - 0.06), (0.21, TOP + 0.06, HZ - 0.02)], [0.06, 0.045, 0.028], group='tuft', per=4)

# ---- paint ----
c.decal('belly', (0, 0.7), (0.42, 0.4, 0.3), BELLY)
BILL_UP = [e for e in c.groups['head'] if e['pos'][2] > BZ - 0.1]
c.paint_fn(lambda p, n: p.z > BZ - 0.08 and any(_in(p, e, 1.2) for e in BILL_UP), BILL)
c.paint_group('billLo', BILL_DK, only=lambda p: in_group(p, ('billLo',)))
c.mirror(lambda s: c.paint('nostril', (s * 0.08, BY + 0.17, BZ + 0.24), (0.04, 0.06, 0.05), NOSTRIL))

# ---- wings: own layer, a swept-back paddle lying along the flank ----
c.layer('wings', base=YEL_DK, target_faces=2000)
WROOT = {}
def wing(s):
    g = 'wingL' if s < 0 else 'wingR'
    root = (s * 0.58, 1.08, -0.08)
    WROOT[s] = root
    c.blob(root, (0.13, 0.13, 0.13), group=g)
    n = Vector((s * 0.92, 0.3, 0.1)).normalized()
    pts = [(s * 0.64, 1.1, -0.06), (s * 0.82, 0.96, -0.3), (s * 0.86, 0.88, -0.6), (s * 0.8, 0.92, -0.84)]
    sheet(pts, [0.13, 0.26, 0.2, 0.07], n, g, flat=0.36)
    # two soft feather scallops along the trailing edge
    for k, (z, r) in enumerate(((-0.5, 0.11), (-0.68, 0.09))):
        a = Vector((s * 0.85, 0.8, z))
        sheet([tuple(a), tuple(a + Vector((0, -0.06, -0.12)))], [r, r * 0.75], n, g + 'f' + str(k), flat=0.4, per=3)
c.mirror(wing)

# ---- feet: own layer, flat webbed paddles poking out the front ----
c.layer('legs', base=FOOT, target_faces=1600)
def foot(s):
    g = 'legL' if s < 0 else 'legR'
    x = s * 0.32
    c.capsule((x, 0.36, 0.08), (x, 0.08, 0.2), 0.08, group=g)
    c.blob((x + s * 0.02, 0.06, 0.4), (0.22, 0.055, 0.26), rot=(0, s * 12, 0), group=g)
    for a in (-30, 0, 30):
        r = math.radians(a + s * 12)
        c.blob((x + s * 0.02 + math.sin(r) * 0.2, 0.055, 0.4 + math.cos(r) * 0.2), (0.07, 0.05, 0.07), group=g)
c.mirror(foot)
c.layer('skin')

# ---- rig ----
c.neck = (1.15, 1.5)     # the whole bill sits above the ramp, so it turns rigidly with the head
c.bone('body', (0, 0.3, 0), (0, 1.45, 0))
c.group_rules['body'] = ['main', 'head']
c.bone('head', (0, 1.45, HZ), (0, 2.6, HZ), parent='body', region=lambda p: p.y > 1.1 and p.z > -0.45)
c.chain('tuft', [(0, TOP - 0.12, HZ), (0, TOP + 0.12, HZ - 0.03), (0.03, TOP + 0.29, HZ + 0.16)], 'head', group='tuft')
c.chain('tail', [(0, 0.9, -0.7), (0, 1.1, -1.0), (0, 1.42, -1.22)], 'body', region=lambda p: p.z < -0.75 and p.y > 0.7, group='main')
for s in (-1, 1):
    L = '.L' if s < 0 else '.R'
    g = 'wingL' if s < 0 else 'wingR'
    c.bone('wing' + L, WROOT[s], (s * 0.84, 0.86, -0.7), parent='body', group=[g, g + 'f0', g + 'f1'])
    c.bone('leg' + L, (s * 0.32, 0.36, 0.08), (s * 0.32, 0.04, 0.48), parent='body', group='legL' if s < 0 else 'legR')

c.face(center=(0, HY + 0.02, 0.0), radius=0.66, faceScale=1.0, mouth=0, eyeSize=1.4)
for k, p in dict(nose=(0, BY + 0.06, BZ + 0.34), eyeL=(-0.24, HY + 0.1), eyeR=(0.24, HY + 0.1), mouth=(0, BY - 0.06, BZ + 0.28),
                 tummy=(0, 0.7), handL=(-0.88, 0.9, -0.3), handR=(0.88, 0.9, -0.3),
                 footL=(-0.34, 0.06, 0.62), footR=(0.34, 0.06, 0.62), earL=(-0.5, HY + 0.2, 0.35), earR=(0.5, HY + 0.2, 0.35)).items():
    c.anchor(k, p, 'head' if p[1] > 1.45 else 'body')
c.build()
