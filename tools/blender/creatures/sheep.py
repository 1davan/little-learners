import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from lib import Creature
from mathutils import Vector


# ---------- small farm helpers (kept in this file: lib.py is shared) ----------
class Farm(Creature):
    """Creature + three conveniences:
    rigid[layer] = bone   -> that layer moves rigidly with one bone (collar, bell...)
    lazy[layer] = fn      -> fn() adds the layer's blobs when it is built, so it can ray-cast the finished body
    face(fit=True)        -> the face sphere is placed so the code mouth (smile, frown, oh, joy) sits ON the muzzle"""
    def __init__(self, *a, **k):
        super().__init__(*a, **k)
        self.rigid, self.lazy = {}, {}
        self.fine = []        # (centre, half-size): skin there is subdivided before painting, for small crisp details

    def _paint(self, skin):
        if self._cur == 'skin' and self.fine:
            import bmesh
            from mathutils import Matrix
            inv = Matrix(((1, 0, 0), (0, 0, 1), (0, -1, 0)))
            def inside(v):
                g = inv @ v.co
                return any(((g.x - c[0]) / s[0]) ** 2 + ((g.y - c[1]) / s[1]) ** 2 + ((g.z - c[2]) / s[2]) ** 2 < 1 for c, s in self.fine)
            bm = bmesh.new()
            bm.from_mesh(skin.data)
            for _ in range(2):
                es = [e for e in bm.edges if inside(e.verts[0]) or inside(e.verts[1])]
                bmesh.ops.subdivide_edges(bm, edges=es, cuts=1, use_grid_fill=True, smooth=1.0)
                bmesh.ops.triangulate(bm, faces=bm.faces[:])
            bm.to_mesh(skin.data)
            bm.free()
            skin.data.update()
        return super()._paint(skin)

    def _skin(self):
        fn = self.lazy.pop(self._cur, None)
        if fn:
            keep, self._skin_obj = self._skin_obj, self.body_skin     # ray-cast the body, not the last layer
            fn()
            self._skin_obj = keep
        sk = super()._skin()
        if self._cur == 'skin':
            self.body_skin = sk
        return sk

    def _weights(self, skin, ao, smooth_iters=None):
        b = self.rigid.get(self._cur)
        if not b:
            return super()._weights(skin, ao, smooth_iters)
        skin.vertex_groups.new(name=b).add(list(range(len(skin.data.vertices))), 1.0, 'REPLACE')
        mod = skin.modifiers.new('rig', 'ARMATURE')
        mod.object = ao
        skin.parent = ao

    def mouth_pts(self, R):
        my, out = -0.3 * R, []
        z0 = math.sqrt(R * R - my * my) + 0.01 * R
        for i in range(9):
            a = math.pi * (0.1 + 0.8 * i / 8)
            out.append(('smile', 0.2 * R * math.cos(a), my + 0.05 * R - 0.2 * R * math.sin(a), z0 - 0.04 * R))
            out.append(('frown', 0.17 * R * math.cos(a), my - 0.12 * R + 0.17 * R * math.sin(a), z0 - 0.02 * R))
            out.append(('joy', 0.24 * R * math.cos(a), my + 0.04 * R - 0.24 * R * math.sin(a), z0 + 0.025 * R))
        return out

    def _empties(self, ao):
        """fit=True: place the face sphere so the code mouth lies ON the muzzle (the engine's mouthY/mouthZ offsets do
        not move the 'joy' mouth, so the whole face is fitted instead) and report how deep the eyes sit."""
        f = self.face_info
        o = f['opts']
        R, fs = f['radius'], o.get('faceScale', 1.0) or 1.0
        cx, cy, cz = f['center']
        if o.get('snap', True):
            hit = self.surface(cx, cy + R * fs * 0.12)
            cz = hit.z - R * fs * 0.97
        if o.get('mouth', 1):
            pts = [(k, cx + x * fs, cy + y * fs, z * fs) for k, x, y, z in self.mouth_pts(R)]
            gaps = []
            for k, x, y, z in pts:
                h = self.surface(x, y)
                gaps.append((k, (cz + z) - (h.z if h else 0)))
            if o.pop('fit', False):
                sf = [g for k, g in gaps if k != 'joy']
                d = -sum(sf) / len(sf) + o.pop('fitGap', 0.006)
                cz += d
                gaps = [(k, g + d) for k, g in gaps]
                f['center'] = (cx, cy, cz)
                o['snap'] = False
            for k in ('smile', 'frown', 'joy'):
                gs = [g for kk, g in gaps if kk == k]
                print('WROTE mouth %-5s gap %+.3f .. %+.3f' % (k, min(gs), max(gs)))
        ex, ey = o.get('eyeX', 0.36) * R, o.get('eyeY', 0.12) * R
        er = 0.14 * R * o.get('eyeSize', 1)
        for sx in (-1, 1):
            h = self.surface(cx + sx * ex * fs, cy + ey * fs)
            ez = cz + (math.sqrt(R * R - ex * ex - ey * ey) - er * 0.12) * fs
            print('WROTE eye centre gap %+.3f (eye r %.3f)' % (ez - h.z, er * fs))
        super()._empties(ao)



WOOL = 0xfff7ee       # warm cream wool
WOOL2 = 0xf7e9d6      # every other puff a shade deeper, so the fleece reads as a cloud of puffs
FACE = 0x96746e       # soft cocoa face: dark against the wool, light enough for the ink eyes
MUZZLE = 0xe9cfc6     # pale muzzle that carries the mouth
LEG = 0x6f5660        # plum-cocoa legs
HOOF = 0x4b3a45
EAR_IN = 0xff9eb5
NOSE = 0x5b4352

c = Farm('sheep', base=WOOL, resolution=0.022, target_faces=13000)


def fib(n):
    out, ga = [], math.pi * (3 - math.sqrt(5))
    for i in range(n):
        y = 1 - (2 * (i + 0.5)) / n
        r = math.sqrt(max(0, 1 - y * y))
        a = i * ga
        out.append((math.cos(a) * r, y, math.sin(a) * r))
    return out


# ---- wool body: a soft core under a cloud of big round puffs; neighbours sit in different groups so each puff
# keeps its own round edge (a scalloped silhouette) ----
BY = 0.9
c.blob((0, BY, -0.02), (0.38, 0.32, 0.36), group='wcore')


def puffs(centres, prefix, ng=8):
    """each puff gets a group different from its near neighbours, so the remesh keeps a crease around it"""
    gs = []
    for i, (p, r) in enumerate(centres):
        near = {gs[j] for j, (q, rq) in enumerate(centres[:i]) if (Vector(p) - Vector(q)).length < (r + rq) * 1.25}
        g = next(k for k in range(ng) if k not in near)
        gs.append(g)
        c.blob(p, (r, r * 0.95, r), group='%s%d' % (prefix, g), stiffness=3.0)
    return sorted({'%s%d' % (prefix, g) for g in gs})


WC = []
for (x, y, z) in fib(14):
    if y < -0.86 or y > 0.8:
        continue
    WC.append(((x * 0.54, BY + y * 0.38, z * 0.48 - 0.02), 0.3))
WOOLG = puffs(WC, 'w')
# woolly ruff: the top row of the fleece, a collar of puffs around the neck under the chin
RC = []
for i in range(10):
    a = 2 * math.pi * i / 10
    RC.append(((math.sin(a) * 0.4, 1.3, math.cos(a) * 0.35 + 0.04), 0.19))
RUFF = puffs(RC, 'r', 5)
# woolly tail puff
c.blob((0, BY + 0.1, -0.74), (0.17, 0.16, 0.15), group='tail', stiffness=2.6)

# ---- legs and hooves (short, dark, visible under the wool) ----
def leg(s):
    c.capsule((s * 0.27, 0.56, 0.06), (s * 0.28, 0.18, 0.1), 0.12, group='leg' + str(s))
    c.blob((s * 0.28, 0.08, 0.12), (0.14, 0.08, 0.16), group='hoof' + str(s))
c.mirror(leg)
# ---- front legs as arms, poking out of the wool in an A-pose ----
SH, WR, HAND = (0.5, 1.08, 0.2), (0.9, 0.8, 0.3), (0.95, 0.75, 0.31)
def arm(s):
    c.capsule((s * SH[0], SH[1], SH[2]), (s * WR[0], WR[1], WR[2]), 0.11, group='arm' + str(s))
    c.blob((s * HAND[0], HAND[1], HAND[2]), (0.12, 0.1, 0.12), rot=(0, 0, s * 35), group='hand' + str(s))
c.mirror(arm)

# ---- head: soft dark face nestled in the wool ----
HY = 1.82
HZ = 0.16
R = 0.62
FY = HY - 0.02
c.blob((0, HY, HZ), (0.6, 0.54, 0.52), group='head')
c.blob((0, HY + 0.08, HZ + 0.16), (0.44, 0.32, 0.4), group='head')      # face plate
c.blob((0, HY - 0.24, HZ + 0.16), (0.42, 0.26, 0.38), group='head')     # soft muzzle / jowls carrying the mouth


# ---- ears sticking out sideways, slightly drooped ----
def ear(s):
    g = 'ear' + str(s)
    c.curve([(s * 0.42, HY + 0.1, HZ - 0.04), (s * 0.7, HY + 0.05, HZ), (s * 0.92, HY - 0.06, HZ + 0.04)],
            [0.12, 0.13, 0.08], group=g, flat=0.45, per=5)
c.mirror(ear)

# ---- woolly cap on top of the head (rounded, no point) ----
CAP = [(0, HY + 0.54, HZ - 0.02, 0.21), (-0.25, HY + 0.47, HZ + 0.08, 0.18), (0.25, HY + 0.47, HZ + 0.08, 0.18),
       (-0.11, HY + 0.46, HZ + 0.3, 0.16), (0.12, HY + 0.47, HZ + 0.3, 0.16), (-0.31, HY + 0.4, HZ - 0.16, 0.18),
       (0.31, HY + 0.4, HZ - 0.16, 0.18), (0, HY + 0.47, HZ - 0.3, 0.19),
       (-0.24, HY + 0.37, HZ + 0.34, 0.12), (0.01, HY + 0.4, HZ + 0.42, 0.13), (0.25, HY + 0.36, HZ + 0.33, 0.12)]
CAPG = puffs([((x, y, z), r * 0.9) for x, y, z, r in CAP], 'cap', 4)

# ---- paint ----
c.paint_group([g for g in WOOLG + RUFF if int(g[-1]) % 2], WOOL2)
c.paint_group('head', FACE)
c.paint_group(['ear-1', 'ear1'], FACE)
c.mirror(lambda s: c.paint('inner_ear', (s * 0.74, HY + 0.02, HZ + 0.1), (0.2, 0.075, 0.08), EAR_IN,
                           only=lambda p, s=s: c.owner(p) == 'ear' + str(s) and p.x * s > 0.56))
c.paint('muzzle', (0, HY - 0.25, HZ + 0.44), (0.32, 0.24, 0.3), MUZZLE, only=lambda p: c.owner(p) == 'head')
c.paint_group(['arm-1', 'arm1', 'leg-1', 'leg1'], LEG)
c.paint_group(['hand-1', 'hand1', 'hoof-1', 'hoof1'], HOOF)

# ---- rig ----
c.neck = (9.0, 9.5)          # the head is its own shape on the wool: no neck ramp needed
c.weight_smooth = 6
c.bone('body', (0, 0.25, 0), (0, 1.3, 0), group=['wcore'] + WOOLG + RUFF)
c.bone('head', (0, 1.32, HZ), (0, 2.4, HZ), parent='body', group=['head', 'ear-1', 'ear1'] + CAPG)
c.bone('tuft.1', (0, HY + 0.4, HZ), (0, HY + 0.74, HZ), parent='head', group=CAPG, region=lambda p: p.y > HY + 0.42)
for s in (-1, 1):
    side = 'L' if s < 0 else 'R'
    c.chain('ear.' + side, [(s * 0.44, HY + 0.1, HZ - 0.04), (s * 0.68, HY + 0.05, HZ), (s * 0.96, HY - 0.08, HZ + 0.04)], 'head', group='ear' + str(s))
    c.bone('arm.' + side, (s * SH[0], SH[1], SH[2]), (s * HAND[0], HAND[1] - 0.04, HAND[2]), parent='body', group=['arm' + str(s), 'hand' + str(s)])
    c.bone('leg.' + side, (s * 0.27, 0.58, 0.06), (s * 0.28, 0.04, 0.14), parent='body', group=['leg' + str(s), 'hoof' + str(s)])
c.bone('tail.1', (0, BY + 0.1, -0.6), (0, BY + 0.16, -0.9), parent='body', group='tail')

c.face(center=(0, FY, HZ), radius=R, faceScale=1.0, fit=True, eyeY=0.18, noseColor=NOSE)
for k, p in dict(nose=(0, FY - 0.04), eyeL=(-0.36 * R, FY + 0.18 * R), eyeR=(0.36 * R, FY + 0.18 * R), mouth=(0, FY - 0.25 * R),
                 tummy=(0, BY - 0.05), handL=(-HAND[0], HAND[1], HAND[2] + 0.1), handR=(HAND[0], HAND[1], HAND[2] + 0.1),
                 footL=(-0.28, 0.08, 0.27), footR=(0.28, 0.08, 0.27),
                 earL=(-0.8, HY, HZ + 0.1), earR=(0.8, HY, HZ + 0.1)).items():
    c.anchor(k, p, 'head' if p[1] > 1.4 else 'body')
c.build()
