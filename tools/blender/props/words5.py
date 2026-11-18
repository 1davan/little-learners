"""Batch 5 word models (clothes and people): helpers on top of kit/skit, shared by prop_words_clothes.py and
prop_words_people.py.

WProp(kind, oy=0)   a soft prop (every layer voxel-remeshed, like kit.Prop) with:
  - an offset: everything is modelled in TODDLER space (the invisible toddler stands on y = 0, chin at y ~1.62) and
    shifted down by oy, so each garment is designed around the same body but still stands on y = 0;
  - hollow(): carve the invisible body out of the current layer (open neck, sleeves, hem, waist), so a garment is a
    real puffed shell; the inside wall is painted a darker shade automatically;
  - decal stickers: sticker(poly, at, ...) projects a 2D outline onto an already built layer (rays along -z), so a
    sticker hugs any surface and gets its own ink edge;
  - prism(poly, z0, z1, bevel) (from skit) for flat slabs (bib, plates, straps).
Helpers: in_poly, seg_dist, poly_dist, zigzag, dashes, circle/heart/star/moon outlines.
"""
import sys, os, math
sys.path.insert(0, os.path.dirname(__file__))
import bpy, bmesh
from mathutils import Vector, Matrix
import mathutils.geometry as mgeo
from kit import rounded, TAU, star_poly, circle_poly, arc, rot_m   # noqa: F401
from skit import SProp
from lib import G, hexcol

INV = Matrix(((1, 0, 0), (0, 0, 1), (0, -1, 0)))   # blender -> game
BUDGET = dict(scale=1.0, last=0)    # triangle budget: every layer's target is scaled by BUDGET['scale'] (see run_models)

# palette (VOCAB.md shared style) + shading tints
RED, RED_D, RED_L = 0xff4f4f, 0xd93a3f, 0xff8a80
ORANGE, ORANGE_D, ORANGE_L = 0xff9a2e, 0xe07a18, 0xffbf73
YELLOW, YELLOW_D, YELLOW_L = 0xffd23a, 0xe8b21e, 0xffe58a
GREEN, GREEN_D, GREEN_L = 0x4cc75a, 0x36a548, 0x8fe39a
LEAF = 0x2f8a3a
BLUE, BLUE_D, BLUE_L = 0x3f8cff, 0x2c6fd9, 0x86b8ff
SKY, SKY_D, SKY_L = 0x8fd3ff, 0x63b6ec, 0xc4eaff
PURPLE, PURPLE_D, PURPLE_L = 0x9b6dff, 0x7d52e0, 0xc3a8ff
PINK, PINK_D, PINK_L = 0xff7fbf, 0xe85fa2, 0xffb3d9
ROSE, ROSE_D = 0xff9ec4, 0xec7fa8
CREAM, CREAM_D = 0xf2e8d8, 0xdccdb6
WHITE, WHITE_D = 0xfffaf0, 0xe6ded2
BROWN, BROWN_D, BROWN_L = 0xb07a4a, 0x8c5a32, 0xc99566
WOOD, WOOD_D = 0xd8924f, 0xb06f34
TAN = 0xf3d9ae
GREY, GREY_D, GREY_L = 0xb9c0c9, 0x939ba6, 0xdde2e8
SLATE, SLATE_D = 0x6f7a8c, 0x566072
INK = 0x3a2838
SKIN = (0xf6cfa6, 0xd9a273, 0x9c6b4a)
CHEEK = 0xff9e9e


def V(*a):
    return Vector(a[0] if len(a) == 1 else a)


# ---------------- 2D helpers ----------------
def in_poly(x, y, poly):
    c = False
    n = len(poly)
    for i in range(n):
        x1, y1 = poly[i]
        x2, y2 = poly[(i + 1) % n]
        if (y1 > y) != (y2 > y) and x < x1 + (y - y1) * (x2 - x1) / (y2 - y1):
            c = not c
    return c


def seg_dist(px, py, a, b):
    ax, ay = a; bx, by = b
    dx, dy = bx - ax, by - ay
    t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / max(1e-12, dx * dx + dy * dy)))
    return math.hypot(px - ax - t * dx, py - ay - t * dy)


def poly_dist(px, py, pts, closed=False):
    m = len(pts)
    return min(seg_dist(px, py, pts[i], pts[(i + 1) % m]) for i in range(m if closed else m - 1))


def polyline_param(px, py, pts):
    """(distance, arclength at the nearest point) to an open polyline"""
    best, bs, s = 1e9, 0.0, 0.0
    for i in range(len(pts) - 1):
        a, b = pts[i], pts[i + 1]
        dx, dy = b[0] - a[0], b[1] - a[1]
        L = math.hypot(dx, dy)
        t = max(0.0, min(1.0, ((px - a[0]) * dx + (py - a[1]) * dy) / max(1e-12, L * L)))
        d = math.hypot(px - a[0] - t * dx, py - a[1] - t * dy)
        if d < best:
            best, bs = d, s + t * L
        s += L
    return best, bs


def dashed(pts, width, dash=0.07, gap=0.05):
    """predicate (x, y) -> on a dashed stitch line along an open 2D polyline"""
    def f(x, y):
        d, s = polyline_param(x, y, pts)
        return d < width and (s % (dash + gap)) < dash
    return f


def tri_wave(x, period):
    u = (x / period) % 1.0
    return 4 * abs(u - 0.5) - 1   # -1..1


def heart_poly(s, n=40):
    pts = []
    for i in range(n):
        t = TAU * i / n
        x = 16 * math.sin(t) ** 3
        y = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
        pts.append((x * s / 16, y * s / 16 + s * 0.12))
    return pts


def moon_poly(r, inner=0.78, off=0.42, n=28, rot=-25):
    """a fat crescent: the outer circle minus a shifted circle (open toward +x before rotation)"""
    pts = []
    # outer arc from a to b around the left, inner arc back
    ri = r * inner
    ox = r * off
    # intersection angles of the two circles
    # x^2+y^2=r^2, (x-ox)^2+y^2=ri^2 -> x = (r^2 - ri^2 + ox^2)/(2 ox)
    xi = (r * r - ri * ri + ox * ox) / (2 * ox)
    yi = math.sqrt(max(0.0, r * r - xi * xi))
    a0 = math.atan2(yi, xi)
    for i in range(n + 1):
        a = a0 + (TAU - 2 * a0) * i / n
        pts.append((r * math.cos(a), r * math.sin(a)))
    b0 = math.atan2(-yi, xi - ox)
    b1 = math.atan2(yi, xi - ox)
    if b1 < b0:
        b1 += TAU
    # inner arc goes from the bottom intersection back to the top one the short way (through -x side of inner circle)
    bs = [b0 - (b0 - (b1 - TAU)) * k / n for k in range(1, n)]
    for a in bs:
        pts.append((ox + ri * math.cos(a), ri * math.sin(a)))
    c, s = math.cos(math.radians(rot)), math.sin(math.radians(rot))
    return [(x * c - y * s, x * s + y * c) for x, y in pts]


def densify(poly, step, closed=True):
    out = []
    m = len(poly)
    for i in range(m if closed else m - 1):
        a, b = poly[i], poly[(i + 1) % m]
        L = math.hypot(b[0] - a[0], b[1] - a[1])
        k = max(1, int(math.ceil(L / step)))
        for j in range(k):
            t = j / k
            out.append((a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t))
    if not closed:
        out.append(poly[-1])
    return out


def resample(poly, step, closed=True):
    """even points every `step` along a polyline"""
    P = [Vector(q) for q in poly] + ([Vector(poly[0])] if closed else [])
    cum = [0.0]
    for a, b in zip(P, P[1:]):
        cum.append(cum[-1] + (b - a).length)
    n = max(3, int(round(cum[-1] / step)))
    out, k = [], 0
    for i in range(n if closed else n + 1):
        u = cum[-1] * i / n
        while k < len(P) - 2 and cum[k + 1] < u:
            k += 1
        t = (u - cum[k]) / max(1e-9, cum[k + 1] - cum[k])
        out.append(tuple(P[k].lerp(P[k + 1], t)))
    return out


def poly_area(poly):
    return 0.5 * sum(poly[i][0] * poly[(i + 1) % len(poly)][1] - poly[(i + 1) % len(poly)][0] * poly[i][1] for i in range(len(poly)))


# ---------------- signed distance of the cutter (for the inside paint) ----------------
def _sd_part(p, part):
    kind = part[0]
    if kind in ('cap', 'cone'):
        _, a, b, ra, rb = part
        ab = b - a
        t = max(0.0, min(1.0, (p - a).dot(ab) / max(1e-12, ab.dot(ab))))
        d = (p - (a + ab * t)).length - (ra + (rb - ra) * t)
        if kind == 'cone':
            t0 = (p - a).dot(ab) / max(1e-12, ab.dot(ab))
            d = max(d, -t0 * ab.length, (t0 - 1) * ab.length)
        return d
    if kind == 'ell':
        _, c, h, R = part
        loc = R @ (p - c)
        q = Vector((loc.x / h[0], loc.y / h[1], loc.z / h[2])).length
        return (q - 1.0) * (loc.length / q if q > 1e-6 else min(h))
    return 1e9


class WProp(SProp):
    def __init__(self, kind, oy=0.0, base=0xffffff, voxel=0.014, target_faces=2000, smooth=3):
        super().__init__(kind, hard=False, base=base, voxel=voxel, target_faces=int(target_faces * BUDGET['scale']), smooth=smooth)
        self.oy = oy
        self.layers['skin']['remesh'] = True
        self._built = {}
        self.rigid = {}          # layer -> bone: the whole layer moves with that one bone (props held in a hand, hats)
        self._onto = {}          # sticker layer -> the layer it is stuck onto (weights are copied from it)
        self.cut_tris = int(260 * BUDGET['scale'])
        self.extras['outline'] = 0.026

    # ---------- offset (toddler space -> model space) ----------
    def S(self, p):
        return (p[0], p[1] - self.oy, p[2])

    def U(self, q):
        """model space -> toddler space (for predicates)"""
        return Vector((q[0], q[1] + self.oy, q[2]))

    def layer(self, name, base=0xffffff, voxel=None, target_faces=None, remesh=True, quadriflow=True):
        new = name not in self.layers
        if target_faces and new:
            target_faces = max(120, int(target_faces * BUDGET['scale']))
        super().layer(name, base=base, voxel=voxel, target_faces=target_faces)
        if new:
            self.layers[name]['remesh'] = remesh
            self.layers[name]['quadriflow'] = quadriflow
        return self

    def blob(self, pos, size, rot=(0, 0, 0), group='main', stiffness=2.0, negative=False, kind='ELLIPSOID'):
        super().blob(self.S(pos), size, rot=rot, group=group, stiffness=stiffness, negative=negative, kind=kind)

    def mesh(self, verts, faces, bevel=0):
        super().mesh([self.S(v) for v in verts], faces, bevel)

    def box(self, pos, size, rot=(0, 0, 0), bevel=0.06):
        super().box(self.S(pos), size, rot=rot, bevel=bevel)

    def prism(self, poly, z0, z1, bevel=0.05, axis='z', at=(0, 0, 0)):
        super().prism(poly, z0, z1, bevel=bevel, axis=axis, at=self.S(at))

    def paint(self, name, center, size, colour, rot=(0, 0, 0), only=None):
        o = (lambda q: only(self.U(q))) if only else None
        super().paint(name, self.S(center), size, colour, rot=rot, only=o)

    def paint_fn(self, fn, colour):
        super().paint_fn(lambda q, n: fn(self.U(q), n), colour)

    def paint_group(self, groups, colour, only=None):
        o = (lambda q: only(self.U(q))) if only else None
        super().paint_group(groups, colour, only=o)

    def decal(self, name, xy, size, colour, z_from=3.0, dir=(0, 0, -1), depth=None):
        super().decal(name, (xy[0], xy[1] - self.oy), size, colour, z_from=z_from, dir=dir)

    def bone(self, name, head, tail, parent=None, roll=0.0, region=None, group=None):
        r = (lambda q: region(self.U(q))) if region else None
        super().bone(name, self.S(head), self.S(tail), parent=parent, roll=roll, region=r, group=group)

    def face(self, center, radius, bone='head', **opts):
        super().face(self.S(center), radius, bone=bone, **opts)

    def anchor(self, name, pos, bone=None):
        super().anchor(name, self.S(pos) if len(pos) == 3 else (pos[0], pos[1] - self.oy), bone)

    # ---------- hollow shells ----------
    def cut_cap(self, a, b, ra, rb=None):
        """part of the invisible body carved out of this layer: a (tapered) capsule (toddler space)"""
        self.layers[self._cur].setdefault('cut', []).append(('cap', Vector(self.S(a)), Vector(self.S(b)), ra, ra if rb is None else rb))

    def cut_cone(self, a, b, ra, rb):
        """a frustum (no round caps) from a (radius ra) to b (radius rb)"""
        self.layers[self._cur].setdefault('cut', []).append(('cone', Vector(self.S(a)), Vector(self.S(b)), ra, rb))

    def cut_ell(self, c, half, rot=(0, 0, 0)):
        R = rot_m(rot).transposed()
        self.layers[self._cur].setdefault('cut', []).append(('ell', Vector(self.S(c)), tuple(half), R))

    def inside(self, colour, eps=0.018, layer=None):
        """paint the carved inside wall of this layer (call AFTER the layer's other paints so it wins)"""
        L = self.layers[layer or self._cur]
        def f(q, n):
            parts = L.get('cut', [])
            p = Vector(q)
            return min(_sd_part(p, pt) for pt in parts) < eps
        # raw (model space) predicate: bypass the offset wrapper
        SProp.paint_fn(self, f, colour)

    def _cutter(self, parts):
        bm = bmesh.new()
        for pt in parts:
            if pt[0] in ('cap', 'cone'):
                _, a, b, ra, rb = pt
                for c, r in (((a, ra), (b, rb)) if pt[0] == 'cap' else ()):
                    m = bmesh.ops.create_uvsphere(bm, u_segments=24, v_segments=14, radius=r)
                    bmesh.ops.translate(bm, verts=m['verts'], vec=G(c))
                d = b - a
                L = d.length
                m = bmesh.ops.create_cone(bm, cap_ends=True, segments=24, radius1=ra, radius2=rb, depth=L)
                # cone axis is blender z, centred: rotate to the game direction
                gd = (G(b) - G(a)).normalized()
                q = Vector((0, 0, 1)).rotation_difference(gd)
                bmesh.ops.rotate(bm, verts=m['verts'], cent=Vector((0, 0, 0)), matrix=q.to_matrix())
                bmesh.ops.translate(bm, verts=m['verts'], vec=(G(a) + G(b)) / 2)
            else:
                _, c, h, R = pt
                m = bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=18, radius=1.0)
                Mg = R.transposed()   # local->game
                C = Matrix(((1, 0, 0), (0, 0, -1), (0, 1, 0)))
                Mb = C @ Mg @ Matrix.Diagonal((h[0], h[1], h[2])) @ C.inverted()
                for v in m['verts']:
                    v.co = Mb @ v.co + G(c)
        me = bpy.data.meshes.new('cutter')
        bm.to_mesh(me); bm.free()
        ob = bpy.data.objects.new('cutter', me)
        bpy.context.scene.collection.objects.link(ob)
        bpy.ops.object.select_all(action='DESELECT')
        bpy.context.view_layer.objects.active = ob
        ob.select_set(True)
        me.remesh_voxel_size = 0.02
        bpy.ops.object.voxel_remesh()
        d = ob.modifiers.new('dec', 'DECIMATE')
        d.ratio = min(1.0, self.cut_tris / max(1, sum(len(f.vertices) - 2 for f in me.polygons)))
        bpy.ops.object.modifier_apply(modifier='dec')
        return ob

    # ---------- bent slabs ----------
    def slab(self, poly, thick, z=None, step=0.05, at=(0, 0)):
        """A flat 2D outline [(x, y)...] (toddler space, offset by at) extruded `thick` along z about the surface
        z(x, y) (default 0): a bib, a plate, a strap that wraps round a chest."""
        z = z or (lambda x, y: 0.0)
        P = densify(poly if poly_area(poly) > 0 else poly[::-1], step)
        nb = len(P)
        xs = [q[0] for q in P]; ys = [q[1] for q in P]
        inner = []
        x = min(xs) + step * 0.5
        while x < max(xs):
            y = min(ys) + step * 0.5
            while y < max(ys):
                if in_poly(x, y, P) and poly_dist(x, y, P, closed=True) > step * 0.55:
                    inner.append((x, y))
                y += step
            x += step
        pts = [Vector(q) for q in P + inner]
        out = mgeo.delaunay_2d_cdt(pts, [], [list(range(nb))], 1, 1e-7)
        V2, F2 = out[0], out[2]
        m = len(V2)
        verts = [(v.x + at[0], v.y + at[1], z(v.x + at[0], v.y + at[1]) - thick / 2) for v in V2]
        verts += [(v.x + at[0], v.y + at[1], z(v.x + at[0], v.y + at[1]) + thick / 2) for v in V2]
        faces = []
        for f in F2:
            faces.append((f[0] + m, f[1] + m, f[2] + m))
            faces.append((f[2], f[1], f[0]))
        for i in range(nb):
            j = (i + 1) % nb
            faces.append((i, j, j + m, i + m))
        self.mesh(verts, faces)

    # ---------- decal stickers ----------
    def sticker(self, poly, at, thick=0.03, lift=0.012, onto='skin', step=0.03, ang=0.0, z_from=4.0, down=False):
        """A sticker slab in the shape of a 2D outline [(x, y)...] centred at at=(x, y) (toddler space), projected
        along -z onto layer `onto` (built before this layer). ang (degrees) turns the projection about the y axis
        (90 = from +x). Put it in its own layer for a crisp inked edge."""
        self._onto.setdefault(self._cur, onto)
        if down:   # poly is (x, z), at = (x, z): projected straight down onto the top of `onto`
            self._prims().append(('proj', [tuple(p) for p in poly], tuple(at), thick, lift, onto, step, 'down', z_from))
            return
        self._prims().append(('proj', [tuple(p) for p in poly], (at[0], at[1] - self.oy), thick, lift, onto, step, ang, z_from))

    def _proj_mesh(self, pr):
        _, poly, at, thick, lift, onto, step, ang, z_from = pr
        tgt = self._built[onto]
        P = densify(poly if poly_area(poly) > 0 else poly[::-1], step)
        nb = len(P)
        xs = [p[0] for p in P]; ys = [p[1] for p in P]
        inner = []
        g = step * 1.1
        x = min(xs) + g * 0.5
        while x < max(xs):
            y = min(ys) + g * 0.5
            while y < max(ys):
                if in_poly(x, y, P) and poly_dist(x, y, P, closed=True) > step * 0.55:
                    inner.append((x, y))
                y += g
            x += g
        pts = [Vector(p) for p in P + inner]
        out = mgeo.delaunay_2d_cdt(pts, [], [list(range(nb))], 1, 1e-7)
        V2, F2 = out[0], out[2]
        if ang == 'down':
            dvec = Vector((0, -1, 0))
            Ry = None
        else:
            Ry = Matrix.Rotation(math.radians(ang), 3, 'Y')
            dvec = Ry @ Vector((0, 0, -1))
        hits = []
        for v in V2:
            o = Vector((at[0] + v.x, z_from, at[1] + v.y)) if Ry is None else Ry @ Vector((at[0] + v.x, at[1] + v.y, z_from))
            ok, loc, nrm, idx = tgt.ray_cast(G(o), (G(dvec) - G((0, 0, 0))).normalized())
            if not ok:
                hits.append(None); continue
            hits.append((INV @ loc, (INV @ nrm).normalized()))
        good = [h for h in hits if h]
        if not good:
            print('STICKER MISSED', at)
            return None
        verts = []
        for h in hits:
            if h is None:
                h = good[0]
            p, n = h
            verts.append(p + n * (lift - thick * 0.5))
        for h in hits:
            if h is None:
                h = good[0]
            p, n = h
            verts.append(p + n * (lift + thick * 0.5))
        m = len(V2)
        faces = []
        back = self.layers[self._cur].get('remesh', True)     # an unremeshed sticker needs no hidden back face
        for f in F2:
            faces.append((f[0] + m, f[1] + m, f[2] + m))
            if back:
                faces.append((f[2], f[1], f[0]))
        # side walls along the boundary (the first nb output verts are the boundary, in order)
        for i in range(nb):
            j = (i + 1) % nb
            faces.append((i, j, j + m, i + m))
        me = bpy.data.meshes.new('sticker')
        me.from_pydata([G(v) for v in verts], [], faces)
        bm = bmesh.new(); bm.from_mesh(me)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        bm.to_mesh(me); bm.free()
        ob = bpy.data.objects.new('sticker', me)
        bpy.context.scene.collection.objects.link(ob)
        return ob

    def _metaballs(self):
        prims = self.layers[self._cur].get('prims', [])
        proj = [p for p in prims if p[0] == 'proj']
        if proj:
            self.layers[self._cur]['prims'] = [p for p in prims if p[0] != 'proj']
        try:
            objs = super()._metaballs() if (self.groups or self.layers[self._cur].get('prims')) else []
        finally:
            self.layers[self._cur]['prims'] = prims
        for pr in proj:
            ob = self._proj_mesh(pr)
            if ob:
                objs.append(ob)
        return objs

    def _skin(self):
        m = super()._skin()
        parts = self.layers[self._cur].get('cut')
        if parts:
            n0 = sum(len(f.vertices) - 2 for f in m.data.polygons)
            cut = self._cutter(parts)
            bpy.context.view_layer.objects.active = m
            b = m.modifiers.new('carve', 'BOOLEAN')
            b.operation = 'DIFFERENCE'
            b.object = cut
            b.solver = 'EXACT'
            bpy.ops.object.select_all(action='DESELECT')
            m.select_set(True)
            bpy.context.view_layer.objects.active = m
            bpy.ops.object.modifier_apply(modifier='carve')
            bpy.data.objects.remove(cut)
            bpy.ops.object.shade_smooth()
            print('WROTE cut', self._cur, n0, '->', sum(len(f.vertices) - 2 for f in m.data.polygons))
        return m

    def _paint(self, skin):
        super()._paint(skin)
        self._built[self._cur] = skin

    def _weights(self, skin, ao, smooth_iters=None):
        super()._weights(skin, ao, smooth_iters)
        bone = self.rigid.get(self._cur)
        src = self._built.get(self._onto.get(self._cur)) if not bone else None
        if not bone and src is None:
            return
        from mathutils.kdtree import KDTree
        vg = skin.vertex_groups
        if src is not None:
            kd = KDTree(len(src.data.vertices))
            for v in src.data.vertices:
                kd.insert(v.co, v.index)
            kd.balance()
            sg = {g.index: g.name for g in src.vertex_groups}
        for v in skin.data.vertices:
            for g in list(v.groups):
                vg[g.group].remove([v.index])
            if bone:
                vg[bone].add([v.index], 1.0, 'REPLACE')
            else:
                co, i, d = kd.find(v.co)
                for g in src.data.vertices[i].groups:
                    vg[sg[g.group]].add([v.index], g.weight, 'REPLACE')

    def build(self, out=None):
        path = super().build(out)
        lo = min((o.matrix_world @ v.co).z for o in bpy.data.objects if o.type == 'MESH' for v in o.data.vertices)
        hi = max((o.matrix_world @ v.co).z for o in bpy.data.objects if o.type == 'MESH' for v in o.data.vertices)
        xs = [(o.matrix_world @ v.co).x for o in bpy.data.objects if o.type == 'MESH' for v in o.data.vertices]
        tris = sum(len(p.vertices) - 2 for o in bpy.data.objects if o.type == 'MESH' for p in o.data.polygons)
        per = ' '.join('%s:%d(y%.3f)' % (o.name, sum(len(p.vertices) - 2 for p in o.data.polygons), min((o.matrix_world @ v.co).z for v in o.data.vertices)) for o in bpy.data.objects if o.type == 'MESH')
        print('WROTE layers', per)
        BUDGET['last'] = tris
        print('WROTE dims', self.kind, 'ymin %.3f ymax %.3f width %.2f tris %d' % (lo, hi, max(xs) - min(xs), tris))
        return path


def fit_extras(p, h, w):
    """card fit: fill the 2.0 card by the longer side"""
    if w > h:
        p.extras['wide'] = 2.0
        p.extras['fit'] = round(2.0 * h / w, 3)
    else:
        p.extras['fit'] = 2.0


def bar_poly(L, w, ang=0.0, n=3):
    """a rounded bar (stadium) of length L and width w, turned ang radians"""
    r = w / 2
    pts = arc(L / 2 - r, 0, r, -90, 90, n=n * 2) + arc(-L / 2 + r, 0, r, 90, 270, n=n * 2)
    c, s = math.cos(ang), math.sin(ang)
    return [(x * c - y * s, x * s + y * c) for x, y in pts]


def dash_line(p, pts, onto='skin', w=0.04, dash=0.08, gap=0.05, thick=0.025, lift=0.01, only=None):
    """stitching: little rounded dashes along a 2D polyline (toddler x, y), projected onto the front of `onto`"""
    P = [Vector((x, y)) for x, y in pts]
    segs = []
    tot = 0.0
    for a, b in zip(P, P[1:]):
        segs.append((a, b, tot)); tot += (b - a).length
    s = gap * 0.5
    while s + dash <= tot + 1e-6:
        m = s + dash / 2
        for a, b, t0 in segs:
            L = (b - a).length
            if t0 <= m <= t0 + L:
                q = a.lerp(b, (m - t0) / max(1e-9, L))
                d = (b - a).normalized()
                if only is None or only(q):
                    p.sticker(bar_poly(dash, w, math.atan2(d.y, d.x), n=2), (q.x, q.y), onto=onto, thick=thick, lift=lift, step=0.02)
                break
        s += dash + gap


def run_models(models, budgets, only=()):
    """build each model; if it comes out over its triangle budget (+15%), rebuild once with every layer scaled down"""
    import traceback
    for name, fn in models.items():
        if only and name not in only:
            continue
        try:
            BUDGET['scale'] = 1.0
            fn()
            b = budgets.get(name)
            if b and BUDGET['last'] > b * 1.15:
                BUDGET['scale'] = max(0.35, b * 1.08 / BUDGET['last'])
                print('WROTE rebuild', name, 'at scale %.2f' % BUDGET['scale'])
                fn()
                if BUDGET['last'] > b * 1.2:
                    BUDGET['scale'] *= b * 1.1 / BUDGET['last']
                    print('WROTE rebuild', name, 'at scale %.2f' % BUDGET['scale'])
                    fn()
        except Exception:
            traceback.print_exc()
            print('FAILED', name)
        BUDGET['scale'] = 1.0
