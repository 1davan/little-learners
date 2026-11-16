"""Monkey for the dress-up game: a chibi monkey plus a big wardrobe of clothes, each garment its own layer
(mesh) bound to the monkey's skeleton. Layers are named cloth_<slot>_<name>; slots: head, body, feet, legs, eyes,
neck, hands. In game they start hidden; u.wear(name, true) shows one, garmentProp('monkey', name) gives a prop copy.
Set ONLY=name1,name2 to build just some garments while iterating."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from lib import Creature
from mathutils import Vector


class Monkey(Creature):
    """Soft neck (as the bear): head weights ramp into the body's over the neck so a head turn bends softly.
    Garments are carved hollow: each garment solid minus the monkey's body, so the free-standing prop is a real
    shell (a hat has a head-shaped hollow, a shirt is open at the neck, arms and hem) and nothing hidden pokes out."""
    neck = (1.08, 1.36)

    def _garment_skin(self):
        """lib's _skin for a garment, with a gentler smooth: the body's strong volume-preserving Laplacian smooth
        bloats thin parts (rings, frills, brims) into fat tubes."""
        import bpy
        objs = self._metaballs()
        bpy.context.view_layer.update()
        meshes = []
        for ob in objs:
            dg = bpy.context.evaluated_depsgraph_get()
            mo = bpy.data.objects.new(ob.name + '_mesh', bpy.data.meshes.new_from_object(ob.evaluated_get(dg)))
            bpy.context.scene.collection.objects.link(mo)
            meshes.append(mo)
        for ob in objs:
            bpy.data.objects.remove(ob)
        L = self.layers[self._cur]
        for lo, hi, gs in L.get('cuts', []):
            # crisp hems / waistbands: subtract a game-space box from the chosen groups before they are fused
            box = None
            for m in meshes:
                if gs is not None and m.name[:-5] not in gs:
                    continue
                if box is None:
                    import bmesh
                    bm = bmesh.new()
                    bmesh.ops.create_cube(bm, size=1.0)
                    me = bpy.data.meshes.new('cutbox')
                    bm.to_mesh(me)
                    bm.free()
                    box = bpy.data.objects.new('cutbox', me)
                    bpy.context.scene.collection.objects.link(box)
                    ctr = [(lo[i] + hi[i]) / 2 for i in range(3)]
                    box.location = (ctr[0], -ctr[2], ctr[1])
                    box.scale = (hi[0] - lo[0], hi[2] - lo[2], hi[1] - lo[1])
                    bpy.context.view_layer.update()
                b = m.modifiers.new('cut', 'BOOLEAN')
                b.operation = 'DIFFERENCE'
                b.object = box
                b.solver = 'EXACT'
                bpy.context.view_layer.objects.active = m
                bpy.ops.object.modifier_apply(modifier='cut')
            if box is not None:
                bpy.data.objects.remove(box)
        meshes = [m for m in meshes if len(m.data.polygons)]
        for m in meshes:
            # big shells (the torso of a top, a skirt) get the body's strong smooth on their own, before the
            # small parts are fused on, so blob seams don't shade as lumps but bows and buttons stay crisp
            if m.name[:-5] in L.get('soft', ()):
                bpy.context.view_layer.objects.active = m
                sm = m.modifiers.new('soft', 'LAPLACIANSMOOTH')
                sm.iterations = 14
                sm.lambda_factor = 0.6
                sm.use_volume_preserve = True
                sm.use_normalized = True
                bpy.ops.object.modifier_apply(modifier='soft')
        bpy.ops.object.select_all(action='DESELECT')
        for m in meshes:
            m.select_set(True)
        bpy.context.view_layer.objects.active = meshes[0]
        if len(meshes) > 1:
            bpy.ops.object.join()
        skin = bpy.context.view_layer.objects.active
        skin.name = skin.data.name = self._cur
        skin.data.remesh_voxel_size = L.get('voxel') or self.voxel
        bpy.ops.object.voxel_remesh()
        n = len(skin.data.polygons)
        tf = L.get('target_faces') or 3000
        if n > tf:
            d = skin.modifiers.new('dec', 'DECIMATE')
            d.ratio = tf / n
            bpy.ops.object.modifier_apply(modifier='dec')
        sm = skin.modifiers.new('smooth', 'LAPLACIANSMOOTH')
        sm.iterations = 3
        sm.lambda_factor = 0.4
        sm.use_volume_preserve = False
        sm.use_normalized = True
        bpy.ops.object.modifier_apply(modifier='smooth')
        sm = skin.modifiers.new('smooth2', 'CORRECTIVE_SMOOTH')
        sm.iterations = 6
        sm.smooth_type = 'LENGTH_WEIGHTED'
        sm.use_only_smooth = True
        bpy.ops.object.modifier_apply(modifier='smooth2')
        bpy.ops.object.shade_smooth()
        return skin

    def _skin(self):
        import bpy
        m = super()._skin() if self._cur == 'skin' else self._garment_skin()
        if self._cur == 'skin':
            # a low-poly copy of the body to carve garments with (keeps the hollows cheap)
            px = bpy.data.objects.new('carver', m.data.copy())
            bpy.context.scene.collection.objects.link(px)
            d = px.modifiers.new('dec', 'DECIMATE')
            d.ratio = 2600 / max(1, len(m.data.polygons))
            bpy.context.view_layer.objects.active = px
            bpy.ops.object.modifier_apply(modifier='dec')
            px.hide_set(True)
            px.hide_render = True
            self._carver = px
            bpy.context.view_layer.objects.active = m
            return m
        b = m.modifiers.new('carve', 'BOOLEAN')
        b.operation = 'DIFFERENCE'
        b.object = self._carver
        b.solver = 'EXACT'
        bpy.context.view_layer.objects.active = m
        bpy.ops.object.modifier_apply(modifier='carve')
        return m

    def _weights(self, skin, ao, smooth_iters=None):
        super()._weights(skin, ao, smooth_iters)
        vg = skin.vertex_groups
        hi, bi = vg['head'].index, vg['body'].index
        y0, y1 = self.neck
        for v in skin.data.vertices:
            t = min(1.0, max(0.0, (v.co.z - y0) / (y1 - y0)))
            k = t * t * (3 - 2 * t)
            wh = next((g.weight for g in v.groups if g.group == hi), 0.0)
            if wh <= 0 or k >= 1:
                continue
            wb = next((g.weight for g in v.groups if g.group == bi), 0.0)
            vg['head'].add([v.index], wh * k, 'REPLACE')
            vg['body'].add([v.index], wb + wh * (1 - k), 'REPLACE')


FUR = 0xa86a40       # warm cocoa brown
FUR_D = 0x8c5434     # tail tip / darker fur
PEACH = 0xffd3ad     # face mask, muzzle, belly, hands, feet
INNER = 0xffb393     # inner ears
NOSE = 0x7a4532

ONLY = set(filter(None, os.environ.get('ONLY', '').split(',')))
c = Monkey('monkey', base=FUR, target_faces=8000)

# ---------------- body: small soft pear, lifted so short legs show under it ----------------
HY = 1.82                     # head centre
HX, HR, HZ = 0.7, 0.62, 0.6   # head half-extents
BODY = [((0, 0.76, 0.0), (0.44, 0.45, 0.4)),      # torso
        ((0, 0.57, 0.02), (0.47, 0.25, 0.42))]    # tum (the pear's bottom; crotch at y ~ 0.32)
for pos, size in BODY:
    c.blob(pos, size)
c.blob((0, 1.15, 0), (0.3, 0.18, 0.28))      # neck blend
c.mirror(lambda s: c.blob((s * 0.27, 1.03, 0.0), (0.2, 0.13, 0.22)))   # shoulder ramp: the arm root melts in softly
# ---------------- head: big and round, chubby cheeks, a muzzle that stands proud in profile ----------------
c.blob((0, HY, 0), (HX, HR, HZ))
c.mirror(lambda s: c.blob((s * 0.3, HY - 0.2, 0.24), (0.26, 0.2, 0.22)))
c.blob((0, HY - 0.22, 0.33), (0.34, 0.21, 0.28))          # muzzle


# ---------------- ears: round cups on the sides ----------------
def ear(s):
    g = 'ear' + ('L' if s < 0 else 'R')
    c.blob((s * 0.76, HY + 0.02, -0.04), (0.11, 0.23, 0.22), rot=(0, -s * 30, 0), group=g)
    c.blob((s * 0.8, HY + 0.02, 0.04), (0.06, 0.15, 0.14), rot=(0, -s * 30, 0), group=g, negative=True)
    c.blob((s * 0.64, HY, -0.04), (0.12, 0.13, 0.11), group=g)
c.mirror(ear)

# ---------------- arms: long-ish monkey arms, A-pose with a gap to the torso ----------------
SH = lambda s: (s * 0.38, 1.02, 0.02)    # shoulder
WR = lambda s: (s * 0.76, 0.64, 0.1)     # wrist (arms a little out: an A-pose reads well and shirts look like shirts)
HAND = lambda s: (s * 0.83, 0.56, 0.13)
def arm(s):
    g = 'arm' + ('L' if s < 0 else 'R')
    c.blob(SH(s), (0.13, 0.13, 0.13), group=g)                     # shoulder ball: pivots inside the ramp
    c.capsule(SH(s), WR(s), 0.115, r2=0.1, group=g)
    h = 'hand' + ('L' if s < 0 else 'R')
    c.blob(HAND(s), (0.13, 0.14, 0.115), group=h)
    c.blob((s * 0.77, 0.59, 0.22), (0.05, 0.06, 0.05), group=h)   # thumb nub
c.mirror(arm)
# ---------------- legs + feet: short stubby legs that show below the tum ----------------
FOOT = lambda s: (s * 0.26, 0.09, 0.17)
LEG = lambda s: ((s * 0.21, 0.44, 0.03), (s * 0.25, 0.17, 0.08))
def leg(s):
    g = 'leg' + ('L' if s < 0 else 'R')
    c.capsule(*LEG(s), 0.135, r2=0.13, group=g)
    c.blob(FOOT(s), (0.16, 0.1, 0.24), rot=(0, s * 8, 0), group='foot' + ('L' if s < 0 else 'R'))
c.mirror(leg)
# ---------------- tail: long and curly, sweeping out to the right so it shows from the front ----------------
# the curl is turned 20 degrees about the root so in profile it reads as a loop, not two sticks
_T0 = [(0.08, 0.36, -0.36), (0.38, 0.3, -0.58), (0.74, 0.42, -0.56), (0.96, 0.76, -0.42), (0.94, 1.1, -0.32),
       (0.72, 1.2, -0.28), (0.6, 1.02, -0.28), (0.72, 0.92, -0.3)]
def _turn(p, deg=20, o=(0.08, 0.36, -0.36)):
    a = math.radians(deg); dx, dz = p[0] - o[0], p[2] - o[2]
    return (o[0] + dx * math.cos(a) + dz * math.sin(a), p[1] + 0.06, o[2] - dx * math.sin(a) + dz * math.cos(a))
TAIL = [_turn(p) for p in _T0]
c.curve(TAIL, [0.085, 0.08, 0.075, 0.072, 0.07, 0.066, 0.062, 0.06], group='tail', per=5)

# ---------------- paint ----------------
# face mask: two eye lobes + a bridge + the muzzle make one clean peach heart (no cheek paint at the jaw)
c.mirror(lambda s: c.decal('eye_lobe', (s * 0.2, HY + 0.07), (0.235, 0.25, 0.3), PEACH))
c.decal('bridge', (0, HY - 0.05), (0.3, 0.2, 0.3), PEACH)
c.decal('muzzle', (0, HY - 0.2), (0.38, 0.25, 0.34), PEACH)
c.mirror(lambda s: c.paint('inner_ear', (s * 0.8, HY + 0.02, 0.03), (0.08, 0.17, 0.16), INNER, rot=(0, -s * 30, 0)))
c.decal('belly', (0, 0.66), (0.29, 0.34, 0.3), PEACH)
c.paint_group(['handL', 'handR', 'footL', 'footR'], PEACH)


# =====================================================================================================
# helpers for garments
# =====================================================================================================
def head_rxz(y, out=0.0):
    t = max(0.0, 1 - ((y - HY) / HR) ** 2) ** 0.5
    return HX * t + out, HZ * t + out


def ring(cx, cy, cz, rx, rz, r, group, n=30, tilt=0.0, yscale=1.0, zs=1.0, phase=0.0, skip=None):
    """A band of blobs around an ellipse (front of the ellipse = +z). tilt raises the front and lowers the back."""
    for i in range(n):
        th = 2 * math.pi * i / n + phase
        if skip and skip(th):
            continue
        y = cy + tilt * math.cos(th)
        c.blob((cx + math.sin(th) * rx, y, cz + math.cos(th) * rz), (r * 1.35, r * yscale, r * zs), rot=(0, math.degrees(th), 0), group=group)


def head_ring(y, out, r, group, tilt=0.0, n=30, yscale=1.0, zoff=0.0):
    """A band hugging the head at height y (front higher by tilt)."""
    for i in range(n):
        th = 2 * math.pi * i / n
        yy = y + tilt * math.cos(th)
        rx, rz = head_rxz(yy, out)
        c.blob((math.sin(th) * rx, yy, math.cos(th) * rz + zoff), (r * 1.35, r * yscale, r), rot=(0, math.degrees(th), 0), group=group)


def align_y(d):
    q = Vector((0, 1, 0)).rotation_difference(Vector(d).normalized())
    return tuple(math.degrees(a) for a in q.to_euler('XYZ'))


def lerp(a, b, t):
    return tuple(a[i] + (b[i] - a[i]) * t for i in range(3))


def cuff(center, d, rad, thick, group):
    """A short fat disc around an axis d (a sleeve or boot cuff)."""
    c.blob(center, (rad, thick, rad), rot=align_y(d), group=group)


def stripes_y(step, colour, off=0.0, only=None):
    c.paint_fn(lambda p, n: (int(math.floor((p.y + off) / step)) % 2 == 0) and (only is None or only(p)), colour)


def dots(pts, r, colour):
    for p in pts:
        c.paint('dot', p, (r, r, r), colour)


def heart(cx, cy, size, colour, front=True):
    def fn(p, n):
        if (n.z < 0.2) if front else (n.z > -0.2):
            return False
        x = (p.x - cx) / size
        y = (p.y - cy) / size + 0.15
        return (x * x + y * y - 1) ** 3 - x * x * y ** 3 <= 0
    c.paint_fn(fn, colour)


def star_fn(cx, cy, R, colour, back=False, r_in=0.45):
    def fn(p, n):
        if back and (n.z > -0.25 or p.z > -0.2):
            return False
        if not back and n.z < 0.25:
            return False
        x, y = (-(p.x - cx) if back else (p.x - cx)), p.y - cy
        a = math.atan2(x, y)
        d = math.hypot(x, y)
        k = (a % (2 * math.pi / 5)) / (2 * math.pi / 5)
        rr = R * (r_in + (1 - r_in) * abs(1 - 2 * k) ** 1.4)
        return d < rr
    c.paint_fn(fn, colour)


def paint_blobs(groups, colour, k=1.2, only=None):
    """colour the skin within k x the blobs of these groups (call after adding them): crisp parts like buttons,
    bows and bands. (lib's paint_group picks the nearest group in a size-normalised distance, which lets tiny
    blobs claim big areas of the garment around them.)"""
    from mathutils import Euler
    gs = [groups] if isinstance(groups, str) else list(groups)
    els = []
    for g in gs:
        for e in c.groups.get(g, []):
            if not e['negative']:
                R = Euler([math.radians(a) for a in e['rot']]).to_matrix().transposed()
                els.append((Vector(e['pos']), R, Vector(e['size']) * k))
    def fn(p, n):
        if only is not None and not only(p):
            return False
        for o, R, sz in els:
            l = R @ (p - o)
            if (l.x / sz.x) ** 2 + (l.y / sz.y) ** 2 + (l.z / sz.z) ** 2 <= 1:
                return True
        return False
    c.paint_fn(fn, colour)


GARMENTS = []


def garment(slot, name, base, faces=1800):
    def deco(fn):
        GARMENTS.append((slot, name, base, faces, fn))
        return fn
    return deco


# body shell: torso blobs (+ out) — tops are built from these
def torso(out, y_lo=0.0, group='top'):
    (p0, s0), (p1, s1) = BODY
    c.blob(p0, (s0[0] + out, s0[1] + out * 0.4, s0[2] + out), group=group)
    c.blob((0, 1.05, -0.01), (0.4 + out, 0.2, 0.34 + out), group=group)           # shoulders
    c.mirror(lambda s: c.blob((s * 0.27, 1.03, 0.0), (0.2 + out, 0.13 + out, 0.22 + out), group=group))
    if y_lo < 0.62:
        c.blob(p1, (s1[0] + out, s1[1], s1[2] + out), group=group)


def body_ext(y):
    """torso half-widths (x, z) of the skin at height y"""
    bx = bz = 0.0
    for (p, sz) in BODY:
        t = max(0.0, 1 - ((y - p[1]) / sz[1]) ** 2) ** 0.5
        bx, bz = max(bx, sz[0] * t), max(bz, sz[2] * t)
    return bx, bz


def collar(r=0.055, colour_group='collar', ry=1.15, rx=0.31, rz=0.29, tilt=-0.03):
    ring(0, ry, 0.0, rx, rz, r, colour_group, n=24, tilt=tilt)


def sleeve(s, t_end, r0=0.165, r1=0.155, group=None, cuff_r=None):
    """a sleeve from the shoulder down the arm to t_end (0 shoulder .. 1 wrist), ending in a rolled cuff"""
    g = group or ('arm' + ('L' if s < 0 else 'R'))
    a = (s * 0.33, 1.04, 0.01)
    e = lerp(SH(s), WR(s), max(0.08, t_end - 0.12))
    c.capsule(a, e, r0, r2=r1, group=g)
    if cuff_r:
        d = tuple(WR(s)[i] - SH(s)[i] for i in range(3))
        cuff(lerp(SH(s), WR(s), t_end - 0.03), d, cuff_r, 0.055, 'cuff' + g)


def cut(lo, hi, groups=None):
    """subtract a game-space box from this garment (only from these blob groups, if given): crisp hems"""
    c.layers[c._cur].setdefault('cuts', []).append((lo, hi, groups))


def smooth(groups=('top', 'skirt', 'pants', 'shorts', 'bib')):
    c.layers[c._cur]['soft'] = tuple(groups)


def cut_below(y, groups=None):
    cut((-3, -1, -3), (3, y, 3), groups)


def cut_above(y, groups=None):
    cut((-3, y, -3), (3, 4, 3), groups)


def front_z(y, out=0.0):
    return body_ext(y)[1] + 0.02 + out


def hem(y, out, r, group='hem', n=30):
    rx, rz = body_ext(y)
    ring(0, y, 0.02, rx + out, rz + out, r, group, n=n)


# =====================================================================================================
# LEVEL 1 — HATS (slot head)
# =====================================================================================================
@garment('head', 'party', 0xff6fa8, 1600)
def party():
    tip = Vector((0.1, 3.08, -0.02)); base = Vector((0, 2.26, -0.02))
    n = 18
    for i in range(n):
        t = i / (n - 1)
        p = base.lerp(tip, t)
        r = 0.37 * (1 - t) + 0.03 * t
        c.blob(tuple(p), (r, r * 0.8, r), group='cone', stiffness=3.5)
    ring(0.01, 2.36, -0.02, 0.36, 0.34, 0.075, 'trim', n=14, yscale=0.9)
    c.blob((tip.x + 0.01, tip.y + 0.06, tip.z), (0.11, 0.11, 0.11), group='pom')
    c.blob((tip.x + 0.06, tip.y + 0.1, tip.z + 0.03), (0.08, 0.08, 0.08), group='pom')
    def dots(p, nn):
        t = (p.y - base.y) / (tip.y - base.y)
        if t < 0.18 or t > 0.9:
            return 0
        ax = base.lerp(tip, t)
        a = math.atan2(p.x - ax.x, p.z - ax.z) / (2 * math.pi)
        row = int(t * 6)
        fu = (a * 7 + row * 0.5) % 1
        fv = (t * 6) % 1
        if abs(fu - 0.5) < 0.16 and abs(fv - 0.5) < 0.24:
            return 1 + row % 2
        return 0
    c.paint_fn(lambda p, n: dots(p, n) == 1, 0xffd23f)
    c.paint_fn(lambda p, n: dots(p, n) == 2, 0x5ab4ff)
    c.paint_fn(lambda p, n: p.y < 2.47 and p.y > 2.2 and math.hypot(p.x, p.z + 0.02) > 0.3, 0xfff8f0)
    c.paint_fn(lambda p, n: p.y > tip.y - 0.03, 0xffd23f)


@garment('head', 'crown', 0xffc531, 1800)
def crown():
    Y = 2.2
    rx, rz = head_rxz(Y, 0.075)
    head_ring(Y, 0.075, 0.08, 'band', tilt=0.05, yscale=1.7, n=30)
    for k in range(5):
        th = 2 * math.pi * k / 5
        y = Y + 0.05 * math.cos(th)
        out = Vector((math.sin(th), 0, math.cos(th)))
        b = Vector((math.sin(th) * rx, y + 0.1, math.cos(th) * rz))
        tp = b + Vector((0, 0.27, 0)) - out * 0.035
        c.capsule(tuple(b), tuple(tp), 0.105, r2=0.045, group='spike', steps=7)
        c.blob(tuple(tp + Vector((0, 0.06, 0))), (0.065, 0.065, 0.065), group='pearl%d' % k)
    for k, th in enumerate([0, -0.62, 0.62, math.pi]):
        y = Y + 0.05 * math.cos(th)
        c.blob((math.sin(th) * (rx + 0.075), y, math.cos(th) * (rz + 0.075)), (0.075, 0.075, 0.045), rot=(0, math.degrees(th), 0), group='jewel%d' % k)
        paint_blobs('jewel%d' % k, [0xff4b6e, 0x4aa3ff, 0x52d273, 0xff4b6e][k])
    paint_blobs(['pearl%d' % k for k in range(5)], 0xfff6e8)
    c.paint_fn(lambda p, n: abs(p.y - (Y + 0.05 * (p.z / max(0.3, math.hypot(p.x, p.z))) - 0.1)) < 0.022 and math.hypot(p.x, p.z) > rx - 0.02, 0xffe28a)


@garment('head', 'cap', 0xff4b4b, 1500)
def cap():
    c.blob((0, 2.06, -0.07), (0.67, 0.47, 0.61), group='dome')
    head_ring(2.0, 0.05, 0.05, 'dome', tilt=0.15, n=28)
    rx, rz = head_rxz(2.15, 0.05)
    c.blob((0, 2.12, rz + 0.18), (0.36, 0.04, 0.3), rot=(-14, 0, 0), group='brim')
    c.blob((0, 2.54, -0.08), (0.06, 0.04, 0.06), group='button')
    c.paint_fn(lambda p, n: p.z > rz - 0.05 and p.y < 2.2 and p.y > 2.0 and abs(p.x) < 0.42, 0x3f7bff)   # brim
    c.paint('button', (0, 2.55, -0.08), (0.09, 0.07, 0.09), 0x3f7bff)
    star_fn(0, 2.32, 0.15, 0xffffff)


@garment('head', 'sunhat', 0xffd97a, 2000)
def sunhat():
    c.blob((0, 2.3, -0.05), (0.6, 0.36, 0.54), group='crown')
    c.blob((0, 2.2, 0.0), (1.1, 0.055, 1.0), rot=(-8, 0, 0), group='brim')
    smooth(('brim', 'crown'))
    ring(0, 2.3, -0.05, 0.6, 0.54, 0.07, 'ribbon', n=26, tilt=0.03, yscale=1.25)
    # ribbon bow at the back
    c.mirror(lambda s: c.blob((s * 0.12, 2.32, -0.62), (0.12, 0.08, 0.05), rot=(0, 0, s * 15), group='ribbon'))
    c.mirror(lambda s: c.capsule((s * 0.05, 2.26, -0.62), (s * 0.14, 2.05, -0.72), 0.04, group='ribbon'))
    # a big daisy on the front side
    out = Vector((0.71, 0.0, 0.71)).normalized()
    fx, fy, fz = out.x * 0.6, 2.38, out.z * 0.52 - 0.05
    side = Vector((out.z, 0, -out.x))
    for k in range(7):
        a = 2 * math.pi * k / 7
        pp = Vector((fx, fy, fz)) + side * (math.cos(a) * 0.1) + Vector((0, math.sin(a) * 0.1, 0))
        c.blob(tuple(pp), (0.075, 0.06, 0.035), rot=(0, 0, math.degrees(a)), group='petal')
    c.blob(tuple(Vector((fx, fy, fz)) + out * 0.03), (0.055, 0.055, 0.04), group='fcentre')
    paint_blobs('ribbon', 0xff6fa8)
    paint_blobs('petal', 0xffffff)
    paint_blobs('fcentre', 0xffb020)
    # woven straw: soft rings on the brim
    c.paint_fn(lambda p, n: p.y < 2.27 and abs(math.hypot(p.x / 1.1, p.z / 1.0) - 0.86) < 0.025, 0xf0c25a)   # one stitched ring


@garment('head', 'beanie', 0x4a90ff, 1600)
def beanie():
    c.blob((0, 2.08, -0.06), (0.7, 0.5, 0.63), group='knit')
    head_ring(2.02, 0.06, 0.075, 'cuff', tilt=0.14, n=30, yscale=1.4)
    c.blob((0, 2.64, -0.06), (0.15, 0.14, 0.15), group='pom')
    c.blob((0.05, 2.7, -0.03), (0.1, 0.1, 0.1), group='pom')
    c.blob((-0.06, 2.68, -0.1), (0.1, 0.1, 0.1), group='pom')
    stripes_y(0.13, 0xfff6e8, off=0.02, only=lambda p: p.y > 2.24 and p.y < 2.5)
    c.paint_fn(lambda p, n: p.y < 2.02 + 0.14 * max(-1, min(1, p.z / 0.55)) + 0.1, 0x2f6fd8)   # darker cuff
    c.paint('pom', (0, 2.67, -0.06), (0.2, 0.18, 0.2), 0xfff6e8)


@garment('head', 'pirate', 0x3d3158, 2000)
def pirate():
    c.blob((0, 2.28, -0.06), (0.62, 0.34, 0.56), group='hat')            # crown of the hat
    # the big upturned brim: a front wall that rises to a peak in the middle, and a lower one behind
    def wall(th0, th1, top, h, rx, rz, zc, g, n=22):
        for i in range(n):
            th = th0 + (th1 - th0) * i / (n - 1)
            k = math.cos((th - (th0 + th1) / 2) / (th1 - th0) * math.pi)
            yc = 2.1 + (h + top * k) / 2
            c.blob((math.sin(th) * rx, yc, zc + math.cos(th) * rz), (0.13, (h + top * k) / 2 + 0.02, 0.055),
                   rot=(-12 * math.cos(th), math.degrees(th), 0), group=g)
    wall(-1.45, 1.45, 0.2, 0.36, 0.76, 0.68, -0.06, 'brim')
    wall(math.pi - 1.2, math.pi + 1.2, 0.12, 0.3, 0.74, 0.66, -0.06, 'brimB', n=16)
    def top_of(p):
        th = math.atan2(p.x, p.z + 0.06)
        if abs(th) <= 1.45:
            k = math.cos(th / 2.9 * math.pi)
            return 2.1 + 0.36 + 0.2 * k + 0.02
        d = (th % (2 * math.pi)) - math.pi
        k = math.cos(d / 2.4 * math.pi) if abs(d) < 1.2 else 0
        return 2.1 + 0.3 + 0.12 * k + 0.02
    c.paint_fn(lambda p, n: math.hypot(p.x, p.z + 0.06) > 0.6 and p.y > top_of(p) - 0.075, 0xffc531)   # gold trim
    # skull and crossbones sticker, raised on the front
    SZ = 0.69
    c.blob((0, 2.48, SZ), (0.125, 0.11, 0.04), group='skull')
    c.blob((0, 2.385, SZ - 0.005), (0.075, 0.05, 0.035), group='skull')
    for s in (-1, 1):
        a, b = (s * -0.14, 2.27, SZ - 0.035), (s * 0.14, 2.37, SZ - 0.025)
        c.capsule(a, b, 0.026, group='bones')
        for e in (a, b):
            c.mirror(lambda k, e=e: c.blob((e[0], e[1] + k * 0.025, e[2]), (0.032, 0.032, 0.028), group='bones'))
    paint_blobs(['skull', 'bones'], 0xfff6e8)
    c.mirror(lambda s: c.paint('eye', (s * 0.05, 2.49, SZ + 0.04), (0.036, 0.042, 0.06), 0x2a2238))
    c.paint('nose', (0, 2.43, SZ + 0.04), (0.017, 0.02, 0.06), 0x2a2238)


@garment('head', 'flowers', 0x52c45a, 1800)
def flowers():
    Y = 2.18
    head_ring(Y, 0.03, 0.05, 'vine', tilt=0.06, n=28)
    cols = [0xff6fa8, 0xffd23f, 0xffffff, 0xa77bff, 0xff8a4a, 0x5ab4ff, 0xff6fa8, 0xffd23f]
    rx, rz = head_rxz(Y, 0.08)
    for k in range(8):
        th = 2 * math.pi * k / 8 + 0.2
        y = Y + 0.06 * math.cos(th) + 0.02
        cx, cz = math.sin(th) * rx, math.cos(th) * rz
        out = Vector((math.sin(th), 0, math.cos(th)))
        side = Vector((math.cos(th), 0, -math.sin(th)))
        g = 'fl%d' % k
        for j in range(5):
            a = 2 * math.pi * j / 5
            p = Vector((cx, y, cz)) + side * (math.cos(a) * 0.09) + Vector((0, math.sin(a) * 0.09, 0))
            c.blob(tuple(p), (0.08, 0.08, 0.045), rot=(0, math.degrees(th), 0), group=g)
        c.blob(tuple(Vector((cx, y, cz)) + out * 0.04), (0.045, 0.045, 0.035), group='fc')
        c.paint('petals', (cx, y, cz), (0.17, 0.17, 0.12), cols[k])
        c.paint('centre', tuple(Vector((cx, y, cz)) + out * 0.06), (0.05, 0.05, 0.05), 0xffc531 if cols[k] != 0xffd23f else 0xff8a4a)
    for k in range(8):   # little leaves between flowers
        th = 2 * math.pi * (k + 0.5) / 8 + 0.2
        y = Y + 0.06 * math.cos(th)
        rx2, rz2 = head_rxz(y, 0.06)
        c.blob((math.sin(th) * rx2, y + 0.02, math.cos(th) * rz2), (0.08, 0.035, 0.03), rot=(0, math.degrees(th), 25), group='leaf')


@garment('head', 'bunny', 0xff8fc0, 1800)
def bunny():
    # headband over the top, from ear to ear
    n = 22
    for i in range(n):
        phi = -1.3 + 2.6 * i / (n - 1)
        x = math.sin(phi) * (HX + 0.04)
        y = HY + math.cos(phi) * (HR + 0.04)
        c.blob((x, y, 0.06), (0.06, 0.06, 0.09), rot=(0, 0, -math.degrees(phi)), group='band')
    for s in (-1, 1):
        g = 'bun' + ('L' if s < 0 else 'R')
        pts = [(s * 0.2, 2.4, 0.06), (s * 0.3, 2.82, 0.05), (s * 0.38, 3.18, 0.02), (s * 0.4, 3.32, 0.0)]
        c.curve(pts, [0.08, 0.135, 0.11, 0.05], group=g, flat=0.4, per=5)
        c.paint_fn(lambda p, n, s=s: p.x * s > 0.12 and p.y > 2.55 and p.y < 3.22 and n.z > 0.25 and abs(p.x - s * (0.2 + (p.y - 2.4) * 0.22)) < 0.075, 0xffd0e2)
    c.paint_fn(lambda p, n: p.y > 2.5 and not (n.z > 0.25 and abs(abs(p.x) - (0.2 + (p.y - 2.4) * 0.22)) < 0.075 and p.y < 3.22), 0xfffaf6)


@garment('head', 'chef', 0xfffdf8, 1600)
def chef():
    head_ring(2.2, 0.04, 0.08, 'band', tilt=0.05, n=28, yscale=1.9)
    c.blob((0, 2.42, -0.04), (0.48, 0.2, 0.44), group='band')
    c.blob((0, 2.68, -0.04), (0.46, 0.24, 0.42), group='puff')
    for k in range(6):
        a = 2 * math.pi * k / 6 + 0.3
        c.blob((math.sin(a) * 0.3, 2.66 + 0.04 * (k % 2), -0.04 + math.cos(a) * 0.28), (0.24, 0.22, 0.24), group='puff')
    c.paint_fn(lambda p, n: p.y < 2.36 and abs((math.atan2(p.x, p.z) * 6 / math.pi) % 1 - 0.5) < 0.06, 0xe8e2f0)


# =====================================================================================================
# LEVEL 2 — TOPS (slot body)
# =====================================================================================================
@garment('body', 'tshirt', 0xff5a5a, 4400)
def tshirt():
    smooth()
    torso(0.05)
    hem(0.47, 0.045, 0.048)
    cut_below(0.425, ['top'])
    collar(0.05)
    c.mirror(lambda s: sleeve(s, 0.48, 0.17, 0.16, cuff_r=0.175))
    stripes_y(0.12, 0xfff6e8, off=0.03)
    paint_blobs(['collar', 'hem', 'cuffarmL', 'cuffarmR'], 0xfff6e8)


@garment('body', 'raincoat', 0xffd23f, 4400)
def raincoat():
    smooth()
    torso(0.065)
    c.blob((0, 0.47, 0.02), (0.57, 0.2, 0.51), group='top')       # the coat flares out over the tum
    ring(0, 0.31, 0.02, 0.57, 0.51, 0.05, 'hem', n=32)
    cut_below(0.27, ['top'])
    collar(0.07)
    c.mirror(lambda s: c.blob((s * 0.15, 1.12, 0.33), (0.13, 0.04, 0.1), rot=(-35, s * -20, s * -20), group='collarpt'))
    c.blob((0, 1.3, -0.34), (0.38, 0.26, 0.19), group='hood')
    for k in range(9):      # the hood's rim round the back of the neck
        th = math.pi * (0.45 + 1.1 * k / 8)
        c.blob((math.sin(th) * 0.41, 1.2 + 0.12 * (1 - abs(math.cos(th))), math.cos(th) * 0.31 - 0.06), (0.1, 0.12, 0.1), group='hood')
    c.mirror(lambda s: sleeve(s, 0.9, 0.175, 0.16, cuff_r=0.175))
    for k, y in enumerate((0.98, 0.79, 0.6, 0.42)):
        z = max(front_z(y, 0.065), 0.53 if y < 0.6 else 0) + 0.015
        c.blob((0.0, y, z + 0.01), (0.1, 0.04, 0.035), group="tog")
    paint_blobs(['tog'], 0x3f5fd8)
    paint_blobs(['hem', 'cuffarmL', 'cuffarmR', 'collar', 'collarpt'], 0xf2b81f)
    c.paint_fn(lambda p, n: n.z < -0.2 and p.y > 1.12 and p.z < -0.3, 0xf2b81f)    # hood lining


@garment('body', 'dress', 0xff8fc0, 6400)
def dress():
    smooth()
    torso(0.045, y_lo=0.7)
    cut_below(0.6, ['top'])
    # a bell skirt: stacked discs flaring out from the waist
    def skirt_r(t):
        return 0.5 + 0.24 * t ** 1.3, 0.46 + 0.2 * t ** 1.3
    n = 10
    for k in range(n):
        t = k / (n - 1)
        rx, rz = skirt_r(t)
        c.blob((0, 0.68 - 0.4 * t, 0.02), (rx, 0.07, rz), group='skirt')
    ring(0, 0.26, 0.02, 0.74, 0.66, 0.065, 'frill', n=26)
    collar(0.045)
    c.mirror(lambda s: c.blob(lerp(SH(s), WR(s), 0.18), (0.21, 0.19, 0.2), group='arm' + ('L' if s < 0 else 'R')))
    c.mirror(lambda s: cuff(lerp(SH(s), WR(s), 0.36), tuple(WR(s)[i] - SH(s)[i] for i in range(3)), 0.145, 0.04, 'cuffarm' + ('L' if s < 0 else 'R')))
    rx0, rz0 = body_ext(0.64)
    ring(0, 0.645, 0.02, rx0 + 0.07, rz0 + 0.07, 0.045, 'sash', n=28, yscale=1.2)
    zb = rz0 + 0.16
    c.blob((0, 0.645, zb + 0.015), (0.06, 0.06, 0.045), group='bow')
    c.mirror(lambda s: c.blob((s * 0.13, 0.665, zb - 0.01), (0.12, 0.085, 0.045), rot=(0, s * -12, s * 20), group='bow'))
    c.mirror(lambda s: c.capsule((s * 0.03, 0.61, zb), (s * 0.09, 0.49, zb + 0.04), 0.035, group='bow'))
    # polka dots on the skirt (placed by angle and height, so they always land on the cloth)
    def dot(p, n):
        if not 0.3 < p.y < 0.6 or math.hypot(p.x, p.z - 0.02) < 0.45:
            return False
        row = round((p.y - 0.33) / 0.1)
        if row < 0 or row > 2 or abs(p.y - (0.33 + 0.1 * row)) > 0.045:
            return False
        a = math.atan2(p.x, p.z - 0.02) / (2 * math.pi) * 10 - 0.5 * (row % 2)
        da = (a - round(a)) * 2 * math.pi / 10 * math.hypot(p.x, p.z - 0.02)
        return da * da + (p.y - (0.33 + 0.1 * row)) ** 2 < 0.05 ** 2
    c.paint_fn(dot, 0xffffff)
    paint_blobs(['frill', 'collar', 'cuffarmL', 'cuffarmR'], 0xfff4f8)
    paint_blobs(['sash', 'bow'], 0xffd23f)


@garment('body', 'jumper', 0xa77bff, 4400)
def jumper():
    smooth()
    torso(0.06)
    hem(0.46, 0.05, 0.065)
    cut_below(0.405, ['top'])
    collar(0.065)
    c.mirror(lambda s: sleeve(s, 0.88, 0.175, 0.16, cuff_r=0.165))
    heart(0, 0.8, 0.16, 0xff6fa8)
    paint_blobs(['hem', 'collar', 'cuffarmL', 'cuffarmR'], 0xc9adff)
    # rib knit lines on the bands
    paint_blobs(['hem', 'collar'], 0xb795ff, only=lambda p: abs((math.atan2(p.x, p.z) * 12 / math.pi) % 1 - 0.5) < 0.13)


@garment('body', 'cape', 0xff3d4a, 2200)
def cape():
    key = [(1.12, -0.3, 0.4), (0.98, -0.44, 0.46), (0.8, -0.52, 0.52), (0.6, -0.56, 0.58), (0.4, -0.6, 0.64), (0.2, -0.63, 0.68)]
    rows = []
    for i in range(len(key) - 1):
        for k in range(3):
            rows.append(lerp(key[i], key[i + 1], k / 3))
    rows.append(key[-1])
    for i, (y, z, w) in enumerate(rows):
        y2, z2 = (rows[i + 1][0], rows[i + 1][1]) if i + 1 < len(rows) else (y - 0.1, z - 0.02)
        a = math.degrees(math.atan2(z2 - z, y2 - y))
        c.blob((0, y, z), (w, 0.1, 0.07), rot=(-a, 0, 0), group='cape')
    for k in range(7):   # soft scalloped hem
        c.blob(((k - 3) * 0.2, 0.14, -0.64), (0.11, 0.08, 0.07), group='cape')
    c.mirror(lambda s: c.blob((s * 0.34, 1.1, -0.08), (0.16, 0.1, 0.26), group='cape'))
    # a gold tie round the shoulders with a star clasp on the chest (so the cape reads from the front too)
    ring(0, 1.09, 0.0, 0.39, 0.37, 0.05, 'collar', n=26, tilt=-0.06)
    c.blob((0, 1.03, 0.4), (0.105, 0.105, 0.045), group='clasp')
    star_fn(0, 0.64, 0.28, 0xffd23f, back=True)
    paint_blobs(['collar'], 0xffc531)
    paint_blobs(['clasp'], 0xffd23f)
    star_fn(0, 1.03, 0.08, 0xff3d4a)


@garment('body', 'dungarees', 0x4a90ff, 4400)
def dungarees():
    smooth()
    c.blob((0, 0.51, 0.02), (0.53, 0.24, 0.48), group='pants')
    c.blob((0, 0.66, 0.01), (0.5, 0.12, 0.45), group='pants')
    cut_above(0.73, ['pants'])
    rx, rz = body_ext(0.72)
    ring(0, 0.72, 0.015, rx + 0.06, rz + 0.06, 0.035, 'band', n=30)
    c.mirror(lambda s: c.capsule((s * 0.21, 0.44, 0.04), (s * 0.25, 0.27, 0.08), 0.19, group='leg' + ('L' if s < 0 else 'R')))
    c.mirror(lambda s: c.blob((s * 0.25, 0.27, 0.08), (0.205, 0.045, 0.205), group='leg' + ('L' if s < 0 else 'R')))
    cut_below(0.24, ['legL', 'legR'])
    # the bib, with a pocket
    zf = front_z(0.86)
    c.blob((0, 0.84, zf - 0.04), (0.31, 0.21, 0.1), group='bib')
    cut_above(1.0, ['bib'])
    c.blob((0, 0.82, zf + 0.07), (0.13, 0.085, 0.025), group='pocket')
    # straps over the shoulders, buttoned to the bib
    for s in (-1, 1):
        pts = [(s * 0.21, 0.96, zf + 0.05), (s * 0.24, 1.15, 0.3), (s * 0.27, 1.27, 0.02), (s * 0.25, 1.2, -0.28),
               (s * 0.21, 0.96, -0.46), (s * 0.19, 0.74, -0.5)]
        c.curve(pts, [0.05, 0.05, 0.05, 0.05, 0.05, 0.05], group='strap', per=4)
        c.blob((s * 0.21, 0.95, zf + 0.09), (0.055, 0.055, 0.03), group='btn')
    paint_blobs(['btn'], 0xffd23f)
    paint_blobs(['pocket'], 0x7db3ff)
    c.paint_fn(lambda p, n: p.y < 0.31, 0x7db3ff)    # rolled-up cuffs


@garment('body', 'pyjamas', 0x8fd0ff, 4400)
def pyjamas():
    smooth()
    torso(0.055)
    hem(0.46, 0.045, 0.06)
    cut_below(0.405, ['top'])
    collar(0.06)
    c.mirror(lambda s: sleeve(s, 0.88, 0.17, 0.155, cuff_r=0.16))
    for x, y in [(-0.27, 0.95), (0.25, 0.66), (-0.3, 0.6), (0.3, 1.0), (0.05, 0.5)]:
        star_fn(x, y, 0.08, 0xffe066)
    for (x, y) in [(-0.14, 0.76), (0.2, 0.86)]:
        c.paint_fn(lambda q, n, x=x, y=y: n.z > 0.3 and math.hypot(q.x - x, q.y - y) < 0.075 and math.hypot(q.x - x - 0.04, q.y - y - 0.025) > 0.065, 0xfff6e8)
    zf = lambda y: front_z(y, 0.055)
    for y in (0.98, 0.8, 0.62):
        c.blob((0.0, y, zf(y) + 0.005), (0.04, 0.04, 0.025), group='btn')
    paint_blobs(['btn'], 0xffffff)
    paint_blobs(['hem', 'collar', 'cuffarmL', 'cuffarmR'], 0x5ab4ff)


@garment('body', 'hoodie', 0x5fd068, 4400)
def hoodie():
    smooth()
    torso(0.06)
    hem(0.46, 0.05, 0.065)
    cut_below(0.405, ['top'])
    collar(0.075)
    c.blob((0, 1.3, -0.33), (0.4, 0.28, 0.2), group='hood')
    for k in range(9):      # the hood's rolled rim round the back of the neck
        th = math.pi * (0.45 + 1.1 * k / 8)
        c.blob((math.sin(th) * 0.4, 1.2 + 0.12 * (1 - abs(math.cos(th))), math.cos(th) * 0.3 - 0.06), (0.1, 0.12, 0.1), group='hood')
    c.mirror(lambda s: sleeve(s, 0.88, 0.175, 0.16, cuff_r=0.165))
    zp = front_z(0.6, 0.06)
    c.blob((0, 0.6, zp + 0.015), (0.27, 0.11, 0.045), group='pocket')
    c.mirror(lambda s: c.capsule((s * 0.08, 1.1, 0.37), (s * 0.13, 0.84, front_z(0.84, 0.06) + 0.02), 0.024, group='string'))
    c.mirror(lambda s: c.blob((s * 0.135, 0.81, front_z(0.81, 0.06) + 0.025), (0.034, 0.05, 0.034), group='tip'))
    paint_blobs(['pocket', 'hem', 'cuffarmL', 'cuffarmR', 'collar'], 0x45b450)
    paint_blobs(['string', 'tip'], 0xfff6e8, k=1.25)


# =====================================================================================================
# LEVEL 3 — FEET, LEGS, EYES, NECK, HANDS
# =====================================================================================================
@garment('feet', 'wellies', 0x52c45a, 2000)
def wellies():
    for s in (-1, 1):
        g = 'leg' + ('L' if s < 0 else 'R')
        fx, fy, fz = FOOT(s)
        c.blob((fx, fy + 0.02, fz + 0.01), (0.2, 0.135, 0.29), rot=(0, s * 8, 0), group=g)
        c.capsule((s * 0.25, 0.15, 0.1), (s * 0.24, 0.36, 0.07), 0.185, group=g)
        c.blob((s * 0.245, 0.34, 0.075), (0.215, 0.05, 0.215), group='top' + g)
        c.blob((fx, 0.03, fz + 0.01), (0.205, 0.035, 0.295), rot=(0, s * 8, 0), group='sole' + g)
        for e in (-1, 1):
            c.blob((fx + e * 0.08, 0.235, fz + 0.15), (0.06, 0.06, 0.055), group='eye' + g)
            c.paint('eye', (fx + e * 0.08, 0.245, fz + 0.2), (0.055, 0.055, 0.04), 0xffffff)
            c.paint('pupil', (fx + e * 0.08, 0.25, fz + 0.22), (0.028, 0.028, 0.03), 0x3a2838)
    cut_above(0.37)
    paint_blobs(['toplegL', 'toplegR', 'solelegL', 'solelegR'], 0x3a9a44)


@garment('feet', 'sneakers', 0xff5a5a, 2000)
def sneakers():
    for s in (-1, 1):
        g = 'leg' + ('L' if s < 0 else 'R')
        fx, fy, fz = FOOT(s)
        c.blob((fx, fy + 0.025, fz + 0.01), (0.19, 0.125, 0.28), rot=(0, s * 8, 0), group=g)
        c.capsule((s * 0.25, 0.14, 0.06), (s * 0.245, 0.22, 0.06), 0.165, group=g)
        c.blob((fx, 0.04, fz + 0.015), (0.205, 0.045, 0.295), rot=(0, s * 8, 0), group='sole' + g)
        c.blob((s * 0.245, 0.24, 0.06), (0.18, 0.04, 0.18), group='collar' + g)
        for k in range(3):
            c.blob((fx + s * 0.01 * k, 0.2 - k * 0.025, fz + 0.06 + k * 0.065), (0.085, 0.02, 0.022), group='lace' + g)
        c.paint('toe', (fx + s * 0.02, 0.07, fz + 0.27), (0.17, 0.11, 0.1), 0xffffff)
        c.paint('heel', (fx, 0.15, fz - 0.27), (0.12, 0.08, 0.06), 0xffd23f)   # heel tab
    cut_above(0.26)
    paint_blobs(['solelegL', 'solelegR', 'lacelegL', 'lacelegR', 'collarlegL', 'collarlegR'], 0xffffff)


@garment('legs', 'shorts', 0xff9f3f, 2200)
def shorts():
    c.blob((0, 0.53, 0.02), (0.55, 0.2, 0.49), group='shorts')
    c.blob((0, 0.64, 0.01), (0.51, 0.1, 0.46), group='shorts')
    c.blob((0, 0.37, 0.03), (0.17, 0.08, 0.3), group='shorts')     # covers the crotch, leaves a notch between the legs
    cut_above(0.68, ['shorts'])
    rx, rz = body_ext(0.67)
    ring(0, 0.67, 0.015, rx + 0.06, rz + 0.06, 0.045, 'band', n=30, yscale=1.2)
    c.mirror(lambda s: c.capsule((s * 0.22, 0.45, 0.04), (s * 0.27, 0.27, 0.09), 0.19, group='leg' + ('L' if s < 0 else 'R')))
    cut_below(0.25, ['legL', 'legR'])
    c.paint_fn(lambda p, n: p.y > 0.625, 0xfff6e8)   # waistband
    c.paint_fn(lambda p, n: 0.3 < p.y < 0.62 and abs(abs(math.atan2(p.x, p.z - 0.02)) - math.pi / 2) < 0.13, 0xffffff)   # side stripes
    c.blob((0.0, 0.67, front_z(0.67, 0.08)), (0.03, 0.03, 0.02), group='knot')
    c.mirror(lambda s: c.capsule((0, 0.66, front_z(0.66, 0.09)), (s * 0.05, 0.58, front_z(0.58, 0.1)), 0.016, group='knot'))
    paint_blobs(['knot'], 0xfff6e8)


@garment('legs', 'tutu', 0xff8fc0, 2600)
def tutu():
    rx, rz = body_ext(0.6)
    ring(0, 0.6, 0.02, rx + 0.045, rz + 0.045, 0.055, 'band', n=30, yscale=1.4)
    # two tiers of soft tulle petals, tipped down and out, staggered
    def tier(y, r0, ln, n, tilt, phase, g, wide):
        c.blob((0, y + 0.01, 0.02), (r0 + ln * 0.5, 0.04, r0 * 0.93 + ln * 0.5), group=g)
        for k in range(n):
            th = 2 * math.pi * (k + phase) / n
            rr = r0 + ln * 0.55
            c.blob((math.sin(th) * rr, y - math.sin(math.radians(tilt)) * ln * 0.5, 0.02 + math.cos(th) * rr * 0.93),
                   (wide, 0.04, ln * 0.6), rot=(tilt, math.degrees(th), 0), group=g)
    tier(0.55, 0.48, 0.34, 16, 22, 0.0, 'tier1', 0.13)
    tier(0.47, 0.5, 0.36, 16, 30, 0.5, 'tier2', 0.13)
    paint_blobs(['tier2'], 0xffb8d8)
    paint_blobs(['band'], 0xff5fa0)
    for k in range(8):
        a = 2 * math.pi * k / 8
        c.paint('gem', (math.sin(a) * (rx + 0.1), 0.6, 0.02 + math.cos(a) * (rz + 0.1)), (0.04, 0.04, 0.04), 0xffffff)
    # sparkles on the top tier
    for k in range(10):
        a = 2 * math.pi * (k + 0.5) / 10
        c.paint('spark', (math.sin(a) * 0.72, 0.5, 0.02 + math.cos(a) * 0.68), (0.035, 0.035, 0.035), 0xfff2a8)


GL_Y = HY + 0.075        # eye height
GL_Z = 0.655             # lens plane (just in front of the eyes, so shades cover them)
@garment('eyes', 'sunglasses', 0x3d3158, 1300)
def sunglasses():
    for s in (-1, 1):
        x = s * 0.215
        c.blob((x, GL_Y, GL_Z), (0.165, 0.13, 0.04), rot=(0, s * 14, 0), group='frame')
        c.paint('lens', (x, GL_Y, GL_Z + 0.04), (0.14, 0.108, 0.06), 0x2e4d9e, rot=(0, s * 14, 0))
        c.paint('glint', (x - 0.05, GL_Y + 0.05, GL_Z + 0.05), (0.07, 0.022, 0.06), 0x9ad8ff, rot=(0, 0, -35))
        c.capsule((s * 0.34, GL_Y + 0.02, GL_Z - 0.06), (s * 0.56, GL_Y + 0.03, 0.34), 0.03, group='arm')
        c.capsule((s * 0.56, GL_Y + 0.03, 0.34), (s * 0.64, GL_Y + 0.02, 0.0), 0.03, group='arm')
    c.capsule((-0.08, GL_Y + 0.03, GL_Z + 0.02), (0.08, GL_Y + 0.03, GL_Z + 0.02), 0.032, group='bridge')


@garment('eyes', 'hearts', 0xff3d7f, 1300)
def hearts():
    for s in (-1, 1):
        x = s * 0.22
        g = 'lens' + str(s)
        c.blob((x - 0.065, GL_Y + 0.04, GL_Z), (0.1, 0.1, 0.04), group=g)
        c.blob((x + 0.065, GL_Y + 0.04, GL_Z), (0.1, 0.1, 0.04), group=g)
        c.blob((x, GL_Y - 0.04, GL_Z), (0.1, 0.1, 0.04), rot=(0, 0, 45), group=g)
        c.paint('lens', (x, GL_Y + 0.0, GL_Z + 0.05), (0.12, 0.1, 0.06), 0xff9ec4)
        c.paint('glint', (x - 0.06, GL_Y + 0.05, GL_Z + 0.06), (0.04, 0.018, 0.05), 0xffffff, rot=(0, 0, -35))
        c.capsule((s * 0.34, GL_Y + 0.03, GL_Z - 0.06), (s * 0.56, GL_Y + 0.03, 0.34), 0.03, group='arm')
        c.capsule((s * 0.56, GL_Y + 0.03, 0.34), (s * 0.64, GL_Y + 0.02, 0.0), 0.03, group='arm')
    c.capsule((-0.08, GL_Y + 0.05, GL_Z + 0.02), (0.08, GL_Y + 0.05, GL_Z + 0.02), 0.03, group='bridge')


@garment('neck', 'scarf', 0xff4b4b, 1900)
def scarf():
    ring(0, 1.17, 0.0, 0.35, 0.33, 0.1, 'wrap', n=22, tilt=-0.04, yscale=1.1)
    pts = [(0.17, 1.12, 0.39), (0.21, 0.94, 0.47), (0.24, 0.76, 0.49)]
    for i in range(len(pts) - 1):
        a, b = pts[i], pts[i + 1]
        for k in range(4):
            p = lerp(a, b, k / 4)
            c.blob(p, (0.11, 0.08, 0.04), rot=(-15, 0, -8), group='scarfEnd')
    for k in range(5):
        c.blob((0.15 + k * 0.04, 0.68, 0.49), (0.028, 0.06, 0.025), group='fringe')
    stripes_y(0.09, 0xfff6e8, off=0.0, only=lambda p: 0.73 < p.y < 1.04)
    c.paint_fn(lambda p, n: p.y >= 1.04 and abs(math.atan2(p.x, p.z) % 0.6 - 0.3) < 0.1, 0xfff6e8)
    paint_blobs(['fringe'], 0xfff6e8)


@garment('neck', 'bowtie', 0xa77bff, 1100)
def bowtie():
    c.mirror(lambda s: c.blob((s * 0.12, 1.15, 0.34), (0.11, 0.085, 0.05), rot=(0, s * -15, s * 12), group='bow'))
    c.blob((0, 1.15, 0.37), (0.05, 0.055, 0.045), group='knot')
    for x, y in [(-0.16, 1.18), (-0.09, 1.11), (0.1, 1.19), (0.16, 1.12)]:
        c.paint('dot', (x, y, 0.4), (0.026, 0.026, 0.06), 0xffffff)
    c.paint('knot', (0, 1.15, 0.41), (0.06, 0.07, 0.05), 0x7a52e0)


@garment('neck', 'lei', 0xff6fa8, 2400)
def lei():
    cols = [0xff6fa8, 0xffd23f, 0xffffff, 0xff8a4a, 0xa77bff, 0x5ad1ff]
    n = 13
    for i in range(n):
        th = 2 * math.pi * i / n
        fr = max(0.0, math.cos(th))
        y = 1.12 - 0.13 * fr ** 1.5
        p = Vector((math.sin(th) * 0.44, y, math.cos(th) * (0.38 + 0.06 * fr) + 0.01))
        out = Vector((math.sin(th), 0.9 - 0.5 * fr, math.cos(th))).normalized()
        u = out.cross(Vector((0, 1, 0))).normalized()
        v = u.cross(out).normalized()
        g = 'fl%d' % i
        for k in range(5):
            a = 2 * math.pi * k / 5 + i
            q = p + (u * math.cos(a) + v * math.sin(a)) * 0.08
            c.blob(tuple(q), (0.058, 0.058, 0.045), group=g)
        c.blob(tuple(p + out * 0.035), (0.035, 0.035, 0.035), group='mid')
        paint_blobs(g, cols[i % len(cols)])
    paint_blobs('mid', 0xffc531)


@garment('hands', 'mittens', 0x4a90ff, 1700)
def mittens():
    for s in (-1, 1):
        g = 'arm' + ('L' if s < 0 else 'R')
        hx, hy, hz = HAND(s)
        c.blob((hx, hy - 0.01, hz), (0.165, 0.17, 0.15), group=g)
        c.blob((s * 0.75, 0.59, 0.25), (0.07, 0.08, 0.065), group=g)
        d = tuple(WR(s)[i] - SH(s)[i] for i in range(3))
        cuff(lerp(SH(s), WR(s), 0.93), d, 0.16, 0.06, 'cuff' + g)
        paint_blobs('cuff' + g, 0xfff6e8)
        c.paint('heart', (hx, hy - 0.02, hz + 0.15), (0.06, 0.05, 0.05), 0xff6fa8)


# =====================================================================================================
for slot, name, base, faces, fn in GARMENTS:
    if ONLY and name not in ONLY:
        continue
    c.layer('cloth_%s_%s' % (slot, name), base=base, target_faces=int(faces * 0.55))
    fn()
c.layer('skin')

# ---------------- rig ----------------
c.bone('body', (0, 0.15, 0), (0, 1.15, 0), region=lambda p: p.y < 1.4)
c.bone('head', (0, 1.25, 0), (0, 2.4, 0), parent='body', region=lambda p: p.y > 1.08)
for s, n in ((-1, 'L'), (1, 'R')):
    c.bone('arm.' + n, SH(s), HAND(s), parent='body')
    c.group_rules['arm.' + n] = ['arm' + n, 'hand' + n, 'cuffarm' + n]
    c.bone('leg.' + n, (s * 0.21, 0.46, 0.03), (s * 0.26, 0.08, 0.3), parent='body')
    c.group_rules['leg.' + n] = ['leg' + n, 'foot' + n] + [k + 'leg' + n for k in ('lace', 'eye', 'top', 'sole', 'collar')]
TB = [TAIL[0], TAIL[2], TAIL[3], TAIL[5], TAIL[7]]
c.chain('tail', TB, 'body', region=lambda p: p.z < -0.2 or p.x > 0.45)
for i in range(1, 5):
    c.group_rules['tail.%d' % i] = ['tail']
# garment-only spring bones (they move nothing on the skin)
c.bone('tuft.1', (0, 2.5, -0.05), (0, 2.78, -0.05), parent='head')        # pompoms
c.group_rules['tuft.1'] = ['pom']
for s, n in ((-1, 'L'), (1, 'R')):
    c.chain('ear.' + n, [(s * 0.2, 2.42, 0.06), (s * 0.3, 2.84, 0.05), (s * 0.4, 3.32, 0.0)], 'head')
    for i in (1, 2):
        c.group_rules['ear.%s.%d' % (n, i)] = ['bun' + n]
c.chain('mane', [(0, 1.1, -0.36), (0, 0.66, -0.56), (0, 0.16, -0.64)], 'body')   # the cape
for i in (1, 2):
    c.group_rules['mane.%d' % i] = ['cape']
c.chain('tuftS', [(0.17, 1.14, 0.36), (0.22, 0.9, 0.44), (0.23, 0.66, 0.45)], 'body')  # scarf end
for i in (1, 2):
    c.group_rules['tuftS.%d' % i] = ['scarfEnd']

FR = 0.62
c.face(center=(0, HY, 0.012), radius=FR, faceScale=1.0, noseColor=NOSE, snap=False, mouthZ=0.115, eyeSize=1.08)
anch = dict(nose=(0, HY - 0.04), eyeL=(-0.22, HY + 0.075), eyeR=(0.22, HY + 0.075), mouth=(0, HY - 0.19),
            tummy=(0, 0.7), handL=(-0.83, 0.56, 0.28), handR=(0.83, 0.56, 0.28),
            footL=(-0.26, 0.1, 0.42), footR=(0.26, 0.1, 0.42), earL=(-0.8, HY + 0.02, 0.0), earR=(0.8, HY + 0.02, 0.0),
            top=(0, 2.45, 0.0), neck=(0, 1.16, 0.34), legs=(0, 0.42, 0.48), chest=(0, 0.88, 0.45))
for k, p in anch.items():
    c.anchor(k, p, 'head' if p[1] > 1.3 else 'body')
c.extras['outline'] = 0.026
_orig_empties = c._empties
def _empties_and_drop(ao):
    _orig_empties(ao)
    import bpy
    bpy.data.objects.remove(c._carver)
c._empties = _empties_and_drop
c.build()
if os.environ.get('DBG'):
    fc = c.face_info['center']
    print('WROTE dbg face', fc)
    for y in (0.3, 0.12, 0, -0.1, -0.2, -0.3, -0.4):
        h = c.surface(0, fc[1] + y * FR)
        sph = fc[2] + FR * (1 - y * y) ** 0.5
        print('WROTE dbg y%.2fR surf %.3f sphere %.3f' % (y, h.z if h else -1, sph))
    for x in (0.22,):
        h = c.surface(x, HY + 0.075)
        print('WROTE dbg eye x', x, 'surf', h.z if h else None)
if os.environ.get("DBGC"):
    import bpy
    from collections import Counter
    for ob in bpy.data.objects:
        if ob.type == 'MESH' and ob.data.color_attributes:
            a = ob.data.color_attributes['Col']
            cnt = Counter(tuple(round(x, 2) for x in d.color[:3]) for d in a.data)
            print('WROTE col', ob.name, len(ob.data.vertices), cnt.most_common(6))
