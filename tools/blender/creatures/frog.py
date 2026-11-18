import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from lib import Creature

SKIN = 0x72d65c
DARK = 0x3f9e4a
BELLY = 0xeefad0
WHITE = 0xfffdf4
PAD = 0xa6e67e
BACK = 0x5fc455

# eye domes on top of the head (own groups so they stay round)
EX, EY, EZ, ER = 0.47, 1.92, 0.25, 0.29
FACE_R = 1.0          # code-face radius: small enough that brows, cheeks and mouth sit ON the head
MOUTH_Y = 1.47         # where the smile line (-0.3R) lands on the face


class Frog(Creature):
    def _empties(self, ao):
        # Slide the (small) face sphere forward until its flat smile ring sits just in front of the skin over the
        # whole mouth area, then report where the pupils land against the eye-dome fronts.
        f = self.face_info
        R = f['radius']
        cx, cy, _ = f['center']
        zmax = max(self.surface(x * R, cy + y * R).z for x in (-0.22, -0.1, 0, 0.1, 0.22) for y in (-0.25, -0.3, -0.38, -0.46))
        cz = zmax + 0.012 - (math.sqrt(R * R - (0.3 * R) ** 2) - 0.03 * R)
        f['center'] = (cx, cy, cz)
        o = f['opts']
        ex, ey = o['eyeX'] * R, o['eyeY'] * R
        pz = cz + math.sqrt(R * R - ex * ex - ey * ey) - 0.12 * 0.14 * R * o['eyeSize']
        print('FACE cz %.3f pupil z %.3f dome front %.3f' % (cz, pz, EZ + ER))
        super()._empties(ao)


c = Frog('frog', base=SKIN, target_faces=12500)

# ---- body: squat soft pear ----
c.blob((0, 0.66, -0.1), (0.6, 0.56, 0.52))
c.blob((0, 0.47, -0.04), (0.6, 0.31, 0.5))   # tummy bottom clear of the floor between the legs, so its ink line shows
# ---- head: wide, slightly flattened, sits low on the body ----
c.blob((0, 1.48, -0.02), (1.0, 0.48, 0.6))
c.mirror(lambda s: c.blob((s * 0.45, 1.36, 0.08), (0.4, 0.3, 0.42)))   # wide jowls
c.blob((0, 1.15, -0.04), (0.62, 0.24, 0.48))   # neck blend
c.mirror(lambda s: c.blob((s * EX, EY, EZ), (ER, ER * 0.95, ER), group='eye' + str(s)))


# ---- chunky back legs: folded haunch (body) + big webbed foot that pivots at the ankle ----
ANKLE = 0.68, 0.13, 0.22
TOES = ((-0.6, 0.24), (0.0, 0.28), (0.6, 0.24))
def leg(s):
    g = 'haunch' + str(s)
    c.blob((s * 0.6, 0.36, -0.1), (0.32, 0.3, 0.42), rot=(0, s * 25, 0), group=g)
    c.blob((s * 0.66, 0.16, 0.14), (0.17, 0.12, 0.2), group=g)
    gf = 'foot' + str(s)
    fx, fz = s * 0.7, 0.42
    c.blob((s * ANKLE[0], 0.1, ANKLE[2] + 0.02), (0.12, 0.08, 0.1), group=gf)      # ankle knob
    c.blob((fx, 0.06, fz), (0.18, 0.06, 0.18), group=gf)
    for a, ln in TOES:
        ang = a + s * 0.45
        tx, tz = fx + math.sin(ang) * ln, fz + math.cos(ang) * ln
        c.capsule((fx, 0.05, fz), (tx, 0.05, tz), 0.06, group=gf)
        c.blob((tx, 0.06, tz), (0.085, 0.06, 0.085), group=gf)
c.mirror(leg)


# ---- little front arms in an A-pose, clear of the jowls, with three finger pads ----
def arm(s):
    g = 'arm' + str(s)
    c.capsule((s * 0.6, 0.97, 0.22), (s * 0.88, 0.64, 0.44), 0.135, r2=0.115, group=g)
    c.blob((s * 0.9, 0.6, 0.47), (0.14, 0.08, 0.13), group=g)
    # three round fingertips along the front edge of the hand, so they read from the front too
    for dx, dy in ((-0.1, 0.01), (0.0, -0.02), (0.1, 0.01)):
        c.blob((s * (0.9 + dx), 0.55 + dy, 0.57), (0.055, 0.05, 0.055), group=g)
c.mirror(arm)

# ---- paint (later wins) ----
# back a shade deeper than the front: one big smooth ellipsoid behind, so its border is a clean curve
c.paint('back', (0, 0.95, -1.12), (1.35, 1.25, 0.98), BACK, only=lambda p: p.y > 0.2)
c.decal('belly', (0, 0.66), (0.42, 0.46, 0.3), BELLY)
# eye whites on the front of the domes
c.mirror(lambda s: c.paint('white', (s * EX, EY + 0.01, EZ + 0.16), (0.25, 0.25, 0.2), WHITE, only=lambda p: p.y > 1.7))
# spots on the back and the crown, projected from behind so they stay round
for (x, y, r) in ((0.3, 1.0, 0.13), (-0.34, 0.72, 0.14), (0.0, 1.32, 0.11), (-0.1, 0.45, 0.1), (0.42, 0.52, 0.1),
                  (-0.44, 1.12, 0.1), (0.62, 1.42, 0.1), (-0.66, 1.48, 0.09), (0.0, 1.62, 0.08)):
    c.decal('spot', (x, y), (r, r, 0.2), DARK, z_from=-3.0, dir=(0, 0, 1))
# toe pads
def toe_tip(p, n):
    if p.y > 0.13:
        return False
    for s in (-1, 1):
        for a, ln in TOES:
            ang = a + s * 0.45
            tx, tz = s * 0.7 + math.sin(ang) * ln, 0.42 + math.cos(ang) * ln
            if (p.x - tx) ** 2 + (p.z - tz) ** 2 < 0.075 ** 2:
                return True
    return False
c.paint_fn(toe_tip, PAD)
c.mirror(lambda s: c.paint('fpad', (s * 0.9, 0.54, 0.6), (0.17, 0.07, 0.08), PAD))

# ---- rig ----
c.bone('body', (0, 0.15, 0), (0, 1.1, 0))
c.bone('head', (0, 1.1, 0), (0, 2.2, 0), parent='body', region=lambda p: p.y > 1.04)
c.neck = (1.0, 1.2)
c.group_rules['body'] = ['main', 'haunch-1', 'haunch1']
c.group_rules['head'] = ['main', 'eye-1', 'eye1']
for s, side in ((-1, 'L'), (1, 'R')):
    # the bone lies in the frontal plane (not along the forward-reaching arm), so rotation.z waves the arm up
    # beside the face and keeps the hand in FRONT of the jowls instead of swinging it behind them
    c.bone('arm.' + side, (s * 0.6, 0.97, 0.22), (s * 0.9, 0.6, 0.22), parent='body', group='arm' + str(s))
    # the foot pivots at the ankle: hop / stride flex the webbed foot, the haunch stays part of the body
    c.bone('leg.' + side, (s * ANKLE[0], ANKLE[1], ANKLE[2]), (s * 0.7, 0.05, 0.62), parent='body', group='foot' + str(s))

# face: eyes (eyeX/eyeY) land in the domes, brows just above them, cheeks and smile on the head
FY = MOUTH_Y + 0.3 * FACE_R
c.face(center=(0, FY, 0), radius=FACE_R, snap=False, eyeX=EX / FACE_R, eyeY=(EY - FY) / FACE_R,
       eyeSize=0.17 / (0.14 * FACE_R), browY=0.2)
for k, p in dict(nose=(0, 1.62), eyeL=(-EX, EY), eyeR=(EX, EY), mouth=(0, MOUTH_Y - 0.05),
                 tummy=(0, 0.66), handL=(-0.9, 0.6, 0.6), handR=(0.9, 0.6, 0.6),
                 footL=(-0.75, 0.08, 0.62), footR=(0.75, 0.08, 0.62), earL=(-0.9, 1.5, 0.1), earR=(0.9, 1.5, 0.1)).items():
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
polish(c, calm=[((0, 0.62, 0.4), (0.48, 0.52, 0.36), 40)])
c.build()
