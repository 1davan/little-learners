"""WORDS batch 8: kitchen and things around the house (docs/design/WORDS.md, words 211-240). The 15 new word-card models.
One script, several models; ONLY=prop_word_spoon,prop_word_fork builds a subset.

  prop_word_bottle    baby bottle: see-through sky body two-thirds full of milk, three blue measure lines, wide pink
                      collar, big tan teat                                                     (~1.6 tall)
  prop_word_spoon     toddler spoon standing at a slant: deep grey bowl (white glint), short fat blue handle, round
                      end with a yellow star                                                   (~1.5 tall)
  prop_word_fork      the spoon's partner: grey head, three short fat rounded prongs, fat green handle, star end
  prop_word_kettle    round red stove kettle: short grey spout with a white steam puff (bone 'steam'), big arched ink
                      handle over the top, small lid with a ball knob                         (~1.5 tall)
  prop_word_teapot    fat cream teapot with blue polka dots: long S spout to +x, blue loop handle at -x, blue lid with
                      a round knob (bone 'lid' lifts it)                                       (~1.2 tall)
  prop_word_watch     child's wristwatch curled in a ring: white face, four ink dots, red and blue hands, yellow case,
                      green strap with holes and a buckle                                      (~0.9 tall)
  prop_word_phone     rounded ink smartphone leaning back on a small stand: sky screen, 3x3 app squares, green call
                      button with a white handset                                              (~1.5 tall)
  prop_word_torch     fat red torch along x (lens +x): grip ridges, flared grey head, yellow lens, blue slide switch;
                      layer 'cloth_beam' = the pale yellow light cone (starts hidden: wear('cloth_beam') to switch on)
  prop_word_broom     broom head-down leaning 10 deg: fat wood handle with a red tip, flared yellow bristle fan bound by
                      two red bands, a little dust puff                                        (~2.5 tall)
  prop_word_vacuum    purple cylinder vacuum on two big wheels: yellow button, sky dust window, fat ribbed grey hose
                      looping to a wide floor head at +x                                       (~2.0 long)
  prop_word_scissors  round-ended child's scissors open in an X: grey blades, orange and blue loop handles, yellow
                      pivot. Bones 'blade.L' / 'blade.R' (each = one blade + its handle) turn about the pivot with
                      rotation.z to snip                                                        (~1.5 tall)
  prop_word_hammer    toy hammer leaning head-up: fat wood handle, chunky red head, yellow flat face, rounded peen
  prop_word_vase      curvy blue vase with a white wavy band holding a red tulip, a yellow daisy and a pink flower
                      (vase = 60% of the height)                                               (~2.0 tall)
  prop_word_candle    short fat cream candle with two drips in a blue holder with a finger loop; yellow teardrop flame
                      with an orange core (bone 'flame' flickers)                              (~1.4 tall)
  prop_word_tv        rounded ink-slate TV on a small stand: sky screen with a green hill and a yellow sun, red power
                      dot, a little remote lying in front                                      (~1.7 wide)

All: bottom at y = 0, centred on x and z, facing +z, a 'body' bone straight up. extras: fit (card height) and wide (card
width, when wider than tall) for a 2 x 2 word card, outline 0.026 (over 1.5 tall) or 0.018. No faces (objects)."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded, star_poly, circle_poly, TAU
from mathutils import Vector, Matrix
import bpy, bmesh

ONLY = [s for s in os.environ.get('ONLY', '').split(',') if s]


def want(n):
    return not ONLY or n in ONLY


# ---------------- palette (WORDS.md shared style) ----------------
RED, ORANGE, YELLOW, GREEN, LEAF = 0xff4f4f, 0xff9a2e, 0xffd23a, 0x4cc75a, 0x2f8a3a
BLUE, SKY, PURPLE, PINK, ROSE = 0x3f8cff, 0x8fd3ff, 0x9b6dff, 0xff7fbf, 0xff9ec4
CREAM, WHITE, BROWN, WOOD, TAN = 0xf2e8d8, 0xfffaf0, 0xb07a4a, 0xd8924f, 0xf3d9ae
GREY, SLATE, INK = 0xb9c0c9, 0x6f7a8c, 0x3a2838


def mixc(a, b, t):
    ca = [(a >> s) & 255 for s in (16, 8, 0)]
    cb = [(b >> s) & 255 for s in (16, 8, 0)]
    c = [round(x + (y - x) * t) for x, y in zip(ca, cb)]
    return (c[0] << 16) | (c[1] << 8) | c[2]


def lt(c, t=0.35):
    return mixc(c, WHITE, t)


def dk(c, t=0.22):
    return mixc(c, INK, t)


INKSLATE = mixc(SLATE, INK, 0.5)


# ---------------- helpers ----------------
def Rx(d):
    return Matrix.Rotation(math.radians(d), 4, 'X')


def Ry(d):
    return Matrix.Rotation(math.radians(d), 4, 'Y')


def Rz(d):
    return Matrix.Rotation(math.radians(d), 4, 'Z')


def Tr(x, y, z):
    return Matrix.Translation((x, y, z))


def Sc(x, y, z):
    return Matrix.Diagonal((x, y, z, 1))


class HProp(Prop):
    """Prop with a model transform M applied to every mesh primitive (lathe, tube, ring, slab...): build a part upright
    in its own frame, then lean / tilt it. loc(q) maps a game point back into that frame (for paint predicates)."""

    def __init__(self, *a, **kw):
        super().__init__(*a, **kw)
        self.M = None

    def xf(self, M):
        self.M = M
        return self

    def mesh(self, verts, faces, bevel=0):
        if self.M is not None:
            verts = [tuple(self.M @ Vector(v)) for v in verts]
        super().mesh(verts, faces, bevel)

    def bl(self, pos, size, group='main', rot=(0, 0, 0), lean=0.0, **kw):
        """blob whose centre goes through M (its axes only turn by `lean` degrees about z)"""
        q = self.M @ Vector(pos) if self.M is not None else Vector(pos)
        self.blob(tuple(q), size, rot=(rot[0], rot[1], rot[2] + lean), group=group, **kw)

    def P(self, v):
        return tuple(self.M @ Vector(v)) if self.M is not None else tuple(v)

    def ground(self, y0=0.0):
        """Shift everything built so far (prims, blobs, paints) so the lowest point sits at y0. Call before bones."""
        lo = 1e9
        for L in self.layers.values():
            for pr in L.get('prims', []):
                lo = min(lo, min(v[1] for v in pr[1])) if pr[0] == 'mesh' else min(lo, pr[1][1] - pr[2][1])
            for els in L['groups'].values():
                for e in els:
                    if not e['negative']:
                        lo = min(lo, e['pos'][1] - e['size'][1])
        d = y0 - lo
        D = Vector((0, d, 0))
        for L in self.layers.values():
            L['prims'] = [('mesh', [(v[0], v[1] + d, v[2]) for v in pr[1]], pr[2], pr[3]) if pr[0] == 'mesh' else
                          ('box', (pr[1][0], pr[1][1] + d, pr[1][2]), pr[2], pr[3], pr[4]) for pr in L.get('prims', [])]
            for els in L['groups'].values():
                for e in els:
                    e['pos'] = (e['pos'][0], e['pos'][1] + d, e['pos'][2])
            ps = []
            for kind, data, c in L['paints']:
                if kind == 'fn':
                    data = (lambda f: (lambda q, n: f(q - D, n)))(data)
                elif kind == 'ell':
                    data = dict(data, center=data['center'] + D)
                ps.append((kind, data, c))
            L['paints'] = ps
        return d

    def rlayer(self, name, base):
        """a decal layer kept exactly as modelled (no voxel remesh): clean rounded pills, discs and stars with a crisp
        inked edge and few triangles"""
        self.layer(name, base=base)
        self.layers[name]['raw'] = True
        return self

    def _skin(self):
        L = self.layers[self._cur]
        if not L.get('raw') or self.groups:
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
        skin.name = skin.data.name = self._cur
        bm = bmesh.new()
        bm.from_mesh(skin.data)
        bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        bmesh.ops.triangulate(bm, faces=bm.faces[:])
        bm.to_mesh(skin.data)
        bm.free()
        for f in skin.data.polygons:
            f.use_smooth = True
        return skin


def loc_fn(M):
    Mi = M.inverted()
    return lambda q: Mi @ Vector(q)


def slab(p, poly, z0, z1, xf=None):
    """extrude a 2D polygon [(x, y)...] from z0 to z1 (local), each vertex through xf (callable or Matrix)"""
    if isinstance(xf, Matrix):
        M = xf
        xf = lambda v: tuple(M @ Vector(v))
    xf = xf or (lambda v: v)
    n = len(poly)
    verts = [xf((x, y, z0)) for x, y in poly] + [xf((x, y, z1)) for x, y in poly]
    faces = [tuple(range(n - 1, -1, -1)), tuple(range(n, 2 * n))]
    for i in range(n):
        j = (i + 1) % n
        faces.append((i, j, n + j, n + i))
    p.mesh(verts, faces)


def rrect(w, h, rc, n=6):
    """rounded rectangle (half sizes w, h; corner radius rc), counter-clockwise"""
    rc = max(0.004, min(rc, w * 0.999, h * 0.999))
    pts = []
    for cx, cy, a0 in ((w - rc, h - rc, 0), (-w + rc, h - rc, 90), (-w + rc, -h + rc, 180), (w - rc, -h + rc, 270)):
        for i in range(n + 1):
            a = math.radians(a0 + 90 * i / n)
            pts.append((cx + rc * math.cos(a), cy + rc * math.sin(a)))
    return pts


def pillow(p, w, h, rc, t, bev, M, n=6, nb=3):
    """a rounded slab: rounded-rect outline (half w, h, corner rc) of half thickness t, every edge rounded by bev.
    Built in local xy (thickness along z), placed by matrix M."""
    rings = []
    for side in (-1, 1):
        steps = range(nb, -1, -1) if side < 0 else range(nb + 1)
        for i in steps:
            a = (math.pi / 2) * i / nb
            rings.append((side * ((t - bev) + bev * math.sin(a)), bev * (1 - math.cos(a))))
    verts, faces = [], []
    m = None
    for z, ins in rings:
        poly = rrect(w - ins, h - ins, rc - ins, n)
        m = len(poly)
        verts += [tuple(M @ Vector((x, y, z))) for x, y in poly]
    R = len(rings)
    for k in range(R - 1):
        for i in range(m):
            j = (i + 1) % m
            faces.append((k * m + i, k * m + j, (k + 1) * m + j, (k + 1) * m + i))
    faces.append(tuple(range(m - 1, -1, -1)))
    faces.append(tuple((R - 1) * m + i for i in range(m)))
    p.mesh(verts, faces)


def pill(p, w, h, t, M, n=4):
    """a rounded decal: a disc (w == h), a pill or a soft square (rc given via h<0 trick not needed), t = half thickness"""
    pillow(p, w, h, min(w, h) * 0.999, t, t * 0.9, M, n=n, nb=1)


def softsq(p, w, h, rc, t, M):
    pillow(p, w, h, rc, t, t * 0.9, M, n=3, nb=1)


def pillow_poly(p, poly, t, bev, M, nb=2):
    """a rounded slab of any star-shaped outline (insets by scaling toward its centre)"""
    cx = sum(x for x, y in poly) / len(poly)
    cy = sum(y for x, y in poly) / len(poly)
    R = sum(math.hypot(x - cx, y - cy) for x, y in poly) / len(poly)
    rings = []
    for side in (-1, 1):
        steps = range(nb, -1, -1) if side < 0 else range(nb + 1)
        for i in steps:
            a = (math.pi / 2) * i / nb
            rings.append((side * ((t - bev) + bev * math.sin(a)), 1 - bev * (1 - math.cos(a)) / R))
    m = len(poly)
    verts, faces = [], []
    for z, k in rings:
        verts += [tuple(M @ Vector((cx + (x - cx) * k, cy + (y - cy) * k, z))) for x, y in poly]
    for r in range(len(rings) - 1):
        for i in range(m):
            j = (i + 1) % m
            faces.append((r * m + i, r * m + j, (r + 1) * m + j, (r + 1) * m + i))
    c0 = len(verts); verts.append(tuple(M @ Vector((cx, cy, rings[0][0]))))
    c1 = len(verts); verts.append(tuple(M @ Vector((cx, cy, rings[-1][0]))))
    last = (len(rings) - 1) * m
    for i in range(m):
        j = (i + 1) % m
        faces.append((c0, j, i))
        faces.append((c1, last + i, last + j))
    p.mesh(verts, faces)


def prof_r(prof, y):
    best = 0.0
    for (r0, y0), (r1, y1) in zip(prof, prof[1:]):
        if min(y0, y1) <= y <= max(y0, y1) and abs(y1 - y0) > 1e-6:
            best = max(best, r0 + (r1 - r0) * (y - y0) / (y1 - y0))
    return best


def cr_path(pts, per=6):
    """Catmull-Rom curve through the points"""
    P = [Vector(p) for p in pts]
    P = [P[0] * 2 - P[1]] + P + [P[-1] * 2 - P[-2]]
    out = []
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
        for k in range(per):
            t = k / per
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    out.append(P[-2])
    return [tuple(v) for v in out]


def resample(path, step):
    """evenly spaced points along a polyline"""
    P = [Vector(p) for p in path]
    L = [0.0]
    for a, b in zip(P, P[1:]):
        L.append(L[-1] + (b - a).length)
    n = max(2, int(L[-1] / step) + 1)
    out, j = [], 0
    for k in range(n):
        s = L[-1] * k / (n - 1)
        while j < len(L) - 2 and L[j + 1] < s:
            j += 1
        t = (s - L[j]) / max(1e-9, L[j + 1] - L[j])
        out.append(tuple(P[j].lerp(P[j + 1], t)))
    return out, L[-1]


def finish(p, h, w=None, outline=None):
    if not any(b[0] == 'body' for b in p.bones):
        p.bone('body', (0, 0, 0), (0, h, 0))
    p.extras['fit'] = 2.0
    if w and w > h:
        p.extras['wide'] = 2.0
    p.extras['outline'] = outline or (0.026 if h > 1.5 else 0.018)
    p.build()


# =====================================================================================================
def bottle():
    p = HProp('prop_word_bottle', base=WHITE, target_faces=650, voxel=0.011, smooth=3)
    R, H, MILK = 0.36, 0.96, 0.64
    prof = rounded([(0, 0), (R - 0.04, 0), (R, 0.09), (R - 0.04, 0.47), (R, 0.84), (R - 0.02, H), (0, H)], 0.07, n=4)
    p.lathe(prof, seg=48)
    p.paint_fn(lambda q, n: q.y > MILK, SKY)
    rw = lambda y: prof_r(prof, y)
    # glint: a white pill on the see-through part, upper left
    p.rlayer('glint', WHITE)
    p.sticker(rrect(0.04, 0.1, 0.039, 4), 0.8, rw, thick=0.034, ang=math.radians(-38), lift=0.004)
    # measure lines on the milk, right front
    p.rlayer('marks', BLUE)
    for y, w in ((0.2, 0.08), (0.34, 0.13), (0.48, 0.08)):
        r = rw(y)
        p.sticker(rrect(w, 0.032, 0.031, 4), y, rw, thick=0.034, ang=math.radians(12) + w / r, lift=0.004)
    # wide pink collar with grip ribs
    p.layer('collar', base=PINK, target_faces=420, voxel=0.01)
    C0, C1 = H - 0.07, H + 0.21
    p.lathe(rounded([(0, C0), (R + 0.07, C0), (R + 0.1, C0 + 0.05), (R + 0.1, C1 - 0.05), (R + 0.04, C1), (0, C1)], 0.045, n=3), seg=48)
    p.paint_fn(lambda q, n: C0 + 0.04 < q.y < C1 - 0.07 and math.cos(math.atan2(q.x, q.z) * 16) > 0.5, dk(PINK, 0.14))
    # the teat (the naming part, big)
    p.layer('teat', base=TAN, target_faces=380, voxel=0.01)
    T0 = C1 - 0.03
    p.lathe(rounded([(0, T0), (0.29, T0), (0.28, T0 + 0.07), (0.17, T0 + 0.17), (0.11, T0 + 0.27), (0.125, T0 + 0.41),
                     (0.095, T0 + 0.5), (0, T0 + 0.51)], 0.05, n=4), seg=40)
    p.paint_fn(lambda q, n: q.y < T0 + 0.1, dk(TAN, 0.08))
    p.layer('skin')
    finish(p, T0 + 0.51, 0.92)


def cutlery_handle(p, col, lean):
    """fat flat handle with a round end (local, upright, bottom at y 0) in the current layer's 'h' group"""
    p.bl((0, 0.19, 0), (0.19, 0.19, 0.075), group='h')
    for k in range(7):
        t = k / 6
        y = 0.3 + 0.42 * t
        w = 0.115 - 0.04 * t
        p.bl((0, y, 0), (w, 0.1, 0.07 - 0.012 * t), group='h', lean=lean)
    # the star on the end
    p.rlayer('star', YELLOW)
    pillow_poly(p, star_poly(0.13, inner=0.5, soft=2), 0.022, 0.016, Tr(0, 0.19, 0.066), nb=1)
    p.layer('skin')


def spoon():
    LEAN = -12
    p = HProp('prop_word_spoon', base=GREY, target_faces=820, voxel=0.01, smooth=3)
    p.M = Tr(0, 0.19, 0) @ Rz(LEAN) @ Tr(0, -0.19, 0)     # lean about the round end (keeps it on the floor)
    M = p.M
    L = loc_fn(M)
    cutlery_handle(p, BLUE, LEAN)
    # neck
    p.tube([(0, 0.66, 0), (0, 0.76, -0.005), (0, 0.84, -0.02)], 0.055, rseg=12)
    # the deep bowl: a dish revolved about its own axis, opening toward the camera and a little up
    RB, SZ = 0.29, 1.28
    inner = [(0.25 * i / 6, 0.035 + 0.075 * (i / 6) ** 2) for i in range(7)]
    outer = [(0.3 * (6 - i) / 6, -0.06 + 0.15 * ((6 - i) / 6) ** 2) for i in range(7)]
    dish = rounded(inner + [(0.285, 0.13), (0.305, 0.1)] + outer, 0.02, n=2)
    BC = (0, 1.13, 0.02)
    DM = M @ Tr(*BC) @ Rx(68) @ Sc(1, 1, SZ)
    Dl = loc_fn(DM)
    p.M = DM
    p.lathe(dish, seg=56)
    p.M = M
    p.paint_fn(lambda q, n: L(q).y < 0.7, BLUE)

    def dish_in(q):
        d = Dl(q)
        r = math.hypot(d.x, d.z)
        return d.y > -0.06 + 0.15 * (r / 0.3) ** 2 + 0.035 and r < 0.27, d, r
    def glint(q, n):
        ok, d, r = dish_in(q)
        a = math.degrees(math.atan2(d.x, -d.z))
        return ok and 0.13 < r < 0.2 and -95 < a < -30
    def shadow(q, n):
        ok, d, r = dish_in(q)
        a = math.degrees(math.atan2(d.x, -d.z))
        return ok and r > 0.195 and abs(a) < 75
    p.paint_fn(lambda q, n: dish_in(q)[0], lt(GREY, 0.18))
    p.paint_fn(shadow, dk(GREY, 0.1))
    p.paint_fn(glint, WHITE)
    p.ground(-0.015)
    finish(p, 1.48, outline=0.018)


def fork():
    LEAN = 12
    p = HProp('prop_word_fork', base=GREY, target_faces=820, voxel=0.01, smooth=3)
    p.M = Tr(0, 0.19, 0) @ Rz(LEAN) @ Tr(0, -0.19, 0)
    M = p.M
    L = loc_fn(M)
    cutlery_handle(p, GREEN, LEAN)
    p.tube([(0, 0.66, 0), (0, 0.76, 0), (0, 0.86, 0)], 0.055, rseg=12)
    # head: a flat rounded paddle and three fat prongs (own groups so the gaps stay open)
    p.bl((0, 0.92, 0), (0.25, 0.13, 0.065), group='head', lean=LEAN)
    p.bl((0, 0.84, 0), (0.12, 0.08, 0.06), group='head', lean=LEAN)
    PX = 0.175
    for i, x in enumerate((-PX, 0, PX)):
        for k in range(5):
            t = k / 4
            p.bl((x * (1 - 0.06 * t), 0.98 + 0.36 * t, 0), (0.068, 0.068, 0.06), group='pr%d' % i, lean=LEAN)
    p.paint_fn(lambda q, n: L(q).y < 0.7, GREEN)
    # metal band: a white glint down the left prong and across the head
    p.paint_fn(lambda q, n: n.z > 0.35 and -PX - 0.035 < L(q).x < -PX + 0.005 and 1.0 < L(q).y < 1.3, WHITE)
    p.ground(-0.014)
    finish(p, 1.5, outline=0.018)


# =====================================================================================================
def kettle():
    p = HProp('prop_word_kettle', base=RED, target_faces=800, voxel=0.012, smooth=3)
    prof = rounded([(0, 0), (0.5, 0), (0.6, 0.1), (0.67, 0.35), (0.62, 0.6), (0.45, 0.78), (0.3, 0.86), (0, 0.86)], 0.09, n=4)
    p.lathe(prof, seg=56)
    p.paint_fn(lambda q, n: q.y < 0.07, dk(RED, 0.25))
    # a lighter crescent glint on the upper left belly
    p.paint_fn(lambda q, n: n.z > 0.2 and -0.52 < q.x < -0.3 and 0.4 < q.y < 0.62 and (q.x + 0.3) ** 2 / 0.05 + (q.y - 0.36) ** 2 / 0.09 > 0.8, lt(RED, 0.35))
    # lid + ball knob
    p.layer('lid', base=dk(RED, 0.12), target_faces=300, voxel=0.01)
    p.lathe(rounded([(0, 0.82), (0.34, 0.82), (0.335, 0.88), (0.22, 0.95), (0, 0.97)], 0.03, n=2), seg=48)
    p.blob((0, 1.06, 0), (0.1, 0.1, 0.1), group='knob')
    p.capsule((0, 0.95, 0), (0, 1.02, 0), 0.05, group='kn')
    p.paint_fn(lambda q, n: q.y > 0.97, INK)
    # short curved grey spout (+x), white metal band near the tip
    p.layer('spout', base=GREY, target_faces=360, voxel=0.01)
    sp = cr_path([(0.42, 0.3, 0), (0.66, 0.4, 0), (0.82, 0.55, 0), (0.9, 0.72, 0), (0.93, 0.82, 0)], per=5)
    rads = [0.16 - 0.055 * min(1, i / (len(sp) - 4)) for i in range(len(sp))]
    rads[-1] += 0.02
    rads[-2] += 0.012
    p.tube(sp, rads, rseg=16)
    p.paint_fn(lambda q, n: 0.6 < q.y < 0.67 and q.x > 0.7, WHITE)
    # big arched handle over the top
    p.layer('handle', base=INK, target_faces=300, voxel=0.01)
    arch = [(0.38 * math.cos(math.radians(a)), 0.8 + 0.6 * math.sin(math.radians(a)), 0) for a in range(0, 181, 10)]
    p.tube(arch, 0.08, rseg=14)
    p.layer('lugs', base=GREY, target_faces=160, voxel=0.008)
    for s in (-1, 1):
        p.blob((s * 0.38, 0.78, 0), (0.1, 0.08, 0.1), group='lug%d' % (s + 1))
    # a puff of steam (bone 'steam')
    p.layer('steam', base=WHITE, target_faces=260, voxel=0.011)
    for c, r in (((1.0, 0.98, 0), 0.1), ((0.96, 1.13, 0), 0.13), ((1.08, 1.27, 0), 0.11), ((1.12, 1.12, 0), 0.08)):
        p.blob(c, (r, r * 0.9, r * 0.85), group='steam')
    p.layer('skin')
    issteam = lambda q: q.x > 0.78 and q.y > 0.9
    p.bone('body', (0, 0, 0), (0, 1.0, 0), region=lambda q: not issteam(q))
    p.bone('steam', (0.98, 0.9, 0), (1.04, 1.4, 0), parent='body', region=issteam)
    finish(p, 1.42, 1.85)


def teapot():
    BODY = lt(CREAM, 0.35)
    p = HProp('prop_word_teapot', base=BODY, target_faces=1000, voxel=0.012, smooth=3)
    prof = rounded([(0, 0), (0.42, 0), (0.5, 0.06), (0.66, 0.3), (0.66, 0.5), (0.55, 0.72), (0.38, 0.84), (0, 0.84)], 0.1, n=4)
    p.lathe(prof, seg=56)
    rw = lambda y: prof_r(prof, y)
    # long S spout to +x
    sp = cr_path([(0.42, 0.28, 0), (0.72, 0.3, 0), (0.88, 0.42, 0), (0.95, 0.6, 0), (1.03, 0.78, 0), (1.17, 0.88, 0)], per=5)
    rads = [0.17 - 0.1 * min(1, i / (len(sp) - 3)) for i in range(len(sp))]
    rads[-1] += 0.025
    p.tube(sp, rads, rseg=14)
    p.paint_fn(lambda q, n: q.y < 0.06 and math.hypot(q.x, q.z) < 0.6, BLUE)
    p.paint_fn(lambda q, n: q.x > 1.08 and q.y > 0.8, BLUE)
    # polka dots
    p.rlayer('dots', BLUE)
    DOTS = [(0.3, -60), (0.3, -20), (0.3, 20), (0.56, -40), (0.56, 0), (0.56, 40), (0.3, 160), (0.56, 180), (0.3, -130), (0.56, -150), (0.3, 120), (0.56, 140)]
    for y, a in DOTS:
        p.sticker(circle_poly(0.075, 18), y, rw, thick=0.034, ang=math.radians(a), lift=0.003)
    # blue loop handle at -x
    p.layer('handle', base=BLUE, target_faces=300, voxel=0.01)
    hp = [(-0.55 - 0.32 * math.sin(math.radians(a)), 0.5 + 0.24 * math.cos(math.radians(a)), 0) for a in range(-10, 191, 10)]
    p.tube(hp, 0.075, rseg=12)
    # blue lid with a round knob (bone 'lid')
    p.layer('lid', base=BLUE, target_faces=350, voxel=0.01)
    p.lathe(rounded([(0, 0.8), (0.4, 0.8), (0.4, 0.86), (0.27, 0.95), (0, 0.98)], 0.035, n=2), seg=48)
    p.capsule((0, 0.95, 0), (0, 1.02, 0), 0.055, group='kn')
    p.blob((0, 1.08, 0), (0.11, 0.1, 0.11), group='knob')
    p.paint_fn(lambda q, n: q.y < 0.84 and math.hypot(q.x, q.z) > 0.36, dk(BLUE, 0.15))
    p.layer('skin')
    islid = lambda q: q.y > 0.79 and math.hypot(q.x, q.z) < 0.44
    p.bone('body', (0, 0, 0), (0, 0.8, 0), region=lambda q: not islid(q))
    p.bone('lid', (0, 0.84, 0), (0, 1.2, 0), parent='body', region=islid)
    finish(p, 1.18, 2.1)


# =====================================================================================================
def watch():
    TILT = -27
    p = HProp('prop_word_watch', base=GREEN, target_faces=600, voxel=0.01, smooth=3)
    FC = 0.42          # face / strap centre height (local)
    M = Rx(TILT)
    p.M = M
    # the strap: a short wide band curled in a ring (as if round a wrist)
    RO, RI, HW = 0.6, 0.52, 0.16
    band = rounded([(RI, FC - HW), (RO, FC - HW), (RO, FC + HW), (RI, FC + HW)], 0.035, n=2, closed=True)
    p.lathe(band, seg=64, closed=True)
    # holes on the right, a buckle on the left-back
    p.rlayer('holes', INK)
    for a in (62, 82, 102):
        p.sticker(circle_poly(0.038, 14), FC, lambda y: RO, thick=0.03, ang=math.radians(a), lift=0.003)
    p.layer('buckle', base=GREY, target_faces=200, voxel=0.007)
    th = math.radians(-118)
    nrm, tan = Vector((math.sin(th), 0, math.cos(th))), Vector((math.cos(th), 0, -math.sin(th)))
    fr = lambda u, y, d=0.02: tuple(nrm * (RO + d) + tan * u + Vector((0, y, 0)))
    p.tube(rounded([fr(-0.13, FC - 0.19), fr(-0.13, FC + 0.19), fr(0.09, FC + 0.19), fr(0.09, FC - 0.19)], 0.06, n=3, closed=True), 0.036, closed=True, rseg=10)
    p.tube([fr(-0.13, FC, 0.03), fr(0.07, FC, 0.03)], 0.032, rseg=8)
    # the case (yellow) and the face (white)
    CZ = RO - 0.08
    p.layer('case', base=YELLOW, target_faces=320, voxel=0.01)
    p.cyl((0, FC, CZ), 0.355, 0.17, rot=(90, 0, 0), bevel=0.07, seg=48)
    F = CZ + 0.17
    p.rlayer('dial', WHITE)
    pill(p, 0.275, 0.275, 0.028, Tr(0, FC, F - 0.008), n=6)
    p.rlayer('ink', INK)
    for k in range(4):
        a = k * math.pi / 2
        pill(p, 0.042, 0.042, 0.018, n=2, M=Tr(0.2 * math.sin(a), FC + 0.2 * math.cos(a), F + 0.018))
    # hands: red hour (to 10), blue minute (to 2), yellow pin
    p.rlayer('hour', RED)
    pill(p, 0.045, 0.1, 0.018, Tr(0, FC, F + 0.026) @ Rz(60) @ Tr(0, 0.06, 0), n=2)
    p.rlayer('minute', BLUE)
    pill(p, 0.04, 0.135, 0.018, Tr(0, FC, F + 0.044) @ Rz(-60) @ Tr(0, 0.095, 0), n=2)
    p.rlayer('pin', YELLOW)
    pill(p, 0.05, 0.05, 0.018, Tr(0, FC, F + 0.06), n=3)
    p.layer('skin')
    p.M = None
    p.ground()
    finish(p, 0.9, 1.25, outline=0.018)


def phone():
    p = HProp('prop_word_phone', base=GREY, target_faces=140, voxel=0.01, smooth=3)
    # the stand: a low base with a lip and a back rest
    pillow(p, 0.33, 0.24, 0.12, 0.045, 0.03, Tr(0, 0.045, -0.04) @ Rx(-90))
    p.box((0, 0.11, 0.13), (0.3, 0.05, 0.04), bevel=0.03)
    p.box((0, 0.3, -0.26), (0.18, 0.28, 0.04), rot=(-15, 0, 0), bevel=0.035)
    # the phone, leaning back 15 deg from its bottom edge
    PM = Tr(0, 0.09, 0.05) @ Rx(-15)
    H2 = 0.72
    p.layer('phone', base=INK, target_faces=260, voxel=0.01)
    pillow(p, 0.4, H2, 0.17, 0.07, 0.05, PM @ Tr(0, H2, 0))
    SM = PM @ Tr(0, H2, 0)
    p.rlayer('screen', SKY)
    softsq(p, 0.335, 0.63, 0.12, 0.02, SM @ Tr(0, 0, 0.068))
    p.rlayer('glint', WHITE)
    pill(p, 0.028, 0.1, 0.012, SM @ Tr(0.23, 0.48, 0.09) @ Rz(-35), n=2)
    # 3 x 3 app squares
    p.rlayer('apps', RED)
    COLS = [[RED, ORANGE, YELLOW], [PURPLE, BLUE, PINK], [PINK, YELLOW, ORANGE]]
    centres = []
    for r in range(3):
        for c in range(3):
            cx, cy = (c - 1) * 0.205, 0.43 - r * 0.205
            centres.append((cx, cy, COLS[r][c]))
            pillow(p, 0.08, 0.08, 0.035, 0.016, 0.0144, SM @ Tr(cx, cy, 0.09), n=2, nb=1)
    Ls = loc_fn(SM)
    for cx, cy, col in centres:
        p.paint_fn(lambda q, n, cx=cx, cy=cy: abs(Ls(q).x - cx) < 0.1 and abs(Ls(q).y - cy) < 0.1, col)
    # the green call button with a white handset
    p.rlayer('call', GREEN)
    pill(p, 0.135, 0.135, 0.016, SM @ Tr(0, -0.39, 0.09), n=5)
    p.rlayer('handset', WHITE)
    hs = [(0.07 * math.cos(math.radians(a)), 0.07 * math.sin(math.radians(a)), 0.112) for a in range(125, 326, 20)]
    hs = [tuple(SM @ Tr(0, -0.39, 0) @ Vector(v)) for v in hs]
    p.tube(hs, [0.036, 0.032, 0.022, 0.02, 0.02, 0.02, 0.02, 0.022, 0.032, 0.036, 0.036], rseg=8)
    p.layer('skin')
    finish(p, 1.5, 0.8)


def torch():
    TILT = 7
    p = HProp('prop_word_torch', base=RED, target_faces=800, voxel=0.011, smooth=3)
    M = Rz(TILT)
    p.M = M
    L = loc_fn(M)
    AX = (0, 0, -90)     # a lathe about y laid along +x
    prof = rounded([(0, -0.76), (0.2, -0.76), (0.235, -0.7), (0.235, 0.18), (0.27, 0.26), (0.38, 0.46), (0.4, 0.56), (0.34, 0.6), (0, 0.6)], 0.04, n=3)
    p.lathe(prof, rot=AX, seg=48)
    for x in (-0.6, -0.48, -0.36, -0.24):
        p.ring((x, 0, 0), 0.235, 0.035, rot=(0, 0, 90), seg=40, rseg=8)
    rad = lambda q: math.hypot(L(q).y, L(q).z)
    p.paint_fn(lambda q, n: -0.66 < L(q).x < -0.18 and rad(q) > 0.248, dk(RED, 0.2))
    p.paint_fn(lambda q, n: L(q).x > 0.2, GREY)
    p.paint_fn(lambda q, n: L(q).x < -0.72, dk(RED, 0.2))
    # white metal band: a fat rim round the lens
    p.layer('rim', base=WHITE, target_faces=200, voxel=0.008)
    p.ring((0.565, 0, 0), 0.355, 0.045, rot=(0, 0, 90), seg=40, rseg=10)
    # lens
    p.layer('lens', base=YELLOW, target_faces=160, voxel=0.007)
    p.cyl((0.55, 0, 0), 0.31, 0.06, rot=(0, 0, -90), bevel=0.02, seg=40)
    # slide switch on top
    p.layer('switch', base=BLUE, target_faces=140, voxel=0.007)
    p.box(p.P((-0.06, 0.245, 0)), (0.12, 0.05, 0.085), rot=(0, 0, TILT), bevel=0.04)
    p.layer('skin')
    p.M = None
    d = p.ground(0.02)
    # the light (hidden until 'on'); outside the ground pass so it never lifts the torch
    p.M = Tr(0, d, 0) @ M
    p.layer('cloth_beam', base=lt(YELLOW, 0.55), target_faces=200, voxel=0.012)
    p.lathe(rounded([(0, 0.6), (0.3, 0.6), (0.6, 1.4), (0, 1.4)], 0.05, n=2), rot=AX, seg=40)
    p.layer('skin')
    p.M = None
    finish(p, 0.8, 1.45, outline=0.018)


def broom():
    LEAN = -10
    p = HProp('prop_word_broom', base=YELLOW, target_faces=800, voxel=0.011, smooth=3)
    M = Rz(LEAN)
    p.M = M
    L = loc_fn(M)
    # bristle fan: two rows of chunky strands, bundled at the top
    NS = 7
    for row, (z, dy, off) in enumerate(((0.07, 0.0, 0.0), (-0.07, 0.04, 0.5))):
        for i in range(NS - row):
            u = (i + off) / (NS - 1) * 2 - 1
            top = (u * 0.15, 0.95, z * 0.6)
            bot = (u * 0.57, 0.08 + dy, z)
            for k in range(7):
                t = k / 6
                pos = Vector(top).lerp(Vector(bot), t)
                r = 0.085 - 0.014 * t
                p.bl(tuple(pos), (r, r, r), group='s%d_%d' % (row, i))
    p.bl((0, 0.9, 0), (0.23, 0.19, 0.15), group='bundle', lean=LEAN)
    p.paint_fn(lambda q, n: L(q).y < 0.18, dk(YELLOW, 0.1))
    # two red bands, red tip
    p.layer('red', base=RED, target_faces=320, voxel=0.009)
    for y in (0.8, 0.97):
        p.ring((0, y, 0), 0.225, 0.046, scale=(1, 0.7), seg=40, rseg=10)
    p.cyl((0, 2.3, 0), 0.1, 0.18, bevel=0.06, seg=24)
    # long fat wood handle with two grain lines
    p.layer('handle', base=WOOD, target_faces=300, voxel=0.01)
    p.cyl((0, 0.95, 0), 0.08, 1.4, bevel=0.03, seg=20)
    ang = lambda q: math.degrees(math.atan2(L(q).x, L(q).z))
    p.paint_fn(lambda q, n: 1.15 < L(q).y < 2.15 and (abs(ang(q) + 25) < 9 or (abs(ang(q) - 30) < 8 and L(q).y < 1.85)), dk(WOOD, 0.22))
    p.layer('skin')
    p.M = None
    d = p.ground(-0.026)
    # a little dust puff at the bristles (after grounding: it sits on the floor too)
    p.layer('dust', base=lt(GREY, 0.45), target_faces=160, voxel=0.01)
    for c, r in (((0.74, 0.09, 0.12), 0.09), ((0.88, 0.12, 0.08), 0.11), ((1.01, 0.08, 0.1), 0.08)):
        p.blob(c, (r, r * 0.85, r), group='d')
    p.layer('skin')
    finish(p, 2.42, outline=0.026)


def vacuum():
    p = HProp('prop_word_vacuum', base=PURPLE, target_faces=1000, voxel=0.013, smooth=3)
    BC, BS = (-0.3, 0.55, 0), (0.55, 0.44, 0.43)
    p.blob(BC, BS, group='body')
    p.blob((-0.3, 0.88, 0), (0.42, 0.14, 0.34), group='body')
    p.paint_fn(lambda q, n: 0.28 < q.y < 0.33, dk(PURPLE, 0.18))
    # socket for the hose
    p.cyl((0.18, 0.62, 0), 0.13, 0.1, rot=(0, 0, -70), bevel=0.04, seg=24)
    p.paint_fn(lambda q, n: q.x > 0.18 and 0.5 < q.y < 0.78, GREY)
    # yellow button on top
    p.layer('button', base=YELLOW, target_faces=150, voxel=0.008)
    p.cyl((-0.55, 0.95, 0.0), 0.12, 0.08, bevel=0.035, seg=24)
    # dust window on the front: sky, a white glint, grey dust at the bottom
    p.rlayer('window', SKY)
    WX, WY = -0.26, 0.58
    WM = Tr(WX, WY, 0) @ Ry(6) @ Tr(0, 0, 0.43)
    softsq(p, 0.2, 0.15, 0.07, 0.03, WM)
    Lw = loc_fn(WM)
    p.paint_fn(lambda q, n: Lw(q).y < -0.05 + 0.022 * math.sin(Lw(q).x * 34) and Lw(q).z > 0.0, lt(GREY, 0.1))
    p.paint_fn(lambda q, n: Lw(q).z > 0.0 and abs(Lw(q).x + 0.09 + (Lw(q).y - 0.05) * 0.9) < 0.026 and Lw(q).y > -0.02, WHITE)
    # two big wheels (ink tyres, grey hubs)
    p.layer('wheels', base=INK, target_faces=420, voxel=0.01)
    for s in (-1, 1):
        p.cyl((-0.42, 0.28, s * 0.36), 0.28, 0.14, rot=(90 * s, 0, 0), bevel=0.06, seg=40)
    p.layer('hubs', base=GREY, target_faces=140, voxel=0.008)
    for s in (-1, 1):
        p.cyl((-0.42, 0.28, s * 0.48), 0.12, 0.05, rot=(90 * s, 0, 0), bevel=0.025, seg=24)
    # fat ribbed hose looping up and over to the floor head
    p.layer('hose', base=GREY, target_faces=800, voxel=0.008)
    path = cr_path([(0.2, 0.66, 0), (0.36, 0.92, 0), (0.6, 1.07, 0), (0.84, 0.98, 0), (0.95, 0.72, 0), (0.98, 0.42, 0), (1.0, 0.22, 0)], per=8)
    pts, LEN = resample(path, 0.02)
    rads = [0.088 + 0.016 * max(0, math.cos(i * 0.02 / 0.09 * TAU)) ** 0.6 for i in range(len(pts))]
    p.tube(pts, rads, rseg=14)
    p.paint_fn(lambda q, n: q.y < 0.3 and q.x > 0.85, lt(GREY, 0.2))
    # wide floor head
    p.layer('head', base=SLATE, target_faces=260, voxel=0.01)
    p.box((1.02, 0.1, 0), (0.22, 0.1, 0.38), bevel=0.08)
    p.box((1.0, 0.21, 0), (0.1, 0.05, 0.1), bevel=0.04)
    p.paint_fn(lambda q, n: q.x > 1.17 and q.y < 0.16, dk(SLATE, 0.2))
    p.layer('skin')
    finish(p, 1.15, 2.1, outline=0.022)


def scissors():
    p = HProp('prop_word_scissors', base=GREY, target_faces=700, voxel=0.009, smooth=3)
    PV = Vector((0, 0.66, 0))
    OPEN = 20
    dirs = {}
    for side, s in (('A', -1), ('B', 1)):          # A: blade up-left (in front) + handle down-right
        a = math.radians(OPEN) * s
        d = Vector((math.sin(a), math.cos(a), 0))
        dirs[side] = d
        z = 0.04 if side == 'A' else -0.04
        for k in range(10):
            t = k / 9
            w = 0.1 - 0.03 * t if t < 0.85 else 0.07 - 0.09 * (t - 0.85)
            c = PV + d * (0.02 + 0.66 * t)
            p.blob((c.x, c.y, z), (w + 0.01, w + 0.01, 0.042), group='bl' + side)
    # the white metal glint along each blade
    def glint(q, n):
        for side in 'AB':
            d = dirs[side]
            v = Vector(q) - PV
            along = v.dot(d)
            across = v.x * d.y - v.y * d.x
            if 0.18 < along < 0.55 and 0.012 < across * (1 if side == 'A' else -1) < 0.045 and n.z > 0.4 and (q.z > 0.03 if side == 'A' else True):
                return True
        return False
    p.paint_fn(glint, WHITE)
    # loop handles (orange = A on the right, blue = B on the left) with fat arms to the pivot
    for side, col, s in (('A', ORANGE, 1), ('B', BLUE, -1)):
        p.layer('loop' + side, base=col, target_faces=450, voxel=0.009)
        z = 0.04 if side == 'A' else -0.04
        C = Vector((s * 0.3, 0.25, z))
        p.ring(tuple(C), 0.165, 0.062, rot=(90, 0, 0), scale=(1.0, 0.92), seg=40, rseg=12)
        p.tube(cr_path([(PV.x + s * 0.01, PV.y - 0.02, z), (s * 0.12, 0.5, z), (C.x - s * 0.1, C.y + 0.14, z)], per=4), 0.07, rseg=12)
    p.layer('pivot', base=YELLOW, target_faces=150, voxel=0.006)
    p.cyl((0, PV.y, 0.05), 0.07, 0.06, rot=(90, 0, 0), bevel=0.025, seg=20)
    p.layer('skin')
    PV = PV + Vector((0, p.ground(-0.013), 0))

    def half(q):
        v = Vector(q) - PV
        if v.length < 0.13:
            return 'A' if q.z > 0 else 'B'
        if v.y > 0:
            return 'A' if v.x < 0 else 'B'
        return 'A' if v.x > 0 else 'B'
    ispin = lambda q: (Vector(q) - PV).length < 0.085 and q.z > 0.075
    p.bone('body', (0, 0, 0), (0, PV.y, 0), region=ispin)
    p.bone('blade.L', tuple(PV), tuple(PV + Vector((0, 0.5, 0))), parent='body', region=lambda q: not ispin(q) and half(q) == 'A')
    p.bone('blade.R', tuple(PV), tuple(PV + Vector((0, 0.5, 0))), parent='body', region=lambda q: not ispin(q) and half(q) == 'B')
    finish(p, 1.4, 1.06, outline=0.018)


def hammer():
    LEAN, YAW = 12, -28
    p = HProp('prop_word_hammer', base=RED, target_faces=800, voxel=0.01, smooth=3)
    M = Tr(0.0, 0.0, 0) @ Rz(LEAN) @ Ry(YAW)
    p.M = M
    L = loc_fn(M)
    HY = 1.22
    AX = (0, 0, -90)
    # the head: a chunky rounded drum, rounded peen at -x
    p.lathe(rounded([(0, -0.46), (0.1, -0.455), (0.15, -0.4), (0.17, -0.3), (0.2, -0.22), (0.21, 0.3), (0.0, 0.3)], 0.05, n=4), pos=(0, HY, 0), rot=AX, seg=40)
    p.paint_fn(lambda q, n: -0.26 < L(q).x < -0.2, dk(RED, 0.2))
    # the yellow flat striking face at +x
    p.layer('face', base=YELLOW, target_faces=250, voxel=0.008)
    p.cyl((0.27, HY, 0), 0.235, 0.15, rot=(0, 0, -90), bevel=0.05, seg=40)
    # fat wood handle with two grain lines
    p.layer('handle', base=WOOD, target_faces=400, voxel=0.01)
    p.cyl((0, 0.0, 0), 0.105, HY, r2=0.09, bevel=0.07, seg=24)
    ang = lambda q: math.degrees(math.atan2(L(q).x, L(q).z))
    p.paint_fn(lambda q, n: 0.2 < L(q).y < 0.95 and (abs(ang(q) - 5) < 9 or (abs(ang(q) - 52) < 8 and L(q).y > 0.35)), dk(WOOD, 0.22))
    p.layer('skin')
    p.M = None
    finish(p, 1.45, outline=0.018)


def vase():
    p = HProp('prop_word_vase', base=BLUE, target_faces=720, voxel=0.012, smooth=3)
    prof = rounded([(0, 0), (0.28, 0), (0.36, 0.05), (0.47, 0.3), (0.46, 0.5), (0.3, 0.78), (0.17, 0.93), (0.165, 1.02),
                    (0.25, 1.15), (0.3, 1.2), (0.22, 1.22), (0.0, 1.18)], 0.05, n=4)
    p.lathe(prof, seg=56)
    p.paint_fn(lambda q, n: q.y > 1.16 and math.hypot(q.x, q.z) < 0.24, dk(BLUE, 0.4))
    p.paint_fn(lambda q, n: q.y < 0.05, dk(BLUE, 0.15))
    rw = lambda y: prof_r(prof, y)
    # white wavy band
    p.rlayer('wave', WHITE)
    N = 96
    verts, faces = [], []
    for i in range(N):
        a = TAU * i / N
        for y, d in ((0.33, -0.015), (0.47, -0.015), (0.47, 0.02), (0.33, 0.02)):
            yy = y + 0.035 * math.sin(a * 7)
            r = rw(yy) + d
            verts.append((r * math.sin(a), yy, r * math.cos(a)))
    for i in range(N):
        j = (i + 1) % N
        for k in range(4):
            k2 = (k + 1) % 4
            faces.append((i * 4 + k, j * 4 + k, j * 4 + k2, i * 4 + k2))
    p.mesh(verts, faces)
    # stems and leaves
    p.layer('stems', base=GREEN, target_faces=340, voxel=0.008)
    TUL, DAI, PNK = (0.0, 1.78, 0.06), (-0.38, 1.58, 0.1), (0.38, 1.52, 0.1)
    p.tube(cr_path([(0, 1.0, 0), (0.0, 1.35, 0.02), (0.0, 1.7, 0.05)], per=5), 0.048, rseg=10)
    p.tube(cr_path([(-0.05, 1.0, 0), (-0.14, 1.32, 0.03), (-0.36, 1.55, 0.09)], per=5), 0.045, rseg=10)
    p.tube(cr_path([(0.05, 1.0, 0), (0.15, 1.28, 0.03), (0.36, 1.48, 0.09)], per=5), 0.045, rseg=10)
    p.layer('leaves', base=LEAF, target_faces=200, voxel=0.008)
    p.blob((-0.17, 1.33, 0.06), (0.16, 0.055, 0.035), rot=(0, 0, 35), group='lf1')
    p.blob((0.19, 1.3, 0.06), (0.15, 0.05, 0.035), rot=(0, 0, -30), group='lf2')
    # red tulip
    p.layer('tulip', base=RED, target_faces=300, voxel=0.008)
    p.blob((0, TUL[1] - 0.04, TUL[2]), (0.14, 0.11, 0.12), group='cup')
    for s, sz in ((-1, 0.09), (1, 0.09)):
        p.blob((s * 0.08, TUL[1] + 0.04, TUL[2]), (sz, 0.15, 0.09), rot=(0, 0, -s * 14), group='pt%d' % s)
    p.blob((0, TUL[1] + 0.05, TUL[2] + 0.05), (0.085, 0.15, 0.07), group='pc')
    p.paint_group(['pt-1', 'pt1'], dk(RED, 0.12))
    # yellow daisy (orange middle)
    p.layer('daisy', base=YELLOW, target_faces=320, voxel=0.008)
    for k in range(8):
        a = TAU * k / 8
        c = (DAI[0] + 0.11 * math.cos(a), DAI[1] + 0.11 * math.sin(a), DAI[2])
        p.blob(c, (0.058, 0.1, 0.03), rot=(0, 0, math.degrees(a) - 90), group='d%d' % k)
    p.layer('daisyc', base=ORANGE, target_faces=120, voxel=0.007)
    p.blob((DAI[0], DAI[1], DAI[2] + 0.03), (0.07, 0.07, 0.04), group='dc')
    # pink flower (yellow middle)
    p.layer('pink', base=PINK, target_faces=280, voxel=0.008)
    for k in range(5):
        a = TAU * k / 5 + math.pi / 2
        c = (PNK[0] + 0.095 * math.cos(a), PNK[1] + 0.095 * math.sin(a), PNK[2])
        p.blob(c, (0.085, 0.085, 0.035), group='p%d' % k)
    p.layer('pinkc', base=YELLOW, target_faces=120, voxel=0.007)
    p.blob((PNK[0], PNK[1], PNK[2] + 0.03), (0.055, 0.055, 0.035), group='pc')
    p.layer('skin')
    finish(p, 1.97, outline=0.026)


def candle():
    p = HProp('prop_word_candle', base=BLUE, target_faces=500, voxel=0.011, smooth=3)
    # holder: a dish with a raised rim, a socket, a finger loop on +x
    p.lathe(rounded([(0, 0), (0.52, 0), (0.58, 0.05), (0.58, 0.13), (0.53, 0.16), (0.46, 0.12), (0.0, 0.11)], 0.03, n=3), seg=56)
    p.lathe(rounded([(0.33, 0.08), (0.41, 0.08), (0.41, 0.24), (0.33, 0.24)], 0.03, n=2, closed=True), seg=48, closed=True)
    p.paint_fn(lambda q, n: q.y < 0.04, dk(BLUE, 0.15))
    p.layer('loop', base=BLUE, target_faces=200, voxel=0.009)
    p.ring((0.68, 0.2, 0), 0.14, 0.055, rot=(90, 0, 0), seg=32, rseg=10)
    # the candle
    p.layer('candle', base=CREAM, target_faces=260, voxel=0.01)
    p.cyl((0, 0.1, 0), 0.3, 0.72, bevel=0.07, seg=40)
    # wax pool on top + two drips (lighter cream, own layer for a crisp inked edge)
    p.layer('drips', base=lt(CREAM, 0.5), target_faces=260, voxel=0.007)
    p.lathe(rounded([(0, 0.8), (0.25, 0.8), (0.27, 0.835), (0.0, 0.84)], 0.015, n=2), seg=40)
    for a, ln in ((-22, 0.26), (30, 0.16)):
        ar = math.radians(a)
        for k in range(6):
            t = k / 5
            y = 0.82 - ln * t
            r = 0.3 + 0.004
            w = 0.045 if t < 1 else 0.06
            p.blob((r * math.sin(ar), y, r * math.cos(ar)), (w, w, 0.03), rot=(0, a, 0), group='dr%d' % a)
    # wick and flame
    p.layer('wick', base=INK, target_faces=80, voxel=0.006)
    p.capsule((0, 0.8, 0), (0, 0.93, 0), 0.03, group='w')
    p.layer('flame', base=YELLOW, target_faces=240, voxel=0.008)
    for (y, rx, ry) in ((1.06, 0.13, 0.13), (1.17, 0.1, 0.13), (1.28, 0.06, 0.1), (1.36, 0.03, 0.05)):
        p.blob((0, y, 0), (rx, ry, rx * 0.85), group='fl')
    p.paint('core', (0, 1.06, 0), (0.07, 0.1, 0.3), ORANGE)
    p.layer('skin')
    isfl = lambda q: q.y > 0.94
    p.bone('body', (0, 0, 0), (0, 0.9, 0), region=lambda q: not isfl(q))
    p.bone('flame', (0, 0.93, 0), (0, 1.4, 0), parent='body', region=isfl)
    finish(p, 1.4, 1.38, outline=0.018)


def tv():
    p = HProp('prop_word_tv', base=INKSLATE, target_faces=700, voxel=0.011, smooth=3)
    FY = 0.8
    pillow(p, 0.85, 0.56, 0.2, 0.1, 0.06, Tr(0, FY, 0))
    # stand: neck + oval foot
    p.box((0, 0.17, -0.02), (0.12, 0.12, 0.06), bevel=0.04)
    p.cyl((0, 0, -0.02), 0.36, 0.07, bevel=0.03, scale=(1, 0.55), seg=40)
    # screen + scene: a green hill, a yellow sun, a white glint
    SM = Tr(0, FY, 0)
    p.rlayer('screen', SKY)
    softsq(p, 0.72, 0.44, 0.13, 0.022, SM @ Tr(0, 0, 0.1))
    p.rlayer('hill', GREEN)
    hill = [(x / 24 * 1.3 - 0.65, -0.3 + 0.27 * math.exp(-((x / 24 * 1.3 - 0.65 + 0.2) / 0.4) ** 2) + 0.05 * math.exp(-((x / 24 * 1.3 - 0.65 - 0.4) / 0.25) ** 2)) for x in range(25)]
    pillow_poly(p, [(0.62, -0.37), (0.64, -0.33)] + hill[::-1][1:-1] + [(-0.64, -0.33), (-0.62, -0.37)], 0.014, 0.01, SM @ Tr(0, 0, 0.128), nb=1)
    p.rlayer('sun', YELLOW)
    pill(p, 0.12, 0.12, 0.016, SM @ Tr(0.42, 0.2, 0.13), n=6)
    p.rlayer('glint', WHITE)
    pill(p, 0.026, 0.1, 0.012, SM @ Tr(-0.56, 0.24, 0.13) @ Rz(-35), n=2)
    p.rlayer('power', RED)
    pill(p, 0.042, 0.042, 0.016, SM @ Tr(0.7, -0.5, 0.098), n=2)
    # the remote, lying in front
    p.layer('remote', base=SLATE, target_faces=200, voxel=0.008)
    RM = Tr(0.56, 0.21, 0.5) @ Ry(-28) @ Rx(-62)
    pillow(p, 0.12, 0.32, 0.11, 0.05, 0.035, RM)
    p.rlayer('rbuttons', RED)
    pill(p, 0.055, 0.055, 0.016, RM @ Tr(0, 0.17, 0.05), n=2)
    for i, (x, y) in enumerate(((-0.05, 0.02), (0.05, 0.02), (-0.05, -0.1), (0.05, -0.1))):
        pill(p, 0.034, 0.034, 0.014, RM @ Tr(x, y, 0.05), n=2)
    Lr = loc_fn(RM)
    p.paint_fn(lambda q, n: Lr(q).y < 0.06, BLUE)
    p.paint_fn(lambda q, n: Lr(q).y < 0.06 and Lr(q).x > 0, YELLOW)
    p.layer('skin')
    finish(p, 1.36, 1.7)


def cup():
    p = HProp('prop_word_cup', base=BLUE, target_faces=800, voxel=0.011, smooth=3)
    R, H, T = 0.42, 0.86, 0.075
    M = Rx(16)          # tipped a little toward the child so the inside of the mug shows
    p.M = M
    prof = rounded([(0, 0), (R - 0.05, 0), (R, 0.06), (R + 0.03, 0.4), (R + 0.01, H - 0.04), (R - 0.01, H), (R - T, H - 0.02), (R - T, 0.17), (0, 0.17)], 0.035, n=3)
    Lc = loc_fn(M)
    p.lathe(prof, seg=56)
    p.paint_fn(lambda q, n: math.hypot(Lc(q).x, Lc(q).z) < R - T + 0.012 and Lc(q).y > 0.1, lt(CREAM, 0.3))
    p.paint_fn(lambda q, n: Lc(q).y < 0.05, dk(BLUE, 0.15))
    rw = lambda y: prof_r(prof, y)
    p.rlayer('glint', WHITE)
    p.sticker(rrect(0.045, 0.15, 0.044, 4), 0.46, rw, thick=0.034, ang=math.radians(-26), lift=0.003)
    # chunky yellow handle on +x
    p.layer('handle', base=YELLOW, target_faces=360, voxel=0.01)
    hp = [(R - 0.03 + 0.24 * math.cos(math.radians(a)), 0.45 + 0.25 * math.sin(math.radians(a)), 0) for a in range(-75, 76, 10)]
    p.tube(hp, 0.085, rseg=14)
    p.layer('skin')
    p.M = None
    p.ground(-0.008)
    finish(p, H, 1.1, outline=0.018)


def jar():
    p = HProp('prop_word_jar', base=SKY, target_faces=800, voxel=0.011, smooth=3)
    prof = rounded([(0, 0), (0.4, 0), (0.46, 0.06), (0.47, 0.6), (0.43, 0.72), (0.34, 0.79), (0.33, 0.8), (0, 0.8)], 0.06, n=4)
    p.lathe(prof, seg=56)
    rw = lambda y: prof_r(prof, y)
    # sweets inside (seen through the glass): round coloured beads in the bottom half
    BEADS = [(0.15, -50, RED), (0.15, -18, YELLOW), (0.15, 14, GREEN), (0.15, 46, PURPLE), (0.31, -34, ORANGE), (0.31, -2, PINK),
             (0.31, 30, RED), (0.46, -18, PURPLE), (0.46, 14, ORANGE), (0.46, -50, YELLOW), (0.46, 46, PINK)]
    for col in sorted(set(c for _, _, c in BEADS)):
        p.rlayer('sweets%06x' % col, col)
        for y, a, c in BEADS:
            if c == col:
                p.sticker(circle_poly(0.072, 14), y, rw, thick=0.036, ang=math.radians(a), lift=0.003)
    p.rlayer('glint', WHITE)
    p.sticker(rrect(0.04, 0.15, 0.039, 4), 0.42, rw, thick=0.034, ang=math.radians(-44), lift=0.003)
    p.sticker(rrect(0.03, 0.05, 0.029, 4), 0.64, rw, thick=0.034, ang=math.radians(-44), lift=0.003)
    # chunky screw lid with grip ridges (bone 'lid')
    p.layer('lid', base=ORANGE, target_faces=420, voxel=0.01)
    p.lathe(rounded([(0, 0.81), (0.38, 0.81), (0.4, 0.84), (0.4, 0.99), (0.36, 1.02), (0, 1.02)], 0.03, n=3), seg=56)
    p.paint_fn(lambda q, n: 0.855 < q.y < 0.895 or 0.93 < q.y < 0.97, dk(ORANGE, 0.14))
    p.layer('skin')
    islid = lambda q: q.y > 0.805
    p.bone('body', (0, 0, 0), (0, 0.78, 0), region=lambda q: not islid(q))
    p.bone('lid', (0, 0.84, 0), (0, 1.2, 0), parent='body', region=islid)
    finish(p, 1.02, 0.94, outline=0.018)


def lamp():
    p = HProp('prop_word_lamp', base=BLUE, target_faces=700, voxel=0.011, smooth=3)
    # round base and a fat stem
    p.lathe(rounded([(0, 0), (0.44, 0), (0.46, 0.05), (0.38, 0.13), (0.14, 0.17), (0, 0.17)], 0.03, n=3), seg=48)
    p.cyl((0, 0.12, 0), 0.075, 0.95, bevel=0.03, seg=20)
    p.paint_fn(lambda q, n: q.y < 0.05, dk(BLUE, 0.15))
    # bulb peeking out of the top of the shade
    p.layer('bulb', base=WHITE, target_faces=160, voxel=0.01)
    p.blob((0, 1.16, 0), (0.15, 0.17, 0.15), group='bulb')
    # the shade: an open drum, wider at the bottom (layer 'shade': the game makes it glow)
    p.rlayer('shade', YELLOW)
    p.lathe(rounded([(0.56, 0.86), (0.62, 0.86), (0.42, 1.48), (0.36, 1.48)], 0.018, n=1, closed=True), seg=40, closed=True)
    p.paint_fn(lambda q, n: math.hypot(q.x, q.z) < 0.62 - (q.y - 0.86) * 0.32 - 0.035, lt(YELLOW, 0.5))
    p.layer('trim', base=WHITE, target_faces=240, voxel=0.009)
    p.ring((0, 0.87, 0), 0.605, 0.04, seg=40, rseg=6)
    p.ring((0, 1.47, 0), 0.4, 0.035, seg=32, rseg=6)
    # pull cord with a red bead
    p.layer('cord', base=INK, target_faces=120, voxel=0.007)
    p.tube([(0.3, 0.92, 0.3), (0.3, 0.62, 0.3)], 0.024, rseg=8)
    p.layer('bead', base=RED, target_faces=100, voxel=0.007)
    p.blob((0.3, 0.6, 0.3), (0.055, 0.065, 0.055), group='bead')
    p.layer('skin')
    finish(p, 1.51, 1.26, outline=0.026)


def basket():
    p = HProp('prop_word_basket', base=WOOD, target_faces=800, voxel=0.011, smooth=3)
    SX, SZ = 1.2, 0.85
    prof = rounded([(0, 0), (0.4, 0), (0.45, 0.05), (0.5, 0.56), (0.46, 0.6), (0.42, 0.55), (0, 0.55)], 0.03, n=3)
    p.lathe(prof, seg=56, scale=(SX, SZ))
    # woven look: fat coils stacked up the side, alternate coils a shade darker
    rw = lambda y: prof_r(prof, y)
    YS = [0.07 + 0.093 * k for k in range(5)]
    for y in YS:
        p.ring((0, y, 0), rw(y) - 0.01, 0.05, scale=(SX, SZ), seg=64, rseg=10)
    p.paint_fn(lambda q, n: 0.025 < q.y < 0.53 and int((q.y - 0.07 + 0.0465) / 0.093) % 2 == 1, dk(WOOD, 0.14))
    p.paint_fn(lambda q, n: q.y > 0.5 and math.hypot(q.x / SX, q.z / SZ) < 0.43, dk(WOOD, 0.35))
    # braided rim + an arched handle (second colour so the holdable part reads)
    p.layer('rim', base=BROWN, target_faces=360, voxel=0.009)
    p.ring((0, 0.575, 0), 0.475, 0.045, scale=(SX, SZ), seg=64, rseg=10)
    p.layer('handle', base=BROWN, target_faces=420, voxel=0.01)
    arch = [(0.5 * SX * math.cos(math.radians(a)), 0.52 + 0.62 * math.sin(math.radians(a)), 0) for a in range(0, 181, 9)]
    p.tube(arch, 0.07, rseg=12)
    p.paint_fn(lambda q, n: q.y > 0.62 and math.cos(math.atan2(q.y - 0.52, q.x / SX) * 26) > 0.55, dk(BROWN, 0.18))
    p.layer('skin')
    finish(p, 1.21, 1.3, outline=0.018)


def bin_():
    p = HProp('prop_word_bin', base=GREEN, target_faces=700, voxel=0.011, smooth=3)
    H = 1.0
    p.lathe(rounded([(0, 0), (0.38, 0), (0.42, 0.05), (0.46, H), (0, H)], 0.05, n=3), seg=56)
    p.paint_fn(lambda q, n: q.y < 0.07, dk(GREEN, 0.2))
    p.paint_fn(lambda q, n: 0.86 < q.y < 0.93, lt(GREEN, 0.35))
    p.rlayer('glint', WHITE)
    p.sticker(rrect(0.04, 0.2, 0.039, 4), 0.52, lambda y: 0.42 + 0.04 * (y - 0.05) / 0.95, thick=0.034, ang=math.radians(-42), lift=0.003)
    # the pedal
    p.layer('pedal', base=GREY, target_faces=200, voxel=0.008)
    p.box((0, 0.07, 0.47), (0.15, 0.04, 0.09), bevel=0.035)
    # the lid, baked on (bone 'lid', hinged at the back): grey metal dome with a white band and a knob
    p.layer('lid', base=GREY, target_faces=450, voxel=0.01)
    p.lathe(rounded([(0, H + 0.01), (0.48, H + 0.01), (0.49, H + 0.06), (0.38, H + 0.15), (0.2, H + 0.19), (0, H + 0.2)], 0.04, n=3), seg=56)
    p.blob((0, H + 0.22, 0), (0.12, 0.06, 0.08), group='knob')
    p.paint_fn(lambda q, n: H + 0.065 < q.y < H + 0.11, WHITE)
    p.layer('skin')
    islid = lambda q: q.y > H + 0.005
    p.bone('body', (0, 0, 0), (0, H, 0), region=lambda q: not islid(q))
    p.bone('lid', (0, H + 0.02, -0.47), (0, H + 0.4, -0.47), parent='body', region=islid)
    finish(p, H + 0.27, 0.98, outline=0.018)


BUILDERS = [('prop_word_bottle', bottle), ('prop_word_spoon', spoon), ('prop_word_fork', fork), ('prop_word_kettle', kettle),
            ('prop_word_teapot', teapot), ('prop_word_watch', watch), ('prop_word_phone', phone), ('prop_word_torch', torch),
            ('prop_word_broom', broom), ('prop_word_vacuum', vacuum), ('prop_word_scissors', scissors),
            ('prop_word_hammer', hammer), ('prop_word_vase', vase), ('prop_word_candle', candle), ('prop_word_tv', tv),
            ('prop_word_cup', cup), ('prop_word_jar', jar), ('prop_word_lamp', lamp), ('prop_word_basket', basket),
            ('prop_word_bin', bin_)]
for n, fn in BUILDERS:
    if want(n):
        fn()
