"""VOCAB.md batch 2a: wild animals (words 34-46). One script, several models (ONLY=prop_word_lion,... builds a subset).
All are "figurines" (VOCAB.md rule 10): the simple Prop build, body + head bones, a code face, spring bones named
ear / tail / mane / tuft so the engine animates them. Same eye size and face scale on every animal, same stub-leg
thickness, same tummy-patch treatment, so the batch reads as one toy box.
  prop_word_lion       sitting, a huge ring of 10 brown scallop tufts framing a yellow face
  prop_word_tiger      sitting, orange with bold ink stripes, white muzzle / cheeks / tummy
  prop_word_zebra      standing pony shape, white with bold ink stripes, upright striped mane
  prop_word_giraffe    standing, 3.0 tall before fit, very long neck (neck.1 / neck.2), patches, knobbed horns
  prop_word_hippo      barrel on stub legs, enormous square muzzle, purple-grey
  prop_word_kangaroo   upright on huge feet and a thick tail, a joey peeking from the pouch (joey bone)
  prop_word_koala      sitting hugging a branch, big fluffy ears, big ink nose
  prop_word_panda      sitting with a bamboo stick, white with ink ears, eye patches, arms and legs
  prop_word_penguin    upright egg, ink back, white front, orange feet and beak, flippers out (wing.L / wing.R)
  prop_word_crocodile  long and low along x, toothy smile (jaw bone), eye bumps, leaf zigzag ridge
  prop_word_snake      a fat coil of three loops, head raised (head sways), forked red tongue (tongue bone)
  prop_word_dinosaur   friendly upright T-rex: big head, tiny arms, thick tail, orange plates
  prop_word_unicorn    white pony, spiral yellow horn, pink / purple / sky mane and tail
Quadrupeds stand side-on along x (front toward +x) with the head turned to the camera; the code face is turned with
the head (face yaw), so it reads in the front view and when a game turns the model 25 degrees toward the camera.
The helpers here (Fig, palette, quadruped and sitter bodies) are shared with prop_words_animals2b.py."""
import sys, os, math, random
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..'))
sys.path.insert(0, os.path.join(HERE, '..', 'props'))
import bpy
from mathutils import Vector, Matrix, Euler
from kit import Prop, rounded, circle_poly, arc, TAU

# ---------------- palette (VOCAB.md section 1, rule 4) ----------------
RED, ORANGE, YELLOW, GREEN, LEAF = 0xff4f4f, 0xff9a2e, 0xffd23a, 0x4cc75a, 0x2f8a3a
BLUE, SKY, PURPLE, PINK, ROSE = 0x3f8cff, 0x8fd3ff, 0x9b6dff, 0xff7fbf, 0xff9ec4
CREAM, WHITE, BROWN, WOOD, TAN = 0xf2e8d8, 0xfffaf0, 0xb07a4a, 0xd8924f, 0xf3d9ae
GREY, SLATE, INK = 0xb9c0c9, 0x6f7a8c, 0x3a2838


def mix(a, b, t):
    ca = [(a >> s) & 255 for s in (16, 8, 0)]
    cb = [(b >> s) & 255 for s in (16, 8, 0)]
    c = [round(x + (y - x) * t) for x, y in zip(ca, cb)]
    return (c[0] << 16) | (c[1] << 8) | c[2]


def lite(c, t=0.3):
    return mix(c, WHITE, t)


def dark(c, t=0.22):
    return mix(c, INK, t)


ONLY = [s for s in os.environ.get('ONLY', '').split(',') if s]
FACE_R, FACE_S, EYE = 0.6, 1.08, 1.1        # one face size for the whole batch (rule: same eyes on every animal)
LEG_R = 0.14                                # one stub-leg thickness for every quadruped


def Ry(deg):
    return Euler((0, math.radians(deg), 0)).to_matrix()


class Frame:
    """A local frame (for heads turned toward the camera): local (x right, y up, z forward) -> game space."""
    def __init__(self, origin, yaw=0.0, pitch=0.0):
        self.o = Vector(origin)
        self.yaw = yaw
        self.M = Euler((math.radians(-pitch), math.radians(yaw), 0), 'YXZ').to_matrix() if pitch else Ry(yaw)

    def p(self, v):
        return tuple(self.o + self.M @ Vector(v))

    def d(self, v):
        return tuple(self.M @ Vector(v))

    def rot(self, r=(0, 0, 0)):
        m = self.M @ Euler([math.radians(a) for a in r], 'XYZ').to_matrix()
        return tuple(math.degrees(a) for a in m.to_euler('XYZ'))

    def local(self, q):
        return self.M.transposed() @ (Vector(q) - self.o)


def ell(center, size, rot=(0, 0, 0)):
    """ellipsoid test for paint_fn (rot in degrees, XYZ)"""
    C, S = Vector(center), Vector(size)
    M = Euler([math.radians(a) for a in rot], 'XYZ').to_matrix().transposed()
    def f(p):
        d = M @ (Vector(p) - C)
        return (d.x / S.x) ** 2 + (d.y / S.y) ** 2 + (d.z / S.z) ** 2 <= 1.0
    return f


def seg_dist(p, a, b):
    a, b, p = Vector(a), Vector(b), Vector(p)
    ab = b - a
    t = max(0.0, min(1.0, (p - a).dot(ab) / max(1e-9, ab.dot(ab))))
    return (p - (a + ab * t)).length, t


class Fig(Prop):
    """Prop + figurine conveniences:
    rigid[layer] = bone        that layer moves rigidly with one bone (perches, branches, bases, joeys)
    face(..., yaw=deg, fit=1)  the code face turned with the head; fit=1 slides the face along its axis so the code
                               mouth lies on the muzzle (as cow.py does)
    The card extras (fit, wide) are set from the finished bounds, and the model is lifted so its lowest point is y 0."""
    def __init__(self, kind, base, tris, voxel=0.016, skin_share=0.6, outline=0.026):
        super().__init__(kind, base=base, voxel=voxel, target_faces=int(tris * skin_share))
        self.rigid = {}
        self.fine = {}
        self.lazy = {}            # layer -> fn() that adds that layer's shapes once the body skin exists (to ray-cast it)
        self.tris = tris
        self.extras['outline'] = outline

    def _skin(self):
        fn = self.lazy.pop(self._cur, None)
        if fn:
            keep, self._skin_obj = getattr(self, '_skin_obj', None), self.body_skin
            fn()
            self._skin_obj = keep
        qf = self.quadriflow
        self.quadriflow = qf and self._cur == 'skin'      # small detail layers: quadriflow drops thin / tiny parts
        sk = super()._skin()
        self.quadriflow = qf
        if self._cur == 'skin':
            self.body_skin = sk
        return sk

    def on_body(self, p, d):
        """(during a lazy layer) the body surface hit by a ray toward -d through point p"""
        return self._hit(Vector(p), -Vector(d).normalized())

    def slab(self, poly, origin, X, Y, thick, r=0.05):
        """a flat rounded plate: 2D polygon [(u, v)] in the plane origin + u*X + v*Y, thick along X x Y (fins, plates)"""
        P = [Vector(q) for q in rounded(poly, r, n=3, closed=True)]
        O, X, Y = Vector(origin), Vector(X).normalized(), Vector(Y).normalized()
        N = X.cross(Y).normalized()
        cx = sum(q.x for q in P) / len(P); cy = sum(q.y for q in P) / len(P)
        m = len(P)
        verts = [tuple(O + X * cx + Y * cy + N * thick * 0.5), tuple(O + X * cx + Y * cy - N * thick * 0.5)]
        for sgn in (1, -1):
            for q in P:
                verts.append(tuple(O + X * q.x + Y * q.y + N * thick * 0.5 * sgn))
        faces = []
        for i in range(m):
            j = (i + 1) % m
            faces.append((0, 2 + i, 2 + j))
            faces.append((1, 2 + m + j, 2 + m + i))
            faces.append((2 + i, 2 + m + i, 2 + m + j, 2 + j))
        self.mesh(verts, faces)

    def lay(self, name, base, tf, voxel=0.011):
        return self.layer(name, base=base, voxel=voxel, target_faces=tf)

    def _paint(self, skin):
        # fine[layer] = (predicate, max edge): split long edges there before painting, so narrow painted bands
        # (zebra leg rings, patches) get clean borders instead of sliver shards
        rule = self.fine.get(self._cur)
        if rule:
            import bmesh
            fn, L = rule
            inv = Matrix(((1, 0, 0), (0, 0, 1), (0, -1, 0)))
            bm = bmesh.new()
            bm.from_mesh(skin.data)
            for _ in range(2):
                es = [e for e in bm.edges if e.calc_length() > L and fn(inv @ ((e.verts[0].co + e.verts[1].co) * 0.5))]
                if not es:
                    break
                bmesh.ops.subdivide_edges(bm, edges=es, cuts=1, use_grid_fill=True)
                bmesh.ops.triangulate(bm, faces=bm.faces[:])
            bm.to_mesh(skin.data)
            bm.free()
            skin.data.update()
        return super()._paint(skin)

    def _weights(self, skin, ao, smooth_iters=None):
        b = self.rigid.get(self._cur)
        if not b:
            return super()._weights(skin, ao, smooth_iters)
        skin.vertex_groups.new(name=b).add(list(range(len(skin.data.vertices))), 1.0, 'REPLACE')
        mod = skin.modifiers.new('rig', 'ARMATURE')
        mod.object = ao
        skin.parent = ao

    def _hit(self, p, d):
        o = Vector(p) - Vector(d) * 3.0
        return self.surface(o.x, o.y, o.z, dir=tuple(d))

    def _empties(self, ao):
        f = self.face_info
        if f:
            o = f['opts']
            yaw = o.pop('yaw', 0.0)
            fit = o.pop('fit', 0)
            gap0 = o.pop('fitGap', 0.006)
            R, fs = f['radius'], o.get('faceScale', 1.0) or 1.0
            M = Ry(yaw)
            dz = M @ Vector((0, 0, 1))
            C = Vector(f['center'])
            if o.get('snap', True):
                h = self._hit(C + Vector((0, R * fs * 0.12, 0)), -dz)
                if h is not None:
                    C = C + dz * ((h - C).dot(dz) - R * fs * 0.97)
            ex, ey = o.get('eyeX', 0.36) * R, o.get('eyeY', 0.12) * R
            if o.pop('eyesnap', 1):
                eg = []
                for sx in (-1, 1):
                    e = C + M @ (Vector((sx * ex, ey, math.sqrt(max(0, R * R - ex * ex - ey * ey)))) * fs)
                    h = self._hit(e, -dz)
                    if h is not None:
                        eg.append((e - h).dot(dz))
                if eg:
                    C = C - dz * (sum(eg) / len(eg) + 0.004)
            if o.get('mouth', 1) != 0:
                # the code mouth onto the muzzle: measure how far it floats / sinks, then offset it (mouthZ)
                my = -0.3 * R
                z0 = math.sqrt(R * R - my * my)
                gaps = []
                for i in range(9):
                    a = math.pi * (0.1 + 0.8 * i / 8)
                    for (rr, yy, zz) in ((0.2, my + 0.05 * R, z0 - 0.03 * R), (0.17, my - 0.12 * R, z0 - 0.01 * R)):
                        sx = rr * R * math.cos(a)
                        sy = yy + (-1 if rr == 0.2 else 1) * rr * R * math.sin(a)
                        pt = C + M @ (Vector((sx, sy, zz)) * fs)
                        h = self._hit(pt, -dz)
                        if h is not None:
                            gaps.append((pt - h).dot(dz))
                if gaps:
                    g = sum(gaps) / len(gaps)
                    if fit:
                        o['mouthZ'] = (-g + gap0) / fs + o.get('mouthZ', 0)
                    print('WROTE mouth gap %+.3f spread %.3f -> mouthZ %.3f' % (g, max(gaps) - min(gaps), o.get('mouthZ', 0)))
            for sx in (-1, 1):
                e = C + M @ (Vector((sx * ex, ey, math.sqrt(max(0, R * R - ex * ex - ey * ey)))) * fs)
                h = self._hit(e, -dz)
                print('WROTE eye %+d gap %s' % (sx, '%+.3f' % (e - h).dot(dz) if h is not None else 'MISS'))
            f['center'] = tuple(C)
            o['snap'] = False
        super()._empties(ao)
        if f and yaw:
            e = bpy.data.objects.get('face_anchor')
            t = e.matrix_world.translation.copy()
            e.matrix_world = Matrix.Translation(t) @ Matrix.Rotation(math.radians(yaw), 4, 'Z')
        # bounds -> lift to y 0, card extras
        meshes = [ob for ob in bpy.data.objects if ob.type == 'MESH']
        lo = Vector((1e9,) * 3); hi = Vector((-1e9,) * 3)
        tris = 0
        for ob in meshes:
            for v in ob.data.vertices:
                g = Vector((v.co.x, v.co.z, -v.co.y))
                lo = Vector(map(min, lo, g)); hi = Vector(map(max, hi, g))
            tris += sum(len(p.vertices) - 2 for p in ob.data.polygons)
        ao.location.z -= lo.y
        sz = hi - lo
        self.extras['fit'] = 2.0
        if sz.x > sz.y * 1.02:
            self.extras['wide'] = 2.0
        print('WROTE %s size x %.2f y %.2f z %.2f (lifted %+.3f) tris %d / budget %d%s' % (
            self.kind, sz.x, sz.y, sz.z, -lo.y, tris, self.tris, '  OVER' if tris > self.tris * 1.2 else ''))


def want(kind):
    return not ONLY or kind in ONLY


# ---------------- shared bodies ----------------
def quad_body(c, L=0.62, H=0.4, Z=0.38, y=0.95, leg_h=None, legx=0.4, legz=0.2, hoof=None, hoof_h=0.1, x0=-0.05,
              leg_r=LEG_R, belly=None):
    """A barrel body along x on four stub legs (each leg its own group, so it keeps its shape). Returns leg tops."""
    c.blob((x0, y, 0), (L, H, Z))
    c.blob((x0 + L * 0.45, y + 0.02, 0), (L * 0.5, H * 0.98, Z * 1.02))   # chest
    c.blob((x0 - L * 0.45, y + 0.02, 0), (L * 0.5, H * 0.98, Z * 1.0))    # rump
    tops = []
    for ix, sx in enumerate((1, -1)):
        for sz in (1, -1):
            g = 'leg%s%s' % ('FB'[ix], 'RL'[sz < 0])
            top = (x0 + sx * legx, y - H * 0.35, sz * legz)
            c.capsule(top, (x0 + sx * legx, leg_r * 0.9, sz * legz), leg_r, group=g)
            if hoof is not None:
                c.blob((x0 + sx * legx, hoof_h * 0.62, sz * legz + 0.01), (leg_r * 1.12, hoof_h * 0.62, leg_r * 1.12), group=g + 'h')
            tops.append(top)
    return tops


def stripes_x(p, xs, w):
    """vertical bands at the given x centres, half-width w(y)"""
    return any(abs(p.x - x) < w for x in xs)


# =====================================================================================================
# LION / TIGER: one sitting big-cat body
# =====================================================================================================
def big_cat(kind, coat, tris):
    c = Fig(kind, coat, tris, voxel=0.015)
    HY = 1.5
    H = Frame((0, HY, 0.04))
    # body: a soft pear, haunches, chest
    c.blob((0, 0.58, -0.06), (0.56, 0.56, 0.5))
    c.blob((0, 0.95, 0.04), (0.38, 0.34, 0.34))
    c.mirror(lambda s: c.blob((s * 0.34, 0.36, -0.06), (0.3, 0.33, 0.42)))
    # front legs + paws (own groups)
    for s, n in ((-1, 'L'), (1, 'R')):
        c.capsule((s * 0.2, 0.88, 0.22), (s * 0.22, 0.16, 0.36), LEG_R, group='leg' + n)
        c.blob((s * 0.23, 0.1, 0.43), (0.16, 0.1, 0.17), group='leg' + n)
        c.blob((s * 0.45, 0.1, 0.26), (0.15, 0.1, 0.2), rot=(0, s * 20, 0), group='foot' + n)
    # head
    c.blob(H.p((0, 0, 0)), (0.6, 0.52, 0.52), group='head')
    c.mirror(lambda s: c.blob(H.p((s * 0.27, -0.16, 0.26)), (0.27, 0.22, 0.24), group='head'))   # cheeks
    c.blob(H.p((0, -0.17, 0.42)), (0.24, 0.16, 0.18), group='head')                            # muzzle
    # ears: round
    for s, n in ((-1, 'L'), (1, 'R')):
        c.blob(H.p((s * 0.4, 0.42, 0.0)), (0.17, 0.17, 0.1), rot=(0, 0, -s * 20), group='ear' + n)
        c.blob(H.p((s * 0.33, 0.3, -0.02)), (0.12, 0.1, 0.09), group='ear' + n)
    # tail: from the rump round the side, curling up at the front
    tail = [(0.2, 0.14, -0.5), (0.55, 0.1, -0.3), (0.72, 0.12, 0.05), (0.78, 0.3, 0.3), (0.72, 0.5, 0.42)]
    c.curve(tail, [0.075, 0.075, 0.07, 0.068, 0.065], group='tail')
    return c, H, tail


def lion():
    c, H, tail = big_cat('prop_word_lion', YELLOW, 8000)
    MANE, MANE_D, FACE = BROWN, dark(BROWN, 0.18), lite(YELLOW, 0.25)
    TUFT = dark(BROWN, 0.12)
    tip = Vector(tail[-1]); dv = (tip - Vector(tail[-2])).normalized()
    c.blob(tuple(tip + dv * 0.04), (0.13, 0.13, 0.12), group='tuft')
    c.blob(tuple(tip + dv * 0.17), (0.08, 0.11, 0.08), rot=(-30, 0, -20), group='tuft')
    # body yellow-tan, the face stays yellow
    c.paint_fn(lambda p, n: c.owner(p) in ('main', 'legL', 'legR', 'footL', 'footR', 'tail'), mix(YELLOW, TAN, 0.5))
    c.decal('tummy', (0, 0.62), (0.32, 0.36, 0.3), CREAM)
    c.paint_group('tuft', TUFT)
    c.decal('muzzle', (0, H.o.y - 0.18), (0.3, 0.17, 0.3), CREAM)
    c.mirror(lambda s: c.paint_fn(lambda p, n, s=s: c.owner(p) == 'ear' + ('L' if s < 0 else 'R') and n.z > 0.35 and
                                  ell(H.p((s * 0.41, 0.43, 0.06)), (0.11, 0.11, 0.1))(p), ROSE))
    # mane: its own layer (so it gets its own ink edge): 10 fat scallop tufts in a ring behind the face
    c.lay('mane', MANE, 2600, voxel=0.013)
    n = 10
    for i in range(n):
        a = TAU * (i + 0.5) / n
        r = 0.7
        c.blob(H.p((r * math.sin(a), r * math.cos(a) - 0.02, -0.1 - 0.04 * (i % 2))), (0.26, 0.26, 0.22), group='m%d' % i)
    c.blob(H.p((0, 0.0, -0.24)), (0.72, 0.7, 0.26), group='back')
    c.paint_group('back', MANE_D)
    # nose: a soft rose triangle on top of the muzzle
    c.lay('nose', ROSE, 300, voxel=0.008)
    for k in range(5):
        t = k / 4
        c.blob(H.p((0, -0.05 - 0.07 * t, 0.565 + 0.01 * t)), (0.085 * (1 - 0.7 * t), 0.04, 0.035), group='n')
    c.layer('skin')
    # rig
    c.neck = (1.0, 1.12)
    c.bone('body', (0, 0.1, 0), (0, 1.0, 0))
    c.bone('head', (0, 1.06, 0.04), (0, 2.2, 0.04), parent='body', region=lambda q: q.y > 1.02 and c.owner(q) not in ('tail', 'tuft'))
    c.bone('mane', H.p((0, -0.05, -0.15)), H.p((0, 0.55, -0.15)), parent='head', region=lambda q: q.z < H.o.z - 0.04 and c._cur == 'mane')
    c.chain('tail', tail[1:], 'body', group=['tail', 'tuft'])
    c.rigid['nose'] = 'head'
    c.face(center=H.p((0, 0.02, 0)), radius=FACE_R, faceScale=FACE_S, eyeSize=EYE, fit=1)
    c.build()


def polyline_param(pts):
    """nearest-point parameter (0..1 by length) and distance to a polyline"""
    P = [Vector(q) for q in pts]
    L = [0.0]
    for a, b in zip(P, P[1:]):
        L.append(L[-1] + (b - a).length)
    tot = L[-1]
    def f(q):
        best = (1e9, 0.0)
        for i in range(len(P) - 1):
            d, t = seg_dist(q, P[i], P[i + 1])
            if d < best[0]:
                best = (d, (L[i] + t * (L[i + 1] - L[i])) / tot)
        return best
    return f


def tiger():
    c, H, tail = big_cat('prop_word_tiger', ORANGE, 8000)
    c.blob(tail[-1], (0.075, 0.075, 0.075), group='tail')
    OR = ORANGE
    WH = WHITE
    c.decal('tummy', (0, 0.62), (0.32, 0.38, 0.3), WH)
    c.decal('muzzle', (0, H.o.y - 0.17), (0.34, 0.2, 0.3), WH)
    c.mirror(lambda s: c.decal('cheek', (s * 0.36, H.o.y - 0.2), (0.2, 0.15, 0.3), WH))
    # white dots behind the ears, rose inside
    for s, n in ((-1, 'L'), (1, 'R')):
        c.paint_fn(lambda p, nn, n=n, s=s: c.owner(p) == 'ear' + n and nn.z < -0.3 and ell(H.p((s * 0.41, 0.43, -0.06)), (0.09, 0.09, 0.12))(p), WH)
        c.paint_fn(lambda p, nn, n=n, s=s: c.owner(p) == 'ear' + n and nn.z > 0.35 and ell(H.p((s * 0.41, 0.43, 0.06)), (0.1, 0.1, 0.1))(p), ROSE)
    # stripes (crisp ink paint): 5 bands round the back and flanks, tapering toward the tummy
    BACK = [0.3, 0.5, 0.7, 0.9, 1.08]
    def body_stripe(p, n):
        if c.owner(p) != 'main' or p.y > 1.2:
            return False
        th = math.atan2(p.x, -p.z)                      # 0 at the spine, +-pi at the front
        a = abs(th)
        if a > 2.0:
            return False
        w = 0.05 * (1 - a / 2.0) ** 0.7
        for k, y in enumerate(BACK):
            yy = y + 0.07 * math.sin(a * 2.2 + k) - 0.06 * a
            if abs(p.y - yy) < w:
                return True
        return False
    c.paint_fn(body_stripe, INK)
    # forehead: three short stripes; cheeks: three each side
    def head_stripe(p, n):
        if c.owner(p) != 'head':
            return False
        q = H.local(p)
        if q.z > 0.0 and q.y > 0.18:
            for x0, ln in ((0, 0.2), (-0.15, 0.13), (0.15, 0.13)):
                if abs(q.x - x0 - 0.0) < 0.035 * (1 - (0.5 - q.y) / ln * 0) and 0.5 - ln < q.y < 0.56:
                    return True
        ax = abs(q.x)
        if ax > 0.4 and q.z > -0.15:
            for k, y0 in enumerate((0.0, -0.13, -0.26)):
                yy = y0 + (ax - 0.4) * 0.35
                w = 0.032 * min(1.0, (ax - 0.4) / 0.12)
                if abs(q.y - yy) < w:
                    return True
        return False
    c.paint_fn(head_stripe, INK)
    # legs: two stripes on the outside of each front leg; tail rings and an ink tip
    c.paint_fn(lambda p, n: c.owner(p) in ('legL', 'legR') and abs(p.x) > 0.24 and any(abs(p.y - y) < 0.03 for y in (0.5, 0.68)), INK)
    tp = polyline_param(tail)
    c.paint_fn(lambda p, n: c.owner(p) == 'tail' and (lambda d, t: t > 0.2 and (t > 0.93 or (t * 7.5) % 1 < 0.38))(*tp(p)), INK)
    c.neck = (1.0, 1.12)
    c.bone('body', (0, 0.1, 0), (0, 1.0, 0))
    c.bone('head', (0, 1.06, 0.04), (0, 2.2, 0.04), parent='body', region=lambda q: q.y > 1.02 and c.owner(q) != 'tail')
    for s, n in ((-1, 'L'), (1, 'R')):
        c.bone('ear.%s.1' % n, H.p((s * 0.33, 0.28, -0.02)), H.p((s * 0.45, 0.55, -0.02)), parent='head', group='ear' + n)
    c.chain('tail', tail[1:], 'body', group='tail')
    c.face(center=H.p((0, 0.02, 0)), radius=FACE_R, faceScale=FACE_S, eyeSize=EYE, fit=1, noseColor=ROSE)
    c.build()


# =====================================================================================================
# ZEBRA / UNICORN: one standing pony
# =====================================================================================================
def pony(kind, coat, tris):
    c = Fig(kind, coat, tris, voxel=0.015)
    c.quadriflow = True
    c._leg_tops = quad_body(c, L=0.6, H=0.38, Z=0.36, y=0.98, legx=0.38, legz=0.19, hoof=True, hoof_h=0.13, x0=-0.08)
    # neck: from the chest up and forward to the head
    NA, NB = Vector((0.36, 1.12, 0.0)), Vector((0.58, 1.62, 0.06))
    c.capsule(tuple(NA), tuple(NB), 0.25, r2=0.21)
    H = Frame((0.62, 1.78, 0.1), yaw=38)
    c.blob(H.p((0, 0.02, -0.04)), (0.4, 0.42, 0.38), group='head')
    c.blob(H.p((0, -0.2, 0.22)), (0.3, 0.26, 0.3), group='head')
    c.blob(H.p((0, -0.3, 0.34)), (0.27, 0.2, 0.24), rot=H.rot((0, 0, 0)), group='snout')
    for s, n in ((-1, 'L'), (1, 'R')):
        c.blob(H.p((s * 0.22, 0.46, -0.06)), (0.1, 0.22, 0.07), rot=H.rot((0, 0, -s * 16)), group='ear' + n)
        c.blob(H.p((s * 0.19, 0.3, -0.06)), (0.1, 0.09, 0.08), rot=H.rot((0, 0, 0)), group='ear' + n)
    return c, H, NA, NB


def pony_rig(c, H, mane_group, tail_pts, tail_groups, neck_y=1.2):
    c.neck = (neck_y, neck_y + 0.15)
    c.bone('body', (-0.08, 0.3, 0), (-0.08, 1.2, 0))
    c.bone('head', (H.o.x - 0.05, 1.35, H.o.z), (H.o.x - 0.05, 2.35, H.o.z), parent='body',
           region=lambda q: q.y > 1.25 and q.x > 0.2)
    for s, n in ((-1, 'L'), (1, 'R')):
        c.bone('ear.%s.1' % n, H.p((s * 0.19, 0.3, -0.06)), H.p((s * 0.26, 0.66, -0.06)), parent='head', group='ear' + n)
    c.chain('tail', tail_pts, 'body', group=tail_groups)


def tops_of(c):
    return c._leg_tops


def zebra():
    c, H, NA, NB = pony('prop_word_zebra', WHITE, 8000)
    c.target_faces = 3700
    MUZ = mix(INK, SLATE, 0.25)
    # mane: an upright crest along the top of the neck, from between the ears to the withers; its own layer, striped
    c.lay('mane', WHITE, 1500, voxel=0.011)
    crest = [H.p((0, 0.36, -0.16)), H.p((-0.02, 0.22, -0.42)), (0.32, 1.62, -0.0), (0.16, 1.34, 0.0)]
    for i in range(14):
        t = i / 13
        q = Vector(crest[0]).lerp(Vector(crest[1]), min(1, t * 3)) if t < 1 / 3 else Vector(crest[1]).lerp(Vector(crest[3]), (t - 1 / 3) * 1.5)
        h = 0.17 * (1 - 0.45 * t) + 0.04
        c.blob(tuple(q + Vector((-0.05, 0.06, 0))), (0.075, h, 0.075 * 0.9), rot=(0, 0, 32 + 10 * t), group='crest')
    mp = polyline_param([crest[0], crest[1], crest[3]])
    c.paint_fn(lambda p, n: (mp(p)[1] * 7.0) % 1 < 0.45, INK)
    c.layer('skin')
    # tail: a thin rope with an ink tuft
    tail = [(-0.66, 1.1, 0), (-0.8, 0.96, 0.02), (-0.86, 0.72, 0.04), (-0.86, 0.52, 0.05)]
    c.curve(tail[:3], [0.06, 0.055, 0.055], group='tail')
    c.blob(tail[3], (0.1, 0.16, 0.1), group='tuft')
    # stripes: bold ink bands wrapping the body (leaning back on the rump), rings round the legs, bands on the neck
    def body(p, n):
        g = c.owner(p)
        if g == 'main':
            if p.y < 0.68 and abs(p.z) < 0.22:
                return False                     # pale belly line
            if p.x > 0.3 and p.y > 1.14:
                return False                     # neck: its own bands
            lean = 0.35 if p.x < -0.25 else -0.12
            x = p.x + lean * (p.y - 0.98)
            ph = ((x + 0.8) / 0.25) % 1
            w = 0.46 - 0.2 * max(0.0, (0.98 - p.y) / 0.4)
            return ph < w and p.x < 0.56
        return False
    c.paint_fn(body, INK)
    # leg stripes: ink bands round each leg as their own layer (crisp and inked; paint this narrow shards)
    c.lay('legbands', INK, 700, voxel=0.008)
    def bands():
        for top in tops_of(c):
            for yb in (0.26, 0.46):
                sg = 1 if top[2] > 0 else -1
                h = c.surface(top[0], yb, top[2] + sg * 0.6, dir=(0, 0, -sg))
                r = abs(h.z - top[2]) if h is not None else 0.15
                r = min(max(r, 0.12), 0.19)
                c.lathe([(r - 0.04, yb - 0.058), (r + 0.035, yb - 0.05), (r + 0.035, yb + 0.05), (r - 0.04, yb + 0.058)],
                        pos=(top[0], 0, top[2]), closed=True, seg=28)
    c.lazy['legbands'] = bands
    c.layer('skin')
    nd = (NB - NA).normalized()
    c.paint_fn(lambda p, n: c.owner(p) == 'main' and p.x > 0.3 and p.y > 1.14 and ((Vector(p) - NA).dot(nd) / 0.17 + 0.3) % 1 < 0.45, INK)
    c.paint_group('snout', MUZ)
    c.mirror(lambda s: c.paint(('nost', s), H.p((s * 0.1, -0.24, 0.57)), (0.045, 0.06, 0.1), SLATE, rot=H.rot()))
    c.paint_group(['tuft'], INK)
    c.paint_group(['legFRh', 'legFLh', 'legBRh', 'legBLh'], SLATE)
    # forehead stripes (short bands above the eyes), ink ear tips
    c.paint_fn(lambda p, n: c.owner(p) == 'head' and (lambda q: q.y > 0.3 and q.z > -0.1 and ((q.y - 0.3) / 0.12) % 1 < 0.45)(H.local(p)), INK)
    for s, n in ((-1, 'L'), (1, 'R')):
        c.paint_fn(lambda p, nn, n=n: c.owner(p) == 'ear' + n and H.local(p).y > 0.58, INK)
    pony_rig(c, H, 'crest', [tail[0], tail[1], tail[2], tail[3]], ['tail', 'tuft'])
    c.rigid['legbands'] = 'body'
    c.bone('mane', (0.3, 1.3, 0.0), (0.42, 1.95, 0.0), parent='head', region=lambda q: c._cur == 'mane')
    c.face(center=H.p((0, 0.04, 0)), radius=0.5, faceScale=FACE_S, eyeSize=EYE, mouth=0, yaw=H.yaw)
    c.build()


def unicorn():
    c, H, NA, NB = pony('prop_word_unicorn', WHITE, 8000)
    c.target_faces = 4200
    # horn: a spiral yellow cone on the forehead
    c.lay('horn', YELLOW, 650, voxel=0.008)
    base, tip = Vector(H.p((0, 0.42, 0.14))), Vector(H.p((0, 0.95, 0.3)))
    ax = (tip - base).normalized()
    ln = (tip - base).length
    c.capsule(tuple(base), tuple(tip - ax * 0.03), 0.09, r2=0.03, group='hornc')
    side = ax.cross(Vector((1, 0, 0))).normalized(); up2 = ax.cross(side)
    pts = []
    for i in range(41):
        t = i / 40
        a = t * TAU * 2.6
        r = 0.09 * (1 - t) + 0.03 * t
        pts.append(tuple(base + ax * (ln * t * 0.92) + (side * math.cos(a) + up2 * math.sin(a)) * r))
    c.tube(pts, [0.03 * (1 - 0.6 * i / 40) for i in range(41)], rseg=8)
    # mane: flowing locks down the neck in three bands, its own layer
    c.lay('mane', PINK, 1600, voxel=0.011)
    locks = [
        [H.p((0.0, 0.42, -0.02)), H.p((0.16, 0.5, 0.2)), H.p((0.3, 0.32, 0.3))],                   # forelock over the brow
        [H.p((-0.05, 0.42, -0.18)), (0.36, 1.92, 0.1), (0.24, 1.7, 0.2), (0.2, 1.48, 0.24)],
        [H.p((-0.12, 0.3, -0.3)), (0.24, 1.66, 0.08), (0.12, 1.42, 0.16), (0.1, 1.2, 0.2)],
        [(0.32, 1.66, -0.1), (0.16, 1.46, -0.04), (0.08, 1.26, 0.04)],
    ]
    for i, L in enumerate(locks):
        c.curve(L, [0.13, 0.15, 0.12, 0.06][:len(L)], group='lock%d' % i, flat=0.75, per=5)
    c.paint_group(['lock0', 'lock1'], PINK)
    c.paint_group(['lock2'], PURPLE)
    c.paint_group(['lock3'], SKY)
    # tail: three flowing locks, one per colour
    c.lay('tailhair', PINK, 1100, voxel=0.012)
    T0 = (-0.66, 1.12, 0.0)
    tails = [[T0, (-0.86, 1.06, 0.0), (-0.98, 0.8, 0.04), (-0.94, 0.48, 0.1)],
             [T0, (-0.84, 1.0, 0.1), (-0.92, 0.74, 0.16), (-0.84, 0.46, 0.2)],
             [T0, (-0.84, 1.0, -0.1), (-0.94, 0.74, -0.1), (-0.9, 0.44, -0.06)]]
    for i, L in enumerate(tails):
        c.curve(L, [0.1, 0.13, 0.11, 0.05], group='t%d' % i, flat=0.8, per=5)
    c.paint_group('t1', PURPLE)
    c.paint_group('t2', SKY)
    c.layer('skin')
    c.paint_group(['legFRh', 'legFLh', 'legBRh', 'legBLh'], PINK)
    c.paint_group('snout', lite(ROSE, 0.55))
    c.mirror(lambda s: c.paint(('nost', s), H.p((s * 0.1, -0.24, 0.56)), (0.04, 0.05, 0.08), ROSE, rot=H.rot()))
    for s, n in ((-1, 'L'), (1, 'R')):
        c.paint_fn(lambda p, nn, n=n, s=s: c.owner(p) == 'ear' + n and (lambda q, d: q.z > 0.0 and d.z > 0.3)(H.local(p), H.M.transposed() @ nn), ROSE)
    pony_rig(c, H, None, [T0, (-0.9, 0.96, 0.0), (-0.94, 0.66, 0.06), (-0.9, 0.44, 0.1)], [], neck_y=1.2)
    c.rigid['horn'] = 'head'
    c.bone('mane', (0.3, 1.72, 0.0), (0.12, 1.2, 0.08), parent='head', region=lambda q: c._cur == 'mane' and q.y < 1.62)
    c.weight_rules['tail.1'] = c.weight_rules['tail.2'] = c.weight_rules['tail.3'] = (lambda q: c._cur == 'tailhair')
    c.face(center=H.p((0, 0.04, 0)), radius=0.5, faceScale=FACE_S, eyeSize=EYE, fit=1, yaw=H.yaw)
    c.build()


# =====================================================================================================
# GIRAFFE: 3.0 tall before fit
# =====================================================================================================
def giraffe():
    c = Fig('prop_word_giraffe', YELLOW, 8000, voxel=0.017, outline=0.032)
    c.target_faces = 4400
    PATCH = mix(ORANGE, BROWN, 0.45)
    tops = quad_body(c, L=0.52, H=0.36, Z=0.34, y=1.3, legx=0.32, legz=0.17, hoof=True, hoof_h=0.12, x0=-0.12, leg_r=0.13)
    NA, NM, NB = Vector((0.24, 1.5, 0.0)), Vector((0.42, 2.1, 0.03)), Vector((0.56, 2.62, 0.06))
    c.capsule(tuple(NA), tuple(NM), 0.21, r2=0.17)
    c.capsule(tuple(NM), tuple(NB), 0.17, r2=0.15)
    H = Frame((0.6, 2.72, 0.1), yaw=36)
    c.blob(H.p((0, 0.02, -0.04)), (0.4, 0.37, 0.37), group='head')
    c.blob(H.p((0, -0.14, 0.2)), (0.3, 0.24, 0.3), group='head')
    c.blob(H.p((0, -0.22, 0.34)), (0.24, 0.18, 0.21), group='snout')
    for s, n in ((-1, 'L'), (1, 'R')):
        c.blob(H.p((s * 0.4, 0.14, -0.08)), (0.17, 0.07, 0.08), rot=H.rot((0, 0, s * 18)), group='ear' + n)
        c.capsule(H.p((s * 0.14, 0.2, -0.08)), H.p((s * 0.17, 0.48, -0.1)), 0.05, group='horn' + n)
        c.blob(H.p((s * 0.17, 0.52, -0.1)), (0.085, 0.085, 0.085), group='knob' + n)
    # short mane line down the back of the neck
    c.lay('mane', mix(BROWN, ORANGE, 0.25), 900, voxel=0.01)
    c.curve([(0.42, 2.66, -0.12), (0.32, 2.3, -0.12), (0.18, 1.86, -0.12), (0.06, 1.56, -0.1)], [0.06, 0.07, 0.07, 0.05], group='mn', flat=0.6)
    c.layer('skin')
    tail = [(-0.62, 1.42, 0), (-0.72, 1.2, 0.02), (-0.76, 0.96, 0.04)]
    c.curve(tail, [0.045, 0.045, 0.045], group='tail')
    c.blob((-0.77, 0.86, 0.04), (0.07, 0.12, 0.07), group='tuft')
    # patches: rounded orange-brown shapes on a jittered hex grid, seen from the side (x, y), with yellow gaps
    rnd = random.Random(5)
    cents = []
    for iy in range(16):
        for ix in range(-6, 7):
            cents.append((ix * 0.22 + (0.11 if iy % 2 else 0) + rnd.uniform(-0.025, 0.025), 0.5 + iy * 0.19 + rnd.uniform(-0.02, 0.02),
                          rnd.uniform(0.075, 0.088), rnd.uniform(0, 3)))
    def patch(p, n):
        g = c.owner(p)
        if g != 'main' or p.y < 1.02:
            return False                     # body and neck only: the slim legs stay clean yellow
        if g == 'main' and p.y > 2.5:
            return False
        for cx, cy, r, ph in cents:
            dx, dy = p.x - cx, p.y - cy
            if abs(dx) < 0.11 and abs(dy) < 0.11:
                a = math.atan2(dy, dx)
                rr = r * (1 + 0.12 * math.sin(3 * a + ph))
                if dx * dx + dy * dy < rr * rr:
                    return True
        return False
    c.paint_fn(patch, PATCH)
    c.paint_group('snout', lite(TAN, 0.2))
    c.paint_group(['hornL', 'hornR'], YELLOW)
    c.paint_group(['knobL', 'knobR', 'tuft', 'legFRh', 'legFLh', 'legBRh', 'legBLh'], dark(BROWN, 0.1))
    c.mirror(lambda s: c.paint(('nost', s), H.p((s * 0.09, -0.15, 0.5)), (0.035, 0.045, 0.07), BROWN, rot=H.rot()))
    for s, n in ((-1, 'L'), (1, 'R')):
        c.paint_fn(lambda p, nn, n=n: c.owner(p) == 'ear' + n and (H.M.transposed() @ nn).z > 0.3, ROSE)
    # rig: body, neck.1, neck.2, head
    c.neck = (2.45, 2.6)
    c.bone('body', (-0.12, 0.4, 0), (-0.12, 1.45, 0))
    c.bone('neck.1', tuple(NA), tuple(NM), parent='body', region=lambda q: q.y > 1.48 and q.x > 0.0)
    c.bone('neck.2', tuple(NM), tuple(NB), parent='neck.1', region=lambda q: q.y > 1.95 and q.x > 0.15)
    c.bone('head', (H.o.x - 0.04, 2.5, H.o.z), (H.o.x - 0.04, 3.2, H.o.z), parent='neck.2', region=lambda q: q.y > 2.42)
    for s, n in ((-1, 'L'), (1, 'R')):
        c.bone('ear.%s.1' % n, H.p((s * 0.26, 0.12, -0.08)), H.p((s * 0.55, 0.18, -0.08)), parent='head', group='ear' + n)
    c.chain('tail', [tail[0], tail[2], (-0.77, 0.76, 0.04)], 'body', group=['tail', 'tuft'])
    c.face(center=H.p((0, 0.04, 0)), radius=0.46, faceScale=FACE_S, eyeSize=EYE, fit=1, yaw=H.yaw)
    c.build()


# =====================================================================================================
# HIPPO
# =====================================================================================================
def hippo():
    BODY = mix(PURPLE, GREY, 0.45)
    c = Fig('prop_word_hippo', BODY, 7000, voxel=0.016)
    quad_body(c, L=0.7, H=0.5, Z=0.48, y=0.78, legx=0.42, legz=0.26, x0=-0.12, leg_r=0.17)
    H = Frame((0.66, 1.16, 0.12), yaw=34)
    c.blob(H.p((0, 0.06, -0.08)), (0.42, 0.38, 0.4), group='head')
    # enormous square muzzle: four soft blobs in a square, so its front reads flat and wide
    for sx in (-1, 1):
        for sy in (-1, 1):
            c.blob(H.p((sx * 0.23, -0.12 + sy * 0.11, 0.38)), (0.26, 0.23, 0.28), group='muzzle')
    c.blob(H.p((0, -0.12, 0.42)), (0.4, 0.29, 0.28), group='muzzle')
    # nostril bumps on top of the muzzle
    for s in (-1, 1):
        c.blob(H.p((s * 0.19, 0.12, 0.5)), (0.12, 0.08, 0.1), group='nos%d' % s)
    # tiny round ears and a tiny tail
    for s, n in ((-1, 'L'), (1, 'R')):
        c.blob(H.p((s * 0.3, 0.42, -0.12)), (0.11, 0.11, 0.07), group='ear' + n)
    tail = [(-0.8, 0.88, 0), (-0.92, 0.78, 0.0)]
    c.curve(tail, [0.05, 0.045], group='tail')
    # paint: rose underside of the muzzle, darker nostrils, rose inner ears, paler tummy
    c.paint_fn(lambda p, n: c.owner(p) == 'muzzle' and H.local(p).y < -0.2, ROSE)
    c.mirror(lambda s: c.paint(('nost', s), H.p((s * 0.19, 0.19, 0.54)), (0.06, 0.04, 0.07), dark(BODY, 0.5), rot=H.rot()))
    for s, n in ((-1, 'L'), (1, 'R')):
        c.paint_fn(lambda p, nn, n=n: c.owner(p) == 'ear' + n and (H.M.transposed() @ nn).z > 0.3, ROSE)
    c.paint_fn(lambda p, n: c.owner(p) == 'main' and p.y < 0.42 and n.y < -0.3, lite(BODY, 0.3))
    # two peg teeth
    c.lay('teeth', WHITE, 300, voxel=0.008)
    for s in (-1, 1):
        c.capsule(H.p((s * 0.27, -0.36, 0.6)), H.p((s * 0.27, -0.2, 0.64)), 0.055, group='t%d' % s)
    c.layer('skin')
    c.neck = (1.0, 1.1)
    c.bone('body', (-0.12, 0.3, 0), (-0.12, 1.1, 0))
    c.bone('head', (H.o.x - 0.1, 0.8, H.o.z), (H.o.x - 0.1, 1.7, H.o.z), parent='body', region=lambda q: q.x > 0.32)
    for s, n in ((-1, 'L'), (1, 'R')):
        c.bone('ear.%s.1' % n, H.p((s * 0.28, 0.32, -0.14)), H.p((s * 0.32, 0.55, -0.14)), parent='head', group='ear' + n)
    c.chain('tail', [(-0.76, 0.9, 0), (-0.96, 0.76, 0.0)], 'body', group='tail')
    c.rigid['teeth'] = 'head'
    c.face(center=H.p((0, 0.12, -0.02)), radius=0.44, faceScale=FACE_S, eyeSize=EYE, fit=1, yaw=H.yaw)
    c.build()


# =====================================================================================================
# KANGAROO
# =====================================================================================================
def kangaroo():
    c = Fig('prop_word_kangaroo', TAN, 8000, voxel=0.015)
    BODY = mix(TAN, WOOD, 0.45)
    HY = 1.72
    H = Frame((0, HY, 0.06))
    # huge feet, big haunches, pear body, thick tail on the ground as a third leg
    for s, n in ((-1, 'L'), (1, 'R')):
        c.blob((s * 0.27, 0.085, 0.3), (0.15, 0.085, 0.4), rot=(0, s * 6, 0), group='foot' + n)
        c.blob((s * 0.3, 0.4, -0.04), (0.24, 0.3, 0.32), rot=(-20, 0, 0))
    c.blob((0, 0.78, -0.02), (0.44, 0.5, 0.38))
    c.blob((0, 1.14, 0.02), (0.32, 0.3, 0.28))
    tail = [(0.1, 0.5, -0.3), (0.42, 0.22, -0.55), (0.8, 0.1, -0.46), (1.02, 0.08, -0.16)]
    c.curve(tail, [0.2, 0.16, 0.11, 0.07], group='tail')
    # small arms held in front
    for s, n in ((-1, 'L'), (1, 'R')):
        c.capsule((s * 0.25, 1.14, 0.16), (s * 0.2, 0.94, 0.36), 0.075, group='arm' + n)
        c.blob((s * 0.19, 0.9, 0.38), (0.08, 0.07, 0.08), group='arm' + n)
    # head + snout, long ears
    c.blob(H.p((0, 0.04, -0.02)), (0.42, 0.38, 0.38), group='head')
    c.blob(H.p((0, -0.14, 0.3)), (0.22, 0.16, 0.27), group='head')
    for s, n in ((-1, 'L'), (1, 'R')):
        c.blob(H.p((s * 0.27, 0.5, -0.1)), (0.085, 0.24, 0.05), rot=(0, 0, -s * 24), group='ear' + n)
        c.blob(H.p((s * 0.19, 0.3, -0.08)), (0.09, 0.09, 0.07), group='ear' + n)
    # pouch: a cream pocket on the tummy, with the joey's head peeking out of it
    c.lay('pouch', CREAM, 900, voxel=0.011)
    c.blob((0, 0.6, 0.3), (0.32, 0.22, 0.13), group='pouch')
    c.blob((0, 0.8, 0.3), (0.3, 0.06, 0.12), group='pouch', negative=True)
    c.ring((0, 0.78, 0.31), 0.0, 0.0) if False else None
    c.tube([(-0.28, 0.72, 0.3), (-0.15, 0.79, 0.4), (0.0, 0.81, 0.43), (0.15, 0.79, 0.4), (0.28, 0.72, 0.3)], 0.045, rseg=8)
    c.lay('joey', BODY, 900, voxel=0.009)
    JY = 0.92
    c.blob((0, JY, 0.34), (0.15, 0.14, 0.13), group='jh')
    c.blob((0, JY - 0.04, 0.45), (0.08, 0.06, 0.07), group='jh')
    for s in (-1, 1):
        c.blob((s * 0.09, JY + 0.17, 0.32), (0.05, 0.1, 0.03), rot=(0, 0, -s * 15), group='je%d' % s)
    c.paint_fn(lambda p, n: abs(p.x) < 0.06 and p.z > 0.5 and p.y > JY - 0.03, INK)
    c.lay('joeyeyes', INK, 200, voxel=0.006)
    for s in (-1, 1):
        c.blob((s * 0.06, JY + 0.03, 0.46), (0.026, 0.03, 0.02), group='e%d' % s)
    c.layer('skin')
    c.paint_fn(lambda p, n: c.owner(p) not in ('head',), BODY)
    c.decal('tummy', (0, 0.95), (0.3, 0.42, 0.3), CREAM)
    c.decal('muzzle', (0, HY - 0.15), (0.2, 0.14, 0.3), CREAM)
    c.paint(('nose',), H.p((0, -0.06, 0.55)), (0.08, 0.05, 0.07), dark(BROWN, 0.3))
    for s, n in ((-1, 'L'), (1, 'R')):
        c.paint_fn(lambda p, nn, n=n, s=s: c.owner(p) == 'ear' + n and nn.z > 0.4 and p.y > HY + 0.36 and
                   ell(H.p((s * 0.29, 0.52, -0.05)), (0.05, 0.17, 0.08), (0, 0, -s * 24))(p), mix(ROSE, TAN, 0.55))
    c.paint_fn(lambda p, n: c.owner(p) == 'head' and False, BODY)
    c.paint_fn(lambda p, n: c.owner(p) == 'head' and not (n.z > 0.2 and abs(p.x) < 0.3 and p.y < HY + 0.0), BODY)
    c.decal('muzzle2', (0, HY - 0.15), (0.2, 0.14, 0.3), CREAM)
    c.neck = (1.3, 1.42)
    c.bone('body', (0, 0.2, 0), (0, 1.3, 0))
    c.bone('head', (0, 1.36, 0.06), (0, 2.4, 0.06), parent='body', region=lambda q: q.y > 1.3)
    for s, n in ((-1, 'L'), (1, 'R')):
        c.bone('ear.%s.1' % n, H.p((s * 0.17, 0.32, -0.08)), H.p((s * 0.27, 0.8, -0.08)), parent='head', group='ear' + n)
        c.bone('arm.' + n, (s * 0.25, 1.14, 0.16), (s * 0.19, 0.9, 0.38), parent='body', group='arm' + n)
    c.chain('tail', tail, 'body', group='tail')
    c.bone('joey', (0, 0.7, 0.34), (0, 1.1, 0.34), parent='body', region=lambda q: c._cur in ('joey', 'joeyeyes'))
    c.rigid['joeyeyes'] = 'joey'
    c.rigid['joey'] = 'joey'
    c.rigid['pouch'] = 'body'
    c.face(center=H.p((0, 0.04, 0)), radius=0.5, faceScale=FACE_S, eyeSize=EYE, fit=1)
    c.build()


# =====================================================================================================
# KOALA / PANDA: one sitting bear figure
# =====================================================================================================
def sit_bear(kind, coat, tris, HY=1.48):
    c = Fig(kind, coat, tris, voxel=0.015)
    H = Frame((0, HY, 0.04))
    c.blob((0, 0.6, -0.04), (0.54, 0.56, 0.48))
    c.blob((0, 0.98, 0.0), (0.4, 0.3, 0.36))
    for s, n in ((-1, 'L'), (1, 'R')):
        c.capsule((s * 0.3, 0.3, 0.12), (s * 0.34, 0.2, 0.42), 0.17, group='leg' + n)
        c.blob((s * 0.35, 0.2, 0.5), (0.16, 0.17, 0.11), group='leg' + n)
    c.blob(H.p((0, 0, 0)), (0.58, 0.5, 0.5), group='head')
    c.mirror(lambda s: c.blob(H.p((s * 0.26, -0.16, 0.24)), (0.26, 0.2, 0.24), group='head'))
    return c, H


def koala():
    c, H = sit_bear('prop_word_koala', GREY, 7000)
    # big round fluffy ears, white fluff inside
    for s, n in ((-1, 'L'), (1, 'R')):
        c.blob(H.p((s * 0.56, 0.32, -0.06)), (0.3, 0.29, 0.13), rot=(0, 0, -s * 15), group='ear' + n)
        c.blob(H.p((s * 0.4, 0.22, -0.04)), (0.14, 0.12, 0.1), group='ear' + n)
    # arms hugging the branch
    BR0, BR1 = Vector((-0.5, 0.26, 0.56)), Vector((0.46, 1.2, 0.5))
    bd = (BR1 - BR0).normalized()
    for s, n, t in ((-1, 'L', 0.62), (1, 'R', 0.36)):
        hand = BR0 + bd * ((BR1 - BR0).length * t) + Vector((0, 0.0, 0.08))
        sh = Vector((s * 0.36, 1.02, 0.12))
        c.capsule(tuple(sh), tuple(hand), 0.13, r2=0.12, group='arm' + n)
        c.blob(tuple(hand + Vector((0, 0, 0.02))), (0.13, 0.12, 0.12), group='arm' + n)
    c.lay('fluff', WHITE, 900, voxel=0.01)
    rnd = random.Random(3)
    for s in (-1, 1):
        for k in range(6):
            a = TAU * k / 6 + 0.3
            c.blob(H.p((s * 0.58 + math.cos(a) * 0.13, 0.32 + math.sin(a) * 0.12, 0.04)), (0.085, 0.085, 0.07), group='f%d%d' % (s, k))
        c.blob(H.p((s * 0.58, 0.32, 0.04)), (0.12, 0.12, 0.07), group='fc%d' % s)
    # big oval ink nose
    c.lay('nose', INK, 500, voxel=0.008)
    c.blob(H.p((0, -0.06, 0.5)), (0.15, 0.19, 0.11), group='n')
    # the branch with leaves
    c.lay('branch', BROWN, 900, voxel=0.011)
    c.capsule(tuple(BR0), tuple(BR1), 0.08, group='br')
    c.capsule(tuple(BR0.lerp(BR1, 0.7)), tuple(BR0.lerp(BR1, 0.7) + Vector((0.2, 0.18, 0.04))), 0.05, group='tw')
    c.paint_fn(lambda p, n: any(abs((Vector(p) - BR0).dot(bd) - t) < 0.02 for t in (0.3, 0.55, 0.85)), dark(BROWN, 0.25))
    c.lay('leaves', GREEN, 900, voxel=0.009)
    tipA = BR1 + bd * 0.05
    tipB = BR0.lerp(BR1, 0.7) + Vector((0.2, 0.18, 0.04))
    tipC = BR0.lerp(BR1, 0.12)
    for i, (base, ang) in enumerate(((tipA, 35), (tipA, -15), (tipA, 85), (tipB, 60), (tipB, 120), (tipC, 210), (tipC, 250))):
        a = math.radians(ang)
        d = Vector((math.cos(a), math.sin(a), 0.2)).normalized()
        c.blob(tuple(base + d * 0.15), (0.16, 0.06, 0.035), rot=(0, 0, ang), group='l%d' % i)
    c.paint_fn(lambda p, n: c.owner(p) in ('l1', 'l4', 'l6'), LEAF)
    c.layer('skin')
    c.paint(('chest',), (0.0, 0.8, 0.45), (0.3, 0.34, 0.3), WHITE, only=lambda p: c.owner(p) == 'main')
    c.mirror(lambda s: c.paint(('earin', s), H.p((s * 0.58, 0.32, 0.1)), (0.22, 0.21, 0.1), lite(GREY, 0.5), only=lambda p: True))
    c.neck = (1.0, 1.12)
    c.bone('body', (0, 0.1, 0), (0, 1.0, 0))
    c.bone('head', (0, 1.06, 0.04), (0, 2.2, 0.04), parent='body', region=lambda q: q.y > 1.04 and not c.owner(q).startswith('arm'))
    for s, n in ((-1, 'L'), (1, 'R')):
        c.bone('ear.%s.1' % n, H.p((s * 0.38, 0.2, -0.05)), H.p((s * 0.75, 0.45, -0.05)), parent='head',
               region=lambda q, s=s: (c._cur in ('skin', 'fluff')) and H.local(q).x * s > 0.42 and H.local(q).y > 0.1)
    c.rigid['nose'] = 'head'
    c.rigid['branch'] = 'body'
    c.rigid['leaves'] = 'body'
    c.face(center=H.p((0, 0.06, 0)), radius=FACE_R, faceScale=FACE_S, eyeSize=EYE, fit=1, eyeX=0.42, mouthY=-0.03)
    c.build()


def panda():
    c, H = sit_bear('prop_word_panda', WHITE, 7000)
    for s, n in ((-1, 'L'), (1, 'R')):
        c.blob(H.p((s * 0.44, 0.4, -0.04)), (0.17, 0.16, 0.11), rot=(0, 0, -s * 20), group='ear' + n)
        c.blob(H.p((s * 0.36, 0.3, -0.04)), (0.12, 0.1, 0.09), group='ear' + n)
    # arms: the right paw holds the bamboo up, the left rests on the tummy
    STK0, STK1 = Vector((0.5, 0.18, 0.46)), Vector((0.62, 2.0, 0.34))
    sd = (STK1 - STK0).normalized()
    hand = STK0 + sd * 0.86 + Vector((-0.04, 0, 0.06))
    c.capsule((0.38, 1.02, 0.1), tuple(hand), 0.14, r2=0.13, group='armR')
    c.blob(tuple(hand), (0.14, 0.13, 0.13), group='armR')
    c.capsule((-0.38, 1.02, 0.1), (-0.3, 0.62, 0.42), 0.14, r2=0.13, group='armL')
    c.blob((-0.28, 0.6, 0.44), (0.14, 0.13, 0.13), group='armL')
    # bamboo: a green cane with darker node rings and two leaves at the top
    c.lay('bamboo', GREEN, 1000, voxel=0.01)
    c.capsule(tuple(STK0), tuple(STK1), 0.065, group='cane')
    L = (STK1 - STK0).length
    c.paint_fn(lambda p, n: any(abs((Vector(p) - STK0).dot(sd) - t) < 0.022 for t in (L * 0.18, L * 0.42, L * 0.66, L * 0.88)), LEAF)
    for i, (ang, z) in enumerate(((35, 0.04), (150, -0.02))):
        a = math.radians(ang)
        base = STK0 + sd * (L * 0.8)
        d = Vector((math.cos(a), math.sin(a) * 0.5, 0.1)).normalized()
        c.blob(tuple(base + d * 0.2), (0.21, 0.065, 0.03), rot=(0, 0, ang * 0.3 if ang < 90 else 180 - (180 - ang) * 0.3), group='lf%d' % i)
    c.paint_fn(lambda p, n: c.owner(p) in ('lf0', 'lf1'), LEAF)
    c.layer('skin')
    # ink: ears, arms, legs, shoulder band, eye patches; a little ink nose
    c.paint_group(['earL', 'earR', 'armL', 'armR', 'legL', 'legR'], INK)
    c.paint_fn(lambda p, n: c.owner(p) == 'main' and 0.92 < p.y < 1.18 + 0.0 and (abs(p.x) > 0.22 or p.z < 0.0) and p.y > 0.92 + 0.14 * max(0, p.z) * 0, INK)
    c.paint_fn(lambda p, n: c.owner(p) in ('legL', 'legR') and p.z > 0.58, lite(INK, 0.3))
    for s in (-1, 1):
        c.paint(('patch', s), H.p((s * 0.22, 0.04, 0.46)), (0.13, 0.17, 0.2), INK, rot=(0, 0, s * 28))
    c.paint(('nose',), H.p((0, -0.11, 0.52)), (0.08, 0.055, 0.08), INK)
    c.neck = (1.0, 1.12)
    c.bone('body', (0, 0.1, 0), (0, 1.0, 0))
    c.bone('head', (0, 1.06, 0.04), (0, 2.2, 0.04), parent='body', region=lambda q: q.y > 1.04 and c.owner(q) not in ('armL', 'armR'))
    for s, n in ((-1, 'L'), (1, 'R')):
        c.bone('ear.%s.1' % n, H.p((s * 0.36, 0.3, -0.04)), H.p((s * 0.52, 0.55, -0.04)), parent='head', group='ear' + n)
    c.bone('arm.L', (-0.38, 1.02, 0.1), (-0.28, 0.6, 0.44), parent='body', group='armL')
    c.rigid['bamboo'] = 'body'
    c.face(center=H.p((0, 0.04, 0)), radius=FACE_R, faceScale=FACE_S, eyeSize=EYE * 1.08, fit=1, mouthY=-0.02)
    c.build()


# =====================================================================================================
# PENGUIN
# =====================================================================================================
def penguin():
    NAVY = mix(INK, BLUE, 0.28)
    c = Fig('prop_word_penguin', NAVY, 6000, voxel=0.015)
    HY = 1.5
    c.blob((0, 0.96, 0), (0.62, 0.84, 0.56))
    c.blob((0, 0.64, 0.04), (0.6, 0.48, 0.54))
    c.blob((0, HY, 0.02), (0.5, 0.48, 0.48))
    # flipper wings out to the sides
    c.lay('wings', NAVY, 900, voxel=0.01)
    for s, n in ((-1, 'L'), (1, 'R')):
        c.blob((s * 0.68, 0.92, 0.02), (0.11, 0.36, 0.2), rot=(0, 0, s * 38), group='w' + n)
        c.blob((s * 0.6, 1.08, 0.0), (0.12, 0.18, 0.2), rot=(0, 0, s * 30), group='w' + n)
    c.layer('feet' if False else 'skin')
    c.lay('feet', ORANGE, 700, voxel=0.01)
    for s in (-1, 1):
        c.blob((s * 0.24, 0.06, 0.36), (0.19, 0.06, 0.22), rot=(0, s * 12, 0), group='f%d' % s)
        for k in (-1, 1):
            c.blob((s * 0.24 + k * 0.1, 0.06, 0.52), (0.08, 0.06, 0.09), group='f%d' % s)
    c.lay('beak', ORANGE, 300, voxel=0.007)
    c.blob((0, HY - 0.1, 0.5), (0.13, 0.08, 0.12), group='b')
    c.blob((0, HY - 0.13, 0.62), (0.075, 0.055, 0.08), group='b')
    c.layer('skin')
    # white front + heart-shaped face, yellow cheek patches
    c.decal('front', (0, 0.72), (0.46, 0.62, 0.4), WHITE)
    for s in (-1, 1):
        c.decal(('face', s), (s * 0.17, HY + 0.02), (0.26, 0.3, 0.4), WHITE)
    c.decal('chin', (0, HY - 0.22), (0.26, 0.2, 0.4), WHITE)
    c.mirror(lambda s: c.paint(('cheek', s), (s * 0.44, HY - 0.02, 0.2), (0.12, 0.17, 0.2), YELLOW, rot=(0, 0, s * 20)))
    c.neck = (1.08, 1.2)
    c.bone('body', (0, 0.1, 0), (0, 1.1, 0))
    c.bone('head', (0, 1.14, 0.02), (0, 2.1, 0.02), parent='body', region=lambda q: q.y > 1.08 and c._cur != 'wings')
    for s, n in ((-1, 'L'), (1, 'R')):
        c.bone('wing.' + n, (s * 0.52, 1.18, 0.0), (s * 0.86, 0.66, 0.02), parent='body', region=lambda q, n=n, s=s: c._cur == 'wings' and q.x * s > 0)
    c.rigid['beak'] = 'head'
    c.rigid['feet'] = 'body'
    c.face(center=(0, HY + 0.02, 0.02), radius=0.52, faceScale=FACE_S, eyeSize=EYE, mouth=0)
    c.build()


# =====================================================================================================
# CROCODILE (along x, front +x)
# =====================================================================================================
def face_eyes(C, R, yaw, eyeX=0.36, eyeY=0.12, fs=FACE_S):
    M = Ry(yaw)
    ex, ey = eyeX * R, eyeY * R
    z = math.sqrt(max(0, R * R - ex * ex - ey * ey))
    return [Vector(C) + M @ (Vector((sx * ex, ey, z)) * fs) for sx in (-1, 1)]


def crocodile():
    c = Fig('prop_word_crocodile', GREEN, 7500, voxel=0.015, outline=0.03)
    c.target_faces = 4000
    # body + tail curling a little toward the camera
    c.blob((-0.15, 0.4, 0), (0.62, 0.3, 0.38))
    c.blob((0.3, 0.44, 0), (0.36, 0.28, 0.32))
    tail = [(-0.6, 0.38, 0.0), (-0.98, 0.3, 0.14), (-1.18, 0.2, 0.46), (-1.08, 0.13, 0.8)]
    c.curve(tail, [0.27, 0.19, 0.13, 0.08], group='tail')
    # head: skull, long upper snout, lower jaw (its own group: the jaw bone opens it)
    c.blob((0.72, 0.5, 0), (0.3, 0.26, 0.3), group='head')
    c.blob((1.18, 0.5, 0), (0.5, 0.13, 0.25), group='head')
    c.blob((1.6, 0.52, 0), (0.12, 0.12, 0.2), group='head')
    for s in (-1, 1):
        c.blob((1.58, 0.62, s * 0.08), (0.06, 0.05, 0.05), group='head')
    c.blob((1.1, 0.29, 0), (0.48, 0.1, 0.22), rot=(0, 0, -4), group='jaw')
    c.blob((0.72, 0.32, 0), (0.24, 0.14, 0.26), group='jaw')
    # eye bumps exactly where the code eyes sit
    C, R, YAW = (0.86, 0.66, 0.0), 0.28, 42
    eyes = face_eyes(C, R, YAW, eyeX=0.42, eyeY=0.5)
    for i, e in enumerate(eyes):
        dz = Ry(YAW) @ Vector((0, 0, 1))
        c.blob(tuple(e - dz * 0.1 - Vector((0, 0.03, 0))), (0.12, 0.11, 0.12), group='eyeb%d' % i)
    # stub legs splayed out
    for x in (0.38, -0.5):
        for s in (-1, 1):
            g = 'leg%d%d' % (x > 0, s)
            c.capsule((x, 0.3, s * 0.3), (x + 0.04, 0.1, s * 0.46), 0.12, group=g)
            c.blob((x + 0.1, 0.07, s * 0.5), (0.15, 0.07, 0.11), group=g)
    # paint: yellow underside (tummy, under the jaw), leaf ridge layer, teeth, smile
    c.paint_fn(lambda p, n: (p.y < 0.24 and c.owner(p) in ('main', 'jaw')) or (c.owner(p) == 'jaw' and n.y < -0.4), YELLOW)
    c.mirror(lambda s: c.paint(('nost', s), (1.6, 0.66, s * 0.08), (0.03, 0.03, 0.03), LEAF))
    c.lay('ridge', LEAF, 1300, voxel=0.01)
    tp = [(0.62, 0.74, 0), (0.2, 0.72, 0), (-0.3, 0.7, 0), (-0.7, 0.6, 0.02), (-0.98, 0.48, 0.14), (-1.18, 0.34, 0.46), (-1.1, 0.24, 0.74)]
    P = [Vector(q) for q in tp]
    N = 14
    for i in range(N):
        t = i / (N - 1) * (len(P) - 1)
        k = min(int(t), len(P) - 2)
        q = P[k].lerp(P[k + 1], t - k)
        sc = 1 - 0.55 * i / (N - 1)
        c.blob(tuple(q), (0.07 * sc, 0.1 * sc, 0.06 * sc), rot=(0, 0, 0), group='r%d' % (i % 2))
        c.blob(tuple(q + Vector((0, 0.07 * sc, 0))), (0.04 * sc, 0.06 * sc, 0.035 * sc), group='r%d' % (i % 2))
    c.lay('teeth', WHITE, 900, voxel=0.007)
    for i in range(7):
        x = 0.82 + i * 0.12
        zz = 0.23 - 0.02 * (x - 0.82) / 0.72
        for s in (1, -1):
            c.blob((x, 0.4, s * zz), (0.04, 0.05, 0.035), group='tu%d%d' % (i, s))
            if i % 2 == 0 and i < 6:
                c.blob((x + 0.06, 0.34, s * (zz - 0.02)), (0.035, 0.04, 0.03), group='tl%d%d' % (i, s))
    c.layer('skin')
    c.neck = (0.0, 0.0)
    c.bone('body', (-0.15, 0.2, 0), (-0.15, 0.9, 0))
    c.bone('head', (0.6, 0.3, 0), (0.6, 1.0, 0), parent='body', region=lambda q: q.x > 0.5)
    c.bone('jaw', (0.6, 0.36, 0), (1.5, 0.3, 0), parent='head',
           region=lambda q: (c._cur == 'skin' and c.owner(q) == 'jaw') or (c._cur == 'teeth' and c.owner(q).startswith('tl')))
    c.chain('tail', [(-0.55, 0.38, 0.0), (-0.98, 0.3, 0.14), (-1.18, 0.2, 0.46), (-1.06, 0.12, 0.86)], 'body',
            region=lambda q: q.x < -0.5)
    c.rigid['ridge'] = 'body'
    c.face(center=C, radius=R, faceScale=FACE_S, eyeSize=EYE * 1.1 / (R / 0.42), eyeX=0.42, eyeY=0.5, mouth=0, cheeks=0, yaw=YAW,
           snap=False, eyesnap=0)
    c.build()


# =====================================================================================================
# SNAKE
# =====================================================================================================
def snake():
    c = Fig('prop_word_snake', GREEN, 5500, voxel=0.015)
    c.target_faces = 3300
    TR = 0.19
    pts = []
    turns = 3.0
    n = 120
    for i in range(n + 1):
        t = i / n
        a = math.pi * 0.5 + TAU * turns * t           # start at the front (+z) and wind round, rising and narrowing
        rr = 0.72 - 0.4 * t
        y = TR * 0.95 + t * 0.84
        pts.append((rr * math.sin(a), y, rr * math.cos(a)))
    # the neck rises from the top loop at the front into an S, up to the raised head
    end = Vector(pts[-1])
    neck = [tuple(end + Vector((0.08, 0.16, 0.06))), (0.12, 1.36, 0.3), (0.02, 1.58, 0.26), (0.0, 1.72, 0.2)]
    path = pts + neck
    rad = [TR * min(1.0, 0.35 + 0.65 * (i / 18)) for i in range(len(pts))] + [TR * 0.95, TR * 0.88, TR * 0.85, TR * 0.85]
    c.tube(path, rad, rseg=14)
    HY = 1.86
    c.blob((0, HY, 0.2), (0.36, 0.3, 0.33), group='head')
    c.blob((0, HY - 0.06, 0.42), (0.27, 0.19, 0.2), group='head')
    # paint: yellow underside + diamonds along the back
    P = [Vector(q) for q in path]
    Ls = [0.0]
    for a, b in zip(P, P[1:]):
        Ls.append(Ls[-1] + (b - a).length)
    def near(q):
        best = (1e9, 0, 0.0)
        for i in range(0, len(P) - 1):
            d, t = seg_dist(q, P[i], P[i + 1])
            if d < best[0]:
                best = (d, i, t)
        d, i, t = best
        ctr = P[i].lerp(P[i + 1], t)
        tan = (P[i + 1] - P[i]).normalized()
        return ctr, tan, Ls[i] + t * (P[i + 1] - P[i]).length
    def upout(ctr, tan):
        radial = Vector((ctr.x, 0, ctr.z))
        u = radial.normalized() * 0.55 + Vector((0, 1, 0)) if radial.length > 1e-3 else Vector((0, 0, 1))
        u = (u - tan * u.dot(tan)).normalized()
        return u
    HC = Vector((0, HY, 0.24))
    is_head = lambda q: ((Vector(q) - HC) * Vector((1 / 0.42, 1 / 0.36, 1 / 0.46))).length < 1.0 and q.y > HY - 0.3
    def under(q, nn):
        if is_head(q):
            return H_local_under(q)
        ctr, tan, s = near(q)
        if s < Ls[len(pts) - 1] - 0.3:
            return False                              # only the raised neck shows its belly
        d = (Vector(q) - ctr).normalized()
        return d.dot(Vector((0, 0, 1))) > 0.45
    def H_local_under(q):
        return q.y < HY - 0.2 and q.z > 0.3
    def diamond(q, nn):
        if is_head(q):
            return False
        ctr, tan, s = near(q)
        if s < 0.35 or s > Ls[-1] - 0.25:
            return False
        d = (Vector(q) - ctr).normalized()
        u = upout(ctr, tan)
        across = math.acos(max(-1, min(1, d.dot(u))))
        ph = (s / 0.36) % 1 - 0.5
        return abs(ph) / 0.36 + across / 0.95 < 1.0
    c.paint_fn(under, YELLOW)
    c.paint_fn(diamond, YELLOW)
    # forked tongue
    c.lay('tongue', RED, 400, voxel=0.007)
    T0 = Vector((0, HY - 0.2, 0.55))
    c.tube([tuple(T0), tuple(T0 + Vector((0, -0.06, 0.16)))], 0.03, rseg=8)
    for s in (-1, 1):
        c.tube([tuple(T0 + Vector((0, -0.06, 0.16))), tuple(T0 + Vector((s * 0.07, -0.08, 0.27)))], 0.026, rseg=8)
    c.layer('skin')
    c.neck = (1.3, 1.55)
    c.bone('body', (0, 0.1, 0), (0, 1.2, 0))
    c.bone('head', (0, 1.25, 0.2), (0, 2.2, 0.2), parent='body', region=lambda q: q.y > 1.2)
    c.bone('tongue', tuple(T0 - Vector((0, 0, 0.05))), tuple(T0 + Vector((0, -0.06, 0.2))), parent='head', region=lambda q: c._cur == 'tongue')
    c.rigid['tongue'] = 'tongue'
    c.face(center=(0, HY + 0.02, 0.16), radius=0.42, faceScale=FACE_S, eyeSize=EYE, fit=1)
    c.build()


# =====================================================================================================
# DINOSAUR
# =====================================================================================================
def dinosaur():
    c = Fig('prop_word_dinosaur', GREEN, 8000, voxel=0.015)
    HY = 1.66
    H = Frame((0, HY, 0.14))
    for s, n in ((-1, 'L'), (1, 'R')):
        c.capsule((s * 0.32, 0.6, -0.08), (s * 0.34, 0.16, 0.06), 0.2, group='leg' + n)
        c.blob((s * 0.35, 0.1, 0.22), (0.2, 0.1, 0.27), group='leg' + n)
        for k in (-1, 0, 1):
            c.blob((s * 0.35 + k * 0.1, 0.07, 0.46), (0.05, 0.05, 0.05), group='claw%s%d' % (n, k))
    c.blob((0, 0.82, -0.1), (0.5, 0.58, 0.46))
    c.blob((0, 1.16, 0.0), (0.36, 0.32, 0.34))
    tail = [(0.0, 0.62, -0.42), (0.36, 0.34, -0.78), (0.84, 0.15, -0.66), (1.16, 0.09, -0.3)]
    c.curve(tail, [0.32, 0.22, 0.14, 0.09], group='tail')
    for s, n in ((-1, 'L'), (1, 'R')):
        c.capsule((s * 0.3, 1.12, 0.28), (s * 0.36, 0.98, 0.48), 0.065, group='arm' + n)
        c.blob((s * 0.37, 0.96, 0.5), (0.07, 0.065, 0.07), group='arm' + n)
    # big head with a broad snout
    c.blob(H.p((0, 0.06, -0.06)), (0.52, 0.46, 0.46), group='head')
    c.blob(H.p((0, -0.14, 0.24)), (0.44, 0.3, 0.34), group='head')
    # orange round plates from the top of the head down the back to the tail
    c.lay('plates', ORANGE, 1600, voxel=0.01)
    spine = [H.p((0, 0.5, -0.02)), H.p((0, 0.44, -0.3)), (0, 1.5, -0.5), (0, 1.22, -0.56), (0, 0.94, -0.58), (0.1, 0.72, -0.62),
             (0.36, 0.5, -0.94), (0.72, 0.3, -0.86)]
    for i, q in enumerate(spine):
        sc = 1.15 - 0.07 * i
        c.blob(tuple(Vector(q) + Vector((0, 0.06, 0))), (0.075, 0.17 * sc, 0.15 * sc), group='p%d' % (i % 2))
    # a sculpted smile with small rounded teeth (mouth=0 on the code face)
    def snout_z(x, y):
        q = H.local((x, y, 0))
        u = 1 - (q.x / 0.46) ** 2 - ((q.y + 0.14) / 0.32) ** 2
        return H.p((q.x, q.y, 0.24 + 0.36 * math.sqrt(max(0.0, u))))
    c.lay('mouth', INK, 400, voxel=0.007)
    sm = []
    for k in range(15):
        a = math.radians(200 + 140 * k / 14)
        sm.append(snout_z(*H.p((0.3 * math.cos(a), -0.06 + 0.17 * math.sin(a), 0))[:2]))
    c.tube(sm, 0.024, rseg=8)
    c.lay('teeth', WHITE, 400, voxel=0.007)
    for k in (3, 5, 9, 11):
        q = Vector(sm[k])
        c.blob(tuple(q + Vector((0, -0.035, -0.005))), (0.03, 0.04, 0.025), group='t%d' % k)
    c.layer('skin')
    c.decal('tummy', (0, 0.86), (0.34, 0.46, 0.3), YELLOW)
    c.paint_fn(lambda p, n: c.owner(p) == 'head' and p.y < HY - 0.28 and p.z > 0.2, YELLOW)
    c.paint_group([g for g in ('clawL-1', 'clawL0', 'clawL1', 'clawR-1', 'clawR0', 'clawR1')], CREAM)
    c.rigid['mouth'] = 'head'
    c.rigid['teeth'] = 'head'
    c.rigid['plates'] = 'body'
    c.neck = (1.18, 1.32)
    c.bone('body', (0, 0.2, 0), (0, 1.2, 0))
    c.bone('head', (0, 1.26, 0.14), (0, 2.3, 0.14), parent='body', region=lambda q: q.y > 1.22 and not (c._cur == 'plates' and q.y < 1.62))
    for s, n in ((-1, 'L'), (1, 'R')):
        c.bone('arm.' + n, (s * 0.3, 1.12, 0.28), (s * 0.37, 0.96, 0.5), parent='body', group='arm' + n)
    c.chain('tail', tail, 'body', group='tail', region=lambda q: q.z < -0.3)
    c.face(center=H.p((0, 0.12, 0)), radius=0.52, faceScale=FACE_S, eyeSize=EYE, mouth=0)
    c.build()


if __name__ == '__main__':
    for fn in (lion, tiger, zebra, giraffe, hippo, kangaroo, koala, panda, penguin, crocodile, snake, dinosaur, unicorn):
        if want('prop_word_' + fn.__name__):
            fn()
