"""Vocabulary batch 6: my body, and getting clean (docs/design/VOCAB.md, words 151-180). One script, several models
(ONLY=prop_word_hand,prop_word_foot tools/blender/build.sh prop_words_body builds a subset). Every model stands on
y = 0, centred on x and z, facing +z, and fills the 2.0 word card (extras fit / wide, see VOCAB.md). Body parts use the people's
skin tones (hand d9a273, foot f6cfa6, mouth 9c6b4a) and stay soft and mitten-like: no knuckles, no wrinkles.

  prop_word_mouth    a big friendly smiling mouth on a soft skin-tone cushion (no eyes): fat ROSE lips round a deep
                     plum mouth, six rounded WHITE top teeth, a PINK tongue. Bones: jaw (rotation.x + opens: the lower
                     lip drops), tongue (child of jaw; rotation.x - pokes it out and up). Layers: lips, inside, teeth,
                     tongue. Words: Mouth, Teeth, Tongue.
  prop_word_hand     a big open child's hand, palm forward, fingers up and spread, coming out of a knitted SKY cuff:
                     mitten-soft palm with a ROSE pad, five short fat fingers, faint nails on the back.
                     Bones: finger.1 (thumb), finger.2 (index) .. finger.5 (little); rotation.x + curls a finger toward
                     the palm. body waves the whole hand from the cuff. Words: Hand, Finger.
  prop_word_foot     one bare child's foot lying flat, toes toward the camera, from a rolled BLUE trouser hem: round
                     heel and sole, five toes from a big round big toe (at -x) down to a tiny little toe, faint nails.
                     Bones: toes.1 (big toe) .. toes.5 (little toe); rotation.x + curls a toe down. Words: Foot, Toes.
  prop_word_comb     a wide chunky PURPLE comb standing on its 9 fat rounded teeth, a thumb-grip dip in the spine.
  prop_word_potty    a one-piece toddler potty: GREEN, a WHITE inner bowl, a high back rest with a YELLOW star sticker,
                     a raised front splash guard and a wide flat foot.
  prop_word_bubbles  a YELLOW bubble wand standing in a small PINK tub of bubble mix, five SKY bubbles (WHITE glint,
                     PINK rim) floating up and out of the ring. Bones: bubble.1 (biggest) .. bubble.5, each drifts.
  prop_word_plaster  one big sticking plaster standing on its edge in a gentle arch toward the camera: TAN strip with
                     round ends, a raised CREAM pad with a RED heart sticker, air-hole dots on each end.
  word-card variants of reused models (colour baked, base on y = 0; the originals are untouched):
  prop_word_towel    a SKY terry towel folded over a little WOOD towel stand, two WHITE bands near the hem.
  prop_word_soap     a PINK soap bar tipped up on WHITE suds so its pressed heart shows, two SKY bubbles above.
"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded, star_poly, circle_poly
from skit import SProp

ONLY = [s for s in os.environ.get('ONLY', '').split(',') if s]
TAU = math.tau
# VOCAB.md palette
RED, ORANGE, YELLOW, GREEN, LEAF, BLUE, SKY = 0xff4f4f, 0xff9a2e, 0xffd23a, 0x4cc75a, 0x2f8a3a, 0x3f8cff, 0x8fd3ff
PURPLE, PINK, ROSE, CREAM, WHITE, BROWN, WOOD = 0x9b6dff, 0xff7fbf, 0xff9ec4, 0xf2e8d8, 0xfffaf0, 0xb07a4a, 0xd8924f
TAN, GREY, SLATE, INK = 0xf3d9ae, 0xb9c0c9, 0x6f7a8c, 0x3a2838
SKIN_L, SKIN_M, SKIN_D = 0xf6cfa6, 0xd9a273, 0x9c6b4a


class WProp(SProp):
    """SProp (bevelled prisms / meshes) that always voxel-remeshes every layer into one soft skin."""
    def __init__(self, kind, quad=False, **kw):
        super().__init__(kind, hard=False, **kw)
        self.quadriflow = quad
        self.layers['skin']['remesh'] = True
        self.layers['skin']['quadriflow'] = quad

    def _skin(self):
        """after the remesh, decimate again if the layer still has more triangles than its target (a voxel skin under
        the face target is never decimated, but it triangulates to twice its quad count)"""
        import bpy
        L = self.layers[self._cur]
        if L.get('clean'):
            # hard-surface layer built only from bevelled prims: no voxel remesh (crisp flat faces and edges), but
            # every edge smooth so the ink outline (pushed along the normals) never cracks at a corner
            L['remesh'] = False
            skin = super()._skin()
            for e in skin.data.edges:
                e.use_edge_sharp = False
            for f in skin.data.polygons:
                f.use_smooth = True
            return skin
        skin = super()._skin()
        tf = L.get('target_faces') or (self.target_faces if self._cur == 'skin' else 1500)
        tris = sum(len(f.vertices) - 2 for f in skin.data.polygons)
        if tris > tf * 1.1:
            bpy.context.view_layer.objects.active = skin
            d = skin.modifiers.new('dec2', 'DECIMATE')
            d.ratio = tf / tris
            bpy.ops.object.modifier_apply(modifier='dec2')
        return skin

    def layer(self, name, base=0xffffff, voxel=None, target_faces=None, clean=False):
        existed = name in self.layers
        r = super().layer(name, base=base, voxel=voxel, target_faces=target_faces)
        if existed and not clean:
            return r          # switching back to a layer keeps its settings
        self.layers[name]['remesh'] = not clean
        self.layers[name]['clean'] = clean
        if clean:
            self.layers[name]['psegs'] = 1
        self.layers[name]['quadriflow'] = self.quadriflow
        return r


def finish(p, size, top=None, outline=None):
    """size = natural (w, h, d). Sets the word-card fit (fills a 2.0 box) and an ink outline that is about 0.024
    once the card scales it."""
    w, h, d = size
    k = min(2.0 / h, 2.0 / w, 2.0 / d)
    p.layer('skin')
    if not any(b[0] == 'body' for b in p.bones):
        p.bone('body', (0, 0, 0), (0, top or h, 0))
    p.extras['fit'] = 2.0
    if w > h:
        p.extras['wide'] = 2.0
    p.extras['outline'] = outline or round(max(0.012, min(0.034, 0.024 / k)), 4)
    p.build()


def heart_poly(r, n=40):
    pts = []
    for i in range(n):
        t = i / n * TAU
        x = 16 * math.sin(t) ** 3
        y = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
        pts.append((x / 17 * r, y / 17 * r + 0.1 * r))
    return pts


def slab(p, poly, z0, z1, at=(0, 0, 0), tilt=0.0):
    """extrude a 2D (x, y) outline along z, then tilt it back about x by `tilt` degrees, then move it to `at`."""
    n = len(poly)
    ca, sa = math.cos(math.radians(tilt)), math.sin(math.radians(tilt))
    verts = []
    for z in (z0, z1):
        for x, y in poly:
            yy, zz = y * ca - z * sa, y * sa + z * ca
            verts.append((x + at[0], yy + at[1], zz + at[2]))
    faces = [tuple(range(n - 1, -1, -1)), tuple(range(n, 2 * n))] + [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)]
    p.mesh(verts, faces)


def seg_dist(q, a, b):
    ax, ay, az = a; bx, by, bz = b
    abx, aby, abz = bx - ax, by - ay, bz - az
    t = ((q.x - ax) * abx + (q.y - ay) * aby + (q.z - az) * abz) / max(1e-9, abx * abx + aby * aby + abz * abz)
    t = max(0.0, min(1.0, t))
    return math.sqrt((q.x - ax - t * abx) ** 2 + (q.y - ay - t * aby) ** 2 + (q.z - az - t * abz) ** 2), t


# ------------------------------------------------------------------ mouth
def mouth():
    p = Prop('prop_word_mouth', base=SKIN_D, target_faces=1100, voxel=0.02)
    W, H, D = 1.05, 0.86, 0.4           # cushion half sizes
    p.box((0, H, 0), (W, H, D), bevel=0.38)
    # the cushion is puffier in the middle (a soft pillow, not a brick)
    p.blob((0, H, 0.0), (W - 0.1, H - 0.1, D + 0.06), group='puff')
    ZF = D + 0.05
    # mouth outline: corners up, a gentle top edge, a deep round U below
    CX, CY = 0.74, 1.16
    def y_top(x):
        u = x / CX
        return CY - 0.13 * (1 - u * u) + 0.035 * math.exp(-((abs(x) - 0.22) / 0.12) ** 2)   # cupid's bow bumps
    def y_bot(x):
        u = min(1.0, abs(x) / CX)
        return CY - 0.64 * math.sqrt(max(0.0, 1 - u ** 2.2))
    N = 28
    lower = [(-CX + 2 * CX * i / N, y_bot(-CX + 2 * CX * i / N)) for i in range(N + 1)]
    upper = [(CX - 2 * CX * i / N, y_top(CX - 2 * CX * i / N)) for i in range(1, N)]
    loop = lower + upper
    nlow = len(lower)
    # the dark inside (its own layer), reaching a little below the lower lip so an open jaw shows more mouth
    p.layer('inside', base=0x8e2f4c, target_faces=400, voxel=0.012)
    inner = [(x * 0.97, (y - 0.12) if (k < nlow and 2 < k < nlow - 3) else y - 0.01) for k, (x, y) in enumerate(loop)]
    slab(p, inner, ZF - 0.06, ZF + 0.03)
    # the lips: one fat ROSE roll round the outline, fullest in the middle of the lower lip
    p.layer('lips', base=ROSE, target_faces=850, voxel=0.012)
    pts, rad = [], []
    for k, (x, y) in enumerate(loop):
        u = abs(x) / CX
        r = (0.125 - 0.06 * u ** 2) if k < nlow else (0.092 - 0.03 * u ** 2)
        pts.append((x, y, ZF + 0.07 - 0.05 * u ** 2))
        rad.append(r)
    p.tube(pts, rad, closed=True, rseg=12)
    p.blob((-CX - 0.01, CY + 0.01, ZF + 0.02), (0.075, 0.075, 0.07), group='cornerL')
    p.blob((CX + 0.01, CY + 0.01, ZF + 0.02), (0.075, 0.075, 0.07), group='cornerR')
    # a hard-edged shine band on the lower lip
    p.paint_fn(lambda q, n: q.y < CY - 0.4 and n.y > 0.45 and n.z > 0.3 and abs(q.x) < 0.36, 0xffc2db)
    # six big rounded top teeth hanging from the upper lip
    p.layer('teeth', base=WHITE, target_faces=500, voxel=0.01)
    for i in range(6):
        x = (i - 2.5) * 0.17
        yt = y_top(x) - 0.06
        p.box((x, yt - 0.08, ZF + 0.04), (0.077, 0.098, 0.05), bevel=0.05)
    # the tongue resting in the bottom of the U, with a soft centre groove
    p.layer('tongue', base=PINK, target_faces=400, voxel=0.01)
    TY = CY - 0.56
    p.blob((0, TY, ZF + 0.02), (0.36, 0.15, 0.1), group='tg')
    p.blob((0, TY + 0.07, ZF - 0.02), (0.3, 0.1, 0.08), group='tg')
    p.paint_fn(lambda q, n: abs(q.x) < 0.022 and q.y > TY - 0.08 and n.z > 0.5, 0xe0609f)
    p.layer('skin')
    # rig: body = cushion + upper lip + teeth; jaw = lower lip; tongue (child of jaw)
    def in_tongue(q):
        return ((q.x / 0.42) ** 2 + ((q.y - TY - 0.02) / 0.22) ** 2) < 1 and q.z > ZF - 0.07 and q.y < TY + 0.18
    def in_jaw(q):
        return q.z > ZF + 0.035 and q.y < y_top(max(-CX, min(CX, q.x))) - 0.36 and abs(q.x) < CX + 0.05 and not in_tongue(q)
    p.bone('body', (0, 0, 0), (0, 2 * H, 0), region=lambda q: not in_jaw(q) and not in_tongue(q))
    p.bone('jaw', (0, CY, -0.3), (0, CY - 0.6, ZF + 0.2), parent='body', region=in_jaw)
    p.bone('tongue', (0, TY - 0.05, ZF - 0.1), (0, TY + 0.02, ZF + 0.35), parent='jaw', region=in_tongue)
    p.anchor('teeth', (0, CY - 0.12, ZF + 0.1), 'body')
    p.anchor('tongue', (0, TY, ZF + 0.12), 'tongue')
    finish(p, (2 * W, 2 * H, 2 * D + 0.2))


# ------------------------------------------------------------------ hand
def hand():
    p = Prop('prop_word_hand', base=SKIN_M, target_faces=2400, voxel=0.016)
    p.quadriflow = False
    # palm: a soft mitten pad, a heel, the wrist rising out of the cuff
    p.blob((0, 0.92, 0), (0.43, 0.42, 0.19), group='palm')
    p.blob((0, 1.1, -0.01), (0.4, 0.22, 0.17), group='palm')
    p.blob((0.04, 0.66, 0), (0.36, 0.26, 0.18), group='palm')
    p.capsule((0, 0.28, 0), (0, 0.58, 0), 0.24, r2=0.28, group='palm')
    # fingers: knuckle base -> tip, fat round tips, each its own group so they stay plump and separate
    F = [  # (name, base, tip, r)
        ('finger.1', (0.34, 0.8, 0.03), (0.62, 1.2, 0.1), 0.118),        # thumb, out to +x
        ('finger.2', (0.27, 1.16, 0.0), (0.39, 1.7, 0.03), 0.1),         # index
        ('finger.3', (0.085, 1.22, 0.0), (0.105, 1.83, 0.03), 0.104),    # middle
        ('finger.4', (-0.11, 1.19, 0.0), (-0.18, 1.73, 0.03), 0.1),      # ring
        ('finger.5', (-0.29, 1.1, 0.0), (-0.45, 1.5, 0.03), 0.09),       # little
    ]
    for nm, a, b, r in F:
        p.capsule(a, b, r, r2=r * 1.04, group=nm)
        p.blob(b, (r * 1.06, r * 1.06, r * 1.0), group=nm)   # a fat round fingertip
    # ROSE palm pad (front)
    p.decal('pad', (0.02, 0.86), (0.25, 0.22, 0.3), ROSE)
    # faint nails on the backs of the fingertips
    for nm, a, b, r in F:
        dx, dy = b[0] - a[0], b[1] - a[1]
        L = math.hypot(dx, dy)
        ux, uy = dx / L, dy / L
        nc = (b[0] - ux * r * 0.35, b[1] - uy * r * 0.35)
        p.paint_fn(lambda q, n, nc=nc, ux=ux, uy=uy, r=r: n.z < -0.55 and
                   (((q.x - nc[0]) * uy - (q.y - nc[1]) * ux) / (r * 0.62)) ** 2 + (((q.x - nc[0]) * ux + (q.y - nc[1]) * uy) / (r * 0.8)) ** 2 < 1,
                   0xeec3a0)
    # the knitted cuff of a sleeve
    p.layer('cuff', base=SKY, target_faces=600, voxel=0.014)
    p.lathe(rounded([(0, 0), (0.33, 0), (0.37, 0.05), (0.37, 0.3), (0.33, 0.36), (0, 0.36)], 0.05, n=3), scale=(1, 0.8), seg=40)
    p.paint_fn(lambda q, n: math.cos(math.atan2(q.x, q.z) * 14) > 0.55 and 0.04 < q.y < 0.33, 0x6fbde8)
    p.layer('skin')
    # rig
    p.bone('body', (0, 0, 0), (0, 1.0, 0), region=lambda q: True)
    for nm, a, b, r in F:
        others = [(a2, b2) for n2, a2, b2, r2 in F if n2 != nm]
        def reg(q, a=a, b=b, r=r, others=others):
            d, t = seg_dist(q, a, b)
            if t <= 0.02 or d > r + 0.09:
                return False
            return all(seg_dist(q, a2, b2)[0] > d for a2, b2 in others)
        p.bone(nm, a, b, parent='body', region=reg)
    finish(p, (1.4, 1.95, 0.75))


# ------------------------------------------------------------------ foot
def foot():
    p = Prop('prop_word_foot', base=SKIN_L, target_faces=1300, voxel=0.016)
    p.quadriflow = False
    _blob = p.blob     # metaball skins swell a little: lift the whole foot so the sole sits on y = 0
    p.blob = lambda pos, size, **kw: _blob((pos[0], pos[1] + 0.026, pos[2]), size, **kw)
    # a chubby foot lying flat, toes toward +z; sole on y = 0
    p.blob((0.0, 0.24, -0.42), (0.33, 0.24, 0.32), group='foot')          # heel
    p.blob((0.0, 0.25, -0.05), (0.38, 0.25, 0.44), group='foot')          # middle
    p.blob((-0.02, 0.2, 0.28), (0.45, 0.2, 0.3), group='foot')            # ball of the foot
    p.blob((-0.01, 0.42, -0.25), (0.28, 0.2, 0.3), group='foot')          # instep
    p.capsule((0, 0.35, -0.44), (0, 0.6, -0.47), 0.27, r2=0.25, group='foot')    # ankle, rounding off softly
    # five toes in a sloping row, the big toe biggest and furthest forward: each its own layer so each gets an ink edge
    T5 = [((-0.27, 0.165, 0.6), (0.165, 0.165, 0.17)),
          ((-0.055, 0.135, 0.645), (0.112, 0.125, 0.115)),
          ((0.115, 0.125, 0.615), (0.102, 0.115, 0.105)),
          ((0.265, 0.112, 0.54), (0.092, 0.102, 0.095)),
          ((0.385, 0.098, 0.43), (0.082, 0.09, 0.085))]
    for i, (c, s) in enumerate(T5):
        p.layer('toe%d' % (i + 1), base=SKIN_L, target_faces=200, voxel=0.01)
        p.blob(c, s, group='t')
        p.blob((c[0] * 0.95, c[1] - 0.01, c[2] - s[2] * 0.8), (s[0] * 0.92, s[1] * 0.9, s[2] * 0.8), group='t')
        p.paint_fn(lambda q, n, c=c, s=s: n.y > 0.25 and n.z > -0.2 and ((q.x - c[0]) / (s[0] * 0.5)) ** 2 + ((q.z - c[2] - s[2] * 0.25) / (s[2] * 0.42)) ** 2 < 1 and q.y > c[1],
                   0xfde3d3)
    p.layer('skin')
    p.bone('body', (0, 0, -0.45), (0, 0.85, -0.45), region=lambda q: True)
    for i, (c, s) in enumerate(T5):
        def reg(q, c=c, s=s):
            d = ((q.x - c[0]) / (s[0] + 0.02)) ** 2 + ((q.y - c[1]) / (s[1] + 0.03)) ** 2 + ((q.z - c[2] + s[2] * 0.3) / (s[2] * 1.4)) ** 2
            if d > 1:
                return False
            return all(((q.x - c2[0]) ** 2 + (q.z - c2[2]) ** 2) >= ((q.x - c[0]) ** 2 + (q.z - c[2]) ** 2) for c2, s2 in T5 if c2 != c)
        p.bone('toes.%d' % (i + 1), (c[0], c[1], c[2] - s[2] * 0.9), (c[0], c[1] + 0.02, c[2] + s[2]), parent='body', region=reg)
    finish(p, (1.0, 0.86, 1.65))


# ------------------------------------------------------------------ comb
def comb():
    p = WProp('prop_word_comb', base=PURPLE, target_faces=1300, voxel=0.011)
    W, T = 0.9, 0.1                       # half width, half thickness
    YS0, YS1 = 0.5, 0.86                  # spine bottom / top
    top = []
    for i in range(41):
        x = -W + 2 * W * i / 40
        dip = 0.075 * math.exp(-(x / 0.22) ** 2)
        top.append((x, YS1 - dip))
    outline = rounded([(-W, YS0)] + top + [(W, YS0)], 0.12, n=4, closed=True)
    p.prism([q[:2] for q in outline][::-1], -T, T, bevel=0.06)
    # nine fat teeth with round ends
    n = 9
    pitch = (2 * W - 0.18) / (n - 1)
    for i in range(n):
        x = -W + 0.09 + i * pitch
        p.box((x, (YS0 + 0.04) / 2, 0), (0.058, (YS0 + 0.04) / 2, T * 0.8), bevel=0.055)
    # the underside of the spine a shade darker so the teeth read as a row
    p.paint_fn(lambda q, n: q.y < YS0 - 0.005 and n.y < 0.5, 0x8a5cf0)
    finish(p, (2 * W, YS1, 2 * T))


# ------------------------------------------------------------------ potty
def potty():
    p = WProp('prop_word_potty', base=GREEN, target_faces=1400, voxel=0.014)
    SX, SZ = 1.0, 1.1                    # oval
    RIM = 0.58
    # the tub: a hollow revolved wall flaring out to a wide flat foot
    prof = rounded([(0.66, 0.0), (0.78, 0.0), (0.78, 0.06), (0.6, 0.2), (0.55, RIM - 0.06), (0.45, RIM - 0.06), (0.42, 0.3), (0.2, 0.22), (0.05, 0.22),
                    (0.05, 0.1), (0.55, 0.1)], 0.04, n=3)
    p.lathe(prof, scale=(SX, SZ), seg=56, closed=True)
    p.cyl((0, 0.0, 0), 0.66, 0.12, scale=(SX, SZ), bevel=0.04, seg=40)

    def wrap_slab(poly, R0, R1, ang0=0.0, npts=6):
        """an outline [(arc length s, y)] bent round the oval between radii R0..R1, centred on angle ang0 (0 = front)"""
        P = []
        m = len(poly)
        for i in range(m):
            a, b = poly[i], poly[(i + 1) % m]
            for k in range(npts):
                t = k / npts
                P.append((a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t))
        verts = []
        for R in (R0, R1):
            for s_, y in P:
                ang = ang0 + s_ / R
                verts.append((R * math.sin(ang) * SX, y, R * math.cos(ang) * SZ))
        n = len(P)
        faces = [tuple(range(n - 1, -1, -1)), tuple(range(n, 2 * n))] + [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)]
        p._prims().append(('mesh', verts, faces, 0.05))
    # the high back rest (a rounded paddle bent round the back) and the front splash guard
    back = rounded([(-0.46, RIM - 0.15), (0.46, RIM - 0.15), (0.44, RIM + 0.4), (0.26, RIM + 0.62), (-0.26, RIM + 0.62), (-0.44, RIM + 0.4)], 0.16, n=4, closed=True)
    wrap_slab([q[:2] for q in back], 0.45, 0.67, ang0=math.pi)
    guard = rounded([(-0.24, RIM - 0.14), (0.24, RIM - 0.14), (0.18, RIM + 0.17), (-0.18, RIM + 0.17)], 0.1, n=4, closed=True)
    wrap_slab([q[:2] for q in guard], 0.45, 0.58, ang0=0.0)
    p.paint_fn(lambda q, n: q.y < 0.07, 0x3aa84a)
    # the WHITE potty bowl insert: its rolled lip shows all round the top, the bowl inside
    p.layer('bowl', base=WHITE, target_faces=700, voxel=0.012)
    p.ring((0, RIM - 0.01, 0), 0.5, 0.075, scale=(SX, SZ), seg=56, rseg=12)
    p.lathe(rounded([(0.0, 0.24), (0.3, 0.26), (0.43, 0.4), (0.47, RIM - 0.02), (0.44, RIM - 0.02), (0.4, 0.42), (0.28, 0.3), (0.0, 0.29)], 0.03, n=2),
            scale=(SX, SZ), seg=48, closed=True)
    p.paint_fn(lambda q, n: n.y > 0.3 and math.hypot(q.x / SX, q.z / SZ) < 0.42, 0xe4ecf2)
    # a YELLOW star sticker on the front of the back rest
    p.layer('star', base=YELLOW, target_faces=260, voxel=0.008)
    st = star_poly(0.2, inner=0.5)
    zb = -0.45 * SZ * math.cos(0.0)
    slab(p, st, -0.02, 0.035, at=(0, RIM + 0.34, -0.345))   # (the remeshed back rest face sits at z ~ -0.35)
    finish(p, (1.56, RIM + 0.62, 1.72))


# ------------------------------------------------------------------ bubbles
def bubbles():
    p = Prop('prop_word_bubbles', base=PINK, target_faces=700, voxel=0.014)
    # the PINK tub of bubble mix
    p.lathe(rounded([(0, 0), (0.3, 0), (0.33, 0.05), (0.36, 0.42), (0.41, 0.44), (0.41, 0.5), (0.3, 0.5), (0.3, 0.42), (0, 0.42)], 0.035, n=3), seg=40)
    p.paint_fn(lambda q, n: q.y > 0.4 and math.hypot(q.x, q.z) < 0.31, 0xd8f2ff)    # bubble mix surface
    p.paint_fn(lambda q, n: 0.17 < q.y < 0.26 and math.hypot(q.x, q.z) > 0.3, WHITE)  # a white band
    # the YELLOW wand: a fat stick out of the tub, a big ring on top
    p.layer('wand', base=YELLOW, target_faces=600, voxel=0.012)
    RC = (0.1, 1.28, 0.05)
    RR = 0.27
    p.tube([(-0.05, 0.3, 0.0), (0.03, 0.8, 0.03), (0.08, RC[1] - RR - 0.02, 0.05)], 0.07, rseg=10)
    p.ring(RC, RR, 0.075, rot=(90, 0, -12), rseg=10)
    # five bubbles floating up and to the right out of the ring
    B = [((0.64, 1.6, 0.1), 0.3), ((0.14, 2.05, 0.05), 0.22), ((0.78, 2.2, 0.0), 0.17), ((-0.42, 1.78, 0.08), 0.15), ((0.4, 2.52, 0.02), 0.12)]
    for i, (c, r) in enumerate(B):
        p.layer('bub%d' % (i + 1), base=SKY, target_faces=180, voxel=0.01)
        p.blob(c, (r, r, r), group='b')
        # a PINK crescent on the lower right edge, a WHITE glint stroke and dot on the upper left
        p.paint_fn(lambda q, n: n.x * 0.6 - n.y * 0.8 > 0.78, 0xffa9d6)
    for i, (c, r) in enumerate(B):
        p.layer('glint%d' % (i + 1), base=WHITE, target_faces=80, voxel=0.007)
        g = (c[0] - r * 0.43, c[1] + r * 0.46, c[2] + r * 0.8)
        p.blob(g, (r * 0.26, r * 0.16, r * 0.09), rot=(-28, 26, 40), group='g')
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 1.0, 0), region=lambda q: q.y < 1.0 or math.hypot(q.x - RC[0], q.y - RC[1]) < RR + 0.12)
    for i, (c, r) in enumerate(B):
        p.bone('bubble.%d' % (i + 1), (c[0], c[1] - r, c[2]), (c[0], c[1] + r, c[2]), parent='body',
               region=lambda q, c=c, r=r: math.dist((q.x, q.y, q.z), c) < r + 0.05)
    finish(p, (1.5, 2.64, 0.82))


# ------------------------------------------------------------------ plaster
def plaster():
    p = WProp('prop_word_plaster', base=TAN, target_faces=560, voxel=0.011)
    p.layers['skin']['clean'] = True
    p.layers['skin']['psegs'] = 2
    L, Wd, T = 1.0, 0.38, 0.05            # half length, half width, half thickness
    TILT = 22                              # leans back a little so the front shows from a level camera
    ARCH = 0.2                             # the middle bows toward the camera

    def place(x, y, z):
        zb = z + ARCH * (1 - (x / L) ** 2)
        ca, sa = math.cos(math.radians(TILT)), math.sin(math.radians(TILT))
        yy = (y + Wd) * ca - zb * sa
        zz = (y + Wd) * sa + zb * ca
        return (x, yy + 0.078, zz - ARCH * 0.5)

    def local(q):
        ca, sa = math.cos(math.radians(TILT)), math.sin(math.radians(TILT))
        yy, zz = q.y - 0.078, q.z + ARCH * 0.5
        y = yy * ca + zz * sa - Wd
        z = -yy * sa + zz * ca
        return q.x, y, z - ARCH * (1 - (q.x / L) ** 2)

    def bent(poly, z0, z1, bevel, off=(0.0, 0.0)):
        P = []
        m = len(poly)
        for i in range(m):
            a, b = poly[i], poly[(i + 1) % m]
            k = max(1, int(math.hypot(b[0] - a[0], b[1] - a[1]) / 0.12))
            for j in range(k):
                t = j / k
                P.append((off[0] + a[0] + (b[0] - a[0]) * t, off[1] + a[1] + (b[1] - a[1]) * t))
        n = len(P)
        verts = [place(x, y, z) for z in (z0, z1) for x, y in P]
        faces = [tuple(range(n - 1, -1, -1)), tuple(range(n, 2 * n))] + [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)]
        p._prims().append(('mesh', verts, faces, bevel))

    strip = []
    for i in range(17):
        a = -math.pi / 2 + math.pi * i / 16
        strip.append((L - Wd + Wd * math.cos(a), Wd * math.sin(a)))
    for i in range(17):
        a = math.pi / 2 + math.pi * i / 16
        strip.append((-L + Wd + Wd * math.cos(a), Wd * math.sin(a)))
    bent(strip, -T, T, 0.04)
    # air-hole dots: little darker dimples, three by three on each end (own layer, so they stay crisp)
    p.layer('holes', base=0xd9ae74, target_faces=260, voxel=0.007, clean=True)
    for sx in (-1, 1):
        for cx in (0.6, 0.73, 0.86):
            for cy in (-0.17, 0.0, 0.17):
                if cx > 0.8 and abs(cy) > 0.1:
                    continue
                bent(circle_poly(0.038, n=7), T - 0.02, T + 0.014, 0.0, off=(sx * cx, cy))
    # the raised CREAM pad, quilted with tiny dimples
    p.layer('pad', base=CREAM, target_faces=300, voxel=0.01, clean=True)
    PL, PW = 0.37, 0.27
    bent([q[:2] for q in rounded([(-PL, -PW), (PL, -PW), (PL, PW), (-PL, PW)], 0.1, n=4, closed=True)], T - 0.02, T + 0.07, 0.035)
    # RED heart sticker on the pad
    p.layer('heart', base=RED, target_faces=200, voxel=0.008, clean=True)
    bent(heart_poly(0.17, n=32), T + 0.05, T + 0.1, 0.015)
    p.layer('skin')
    finish(p, (2 * L, 0.84, 0.6))


# ------------------------------------------------------------------ towel (word-card variant of prop_md_towel)
def towel():
    p = WProp('prop_word_towel', base=SKY, target_faces=1500, voxel=0.012)
    TOPY, X = 1.66, 0.74
    W = 0.6                                # towel half width
    def panel(z0, out, L, thick=0.085, nx=10, ny=12):
        """a hanging terry panel from the bar down to TOPY - L with a soft belly (out = +1 front, -1 back)"""
        def at(x, j):
            f = j / ny
            return (x * (1 + 0.04 * f), TOPY - L * f - 0.03 * math.sin(x * 3.2) * f,
                    z0 + out * (0.07 * f + 0.04 * math.sin(f * math.pi)) + 0.025 * math.sin(x * 12 + f * 3) * f)
        verts, faces = [], []
        for side, dz in ((0, -thick / 2), (1, thick / 2)):
            for i in range(nx + 1):
                for j in range(ny + 1):
                    x, y, z = at(-W + 2 * W * i / nx, j)
                    verts.append((x, y, z + dz))
        idx = lambda s_, i, j: s_ * (nx + 1) * (ny + 1) + i * (ny + 1) + j
        for i in range(nx):
            for j in range(ny):
                faces.append((idx(1, i, j), idx(1, i + 1, j), idx(1, i + 1, j + 1), idx(1, i, j + 1)))
                faces.append((idx(0, i, j), idx(0, i, j + 1), idx(0, i + 1, j + 1), idx(0, i + 1, j)))
        for i in range(nx):
            faces.append((idx(0, i, ny), idx(0, i + 1, ny), idx(1, i + 1, ny), idx(1, i, ny)))
            faces.append((idx(0, i + 1, 0), idx(0, i, 0), idx(1, i, 0), idx(1, i + 1, 0)))
        for j in range(ny):
            faces.append((idx(0, 0, j + 1), idx(0, 0, j), idx(1, 0, j), idx(1, 0, j + 1)))
            faces.append((idx(0, nx, j), idx(0, nx, j + 1), idx(1, nx, j + 1), idx(1, nx, j)))
        p.mesh(verts, faces)
        p.tube([at(-W + 2 * W * i / nx, ny) for i in range(nx + 1)], thick * 0.62, rseg=10)   # rolled hem
        return at
    front = panel(0.085, 1, 1.22)
    panel(-0.085, -1, 0.95)
    p.tube([(-W - 0.02, TOPY, 0), (W + 0.02, TOPY, 0)], 0.125, rseg=14)    # the soft fold over the bar
    # two WHITE woven bands across the front near the hem (thin strips riding just proud of the front panel)
    p.layer('bands', base=WHITE, target_faces=400, voxel=0.009)
    ny, nx = 12, 12
    for f0, f1 in ((0.8, 0.86), (0.89, 0.92)):
        verts, faces = [], []
        js = [f0 + (f1 - f0) * k / 2 for k in range(3)]
        for side, dz in ((0, 0.035), (1, 0.07)):
            for i in range(nx + 1):
                for jf in js:
                    x, y, z = front(-W * 1.03 + 2.06 * W * i / nx, jf * ny)
                    verts.append((x, y, z + dz))
        nj = len(js)
        idx = lambda s_, i, k: s_ * (nx + 1) * nj + i * nj + k
        for i in range(nx):
            for k in range(nj - 1):
                faces.append((idx(1, i, k), idx(1, i + 1, k), idx(1, i + 1, k + 1), idx(1, i, k + 1)))
                faces.append((idx(0, i, k), idx(0, i, k + 1), idx(0, i + 1, k + 1), idx(0, i + 1, k)))
        for i in range(nx):
            faces.append((idx(0, i, 0), idx(0, i + 1, 0), idx(1, i + 1, 0), idx(1, i, 0)))
            faces.append((idx(0, i, nj - 1), idx(1, i, nj - 1), idx(1, i + 1, nj - 1), idx(0, i + 1, nj - 1)))
        for k in range(nj - 1):
            faces.append((idx(0, 0, k), idx(1, 0, k), idx(1, 0, k + 1), idx(0, 0, k + 1)))
            faces.append((idx(0, nx, k), idx(0, nx, k + 1), idx(1, nx, k + 1), idx(1, nx, k)))
        p.mesh(verts, faces)
    # the little WOOD towel stand: two posts on cross feet, a bar on top with round knobs
    p.layer('stand', base=WOOD, target_faces=700, voxel=0.012, clean=True)
    for s in (-1, 1):
        p.cyl((s * X, 0.1, 0), 0.055, TOPY - 0.1, bevel=0.02, seg=14)                              # post
        p.box((s * X, 0.06, 0), (0.07, 0.06, 0.38), bevel=0.04)                                    # foot
        p.cyl((s * (X - 0.02), TOPY, 0), 0.085, 0.12, rot=(0, 0, -s * 90), bevel=0.04, seg=16)     # end knob
    p.cyl((-X, TOPY, 0), 0.05, 2 * X, rot=(0, 0, -90), bevel=0.0, seg=14)                           # the bar
    finish(p, (2 * X + 0.2, TOPY + 0.13, 0.85))


# ------------------------------------------------------------------ soap (word-card variant of prop_md_soap)
def soap():
    p = WProp('prop_word_soap', base=PINK, target_faces=900, voxel=0.012)
    TILT = 38                              # tipped up toward the camera on its pile of suds, so the heart shows
    Rb = Matrix_rot(TILT)
    C = (0.0, 0.62, 0.0)
    def P(x, y, z):
        v = Rb(x, y, z)
        return (v[0] + C[0], v[1] + C[1], v[2] + C[2])
    # the bar: a chunky rounded bar (built level, then tipped)
    verts, faces = [], []
    p.box(C, (0.62, 0.2, 0.4), rot=(TILT, 0, 0), bevel=0.16)
    # pressed heart on the top face: a raised ROSE heart (own layer, crisp)
    p.layer('heart', base=0xffc2dc, target_faces=300, voxel=0.008, clean=True)
    hp = heart_poly(0.22, n=32)
    n = len(hp)
    vv = [P(x, 0.19, -y) for x, y in hp] + [P(x, 0.235, -y) for x, y in hp]
    ff = [tuple(range(n)), tuple(range(2 * n - 1, n - 1, -1))] + [(i, n + i, n + (i + 1) % n, (i + 1) % n) for i in range(n)]
    p._prims().append(('mesh', vv, ff, 0.012))
    # a hard-edged shine on the bar
    p.layer('skin')
    p.paint_fn(lambda q, n: n.y > 0.4 and n.z > 0.3 and q.x < -0.38 and q.x > -0.5, 0xffa6d6)
    # WHITE suds under the bar, and two SKY bubbles floating up
    p.layer('suds', base=WHITE, target_faces=700, voxel=0.012)
    for i, (x, z, r) in enumerate(((-0.55, 0.15, 0.2), (-0.25, 0.3, 0.17), (0.1, 0.32, 0.19), (0.45, 0.22, 0.2), (0.62, -0.1, 0.17),
                                    (-0.62, -0.15, 0.16), (-0.3, -0.25, 0.18), (0.2, -0.25, 0.2), (0.0, 0.0, 0.26))):
        p.blob((x, r * 0.85, z), (r, r * 0.85, r), group='s%d' % i)
    p.paint_fn(lambda q, n: n.y < -0.2 or (n.x > 0.5 and n.y < 0.2), 0xe6eef8)
    for i, (c, r) in enumerate((((0.66, 1.25, 0.12), 0.15), ((0.42, 1.55, 0.05), 0.1))):
        p.layer('bub%d' % i, base=SKY, target_faces=160, voxel=0.009)
        p.blob(c, (r, r, r), group='b')
        p.paint_fn(lambda q, n: n.x * 0.6 - n.y * 0.8 > 0.75, 0xffa9d6)
        p.layer('gl%d' % i, base=WHITE, target_faces=80, voxel=0.007)
        p.blob((c[0] - r * 0.43, c[1] + r * 0.46, c[2] + r * 0.8), (r * 0.26, r * 0.16, r * 0.09), rot=(-28, 26, 40), group='g')
    p.layer('skin')
    finish(p, (1.5, 1.66, 1.1))


def Matrix_rot(tilt):
    """(x, y, z) -> rotated about x by tilt degrees (top face turns toward +z)"""
    c, s = math.cos(math.radians(tilt)), math.sin(math.radians(tilt))
    return lambda x, y, z: (x, y * c - z * s, y * s + z * c)


MODELS = dict(prop_word_mouth=mouth, prop_word_hand=hand, prop_word_foot=foot, prop_word_comb=comb,
              prop_word_potty=potty, prop_word_bubbles=bubbles, prop_word_plaster=plaster,
              prop_word_towel=towel, prop_word_soap=soap)
for name, fn in MODELS.items():
    if not ONLY or name in ONLY:
        fn()
