import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from lib import Creature, G
from mathutils import Matrix

# Cat: orange tabby kitten. Big round head (~50% of the height), soft pear body on short visible legs, A-pose arms
# with cream paws, one muzzle pad the code mouth sits on, pointy pink-lined ears, an "M" that runs back over the
# crown, tabby bands, a long curling striped tail and fine ink whiskers (their own thin layer).
FUR = 0xffa142      # orange tabby
STRIPE = 0xe06d24   # darker tabby stripes
CREAM = 0xfff1dc    # muzzle, bib, paws, tail tip
PINK = 0xffa9c6     # inner ears
NOSE = 0xff7fa6     # little pink nose
WHISK = 0x3a2838    # whiskers: ink, so fill + outline read as one fine stroke



class Cat(Creature):
    """The 'whiskers' layer is a set of thin flat ribbons lying on the cheeks (metaballs can't make lines this fine).
    Their normals point straight out of / into the face, so the game's ink outline (back faces pushed out along
    the normals) sinks into the cheek instead of fattening the stroke: each whisker reads as one fine ink line."""
    def _skin(self):
        if self._cur != 'whiskers':
            return super()._skin()
        import bpy, bmesh
        from mathutils import Vector
        inv = Matrix(((1, 0, 0), (0, 0, 1), (0, -1, 0)))
        sk = self._skin_obj
        verts, faces, norms = [], [], []
        for pts in WHISKERS:
            P, N = [], []
            n_s = 9
            for k in range(n_s):     # sample the polyline evenly and snap each sample onto the cheek
                t = k / (n_s - 1) * (len(pts) - 1)
                i = min(int(t), len(pts) - 2); f = t - i
                x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f
                y = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f
                ok, loc, nrm, _ = sk.ray_cast(G((x, y, 3.0)), (G((0, 0, -1)) - G((0, 0, 0))).normalized())
                gp, gn = inv @ loc, (inv @ nrm).normalized()
                P.append(gp + gn * 0.012); N.append(gn)
            base = len(verts)
            for k in range(n_s):
                tg = (P[min(k + 1, n_s - 1)] - P[max(k - 1, 0)]).normalized()
                bn = N[k].cross(tg).normalized()
                w = 0.0105 * (1 - 0.55 * k / (n_s - 1))
                h = 0.003
                for sb, sn in ((1, 1), (-1, 1), (-1, -1), (1, -1)):
                    verts.append(G(tuple(P[k] + bn * (w * sb) + N[k] * (h * sn))))
                    norms.append(G(tuple(N[k] * sn)) - G((0, 0, 0)))
            for k in range(n_s - 1):
                a0, a1 = base + 4 * k, base + 4 * (k + 1)
                faces += [(a0, a1, a1 + 1, a0 + 1), (a0 + 2, a1 + 2, a1 + 3, a0 + 3), (a0 + 3, a1 + 3, a1, a0), (a0 + 1, a1 + 1, a1 + 2, a0 + 2)]
            e = base + 4 * (n_s - 1)
            faces += [(base + 3, base + 2, base + 1, base), (e, e + 1, e + 2, e + 3)]
        me = bpy.data.meshes.new('whiskers')
        me.from_pydata([tuple(v) for v in verts], [], faces)
        me.update()
        # make windings face outward (front strip toward the viewer)
        bm = bmesh.new(); bm.from_mesh(me); bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:]); bm.to_mesh(me); bm.free()
        ob = bpy.data.objects.new('whiskers', me)
        bpy.context.scene.collection.objects.link(ob)
        for poly in me.polygons:
            poly.use_smooth = True
        me.normals_split_custom_set_from_vertices([tuple(n) for n in norms])
        return ob



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

c = Cat('cat', base=FUR, target_faces=11000)

HY = 1.72           # head centre height
R = 0.64            # face sphere radius
FS = 1.1            # face scale (bigger kitten eyes)
RE = R * FS         # effective face radius

# ---------- body: small soft pear, lifted so the legs show ----------
c.blob((0, 0.82, 0), (0.46, 0.44, 0.42))
c.blob((0, 0.58, 0.03), (0.48, 0.3, 0.44))
c.blob((0, 1.14, 0), (0.3, 0.18, 0.28))                 # neck blend
# ---------- head: wide and round, soft cheek fluff low on the sides ----------
c.blob((0, HY, 0), (0.76, 0.6, 0.62))
c.mirror(lambda s: c.blob((s * 0.36, HY - 0.2, 0.18), (0.3, 0.22, 0.26)))       # cheeks
c.mirror(lambda s: c.blob((s * 0.62, HY - 0.24, 0.0), (0.14, 0.12, 0.18)))      # side fluff
# one soft muzzle pad under the nose: the code mouth sits on it
c.blob((0, HY - 0.24, 0.37), (0.3, 0.15, 0.2))
c.blob((0, HY - 0.05, 0.62), (0.085, 0.056, 0.05), group='nose')

# ---------- ears: tall pointy triangles, cupped, pink inside ----------
def ear(s):
    g = 'ear' + ('L' if s < 0 else 'R')
    c.curve([(s * 0.4, HY + 0.32, -0.06), (s * 0.5, HY + 0.58, -0.04), (s * 0.6, HY + 0.86, 0.0)],
            [0.26, 0.16, 0.04], group=g, flat=0.42, per=6)
    c.blob((s * 0.47, HY + 0.5, 0.08), (0.12, 0.21, 0.07), rot=(0, 0, s * 18), group=g, negative=True)
c.mirror(ear)

# ---------- arms: A-pose, a clear armpit; a root ball sunk at the shoulder pivot ----------
SH = lambda s: (s * 0.35, 1.02, 0.06)
def arm(s):
    g = 'arm' + ('L' if s < 0 else 'R')
    c.blob(SH(s), (0.13, 0.13, 0.13), group=g)
    c.capsule((s * 0.42, 1.0, 0.08), (s * 0.76, 0.71, 0.15), 0.12, r2=0.115, group=g)
    c.blob((s * 0.83, 0.65, 0.17), (0.14, 0.135, 0.14), group=g)
c.mirror(arm)
# ---------- legs + feet ----------
def leg(s):
    g = 'leg' + ('L' if s < 0 else 'R')
    c.capsule((s * 0.27, 0.42, 0.04), (s * 0.28, 0.17, 0.09), 0.165, r2=0.155, group=g)
    c.blob((s * 0.29, 0.11, 0.19), (0.18, 0.11, 0.25), rot=(0, s * 8, 0), group=g)
c.mirror(leg)
# ---------- long curvy tail ----------
TAIL = [(0, 0.46, -0.36), (0.12, 0.4, -0.72), (0.32, 0.6, -0.92), (0.42, 0.96, -0.9), (0.36, 1.26, -0.78)]
c.curve(TAIL, [0.12, 0.11, 0.1, 0.095, 0.1], group='tail', per=6)

# ---------- paint ----------
# tabby stripes: wavy bands across the back and sides of the body
def body_stripe(p, n):
    if p.y < 0.38 or p.y > 1.12 or p.z > 0.1 or abs(p.x) > 0.52:
        return False
    a = math.atan2(p.x, -p.z)                      # 0 at the spine
    if abs(a) > 1.9:
        return False
    u = (p.y + 0.07 * math.cos(a * 3)) / 0.24
    return (u % 1.0) < 0.42
c.paint_fn(body_stripe, STRIPE)
# tail rings
def tail_ring(p, n):
    if p.z > -0.55:
        return False
    return ((p.y - 0.25) / 0.22) % 1.0 < 0.35 and p.y > 0.5
c.paint_fn(tail_ring, STRIPE)
# forehead "M", continuing back over the crown as three tapering lines
for x, rz, ln in ((0, 0, 0.15), (-0.16, -16, 0.11), (0.16, 16, 0.11)):
    c.paint('m', (x, HY + 0.38, 0.42), (0.045, ln, 0.3), STRIPE, rot=(0, 0, rz))
def crown(p, n):
    if p.y < HY + 0.2 or p.z > 0.5 or p.z < -0.5 or n.y < -0.1:
        return False
    t = (0.5 - p.z) / 1.0                          # 0 at the forehead, 1 at the back of the head
    w = 0.045 * (1 - 0.45 * t)
    for x0 in (0.0, -0.2 - 0.06 * t, 0.2 + 0.06 * t):
        if abs(p.x - x0) < w:
            return True
    return False
c.paint_fn(crown, STRIPE)
for s in (-1, 1):   # cheek stripes, inboard of the silhouette
    for dy, rz in ((0.07, 14),):
        c.paint('cheek_stripe', (s * 0.63, HY + dy, 0.36), (0.1, 0.028, 0.16), STRIPE, rot=(0, 0, s * rz), only=lambda p: p.z > 0.15)
c.decal('bib', (0, 0.74), (0.3, 0.36, 0.25), CREAM)
c.decal('muzzle', (0, HY - 0.23), (0.3, 0.17, 0.3), CREAM)
c.paint('chin', (0, HY - 0.33, 0.45), (0.14, 0.08, 0.2), CREAM)
c.paint('nose', (0, HY - 0.05, 0.64), (0.095, 0.065, 0.06), NOSE, only=lambda p: p.z > 0.6)
for s in (-1, 1):   # front-facing skin only, so no pink shows on the back of the ear
    f = ell((s * 0.48, HY + 0.53, 0.06), (0.14, 0.3, 0.12), s * 18)
    c.paint_fn(lambda p, n, f=f: f(p) and p.y > HY + 0.34 and n.z > 0.25, PINK)
c.mirror(lambda s: c.paint('paw', (s * 0.83, 0.65, 0.17), (0.16, 0.15, 0.16), CREAM))
c.mirror(lambda s: c.paint('toes', (s * 0.3, 0.11, 0.42), (0.18, 0.12, 0.1), CREAM))
c.paint('tip', (0.36, 1.26, -0.78), (0.13, 0.12, 0.13), CREAM)

# ---------- whiskers: fine tapered strokes fanning out from the muzzle pad over the cheeks ----------
WHISKERS = []
for s in (-1, 1):
    for dy0, dy1, dy2 in ((-0.15, -0.13, -0.1), (-0.22, -0.235, -0.26)):
        WHISKERS.append([(s * 0.27, HY + dy0), (s * 0.42, HY + dy1), (s * 0.6, HY + dy2)])
c.layer('whiskers', base=WHISK, target_faces=900)
c.layer('skin')

# ---------- rig ----------
c.neck = (1.12, 1.3)
c.bone('body', (0, 0.3, 0), (0, 1.18, 0))
c.group_rules['body'] = ['main']
c.bone('head', (0, 1.3, 0), (0, 2.3, 0), parent='body', region=lambda p: p.y > 1.1)
c.group_rules['head'] = ['main', 'nose', 'earL', 'earR']
for s, n in ((-1, 'L'), (1, 'R')):
    c.chain('ear.' + n, [(s * 0.4, HY + 0.32, -0.04), (s * 0.5, HY + 0.58, -0.04), (s * 0.6, HY + 0.88, 0.0)], 'head')
    c.group_rules['ear.%s.1' % n] = ['ear' + n]
    c.group_rules['ear.%s.2' % n] = ['ear' + n]
    c.bone('arm.' + n, SH(s), (s * 0.83, 0.65, 0.17), parent='body')
    c.group_rules['arm.' + n] = ['arm' + n]
    c.bone('leg.' + n, (s * 0.27, 0.42, 0.04), (s * 0.29, 0.08, 0.2), parent='body')
    c.group_rules['leg.' + n] = ['leg' + n]
c.chain('tail', TAIL, 'body')
for i in range(1, len(TAIL)):
    c.group_rules['tail.%d' % i] = ['tail']

MY, MZ = 0.0, 0.02
c.face(center=(0, HY, 0.0), radius=R, faceScale=FS, mouthY=MY, mouthZ=MZ)
for k, p in dict(nose=(0, HY - 0.05), eyeL=(-0.36 * RE, HY + 0.12 * RE), eyeR=(0.36 * RE, HY + 0.12 * RE),
                 mouth=(0, HY - 0.3 * RE + MY * FS), tummy=(0, 0.74),
                 handL=(-0.84, 0.64), handR=(0.84, 0.64),
                 footL=(-0.3, 0.11), footR=(0.3, 0.11), earL=(-0.48, HY + 0.5), earR=(0.48, HY + 0.5)).items():
    c.anchor(k, p, 'head' if p[1] > 1.2 else 'body')

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
polish(c, calm=[((0, 0.74, 0.42), (0.4, 0.46, 0.32), 40)])
soft_joints(c, [('arm.L', SH(-1), 0.28, 0.6), ('arm.R', SH(1), 0.28, 0.6)])
c.build()
