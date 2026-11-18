"""WORDS batch 10 (docs/design/VOCAB.md): the NEW outside, nature and places word models (the rest of the batch reuses
meadow / beach / farm props). One script, several models; ONLY=prop_word_grass,... builds a subset:
    ONLY=prop_word_grass tools/blender/build.sh prop_words_outside

Word-card variants of reused models (baked colours, no faces; originals untouched): new builds prop_word_star, _cloud,
_shop, _bridge, _puddle and _mud (tipped ground tiles), _island; rebake() copies prop_word_flower (daisy, faceless),
_umbrella (red), _palm (green fronds).

  prop_word_grass         a fat tuft of 14 pointed blades (GREEN / LEAF) fanning from a little soil mound, a tiny daisy;
                          bones tuft.L / tuft.C / tuft.R spring the blades
  prop_word_stick         a fat knobbly brown stick along x, a forked side twig with one green leaf, a pale cut end (+x)
  prop_word_wateringcan   a round green can, long spout to +x with a wide yellow rose, a big loop handle; layer
                          'cloth_drops' = five sky-blue drops fanning from the rose (starts hidden; wear() it when tipped)
  prop_word_ladder        a short A-frame stepladder: red rails, five yellow rungs on the front, a small top platform
  prop_word_mountain      a big rounded peak and a smaller one, purple-grey rock, wavy white snow caps, three tiny pines
  prop_word_igloo         a white dome of ice blocks (sky-blue block lines), an arched tunnel with a dark door, a drift
  prop_word_zoo           a zoo gate: striped posts, a curved green arch sign with white Z O O, low wooden fences, a giraffe
                          peeking over one side (head bone + code face), a monkey tail hanging on the other (tail bones)

Matches the meadow / beach props: chunky, soft, crisp paint, ink outline; bottom at y 0, facing +z; extras fit/wide.
"""
import sys, os, math, random
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from kit import Prop, rounded, circle_poly, star_poly
from mathutils import Vector, Matrix

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
    ca = [(a >> s) & 255 for s in (16, 8, 0)]
    cb = [(b >> s) & 255 for s in (16, 8, 0)]
    r, g, bb = [int(x + (y - x) * t) for x, y in zip(ca, cb)]
    return (r << 16) | (g << 8) | bb



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

def finish(p, h, wide=False, outline=0.024, bones=None, body=True):
    if body:
        p.bone('body', (0, 0, 0), (0, h, 0))
    for b in (bones or []):
        p.bone(*b[0], **b[1])
    p.extras['outline'] = outline
    p.extras['fit'] = 2.0
    if wide:
        p.extras['wide'] = 2.0
    p.build()


def frame_euler(d, up):
    """euler (degrees, XYZ) whose local z points along d and local y as close to up as possible"""
    d = Vector(d).normalized()
    side = Vector(up).cross(d)
    if side.length < 1e-4:
        side = Vector((1, 0, 0))
    side.normalize()
    nrm = d.cross(side).normalized()
    M = Matrix((side, nrm, d)).transposed()
    return tuple(math.degrees(a) for a in M.to_euler('XYZ'))


def blade(p, base, tip, w, thick, bend, group):
    """a fat pointed grass blade from base to tip, bowed outward by bend (a vector)"""
    B, T, BV = Vector(base), Vector(tip), Vector(bend)
    n = 6
    face = BV.normalized() if BV.length > 1e-4 else Vector((0, 0, 1))
    for i in range(n):
        t = (i + 0.5) / n
        c = B.lerp(T, t) + BV * math.sin(math.pi * t) * 0.6
        t2 = min(1.0, t + 1.0 / n)
        c2 = B.lerp(T, t2) + BV * math.sin(math.pi * t2) * 0.6
        ww = w * (1 - t) ** 0.8 + 0.03
        p.blob(tuple(c), (ww, thick, (T - B).length / n * 0.75), rot=frame_euler(c2 - c, face), group=group)


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


# =================================================================== GRASS
def grass():
    p = Prop('prop_word_grass', base=tint(BROWN, 0.1), target_faces=500, voxel=0.012)
    # the little soil mound
    p.blob((0, 0.12, 0), (0.42, 0.12, 0.32))
    p.paint_fn(lambda q, n: n.y > 0.55, tint(BROWN, 0.25))
    rnd = random.Random(7)
    specs = []
    for i in range(14):
        a = -78 + 156 * i / 13 + rnd.uniform(-5, 5)            # fan angle from upright (degrees)
        h = 0.95 - 0.5 * abs(a) / 80 + rnd.uniform(-0.08, 0.12)
        z = rnd.uniform(-0.16, 0.18)
        specs.append((a, h, z, i))
    specs.sort(key=lambda s: s[2])
    for a, h, z, i in specs:
        ar = math.radians(a)
        x0 = math.sin(ar) * 0.12
        base = (x0, 0.1, z)
        tip = (x0 + math.sin(ar) * h, 0.1 + math.cos(ar) * h, z + 0.05 * math.copysign(1, z))
        col = GREEN if i % 2 == 0 else LEAF
        nm = 'bladeA' if i % 2 == 0 else 'bladeB'
        p.layer(nm, base=col, target_faces=620, voxel=0.009)
        blade(p, base, tip, 0.085, 0.04, (math.sin(ar) * 0.12, 0.02, 0.02), 'b%d' % i)
    # one tiny daisy at the base
    p.layer('petals', base=WHITE, target_faces=300, voxel=0.007)
    DC = Vector((0.2, 0.2, 0.33))
    for k in range(7):
        a = math.tau * k / 7
        p.blob(tuple(DC + Vector((0.075 * math.cos(a), 0.075 * math.sin(a), 0))), (0.045, 0.03, 0.02), rot=(0, 0, math.degrees(a)), group='pt%d' % k)
    p.layer('eye', base=YELLOW, target_faces=100, voxel=0.006)
    p.blob(tuple(DC + Vector((0, 0, 0.02))), (0.04, 0.04, 0.025), group='e')
    p.layer('skin')
    finish(p, 1.0, wide=True, outline=0.02,
           bones=[(('tuft.L', (-0.1, 0.12, 0), (-0.55, 0.75, 0)), dict(parent='body', region=lambda q: q.x < -0.12 and q.y > 0.16)),
                  (('tuft.C', (0, 0.12, 0), (0, 1.0, 0)), dict(parent='body', region=lambda q: abs(q.x) <= 0.2 and q.y > 0.3)),
                  (('tuft.R', (0.1, 0.12, 0), (0.55, 0.75, 0)), dict(parent='body', region=lambda q: q.x > 0.12 and q.y > 0.16))])


# =================================================================== STICK
def stick():
    p = Prop("prop_word_stick", base=BROWN, target_faces=800, voxel=0.012, smooth=1)
    p.quadriflow = False
    rnd = random.Random(2)
    L = 0.95
    pts = [(-L, 0.13, 0.0), (-0.5, 0.14, 0.03), (0.0, 0.135, -0.02), (0.45, 0.14, 0.02), (L, 0.13, 0.0)]
    p.tube(rounded(pts, 0.15, n=3), 0.12, rseg=16)
    # knobs and bumps
    for x, z in ((-0.62, 0.1), (-0.15, -0.11), (0.3, 0.1), (0.66, -0.1)):
        p.blob((x, 0.15, z), (0.07, 0.07, 0.06), group='k%.1f' % x)
    # the forked side twig, rising toward the back
    p.tube([(-0.05, 0.16, -0.02), (-0.3, 0.36, -0.06), (-0.52, 0.56, -0.08)], [0.085, 0.072, 0.062], rseg=12)
    p.tube([(-0.31, 0.37, -0.06), (-0.16, 0.6, -0.06)], [0.066, 0.056], rseg=12)
    # two darker bark lines
    p.paint_fn(lambda q, n: abs(q.y - 0.13) < 0.02 and n.z > 0.5 and (-0.8 < q.x < -0.35 or 0.05 < q.x < 0.55) and abs(q.z) > 0.08, tint(BROWN, -0.22))
    # the pale cut end at +x with two rings
    cut = lambda q, n: q.x > L + 0.06 and n.x > 0.6
    p.paint_fn(cut, TAN)
    p.paint_fn(lambda q, n: cut(q, n) and 0.035 < math.hypot(q.y - 0.13, q.z) < 0.055, tint(BROWN, 0.15))
    p.paint_fn(lambda q, n: cut(q, n) and 0.075 < math.hypot(q.y - 0.13, q.z) < 0.092, tint(BROWN, 0.15))
    p.layer('leaf', base=GREEN, target_faces=260, voxel=0.007)
    LB, LT = Vector((-0.12, 0.6, -0.04)), Vector((0.2, 0.86, 0.0))
    p.capsule((-0.17, 0.56, -0.06), tuple(LB.lerp(LT, 0.12)), 0.03, group='pet')
    # a flat pointed leaf (an extruded outline) facing the child
    d = (LT - LB).normalized()
    side = Vector((0, 0, 1)).cross(d).normalized()
    out = []
    N = 14
    for i in range(N + 1):
        t = i / N
        out.append((t, 0.11 * math.sin(math.pi * t) ** 0.75 * (1.0 + 0.25 * (0.5 - t))))
    poly = [LB + d * ((LT - LB).length * t) + side * w for t, w in out] + [LB + d * ((LT - LB).length * t) - side * w for t, w in reversed(out[1:-1])]
    m = len(poly)
    verts = [tuple(v + Vector((0, 0, -0.035))) for v in poly] + [tuple(v + Vector((0, 0, 0.035))) for v in poly]
    faces = [tuple(range(m)), tuple(range(2 * m - 1, m - 1, -1))] + [(i, (i + 1) % m, m + (i + 1) % m, m + i) for i in range(m)]
    p.mesh(verts, faces)
    p.paint_fn(lambda q, n: (q - LB).cross((LT - LB).normalized()).length < 0.016 and n.z > 0.3, LEAF)
    p.layer('skin')
    finish(p, 0.9, wide=True, outline=0.02)


# =================================================================== WATERING CAN
def wateringcan():
    p = Prop('prop_word_wateringcan', base=GREEN, target_faces=1300, voxel=0.013)
    R, H = 0.46, 0.66
    prof = rounded([(0.0, 0.0), (R - 0.02, 0.0), (R, 0.08), (R + 0.02, H * 0.6), (R - 0.04, H), (0.22, H + 0.12), (0.0, H + 0.14)], 0.08, n=4)
    p.lathe(prof, seg=48)
    p.cyl((0, H + 0.1, 0), 0.14, 0.07, bevel=0.03)                          # filler cap ring
    # long spout to +x, from low on the body
    p.tube([(R - 0.1, 0.18, 0), (0.75, 0.42, 0), (1.05, 0.72, 0)], [0.1, 0.075, 0.065], rseg=14)
    # big loop handle over the top and back
    p.tube(rounded([(0.22, H + 0.05, 0), (0.18, H + 0.45, 0), (-0.25, H + 0.48, 0), (-0.55, H + 0.1, 0), (-0.5, 0.3, 0)], 0.18, n=5), 0.075, rseg=12)
    p.paint_fn(lambda q, n: 0.12 < q.y < 0.2 and math.hypot(q.x, q.z) > R - 0.06, tint(GREEN, -0.18))        # a darker band
    p.layer('rose', base=YELLOW, target_faces=500, voxel=0.009)
    d = Vector((0.3, 0.3, 0)).normalized()
    RC = Vector((1.1, 0.77, 0))
    p.lathe([(0.0, -0.06), (0.06, -0.06), (0.19, 0.06), (0.19, 0.1), (0.0, 0.1)], pos=tuple(RC), rot=(0, 0, -45), seg=32)
    face_n = Vector((math.sin(math.radians(45)), math.cos(math.radians(45)), 0))
    rose_face = lambda q, n: Vector(n).dot(face_n) > 0.8 and (q - RC).dot(face_n) > 0.07
    p.paint_fn(lambda q, n: rose_face(q, n) and any((q - (RC + face_n * 0.1 + Vector(o))).length < 0.028 for o in
               [(0, 0, 0)] + [(-0.09 * math.cos(math.radians(45)) * math.cos(a), 0.09 * math.sin(math.radians(45)) * math.cos(a), 0.09 * math.sin(a)) for a in [k * math.tau / 6 for k in range(6)]]),
               tint(YELLOW, -0.3))
    p.layer('cloth_drops', base=SKY, target_faces=500, voxel=0.008)
    for k in range(5):
        a = math.radians(-50 + 25 * k)
        dirv = (face_n * 0.75 + Vector((0, -0.5, 0)) + Vector((0, 0, math.sin(a) * 0.6))).normalized()
        c = RC + face_n * 0.15 + dirv * (0.28 + 0.06 * (k % 2))
        p.blob(tuple(c), (0.055, 0.055, 0.055), group='d%d' % k)
        p.blob(tuple(c - dirv * 0.06), (0.03, 0.03, 0.03), group='d%d' % k)
    p.layer('shine', base=WHITE, target_faces=150, voxel=0.006)
    p.blob((-0.2, 0.42, 0.42), (0.05, 0.12, 0.015), rot=(0, -25, 0), group='sh')
    p.layer('skin')
    finish(p, 1.15, wide=True, outline=0.022)


# =================================================================== LADDER
def ladder():
    p = Prop('prop_word_ladder', base=RED, target_faces=1200, voxel=0.012)
    H, HW, TW = 1.9, 0.44, 0.38       # height, half width at the foot, half width at the top
    lean = 0.42                       # front frame foot sits this far forward of the top
    def rail(x0, x1, zf, zt):
        p.capsule((x0, 0.06, zf), (x1, H - 0.08, zt), 0.075)
    for s in (-1, 1):
        rail(s * HW, s * TW, lean, 0.06)         # front rails
        rail(s * HW, s * TW, -lean, -0.06)       # back rails
        p.blob((s * HW, 0.05, lean), (0.1, 0.05, 0.1), group='foot%dF' % s)
        p.blob((s * HW, 0.05, -lean), (0.1, 0.05, 0.1), group='foot%dB' % s)
    p.layer('platform', base=GREY, target_faces=300, voxel=0.01)
    p.box((0, H - 0.02, 0.0), (TW + 0.06, 0.05, 0.2), bevel=0.04)
    p.paint_fn(lambda q, n: n.y > 0.7 and abs(q.z) < 0.05, WHITE)
    p.layer('rungs', base=YELLOW, target_faces=900, voxel=0.01)
    for k in range(5):
        t = (k + 1) / 6
        y = 0.06 + (H - 0.14) * t
        z = lean + (0.06 - lean) * t
        hw = HW + (TW - HW) * t
        p.box((0, y, z + 0.02), (hw, 0.055, 0.085), bevel=0.04)
    # a small hinge spreader bar at the back
    p.layer('skin')
    p.capsule((-HW + 0.02, 0.7, -0.29), (HW - 0.02, 0.7, -0.29), 0.05, group='bar')
    finish(p, H + 0.05, outline=0.024)


# =================================================================== MOUNTAIN
def mountain():
    ROCK = mix(PURPLE, GREY, 0.55)
    p = Prop('prop_word_mountain', base=ROCK, target_faces=1300, voxel=0.014)

    def peak(cx, cz, R, Hh, seed):
        prof = rounded([(0.0, 0.0), (R, 0.0), (R * 0.82, Hh * 0.25), (R * 0.45, Hh * 0.68), (R * 0.12, Hh * 0.97), (0.0, Hh)], R * 0.18, n=5)
        p.lathe(prof, pos=(cx, 0, cz), seg=40, scale=(1.0, 0.75))
        rnd = random.Random(seed)
        ph = rnd.uniform(0, 6)
        cap = lambda q, n: q.y > Hh * 0.6 + 0.07 * math.sin(math.atan2(q.x - cx, q.z - cz) * 5 + ph) and math.hypot(q.x - cx, q.z - cz) < R * 0.9
        return cap
    cap1 = peak(-0.25, -0.05, 0.92, 1.65, 1)
    cap2 = peak(0.62, 0.06, 0.62, 1.0, 4)
    p.paint_fn(lambda q, n: (cap1(q, n) and q.x < 0.45) or (cap2(q, n) and q.x > 0.25 and q.y < 1.05), WHITE)
    # a darker rock face on the shadow side
    p.paint_fn(lambda q, n: n.x < -0.55 and q.y < 0.9, tint(ROCK, -0.15))
    p.layer('pines', base=LEAF, target_faces=600, voxel=0.009)
    for i, (x, z, h) in enumerate(((-0.75, 0.62, 0.42), (-0.48, 0.72, 0.34), (0.5, 0.58, 0.38))):
        p.lathe(rounded([(0, 0.08), (0.14, 0.12), (0.06, 0.08 + h * 0.5), (0.11, 0.08 + h * 0.5), (0.0, 0.08 + h)], 0.03, n=3), pos=(x, 0, z), seg=20)
    p.layer('trunks', base=BROWN, target_faces=150, voxel=0.008)
    for x, z in ((-0.75, 0.62), (-0.48, 0.72), (0.5, 0.58)):
        p.cyl((x, 0, z), 0.04, 0.1, bevel=0.015)
    p.layer('skin')
    finish(p, 1.65, wide=True, outline=0.024)


# =================================================================== IGLOO
def igloo():
    p = Prop('prop_word_igloo', base=WHITE, target_faces=1300, voxel=0.012)
    R = 0.85
    prof = [(R * math.sin(t), R * math.cos(t)) for t in [math.pi / 2 * i / 24 for i in range(25)]]
    prof = [(0.0, R)] + prof[1:] + [(0.0, 0.0)]
    p.lathe(prof[::-1], seg=56, scale=(1.08, 1.0))
    # three courses of blocks: sky-blue lines (rings + staggered joints)
    courses = [0.0, 0.26, 0.5, 0.7]
    def line(q, n):
        if q.y < 0.02:
            return False
        if any(abs(q.y - c) < 0.022 for c in courses[1:]):
            return True
        k = sum(1 for c in courses[1:] if q.y > c)
        nb = [9, 8, 6, 0][k]
        if nb == 0:
            return False
        a = math.atan2(q.x, q.z) + (0.5 if k % 2 else 0) * math.tau / max(nb, 1)
        f = (a / (math.tau / nb)) % 1
        r = math.hypot(q.x, q.z)
        return min(f, 1 - f) * (math.tau / nb) * max(r, 0.2) < 0.022
    p.paint_fn(line, SKY)
    # the tunnel: an arched entrance sticking out at the front
    p.layer('tunnel', base=WHITE, target_faces=450, voxel=0.011)
    TR, Z0, Z1 = 0.36, 0.45, 1.12
    prof_t = [(TR * math.cos(t), TR * math.sin(t)) for t in [math.pi * i / 16 for i in range(17)]]
    verts, faces = [], []
    for z in (Z0, Z1):
        for x, y in prof_t:
            verts.append((x, y, z))
    n = len(prof_t)
    for i in range(n - 1):
        faces.append((i, i + 1, n + i + 1, n + i))
    faces.append(tuple(range(n)))
    faces.append(tuple(range(2 * n - 1, n - 1, -1)))
    faces.append((n - 1, 0, n, 2 * n - 1))
    p.mesh(verts, faces, bevel=0)
    p.paint_fn(lambda q, n: abs(q.z - 0.82) < 0.014 and q.y > 0.02, SKY)
    p.layer('door', base=mix(INK, BLUE, 0.35), target_faces=200, voxel=0.008)
    prof_d = [(0.24 * math.cos(t), 0.26 * math.sin(t)) for t in [math.pi * i / 14 for i in range(15)]]
    verts = [(x, y, Z1 - 0.02) for x, y in prof_d] + [(x, y, Z1 + 0.035) for x, y in prof_d]
    m = len(prof_d)
    faces = [tuple(range(m)), tuple(range(2 * m - 1, m - 1, -1)), (m - 1, 0, m, 2 * m - 1)] + [(i, i + 1, m + i + 1, m + i) for i in range(m - 1)]
    p.mesh(verts, faces)
    # a small snow drift at the side
    p.layer('drift', base=WHITE, target_faces=300, voxel=0.011)
    p.blob((0.86, 0.12, 0.42), (0.3, 0.12, 0.22), group='d')
    p.blob((1.02, 0.08, 0.6), (0.16, 0.07, 0.13), group='d')
    p.layer('skin')
    finish(p, 0.85, wide=True, outline=0.024)


# =================================================================== ZOO
def zoo():
    p = Prop('prop_word_zoo', base=ORANGE, target_faces=1200, voxel=0.013)
    PX, PH = 0.56, 1.5
    # two fat striped posts (orange / white bands), yellow ball caps
    for s in (-1, 1):
        p.cyl((s * PX, 0, 0), 0.13, PH, bevel=0.05)
        p.blob((s * PX, PH + 0.08, 0), (0.15, 0.13, 0.15), group='cap%d' % s)
    p.paint_fn(lambda q, n: int(q.y / 0.25) % 2 == 1 and q.y < PH - 0.02, WHITE)
    p.paint_fn(lambda q, n: q.y > PH, YELLOW)

    def ys(x):
        return PH - 0.1 + 0.24 * math.cos(x / PX * math.pi / 2)
    # the curved green arch sign between the posts
    p.layer('sign', base=GREEN, target_faces=800, voxel=0.011)
    for i in range(17):
        x = -PX + 2 * PX * i / 16
        p.box((x, ys(x), 0), (0.06, 0.2, 0.07), bevel=0.035)
    # the letters Z O O in fat white tubes on the sign
    p.layer('letters', base=WHITE, target_faces=700, voxel=0.008)
    LZ = 0.1
    zx = -0.32
    zy = ys(zx) - 0.02
    zp = [(zx - 0.08, zy + 0.1, LZ), (zx + 0.08, zy + 0.1, LZ), (zx - 0.08, zy - 0.1, LZ), (zx + 0.08, zy - 0.1, LZ)]
    for k in range(3):
        p.capsule(zp[k], zp[k + 1], 0.034, group='z%d' % k)
    for ox in (0.0, 0.32):
        p.ring((ox, ys(ox) - 0.02, LZ), 0.085, 0.034, rot=(90, 0, 0), scale=(0.8, 1.2), seg=24, rseg=8)
    # low wooden fences each side
    p.layer('fence', base=WOOD, target_faces=700, voxel=0.011)
    for s in (-1, 1):
        for k in range(2):
            x = s * (PX + 0.2 + 0.26 * k)
            p.box((x, 0.3, 0.05), (0.06, 0.3, 0.045), bevel=0.035)
            p.blob((x, 0.6, 0.05), (0.065, 0.05, 0.045), group='pk%d%d' % (s, k))
        for y in (0.2, 0.44):
            p.box((s * (PX + 0.33), y, 0.11), (0.24, 0.05, 0.03), bevel=0.025)
    p.paint_fn(lambda q, n: n.z > 0.7 and q.z > 0.12 and any(abs(q.y - yy) < 0.012 for yy in (0.2, 0.44)), tint(WOOD, -0.2))
    # giraffe head and neck peeking over the left fence
    p.layer('giraffe', base=YELLOW, target_faces=900, voxel=0.011)
    gx = -(PX + 0.5)
    p.capsule((gx + 0.04, 0.2, -0.1), (gx, 1.12, -0.06), 0.12, r2=0.1, group='gneck')
    HC = Vector((gx - 0.04, 1.3, 0.02))
    p.blob(tuple(HC), (0.2, 0.18, 0.19), group='ghead')
    p.blob(tuple(HC + Vector((0.05, -0.08, 0.14))), (0.13, 0.1, 0.12), group='ghead')
    for s in (-1, 1):
        p.capsule(tuple(HC + Vector((s * 0.08, 0.12, -0.05))), tuple(HC + Vector((s * 0.1, 0.3, -0.07))), 0.03, group='horn%d' % s)
        p.blob(tuple(HC + Vector((s * 0.1, 0.31, -0.07))), (0.05, 0.05, 0.05), group='horn%d' % s)
        p.blob(tuple(HC + Vector((s * 0.23, 0.08, -0.06))), (0.1, 0.04, 0.045), rot=(0, 0, s * -25), group='gear%d' % s)
    PATCH = mix(ORANGE, BROWN, 0.5)
    for i, (dx, y, dz) in enumerate([(0.05, 0.42, 0.1), (-0.05, 0.62, 0.11), (0.06, 0.84, 0.1), (-0.04, 1.02, 0.09)]):
        p.paint('sp%d' % i, (gx + dx, y, -0.1 + dz), (0.075, 0.075, 0.09), PATCH)
    p.paint_group(['horn-1', 'horn1'], PATCH, only=lambda q: q.y > HC.y + 0.27)
    p.paint_group('ghead', tint(YELLOW, 0.45), only=lambda q: q.z > HC.z + 0.2 and q.y < HC.y - 0.04)
    # monkey tail hanging from the right end of the sign, curling at the tip
    p.layer('tail', base=BROWN, target_faces=500, voxel=0.01)
    tx = PX - 0.24
    ty = ys(tx) - 0.1
    tpts = [(tx, ty - 0.1, 0.02), (tx + 0.02, ty - 0.4, 0.04), (tx - 0.03, ty - 0.62, 0.06), (tx - 0.12, ty - 0.74, 0.07), (tx - 0.2, ty - 0.66, 0.07), (tx - 0.13, ty - 0.58, 0.07)]
    p.tube(rounded(tpts, 0.07, n=4), 0.048, rseg=10)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, PH, 0))
    p.bone('head', tuple(HC - Vector((0, 0.18, 0))), tuple(HC + Vector((0, 0.4, 0))), parent='body', region=lambda q: (q - HC).length < 0.45 and q.y > HC.y - 0.2 and q.x < -PX - 0.05)
    p.chain('tail', [tpts[0], tpts[1], tpts[2], tpts[4]], 'body', region=lambda q: tx - 0.28 < q.x < tx + 0.1 and q.y < ty - 0.08 and q.y > 0.5 and abs(q.x) < PX - 0.1)
    p.neck = (99, 99)
    p.face(center=tuple(HC + Vector((0.0, 0.02, 0.0))), radius=0.18, faceScale=1.0, mouthZ=0.08, mouthY=-0.02)
    finish(p, PH + 0.2, wide=True, outline=0.022, body=False)


# =================================================================== WORD-CARD VARIANTS OF REUSED OUTSIDE MODELS
def slab(p, poly, z0, z1, at=(0, 0, 0)):
    """extrude a 2D outline (x, y) along z"""
    m = len(poly)
    verts = [(x + at[0], y + at[1], z0 + at[2]) for x, y in poly] + [(x + at[0], y + at[1], z1 + at[2]) for x, y in poly]
    faces = [tuple(range(m)), tuple(range(2 * m - 1, m - 1, -1))] + [(i, (i + 1) % m, m + (i + 1) % m, m + i) for i in range(m)]
    p.mesh(verts, faces)


def star():
    p = Prop('prop_word_star', base=YELLOW, target_faces=1400, voxel=0.014, smooth=4)
    R = 1.0
    sp = star_poly(R, inner=0.5, n=5, rot=90, soft=3)
    cy = R * math.cos(math.radians(36)) + 0.02          # bottom two points rest on the floor
    slab(p, sp, -0.2, 0.2, at=(0, cy, 0))
    p.blob((0, cy, 0), (0.48, 0.48, 0.3), group='puff')  # puffy middle
    p.paint_fn(lambda q, n: n.z < -0.5, tint(YELLOW, -0.12))
    ground(p, dy=-0.07)
    finish(p, cy + R, wide=True, outline=0.026)


def cloud():
    p = Prop('prop_word_cloud', base=WHITE, target_faces=1600, voxel=0.02, smooth=4)
    p.blob((0, 0.38, 0.0), (1.3, 0.36, 0.55), group='belly')
    for i, (x, y, r) in enumerate(((-0.95, 0.5, 0.42), (-0.42, 0.85, 0.58), (0.22, 1.0, 0.66), (0.8, 0.72, 0.5), (1.15, 0.45, 0.34))):
        p.blob((x, y, 0.0), (r, r, r * 0.85), group='puff%d' % i)
    p.paint_fn(lambda q, n: q.y < 0.24 and n.y < 0.0, tint(SKY, 0.45))
    p.layer('skin')
    finish(p, 1.66, wide=True, outline=0.026)


def flower():
    rebake('prop_bloom.py', 'prop_bloom_daisy', 'prop_word_flower')


def umbrella():
    rebake('prop_umbrella.py', 'prop_umbrella', 'prop_word_umbrella', tints={'skin': RED})


def palm():
    rebake('prop_palm.py', 'prop_palm', 'prop_word_palm', tints={'fronds': GREEN})


def shop():
    WALL, ROOF = tint(ROSE, 0.35), BLUE
    p = Prop('prop_word_shop', base=WALL, target_faces=900, voxel=0.014)
    W, H, D = 0.9, 1.25, 0.45
    p.box((0, H / 2, 0), (W, H / 2, D), bevel=0.06)
    p.box((0, 0.05, 0.08), (W + 0.06, 0.05, D + 0.06), bevel=0.03)          # step / plinth
    p.paint_fn(lambda q, n: q.y < 0.1, GREY)
    # sign board on the roof
    p.layer('sign', base=YELLOW, target_faces=400, voxel=0.012)
    p.box((0, H + 0.24, 0.12), (W * 0.82, 0.2, 0.08), bevel=0.06)
    p.layer('roof', base=ROOF, target_faces=300, voxel=0.012)
    p.box((0, H + 0.02, 0.0), (W + 0.08, 0.06, D + 0.08), bevel=0.04)
    # striped awning over the window and door: red / white stripes and a scalloped hem
    p.layer('awning', base=RED, target_faces=900, voxel=0.011)
    AW, AY = W + 0.04, H - 0.18
    verts, faces = [], []
    N = 24
    for i in range(N + 1):
        x = -AW + 2 * AW * i / N
        for y, z in ((AY, D), (AY - 0.32, D + 0.36)):
            verts.append((x, y, z))
    for i in range(N):
        a, b = 2 * i, 2 * i + 2
        faces.append((a, b, b + 1, a + 1))
    top = [v for v in verts]
    vs = [tuple(v) for v in verts] + [(v[0], v[1] - 0.05, v[2] - 0.03) for v in verts]
    off = len(verts)
    fs = faces + [(off + f[3], off + f[2], off + f[1], off + f[0]) for f in faces]
    for i in range(N):
        a, b = 2 * i + 1, 2 * i + 3
        fs.append((a, b, off + b, off + a))
        a, b = 2 * i, 2 * i + 2
        fs.append((b, a, off + a, off + b))
    fs.append((0, 1, off + 1, off)); fs.append((2 * N + 1, 2 * N, off + 2 * N, off + 2 * N + 1))
    p.mesh(vs, fs)
    for k in range(8):
        x = -AW + AW * (2 * k + 1) / 8
        p.blob((x, AY - 0.36, D + 0.37), (AW / 8, 0.07, 0.035), group='sc%d' % k)
    p.paint_fn(lambda q, n: int((q.x + AW) / (AW / 4)) % 2 == 1, WHITE)
    # big shop window with goods, and a door
    p.layer('glass', base=SKY, target_faces=200, voxel=0.01)
    p.box((-0.34, 0.6, D + 0.01), (0.4, 0.3, 0.03), bevel=0.03)
    p.layer('frame', base=WHITE, target_faces=500, voxel=0.01)
    p.ring((-0.34, 0.6, D + 0.03), 1.0, 0.035, rot=(90, 0, 0), scale=(0.42, 0.32), seg=40, rseg=8)
    p.box((-0.34, 0.27, D + 0.06), (0.44, 0.04, 0.06), bevel=0.02)           # sill
    p.layer('goods', base=RED, target_faces=500, voxel=0.009)
    for k, (x, c) in enumerate(((-0.58, RED), (-0.42, YELLOW), (-0.26, GREEN), (-0.1, ORANGE))):
        p.blob((x, 0.38, D + 0.06), (0.07, 0.07, 0.05), group='g%d' % k)
        p.paint('gc%d' % k, (x, 0.38, D + 0.06), (0.09, 0.09, 0.09), c)
    p.layer('door', base=BLUE, target_faces=300, voxel=0.01)
    p.box((0.5, 0.42, D + 0.02), (0.2, 0.33, 0.035), bevel=0.04)
    p.layer('knob', base=YELLOW, target_faces=80, voxel=0.006)
    p.blob((0.38, 0.42, D + 0.07), (0.035, 0.035, 0.03), group='k')
    p.layer('shine', base=WHITE, target_faces=100, voxel=0.006)
    p.blob((-0.5, 0.72, D + 0.05), (0.025, 0.1, 0.01), rot=(0, 0, -25), group='s')
    p.layer('skin')
    finish(p, H + 0.45, outline=0.022)


def bridge():
    STONE = GREY
    p = Prop('prop_word_bridge', base=STONE, target_faces=2000, voxel=0.012)
    # a humpback stone bridge (side view along x) over a little blue stream
    L, T, Z = 1.1, 0.24, 0.42                  # half span, deck thickness, half width
    top = [(x, 0.62 * math.cos(x / L * math.pi / 2) ** 0.8 + 0.18) for x in [-L + 2 * L * i / 24 for i in range(25)]]
    hole = [(0.48 * math.cos(math.pi * i / 20), 0.42 * math.sin(math.pi * i / 20)) for i in range(21)]
    # outline: top edge left to right, down to the right foot, under-arch right to left, left foot
    outline = [(x, y + T) for x, y in top] + [(L, 0.0)] + [(x, y) for x, y in hole] + [(-L, 0.0)]
    outline = [(x, max(0.0, y)) for x, y in outline]
    slab(p, outline, -Z, Z)
    # stone block lines on the faces
    p.paint_fn(lambda q, n: abs(n.z) > 0.7 and (abs(((q.y + 0.02) % 0.22) - 0.11) > 0.088 or abs(((q.x + (0.16 if int((q.y + 0.02) / 0.22) % 2 else 0)) % 0.32) - 0.16) > 0.138), SLATE)
    p.paint_fn(lambda q, n: n.y > 0.6, tint(STONE, 0.3))
    # wooden railings on both sides
    p.layer('rails', base=WOOD, target_faces=900, voxel=0.011)
    for s in (-1, 1):
        zz = s * (Z - 0.06)
        posts = [top[i] for i in (2, 7, 12, 17, 22)]
        for x, y in posts:
            p.capsule((x, y + T, zz), (x, y + T + 0.3, zz), 0.055, group='post%d%.2f' % (s, x))
        rail = [(x, y + T + 0.3, zz) for x, y in top[2:23]]
        p.tube(rail, 0.045, rseg=8)
    p.layer('water', base=BLUE, target_faces=400, voxel=0.012)
    p.box((0, 0.025, 0.0), (0.42, 0.025, 0.9), bevel=0.02)
    p.paint_fn(lambda q, n: n.y > 0.5 and abs(((q.z * 4) % 1) - 0.5) < 0.08 and abs(q.x) < 0.3, SKY)
    p.layer('skin')
    finish(p, 1.4, wide=True, outline=0.024)


def tile(p, R, sx, sz, tilt, h=0.12):
    """a rounded oval ground tile (for flat things: puddle, mud), tipped toward the child by `tilt` degrees so the
    flat face reads at card height; returns a function mapping tile-space (x, y, z) to model space"""
    t = math.radians(tilt)
    lift = R * sz * math.sin(t) + h

    def tp(x, y, z):
        return (x, y * math.cos(t) - z * math.sin(t) + lift, y * math.sin(t) + z * math.cos(t))
    return tp


def puddle():
    p = Prop('prop_word_puddle', base=tint(GREEN, 0.1), target_faces=900, voxel=0.013)
    TL = 50
    tp = tile(p, 1.0, 1.0, 0.7, TL)
    # a grassy oval turf, the puddle sunk into it, two ripple rings and a glint
    for i in range(10):
        a = math.tau * i / 10
        p.blob(tp(0.95 * math.cos(a), -0.02, 0.62 * math.sin(a)), (0.32, 0.12, 0.26), rot=(TL, 0, 0), group='turf')
    p.blob(tp(0, -0.04, 0), (1.0, 0.1, 0.66), rot=(TL, 0, 0), group='turf')
    p.paint_fn(lambda q, n: n.y < -0.3 or n.z < -0.4, tint(BROWN, 0.15))
    p.layer('water', base=BLUE, target_faces=500, voxel=0.011)
    pts = [(0.8 * math.cos(a) * (1 + 0.08 * math.sin(3 * a)), 0.5 * math.sin(a) * (1 + 0.1 * math.cos(2 * a))) for a in [math.tau * i / 40 for i in range(40)]]
    m = len(pts)
    verts = [tp(x, 0.04, z) for x, z in pts] + [tp(x, 0.13, z) for x, z in pts]
    faces = [tuple(range(m)), tuple(range(2 * m - 1, m - 1, -1))] + [(i, (i + 1) % m, m + (i + 1) % m, m + i) for i in range(m)]
    p.mesh(verts, faces)
    p.layer('ripples', base=tint(SKY, 0.3), target_faces=400, voxel=0.008)
    for rr in (0.17, 0.33):
        ring = [tp(0.1 + rr * 1.3 * math.cos(a), 0.14, 0.02 + rr * 0.8 * math.sin(a)) for a in [math.tau * i / 30 for i in range(30)]]
        p.tube(ring, 0.022, closed=True, rseg=6)
    p.layer('shine', base=WHITE, target_faces=100, voxel=0.006)
    p.blob(tp(-0.45, 0.14, -0.15), (0.14, 0.015, 0.04), rot=(TL, 20, 0), group='s')
    p.layer('skin')
    ground(p)
    finish(p, 1.2, wide=True, outline=0.022)


def mud():
    MUD, MUD_D, MUD_L = BROWN, tint(BROWN, -0.3), tint(BROWN, 0.25)
    p = Prop('prop_word_mud', base=tint(GREEN, 0.1), target_faces=900, voxel=0.013)
    TL = 45
    tp = tile(p, 1.0, 1.0, 0.7, TL)
    for i in range(10):
        a = math.tau * i / 10
        p.blob(tp(0.95 * math.cos(a), -0.02, 0.62 * math.sin(a)), (0.32, 0.12, 0.26), rot=(TL, 0, 0), group='turf')
    p.blob(tp(0, -0.04, 0), (1.0, 0.1, 0.66), rot=(TL, 0, 0), group='turf')
    p.paint_fn(lambda q, n: n.y < -0.3 or n.z < -0.4, tint(BROWN, 0.15))
    # a gloopy splat of mud with lumps, splats round the edge and big round bubbles
    p.layer('mud', base=MUD, target_faces=1100, voxel=0.011)
    rnd = random.Random(11)
    p.blob(tp(0, 0.08, 0), (0.75, 0.08, 0.46), rot=(TL, 0, 0), group='m')
    for i in range(9):
        a = math.tau * i / 9 + rnd.uniform(-0.2, 0.2)
        r = rnd.uniform(0.62, 0.8)
        p.blob(tp(r * math.cos(a), 0.08, 0.62 * r * math.sin(a)), (0.17, 0.08, 0.14), rot=(TL, 0, 0), group='m')
    for i, (x, z, r) in enumerate(((-0.25, 0.05, 0.16), (0.2, -0.12, 0.2), (0.35, 0.2, 0.12), (-0.05, -0.25, 0.1))):
        p.blob(tp(x, 0.13, z), (r, r * 0.42, r), rot=(TL, 0, 0), group='lump%d' % i)
    p.layer('bubbles', base=MUD_L, target_faces=400, voxel=0.008)
    for i, (x, z, r) in enumerate(((-0.45, -0.18, 0.08), (0.55, -0.05, 0.065), (0.0, 0.28, 0.07))):
        p.blob(tp(x, 0.17, z), (r, r, r), rot=(TL, 0, 0), group='b%d' % i)
    p.layer('skin')
    finish(p, 1.2, wide=True, outline=0.022)


def island():
    p = Prop('prop_word_island', base=BLUE, target_faces=800, voxel=0.014)
    # blue water disc
    p.cyl((0, 0, 0), 1.05, 0.16, bevel=0.06, scale=(1.0, 0.8))
    p.layer('foam', base=WHITE, target_faces=500, voxel=0.01)
    p.ring((0, 0.16, 0), 0.66, 0.045, scale=(1.0, 0.8), seg=48, rseg=8)
    p.layer('sand', base=tint(YELLOW, 0.35), target_faces=600, voxel=0.013)
    p.blob((0, 0.2, 0), (0.62, 0.22, 0.48), group='s')
    p.blob((0.2, 0.3, -0.05), (0.38, 0.2, 0.3), group='s')
    # palm: a curved ringed trunk, six arching fronds, three coconuts
    p.layer('trunk', base=WOOD, target_faces=500, voxel=0.011)
    tr = [(0.1, 0.35, -0.05), (0.16, 0.75, -0.05), (0.08, 1.15, -0.05), (-0.08, 1.48, -0.04)]
    trp = rounded(tr, 0.2, n=4)
    p.tube(trp, [0.115 - 0.045 * i / (len(trp) - 1) for i in range(len(trp))], rseg=12)
    p.paint_fn(lambda q, n: abs(((q.y - 0.35) % 0.16) - 0.08) > 0.065, tint(WOOD, -0.2))
    TOP = Vector((-0.08, 1.5, -0.04))
    p.layer('fronds', base=GREEN, target_faces=1100, voxel=0.01)
    for k in range(6):
        a = math.tau * k / 6 + 0.3
        d = Vector((math.cos(a), 0, math.sin(a) * 0.8))
        pts = [TOP, TOP + d * 0.3 + Vector((0, 0.16, 0)), TOP + d * 0.6 + Vector((0, 0.1, 0)), TOP + d * 0.82 + Vector((0, -0.12, 0))]
        for i in range(8):
            t = (i + 0.5) / 8
            # quadratic through the points
            seg = min(2, int(t * 3)); u = t * 3 - seg
            c = pts[seg].lerp(pts[seg + 1], u)
            w = 0.13 * math.sin(math.pi * min(1, t * 1.1)) ** 0.6 + 0.02
            nxt = pts[min(3, seg + 1)] - pts[seg]
            p.blob(tuple(c), (w, 0.03, 0.07), rot=frame_euler(nxt, (0, 1, 0)), group='f%d' % k)
    p.paint_fn(lambda q, n: n.y < -0.3, LEAF)
    p.layer('nuts', base=BROWN, target_faces=300, voxel=0.009)
    for k in range(3):
        a = math.tau * k / 3 + 0.5
        p.blob(tuple(TOP + Vector((0.09 * math.cos(a), -0.08, 0.09 * math.sin(a)))), (0.075, 0.075, 0.075), group='n%d' % k)
    p.layer('skin')
    ground(p)
    finish(p, 1.75, wide=True, outline=0.022)


MODELS = dict(prop_word_grass=grass, prop_word_stick=stick, prop_word_wateringcan=wateringcan, prop_word_ladder=ladder,
              prop_word_mountain=mountain, prop_word_igloo=igloo, prop_word_zoo=zoo,
              prop_word_star=star, prop_word_cloud=cloud, prop_word_flower=flower, prop_word_umbrella=umbrella,
              prop_word_palm=palm, prop_word_shop=shop, prop_word_bridge=bridge, prop_word_puddle=puddle, prop_word_mud=mud,
              prop_word_island=island)
for name, fn in MODELS.items():
    if not ONLY or name in ONLY:
        fn()
