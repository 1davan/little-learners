"""My day (Home world): the bathroom and bedroom things the bunny uses in its routines. One script, many models
(ONLY=prop_md_sink,prop_md_soap tools/blender/build.sh prop_myday builds a subset). Everything faces +z, origin on the
floor / under the middle unless noted. Tintable models (argMode 'tint') are painted white / light grey where the
game's colour should show.

  prop_md_sink      pedestal washbasin (bowl rim y 1.84, 2.55 x 1.6), a soap dish ear (x +1.42) and a cup ear (x -1.42),
                    a chrome pillar tap on the back rim with its spout curving forward over the bowl, a towel bar under
                    the front. Anchors: spout (water leaves here), knob (where prop_md_knob sits), soap, cup, towel.
  prop_md_knob      the chrome cross-head tap handle with a blue cap (origin = its foot; the game spins it about y)
  prop_md_stool     a little wooden step stool (top y 0.5) with a yellow star on the front
  prop_md_soap      a chunky bar of soap with a heart pressed in it (tint)
  prop_md_brush     a toddler toothbrush lying along x (head at +x, bristles up); layer 'paste' = a stripy blob of
                    toothpaste on the bristles (the game shows it)
  prop_md_paste     a toothpaste tube lying along x, cap at +x
  prop_md_cup       a tooth mug (r 0.27, 0.55 tall, tint) with a handle
  prop_md_towel     a hand towel folded over a bar: origin on the fold (the bar), hangs 1.3 down (tint) with white bands
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
    SZ = 0.62
    p = Prop('prop_md_sink', base=CERAMIC, target_faces=2600, voxel=0.018)
    # pedestal: a waisted column flaring into the bowl
    p.lathe(rounded([(0, 0), (0.55, 0), (0.55, 0.08), (0.4, 0.2), (0.31, 0.7), (0.32, 1.05), (0.5, 1.15), (0, 1.15)], 0.06, n=3), seg=40)
    # the bowl: one revolved section from the underside, over the rim and down inside to the plughole
    bowl = rounded([(0, 1.08), (0.5, 1.1), (0.92, 1.22), (1.17, 1.42), (1.27, 1.64), (1.28, 1.76), (1.22, 1.84), (1.06, 1.84),
                    (1.0, 1.72), (0.86, 1.48), (0.5, 1.33), (0, 1.31)], 0.07, n=4)
    p.lathe(bowl, scale=(1, SZ), seg=72)
    # a dish 'ear' each side: soap (+x) and cup (-x)
    for s in (-1, 1):
        p.lathe(rounded([(0, 1.6), (0.22, 1.62), (0.33, 1.75), (0.32, 1.8), (0.25, 1.8), (0.21, 1.73), (0, 1.71)], 0.03, n=3),
                pos=(s * 1.42, 0, 0.05), seg=36)
    # a raised pad on the back rim for the tap
    p.cyl((0, 1.76, -0.72), 0.2, 0.09, r2=0.18, bevel=0.04, scale=(1.3, 0.8), seg=28)
    # paint: a soft blue inside the bowl and the dishes (depth), a chrome plughole
    def inside(q, n):
        r = math.hypot(q.x, q.z / SZ)
        return q.y > 1.28 and q.y < 1.83 and r < 1.03 and n.y > -0.2 and (n.x * q.x + n.z * q.z / SZ) < 0.3
    p.paint_fn(inside, CER_D)
    p.paint_fn(lambda q, n: any(q.y > 1.64 and q.y < 1.785 and math.hypot(q.x - s * 1.42, q.z - 0.05) < 0.23 and n.y > 0.2 for s in (-1, 1)), CER_D)
    p.paint_fn(lambda q, n: math.hypot(q.x, q.z) < 0.11 and q.y < 1.4 and q.y > 1.25 and n.y > 0.4, CHROME_D)
    p.paint_fn(lambda q, n: math.hypot(q.x, q.z) < 0.065 and q.y < 1.4 and q.y > 1.25 and n.y > 0.4, 0x6f7a8a)
    p.paint_fn(lambda q, n: q.y < 0.09, CER_D)
    # chrome tap on the back rim (by the child): pillar + spout arching forward over the bowl
    p.layer('chrome', base=CHROME, target_faces=900, voxel=0.012)
    p.cyl((0, 1.83, -0.72), 0.13, 0.06, r2=0.12, bevel=0.025, seg=28)
    p.cyl((0, 1.86, -0.72), 0.09, 0.34, bevel=0.02, seg=24)
    spout = rounded([(0, 2.04, -0.72), (0, 2.16, -0.6), (0, 2.16, -0.31), (0, 2.03, -0.22)], 0.09, n=6)
    p.tube(spout, 0.062, rseg=14)
    p.cyl((0, 1.99, -0.22), 0.07, 0.06, r2=0.075, bevel=0.015, seg=18)
    # a towel bar across the front, under the bowl (the hand towel hangs on it)
    p.tube(rounded([(-0.62, 1.3, 0.42), (-0.62, 1.2, 0.95), (0.62, 1.2, 0.95), (0.62, 1.3, 0.42)], 0.1, n=5), 0.042, rseg=10)
    for s in (-1, 1):
        p.cyl((s * 0.62, 1.27, 0.42), 0.07, 0.08, bevel=0.02, seg=14)
    p.paint_fn(lambda q, n: n.y < -0.35 or (n.x * n.x > 0.6 and q.y < 1.99), CHROME_D)
    p.paint_fn(lambda q, n: n.y > 0.75 and q.y > 2.15, CHROME_L)
    p.layer('skin')
    p.anchor('spout', (0, 1.97, -0.22), 'body')
    p.anchor('knob', (0, 2.2, -0.72), 'body')
    p.anchor('soap', (1.42, 1.74, 0.05), 'body')
    p.anchor('towel', (0, 1.2, 0.95), 'body')
    p.anchor('cup', (-1.42, 1.74, 0.05), 'body')
    done(p, 1.84, 0.022)


def knob():
    p = Prop('prop_md_knob', base=CHROME, target_faces=900, voxel=0.01)
    p.cyl((0, 0, 0), 0.06, 0.08, bevel=0.02, seg=16)
    for a in (0, 90):
        r = math.radians(a)
        p.tube([(-0.2 * math.cos(r), 0.07, -0.2 * math.sin(r)), (0.2 * math.cos(r), 0.07, 0.2 * math.sin(r))], 0.032, rseg=8)
        for s in (-1, 1):
            p.blob((s * 0.21 * math.cos(r), 0.07, s * 0.21 * math.sin(r)), (0.05, 0.045, 0.05), group='end%d%d' % (a, s))
    p.cyl((0, 0.05, 0), 0.085, 0.07, r2=0.075, bevel=0.03, seg=20)
    p.paint_fn(lambda q, n: n.y < -0.3, CHROME_D)
    p.layer('cap', base=0x4a9bff, target_faces=150, voxel=0.006)
    p.cyl((0, 0.115, 0), 0.05, 0.012, bevel=0.006, seg=16)
    done(p, 0.15, 0.014)


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
    p = Prop('prop_md_soap', base=WHITE, target_faces=900, voxel=0.01)
    p.box((0, 0.11, 0), (0.29, 0.11, 0.19), bevel=0.1)
    p.blob((0, 0.12, 0), (0.25, 0.1, 0.16), group='puff')
    H = heart_poly(0.12)
    p.paint_fn(lambda q, n: n.y > 0.7 and in_poly(q.x, -q.z + 0.01, H), 0xe6e6e6)
    p.paint_fn(lambda q, n: n.y < -0.5, 0xe0e0e0)
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
    p.layer('deco', base=0xffffff, target_faces=300, voxel=0.006)
    p.sticker(star_poly(0.11, inner=0.5), 0.27, lambda y: R + 0.01 * y / H, thick=0.03, lift=0.006)
    tinted(p, 0xffb020, 0.016)
    done(p, H)


def towel():
    p = Prop('prop_md_towel', base=WHITE, target_faces=1400, voxel=0.012)
    W, L = 0.5, 1.3
    # folded over a bar at the origin: the front panel hangs a little longer than the back one, soft wavy hems
    def panel(z0, length, k):
        verts, faces = [], []
        nx, ny = 10, 12
        for side, dz in ((0, -0.03), (1, 0.03)):
            for i in range(nx + 1):
                for j in range(ny + 1):
                    x = -W + 2 * W * i / nx
                    y = -length * j / ny
                    wob = 0.02 * math.sin(x * 9 + j * 0.6) * (j / ny)
                    verts.append((x * (1 + 0.04 * j / ny), y - 0.03 * math.sin(x * 4) * (j / ny), z0 * (1 + 0.15 * j / ny) + dz + wob))
        idx = lambda s, i, j: s * (nx + 1) * (ny + 1) + i * (ny + 1) + j
        for i in range(nx):
            for j in range(ny):
                faces.append((idx(1, i, j), idx(1, i + 1, j), idx(1, i + 1, j + 1), idx(1, i, j + 1)))
                faces.append((idx(0, i, j), idx(0, i, j + 1), idx(0, i + 1, j + 1), idx(0, i + 1, j)))
        for i in range(nx):
            faces.append((idx(0, i, ny), idx(0, i + 1, ny), idx(1, i + 1, ny), idx(1, i, ny)))
            faces.append((idx(0, i + 1, 0), idx(0, i, 0), idx(1, i, 0), idx(1, i + 1, 0)))
        for j in range(ny):
            faces.append((idx(0, 0, j + 1), idx(0, 0, j), idx(1, 0, j), idx(1, 0, j + 1)))
            faces.append((idx(0, nx, j), idx(0, nx, j + 1), idx(1, nx, j + 1), idx(1, nx, j)))
        p.mesh(verts, faces, bevel=0.025)
    panel(0.09, L, 1)
    panel(-0.09, L * 0.8, -1)
    p.tube([(-W - 0.02, -0.02, 0), (W + 0.02, -0.02, 0)], 0.1, rseg=12)   # the soft fold over the bar
    p.paint_fn(lambda q, n: n.z < -0.6 and q.z < 0, 0xe8e8e8)
    p.layer('bands', base=0xffffff, target_faces=500, voxel=0.01)
    p.quadriflow = False
    for y0, h in ((-L + 0.3, 0.07), (-L + 0.15, 0.035)):
        verts, faces = [], []
        nx = 12
        for side, dz in ((0, 0.0), (1, 0.03)):
            for i in range(nx + 1):
                for yy in (y0 - h, y0 + h):
                    x = -W + 2 * W * i / nx
                    jf = -yy / L
                    wob = 0.02 * math.sin(x * 9 + jf * 12 * 0.6) * jf
                    verts.append((x * (1 + 0.04 * jf) * 1.01, yy - 0.03 * math.sin(x * 4) * jf, 0.09 * (1 + 0.15 * jf) + 0.035 + dz + wob))
        idx = lambda s_, i, k: s_ * (nx + 1) * 2 + i * 2 + k
        for i in range(nx):
            faces.append((idx(1, i, 0), idx(1, i + 1, 0), idx(1, i + 1, 1), idx(1, i, 1)))
            faces.append((idx(0, i, 0), idx(0, i, 1), idx(0, i + 1, 1), idx(0, i + 1, 0)))
            faces.append((idx(0, i, 0), idx(0, i + 1, 0), idx(1, i + 1, 0), idx(1, i, 0)))
            faces.append((idx(0, i + 1, 1), idx(0, i, 1), idx(1, i, 1), idx(1, i + 1, 1)))
        faces.append((idx(0, 0, 1), idx(0, 0, 0), idx(1, 0, 0), idx(1, 0, 1)))
        faces.append((idx(0, nx, 0), idx(0, nx, 1), idx(1, nx, 1), idx(1, nx, 0)))
        p.mesh(verts, faces, bevel=0.008)
    tinted(p, 0x5fc8a8, 0.018)
    p.extras['white'] = 1
    done(p, 0.1)


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
    p.paint_fn(lambda q, n: outer(q, n) and q.y < 0.62, 0x72c2e6)
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
    p = Prop('prop_md_tissues', base=WHITE, target_faces=1300, voxel=0.014)
    p.box((0, 0.3, 0), (0.45, 0.3, 0.32), bevel=0.08)
    p.paint_fn(lambda q, n: n.y > 0.8 and abs(q.x) < 0.24 and abs(q.z) < 0.08, 0xd0d0d0)
    p.paint_fn(lambda q, n: n.y < -0.5, 0xe2e2e2)
    p.layer('band', base=0xffffff, target_faces=500, voxel=0.01)
    p.box((0, 0.24, 0), (0.478, 0.075, 0.348), bevel=0.06)
    p.layer('tissue', base=0xffffff, target_faces=500, voxel=0.012)
    p.blob((0, 0.66, 0), (0.17, 0.1, 0.08), group='t')
    p.blob((-0.06, 0.74, 0.01), (0.09, 0.09, 0.05), rot=(0, 0, 25), group='t')
    p.blob((0.08, 0.77, -0.01), (0.07, 0.1, 0.045), rot=(0, 0, -30), group='t')
    p.blob((0.0, 0.84, 0.0), (0.05, 0.06, 0.035), group='t')
    p.paint_fn(lambda q, n: n.z < -0.4, 0xeef3fa)
    tinted(p, 0xb99cf0, 0.018)
    done(p, 0.6)


def tissue():
    p = Prop('prop_md_tissue', base=0xffffff, target_faces=700, voxel=0.008)
    p.quadriflow = False
    N, Hs = 10, 0.24
    verts, faces = [], []
    for side, dz in ((0, -0.012), (1, 0.012)):
        for i in range(N + 1):
            for j in range(N + 1):
                u, v = -1 + 2 * i / N, -1 + 2 * j / N
                z = 0.05 * (u * u + v * v) * (0.6 + 0.4 * math.sin(u * 3 + v * 2)) - 0.035 * math.cos(u * 2.4) + dz
                verts.append((u * Hs * (1 - 0.06 * v * v), v * Hs * (1 - 0.05 * u * u), z))
    idx = lambda s_, i, j: s_ * (N + 1) ** 2 + i * (N + 1) + j
    for i in range(N):
        for j in range(N):
            faces.append((idx(1, i, j), idx(1, i + 1, j), idx(1, i + 1, j + 1), idx(1, i, j + 1)))
            faces.append((idx(0, i, j), idx(0, i, j + 1), idx(0, i + 1, j + 1), idx(0, i + 1, j)))
    for i in range(N):
        faces.append((idx(0, i, 0), idx(0, i + 1, 0), idx(1, i + 1, 0), idx(1, i, 0)))
        faces.append((idx(0, i + 1, N), idx(0, i, N), idx(1, i, N), idx(1, i + 1, N)))
        faces.append((idx(0, 0, i + 1), idx(0, 0, i), idx(1, 0, i), idx(1, 0, i + 1)))
        faces.append((idx(0, N, i), idx(0, N, i + 1), idx(1, N, i + 1), idx(1, N, i)))
    p.mesh(verts, faces, bevel=0.01)
    p.paint_fn(lambda q, n: n.z < -0.3, 0xe8eef7)
    p.paint_fn(lambda q, n: abs(q.x + q.y * 0.15) < 0.012 and n.z > 0.3, 0xdde6f2)
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
    # mattress
    p.layer('mattress', base=0xffffff, target_faces=700, voxel=0.02)
    p.box((0.0, 0.85, 0), (hx - 0.12, 0.2, D / 2 - 0.06), bevel=0.14)
    p.paint_fn(lambda q, n: n.y < -0.5, 0xe6eef5)
    # pillow
    p.layer('pillow', base=0xffffff, target_faces=500, voxel=0.016)
    p.blob((-hx + 0.75, 1.17, 0), (0.48, 0.17, 0.8), group='pillow')
    for s in (-1, 1):
        p.blob((-hx + 0.75, 1.15, s * 0.72), (0.4, 0.13, 0.18), group='pillow')
    p.paint_fn(lambda q, n: abs(q.z) > 0.82, 0xffc2d8)
    p.paint_fn(lambda q, n: n.y < -0.3, 0xe9eef6)
    p.layer('skin')
    p.anchor('pillow', (-hx + 0.75, 1.3, 0), 'body')
    done(p, 3.0, 0.024)


def duvet():
    p = Prop('prop_md_duvet', base=WHITE, target_faces=1800, voxel=0.02)
    W, D, Hh = 1.7, 1.15, 0.13
    # a soft quilted slab: rows of puffy squares melted together
    for i in range(6):
        for j in range(4):
            x = -W + (i + 0.5) * (2 * W / 6)
            z = -D + (j + 0.5) * (2 * D / 4)
            p.blob((x, Hh, z), (W / 6 + 0.06, Hh, D / 4 + 0.06), group='q')
    p.paint_fn(lambda q, n: n.y < 0.2, 0xe2e2e2)
    p.layer('stars', base=0xffe27a, target_faces=700, voxel=0.008)
    for i in range(6):
        for j in range(4):
            if (i + j) % 2:
                continue
            x = -W + (i + 0.5) * (2 * W / 6)
            z = -D + (j + 0.5) * (2 * D / 4)
            poly = [(x + a * 0.17, z - b * 0.17) for a, b in STAR]
            n = len(poly)
            v = [(a, y, b) for y in (2 * Hh - 0.02, 2 * Hh + 0.025) for a, b in poly]
            f = [tuple(range(n - 1, -1, -1)), tuple(range(n, 2 * n))] + [(i_, (i_ + 1) % n, n + (i_ + 1) % n, n + i_) for i_ in range(n)]
            p.mesh(v, f, bevel=0.008)
    p.layer('skin')
    tinted(p, 0x8fc7ff, 0.02)
    done(p, 0.3)


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
    p = Prop('prop_md_drape', base=WHITE, target_faces=1600, voxel=0.01)
    p.quadriflow = False
    nx, ny = 48, 10
    verts, faces = [], []
    for side, dz in ((0, -0.03), (1, 0.03)):
        for i in range(nx + 1):
            for j in range(ny + 1):
                x = -0.5 + i / nx
                y = j / ny
                z = 0.07 * math.sin(i / nx * TAU * 5) * (1 + 0.25 * (1 - y)) + dz
                verts.append((x, y, z))
    idx = lambda s, i, j: s * (nx + 1) * (ny + 1) + i * (ny + 1) + j
    for i in range(nx):
        for j in range(ny):
            faces.append((idx(1, i, j), idx(1, i + 1, j), idx(1, i + 1, j + 1), idx(1, i, j + 1)))
            faces.append((idx(0, i, j), idx(0, i, j + 1), idx(0, i + 1, j + 1), idx(0, i + 1, j)))
    for i in range(nx):
        faces.append((idx(0, i, 0), idx(0, i + 1, 0), idx(1, i + 1, 0), idx(1, i, 0)))
        faces.append((idx(0, i + 1, ny), idx(0, i, ny), idx(1, i, ny), idx(1, i + 1, ny)))
    for j in range(ny):
        faces.append((idx(0, 0, j), idx(0, 0, j + 1), idx(1, 0, j + 1), idx(1, 0, j)))
        faces.append((idx(0, nx, j + 1), idx(0, nx, j), idx(1, nx, j), idx(1, nx, j + 1)))
    p.mesh(verts, faces)
    p.paint_fn(lambda q, n: math.sin(((q.x + 0.5) * 5 + 0.25) * TAU) < -0.55, 0xe4e4e4)
    p.paint_fn(lambda q, n: q.y > 0.9, 0xf2f2f2)
    tinted(p, 0x8fd0ff, 0.012)
    done(p, 1.0)


MODELS = dict(prop_md_sink=sink, prop_md_knob=knob, prop_md_stool=stool, prop_md_soap=soap, prop_md_brush=brush,
              prop_md_paste=paste, prop_md_cup=cup, prop_md_towel=towel, prop_md_bath=bath,
              prop_md_bottle=bottle, prop_md_tissues=tissues, prop_md_tissue=tissue, prop_md_bin=bin_, prop_md_binlid=binlid,
              prop_md_hairbrush=hairbrush, prop_md_bed=bed, prop_md_duvet=duvet, prop_md_table=table, prop_md_clock=clock,
              prop_md_lamp=lamp, prop_md_drape=drape)
for name, fn in MODELS.items():
    if not ONLY or name in ONLY:
        fn()
