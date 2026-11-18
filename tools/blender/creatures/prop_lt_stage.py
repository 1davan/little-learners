"""Letter friends (the Alphabet Train) station and train. One script, several models (ONLY=prop_lt_carriage,... builds a
subset). Game space: x along the track (the train heads toward -x), y up, +z toward the camera; every model stands on y 0.

  prop_lt_carriage  a chunky wooden toy carriage, 2.0 long (x +-1.0) and 1.2 deep (z +-0.6), origin on the rails under its
                    middle. Front half (z 0..0.6, toward the camera) = the cargo bay: floor top at y 0.45, three cream
                    seat discs (layer 'seats') at x -0.6 / 0 / 0.6, z 0.3 (top y 0.47), low end walls. Back half
                    (z -0.6..0) = the raised rear deck (top y 1.0, layer 'deck', planked wood) where the letter friend
                    stands. Body painted white = livery colour (argMode 'tint'); trim rails and the deck's front lip are
                    layer 'trim' (white, tinted in game to the second livery colour). Corner post for a pennant at
                    (0.86, 1.0..1.56, -0.48) (layer 'post', knob on top). Dark chassis and buffers (layer 'dark').
                    Four fat wheels r 0.2 (centre y 0.2, x +-0.62, z +-0.53, layer 'wheels', hubs layer 'hubs') on
                    bones 'wheel.F' (x +0.62) and 'wheel.B' (x -0.62); rotation.z spins them.
                    The front flap is a separate model (prop_lt_flap) hinged at (0, 0.45, 0.6) in game code.
  prop_lt_flap      the bay's front flap: a board 1.88 wide, 0.22 high, 0.07 thick, origin on its bottom (hinge) edge,
                    white (tinted). A round cream plate in the middle (layer 'plate', front face z 0.045, centre y 0.11,
                    r 0.095) for the lowercase letter the game draws on it.
  prop_lt_trunk     a rounded travel trunk (base), 1.2 wide x 0.72 tall x 0.8 deep, open on top, dark inside (inner
                    cavity x +-0.53, z +-0.33, floor y 0.08). Sky-blue sides, brown straps (layer 'straps'), brass corner
                    caps and clasp (layer 'brass'), a star and a heart luggage sticker on the front (layer 'stickers').
  prop_lt_trunklid  its domed lid, origin on the hinge (the base's top back edge: trunk-local (0, 0.72, -0.4)); closed it
                    spans z 0..0.82 and y 0..0.28. Dark underside, straps, brass corners and a round brass knob handle on
                    the front (layer 'knob', centre (0, 0.13, 0.86)).
  prop_lt_platform  a low wooden station platform 26 wide (x +-13), top y 0.14, from z -0.95 (the track side, with a
                    cream safety stripe) to z 3.05 (a rounded front nosing). Planks along x in two warm woods.
  prop_lt_rug       an oval rug 3.8 x 1.9, 0.03 thick, white field (tinted) and a border ring (layer 'border', tinted).
  prop_lt_sign      a small station sign: two posts, a board 1.5 x 0.62 (face centre y 1.62, front z 0.06) with a frame
                    (layer 'frame'); the game draws the set's letters on a canvas over the cream face.
  prop_lt_track     one 2.2-long tile of low toy track: five dark sleepers and two silver rails (top y 0.07, z +-0.53).
"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded, star_poly, circle_poly
from skit import SProp

ONLY = [s for s in os.environ.get('ONLY', '').split(',') if s]
want = lambda n: not ONLY or n in ONLY

DARK, HUB, CREAM, WOOD, WOOD2, WOOD_D, BRASS = 0x4a3a52, 0xffd23f, 0xfff4dc, 0xd99a5b, 0xc98a4c, 0xa86f3a, 0xffc94a


# ---------------- carriage ----------------
def carriage():
    p = Prop('prop_lt_carriage', base=0xffffff, target_faces=1800, voxel=0.02, smooth=3)
    # body: the bay floor slab (full length), the end walls of the bay, and the raised deck block behind
    p.box((0, 0.385, 0), (1.0, 0.065, 0.6), bevel=0.05)
    for s in (-1, 1):
        p.box((s * 0.96, 0.585, 0.3), (0.04, 0.135, 0.3), bevel=0.03)
    p.box((0, 0.7, -0.3), (1.0, 0.26, 0.3), bevel=0.06)
    p.layer('trim', base=0xffffff, target_faces=700, voxel=0.014)
    for s in (-1, 1):   # rolled rims on the end walls
        p.tube([(s * 0.96, 0.72, 0.0), (s * 0.96, 0.72, 0.585)], 0.035, rseg=10)
    p.tube([(-1.0, 0.985, 0.0), (1.0, 0.985, 0.0)], 0.035, rseg=10)      # the deck's front lip
    # a clean valance along both long sides: one straight lower edge that hides where the wheels meet the floor
    p.box((0, 0.36, 0.612), (1.0, 0.075, 0.016), bevel=0.012)
    p.box((0, 0.36, -0.612), (1.0, 0.075, 0.016), bevel=0.012)
    p.layer('deck', base=WOOD, target_faces=500, voxel=0.012)
    p.box((0, 0.985, -0.3), (0.97, 0.018, 0.28), bevel=0.012)
    p.paint_fn(lambda q, n: abs(((q.z + 0.6) / 0.14) % 1 - 0.5) < 0.07 and n.y > 0.5, WOOD_D)
    p.layer('seats', base=CREAM, target_faces=500, voxel=0.01)
    for x in (-0.6, 0, 0.6):
        p.cyl((x, 0.448, 0.3), 0.22, 0.025, bevel=0.012, seg=32)
    p.layer('post', base=0xffffff, target_faces=300, voxel=0.01)
    p.cyl((0.86, 0.98, -0.48), 0.035, 0.56, bevel=0.01, seg=16)
    p.blob((0.86, 1.57, -0.48), (0.06, 0.06, 0.06), group='postknob')
    p.layer('dark', base=DARK, target_faces=600, voxel=0.016)
    p.box((0, 0.27, 0), (0.86, 0.05, 0.34), bevel=0.03)          # chassis, clear of the wheels
    for s in (-1, 1):
        p.box((s * 1.06, 0.33, 0), (0.06, 0.03, 0.035), bevel=0.012)
        p.cyl((s * 1.1, 0.33, 0), 0.07, 0.04, rot=(0, 0, -90 * s), bevel=0.015, seg=20)
    p.layer('wheels', base=0xd94f3d, target_faces=900, voxel=0.014)
    WX, WY, WR, WZ = 0.62, 0.2, 0.2, 0.53
    for x in (-WX, WX):
        for sz in (-1, 1):
            p.cyl((x, WY, sz * (WZ - 0.06)), WR, 0.12, rot=(90 * sz, 0, 0), bevel=0.035, seg=28)
    p.layer('hubs', base=HUB, target_faces=300, voxel=0.01)
    for x in (-WX, WX):
        for sz in (-1, 1):
            p.blob((x, WY, sz * (WZ + 0.075)), (0.075, 0.075, 0.035), group='h%d%d' % (x * 10, sz))
            p.blob((x + 0.11, WY + 0.05, sz * (WZ + 0.07)), (0.028, 0.028, 0.02), group='b%d%d' % (x * 10, sz))
    p.layer('skin')
    wheel = lambda x: (lambda q: abs(q.x - x) < WR + 0.04 and q.y < WY + WR + 0.03 and abs(q.z) > WZ - 0.14)
    p.bone('root', (0, 0, 0), (0, 0.6, 0), region=lambda q: not (wheel(-WX)(q) or wheel(WX)(q)))
    p.bone('wheel.F', (WX, WY, 0), (WX, WY + 0.3, 0), parent='root', region=wheel(WX))
    p.bone('wheel.B', (-WX, WY, 0), (-WX, WY + 0.3, 0), parent='root', region=wheel(-WX))
    p.extras['argMode'] = 'tint'
    p.extras['argDefault'] = 0xff5a4a
    p.extras['outline'] = 0.022
    p.build()


def flap():
    p = Prop('prop_lt_flap', base=0xffffff, target_faces=500, voxel=0.012, smooth=3)
    p.box((0, 0.11, 0), (0.94, 0.11, 0.035), bevel=0.03)
    p.layer('plate', base=CREAM, target_faces=300, voxel=0.008)
    p.cyl((0, 0.11, 0.02), 0.095, 0.025, rot=(90, 0, 0), bevel=0.01, seg=32)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 0.22, 0))
    p.extras['argMode'] = 'tint'
    p.extras['argDefault'] = 0xffd23f
    p.extras['outline'] = 0.016
    p.build()


# ---------------- trunk ----------------
TW, TH, TD, WT = 0.6, 0.72, 0.4, 0.07      # half width, base height, half depth, wall
BLUE, STRAP, INSIDE, RIM = 0x4aa8e0, 0x9a5a34, 0xe8875f, 0xfff0d6   # warm coral lining, cream rim


def trunk():
    p = Prop('prop_lt_trunk', base=BLUE, target_faces=1600, voxel=0.014, smooth=2)
    p.box((0, 0.04, 0), (TW, 0.04, TD), bevel=0.04)                          # floor
    for s in (-1, 1):
        p.box((s * (TW - WT / 2), TH / 2, 0), (WT / 2, TH / 2, TD), bevel=0.035)
        p.box((0, TH / 2, s * (TD - WT / 2)), (TW, TH / 2, WT / 2), bevel=0.035)
    p.paint_fn(lambda q, n: abs(q.x) < TW - WT + 0.012 and abs(q.z) < TD - WT + 0.012 and q.y > 0.05, INSIDE)
    p.paint_fn(lambda q, n: abs(q.x) < TW - WT + 0.012 and abs(q.z) < TD - WT + 0.012 and q.y > 0.05 and q.y < 0.2, 0xd06f4c)
    p.layer('rim', base=RIM, target_faces=500, voxel=0.01)
    p.tube([(-TW + WT / 2, TH, -TD + WT / 2), (TW - WT / 2, TH, -TD + WT / 2), (TW - WT / 2, TH, TD - WT / 2), (-TW + WT / 2, TH, TD - WT / 2)], 0.028, closed=True, rseg=8)
    p.layer('straps', base=STRAP, target_faces=600, voxel=0.01)
    for x in (-0.36, 0.36):
        p.box((x, TH / 2 - 0.005, TD + 0.006), (0.055, TH / 2 - 0.01, 0.012), bevel=0.008)
        p.box((x, TH / 2 - 0.005, -TD - 0.006), (0.055, TH / 2 - 0.01, 0.012), bevel=0.008)
    p.layer('brass', base=BRASS, target_faces=700, voxel=0.01)
    for sx in (-1, 1):
        for sz in (-1, 1):
            p.blob((sx * (TW - 0.01), 0.05, sz * (TD - 0.01)), (0.075, 0.075, 0.075), group='c%d%d' % (sx, sz))
            p.blob((sx * (TW - 0.01), TH - 0.04, sz * (TD - 0.01)), (0.07, 0.06, 0.07), group='u%d%d' % (sx, sz))
    p.box((0, TH - 0.09, TD + 0.02), (0.07, 0.07, 0.02), bevel=0.015)      # the clasp
    p.layer('stickers', base=0xffffff, target_faces=500, voxel=0.006)
    star = star_poly(0.1, inner=0.5)
    p.mesh([(x - 0.13, y + 0.42, TD + 0.012) for x, y in star] + [(x - 0.13, y + 0.42, TD + 0.03) for x, y in star],
           [tuple(range(len(star))), tuple(range(2 * len(star) - 1, len(star) - 1, -1))] +
           [(i, (i + 1) % len(star), len(star) + (i + 1) % len(star), len(star) + i) for i in range(len(star))])
    heart = []
    for i in range(32):
        a = math.tau * i / 32
        x = 16 * math.sin(a) ** 3
        y = 13 * math.cos(a) - 5 * math.cos(2 * a) - 2 * math.cos(3 * a) - math.cos(4 * a)
        heart.append((x * 0.0055 + 0.15, y * 0.0055 + 0.26))
    n = len(heart)
    p.mesh([(x, y, TD + 0.012) for x, y in heart] + [(x, y, TD + 0.03) for x, y in heart],
           [tuple(range(n)), tuple(range(2 * n - 1, n - 1, -1))] + [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)])
    p.paint_fn(lambda q, n_: q.x < 0, 0xffd23f)
    p.paint_fn(lambda q, n_: q.x >= 0, 0xff6f91)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, TH, 0))
    p.extras['outline'] = 0.02
    p.build()


def trunklid():
    p = Prop('prop_lt_trunklid', base=BLUE, target_faces=1200, voxel=0.014, smooth=2)
    D2 = 2 * TD + 0.02
    # domed top: a shallow lathe-ish box with a rounded crown, hollow underneath
    p.box((0, 0.06, D2 / 2), (TW + 0.01, 0.06, D2 / 2), bevel=0.035)
    p.blob((0, 0.12, D2 / 2), (TW - 0.02, 0.15, D2 / 2 - 0.03), group='dome', stiffness=3)
    p.paint_fn(lambda q, n: q.y < 0.03 and n.y < -0.5, INSIDE)
    p.layer('straps', base=STRAP, target_faces=500, voxel=0.01)
    for x in (-0.36, 0.36):
        p.box((x, 0.1, D2 + 0.004), (0.055, 0.09, 0.012), bevel=0.008)
        pts = [(x, 0.1 + 0.16 * math.sin(math.pi * k / 12), D2 / 2 + (D2 / 2 + 0.005) * math.cos(math.pi * k / 12)) for k in range(13)]
        p.tube(pts, 0.03, rseg=8)
    p.layer('brass', base=BRASS, target_faces=500, voxel=0.01)
    for sx in (-1, 1):
        for sz in (0, 1):
            p.blob((sx * (TW - 0.01), 0.07, 0.02 + sz * (D2 - 0.04)), (0.07, 0.06, 0.07), group='c%d%d' % (sx, sz))
    p.layer('knob', base=BRASS, target_faces=400, voxel=0.008)
    p.cyl((0, 0.13, D2 - 0.02), 0.035, 0.05, rot=(90, 0, 0), bevel=0.01, seg=16)
    p.blob((0, 0.13, D2 + 0.06), (0.075, 0.075, 0.05), group='knob')
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 0.3, 0))
    p.extras['outline'] = 0.02
    p.build()


# ---------------- platform, rug, sign, track ----------------
def platform():
    p = SProp('prop_lt_platform', base=WOOD, target_faces=1600, voxel=0.03)
    Z0, Z1, TOP, X = -0.95, 3.05, 0.14, 13.0
    n = 8
    w = (Z1 - Z0) / n
    p.box((0, TOP / 2, (Z0 + Z1) / 2), (X, TOP / 2, (Z1 - Z0) / 2), bevel=0.03)
    # planks: alternate two warm woods (painted, so no ink line between every board)
    p.paint_fn(lambda q, nn: int((q.z - Z0) / w) % 2 == 1, WOOD2)
    p.paint_fn(lambda q, nn: abs(((q.z - Z0) / w) % 1) < 0.012 or abs(((q.z - Z0) / w) % 1) > 0.988, WOOD_D)
    p.layer('nosing', base=WOOD_D, target_faces=300)
    p.cyl((-X, TOP / 2, Z1), TOP / 2 + 0.01, 2 * X, rot=(0, 0, -90), bevel=0.0, seg=20)
    p.layer('stripe', base=CREAM, target_faces=200)
    p.box((0, TOP + 0.004, Z0 + 0.12), (X - 0.05, 0.006, 0.07), bevel=0.004)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 0.3, 0))
    p.extras['outline'] = 0.02
    p.build()


def rug():
    p = SProp('prop_lt_rug', base=0xffffff, target_faces=600, voxel=0.012)
    p.cyl((0, 0, 0), 1.72, 0.035, bevel=0.012, scale=(1.0, 0.47), seg=64)
    p.layer('border', base=0xffffff, target_faces=600)
    p.ring((0, 0.03, 0), 1.74, 0.065, scale=(1.0, 0.47), seg=72, rseg=10)    # a soft, fat rim
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 0.2, 0))
    p.extras['argMode'] = 'tint'
    p.extras['argDefault'] = 0xfff0d8
    p.extras['outline'] = 0.012
    p.build()


def sign():
    p = SProp('prop_lt_sign', base=WOOD, target_faces=900, voxel=0.02)
    for x in (-0.62, 0.62):
        p.box((x, 0.75, 0), (0.05, 0.75, 0.05), bevel=0.02)
    p.box((0, 1.62, 0), (0.75, 0.31, 0.04), bevel=0.02)
    p.paint_fn(lambda q, n: q.z > 0.035 and abs(q.x) < 0.66 and abs(q.y - 1.62) < 0.24, CREAM)
    p.layer('frame', base=0xff7a3d, target_faces=400)
    p.box((0, 1.62 + 0.29, 0.03), (0.77, 0.04, 0.04), bevel=0.015)
    p.box((0, 1.62 - 0.29, 0.03), (0.77, 0.04, 0.04), bevel=0.015)
    for x in (-0.73, 0.73):
        p.box((x, 1.62, 0.03), (0.04, 0.33, 0.04), bevel=0.015)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 2.0, 0))
    p.extras['outline'] = 0.018
    p.build()


def track():
    p = SProp('prop_lt_track', base=0x8a5a3c, target_faces=600, voxel=0.02)
    for i in range(5):
        x = -1.1 + 0.22 + 0.44 * i
        p.box((x, 0.022, 0), (0.08, 0.022, 0.72), bevel=0.012)
    p.layer('rails', base=0xc9d1de, target_faces=300)
    for z in (-0.53, 0.53):
        p.box((0, 0.055, z), (1.1, 0.015, 0.035), bevel=0.008)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 0.2, 0))
    p.extras['outline'] = 0.012
    p.build()


for name, fn in [('prop_lt_carriage', carriage), ('prop_lt_flap', flap), ('prop_lt_trunk', trunk), ('prop_lt_trunklid', trunklid),
                 ('prop_lt_platform', platform), ('prop_lt_rug', rug), ('prop_lt_sign', sign), ('prop_lt_track', track)]:
    if want(name):
        fn()
