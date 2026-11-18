"""Woven picnic basket (Where's Crab? 'in'). 2.0 wide x 1.0 tall x 1.5 deep, hollow; woven sides, a darker rim, an arched
handle across the top and a red-and-white checked cloth draped over one corner."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop

W, H, D, T = 2.0, 1.0, 1.5, 0.1
WEAVE, WEAVE_D, WEAVE_L, IN = 0xd99a4e, 0xb9783a, 0xe8b46a, 0x9a6430
hw, hd = W / 2, D / 2
import bpy, bmesh


class PicnicProp(Prop):
    """a kit Prop whose 'raw' layers keep their exact geometry (no voxel remesh)"""
    def _skin(self):
        L = self.layers[self._cur]
        if not L.get('raw'):
            return super()._skin()
        objs = self._metaballs()
        bpy.context.view_layer.update()
        dg = bpy.context.evaluated_depsgraph_get()
        meshes = []
        for ob in objs:
            mo = bpy.data.objects.new(ob.name + '_mesh', bpy.data.meshes.new_from_object(ob.evaluated_get(dg)))
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
        skin.name = skin.data.name = self._cur
        bm = bmesh.new()
        bm.from_mesh(skin.data)
        bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
        bmesh.ops.triangulate(bm, faces=bm.faces[:])
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
        bm.to_mesh(skin.data)
        bm.free()
        for f in skin.data.polygons:
            f.use_smooth = True
        skin.data.update()
        return skin

    def _paint(self, skin):
        """'facepaint' layers: colour each face from its centre (borders already lie on mesh edges: no cutting)"""
        if not self.layers[self._cur].get('facepaint'):
            return super()._paint(skin)
        from mathutils import Matrix, Vector
        from lib import hexcol
        me = skin.data
        inv = Matrix(((1, 0, 0), (0, 0, 1), (0, -1, 0)))
        attr = me.color_attributes.new('Col', 'FLOAT_COLOR', 'CORNER')
        for poly in me.polygons:
            gp, gn = inv @ Vector(poly.center), inv @ Vector(poly.normal)
            col = self.base
            for kind, data, c in self.paints:
                if kind == 'fn' and data(gp, gn):
                    col = c
            for li in poly.loop_indices:
                attr.data[li].color = col
        me.color_attributes.active_color = attr
        me.materials.append(bpy.data.materials.new(self.kind + '_' + self._cur))


p = PicnicProp('prop_picnic', base=WEAVE, target_faces=3600, voxel=0.018)
p.box((0, T / 2, 0), (hw, T / 2, hd), bevel=0.05)
p.box((0, H / 2, hd - T / 2), (hw, H / 2, T / 2), bevel=0.05)
p.box((0, H / 2, -hd + T / 2), (hw, H / 2, T / 2), bevel=0.05)
for s in (-1, 1):
    p.box((s * (hw - T / 2), H / 2, 0), (T / 2, H / 2, hd), bevel=0.05)
inside = lambda q: abs(q.x) < hw - T + 0.02 and abs(q.z) < hd - T + 0.02 and q.y > T - 0.02


def weave(q, n):
    if inside(q):
        return False
    u = q.x if abs(n.z) > abs(n.x) else q.z
    return (int(math.floor(u / 0.2)) + int(math.floor(q.y / 0.2))) % 2 == 0
p.paint_fn(weave, WEAVE_L)
p.paint_fn(lambda q, n: inside(q), IN)
p.layer('rim', base=WEAVE_D, target_faces=1800, voxel=0.016)
rim = [(-hw + 0.03, H, -hd + 0.03), (hw - 0.03, H, -hd + 0.03), (hw - 0.03, H, hd - 0.03), (-hw + 0.03, H, hd - 0.03)]
from kit import rounded
p.tube(rounded(rim, 0.15, n=4, closed=True), 0.07, closed=True, rseg=8)
p.tube([(-hw + 0.08, H, 0)] + [(-(hw - 0.08) * math.cos(math.radians(a)), H + 0.8 * math.sin(math.radians(a)), 0) for a in range(10, 171, 10)] + [(hw - 0.08, H, 0)], 0.065, rseg=8)
# a checked napkin draped over the back-left rim: a thin cloth sheet laid along a path over the rim and down the outside,
# with even square checks in the cloth's own (across, along) coordinates (so they stay square over the fold) and a
# straight hem. Exact geometry (no remesh). NOTE: layer names starting 'cloth' start hidden in game (creature.js).
p.layer('cloth', base=0xffffff)
p.layers['cloth']['raw'] = p.layers['cloth']['facepaint'] = True
Z0, HALF, CH, TH = -0.4, 0.34, 0.17, 0.022
path = [(-0.3, H + 0.06), (-0.5, H + 0.075), (-0.7, H + 0.085), (-0.86, H + 0.095)]
path += [(-0.97 + 0.11 * math.cos(math.radians(a)), H + 0.11 * math.sin(math.radians(a))) for a in (70, 50, 30, 10, -10)]
path += [(-1.085, H - 0.15), (-1.09, H - 0.3), (-1.095, H - 0.45)]
cum = [0.0]
for (x0, y0), (x1, y1) in zip(path, path[1:]):
    cum.append(cum[-1] + math.hypot(x1 - x0, y1 - y0))


def at(sv):
    for k in range(len(path) - 1):
        if cum[k + 1] >= sv or k == len(path) - 2:
            t = (sv - cum[k]) / (cum[k + 1] - cum[k])
            return (path[k][0] + (path[k + 1][0] - path[k][0]) * t, path[k][1] + (path[k + 1][1] - path[k][1]) * t)
# resample the path every half check, so every check border lies exactly on a row of the mesh
NV = int(cum[-1] / (CH / 2))
path = [at(CH / 2 * i) for i in range(NV + 1)]
cum = [CH / 2 * i for i in range(NV + 1)]
NU = 8                                              # 4 checks across, each split in two
us = [-HALF + 2 * HALF * i / NU for i in range(NU + 1)]
verts, faces = [], []
for i, (x, y) in enumerate(path):
    a, b = path[max(i - 1, 0)], path[min(i + 1, len(path) - 1)]
    tx, ty = b[0] - a[0], b[1] - a[1]
    L = math.hypot(tx, ty)
    nx, ny = -ty / L, tx / L                            # the sheet's up side
    for side in (1, -1):
        for u in us:
            verts.append((x + nx * TH * 0.5 * side, y + ny * TH * 0.5 * side, Z0 + u))
W = len(us)
idx = lambda i, side, j: (i * 2 + (0 if side > 0 else 1)) * W + j
for i in range(len(path) - 1):
    for j in range(W - 1):
        faces.append((idx(i, 1, j), idx(i, 1, j + 1), idx(i + 1, 1, j + 1), idx(i + 1, 1, j)))
        faces.append((idx(i, -1, j), idx(i + 1, -1, j), idx(i + 1, -1, j + 1), idx(i, -1, j + 1)))
    for j in (0, W - 1):
        faces.append((idx(i, 1, j), idx(i + 1, 1, j), idx(i + 1, -1, j), idx(i, -1, j)))
for i in (0, len(path) - 1):
    for j in range(W - 1):
        faces.append((idx(i, 1, j), idx(i, -1, j), idx(i, -1, j + 1), idx(i, 1, j + 1)))
p.mesh(verts, faces)


def along(q):
    """arc length along the drape path of the nearest path point (cloth coordinate)"""
    best, bv = 1e9, 0.0
    for k, ((x0, y0), (x1, y1)) in enumerate(zip(path, path[1:])):
        dx, dy = x1 - x0, y1 - y0
        t = max(0.0, min(1.0, ((q.x - x0) * dx + (q.y - y0) * dy) / (dx * dx + dy * dy)))
        d = math.hypot(q.x - x0 - dx * t, q.y - y0 - dy * t)
        if d < best:
            best, bv = d, cum[k] + t * math.hypot(dx, dy)
    return bv
p.paint_fn(lambda q, n: (int(math.floor((q.z - Z0 + HALF) / CH)) + int(math.floor(along(q) / CH))) % 2 == 0, 0xff5a5a)
p.layer('skin')
p.bone('body', (0, 0, 0), (0, H, 0))
p.extras['outline'] = 0.024
p.build()
