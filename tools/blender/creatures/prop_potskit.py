"""Peekaboo pots kit (pots.js / pots-props.js), one model each. ONLY=prop_pots_bench,... builds a subset.
Game space (x right, y up, z toward the camera), origin on the ground unless noted.

  prop_pots_bench     the watching bench: a long chunky farm bench, seat top at y 1.45, 8.7 long (x +-4.35), 1.0 deep
                      (z +-0.5), two seat planks, four pairs of splayed legs, an apron and a low stretcher.
  prop_pots_pumpkin   a HOLLOW half-pumpkin cover: eight soft lobes, rim r ~1.03 on the ground, widest r 1.22 at y 0.6,
                      top dimple at y ~1.65, a cut rim with pale flesh inside; stalk, leaf and tendril on top (~2.05 tall).
  prop_pots_basket    an upside-down round market basket cover: open at the bottom (rim r 1.22 on the ground), base
                      (now the top) r 0.98 at y 1.75, slightly domed; woven wall, braided rims, no handles.
  prop_pots_bed       the garden bed (Level 1): a soil bed 17 x 7.9 (x +-8.5, z -4.0..3.9) whose soil top is at
                      y 0.025, framed by chunky timber boards (top y 0.36) with round-topped corner posts; soft clods.
  prop_pots_seedling  a little seedling ~0.5 across, 0.42 tall: two round seed leaves and a young leaf on a stem,
                      in a small soil mound.
  prop_pots_straw     straw bedding (Level 2): a soft irregular straw mat 15.4 x 7.6 (x +-7.7, z -4.0..3.6), top at
                      y 0.03, scalloped clumpy edge, straw tufts round the edges only (nothing under the covers).
  prop_pots_penfence  the pen's back fence (Level 2): round-topped posts every 2.2 from x -8.8 to 8.8 with two rails,
                      and a cross-braced gate between x 1.9 and 4.1. Origin = the middle of the fence line.
  prop_pots_veg       the vegetable patch (Level 3): soil 17 x 8.6 (x +-8.5, z -5.2..3.4... see VEG_*), soil top
                      y 0.025, a flat raked middle where the covers sit, two raised rounded ridges at the back (z -3.95,
                      -4.75) and one at the front (z 3.65, top y ~0.2) for the vegetables.
"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded, TAU

ONLY = [k for k in os.environ.get('ONLY', '').split(',') if k]
want = lambda n: not ONLY or n in ONLY

class Hard(Prop):
    """Hard-surface prop (as prop_bucket's Pail): pieces are joined as built, no voxel remesh, so boards stay flat and
    straight, rings truly round, and large flat grounds carry no remesh folds (which ink as stray lines)."""
    def _metaballs(self):
        import bpy
        objs = super()._metaballs()
        for ob in objs:
            for md in getattr(ob, 'modifiers', []):
                if md.type == 'BEVEL':
                    md.segments = 2          # chunky soft edges, a sensible triangle count
        prims = self.layers[self._cur].get('prims', [])
        for pr, ob in zip(prims, objs[len(objs) - len(prims):]):
            if pr[0] == 'mesh' and pr[3]:
                md = ob.modifiers.new('bev', 'BEVEL')
                md.width = pr[3]
                md.segments = 2
                md.limit_method = 'ANGLE'
                md.angle_limit = math.radians(30)
        return objs

    def _skin(self):
        import bpy, bmesh
        objs = self._metaballs()
        bpy.context.view_layer.update()
        dg = bpy.context.evaluated_depsgraph_get()
        meshes = []
        for ob in objs:
            me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
            mo = bpy.data.objects.new(ob.name + '_mesh', me)
            bpy.context.scene.collection.objects.link(mo)
            meshes.append(mo)
        for ob in objs:
            bpy.data.objects.remove(ob)
        bpy.ops.object.select_all(action='DESELECT')
        for m in meshes:
            m.select_set(True)
        bpy.context.view_layer.objects.active = meshes[0]
        if len(meshes) > 1:
            bpy.ops.object.join()
        skin = bpy.context.view_layer.objects.active
        skin.name = skin.data.name = self.kind if self._cur == 'skin' else self._cur
        bm = bmesh.new()
        bm.from_mesh(skin.data)
        bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)
        if self.subdiv:
            bmesh.ops.subdivide_edges(bm, edges=[e for e in bm.edges if e.calc_length() > self.subdiv], cuts=1, use_grid_fill=True)
        bmesh.ops.triangulate(bm, faces=bm.faces[:])
        bm.to_mesh(skin.data)
        bm.free()
        skin.data.update()
        for f in skin.data.polygons:
            f.use_smooth = True
        return skin
    subdiv = 0


WOOD, WOOD_D, WOOD_L, WOOD_E = 0xc98a50, 0x9a6234, 0xe0a86a, 0xf0c58e
SOIL, SOIL_D, SOIL_L = 0x8a5a3b, 0x74492e, 0x9e6c48
STRAW, STRAW_D, STRAW_L = 0xf0d27a, 0xd9b04a, 0xf8e3a0


# ------------------------------------------------------------------ the watching bench
def bench():
    """a long thick plank on three slatted farm crates"""
    TOP, L, D, TH = 1.45, 4.35, 0.53, 0.2
    CH = TOP - TH                      # crate height 1.25
    p = Hard('prop_pots_bench', base=WOOD)
    for z in (-0.265, 0.265):
        p.box((0, TOP - TH / 2, z), (L, TH / 2, 0.255), bevel=0.07)
    p.paint_fn(lambda q, n: abs(n.x) > 0.6, WOOD_E)                    # light end grain on the plank ends
    # crates: a dark box with chunky light slats round it and corner posts
    p.layer('crate', base=0x7a4a26)
    CX = (-3.3, 0.0, 3.3)
    CW, CD = 0.62, 0.5                 # half sizes
    for x in CX:
        p.box((x, CH / 2, 0), (CW - 0.04, CH / 2 - 0.01, CD - 0.04), bevel=0.04)
    p.layer('slats', base=WOOD_L)
    for x in CX:
        for k in range(3):
            y = 0.2 + k * 0.4
            p.box((x, y, CD - 0.01), (CW - 0.1, 0.15, 0.04), bevel=0.035)                # front slats (the back is never seen)
            for s in (-1, 1):
                p.box((x + s * (CW - 0.01), y, 0), (0.04, 0.15, CD - 0.1), bevel=0.035)  # side slats
        for sx in (-1, 1):
            for sz in (1,):
                p.box((x + sx * (CW - 0.04), CH / 2, sz * (CD - 0.04)), (0.09, CH / 2, 0.09), bevel=0.04)  # posts
    p.paint_fn(lambda q, n: n.y > 0.7, WOOD_E)
    p.layer('nails', base=0x5e5058)
    for x in CX:
        for z in (-0.265, 0.265):
            for dx in (-0.35, 0.35):
                p.cyl((x + dx, TOP - 0.01, z), 0.045, 0.025, bevel=0.012, seg=12)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, TOP, 0))
    p.extras['outline'] = 0.028
    p.build()


# ------------------------------------------------------------------ hollow half-pumpkin cover
def pumpkin():
    ORANGE, GROOVE, FLESH, CUT = 0xff8a1f, 0xe2701a, 0xffc46b, 0xffe39a
    YC, RX, RY = 0.6, 1.22, 1.12
    TOPY = YC + RY                     # 1.72 before the dimple
    p = Prop('prop_pots_pumpkin', base=ORANGE, target_faces=3600, voxel=0.014, smooth=3)
    NT, NV = 96, 34
    lobe = lambda th: 0.925 + 0.075 * math.sqrt(abs(math.cos(4 * th)))   # deep soft V grooves between 8 lobes

    def outer(v):                      # v: 0 at the rim (y 0) .. 1 at the pole
        y0 = -YC / RY
        s = y0 + (1 - y0) * v          # sin(phi) from the cut up to the top
        s = min(1.0, s)
        c = math.sqrt(max(0.0, 1 - s * s))
        r = RX * c
        y = YC + RY * s
        dimple = 0.13 * math.exp(-(r / 0.42) ** 2)  # the top sinks round the stalk
        return r, y - dimple
    V, F = [], []
    rows = []
    for j in range(NV):
        v = j / NV
        r, y = outer(v)
        fade = min(1.0, (1 - v) / 0.25)            # grooves fade out into the top dimple
        row = []
        for i in range(NT):
            th = TAU * i / NT
            rr = r * (1 - (1 - lobe(th)) * fade)
            row.append(len(V)); V.append((rr * math.sin(th), y, rr * math.cos(th)))
        rows.append(row)
    pole = len(V); V.append((0, outer(1.0)[1], 0))
    # inner wall: a smooth offset inside the deepest groove, 0.1 thick there
    irows = []
    for j in range(NV):
        v = j / NV
        r, y = outer(v)
        ri = max(0.0, r * 0.925 - 0.1)
        yi = y - 0.1 * (v ** 1.5) if j else y
        row = []
        for i in range(NT):
            th = TAU * i / NT
            row.append(len(V)); V.append((ri * math.sin(th), max(0.0, yi - (0.0 if j else 0.0)), ri * math.cos(th)))
        irows.append(row)
    ipole = len(V); V.append((0, outer(1.0)[1] - 0.12, 0))
    for j in range(NV - 1):
        for i in range(NT):
            i2 = (i + 1) % NT
            F.append((rows[j][i], rows[j][i2], rows[j + 1][i2], rows[j + 1][i]))
            F.append((irows[j][i], irows[j + 1][i], irows[j + 1][i2], irows[j][i2]))
    for i in range(NT):
        i2 = (i + 1) % NT
        F.append((rows[NV - 1][i], rows[NV - 1][i2], pole))
        F.append((irows[NV - 1][i], ipole, irows[NV - 1][i2]))
        F.append((rows[0][i], irows[0][i], irows[0][i2], rows[0][i2]))   # the cut rim
    p.mesh(V, F)

    def radius_at(y):
        # outer base radius (no lobes) at height y
        s = max(-1.0, min(1.0, (y - YC) / RY))
        return RX * math.sqrt(max(0.0, 1 - s * s))

    def is_inside(q, n):
        # the inner wall faces the axis or down; the top dimple faces up, so it is never "inside"
        r = math.hypot(q.x, q.z)
        radial = (n.x * q.x + n.z * q.z) / max(1e-6, r)
        deep = r < radius_at(q.y) * 0.925 - 0.03          # inside the deepest groove: only the inner wall is here
        return (q.y < 0.04 and n.y < -0.6) or (deep and (radial < -0.1 or n.y < -0.35))
    p.paint_fn(lambda q, n: (not is_inside(q, n)) and math.hypot(q.x, q.z) > 0.38 and
               abs((math.atan2(q.x, q.z) / (TAU / 8)) % 1 - 0.5) < 0.055, GROOVE)
    p.paint_fn(is_inside, FLESH)
    p.paint_fn(lambda q, n: q.y < 0.035 and n.y < -0.5, CUT)

    # stalk, leaf and curly tendril on top
    p.layer('stalk', base=0x6f8a32, target_faces=900, voxel=0.012)
    ty = outer(1.0)[1]
    p.curve([(0, ty - 0.05, 0), (0.0, ty + 0.15, 0.0), (0.06, ty + 0.3, 0.0), (0.16, ty + 0.36, 0.0)], [0.13, 0.11, 0.095, 0.09], group='stalk')
    p.blob((0, ty + 0.02, 0), (0.2, 0.07, 0.2), group='foot')
    p.paint_fn(lambda q, n: q.x > 0.15 and q.y > ty + 0.3 and n.x > 0.3, 0xb9c77a)
    p.layer('leaf', base=0x62bb4c, target_faces=700, voxel=0.012)
    p.blob((0.36, ty - 0.02, 0.26), (0.32, 0.045, 0.2), rot=(10, -35, -18), group='leaf')
    p.paint_fn(lambda q, n: abs((q.x - 0.36) * 0.57 - (q.z - 0.26) * 0.82) < 0.02 and n.y > 0, 0x4a9a3c)
    spiral = []
    for i in range(40):
        t = i / 39
        a = t * TAU * 1.6
        rr = 0.12 * (1 - t * 0.6)
        spiral.append((-0.14 - t * 0.28 + rr * math.cos(a), ty + 0.02 + 0.08 * t + rr * math.sin(a) * 0.6, 0.08 + rr * math.sin(a)))
    p.tube(spiral, 0.028, rseg=6)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 1.8, 0))
    p.extras['outline'] = 0.028
    p.build()


# ------------------------------------------------------------------ upside-down basket cover
def basket():
    """an upside-down round market basket: a woven wall (each row of weave gently rounded, a crisp checker of light and
    dark strands whose borders follow the mesh exactly), braided rims at the ground and round the top, a woven base on top"""
    WEAVE, WEAVE_L, INSIDE, BASE_L = 0xcf9550, 0xeec088, 0x8a5a30, 0xe2ae70
    RB, RT, H, T = 1.22, 0.98, 1.66, 0.09
    ROWS, COLS = 8, 24
    p = Hard('prop_pots_basket', base=WEAVE)
    wall_r = lambda y: RB + (RT - RB) * y / H
    Y0, Y1 = 0.13, H - 0.08
    rh = (Y1 - Y0) / ROWS
    # profile (r, y), starting on the axis inside the top, down the inside, out under the rim, up the woven outside
    prof = [(0, H - T + 0.06), (RT - T, H - T), (RB - T, 0.0), (RB, 0.0), (wall_r(Y0), Y0)]
    for k in range(ROWS):
        ya, yb = Y0 + k * rh, Y0 + (k + 1) * rh
        for t in (0.33, 0.67):
            y = ya + (yb - ya) * t
            prof.append((wall_r(y) + 0.035 * math.sin(math.pi * t), y))   # each row bulges a little: woven relief
        prof.append((wall_r(yb), yb))
    prof += [(RT, H - 0.02), (RT * 0.7, H + 0.05), (RT * 0.35, H + 0.08), (0, H + 0.09)]
    p.lathe(prof, seg=COLS * 2)

    def outside(q):
        return math.hypot(q.x, q.z) > wall_r(q.y) - 0.03 and Y0 - 0.005 < q.y < Y1 + 0.005

    def light(q, n):
        if not outside(q):
            return False
        a = (math.atan2(q.x, q.z) % TAU) / TAU * COLS
        row = int(math.floor((q.y - Y0) / rh))
        return (int(math.floor(a)) + row) % 2 == 0
    p.paint_fn(light, WEAVE_L)
    p.paint_fn(lambda q, n: q.y > H - 0.03 and n.y > 0.5 and int(math.hypot(q.x, q.z) / 0.2) % 2 == 1, BASE_L)
    p.paint_fn(lambda q, n: (not outside(q)) and q.y < H - 0.04 and math.hypot(q.x, q.z) < wall_r(q.y) - 0.03, INSIDE)
    # braided rims: at the ground and round the top edge
    p.layer('braid', base=0xb57c42)
    for (yy, rr, rad) in ((0.08, RB + 0.01, 0.09), (H - 0.03, RT + 0.01, 0.07)):
        for ph in (0, math.pi):
            pts = []
            for i in range(100):
                a = i / 100 * TAU
                r2 = rr + rad * 0.5 * math.cos(a * 20 + ph)
                pts.append((r2 * math.sin(a), yy + rad * 0.45 * math.sin(a * 20 + ph), r2 * math.cos(a)))
            p.tube(pts, rad * 0.72, closed=True, rseg=4)
    p.paint_fn(lambda q, n: n.y > 0.45, 0xd39a5c)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, H, 0))
    p.extras['outline'] = 0.026
    p.build()


# ------------------------------------------------------------------ Level 1: the garden bed
def bed():
    X0, X1, Z0, Z1, BT, TOPS = -8.5, 8.5, -4.0, 3.9, 0.24, 0.36
    p = Hard('prop_pots_bed', base=SOIL)
    p.box(((X0 + X1) / 2, 0.0, (Z0 + Z1) / 2), ((X1 - X0) / 2 - BT * 0.5, 0.025, (Z1 - Z0) / 2 - BT * 0.5), bevel=0.02)
    # a few soft clods where nothing walks (the far ends and the back corners)
    import random
    rnd = random.Random(7)
    p.layer('clods', base=SOIL_L)
    k = 0
    while k < 34:
        x, z = rnd.uniform(X0 + 0.5, X1 - 0.5), rnd.uniform(Z0 + 0.4, Z1 - 0.4)
        if -6.9 < x < 6.9 and z > -3.5:
            continue
        sz = rnd.uniform(0.08, 0.15)
        p.blob((x, 0.03, z), (sz * 1.4, sz * 0.5, sz), rot=(0, rnd.uniform(0, 180), 0), group='c%d' % k)
        k += 1
    # the timber frame: four chunky boards, mitred at the corners by round posts
    p.layer('timber', base=WOOD)
    zc, xc = (Z0 + Z1) / 2, (X0 + X1) / 2
    for z in (Z0, Z1):
        p.box((xc, TOPS / 2, z), ((X1 - X0) / 2 - 0.1, TOPS / 2, BT / 2), bevel=0.06)
    for x in (X0, X1):
        p.box((x, TOPS / 2, zc), (BT / 2, TOPS / 2, (Z1 - Z0) / 2 - 0.1), bevel=0.06)
    p.paint_fn(lambda q, n: n.y > 0.7, WOOD_L)
    p.layer('posts', base=WOOD_D)
    for x in (X0, X1):
        for z in (Z0, Z1):
            p.cyl((x, 0, z), 0.24, TOPS + 0.12, bevel=0.1, seg=28)
    for x in (-2.9, 3.1):
        for z in (Z0, Z1):
            p.box((x, TOPS / 2 + 0.02, z), (0.12, TOPS / 2 + 0.02, BT / 2 + 0.04), bevel=0.05)
    p.paint_fn(lambda q, n: n.y > 0.7, 0xb07a44)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 1, 0))
    p.extras['outline'] = 0.03
    p.build()


def seedling():
    p = Prop('prop_pots_seedling', base=SOIL, target_faces=500, voxel=0.008, smooth=3)
    p.blob((0, 0.0, 0), (0.2, 0.06, 0.17), group='mound')
    p.paint_fn(lambda q, n: q.y > 0.04, SOIL_L)
    p.layer('plant', base=0x5cc45a, target_faces=900, voxel=0.008)
    p.curve([(0, 0.02, 0), (0.0, 0.18, 0.0), (0.02, 0.3, 0.0)], [0.035, 0.03, 0.028], group='stem')
    for s in (-1, 1):
        p.blob((s * 0.15, 0.33, 0.0), (0.14, 0.035, 0.1), rot=(0, 0, s * -22), group='leaf%d' % s)
    p.blob((0.02, 0.4, 0.03), (0.06, 0.08, 0.025), rot=(15, 0, -10), group='bud')
    p.paint_fn(lambda q, n: n.y > 0.4 and q.y > 0.3 and abs(q.x) > 0.06 and abs(abs(q.x) * 0.38 - abs(q.z) * 0.0) < 0.06 and abs(q.z) < 0.015, 0x3f9a3c)
    p.paint_fn(lambda q, n: q.y > 0.36 and abs(q.x) < 0.07, 0x8fe07a)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 0.4, 0))
    p.extras['outline'] = 0.018
    p.build()


# ------------------------------------------------------------------ Level 2: straw bedding and the pen fence
def straw():
    import random
    rnd = random.Random(3)
    AX, AZ, CZ = 7.7, 3.8, -0.2
    p = Hard('prop_pots_straw', base=STRAW)
    shape = lambda a: 1 / ((abs(math.cos(a)) ** 4 + abs(math.sin(a)) ** 4) ** 0.25)
    # the mat: a flat slab with a soft wavy edge (no remesh: it stays perfectly flat)
    N = 120
    pts = []
    for i in range(N):
        a = TAU * i / N
        k = 1 + 0.025 * math.sin(a * 11) + 0.012 * math.sin(a * 27 + 1)
        r = shape(a) * k
        pts.append((AX * r * math.cos(a), CZ + AZ * r * math.sin(a)))
    V, F = [], []
    for y in (0.0, 0.03):
        V.append((0, y, CZ))
        for x, z in pts:
            V.append((x, y, z))
    m = N + 1
    for i in range(N):
        j = (i + 1) % N
        F.append((0, 1 + j, 1 + i)); F.append((m, m + 1 + i, m + 1 + j)); F.append((1 + i, 1 + j, m + 1 + j, m + 1 + i))
    p.mesh(V, F)
    # straw tufts: little fans of fat straws, round the edge and at the back only
    p.layer('tufts', base=STRAW_D)
    k = 0
    while k < 34:
        a = rnd.uniform(0, TAU)
        r = shape(a) * rnd.uniform(0.84, 0.95)
        x, z = AX * r * math.cos(a), CZ + AZ * r * math.sin(a)
        if -6.9 < x < 6.6 and z > -3.6:
            continue
        yaw = rnd.uniform(0, TAU)
        for b in range(5):
            ang = yaw + (b - 2) * 0.32
            L = rnd.uniform(0.32, 0.5)
            ex, ez = x + math.cos(ang) * L, z + math.sin(ang) * L
            sx, sz = x - math.cos(ang) * 0.1, z - math.sin(ang) * 0.1
            p.tube([(sx, 0.045, sz), ((sx + ex) / 2, 0.075 + 0.02 * b % 3, (sz + ez) / 2), (ex, 0.05, ez)], 0.028, rseg=6)
        k += 1
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 1, 0))
    p.extras['outline'] = 0.022
    p.build()


def penfence():
    POST_H, GX0, GX1 = 1.55, 1.9, 4.1
    p = Hard('prop_pots_penfence', base=WOOD)
    xs = [-8.8 + 2.2 * i for i in range(9)]
    for x in xs:
        p.box((x, (POST_H - 0.1) / 2, 0), (0.14, (POST_H - 0.1) / 2, 0.14), bevel=0.05)
        p.cyl((x, POST_H - 0.16, 0), 0.155, 0.16, r2=0.06, bevel=0.05, seg=20)
    p.paint_fn(lambda q, n: q.y > POST_H - 0.17, WOOD_L)
    p.layer('rails', base=WOOD_L)
    for y in (0.55, 1.1):
        p.box(((-8.8 + GX0) / 2, y, 0.19), ((GX0 + 8.8) / 2, 0.08, 0.05), bevel=0.035)
        p.box(((GX1 + 8.8) / 2, y, 0.19), ((8.8 - GX1) / 2, 0.08, 0.05), bevel=0.035)
    # the gate: a frame with a cross brace and two dark hinges
    p.layer('gate', base=0xeec894)
    gx0, gx1, gy0, gy1 = GX0 + 0.2, GX1 - 0.2, 0.22, 1.3
    for y in (gy0, (gy0 + gy1) / 2, gy1):
        p.box(((gx0 + gx1) / 2, y, 0.2), ((gx1 - gx0) / 2, 0.075, 0.05), bevel=0.03)
    for x in (gx0, gx1):
        p.box((x, (gy0 + gy1) / 2, 0.2), (0.075, (gy1 - gy0) / 2 + 0.075, 0.05), bevel=0.03)
    p.tube([(gx0 + 0.08, gy0 + 0.08, 0.27), (gx1 - 0.08, gy1 - 0.08, 0.27)], 0.06, rseg=10)
    p.layer('hinge', base=0x4a3f48)
    for y in (0.42, 1.1):
        p.box((gx0 + 0.12, y, 0.27), (0.18, 0.045, 0.02), bevel=0.012)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, POST_H, 0))
    p.extras['outline'] = 0.026
    p.build()


# ------------------------------------------------------------------ Level 3: the vegetable patch
def veg():
    X0, X1, Z0, Z1 = -8.5, 8.5, -5.3, 4.7
    p = Hard('prop_pots_veg', base=SOIL)
    p.box(((X0 + X1) / 2, 0.0, (Z0 + Z1) / 2), ((X1 - X0) / 2, 0.025, (Z1 - Z0) / 2), bevel=0.02)
    # raised, rounded soil ridges (the planted rows): a mound profile swept along x, gently lumpy, rounded ends
    p.layer('ridges', base=SOIL_L)
    W, HR = 0.38, 0.2
    for zr in (-3.95, -4.75, 3.65):
        NX, NP = 70, 13
        V, F = [], []
        for i in range(NX + 1):
            x = X0 + 0.45 + (X1 - X0 - 0.9) * i / NX
            u = min(1.0, min(i, NX - i) / 3.0)
            end = math.sqrt(max(0.05, u)) if u < 1 else 1.0
            lump = 1 + 0.06 * math.sin(i * 1.9 + zr) + 0.04 * math.sin(i * 0.7)
            for j in range(NP):
                a = math.pi * j / (NP - 1)
                V.append((x, 0.0 + math.sin(a) * HR * end * lump, zr + math.cos(a) * W * (0.6 + 0.4 * end)))
        for i in range(NX):
            for j in range(NP - 1):
                F.append((i * NP + j, i * NP + j + 1, (i + 1) * NP + j + 1, (i + 1) * NP + j))
        c0 = len(V); V.append((X0 + 0.45, 0, zr)); c1 = len(V); V.append((X1 - 0.45, 0, zr))
        for j in range(NP - 1):
            F.append((c0, j + 1, j)); F.append((c1, NX * NP + j, NX * NP + j + 1))
        p.mesh(V, F)
    p.paint_fn(lambda q, n: n.y > 0.9 and q.y > 0.15, 0xab7a54)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 1, 0))
    p.extras['outline'] = 0.026
    p.build()


for name, fn in (('prop_pots_bench', bench), ('prop_pots_pumpkin', pumpkin), ('prop_pots_basket', basket), ('prop_pots_bed', bed),
                 ('prop_pots_seedling', seedling), ('prop_pots_straw', straw), ('prop_pots_penfence', penfence), ('prop_pots_veg', veg)):
    if want(name):
        fn()
