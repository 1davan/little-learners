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



PINK = 0xffa8bf
BELLY = 0xffc2d1
SNOUT = 0xff8fae
INNER = 0xff7fa2
HOOF = 0xb0566f
NOSTRIL = 0x8e3550
CHEEK = 0xff6f91

c = Farm('pig', base=PINK, resolution=0.022, target_faces=13000)

HY = 1.62          # head centre
R = 0.66           # face sphere
FY = HY - 0.1      # face centre: eyes raised with eyeY above the snout, the mouth just under it
SY = FY + 0.03     # snout disc centre

# ---- body: round soft pear, lifted on short legs ----
c.blob((0, 0.66, 0), (0.54, 0.44, 0.5))
c.blob((0, 0.5, 0.03), (0.54, 0.3, 0.5))
c.blob((0, 0.92, 0), (0.4, 0.22, 0.4))                         # chest: room for armpits
c.blob((0, 0.12, 0.1), (0.08, 0.18, 0.3), negative=True)        # crotch notch between the legs
# ---- head: big, a little wider than tall, with chubby jowls carrying the mouth ----
c.blob((0, HY, 0.0), (0.78, 0.64, 0.66))
c.blob((0, HY - 0.25, 0.3), (0.62, 0.29, 0.43))                  # jowls / chin
c.blob((0, HY + 0.12, 0.18), (0.56, 0.32, 0.46))                 # face plate
# ---- snout: a proud flat disc on the front of the face ----
c.blob((0, SY, 0.56), (0.25, 0.17, 0.16), group='snout')
c.blob((0, SY, 0.66), (0.24, 0.16, 0.1), group='snout')
c.mirror(lambda s: c.blob((s * 0.085, SY, 0.78), (0.04, 0.065, 0.06), group='snout', negative=True))   # nostril dimples
# ---- floppy triangle ears: wide root, tip flopping forward ----
def ear(s):
    g = 'ear' + str(s)
    c.curve([(s * 0.4, HY + 0.46, -0.06), (s * 0.58, HY + 0.7, -0.02), (s * 0.74, HY + 0.72, 0.16), (s * 0.8, HY + 0.48, 0.36)],
            [0.25, 0.2, 0.13, 0.08], group=g, flat=0.45, per=6)
    c.blob((s * 0.4, HY + 0.44, -0.04), (0.2, 0.12, 0.13), group=g)   # root grows out of the skull
c.mirror(ear)
# ---- arms: A-pose with an armpit gap, trotters as their own shape ----
SH, WR, HAND = (0.42, 1.04, 0.08), (0.84, 0.84, 0.16), (0.9, 0.79, 0.18)
def arm(s):
    c.capsule((s * SH[0], SH[1], SH[2]), (s * WR[0], WR[1], WR[2]), 0.13, r2=0.125, group='arm' + str(s))
    c.blob((s * HAND[0], HAND[1], HAND[2]), (0.135, 0.115, 0.135), rot=(0, 0, s * 35), group='hand' + str(s))
c.mirror(arm)
# ---- legs: short trotters ----
def leg(s):
    c.capsule((s * 0.31, 0.4, 0.06), (s * 0.31, 0.2, 0.1), 0.16, group='leg' + str(s))
    c.blob((s * 0.31, 0.085, 0.12), (0.17, 0.085, 0.18), group='hoof' + str(s))
c.mirror(leg)
# ---- curly tail: a chunky spiral coil at the back ----
def tail_pts():
    pts, n = [], 11
    for i in range(n):
        t = i / (n - 1)
        a = t * math.pi * 2.2
        r = 0.18 * (1 - 0.35 * t)
        pts.append((math.sin(a) * r, 0.74 + math.cos(a) * r - 0.1 + t * 0.06, -0.68 - t * 0.08))
    return [(0, 0.66, -0.42), (0, 0.66, -0.56)] + pts
TP = tail_pts()
c.curve(TP, [0.1] + [0.09] * (len(TP) - 2) + [0.075], group='tail', per=3)

# ---- paint ----
c.decal('belly', (0, 0.58), (0.3, 0.32, 0.25), BELLY)
c.paint('snout', (0, SY, 0.74), (0.3, 0.22, 0.12), SNOUT, only=lambda p: p.z > 0.64)
c.fine.append(((0, SY, 0.72), (0.3, 0.22, 0.2)))
c.mirror(lambda s: c.paint('nostril', (s * 0.085, SY, 0.78), (0.05, 0.075, 0.08), NOSTRIL))
c.mirror(lambda s: c.paint('inner_ear', (s * 0.68, HY + 0.64, 0.2), (0.17, 0.22, 0.26), INNER,
                           only=lambda p, s=s: c.owner(p) == 'ear' + str(s) and p.y > HY + 0.5 and p.x * s > 0.5))
c.paint_group(['hand-1', 'hand1', 'hoof-1', 'hoof1'], HOOF)
c.mirror(lambda s: c.decal('blush', (s * 0.4, FY - 0.08), (0.1, 0.07, 0.2), CHEEK))     # painted rosy cheeks beside the snout
c.fine.append(((0, FY - 0.08, 0.5), (0.56, 0.12, 0.3)))

# ---- rig ----
c.neck = (1.0, 1.16)
c.weight_smooth = 6
c.bone('body', (0, 0.2, 0), (0, 1.1, 0), group=['main'])
c.bone('head', (0, HY - 0.5, 0), (0, HY + 0.66, 0), parent='body', group=['main', 'snout', 'ear-1', 'ear1'], region=lambda p: p.y > 0.98)
for s in (-1, 1):
    side = 'L' if s < 0 else 'R'
    c.chain('ear.' + side, [(s * 0.46, HY + 0.56, -0.04), (s * 0.68, HY + 0.74, 0.08), (s * 0.8, HY + 0.44, 0.4)], 'head', group='ear' + str(s))
    c.bone('arm.' + side, (s * SH[0], SH[1], SH[2]), (s * HAND[0], HAND[1] - 0.04, HAND[2]), parent='body', group=['arm' + str(s), 'hand' + str(s)])
    c.bone('leg.' + side, (s * 0.31, 0.44, 0.06), (s * 0.31, 0.04, 0.14), parent='body', group=['leg' + str(s), 'hoof' + str(s)])
c.chain('tail', [TP[0], TP[3], TP[7], TP[-1]], 'body', group='tail')

c.face(center=(0, FY, 0.0), radius=R, faceScale=1.0, fit=True, eyeY=0.42, eyeSize=1.15, cheeks=0)
for k, p in dict(nose=(0, SY), eyeL=(-0.36 * R, FY + 0.42 * R), eyeR=(0.36 * R, FY + 0.42 * R), mouth=(0, FY - 0.25 * R),
                 tummy=(0, 0.6), handL=(-HAND[0], HAND[1], HAND[2] + 0.13), handR=(HAND[0], HAND[1], HAND[2] + 0.13),
                 footL=(-0.31, 0.085, 0.28), footR=(0.31, 0.085, 0.28),
                 earL=(-0.72, HY + 0.7, 0.2), earR=(0.72, HY + 0.7, 0.2)).items():
    c.anchor(k, p, 'head' if p[1] > 1.1 else 'body')
c.build()
