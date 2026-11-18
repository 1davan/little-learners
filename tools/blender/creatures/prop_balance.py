"""Fill & balance (World 5, the building site): the toy kit for pouring and weighing.
Models (ONLY=prop_bal_pail tools/blender/build.sh prop_balance builds a subset):
  prop_bal_pail    a clear toy measuring pail (TINTABLE base + rim): layers glass (clear wall, the game makes it see-through
                   and hides its ink), handle (yellow, lying back so it never hides the opening), markHalf (white dashes
                   round the front at half height), markFull (white line under the rim) and star (yellow star on the full line).
                   Unit size: bottom radius 0.6, top 0.78, height 1.2; inner floor at y 0.19 (see balance-props.js PAIL).
  prop_bal_jug     a chunky water jug (TINTABLE), spout to +x (tip at 0.7, 1.12, 0), handle to -x; layer drop (white sticker).
  prop_bal_scoop   a sand scoop (TINTABLE): a deep cup, pour lip to +x (0.42, 0.47, 0), fat handle to -x; layer sand (heaped load).
  prop_bal_seesaw  skin = a big red house brick (top at y 0.84); layer plank = the wooden see-saw plank resting on a rocker
                   (rocker axis at y 0.97, plank top 1.2, ends at x +-4.1, red end stops); layer level = a toy spirit level
                   on the plank's front edge (window centre (0, 1.31, 0.5)).
  prop_bal_heap    the sand heap the scoop digs in (about 3.2 wide, 1.25 tall) with a scooped hollow and pebbles; layer flag.
  prop_bal_tub     a round water tub (TINTABLE, r 1.05, 0.78 tall) with two handles; layer water (the surface at y 0.64).
  prop_bal_castle  the sand castle a tipped-out pail leaves (the pail's shape upside down: bottom r 0.78, top r 0.6,
                   1.2 tall) with rim ridges and crenellations; layers shells, flag.
Everything stands on y = 0 and faces +z."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded, star_poly, circle_poly
from skit import SProp

ONLY = [s for s in os.environ.get('ONLY', '').split(',') if s]
WHITE = 0xffffff
TAU = math.tau
SAND, SAND_L, SAND_D = 0xedc477, 0xf7dea6, 0xd6a65c
YEL, YEL_D = 0xffd23f, 0xf0b52a


def tinted(p, h, default, outline=0.024):
    if not any(b[0] == 'body' for b in p.bones):
        p.bone('body', (0, 0, 0), (0, h, 0))
    p.extras['argMode'] = 'tint'
    p.extras['argDefault'] = default
    p.extras['outline'] = outline
    p.build()


# ------------------------------------------------------------------ the clear pail
RB, R, H, TW, YF = 0.6, 0.78, 1.2, 0.035, 0.19
ro = lambda y: RB + (R - RB) * y / H          # outer wall radius at height y
Y_FULL, Y_HALF = 1.06, (0.215 + 1.06) / 2


def pail():
    p = Prop('prop_bal_pail', base=WHITE, target_faces=2600, voxel=0.014)
    # the solid coloured base cup the clear wall stands in, and the rolled rim
    p.lathe(rounded([(0, 0), (RB + 0.06, 0), (RB + 0.085, 0.05), (RB + 0.085, 0.2), (RB - 0.04, 0.215), (0, 0.215)], 0.05, n=4), seg=56)
    p.ring((0, H - 0.015, 0), R - 0.012, 0.06, seg=60)
    for s in (-1, 1):
        p.blob((s * (R + 0.015), H - 0.15, 0), (0.05, 0.085, 0.085), group='lug%d' % s)
    p.paint_fn(lambda q, n: q.y < 0.03, 0xe6e6e6)
    # clear wall: a thin revolved shell from inside the base up into the rim
    p.layer('glass', base=WHITE, target_faces=1800, voxel=0.008)
    y0, y1 = 0.12, H - 0.02
    p.lathe([(ro(y0), y0), (ro(y1), y1), (ro(y1) - TW, y1), (ro(y0) - TW, y0)], seg=64, closed=True)
    p.layer('skin')
    # the inside floor: pale, so an empty pail looks empty (the base under it is tinted)
    p.layer('floor', base=0xeef4f8, target_faces=1000, voxel=0.005)
    p.cyl((0, 0.2, 0), RB - 0.045, 0.022, bevel=0.008, seg=64)
    p.layer('skin')
    # handle: hangs down behind the pail so the opening is always in view
    p.layer('handle', base=YEL, target_faces=700, voxel=0.012)
    hy, hr, tilt = H - 0.15, R + 0.07, math.radians(158)
    pts = []
    for a in range(0, 181, 10):
        x = -hr * math.cos(math.radians(a)); y = hr * math.sin(math.radians(a)) * 0.95
        pts.append((x, hy + y * math.cos(tilt), -y * math.sin(tilt)))
    p.tube(pts, 0.045, rseg=10)
    for s in (-1, 1):
        p.blob((s * hr, hy, 0), (0.05, 0.065, 0.065), group='pin%d' % s)
    p.paint_fn(lambda q, n: abs(q.x) > R + 0.02 and q.y < hy + 0.08, YEL_D)
    p.layer('skin')
    # the half mark: five fat dashes round the front
    p.layer('markHalf', base=WHITE, target_faces=500, voxel=0.007)
    for k in range(-2, 3):
        a = math.radians(k * 27)
        r = ro(Y_HALF) + 0.014
        p.box((r * math.sin(a), Y_HALF, r * math.cos(a)), (0.065, 0.026, 0.016), rot=(0, math.degrees(a), 0), bevel=0.012)
    p.layer('skin')
    # the full mark: a line round the front just under the rim, with a star on it
    p.layer('markFull', base=WHITE, target_faces=500, voxel=0.007)
    p.ring((0, Y_FULL, 0), ro(Y_FULL) + 0.012, 0.018, a0=-1.25, a1=1.25, seg=40, rseg=8)
    p.layer('skin')
    p.layer('star', base=YEL, target_faces=360, voxel=0.007)
    p.sticker(star_poly(0.12, inner=0.5), Y_FULL, lambda y: ro(y) + 0.012, thick=0.03, ang=0.62, lift=0.012)
    p.layer('skin')
    tinted(p, H, 0xff5a5a)


# ------------------------------------------------------------------ the water jug
def jug():
    p = Prop('prop_bal_jug', base=WHITE, target_faces=2400, voxel=0.013)
    prof = rounded([(0, 0), (0.37, 0), (0.46, 0.08), (0.5, 0.32), (0.47, 0.62), (0.37, 0.86), (0.33, 0.97), (0.37, 1.04),
                    (0.34, 1.08), (0, 1.08)], 0.06, n=4)
    p.lathe(prof, seg=48)
    # spout to +x, rising and narrowing
    p.tube([(0.22, 0.97, 0), (0.42, 1.0, 0), (0.58, 1.06, 0), (0.72, 1.12, 0)], [0.15, 0.115, 0.095, 0.1], rseg=14)
    # a rolled pouring lip on the spout tip, and a band round the shoulder (a shade darker than the tint)
    p.ring((0.74, 1.125, 0), 0.085, 0.03, rot=(0, 0, -62), seg=24, rseg=8)
    p.ring((0, 0.8, 0), 0.43, 0.035, seg=48, rseg=8)
    # handle loop to -x (its own group so it keeps its round section)
    p.blob((-0.34, 0.93, 0), (0.09, 0.09, 0.08), group='hd')
    p.tube([(-0.34, 0.93, 0), (-0.58, 0.92, 0), (-0.69, 0.72, 0), (-0.64, 0.46, 0), (-0.45, 0.32, 0)], 0.075, rseg=12)
    # the dark water showing in the mouth and the spout opening
    WATER = 0x3f8fd8
    p.paint_fn(lambda q, n: q.y > 1.05 and math.hypot(q.x, q.z) < 0.27 and n.y > 0.5, WATER)
    p.paint_fn(lambda q, n: q.x > 0.66 and q.y > 1.08 and n.x > 0.2, WATER)
    p.paint_fn(lambda q, n: q.y < 0.03, 0xe0e0e0)
    p.paint_fn(lambda q, n: abs(q.y - 0.8) < 0.05 and math.hypot(q.x, q.z) > 0.4, 0xc8c8c8)
    # a white water-drop sticker on the front
    p.layer('drop', base=WHITE, target_faces=320, voxel=0.007)
    pts = []
    for d in range(-125, 126, 10):
        a = math.radians(d)
        pts.append((0.12 * math.sin(a), -0.04 - 0.12 * math.cos(a)))
    poly = [(0.0, 0.17)] + pts[::-1]

    def r_of_y(y):
        # the jug's outer radius near the middle of the body
        return 0.5 - 0.06 * ((y - 0.45) / 0.3) ** 2
    p.sticker(poly, 0.46, r_of_y, thick=0.03, lift=0.01)
    p.layer('skin')
    tinted(p, 1.1, 0x3f8cff)


# ------------------------------------------------------------------ the sand scoop
def scoop():
    p = Prop('prop_bal_scoop', base=WHITE, target_faces=2200, voxel=0.012)
    T = 0.05
    wall = rounded([(0, 0), (0.3, 0), (0.39, 0.46), (0.39 - T, 0.46), (0.3 - T, T * 1.4), (0, T * 1.4)], 0.04, n=4)
    p.lathe(wall, seg=48, scale=(1.08, 1.0))
    p.ring((0, 0.46, 0), 0.37, 0.035, seg=48, scale=(1.08, 1.0))
    # a little pinched pour lip at +x
    p.blob((0.4, 0.45, 0), (0.07, 0.03, 0.12), group='lip')
    # the fat handle to -x with a round grip
    p.tube([(-0.36, 0.3, 0), (-0.62, 0.42, 0), (-0.92, 0.55, 0)], 0.075, rseg=12)
    p.blob((-0.98, 0.58, 0), (0.12, 0.11, 0.11), group='grip')
    p.paint_fn(lambda q, n: q.y < 0.04, 0xe0e0e0)
    # the load: a heaped dome of sand in the cup
    p.layer('sand', base=SAND, target_faces=500, voxel=0.012)
    p.blob((0, 0.38, 0), (0.36, 0.16, 0.33), group='load')
    p.blob((0.05, 0.5, 0.02), (0.2, 0.08, 0.18), group='load')
    p.paint_fn(lambda q, n: q.y > 0.5, SAND_L)
    p.layer('skin')
    tinted(p, 0.6, 0xff9a2e)


# ------------------------------------------------------------------ the see-saw: a brick and a plank
BRICK_Y = 0.84
PIV = 0.97                      # rocker axis
PL, PT, PD = 4.1, 0.1, 0.66     # plank half length, half thickness, half depth
PLY = PIV + 0.13                # plank centre
ARM_X = 3.12                    # where the pails ride (balance-props.js SEESAW.ARM)


def seesaw():
    p = Prop('prop_bal_seesaw', base=0xd65a3c, target_faces=2400, voxel=0.014)
    # a chunky house brick, lying long-side to the camera, with the two frog dents of a real brick on its top
    p.box((0, BRICK_Y / 2, 0), (0.78, BRICK_Y / 2, 0.5), bevel=0.1)
    p.paint_fn(lambda q, n: n.y > 0.7, 0xe46d4c)
    p.paint_fn(lambda q, n: q.y < 0.05, 0xb8452e)
    p.paint_fn(lambda q, n: n.z > 0.7 and abs(q.y - BRICK_Y * 0.5) < 0.025, 0xc24e34)     # one mortar-ish groove line
    # the plank (own layer, rocks about the rocker axis): three boards side by side with little gaps (clean straight
    # seams), rounded bumper ends, seat pads where the pails ride, handle hoops just inboard of them, a fat rocker log
    p.layer('plank', base=0xe5a865, target_faces=4200, voxel=0.012)
    bw = (2 * PD - 0.06) / 3
    for k in range(3):
        z = -PD + bw / 2 + k * (bw + 0.03)
        p.box((0, PLY, z), (PL, PT, bw / 2), bevel=0.06)
    p.cyl((0, PIV, -0.5), 0.135, 1.0, rot=(90, 0, 0), bevel=0.04, seg=28)          # the rocker log under the middle
    for s in (-1, 1):
        p.box((s * (PL - 0.1), PLY + PT + 0.05, 0), (0.11, 0.09, PD - 0.02), bevel=0.07)   # bumper end stops
        hoop = [(s * 2.05, PLY + PT - 0.02, -0.42), (s * 2.05, PLY + PT + 0.26, -0.42), (s * 2.05, PLY + PT + 0.32, 0.0),
                (s * 2.05, PLY + PT + 0.26, 0.42), (s * 2.05, PLY + PT - 0.02, 0.42)]                 # handle hoop
        p.tube(rounded(hoop, 0.14, n=4), 0.05, rseg=10)
    p.paint_fn(lambda q, n: q.y > PLY + PT - 0.01 and abs(q.x) < PL - 0.22, 0xf0b878)                    # lighter tops
    p.paint_fn(lambda q, n: q.y > PLY + PT - 0.01 and 0.6 > abs(abs(q.x) - ARM_X) and math.hypot(abs(q.x) - ARM_X, q.z) < 0.62
               and math.hypot(abs(q.x) - ARM_X, q.z) > 0.5, 0xd58a48)                                     # seat rings
    p.paint_fn(lambda q, n: abs(q.x) > PL - 0.22 and q.y > PLY + PT - 0.01, 0xff5a3a)
    p.paint_fn(lambda q, n: abs(abs(q.x) - 2.05) < 0.06 and q.y > PLY + PT + 0.01, 0xff5a3a)
    p.paint_fn(lambda q, n: q.y < PIV + 0.03 and abs(q.x) < 0.2, 0xc7884a)
    p.paint_fn(lambda q, n: abs(q.x) < 0.16 and q.y < PIV + 0.06 and abs(abs(q.z) - 0.5) < 0.03, 0x9a9aa6)  # bolt heads
    p.layer('skin')
    # the toy spirit level on the front edge of the plank
    p.layer('level', base=YEL, target_faces=900, voxel=0.01)
    LZ = PD - 0.13
    p.box((0, PLY + PT + 0.11, LZ), (0.5, 0.11, 0.11), bevel=0.06)
    p.paint_fn(lambda q, n: n.z > 0.6 and abs(q.x) < 0.36 and abs(q.y - (PLY + PT + 0.11)) < 0.06, 0xc8f5a0)
    p.paint_fn(lambda q, n: n.z > 0.6 and abs(q.x) < 0.025 and abs(q.y - (PLY + PT + 0.11)) < 0.07, 0x3a8a3a)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 1.2, 0))
    p.extras['outline'] = 0.024
    p.build()


# ------------------------------------------------------------------ the sand heap
def heap():
    p = Prop('prop_bal_heap', base=SAND, target_faces=3600, voxel=0.018, smooth=4)
    # a lumpy cone of sand at its natural slope (concave sides), the peak a little off centre, with slumped lumps
    # round the foot and a scoop-shaped hollow dug out of the front right
    prof = [(0, 0)] + [(1.5 * (1 - t) ** 1.25 + 0.05 + 0.22 * t ** 3, 1.15 * t) for t in [k / 10 for k in range(11)]] + [(0, 1.2)]
    p.lathe(rounded(prof, 0.2, n=4), pos=(-0.1, 0, -0.05), seg=40, scale=(1.05, 0.72))
    for i, (x, z, r) in enumerate(((-1.25, 0.3, 0.42), (1.2, -0.25, 0.45), (0.55, 0.62, 0.38), (-0.6, -0.55, 0.4), (-0.25, 0.7, 0.32))):
        p.blob((x, 0.08, z), (r * 1.25, r * 0.6, r), group='slump%d' % i, stiffness=1.8)
    p.blob((0, -0.6, 0), (2.2, 0.6, 1.6), group='slump0', negative=True)
    p.blob((0.62, 0.55, 0.62), (0.34, 0.26, 0.3), group='dig', negative=True)
    p.paint_fn(lambda q, n: n.y > 0.72 and q.y > 0.75, SAND_L)
    p.paint_fn(lambda q, n: q.y < 0.13 + 0.05 * math.sin(math.atan2(q.z, q.x) * 11) and n.y < 0.9, SAND_D)   # scalloped damp foot
    p.layer('pebbles', base=0xb9b3aa, target_faces=900, voxel=0.01)
    for i, (x, y, z, sz) in enumerate([(-1.3, 0.16, 0.72, 0.12), (1.3, 0.12, 0.62, 0.1), (-0.3, 0.3, 0.9, 0.09), (1.75, 0.08, 0.3, 0.11)]):
        p.blob((x, y, z), (sz * 1.3, sz * 0.8, sz), rot=(0, i * 40, 10), group='pb%d' % i)
    p.paint('pb2', (-0.3, 0.3, 0.9), (0.12, 0.12, 0.12), 0xd9c8b4)
    # a pink scallop shell and a little white whelk pressed into the slope
    for k in range(5):
        a = math.radians(-50 + 25 * k)
        p.blob((0.05 + 0.1 * math.sin(a), 0.42 + 0.1 * math.cos(a), 0.86), (0.05, 0.11, 0.035), rot=(-30, 0, -math.degrees(a)), group='sc')
    p.blob((0.05, 0.36, 0.86), (0.07, 0.05, 0.04), rot=(-30, 0, 0), group='sc')
    p.paint_fn(lambda q, n: abs(q.x - 0.05) < 0.25 and abs(q.y - 0.42) < 0.25 and q.z > 0.6, 0xffa6bf)
    for k in range(4):
        u = k / 3
        p.blob((-0.85 + 0.1 * u, 0.36 + 0.03 * u, 0.62 - 0.03 * u), (0.07 * (1 - 0.6 * u), 0.065 * (1 - 0.6 * u), 0.06 * (1 - 0.6 * u)), group='wh')
    p.paint_fn(lambda q, n: q.x < -0.7 and q.y > 0.25 and q.z > 0.45, 0xfff4e6)
    p.layer('skin')
    # a chunky striped flag stuck in the peak
    p.layer('flag', base=0xff6a3a, target_faces=700, voxel=0.01)
    p.quadriflow = False
    p.tube([(-0.1, 0.95, -0.05), (-0.1, 1.95, -0.05)], 0.04, rseg=10)
    p.lathe([(0, 0), (0.07, 0.0), (0.07, 0.04), (0, 0.1)], pos=(-0.1, 1.95, -0.05), seg=12)
    FL = [(-0.07, 1.9), (0.62, 1.74), (-0.07, 1.5)]
    p.mesh([(x, y, -0.09) for x, y in FL] + [(x, y, -0.01) for x, y in FL],
           [(0, 1, 2), (3, 5, 4), (0, 3, 4, 1), (1, 4, 5, 2), (2, 5, 3, 0)], bevel=0.0)
    p.paint_fn(lambda q, n: q.x < -0.07 or q.y > 1.92, 0xf2f2f2)
    p.paint_fn(lambda q, n: q.x > -0.06 and q.y < 1.92 and 0.15 < q.x < 0.3, 0xffd23f)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 1.2, 0))
    p.extras['outline'] = 0.024
    p.build()


# ------------------------------------------------------------------ the water tub
def tub():
    TR, TB, TH, T = 1.05, 0.88, 0.78, 0.08
    p = SProp('prop_bal_tub', hard=True, base=WHITE, target_faces=2400)
    wall = rounded([(0, 0), (TB, 0), (TR, TH), (TR - T, TH), (TB - T, T * 1.4), (0, T * 1.4)], 0.06, n=4)
    p.lathe(wall, seg=48)
    p.ring((0, TH, 0), TR - T * 0.4, 0.07, seg=60)
    # two side handles (little loops)
    for s in (-1, 1):
        p.ring((s * (TR + 0.08), TH - 0.18, 0), 0.13, 0.035, rot=(90, 0, 0), seg=20, rseg=8)
    p.paint_fn(lambda q, n: q.y > TH - 0.06, 0xf4f4f4)
    p.paint_fn(lambda q, n: q.y < 0.04, 0xdedede)
    # the water: a disc just under the rim
    p.layer('water', base=0x6fd0ff, target_faces=700, voxel=0.012)
    # a round disc filling the tub just under the rim, with two clean ripple rings (real rings, cut into the top)
    rw = TR - T * 0.85 - 0.01
    rings = [0, 0.16, 0.2, 0.36, 0.4, rw * 0.98, rw]
    p.lathe([(0, TH - 0.14)] + [(r, TH - 0.14) for r in rings[1:]] + [(rw, TH - 0.2), (0, TH - 0.2)], seg=56)
    p.paint_fn(lambda q, n: n.y > 0.5 and (0.16 < math.hypot(q.x, q.z) < 0.2 or 0.36 < math.hypot(q.x, q.z) < 0.4), 0xb4ecff)
    p.layer('skin')
    tinted(p, TH, 0x3f8cff)


# ------------------------------------------------------------------ the pail-shaped sand castle
def castle(kind='prop_bal_castle', Hc=H):
    """the castle a tipped-out pail leaves: the pail's shape upside down (bottom r 0.78, narrowing toward r 0.6 at
    1.2), Hc tall. The half castle (a half-full pail) is its own model: half the height, the same full-size
    battlements and flag."""
    p = Prop(kind, base=SAND, target_faces=2600, voxel=0.012)
    rc = lambda y: R - (R - RB) * y / H
    top = rc(Hc)
    prof = rounded([(0, 0), (rc(0) + 0.03, 0), (rc(0.08) + 0.06, 0.08), (rc(0.16) + 0.01, 0.16), (rc(Hc - 0.1), Hc - 0.1), (top - 0.06, Hc), (0, Hc)], 0.04, n=3)
    p.lathe(prof, seg=64)
    # crenellations round the top (the pail's bottom ridge), sunk well into the top so they weld into one clean shape
    rb = top - 0.16
    for i in range(8):
        a = i / 8 * TAU
        p.box((rb * math.sin(a), Hc + 0.06, rb * math.cos(a)), (0.11, 0.14, 0.09), rot=(0, math.degrees(a), 0), bevel=0.05)
    p.paint_fn(lambda q, n: q.y > Hc - 0.02 and n.y > 0.6, SAND_L)
    p.paint_fn(lambda q, n: q.y < 0.16, SAND_D)
    # an arched door: its own clean shape on the front (its own ink edge, no ragged paint)
    p.layer('door', base=0xb98745, target_faces=500, voxel=0.006)
    dh = min(0.5, Hc * 0.62)
    door = [(-0.14, 0.02)] + [(0.14 * math.cos(math.pi - math.pi * k / 10), dh - 0.14 + 0.14 * math.sin(math.pi - math.pi * k / 10)) for k in range(11)] + [(0.14, 0.02)]
    door = [(x, y - dh / 2) for x, y in door]
    p.sticker(door, dh / 2, lambda y: rc(y) + 0.005, thick=0.025, lift=0.0)
    p.layer('skin')
    p.layer('shells', base=0xffb6c9, target_faces=300, voxel=0.008)
    for i, (a, y, c) in enumerate([(-0.9, 0.75, 0), (0.85, 0.5, 1), (0.35, 0.95, 0)]):
        y = 0.12 + (y - 0.12) * (Hc - 0.15) / (H - 0.15)
        r = rc(y) + 0.01
        p.blob((r * math.sin(a), y, r * math.cos(a)), (0.07, 0.06, 0.035), rot=(0, math.degrees(a), 0), group='sh%d' % i)
        if i == 1:
            p.paint('sh1c', (r * math.sin(a), y, r * math.cos(a)), (0.1, 0.1, 0.1), 0xa8e0ff)
    p.layer('skin')
    p.layer('flag', base=0xff5a5a, target_faces=360, voxel=0.01)
    p.quadriflow = False
    p.tube([(0, Hc - 0.1, 0), (0, Hc + 0.75, 0)], 0.026, rseg=8)
    p.mesh([(0.02, Hc + 0.72, 0), (0.42, Hc + 0.6, 0), (0.02, Hc + 0.47, 0), (0.02, Hc + 0.72, 0.04), (0.42, Hc + 0.6, 0.04), (0.02, Hc + 0.47, 0.04)],
           [(0, 1, 2), (3, 5, 4), (0, 3, 4, 1), (1, 4, 5, 2), (2, 5, 3, 0)])
    p.paint_fn(lambda q, n: q.x < 0.02, 0xf2f2f2)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, Hc, 0))
    p.extras['outline'] = 0.022
    p.build()


def castle_half():
    castle('prop_bal_castle_half', 0.62)


MODELS = dict(prop_bal_pail=pail, prop_bal_jug=jug, prop_bal_scoop=scoop, prop_bal_seesaw=seesaw, prop_bal_heap=heap,
              prop_bal_tub=tub, prop_bal_castle=castle, prop_bal_castle_half=castle_half)
for name, fn in MODELS.items():
    if not ONLY or name in ONLY:
        fn()
