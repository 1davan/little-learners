"""Letter friends (Letter friends / Alphabet Train, building site). One script, 27 models (ONLY=prop_lt_A,... builds a
subset). Game space, +z faces us, every model stands on y = 0.

  prop_lt_A .. prop_lt_Z   a chunky capital letter, 1.08 tall: soft rounded tubes swept along the SAME stroke centre
                           lines as Brick letters (app/src/lessons/bricks-letters.js LETTERS, ported below, plus U-Z),
                           a superellipse cross-section (flat-ish front for the code face, rounded edges), round free
                           ends, joints melted together by the voxel remesh. Painted white: the game tints it
                           (argMode 'tint'; vowels coral, consonants blue / green / orange / purple / teal).
                           Origin = the middle of the letter's bottom edge. extras: W (width), shoes [x1, x2] (where
                           the two shoes go, letter-local x), H.
  prop_lt_shoe             one small rounded toy shoe (0.2 long, 0.12 wide, 0.1 tall), toe toward +z, white upper
                           (tinted in game) on a cream sole (layer 'sole'). Two of them carry each letter friend.
"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop
from mathutils import Vector

ONLY = [s for s in os.environ.get('ONLY', '').split(',') if s]
want = lambda n: not ONLY or n in ONLY
DEG = math.pi / 180

H = 1.08          # letter height (outer box)
C = 0.14          # half the stroke width (in the letter's plane)
D = 0.125         # half the stroke depth (toward the camera)
JOINT = {'D': 1.16, 'H': 1.16, 'K': 1.16}   # a fuller soft joint (a fillet) where strokes butt: no ink crease in the corner
FAT = {'A': 0.115, 'I': 0.165, 'L': 0.16, 'T': 0.16, 'J': 0.16, 'F': 0.155, 'E': 0.15, 'B': 0.118, 'P': 0.122, 'R': 0.122}   # thin letters: wider stems; A, B, P, R: open counters


# Friends that read better as one bent stroke (rounded corners) than as strokes butting into each other: the same
# centre lines as Brick letters, joined at the corner instead of side by side.
def friend_letter(ch, H, c):
    if ch == 'A':
        W = 1.0 * H
        yb = 0.29 * H        # the crossbar a little lower: a bigger, clearly open counter
        lx = lambda y: c * 1.1 + (W / 2 - c * 1.1) * (y - c) / (H - 2 * c)
        return W, [S([(c * 1.1, c), (W / 2, H - c), (W - c * 1.1, c)], c, c), S([(lx(yb), yb), (W - lx(yb), yb)])]
    if ch == 'V':
        W = 0.9 * H
        return W, [S([(c * 1.1, H - c), (W / 2, c), (W - c * 1.1, H - c)], c, c)]
    if ch == 'W':
        W = 1.16 * H; my = 0.72 * H
        return W, [S([(c * 1.1, H - c), (0.27 * W, c), (0.5 * W, my), (0.73 * W, c), (W - c * 1.1, H - c)], c, c)]
    if ch == 'M':
        W = 0.96 * H; vy = 0.3 * H
        return W, [S([(c, c), (c, H - c), (W / 2, vy), (W - c, H - c), (W - c, c)], c, c)]
    if ch == 'N':
        W = 0.82 * H
        return W, [S([(c, c), (c, H - c), (W - c, c), (W - c, H - c)], c, c)]
    if ch == 'Z':
        W = 0.8 * H
        return W, [S([(c, H - c), (W - c, H - c), (c, c), (W - c, c)], c, c)]
    return letter(ch, H, c)


def arc(cx, cy, rx, ry, a0, a1, n=18):
    return [(cx + rx * math.cos((a0 + (a1 - a0) * i / n) * DEG), cy + ry * math.sin((a0 + (a1 - a0) * i / n) * DEG)) for i in range(n + 1)]


def S(pts, cap0=0.0, cap1=0.0):
    return dict(pts=[tuple(p) for p in pts], cap0=cap0, cap1=cap1)


# ---- the stroke table: a straight port of LETTERS in bricks-letters.js (A-T), plus U-Z (also added there) ----
def letter(ch, H, c):
    if ch == 'A':
        W = 0.9 * H; ax0 = W / 2; ay = H - c * 0.45
        l0, r0 = (c * 1.1, c), (W - c * 1.1, c)
        th = math.atan2(ay - c, ax0 - l0[0])
        for _ in range(3):
            th = math.atan2(ay - c, ax0 - c * math.sin(th) - l0[0])
        ax = ax0 - c * math.sin(th) * 1.02
        yb = 0.34 * H
        xAt = lambda p, q, y: p[0] + (q[0] - p[0]) * ((y - p[1]) / (q[1] - p[1]))
        inset = c / math.sin(th) + 0.02
        rt = (W - ax, ay)
        return W, [S([l0, (ax, ay)], c, 0), S([r0, rt], c, 0), S([(xAt(l0, (ax, ay), yb) + inset, yb), (xAt(r0, rt, yb) - inset, yb)])]
    if ch == 'B':
        W = 0.74 * H; my = 0.52 * H; bx = 0.44 * W
        ryU = (H - c - my) / 2; ryL = (my - c) / 2
        up = [(2 * c, H - c)] + arc(bx, my + ryU, W * 0.88 - c - bx, ryU, 90, -90) + [(2 * c, my)]
        lo = arc(bx, c + ryL, W - c - bx, ryL, 90, -90) + [(2 * c, c)]
        return W, [S([(c, c), (c, H - c)], c, c), S(up), S(lo)]
    if ch == 'C':
        W = 0.84 * H
        return W, [S(arc(W / 2, H / 2, W / 2 - c, H / 2 - c, 42, 318, 28), c * 0.6, c * 0.6)]
    if ch == 'D':
        W = 0.8 * H; bx = 0.36 * W
        return W, [S([(c, c), (c, H - c)], c, c), S([(2 * c, H - c)] + arc(bx, H / 2, W - c - bx, H / 2 - c, 90, -90, 20) + [(2 * c, c)])]
    if ch == 'E':
        W = 0.66 * H
        return W, [S([(c, H - c), (c, c)], c, c), S([(2 * c, H - c), (W - c, H - c)], 0, c), S([(2 * c, H / 2), (W * 0.9 - c, H / 2)], 0, c), S([(2 * c, c), (W - c, c)], 0, c)]
    if ch == 'F':
        W = 0.64 * H
        return W, [S([(c, H - c), (c, c)], c, c), S([(2 * c, H - c), (W - c, H - c)], 0, c), S([(2 * c, 0.52 * H), (W * 0.88 - c, 0.52 * H)], 0, c)]
    if ch == 'G':
        W = 0.86 * H; rx = W / 2 - c; ry = H / 2 - c
        return W, [S(arc(W / 2, H / 2, rx, ry, 40, 360, 30), c * 0.6, 0), S([(W - 2 * c, H / 2), (W * 0.54, H / 2)], 0, c)]
    if ch == 'H':
        W = 0.8 * H
        return W, [S([(c, H - c), (c, c)], c, c), S([(W - c, H - c), (W - c, c)], c, c), S([(2 * c, H / 2), (W - 2 * c, H / 2)])]
    if ch == 'I':
        W = 0.56 * H
        return W, [S([(c, H - c), (W - c, H - c)], c, c), S([(W / 2, H - 2 * c), (W / 2, 2 * c)]), S([(c, c), (W - c, c)], c, c)]
    if ch == 'J':
        W = 0.66 * H; sx = W - 2.2 * c; rx = (sx - c) / 2; cy = 0.34 * H
        return W, [S([(0.3 * W, H - c), (W - c, H - c)], c, c), S([(sx, H - 2 * c), (sx, cy)] + arc(sx - rx, cy, rx, cy - c, 0, -170, 16)[1:], 0, c * 0.6)]
    if ch == 'K':
        W = 0.78 * H; jy = 0.42 * H
        arm = [(W - c * 1.1, H - c), (2.6 * c, jy)]
        m = (arm[0][0] + (arm[1][0] - arm[0][0]) * 0.62, arm[0][1] + (arm[1][1] - arm[0][1]) * 0.62)
        return W, [S([(c, H - c), (c, c)], c, c), S(arm, c, 0), S([(m[0] + c * 0.5, m[1] - c * 0.6), (W - c * 1.1, c)], 0, c)]
    if ch == 'L':
        W = 0.62 * H
        return W, [S([(c, H - c), (c, c)], c, c), S([(2 * c, c), (W - c, c)], 0, c)]
    if ch == 'M':
        W = 0.96 * H; vy = 0.3 * H
        return W, [S([(c, c), (c, H - c)], c, c), S([(W - c, H - c), (W - c, c)], c, c), S([(c * 1.6, H - c * 1.6), (W / 2, vy)], 0, c * 0.4), S([(W / 2, vy), (W - c * 1.6, H - c * 1.6)], 0, 0)]
    if ch == 'N':
        W = 0.82 * H
        return W, [S([(c, c), (c, H - c)], c, c), S([(W - c, c), (W - c, H - c)], c, c), S([(c * 1.7, H - c * 1.3), (W - c * 1.7, c * 1.3)])]
    if ch == 'O':
        W = 0.86 * H
        return W, [S(arc(W / 2, H / 2, W / 2 - c, H / 2 - c, 90, 450, 36))]
    if ch == 'P':
        W = 0.7 * H; my = 0.44 * H; bx = 0.42 * W; ry = (H - c - my) / 2
        return W, [S([(c, H - c), (c, c)], c, c), S([(2 * c, H - c)] + arc(bx, my + ry, W - c - bx, ry, 90, -90) + [(2 * c, my)])]
    if ch == 'Q':
        W = 0.88 * H; rx = W / 2 - c; ry = H / 2 - c; a = -52 * DEG
        p0 = (W / 2 + (rx + c * 0.6) * math.cos(a), H / 2 + (ry + c * 0.6) * math.sin(a))
        return W, [S(arc(W / 2, H / 2, rx, ry, 90, 450, 36)), S([(p0[0] - c * 0.3, p0[1] + c * 0.3), (W - c * 0.3, c * 0.1)], 0, c * 0.5)]
    if ch == 'R':
        W = 0.74 * H; my = 0.46 * H; bx = 0.4 * W; ry = (H - c - my) / 2
        return W, [S([(c, H - c), (c, c)], c, c), S([(2 * c, H - c)] + arc(bx, my + ry, W * 0.95 - c - bx, ry, 90, -90) + [(2 * c, my)]), S([(0.42 * W, my - c), (W - c * 1.1, c)], 0, c)]
    if ch == 'S':
        W = 0.74 * H; rx = W / 2 - c; ry = (H - 2 * c) / 4
        top = arc(W / 2, H - c - ry, rx, ry, 20, 270, 18)
        bot = arc(W / 2, c + ry, rx, ry, 90, -160, 18)
        return W, [S(top + bot[1:], c * 0.5, c * 0.5)]
    if ch == 'T':
        W = 0.96 * H
        return W, [S([(c, H - c), (W - c, H - c)], c, c), S([(W / 2, H - 2 * c), (W / 2, c)], 0, c)]
    # ---- U to Z (new; the same rules) ----
    if ch == 'U':
        W = 0.8 * H; cy = 0.42 * H
        return W, [S([(c, H - c), (c, cy)] + arc(W / 2, cy, W / 2 - c, cy - c, 180, 360, 20)[1:] + [(W - c, H - c)], c, c)]
    if ch == 'V':
        W = 0.9 * H; ax0 = W / 2; ay = c * 0.45
        l0, r0 = (c * 1.1, H - c), (W - c * 1.1, H - c)
        th = math.atan2(H - c - ay, ax0 - l0[0])
        for _ in range(3):
            th = math.atan2(H - c - ay, ax0 - c * math.sin(th) - l0[0])
        ax = ax0 - c * math.sin(th) * 1.02
        return W, [S([l0, (ax, ay)], c, 0), S([r0, (W - ax, ay)], c, 0)]
    if ch == 'W':
        W = 1.16 * H; my = 0.72 * H
        xs = [c * 1.1, 0.27 * W, 0.5 * W, 0.73 * W, W - c * 1.1]
        return W, [S([(xs[0], H - c), (xs[1], c)], c, c * 0.5), S([(xs[2], my), (xs[1], c)], c * 0.4, 0),
                   S([(xs[2], my), (xs[3], c)], 0, c * 0.5), S([(xs[4], H - c), (xs[3], c)], c, 0)]
    if ch == 'X':
        W = 0.86 * H
        return W, [S([(c * 1.1, H - c), (W - c * 1.1, c)], c, c), S([(W - c * 1.1, H - c), (W / 2, H / 2)], c, 0), S([(W / 2, H / 2), (c * 1.1, c)], 0, c)]
    if ch == 'Y':
        W = 0.9 * H; jy = 0.45 * H
        return W, [S([(c * 1.1, H - c), (W / 2, jy)], c, 0), S([(W - c * 1.1, H - c), (W / 2, jy)], c, 0), S([(W / 2, jy), (W / 2, c)], 0, c)]
    if ch == 'Z':
        W = 0.8 * H
        return W, [S([(c, H - c), (W - c, H - c)], c, c), S([(W - c * 1.7, H - 2 * c), (c * 1.7, 2 * c)]), S([(c, c), (W - c, c)], c, c)]
    raise KeyError(ch)


# ---------------- sweeping a stroke ----------------
P_SE = 0.62   # superellipse power of the cross-section (1 = ellipse, smaller = squarer: a flatter front for the face)


def se(u):
    return math.copysign(abs(u) ** P_SE, u)


def sweep(p, pts, c, d, nseg=20):
    """a soft tube along a 2D polyline in the letter plane (z = 0), cross-section c (in plane) x d (depth)"""
    P = [Vector((x, y, 0)) for x, y in pts]
    m = len(P)
    verts, faces = [], []
    for i in range(m):
        t = (P[min(i + 1, m - 1)] - P[max(i - 1, 0)])
        t.normalize()
        n = Vector((-t.y, t.x, 0))
        for k in range(nseg):
            a = 2 * math.pi * k / nseg
            verts.append(P[i] + n * (c * se(math.cos(a))) + Vector((0, 0, d * se(math.sin(a)))))
    for i in range(m - 1):
        for k in range(nseg):
            k2 = (k + 1) % nseg
            faces.append((i * nseg + k, i * nseg + k2, (i + 1) * nseg + k2, (i + 1) * nseg + k))
    for i in (0, m - 1):
        cc = len(verts); verts.append(P[i])
        for k in range(nseg):
            if i == 0:
                faces.append((cc, (k + 1) % nseg, k))
            else:
                faces.append((cc, i * nseg + k, i * nseg + (k + 1) % nseg))
    p.mesh(verts, faces)


def knob(p, at, c, d, gi):
    """a rounded end / joint: a soft ellipsoid the size of the cross-section"""
    p.blob((at[0], at[1], 0), (c * 1.0, c * 1.0, d * 1.05), group='k%d' % gi, stiffness=2.0)


def split_corners(pts, lim=32):
    """break a polyline at its sharp corners (a tube can't turn sharply without pinching)"""
    out, cur = [], [pts[0]]
    for i in range(1, len(pts) - 1):
        a = Vector(pts[i]) - Vector(pts[i - 1]); b = Vector(pts[i + 1]) - Vector(pts[i])
        cur.append(pts[i])
        if a.length > 1e-6 and b.length > 1e-6 and a.angle(b) > lim * DEG:
            out.append(cur); cur = [pts[i]]
    cur.append(pts[-1])
    out.append(cur)
    return out


def ext(pts, i, j, dd):
    """move point i away from point j by dd"""
    P = [list(q) for q in pts]
    dx, dy = P[i][0] - P[j][0], P[i][1] - P[j][1]
    l = math.hypot(dx, dy) or 1
    P[i][0] += dx / l * dd; P[i][1] += dy / l * dd
    return [tuple(q) for q in P]


def densify(pts, step=0.05):
    out = [pts[0]]
    for a, b in zip(pts, pts[1:]):
        l = math.hypot(b[0] - a[0], b[1] - a[1])
        n = max(1, int(l / step))
        for k in range(1, n + 1):
            out.append((a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n))
    return out


def build_letter(ch):
    c = FAT.get(ch, C)
    W, strokes = friend_letter(ch, H, c)
    kind = 'prop_lt_' + ch
    p = Prop(kind, base=0xffffff, target_faces=1500, voxel=0.011, smooth=4 if ch in JOINT else 3)
    gi = 0
    allp = []
    for st in strokes:
        pts = [(x - W / 2, y) for x, y in st['pts']]
        # free ends: round knobs reaching the letter box; butting ends: pushed a little into the stroke they meet
        if st['cap0'] > 0:
            pts = ext(pts, 0, 1, max(0.0, st['cap0'] - c))
            knob(p, pts[0], c, D, gi); gi += 1
        else:
            knob(p, pts[0], c * JOINT.get(ch, 0.98), D, gi); gi += 1      # a soft joint where it meets the other stroke (no crease)
            pts = ext(pts, 0, 1, c * 0.7)
        if st['cap1'] > 0:
            pts = ext(pts, len(pts) - 1, len(pts) - 2, max(0.0, st['cap1'] - c))
            knob(p, pts[-1], c, D, gi); gi += 1
        else:
            knob(p, pts[-1], c * JOINT.get(ch, 0.98), D, gi); gi += 1
            pts = ext(pts, len(pts) - 1, len(pts) - 2, c * 0.7)
        for piece in split_corners(pts):
            sweep(p, densify(piece), c, D)
        for q in split_corners(pts)[1:]:
            knob(p, q[0], c, D, gi); gi += 1
        allp += densify(pts, 0.02)
    # the two shoes: under the lowest part(s) of the letter
    low = [x for x, y in allp if y < c + 0.03]
    low.sort()
    clusters = []
    for x in low:
        if clusters and x - clusters[-1][-1] < 0.08:
            clusters[-1].append(x)
        else:
            clusters.append([x])
    if len(clusters) >= 2:
        a, b = clusters[0], clusters[-1]
        sx = [sum(a) / len(a), sum(b) / len(b)]
        if sx[1] - sx[0] > 0.62:   # very wide stance: tuck the shoes in a little
            m = (sx[0] + sx[1]) / 2; sx = [m - 0.31, m + 0.31]
    else:
        cl = clusters[0]
        x0, x1 = min(cl), max(cl)
        if x1 - x0 > 0.36:
            m = (x0 + x1) / 2; half = min(0.24, (x1 - x0) / 2 - 0.06)
            sx = [m - half, m + half]
        else:
            m = (x0 + x1) / 2
            sx = [m - 0.075, m + 0.075]
    p.bone('body', (0, 0, 0), (0, H, 0))
    p.extras['argMode'] = 'tint'
    p.extras['argDefault'] = 0x4a90ff
    p.extras['outline'] = 0.022
    p.extras['W'] = round(W, 4)
    p.extras['H'] = H
    p.extras['shoes'] = [round(sx[0], 4), round(sx[1], 4)]
    p.extras['stroke'] = c
    p.extras['depth'] = D
    p.build()


def shoe():
    """a chunky toy trainer: tinted upper, a cream toe cap, a thick cream sole with a coloured stripe, a dark ankle
    opening and two fat white lace loops on top. 0.2 long (toe +z), 0.13 wide, 0.11 tall."""
    p = Prop('prop_lt_shoe', base=0xffffff, target_faces=1100, voxel=0.0045, smooth=3)
    p.blob((0, 0.058, 0.03), (0.06, 0.042, 0.072), group='upper', stiffness=2.5)
    p.blob((0, 0.07, -0.045), (0.056, 0.05, 0.048), group='upper', stiffness=2.5)
    p.blob((0, 0.09, -0.028), (0.05, 0.03, 0.05), group='upper', stiffness=2.5)
    p.paint('open', (0, 0.118, -0.036), (0.032, 0.03, 0.03), 0x3a2838, only=lambda q: q.y > 0.104)   # the ankle opening
    p.layer('toe', base=0xfff3dc, target_faces=300, voxel=0.004)
    p.blob((0, 0.045, 0.075), (0.056, 0.032, 0.036), group='toe', stiffness=2.5)
    p.layer('sole', base=0xfff3dc, target_faces=500, voxel=0.004)
    p.box((0, 0.016, 0.0), (0.066, 0.016, 0.106), bevel=0.014)
    p.layer('stripe', base=0xff6f6f, target_faces=300, voxel=0.004)
    p.box((0, 0.022, 0.0), (0.0675, 0.0055, 0.1075), bevel=0.004)
    p.layer('laces', base=0xffffff, target_faces=400, voxel=0.004)
    for s in (-1, 1):
        a = (s * 0.006, 0.098, 0.02); b = (s * 0.03, 0.118, 0.025); c = (s * 0.044, 0.1, 0.03)
        p.tube([a, b, c], 0.008, rseg=8)
    p.blob((0, 0.098, 0.02), (0.013, 0.01, 0.013), group='knot')
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 0.12, 0))
    p.extras['argMode'] = 'tint'
    p.extras['argDefault'] = 0xffffff
    p.extras['outline'] = 0.0065
    p.build()


for ch in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ':
    if want('prop_lt_' + ch):
        build_letter(ch)
if want('prop_lt_shoe'):
    shoe()
