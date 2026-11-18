"""WORDS batch 9, furniture and rooms (docs/design/WORDS.md, words 244-255). One script, several models
(ONLY=prop_word_sofa,prop_word_oven tools/blender/build.sh prop_words_rooms builds a subset).
Everything stands on y = 0, centred on x and z, facing +z, in the Home-world toy style (rounded, chunky, WOOD feet).
extras: outline, fit (card height) and wide (card width, when wider than tall) for the 2 x 2 word card.

  prop_word_sofa     a plump two-seat GREEN sofa (3.2 wide): fat rolled arms, two seat and two back cushions (a tufted
                     button each), four short WOOD feet, one YELLOW scatter cushion in the left corner.
  prop_word_stairs   five chunky WOOD steps rising to the right (built turned 30 degrees so the risers face the camera),
                     a RED runner with darker borders, a BROWN handrail on three fat posts along the far side, a ball
                     on the bottom post.
  prop_word_oven     a rounded WHITE cooker: big door (bone 'door', rotation.x + opens it down) with a dark SKY window
                     and an ORANGE glowing tray, GREY bar handle, four INK hob rings, a row of four RED knobs.
  prop_word_toilet   a rounded WHITE toilet: oval bowl with BLUE water, a seat, the lid standing open (bone 'lid',
                     rotation.x + closes it), a tall cistern with a GREY push button, a loo roll on a stand at the side.
  prop_word_pillow   a fat puffy pillow with pointed corners and a sagging middle crease, WHITE with SKY ticking
                     stripes and a frill on the left end, standing up and leaning back a little.
  prop_word_quilt    a thick patchwork quilt hanging over a low WOOD rail in soft folds: puffy squares in RED, YELLOW,
                     GREEN, BLUE, PINK, each tufted with a dimple and a darker stitch dot, a WHITE scalloped border
                     (the top fold over the rail is WHITE too).
  prop_word_blanket  a folded PURPLE fleece baby blanket (a thick square of three folds) with a wide satin PINK edge,
                     one WHITE star and the front-right corner flopped back showing its paler underside; tipped up
                     30 degrees toward the camera so the top reads on a card.
"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded, circle_poly, star_poly, rot_m
from mathutils import Vector

ONLY = [s for s in os.environ.get('ONLY', '').split(',') if s]
TAU = math.tau
RED, ORANGE, YELLOW, GREEN, LEAF, BLUE, SKY, PURPLE = 0xff4f4f, 0xff9a2e, 0xffd23a, 0x4cc75a, 0x2f8a3a, 0x3f8cff, 0x8fd3ff, 0x9b6dff
PINK, ROSE, CREAM, WHITE, BROWN, WOOD, TAN, GREY, SLATE, INK = 0xff7fbf, 0xff9ec4, 0xf2e8d8, 0xfffaf0, 0xb07a4a, 0xd8924f, 0xf3d9ae, 0xb9c0c9, 0x6f7a8c, 0x3a2838


def mix(a, b, t):
    ca = [(a >> s) & 255 for s in (16, 8, 0)]
    cb = [(b >> s) & 255 for s in (16, 8, 0)]
    c = [round(x + (y - x) * t) for x, y in zip(ca, cb)]
    return (c[0] << 16) | (c[1] << 8) | c[2]


def lite(c, t=0.35):
    return mix(c, WHITE, t)


def dark(c, t=0.2):
    return mix(c, INK, t)


def finish(p, w, h, outline=0.026):
    """body bone straight up; card fit: scale so the bigger of w / h fills 2.0"""
    if not any(b[0] == 'body' for b in p.bones):
        p.bone('body', (0, 0, 0), (0, h, 0))
    k = min(2.0 / h, 2.0 / w)
    p.extras['fit'] = round(h * k, 2)
    if w > h:
        p.extras['wide'] = round(w * k, 2)
    p.extras['outline'] = outline
    p.build()


def prism(p, poly, a0, a1, xf=None, axis='z'):
    """extrude a 2D polygon [(u, v)...] between a0 and a1 along axis. axis 'z': (u, v) = (x, y); 'y': (u, v) = (x, z).
    xf: optional function mapping each game-space point (after placement) to its final position."""
    m = len(poly)
    verts = []
    for a in (a0, a1):
        cu = sum(u for u, v in poly) / m
        cv = sum(v for u, v in poly) / m
        for u, v in [(cu, cv)] + list(poly):
            q = (u, v, a) if axis == 'z' else (u, a, v)
            verts.append(xf(q) if xf else q)
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


def puffy(W, H, T, s=0.14, crease=0.0, nu=30, nv=22, power=0.42):
    """a pillow: a W x H (half sizes) puffy rectangle in the xy plane, half thickness T, pointed corners (concave sides
    by s), optional sagging crease down the middle. Returns (verts, faces) in local space."""
    def pos(u, v, side):
        x = W * u * (1 - s * (1 - v * v))
        y = H * v * (1 - s * (1 - u * u))
        f = max(0.0, (1 - u * u) * (1 - v * v)) ** power
        f *= 1 - crease * math.exp(-(u / 0.22) ** 2) * (0.6 + 0.4 * (1 - v * v))
        return (x, y, side * T * f)
    idx = {}
    verts = []
    for side in (1, -1):
        for i in range(nu + 1):
            for j in range(nv + 1):
                edge = i in (0, nu) or j in (0, nv)
                if side < 0 and edge:
                    idx[(side, i, j)] = idx[(1, i, j)]
                    continue
                idx[(side, i, j)] = len(verts)
                verts.append(pos(-1 + 2 * i / nu, -1 + 2 * j / nv, side))
    faces = []
    for i in range(nu):
        for j in range(nv):
            a, b, c, d = [(i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1)]
            faces.append(tuple(idx[(1, *k)] for k in (a, b, c, d)))
            faces.append(tuple(idx[(-1, *k)] for k in (d, c, b, a)))
    return verts, faces


def place(verts, pos=(0, 0, 0), rot=(0, 0, 0)):
    M = rot_m(rot)
    return [tuple(M @ Vector(v) + Vector(pos)) for v in verts]


# ---------------------------------------------------------------- sofa
def sofa():
    G_L, G_D = lite(GREEN, 0.22), dark(GREEN, 0.22)
    p = Prop('prop_word_sofa', base=GREEN, target_faces=1100, voxel=0.02, smooth=4)
    p.box((0, 0.56, 0.02), (1.22, 0.28, 0.6), bevel=0.2)                    # seat base
    p.box((0, 1.12, -0.44), (1.22, 0.62, 0.19), bevel=0.18)                 # back frame
    for s in (-1, 1):                                                       # fat rolled arms
        p.box((s * 1.3, 0.78, 0.0), (0.22, 0.48, 0.62), bevel=0.2)
        p.cyl((s * 1.36, 1.2, -0.63), 0.29, 1.28, rot=(90, 0, 0), bevel=0.13, seg=36)
    p.paint_fn(lambda q, n: n.y < -0.55, G_D)
    # the scroll on the front of each rolled arm
    p.paint_fn(lambda q, n: n.z > 0.6 and any(0.13 < math.hypot(q.x - s * 1.36, q.y - 1.2) < 0.2 for s in (-1, 1)), G_D)
    p.layer('seat', base=G_L, target_faces=600, voxel=0.016)
    for s in (-1, 1):
        p.box((s * 0.55, 0.94, 0.08), (0.53, 0.16, 0.54), bevel=0.15)
    p.layer('back', base=G_L, target_faces=650, voxel=0.016)
    for s in (-1, 1):
        p.box((s * 0.55, 1.36, -0.2), (0.53, 0.4, 0.15), rot=(-9, 0, 0), bevel=0.14)
    # a tufted dimple round each button
    p.paint_fn(lambda q, n: n.z > 0.4 and any(math.hypot(q.x - s * 0.55, q.y - 1.42) < 0.11 for s in (-1, 1)), GREEN)
    p.layer('buttons', base=G_D, target_faces=120, voxel=0.008)
    for s in (-1, 1):
        p.blob((s * 0.55, 1.42, -0.04), (0.055, 0.055, 0.035), group='b%d' % s)
    p.layer('feet', base=WOOD, target_faces=260, voxel=0.012)
    for sx in (-1, 1):
        for sz in (-1, 1):
            p.cyl((sx * 1.28, 0, sz * 0.44), 0.09, 0.32, r2=0.12, bevel=0.04, seg=18)
    p.paint_fn(lambda q, n: q.y < 0.07, dark(WOOD, 0.2))
    # the scatter cushion leaning in the left corner
    p.layer('cushion', base=YELLOW, target_faces=520, voxel=0.012)
    v, f = puffy(0.31, 0.31, 0.12, s=0.16)
    p.mesh(place(v, (-0.76, 1.27, -0.02), (-14, 0, 13)), f)
    p.paint_fn(lambda q, n: n.y < -0.3, dark(YELLOW, 0.12))
    finish(p, 3.25, 1.71)


# ---------------------------------------------------------------- stairs
def stairs():
    TURN = 42.0                       # turned so the risers face the camera (+x end goes back)
    Ry = rot_m((0, TURN, 0)); Ri = Ry.transposed()
    fw = lambda q: tuple(Ry @ Vector(q))
    loc = lambda q: Ri @ Vector(q)
    N, R, TR, HW = 5, 0.38, 0.42, 0.56
    x0, xe = -N * TR / 2, N * TR / 2
    W_D, W_L = dark(WOOD, 0.18), lite(WOOD, 0.18)
    p = Prop('prop_word_stairs', base=WOOD, target_faces=1000, voxel=0.018, smooth=3)
    for i in range(N):
        xa = x0 + i * TR
        p.box(fw(((xa + xe) / 2, (i + 1) * R / 2, 0)), ((xe - xa) / 2, (i + 1) * R / 2, HW), rot=(0, TURN, 0), bevel=0.07)
    p.paint_fn(lambda q, n: abs((Ri @ n).z) > 0.7, W_D)                                    # the sides
    p.paint_fn(lambda q, n: (Ri @ n).y > 0.7, W_L)                                         # treads
    # two grain lines on every riser
    def grain(q, n):
        l, ln = loc(q), Ri @ n
        if ln.x > -0.7:
            return False
        f = (l.y % R) / R
        return abs(f - 0.36) < 0.045 or abs(f - 0.68) < 0.045
    p.paint_fn(grain, dark(WOOD, 0.1))
    # the runner: a zigzag strip over treads and risers, darker borders
    p.layer('runner', base=RED, target_faces=520, voxel=0.01)
    d_out, d_in = 0.045, -0.02
    def zig(d):
        pts = [(x0 - d, 0.0)]
        for i in range(N):
            xa = x0 + i * TR
            pts.append((xa - d, (i + 1) * R + d))
            if i < N - 1:
                pts.append((xa + TR - d, (i + 1) * R + d))
        pts.append((xe - 0.12, N * R + d))
        return pts
    outer, inner = zig(d_out), zig(d_in)
    band(p, outer, inner, -0.3, 0.3, xf=fw)
    p.paint_fn(lambda q, n: abs(loc(q).z) > 0.235, dark(RED, 0.25))
    # handrail on the far side: three fat posts, a sloping rail, a ball on the bottom post
    p.layer('rail', base=BROWN, target_faces=650, voxel=0.012)
    ZP, PH = -HW + 0.13, 0.95
    posts = [(x0 + TR * 0.5, R), (x0 + TR * 2.5, 3 * R), (x0 + TR * 4.5, 5 * R)]
    for x, y in posts:
        p.tube([fw((x, y - 0.05, ZP)), fw((x, y + PH, ZP))], 0.07, rseg=12)
    (xa, ya), (xb, yb) = posts[0], posts[-1]
    p.tube([fw((xa - 0.05, ya + PH - 0.03, ZP)), fw((xb + 0.08, yb + PH + 0.04, ZP))], 0.075, rseg=12)
    p.blob(fw((xa, ya + PH + 0.12, ZP)), (0.15, 0.15, 0.15), group='ball')
    p.blob(fw((xb, yb + PH + 0.08, ZP)), (0.1, 0.1, 0.1), group='cap')
    p.paint_fn(lambda q, n: (Ri @ n).y < -0.6, dark(BROWN, 0.15))
    p.layer('skin')
    finish(p, 2.18, 3.00)


# ---------------------------------------------------------------- oven
def oven():
    W, H, D = 0.75, 1.9, 0.58
    p = Prop('prop_word_oven', base=WHITE, target_faces=1200, voxel=0.02, smooth=4)
    p.box((0, 1.0, 0), (W, 0.9, D), bevel=0.2)
    p.paint_fn(lambda q, n: n.y < -0.5, dark(WHITE, 0.1))
    # control strip: a soft cream band across the top front
    p.paint_fn(lambda q, n: n.z > 0.5 and q.y > 1.43 and q.y < 1.78, CREAM)
    p.layer('feet', base=GREY, target_faces=160, voxel=0.01)
    for sx in (-1, 1):
        for sz in (-1, 1):
            p.cyl((sx * 0.55, 0, sz * 0.4), 0.08, 0.16, bevel=0.03, seg=16)
    # the door (moves on bone 'door'): panel, window, handle
    p.layer('doorpanel', base=WHITE, target_faces=420, voxel=0.012)
    p.box((0, 0.79, D + 0.02), (0.63, 0.56, 0.05), bevel=0.09)
    p.layer('window', base=dark(SKY, 0.42), target_faces=420, voxel=0.008)
    p.box((0, 0.72, D + 0.07), (0.46, 0.3, 0.03), bevel=0.08)
    win = lambda q, n: n.z > 0.5
    p.paint_fn(lambda q, n: win(q, n) and abs(q.x) < 0.36 and 0.5 < q.y < 0.6, ORANGE)                 # the tray
    p.paint_fn(lambda q, n: win(q, n) and abs(q.x) < 0.3 and 0.6 <= q.y < 0.67, lite(ORANGE, 0.45))   # its glow
    def glint(q, n):
        u, v = q.x / 0.46, (q.y - 0.72) / 0.3
        return win(q, n) and ((abs(u + v - 0.75) < 0.16 and u < 0.0) or (abs(u + v - 1.18) < 0.07 and u < 0.2))
    p.paint_fn(glint, WHITE)
    p.layer('handle', base=GREY, target_faces=300, voxel=0.008)
    p.tube([(-0.5, 1.21, D + 0.19), (0.5, 1.21, D + 0.19)], 0.06, rseg=12)
    for s in (-1, 1):
        p.tube([(s * 0.44, 1.21, D + 0.04), (s * 0.44, 1.21, D + 0.19)], 0.05, rseg=10)
    p.paint_fn(lambda q, n: n.y > 0.55 and q.z > D + 0.14, WHITE)
    # hob rings on top and the row of knobs
    p.layer('hob', base=INK, target_faces=420, voxel=0.01)
    for sx in (-1, 1):
        for sz in (-1, 1):
            p.cyl((sx * 0.36, 1.86, sz * 0.27), 0.22, 0.1, bevel=0.035, seg=28)
    p.paint_fn(lambda q, n: n.y > 0.6 and any(0.09 < math.hypot(q.x - sx * 0.36, q.z - sz * 0.27) < 0.13 for sx in (-1, 1) for sz in (-1, 1)), SLATE)
    p.layer('knobs', base=RED, target_faces=320, voxel=0.009)
    for x in (-0.5, -0.17, 0.17, 0.5):
        p.cyl((x, 1.6, D - 0.02), 0.11, 0.13, rot=(90, 0, 0), bevel=0.04, seg=20)
    p.paint_fn(lambda q, n: n.z > 0.6 and any(abs(q.x - x) < 0.025 and q.y > 1.6 for x in (-0.5, -0.17, 0.17, 0.5)), WHITE)
    p.layer('skin')
    door_layers = ('doorpanel', 'window', 'handle')
    p.bone('body', (0, 0, 0), (0, H, 0), region=lambda q: p._cur not in door_layers)
    p.bone('door', (0, 0.24, D + 0.02), (0, 0.6, D + 0.02), parent='body', region=lambda q: p._cur in door_layers)
    finish(p, 1.50, 1.95)


# ---------------------------------------------------------------- toilet
def toilet():
    BZ = 0.14                                   # bowl centre z
    SC = (0.8, 1.12)                            # oval
    p = Prop('prop_word_toilet', base=WHITE, target_faces=1200, voxel=0.016, smooth=4)
    prof = [(0, 0), (0.3, 0), (0.33, 0.04), (0.25, 0.3), (0.3, 0.5), (0.44, 0.73), (0.46, 0.82), (0.44, 0.86),
            (0.37, 0.85), (0.33, 0.72), (0.2, 0.6), (0, 0.58)]
    p.lathe(rounded(prof, 0.03, n=3), pos=(0, 0, BZ), scale=SC, seg=40)
    p.box((0, 0.62, -0.32), (0.22, 0.32, 0.13), bevel=0.08)                   # back neck up to the cistern
    p.box((0, 1.44, -0.52), (0.42, 0.52, 0.17), bevel=0.13)                   # tall cistern
    p.paint_fn(lambda q, n: n.y < -0.5 and q.y < 0.05, dark(WHITE, 0.1))
    p.layer('cistlid', base=WHITE, target_faces=200, voxel=0.012)
    p.box((0, 1.97, -0.52), (0.46, 0.06, 0.21), bevel=0.05)
    p.layer('water', base=BLUE, target_faces=260, voxel=0.01)
    p.cyl((0, 0.6, BZ), 0.3, 0.07, scale=SC, bevel=0.02, seg=32)
    p.paint_fn(lambda q, n: n.y > 0.5 and 0.15 < math.hypot(q.x / SC[0], (q.z - BZ) / SC[1]) < 0.2 and q.x < 0, lite(BLUE, 0.5))
    p.layer('seat', base=WHITE, target_faces=420, voxel=0.01)
    sp = rounded([(0.31, 0.86), (0.48, 0.86), (0.48, 0.93), (0.31, 0.93)], 0.03, n=2)
    p.lathe(sp, pos=(0, 0, BZ), scale=SC, seg=40, closed=True)
    # the lid, standing open against the cistern (bone 'lid')
    p.layer('lidpanel', base=WHITE, target_faces=420, voxel=0.01)
    LH, LW = 0.47, 0.39
    p.blob((0, 0.93 + LH, -0.29), (LW, LH, 0.055), rot=(-7, 0, 0), group='lid')
    p.paint_fn(lambda q, n: n[2] > 0.5 and math.hypot(q[0] / LW, (q[1] - 0.93 - LH) / LH) > 0.8, dark(WHITE, 0.07))
    p.layer('button', base=GREY, target_faces=180, voxel=0.008)
    p.cyl((0, 2.0, -0.52), 0.13, 0.09, bevel=0.035, seg=24)
    p.paint_fn(lambda q, n: n.y > 0.6 and q.x < -0.02 and q.x > -0.07, WHITE)
    # the loo roll on a bracket on the side of the cistern, a sheet hanging down
    p.layer('holder', base=GREY, target_faces=200, voxel=0.009)
    RX, RY, RZ = 0.66, 1.18, -0.42
    p.tube([(0.4, RY + 0.12, RZ - 0.1), (RX - 0.1, RY + 0.12, RZ - 0.1), (RX - 0.1, RY, RZ - 0.1), (RX + 0.2, RY, RZ - 0.1)], 0.04, rseg=8)
    p.paint_fn(lambda q, n: n[1] > 0.6, WHITE)
    p.layer('roll', base=WHITE, target_faces=380, voxel=0.009)
    p.cyl((RX - 0.08, RY, RZ), 0.2, 0.3, rot=(0, 0, -90), bevel=0.05, seg=28)
    p.box((RX + 0.07, RY - 0.24, RZ + 0.17), (0.13, 0.22, 0.03), rot=(-6, 0, 0), bevel=0.025)     # the sheet
    p.paint_fn(lambda q, n: abs(n[0]) > 0.6 and math.hypot(q[1] - RY, q[2] - RZ) < 0.07, SLATE)
    p.paint_fn(lambda q, n: abs(n[0]) > 0.6 and 0.07 <= math.hypot(q[1] - RY, q[2] - RZ) < 0.095, TAN)
    p.paint_fn(lambda q, n: n[2] > 0.5 and q[1] < RY - 0.32 and abs(q[1] - (RY - 0.38)) < 0.012, SKY)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 2.0, 0), region=lambda q: p._cur != 'lidpanel')
    p.bone('lid', (0, 0.93, -0.27), (0, 1.3, -0.27), parent='body', region=lambda q: p._cur == 'lidpanel')
    finish(p, 1.30, 2.09)


# ---------------------------------------------------------------- pillow
def pillow():
    p = Prop('prop_word_pillow', base=WHITE, target_faces=780, voxel=0.012, smooth=3)
    W, H, T = 0.74, 0.44, 0.21
    LEAN = -12
    v, f = puffy(W, H, T, s=0.12, crease=0.32)
    vv = place(v, (0, 0, 0), (LEAN, 0, 0))
    y0 = min(q[1] for q in vv)
    lift = lambda q: (q[0], q[1] - y0 - 0.002, q[2])
    p.mesh([lift(q) for q in vv], f)
    # ticking stripes running up the pillow
    p.paint_fn(lambda q, n: abs(n.y) < 0.9 and abs(q.x) < 0.66 and abs(((q.x + 0.15) % 0.3) - 0.15) < 0.045, SKY)
    p.layer('frill', base=WHITE, target_faces=220, voxel=0.008)
    M = rot_m((LEAN, 0, 0))
    verts, faces = [], []
    K = 40
    for k in range(K + 1):
        vv_ = -1 + 2 * k / K
        xe = -W * (1 - 0.12 * (1 - vv_ * vv_))
        y = H * vv_ * (1 - 0.12 * 0) * 0.98
        zc = 0.035 * math.sin(vv_ * math.pi * 4.5)
        for dx, dz in ((0.03, -0.035), (-0.14, -0.035), (-0.14, 0.035), (0.03, 0.035)):
            q = M @ Vector((xe + dx, y, zc + dz))
            verts.append(lift(tuple(q)))
    for k in range(K):
        for i in range(4):
            j = (i + 1) % 4
            faces.append((k * 4 + i, k * 4 + j, (k + 1) * 4 + j, (k + 1) * 4 + i))
    faces.append((3, 2, 1, 0))
    b = K * 4
    faces.append((b, b + 1, b + 2, b + 3))
    p.mesh(verts, faces)
    p.layer('skin')
    finish(p, 1.55, 0.86, outline=0.018)


# ---------------------------------------------------------------- quilt
def quilt():
    COLS = [RED, YELLOW, GREEN, BLUE, PINK]
    BY, BR = 1.48, 0.075                 # rail height, radius
    QW, SQ, NC = 0.9, 0.31, 5            # quilt half width, square size, columns
    IX = NC * SQ / 2                     # squares area half width (border outside)
    TH = 0.05                            # half thickness
    YB = 0.34                            # bottom of the hem (above the scallops)
    NROW = 3
    p = Prop('prop_word_quilt', base=WHITE, target_faces=1700, voxel=0.011, smooth=3)

    def fold(x, t):                      # t: 0 at the rail .. 1 at the hem
        return 0.055 * t ** 1.1 * math.sin(TAU * x / 0.62 + 0.6)

    def ybot(x):                         # scalloped hem
        f = ((x + QW) % 0.18) / 0.09 - 1
        return YB - 0.065 * math.sqrt(max(0.0, 1 - f * f))

    def sq_uv(x, y):                     # square coords for a point on the hanging part
        col = (x + IX) / SQ
        row = (BY + 0.02 - y) / SQ
        return col, row

    def puff(x, y):
        col, row = sq_uv(x, y)
        if abs(x) > IX or row < 0 or row > NROW:
            return 0.0
        fu, fv = col % 1, row % 1
        b = (math.sin(math.pi * fu) * math.sin(math.pi * fv)) ** 0.5 * 0.03
        b -= 0.022 * math.exp(-((fu - 0.5) ** 2 + (fv - 0.5) ** 2) / 0.012)
        return b

    # the cross-section path round the rail: front (z > 0) hangs lower and flares, back shorter
    NX, NS = 64, 70
    def centre(x, s):
        """s in [0, 1]: 0 = front hem, 0.42 = front top, 0.58 = back top, 1 = back hem"""
        if s <= 0.42:
            t = 1 - s / 0.42
            yb = ybot(x)
            y = BY - (BY - yb) * t
            z = BR + TH + 0.2 * t ** 2 + fold(x, t)
            return Vector((x, y, z)), 1
        if s >= 0.58:
            t = (s - 0.58) / 0.42
            y = BY - (BY - 0.95) * t
            z = -(BR + TH) - 0.08 * t ** 2 + fold(x + 0.3, t) * 0.6
            return Vector((x, y, z)), -1
        a = math.pi * (s - 0.42) / 0.16
        return Vector((x, BY + (BR + TH) * math.sin(a), (BR + TH) * math.cos(a))), 0

    P = [[centre(-QW + 2 * QW * i / NX, k / NS) for k in range(NS + 1)] for i in range(NX + 1)]
    verts, faces = [], []
    def vid(i, k, side):
        return ((i * (NS + 1)) + k) * 2 + side
    for i in range(NX + 1):
        for k in range(NS + 1):
            c, part = P[i][k]
            a = P[max(i - 1, 0)][k][0]; b = P[min(i + 1, NX)][k][0]
            d = P[i][max(k - 1, 0)][0]; e = P[i][min(k + 1, NS)][0]
            nrm = (b - a).cross(e - d)
            nrm = nrm.normalized() if nrm.length > 1e-9 else Vector((0, 0, 1))
            out = TH + (puff(c.x, c.y) if part == 1 else 0.0)
            verts.append(tuple(c + nrm * out))
            verts.append(tuple(c - nrm * TH))
    for i in range(NX):
        for k in range(NS):
            faces.append((vid(i, k, 0), vid(i + 1, k, 0), vid(i + 1, k + 1, 0), vid(i, k + 1, 0)))
            faces.append((vid(i, k + 1, 1), vid(i + 1, k + 1, 1), vid(i + 1, k, 1), vid(i, k, 1)))
    for i in range(NX):                  # hems
        for k in (0, NS):
            faces.append((vid(i, k, 0), vid(i, k, 1), vid(i + 1, k, 1), vid(i + 1, k, 0)))
    for k in range(NS):                  # sides
        for i in (0, NX):
            faces.append((vid(i, k, 0), vid(i, k + 1, 0), vid(i, k + 1, 1), vid(i, k, 1)))
    p.mesh(verts, faces)

    def colour(q, n):
        if abs(q.x) > IX or q.y < BY - NROW * SQ + 0.02 or q.y > BY - 0.01:
            return WHITE
        col, row = sq_uv(q.x, q.y if q.y < BY else BY)
        ci, ri = int(col), int(row)
        if q.z < -0.02 and q.y < BY - 0.06:
            ri += 7
        c = COLS[(ci + 2 * ri) % 5]
        fu, fv = col % 1, row % 1
        if q.z > 0 and q.y < BY - 0.02 and math.hypot(fu - 0.5, fv - 0.5) < 0.17:
            return dark(c, 0.3)
        return c
    for c in COLS:
        p.paint_fn(lambda q, n, c=c: colour(q, n) == c, c)
        p.paint_fn(lambda q, n, c=c: colour(q, n) == dark(c, 0.3), dark(c, 0.3))
    # the rail
    p.layer('rail', base=WOOD, target_faces=360, voxel=0.012)
    for s in (-1, 1):
        p.tube([(s * 1.04, 0.05, 0), (s * 1.04, BY + 0.02, 0)], 0.07, rseg=12)
        p.blob((s * 1.04, BY + 0.08, 0), (0.12, 0.12, 0.12), group='k%d' % s)
        p.tube([(s * 1.04, 0.07, -0.34), (s * 1.04, 0.07, 0.34)], 0.07, rseg=12)
    p.tube([(-1.04, BY, 0), (1.04, BY, 0)], BR, rseg=14)
    p.tube([(-1.04, 0.3, 0), (1.04, 0.3, 0)], 0.055, rseg=10)
    p.paint_fn(lambda q, n: n.y < -0.6, dark(WOOD, 0.18))
    p.layer('skin')
    finish(p, 2.20, 1.62)


# ---------------------------------------------------------------- blanket
def blanket():
    TILT = 30.0
    S, LT = 0.62, 0.1                                    # half size, one fold's thickness
    Rx = rot_m((TILT, 0, 0)); Ri = Rx.transposed()
    lift = S * math.sin(math.radians(TILT)) - 0.012
    fw = lambda q: tuple(Rx @ Vector(q) + Vector((0, lift, 0)))
    loc = lambda q: Ri @ (Vector(q) - Vector((0, lift, 0)))
    P_L = lite(PURPLE, 0.3)
    p = Prop('prop_word_blanket', base=PURPLE, target_faces=900, voxel=0.012, smooth=4)
    # three folds stacked (the bevels make soft grooves between them)
    for k in range(2):
        p.box(fw((0, LT * (k + 0.5), 0)), (S, LT * 0.5 + 0.004, S), rot=(TILT, 0, 0), bevel=0.06)
    K = 0.72                                             # the top fold, its front-right corner folded back along x + z = K
    sq = rounded([(-S, -S), (S, -S), (S, K - S), (K - S, S), (-S, S)], 0.07, n=3, closed=True)
    prism(p, [(x, z) for x, z in sq], 2 * LT - 0.004, 3 * LT, xf=fw, axis='y')
    p.paint_fn(lambda q, n: (Ri @ n).y < -0.6, dark(PURPLE, 0.15))
    # wide satin binding: a fat ribbon wrapping the top fold's two open edges (front, left), a sheen line on top
    p.layer('binding', base=PINK, target_faces=420, voxel=0.009)
    BW, BT = 0.075, LT * 0.56
    p.box(fw(((-S + (K - S)) / 2 - 0.01, 2.5 * LT, S - BW + 0.03)), ((K) / 2 + 0.01, BT, BW), rot=(TILT, 0, 0), bevel=0.05)
    p.box(fw((-S + BW - 0.03, 2.5 * LT, -0.01)), (BW, BT, S + 0.02), rot=(TILT, 0, 0), bevel=0.05)
    p.paint_fn(lambda q, n: (Ri @ n).y > 0.6 and (abs(loc(q).z - (S - BW + 0.03)) < 0.022 or abs(loc(q).x - (-S + BW - 0.03)) < 0.022), ROSE)
    # the flopped corner: the reverse side (paler fleece) lying on top, pink binding along its two outer edges
    p.layer('flap', base=P_L, target_faces=420, voxel=0.009)
    C = K - S                                             # fold line ends at (S, C) and (C, S); corner lands at (C, C)
    tri = rounded([(S - 0.03, C), (C, S - 0.03), (C - 0.04, C - 0.04)], 0.06, n=3, closed=True)
    prism(p, tri, 3 * LT - 0.01, 3 * LT + 0.075, xf=fw, axis='y')
    p.tube([fw((S - 0.02, 3 * LT, C - 0.02)), fw((C - 0.02, 3 * LT, S - 0.02))], 0.05, rseg=10)
    def fedge(q, n):
        l = loc(q)
        return l.y > 3 * LT + 0.02 and (l.x < C + 0.085 or l.z < C + 0.085) and l.x + l.z < K - 0.05
    p.paint_fn(fedge, PINK)
    # one white star
    p.layer('star', base=WHITE, target_faces=300, voxel=0.007)
    st = star_poly(0.2, inner=0.48)
    prism(p, [(x - 0.22, -y - 0.16) for x, y in st], 3 * LT - 0.01, 3 * LT + 0.035, xf=fw, axis='y')
    p.layer('skin')
    finish(p, 1.25, 0.82, outline=0.018)


# ---------------------------------------------------------------- card variants of Home-world furniture
def glint_fn(panes, flip=False):
    """WHITE double glint in the upper left of each pane [(cx, cy, hu, hv)] on the +z face"""
    def f(q, n):
        if n.z < 0.5:
            return False
        for cx, cy, hu, hv in panes:
            u, v = (q.x - cx) / hu, (q.y - cy) / hv
            if abs(u) < 0.92 and abs(v) < 0.9:
                d = v * 0.85 - u * 0.55
                return abs(d - 0.45) < 0.14 or abs(d - 0.8) < 0.06
        return False
    return f


def table():
    W, D, TY = 0.95, 0.6, 1.22
    p = Prop('prop_word_table', base=WOOD, target_faces=700, voxel=0.016, smooth=4)
    p.box((0, TY, 0), (W, 0.1, D), bevel=0.085)                        # thick top, y 1.12..1.32
    p.paint_fn(lambda q, n: n.y > 0.6, lite(WOOD, 0.18))
    p.paint_fn(lambda q, n: n.y < -0.6, dark(WOOD, 0.2))
    p.layer('apron', base=dark(WOOD, 0.3), target_faces=260, voxel=0.012)
    p.box((0, 1.06, 0), (W - 0.2, 0.07, D - 0.2), bevel=0.04)
    p.layer('legs', base=WOOD, target_faces=500, voxel=0.012)
    for sx in (-1, 1):
        for sz in (-1, 1):
            p.cyl((sx * (W - 0.2), -0.03, sz * (D - 0.18)), 0.1, 1.11, r2=0.12, bevel=0.05, seg=18)
    p.paint_fn(lambda q, n: q.y < 0.08, dark(WOOD, 0.25))                # little dark feet
    p.layer('skin')
    finish(p, 1.81, 1.29)


def bed():
    L, D = 1.25, 0.66
    p = Prop('prop_word_bed', base=WOOD, target_faces=800, voxel=0.018, smooth=4)
    yz = lambda q: (q[2], q[1], q[0])                                  # poly in (z, y), extruded along x
    head = rounded([(-D - 0.04, -0.035), (D + 0.04, -0.035), (D + 0.04, 1.42), (0, 1.78), (-D - 0.04, 1.42)], 0.3, n=6, closed=True)
    prism(p, [q[:2] for q in head], -L - 0.12, -L + 0.06, xf=yz)
    foot = rounded([(-D - 0.04, -0.035), (D + 0.04, -0.035), (D + 0.04, 1.0), (0, 1.16), (-D - 0.04, 1.0)], 0.25, n=6, closed=True)
    prism(p, [q[:2] for q in foot], L - 0.06, L + 0.12, xf=yz)
    p.box((0, 0.42, 0), (L, 0.16, D), bevel=0.08)                     # the base under the mattress
    p.paint_fn(lambda q, n: abs(n.x) > 0.6 and q.y > 0.3 and any(abs(q.y - y) < 0.03 for y in (0.62, 0.9)) and abs(q.z) < D - 0.15, dark(WOOD, 0.12))
    p.paint_fn(lambda q, n: q.y < 0.08, dark(WOOD, 0.25))
    p.layer('mattress', base=WHITE, target_faces=400, voxel=0.014)
    p.box((0, 0.72, 0), (L - 0.06, 0.15, D - 0.03), bevel=0.11)
    # the duvet: a thick puffy cover over the bottom two thirds, hanging over the sides, its top turned down
    p.layer('duvet', base=BLUE, target_faces=900, voxel=0.014)
    DX0, DX1 = -0.62, L - 0.04
    p.box(((DX0 + DX1) / 2, 0.93, 0), ((DX1 - DX0) / 2, 0.15, D + 0.05), bevel=0.14)
    for s in (-1, 1):
        p.box(((DX0 + DX1) / 2, 0.68, s * (D + 0.06)), ((DX1 - DX0) / 2, 0.28, 0.06), bevel=0.06)
    p.cyl((DX0 + 0.02, 1.0, -D - 0.09), 0.15, 2 * D + 0.18, rot=(90, 0, 0), bevel=0.06, seg=24)   # turned-down edge
    p.paint_fn(lambda q, n: q.x < DX0 + 0.16 and q.y > 0.84, lite(BLUE, 0.55))
    p.layer('stars', base=YELLOW, target_faces=300, voxel=0.007)
    for x, y, r in ((0.05, 0.72, 0.15), (0.72, 0.66, 0.12)):
        st = star_poly(r, inner=0.5)
        for zs in (1, -1):
            prism(p, [(a + x, b + y) for a, b in st], zs * (D + 0.105), zs * (D + 0.14))
    p.layer('pillow', base=WHITE, target_faces=420, voxel=0.011)
    v, f = puffy(D - 0.08, 0.3, 0.17, s=0.12)
    tl = rot_m((0, 0, 14))
    p.mesh([tuple(tl @ Vector((y, z, -x)) + Vector((-L + 0.42, 1.06, 0))) for x, y, z in v], f)
    p.paint_fn(lambda q, n: n.y < -0.3, dark(WHITE, 0.08))
    p.layer('skin')
    finish(p, 2.74, 1.65)


def window():
    FW, FH, B = 0.66, 0.74, 0.12                 # glass half sizes, frame width
    Y0 = 0.15
    CY = Y0 + B + FH
    p = Prop('prop_word_window', base=WHITE, target_faces=700, voxel=0.012, smooth=3)
    def rr(hw, hh, r):
        return [(q[0], q[1] + CY) for q in rounded([(-hw, -hh), (hw, -hh), (hw, hh), (-hw, hh)], r, n=5, closed=True)]
    o, i_ = rr(FW + B, FH + B, 0.2), rr(FW, FH, 0.1)
    band(p, o + o[:1], i_ + i_[:1], -0.08, 0.08)
    p.box((0, CY, 0.01), (0.05, FH + 0.02, 0.06), bevel=0.04)          # the cross bars
    p.box((0, CY, 0.01), (FW + 0.02, 0.05, 0.06), bevel=0.04)
    p.layer('glass', base=mix(SKY, BLUE, 0.3), target_faces=500, voxel=0.01)
    p.box((0, CY, -0.03), (FW + 0.03, FH + 0.03, 0.035), bevel=0.03)
    panes = [(sx * FW / 2, CY + sy * FH / 2, FW / 2 - 0.05, FH / 2 - 0.05) for sx in (-1, 1) for sy in (-1, 1)]
    p.paint_fn(glint_fn(panes), WHITE)
    p.layer('sill', base=WOOD, target_faces=220, voxel=0.012)
    p.box((0, 0.09, 0.08), (FW + B + 0.16, 0.09, 0.2), bevel=0.06)
    p.paint_fn(lambda q, n: n.y > 0.6, lite(WOOD, 0.18))
    p.layer('rail', base=WOOD, target_faces=240, voxel=0.01)
    RY = CY + FH + B + 0.12
    p.tube([(-FW - 0.42, RY, 0.14), (FW + 0.42, RY, 0.14)], 0.05, rseg=10)
    for s in (-1, 1):
        p.blob((s * (FW + 0.45), RY, 0.14), (0.09, 0.09, 0.09), group='k%d' % s)
    # curtains gathered to each side by a tie
    p.layer('curtains', base=PINK, target_faces=900, voxel=0.012)
    TY = CY - 0.12
    for s in (-1, 1):
        pts = [(s * (FW - 0.08), RY - 0.08, 0.2), (s * (FW + 0.05), (RY + TY) / 2 + 0.05, 0.22), (s * (FW + 0.2), TY, 0.24),
               (s * (FW + 0.2), (TY + Y0) / 2 + 0.08, 0.24), (s * (FW + 0.14), Y0 + 0.3, 0.24)]
        p.curve(pts, [0.25, 0.2, 0.13, 0.19, 0.24], group='c%d' % s, flat=0.4, per=8)
        p.blob((s * (FW - 0.08), RY - 0.06, 0.2), (0.27, 0.08, 0.1), group='c%d' % s)
    # soft fold lines down each curtain
    p.paint_fn(lambda q, n: n.z > 0.3 and abs(((abs(q.x) - FW + 0.2) % 0.16) - 0.08) < 0.022 and (q.y > TY + 0.1 or q.y < TY - 0.12), dark(PINK, 0.12))
    p.paint_fn(lambda q, n: q.y < Y0 + 0.24 and n.y < 0.2, dark(PINK, 0.15))
    p.layer('ties', base=YELLOW, target_faces=200, voxel=0.008)
    for s in (-1, 1):
        p.blob((s * (FW + 0.2), TY, 0.26), (0.2, 0.06, 0.12), group='t%d' % s)
    p.layer('skin')
    finish(p, 2.39, 2.07)


def mirror():
    RX, RY, B = 0.55, 0.78, 0.14
    CY = 0.42 + RY + B - 0.03
    p = Prop('prop_word_mirror', base=YELLOW, target_faces=700, voxel=0.013, smooth=3)
    N = 48
    ell = lambda a, b: [(a * math.sin(TAU * i / N), CY + b * math.cos(TAU * i / N)) for i in range(N)]
    o, i_ = ell(RX + B, RY + B), ell(RX - 0.01, RY - 0.01)
    band(p, o + o[:1], i_ + i_[:1], -0.08, 0.08)
    p.paint_fn(lambda q, n: n.y > 0.55, lite(YELLOW, 0.35))
    p.cyl((0, 0.1, -0.02), 0.08, 0.36, bevel=0.03, seg=16)              # the post
    p.cyl((0, 0, -0.02), 0.42, 0.13, scale=(1, 0.62), bevel=0.06, seg=32)  # the foot
    p.paint_fn(lambda q, n: q.y < 0.14 and n.y > 0.5, lite(YELLOW, 0.35))
    p.layer('glass', base=mix(lite(SKY, 0.35), GREY, 0.35), target_faces=500, voxel=0.01)
    prism(p, ell(RX + 0.03, RY + 0.03), -0.04, 0.035)
    def shine(q, n):
        if n.z < 0.5:
            return False
        u, v = q.x / RX, (q.y - CY) / RY
        d = v * 0.7 - u * 0.7
        return (abs(d - 0.12) < 0.13 or abs(d - 0.48) < 0.055) and u * u + v * v < 0.8
    p.paint_fn(shine, WHITE)
    p.paint_fn(lambda q, n: n.z > 0.5 and (q.x / RX) ** 2 + ((q.y - CY) / RY) ** 2 > 0.86 and q.x > 0, mix(SKY, GREY, 0.5))
    p.layer('skin')
    finish(p, 1.35, 2.22)


MODELS = dict(prop_word_sofa=sofa, prop_word_stairs=stairs, prop_word_oven=oven, prop_word_toilet=toilet,
              prop_word_pillow=pillow, prop_word_quilt=quilt, prop_word_blanket=blanket,
              prop_word_table=table, prop_word_bed=bed, prop_word_window=window, prop_word_mirror=mirror)
for name, fn in MODELS.items():
    if not ONLY or name in ONLY:
        fn()
