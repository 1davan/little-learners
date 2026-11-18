"""Paint & mix (Meadow). One script, every model of the game, plus app/assets/paint-shapes.json.

    tools/blender/build.sh prop_paint                 builds everything (35 models + the JSON)
    ONLY=prop_pt_duck,prop_pt_pot tools/blender/build.sh prop_paint     a subset (the JSON is always rewritten)
    ONLY=json ...                                     only the JSON (no models)
    python3-with-numpy prop_paint.py --preview out.ppm   draws every shape (parts in flat colours + lines) to a contact sheet

THE TOYS (prop_pt_<key>): flat plywood cut-outs facing +z. Each outline is authored as a 2D signed distance field (smooth
unions of circles, ellipses, round cones, boxes, polygons), traced with marching squares and resampled to ~96 points.
The SAME polygon is (1) extruded here with SProp.prism(outline, 0, 0.14, bevel=0.035) in birch white and (2) written,
normalised, to paint-shapes.json, where paint-canvas.js uses it for the canvas mask, the coverage grid and the burnt
lines. The bbox centre of every outline is at the origin, so the JS formula  u = x / S + 0.5,  v = y / S + 0.5
(S = 1.04 * max(w, h)) maps mesh and canvas onto each other exactly.
Layer 'loop': a twine ring (tube r 0.012, ring r 0.07, #c9a877) at the shape's hang point, its top 0.15 above the outline.
extras: outline 0.02, paint 1.

THE STUDIO (all origins on the floor of the object, game space, +z toward the child):
  prop_pt_table     play table top 6.6 x 2.6 (top surface y = 0, 0.12 thick), white apron, four legs down to y -1.25
  prop_pt_easel     cream board 2.0 x 1.75 leaning back 12 deg, its foot line at z = 0, y = BOARD_Y0; ledge in front (top
                    y = LEDGE_TOP, lip); a round peg (r 0.05, 0.12 long) on the board's centre line at slant PEG_S.
  prop_pt_pot       squat white pot r 0.27, h 0.42; layer 'paint' (domed disc, top y 0.375) tinted in game
  prop_pt_lid       wooden lid (bottom y 0 sits on the rim top 0.425) with a lip 0.02 into the mouth and a knob
  prop_pt_brush     fat brush 0.95 long, origin = the bristle tip, handle along +y; layers 'ferrule', 'tip' (bristles)
  prop_pt_stamp     dot stamp, origin = sponge face (y 0); layer 'sponge'
  prop_pt_block     tool block 0.7 x 0.3 high x 0.4 deep; brush hole at x -0.17 (r 0.085, 0.16 deep), stamp recess x +0.17
  prop_pt_dish      shallow mixing dish r 0.5, rim top y 0.09, nests 0.05; layer 'well' (flat disc y 0.032, r 0.345)
  prop_pt_dot       a flat paint blob r 0.045 (tinted)
  prop_pt_wall      gallery boards 6.4 x 3.6 (front z 0, bottom y 0), pegs at y 1.6 / 3.1, x -2.25 -0.75 0.75 2.25,
                    rails at the peg rows, posts down to y -3
  prop_pt_cardstand wooden stand with a 0.8 x 0.8 rounded card (layer 'card', front at z ~0.03, centre y 0.6)
  prop_pt_hook      the gallery hook: batten + peg (origin = the peg's axis) on a twine cord up to y 4.5
"""
import sys, os, math, json

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
JSON_OUT = os.path.join(ROOT, 'app', 'assets', 'paint-shapes.json')
import numpy as np

# ---------------------------------------------------------------- studio numbers shared with paint-studio.js
BOARD_W, BOARD_H, LEAN = 2.0, 1.75, math.radians(12)
BOARD_Y0 = 0.12          # the board's bottom edge (front face) sits on the ledge's back
BOARD_T = 0.06
LEDGE_TOP, LEDGE_D = 0.12, 0.24   # (0.24 deep so the lying brush's head fits between board and lip)
PEG_S = 1.585            # peg position along the board's slant from its bottom edge
PEG_R, PEG_L = 0.05, 0.12
WALL_PEGS_Y = (1.55, 3.3)   # 1.75 apart: room for a head or an ear above a ring
WALL_PEGS_X = (-2.25, -0.75, 0.75, 2.25)

# ================================================================ 2D signed distance fields (numpy, vectorised)
STEP = 0.004
LIM = 1.0
xs = np.arange(-LIM, LIM + 1e-9, STEP)
X, Y = np.meshgrid(xs, xs)          # Y[j, i] = xs[j]  (j = row = y)


def rot(x, y, a):
    c, s = math.cos(a), math.sin(a)
    return c * x - s * y, s * x + c * y


def circle(cx, cy, r):
    return lambda X, Y: np.hypot(X - cx, Y - cy) - r


def ellipse(cx, cy, a, b, ang=0.0):
    def f(X, Y):
        x, y = rot(X - cx, Y - cy, -math.radians(ang))
        k = np.hypot(x / a, y / b)
        return (k - 1) * min(a, b)
    return f


def box(cx, cy, hw, hh, r=0.0, ang=0.0):
    def f(X, Y):
        x, y = rot(X - cx, Y - cy, -math.radians(ang))
        qx, qy = np.abs(x) - hw + r, np.abs(y) - hh + r
        return np.hypot(np.maximum(qx, 0), np.maximum(qy, 0)) + np.minimum(np.maximum(qx, qy), 0) - r
    return f


def cone(ax, ay, bx, by, ra, rb=None):
    """round cone (uneven capsule) from a (radius ra) to b (radius rb)"""
    rb = ra if rb is None else rb
    def f(X, Y):
        px, py = X - ax, Y - ay
        ex, ey = bx - ax, by - ay
        h = ex * ex + ey * ey
        qx = np.abs((px * ey - py * ex) / h)
        qy = (px * ex + py * ey) / h
        b = ra - rb
        cx_, cy_ = math.sqrt(max(h - b * b, 1e-9)), b
        k = cx_ * qy - cy_ * qx
        m = cx_ * qx + cy_ * qy
        n = qx * qx + qy * qy
        d1 = np.sqrt(np.maximum(h * n, 0)) - ra
        d2 = np.sqrt(np.maximum(h * (n + 1 - 2 * qy), 0)) - rb
        return np.where(k < 0, d1, np.where(k > cx_, d2, m - ra))
    return f


def poly(pts, r=0.0):
    P = [tuple(p) for p in pts]
    def f(X, Y):
        d = (X - P[0][0]) ** 2 + (Y - P[0][1]) ** 2
        s = np.ones_like(X)
        n = len(P)
        j = n - 1
        for i in range(n):
            vi, vj = P[i], P[j]
            ex, ey = vj[0] - vi[0], vj[1] - vi[1]
            wx, wy = X - vi[0], Y - vi[1]
            t = np.clip((wx * ex + wy * ey) / (ex * ex + ey * ey), 0, 1)
            bx_, by_ = wx - ex * t, wy - ey * t
            d = np.minimum(d, bx_ * bx_ + by_ * by_)
            c1 = Y >= vi[1]
            c2 = Y < vj[1]
            c3 = ex * wy > ey * wx
            flip = (c1 & c2 & c3) | (~c1 & ~c2 & ~c3)
            s = np.where(flip, -s, s)
            j = i
        return s * np.sqrt(d) - r
    return f


def U(*fs, k=0.0):
    """union (smooth with k > 0)"""
    def f(X, Y):
        a = fs[0](X, Y)
        for g in fs[1:]:
            b = g(X, Y)
            if k > 0:
                h = np.clip(0.5 + 0.5 * (b - a) / k, 0, 1)
                a = b * (1 - h) + a * h - k * h * (1 - h)
            else:
                a = np.minimum(a, b)
        return a
    return f


def SUB(a, b, k=0.0):
    def f(X, Y):
        A, B = a(X, Y), -b(X, Y)
        if k > 0:
            h = np.clip(0.5 - 0.5 * (B - A) / k, 0, 1)
            return B * (1 - h) + A * h + k * h * (1 - h)
        return np.maximum(A, B)
    return f


def AND(a, b):
    return lambda X, Y: np.maximum(a(X, Y), b(X, Y))


def NOT(a):
    return lambda X, Y: -a(X, Y)


def OFF(a, d):
    return lambda X, Y: a(X, Y) - d


# ---------------------------------------------------------------- marching squares
def trace(F):
    """closed zero-contour loops of field F (rows = y). Returns a list of [(x, y)] loops (CCW), largest first."""
    ins = F < 0
    c = ins[:-1, :-1].astype(np.int32) + 2 * ins[:-1, 1:] + 4 * ins[1:, 1:] + 8 * ins[1:, :-1]
    cells = np.argwhere((c > 0) & (c < 15))
    pt = {}

    def P(e):
        if e in pt:
            return pt[e]
        kind, i, j = e
        if kind == 'h':
            a, b = F[j, i], F[j, i + 1]
            t = a / (a - b)
            p = (xs[i] + t * STEP, xs[j])
        else:
            a, b = F[j, i], F[j + 1, i]
            t = a / (a - b)
            p = (xs[i], xs[j] + t * STEP)
        pt[e] = p
        return p
    adj = {}

    def seg(e1, e2):
        adj.setdefault(e1, []).append(e2)
        adj.setdefault(e2, []).append(e1)
    for j, i in cells:
        code = c[j, i]
        B, R, Tp, L = ('h', i, j), ('v', i + 1, j), ('h', i, j + 1), ('v', i, j)
        if code in (1, 14): seg(L, B)
        elif code in (2, 13): seg(B, R)
        elif code in (3, 12): seg(L, R)
        elif code in (4, 11): seg(R, Tp)
        elif code in (6, 9): seg(B, Tp)
        elif code in (7, 8): seg(L, Tp)
        elif code in (5, 10):
            cen = (F[j, i] + F[j, i + 1] + F[j + 1, i] + F[j + 1, i + 1]) / 4
            if (code == 5) == (cen < 0):
                seg(B, R); seg(Tp, L)
            else:
                seg(L, B); seg(R, Tp)
    seen = set()
    loops = []
    for e0 in adj:
        if e0 in seen:
            continue
        loop = [e0]
        seen.add(e0)
        prev, cur = None, e0
        while True:
            nx = [e for e in adj[cur] if e != prev and e not in seen]
            if not nx:
                break
            prev, cur = cur, nx[0]
            seen.add(cur)
            loop.append(cur)
        if len(loop) > 8:
            pts = [P(e) for e in loop]
            if area(pts) < 0:
                pts.reverse()
            loops.append(pts)
    loops.sort(key=lambda l: -abs(area(l)))
    return loops


def area(pts):
    s = 0.0
    for k in range(len(pts)):
        x0, y0 = pts[k - 1]
        x1, y1 = pts[k]
        s += x0 * y1 - x1 * y0
    return s / 2


def resample(pts, n, bend=0.06):
    """n points along a closed loop, a little denser where it bends (keeps round tips round)"""
    m = len(pts)
    w = [0.0]
    for k in range(1, m + 1):
        a, b, c = pts[(k - 2) % m], pts[(k - 1) % m], pts[k % m]
        L = math.hypot(c[0] - b[0], c[1] - b[1])
        t1 = math.atan2(b[1] - a[1], b[0] - a[0])
        t2 = math.atan2(c[1] - b[1], c[0] - b[0])
        turn = abs((t2 - t1 + math.pi) % (2 * math.pi) - math.pi)
        w.append(w[-1] + L + bend * turn)
    tot = w[-1]
    out = []
    k = 0
    for s in range(n):
        target = tot * s / n
        while w[k + 1] < target:
            k += 1
        a, b = pts[k % m], pts[(k + 1) % m]
        t = (target - w[k]) / max(w[k + 1] - w[k], 1e-12)
        out.append((a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t))
    return out


def arcp(cx, cy, r, a0, a1, n=14):
    return [(cx + r * math.cos(math.radians(a0 + (a1 - a0) * i / n)), cy + r * math.sin(math.radians(a0 + (a1 - a0) * i / n))) for i in range(n + 1)]


def ringp(cx, cy, r, n=28):
    pts = arcp(cx, cy, r, 0, 360, n)
    return pts


def ovalp(cx, cy, a, b, n=26):
    return [(cx + a * math.cos(2 * math.pi * i / n), cy + b * math.sin(2 * math.pi * i / n)) for i in range(n + 1)]


def bez(p0, p1, p2, n=14):
    return [((1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0], (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]) for t in (i / n for i in range(n + 1))]


def smile(cx, cy, w, d=None, n=10):
    """a little U-shaped smile centred at (cx, cy) (its corners), w wide, d deep"""
    d = d if d is not None else w * 0.45
    return bez((cx - w / 2, cy), (cx, cy - d * 2), (cx + w / 2, cy), n)


# ================================================================ the 24 toy shapes
# Each returns dict(outline=sdf, parts=[(name, sdf | None)], lines=[polylines], eyes=[(x, y, r)], smile=[polylines],
# dots=[(x, y, r)] ink dots, rings=[(x, y, r)] stamp rings.  Two-part toys: the first part's sdf cuts the outline; the
# last part is what is left. Units: world (fits ~1.26 square; normalised afterwards).
SH = {}


def shape(key, n=84):
    def deco(fn):
        SH[key] = (fn, n)
        return fn
    return deco


@shape('ball')
def _ball():
    seams = []
    for a in (90, 210, 330):
        e = (0.62 * math.cos(math.radians(a)), 0.62 * math.sin(math.radians(a)))
        c = (0.36 * math.cos(math.radians(a + 28)), 0.36 * math.sin(math.radians(a + 28)))
        seams.append(bez((0.0, 0.0), c, e, 16))
    return dict(outline=circle(0, 0, 0.62), lines=seams, dots=[(0.0, 0.0, 0.06)])


@shape('star')
def _star():
    arms = [cone(0, 0, 0.58 * math.cos(math.radians(90 + 72 * k)), 0.58 * math.sin(math.radians(90 + 72 * k)) - 0.04, 0.3, 0.115) for k in range(5)]
    f = U(circle(0, -0.04, 0.32), *arms, k=0.05)
    return dict(outline=f, lines=[])


@shape('heart')
def _heart():
    lobes = U(circle(-0.3, 0.18, 0.31), circle(0.3, 0.18, 0.31), k=0.0)
    f = U(lobes, poly([(-0.57, 0.1), (0.57, 0.1), (0.0, -0.52)], r=0.1), k=0.08)
    return dict(outline=f, lines=[])


def fish_body(cx, a, b):
    return ellipse(cx, 0, a, b)


@shape('fish')
def _fish():
    body = ellipse(-0.1, 0.0, 0.5, 0.34)
    tail = poly([(0.3, 0.0), (0.62, 0.3), (0.66, -0.3)], r=0.07)
    f = U(body, tail, k=0.09)
    return dict(outline=f, lines=[bez((0.33, 0.2), (0.27, 0.0), (0.33, -0.2), 10), bez((-0.28, 0.24), (-0.16, 0.0), (-0.28, -0.24), 12),
                                  bez((0.5, 0.18), (0.44, 0.0), (0.5, -0.18), 8)],
                eyes=[(-0.4, 0.08, 0.045)], smile=[smile(-0.47, -0.1, 0.1, 0.035)])


@shape('goldfish')
def _goldfish():
    body = ellipse(-0.12, 0.02, 0.42, 0.36)
    tl = ellipse(0.42, 0.2, 0.2, 0.15, 30)
    tr = ellipse(0.42, -0.16, 0.2, 0.15, -30)
    fin = ellipse(-0.05, 0.36, 0.17, 0.1, -12)
    f = U(body, tl, tr, fin, k=0.07)
    return dict(outline=f, lines=[bez((0.26, 0.2), (0.2, 0.02), (0.26, -0.17), 10), bez((-0.25, 0.26), (-0.12, 0.02), (-0.25, -0.24), 12),
                                  bez((0.4, 0.04), (0.5, 0.02), (0.58, 0.0), 6), bez((-0.14, 0.33), (-0.03, 0.4), (0.06, 0.34), 6)],
                eyes=[(-0.36, 0.1, 0.048)], smile=[smile(-0.42, -0.08, 0.1, 0.035)])


@shape('boat')
def _boat():
    hull = poly([(-0.64, 0.02), (0.64, 0.02), (0.44, -0.38), (-0.44, -0.38)], r=0.06)
    mast = box(0.08, 0.38, 0.09, 0.4, r=0.04)
    sail = poly([(0.06, 0.78), (0.06, 0.14), (-0.5, 0.14)], r=0.07)
    f = U(hull, mast, sail, k=0.05)
    return dict(outline=f, parts=[('sail', lambda X, Y: -Y), ('hull', None)],
                lines=[ringp(0.1, -0.17, 0.08)])


@shape('car')
def _car():
    body = box(0, -0.06, 0.64, 0.2, r=0.14)
    cab = box(-0.06, 0.22, 0.34, 0.2, r=0.14)
    wl, wr = circle(-0.36, -0.28, 0.18), circle(0.36, -0.28, 0.18)
    f = U(body, cab, wl, wr, k=0.06)
    win = [(-0.31, 0.09), (0.19, 0.09), (0.19, 0.3), (0.12, 0.34), (-0.24, 0.34), (-0.31, 0.27), (-0.31, 0.09)]
    return dict(outline=f, lines=[ringp(-0.36, -0.28, 0.1, 22), ringp(0.36, -0.28, 0.1, 22), win, [(-0.06, 0.09), (-0.06, 0.34)]],
                dots=[(-0.36, -0.28, 0.035), (0.36, -0.28, 0.035)])


@shape('butterfly')
def _butterfly():
    wings = [ellipse(s * 0.36, 0.17, 0.3, 0.24, s * -28) for s in (-1, 1)] + [ellipse(s * 0.27, -0.27, 0.2, 0.17, s * 28) for s in (-1, 1)]
    body = cone(0, -0.44, 0, 0.24, 0.065, 0.075)
    head = circle(0, 0.33, 0.1)
    ant = [U(cone(s * 0.04, 0.4, s * 0.19, 0.6, 0.032, 0.03), circle(s * 0.2, 0.61, 0.055), k=0.02) for s in (-1, 1)]
    f = U(*wings, body, head, *ant, k=0.03)
    lines = [ringp(-0.38, 0.2, 0.1, 18), ringp(0.38, 0.2, 0.1, 18), ringp(-0.28, -0.28, 0.06, 14), ringp(0.28, -0.28, 0.06, 14)]
    return dict(outline=f, lines=lines, eyes=[(-0.04, 0.35, 0.022), (0.04, 0.35, 0.022)], mirror=True)


@shape('cat')
def _cat():
    head = circle(0, 0.26, 0.32)
    ears = [poly([(s * 0.12, 0.42), (s * 0.34, 0.66), (s * 0.31, 0.32)], r=0.06) for s in (-1, 1)]
    body = ellipse(0, -0.3, 0.34, 0.33)
    tail = U(cone(0.24, -0.52, 0.52, -0.4, 0.1, 0.095), cone(0.52, -0.4, 0.58, -0.1, 0.095, 0.09), k=0.03)
    f = U(head, *ears, body, tail, k=0.06)
    wh = [[(s * 0.12, 0.16), (s * 0.28, 0.2)] for s in (-1, 1)] + [[(s * 0.12, 0.12), (s * 0.28, 0.08)] for s in (-1, 1)]
    return dict(outline=f, lines=wh + [[(s * 0.2, 0.47), (s * 0.27, 0.56)] for s in (-1, 1)] + [bez((-0.12, -0.6), (-0.1, -0.4), (-0.06, -0.3), 6), bez((0.12, -0.6), (0.1, -0.4), (0.06, -0.3), 6)],
                eyes=[(-0.12, 0.3, 0.045), (0.12, 0.3, 0.045)], dots=[(0, 0.2, 0.035)], smile=[smile(-0.045, 0.15, 0.09, 0.03), smile(0.045, 0.15, 0.09, 0.03)])


@shape('bunny')
def _bunny():
    head = circle(0, 0.06, 0.3)
    ears = [cone(s * 0.13, 0.25, s * 0.2, 0.6, 0.1, 0.11) for s in (-1, 1)]
    body = ellipse(0, -0.42, 0.36, 0.24)
    f = U(head, *ears, body, k=0.06)
    inner = [bez((s * 0.14, 0.33), (s * 0.18, 0.5), (s * 0.2, 0.62), 8) for s in (-1, 1)]
    return dict(outline=f, lines=inner + [bez((-0.12, -0.6), (-0.1, -0.5), (-0.05, -0.44), 5), bez((0.12, -0.6), (0.1, -0.5), (0.05, -0.44), 5)],
                eyes=[(-0.11, 0.1, 0.045), (0.11, 0.1, 0.045)], dots=[(0, 0.0, 0.035)], smile=[smile(-0.045, -0.05, 0.09, 0.03), smile(0.045, -0.05, 0.09, 0.03)])


@shape('bird')
def _bird():
    body = ellipse(0.06, -0.12, 0.42, 0.33, -8)
    head = circle(-0.3, 0.2, 0.22)
    tail = U(cone(0.36, -0.04, 0.7, 0.2, 0.08, 0.06), cone(0.38, -0.12, 0.72, -0.08, 0.08, 0.06), k=0.02)
    beak = poly([(-0.48, 0.26), (-0.72, 0.19), (-0.48, 0.12)], r=0.03)
    feet = [box(x, -0.5, 0.07, 0.06, r=0.04) for x in (-0.06, 0.16)]
    f = U(body, head, tail, beak, *feet, k=0.04)
    return dict(outline=f, lines=[bez((-0.08, -0.04), (0.18, -0.34), (0.4, -0.06), 12), bez((-0.08, -0.04), (0.16, 0.1), (0.4, -0.06), 12), [(-0.5, 0.19), (-0.64, 0.19)]],
                eyes=[(-0.32, 0.25, 0.05)])


@shape('duck')
def _duck():
    body = ellipse(0.1, -0.2, 0.5, 0.3)
    head = circle(-0.24, 0.28, 0.24)
    neck = cone(-0.2, 0.1, -0.12, -0.08, 0.14, 0.18)
    bill = box(-0.52, 0.22, 0.14, 0.08, r=0.07)
    tailp = poly([(0.45, -0.1), (0.68, 0.12), (0.55, -0.24)], r=0.06)
    f = U(body, head, neck, bill, tailp, k=0.06)
    return dict(outline=f, lines=[bez((-0.05, -0.12), (0.2, -0.36), (0.42, -0.1), 12), bez((-0.05, -0.12), (0.2, 0.02), (0.42, -0.1), 12), [(-0.42, 0.22), (-0.62, 0.22)], bez((-0.4, 0.3), (-0.36, 0.22), (-0.4, 0.14), 6)],
                eyes=[(-0.26, 0.34, 0.048)])


@shape('frog')
def _frog():
    body = ellipse(0, -0.1, 0.56, 0.38)
    bumps = [circle(s * 0.27, 0.3, 0.18) for s in (-1, 1)]
    feet = [ellipse(s * 0.42, -0.46, 0.2, 0.1, s * -10) for s in (-1, 1)]
    f = U(body, *bumps, *feet, k=0.07)
    toes = []
    for s in (-1, 1):
        for dx in (-0.06, 0.06):
            toes.append([(s * 0.42 + dx, -0.42), (s * 0.42 + dx * 1.3, -0.5)])
    return dict(outline=f, lines=toes + [arcp(s * 0.27, 0.3, 0.12, 200, 340, 8) for s in (-1, 1)],
                eyes=[(-0.27, 0.32, 0.06), (0.27, 0.32, 0.06)], smile=[bez((-0.3, -0.02), (0, -0.26), (0.3, -0.02), 14)], dots=[(-0.05, 0.08, 0.02), (0.05, 0.08, 0.02)])


@shape('pig')
def _pig():
    head = circle(0, -0.04, 0.54)
    ears = [ellipse(s * 0.36, 0.42, 0.17, 0.12, s * -38) for s in (-1, 1)]
    f = U(head, *ears, k=0.06)
    folds = [bez((s * 0.25, 0.4), (s * 0.36, 0.48), (s * 0.47, 0.44), 8) for s in (-1, 1)]
    return dict(outline=f, lines=[ovalp(0, -0.12, 0.2, 0.14)] + folds,
                eyes=[(-0.19, 0.14, 0.05), (0.19, 0.14, 0.05)], dots=[(-0.07, -0.12, 0.035), (0.07, -0.12, 0.035)], smile=[smile(0, -0.33, 0.14, 0.04)])


@shape('crab')
def _crab():
    body = ellipse(0, -0.12, 0.5, 0.3)
    arms = [cone(s * 0.3, 0.0, s * 0.46, 0.28, 0.09, 0.09) for s in (-1, 1)]
    claws = [circle(s * 0.48, 0.38, 0.17) for s in (-1, 1)]
    notch = [poly([(s * 0.48, 0.42), (s * 0.4, 0.6), (s * 0.56, 0.6)]) for s in (-1, 1)]
    legs = [cone(s * 0.4, -0.3, s * 0.6, -0.44, 0.08, 0.075) for s in (-1, 1)]
    stalks = [cone(s * 0.14, 0.1, s * 0.16, 0.24, 0.085, 0.09) for s in (-1, 1)]
    f = U(body, *arms, *claws, *legs, *stalks, k=0.05)
    return dict(outline=f, lines=[bez((s * 0.38, 0.36), (s * 0.48, 0.3), (s * 0.58, 0.38), 6) for s in (-1, 1)] + [bez((-0.26, -0.3), (0, -0.4), (0.26, -0.3), 10)],
                eyes=[(-0.15, 0.24, 0.05), (0.15, 0.24, 0.05)], smile=[smile(0, -0.08, 0.16, 0.05)])


@shape('apple')
def _apple():
    ap = U(circle(-0.17, -0.06, 0.42), circle(0.17, -0.06, 0.42), k=0.12)
    ap = SUB(ap, circle(0, 0.47, 0.1), k=0.06)
    stalk = box(0.0, 0.5, 0.035, 0.11, r=0.03)
    leaf = ellipse(0.21, 0.46, 0.17, 0.085, 20)
    body = U(ap, stalk, k=0.03)
    f = U(body, leaf, k=0.04)
    return dict(outline=f, parts=[('leaf', lambda X, Y: SUB(leaf, body)(X, Y) - 0.0), ('apple', None)],
                lines=[bez((0.08, 0.45), (0.2, 0.47), (0.35, 0.5), 8), [(-0.06, 0.3), (-0.03, 0.38)]])


@shape('flower')
def _flower():
    cy = 0.24
    petals = [circle(0.25 * math.cos(math.radians(90 + 60 * k)), cy + 0.25 * math.sin(math.radians(90 + 60 * k)), 0.16) for k in range(6)]
    bloom = U(circle(0, cy, 0.2), *petals, k=0.04)
    stem = box(0, -0.32, 0.085, 0.36, r=0.06)
    leaf = ellipse(0.24, -0.3, 0.22, 0.1, 25)
    f = U(bloom, stem, leaf, k=0.05)
    return dict(outline=f, parts=[('bloom', OFF(bloom, 0.004)), ('stem', None)],
                lines=[ringp(0, cy, 0.12, 22), bez((0.08, -0.38), (0.24, -0.3), (0.4, -0.2), 8)])


@shape('mushroom')
def _mushroom():
    capp = U(AND(ellipse(0, 0.04, 0.62, 0.56), lambda X, Y: 0.05 - Y), box(0, 0.06, 0.6, 0.04, r=0.03), k=0.03)
    stalk = box(0, -0.3, 0.24, 0.32, r=0.12)
    f = U(capp, stalk, k=0.05)
    rings = [(-0.3, 0.24, 0.1), (0.02, 0.44, 0.1), (0.31, 0.22, 0.1)]
    return dict(outline=f, parts=[('cap', lambda X, Y: -(Y - 0.06) * 1.0 + 0 * X), ('stalk', None)],
                rings=rings, lines=[], eyes=[(-0.09, -0.22, 0.045), (0.09, -0.22, 0.045)], smile=[smile(0, -0.34, 0.12, 0.04)])


@shape('pip')
def _pip():
    body = circle(0, -0.04, 0.5)
    tuft = U(ellipse(-0.08, 0.52, 0.12, 0.09, 40), ellipse(0.1, 0.55, 0.13, 0.09, -35), k=0.03)
    wings = [ellipse(s * 0.47, -0.08, 0.13, 0.22, s * -25) for s in (-1, 1)]
    feet = [ellipse(s * 0.17, -0.55, 0.14, 0.08) for s in (-1, 1)]
    f = U(body, tuft, *wings, *feet, k=0.06)
    beak = poly([(-0.13, 0.02), (0.13, 0.02), (0.0, -0.17)], r=0.05)
    return dict(outline=f, parts=[('beak', beak), ('body', None)],
                lines=[bez((s * 0.4, 0.06), (s * 0.3, -0.1), (s * 0.4, -0.24), 8) for s in (-1, 1)] + [[(s * 0.17, -0.5), (s * 0.17, -0.58)] for s in (-1, 1)],
                eyes=[(-0.17, 0.16, 0.055), (0.17, 0.16, 0.055)])


@shape('turtle')
def _turtle():
    shell = U(AND(ellipse(0.06, -0.12, 0.52, 0.5), lambda X, Y: -0.12 - Y), box(0.06, -0.15, 0.56, 0.07, r=0.07), k=0.04)
    head = circle(-0.52, -0.08, 0.16)
    neck = cone(-0.48, -0.12, -0.3, -0.14, 0.12, 0.13)
    legs = [box(x, -0.3, 0.09, 0.1, r=0.07) for x in (-0.24, 0.34)]
    tail = cone(0.56, -0.14, 0.68, -0.2, 0.07, 0.05)
    f = U(shell, head, neck, *legs, tail, k=0.05)
    lines = [[(-0.44, -0.12), (0.6, -0.12)], bez((-0.2, -0.12), (-0.14, 0.12), (0.06, 0.24), 8), bez((0.32, -0.12), (0.26, 0.12), (0.06, 0.24), 8),
             bez((-0.32, 0.06), (0.06, 0.0), (0.46, 0.06), 10)]
    return dict(outline=f, lines=lines, eyes=[(-0.56, -0.04, 0.04)], smile=[smile(-0.58, -0.14, 0.08, 0.03)])


@shape('grapes')
def _grapes():
    r = 0.15
    rows = [(4, 0.22), (3, -0.03), (2, -0.28), (1, -0.52)]
    gs = []
    for n, y in rows:
        for k in range(n):
            gs.append((-(n - 1) * 0.14 + k * 0.28, y))
    gp = [circle(x, y, r) for x, y in gs]
    stalk = cone(0, 0.32, 0.04, 0.56, 0.09, 0.08)
    leaf = ellipse(0.22, 0.48, 0.18, 0.09, 20)
    f = U(*gp, stalk, leaf, k=0.03)
    lines = [arcp(x, y, 0.1, 110, 200, 6) for x, y in gs]
    return dict(outline=f, lines=lines, n=96)


@shape('pumpkin')
def _pumpkin():
    lobes = U(ellipse(0, -0.06, 0.34, 0.45), ellipse(-0.3, -0.08, 0.32, 0.4), ellipse(0.3, -0.08, 0.32, 0.4), k=0.08)
    stalk = box(0.0, 0.44, 0.09, 0.12, r=0.05, ang=-10)
    f = U(lobes, stalk, k=0.05)
    ribs = [bez((-0.16, 0.32), (-0.3, -0.06), (-0.16, -0.46), 10), bez((0.16, 0.32), (0.3, -0.06), (0.16, -0.46), 10), bez((-0.44, 0.22), (-0.6, -0.08), (-0.44, -0.4), 10), bez((0.44, 0.22), (0.6, -0.08), (0.44, -0.4), 10)]
    return dict(outline=f, lines=ribs, eyes=[(-0.08, 0.04, 0.045), (0.08, 0.04, 0.045)], smile=[smile(0, -0.12, 0.14, 0.04)])


@shape('carrot')
def _carrot():
    root = poly([(-0.3, 0.2), (0.3, 0.2), (0.0, -0.66)], r=0.1)
    leaves = U(ellipse(-0.16, 0.44, 0.1, 0.2, 22), ellipse(0.0, 0.5, 0.1, 0.22), ellipse(0.16, 0.44, 0.1, 0.2, -22), k=0.03)
    f = U(root, leaves, k=0.06)
    lines = [[(-0.22, 0.06), (-0.06, 0.04)], [(0.06, -0.12), (0.2, -0.14)], [(-0.12, -0.3), (-0.02, -0.31)]]
    return dict(outline=f, parts=[('top', lambda X, Y: -(Y - 0.27) + 0 * X), ('root', None)], lines=lines)


@shape('rainbow')
def _rainbow():
    R0, R1 = 0.17, 0.65
    # rounded feet: the flat bottom gets soft corners
    ann = OFF(AND(SUB(circle(0, -0.32, R1 - 0.03), circle(0, -0.32, R0 + 0.03)), lambda X, Y: -0.29 - Y + 0 * X), 0.03)
    bands = []
    w = (R1 - R0) / 4
    for b in range(4):
        ro = R1 - b * w
        ri = ro - w
        bands.append(('band%d' % b, SUB(circle(0, -0.32, ro), circle(0, -0.32, ri)) if b < 3 else None))
    lines = [arcp(0, -0.32, R1 - w * b, 180, 0, 30)[1:-1] for b in range(1, 4)]
    return dict(outline=ann, parts=bands, lines=lines, n=150)


# ================================================================ build the shape data
def build_shape(key):
    fn, n = SH[key]
    d = fn()
    n = d.get('n', n)
    F = d['outline'](X, Y)
    loops = trace(F)
    out = loops[0]
    if len(loops) > 1 and abs(area(loops[1])) > 0.002:
        print('WARN', key, 'outline has', len(loops), 'loops', [round(abs(area(l)), 4) for l in loops[:4]])
    xs_, ys_ = [p[0] for p in out], [p[1] for p in out]
    x0, x1, y0, y1 = min(xs_), max(xs_), min(ys_), max(ys_)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    w, h = x1 - x0, y1 - y0
    k = 1.26 / max(w, h)            # every toy fits a 1.3 square, the biggest side 1.26
    T = lambda p: ((p[0] - cx) * k, (p[1] - cy) * k)
    W, H = w * k, h * k
    S = 1.04 * max(W, H)
    outline = [T(p) for p in resample(out, n)]

    def sdf_world(px, py):
        """the outline's sdf at world (toy) coordinates"""
        return float(d['outline'](np.array([[px / k + cx]]), np.array([[py / k + cy]]))[0, 0]) * k
    parts = {}
    plist = d.get('parts') or [('body', None)]
    cut = None
    rest = None
    for i, (name, f) in enumerate(plist):
        if f is None:
            parts[name] = outline
            rest = name
            continue
        else:
            g = AND(d['outline'], f) if cut is None else AND(AND(d['outline'], f), NOT(cut))
            cut = f if cut is None else U(cut, f)
        if len(plist) == 1:
            parts[name] = outline
            continue
        lp = trace(g(X, Y))
        if not lp:
            print('WARN', key, 'part', name, 'is empty'); continue
        if len(lp) > 1 and abs(area(lp[1])) > 0.003:
            print('WARN', key, 'part', name, 'has', len(lp), 'loops')
        parts[name] = [T(p) for p in resample(lp[0], 64 if len(plist) > 2 else 80)]

    # burnt lines: authored details + the boundaries between parts, all kept 0.03 inside the outline
    def keep_inside(line, margin=0.03):
        pts = []
        for a, b in zip(line[:-1], line[1:]):
            L = math.hypot(b[0] - a[0], b[1] - a[1])
            m = max(1, int(L / 0.01))
            for s in range(m):
                pts.append((a[0] + (b[0] - a[0]) * s / m, a[1] + (b[1] - a[1]) * s / m))
        pts.append(line[-1])
        runs, cur = [], []
        for p in pts:
            if sdf_world(*p) < -margin:
                cur.append(p)
            else:
                if len(cur) > 2: runs.append(cur)
                cur = []
        if len(cur) > 2: runs.append(cur)
        return [simplify(r) for r in runs]
    lines = []
    for ln in d.get('lines', []):
        if len(ln) >= 2:
            lines += keep_inside([T(p) for p in ln])
    names = list(parts.keys())
    for name in names[:-1]:
        lines += keep_inside(parts[name] + parts[name][:1], 0.025)
    ringsL = [(T((x, y))[0], T((x, y))[1], r * k) for x, y, r in d.get('rings', [])]
    for x, y, r in ringsL:
        lines.append(ringp(x, y, r, 24))
    eyes = [(T((x, y))[0], T((x, y))[1], r * k) for x, y, r in d.get('eyes', [])]
    dots = [(T((x, y))[0], T((x, y))[1], r * k) for x, y, r in d.get('dots', [])]
    smiles = [[T(p) for p in s] for s in d.get('smile', [])]
    for e in eyes + dots:
        if sdf_world(e[0], e[1]) > -e[2] - 0.02:
            print('WARN', key, 'eye/dot near the edge', e)
    # hang point: the top of the outline straight above the centroid
    A = area(outline)
    gx = sum((outline[i - 1][0] + outline[i][0]) * (outline[i - 1][0] * outline[i][1] - outline[i][0] * outline[i - 1][1]) for i in range(len(outline))) / (6 * A)
    top = -1
    for i in range(len(outline)):
        a, b = outline[i - 1], outline[i]
        if (a[0] - gx) * (b[0] - gx) <= 0 and a[0] != b[0]:
            t = (gx - a[0]) / (b[0] - a[0])
            top = max(top, a[1] + (b[1] - a[1]) * t)
    # the ring sits on the top edge within 0.1 of the balance line (so neighbours on the wall never touch: pegs are
    # 1.5 apart and every toy is at most 1.26 wide); anything that rises past it (a head, an ear) is allowed for by
    # the wall's row spacing and the easel's headroom
    near = [p for p in outline if abs(p[0] - gx) <= 0.1] or outline
    best = max(near, key=lambda p: p[1])
    hang = (best[0], best[1])
    ymax = max(p[1] for p in outline)
    if ymax - best[1] > 0.02:
        print('hang', key, 'offset', round(best[0] - gx, 3), 'rises above the ring by', round(ymax - best[1], 3))
    nz = lambda p: [round(p[0] / S + 0.5, 4), round(p[1] / S + 0.5, 4)]
    js = dict(
        outline=[nz(p) for p in outline],
        parts={nm: [nz(p) for p in pl] for nm, pl in parts.items()},
        lines=[[nz(p) for p in ln] for ln in lines],
        eyes=[nz(e) + [round(e[2] / S, 4)] for e in eyes],
        dots=[nz(e) + [round(e[2] / S, 4)] for e in dots],
        smile=[[nz(p) for p in s] for s in smiles],
        rings=[nz(r) + [round(r[2] / S, 4)] for r in ringsL],
        hang=nz(hang),
        size=[round(W, 4), round(H, 4)],
        S=round(S, 5),
        rest=rest,
    )
    if d.get('mirror'):
        js['mirror'] = 1
    return dict(js=js, outline=outline, hang=hang, size=(W, H))


def earclip(P):
    """triangulate a simple CCW polygon (list of (x, y)) -> index triples, CCW"""
    idx = list(range(len(P)))
    if area(P) < 0:
        idx.reverse()
    def cross(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    def inside(p, a, b, c):
        return cross(a, b, p) >= -1e-12 and cross(b, c, p) >= -1e-12 and cross(c, a, p) >= -1e-12
    out = []
    guard = 0
    while len(idx) > 3 and guard < 20000:
        guard += 1
        m = len(idx)
        best = None
        for k in range(m):
            i0, i1, i2 = idx[k - 1], idx[k], idx[(k + 1) % m]
            a, b, c = P[i0], P[i1], P[i2]
            cr = cross(a, b, c)
            if cr <= 1e-12:
                continue
            if any(inside(P[j], a, b, c) for j in idx if j not in (i0, i1, i2)):
                continue
            # prefer the fattest ear (fewer slivers)
            la = math.hypot(b[0] - a[0], b[1] - a[1]); lb = math.hypot(c[0] - b[0], c[1] - b[1]); lc = math.hypot(a[0] - c[0], a[1] - c[1])
            q = cr / (la * la + lb * lb + lc * lc + 1e-12)
            if best is None or q > best[0]:
                best = (q, k)
        if best is None:
            # degenerate: drop the flattest vertex
            k = min(range(m), key=lambda k: abs(cross(P[idx[k - 1]], P[idx[k]], P[idx[(k + 1) % m]])))
            idx.pop(k)
            continue
        k = best[1]
        out.append((idx[k - 1], idx[k], idx[(k + 1) % len(idx)]))
        idx.pop(k)
    if len(idx) == 3:
        out.append(tuple(idx))
    return out


def simplify(pts, tol=0.004):
    if len(pts) < 3:
        return pts
    out = [pts[0]]
    for p in pts[1:-1]:
        if math.hypot(p[0] - out[-1][0], p[1] - out[-1][1]) > 0.018:
            out.append(p)
    out.append(pts[-1])
    return out


ORDER = ['ball', 'star', 'heart', 'fish', 'boat', 'car', 'butterfly', 'cat', 'bunny', 'bird',
         'duck', 'frog', 'pig', 'crab', 'apple', 'flower', 'mushroom', 'pip',
         'goldfish', 'grapes', 'turtle', 'pumpkin', 'carrot', 'rainbow']


def all_shapes():
    res = {}
    for k in ORDER:
        res[k] = build_shape(k)
    return res


def write_json(res):
    data = {k: v['js'] for k, v in res.items()}
    os.makedirs(os.path.dirname(JSON_OUT), exist_ok=True)
    with open(JSON_OUT, 'w') as f:
        json.dump(data, f, separators=(',', ':'))
    print('WROTE', JSON_OUT, '%.0f KB' % (os.path.getsize(JSON_OUT) / 1024))


# ---------------------------------------------------------------- preview (no Blender): a contact sheet PPM
def preview(res, path):
    cell = 180
    cols = 6
    rows = (len(res) + cols - 1) // cols
    img = np.full((rows * cell, cols * cell, 3), 255, np.uint8)
    PAL = [(255, 90, 90), (95, 208, 104), (74, 144, 255), (255, 210, 63), (155, 107, 255), (255, 154, 61)]
    for idx, (k, v) in enumerate(res.items()):
        js = v['js']
        ox, oy = (idx % cols) * cell, (idx // cols) * cell
        g = np.linspace(0, 1, cell)
        GX, GY = np.meshgrid(g, 1 - g)
        sub = img[oy:oy + cell, ox:ox + cell]
        def inside(pl):
            return poly([tuple(p) for p in pl])(GX, GY) < 0
        sub[inside(js['outline'])] = (243, 224, 189)
        items = sorted(js['parts'].items(), key=lambda kv: kv[0] != js.get('rest'))
        for i, (nm, pl) in enumerate(items):
            if len(js['parts']) > 1:
                sub[inside(pl) & inside(js['outline'])] = PAL[i % len(PAL)]
        def stroke(pl, col, wpx=1.2):
            for a, b in zip(pl[:-1], pl[1:]):
                m = max(2, int(math.hypot(b[0] - a[0], b[1] - a[1]) * cell * 2))
                for s in range(m + 1):
                    x = (a[0] + (b[0] - a[0]) * s / m) * (cell - 1)
                    y = (1 - (a[1] + (b[1] - a[1]) * s / m)) * (cell - 1)
                    xi, yi = int(round(x)), int(round(y))
                    sub[max(0, yi - 1):yi + 1, max(0, xi - 1):xi + 1] = col
        stroke(js['outline'] + js['outline'][:1], (60, 40, 50))
        for ln in js['lines']:
            stroke(ln, (138, 90, 58))
        for s in js['smile']:
            stroke(s, (58, 40, 56))
        for x, y, r in js['eyes'] + js['dots']:
            sub[(np.hypot(GX - x, GY - y) < r)] = (58, 40, 56)
        hx, hy = js['hang']
        sub[(np.hypot(GX - hx, GY - hy) < 0.02)] = (200, 0, 200)
    with open(path, 'wb') as f:
        f.write(b'P6 %d %d 255\n' % (img.shape[1], img.shape[0]))
        f.write(img.tobytes())
    print('preview', path)


# ================================================================ Blender models
def blender_build(res):
    sys.path.insert(0, os.path.join(HERE, '..', 'props'))
    from kit import Prop, rounded, circle_poly
    from skit import SProp
    ONLY = [s for s in os.environ.get('ONLY', '').split(',') if s]
    want = lambda n: (not ONLY or n in ONLY) and 'json' not in ONLY
    TAU = math.tau
    BIRCH = 0xf6ead2
    TWINE = 0xc9a877
    WOOD, WOOD_D, WOOD_L = 0xe3b77c, 0xc99556, 0xf0d2a2
    CREAM, WHITE = 0xfff4dc, 0xffffff

    def toy_prism(p, P, z0, z1, b):
        """the cut-out: the outline extruded z0..z1 with a rounded front edge (2 segments, radius b) and a chamfered
        back edge (never seen). Built as one explicit mesh so the outline stays exact and the count stays ~10 tris/point."""
        n = len(P)
        N, lim = [], []
        for i in range(n):
            a, q, c = P[i - 1], P[i], P[(i + 1) % n]
            tx, ty = c[0] - a[0], c[1] - a[1]
            L = math.hypot(tx, ty) or 1
            N.append((ty / L, -tx / L))          # outward for a CCW loop
            # local radius of a convex bend: insetting further than that would fold the ring over itself
            t1 = math.atan2(q[1] - a[1], q[0] - a[0])
            t2 = math.atan2(c[1] - q[1], c[0] - q[0])
            turn = (t2 - t1 + math.pi) % (2 * math.pi) - math.pi
            R = (L / 2) / turn if turn > 1e-4 else 1e9
            lim.append(R)
        # the allowed inset at each vertex: never more than 0.6 x the radius of the tightest convex bend nearby
        cap = [min(lim[(i + k) % n] for k in range(-3, 4)) * 0.6 for i in range(n)]
        k45 = 1 - math.cos(math.pi / 4)
        prof = [(b, z0), (0.0, z0 + b), (0.0, z1 - b), (b * k45, z1 - b * k45), (b, z1)]   # (inset, z)
        V = []
        for inset, z in prof:
            for (x, y), (nx, ny), cp in zip(P, N, cap):
                d = min(inset, cp)
                V.append((x - nx * d, y - ny * d, z))
        F = []
        tris = earclip([(v[0], v[1]) for v in V[(len(prof) - 1) * n:]])
        for a, b2, c in tris:
            F.append(((len(prof) - 1) * n + a, (len(prof) - 1) * n + b2, (len(prof) - 1) * n + c))
        for a, b2, c in earclip([(v[0], v[1]) for v in V[:n]]):
            F.append((c, b2, a))
        for r in range(len(prof) - 1):
            for i in range(n):
                j = (i + 1) % n
                F.append((r * n + i, r * n + j, (r + 1) * n + j, (r + 1) * n + i))
        p._prims().append(('mesh', V, F, 0))

    # ---- the toys ----
    for key, v in res.items():
        name = 'prop_pt_' + key
        if not want(name):
            continue
        p = SProp(name, base=BIRCH, voxel=0.01, target_faces=1200)
        toy_prism(p, v['outline'], 0.0, 0.14, 0.035)
        hx, hy = v['hang']
        p.layer('loop', base=TWINE, voxel=0.006, target_faces=300)
        R, r = 0.07, 0.012
        cy = hy + 0.15 - R - r
        p.tube([(hx + R * math.sin(TAU * i / 16), cy + R * math.cos(TAU * i / 16), 0.07) for i in range(16)], r, closed=True, rseg=5)
        p.layers['loop']['psegs'] = 1
        p.layer('skin')
        p.bone('body', (0, -0.6, 0.07), (0, 0.6, 0.07))
        p.extras['outline'] = 0.02
        p.extras['paint'] = 1
        p.build()

    # ---- table ----
    if want('prop_pt_table'):
        p = SProp('prop_pt_table', base=0xf2d7a8, voxel=0.02, target_faces=2400)
        p.box((0, -0.06, -0.05), (3.3, 0.06, 1.3), bevel=0.055)
        p.paint_fn(lambda q, n: n.y < -0.5, 0xd9b77e)
        p.layer('apron', base=0xfffaf0, voxel=0.02, target_faces=800)
        p.box((0, -0.24, 1.08), (3.12, 0.12, 0.05), bevel=0.04)
        p.box((0, -0.24, -1.18), (3.12, 0.12, 0.05), bevel=0.04)
        for s in (-1, 1):
            p.box((s * 3.08, -0.24, -0.05), (0.05, 0.12, 1.1), bevel=0.04)
        # a few dry paint splats on the top, where nothing stands (a painting table is used)
        for nm, col, spots in (('splatR', 0xe8302a, [(2.45, 0.85, 0.11), (-0.95, 1.08, 0.06)]),
                               ('splatB', 0x1f66e5, [(-2.25, 0.95, 0.09), (1.15, 1.1, 0.05)]),
                               ('splatY', 0xffbf00, [(2.85, 0.35, 0.07), (-1.6, 1.12, 0.05), (0.3, 1.12, 0.04)])):
            p.layer(nm, base=col, voxel=0.006, target_faces=300)
            for (x, z, r) in spots:
                p.cyl((x, 0.0, z), r, 0.006, bevel=0.003, seg=20)
                p.cyl((x + r * 1.1, 0.0, z - r * 0.4), r * 0.3, 0.006, bevel=0.002, seg=12)
        p.layer('legs', base=0xfffaf0, voxel=0.02, target_faces=600)
        for sx in (-1, 1):
            for sz in (-1, 1):
                p.cyl((sx * 2.95, -1.25, -0.05 + sz * 1.0), 0.11, 1.0, r2=0.09, bevel=0.03, seg=20)
        p.layer('skin')
        p.bone('body', (0, -1.2, 0), (0, 0, 0))
        p.extras['outline'] = 0.02
        p.build()

    # ---- easel ----
    if want('prop_pt_easel'):
        p = SProp('prop_pt_easel', base=0xb9c9d9, voxel=0.012, target_faces=2200)
        cl, sl = math.cos(LEAN), math.sin(LEAN)
        def on_board(s, x, d=0.0):
            """slant s up the board's front face from its bottom edge, x across, d out of the face (toward the child)"""
            return (x, BOARD_Y0 + s * cl + d * sl, 0.0 - s * sl + d * cl)
        poly2 = rounded([(-BOARD_W / 2, 0), (BOARD_W / 2, 0), (BOARD_W / 2, BOARD_H), (-BOARD_W / 2, BOARD_H)], 0.1, n=4, closed=True)
        V, Fc = [], []
        for d in (-BOARD_T, 0.0):
            for x, s in poly2:
                V.append(on_board(s, x, d))
        n = len(poly2)
        Fc.append(tuple(range(n - 1, -1, -1)))
        Fc.append(tuple(range(n, 2 * n)))
        for i in range(n):
            j = (i + 1) % n
            Fc.append((i, j, n + j, n + i))
        p._prims().append(('mesh', V, Fc, 0.02))
        p.layer('frame', base=WOOD, voxel=0.01, target_faces=1600)
        # ledge: a shelf in front of the board foot, with a front lip
        p.box((0, LEDGE_TOP / 2, LEDGE_D / 2 - 0.02), (BOARD_W / 2 + 0.06, LEDGE_TOP / 2, LEDGE_D / 2 + 0.02), bevel=0.025)
        p.box((0, LEDGE_TOP + 0.025, LEDGE_D - 0.005), (BOARD_W / 2 + 0.06, 0.03, 0.022), bevel=0.018)
        # two back legs (struts) from the board's back to the table
        # (short and steep, so a character can walk along the back edge of the table behind the easel)
        for s in (-1, 1):
            a = on_board(0.62, s * 0.62, -BOARD_T - 0.02)
            p.tube([a, (s * 0.64, 0.03, -0.3)], 0.045, rseg=10)
            p.cyl((s * 0.64, 0.0, -0.3), 0.065, 0.05, bevel=0.02, seg=16)
        # the riser: a low wooden plinth the easel stands on (its top is the easel's y 0; the game puts it 0.15 up)
        p.box((0, -0.075, -0.03), (BOARD_W / 2 + 0.1, 0.075, 0.31), bevel=0.03)
        p.layer('peg', base=WOOD_D, voxel=0.006, target_faces=400)
        a = on_board(PEG_S, 0, -0.01)
        b = on_board(PEG_S, 0, PEG_L)
        p.tube([a, b], PEG_R, rseg=14)
        p.blob(b, (PEG_R * 1.25, PEG_R * 1.25, PEG_R * 0.7), group='pegknob')
        p.layer('skin')
        p.anchor('peg', on_board(PEG_S, 0, PEG_L * 0.5))
        p.anchor('ledgeL', (-0.86, LEDGE_TOP, LEDGE_D * 0.5))
        p.anchor('ledgeR', (0.86, LEDGE_TOP, LEDGE_D * 0.5))
        p.bone('body', (0, 0, 0), (0, 1.8, 0))
        p.extras['outline'] = 0.02
        p.build()

    # ---- pot (+ paint surface) and lid ----
    if want('prop_pt_pot'):
        p = Prop('prop_pt_pot', base=WHITE, voxel=0.008, target_faces=1600, smooth=2)
        prof = rounded([(0, 0.0), (0.215, 0.0), (0.24, 0.025), (0.25, 0.3), (0.255, 0.37), (0.235, 0.39), (0.215, 0.385), (0.205, 0.36), (0.2, 0.33), (0, 0.33)], 0.016, n=3)
        p.lathe(prof, seg=48)
        p.ring((0, 0.398, 0), 0.24, 0.03, seg=48, rseg=12)      # the rolled rim
        p.paint_fn(lambda q, n: q.y < 0.03, 0xeeeeee)
        p.layer('paint', base=WHITE, voxel=0.006, target_faces=500)
        p.lathe([(0, 0.35), (0.209, 0.35), (0.209, 0.368), (0.17, 0.377), (0.09, 0.382), (0, 0.383)], seg=40)
        p.layer('drip', base=WHITE, voxel=0.005, target_faces=400)
        p.tube([(0.05, 0.43, 0.245), (0.055, 0.36, 0.262), (0.05, 0.29, 0.262)], 0.022, rseg=10)
        p.blob((0.05, 0.285, 0.262), (0.032, 0.036, 0.022), group='dr')
        p.blob((0.05, 0.42, 0.24), (0.05, 0.022, 0.03), group='dr')
        p.layer('skin')
        p.bone('body', (0, 0, 0), (0, 0.42, 0))
        p.extras['outline'] = 0.014
        p.build()
    if want('prop_pt_lid'):
        p = Prop('prop_pt_lid', base=WOOD_L, voxel=0.006, target_faces=1000, smooth=2)
        p.lathe(rounded([(0, -0.02), (0.195, -0.02), (0.198, 0.0), (0.285, 0.0), (0.285, 0.035), (0.26, 0.05), (0, 0.055)], 0.012, n=3), seg=44)
        p.layer('knob', base=WOOD, voxel=0.006, target_faces=500)
        p.cyl((0, 0.04, 0), 0.04, 0.06, bevel=0.015, seg=20)
        p.blob((0, 0.13, 0), (0.07, 0.055, 0.07), group='k')
        p.layer('skin')
        p.bone('body', (0, 0, 0), (0, 0.2, 0))
        p.extras['outline'] = 0.016
        p.build()

    # ---- brush ----
    if want('prop_pt_brush'):
        p = Prop('prop_pt_brush', base=WOOD, voxel=0.007, target_faces=1400, smooth=2)
        hp = rounded([(0, 0.27), (0.058, 0.27), (0.062, 0.45), (0.066, 0.62), (0.072, 0.8), (0.07, 0.92), (0.045, 0.95), (0, 0.952)], 0.02, n=3)
        p.lathe(hp, seg=24)
        p.paint_fn(lambda q, n: q.y > 0.8, 0xff5a5a)
        p.layer('ferrule', base=0xd8dee8, voxel=0.006, target_faces=500)
        p.lathe([(0.072, 0.14), (0.082, 0.15), (0.075, 0.28), (0.06, 0.29), (0.05, 0.28), (0.05, 0.15)], seg=24, closed=True)
        p.ring((0, 0.2, 0), 0.078, 0.01, seg=24, rseg=5)
        p.layer('tip', base=WHITE, voxel=0.006, target_faces=600)
        p.blob((0, 0.085, 0), (0.088, 0.085, 0.088), group='t')
        p.blob((0, 0.14, 0), (0.072, 0.05, 0.072), group='t')
        p.blob((0, 0.03, 0), (0.05, 0.035, 0.05), group='t')
        p.layer('skin')
        p.anchor('tip', (0, 0.0, 0))
        p.bone('body', (0, 0.0, 0), (0, 0.95, 0))
        p.extras['outline'] = 0.014
        p.build()

    # ---- stamp ----
    if want('prop_pt_stamp'):
        p = Prop('prop_pt_stamp', base=WOOD, voxel=0.006, target_faces=1200, smooth=2)
        p.cyl((0, 0.05, 0), 0.115, 0.045, bevel=0.015, seg=36)
        p.cyl((0, 0.09, 0), 0.045, 0.13, r2=0.04, bevel=0.01, seg=20)
        p.blob((0, 0.27, 0), (0.085, 0.075, 0.085), group='k')
        p.paint_fn(lambda q, n: q.y > 0.2, 0xff5a5a)
        p.layer('sponge', base=WHITE, voxel=0.006, target_faces=500)
        p.cyl((0, 0.0, 0), 0.1, 0.055, bevel=0.018, seg=36)
        p.layer('skin')
        p.anchor('face', (0, 0, 0))
        p.bone('body', (0, 0, 0), (0, 0.35, 0))
        p.extras['outline'] = 0.014
        p.build()

    # ---- tool block ----
    if want('prop_pt_block'):
        p = SProp('prop_pt_block', base=WOOD, voxel=0.01, target_faces=1600)
        p.box((0, 0.15, 0), (0.35, 0.15, 0.2), bevel=0.06)
        p.paint_fn(lambda q, n: n.y < -0.5, WOOD_D)
        p.layer('holes', base=0x8a5a3a, voxel=0.006, target_faces=400)
        p.cyl((-0.17, 0.295, 0), 0.085, 0.01, bevel=0.0, seg=24)
        p.cyl((0.17, 0.295, 0), 0.12, 0.01, bevel=0.0, seg=28)
        p.layer('skin')
        p.anchor('holeA', (-0.17, 0.3, 0))
        p.anchor('holeB', (0.17, 0.3, 0))
        p.bone('body', (0, 0, 0), (0, 0.3, 0))
        p.extras['outline'] = 0.018
        p.build()

    # ---- dish (+ well) ----
    if want('prop_pt_dish'):
        p = Prop('prop_pt_dish', base=WHITE, voxel=0.008, target_faces=1600, smooth=2)
        prof = rounded([(0, 0.0), (0.36, 0.0), (0.38, 0.005), (0.5, 0.075), (0.5, 0.09), (0.48, 0.095), (0.465, 0.085), (0.345, 0.025), (0, 0.025)], 0.012, n=3)
        p.lathe(prof, seg=56)
        p.paint_fn(lambda q, n: q.y < 0.01, 0xeeeeee)
        p.layer('well', base=WHITE, voxel=0.006, target_faces=400)
        p.lathe([(0, 0.026), (0.352, 0.026), (0.352, 0.032), (0, 0.032)], seg=48)
        p.layer('skin')
        for nm, a in (('dotA', -0.36), ('dotB', 0.36)):
            p.anchor(nm, (0.485 * math.sin(a), 0.094, 0.485 * math.cos(a)))
        p.bone('body', (0, 0, 0), (0, 0.1, 0))
        p.extras['outline'] = 0.009
        p.build()
    if want('prop_pt_dot'):
        p = SProp('prop_pt_dot', base=WHITE, voxel=0.0025, target_faces=400)
        p.lathe([(0, 0.0), (0.044, 0.0), (0.047, 0.004), (0.045, 0.009), (0.036, 0.014), (0.02, 0.0175), (0, 0.0185)], seg=40)
        p.bone('body', (0, 0, 0), (0, 0.03, 0))
        p.extras['outline'] = 0.004
        p.build()

    # ---- gallery wall ----
    if want('prop_pt_wall'):
        p = SProp('prop_pt_wall', base=0xfff3df, voxel=0.03, target_faces=2400)
        for k in range(4):
            p.box((0, 0.45 + k * 0.9, -0.06), (3.65, 0.43, 0.06), bevel=0.03)
        p.paint_fn(lambda q, n: n.z < -0.5, 0xe9dcc4)
        p.layer('rails', base=WOOD, voxel=0.012, target_faces=1400)
        for y in WALL_PEGS_Y:
            p.box((0, y, 0.025), (3.65, 0.05, 0.025), bevel=0.02)
        for s in (-1, 1):
            p.box((s * 3.55, 0.2, -0.16), (0.1, 3.3, 0.06), bevel=0.03)   # posts (y -3.1 .. 3.5), at the ends: out of the paint view
        p.box((0, 3.6 + 0.04, -0.04), (3.73, 0.05, 0.1), bevel=0.03)      # top cap
        p.layer('pegs', base=WOOD_D, voxel=0.006, target_faces=1400)
        for y in WALL_PEGS_Y:
            for x in WALL_PEGS_X:
                p.tube([(x, y, 0.04), (x, y, 0.16)], 0.06, rseg=12)
                p.blob((x, y, 0.165), (0.075, 0.075, 0.035), group='pk%.1f%.1f' % (x, y))
        p.layer('skin')
        i = 0
        for y in reversed(WALL_PEGS_Y):
            for x in WALL_PEGS_X:
                p.anchor('peg%d' % i, (x, y, 0.1)); i += 1
        p.bone('body', (0, 0, 0), (0, 3.6, 0))
        p.extras['outline'] = 0.022
        p.build()

    # ---- the stamp's cup (it stands at the easel ledge's right end): origin = its foot; the stamp sits in it at y 0.05
    if want('prop_pt_stampcup'):
        p = SProp('prop_pt_stampcup', base=WOOD, voxel=0.003, target_faces=1200)
        p.lathe(rounded([(0, 0), (0.1, 0), (0.118, 0.012), (0.124, 0.06), (0.118, 0.078), (0.106, 0.078), (0.102, 0.05), (0, 0.05)], 0.008, n=4), seg=48)
        p.ring((0, 0.035, 0), 0.122, 0.006, seg=48, rseg=8)   # a turned groove line
        p.bone('body', (0, 0, 0), (0, 0.08, 0))
        p.extras['outline'] = 0.01
        p.build()

    # ---- the 'hang it up' sign: she taps it when SHE decides her toy is finished ----
    # a little gallery board (cream, wooden frame) on a short post, one peg with a painted toy hanging from it.
    # Origin = the foot of the post (it stands on the easel's top edge); the sign's middle is at y 0.3.
    if want('prop_pt_hangsign'):
        p = SProp('prop_pt_hangsign', base=0xfff3df, voxel=0.008, target_faces=1600)
        sp = rounded([(-0.2, -0.15), (0.2, -0.15), (0.2, 0.15), (-0.2, 0.15)], 0.05, n=4, closed=True)
        p.prism([(x, y + 0.32) for x, y in sp], -0.03, 0.03, bevel=0.012)
        p.layer('frame', base=WOOD, voxel=0.008, target_faces=900)
        fr = rounded([(-0.215, -0.165), (0.215, -0.165), (0.215, 0.165), (-0.215, 0.165)], 0.06, n=4, closed=True)
        p.tube([(x, y + 0.32, 0.03) for x, y in fr], 0.022, closed=True, rseg=8)
        p.box((0, 0.08, -0.01), (0.035, 0.09, 0.03), bevel=0.015)      # the post
        p.layer('peg', base=WOOD_D, voxel=0.006, target_faces=300)
        p.tube([(0, 0.42, 0.03), (0, 0.42, 0.09)], 0.022, rseg=10)
        p.layer('pic', base=0xff5a5a, voxel=0.006, target_faces=500)
        heart = [(0.0, -0.075)] + [(0.045 * math.cos(math.radians(a)) + 0.04, 0.045 * math.sin(math.radians(a)) + 0.01) for a in range(-40, 181, 20)] + \
                [(0.045 * math.cos(math.radians(a)) - 0.04, 0.045 * math.sin(math.radians(a)) + 0.01) for a in range(0, 221, 20)]
        p.prism([(x, y + 0.3) for x, y in heart], 0.03, 0.045, bevel=0.006)
        p.layer('skin')
        p.bone('body', (0, 0, 0), (0, 0.5, 0))
        p.extras['outline'] = 0.012
        p.build()

    # ---- the gallery hook: she hangs her finished toy on it; its cord then pulls it up to the gallery wall ----
    # origin = the peg's axis (a toy's ring centre rests 0.008 below it); a batten above, two cords to a knot at 0.5,
    # one cord on up to 4.5 (out of the picture)
    if want('prop_pt_hook'):
        p = SProp('prop_pt_hook', base=WOOD, voxel=0.006, target_faces=1400)
        p.box((0, 0.1, -0.03), (0.2, 0.05, 0.035), bevel=0.025)
        p.layer('peg', base=WOOD_D, voxel=0.005, target_faces=500)
        p.tube([(0, 0.0, -0.03), (0, 0.0, 0.11)], 0.035, rseg=12)
        p.blob((0, 0.0, 0.115), (0.05, 0.05, 0.025), group='knob')
        p.tube([(0, 0.0, -0.03), (0, 0.06, -0.03)], 0.035, rseg=12)
        p.layer('cord', base=TWINE, voxel=0.005, target_faces=500)
        p.tube([(-0.16, 0.14, -0.03), (0, 0.5, -0.03)], 0.012, rseg=6)
        p.tube([(0.16, 0.14, -0.03), (0, 0.5, -0.03)], 0.012, rseg=6)
        p.blob((0, 0.5, -0.03), (0.03, 0.03, 0.03), group='knot')
        p.tube([(0, 0.5, -0.03), (0, 4.5, -0.03)], 0.012, rseg=6)
        p.layer('skin')
        p.bone('body', (0, 0, 0), (0, 0.5, 0))
        p.extras['outline'] = 0.012
        p.build()

    # ---- card stand ----
    if want('prop_pt_cardstand'):
        p = SProp('prop_pt_cardstand', base=WOOD, voxel=0.01, target_faces=1400)
        p.box((0, 0.06, 0), (0.42, 0.06, 0.16), bevel=0.04)
        p.box((0, 0.17, -0.02), (0.36, 0.05, 0.05), bevel=0.03)
        p.layer('card', base=WHITE, voxel=0.008, target_faces=900)
        cpoly = rounded([(-0.4, -0.4), (0.4, -0.4), (0.4, 0.4), (-0.4, 0.4)], 0.09, n=5, closed=True)
        p.prism([(x, y + 0.6) for x, y in cpoly], -0.015, 0.015, bevel=0.008)
        p.layer('skin')
        p.bone('body', (0, 0, 0), (0, 1.0, 0))
        p.extras['outline'] = 0.016
        p.build()


if __name__ == '__main__':
    res = all_shapes()
    write_json(res)
    if '--preview' in sys.argv:
        preview(res, sys.argv[sys.argv.index('--preview') + 1])
    else:
        try:
            import bpy  # noqa: F401
            blender_build(res)
        except ImportError:
            pass
