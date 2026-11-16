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


WHITE = 0xfffaf2
PATCH = 0x4e3a40      # warm black-brown
PINK = 0xffb6c6
NOSTRIL = 0xc25676
INNER_EAR = 0xffa9bd
HOOF = 0x6a4c58
HORN = 0xfff0c8
COLLAR = 0xef5b57
COLLAR_DK = 0xc9423f
GOLD = 0xffc93a
GOLD_DK = 0xd99a1e

c = Farm('cow', base=WHITE, target_faces=13000)

HY = 1.93          # head centre
FY = HY            # face sphere centre (eyes raised with eyeY so the pink muzzle carries nostrils and mouth)
R = 0.62

# ---------- body: soft pear, lifted so short legs show ----------
c.blob((0, 0.68, 0), (0.5, 0.42, 0.46))
c.blob((0, 0.56, 0.02), (0.5, 0.28, 0.45))
c.blob((0, 0.98, 0), (0.36, 0.28, 0.36))                      # narrower chest: a soft pear, room for armpits
c.blob((0, 1.22, 0), (0.34, 0.2, 0.32))                     # neck blend
c.blob((0, 0.13, 0.1), (0.08, 0.2, 0.3), negative=True)     # crotch notch between the legs
# ---------- head: big, round, a bit wide ----------
c.blob((0, HY, -0.02), (0.7, 0.6, 0.6))
c.blob((0, HY + 0.1, 0.21), (0.5, 0.34, 0.46))                # face plate: an upright brow so the eyes and mouth share one face
# muzzle: one soft pink pad on the lower face, front kept upright so the mouth lies on it
c.blob((0, HY - 0.17, 0.34), (0.5, 0.26, 0.34), group='muzzle')
c.blob((0, HY - 0.36, 0.31), (0.44, 0.2, 0.32), group='muzzle')
c.blob((0, HY - 0.3, 0.3), (0.38, 0.18, 0.3), group='muzzle')     # chin bridge (no beak notch in profile)
# little tuft of hair on the crown
c.mirror(lambda s: c.blob((s * 0.08, HY + 0.6, 0.1), (0.09, 0.08, 0.08), group='tuft'))
c.blob((0, HY + 0.63, 0.03), (0.1, 0.09, 0.09), group='tuft')
c.blob((0, HY + 0.52, 0.02), (0.15, 0.08, 0.1), group='tuft')
# horns: short cream nubs curving outward
def horn(s):
    c.capsule((s * 0.3, HY + 0.44, -0.06), (s * 0.42, HY + 0.68, -0.04), 0.1, r2=0.06, group='horn' + str(s))
c.mirror(horn)
# floppy ears: leaves sticking out sideways and drooping, flat face toward the front
def ear(s):
    g = 'ear' + str(s)
    c.blob((s * 0.8, HY + 0.16, 0.0), (0.25, 0.13, 0.07), rot=(0, 0, s * -20), group=g)
    c.blob((s * 0.95, HY + 0.1, 0.0), (0.16, 0.11, 0.06), rot=(0, 0, s * -26), group=g)
    c.blob((s * 0.64, HY + 0.22, -0.02), (0.1, 0.09, 0.07), group=g)
c.mirror(ear)
# arms (front legs) in an A-pose with a clear armpit gap, hoof tips as their own shape
SH, WR, HAND = (0.4, 1.12, 0.06), (0.82, 0.86, 0.14), (0.89, 0.8, 0.16)
def arm(s):
    c.capsule((s * SH[0], SH[1], SH[2]), (s * WR[0], WR[1], WR[2]), 0.13, r2=0.125, group='arm' + str(s))
    c.blob((s * HAND[0], HAND[1], HAND[2]), (0.145, 0.12, 0.145), rot=(0, 0, s * 35), group='hand' + str(s))
c.mirror(arm)
# hind legs: short and visible, flat hooves as their own shape
def leg(s):
    c.capsule((s * 0.33, 0.46, 0.06), (s * 0.33, 0.2, 0.1), 0.17, group='leg' + str(s))
    c.blob((s * 0.33, 0.09, 0.12), (0.19, 0.09, 0.2), group='hoof' + str(s))
c.mirror(leg)
# tail: thin rope hanging from the rump, dark tuft at the tip
c.curve([(0, 0.86, -0.42), (0.04, 0.82, -0.64), (0.1, 0.64, -0.74), (0.13, 0.46, -0.72)], [0.05, 0.045, 0.04, 0.04], group='tail')
c.blob((0.14, 0.37, -0.71), (0.09, 0.13, 0.09), group='tailtuft')

# ---------- collar (own layer, rigid on the body) and bell (own layer, on a springy bone) ----------
COLLAR_Y = 1.25
def make_collar():
    n = 28
    for i in range(n):
        a = 2 * math.pi * i / n
        d = (math.sin(a), 0, math.cos(a))
        h = c.surface(0, COLLAR_Y, 0.0, dir=d)
        r = min(0.33, (Vector(h) - Vector((0, COLLAR_Y, 0))).length) if h else 0.33   # neck only, never the shoulders
        p = Vector((0, COLLAR_Y, 0)) + Vector(d) * (r + 0.015)
        c.blob(tuple(p), (0.06, 0.055, 0.06), group='collar')
    h = c.surface(0, COLLAR_Y - 0.03)
    c.blob((0, COLLAR_Y - 0.03, h.z + 0.03), (0.05, 0.05, 0.04), group='collar')     # little loop for the bell
c.layer('collar', base=COLLAR, target_faces=1800)
c.lazy['collar'] = make_collar
c.rigid['collar'] = 'body'
BELL = (0, COLLAR_Y - 0.17)
def make_bell():
    h = c.surface(0, BELL[1])
    z = h.z + 0.1
    c.blob((0, BELL[1] + 0.03, z), (0.095, 0.1, 0.08), group='bell')
    c.blob((0, BELL[1] - 0.05, z + 0.005), (0.13, 0.06, 0.1), group='bell')
    c.blob((0, BELL[1] - 0.115, z + 0.02), (0.04, 0.035, 0.04), group='clap')
    c.paint('band', (0, BELL[1] - 0.05, z), (0.3, 0.025, 0.3), GOLD_DK)
    c.paint_group('clap', GOLD_DK)
c.layer('bell', base=GOLD, target_faces=1200)
c.lazy['bell'] = make_bell
c.rigid['bell'] = 'wattle'
c.layer('skin')

# ---------- paint ----------
PATCHES = [  # (centre, radius, seed)  - wobbly blobs on the body, rump, one leg and the back of the head
    ((0.46, 0.5, 0.2), 0.2, 1.2),
    ((-0.42, 0.7, -0.3), 0.3, 2.7),
    ((0.24, 1.02, -0.42), 0.24, 4.1),
    ((0.3, 0.42, -0.36), 0.18, 5.3),
    ((-0.47, 0.76, 0.18), 0.15, 0.4),
    ((0.34, HY + 0.3, -0.42), 0.27, 1.9),     # back of the head, well away from the eyes
]
def wob(d, r, sd):
    a = math.atan2(d.y, d.x + 1e-4); b = math.atan2(d.z, d.x + 1e-4)
    return r * (1 + 0.14 * math.sin(3 * a + sd) + 0.06 * math.sin(2 * b + sd * 2.3))
def patch(p, n):
    if c.owner(p) not in ('main', 'leg1', 'leg-1'):
        return False
    if p.y > 1.3 and p.z > -0.12:          # never on the face side of the head
        return False
    for (cx, cy, cz), r, sd in PATCHES:
        d = p - Vector((cx, cy, cz))
        if d.length < wob(d, r, sd):
            return True
    return False
c.paint_fn(patch, PATCH)
c.paint_group('ear-1', PATCH)                       # one dark ear
c.mirror(lambda s: c.paint('inner_ear', (s * 0.86, HY + 0.12, 0.06), (0.24, 0.075, 0.06), INNER_EAR, rot=(0, 0, s * -22),
                           only=lambda p, s=s: p.z > 0.02 and c.owner(p) == 'ear' + str(s)))
c.paint('muzzle', (0, HY - 0.25, 0.42), (0.54, 0.32, 0.42), PINK, only=lambda p: p.z > 0.12 and p.y > 1.3)
c.fine.append(((0, HY - 0.08, 0.6), (0.3, 0.12, 0.2)))
c.mirror(lambda s: c.decal('nostril', (s * 0.12, HY - 0.075), (0.052, 0.046, 0.12), NOSTRIL))
c.paint_group(['horn-1', 'horn1'], HORN)
c.paint_group(['hand-1', 'hand1', 'hoof-1', 'hoof1', 'tailtuft'], HOOF)

# ---------- rig ----------
c.neck = (1.3, 1.46)
c.weight_smooth = 6
BODYG = ['main']
HEADG = ['main', 'muzzle', 'tuft', 'horn-1', 'horn1', 'ear-1', 'ear1']
c.bone('body', (0, 0.25, 0), (0, 1.3, 0), group=BODYG)
c.bone('head', (0, HY - 0.5, 0), (0, HY + 0.6, 0), parent='body', group=HEADG, region=lambda p: p.y > 1.2)
c.mirror(lambda s: c.chain('ear' + ('.L' if s < 0 else '.R'),
                           [(s * 0.66, HY + 0.2, 0), (s * 0.86, HY + 0.14, 0), (s * 1.08, HY + 0.04, 0)], 'head', group='ear' + str(s)))
c.mirror(lambda s: c.bone('arm' + ('.L' if s < 0 else '.R'), (s * SH[0], SH[1], SH[2]), (s * HAND[0], HAND[1] - 0.04, HAND[2]), parent='body',
                          group=['arm' + str(s), 'hand' + str(s)]))
c.mirror(lambda s: c.bone('leg' + ('.L' if s < 0 else '.R'), (s * 0.33, 0.48, 0.06), (s * 0.33, 0.04, 0.14), parent='body',
                          group=['leg' + str(s), 'hoof' + str(s)]))
c.chain('tail', [(0, 0.86, -0.42), (0.06, 0.78, -0.7), (0.14, 0.34, -0.71)], 'body', group=['tail', 'tailtuft'])
c.bone('wattle', (0, COLLAR_Y - 0.02, 0.45), (0, COLLAR_Y - 0.3, 0.5), parent='body', group=['bell', 'clap'])   # bell spring

c.face(center=(0, FY, 0), radius=R, faceScale=1.0, fit=True, eyeY=0.22, eyeSize=1.12, cheeks=0)
for k, p in dict(nose=(0, HY - 0.065), eyeL=(-0.36 * R, FY + 0.22 * R), eyeR=(0.36 * R, FY + 0.22 * R), mouth=(0, FY - 0.25),
                 tummy=(0, 0.74), handL=(-HAND[0], HAND[1], HAND[2] + 0.14), handR=(HAND[0], HAND[1], HAND[2] + 0.14),
                 footL=(-0.33, 0.09, 0.3), footR=(0.33, 0.09, 0.3), earL=(-0.9, HY + 0.1, 0.06), earR=(0.9, HY + 0.1, 0.06)).items():
    c.anchor(k, p, 'head' if p[1] > 1.3 else 'body')
c.extras['outline'] = 0.028
c.build()
