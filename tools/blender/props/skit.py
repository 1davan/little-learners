"""Scenery kit: kit.Prop plus bevelled prisms (extruded 2D outlines) for buildings and furniture.
    s.prism(poly, z0, z1, bevel, axis='z', at=(x, y, z))   extrude a 2D outline [(a, b)...] (a = x, b = y for axis z)
    offset_line(pts, d)                                     offset an open 2D polyline sideways (left of travel = +d)
Scenery props are drawn by scenery.js as plain static meshes (one per layer), so each layer is one draw call (+ ink).
"""
import sys, os, math
sys.path.insert(0, os.path.dirname(__file__))
from kit import Prop, rounded, TAU, star_poly, circle_poly, arc   # noqa: F401  (re-exported for the prop scripts)


class SProp(Prop):
    def __init__(self, kind, hard=True, **kw):
        super().__init__(kind, **kw)
        # hard-surface scenery: decimate the voxel skin instead of quadriflow (keeps flat walls flat and thin trim crisp)
        self.quadriflow = not hard

    def prism(self, poly, z0, z1, bevel=0.05, axis='z', at=(0, 0, 0)):
        """Extrude a 2D polygon. axis 'z': poly is (x, y), extruded along z. axis 'x': poly is (z, y), along x.
        axis 'y': poly is (x, z), along y. bevel rounds every edge (a bevel modifier before the remesh)."""
        n = len(poly)
        verts = []
        for d in (z0, z1):
            for a, b in poly:
                if axis == 'z':
                    v = (a, b, d)
                elif axis == 'x':
                    v = (d, b, a)
                else:
                    v = (a, d, b)
                verts.append((v[0] + at[0], v[1] + at[1], v[2] + at[2]))
        faces = [tuple(range(n)), tuple(range(2 * n - 1, n - 1, -1))]
        for i in range(n):
            j = (i + 1) % n
            faces.append((i, n + i, n + j, j))
        self._prims().append(('mesh', verts, faces, bevel))

    def _skin(self):
        """Layers built only from prims (boxes, prisms, lathes, tubes) skip the voxel remesh: the bevelled pieces are
        joined as they are (clean flat walls, crisp edges, few triangles), then long edges are split so paint borders
        cut cleanly and flat faces keep flat normals away from their bevels. Layers with metaball blobs remesh."""
        import bpy, bmesh
        L = self.layers[self._cur]
        if self.groups or L.get('remesh'):
            q = self.quadriflow
            self.quadriflow = L.get('quadriflow', True)
            try:
                return super()._skin()
            finally:
                self.quadriflow = q
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
        bm.normal_update()
        # big flat faces keep flat normals: mark their border with the bevel strips sharp (the export splits normals
        # there). Bevels stay smooth among themselves. scenery.js inks with merged smooth normals, so no cracks.
        def main(f):
            per = f.calc_perimeter()
            return f.calc_area() > 0.004 and f.calc_area() / (per * per + 1e-9) > 0.02
        is_main = {f: main(f) for f in bm.faces}
        for e in bm.edges:
            if len(e.link_faces) == 2:
                a, b = e.link_faces
                if (is_main[a] or is_main[b]) and a.normal.angle(b.normal, 0) > math.radians(10):
                    e.smooth = False
        bmesh.ops.triangulate(bm, faces=bm.faces[:])
        emax = L.get('edge')
        for _ in range(8 if emax else 0):
            long = [e for e in bm.edges if e.calc_length() > emax]
            if not long:
                break
            bmesh.ops.subdivide_edges(bm, edges=long, cuts=1, use_grid_fill=False)
            bmesh.ops.triangulate(bm, faces=bm.faces[:])
        print('CLEAN', self._cur, 'tris', len(bm.faces))
        bm.to_mesh(skin.data)
        bm.free()
        skin.data.update()
        for f in skin.data.polygons:
            f.use_smooth = True
        return skin

    box_segments = 3

    def _metaballs(self):
        import bpy
        objs = super()._metaballs()
        prims = self.layers[self._cur].get('prims', [])
        tail = objs[len(objs) - len(prims):] if prims else []
        for pr, ob in zip(prims, tail):
            if pr[0] == 'box' and ob.modifiers:
                segs = self.layers[self._cur].get('segs') or self.box_segments
                ob.modifiers[0].segments = 1 if pr[4] <= 0.02 else segs
            if pr[0] == 'mesh' and pr[3]:
                md = ob.modifiers.new('bev', 'BEVEL')
                md.width = pr[3]
                md.segments = self.layers[self._cur].get('psegs') or 3
                md.limit_method = 'ANGLE'
                md.angle_limit = math.radians(25)
                md.harden_normals = False
        return objs


def dome_profile(r, h, n=12, base=0.0, lip=0.0):
    """(r, y) points of a smooth dome of radius r and height h from y = base (a lip juts out first), ending on the axis."""
    pts = [(0, base), (r + lip, base)] if lip else [(0, base)]
    for i in range(n + 1):
        a = (math.pi / 2) * i / n
        pts.append((r * math.cos(a), base + h * math.sin(a)))
    pts[-1] = (0, base + h)
    return pts


def offset_line(pts, d):
    """Offset an open 2D polyline by d to the left of its direction of travel (miter joins)."""
    out = []
    m = len(pts)
    for i in range(m):
        p = pts[i]
        dirs = []
        if i > 0:
            dirs.append((p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]))
        if i < m - 1:
            dirs.append((pts[i + 1][0] - p[0], pts[i + 1][1] - p[1]))
        ns = []
        for dx, dy in dirs:
            L = math.hypot(dx, dy) or 1
            ns.append((-dy / L, dx / L))
        nx, ny = sum(n[0] for n in ns) / len(ns), sum(n[1] for n in ns) / len(ns)
        k = max(nx * nx + ny * ny, 0.3)          # |avg normal|^2 = cos^2(half angle): the miter stretch
        out.append((p[0] + nx * d / k, p[1] + ny * d / k))
    return out
