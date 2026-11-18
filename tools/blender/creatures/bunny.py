import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from lib import Creature
from mathutils import Vector, Matrix

FUR = 0xfffbf7      # warm snowy white
CREAM = 0xffe4cb    # muzzle / belly: warm enough to read against the white
PINK = 0xffa0bf     # inner ears, pads
NOSE = 0xff7aa8

c = Creature('bunny', base=FUR, target_faces=12000)

# ---------------- body: small soft pear (short, so the head is ~55% of the height) ----------------
c.blob((0, 0.55, 0.0), (0.5, 0.4, 0.46))      # bottom lifted clear of the floor between the feet: a clean tummy line
c.blob((0, 0.82, 0.0), (0.34, 0.24, 0.32))
c.blob((0, 1.02, -0.01), (0.24, 0.12, 0.22))             # neck blend
# ---------------- head: big, round, chubby cheeks ----------------
HY = 1.58
c.blob((0, HY, 0.0), (0.74, 0.62, 0.6))
c.mirror(lambda s: c.blob((s * 0.3, HY - 0.2, 0.24), (0.25, 0.2, 0.18)))   # cheeks
c.blob((0, HY - 0.2, 0.42), (0.21, 0.14, 0.14))                              # soft muzzle mound
EY = HY + 0.44     # ear root height
EL = 0.86          # ear length factor (vs the old 1.2-long ears)

# ---------------- ears: long, soft, spoon-shaped; the right one flops ----------------
EARS = {}
def sheet(pts, radii, normal, group, flat=0.42, per=6):
    """Blobs along a Catmull-Rom curve, each flattened across a fixed sheet normal (so a bend stays in the
    ear's plane and the ear stays a flat soft paddle all the way round the flop)."""
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
            m = Matrix((tx, ty, tz)).transposed()
            e = m.to_euler('XYZ')
            c.blob(tuple(p), (r, r * 0.9, r * flat), rot=tuple(math.degrees(a) for a in e), group=group)

def ear(s):
    g = 'ear' + ('L' if s < 0 else 'R')
    if s < 0:   # upright, leaning out and a touch back
        pts = [(s * 0.24, 0, -0.04), (s * 0.31, 0.35, -0.06), (s * 0.38, 0.72, -0.07), (s * 0.44, 1.04, -0.05), (s * 0.47, 1.22, -0.02)]
        rad = [0.1, 0.17, 0.2, 0.17, 0.08]
    else:       # gentle flop: the top third droops over to the side
        pts = [(s * 0.24, 0, -0.04), (s * 0.32, 0.35, -0.06), (s * 0.41, 0.68, -0.05), (s * 0.54, 0.88, -0.03), (s * 0.71, 0.87, -0.01), (s * 0.84, 0.72, 0.01)]
        rad = [0.1, 0.17, 0.2, 0.19, 0.16, 0.08]
    pts = [(x, EY + y * EL, z) for x, y, z in pts]
    rad = [r * 0.95 for r in rad]
    sheet(pts, rad, (s * 0.3, 0, 1), g)
    c.blob((s * 0.22, EY - 0.06, -0.03), (0.15, 0.14, 0.12))   # root grows out of the skull (head family)
    EARS[s] = (pts, rad, 1.0)
c.mirror(ear)

# ---------------- arms: A-pose at the sides, a clear armpit; a root ball sunk at the shoulder pivot ----------------
SH = lambda s: (s * 0.27, 0.92, 0.03)
def arm(s):
    g = 'arm' + str(s)
    c.blob(SH(s), (0.11, 0.11, 0.11), group=g)
    c.capsule((s * 0.32, 0.89, 0.04), (s * 0.68, 0.63, 0.1), 0.105, r2=0.1, group=g)
    c.blob((s * 0.73, 0.58, 0.12), (0.13, 0.13, 0.125), group=g)
c.mirror(arm)
# ---------------- feet: big long bunny feet ----------------
c.mirror(lambda s: c.blob((s * 0.28, 0.14, 0.2), (0.215, 0.14, 0.42), group='foot' + str(s)))   # a gap between them: each sole inked
c.mirror(lambda s: c.blob((s * 0.26, 0.3, 0.0), (0.17, 0.14, 0.17), group='foot' + str(s)))   # heel/haunch root
# ---------------- tail: fluffy pom ----------------
for p, r in [((0, 0.5, -0.6), 0.2), ((0.1, 0.57, -0.62), 0.13), ((-0.1, 0.57, -0.62), 0.13),
             ((0.09, 0.42, -0.63), 0.13), ((-0.09, 0.42, -0.63), 0.13), ((0, 0.62, -0.6), 0.13), ((0, 0.5, -0.72), 0.13)]:
    c.blob(p, (r, r, r), group='tail')


# ---------------- paint ----------------
def ear_inner(s):
    pts, rad, fold = EARS[s]
    P = [Vector(p) for p in pts]
    # dense polyline along the ear
    samp = []
    for i in range(len(P) - 1):
        for k in range(12):
            t = k / 12
            samp.append(((i + t) / (len(P) - 1), P[i].lerp(P[i + 1], t), rad[i] + (rad[i + 1] - rad[i]) * t))
    def fn(p, n):
        if p.x * s < 0.12 or p.y < EY or n.z < 0.15:
            return False
        best = None
        for t, q, r in samp:
            d = math.hypot(p.x - q.x, p.y - q.y)
            if best is None or d < best[0]:
                best = (d, t, r)
        d, t, r = best
        u = min(1.0, max(0.0, (t - 0.07) / 0.86))
        return d < r * 0.6 * math.sin(math.pi * u) ** 0.45
    return fn
c.mirror(lambda s: c.paint_fn(ear_inner(s), PINK))
BELLY = 0xffdcc0
c.decal('belly', (0, 0.52), (0.33, 0.34, 0.3), BELLY)
c.decal('muzzle', (0, HY - 0.2), (0.26, 0.17, 0.3), BELLY)
c.mirror(lambda s: c.paint('pad', (s * 0.75, 0.56, 0.24), (0.085, 0.085, 0.06), PINK))       # paw pads
c.mirror(lambda s: c.paint('toe', (s * 0.26, 0.15, 0.6), (0.14, 0.1, 0.06), PINK))           # toe pad
c.mirror(lambda s: c.paint('sole', (s * 0.26, 0.0, 0.22), (0.13, 0.03, 0.22), PINK))

# ---------------- rig ----------------
c.neck = (0.98, 1.18)
c.bone('body', (0, 0.25, 0), (0, 1.05, 0))
c.group_rules['body'] = ['main']
# head bone origin sits so the share game's bow (head-local (0.32, 0.5, 0.35)) lands by the right ear root
c.bone('head', (0, 1.55, 0), (0, 2.3, 0), parent='body', region=lambda p: p.y > 0.95)
c.group_rules['head'] = ['main', 'ear-1', 'ear1']
for s in (-1, 1):
    pts, rad, fold = EARS[s]
    nm = 'ear' + ('.L' if s < 0 else '.R')
    c.chain(nm, [(s * 0.23, EY - 0.04, -0.04), pts[2], pts[-1]], 'head', region=(lambda p, s=s: p.y > EY - 0.08 and p.x * s > 0.04))
    for i in (1, 2):
        c.group_rules[f'ear{nm[-2:]}.{i}'] = ['ear' + ('L' if s < 0 else 'R')]
for s in (-1, 1):
    side = '.L' if s < 0 else '.R'
    c.bone('arm' + side, SH(s), (s * 0.75, 0.56, 0.12), parent='body')
    c.group_rules['arm' + side] = ['arm' + str(s)]
    c.bone('leg' + side, (s * 0.25, 0.34, 0.0), (s * 0.26, 0.06, 0.5), parent='body')
    c.group_rules['leg' + side] = ['foot' + str(s)]
c.bone('tail.1', (0, 0.5, -0.5), (0, 0.55, -0.82), parent='body')
c.group_rules['tail.1'] = ['tail']

FR = 0.66
MY, MZ = 0.0, 0.015
c.face(center=(0, HY - 0.02, 0.0), radius=FR, faceScale=1.0, noseColor=NOSE, mouthY=MY, mouthZ=MZ)
lp, rp = EARS[-1][0], EARS[1][0]
anch = dict(nose=(0, HY - 0.02 - 0.06 * FR), eyeL=(-0.36 * FR, HY - 0.02 + 0.12 * FR), eyeR=(0.36 * FR, HY - 0.02 + 0.12 * FR),
            mouth=(0, HY - 0.02 - 0.3 * FR + MY), tummy=(0, 0.52), handL=(-0.75, 0.56), handR=(0.75, 0.56),
            footL=(-0.26, 0.14), footR=(0.26, 0.14),
            earL=(lp[2][0], lp[2][1], lp[2][2] + 0.1), earR=(rp[3][0], rp[3][1], rp[3][2] + 0.1))
for k, p in anch.items():
    c.anchor(k, p, 'head' if p[1] > 1.1 else 'body')


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
polish(c, calm=[((0, 0.55, 0.42), (0.42, 0.44, 0.3), 40)])
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
soft_joints(c, [('arm.L', SH(-1), 0.3, 0.6), ('arm.R', SH(1), 0.3, 0.6)])
c.extras['outline'] = 0.032     # white fur on pale backgrounds needs a slightly bolder ink line
c.build()
