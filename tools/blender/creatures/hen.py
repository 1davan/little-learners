import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from lib import Creature
from mathutils import Vector, Matrix, Euler

# Mother hen: a plump caramel hen with a chesty cream front, a round head with a cream face, a three-lobed red
# comb, a chunky yellow beak with two red wattle drops, big folded wings with darker feather tips, a fanned
# three-feather tail and orange three-toed feet. About 2.2 tall (comb included), so she stands well below the cow.
# Wings and legs are their own layers, each owned rigidly by its bone: a flap swings a clean wing out of the
# shoulder, the body never stretches into a web.
BODY = 0xf0ab68     # warm caramel
CREAM = 0xfff2de
WING = 0xdc904e
TIP = 0xb86c3c
COMB = 0xff4d57
BEAK = 0xffc23d
BEAK_LO = 0xffa22e
LEG = 0xffac38

c = Creature('hen', base=BODY, target_faces=11000)

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

def in_group(p, groups, grow=1.15):
    for g in groups:
        for e in c.groups[g]:
            m = Euler([math.radians(a) for a in e['rot']]).to_matrix().inverted()
            d = m @ (Vector(p) - Vector(e['pos']))
            sx, sy, sz = e['size']
            if (d.x / (sx * grow)) ** 2 + (d.y / (sy * grow)) ** 2 + (d.z / (sz * grow)) ** 2 <= 1:
                return True
    return False

# ---- body: plump egg, chesty in front, rising to the tail at the back ----
c.blob((0, 0.74, -0.05), (0.72, 0.58, 0.7))
c.blob((0, 0.8, 0.2), (0.55, 0.48, 0.45))           # chest puff
c.blob((0, 0.94, -0.42), (0.45, 0.4, 0.38))         # rump rising toward the tail
c.blob((0, 1.24, 0.06), (0.36, 0.2, 0.32))          # neck blend: a soft throat, no deep crease to fold
# ---- head: big and round ----
HY, HZ = 1.6, 0.1
c.blob((0, HY, HZ), (0.54, 0.5, 0.5), group='head')
c.mirror(lambda s: c.blob((s * 0.26, HY - 0.16, HZ + 0.22), (0.18, 0.14, 0.15), group='head'))   # cheek puffs

# ---- comb: three lobes that read from the front as a little crown ----
TOP = HY + 0.5
c.blob((0, TOP + 0.08, HZ), (0.13, 0.19, 0.13), group='comb', stiffness=2.5)
c.mirror(lambda s: c.blob((s * 0.13, TOP + 0.01, HZ - 0.01), (0.11, 0.15, 0.12), rot=(0, 0, -s * 25), group='comb', stiffness=2.5))
c.blob((0, TOP - 0.08, HZ - 0.02), (0.16, 0.08, 0.16), group='comb')     # root, sunk in the crown

# ---- beak: chunky cone pointing forward and a touch down ----
BY, BZ = HY - 0.1, HZ + 0.44
for t, w, h, d in [(0.0, 0.15, 0.13, 0.14), (0.12, 0.105, 0.09, 0.12), (0.22, 0.06, 0.055, 0.09)]:
    c.blob((0, BY - t * 0.25, BZ + t), (w, h, d), group='beak', stiffness=2.5)
# ---- wattle: two soft red drops under the beak ----
c.mirror(lambda s: c.blob((s * 0.065, BY - 0.2, BZ + 0.02), (0.075, 0.13, 0.065), group='wattle', stiffness=2.5))

# ---- tail: three rounded feathers fanned up and back ----
TAILG = []
for g, ang in (('tailA', -40), ('tailB', 0), ('tailC', 40)):
    a = math.radians(ang)
    ln = 1.0 if ang == 0 else 0.8
    base = (math.sin(a) * 0.06, 1.0, -0.56)
    tip = (math.sin(a) * 0.62 * ln, 1.0 + 0.78 * ln * math.cos(a), -0.94)
    mid = ((base[0] + tip[0]) / 2, (base[1] + tip[1]) / 2 + 0.03, -0.84)
    sheet([base, mid, tip], [0.13, 0.17, 0.1], (math.sin(a) * 0.3, -0.25, -1), g, flat=0.45)
    TAILG.append(g)

# ---- paint ----
c.decal('chest', (0, 0.74), (0.4, 0.36, 0.25), CREAM)
for x, y in ((-0.26, 0.98), (-0.1, 1.05), (0.1, 1.05), (0.26, 0.98)):     # soft scalloped top edge of the bib
    c.decal('chestfluff', (x, y), (0.13, 0.1, 0.25), CREAM)
c.paint_group(TAILG, WING)
c.paint_group(TAILG, TIP, only=lambda p: p.y > 1.6)
c.paint_group('comb', COMB, only=lambda p: in_group(p, ('comb',)))
c.paint_group('wattle', COMB, only=lambda p: in_group(p, ('wattle',)))
c.paint_group('beak', BEAK, only=lambda p: in_group(p, ('beak',)))
c.paint_group('beak', BEAK_LO, only=lambda p: in_group(p, ('beak',)) and p.y < BY - 0.05)

# ---- wings: own layer, a big folded teardrop wing with darker feather tips ----
c.layer('wings', base=WING, target_faces=2000)
WROOT = {}
def wing(s):
    g = 'wingL' if s < 0 else 'wingR'
    root = (s * 0.52, 1.1, -0.04)
    WROOT[s] = root
    c.blob(root, (0.14, 0.14, 0.14), group=g)
    n = Vector((s * 0.88, 0.15, 0.45)).normalized()
    pts = [(s * 0.58, 1.1, -0.04), (s * 0.72, 0.96, -0.1), (s * 0.8, 0.78, -0.2), (s * 0.8, 0.64, -0.3)]
    sheet(pts, [0.14, 0.26, 0.22, 0.12], n, g, flat=0.4)
    t = (Vector(pts[-1]) - Vector(pts[1])).normalized()
    w = n.cross(t).normalized()
    if w.y < 0:
        w = -w
    for k, r in ((-1, 0.09), (0, 0.1), (1, 0.085)):
        a = Vector(pts[-1]) + w * (k * 0.12) - t * 0.03
        b = a + t * (0.12 - abs(k) * 0.03) + w * (k * 0.03)
        sheet([tuple(a), tuple(b)], [r, r * 0.8], n, g + 'f' + str(k + 1), flat=0.45, per=3)
c.mirror(wing)
c.paint_group([g + 'f' + str(k) for g in ('wingL', 'wingR') for k in range(3)], TIP)

# ---- legs and three-toed feet: own layer ----
c.layer('legs', base=LEG, target_faces=1600)
def leg(s):
    g = 'legL' if s < 0 else 'legR'
    x = s * 0.26
    c.capsule((x, 0.42, 0.04), (x, 0.07, 0.1), 0.065, group=g)
    for ang in (-38, 0, 38):
        a = math.radians(ang + s * 6)
        c.capsule((x, 0.055, 0.1), (x + math.sin(a) * 0.22, 0.05, 0.1 + math.cos(a) * 0.22), 0.066, r2=0.056, group=g)   # chunky toes: a closed ink outline
c.mirror(leg)
c.layer('skin')

# ---- rig ----
c.neck = (0.98, 1.46)    # spread the head turn over the whole throat so the neck crease never folds
c.bone('body', (0, 0.3, 0), (0, 1.25, 0))
c.group_rules['body'] = ['main', 'head']
c.bone('head', (0, HY, HZ), (0, HY + 0.9, HZ), parent='body', region=lambda p: p.y > 1.1 and p.z > -0.5)
c.chain('comb', [(0, TOP - 0.1, HZ), (0, TOP + 0.1, HZ), (0, TOP + 0.3, HZ)], 'head', group='comb')
c.bone('wattle.1', (0, BY - 0.06, BZ + 0.04), (0, BY - 0.42, BZ + 0.06), parent='head', group='wattle')
c.chain('tail', [(0, 1.0, -0.56), (0, 1.36, -0.8), (0, 1.78, -0.94)], 'body', group=TAILG)
for s in (-1, 1):
    L = '.L' if s < 0 else '.R'
    g = 'wingL' if s < 0 else 'wingR'
    c.bone('wing' + L, WROOT[s], (s * 0.82, 0.58, -0.3), parent='body', group=[g] + [g + 'f' + str(k) for k in range(3)])
    c.bone('leg' + L, (s * 0.26, 0.42, 0.04), (s * 0.26, 0.04, 0.1), parent='body', group='legL' if s < 0 else 'legR')

c.face(center=(0, HY + 0.02, 0.0), radius=0.52, faceScale=1.0, mouth=0, eyeSize=1.3)
for k, p in dict(nose=(0, BY, BZ + 0.24), eyeL=(-0.2, HY + 0.06), eyeR=(0.2, HY + 0.06), mouth=(0, BY - 0.04, BZ + 0.18),
                 tummy=(0, 0.8), handL=(-0.84, 0.66, -0.25), handR=(0.84, 0.66, -0.25),
                 footL=(-0.26, 0.05, 0.3), footR=(0.26, 0.05, 0.3), earL=(-0.4, HY + 0.1, 0.3), earR=(0.4, HY + 0.1, 0.3)).items():
    c.anchor(k, p, 'head' if p[1] > 1.3 else 'body')
c.build()
