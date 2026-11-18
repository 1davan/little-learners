"""Sink or float lab (beach): the water tank, the test things, the two sorting signs and the toy slide.
Models: prop_sinktank, prop_sinkkey, prop_sinklog, prop_sinksign_float, prop_sinksign_sink, prop_sinkramp, and the lab's
own test things prop_sinkcoin, prop_sinkleaf, prop_sinkrock, prop_sinkstone, prop_sinkbouncy, prop_sinkblock.
  ONLY=prop_sinklog tools/blender/build.sh prop_sinklab   builds a subset.

prop_sinktank: a toy aquarium. Origin on the sand under its middle. Inner box x +-2.1, z +-0.95; the sandy floor's top
  is at y 0.36 (one thick clean slab sunk into the plinth: no plinth shows through) and the glass walls go up to y 2.9
  (the game fills water to ~2.05 and makes layer 'glass' see-through). Layers: skin = the chunky sea-blue plinth with a
  white wave stripe; 'frame' white rounded corner posts and a yellow top rim; 'sand'; 'pebbles' two pebbles; 'weed' two
  seaweed sprigs in the back corners; 'glass' the see-through walls; 'shine' gloss streaks on the front.
prop_sinklog: a chunky log lying along x, 2.0 long, radius 0.36, centred on the origin: bark with darker grooves,
  pale end discs with growth rings, a knot nub on top with a two-leaf sprout (layer 'leaf').
prop_sinksign_float / prop_sinksign_sink: a round picture sign on a wooden post. Origin at the post's foot; the board
  (radius 0.62, facing +z, in its tub's colour: blue / orange) is centred at y 2.35, with a wide white ring inside its
  rim. Float: a yellow rubber duck sitting ON blue water. Sink: a grey stone lying ON the sandy floor under the water,
  bubbles rising. Layer 'pic' is the picture's round ground (the game swaps in a clean code disc under the ring).
prop_sinkramp: a chunky toy slide along x: a sunny-yellow board from a little landing at the top (x -1.6, 1.05 high)
  down to the sand at x +1.6, 1.3 deep; red rounded side rails, three white stripes (own layer), a blue block and a
  blue leg holding it up. The game makes its own colliders for the slope (see sink.js startTest).
prop_sinkcoin: a chunky gold coin standing up, radius 0.5, raised rim, a fat pale star on both faces (layer 'star').
prop_sinkleaf: a broad curved leaf lying flat (face up), tip toward +x, ~1.0 long, pale midrib and veins, brown stalk.
prop_sinkrock / prop_sinkstone: a chunky faceted grey rock with dark speckles / a smooth flat blue-grey river pebble
  with one white band. Origins on the ground under their middles; clearly different from each other.
prop_sinkbouncy: a pink bouncy rubber ball (radius 0.5) with a fat yellow band and a gloss sticker ('shine').
prop_sinkblock: a chunky orange toy block (half-size 0.4) with a white star sticker on every face (layer 'star')."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded, circle_poly, rot_m, star_poly
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
    p.box((0, 0.27, 0), (W + 0.18, 0.05, D + 0.16), bevel=0.05)   # (top at 0.32: under the sand, no z-fighting)
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
    p.layer('sand', base=0xf6dc9b, target_faces=1400, voxel=0.016)
    p.quadriflow = False
    p.box((0, FL - 0.07, 0), (W - 0.01, 0.07, D - 0.01), bevel=0.03)
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
    p.layer('rimw', base=0xffffff, target_faces=2600, voxel=0.005)
    p.quadriflow = False
    p.ring((0, BY, 0.065), BR - 0.1, 0.04, rot=(90, 0, 0), seg=72, rseg=12)   # (a wide band of the tub colour shows outside it)
    return p, BY, BR


def sign_float():
    """Float sign: a BLUE board (the blue tub's colour) with a picture: sky, blue water, a yellow rubber duck
    sitting ON the water."""
    p, BY, BR = sign_base('prop_sinksign_float', 0x4a90ff)
    PR = 0.47
    p.layer('pic', base=0xcff0ff, target_faces=900, voxel=0.008)    # the picture's round ground, its edge tucked under the white ring
    p.quadriflow = False
    slab(p, circle_poly(0.56, 72), 0.07, 0.012, off=(0, BY, 0))   # (tucked under the white ring: no board peeks between)
    # the water: the lower part of the picture with a soft wavy top, clipped to the circle
    p.layer('sea', base=0x2f8fd8, target_faces=700, voxel=0.01)
    p.quadriflow = False
    wy = -0.12
    top = [(x / 20 * 0.98 - 0.49, wy + 0.025 * math.sin((x / 20) * TAU * 2)) for x in range(21)]
    poly = [(PR * math.cos(math.radians(a)), PR * math.sin(math.radians(a))) for a in range(196, 345, 6)]
    poly = [(x, max(y, -PR)) for x, y in poly] + top[::-1]
    cy = -0.3
    slab(p, [(x, y - cy) for x, y in poly], 0.1, 0.02, off=(0, BY + cy, 0))
    # the duck, sitting on the water line
    p.layer('duck', base=0xffd23f, target_faces=800, voxel=0.008)
    p.quadriflow = False
    slab(p, circle_poly(0.17, 32, sx=1.3, sy=0.72), 0.14, 0.024, off=(-0.02, BY + wy + 0.08, 0))     # body
    slab(p, [(0.0, 0.0), (0.12, 0.08), (0.2, 0.0), (0.12, -0.03)], 0.14, 0.024, off=(-0.24, BY + wy + 0.1, 0), rot=(0, 0, 155))  # tail tip
    slab(p, circle_poly(0.1, 28), 0.14, 0.024, off=(0.12, BY + wy + 0.24, 0))                        # head
    p.layer('beak', base=0xff8a2a, target_faces=200, voxel=0.006)
    p.quadriflow = False
    slab(p, [(0, -0.035), (0.1, -0.005), (0, 0.03)], 0.15, 0.02, off=(0.2, BY + wy + 0.23, 0))
    p.layer('face', base=INK, target_faces=200, voxel=0.005)
    p.quadriflow = False
    slab(p, circle_poly(0.022, 12, sy=1.2), 0.158, 0.016, off=(0.15, BY + wy + 0.27, 0))
    p.layer('skin')
    p.bone('root', (0, 0, 0), (0, BY + BR, 0))
    p.extras['outline'] = 0.022
    p.build()


def sign_sink():
    """Sink sign: an ORANGE board (the orange tub's colour) with a picture: deep blue water, a sandy floor, a grey
    stone lying ON the floor, two little bubbles rising from it."""
    p, BY, BR = sign_base('prop_sinksign_sink', 0xff8a2a)
    PR = 0.47
    p.layer('pic', base=0x5cc0f0, target_faces=900, voxel=0.008)    # the picture's round ground, its edge tucked under the white ring
    p.quadriflow = False
    slab(p, circle_poly(0.56, 72), 0.07, 0.012, off=(0, BY, 0))   # (tucked under the white ring: no board peeks between)
    p.layer('sand', base=0xf6dc9b, target_faces=400, voxel=0.01)
    p.quadriflow = False
    sy = -0.26
    poly = [(PR * math.cos(math.radians(a)), PR * math.sin(math.radians(a))) for a in range(212, 330, 6)]
    poly += [(PR * math.cos(math.radians(328)), sy), (PR * math.cos(math.radians(212)), sy)]
    cy = -0.4
    slab(p, [(x, y - cy) for x, y in poly], 0.1, 0.02, off=(0, BY + cy, 0))
    p.layer('pebble', base=0x7d8794, target_faces=500, voxel=0.008)
    p.quadriflow = False
    slab(p, circle_poly(0.2, 32, sy=0.55), 0.14, 0.026, off=(0, BY + sy + 0.09, 0))
    p.layer('bubble', base=0xffffff, target_faces=300, voxel=0.006)
    p.quadriflow = False
    for x, y, r in ((0.06, 0.06, 0.045), (-0.03, 0.19, 0.035), (0.05, 0.3, 0.025)):
        slab(p, circle_poly(r, 16), 0.14, 0.02, off=(x, BY + y, 0))
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
    """A chunky toy slide: a sunny-yellow board sloping from a little landing at the top (x -1.6, 1.05 high) down to
    the sand at x +1.6, 1.3 deep; rounded red side rails along both edges, three white stripes printed across the
    slope (their own layer, crisp), a blue block holding up the high end and one blue leg under the middle.
    The slope's top surface: y = 1.05 at x = -1.2 falling to 0.04 at x = +1.6 (the game puts its own collider there)."""
    X0, X1, HI, Z, FLAT = -1.6, 1.6, 1.05, 0.65, 0.4
    T = 0.07
    run, rise = X1 - (X0 + FLAT), HI - 0.04
    ang = math.degrees(math.atan2(rise, run)); L = math.hypot(run, rise)
    sx, sy = math.cos(math.radians(ang)), -math.sin(math.radians(ang))       # unit vector down the slope
    def on_slope(t, h=0.0):        # point on the slope's top surface, t = 0 at the top edge .. 1 at the foot
        return (X0 + FLAT + run * t, HI - rise * t + h)
    p = Prop('prop_sinkramp', base=0xffd25a, target_faces=2400, voxel=0.014, smooth=2)
    p.quadriflow = False
    cx, cy = (X0 + FLAT + X1) / 2, (HI + 0.04) / 2 - T
    p.box((cx, cy, 0), (L / 2 + 0.04, T, Z), rot=(0, 0, -ang), bevel=0.05)          # the slope board
    p.box((X0 + FLAT / 2, HI - T, 0), (FLAT / 2 + 0.06, T, Z), bevel=0.05)           # the landing at the top
    p.paint_fn(lambda q, n: n.y < -0.3, 0xe0a83a)
    # side rails: a rounded red tube along each edge, round the landing too
    p.layer('rail', base=0xff6a4a, target_faces=1600, voxel=0.012)
    p.quadriflow = False
    for zs in (-1, 1):
        z = zs * (Z - 0.05)
        top = [(X0 + 0.02, HI + 0.06, z)] + [(x, y + 0.06, z) for x, y in (on_slope(t) for t in (0.0, 0.33, 0.66, 1.0))]
        p.tube(rounded(top, 0.12, n=3), 0.06, rseg=10)
    p.tube(rounded([(X0 + 0.02, HI + 0.06, -(Z - 0.05)), (X0 + 0.02, HI + 0.06, Z - 0.05)], 0.05, n=2), 0.06, rseg=10)
    # supports: a chunky blue block under the high end, one leg under the middle of the slope
    p.layer('legs', base=0x4a90ff, target_faces=1200, voxel=0.014)
    p.quadriflow = False
    p.box((X0 + 0.34, (HI - 2 * T) / 2, 0), (0.3, (HI - 2 * T) / 2, Z - 0.12), bevel=0.06)
    mx, my = on_slope(0.45)
    p.box((mx, (my - 2 * T) / 2, 0), (0.1, (my - 2 * T) / 2, Z - 0.16), bevel=0.04)
    p.paint_fn(lambda q, n: q.y < 0.06, 0x3a78d8)
    # three white stripes printed across the slope
    p.layer('stripes', base=0xffffff, target_faces=600, voxel=0.008)
    p.quadriflow = False
    for t in (0.2, 0.5, 0.8):
        x, y = on_slope(t, 0.006)
        p.box((x, y, 0), (0.07, 0.012, Z - 0.13), rot=(0, 0, -ang), bevel=0.01)
    p.layer('skin')
    p.bone('root', (0, 0, 0), (0, HI, 0))
    p.extras['outline'] = 0.022
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


# ---------------------------------------------------------------- the sink lab's own test things (crisp, readable)
def _in_poly(x, y, poly):
    c = False
    j = len(poly) - 1
    for i in range(len(poly)):
        xi, yi = poly[i]; xj, yj = poly[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi + 1e-12) + xi:
            c = not c
        j = i
    return c


def coin():
    """prop_sinkcoin: a chunky gold coin standing up facing +z, radius 0.5, 0.16 thick, centred on the origin. A
    raised rim and a fat raised star on both faces, the star painted pale (cut exactly along its edge: no ink in it)."""
    R, T2 = 0.5, 0.08
    p = Prop('prop_sinkcoin', base=0xffcc33, target_faces=1400, voxel=0.008, smooth=2)
    p.quadriflow = False
    prof = rounded([(0, -T2 + 0.015), (0.37, -T2 + 0.015), (0.4, -T2), (R, -T2), (R, T2), (0.4, T2), (0.37, T2 - 0.015), (0, T2 - 0.015)], 0.02, n=3)
    p.lathe(prof, rot=(90, 0, 0), seg=56)
    p.paint_fn(lambda q, n: math.hypot(q.x, q.y) > R - 0.025, 0xf2b12c)
    # a fat pale star on both faces (its own layer; the game hides its ink so the edge is a clean colour edge)
    p.layer('star', base=0xfff0a8, target_faces=900, voxel=0.006)
    p.quadriflow = False
    star = star_poly(0.27, inner=0.5, soft=3)
    slab(p, star, T2 - 0.01, 0.04)
    slab(p, star, T2 - 0.01, 0.04, rot=(0, 180, 0))
    p.layer('skin')
    p.bone('root', (0, -R, 0), (0, R, 0))
    p.extras['outline'] = 0.018
    p.build()


def leaf():
    """prop_sinkleaf: a broad curved leaf lying flat (its face looks up, +y), tip toward +x, about 1.0 long and 0.62
    wide, edges curled up a little like a boat; a pale midrib and side veins painted on top, a short brown stalk at -x."""
    p = Prop('prop_sinkleaf', base=0x5fd068, target_faces=1600, voxel=0.007, smooth=2)
    p.quadriflow = False
    L, W, NX, NZ = 0.5, 0.31, 28, 12
    def half_w(t):          # t in -1..1 along the leaf
        u = (t + 1) / 2
        return W * (math.sin(math.pi * u) ** 0.8) * (1.0 - 0.25 * u)
    def surf(t, s):          # s in -1..1 across
        w = half_w(t)
        x, z = t * L, s * w
        y = 0.12 * (s * s) * (w / W) + 0.05 * (1 - t * t) - 0.04 * t
        return x, y, z
    th = 0.022
    verts, faces = [], []
    for side in (1, -1):
        for i in range(NX + 1):
            t = -1 + 2 * i / NX
            for k in range(NZ + 1):
                s = -1 + 2 * k / NZ
                x, y, z = surf(t, s)
                verts.append((x, y + side * th, z))
    n1 = NZ + 1
    off = (NX + 1) * n1
    for i in range(NX):
        for k in range(NZ):
            a, b, c, d = i * n1 + k, (i + 1) * n1 + k, (i + 1) * n1 + k + 1, i * n1 + k + 1
            faces.append((a, d, c, b))
            faces.append((off + a, off + b, off + c, off + d))
    for i in range(NX):       # close the rims
        for k in (0, NZ):
            a, b = i * n1 + k, (i + 1) * n1 + k
            faces.append((a, b, off + b, off + a) if k == 0 else (a, off + a, off + b, b))
    for i in (0, NX):
        for k in range(NZ):
            a, b = i * n1 + k, i * n1 + k + 1
            faces.append((a, off + a, off + b, b) if i == 0 else (a, b, off + b, off + a))
    p.mesh(verts, faces)
    # the stalk
    x0, y0, _ = surf(-1, 0)
    p.tube([(x0 + 0.04, y0, 0), (x0 - 0.1, y0 + 0.02, 0), (x0 - 0.2, y0 + 0.07, 0.0)], [0.03, 0.026, 0.022], rseg=8)
    # midrib and veins (top face): thin pale bands
    def vein(q, n):
        if n.y < 0.2 or q.x < -L - 0.01:
            return False
        if abs(q.z) < 0.028 and q.x < L * 0.9:
            return True
        for v in (-0.5, -0.05, 0.38):
            xv = v * L
            for sgn in (1, -1):
                # a vein leaves the midrib at xv and sweeps out toward the tip
                dz = sgn * q.z
                if dz > 0.02 and abs(q.x - (xv + dz * 0.7)) < 0.024 and dz < half_w(q.x / L) * 0.72:
                    return True
        return False
    p.paint_fn(vein, 0xb6f08a)
    p.paint_fn(lambda q, n: n.y < -0.2, 0x4cb35a)
    p.paint_fn(lambda q, n: q.x < -L + 0.005, 0x8a5a32)
    p.bone('root', (-L, 0, 0), (L, 0, 0))
    p.extras['outline'] = 0.016
    p.build()


def rock():
    """prop_sinkrock: a chunky faceted grey rock (flat facets, slightly lumpy), about 1.0 wide, 0.62 tall, 0.8 deep,
    origin on the ground under its middle; a paler top and a few dark speckles."""
    p = Prop('prop_sinkrock', base=0x9aa1ab, target_faces=1400, voxel=0.01, smooth=0)
    p.blob((0, 0.32, 0), (0.52, 0.36, 0.42), group='rk')
    p.blob((0.18, 0.4, -0.05), (0.34, 0.3, 0.3), rot=(0, 30, 10), group='rk')
    # big flat negative discs slice clean facets off the lump (each disc faces along its direction d)
    for d, depth in (((1, 0.6, 0.3), 0.4), ((-1, 0.5, 0.4), 0.4), ((0.3, 0.7, 1), 0.34), ((-0.4, 1, -0.2), 0.46), ((0.2, 0.3, -1), 0.3), ((-0.7, 0.1, 0.9), 0.36), ((0.8, 0.0, -0.6), 0.4)):
        l = math.sqrt(sum(c * c for c in d)); u = [c / l for c in d]
        pitch = -math.degrees(math.asin(u[1])); yaw = math.degrees(math.atan2(u[0], u[2]))
        c = (u[0] * (depth + 0.35), 0.32 + u[1] * (depth * 0.8 + 0.35), u[2] * (depth + 0.35))
        p.blob(c, (0.9, 0.9, 0.35), rot=(pitch, yaw, 0), group='rk', negative=True)
    p.blob((0, -0.3, 0), (1.2, 0.32, 1.2), group='rk', negative=True)
    p.paint_fn(lambda q, n: n.y > 0.7, 0xb9bfc7)
    p.paint_fn(lambda q, n: n.y < -0.3 or q.y < 0.04, 0x7d848f)
    for x, y, z, r in ((-0.22, 0.4, 0.3, 0.035), (0.2, 0.3, 0.36, 0.03), (0.05, 0.55, 0.15, 0.03), (0.33, 0.45, 0.12, 0.028), (-0.35, 0.22, 0.28, 0.025)):
        p.paint('sp%d' % int(x * 100 + y * 10), (x, y, z), (r * 1.7, r * 1.7, 0.3), 0x6c7380)
    p.bone('root', (0, 0, 0), (0, 0.6, 0))
    p.extras['outline'] = 0.02
    p.build()


def stone():
    """prop_sinkstone: a smooth flat river pebble, blue-grey with one white band round it (a 'lucky stone'); about
    0.9 wide, 0.36 tall, 0.62 deep, origin on the ground under its middle. Clearly not the faceted rock."""
    p = Prop('prop_sinkstone', base=0x6f8597, target_faces=900, voxel=0.01, smooth=3)
    p.blob((0, 0.18, 0), (0.45, 0.18, 0.31), rot=(0, 12, 0), group='st')
    p.paint_fn(lambda q, n: abs(q.x * 0.98 + q.z * 0.2 - 0.06) < 0.045, 0xf4f1e8)
    p.paint_fn(lambda q, n: n.y > 0.82 and abs(q.x * 0.98 + q.z * 0.2 - 0.06) >= 0.045, 0x8aa0b2)
    p.bone('root', (0, 0, 0), (0, 0.36, 0))
    p.extras['outline'] = 0.018
    p.build()


def bouncy():
    """prop_sinkbouncy: a bouncy rubber ball, radius 0.5, centred on the origin: bright pink with a fat yellow band
    round its middle and two small white stars; nothing like the striped beach ball."""
    R = 0.5
    p = Prop('prop_sinkbouncy', base=0xff4fa0, target_faces=1400, voxel=0.009, smooth=2)
    p.quadriflow = False
    p.lathe([(R * math.sin(math.pi * i / 32), -R * math.cos(math.pi * i / 32)) for i in range(33)], seg=48)
    p.paint_fn(lambda q, n: abs(q.y + 0.06 * math.sin(math.atan2(q.x, q.z) * 3)) < 0.1, 0xffd23f)
    p.layer('shine', base=0xffffff, target_faces=120, voxel=0.006)
    p.quadriflow = False
    p.blob((-0.2, 0.3, 0.33), (0.07, 0.11, 0.03), rot=(-38, -28, 20), group='sh')
    p.layer('skin')
    p.bone('root', (0, -R, 0), (0, R, 0))
    p.extras['outline'] = 0.018
    p.build()


def block():
    """prop_sinkblock: a chunky wooden toy block (cube, half-size 0.4, centred on the origin, slightly rounded) in
    warm orange with a clean white star printed on the front, the top and both sides (cut exactly along its edge)."""
    H = 0.4
    p = Prop('prop_sinkblock', base=0xf3a64a, target_faces=1600, voxel=0.008, smooth=1)
    p.quadriflow = False
    p.box((0, 0, 0), (H, H, H), bevel=0.07)
    p.paint_fn(lambda q, n: (abs(q.x) > H - 0.05) + (abs(q.y) > H - 0.05) + (abs(q.z) > H - 0.05) >= 2, 0xe08a32)
    # a white star sticker on every face (its own layer: a crisp edge and its own ink line)
    p.layer('star', base=0xffffff, target_faces=1600, voxel=0.006)
    p.quadriflow = False
    st = star_poly(0.24, inner=0.48, soft=3)
    for rot in ((0, 0, 0), (0, 90, 0), (0, -90, 0), (0, 180, 0), (-90, 0, 0), (90, 0, 0)):
        slab(p, st, H + 0.004, 0.03, rot=rot)
    p.layer('skin')
    p.bone('root', (0, -H, 0), (0, H, 0))
    p.extras['outline'] = 0.018
    p.build()


MODELS = dict(prop_sinkcoin=coin, prop_sinkleaf=leaf, prop_sinkrock=rock, prop_sinkstone=stone, prop_sinkbouncy=bouncy, prop_sinkblock=block, prop_sinkkey=key, prop_sinktank=tank, prop_sinklog=log, prop_sinksign_float=sign_float, prop_sinksign_sink=sign_sink, prop_sinkramp=ramp)
for name, fn in MODELS.items():
    if not ONLY or name in ONLY:
        fn()
