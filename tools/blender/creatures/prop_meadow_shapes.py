"""Shape house models (facades, windows, pieces, gags).
Facades are modelled in the theme group's space, centred on the wall's middle plane (the game puts the wrapper at
z = WALL_Z - 0.35 = -1.35); the wall's front face is at model z +0.3 (cottage) / +0.35 (train, castle).
  prop_m_cottage    cream cottage wall 9.4 x 4.6 + red roof with scalloped tile rows (layers 'tiles0'..'tiles3'),
                    no chimney / door (separate, they move); an arched doorway at x 0 that the door fills exactly.
  prop_m_chimney    brick chimney 0.7 x 1.4, centred.            prop_m_door   wooden arched door 1.4 x 1.7 x 0.16, centred.
  prop_m_train      blue carriage + green engine (no wheels / funnel: separate), a coupling between them.
  prop_m_funnel     the engine's funnel, centred (1.2 tall).     prop_m_wheel  a train wheel facing +z, radius 0.62.
  prop_m_castlewall stone wall with merlons and a gate arch (towers / flags / drawbridge separate).
  prop_m_tower      round stone tower on y 0 (5.6 tall) with a cone roof (layer 'roof', recoloured) and a pole.
  prop_m_flag       a pennant reaching +x from its pole edge (TINT).   prop_m_bridge  plank drawbridge, hinge at y 0.
  prop_m_lamp       a fairy-light bulb (TINT: pale glass when off, the lamp colour when lit) with a gold screw cap.
  prop_m_win_<k>    a chunky window frame round shape k (circle / square / triangle / rect) at unit size (TINT).
  prop_m_flowerbox  a window flower box 1.7 x 0.36 x 0.5 (TINT = box), layer 'flowers' (soil + flowers).
  prop_m_piece_<k>  a puffy toy shape piece (TINT), layers 'dots' (white spots) and 'gems' (white jewels).
  prop_m_partyhat, prop_m_crown, prop_m_bow, prop_m_glasses: the gags (bases at y 0 except glasses, centred).
ONLY=prop_m_cottage tools/blender/build.sh prop_meadow_shapes

MProp (also used by prop_meadow_stage.py) adds three tools to the prop kit for clean paint on big set pieces:
  p.raw()                   this layer keeps its primitives' exact geometry (no voxel remesh), so lathe rings / grid lines
                            can carry colour borders exactly and flat faces stay flat.
  p.cut(co, no, region)     slice this layer's finished mesh with a plane (game space; only faces where
                            region(centre, normal) holds), so a straight colour border lies exactly on an edge.
  p.refine(edge, region=)   before painting, split triangles a colour border runs through until they're shorter than
                            edge, so curved borders come out smooth instead of saw-toothed.
Ink note: the outline is an inverted hull, so a sticker / tile only gets its ink line where its widest ring sits in front
of the surface behind it; stacked tiles and frames are spaced for that."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'props'))
import bpy, bmesh
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree
from mathutils.interpolate import poly_3d_calc
from kit import Prop, rounded, circle_poly, star_poly, rot_m
from lib import G

ONLY = [s for s in os.environ.get('ONLY', '').split(',') if s]
WHITE, INK, DARK = 0xffffff, 0x3a2838, 0x3a2f5b
TAU = math.tau
_INV = Matrix(((1, 0, 0), (0, 0, 1), (0, -1, 0)))   # blender -> game


class MProp(Prop):
    def raw(self):
        self.layers[self._cur]['raw'] = True
        return self

    def cut(self, co, no, region=None):
        self.layers[self._cur].setdefault('cuts', []).append((tuple(co), tuple(no), region))
        return self

    def cuts(self, axis, values, region=None):
        no = {'x': (1, 0, 0), 'y': (0, 1, 0), 'z': (0, 0, 1)}[axis]
        for v in values:
            self.cut(tuple(c * v for c in no), no, region)
        return self

    def refine(self, edge=0.03, passes=4, region=None, coarse=None, coarse_region=None):
        """coarse: first split every triangle in coarse_region (centre, normal) down to this edge length (big flat
        n-gon caps are long slivers that would hide small paint shapes from the border test)"""
        self.layers[self._cur]['refine'] = (edge, passes, region, coarse, coarse_region)
        return self

    def _skin(self):
        L = self.layers[self._cur]
        if not L.get('raw'):
            return super()._skin()
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
        bm = bmesh.new()
        bm.from_mesh(skin.data)
        bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
        bmesh.ops.triangulate(bm, faces=bm.faces[:], quad_method='BEAUTY', ngon_method='BEAUTY')
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        bm.to_mesh(skin.data)
        bm.free()
        bpy.ops.object.shade_smooth()
        return skin

    def facepaint(self):
        """colour this layer face by face (from each face's centre) with no extra cutting: for layers whose colour
        borders already lie on edges (lathe rings, grid lines, cut planes), so nothing gets re-split"""
        self.layers[self._cur]['facepaint'] = True
        return self

    def _paint(self, skin):
        L = self.layers[self._cur]
        keep = self._snapshot(skin)
        if L.get('cuts'):
            self._cutmesh(skin, L['cuts'])
        if L.get('refine') and self.paints:
            self._refine(skin, *L['refine'])
        if L.get('facepaint'):
            self._facepaint(skin)
        else:
            super()._paint(skin)
        self._renormal(skin, keep)

    def _facepaint(self, skin):
        me = skin.data
        col = self._col()
        for old in list(me.color_attributes):
            me.color_attributes.remove(old)
        attr = me.color_attributes.new('Col', 'FLOAT_COLOR', 'CORNER')
        for poly in me.polygons:
            c = col(_INV @ Vector(poly.center), _INV @ Vector(poly.normal))
            for li in poly.loop_indices:
                attr.data[li].color = c
        me.color_attributes.active_color = attr
        mat = bpy.data.materials.new(self.kind + '_' + self._cur)
        mat.use_nodes = True
        nt = mat.node_tree
        bsdf = nt.nodes.get('Principled BSDF')
        vc = nt.nodes.new('ShaderNodeVertexColor')
        vc.layer_name = 'Col'
        nt.links.new(vc.outputs['Color'], bsdf.inputs['Base Color'])
        me.materials.append(mat)

    @staticmethod
    def _snapshot(skin):
        """the surface's smooth normals before any cutting (vertices added by cuts / crisp paint get facet normals,
        which make the inverted-hull outline poke through as ink specks)"""
        bm = bmesh.new()
        bm.from_mesh(skin.data)
        bmesh.ops.triangulate(bm, faces=bm.faces[:])
        bm.normal_update()
        bm.faces.ensure_lookup_table()
        tris = [[(v.co.copy(), v.normal.copy()) for v in f.verts] for f in bm.faces]
        bvh = BVHTree.FromBMesh(bm)
        bm.free()
        return bvh, tris

    @staticmethod
    def _renormal(skin, keep):
        bvh, tris = keep
        me = skin.data
        out = []
        for v in me.vertices:
            loc, fn, idx, d = bvh.find_nearest(v.co)
            if idx is None:
                out.append(v.normal.copy())
                continue
            t = tris[idx]
            w = poly_3d_calc([t[0][0], t[1][0], t[2][0]], loc)
            n = t[0][1] * w[0] + t[1][1] * w[1] + t[2][1] * w[2]
            out.append(n.normalized() if n.length > 1e-6 else v.normal.copy())
        me.normals_split_custom_set_from_vertices(out)

    def _cutmesh(self, skin, cuts):
        me = skin.data
        bm = bmesh.new()
        bm.from_mesh(me)
        for co, no, region in cuts:
            bm.normal_update()
            faces = [f for f in bm.faces if region is None or region(_INV @ f.calc_center_median(), _INV @ f.normal)]
            if not faces:
                continue
            geom = set(faces)
            for f in faces:
                geom.update(f.edges)
                geom.update(f.verts)
            bmesh.ops.bisect_plane(bm, geom=list(geom), dist=1e-5, plane_co=G(co), plane_no=G(no))
        bm.to_mesh(me)
        bm.free()
        me.update()

    def _col(self):
        base = self.base
        paints = [pp for pp in self.paints if pp[0] != 'decal']

        def col(gp, gn):
            c = base
            for kind, data, cc in paints:
                if kind == 'ell':
                    d = data['rot'] @ (gp - data['center'])
                    s = data['size']
                    if (d.x / s.x) ** 2 + (d.y / s.y) ** 2 + (d.z / s.z) ** 2 <= 1.0 and (data['only'] is None or data['only'](gp)):
                        c = cc
                elif kind == 'group':
                    if self.owner(gp) in data['groups'] and (data['only'] is None or data['only'](gp)):
                        c = cc
                elif data(gp, gn):
                    c = cc
            return c
        return col

    def _refine(self, skin, edge, passes, region, coarse=None, coarse_region=None):
        col = self._col()
        me = skin.data
        for _ in range(passes):
            bm = bmesh.new()
            bm.from_mesh(me)
            bm.normal_update()
            vc = {v: col(_INV @ v.co, _INV @ v.normal) for v in bm.verts}
            mark = set()
            for f in bm.faces:
                if max(e.calc_length() for e in f.edges) <= edge:
                    continue
                ctr = f.calc_center_median()
                n = _INV @ f.normal
                vs = [v.co.copy() for v in f.verts]
                mids = [(vs[i] + vs[(i + 1) % len(vs)]) * 0.5 for i in range(len(vs))]
                if coarse and max(e.calc_length() for e in f.edges) > coarse and (coarse_region is None or coarse_region(_INV @ ctr, n)):
                    for e in f.edges:
                        if e.calc_length() > coarse:
                            mark.add(e)
                    continue
                if region is not None and not any(region(_INV @ q, n) for q in [ctr] + vs + mids):
                    continue
                cs = {vc[v] for v in f.verts}
                mixed = len(cs) > 1
                if not mixed:
                    c0 = next(iter(cs))
                    pts = [ctr] + mids
                    pts += [(ctr + q) * 0.5 for q in pts[1:]] + [(ctr + q) * 0.5 for q in vs]
                    for q in pts:
                        if col(_INV @ q, n) != c0:
                            mixed = True
                            break
                if mixed:
                    for e in f.edges:
                        if e.calc_length() > edge:
                            mark.add(e)
            if not mark:
                bm.free()
                break
            bmesh.ops.subdivide_edges(bm, edges=list(mark), cuts=1, use_grid_fill=True)
            bmesh.ops.triangulate(bm, faces=bm.faces[:])
            bm.to_mesh(me)
            bm.free()
            me.update()


# ---------------- 2D / mesh helpers ----------------
def ccw(poly):
    n = len(poly)
    a = sum(poly[i][0] * poly[(i + 1) % n][1] - poly[(i + 1) % n][0] * poly[i][1] for i in range(n))
    return list(poly) if a > 0 else list(poly)[::-1]


def slab(p, poly, z, thick, rot=(0, 0, 0), off=(0, 0, 0)):
    M = rot_m(rot)
    m = len(poly)
    verts = []
    for d in (z - thick / 2, z + thick / 2):
        verts.append(tuple(M @ Vector((0, 0, d)) + Vector(off)))
        for x, y in poly:
            verts.append(tuple(M @ Vector((x, y, d)) + Vector(off)))
    faces = []
    k = m + 1
    for i in range(m):
        j = (i + 1) % m
        faces.append((0, 1 + j, 1 + i)); faces.append((k, k + 1 + i, k + 1 + j)); faces.append((1 + i, 1 + j, k + 1 + j, k + 1 + i))
    p.mesh(verts, faces)


def outline(kind, n=96):
    """the game's shape outlines (shapes-parts.js outline2D), dense"""
    if kind == 'circle':
        return [(0.68 * math.cos(TAU * i / n), 0.68 * math.sin(TAU * i / n)) for i in range(n)]
    if kind == 'square':
        pts = [(-0.62, -0.62), (0.62, -0.62), (0.62, 0.62), (-0.62, 0.62)]
    elif kind == 'rect':
        pts = [(-0.9, -0.45), (0.9, -0.45), (0.9, 0.45), (-0.9, 0.45)]
    else:
        h = 1.45
        pts = [(-0.84, -h / 3), (0.84, -h / 3), (0, 2 * h / 3)]
    return pts


def dense(pts, step=0.04, closed=True):
    out = []
    n = len(pts) if closed else len(pts) - 1
    for i in range(n):
        a, b = pts[i], pts[(i + 1) % len(pts)]
        L = math.hypot(b[0] - a[0], b[1] - a[1])
        k = max(1, int(L / step))
        for j in range(k):
            t = j / k
            out.append((a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t))
    if not closed:
        out.append(tuple(pts[-1]))
    return out


def inset(poly, d):
    """offset a CCW polygon inward by d (mitred; keep d below the corner radii)"""
    n = len(poly)
    out = []
    for i in range(n):
        x0, y0 = poly[i - 1]; x1, y1 = poly[i]; x2, y2 = poly[(i + 1) % n]
        e1 = (x1 - x0, y1 - y0); e2 = (x2 - x1, y2 - y1)
        l1 = math.hypot(*e1) or 1; l2 = math.hypot(*e2) or 1
        n1 = (-e1[1] / l1, e1[0] / l1); n2 = (-e2[1] / l2, e2[0] / l2)   # inward for CCW
        nx, ny = n1[0] + n2[0], n1[1] + n2[1]
        l = math.hypot(nx, ny) or 1
        cosh = max(0.3, (n1[0] * nx + n1[1] * ny) / l)
        out.append((x1 + nx / l * d / cosh, y1 + ny / l * d / cosh))
    # where the offset folds over itself (tight corners), pull the crossing points together instead
    for _ in range(60):
        changed = False
        for i in range(n):
            j = (i + 1) % n
            e0 = (poly[j][0] - poly[i][0], poly[j][1] - poly[i][1])
            e1 = (out[j][0] - out[i][0], out[j][1] - out[i][1])
            if e0[0] * e1[0] + e0[1] * e1[1] < -1e-12:
                mid = ((out[i][0] + out[j][0]) / 2, (out[i][1] + out[j][1]) / 2)
                out[i] = out[j] = mid
                changed = True
        if not changed:
            break
    return out


def soft_slab(p, poly, z0, depth, bh, bv=None, steps=2, flat=0.03, back=True, rot=(0, 0, 0), off=(0, 0, 0)):
    """a soft extrusion of any simple polygon (concave is fine) centred on z0, facing +z: round edges (bh across,
    bv deep), a flat ring so the cap shades evenly, n-gon caps. back=False: plain back (hidden against a wall)."""
    poly = ccw(poly)
    bv = bh if bv is None else bv
    half = depth / 2
    rings = []
    if back:
        rings.append((bh + flat, z0 - half))
        for k in range(steps + 1):
            th = -math.pi / 2 + math.pi / 2 * k / steps
            rings.append((bh * (1 - math.cos(th)), z0 - (half - bv) + bv * math.sin(th)))
    else:
        rings.append((0.0, z0 - half))
    for k in range(0 if (half - bv > 1e-4 or not back) else 1, steps + 1):
        th = math.pi / 2 * k / steps
        rings.append((bh * (1 - math.cos(th)), z0 + (half - bv) + bv * math.sin(th)))
    rings.append((bh + flat, z0 + half))
    M = rot_m(rot)
    O = Vector(off)
    m = len(poly)
    verts, faces = [], []
    for ins, z in rings:
        ip = inset(poly, ins) if ins > 1e-6 else poly
        for x, y in ip:
            verts.append(tuple(M @ Vector((x, y, z)) + O))
    R = len(rings)
    for r in range(R - 1):
        for i in range(m):
            j = (i + 1) % m
            faces.append((r * m + i, r * m + j, (r + 1) * m + j, (r + 1) * m + i))
    faces.append(tuple(range(m))[::-1])
    faces.append(tuple((R - 1) * m + i for i in range(m)))
    p.mesh(verts, faces)


def pillow(p, poly, depth, bevel, steps=5, z0=0.0):
    """a soft extrusion of a convex CCW polygon (rounded edge all round), centred on z0, facing +z"""
    rings = []
    for k in range(steps + 1):
        th = -math.pi / 2 + math.pi / 2 * k / steps
        rings.append((bevel * (1 - math.cos(th)), -(depth / 2 - bevel) + bevel * math.sin(th)))
    for k in range(steps + 1):
        th = math.pi / 2 * k / steps
        rings.append((bevel * (1 - math.cos(th)), (depth / 2 - bevel) + bevel * math.sin(th)))
    m = len(poly)
    verts, faces = [], []
    for ins, z in rings:
        ip = inset(poly, ins) if ins > 1e-6 else poly
        for x, y in ip:
            verts.append((x, y, z0 + z))
    R = len(rings)
    for r in range(R - 1):
        for i in range(m):
            j = (i + 1) % m
            faces.append((r * m + i, r * m + j, (r + 1) * m + j, (r + 1) * m + i))
    cb = len(verts); verts.append((sum(x for x, _ in poly) / m, sum(y for _, y in poly) / m, z0 - depth / 2))
    cf = len(verts); verts.append((sum(x for x, _ in poly) / m, sum(y for _, y in poly) / m, z0 + depth / 2))
    for i in range(m):
        j = (i + 1) % m
        faces.append((cb, j, i))
        faces.append((cf, (R - 1) * m + i, (R - 1) * m + j))
    p.mesh(verts, faces)


def lathe_at(p, profile, angles, pos=(0, 0, 0), rfn=None):
    """revolve [(r, y)...] (ends on the axis) through an explicit list of angles (radians from +z toward +x), so colour
    borders can sit exactly on meridians. rfn(a, r, y) -> r lets the radius wobble."""
    n, A = len(profile), len(angles)
    verts, faces = [], []
    for a in angles:
        for r, y in profile:
            rr = rfn(a, r, y) if rfn else r
            verts.append((pos[0] + rr * math.sin(a), pos[1] + y, pos[2] + rr * math.cos(a)))
    for i in range(A):
        j = (i + 1) % A
        for k in range(n - 1):
            faces.append((i * n + k, j * n + k, j * n + k + 1, i * n + k + 1))
    p.mesh(verts, faces)


def insert_y(prof, ys):
    """add profile points where segments cross the heights ys (so lathe rings sit exactly on colour borders)"""
    out = [prof[0]]
    for (r0, y0), (r1, y1) in zip(prof, prof[1:]):
        if abs(y1 - y0) > 1e-9:
            cr = sorted([y for y in ys if min(y0, y1) + 1e-6 < y < max(y0, y1) - 1e-6], reverse=(y1 < y0))
            for y in cr:
                t = (y - y0) / (y1 - y0)
                out.append((r0 + (r1 - r0) * t, y))
        out.append((r1, y1))
    return out


def insert_r(prof, rs):
    """add profile points where segments cross the radii rs"""
    out = [prof[0]]
    for (r0, y0), (r1, y1) in zip(prof, prof[1:]):
        if abs(r1 - r0) > 1e-9:
            cr = sorted([r for r in rs if min(r0, r1) + 1e-6 < r < max(r0, r1) - 1e-6], reverse=(r1 < r0))
            for r in cr:
                t = (r - r0) / (r1 - r0)
                out.append((r, y0 + (y1 - y0) * t))
        out.append((r1, y1))
    return out


def clip(poly, hp):
    """Sutherland-Hodgman: keep the part of poly where f(x, y) >= 0 (f linear)"""
    out = []
    n = len(poly)
    for i in range(n):
        a, b = poly[i], poly[(i + 1) % n]
        fa, fb = hp(*a), hp(*b)
        if fa >= 0:
            out.append(a)
        if (fa >= 0) != (fb >= 0):
            t = fa / (fa - fb)
            out.append((a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t))
    return out


def resample(poly, step):
    return dense(poly, step)


def smooth(poly, it=2, k=0.5):
    P = list(poly)
    for _ in range(it):
        n = len(P)
        P = [(P[i][0] * (1 - k) + (P[i - 1][0] + P[(i + 1) % n][0]) * k / 2, P[i][1] * (1 - k) + (P[i - 1][1] + P[(i + 1) % n][1]) * k / 2) for i in range(n)]
    return P


def simplify(poly, tol=0.004):
    """drop points that sit on a straight run (keeps curves dense, straight edges cheap)"""
    P = list(poly)
    changed = True
    while changed and len(P) > 8:
        changed = False
        out = []
        i = 0
        n = len(P)
        keep = [True] * n
        for i in range(1, n, 2):
            a, b, c = P[i - 1], P[i], P[(i + 1) % n]
            L = math.hypot(c[0] - a[0], c[1] - a[1]) or 1
            d = abs((c[0] - a[0]) * (a[1] - b[1]) - (a[0] - b[0]) * (c[1] - a[1])) / L
            if d < tol and L < 2.5:
                keep[i] = False
                changed = True
        P = [q for q, k in zip(P, keep) if k]
    return P


def arch(w, y0, y1, n=12):
    """a round-arched opening outline: half width w, from y0 up to the springing y1, semicircle on top (CCW)"""
    pts = [(-w, y0), (w, y0)]
    for i in range(n + 1):
        a = math.pi * i / n
        pts.append((w * math.cos(a), y1 + w * math.sin(a)))
    return pts


def fillet(pts, r, n=8, minlen=0.0):
    """round every corner of a closed polygon with a true circular arc of radius r (n segments per arc);
    minlen: only corners between two edges at least this long"""
    P = [Vector((q[0], q[1])) for q in pts]
    m = len(P)
    out = []
    for i in range(m):
        p0, p1, p2 = P[i - 1], P[i], P[(i + 1) % m]
        if min((p0 - p1).length, (p2 - p1).length) < minlen:
            out.append((p1.x, p1.y))
            continue
        a, b = (p0 - p1).normalized(), (p2 - p1).normalized()
        phi = math.acos(max(-1.0, min(1.0, a.dot(b))))
        t = min(r / math.tan(phi / 2), (p0 - p1).length * 0.49, (p2 - p1).length * 0.49)
        rr = t * math.tan(phi / 2)
        s0, s1 = p1 + a * t, p1 + b * t
        c = p1 + (a + b).normalized() * (rr / math.sin(phi / 2))
        v0, v1 = s0 - c, s1 - c
        a0, a1 = math.atan2(v0.y, v0.x), math.atan2(v1.y, v1.x)
        da = (a1 - a0 + math.pi) % TAU - math.pi
        for k in range(n + 1):
            ang = a0 + da * k / n
            out.append((c.x + rr * math.cos(ang), c.y + rr * math.sin(ang)))
    return out


def rrect(cx, cy, hw, hh, r, n=4):
    return fillet([(cx - hw, cy - hh), (cx + hw, cy - hh), (cx + hw, cy + hh), (cx - hw, cy + hh)], r, n)


# ---------------- facades ----------------
DOOR_Y = 0.85          # the game hangs the door (prop_m_door, centred) at y 0.85: it covers cottage y 0..1.7, x -0.7..0.7


def door_shape(g=0.0, y0=0.0, n=16):
    """the door's outline in cottage space (x +-0.7, y 0..1.7, round-arched top), grown by g (CCW)"""
    rx, ry, cy = 0.7 + g, 0.35 + g, 1.35
    pts = [(-rx, y0), (rx, y0)]
    for i in range(n + 1):
        a = math.pi * i / n
        pts.append((rx * math.cos(a), cy + ry * math.sin(a)))
    return pts


def in_door(x, y, g=0.0):
    rx, ry = 0.7 + g, 0.35 + g
    return abs(x) <= rx and (y <= 1.35 or (x / rx) ** 2 + ((y - 1.35) / ry) ** 2 <= 1.0)


TILE = dict(R=0.27, PITCH=0.54, Y0=4.66, DY=0.54)


def tile_hw(y):
    """half width of the tiled part of the cottage roof at height y (inset from the gable slopes)"""
    return 5.45 * (7.0 - y) / 2.45 - 0.42


def tile_row(k):
    """outline of scalloped roof tile row k (0 = bottom): scallops along the bottom, cut square at the cusp height
    where it meets the slopes, top edge hidden under the next row (the top row runs up into the gable's apex)"""
    R, PITCH, Y0, DY = TILE['R'], TILE['PITCH'], TILE['Y0'], TILE['DY']
    yb = Y0 + k * DY
    yc = yb + R
    xl = tile_hw(yc)
    x0 = 0.0 if k % 2 == 0 else PITCH / 2
    bottom = []
    for i in range(-13, 14):
        xc = x0 + i * PITCH
        for j in range(8):
            x = xc - PITCH / 2 + PITCH * j / 8
            if -xl + 0.03 < x < xl - 0.03:
                bottom.append((x, yc - R * math.sin(math.pi * j / 8)))
    if k < 3:
        yt = yb + DY + R + 0.03
        top = [(tile_hw(yt), yt), (-tile_hw(yt), yt)]
    else:
        top = [(0.0, 7.0 - 0.42 * 2.45 / 5.45)]
    poly = [(-xl, yc)] + bottom + [(xl, yc)] + top
    poly = fillet(ccw(poly), 0.1, 6, minlen=0.25)
    return simplify(smooth(resample(poly, 0.055), 1), 0.003)


def cottage():
    CREAM, ROOF, ROOF_D, STONE, WOOD = 0xfff1d6, 0xff6b5a, 0xd9503f, 0xd9cfc0, 0xc98a5a
    p = MProp('prop_m_cottage', base=CREAM).raw()
    soft_slab(p, rrect(0, 2.3, 4.7, 2.3, 0.14, 5), 0.0, 0.6, 0.1, steps=3, flat=0.03)
    # a soft stone foot and wooden corner posts (their own shells: inked where they stand proud of the wall)
    soft_slab(p, rrect(0, 0.22, 4.82, 0.22, 0.12, 4), 0.04, 0.68, 0.08, steps=3, flat=0.02)
    for s in (-1, 1):
        soft_slab(p, rrect(s * 4.62, 2.3, 0.16, 2.28, 0.1, 4), 0.05, 0.66, 0.06, steps=3, flat=0.015)
    p.paint_fn(lambda q, n: q.y < 0.445, STONE)
    p.paint_fn(lambda q, n: abs(q.x) > 4.45 and q.y >= 0.445, WOOD)
    # the dark doorway behind the door: exactly the door's shape (its edge tucks under the frame)
    p.layer('doorway', base=DARK).raw()
    soft_slab(p, [(x, max(0.445, y)) for x, y in door_shape(0.03, y0=0.445)], 0.31, 0.03, 0.008, steps=1, flat=0.005)
    # climbing roses by the corner posts: little five-petal flowers with pale hearts
    p.layer('roses', base=0xff8fc0).raw()
    ROSES = [(-4.17, 1.25, 1.0), (-3.97, 1.62, 0.85), (-4.2, 2.0, 0.95), (4.14, 1.05, 0.95), (4.28, 1.45, 1.0), (4.04, 1.85, 0.85)]
    for x, y, k in ROSES:
        petals = [(0.13 * k * (0.84 + 0.16 * math.cos(5 * a)) * math.cos(a), 0.13 * k * (0.84 + 0.16 * math.cos(5 * a)) * math.sin(a)) for a in [TAU * i / 25 + 0.3 for i in range(25)]]
        soft_slab(p, petals, 0.325, 0.05, 0.014, steps=1, flat=0.006, off=(x, y, 0))
        soft_slab(p, circle_poly(0.045 * k, 12), 0.355, 0.03, 0.01, steps=1, flat=0.004, off=(x + 0.01, y + 0.01, 0))
    p.paint_fn(lambda q, n: q.z > 0.352, 0xffd3e6)
    p.layer('leaves', base=0x6cc05a).raw()
    for x, y, a in [(-4.0, 1.12, -30), (-4.33, 1.82, 35), (-3.85, 1.85, -40), (4.32, 0.88, 30), (3.95, 1.62, -35), (4.3, 1.98, 40)]:
        leaf = [(0.11 * math.cos(t), 0.05 * math.sin(t) * (1.0 if math.cos(t) > 0 else 0.8)) for t in [TAU * i / 16 for i in range(16)]]
        soft_slab(p, leaf, 0.315, 0.035, 0.01, steps=1, flat=0.004, rot=(0, 0, a), off=(x, y, 0))
    # wooden door frame round the arch (its ring sits proud of the wall so it gets its ink line)
    p.layer('doorframe', base=WOOD).raw()
    outer = door_shape(0.17)
    inner = door_shape(0.01)
    horse = outer[1:] + [outer[0]] + [inner[0]] + inner[2:][::-1] + [inner[1]]
    horse = [(x, max(0.0, y)) for x, y in horse]
    soft_slab(p, horse, 0.335, 0.13, 0.035, steps=2, flat=0.02)
    # roof: a darker red gable slab (its edge reads as a trim) ...
    p.layer('roof', base=ROOF_D).raw()
    tri = [(-5.45, 4.55), (5.45, 4.55), (0.0, 7.0)]
    tri = [q[:2] for q in rounded(tri, 0.5, n=6, closed=True)]
    soft_slab(p, tri, -0.35, 1.3, 0.08, steps=3, flat=0.04)   # its front flush with the wall (things on the window frames never poke into it)
    # ... with four rows of scalloped tiles, each row in front of the one below (so every scallop edge is inked)
    def hw(y):
        return 5.45 * (7.0 - y) / 2.45 - 0.42
    for k in range(4):
        poly = tile_row(k)
        p.layer('tiles%d' % k, base=ROOF if k % 2 == 0 else 0xff806c).raw()
        zf = 0.355 + 0.05 * k
        soft_slab(p, poly, zf - 0.025, 0.05, 0.022, bv=0.025, steps=1, flat=0.008, back=False)
    # a little round attic window in the gable (in front of the tiles)
    p.layer('attic', base=0xfff1d6).raw()
    p.ring((0, 5.6, 0.56), 0.33, 0.075, rot=(90, 0, 0), seg=40, rseg=10)
    p.layer('atticglass', base=0x9ad8ff).raw()
    soft_slab(p, circle_poly(0.3, 40), 0.53, 0.06, 0.02, steps=1, flat=0.01, off=(0, 5.6, 0))
    p.layer('shine', base=0xf2fbff, target_faces=120, voxel=0.006)
    p.blob((-0.1, 5.72, 0.565), (0.07, 0.045, 0.01), rot=(0, 0, 30), group='sh')
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 7, 0))
    p.extras['outline'] = 0.035
    p.build()


def chimney():
    BRICK, MORTAR, CAP = 0xe0604c, 0xb5473a, 0xb3a6a8
    p = MProp('prop_m_chimney', base=BRICK).raw().facepaint()
    soft_slab(p, rrect(0, -0.07, 0.33, 0.63, 0.08, 4), 0.0, 0.66, 0.05, steps=3, flat=0.01)
    soft_slab(p, rrect(0, 0.66, 0.42, 0.11, 0.09, 4), 0.0, 0.84, 0.06, steps=3, flat=0.01)   # the stone cap (its own shell: inked where it overhangs)
    # brick courses: 0.18 tall, mortar 0.035, bricks 0.33 long in a running bond that wraps the corners
    CH, MW, J = 0.18, 0.035, 0.0175
    tops = [-0.7 + CH * (k + 1) for k in range(7)]          # mortar band [t - MW, t]
    def row(y):
        return int(math.floor((y + 0.7) / CH))
    def joint(q, n):
        if q.y > 0.545:
            return False
        if any(t - MW + 0.002 < q.y < t - 0.002 for t in tops):
            return True
        r = row(q.y)
        if abs(n.z) > 0.6:
            js = [0.0] if r % 2 == 0 else [-0.165, 0.165]
            return any(abs(q.x - x) < J - 0.002 for x in js)
        if abs(n.x) > 0.6:
            js = [-0.165, 0.165] if r % 2 == 0 else [0.0]
            return any(abs(q.z - z) < J - 0.002 for z in js)
        return False
    p.paint_fn(lambda q, n: q.y < 0.56 and joint(q, n), MORTAR)
    p.paint_fn(lambda q, n: q.y > 0.545, CAP)
    p.cuts('y', [t for tt in tops for t in (tt - MW, tt)] + [0.545])
    for r in range(7):
        y0, y1 = -0.7 + CH * r, -0.7 + CH * (r + 1) - MW
        band = (lambda y0, y1: (lambda q, n: y0 - 1e-3 < q.y < y1 + 1e-3))(y0, y1)
        xs = [0.0] if r % 2 == 0 else [-0.165, 0.165]
        zs = [-0.165, 0.165] if r % 2 == 0 else [0.0]
        for x in xs:
            for d in (-J, J):
                p.cut((x + d, 0, 0), (1, 0, 0), (lambda b: lambda q, n: b(q, n) and abs(n.z) > 0.6)(band))
        for z in zs:
            for d in (-J, J):
                p.cut((0, 0, z + d), (0, 0, 1), (lambda b: lambda q, n: b(q, n) and abs(n.x) > 0.6)(band))
    p.layer('hole', base=0x3a2f3a).raw()
    p.cyl((0, 0.765, 0), 0.22, 0.02, bevel=0.008, seg=28)
    p.layer('skin')
    p.bone('body', (0, -0.7, 0), (0, 0.8, 0))
    p.extras['outline'] = 0.024
    p.build()


def door():
    WOOD, WOOD2, GROOVE = 0xa8743f, 0xb68148, 0x7f5129
    p = MProp('prop_m_door', base=WOOD).raw().facepaint()
    poly = [(x, y - DOOR_Y) for x, y in door_shape(0.0, n=20)]
    soft_slab(p, dense(poly, 0.12), 0.0, 0.16, 0.045, steps=3, flat=0.02)
    # four planks with dark grooves between them
    GX = [-0.35, 0.0, 0.35]
    p.paint_fn(lambda q, n: (q.x < -0.35) or (0 < q.x < 0.35), WOOD2)
    p.paint_fn(lambda q, n: abs(n.z) > 0.6 and any(abs(q.x - g) < 0.02 for g in GX), GROOVE)
    for g in GX:
        for d in (-0.022, 0.022):
            p.cut((g + d, 0, 0), (1, 0, 0), lambda q, n: abs(n.z) > 0.6)
        p.cut((g, 0, 0), (1, 0, 0), lambda q, n: abs(n.z) <= 0.6)
    p.layer('iron', base=0x5a4a4a).raw()
    for y in (-0.5, 0.12):
        soft_slab(p, rrect(-0.27, y, 0.36, 0.055, 0.05), 0.095, 0.05, 0.018, steps=1, flat=0.01)
    p.layer('knob', base=0xffd23f, target_faces=300, voxel=0.008)
    p.blob((0.5, -0.05, 0.12), (0.075, 0.075, 0.055), group='knob')
    p.blob((0.5, -0.05, 0.085), (0.1, 0.1, 0.012), group='plate')
    p.layer('winframe', base=0x5a4a4a).raw()
    p.ring((0, 0.42, 0.095), 0.19, 0.035, rot=(90, 0, 0), seg=32, rseg=8)
    p.layer('win', base=0x9ad8ff).raw()
    soft_slab(p, circle_poly(0.18, 32), 0.085, 0.03, 0.01, steps=1, flat=0.01, off=(0, 0.42, 0))
    p.layer('shine', base=0xf2fbff, target_faces=100, voxel=0.005)
    p.blob((-0.06, 0.49, 0.103), (0.045, 0.028, 0.006), rot=(0, 0, 30), group='sh')
    p.layer('skin')
    p.bone('body', (0, -0.85, 0), (0, 0.85, 0))
    p.extras['outline'] = 0.022
    p.build()


def train():
    BLUE, BLUE_D, RED, YEL, DARKP, GREEN = 0x4a90ff, 0x3a78e0, 0xff5a5a, 0xffd23f, 0x4a3a5a, 0x3bb273
    p = MProp('prop_m_train', base=BLUE).raw()
    soft_slab(p, rrect(0, 3.05, 4.7, 1.65, 0.18, 5), 0.0, 0.7, 0.12, steps=3, flat=0.03)
    # a clean yellow band round the carriage's skirt (its own soft strip so it gets an ink edge)
    p.layer('stripe', base=YEL).raw()
    soft_slab(p, rrect(0, 1.74, 4.75, 0.13, 0.085, 4), 0.0, 0.82, 0.05, steps=2, flat=0.015)
    p.layer('roof', base=RED, target_faces=1600, voxel=0.03)
    p.box((0, 4.9, 0), (4.85, 0.2, 0.65), bevel=0.12)
    p.layer('skin')
    p.layer('base', base=DARKP, target_faces=1400, voxel=0.03)
    p.box((0, 1.25, 0), (4.8, 0.2, 0.5), bevel=0.1)
    p.box((6.45, 1.25, 0), (1.45, 0.2, 0.5), bevel=0.1)
    p.blob((7.95, 0.9, 0), (0.25, 0.3, 0.5), group='buffer')
    # the coupling: a bar with a round pin between the carriage and the engine
    p.layer('coupling', base=0x6a5a7a, target_faces=500, voxel=0.012)
    p.capsule((4.62, 1.27, 0.42), (5.18, 1.27, 0.42), 0.085, group='bar')
    p.blob((4.9, 1.27, 0.5), (0.085, 0.085, 0.06), group='pin')
    p.layer('engine', base=GREEN, target_faces=3200, voxel=0.03).facepaint()
    p.cyl((5.9, 2.35, 0), 1.05, 1.6, rot=(0, 0, -90), bevel=0.15, seg=32)
    p.box((5.6, 2.7, 0), (0.7, 1.3, 0.65), bevel=0.12)
    # two yellow hoops round the boiler (straight, exact borders)
    BANDS = [(6.55, 6.69), (7.05, 7.19)]
    p.paint_fn(lambda q, n: q.x > 6.25 and any(a + 0.002 < q.x < b - 0.002 for a, b in BANDS), YEL)
    p.cuts('x', [v for ab in BANDS for v in ab], lambda q, n: q.x > 6.25)
    # cab window: a pale pane set into a red frame
    p.layer('cabframe', base=RED).raw()
    fr = rrect(5.6, 3.25, 0.44, 0.36, 0.16, n=5)
    p.tube([(x, y, 0.69) for x, y in fr], 0.06, closed=True, rseg=10)
    p.layer('cabglass', base=0xcfefff).raw()
    soft_slab(p, rrect(5.6, 3.25, 0.4, 0.32, 0.13, n=5), 0.66, 0.04, 0.012, steps=1, flat=0.01)
    p.layer('shine', base=0xf2fbff, target_faces=120, voxel=0.008)
    p.blob((5.4, 3.38, 0.685), (0.11, 0.06, 0.008), rot=(0, 0, 30), group='sh')
    p.layer('cabroof', base=RED, target_faces=700, voxel=0.025)
    p.box((5.6, 4.1, 0), (0.85, 0.15, 0.75), bevel=0.1)
    p.layer('lamp', base=YEL, target_faces=400, voxel=0.015)
    p.blob((7.55, 2.35, 0), (0.12, 0.25, 0.25), group='l')
    p.paint_fn(lambda q, n: q.x > 7.62, 0xfff6c0)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 5, 0))
    p.extras['outline'] = 0.035
    p.build()


def funnel():
    # a locomotive smokestack: a flanged foot, a stack that widens upward, two gold bands, a big flared crown with a
    # rolled lip, a dark puff-ready opening and a soft highlight down the front
    p = Prop('prop_m_funnel', base=0x5d4f74, target_faces=3600, voxel=0.008)
    prof = [(0, -0.6), (0.4, -0.6), (0.4, -0.5), (0.27, -0.44), (0.29, 0.1), (0.36, 0.26), (0.52, 0.46), (0.56, 0.56),
            (0.5, 0.6), (0.4, 0.55), (0.34, 0.42), (0, 0.42)]
    p.lathe(rounded(prof, 0.05, n=3), seg=48)
    p.ring((0, 0.57, 0), 0.52, 0.06, seg=48, rseg=10)                    # rolled lip
    p.ring((0, -0.2, 0), 0.29, 0.04, seg=40, rseg=8)                     # bands
    p.ring((0, 0.05, 0), 0.3, 0.04, seg=40, rseg=8)
    p.paint_fn(lambda q, n: q.y > 0.5 and n.y > 0.3 and math.hypot(q.x, q.z) < 0.46, 0x2a2030)          # dark opening
    p.paint_fn(lambda q, n: (abs(q.y + 0.2) < 0.05 or abs(q.y - 0.05) < 0.05) and math.hypot(q.x, q.z) > 0.3, 0xffd23f)
    p.paint_fn(lambda q, n: q.y < -0.48, 0x4a3a5a)
    p.paint_fn(lambda q, n: q.z > 0 and abs(math.atan2(q.x, q.z) + 0.55) < 0.14 and -0.4 < q.y < 0.42 and n.y < 0.6, 0x8a7ca6)  # highlight
    p.bone('body', (0, -0.6, 0), (0, 0.62, 0))
    p.extras['outline'] = 0.022
    p.build()


def wheel():
    # a chunky toy train wheel: a fat dark tyre with tread blocks, a red rim dish, six yellow spokes and a hub cap
    p = Prop('prop_m_wheel', base=0x4a3a5a, target_faces=2400, voxel=0.012)
    p.lathe(rounded([(0.44, -0.13), (0.6, -0.13), (0.62, 0.0), (0.6, 0.13), (0.44, 0.13)], 0.05, n=3), rot=(90, 0, 0), seg=56, closed=True)
    for i in range(16):                                                    # tread blocks round the tyre
        a = i / 16 * TAU
        p.box((0.62 * math.cos(a), 0.62 * math.sin(a), 0), (0.035, 0.06, 0.1), rot=(0, 0, math.degrees(a)), bevel=0.025)
    p.lathe(rounded([(0, -0.07), (0.47, -0.07), (0.47, 0.07), (0, 0.07)], 0.03, n=2), rot=(90, 0, 0), seg=48)   # rim dish
    p.paint_fn(lambda q, n: math.hypot(q.x, q.y) < 0.46, 0xff5a5a)
    p.paint_fn(lambda q, n: abs(math.hypot(q.x, q.y) - 0.44) < 0.025 and abs(n.z) > 0.5, 0xd84848)
    p.layer('hub', base=0xffd23f, target_faces=1200, voxel=0.01)
    for i in range(6):
        a = i / 6 * TAU + TAU / 12
        p.box((0.25 * math.cos(a), 0.25 * math.sin(a), 0.08), (0.2, 0.045, 0.035), rot=(0, 0, math.degrees(a)), bevel=0.03)
    p.lathe(rounded([(0, 0.05), (0.15, 0.05), (0.15, 0.13), (0.1, 0.18), (0, 0.19)], 0.03, n=2), rot=(90, 0, 0), seg=28)   # hub cap
    p.paint_fn(lambda q, n: math.hypot(q.x, q.y) < 0.06 and q.z > 0.15, 0xff5a5a)
    p.layer('skin')
    p.bone('body', (0, -0.62, 0), (0, 0.62, 0))
    p.extras['outline'] = 0.022
    p.build()


def castlewall():
    STONE, MORTAR, STONE_L, ARCH = 0xd8d2e6, 0xbfb6d3, 0xe8e3f2, 0xc9bfdd
    p = MProp('prop_m_castlewall', base=STONE).raw()
    # one soft slab in the wall's crenellated outline (flat front, so the joints are exact)
    top = []
    for i in range(7, -1, -1):
        cx = -4.35 + i * 1.243
        x1, x0 = min(4.7, cx + 0.35), max(-4.7, cx - 0.35)
        top += [(x1, 4.6), (x1, 5.22), (x0, 5.22), (x0, 4.6)]
    top = [q for q in top if not (abs(q[0]) >= 4.7 - 1e-6 and abs(q[1] - 4.6) < 1e-6)]
    outl = [(-4.7, 0.0), (4.7, 0.0)] + top
    soft_slab(p, fillet(outl, 0.12, 5), 0.0, 0.7, 0.08, steps=3, flat=0.025)
    # stone blocks: staggered courses with mortar lines cut exactly into the mesh (clean, straight joints)
    RH, MW, JW, BW = 0.55, 0.07, 0.044, 1.1
    front = lambda q, n: n.z > 0.5
    def joint(q, n):
        if not (0.1 < q.y < 4.55):
            return False
        row = math.floor(q.y / RH)
        u = q.x / BW + (0.5 if row % 2 else 0)
        return 0.002 < (q.y % RH) < MW - 0.002 or abs(u - round(u)) < (JW - 0.002) / BW
    p.paint_fn(lambda q, n: n.z > 0.5 and joint(q, n), MORTAR)
    p.paint_fn(lambda q, n: n.y > 0.6 and q.y > 4.5, STONE_L)
    # the gate arch (dark) behind the drawbridge; its edge hides under the arch stones
    p.paint_fn(lambda q, n: n.z > 0.5 and abs(q.x) < 0.97 and (q.y < 1.4 or math.hypot(q.x, q.y - 1.4) < 0.97), DARK)
    ys = [k * RH + d for k in range(1, 9) for d in (0, MW)]
    p.cuts('y', ys, lambda q, n: n.z > 0.5 and q.y < 4.6)
    for r in range(9):
        y0, y1 = r * RH + MW, (r + 1) * RH
        band = (lambda y0, y1: lambda q, n: n.z > 0.5 and y0 - 1e-3 < q.y < y1 + 1e-3)(y0, y1)
        for m in range(-6, 7):
            x = (m - (0.5 if r % 2 else 0)) * BW
            if abs(x) < 4.75:
                for d in (-JW, JW):
                    p.cut((x + d, 0, 0), (1, 0, 0), band)
    for s in (-1, 1):
        p.cut((s * 0.97, 0, 0), (1, 0, 0), lambda q, n: n.z > 0.5 and q.y < 1.4)
    # arch stones: seven voussoirs round the top and three jamb blocks each side (inked, proud of the wall)
    p.layer('arch', base=ARCH).raw()
    RI, RO, G = 0.95, 1.24, 0.035
    for i in range(7):
        a0, a1 = math.pi * i / 7 + G / 1.12 / 2, math.pi * (i + 1) / 7 - G / 1.12 / 2
        if i == 0:
            a0 = 0.0
        if i == 6:
            a1 = math.pi
        pts = [(RO * math.cos(a0 + (a1 - a0) * j / 5), 1.4 + RO * math.sin(a0 + (a1 - a0) * j / 5)) for j in range(6)]
        pts += [(RI * math.cos(a1 - (a1 - a0) * j / 5), 1.4 + RI * math.sin(a1 - (a1 - a0) * j / 5)) for j in range(6)]
        if i == 0:
            pts = [(RO, 1.4 - G / 2)] + pts + [(RI, 1.4 - G / 2)]
        if i == 6:
            pts = pts[:6] + [(-RO, 1.4 - G / 2), (-RI, 1.4 - G / 2)] + pts[6:]
        soft_slab(p, pts, 0.41, 0.13, 0.035, steps=2, flat=0.02)
    for s in (-1, 1):
        for y0, y1 in ((0.0, 0.43), (0.43 + G, 0.9), (0.9 + G, 1.4 - G / 2 - G)):
            soft_slab(p, rrect(s * (RI + RO) / 2, (y0 + y1) / 2, (RO - RI) / 2, (y1 - y0) / 2, 0.075), 0.41, 0.13, 0.035, steps=2, flat=0.02)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 5.3, 0))
    p.extras['outline'] = 0.035
    p.build()


def tower():
    STONE, MORTAR, STONE_D = 0xd8d2e6, 0xbfb6d3, 0xbdb4d0
    p = MProp('prop_m_tower', base=STONE).raw().facepaint()
    RH, MW = 0.55, 0.07
    JA = 0.045 * TAU / 12                  # half a joint, in radians (12 stones round)
    prof = [q[:2] for q in rounded([(0, 0), (1.15, 0), (1.05, 5.4), (1.2, 5.5), (1.2, 5.75), (0, 5.75)], 0.08, n=3)]
    prof = insert_y(prof, [k * RH + d for k in range(1, 10) for d in (0, MW) if k * RH + d < 5.36] + [0.1, 5.35])
    angles = []
    for m in range(24):
        c = m * TAU / 24
        angles += [c - JA, c + JA]
    angles = sorted(a % TAU for a in angles)
    lathe_at(p, prof, angles)
    def joint(q, n):
        if not (0.1 < q.y < 5.35):
            return False
        row = math.floor(q.y / RH)
        u = (math.atan2(q.x, q.z) % TAU) / TAU * 12 + (0.5 if row % 2 else 0)
        return 0.002 < (q.y % RH) < MW - 0.002 or abs(u - round(u)) < 0.045 - 0.0004
    p.paint_fn(joint, MORTAR)
    # a round-arched slit window with a stone moulding
    def r_of(y):
        return 1.15 - 0.1 * y / 5.4
    W, Y0, Y1 = 0.17, 3.98, 4.52
    slit = arch(W, Y0, Y1, n=12)
    p.layer('slitpane', base=DARK).raw()
    cy = (Y0 + Y1 + W) / 2
    p.sticker(dense([(x, y - cy) for x, y in slit], 0.06), cy, r_of, thick=0.05, lift=0.0)
    p.layer('slitframe', base=STONE_D).raw()
    fr = arch(W + 0.045, Y0 - 0.045, Y1, n=16)
    path = []
    for x, y in dense(fr, 0.05):
        r = r_of(y) + 0.02
        a = x / r
        path.append((r * math.sin(a), y, r * math.cos(a)))
    p.tube(path, 0.05, closed=True, rseg=10)
    p.layer('roof', base=WHITE).raw().facepaint()
    rprof = [q[:2] for q in rounded([(0, 5.6), (1.38, 5.6), (1.3, 5.75), (0.08, 7.45), (0, 7.5)], 0.08, n=3)]
    rprof = insert_y(rprof, [5.82])
    lathe_at(p, rprof, [TAU * i / 48 for i in range(48)])
    p.paint_fn(lambda q, n: q.y < 5.82, 0xdadada)
    p.layer('pole', base=0x5a4a3a, target_faces=300, voxel=0.012)
    p.cyl((0, 7.3, 0), 0.05, 0.95, bevel=0.02, seg=10)
    p.blob((0, 8.27, 0), (0.08, 0.08, 0.08), group='ball')
    p.paint_fn(lambda q, n: q.y > 8.18, 0xffd23f)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 8.3, 0))
    p.extras['outline'] = 0.032
    p.build()


def flag():
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
    from skit import SProp
    p = SProp('prop_m_flag', base=WHITE)                 # the clean grid is used as is (no remesh: no scratchy creases)
    # a clean soft pennant from x 0 to 0.8 with a gentle wave in z: an evenly gridded sheet (no fan of slivers, so the
    # shading and ink stay clean), rounded tip, a slightly darker hem by the pole
    N, M, D = 24, 8, 0.02
    def half(x):
        return 0.22 * max(0.0, 1 - x / 0.8) ** 0.95 + 0.02 * (x / 0.8) ** 4
    grid = {}
    verts, faces = [], []
    for s in (0, 1):
        for i in range(N + 1):
            x = 0.8 * i / N
            for j in range(M + 1):
                y = half(x) * (2 * j / M - 1)
                grid[(s, i, j)] = len(verts)
                verts.append((x, y, (D if s == 0 else -D) + 0.05 * math.sin(x * 4)))
    for i in range(N):
        for j in range(M):
            q = [grid[(0, i, j)], grid[(0, i + 1, j)], grid[(0, i + 1, j + 1)], grid[(0, i, j + 1)]]
            faces.append(tuple(q))
            faces.append(tuple(grid[(1, a, b)] for a, b in ((i, j + 1), (i + 1, j + 1), (i + 1, j), (i, j))))
    for i in range(N):
        for j in (0, M):
            q = (grid[(0, i, j)], grid[(1, i, j)], grid[(1, i + 1, j)], grid[(0, i + 1, j)])
            faces.append(q if j == 0 else q[::-1])
    for i in (0, N):
        for j in range(M):
            q = (grid[(0, i, j)], grid[(0, i, j + 1)], grid[(1, i, j + 1)], grid[(1, i, j)])
            faces.append(q if i == 0 else q[::-1])
    p.mesh(verts, faces)
    p.paint_fn(lambda q, n: q.x < 0.08, 0xdddddd)
    p.bone('body', (0, -0.22, 0), (0, 0.22, 0))
    p.extras.update(argMode='tint', argDefault=0xff8fc0, outline=0.016)
    p.build()


def bridge():
    # the castle drawbridge (stands up in the gate, the game lowers it about its hinge at y 0): five real planks with
    # clean straight seams between them under a round top, two iron straps with rivets and chain rings at the top
    WOOD, WOOD_D, WOOD_L = 0xa8763e, 0x7c5428, 0xbb8a4e
    p = Prop('prop_m_bridge', base=WOOD, target_faces=3000, voxel=0.012)
    PW, NPL, GAP = 0.36, 5, 0.022

    def top(x):
        return 1.5 + 0.7 * math.sqrt(max(0.0, 1 - (x / 0.9) ** 2))
    for k in range(NPL):                       # each plank: its outline extruded 0.16 deep (the remesh rounds the edges)
        x0, x1 = -0.9 + k * PW + GAP / 2, -0.9 + (k + 1) * PW - GAP / 2
        poly = [(x0, 0.0), (x1, 0.0)] + [(x1 + (x0 - x1) * t / 8, top(x1 + (x0 - x1) * t / 8)) for t in range(9)]
        m = len(poly)
        p.mesh([(x, y, z) for z in (-0.08, 0.08) for x, y in poly],
               [tuple(range(m))[::-1], tuple(range(m, 2 * m))] + [(i, (i + 1) % m, m + (i + 1) % m, m + i) for i in range(m)])
    p.paint_fn(lambda q, n: int((q.x + 0.9) / PW) % 2 == 1, WOOD_L)
    p.paint_fn(lambda q, n: q.y < 0.05, WOOD_D)
    p.layer('iron', base=0x5a5260, target_faces=1400, voxel=0.01)
    for y in (0.45, 1.35):
        p.box((0, y, 0.095), (0.88, 0.065, 0.025), bevel=0.02)
        for x in (-0.72, -0.36, 0, 0.36, 0.72):
            p.blob((x, y, 0.125), (0.035, 0.035, 0.025), group='r%d%d' % (int(y * 10), int(x * 100)))
    for s in (-1, 1):
        p.ring((s * 0.62, 1.9, 0.1), 0.08, 0.025, rot=(90, 0, 0), seg=20, rseg=6)       # chain rings
        p.blob((s * 0.62, 1.82, 0.09), (0.05, 0.04, 0.03), group='rb%d' % s)
    p.paint_fn(lambda q, n: n.z > 0.7 and q.z > 0.12, 0x7a7282)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 2.2, 0))
    p.extras['outline'] = 0.024
    p.build()


def lamp():
    GOLD = 0xf2b33d
    p = MProp('prop_m_lamp', base=WHITE).raw()
    # a classic round bulb narrowing into its neck
    prof = [(0, -0.26), (0.1, -0.25), (0.172, -0.2), (0.207, -0.11), (0.208, -0.02), (0.18, 0.06), (0.135, 0.11), (0.105, 0.135), (0.1, 0.16), (0, 0.16)]
    prof = [q[:2] for q in rounded(prof, 0.035, n=2)]
    p.lathe(prof, seg=24)
    # gold screw cap with two thread rings and a little hanging loop
    p.layer('cap', base=GOLD).raw()
    p.lathe([q[:2] for q in rounded([(0, 0.125), (0.112, 0.125), (0.112, 0.268), (0.07, 0.3), (0, 0.302)], 0.02, n=2)], seg=20)
    for y in (0.165, 0.222):
        p.ring((0, y, 0), 0.113, 0.019, seg=20, rseg=6)
    p.ring((0, 0.33, 0), 0.034, 0.012, rot=(90, 0, 0), seg=14, rseg=6)
    p.layer('shine', base=WHITE, target_faces=80, voxel=0.006)
    p.blob((-0.085, 0.0, 0.188), (0.026, 0.065, 0.01), rot=(0, -24, 0), group='sh')
    p.layer('skin')
    p.bone('body', (0, -0.26, 0), (0, 0.3, 0))
    p.extras.update(argMode='tint', argDefault=0xdde4ef, outline=0.018)
    p.build()


# ---------------- windows ----------------
# corner radii (true arcs) chosen so the frame's inner edge follows the fitted piece's rounded corners: an even gap all round
WIN_ROUND = {'triangle': 0.152, 'square': 0.167, 'rect': 0.167}
PIECE_ROUND = {'triangle': 0.06, 'square': 0.05, 'rect': 0.05}


def window(kind):
    p = MProp('prop_m_win_' + kind, base=WHITE).raw().facepaint()
    poly = outline(kind)
    if kind != 'circle':
        poly = dense(fillet(poly, WIN_ROUND[kind], n=10), 0.06)
    # a fat rounded frame tube on the line ~0.97 of the shape (the game shows it at 1.3x round a 1.12x hole)
    ring = [(x * 0.965, y * 0.965 + (0.02 if kind == 'triangle' else 0), 0.03) for x, y in poly]
    p.tube(ring, 0.085, closed=True, rseg=12)
    p.paint_fn(lambda q, n: n.z > 0.75, 0xffffff)
    p.paint_fn(lambda q, n: n.z <= 0.75 and n.y < -0.3, 0xdedede)
    p.bone('body', (0, -0.8, 0), (0, 0.8, 0))
    p.extras.update(argMode='tint', argDefault=0xf3d7a6, outline=0.018)
    p.build()


def flowerbox():
    p = MProp('prop_m_flowerbox', base=WHITE).raw().facepaint()
    # a planter with a chunky lip (two soft tintable shells; the box a touch darker than the lip, an ink line between)
    soft_slab(p, rrect(0, -0.025, 0.8, 0.155, 0.08, 4), 0.0, 0.46, 0.05, steps=3, flat=0.012)
    soft_slab(p, rrect(0, 0.128, 0.85, 0.055, 0.052, 4), 0.0, 0.5, 0.035, steps=2, flat=0.01)
    p.paint_fn(lambda q, n: q.y < 0.07, 0xe6e6e6)
    # soil + flowers (one layer: the train's ledge hides it and is a clean box)
    p.layer('flowers', base=0x58c45e).raw().facepaint()
    soft_slab(p, rrect(0, 0, 0.77, 0.19, 0.09, 4), 0.17, 0.07, 0.03, steps=2, flat=0.01, rot=(-90, 0, 0))
    cols = [0xff8fc0, 0xffd23f, 0xa77bff, 0xff5a5a]
    FX, FY, FR = [-0.6 + i * 0.4 for i in range(4)], 0.285, 0.105
    for i, cx in enumerate(FX):
        head = [(FR * (0.64 + 0.36 * abs(math.cos(2.5 * t))) * math.cos(t + 0.31), FR * (0.64 + 0.36 * abs(math.cos(2.5 * t))) * math.sin(t + 0.31)) for t in [TAU * k / 40 for k in range(40)]]
        soft_slab(p, head, 0.055, 0.05, 0.016, steps=1, flat=0.006, off=(cx, FY, 0))
        soft_slab(p, circle_poly(0.04, 16), 0.1, 0.035, 0.012, steps=1, flat=0.004, off=(cx, FY, 0))
        soft_slab(p, rrect(cx, 0.225, 0.02, 0.06, 0.019, 2), 0.02, 0.03, 0.008, steps=1, flat=0.003)
        leaf = [(0.07 * math.cos(t), 0.03 * math.sin(t)) for t in [TAU * k / 14 for k in range(14)]]
        sx = 1 if i % 2 else -1
        soft_slab(p, leaf, 0.0, 0.028, 0.009, steps=1, flat=0.003, rot=(0, 0, 32 * sx), off=(cx + 0.06 * sx, 0.228, 0))
    p.paint_fn(lambda q, n: abs(q.z) > 0.1 or q.y < 0.19 or (n.y > 0.7 and q.y < 0.215), 0x7a4e30)

    def flower(q):
        i = min(range(4), key=lambda k: abs(q.x - FX[k]))
        return i, math.hypot(q.x - FX[i], q.y - FY)
    for i in range(4):
        p.paint_fn((lambda i: lambda q, n: 0.026 < q.z < 0.1 and q.y > 0.175 and not (n.y > 0.7 and q.y < 0.215) and flower(q)[0] == i and flower(q)[1] < FR + 0.01)(i), cols[i])
    p.paint_fn(lambda q, n: q.z > 0.088 and flower(q)[1] < 0.045, 0xfff3b0)
    p.layer('skin')
    p.bone('body', (0, -0.18, 0), (0, 0.4, 0))
    p.extras.update(argMode='tint', argDefault=0xb5764a, outline=0.02)
    p.build()


# ---------------- pieces ----------------
SPOTS = {'triangle': [(-0.42, -0.3), (0.42, -0.3), (0, 0.6)], 'rect': [(-0.68, 0.26), (0.68, 0.26), (-0.68, -0.26), (0.68, -0.26)]}
GEMS = [(0.3, 0.3, 0.06), (-0.35, -0.2, 0.05), (0.38, -0.25, 0.04)]


def piece(kind):
    p = MProp('prop_m_piece_' + kind, base=WHITE).raw().facepaint()
    poly = outline(kind)
    if kind != 'circle':
        poly = dense(fillet(poly, PIECE_ROUND[kind], n=6), 0.08)
    else:
        poly = outline('circle', 72)
    bh = {'triangle': 0.046, 'square': 0.04, 'rect': 0.04, 'circle': 0.06}[kind]
    soft_slab(p, poly, 0.0, 0.36, bh, bv=0.13, steps=4, flat=0.008)
    p.paint_fn(lambda q, n: abs(n.z) < 0.6, 0xe4e4e4)
    p.layer('shine', base=WHITE, target_faces=120, voxel=0.006)
    hx, hy = (-0.2, 0.35) if kind == 'triangle' else (-0.32, 0.25)
    if kind == 'rect':
        hx = -0.55
    p.blob((hx, hy + 0.06, 0.185), (0.05, 0.08, 0.012), rot=(0, 0, -30), group='sh')
    p.layer('dots', base=WHITE).raw()
    for x, y in SPOTS.get(kind, [(-0.42, 0.42), (0.42, 0.42), (-0.42, -0.42), (0.42, -0.42)] if kind != 'circle' else [(0, 0.42), (0.42, 0), (0, -0.42), (-0.42, 0)]):   # (inside the round piece's flat face, clear of the gems)
        # a chunky dot standing well proud of the face (back sunk in, widest ring 0.02 in front): a full, even ink ring
        soft_slab(p, circle_poly(0.09, 24), 0.2, 0.05, 0.016, bv=0.016, steps=2, flat=0.008, off=(x, y, 0))
    p.layer('gems', base=WHITE).raw()
    for x, y, r in GEMS:
        if kind == 'triangle':
            x, y = x * 0.6, y * 0.6 - 0.05
        soft_slab(p, [(0, r * 1.3), (-r, 0), (0, -r * 1.3), (r, 0)], 0.205, 0.05, 0.01, bv=0.012, steps=2, flat=0.004, off=(x, y, 0))
    p.layer('skin')
    p.bone('body', (0, -0.7, 0), (0, 0.9, 0))
    p.extras.update(argMode='tint', argDefault=0xff5a5a, outline=0.022)
    p.build()


# ---------------- gags ----------------
def partyhat():
    p = Prop('prop_m_partyhat', base=0xff8fc0, target_faces=900, voxel=0.01)
    p.lathe(rounded([(0, 0), (0.28, 0), (0.29, 0.03), (0.03, 0.5), (0, 0.51)], 0.03, n=2), seg=28)
    p.paint_fn(lambda q, n: abs(((math.atan2(q.x, q.z) + 4) * 4 / TAU + q.y * 3) % 1 - 0.5) < 0.17, 0xffffff)
    p.layer('pom', base=0xffd23f, target_faces=300, voxel=0.008)
    p.blob((0, 0.53, 0), (0.08, 0.08, 0.08), group='p')
    p.ring((0, 0.03, 0), 0.28, 0.035, seg=28, rseg=6)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 0.6, 0))
    p.extras['outline'] = 0.016
    p.build()


def crown():
    # the gag crown: a fat flared gold band with a rolled foot, five chunky rounded points each topped with a seated
    # pearl (layer 'pearls'), five big round jewels (layer 'jewels')
    GOLD, GOLD_D = 0xffc21a, 0xe09a10
    p = Prop('prop_m_crown', base=GOLD, target_faces=2400, voxel=0.006)
    R, H = 0.26, 0.17
    p.lathe(rounded([(R - 0.04, 0.0), (R + 0.02, 0.0), (R + 0.03, H), (R - 0.02, H)], 0.016, n=2), seg=56, closed=True)
    p.ring((0, 0.02, 0), R + 0.02, 0.022, seg=56, rseg=8)
    tips = []
    for k in range(5):
        a = k / 5 * TAU
        for t in range(7):
            u = t / 6
            rr = R - 0.003 - u * 0.025
            p.blob((math.sin(a) * rr, H - 0.012 + u * 0.25, math.cos(a) * rr), (0.075 * (1 - u * 0.7), 0.045, 0.022 + 0.008 * (1 - u)),
                   rot=(0, math.degrees(a), 0), group='pt%d' % k)
        tips.append((math.sin(a) * (R - 0.028), H + 0.27, math.cos(a) * (R - 0.028)))
    p.paint_fn(lambda q, n: q.y < 0.04, GOLD_D)
    p.layer('pearls', base=0xfff8ee, target_faces=500, voxel=0.005)
    for k, c in enumerate(tips):
        p.blob(c, (0.038, 0.038, 0.038), group='pe%d' % k)
    p.layer('jewels', base=0xff5aa8, target_faces=700, voxel=0.005)
    for i, c in enumerate([0xff5aa8, 0x3bc6d9, 0x5ad97a, 0x9b6bd9, 0xff5a5a]):
        a = i / 5 * TAU
        cc = (math.sin(a) * (R + 0.028), H * 0.55, math.cos(a) * (R + 0.028))
        p.blob(cc, (0.037, 0.045, 0.02), rot=(0, math.degrees(a), 0), group='j%d' % i)
        p.paint(None, cc, (0.07, 0.07, 0.07), c)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 0.38, 0))
    p.extras['outline'] = 0.012
    p.build()


def bow():
    p = Prop('prop_m_bow', base=0xff5a5a, target_faces=900, voxel=0.009)
    for s in (-1, 1):
        p.blob((s * 0.15, 0.03, 0), (0.15, 0.1, 0.06), rot=(0, 0, s * 15), group='w%d' % s)
        p.capsule((s * 0.04, -0.02, 0.0), (s * 0.12, -0.16, 0.02), 0.035, group='t%d' % s, r2=0.04)
    p.blob((0, 0.02, 0.01), (0.06, 0.07, 0.07), group='k')
    p.paint_fn(lambda q, n: abs(q.x) < 0.065 and q.y > -0.05, 0xe03f3f)
    p.bone('body', (0, -0.2, 0), (0, 0.15, 0))
    p.extras['outline'] = 0.014
    p.build()


def glasses():
    p = Prop('prop_m_glasses', base=0x3a2838, target_faces=900, voxel=0.007)
    for s in (-1, 1):
        p.ring((s * 0.18, 0, 0), 0.12, 0.03, rot=(90, 0, 0), seg=28, rseg=6)
        p.tube([(s * 0.3, 0.02, 0), (s * 0.33, 0.04, -0.12)], 0.022, rseg=5)
    p.tube([(-0.07, 0.02, 0), (0, 0.045, 0), (0.07, 0.02, 0)], 0.022, rseg=5)
    p.layer('lens', base=0xcfefff, target_faces=300, voxel=0.006)
    for s in (-1, 1):
        slab(p, circle_poly(0.105, 20), -0.005, 0.012, off=(s * 0.18, 0, 0))
    p.layer('skin')
    p.bone('body', (0, -0.15, 0), (0, 0.15, 0))
    p.extras['outline'] = 0.012
    p.build()


MODELS = dict(prop_m_cottage=cottage, prop_m_chimney=chimney, prop_m_door=door, prop_m_train=train, prop_m_funnel=funnel, prop_m_wheel=wheel,
              prop_m_castlewall=castlewall, prop_m_tower=tower, prop_m_flag=flag, prop_m_bridge=bridge, prop_m_lamp=lamp,
              prop_m_flowerbox=flowerbox, prop_m_partyhat=partyhat, prop_m_crown=crown, prop_m_bow=bow, prop_m_glasses=glasses)
for k in ('circle', 'square', 'triangle', 'rect'):
    MODELS['prop_m_win_' + k] = (lambda k=k: window(k))
    MODELS['prop_m_piece_' + k] = (lambda k=k: piece(k))
if __name__ == '__main__':      # (prop_meadow_stage.py imports MProp and the helpers from here)
    for name, fn in MODELS.items():
        if not ONLY or name in ONLY:
            fn()
