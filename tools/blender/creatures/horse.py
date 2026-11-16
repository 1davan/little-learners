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



COAT = 0xc9844f       # warm chestnut
SNOUT = 0xf6d8b8      # soft peach-cream snout pad
BLAZE = 0xfff6ea
MANE = 0x6f3a2c       # chocolate
MANE_HI = 0x84462f
HOOF = 0x5e3d34
INNER_EAR = 0xffb3a8
NOSTRIL = 0x9a5446
SOCK = 0xfff2e2
BELLY = 0xeebb8c

c = Farm('horse', base=COAT, target_faces=13000)

HY = 1.9           # head centre
FY = HY            # face sphere centre (eyes raised with eyeY; the snout pad carries nostrils and mouth)
R = 0.6

# ---------- body: soft pear, lifted so short legs show ----------
c.blob((0, 0.68, 0), (0.48, 0.42, 0.45))
c.blob((0, 0.56, 0.02), (0.48, 0.28, 0.44))
c.blob((0, 0.98, 0), (0.34, 0.28, 0.35))                     # narrower chest: room for armpits
c.blob((0, 1.24, 0), (0.3, 0.24, 0.3))                       # neck
c.blob((0, 0.13, 0.1), (0.08, 0.2, 0.3), negative=True)      # crotch notch between the legs
# ---------- head: a tall oval with a long upright face and a broad snout pad ----------
c.blob((0, HY + 0.04, -0.04), (0.6, 0.62, 0.56))
c.blob((0, HY + 0.12, 0.17), (0.44, 0.34, 0.44))              # face plate (eyes and mouth share one face)
c.blob((0, HY - 0.18, 0.3), (0.42, 0.28, 0.34), group='snout')
c.blob((0, HY - 0.44, 0.24), (0.38, 0.22, 0.3), group='snout')
c.blob((0, HY - 0.34, 0.28), (0.36, 0.2, 0.3), group='snout')   # chin bridge
# tall pointy ears, tilted out a little, cupped toward the front
def ear(s):
    g = 'ear' + str(s)
    c.blob((s * 0.3, HY + 0.74, -0.06), (0.13, 0.3, 0.08), rot=(0, 0, s * -14), group=g)
    c.blob((s * 0.31, HY + 0.76, 0.03), (0.07, 0.2, 0.05), rot=(0, 0, s * -14), group=g, negative=True)
    c.blob((s * 0.26, HY + 0.52, -0.06), (0.12, 0.1, 0.09), group=g)
c.mirror(ear)
# mane: a crest of rounded lobes from the forelock between the ears over the poll and down the neck,
# alternating groups so each lobe keeps a crisp crease
def lockc(pts, radii, group, flat=0.7):
    """a tapered hair lock along a curve; flat thins it sideways (x)"""
    P = [Vector(p) for p in pts]
    n = 10
    for i in range(n + 1):
        t = i / n * (len(P) - 1)
        k = min(int(t), len(P) - 2); f = t - k
        p = P[k].lerp(P[k + 1], f)
        r = radii[k] + (radii[k + 1] - radii[k]) * f
        c.blob(tuple(p), (r * flat, r, r), group=group, stiffness=2.2)
# mane: a row of tapered locks from between the ears over the poll and down the neck, each tip flicking back,
# alternating groups so every lock keeps its own crease and outline
CREST = [  # root (on the midline, just under the skin), tip
    ((0, HY + 0.6, -0.08), (0, HY + 0.86, -0.2)),
    ((0, HY + 0.5, -0.32), (0, HY + 0.68, -0.6)),
    ((0, HY + 0.28, -0.48), (0, HY + 0.36, -0.82)),
    ((0, HY + 0.02, -0.52), (0, HY + 0.0, -0.86)),
    ((0, HY - 0.24, -0.46), (0, HY - 0.34, -0.78)),
    ((0, HY - 0.46, -0.34), (0, HY - 0.62, -0.62)),
]
for i, (a_, b_) in enumerate(CREST):
    m = Vector(a_).lerp(Vector(b_), 0.55) + Vector((0, 0.06, 0))
    lockc([a_, tuple(m), b_], [0.17, 0.14, 0.035], 'mane' + 'AB'[i % 2])
# forelock: one swept lock from the crown down onto the forehead (above the brows) and a little one beside it
lockc([(0, HY + 0.66, 0.06), (0.06, HY + 0.62, 0.3), (0.16, HY + 0.46, 0.4)], [0.15, 0.12, 0.035], 'maneB', flat=0.85)
lockc([(-0.04, HY + 0.66, 0.06), (-0.1, HY + 0.6, 0.26), (-0.16, HY + 0.5, 0.32)], [0.12, 0.09, 0.03], 'maneA', flat=0.85)
# arms (front legs) in an A-pose with an armpit gap; hooves as their own shape
SH, WR, HAND = (0.39, 1.12, 0.06), (0.8, 0.86, 0.14), (0.87, 0.8, 0.16)
def arm(s):
    c.capsule((s * SH[0], SH[1], SH[2]), (s * WR[0], WR[1], WR[2]), 0.125, r2=0.12, group='arm' + str(s))
    c.blob((s * HAND[0], HAND[1], HAND[2]), (0.14, 0.12, 0.14), rot=(0, 0, s * 35), group='hand' + str(s))
c.mirror(arm)
# hind legs: short, visible, white socks, dark hooves
def leg(s):
    c.capsule((s * 0.32, 0.46, 0.06), (s * 0.32, 0.2, 0.1), 0.16, group='leg' + str(s))
    c.blob((s * 0.32, 0.09, 0.12), (0.18, 0.09, 0.19), group='hoof' + str(s))
c.mirror(leg)
# tail: a big flowing lock from the rump
def lock(a, b, w, group, xs=0.8, w2=0.25, n=5):
    a, b = Vector(a), Vector(b)
    for i in range(n):
        t = i / (n - 1)
        r = w * (1 - t) + w * w2 * t
        c.blob(tuple(a.lerp(b, t)), (r * xs, r, r), group=group)
TAIL = [(0, 0.82, -0.42), (0.02, 0.76, -0.72), (0.08, 0.52, -0.86), (0.14, 0.26, -0.82)]
lock(TAIL[0], TAIL[1], 0.12, 'tail', w2=1.2)
lock(TAIL[1], TAIL[2], 0.15, 'tail', w2=1.0)
lock(TAIL[2], TAIL[3], 0.15, 'tail', w2=0.3, n=6)

# ---------- paint ----------
c.decal('belly', (0, 0.6), (0.25, 0.32, 0.25), BELLY)
c.paint('snout', (0, HY - 0.32, 0.42), (0.5, 0.36, 0.42), SNOUT, only=lambda p: p.z > 0.12 and p.y > 1.3)
# a slim white blaze from under the forelock down between the eyes onto the snout
c.paint_fn(lambda p, n: p.z > 0.3 and HY - 0.08 < p.y < HY + 0.5 and abs(p.x) < 0.045 + 0.05 * max(0, min(1, (HY + 0.06 - p.y) / 0.14)), BLAZE)
c.fine.append(((0, HY - 0.1, 0.56), (0.34, 0.12, 0.2)))
c.mirror(lambda s: c.decal('nostril', (s * 0.155, HY - 0.1), (0.05, 0.07, 0.12), NOSTRIL))
c.mirror(lambda s: c.paint('inner_ear', (s * 0.31, HY + 0.74, 0.04), (0.08, 0.22, 0.06), INNER_EAR, rot=(0, 0, s * -14),
                           only=lambda p, s=s: c.owner(p) == 'ear' + str(s)))
c.paint_group(['maneA', 'tail'], MANE)
c.paint_group(['maneB'], MANE_HI)
c.paint_group(['leg-1', 'leg1'], SOCK, only=lambda p: p.y < 0.3)
c.paint_group(['hand-1', 'hand1', 'hoof-1', 'hoof1'], HOOF)

# ---------- rig ----------
c.neck = (1.3, 1.48)
c.weight_smooth = 6
HEADG = ['main', 'snout', 'ear-1', 'ear1', 'maneA', 'maneB']
c.bone('body', (0, 0.25, 0), (0, 1.3, 0), group=['main'])
c.bone('head', (0, HY - 0.5, 0), (0, HY + 0.62, 0), parent='body', group=HEADG, region=lambda p: p.y > 1.2)
c.mirror(lambda s: c.chain('ear' + ('.L' if s < 0 else '.R'), [(s * 0.26, HY + 0.5, -0.06), (s * 0.36, HY + 1.0, -0.06)], 'head', group='ear' + str(s)))
c.chain('mane', [(0, HY + 0.2, -0.56), (0, HY - 0.1, -0.74), (0, HY - 0.5, -0.66)], 'head',
        group=['maneA', 'maneB'], region=lambda p: p.z < -0.56 and p.y < HY + 0.3)
c.mirror(lambda s: c.bone('arm' + ('.L' if s < 0 else '.R'), (s * SH[0], SH[1], SH[2]), (s * HAND[0], HAND[1] - 0.04, HAND[2]), parent='body',
                          group=['arm' + str(s), 'hand' + str(s)]))
c.mirror(lambda s: c.bone('leg' + ('.L' if s < 0 else '.R'), (s * 0.32, 0.48, 0.06), (s * 0.32, 0.04, 0.14), parent='body',
                          group=['leg' + str(s), 'hoof' + str(s)]))
c.chain('tail', TAIL, 'body', group='tail')

c.face(center=(0, FY, 0), radius=R, faceScale=1.0, fit=True, eyeY=0.24, eyeSize=1.12, cheeks=0)
for k, p in dict(nose=(0, HY - 0.1), eyeL=(-0.36 * R, FY + 0.24 * R), eyeR=(0.36 * R, FY + 0.24 * R), mouth=(0, FY - 0.25),
                 tummy=(0, 0.66), handL=(-HAND[0], HAND[1], HAND[2] + 0.14), handR=(HAND[0], HAND[1], HAND[2] + 0.14),
                 footL=(-0.32, 0.09, 0.3), footR=(0.32, 0.09, 0.3), earL=(-0.31, HY + 0.74), earR=(0.31, HY + 0.74)).items():
    c.anchor(k, p, 'head' if p[1] > 1.3 else 'body')
c.build()
