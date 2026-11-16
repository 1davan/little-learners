"""Story props for the meadow games (Feelings stories, Big and small presents / toy box, Apple count tables).
  prop_m_giftbox   present box 1.0 x 0.8 x 1.0, origin at the base. TINT = paper; layer 'ribbon' (white, the game
                   recolours it).
  prop_m_giftlid   its lid 1.12 x 0.22 x 1.12 centred on the origin, with a big bow; TINT = paper, layer 'ribbon'.
  prop_m_cone      waffle cone, tip at y 0, rim at y 1.0 (radius 0.33).
  prop_m_scoop     ice-cream scoop (radius ~0.4, centred), TINT = flavour; cherry layer.
  prop_m_cup       picnic cup 0.6 tall centred, TINT; white rim and dots.
  prop_m_bolt      flat lightning bolt, top at y 0 (hangs down to -2.1).
  prop_m_jackbox   jack-in-the-box box 1.0 cube on y 0, crank on bone 'crank' (spins about its own axis, rotation.y).
  prop_m_jacklid   its lid, hinged at the origin (back edge), reaching +z 1.05.
  prop_m_jack      the clown on a spring (spring from y 0, head at ~1.2) with a code face.
  prop_m_spider    a round fuzzy spider (radius ~0.42) with a code face.
  prop_m_dirt      a dirt mound ring (mole hole), radius ~0.65.
  prop_m_mole      the mole (pops up out of the hole), body base at y -0.1, code face.
  prop_m_butterfly wings on bones wing.L / wing.R (rotation.z flaps), TINT = upper wings, lying flat, head +z.
  prop_m_bee       a round bee facing +z with a code face, wings on bones wing.L / wing.R (rotation.z flaps).
  prop_m_toybox    red toy box 2.2 x 1.4 x 1.4 with a yellow lid propped open.
  prop_m_blanket   checked picnic blanket 9.4 x 2.4 (flat, on y 0).
  prop_m_tray      baking tray 8.6 x 2.1 with a lip, and an oven mitt.
  prop_m_table     oval party table (top at y 2.43, 7.8 x 3.5) with a pink cloth and bunting.
ONLY=prop_m_cup tools/blender/build.sh prop_meadow_story"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded, circle_poly, star_poly, rot_m

ONLY = [s for s in os.environ.get('ONLY', '').split(',') if s]
WHITE, INK = 0xffffff, 0x3a2838
TAU = math.tau


def slab(p, poly, z, thick, rot=(0, 0, 0), off=(0, 0, 0)):
    from mathutils import Vector
    M = rot_m(rot)
    m = len(poly)
    verts = []
    for d in (z - thick / 2, z + thick / 2):
        verts.append(tuple(M @ Vector((0, 0, d)) + Vector(off)))
        for x, y in poly:
            verts.append(tuple(M @ Vector((x, y, d)) + Vector(off)))
    faces = []
    k = m + 1
    for i in range(m):
        j = (i + 1) % m
        faces.append((0, 1 + j, 1 + i)); faces.append((k, k + 1 + i, k + 1 + j)); faces.append((1 + i, 1 + j, k + 1 + j, k + 1 + i))
    p.mesh(verts, faces)


def fin(p, h0, h1, outline=0.022, tint=None):
    if not any(b[0] == 'body' for b in p.bones):
        p.bone('body', (0, h0, 0), (0, h1, 0))
    if tint is not None:
        p.extras['argMode'] = 'tint'
        p.extras['argDefault'] = tint
    p.extras['outline'] = outline
    p.build()


def giftbox():
    p = Prop('prop_m_giftbox', base=WHITE, target_faces=1400, voxel=0.014)
    p.box((0, 0.4, 0), (0.5, 0.4, 0.5), bevel=0.06)
    p.layer('ribbon', base=WHITE, target_faces=900, voxel=0.01)
    p.box((0, 0.4, 0), (0.1, 0.405, 0.515), bevel=0.02)
    p.box((0, 0.4, 0), (0.515, 0.405, 0.1), bevel=0.02)
    p.layer('skin')
    fin(p, 0, 0.8, 0.024, tint=0xa77bff)


def giftlid():
    p = Prop('prop_m_giftlid', base=WHITE, target_faces=1200, voxel=0.014)
    p.box((0, 0, 0), (0.56, 0.11, 0.56), bevel=0.05)
    p.layer('ribbon', base=WHITE, target_faces=1600, voxel=0.01)
    p.box((0, 0, 0), (0.1, 0.115, 0.575), bevel=0.02)
    p.box((0, 0, 0), (0.575, 0.115, 0.1), bevel=0.02)
    # the bow: two fat loops, two tails and a knot
    for s in (-1, 1):
        pts = [(s * (0.05 + 0.24 * (1 - math.cos(a))), 0.13 + 0.2 * math.sin(a), 0.02 * math.sin(a)) for a in [i * math.pi / 10 for i in range(11)]]
        p.tube(pts, 0.065, rseg=10)
        p.capsule((s * 0.05, 0.13, 0.05), (s * 0.2, 0.12, 0.3), 0.05, group='tail%d' % s, r2=0.045)
    p.blob((0, 0.17, 0.0), (0.09, 0.08, 0.09), group='knot')
    p.layer('skin')
    fin(p, -0.11, 0.4, 0.024, tint=0xa77bff)


def cone():
    WAF, WAF_D = 0xe0a85a, 0xc0883e
    p = Prop('prop_m_cone', base=WAF, target_faces=1400, voxel=0.011)
    p.lathe(rounded([(0, 0.0), (0.05, 0.06), (0.3, 0.88), (0.36, 0.92), (0.36, 1.0), (0.3, 1.02), (0, 1.0)], 0.03, n=3), seg=32)
    def grid(q, n):
        a = math.atan2(q.x, q.z)
        u, v = a * 1.6 + q.y * 7, a * 1.6 - q.y * 7
        return (abs(u - round(u)) < 0.08 or abs(v - round(v)) < 0.08) and q.y < 0.88
    p.paint_fn(grid, WAF_D)
    p.paint_fn(lambda q, n: q.y > 0.9, 0xd89a4c)
    p.bone('body', (0, 0, 0), (0, 1.0, 0))
    p.extras['outline'] = 0.02
    p.build()


def scoop():
    p = Prop('prop_m_scoop', base=WHITE, target_faces=1400, voxel=0.011)
    p.blob((0, 0.04, 0), (0.37, 0.33, 0.37), group='s')
    for k in range(9):
        a = k / 9 * TAU
        p.blob((0.35 * math.sin(a), -0.2, 0.35 * math.cos(a)), (0.11, 0.09 + 0.03 * (k % 2), 0.11), group='s')
    p.layer('cherry', base=0xe8143a, target_faces=300, voxel=0.008)
    p.blob((0.03, 0.42, 0.05), (0.1, 0.1, 0.1), group='c')
    p.tube([(0.03, 0.5, 0.05), (0.06, 0.6, 0.04), (0.12, 0.66, 0.02)], 0.015, rseg=5)
    p.paint_fn(lambda q, n: q.y > 0.52, 0x6a8a3a)
    p.layer('skin')
    p.layer('shine', base=WHITE, target_faces=120, voxel=0.006)
    p.blob((-0.17, 0.22, 0.24), (0.05, 0.08, 0.012), rot=(-30, -35, 20), group='sh')
    p.layer('skin')
    fin(p, -0.3, 0.4, 0.022, tint=0x5fd068)


def cup():
    p = Prop('prop_m_cup', base=WHITE, target_faces=1300, voxel=0.01)
    p.lathe(rounded([(0, -0.3), (0.24, -0.3), (0.32, 0.27), (0.28, 0.27), (0.21, -0.24), (0, -0.24)], 0.025, n=3), seg=36)
    p.paint_fn(lambda q, n: math.hypot(q.x, q.z) < 0.21 + 0.07 * (q.y + 0.24) / 0.51 + 0.02 and q.y > -0.25, 0xb0b0b0)
    p.layer('rim', base=WHITE, target_faces=500, voxel=0.008)
    p.ring((0, 0.275, 0), 0.305, 0.03, seg=36, rseg=8)
    for k in range(7):
        a = k / 7 * TAU + 0.2
        y = -0.05 + 0.12 * (k % 2)
        r = 0.24 + 0.08 * (y + 0.3) / 0.6 + 0.012
        p.blob((r * math.sin(a), y, r * math.cos(a)), (0.05, 0.05, 0.015), rot=(0, math.degrees(a), 0), group='d%d' % k)
    p.layer('skin')
    fin(p, -0.3, 0.3, 0.02, tint=0x4a90ff)


def bolt():
    p = Prop('prop_m_bolt', base=0xffd23f, target_faces=700, voxel=0.012)
    pts = [(0, 0), (0.55, 0), (0.12, -0.8), (0.58, -0.8), (-0.3, -2.1), (0.02, -1.02), (-0.42, -1.02)]
    poly = rounded(pts, 0.05, n=2, closed=True)
    slab(p, [q[:2] for q in poly], 0, 0.18)
    p.paint_fn(lambda q, n: n.z < 0.5 and n.z > -0.5, 0xf0b52a)
    p.bone('body', (0, -2.1, 0), (0, 0, 0))
    p.extras['outline'] = 0.03
    p.build()


def jackbox():
    p = Prop('prop_m_jackbox', base=0xff5a5a, target_faces=1600, voxel=0.014)
    p.box((0, 0.5, 0), (0.5, 0.5, 0.5), bevel=0.07)
    p.layer('deco', base=0xffd23f, target_faces=1200, voxel=0.008)
    slab(p, [q[:2] for q in [(x, y) for x, y in star_poly(0.3, 0.5)]], 0.5, 0.03, off=(0, 0.5, 0))
    slab(p, [(0, 0.28), (0.28, 0), (0, -0.28), (-0.28, 0)], 0.5, 0.03, rot=(0, 90, 0), off=(0, 0.5, 0))
    slab(p, [(0, 0.28), (0.28, 0), (0, -0.28), (-0.28, 0)], 0.5, 0.03, rot=(0, -90, 0), off=(0, 0.5, 0))
    p.paint_fn(lambda q, n: abs(q.x) > 0.45, 0x4a90ff)
    p.layer('skin')
    # the crank on the left side, on its own bone (spins about its own axis)
    p.layer('crankarm', base=0xffd23f, target_faces=600, voxel=0.01)
    p.capsule((-0.5, 0.55, 0), (-0.66, 0.55, 0), 0.045, group='axle')
    p.capsule((-0.64, 0.55, 0), (-0.64, 0.8, 0), 0.04, group='arm')
    p.capsule((-0.64, 0.8, 0), (-0.76, 0.8, 0), 0.05, group='grip', r2=0.06)
    p.layer('skin')
    is_crank = lambda q: q.x < -0.53
    p.bone('body', (0, 0, 0), (0, 1.0, 0), region=lambda q: not is_crank(q))
    p.bone('crank', (-0.5, 0.55, 0), (-0.75, 0.55, 0), parent='body', region=is_crank)
    p.extras['outline'] = 0.024
    p.build()


def jacklid():
    p = Prop('prop_m_jacklid', base=0x4a90ff, target_faces=800, voxel=0.012)
    p.box((0, 0.06, 0.525), (0.53, 0.06, 0.53), bevel=0.05)
    p.blob((0, 0.13, 0.525), (0.1, 0.05, 0.1), group='knob')
    p.paint_fn(lambda q, n: q.y > 0.11 and math.hypot(q.x, q.z - 0.525) < 0.12, 0xffd23f)
    fin(p, 0, 0.12, 0.022)


def jack():
    p = Prop('prop_m_jack', base=0xfff0dd, target_faces=1600, voxel=0.012)
    p.blob((0, 1.2, 0), (0.42, 0.4, 0.38), group='head')
    p.layer('spring', base=0xe6e6ee, target_faces=900, voxel=0.01)
    pts = [(0.18 * math.cos(t), 0.02 + t / TAU * 0.16, 0.18 * math.sin(t)) for t in [i * 0.4 for i in range(int(6 * TAU / 0.4))]]
    p.tube(pts, 0.04, rseg=6)
    p.layer('skin')
    p.layer('hat', base=0xa77bff, target_faces=600, voxel=0.01)
    p.lathe(rounded([(0, 1.5), (0.3, 1.5), (0.04, 2.05), (0, 2.06)], 0.04, n=2), seg=24)
    p.blob((0, 2.1, 0), (0.1, 0.1, 0.1), group='pom')
    p.paint_fn(lambda q, n: q.y > 2.0, 0xffd23f)
    p.paint_fn(lambda q, n: abs(((q.y - 1.5) / 0.14) % 1 - 0.5) < 0.2 and q.y < 1.95, 0xff8fc0)
    p.layer('skin')
    p.layer('hair', base=0xff9f3f, target_faces=600, voxel=0.01)
    for s in (-1, 1):
        for k, (dy, dz) in enumerate([(0.12, 0.0), (-0.05, -0.05), (0.25, -0.1)]):
            p.blob((s * 0.4, 1.2 + dy, dz), (0.12, 0.12, 0.12), group='h%d%d' % (s, k))
    p.layer('skin')
    p.layer('nose', base=0xff3b4e, target_faces=200, voxel=0.007)
    p.blob((0, 1.13, 0.4), (0.09, 0.08, 0.08), group='n')
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 2.1, 0))
    p.face((0, 1.2, 0.0), 0.38, bone='body', faceScale=0.9)
    p.extras['outline'] = 0.022
    p.build()


def spider():
    BODY = 0x5a4a6e
    p = Prop('prop_m_spider', base=BODY, target_faces=1800, voxel=0.012)
    p.blob((0, 0, 0), (0.42, 0.4, 0.38), group='b')
    for k in range(18):
        y = 1 - 2 * (k + 0.5) / 18
        r = math.sqrt(1 - y * y); a = k * 2.4
        p.blob((0.36 * r * math.cos(a), 0.36 * y, 0.32 * r * math.sin(a) - 0.04), (0.09, 0.09, 0.09), group='b', stiffness=2.4)
    p.layer('legs', base=0x4a3a5a, target_faces=1600, voxel=0.01)
    for s in (-1, 1):
        for i in range(4):
            z = (i - 1.5) * 0.17
            pts = [(s * 0.3, -0.05, z), (s * 0.62, 0.18, z * 1.3), (s * 0.82, -0.18, z * 1.5), (s * 0.9, -0.42, z * 1.6)]
            p.tube(pts, [0.05, 0.045, 0.04, 0.035], rseg=6)
            p.blob((s * 0.9, -0.43, z * 1.6), (0.055, 0.04, 0.055), group='f%d%d' % (s, i))
    p.layer('skin')
    p.bone('body', (0, -0.45, 0), (0, 0.45, 0))
    p.face((0, 0.02, 0), 0.38, bone='body', faceScale=1.0)
    p.extras['outline'] = 0.022
    p.build()


def dirt():
    p = Prop('prop_m_dirt', base=0x7a5232, target_faces=900, voxel=0.014)
    p.lathe(rounded([(0.3, 0.0), (0.66, 0.0), (0.56, 0.16), (0.42, 0.2), (0.36, 0.12), (0.3, 0.02)], 0.05, n=3), seg=32, closed=True)
    for k in range(7):
        a = k / 7 * TAU + 0.3
        p.blob((0.58 * math.sin(a), 0.07, 0.58 * math.cos(a)), (0.12, 0.08, 0.12), group='c%d' % k)
    p.paint_fn(lambda q, n: math.hypot(q.x, q.z) < 0.38, 0x4a3020)
    fin(p, 0, 0.2, 0.02)


def mole():
    p = Prop('prop_m_mole', base=0x7a6a80, target_faces=1600, voxel=0.012)
    p.blob((0, 0.3, 0), (0.42, 0.5, 0.38), group='b')
    p.decal('belly', (0, 0.2), (0.24, 0.22, 0.3), 0x9a8aa0)
    p.layer('nose', base=0xff8fc0, target_faces=300, voxel=0.008)
    p.blob((0, 0.42, 0.42), (0.11, 0.09, 0.09), group='n')
    p.layer('skin')
    p.layer('paws', base=0xffb3d1, target_faces=600, voxel=0.009)
    for s in (-1, 1):
        p.blob((s * 0.32, 0.18, 0.3), (0.14, 0.07, 0.11), rot=(0, 0, s * 20), group='p%d' % s)
        for k in range(3):
            p.blob((s * (0.3 + (k - 1) * 0.07), 0.15, 0.4), (0.03, 0.03, 0.04), group='p%d' % s)
    p.layer('skin')
    p.bone('body', (0, -0.2, 0), (0, 0.8, 0))
    p.face((0, 0.5, 0), 0.36, bone='body', faceScale=0.9, noseColor=None)
    p.extras['outline'] = 0.022
    p.build()


def butterfly():
    p = Prop('prop_m_butterfly', base=WHITE, target_faces=1600, voxel=0.01)
    # wings lying flat (xz plane), head toward +z; upper wings tinted, lower wings in layer 'lower'
    for s in (-1, 1):
        p.blob((s * 0.3, 0, 0.08), (0.27, 0.025, 0.22), rot=(0, s * -20, 0), group='u%d' % s)
    p.paint_fn(lambda q, n: math.hypot(abs(q.x) - 0.36, q.z - 0.12) < 0.08, 0xf2f2f2)
    p.layer('lower', base=0xffd23f, target_faces=800, voxel=0.01)
    for s in (-1, 1):
        p.blob((s * 0.22, -0.005, -0.2), (0.17, 0.022, 0.15), rot=(0, s * 25, 0), group='l%d' % s)
    p.layer('skin')
    p.layer('bod', base=INK, target_faces=500, voxel=0.008)
    p.capsule((0, 0.02, -0.25), (0, 0.02, 0.28), 0.05, group='b')
    p.blob((0, 0.03, 0.32), (0.07, 0.07, 0.07), group='b')
    for s in (-1, 1):
        p.tube([(s * 0.03, 0.06, 0.36), (s * 0.08, 0.14, 0.48), (s * 0.12, 0.16, 0.52)], 0.012, rseg=5)
    p.layer('skin')
    wing = lambda s: (lambda q: q.x * s > 0.05)
    p.bone('body', (0, 0, -0.3), (0, 0, 0.35), region=lambda q: abs(q.x) <= 0.05)
    p.bone('wing.L', (-0.05, 0, 0), (-0.55, 0, 0), parent='body', region=wing(-1))
    p.bone('wing.R', (0.05, 0, 0), (0.55, 0, 0), parent='body', region=wing(1))
    p.extras.update(argMode='tint', argDefault=0xa77bff, outline=0.016)
    p.build()


def bee():
    p = Prop('prop_m_bee', base=0xffd23f, target_faces=1800, voxel=0.011)
    p.blob((0, 0, 0), (0.4, 0.36, 0.36), group='b')
    p.blob((0, 0.02, -0.22), (0.3, 0.27, 0.25), group='b')
    p.capsule((0, -0.02, -0.46), (0, -0.05, -0.56), 0.05, group='sting', r2=0.02)
    p.paint_fn(lambda q, n: abs(q.z + 0.08) < 0.06 or abs(q.z + 0.3) < 0.06 or q.z < -0.5, 0x3a2838)
    p.layer('wings', base=0xeaf6ff, target_faces=700, voxel=0.009)
    for s in (-1, 1):
        p.blob((s * 0.3, 0.36, -0.12), (0.22, 0.08, 0.13), rot=(0, 0, s * -35), group='w%d' % s)
        p.blob((s * 0.2, 0.32, -0.3), (0.13, 0.06, 0.09), rot=(0, 0, s * -30), group='w2%d' % s)
    p.layer('skin')
    p.layer('antenna', base=0x3a2838, target_faces=300, voxel=0.007)
    for s in (-1, 1):
        p.tube([(s * 0.1, 0.3, 0.12), (s * 0.15, 0.45, 0.16), (s * 0.2, 0.52, 0.12)], 0.015, rseg=5)
        p.blob((s * 0.2, 0.53, 0.12), (0.035, 0.035, 0.035), group='a%d' % s)
    p.layer('skin')
    isw = lambda s: (lambda q: q.y > 0.3 and q.x * s > 0.06 and q.z < 0.0)
    p.bone('body', (0, -0.35, 0), (0, 0.4, 0), region=lambda q: not (isw(-1)(q) or isw(1)(q)))
    p.bone('wing.L', (-0.08, 0.32, -0.15), (-0.5, 0.45, -0.15), parent='body', region=isw(-1))
    p.bone('wing.R', (0.08, 0.32, -0.15), (0.5, 0.45, -0.15), parent='body', region=isw(1))
    p.face((0, 0.0, 0), 0.34, bone='body', faceScale=1.0)
    p.extras['outline'] = 0.02
    p.build()


def toybox():
    p = Prop('prop_m_toybox', base=0xd94f3d, target_faces=2000, voxel=0.02)
    p.box((0, 0.7, 0), (1.1, 0.7, 0.7), bevel=0.1)
    p.paint_fn(lambda q, n: n.z > 0.6 and abs(q.x) < 0.7 and abs(q.y - 0.7) < 0.42, 0xff7a6a)
    p.layer('lid', base=0xffd23f, target_faces=900, voxel=0.018)
    p.box((0, 1.55, -0.95), (1.15, 0.1, 0.72), rot=(-62, 0, 0), bevel=0.06)
    p.layer('skin')
    p.layer('toys', base=0x4a90ff, target_faces=900, voxel=0.015)
    p.blob((-0.5, 1.45, 0.05), (0.28, 0.28, 0.28), group='ball')
    p.box((0.45, 1.45, 0.0), (0.22, 0.22, 0.22), rot=(0, 30, 15), bevel=0.05)
    p.paint_fn(lambda q, n: q.x > 0.1, 0x5fd068)
    p.layer('skin')
    p.layer('star', base=0xffffff, target_faces=500, voxel=0.01)
    slab(p, star_poly(0.3, 0.5), 0.71, 0.04, off=(0, 0.7, 0))
    p.layer('skin')
    fin(p, 0, 1.6, 0.03)


def blanket():
    p = Prop('prop_m_blanket', base=0xffffff, target_faces=3200, voxel=0.025)
    W, D = 4.7, 1.2
    # a soft slab with a few gentle ripples
    p.box((0, 0.04, 0), (W, 0.04, D), bevel=0.035)
    p.capsule((-W + 0.4, 0.06, -D * 0.4), (-W + 1.2, 0.07, D * 0.3), 0.06, group='r1')
    p.capsule((W - 1.0, 0.06, D * 0.5), (W - 0.3, 0.06, -D * 0.2), 0.06, group='r2')
    p.paint_fn(lambda q, n: (math.floor((q.x + W) / (2 * W / 8)) + math.floor((q.z + D) / D)) % 2 == 0, 0xff7a7a)
    p.paint_fn(lambda q, n: abs(abs(q.x) - W) < 0.08 or abs(abs(q.z) - D) < 0.08, 0xe85a5a)
    fin(p, 0, 0.1, 0.02)


def tray():
    p = Prop('prop_m_tray', base=0xc4ccd6, target_faces=2400, voxel=0.022)
    p.box((0, 0.1, 0), (4.3, 0.06, 1.05), bevel=0.05)
    for s in (-1, 1):
        p.box((0, 0.17, s * 1.05), (4.4, 0.08, 0.06), bevel=0.05)
        p.box((s * 4.35, 0.17, 0), (0.06, 0.08, 1.1), bevel=0.05)
    p.paint_fn(lambda q, n: q.y > 0.15 or abs(q.z) > 1.0 or abs(q.x) > 4.28, 0xa6b0bc)
    p.layer('mitt', base=0xff7a7a, target_faces=900, voxel=0.016)
    p.blob((4.9, 0.18, 0.4), (0.5, 0.15, 0.36), rot=(0, -20, 0), group='m')
    p.blob((4.6, 0.18, 0.8), (0.16, 0.12, 0.2), rot=(0, -20, 0), group='th')
    p.paint_fn(lambda q, n: q.x > 5.25, 0xffffff)
    p.paint_fn(lambda q, n: n.y > 0.5 and int((q.x + q.z) * 5) % 2 == 0, 0xff9a9a)
    p.layer('skin')
    fin(p, 0, 0.3, 0.022)


def table():
    TOPY = 2.43
    p = Prop('prop_m_table', base=0xffffff, target_faces=4200, voxel=0.03)
    p.lathe(rounded([(0, TOPY - 0.12), (3.9, TOPY - 0.12), (3.95, TOPY - 0.05), (3.9, TOPY), (0, TOPY)], 0.04, n=3), scale=(1, 0.45), seg=64)
    p.paint_fn(lambda q, n: n.y > 0.5, 0xfff3e0)
    p.layer('skirt', base=0xff9ec8, target_faces=4200, voxel=0.022)   # (not 'cloth*': the game hides those layers)
    # the cloth: a solid drum from the rim flaring down to y 1.08 (its inside is never seen)
    prof = rounded([(0, 1.08), (4.3, 1.08), (4.12, TOPY - 0.3), (4.0, TOPY - 0.02), (0, TOPY - 0.02)], 0.06, n=3)
    p.lathe(prof, scale=(1, 0.46), seg=72)
    p.paint_fn(lambda q, n: q.y < 1.3 and q.y > 1.1, 0xffffff)
    p.paint_fn(lambda q, n: q.y < 1.13, 0xffd6e8)
    p.layer('skin')
    p.layer('bunting', base=0xffd23f, target_faces=1400, voxel=0.016)
    cols = [0xffd23f, 0xffffff, 0x4a90ff]
    for i in range(9):
        a = -1.25 + i * (2.5 / 8)
        x, z = 4.2 * math.sin(a), 4.2 * 0.46 * math.cos(a) + 0.03
        p.blob((x, 1.62, z), (0.17, 0.17, 0.04), rot=(0, math.degrees(math.atan2(math.sin(a) * 0.46, math.cos(a))), 0), group='d%d' % i)
        p.paint(None, (x, 1.62, z), (0.22, 0.22, 0.3), cols[i % 3])
    p.layer('skin')
    p.layer('leg', base=0xc98b4f, target_faces=800, voxel=0.02)
    p.cyl((0, 0, 0), 0.42, TOPY - 0.12, r2=0.25, bevel=0.08, seg=24)
    p.layer('skin')
    fin(p, 0, TOPY, 0.028)


MODELS = dict(prop_m_giftbox=giftbox, prop_m_giftlid=giftlid, prop_m_cone=cone, prop_m_scoop=scoop, prop_m_cup=cup, prop_m_bolt=bolt,
              prop_m_jackbox=jackbox, prop_m_jacklid=jacklid, prop_m_jack=jack, prop_m_spider=spider, prop_m_dirt=dirt, prop_m_mole=mole,
              prop_m_butterfly=butterfly, prop_m_bee=bee, prop_m_toybox=toybox, prop_m_blanket=blanket, prop_m_tray=tray, prop_m_table=table)
for name, fn in MODELS.items():
    if not ONLY or name in ONLY:
        fn()
