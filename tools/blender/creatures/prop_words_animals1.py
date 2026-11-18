"""WORDS batch 1 (docs/design/VOCAB.md): the NEW farm, pet and garden animal figurines (the rest of the batch reuses the
rigged characters and existing props). One script, several models; ONLY=prop_word_dog,... builds a subset:
    ONLY=prop_word_dog tools/blender/build.sh prop_words_animals1
Also prop_word_butterfly: the word-card butterfly, upright with its wings open to the child (prop_m_butterfly lies flat).

All are "figurines" in the prop_word_owl style: a soft clay Prop skin, a code face (big low eyes, rosy cheeks) on the
head bone, spring bones (ear / tail / tuft / wattle / mane) for the engine to bounce, bottom at y 0, facing +z.
One shared build so they read as one toy box: head about half the height, the same face radius (R 0.5-0.56,
faceScale 1.08), the same stub-leg thickness (r 0.12-0.13) and the same cream tummy-patch treatment.
Sitting: dog, mouse, squirrel, fox. Standing on four legs (body along x, head at the +x end looking at the child):
goat, donkey, deer, turtle. Birds: goose, turkey, bird.
Natural sizes are kept honest (mouse < squirrel < dog < goat < donkey); extras fit/wide set the 2.0 word card.
"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded
from mathutils import Vector

ONLY = [s for s in os.environ.get('ONLY', '').split(',') if s]

RED, ORANGE, YELLOW, GREEN, LEAF = 0xff4f4f, 0xff9a2e, 0xffd23a, 0x4cc75a, 0x2f8a3a
BLUE, SKY, PURPLE, PINK, ROSE = 0x3f8cff, 0x8fd3ff, 0x9b6dff, 0xff7fbf, 0xff9ec4
CREAM, WHITE, BROWN, WOOD, TAN = 0xf2e8d8, 0xfffaf0, 0xb07a4a, 0xd8924f, 0xf3d9ae
GREY, SLATE, INK = 0xb9c0c9, 0x6f7a8c, 0x3a2838


def tint(h, f):
    """one tint lighter (f > 0, toward white) or darker (f < 0) of a palette colour"""
    r, g, b = (h >> 16) & 255, (h >> 8) & 255, h & 255
    if f > 0:
        r, g, b = [int(c + (255 - c) * f) for c in (r, g, b)]
    else:
        r, g, b = [int(c * (1 + f)) for c in (r, g, b)]
    return (r << 16) | (g << 8) | b


FS = 1.08          # one faceScale for the whole box


def ell(center, size):
    C, S = Vector(center), Vector(size)
    return lambda q: ((q.x - C.x) / S.x) ** 2 + ((q.y - C.y) / S.y) ** 2 + ((q.z - C.z) / S.z) ** 2 <= 1.0



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

def finish(p, outline=0.024, wide=False):
    p.extras['outline'] = outline
    p.extras['fit'] = 2.0
    if wide:
        p.extras['wide'] = 2.0
    p.build()


# ---------------------------------------------------------------- shared sitting body
def sit_body(p, HY, k=1.0, tummy=CREAM, legcol=None, chest=True):
    """pear body sitting on its haunches, front legs straight down to the floor, hind feet poking forward.
    k scales the whole body (the head is placed by the caller at HY)."""
    p.blob((0, 0.6 * k, -0.04 * k), (0.52 * k, 0.56 * k, 0.46 * k))
    if chest:
        p.blob((0, 0.98 * k, 0.04 * k), (0.36 * k, 0.32 * k, 0.32 * k))
    p.blob((0, (HY + 0.98 * k) / 2, 0.0), (0.26 * k, 0.2 * k, 0.24 * k))          # neck blend
    for s, n in ((-1, 'L'), (1, 'R')):
        p.blob((s * 0.36 * k, 0.36 * k, -0.06 * k), (0.25 * k, 0.3 * k, 0.36 * k))   # haunch
        p.blob((s * 0.4 * k, 0.09 * k, 0.28 * k), (0.14 * k, 0.09 * k, 0.21 * k), group='foot' + n)
        p.capsule((s * 0.19 * k, 0.8 * k, 0.24 * k), (s * 0.2 * k, 0.15 * k, 0.33 * k), 0.12 * k, r2=0.115 * k, group='legF' + n)
        p.blob((s * 0.2 * k, 0.09 * k, 0.38 * k), (0.13 * k, 0.09 * k, 0.15 * k), group='legF' + n)
    if tummy is not None:
        p.decal('tummy', (0, 0.7 * k), (0.3 * k, 0.36 * k, 0.4 * k), tummy)
    if legcol is not None:
        p.paint_group(['legFL', 'legFR', 'footL', 'footR'], legcol)


def sit_rig(p, HY, top, ears=None, tail=None, extra=None):
    p.bone('body', (0, 0.1, 0), (0, HY - 0.35, 0))
    p.bone('head', (0, HY - 0.35, 0), (0, top, 0), parent='body', region=lambda q: q.y > HY - 0.62)
    for nm, pts, g in (ears or []):
        p.chain(nm, pts, 'head', group=g)
    if tail:
        pts, g = tail
        p.chain('tail', pts, 'body', group=g)
    for b in (extra or []):
        p.bone(*b[0], **b[1])


# ---------------------------------------------------------------- shared four-legged body
def quad_body(p, cx, cy, L, R, legs, leg_r, hoof=None, hoof_h=0.13, groups=True):
    """body: a soft barrel along x centred (cx, cy), half length L, radius R. legs: (x, z) feet positions."""
    p.blob((cx, cy, 0), (L, R, R * 0.92))
    p.blob((cx + L * 0.55, cy + 0.04, 0), (R * 0.95, R * 1.02, R * 0.92))   # chest
    p.blob((cx - L * 0.55, cy + 0.02, 0), (R * 0.9, R * 0.98, R * 0.9))     # rump
    for i, (x, z) in enumerate(legs):
        g = 'leg%d' % i
        p.capsule((x, cy - R * 0.3, z * 0.8), (x, 0.12, z), leg_r * 1.08, r2=leg_r, group=g)
        p.blob((x, 0.105, z + 0.03), (leg_r * 1.15, 0.09, leg_r * 1.3), group=g)
    if hoof is not None:
        p.paint_fn(lambda q, n: q.y < hoof_h, hoof)


def quad_rig(p, head_c, head_r, top, body_y, ears=None, tail=None, extra=None):
    hx, hy, hz = head_c
    p.neck = (99, 99)          # no y-band neck ramp: the head region decides (the rump is as high as the neck)
    p.bone('body', (0, 0.15, 0), (0, body_y + 0.3, 0))
    p.bone('neck', (hx - 0.1, body_y + 0.15, 0), (hx, hy - head_r * 0.6, hz * 0.5), parent='body',
           region=lambda q: q.x > hx - 0.45 and q.y > body_y + 0.1)
    p.bone('head', (hx, hy - head_r * 0.6, hz), (hx, top, hz), parent='neck',
           region=lambda q: (q - Vector(head_c)).length < head_r * 1.9 and q.y > hy - head_r * 1.15)
    for nm, pts, g in (ears or []):
        p.chain(nm, pts, 'head', group=g)
    if tail:
        pts, g = tail
        p.chain('tail', pts, 'body', group=g)
    for b in (extra or []):
        p.bone(*b[0], **b[1])


# =================================================================== DOG
def dog():
    p = Prop('prop_word_dog', base=WOOD, target_faces=5200, voxel=0.016)
    HY = 1.55
    sit_body(p, HY)
    p.blob((0, HY, 0.0), (0.62, 0.53, 0.54))                                   # head
    p.blob((0, HY - 0.16, 0.42), (0.28, 0.18, 0.2), group='muzzle')           # muzzle
    p.paint_group('muzzle', CREAM)
    p.decal('patch', (0.24, HY + 0.09), (0.19, 0.18, 0.3), BROWN)              # one brown eye patch
    # floppy ears hanging past the cheeks
    for s, n in ((-1, 'L'), (1, 'R')):
        p.curve([(s * 0.42, HY + 0.4, -0.02), (s * 0.62, HY + 0.2, 0.04), (s * 0.66, HY - 0.18, 0.1), (s * 0.62, HY - 0.36, 0.12)],
                [0.15, 0.18, 0.17, 0.13], group='ear' + n, flat=0.45, per=5)
        p.paint_group('ear' + n, BROWN)
    # wagging tail up behind
    p.curve([(0.05, 0.35, -0.48), (0.22, 0.62, -0.62), (0.32, 0.9, -0.62)], [0.11, 0.1, 0.085], group='tail', per=5)
    p.paint_group('tail', BROWN, only=lambda q: q.y > 0.8)
    # nose: a big ink button
    p.layer('nose', base=INK, target_faces=300, voxel=0.008)
    p.blob((0, HY - 0.06, 0.61), (0.13, 0.09, 0.09), group='n')
    p.layer('shine', base=WHITE, target_faces=60, voxel=0.005)
    p.blob((-0.05, HY - 0.025, 0.69), (0.035, 0.02, 0.012), group='h')
    # red collar with a yellow tag
    p.layer('collar', base=RED, target_faces=500, voxel=0.01)
    p.ring((0, 1.05, 0.05), 0.4, 0.07, rot=(-12, 0, 0), scale=(1.0, 0.92))
    p.layer('tag', base=YELLOW, target_faces=200, voxel=0.008)
    p.blob((0, 0.9, 0.46), (0.1, 0.1, 0.045), rot=(-15, 0, 0), group='t')
    p.layer('skin')
    sit_rig(p, HY, HY + 0.6,
            ears=[('ear.L', [(-0.5, HY + 0.3, 0.0), (-0.7, HY - 0.05, 0.08), (-0.68, HY - 0.45, 0.12)], 'earL'),
                  ('ear.R', [(0.5, HY + 0.3, 0.0), (0.7, HY - 0.05, 0.08), (0.68, HY - 0.45, 0.12)], 'earR')],
            tail=([(0.05, 0.35, -0.48), (0.22, 0.62, -0.62), (0.34, 0.98, -0.62)], 'tail'))
    p.face(center=(0, HY + 0.03, 0.0), radius=0.53, faceScale=FS, mouthZ=0.06, mouthY=-0.02)
    finish(p)


# =================================================================== MOUSE
def mouse():
    p = Prop('prop_word_mouse', base=GREY, target_faces=4400, voxel=0.013)
    HY = 1.2
    p.blob((0, 0.55, -0.02), (0.46, 0.55, 0.42))                               # egg body
    p.blob((0, 0.88, 0.02), (0.3, 0.26, 0.28))
    p.blob((0, HY, 0.02), (0.47, 0.41, 0.42))                                  # head
    p.blob((0, HY - 0.1, 0.36), (0.2, 0.16, 0.2), group='snout')               # pointy snout
    p.blob((0, HY - 0.12, 0.5), (0.11, 0.09, 0.1), group='snout')
    for s, n in ((-1, 'L'), (1, 'R')):
        p.blob((s * 0.33, 0.09, 0.3), (0.12, 0.08, 0.17), group='foot' + n)
        p.capsule((s * 0.22, 0.8, 0.28), (s * 0.15, 0.7, 0.38), 0.07, group='arm' + n)     # little arms at the chest
    p.decal('tummy', (0, 0.58), (0.28, 0.34, 0.4), CREAM)
    p.paint_group(['footL', 'footR'], PINK)
    p.paint_group(['armL', 'armR'], GREY)
    p.layer('hands', base=PINK, target_faces=200, voxel=0.007)
    for s in (-1, 1):
        p.blob((s * 0.13, 0.68, 0.42), (0.065, 0.06, 0.06), group='h%d' % s)
    p.layer('skin')
    # huge round ears (ROSE inside)
    for s, n in ((-1, 'L'), (1, 'R')):
        p.blob((s * 0.4, HY + 0.4, -0.06), (0.28, 0.28, 0.07), rot=(0, 0, s * -20), group='ear' + n)
        p.blob((s * 0.3, HY + 0.24, -0.06), (0.1, 0.1, 0.07), group='ear' + n)
    p.layer('inner', base=ROSE, target_faces=500, voxel=0.008)
    for s, n in ((-1, 'L'), (1, 'R')):
        p.blob((s * 0.41, HY + 0.41, 0.0), (0.19, 0.19, 0.035), rot=(0, 0, s * -20), group='i' + n)
    # pink nose
    p.layer('nose', base=PINK, target_faces=200, voxel=0.007)
    p.blob((0, HY - 0.1, 0.6), (0.065, 0.055, 0.05), group='n')
    # whiskers: two fat ink tubes each side
    p.layer('whisk', base=SLATE, target_faces=500, voxel=0.006)
    for s in (-1, 1):
        for k, dy in enumerate((0.03, -0.05)):
            p.tube([(s * 0.12, HY - 0.1 + dy, 0.5), (s * 0.3, HY - 0.08 + dy * 1.6, 0.52), (s * 0.44, HY - 0.06 + dy * 2.4, 0.46)], 0.022, rseg=8)
    # long pink tail curled round to the front
    p.layer('tailL', base=PINK, target_faces=700, voxel=0.01)
    tail = [(0, 0.18, -0.42), (0.3, 0.1, -0.48), (0.55, 0.09, -0.2), (0.6, 0.09, 0.15), (0.46, 0.1, 0.42), (0.24, 0.14, 0.52), (0.18, 0.24, 0.6)]
    p.tube(rounded(tail, 0.12, n=4), [0.055] * len(rounded(tail, 0.12, n=4)), rseg=10)
    p.layer('skin')
    sit_rig(p, HY, HY + 0.7,
            ears=[('ear.L', [(-0.28, HY + 0.25, -0.06), (-0.48, HY + 0.6, -0.06)], 'earL'),
                  ('ear.R', [(0.28, HY + 0.25, -0.06), (0.48, HY + 0.6, -0.06)], 'earR')])
    p.chain('tail', [(0, 0.18, -0.42), (0.55, 0.09, -0.2), (0.5, 0.1, 0.4), (0.18, 0.24, 0.6)], 'body',
            region=lambda q: q.y < 0.3 and (q.z < -0.35 or abs(q.x) > 0.42 or q.z > 0.45))
    p.face(center=(0, HY + 0.04, 0.02), radius=0.42, faceScale=FS, mouthZ=0.04)
    finish(p, outline=0.02)


# =================================================================== GOAT
def goat():
    p = Prop('prop_word_goat', base=WHITE, target_faces=5600, voxel=0.016)
    BY, HX, HYh, HZ = 0.86, 0.6, 1.58, 0.14
    quad_body(p, -0.05, BY, 0.5, 0.37, [(0.33, 0.2), (0.33, -0.2), (-0.45, 0.2), (-0.45, -0.2)], 0.12, hoof=GREY, hoof_h=0.13)
    p.capsule((0.38, BY + 0.15, 0.03), (HX, HYh - 0.3, HZ * 0.7), 0.22, r2=0.2, group='neckG')
    p.blob((HX, HYh, HZ), (0.42, 0.38, 0.38))                                   # head
    p.blob((HX, HYh - 0.2, HZ + 0.3), (0.24, 0.18, 0.2), group='snout')
    p.paint_group('snout', CREAM)
    # tan patches
    p.paint('p1', (-0.25, BY + 0.18, 0.3), (0.3, 0.22, 0.2), TAN)
    p.paint('p2', (0.15, BY + 0.05, -0.3), (0.28, 0.24, 0.2), TAN)
    p.paint('p3', (HX + 0.12, HYh + 0.2, HZ + 0.2), (0.16, 0.14, 0.3), TAN, only=lambda q: q.x > HX + 0.1)
    # sideways ears
    for s, n in ((-1, 'L'), (1, 'R')):
        p.blob((HX + s * 0.5, HYh + 0.08, HZ - 0.06), (0.23, 0.09, 0.12), rot=(0, 0, s * -18), group='ear' + n)
    # short upright tail
    p.curve([(-0.58, BY + 0.2, 0), (-0.66, BY + 0.38, 0), (-0.66, BY + 0.5, 0)], [0.09, 0.08, 0.06], group='tail', per=4)
    HORN = tint(TAN, -0.18)
    p.layer('horns', base=HORN, target_faces=600, voxel=0.009)
    for s in (-1, 1):
        hp = rounded([(HX + s * 0.15, HYh + 0.26, HZ + 0.02), (HX + s * 0.2, HYh + 0.56, HZ - 0.06), (HX + s * 0.27, HYh + 0.66, HZ - 0.3), (HX + s * 0.3, HYh + 0.58, HZ - 0.44)], 0.1, n=4)
        p.tube(hp, [0.1 - 0.06 * i / (len(hp) - 1) for i in range(len(hp))], rseg=10)
    p.layer('beard', base=HORN, target_faces=300, voxel=0.008)
    p.curve([(HX, HYh - 0.3, HZ + 0.33), (HX, HYh - 0.48, HZ + 0.31), (HX, HYh - 0.66, HZ + 0.26)], [0.09, 0.075, 0.04], group='b', per=4)
    p.layer('nose', base=INK, target_faces=200, voxel=0.006)
    for s in (-1, 1):
        p.blob((HX + s * 0.08, HYh - 0.14, HZ + 0.49), (0.035, 0.03, 0.03), group='n%d' % s)
    p.layer('skin')
    quad_rig(p, (HX, HYh, HZ), 0.4, HYh + 0.6, BY,
             ears=[('ear.L', [(HX - 0.3, HYh + 0.08, HZ - 0.06), (HX - 0.7, HYh + 0.0, HZ - 0.06)], 'earL'),
                   ('ear.R', [(HX + 0.3, HYh + 0.08, HZ - 0.06), (HX + 0.7, HYh + 0.0, HZ - 0.06)], 'earR')],
             tail=([(-0.58, BY + 0.15, 0), (-0.66, BY + 0.55, 0)], 'tail'),
             extra=[(('tuft', (HX, HYh - 0.3, HZ + 0.3), (HX, HYh - 0.68, HZ + 0.26)), dict(parent='head', region=lambda q: q.y < HYh - 0.3 and q.z > HZ + 0.15 and abs(q.x - HX) < 0.12))])
    p.face(center=(HX, HYh + 0.04, HZ), radius=0.38, faceScale=FS, mouthZ=0.05, mouthY=-0.01)
    finish(p, wide=True)


# =================================================================== DONKEY
def donkey():
    p = Prop('prop_word_donkey', base=GREY, target_faces=6000, voxel=0.017)
    BY, HX, HYh, HZ = 1.0, 0.68, 1.72, 0.14
    quad_body(p, -0.05, BY, 0.56, 0.43, [(0.38, 0.22), (0.38, -0.22), (-0.5, 0.22), (-0.5, -0.22)], 0.13, hoof=SLATE, hoof_h=0.14)
    p.capsule((0.42, BY + 0.18, 0.03), (HX, HYh - 0.3, HZ * 0.7), 0.25, r2=0.22, group='neckG')
    p.blob((HX, HYh, HZ), (0.44, 0.4, 0.4))
    p.blob((HX, HYh - 0.26, HZ + 0.3), (0.34, 0.25, 0.26), group='muzzle')    # big cream muzzle
    p.paint_group('muzzle', CREAM)
    p.decal('tummy', (-0.05, BY - 0.25), (0.45, 0.2, 0.3), CREAM)
    # very long upright ears
    for s, n in ((-1, 'L'), (1, 'R')):
        p.curve([(HX + s * 0.2, HYh + 0.3, HZ - 0.08), (HX + s * 0.3, HYh + 0.62, HZ - 0.06), (HX + s * 0.38, HYh + 0.95, HZ - 0.04)],
                [0.13, 0.15, 0.06], group='ear' + n, flat=0.5, per=5)
    p.paint_fn(lambda q, n: q.y > HYh + 0.88, SLATE)          # dark ear tips
    # tail with an ink tuft
    p.curve([(-0.62, BY + 0.2, 0), (-0.78, BY - 0.05, 0), (-0.8, BY - 0.35, 0.02)], [0.06, 0.05, 0.045], group='tail', per=4)
    p.layer('inner', base=ROSE, target_faces=300, voxel=0.008)
    for s in (-1, 1):
        p.blob((HX + s * 0.31, HYh + 0.64, HZ + 0.0), (0.06, 0.24, 0.03), rot=(0, 0, s * -15), group='i%d' % s)
    p.layer('mane', base=INK, target_faces=700, voxel=0.01)
    for k in range(6):
        t = k / 5
        x = 0.28 + (HX - 0.12 - 0.28) * t
        y = BY + 0.4 + (HYh + 0.32 - BY - 0.4) * t
        p.blob((x - 0.12, y + 0.16, 0), (0.085, 0.13, 0.075), rot=(0, 0, 35), group='m')
    p.blob((-0.8, BY - 0.42, 0.02), (0.1, 0.15, 0.1), group='tuft')
    p.layer('nostril', base=INK, target_faces=200, voxel=0.006)
    for s in (-1, 1):
        p.blob((HX + s * 0.12, HYh - 0.2, HZ + 0.55), (0.045, 0.035, 0.03), group='n%d' % s)
    p.layer('skin')
    quad_rig(p, (HX, HYh, HZ), 0.42, HYh + 1.0, BY,
             ears=[('ear.L', [(HX - 0.2, HYh + 0.28, HZ - 0.08), (HX - 0.3, HYh + 0.62, HZ - 0.06), (HX - 0.38, HYh + 0.98, HZ - 0.04)], 'earL'),
                   ('ear.R', [(HX + 0.2, HYh + 0.28, HZ - 0.08), (HX + 0.3, HYh + 0.62, HZ - 0.06), (HX + 0.38, HYh + 0.98, HZ - 0.04)], 'earR')],
             tail=([(-0.6, BY + 0.2, 0), (-0.78, BY - 0.05, 0), (-0.8, BY - 0.55, 0.02)], 'tail'),
             extra=[(('mane', (0.3, BY + 0.45, 0), (HX - 0.1, HYh + 0.4, 0)), dict(parent='neck', region=lambda q: q.y > BY + 0.35 and q.x < HX and abs(q.z) < 0.15 and q.x > 0.15))])
    p.face(center=(HX, HYh + 0.07, HZ), radius=0.4, faceScale=FS, mouthZ=0.1, mouthY=-0.04)
    finish(p, wide=True)


# =================================================================== GOOSE
def goose():
    p = Prop('prop_word_goose', base=WHITE, target_faces=4200, voxel=0.014)
    p.blob((0, 0.82, -0.08), (0.5, 0.46, 0.62), rot=(-14, 0, 0))               # body
    p.blob((0, 1.02, -0.62), (0.2, 0.14, 0.2), rot=(-40, 0, 0))               # tail point up behind
    p.curve([(0, 0.98, 0.34), (0, 1.22, 0.3), (0, 1.44, 0.12), (0, 1.7, 0.18), (0, 1.88, 0.3)], [0.21, 0.16, 0.145, 0.15, 0.17], group='neckG', per=5)
    HY, HZ = 2.0, 0.32
    p.blob((0, HY, HZ), (0.37, 0.33, 0.33), group='head')
    p.paint_fn(lambda q, n: q.z < -0.55 and q.y > 0.9, tint(GREY, 0.4))
    p.layer('wings', base=tint(GREY, 0.55), target_faces=700, voxel=0.011)
    for s in (-1, 1):
        p.blob((s * 0.45, 0.92, -0.08), (0.12, 0.28, 0.38), rot=(-22, s * 4, s * 6), group='w%d' % s)
        p.blob((s * 0.4, 1.04, -0.5), (0.08, 0.13, 0.26), rot=(-35, s * 8, s * 6), group='w%d' % s)
    p.layer('bill', base=ORANGE, target_faces=400, voxel=0.008)
    p.blob((0, HY - 0.1, HZ + 0.32), (0.15, 0.08, 0.17), group='b')
    p.blob((0, HY - 0.06, HZ + 0.26), (0.13, 0.08, 0.1), group='b')
    p.layer('feet', base=ORANGE, target_faces=900, voxel=0.01)
    for s in (-1, 1):
        g = 'f%d' % s
        p.capsule((s * 0.2, 0.45, 0.05), (s * 0.22, 0.1, 0.14), 0.075, group=g)
        p.blob((s * 0.24, 0.05, 0.3), (0.21, 0.05, 0.22), group=g)
        for k in (-1, 0, 1):
            p.blob((s * 0.24 + k * 0.13, 0.05, 0.47 - abs(k) * 0.04), (0.07, 0.05, 0.08), group=g)
    p.layer('skin')
    p.neck = (99, 99)
    p.bone('body', (0, 0.2, 0), (0, 1.0, 0))
    p.bone('neck', (0, 1.0, 0.28), (0, HY - 0.3, HZ), parent='body', region=lambda q: q.y > 1.05 and q.z > 0.0)
    p.bone('head', (0, HY - 0.3, HZ), (0, HY + 0.5, HZ), parent='neck', region=lambda q: q.y > HY - 0.32)
    for s, n in ((-1, 'L'), (1, 'R')):
        p.bone('wing.' + n, (s * 0.42, 1.12, -0.1), (s * 0.5, 0.62, -0.2), parent='body', group='w%d' % s)
    p.face(center=(0, HY + 0.02, HZ), radius=0.33, faceScale=FS, mouth=0)
    finish(p)


# =================================================================== TURKEY
def turkey():
    p = Prop('prop_word_turkey', base=BROWN, target_faces=3800, voxel=0.015)
    p.blob((0, 0.8, 0.02), (0.6, 0.58, 0.55))                                  # round body
    p.blob((0, 0.6, 0.1), (0.48, 0.38, 0.45))
    HY, HZ = 1.5, 0.22
    p.blob((0, 1.22, 0.16), (0.24, 0.24, 0.22), group='head')                  # neck
    p.blob((0, HY, HZ), (0.36, 0.33, 0.32), group='head')
    p.paint_group('head', tint(BROWN, 0.35), only=lambda q: q.y > 1.18)
    # fan tail: 7 fat feathers, banded YELLOW (tips) / ORANGE / RED (inner)
    p.layer('fan', base=RED, target_faces=1300, voxel=0.012)
    FC = Vector((0, 0.78, -0.42))
    for i in range(7):
        a = math.radians(-78 + 26 * i)
        d = Vector((math.sin(a), math.cos(a), 0))
        c0 = FC + d * 0.7 - Vector((0, 0, 0.04 * abs(i - 3)))
        p.blob(tuple(c0), (0.22, 0.62, 0.07), rot=(0, 0, -math.degrees(a)), group='f%d' % i)
    p.paint_fn(lambda q, n: (Vector((q.x, q.y, 0)) - Vector((FC.x, FC.y, 0))).length > 1.0, YELLOW)
    p.paint_fn(lambda q, n: 0.68 < (Vector((q.x, q.y, 0)) - Vector((FC.x, FC.y, 0))).length <= 1.0, ORANGE)
    p.layer('wings', base=tint(BROWN, -0.2), target_faces=600, voxel=0.011)
    for s in (-1, 1):
        p.blob((s * 0.56, 0.86, 0.02), (0.11, 0.28, 0.32), rot=(-25, 0, s * 10), group='w%d' % s)
        p.blob((s * 0.52, 0.66, -0.26), (0.08, 0.14, 0.2), rot=(-40, 0, s * 10), group='w%d' % s)
    p.layer('beak', base=YELLOW, target_faces=300, voxel=0.007)
    p.blob((0, HY - 0.06, HZ + 0.36), (0.09, 0.07, 0.1), group='b')
    p.blob((0, HY - 0.1, HZ + 0.43), (0.05, 0.05, 0.06), rot=(30, 0, 0), group='b')
    p.layer('wattle', base=RED, target_faces=400, voxel=0.008)
    p.curve([(0.04, HY - 0.13, HZ + 0.34), (0.08, HY - 0.3, HZ + 0.34), (0.08, HY - 0.42, HZ + 0.3)], [0.065, 0.075, 0.06], group='wa', per=4)
    p.layer('feet', base=ORANGE, target_faces=500, voxel=0.009)
    for s in (-1, 1):
        for k in (-1, 0, 1):
            p.blob((s * 0.25 + k * 0.1, 0.06, 0.45 + (0.04 if k == 0 else 0)), (0.055, 0.06, 0.12), rot=(0, k * 20, 0), group='t%d%d' % (s, k))
    p.layer('skin')
    p.bone('body', (0, 0.15, 0), (0, 1.15, 0))
    p.bone('head', (0, 1.15, HZ), (0, HY + 0.5, HZ), parent='body', region=lambda q: q.y > 1.18 and q.z > -0.1)
    p.bone('fan', (0, 0.78, -0.42), (0, 1.6, -0.46), parent='body', group=['f%d' % i for i in range(7)])
    p.bone('wattle', (0.06, HY - 0.12, HZ + 0.34), (0.08, HY - 0.45, HZ + 0.3), parent='head', group='wa')
    for s, n in ((-1, 'L'), (1, 'R')):
        p.bone('wing.' + n, (s * 0.5, 1.05, 0), (s * 0.6, 0.55, 0), parent='body', group='w%d' % s)
    p.face(center=(0, HY + 0.04, HZ), radius=0.34, faceScale=FS, mouth=0)
    finish(p, wide=True)


# =================================================================== BIRD
def bird():
    p = Prop('prop_word_bird', base=BLUE, target_faces=3600, voxel=0.012)
    BYc = 0.72
    p.blob((0, BYc, 0), (0.42, 0.4, 0.4))
    p.blob((0, 1.14, 0.04), (0.38, 0.34, 0.35))                                 # head (melts in: a round songbird)
    p.blob((0, 0.8, -0.36), (0.16, 0.07, 0.2), rot=(-40, 0, 0), group='tail')   # pointed tail up behind
    p.blob((0, 0.98, -0.56), (0.14, 0.055, 0.24), rot=(-42, 0, 0), group='tail')
    p.blob((0, 1.14, -0.72), (0.1, 0.045, 0.12), rot=(-42, 0, 0), group='tail')
    p.decal('breast', (0, 0.7), (0.3, 0.36, 0.45), ORANGE)
    p.decal('chin', (0, 0.95), (0.2, 0.12, 0.4), ORANGE)
    p.paint_group('tail', tint(BLUE, -0.2))
    p.layer('wings', base=tint(BLUE, -0.2), target_faces=600, voxel=0.009)
    for s in (-1, 1):
        p.blob((s * 0.4, 0.78, -0.08), (0.1, 0.24, 0.3), rot=(-25, 0, s * 12), group='w%d' % s)
    p.layer('beak', base=YELLOW, target_faces=200, voxel=0.006)
    p.blob((0, 1.08, 0.4), (0.09, 0.07, 0.07), group='b')
    p.blob((0, 1.07, 0.47), (0.05, 0.04, 0.05), group='b')
    p.layer('twig', base=WOOD, target_faces=700, voxel=0.01)
    p.tube([(-0.68, 0.11, 0.08), (-0.2, 0.1, 0.06), (0.3, 0.11, 0.05), (0.66, 0.12, 0.08)], [0.1, 0.105, 0.1, 0.09], rseg=12)
    p.capsule((0.42, 0.15, 0.06), (0.56, 0.36, -0.02), 0.065, r2=0.055, group='side')
    p.paint_fn(lambda q, n: n.x > 0.75 and q.x > 0.64 or n.x < -0.75 and q.x < -0.66, TAN)
    p.layer('leaf', base=GREEN, target_faces=200, voxel=0.007)
    p.blob((0.6, 0.44, -0.02), (0.1, 0.035, 0.15), rot=(0, 30, -30), group='l')
    p.layer('feet', base=ORANGE, target_faces=300, voxel=0.006)
    for s in (-1, 1):
        for k in (-1, 0, 1):
            p.blob((s * 0.14 + k * 0.05, 0.2, 0.15), (0.03, 0.06, 0.04), rot=(-30, 0, 0), group='t%d%d' % (s, k))
    p.layer('skin')
    p.bone('body', (0, 0.25, 0), (0, 0.95, 0))
    p.bone('head', (0, 0.95, 0.04), (0, 1.6, 0.04), parent='body', region=lambda q: q.y > 0.9 and q.z > -0.3)
    for s, n in ((-1, 'L'), (1, 'R')):
        p.bone('wing.' + n, (s * 0.36, 0.98, -0.06), (s * 0.44, 0.55, -0.12), parent='body', group='w%d' % s)
    p.face(center=(0, 1.15, 0.04), radius=0.34, faceScale=FS, mouth=0)
    finish(p, outline=0.02)


# =================================================================== SQUIRREL
def squirrel():
    p = Prop('prop_word_squirrel', base=ORANGE, target_faces=6000, voxel=0.014)
    HY = 1.28
    k = 0.82
    sit_body(p, HY, k=k)
    p.blob((0, HY, 0.02), (0.46, 0.41, 0.42))                                  # head
    p.blob((0, HY - 0.13, 0.33), (0.2, 0.14, 0.15), group='snout')
    p.paint_group('snout', CREAM)
    # small tufted ears
    for s, n in ((-1, 'L'), (1, 'R')):
        p.curve([(s * 0.25, HY + 0.3, -0.04), (s * 0.31, HY + 0.46, -0.04), (s * 0.35, HY + 0.6, -0.05)], [0.12, 0.08, 0.04], group='ear' + n, flat=0.55, per=4)
    # enormous bushy tail: up behind and curling over the head in an S
    TP = [(0.05, 0.3, -0.38), (0.12, 0.62, -0.8), (0.2, 1.15, -0.9), (0.28, 1.62, -0.74), (0.36, 1.88, -0.42), (0.42, 1.86, -0.14), (0.44, 1.72, -0.04)]
    p.curve(TP, [0.2, 0.32, 0.37, 0.34, 0.27, 0.2, 0.14], group='tail', per=5)
    p.paint_group('tail', CREAM, only=lambda q: q.z > -0.07 and q.y > 1.58)
    # the acorn held in both paws (paws are the front legs bent up)
    p.layer('nut', base=tint(BROWN, 0.25), target_faces=500, voxel=0.008)
    p.blob((0, 0.82, 0.44), (0.15, 0.17, 0.14), group='nut')
    p.layer('cap', base=tint(BROWN, -0.25), target_faces=400, voxel=0.008)
    p.blob((0, 0.95, 0.44), (0.17, 0.08, 0.16), group='cap')
    p.capsule((0, 1.02, 0.44), (0.03, 1.08, 0.45), 0.03, group='stk')
    p.layer('paws', base=ORANGE, target_faces=500, voxel=0.009)
    for s in (-1, 1):
        p.capsule((s * 0.2, 0.98, 0.25), (s * 0.15, 0.84, 0.44), 0.08, group='p%d' % s)
    p.layer('nose', base=INK, target_faces=150, voxel=0.006)
    p.blob((0, HY - 0.08, 0.48), (0.055, 0.04, 0.04), group='n')
    p.layer('skin')
    sit_rig(p, HY, HY + 0.6,
            ears=[('ear.L', [(-0.25, HY + 0.3, -0.04), (-0.35, HY + 0.62, -0.05)], 'earL'),
                  ('ear.R', [(0.25, HY + 0.3, -0.04), (0.35, HY + 0.62, -0.05)], 'earR')],
            tail=([(0.05, 0.3, -0.42), (0.16, 0.95, -0.88), (0.3, 1.66, -0.72), (0.44, 1.76, -0.02)], 'tail'))
    p.face(center=(0, HY + 0.04, 0.02), radius=0.41, faceScale=FS, mouthZ=0.04)
    finish(p)


# =================================================================== FOX
def fox():
    p = Prop('prop_word_fox', base=ORANGE, target_faces=6000, voxel=0.016)
    HY = 1.55
    sit_body(p, HY, legcol=INK)
    p.paint_group(['legFL', 'legFR'], ORANGE, only=lambda q: q.y > 0.42)
    p.blob((0, HY, 0.0), (0.6, 0.5, 0.52))                                     # head
    p.blob((0, HY - 0.15, 0.4), (0.24, 0.15, 0.2), group='snout')             # pointed muzzle
    p.blob((0, HY - 0.15, 0.56), (0.13, 0.1, 0.12), group='snout')
    p.mirror(lambda s: p.blob((s * 0.38, HY - 0.2, 0.2), (0.24, 0.17, 0.22)))  # cheek fluff
    p.decal('chest', (0, 0.95), (0.24, 0.3, 0.3), WHITE)
    p.mirror(lambda s: p.decal('cheek%d' % s, (s * 0.3, HY - 0.24), (0.3, 0.2, 0.5), WHITE))
    p.decal('chin', (0, HY - 0.36), (0.22, 0.12, 0.5), WHITE)
    p.paint_group('snout', WHITE)
    # big triangle ears with ink tips
    for s, n in ((-1, 'L'), (1, 'R')):
        p.curve([(s * 0.36, HY + 0.32, -0.05), (s * 0.47, HY + 0.6, -0.04), (s * 0.56, HY + 0.92, -0.02)], [0.28, 0.18, 0.04], group='ear' + n, flat=0.42, per=6)
        p.blob((s * 0.45, HY + 0.52, 0.06), (0.13, 0.22, 0.07), rot=(0, 0, s * 18), group='ear' + n, negative=True)
    p.paint_fn(lambda q, n: q.y > HY + 0.72, INK)
    # fat bushy tail wrapped round to the front, white tip
    TP = [(0.24, 0.32, -0.44), (0.6, 0.3, -0.22), (0.72, 0.29, 0.16), (0.6, 0.25, 0.5), (0.44, 0.2, 0.66)]
    p.curve(TP, [0.2, 0.27, 0.26, 0.21, 0.13], group='tail', per=5)
    p.paint_group('tail', WHITE, only=lambda q: q.z > 0.5)
    p.layer('nose', base=INK, target_faces=150, voxel=0.006)
    p.blob((0, HY - 0.12, 0.69), (0.075, 0.055, 0.05), group='n')
    p.layer('skin')
    sit_rig(p, HY, HY + 0.6,
            ears=[('ear.L', [(-0.38, HY + 0.32, -0.05), (-0.56, HY + 0.94, -0.02)], 'earL'),
                  ('ear.R', [(0.38, HY + 0.32, -0.05), (0.56, HY + 0.94, -0.02)], 'earR')],
            tail=([(0.24, 0.3, -0.44), (0.7, 0.23, -0.02), (0.62, 0.2, 0.48), (0.44, 0.19, 0.7)], 'tail'))
    p.face(center=(0, HY + 0.03, 0.0), radius=0.5, faceScale=FS, mouthZ=0.06, mouthY=-0.02)
    finish(p)


# =================================================================== DEER
def deer():
    p = Prop('prop_word_deer', base=tint(BROWN, 0.2), target_faces=6000, voxel=0.016)
    BY, HX, HYh, HZ = 1.02, 0.56, 1.78, 0.14
    quad_body(p, -0.05, BY, 0.5, 0.34, [(0.32, 0.17), (0.32, -0.17), (-0.43, 0.17), (-0.43, -0.17)], 0.1, hoof=tint(BROWN, -0.35), hoof_h=0.12)
    p.capsule((0.34, BY + 0.12, 0.03), (HX, HYh - 0.3, HZ * 0.7), 0.2, r2=0.18, group='neckG')
    p.blob((HX, HYh, HZ), (0.42, 0.38, 0.38))
    p.blob((HX, HYh - 0.18, HZ + 0.3), (0.2, 0.16, 0.18), group='snout')
    p.paint_group('snout', CREAM)
    p.decal('tummy', (-0.05, BY - 0.22), (0.42, 0.18, 0.3), CREAM)
    # big sideways ears
    for s, n in ((-1, 'L'), (1, 'R')):
        p.blob((HX + s * 0.5, HYh + 0.16, HZ - 0.06), (0.26, 0.12, 0.08), rot=(0, 0, s * -22), group='ear' + n)
    # white spots on the back
    for i, (x, z) in enumerate([(-0.4, 0.15), (-0.2, 0.24), (0.0, 0.2), (0.18, 0.26), (-0.3, -0.05), (-0.05, 0.0), (0.15, 0.02), (-0.45, -0.15)]):
        p.paint('s%d' % i, (x, BY + 0.3, z), (0.065, 0.12, 0.065), WHITE)
        p.paint('t%d' % i, (x, BY + 0.3, -z), (0.065, 0.12, 0.065), WHITE)
    p.curve([(-0.55, BY + 0.2, 0), (-0.64, BY + 0.32, 0), (-0.64, BY + 0.4, 0)], [0.09, 0.08, 0.06], group='tail', per=4)
    p.paint_group('tail', WHITE)
    p.layer('inner', base=ROSE, target_faces=300, voxel=0.007)
    for s in (-1, 1):
        p.blob((HX + s * 0.52, HYh + 0.17, HZ + 0.01), (0.16, 0.06, 0.03), rot=(0, 0, s * -22), group='i%d' % s)
    p.layer('antlers', base=WOOD, target_faces=700, voxel=0.008)
    for s in (-1, 1):
        p.tube(rounded([(HX + s * 0.14, HYh + 0.3, HZ - 0.04), (HX + s * 0.2, HYh + 0.55, HZ - 0.06), (HX + s * 0.32, HYh + 0.72, HZ - 0.1)], 0.08, n=3),
               0.05, rseg=10)
        p.tube([(HX + s * 0.19, HYh + 0.5, HZ - 0.06), (HX + s * 0.1, HYh + 0.66, HZ - 0.04)], 0.042, rseg=10)
    p.layer('nose', base=INK, target_faces=150, voxel=0.006)
    p.blob((HX, HYh - 0.12, HZ + 0.47), (0.08, 0.05, 0.04), group='n')
    p.layer('skin')
    quad_rig(p, (HX, HYh, HZ), 0.4, HYh + 0.75, BY,
             ears=[('ear.L', [(HX - 0.3, HYh + 0.1, HZ - 0.06), (HX - 0.74, HYh + 0.26, HZ - 0.06)], 'earL'),
                   ('ear.R', [(HX + 0.3, HYh + 0.1, HZ - 0.06), (HX + 0.74, HYh + 0.26, HZ - 0.06)], 'earR')],
             tail=([(-0.55, BY + 0.15, 0), (-0.64, BY + 0.45, 0)], 'tail'))
    p.face(center=(HX, HYh + 0.04, HZ), radius=0.38, faceScale=FS, mouthZ=0.05)
    finish(p, wide=True)


# =================================================================== TURTLE
def turtle():
    SKIN = tint(GREEN, 0.35)
    p = Prop('prop_word_turtle', base=SKIN, target_faces=3000, voxel=0.014)
    # body under the shell: four flipper feet, a head poking out at the front (+x end), a tiny tail
    p.blob((0, 0.3, 0), (0.7, 0.2, 0.55))
    for i, (x, z) in enumerate([(0.5, 0.44), (0.5, -0.44), (-0.52, 0.42), (-0.52, -0.42)]):
        p.blob((x, 0.1, z), (0.21, 0.1, 0.15), rot=(0, 35 if x * z > 0 else -35, 0), group='fl%d' % i)
    HX, HY, HZ = 0.98, 0.46, 0.2
    p.capsule((0.6, 0.32, 0.06), (HX - 0.12, HY - 0.06, HZ * 0.8), 0.15, group='neckG')
    p.blob((HX, HY, HZ), (0.29, 0.25, 0.27), group='head')
    p.blob((HX + 0.07, HY - 0.05, HZ + 0.08), (0.22, 0.18, 0.21), group='head')
    p.blob((-0.82, 0.22, 0), (0.12, 0.07, 0.07), group='tail')
    # the shell: a dome (ellipsoid top) with soft raised plates, painted as 7 crisp LEAF hexagons on GREEN
    A, B, C, Y0 = 0.8, 0.74, 0.64, 0.26
    p.layer('shell', base=GREEN, target_faces=2000, voxel=0.011)
    def dome_pt(u, v):
        x, y, z = A * math.sin(u) * math.sin(v), Y0 + B * math.cos(u), C * math.sin(u) * math.cos(v)
        n = Vector((x / A ** 2, (y - Y0) / B ** 2, z / C ** 2)).normalized()
        return Vector((x, y, z)), n
    plates = [dome_pt(0.0, 0.0) + (0.25,)] + [dome_pt(0.98, math.tau * k / 6) + (0.23,) for k in range(6)]
    frames = []
    for c, n, r in plates:
        t1 = Vector((0, 0, 1)).cross(n) if abs(n.z) < 0.9 else Vector((1, 0, 0))
        t1 = t1.normalized() if t1.length > 1e-3 else Vector((1, 0, 0))
        t2 = n.cross(t1).normalized()
        frames.append((c, n, r, t1, t2))
    AX = [(math.cos(math.pi / 6 + k * math.pi / 3), math.sin(math.pi / 6 + k * math.pi / 3)) for k in range(3)]

    def in_plate(q, nq):
        if q.y < Y0 + 0.12:
            return False
        for c, n, r, t1, t2 in frames:
            d = q - c
            if d.length > r * 1.4:
                continue
            a, b = d.dot(t1), d.dot(t2)
            if max(abs(a * ax + b * ay) for ax, ay in AX) < r * 0.8:
                return True
        return False
    # the dome as a displaced grid: points inside a plate are pushed out a little (raised plates, soft-edged by the remesh)
    NU, NV = 28, 72
    verts, faces = [], []
    for i in range(NU + 1):
        u = math.pi / 2 * i / NU
        for j in range(NV):
            v = math.tau * j / NV
            c, n = dome_pt(u, v)
            if 0 < i:
                c = c + n * (0.045 if in_plate(c, n) else 0.0)
            verts.append(tuple(c))
    for i in range(NU):
        for j in range(NV):
            j2 = (j + 1) % NV
            faces.append((i * NV + j, i * NV + j2, (i + 1) * NV + j2, (i + 1) * NV + j))
    bc = len(verts); verts.append((0, Y0, 0))
    for j in range(NV):
        faces.append((bc, NU * NV + (j + 1) % NV, NU * NV + j))
    p.mesh(verts, faces)
    p.paint_fn(lambda q, n: in_plate(q - n * 0.03, n), LEAF)
    p.layer('rim', base=YELLOW, target_faces=700, voxel=0.01)
    p.ring((0, Y0 + 0.02, 0), 1.0, 0.08, scale=(A + 0.02, C + 0.02), seg=48)
    p.layer('skin')
    p.neck = (99, 99)
    p.bone('body', (0, 0.05, 0), (0, 0.6, 0))
    p.bone('head', (HX, HY - 0.3, HZ), (HX, HY + 0.45, HZ), parent='body', region=lambda q: q.x > 0.62 and q.y > 0.2)
    p.bone('tail', (-0.72, 0.22, 0), (-0.94, 0.22, 0), parent='body', region=lambda q: q.x < -0.7)
    p.face(center=(HX + 0.02, HY + 0.03, HZ), radius=0.27, faceScale=FS, mouthZ=0.04)
    finish(p, outline=0.022, wide=True)


# =================================================================== BUTTERFLY (word-card variant: upright, wings open to the child)
def butterfly():
    UP, LO, SPOT, BODY = PURPLE, PINK, YELLOW, tint(SLATE, -0.25)
    p = Prop('prop_word_butterfly', base=BODY, target_faces=900, voxel=0.012)
    # a plump upright body and a round head (code face), facing +z
    p.capsule((0, 0.32, 0.02), (0, 1.02, 0.02), 0.12, r2=0.14, group='body')
    p.blob((0, 1.27, 0.04), (0.27, 0.25, 0.24), group='head')
    p.paint_group('head', tint(SLATE, 0.5))
    p.paint_fn(lambda q, n: q.y < 1.03 and abs(((q.y - 0.3) % 0.18) - 0.09) < 0.025, tint(SLATE, 0.2))

    def wing(s, cx, cy, rx, ry, tilt, col, name, spots):
        p.layer(name, base=col, target_faces=380, voxel=0.011)
        # a flat rounded wing, opened slightly back in a V (yaw), its flat side to the child
        p.blob((s * cx, cy, -0.06), (rx, ry, 0.045), rot=(0, s * 22, s * tilt), group=name + 'w')
        p.paint_fn(lambda q, n, s=s: (abs(q.x) - cx) ** 2 / rx ** 2 + (q.y - cy) ** 2 / ry ** 2 > 0.72, tint(col, -0.25))
        p.layer('spots', base=SPOT, target_faces=300, voxel=0.007)
        for i, (dx, dy, r) in enumerate(spots):
            x = s * (cx + dx)
            z = -0.06 + 0.05 + (abs(x) - cx) * -math.tan(math.radians(22)) * 1.0
            p.blob((x, cy + dy, z), (r, r, 0.02), rot=(0, s * 22, 0), group='%s%d' % (name, i))
    for s, n in ((-1, 'L'), (1, 'R')):
        wing(s, 0.5, 1.05, 0.48, 0.36, -25, UP, 'wingU' + n, [(0.12, 0.08, 0.1), (-0.12, -0.06, 0.07)])
        wing(s, 0.38, 0.45, 0.32, 0.3, 30, LO, 'wingD' + n, [(0.06, -0.04, 0.08)])
    # antennae with ball tips (spring)
    p.layer('antennae', base=BODY, target_faces=300, voxel=0.007)
    for s in (-1, 1):
        p.tube([(s * 0.08, 1.45, 0.02), (s * 0.18, 1.64, 0.0), (s * 0.28, 1.76, -0.02)], 0.03, rseg=8)
        p.blob((s * 0.29, 1.78, -0.02), (0.065, 0.065, 0.065), group='tip%d' % s)
    p.layer('skin')
    p.neck = (99, 99)
    p.bone('body', (0, 0.2, 0), (0, 1.05, 0))
    p.bone('head', (0, 1.06, 0.04), (0, 1.55, 0.04), parent='body', region=lambda q: q.y > 1.04 and abs(q.x) < 0.32 and abs(q.z) < 0.4)
    for s, n in ((-1, 'L'), (1, 'R')):
        p.bone('wing.' + n, (s * 0.08, 0.8, -0.04), (s * 0.85, 0.8, -0.2), parent='body', group=['wingU%sw' % n, 'wingD%sw' % n])
        p.chain('antenna.' + n, [(s * 0.08, 1.45, 0.02), (s * 0.18, 1.64, 0.0), (s * 0.29, 1.78, -0.02)], 'head',
                region=lambda q, s=s: q.y > 1.45 and q.x * s > 0.04)
    p.face(center=(0, 1.28, 0.04), radius=0.24, faceScale=FS, mouthZ=0.02)
    ground(p)
    finish(p, outline=0.022, wide=True)


MODELS = dict(prop_word_dog=dog, prop_word_mouse=mouse, prop_word_goat=goat, prop_word_donkey=donkey, prop_word_goose=goose,
              prop_word_turkey=turkey, prop_word_bird=bird, prop_word_squirrel=squirrel, prop_word_fox=fox, prop_word_deer=deer,
              prop_word_turtle=turtle, prop_word_butterfly=butterfly)
for name, fn in MODELS.items():
    if not ONLY or name in ONLY:
        fn()
