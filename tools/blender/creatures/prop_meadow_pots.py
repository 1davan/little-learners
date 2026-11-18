"""Colour tubes containers (TINTABLE, argMode 'tint': the game multiplies the white/grey paint by the container's colour).
  prop_m_ctube   - L1 tall toy tube: rounded foot, straight wall, thick rolled rim; rim top at y 3.15, wall radius 0.95,
                 foot radius 1.1 (0..0.32). Face goes on the front at y ~2.3 (code face). Inner floor at 0.32.
  prop_m_cbasket - L2 woven basket: top radius 1.25, bottom 1.0, rim at y 1.55, two side handles, floor at 0.17.
Both hollow (open top, darker inside). Layer 'shine' = a soft gloss streak (no ink outline in game)."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

# ---------- crisp hard-surface helpers ----------
# RawProp: a layer marked raw() is joined exactly as modelled (no voxel remesh), so analytic lathes, rings and stickers
# keep perfectly clean edges. pillow() builds a sticker / panel from a 2D outline: a flat top, a small rounded lip and an
# UNDERCUT side wall (it leans back under the top), so the game's inverted-hull ink draws a closed line all round it
# whenever it is seen within ~40 deg of head-on (a plain upright wall only inks the edges that face away).
import bpy, bmesh
from mathutils import Vector, Matrix


class RawProp(Prop):
    def raw(self, hard=False):
        self.layers[self._cur]['raw'] = True
        self.layers[self._cur]['hard'] = hard
        return self

    def _metaballs(self):
        objs = super()._metaballs()
        if self.layers[self._cur].get('hard'):
            for ob in objs:
                for md in getattr(ob, 'modifiers', []):
                    if md.type == 'BEVEL':
                        md.limit_method = 'ANGLE'
                        md.harden_normals = True
        return objs

    def _paint(self, skin):
        """facepaint layers: every face takes the colour at its centre, with no border cutting - for patterns that are
        laid out along the mesh's own grid lines (lathe columns / rows), so borders are exact and cost no triangles"""
        L = self.layers[self._cur]
        if not L.get('facepaint'):
            return super()._paint(skin)
        me = skin.data
        for old in list(me.color_attributes):
            me.color_attributes.remove(old)
        attr = me.color_attributes.new('Col', 'FLOAT_COLOR', 'CORNER')
        inv = Matrix(((1, 0, 0), (0, 0, 1), (0, -1, 0)))
        for poly in me.polygons:
            gp, gn = inv @ poly.center, inv @ poly.normal
            c = self.base
            for kind, fn, col in self.paints:
                if kind == 'fn' and fn(gp, gn):
                    c = col
            for li in poly.loop_indices:
                attr.data[li].color = c
        me.color_attributes.active_color = attr
        me.materials.append(bpy.data.materials.new(self.kind + '_skin'))

    def _skin(self):
        L = self.layers[self._cur]
        if not L.get('raw'):
            return super()._skin()
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
        if not L.get('hard'):
            bm = bmesh.new()
            bm.from_mesh(skin.data)
            bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
            bmesh.ops.triangulate(bm, faces=bm.faces[:])
            outward(bm)
            bm.to_mesh(skin.data)
            bm.free()
        for f in skin.data.polygons:
            f.use_smooth = True
        skin.data.update()
        return skin


def outward(bm):
    """make every closed island face outward (signed volume > 0); bmesh's recalc guesses wrong on thin undercut stickers"""
    bm.faces.ensure_lookup_table()
    done = [False] * len(bm.faces)
    for f0 in bm.faces:
        if done[f0.index]:
            continue
        isl, stack = [], [f0]
        done[f0.index] = True
        while stack:
            f = stack.pop()
            isl.append(f)
            for e in f.edges:
                for g in e.link_faces:
                    if not done[g.index]:
                        done[g.index] = True
                        stack.append(g)
        c = sum((v.co for f in isl for v in f.verts), Vector()) / sum(len(f.verts) for f in isl)
        vol = 0.0
        for f in isl:
            a = f.verts[0].co - c
            for i in range(1, len(f.verts) - 1):
                vol += a.dot((f.verts[i].co - c).cross(f.verts[i + 1].co - c))
        if vol < 0:
            bmesh.ops.reverse_faces(bm, faces=isl)

TAU = math.tau
ONLY = [s for s in os.environ.get('ONLY', '').split(',') if s]
WHITE, RIMG, INSIDE = 0xffffff, 0xd4d4d4, 0x6e6e6e


def ctube():
    R, T, H = 0.95, 0.09, 3.06
    p = Prop('prop_m_ctube', base=WHITE, target_faces=3600, voxel=0.02)
    # foot + wall + inner floor as one revolved section (outside up, over the lip, down the inside, across the floor)
    sec = [(0, 0), (1.06, 0), (1.12, 0.08), (1.12, 0.26), (1.04, 0.34), (R, 0.38), (R, H), (R - T, H), (R - T, 0.36), (0, 0.36)]
    p.lathe(rounded(sec, 0.06, n=4), seg=64)
    p.ring((0, H + 0.02, 0), R - T * 0.4, 0.13, seg=64, rseg=14)       # fat rolled rim
    p.ring((0, 0.78, 0), R + 0.005, 0.055, seg=64, rseg=8)             # a ridge ring low on the wall
    inside = lambda q, n: math.hypot(q.x, q.z) < R - T * 0.5 and q.y > 0.3 and q.y < H - 0.02 and (n.x * q.x + n.z * q.z) < 0 or (q.y < 0.4 and q.y > 0.3 and n.y > 0.7 and math.hypot(q.x, q.z) < R - T)
    p.paint_fn(inside, INSIDE)
    p.paint_fn(lambda q, n: q.y < 0.36 and not inside(q, n), RIMG)
    p.paint_fn(lambda q, n: q.y > H - 0.12 and not inside(q, n), RIMG)
    p.paint_fn(lambda q, n: abs(q.y - 0.78) < 0.07 and math.hypot(q.x, q.z) > R - 0.01, RIMG)
    # gloss streak on the left of the wall (between the ridge and the face)
    p.layer('shine', base=WHITE, target_faces=300, voxel=0.01)
    a = -0.95
    pts = [((R + 0.004) * math.sin(a), y, (R + 0.004) * math.cos(a)) for y in (1.0, 1.35, 1.7)]
    p.tube(pts, 0.05, rseg=8)
    pts = [((R + 0.004) * math.sin(a - 0.13), y, (R + 0.004) * math.cos(a - 0.13)) for y in (1.0, 1.12)]
    p.tube(pts, 0.035, rseg=8)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, H, 0))
    p.extras.update(argMode='tint', argDefault=0xff5a5a, outline=0.03)
    p.build()


def cbasket():
    """chunky woven basket: a smooth tapered wall whose soft rows carry a printed over-under weave (no deep grooves, so
    the ink stays on the silhouette), a twisted rope rim, a tucked-under foot and two rope side handles."""
    R, RB, H, T = 1.25, 1.0, 1.5, 0.09
    p = RawProp('prop_m_cbasket', base=WHITE).raw()
    p.layers['skin']['facepaint'] = True     # the weave follows the lathe grid exactly
    r_at = lambda y: RB + (R - RB) * y / H
    rows, y0, y1 = 6, 0.1, H - 0.1
    lam = (y1 - y0) / rows
    A = 0.022
    out_r = lambda y: r_at(y) + 0.05 + A * math.cos(TAU * (y - y0) / lam - math.pi) if y0 <= y <= y1 else r_at(y) + 0.05 - A
    prof = [(0, 0), (RB - 0.12, 0), (RB - 0.04, 0.012), (RB + 0.012, 0.05)]
    for k in range(rows):
        for t in (0.0, 0.25, 0.5, 0.75):
            y = y0 + (k + t) * lam
            prof.append((out_r(y), y))
    prof += [(out_r(y1), y1), (R + 0.02, H - 0.05), (R - 0.02, H - 0.01), (R - T - 0.05, H - 0.02), (R - T - 0.065, H - 0.06), (R - T - 0.08, H - 0.12),
             (RB - T * 0.8 - 0.04, 0.24), (RB - T * 0.8 - 0.1, 0.17), (0, 0.17)]
    SEG, ST = 72, 24
    p.lathe(prof, seg=SEG)
    # fat twisted rope rim: a torus whose grid itself spirals, so the two-tone strands follow its faces exactly
    RR, rr, TW, RS = R - T * 0.4, 0.125, 6, 8
    verts, faces = [], []
    for i in range(SEG):
        phi = TAU * i / SEG
        for j in range(RS):
            psi = TAU * j / RS + TW * phi
            rad = RR + rr * math.cos(psi)
            verts.append((rad * math.sin(phi), H + 0.01 + rr * math.sin(psi), rad * math.cos(phi)))
    for i in range(SEG):
        for j in range(RS):
            i2, j2 = (i + 1) % SEG, (j + 1) % RS
            faces.append((i * RS + j, i2 * RS + j, i2 * RS + j2, i * RS + j2))
    p.mesh(verts, faces)
    # rope side handles
    for s in (-1, 1):
        rh = r_at(H - 0.3) + 0.0
        arc = [(s * (rh - 0.06), H - 0.32, -0.34)]
        arc += [(s * (rh + 0.12 * math.sin(math.radians(a))), H - 0.32 + 0.32 * math.sin(math.radians(a)), -0.34 * math.cos(math.radians(a))) for a in range(15, 166, 15)]
        arc += [(s * (rh - 0.06), H - 0.32, 0.34)]
        p.tube(arc, 0.075, rseg=8)

    def ang(q):
        return math.atan2(q.x, q.z) % TAU
    inside = lambda q, n: q.y > 0.15 and q.y < H - 0.06 and math.hypot(q.x, q.z) < r_at(q.y) - 0.04
    # over-under weave: each row is a run of stitches, alternate stitches a shade darker, offset row to row
    def weave(q, n):
        if inside(q, n) or q.y < y0 or q.y > y1 or abs(q.x) > R + 0.1:
            return False
        k = int((q.y - y0) / lam)
        st = int(ang(q) / TAU * ST) % ST
        return (st + k) % 2 == 1
    p.paint_fn(weave, 0xdedede)
    p.paint_fn(lambda q, n: not inside(q, n) and q.y < 0.07, 0xd2d2d2)
    p.paint_fn(inside, INSIDE)
    p.paint_fn(lambda q, n: q.y < 0.2 and n.y > 0.7 and q.y > 0.12, INSIDE)
    # the rope rim and handles: twisted strands (diagonal light / dark stripes)
    def rope(q, n):
        c = Vector((math.sin(ang(q)) * (R - T * 0.4), H + 0.01, math.cos(ang(q)) * (R - T * 0.4)))
        d = q - c
        if d.length > 0.14:
            return False
        psi = math.atan2(d.y, Vector((d.x, 0, d.z)).dot(Vector((math.sin(ang(q)), 0, math.cos(ang(q))))))
        return int(((psi - TW * ang(q)) / TAU) % 1 * RS) % 2 == 0
    p.paint_fn(rope, 0xdadada)
    p.paint_fn(lambda q, n: abs(q.x) > R + 0.02 and q.y > H - 0.4, 0xe6e6e6)
    p.bone('body', (0, 0, 0), (0, H, 0))
    p.extras.update(argMode='tint', argDefault=0xff5a5a, outline=0.03)
    p.build()


MODELS = dict(prop_m_ctube=ctube, prop_m_cbasket=cbasket)
for name, fn in MODELS.items():
    if not ONLY or name in ONLY:
        fn()
