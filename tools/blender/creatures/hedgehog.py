import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from lib import Creature
from mathutils import Vector

# Hedgehog: one round ball under a coat of long swept-back spines, with a smooth cream face-and-tummy oval whose
# hairline is a row of soft scallops, a pointed snout with a shiny button nose (the code mouth sits just under it),
# tan button ears, and little arms with pink paw pads. One ball = one bone: the whole hedgehog turns, so the coat
# never tears across the face.
SPINE_TIP = 0xb98258
SPINE = 0x8f5c3c
CREAM = 0xffe6c8
TAN = 0xf0c49a
PINK = 0xffa9b8
NOSE = 0x4a2f3e

c = Creature('hedgehog', base=SPINE, target_faces=12500)

# ---------------- ball ----------------
MC = Vector((0, 0.82, -0.16))    # dome centre
MR = Vector((0.78, 0.72, 0.78))  # dome radii
c.blob(tuple(MC), tuple(MR))
c.blob((0, 0.47, 0.06), (0.55, 0.34, 0.49))                       # soft round tummy / base, lifted off the floor
HC = (0, 0.84, 0.36)
c.blob(HC, (0.52, 0.45, 0.45))                                   # face front
c.mirror(lambda s: c.blob((s * 0.25, 0.68, 0.58), (0.18, 0.15, 0.13)))   # chubby cheeks
SN = (0, 0.83, 0.75)
c.blob(SN, (0.145, 0.105, 0.155))                                   # pointed snout
NZ = (0, 0.86, 0.9)
c.blob(NZ, (0.078, 0.062, 0.056), group='nose')                   # shiny button nose
# round little ears at the hairline
EAR = lambda s: (s * 0.38, 1.16, 0.5)
c.mirror(lambda s: c.blob(EAR(s), (0.14, 0.14, 0.07), rot=(-10, s * 18, s * -20), group='ear' + str(s)))

# ---------------- face-and-tummy oval (front projected) ----------------
FO = (0.0, 0.68, 0.5, 0.56)      # centre x, y, radius x, y
def oval(p, grow=0.0):
    return p.z > -0.05 and ((p.x - FO[0]) / (FO[2] + grow)) ** 2 + ((p.y - FO[1]) / (FO[3] + grow)) ** 2 < 1.0
# a soft fringe: three round coat scallops dipping into the top of the face
SCAL = [(0.0, FO[1] + FO[3] * 0.98, 0.1), (-0.17, FO[1] + FO[3] * 0.9, 0.085), (0.17, FO[1] + FO[3] * 0.9, 0.085)]
def in_scallop(p):
    return p.z > 0 and any((p.x - x) ** 2 + (p.y - y) ** 2 < r * r for x, y, r in SCAL)

# ---------------- spines: long soft cones lying back like shingles; none in front of the face ----------------
def surf(a, b):
    """a: angle from +z (front) in degrees, b: angle around z (0 = right side, 90 = top)."""
    a, b = math.radians(a), math.radians(b)
    u = Vector((math.sin(a) * math.cos(b), math.sin(a) * math.sin(b), math.cos(a)))
    p = Vector((u.x * MR.x, u.y * MR.y, u.z * MR.z)) + MC
    n = Vector((u.x / MR.x, u.y / MR.y, u.z / MR.z)).normalized()
    return p, n

SPINES = []
R0, R1 = 0.19, 0.035
def spine(a, b, length, grp):
    p, n = surf(a, b)
    if oval(p, 0.1) or p.y < 0.34:
        return
    back = Vector((0, 0.2, -1))
    back = (back - n * back.dot(n)).normalized()
    # stand the spines up (a gentle 20 degree sweep back, not 50): a spine lying back over its neighbours made
    # an overhang with a gap behind it, and the game's ink outline drew loose strokes along every one of those
    # inside the coat. Upright, fat-based cones only overhang on the silhouette, so the ink stays there.
    d = (n + back * 0.3).normalized()
    base = p - n * 0.05
    tip = p + d * length * 0.86
    steps = 7
    for i in range(steps):
        t = i / (steps - 1)
        r = R1 + (R0 - R1) * (1 - t) ** 1.7
        c.blob(tuple(base.lerp(tip, t)), (r, r, r), group='spines' + grp)
    SPINES.append((base, tip))

rows = [  # angle from front, count, span around, length
    (46, 6, (24, 156), 0.34),
    (66, 8, (4, 176), 0.4),
    (86, 9, (-18, 198), 0.44),
    (106, 10, (-22, 202), 0.46),
    (126, 9, (-16, 196), 0.46),
    (146, 8, (-4, 184), 0.42),
    (166, 5, (20, 160), 0.34),
]
for ri, (a, n, (b0, b1), L) in enumerate(rows):
    off = 0.5 if ri % 2 else 0.0
    for i in range(n):
        b = b0 + (b1 - b0) * ((i + off) / (n - 1 + (1 if off else 0)))
        low = max(0.0, math.sin(math.radians(b)))      # shorter spines low on the sides
        spine(a, b, L * (0.7 + 0.3 * low), 'ABCD'[(ri % 2) * 2 + i % 2])

# ---------------- arms, paws ----------------
SH = lambda s: (s * 0.36, 0.52, 0.48)
HAND = lambda s: (s * 0.31, 0.3, 0.8)
c.mirror(lambda s: c.blob(SH(s), (0.1, 0.1, 0.1), group='arm' + str(s)))
c.mirror(lambda s: c.capsule((s * 0.36, 0.5, 0.53), HAND(s), 0.09, r2=0.095, group='arm' + str(s)))
FOOT = lambda s: (s * 0.27, 0.08, 0.5)
BFOOT = lambda s: (s * 0.44, 0.08, -0.3)
c.mirror(lambda s: c.blob(FOOT(s), (0.13, 0.08, 0.18), group='foot' + str(s)))
c.mirror(lambda s: c.blob(BFOOT(s), (0.14, 0.08, 0.17), group='bfoot' + str(s)))

def near_seg(a, b, r):
    a, b = Vector(a), Vector(b)
    def f(p):
        t = max(0.0, min(1.0, (p - a).dot(b - a) / (b - a).length_squared))
        return (p - a.lerp(b, t)).length < r
    return f

# ---------------- paint ----------------
def on_tip(p):
    for a, b in SPINES:
        ab = b - a
        t = (p - a).dot(ab) / ab.length_squared
        if t < 0.7 or t > 1.25:
            continue
        tt = min(1.0, t)
        if (p - a.lerp(b, tt)).length < R0 + (R1 - R0) * tt ** 0.85 + 0.04:
            return True
    return False
c.paint_fn(lambda p, n: oval(p) and not in_scallop(p) and p.y > 0.12, CREAM)
c.paint_fn(lambda p, n: p.y < 0.34 and n.y < -0.3 and p.z > -0.5, CREAM)        # soft cream tummy underneath, not a brown slab
c.paint('nose', NZ, (0.09, 0.075, 0.07), NOSE, only=lambda p: p.z > NZ[2] - 0.03)
for s in (-1, 1):
    c.paint('ear', EAR(s), (0.16, 0.16, 0.1), TAN, rot=(-10, s * 18, s * -20))
    c.paint('ear_in', (EAR(s)[0], EAR(s)[1], EAR(s)[2] + 0.06), (0.08, 0.08, 0.06), PINK, only=lambda p: p.z > 0.53)
    arm_f = near_seg(SH(s), HAND(s), 0.125)
    c.paint_fn(lambda p, n, f=arm_f: f(p) and p.z > 0.5, TAN)
    c.paint('hand', (HAND(s)[0], HAND(s)[1], HAND(s)[2] + 0.07), (0.075, 0.075, 0.05), PINK)
    c.paint('foot', FOOT(s), (0.15, 0.1, 0.2), TAN)
    c.paint('bfoot', BFOOT(s), (0.16, 0.1, 0.19), TAN)
    c.paint('toe', (s * 0.27, 0.08, 0.67), (0.08, 0.06, 0.05), PINK)

# ---------------- rig: one ball, one bone (plus arms and front feet) ----------------
c.bone('body', (0, 0.1, 0), (0, 1.2, 0))
c.group_rules['body'] = ['main', 'nose', 'ear-1', 'ear1', 'bfoot-1', 'bfoot1', 'spinesA', 'spinesB', 'spinesC', 'spinesD']
for s in (-1, 1):
    side = '.L' if s < 0 else '.R'
    c.bone('arm' + side, SH(s), HAND(s), parent='body', region=near_seg(SH(s), HAND(s), 0.16))
    c.group_rules['arm' + side] = ['arm' + str(s)]
    c.bone('leg' + side, (s * 0.27, 0.22, 0.42), (s * 0.27, 0.06, 0.66), parent='body')
    c.group_rules['leg' + side] = ['foot' + str(s)]

FR = 0.56
MY, MZ = 0.0, 0.0
c.face(center=(0, HC[1], 0.332), radius=FR, faceScale=1.0, bone='body', snap=False, eyeSize=1.15, mouthY=MY, mouthZ=MZ)
anch = dict(nose=(0, NZ[1]), eyeL=(-0.36 * FR, HC[1] + 0.12 * FR), eyeR=(0.36 * FR, HC[1] + 0.12 * FR),
            mouth=(0, HC[1] - 0.3 * FR + MY), tummy=(0, 0.36), handL=(-0.31, 0.32, 0.86), handR=(0.31, 0.32, 0.86),
            footL=(-0.27, 0.08, 0.68), footR=(0.27, 0.08, 0.68), earL=(-0.38, 1.16, 0.58), earR=(0.38, 1.16, 0.58))
for k, p in anch.items():
    c.anchor(k, p, 'body')

# ---------------- polish: soft normals (clean outline, smooth toon bands) ----------------
def soften_normals(me, iters=8, calm=()):
    """Diffuse the vertex normals over the surface and store them as custom normals. The game's ink outline pushes
    back faces out along the normals, so where a crease (armpit, tummy over the feet) turns the normal faster than
    the outline is thick, the hull folds inside out and shows as ink specks; softened normals keep the hull one clean
    shell, so the ink stays a single line on the silhouette. calm = [(centre, half-size, passes)]: extra smoothing
    inside these game-space ellipsoids (fading out at their edge) so the toon bands sweep smoothly across a big
    gentle patch like the tummy instead of breaking into facet wedges."""
    import numpy as np
    V = len(me.vertices)
    N = np.empty(V * 3); me.vertices.foreach_get('normal', N); N = N.reshape(V, 3)
    co = np.empty(V * 3); me.vertices.foreach_get('co', co); co = co.reshape(V, 3)
    gp = np.stack([co[:, 0], co[:, 2], -co[:, 1]], 1)          # blender -> game
    E = len(me.edges)
    ed = np.empty(E * 2, dtype=np.int64); me.edges.foreach_get('vertices', ed); ed = ed.reshape(E, 2)
    deg = np.maximum(np.bincount(ed.ravel(), minlength=V).astype(float), 1)[:, None]
    def diffuse(N, k, w):
        for _ in range(k):
            acc = np.zeros_like(N)
            np.add.at(acc, ed[:, 0], N[ed[:, 1]])
            np.add.at(acc, ed[:, 1], N[ed[:, 0]])
            N = N + w * (acc / deg - N)
            N /= np.linalg.norm(N, axis=1, keepdims=True) + 1e-12
        return N
    N = diffuse(N, iters, 0.5)
    for c0, s0, k in calm:
        q = np.sqrt((((gp - np.array(c0)) / np.array(s0)) ** 2).sum(1))
        w = np.clip((1.0 - q) / 0.35, 0, 1)[:, None] * 0.6
        N = diffuse(N, k, w)
    me.normals_split_custom_set_from_vertices([tuple(n) for n in N])
def polish(c, iters=8, calm=()):
    paint0 = c._paint
    def paint(skin):
        paint0(skin)
        if c._cur == 'skin':
            soften_normals(skin.data, iters, calm)
    c._paint = paint
def soft_joints(c, joints):
    """joints = [(bone, pivot, radius, share)]: after the normal skinning, hand part of the 'body' weight of the skin
    round each shoulder pivot to the arm (most at the pivot, none at radius), so a raised arm bends the shoulder as one
    soft curve instead of shearing a thin ring of skin into a crease (dark ink folds, a broken side outline)."""
    w0 = c._weights
    def weights(skin, ao, smooth_iters=None):
        w0(skin, ao, smooth_iters)
        if c._cur != 'skin':
            return
        import numpy as np
        me = skin.data
        V = len(me.vertices)
        vgs = skin.vertex_groups
        names = [g.name for g in vgs]
        W = np.zeros((V, len(names)))
        for v in me.vertices:
            for g in v.groups:
                W[v.index, g.group] = g.weight
        co = np.array([v.co[:] for v in me.vertices])
        gp = np.stack([co[:, 0], co[:, 2], -co[:, 1]], 1)
        jb = names.index('body')
        for bone, pivot, rad, share in joints:
            j = names.index(bone)
            t = np.clip(1 - np.linalg.norm(gp - np.array(pivot), axis=1) / rad, 0, 1)
            move = W[:, jb] * share * t * t * (3 - 2 * t)
            W[:, jb] -= move
            W[:, j] += move
        for v in range(V):
            for j in np.nonzero(W[v] > 0.002)[0]:
                vgs[j].add([v], float(W[v, j]), 'REPLACE')
            for j in np.nonzero((W[v] <= 0.002) & (W[v] > 0))[0]:
                vgs[j].remove([v])
    c._weights = weights
polish(c, iters=6)
c.build()
