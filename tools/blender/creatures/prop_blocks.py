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
    p.lathe(prof, seg=40)
    # the flat ends are bare wood with end-grain rings; the rounded rims and the side are painted
    p.rule(lambda q, n: abs(n.y) > 0.95 and math.hypot(q.x, q.z) < R - b + 0.002, WOOD)
    for r0, r1, c in ((0, 0.11, WOOD_L), (0.11, 0.22, WOOD), (0.22, 0.32, WOOD_L), (0.32, R - b + 0.002, WOOD_R)):
        p.rule(lambda q, n, r0=r0, r1=r1: abs(n.y) > 0.95 and r0 <= math.hypot(q.x, q.z) < r1, c)
    finish(p)


def cone():
    p = new('prop_blk_cone')
    R, H, b, tip = 0.5, 1.0, 0.07, 0.1
    prof = [(0, 0), (0.2, 0), (R - b, 0)]
    for k in range(1, 4):
        a = math.pi / 2 * k / 4
        prof.append((R - b + b * math.sin(a), b - b * math.cos(a)))
    # the slanted side up to a soft round tip
    sl = (H - tip * 1.2 - b) / 1.0
    for k in range(0, 6):
        t = k / 5
        prof.append((R * (1 - t) + 0.06 * t, b + (H - tip - b) * t))
    for k in range(1, 4):
        a = math.pi / 2 * k / 3
        prof.append((0.06 * math.cos(a), H - tip + 0.06 + tip * 0.4 * math.sin(a)))
    p.lathe(prof, seg=40)
    p.rule(lambda q, n: n.y < -0.95, WOOD)
    finish(p)


def ball():
    p = new('prop_blk_ball')
    R = 0.5
    prof = [(R * math.sin(math.pi * k / 20), R - R * math.cos(math.pi * k / 20)) for k in range(21)]
    prof[0] = (0, 0)
    prof[-1] = (0, 2 * R)
    p.lathe(prof, seg=40)
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
    xs = [i * 0.8 for i in range(-3, 4)]
    zs = [i * 0.8 for i in range(-1, 2)]
    for x in xs:
        p.box((x, T + 0.046, 0), (0.022, 0.006, fd), bevel=0)
    for z in zs:
        p.box((0, T + 0.046, z), (fw, 0.006, 0.022), bevel=0)
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


def tray():
    p = new('prop_blk_tray', base=WOOD)
    L, D, F, Hr, t = 11.0, 1.7, 0.12, 0.34, 0.14
    p.box((0, F / 2, 0), (L / 2, F / 2, D / 2), bevel=0.04)
    p.layer('rim', base=0x2fb7ad)
    for s in (-1, 1):
        p.box((0, Hr / 2, s * (D / 2 - t / 2)), (L / 2, Hr / 2, t / 2), bevel=0.05)
        p.box((s * (L / 2 - t / 2), Hr / 2, 0), (t / 2, Hr / 2, D / 2), bevel=0.05)
    p.layer('skin')
    p.rule(lambda q, n: n.y < -0.9, WOOD_D)
    p.extras['outline'] = 0.02
    p.bone('body', (0, 0, 0), (0, 0.3, 0))
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
    p.rule(lambda q, n: n.y > 0.5, 0xffd23a)        # the slope
    p.rule(lambda q, n: n.y < -0.9, WOOD_D)
    # two white lane lines on the slope (thin strips lying on it)
    p.layer('lanes', base=WHITE)
    a = math.atan2(H - 0.04, L)
    for x in (-0.77, 0.77):
        p.box((x, (H + 0.04) / 2 + 0.014 / math.cos(a), 0), (0.05, 0.012, L / 2 / math.cos(a) - 0.25), rot=(math.degrees(a), 0, 0), bevel=0)
    p.layer('skin')
    p.extras['outline'] = 0.022
    p.bone('body', (0, 0, 0), (0, 1, 0))
    p.build()


MODELS = dict(prop_blk_cube=cube, prop_blk_cuboid=cuboid, prop_blk_cyl=cyl, prop_blk_cone=cone, prop_blk_ball=ball,
              prop_blk_roof=roof, prop_blk_arch=arch, prop_blk_mat=mat, prop_blk_stand=stand, prop_blk_tray=tray,
              prop_blk_box=box, prop_blk_ramp=ramp)
for name, fn in MODELS.items():
    if not ONLY or name in ONLY:
        fn()
