"""Snack chef kitchen (Home world). One script, several models (ONLY=prop_k_tap,... builds a subset):
  prop_k_counter  the kitchen island (skin + 'doors' painted white: the game tints them per level): 11.6 long (x -5.8..5.8), 2.35 deep (z -1.175..1.175), worktop surface at y 1.15.
                  Mint cupboards with round gold knobs, a butcher-block worktop, and a steel sink basin let into the top
                  (inner floor y 0.75, opening x SINK_X +-0.62, z SINK_Z +-0.45). Layers: 'top', 'doors', 'knobs', 'basin'.
  prop_k_tap      a chrome gooseneck tap, origin at its base (stands on the worktop): the spout rises 0.95 and arcs
                  forward (+z) to pour at (0, 0.78, 0.82). A red/blue cross handle on its right (bone 'handle', turns about y).
  prop_k_soap     a pink pump bottle (~0.62 tall) with a white pump head (bone 'pump', pushes down) and a bubble sticker.
  prop_k_towel    a striped hand towel folded over a little rail: origin at the rail centre, the brackets go back to z -0.16
                  (they screw onto the cupboard front), the towel hangs ~0.85 below the rail.
  prop_k_fridge   a rounded retro fridge, 1.9 wide, 1.5 deep, 4.2 tall, origin on the floor at its centre. Hollow, with two
                  white shelves inside (tops at y SHELVES); the door (bone 'door', hinge on the right front edge; in game
                  rotation.y > 0 swings it open toward us, to the right) carries a chrome handle and fridge magnets.
  prop_k_board    a wooden chopping board 1.7 x 1.0 x 0.1 (bottom at y 0) with a handle tab on +x.
  prop_k_plate2   a plate split in two (r 1.05, floor y 0.07): a pink fruit half (-x, a strawberry print) and a green veg half
                  (+x, a carrot print).
  prop_k_plate4   a plate split in four (r 1.25): fruit (back left, pink), veg (back right, green), grain (front left,
                  yellow, a bread print) and dairy (front right, blue, a milk-bottle print)."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded, circle_poly
from skit import SProp

ONLY = [s for s in os.environ.get('ONLY', '').split(',') if s]
TOP = 1.15
FY = 0.75          # the basin's inner floor
SINK_X, SINK_Z, SHW, SHD = -3.6, -0.6, 0.62, 0.45
SHELVES = (1.35, 2.45)


def inside(poly, x, y):
    c = False
    n = len(poly)
    for i in range(n):
        x0, y0 = poly[i]; x1, y1 = poly[(i + 1) % n]
        if (y0 > y) != (y1 > y) and x < x0 + (y - y0) * (x1 - x0) / (y1 - y0):
            c = not c
    return c


# ---------------- the island counter ----------------
def counter():
    p = SProp('prop_k_counter', base=0xffffff, voxel=0.028, target_faces=5000)   # tinted per level in game
    HX, HZ = 5.7, 1.06
    # plinth (recessed, darker) and the cupboard body; above y 0.86 the body goes round the sink's well
    p.box((0, 0.09, -0.02), (HX - 0.08, 0.09, HZ - 0.06), bevel=0.03)
    p.box((0, 0.42, 0), (HX, 0.26, HZ), bevel=0.06)
    x0, x1, z0, z1 = SINK_X - SHW - 0.06, SINK_X + SHW + 0.06, SINK_Z - SHD - 0.06, SINK_Z + SHD + 0.06
    y0, y1 = 0.62, TOP - 0.11
    hy, cy = (y1 - y0) / 2, (y0 + y1) / 2
    p.box(((-HX + x0) / 2, cy, 0), ((x0 + HX) / 2, hy, HZ), bevel=0.05)
    p.box(((x1 + HX) / 2, cy, 0), ((HX - x1) / 2, hy, HZ), bevel=0.05)
    p.box((SINK_X, cy, (z1 + HZ) / 2), (SHW + 0.06, hy, (HZ - z1) / 2), bevel=0.03)
    p.box((SINK_X, cy, (-HZ + z0) / 2), (SHW + 0.06, hy, (z0 + HZ) / 2), bevel=0.03)
    p.paint_fn(lambda q, n: q.y < 0.19, 0xb4b4b4)
    # the worktop: butcher block, overhanging a little, with the sink hole
    p.layer('top', base=0xf0c084, voxel=0.024, target_faces=2600)
    TX, TZ, th = 5.85, 1.175, 0.11
    ty = TOP - th / 2
    p.box(((-TX + x0) / 2, ty, 0), ((x0 + TX) / 2, th / 2, TZ), bevel=0.04)
    p.box(((x1 + TX) / 2, ty, 0), ((TX - x1) / 2, th / 2, TZ), bevel=0.04)
    p.box((SINK_X, ty, (z1 + TZ) / 2), (SHW + 0.07, th / 2, (TZ - z1) / 2), bevel=0.03)
    p.box((SINK_X, ty, (-TZ + z0) / 2), (SHW + 0.07, th / 2, (z0 + TZ) / 2), bevel=0.03)
    # wood strips along the top (soft stripes) and a darker edge
    p.paint_fn(lambda q, n: n.y > 0.7 and int((q.z + 2) / 0.29) % 2 == 0, 0xeab676)
    p.paint_fn(lambda q, n: n.y < 0.7, 0xd99e5c)
    # the steel basin: a rounded tub let into the hole (walls + floor), with a drain
    p.layer('basin', base=0xd6e2ee, voxel=0.016, target_faces=1800)
    bw = 0.05
    fy = FY
    p.box((SINK_X, fy - 0.03, SINK_Z), (SHW + 0.04, 0.05, SHD + 0.04), bevel=0.04)
    for s in (-1, 1):
        p.box((SINK_X + s * (SHW + bw / 2), (fy + TOP) / 2 - 0.01, SINK_Z), (bw / 2 + 0.02, (TOP - fy) / 2 + 0.02, SHD + 0.06), bevel=0.02)
        p.box((SINK_X, (fy + TOP) / 2 - 0.01, SINK_Z + s * (SHD + bw / 2)), (SHW + 0.06, (TOP - fy) / 2 + 0.02, bw / 2 + 0.02), bevel=0.02)
    # a rolled rim round the hole
    rim = rounded([(SINK_X - SHW - 0.03, SINK_Z - SHD - 0.03), (SINK_X + SHW + 0.03, SINK_Z - SHD - 0.03),
                   (SINK_X + SHW + 0.03, SINK_Z + SHD + 0.03), (SINK_X - SHW - 0.03, SINK_Z + SHD + 0.03)], 0.12, n=4, closed=True)
    p.tube([(x, TOP + 0.005, z) for x, z in rim], 0.035, closed=True, rseg=10)
    p.paint_fn(lambda q, n: q.y < fy + 0.04 and n.y > 0.6, 0xb9c8d8)
    p.paint_fn(lambda q, n: n.y > 0.6 and q.y < fy + 0.04 and math.hypot(q.x - SINK_X, q.z - SINK_Z) < 0.1, 0x7d8ea3)
    # cupboard doors on the front: raised panels, two drawers over the sink end
    p.layer('doors', base=0xffffff, voxel=0.02, target_faces=2600)   # tinted per level in game
    FZ = HZ
    xs = [-5.0, -3.6, -2.2, -0.75, 0.75, 2.2, 3.6, 5.0]
    for x in xs:
        p.box((x, 0.5, FZ + 0.02), (0.6, 0.29, 0.035), bevel=0.03)
        p.box((x, 0.93, FZ + 0.02), (0.6, 0.085, 0.035), bevel=0.03)
    for x in (-HX, HX):   # the ends get one big panel each
        p.box((x + (0.02 if x > 0 else -0.02), 0.62, 0), (0.035, 0.4, 0.82), bevel=0.03)
    p.layer('knobs', base=0xffc531, voxel=0.01, target_faces=1400)
    for x in xs:
        kx = x + (0.42 if xs.index(x) % 2 == 0 else -0.42)
        p.blob((kx, 0.6, FZ + 0.1), (0.065, 0.065, 0.05), group='k%d' % xs.index(x))
        p.blob((x, 0.93, FZ + 0.1), (0.07, 0.04, 0.04), group='d%d' % xs.index(x))
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, TOP, 0))
    p.extras['outline'] = 0.026
    p.build()


# ---------------- tap ----------------
CHROME, CHROME_D = 0xe3ecf5, 0xa9bacb


def tap():
    p = Prop('prop_k_tap', base=CHROME, target_faces=2200, voxel=0.011, smooth=3)
    p.cyl((0, 0, 0), 0.17, 0.06, r2=0.15, bevel=0.025, seg=28)            # the round foot
    p.cyl((0, 0.04, 0), 0.085, 0.3, r2=0.075, bevel=0.02, seg=24)         # the column
    # gooseneck: up, over, down to the nozzle
    path = [(0, 0.3, 0)] + [(0, 0.3 + 0.62 * t, 0) for t in (0.3, 0.6, 0.85)]
    for i in range(1, 12):
        a = math.pi * i / 12
        path.append((0, 0.93 + 0.36 * math.sin(a) * 0.55, 0.38 - 0.38 * math.cos(a)))
    path.append((0, 0.82, 0.78))
    p.tube(path, 0.06, rseg=14)
    p.cyl((0, 0.72, 0.78), 0.075, 0.12, r2=0.07, bevel=0.02, seg=20)        # nozzle
    p.paint_fn(lambda q, n: n.y < -0.5 and q.y < 0.76 and q.z > 0.7, 0x8fa3b8)
    p.paint_fn(lambda q, n: q.y < 0.07, CHROME_D)
    # shine streaks (crisp white)
    p.layer('shine', base=0xffffff, target_faces=150, voxel=0.006)
    p.capsule((-0.05, 0.12, 0.06), (-0.05, 0.26, 0.055), 0.016, group='s1')
    p.layer('skin')
    # the cross handle on the right (own bone): a hub and four round-ended spokes, red / blue dots
    p.layer('handle', base=CHROME, target_faces=900, voxel=0.009)
    HX = 0.3
    p.capsule((0.06, 0.14, 0), (HX, 0.14, 0), 0.045, group='arm')
    p.cyl((HX, 0.12, 0), 0.07, 0.12, bevel=0.025, seg=20)
    for k in range(4):
        a = k * math.pi / 2 + math.pi / 4
        p.capsule((HX, 0.25, 0), (HX + 0.17 * math.cos(a), 0.27, 0.17 * math.sin(a)), 0.035, group='sp%d' % k)
        p.blob((HX + 0.19 * math.cos(a), 0.27, 0.19 * math.sin(a)), (0.05, 0.045, 0.05), group='sp%d' % k)
    p.blob((HX, 0.27, 0), (0.07, 0.04, 0.07), group='hub')
    p.layer('dot', base=0x4a9cff, target_faces=160, voxel=0.006)
    p.blob((HX, 0.315, 0), (0.045, 0.012, 0.045), group='dot')
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 0.9, 0))
    p.bone('handle', (HX, 0.1, 0), (HX, 0.4, 0), parent='body', region=lambda q: q.x > 0.18 and q.y > 0.05 and q.y < 0.36)
    p.anchor('spout', (0, 0.7, 0.78), 'body')
    p.extras['outline'] = 0.018
    p.build()


# ---------------- soap ----------------
def soap():
    p = Prop('prop_k_soap', base=0xff9ec4, target_faces=1500, voxel=0.01, smooth=3)
    prof = rounded([(0, 0), (0.2, 0), (0.22, 0.05), (0.22, 0.34), (0.17, 0.42), (0.08, 0.46), (0.07, 0.5), (0, 0.5)], 0.05, n=4)
    p.lathe(prof, seg=36)
    p.paint_fn(lambda q, n: n.y < -0.6, 0xe880aa)
    p.layer('label', base=0xffffff, target_faces=400, voxel=0.006)
    p.lathe(rounded([(0.218, 0.09), (0.232, 0.09), (0.232, 0.3), (0.218, 0.3)], 0.008, n=2, closed=True), closed=True, seg=36, a0=-1.0, a1=1.0)
    p.layer('bubble', base=0x8fd3ff, target_faces=260, voxel=0.005)
    for (x, y, r) in ((-0.03, 0.2, 0.045), (0.05, 0.16, 0.03), (0.04, 0.25, 0.022)):
        p.sticker(circle_poly(r, 14), y, lambda yy: 0.232, thick=0.01, ang=x / 0.232, lift=0.003)
    p.layer('pump', base=0xffffff, target_faces=700, voxel=0.008)
    p.cyl((0, 0.48, 0), 0.04, 0.16, bevel=0.01, seg=16)
    p.box((0.04, 0.66, 0), (0.12, 0.045, 0.06), bevel=0.035)
    p.capsule((0.15, 0.65, 0), (0.22, 0.6, 0), 0.025, group='nz')
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 0.45, 0))
    p.bone('pump', (0, 0.5, 0), (0, 0.72, 0), parent='body', region=lambda q: q.y > 0.5)
    p.extras['outline'] = 0.016
    p.build()


# ---------------- towel ----------------
def towel():
    p = Prop('prop_k_towel', base=0xffb84d, target_faces=1800, voxel=0.012, smooth=2)
    W, D = 0.42, 0.85
    # folded over the rail: a front flap (longer) and a back flap, a soft rounded fold on top
    for z, h in ((0.07, D), (-0.06, D * 0.7)):
        p.box((0, -h / 2 + 0.02, z), (W, h / 2, 0.035), bevel=0.03)
    p.box((0, 0.03, 0.005), (W, 0.05, 0.08), bevel=0.05)
    # stripes near the bottom of the front flap and a fringe line
    p.paint_fn(lambda q, n: q.z > 0.09 and (-D + 0.2 < q.y < -D + 0.27 or -D + 0.33 < q.y < -D + 0.37), 0xffffff)
    p.paint_fn(lambda q, n: q.z > 0.09 and -D + 0.05 < q.y < -D + 0.1, 0xff8a3d)
    p.layer('rail', base=CHROME, target_faces=700, voxel=0.01)
    p.tube([(-W - 0.12, 0.0, -0.16), (-W - 0.12, 0.0, 0.0), (W + 0.12, 0.0, 0.0), (W + 0.12, 0.0, -0.16)], 0.03, rseg=10)
    for s in (-1, 1):
        p.cyl((s * (W + 0.12), 0.0, -0.18), 0.07, 0.04, rot=(90, 0, 0), bevel=0.015, seg=16)
    p.layer('skin')
    p.bone('body', (0, -D, 0), (0, 0.1, 0))
    p.extras['outline'] = 0.018
    p.build()


# ---------------- fridge ----------------
def fridge():
    p = SProp('prop_k_fridge', base=0x9ed8f0, voxel=0.024, target_faces=4200)
    W, D, H = 0.95, 0.75, 4.2
    FZ = D - 0.2          # the cabinet's front opening plane (the door sits in front of it)
    wall = 0.12
    # the hollow cabinet: back, sides, top (domed), bottom
    p.box((0, H / 2, -D + wall / 2 + 0.02), (W, H / 2 - 0.02, wall / 2 + 0.02), bevel=0.08)
    for s in (-1, 1):
        p.box((s * (W - wall / 2), H / 2, (FZ - D) / 2), (wall / 2, H / 2 - 0.02, (FZ + D) / 2), bevel=0.08)
    p.box((0, H - 0.18, (FZ - D) / 2), (W, 0.18, (FZ + D) / 2), bevel=0.16)
    p.box((0, 0.25, (FZ - D) / 2), (W, 0.25, (FZ + D) / 2), bevel=0.08)
    # little feet
    for s in (-1, 1):
        p.cyl((s * 0.7, -0.02, 0.0), 0.09, 0.08, bevel=0.02, seg=12)
    p.paint_fn(lambda q, n: q.y < 0.08, 0x6b8aa0)
    # the inside: pale, with two shelves
    inner = lambda q: abs(q.x) < W - wall + 0.01 and q.z > -D + wall + 0.01 and 0.5 - 0.01 < q.y < H - 0.36 + 0.01
    p.paint_fn(lambda q, n: inner(q), 0xeaf6ff)
    p.layer('shelves', base=0xffffff, voxel=0.014, target_faces=900)
    for y in SHELVES:
        p.box((0, y - 0.04, (FZ - D + wall) / 2 - 0.03), (W - wall - 0.005, 0.04, (FZ + D - wall) / 2 - 0.06), bevel=0.02)
    p.layer('skin')
    # the door: a thick rounded slab in front of the opening, handle on the right
    p.layer('door', base=0x9ed8f0, voxel=0.02, target_faces=1600)
    DZ = FZ + 0.16       # the door slab's back face sits 0.05 in front of the cabinet rim
    p.box((0, H / 2 + 0.02, DZ), (W - 0.02, H / 2 - 0.08, 0.11), bevel=0.1)
    p.paint_fn(lambda q, n: n.z < -0.5, 0xd6eefa)                     # the door's inner face is pale
    p.paint_fn(lambda q, n: n.z > 0.5 and abs(q.y - 3.0) < 0.035, 0x7cc0e0)   # a line between freezer and fridge
    p.layer('handle', base=CHROME, voxel=0.01, target_faces=600)
    p.tube([(-W + 0.32, 3.25, DZ + 0.1), (-W + 0.24, 3.25, DZ + 0.22), (-W + 0.24, 1.75, DZ + 0.22), (-W + 0.32, 1.75, DZ + 0.1)], 0.045, rseg=10)
    p.layer('magnets', base=0xff6b6b, voxel=0.008, target_faces=900)
    for (x, y, c, k) in ((0.45, 3.55, 0xff6b6b, 0), (0.1, 3.45, 0xffd23f, 1), (0.25, 2.2, 0x6bd968, 2), (-0.25, 1.4, 0xb38cff, 3)):
        p.blob((x, y, DZ + 0.12), (0.11, 0.11, 0.05), group='m%d' % k)
    p.paint_fn(lambda q, n: q.y > 3.3 and q.x < 0.3, 0xffd23f)
    p.paint_fn(lambda q, n: q.y > 3.5 and q.x > 0.3, 0xff6b6b)
    p.paint_fn(lambda q, n: 2.0 < q.y < 2.4, 0x6bd968)
    p.paint_fn(lambda q, n: q.y < 1.6, 0xb38cff)
    # a child's drawing (a sun over a house on grass) held up by the yellow magnet: paper, then crisp cut-out shapes
    p.layer('drawing', base=0xffffff, voxel=0.008, target_faces=500)
    PZ = DZ + 0.115
    p.box((0.12, 2.95, PZ), (0.36, 0.42, 0.012), bevel=0.01)
    p.layer('art', base=0xff6b6b, voxel=0.006, target_faces=700)
    p.blob((0.3, 3.18, PZ + 0.015), (0.085, 0.085, 0.01), group='sun')
    p.box((0.04, 2.73, PZ + 0.015), (0.13, 0.11, 0.008), bevel=0.005)
    p.mesh([(-0.13, 2.84, PZ + 0.008), (0.21, 2.84, PZ + 0.008), (0.04, 3.02, PZ + 0.008), (-0.13, 2.84, PZ + 0.024), (0.21, 2.84, PZ + 0.024), (0.04, 3.02, PZ + 0.024)],
           [(0, 1, 2), (3, 5, 4), (0, 3, 4, 1), (1, 4, 5, 2), (2, 5, 3, 0)])
    p.box((0.12, 2.6, PZ + 0.014), (0.33, 0.05, 0.008), bevel=0.005)
    p.paint_fn(lambda q, n: q.y > 3.08, 0xffc531)
    p.paint_fn(lambda q, n: 2.84 <= q.y <= 3.08 and q.x < 0.25, 0x5a8cff)
    p.paint_fn(lambda q, n: q.y < 2.66, 0x6bd968)
    p.layer('skin')
    door = lambda q: q.z > FZ + 0.025
    p.bone('body', (0, 0, -0.3), (0, H, -0.3), region=lambda q: not door(q))
    p.bone('door', (W - 0.02, 0.2, DZ), (W - 0.02, H - 0.2, DZ), parent='body', region=door)
    p.extras['outline'] = 0.024
    p.build()


# ---------------- board ----------------
def board():
    p = SProp('prop_k_board', base=0xe6b37a, voxel=0.014, target_faces=1400)
    L, Wd, H = 0.85, 0.5, 0.1
    poly = rounded([(-L, -Wd), (L, -Wd), (L, -0.16), (L + 0.32, -0.12), (L + 0.32, 0.12), (L, 0.16), (L, Wd), (-L, Wd)], 0.1, n=4, closed=True)
    p.prism(poly, 0.0, H, bevel=0.03, axis='y')
    p.paint_fn(lambda q, n: n.y < 0.6, 0xcf965a)
    p.paint_fn(lambda q, n: n.y > 0.6 and math.hypot(q.x - (L + 0.18), q.z) < 0.065, 0x9a6a3a)   # the hanging hole
    p.paint_fn(lambda q, n: n.y > 0.6 and q.x < L and int((q.z + 1) / 0.2) % 2 == 0 and abs(q.z) < Wd - 0.06, 0xdfab70)
    p.bone('body', (0, 0, 0), (0, H, 0))
    p.extras['outline'] = 0.018
    p.build()


# ---------------- divided plates ----------------
def plate(name, R, sections):
    """sections: list of (test(x, z) -> bool, floor colour, print polygon or None, print colour, print centre)"""
    p = Prop(name, base=0xfffbf4, target_faces=3000, voxel=0.012, smooth=2)
    p.quadriflow = False
    p.lathe(rounded([(0.0, 0.02), (R * 0.62, 0.0), (R * 0.8, 0.04), (R, 0.15), (R, 0.18), (R * 0.95, 0.19), (R * 0.76, 0.075), (0.0, 0.07)], 0.03, n=3), seg=72)
    p.paint_fn(lambda q, n: n.y < -0.3, 0xe8e2d8)
    for test, col, poly, pcol, (cx, cz) in sections:
        p.paint_fn(lambda q, n, test=test: n.y > 0.85 and q.y < 0.1 and math.hypot(q.x, q.z) < R * 0.75 and test(q.x, q.z), col)
        if poly:
            p.paint_fn(lambda q, n, poly=poly, cx=cx, cz=cz: n.y > 0.85 and q.y < 0.1 and inside(poly, q.x - cx, -(q.z - cz)), pcol)
    return p


def dividers(p, R, lines):
    p.layer('divider', base=0xffffff, target_faces=900, voxel=0.01)
    for a, b in lines:
        p.tube([a, b], 0.05, rseg=10)
    p.layer('skin')


def strawberry_poly(s):
    pts = []
    for i in range(24):
        a = i / 24 * math.tau
        x = math.sin(a) * 0.5 * (1 - 0.35 * max(0, -math.cos(a)))
        y = -math.cos(a) * 0.6 if math.cos(a) > 0 else -math.cos(a) * 0.45
        pts.append((x * s, (y - 0.05) * s))
    return pts


def carrot_poly(s):
    return [(x * s, y * s) for x, y in [(0.0, -0.62), (0.2, 0.25), (0.15, 0.4), (0.35, 0.65), (0.08, 0.5), (0.0, 0.72), (-0.08, 0.5), (-0.35, 0.65), (-0.15, 0.4), (-0.2, 0.25)]]


def bread_poly(s):
    out = [(-0.45, -0.5), (0.45, -0.5), (0.45, 0.2)]
    out += [(0.25 * math.cos(a) + (0.2 if a < math.pi / 2 else -0.2) * 1.0, 0.3 + 0.28 * math.sin(a)) for a in [i / 12 * math.pi for i in range(13)]]
    out += [(-0.45, 0.2)]
    return [(x * s, y * s) for x, y in out]


def bottle_poly(s):
    return [(x * s, y * s) for x, y in [(-0.3, -0.6), (0.3, -0.6), (0.3, 0.15), (0.13, 0.35), (0.13, 0.6), (-0.13, 0.6), (-0.13, 0.35), (-0.3, 0.15)]]


def plate2():
    R = 1.05
    PINK, PINK_D, GRN, GRN_D = 0xffc2d3, 0xff95b3, 0xc8eeae, 0x98d873
    p = plate('prop_k_plate2', R, [
        (lambda x, z: x < 0, PINK, strawberry_poly(0.5), PINK_D, (-0.4, 0.0)),
        (lambda x, z: x >= 0, GRN, carrot_poly(0.5), GRN_D, (0.4, 0.0))])
    dividers(p, R, [((0, 0.1, -R * 0.78), (0, 0.1, R * 0.78))])
    p.bone('body', (0, 0, 0), (0, 0.2, 0))
    p.extras['outline'] = 0.02
    p.build()


def plate4():
    R = 1.25
    sec = [
        (lambda x, z: x < 0 and z < 0, 0xffc2d3, strawberry_poly(0.42), 0xff95b3, (-0.42, -0.42)),
        (lambda x, z: x >= 0 and z < 0, 0xc8eeae, carrot_poly(0.42), 0x98d873, (0.42, -0.42)),
        (lambda x, z: x < 0 and z >= 0, 0xffe39a, bread_poly(0.42), 0xffc94a, (-0.42, 0.42)),
        (lambda x, z: x >= 0 and z >= 0, 0xc4e2ff, bottle_poly(0.44), 0x8cc2ff, (0.42, 0.42)),
    ]
    p = plate('prop_k_plate4', R, sec)
    dividers(p, R, [((0, 0.1, -R * 0.78), (0, 0.1, R * 0.78)), ((-R * 0.78, 0.1, 0), (R * 0.78, 0.1, 0))])
    p.bone('body', (0, 0, 0), (0, 0.2, 0))
    p.extras['outline'] = 0.02
    p.build()


# ---------------- canisters for the shelf ----------------
def jars():
    p = Prop('prop_k_jars', base=0xfffaf2, target_faces=2400, voxel=0.012, smooth=3)
    J = [(-0.75, 0.62, 0.26, 0xff9ec4), (0.0, 0.85, 0.3, 0x8ed6c0), (0.72, 0.5, 0.24, 0xffd23f)]
    for x, h, r, c in J:
        p.lathe(rounded([(0, 0), (r, 0), (r, h), (0, h)], 0.06, n=3), pos=(x, 0, 0), seg=32)
    p.paint_fn(lambda q, n: n.y < -0.6, 0xe9e2d6)
    for k, (x, h, r, c) in enumerate(J):
        p.layer('lid%d' % k, base=c, target_faces=500, voxel=0.01)
        p.cyl((x, h - 0.02, 0), r + 0.03, 0.12, bevel=0.04, seg=28)
        p.blob((x, h + 0.14, 0), (0.07, 0.06, 0.07), group='knob%d' % k)
        p.layer('label%d' % k, base=c, target_faces=300, voxel=0.006)
        y0 = h * 0.45
        p.lathe(rounded([(r - 0.004, y0 - 0.11), (r + 0.014, y0 - 0.11), (r + 0.014, y0 + 0.11), (r - 0.004, y0 + 0.11)], 0.01, n=2, closed=True), pos=(x, 0, 0), closed=True, seg=24, a0=-0.62, a1=0.62)
        p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 0.9, 0))
    p.extras['outline'] = 0.02
    p.build()


MODELS = dict(prop_k_jars=jars, prop_k_counter=counter, prop_k_tap=tap, prop_k_soap=soap, prop_k_towel=towel, prop_k_fridge=fridge,
              prop_k_board=board, prop_k_plate2=plate2, prop_k_plate4=plate4)
for name, fn in MODELS.items():
    if not ONLY or name in ONLY:
        fn()
