"""VOCAB.md batch 2b: sea, bird, desert and tiny animals (words 47-60). One script, several models (ONLY=prop_word_whale,...).
Shares the figurine helpers of prop_words_animals2a.py (Fig, Frame, palette, face size), so the whole batch is one toy box.
  prop_word_whale     a big blue teardrop along x, small upturned fluke, a white three-drop spout (spout bone rises)
  prop_word_dolphin   a leaping arc out of a little white splash base: beak, curved fin, forked tail
  prop_word_shark     a friendly slate torpedo: tall back fin, crescent tail, a smile of rounded white teeth, gill lines
  prop_word_octopus   a big purple dome on eight fat curled arms (four front arms spring: tailArmA..D), rose suckers
  prop_word_seal      lying with head and chest raised, flippers, whisker pads with whisker tubes, ink nose
  prop_word_parrot    red, on a wood perch stand, wings banded yellow then blue, long tail past the perch, hooked beak
  prop_word_flamingo  pink, standing on one fat leg, S neck, bent beak with an ink tip
  prop_word_camel     tan, two big humps, long U-curved neck, droopy lip, broad feet
  prop_word_yak       stocky, a shaggy brown coat to the ground in scalloped locks, wide cream horns, forelock
  prop_word_ant       dark brown, three clear beads along x on a thin waist, six thin elbowed legs, elbowed club feelers
Word-card variants of reused models (the originals stay untouched):
  prop_word_starfish  orange baked in, upright in a little sand mound and leaning back toward the camera, bumpy, no face
  prop_word_spider    a lighter purple spider raised on eight fat arched legs, cute code face
Sea animals and the ant lie along x (front toward +x); their code face is turned toward the camera with the head."""
import sys, os, math, random
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from prop_words_animals2a import *          # Fig, Frame, Ry, ell, seg_dist, polyline_param, quad_body, palette, FACE_*
from mathutils import Vector, Euler


# =====================================================================================================
# WHALE
# =====================================================================================================
def whale():
    c = Fig('prop_word_whale', BLUE, 5500, voxel=0.017, outline=0.028)
    c.target_faces = 3000
    # big rounded teardrop, flat-ish tummy, tail stock curving up to a small fluke
    c.blob((0.2, 0.66, 0), (0.86, 0.64, 0.62))
    c.blob((0.5, 0.6, 0), (0.6, 0.58, 0.58))
    c.blob((-0.42, 0.6, 0), (0.5, 0.44, 0.44))
    stock = [(-0.7, 0.62, 0), (-1.0, 0.7, 0), (-1.2, 0.88, 0)]
    c.curve(stock, [0.3, 0.2, 0.13], group='main')
    F = Vector((-1.26, 0.98, 0))
    for s in (-1, 1):
        c.blob(tuple(F + Vector((-0.12, 0.0, s * 0.2))), (0.24, 0.07, 0.17), rot=(s * 10, s * 32, 18), group='fluke%d' % s)
    # side flippers
    for s in (-1, 1):
        c.blob((0.42, 0.28, s * 0.58), (0.24, 0.07, 0.13), rot=(s * 25, -30 * s, -20), group='flip%d' % s)
    # pale grooved tummy
    def tummy(p, n):
        return p.y < 0.42 and p.x > -0.75 and c.owner(p) == 'main'
    c.paint_fn(tummy, SKY)
    c.paint_fn(lambda p, n: tummy(p, n) and p.y < 0.36 and p.z > -0.5 and ((p.y + 0.02) / 0.09) % 1 < 0.3 and p.y > 0.06, lite(SKY, 0.45))
    # spout: three fat white drops on a little stem
    c.lay('spout', WHITE, 1100, voxel=0.01)
    S0 = Vector((0.42, 1.3, 0))
    c.capsule(tuple(S0 - Vector((0, 0.06, 0))), tuple(S0 + Vector((0, 0.24, 0))), 0.07, r2=0.09, group='stem')
    for k, (dx, dy, ang) in enumerate(((0, 0.52, 0), (-0.26, 0.4, 35), (0.26, 0.4, -35))):
        P = S0 + Vector((dx, dy, 0))
        c.blob(tuple(P), (0.12, 0.13, 0.12), group='d%d' % k)
        c.blob(tuple(P + Vector((math.sin(math.radians(ang)) * 0.11, 0.12, 0))), (0.06, 0.09, 0.06), rot=(0, 0, ang), group='d%d' % k)
    c.paint_fn(lambda p, n: c.owner(p) == 'stem' and p.y < S0.y + 0.12, SKY)
    c.layer('skin')
    c.neck = (0, 0)
    c.bone('body', (0.0, 0.2, 0), (0.0, 1.1, 0))
    c.bone('head', (0.3, 0.3, 0), (0.3, 1.2, 0), parent='body', region=lambda q: q.x > 0.15)
    c.chain('tail', [(-0.62, 0.62, 0), (-1.0, 0.7, 0), (-1.42, 1.02, 0)], 'body', region=lambda q: q.x < -0.6)
    c.bone('spout', tuple(S0 - Vector((0, 0.1, 0))), tuple(S0 + Vector((0, 0.6, 0))), parent='body', region=lambda q: c._cur == 'spout')
    c.rigid['spout'] = 'spout'
    c.face(center=(0.5, 0.74, 0.2), radius=0.52, faceScale=FACE_S, eyeSize=EYE, yaw=48, fit=1)
    c.build()


# =====================================================================================================
# DOLPHIN
# =====================================================================================================
def dolphin():
    BODY = mix(SKY, GREY, 0.5)
    c = Fig('prop_word_dolphin', BODY, 5500, voxel=0.014)
    c.target_faces = 3000
    c.quadriflow = False                 # quadriflow collapses the thin fins
    spine = [(-0.82, 0.32, 0), (-0.55, 0.72, 0), (-0.15, 1.06, 0), (0.3, 1.16, 0), (0.66, 1.02, 0), (0.86, 0.88, 0)]
    rad = [0.09, 0.2, 0.31, 0.33, 0.28, 0.2]
    c.curve(spine, rad, group='main', per=5)
    c.capsule((0.86, 0.88, 0), (1.18, 0.74, 0), 0.11, r2=0.075, group='beak')
    # dorsal fin, flippers, forked tail: flat rounded plates (mesh slabs)
    c.slab([(0.2, 0), (0.04, 0.16), (-0.12, 0.3), (-0.3, 0.38), (-0.24, 0.16), (-0.24, 0)], (0.02, 1.3, 0), (1, 0, 0), (0, 1, 0), 0.11, r=0.04)
    for s in (-1, 1):
        A = Vector((-0.45, -0.8, 0)).normalized()
        B = Vector((0, -0.25, s)).normalized()
        c.slab([(0.0, -0.08), (0.22, -0.04), (0.36, 0.1), (0.3, 0.24), (0.1, 0.18), (0.0, 0.08)], (0.46, 0.86, s * 0.2), A, B, 0.08, r=0.05)
    for sgn in (-1, 1):                          # forked tail: two lobes in a V at the tail tip
        c.slab([(0.0, -0.06), (0.24, -0.04), (0.32, 0.08), (0.22, 0.12), (0.0, 0.06)], (-0.84, 0.34, 0),
               Vector((-0.55, 0.62 * sgn, 0)).normalized(), Vector((0.62 * sgn, 0.55, 0)).normalized() * sgn, 0.08, r=0.04)
    # white tummy: the underside of the arc
    P = [Vector(q) for q in spine]
    def under(p, n):
        if c.owner(p) not in ('main', 'beak'):
            return False
        best = (1e9, None, None)
        for a, b in zip(P, P[1:]):
            d, t = seg_dist(p, a, b)
            if d < best[0]:
                best = (d, a.lerp(b, t), (b - a).normalized())
        ctr, tan = best[1], best[2]
        up = Vector((-tan.y, tan.x, 0))
        return (Vector(p) - ctr).normalized().dot(up) < -0.25 and abs(p.z) < 0.3
    c.paint_fn(under, WHITE)
    # splash base: a flat white puddle with a crown of fat drops round the tail
    c.lay('splash', WHITE, 1600, voxel=0.011)
    c.cyl((-0.55, 0.0, 0), 0.5, 0.08, r2=0.46, bevel=0.04, scale=(1.0, 0.8))
    for k in range(7):
        a = TAU * k / 7 + 0.3
        q = Vector((-0.55 + math.cos(a) * 0.36, 0.12, math.sin(a) * 0.28))
        c.blob(tuple(q), (0.08, 0.12, 0.08), group='sd%d' % k)
        c.blob(tuple(q + Vector((math.cos(a) * 0.08, 0.14, math.sin(a) * 0.06))), (0.055, 0.06, 0.055), group='sd%d' % k)
    c.paint_fn(lambda p, n: p.y < 0.075 and n.y > 0.4, SKY)
    c.layer('skin')
    c.neck = (0, 0)
    c.bone('body', (-0.2, 0.3, 0), (-0.2, 1.2, 0))
    c.bone('head', (0.5, 0.7, 0), (0.5, 1.5, 0), parent='body', region=lambda q: q.x > 0.4 and c._cur == 'skin')
    c.chain('tail', [(-0.45, 0.8, 0), (-0.75, 0.42, 0), (-0.95, 0.12, 0)], 'body', region=lambda q: q.x < -0.45 and c._cur == 'skin')
    c.rigid['splash'] = 'body'
    c.face(center=(0.62, 1.04, 0.06), radius=0.36, faceScale=FACE_S, eyeSize=EYE * 1.25, yaw=40, fit=1)
    c.build()


# =====================================================================================================
# SHARK
# =====================================================================================================
def shark():
    c = Fig('prop_word_shark', SLATE, 5500, voxel=0.016, outline=0.028)
    c.target_faces = 3000
    c.blob((0.05, 0.56, 0), (0.92, 0.46, 0.44))
    c.blob((0.55, 0.56, 0), (0.5, 0.44, 0.42))
    c.curve([(-0.7, 0.58, 0), (-1.05, 0.64, 0), (-1.25, 0.7, 0)], [0.32, 0.18, 0.11])
    # tall triangle back fin, crescent tail, low side fins
    c.slab([(0.32, 0.0), (0.02, 0.62), (-0.12, 0.66), (-0.3, 0.0)], (0.0, 0.88, 0), (1, 0, 0), (0, 1, 0), 0.12, r=0.06)
    c.slab([(0.12, -0.08), (0.12, 0.08), (-0.24, 0.62), (-0.38, 0.6), (-0.22, 0.0)], (-1.2, 0.7, 0), (1, 0, 0), (0, 1, 0), 0.1, r=0.05)
    c.slab([(0.12, 0.06), (0.12, -0.06), (-0.22, -0.36), (-0.32, -0.32), (-0.2, 0.0)], (-1.2, 0.68, 0), (1, 0, 0), (0, 1, 0), 0.1, r=0.05)
    for s in (-1, 1):
        A = Vector((-0.5, -0.45, 0)).normalized()
        c.slab([(0.0, -0.1), (0.3, -0.06), (0.42, 0.06), (0.3, 0.14), (0.0, 0.1)], (0.36, 0.34, s * 0.3), A, (0, 0, s), 0.08, r=0.05)
    c.paint_fn(lambda p, n: p.y < 0.4 and c.owner(p) == 'main' and p.x > -1.1, WHITE)
    # gill lines on both sides
    def gill(p, n):
        if c.owner(p) != 'main' or abs(p.z) < 0.2:
            return False
        for k in range(3):
            x0 = 0.28 - k * 0.13
            if abs(p.x - (x0 + 0.08 * ((p.y - 0.56) / 0.25) ** 2)) < 0.022 and abs(p.y - 0.56) < 0.2:
                return True
        return False
    c.paint_fn(gill, dark(SLATE, 0.35))
    # a friendly smile on the turned face: an ink band with a zigzag of rounded white teeth (ray-cast onto the body)
    YAW = 52
    Fm = Frame((0.62, 0.56, 0), yaw=YAW)
    dz = Vector(Fm.d((0, 0, 1)))
    up = Vector(Fm.d((0, 1, 0)))
    W = 0.24
    line = []
    def mouth():
        for k in range(13):
            x = -W + 2 * W * k / 12
            y = -0.17 + 0.09 * (x / W) ** 2
            line.append(c.on_body(Fm.p((x, y, 0)), dz))
        c.tube([tuple(h) for h in line], 0.05, rseg=8)
    def teeth():
        for k in range(1, 12):
            off = 0.032 if k % 2 else -0.032
            c.blob(tuple(line[k] + up * off + dz * 0.03), (0.032, 0.036, 0.026), group='t%d' % k)
    c.lay('mouth', INK, 500, voxel=0.007)
    c.lay('teeth', WHITE, 700, voxel=0.006)
    c.lazy['mouth'] = mouth
    c.lazy['teeth'] = teeth
    c.layer('skin')
    c.neck = (0, 0)
    c.bone('body', (0.0, 0.2, 0), (0.0, 1.1, 0))
    c.bone('head', (0.45, 0.3, 0), (0.45, 1.1, 0), parent='body', region=lambda q: q.x > 0.3)
    c.chain('tail', [(-0.7, 0.6, 0), (-1.1, 0.66, 0), (-1.5, 0.8, 0)], 'body', region=lambda q: q.x < -0.6)
    c.rigid['mouth'] = 'head'
    c.rigid['teeth'] = 'head'
    c.face(center=Fm.p((0, 0.18, 0)), radius=0.42, faceScale=FACE_S, eyeSize=EYE, yaw=YAW, mouth=0)
    c.build()


# =====================================================================================================
# OCTOPUS
# =====================================================================================================
def octopus():
    c = Fig('prop_word_octopus', PURPLE, 8000, voxel=0.015)
    c.target_faces = 4400
    c.resolution = 0.012                  # fine metaball grid so the little suckers survive
    HY = 1.32
    c.blob((0, HY, -0.04), (0.66, 0.7, 0.6))
    c.blob((0, 0.82, 0.0), (0.56, 0.32, 0.52))
    arms = []
    n = 8
    for i in range(n):
        a = TAU * (i + 0.5) / n                    # i = 3, 4 straddle the front (+z)
        d = Vector((math.sin(a), 0, math.cos(a)))
        U = Vector((0, 1, 0))
        pts = [d * 0.3 + U * 0.72, d * 0.58 + U * 0.24, d * 0.84 + U * 0.13, d * 1.04 + U * 0.2, d * 1.12 + U * 0.38,
               d * 1.04 + U * 0.54, d * 0.9 + U * 0.52]
        c.curve([tuple(p) for p in pts], [0.21, 0.18, 0.15, 0.13, 0.11, 0.09, 0.075], group='arm%d' % i, per=4)
        arms.append((i, pts, d))
    # rose suckers: two rows of dots on the underside of each curled tip (it faces outward once the tip curls up);
    # ray-cast onto the finished arms so they sit half proud of the skin
    c.lay('suckers', ROSE, 1500, voxel=0.007)
    def suckers():
        for i, pts, d in arms:
            P = [Vector(p) for p in pts]
            for k, t in enumerate((3.0, 3.45, 3.9, 4.35, 4.8)):
                j = min(int(t), len(P) - 2)
                q = P[j].lerp(P[j + 1], t - j)
                tan = (P[j + 1] - P[j]).normalized()
                ad, ay = tan.dot(d), tan.y
                under = (d * ay - Vector((0, 1, 0)) * ad).normalized()
                side = tan.cross(under).normalized()
                sz = 0.056 - 0.004 * k
                for sgn in (-1, 1):
                    o = q + side * sgn * 0.065 + under * 0.4
                    h = c.surface(o.x, o.y, o.z, dir=tuple(-under))
                    if h is not None and (h - q).length < 0.3:
                        c.blob(tuple(h - under * 0.012), (sz, sz, sz * 0.75), group='s%d%d%d' % (i, k, sgn))
    c.lazy['suckers'] = suckers
    c.layer('skin')
    c.neck = (1.0, 1.1)
    c.bone('body', (0, 0.2, 0), (0, 1.0, 0))
    c.bone('head', (0, 1.0, 0), (0, 2.1, 0), parent='body', region=lambda q: q.y > 0.95)
    for k, i in enumerate((2, 3, 4, 5)):
        _, pts, d = arms[i]
        c.bone('tailArm' + 'ABCD'[k], tuple(pts[1]), tuple(pts[3]), parent='body',
               region=lambda q, d=d: Vector((q.x, 0, q.z)).dot(d) > 0.45 and q.y < 0.8)
    c.face(center=(0, 1.12, 0.0), radius=0.6, faceScale=FACE_S, eyeSize=EYE, fit=1)
    c.build()


# =====================================================================================================
# SEAL
# =====================================================================================================
def seal():
    c = Fig('prop_word_seal', GREY, 5500, voxel=0.016)
    c.target_faces = 3200
    # bean body lying along x (tail toward -x), chest raised at the front
    spine = [(-1.05, 0.2, -0.05), (-0.6, 0.3, -0.04), (-0.1, 0.42, 0), (0.3, 0.72, 0.02), (0.42, 1.12, 0.04)]
    c.curve(spine, [0.13, 0.32, 0.42, 0.4, 0.36], per=5)
    HY = 1.5
    H = Frame((0.42, HY, 0.1), yaw=22)
    c.blob(H.p((0, 0, -0.04)), (0.42, 0.4, 0.4), group='head')
    for s in (-1, 1):
        c.blob(H.p((s * 0.13, -0.15, 0.3)), (0.16, 0.13, 0.15), group='head')     # whisker pads
    # front flippers at the chest, tail flippers together
    for s in (-1, 1):
        c.blob((0.4, 0.02, s * 0.34), (0.24, 0.07, 0.13), rot=(0, s * -35, s * 12), group='ff%d' % s)
        c.blob((0.3, 0.12, s * 0.24), (0.14, 0.1, 0.12), group='ff%d' % s)
    for s in (-1, 1):
        c.blob((-1.14, 0.0, s * 0.13), (0.2, 0.065, 0.12), rot=(0, s * 30, 0), group='tf%d' % s)
        c.blob((-1.0, 0.06, s * 0.05), (0.12, 0.08, 0.1), group='tf%d' % s)
    c.decal('tummy', (0.32, 0.7), (0.26, 0.4, 0.3), CREAM)
    c.mirror(lambda s: c.paint(('pad', s), H.p((s * 0.13, -0.15, 0.4)), (0.14, 0.11, 0.1), lite(GREY, 0.5), rot=H.rot()))
    for s in (-1, 1):
        for k, (dx, dy) in enumerate(((0.08, -0.1), (0.17, -0.13), (0.11, -0.2))):
            c.paint(('wd', s, k), H.p((s * dx, dy, 0.45)), (0.018, 0.018, 0.08), SLATE, rot=H.rot())
    c.lay('nose', INK, 300, voxel=0.007)
    c.blob(H.p((0, -0.04, 0.43)), (0.09, 0.06, 0.06), group='n')
    c.lay('whiskers', SLATE, 500, voxel=0.006)
    for s in (-1, 1):
        for k, ang in enumerate((24, 4, -16)):
            a = math.radians(ang)
            p0 = Vector(H.p((s * 0.25, -0.13 + 0.02 * (1 - k), 0.3)))
            p1 = Vector(H.p((s * (0.25 + 0.19 * math.cos(a)), -0.13 + 0.02 * (1 - k) + 0.19 * math.sin(a), 0.3)))
            c.tube([tuple(p0), tuple(p1)], 0.026, rseg=6)
    c.layer('skin')
    c.neck = (1.08, 1.2)
    c.bone('body', (-0.2, 0.2, 0), (-0.2, 1.0, 0))
    c.bone('head', (0.42, 1.08, 0.1), (0.42, 2.0, 0.1), parent='body', region=lambda q: q.y > 1.05)
    c.chain('tail', [(-0.6, 0.3, 0), (-1.0, 0.2, 0), (-1.35, 0.08, 0)], 'body', region=lambda q: q.x < -0.55)
    c.rigid['nose'] = 'head'
    c.rigid['whiskers'] = 'head'
    c.face(center=H.p((0, 0.06, 0)), radius=0.46, faceScale=FACE_S, eyeSize=EYE, yaw=H.yaw, fit=1, mouthY=-0.04)
    c.build()


# =====================================================================================================
# PARROT
# =====================================================================================================
def parrot():
    c = Fig('prop_word_parrot', RED, 6500, voxel=0.015)
    c.target_faces = 2600
    PY = 0.62                                     # perch height
    BY = PY + 0.62
    HY = BY + 0.66
    c.blob((0, BY, 0), (0.4, 0.55, 0.38), rot=(-10, 0, 0))
    c.blob((0, HY, 0.06), (0.4, 0.38, 0.38))
    # folded wings banded red -> yellow -> blue (own layer, wing bones)
    c.lay('wings', RED, 1000, voxel=0.011)
    for s, n in ((-1, 'L'), (1, 'R')):
        c.blob((s * 0.4, BY + 0.06, -0.02), (0.13, 0.42, 0.3), rot=(12, s * 8, s * 8), group='w' + n)
        c.blob((s * 0.38, BY - 0.36, -0.12), (0.1, 0.2, 0.16), rot=(25, 0, s * 6), group='w' + n)
    c.paint_fn(lambda p, n: p.y < BY - 0.02, YELLOW)
    c.paint_fn(lambda p, n: p.y < BY - 0.24, BLUE)
    # long tail feathers hanging down past the perch
    c.lay('tailf', BLUE, 800, voxel=0.01)
    feather = [(0.0, -0.09), (0.26, -0.11), (0.6, -0.1), (0.82, -0.06), (0.88, 0.0), (0.82, 0.06), (0.6, 0.1), (0.26, 0.11), (0.0, 0.09)]
    for k, (x, z, ang) in enumerate(((-0.1, -0.2, -8), (0.1, -0.22, 8), (0.0, -0.27, 0))):
        a = math.radians(ang)
        down = Vector((math.sin(a), -1, -0.1)).normalized()
        c.slab(feather, (x, BY - 0.3, z), down, Vector((math.cos(a), math.sin(a), 0)), 0.07, r=0.05)
    c.paint_fn(lambda p, n: abs(p.x) < 0.07 and p.z < -0.24, RED)
    # big hooked cream beak
    c.lay('beak', CREAM, 500, voxel=0.007)
    c.curve([(0, HY + 0.02, 0.36), (0, HY + 0.02, 0.5), (0, HY - 0.1, 0.58), (0, HY - 0.24, 0.52)], [0.13, 0.11, 0.075, 0.035], group='up')
    c.blob((0, HY - 0.17, 0.4), (0.09, 0.07, 0.08), group='lo')
    c.paint_fn(lambda p, n: c.owner(p) == 'lo', dark(CREAM, 0.35))
    # feet gripping the perch
    c.lay('feet', GREY, 400, voxel=0.008)
    for s in (-1, 1):
        for k in (-1, 1):
            c.blob((s * 0.14 + k * 0.05, PY + 0.08, 0.12), (0.04, 0.07, 0.06), group='ft%d%d' % (s, k))
    # perch stand
    c.lay('perch', WOOD, 800, voxel=0.012)
    c.capsule((-0.56, PY, 0.04), (0.56, PY, 0.04), 0.075, group='bar')
    for s in (-1, 1):
        c.capsule((s * 0.56, PY, 0.04), (s * 0.56, 0.08, 0.04), 0.06, group='post%d' % s)
        c.blob((s * 0.56, 0.05, 0.04), (0.16, 0.05, 0.2), group='foot%d' % s)
    c.paint_fn(lambda p, n: c.owner(p) == 'bar' and any(abs(p.x - x) < 0.018 for x in (-0.25, 0.3)), dark(WOOD, 0.25))
    c.layer('skin')
    for s in (-1, 1):
        c.decal(('face', s), (s * 0.19, HY + 0.02), (0.18, 0.2, 0.3), WHITE)
    c.neck = (BY + 0.3, BY + 0.42)
    c.bone('body', (0, PY, 0), (0, BY + 0.35, 0))
    c.bone('head', (0, BY + 0.38, 0.04), (0, HY + 0.5, 0.04), parent='body', region=lambda q: q.y > BY + 0.3)
    for s, n in ((-1, 'L'), (1, 'R')):
        c.bone('wing.' + n, (s * 0.36, BY + 0.38, 0), (s * 0.42, BY - 0.48, -0.1), parent='body', region=lambda q, s=s: c._cur == 'wings' and q.x * s > 0)
    c.chain('tail', [(0, BY - 0.35, -0.2), (0, PY - 0.1, -0.24), (0, 0.18, -0.26)], 'body', region=lambda q: c._cur == 'tailf')
    c.bone('stand', (0, 0.0, 0.04), (0, PY, 0.04))          # the perch stand keeps its feet on the floor when the bird leans
    for nme, b in (('beak', 'head'), ('feet', 'body'), ('perch', 'stand')):
        c.rigid[nme] = b
    c.face(center=(0, HY + 0.04, 0.06), radius=0.46, faceScale=FACE_S, eyeSize=EYE, mouth=0)
    c.build()


# =====================================================================================================
# FLAMINGO
# =====================================================================================================
def flamingo():
    c = Fig('prop_word_flamingo', PINK, 6000, voxel=0.014)
    c.target_faces = 2600
    BY = 1.32
    c.blob((-0.1, BY, 0), (0.5, 0.3, 0.3), rot=(0, 0, 12))
    c.blob((-0.5, BY + 0.1, 0), (0.22, 0.18, 0.2), rot=(0, 0, 30))           # tail tuft
    neck = [(0.3, BY + 0.12, 0), (0.42, BY + 0.42, 0.0), (0.24, BY + 0.72, 0.02), (0.14, BY + 0.98, 0.04), (0.24, BY + 1.16, 0.06)]
    c.curve(neck, [0.13, 0.1, 0.09, 0.1, 0.12], group='neck')
    HP = Vector((0.3, BY + 1.22, 0.08))
    c.blob(tuple(HP), (0.2, 0.18, 0.18), group='head')
    # legs: one straight standing leg, one folded into a "4"; fat tubes
    c.lay('legs', dark(PINK, 0.12), 900, voxel=0.009)
    c.tube([(0.0, BY - 0.2, 0.0), (0.0, 0.62, 0.0), (0.0, 0.08, 0.0)], 0.07, rseg=10)
    c.blob((0.0, 0.62, 0.0), (0.085, 0.085, 0.085), group='knee')
    c.blob((0.1, 0.05, 0.02), (0.18, 0.05, 0.12), group='foot')
    c.tube([(-0.05, BY - 0.2, 0.08), (0.12, 0.74, 0.14), (-0.22, 0.86, 0.14)], 0.07, rseg=10)
    c.blob((0.12, 0.74, 0.14), (0.085, 0.085, 0.085), group='knee2')
    # bent beak: pale base, bent down, ink tip
    c.lay('beak', CREAM, 500, voxel=0.007)
    c.curve([tuple(HP + Vector((0.14, 0.0, 0.06))), tuple(HP + Vector((0.3, -0.02, 0.08))), tuple(HP + Vector((0.38, -0.16, 0.08)))],
            [0.08, 0.065, 0.04], group='bk')
    c.paint_fn(lambda p, n: p.y < HP.y - 0.06, INK)
    c.lay('wing', ROSE, 700, voxel=0.01)
    for s in (-1, 1):
        c.blob((-0.12, BY + 0.04, s * 0.26), (0.36, 0.2, 0.09), rot=(0, 0, 14), group='w%d' % s)
        c.blob((-0.42, BY + 0.12, s * 0.22), (0.16, 0.1, 0.07), rot=(0, 0, 30), group='w%d' % s)
    c.layer('skin')
    c.neck = (BY + 0.5, BY + 0.7)
    c.bone('body', (0, 0.7, 0), (0, BY + 0.3, 0))
    c.bone('neck', (0.36, BY + 0.2, 0), (0.2, BY + 0.9, 0.04), parent='body', group='neck', region=lambda q: q.y > BY + 0.25)
    c.bone('head', (0.26, BY + 0.9, 0.06), (0.26, BY + 1.6, 0.06), parent='neck', region=lambda q: q.y > BY + 0.95)
    for s, n in ((-1, 'L'), (1, 'R')):
        c.bone('wing.' + n, (-0.0, BY + 0.2, s * 0.24), (-0.5, BY + 0.0, s * 0.3), parent='body', region=lambda q, s=s: c._cur == 'wing' and q.z * s > 0)
    c.rigid['legs'] = 'body'
    c.rigid['beak'] = 'head'
    c.face(center=tuple(HP + Vector((0.0, 0.03, 0))), radius=0.3, faceScale=FACE_S, eyeSize=EYE * 1.35, yaw=30, mouth=0)
    c.build()


# =====================================================================================================
# CAMEL
# =====================================================================================================
def camel():
    c = Fig('prop_word_camel', TAN, 7500, voxel=0.015)
    BODY = mix(TAN, WOOD, 0.3)
    quad_body(c, L=0.62, H=0.36, Z=0.34, y=1.1, legx=0.4, legz=0.18, x0=-0.12, leg_r=LEG_R)
    # broad feet
    for x in (0.28, -0.52):
        for z in (0.18, -0.18):
            c.blob((x, 0.06, z + 0.02), (0.18, 0.06, 0.17), group='pad%d%d' % (x > 0, z > 0))
    # two big rounded humps
    c.blob((-0.4, 1.44, 0), (0.27, 0.3, 0.26), group='hump0')
    c.blob((0.12, 1.44, 0), (0.27, 0.3, 0.26), group='hump1')
    # long U-curved neck: forward and down, then up to the head
    neck = [(0.4, 1.18, 0), (0.7, 1.02, 0.02), (0.92, 1.22, 0.04), (0.98, 1.56, 0.06)]
    c.curve(neck, [0.22, 0.18, 0.17, 0.17], group='neck')
    H = Frame((1.0, 1.78, 0.1), yaw=40)
    c.blob(H.p((0, 0.02, -0.06)), (0.3, 0.3, 0.32), group='head')
    c.blob(H.p((0, -0.1, 0.18)), (0.24, 0.2, 0.26), group='head')
    c.blob(H.p((0, -0.27, 0.27)), (0.17, 0.08, 0.15), group='lip')          # droopy lower lip
    for s, n in ((-1, 'L'), (1, 'R')):
        c.blob(H.p((s * 0.25, 0.26, -0.12)), (0.07, 0.11, 0.05), rot=H.rot((0, 0, -s * 30)), group='ear' + n)
    tail = [(-0.72, 1.18, 0), (-0.84, 1.0, 0.02), (-0.86, 0.8, 0.03)]
    c.curve(tail, [0.045, 0.04, 0.04], group='tail')
    c.blob((-0.86, 0.72, 0.03), (0.07, 0.11, 0.07), group='tuft')
    c.paint_fn(lambda p, n: c.owner(p) not in ('head', 'lip'), BODY)
    c.paint_fn(lambda p, n: c.owner(p) in ('hump0', 'hump1') and p.y > 1.5, BROWN)
    c.paint_group(['tuft'] + ['pad%d%d' % (a, b) for a in (0, 1) for b in (0, 1)], dark(BODY, 0.2))
    c.paint_group('lip', dark(TAN, 0.12))
    c.mirror(lambda s: c.paint(('nost', s), H.p((s * 0.09, -0.04, 0.42)), (0.03, 0.045, 0.06), BROWN, rot=H.rot()))
    c.neck = (1.5, 1.6)
    c.bone('body', (-0.12, 0.4, 0), (-0.12, 1.4, 0))
    c.bone('neck', (0.45, 1.15, 0), (0.95, 1.5, 0.05), parent='body', group='neck')
    c.bone('head', (H.o.x - 0.04, 1.55, H.o.z), (H.o.x - 0.04, 2.3, H.o.z), parent='neck', region=lambda q: q.y > 1.5 and q.x > 0.6)
    for s, n in ((-1, 'L'), (1, 'R')):
        c.bone('ear.%s.1' % n, H.p((s * 0.2, 0.18, -0.12)), H.p((s * 0.3, 0.38, -0.12)), parent='head', group='ear' + n)
    c.chain('tail', [(-0.72, 1.18, 0), (-0.86, 0.9, 0.03), (-0.86, 0.62, 0.03)], 'body', group=['tail', 'tuft'])
    c.face(center=H.p((0, 0.06, 0)), radius=0.4, faceScale=FACE_S, eyeSize=EYE, yaw=H.yaw, fit=1)
    c.build()


# =====================================================================================================
# YAK
# =====================================================================================================
def yak():
    COAT = BROWN
    c = Fig('prop_word_yak', COAT, 7500, voxel=0.016)
    c.target_faces = 4000
    c.blob((-0.1, 1.0, 0), (0.74, 0.5, 0.48))
    c.blob((0.3, 1.18, 0), (0.42, 0.42, 0.44))                # shoulder hump
    # the shaggy skirt: scalloped locks all round, hanging nearly to the ground
    n = 22
    for i in range(n):
        a = TAU * i / n
        x, z = -0.1 + 0.78 * math.cos(a), 0.52 * math.sin(a)
        c.capsule((x * 0.92, 0.85, z * 0.92), (x, 0.24, z), 0.15, r2=0.13, group='lock%d' % (i % 2))
    # hooves peeking out under the coat
    for x in (0.34, -0.5):
        for z in (0.24, -0.24):
            c.blob((x, 0.07, z), (0.13, 0.08, 0.13), group='hoof%d%d' % (x > 0, z > 0))
    H = Frame((0.78, 1.02, 0.12), yaw=40)
    c.blob(H.p((0, 0.02, -0.04)), (0.36, 0.34, 0.34), group='head')
    c.blob(H.p((0, -0.16, 0.22)), (0.27, 0.2, 0.24), group='muzzle')
    # wide curved cream horns (own layer)
    c.lay('horns', CREAM, 700, voxel=0.009)
    for s in (-1, 1):
        pts = [H.p((s * 0.24, 0.26, -0.08)), H.p((s * 0.52, 0.3, -0.06)), H.p((s * 0.66, 0.5, 0.0)), H.p((s * 0.6, 0.68, 0.06))]
        c.curve(pts, [0.105, 0.095, 0.075, 0.05], group='h%d' % s)
    # forelock: a shaggy tuft over the forehead (spring)
    c.lay('forelock', dark(COAT, 0.15), 600, voxel=0.01)
    for k, dx in enumerate((-0.12, 0.0, 0.12)):
        c.curve([H.p((dx * 0.6, 0.38, 0.0)), H.p((dx, 0.36, 0.22)), H.p((dx * 1.2, 0.27, 0.32))], [0.08, 0.075, 0.04], group='f%d' % k)
    c.layer('skin')
    tail = [(-0.82, 1.1, 0), (-0.98, 0.9, 0.02), (-1.02, 0.66, 0.04)]
    c.curve(tail, [0.08, 0.1, 0.07], group='tail')
    c.paint_group('lock1', dark(COAT, 0.1))
    c.paint_group('muzzle', CREAM)
    c.paint_group(['hoof%d%d' % (a, b) for a in (0, 1) for b in (0, 1)], SLATE)
    c.mirror(lambda s: c.paint(('nost', s), H.p((s * 0.1, -0.13, 0.46)), (0.035, 0.045, 0.06), dark(CREAM, 0.4), rot=H.rot()))
    c.neck = (0, 0)
    c.bone('body', (-0.1, 0.3, 0), (-0.1, 1.4, 0))
    c.bone('head', (H.o.x - 0.1, 0.6, H.o.z), (H.o.x - 0.1, 1.7, H.o.z), parent='body', region=lambda q: q.x > 0.52 and q.y > 0.72)
    c.bone('forelock', H.p((0, 0.36, 0.0)), H.p((0, 0.14, 0.36)), parent='head', region=lambda q: c._cur == 'forelock')
    c.chain('tail', tail, 'body', group='tail')
    c.rigid['horns'] = 'head'
    c.face(center=H.p((0, 0.06, 0)), radius=0.42, faceScale=FACE_S, eyeSize=EYE, yaw=H.yaw, fit=1)
    c.build()


# =====================================================================================================
# ANT (along x)
# =====================================================================================================
def ant():
    """An unmistakable ant (same design as letters' prop_lt_ant): dark brown, low to the ground, head + thorax + a big
    round gaster on a thin waist (three clear beads along x, head at +x), six thin elbowed legs splayed forward and
    back, elbowed feelers with little clubs (spring chains), warm shine spots. The code face is on the head's
    camera side. (The old red, leaf-carrying ant read as a tomato on a stool.)"""
    BODY, LEG, SHINE = 0x5b3324, 0x3a2018, 0x9a6a50
    c = Fig('prop_word_ant', BODY, 5000, voxel=0.0095, outline=0.016)
    c.target_faces = 2600
    HP = Vector((0.52, 0.34, 0.0))
    c.blob(tuple(HP), (0.2, 0.19, 0.19), group='head', stiffness=2.5)
    c.blob((0.16, 0.27, 0), (0.17, 0.105, 0.105), rot=(0, 0, -10), group='thorax', stiffness=2.5)
    c.blob((-0.06, 0.27, 0), (0.07, 0.075, 0.07), group='waist', stiffness=2.5)
    GX, GY = -0.35, 0.3
    c.blob((GX, GY, 0), (0.28, 0.23, 0.23), rot=(0, 0, 10), group='gaster', stiffness=2.5)
    c.paint('shineG', (GX + 0.05, GY + 0.17, 0.08), (0.11, 0.05, 0.08), SHINE)
    c.paint('shineH', (HP.x - 0.02, HP.y + 0.15, 0.05), (0.07, 0.04, 0.06), SHINE)
    c.paint('muzzle', (HP.x + 0.03, HP.y - 0.03, 0.16), (0.13, 0.11, 0.08), 0x9a6650)   # a lighter face patch: the eyes read
    # six elbowed legs: up and out to a knee above the back, then down and well out (front forward, back backward)
    c.lay('legs', LEG, 1300, voxel=0.0075)
    for (r, k, f) in (((0.25, 0.23), (0.42, 0.44), (0.66, 0.02)), ((0.16, 0.22), (0.24, 0.47), (0.08, 0.02)), ((0.07, 0.22), (-0.16, 0.44), (-0.46, 0.02))):
        for s_ in (-1, 1):
            c.tube([(r[0], r[1], s_ * 0.07), (k[0], k[1], s_ * 0.31), (f[0], f[1] + 0.02, s_ * 0.4)], [0.036, 0.031, 0.026], rseg=8)
            c.blob((f[0], f[1] + 0.012, s_ * 0.41), (0.04, 0.026, 0.04), group='ft%d%d' % (int(f[0] * 100), s_))
    # elbowed feelers with clubs (spring)
    c.lay('antennae', LEG, 600, voxel=0.0065)
    tips = []
    for s_ in (-1, 1):
        a0 = HP + Vector((0.06, 0.14, s_ * 0.07))
        a1 = HP + Vector((0.1, 0.38, s_ * 0.12))
        a2 = HP + Vector((0.32, 0.46, s_ * 0.17))
        c.tube([tuple(a0), tuple(a1), tuple(a2)], 0.022, rseg=8)
        c.blob(tuple(a2), (0.04, 0.04, 0.04), group='tip%d' % s_)
        tips.append((a0, a1, a2))
    c.layer('skin')
    c.neck = (0, 0)
    c.bone('body', (-0.1, 0.1, 0), (-0.1, 0.8, 0))
    c.bone('head', (HP.x, 0.3, 0), (HP.x, 0.85, 0), parent='body', region=lambda q: q.x > 0.34 and c._cur in ('skin', 'antennae'))
    for (a0, a1, a2), n in zip(tips, ('L', 'R')):
        c.chain('antenna.' + n, [tuple(a0), tuple(a1), tuple(a2 + (a2 - a1).normalized() * 0.06)], 'head',
                region=lambda q, s=(-1 if n == 'L' else 1): c._cur == 'antennae' and q.z * s > 0)
    c.rigid['legs'] = 'body'
    c.face(center=(HP.x + 0.05, HP.y - 0.02, 0.165), radius=0.19, faceScale=1.0, eyeSize=1.5, yaw=0, fit=0)
    c.build()


# =====================================================================================================
# WORD-CARD VARIANTS of reused models (the originals stay untouched)
# =====================================================================================================
def starfish():
    """prop_word_starfish: an orange starfish (colour baked in) stuck upright in a little sand mound, leaning back toward
    the camera; one arm down in the sand, the other four soft curving arms with rows of cream bumps. No face.
    Unlike prop_word_star (a smooth, puffy, yellow star standing on two points): orange, bumpy, slim curvy arms, sand."""
    c = Fig('prop_word_starfish', ORANGE, 3200, voxel=0.013, skin_share=0.55, outline=0.024)
    c.quadriflow = False
    TILT, LIFT = -22.0, 0.84
    Mx = Euler((math.radians(TILT), 0, 0)).to_matrix()
    def place(x, y, z):
        return tuple(Mx @ Vector((x, y, z)) + Vector((0, LIFT, 0)))
    NT, NR = 90, 7
    def Rof(t):
        k = abs(math.cos(t * 2.5 - math.pi * 1.25 + math.radians(36) * 2.5))     # one arm straight down
        return 0.3 + 0.7 * k ** 2.4
    def twist(t, f):
        return t + 0.1 * math.sin(f * 3.0) * f                                       # arms curl a little at the tips
    verts, faces, grid = [(place(0, 0, 0.24))], [], {}
    for i in range(1, NR + 1):
        f = i / NR
        for j in range(NT):
            t0 = j / NT * TAU
            R = Rof(t0)
            r = R * f
            t = twist(t0, f * R)
            h = 0.24 * (1 - f ** 2.2) ** 0.55 * (0.7 + 0.3 * R) + 0.03
            grid[(i, j)] = len(verts)
            verts.append(place(r * math.cos(t), r * math.sin(t), h))
    for j in range(NT):
        faces.append((0, grid[(1, j)], grid[(1, (j + 1) % NT)]))
    for i in range(1, NR):
        for j in range(NT):
            j2 = (j + 1) % NT
            faces.append((grid[(i, j)], grid[(i + 1, j)], grid[(i + 1, j2)], grid[(i, j2)]))
    bot = len(verts)
    for j in range(NT):
        t0 = j / NT * TAU
        R = Rof(t0)
        t = twist(t0, R)
        verts.append(place(R * 0.96 * math.cos(t), R * 0.96 * math.sin(t), -0.07))
    verts.append(place(0, 0, -0.1))
    cb = len(verts) - 1
    for j in range(NT):
        j2 = (j + 1) % NT
        faces.append((grid[(NR, j)], bot + j, bot + j2, grid[(NR, j2)]))
        faces.append((cb, bot + j2, bot + j))
    c.mesh(verts, faces)
    # cream bumps in two rows along each of the four free arms (and up the middle)
    c.lay('bumps', lite(CREAM, 0.2), 900, voxel=0.007)
    for a in range(5):
        t0 = -math.pi / 2 + a * TAU / 5
        if a == 0:
            continue                                   # the arm in the sand
        for k, rr in enumerate((0.26, 0.44, 0.62, 0.78)):
            R = 1.0
            h = 0.24 * (1 - rr ** 2.2) ** 0.55 * (0.7 + 0.3 * R) + 0.03
            for sg in ((0,) if k == 3 else (-1, 1)):
                t = twist(t0, rr) + sg * 0.09 / rr
                c.blob(place(rr * math.cos(t), rr * math.sin(t), h + 0.01), (0.055 - 0.007 * k,) * 2 + (0.04,), group='b%d%d%d' % (a, k, sg))
    # a little sand mound holding the bottom arm
    c.lay('sand', TAN, 900, voxel=0.012)
    c.blob((0, 0.16, -0.02), (0.56, 0.36, 0.46), group='s')
    c.blob((0.24, 0.06, 0.16), (0.36, 0.12, 0.3), group='s')
    c.blob((-0.28, 0.05, 0.1), (0.3, 0.1, 0.28), group='s')
    c.layer('skin')
    c.paint(('ring',), place(0, 0, 0.2), (0.12, 0.12, 0.12), dark(ORANGE, 0.12))
    c.bone('body', (0, 0.0, 0), (0, 1.9, 0))
    c.rigid['bumps'] = 'body'
    c.rigid['sand'] = 'body'
    c.build()


def spider():
    """prop_word_spider: a friendly purple spider up on eight fat arched legs (knees above the body, feet wide on the
    floor), a round body with a cute code face and a paler tummy spot. Lighter than prop_m_spider so it reads on a card."""
    BODY = PURPLE
    LEG = dark(PURPLE, 0.28)
    c = Fig('prop_word_spider', BODY, 5000, voxel=0.014, outline=0.024)
    c.target_faces = 2600
    BY = 0.86
    c.blob((0, BY + 0.06, -0.18), (0.6, 0.54, 0.56))                # round abdomen
    c.blob((0, BY - 0.02, 0.24), (0.48, 0.44, 0.4), group='head')    # head front, holds the face
    c.paint(('belly',), (0, BY - 0.36, 0.24), (0.28, 0.16, 0.3), lite(PURPLE, 0.35))
    c.lay('legs', LEG, 1900, voxel=0.01)
    for s in (-1, 1):
        for i in range(4):
            ang = math.radians((58, 84, 112, 140)[i])          # legs radiate round the body like a real spider
            d = Vector((s * math.sin(ang), 0, math.cos(ang)))
            C0 = Vector((0, BY, 0.0))
            root = C0 + d * 0.42 + Vector((0, -0.02, 0))
            knee = C0 + d * 0.74 + Vector((0, 0.5 - 0.04 * abs(i - 1.5), 0))
            foot = C0 + d * 1.1 + Vector((0, 0.06 - BY, 0))
            mid1 = root.lerp(knee, 0.5) + d * -0.04 + Vector((0, 0.08, 0))
            mid2 = knee.lerp(foot, 0.4) + d * 0.1 + Vector((0, 0.04, 0))
            c.tube([tuple(root), tuple(mid1), tuple(knee), tuple(mid2), tuple(foot)], [0.09, 0.085, 0.08, 0.075, 0.07], rseg=8)
            c.blob(tuple(knee), (0.095, 0.095, 0.095), group='k%d%d' % (s, i))
            c.blob(tuple(foot + Vector((s * 0.03, 0.0, 0))), (0.1, 0.065, 0.09), group='f%d%d' % (s, i))
    c.layer('skin')
    c.neck = (0, 0)
    c.bone('body', (0, 0.2, -0.1), (0, BY + 0.5, -0.1))
    c.bone('head', (0, BY - 0.3, 0.24), (0, BY + 0.5, 0.24), parent='body', region=lambda q: c._cur == 'skin' and q.z > 0.12)
    c.rigid['legs'] = 'body'
    c.face(center=(0, BY + 0.02, 0.24), radius=0.46, faceScale=FACE_S, eyeSize=EYE * 1.1, fit=1)
    c.build()


if __name__ == '__main__':
    for fn in (whale, dolphin, shark, octopus, seal, parrot, flamingo, camel, yak, ant, starfish, spider):
        if want('prop_word_' + fn.__name__):
            fn()
