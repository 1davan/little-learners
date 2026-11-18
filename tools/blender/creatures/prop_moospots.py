"""Who says moo? ground patches (sculpted, so no flat code discs are left on the farm spots).
ONLY=prop_farmpond tools/blender/build.sh prop_moospots builds a subset. Game space, origin on the ground at the centre.
  prop_farmpond    a little farm pond ~3.1 x 1.9: a soft raised grassy bank with a muddy inner lip, glossy inset water
                   (top at y 0.06, so an animal standing in it has its feet in the water), two glints, a modelled lily
                   pad with a pink flower and a few pebbles on the bank (layers skin, water, lily, flower, stones).
  prop_strawpatch  straw strewn on the ground ~2.7 x 1.6: a soft low straw mat with a wobbly edge and loose straws
                   lying on top (layers skin, straw). Top at about y 0.05.
  prop_strawbed    the same straw, long: 9.0 x 1.15 (the farm chorus stands on it by the fence). Top about y 0.06.
"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop

ONLY = [k for k in os.environ.get('ONLY', '').split(',') if k]
want = lambda n: not ONLY or n in ONLY
TAU = math.tau


def wob(a, seed=0.0, amt=1.0):
    return 1 + amt * (0.07 * math.sin(a * 3 + 0.5 + seed) + 0.045 * math.sin(a * 5 + 2.0 + seed * 1.7) + 0.025 * math.sin(a * 8 + seed))


def ellipse_rings(RX, RZ, rings, N=48, seed=0.0, amt=1.0):
    """A dish-like mesh: rings = [(radius fraction, height)], outermost first, the last ring collapses to the centre.
    Returns (verts, faces) closed underneath with a flat bottom at y = 0."""
    verts, faces = [], []
    rows = []
    for f, h in rings:
        row = []
        for i in range(N):
            a = TAU * i / N
            r = wob(a, seed, amt)
            verts.append((RX * f * r * math.cos(a), h, RZ * f * r * math.sin(a)))
            row.append(len(verts) - 1)
        rows.append(row)
    c = len(verts); verts.append((0, rings[-1][1], 0))
    for k in range(len(rows) - 1):
        A, B = rows[k], rows[k + 1]
        for i in range(N):
            j = (i + 1) % N
            faces.append((A[i], A[j], B[j], B[i]))
    L = rows[-1]
    for i in range(N):
        faces.append((L[i], L[(i + 1) % N], c))
    # underside
    b = len(verts); verts.append((0, rings[0][1], 0))
    O = rows[0]
    for i in range(N):
        faces.append((O[(i + 1) % N], O[i], b))
    return verts, faces


def pond():
    RX, RZ = 1.55, 0.95
    BANK, BANK_L, LIP, WATER, WATER_L, WATER_D = 0x8fd06a, 0xa8e07e, 0x9c7a52, 0x56c4ee, 0x8fdcf6, 0x3fa9d9
    p = Prop('prop_farmpond', base=BANK, target_faces=1800, voxel=0.016, smooth=3)
    p.quadriflow = False
    PROF = [(1.08, -0.05), (1.065, 0.0), (1.04, 0.035), (1.0, 0.068), (0.96, 0.088), (0.925, 0.094), (0.89, 0.086),
            (0.865, 0.066), (0.845, 0.045), (0.82, 0.03), (0.75, 0.02), (0.55, 0.015), (0.3, 0.012), (0.0, 0.012)]
    v, f = ellipse_rings(RX, RZ, PROF, N=72, seed=0.3)
    p.mesh(v, f)
    rr = lambda q: math.hypot(q.x / RX, q.z / RZ)
    p.paint_fn(lambda q, n: rr(q) < 0.885, LIP)                       # the muddy inner lip just above the water
    p.paint_fn(lambda q, n: rr(q) >= 0.905 and rr(q) < 0.99, BANK_L)  # sunlit crest of the bank
    # inset water: a soft slab a little below the bank crest
    p.layer('water', base=WATER, target_faces=900, voxel=0.012)
    v, f = ellipse_rings(RX * 0.87, RZ * 0.87, [(1.0, 0.0), (0.97, 0.05), (0.9, 0.06), (0.6, 0.062), (0.0, 0.062)], N=72, seed=0.3)
    p.mesh(v, f)
    # two soft white glints floating on the water
    p.layer('shine', base=0xffffff, target_faces=200, voxel=0.008)
    p.blob((-0.62, 0.068, 0.36), (0.24, 0.014, 0.05), rot=(0, 18, 0), group='g1')
    p.blob((-0.27, 0.068, 0.46), (0.08, 0.014, 0.04), rot=(0, 18, 0), group='g2')
    # a lily pad with its notch, and a pink flower
    p.layer('lily', base=0x58b43a, target_faces=500, voxel=0.01)
    cx, cz, r = 0.92, 0.22, 0.27
    pts = [(cx + r * math.cos(math.radians(30 + i * 300 / 14)), cz + r * 0.8 * math.sin(math.radians(30 + i * 300 / 14))) for i in range(15)] + [(cx, cz)]
    top, bot = 0.085, 0.055
    vv = [(x, bot, z) for x, z in pts] + [(x, top, z) for x, z in pts]
    n = len(pts)
    ff = [tuple(range(n - 1, -1, -1)), tuple(range(n, 2 * n))] + [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)]
    p.mesh(vv, ff)
    p.paint_fn(lambda q, n_: abs(math.atan2(q.z - cz, q.x - cx)) < 2.4 and math.hypot(q.x - cx, (q.z - cz) / 0.8) < 0.17 and n_.y > 0.5, 0x6cc84a)
    p.layer('flower', base=0xff8fc0, target_faces=300, voxel=0.008)
    for i in range(5):
        a = TAU * i / 5
        p.blob((cx - 0.05 + 0.05 * math.cos(a), 0.12, cz + 0.04 + 0.05 * math.sin(a)), (0.055, 0.04, 0.055), group='pt%d' % i)
    p.blob((cx - 0.05, 0.15, cz + 0.04), (0.035, 0.03, 0.035), group='mid')
    p.paint_group('mid', 0xffd23f)
    # pebbles on the bank
    p.layer('stones', base=0xc8c2d6, target_faces=400, voxel=0.01)
    for i, (a, s) in enumerate([(2.35, 0.11), (2.6, 0.08), (4.4, 0.09), (5.9, 0.07)]):
        x, z = RX * 0.99 * math.cos(a), RZ * 0.99 * math.sin(a)
        p.blob((x, 0.07, z), (s * 1.2, s * 0.7, s), group='s%d' % i)
    p.paint_fn(lambda q, n_: n_.y > 0.7, 0xdcd7e6)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 0.3, 0))
    p.extras['outline'] = 0.014
    p.build()


def straw(kind, RX, RZ, nstraw, seed, rect=False):
    STRAW, STRAW_D, STRAW_L = 0xeccb6a, 0xd6ad48, 0xf7e08e
    p = Prop(kind, base=STRAW, target_faces=2600 if rect else 1800, voxel=0.014, smooth=3)
    p.quadriflow = False
    if rect:
        # a long rounded strip (superellipse), wobbly at the edge
        N = 96
        verts, faces = [], []
        def ring(f, h):
            row = []
            for i in range(N):
                a = TAU * i / N
                c, s = math.cos(a), math.sin(a)
                ex = 6.0
                x = RX * f * math.copysign(abs(c) ** (2 / ex), c)
                z = RZ * f * math.copysign(abs(s) ** (2 / ex), s) * (1 + 0.06 * math.sin(a * 13 + seed))
                verts.append((x, h, z)); row.append(len(verts) - 1)
            return row
        rows = [ring(1.01, -0.04), ring(0.997, 0.0), ring(0.985, 0.03), ring(0.95, 0.05)]
        c = len(verts); verts.append((0, 0.055, 0))
        for k in range(3):
            A, B = rows[k], rows[k + 1]
            for i in range(N):
                j = (i + 1) % N
                faces.append((A[i], A[j], B[j], B[i]))
        for i in range(N):
            faces.append((rows[3][i], rows[3][(i + 1) % N], c))
        b = len(verts); verts.append((0, -0.04, 0))
        for i in range(N):
            faces.append((rows[0][(i + 1) % N], rows[0][i], b))
        p.mesh(verts, faces)
    else:
        v, f = ellipse_rings(RX, RZ, [(1.02, -0.04), (1.0, 0.0), (0.975, 0.026), (0.93, 0.042), (0.85, 0.05), (0.5, 0.054), (0.0, 0.055)], N=64, seed=seed, amt=1.6)
        p.mesh(v, f)
    import random
    rnd = random.Random(int(seed * 100) + 7)
    # loose straws lying on top
    p.layer('straw', base=0xe0b24a, target_faces=1800 if rect else 1200, voxel=0.009)
    for i in range(nstraw):
        L = rnd.uniform(0.22, 0.42)
        a = rnd.uniform(0, math.pi)
        x, z = rnd.uniform(-RX * 0.86, RX * 0.86), rnd.uniform(-RZ * 0.7, RZ * 0.7)
        if not rect and (x / RX) ** 2 + (z / RZ) ** 2 > 0.62:
            continue
        dx, dz = math.cos(a) * L / 2, math.sin(a) * L / 2
        y = 0.058 + rnd.uniform(0, 0.012)
        p.tube([(x - dx, y, z - dz), (x, y + 0.012, z), (x + dx, y, z + dz)], 0.021, rseg=6)
    p.paint_fn(lambda q, n: (math.sin(q.x * 9.1 + q.z * 4.3) + math.sin(q.z * 11.7 - q.x * 2.9)) > 0.9, STRAW_L)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 0.2, 0))
    p.extras['outline'] = 0.012
    p.build()


if want('prop_farmpond'):
    pond()
if want('prop_strawpatch'):
    straw('prop_strawpatch', 1.35, 0.8, 34, 0.4)
if want('prop_strawbed'):
    straw('prop_strawbed', 4.5, 0.58, 90, 1.3, rect=True)
