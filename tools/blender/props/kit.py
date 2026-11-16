"""Prop kit: lib.Creature + soft solid primitives for static toy props (buckets, boxes, stalls...).

Everything is in GAME space (x right, y up, z toward camera, floor at y = 0), like lib.py.
Primitives join the layer's metaball blobs at the voxel remesh, so a prop is one soft clay skin per layer:
    p.box(pos, half_size, rot, bevel)          rounded box
    p.cyl(pos, r, h, r2=None, bevel)           (tapered) cylinder standing on pos (pos = centre of the bottom)
    p.lathe(profile, pos, scale=(sx, sz))      revolve a (r, y) polyline about y; closed=True for a hollow wall loop
    p.tube(path, radius, closed=False)         a round tube swept along a polyline (handles, pipes, rims, torus)
    p.ring(pos, R, r, rot)                     a torus (tube along a circle) lying flat (rot to stand it up)
Use rounded(pts, r) to soften the corners of a profile/path.
Static props: one 'body' bone. Moving parts: extra bones with region= (lids, doors, flaps, handles, wheels).
Each build prints the glb size.
"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
import bpy, bmesh
from mathutils import Vector, Matrix, Euler
from lib import Creature, G, hexcol, OUT_DIR

TAU = math.pi * 2
_C = Matrix(((1, 0, 0), (0, 0, -1), (0, 1, 0)))   # game -> blender


def rot_m(rot):
    return Euler([math.radians(a) for a in rot], 'XYZ').to_matrix()


def rounded(pts, r, n=4, closed=False):
    """Round every interior corner of a 2D/3D polyline with a quadratic arc of size r (endpoints kept unless closed)."""
    P = [Vector(p) for p in pts]
    m = len(P)
    out = []
    rng = range(m) if closed else range(1, m - 1)
    if not closed:
        out.append(P[0])
    for i in rng:
        p0, p1, p2 = P[i - 1], P[i], P[(i + 1) % m]
        a, b = p0 - p1, p2 - p1
        rr = min(r, a.length * 0.45, b.length * 0.45)
        if rr < 1e-5:
            out.append(p1); continue
        s, e = p1 + a.normalized() * rr, p1 + b.normalized() * rr
        for k in range(n + 1):
            t = k / n
            out.append((1 - t) ** 2 * s + 2 * (1 - t) * t * p1 + t * t * e)
    if not closed:
        out.append(P[-1])
    return [tuple(v) for v in out]


def star_poly(r, inner=0.5, n=5, rot=90, soft=2):
    pts = []
    for i in range(n * 2):
        a = math.radians(rot + 180 * i / n)
        rr = r if i % 2 == 0 else r * inner
        pts.append((rr * math.cos(a), rr * math.sin(a)))
    return [p[:2] for p in rounded(pts, r * 0.12, n=soft, closed=True)]


def circle_poly(r, n=24, sx=1.0, sy=1.0):
    return [(r * sx * math.cos(TAU * i / n), r * sy * math.sin(TAU * i / n)) for i in range(n)]


def arc(cx, cy, r, a0, a1, n=12):
    """points on a circle arc in a 2D plane (degrees)"""
    return [(cx + r * math.cos(math.radians(a0 + (a1 - a0) * i / n)), cy + r * math.sin(math.radians(a0 + (a1 - a0) * i / n))) for i in range(n + 1)]


class Prop(Creature):
    def __init__(self, kind, base=0xffffff, voxel=0.02, target_faces=3000, smooth=4):
        super().__init__(kind, base=base, voxel=voxel, target_faces=target_faces)
        self.smooth_iters = smooth
        self.quadriflow = True
        self.extras['outline'] = 0.025

    # ---------- primitives ----------
    def _prims(self):
        return self.layers[self._cur].setdefault('prims', [])

    def mesh(self, verts, faces, bevel=0):
        self._prims().append(('mesh', [tuple(v) for v in verts], faces, bevel))

    def box(self, pos, size, rot=(0, 0, 0), bevel=0.06):
        self._prims().append(('box', pos, size, rot, bevel))

    def lathe(self, profile, pos=(0, 0, 0), rot=(0, 0, 0), scale=(1, 1), seg=48, closed=False, a0=0.0, a1=TAU):
        """Revolve [(r, y), ...] about the y axis. Open profiles should start and end on the axis (r = 0) to be solid,
        or are capped. closed=True: the profile is a loop (a hollow wall cross-section, e.g. a pail)."""
        R = rot_m(rot)
        n = len(profile)
        full = abs(a1 - a0 - TAU) < 1e-6
        rings = seg if full else seg + 1
        verts, faces = [], []
        for i in range(rings):
            a = a0 + (a1 - a0) * i / seg
            for r, y in profile:
                v = Vector((r * math.sin(a) * scale[0], y, r * math.cos(a) * scale[1]))
                verts.append(R @ v + Vector(pos))
        for i in range(seg):
            j = (i + 1) % rings
            for k in range(n if closed else n - 1):
                k2 = (k + 1) % n
                faces.append((i * n + k, j * n + k, j * n + k2, i * n + k2))
        if not closed:
            for k in (0, n - 1):
                if profile[k][0] > 1e-6:
                    c = len(verts); verts.append(R @ Vector((0, profile[k][1], 0)) + Vector(pos))
                    for i in range(seg):
                        faces.append((c, i * n + k, ((i + 1) % rings) * n + k))
        if not full:   # a wedge: close the two cut faces with the profile polygon
            faces.append(tuple(range(n)))
            faces.append(tuple(seg * n + k for k in range(n)))
        self.mesh(verts, faces)

    def cyl(self, pos, r, h, r2=None, rot=(0, 0, 0), bevel=0.05, scale=(1, 1), seg=40):
        r2 = r if r2 is None else r2
        prof = rounded([(0, 0), (r, 0), (r2, h), (0, h)], bevel, n=3) if bevel else [(0, 0), (r, 0), (r2, h), (0, h)]
        self.lathe(prof, pos=pos, rot=rot, scale=scale, seg=seg)

    def tube(self, path, radius, closed=False, rseg=12, caps=True):
        """Sweep a circle along a game-space polyline. radius: number or per-point list."""
        P = [Vector(p) for p in path]
        m = len(P)
        Rr = radius if isinstance(radius, (list, tuple)) else [radius] * m
        verts, faces = [], []
        prev_n = None
        for i in range(m):
            if closed:
                t = (P[(i + 1) % m] - P[i - 1])
            else:
                t = (P[min(i + 1, m - 1)] - P[max(i - 1, 0)])
            t.normalize()
            if prev_n is None:
                up = Vector((0, 1, 0)) if abs(t.y) < 0.9 else Vector((1, 0, 0))
                nrm = (up - t * up.dot(t)).normalized()
            else:
                nrm = (prev_n - t * prev_n.dot(t)).normalized()
            prev_n = nrm
            bn = t.cross(nrm)
            for k in range(rseg):
                a = TAU * k / rseg
                verts.append(P[i] + (nrm * math.cos(a) + bn * math.sin(a)) * Rr[i])
        segs = m if closed else m - 1
        for i in range(segs):
            j = (i + 1) % m
            for k in range(rseg):
                k2 = (k + 1) % rseg
                faces.append((i * rseg + k, i * rseg + k2, j * rseg + k2, j * rseg + k))
        if not closed and caps:
            for i in (0, m - 1):
                c = len(verts); verts.append(P[i])
                for k in range(rseg):
                    faces.append((c, i * rseg + k, i * rseg + (k + 1) % rseg))
        self.mesh(verts, faces)

    def ring(self, pos, R, r, rot=(0, 0, 0), scale=(1, 1), seg=48, a0=0.0, a1=TAU, rseg=12):
        """torus lying flat (axis y), centre pos. a0..a1: partial arc (radians, measured from +z toward +x)."""
        M = rot_m(rot)
        full = abs(a1 - a0 - TAU) < 1e-6
        n = seg if full else seg + 1
        pts = []
        for i in range(n):
            a = a0 + (a1 - a0) * i / seg
            pts.append(M @ Vector((R * math.sin(a) * scale[0], 0, R * math.cos(a) * scale[1])) + Vector(pos))
        self.tube(pts, r, closed=full, rseg=rseg)

    def sticker(self, poly, cy, r_of_y, thick=0.05, ang=0.0, lift=0.0):
        """A thin slab in the shape of a star-shaped 2D polygon [(x, y)...] (around its own (0, 0)), wrapped onto a round
        wall of radius r_of_y(y) facing +z (turned by ang radians about y), centred at height cy. Put it in its own
        layer so its colour edge is crisp and inked."""
        verts, faces = [], []
        m = len(poly)
        for d in (-thick * 0.5 + lift, thick * 0.5 + lift):
            verts.append(self._wrap(0, cy, d, r_of_y, ang))
            for x, y in poly:
                verts.append(self._wrap(x, cy + y, d, r_of_y, ang))
        k = m + 1
        for i in range(m):
            j = (i + 1) % m
            faces.append((0, 1 + j, 1 + i))
            faces.append((k, k + 1 + i, k + 1 + j))
            faces.append((1 + i, 1 + j, k + 1 + j, k + 1 + i))
        self.mesh(verts, faces)

    @staticmethod
    def _wrap(x, y, d, r_of_y, ang):
        r = r_of_y(y) + d
        a = x / max(r, 1e-3) + ang
        return (r * math.sin(a), y, r * math.cos(a))

    # ---------- build ----------
    def _metaballs(self):
        objs = super()._metaballs() if self.groups else []
        for pr in self.layers[self._cur].get('prims', []):
            if pr[0] == 'box':
                _, pos, size, rot, bevel = pr
                bpy.ops.mesh.primitive_cube_add(size=2)
                ob = bpy.context.active_object
                sx, sy, sz = size
                Mg = rot_m(rot)
                Mb = _C @ Mg @ _C.inverted()
                ob.matrix_world = Matrix.Translation(G(pos)) @ Mb.to_4x4() @ Matrix.Diagonal((sx, sz, sy, 1))
                bpy.ops.object.select_all(action='DESELECT')
                ob.select_set(True)
                bpy.context.view_layer.objects.active = ob
                bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
                if bevel:
                    md = ob.modifiers.new('bev', 'BEVEL')
                    md.width = min(bevel, min(size) * 0.95)
                    md.segments = 4
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
        L = self.layers[self._cur]
        skin.data.remesh_voxel_size = L.get('voxel') or self.voxel
        bpy.ops.object.voxel_remesh()
        n = len(skin.data.polygons)
        tf = L.get('target_faces') or (self.target_faces if self._cur == 'skin' else 1500)
        done = False
        if n > tf and self.quadriflow:
            # even quads (decimation leaves long slivers that streak the toon shading on smooth curved walls)
            try:
                r = bpy.ops.object.quadriflow_remesh(target_faces=int(tf / 2), use_preserve_sharp=False, use_preserve_boundary=False, smooth_normals=False, seed=1)
                done = 'FINISHED' in r and len(skin.data.polygons) > tf * 0.2
            except Exception as e:
                print('quadriflow failed', e)
        if n > tf and not done:
            d = skin.modifiers.new('dec', 'DECIMATE')
            d.ratio = tf / (2 * n)   # voxel remesh gives quads; collapse counts triangles
            bpy.ops.object.modifier_apply(modifier='dec')
        if self.smooth_iters:
            sm = skin.modifiers.new('smooth2', 'CORRECTIVE_SMOOTH')
            sm.iterations = self.smooth_iters
            sm.smooth_type = 'LENGTH_WEIGHTED'
            sm.use_only_smooth = True
            bpy.ops.object.modifier_apply(modifier='smooth2')
        bpy.ops.object.shade_smooth()
        return skin

    def build(self, out=None):
        if not self.bones:
            self.bone('body', (0, 0, 0), (0, 1, 0))
        self.weight_smooth = min(self.weight_smooth, 2)
        path = super().build(out)
        tot = sum(len(o.data.polygons) for o in bpy.data.objects if o.type == 'MESH')
        print('WROTE size', self.kind, '%.0f KB' % (os.path.getsize(path) / 1024), 'faces(all layers)', tot)
        return path
