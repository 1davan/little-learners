"""Story props for 'What happens next?' (app/src/lessons/story*.js). One file, one model each
(ONLY=prop_st_nest tools/blender/build.sh prop_story builds one). Game space: x right, y up, facing +z.
  prop_st_frame      the story card: a chunky shadow-box picture frame 2.4 wide x 2.1 tall x 1.0 deep, origin at the
                     bottom centre. Skin = the frame (white, tinted per story); layer 'back' = a painted sky panel with a
                     green hill and a cloud; layer 'floor' = the grass ledge inside (top at y 0.36) the little scene stands on.
  prop_st_stand      a farm crate plinth the cards stand on (2.6 x 1.3 x 1.0, top at y 1.3), a round cream badge on
                     its front; layers cloth_n1..cloth_n4 = one to four dots on the badge (dice style, shown per slot).
  prop_st_qmark      a chunky golden question mark (0.95 tall, dot at y 0), facing +z.
  prop_st_eggcrack   an egg (0.68 wide, 0.86 tall, base y 0) with a zigzag crack and a little beak poking out of a chip.
  prop_st_shell      the bottom half of a hatched egg: a hollow cup with a zigzag rim (base y 0, rim ~0.4).
  prop_st_shelltop   the top cap of the shell (rim at y 0, 0.42 tall), hollow, worn as a hat by the chick.
  prop_st_nest       a round straw nest (1.3 wide, 0.36 tall, the hollow's floor at y 0.14).
  prop_st_soil       a soil mound (1.1 wide, top at y 0.22) with a little seed dimple and pebbles.
  prop_st_sprout     a seedling: a short stem with two round seed leaves (0.4 tall, base y 0).
  prop_st_stem       a grown stem with two long leaves (top of the stem at y 0.95 for a bud or a bloom).
  prop_st_leafbed    a big leaf lying on the ground with its back half curling up toward you; layer cloth_eggs =
                     five tiny butterfly eggs on the curl.
  prop_st_caterpillar a plump green caterpillar with yellow spots, a code face and springy antennae (2.1 long, head
                     on the right turned toward you, feet on y 0).
  prop_st_branch     a twig arching out of the ground with three leaves (1.4 tall); layer cloth_cocoon = a chrysalis
                     hanging from it on bone 'cocoon' (swings).
  prop_st_applebite  a red apple (like prop_farmapple, 0.6 wide, centred) with a big bite out of its side.
  prop_st_foam       a ring of bath foam puffs sized for prop_metaltub (rim radius 0.95 at y 0.82): it sits on the
                     rim and leaves the middle open for whoever is in the bath.
  prop_st_core       an apple core (0.5 tall, centred): cream middle, red caps, stem and two pips."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

ONLY = [s for s in os.environ.get('ONLY', '').split(',') if s]
TAU = math.tau
WHITE, INK = 0xffffff, 0x3a2838


def fin(p, h0, h1, outline=0.022, tint=None):
    if not any(b[0] == 'body' for b in p.bones):
        p.bone('body', (0, h0, 0), (0, h1, 0))
    if tint is not None:
        p.extras['argMode'] = 'tint'
        p.extras['argDefault'] = tint
    p.extras['outline'] = outline
    p.build()


def slab_grid(p, fx, nu, nv, thick):
    """A closed thin slab from a parametric sheet fx(u, v) -> (x, y, z) (u, v in 0..1), thickness along y."""
    verts, faces = [], []
    for side in (0, 1):
        for i in range(nu + 1):
            for j in range(nv + 1):
                x, y, z = fx(i / nu, j / nv)
                verts.append((x, y + (thick if side else 0), z))
    S = (nu + 1) * (nv + 1)
    idx = lambda s, i, j: s * S + i * (nv + 1) + j
    for i in range(nu):
        for j in range(nv):
            faces.append((idx(0, i, j), idx(0, i, j + 1), idx(0, i + 1, j + 1), idx(0, i + 1, j)))
            faces.append((idx(1, i, j), idx(1, i + 1, j), idx(1, i + 1, j + 1), idx(1, i, j + 1)))
    for i in range(nu):   # the two long edges
        for j in (0, nv):
            faces.append((idx(0, i, j), idx(0, i + 1, j), idx(1, i + 1, j), idx(1, i, j)))
    for j in range(nv):   # the two ends
        for i in (0, nu):
            faces.append((idx(0, i, j), idx(1, i, j), idx(1, i, j + 1), idx(0, i, j + 1)))
    p.mesh(verts, faces)


# ---------------------------------------------------------------- the card and its stand
FW, FH, FD, FT = 2.4, 2.1, 0.5, 0.2     # frame width, height, half depth, border thickness
FLOOR = 0.36


def frame():
    p = Prop('prop_st_frame', base=WHITE, target_faces=2600, voxel=0.016)
    p.box((0, FT / 2, 0), (FW / 2, FT / 2, FD), bevel=0.08)
    p.box((0, FH - FT / 2, 0), (FW / 2, FT / 2, FD), bevel=0.08)
    for s in (-1, 1):
        p.box((s * (FW / 2 - FT / 2), FH / 2, 0), (FT / 2, FH / 2, FD), bevel=0.08)
    p.layer('back', base=0xa8dcff, target_faces=1400, voxel=0.012)
    p.box((0, FH / 2, -FD + 0.06), (FW / 2 - 0.12, FH / 2 - 0.12, 0.045), bevel=0.02)
    p.paint_fn(lambda q, n: q.y < 1.25, 0xc2e8ff)                                   # paler toward the horizon
    hill = lambda x: 0.62 + 0.22 * math.cos(x * 1.6 + 0.4)
    p.paint_fn(lambda q, n: q.y < hill(q.x), 0x9ed878)                              # a soft distant hill
    p.paint_fn(lambda q, n: q.y < hill(q.x) - 0.12 and q.x > 0.2, 0x8cce68)
    for (cx, cy, rx, ry) in [(-0.55, 1.62, 0.2, 0.11), (-0.38, 1.67, 0.17, 0.13), (-0.22, 1.61, 0.15, 0.09)]:
        p.paint(None, (cx, cy, -FD + 0.1), (rx, ry, 0.2), 0xffffff)                 # a little painted cloud
    p.layer('floor', base=0x86d35e, target_faces=900, voxel=0.014)
    p.box((0, (FT + FLOOR) / 2 - 0.02, 0.0), (FW / 2 - FT + 0.02, (FLOOR - FT) / 2 + 0.02, FD - 0.03), bevel=0.04)
    p.paint_fn(lambda q, n: n.z > 0.6, 0x6fbf4c)                                    # the front lip of the turf
    p.layer('skin')
    fin(p, 0, FH, 0.026, tint=0xffb84a)


def stand():
    W, H, D = 1.3, 1.3, 0.5
    WOOD, WOOD_D, WOOD_L = 0xd59a5c, 0xb77b42, 0xe6b071
    p = Prop('prop_st_stand', base=WOOD, target_faces=2600, voxel=0.016)
    # a crate: four planks across the front, posts at the corners, a lid plank on top
    for k in range(3):
        y = 0.22 + k * 0.4
        p.box((0, y, 0), (W - 0.08, 0.17, D - 0.03), bevel=0.05)
    for s in (-1, 1):
        p.box((s * (W - 0.1), H / 2, 0), (0.12, H / 2, D), bevel=0.06)
    p.box((0, H - 0.07, 0), (W, 0.08, D + 0.02), bevel=0.05)
    p.paint_fn(lambda q, n: abs(q.x) > W - 0.24, WOOD_D)
    p.paint_fn(lambda q, n: q.y > H - 0.16, WOOD_L)
    p.layer('badge', base=0xfff4dc, target_faces=500, voxel=0.01)
    p.cyl((0, 0.62, D - 0.02), 0.36, 0.08, rot=(90, 0, 0), bevel=0.03, seg=36)
    p.paint_fn(lambda q, n: math.hypot(q.x, q.y - 0.62) > 0.3, 0xffd889)
    # dice dots (one layer per count)
    R = 0.085
    dots = {1: [(0, 0)], 2: [(-0.12, 0.12), (0.12, -0.12)], 3: [(-0.15, 0.15), (0, 0), (0.15, -0.15)],
            4: [(-0.12, 0.12), (0.12, 0.12), (-0.12, -0.12), (0.12, -0.12)]}
    for n, pts in dots.items():
        p.layer('cloth_n%d' % n, base=0xff6a4a, target_faces=120 * n, voxel=0.008)
        for i, (x, y) in enumerate(pts):
            p.blob((x, 0.62 + y, D + 0.075), (R, R, 0.03), group='d%d' % i)
    p.layer('skin')
    fin(p, 0, H, 0.024)


def qmark():
    GOLD, GOLD_D = 0xffd23f, 0xf0a92a
    p = Prop('prop_st_qmark', base=GOLD, target_faces=1400, voxel=0.012)
    pts = [(-0.24, 0.66), (-0.2, 0.8), (-0.06, 0.9), (0.1, 0.89), (0.22, 0.8), (0.24, 0.66), (0.16, 0.54), (0.03, 0.46), (0.0, 0.34), (0.0, 0.3)]
    p.tube([(x, y, 0) for x, y in rounded(pts, 0.06, n=3)], 0.085, rseg=12)
    p.blob((0, 0.09, 0), (0.1, 0.1, 0.09), group='dot')
    p.paint_fn(lambda q, n: n.z < -0.3, GOLD_D)
    fin(p, 0, 0.95, 0.03)


# ---------------------------------------------------------------- egg and chick
EGG, EGG_D, EGG_IN = 0xfff4dc, 0xf0dcb6, 0xf2e2c4
EB, EC, ET = 0.43, 0.43, 0.47   # egg: lower semi-axis, centre height, upper semi-axis (radius 0.34)
ER = 0.34


def egg_r(y):
    """radius of the egg at height y (base at y 0)"""
    if y <= EC:
        t = (y - EC) / EB
    else:
        t = (y - EC) / ET
    return ER * math.sqrt(max(0.0, 1 - t * t)) * (1 - 0.06 * max(0, (y - EC) / ET))


def zig(a, n=7, amp=0.05):
    u = (a / TAU * n) % 1.0
    return amp * (1 - 4 * abs(u - 0.5)) - amp / 2


def shell_mesh(p, y_lo, y_hi_fn, cap_top, thick=0.04, nseg=56, rows=14):
    """a hollow egg piece between y_lo (or the pole) and a zigzag edge y_hi_fn(a). cap_top: piece is the top cap
    (the zigzag is its lower edge)."""
    verts, faces = [], []
    def ring_pts(off):
        out = []
        for j in range(rows + 1):
            row = []
            for i in range(nseg):
                a = TAU * i / nseg
                ye = y_hi_fn(a)
                if cap_top:
                    y = ye + (EC + ET - 0.002 - ye) * (j / rows) ** 0.8
                else:
                    y = 0.002 + (ye - 0.002) * (1 - (1 - j / rows) ** 1.25)
                r = max(0.0, egg_r(y) - off)
                row.append((r * math.sin(a), y, r * math.cos(a)))
            out.append(row)
        return out
    O, I = ring_pts(0), ring_pts(thick)
    def add(rows_):
        base = len(verts)
        for row in rows_:
            verts.extend(row)
        return base
    bo, bi = add(O), add(I)
    R = rows + 1
    for j in range(rows):
        for i in range(nseg):
            i2 = (i + 1) % nseg
            faces.append((bo + j * nseg + i, bo + j * nseg + i2, bo + (j + 1) * nseg + i2, bo + (j + 1) * nseg + i))
            faces.append((bi + j * nseg + i, bi + (j + 1) * nseg + i, bi + (j + 1) * nseg + i2, bi + j * nseg + i2))
    # the zigzag edge joins outer to inner
    e = 0 if cap_top else rows
    for i in range(nseg):
        i2 = (i + 1) % nseg
        faces.append((bo + e * nseg + i, bi + e * nseg + i, bi + e * nseg + i2, bo + e * nseg + i2))
    # the pole: close both skins
    pole = rows if cap_top else 0
    for b, yoff in ((bo, 0), (bi, -thick if cap_top else thick)):
        c = len(verts)
        yy = (EC + ET) if cap_top else 0.0
        verts.append((0, yy + yoff, 0))
        for i in range(nseg):
            faces.append((c, b + pole * nseg + (i + 1) % nseg, b + pole * nseg + i))
    p.mesh(verts, faces)


def eggcrack():
    p = Prop('prop_st_eggcrack', base=EGG, target_faces=2200, voxel=0.01)
    prof = [(0, 0)] + [(egg_r(y), y) for y in [0.01 + k * 0.03 for k in range(31)]] + [(0, EC + ET)]
    p.lathe(prof, seg=48)
    p.paint_fn(lambda q, n: n.y < -0.6, EGG_D)
    for (x, y) in [(-0.18, 0.28), (0.2, 0.2), (0.1, 0.72), (-0.22, 0.6)]:
        p.decal(None, (x, y), (0.035, 0.03, 0.2), 0xe7c79a)
    # a zigzag crack across the front and a chip near the top with a little orange beak poking out
    crack = lambda q: abs(q.y - (0.5 + 0.06 * (1 - 4 * abs(((q.x + 0.4) * 3.2) % 1 - 0.5)))) < 0.017
    p.paint_fn(lambda q, n: q.z > 0.05 and crack(q) and abs(q.x) < 0.3, 0x8a5a3a)
    p.paint_fn(lambda q, n: q.z > 0.05 and math.hypot(q.x - 0.06, q.y - 0.66) < 0.085, 0x5a3a2a)
    p.layer('beak', base=0xff9a2e, target_faces=150, voxel=0.006)
    z0 = egg_r(0.66) * math.cos(math.asin(min(1, 0.06 / egg_r(0.66))))
    p.blob((0.06, 0.66, z0 + 0.0), (0.05, 0.035, 0.07), rot=(-10, 0, 0), group='bk')
    p.layer('skin')
    fin(p, 0, 0.9, 0.022)


def shell():
    p = Prop('prop_st_shell', base=EGG, target_faces=2000, voxel=0.008)
    shell_mesh(p, 0, lambda a: 0.4 + zig(a), cap_top=False)
    p.paint_fn(lambda q, n: math.hypot(q.x, q.z) < egg_r(q.y) - 0.022, EGG_IN)
    for (x, y) in [(-0.18, 0.2), (0.17, 0.26)]:
        p.decal(None, (x, y), (0.035, 0.03, 0.2), 0xe7c79a)
    fin(p, 0, 0.45, 0.02)


def shelltop():
    p = Prop('prop_st_shelltop', base=EGG, target_faces=1600, voxel=0.008)
    Y0 = 0.48
    shell_mesh(p, None, lambda a: Y0 + zig(a + 0.3), cap_top=True)
    p.paint_fn(lambda q, n: math.hypot(q.x, q.z) < egg_r(q.y) - 0.022, EGG_IN)
    p.decal(None, (-0.1, 0.72), (0.03, 0.026, 0.2), 0xe7c79a)
    # origin = the rim's middle height
    p.bone('body', (0, Y0, 0), (0, EC + ET, 0))
    p.extras['outline'] = 0.02
    p.build()


def nest():
    STRAW, STRAW_D, STRAW_L, TWIG = 0xd9a650, 0xb98238, 0xf0cf7a, 0x9a6a3a
    p = Prop('prop_st_nest', base=STRAW, target_faces=2600, voxel=0.014)
    prof = rounded([(0, 0.0), (0.42, 0.0), (0.62, 0.14), (0.66, 0.28), (0.58, 0.36), (0.44, 0.32), (0.3, 0.18), (0.0, 0.14)], 0.07, n=4)
    p.lathe(prof, seg=48)
    p.paint_fn(lambda q, n: math.hypot(q.x, q.z) < 0.44 and q.y < 0.3, STRAW_D)
    # straw strands wound round the outside and the rim, in two tones
    p.layer('straw', base=STRAW_L, target_faces=2200, voxel=0.009)
    for k in range(7):
        y = 0.08 + k * 0.042
        r = 0.5 + 0.16 * math.sin(min(1, y / 0.28) * math.pi / 2) + 0.012
        tilt = 0.035 * (1 if k % 2 else -1)
        a0, a1 = k * 0.9, k * 0.9 + TAU * 0.62
        pts = [(r * math.sin(a), y + tilt * math.sin(a * 2 + k), r * math.cos(a)) for a in [a0 + (a1 - a0) * i / 30 for i in range(31)]]
        p.tube(pts, 0.022, rseg=6)
    p.paint_fn(lambda q, n: (int((math.atan2(q.x, q.z) + 4) * 3) % 3) == 0, STRAW)
    p.layer('twigs', base=TWIG, target_faces=500, voxel=0.009)
    for k, (a, y) in enumerate([(0.6, 0.3), (2.3, 0.26), (3.9, 0.31), (5.2, 0.24)]):
        r = 0.62
        c, s_ = math.cos(a), math.sin(a)
        t = (c, 0.05, -s_)
        p.tube([(r * s_ - 0.14 * t[0], y - 0.02, r * c - 0.14 * t[2]), (r * s_ + 0.16 * t[0], y + 0.03, r * c + 0.16 * t[2])], 0.02, rseg=6)
    p.layer('skin')
    fin(p, 0, 0.36, 0.022)


# ---------------------------------------------------------------- seed to flower
SOIL, SOIL_D, SOIL_L = 0x8d5a38, 0x6e4329, 0xa36c45
STEM, STEM_D, LEAF, LEAF_L = 0x5cbf4a, 0x46a03a, 0x6fd257, 0x9be77a


def soil():
    p = Prop('prop_st_soil', base=SOIL, target_faces=1800, voxel=0.012)
    prof = rounded([(0, 0.2), (0.12, 0.2), (0.17, 0.225), (0.3, 0.19), (0.5, 0.08), (0.58, 0.0), (0, 0.0)], 0.06, n=4)
    p.lathe(prof, scale=(1, 0.55), seg=48)
    for k, (x, z, r) in enumerate([(-0.3, 0.1, 0.1), (0.32, 0.05, 0.09), (0.1, -0.15, 0.08), (-0.14, -0.12, 0.09)]):
        p.blob((x, 0.1, z), (r, r * 0.7, r), group='lump%d' % k)
    p.paint_fn(lambda q, n: q.y > 0.15, SOIL_L)
    p.paint_fn(lambda q, n: math.hypot(q.x, q.z / 0.8) < 0.1 and q.y > 0.17, SOIL_D)   # the seed hole
    p.paint_fn(lambda q, n: q.y < 0.05, SOIL_D)
    p.layer('pebbles', base=0xd8cfc0, target_faces=300, voxel=0.008)
    for k, (x, z) in enumerate([(-0.42, 0.12), (0.45, -0.02), (0.22, 0.2)]):
        a = (x * 9 + z * 5)
        y = 0.13 if abs(x) < 0.3 else 0.05
        p.blob((x, y, z), (0.05, 0.035, 0.045), rot=(0, math.degrees(a), 0), group='p%d' % k)
    p.layer('skin')
    fin(p, 0, 0.25, 0.02)


def sprout():
    p = Prop('prop_st_sprout', base=STEM, target_faces=800, voxel=0.008)
    p.tube([(0, -0.02, 0), (0.01, 0.12, 0.0), (-0.01, 0.24, 0.01), (0, 0.32, 0.02)], [0.034, 0.03, 0.028, 0.026], rseg=10)
    p.layer('leaves', base=LEAF, target_faces=700, voxel=0.007)
    for s in (-1, 1):
        p.blob((s * 0.12, 0.38, 0.02), (0.12, 0.028, 0.075), rot=(0, 0, s * 28), group='l%d' % s)
    p.paint_fn(lambda q, n: n.y < -0.2, STEM_D)
    p.layer('skin')
    fin(p, 0, 0.42, 0.016)


def stem():
    p = Prop('prop_st_stem', base=STEM, target_faces=1200, voxel=0.009)
    p.tube([(0, -0.02, 0), (0.03, 0.3, 0.0), (-0.02, 0.62, 0.01), (0, 0.97, 0.0)], [0.045, 0.042, 0.04, 0.038], rseg=10)
    p.layer('leaves', base=LEAF, target_faces=1400, voxel=0.008)
    for s, y in ((-1, 0.28), (1, 0.5)):
        # a long soft leaf from the stem, curving up at the tip
        pts = [(s * 0.03, y, 0.02), (s * 0.18, y + 0.06, 0.04), (s * 0.32, y + 0.16, 0.05), (s * 0.4, y + 0.3, 0.04)]
        p.curve(pts, [0.03, 0.075, 0.07, 0.025], group='lf%d' % s, flat=0.35, per=5)
    p.paint_fn(lambda q, n: n.z < -0.3, 0x58b845)
    p.layer('skin')
    fin(p, 0, 1.0, 0.018)


# ---------------------------------------------------------------- caterpillar to butterfly
def leafbed():
    LB, LB_D, LB_V = 0x63c94f, 0x4fae40, 0xa6e889
    p = Prop('prop_st_leafbed', base=LB, target_faces=2400, voxel=0.01)
    L, W = 0.7, 0.42
    def sheet(u, v):
        x = -L + 2 * L * u
        w = W * math.sin(math.pi * u) ** 0.75 * (1 - 0.15 * u)
        z = (v * 2 - 1) * w
        back = max(0.0, -z - 0.02)
        y = 0.03 + back * back * 1.6 + 0.04 * math.sin(math.pi * u)
        z = z + back * back * 0.5
        return (x, y, z)
    slab_grid(p, sheet, 40, 16, 0.045)
    p.paint_fn(lambda q, n: n.y < -0.3, LB_D)
    # pale midrib and side veins on top
    p.paint_fn(lambda q, n: n.y > -0.3 and abs(q.z + 0.0) < 0.018 and q.x > -0.66, LB_V)
    for k in range(5):
        x0 = -0.45 + k * 0.22
        p.paint_fn(lambda q, n, x0=x0: n.y > -0.3 and abs((q.x - x0) - 0.55 * abs(q.z)) < 0.014 and 0.02 < abs(q.z) < 0.3, LB_V)
    p.layer('stalk', base=0x4fae40, target_faces=200, voxel=0.008)
    p.tube([(-0.66, 0.06, 0), (-0.78, 0.07, 0.02), (-0.86, 0.12, 0.05)], 0.025, rseg=8)
    p.layer('cloth_eggs', base=0xfff2c2, target_faces=400, voxel=0.006)
    for k, (x, z) in enumerate([(-0.16, -0.2), (0.0, -0.24), (0.16, -0.19), (-0.08, -0.1), (0.08, -0.09)]):
        y = 0.03 + max(0.0, -z - 0.02) ** 2 * 1.6 + 0.04 * math.sin(math.pi * (x + 0.7) / 1.4) + 0.045 + 0.04
        p.blob((x, y, z + max(0.0, -z - 0.02) ** 2 * 0.5), (0.055, 0.065, 0.055), group='e%d' % k)
    p.layer('skin')
    fin(p, 0, 0.3, 0.018)


def caterpillar():
    G1, G2, G_D, SPOT, FOOT = 0x8fdc52, 0x7acf45, 0x5fae38, 0xffd23f, 0x4f9a33
    SEGS = [(-1.0, 0.3, -0.05), (-0.62, 0.4, -0.02), (-0.22, 0.34, 0.03), (0.16, 0.42, 0.06)]
    HX, HY, HZ, HR = 0.64, 0.74, 0.12, 0.44
    SR = 0.28
    p = Prop('prop_st_caterpillar', base=G1, target_faces=3600, voxel=0.016)
    for i, (x, y, z) in enumerate(SEGS):
        r = SR + 0.025 * i
        p.blob((x, y, z), (r, r, r * 0.95), group='s%d' % i)
        for fz in (-1, 1):
            p.blob((x, 0.07, z + fz * 0.16), (0.075, 0.07, 0.085), group='f%d%d' % (i, fz))
    p.blob((HX, HY, HZ), (HR, HR * 0.95, HR * 0.92), group='head')
    for fz in (-1, 1):
        p.blob((0.56, 0.07, 0.1 + fz * 0.16), (0.075, 0.07, 0.085), group='hf%d' % fz)
    p.blob((0.54, 0.24, 0.1), (0.14, 0.16, 0.14), group='hneck')

    def nearest(q):
        best, bi = 9, -1
        for i, (x, y, z) in enumerate(SEGS):
            d = (q.x - x) ** 2 + (q.y - y) ** 2 + (q.z - z) ** 2
            if d < best:
                best, bi = d, i
        dh = (q.x - HX) ** 2 + (q.y - HY) ** 2 + (q.z - HZ) ** 2
        return 'h' if dh - HR * HR * 0.6 < best else bi
    for i, (x, y, z) in enumerate(SEGS):
        p.paint_fn(lambda q, n, i=i: q.y > 0.15 and nearest(q) == i and i % 2 == 1, G2)
        r = SR + 0.025 * i
        p.paint('spot%d' % i, (x, y + r * 0.72, z + r * 0.62), (0.085, 0.08, 0.09), SPOT)
    p.paint_fn(lambda q, n: q.y <= 0.15, FOOT)
    p.paint('belly', (0, 0.2, 0.2), (1.4, 0.08, 0.3), G_D, only=lambda q: q.y > 0.15 and q.x < 0.4)
    ANT = []
    for s in (-1, 1):
        base = (HX + s * 0.16, HY + 0.36, HZ - 0.05)
        mid = (HX + s * 0.24, HY + 0.58, HZ - 0.02)
        tip = (HX + s * 0.33, HY + 0.73, HZ + 0.02)
        p.curve([base, mid, tip], [0.038, 0.034, 0.03], group='ant%d' % s, per=5)
        p.blob(tip, (0.085, 0.085, 0.085), group='antb%d' % s)
        ANT.append((s, base, mid, tip))
    p.paint_fn(lambda q, n: q.y > HY + 0.66, 0xff8a5a)
    p.bone('body', (0, 0, 0), (0, 0.6, 0))
    p.bone('head', (HX, HY - 0.2, HZ), (HX, HY + 0.4, HZ), parent='body', group=['head', 'ant-1', 'ant1', 'antb-1', 'antb1'])
    for s, base, mid, tip in ANT:
        side = 'L' if s < 0 else 'R'
        p.chain('antenna.' + side, [base, mid, (tip[0] + s * 0.05, tip[1] + 0.12, tip[2])], 'head', group=['ant%d' % s, 'antb%d' % s])
    p.face(center=(HX, HY - 0.02, HZ), radius=HR * 0.92, bone='head', faceScale=1.0)
    p.extras['outline'] = 0.026
    p.build()


def branch():
    BARK, BARK_D = 0x9a6a42, 0x7a5030
    p = Prop('prop_st_branch', base=BARK, target_faces=1600, voxel=0.012)
    path = [(-0.62, -0.02, 0), (-0.6, 0.4, 0.0), (-0.52, 0.85, 0.0), (-0.36, 1.16, 0.0), (-0.12, 1.3, 0.0), (0.2, 1.33, 0.0), (0.5, 1.28, 0.0)]
    p.tube(path, [0.07, 0.065, 0.058, 0.05, 0.045, 0.04, 0.032], rseg=10)
    p.tube([(-0.55, 0.62, 0.0), (-0.36, 0.72, 0.02), (-0.24, 0.78, 0.03)], [0.035, 0.03, 0.025], rseg=8)
    p.paint_fn(lambda q, n: n.y < -0.4, BARK_D)
    p.layer('leaves', base=LEAF, target_faces=1400, voxel=0.008)
    for k, (pts, rr) in enumerate([
        ([(-0.24, 0.78, 0.03), (-0.12, 0.84, 0.05), (0.0, 0.84, 0.05), (0.1, 0.8, 0.04)], [0.02, 0.08, 0.075, 0.02]),
        ([(0.5, 1.28, 0.0), (0.6, 1.36, 0.02), (0.7, 1.4, 0.02), (0.8, 1.38, 0.0)], [0.02, 0.07, 0.065, 0.02]),
        ([(-0.3, 1.2, 0.0), (-0.38, 1.32, 0.02), (-0.42, 1.44, 0.03), (-0.4, 1.53, 0.02)], [0.02, 0.065, 0.06, 0.02]),
    ]):
        p.curve(pts, rr, group='lf%d' % k, flat=0.35, per=5)
    p.paint_fn(lambda q, n: n.z < -0.3, 0x58b845)
    p.layer('cloth_cocoon', base=0xc9b56a, target_faces=900, voxel=0.008)
    CX = 0.12
    p.tube([(CX, 1.31, 0.0), (CX, 1.2, 0.0)], 0.012, rseg=5)
    prof = rounded([(0, 1.22), (0.06, 1.2), (0.12, 1.1), (0.13, 0.96), (0.1, 0.84), (0.05, 0.76), (0.0, 0.73)], 0.03, n=3)
    p.lathe(prof, pos=(CX, 0, 0), seg=24)
    p.paint_fn(lambda q, n: q.y < 1.19 and abs(((q.y - 0.8) / 0.09) % 1 - 0.5) < 0.12, 0xa8944e)
    p.paint_fn(lambda q, n: q.y < 1.19 and q.x - CX < -0.07 and q.z > 0, 0xd8c785)
    p.layer('skin')
    is_c = lambda q: abs(q.x - CX) < 0.16 and q.y < 1.25 and q.y > 0.7
    p.bone('body', (-0.6, 0, 0), (-0.6, 1.0, 0), region=lambda q: not is_c(q))
    p.bone('cocoon', (CX, 1.3, 0), (CX, 0.75, 0), parent='body', region=is_c)
    p.extras['outline'] = 0.018
    p.build()


# ---------------------------------------------------------------- apple
APPLE_R, APPLE_IN = 0xf0453a, 0xfff1cf


def applebite():
    p = Prop('prop_st_applebite', base=APPLE_R, target_faces=1600, voxel=0.009, smooth=3)
    p.quadriflow = False
    prof = rounded([(0.0, 0.2), (0.07, 0.235), (0.17, 0.262), (0.27, 0.205), (0.312, 0.07), (0.3, -0.07), (0.245, -0.2),
                    (0.15, -0.262), (0.06, -0.255), (0.0, -0.235)], 0.06, n=4)
    # a dense lathe, then the bite: every point inside a tooth scoop is pushed onto the scoop's surface (a clean
    # scalloped notch out of the right side that shows in the silhouette)
    dense = []
    for i in range(len(prof) - 1):
        a, b = prof[i], prof[i + 1]
        for k in range(4):
            t = k / 4
            dense.append((a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t))
    dense.append(prof[-1])
    BITES = [(0.36, 0.09, 0.05, 0.15), (0.37, -0.09, 0.03, 0.15), (0.3, 0.0, 0.2, 0.12)]
    seg, n = 72, len(dense)
    verts, faces = [], []
    for i in range(seg):
        a = TAU * i / seg
        for r, y in dense:
            v = [r * math.sin(a), y, r * math.cos(a)]
            for (cx, cy, cz, rr) in BITES:
                d = [v[0] - cx, v[1] - cy, v[2] - cz]
                L = math.sqrt(d[0] ** 2 + d[1] ** 2 + d[2] ** 2)
                if L < rr and L > 1e-6:
                    v = [cx + d[0] / L * rr, cy + d[1] / L * rr, cz + d[2] / L * rr]
            verts.append(tuple(v))
    for i in range(seg):
        j = (i + 1) % seg
        for k in range(n - 1):
            faces.append((i * n + k, j * n + k, j * n + k + 1, i * n + k + 1))
    for k in (0, n - 1):
        c = len(verts); verts.append((0, dense[k][1], 0))
        for i in range(seg):
            faces.append((c, i * n + k, ((i + 1) % seg) * n + k))
    p.mesh(verts, faces)
    inbite = lambda q: any(math.sqrt((q.x - x) ** 2 + (q.y - y) ** 2 + (q.z - z) ** 2) < r + 0.012 for (x, y, z, r) in BITES)
    p.paint_fn(lambda q, n: inbite(q), APPLE_IN)
    p.paint_fn(lambda q, n: q.y < -0.215 and math.hypot(q.x, q.z) < 0.13, 0xc83a30)
    p.layer('stem', base=0x7a4a26, target_faces=80, voxel=0.008)
    p.tube([(0, 0.17, 0), (0.008, 0.26, 0), (0.035, 0.34, 0)], [0.028, 0.024, 0.02], rseg=8)
    p.layer('leaf', base=0x5cc45a, target_faces=120, voxel=0.008)
    p.blob((-0.1, 0.315, 0.02), (0.1, 0.022, 0.055), rot=(8, 10, -22), group='leaf')
    p.layer('skin')
    p.bone('body', (0, -0.26, 0), (0, 0.26, 0))
    p.extras['outline'] = 0.016
    p.build()


def core():
    p = Prop('prop_st_core', base=APPLE_IN, target_faces=1200, voxel=0.009, smooth=3)
    prof = rounded([(0, -0.26), (0.2, -0.25), (0.24, -0.18), (0.13, -0.1), (0.09, 0.0), (0.13, 0.1), (0.24, 0.18), (0.2, 0.25), (0, 0.26)], 0.04, n=3)
    p.lathe(prof, seg=36)
    p.paint_fn(lambda q, n: abs(q.y) > 0.16 and (n.y * (1 if q.y > 0 else -1) > -0.2 or abs(q.y) > 0.2), APPLE_R)
    p.paint_fn(lambda q, n: abs(q.y) < 0.16 and math.hypot(q.x, q.z) > 0.17, 0xffe6b0)
    for s in (-1, 1):
        p.decal(None, (s * 0.035, 0.02), (0.025, 0.04, 0.2), 0x5a3a2a)
    p.layer('stem', base=0x7a4a26, target_faces=80, voxel=0.008)
    p.tube([(0, 0.24, 0), (0.01, 0.32, 0), (0.04, 0.39, 0)], [0.026, 0.022, 0.018], rseg=8)
    p.layer('skin')
    p.bone('body', (0, -0.26, 0), (0, 0.26, 0))
    p.extras['outline'] = 0.016
    p.build()


def foam():
    p = Prop('prop_st_foam', base=0xffffff, target_faces=1800, voxel=0.014)
    for k in range(11):
        a = k / 11 * TAU + 0.2
        r = 0.78 + 0.06 * math.sin(k * 2.3)
        sz = 0.2 + 0.05 * ((k * 7) % 3) / 2
        p.blob((r * math.sin(a), 0.86 + 0.05 * math.sin(k * 1.7), r * math.cos(a)), (sz, sz * 0.85, sz), group='f')
    for k, (x, y, z, r) in enumerate([(-0.5, 1.08, -0.45, 0.17), (0.42, 1.1, -0.5, 0.15), (0.65, 1.02, 0.25, 0.13)]):
        p.blob((x, y, z), (r, r, r), group='f')
    p.paint_fn(lambda q, n: n.y < -0.2, 0xdfeaf7)
    p.layer('shine', base=0xcfe8ff, target_faces=300, voxel=0.008)
    for k in range(5):
        a = k / 5 * TAU + 0.6
        p.blob((0.8 * math.sin(a) - 0.05, 1.02, 0.8 * math.cos(a) + 0.06), (0.05, 0.05, 0.03), group='s%d' % k)
    p.layer('skin')
    fin(p, 0.7, 1.2, 0.02)


MODELS = dict(prop_st_foam=foam, prop_st_frame=frame, prop_st_stand=stand, prop_st_qmark=qmark, prop_st_eggcrack=eggcrack, prop_st_shell=shell,
              prop_st_shelltop=shelltop, prop_st_nest=nest, prop_st_soil=soil, prop_st_sprout=sprout, prop_st_stem=stem,
              prop_st_leafbed=leafbed, prop_st_caterpillar=caterpillar, prop_st_branch=branch, prop_st_applebite=applebite,
              prop_st_core=core)
for name, fn in MODELS.items():
    if not ONLY or name in ONLY:
        fn()
