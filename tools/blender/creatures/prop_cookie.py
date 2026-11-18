"""A soft chunky chocolate-chip cookie (Share the snacks, Which has more? cookies), facing +z, centred on the origin, radius
~0.36: a round, bevelled, slightly irregular dough disc (smooth silhouette) with raised chips on both faces."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded
TAU_ = math.tau

DOUGH, EDGE, CHIP = 0xe0a868, 0xc98a4a, 0x5a3220
import bpy, bmesh


class CookieProp(Prop):
    """a kit Prop whose 'raw' layers keep their exact geometry (no voxel remesh): a truly round, clean outline"""
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
        skin.name = skin.data.name = self.kind if self._cur == 'skin' else self._cur
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


p = CookieProp('prop_cookie', base=DOUGH)
p.layers['skin']['raw'] = True
# a round, softly domed, bevelled disc (48 segments, exact geometry) with a gentle hand-made wobble in its outline
PROF = [(0, 0.085), (0.12, 0.083), (0.22, 0.077), (0.28, 0.068), (0.315, 0.056), (0.34, 0.038), (0.355, 0.016), (0.358, 0.0),
        (0.355, -0.016), (0.34, -0.036), (0.315, -0.052), (0.28, -0.064), (0.22, -0.072), (0.12, -0.077), (0, -0.078)]
SEG = 48
wob = lambda a: 1 + 0.018 * math.sin(3 * a + 0.4) + 0.01 * math.sin(5 * a + 1.3)
verts = [(r * wob(TAU_ * i / SEG) * math.cos(TAU_ * i / SEG), r * wob(TAU_ * i / SEG) * math.sin(TAU_ * i / SEG), z) for i in range(SEG) for r, z in PROF]
K = len(PROF)
faces = [(i * K + k, i * K + k + 1, ((i + 1) % SEG) * K + k + 1, ((i + 1) % SEG) * K + k) for i in range(SEG) for k in range(K - 1)]
p.mesh(verts, faces)
# the baked rim band all round the edge (a clean circle on each face)
p.paint_fn(lambda q, n: math.hypot(q.x, q.y) > 0.3 * wob(math.atan2(q.y, q.x)), EDGE)


def face_z(r, side):
    pts = PROF[:8] if side > 0 else PROF[7:][::-1]
    for (r0, z0), (r1, z1) in zip(pts, pts[1:]):
        if r0 <= r <= r1:
            return z0 + (z1 - z0) * (r - r0) / (r1 - r0)
    return pts[-1][1]


# raised chocolate chips on BOTH faces: little round domes, exact geometry
p.layer('chips', base=CHIP)
p.layers['chips']['raw'] = True
CHIP_PROF = [(0, -0.01), (0.024, -0.01), (0.04, 0.012), (0.05, 0.027), (0.047, 0.037), (0.034, 0.047), (0.016, 0.053), (0, 0.054)]   # undercut: widest ring well above the dough, so the ink hugs it
for side, chips in ((1, [(0, 0), (0.17, 0.3), (0.19, 1.6), (0.2, 2.9), (0.16, 4.1), (0.21, 5.2), (0.08, 2.2)]),
                    (-1, [(0.05, 0.8), (0.18, 1.1), (0.2, 2.4), (0.17, 3.6), (0.2, 4.8), (0.1, 5.9)])):
    for i, (r, a) in enumerate(chips):
        x, y = r * math.cos(a), r * math.sin(a)
        sc = 0.85 + 0.3 * ((i * 7) % 5) / 4
        p.lathe([(cr * sc, cz) for cr, cz in CHIP_PROF], pos=(x, y, face_z(r, side)), rot=(90 if side > 0 else -90, 0, 0), seg=14,
                scale=(1.0, 0.8 + 0.1 * (i % 3)))
p.layer('skin')
p.bone('body', (0, -0.35, 0), (0, 0.35, 0))
p.extras['outline'] = 0.014
p.build()
