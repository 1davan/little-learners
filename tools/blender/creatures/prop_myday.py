"""My day (Home world): the bathroom and bedroom things the bunny uses in its routines. One script, many models
(ONLY=prop_md_sink,prop_md_soap tools/blender/build.sh prop_myday builds a subset). Everything faces +z, origin on the
floor / under the middle unless noted. Tintable models (argMode 'tint') are painted white / light grey where the
game's colour should show.

  prop_md_sink      pedestal washbasin (bowl rim y 1.84, 2.5 x 1.9, floor y 1.38, steep thin back wall so Bunny's paws
                    reach inside), a soap dish ear (x +1.46) and a cup ear (x -1.46), a chrome pillar tap on the back-right
                    corner with a low spout reaching to the back-middle of the bowl, a towel bar under the front. Anchors: spout (water leaves here), knob (where prop_md_knob sits), soap, cup, towel.
  prop_md_knob      the chrome cross-head tap handle with a blue cap (origin = its foot; the game spins it about y)
  prop_md_stool     a little wooden step stool (top y 0.5) with a yellow star on the front
  prop_md_soap      a chunky bar of soap with a heart pressed in it (tint)
  prop_md_brush     a toddler toothbrush lying along x (head at +x, bristles up); layer 'paste' = a stripy blob of
                    toothpaste on the bristles (the game shows it)
  prop_md_paste     a toothpaste tube lying along x, cap at +x
  prop_md_cup       a tooth mug (r 0.27, 0.55 tall, tint) with a handle
  prop_md_towel     a thick terry hand towel folded over a bar: origin on the fold (the bar), hangs 1.3 down (tint), rolled
                    hems, a stitched woven band across the front (layer 'hem'), a hanging loop (layer 'loop')
  prop_md_towelwrap the same towel bundled round two paws (drying), origin in the middle of the bundle (tint)
  prop_md_bath      a clawfoot bath 4.3 x 1.9, rim y 1.42, hollow (floor inside y 0.6), gold feet, a chrome tap at -x.
                    Anchors: spout, knob
  prop_md_bottle    a bubble-bath bottle (tint) with a bubbly label
  prop_md_tissues   a tissue box (tint) with polka dots, a tissue puffing out of the slot (layer 'tissue')
  prop_md_tissue    one soft tissue (centre on the origin)
  prop_md_bin       a pedal bin (tint), hollow; prop_md_binlid is its lid (origin on the back hinge; rotation.x opens it)
  prop_md_hairbrush a paddle hairbrush along x (bristles facing +z)
  prop_md_bed       a toddler bed along x: headboard at -x with a moon, mattress top y 1.05, pillow (layer 'pillow')
  prop_md_duvet     a puffy star duvet 3.4 x 2.3 (tint), origin at its bottom centre
  prop_md_table     a bedside table, top y 1.4
  prop_md_clock     a twin-bell alarm clock, 1.0 tall
  prop_md_lamp      a mushroom bedside lamp; layer 'shade' (the game draws it glowing)
  prop_md_drape     a pleated curtain panel, unit size: hangs from y 1 to 0, x -0.5..0.5 (tint; the game scales x to open)
"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded, star_poly, circle_poly

ONLY = [s for s in os.environ.get('ONLY', '').split(',') if s]
TAU = math.tau
WHITE, CERAMIC, CER_D = 0xffffff, 0xf7fbff, 0xd8e6f2
CHROME, CHROME_D, CHROME_L = 0xd5dee8, 0xa3afbf, 0xf4f8fc
WOOD, WOOD_D = 0xe9b47c, 0xc98f58
GOLD, GOLD_D = 0xffc93a, 0xe0a21f
INKY = 0x4a3a5a


def tinted(p, default, outline=0.022):
    p.extras['argMode'] = 'tint'
    p.extras['argDefault'] = default
    p.extras['outline'] = outline


def done(p, top, outline=0.022):
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, max(0.3, top), 0))
    if 'outline' not in p.extras:
        p.extras['outline'] = outline
    p.build()


def heart_poly(r):
    pts = []
    for i in range(40):
        t = i / 40 * TAU
        x = 16 * math.sin(t) ** 3
        y = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
        pts.append((x / 17 * r, y / 17 * r))
    return pts


def in_poly(x, y, poly):
    c = False
    n = len(poly)
    for i in range(n):
        x1, y1 = poly[i]; x2, y2 = poly[(i + 1) % n]
        if (y1 > y) != (y2 > y) and x < x1 + (y - y1) * (x2 - x1) / (y2 - y1):
            c = not c
    return c


STAR = star_poly(1.0, inner=0.48)


def in_star(x, y, r):
    return in_poly(x / r, y / r, STAR)


# ------------------------------------------------------------------ bathroom
def sink():
    """Rebuilt for the washing pose: a toddler-height basin whose BACK wall is thin and nearly upright, so Bunny on its
    step stool can lean its tummy on the back rim and put both paws right down inside the bowl, under the water. The tap
    stands on the back-right corner and its low spout reaches across to just above the paws (clear of Bunny's chin)."""
    SZ = 0.77                            # the bowl's depth (z) vs its width (x)
    TX, TZ = 1.02, -0.46                 # the tap's pillar (back-right corner of the rim)
    SPX, SPZ = 0.0, -0.6                 # where the spout pours (over the paws, near the back)
    p = Prop('prop_md_sink', base=CERAMIC, target_faces=2800, voxel=0.017)
    # pedestal: a waisted column flaring into the bowl
    p.lathe(rounded([(0, 0), (0.55, 0), (0.55, 0.08), (0.4, 0.2), (0.31, 0.7), (0.32, 1.02), (0.5, 1.12), (0, 1.12)], 0.06, n=3), seg=40)
    # the bowl: underside, over a slim rolled rim and straight down a steep inner wall to a flat floor and the plughole
    bowl = rounded([(0, 1.08), (0.5, 1.1), (0.9, 1.2), (1.12, 1.38), (1.21, 1.58), (1.24, 1.76), (1.2, 1.84), (1.13, 1.84),
                    (1.1, 1.74), (1.07, 1.56), (0.96, 1.44), (0.6, 1.39), (0, 1.38)], 0.05, n=4)
    p.lathe(bowl, scale=(1, SZ), seg=80)
    # a dish 'ear' each side: soap (+x) and cup (-x)
    for s in (-1, 1):
        p.lathe(rounded([(0, 1.6), (0.22, 1.62), (0.33, 1.75), (0.32, 1.8), (0.25, 1.8), (0.21, 1.73), (0, 1.71)], 0.03, n=3),
                pos=(s * 1.46, 0, 0.05), seg=36)
    # a raised pad on the back-right corner of the rim for the tap
    p.cyl((TX, 1.76, TZ), 0.19, 0.09, r2=0.17, bevel=0.04, scale=(1.0, 0.9), seg=28)
    # paint: a soft blue inside the bowl and the dishes (depth), a chrome plughole
    def inside(q, n):
        r = math.hypot(q.x, q.z / SZ)
        return q.y > 1.34 and q.y < 1.83 and r < 1.11 and n.y > -0.2 and (n.x * q.x + n.z * q.z / SZ) < 0.3
    p.paint_fn(inside, CER_D)
    p.paint_fn(lambda q, n: any(q.y > 1.64 and q.y < 1.785 and math.hypot(q.x - s * 1.46, q.z - 0.05) < 0.23 and n.y > 0.2 for s in (-1, 1)), CER_D)
    p.paint_fn(lambda q, n: q.y < 0.09, CER_D)
    # chrome tap on the back-right corner: a short pillar and a low spout reaching across to the middle-back of the bowl
    p.layer('chrome', base=CHROME, target_faces=1000, voxel=0.011)
    # (and a neat round chrome plughole on the bowl's floor, with a dark middle)
    p.cyl((0, 1.37, 0.0), 0.12, 0.045, bevel=0.015, seg=28)
    p.cyl((TX, 1.83, TZ), 0.12, 0.06, r2=0.11, bevel=0.025, seg=28)
    p.cyl((TX, 1.86, TZ), 0.085, 0.24, bevel=0.02, seg=24)
    spout = rounded([(TX, 2.0, TZ), (TX - 0.1, 2.1, TZ - 0.02), (0.55, 2.12, (TZ + SPZ) / 2), (SPX + 0.12, 2.08, SPZ), (SPX, 1.98, SPZ)], 0.12, n=6)
    p.tube(spout, 0.055, rseg=14)
    p.cyl((SPX, 1.93, SPZ), 0.065, 0.07, r2=0.07, bevel=0.015, seg=18)
    # a towel bar across the front, under the bowl (the hand towel hangs on it)
    FZ = 1.0
    p.tube(rounded([(-0.62, 1.3, 0.55), (-0.62, 1.22, FZ), (0.62, 1.22, FZ), (0.62, 1.3, 0.55)], 0.1, n=5), 0.042, rseg=10)
    for s in (-1, 1):
        p.cyl((s * 0.62, 1.27, 0.55), 0.07, 0.08, bevel=0.02, seg=14)
    p.paint_fn(lambda q, n: n.y < -0.35 or (n.x * n.x > 0.6 and q.y < 1.99 and q.y > 1.5), CHROME_D)
    p.paint_fn(lambda q, n: n.y > 0.75 and q.y > 2.06, CHROME_L)
    p.layer('drain', base=0x5f6878, target_faces=200, voxel=0.006)
    p.cyl((0, 1.405, 0.0), 0.06, 0.012, bevel=0.005, seg=24)
    p.layer('skin')
    p.anchor('spout', (SPX, 1.92, SPZ), 'body')
    p.anchor('knob', (TX, 2.1, TZ), 'body')
    p.anchor('soap', (1.46, 1.74, 0.05), 'body')
    p.anchor('towel', (0, 1.22, FZ), 'body')
    p.anchor('cup', (-1.46, 1.74, 0.05), 'body')
    done(p, 1.84, 0.022)


def knob():
    # a fat chrome cross-head: a flared foot, four plump arms ending in round balls, a domed centre and a big round
    # blue 'cold' cap on top (chunky parts so the ink stays a normal weight round them)
    p = Prop('prop_md_knob', base=CHROME, target_faces=2600, voxel=0.006)
    p.cyl((0, 0, 0), 0.075, 0.07, r2=0.06, bevel=0.025, seg=24)
    for a in (0, 90):
        r = math.radians(a)
        p.capsule((-0.17 * math.cos(r), 0.085, -0.17 * math.sin(r)), (0.17 * math.cos(r), 0.085, 0.17 * math.sin(r)), 0.045, group='arm%d' % a)
        for s in (-1, 1):
            p.blob((s * 0.2 * math.cos(r), 0.085, s * 0.2 * math.sin(r)), (0.065, 0.06, 0.065), group='end%d%d' % (a, s))
    p.lathe(rounded([(0, 0.05), (0.1, 0.05), (0.1, 0.11), (0.07, 0.15), (0, 0.155)], 0.03, n=3), seg=28)
    p.paint_fn(lambda q, n: n.y < -0.3, CHROME_D)
    p.paint_fn(lambda q, n: n.y > 0.6 and q.y > 0.1 and math.hypot(q.x, q.z) > 0.15, CHROME_L)
    p.layer('cap', base=0x4a9bff, target_faces=400, voxel=0.005)
    p.lathe(rounded([(0, 0.145), (0.065, 0.145), (0.065, 0.16), (0.04, 0.18), (0, 0.183)], 0.012, n=3), seg=24)
    p.paint_fn(lambda q, n: n.y > 0.5 and math.hypot(q.x + 0.02, q.z - 0.02) < 0.016, 0xcfe6ff)       # little glint
    done(p, 0.18, 0.008)


def stool():
    p = Prop('prop_md_stool', base=WOOD, target_faces=1600, voxel=0.016)
    p.box((0, 0.44, 0), (0.62, 0.07, 0.4), bevel=0.06)              # top
    for s in (-1, 1):
        p.box((s * 0.5, 0.2, 0), (0.08, 0.22, 0.36), bevel=0.05)     # side panels
    p.box((0, 0.27, 0.3), (0.45, 0.12, 0.05), bevel=0.04)           # front panel
    p.paint_fn(lambda q, n: n.y < -0.4, WOOD_D)
    p.layer('star', base=GOLD, target_faces=200, voxel=0.008)
    poly = [(x * 0.13, y * 0.13 + 0.27) for x, y in STAR]
    verts, faces = [], []
    for k, z in enumerate((0.34, 0.375)):
        for x, y in poly:
            verts.append((x, y, z))
    n = len(poly)
    faces = [tuple(range(n)), tuple(range(2 * n - 1, n - 1, -1))] + [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)]
    p.mesh(verts, faces)
    done(p, 0.5, 0.02)


def soap():
    # a rounded bar of soap with a raised oval rim embossed on top, a heart pressed into the oval, and two bubbles
    p = Prop('prop_md_soap', base=WHITE, target_faces=2400, voxel=0.008)
    p.box((0, 0.11, 0), (0.29, 0.11, 0.19), bevel=0.1)
    p.blob((0, 0.12, 0), (0.25, 0.1, 0.16), group='puff')
    p.ring((0, 0.215, 0), 0.17, 0.018, seg=48, rseg=8, scale=(1.0, 0.62))           # embossed oval
    H = heart_poly(0.08)
    p.paint_fn(lambda q, n: n.y > 0.7 and in_poly(q.x, -q.z + 0.008, H), 0xe2e2e2)
    p.paint_fn(lambda q, n: n.y > 0.4 and abs(math.hypot(q.x / 1.0, q.z / 0.62) - 0.17) < 0.022 and q.y > 0.2, 0xf6f6f6)
    p.paint_fn(lambda q, n: n.y < -0.5, 0xe0e0e0)
    p.layer('bubbles', base=0xf4fbff, target_faces=700, voxel=0.006)
    for (x, y, z, r) in ((0.22, 0.27, 0.1, 0.06), (0.3, 0.2, -0.02, 0.04)):
        p.blob((x, y, z), (r, r, r), group='b%d' % int(r * 100))
    p.paint_fn(lambda q, n: n.x < -0.2 and n.y > 0.4, 0xffffff)
    p.layer('skin')
    tinted(p, 0xff9ec8, 0.016)
    done(p, 0.22)


def brush():
    p = Prop('prop_md_brush', base=WHITE, target_faces=1100, voxel=0.01)
    # chunky handle along x (head end at +x), a soft grip bulb, neck rising a touch to the head
    path = [(-0.52, 0.06, 0), (-0.2, 0.06, 0), (0.12, 0.07, 0), (0.28, 0.09, 0), (0.48, 0.09, 0)]
    p.tube(path, [0.075, 0.075, 0.05, 0.045, 0.05], rseg=12)
    p.blob((-0.36, 0.065, 0), (0.17, 0.08, 0.085), group='grip')
    p.box((0.43, 0.09, 0), (0.12, 0.035, 0.06), bevel=0.03)
    p.paint_fn(lambda q, n: q.x < -0.18 and q.x > -0.52 and math.sin(q.x * 40) > 0.5, 0xdcdcdc)
    p.layer('bristles', base=0xffffff, target_faces=500, voxel=0.008)
    for i in range(4):
        for j in (-1, 1):
            x = 0.34 + i * 0.058
            p.box((x, 0.165, j * 0.024), (0.022, 0.05, 0.022), bevel=0.012)
    p.paint_fn(lambda q, n: int(round((q.x - 0.34) / 0.058)) % 2 == 0, 0x7fd0ff)
    p.layer('paste', base=0xffffff, target_faces=400, voxel=0.008)
    for i in range(5):
        x = 0.33 + i * 0.045
        p.blob((x, 0.235 + 0.02 * math.sin(i * 1.7), 0), (0.04, 0.035, 0.045), group='paste')
    p.paint_fn(lambda q, n: abs(math.sin((q.x - 0.33) * 50 + q.y * 30)) > 0.7, 0x4fd1c5)
    tinted(p, 0x7ad16b, 0.014)
    done(p, 0.2)


def paste():
    p = Prop('prop_md_paste', base=WHITE, target_faces=1100, voxel=0.01)
    # a soft tube lying along x: round at the shoulder (+x), flattening to a crimped seal at -x
    for i in range(9):
        t = i / 8
        x = -0.42 + 0.72 * t
        p.blob((x, 0.1, 0), (0.06, 0.03 + 0.07 * (t ** 0.5), 0.13 + 0.01 * (1 - t)), group='tube')
    p.box((-0.45, 0.07, 0), (0.035, 0.025, 0.15), bevel=0.015)          # crimp
    p.cyl((0.3, 0.1, 0), 0.1, 0.06, rot=(0, 0, -90), bevel=0.02, seg=20)  # shoulder
    p.paint_fn(lambda q, n: q.x > -0.15 and q.x < 0.05 and n.y > -0.2, 0x4fa8ff)
    p.paint_fn(lambda q, n: q.x > -0.12 and q.x < 0.02 and abs(q.z) < 0.05 and n.y > 0.6, 0xffffff)
    p.paint_fn(lambda q, n: q.x < -0.42, 0xe5e5e5)
    p.layer('cap', base=0xff5a7a, target_faces=400, voxel=0.008)
    p.cyl((0.36, 0.1, 0), 0.075, 0.12, rot=(0, 0, -90), bevel=0.03, seg=18)
    p.paint_fn(lambda q, n: math.sin(math.atan2(q.y - 0.1, q.z) * 8) > 0.6 and q.x < 0.47, 0xe8406a)
    done(p, 0.2, 0.014)


def cup():
    p = Prop('prop_md_cup', base=WHITE, target_faces=1300, voxel=0.012)
    R, H, T = 0.27, 0.55, 0.045
    p.lathe(rounded([(0, 0), (R - 0.03, 0), (R, 0.05), (R + 0.01, H), (R - T, H), (R - T, 0.07), (0, 0.07)], 0.025, n=3), seg=40)
    p.tube(rounded([(R - 0.01, 0.42, 0), (R + 0.17, 0.42, 0), (R + 0.17, 0.16, 0), (R - 0.01, 0.16, 0)], 0.08, n=4), 0.04, rseg=10)
    p.paint_fn(lambda q, n: math.hypot(q.x, q.z) < R - T + 0.02 and q.y > 0.06 and q.y < H - 0.02, 0xd8d8d8)
    p.layer('deco', base=0xffffff, target_faces=1400, voxel=0.0028)                 # a clean, finely meshed star sticker
    p.sticker(star_poly(0.11, inner=0.52, soft=4), 0.27, lambda y: R + 0.01 * y / H, thick=0.016, lift=0.004)
    tinted(p, 0xffb020, 0.016)
    done(p, H)


def sheet(p, F, nu=16, nv=16, thick=0.08, hem=None, bevel=0):
    """A soft thick cloth sheet: F(u, v) -> (x, y, z) for u, v in 0..1 gives the middle surface; the sheet is offset
    +-thick/2 along its normal and closed round the edge (the voxel remesh rounds it into a pillowy hem). hem: a list
    of edges ('u0', 'u1', 'v0', 'v1') that get a soft rolled tube (thick * 0.62)."""
    def nrm(u, v):
        e = 1e-3
        a = F(min(1, u + e), v); b = F(max(0, u - e), v)
        c = F(u, min(1, v + e)); d = F(u, max(0, v - e))
        du = [a[i] - b[i] for i in range(3)]; dv = [c[i] - d[i] for i in range(3)]
        n = (du[1] * dv[2] - du[2] * dv[1], du[2] * dv[0] - du[0] * dv[2], du[0] * dv[1] - du[1] * dv[0])
        L = math.sqrt(sum(x * x for x in n)) or 1
        return [x / L for x in n]
    verts = []
    for side in (-1, 1):
        for i in range(nu + 1):
            for j in range(nv + 1):
                u, v = i / nu, j / nv
                q = F(u, v); n = nrm(u, v)
                verts.append(tuple(q[k] + side * n[k] * thick / 2 for k in range(3)))
    idx = lambda s_, i, j: s_ * (nu + 1) * (nv + 1) + i * (nv + 1) + j
    faces = []
    for i in range(nu):
        for j in range(nv):
            faces.append((idx(1, i, j), idx(1, i + 1, j), idx(1, i + 1, j + 1), idx(1, i, j + 1)))
            faces.append((idx(0, i, j), idx(0, i, j + 1), idx(0, i + 1, j + 1), idx(0, i + 1, j)))
    for i in range(nu):
        faces.append((idx(0, i, nv), idx(0, i + 1, nv), idx(1, i + 1, nv), idx(1, i, nv)))
        faces.append((idx(0, i + 1, 0), idx(0, i, 0), idx(1, i, 0), idx(1, i + 1, 0)))
    for j in range(nv):
        faces.append((idx(0, 0, j + 1), idx(0, 0, j), idx(1, 0, j), idx(1, 0, j + 1)))
        faces.append((idx(0, nu, j), idx(0, nu, j + 1), idx(1, nu, j + 1), idx(1, nu, j)))
    p.mesh(verts, faces, bevel=bevel)
    for e in hem or ():
        if e[0] == 'u':
            u = 0.0 if e == 'u0' else 1.0
            path = [F(u, j / nv) for j in range(nv + 1)]
        else:
            v = 0.0 if e == 'v0' else 1.0
            path = [F(i / nu, v) for i in range(nu + 1)]
        p.tube(path, thick * 0.62, rseg=10)


def hanging(W, Lf, Lb, R=0.1, folds=0.055, flare=0.04):
    """The middle surface of a towel folded over a round bar (origin on the bar): u runs across (x), v runs from the
    bottom of the back panel (0) up over the bar and down to the bottom of the front panel (1). Soft vertical S-folds
    that deepen toward the hems, a slightly curved bottom hem, the front panel longer than the back."""
    Ltot = Lb + math.pi * R + Lf
    def F(u, v):
        x0 = -W + 2 * W * u
        s = v * Ltot
        if s < Lb:                                  # back panel, hanging down behind the bar
            d = Lb - s; y = -d; z = -R
            f = d / Lb
            side = -1
        elif s < Lb + math.pi * R:                  # round over the bar
            a = (s - Lb) / R                        # 0..pi, from the back over the top to the front
            y = R * math.sin(a) * 0.9; z = -R * math.cos(a)
            f = 0; side = 0
        else:                                       # front panel
            d = s - Lb - math.pi * R; y = -d; z = R
            f = d / Lf
            side = 1
        # folds: soft waves across, deepening down the panel; the hem dips a touch in the middle
        w = folds * (0.35 + f) * math.sin(x0 / W * math.pi * 2.2 + 0.6 * side) + folds * 0.5 * f * math.sin(x0 / W * math.pi * 4.1 + 1.3)
        z += side * (w + flare * f * f) if side else 0
        y -= 0.05 * f * math.cos(x0 / W * math.pi / 2)
        x = x0 * (1 - 0.05 * (1 - f) + 0.03 * f)          # bunched a little at the bar, opening toward the hem
        return (x, y, z)
    return F


def towel():
    """A thick terry hand towel folded over a bar (origin on the bar): front panel longer than the back, soft S-folds
    that deepen toward the rolled hem, a woven cream band with stitching across the front near the bottom."""
    p = Prop('prop_md_towel', base=WHITE, target_faces=2800, voxel=0.011)
    W, Lf, Lb = 0.5, 0.95, 0.62
    F = hanging(W, Lf, Lb, R=0.07, folds=0.08, flare=0.05)
    sheet(p, F, nu=18, nv=40, thick=0.085, hem=('u0', 'u1', 'v0', 'v1'))
    p.paint_fn(lambda q, n: q.z < -0.03 and n.z < -0.3, 0xe6e6e6)       # the back panel's inside a shade darker
    # the woven band near the bottom of the front panel (cream, untinted), following the folds
    Ltot = Lb + math.pi * 0.07 + Lf
    v0 = (Lb + math.pi * 0.07 + Lf * 0.72) / Ltot; v1 = (Lb + math.pi * 0.07 + Lf * 0.84) / Ltot
    p.layer('hem', base=0xfffaf0, target_faces=700, voxel=0.009)
    p.quadriflow = False
    def B(u, v):
        x, y, z = F(-0.01 + 1.02 * u, v0 + (v1 - v0) * v)
        return (x, y, z + 0.05)
    sheet(p, B, nu=18, nv=3, thick=0.03)
    tinted(p, 0x5fc8a8, 0.016)
    done(p, 0.2, 0.016)


def bigtowel():
    """The big bath towel folded over the bath's rolled rim (origin on the rim): wide, front drop longer than the back,
    deep soft folds, a cream band with stitching near the bottom."""
    p = Prop('prop_md_bigtowel', base=WHITE, target_faces=3200, voxel=0.013)
    W, Lf, Lb = 0.62, 0.95, 0.5
    F = hanging(W, Lf, Lb, R=0.1, folds=0.1, flare=0.07)
    sheet(p, F, nu=20, nv=40, thick=0.1, hem=('u0', 'u1', 'v0', 'v1'))
    p.paint_fn(lambda q, n: q.z < -0.04 and n.z < -0.3, 0xe6e6e6)
    Ltot = Lb + math.pi * 0.1 + Lf
    v0 = (Lb + math.pi * 0.1 + Lf * 0.7) / Ltot; v1 = (Lb + math.pi * 0.1 + Lf * 0.83) / Ltot
    p.layer('hem', base=0xfffaf0, target_faces=800, voxel=0.01)
    p.quadriflow = False
    def B(u, v):
        x, y, z = F(-0.01 + 1.02 * u, v0 + (v1 - v0) * v)
        return (x, y, z + 0.06)
    sheet(p, B, nu=20, nv=3, thick=0.035)
    tinted(p, 0xffa64a, 0.018)
    done(p, 0.2, 0.018)


def bathcape():
    """The big bath towel wrapped round Bunny's shoulders while drying (origin at Bunny's feet, Bunny's size 1.45): it
    goes round the back from shoulder to shoulder at the neck, falls in soft folds to the knees, and the two front edges
    hang down either side of the tummy (the tummy and paws stay out in front)."""
    p = Prop('prop_md_bathcape', base=WHITE, target_faces=3200, voxel=0.013)
    TOP, BOT = 1.52, 0.34                     # at the neck, at the hem
    SH = 0.3                                  # the share of the length that goes over the shoulders
    def F(u, v):
        a = math.radians(-140 + 280 * u)      # round the body; 0 = straight back, +-140 = the two front edges
        if v < SH:                            # over the rounded shoulders, from the neck out and down
            t = v / SH
            r = 0.46 + 0.42 * math.sin(t * math.pi / 2)
            y = TOP - 0.34 * (1 - math.cos(t * math.pi / 2))
        else:                                 # then falling in soft folds, flaring a little to the hem
            t = (v - SH) / (1 - SH)
            r = 0.88 + 0.1 * t + 0.06 * t * math.sin(a * 6 + 0.5)
            y = TOP - 0.34 - (TOP - 0.34 - BOT) * t
        front = max(0.0, (abs(a) - math.radians(95)) / math.radians(45))   # 0..1 toward the front edges
        y -= 0.08 * v * math.cos(a)           # the hem dips at the back
        y += 0.1 * front * front * v          # and the front corners lift a touch
        x = r * math.sin(a) * 1.05
        z = -r * math.cos(a) * 0.92 + 0.04
        return (x, y, z)
    sheet(p, F, nu=44, nv=20, thick=0.1, hem=('u0', 'u1', 'v1'))
    p.tube([F(i / 44, 0) for i in range(45)], 0.085, rseg=10)            # the towel bunched round the neck
    p.paint_fn(lambda q, n: (q.x * n.x + (q.z - 0.02) * n.z) < 0 and q.y < TOP - 0.06, 0xe6e6e6)
    p.layer('hem', base=0xfffaf0, target_faces=900, voxel=0.01)
    p.quadriflow = False
    def B(u, v):
        x, y, z = F(u, 0.8 + 0.08 * v)
        a = math.radians(-140 + 280 * u)
        return (x + 0.05 * math.sin(a), y, z - 0.05 * math.cos(a))
    sheet(p, B, nu=44, nv=3, thick=0.035)
    tinted(p, 0xffa64a, 0.018)
    done(p, 1.6, 0.018)


def towelwrap():
    """The hand towel wrapped round both paws while drying (origin in the middle of the bundle): a soft roll along x,
    the cloth going round about one and a half times so its outer edge lies across the front, both ends open (the
    paw tips show), the loose corner hanging down a little, the woven band across it."""
    p = Prop('prop_md_towelwrap', base=WHITE, target_faces=2600, voxel=0.01)
    Lh = 0.36
    def F(u, v):
        x = -Lh + 2 * Lh * u
        a = math.radians(-60 + 520 * v)        # spiral: starts inside at the front, ends outside over the front
        r = 0.2 + 0.07 * v + 0.012 * math.sin(x * 18) * v
        y = r * math.cos(a) * 0.9
        z = r * math.sin(a)
        # the last part of the outer turn hangs down as a soft flap
        if v > 0.82:
            k = (v - 0.82) / 0.18
            y -= 0.18 * k * k
            z += 0.05 * k
        e = abs(x) / Lh
        return (x * (1 - 0.06 * (1 - v)), y * (1 + 0.08 * e * e), z * (1 + 0.08 * e * e))
    sheet(p, F, nu=14, nv=46, thick=0.055, hem=('v1', 'u0', 'u1'))
    p.paint_fn(lambda q, n: math.hypot(q.y, q.z) < 0.19, 0xe2e2e2)
    p.layer('hem', base=0xfffaf0, target_faces=500, voxel=0.008)
    p.quadriflow = False
    def B(u, v):
        x, y, z = F(0.02 + 0.96 * u, 0.9 + 0.04 * v)
        return (x, y, z + 0.035)
    sheet(p, B, nu=14, nv=3, thick=0.025)
    tinted(p, 0x5fc8a8, 0.016)
    done(p, 0.4, 0.016)

def bath():
    p = Prop('prop_md_bath', base=WHITE, target_faces=2600, voxel=0.02)
    SX, SZ = 2.1, 0.95
    prof = rounded([(0, 0.4), (0.78, 0.42), (0.93, 0.55), (0.99, 0.9), (1.02, 1.3), (1.01, 1.42), (0.94, 1.42),
                    (0.935, 1.3), (0.9, 0.88), (0.78, 0.64), (0, 0.6)], 0.05, n=3)
    p.lathe(prof, scale=(SX, SZ), seg=80)
    p.ring((0, 1.42, 0), 1.0, 0.055, scale=(SX, SZ), seg=80, rseg=10)      # a rolled rim
    def outer(q, n):
        return (n.x * q.x / SX ** 2 + n.z * q.z / SZ ** 2) > 0.05 and q.y < 1.36 and math.hypot(q.x / SX, q.z / SZ) > 0.9
    p.paint_fn(outer, 0x8fd6f2)
    p.paint_fn(lambda q, n: (not outer(q, n)) and q.y < 1.35 and n.y < 0.95 and math.hypot(q.x / SX, q.z / SZ) < 0.95, 0xe9f3fa)
    # gold claw feet
    p.layer('feet', base=GOLD, target_faces=600, voxel=0.012)
    for sx in (-1, 1):
        for sz in (-1, 1):
            x, z = sx * 1.32, sz * 0.48
            g = 'leg%d%d' % (sx, sz)
            p.blob((x, 0.38, z), (0.11, 0.12, 0.11), group=g)
            p.blob((x + sx * 0.04, 0.22, z), (0.075, 0.12, 0.075), group=g)
            p.blob((x + sx * 0.08, 0.08, z + 0.03), (0.13, 0.08, 0.12), group=g)
            for k in (-1, 0, 1):
                p.blob((x + sx * 0.12 + k * 0.03, 0.06, z + 0.06 + k * 0.06), (0.05, 0.05, 0.05), group=g)
    p.paint_fn(lambda q, n: n.y < -0.3, GOLD_D)
    # chrome tap at the -x end: pillar + spout into the bath
    p.layer('chrome', base=CHROME, target_faces=650, voxel=0.012)
    TX = -1.92
    p.cyl((TX, 1.44, 0), 0.12, 0.06, r2=0.1, bevel=0.025, seg=24)
    p.cyl((TX, 1.46, 0), 0.08, 0.3, bevel=0.02, seg=20)
    p.tube(rounded([(TX, 1.62, 0), (TX + 0.12, 1.72, 0), (TX + 0.42, 1.72, 0), (TX + 0.5, 1.6, 0)], 0.08, n=6), 0.058, rseg=12)
    p.paint_fn(lambda q, n: n.y < -0.35, CHROME_D)
    p.paint_fn(lambda q, n: n.y > 0.75 and q.y > 1.7, CHROME_L)
    p.layer('skin')
    p.anchor('spout', (TX + 0.5, 1.55, 0), 'body')
    p.anchor('knob', (TX, 1.77, 0), 'body')
    done(p, 1.42, 0.024)


def bottle():
    p = Prop('prop_md_bottle', base=WHITE, target_faces=1300, voxel=0.012)
    p.lathe(rounded([(0, 0), (0.3, 0), (0.34, 0.08), (0.34, 0.55), (0.24, 0.72), (0.12, 0.78), (0.12, 0.84), (0, 0.84)], 0.06, n=4),
            scale=(1, 0.8), seg=40)
    p.paint_fn(lambda q, n: q.y < 0.06, 0xe8e8e8)
    p.layer('cap', base=0xffffff, target_faces=500, voxel=0.01)
    p.cyl((0, 0.82, 0), 0.14, 0.14, bevel=0.04, seg=24)
    p.blob((0, 1.0, 0), (0.07, 0.05, 0.07), group='nub')
    p.paint_fn(lambda q, n: math.sin(math.atan2(q.x, q.z) * 10) > 0.5 and q.y < 0.95, 0xe6eef6)
    p.layer('label', base=0xffffff, target_faces=600, voxel=0.008)
    # a white label wrapped round the front with bubbles (aqua rings) on it
    verts, faces = [], []
    na, ny = 14, 6
    for side, dr in ((0, 0.0), (1, 0.02)):
        for i in range(na + 1):
            a = -1.0 + 2.0 * i / na
            for j in range(ny + 1):
                y = 0.18 + 0.32 * j / ny
                r = 0.343 + dr
                verts.append((r * math.sin(a), y, r * math.cos(a) * 0.8))
    idx = lambda s, i, j: s * (na + 1) * (ny + 1) + i * (ny + 1) + j
    for i in range(na):
        for j in range(ny):
            faces.append((idx(1, i, j), idx(1, i + 1, j), idx(1, i + 1, j + 1), idx(1, i, j + 1)))
            faces.append((idx(0, i, j), idx(0, i, j + 1), idx(0, i + 1, j + 1), idx(0, i + 1, j)))
    for i in range(na):
        faces.append((idx(0, i, 0), idx(0, i + 1, 0), idx(1, i + 1, 0), idx(1, i, 0)))
        faces.append((idx(0, i + 1, ny), idx(0, i, ny), idx(1, i, ny), idx(1, i + 1, ny)))
    for j in range(ny):
        faces.append((idx(0, 0, j), idx(0, 0, j + 1), idx(1, 0, j + 1), idx(1, 0, j)))
        faces.append((idx(0, na, j + 1), idx(0, na, j), idx(1, na, j), idx(1, na, j + 1)))
    p.mesh(verts, faces, bevel=0.01)
    BUB = [(-0.1, 0.3, 0.085), (0.1, 0.38, 0.065), (0.11, 0.23, 0.045)]
    def ring(q, n):
        for x, y, r in BUB:
            d = math.hypot(q.x - x, q.y - y)
            if r * 0.62 < d < r:
                return True
        return False
    p.paint_fn(ring, 0x3fb6e0)
    tinted(p, 0xff8fc0, 0.016)
    done(p, 1.0)


def tissues():
    # a tissue box (tint) with a soft oval slot in a white top plate, white polka dots on the sides, a white band round
    # the bottom (layer 'band') and a tissue pulled up out of the slot in a soft peak with folds (layer 'tissue')
    p = Prop('prop_md_tissues', base=WHITE, target_faces=2600, voxel=0.01)
    p.box((0, 0.3, 0), (0.45, 0.3, 0.32), bevel=0.07)
    p.blob((0, 0.6, 0), (0.25, 0.06, 0.1), group='slot', negative=True)                 # the slot dips in
    SLOT = lambda q: (q.x / 0.25) ** 2 + (q.z / 0.095) ** 2
    p.paint_fn(lambda q, n: q.y > 0.5 and SLOT(q) < 1.0, 0x8a7aa8)                       # dark oval opening
    p.paint_fn(lambda q, n: n.y < -0.5, 0xe2e2e2)
    # untinted white trim (layer 'band'): the bottom band, a top plate round the slot and polka dots on every side
    p.layer('band', base=0xffffff, target_faces=1600, voxel=0.007)
    p.box((0, 0.11, 0), (0.465, 0.06, 0.335), bevel=0.05)
    for s in (1, -1):                         # two halves of a plate with an oval hole
        half = [(0.34, 0.0), (0.34, s * 0.22), (-0.34, s * 0.22), (-0.34, 0.0)]
        half += [(0.26 * math.cos(a), s * 0.105 * math.sin(a)) for a in [math.pi * (1 - k / 12) for k in range(13)]]
        m = len(half)
        p.mesh([(x, y, z) for y in (0.598, 0.618) for x, z in half],
               [tuple(range(m)), tuple(range(2 * m - 1, m - 1, -1))] + [(i, (i + 1) % m, m + (i + 1) % m, m + i) for i in range(m)])
    for y, xs in ((0.28, (-0.3, -0.1, 0.1, 0.3)), (0.44, (-0.2, 0.0, 0.2))):
        for x in xs:
            for s in (-1, 1):
                p.cyl((x, y, s * 0.315), 0.048, 0.02, rot=(s * 90, 0, 0), bevel=0.008, seg=18)
    for z in (-0.13, 0.13):
        for y in (0.3, 0.46):
            for s in (-1, 1):
                p.cyl((s * 0.445, y, z), 0.048, 0.02, rot=(0, 0, -s * 90), bevel=0.008, seg=18)
    p.layer('tissue', base=0xffffff, target_faces=1200, voxel=0.008)
    # a soft folded sheet rising out of the slot to a peak: three overlapping flattened lobes and a pinched tip
    p.blob((0, 0.64, 0), (0.2, 0.09, 0.05), group='t')
    p.blob((-0.07, 0.74, 0.01), (0.12, 0.11, 0.04), rot=(0, 0, 28), group='t')
    p.blob((0.07, 0.76, -0.01), (0.1, 0.12, 0.04), rot=(0, 0, -30), group='t')
    p.blob((0.0, 0.86, 0.0), (0.06, 0.08, 0.03), rot=(0, 0, 8), group='t')
    p.paint_fn(lambda q, n: n.z < -0.4, 0xeef3fa)
    p.paint_fn(lambda q, n: q.y < 0.62, 0xe8edf5)
    tinted(p, 0xb99cf0, 0.018)
    done(p, 0.6)


def tissue():
    """One soft paper tissue (centre on the origin, facing +z): a puffy square with soft crumples, its corners curling
    forward, about 0.7 across."""
    p = Prop('prop_md_tissue', base=0xffffff, target_faces=1400, voxel=0.008)
    p.quadriflow = False
    Hs = 0.34
    def F(u, v):
        a, b = 2 * u - 1, 2 * v - 1
        r2 = a * a + b * b
        z = 0.1 * (1 - 0.6 * r2) + 0.07 * r2 * r2            # puffed in the middle, corners curling forward
        z += 0.035 * math.sin(a * 7.0 + b * 2.0) * (0.4 + r2) + 0.025 * math.sin(b * 8.5 - a * 3.0) * (0.3 + r2)
        x = a * Hs * (1 - 0.08 * b * b) + 0.02 * math.sin(b * 6)
        y = b * Hs * (1 - 0.07 * a * a) + 0.02 * math.sin(a * 5)
        return (x, y, z)
    sheet(p, F, nu=22, nv=22, thick=0.03)
    p.paint_fn(lambda q, n: n.z < -0.3, 0xe9eef6)
    p.extras['outline'] = 0.012
    p.layer('skin')
    p.bone('body', (0, -0.2, 0), (0, 0.2, 0))
    p.build()


def bin_():
    p = Prop('prop_md_bin', base=WHITE, target_faces=1500, voxel=0.014)
    R, H, T = 0.48, 0.95, 0.04
    p.lathe(rounded([(0, 0), (R - 0.04, 0), (R, 0.06), (R + 0.02, H), (R - T, H), (R - T, 0.08), (0, 0.08)], 0.03, n=3), seg=44)
    p.ring((0, 0.04, 0), R - 0.01, 0.04, seg=44, rseg=8)
    p.paint_fn(lambda q, n: math.hypot(q.x, q.z) < R - T + 0.015 and q.y > 0.07, 0xc8c8c8)
    p.paint_fn(lambda q, n: q.y < 0.09 and math.hypot(q.x, q.z) > R - 0.06, 0xe0e0e0)
    p.layer('pedal', base=CHROME, target_faces=300, voxel=0.01)
    p.box((0, 0.07, R + 0.08), (0.17, 0.035, 0.1), bevel=0.03)
    p.paint_fn(lambda q, n: n.y < -0.3, CHROME_D)
    p.layer('hinge', base=CHROME, target_faces=200, voxel=0.01)
    p.box((0, H - 0.02, -R - 0.02), (0.12, 0.05, 0.035), bevel=0.02)
    tinted(p, 0x7fd8b0, 0.018)
    done(p, H)


def binlid():
    p = Prop('prop_md_binlid', base=WHITE, target_faces=900, voxel=0.012)
    R = 0.52
    # origin on the back hinge (z = -R): the lid's centre is at z = +R
    p.lathe(rounded([(0, 0.0), (R, 0.0), (R, 0.06), (R * 0.75, 0.16), (0, 0.2)], 0.04, n=3), pos=(0, 0, R), seg=44)
    p.blob((0, 0.24, R), (0.09, 0.06, 0.09), group='knob')
    p.paint_fn(lambda q, n: n.y < -0.4, 0xd6d6d6)
    p.paint_fn(lambda q, n: q.y > 0.18, 0xe8e8e8)
    tinted(p, 0x7fd8b0, 0.018)
    done(p, 0.25)


def hairbrush():
    p = Prop('prop_md_hairbrush', base=WHITE, target_faces=1300, voxel=0.01)
    # handle along -x, an oval paddle at +x facing +z
    p.tube([(-0.55, 0, 0), (-0.25, 0, 0), (0.0, 0, 0)], [0.07, 0.06, 0.055], rseg=12)
    p.box((0.26, 0, 0), (0.27, 0.2, 0.05), bevel=0.05)
    p.paint_fn(lambda q, n: q.x < -0.3 and math.sin(q.x * 30) > 0.6, 0xe6e6e6)
    p.layer('pad', base=0xff9ec4, target_faces=400, voxel=0.008)
    p.box((0.26, 0, 0.055), (0.22, 0.155, 0.02), bevel=0.018)
    p.layer('pins', base=0xffffff, target_faces=700, voxel=0.006)
    for i in range(-2, 3):
        for j in range(-1, 2):
            x, y = 0.26 + i * 0.085, j * 0.09
            p.blob((x, y, 0.1), (0.026, 0.026, 0.035), group='pin%d%d' % (i, j))
    tinted(p, 0xffb020, 0.014)
    done(p, 0.2)


# ------------------------------------------------------------------ bedroom
def bed():
    p = Prop('prop_md_bed', base=WOOD, target_faces=2400, voxel=0.02)
    L, D = 5.2, 2.3
    hx = L / 2
    # headboard (-x): a tall rounded panel; footboard (+x): a lower one; posts with round knobs; side rails
    def board(x, h):
        pts = rounded([(-D / 2, 0.0), (D / 2, 0.0), (D / 2, h - 0.35), (0, h), (-D / 2, h - 0.35)], 0.35, n=6, closed=True)
        verts = []
        for xx in (x - 0.12, x + 0.12):
            for z, y in pts:
                verts.append((xx, y, z))
        n = len(pts)
        faces = [tuple(range(n)), tuple(range(2 * n - 1, n - 1, -1))] + [(i, n + i, n + (i + 1) % n, (i + 1) % n) for i in range(n)]
        p.mesh(verts, faces, bevel=0.05)
    board(-hx, 3.0)
    board(hx, 1.85)
    for x, h in ((-hx, 2.7), (hx, 1.7)):
        for z in (-D / 2, D / 2):
            p.cyl((x, 0, z), 0.12, h, bevel=0.04, seg=18)

    for z in (-D / 2, D / 2):
        p.box((0, 0.55, z), (hx, 0.26, 0.08), bevel=0.07)
    p.paint_fn(lambda q, n: n.y < -0.4, WOOD_D)
    p.layer('knobs', base=0xffffff, target_faces=400, voxel=0.012)
    for x, h in ((-hx, 2.7), (hx, 1.7)):
        for z in (-D / 2, D / 2):
            p.blob((x, h + 0.1, z), (0.17, 0.15, 0.17), group='knob%.1f%.1f' % (x, z))
    # a moon and two stars on the front rail (their own layer: crisp)
    p.layer('moon', base=0xffe27a, target_faces=600, voxel=0.01)
    cres = []
    for i in range(25):
        t = math.radians(60 + i * 10)
        cres.append((0.3 * math.cos(t), 0.3 * math.sin(t)))
    for i in range(25):
        t = math.radians(300 - i * 10)
        cres.append((0.11 + 0.23 * math.cos(t), 0.07 + 0.235 * math.sin(t)))
    def slab(poly, cx, cy, z0, z1):
        n = len(poly)
        v = [(cx + a, cy + b, z) for z in (z0, z1) for a, b in poly]
        f = [tuple(range(n)), tuple(range(2 * n - 1, n - 1, -1))] + [(i, n + i, n + (i + 1) % n, (i + 1) % n) for i in range(n)]
        p.mesh(v, f, bevel=0.01)
    FZ = D / 2 + 0.08
    slab(cres, -1.2, 0.55, FZ - 0.02, FZ + 0.03)
    for cx, r in ((-0.35, 0.13), (0.55, 0.1), (1.4, 0.13)):
        slab([(x * r, y * r) for x, y in STAR], cx, 0.55, FZ - 0.02, FZ + 0.03)
    # mattress: a fitted sheet with a soft piped edge round the top
    p.layer('mattress', base=0xffffff, target_faces=1400, voxel=0.018)
    p.box((0.0, 0.85, 0), (hx - 0.12, 0.2, D / 2 - 0.06), bevel=0.14)
    p.paint_fn(lambda q, n: n.y < -0.5, 0xe6eef5)
    p.paint_fn(lambda q, n: n.y < 0.3 and q.y < 0.84, 0xeef4fb)        # the sheet's side a shade cooler
    p.layer('piping', base=0xbfe4ff, target_faces=900, voxel=0.012)
    px, pz, py = hx - 0.2, D / 2 - 0.12, 1.02
    ring = rounded([(-px, py, -pz), (px, py, -pz), (px, py, pz), (-px, py, pz)], 0.14, n=5, closed=True)
    p.tube(ring + [ring[0]], 0.035, rseg=8)
    # pillow: plump, with a soft crease across the middle and pink piped ends
    p.layer('pillow', base=0xffffff, target_faces=900, voxel=0.014)
    for s_ in (-1, 1):
        p.blob((-hx + 0.75, 1.18, s_ * 0.34), (0.46, 0.18, 0.46), group='pillow')
    p.blob((-hx + 0.75, 1.13, 0), (0.42, 0.14, 0.7), group='pillow')
    p.paint_fn(lambda q, n: abs(q.z) > 0.74, 0xffc2d8)
    p.paint_fn(lambda q, n: n.y < -0.3, 0xe9eef6)
    p.layer('skin')
    p.anchor('pillow', (-hx + 0.75, 1.3, 0), 'body')
    done(p, 3.0, 0.024)


DUV_X0, DUV_X1, DUV_Z = -1.6, 1.95, 1.36       # head end, foot end (bed-local, from the duvet's origin), half width


def duvet_top(hump=None, nu=44, nv=26):
    """the duvet's middle surface: lying on the mattress (local y 0 = mattress top), puffed into soft quilted squares,
    falling over both sides of the bed; hump(x, z) adds Bunny underneath"""
    X0 = DUV_X0
    def F(u, v):
        x = X0 + (DUV_X1 - X0) * u
        z = -DUV_Z + 2 * DUV_Z * v
        y = 0.1 + 0.025 * math.cos(x * math.pi / 0.62) * math.cos(z * math.pi / 0.62)
        ez = abs(z) - 1.08                                   # over the mattress edge, then hanging down the side
        if hump:
            y += hump(x, z) * max(0.0, min(1.0, -ez * 4))
        if ez > 0:
            t = min(1.0, ez / 0.28)
            y -= 0.35 * math.sin(t * math.pi / 2) + 0.75 * max(0.0, ez - 0.28)
            z = math.copysign(1.08 + 0.2 * math.sin(t * math.pi / 2) + 0.05 * max(0.0, ez - 0.28), z)
        return (x, y, z)
    return F


def duvet_paint(p, F, X0=None):
    """printed stars: crisp yellow star patches lying on the duvet's top (their own untinted layer, following its
    shape), and the underside a shade darker"""
    X0 = DUV_X0 if X0 is None else X0
    p.paint_fn(lambda q, n: n.y < -0.3, 0xe2e2e2)
    stars = []
    for i in range(7):
        for j in range(3):
            x = X0 + 0.42 + i * 0.58 + (0.29 if j % 2 else 0)
            z = -0.72 + j * 0.72
            if x < DUV_X1 - 0.25:
                stars.append((x, z))
    def at(x, z, lift):
        u = (x - X0) / (DUV_X1 - X0); v = (z + DUV_Z) / (2 * DUV_Z)
        e = 1e-3
        q = F(u, v); a = F(u + e, v); b = F(u, v + e)
        du = [a[k] - q[k] for k in range(3)]; dv = [b[k] - q[k] for k in range(3)]
        n = (du[1] * dv[2] - du[2] * dv[1], du[2] * dv[0] - du[0] * dv[2], du[0] * dv[1] - du[1] * dv[0])
        L = math.sqrt(sum(c * c for c in n)) or 1
        n = [c / L for c in n]
        if n[1] < 0:
            n = [-c for c in n]
        return tuple(q[k] + n[k] * lift for k in range(3))
    p.layer('stars', base=0xfff0a0, target_faces=1600, voxel=0.008)
    p.quadriflow = False
    poly = star_poly(0.16, inner=0.5)
    for (x, z) in stars:
        top = [at(x + px, z - py, 0.085) for px, py in poly]
        bot = [at(x + px, z - py, 0.05) for px, py in poly]
        ct, cb = at(x, z, 0.085), at(x, z, 0.05)
        n = len(poly)
        verts = [ct, cb] + top + bot
        faces = []
        for i in range(n):
            j = (i + 1) % n
            faces.append((0, 2 + i, 2 + j))
            faces.append((1, 2 + n + j, 2 + n + i))
            faces.append((2 + i, 2 + n + i, 2 + n + j, 2 + j))
        p.mesh(verts, faces)
    p.layer('skin')


def duvet():
    """The star duvet spread on the bed (origin on the mattress top, under the duvet's middle): soft quilted puffs,
    falling over both sides, printed stars, a rolled cream edge at the head end."""
    p = Prop('prop_md_duvet', base=WHITE, target_faces=3200, voxel=0.018)
    p.quadriflow = False
    F = duvet_top()
    sheet(p, F, nu=44, nv=26, thick=0.12, hem=('u1', 'v0', 'v1'))
    duvet_paint(p, F)
    p.layer('turn', base=0xfff6e0, target_faces=900, voxel=0.014)
    p.tube([(lambda q: (q[0] + 0.06, q[1] + 0.05, q[2]))(F(0.0, j / 26)) for j in range(27)], 0.11, rseg=12)
    tinted(p, 0x8fc7ff, 0.02)
    done(p, 0.4, 0.02)


def bunny_hump_fn(ox, oz, x0):
    """Bunny lying in bed, as sampled in the game (tools/blender/creatures/myday_bunny_lying.json: the top of the posed
    Bunny, world heights on a 0.1 grid). Returns hump(x, z) in duvet-local units: how far above the duvet's flat height
    it must rise to lie over Bunny (padded and softened like a real quilt), zero toward the head end past the chin."""
    import json
    J = json.load(open(os.path.join(os.path.dirname(__file__), 'myday_bunny_lying.json')))
    H, X0, Z0, st = J['H'], J['x0'], J['z0'], J['step']
    nx, nz = len(H), len(H[0])
    M = [[max(1.02, v) for v in row] for row in H]
    # pad (a max filter) then soften (a box blur, twice)
    def filt(A, r, fn):
        return [[fn([A[a][b] for a in range(max(0, i - r), min(nx, i + r + 1)) for b in range(max(0, j - r), min(nz, j + r + 1))]) for j in range(nz)] for i in range(nx)]
    M = filt(M, 1, max)
    M = filt(M, 2, lambda v: sum(v) / len(v))
    M = filt(M, 2, lambda v: sum(v) / len(v))
    def top(xw, zw):
        fi, fj = (xw - X0) / st, (zw - Z0) / st
        if fi < 0 or fj < 0 or fi >= nx - 1 or fj >= nz - 1:
            return 1.02
        i, j = int(fi), int(fj); a, b = fi - i, fj - j
        return (M[i][j] * (1 - a) * (1 - b) + M[i + 1][j] * a * (1 - b) + M[i][j + 1] * (1 - a) * b + M[i + 1][j + 1] * a * b)
    def hump(x, z):
        xw = max(ox + x, 7.12)                                   # (the head is not under the duvet)
        h = max(0.0, top(xw, oz + z) + 0.1 - 1.02 - 0.1)
        return 1.15 * math.tanh(h / 1.15)                        # a soft cap: a quilt, not a tent
    return hump


def duvetover():
    """The duvet tucked over Bunny lying in bed (origin on the mattress top, BED.x + 0.9): it rises softly over Bunny's
    tummy and up-turned feet (shaped from the real lying pose) and stops across the chest, under the chin, with the
    rolled cream edge."""
    global DUV_X0, DUV_X1
    keep = (DUV_X0, DUV_X1)
    DUV_X0, DUV_X1 = -1.18, 1.65
    p = Prop('prop_md_duvetover', base=WHITE, target_faces=3800, voxel=0.018)
    p.quadriflow = False
    F = duvet_top(bunny_hump_fn(7.4 + 0.9, -2.2, DUV_X0), nu=48, nv=30)
    sheet(p, F, nu=48, nv=30, thick=0.12, hem=('u1', 'v0', 'v1'))
    duvet_paint(p, F, DUV_X0)
    p.layer('turn', base=0xfff6e0, target_faces=900, voxel=0.014)
    p.tube([(lambda q: (q[0] + 0.05, q[1] + 0.06, q[2]))(F(0.0, j / 30)) for j in range(31)], 0.11, rseg=12)
    DUV_X0, DUV_X1 = keep
    tinted(p, 0x8fc7ff, 0.02)
    done(p, 1.4, 0.02)


def duvetfold():
    """The duvet folded up in three at the foot of the bed (origin on the mattress top, in its middle): a soft stack of
    three layers with rounded folded edges, stars on top."""
    p = Prop('prop_md_duvetfold', base=WHITE, target_faces=2400, voxel=0.016)
    W, D, th = 0.45, 1.12, 0.12
    for k in range(3):
        y = 0.07 + k * th
        p.box((0.02 * (k % 2), y, 0), (W - 0.02 * k, th * 0.5, D - 0.03 * k), bevel=0.055)
    for k in range(2):   # the rounded folds, alternating ends
        sx = 1 if k % 2 == 0 else -1
        p.tube([(sx * (W - 0.02), 0.07 + (k + 0.5) * th, -D + 0.08 + 2 * (D - 0.08) * i / 10) for i in range(11)], th * 0.62, rseg=10)
    stars = [(-0.2, -0.6), (0.2, 0.0), (-0.2, 0.6)]
    p.paint_fn(lambda q, n: n.y > 0.6 and q.y > 0.3 and any(in_star(q.x - x, -(q.z - z), 0.15) for x, z in stars), 0xfff2a8)
    p.paint_fn(lambda q, n: n.y < -0.3, 0xe2e2e2)
    tinted(p, 0x8fc7ff, 0.02)
    done(p, 0.45, 0.02)


def duvetheap():
    """The duvet kicked off onto the floor in a soft crumpled heap (origin on the floor in its middle)."""
    p = Prop('prop_md_duvetheap', base=WHITE, target_faces=2600, voxel=0.018)
    p.quadriflow = False
    def F(u, v):
        a, b = 2 * u - 1, 2 * v - 1
        r = math.hypot(a, b)
        x = a * 0.95 + 0.05 * math.sin(b * 5)
        z = b * 0.7 + 0.04 * math.sin(a * 6)
        y = 0.06 + 0.42 * max(0.0, 1 - r) ** 1.3 + 0.07 * math.sin(a * 5.5 + b * 3) * (1 - min(1, r)) + 0.05 * max(0.0, math.sin(a * 9 - b * 4)) * (1 - min(1, r))
        return (x, y, z)
    sheet(p, F, nu=30, nv=24, thick=0.12, hem=('u0', 'u1', 'v0', 'v1'))
    p.blob((0.25, 0.32, -0.1), (0.3, 0.16, 0.25), group='fold')
    p.blob((-0.3, 0.26, 0.15), (0.26, 0.12, 0.2), group='fold')
    p.paint_fn(lambda q, n: n.y > 0.5 and any(in_star(q.x - x, -(q.z - z), 0.15) for x, z in ((-0.45, -0.2), (0.35, 0.3), (0.1, -0.45))), 0xfff2a8)
    p.paint_fn(lambda q, n: n.y < -0.3, 0xe2e2e2)
    tinted(p, 0x8fc7ff, 0.02)
    done(p, 0.6, 0.02)


def table():
    p = Prop('prop_md_table', base=0xffffff, target_faces=1600, voxel=0.016)
    p.box((0, 1.33, 0), (0.68, 0.07, 0.5), bevel=0.06)                # top
    p.box((0, 0.85, 0), (0.6, 0.42, 0.44), bevel=0.06)                # cabinet
    for sx in (-1, 1):
        for sz in (-1, 1):
            p.cyl((sx * 0.48, 0, sz * 0.32), 0.07, 0.45, r2=0.08, bevel=0.03, seg=14)
    p.paint_fn(lambda q, n: n.y < -0.4, 0xe2e6ee)
    p.layer('drawer', base=0xffaacb, target_faces=500, voxel=0.012)
    p.box((0, 0.88, 0.44), (0.5, 0.3, 0.04), bevel=0.04)
    p.layer('handle', base=GOLD, target_faces=200, voxel=0.008)
    p.blob((0, 0.9, 0.52), (0.07, 0.07, 0.06), group='h')
    done(p, 1.4, 0.02)


def clock():
    p = Prop('prop_md_clock', base=0xff6b6b, target_faces=2200, voxel=0.012)
    Y = 0.5
    p.cyl((0, Y, -0.13), 0.38, 0.26, rot=(90, 0, 0), bevel=0.07, seg=40)       # drum body, front at z +0.13
    for s in (-1, 1):
        p.tube([(s * 0.17, Y - 0.3, 0), (s * 0.27, 0.04, 0.02)], 0.04, rseg=8)   # legs
        p.blob((s * 0.28, 0.04, 0.02), (0.07, 0.04, 0.07), group='foot%d' % s)
    p.paint_fn(lambda q, n: n.y < -0.5, 0xd94f4f)
    # bells + hammer
    p.layer('bells', base=GOLD, target_faces=900, voxel=0.01)
    for s in (-1, 1):
        a = math.radians(s * 38)
        cx, cy = math.sin(a) * 0.43, Y + math.cos(a) * 0.43
        p.lathe(rounded([(0, 0), (0.17, 0.0), (0.16, 0.08), (0.08, 0.15), (0, 0.16)], 0.03, n=3), pos=(cx, cy - 0.02, 0), rot=(0, 0, -s * 38), seg=24)
    p.tube([(0, Y + 0.38, 0), (0, Y + 0.52, 0)], 0.025, rseg=6)
    p.blob((0, Y + 0.55, 0), (0.05, 0.05, 0.05), group='hammer')
    p.paint_fn(lambda q, n: n.y < -0.4, GOLD_D)
    # white face with hour dots
    p.layer('face', base=0xffffff, target_faces=500, voxel=0.008)
    p.cyl((0, Y, 0.1), 0.3, 0.05, rot=(90, 0, 0), bevel=0.02, seg=36)
    p.paint_fn(lambda q, n: n.z > 0.6 and any(math.hypot(q.x - 0.24 * math.sin(k * TAU / 12), q.y - Y - 0.24 * math.cos(k * TAU / 12)) < (0.028 if k % 3 == 0 else 0.016) for k in range(12)), 0x5a4a80)
    p.layer('hands', base=INKY, target_faces=300, voxel=0.006)
    for ang, ln, w in ((-60, 0.14, 0.022), (60, 0.2, 0.016)):
        a = math.radians(ang)
        p.tube([(0, Y, 0.16), (math.sin(a) * ln, Y + math.cos(a) * ln, 0.16)], w, rseg=6)
    p.blob((0, Y, 0.165), (0.035, 0.035, 0.02), group='pin')
    p.layer('skin')
    p.extras['outline'] = 0.018
    p.bone('body', (0, 0, 0), (0, 1.0, 0))
    p.build()


def lamp():
    p = Prop('prop_md_lamp', base=0xffffff, target_faces=1400, voxel=0.012)
    p.lathe(rounded([(0, 0), (0.3, 0), (0.32, 0.05), (0.22, 0.16), (0.1, 0.22), (0.08, 0.5), (0, 0.5)], 0.04, n=3), seg=32)
    p.paint_fn(lambda q, n: q.y < 0.05, 0xe2e6ee)
    p.layer('shade', base=0xfff1c0, target_faces=700, voxel=0.012)
    p.lathe(rounded([(0, 0.44), (0.5, 0.42), (0.52, 0.48), (0.42, 0.68), (0.2, 0.86), (0, 0.9)], 0.06, n=4), seg=40)
    # little dots round the mushroom cap
    p.paint_fn(lambda q, n: n.y > 0.1 and any(math.hypot(q.x - 0.32 * math.sin(k * TAU / 7), q.z - 0.32 * math.cos(k * TAU / 7)) < 0.075 for k in range(7)) and q.y > 0.6, 0xffd06b)
    done(p, 0.9, 0.018)


def drape():
    """A pleated curtain panel at its real size: hangs from y 3.55 (its heading on the rod) down to 0, x -0.5..0.5
    (the game narrows it in x to open it, gathering the pleats). Deep soft pleats, a gathered heading, a clean
    scalloped hem with a cream band (tint)."""
    p = Prop('prop_md_drape', base=WHITE, target_faces=2600, voxel=0.012)
    p.quadriflow = False
    H, NP = 3.55, 5
    def F(u, v):
        x = -0.5 + u
        y = H * (1 - v)
        ph = u * NP * TAU
        z = 0.085 * math.sin(ph) * (0.75 + 0.35 * v)
        if v > 0.97:   # the scalloped hem: each pleat ends in a soft round dip
            y -= 0.07 * (1 - abs(math.cos(ph / 2))) * (v - 0.97) / 0.03
        return (x, y, z)
    sheet(p, F, nu=60, nv=30, thick=0.05, hem=('v1',))
    p.paint_fn(lambda q, n: n.z < -0.4, 0xe6e6e6)
    # gathered heading under the rod
    p.tube([(-0.5 + i / 40, H - 0.06, 0.09 * math.sin(i / 40 * NP * TAU)) for i in range(41)], 0.05, rseg=8)
    p.layer('band', base=0xfffaf0, target_faces=900, voxel=0.01)
    def B(u, v):
        x, y, z = F(u, 0.9 + 0.045 * v)
        return (x, y, z + 0.03)
    sheet(p, B, nu=60, nv=2, thick=0.03)
    tinted(p, 0x8fd0ff, 0.012)
    done(p, H)


MODELS = dict(prop_md_sink=sink, prop_md_knob=knob, prop_md_stool=stool, prop_md_soap=soap, prop_md_brush=brush,
              prop_md_paste=paste, prop_md_cup=cup, prop_md_towel=towel, prop_md_towelwrap=towelwrap, prop_md_bigtowel=bigtowel, prop_md_bathcape=bathcape, prop_md_bath=bath,
              prop_md_bottle=bottle, prop_md_tissues=tissues, prop_md_tissue=tissue, prop_md_bin=bin_, prop_md_binlid=binlid,
              prop_md_hairbrush=hairbrush, prop_md_bed=bed, prop_md_duvet=duvet, prop_md_duvetover=duvetover, prop_md_duvetfold=duvetfold, prop_md_duvetheap=duvetheap, prop_md_table=table, prop_md_clock=clock,
              prop_md_lamp=lamp, prop_md_drape=drape)
for name, fn in MODELS.items():
    if not ONLY or name in ONLY:
        fn()
