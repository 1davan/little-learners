"""VOCAB.md batch 5 (people): one family of soft chibi doll figurines (ONLY=prop_word_girl,... builds a subset).
Every person comes from one base body (person()): a big round head (about 45% of a child's height, a bit less for the
grown-ups), a soft bean body, mitten hands, stub feet, the engine's code face; clothes are crisp paint on the body or
their own layers (skirts, coats), and hair and the one naming prop are their own layers.
Bones: body, head, arm.L / arm.R (rotation.z raises), leg.L / leg.R, plus spring bones for bunches, ponytails and hems.
  prop_word_baby     sitting, arms up, one curl of hair, white nappy, a yellow rattle             (skin f6cfa6)
  prop_word_girl     brown bunches with red bobbles, purple dungaree dress, white top, red shoes  (d9a273)
  prop_word_boy      tufty ink-brown hair with a quiff, green/white striped top, blue shorts      (9c6b4a)
  prop_word_mummy    tall, long brown ponytail over a shoulder, orange jumper, blue trousers      (d9a273)
  prop_word_daddy    tallest, short ink hair and beard band, green checked shirt, slate trousers  (9c6b4a)
  prop_word_grandma  rounder, grey bun, round glasses, purple cardigan, rose skirt               (f6cfa6)
  prop_word_grandpa  grey side hair, big moustache, flat brown cap, red braces over a cream shirt (f6cfa6)
  prop_word_doctor   white coat over a sky top, stethoscope, white bag with a red cross, ink bob  (d9a273)
  prop_word_queen    long purple gown with ermine trim, the big gold crown, a short gold sceptre (9c6b4a)
"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from words5 import *   # noqa: F401,F403
from mathutils import Vector

ONLY = [s for s in os.environ.get('ONLY', '').split(',') if s]
LIGHT, MID, DEEP = SKIN
HAIR_BROWN, HAIR_INK, HAIR_GREY = 0x8c5a32, 0x4a3442, 0xc9ced6
SHOE_BROWN = 0x7a4e2e


class Person(WProp):
    def __init__(self, kind, oy=0.0, **kw):
        super().__init__(kind, oy=oy, voxel=0.016, target_faces=3600, smooth=3)
        self.quadriflow = False
        self.layers['skin']['quadriflow'] = False


def person(p, H=2.3, head=(0.56, 0.5, 0.5), hip=0.5, girth=1.0, skin=MID, arms='down', legs='stand', neck=0.0):
    """Sculpt the shared body into the current (skin) layer. Returns a dict of key points for clothes and props.
    arms: 'down' (a soft A), 'hug' (open, up and out), 'up' (baby, reaching up), or ((x, y, z) hand R) custom.
    legs: 'stand' or 'sit' (legs forward along +z)."""
    p.layers['skin']['base'] = hexcol(skin)
    hx, hy, hz = head
    HC = H - hy                       # head centre
    SHY = HC - hy * 0.86 - neck       # top of the shoulders
    g = girth
    K = dict(H=H, HC=HC, hx=hx, hy=hy, hz=hz, SHY=SHY, hip=hip, g=g, skin=skin)
    # head + soft cheeks/jaw
    p.blob((0, HC, 0), (hx, hy, hz), group='head')
    p.blob((0, HC - hy * 0.35, 0.05), (hx * 0.86, hy * 0.6, hz * 0.88), group='head')
    # body: a soft bean from the hips to the shoulders, a round tummy
    ty = (hip + SHY) / 2
    th = (SHY - hip) / 2 + 0.08
    p.blob((0, ty + 0.02, 0), (0.33 * g, th, 0.27 * g), group='body')
    p.blob((0, hip + 0.16, 0.02), (0.37 * g, 0.26, 0.3 * g), group='body')
    p.blob((0, SHY - 0.02, 0), (0.17, 0.1, 0.15), group='body')          # neck blend
    for s in (-1, 1):
        p.blob((s * 0.24 * g, SHY - 0.1, 0.0), (0.15, 0.11, 0.17), group='body')   # shoulder ramp
    # arms + mitten hands
    sh = lambda s: Vector((s * (0.27 * g + 0.04), SHY - 0.12, 0.0))
    if arms == 'down':
        hand = lambda s: Vector((s * (0.27 * g + 0.33), SHY - 0.52, 0.1))
    elif arms == 'hug':
        hand = lambda s: Vector((s * (0.27 * g + 0.52), SHY + 0.02, 0.18))
    elif arms == 'up':
        hand = lambda s: Vector((s * (0.27 * g + 0.52), SHY + 0.32, 0.14))
    else:
        hand = lambda s: Vector((s * arms[0], arms[1], arms[2]))
    for s, n in ((-1, 'L'), (1, 'R')):
        a, h = sh(s), hand(s)
        d = (h - a).normalized()
        wrist = h - d * 0.1
        p.blob(tuple(a), (0.105, 0.105, 0.105), group='arm' + n)
        p.capsule(tuple(a), tuple(wrist), 0.095, r2=0.085, group='arm' + n)
        p.blob(tuple(h), (0.115, 0.125, 0.105), group='hand' + n)
        p.blob(tuple(h + Vector((0, 0, 0.08)) + d * -0.03 + Vector((-s * 0.04, 0, 0))), (0.045, 0.05, 0.05), group='hand' + n)   # thumb nub
        K['sh' + n], K['hand' + n], K['wrist' + n] = a, h, wrist
    # legs + stub feet
    for s, n in ((-1, 'L'), (1, 'R')):
        if legs == 'stand':
            top = Vector((s * 0.15 * g, hip + 0.02, 0.0))
            ank = Vector((s * 0.16 * g, 0.16, 0.0))
            p.capsule(tuple(top), tuple(ank), 0.13, r2=0.115, group='leg' + n)
            p.blob((s * 0.17 * g, 0.085, 0.06), (0.13, 0.085, 0.19), group='foot' + n)
            K['foot' + n] = Vector((s * 0.17 * g, 0.085, 0.06))
        else:   # sitting: thighs forward, feet up
            top = Vector((s * 0.17 * g, hip, 0.05))
            ank = Vector((s * 0.2 * g, hip - 0.04, 0.48))
            p.capsule(tuple(top), tuple(ank), 0.14, r2=0.12, group='leg' + n)
            p.blob((s * 0.21 * g, hip + 0.06, 0.58), (0.12, 0.16, 0.1), rot=(-15, 0, 0), group='foot' + n)
            K['foot' + n] = Vector((s * 0.21 * g, hip + 0.06, 0.58))
        K['legtop' + n], K['ankle' + n] = top, ank
    # the face sits low on the big round head
    return K


def rig(p, K, face_scale=1.25, eye_y=None, extra=None):
    H, HC, SHY, hip = K['H'], K['HC'], K['SHY'], K['hip']
    p.bone('body', (0, 0.1, 0), (0, SHY, 0))
    p.bone('head', (0, SHY, 0), (0, H + 0.05, 0), parent='body', region=lambda q: q.y > SHY - 0.08 and abs(q.x) < K['hx'] + 0.6)
    for n in ('L', 'R'):
        p.bone('arm.' + n, tuple(K['sh' + n]), tuple(K['hand' + n]), parent='body', group=['arm' + n, 'hand' + n] + (extra or {}).get('arm' + n, []))
        p.bone('leg.' + n, tuple(K['legtop' + n]), tuple(K['ankle' + n]), parent='body', group=['leg' + n, 'foot' + n])
    p.neck = (SHY - 0.08, SHY + 0.06)
    opts = dict(faceScale=face_scale)
    if eye_y is not None:
        opts['eyeY'] = eye_y
    p.face(center=(0, HC - K['hy'] * 0.2, 0.0), radius=K['hx'] * 0.86, **opts)
    p.anchor('handL', tuple(K['handL']), 'arm.L')
    p.anchor('handR', tuple(K['handR']), 'arm.R')


def face_pts(K, fs=1.25):
    """where the code face puts things (faces.js): returns (Rf, centre y, eye x, eye y, mouth-top y)"""
    Rf = K['hx'] * 0.86 * fs
    cy = K['HC'] - K['hy'] * 0.2
    return Rf, cy, 0.36 * Rf, cy + 0.12 * Rf, cy - 0.25 * Rf


def finish(p, K, w=None, outline=0.026):
    fit_extras(p, K['H'], w or 1.2)
    p.extras['outline'] = outline
    p.build()


# ---------------- clothes painted on the body ----------------
def paint_top(p, K, colour, sleeve=1.0, only=None):
    """a top: the torso above the waist and the arms down to `sleeve` (fraction from shoulder to wrist)"""
    SHY, hip = K['SHY'], K['hip']
    waist = hip + 0.22
    p.paint_group('body', colour, only=lambda q: q.y > waist and (only is None or only(q)))
    for n in ('L', 'R'):
        a, w = K['sh' + n], K['wrist' + n]
        d = (w - a)
        L = d.length
        d = d.normalized()
        p.paint_group('arm' + n, colour, only=lambda q, a=a, d=d, L=L: (Vector(q) - a).dot(d) < L * sleeve)


def paint_bottoms(p, K, colour, leg=1.0):
    """trousers/shorts: the body below the waist and the legs down to `leg` (fraction from hip to ankle)"""
    waist = K['hip'] + 0.22
    p.paint_group('body', colour, only=lambda q: q.y <= waist)
    for n in ('L', 'R'):
        a, b = K['legtop' + n], K['ankle' + n]
        d = b - a; L = d.length; d = d.normalized()
        p.paint_group('leg' + n, colour, only=lambda q, a=a, d=d, L=L: (Vector(q) - a).dot(d) < L * leg)


def paint_shoes(p, K, colour, sock=None):
    p.paint_group(['footL', 'footR'], colour)
    if sock is not None:
        for n in ('L', 'R'):
            p.paint_group('leg' + n, sock, only=lambda q: q.y < 0.24)


def hair_cap(p, K, colour, name='hair', fringe=True, back=0.0, top=0.0, part=None, voxel=0.012, faces=1400, short=False):
    """a hair cap over the top and back of the head, leaving the face clear; returns the layer name"""
    HC, hx, hy, hz = K['HC'], K['hx'], K['hy'], K['hz']
    p.layer(name, base=colour, voxel=voxel, target_faces=faces)
    p.blob((0, HC + 0.05 + top, -0.04), (hx + 0.05, hy + 0.02 + top, hz + 0.03 + back * 0.5), group='cap')
    if not short:
        p.blob((0, HC - 0.06, -0.1 - back), (hx + 0.03, hy * 0.85, hz * 0.8), group='cap')
    else:
        p.blob((0, HC + 0.02, -0.12), (hx + 0.03, hy * 0.7, hz * 0.75), group='cap')
    # carve the face out: the cap stops at the forehead and in front of the ears
    p.blob((0, HC - hy * 0.38, hz * 0.55), (hx * 0.92, hy * 0.82, hz * 0.75), group='cap', negative=True)
    if fringe:
        for k in range(5):
            x = (-0.32 + 0.16 * k) * hx / 0.56
            p.blob((x, HC + hy * 0.5 - 0.02 * (k % 2), hz * 0.78), (0.12, 0.09, 0.08), rot=(0, 0, 18 * (x / hx)), group='cap')
    return name


# ======================================================================= GIRL
def girl():
    p = Person('prop_word_girl')
    K = person(p, H=2.3, skin=MID)
    paint_top(p, K, WHITE, sleeve=0.35)
    paint_bottoms(p, K, PURPLE, leg=0.25)
    paint_shoes(p, K, RED, sock=WHITE)
    # dungaree dress: a bib panel, straps and an A-line skirt
    p.layer('dress', base=PURPLE, voxel=0.012, target_faces=1300)
    SHY, hip = K['SHY'], K['hip']
    p.lathe(rounded([(0, hip - 0.12), (0.47, hip - 0.12), (0.4, hip + 0.32), (0.36, hip + 0.42), (0, hip + 0.42)], 0.05, n=3), scale=(1, 0.86), seg=40)
    p.cut_cone((0, hip - 0.4, 0.0), (0, hip + 0.3, 0.0), 0.39, 0.34)
    p.box((0, hip + 0.55, 0.25), (0.21, 0.2, 0.06), rot=(-10, 0, 0), bevel=0.05)
    for s in (-1, 1):
        p.tube([(s * 0.15, hip + 0.72, 0.23), (s * 0.19, SHY + 0.01, 0.1), (s * 0.2, SHY + 0.02, -0.12), (s * 0.15, hip + 0.55, -0.27)], 0.04, rseg=8)
    p.paint_fn(lambda q, n: q.y < hip - 0.04 and q.y > hip - 0.1 and n.y < 0.5, PURPLE_D)
    p.inside(PURPLE_D)
    p.layer('buttons', base=YELLOW, voxel=0.006, target_faces=200)
    for s in (-1, 1):
        p.blob((s * 0.15, hip + 0.7, 0.26), (0.04, 0.04, 0.03), group='b%d' % s)
    # hair: a cap with a fringe and two high bunches with red bobbles
    hair_cap(p, K, BROWN)
    HC, hx, hy = K['HC'], K['hx'], K['hy']
    for s, n in ((-1, 'L'), (1, 'R')):
        g = 'bunch' + n
        base = Vector((s * (hx + 0.02), HC + 0.28, -0.05))
        p.blob(tuple(base + Vector((s * 0.12, 0.04, 0))), (0.13, 0.12, 0.12), group=g)
        p.blob(tuple(base + Vector((s * 0.24, -0.06, 0))), (0.14, 0.17, 0.13), rot=(0, 0, s * 25), group=g)
        p.blob(tuple(base + Vector((s * 0.3, -0.22, 0))), (0.1, 0.13, 0.1), rot=(0, 0, s * 15), group=g)
    p.layer('bobbles', base=RED, voxel=0.007, target_faces=300)
    for s in (-1, 1):
        p.blob((s * (hx + 0.07), HC + 0.31, 0.02), (0.09, 0.09, 0.09), group='bb%d' % s)
    p.layer('skin')
    rig(p, K)
    for s, n in ((-1, 'L'), (1, 'R')):
        a = (s * (hx + 0.06), HC + 0.3, -0.05)
        b = (s * (hx + 0.38), HC - 0.02, -0.05)
        p.bone('tuft.' + n, a, b, parent='head', region=lambda q, s=s: q.x * s > hx + 0.02 and q.y > HC - 0.25)
    p.anchor('hair', (-(hx + 0.26), HC + 0.22, -0.05), 'tuft.L')   # vocab batch 6: Hair (the left bunch)
    finish(p, K, 1.6)


# ======================================================================= BOY
def boy():
    p = Person('prop_word_boy')
    K = person(p, H=2.3, skin=DEEP)
    paint_top(p, K, GREEN, sleeve=0.4)
    p.paint_fn(lambda q, n: q.y > K['hip'] + 0.22 and q.y < K['SHY'] + 0.05 and int(math.floor((q.y - K['hip']) / 0.1)) % 2 == 0
               and p.owner(Vector((q.x, q.y, q.z))) in ('body', 'armL', 'armR') and (abs(q.x) < 0.5 or q.y > K['SHY'] - 0.3), WHITE)
    paint_bottoms(p, K, BLUE, leg=0.42)
    paint_shoes(p, K, YELLOW, sock=WHITE)
    hair_cap(p, K, HAIR_INK, fringe=False, top=-0.02)
    HC, hx, hy, hz = K['HC'], K['hx'], K['hy'], K['hz']
    # tufts all over the top and a front quiff
    for k in range(9):
        a = math.radians(-70 + 140 * k / 8)
        x, z = (hx * 0.75) * math.sin(a), (hz * 0.6) * math.cos(a) - 0.18
        p.blob((x, HC + hy * 0.82, z), (0.1, 0.12, 0.09), rot=(-20, 0, -math.degrees(a) * 0.5), group='tufts')
    p.curve([(-0.08, HC + hy * 0.62, hz * 0.62), (0.02, HC + hy * 0.92, hz * 0.62), (0.14, HC + hy * 1.0, hz * 0.4), (0.1, HC + hy * 0.86, hz * 0.3)], [0.1, 0.1, 0.08, 0.06], group='quiff')
    p.layer('skin')
    p.rigid.update(hair='head')
    rig(p, K)
    # vocab batch 6 body-part anchors: the left elbow (outer side, mid-arm) and the left knee (front, mid-leg)
    p.anchor('elbowL', tuple(K['shL'].lerp(K['handL'], 0.5) + Vector((-0.09, 0, -0.02))), 'arm.L')
    p.anchor('kneeL', tuple(K['legtopL'].lerp(K['ankleL'], 0.55) + Vector((0, 0, 0.12))), 'leg.L')
    # vocab batch 6: a small round plaster-pink patch on each knee, so "Knee!" has something to point at
    for n in ('L', 'R'):
        kc = K['legtop' + n].lerp(K['ankle' + n], 0.55) + Vector((0, 0, 0.1))
        p.paint('knee' + n, tuple(kc), (0.09, 0.085, 0.09), 0xff9ec4, only=lambda q, kc=kc: q.z > kc.z - 0.07)
    finish(p, K, 1.3)


# ======================================================================= BABY
def baby():
    p = Person('prop_word_baby', oy=0.046)
    K = person(p, H=1.62, head=(0.52, 0.48, 0.47), hip=0.22, girth=1.0, skin=LIGHT, arms='up', legs='sit')
    # white nappy over the bottom
    p.layer('nappy', base=WHITE, voxel=0.012, target_faces=800)
    hip = K['hip']
    p.blob((0, hip + 0.1, 0.03), (0.42, 0.22, 0.34), group='n')
    p.blob((0, hip + 0.02, 0.18), (0.36, 0.15, 0.26), group='n')
    p.paint_fn(lambda q, n: q.y > hip + 0.24, WHITE_D)
    p.layer('tabs', base=SKY, voxel=0.007, target_faces=200, quadriflow=False)
    for s in (-1, 1):
        p.sticker(rounded([(-0.06, -0.045), (0.06, -0.045), (0.06, 0.045), (-0.06, 0.045)], 0.03, n=2, closed=True), (s * 0.24, hip + 0.22), onto='nappy', thick=0.035, lift=0.02, step=0.02)
    # one curl of hair on top
    HC, hy = K['HC'], K['hy']
    p.layer('curl', base=BROWN_L, voxel=0.008, target_faces=400)
    pts = []
    for k in range(22):
        t = k / 21
        a = math.radians(-60 + 380 * t)
        r = 0.13 * (1 - 0.55 * t)
        pts.append((r * math.sin(a) + 0.02, HC + hy + 0.04 + 0.08 * t + 0.08 * (1 - math.cos(a)) * (1 - t) * 0.5, 0.05 + r * math.cos(a) * 0.4))
    p.tube(pts, [0.06 - 0.02 * k / 21 for k in range(22)], rseg=10)
    # a yellow rattle in the right hand
    p.layer('rattle', base=YELLOW, voxel=0.008, target_faces=600)
    h = K['handR']
    p.capsule(tuple(h + Vector((0.02, -0.06, 0.06))), tuple(h + Vector((0.04, 0.2, 0.06))), 0.04, group='handle')
    p.blob(tuple(h + Vector((0.05, 0.33, 0.06))), (0.14, 0.14, 0.14), group='ball')
    p.ring(tuple(h + Vector((0.04, 0.19, 0.06))), 0.06, 0.03, seg=20, rseg=8)
    p.paint_fn(lambda q, n: abs(q.y - (h.y + 0.33)) < 0.03, ORANGE)
    p.layer('skin')
    p.rigid.update(rattle='arm.R', curl='head')
    rig(p, K, face_scale=1.05)
    finish(p, K, 1.95)


# ======================================================================= MUMMY
def mummy():
    p = Person('prop_word_mummy')
    K = person(p, H=2.6, head=(0.52, 0.47, 0.46), hip=0.72, girth=0.95, skin=MID, arms='hug')
    paint_top(p, K, ORANGE, sleeve=0.95)
    paint_bottoms(p, K, BLUE)
    paint_shoes(p, K, SHOE_BROWN)
    p.paint_fn(lambda q, n: abs(q.y - (K['hip'] + 0.25)) < 0.035 and abs(q.x) < 0.5, ORANGE_D)   # ribbed hem line
    hair_cap(p, K, BROWN, back=0.04)
    HC, hx, hy, hz = K['HC'], K['hx'], K['hy'], K['hz']
    # a low ponytail swept over her right shoulder onto the front
    pts = [(hx * 0.55, HC - hy * 0.55, -hz * 0.55), (hx * 0.9, HC - hy * 0.95, -0.05), (hx * 0.85, K['SHY'] - 0.05, 0.22), (hx * 0.62, K['SHY'] - 0.42, 0.3)]
    p.curve(pts, [0.15, 0.15, 0.14, 0.09], group='tail')
    p.layer('band', base=YELLOW, voxel=0.007, target_faces=200)
    p.blob((hx * 0.6, HC - hy * 0.62, -hz * 0.5), (0.08, 0.08, 0.08), group='bd')
    p.layer('skin')
    rig(p, K)
    p.bone('tail.1', pts[1], pts[2], parent='head', group='tail', region=lambda q: q.y < HC - hy * 0.7)
    p.bone('tail.2', pts[2], pts[3], parent='tail.1', group='tail', region=lambda q: q.y < K['SHY'] - 0.1 and q.z > 0.1)
    finish(p, K, 2.0)


# ======================================================================= DADDY
def daddy():
    p = Person('prop_word_daddy')
    K = person(p, H=2.7, head=(0.52, 0.47, 0.46), hip=0.76, girth=1.05, skin=DEEP, arms='hug')
    SHY, hip = K['SHY'], K['hip']
    paint_top(p, K, GREEN, sleeve=0.95)
    # checks: darker bands both ways, a lighter square where they cross
    def chk(q):
        return (q.y > hip + 0.22) and (p.owner(Vector((q.x, q.y, q.z))) in ('body', 'armL', 'armR')) and q.y < SHY + 0.06
    p.paint_fn(lambda q, n: chk(q) and ((q.x + 1) % 0.16 < 0.06) != ((q.y % 0.16) < 0.06), GREEN_D)
    p.paint_fn(lambda q, n: chk(q) and ((q.x + 1) % 0.16 < 0.06) and ((q.y % 0.16) < 0.06), LEAF)
    paint_bottoms(p, K, SLATE)
    paint_shoes(p, K, SHOE_BROWN)
    hair_cap(p, K, HAIR_INK, fringe=False, top=-0.04, short=True)
    HC, hx, hy, hz = K['HC'], K['hx'], K['hy'], K['hz']
    p.blob((-0.1, HC + hy * 0.8, hz * 0.45), (0.22, 0.1, 0.12), rot=(0, 0, 10), group='cap')
    # a short beard band round the jaw, below the mouth
    p.layer('beard', base=HAIR_INK, voxel=0.01, target_faces=700)
    Rf, fcy, ex, ey, my = face_pts(K)
    for k in range(11):
        a = math.radians(-58 + 116 * k / 10)
        x = hx * 0.8 * math.sin(a)
        z = hz * 0.86 * math.cos(a)
        y = my - 0.2 + 0.1 * (1 - math.cos(a))
        p.blob((x, y, z - 0.02), (0.1, 0.085 + 0.03 * math.cos(a), 0.08), group='beard')
    p.layer('skin')
    p.rigid.update(beard='head', hair='head')
    rig(p, K)
    finish(p, K, 2.0)


# ======================================================================= GRANDMA
def grandma():
    p = Person('prop_word_grandma')
    K = person(p, H=2.5, head=(0.53, 0.48, 0.47), hip=0.6, girth=1.18, skin=LIGHT, arms='down')
    SHY, hip = K['SHY'], K['hip']
    paint_top(p, K, PURPLE, sleeve=0.92)
    p.paint_fn(lambda q, n: n.z > 0.3 and abs(q.x) < 0.07 and q.y > hip + 0.2 and p.owner(Vector((q.x, q.y, q.z))) == 'body', CREAM)
    paint_shoes(p, K, PURPLE_D)
    p.layer('skirt', base=ROSE, voxel=0.012, target_faces=900)
    p.lathe(rounded([(0, 0.24), (0.5, 0.24), (0.44, hip + 0.3), (0.0, hip + 0.3)], 0.06, n=3), scale=(1, 0.88), seg=40)
    p.cut_cone((0, -0.2, 0.0), (0, hip + 0.1, 0.0), 0.44, 0.38)
    p.paint_fn(lambda q, n: q.y < 0.32 and n.y < 0.4, ROSE_D)
    p.inside(ROSE_D)
    p.layer('buttons', base=YELLOW, voxel=0.006, target_faces=300)
    for k in range(3):
        y = hip + 0.36 + k * 0.17
        p.blob((0.1, y, 0.33 * 1.18 * 0.9 + 0.0), (0.042, 0.042, 0.03), group='b%d' % k)
    # grey hair with a round bun on top
    hair_cap(p, K, HAIR_GREY, fringe=False, top=0.0)
    HC, hx, hy, hz = K['HC'], K['hx'], K['hy'], K['hz']
    for s in (-1, 1):
        p.blob((s * 0.2, HC + hy * 0.62, hz * 0.5), (0.2, 0.1, 0.11), rot=(0, 0, s * 18), group='cap')
    p.blob((0, HC + hy + 0.12, -0.08), (0.2, 0.17, 0.19), group='bun')
    # round glasses over the code eyes
    p.layer('glasses', base=INK, voxel=0.006, target_faces=700)
    Rf, fcy, EX, ey, my = face_pts(K)
    R = Rf / 1.25
    for s in (-1, 1):
        ex = s * EX
        ez = math.sqrt(max(0.0, (hz + 0.02) ** 2 - ex ** 2 * (hz / hx) ** 2)) + 0.02
        p.ring((ex, ey, ez), 0.125, 0.026, rot=(90, 0, 0), seg=28, rseg=6)
        p.tube([(s * (EX + 0.125), ey, ez - 0.02), (s * (hx - 0.02), ey + 0.02, 0.15)], 0.022, rseg=6)
    p.tube([(-EX + 0.125, ey + 0.02, hz + 0.03), (0, ey + 0.05, hz + 0.06), (EX - 0.125, ey + 0.02, hz + 0.03)], 0.022, rseg=6)
    p.layer('skin')
    p.rigid.update(glasses='head', hair='head')
    rig(p, K)
    finish(p, K, 1.6)


# ======================================================================= GRANDPA
def grandpa():
    p = Person('prop_word_grandpa')
    K = person(p, H=2.6, head=(0.53, 0.48, 0.47), hip=0.72, girth=1.08, skin=LIGHT, arms='down')
    SHY, hip = K['SHY'], K['hip']
    paint_top(p, K, CREAM, sleeve=0.9)
    paint_bottoms(p, K, BROWN)
    paint_shoes(p, K, SHOE_BROWN)
    HC, hx, hy, hz = K['HC'], K['hx'], K['hy'], K['hz']
    # grey hair only at the sides and back (bald top under the cap)
    p.layer('hair', base=HAIR_GREY, voxel=0.011, target_faces=900)
    for s in (-1, 1):
        p.blob((s * (hx - 0.03), HC - 0.02, -0.1), (0.13, 0.2, 0.26), group='side%d' % s)
        p.blob((s * (hx + 0.0), HC + 0.08, -0.05), (0.1, 0.12, 0.16), group='side%d' % s)
    p.blob((0, HC - 0.05, -hz + 0.02), (hx * 0.8, 0.2, 0.12), group='back')
    # big grey moustache under the nose, clear of the smile
    p.layer('tache', base=GREY_D, voxel=0.008, target_faces=600)
    Rf, fcy, ex, ey, mt = face_pts(K)
    my = mt + 0.075
    for s in (-1, 1):
        p.blob((s * 0.11, my, hz * 0.99), (0.13, 0.058, 0.07), rot=(0, s * 18, s * -10), group='t%d' % s)
        p.blob((s * 0.24, my - 0.035, hz * 0.9), (0.08, 0.05, 0.055), rot=(0, s * 35, s * -28), group='t%d' % s)
    # flat brown cap
    p.layer('cap', base=BROWN, voxel=0.011, target_faces=900)
    p.blob((0, HC + hy * 0.62, -0.02), (hx + 0.05, 0.22, hz + 0.03), group='crown')
    p.blob((0, HC + hy * 0.4, -0.02), (hx + 0.04, 0.15, hz + 0.02), group='crown')
    p.blob((0, HC + hy * 0.55, hz * 0.3), (hx * 0.75, 0.13, hz * 0.7), rot=(18, 0, 0), group='crown')
    p.box((0, HC + hy * 0.38, hz + 0.08), (0.36, 0.035, 0.14), rot=(8, 0, 0), bevel=0.03)
    p.paint_fn(lambda q, n: q.y < HC + hy * 0.42 and q.z > hz - 0.05, BROWN_D)
    # red braces over the shoulders
    p.layer('braces', base=RED, voxel=0.007, target_faces=700, quadriflow=False)
    for s in (-1, 1):
        pts = [(s * 0.17, hip + 0.18), (s * 0.18, hip + 0.5), (s * 0.2, SHY - 0.02)]
        dash_line(p, pts, w=0.08, dash=0.12, gap=0.0, thick=0.03, lift=0.012)
    p.layer('clips', base=YELLOW, voxel=0.006, target_faces=200)
    for s in (-1, 1):
        p.blob((s * 0.17, hip + 0.22, 0.36), (0.05, 0.04, 0.03), group='c%d' % s)
    p.layer('skin')
    p.rigid.update(hair='head', tache='head', cap='head')
    rig(p, K)
    finish(p, K, 1.6)


# ======================================================================= DOCTOR
def doctor():
    p = Person('prop_word_doctor')
    K = person(p, H=2.6, head=(0.52, 0.47, 0.46), hip=0.72, girth=0.98, skin=MID, arms=(0.62, 1.02, 0.14))
    SHY, hip = K['SHY'], K['hip']
    paint_top(p, K, WHITE, sleeve=0.92)
    p.paint_fn(lambda q, n: n.z > 0.25 and abs(q.x) < 0.2 and q.y > hip + 0.25 and p.owner(Vector((q.x, q.y, q.z))) == 'body', SKY)
    paint_bottoms(p, K, SLATE)
    paint_shoes(p, K, INK)
    # the white coat: long, open at the front
    p.layer('coat', base=WHITE, voxel=0.012, target_faces=1200)
    p.lathe(rounded([(0, 0.42), (0.45, 0.42), (0.42, hip + 0.3), (0.36, SHY - 0.05), (0.2, SHY + 0.04), (0, SHY + 0.04)], 0.06, n=3), scale=(1, 0.88), seg=40)
    p.cut_cone((0, 0.0, 0.0), (0, SHY + 0.3, 0.0), 0.38, 0.2)
    p.cut_ell((0, hip + 0.45, 0.5), (0.17, 0.75, 0.3))         # the open front
    p.paint_fn(lambda q, n: q.y < 0.48 and n.y < 0.4, WHITE_D)
    p.inside(WHITE_D)
    # stethoscope round the neck
    p.layer('steth', base=GREY, voxel=0.006, target_faces=700)
    U = [(-0.2, SHY - 0.42, 0.33), (-0.24, SHY - 0.2, 0.3), (-0.22, SHY - 0.02, 0.17), (-0.15, SHY + 0.04, -0.05), (0, SHY + 0.06, -0.2),
         (0.15, SHY + 0.04, -0.05), (0.22, SHY - 0.02, 0.17), (0.24, SHY - 0.2, 0.3), (0.21, SHY - 0.3, 0.33)]
    p.tube(rounded(U, 0.07, n=3), 0.032, rseg=6)
    p.blob((0.21, SHY - 0.32, 0.33), (0.04, 0.04, 0.04), group='tip')
    p.layer('disc', base=RED, voxel=0.006, target_faces=200)
    p.blob((-0.2, SHY - 0.48, 0.35), (0.08, 0.08, 0.04), group='d')
    p.paint('dc', (-0.2, SHY - 0.48, 0.39), (0.04, 0.04, 0.02), GREY_L)
    # the white doctor's bag with a red cross, in her right hand
    p.layer('bag', base=WHITE, voxel=0.01, target_faces=700)
    h = K['handR']
    bc = h + Vector((0.08, -0.36, 0.08))
    p.box(tuple(bc), (0.25, 0.18, 0.13), bevel=0.08)
    p.tube([tuple(bc + Vector((-0.1, 0.16, 0))), tuple(bc + Vector((-0.08, 0.3, 0))), tuple(bc + Vector((0.08, 0.3, 0))), tuple(bc + Vector((0.1, 0.16, 0)))], 0.035, rseg=6)
    p.paint_fn(lambda q, n: q.y > bc.y + 0.13, GREY_L)
    p.layer('cross', base=RED, voxel=0.006, target_faces=200, quadriflow=False)
    cr = [(-0.035, 0.1), (0.035, 0.1), (0.035, 0.035), (0.1, 0.035), (0.1, -0.035), (0.035, -0.035), (0.035, -0.1), (-0.035, -0.1), (-0.035, -0.035), (-0.1, -0.035), (-0.1, 0.035), (-0.035, 0.035)]
    p.sticker(rounded(cr, 0.012, n=2, closed=True), (bc.x, bc.y - 0.01), onto='bag', thick=0.03, lift=0.01, step=0.02)
    # an ink bob
    hair_cap(p, K, HAIR_INK, back=0.02)
    HC, hx, hy, hz = K['HC'], K['hx'], K['hy'], K['hz']
    for s in (-1, 1):
        p.blob((s * (hx - 0.02), HC - hy * 0.35, -0.02), (0.15, 0.3, 0.3), group='bob%d' % s)
    p.blob((0, HC - hy * 0.35, -hz * 0.55), (hx, 0.3, 0.2), group='bobb')
    p.layer('skin')
    p.rigid.update(bag='arm.R', cross='arm.R', hair='head')
    rig(p, K)
    finish(p, K, 1.7)


# ======================================================================= QUEEN
def queen():
    p = Person('prop_word_queen')
    K = person(p, H=2.5, head=(0.52, 0.47, 0.46), hip=0.72, girth=0.98, skin=DEEP, arms=(0.6, 1.0, 0.18))
    SHY, hip = K['SHY'], K['hip']
    paint_top(p, K, PURPLE, sleeve=0.92)
    # the long bell gown with an ermine hem
    p.layer('gown', base=PURPLE, voxel=0.012, target_faces=1200)
    p.lathe(rounded([(0, 0.0), (0.66, 0.0), (0.55, 0.4), (0.4, hip + 0.25), (0.33, hip + 0.5), (0.0, hip + 0.5)], 0.06, n=3), scale=(1, 0.9), seg=44)
    p.paint_fn(lambda q, n: q.y > hip + 0.2 and abs(q.y - (hip + 0.25)) < 0.035, YELLOW)
    p.layer('ermine', base=WHITE, voxel=0.01, target_faces=900)
    p.lathe(rounded([(0.6, 0.0), (0.72, 0.0), (0.7, 0.16), (0.6, 0.16)], 0.05, n=2), scale=(1, 0.9), seg=48, closed=True)
    p.ring((0, SHY + 0.0, 0.0), 0.3, 0.07, scale=(1, 0.85), seg=36, rseg=8)
    def spot(q, n):
        a = math.atan2(q.x, q.z)
        if q.y < 0.2:
            u = a / TAU * 16
            return abs(u - round(u)) < 0.12 and abs(q.y - 0.09) < 0.04
        u = a / TAU * 9
        return abs(u - round(u)) < 0.1 and n.y > -0.2 and q.y > SHY
    p.paint_fn(spot, INK)
    # the big gold crown (prop_word_crown's shapes, scaled down)
    HC, hx, hy, hz = K['HC'], K['hx'], K['hy'], K['hz']
    hair_cap(p, K, BROWN, fringe=True, back=0.02)
    for s in (-1, 1):
        p.blob((s * (hx - 0.0), HC - hy * 0.3, -0.06), (0.15, 0.3, 0.26), group='hs%d' % s)
    p.layer('crown', base=YELLOW, voxel=0.008, target_faces=1100)
    CS, CY = 0.42, HC + hy * 0.62
    R0 = 0.78 * CS
    p.lathe(rounded([(R0 - 0.06, CY), (R0 + 0.03, CY), (R0 + 0.04, CY + 0.2), (R0 - 0.04, CY + 0.2)], 0.025, n=2), seg=48, closed=True)
    for k in range(5):
        a = k / 5 * TAU
        for t in range(6):
            u = t / 5
            rr = R0 - 0.01 - u * 0.04
            p.blob((math.sin(a) * rr, CY + 0.19 + u * 0.36, math.cos(a) * rr), (0.1 * (1 - u * 0.7), 0.06, 0.035), rot=(0, math.degrees(a), 0), group='pt%d' % k)
    p.paint_fn(lambda q, n: q.y < CY + 0.04, YELLOW_D)
    p.layer('pearls', base=WHITE, voxel=0.006, target_faces=400)
    for k in range(5):
        a = k / 5 * TAU
        rr = R0 - 0.05
        p.blob((math.sin(a) * rr, CY + 0.58, math.cos(a) * rr), (0.05, 0.05, 0.05), group='pe%d' % k)
    p.layer('gems', base=RED, voxel=0.006, target_faces=500)
    for k in range(5):
        a = (k + 0.5) / 5 * TAU - math.pi / 5 * 0 + math.pi
        a = k / 5 * TAU
        pos = (math.sin(a) * (R0 + 0.04), CY + 0.1, math.cos(a) * (R0 + 0.04))
        p.blob(pos, (0.045, 0.055, 0.025), rot=(0, math.degrees(a), 0), group='g%d' % k)
        p.paint('gc%d' % k, pos, (0.08, 0.08, 0.08), (RED, BLUE)[k % 2])
    # a short gold sceptre in her right hand
    p.layer('sceptre', base=YELLOW, voxel=0.008, target_faces=600)
    h = K['handR']
    p.capsule(tuple(h + Vector((0.0, -0.22, 0.04))), tuple(h + Vector((0.0, 0.32, 0.04))), 0.045, group='rod')
    p.blob(tuple(h + Vector((0, 0.42, 0.04))), (0.1, 0.1, 0.1), group='orb')
    p.paint_fn(lambda q, n: q.y > h.y + 0.36 and math.hypot(q.x - h.x, q.z - h.z - 0.04) > 0.0 and q.z > h.z + 0.1, RED)
    p.layer('skin')
    p.rigid.update(sceptre='arm.R', crown='head', pearls='head', gems='head', hair='head')
    rig(p, K)
    finish(p, K, 1.6)


MODELS = dict(prop_word_baby=baby, prop_word_girl=girl, prop_word_boy=boy, prop_word_mummy=mummy, prop_word_daddy=daddy,
              prop_word_grandma=grandma, prop_word_grandpa=grandpa, prop_word_doctor=doctor, prop_word_queen=queen)
BUDGETS = dict(prop_word_baby=6000, prop_word_girl=6500, prop_word_boy=6500, prop_word_mummy=7000, prop_word_daddy=7000, prop_word_grandma=7000, prop_word_grandpa=7000, prop_word_doctor=7000, prop_word_queen=7500)   # VOCAB.md 'tris' column
run_models(MODELS, BUDGETS, ONLY)
