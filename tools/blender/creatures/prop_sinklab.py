"""Sink or float lab (beach): the water tank, the surprise log, the two sorting signs and the rolling ramp.
Models: prop_sinktank, prop_sinkkey, prop_sinklog, prop_sinksign_float, prop_sinksign_sink, prop_sinkramp.
  ONLY=prop_sinklog tools/blender/build.sh prop_sinklab   builds a subset.

prop_sinktank: a toy aquarium. Origin on the sand under its middle. Inner box x +-2.1, z +-0.95; the sandy floor's top
  is at y 0.36 and the glass walls go up to y 2.9 (the game fills water to ~2.05 and makes layer 'glass' see-through).
  Layers: skin = the chunky sea-blue plinth with a white wave stripe; 'frame' white rounded corner posts and a yellow
  top rim; 'sand' the sandy floor with two pebbles and a starfish pressed flat into it (flush, nothing to snag on);
  'weed' two seaweed sprigs in the back corners; 'glass' the see-through walls; 'shine' gloss streaks on the front.
prop_sinklog: a chunky log lying along x, 2.0 long, radius 0.36, centred on the origin: bark with darker grooves,
  pale end discs with growth rings, a knot nub on top with a two-leaf sprout (layer 'leaf').
prop_sinksign_float / prop_sinksign_sink: a round picture sign on a wooden post. Origin at the post's foot; the board
  (radius 0.62, facing +z) is centred at y 2.35. Float: sky-blue board, a smiling yellow ball bobbing on a blue wave.
  Sink: coral board, a fat white down arrow over a grey pebble resting on a sandy line.
prop_sinkramp: a wooden wedge ramp along x: high end (1.05 tall) at x -1.6 with a little flat landing 0.4 long,
  sloping down to the sand at x +1.6; 1.3 deep. Stripes on the slope, painted sides."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded, circle_poly, rot_m
from mathutils import Vector

ONLY = [s for s in os.environ.get('ONLY', '').split(',') if s]
TAU = math.tau
INK = 0x3a2838


def slab(p, poly, z, thick, rot=(0, 0, 0), off=(0, 0, 0)):
    """a flat prism from a 2D polygon at depth z facing +z, rotated by rot (deg) about the origin, then moved by off"""
    M = rot_m(rot)
    m = len(poly)
    O = Vector(off)
    verts = []
    for d in (z - thick / 2, z + thick / 2):
        verts.append(tuple(M @ Vector((0, 0, d)) + O))
        for x, y in poly:
            verts.append(tuple(M @ Vector((x, y, d)) + O))
    faces = []
    k = m + 1
    for i in range(m):
        j = (i + 1) % m
        faces.append((0, 1 + j, 1 + i))
        faces.append((k, k + 1 + i, k + 1 + j))
        faces.append((1 + i, 1 + j, k + 1 + j, k + 1 + i))
    p.mesh(verts, faces)


def strip(p, pts2, w, z, thick):
    """a flat band of width w along a 2D polyline at depth z (for smiles, waves)"""
    P = [Vector((x, y)) for x, y in pts2]
    L, R = [], []
    for i in range(len(P)):
        t = (P[min(i + 1, len(P) - 1)] - P[max(i - 1, 0)]).normalized()
        n = Vector((-t.y, t.x))
        L.append(P[i] + n * w / 2)
        R.append(P[i] - n * w / 2)
    m = len(P)
    verts = []
    for d in (z - thick / 2, z + thick / 2):
        for q in L + R:
            verts.append((q.x, q.y, d))
    faces = []
    for off in (0, 2 * m):
        for i in range(m - 1):
            a, b, c, e = off + i, off + i + 1, off + m + i + 1, off + m + i
            faces.append((a, b, c, e) if off else (e, c, b, a))
    for i in range(m - 1):      # sides
        for a, b in ((i, i + 1), (m + i + 1, m + i)):
            faces.append((a, b, 2 * m + b, 2 * m + a))
    for a, b in ((m, 0), (m - 1, 2 * m - 1)):   # end caps
        faces.append((a, b, 2 * m + b, 2 * m + a))
    p.mesh(verts, faces)


# ---------------------------------------------------------------- the tank
def tank():
    W, D, FL, H = 2.1, 0.95, 0.36, 2.9
    p = Prop('prop_sinktank', base=0x4fb8e8, target_faces=2600, voxel=0.02, smooth=3)
    # the plinth: a soft rounded slab a little wider than the glass, with a white wave band round its middle
    p.box((0, 0.15, 0), (W + 0.32, 0.15, D + 0.3), bevel=0.12)
    p.box((0, 0.3, 0), (W + 0.18, 0.06, D + 0.16), bevel=0.05)
    p.paint_fn(lambda q, n: abs(q.y - 0.15 - 0.035 * math.sin(q.x * 5.5 + q.z * 5.5)) < 0.035 and abs(n.y) < 0.6, 0xffffff)
    p.paint_fn(lambda q, n: q.y < 0.04, 0x3a9fd0)
    # corner posts and a yellow top rim
    p.layer('frame', base=0xfffaf0, target_faces=1400, voxel=0.016)
    p.quadriflow = False
    for x in (-W, W):
        for z in (-D, D):
            p.cyl((x, 0.3, z), 0.1, H - 0.3 + 0.02, bevel=0.04, seg=14)
    p.layer('rim', base=0xffd23f, target_faces=1200, voxel=0.016)
    p.quadriflow = False
    p.tube(rounded([(-W, H, -D), (W, H, -D), (W, H, D), (-W, H, D)], 0.12, n=4, closed=True), 0.085, closed=True, rseg=10)
    for x in (-W, W):
        for z in (-D, D):
            p.blob((x, H + 0.04, z), (0.14, 0.11, 0.14), group='k%d%d' % (x > 0, z > 0))
    # the sandy floor (flush slab), pebbles and a starfish pressed into it
    p.layer('sand', base=0xf6dc9b, target_faces=700, voxel=0.016)
    p.quadriflow = False
    p.box((0, FL - 0.03, 0), (W - 0.02, 0.03, D - 0.02), bevel=0.02)
    p.layer('pebbles', base=0xa9b0b8, target_faces=500, voxel=0.012)
    for x, z, s in ((-1.7, -0.6, 0.13), (-1.48, -0.72, 0.09), (1.62, -0.55, 0.11)):
        p.blob((x, FL + 0.01, z), (s, s * 0.45, s * 0.8), group='pb%d' % int(x * 100))
    p.paint_fn(lambda q, n: q.x > 0, 0xc6b4a2)
    # seaweed sprigs in the back corners, behind anything that falls in
    p.layer('weed', base=0x3fbf7a, target_faces=900, voxel=0.012)
    for x0, ph in ((-1.82, 0.0), (1.85, 1.3)):
        for k in range(3):
            pts = [(x0 + 0.1 * (k - 1) + 0.07 * math.sin(i * 1.3 + ph + k), FL + i * 0.17, -0.78 + 0.02 * k) for i in range(6 - k)]
            p.tube(pts, [0.05 - 0.006 * i for i in range(6 - k)], rseg=8)
    p.paint_fn(lambda q, n: q.y > FL + 0.55, 0x63d68e)
    # the glass walls (made see-through by the game)
    p.layer('glass', base=0xd8f4ff, target_faces=600, voxel=0.02)
    p.quadriflow = False
    gy, gh = (H + 0.3) / 2, (H - 0.3) / 2
    for z in (-D, D):
        p.box((0, gy, z), (W, gh, 0.02), bevel=0.015)
    for x in (-W, W):
        p.box((x, gy, 0), (0.02, gh, D), bevel=0.015)
    p.layer('shine', base=0xffffff, target_faces=200, voxel=0.01)
    p.quadriflow = False
    for x, y, h in ((-1.6, 1.85, 1.3), (-1.33, 1.5, 0.55), (1.55, 2.3, 0.5)):
        p.box((x, y, D + 0.035), (0.05, h / 2, 0.012), rot=(0, 0, -8), bevel=0.01)
    p.layer('skin')
    p.bone('root', (0, 0, 0), (0, H, 0))
    p.extras['outline'] = 0.024
    p.build()


# ---------------------------------------------------------------- the log
def log():
    L, R = 1.0, 0.36
    p = Prop('prop_sinklog', base=0xa8693a, target_faces=2400, voxel=0.013, smooth=3)
    # a slightly uneven trunk lying along x (lathe about y, then turned onto its side)
    prof = [(0, -L), (R * 0.86, -L), (R * 0.97, -L + 0.06)]
    for i in range(1, 12):
        y = -L + 0.06 + (2 * L - 0.12) * i / 12
        prof.append((R * (1 + 0.035 * math.sin(i * 1.9)), y))
    prof += [(R * 0.97, L - 0.06), (R * 0.86, L), (0, L)]
    p.lathe(rounded(prof, 0.035, n=2), rot=(0, 0, 90), seg=36)
    # a knot nub on top
    p.blob((0.32, R * 0.92, 0.04), (0.12, 0.1, 0.12), group='knot')
    p.blob((-0.45, -R * 0.2, R * 0.88), (0.08, 0.07, 0.06), group='knot2')
    # bark grooves running along the log, pale cut ends with growth rings
    def groove(q, n):
        a = math.atan2(q.z, q.y)
        return abs(q.x) < L - 0.05 and math.sin(a * 9 + 0.6 * math.sin(q.x * 3)) > 0.72
    p.paint_fn(groove, 0x7e4a28)
    def endcap(q, n):
        return abs(q.x) > L - 0.035 and abs(n.x) > 0.6
    p.paint_fn(endcap, 0xf4d39a)
    def rings(q, n):
        r = math.hypot(q.y, q.z)
        return abs(q.x) > L - 0.035 and abs(n.x) > 0.6 and (abs(r - 0.11) < 0.022 or abs(r - 0.22) < 0.022 or r < 0.035)
    p.paint_fn(rings, 0xd9a868)
    p.paint_fn(lambda q, n: abs(q.x) > L - 0.035 and abs(n.x) > 0.6 and math.hypot(q.y, q.z) > R * 0.84, 0x7e4a28)
    p.paint('knot', (0.32, R * 0.98 + 0.06, 0.04), (0.06, 0.03, 0.06), 0x6a3c20)
    # a little sprout from the knot
    p.layer('leaf', base=0x5fd068, target_faces=500, voxel=0.009)
    p.tube([(0.32, R + 0.08, 0.04), (0.33, R + 0.2, 0.05), (0.31, R + 0.3, 0.06)], 0.022, rseg=6)
    for s in (-1, 1):
        p.blob((0.31 + s * 0.11, R + 0.33 + 0.03, 0.06), (0.11, 0.035, 0.065), rot=(0, 0, s * 28), group='lf%d' % s)
    p.paint_fn(lambda q, n: q.y < R + 0.24, 0x4aa84f)
    p.layer('skin')
    p.bone('root', (-L, 0, 0), (L, 0, 0))
    p.extras['outline'] = 0.022
    p.build()


# ---------------------------------------------------------------- the signs
def sign_base(kind, board):
    BY, BR = 2.35, 0.62
    p = Prop(kind, base=0xb07a48, target_faces=2000, voxel=0.014, smooth=3)
    p.cyl((0, 0, 0), 0.075, BY, r2=0.065, bevel=0.03, seg=16)                 # post
    p.blob((0, 0.05, 0), (0.15, 0.06, 0.15), group='foot')
    p.paint_fn(lambda q, n: q.y < 0.1, 0x8f6038)
    p.layer('board', base=board, target_faces=1200, voxel=0.014)
    p.quadriflow = False
    p.cyl((0, BY, -0.06), BR, 0.12, rot=(90, 0, 0), bevel=0.05, seg=48)
    p.layer('rimw', base=0xffffff, target_faces=900, voxel=0.01)
    p.quadriflow = False
    p.ring((0, BY, 0.065), BR - 0.06, 0.03, rot=(90, 0, 0), seg=56, rseg=8)
    return p, BY, BR


def sign_float():
    p, BY, BR = sign_base('prop_sinksign_float', 0x8fdcff)
    # the sea: a wavy blue band across the lower board, clipped to the circle
    p.layer('sea', base=0x2f8fd8, target_faces=700, voxel=0.01)
    p.quadriflow = False
    top = [(x / 20 * 0.98 - 0.49, -0.1 + 0.05 * math.sin((x / 20) * TAU * 1.5)) for x in range(21)]
    poly = [(0.5 * math.cos(math.radians(a)), 0.5 * math.sin(math.radians(a))) for a in range(200, 341, 10)] + top[::-1]
    # a fan polygon must be star-shaped around (0, 0): offset the band's origin down into it
    cy = -0.28
    slab(p, [(x, y - cy) for x, y in poly], 0.075, 0.03, off=(0, BY + cy, 0))
    # the smiling ball bobbing on the sea
    p.layer('ball', base=0xffd23f, target_faces=600, voxel=0.01)
    p.quadriflow = False
    slab(p, circle_poly(0.22, 32), 0.085, 0.035, off=(0, BY + 0.06, 0))
    p.layer('face', base=INK, target_faces=500, voxel=0.006)
    p.quadriflow = False
    for s in (-1, 1):
        slab(p, circle_poly(0.03, 12, sy=1.25), 0.105, 0.02, off=(s * 0.075, BY + 0.11, 0))
    strip(p, [(0.1 * math.cos(math.radians(a)), 0.1 * math.sin(math.radians(a))) for a in range(200, 341, 14)], 0.03, 0.105, 0.02)
    # (strip is built about the origin: move it into place with a second pass)
    p.layer('wave', base=0xffffff, target_faces=300, voxel=0.008)
    p.quadriflow = False
    strip(p, [(x / 10 * 0.5 - 0.42, -0.04 + 0.03 * math.sin(x / 10 * TAU)) for x in range(11)], 0.035, 0.0, 0.02)
    p.layer('skin')
    _shift_last(p, 'face', (0, BY + 0.04, 0), count=1)
    _shift_last(p, 'wave', (0.05, BY - 0.22, 0.095), count=1)
    p.bone('root', (0, 0, 0), (0, BY + BR, 0))
    p.extras['outline'] = 0.022
    p.build()


def sign_sink():
    p, BY, BR = sign_base('prop_sinksign_sink', 0xff8a6a)
    # sandy bottom line and a grey pebble resting on it
    p.layer('sand', base=0xf6dc9b, target_faces=400, voxel=0.01)
    p.quadriflow = False
    poly = [(0.5 * math.cos(math.radians(a)), 0.5 * math.sin(math.radians(a))) for a in range(215, 326, 8)]
    poly += [(0.41, -0.33), (-0.41, -0.33)]
    cy = -0.4
    slab(p, [(x, y - cy) for x, y in poly], 0.075, 0.03, off=(0, BY + cy, 0))
    p.layer('pebble', base=0x9aa3ad, target_faces=400, voxel=0.01)
    p.quadriflow = False
    slab(p, circle_poly(0.17, 28, sy=0.62), 0.09, 0.04, off=(0, BY - 0.24, 0))
    # the fat down arrow
    p.layer('arrow', base=0xffffff, target_faces=500, voxel=0.01)
    p.quadriflow = False
    arrow = [(0, -0.2), (0.24, 0.03), (0.1, 0.03), (0.1, 0.32), (-0.1, 0.32), (-0.1, 0.03), (-0.24, 0.03)]
    slab(p, arrow, 0.09, 0.035, off=(0, BY + 0.05, 0))
    p.layer('skin')
    p.bone('root', (0, 0, 0), (0, BY + BR, 0))
    p.extras['outline'] = 0.022
    p.build()


def _shift_last(p, layer, d, count=1):
    """move the last `count` mesh prims of a layer by d (strip() builds around the origin)"""
    pr = p.layers[layer]['prims']
    for i in range(len(pr) - count, len(pr)):
        kind, verts, faces, bevel = pr[i]
        pr[i] = (kind, [(v[0] + d[0], v[1] + d[1], v[2] + d[2]) for v in verts], faces, bevel)


# ---------------------------------------------------------------- the ramp
def ramp():
    X0, X1, HI, Z, FLAT = -1.6, 1.6, 1.05, 0.65, 0.4
    p = Prop('prop_sinkramp', base=0xe6a65a, target_faces=1600, voxel=0.016, smooth=2)
    p.quadriflow = False
    T = 0.07
    run, rise = X1 - (X0 + FLAT), HI - 0.04
    ang = math.degrees(math.atan2(rise, run)); L = math.hypot(run, rise)
    cx, cy = (X0 + FLAT + X1) / 2, (HI + 0.04) / 2 - T
    p.box((cx, cy, 0), (L / 2 + 0.04, T, Z), rot=(0, 0, -ang), bevel=0.04)                     # the slope
    p.box((X0 + FLAT / 2, HI - T, 0), (FLAT / 2 + 0.05, T, Z), bevel=0.04)                     # the landing at the top
    p.box((X0 + 0.32, (HI - T) / 2, 0), (0.3, (HI - T) / 2, Z - 0.06), bevel=0.05)             # a chunky block under it
    p.box((X0 + 1.1, (HI * 0.55) / 2, 0), (0.12, (HI * 0.55) / 2, Z - 0.1), bevel=0.04)        # a prop under the slope
    slope = rise / run
    p.paint_fn(lambda q, n: n.y > 0.5 and q.x > X0 + FLAT and math.sin((q.x - X0) * 9) > 0.86, 0xc98a45)
    p.paint_fn(lambda q, n: q.y < HI * 0.9 - slope * max(0, q.x - X0 - FLAT) and n.y < 0.5, 0xff7a59)
    p.paint_fn(lambda q, n: q.y < 0.04, 0xb77a3e)
    p.bone('root', (0, 0, 0), (0, HI, 0))
    p.extras['outline'] = 0.024
    p.build()


# ---------------------------------------------------------------- the key
def key():
    """a chunky toy door key lying along x, facing +z, centred on the origin: a fat red rubber bow (ring) at -x, a
    silver shaft and two square teeth hanging below its tip; about 1.1 long, 0.5 tall, 0.16 thick."""
    p = Prop('prop_sinkkey', base=0xcfd8e2, target_faces=900, voxel=0.01, smooth=3)
    p.quadriflow = False
    p.tube([(-0.18, 0.0, 0), (0.5, 0.0, 0)], 0.065, rseg=12)
    p.box((0.33, -0.1, 0), (0.05, 0.09, 0.05), bevel=0.025)
    p.box((0.46, -0.13, 0), (0.05, 0.12, 0.05), bevel=0.025)
    p.ring((-0.08, 0, 0), 0.075, 0.035, rot=(0, 0, 90), seg=16, rseg=8)      # collar
    p.paint_fn(lambda q, n: n.y > 0.55 and q.x > -0.02, 0xeef3f8)
    p.layer('bow', base=0xff5a5a, target_faces=700, voxel=0.01)
    p.quadriflow = False
    p.ring((-0.38, 0, 0), 0.2, 0.085, rot=(90, 0, 0), seg=36, rseg=12)
    p.paint_fn(lambda q, n: n.y > 0.6 and n.z > 0.1, 0xff8a8a)
    p.layer('skin')
    p.bone('root', (-0.6, 0, 0), (0.55, 0, 0))
    p.extras['outline'] = 0.02
    p.build()


MODELS = dict(prop_sinkkey=key, prop_sinktank=tank, prop_sinklog=log, prop_sinksign_float=sign_float, prop_sinksign_sink=sign_sink, prop_sinkramp=ramp)
for name, fn in MODELS.items():
    if not ONLY or name in ONLY:
        fn()
