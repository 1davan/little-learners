"""Block builder (World 5) models: chunky painted wooden toy blocks and the bits of the build corner.

Blocks (unit 1.0 = one cube; origin at the bottom centre, front = +z). Every block is painted WHITE where its paint
colour goes: the game swaps white for the block's colour per instance (blocks-pieces.js), and leaves the natural
wood details as they are.
  prop_blk_cube     1 x 1 x 1 painted cube
  prop_blk_cuboid   2 x 1 x 1 long block
  prop_blk_cyl      cylinder r 0.5 h 1, natural wood end grain (rings) on its two flat ends
  prop_blk_cone     cone r 0.5 h 1 with a soft round tip, wooden base
  prop_blk_roof     triangular prism 2 wide x 1 tall x 1 deep (a roof), wood end grain on its two gable ends' rims
  prop_blk_arch     2 x 1 x 1 with a half-round hole (r 0.5) underneath, the inside of the arch natural wood
  prop_blk_ball     ball r 0.5
Corner furniture:
  prop_blk_mat      the build mat: a wooden baseboard 6.4 x 3.2 with a blueprint-blue felt top (top at y 0.205) and a
                    white grid (layer 'grid'); felt tintable (layer 'felt' painted white)
  prop_blk_stand    round display stand for the model to copy: top at y 1.45, top radius 1.3
  prop_blk_tray     long low tray for loose blocks: 11.0 x 1.7, floor top at y 0.12, rim 0.34 tall
  prop_blk_box      open toy box 2.6 x 1.3 x 1.7 (inside floor at y 0.14) with shape stickers on the front
  prop_blk_ramp     wooden ramp 4.6 wide (x), 2.6 long (z), 1.8 high at the back (z -1.3) down to a 0.04 lip at the front (+1.3)

Blocks are bevelled primitives joined WITHOUT a voxel remesh (crisp toy edges, flat faces with hardened normals so
the toon ramp never bands across a face), painted per face (colour borders fall on real edges).
ONLY=prop_blk_cube tools/blender/build.sh prop_blocks"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
import bpy, bmesh
from mathutils import Vector, Matrix
from kit import Prop, rounded, rot_m, TAU
from lib import G, hexcol

ONLY = [s for s in os.environ.get('ONLY', '').split(',') if s]
WHITE = 0xffffff
WOOD, WOOD_L, WOOD_D, WOOD_R = 0xe8bf86, 0xf3d4a4, 0xc98f55, 0xd9a86c
FLOOR = 0xf8e4c0      # the tray's floor: a clearly paler wood than any sandpit
INV = Matrix(((1, 0, 0), (0, 0, 1), (0, -1, 0)))   # blender -> game
BEV = 0.085


class CrispProp(Prop):
    """Bevelled primitives joined as they are (no remesh), hard-normal flat faces, per-face paint rules."""

    def rule(self, fn, colour):
        self.layers[self._cur].setdefault('rules', []).append((fn, hexcol(colour)))

    def _metaballs(self):
        objs = []
        for pr in self.layers[self._cur].get('prims', []):
            if pr[0] == 'box':
                _, pos, size, rot, bevel = pr
                bpy.ops.mesh.primitive_cube_add(size=2)
                ob = bpy.context.active_object
                sx, sy, sz = size
                Mg = rot_m(rot)
                C = Matrix(((1, 0, 0), (0, 0, -1), (0, 1, 0)))
                Mb = C @ Mg @ C.inverted()
                ob.matrix_world = Matrix.Translation(G(pos)) @ Mb.to_4x4() @ Matrix.Diagonal((sx, sz, sy, 1))
                bpy.ops.object.select_all(action='DESELECT')
                ob.select_set(True)
                bpy.context.view_layer.objects.active = ob
                bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
            else:
                _, verts, faces, bevel = pr
                me = bpy.data.meshes.new('prim')
                me.from_pydata([G(v) for v in verts], [], faces)
                bm = bmesh.new(); bm.from_mesh(me)
                bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
                bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
                bm.to_mesh(me); bm.free()
                ob = bpy.data.objects.new('prim', me)
                bpy.context.scene.collection.objects.link(ob)
            for p in ob.data.polygons:
                p.use_smooth = True
            if bevel:
                md = ob.modifiers.new('bev', 'BEVEL')
                md.width = bevel
                md.segments = 4
                md.limit_method = 'ANGLE'
                md.angle_limit = math.radians(35)
                md.harden_normals = True
            objs.append(ob)
        return objs

    def _skin(self):
        objs = self._metaballs()
        bpy.context.view_layer.update()
        meshes = []
        for ob in objs:
            dg = bpy.context.evaluated_depsgraph_get()
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
        return skin

    def _paint(self, skin):
        me = skin.data
        for old in list(me.color_attributes):
            me.color_attributes.remove(old)
        attr = me.color_attributes.new('Col', 'FLOAT_COLOR', 'CORNER')
        rules = self.layers[self._cur].get('rules', [])
        for poly in me.polygons:
            c = self.base
            gp, gn = INV @ poly.center, INV @ poly.normal
            for fn, col in rules:
                if fn(gp, gn):
                    c = col
            for li in poly.loop_indices:
                attr.data[li].color = c
        me.color_attributes.active_color = attr
        mat = bpy.data.materials.new(self.kind + '_skin')
        me.materials.append(mat)


def new(kind, base=WHITE):
    p = CrispProp(kind, base=base)
    p.paint_refine = 0
    p.extras['outline'] = 0.022
    return p


def extrude(p, poly, z0, z1, bevel=BEV, off=(0, 0)):
    """a prism: the 2D polygon [(x, y)...] (CCW, may be concave) between z0 and z1"""
    m = len(poly)
    verts = [(x + off[0], y + off[1], z0) for x, y in poly] + [(x + off[0], y + off[1], z1) for x, y in poly]
    faces = [tuple(range(m))[::-1], tuple(range(m, 2 * m))]
    for i in range(m):
        j = (i + 1) % m
        faces.append((i, j, m + j, m + i))
    p.mesh(verts, faces, bevel=bevel)


def finish(p, h=1.0):
    p.bone('body', (0, 0, 0), (0, max(0.3, h), 0))
    p.build()


def grain_rings(r_out, rings=(0.11, 0.22, 0.32)):
    """profile points across a flat end so the end grain rings can be painted on real edges"""
    return list(rings) + [r_out]


def ring_col(r, rings=(0.11, 0.22, 0.32)):
    """wood end-grain colour by radius: pale centre, then alternating ring bands"""
    if r < rings[0]:
        return WOOD_L
    if r < rings[1]:
        return WOOD
    if r < rings[2]:
        return WOOD_L
    return WOOD_R


# ---------------- blocks ----------------
def cube():
    p = new('prop_blk_cube')
    p.box((0, 0.5, 0), (0.5, 0.5, 0.5), bevel=BEV)
    finish(p)


def cuboid():
    p = new('prop_blk_cuboid')
    p.box((0, 0.5, 0), (1.0, 0.5, 0.5), bevel=BEV)
    finish(p)


def cyl():
    p = new('prop_blk_cyl')
    R, H, b = 0.5, 1.0, 0.085
    ends = [0.11, 0.22, 0.32, R - b]
    # bottom end (centre outward), the rounded rim, the side, the top rim, the top end (outward → centre)
    prof = [(0, 0)] + [(r, 0) for r in ends]
    for k in range(1, 4):
        a = math.pi / 2 * k / 4
        prof.append((R - b + b * math.sin(a), b - b * math.cos(a)))
    prof += [(R, b), (R, 0.5), (R, H - b)]
    for k in range(1, 4):
        a = math.pi / 2 * k / 4
        prof.append((R - b + b * math.cos(a), H - b + b * math.sin(a)))
    prof += [(r, H) for r in reversed(ends)] + [(0, H)]
    p.lathe(prof, seg=72)   # fine segments: the toon bands sweep smoothly round the side (no vertical creases)
    # the flat ends are bare wood with end-grain rings; the rounded rims and the side are painted
    p.rule(lambda q, n: abs(n.y) > 0.95 and math.hypot(q.x, q.z) < R - b + 0.002, WOOD)
    for r0, r1, c in ((0, 0.11, WOOD_L), (0.11, 0.22, WOOD), (0.22, 0.32, WOOD_L), (0.32, R - b + 0.002, WOOD_R)):
        p.rule(lambda q, n, r0=r0, r1=r1: abs(n.y) > 0.95 and r0 <= math.hypot(q.x, q.z) < r1, c)
    finish(p)


def cone():
    p = new('prop_blk_cone')
    R, H, b, rt = 0.5, 1.0, 0.07, 0.11
    prof = [(0, 0), (0.2, 0), (R - b, 0)]
    for k in range(1, 4):
        a = math.pi / 2 * k / 4
        prof.append((R - b + b * math.sin(a), b - b * math.cos(a)))
    # the straight side runs up to touch one round cap (a sphere of radius rt at the top): no knob, no pinch
    P = (R, b)
    C = (0.0, H - rt)
    dx, dy = P[0] - C[0], P[1] - C[1]
    d = math.hypot(dx, dy)
    base_a = math.atan2(dy, dx)
    off = math.acos(rt / d)
    ta = base_a + off                 # the tangent point's angle on the cap circle (the upper of the two tangents)
    T = (C[0] + rt * math.cos(ta), C[1] + rt * math.sin(ta))
    for k in range(1, 9):
        t = k / 9
        prof.append((P[0] + (T[0] - P[0]) * t, P[1] + (T[1] - P[1]) * t))
    n = 8
    for k in range(0, n + 1):
        a = ta + (math.pi / 2 - ta) * k / n
        prof.append((max(0.0, rt * math.cos(a)), C[1] + rt * math.sin(a)))
    prof[-1] = (0, H)
    p.lathe(prof, seg=72)
    p.rule(lambda q, n: n.y < -0.95, WOOD)
    finish(p)


def ball():
    p = new('prop_blk_ball')
    R = 0.5
    N = 36
    prof = [(R * math.sin(math.pi * k / N), R - R * math.cos(math.pi * k / N)) for k in range(N + 1)]
    prof[0] = (0, 0)
    prof[-1] = (0, 2 * R)
    p.lathe(prof, seg=72)   # fine and even: one soft toon shade, no faceted patches
    finish(p)


def roof():
    p = new('prop_blk_roof')
    extrude(p, [(-1.0, 0), (1.0, 0), (0, 1.0)], -0.5, 0.5, bevel=0.07)
    p.rule(lambda q, n: n.y < -0.95, WOOD)
    finish(p)


def arch():
    p = new('prop_blk_arch')
    r = 0.5
    poly = [(-1.0, 0), (-r, 0)]
    n = 16
    for k in range(1, n):
        a = math.pi - math.pi * k / n
        poly.append((r * math.cos(a), r * math.sin(a)))
    poly += [(r, 0), (1.0, 0), (1.0, 1.0), (-1.0, 1.0)]
    extrude(p, poly, -0.5, 0.5, bevel=BEV)
    # the inside of the arch is bare wood
    p.rule(lambda q, n: abs(n.z) < 0.5 and math.hypot(q.x, q.y) < r + 0.01 and q.y > 0.004 and n.y < 0.2, WOOD)
    p.rule(lambda q, n: n.y < -0.95, WOOD)
    finish(p)


# ---------------- the build corner ----------------
def mat():
    p = new('prop_blk_mat', base=WOOD)
    W, D, T = 6.4, 3.2, 0.16
    p.box((0, T / 2, 0), (W / 2, T / 2, D / 2), bevel=0.06)
    p.rule(lambda q, n: n.y < -0.9, WOOD_D)
    p.layer('felt', base=WHITE)
    p.box((0, T + 0.015, 0), (W / 2 - 0.22, 0.03, D / 2 - 0.22), bevel=0.02)
    p.layer('grid', base=WHITE)
    fw, fd = W / 2 - 0.42, D / 2 - 0.42
    # a few bold, softly rounded guide lines (every other grid line) and a stitched border round the felt
    xs = [i * 1.6 for i in range(-1, 2)]
    zs = [0.0]
    for x in xs:
        p.box((x, T + 0.05, 0), (0.04, 0.012, fd), bevel=0.01)
    for z in zs:
        p.box((0, T + 0.05, z), (fw, 0.012, 0.04), bevel=0.01)
    bx, bz = W / 2 - 0.32, D / 2 - 0.32
    per = 2 * (2 * bx + 2 * bz)
    nd = int(per / 0.42)
    for k in range(nd):                                   # stitches: short rounded dashes along the felt edge
        u = (k + 0.5) / nd * per
        if u < 2 * bx:
            x, z, rot = -bx + u, -bz, 0
        elif u < 2 * bx + 2 * bz:
            x, z, rot = bx, -bz + (u - 2 * bx), 90
        elif u < 4 * bx + 2 * bz:
            x, z, rot = bx - (u - 2 * bx - 2 * bz), bz, 0
        else:
            x, z, rot = -bx, bz - (u - 4 * bx - 2 * bz), 90
        p.box((x, T + 0.048, z), (0.08, 0.01, 0.024), rot=(0, rot, 0), bevel=0.0)
    p.layer('skin')
    p.extras['outline'] = 0.02
    p.bone('body', (0, 0, 0), (0, 0.3, 0))
    p.build()


def stand():
    p = new('prop_blk_stand', base=0xffc21a)
    # a sturdy round display stand: foot, fat column, a wooden top with a felt pad
    prof = [(0, 0), (0.95, 0), (0.98, 0.06), (0.95, 0.16), (0.55, 0.2), (0.48, 0.28), (0.48, 1.1), (0.6, 1.18),
            (1.25, 1.22), (1.3, 1.28), (1.3, 1.36), (1.25, 1.41), (0, 1.41)]
    p.lathe(rounded(prof, 0.035, n=3), seg=48)
    p.rule(lambda q, n: q.y > 1.17, WOOD)
    p.rule(lambda q, n: q.y < 0.19, 0x3f8cff)
    # hazard stripes round the column
    for k in range(6):
        a0 = k * TAU / 6
        p.rule(lambda q, n, a0=a0: 0.28 < q.y < 1.12 and math.hypot(q.x, q.z) > 0.46 and
               ((math.atan2(q.x, q.z) - a0 + q.y * 1.4) % TAU) < TAU / 12, 0x3a3550)
    p.layer('pad', base=0x5fbf6a)
    p.cyl((0, 1.40, 0), 1.12, 0.05, bevel=0.02, seg=48)
    p.layer('skin')
    p.extras['outline'] = 0.022
    p.bone('body', (0, 0, 0), (0, 1, 0))
    p.build()


def tray(kind='prop_blk_tray', L=11.0):
    p = new(kind, base=FLOOR)
    D, F, Hr, t = 1.7, 0.12, 0.34, 0.14
    # the floor sits inside the rim (never level with it, so no two faces fight under the rim)
    p.box((0, F / 2, 0), (L / 2 - t + 0.01, F / 2, D / 2 - t + 0.01), bevel=0.03)
    p.rule(lambda q, n: n.y < -0.9, WOOD_D)
    p.layer('rim', base=0x2fb7ad)
    # one closed frame: long sides run the full length, the ends fit between them
    for s in (-1, 1):
        p.box((0, Hr / 2, s * (D / 2 - t / 2)), (L / 2, Hr / 2, t / 2), bevel=0.05)
        p.box((s * (L / 2 - t / 2), Hr / 2, 0), (t / 2, Hr / 2, D / 2 - t + 0.002), bevel=0.05)
    p.rule(lambda q, n: n.y > 0.9 and q.y > Hr - 0.02, 0x5fd6cc)     # a lighter top edge on the rim
    p.layer('skin')
    p.extras['outline'] = 0.02
    p.bone('body', (0, 0, 0), (0, 0.3, 0))
    p.build()


def tray_s():
    tray('prop_blk_tray_s', 6.2)


def shelf():
    """the keepsake shelf: a long low wooden bench (top at y 0.72, 5.8 x 0.9) on two chunky teal end panels"""
    p = new('prop_blk_shelf', base=WOOD)
    L, D, T, top = 5.8, 0.9, 0.14, 0.72
    p.box((0, top - T / 2, 0), (L / 2, T / 2, D / 2), bevel=0.05)
    p.rule(lambda q, n: n.y < -0.9, WOOD_D)
    p.rule(lambda q, n: n.y > 0.9 and abs(q.z) < D / 2 - 0.12 and abs(q.x) < L / 2 - 0.12, WOOD_L)   # the top, paler inside a darker edge
    p.layer('legs', base=0x2fb7ad)
    for s in (-1, 1):
        p.box((s * (L / 2 - 0.42), (top - T) / 2, 0), (0.16, (top - T) / 2, D / 2 - 0.06), bevel=0.05)
    p.box((0, 0.16, -D / 2 + 0.14), (L / 2 - 0.5, 0.06, 0.05), bevel=0.03)                   # a back stretcher
    p.rule(lambda q, n: n.y > 0.9, 0x5fd6cc)
    p.layer('skin')
    p.extras['outline'] = 0.02
    p.bone('body', (0, 0, 0), (0, 0.7, 0))
    p.build()


def flag():
    """a little flag on a stick, about 0.95 tall: a wooden stick (origin at its foot), a yellow knob on top and a
    waving pennant cloth to +x, painted WHITE so the game can colour it"""
    p = new('prop_blk_flag', base=WHITE)
    # the cloth: a pennant from y 0.52 to 0.86 at the stick, tapering to a point at x 0.52, with a gentle wave in z
    nx, th = 14, 0.028
    top, bot = [], []
    for i in range(nx + 1):
        u = i / nx
        x = 0.035 + 0.5 * u
        h = 0.17 * (1 - u) + 0.012 * u
        yc = 0.69 - 0.03 * u
        z = 0.05 * math.sin(u * math.pi * 1.6)
        top.append((x, yc + h, z)); bot.append((x, yc - h, z))
    verts, faces = [], []
    for side in (-1, 1):
        for i in range(nx + 1):
            verts.append((top[i][0], top[i][1], top[i][2] + side * th / 2))
            verts.append((bot[i][0], bot[i][1], bot[i][2] + side * th / 2))
    m = 2 * (nx + 1)
    for i in range(nx):
        a, b2, c, d = 2 * i, 2 * i + 1, 2 * i + 3, 2 * i + 2
        faces.append((a, d, c, b2))                         # front (-z side)
        faces.append((m + a, m + b2, m + c, m + d))         # back
        faces.append((a, m + a, m + d, d))                  # top edge
        faces.append((b2, c, m + c, m + b2))                # bottom edge
    faces.append((0, 1, m + 1, m))                          # at the stick
    faces.append((2 * nx, 2 * nx + 1, m + 2 * nx + 1, m + 2 * nx)[::-1])
    p.mesh(verts, faces, bevel=0)
    p.cyl((0, 0, 0), 0.042, 0.88, bevel=0.015, seg=20)
    p.lathe([(math.sin(math.pi * k / 12) * 0.075, 0.875 + 0.075 - math.cos(math.pi * k / 12) * 0.075) for k in range(13)], seg=24)
    # one mesh (the game recolours its white): the stick wood, the knob yellow, the cloth stays white
    p.rule(lambda q, n: math.hypot(q.x, q.z) < 0.047 and q.y < 0.88, WOOD_R)
    p.rule(lambda q, n: q.y > 0.87 and math.hypot(q.x, q.z) < 0.09, 0xffd23a)
    p.extras['outline'] = 0.014
    p.bone('body', (0, 0, 0), (0, 0.9, 0))
    p.build()


def box():
    p = new('prop_blk_box', base=0xff5a4f)
    W, H, D, t, F = 2.6, 1.3, 1.7, 0.14, 0.14
    p.box((0, F / 2, 0), (W / 2, F / 2, D / 2), bevel=0.04)
    for s in (-1, 1):
        p.box((0, H / 2, s * (D / 2 - t / 2)), (W / 2, H / 2, t / 2), bevel=0.06)
        p.box((s * (W / 2 - t / 2), H / 2, 0), (t / 2, H / 2, D / 2), bevel=0.06)
    p.rule(lambda q, n: n.y > 0.9 and q.y > H - 0.01, 0xffd23a)        # the rim tops
    p.rule(lambda q, n: q.y < F + 0.01 and n.y > 0.9, WOOD_D)           # the inside floor
    p.rule(lambda q, n: (abs(q.x) < W / 2 - t + 0.002 and abs(q.z) < D / 2 - t + 0.002 and q.y < H - 0.03 and n.y < 0.9), 0xd8473d)  # inside walls a touch darker
    # shape stickers on the front: a circle, a square and a triangle
    p.layer('stickers', base=WHITE)
    z = D / 2 + 0.005
    cx = [-0.78, 0, 0.78]
    circ = [(0.27 * math.cos(TAU * i / 28), 0.27 * math.sin(TAU * i / 28)) for i in range(28)]
    extrude(p, circ, z - 0.02, z + 0.035, bevel=0.012, off=(cx[0], 0.66))
    extrude(p, [(-0.24, -0.24), (0.24, -0.24), (0.24, 0.24), (-0.24, 0.24)], z - 0.02, z + 0.035, bevel=0.012, off=(cx[1], 0.66))
    extrude(p, [(-0.29, -0.22), (0.29, -0.22), (0, 0.3)], z - 0.02, z + 0.035, bevel=0.012, off=(cx[2], 0.64))
    p.rule(lambda q, n: q.x < -0.4, 0xffd23a)
    p.rule(lambda q, n: abs(q.x) <= 0.4, 0x3f8cff)
    p.rule(lambda q, n: q.x > 0.4, 0x4cc75a)
    p.layer('skin')
    p.extras['outline'] = 0.022
    p.bone('body', (0, 0, 0), (0, 1, 0))
    p.build()


def ramp():
    p = new('prop_blk_ramp', base=0x3f8cff)
    W, L, H = 4.6, 2.6, 1.8
    # side profile in (z, y): a wedge with a short flat foot lip at the front
    prof = [(-L / 2, 0), (L / 2, 0), (L / 2, 0.04), (-L / 2, H)]
    verts = [(-W / 2, y, z) for z, y in prof] + [(W / 2, y, z) for z, y in prof]
    m = len(prof)
    faces = [tuple(range(m)), tuple(range(m, 2 * m))[::-1]]
    for i in range(m):
        j = (i + 1) % m
        faces.append((i, m + i, m + j, j))
    p.mesh(verts, faces, bevel=0.06)
    a = math.atan2(H - 0.04, L)
    p.rule(lambda q, n: n.y > 0.5, 0xffd23a)        # the slope
    p.rule(lambda q, n: n.y < -0.9, WOOD_D)
    p.rule(lambda q, n: n.z > 0.9, 0x2f6fd8)        # the low front face
    # the sides: an orange trim strip just under the slope edge and a wooden foot band (thin plates on the side)
    p.layer('trim', base=0xff9a2e)
    for sx in (-1, 1):
        x0, x1 = sx * (W / 2 - 0.01), sx * (W / 2 + 0.025)
        ys = lambda z: 0.04 + (H - 0.04) * (L / 2 - z) / L
        z0, z1 = L / 2 - 0.35, -L / 2 + 0.08
        poly = [(z0, ys(z0) - 0.2), (z1, ys(z1) - 0.2), (z1, ys(z1) - 0.03), (z0, ys(z0) - 0.03)]
        verts = [(x0, y, z) for z, y in poly] + [(x1, y, z) for z, y in poly]
        faces = [(0, 1, 2, 3), (7, 6, 5, 4), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)]
        if sx < 0: faces = [f[::-1] for f in faces]
        p.mesh(verts, faces, bevel=0.012)
        p.box((sx * (W / 2 + 0.008), 0.07, -0.25), (0.018, 0.07, L / 2 - 0.45), bevel=0.012)
    p.rule(lambda q, n: q.y < 0.16, WOOD)
    # low lane rails along the slope (on the lane borders and the outer edges: a rolling ball never touches them)
    p.layer('lanes', base=WHITE)
    for x in (-2.22, -0.765, 0.765, 2.22):
        w = 0.06 if abs(x) < 1 else 0.08
        p.box((x, (H + 0.04) / 2 + 0.03 / math.cos(a), 0), (w, 0.03, L / 2 / math.cos(a) - 0.08), rot=(math.degrees(a), 0, 0), bevel=0.02)
    p.rule(lambda q, n: abs(q.x) > 1.5, 0xff5a4f)   # the outer rails red, the lane lines white
    p.layer('skin')
    p.extras['outline'] = 0.022
    p.bone('body', (0, 0, 0), (0, 1, 0))
    p.build()


MODELS = dict(prop_blk_cube=cube, prop_blk_cuboid=cuboid, prop_blk_cyl=cyl, prop_blk_cone=cone, prop_blk_ball=ball,
              prop_blk_roof=roof, prop_blk_arch=arch, prop_blk_mat=mat, prop_blk_stand=stand, prop_blk_tray=tray,
              prop_blk_box=box, prop_blk_ramp=ramp, prop_blk_tray_s=tray_s, prop_blk_shelf=shelf, prop_blk_flag=flag)
for name, fn in MODELS.items():
    if not ONLY or name in ONLY:
        fn()
