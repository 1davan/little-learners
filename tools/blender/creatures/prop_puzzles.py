"""Shape puzzles (`puzzles`, Building site) models. Everything is chunky painted wood, built from bevelled solids with no
voxel remesh, so every edge is crisp and every recess is cut EXACTLY to its piece.

Geometry is shared with the game through app/src/lessons/puzzles-layout.json:
  - the hand-authored hole list (shape, centre, size, angle) is read from it,
  - this script computes the six unit outlines (exact fillets), each hole's recess outline (the piece outline offset
    by `clearance`, by ray bisection on the signed distance) and each floor tile's scale, checks them (piece inside its
    recess with an even gap, recesses never touching, all inside the picture), and writes them back into the JSON.

Models (game space: x right, y up, z toward the camera; the board face is the plane z = 0):
  prop_pz_board1/2/3  the picture board for each level: 13.6 x 4.4 x 0.3 (x -6.8..6.8, y 0.8..5.2, z -0.3..0) with a
                      raised rim, ten recesses cut 0.27 deep, the ledge (top y 0.8, z 0..1.25), its brackets and A-frame
                      feet, and a toy cupboard in the lower band (opening x -2.3..3.7, y 0.8..2.36, floor level with the
                      ledge, deep cabinet with a hidden top behind the board). Layer 'face': the 4 mm painted sheet on the
                      face (holes cut the same), drawn with a canvas texture mapped from x, y. Layer 'shutter': the
                      cupboard's roll-up door just behind the opening (the game raises it 1.62 to hide it behind the board).
  prop_pz_circle/_square/_triangle/_rect/_star/_heart  a 1.0 piece (unit outline), 0.22 thick, soft bevel, origin
                      at the shape's centre; white (tinted in game), the side band a little darker. Layer 'floor': the
                      same outline as a thin slab (the recess floor tile).
  prop_pz_tray        the tidy tray in the cupboard (cupboard-frame coordinates x 2.1..3.55, lid groove at z 0.73).
  prop_pz_stand       a low cradle (groove at y 0.085, z 0) a piece leans in.
  prop_pz_lid         1 x 1 rounded cover on four 0.07 feet (z 0..0.07, plate z 0.07..0.17); layer 'knob' (red).
  prop_pz_plug        a grey-blue round bung, 0.6 across, body z -0.155..0 (sits on an open recess floor); 'knob' red.
  prop_pz_box         toy box, open bottom: back, sides and top (x +-0.8, y 0..1.40, z +-0.27); layer 'lid' is the front
                      flap (hinged at its bottom edge, z 0.27) with 'star' and 'knob' on it; 'lift' the floor plate.
  prop_pz_cup         oval upturned cup (x radius 0.5, z radius 0.3, 0.86 tall, origin at its bottom centre) with a knob
                      (layers 'arm' / 'post' are an unused sleeve-and-post variant).
  prop_pz_case        glass case: frame x +-1.05, y 0..1.35, z +-0.3; layers 'glass' (front pane), 'ring' (red pull
                      ring centred at the origin), 'cord' (a unit cord from y 0 to 1, origin at its top), and the pulley
                      arm out to x 1.5 at y 1.35 in the skin.
  prop_pz_lockbox     glass-front box: frame x +-0.95, y 0..1.38, z +-0.4; layers 'door' (wood frame, hinged at x -0.95,
                      z 0.42), 'doorglass', 'lock' (padlock body, keyhole underneath, centred at the origin), 'shackle'.
  prop_pz_hook        a post (1.05 tall) with a hook at the top facing +z.
  prop_pz_ramp        a sloping U track from x -1.95 (top y 0.6) to x 1.95, cradle at x 1.5, legs to the deck (y 0);
                      layer 'tube' (clear tube round the ball at x -1.5).
  prop_pz_peg         a red peg (0.7 tall, origin at its bottom centre) with a round knob.
ONLY=prop_pz_board1 tools/blender/build.sh prop_puzzles      (LAYOUT_ONLY=1 just recomputes the JSON)"""
import sys, os, math, json
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
import numpy as np
from skit import SProp, rounded, TAU

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
LAYOUT = os.path.join(ROOT, 'app', 'src', 'lessons', 'puzzles-layout.json')
ONLY = [s for s in os.environ.get('ONLY', '').split(',') if s]
WHITE = 0xffffff
WOOD, WOOD_L, WOOD_D, WOOD_DD = 0xeac796, 0xf6dfb6, 0xcf9d63, 0xa9763f
INK = 0x3a2838

# =====================================================================================================================
#  2-D geometry (numpy): exact outlines, offsets by signed distance, checks
# =====================================================================================================================


def arc_pts(c, r, a0, a1, step=0.012):
    n = max(2, int(abs(a1 - a0) * r / step) + 1)
    return [(c[0] + r * math.cos(a0 + (a1 - a0) * i / n), c[1] + r * math.sin(a0 + (a1 - a0) * i / n)) for i in range(n + 1)]


def fillet(pts, radii, step=0.008):
    """Round every corner of a closed polygon with a true circular arc (convex or concave corners alike)."""
    P = [np.array(p, float) for p in pts]
    n = len(P)
    out = []
    for i in range(n):
        p0, p1, p2 = P[i - 1], P[i], P[(i + 1) % n]
        r = radii[i] if isinstance(radii, (list, tuple)) else radii
        a, b = p0 - p1, p2 - p1
        la, lb = np.linalg.norm(a), np.linalg.norm(b)
        ua, ub = a / la, b / lb
        ang = math.acos(max(-1.0, min(1.0, float(ua @ ub))))
        if r <= 0 or ang > math.pi - 1e-3:
            out.append(tuple(p1)); continue
        t = r / math.tan(ang / 2)
        lim = 0.48 * min(la, lb)
        if t > lim:
            t = lim; r = t * math.tan(ang / 2)
        bis = ua + ub; bis /= np.linalg.norm(bis)
        c = p1 + bis * (r / math.sin(ang / 2))
        s, e = p1 + ua * t, p1 + ub * t
        A0 = math.atan2(s[1] - c[1], s[0] - c[0]); A1 = math.atan2(e[1] - c[1], e[0] - c[0])
        d = A1 - A0
        while d > math.pi: d -= TAU
        while d < -math.pi: d += TAU
        out += arc_pts(c, r, A0, A0 + d, step)
    return out


def area(P):
    P = np.asarray(P)
    x, y = P[:, 0], P[:, 1]
    return 0.5 * float(np.sum(x * np.roll(y, -1) - np.roll(x, -1) * y))


def ccw(P):
    return P if area(P) > 0 else P[::-1]


def dedupe(P, eps=1e-6):
    out = []
    for p in P:
        if not out or math.hypot(p[0] - out[-1][0], p[1] - out[-1][1]) > eps:
            out.append((float(p[0]), float(p[1])))
    if len(out) > 2 and math.hypot(out[0][0] - out[-1][0], out[0][1] - out[-1][1]) < eps:
        out.pop()
    return out


def unit_shapes():
    S = {}
    S['circle'] = [(0.5 * math.cos(TAU * i / 128), 0.5 * math.sin(TAU * i / 128)) for i in range(128)]
    sq = fillet([(-0.5, -0.5), (0.5, -0.5), (0.5, 0.5), (-0.5, 0.5)], 0.1)
    S['square'] = sq
    S['rect'] = list(sq)
    tri = fillet([(-0.5, -0.5), (0.5, -0.5), (0.0, 0.5)], 0.085)
    S['triangle'] = tri
    star = []
    for i in range(10):
        a = math.radians(90 + 36 * i)
        rr = 0.5 if i % 2 == 0 else 0.5 * 0.5
        star.append((rr * math.cos(a), rr * math.sin(a)))
    S['star'] = fillet(star, [0.075 if i % 2 == 0 else 0.05 for i in range(10)])
    S['heart'] = heart_outline()
    out = {}
    for k, P in S.items():
        P = np.array(ccw(dedupe(P)))
        lo, hi = P.min(0), P.max(0)
        if k in ('triangle', 'heart'):
            P = (P - (lo + hi) / 2) / (hi - lo)                    # exact 1 x 1 box, centred on it
        elif k == 'star':
            P = P / (hi[0] - lo[0])                               # width 1, centred on the star's own centre
        out[k] = P
    return out


def heart_outline():
    """two round lobes and a soft point: lobes r 0.3 at (+-0.21, 0.12), tip at (0, -0.62); fillets at the cleft and
    the tip. CCW from the tip."""
    r, cx, cy, B = 0.3, 0.21, 0.12, np.array([0.0, -0.62])
    f_tip, f_cleft = 0.09, 0.07
    # tangent from B to the right lobe, on its outer side
    C = np.array([cx, cy]); d = np.linalg.norm(C - B)
    base = math.atan2(B[1] - C[1], B[0] - C[0]); off = math.acos(r / d)
    aT = base + off                                  # the tangent point angle on the right lobe (outer, lower right)
    # cleft fillet circle: on the axis, touching both lobes from outside
    yc = cy + math.sqrt((r + f_cleft) ** 2 - cx ** 2)
    aF = math.atan2(yc - cy, 0 - cx)                 # direction from the right lobe's centre to the fillet centre
    right = arc_pts((cx, cy), r, aT, aF if aF > aT else aF + TAU, 0.008)
    # fillet arc (concave): around (0, yc), from the right lobe's touch point to the left one's, passing under
    pR = np.array([cx, cy]) + r * np.array([math.cos(aF), math.sin(aF)])
    a0 = math.atan2(pR[1] - yc, pR[0]); a1 = math.pi - a0
    cl = arc_pts((0, yc), f_cleft, a0, a0 - (a0 - a1 + (TAU if a1 > a0 else 0)), 0.006)
    # check the direction: the cleft arc must dip down (pass under the fillet centre)
    mid = cl[len(cl) // 2]
    if mid[1] > yc:
        cl = arc_pts((0, yc), f_cleft, a0, a1 if a1 > a0 else a1 + TAU, 0.006)
    left = [(-x, y) for x, y in reversed(right)]
    pts = right[1:] + cl[1:-1] + left[:-1]
    # the tip: fillet between the two tangent lines
    tR = np.array(right[0]); tL = np.array(left[-1])
    ua = (tL - B) / np.linalg.norm(tL - B); ub = (tR - B) / np.linalg.norm(tR - B)
    ang = math.acos(float(ua @ ub)); t = f_tip / math.tan(ang / 2)
    bis = (ua + ub) / np.linalg.norm(ua + ub); c = B + bis * (f_tip / math.sin(ang / 2))
    s, e = B + ua * t, B + ub * t
    A0 = math.atan2(s[1] - c[1], s[0] - c[0]); A1 = math.atan2(e[1] - c[1], e[0] - c[0])
    dd = A1 - A0
    while dd > math.pi: dd -= TAU
    while dd < -math.pi: dd += TAU
    tip = arc_pts(c, f_tip, A0, A0 + dd, 0.008)
    return dedupe(tip + pts)


def point_in(Q, P):
    x, y = Q[:, 0:1], Q[:, 1:2]
    x1, y1 = P[:, 0][None, :], P[:, 1][None, :]
    x2, y2 = np.roll(P[:, 0], -1)[None, :], np.roll(P[:, 1], -1)[None, :]
    cond = (y1 > y) != (y2 > y)
    xin = x1 + (y - y1) * (x2 - x1) / np.where(y2 - y1 == 0, 1e-12, y2 - y1)
    return (np.sum(cond & (x < xin), axis=1) % 2) == 1


def sdist(P, Q):
    """signed distance from points Q (K, 2) to the closed polygon P (M, 2); negative inside"""
    A = P; Bv = np.roll(P, -1, axis=0); AB = Bv - A
    L2 = np.sum(AB * AB, axis=1)
    out = np.empty(len(Q))
    for k0 in range(0, len(Q), 2048):
        q = Q[k0:k0 + 2048]
        AQ = q[:, None, :] - A[None, :, :]
        t = np.clip(np.sum(AQ * AB[None], axis=2) / np.maximum(L2, 1e-12)[None], 0, 1)
        C = A[None] + t[..., None] * AB[None]
        d = np.sqrt(np.sum((q[:, None, :] - C) ** 2, axis=2)).min(axis=1)
        out[k0:k0 + 2048] = np.where(point_in(q, P), -d, d)
    return out


def resample(P, n):
    """n points evenly spaced by arc length along the closed polygon"""
    P = np.asarray(P); Q = np.vstack([P, P[:1]])
    seg = np.sqrt(np.sum(np.diff(Q, axis=0) ** 2, axis=1)); cum = np.concatenate([[0], np.cumsum(seg)])
    s = np.linspace(0, cum[-1], n, endpoint=False)
    x = np.interp(s, cum, Q[:, 0]); y = np.interp(s, cum, Q[:, 1])
    return np.stack([x, y], 1)


def level_set(P, level, dirs, center=(0, 0), rmax=3.0):
    """for each ray direction from center: the first point where sdist(P) == level (outward); returns (N, 2)"""
    c = np.asarray(center, float)
    N = len(dirs); S = 96
    rs = np.linspace(0, rmax, S)
    Q = (c[None, None, :] + rs[None, :, None] * dirs[:, None, :]).reshape(-1, 2)
    f = (sdist(P, Q) - level).reshape(N, S)
    first = np.argmax(f > 0, axis=1)
    lo = rs[np.maximum(first - 1, 0)]; hi = rs[first]
    for _ in range(30):
        mid = (lo + hi) / 2
        fm = sdist(P, c[None] + mid[:, None] * dirs) - level
        lo = np.where(fm <= 0, mid, lo); hi = np.where(fm > 0, mid, hi)
    r = (lo + hi) / 2
    return c[None] + r[:, None] * dirs


def ray_dirs(P, n, center=(0, 0)):
    R = resample(P, n) - np.asarray(center)[None]
    return R / np.linalg.norm(R, axis=1)[:, None]


def simplify(P, tol=0.0015):
    """Douglas-Peucker on a closed polygon"""
    P = np.asarray(P)
    def dp(a):
        if len(a) < 3:
            return list(range(len(a)))
        s, e = a[0], a[-1]; v = e - s; L = np.linalg.norm(v)
        if L < 1e-12:
            d = np.linalg.norm(a - s, axis=1)
        else:
            d = np.abs(v[0] * (a[:, 1] - s[1]) - v[1] * (a[:, 0] - s[0])) / L
        i = int(np.argmax(d))
        if d[i] > tol:
            l = dp(a[:i + 1]); r = dp(a[i:])
            return l[:-1] + [x + i for x in r]
        return [0, len(a) - 1]
    i0 = 0; i1 = int(np.argmax(np.linalg.norm(P - P[0], axis=1)))
    A = np.vstack([P[i0:i1 + 1]]); Bv = np.vstack([P[i1:], P[:1]])
    ia = dp(A); ib = dp(Bv)
    keep = [i0 + k for k in ia] + [i1 + k for k in ib[1:-1]]
    return P[sorted(set(keep))]


def place(P, h):
    """unit outline -> board space for hole h"""
    a = math.radians(h.get('a', 0)); ca, sa = math.cos(a), math.sin(a)
    Q = np.asarray(P) * np.array([h['sx'], h['sy']])
    return np.stack([Q[:, 0] * ca - Q[:, 1] * sa + h['x'], Q[:, 0] * sa + Q[:, 1] * ca + h['y']], 1)


SHAPES = unit_shapes()
BOARD = dict(x0=-6.8, x1=6.8, y0=0.8, y1=5.2, rim=0.12)
CUPBOARD = dict(x0=-2.3, x1=3.7, y0=0.8, y1=2.36)   # the toy cupboard in the board's lower band


def compute_layout():
    L = json.load(open(LAYOUT))
    cl = L['clearance']
    shapes_out = {k: [[round(float(x), 5), round(float(y), 5)] for x, y in simplify(P, 0.0008)] for k, P in SHAPES.items()}
    L['shapes'] = shapes_out
    problems = []
    for lv in L['levels']:
        polys = []
        for h in lv['holes']:
            U = SHAPES[h['shape']]
            piece = place(U, h)
            dirs = ray_dirs(piece, 360, (h['x'], h['y']))
            hole = level_set(piece, cl, dirs, (h['x'], h['y']))
            hole_s = simplify(hole, 0.0012)
            # checks: every piece point sits inside the recess with a gap close to the clearance
            g = -sdist(hole_s, resample(piece, 400))
            if g.min() < cl * 0.8 or g.max() > cl * 1.35:
                problems.append('%s %s gap %.3f..%.3f' % (lv['id'], h['id'], g.min(), g.max()))
            # floor tile scale: as big as fits with >= 0.01 all round
            lo, hi = 0.9, 1.2
            for _ in range(30):
                k = (lo + hi) / 2
                T = (piece - np.array([h['x'], h['y']])) * k + np.array([h['x'], h['y']])
                if (-sdist(hole_s, resample(T, 400))).min() >= 0.01:
                    lo = k
                else:
                    hi = k
            h['tile'] = round(lo, 4)
            h['poly'] = [[round(float(x), 4), round(float(y), 4)] for x, y in hole_s]
            bx = hole_s.min(0); by = hole_s.max(0)
            h['box'] = [round(float(bx[0]), 3), round(float(bx[1]), 3), round(float(by[0]), 3), round(float(by[1]), 3)]
            r = BOARD['rim']
            if bx[0] < BOARD['x0'] + r + 0.02 or by[0] > BOARD['x1'] - r - 0.02 or by[1] > BOARD['y1'] - r - 0.015 or bx[1] < BOARD['y0'] + r + 0.3:
                problems.append('%s %s outside the picture %s' % (lv['id'], h['id'], h['box']))
            polys.append((h['id'], hole_s))
        for i in range(len(polys)):
            for j in range(i + 1, len(polys)):
                d = sdist(polys[j][1], resample(polys[i][1], 300)).min()
                if d < 0.015:
                    problems.append('%s walls %s/%s %.3f' % (lv['id'], polys[i][0], polys[j][0], d))
    json.dump(L, open(LAYOUT, 'w'), indent=1)
    print('LAYOUT written', LAYOUT)
    for p in problems:
        print('LAYOUT PROBLEM', p)
    return L


# =====================================================================================================================
#  Blender helpers
# =====================================================================================================================


class PZ(SProp):
    """SProp + exact boolean cuts on a layer's first primitive (recesses), removed again after the skin is made."""

    def cut(self, poly, z0, z1):
        self.layers[self._cur].setdefault('cuts', []).append((poly, z0, z1))

    def _metaballs(self):
        import bpy
        objs = super()._metaballs()
        cuts = self.layers[self._cur].get('cuts')
        if cuts and objs:
            from lib import G
            tgt = objs[0]
            self._cutters = []
            for poly, z0, z1 in cuts:
                n = len(poly)
                verts = [G((x, y, z0)) for x, y in poly] + [G((x, y, z1)) for x, y in poly]
                faces = [tuple(range(n - 1, -1, -1)), tuple(range(n, 2 * n))]
                for i in range(n):
                    j = (i + 1) % n
                    faces.append((i, j, n + j, n + i))
                me = bpy.data.meshes.new('cutter'); me.from_pydata(verts, [], faces); me.update()
                ob = bpy.data.objects.new('cutter', me)
                bpy.context.scene.collection.objects.link(ob)
                ob.hide_viewport = True; ob.hide_render = True
                md = tgt.modifiers.new('cut', 'BOOLEAN'); md.operation = 'DIFFERENCE'; md.solver = 'EXACT'; md.object = ob
                self._cutters.append(ob)
            lip = self.layers[self._cur].get('lip')
            if lip:
                md = tgt.modifiers.new('lip', 'BEVEL'); md.width = lip; md.segments = 2
                md.limit_method = 'ANGLE'; md.angle_limit = math.radians(50); md.harden_normals = False
        return objs

    def _skin(self):
        import bpy
        self._cutters = []
        skin = super()._skin()
        for ob in self._cutters:
            bpy.data.objects.remove(ob)
        self._cutters = []
        return skin

    def slab(self, poly, z0, z1, bevel=0.0):
        """an extruded polygon (game x, y) between z0 and z1 (n-gon caps, triangulated later)"""
        n = len(poly)
        verts = [(x, y, z0) for x, y in poly] + [(x, y, z1) for x, y in poly]
        faces = [tuple(range(n - 1, -1, -1)), tuple(range(n, 2 * n))]
        for i in range(n):
            j = (i + 1) % n
            faces.append((i, j, n + j, n + i))
        self._prims().append(('mesh', verts, faces, bevel))

    def pillow(self, P, thick, bevel, steps=4, n=160, z0=0.0, axis='z'):
        """a soft-edged slab of the outline P (centred on z0): a quarter-round bevel on both faces, flat n-gon caps.
        Insets are true offsets of the outline (rings share their ray directions, so the quads are clean)."""
        P = np.asarray(P, float)
        c = (0.0, 0.0)
        dirs = ray_dirs(P, n, c)
        rings = []
        prof = []
        for k in range(steps + 1):
            th = math.pi / 2 * k / steps
            prof.append((bevel * (1 - math.cos(th)), -(thick / 2 - bevel) - bevel * math.sin(th)))
        prof = prof[::-1]
        for k in range(steps + 1):
            th = math.pi / 2 * k / steps
            prof.append((bevel * (1 - math.cos(th)), (thick / 2 - bevel) + bevel * math.sin(th)))
        cache = {}
        for ins, z in prof:
            key = round(ins, 6)
            if key not in cache:
                cache[key] = level_set(P, -ins, dirs, c) if ins > 1e-6 else level_set(P, 0.0, dirs, c)
            rings.append((cache[key], z0 + z))
        verts, faces = [], []
        for R, z in rings:
            for x, y in R:
                verts.append((x, y, z) if axis == 'z' else (x, z, -y))
        nr = len(rings)
        for r in range(nr - 1):
            for i in range(n):
                j = (i + 1) % n
                faces.append((r * n + i, r * n + j, (r + 1) * n + j, (r + 1) * n + i))
        faces.append(tuple(range(n - 1, -1, -1)))
        faces.append(tuple((nr - 1) * n + i for i in range(n)))
        self._prims().append(('mesh', verts, faces, 0))


def done(p, outline=0.022):
    p.extras['outline'] = outline
    p.build()


# =====================================================================================================================
#  models
# =====================================================================================================================
RIMS = [0x58b86a, 0x4a5fc4, 0xff7aa8]   # garden green, night blue, party pink


def board(i, L):
    lv = L['levels'][i - 1]
    p = PZ('prop_pz_board%d' % i, base=WOOD)
    B = BOARD
    # the board itself (first prim: the recesses are cut from it)
    p.box((0, (B['y0'] + B['y1']) / 2, -0.15), ((B['x1'] - B['x0']) / 2, (B['y1'] - B['y0']) / 2, 0.15), bevel=0.05)
    for h in lv['holes']:
        p.cut(h['poly'], -L['depth'], 0.3)
    O = CUPBOARD
    p.cut([(O['x0'], O['y0'] - 0.1), (O['x1'], O['y0'] - 0.1), (O['x1'], O['y1']), (O['x0'], O['y1'])], -0.45, 0.3)
    p.layers[p._cur]['lip'] = 0.012
    r = B['rim']
    # raised rim (a picture frame, front at z 0.055); the bottom bar stops at the cupboard
    zc, hz = 0.005, 0.05
    p.box((0, B['y1'] - r / 2, zc), (B['x1'] + 0.0, r / 2, hz), bevel=0.035)
    for a, b in ((B['x0'], O['x0'] - 0.06), (O['x1'] + 0.06, B['x1'])):
        p.box(((a + b) / 2, B['y0'] + r / 2, zc), ((b - a) / 2, r / 2, hz), bevel=0.035)
    p.box((B['x0'] + r / 2, (B['y0'] + B['y1']) / 2, zc), (r / 2, (B['y1'] - B['y0']) / 2 - 0.02, hz), bevel=0.035)
    p.box((B['x1'] - r / 2, (B['y0'] + B['y1']) / 2, zc), (r / 2, (B['y1'] - B['y0']) / 2 - 0.02, hz), bevel=0.035)
    # a little arched frame round the cupboard opening
    for x in (O['x0'] - 0.06, O['x1'] + 0.06):
        p.box((x, (O['y0'] + O['y1']) / 2 + 0.03, zc), (0.06, (O['y1'] - O['y0']) / 2 + 0.03, hz), bevel=0.03)
    p.box(((O['x0'] + O['x1']) / 2, O['y1'] + 0.03, zc), ((O['x1'] - O['x0']) / 2 + 0.12, 0.035, hz), bevel=0.025)
    # the cupboard behind the opening: floor (level with the ledge), sides, back and a high hidden top
    cx_, hx_ = (O['x0'] + O['x1']) / 2, (O['x1'] - O['x0']) / 2
    p.box((cx_, 0.76, -0.985), (hx_ + 0.1, 0.04, 0.685), bevel=0.02)
    for x in (O['x0'] - 0.05, O['x1'] + 0.05):
        p.box((x, 2.37, -0.985), (0.05, 1.65, 0.685), bevel=0.02)
    p.box((cx_, 2.37, -1.7), (hx_ + 0.1, 1.65, 0.04), bevel=0.02)
    p.box((cx_, 4.02, -0.985), (hx_ + 0.1, 0.04, 0.685), bevel=0.02)
    # the ledge (a shelf along the bottom) with a front lip
    p.box((0, 0.74, 0.625), (6.95, 0.06, 0.625), bevel=0.03)
    p.box((0, 0.82, 1.215), (6.95, 0.04, 0.035), bevel=0.02)
    # apron behind the ledge and brackets under it
    p.box((0, 0.5, -0.15), (6.7, 0.3, 0.1), bevel=0.03)
    for x in (-4.5, 0.0, 4.5):
        p.prism([(0.0, 0.68), (0.95, 0.68), (0.0, 0.22)], x - 0.06, x + 0.06, bevel=0.02, axis='x')
    # A-frame feet: a back strut, a front post under the ledge and a foot rail joining them
    for x in (-6.25, 6.25):
        p.tube([(x, 0.06, -1.45), (x, 3.4, -0.33)], 0.075, rseg=10)
        p.box((x, 0.34, 1.0), (0.08, 0.34, 0.08), bevel=0.025)
        p.box((x, 0.06, -0.22), (0.1, 0.06, 1.35), bevel=0.03)
    rim = RIMS[i - 1]
    ins = lambda q: B['x0'] + 0.02 < q.x < B['x1'] - 0.02 and B['y0'] + 0.02 < q.y < B['y1'] - 0.02
    p.paint_fn(lambda q, n: 0.0 < q.z < 0.075 and q.y > 0.805 and q.y < B['y1'] + 0.01 and abs(q.x) < B['x1'] + 0.01 and not (
        B['x0'] + r - 0.004 < q.x < B['x1'] - r + 0.004 and B['y0'] + r - 0.004 < q.y < B['y1'] - r + 0.004), rim)
    p.paint_fn(lambda q, n: q.z < -0.004 and q.z > -L['depth'] - 0.01 and ins(q) and abs(n.z) < 0.7, WOOD_D)
    p.paint_fn(lambda q, n: q.z < -L['depth'] + 0.01 and q.z > -L['depth'] - 0.01 and n.z > 0.7 and ins(q), WOOD_D)
    p.paint_fn(lambda q, n: q.y < 0.79 and q.z < -0.02, WOOD_DD)
    p.paint_fn(lambda q, n: q.y < 0.67 and q.z > 0.0, WOOD_D)
    p.paint_fn(lambda q, n: 0.75 < q.y < 0.81 and q.z > 0.0 and n.y > 0.7, WOOD_L)
    inside = lambda q: O['x0'] - 0.11 < q.x < O['x1'] + 0.11 and q.z < -0.29
    p.paint_fn(lambda q, n: inside(q), 0xd6a774)
    p.paint_fn(lambda q, n: inside(q) and q.y < 0.81 and n.y > 0.7, 0xf0d2a4)
    p.paint_fn(lambda q, n: inside(q) and q.y > 0.81 and q.z < -1.6, 0xc4925e)
    # the painted face sheet (holes cut the same), drawn with the canvas scene in game
    p.layer('face', base=WHITE)
    p.box((0, (B['y0'] + B['y1']) / 2, 0.002), ((B['x1'] - B['x0']) / 2 - r + 0.002, (B['y1'] - B['y0']) / 2 - r + 0.002, 0.002), bevel=0)
    for h in lv['holes']:
        p.cut(h['poly'], -0.1, 0.1)
    p.cut([(O['x0'] - 0.12, O['y0'] - 0.2), (O['x1'] + 0.12, O['y0'] - 0.2), (O['x1'] + 0.12, O['y1'] + 0.065), (O['x0'] - 0.12, O['y1'] + 0.065)], -0.1, 0.1)
    # the roll-up door (slats) just behind the opening; the game raises it 1.62 to hide it behind the board
    p.layer('shutter', base=RIMS[i - 1])
    p.box((cx_, (O['y0'] + O['y1']) / 2 + 0.01, -0.33), (hx_ + 0.03, (O['y1'] - O['y0']) / 2 + 0.01, 0.014), bevel=0.008)
    for k in range(1, 8):
        p.box((cx_, O['y0'] + k * (O['y1'] - O['y0']) / 8, -0.312), (hx_ - 0.04, 0.012, 0.006), bevel=0.004)
    p.box((cx_, O['y0'] + 0.22, -0.305), (0.45, 0.05, 0.02), bevel=0.015)
    p.paint_fn(lambda q, n: q.z > -0.32 and q.y < O['y1'] - 0.02 and abs(q.y - O['y0'] - 0.22) < 0.06 and abs(q.x - cx_) < 0.46, 0xfff1d8)
    p.paint_fn(lambda q, n: q.z > -0.32 and abs(q.y - O['y0'] - 0.22) > 0.06 and n.z > 0.5 and (round((q.y - O['y0']) / ((O['y1'] - O['y0']) / 8)) % 2 == 0), 0xffffff)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 1, 0))
    done(p, 0.024)


def piece(kind):
    p = PZ('prop_pz_' + kind, base=WHITE)
    p.pillow(SHAPES[kind], 0.22, 0.06, steps=3, n=128)
    p.paint_fn(lambda q, n: abs(n.z) < 0.55, 0xe6ded2)
    # the recess floor tile: the same outline, a thin plain slab (light, for many copies)
    p.layer('floor', base=WHITE)
    p.pillow(SHAPES[kind], 0.08, 0.02, steps=1, n=96)
    p.layer('skin')
    p.bone('body', (0, -0.5, 0), (0, 0.5, 0))
    p.extras.update(argMode='tint', argDefault=0xffd23f)
    done(p, 0.02)


def stand():
    """a low cradle: base (top y 0.072), a groove 0.28 wide (z -0.14..0.14) between a front lip and a back rest"""
    p = PZ('prop_pz_stand', base=0x6ec0e8)
    p.box((0, 0.036, 0), (0.32, 0.036, 0.25), bevel=0.03)
    p.box((0, 0.068, 0.18), (0.3, 0.025, 0.04), bevel=0.02)
    p.box((0, 0.13, -0.19), (0.3, 0.06, 0.05), bevel=0.03)
    p.paint_fn(lambda q, n: n.y > 0.8 and abs(q.z) < 0.135, 0x3f8ccc)
    p.bone('body', (0, 0, 0), (0, 0.3, 0))
    done(p, 0.018)


def lid():
    p = PZ('prop_pz_lid', base=WHITE)          # white: the game tints it a clear colour of its own
    sq = fillet([(-0.5, -0.5), (0.5, -0.5), (0.5, 0.5), (-0.5, 0.5)], 0.16)
    p.pillow(np.array(ccw(dedupe(sq))), 0.1, 0.035, steps=3, n=96, z0=0.12)
    p.paint_fn(lambda q, n: abs(n.z) < 0.6, 0xd9e2ea)
    p.paint_fn(lambda q, n: q.z < 0.075, 0xb9c4cf)
    p.layer('knob', base=0xff5a4a)
    p.lathe([(0, 0), (0.055, 0), (0.05, 0.07), (0.09, 0.1), (0.115, 0.15), (0.1, 0.2), (0.06, 0.225), (0, 0.23)], pos=(0, 0, 0.16), rot=(90, 0, 0), seg=24)
    p.paint_fn(lambda q, n: n.z > 0.75 and q.x < 0 and q.y > 0, 0xff9a8a)
    # one foot (the game places four where they stand on the bare board, clear of every recess)
    p.layer('foot', base=WOOD_D)
    p.lathe(rounded([(0, 0), (0.045, 0), (0.045, 0.08), (0, 0.08)], 0.012, n=2), pos=(0, 0, 0.002), rot=(90, 0, 0), seg=14)
    p.layer('skin')
    p.bone('body', (0, -0.4, 0), (0, 0.4, 0))
    done(p, 0.018)


def plug():
    p = PZ('prop_pz_plug', base=0x8fa6cf)
    p.lathe(rounded([(0, -0.155), (0.3, -0.155), (0.3, -0.03), (0.27, 0.0), (0, 0.0)], 0.03, n=3), rot=(90, 0, 0), seg=40)
    p.paint_fn(lambda q, n: n.z > 0.8 and math.hypot(q.x, q.y) < 0.2, 0xa9bde0)
    p.layer('knob', base=0xff5a4a)
    p.lathe([(0, 0), (0.09, 0), (0.085, 0.035), (0.06, 0.055), (0, 0.062)], pos=(0, 0, -0.005), rot=(90, 0, 0), seg=24)
    p.layer('skin')
    p.bone('body', (0, -0.3, 0), (0, 0.3, 0))
    done(p, 0.018)


def box():
    """toy chest (x +-0.85, y 0..1.42, z +-0.4): a deep body with a dark inside, a cream trim (top lip + the front
    edges of the sides) and a front door ('lid', z 0.3..0.37 between the sides) that SLIDES UP through a slot under the
    lip into the cupboard's hidden top, so nothing ever leaves the cupboard; 'knob' rides on the door; 'lift' the floor."""
    p = PZ('prop_pz_box', base=WHITE)
    W, H, D, t = 0.85, 1.42, 0.4, 0.07
    p.box((0, 0.03, 0), (W, 0.03, D), bevel=0.02)                                   # floor
    p.box((0, H / 2, -D + t / 2), (W, H / 2, t / 2), bevel=0.025)                   # back
    for sx in (-1, 1):
        p.box((sx * (W - t / 2), H / 2, 0), (t / 2, H / 2, D), bevel=0.025)          # sides (full depth)
    p.box((0, H - 0.035, -0.07), (W, 0.035, D - 0.07 - 0.02), bevel=0.02)          # top, behind the door's slot
    inside = lambda q, n: abs(q.x) < W - t + 0.002 and q.z > -D + t - 0.002 and 0.059 < q.y < H - 0.069
    p.paint_fn(lambda q, n: inside(q, n), 0x5a4038)
    p.layer('trim', base=0xfff3df)
    p.box((0, H + 0.05, 0.02), (W + 0.03, 0.05, D + 0.0), bevel=0.03)              # top lip (over the slot, in front)
    for sx in (-1, 1):
        p.box((sx * (W - 0.035), H / 2, D - 0.005), (0.05, H / 2 + 0.01, 0.02), bevel=0.015)
    p.box((0, 0.05, D - 0.005), (W, 0.05, 0.02), bevel=0.015)                       # sill
    p.paint_fn(lambda q, n: n.y > 0.7 and q.y > H, 0xffffff)
    p.layer('lid', base=WHITE)
    p.box((0, (H + 0.1) / 2, D - 0.065), (W - 0.075, (H - 0.1) / 2, 0.03), bevel=0.02)
    p.paint_fn(lambda q, n: n.z > 0.5 and abs(q.x) < W - 0.2 and 0.25 < q.y < H - 0.15, 0xe9e2da)
    p.layer('knob', base=0xffd23f)
    p.box((0, H - 0.3, D - 0.01), (0.2, 0.055, 0.04), bevel=0.03)
    p.layer('lift', base=0xf3e6d0)
    p.box((0, 0.075, 0), (W - t - 0.01, 0.015, D - t - 0.01), bevel=0.01)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 1, 0))
    p.extras.update(argMode='tint', argDefault=0xff5a5a)
    done(p, 0.02)


def tray():
    """the tidy tray inside the cupboard (cart-local coordinates: floor top y 1.06, groove for lids at z 0.73)"""
    p = PZ('prop_pz_tray', base=0x5fb0e8)
    p.box((2.83, 1.03, 0.6), (0.73, 0.03, 0.46), bevel=0.02)
    p.box((2.83, 1.1, 1.03), (0.73, 0.06, 0.03), bevel=0.02)
    p.box((3.53, 1.1, 0.6), (0.03, 0.06, 0.46), bevel=0.02)
    p.box((2.12, 1.1, 0.6), (0.03, 0.06, 0.46), bevel=0.02)
    for z in (0.66, 0.8):
        p.box((2.83, 1.085, z), (0.68, 0.025, 0.018), bevel=0.012)
    p.paint_fn(lambda q, n: q.y < 1.065 and n.y > 0.8, 0xc8e6fa)
    p.bone('body', (2.83, 1.0, 0.6), (2.83, 1.3, 0.6))
    done(p, 0.02)


def cup():
    p = PZ('prop_pz_cup', base=WHITE)
    H, R0, R1 = 0.86, 0.5, 0.44
    prof = rounded([(R0 - 0.06, 0.0), (R0, 0.0), (R1, H - 0.08), (R1 - 0.1, H), (0, H + 0.01), (0, H - 0.05), (R1 - 0.13, H - 0.06), (R1 - 0.05, H - 0.12), (R0 - 0.06, 0.03)], 0.035, n=3)
    p.lathe(prof, scale=(1.0, 0.6), seg=48, closed=True)
    p.paint_fn(lambda q, n: q.y < 0.08, 0xe6dccd)
    p.layer('knob', base=0xffd23f)
    p.lathe([(0, 0), (0.05, 0), (0.05, 0.06), (0.1, 0.09), (0.11, 0.13), (0.08, 0.17), (0, 0.18)], pos=(0, H - 0.02, 0), seg=24)
    # the sleeve on the cup's back that rides up and down the post
    p.layer('arm', base=WOOD)
    p.box((0, 0.1, -0.38), (0.085, 0.09, 0.1), bevel=0.025)
    p.box((0, 0.1, -0.29), (0.06, 0.06, 0.03), bevel=0.015)
    p.layer('post', base=WOOD_D)
    p.box((0, 0.55, -0.42), (0.032, 0.53, 0.032), bevel=0.012)
    p.lathe([(0, 0), (0.06, 0), (0.06, 0.04), (0.03, 0.07), (0, 0.075)], pos=(0, 1.07, -0.42), seg=16)
    p.box((0, 0.015, -0.42), (0.12, 0.015, 0.08), bevel=0.01)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 1, 0))
    p.extras.update(argMode='tint', argDefault=0x7fc8ff)
    done(p, 0.02)


def case():
    p = PZ('prop_pz_case', base=WOOD)
    W, H, D = 1.05, 1.35, 0.3
    p.box((0, 0.04, 0), (W, 0.04, D), bevel=0.02)                                 # base
    for x in (-W + 0.05, W - 0.05):
        p.box((x, H / 2, 0.1), (0.05, H / 2, D - 0.1), bevel=0.02)                 # side posts
        p.box((x, H / 2, D - 0.03), (0.06, H / 2 + 0.02, 0.035), bevel=0.015)       # pane grooves
    p.box((0, H - 0.04, -0.05), (W, 0.04, D - 0.25), bevel=0.02)                  # back header
    p.box((0, H / 2, -D + 0.03), (W - 0.1, H / 2 - 0.05, 0.02), bevel=0.01)        # back panel
    # pulley arm out over slot D, two pulleys
    p.box((W + 0.2, H + 0.0, 0.25), (0.3, 0.035, 0.035), bevel=0.012)
    p.box((W - 0.05, H - 0.1, 0.25), (0.04, 0.12, 0.035), bevel=0.012)
    for x in (W - 0.04, W + 0.45):
        p.ring((x, H + 0.0, 0.33), 0.07, 0.025, rot=(90, 0, 0), seg=18, rseg=6)
    p.paint_fn(lambda q, n: q.x > W - 0.1 and q.y > H - 0.12, 0xff6a4d)
    p.paint_fn(lambda q, n: q.z < -D + 0.06 and abs(q.x) < W - 0.1, 0xf6e7cf)
    p.layer('glass', base=0xe8f6ff)
    p.box((0, H / 2, D - 0.03), (W - 0.1, H / 2 - 0.04, 0.012), bevel=0.006)
    p.layer('ring', base=0xff4a3a)
    p.ring((0, 0, 0), 0.15, 0.045, rot=(90, 0, 0), seg=32, rseg=10)
    p.tube([(0, 0.15, 0), (0, 0.24, 0)], 0.03, rseg=8)
    p.layer('cord', base=0xfff6e6)
    p.tube([(0, 0.0, 0), (0, -1.0, 0)], 0.016, rseg=6)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 1, 0))
    done(p, 0.02)


def lockbox(name='prop_pz_lockbox', W=0.78, H=1.52, D=0.33):
    """glass-front lock box (origin: bottom centre; x +-W, y 0..H, z +-D): floor, back, sides and a top that stops short
    of the front so the glass front ('door' frame + 'doorglass', z D-0.08..D-0.02) slides UP out of it. A big padlock
    lies on its side at the right ('lock', centred at its origin: body x +-0.28, y +-0.35, keyhole on its +x face;
    'shackle' loops out to x -0.66): the game hangs it at (W + 0.36, H / 2, D + 0.08)."""
    p = PZ(name, base=0x6aa3e0)
    t = 0.07
    p.box((0, 0.03, 0), (W, 0.03, D), bevel=0.02)
    p.box((0, H / 2, -D + 0.03), (W, H / 2, 0.03), bevel=0.02)
    for sx in (-1, 1):
        p.box((sx * (W - t / 2), H / 2, 0), (t / 2, H / 2, D), bevel=0.025)
    p.box((0, H - 0.04, -0.06), (W, 0.04, D - 0.06 - 0.06), bevel=0.02)
    p.box((0, H - 0.03, D - 0.02), (W, 0.03, 0.02), bevel=0.012)                # a thin front lip over the slot
    p.paint_fn(lambda q, n: abs(q.x) < W - t + 0.002 and q.z > -D + 0.059 and 0.059 < q.y < H - 0.079, 0xdcecff)
    p.layer('door', base=0xffb43d)
    zc = D - 0.05
    for y in (0.1, H - 0.1):
        p.box((0, y, zc), (W - t - 0.004, 0.045, 0.025), bevel=0.015)
    for sx in (-1, 1):
        p.box((sx * (W - t - 0.05), H / 2, zc), (0.045, H / 2 - 0.06, 0.025), bevel=0.015)
    p.layer('doorglass', base=0xe8f6ff)
    p.box((0, H / 2, zc), (W - t - 0.06, H / 2 - 0.1, 0.008), bevel=0.004)
    p.layer('lock', base=0xffc93b)
    p.box((0, 0, 0), (0.28, 0.35, 0.12), bevel=0.1)
    p.paint_fn(lambda q, n: n.x > 0.8 and (math.hypot(q.y - 0.04, q.z) < 0.06 or (abs(q.z) < 0.025 and -0.12 < q.y < 0.04)), 0x3a2838)
    p.paint_fn(lambda q, n: n.z > 0.8 and q.x < -0.05 and q.y > 0.08, 0xffe39a)
    p.layer('shackle', base=0xc9d2dc)
    R, xl = 0.2, -0.45
    pts = [(-0.2, R, 0), (xl, R, 0)]
    for k in range(1, 12):
        a = math.pi / 2 + math.pi * k / 12
        pts.append((xl + R * math.cos(a), R * math.sin(a), 0))
    pts += [(xl, -R, 0), (-0.2, -R, 0)]
    p.tube(pts, 0.06, rseg=10)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 1, 0))
    done(p, 0.02)


def key():
    """a big toy key: bow ring centred at the origin (outer radius 0.4), the shaft along -x to x -0.98, two bit teeth
    hanging down near the tip. 0.22 thick."""
    p = PZ('prop_pz_key', base=0xffd23f)
    p.ring((0, 0, 0), 0.29, 0.11, rot=(90, 0, 0), seg=40, rseg=12)
    p.box((-0.42, 0, 0), (0.06, 0.1, 0.08), bevel=0.03)
    p.tube([(-0.38, 0, 0), (-0.98, 0, 0)], 0.07, rseg=12)
    p.box((-0.76, -0.14, 0), (0.05, 0.1, 0.05), bevel=0.02)
    p.box((-0.9, -0.17, 0), (0.05, 0.13, 0.05), bevel=0.02)
    p.paint_fn(lambda q, n: n.z > 0.6 and q.x > -0.05 and q.y > 0.12, 0xfff0a8)
    p.bone('body', (0, 0, 0), (-1, 0, 0))
    done(p, 0.02)


def hook():
    """a sturdy post (1.33 tall) with a straight red peg at y 1.25 sticking out toward the camera (z -0.02..0.36,
    a round knob at its end): the key's bow hangs on it and slides off forward. Layer 'rest': a block a key lying on
    its side rests its shaft on (top y 0.33; the bow stands on the floor 0.7 to its right)."""
    p = PZ('prop_pz_hook', base=WOOD_D)
    p.box((0, 0.04, 0), (0.2, 0.04, 0.2), bevel=0.025)
    p.lathe([(0, 0), (0.085, 0), (0.08, 1.3), (0.06, 1.34), (0, 1.35)], seg=20)
    p.layer('hook', base=0xff4a3a)
    p.tube([(0, 1.25, -0.02), (0, 1.25, 0.34)], 0.05, rseg=12)
    p.lathe([(0, 0), (0.085, 0), (0.09, 0.04), (0.07, 0.09), (0, 0.1)], pos=(0, 1.25, 0.32), rot=(90, 0, 0), seg=20)
    p.paint_fn(lambda q, n: n.y > 0.5 and q.z > 0.1, 0xff9a8a)
    p.layer('rest', base=WOOD)
    p.box((0, 0.165, 0), (0.07, 0.165, 0.12), bevel=0.025)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 1, 0))
    done(p, 0.018)


def ramp():
    """a chunky wooden gutter from x -2.15 (floor y 0.62) to x 1.95 at 8 degrees, channel z +-0.3 with 0.1 sides,
    a cradle dip at x 1.45, stout legs; layer 'tube' a clear tube (radius 0.5) round the ball at x -1.62."""
    p = PZ('prop_pz_ramp', base=WOOD)
    x0, x1, ytop = -2.15, 1.95, 0.62
    slope = math.tan(math.radians(8))
    yat = lambda x: ytop - (x - x0) * slope
    def floor_y(x):
        d = x - 1.45
        return yat(x) - 0.07 * max(0.0, 1 - (d / 0.4) ** 2)
    seg = 32
    fl = [(x0 + (x1 - x0) * i / seg, floor_y(x0 + (x1 - x0) * i / seg)) for i in range(seg + 1)]
    poly = fl + [(x1, floor_y(x1) - 0.1), (x0, floor_y(x0) - 0.1)]
    p.prism(poly[::-1] if area(poly) < 0 else poly, -0.36, 0.36, bevel=0.025)
    for side in (-1, 1):
        sp = [(x, y + 0.1) for x, y in fl] + [(x1, floor_y(x1) - 0.02), (x0, floor_y(x0) - 0.02)]
        z0, z1 = (0.3, 0.36) if side > 0 else (-0.36, -0.3)
        p.prism(sp[::-1] if area(sp) < 0 else sp, z0, z1, bevel=0.015)
    p.box((x0 + 0.05, yat(x0) + 0.14, 0), (0.05, 0.2, 0.36), bevel=0.02)
    p.box((x1 - 0.05, floor_y(x1) + 0.1, 0), (0.05, 0.14, 0.36), bevel=0.02)
    for x in (-1.85, -0.6, 0.6, 1.75):
        top = floor_y(x) - 0.1
        p.box((x, top / 2, 0), (0.09, top / 2, 0.22), bevel=0.02)
    p.paint_fn(lambda q, n: n.y > 0.8 and abs(q.z) < 0.29 and q.y > 0.1, 0xf6dfb6)
    p.paint_fn(lambda q, n: q.y < floor_y(min(max(q.x, x0), x1)) - 0.11, WOOD_D)
    p.layer('tube', base=0xe8f6ff)
    bx = -1.62
    p.lathe([(0.47, -0.5), (0.5, -0.5), (0.5, 0.5), (0.47, 0.5)], pos=(bx, floor_y(bx) + 0.45, 0), rot=(0, 0, 90), seg=40, closed=True)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 1, 0))
    done(p, 0.02)


def peg():
    """a fat toy peg (origin at its bottom centre): a stem (radius 0.12) and a round red mushroom head 0.62 across,
    1.09 tall."""
    p = PZ('prop_pz_peg', base=0xff4a3a)
    p.lathe(rounded([(0, 0), (0.12, 0), (0.12, 0.6), (0.2, 0.65), (0.29, 0.73), (0.31, 0.84), (0.27, 0.97), (0.16, 1.06), (0, 1.09)], 0.03, n=3), seg=32)
    p.paint_fn(lambda q, n: q.y > 0.75 and n.z > 0.45 and q.x < 0 and n.y > 0.1, 0xff9a8a)
    p.paint_fn(lambda q, n: q.y < 0.62, 0xe8402f)
    p.bone('body', (0, 0, 0), (0, 1.0, 0))
    done(p, 0.018)




L = compute_layout()
if os.environ.get('LAYOUT_ONLY'):
    sys.exit(0)
MODELS = dict(prop_pz_board1=lambda: board(1, L), prop_pz_board2=lambda: board(2, L), prop_pz_board3=lambda: board(3, L),
              prop_pz_tray=tray, prop_pz_stand=stand, prop_pz_lid=lid, prop_pz_plug=plug, prop_pz_box=box,
              prop_pz_cup=cup, prop_pz_case=case, prop_pz_lockbox=lockbox, prop_pz_lockbox2=lambda: lockbox('prop_pz_lockbox2', 0.92, 1.12, 0.33), prop_pz_key=key, prop_pz_hook=hook, prop_pz_ramp=ramp, prop_pz_peg=peg)
for k in ('circle', 'square', 'triangle', 'rect', 'star', 'heart'):
    MODELS['prop_pz_' + k] = (lambda k=k: piece(k))
for name, fn in MODELS.items():
    if not ONLY or name in ONLY:
        fn()
