"""WORDS batch 9, things that go (docs/design/WORDS.md, words 257-270). One script, several models
(ONLY=prop_word_bus,prop_word_van tools/blender/build.sh prop_words_vehicles builds a subset).

Toy vehicles: short, tall and round, wheels about 30% bigger than real, big rounded SKY windows with a WHITE glint, no
drivers, each owns one colour. They lie along x with the front toward +x, bottom at y = 0, centred on x and z (the
game turns them toward the camera). Every wheeled vehicle has bones 'wheel.F' and 'wheel.B' (the truck adds 'wheel.M'),
each standing straight up from its axle: rotation.z rolls the wheels (both wheels on an axle turn together).
One shared wheel (INK tyre, coloured hub with a pale cap, 5 tread bumps) at three sizes; the bike has spoked wheels.
extras: outline, fit (card height), wide (card width).

  prop_word_bus         RED single-decker (3.3 long, 2:1): four side windows, wide windscreen, BLUE door, YELLOW
                        destination strip, round headlights.
  prop_word_truck       dumper: BLUE cab, one side window, big open YELLOW tipping bed (bone 'bed', rotation.z + tips
                        it up), six wheels in three pairs (wheel.F, wheel.M, wheel.B), silver grille.
  prop_word_tractor     GREEN, tall open cab frame and roof, exhaust on the bonnet, huge YELLOW-hubbed back wheels with
                        chunky tread blocks, small front wheels.
  prop_word_digger      YELLOW excavator: cab on a turntable over two INK tracks (rollers on wheel.F / wheel.B),
                        a two-part arm on bones 'boom' and 'stick' and a toothed bucket on 'bucket' (rotation.z).
  prop_word_fireengine  RED, WHITE stripe, long GREY ladder on top (bone 'ladder', rotation.z + tilts it up), a coiled
                        YELLOW hose reel on the side, a BLUE light on the cab roof.
  prop_word_ambulance   WHITE boxy van, RED stripe round the middle, big RED crosses on both sides and the back door,
                        a BLUE light bar on the roof.
  prop_word_van         rounded ORANGE delivery van, windowless box back with a big WHITE parcel sticker, cab side
                        window, double back doors.
  prop_word_plane       fat toy aeroplane: WHITE with a BLUE belly, short round wings with RED engine pods, RED tail
                        fin, four round windows, cockpit glass, wheels down, a propeller on bone 'prop' (rotation.x).
  prop_word_helicopter  ORANGE egg body, huge SKY bubble, tail boom with a side rotor (bone 'rotor.tail',
                        rotation.z), two skids, a big four-blade GREY rotor on bone 'rotor' (rotation.y). No wheels.
  prop_word_bike        child's bike in side view on stabilisers: fat PINK frame, INK tyres, YELLOW hubs with four fat
                        spokes, WHITE saddle, handlebar tassels, a little front basket.
  prop_word_scooter     three-wheel toddler scooter: wide GREEN deck, two front wheels and one back, tall T bar,
                        ORANGE grips.
  prop_word_pushchair   buggy in side view: PURPLE seat with a pleated hood (bone 'hood', rotation.z + folds it
                        back), GREY frame and push handle, four small wheels, a basket underneath, a teddy in the seat.
"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded, circle_poly, star_poly, rot_m
from mathutils import Vector

ONLY = [s for s in os.environ.get('ONLY', '').split(',') if s]
TAU = math.tau
RED, ORANGE, YELLOW, GREEN, LEAF, BLUE, SKY, PURPLE = 0xff4f4f, 0xff9a2e, 0xffd23a, 0x4cc75a, 0x2f8a3a, 0x3f8cff, 0x8fd3ff, 0x9b6dff
PINK, ROSE, CREAM, WHITE, BROWN, WOOD, TAN, GREY, SLATE, INK = 0xff7fbf, 0xff9ec4, 0xf2e8d8, 0xfffaf0, 0xb07a4a, 0xd8924f, 0xf3d9ae, 0xb9c0c9, 0x6f7a8c, 0x3a2838
WS, WM, WL = 0.16, 0.31, 0.55            # the three wheel sizes (radius)


def mix(a, b, t):
    ca = [(a >> s) & 255 for s in (16, 8, 0)]
    cb = [(b >> s) & 255 for s in (16, 8, 0)]
    c = [round(x + (y - x) * t) for x, y in zip(ca, cb)]
    return (c[0] << 16) | (c[1] << 8) | c[2]


def lite(c, t=0.35):
    return mix(c, WHITE, t)


def dark(c, t=0.2):
    return mix(c, INK, t)


LAMP = lite(YELLOW, 0.5)


# ---------------------------------------------------------------- helpers
def prism(p, poly, a0, a1, xf=None):
    """extrude a 2D polygon [(u, v)...] from w = a0 to a1; xf maps local (u, v, w) to game space (default: x, y, z)."""
    m = len(poly)
    cu = sum(u for u, v in poly) / m
    cv = sum(v for u, v in poly) / m
    verts = []
    for a in (a0, a1):
        for u, v in [(cu, cv)] + list(poly):
            q = (u, v, a)
            verts.append(tuple(xf(q)) if xf else q)
    k = m + 1
    faces = []
    for i in range(m):
        j = (i + 1) % m
        faces.append((0, 1 + j, 1 + i))
        faces.append((k, k + 1 + i, k + 1 + j))
        faces.append((1 + i, 1 + j, k + 1 + j, k + 1 + i))
    p.mesh(verts, faces)


def band(p, outer, inner, a0, a1, xf=None):
    """a solid strip between two matching polylines (same point count) in the uv plane, extruded from w = a0 to a1:
    for concave outlines (zigzags, C shapes) that a centroid fan would fold."""
    m = len(outer)
    verts = []
    for a in (a0, a1):
        for (u, v) in list(outer) + list(inner):
            q = (u, v, a)
            verts.append(tuple(xf(q)) if xf else q)
    O = lambda k, i: k * 2 * m + i          # outer i on cap k
    I = lambda k, i: k * 2 * m + m + i      # inner i on cap k
    faces = []
    for i in range(m - 1):
        for k in (0, 1):
            faces.append((O(k, i), O(k, i + 1), I(k, i + 1), I(k, i)))
        faces.append((O(0, i), O(1, i), O(1, i + 1), O(0, i + 1)))
        faces.append((I(0, i), I(0, i + 1), I(1, i + 1), I(1, i)))
    for i in (0, m - 1):
        faces.append((O(0, i), I(0, i), I(1, i), O(1, i)))
    p.mesh(verts, faces)


def rrect(hu, hv, rr, n=4):
    return [q[:2] for q in rounded([(-hu, -hv), (hu, -hv), (hu, hv), (-hu, hv)], rr, n=n, closed=True)]


def face_xf(c, face):
    """local (u = right as seen from outside, v = up, w = outward) on a face of the vehicle -> game space"""
    cx, cy, cz = c
    return {
        '+z': lambda q: (cx + q[0], cy + q[1], cz + q[2]),
        '-z': lambda q: (cx - q[0], cy + q[1], cz - q[2]),
        '+x': lambda q: (cx + q[2], cy + q[1], cz - q[0]),
        '-x': lambda q: (cx - q[2], cy + q[1], cz + q[0]),
    }[face]


def to_face(q, c, face):
    """inverse of face_xf: game point -> (u, v, w)"""
    dx, dy, dz = q[0] - c[0], q[1] - c[1], q[2] - c[2]
    return {'+z': (dx, dy, dz), '-z': (-dx, dy, -dz), '+x': (-dz, dy, dx), '-x': (dz, dy, -dx)}[face]


FN = {'+z': (0, 0, 1), '-z': (0, 0, -1), '+x': (1, 0, 0), '-x': (-1, 0, 0)}


def panel(p, c, hu, hv, face, rr=None, d0=-0.05, d1=0.035, poly=None):
    """a flat rounded panel (window, door, sticker) on a face, centred at c (a point on the surface)"""
    pl = poly or rrect(hu, hv, rr if rr is not None else min(hu, hv) * 0.45)
    prism(p, pl, d0, d1, xf=face_xf(c, face))


class Glass:
    """windows: rounded SKY panels with a WHITE double glint in the upper left (as seen from outside)"""
    def __init__(self):
        self.wins = []

    def add(self, p, c, hu, hv, face, rr=None, d0=-0.06, d1=0.035, both=False):
        faces = [face]
        if both:
            faces.append({'+z': '-z', '-z': '+z', '+x': '-x', '-x': '+x'}[face])
        for f in faces:
            cc = c if f == face else (c[0], c[1], -c[2]) if f in ('+z', '-z') else (-c[0], c[1], c[2])
            panel(p, cc, hu, hv, f, rr, d0, d1)
            self.wins.append((cc, hu, hv, f))

    def glint(self, q, n):
        for c, hu, hv, f in self.wins:
            N = FN[f]
            if n[0] * N[0] + n[1] * N[1] + n[2] * N[2] < 0.5:
                continue
            u, v, w = to_face(q, c, f)
            if abs(w) > 0.12 or abs(u) > hu or abs(v) > hv:
                continue
            u, v = u / hu, v / hv
            d = v * 0.85 - u * 0.55
            if abs(u) < 0.9 and abs(v) < 0.88 and (abs(d - 0.5) < 0.13 or abs(d - 0.82) < 0.055):
                return True
        return False

    def paint(self, p):
        p.paint_fn(self.glint, WHITE)


def wheels(p, axles, w, hub, treads=5, tread=1.0, tyre='tyres', hubl='hubs', tf=None):
    """the shared toy wheel. axles: [(x, r, [z centres])]: an INK tyre (radius r, width w) with `treads` chunky
    bumps, a coloured hub on each outer face with a pale cap."""
    per = sum(max(110, int(560 * r)) * len(zs) for _, r, zs in axles)
    p.layer(tyre, base=INK, target_faces=tf or per, voxel=0.011)
    for x, r, zs in axles:
        k = r / 0.3
        for zc in zs:
            p.cyl((x, r, zc - w / 2), r * 0.97, w, rot=(90, 0, 0), bevel=w * 0.3, seg=32)
            for t in range(treads):
                a = TAU * t / treads + math.pi / 2
                p.box((x + r * 0.92 * math.cos(a), r + r * 0.92 * math.sin(a), zc),
                      (0.05 * k * tread, 0.085 * k * tread, w * 0.44), rot=(0, 0, math.degrees(a)), bevel=0.03 * k)
    p.paint_fn(lambda q, n: abs(n[2]) > 0.75, mix(INK, SLATE, 0.25))
    p.layer(hubl, base=hub, target_faces=tf and tf // 2 or per // 2, voxel=0.009)
    for x, r, zs in axles:
        for zc in zs:
            sides = (1, -1) if abs(zc) < 1e-6 else ((1,) if zc > 0 else (-1,))
            for s in sides:
                zf = zc + s * w / 2
                p.cyl((x, r, zf - s * 0.03), r * 0.56, 0.06, rot=(90 * s, 0, 0), bevel=0.025, seg=24)
                p.blob((x, r, zf + s * 0.04), (r * 0.22, r * 0.22, 0.045), group='cap%.2f%.2f%d' % (x, zc, s))
    caps = [(x, r) for x, r, _ in axles]
    p.paint_fn(lambda q, n: any(math.hypot(q[0] - x, q[1] - r) < r * 0.25 for x, r in caps) and abs(n[2]) > 0.3, lite(hub, 0.55))
    p.layer('skin')


def arches(p, axles, col, pad=0.07):
    """darker wheel arches on the body sides round each wheel"""
    p.paint_fn(lambda q, n: abs(n[2]) > 0.45 and any(math.hypot(q[0] - x, q[1] - r) < r + pad for x, r, _ in axles), col)


def lamps(p, pts, r=0.1, face='+x'):
    p.layer('lamps', base=LAMP, target_faces=90 * len(pts), voxel=0.008)
    for c in pts:
        p.cyl(c, r, 0.08, rot=(0, 0, -90) if face == '+x' else (0, 0, 90), bevel=0.03, seg=20)
    p.paint_fn(lambda q, n: any(math.hypot(q[1] - c[1] - r * 0.35, q[2] - c[2] + r * 0.3) < r * 0.28 for c in pts) and abs(n[0]) > 0.6, WHITE)
    p.layer('skin')


def rig(p, h, movers):
    """movers: [(name, head, tail, parent, pred(layer, q))]; 'body' takes everything else."""
    preds = [m[4] for m in movers]
    p.bone('body', (0, 0, 0), (0, h, 0), region=lambda q: not any(f(p._cur, q) for f in preds))
    for name, hd, tl, par, f in movers:
        p.bone(name, hd, tl, parent=par, region=(lambda f: lambda q: f(p._cur, q))(f))


def wheel_bone(name, x, r, layers=('tyres', 'hubs'), lo=None, hi=None):
    lo = x - r - 0.15 if lo is None else lo
    hi = x + r + 0.15 if hi is None else hi
    return (name, (x, r, 0), (x, r + 0.3, 0), 'body', lambda L, q: L in layers and lo < q[0] < hi)


def finish(p, w, h, outline=0.026):
    k = min(2.0 / h, 2.0 / w)
    p.extras['fit'] = round(h * k, 2)
    if w > h:
        p.extras['wide'] = round(w * k, 2)
    p.extras['outline'] = outline
    p.build()


# ---------------------------------------------------------------- bus
def bus():
    p = Prop('prop_word_bus', base=RED, target_faces=1400, voxel=0.02, smooth=4)
    L, Y0, Y1, Z = 1.6, 0.27, 1.62, 0.6
    p.box((0, (Y0 + Y1) / 2, 0), (L, (Y1 - Y0) / 2, Z), bevel=0.24)
    AX = [(1.02, WM, [0.5, -0.5]), (-1.02, WM, [0.5, -0.5])]
    p.paint_fn(lambda q, n: n[1] > 0.75, lite(RED, 0.18))
    arches(p, AX, dark(RED, 0.25))
    p.layer('glass', base=SKY, target_faces=640, voxel=0.009)
    g = Glass()
    for x in (-1.24, -0.72, -0.2, 0.32):
        g.add(p, (x, 1.12, Z), 0.21, 0.24, '+z', rr=0.1, both=True)
    g.add(p, (L, 1.02, 0), 0.47, 0.26, '+x', rr=0.12)
    g.add(p, (-L, 1.1, 0), 0.36, 0.2, '-x', rr=0.1)
    g.paint(p)
    p.layer('door', base=BLUE, target_faces=300, voxel=0.01)
    panel(p, (1.02, 0.84, Z), 0.24, 0.52, '+z', rr=0.1, d0=-0.05, d1=0.03)
    # the door's two glass panes and its middle seam
    p.paint_fn(lambda q, n: n[2] > 0.5 and q[1] > 0.88 and q[1] < 1.3 and abs(q[0] - 1.02) < 0.19 and abs(q[0] - 1.02) > 0.03, SKY)
    p.paint_fn(lambda q, n: n[2] > 0.5 and abs(q[0] - 1.02) <= 0.025 and q[1] < 1.33, dark(BLUE, 0.3))
    p.layer('strip', base=YELLOW, target_faces=200, voxel=0.009)
    panel(p, (L, 1.4, 0), 0.4, 0.075, '+x', rr=0.05, d0=-0.06, d1=0.04)
    p.paint_fn(lambda q, n: n[0] > 0.6 and abs(q[1] - 1.4) < 0.022 and abs(q[2]) < 0.28, dark(YELLOW, 0.45))
    p.layer('bumpers', base=GREY, target_faces=300, voxel=0.012)
    for s in (-1, 1):
        p.box((s * (L + 0.02), 0.34, 0), (0.07, 0.07, Z - 0.04), bevel=0.05)
    p.paint_fn(lambda q, n: n[1] > 0.6, WHITE)
    lamps(p, [(L - 0.02, 0.56, z) for z in (-0.42, 0.42)], r=0.1)
    wheels(p, AX, 0.25, YELLOW)
    rig(p, Y1, [wheel_bone('wheel.F', 1.02, WM), wheel_bone('wheel.B', -1.02, WM)])
    finish(p, 3.35, 1.60)


# ---------------------------------------------------------------- truck
def truck():
    p = Prop('prop_word_truck', base=BLUE, target_faces=1000, voxel=0.018, smooth=4)
    CX0, CX1, CY0, CY1, Z = 0.55, 1.38, 0.34, 1.42, 0.55
    p.box(((CX0 + CX1) / 2, (CY0 + CY1) / 2, 0), ((CX1 - CX0) / 2, (CY1 - CY0) / 2, Z), bevel=0.22)
    AX = [(0.98, WM, [0.47, -0.47]), (-0.32, WM, [0.47, -0.47]), (-0.98, WM, [0.47, -0.47])]
    p.paint_fn(lambda q, n: n[1] > 0.75, lite(BLUE, 0.2))
    arches(p, AX[:1], dark(BLUE, 0.3))
    p.layer('chassis', base=SLATE, target_faces=300, voxel=0.014)
    p.box((-0.2, 0.42, 0), (1.25, 0.1, 0.36), bevel=0.06)
    p.layer('glass', base=SKY, target_faces=500, voxel=0.009)
    g = Glass()
    g.add(p, (CX1, 1.1, 0), 0.42, 0.21, '+x', rr=0.1)
    g.add(p, (0.93, 1.1, Z), 0.24, 0.2, '+z', rr=0.1, both=True)
    g.paint(p)
    p.layer('grille', base=GREY, target_faces=260, voxel=0.009)
    panel(p, (CX1, 0.62, 0), 0.3, 0.16, '+x', rr=0.06, d0=-0.05, d1=0.05)
    p.paint_fn(lambda q, n: n[0] > 0.6 and abs(q[2]) < 0.24 and any(abs(q[1] - y) < 0.022 for y in (0.54, 0.62, 0.7)), SLATE)
    p.paint_fn(lambda q, n: n[1] > 0.6 or (n[0] > 0.6 and q[1] > 0.755), WHITE)
    lamps(p, [(CX1, 0.62, z) for z in (-0.43, 0.43)], r=0.09)
    # the tipping bed (bone 'bed', hinge at the back)
    p.layer('bedbox', base=YELLOW, target_faces=760, voxel=0.014)
    BX0, BX1, BY0, BZ = -1.36, 0.46, 0.55, 0.62
    p.box(((BX0 + BX1) / 2, BY0 + 0.07, 0), ((BX1 - BX0) / 2, 0.07, BZ), bevel=0.06)               # floor
    for s in (-1, 1):
        pts = [(BX0, BY0), (BX1, BY0), (BX1, 1.42), (BX0 + 0.12, 1.3), (BX0, 1.3)]
        prism(p, rounded(pts, 0.08, n=3, closed=True), s * BZ - 0.06, s * BZ + 0.06)              # sides
        p.tube([(BX0 - 0.02, 1.32, s * BZ), (BX0 + 0.12, 1.32, s * BZ), (BX1, 1.44, s * BZ)], 0.07, rseg=10)
    p.box((BX0 + 0.05, 0.93, 0), (0.06, 0.38, BZ), bevel=0.05)                                    # tailgate
    p.box((BX1 - 0.04, 1.0, 0), (0.06, 0.45, BZ), bevel=0.05)                                     # front wall
    p.box((BX1 + 0.13, 1.5, 0), (0.24, 0.05, BZ), rot=(0, 0, -6), bevel=0.04)                     # cab guard
    p.paint_fn(lambda q, n: n[1] > 0.6 and q[1] < 0.75, dark(YELLOW, 0.18))                      # inside floor
    p.paint_fn(lambda q, n: abs(n[2]) > 0.6 and abs(q[2]) > BZ and any(abs(q[0] - x) < 0.04 for x in (-0.95, -0.45, 0.05)) and q[1] < 1.25, dark(YELLOW, 0.12))
    wheels(p, AX, 0.25, YELLOW)
    rig(p, CY1, [('bed', (BX0, BY0, 0), (BX0, BY0 + 0.4, 0), 'body', lambda L, q: L == 'bedbox'),
                 wheel_bone('wheel.F', 0.98, WM), wheel_bone('wheel.M', -0.32, WM, hi=-0.01), wheel_bone('wheel.B', -0.98, WM, lo=-1.5, hi=-0.66)])
    finish(p, 2.85, 1.51)


# ---------------------------------------------------------------- tractor
def tractor():
    p = Prop('prop_word_tractor', base=GREEN, target_faces=1300, voxel=0.018, smooth=4)
    BXW, BR_, FX, FR = -0.42, WL, 0.86, 0.27
    p.box((0.6, 0.8, 0), (0.55, 0.31, 0.32), bevel=0.2)                    # bonnet
    p.box((-0.3, 0.82, 0), (0.46, 0.32, 0.38), bevel=0.18)                 # body under the seat
    p.box((0.75, 0.46, 0), (0.42, 0.13, 0.22), bevel=0.08)                 # chassis to the front axle
    # grille slats on the nose, darker bonnet sides
    p.paint_fn(lambda q, n: n[0] > 0.6 and q[0] > 1.0 and abs(q[2]) < 0.24 and 0.56 < q[1] < 1.02 and (q[1] * 1000 // 1) % 90 < 40, dark(GREEN, 0.3))
    p.paint_fn(lambda q, n: n[1] < -0.5, dark(GREEN, 0.2))
    p.layer('fenders', base=GREEN, target_faces=500, voxel=0.012)
    for s in (-1, 1):
        prof = rounded([(BR_ + 0.06, -0.21), (BR_ + 0.13, -0.21), (BR_ + 0.13, 0.21), (BR_ + 0.06, 0.21)], 0.03, n=2)
        p.lathe(prof, pos=(BXW, BR_, s * 0.52), rot=(90, 0, 0), seg=28, closed=True, a0=math.pi * 0.55, a1=math.pi * 1.42)
    p.paint_fn(lambda q, n: n[1] > 0.5, lite(GREEN, 0.15))
    # the open cab: four fat posts and a roof
    p.layer('frame', base=LEAF, target_faces=500, voxel=0.011)
    for x in (-0.72, 0.1):
        for z in (-0.36, 0.36):
            p.tube([(x, 1.0, z), (x, 1.86, z)], 0.065, rseg=12)
    p.layer('roof', base=GREEN, target_faces=320, voxel=0.012)
    p.box((-0.31, 1.9, 0), (0.55, 0.07, 0.47), bevel=0.06)
    p.paint_fn(lambda q, n: n[1] > 0.6, lite(GREEN, 0.25))
    p.layer('seat', base=SLATE, target_faces=420, voxel=0.01)
    p.box((-0.42, 1.2, 0), (0.18, 0.06, 0.2), bevel=0.05)
    p.box((-0.6, 1.4, 0), (0.05, 0.22, 0.2), rot=(0, 0, 12), bevel=0.04)
    p.tube([(-0.02, 1.08, 0), (-0.08, 1.38, 0)], 0.04, rseg=8)
    p.ring((-0.09, 1.4, 0), 0.13, 0.035, rot=(0, 0, 60), seg=24, rseg=8)
    p.layer('exhaust', base=GREY, target_faces=260, voxel=0.009)
    p.tube([(0.82, 1.05, 0.17), (0.82, 1.45, 0.17)], 0.06, rseg=12)
    p.cyl((0.82, 1.42, 0.17), 0.08, 0.08, bevel=0.03, seg=16)
    p.paint_fn(lambda q, n: n[1] > 0.6 or (q[0] < 0.79 and abs(n[1]) < 0.5), WHITE)
    lamps(p, [(1.13, 0.98, z) for z in (-0.2, 0.2)], r=0.075)
    wheels(p, [(BXW, BR_, [0.52, -0.52])], 0.32, YELLOW, treads=12, tread=0.85)
    wheels(p, [(FX, FR, [0.33, -0.33])], 0.18, YELLOW, tyre='ftyres', hubl='fhubs')
    rig(p, 1.9, [wheel_bone('wheel.F', FX, FR, layers=('ftyres', 'fhubs')), wheel_bone('wheel.B', BXW, BR_)])
    finish(p, 2.28, 1.98)


# ---------------------------------------------------------------- digger
def digger():
    p = Prop('prop_word_digger', base=YELLOW, target_faces=1200, voxel=0.018, smooth=4)
    TZ, TW = 0.43, 0.14                                   # track centre z, half width
    TX0, TX1, TH = -0.98, 0.76, 0.48
    # the house on its turntable
    p.box((-0.24, 0.86, 0), (0.64, 0.3, 0.5), bevel=0.18)
    p.blob((-0.82, 0.86, 0), (0.2, 0.26, 0.46), group='cw')                       # rounded counterweight
    p.box((0.05, 1.45, -0.17), (0.3, 0.36, 0.3), bevel=0.14)                       # cab
    p.paint_fn(lambda q, n: q[0] < -0.72 and q[1] < 1.14, dark(YELLOW, 0.15))
    p.paint_fn(lambda q, n: n[1] > 0.75 and q[1] > 1.75, lite(YELLOW, 0.3))
    p.layer('glass', base=SKY, target_faces=420, voxel=0.009)
    g = Glass()
    g.add(p, (0.35, 1.5, -0.17), 0.22, 0.24, '+x', rr=0.09)
    g.add(p, (0.04, 1.5, 0.13), 0.2, 0.24, '+z', rr=0.09)
    g.paint(p)
    p.layer('under', base=SLATE, target_faces=500, voxel=0.014)
    p.box((-0.1, 0.32, 0), (0.62, 0.12, 0.32), bevel=0.06)
    p.cyl((-0.1, 0.42, 0), 0.46, 0.16, bevel=0.05, seg=36)
    # tracks: stadium loops with tread bars
    p.layer('tracks', base=INK, target_faces=700, voxel=0.011)
    st = rounded([(TX0, 0.0), (TX1, 0.0), (TX1, TH), (TX0, TH)], 0.235, n=8, closed=True)
    for s in (-1, 1):
        prism(p, st, s * TZ - TW, s * TZ + TW)
    p.paint_fn(lambda q, n: abs(n[2]) < 0.6 and (q[0] * 100 // 1) % 14 < 6, mix(INK, SLATE, 0.45))
    p.paint_fn(lambda q, n: abs(n[2]) > 0.6 and abs(q[2]) > TZ and math.hypot(max(0, abs(q[0] - (TX0 + TX1) / 2) - 0.64), q[1] - TH / 2) > 0.19, mix(INK, SLATE, 0.3))
    p.layer('rollers', base=GREY, target_faces=420, voxel=0.009)
    ROL = [(TX1 - 0.24, 0.24, 0.17), (TX0 + 0.24, 0.24, 0.17), (-0.11, 0.22, 0.12)]
    for x, y, r in ROL:
        for s in (-1, 1):
            p.cyl((x, y, s * (TZ + TW - 0.03)), r, 0.07, rot=(90 * s, 0, 0), bevel=0.025, seg=22)
    p.paint_fn(lambda q, n: abs(n[2]) > 0.5 and any(math.hypot(q[0] - x, q[1] - y) < r * 0.35 for x, y, r in ROL), WHITE)
    # the arm (boom and stick on the +z side of the cab) and the toothed bucket
    AZ = 0.16
    ROOT, ELB, WRI = (0.3, 0.95), (1.08, 1.86), (1.48, 0.8)
    p.layer('boomarm', base=YELLOW, target_faces=500, voxel=0.012)
    bp = [ROOT, (0.52, 1.45), (0.78, 1.8), ELB]
    p.tube([(x, y, AZ) for x, y in bp], [0.13, 0.135, 0.13, 0.12], rseg=14)
    p.blob((ROOT[0], ROOT[1], AZ), (0.15, 0.15, 0.15), group='root')
    p.paint_fn(lambda q, n: abs(n[2]) > 0.6 and math.hypot(q[0] - ROOT[0], q[1] - ROOT[1]) < 0.06, SLATE)
    p.layer('stickarm', base=YELLOW, target_faces=400, voxel=0.012)
    p.tube([(ELB[0], ELB[1], AZ), ((ELB[0] + WRI[0]) / 2 + 0.06, (ELB[1] + WRI[1]) / 2, AZ), (WRI[0], WRI[1], AZ)], [0.12, 0.1, 0.09], rseg=12)
    p.blob((ELB[0], ELB[1], AZ), (0.135, 0.135, 0.135), group='elbow')
    p.paint_fn(lambda q, n: abs(n[2]) > 0.6 and math.hypot(q[0] - ELB[0], q[1] - ELB[1]) < 0.055, SLATE)
    p.layer('scoop', base=YELLOW, target_faces=500, voxel=0.01)
    BC = (WRI[0] + 0.02, WRI[1] - 0.2)
    Ro, Ri = 0.34, 0.24
    angs = [math.radians(a) for a in range(70, -201, -10)]
    outer = [(BC[0] + Ro * math.cos(a), BC[1] + Ro * math.sin(a)) for a in angs]
    inner = [(BC[0] + Ri * math.cos(a), BC[1] + Ri * math.sin(a)) for a in angs]
    band(p, outer, inner, AZ - 0.24, AZ + 0.24)                              # the curved scoop
    core = [(BC[0] + 0.03 * math.cos(a), BC[1] + 0.03 * math.sin(a)) for a in angs]
    for s in (-1, 1):
        band(p, outer, core, AZ + s * 0.24 - 0.04, AZ + s * 0.24 + 0.04)    # its side plates
    p.blob((WRI[0], WRI[1], AZ), (0.11, 0.11, 0.11), group='wrist')
    p.paint_fn(lambda q, n: math.hypot(q[0] - BC[0], q[1] - BC[1]) < Ri + 0.01 and abs(q[2] - AZ) < 0.2, dark(YELLOW, 0.25))
    p.layer('teeth', base=GREY, target_faces=260, voxel=0.008)
    a = math.radians(-200)
    lip = (BC[0] + (Ro + Ri) / 2 * math.cos(a), BC[1] + (Ro + Ri) / 2 * math.sin(a))
    for z in (-0.16, -0.055, 0.055, 0.16):
        p.capsule((lip[0], lip[1], AZ + z), (lip[0] - 0.13, lip[1] + 0.04, AZ + z), 0.045, group='t%.2f' % z, r2=0.03)
    p.layer('skin')
    rig(p, 1.8, [('boom', (ROOT[0], ROOT[1], AZ), (ROOT[0], ROOT[1] + 0.4, AZ), 'body', lambda L, q: L == 'boomarm'),
                 ('stick', (ELB[0], ELB[1], AZ), (ELB[0], ELB[1] + 0.35, AZ), 'boom', lambda L, q: L == 'stickarm'),
                 ('bucket', (WRI[0], WRI[1], AZ), (WRI[0], WRI[1] + 0.3, AZ), 'stick', lambda L, q: L in ('scoop', 'teeth')),
                 ('wheel.F', (ROL[0][0], ROL[0][1], 0), (ROL[0][0], ROL[0][1] + 0.3, 0), 'body', lambda L, q: L == 'rollers' and q[0] > 0.2),
                 ('wheel.B', (ROL[1][0], ROL[1][1], 0), (ROL[1][0], ROL[1][1] + 0.3, 0), 'body', lambda L, q: L == 'rollers' and q[0] < -0.4)])
    finish(p, 2.84, 1.97)


# ---------------------------------------------------------------- fire engine
def fireengine():
    p = Prop('prop_word_fireengine', base=RED, target_faces=1200, voxel=0.02, smooth=4)
    Z = 0.6
    p.box((-0.38, 0.83, 0), (1.14, 0.53, Z), bevel=0.2)                 # body x -1.52..0.76
    p.box((1.0, 0.89, 0), (0.46, 0.6, Z), bevel=0.26)                   # cab x 0.54..1.46, top 1.49
    AX = [(1.0, WM, [0.5, -0.5]), (-0.86, WM, [0.5, -0.5])]
    p.paint_fn(lambda q, n: abs(n[1]) < 0.55 and 0.6 < q[1] < 0.75, WHITE)          # the white stripe
    p.paint_fn(lambda q, n: n[1] > 0.75, lite(RED, 0.18))
    arches(p, AX, dark(RED, 0.25))
    # locker doors on the side (two seams)
    p.paint_fn(lambda q, n: abs(n[2]) > 0.6 and q[1] > 0.78 and q[1] < 1.22 and any(abs(q[0] - x) < 0.02 for x in (-1.12, 0.2)), dark(RED, 0.3))
    p.layer('glass', base=SKY, target_faces=500, voxel=0.009)
    g = Glass()
    g.add(p, (1.46, 1.1, 0), 0.45, 0.22, '+x', rr=0.1)
    g.add(p, (1.02, 1.1, Z), 0.27, 0.22, '+z', rr=0.1, both=True)
    g.paint(p)
    p.layer('turret', base=SLATE, target_faces=300, voxel=0.012)
    p.box((-1.12, 1.43, 0), (0.22, 0.1, 0.3), bevel=0.06)
    p.cyl((-1.12, 1.36, 0), 0.32, 0.1, bevel=0.03, seg=28)
    # the ladder (bone 'ladder', hinge on the turret)
    p.layer('ladderrails', base=GREY, target_faces=760, voxel=0.011)
    LY, LX0, LX1, LZ = 1.62, -1.48, 1.06, 0.25
    for s in (-1, 1):
        p.tube([(LX0, LY, s * LZ), (LX1, LY, s * LZ)], 0.065, rseg=12)
    nr = 11
    for i in range(nr):
        x = LX0 + 0.12 + (LX1 - LX0 - 0.24) * i / (nr - 1)
        p.tube([(x, LY, -LZ), (x, LY, LZ)], 0.045, rseg=8)
    p.box((-1.12, 1.55, 0), (0.14, 0.07, LZ), bevel=0.04)                # the hinge block
    p.paint_fn(lambda q, n: n[1] > 0.6 and abs(abs(q[2]) - LZ) < 0.05, WHITE)
    # the hose reel on the side
    p.layer('reel', base=GREY, target_faces=260, voxel=0.01)
    RC = (-0.48, 1.0)
    p.cyl((RC[0], RC[1], Z - 0.04), 0.31, 0.07, rot=(90, 0, 0), bevel=0.025, seg=30)
    p.blob((RC[0], RC[1], Z + 0.13), (0.07, 0.07, 0.05), group='hub')
    p.layer('hose', base=YELLOW, target_faces=420, voxel=0.009)
    sp = []
    turns, r0, r1 = 2.6, 0.08, 0.27
    for i in range(70):
        t = i / 69
        a = t * turns * TAU
        rr = r0 + (r1 - r0) * t
        sp.append((RC[0] + rr * math.sin(a), RC[1] + rr * math.cos(a), Z + 0.07))
    sp += [(RC[0] + 0.3, RC[1] - 0.12, Z + 0.09), (RC[0] + 0.36, RC[1] - 0.36, Z + 0.1), (RC[0] + 0.4, 0.5, Z + 0.1)]
    p.tube(sp, 0.042, rseg=10)
    p.ring((RC[0], RC[1], Z + 0.04), 0.33, 0.045, rot=(90, 0, 0), seg=36, rseg=8)
    p.paint_fn(lambda q, n: (q[1] < 0.6 and q[0] > RC[0] + 0.3) or abs(math.hypot(q[0] - RC[0], q[1] - RC[1]) - 0.33) < 0.05 and q[2] < Z + 0.1, GREY)
    p.layer('beacon', base=BLUE, target_faces=200, voxel=0.009)
    p.cyl((1.22, 1.42, 0), 0.14, 0.2, r2=0.11, bevel=0.06, seg=22)
    p.paint_fn(lambda q, n: n[0] < 0.2 and n[2] > 0.3 and q[1] > 1.5 and q[1] < 1.56, lite(BLUE, 0.6))
    p.layer('bumpers', base=GREY, target_faces=260, voxel=0.012)
    for x in (-1.54, 1.48):
        p.box((x, 0.34, 0), (0.07, 0.07, Z - 0.04), bevel=0.05)
    p.paint_fn(lambda q, n: n[1] > 0.6, WHITE)
    lamps(p, [(1.46, 0.6, z) for z in (-0.42, 0.42)], r=0.1)
    wheels(p, AX, 0.25, YELLOW)
    rig(p, 1.6, [('ladder', (-1.12, LY, 0), (-1.12, LY + 0.35, 0), 'body', lambda L, q: L == 'ladderrails'),
                 wheel_bone('wheel.F', 1.0, WM), wheel_bone('wheel.B', -0.86, WM)])
    finish(p, 3.12, 1.67)


# ---------------------------------------------------------------- ambulance
def ambulance():
    p = Prop('prop_word_ambulance', base=WHITE, target_faces=1150, voxel=0.02, smooth=4)
    Z = 0.62
    p.box((-0.3, 0.99, 0), (1.07, 0.71, Z), bevel=0.22)                   # box x -1.37..0.77, top 1.7
    p.box((0.94, 0.72, 0), (0.44, 0.44, Z - 0.02), bevel=0.22)            # bonnet x 0.5..1.38
    AX = [(0.9, WM, [0.52, -0.52]), (-0.82, WM, [0.52, -0.52])]
    p.paint_fn(lambda q, n: abs(n[1]) < 0.55 and 0.74 < q[1] < 0.9, RED)                 # the stripe round the middle
    p.paint_fn(lambda q, n: n[1] < -0.5, dark(WHITE, 0.12))
    arches(p, AX, mix(WHITE, GREY, 0.75))
    p.paint_fn(lambda q, n: n[0] < -0.6 and abs(q[2]) < 0.02 and q[1] > 0.32, GREY)       # back door seam
    p.layer('glass', base=SKY, target_faces=500, voxel=0.009)
    g = Glass()
    g.add(p, (0.77, 1.38, 0), 0.46, 0.19, '+x', rr=0.09)
    g.add(p, (0.47, 1.3, Z), 0.22, 0.2, '+z', rr=0.09, both=True)
    g.paint(p)
    p.layer('cross', base=RED, target_faces=360, voxel=0.008)
    A, B = 0.3, 0.105
    cross = rounded([(-B, -A), (B, -A), (B, -B), (A, -B), (A, B), (B, B), (B, A), (-B, A), (-B, B), (-A, B), (-A, -B), (-B, -B)], 0.035, n=2, closed=True)
    cross = [q[:2] for q in cross]
    for f, c in (('+z', (-0.42, 1.27, Z)), ('-z', (-0.42, 1.27, -Z)), ('-x', (-1.37, 1.28, 0))):
        panel(p, c, 0, 0, f, poly=cross, d0=-0.05, d1=0.03)
    p.layer('lightbar', base=BLUE, target_faces=300, voxel=0.01)
    p.box((0.42, 1.76, 0), (0.15, 0.08, 0.44), bevel=0.06)
    p.paint_fn(lambda q, n: n[1] > 0.4 and abs(q[2]) < 0.06, GREY)
    p.paint_fn(lambda q, n: n[0] > 0.5 and q[1] > 1.78 and abs(abs(q[2]) - 0.25) < 0.08, lite(BLUE, 0.6))
    p.layer('bumpers', base=GREY, target_faces=260, voxel=0.012)
    for x in (-1.39, 1.4):
        p.box((x, 0.34, 0), (0.07, 0.07, Z - 0.06), bevel=0.05)
    p.paint_fn(lambda q, n: n[1] > 0.6, WHITE)
    lamps(p, [(1.38, 0.66, z) for z in (-0.42, 0.42)], r=0.1)
    wheels(p, AX, 0.25, RED)
    rig(p, 1.7, [wheel_bone('wheel.F', 0.9, WM), wheel_bone('wheel.B', -0.82, WM)])
    finish(p, 2.90, 1.84)


# ---------------------------------------------------------------- van
def van():
    p = Prop('prop_word_van', base=ORANGE, target_faces=1100, voxel=0.02, smooth=4)
    Z = 0.6
    p.box((-0.18, 0.94, 0), (1.18, 0.66, Z), bevel=0.36)                 # rounded box x -1.36..1.0, top 1.6
    p.box((1.04, 0.62, 0), (0.34, 0.34, Z - 0.03), bevel=0.27)           # bonnet x 0.7..1.38
    p.box((0.86, 1.02, 0), (0.22, 0.3, Z - 0.03), rot=(0, 0, 26), bevel=0.2)   # sloping windscreen front
    AX = [(0.92, WM, [0.5, -0.5]), (-0.86, WM, [0.5, -0.5])]
    p.paint_fn(lambda q, n: n[1] > 0.75, lite(ORANGE, 0.2))
    p.paint_fn(lambda q, n: n[1] < -0.5, dark(ORANGE, 0.15))
    arches(p, AX, dark(ORANGE, 0.25))
    # double back doors: a seam and two handles
    p.paint_fn(lambda q, n: n[0] < -0.6 and abs(q[2]) < 0.02 and 0.36 < q[1] < 1.4, dark(ORANGE, 0.35))
    # the cab door seam behind the window
    p.paint_fn(lambda q, n: abs(n[2]) > 0.6 and abs(q[0] - 0.3) < 0.018 and 0.4 < q[1] < 1.42, dark(ORANGE, 0.3))
    p.layer('glass', base=SKY, target_faces=500, voxel=0.009)
    g = Glass()
    g.add(p, (0.6, 1.14, Z), 0.22, 0.2, '+z', rr=0.1, both=True)
    g.paint(p)
    # the windscreen, on the slope
    R26 = rot_m((0, 0, 26))
    wc = Vector((0.86, 1.02, 0)) + R26 @ Vector((0.22, 0.0, 0))
    prism(p, rrect(0.42, 0.21, 0.1), -0.05, 0.035, xf=lambda q: tuple(wc + R26 @ Vector((q[2], q[1], -q[0]))))
    def wglint(q, n):
        l = R26.transposed() @ (Vector(q) - wc)
        u, v = -l.z / 0.42, l.y / 0.21
        d = v * 0.85 - u * 0.55
        return l.x > -0.02 and abs(u) < 0.9 and abs(v) < 0.88 and (abs(d - 0.5) < 0.13 or abs(d - 0.82) < 0.055)
    p.paint_fn(wglint, WHITE)
    # the big parcel sticker on both sides: a box drawn as a little cube (pale lid, white front, cream side) with tape
    p.layer('parcel', base=WHITE, target_faces=520, voxel=0.008)
    PC, PR = (-0.42, 0.95), 0.4
    hexa = [(PR * math.cos(math.radians(30 + 60 * k)), PR * math.sin(math.radians(30 + 60 * k))) for k in range(6)]
    hexa = [q[:2] for q in rounded(hexa, 0.05, n=2, closed=True)]
    for f, zc in (('+z', Z), ('-z', -Z)):
        panel(p, (PC[0], PC[1], zc), 0, 0, f, poly=hexa, d0=-0.05, d1=0.03)
    def pface(q, n):
        if abs(n[2]) < 0.5:
            return None
        u = (q[0] - PC[0]) * (1 if q[2] > 0 else -1)
        v = q[1] - PC[1]
        if v > 0 and v > abs(u) * math.tan(math.radians(30)) - 0.002:
            return 'top', u, v
        return ('left' if u < 0 else 'right'), u, v
    p.paint_fn(lambda q, n: (pface(q, n) or ('',))[0] == 'top', TAN)
    p.paint_fn(lambda q, n: (pface(q, n) or ('',))[0] == 'right', CREAM)
    def tape(q, n):
        r = pface(q, n)
        if not r:
            return False
        f_, u, v = r
        if f_ == 'top':      # across the lid, from the left edge's middle to the right edge's middle
            return abs(v - PR * 0.5 - (u * 0.0)) < 0.045 and abs(u) < PR * 0.6 and v > abs(u) * 0.577 + 0.02
        if f_ == 'left':     # down the middle of the front face
            return abs(u + PR * 0.433) < 0.045 and v < -abs(u) * 0.0 + 0.24
        return False
    p.paint_fn(tape, WOOD)
    p.layer('handles', base=GREY, target_faces=120, voxel=0.008)
    for z in (-0.1, 0.1):
        p.blob((-1.37, 0.95, z), (0.03, 0.04, 0.07), group='h%.1f' % z)
    p.layer('bumpers', base=GREY, target_faces=260, voxel=0.012)
    for x in (-1.37, 1.39):
        p.box((x, 0.34, 0), (0.07, 0.07, Z - 0.08), bevel=0.05)
    p.paint_fn(lambda q, n: n[1] > 0.6, WHITE)
    lamps(p, [(1.37, 0.66, z) for z in (-0.38, 0.38)], r=0.1)
    wheels(p, AX, 0.25, WHITE)
    rig(p, 1.6, [wheel_bone('wheel.F', 0.92, WM), wheel_bone('wheel.B', -0.86, WM)])
    finish(p, 2.87, 1.58)


# ---------------------------------------------------------------- plane
def plane():
    p = Prop('prop_word_plane', base=WHITE, target_faces=1000, voxel=0.018, smooth=4)
    CY = 0.98
    prof = rounded([(0, -1.58), (0.12, -1.52), (0.3, -0.98), (0.44, -0.38), (0.45, 0.45), (0.41, 0.92), (0.26, 1.2), (0, 1.3)], 0.2, n=5)
    p.lathe(prof, pos=(0, CY, 0), rot=(0, 0, -90), seg=40)
    def rad(x):
        for (r0, y0), (r1, y1) in zip(prof, prof[1:]):
            if y0 <= x <= y1:
                return r0 + (r1 - r0) * (x - y0) / max(1e-6, y1 - y0)
        return 0.0
    p.paint_fn(lambda q, n: q[1] < CY - 0.12, BLUE)                                          # blue belly
    # wings (low, short and round)
    p.layer('wings', base=WHITE, target_faces=440, voxel=0.012)
    wing = [q[:2] for q in rounded([(0.34, -1.22), (0.34, 1.22), (-0.24, 1.18), (-0.3, -1.18)], 0.3, n=6, closed=True)]
    prism(p, wing, CY - 0.33, CY - 0.2, xf=lambda q: (q[0], q[2], q[1]))
    p.paint_fn(lambda q, n: abs(q[2]) > 1.0, RED)                                              # red wing tips
    p.layer('tail', base=RED, target_faces=340, voxel=0.011)
    fin = [q[:2] for q in rounded([(-1.6, CY + 0.05), (-1.05, CY + 0.12), (-1.36, CY + 0.78), (-1.62, CY + 0.78)], 0.1, n=4, closed=True)]
    prism(p, fin, -0.065, 0.065)
    stab = [q[:2] for q in rounded([(-1.55, -0.55), (-1.12, -0.14), (-1.12, 0.14), (-1.55, 0.55)], 0.1, n=4, closed=True)]
    prism(p, stab, CY + 0.08, CY + 0.17, xf=lambda q: (q[0], q[2], q[1]))
    p.layer('pods', base=RED, target_faces=340, voxel=0.01)
    for s in (-1, 1):
        p.lathe(rounded([(0, -0.28), (0.12, -0.26), (0.14, 0.1), (0.13, 0.26), (0, 0.27)], 0.06, n=3), pos=(0.12, CY - 0.4, s * 0.68), rot=(0, 0, -90), seg=20)
    p.paint_fn(lambda q, n: n[0] > 0.6 and q[0] > 0.3, dark(RED, 0.35))
    p.layer('glass', base=SKY, target_faces=460, voxel=0.008)
    WX = (-0.6, -0.26, 0.08, 0.42)
    for s in (-1, 1):
        for x in WX:
            z = math.sqrt(max(0.0, rad(x) ** 2 - 0.08 ** 2))
            p.cyl((x, CY + 0.08, s * (z - 0.06)), 0.115, 0.09, rot=(90 * s, 0, 0), bevel=0.03, seg=22)
    p.blob((0.78, CY + 0.3, 0), (0.3, 0.17, 0.27), rot=(0, 0, -12), group='cockpit')
    p.paint_fn(lambda q, n: (abs(n[2]) > 0.5 and any(math.hypot(q[0] - x + 0.035, q[1] - CY - 0.115) < 0.03 for x in WX)), WHITE)
    p.paint_fn(lambda q, n: q[1] > CY + 0.3 and abs(q[0] - 0.74 + (q[1] - CY - 0.3) * 0.8) < 0.035 and abs(q[2]) < 0.2, WHITE)
    # the propeller (bone 'prop')
    NX = 1.3
    p.layer('spinner', base=RED, target_faces=200, voxel=0.009)
    p.lathe(rounded([(0, 0), (0.16, 0.0), (0.12, 0.14), (0, 0.24)], 0.05, n=3), pos=(NX - 0.04, CY, 0), rot=(0, 0, -90), seg=20)
    p.layer('blades', base=YELLOW, target_faces=300, voxel=0.009)
    for s in (-1, 1):
        p.blob((NX + 0.08, CY + s * 0.36, s * 0.04), (0.05, 0.3, 0.1), rot=(s * 18, 0, 0), group='bl%d' % s)
    # wheels down on struts
    p.layer('struts', base=GREY, target_faces=300, voxel=0.01)
    for x, z, y0 in ((0.86, 0, CY - 0.38), (-0.02, 0.4, CY - 0.33), (-0.02, -0.4, CY - 0.33)):
        p.tube([(x, y0 + 0.05, z * 0.8), (x, WS, z)], 0.045, rseg=8)
    wheels(p, [(0.86, WS * 0.9, [0.0]), (-0.02, WS, [0.4, -0.4])], 0.13, RED, treads=5)
    rig(p, 1.7, [('prop', (NX, CY, 0), (NX, CY + 0.3, 0), 'body', lambda L, q: L in ('blades', 'spinner')),
                 wheel_bone('wheel.F', 0.86, WS * 0.9), wheel_bone('wheel.B', -0.02, WS)])
    finish(p, 3.07, 1.71)


# ---------------------------------------------------------------- helicopter
def helicopter():
    p = Prop('prop_word_helicopter', base=ORANGE, target_faces=1300, voxel=0.018, smooth=4)
    p.blob((0.0, 0.95, 0), (0.74, 0.6, 0.56), group='egg')
    p.blob((0.28, 0.9, 0), (0.56, 0.52, 0.5), group='egg')
    p.capsule((-0.5, 1.04, 0), (-1.62, 1.2, 0), 0.15, group='boom', r2=0.085)
    fin = [q[:2] for q in rounded([(-1.82, 1.08), (-1.52, 1.12), (-1.62, 1.62), (-1.82, 1.62)], 0.08, n=3, closed=True)]
    prism(p, fin, -0.05, 0.05)
    p.paint_fn(lambda q, n: n[1] < -0.45 and q[0] > -0.7, dark(ORANGE, 0.18))
    p.paint_fn(lambda q, n: abs(q[0] + 1.0) < 0.06 and q[0] < -0.6, dark(ORANGE, 0.25))          # a band on the boom
    p.layer('glass', base=SKY, target_faces=700, voxel=0.011)
    GC = (0.42, 1.05, 0)
    p.blob(GC, (0.52, 0.5, 0.48), group='bubble')
    def gl(q, n):
        if n[0] < -0.2:
            return False
        u, v = (q[0] - GC[0]) / 0.52, (q[1] - GC[1]) / 0.5
        d = v * 0.9 - u * 0.45
        return abs(q[2]) > 0.05 and ((abs(d - 0.42) < 0.08) or (abs(d - 0.64) < 0.035)) and u > -0.1
    p.paint_fn(gl, WHITE)
    p.layer('skids', base=GREY, target_faces=500, voxel=0.01)
    for s in (-1, 1):
        p.tube([(-0.62, 0.07, s * 0.46), (0.55, 0.07, s * 0.46), (0.74, 0.12, s * 0.46), (0.82, 0.24, s * 0.46)], 0.065, rseg=10)
        for x in (-0.32, 0.32):
            p.tube([(x, 0.08, s * 0.46), (x * 0.9, 0.46, s * 0.3)], 0.05, rseg=8)
    p.paint_fn(lambda q, n: n[1] > 0.6 and q[1] < 0.2, WHITE)
    p.layer('trotor', base=GREY, target_faces=260, voxel=0.009)
    TR = (-1.66, 1.32, 0.11)
    for a in (35, 125):
        p.box(TR, (0.045, 0.24, 0.03), rot=(0, 0, a), bevel=0.025)
    p.blob((TR[0], TR[1], TR[2] + 0.02), (0.06, 0.06, 0.05), group='th')
    p.layer('rotorblades', base=GREY, target_faces=700, voxel=0.01)
    p.cyl((0.02, 1.48, 0), 0.075, 0.2, bevel=0.03, seg=16)
    p.blob((0.02, 1.7, 0), (0.13, 0.08, 0.13), group='hub')
    for k in range(4):
        a = math.radians(45 + 90 * k)
        p.box((0.02 + 0.68 * math.cos(a), 1.72, 0.68 * math.sin(a)), (0.64, 0.04, 0.11), rot=(0, -math.degrees(a), 0), bevel=0.035)
    p.paint_fn(lambda q, n: n[1] > 0.6 and math.hypot(q[0] - 0.02, q[2]) > 1.1, ORANGE)        # orange blade tips
    p.layer('skin')
    rig(p, 1.5, [('rotor', (0.02, 1.48, 0), (0.02, 1.85, 0), 'body', lambda L, q: L == 'rotorblades'),
                 ('rotor.tail', TR, (TR[0], TR[1] + 0.25, TR[2]), 'body', lambda L, q: L == 'trotor')])
    finish(p, 2.79, 1.75)


# ---------------------------------------------------------------- bike
def bike():
    p = Prop('prop_word_bike', base=PINK, target_faces=1150, voxel=0.013, smooth=3)
    RW, FW, Y = (-0.62, 0.0), (0.62, 0.0), 0.43
    TR_ = 0.08
    RA, FA = (-0.62, Y), (0.62, Y)
    BB, ST, HT, HB = (-0.03, 0.38), (-0.2, 1.0), (0.42, 1.08), (0.48, 0.85)
    path = lambda pts: [(x, y, 0) for x, y in pts]
    p.tube(path([HB, BB]), TR_)                           # down tube
    p.tube(path([(0.44, 1.0), (-0.17, 0.86)]), TR_)       # top tube
    p.tube(path([BB, ST]), TR_)                           # seat tube
    p.tube(path([BB, RA]), TR_ * 0.85)                    # chain stay
    p.tube(path([(-0.18, 0.9), RA]), TR_ * 0.85)          # seat stay
    p.tube(path([HT, HB]), TR_ * 1.1)                     # head tube
    p.tube(path([HB, FA]), TR_ * 0.9)                     # fork
    p.tube(path([HT, (0.38, 1.24)]), TR_ * 0.85)          # stem
    p.tube([(0.36, 1.24, -0.3), (0.38, 1.25, 0), (0.36, 1.24, 0.3)], 0.055)   # handlebar
    p.paint_fn(lambda q, n: n[1] < -0.6, dark(PINK, 0.15))
    p.layer('guard', base=ROSE, target_faces=260, voxel=0.01)
    gp = rounded([(-0.68, 0.36), (0.06, 0.26), (0.12, 0.42), (-0.6, 0.53)], 0.09, n=4, closed=True)
    prism(p, [q[:2] for q in gp], 0.08, 0.14)
    p.layer('saddle', base=WHITE, target_faces=300, voxel=0.01)
    p.tube(path([(-0.2, 0.98), (-0.23, 1.1)]), 0.05)
    p.blob((-0.25, 1.15, 0), (0.24, 0.07, 0.12), rot=(0, 0, -4), group='s')
    p.blob((-0.35, 1.16, 0), (0.12, 0.08, 0.15), group='s')
    p.layer('grips', base=WHITE, target_faces=200, voxel=0.009)
    for s in (-1, 1):
        p.capsule((0.36, 1.24, s * 0.22), (0.36, 1.24, s * 0.36), 0.07, group='g%d' % s)
    p.layer('tassels', base=YELLOW, target_faces=300, voxel=0.007)
    for s in (-1, 1):
        for k, (dx, dy) in enumerate(((-0.08, -0.22), (-0.16, -0.18), (-0.2, -0.08))):
            p.capsule((0.36, 1.24, s * 0.4), (0.36 + dx, 1.24 + dy, s * (0.42 + 0.02 * k)), 0.032, group='t%d%d' % (s, k), r2=0.04)
    p.paint_fn(lambda q, n: (q[0] * 100 // 4) % 2 == 0, SKY)
    p.layer('basket', base=TAN, target_faces=360, voxel=0.01)
    BK = (0.66, 1.06)
    p.box((BK[0], BK[1] - 0.14, 0), (0.17, 0.03, 0.2), bevel=0.025)
    for s in (-1, 1):
        p.box((BK[0] + s * 0.16, BK[1], 0), (0.03, 0.14, 0.2), bevel=0.025)
        p.box((BK[0], BK[1], s * 0.19), (0.17, 0.14, 0.03), bevel=0.025)
    p.ring((BK[0], BK[1] + 0.14, 0), 0.19, 0.035, scale=(0.95, 1.12), seg=28, rseg=8)
    p.tube(path([(0.44, 1.12), (0.5, 1.06)]), 0.035)
    p.paint_fn(lambda q, n: abs(n[1]) < 0.5 and any(abs(q[1] - y) < 0.018 for y in (BK[1] - 0.05, BK[1] + 0.04)), WOOD)
    p.layer('pedals', base=SLATE, target_faces=300, voxel=0.009)
    p.tube([(BB[0], BB[1], 0.12), (BB[0] + 0.1, BB[1] - 0.17, 0.12)], 0.04)
    p.box((BB[0] + 0.1, BB[1] - 0.18, 0.2), (0.07, 0.035, 0.08), bevel=0.025)
    p.blob((BB[0], BB[1], 0.13), (0.08, 0.08, 0.04), group='crank')
    # wheels: INK tyres, YELLOW hubs with four fat spokes
    R = 0.36
    p.layer('tyres', base=INK, target_faces=560, voxel=0.01)
    for x, y in (RA, FA):
        p.ring((x, y, 0), R, 0.075, rot=(90, 0, 0), scale=(1, 1), seg=40, rseg=12)
    p.paint_fn(lambda q, n: abs(n[2]) > 0.7, mix(INK, SLATE, 0.25))
    p.layer('hubs', base=YELLOW, target_faces=420, voxel=0.009)
    for x, y in (RA, FA):
        p.cyl((x, y, -0.07), 0.09, 0.14, rot=(90, 0, 0), bevel=0.03, seg=18)
        for k in range(4):
            a = math.radians(45 + 90 * k)
            p.tube([(x + 0.06 * math.cos(a), y + 0.06 * math.sin(a), 0), (x + (R - 0.04) * math.cos(a), y + (R - 0.04) * math.sin(a), 0)], 0.036, rseg=8)
    p.paint_fn(lambda q, n: abs(n[2]) > 0.6 and any(math.hypot(q[0] - x, q[1] - y) < 0.04 for x, y in (RA, FA)), lite(YELLOW, 0.6))
    # stabilisers
    p.layer('stab', base=GREY, target_faces=260, voxel=0.009)
    for s in (-1, 1):
        p.tube([(RA[0], RA[1], s * 0.08), (RA[0] - 0.02, 0.15, s * 0.34)], 0.04, rseg=8)
    wheels(p, [(RA[0] - 0.02, 0.13, [0.36, -0.36])], 0.09, YELLOW, treads=5, tyre='stabtyres', hubl='stabhubs', tf=300)
    rig(p, 1.25, [('wheel.F', (FA[0], FA[1], 0), (FA[0], FA[1] + 0.3, 0), 'body', lambda L, q: L in ('tyres', 'hubs') and q[0] > 0),
                  ('wheel.B', (RA[0], RA[1], 0), (RA[0], RA[1] + 0.3, 0), 'body', lambda L, q: L in ('tyres', 'hubs') and q[0] < 0)])
    finish(p, 2.06, 1.30)


# ---------------------------------------------------------------- scooter
def scooter():
    p = Prop('prop_word_scooter', base=GREEN, target_faces=1000, voxel=0.012, smooth=3)
    FX, BX = 0.5, -0.66
    r = 0.14
    p.box((-0.12, 0.29, 0), (0.52, 0.07, 0.23), bevel=0.065)              # the wide deck
    p.box((FX - 0.02, 0.32, 0), (0.15, 0.12, 0.3), bevel=0.09)              # front housing over the twin wheels
    p.tube([(-0.6, 0.3, 0), (BX - 0.04, r + 0.16, 0), (BX - 0.16, r + 0.1, 0)], 0.075, rseg=12)   # rear brake guard
    p.tube([(FX - 0.03, 0.4, 0), (0.36, 1.46, 0)], 0.065, rseg=12)          # the tall column
    p.tube([(0.36, 1.48, -0.36), (0.36, 1.5, 0), (0.36, 1.48, 0.36)], 0.06, rseg=12)   # T bar
    p.paint_fn(lambda q, n: n[1] > 0.7 and q[1] > 0.33 and q[1] < 0.4 and -0.58 < q[0] < 0.3 and abs(q[2]) < 0.19, dark(GREEN, 0.3))   # grip pad
    p.paint_fn(lambda q, n: n[1] < -0.5, dark(GREEN, 0.18))
    p.layer('grips', base=ORANGE, target_faces=260, voxel=0.009)
    for s in (-1, 1):
        p.capsule((0.36, 1.48, s * 0.2), (0.36, 1.48, s * 0.4), 0.085, group='g%d' % s)
    p.paint_fn(lambda q, n: abs(abs(q[2]) - 0.3) < 0.02, dark(ORANGE, 0.2))
    p.layer('skin')
    wheels(p, [(FX, r, [0.24, -0.24]), (BX, r, [0.0])], 0.12, ORANGE, tf=700)
    rig(p, 1.5, [wheel_bone('wheel.F', FX, r, lo=0.2), wheel_bone('wheel.B', BX, r, hi=-0.3)])
    finish(p, 1.48, 1.57)


# ---------------------------------------------------------------- pushchair
def pushchair():
    p = Prop('prop_word_pushchair', base=PURPLE, target_faces=900, voxel=0.013, smooth=3)
    FX, RX, r, ZW = 0.42, -0.48, WS, 0.3
    # the fabric seat: pan, reclined back, leg rest
    p.box((0.02, 0.7, 0), (0.25, 0.08, 0.27), rot=(0, 0, 4), bevel=0.07)
    p.box((-0.27, 0.98, 0), (0.08, 0.32, 0.27), rot=(0, 0, 22), bevel=0.07)
    p.box((0.3, 0.55, 0), (0.06, 0.17, 0.25), rot=(0, 0, 28), bevel=0.05)
    p.paint_fn(lambda q, n: abs(abs(q[2]) - 0.27) < 0.03 or abs(n[2]) > 0.8, dark(PURPLE, 0.15))
    # the pleated hood: three stepped bands on bone 'hood'
    p.layer('hoodcloth', base=PURPLE, target_faces=700, voxel=0.011)
    HC = (-0.24, 1.14)
    for k, (a0, a1, R) in enumerate(((0.62, 0.9, 0.43), (0.88, 1.16, 0.46), (1.14, 1.45, 0.49))):
        prof = rounded([(R - 0.035, -0.31), (R + 0.035, -0.31), (R + 0.035, 0.31), (R - 0.035, 0.31)], 0.025, n=2)
        p.lathe(prof, pos=(HC[0], HC[1], 0), rot=(90, 0, 0), seg=16, closed=True, a0=math.pi * a0, a1=math.pi * a1)
    p.paint_fn(lambda q, n: abs(abs(q[2]) - 0.31) < 0.025, lite(PURPLE, 0.35))
    # the frame
    p.layer('frame', base=GREY, target_faces=520, voxel=0.01)
    H = (-0.66, 1.5)
    for s in (-1, 1):
        z = s * ZW
        p.tube([(FX, r, z), (H[0], H[1], z)], 0.05, rseg=10)
        p.tube([(RX, r, z), (-0.12, 0.84, z)], 0.045, rseg=10)
    p.tube([(H[0] - 0.02, H[1] + 0.02, -ZW - 0.02), (H[0] - 0.02, H[1] + 0.02, ZW + 0.02)], 0.05, rseg=10)
    p.paint_fn(lambda q, n: n[1] > 0.6 and q[1] < 1.4, WHITE)
    p.layer('grip', base=SLATE, target_faces=200, voxel=0.01)
    p.capsule((H[0] - 0.02, H[1] + 0.02, -0.2), (H[0] - 0.02, H[1] + 0.02, 0.2), 0.075, group='g')
    p.layer('basket', base=SLATE, target_faces=400, voxel=0.01)
    p.box((-0.05, 0.3, 0), (0.25, 0.03, 0.24), bevel=0.025)
    for s in (-1, 1):
        p.box((-0.05 + s * 0.24, 0.39, 0), (0.025, 0.1, 0.24), bevel=0.02)
        p.box((-0.05, 0.39, s * 0.23), (0.25, 0.1, 0.025), bevel=0.02)
    p.paint_fn(lambda q, n: abs(n[1]) < 0.5 and ((q[0] + q[1]) * 100 // 1) % 9 < 3, mix(SLATE, GREY, 0.5))
    # the teddy sitting in the seat, head turned to look out
    p.layer('teddy', base=BROWN, target_faces=520, voxel=0.009)
    ph = math.radians(55)
    D = Vector((math.cos(ph), 0, math.sin(ph)))
    S_ = Vector((-math.sin(ph), 0, math.cos(ph)))
    def at(c, d=0.0, s=0.0, y=0.0):
        v = Vector(c) + D * d + S_ * s + Vector((0, y, 0))
        return tuple(v)
    TB, TH = (-0.06, 0.88, 0), (-0.07, 1.13, 0)
    p.blob(TB, (0.15, 0.17, 0.15), group='tb')
    p.blob(TH, (0.15, 0.135, 0.15), group='th')
    for s in (-1, 1):
        p.blob(at(TH, -0.02, s * 0.12, 0.11), (0.06, 0.06, 0.06), group='ear%d' % s)
        p.capsule(at(TB, 0.04, s * 0.14, 0.04), at(TB, 0.12, s * 0.17, -0.05), 0.05, group='arm%d' % s)
        p.capsule(at(TB, 0.06, s * 0.08, -0.12), (0.22 + 0.02 * s, 0.73, s * 0.08), 0.06, group='leg%d' % s)
    p.layer('teddy2', base=TAN, target_faces=260, voxel=0.007)
    p.blob(at(TH, 0.13, 0, -0.035), (0.06, 0.045, 0.06), group='muz')
    p.blob(at(TB, 0.11, 0, -0.02), (0.08, 0.1, 0.05), group='tum')
    for s in (-1, 1):
        p.blob(at(TH, -0.01, s * 0.125, 0.115), (0.03, 0.03, 0.03), group='ein%d' % s)
    p.layer('teddy3', base=INK, target_faces=150, voxel=0.005)
    p.blob(at(TH, 0.19, 0, -0.02), (0.022, 0.017, 0.02), group='nose')
    for s in (-1, 1):
        p.blob(at(TH, 0.135, s * 0.06, 0.035), (0.02, 0.025, 0.02), group='eye%d' % s)
    p.layer('skin')
    wheels(p, [(FX, r, [ZW, -ZW]), (RX, r, [ZW, -ZW])], 0.11, WHITE, tf=560)
    rig(p, 1.5, [('hood', (HC[0], HC[1], 0), (HC[0], HC[1] + 0.3, 0), 'body', lambda L, q: L == 'hoodcloth'),
                 wheel_bone('wheel.F', FX, r), wheel_bone('wheel.B', RX, r)])
    finish(p, 1.34, 1.62)


# ---------------------------------------------------------------- card variants of the meadow car and the parade train
def car():
    p = Prop('prop_word_car', base=BLUE, target_faces=1100, voxel=0.018, smooth=4)
    L, Z = 1.08, 0.58
    p.box((0, 0.6, 0), (L, 0.3, Z), bevel=0.26)                           # lower body y 0.3..0.9
    p.box((-0.12, 1.06, 0), (0.62, 0.32, Z - 0.06), bevel=0.27)           # round cabin y 0.74..1.38
    AX = [(0.66, WM, [0.47, -0.47]), (-0.66, WM, [0.47, -0.47])]
    p.paint_fn(lambda q, n: n[1] > 0.75, lite(BLUE, 0.2))
    p.paint_fn(lambda q, n: n[1] < -0.5, dark(BLUE, 0.2))
    arches(p, AX, dark(BLUE, 0.3))
    p.paint_fn(lambda q, n: abs(n[2]) > 0.6 and abs(q[0] + 0.08) < 0.018 and 0.42 < q[1] < 1.3, dark(BLUE, 0.3))   # door seam
    p.layer('glass', base=SKY, target_faces=520, voxel=0.009)
    g = Glass()
    g.add(p, (0.18, 1.1, Z - 0.06), 0.2, 0.17, '+z', rr=0.09, both=True)
    g.add(p, (-0.37, 1.1, Z - 0.06), 0.18, 0.17, '+z', rr=0.09, both=True)
    g.add(p, (0.5, 1.1, 0), 0.4, 0.17, '+x', rr=0.09)
    g.add(p, (-0.74, 1.1, 0), 0.36, 0.15, '-x', rr=0.08)
    g.paint(p)
    p.layer('handles', base=GREY, target_faces=100, voxel=0.008)
    for s in (-1, 1):
        p.blob((0.12, 0.78, s * (Z + 0.01)), (0.07, 0.025, 0.025), group='h%d' % s)
    p.layer('bumpers', base=GREY, target_faces=240, voxel=0.012)
    for x in (-L - 0.02, L + 0.02):
        p.box((x, 0.38, 0), (0.07, 0.07, Z - 0.06), bevel=0.05)
    p.paint_fn(lambda q, n: n[1] > 0.6, WHITE)
    lamps(p, [(L - 0.01, 0.66, z) for z in (-0.36, 0.36)], r=0.1)
    wheels(p, AX, 0.25, WHITE)
    rig(p, 1.38, [wheel_bone('wheel.F', 0.66, WM), wheel_bone('wheel.B', -0.66, WM)])
    finish(p, 2.31, 1.36)


def train():
    p = Prop('prop_word_train', base=BLUE, target_faces=900, voxel=0.018, smooth=4)
    CY, BR_ = 0.9, 0.42
    p.cyl((-0.34, CY, 0), BR_, 1.38, rot=(0, 0, -90), bevel=0.08, seg=36)     # boiler x -0.34..1.04
    p.paint_fn(lambda q, n: n[1] > 0.8, lite(BLUE, 0.25))
    p.layer('bands', base=YELLOW, target_faces=420, voxel=0.011)
    for x in (0.05, 0.62):
        p.ring((x, CY, 0), BR_ + 0.01, 0.04, rot=(0, 0, 90), seg=36, rseg=8)
    p.lathe(rounded([(0, CY + 0.3), (0.17, CY + 0.3), (0.16, CY + 0.5), (0, CY + 0.6)], 0.07, n=3), pos=(0.33, 0, 0), seg=24)  # dome
    p.layer('smokebox', base=SLATE, target_faces=380, voxel=0.013)
    p.cyl((0.98, CY, 0), BR_ + 0.03, 0.16, rot=(0, 0, -90), bevel=0.05, seg=36)
    p.box((-0.02, 0.43, 0), (1.18, 0.08, 0.44), bevel=0.04)                  # running board
    p.paint_fn(lambda q, n: n[0] > 0.6 and math.hypot(q[1] - CY, q[2]) < 0.12, dark(SLATE, 0.3))
    p.layer('chimneystack', base=SLATE, target_faces=260, voxel=0.011)
    p.lathe(rounded([(0, CY + 0.3), (0.13, CY + 0.3), (0.12, 1.55), (0.21, 1.7), (0.21, 1.76), (0, 1.76)], 0.035, n=3), pos=(0.8, 0, 0), seg=24)
    p.layer('cab', base=RED, target_faces=600, voxel=0.015)
    p.box((-0.74, 0.98, 0), (0.4, 0.5, 0.5), bevel=0.15)                    # x -1.14..-0.34, y 0.48..1.48
    p.box((-0.76, 1.53, 0), (0.5, 0.06, 0.58), bevel=0.05)                  # roof
    pts = [(1.02, 0.36), (1.32, 0.36), (1.02, 0.66)]
    prism(p, [q[:2] for q in rounded(pts, 0.05, n=2, closed=True)], -0.4, 0.4)   # cow-catcher
    p.paint_fn(lambda q, n: n[1] > 0.6 and q[1] > 1.5, lite(RED, 0.25))
    p.layer('glass', base=SKY, target_faces=300, voxel=0.009)
    g = Glass()
    g.add(p, (-0.74, 1.18, 0.5), 0.22, 0.18, '+z', rr=0.09, both=True)
    g.paint(p)
    p.layer('rods', base=GREY, target_faces=200, voxel=0.01)
    for s in (-1, 1):
        p.box((0.03, 0.3, s * 0.6), (0.6, 0.035, 0.03), bevel=0.02)
    p.paint_fn(lambda q, n: n[1] > 0.6, WHITE)
    lamps(p, [(1.06, CY + 0.32, 0)], r=0.1)
    wheels(p, [(0.66, 0.28, [0.42, -0.42]), (-0.6, 0.36, [0.42, -0.42])], 0.22, RED)
    rig(p, 1.5, [('chimney', (0.8, CY + 0.3, 0), (0.8, 1.76, 0), 'body', lambda L, q: L == 'chimneystack'),
                 wheel_bone('wheel.F', 0.66, 0.28), wheel_bone('wheel.B', -0.6, 0.36)])
    finish(p, 2.46, 1.74)


def carriage():
    p = Prop('prop_word_carriage', base=YELLOW, target_faces=900, voxel=0.018, smooth=4)
    Z = 0.5
    p.box((0, 0.93, 0), (0.95, 0.45, Z), bevel=0.18)                      # y 0.48..1.38
    p.paint_fn(lambda q, n: abs(n[1]) < 0.6 and 0.6 < q[1] < 0.72, RED)    # red band, like the engine's cab
    p.layer('roof', base=RED, target_faces=360, voxel=0.014)
    p.blob((0, 1.4, 0), (1.07, 0.14, 0.6), group='roof')
    p.paint_fn(lambda q, n: n[1] > 0.7, lite(RED, 0.25))
    p.layer('glass', base=SKY, target_faces=600, voxel=0.009)
    g = Glass()
    for x in (-0.56, 0.0, 0.56):
        g.add(p, (x, 1.04, Z), 0.19, 0.18, '+z', rr=0.09, both=True)
    g.add(p, (0.95, 1.04, 0), 0.22, 0.18, '+x', rr=0.09)
    g.add(p, (-0.95, 1.04, 0), 0.22, 0.18, '-x', rr=0.09)
    g.paint(p)
    p.layer('chassis', base=SLATE, target_faces=420, voxel=0.012)
    p.box((0, 0.44, 0), (0.86, 0.08, 0.4), bevel=0.04)
    for s in (-1, 1):
        p.tube([(s * 0.9, 0.46, 0), (s * 1.12, 0.46, 0)], 0.05, rseg=8)
        p.blob((s * 1.14, 0.46, 0), (0.07, 0.07, 0.09), group='cp%d' % s)
    wheels(p, [(0.56, 0.24, [0.38, -0.38]), (-0.56, 0.24, [0.38, -0.38])], 0.2, RED)
    rig(p, 1.5, [wheel_bone('wheel.F', 0.56, 0.24), wheel_bone('wheel.B', -0.56, 0.24)])
    finish(p, 2.11, 1.53)


MODELS = dict(prop_word_bus=bus, prop_word_truck=truck, prop_word_tractor=tractor, prop_word_digger=digger,
              prop_word_fireengine=fireengine, prop_word_ambulance=ambulance, prop_word_van=van, prop_word_plane=plane,
              prop_word_helicopter=helicopter, prop_word_bike=bike, prop_word_scooter=scooter, prop_word_pushchair=pushchair,
              prop_word_car=car, prop_word_train=train, prop_word_carriage=carriage)
for name, fn in MODELS.items():
    if not ONLY or name in ONLY:
        fn()
