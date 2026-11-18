"""Feelings stages and big set dressing (each stands on y = 0, flat top at y = 3.0 where Pip and the props stand).
  prop_m_hill       L1 picnic hill: a smooth grassy mound (top radius ~3.3, foot ~4.6) with a red-and-white checked
                  blanket on top (layer 'blanket', its top at y 3.0) that drapes over the front edge like real cloth.
  prop_m_playtable  L2 wooden play table 7.4 x 2.8 top at 3.0 (plank top), red apron with a row of bunting pennants
                  (layers 'band', 'bunting'), chunky coloured legs on yellow feet ('legs', 'feet').
  prop_m_rug        a round striped play rug (radius 6.2, scale it flat in z in game) with a soft coral rim.
  prop_m_stump      L3 big tree stump, top 3.0 (radius 3.0 cut face with growth rings, layer 'top'), bark ridges and
                  roots, round moss cushions (layer 'moss').
  prop_m_rings      stacking-rings toy (~1.1 tall).
Uses MProp and the clean-paint helpers from prop_meadow_shapes.py (raw geometry, plane cuts, face paint).
ONLY=prop_m_hill tools/blender/build.sh prop_meadow_stage"""
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'props'))
from kit import Prop, rounded
from prop_meadow_shapes import (MProp, soft_slab, lathe_at, insert_y, insert_r, fillet, rrect, circle_poly, dense)

ONLY = [s for s in os.environ.get('ONLY', '').split(',') if s]
TOP = 3.0
TAU = math.tau
GRASS, GRASS_D, GRASS_L = 0x7cc95c, 0x62b04a, 0x96dc72


# ---------------- picnic hill ----------------
HILL_TOP = TOP - 0.05      # the grass top; the blanket (0.05 thick) brings the stage to TOP


def hill_profile():
    prof = [(0, 0), (4.55, 0), (4.3, 0.6), (3.85, 1.8), (3.45, 2.6), (3.3, HILL_TOP), (0, HILL_TOP)]
    return [q[:2] for q in rounded(prof, 0.35, n=5)]


def hill_path(step=0.02):
    """the hill's surface from the top centre outward and down: [(s, r, y, nr, ny)], s = arc length"""
    prof = hill_profile()[::-1]          # (0, top) ... (4.55, 0) ... (0, 0)
    pts = []
    for (r0, y0), (r1, y1) in zip(prof, prof[1:]):
        if r1 < r0 and y1 < 0.01:
            break                          # stop at the foot (the bottom disc isn't part of the surface)
        L = math.hypot(r1 - r0, y1 - y0)
        k = max(1, int(L / step))
        for j in range(k):
            t = j / k
            pts.append((r0 + (r1 - r0) * t, y0 + (y1 - y0) * t))
    out, s = [], 0.0
    for i, (r, y) in enumerate(pts):
        if i:
            s += math.hypot(r - pts[i - 1][0], y - pts[i - 1][1])
        a, b = pts[max(0, i - 1)], pts[min(len(pts) - 1, i + 1)]
        tr, ty = b[0] - a[0], b[1] - a[1]
        l = math.hypot(tr, ty) or 1
        out.append((s, r, y, -ty / l, tr / l))     # outward normal = tangent turned +90 degrees
    return out


def hill():
    p = MProp('prop_m_hill', base=GRASS).raw().facepaint()
    prof = insert_y(hill_profile(), [0.5])
    lathe_at(p, prof, [TAU * i / 72 for i in range(72)])
    p.paint_fn(lambda q, n: q.y > HILL_TOP - 0.3 and n.y > 0.8, GRASS_L)
    p.paint_fn(lambda q, n: q.y < 0.5, GRASS_D)
    # the blanket: a checked square laid on the top and wrapped over the rounded edge by arc length, so the front
    # and the corners hang down the slope like cloth (grid lines on the checks: perfectly clean squares)
    p.layer('blanket', base=0xffffff).raw().facepaint()
    path = hill_path()
    S = [q[0] for q in path]

    def at(s):
        import bisect
        i = min(max(1, bisect.bisect_left(S, s)), len(S) - 1)
        a, b = path[i - 1], path[i]
        t = 0.0 if b[0] == a[0] else max(0.0, min(1.0, (s - a[0]) / (b[0] - a[0])))
        return [a[k] + (b[k] - a[k]) * t for k in range(5)]

    def place(u, v, off):
        rho = math.hypot(u, v)
        dx, dz = (u / rho, v / rho) if rho > 1e-6 else (0.0, 1.0)
        _, r, y, nr, ny = at(rho)
        rr = r + off * nr
        return (dx * rr, y + off * ny, dz * rr)

    CELL, W, Z0, Z1, SUB = 0.6, 2.4, -1.0, 3.8, 3
    nu, nv = int(round(2 * W / CELL)) * SUB, int(round((Z1 - Z0) / CELL)) * SUB
    us = [-W + 2 * W * i / nu for i in range(nu + 1)]
    vs = [Z0 + (Z1 - Z0) * j / nv for j in range(nv + 1)]
    verts, faces = [], []
    T = {}
    B = {}
    for i, u in enumerate(us):
        for j, v in enumerate(vs):
            T[i, j] = len(verts); verts.append(place(u, v, 0.05))
            B[i, j] = len(verts); verts.append(place(u, v, 0.006))
    for i in range(nu):
        for j in range(nv):
            faces.append((T[i, j], T[i + 1, j], T[i + 1, j + 1], T[i, j + 1]))
            faces.append((B[i, j], B[i, j + 1], B[i + 1, j + 1], B[i + 1, j]))
    ring = [(i, 0) for i in range(nu)] + [(nu, j) for j in range(nv)] + [(i, nv) for i in range(nu, 0, -1)] + [(0, j) for j in range(nv, 0, -1)]
    for k in range(len(ring)):
        a, b = ring[k], ring[(k + 1) % len(ring)]
        faces.append((T[a], B[a], B[b], T[b]))
    p.mesh(verts, faces)
    mid = [(s, r + 0.028 * nr, y + 0.028 * ny) for s, r, y, nr, ny in path]

    def uv(q):
        rq = math.hypot(q.x, q.z)
        if q.y > HILL_TOP - 0.02 and rq < 2.8:
            return q.x, q.z
        s = min(mid, key=lambda m: (m[1] - rq) ** 2 + (m[2] - q.y) ** 2)[0]
        return (q.x / rq * s, q.z / rq * s) if rq > 1e-6 else (0.0, 0.0)

    def check(q, n):
        u, v = uv(q)
        return (math.floor(u / CELL + 1e-6) + math.floor((v - 0.2) / CELL + 1e-6)) % 2 == 0
    p.paint_fn(check, 0xff5a5a)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, TOP, 0))
    p.extras['outline'] = 0.035
    p.build()


# ---------------- play table ----------------
def playtable():
    WOOD, WOOD_D, WOOD_L, RED = 0xe8a95c, 0xc98a44, 0xf2b86e, 0xff6f61
    p = MProp('prop_m_playtable', base=WOOD).raw().facepaint()
    # a chunky top of four planks (horizontal soft slab: poly in x/z, depth in y)
    soft_slab(p, rrect(0, 0, 3.7, 1.4, 0.2, 5), TOP - 0.18, 0.36, 0.1, steps=3, flat=0.03, rot=(-90, 0, 0))
    GZ, GW = [-0.7, 0.0, 0.7], 0.02
    p.paint_fn(lambda q, n: (q.z < -0.7) or (0.0 < q.z < 0.7), WOOD_L)
    p.paint_fn(lambda q, n: n.y > 0.5 and any(abs(q.z - g) < GW for g in GZ), WOOD_D)
    for g in GZ:
        p.cut((0, 0, g), (0, 0, 1))
        for d in (-GW, GW):
            p.cut((0, 0, g + d), (0, 0, 1), lambda q, n: n.y > 0.5)
    # red apron under the top
    p.layer('band', base=RED).raw().facepaint()
    soft_slab(p, rrect(0, 0, 3.78, 1.48, 0.22, 5), TOP - 0.42, 0.2, 0.07, steps=2, flat=0.02, rot=(-90, 0, 0))
    # bunting: little rounded pennants hanging from the apron along the front and both ends
    p.layer('bunting', base=0xffd23f).raw().facepaint()
    BCOL = [0xffd23f, 0x4a90ff, 0x5fd068, 0xff8fc0]
    pen = fillet([(-0.17, 0.0), (0.0, -0.32), (0.17, 0.0)], 0.045, 4)
    yb = TOP - 0.46
    for i in range(17):
        x = -3.36 + i * 0.42
        soft_slab(p, pen, 1.505, 0.04, 0.012, steps=1, flat=0.006, back=False, off=(x, yb, 0))
    for sx in (-1, 1):
        for j in range(6):
            z = -1.05 + j * 0.42
            soft_slab(p, pen, 0.0, 0.04, 0.012, steps=1, flat=0.006, back=False, rot=(0, 90 * sx, 0), off=(sx * 3.805, yb, z))

    def pennant(q, n):
        if q.z > 1.4:
            return int(round((q.x + 3.36) / 0.42))
        return int(round((q.z + 1.05) / 0.42)) + (1 if q.x > 0 else 3)
    for k in range(1, 4):
        p.paint_fn((lambda k: lambda q, n: pennant(q, n) % 4 == k)(k), BCOL[k])
    # chunky legs (blue / green) standing on round yellow feet
    p.layer('legs', base=0x4a90ff).raw().facepaint()
    leg = [q[:2] for q in rounded([(0, 0.12), (0.27, 0.12), (0.235, TOP - 0.5), (0, TOP - 0.5)], 0.06, n=3)]
    for sx in (-1, 1):
        for sz in (-1, 1):
            lathe_at(p, leg, [TAU * i / 20 for i in range(20)], pos=(sx * 3.2, 0, sz * 1.08))
    p.paint_fn(lambda q, n: (q.x > 0) == (q.z > 0), 0x5fd068)
    p.layer('feet', base=0xffd23f).raw()
    foot = [q[:2] for q in rounded([(0, 0), (0.34, 0), (0.36, 0.1), (0.3, 0.24), (0, 0.27)], 0.08, n=3)]
    for sx in (-1, 1):
        for sz in (-1, 1):
            lathe_at(p, foot, [TAU * i / 24 for i in range(24)], pos=(sx * 3.2, 0, sz * 1.08))
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, TOP, 0))
    p.extras['outline'] = 0.032
    p.build()


# ---------------- rug ----------------
def rug():
    p = MProp('prop_m_rug', base=0xffd23f).raw().facepaint()
    cols = [0xffd23f, 0x4a90ff, 0xff8fc0, 0x5fd068, 0xffffff]
    RIM = 5.85
    radii = [6.0 - k * 1.2 for k in range(1, 5)]
    prof = [(0, 0.1)] + [(r, 0.1) for r in sorted(radii)] + [(RIM, 0.1)]
    prof += [q[:2] for q in rounded([(RIM, 0.1), (6.12, 0.13), (6.28, 0.07), (6.2, 0.0)], 0.05, n=3)][1:]
    prof += [(0, 0.0)]
    lathe_at(p, prof, [TAU * i / 120 for i in range(120)])

    def ring(k):
        return lambda q, n: math.hypot(q.x, q.z) < 6.0 - k * 1.2 - 1e-3
    for k in range(1, 5):
        p.paint_fn(ring(k), cols[k])
    p.paint_fn(lambda q, n: math.hypot(q.x, q.z) > RIM + 1e-3, 0xff6f61)
    p.bone('body', (0, 0, 0), (0, 0.1, 0))
    p.extras['outline'] = 0.02
    p.build()


# ---------------- tree stump ----------------
def stump():
    BARK, BARK_D, WOODF, RING, MOSS = 0x9a6a43, 0x7c5232, 0xe9c38f, 0xc89a64, 0x6fbf4f
    p = MProp('prop_m_stump', base=BARK, target_faces=6400, voxel=0.04).facepaint()
    prof = rounded([(0, 0), (3.75, 0), (3.4, 0.5), (3.15, 1.6), (3.1, TOP - 0.16), (3.0, TOP - 0.06), (0, TOP - 0.06)], 0.18, n=4)
    p.lathe(prof, seg=64)
    # bark ridges
    for i in range(16):
        a = i / 16 * TAU + 0.1
        ys = (0.25, 0.9, 1.6, 2.25, 2.75)
        rr = [3.18 + 0.3 * (1 - y / TOP) ** 2 for y in ys]
        rr[-1] -= 0.12                                   # the ridge melts back into the trunk at the top
        pts = [(r * math.sin(a), y, r * math.cos(a)) for r, y in zip(rr, ys)]
        p.tube(pts, [0.14, 0.13, 0.12, 0.1, 0.05], rseg=8)
    # roots
    ROOTS = [i / 6 * TAU + 0.35 for i in range(6)]
    for i, a in enumerate(ROOTS):
        p.capsule((3.3 * math.sin(a), 0.5, 3.3 * math.cos(a)), (4.3 * math.sin(a), 0.12, 4.3 * math.cos(a)), 0.32, group='r%d' % i, r2=0.16)
    # darker bark grooves: straight vertical bands, cut exactly along their edges (planes through the axis)
    E = [((k + 0.38) * TAU / 16 - 4, (k + 0.62) * TAU / 16 - 4) for k in range(16)]

    def groove(q, n):
        f = ((math.atan2(q.x, q.z) + 4) * 16 / TAU) % 1
        return q.y < TOP - 0.12 and 0.382 < f < 0.618
    p.paint_fn(groove, BARK_D)
    for k in range(8):
        for a in E[k]:
            p.cut((0, 0, 0), (math.cos(a), 0, -math.sin(a)), lambda q, n: q.y < TOP - 0.1)
    # the cut face: a disc with soft wobbly growth rings (its own shell, so it gets a clean inked rim)
    p.layer('top', base=WOODF).raw().facepaint()
    RINGS = [(0.75 * k + 0.3375, 0.75 * k + 0.4125) for k in range(4) if 0.75 * k + 0.4125 < 2.8]

    def wob(r):
        return 0.08 * math.sin(math.pi * min(r, 2.9) / 2.9)
    tprof = [(0, TOP)] + [(r, TOP) for ab in RINGS for r in ab] + [(2.88, TOP)]
    tprof += [q[:2] for q in rounded([(2.88, TOP), (3.02, TOP - 0.04), (3.02, TOP - 0.1), (2.9, TOP - 0.13)], 0.04, n=2)][1:] + [(0, TOP - 0.13)]
    lathe_at(p, tprof, [TAU * i / 96 for i in range(96)], rfn=lambda a, r, y: r + wob(r) * math.sin(3 * a))

    def ringpaint(q, n):
        if q.y < TOP - 0.02:
            return False
        a, rq = math.atan2(q.x, q.z), math.hypot(q.x, q.z)
        r = rq
        for _ in range(6):
            r = rq - wob(r) * math.sin(3 * a)
        return any(lo < r < hi for lo, hi in RINGS)
    p.paint_fn(ringpaint, RING)
    # round moss cushions on the roots and at the foot (soft clay blobs, not paint)
    p.layer('moss', base=MOSS, target_faces=2400, voxel=0.03)
    spots = []
    for i in (0, 5, 2):
        spots.append((ROOTS[i], 3.72, 0.56, 0.3, 0.2))
    for a in (ROOTS[0] - 0.5, ROOTS[5] + 0.48, ROOTS[2] + 0.5):
        spots.append((a, 3.52, 0.3, 0.36, 0.26))
    for k, (a, r, y, sz, h) in enumerate(spots):
        # three soft puffs per cushion: a big one with two smaller ones tucked beside it
        for j, (da, dr, dy, f) in enumerate([(0, 0, 0, 1.0), (0.1, 0.02, -0.06, 0.72), (-0.09, 0.03, -0.07, 0.66)]):
            aa = a + da
            p.blob(((r + dr) * math.sin(aa), y + dy, (r + dr) * math.cos(aa)), (sz * f, h * f, sz * f * 0.85), rot=(0, math.degrees(aa), 0), group='m%d' % k)
    p.paint_fn(lambda q, n: n.y > 0.75 and q.y > 0.0, 0x86d063)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, TOP, 0))
    p.extras['outline'] = 0.035
    p.build()


def rings():
    p = Prop('prop_m_rings', base=0xf2d16b, target_faces=2400, voxel=0.012)
    p.cyl((0, 0, 0), 0.42, 0.12, r2=0.4, bevel=0.05, seg=32)
    p.cyl((0, 0.1, 0), 0.07, 0.95, bevel=0.03, seg=12)
    p.blob((0, 1.08, 0), (0.12, 0.12, 0.12), group='knob')
    p.layer('stack', base=0xff5a5a, target_faces=2400, voxel=0.012)
    cols = [0xff5a5a, 0xff9f3f, 0xffd23f, 0x5fd068]
    for i in range(4):
        p.ring((0, 0.22 + i * 0.21, 0), 0.3 - i * 0.045, 0.11 - i * 0.008, seg=40, rseg=12)
    for i in range(1, 4):
        y0 = 0.22 + i * 0.21 - 0.105
        p.paint_fn(lambda q, n, y0=y0, c=cols[i]: q.y > y0, cols[i])
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 1.2, 0))
    p.extras['outline'] = 0.02
    p.build()


MODELS = dict(prop_m_hill=hill, prop_m_playtable=playtable, prop_m_rug=rug, prop_m_stump=stump, prop_m_rings=rings)
for name, fn in MODELS.items():
    if not ONLY or name in ONLY:
        fn()
