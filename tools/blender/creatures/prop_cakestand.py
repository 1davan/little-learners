"""Two-tier cake stand (Apple count 'stand' host). Oval plates (wide in x) with scalloped rims: bottom plate top at
y 1.92 (4.8 wide), top plate top at y 3.62 (3.4 wide); a sky-blue pillar, a pink bead finial, a round foot.
The plates are exact geometry (layer 'plates' is raw: no voxel remesh), 0.25 thick with even round scallops."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

WHITE, WHITE_D, BLUE, BLUE_D, PINK, YEL = 0xfffaf2, 0xe6ddd0, 0x9ed6ff, 0x7cbbe8, 0xff9ec8, 0xffd23f
import bpy, bmesh


class StandProp(Prop):
    """a kit Prop whose 'raw' layers keep their exact geometry (no voxel remesh): the scalloped plates stay crisp"""
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


p = StandProp('prop_cakestand', base=BLUE, target_faces=2400, voxel=0.018)
p.lathe(rounded([(0, 0), (0.85, 0), (0.85, 0.12), (0.45, 0.32), (0.32, 0.5), (0.32, 1.6), (0.42, 1.78), (0, 1.8)], 0.08, n=4), seg=40)
p.lathe(rounded([(0, 1.9), (0.14, 1.9), (0.1, 2.3), (0.1, 3.45), (0.2, 3.52), (0, 3.52)], 0.05, n=3), seg=24)
p.paint_fn(lambda q, n: q.y < 0.14, BLUE_D)
for y in (0.9, 1.25):
    p.paint_fn(lambda q, n, y=y: abs(q.y - y) < 0.05, 0xffffff)

p.layer('plates', base=WHITE)
p.layers['plates']['raw'] = True


def plate(y, rx, rz, lobe=0.42, per_lobe=5):
    """a thick oval plate (top flat at y, 0.25 deep) whose rounded rim is cut into even round scallops: exact geometry,
    so the outline is clean. Rings: (offset from the oval edge along its normal, height below y, scallop weight)."""
    M = 1440
    E = lambda t: (rx * math.sin(t), rz * math.cos(t))
    cum = [0.0]
    for i in range(1, M + 1):
        (x0, z0), (x1, z1) = E(math.tau * (i - 1) / M), E(math.tau * i / M)
        cum.append(cum[-1] + math.hypot(x1 - x0, z1 - z0))
    per = cum[-1]
    n = max(12, round(per / lobe))
    NA = n * per_lobe
    ts, k = [], 0
    for j in range(NA):
        s_ = per * j / NA
        while cum[k + 1] < s_:
            k += 1
        ts.append(math.tau * (k + (s_ - cum[k]) / (cum[k + 1] - cum[k])) / M)
    di = -min(0.42, 0.7 * rz * rz / rx)              # inner ring: inside the oval's tightest curvature (no fold-over)
    rings = [(di, 0.0, 0.0), (-0.04, 0.0, 1.0), (0.025, -0.012, 1.0), (0.062, -0.048, 1.0), (0.072, -0.1, 1.0), (0.066, -0.16, 1.0),
             (0.045, -0.208, 1.0), (0.0, -0.232, 1.0), (-0.1, -0.245, 0.4), (di, -0.25, 0.0)]
    R = len(rings)
    verts = []
    for j, t in enumerate(ts):
        (x, z) = E(t)
        nx, nz = rz * math.sin(t), rx * math.cos(t)
        L = math.hypot(nx, nz)
        nx, nz = nx / L, nz / L
        bulge = 0.075 * math.sin(math.pi * (j % per_lobe) / per_lobe) ** 0.55
        for d, dy, w in rings:
            dd = d + w * bulge
            verts.append((x + nx * dd, y + dy, z + nz * dd))
    faces = [(j * R + k, ((j + 1) % NA) * R + k, ((j + 1) % NA) * R + k + 1, j * R + k + 1) for j in range(NA) for k in range(R - 1)]
    c0, c1 = len(verts), len(verts) + 1
    verts += [(0, y, 0), (0, y - 0.25, 0)]
    faces += [(c0, ((j + 1) % NA) * R, j * R) for j in range(NA)] + [(c1, j * R + R - 1, ((j + 1) % NA) * R + R - 1) for j in range(NA)]
    p.mesh(verts, faces)
plate(1.92, 2.4, 1.08)
plate(3.62, 1.7, 0.77)
p.paint_fn(lambda q, n: n.y < -0.4, WHITE_D)

p.layer('trim', base=PINK, target_faces=900, voxel=0.014)
p.blob((0, 3.72, 0), (0.15, 0.15, 0.15), group='bead')
p.blob((0, 3.9, 0), (0.09, 0.09, 0.09), group='bead2')
p.ring((0, 1.665, 0), 0.38, 0.05, seg=32, rseg=8)          # pink collar just under the (thicker) bottom plate
p.ring((0, 0.13, 0), 0.82, 0.05, seg=40, rseg=8)
p.paint('dot', (0, 3.9, 0), (0.12, 0.12, 0.12), YEL)
p.layer('skin')
p.bone('body', (0, 0, 0), (0, 3.6, 0))
p.extras['outline'] = 0.026
p.build()
