"""Shape house models (facades, windows, pieces, gags).
Facades are modelled in the theme group's space, centred on the wall's middle plane (the game puts the wrapper at
z = WALL_Z - 0.35 = -1.35); the wall's front face is at model z +0.3 (cottage) / +0.35 (train, castle).
  prop_m_cottage    cream cottage wall 9.4 x 4.6 + red roof (no chimney / door: separate, they move), doorway recess at x 0.
  prop_m_chimney    brick chimney 0.7 x 1.4, centred.            prop_m_door   wooden door 1.4 x 1.9 x 0.15, centred.
  prop_m_train      blue carriage + green engine (no wheels / funnel: separate).
  prop_m_funnel     the engine's funnel, centred (1.2 tall).     prop_m_wheel  a train wheel facing +z, radius 0.62.
  prop_m_castlewall stone wall with merlons and a gate arch (towers / flags / drawbridge separate).
  prop_m_tower      round stone tower on y 0 (5.6 tall) with a cone roof (layer 'roof', recoloured) and a pole.
  prop_m_flag       a pennant reaching +x from its pole edge (TINT).   prop_m_bridge  plank drawbridge, hinge at y 0.
  prop_m_lamp       a fairy-light bulb (TINT: grey when off, the lamp colour when lit).
  prop_m_win_<k>    a chunky window frame round shape k (circle / square / triangle / rect) at unit size (TINT).
  prop_m_flowerbox  a window flower box 1.7 x 0.36 x 0.5 (TINT = box), layer 'flowers'.
  prop_m_piece_<k>  a puffy toy shape piece (TINT), layers 'dots' (white spots) and 'gems' (white jewels).
  prop_m_partyhat, prop_m_crown, prop_m_bow, prop_m_glasses: the gags (bases at y 0 except glasses, centred).
ONLY=prop_m_cottage tools/blender/build.sh prop_meadow_shapes"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded, circle_poly, star_poly, rot_m

ONLY = [s for s in os.environ.get('ONLY', '').split(',') if s]
WHITE, INK, DARK = 0xffffff, 0x3a2838, 0x3a2f5b
TAU = math.tau


def slab(p, poly, z, thick, rot=(0, 0, 0), off=(0, 0, 0)):
    from mathutils import Vector
    M = rot_m(rot)
    m = len(poly)
    verts = []
    for d in (z - thick / 2, z + thick / 2):
        verts.append(tuple(M @ Vector((0, 0, d)) + Vector(off)))
        for x, y in poly:
            verts.append(tuple(M @ Vector((x, y, d)) + Vector(off)))
    faces = []
    k = m + 1
    for i in range(m):
        j = (i + 1) % m
        faces.append((0, 1 + j, 1 + i)); faces.append((k, k + 1 + i, k + 1 + j)); faces.append((1 + i, 1 + j, k + 1 + j, k + 1 + i))
    p.mesh(verts, faces)


def outline(kind, n=96):
    """the game's shape outlines (shapes-parts.js outline2D), dense"""
    if kind == 'circle':
        return [(0.68 * math.cos(TAU * i / n), 0.68 * math.sin(TAU * i / n)) for i in range(n)]
    if kind == 'square':
        pts = [(-0.62, -0.62), (0.62, -0.62), (0.62, 0.62), (-0.62, 0.62)]
    elif kind == 'rect':
        pts = [(-0.9, -0.45), (0.9, -0.45), (0.9, 0.45), (-0.9, 0.45)]
    else:
        h = 1.45
        pts = [(-0.84, -h / 3), (0.84, -h / 3), (0, 2 * h / 3)]
    return pts


def dense(pts, step=0.04):
    out = []
    for i in range(len(pts)):
        a, b = pts[i], pts[(i + 1) % len(pts)]
        L = math.hypot(b[0] - a[0], b[1] - a[1])
        k = max(1, int(L / step))
        for j in range(k):
            t = j / k
            out.append((a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t))
    return out


def inset(poly, d):
    """offset a convex CCW polygon inward by d (vertex normals averaged)"""
    n = len(poly)
    out = []
    for i in range(n):
        x0, y0 = poly[i - 1]; x1, y1 = poly[i]; x2, y2 = poly[(i + 1) % n]
        e1 = (x1 - x0, y1 - y0); e2 = (x2 - x1, y2 - y1)
        l1 = math.hypot(*e1) or 1; l2 = math.hypot(*e2) or 1
        n1 = (-e1[1] / l1, e1[0] / l1); n2 = (-e2[1] / l2, e2[0] / l2)   # inward for CCW
        nx, ny = n1[0] + n2[0], n1[1] + n2[1]
        l = math.hypot(nx, ny) or 1
        cosh = max(0.3, (n1[0] * nx + n1[1] * ny) / l)
        out.append((x1 + nx / l * d / cosh, y1 + ny / l * d / cosh))
    return out


def pillow(p, poly, depth, bevel, steps=5, z0=0.0):
    """a soft extrusion of a convex CCW polygon (rounded edge all round), centred on z0, facing +z"""
    rings = []
    for k in range(steps + 1):
        th = -math.pi / 2 + math.pi / 2 * k / steps
        rings.append((bevel * (1 - math.cos(th)), -(depth / 2 - bevel) + bevel * math.sin(th)))
    for k in range(steps + 1):
        th = math.pi / 2 * k / steps
        rings.append((bevel * (1 - math.cos(th)), (depth / 2 - bevel) + bevel * math.sin(th)))
    m = len(poly)
    verts, faces = [], []
    for ins, z in rings:
        ip = inset(poly, ins) if ins > 1e-6 else poly
        for x, y in ip:
            verts.append((x, y, z0 + z))
    R = len(rings)
    for r in range(R - 1):
        for i in range(m):
            j = (i + 1) % m
            faces.append((r * m + i, r * m + j, (r + 1) * m + j, (r + 1) * m + i))
    cb = len(verts); verts.append((sum(x for x, _ in poly) / m, sum(y for _, y in poly) / m, z0 - depth / 2))
    cf = len(verts); verts.append((sum(x for x, _ in poly) / m, sum(y for _, y in poly) / m, z0 + depth / 2))
    for i in range(m):
        j = (i + 1) % m
        faces.append((cb, j, i))
        faces.append((cf, (R - 1) * m + i, (R - 1) * m + j))
    p.mesh(verts, faces)


# ---------------- facades ----------------
def cottage():
    CREAM, CREAM_D, ROOF, ROOF_D, STONE = 0xfff1d6, 0xf0dcb6, 0xff6b5a, 0xe2523f, 0xd9cfc0
    p = Prop('prop_m_cottage', base=CREAM, target_faces=6000, voxel=0.035)
    p.box((0, 2.3, 0), (4.7, 2.3, 0.3), bevel=0.12)
    # a soft stone foot and wooden corner posts
    p.box((0, 0.22, 0.04), (4.82, 0.22, 0.34), bevel=0.1)
    for s in (-1, 1):
        p.box((s * 4.62, 2.3, 0.05), (0.16, 2.28, 0.33), bevel=0.06)
    p.paint_fn(lambda q, n: q.y < 0.44, STONE)
    p.paint_fn(lambda q, n: abs(q.x) > 4.45 and q.y >= 0.44, 0xc98a5a)
    # doorway recess frame (the door itself is a separate prop on its hinge)
    p.box((0, 0.9, 0.31), (0.84, 0.92, 0.03), bevel=0.02)
    p.paint_fn(lambda q, n: abs(q.x) < 0.72 and q.y < 1.72 and n.z > 0.5 and q.z > 0.3, DARK)
    p.paint_fn(lambda q, n: abs(q.x) < 0.86 and q.y < 1.84 and q.z > 0.31 and not (abs(q.x) < 0.72 and q.y < 1.72), 0xc98a5a)
    # a few painted climbing-rose dots near the corners
    for x, y in [(-4.2, 1.2), (-4.0, 1.6), (-4.25, 2.0), (4.15, 1.0), (4.3, 1.45), (4.05, 1.85)]:
        p.paint(None, (x, y, 0.3), (0.09, 0.09, 0.2), 0xff8fc0)
    p.layer('roof', base=ROOF, target_faces=3600, voxel=0.035)
    tri = [(-5.45, 0.0), (5.45, 0.0), (0.0, 2.45)]
    tri = [q[:2] for q in rounded(tri + [tri[0]], 0.25, n=4)[:-1]]
    slab(p, tri, -0.35, 1.3, off=(0, 4.55, 0))   # its front flush with the wall (things on the window frames never poke into it)
    # scalloped shingles painted in rows
    def shingle(q, n):
        return n.z > 0.5 and ((q.y - 4.55) % 0.45) < 0.09 and q.y > 4.75
    p.paint_fn(shingle, ROOF_D)
    p.paint_fn(lambda q, n: q.y < 4.7, ROOF_D)
    p.layer('skin')
    # a little round attic window in the gable
    p.layer('attic', base=0xfff1d6, target_faces=600, voxel=0.015)
    p.ring((0, 5.55, 0.31), 0.32, 0.07, rot=(90, 0, 0), seg=32, rseg=8)
    slab(p, circle_poly(0.3, 28), 0.29, 0.04, off=(0, 5.55, 0))
    p.paint_fn(lambda q, n: math.hypot(q.x, q.y - 5.55) < 0.27, 0x9ad8ff)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 7, 0))
    p.extras['outline'] = 0.035
    p.build()


def chimney():
    p = Prop('prop_m_chimney', base=0xd9594a, target_faces=1200, voxel=0.018)
    p.box((0, 0, 0), (0.33, 0.68, 0.33), bevel=0.05)
    p.box((0, 0.68, 0), (0.42, 0.1, 0.42), bevel=0.05)
    def brick(q, n):
        row = math.floor((q.y + 0.7) / 0.18)
        u = (q.x + q.z) / 0.28 + (0.5 if row % 2 else 0)
        return ((q.y + 0.7) % 0.18) < 0.025 or abs(u - round(u)) < 0.06
    p.paint_fn(lambda q, n: q.y < 0.56 and brick(q, n), 0xb84438)
    p.paint_fn(lambda q, n: q.y > 0.57, 0x9a8a8a)
    p.paint_fn(lambda q, n: q.y > 0.75 and math.hypot(q.x, q.z) < 0.28, 0x3a2f3a)
    p.bone('body', (0, -0.7, 0), (0, 0.8, 0))
    p.extras['outline'] = 0.024
    p.build()


def door():
    p = Prop('prop_m_door', base=0xa8743f, target_faces=1400, voxel=0.015)
    poly = [(-0.7, -0.85), (0.7, -0.85), (0.7, 0.5)] + [(0.7 * math.cos(a), 0.5 + 0.35 * math.sin(a)) for a in [math.pi * i / 10 for i in range(1, 10)]] + [(-0.7, 0.5)]
    pillow(p, dense(poly, 0.05), 0.16, 0.05)
    p.paint_fn(lambda q, n: abs(n.z) > 0.6 and abs(((q.x + 0.7) / 0.35) % 1) < 0.06, 0x8a5a2e)
    p.layer('iron', base=0x5a4a4a, target_faces=600, voxel=0.01)
    for y in (-0.5, 0.3):
        p.box((-0.3, y, 0.09), (0.36, 0.05, 0.02), bevel=0.015)
    p.blob((0.5, -0.05, 0.11), (0.07, 0.07, 0.05), group='knob')
    p.paint_fn(lambda q, n: q.x > 0.4, 0xffd23f)
    p.layer('skin')
    p.layer('win', base=0x9ad8ff, target_faces=300, voxel=0.01)
    slab(p, circle_poly(0.17, 20), 0.085, 0.03, off=(0, 0.42, 0))
    p.layer('skin')
    p.bone('body', (0, -0.85, 0), (0, 0.85, 0))
    p.extras['outline'] = 0.022
    p.build()


def train():
    BLUE, RED, YEL, DARKP, GREEN = 0x4a90ff, 0xff5a5a, 0xffd23f, 0x4a3a5a, 0x3bb273
    p = Prop('prop_m_train', base=BLUE, target_faces=6000, voxel=0.035)
    p.box((0, 3.05, 0), (4.7, 1.65, 0.35), bevel=0.15)
    p.paint_fn(lambda q, n: abs(q.y - 1.75) < 0.12, YEL)
    p.paint_fn(lambda q, n: abs(abs(q.x) - 4.55) < 0.06 and q.y > 1.5, 0x3a78e0)
    # rivets along the stripe
    for i in range(16):
        p.paint(None, (-4.3 + i * 0.57, 1.9, 0.36), (0.045, 0.045, 0.1), 0xffffff)
    p.layer('roof', base=RED, target_faces=1600, voxel=0.03)
    p.box((0, 4.9, 0), (5.0, 0.2, 0.65), bevel=0.12)
    p.layer('skin')
    p.layer('base', base=DARKP, target_faces=1200, voxel=0.03)
    p.box((0, 1.25, 0), (4.9, 0.2, 0.5), bevel=0.1)
    p.box((6.0, 1.25, 0), (1.9, 0.2, 0.5), bevel=0.1)
    p.blob((7.95, 0.9, 0), (0.25, 0.3, 0.5), group='buffer')
    p.layer('skin')
    p.layer('engine', base=GREEN, target_faces=3000, voxel=0.03)
    p.cyl((5.3, 2.35, 0), 1.05, 2.2, rot=(0, 0, -90), bevel=0.15, seg=32)
    p.box((5.2, 2.7, 0), (0.7, 1.3, 0.65), bevel=0.12)
    p.paint_fn(lambda q, n: abs(q.x - 6.0) < 0.06 or abs(q.x - 6.9) < 0.06, YEL)
    p.paint_fn(lambda q, n: abs(q.x - 5.2) < 0.4 and abs(q.y - 3.3) < 0.35 and n.z > 0.5, 0xcfefff)
    p.layer('skin')
    p.layer('cabroof', base=RED, target_faces=700, voxel=0.025)
    p.box((5.2, 4.1, 0), (0.85, 0.15, 0.75), bevel=0.1)
    p.layer('skin')
    p.layer('lamp', base=YEL, target_faces=400, voxel=0.015)
    p.blob((7.55, 2.35, 0), (0.12, 0.25, 0.25), group='l')
    p.paint_fn(lambda q, n: q.x > 7.62, 0xfff6c0)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 5, 0))
    p.extras['outline'] = 0.035
    p.build()


def funnel():
    p = Prop('prop_m_funnel', base=0x4a3a5a, target_faces=900, voxel=0.015)
    p.lathe(rounded([(0, -0.6), (0.3, -0.6), (0.3, 0.2), (0.48, 0.5), (0.5, 0.62), (0.4, 0.62), (0.36, 0.5), (0, 0.5)], 0.05, n=3), seg=32)
    p.paint_fn(lambda q, n: q.y > 0.4, 0xffd23f)
    p.paint_fn(lambda q, n: q.y > 0.55 and n.y > 0.5 and math.hypot(q.x, q.z) < 0.38, 0x2a2030)
    p.bone('body', (0, -0.6, 0), (0, 0.62, 0))
    p.extras['outline'] = 0.024
    p.build()


def wheel():
    p = Prop('prop_m_wheel', base=0x4a3a5a, target_faces=1000, voxel=0.016)
    p.lathe(rounded([(0, -0.13), (0.62, -0.13), (0.64, 0.0), (0.62, 0.13), (0, 0.13)], 0.06, n=3), rot=(90, 0, 0), seg=40)
    p.paint_fn(lambda q, n: math.hypot(q.x, q.y) < 0.5 and abs(n.z) > 0.6, 0x5c4c6c)
    p.layer('hub', base=0xff5a5a, target_faces=800, voxel=0.012)
    p.lathe(rounded([(0, 0.1), (0.3, 0.1), (0.3, 0.17), (0, 0.19)], 0.03, n=2), rot=(90, 0, 0), seg=28)
    p.box((0, 0, 0.16), (0.48, 0.06, 0.04), bevel=0.03)
    p.paint_fn(lambda q, n: abs(q.y) < 0.065 and abs(q.x) > 0.2, 0xffd23f)
    p.paint_fn(lambda q, n: math.hypot(q.x, q.y) < 0.08, 0xffd23f)
    p.layer('skin')
    p.bone('body', (0, -0.62, 0), (0, 0.62, 0))
    p.extras['outline'] = 0.022
    p.build()


def castlewall():
    STONE, STONE_D, STONE_L = 0xd8d2e6, 0xbdb4d0, 0xe8e3f2
    p = Prop('prop_m_castlewall', base=STONE, target_faces=6400, voxel=0.035)
    p.box((0, 2.3, 0), (4.7, 2.3, 0.35), bevel=0.1)
    p.target_faces = 9000
    for i in range(8):
        p.box((-4.35 + i * 1.243, 4.9, 0), (0.35, 0.32, 0.35), bevel=0.08)
    # stone blocks: staggered courses, darker joints
    def joint(q, n):
        row = math.floor(q.y / 0.55)
        u = q.x / 1.1 + (0.5 if row % 2 else 0)
        return (q.y % 0.55) < 0.07 or abs(u - round(u)) < 0.04
    p.paint_fn(lambda q, n: n.z > 0.5 and q.y < 4.55 and q.y > 0.1 and joint(q, n), 0xc9c1dc)
    p.paint_fn(lambda q, n: n.y > 0.7, STONE_L)
    # the gate arch (dark) behind the drawbridge
    p.paint_fn(lambda q, n: n.z > 0.5 and abs(q.x) < 0.92 and (q.y < 1.4 or math.hypot(q.x, q.y - 1.4) < 0.92), DARK)
    p.paint_fn(lambda q, n: n.z > 0.5 and abs(q.x) < 1.12 and (q.y < 1.4 or math.hypot(q.x, q.y - 1.4) < 1.12) and not (abs(q.x) < 0.92 and (q.y < 1.4 or math.hypot(q.x, q.y - 1.4) < 0.92)), STONE_D)
    p.bone('body', (0, 0, 0), (0, 5.3, 0))
    p.extras['outline'] = 0.035
    p.build()


def tower():
    STONE, STONE_D = 0xd8d2e6, 0xbdb4d0
    p = Prop('prop_m_tower', base=STONE, target_faces=4000, voxel=0.03)
    p.lathe(rounded([(0, 0), (1.15, 0), (1.05, 5.4), (1.2, 5.5), (1.2, 5.75), (0, 5.75)], 0.08, n=3), seg=40)
    def joint(q, n):
        row = math.floor(q.y / 0.55)
        u = math.atan2(q.x, q.z) / TAU * 12 + (0.5 if row % 2 else 0)
        return (q.y % 0.55) < 0.07 or abs(u - round(u)) < 0.045
    p.paint_fn(lambda q, n: q.y < 5.35 and q.y > 0.1 and joint(q, n), 0xc9c1dc)
    p.paint_fn(lambda q, n: abs(q.x) < 0.2 and abs(q.y - 4.35) < 0.42 and q.z > 0.5, DARK)
    p.layer('roof', base=WHITE, target_faces=1600, voxel=0.025)
    p.lathe(rounded([(0, 5.6), (1.38, 5.6), (1.3, 5.75), (0.08, 7.45), (0, 7.5)], 0.08, n=3), seg=40)
    p.paint_fn(lambda q, n: q.y < 5.82, 0xdadada)
    p.layer('skin')
    p.layer('pole', base=0x5a4a3a, target_faces=300, voxel=0.012)
    p.cyl((0, 7.3, 0), 0.05, 0.95, bevel=0.02, seg=10)
    p.blob((0, 8.27, 0), (0.08, 0.08, 0.08), group='ball')
    p.paint_fn(lambda q, n: q.y > 8.18, 0xffd23f)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 8.3, 0))
    p.extras['outline'] = 0.032
    p.build()


def flag():
    p = Prop('prop_m_flag', base=WHITE, target_faces=700, voxel=0.007)
    # a soft pennant from x 0 to 0.8 (a gentle wave in z)
    poly = [(0, 0.22), (0.8, 0.0), (0, -0.22)]
    poly = dense([q[:2] for q in rounded(poly + [poly[0]], 0.05, n=3)[:-1]], 0.03)
    verts, faces = [], []
    m = len(poly)
    for d in (-0.03, 0.03):
        verts.append((0.25, 0, d + 0.05 * math.sin(0.25 * 4)))
        for x, y in poly:
            verts.append((x, y, d + 0.05 * math.sin(x * 4)))
    k = m + 1
    for i in range(m):
        j = (i + 1) % m
        faces.append((0, 1 + j, 1 + i)); faces.append((k, k + 1 + i, k + 1 + j)); faces.append((1 + i, 1 + j, k + 1 + j, k + 1 + i))
    p.mesh(verts, faces)
    p.paint_fn(lambda q, n: q.x < 0.07, 0xdddddd)
    p.bone('body', (0, -0.22, 0), (0, 0.22, 0))
    p.extras.update(argMode='tint', argDefault=0xff8fc0, outline=0.016)
    p.build()


def bridge():
    WOOD, WOOD_D = 0xa8763e, 0x7c5428
    p = Prop('prop_m_bridge', base=WOOD, target_faces=1600, voxel=0.016)
    poly = [(-0.9, 0.0), (0.9, 0.0), (0.9, 1.5)] + [(0.9 * math.cos(a), 1.5 + 0.7 * math.sin(a)) for a in [math.pi * i / 10 for i in range(1, 10)]] + [(-0.9, 1.5)]
    pillow(p, dense(poly, 0.06), 0.16, 0.05)
    p.paint_fn(lambda q, n: abs(n.z) > 0.6 and abs(((q.x + 0.9) / 0.36) % 1) < 0.07, WOOD_D)
    p.layer('iron', base=0x5a5260, target_faces=900, voxel=0.012)
    for y in (0.45, 1.35):
        p.box((0, y, 0.09), (0.86, 0.06, 0.025), bevel=0.02)
        for x in (-0.6, 0, 0.6):
            p.blob((x, y, 0.12), (0.04, 0.04, 0.03), group='r%d%d' % (int(y * 10), int(x * 10)))
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 2.2, 0))
    p.extras['outline'] = 0.024
    p.build()


def lamp():
    p = Prop('prop_m_lamp', base=WHITE, target_faces=600, voxel=0.01)
    p.lathe(rounded([(0, -0.26), (0.12, -0.24), (0.2, -0.1), (0.2, 0.06), (0.12, 0.16), (0, 0.18)], 0.06, n=3), seg=24)
    p.layer('cap', base=0x8a8f9a, target_faces=300, voxel=0.008)
    p.lathe(rounded([(0, 0.14), (0.11, 0.14), (0.11, 0.28), (0, 0.3)], 0.02, n=2), seg=16)
    p.layer('skin')
    p.layer('shine', base=WHITE, target_faces=80, voxel=0.006)
    p.blob((-0.08, 0.0, 0.16), (0.025, 0.06, 0.01), rot=(0, -25, 0), group='sh')
    p.layer('skin')
    p.bone('body', (0, -0.26, 0), (0, 0.3, 0))
    p.extras.update(argMode='tint', argDefault=0x8a8fa0, outline=0.018)
    p.build()


# ---------------- windows ----------------
def window(kind):
    p = Prop('prop_m_win_' + kind, base=WHITE, target_faces=1800, voxel=0.012)
    poly = outline(kind)
    if kind != 'circle':
        poly = [q[:2] for q in rounded(poly + [poly[0]], 0.12 if kind != 'triangle' else 0.16, n=5)[:-1]]
        poly = dense(poly, 0.03)
    # a fat rounded frame tube on the line ~0.97 of the shape (the game shows it at 1.3x round a 1.12x hole)
    ring = [(x * 0.965, y * 0.965 + (0.02 if kind == 'triangle' else 0), 0.03) for x, y in poly]
    p.tube(ring, 0.085, closed=True, rseg=10)
    p.paint_fn(lambda q, n: n.z > 0.75, 0xffffff)
    p.paint_fn(lambda q, n: n.z <= 0.75 and n.y < -0.3, 0xdedede)
    p.bone('body', (0, -0.8, 0), (0, 0.8, 0))
    p.extras.update(argMode='tint', argDefault=0xf3d7a6, outline=0.018)
    p.build()


def flowerbox():
    p = Prop('prop_m_flowerbox', base=WHITE, target_faces=1400, voxel=0.014)
    p.box((0, 0, 0), (0.85, 0.18, 0.25), bevel=0.06)
    p.paint_fn(lambda q, n: n.z > 0.5 and abs(q.y) < 0.03, 0xd2d2d2)
    p.paint_fn(lambda q, n: n.y > 0.7, 0x8a5a3a)
    p.layer('flowers', base=0xff8fc0, target_faces=1600, voxel=0.01)
    cols = [0xff8fc0, 0xffd23f, 0xa77bff, 0xff5a5a]
    for i in range(4):
        cx, cy = -0.6 + i * 0.4, 0.27
        for k in range(5):
            a = k / 5 * TAU + 0.3
            p.blob((cx + 0.075 * math.cos(a), cy + 0.075 * math.sin(a), 0.06), (0.065, 0.065, 0.035), group='f%d' % i)
        p.paint(None, (cx, cy, 0.06), (0.16, 0.16, 0.12), cols[i])
        p.paint(None, (cx, cy, 0.1), (0.04, 0.04, 0.1), 0xffffff)
        p.capsule((cx, 0.17, 0.04), (cx, 0.24, 0.05), 0.022, group='st%d' % i)
        p.blob((cx + 0.08, 0.17, 0.08), (0.06, 0.02, 0.04), rot=(0, 0, 25), group='lf%d' % i)
    p.paint_fn(lambda q, n: q.y < 0.2, 0x58c45e)
    p.layer('skin')
    p.bone('body', (0, -0.18, 0), (0, 0.4, 0))
    p.extras.update(argMode='tint', argDefault=0xb5764a, outline=0.02)
    p.build()


# ---------------- pieces ----------------
SPOTS = {'triangle': [(-0.42, -0.3), (0.42, -0.3), (0, 0.6)], 'rect': [(-0.68, 0.26), (0.68, 0.26), (-0.68, -0.26), (0.68, -0.26)]}
GEMS = [(0.3, 0.3, 0.06), (-0.35, -0.2, 0.05), (0.38, -0.25, 0.04)]


def piece(kind):
    p = Prop('prop_m_piece_' + kind, base=WHITE, target_faces=1800, voxel=0.012)
    poly = outline(kind)
    if kind != 'circle':
        poly = [q[:2] for q in rounded(poly + [poly[0]], 0.1 if kind != 'triangle' else 0.13, n=5)[:-1]]
    pillow(p, dense(poly, 0.03), 0.36, 0.11, steps=6)
    p.paint_fn(lambda q, n: abs(n.z) < 0.6, 0xe4e4e4)
    p.layer('shine', base=WHITE, target_faces=120, voxel=0.006)
    hx, hy = (-0.2, 0.35) if kind == 'triangle' else (-0.32, 0.25)
    if kind == 'rect':
        hx = -0.55
    p.blob((hx, hy + 0.06, 0.185), (0.05, 0.08, 0.012), rot=(0, 0, -30), group='sh')
    p.layer('skin')
    p.layer('dots', base=WHITE, target_faces=700, voxel=0.006)
    for x, y in SPOTS.get(kind, [(-0.42, 0.42), (0.42, 0.42), (-0.42, -0.42), (0.42, -0.42)]):
        slab(p, circle_poly(0.09, 18), 0.185, 0.03, off=(x, y, 0))
    p.layer('skin')
    p.layer('gems', base=WHITE, target_faces=600, voxel=0.005)
    for x, y, r in GEMS:
        if kind == 'triangle':
            x, y = x * 0.6, y * 0.6 - 0.05
        slab(p, [(0, r * 1.3), (r, 0), (0, -r * 1.3), (-r, 0)], 0.19, 0.04, off=(x, y, 0))
    p.layer('skin')
    p.bone('body', (0, -0.7, 0), (0, 0.9, 0))
    p.extras.update(argMode='tint', argDefault=0xff5a5a, outline=0.022)
    p.build()


# ---------------- gags ----------------
def partyhat():
    p = Prop('prop_m_partyhat', base=0xff8fc0, target_faces=900, voxel=0.01)
    p.lathe(rounded([(0, 0), (0.28, 0), (0.29, 0.03), (0.03, 0.5), (0, 0.51)], 0.03, n=2), seg=28)
    p.paint_fn(lambda q, n: abs(((math.atan2(q.x, q.z) + 4) * 4 / TAU + q.y * 3) % 1 - 0.5) < 0.17, 0xffffff)
    p.layer('pom', base=0xffd23f, target_faces=300, voxel=0.008)
    p.blob((0, 0.53, 0), (0.08, 0.08, 0.08), group='p')
    p.ring((0, 0.03, 0), 0.28, 0.035, seg=28, rseg=6)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 0.6, 0))
    p.extras['outline'] = 0.016
    p.build()


def crown():
    GOLD = 0xffc93b
    p = Prop('prop_m_crown', base=GOLD, target_faces=1200, voxel=0.009)
    p.lathe([(0.23, 0.0), (0.29, 0.0), (0.29, 0.18), (0.23, 0.18)], seg=40, closed=True)
    for i in range(5):
        a = i / 5 * TAU
        p.capsule((0.26 * math.sin(a), 0.16, 0.26 * math.cos(a)), (0.27 * math.sin(a), 0.31, 0.27 * math.cos(a)), 0.045, group='s%d' % i, r2=0.03)
        p.blob((0.27 * math.sin(a), 0.34, 0.27 * math.cos(a)), (0.04, 0.04, 0.04), group='s%d' % i)
    p.paint_fn(lambda q, n: q.y < 0.04, 0xe0a020)
    p.layer('jewels', base=0xff5aa8, target_faces=500, voxel=0.007)
    for i, c in enumerate([0xff5aa8, 0x3bc6d9, 0x5ad97a, 0x9b6bd9, 0xff5a5a]):
        a = i / 5 * TAU
        cc = (0.295 * math.sin(a), 0.09, 0.295 * math.cos(a))
        p.blob(cc, (0.04, 0.04, 0.025), rot=(0, math.degrees(a), 0), group='j%d' % i)
        p.paint(None, cc, (0.06, 0.06, 0.06), c)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 0.38, 0))
    p.extras['outline'] = 0.014
    p.build()


def bow():
    p = Prop('prop_m_bow', base=0xff5a5a, target_faces=900, voxel=0.009)
    for s in (-1, 1):
        p.blob((s * 0.15, 0.03, 0), (0.15, 0.1, 0.06), rot=(0, 0, s * 15), group='w%d' % s)
        p.capsule((s * 0.04, -0.02, 0.0), (s * 0.12, -0.16, 0.02), 0.035, group='t%d' % s, r2=0.04)
    p.blob((0, 0.02, 0.01), (0.06, 0.07, 0.07), group='k')
    p.paint_fn(lambda q, n: abs(q.x) < 0.065 and q.y > -0.05, 0xe03f3f)
    p.bone('body', (0, -0.2, 0), (0, 0.15, 0))
    p.extras['outline'] = 0.014
    p.build()


def glasses():
    p = Prop('prop_m_glasses', base=0x3a2838, target_faces=900, voxel=0.007)
    for s in (-1, 1):
        p.ring((s * 0.18, 0, 0), 0.12, 0.03, rot=(90, 0, 0), seg=28, rseg=6)
        p.tube([(s * 0.3, 0.02, 0), (s * 0.33, 0.04, -0.12)], 0.022, rseg=5)
    p.tube([(-0.07, 0.02, 0), (0, 0.045, 0), (0.07, 0.02, 0)], 0.022, rseg=5)
    p.layer('lens', base=0xcfefff, target_faces=300, voxel=0.006)
    for s in (-1, 1):
        slab(p, circle_poly(0.105, 20), -0.005, 0.012, off=(s * 0.18, 0, 0))
    p.layer('skin')
    p.bone('body', (0, -0.15, 0), (0, 0.15, 0))
    p.extras['outline'] = 0.012
    p.build()


MODELS = dict(prop_m_cottage=cottage, prop_m_chimney=chimney, prop_m_door=door, prop_m_train=train, prop_m_funnel=funnel, prop_m_wheel=wheel,
              prop_m_castlewall=castlewall, prop_m_tower=tower, prop_m_flag=flag, prop_m_bridge=bridge, prop_m_lamp=lamp,
              prop_m_flowerbox=flowerbox, prop_m_partyhat=partyhat, prop_m_crown=crown, prop_m_bow=bow, prop_m_glasses=glasses)
for k in ('circle', 'square', 'triangle', 'rect'):
    MODELS['prop_m_win_' + k] = (lambda k=k: window(k))
    MODELS['prop_m_piece_' + k] = (lambda k=k: piece(k))
for name, fn in MODELS.items():
    if not ONLY or name in ONLY:
        fn()
