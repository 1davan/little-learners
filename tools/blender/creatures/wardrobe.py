"""A cute rounded toy wardrobe for the dress-up game. Doors are bones door.L / door.R hinged on the outer edges
(bones point straight up, so the game swings a door open with bone.rotation.y: door.L negative, door.R positive).
Hollow inside with a hanger rail. Built from bevelled boxes/cylinders (voxel-remeshed into one soft skin) plus blobs."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
import bpy
from lib import Creature, G


class Boxy(Creature):
    """Creature + bevelled primitive solids (box / cyl), for furniture. Prims join the layer's skin at remesh."""

    def prim(self, kind, pos, size, rot=(0, 0, 0), bevel=0.06):
        self.layers[self._cur].setdefault('prims', []).append((kind, pos, size, rot, bevel))

    def _metaballs(self):
        objs = super()._metaballs() if self.groups else []
        for kind, pos, size, rot, bevel in self.layers[self._cur].get('prims', []):
            sx, sy, sz = size
            if kind == 'box':
                bpy.ops.mesh.primitive_cube_add(size=2)
                ob = bpy.context.active_object
                ob.scale = (sx, sz, sy)       # game (x, y, z) half-sizes -> blender (x, z->y, y->z)
            else:                              # cyl along game y: radius sx (x) / sz (z), half-height sy
                bpy.ops.mesh.primitive_cylinder_add(vertices=40, radius=1, depth=2)
                ob = bpy.context.active_object
                ob.scale = (sx, sz, sy)
            ob.location = G(pos)
            rx, ry, rz = [math.radians(a) for a in rot]
            ob.rotation_euler = (rx, -rz, ry)
            bpy.ops.object.select_all(action='DESELECT')
            ob.select_set(True)
            bpy.context.view_layer.objects.active = ob
            bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
            if bevel:
                m = ob.modifiers.new('bev', 'BEVEL')
                m.width = bevel
                m.segments = 4
            objs.append(ob)
        return objs

    def _skin(self):
        """lib's _skin with a much gentler smooth: Laplacian smoothing eats thin flat panels (the walls shrank)."""
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
        skin.data.remesh_voxel_size = self.voxel
        bpy.ops.object.voxel_remesh()
        n = len(skin.data.polygons)
        tf = self.layers[self._cur].get('target_faces') or self.target_faces
        if n > tf:
            d = skin.modifiers.new('dec', 'DECIMATE')
            d.ratio = tf / n
            bpy.ops.object.modifier_apply(modifier='dec')
        sm = skin.modifiers.new('smooth2', 'CORRECTIVE_SMOOTH')
        sm.iterations = 4
        sm.smooth_type = 'LENGTH_WEIGHTED'
        sm.use_only_smooth = True
        bpy.ops.object.modifier_apply(modifier='smooth2')
        bpy.ops.object.shade_smooth()
        return skin


MINT = 0x8fe0cf
MINT_D = 0x6cc9b6
PINK = 0xff9ec4
LILAC = 0xb99cf0
INSIDE = 0x6f5aa8
GOLD = 0xffc531
CREAM = 0xfff4e0

c = Boxy('wardrobe', base=MINT, target_faces=9000, voxel=0.014)   # finer: the doors' rounded edges and the inside stay smooth (no ink wedges)
W, H0, H1, D0, D1 = 1.3, 0.28, 3.1, -0.62, 0.6     # half width, bottom, top, back, front
FZ = 0.7                                             # door plane
T = 0.12                                             # wall thickness
c.prim('box', (0, (H0 + H1) / 2, D0 + T / 2), (W, (H1 - H0) / 2, T / 2), bevel=0.05)          # back
c.mirror(lambda s: c.prim('box', (s * (W - T / 2), (H0 + H1) / 2, (D0 + D1) / 2), (T / 2 + 0.02, (H1 - H0) / 2, (D1 - D0) / 2), bevel=0.08))
c.prim('box', (0, H1 - T / 2, (D0 + D1) / 2), (W, T / 2 + 0.02, (D1 - D0) / 2), bevel=0.08)    # roof slab
c.prim('box', (0, H0 + T / 2, (D0 + D1) / 2), (W, T / 2, (D1 - D0) / 2), bevel=0.06)          # floor
c.prim('box', (0, 0.9, -0.15), (W - T, 0.04, 0.42), bevel=0.02)                                 # low shelf
c.prim('cyl', (0, 2.62, -0.05), (0.045, W - T, 0.045), rot=(0, 0, 90), bevel=0)                # hanger rail
# arched crown on top with a star, little round feet, a plinth
c.blob((0, 3.12, -0.01), (1.2, 0.34, 0.6), group='crown')
c.blob((0, 3.5, 0.12), (0.17, 0.17, 0.08), group='star')
c.mirror(lambda s: c.blob((s * 1.0, 0.13, 0.35), (0.16, 0.14, 0.16), group='foot'))
c.mirror(lambda s: c.blob((s * 1.0, 0.13, -0.4), (0.16, 0.14, 0.16), group='foot'))
c.mirror(lambda s: c.blob((s * 1.05, 3.3, 0.0), (0.16, 0.16, 0.16), group='ball'))
# hangers on the rail
for x in (-0.6, 0.0, 0.6):
    c.blob((x, 2.68, -0.05), (0.035, 0.07, 0.035), group='hook%d' % int(x * 10 + 10))
    c.capsule((x - 0.32, 2.4, -0.05), (x, 2.56, -0.05), 0.035, group='hang%d' % int(x * 10 + 10))
    c.capsule((x + 0.32, 2.4, -0.05), (x, 2.56, -0.05), 0.035, group='hang%d' % int(x * 10 + 10))

# doors (in front of the frame, with a gap so they are separate pieces)
DW = W - 0.02
for s in (-1, 1):
    g = 'door' + ('L' if s < 0 else 'R')
    xi, xo = s * 0.025, s * DW
    c.prim('box', ((xi + xo) / 2, (H0 + H1) / 2 + 0.03, FZ), (abs(xo - xi) / 2, (H1 - H0) / 2 - 0.06, 0.06), bevel=0.06)
    c.blob((s * 0.2, 1.75, FZ + 0.1), (0.09, 0.09, 0.07), group='knob' + g)


# ---------------- paint ----------------
inside = lambda p: abs(p.x) < W - T + 0.01 and H0 + T - 0.01 < p.y < H1 - T + 0.01 and D0 + T - 0.01 < p.z < D1 - 0.01
c.paint_fn(lambda p, n: inside(p), INSIDE)
c.paint_fn(lambda p, n: p.y > H1 - 0.05 and p.z < D1 + 0.05, PINK)                      # crown
c.paint_fn(lambda p, n: p.y < H0 + 0.02 and p.z < D1 + 0.05, PINK)                      # feet / plinth
c.paint('star', (0, 3.5, 0.15), (0.24, 0.24, 0.2), GOLD)
c.mirror(lambda s: c.paint('ball', (s * 1.05, 3.3, 0.0), (0.2, 0.2, 0.2), GOLD))
c.paint_fn(lambda p, n: abs(p.y - 2.62) < 0.07 and abs(p.z + 0.05) < 0.07 and abs(p.x) < W - T, GOLD)       # rail
for x, col in ((-0.6, 0xff6fa8), (0.0, 0xffd23f), (0.6, 0x5ab4ff)):
    c.paint('hanger', (x, 2.52, -0.05), (0.38, 0.2, 0.08), col)
c.paint_fn(lambda p, n: abs(p.y - 0.9) < 0.06 and inside(p), LILAC)                       # shelf
for s in (-1, 1):
    c.paint_fn(lambda p, n, s=s: p.z > FZ - 0.08 and p.x * s > 0, LILAC)                  # door
    c.paint('knob', (s * 0.2, 1.75, FZ + 0.14), (0.12, 0.12, 0.1), GOLD)

# two clean raised panels per door, as their own layer (crisp edge and a clean outline of their own; they ride on
# the door bones like the doors)
c.layer('panels', base=0xcdb6f7, target_faces=700)
for s in (-1, 1):
    for py, ph in ((2.3, 0.55), (0.95, 0.42)):
        c.prim('box', (s * (DW / 2 + 0.03), py, FZ + 0.075), (DW / 2 - 0.22, ph, 0.03), bevel=0.025)
c.layer('skin')

# ---------------- rig ----------------
c.bone('body', (0, 0.05, 0), (0, 3.0, 0), region=lambda p: p.z < FZ - 0.08 or p.y > H1 + 0.05 or p.y < H0 - 0.02)
c.bone('door.L', (-DW, H0, FZ), (-DW, H1, FZ), parent='body', region=lambda p: p.z >= FZ - 0.08 and p.x < 0 and H0 - 0.02 <= p.y <= H1 + 0.05)
c.bone('door.R', (DW, H0, FZ), (DW, H1, FZ), parent='body', region=lambda p: p.z >= FZ - 0.08 and p.x > 0 and H0 - 0.02 <= p.y <= H1 + 0.05)
c.weight_smooth = 2
c.anchor('inside', (0, 1.9, 0.0), 'body')
c.anchor('knob', (0, 1.75, FZ + 0.15), 'body')
c.extras['outline'] = 0.024
c.build()
if os.environ.get('DBGC'):
    from collections import Counter
    for ob in bpy.data.objects:
        if ob.type == 'MESH' and ob.data.color_attributes:
            a = ob.data.color_attributes['Col']
            print('WROTE col', ob.name, Counter(tuple(round(x, 2) for x in d.color[:3]) for d in a.data).most_common(8))
            fr = [v.co for v in ob.data.vertices if -v.co.y > 0.74]
            print('WROTE front', len(fr), min((v.z for v in fr), default=0), max((v.z for v in fr), default=0))
