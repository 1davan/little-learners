"""WORDS batch 3 (docs/design/VOCAB.md): the NEW fruit and vegetable word models (the rest of the batch reuses the meadow
fruit, kitchen veg and farm props). One script, several models; ONLY=prop_word_peach,... builds a subset:
    ONLY=prop_word_peach tools/blender/build.sh prop_words_fruitveg

Word-card variants of reused models (baked colours, no faces, no tint argument; originals untouched): new builds
prop_word_orange (dimples, star top), _blueberry (cluster of 3), _watermelon (slice), _tomato (leafy top), _peas (tipped pod);
rebake() copies of prop_m_pear / prop_m_plum (colour baked), prop_carrot / prop_corn / prop_m_mushroom (faceless).

  prop_word_pineapple   fat oval with raised YELLOW diamonds in ORANGE grooves, a tall fan of 9 pointed leaves (bone tuft)
  prop_word_peach       round ORANGE peach with a deep front crease, a hard-edged ROSE blush, BROWN stalk and one leaf
  prop_word_kiwi        a half kiwi standing cut-face forward (brown rim, green flesh, cream heart, 14 ink seeds) + a whole one
  prop_word_raspberry   a thimble of ~34 fat drupelets, a hollow on top holding a small green star of leaves
  prop_word_avocado     a half avocado, cut face forward: dark skin rim, pale-green then yellow flesh, a big brown stone
  prop_word_lettuce     a loose open head: 8 frilly cupped leaves round a pale heart, white ribs
  prop_word_vegetables  a shallow slatted wooden crate with a carrot, tomato, broccoli, corn cob and pepper poking out

Food style (shared with the reused meadow fruit): bottom at y 0 as if on a plate, facing +z, chunky and glossy with ONE
hard-edged white highlight, thin ink outline 0.018, static (one 'body' bone; the pineapple crown and lettuce leaves get
spring 'tuft' bones). extras fit/wide set the 2.0 word card.
"""
import sys, os, math, random
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from kit import Prop, rounded, circle_poly, star_poly
from mathutils import Vector

ONLY = [s for s in os.environ.get('ONLY', '').split(',') if s]

RED, ORANGE, YELLOW, GREEN, LEAF = 0xff4f4f, 0xff9a2e, 0xffd23a, 0x4cc75a, 0x2f8a3a
BLUE, SKY, PURPLE, PINK, ROSE = 0x3f8cff, 0x8fd3ff, 0x9b6dff, 0xff7fbf, 0xff9ec4
CREAM, WHITE, BROWN, WOOD, TAN = 0xf2e8d8, 0xfffaf0, 0xb07a4a, 0xd8924f, 0xf3d9ae
GREY, SLATE, INK = 0xb9c0c9, 0x6f7a8c, 0x3a2838


def tint(h, f):
    r, g, b = (h >> 16) & 255, (h >> 8) & 255, h & 255
    if f > 0:
        r, g, b = [int(c + (255 - c) * f) for c in (r, g, b)]
    else:
        r, g, b = [int(c * (1 + f)) for c in (r, g, b)]
    return (r << 16) | (g << 8) | b


def mix(a, b, t):
    ca = [(a >> k) & 255 for k in (16, 8, 0)]
    cb = [(b >> k) & 255 for k in (16, 8, 0)]
    r, g, bb = [int(x + (y - x) * t) for x, y in zip(ca, cb)]
    return (r << 16) | (g << 8) | bb


def frame_rot(up):
    """euler (degrees) turning local +y onto `up`"""
    from mathutils import Vector as V
    q = V((0, 1, 0)).rotation_difference(V(up))
    return tuple(math.degrees(a) for a in q.to_euler('XYZ'))


def frame_rot_z(n):
    """euler (degrees) turning local +z onto n"""
    from mathutils import Vector as V
    q = V((0, 0, 1)).rotation_difference(V(n))
    return tuple(math.degrees(a) for a in q.to_euler('XYZ'))



def ground(p, dy=None):
    """Stand a finished (not yet built) prop on y = 0: finds the lowest point of its blobs and primitives (ellipsoid
    extents with rotation) and shifts everything - shapes, paints, bones, face, anchors - up by -min (or by dy)."""
    from mathutils import Euler, Vector as V
    if dy is None:
        lo = 1e9
        for L in p.layers.values():
            for els in L['groups'].values():
                for e in els:
                    if e['negative']:
                        continue
                    M = Euler([math.radians(a) for a in e['rot']]).to_matrix()
                    ext = math.sqrt(sum((M[1][j] * e['size'][j]) ** 2 for j in range(3)))
                    lo = min(lo, e['pos'][1] - ext)
            for pr in L.get('prims', []):
                if pr[0] == 'box':
                    lo = min(lo, pr[1][1] - pr[2][1])
                else:
                    lo = min(lo, min(v[1] for v in pr[1]))
        dy = -lo
    if abs(dy) < 1e-4:
        return 0.0
    up = lambda t: (t[0], t[1] + dy, t[2])
    back = lambda q: V((q.x, q.y - dy, q.z))
    for L in p.layers.values():
        for els in L['groups'].values():
            for e in els:
                e['pos'] = up(e['pos'])
        prims = L.get('prims', [])
        for i, pr in enumerate(prims):
            if pr[0] == 'box':
                prims[i] = ('box', up(pr[1])) + tuple(pr[2:])
            else:
                prims[i] = ('mesh', [up(v) for v in pr[1]]) + tuple(pr[2:])
        new = []
        for kind, data, col in L['paints']:
            if kind == 'ell':
                d = dict(data); d['center'] = data['center'] + V((0, dy, 0))
                if data['only']:
                    o = data['only']; d['only'] = lambda q, o=o: o(back(q))
                new.append((kind, d, col))
            elif kind == 'decal':
                d = dict(data); d['xy'] = (data['xy'][0], data['xy'][1] + dy)
                new.append((kind, d, col))
            elif kind == 'group':
                d = dict(data)
                if data['only']:
                    o = data['only']; d['only'] = lambda q, o=o: o(back(q))
                new.append((kind, d, col))
            else:
                new.append((kind, lambda q, n, f=data: f(back(q), n), col))
        L['paints'] = new
    p.bones = [(nm, up(h), up(t), par, roll) for nm, h, t, par, roll in p.bones]
    for k, f in list(p.weight_rules.items()):
        p.weight_rules[k] = lambda q, f=f: f(back(q))
    if p.face_info:
        p.face_info['center'] = up(p.face_info['center'])
    for k, (pos, b) in list(p.anchors.items()):
        p.anchors[k] = ((pos[0], pos[1] + dy, pos[2]) if len(pos) == 3 else (pos[0], pos[1] + dy), b)
    if p.neck and p.neck[0] < 50:
        p.neck = (p.neck[0] + dy, p.neck[1] + dy)
    return dy

def finish(p, h, wide=False, outline=0.018, bones=None):
    p.bone('body', (0, 0, 0), (0, h, 0))
    for b in (bones or []):
        p.bone(*b[0], **b[1])
    p.extras['outline'] = outline
    p.extras['fit'] = 2.0
    if wide:
        p.extras['wide'] = 2.0
    p.build()


def prof_fn(prof):
    """radius at height y of a (r, y) profile listed bottom pole -> top pole"""
    def r_of(y):
        for (r0, y0), (r1, y1) in zip(prof, prof[1:]):
            if min(y0, y1) <= y <= max(y0, y1) and y0 != y1:
                return r0 + (r1 - r0) * (y - y0) / (y1 - y0)
        return 0.0
    return r_of


def revmesh(p, r_of, y0, y1, ny=60, seg=56, disp=None, sx=1.0, sz=1.0, at=(0, 0, 0)):
    """a closed surface of revolution about y between the poles y0 and y1, radius r_of(y) (+ disp(a, y) outward).
    a is measured from +z toward +x."""
    ys = [y0 + (y1 - y0) * k / ny for k in range(ny + 1)]
    verts, faces = [], []
    for y in ys[1:-1]:
        for i in range(seg):
            a = math.tau * i / seg
            r = r_of(y) + (disp(a, y) if disp else 0.0)
            verts.append((at[0] + r * math.sin(a) * sx, at[1] + y, at[2] + r * math.cos(a) * sz))
    nr = ny - 1
    for k in range(nr - 1):
        for i in range(seg):
            j = (i + 1) % seg
            faces.append((k * seg + i, k * seg + j, (k + 1) * seg + j, (k + 1) * seg + i))
    b = len(verts); verts.append((at[0], at[1] + y0, at[2]))
    t = len(verts); verts.append((at[0], at[1] + y1, at[2]))
    for i in range(seg):
        j = (i + 1) % seg
        faces.append((b, j, i))
        faces.append((t, (nr - 1) * seg + i, (nr - 1) * seg + j))
    p.mesh(verts, faces)


def glint(p, pos, size, rot=(0, 0, 0)):
    """the one hard-edged white highlight (its own small layer)"""
    cur = p._cur
    p.layer('shine', base=WHITE, target_faces=160, voxel=0.006)
    p.blob(pos, size, rot=rot, group='sh%d' % len(p.groups))
    p.layer(cur)


def leaf(p, name, base, tip, width, col=GREEN, up=(0, 1, 0), thick=0.035, rib=None):
    """a soft pointed leaf from base to tip: a chain of flat blobs whose flat side faces `up`"""
    p.layer(name, base=col, target_faces=260 if name == 'crown' else 400, voxel=0.009)
    B, Tt, U = Vector(base), Vector(tip), Vector(up).normalized()
    d = (Tt - B)
    L = d.length
    d.normalize()
    side = d.cross(U).normalized()
    gname = name + 'g%d' % len(p.groups)
    nrm = side.cross(d).normalized()
    n = 7
    for i in range(n):
        t = (i + 0.5) / n
        w = width * math.sin(math.pi * min(1.0, 0.12 + t * 0.95)) ** 0.8
        c = B + d * (L * t) + nrm * (0.08 * L * math.sin(math.pi * t))
        # build an orthonormal frame (side, nrm, d) -> euler via matrix
        from mathutils import Matrix
        M = Matrix((side, nrm, d)).transposed()
        e = M.to_euler('XYZ')
        p.blob(tuple(c), (max(w, thick), thick, L / n * 0.95), rot=tuple(math.degrees(a) for a in e), group=gname)
    if rib is not None:
        p.paint_fn(lambda q, nn: abs((q - B).dot(side)) < 0.012 and (q - B).dot(nrm) > 0, rib)
    p.layer('skin')


# ---------------------------------------------------------------- word-card variants of existing models
CRE = os.path.dirname(os.path.abspath(__file__))


def rebake(script, src, dst, tints=None, face=False, extras=None):
    """Build a word-card copy of an existing model (the original script and model are untouched): runs `script` for
    `src` with the kit's Prop / SProp swapped for a subclass that writes `dst` instead, drops the code face (objects
    have no faces), bakes tint colours into the vertex paint (tints = {layer: colour}, multiplied like the game's
    tint) and strips the tint/scale argument so the word game needs no special handling."""
    import runpy
    import kit
    from lib import hexcol
    tints = tints or {}

    class Mix:
        def __init__(self, kind, *a, **kw):
            super().__init__(dst if kind == src else kind, *a, **kw)

        def face(self, *a, **kw):
            if face:
                super().face(*a, **kw)

        def _paint(self, skin):
            super()._paint(skin)
            t = tints.get(self._cur)
            if t is None:
                return
            c = hexcol(t)
            for d in skin.data.color_attributes['Col'].data:
                r, g, b, al = d.color
                d.color = (r * c[0], g * c[1], b * c[2], al)

        def build(self, out=None):
            for k in ('argMode', 'argDefault', 'argScale'):
                self.extras.pop(k, None)
            self.extras['fit'] = 2.0
            self.extras.update(extras or {})
            ground(self)
            return super().build(out)
    saved = {}
    try:
        import skit           # import before patching kit.Prop, so SProp keeps the plain Prop as its base
    except ImportError:
        skit = None
    saved['Prop'] = kit.Prop
    kit.Prop = type('WordProp', (Mix, saved['Prop']), {})
    if skit:
        saved['SProp'] = skit.SProp
        skit.SProp = type('WordSProp', (Mix, saved['SProp']), {})
    old_only = os.environ.get('ONLY', '')
    os.environ['ONLY'] = src
    try:
        runpy.run_path(os.path.join(CRE, script), run_name='__main__')
    finally:
        os.environ['ONLY'] = old_only
        kit.Prop = saved['Prop']
        if skit:
            skit.SProp = saved['SProp']


# =================================================================== PINEAPPLE
def pineapple():
    p = Prop('prop_word_pineapple', base=YELLOW, target_faces=1100, voxel=0.012, smooth=2)
    H, R = 0.98, 0.43
    prof = rounded([(0.0, 0.0), (0.3, 0.01), (R - 0.02, 0.18), (R, 0.45), (R - 0.04, 0.75), (0.28, 0.92), (0.0, H)], 0.08, n=4)
    r_of = prof_fn(prof)
    K, M = 8, 7.0          # diamonds round, diamond rows per unit height

    def lat(a, y):
        s1 = a / math.tau * K + y * M
        s2 = a / math.tau * K - y * M
        f1, f2 = s1 - math.floor(s1), s2 - math.floor(s2)
        return min(f1, 1 - f1), min(f2, 1 - f2)     # distance to the nearest groove line (0 = on a groove)

    def disp(a, y):
        if y < 0.06 or y > H - 0.05:
            return 0.0
        g1, g2 = lat(a, y)
        g = min(g1, g2)
        return 0.032 * min(1.0, g / 0.16) * min(1.0, r_of(y) / 0.2)
    revmesh(p, r_of, 0.0, H, ny=70, seg=80, disp=disp)

    def groove(q, n):
        if q.y < 0.05 or q.y > H - 0.04:
            return False
        a = math.atan2(q.x, q.z)
        g1, g2 = lat(a, q.y)
        return min(g1, g2) < 0.07
    p.paint_fn(groove, ORANGE)
    p.paint_fn(lambda q, n: q.y < 0.04 or q.y > H - 0.06, tint(ORANGE, -0.1))
    # crown: 9 pointed leaves fanning out (3 tall inner, 6 outer arching)
    for i in range(9):
        if i < 3:
            a = math.tau * i / 3 + 0.3
            L, tilt, w = 0.78, 12, 0.1
        else:
            a = math.tau * (i - 3) / 6
            L, tilt, w = 0.62, 46, 0.1
        d = Vector((math.sin(a) * math.sin(math.radians(tilt)), math.cos(math.radians(tilt)), math.cos(a) * math.sin(math.radians(tilt))))
        base = Vector((0.06 * math.sin(a), H - 0.04, 0.06 * math.cos(a)))
        tip = base + d * L
        out = Vector((math.sin(a), 0, math.cos(a)))
        leaf(p, 'crown', tuple(base), tuple(tip), w, col=LEAF if i < 3 else GREEN, up=tuple(out), thick=0.04)
    glint(p, (-0.2, 0.62, 0.36), (0.05, 0.1, 0.015), rot=(-10, -30, 10))
    finish(p, H, bones=[(('tuft', (0, H - 0.05, 0), (0, H + 0.6, 0)), dict(parent='body', region=lambda q: q.y > H - 0.02))])


# =================================================================== PEACH
def peach():
    p = Prop('prop_word_peach', base=ORANGE, target_faces=1100, voxel=0.01, smooth=2)
    H, R = 0.9, 0.48
    prof = []
    for i in range(41):
        t = math.pi * i / 40
        r = R * math.sin(t) ** 0.85 * (1 + 0.04 * math.cos(t))
        y = H / 2 - H / 2 * math.cos(t) - 0.05 * math.exp(-((math.pi - t) / 0.3) ** 2) + 0.025 * math.exp(-(t / 0.3) ** 2)
        prof.append((r, y))
    prof[0] = (0, prof[0][1]); prof[-1] = (0, prof[-1][1])
    r_of = prof_fn(prof)
    # the crease down the front: a soft groove at a = 0
    revmesh(p, r_of, prof[0][1], prof[-1][1], ny=70, seg=64,
            disp=lambda a, y: -0.065 * math.exp(-((math.atan2(math.sin(a), math.cos(a))) / 0.16) ** 2) * min(1, r_of(y) / 0.25))
    # hard-edged rose blush on one cheek
    p.paint('blush', (0.38, 0.52, 0.28), (0.25, 0.27, 0.3), ROSE, only=lambda q: q.x > 0.08)
    # crease line a touch darker
    p.paint_fn(lambda q, n: abs(math.atan2(q.x, q.z)) < 0.05 and q.z > 0.2 and 0.12 < q.y < H - 0.1, tint(ORANGE, -0.12))
    p.layer('stalk', base=BROWN, target_faces=200, voxel=0.008)
    p.tube([(0, H - 0.08, 0), (0.0, H + 0.06, 0), (0.03, H + 0.13, 0)], [0.05, 0.045, 0.04], rseg=10)
    p.layer('skin')
    leaf(p, 'leaf', (0.03, H + 0.08, 0.0), (0.36, H + 0.2, 0.1), 0.12, col=GREEN, up=(0, 1, 0.3), thick=0.03, rib=LEAF)
    glint(p, (-0.26, 0.6, 0.34), (0.05, 0.1, 0.015), rot=(-15, -35, 15))
    finish(p, H + 0.2)


# =================================================================== KIWI
def kiwi():
    p = Prop('prop_word_kiwi', base=BROWN, target_faces=1050, voxel=0.01, smooth=2)
    R, D, CY = 0.4, 0.42, 0.42
    # the half: a half-ellipsoid whose flat cut face looks at the child (+z), dome behind
    prof = [(R * math.sin(t), -D * math.cos(t)) for t in [math.pi / 2 * i / 20 for i in range(21)]]
    prof = [(0.0, -D)] + prof[1:]
    p.lathe(prof, pos=(0, CY, 0.02), rot=(90, 0, 0), seg=48)
    face = lambda q, n: n.z > 0.6 and q.z > -0.02
    rr = lambda q: math.hypot(q.x, q.y - CY)
    p.paint_fn(lambda q, n: face(q, n) and rr(q) < R - 0.045, tint(GREEN, 0.1))
    p.paint_fn(lambda q, n: face(q, n) and rr(q) < R - 0.06 and abs(math.sin(8 * math.atan2(q.y - CY, q.x))) < 0.12 and rr(q) > 0.14, tint(GREEN, 0.35))
    p.paint_fn(lambda q, n: face(q, n) and math.hypot(q.x / 1.0, (q.y - CY) / 1.15) < 0.12, CREAM)
    # 14 ink seeds in a ring
    p.layer('seeds', base=INK, target_faces=420, voxel=0.006)
    for k in range(14):
        a = math.tau * k / 14
        rs = 0.2 + (0.015 if k % 2 else -0.01)
        p.blob((rs * math.cos(a), CY + rs * math.sin(a), 0.035), (0.022, 0.035, 0.02), rot=(0, 0, math.degrees(a) - 90), group='s%d' % k)
    # a whole kiwi behind, to the side
    p.layer('whole', base=BROWN, target_faces=600, voxel=0.011)
    p.blob((0.42, 0.29, -0.4), (0.5, 0.3, 0.32), rot=(0, 25, 0), group='w')
    p.paint_fn(lambda q, n: q.x > 0.86, tint(BROWN, -0.25))
    p.layer('skin')
    finish(p, 0.84, wide=True)


# =================================================================== RASPBERRY
def raspberry():
    RB = 0xff4a6e      # pink-red
    p = Prop('prop_word_raspberry', base=RB, target_faces=2300, voxel=0.008, smooth=2)
    rows = [(0.05, 0.07, 1), (0.13, 0.17, 6), (0.26, 0.26, 9), (0.4, 0.31, 10), (0.55, 0.33, 11), (0.7, 0.32, 11), (0.84, 0.25, 9)]
    k = 0
    for ri, (y, r, n) in enumerate(rows):
        for j in range(n):
            a = math.tau * j / n + ri * 0.35
            sz = 0.092 if ri else 0.08
            p.blob((r * math.sin(a), y + 0.02, r * math.cos(a)), (sz, sz * 0.95, sz), group='d%d' % k)
            k += 1
    p.blob((0, 0.45, 0), (0.28, 0.4, 0.28), group='core')
    # the hollow on top: darker, with a small green star of sepals
    p.paint_fn(lambda q, n: q.y > 0.84 and math.hypot(q.x, q.z) < 0.24 and n.y > 0.5, tint(RB, -0.3))
    p.paint_fn(lambda q, n: n.y < -0.2 and q.y < 0.35 and False, RB)
    p.layer('calyx', base=GREEN, target_faces=500, voxel=0.007)
    for j in range(5):
        a = math.tau * j / 5
        p.blob((0.12 * math.sin(a), 0.93, 0.12 * math.cos(a)), (0.05, 0.025, 0.11), rot=(-12, math.degrees(a), 0), group='c%d' % j)
    p.capsule((0, 0.9, 0), (0.02, 1.04, 0), 0.035, group='st')
    p.layer('skin')
    finish(p, 1.04, outline=0.015)


# =================================================================== AVOCADO
def avocado():
    p = Prop('prop_word_avocado', base=LEAF, target_faces=1300, voxel=0.01, smooth=2)
    prof = rounded([(0.0, 0.0), (0.24, 0.02), (0.37, 0.14), (0.38, 0.34), (0.3, 0.56), (0.2, 0.76), (0.15, 0.9), (0.0, 0.96)], 0.1, n=5)
    r_of = prof_fn(prof)
    # the back half of a body of revolution: the wedge's flat side is the cut face looking at +z
    p.lathe(prof, seg=40, a0=math.pi / 2, a1=math.pi * 1.5, scale=(1.0, 0.75))
    face = lambda q, n: n.z > 0.6 and q.z > -0.03
    p.paint_fn(lambda q, n: face(q, n) and abs(q.x) < r_of(q.y) - 0.045 and 0.045 < q.y < 0.93, tint(GREEN, 0.45))
    p.paint_fn(lambda q, n: face(q, n) and abs(q.x) < r_of(q.y) - 0.13 and 0.12 < q.y < 0.85, tint(YELLOW, 0.35))
    p.layer('stone', base=BROWN, target_faces=500, voxel=0.009)
    p.blob((0, 0.33, 0.0), (0.18, 0.19, 0.17), group='st')
    p.layer('skin')
    glint(p, (-0.07, 0.42, 0.155), (0.035, 0.05, 0.01), rot=(-15, -20, 15))
    finish(p, 0.96)


# =================================================================== LETTUCE
def lettuce():
    p = Prop('prop_word_lettuce', base=tint(GREEN, 0.5), target_faces=300, voxel=0.011, smooth=2)
    ribs = []

    def leaf_sheet(phi, half, rho0, rho1, h0, h1, thick=0.032, waves=7, frill=0.05, flare=0.1, cup=0.08):
        """a cupped leaf from radius rho0 at height h0 (base) to rho1 at h1 (rim): sides curl in (a cup), the rim
        flares outward and is wavy (frilly). Adds the sheet to the current layer and its outside midrib line to ribs."""
        NU, NV = 12, 14
        top, bot, rib = [], [], []
        for i in range(NU + 1):
            u = i / NU
            w = half * math.sin(math.pi * (0.2 + 0.8 * u)) ** 0.5
            for j in range(NV + 1):
                v = -1 + 2 * j / NV
                rho = rho0 + (rho1 - rho0) * math.sin(u * math.pi / 2) ** 0.8
                y = h0 + (h1 - h0) * u
                y += cup * (v * v) * math.sin(u * math.pi)
                rho -= cup * 0.6 * (v * v) * math.sin(u * math.pi)
                if u > 0.66:
                    k = (u - 0.66) / 0.34
                    rho += flare * k * k + frill * math.sin(v * waves * math.pi) * k
                    y += frill * 0.9 * math.cos(v * waves * math.pi) * k - flare * 0.4 * k * k
                a = phi + v * w
                c = Vector((rho * math.sin(a), y, rho * math.cos(a)))
                nrm = Vector((-math.sin(a) * (h1 - h0), (rho1 - rho0), -math.cos(a) * (h1 - h0))).normalized()
                top.append(c + nrm * thick); bot.append(c - nrm * thick)
                if j == NV // 2:
                    rib.append(tuple(c - nrm * (thick + 0.01)))
        verts = [tuple(v) for v in top + bot]
        off = len(top)
        faces = []
        W = NV + 1
        for i in range(NU):
            for j in range(NV):
                a0, a1, b0, b1 = i * W + j, i * W + j + 1, (i + 1) * W + j, (i + 1) * W + j + 1
                faces.append((a0, a1, b1, b0))
                faces.append((off + a0, off + b0, off + b1, off + a1))
        for i in range(NU):
            for j in (0, NV):
                a0, b0 = i * W + j, (i + 1) * W + j
                faces.append((a0, b0, off + b0, off + a0) if j == 0 else (a0, off + a0, off + b0, b0))
        for j in range(NV):
            for i in (0, NU):
                a0, a1 = i * W + j, i * W + j + 1
                faces.append((a0, off + a0, off + a1, a1) if i == 0 else (a0, a1, off + a1, off + a0))
        p.mesh(verts, faces)
        ribs.append(rib[1:-3])

    # the pale heart (skin)
    p.blob((0, 0.5, 0), (0.22, 0.3, 0.22), group='heart')
    p.blob((0, 0.15, 0), (0.24, 0.14, 0.24), group='base')
    # three rings of leaves; neighbours sit in alternate layers so every leaf gets its own ink edge
    rings = [  # n, half, rho0, rho1, h0, h1, frill, flare, colours (a, b), phase
        (6, 0.62, 0.14, 0.6, 0.02, 0.5, 0.075, 0.12, (GREEN, tint(GREEN, 0.12)), 0.0),
        (5, 0.72, 0.1, 0.46, 0.12, 0.74, 0.065, 0.1, (tint(GREEN, 0.28), tint(GREEN, 0.38)), 0.4),
        (3, 0.95, 0.06, 0.28, 0.24, 0.9, 0.045, 0.07, (tint(GREEN, 0.5), tint(GREEN, 0.56)), 1.1),
    ]
    for ri, (n, half, r0, r1, h0, h1, fr, fl, cols, ph) in enumerate(rings):
        for k in range(n):
            ab = k % 2 if n % 2 == 0 or k < n - 1 else 2
            nm = 'ring%d%s' % (ri, 'abc'[ab])
            p.layer(nm, base=cols[min(ab, 1)] if ab < 2 else tint(cols[0], 0.06), target_faces=560 if ri == 0 else 340, voxel=0.01)
            leaf_sheet(math.tau * k / n + ph, half, r0, r1, h0, h1, frill=fr, flare=fl)
    p.layer('ribs', base=WHITE, target_faces=300, voxel=0.008)
    for r in ribs[:11]:
        p.tube(r, [0.03 - 0.018 * i / (len(r) - 1) for i in range(len(r))], rseg=8)
    p.layer('skin')
    finish(p, 0.95, wide=True, bones=[(('tuft', (0, 0.1, 0), (0, 0.95, 0)), dict(parent='body', region=lambda q: q.y > 0.3))])


# =================================================================== VEGETABLES (crate)
def vegetables():
    p = Prop('prop_word_vegetables', base=WOOD, target_faces=1500, voxel=0.012, smooth=2)
    W, D, H = 0.8, 0.46, 0.5            # crate half width, half depth, height
    # slatted crate: two slats per side with a gap, corner posts, a floor
    WD = tint(WOOD, -0.18)
    for y0, y1 in ((0.04, 0.22), (0.29, 0.47)):
        cy, hh = (y0 + y1) / 2, (y1 - y0) / 2
        p.box((0, cy, D), (W, hh, 0.045), bevel=0.03)
        p.box((0, cy, -D), (W, hh, 0.045), bevel=0.03)
        p.box((W, cy, 0), (0.045, hh, D), bevel=0.03)
        p.box((-W, cy, 0), (0.045, hh, D), bevel=0.03)
    for sx in (-1, 1):
        for sz in (-1, 1):
            p.box((sx * (W - 0.02), H / 2 + 0.005, sz * (D - 0.02)), (0.07, H / 2, 0.07), bevel=0.035)
    p.box((0, 0.04, 0), (W, 0.04, D), bevel=0.02)
    # two darker grain lines on each front slat
    p.paint_fn(lambda q, n: abs(n.y) < 0.5 and any(abs(q.y - yy) < 0.012 for yy in (0.11, 0.37)) and abs(q.x) < W - 0.1 and abs(q.z) > D - 0.02, WD)
    p.paint_fn(lambda q, n: (abs(q.x) > W - 0.09 and abs(q.z) > D - 0.09), WD)
    # --- carrot (left, leaning out)
    p.layer('carrot', base=ORANGE, target_faces=500, voxel=0.01)
    cb, ct = Vector((-0.52, 0.42, 0.06)), Vector((-0.78, 1.02, 0.1))
    p.capsule(tuple(cb), tuple(ct), 0.05, r2=0.15, group='c')
    p.paint_fn(lambda q, n: abs(((q - cb).dot((ct - cb).normalized())) % 0.14 - 0.07) < 0.008, tint(ORANGE, -0.15))
    p.layer('tops', base=GREEN, target_faces=500, voxel=0.009)
    for k, (dx, dz) in enumerate(((-0.1, 0.0), (0.04, 0.05), (-0.02, -0.08))):
        p.capsule(tuple(ct + Vector((0, 0.08, 0))), tuple(ct + Vector((dx, 0.32 - abs(dx), dz))), 0.04, r2=0.03, group='t%d' % k)
    # --- broccoli (centre back)
    p.layer('broc', base=LEAF, target_faces=700, voxel=0.011)
    BC = Vector((-0.08, 0.92, -0.14))
    rnd = random.Random(3)
    for k in range(9):
        a = math.tau * k / 9
        rr = 0.17 if k else 0.0
        p.blob(tuple(BC + Vector((rr * math.sin(a), 0.03 * rnd.random(), rr * math.cos(a)))), (0.13, 0.12, 0.13), group='f%d' % k)
    p.blob(tuple(BC + Vector((0, 0.07, 0))), (0.14, 0.12, 0.14), group='f9')
    p.layer('stalk', base=tint(GREEN, 0.45), target_faces=300, voxel=0.01)
    p.capsule((-0.08, 0.35, -0.14), tuple(BC - Vector((0, 0.08, 0))), 0.09, r2=0.08, group='s')
    # --- corn (right back, leaning)
    p.layer('corn', base=YELLOW, target_faces=700, voxel=0.009)
    kb, kt = Vector((0.36, 0.42, -0.14)), Vector((0.52, 1.1, -0.18))
    ax = (kt - kb).normalized()
    p.capsule(tuple(kb), tuple(kt), 0.15, r2=0.12, group='k')
    def kern(q, n):
        d = q - kb
        t = d.dot(ax)
        if t < 0.05 or t > (kt - kb).length + 0.05:
            return False
        rad = d - ax * t
        side = ax.cross(Vector((0, 0, 1))).normalized()
        ang = math.atan2(rad.dot(Vector((0, 0, 1)).cross(ax).normalized()), rad.dot(side))
        return abs((t / 0.075) % 1 - 0.5) > 0.38 or abs((ang / (math.tau / 12)) % 1 - 0.5) > 0.4
    p.paint_fn(kern, tint(YELLOW, -0.15))
    p.layer('husk', base=GREEN, target_faces=500, voxel=0.009)
    for k, s in enumerate((-1, 1)):
        p.capsule(tuple(kb + Vector((s * 0.12, 0.0, 0.06))), tuple(kb + ax * 0.45 + Vector((s * 0.2, 0.0, 0.08))), 0.05, r2=0.02, group='h%d' % k)
    # --- tomato (front left)
    p.layer('tomato', base=RED, target_faces=500, voxel=0.01)
    TC = Vector((-0.22, 0.58, 0.24))
    p.blob(tuple(TC), (0.24, 0.21, 0.24), group='t')
    p.layer('calyx', base=LEAF, target_faces=300, voxel=0.007)
    for j in range(5):
        a = math.tau * j / 5
        p.blob(tuple(TC + Vector((0.08 * math.sin(a), 0.205, 0.08 * math.cos(a)))), (0.035, 0.02, 0.09), rot=(-12, math.degrees(a), 0), group='c%d' % j)
    p.capsule(tuple(TC + Vector((0, 0.2, 0))), tuple(TC + Vector((0.01, 0.29, 0))), 0.03, group='cs')
    # --- pepper (front right)
    PEP = GREEN
    p.layer('pepper', base=PEP, target_faces=600, voxel=0.01)
    PC = Vector((0.36, 0.58, 0.22))
    for j in range(3):
        a = math.tau * j / 3 + 0.4
        p.blob(tuple(PC + Vector((0.09 * math.sin(a), 0.0, 0.09 * math.cos(a)))), (0.16, 0.24, 0.16), group='lobe')
    p.blob(tuple(PC + Vector((0, -0.16, 0))), (0.13, 0.08, 0.13), group='lobe')
    p.layer('pstalk', base=LEAF, target_faces=250, voxel=0.008)
    p.blob(tuple(PC + Vector((0, 0.23, 0))), (0.09, 0.04, 0.09), group='cap')
    p.tube([tuple(PC + Vector((0, 0.23, 0))), tuple(PC + Vector((0.0, 0.36, 0))), tuple(PC + Vector((0.06, 0.42, 0)))], 0.04, rseg=8)
    p.layer('skin')
    finish(p, 1.1, wide=True, outline=0.02)


# =================================================================== WORD-CARD VARIANTS OF REUSED FOOD
def orange():
    p = Prop('prop_word_orange', base=ORANGE, target_faces=1300, voxel=0.01, smooth=2)
    H, R = 0.9, 0.48
    prof = []
    for i in range(41):
        t = math.pi * i / 40
        prof.append((R * math.sin(t) ** 0.9, H / 2 - H / 2 * math.cos(t) - 0.03 * math.exp(-((math.pi - t) / 0.25) ** 2)))
    prof[0] = (0, prof[0][1]); prof[-1] = (0, prof[-1][1])
    r_of = prof_fn(prof)
    rnd = random.Random(5)
    pits = []
    for k in range(70):          # dimples spread evenly over the peel (golden-angle spiral)
        y = 0.08 + (H - 0.16) * (k + 0.5) / 70
        a = k * 2.39996
        pits.append((a, y))

    def pit_d(q):
        a = math.atan2(q.x, q.z)
        best = 9
        for pa, py in pits:
            da = math.atan2(math.sin(a - pa), math.cos(a - pa)) * max(r_of(q.y), 0.05)
            d = math.hypot(da, q.y - py)
            best = min(best, d)
        return best
    revmesh(p, r_of, prof[0][1], prof[-1][1], ny=60, seg=64)
    # dimpled peel: little round darker dimples, each its own tiny disc on the skin (crisp round dots)
    p.layer('pits', base=tint(ORANGE, -0.14), target_faces=900, voxel=0.006)
    for k, (a, y) in enumerate(pits):
        if y < 0.12 or y > H - 0.12:
            continue
        r = r_of(y)
        nrm = Vector((math.sin(a), (r_of(y - 0.02) - r_of(y + 0.02)) / 0.04, math.cos(a))).normalized()
        c = Vector((r * math.sin(a), y, r * math.cos(a))) + nrm * 0.006
        p.blob(tuple(c), (0.024, 0.024, 0.009), rot=frame_rot_z(nrm), group='pt%d' % k)
    p.layer('skin')
    # the green star top, a stalk and one leaf
    p.layer('calyx', base=LEAF, target_faces=300, voxel=0.007)
    sp = star_poly(0.15, inner=0.45, n=5, rot=90)
    verts = [(x, H - 0.005, -y) for x, y in sp] + [(x, H + 0.04, -y) for x, y in sp]
    m = len(sp)
    faces = [tuple(range(m)), tuple(range(2 * m - 1, m - 1, -1))] + [(i, (i + 1) % m, m + (i + 1) % m, m + i) for i in range(m)]
    p.mesh(verts, faces)
    p.layer('stalk', base=BROWN, target_faces=150, voxel=0.008)
    p.tube([(0, H, 0), (0.0, H + 0.1, 0), (0.03, H + 0.15, 0)], [0.04, 0.035, 0.03], rseg=10)
    p.layer('skin')
    leaf(p, 'leaf', (0.03, H + 0.1, 0.0), (0.34, H + 0.22, 0.12), 0.11, col=GREEN, up=(0, 1, 0.3), thick=0.03, rib=LEAF)
    glint(p, (-0.27, 0.58, 0.33), (0.05, 0.1, 0.015), rot=(-15, -38, 15))
    finish(p, H + 0.2)


def blueberry():
    BB, BD = BLUE, mix(BLUE, INK, 0.55)
    p = Prop('prop_word_blueberry', base=BB, target_faces=1500, voxel=0.009, smooth=2)
    berries = [((-0.25, 0.24, 0.08), 15), ((0.25, 0.24, 0.06), -12), ((0.0, 0.62, -0.06), 4)]
    for i, (c, yaw) in enumerate(berries):
        p.blob(c, (0.26, 0.235, 0.26), group='b%d' % i)
    # each berry's crown: a dark well with five little sepals, tipped toward the child
    p.layer('crown', base=BD, target_faces=600, voxel=0.007)
    for i, (c, yaw) in enumerate(berries):
        C = Vector(c)
        up = Vector((math.sin(math.radians(yaw)) * 0.3, 1.0, 0.55)).normalized()
        top = C + Vector((up.x * 0.25, up.y * 0.225, up.z * 0.25))
        side = up.cross(Vector((0, 0, 1))).normalized() if abs(up.z) < 0.95 else Vector((1, 0, 0))
        fwd = side.cross(up).normalized()
        for k in range(5):
            a = math.tau * k / 5
            d = side * math.cos(a) + fwd * math.sin(a)
            p.blob(tuple(top + d * 0.075 - up * 0.01), (0.04, 0.04, 0.04), group='c%d%d' % (i, k))
        p.blob(tuple(top - up * 0.02), (0.075, 0.035, 0.075), rot=frame_rot(up), group='w%d' % i)
    p.layer('skin')
    p.paint_fn(lambda q, n: n.y < -0.4, tint(BB, -0.15))
    for i, (c, yaw) in enumerate(berries):
        glint(p, (c[0] - 0.12, c[1] + 0.06, c[2] + 0.2), (0.025, 0.05, 0.012), rot=(-15, -30, 15))
    finish(p, 0.86, wide=True)


def watermelon():
    p = Prop('prop_word_watermelon', base=GREEN, target_faces=1300, voxel=0.011, smooth=2)
    R, T = 0.9, 0.17
    # a half-moon slice standing up, flat red top, rind round the bottom arc (like the picture-book slice)
    arc = [(R * math.cos(math.pi + math.pi * i / 32), R + R * math.sin(math.pi + math.pi * i / 32)) for i in range(33)]
    m = len(arc)
    verts = [(x, y, -T) for x, y in arc] + [(x, y, T) for x, y in arc]
    faces = [tuple(range(m)), tuple(range(2 * m - 1, m - 1, -1))] + [(i, (i + 1) % m, m + (i + 1) % m, m + i) for i in range(m)]
    p.mesh(verts, faces)
    C = Vector((0, R, 0))
    rr = lambda q: math.hypot(q.x, q.y - R)
    cut = lambda q, n: abs(n.z) > 0.6 or n.y > 0.7
    p.paint_fn(lambda q, n: cut(q, n) and rr(q) < R - 0.07, tint(GREEN, 0.6))
    p.paint_fn(lambda q, n: cut(q, n) and rr(q) < R - 0.14, RED)
    p.paint_fn(lambda q, n: not cut(q, n) and abs(math.sin(math.atan2(q.y - R, q.x) * 9)) < 0.3, LEAF)
    p.layer('seeds', base=INK, target_faces=500, voxel=0.006)
    k = 0
    for ring, (rs, n) in enumerate(((0.52, 7), (0.3, 4))):
        for j in range(n):
            a = math.pi + math.pi * (j + 0.5) / n
            for zs in (1, -1):
                p.blob((rs * math.cos(a), R + rs * math.sin(a), zs * (T + 0.005)), (0.028, 0.05, 0.02), rot=(0, 0, math.degrees(a) + 90), group='s%d' % k)
                k += 1
    p.layer('skin')
    finish(p, R, wide=True)


def tomato():
    p = Prop('prop_word_tomato', base=RED, target_faces=1300, voxel=0.01, smooth=2)
    H, R = 0.82, 0.52
    prof = []
    for i in range(41):
        t = math.pi * i / 40
        prof.append((R * math.sin(t) ** 0.8, H / 2 - H / 2 * math.cos(t) - 0.06 * math.exp(-((math.pi - t) / 0.35) ** 2)))
    prof[0] = (0, prof[0][1]); prof[-1] = (0, prof[-1][1])
    r_of = prof_fn(prof)
    revmesh(p, r_of, prof[0][1], prof[-1][1], ny=56, seg=60, disp=lambda a, y: 0.018 * math.cos(5 * a) * math.sin(math.pi * y / H))
    # a big leafy green star on top: six drooping pointed sepals and a fat stalk
    for k in range(6):
        a = math.tau * k / 6 + 0.25
        d = Vector((math.sin(a), 0, math.cos(a)))
        b = Vector((0, H - 0.04, 0)) + d * 0.05
        t = Vector((0, H - 0.1, 0)) + d * 0.36
        leaf(p, 'calyx', tuple(b), tuple(t), 0.075, col=LEAF, up=tuple(Vector((0, 1, 0)) + d * 0.3), thick=0.03)
    p.layer('stalk', base=LEAF, target_faces=200, voxel=0.008)
    p.tube([(0, H - 0.04, 0), (0.0, H + 0.1, 0), (0.06, H + 0.17, 0)], [0.055, 0.045, 0.04], rseg=10)
    p.layer('skin')
    glint(p, (-0.3, 0.52, 0.33), (0.05, 0.1, 0.015), rot=(-15, -42, 15))
    finish(p, H + 0.17, wide=True)


def peas():
    PEA, POD, POD_D = tint(GREEN, 0.38), mix(GREEN, LEAF, 0.35), LEAF
    p = Prop('prop_word_peas', base=POD, target_faces=1600, voxel=0.011, smooth=2)
    TILT = math.radians(58)

    def tp(x, y, z):
        """tip the pod's open top toward the child, then lift it onto the floor"""
        return (x, y * math.cos(TILT) - z * math.sin(TILT) + 0.3, y * math.sin(TILT) + z * math.cos(TILT))
    N = 13
    for i in range(N):
        t = i / (N - 1)
        x = -0.85 + 1.7 * t
        w = 0.24 * math.sin(math.pi * t) ** 0.6 + 0.03
        yc = 0.06 * (2 * t - 1) ** 2
        for s in (-1, 1):
            p.blob(tp(x, yc + 0.04, s * w * 0.8), (0.1, 0.13 * math.sin(math.pi * t) ** 0.5 + 0.04, 0.05), group='pod')
        p.blob(tp(x, yc - 0.06, 0), (0.1, 0.06, w * 0.75), group='pod')
    p.capsule(tp(-0.86, 0.08, 0), tp(-1.0, 0.24, 0), 0.04, group='tip')
    p.paint_fn(lambda q, n: n.y > 0.75, POD_D)
    for k, x in enumerate((-0.48, -0.16, 0.16, 0.48)):
        p.layer('peas%d' % (k % 2), base=PEA, target_faces=500, voxel=0.009)
        p.blob(tp(x, 0.13, 0), (0.15, 0.145, 0.15), group='p%d' % k)
    p.layer('peas0')
    # two loose peas on the floor in front
    for k, (x, z) in enumerate(((0.62, 0.55), (0.9, 0.38))):
        p.blob((x, 0.13, z), (0.13, 0.13, 0.13), group='l%d' % k)
    p.layer('shine', base=WHITE, target_faces=200, voxel=0.005)
    for k, x in enumerate((-0.48, -0.16, 0.16, 0.48)):
        p.blob(tp(x - 0.05, 0.22, 0.08), (0.03, 0.02, 0.012), rot=(-60, 0, 30), group='h%d' % k)
    p.layer('skin')
    ground(p)
    finish(p, 0.7, wide=True)


def pear():
    rebake('prop_meadow_fruit.py', 'prop_m_pear', 'prop_word_pear', tints={'skin': mix(GREEN, YELLOW, 0.45)})


def plum():
    rebake('prop_meadow_fruit.py', 'prop_m_plum', 'prop_word_plum', tints={'skin': PURPLE})


def carrot():
    rebake('prop_carrot.py', 'prop_carrot', 'prop_word_carrot')


def corn():
    rebake('prop_corn.py', 'prop_corn', 'prop_word_corn')


def mushroom():
    rebake('prop_meadow_garden.py', 'prop_m_mushroom', 'prop_word_mushroom', tints={'skin': RED})


MODELS = dict(prop_word_pineapple=pineapple, prop_word_peach=peach, prop_word_kiwi=kiwi, prop_word_raspberry=raspberry,
              prop_word_avocado=avocado, prop_word_lettuce=lettuce, prop_word_vegetables=vegetables,
              prop_word_orange=orange, prop_word_blueberry=blueberry, prop_word_watermelon=watermelon, prop_word_tomato=tomato,
              prop_word_peas=peas, prop_word_pear=pear, prop_word_plum=plum, prop_word_carrot=carrot, prop_word_corn=corn,
              prop_word_mushroom=mushroom)
for name, fn in MODELS.items():
    if not ONLY or name in ONLY:
        fn()
