"""Snack chef foods (the kitchen in the Home world). One script, several models (ONLY=prop_k_cheese,... builds a subset):
  prop_k_cucumber  a baby cucumber lying along x (~0.9 long, r 0.2): bumpy dark-green skin with pale stripes, the +x end cut
                   off to show pale flesh with a ring of seeds.
  prop_k_broccoli  a floret: a pale green stalk (bottom at y 0) under a bumpy dark-green crown (~0.75 tall).
  prop_k_peapod    an open pea pod lying along x with three round peas showing on top (~0.85 long).
  prop_k_cheese    a wedge of cheese with holes (point toward -x, ~0.8 long, 0.42 tall), bottom at y 0.
  prop_k_cracker   a square cracker with scalloped edges and pricked holes (~0.62 wide, 0.12 thick), bottom at y 0.
  prop_k_milk      a little milk bottle (~0.95 tall): white milk, a blue cap, a blue label with a white drop.
  prop_k_yogurt    a pink yogurt pot (~0.55 tall), lid peeled back, strawberry yogurt swirl on top.
All foods have their bottom at y 0 (resting pose on a plate) and face +z. Outlines are thin (they are small)."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded, circle_poly

ONLY = [s for s in os.environ.get('ONLY', '').split(',') if s]
GREEN_D, GREEN, PALE_G, SEED = 0x2f8a3a, 0x4cae47, 0xcdeea0, 0xf5ffd8


def finish(p, h, outline=0.018):
    p.bone('body', (0, 0, 0), (0, h, 0))
    p.extras['outline'] = outline
    p.build()


# ---------------- vegetables ----------------
def cucumber():
    p = Prop('prop_k_cucumber', base=GREEN_D, target_faces=3200, voxel=0.008, smooth=3)
    L, R = 0.46, 0.2
    # the body: a slightly bent capsule along x, the +x end sliced flat
    prof = rounded([(0.0, -L), (0.09, -L + 0.01), (0.17, -L + 0.08), (R, -0.2), (R + 0.01, 0.1), (R, L - 0.02), (0.0, L - 0.02)], 0.05, n=4)
    # bumpy: a lathe along y, then laid along x (rot z -90 maps +y to +x)
    verts, faces = [], []
    SEG, NY = 40, 60
    def r_of(y):
        for (r0, y0), (r1, y1) in zip(prof, prof[1:]):
            if y0 <= y <= y1:
                return r0 + (r1 - r0) * (y - y0) / max(1e-6, y1 - y0)
        return 0.0
    ys = [prof[0][1] + (prof[-1][1] - prof[0][1]) * k / NY for k in range(NY + 1)]
    for y in ys[1:-1]:
        for i in range(SEG):
            a = math.tau * i / SEG
            r = r_of(y)
            # soft warts
            bump = 0.012 * max(0, math.cos(a * 7 + y * 9)) * max(0, math.cos(y * 26 + a * 2)) if y < L - 0.06 else 0
            r += bump * min(1, r / 0.1)
            bend = 0.04 * (y / L) ** 2
            verts.append((y, r * math.cos(a) + R + 0.02 - bend, r * math.sin(a)))
    nr = len(ys) - 2
    for k in range(nr - 1):
        for i in range(SEG):
            j = (i + 1) % SEG
            faces.append((k * SEG + i, (k + 1) * SEG + i, (k + 1) * SEG + j, k * SEG + j))
    b0 = len(verts); verts.append((ys[0], R + 0.02 - 0.04, 0))
    for i in range(SEG):
        j = (i + 1) % SEG
        faces.append((b0, j, i))
    # the +x cut face: flat concentric rings (no fan of slivers), one ring exactly on the flesh / skin border
    xc = ys[-1]
    cyc = R + 0.02 - 0.04 * (xc / L) ** 2
    last = (nr - 1) * SEG
    rr0 = math.hypot(verts[last][1] - cyc, verts[last][2])
    prev = [last + i for i in range(SEG)]
    for f in (0.97, (rr0 - 0.035) / rr0, 0.72, 0.56, 0.4, 0.24, 0.1):
        ring = []
        for i in range(SEG):
            a = math.tau * i / SEG
            ring.append(len(verts))
            verts.append((xc, cyc + rr0 * f * math.cos(a), rr0 * f * math.sin(a)))
        for i in range(SEG):
            j = (i + 1) % SEG
            faces.append((prev[i], ring[i], ring[j], prev[j]))
        prev = ring
    b1 = len(verts); verts.append((xc, cyc, 0))
    for i in range(SEG):
        j = (i + 1) % SEG
        faces.append((b1, prev[j], prev[i]))
    p.mesh(verts, faces)
    cy = R + 0.02
    # pale stripes down the skin
    p.paint_fn(lambda q, n: q.x < L - 0.05 and abs(math.sin(math.atan2(q.z, q.y - cy) * 4)) < 0.22 and abs(q.x) < L - 0.08, GREEN)
    # the cut face: pale flesh, a darker rim of skin left round it
    cut = lambda q, n: n.x > 0.75 and q.x > L - 0.1
    p.paint_fn(lambda q, n: cut(q, n) and math.hypot(q.y - (R + 0.02 - 0.04 * (q.x / L) ** 2), q.z) < R - 0.04, PALE_G)
    # seeds in a ring on the cut face (own layer: crisp little ovals)
    p.layer('seeds', base=SEED, target_faces=300, voxel=0.005)
    for k in range(6):
        a = k / 6 * math.tau + 0.3
        p.blob((L - 0.02, cy + 0.075 * math.cos(a), 0.075 * math.sin(a)), (0.012, 0.03, 0.017), rot=(math.degrees(a), 0, 0), group='s%d' % k)
    p.layer('skin')
    # a stubby stalk end on -x
    p.layer('stalk', base=0x6b8a2a, target_faces=200, voxel=0.006)
    p.capsule((-L - 0.0, cy - 0.03, 0), (-L - 0.07, cy - 0.01, 0), 0.03, group='st')
    p.layer('skin')
    finish(p, 0.45)


def broccoli():
    p = Prop('prop_k_broccoli', base=GREEN_D, target_faces=1800, voxel=0.011, smooth=2)
    # the crown: a cauliflower-like dome made of many small round florets (each its own group so they stay bumpy)
    import random
    rnd = random.Random(4)
    k = 0
    for ring, (rr, y, n, sz) in enumerate([(0.0, 0.7, 1, 0.13), (0.15, 0.66, 6, 0.11), (0.27, 0.56, 9, 0.105), (0.3, 0.44, 9, 0.09)]):
        for j in range(n):
            a = j / n * math.tau + ring * 0.4
            s_ = sz * rnd.uniform(0.9, 1.1)
            p.blob((rr * math.sin(a), y + rnd.uniform(-0.02, 0.02), rr * math.cos(a)), (s_, s_ * 0.9, s_), group='f%d' % k)
            k += 1
    p.blob((0, 0.52, 0), (0.25, 0.14, 0.25), group='core')
    p.paint_fn(lambda q, n: n.y < -0.35, 0x3f9a3a)
    p.paint_fn(lambda q, n: n.y > 0.75 and q.y > 0.74, 0x46a83c)
    # the stalk (own layer so it reads as a separate pale trunk with branches)
    p.layer('stalk', base=0xa6dc6a, target_faces=700, voxel=0.01)
    p.capsule((0, 0.05, 0), (0, 0.42, 0), 0.11, group='st', r2=0.085)
    p.blob((0, 0.05, 0), (0.12, 0.05, 0.12), group='st')
    for k in range(3):
        a = k / 3 * math.tau + 0.5
        p.capsule((0, 0.3, 0), (0.15 * math.sin(a), 0.45, 0.15 * math.cos(a)), 0.05, group='br%d' % k)
    p.paint_fn(lambda q, n: q.y < 0.07 and n.y < -0.5, 0x8cc456)
    p.layer('skin')
    finish(p, 0.75)


def peapod():
    p = Prop('prop_k_peapod', base=GREEN, target_faces=2400, voxel=0.007, smooth=3)
    # the pod: a smooth open boat (an ellipsoid hollowed out from the top), pinched to soft points at both ends
    p.blob((0, 0.13, 0), (0.44, 0.13, 0.16), group='pod', stiffness=2.4)
    for sx in (-1, 1):
        p.capsule((sx * 0.36, 0.15, 0), (sx * 0.5, 0.2, 0), 0.05, r2=0.016, group='pod')
    p.blob((0, 0.21, 0), (0.4, 0.13, 0.125), group='pod', negative=True, stiffness=2.4)
    # a curly stalk at the left end
    p.curve([(-0.5, 0.2, 0), (-0.56, 0.27, 0.0), (-0.52, 0.33, 0.02), (-0.46, 0.31, 0.03)], [0.022, 0.02, 0.018, 0.015], group='tip')
    p.paint_fn(lambda q, n: n.y > 0.35 and abs(q.z) < 0.13 and q.y < 0.2, 0x9ad97a)          # pale inside of the pod
    p.paint_fn(lambda q, n: q.y < 0.06, 0x3f9a3a)
    p.paint_fn(lambda q, n: q.x < -0.47, 0x3f8a32)
    p.layer('peas', base=0xa2ec72, target_faces=1400, voxel=0.006)
    PX = (-0.26, -0.09, 0.08, 0.25)
    for k, x in enumerate(PX):
        r = 0.09 - 0.01 * (k in (0, 3))
        p.blob((x, 0.17, 0), (r, r * 0.95, r), group='p%d' % k)
    p.paint_fn(lambda q, n: q.y < 0.12, 0x6cc24a)
    p.layer('shine', base=0xffffff, target_faces=160, voxel=0.005)
    for k, x in enumerate(PX):
        p.blob((x - 0.035, 0.235, 0.05), (0.024, 0.016, 0.011), rot=(-40, 0, 30), group='h%d' % k)
    p.layer('skin')
    finish(p, 0.3)


# ---------------- grain ----------------
def cracker():
    p = Prop('prop_k_cracker', base=0xf2c25e, target_faces=1300, voxel=0.008, smooth=2)
    S, H = 0.3, 0.11
    # scalloped square outline: walk round a rounded square, pushing the edge out in 4 soft bumps per side
    pts = []
    sq = rounded([(-S, -S), (S, -S), (S, S), (-S, S)], 0.05, n=4, closed=True)
    per = []
    for i in range(len(sq)):
        a0, a1 = sq[i], sq[(i + 1) % len(sq)]
        per.append(math.hypot(a1[0] - a0[0], a1[1] - a0[1]))
    tot = sum(per)
    N = 96
    for k in range(N):
        d = tot * k / N
        i = 0
        while d > per[i]:
            d -= per[i]; i += 1
        a0, a1 = sq[i], sq[(i + 1) % len(sq)]
        t = d / per[i]
        x, z = a0[0] + (a1[0] - a0[0]) * t, a0[1] + (a1[1] - a0[1]) * t
        r = math.hypot(x, z)
        w = 0.018 * (0.5 + 0.5 * math.cos(math.tau * 16 * k / N))
        pts.append((x + x / r * w, z + z / r * w))
    n = len(pts)
    verts = [(x, 0.0, z) for x, z in pts] + [(x, H, z) for x, z in pts]
    faces = [tuple(range(n - 1, -1, -1)), tuple(range(n, 2 * n))]
    for i in range(n):
        j = (i + 1) % n
        faces.append((i, j, n + j, n + i))
    p.mesh(verts, faces)
    # golden-brown baked edges, pricked holes on top (3 x 3)
    p.paint_fn(lambda q, n: abs(n.y) < 0.6, 0xd99a3c)
    for ix in (-1, 0, 1):
        for iz in (-1, 0, 1):
            p.paint_fn(lambda q, n, ix=ix, iz=iz: n.y > 0.6 and math.hypot(q.x - ix * 0.16, q.z - iz * 0.16) < 0.026, 0xb0742a)
    p.paint_fn(lambda q, n: n.y > 0.6 and max(abs(q.x), abs(q.z)) > 0.255, 0xe6ab4a)
    finish(p, H, 0.015)


# ---------------- dairy ----------------
def cheese():
    p = Prop('prop_k_cheese', base=0xffd94a, target_faces=1400, voxel=0.01, smooth=2)
    # a wedge: triangle in x-z (point toward -x), extruded up
    tri = rounded([(-0.42, 0.0), (0.36, -0.3), (0.36, 0.3)], 0.06, n=3, closed=True)
    H = 0.4
    n = len(tri)
    verts = [(x, 0.0, z) for x, z in tri] + [(x, H, z) for x, z in tri]
    faces = [tuple(range(n)), tuple(range(2 * n - 1, n - 1, -1))]
    for i in range(n):
        j = (i + 1) % n
        faces.append((i, n + i, n + j, j))
    p.mesh(verts, faces, bevel=0.04)
    p.paint_fn(lambda q, n: n.x > 0.7, 0xffe67a)        # the cut back face is paler (fresh cheese)
    # holes: round darker dents on every face (crisp)
    holes = [((0.1, 0.4, 0.0), 0.075), ((-0.18, 0.4, -0.02), 0.05), ((0.24, 0.4, 0.14), 0.045),
             ((0.36, 0.22, -0.12), 0.07), ((0.36, 0.12, 0.17), 0.05), ((0.36, 0.3, 0.12), 0.035),
             ((0.0, 0.2, 0.17), 0.065), ((-0.25, 0.27, 0.08), 0.04), ((0.2, 0.1, 0.24), 0.04),
             ((0.05, 0.25, -0.2), 0.06), ((-0.2, 0.12, -0.1), 0.045)]
    for (c, r) in holes:
        p.paint_fn(lambda q, n, c=c, r=r: math.dist((q.x, q.y, q.z), c) < r, 0xe8b628)
    finish(p, H, 0.018)


def milk():
    p = Prop('prop_k_milk', base=0xffffff, target_faces=1500, voxel=0.01, smooth=3)
    prof = rounded([(0, 0), (0.24, 0), (0.25, 0.08), (0.25, 0.5), (0.2, 0.62), (0.12, 0.72), (0.115, 0.8), (0, 0.8)], 0.05, n=4)
    p.lathe(prof, seg=40)
    p.paint_fn(lambda q, n: n.y < -0.6, 0xeef2f8)
    p.layer('cap', base=0x3f8cff, target_faces=400, voxel=0.008)
    p.cyl((0, 0.78, 0), 0.135, 0.12, bevel=0.035, seg=28)
    p.layer('label', base=0x5aa8ff, target_faces=500, voxel=0.007)
    p.lathe(rounded([(0.248, 0.16), (0.262, 0.16), (0.262, 0.42), (0.248, 0.42)], 0.01, n=2, closed=True), closed=True, seg=40)
    p.layer('drop', base=0xffffff, target_faces=200, voxel=0.005)
    # a drop: round bottom, pointed top
    pts = [(0.055 * math.sin(a), -0.05 * math.cos(a) * (1 if math.cos(a) > 0 else 1.9)) for a in [i / 20 * math.tau for i in range(20)]]
    p.sticker(pts, 0.29, lambda y: 0.262, thick=0.012, ang=0.0, lift=0.004)
    p.layer('skin')
    finish(p, 0.9, 0.018)


def yogurt():
    p = Prop('prop_k_yogurt', base=0xff9ec4, target_faces=1400, voxel=0.009, smooth=3)
    p.lathe(rounded([(0, 0), (0.2, 0), (0.26, 0.42), (0.28, 0.44), (0.0, 0.44)], 0.03, n=3), seg=40)
    p.paint_fn(lambda q, n: 0.13 < q.y < 0.3 and n.y < 0.3, 0xffffff)       # a white band round the middle
    p.paint_fn(lambda q, n: q.y > 0.42 and math.hypot(q.x, q.z) < 0.25 and n.y > 0.5, 0xffd6e6)  # yogurt inside
    # a strawberry printed on the band
    # a clean strawberry sticker on the band: a plump berry (wide shoulders, rounded point) and a green leafy cap
    p.layer('berry', base=0xff3b4e, target_faces=1200, voxel=0.003)
    r_of = lambda y: 0.2 + 0.06 * y / 0.42
    berry = []
    for i in range(36):
        a = i / 36 * math.tau
        x, y = math.sin(a), math.cos(a)
        w = 0.05 * (1.0 if y > -0.2 else 0.62 + 0.38 * (y + 1) / 0.8)
        berry.append((w * x, 0.052 * y))
    p.sticker(berry, 0.205, r_of, thick=0.012, lift=0.004)
    cap = []
    for i in range(10):
        a = math.pi * i / 5
        rr = 0.035 if i % 2 == 0 else 0.015
        cap.append((rr * math.sin(a), 0.012 * math.cos(a) + (0.0 if i % 2 else 0.006)))
    p.sticker(cap, 0.258, r_of, thick=0.012, lift=0.008)
    p.paint_fn(lambda q, n: q.y > 0.25, 0x4fae3e)
    p.layer('swirl', base=0xffffff, target_faces=400, voxel=0.007)
    p.blob((0, 0.47, 0), (0.15, 0.05, 0.15), group='sw')
    p.blob((0.02, 0.53, 0), (0.08, 0.05, 0.08), group='sw')
    p.blob((0.03, 0.57, 0.0), (0.03, 0.03, 0.03), group='sw')
    p.paint_fn(lambda q, n: q.y > 0.5, 0xffe3ee)
    p.layer('lid', base=0xf2f2f6, target_faces=300, voxel=0.007)
    # the peeled foil lid standing up at the back
    p.box((0.0, 0.56, -0.27), (0.2, 0.15, 0.012), rot=(-14, 0, 0), bevel=0.01)
    p.paint_fn(lambda q, n: q.z > -0.3 and math.hypot(q.x, q.y - 0.58) < 0.065, 0xff6fa8)
    p.layer('skin')
    finish(p, 0.6, 0.018)


MODELS = dict(prop_k_cucumber=cucumber, prop_k_broccoli=broccoli, prop_k_peapod=peapod, prop_k_cracker=cracker,
              prop_k_cheese=cheese, prop_k_milk=milk, prop_k_yogurt=yogurt)
for name, fn in MODELS.items():
    if not ONLY or name in ONLY:
        fn()
