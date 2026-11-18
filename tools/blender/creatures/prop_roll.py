"""Roll & push (World 5, the building site): the wooden toy track, its pieces, the hoglet and the nest.
One script, many models (ONLY=prop_rl_box,prop_rl_ramp tools/blender/build.sh prop_roll builds a subset).
Game space: x right, y up, +z toward the camera. Units: one track column is 1 wide, one step is 0.4 tall.
  prop_rl_column    one track column (0.99 x 3.2 x 1.4), origin = middle of its TOP (the groove floor, y 0); two low rails
                    along the top edges (z +-0.66, 0.06 high), step lines every 0.4 down the faces. Light wood: TINTABLE.
  prop_rl_slope     the wedge cap for a slope column: 0.4 high at its left edge (x -0.5) down to 0 at its right edge,
                    rails following the slope. Origin = middle of its bottom (sits on a column one step lower). TINTABLE.
  prop_rl_lifttop   a purple lift cap: the top 0.3 of a column (origin = its top middle) with rails and two white arrows.
  prop_rl_plinth    the long table base the columns rise out of: 11.6 x 0.8 x 2.0 (top at y 0, front face z 1.0), one
                    long slot x -6.02..5.02, z +-0.71; a shallow round socket on the front under every column.
  prop_rl_log       a hollow log lying along x (1.4 long, 1.3 across, mouth at +x), dark inside, closed at the back,
                    moss on top and one leaf. Origin = bottom middle.
  prop_rl_chute     the slide from the last column (top lip at (0, 0.4)) curving down into the nest (end (1.15, -0.78)).
  prop_rl_nest      the nest: a bench 6.1 x 2.7 with three matted tiers (tops at y 0.25, 0.75, 1.25; rows at z 0,
                    -0.9, -1.8; y 0 = the ground), a fat twig rim round it (open at the front-left where the chute comes in).
  prop_rl_cushion   a round dished leaf cushion r 0.4 (layer cush is TINTABLE white).
  prop_rl_pop       the yellow tap block 0.9 x 1.0 x 1.18 with a white ring on its front. Origin = bottom middle.
  prop_rl_plank     the yellow bridge plank lying along +x from its hinge (x 0..2.3, y -0.08..0.06, z +-0.55); origin = the
                    axis of the round hinge barrel (r 0.08) at x 0; a white ring on top. Stand it up with rotation.z = PI/2.
  prop_rl_box       the blue push box 0.96 x 0.8 x 1.2 with white double chevrons. Origin = bottom middle.
  prop_rl_ramp      the blue push ramp: a wedge 1.0 long, 0 at its left up to 0.4 at its right, 1.2 deep, chevrons.
  prop_rl_cart      the blue cart body 0.96 x 0.6 on a 0.2 chassis (total 0.8, flat top), no wheels. Origin = bottom.
  prop_rl_wheel     one cart wheel r 0.11 (axle along z), origin = its centre.
  prop_rl_doorframe a little gatehouse over the track: four posts (z +-0.62..0.7) and a hollow hood 0.95..2.05 high
                    the door leaf slides up into. Origin = bottom middle (on the track).
  prop_rl_door      the door leaf 0.3 x 0.95 x 1.2 (TINTABLE white) with a round window on its front. Origin = bottom.
  prop_rl_button    a dome button facing +z: ring base r 0.3 (layer ring) and the dome r 0.26 (TINTABLE skin), layer
                    arrow = a white up/down arrow on the dome (shown for lift buttons only). Origin = on the wall face.
  prop_rl_cable     a flat cable strip 1.0 long (along y, from 0 up to 1), 0.08 wide, facing +z. TINTABLE.
  prop_rl_seesaw    the see-saw plank 3.0 x 0.12 x 1.1; origin = the middle of its TOP surface (the pivot); barrel under.
  prop_rl_pivot     the see-saw post 0.3 wide, 1.1 tall, with a cradle on top (barrel centre at y 1.085).
  prop_rl_hatch     a little red hatch door 0.5 x 0.4 hinged at its left edge (origin = hinge middle), layer hole = the
                    dark recess behind it.
  prop_rl_hogball   the hoglet's rolling body: a soft ball r 0.33 bristling with three rings of short rounded quills
                    (tips at r 0.42) round the z axis, TINTABLE (quills alternate two shades), cream pole caps.
  prop_rl_hogface   the hoglet's upright face cap: a shallow cream dome r 0.27 facing +z, little pointed snout, pink
                    nose, two round tan ears; the code face is mounted on it; anchor 'head' on top.
"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded, circle_poly
from skit import SProp
from mathutils import Vector

ONLY = [s for s in os.environ.get('ONLY', '').split(',') if s]
want = lambda n: not ONLY or n in ONLY
TAU = math.tau
WHITE = 0xffffff
WOOD, WOOD_L, WOOD_D = 0xf6e2bf, 0xfbeed5, 0xd9bb8c
YEL, YEL_D = 0xffcf2e, 0xf2b31b
BLUE, BLUE_D, BLUE_L = 0x3f8cff, 0x2f74e0, 0x8fc0ff
INKD = 0x3b2a33


def done(p, h, outline=0.022, tint=None):
    if not any(b[0] == 'body' for b in p.bones):
        p.bone('body', (0, 0, 0), (0, max(0.2, h), 0))
    if tint is not None:
        p.extras['argMode'] = 'tint'
        p.extras['argDefault'] = tint
    p.extras['outline'] = outline
    p.build()


def rails(p, x0, y0, x1, y1, h=0.06, zc=0.66, w=0.03):
    """two low rails along the top edge from (x0, y0) to (x1, y1)"""
    for s in (-1, 1):
        p.prism([(x0, y0 - 0.01), (x1, y1 - 0.01), (x1, y1 + h), (x0, y0 + h)], s * zc - w, s * zc + w, bevel=0.02)


def step_lines(p, x0, x1, ytop, ybot, colour):
    """thin darker bands every 0.4 down the front and back faces (they show the steps)"""
    k = 1
    while ytop - 0.4 * k > ybot + 0.05:
        y = ytop - 0.4 * k
        p.paint_fn(lambda q, n, y=y: abs(q.y - y) < 0.022 and (abs(n.z) > 0.7 or abs(n.x) > 0.7), colour)
        k += 1


# ---------------- track ----------------
def column():
    p = SProp('prop_rl_column', base=WOOD, target_faces=600)
    p.box((0, -1.6, 0), (0.495, 1.6, 0.7), bevel=0.025)
    p.layers['skin']['edge'] = 0.5
    # the rails a little paler, as their own layer (no painted borders on coarse faces: those drew dashed ink)
    p.layer('rails', base=WOOD_L)
    rails(p, -0.495, 0, 0.495, 0)
    # a thin groove every step (0.4) on the front face, its own layer (drawn without ink)
    p.layer('lines', base=WOOD_D)
    for k in range(1, 8):
        p.box((0, -0.4 * k, 0.703), (0.47, 0.011, 0.006), bevel=0.004)
    p.layer('skin')
    done(p, 0.1, 0.02, tint=0xffffff)


def slope():
    p = SProp('prop_rl_slope', base=WOOD, target_faces=500)
    p.prism([(-0.495, -0.02), (0.495, -0.02), (0.495, 0.0), (-0.495, 0.4)], -0.7, 0.7, bevel=0.02)
    p.layer('rails', base=WOOD_L)
    rails(p, -0.495, 0.4, 0.495, 0.0)
    p.layer('skin')
    done(p, 0.4, 0.02, tint=0xffffff)


def lifttop():
    PUR, PUR_D = 0xa064f0, 0x8a4ee0
    p = SProp('prop_rl_lifttop', base=PUR, target_faces=700)
    p.box((0, -0.15, 0), (0.5, 0.15, 0.71), bevel=0.03)
    rails(p, -0.5, 0, 0.5, 0, zc=0.665)
    p.paint_fn(lambda q, n: q.y < -0.27, PUR_D)
    p.layer('arrows', base=WHITE)
    for s in (-1, 1):
        x = s * 0.24
        if s < 0:    # up arrow (a fat head)
            pts = [(x - 0.17, -0.25), (x, -0.04), (x + 0.17, -0.25)]
        else:        # down arrow
            pts = [(x - 0.17, -0.04), (x, -0.26), (x + 0.17, -0.04)]
        p.prism(pts, 0.705, 0.745, bevel=0.012)
    p.layer('skin')
    done(p, 0.3, 0.02)


def plinth():
    WAL, WAL_D, SOCK = 0xb5815a, 0x9c6c48, 0x7c5238
    p = SProp('prop_rl_plinth', base=WAL, target_faces=2400)
    X0, X1, Z = -6.32, 5.32, 1.0
    SX0, SX1, SZ = -6.02, 5.02, 0.71
    # four walls round the long slot (the columns fill the slot)
    p.box(((X0 + X1) / 2, -0.4, (Z + SZ) / 2), ((X1 - X0) / 2, 0.4, (Z - SZ) / 2), bevel=0.05)
    p.box(((X0 + X1) / 2, -0.4, -(Z + SZ) / 2), ((X1 - X0) / 2, 0.4, (Z - SZ) / 2), bevel=0.05)
    p.box(((X0 + SX0) / 2, -0.4, 0), ((SX0 - X0) / 2, 0.4, SZ + 0.01), bevel=0.04)
    p.box(((X1 + SX1) / 2, -0.4, 0), ((X1 - SX1) / 2, 0.4, SZ + 0.01), bevel=0.04)
    # a darker band along the foot (its own layer: painted borders broke into dashes)
    p.layer('foot', base=WAL_D)
    p.box(((X0 + X1) / 2, -0.745, Z + 0.004), ((X1 - X0) / 2 - 0.06, 0.045, 0.01), bevel=0.008)
    p.layer('skin')
    # a shallow socket ring under every column (buttons sit in them)
    p.layer('sockets', base=SOCK)
    for i in range(11):
        x = -5.5 + i
        p.ring((x, -0.4, Z + 0.004), 0.31, 0.03, rot=(90, 0, 0), seg=28, rseg=6)
    p.layer('skin')
    done(p, 0.8, 0.026)


def log():
    BARK, BARK_D, RING, INSIDE, MOSS, LEAF = 0x9a6a44, 0x7a5236, 0xe9c48e, 0x3a2620, 0x7cc35a, 0x5fb04a
    p = SProp('prop_rl_log', hard=False, base=BARK, target_faces=2600, voxel=0.014)
    R0, R1, L = 0.66, 0.52, 1.4
    cy = R0
    # a thick tube along x (lathe a ring section, then turned to lie along x), with a slight bevelled mouth
    prof = rounded([(R1, -L / 2), (R0, -L / 2), (R0, L / 2), (R1, L / 2)], 0.05, n=3, closed=True)
    p.lathe(prof, pos=(0, cy, 0), rot=(0, 0, -90), seg=40, closed=True)
    # the back is closed with a dark disc set inside
    p.cyl((-L / 2 + 0.06, cy, 0), R1 + 0.01, 0.08, rot=(0, 0, -90), bevel=0.02, seg=32)
    # bark ridges: darker vertical bands
    p.paint_fn(lambda q, n: math.hypot(q.y - cy, q.z) > R0 - 0.03 and abs(math.sin(math.atan2(q.z, q.y - cy) * 9)) < 0.18, BARK_D)
    # the cut end at the mouth shows pale wood rings; inside is dark
    p.paint_fn(lambda q, n: q.x > L / 2 - 0.03 and n.x > 0.5, RING)
    p.paint_fn(lambda q, n: math.hypot(q.y - cy, q.z) < R1 + 0.02 and q.x < L / 2 - 0.03, INSIDE)
    p.paint_fn(lambda q, n: q.x < -L / 2 + 0.03 and n.x < -0.5 and math.hypot(q.y - cy, q.z) < R0 - 0.06, RING)
    # moss on top and one leaf
    p.layer('moss', base=MOSS, target_faces=600, voxel=0.012)
    for x, z, s in [(-0.3, -0.05, 0.22), (0.05, 0.1, 0.18), (-0.5, 0.15, 0.14)]:
        p.blob((x, cy + R0 - 0.02, z), (s, 0.07, s * 0.8), group='m')
    p.layer('leaf', base=LEAF, target_faces=300, voxel=0.008)
    p.blob((0.25, cy + R0 + 0.05, 0.12), (0.16, 0.025, 0.08), rot=(0, 30, 8), group='lf')
    # two round windows on the front where the waiting babies peek out (dark inside, a pale cut rim)
    p.layer('win', base=INSIDE, target_faces=300, voxel=0.008)
    for wx in (-0.36, 0.26):
        p.cyl((wx, cy, 0.45), 0.25, 0.245, rot=(90, 0, 0), bevel=0.01, seg=32)
    p.layer('winrim', base=RING, target_faces=500, voxel=0.008)
    for wx in (-0.36, 0.26):
        p.ring((wx, cy, 0.672), 0.262, 0.032, rot=(90, 0, 0), seg=40, rseg=8)
    p.layer('skin')
    done(p, 1.3, 0.024)


def chute():
    p = SProp('prop_rl_chute', base=WOOD, target_faces=1800)
    # the slide: from the last column's lip (0, 0.4) curving down to (1.15, -0.45), a trough 1.2 wide with side walls
    pts = []
    for i in range(15):
        t = i / 14
        pts.append((1.15 * t, 0.4 - 0.85 * (3 * t * t - 2 * t ** 3)))
    p.prism(pts + [(x, y - 0.1) for x, y in pts][::-1], -0.6, 0.6, bevel=0.025)
    for s_ in (-1, 1):
        wall = [(x, y + 0.14) for x, y in pts] + [(x, y - 0.1) for x, y in pts][::-1]
        z0, z1 = (0.56, 0.66) if s_ > 0 else (-0.66, -0.56)
        p.prism(wall, z0, z1, bevel=0.025)
    # a post under the low end, down to the ground (track -0.8)
    p.box((0.98, -0.66, 0), (0.07, 0.13, 0.45), bevel=0.03)
    p.paint_fn(lambda q, n: abs(q.z) > 0.55 and n.y < 0.6, WOOD_D)
    p.paint_fn(lambda q, n: abs(q.z) > 0.55 and n.y >= 0.6, WOOD_L)
    done(p, 0.5, 0.022, tint=0xffffff)


def nest():
    """A chunky toy-set bench: three rounded wooden steps (one per row), each topped with a soft green mat, a gentle
    ramp lane up the left end (the landing pad at its foot), and fat rounded log rails at the sides and back.
    No painted patterns: every colour is its own clean layer, so the ink only ever draws the silhouettes."""
    WOOD_N, RAIL, MAT, LANE = 0xd9a066, 0xa8683e, 0x8fd46a, 0x9edb78
    p = SProp('prop_rl_nest', base=WOOD_N, target_faces=3000)
    X0, X1, XL = -2.45, 3.68, -1.37            # outer x (five cushions a row, 1.0 apart); the lane runs from X0 to XL
    tiers = [(0.45, 0.25), (-0.45, 0.75), (-1.35, 1.25)]  # (front edge z, top y): each row half a ball higher, so
    ZB = -2.25                                            # every face shows over the row in front
    for zf, ty in tiers:
        p.box(((XL + X1) / 2, ty / 2, (zf + ZB) / 2), ((X1 - XL) / 2, ty / 2, (zf - ZB) / 2), bevel=0.07)
    # the lane: flat at the front (the pad), a gentle ramp up through the middle row's height, flat at the back
    lane = [(0.45, 0.0), (0.45, 0.25), (-0.2, 0.25), (-1.7, 1.25), (ZB, 1.25), (ZB, 0.0)]
    p.prism([(z, y) for z, y in lane][::-1], X0, XL - 0.01, bevel=0.06, axis='x')
    # soft mats: one rounded slab on each step and a ramped one on the lane
    p.layer('mat', base=MAT)
    for zf, ty in tiers:
        p.box(((XL + X1) / 2 + 0.02, ty + 0.02, (zf + ZB) / 2 - 0.02), ((X1 - XL) / 2 - 0.1, 0.03, (zf - ZB) / 2 - 0.1), bevel=0.028)
    p.layer('lane', base=LANE)
    top = [(0.37, 0.25), (-0.2, 0.25), (-1.7, 1.25), (ZB + 0.08, 1.25)]
    poly = [(z, y - 0.01) for z, y in top] + [(z, y + 0.045) for z, y in top][::-1]
    p.prism(poly[::-1], X0 + 0.1, XL - 0.09, bevel=0.02, axis='x')
    # fat rounded log rails: right side, back, and the back half of the left side (the front stays open)
    p.layer('rail', base=RAIL)
    R_ = 0.11
    p.tube([(X1 - 0.02, 0.33, 0.42), (X1 - 0.02, 0.33, -0.38), (X1 - 0.02, 0.83, -0.58), (X1 - 0.02, 0.83, -1.28), (X1 - 0.02, 1.33, -1.48), (X1 - 0.02, 1.33, ZB + 0.02)], R_, rseg=14)
    p.tube([(X1 - 0.02, 1.33, ZB + 0.02), (X0 + 0.02, 1.33, ZB + 0.02)], R_, rseg=14)
    p.tube([(X0 + 0.02, 1.33, ZB + 0.02), (X0 + 0.02, 1.33, -1.75)], R_, rseg=14)
    for x, y, z in [(X1 - 0.02, 0.33, 0.42), (X1 - 0.02, 1.33, ZB + 0.02), (X0 + 0.02, 1.33, ZB + 0.02), (X0 + 0.02, 1.33, -1.75)]:
        p.blob((x, y, z), (R_ * 1.12, R_ * 1.12, R_ * 1.12), group='k%d_%d' % (int(x * 10), int(z * 10)))
    p.layer('skin')
    done(p, 0.95, 0.024)


def cushion():
    """A plump nest cup: a fat rounded rim (skin, TINTABLE) round a soft lighter seat (layer seat). r 0.42, 0.13 tall."""
    p = SProp('prop_rl_cushion', hard=False, base=0xffffff, target_faces=900, voxel=0.008)
    p.lathe(rounded([(0.0, 0.0), (0.35, 0.0), (0.405, 0.035), (0.415, 0.08), (0.39, 0.125), (0.34, 0.135), (0.29, 0.11), (0.27, 0.07), (0.0, 0.06)], 0.03, n=4), seg=48)
    p.layer('seat', base=0xffffff, target_faces=500, voxel=0.008)
    p.lathe(rounded([(0, 0.035), (0.29, 0.035), (0.3, 0.06), (0.22, 0.08), (0, 0.085)], 0.03, n=4), seg=40)
    p.layer('skin')
    done(p, 0.13, 0.016, tint=0x9fd87a)


# ---------------- pieces ----------------
def chevrons(p, z, y, scale=1.0, both=True, dx=0.22):
    """white double chevrons << >> on a front face at z (stickers in the current layer)"""
    w, h, t = 0.075 * scale, 0.13 * scale, 0.045 * scale
    for side in ((-1, 1) if both else (1,)):
        for k in (0, 1):
            cx = side * (dx + k * 0.1 * scale)
            tip = cx + side * w
            pts = [(cx - side * 0.0, y + h), (tip, y), (cx - side * 0.0, y - h), (cx - side * t, y - h), (tip - side * t, y), (cx - side * t, y + h)]
            if side < 0:
                pts = pts[::-1]
            p.prism(pts, z - 0.005, z + 0.025, bevel=0.01)


def pop():
    p = SProp('prop_rl_pop', base=YEL, target_faces=900)
    p.box((0, 0.5, 0), (0.45, 0.5, 0.59), bevel=0.11)
    p.paint_fn(lambda q, n: q.y < 0.05, YEL_D)
    p.layer('ring', base=WHITE)
    p.ring((0, 0.5, 0.592), 0.2, 0.035, rot=(90, 0, 0), seg=32, rseg=8)
    p.layer('skin')
    done(p, 1.0, 0.024)


def plank():
    p = SProp('prop_rl_plank', base=YEL, target_faces=1100)
    p.box((1.15, -0.01, 0), (1.15, 0.07, 0.55), bevel=0.04)
    p.cyl((0, 0.0, -0.55), 0.08, 1.1, rot=(90, 0, 0), bevel=0.02, seg=24)
    # the front flap: under the deck along the front edge, over the gap only (x 0.1..1.0), 0.36 deep
    p.box((0.55, -0.24, 0.47), (0.45, 0.2, 0.07), bevel=0.05)
    p.paint_fn(lambda q, n: math.hypot(q.x, q.y) < 0.085, YEL_D)
    p.layer('ring', base=WHITE)
    p.ring((1.5, 0.062, 0.0), 0.18, 0.03, seg=32, rseg=8)
    p.ring((0.55, -0.24, 0.545), 0.14, 0.03, rot=(90, 0, 0), seg=32, rseg=8)
    p.layer('skin')
    done(p, 0.2, 0.02)


def box():
    p = SProp('prop_rl_box', base=BLUE, target_faces=900)
    p.box((0, 0.4, 0), (0.48, 0.4, 0.6), bevel=0.09)
    p.paint_fn(lambda q, n: q.y < 0.04, BLUE_D)
    p.layer('chev', base=WHITE)
    chevrons(p, 0.6, 0.4)
    p.layer('skin')
    done(p, 0.8, 0.024)


def ramp():
    p = SProp('prop_rl_ramp', base=BLUE, target_faces=900)
    p.prism([(-0.5, 0.0), (0.5, 0.0), (0.5, 0.4), (-0.5, 0.025)], -0.6, 0.6, bevel=0.03)
    p.paint_fn(lambda q, n: q.y < 0.02, BLUE_D)
    p.layer('rails', base=BLUE_L)
    for s in (-1, 1):
        p.prism([(-0.45, 0.03), (0.47, 0.39), (0.47, 0.43), (-0.45, 0.07)], s * 0.55 - 0.025, s * 0.55 + 0.025, bevel=0.012)
    p.layer('chev', base=WHITE)
    chevrons(p, 0.6, 0.15, scale=0.7, dx=0.08)
    p.layer('skin')
    done(p, 0.4, 0.022)


def cart():
    """A wooden toy cart (it is not pushed: it rolls by itself), so it is wood, not blue."""
    p = SProp('prop_rl_cart', base=WOOD, target_faces=1400)
    p.box((0, 0.5, 0), (0.48, 0.27, 0.52), bevel=0.08)                 # the tub (y 0.23..0.77)
    p.layer('rim', base=WOOD_D)
    for s in (-1, 1):                                                 # a rim along both sides (the lane stays open)
        p.box((0, 0.76, s * 0.53), (0.48, 0.04, 0.05), bevel=0.025)
    p.box((0, 0.41, 0.525), (0.46, 0.025, 0.012), bevel=0.008)         # a plank line on the front
    p.layer('chassis', base=WOOD_D)
    p.box((0, 0.2, 0), (0.44, 0.045, 0.5), bevel=0.02)
    for x in (-0.3, 0.3):
        p.cyl((x, 0.16, -0.62), 0.035, 1.24, rot=(90, 0, 0), bevel=0.0, seg=10)
    p.layer('skin')
    done(p, 0.8, 0.022)


def wheel():
    p = SProp('prop_rl_wheel', base=0xff5a4a, target_faces=600)
    p.cyl((0, 0, -0.05), 0.16, 0.1, rot=(90, 0, 0), bevel=0.035, seg=32)
    p.layer('hub', base=0xffd23f)
    p.cyl((0, 0, 0.045), 0.06, 0.025, rot=(90, 0, 0), bevel=0.01, seg=20)
    p.layer('skin')
    done(p, 0.32, 0.014)


def doorframe():
    p = SProp('prop_rl_doorframe', base=WOOD, target_faces=1600)
    H0, H1 = 0.95, 2.05
    for zs in (-1, 1):
        for xs in (-1, 1):
            p.box((xs * 0.21, H0 / 2, zs * 0.66), (0.04, H0 / 2, 0.04), bevel=0.015)
    # the hollow hood: front and back walls, two side walls and a roof
    for zs in (-1, 1):
        p.box((0, (H0 + H1) / 2, zs * 0.66), (0.25, (H1 - H0) / 2, 0.04), bevel=0.03)
    for xs in (-1, 1):
        p.box((xs * 0.21, (H0 + H1) / 2, 0), (0.04, (H1 - H0) / 2, 0.62), bevel=0.02)
    p.box((0, H1 - 0.04, 0), (0.25, 0.04, 0.7), bevel=0.03)
    # a little peaked roof
    p.prism([(-0.32, H1 - 0.02), (0.32, H1 - 0.02), (0.0, H1 + 0.22)], -0.74, 0.74, bevel=0.03)
    p.paint_fn(lambda q, n: q.y > H1 - 0.01, 0xe0864a)
    # the hood front reads as a framed panel
    p.paint_fn(lambda q, n: abs(n.z) > 0.7 and H0 < q.y < H1 - 0.02 and (abs(q.x) > 0.19 or q.y < H0 + 0.06 or q.y > H1 - 0.1), WOOD_D)
    p.paint_fn(lambda q, n: q.y < H0 and abs(q.z) > 0.6, WOOD_D)
    done(p, H1 + 0.2, 0.022, tint=0xffffff)


def door():
    p = SProp('prop_rl_door', base=0xffffff, target_faces=900)
    p.box((0, 0.475, 0), (0.15, 0.475, 0.6), bevel=0.05)
    p.paint_fn(lambda q, n: q.y < 0.04, 0xd8d8d8)
    p.layer('window', base=0xfff3c8)
    p.cyl((0, 0.58, 0.58), 0.085, 0.04, rot=(90, 0, 0), bevel=0.01, seg=24)
    p.layer('frame', base=WHITE)
    p.ring((0, 0.58, 0.61), 0.1, 0.022, rot=(90, 0, 0), seg=28, rseg=6)
    p.layer('skin')
    done(p, 0.95, 0.02, tint=0xff4f4f)


def button():
    p = SProp('prop_rl_button', hard=False, base=0xffffff, target_faces=900, voxel=0.008)
    # the dome (skin, tintable): a soft hemisphere facing +z
    prof = [(0, 0.0), (0.24, 0.0)] + [(0.24 * math.cos(a), 0.13 * math.sin(a)) for a in [math.pi / 2 * k / 8 for k in range(1, 9)]]
    prof[-1] = (0, 0.13)
    p.lathe(prof, pos=(0, 0, 0.05), rot=(90, 0, 0), seg=36)
    p.paint_fn(lambda q, n: q.z < 0.07, 0xd0d0d0)
    p.layer('ring', base=0xe8e2d6, target_faces=500)
    p.ring((0, 0, 0.04), 0.27, 0.04, rot=(90, 0, 0), seg=36, rseg=8)
    p.cyl((0, 0, 0.0), 0.29, 0.05, rot=(90, 0, 0), bevel=0.015, seg=36)
    p.layer('arrow', base=WHITE, target_faces=300)
    for s in (-1, 1):
        y = s * 0.035
        pts = [(-0.1, y), (0.0, y + s * 0.11), (0.1, y)]
        if s < 0:
            pts = pts[::-1]
        zs = 0.05 + 0.13 * math.sqrt(max(0.0, 1 - (0.11 / 0.24) ** 2))
        p.prism(pts, zs - 0.03, zs + 0.03, bevel=0.012)
    p.layer('skin')
    done(p, 0.2, 0.016, tint=0xff4f4f)


def cable():
    p = SProp('prop_rl_cable', base=WHITE, target_faces=60)
    p.box((0, 0.5, 0.01), (0.04, 0.5, 0.012), bevel=0.01)
    done(p, 1.0, 0.0, tint=0xff4f4f)


def seesaw():
    p = SProp('prop_rl_seesaw', base=0xff9a3d, target_faces=1000)
    p.box((0, -0.06, 0), (1.5, 0.06, 0.55), bevel=0.04)
    p.cyl((0, -0.22, -0.56), 0.1, 1.12, rot=(90, 0, 0), bevel=0.02, seg=24)
    p.box((0, -0.15, 0), (0.12, 0.04, 0.5), bevel=0.02)
    p.paint_fn(lambda q, n: q.y < -0.11, 0xe07b28)
    p.layer('stripes', base=WHITE)
    for x in (-1.1, 1.1):
        p.box((x, 0.002, 0), (0.06, 0.004, 0.5), bevel=0.003)
    p.layer('skin')
    done(p, 0.3, 0.022)


def pivot():
    """A chunky toy trestle: two splayed legs on a foot board, a cross brace, a top beam and a rounded saddle that
    cradles the see-saw's barrel (barrel centre y 1.085, r 0.1). Origin = bottom middle. TINTABLE wood."""
    p = SProp('prop_rl_pivot', base=WOOD, target_faces=900)
    D = 0.27                                            # half depth (z)
    p.box((0, 0.05, 0), (0.4, 0.05, D + 0.06), bevel=0.04)                              # foot board
    for s in (-1, 1):                                   # splayed legs (an A seen from the front)
        p.prism([(s * 0.36, 0.08), (s * 0.2, 0.08), (s * 0.05, 0.84), (s * 0.17, 0.84)][::s], -D, D, bevel=0.035)
    p.box((0, 0.4, 0), (0.25, 0.04, D - 0.02), bevel=0.025)                             # cross brace
    p.box((0, 0.86, 0), (0.22, 0.06, D), bevel=0.035)                                   # top beam
    # the saddle: a rounded cradle (two fat cheeks and a round seat) the barrel rests in
    p.layer('saddle', base=WOOD_D)
    p.cyl((0, 0.9, -D), 0.1, 2 * D, rot=(90, 0, 0), bevel=0.02, seg=24)
    for s in (-1, 1):
        p.cyl((s * 0.16, 0.99, -D), 0.07, 2 * D, rot=(90, 0, 0), bevel=0.02, seg=20)
    p.layer('skin')
    done(p, 1.1, 0.022, tint=0xffffff)

def hatch():
    p = SProp('prop_rl_hatch', base=0xff5a4a, target_faces=500)
    p.box((0.25, 0, 0.03), (0.24, 0.19, 0.025), bevel=0.02)
    p.cyl((0.42, 0.0, 0.045), 0.035, 0.03, rot=(90, 0, 0), bevel=0.01, seg=12)
    p.paint_fn(lambda q, n: math.hypot(q.x - 0.42, q.y) < 0.045 and q.z > 0.05, 0xffd23f)
    p.layer('hole', base=0x2a1a1c)
    p.box((0.25, 0, 0.004), (0.25, 0.2, 0.006), bevel=0.004)
    p.layer('skin')
    done(p, 0.4, 0.016)


# ---------------- the hoglet ----------------
def hogball():
    p = Prop('prop_rl_hogball', base=0x8a8a8a, target_faces=5200, voxel=0.007, smooth=2)
    p.blob((0, 0, 0), (0.3, 0.3, 0.28), group='core')
    # two neat rings of short rounded cone quills radiating round the z axis (the rolling axis): tips at r 0.42
    rings = [(0.1, 12, 0.0), (-0.1, 12, 0.5)]
    light, dark = [], []
    k = 0
    for zc, n, off in rings:
        for i in range(n):
            a = TAU * (i + off) / n
            d = Vector((math.cos(a), math.sin(a), zc * 1.5)).normalized()
            g = 'q%d' % k
            p.capsule(tuple(d * 0.2), tuple(d * 0.385), 0.09, r2=0.036, group=g)
            (light if (i + (1 if zc < 0 else 0)) % 2 == 0 else dark).append(g)
            k += 1
    p.paint_group(light, 0xffffff)
    p.paint_group(dark, 0xc2c2c2)
    # cream pole caps facing +-z (the face cap sits in front of the +z one)
    p.paint_fn(lambda q, n: abs(q.z) > 0.2 and math.hypot(q.x, q.y) < 0.17, 0xf6dcc0)
    p.extras['argMode'] = 'tint'
    p.extras['argDefault'] = 0x9a6644
    p.bone('body', (0, -0.42, 0), (0, 0.42, 0))
    p.extras['outline'] = 0.014
    p.build()


def hogface():
    CREAM, TAN, PINK, NOSE = 0xffe6c8, 0xf0c49a, 0xffa9b8, 0x4a2f3e
    p = Prop('prop_rl_hogface', base=CREAM, target_faces=1600, voxel=0.006, smooth=2)
    p.blob((0, 0.01, 0.0), (0.245, 0.225, 0.12), group='cap')
    for s_ in (-1, 1):
        p.blob((s_ * 0.11, -0.06, 0.05), (0.085, 0.07, 0.07), group='cap')          # chubby cheeks
    p.blob((0, -0.02, 0.1), (0.06, 0.045, 0.06), group='cap')                          # little pointed snout
    p.blob((0, -0.01, 0.158), (0.03, 0.025, 0.022), group='nose')
    for s_ in (-1, 1):
        p.blob((s_ * 0.16, 0.19, -0.03), (0.07, 0.07, 0.034), rot=(0, 0, s_ * -20), group='ear%d' % s_)
    p.paint('nose', (0, -0.01, 0.162), (0.036, 0.032, 0.03), NOSE)
    for s_ in (-1, 1):
        p.paint('ear', (s_ * 0.16, 0.19, -0.03), (0.08, 0.08, 0.05), TAN, rot=(0, 0, s_ * -20))
        p.paint('earin', (s_ * 0.16, 0.19, 0.01), (0.04, 0.04, 0.03), PINK, only=lambda q: q.z > -0.01)
    p.bone('body', (0, -0.27, 0), (0, 0.27, 0))
    p.face(center=(0, 0.03, -0.08), radius=0.215, bone='body', faceScale=1.0, snap=False, eyeSize=1.3, eyeY=0.24, eyeX=0.43,
           mouthY=-0.05, mouthZ=0.004, cheeks=0)
    p.paint_fn(lambda q, n: n.z > 0.3 and any(math.hypot(q.x - s_ * 0.135, q.y + 0.055) < 0.04 for s_ in (-1, 1)), 0xffb4c0)
    p.anchor('head', (0, 0.235, -0.02), 'body')
    p.extras['outline'] = 0.012
    p.build()


# ---------------- new pieces (Thinkrolls-style) ----------------
def cookie(bitten=False):
    DOUGH, DOUGH_D, CHIP = 0xffc93c, 0xeea62a, 0x6b3f2a     # golden-yellow: a tap piece
    p = Prop('prop_rl_cookie_bit' if bitten else 'prop_rl_cookie', base=DOUGH, target_faces=1400, voxel=0.01, smooth=3)
    # a fat round cookie lying flat (0.96 across, 0.3 thick), puffy edge; origin = middle of its bottom
    p.blob((0, 0.15, 0), (0.48, 0.15, 0.55), group='c')
    if bitten:
        for x, z, r in [(-0.5, 0.18, 0.2), (-0.42, 0.42, 0.17), (-0.36, -0.05, 0.16)]:
            p.blob((x, 0.15, z), (r, 0.3, r), group='c', negative=True)
    p.paint_fn(lambda q, n: q.y < 0.07, DOUGH_D)
    p.layer('chips', base=CHIP, target_faces=500, voxel=0.008)
    for x, z in [(0.2, 0.25), (-0.1, 0.35), (0.25, -0.2), (-0.2, -0.25), (0.02, 0.0), (0.33, 0.05), (-0.05, -0.42), (0.1, 0.45)]:
        if bitten and x < -0.15 and z > 0.0:
            continue
        p.blob((x, 0.29, z), (0.06, 0.03, 0.06), group='ch%d%d' % (int(x * 100), int(z * 100)))
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 0.3, 0))
    p.extras['outline'] = 0.018
    p.build()


def crumb():
    p = Prop('prop_rl_crumb', base=0xe8a957, target_faces=200, voxel=0.006, smooth=2)
    p.blob((0, 0, 0), (0.05, 0.035, 0.045), rot=(10, 20, 30), group='a')
    p.blob((0.025, 0.012, 0.01), (0.03, 0.025, 0.03), group='a')
    p.layer('chips', base=0x6b3f2a, target_faces=120, voxel=0.004)
    p.blob((-0.012, 0.03, 0.02), (0.014, 0.01, 0.014), group='c1')
    p.blob((0.03, 0.03, -0.012), (0.012, 0.009, 0.012), group='c2')
    p.layer('skin')
    p.bone('body', (0, -0.04, 0), (0, 0.04, 0))
    p.extras['outline'] = 0.008
    p.build()


def jelly():
    """A lemon jelly: a soft wobbly dome 0.92 x 0.43 x 1.12 (origin = bottom middle) with gently fluted sides, a paler
    rounded top and one round shine. Yellow, because yellow things are tapped."""
    JEL, JEL_D, TOP, SHINE = 0xffd23f, 0xf0b52a, 0xffe680, 0xfffbe8
    p = SProp('prop_rl_jelly', hard=False, base=JEL, target_faces=1600, voxel=0.01)
    prof = rounded([(0.0, 0.0), (0.44, 0.0), (0.46, 0.05), (0.43, 0.17), (0.45, 0.25), (0.38, 0.35), (0.22, 0.42), (0.0, 0.43)], 0.04, n=4)
    p.lathe(prof, scale=(1.0, 1.22), seg=48)
    p.paint_fn(lambda q, n: q.y < 0.06, JEL_D)
    p.paint_fn(lambda q, n: q.y > 0.36, TOP)
    p.layer('shine', base=SHINE, target_faces=200, voxel=0.006)
    p.blob((-0.17, 0.3, 0.42), (0.075, 0.075, 0.03), rot=(-35, -20, 0), group='sh')
    p.layer('skin')
    done(p, 0.43, 0.02)

def balloon():
    YEL, YEL_D, SHINE, STR = 0xffd23f, 0xf0b52a, 0xfff8d8, 0xb08a6a
    p = SProp('prop_rl_balloon', hard=False, base=YEL, target_faces=1600, voxel=0.01, smooth=3)
    # origin = the bottom end of the string (where it ties on); the balloon floats 0.95 above it
    p.blob((0, 1.3, 0), (0.3, 0.36, 0.3), group='b')
    p.blob((0, 1.08, 0), (0.17, 0.16, 0.17), group='b')
    p.blob((0, 0.95, 0), (0.05, 0.05, 0.05), group='knot')
    p.paint('knot', (0, 0.95, 0), (0.07, 0.06, 0.07), YEL_D)
    p.layer('shine', base=SHINE, target_faces=200, voxel=0.006)
    p.blob((-0.13, 1.42, 0.24), (0.06, 0.1, 0.03), rot=(-15, -28, 20), group='s')
    p.layer('string', base=STR, target_faces=300, voxel=0.006)
    p.tube([(0, 0.95, 0), (0.035, 0.72, 0), (-0.03, 0.47, 0), (0.02, 0.22, 0), (0, 0.0, 0)], 0.018, rseg=8)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 1.66, 0))
    p.extras['outline'] = 0.018
    p.build()


def peg():
    p = SProp('prop_rl_peg', base=WOOD_D, target_faces=300)
    p.cyl((0, 0, 0), 0.045, 0.3, bevel=0.015, seg=16)
    p.blob((0, 0.32, 0), (0.07, 0.06, 0.07), group='k')
    p.bone('body', (0, 0, 0), (0, 0.38, 0))
    p.extras['outline'] = 0.012
    p.build()


def crate():
    p = SProp('prop_rl_crate', base=0x4c96ff, target_faces=1200)
    p.box((0, 0.4, 0), (0.48, 0.4, 0.6), bevel=0.07)
    p.layer('planks', base=0x8cc0ff)
    for y in (0.27, 0.53):
        p.box((0, y, 0.6), (0.44, 0.012, 0.012), bevel=0.006)
    for x in (-0.44, 0.44):
        p.box((x, 0.4, 0.6), (0.012, 0.36, 0.012), bevel=0.006)
    p.layer('chev', base=WHITE)
    chevrons(p, 0.613, 0.4, scale=0.8, dx=0.16)
    p.layer('skin')
    done(p, 0.8, 0.022)


def stone():
    GREY, GREY_D = 0x9ea3ab, 0x7f848d
    p = SProp('prop_rl_stone', hard=False, base=GREY, target_faces=1500, voxel=0.01, smooth=3)
    p.blob((0, 0.32, 0), (0.46, 0.32, 0.55), group='s')
    p.blob((0.12, 0.42, 0.1), (0.3, 0.22, 0.35), group='s')
    p.paint('spot', (-0.2, 0.5, 0.3), (0.12, 0.08, 0.1), GREY_D)
    p.paint('spot2', (0.25, 0.2, 0.4), (0.09, 0.06, 0.08), GREY_D)
    # a blue push band round its middle (blue things are pushed), white chevrons on it
    p.layer('band', base=BLUE, target_faces=600, voxel=0.008)
    p.lathe([(0.0, 0.26), (0.5, 0.26), (0.53, 0.32), (0.5, 0.38), (0.0, 0.38)], pos=(0, 0, 0), scale=(1.0, 1.18), seg=48)
    p.layer('chev', base=WHITE)
    chevrons(p, 0.625, 0.32, scale=0.42, dx=0.08)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 0.64, 0))
    p.extras['outline'] = 0.022
    p.build()


def water():
    p = SProp('prop_rl_water', base=0x5cc6ff, target_faces=300)
    # the pool's water: top surface at y 0, 1.2 deep, filling one column's slot (0.99 x 1.34)
    p.box((0, -0.6, 0), (0.49, 0.6, 0.67), bevel=0.01)
    p.paint_fn(lambda q, n: q.y < -0.85, 0x3aa6ef)
    p.layer('surf', base=0xd8f4ff)
    p.ring((0, 0.004, 0), 0.3, 0.012, scale=(1.0, 1.35), seg=40, rseg=6)
    # a wavy pale line along the front just under the surface
    pts = [(-0.47 + 0.94 * i / 24, -0.07 + 0.025 * math.sin(i / 24 * TAU * 2.5)) for i in range(25)]
    p.prism(pts + [(x, y - 0.035) for x, y in pts][::-1], 0.672, 0.684, bevel=0.004)
    p.layer('rim', base=0x2f8fe0)
    for s in (-1, 1):
        p.box((0, -0.012, s * 0.66), (0.49, 0.014, 0.012), bevel=0.006)
        p.box((s * 0.48, -0.012, 0), (0.012, 0.014, 0.66), bevel=0.006)
    p.layer('skin')
    p.bone('body', (0, -1.2, 0), (0, 0, 0))
    p.extras['outline'] = 0.0
    p.build()


for name, fn in [('prop_rl_cookie', cookie), ('prop_rl_cookie_bit', lambda: cookie(True)), ('prop_rl_crumb', crumb), ('prop_rl_jelly', jelly),
                 ('prop_rl_balloon', balloon), ('prop_rl_peg', peg), ('prop_rl_crate', crate), ('prop_rl_stone', stone), ('prop_rl_water', water)]:
    if want(name):
        fn()


for name, fn in [('prop_rl_column', column), ('prop_rl_slope', slope), ('prop_rl_lifttop', lifttop), ('prop_rl_plinth', plinth),
                 ('prop_rl_log', log), ('prop_rl_chute', chute), ('prop_rl_nest', nest), ('prop_rl_cushion', cushion),
                 ('prop_rl_pop', pop), ('prop_rl_plank', plank), ('prop_rl_box', box), ('prop_rl_ramp', ramp),
                 ('prop_rl_cart', cart), ('prop_rl_wheel', wheel), ('prop_rl_doorframe', doorframe), ('prop_rl_door', door),
                 ('prop_rl_button', button), ('prop_rl_cable', cable), ('prop_rl_seesaw', seesaw), ('prop_rl_pivot', pivot),
                 ('prop_rl_hatch', hatch), ('prop_rl_hogball', hogball), ('prop_rl_hogface', hogface)]:
    if want(name):
        fn()
