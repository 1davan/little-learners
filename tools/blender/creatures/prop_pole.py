"""Beach umbrella pole (Where's Crab? umbrella, Bear's beach umbrella). Origin at the foot, 3.1 tall (the game scales
it; Where's Crab squashes it for the 'under' gag, so it is its own model under prop_parasol's canopy, whose hub hides
its top). A sturdy cream pole with a red candy stripe, a chunky tilt joint with a wing-nut knob half way up, a rounded
top cap, set in a little heap of sand with a few lumps and a tiny pink shell."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded, TAU

H, PR, JY = 3.1, 0.094, 1.5
CREAM, RED, JOINT, SAND, SAND_D = 0xfffaf0, 0xff5a5a, 0xf3ece0, 0xf2cf7e, 0xd9b062


class Clean(Prop):
    """hard-surface: layers are clean swept / revolved pieces joined as they are (no voxel remesh)"""
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
        bmesh.ops.triangulate(bm, faces=bm.faces[:])
        print('CLEAN', self._cur, 'tris', len(bm.faces))
        bm.to_mesh(skin.data)
        bm.free()
        skin.data.update()
        for f in skin.data.polygons:
            f.use_smooth = True
        return skin


def dense(pts, step):
    out = [pts[0]]
    for a, b in zip(pts, pts[1:]):
        n = max(1, int(math.hypot(b[0] - a[0], b[1] - a[1]) / step + 0.999))
        out += [(a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n) for k in range(1, n + 1)]
    return out


p = Clean('prop_pole', base=CREAM)
# the pole (one revolved piece, densely ringed so the spiral stripe cuts cleanly), with a rounded top cap
p.lathe(dense(rounded([(0, 0.02), (PR, 0.02), (PR, H - 0.02), (0, H - 0.02)], 0.05, n=3), 0.06), seg=20)
spiral = lambda q: 0.18 < q.y < H - 0.12 and ((q.y * 1.35 + math.atan2(q.x, q.z) / TAU) % 1.0) < 0.42
p.paint_fn(lambda q, n: spiral(q) and abs(q.y - JY) > 0.2, RED)
# tilt joint: a collar knuckle, a hinge barrel across it and a wing-nut knob on the side
p.layer('joint', base=JOINT)
p.cyl((0, JY - 0.17, 0), 0.13, 0.34, bevel=0.05, seg=20)
p.cyl((0, JY, -0.16), 0.09, 0.32, rot=(90, 0, 0), bevel=0.035, seg=16)
p.cyl((0.11, JY, 0), 0.032, 0.1, rot=(0, 0, -90), bevel=0.012, seg=10)
p.box((0.225, JY, 0), (0.026, 0.085, 0.05), bevel=0.022)
p.paint_fn(lambda q, n: q.x > 0.19, RED)
# a little heap of sand round the foot
p.layer('sand', base=SAND)
mound = [(0, 0)] + [(0.52 * (1 - k / 10) + 0.02, 0.3 * math.sin(math.pi / 2 * k / 10) ** 0.8) for k in range(11)] + [(0, 0.3)]
p.lathe(rounded(mound, 0.05, n=3), seg=36)
for k, (a, rr, s) in enumerate([(0.6, 0.56, 0.1), (2.3, 0.58, 0.08), (3.3, 0.55, 0.07), (4.6, 0.57, 0.09)]):
    p.lathe([(s * math.sin(math.pi / 2 * j / 5), s * 0.7 * math.cos(math.pi / 2 * j / 5)) for j in range(6)] + [(0, 0)],
            pos=(rr * math.sin(a), 0.0, rr * math.cos(a)), scale=(1.3, 1.0), seg=14)   # little sand lumps
p.paint_fn(lambda q, n: q.y < 0.025, SAND_D)
# a few darker sand speckles on the heap
SPECKS = [(math.radians(d), h) for d, h in ((10, 0.12), (55, 0.2), (95, 0.08), (140, 0.16), (190, 0.22), (230, 0.1), (280, 0.18), (320, 0.13), (350, 0.24))]
def _speck(q):
    if q.y < 0.04:
        return False
    a = math.atan2(q.x, q.z)
    return any(((a - a0 + math.pi) % TAU - math.pi) ** 2 * 0.09 + (q.y - h) ** 2 < 0.028 ** 2 for a0, h in SPECKS)
p.paint_fn(lambda q, n: _speck(q), SAND_D)
p.layer('shell', base=0xffb6c9)
p.lathe(rounded([(0, 0), (0.075, 0), (0.05, 0.045), (0, 0.05)], 0.02, n=2), pos=(0.27, 0.13, 0.25), rot=(-35, 30, 10), scale=(1.0, 0.85), seg=10)
p.layer('skin')
p.bone('root', (0, 0, 0), (0, H, 0))
p.extras['outline'] = 0.016
p.build()
