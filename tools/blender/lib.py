"""
Little Learners creature builder for Blender (run headless).

A creature is sculpted from soft metaball blobs that melt into each other (so ears, limbs and
tails grow out of the body with no seams), remeshed into one smooth skin, painted with vertex
colours, rigged with a skeleton and exported as a .glb that the game loads.

All coordinates here are GAME coordinates: x right, y up, z toward the camera (the creature faces +z),
feet on y = 0. They are converted to Blender's z-up space internally.

Usage (see tools/blender/creatures/bunny.py):

    from lib import Creature
    c = Creature('bunny')
    c.blob((0, 0.7, 0), (0.6, 0.65, 0.55))             # body
    c.paint('belly', (0, 0.65, 0.35), (0.38, 0.42, 0.3), CREAM)
    c.bone('body', (0, 0.25, 0), (0, 1.1, 0))
    c.bone('head', (0, 1.1, 0), (0, 2.4, 0), parent='body')
    c.face(center=(0, 1.75, 0), radius=0.68)
    c.anchor('nose', (0, 1.7, 0.66))
    c.build()                                            # writes app/assets/models/bunny.glb

Bone names the game understands (all optional except body/head):
    body, head, ear.L.1/ear.L.2/ear.R.1/ear.R.2 (spring chains), tail.1/tail.2 (spring chain),
    arm.L/arm.R, leg.L/leg.R (or legF.L, legF.R, legB.L, legB.R for four-legged), wing.L/wing.R,
    trunk.1..n, claw.L/claw.R, plus anything species-specific.
Bones whose names start with ear/tail/trunk/antenna/mane/comb/wattle get spring physics in game.
"""
import bpy, bmesh, math, os, sys, json
from mathutils import Vector, Matrix, Quaternion, Euler

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT_DIR = os.path.join(ROOT, 'app', 'assets', 'models')
MAX_TRIS = int(os.environ.get('LL_MAX_TRIS', 11000))


def G(p):
    """game (x, y-up, z-forward) -> blender (x, -z, y)"""
    x, y, z = p
    return Vector((x, -z, y))


def srgb_to_lin(c):
    c = c / 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def hexcol(h):
    if isinstance(h, str):
        h = int(h.lstrip('#'), 16)
    return (srgb_to_lin((h >> 16) & 255), srgb_to_lin((h >> 8) & 255), srgb_to_lin(h & 255), 1.0)


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


class Creature:
    def __init__(self, kind, base=0xffffff, voxel=0.018, resolution=0.03, target_faces=14000):
        reset()
        self.kind = kind
        self.layers = {'skin': dict(groups={}, paints=[], base=hexcol(base), hidden=False)}
        self._cur = 'skin'
        self.voxel = voxel
        self.resolution = resolution
        self.target_faces = target_faces
        self.bones = []           # (name, head, tail, parent, roll)
        self.face_info = None
        self.anchors = {}
        self.extras = {}
        self.weight_rules = {}    # bone -> region filter (callable on game-space Vector)
        self.weight_smooth = 10   # weight smoothing passes over the mesh
        self.group_rules = {}     # bone -> list of blob groups it may move
        self.region_fade = 2      # edge rings over which a region/group mask fades out
        self.neck = None          # (y0, y1): body->head weight ramp for a rigid head; default from the head bone
        self.paint_refine = 1     # 1 = cut the mesh along colour borders for crisp paint (0 = old soft vertex paint)

    # ---------------- layers (clothes, accessories) ----------------
    # Everything (blobs, paints) goes into the current layer. Layer 'skin' is the body. Other layers become
    # separate meshes bound to the SAME skeleton (so a shirt bends with the body), exported with the layer name.
    # In game, layers named 'cloth_*' start hidden; userData.layers[name] gives each mesh (show/hide to dress).
    groups = property(lambda self: self.layers[self._cur]['groups'])
    base = property(lambda self: self.layers[self._cur]['base'])

    @property
    def paints(self):
        return self.layers[self._cur]['paints']

    @paints.setter
    def paints(self, v):
        self.layers[self._cur]['paints'] = v

    def layer(self, name, base=0xffffff, voxel=None, target_faces=None):
        """Switch to (creating if needed) a layer. c.layer('skin') goes back to the body."""
        if name not in self.layers:
            self.layers[name] = dict(groups={}, paints=[], base=hexcol(base), voxel=voxel, target_faces=target_faces)
        self._cur = name
        return self

    # ---------------- sculpting ----------------
    def blob(self, pos, size, rot=(0, 0, 0), group='main', stiffness=2.0, negative=False, kind='ELLIPSOID'):
        """A soft ellipsoid. size = half-extents (x, y, z) in game space. rot = game-space euler (degrees, XYZ).
        Blobs in the same group melt together; different groups stay separate shapes (then join as one skin)."""
        self.groups.setdefault(group, []).append(dict(pos=pos, size=size, rot=rot, stiffness=stiffness, negative=negative, kind=kind))

    def capsule(self, a, b, r, group='main', stiffness=2.0, steps=None, r2=None):
        """A chain of blobs from a to b (tapering from r to r2) - for ears, legs, tails, trunks."""
        a, b = Vector(a), Vector(b)
        r2 = r if r2 is None else r2
        n = steps or max(2, int((b - a).length / (min(r, r2) * 0.7)) + 1)
        for i in range(n):
            t = i / (n - 1)
            p = a.lerp(b, t)
            rr = r + (r2 - r) * t
            self.blob(tuple(p), (rr, rr, rr), group=group, stiffness=stiffness)

    def curve(self, pts, radii, group='main', stiffness=2.0, flat=1.0, per=4):
        """Blobs along a Catmull-Rom curve through game-space points; radii per point; flat squashes in z
        (relative to the curve) - lovely for floppy ears."""
        P = [Vector(p) for p in pts]
        R = list(radii)
        def cr(p0, p1, p2, p3, t):
            return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3)
        Pe = [P[0]] + P + [P[-1]]
        for i in range(len(P) - 1):
            for k in range(per):
                t = k / per
                p = cr(Pe[i], Pe[i + 1], Pe[i + 2], Pe[i + 3], t)
                r = R[i] + (R[i + 1] - R[i]) * t
                d = (P[i + 1] - P[i]).normalized()
                yaw = math.degrees(math.atan2(d.x, d.z)) if abs(d.y) < 0.999 else 0
                pitch = -math.degrees(math.asin(max(-1, min(1, d.y))))
                self.blob(tuple(p), (r, r, r * flat), rot=(pitch, yaw, 0), group=group, stiffness=stiffness)
        self.blob(tuple(P[-1]), (R[-1], R[-1], R[-1] * flat), group=group, stiffness=stiffness)

    def mirror(self, fn):
        """Call fn(s) for s in (-1, +1): helper for symmetric parts."""
        for s in (-1, 1):
            fn(s)

    # ---------------- paint ----------------
    def paint(self, name, center, size, colour, rot=(0, 0, 0), only=None):
        """Colour every skin vertex inside this ellipsoid (game space). Later paints win.
        only: optional callable(game_pos)->bool to restrict (e.g. lambda p: p.z > 0)."""
        self.paints.append(('ell', dict(center=Vector(center), size=Vector(size), rot=Euler([math.radians(a) for a in rot]).to_matrix().inverted(), only=only), hexcol(colour)))

    def paint_group(self, groups, colour, only=None):
        """Colour exactly the skin that came from these blob group(s) (beaks, combs, feet, socks, wings...):
        clean borders that follow the sculpt instead of boxes."""
        gs = [groups] if isinstance(groups, str) else list(groups)
        self.paints.append(('group', dict(groups=gs, only=only), hexcol(colour)))

    def owner(self, p):
        """Name of the blob group whose surface is nearest to game-space point p (current layer)."""
        best, bn = 1e9, None
        for gname, els in self.groups.items():
            for e in els:
                if e['negative']:
                    continue
                R = Euler([math.radians(a) for a in e['rot']]).to_matrix().transposed()
                loc = R @ (Vector(p) - Vector(e['pos']))
                sx, sy, sz = e['size']
                q = Vector((loc.x / sx, loc.y / sy, loc.z / sz)).length
                # approximate true distance to the ellipsoid surface (scale by the radius along this direction,
                # so small blobs don't "win" over big ones)
                d = (q - 1.0) * (loc.length / q if q > 1e-6 else min(sx, sy, sz))
                if d < best:
                    best, bn = d, gname
        return bn

    def paint_fn(self, fn, colour):
        """Colour every vertex where fn(game_pos, game_normal) is true."""
        self.paints.append(('fn', fn, hexcol(colour)))

    # ---------------- rig ----------------
    def bone(self, name, head, tail, parent=None, roll=0.0, region=None, group=None):
        """region: optional callable(game_pos)->bool limiting which vertices this bone may move."""
        self.bones.append((name, head, tail, parent, roll))
        if region:
            self.weight_rules[name] = region
        if group:
            # this bone only moves skin that came from these blob group(s) (best way to keep limbs clean)
            self.group_rules[name] = [group] if isinstance(group, str) else list(group)

    def chain(self, prefix, pts, parent, region=None, group=None):
        """bones prefix.1, prefix.2... along the points."""
        prev = parent
        for i in range(len(pts) - 1):
            nm = f'{prefix}.{i + 1}' if not prefix.endswith(('.L', '.R')) else prefix[:-2] + f'.{prefix[-1]}.{i + 1}'
            self.bone(nm, pts[i], pts[i + 1], parent=prev, region=region, group=group)
            prev = nm
        return prev

    def face(self, center, radius, bone='head', **opts):
        """Where the game mounts its expressive eyes/mouth (a sphere of this radius, facing +z)."""
        self.face_info = dict(center=center, radius=radius, bone=bone, opts=opts)

    def anchor(self, name, pos, bone=None):
        self.anchors[name] = (pos, bone)

    def decal(self, name, xy, size, colour, z_from=3.0, dir=(0, 0, -1), depth=None):
        """Paint a spot on the FRONT surface: (x, y) is projected along dir onto the skin, then an ellipsoid
        of half-size `size` (x, y, z) is painted there. Use for noses, eye patches, muzzles, spots."""
        self.paints.append(('decal', dict(xy=xy, size=Vector(size), z_from=z_from, dir=Vector(dir)), hexcol(colour)))

    def surface(self, x, y, z_from=3.0, dir=(0, 0, -1)):
        """Game-space point where a ray from (x, y, z_from) along dir first hits the skin (after build starts)."""
        sk = self._skin_obj
        o = G((x, y, z_from)); d = G(dir) - G((0, 0, 0))
        ok, loc, nrm, idx = sk.ray_cast(o, d.normalized())
        if not ok:
            return None
        inv = Matrix(((1, 0, 0), (0, 0, 1), (0, -1, 0)))
        return inv @ loc

    # ---------------- build ----------------
    def _metaballs(self):
        objs = []
        for gi, (gname, els) in enumerate(self.groups.items()):
            mb = bpy.data.metaballs.new(f'{gname}')
            mb.resolution = self.resolution
            mb.render_resolution = self.resolution
            mb.threshold = 0.6
            ob = bpy.data.objects.new(f'{gname}', mb)
            bpy.context.scene.collection.objects.link(ob)
            for e in els:
                el = mb.elements.new()
                el.type = e['kind']
                p = G(e['pos'])
                el.co = p
                sx, sy, sz = e['size']
                # metaball element radius with ellipsoid sizes: scale so the surface lands near the given half-extents
                rad = max(sx, sy, sz)
                # calibrated: a lone element's surface sits at radius * f(stiffness) (threshold 0.6)
                st = e['stiffness']
                f = 0.39 + (0.572 - 0.39) * min(1, max(0, st - 1)) + (0.68 - 0.572) * min(1, max(0, (st - 2) / 2))
                el.radius = rad / f
                el.size_x = sx / rad
                el.size_y = sz / rad   # game z -> blender -y (size is unsigned)
                el.size_z = sy / rad
                rx, ry, rz = [math.radians(a) for a in e['rot']]
                # game-space rotation -> blender-space rotation
                m = Euler((rx, ry, rz), 'XYZ').to_matrix()
                conv = Matrix(((1, 0, 0), (0, 0, -1), (0, 1, 0)))
                mb_m = conv @ m @ conv.inverted()
                el.rotation = mb_m.to_quaternion()
                el.stiffness = e['stiffness']
                el.use_negative = e['negative']
            objs.append(ob)
        return objs

    def _skin(self):
        objs = self._metaballs()
        bpy.context.view_layer.update()
        meshes = []
        for ob in objs:
            dg = bpy.context.evaluated_depsgraph_get()
            ev = ob.evaluated_get(dg)
            me = bpy.data.meshes.new_from_object(ev)
            mo = bpy.data.objects.new(ob.name + '_mesh', me)
            bpy.context.scene.collection.objects.link(mo)
            meshes.append(mo)
        for ob in objs:
            bpy.data.objects.remove(ob)
        # join every family into one object
        bpy.ops.object.select_all(action='DESELECT')
        for m in meshes:
            m.select_set(True)
        bpy.context.view_layer.objects.active = meshes[0]
        if len(meshes) > 1:
            bpy.ops.object.join()
        skin = bpy.context.view_layer.objects.active
        nm = self.kind if self._cur == 'skin' else self._cur
        skin.name = nm
        skin.data.name = nm
        # voxel remesh = one clean manifold surface; smooth; decimate to budget
        L = self.layers[self._cur]
        skin.data.remesh_voxel_size = L.get('voxel') or self.voxel
        skin.data.use_remesh_fix_poles = True
        bpy.ops.object.voxel_remesh()
        n = len(skin.data.polygons)
        tf = L.get('target_faces') or (self.target_faces if self._cur == 'skin' else 3000)
        # budget is in TRIANGLES (what the GPU draws; the outline draws it twice) and capped so up to 10
        # creatures stay smooth on a modest laptop. Quads count as 2.
        tf = min(tf, MAX_TRIS if self._cur == 'skin' else MAX_TRIS // 3)
        n = sum(len(p.vertices) - 2 for p in skin.data.polygons)
        if n > tf:
            d = skin.modifiers.new('dec', 'DECIMATE')
            d.ratio = tf / n
            bpy.ops.object.modifier_apply(modifier='dec')
        # relax the voxel stair-steps away so the toon shading reads as smooth clay
        sm = skin.modifiers.new('smooth', 'LAPLACIANSMOOTH')
        sm.iterations = 12
        sm.lambda_factor = 0.6
        sm.use_volume_preserve = True
        sm.use_normalized = True
        bpy.ops.object.modifier_apply(modifier='smooth')
        sm = skin.modifiers.new('smooth2', 'CORRECTIVE_SMOOTH')
        sm.iterations = 8
        sm.smooth_type = 'LENGTH_WEIGHTED'
        sm.use_only_smooth = True
        bpy.ops.object.modifier_apply(modifier='smooth2')
        bpy.ops.object.shade_smooth()
        return skin

    def _paint(self, skin):
        me = skin.data
        attr = me.color_attributes.new('Col', 'FLOAT_COLOR', 'POINT')
        inv = Matrix(((1, 0, 0), (0, 0, 1), (0, -1, 0)))  # blender -> game
        resolved = []
        for kind, data, c in self.paints:
            if kind == 'decal':
                x, y = data['xy']
                hit = self.surface(x, y, data['z_from'], tuple(data['dir']))
                if hit is None:
                    print('DECAL MISSED', x, y)
                    continue
                resolved.append(('ell', dict(center=hit, size=data['size'], rot=Matrix.Identity(3), only=None), c))
            else:
                resolved.append((kind, data, c))
        self.paints = resolved

        def col_at(gp, gn):
            col = self.base
            for kind, data, c in self.paints:
                if kind == 'ell':
                    d = data['rot'] @ (gp - data['center'])
                    s = data['size']
                    if (d.x / s.x) ** 2 + (d.y / s.y) ** 2 + (d.z / s.z) ** 2 <= 1.0 and (data['only'] is None or data['only'](gp)):
                        col = c
                elif kind == 'group':
                    if self.owner(gp) in data['groups'] and (data['only'] is None or data['only'](gp)):
                        col = c
                else:
                    if data(gp, gn):
                        col = c
            return col

        # Crisp paint (the vinyl-toy look): every edge that crosses a colour border is cut exactly ON the border
        # (found by bisection), the mesh is re-triangulated, and colour is stored per face corner from each
        # triangle's centre. So a border is a clean, smooth line - no blur, no stair-steps - at little cost.
        if self.paints and self.paint_refine:
            bm = bmesh.new()
            bm.from_mesh(me)
            bm.normal_update()
            vcol = {v: col_at(inv @ v.co, inv @ v.normal) for v in bm.verts}
            cut = [e for e in bm.edges if vcol[e.verts[0]] != vcol[e.verts[1]]]
            for e in cut:
                v0, v1 = e.verts
                c0 = vcol[v0]
                a_, b_ = 0.0, 1.0
                n = (v0.normal + v1.normal).normalized()
                for _ in range(7):
                    m = (a_ + b_) / 2
                    if col_at(inv @ v0.co.lerp(v1.co, m), inv @ n) == c0:
                        a_ = m
                    else:
                        b_ = m
                f = min(0.9, max(0.1, (a_ + b_) / 2))
                bmesh.utils.edge_split(e, v0, f)
            bmesh.ops.triangulate(bm, faces=bm.faces[:])
            bm.to_mesh(me)
            bm.free()
            me.update()
            for old in list(me.color_attributes):
                me.color_attributes.remove(old)
            attr = me.color_attributes.new('Col', 'FLOAT_COLOR', 'CORNER')
            for poly in me.polygons:
                c = col_at(inv @ poly.center, inv @ poly.normal)
                for li in poly.loop_indices:
                    attr.data[li].color = c
        else:
            for v in me.vertices:
                attr.data[v.index].color = col_at(inv @ v.co, inv @ v.normal)
        me.color_attributes.active_color = attr
        # material that uses vertex colour (for the Blender preview; the game uses its own toon material)
        mat = bpy.data.materials.new(self.kind + '_skin')
        mat.use_nodes = True
        nt = mat.node_tree
        bsdf = nt.nodes.get('Principled BSDF')
        vc = nt.nodes.new('ShaderNodeVertexColor')
        vc.layer_name = 'Col'
        nt.links.new(vc.outputs['Color'], bsdf.inputs['Base Color'])
        bsdf.inputs['Roughness'].default_value = 0.8
        me.materials.append(mat)

    def _armature(self, skin):
        arm = bpy.data.armatures.new(self.kind + '_rig')
        ao = bpy.data.objects.new(self.kind + '_rig', arm)
        bpy.context.scene.collection.objects.link(ao)
        bpy.context.view_layer.objects.active = ao
        bpy.ops.object.select_all(action='DESELECT')
        ao.select_set(True)
        bpy.ops.object.mode_set(mode='EDIT')
        eb = arm.edit_bones
        root = eb.new('root')
        root.head = Vector((0, 0, 0))
        root.tail = Vector((0, 0, 0.2))
        root.use_deform = False
        for name, h, t, parent, roll in self.bones:
            b = eb.new(name)
            b.head = G(h)
            b.tail = G(t)
            # Consistent bone axes: every bone's local Z faces the creature's front (game +z), so for limbs in
            # the frontal plane rotation.z swings them out/in (flap, wave, claw snap) and for legs rotation.x
            # swings them forward/back (walking). Bones pointing along +-z face their Z up instead.
            d = (b.tail - b.head).normalized()
            fwd = G((0, 0, 1)) - G((0, 0, 0))
            limb = name.split('_')[0].split('.')[0] in ('arm', 'wing', 'claw')
            # (limbs face Z backward so the games' convention holds: +z raises the left limb, -z the right)
            b.align_roll((-fwd if limb else fwd) if abs(d.dot(fwd)) < 0.85 else (G((0, 1, 0)) - G((0, 0, 0))))
            b.roll += math.radians(roll)
            b.parent = eb[parent] if parent else root
            b.use_connect = False
        bpy.ops.object.mode_set(mode='OBJECT')
        return ao

    def _default_neck(self):
        if self.neck is not None:
            return
        hb = [b for b in self.bones if b[0] == 'head']
        if hb:
            hy = hb[0][1][1]
            self.neck = (hy - 0.32, hy - 0.08)

    def _weights(self, skin, ao, smooth_iters=None):
        """Distance-based skinning restricted by each bone's region, then smoothed across the mesh surface
        so joints bend softly (no tearing where an ear meets the head). Deterministic, no bone-heat failures."""
        import numpy as np
        inv = Matrix(((1, 0, 0), (0, 0, 1), (0, -1, 0)))
        me = skin.data
        V = len(me.vertices)
        co = np.empty(V * 3); me.vertices.foreach_get('co', co); co = co.reshape(V, 3)
        gp = co @ np.array(inv).T   # game space
        names = [n for n, _, _, _, _ in self.bones]
        B = len(names)
        W = np.zeros((V, B))
        masks = {}
        owner = None
        if self.group_rules:
            # which blob group each vertex came from: the blob whose (normalised) surface is closest
            gnames = list(self.groups.keys())
            best = np.full(V, np.inf); owner = np.zeros(V, dtype=np.int64)
            for gi, gname in enumerate(gnames):
                for e in self.groups[gname]:
                    if e['negative']:
                        continue
                    R = np.array(Euler([math.radians(a) for a in e['rot']]).to_matrix())
                    loc = (gp - np.array(e['pos'])) @ R          # into blob frame
                    sz = np.array(e['size'])
                    q = np.linalg.norm(loc / sz, axis=1)
                    d = (q - 1.0) * np.where(q > 1e-6, np.linalg.norm(loc, axis=1) / np.maximum(q, 1e-6), sz.min())
                    upd = d < best
                    best[upd] = d[upd]; owner[upd] = gi
        for j, (name, h, t, parent, roll) in enumerate(self.bones):
            a = np.array(h, float); b = np.array(t, float); ab = b - a
            tt = np.clip(((gp - a) @ ab) / max(1e-9, ab @ ab), 0, 1)
            d = np.linalg.norm(gp - (a + tt[:, None] * ab), axis=1)
            w = 1.0 / (d + 0.03) ** 4
            rule = self.weight_rules.get(name)
            mask = None
            if rule:
                mask = np.array([bool(rule(Vector(p))) for p in gp])
            if name in self.group_rules:
                gm = np.isin(owner, [gnames.index(g) for g in self.group_rules[name] if g in gnames])
                mask = gm if mask is None else (mask & gm)
            if mask is not None:
                w = w * mask
                masks[j] = mask
            W[:, j] = w
        empty = W.sum(1) == 0
        if empty.any():
            # nearest bone ignoring regions
            for j, (name, h, t, parent, roll) in enumerate(self.bones):
                pass
            mids = np.array([(np.array(h) + np.array(t)) / 2 for _, h, t, _, _ in self.bones])
            near = np.argmin(np.linalg.norm(gp[empty][:, None, :] - mids[None], axis=2), axis=1)
            W[np.where(empty)[0], near] = 1
        W = W / W.sum(1, keepdims=True)
        # smooth over mesh edges
        E = len(me.edges)
        ed = np.empty(E * 2, dtype=np.int64); me.edges.foreach_get('vertices', ed); ed = ed.reshape(E, 2)
        deg = np.bincount(ed.ravel(), minlength=V).astype(float)[:, None]
        for _ in range(smooth_iters if smooth_iters is not None else self.weight_smooth):
            acc = np.zeros_like(W)
            np.add.at(acc, ed[:, 0], W[ed[:, 1]])
            np.add.at(acc, ed[:, 1], W[ed[:, 0]])
            W = 0.5 * W + 0.5 * acc / np.maximum(deg, 1)
        # smoothing must not leak a bone far outside its region (e.g. an arm pulling the body's side), but a
        # soft 2-ring fade across the region edge avoids creases at necks and ear roots
        for j, m in masks.items():
            soft = m.astype(float)
            for ring in range(self.region_fade):
                grow = np.zeros(V)
                np.maximum.at(grow, ed[:, 0], soft[ed[:, 1]])
                np.maximum.at(grow, ed[:, 1], soft[ed[:, 0]])
                soft = np.maximum(soft, grow * 0.55)
            W[:, j] *= soft
        z = W.sum(1) == 0
        if z.any():
            W[z, names.index(self.bones[0][0])] = 1
        W = W / W.sum(1, keepdims=True)
        # Rigid head: above the neck, everything the body bone held moves to the head bone, ramping over the neck
        # band, so the code face never slides over painted muzzles/eye whites when the head turns.
        if self.neck and 'body' in names and 'head' in names:
            y0, y1 = self.neck
            t = np.clip((gp[:, 1] - y0) / max(1e-6, (y1 - y0)), 0, 1)
            jb, jh = names.index('body'), names.index('head')
            # only for skin that is near the head column (not arms/wings that happen to be high)
            moved = W[:, jb] * t
            W[:, jh] += moved
            W[:, jb] -= moved
        # keep the top 4 influences
        idx = np.argsort(-W, axis=1)[:, :4]
        groups = [skin.vertex_groups.new(name=n) for n in names]
        for v in range(V):
            ws = W[v, idx[v]]
            tot = ws.sum()
            for j, w in zip(idx[v], ws):
                if w / tot > 0.01:
                    groups[j].add([v], float(w / tot), 'REPLACE')
        mod = skin.modifiers.new('rig', 'ARMATURE')
        mod.object = ao
        skin.parent = ao

    def _empties(self, ao):
        bpy.context.view_layer.objects.active = ao
        def attach(name, pos, bone, props):
            e = bpy.data.objects.new(name, None)
            e.empty_display_size = 0.08
            bpy.context.scene.collection.objects.link(e)
            for k, v in props.items():
                e[k] = v
            if bone:
                e.parent = ao
                e.parent_type = 'BONE'
                e.parent_bone = bone
                bpy.context.view_layer.update()
                # place in world space
                e.matrix_world = Matrix.Translation(G(pos))
            else:
                e.parent = ao
                e.location = G(pos)
        if self.face_info:
            f = self.face_info
            cx, cy, cz = f['center']
            fs = f['opts'].get('faceScale', 1.0) or 1.0
            hit = self.surface(cx, cy + f['radius'] * fs * 0.12)
            if hit is not None and f['opts'].pop('snap', True):
                # sit the (scaled) face sphere so its front just kisses the real head surface
                f['center'] = (cx, cy, hit.z - f['radius'] * fs * 0.97)
            props = dict(R=f['radius'])
            props.update({k: v for k, v in f['opts'].items()})
            attach('face_anchor', f['center'], f['bone'], props)
        for name, (pos, bone) in self.anchors.items():
            if len(pos) == 2:  # (x, y): snap onto the front surface
                hit = self.surface(pos[0], pos[1])
                pos = tuple(hit) if hit is not None else (pos[0], pos[1], 0)
            attach('anchor_' + name, pos, bone or 'body', {})

    def build(self, out=None):
        self._cur = 'skin'
        skin = self._skin()
        self._skin_obj = skin
        self._paint(skin)
        ao = self._armature(skin)
        self._default_neck()
        self._weights(skin, ao)
        others = []
        for name in self.layers:
            if name == 'skin':
                continue
            self._cur = name
            m = self._skin()
            self._skin_obj = m       # decals on a garment project onto the garment
            self._paint(m)
            self._weights(m, ao)
            others.append(m)
        self._cur = 'skin'
        self._skin_obj = skin
        self._empties(ao)
        ao['kind'] = self.kind
        ao['layers'] = ','.join(o.name for o in others)
        for k, v in self.extras.items():
            ao[k] = v
        os.makedirs(OUT_DIR, exist_ok=True)
        path = out or os.path.join(OUT_DIR, self.kind + '.glb')
        bpy.ops.object.select_all(action='SELECT')
        bpy.ops.export_scene.gltf(
            filepath=path, export_format='GLB', use_selection=False,
            export_extras=True, export_yup=True, export_apply=False,
            export_animations=False, export_skins=True, export_morph=False,
            export_attributes=True, export_vertex_color='ACTIVE', export_all_vertex_colors=False,
            export_materials='EXPORT',
        )
        print('WROTE', path, 'faces', len(skin.data.polygons), 'verts', len(skin.data.vertices))
        return path
