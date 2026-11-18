"""WORDS batch 4: meals, snacks and drinks (docs/design/WORDS.md, words 91-120). One script, 19 models
(ONLY=prop_word_toast,prop_word_jam builds a subset). Game space: x right, y up, +z faces the child, bottom at y 0.
Every model is "one serving": bowls and plates come from ONE shared profile (bowl(), plate()) in different colours so the
crockery reads as a set; spoons come from spoon(). Food is slightly glossy: at most one hard-edged highlight band.
Natural sizes keep a cup smaller than a cake; the word card scales each to its 2 x 2 x 2 box (extras fit / wide).
  prop_word_toast      upright slice, brown crust, toasted face, melting butter pat               bones: body
  prop_word_jam        red jam jar, gingham cloth lid tied with string, label + strawberry, jam spoon      body
  prop_word_honey      beehive pot, dipper above it with a fat drip, bee sticker                  body, drip
  prop_word_cereal     blue bowl, milk, 14 coloured loops, spoon on the rim                        body
  prop_word_soup       green two-handled bowl, orange soup, white swirl, 3 steam curls, spoon      body, steam.1-3
  prop_word_pasta      yellow bowl heaped with bow ties, red sauce, basil leaf                     body
  prop_word_noodles    red bowl, noodle tangle, two noodles lifted on a fork                      body, fork
  prop_word_pizza      a tilted slice: puffy crust, drippy cheese, 3 pepperoni, 2 pepper bits      body
  prop_word_sausage    two curved grilled sausages on a white plate                               body
  prop_word_chips      red cone-box with a white stripe, 9 chips                                  body
  prop_word_pancake    stack of 3 on a plate, butter, syrup drips                                 body
  prop_word_cake       birthday cake on a stand, wedge pulled out, candle                         body, flame
  prop_word_popcorn    striped tub overflowing with popcorn, two kernels mid-air                  body, pop.1, pop.2
  prop_word_chocolate  2 x 4 bar, bitten corner, purple foil with a yellow band peeled back        body
  prop_word_jelly      fluted red jelly on a plate                                                body, tail.1, tail.2 (spring)
  prop_word_juice      orange carton, sloped top, striped bendy straw, orange-slice sticker       body
  prop_word_water      tumbler two-thirds full, a drop above it                                   body, drop
  prop_word_ice        three ice cubes stacked two-and-one on a little puddle                     body
  prop_word_rice       blue-and-white bowl with a tall dome of rice, three peas                   body
Word-card variants of reused models that did not read at card size (the originals are left as they are):
  prop_word_bread      a sandwich loaf along x, scored brown top, cut crumb end                   body
  prop_word_cracker    one square cracker standing up, leaning back, 3 x 3 holes                  body
  prop_word_sandwich   a triangle-cut half standing up, filling peeking out of the cut edge       body
  prop_word_yogurt     pink pot, yogurt swirl, the foil lid peeled up behind and curling over     body
  prop_word_lolly      ice lolly with its orange baked in (prop_lolly is white until tinted)      body
"""
import sys, os, math, random
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded, circle_poly, star_poly, rot_m, hexcol, G
from skit import SProp
import bpy
from mathutils import Vector, Matrix, Euler

ONLY = [s for s in os.environ.get('ONLY', '').split(',') if s]
TAU = math.tau

# ---------------- the shared palette (WORDS.md section 1, rule 4) ----------------
RED, ORANGE, YELLOW, GREEN, LEAF = 0xff4f4f, 0xff9a2e, 0xffd23a, 0x4cc75a, 0x2f8a3a
BLUE, SKY, PURPLE, PINK, ROSE = 0x3f8cff, 0x8fd3ff, 0x9b6dff, 0xff7fbf, 0xff9ec4
CREAM, WHITE, BROWN, WOOD, TAN = 0xf2e8d8, 0xfffaf0, 0xb07a4a, 0xd8924f, 0xf3d9ae
GREY, SLATE, INK = 0xb9c0c9, 0x6f7a8c, 0x3a2838


def mix(a, b, t):
    ca = [(a >> s) & 255 for s in (16, 8, 0)]
    cb = [(b >> s) & 255 for s in (16, 8, 0)]
    c = [round(x + (y - x) * t) for x, y in zip(ca, cb)]
    return (c[0] << 16) | (c[1] << 8) | c[2]


def light(c, t=0.35):
    return mix(c, 0xffffff, t)


def dark(c, t=0.18):
    return mix(c, INK, t)


# ---------------- small geometry helpers ----------------
def euler_to(yax, zax=(0, 0, 1)):
    """game-space XYZ euler (degrees) that turns local +y onto yax and local +z toward zax"""
    y = Vector(yax).normalized()
    z = Vector(zax)
    z = z - y * z.dot(y)
    if z.length < 1e-6:
        z = Vector((0, 0, 1)) - y * y.z if abs(y.z) < 0.9 else Vector((1, 0, 0))
    z.normalize()
    x = y.cross(z)
    M = Matrix((x, y, z)).transposed()
    return tuple(math.degrees(a) for a in M.to_euler('XYZ'))


def offset_poly(poly, d):
    """move a closed 2D polygon inward by d"""
    n = len(poly)
    area = sum(poly[i][0] * poly[(i + 1) % n][1] - poly[(i + 1) % n][0] * poly[i][1] for i in range(n))
    s = 1 if area > 0 else -1
    out = []
    for i in range(n):
        p0, p1, p2 = Vector(poly[i - 1]), Vector(poly[i]), Vector(poly[(i + 1) % n])
        e1, e2 = (p1 - p0).normalized(), (p2 - p1).normalized()
        n1, n2 = Vector((-e1.y, e1.x)) * s, Vector((-e2.y, e2.x)) * s
        nn = (n1 + n2)
        nn = nn.normalized() if nn.length > 1e-6 else n1
        m = d / max(0.35, nn.dot(n1))
        q = p1 + nn * m
        out.append((q.x, q.y))
    return out


def slab_mesh(poly, z0, z1, r, seg=3):
    """a pillowy slab: the 2D outline poly (x, y) extruded from z0 to z1, every edge rounded with radius r.
    Returns (verts, faces) in local space."""
    loops = []
    for k in range(seg + 1):                        # back cap rim -> back wall
        a = math.pi / 2 * (1 - k / seg)
        loops.append((r * (1 - math.cos(a)), z0 + r - r * math.sin(a)))
    for k in range(seg + 1):                        # front wall -> front cap rim
        a = math.pi / 2 * k / seg
        loops.append((r * (1 - math.cos(a)), z1 - r + r * math.sin(a)))
    n = len(poly)
    verts, faces = [], []
    for ins, z in loops:
        pp = offset_poly(poly, ins) if ins > 1e-6 else poly
        verts += [(x, y, z) for x, y in pp]
    L = len(loops)
    for l in range(L - 1):
        for i in range(n):
            j = (i + 1) % n
            faces.append((l * n + i, l * n + j, (l + 1) * n + j, (l + 1) * n + i))
    faces.append(tuple(range(n - 1, -1, -1)))
    faces.append(tuple((L - 1) * n + i for i in range(n)))
    return verts, faces


def xform(verts, M=None, t=(0, 0, 0)):
    M = M or Matrix.Identity(3)
    T = Vector(t)
    return [tuple(M @ Vector(v) + T) for v in verts]


def slab(p, poly, z0, z1, r, M=None, t=(0, 0, 0), seg=3):
    v, f = slab_mesh(poly, z0, z1, r, seg)
    p.mesh(xform(v, M, t), f)


def revolve(p, prof, warp=None, seg=64, pos=(0, 0, 0), scale=(1, 1)):
    """like Prop.lathe (profile (r, y) from the axis at the bottom to the axis at the top) but warp(a, r, y) -> (r, y)
    can bend each ring by its angle a (0 = +z, toward +x): flutes, wavy hems, ridges."""
    n = len(prof)
    verts, faces = [], []
    for i in range(seg):
        a = TAU * i / seg
        for r, y in prof:
            if warp:
                r, y = warp(a, r, y)
            verts.append((pos[0] + r * math.sin(a) * scale[0], pos[1] + y, pos[2] + r * math.cos(a) * scale[1]))
    for i in range(seg):
        j = (i + 1) % seg
        for k in range(n - 1):
            faces.append((i * n + k, j * n + k, j * n + k + 1, i * n + k + 1))
    for k in (0, n - 1):
        c = len(verts)
        verts.append((pos[0], pos[1] + prof[k][1], pos[2]))
        for i in range(seg):
            j = (i + 1) % seg
            faces.append((c, i * n + k, j * n + k) if k == 0 else (c, j * n + k, i * n + k))
    p.mesh(verts, faces)


def ang(q):
    """angle of a game point about the y axis (0 = +z, toward +x)"""
    return math.atan2(q.x, q.z)


def rxz(q, c=(0, 0)):
    return math.hypot(q.x - c[0], q.z - c[1])


# ---------------- shared crockery ----------------
def skin_layer(p, col, tf, voxel=0.01):
    """the crockery is the model's main skin layer"""
    p.layer('skin')
    L = p.layers['skin']
    L['base'], L['target_faces'], L['voxel'] = hexcol(col), tf, voxel


def bowl(p, R, H, col, foot=0.55, tf=900):
    """One bowl profile for the whole set: a round foot ring, a soft belly, a fat rounded lip with a lighter top band.
    Solid, with a shallow well at y = H - 0.04 for the food. It is the skin layer. Returns the rim height."""
    skin_layer(p, col, tf)
    Rf = R * foot
    pts = [(0, 0), (Rf, 0), (Rf + 0.01, 0.045)]
    for k in range(1, 9):
        t = k / 8
        pts.append((Rf + (R - Rf) * math.sin(t * math.pi / 2) ** 0.75, 0.045 + (H - 0.045) * t))
    pts += [(R + 0.012, H + 0.012), (R - 0.02, H + 0.035), (R - 0.07, H + 0.012), (R - 0.09, H - 0.03), (0, H - 0.04)]
    p.lathe(rounded(pts, 0.022, n=3), seg=56)
    p.paint_fn(lambda q, n: q.y < 0.05, dark(col, 0.14))                           # foot ring
    p.paint_fn(lambda q, n: q.y > H - 0.002 and rxz(q) > R - 0.085 and n.y > 0.3, light(col, 0.4))   # lit lip band
    return H + 0.035


def plate(p, R, col=WHITE, tf=700):
    """the shared plate: low foot, a raised rim with a lighter band, a flat well at y 0.055. The skin layer."""
    skin_layer(p, col, tf)
    pts = [(0, 0), (R * 0.55, 0), (R * 0.58, 0.03), (R * 0.82, 0.05), (R, 0.085), (R - 0.01, 0.1), (R - 0.05, 0.095),
           (R * 0.72, 0.06), (0, 0.055)]
    p.lathe(rounded(pts, 0.02, n=3), seg=56)
    p.paint_fn(lambda q, n: n.y < -0.2 or q.y < 0.03, mix(col, GREY, 0.45))        # shaded underside
    p.paint_fn(lambda q, n: q.y > 0.085 and rxz(q) > R - 0.05, mix(col, SKY, 0.55))  # a thin sky-blue rim line
    return 0.055


def spoon(p, bowl_c, end, up=(0, 1, 0), col=GREY, name='spoon', size=1.0, food=None):
    """a chunky toy spoon: bowl centred at bowl_c, handle to `end`, the bowl's open face toward `up`.
    GREY metal with one WHITE highlight band down the handle. food: colour of a blob sitting in the bowl."""
    p.layer(name, base=col, target_faces=int(500 * size), voxel=0.007)
    B, E = Vector(bowl_c), Vector(end)
    d = (E - B).normalized()
    s = size
    rot = euler_to(-d, up)                       # local y = toward the bowl tip, local z = up out of the bowl face
    p.blob(tuple(B), (0.06 * s, 0.085 * s, 0.024 * s), rot=rot, group='sb')
    neck = B + d * 0.085 * s
    path = [neck + (E - neck) * (k / 6) for k in range(7)]
    p.tube([tuple(v) for v in path], [0.018 * s, 0.019 * s, 0.022 * s, 0.026 * s, 0.03 * s, 0.032 * s, 0.03 * s], rseg=12)
    upv = Vector(up).normalized()
    side = d.cross(upv).normalized()
    p.paint_fn(lambda q, n: (q - B).dot(d) > 0.12 * s and n.dot(upv) > 0.55 and abs(n.dot(side)) < 0.5 and (q - B).dot(d) < (E - B).length - 0.06 * s, WHITE)
    if food is not None:
        p.layer(name + '_food', base=food, target_faces=120, voxel=0.006)
        p.blob(tuple(B + upv * 0.022 * s), (0.048 * s, 0.065 * s, 0.03 * s), rot=rot, group='sf')


def finish(p, w, h, bones=None, outline=0.018):
    """body bone (+ extra moving bones), card fit (WORDS.md: read inside a 2 x 2 x 2 box), thin food outline"""
    if not any(b[0] == 'body' for b in p.bones):
        p.bones.insert(0, ('body', (0, 0, 0), (0, max(0.3, h * 0.6), 0), None, 0.0))
    p.extras['outline'] = outline
    k = 1.9 / max(w, h)
    p.extras['fit'] = round(h * k, 2)
    if w > h:
        p.extras['wide'] = round(w * k, 2)
    p.build()


class FoodProp(SProp):
    """Prop with two extras for food:
    layer['hard'] = True   a layer built only from solid pieces skips the voxel remesh (flat slabs stay flat, edges crisp)
    layer['cuts'] = [(game centre, radius), ...]   round bites out of a layer (cylinders through it along z)"""
    def __init__(self, kind, **kw):
        super().__init__(kind, hard=False, **kw)

    def _metaballs(self):
        objs = super()._metaballs()
        self._cutters = []
        for c, r in self.layers[self._cur].get('cuts', []):
            bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=1.0, vertices=48, location=G(c), rotation=(math.pi / 2, 0, 0))
            cu = bpy.context.active_object
            self._cutters.append(cu)
            for ob in objs:
                if ob.type == 'MESH':
                    md = ob.modifiers.new('bite', 'BOOLEAN')
                    md.operation = 'DIFFERENCE'
                    md.object = cu
                    md.solver = 'MANIFOLD'
        return objs

    def _skin(self):
        L = self.layers[self._cur]
        if not L.get('hard'):
            L['remesh'] = True
        sk = super()._skin()
        for cu in getattr(self, '_cutters', []):
            bpy.data.objects.remove(cu)
        self._cutters = []
        return sk

    def hard(self, name=None):
        self.layers[name or self._cur]['hard'] = True


def bowl_r(R, H, y, foot=0.55):
    """outer radius of the shared bowl at height y (for stickers on its wall)"""
    Rf = R * foot
    t = max(0.0, min(1.0, (y - 0.045) / (H - 0.045)))
    return Rf + (R - Rf) * math.sin(t * math.pi / 2) ** 0.75


def bread():
    p = FoodProp('prop_word_bread', base=WOOD, target_faces=1000, voxel=0.009, smooth=3)
    # a proper sandwich loaf lying along x: the bread-slice outline (as toast) extruded, a domed golden-brown top with
    # three pale score marks, the +x end cut to show the soft crumb
    out = [(-0.24, 0.0), (0.24, 0.0), (0.26, 0.3), (0.31, 0.38), (0.32, 0.47), (0.27, 0.56), (0.15, 0.6), (0.0, 0.61),
           (-0.15, 0.6), (-0.27, 0.56), (-0.32, 0.47), (-0.31, 0.38), (-0.26, 0.3)]
    poly = [q[:2] for q in rounded(out, 0.06, n=3, closed=True)]
    Mx = Matrix(((0, 0, 1), (0, 1, 0), (-1, 0, 0)))      # local (a, y, c) -> game (c, y, -a): outline across z, length along x
    v, f = slab_mesh([(-a, y) for a, y in poly], -0.47, 0.47, 0.07, seg=3)
    p.mesh(xform(v, Mx), f)
    p.paint_fn(lambda q, n: n.y > 0.55, BROWN)                                   # the baked top
    p.paint_fn(lambda q, n: n.y > 0.55 and q.y > 0.5 and any(abs((q.x - c) + 0.6 * q.z) < 0.022 for c in (-0.24, 0.0, 0.24)), TAN)
    p.paint_fn(lambda q, n: q.y < 0.03 and n.y < -0.5, dark(WOOD, 0.15))
    # the cut end: a cream crumb face a little proud of the crust, so it gets its own ink edge
    p.layer('crumb', base=CREAM)
    p.hard()
    face = [q[:2] for q in rounded(offset_poly(out, 0.05), 0.045, n=3, closed=True)]
    v, f = slab_mesh([(-a, y) for a, y in face], 0.44, 0.485, 0.014, seg=1)
    p.mesh(xform(v, Mx), f)
    p.layer('skin')
    finish(p, 0.96, 0.61)          # measured bounds (x width, height)


def cracker():
    p = FoodProp('prop_word_cracker', base=0xf2c25e, target_faces=900, voxel=0.007, smooth=2)
    p.hard()
    # one square cracker standing up, leaning back a little, its face (and the 3 x 3 pricked holes) toward the child
    S, T = 0.32, 0.055
    sq = rounded([(-S, -S), (S, -S), (S, S), (-S, S)], 0.06, n=4, closed=True)
    per = [math.dist(sq[i][:2], sq[(i + 1) % len(sq)][:2]) for i in range(len(sq))]
    tot, N, pts = sum(per), 64, []
    for k in range(N):
        d, i = tot * k / N, 0
        while d > per[i]:
            d -= per[i]; i += 1
        a0, a1 = sq[i], sq[(i + 1) % len(sq)]
        x, y = a0[0] + (a1[0] - a0[0]) * d / per[i], a0[1] + (a1[1] - a0[1]) * d / per[i]
        r = math.hypot(x, y)
        w = 0.02 * (0.5 + 0.5 * math.cos(TAU * 16 * k / N))          # scalloped edge: 4 soft bumps a side
        pts.append((x + x / r * w, y + y / r * w))
    lean = rot_m((-12, 0, 0))
    t0 = Vector((0, S + 0.018, 0.0))
    v, f = slab_mesh(pts, -T, T, 0.03, seg=2)
    p.mesh(xform(v, lean, t0), f)
    Li = lean.inverted()
    p.paint_fn(lambda q, n: (Li @ n).z < 0.5, 0xd99a3c)                           # golden-brown baked edges
    # the pricked holes: nine round dents, crisp, each with a thin ink edge
    p.layer('holes', base=0xb0742a)
    p.hard()
    for ix in (-1, 0, 1):
        for iy in (-1, 0, 1):
            v, f = slab_mesh([(ix * 0.17 + x, iy * 0.17 + y) for x, y in circle_poly(0.034, 14)], T - 0.004, T + 0.006, 0.003, seg=1)
            p.mesh(xform(v, lean, t0), f)
    p.layer('skin')
    finish(p, 0.68, 0.68)          # measured bounds (x width, height)


def sandwich():
    p = FoodProp('prop_word_sandwich', base=CREAM, target_faces=500, voxel=0.008, smooth=3)
    # a triangle-cut half standing on one crust edge: the two bread slices face the child at a three-quarter turn and
    # the cut edge shows the filling - wavy lettuce, cheese and tomato peeking out
    yaw = rot_m((0, -38, 0))
    tri = [(-0.36, 0.0), (0.42, 0.0), (-0.36, 0.78)]
    tri = [q[:2] for q in rounded(tri, 0.07, n=3, closed=True)]
    CRUST = mix(TAN, WOOD, 0.55)
    for nm, z0, z1 in (('skin', -0.2, -0.07), ('bread2', 0.07, 0.2)):
        if nm != 'skin':
            p.layer(nm, base=CREAM, target_faces=500, voxel=0.008)
        v, f = slab_mesh(tri, z0, z1, 0.04, seg=2)
        p.mesh(xform(v, yaw), f)
        li = lambda q: yaw.inverted() @ q
        # golden crust on the two short sides; the cut edge stays soft and white
        p.paint_fn(lambda q, n, li=li: (li(q).y < 0.05 or li(q).x < -0.31) and (li(q).x * 0.7071 + li(q).y * 0.7071) < 0.27, CRUST)
    # the filling, each a layer that peeks out past the cut edge
    def filling(name, col, z0, z1, grow, wavy=0.0, tf=320):
        p.layer(name, base=col, target_faces=tf, voxel=0.006)
        pp = []
        base = [(-0.36, 0.0), (0.42, 0.0), (-0.36, 0.78)]
        dense = []
        for i in range(3):
            a, b = Vector(base[i]), Vector(base[(i + 1) % 3])
            for k in range(16):
                dense.append(a.lerp(b, k / 16))
        for d in dense:
            on_cut = abs(d.x + d.y - 0.42) < 0.02 and d.x > -0.33 and d.y > 0.03          # the cut edge: x + y = 0.42
            if on_cut:
                t = (d.y) / 0.78
                d = d + Vector((0.7071, 0.7071)) * (grow + wavy * math.sin(t * TAU * 4))
            pp.append((d.x, d.y))
        pp = [q[:2] for q in rounded(offset_poly(pp, 0.045), 0.03, n=2, closed=True)]
        v, f = slab_mesh(pp, z0, z1, min(0.018, (z1 - z0) / 2 - 0.002), seg=1)
        p.mesh(xform(v, yaw), f)
    filling('lettuce', GREEN, -0.075, -0.025, 0.1, wavy=0.022, tf=380)
    filling('cheese', YELLOW, 0.025, 0.075, 0.075)
    # two tomato slices between them, poking out of the cut edge
    p.layer('tomato', base=RED, target_faces=320, voxel=0.006)
    for t in (0.28, 0.66):
        c = Vector((0.42, 0.0)).lerp(Vector((-0.36, 0.78)), t) + Vector((0.7071, 0.7071)) * -0.03
        c = c + Vector((0.7071, 0.7071)) * 0.06
        p.cyl(tuple(yaw @ Vector((c.x, c.y, -0.03))), 0.085, 0.06, rot=(90, -38, 0), bevel=0.02, seg=24)
    p.layer('skin')
    finish(p, 0.78, 0.74)          # measured bounds (x width, height)


def yogurt():
    p = FoodProp('prop_word_yogurt', base=PINK, target_faces=700, voxel=0.009, smooth=3)
    POT = mix(PINK, WHITE, 0.25)
    p.layers['skin']['base'] = hexcol(POT)
    RIM = 0.475
    p.lathe(rounded([(0, 0), (0.21, 0), (0.27, 0.44), (0.29, 0.46), (0.27, RIM), (0.24, 0.45), (0.0, 0.45)], 0.025, n=3), seg=48)
    p.paint_fn(lambda q, n: 0.13 < q.y < 0.31 and n.y < 0.4, WHITE)                    # a white band round the middle
    p.paint_fn(lambda q, n: q.y > 0.44 and rxz(q) < 0.25 and n.y > 0.5, light(PINK, 0.6))  # the yogurt inside
    r_of = lambda y: 0.21 + 0.06 * y / 0.44
    p.layer('berry', base=RED)
    p.hard()
    p.sticker([(0.05 * math.sin(a), -0.055 * math.cos(a) * (1.25 if math.cos(a) > 0 else 0.8)) for a in [i / 18 * TAU for i in range(18)]], 0.21, r_of, thick=0.01, lift=0.004)
    p.layer('berrytop', base=GREEN)
    p.hard()
    p.sticker(star_poly(0.034, 0.45, 5, rot=-90), 0.255, r_of, thick=0.01, lift=0.009)
    # a soft swirl of yogurt showing in the front half, where the lid has been peeled away
    p.layer('swirl', base=light(PINK, 0.75), target_faces=260, voxel=0.006)
    p.blob((0.0, 0.47, 0.11), (0.12, 0.035, 0.09), group='sw')
    p.blob((0.01, 0.51, 0.11), (0.06, 0.035, 0.05), group='sw')
    p.blob((0.02, 0.545, 0.11), (0.02, 0.025, 0.02), group='sw')
    # the round foil lid, peeled from the front: a sliver at the back still lies on the rim, the rest stands up behind
    # the pot and curls over backward (silver underside and a smear of yogurt toward the child), a pull tab at the top.
    # The peel is turned a little (yaw) so it reads as a bent foil, not a flat disc.
    p.layer('lid', base=mix(GREY, WHITE, 0.55), target_faces=650, voxel=0.005)
    R, TH, V0, K = 0.29, 0.018, -0.2, 4.2
    C = Vector((0, RIM + 1 / K, V0))                          # the centre of the curl

    def bend(x, v, w):
        if v <= V0:
            return (x, RIM + 0.004 + w, v)
        th = K * (v - V0)
        z, y = V0 + math.sin(th) / K, RIM + (1 - math.cos(th)) / K
        return (x, RIM + 0.004 + y - RIM + (-math.sin(th) * 0 + math.cos(th)) * w, z - math.sin(th) * w)

    def rad(a):                                               # the lid outline (a = angle from +v), with a pull tab
        tab = 0.055 * max(0.0, 1 - abs(a) / 0.22)
        return R + tab
    NR, NA = 9, 48
    verts, faces = [], []
    for side, w in ((0, -TH / 2), (1, TH / 2)):
        verts.append(bend(0, 0, w))
        for i in range(1, NR + 1):
            for j in range(NA):
                a = TAU * j / NA - math.pi
                r = rad(a) * i / NR
                verts.append(bend(r * math.sin(a), r * math.cos(a), w))
    per = 1 + NR * NA
    for side in (0, 1):
        o = side * per
        for j in range(NA):
            j2 = (j + 1) % NA
            fc = (o, o + 1 + j, o + 1 + j2)
            faces.append(fc if side else fc[::-1])
            for i in range(NR - 1):
                a0, a1 = o + 1 + i * NA + j, o + 1 + i * NA + j2
                b0, b1 = a0 + NA, a1 + NA
                fq = (a0, b0, b1, a1)
                faces.append(fq if side else fq[::-1])
    for j in range(NA):
        j2 = (j + 1) % NA
        a0, a1 = 1 + (NR - 1) * NA + j, 1 + (NR - 1) * NA + j2
        faces.append((a0, a1, per + a1, per + a0))
    Ry = rot_m((0, 22, 0))
    verts = [tuple(Ry @ Vector(v)) for v in verts]
    C = Ry @ C
    p.mesh(verts, faces)
    # the printed top of the lid faces into the curl (pink); the silver underside faces out, with a yogurt smear
    p.paint_fn(lambda q, n: n.dot(C - q) > 0, PINK)
    p.paint_fn(lambda q, n: n.dot(C - q) > 0 and q.y < RIM + 0.03 and rxz(q) < 0.16, WHITE)
    p.paint_fn(lambda q, n: n.dot(C - q) <= 0 and math.hypot(q.x, q.y - RIM - 0.2) < 0.1, light(PINK, 0.6))
    p.layer('skin')
    finish(p, 0.56, 0.87)          # measured bounds (x width, height)


def lolly():
    p = FoodProp('prop_word_lolly', base=ORANGE, target_faces=700, voxel=0.01, smooth=3)
    # an ice lolly with the colours baked in: an orange top, the lower third a paler orange, one white highlight band,
    # a wooden stick
    p.box((0, 0.62, 0), (0.19, 0.3, 0.085), bevel=0.08)
    p.blob((0.0, 0.92, 0), (0.19, 0.08, 0.085), group='top')
    p.paint_fn(lambda q, n: q.y < 0.45, light(ORANGE, 0.45))
    p.paint_fn(lambda q, n: abs(q.y - 0.45) < 0.018, WHITE)
    p.paint_fn(lambda q, n: n.z > 0.5 and -0.13 < q.x < -0.07 and 0.55 < q.y < 0.88, light(ORANGE, 0.75))
    p.layer('stick', base=TAN, target_faces=200, voxel=0.008)
    p.box((0, 0.19, 0), (0.05, 0.2, 0.025), bevel=0.022)
    p.paint_fn(lambda q, n: q.y < 0.03, dark(TAN, 0.1))
    p.layer('skin')
    finish(p, 0.38, 0.98)          # measured bounds (x width, height)


# =====================================================================================================
def toast():
    p = FoodProp('prop_word_toast', base=BROWN, target_faces=900, voxel=0.009, smooth=3)
    p.hard()
    out = [(-0.33, 0.0), (0.33, 0.0), (0.35, 0.44), (0.42, 0.55), (0.44, 0.68), (0.38, 0.8), (0.22, 0.87), (0.0, 0.885),
           (-0.22, 0.87), (-0.38, 0.8), (-0.44, 0.68), (-0.42, 0.55), (-0.35, 0.44)]
    poly = [q[:2] for q in rounded(out, 0.07, n=3, closed=True)]
    slab(p, poly, -0.1, 0.1, 0.05, seg=2)
    # the toasted face: a slim crust rim left all round, the face a little proud so it gets its own ink edge
    p.layer('face', base=0xf9ba6e)
    p.hard()
    face = [q[:2] for q in rounded(offset_poly(out, 0.06), 0.05, n=3, closed=True)]   # round AFTER the inset: no folded corners
    slab(p, face, 0.07, 0.11, 0.018, seg=1)
    # the butter pat, softening: a rounded square with one melting drip and a lit top edge
    p.layer('butter', base=YELLOW, target_faces=320, voxel=0.006)
    p.box((0.02, 0.5, 0.13), (0.12, 0.1, 0.03), rot=(0, 0, 9), bevel=0.035)
    p.capsule((-0.04, 0.42, 0.13), (-0.05, 0.33, 0.125), 0.034, group='drip', r2=0.03)
    p.blob((-0.05, 0.315, 0.125), (0.04, 0.042, 0.03), group='drip')
    p.paint_fn(lambda q, n: n.y > 0.45 and q.y > 0.56, light(YELLOW, 0.55))
    p.layer('skin')
    finish(p, 0.86, 0.88)          # measured bounds (x width, height)


def jam():
    p = FoodProp('prop_word_jam', base=RED, target_faces=480, voxel=0.01, smooth=3)
    Rj, FILL = 0.27, 0.38
    prof = rounded([(0, 0), (0.25, 0), (Rj, 0.04), (Rj, 0.45), (0.25, 0.5), (0.2, 0.53), (0.2, 0.585), (0, 0.585)], 0.035, n=3)
    p.lathe(prof, seg=48)
    p.paint_fn(lambda q, n: q.y > FILL, SKY)                                  # empty glass above the jam
    p.paint_fn(lambda q, n: q.y < 0.035 and n.y < 0.3, SKY)                   # the thick glass foot
    r_of = lambda y: Rj
    p.layer('glint', base=WHITE, target_faces=100, voxel=0.005)
    p.hard()
    p.sticker([q[:2] for q in rounded([(-0.018, -0.12), (0.018, -0.12), (0.018, 0.12), (-0.018, 0.12)], 0.017, n=3, closed=True)],
              0.27, r_of, thick=0.012, ang=-1.0, lift=0.004)
    # the label and its strawberry
    p.layer('label', base=WHITE, target_faces=150, voxel=0.006)
    p.hard()
    p.sticker([q[:2] for q in rounded([(-0.15, -0.1), (0.15, -0.1), (0.15, 0.1), (-0.15, 0.1)], 0.04, n=3, closed=True)],
              0.19, r_of, thick=0.014, lift=0.004)
    p.layer('berry', base=RED, target_faces=150, voxel=0.005)
    p.hard()
    berry = [(0.062 * math.sin(a), -0.068 * math.cos(a) * (1.2 if math.cos(a) > 0 else 0.75)) for a in [i / 20 * TAU for i in range(20)]]
    p.sticker(berry, 0.175, r_of, thick=0.012, lift=0.014)
    p.layer('berrytop', base=GREEN, target_faces=100, voxel=0.005)
    p.hard()
    p.sticker(star_poly(0.045, 0.45, 5, rot=-90), 0.226, r_of, thick=0.012, lift=0.02)
    # the gingham cloth cover: a puffy domed top gathered at the neck, a wavy flared hem
    p.layer('cover', base=WHITE, target_faces=400, voxel=0.008)   # (never 'cloth*': the engine hides those)
    cp = rounded([(0, 0.5), (0.2, 0.5), (0.315, 0.43), (0.33, 0.415), (0.31, 0.405), (0.215, 0.55), (0.24, 0.6),
                  (0.235, 0.635), (0.17, 0.66), (0, 0.67)], 0.025, n=3)

    def hem(a, r, y):
        w = max(0.0, min(1.0, (0.54 - y) / 0.1)) if r > 0.2 else 0.0
        return r * (1 + 0.06 * math.cos(9 * a) * w), y - 0.03 * (0.5 + 0.5 * math.cos(9 * a)) * w
    revolve(p, cp, hem, seg=72)
    S = 0.08

    def ging(q, n):
        if n.y > 0.6:
            i, j = math.floor(q.x / S + 0.5), math.floor(q.z / S + 0.5)
        else:
            i, j = math.floor(ang(q) * 0.26 / S + 0.5), math.floor((q.y - 0.42) / S)
        return i % 2, j % 2
    p.paint_fn(lambda q, n: sum(ging(q, n)) == 1, light(RED, 0.5))
    p.paint_fn(lambda q, n: sum(ging(q, n)) == 2, RED)
    # the string round the gather, with a little bow at the front
    p.layer('string', base=WOOD, target_faces=260, voxel=0.006)
    p.ring((0, 0.552, 0), 0.212, 0.017, seg=40)
    for s in (-1, 1):
        p.blob((s * 0.045, 0.565, 0.222), (0.045, 0.028, 0.018), rot=(0, -s * 20, s * 20), group='bow%d' % s)
        p.capsule((s * 0.012, 0.545, 0.228), (s * 0.035, 0.49, 0.25), 0.015, group='end%d' % s)
    p.blob((0, 0.553, 0.228), (0.021, 0.021, 0.017), group='knot')
    # a little spoon of jam leaning on the jar
    spoon(p, (0.33, 0.05, 0.25), (0.205, 0.29, 0.19), up=(0.1, 0.75, 0.65), food=RED, size=0.75)
    p.layer('skin')
    finish(p, 0.69, 0.67)          # measured bounds (x width, height)


def honey():
    p = FoodProp('prop_word_honey', base=YELLOW, target_faces=650, voxel=0.01, smooth=3)
    # a beehive skep: three fat stacked ridges getting smaller, a rolled opening at the top
    prof = [(0, 0), (0.3, 0), (0.335, 0.04), (0.35, 0.1), (0.33, 0.165), (0.31, 0.185), (0.325, 0.23), (0.32, 0.29),
            (0.29, 0.34), (0.27, 0.355), (0.27, 0.39), (0.245, 0.44), (0.2, 0.48), (0.19, 0.51), (0.16, 0.52), (0.14, 0.5), (0, 0.5)]
    p.lathe(rounded(prof, 0.03, n=3), seg=56)
    p.paint_fn(lambda q, n: (0.16 < q.y < 0.205 or 0.33 < q.y < 0.37) and n.y > -0.2, dark(YELLOW, 0.14))   # grooves
    p.paint_fn(lambda q, n: q.y > 0.44 and rxz(q) < 0.15 and n.y > 0.5, ORANGE)                         # honey inside
    # the bee sticker on a cream disc
    r_of = lambda y: 0.335 - 0.02 * abs(y - 0.25) / 0.1
    p.layer('disc', base=CREAM, target_faces=150, voxel=0.005)
    p.hard()
    p.sticker(circle_poly(0.1, 28), 0.26, r_of, thick=0.014, lift=0.006)
    p.layer('bee', base=YELLOW, target_faces=220, voxel=0.004)
    p.sticker([(0.062 * math.cos(a), 0.042 * math.sin(a)) for a in [i / 22 * TAU for i in range(22)]], 0.25, r_of, thick=0.012, lift=0.017)
    p.paint_fn(lambda q, n: (-0.04 < q.x < -0.018 or 0.005 < q.x < 0.027 or q.x > 0.047) and q.z > 0.3, INK)
    p.layer('wings', base=WHITE, target_faces=120, voxel=0.004)
    p.hard()
    for x in (-0.014, 0.024):
        p.sticker([(0.026 * math.cos(a), 0.034 * math.sin(a)) for a in [i / 14 * TAU for i in range(14)]], 0.302, r_of,
                  thick=0.01, ang=x / 0.34, lift=0.023)
    # the dipper: a short fat wood handle up to the right, its grooved head held just over the opening
    A = Vector((-0.02, 0.665, 0.04))            # head centre
    d = Vector((0.78, 0.6, -0.12)).normalized()
    p.layer('dipper', base=WOOD, target_faces=480, voxel=0.006)
    p.tube([tuple(A + d * t) for t in (0.0, 0.12, 0.24, 0.36, 0.42)], [0.03, 0.03, 0.033, 0.036, 0.034], rseg=12)
    p.blob(tuple(A + d * 0.43), (0.046, 0.046, 0.046), group='knob')
    rot = euler_to(d)
    for k, t in enumerate((-0.07, -0.03, 0.01, 0.05)):
        p.blob(tuple(A + d * t), (0.072, 0.02, 0.072), rot=rot, group='g%d' % k)
    p.capsule(tuple(A - d * 0.095), tuple(A + d * 0.07), 0.048, group='core')
    p.paint_fn(lambda q, n: (q - A).dot(d) > 0.09 and n.y > 0.55 and n.z > -0.2, light(WOOD, 0.4))   # lit band
    # honey on the underside of the head, running into one fat drip (the drip bone stretches it)
    p.layer('honeydrip', base=ORANGE, target_faces=350, voxel=0.006)
    p.blob(tuple(A + Vector((0.0, -0.05, 0.0))), (0.06, 0.03, 0.055), group='coat')
    p.capsule(tuple(A + Vector((0, -0.06, 0))), tuple(A + Vector((0, -0.1, 0))), 0.026, group='coat', r2=0.022)
    p.blob(tuple(A + Vector((0, -0.12, 0))), (0.044, 0.05, 0.044), group='coat')
    p.paint_fn(lambda q, n: n.dot(Vector((-0.5, 0.3, 0.8)).normalized()) > 0.9 and q.y < A.y - 0.09, light(ORANGE, 0.5))
    p.layer('skin')
    drip_top = A.y - 0.045
    isdrip = lambda q: drip_top > q.y > 0.5 and math.hypot(q.x - A.x, q.z - A.z) < 0.07
    p.bone('body', (0, 0, 0), (0, 0.4, 0), region=lambda q: not isdrip(q))
    p.bone('drip', (A.x, drip_top, A.z), (A.x, A.y - 0.18, A.z), parent='body', region=isdrip)
    finish(p, 0.70, 0.96)          # measured bounds (x width, height)


def cereal():
    p = FoodProp('prop_word_cereal', base=BLUE, target_faces=400, voxel=0.01, smooth=3)
    rim = bowl(p, 0.5, 0.3, BLUE, tf=600)
    # milk: a soft white pool filling the bowl to just under the lip
    p.layer('milk', base=WHITE, target_faces=300, voxel=0.01)
    p.lathe(rounded([(0, 0.2), (0.43, 0.2), (0.44, 0.3), (0.38, 0.325), (0, 0.335)], 0.03, n=3), seg=40)
    # 14 chunky loops heaped in the middle, faces tipped toward the child so they read as rings
    p.layer('loops', base=YELLOW, target_faces=1200, voxel=0.006)
    rnd = random.Random(7)
    cols = [RED, YELLOW, GREEN, ORANGE, PURPLE]
    spots = [(0.0, 0.47, 0.06), (-0.14, 0.43, 0.1), (0.14, 0.44, 0.08), (-0.07, 0.4, 0.22), (0.09, 0.39, 0.24),
             (-0.26, 0.37, 0.12), (0.27, 0.37, 0.1), (-0.2, 0.36, -0.08), (0.2, 0.37, -0.1), (0.0, 0.42, -0.12),
             (-0.31, 0.35, 0.25), (0.32, 0.35, 0.24), (0.0, 0.36, 0.33), (-0.08, 0.53, -0.02)]
    loops = []
    for k, (x, y, z) in enumerate(spots):
        tilt = rnd.uniform(-60, -38)
        p.ring((x, y, z), 0.062, 0.032, rot=(tilt, rnd.uniform(-30, 30), rnd.uniform(-25, 25)), seg=20, rseg=10)
        loops.append((Vector((x, y, z)), cols[k % 5]))
    for c in cols[1:]:
        p.paint_fn(lambda q, n, c=c: min(loops, key=lambda L: (q - L[0]).length)[1] == c, c)
    p.paint_fn(lambda q, n: min(loops, key=lambda L: (q - L[0]).length)[1] == RED, RED)
    # spoon resting on the rim, handle out to the right
    spoon(p, (0.16, 0.37, 0.06), (0.5, 0.78, 0.1), up=(-0.4, 0.75, 0.4), size=1.1)
    p.layer('skin')
    finish(p, 1.02, 0.79)          # measured bounds (x width, height)


def soup():
    p = FoodProp('prop_word_soup', base=GREEN, target_faces=300, voxel=0.01, smooth=3)
    rim = bowl(p, 0.5, 0.3, GREEN, tf=600)
    # two ear handles, one each side
    for s in (-1, 1):
        p.ring((s * 0.49, 0.24, 0), 0.085, 0.034, rot=(90, 0, 0), a0=-0.35 + (0 if s > 0 else math.pi), a1=math.pi + 0.35 + (0 if s > 0 else math.pi), seg=24, rseg=10)
    p.layer('soup', base=0xff6a3d, target_faces=300, voxel=0.01)
    p.lathe(rounded([(0, 0.22), (0.43, 0.22), (0.44, 0.31), (0.4, 0.345), (0.22, 0.378), (0, 0.386)], 0.03, n=3), seg=40)
    p.paint_fn(lambda q, n: n.y > 0.85 and rxz(q) < 0.08, light(0xff6a3d, 0.25))
    # a white cream swirl on top
    p.layer('swirl', base=WHITE, target_faces=300, voxel=0.006)
    sw = []
    for k in range(26):
        t = k / 25
        a = t * 1.7 * TAU
        r = 0.03 + 0.2 * t
        sw.append((r * math.sin(a) - 0.04, 0.39 - 0.02 * t * t, r * math.cos(a) * 0.9 + 0.04))
    p.tube(sw, [0.022 + 0.008 * math.sin(math.pi * k / 25) for k in range(26)], rseg=8)
    # three fat steam curls (bones steam.1-3 sway them)
    p.layer('steam', base=WHITE, target_faces=550, voxel=0.008)
    curls = [(-0.2, -0.05, 0.78, 1), (0.02, 0.02, 0.92, -1), (0.22, -0.06, 0.76, 1)]
    for k, (x0, z0, top, s) in enumerate(curls):
        pts = [(x0 + s * 0.05 * math.sin(t * 2.6 * math.pi), 0.42 + (top - 0.42) * t, z0) for t in [i / 10 for i in range(11)]]
        p.curve(pts, [0.045 - 0.022 * (i / 10) for i in range(11)], group='st%d' % k, per=2)
    spoon(p, (0.15, 0.38, 0.12), (0.47, 0.8, 0.18), up=(-0.4, 0.75, 0.4), size=1.1)
    p.layer('skin')
    issteam = [lambda q, x0=c[0], z0=c[1]: q.y > 0.4 and abs(q.x - x0) < 0.1 and abs(q.z - z0) < 0.1 for c in curls]
    p.bone('body', (0, 0, 0), (0, 0.35, 0), region=lambda q: not any(f(q) for f in issteam))
    for k, (x0, z0, top, s) in enumerate(curls):
        p.bone('steam.%d' % (k + 1), (x0, 0.4, z0), (x0, top, z0), parent='body', region=issteam[k])
    finish(p, 1.19, 0.93)          # measured bounds (x width, height)


def pasta():
    p = FoodProp('prop_word_pasta', base=YELLOW, target_faces=300, voxel=0.01, smooth=3)
    rim = bowl(p, 0.5, 0.3, YELLOW, tf=600)
    # ten big bow ties heaped up over the rim: each a slab pinched tight in the middle, crinkly ends, a knot
    PASTA = 0xf9de88
    p.layer('bows', base=PASTA, target_faces=1050, voxel=0.006)
    sc = 1.2
    wing = [(0.0, 0.018), (0.04, 0.045), (0.09, 0.07)] + [(0.125 - 0.014 * (k % 2), 0.07 - 0.0175 * k) for k in range(9)] + [(0.09, -0.07), (0.04, -0.045), (0.0, -0.018)]
    outline = wing + [(-x, -y) for x, y in wing[1:-1]]
    outline = [(x * sc, y * sc) for x, y in (q[:2] for q in rounded(outline, 0.01, n=2, closed=True))]
    v0, f0 = slab_mesh(outline, -0.02, 0.02, 0.012, seg=2)
    v0 = [(x, y, z + 1.4 * x * x) for x, y, z in v0]          # wings lifted a little: a bow tie is never flat
    rnd = random.Random(3)
    spots = [(0.0, 0.56, -0.02, -62), (-0.2, 0.5, -0.06, -66), (0.2, 0.51, -0.07, -64), (-0.1, 0.46, 0.17, -58),
             (0.13, 0.45, 0.16, -60), (-0.33, 0.4, 0.06, -55), (0.33, 0.41, 0.04, -55), (-0.0, 0.4, 0.31, -40),
             (-0.24, 0.38, 0.28, -42), (0.24, 0.38, 0.27, -44)]
    bows = []
    for k, (x, y, z, tilt) in enumerate(spots):
        R = rot_m((tilt, rnd.uniform(-25, 25), rnd.uniform(-30, 30)))
        c = Vector((x, y, z))
        p.mesh([tuple(R @ Vector(v) + c) for v in v0], f0)
        p.blob(tuple(c + R @ Vector((0, 0, 0.014))), (0.026, 0.034, 0.03), group='k%d' % k)
        bows.append((c, R.inverted()))

    def local(q):
        c, Ri = min(bows, key=lambda b: (q - b[0]).length)
        return Ri @ (q - c)
    # the pinched middle is a deeper golden colour, so every piece reads as a bow
    p.paint_fn(lambda q, n: abs(local(q).x) < 0.028 * sc, mix(PASTA, ORANGE, 0.45))
    p.paint_fn(lambda q, n: n.y < -0.5, dark(PASTA, 0.12))
    # the sauce: a soft red dollop over the top with two runs, one basil leaf
    p.layer('sauce', base=RED, target_faces=380, voxel=0.007)
    p.blob((0.0, 0.64, 0.04), (0.15, 0.065, 0.13), group='sa')
    p.blob((-0.08, 0.62, 0.11), (0.08, 0.05, 0.07), group='sa')
    p.blob((0.1, 0.625, -0.02), (0.08, 0.05, 0.08), group='sa')
    p.capsule((0.1, 0.62, 0.12), (0.15, 0.54, 0.19), 0.036, group='run1', r2=0.032)
    p.paint_fn(lambda q, n: n.y > 0.6 and q.y > 0.685 and q.x < -0.02 and q.z > 0.02, light(RED, 0.4))
    p.layer('leaf', base=GREEN, target_faces=140, voxel=0.005)
    p.blob((0.03, 0.71, 0.05), (0.055, 0.017, 0.095), rot=(-25, 35, 0), group='lf')
    p.paint_fn(lambda q, n: abs((q.x - 0.03) * math.cos(math.radians(35)) - (q.z - 0.05) * math.sin(math.radians(35))) < 0.007, LEAF)
    p.layer('skin')
    finish(p, 1.00, 0.75)          # measured bounds (x width, height)


def noodles():
    p = FoodProp('prop_word_noodles', base=RED, target_faces=300, voxel=0.01, smooth=3)
    rim = bowl(p, 0.5, 0.3, RED, tf=600)
    NOOD = 0xf9e7b8
    p.layer('broth', base=0xffd39a, target_faces=200, voxel=0.01)
    p.lathe(rounded([(0, 0.22), (0.43, 0.22), (0.44, 0.31), (0.38, 0.325), (0, 0.33)], 0.03, n=3), seg=40)
    # a tangle of long fat noodles heaped over the rim
    p.layer('noodles', base=NOOD, target_faces=1700, voxel=0.006)
    rnd = random.Random(11)
    for k in range(9):
        a0 = rnd.uniform(0, TAU)
        pts = []
        for i in range(14):
            t = i / 13
            a = a0 + t * 2.4
            r = 0.36 * math.sin(math.pi * (0.1 + 0.8 * t)) * rnd.uniform(0.85, 1.0)
            y = 0.34 + 0.12 * math.sin(math.pi * t) * (1 - r / 0.45) + 0.02 * math.sin(t * 9 + k)
            pts.append((r * math.sin(a), y, r * math.cos(a)))
        p.tube(pts, 0.03, rseg=10)
    # two noodles lifted high on the fork, hanging back down into the bowl in soft waves
    F = Vector((0.06, 0.9, 0.12))      # tine tips
    for s in (-1, 1):
        pts = []
        for i in range(13):
            t = i / 12
            pts.append((F.x + s * 0.025 + 0.035 * math.sin(t * 3.5 * math.pi) * s - 0.05 * t, F.y + 0.03 - (F.y - 0.38) * t, F.z + 0.02 + 0.04 * t))
        p.tube(pts, 0.03, rseg=10)
    p.paint_fn(lambda q, n: n.y > 0.75 and q.y > 0.45 and q.y < 0.5, light(NOOD, 0.5))
    # the fork: grey metal, one white band, four fat tines pointing down into the noodles
    p.layer('forkmetal', base=GREY, target_faces=650, voxel=0.006)
    for i in range(4):
        x = F.x - 0.06 + 0.04 * i
        p.capsule((x, F.y, F.z), (x, F.y + 0.12, F.z), 0.016, group='t%d' % i)
    p.box((F.x, F.y + 0.15, F.z), (0.085, 0.045, 0.022), bevel=0.02)
    H1, H2 = Vector((F.x, F.y + 0.19, F.z)), Vector((F.x + 0.16, F.y + 0.5, F.z - 0.04))
    p.tube([tuple(H1.lerp(H2, t)) for t in (0, 0.25, 0.5, 0.75, 1.0)], [0.022, 0.025, 0.03, 0.034, 0.034], rseg=12)
    p.blob(tuple(H2), (0.036, 0.036, 0.036), group='hend')
    p.paint_fn(lambda q, n: q.y > F.y + 0.25 and n.x < -0.3 and n.z > 0.3, WHITE)
    # noodles wrapped round the tines (a fat twist hiding the tine roots)
    p.layer('wrap', base=NOOD, target_faces=300, voxel=0.006)
    p.ring((F.x, F.y + 0.07, F.z), 0.075, 0.03, rot=(0, 0, 8), seg=24, rseg=10)
    p.ring((F.x, F.y + 0.02, F.z), 0.072, 0.03, rot=(0, 0, -6), seg=24, rseg=10)
    p.layer('skin')
    isfork = lambda q: q.y > 0.56 and rxz(q, (F.x, F.z)) < 0.3
    p.bone('body', (0, 0, 0), (0, 0.4, 0), region=lambda q: not isfork(q))
    p.bone('fork', (F.x, 0.6, F.z), (H2.x, H2.y, H2.z), parent='body', region=isfork)
    finish(p, 1.00, 1.43)          # measured bounds (x width, height)


def pizza():
    p = FoodProp('prop_word_pizza', base=0xfbe0a8, target_faces=450, voxel=0.008, smooth=3)
    # a fat slice, point toward the child; the crust end is propped up so the topping faces the camera
    tilt = 50
    M = rot_m((tilt, 0, 0))
    TY = 0.48 * math.sin(math.radians(tilt)) - 0.028       # the tip touches y 0
    L = lambda v: M @ Vector(v) + Vector((0, TY, 0))
    tri = [(0.0, 0.48)] + [(0.36 * math.sin(a), -0.28 + 0.06 * math.cos(a) - 0.06) for a in [math.radians(x) for x in range(40, -41, -10)]]
    tri = [q[:2] for q in rounded(tri, 0.06, n=3, closed=True)]
    half_w = lambda z: 0.231 * (0.48 - z) / 0.82
    Mf = M @ Matrix(((1, 0, 0), (0, 0, 1), (0, -1, 0)))        # local slab (x, y, z) -> game (x, z_up, -y), then tilted
    v, f = slab_mesh([(x, -z) for x, z in tri], -0.03, 0.03, 0.025, seg=2)
    p.mesh(xform(v, Mf, (0, TY, 0)), f)
    # the crust: a puffy tan roll along the back arc
    p.layer('crust', base=TAN, target_faces=450, voxel=0.007)
    arcp = [(0.4 * math.sin(a), 0.03, -0.32 + 0.065 * math.cos(a) - 0.06) for a in [math.radians(x) for x in range(-46, 47, 8)]]
    p.tube([tuple(L(q)) for q in arcp], [0.06, 0.075, 0.08, 0.082, 0.082, 0.082, 0.082, 0.082, 0.082, 0.08, 0.075, 0.06], rseg=12)
    p.paint_fn(lambda q, n: n.dot(Vector((0, 0.6, -0.8))) > 0.5, mix(TAN, WOOD, 0.45))   # baked top of the crust
    # the cheese: on top, its two long edges hanging in fat wavy drips
    p.layer('cheese', base=YELLOW, target_faces=600, voxel=0.006)
    ct = [(0.0, 0.43)] + [(0.33 * math.sin(a), -0.26 + 0.05 * math.cos(a) - 0.06) for a in [math.radians(x) for x in range(38, -39, -12)]]
    ct = [q[:2] for q in rounded(ct, 0.05, n=3, closed=True)]
    v, f = slab_mesh([(x, -z) for x, z in ct], 0.025, 0.06, 0.016, seg=2)
    p.mesh(xform(v, Mf, (0, TY, 0)), f)
    for k, (side, z, ln) in enumerate([(-1, -0.2, 0.06), (-1, 0.05, 0.09), (-1, 0.27, 0.05), (1, -0.12, 0.08), (1, 0.15, 0.06)]):
        x = side * (half_w(z) - 0.035)
        base = L((x, 0.04, z))
        p.capsule(tuple(base), tuple(base + Vector((side * 0.025, -ln, 0.015))), 0.028, group='d%d' % k, r2=0.026)
    p.paint_fn(lambda q, n: n.y > 0.5 and n.z > 0.5 and q.x < -0.04 and abs(q.x + q.z * 0.3) < 0.06, light(YELLOW, 0.5))
    # three pepperoni and two green pepper bits
    p.layer('pepperoni', base=RED, target_faces=300, voxel=0.005)
    for (x, z) in ((-0.1, -0.16), (0.1, -0.16), (0.0, 0.1)):
        p.cyl(tuple(L((x, 0.05, z))), 0.072, 0.03, rot=(tilt, 0, 0), bevel=0.012, seg=24)
    p.layer('peppers', base=GREEN, target_faces=200, voxel=0.005)
    for (x, z, a) in ((0.07, -0.02, 30), (-0.075, -0.03, -40), (0.0, 0.27, 0)):
        c = L((x, 0.075, z))
        R = M @ rot_m((0, a, 0))
        pts = [tuple(c + R @ Vector((0.038 * math.cos(t), 0, 0.038 * math.sin(t)))) for t in [math.radians(d) for d in range(-110, 111, 30)]]
        p.tube(pts, 0.017, rseg=8)
    p.layer('skin')
    finish(p, 0.56, 0.69)          # measured bounds (x width, height)


def sausage():
    p = FoodProp('prop_word_sausage', base=WHITE, target_faces=200, voxel=0.01, smooth=3)
    well = plate(p, 0.52, tf=360)
    SAUS = 0xd2643f
    RR = [0.088, 0.108, 0.116, 0.118, 0.118, 0.118, 0.116, 0.108, 0.088]
    # the front one lies on the plate; the second rests across the top of it, so both sausages read from the front.
    # Each is its own layer (an ink line between them), with hard-edged grill bars and one glossy band in its own frame.
    lay = [(-0.05, 0.1, 0.0, 8), (0.07, -0.04, 0.17, -14)]
    for k, (dx, z, lift, yaw) in enumerate(lay):
        p.layer('sausage%d' % k, base=SAUS, target_faces=680, voxel=0.006)
        Ry = rot_m((0, yaw, 0))
        o = Vector((dx, well + 0.106 + lift, z))
        pts = []
        for i in range(9):
            t = i / 8
            pts.append(tuple(Ry @ Vector((-0.4 + 0.8 * t, 0.025 * math.sin(math.pi * t), 0.08 * math.sin(math.pi * t))) + Vector((dx, well + RR[i] - 0.012 + lift, z))))
        p.curve(pts, RR, group='s', per=3)
        for e, (q0, q1) in enumerate(((pts[0], pts[1]), (pts[-1], pts[-2]))):
            dd = (Vector(q0) - Vector(q1)).normalized()
            p.capsule(tuple(Vector(q0) + dd * 0.06), tuple(Vector(q0) + dd * 0.1), 0.026, group='k%d' % e)
            p.blob(tuple(Vector(q0) + dd * 0.12), (0.042, 0.042, 0.042), group='k%d' % e)
        Ri = Ry.inverted()
        loc = lambda q, o=o, Ri=Ri: Ri @ (q - o)
        p.paint_fn(lambda q, n, loc=loc: n.y + n.z > 0.5 and (lambda l: abs(l.x) < 0.3 and ((l.x + 0.5 * l.y + 0.1) % 0.2) < 0.052)(loc(q)), dark(SAUS, 0.26))
        p.paint_fn(lambda q, n, loc=loc: n.dot(Vector((0, 0.62, 0.78))) > 0.975 and abs(loc(q).x + 0.04) < 0.2, light(SAUS, 0.5))
    p.layer('skin')
    finish(p, 1.20, 0.51)          # measured bounds (x width, height)


def chips():
    p = FoodProp('prop_word_chips', base=RED, target_faces=700, voxel=0.009, smooth=3)
    prof = rounded([(0, 0), (0.2, 0), (0.22, 0.03), (0.3, 0.5), (0.31, 0.54), (0, 0.54)], 0.035, n=3)
    p.lathe(prof, scale=(1, 0.62), seg=48)
    p.paint_fn(lambda q, n: 0.2 < q.y < 0.3 and n.y < 0.5, WHITE)
    p.paint_fn(lambda q, n: q.y < 0.04 and n.y < 0.0, dark(RED, 0.15))
    # nine chunky chips standing at different heights, fanning out of the box
    p.layer('chips', base=YELLOW, target_faces=1100, voxel=0.007)
    rnd = random.Random(5)
    spots = [(-0.2, -0.03, 0.62, -14), (-0.1, -0.07, 0.76, -6), (0.0, -0.05, 0.82, 2), (0.1, -0.07, 0.74, 8),
             (0.2, -0.03, 0.64, 15), (-0.15, 0.08, 0.66, -10), (-0.04, 0.09, 0.7, -3), (0.07, 0.09, 0.68, 5), (0.17, 0.07, 0.6, 12)]
    for k, (x, z, top, a) in enumerate(spots):
        hh = (top - 0.3) / 2
        c = Vector((x, 0.3 + hh, z))
        p.box(tuple(c), (0.048, hh, 0.048), rot=(rnd.uniform(-8, 8), rnd.uniform(-25, 25), -a), bevel=0.03)
    p.paint_fn(lambda q, n: n.y > 0.6 and q.y > 0.56, light(YELLOW, 0.45))
    p.layer('skin')
    finish(p, 0.58, 0.81)          # measured bounds (x width, height)


def pancake():
    p = FoodProp('prop_word_pancake', base=WHITE, target_faces=200, voxel=0.01, smooth=3)
    well = plate(p, 0.45, tf=500)
    # three pillowy pancakes, each its own layer so an ink line separates them: golden sides, a browned face
    T = 0.115
    tops = []
    GOLD = mix(TAN, WOOD, 0.35)
    for k, (dx, dz, r) in enumerate([(0.0, 0.0, 0.37), (0.035, -0.01, 0.355), (-0.025, 0.015, 0.36)]):
        p.layer('pancake%d' % k, base=GOLD, target_faces=340, voxel=0.008)
        y0 = well + k * (T - 0.006)
        e = T / 2
        prof = [(0, y0)] + [(r - e + e * math.cos(a), y0 + e - e * math.sin(a)) for a in [math.radians(d) for d in range(-90, 91, 20)]] + [(0, y0 + T)]
        p.lathe(prof, pos=(dx, 0, dz), seg=48)
        p.paint_fn(lambda q, n: n.y > 0.55, BROWN)
        p.paint_fn(lambda q, n: n.y < -0.6, mix(GOLD, BROWN, 0.5))
        tops.append(y0 + T)
    # the syrup puddle on top running over two sides, the butter square
    p.layer('syrup', base=ORANGE, target_faces=550, voxel=0.007)
    top = tops[-1]
    p.cyl((-0.01, top - 0.006, 0.01), 0.27, 0.026, bevel=0.012, seg=40)
    for (a, ln) in ((0.55, 0.2), (0.9, 0.12), (-0.95, 0.24), (-0.45, 0.1)):
        x, z = 0.355 * math.sin(a), 0.355 * math.cos(a)
        p.capsule((x * 0.72, top + 0.01, z * 0.72), (x * 1.02, top - 0.012, z * 1.02), 0.04, group='lip%.2f' % a)
        p.capsule((x * 1.04, top - 0.012, z * 1.04), (x * 1.05, top - ln, z * 1.05), 0.035, group='run%.2f' % a, r2=0.03)
        p.blob((x * 1.05, top - ln - 0.01, z * 1.05), (0.037, 0.042, 0.037), group='run%.2f' % a)
    p.paint_fn(lambda q, n: n.y > 0.8 and q.x < -0.06 and q.z > 0.04 and rxz(q) < 0.2, light(ORANGE, 0.45))
    p.layer('butter', base=YELLOW, target_faces=250, voxel=0.006)
    p.box((0.03, top + 0.07, 0.02), (0.09, 0.058, 0.09), rot=(0, 25, 0), bevel=0.03)
    p.paint_fn(lambda q, n: n.y > 0.6, light(YELLOW, 0.5))
    p.layer('skin')
    finish(p, 0.85, 0.52)          # measured bounds (x width, height)


def cake():
    p = FoodProp('prop_word_cake', base=SKY, target_faces=800, voxel=0.01, smooth=3)
    # the stand: a plate on a short pedestal
    sp = rounded([(0, 0), (0.24, 0), (0.25, 0.03), (0.1, 0.07), (0.08, 0.16), (0.12, 0.2), (0.56, 0.22), (0.58, 0.26),
                  (0.55, 0.275), (0, 0.255)], 0.02, n=3)
    p.lathe(sp, seg=56)
    p.paint_fn(lambda q, n: q.y > 0.255 and rxz(q) > 0.5, WHITE)
    B = 0.255
    R, Hs = 0.44, 0.36                    # sponge radius / height (two layers + a jam line)
    ac, aw = math.radians(28), math.radians(46)
    gap0, gap1 = ac - aw / 2, ac + aw / 2
    pull = Vector((math.sin(ac), 0, math.cos(ac))) * 0.16
    sponge = rounded([(0, 0), (R, 0), (R, Hs), (0, Hs)], 0.03, n=3)
    # sponge (CREAM), the main cake and the pulled-out wedge
    p.layer('sponge', base=CREAM, target_faces=900, voxel=0.008)
    p.lathe(sponge, pos=(0, B, 0), a0=gap1, a1=gap0 + TAU, seg=48)
    p.lathe(sponge, pos=(pull.x, B + 0.005, pull.z), a0=gap0, a1=gap1, seg=10)

    def cutface(q, n):
        return abs(n.y) < 0.4 and abs(n.dot(Vector((math.sin(ang(q)), 0, math.cos(ang(q)))))) < 0.5
    p.paint_fn(lambda q, n: cutface(q, n) and B + 0.155 < q.y < B + 0.205, RED)        # jam
    p.paint_fn(lambda q, n: cutface(q, n) and (B + 0.13 < q.y <= B + 0.155 or B + 0.205 <= q.y < B + 0.23), WHITE)  # cream
    # pink icing: a cap over the top with drips down the side
    p.layer('icing', base=PINK, target_faces=1300, voxel=0.007)
    cap = rounded([(0, Hs - 0.01), (R + 0.015, Hs - 0.01), (R + 0.02, Hs + 0.035), (0, Hs + 0.045)], 0.02, n=3)
    p.lathe(cap, pos=(0, B, 0), a0=gap1 + 0.02, a1=gap0 - 0.02 + TAU, seg=48)
    p.lathe(cap, pos=(pull.x, B + 0.005, pull.z), a0=gap0 + 0.02, a1=gap1 - 0.02, seg=10)
    rnd = random.Random(2)
    drips = []
    a = gap1 + 0.2
    while a < gap0 + TAU - 0.15:
        drips.append((a, rnd.choice((0.09, 0.14, 0.18, 0.11)), (0, 0)))
        a += rnd.uniform(0.42, 0.56)
    drips.append((ac, 0.13, (pull.x, pull.z)))
    for k, (a, ln, off) in enumerate(drips):
        x, z = (R + 0.01) * math.sin(a) + off[0], (R + 0.01) * math.cos(a) + off[1]
        y0 = B + Hs + 0.02
        p.capsule((x, y0, z), (x, y0 - ln, z), 0.042, group='dr%d' % k, r2=0.036)
        p.blob((x, y0 - ln - 0.005, z), (0.044, 0.046, 0.04), group='dr%d' % k)
    p.paint_fn(lambda q, n: n.y > 0.8 and -0.35 < q.x < -0.1 and q.z > -0.1 and q.z < 0.15, light(PINK, 0.45))
    # cream dollops round the top edge
    p.layer('cream', base=WHITE, target_faces=900, voxel=0.006)
    top = B + Hs + 0.04
    dl = []
    a = gap1 + 0.25
    while a < gap0 + TAU - 0.2:
        dl.append((a, (0, 0)))
        a += 0.62
    dl.append((ac, (pull.x, pull.z)))
    for k, (a, off) in enumerate(dl):
        x, z = 0.33 * math.sin(a) + off[0], 0.33 * math.cos(a) + off[1]
        p.blob((x, top + 0.03, z), (0.06, 0.04, 0.06), group='c%d' % k)
        p.blob((x, top + 0.075, z), (0.035, 0.035, 0.035), group='c%d' % k)
        p.blob((x, top + 0.105, z), (0.013, 0.02, 0.013), group='c%d' % k)
    # the cherry (with a shine and a stalk) and the striped candle with its flame
    p.layer('cherry', base=RED, target_faces=300, voxel=0.006)
    ch = Vector((-0.13, top + 0.07, 0.08))
    p.blob(tuple(ch), (0.075, 0.07, 0.075), group='ch')
    p.paint_fn(lambda q, n: n.dot(Vector((-0.5, 0.6, 0.62)).normalized()) > 0.9, light(RED, 0.55))
    p.layer('stalk', base=LEAF, target_faces=120, voxel=0.005)
    p.tube([tuple(ch + Vector(v)) for v in ((0, 0.05, 0), (0.01, 0.1, -0.01), (0.04, 0.15, -0.02))], 0.012, rseg=8)
    p.layer('candle', base=WHITE, target_faces=300, voxel=0.006)
    cx, cz = 0.06, -0.06
    p.cyl((cx, top - 0.02, cz), 0.034, 0.3, bevel=0.012, seg=20)
    p.paint_fn(lambda q, n: ((q.y - top + q.x * 0.7) % 0.06) < 0.028, BLUE)
    p.layer('wick', base=INK, target_faces=60, voxel=0.004)
    p.capsule((cx, top + 0.275, cz), (cx, top + 0.31, cz), 0.009, group='w')
    p.layer('candleflame', base=YELLOW, target_faces=240, voxel=0.005)
    fl = Vector((cx, top + 0.36, cz))
    p.blob(tuple(fl), (0.04, 0.05, 0.035), group='f')
    p.blob(tuple(fl + Vector((0, 0.05, 0))), (0.022, 0.04, 0.02), group='f')
    p.blob(tuple(fl + Vector((0, 0.09, 0))), (0.008, 0.016, 0.008), group='f')
    p.paint_fn(lambda q, n: q.y < fl.y - 0.012, ORANGE)
    p.layer('skin')
    isflame = lambda q: q.y > top + 0.32 and rxz(q, (cx, cz)) < 0.07
    p.bone('body', (0, 0, 0), (0, 0.5, 0), region=lambda q: not isflame(q))
    p.bone('flame', (cx, top + 0.31, cz), (cx, top + 0.46, cz), parent='body', region=isflame)
    finish(p, 1.07, 1.08)          # measured bounds (x width, height)


def popcorn():
    p = FoodProp('prop_word_popcorn', base=WHITE, target_faces=900, voxel=0.009, smooth=3)
    prof = rounded([(0, 0), (0.22, 0), (0.235, 0.03), (0.31, 0.5), (0.335, 0.53), (0.32, 0.56), (0.29, 0.55), (0, 0.5)], 0.025, n=3)
    p.lathe(prof, seg=48)
    p.paint_fn(lambda q, n: (math.floor((ang(q) + TAU) / (TAU / 14)) % 2 == 0) and q.y < 0.515 and n.y < 0.6, RED)
    p.paint_fn(lambda q, n: q.y < 0.03 and n.y < 0, GREY)
    # about twenty puffy kernels heaped up over the rim (each a little cloud of 3-4 lumps)
    PC = 0xfbe9b4
    p.layer('corn', base=PC, target_faces=1900, voxel=0.007)
    rnd = random.Random(9)
    pts = []
    for ring, (r, y, n) in enumerate([(0.0, 0.84, 1), (0.13, 0.78, 5), (0.24, 0.66, 7), (0.31, 0.57, 8)]):
        for j in range(n):
            a = j / n * TAU + ring * 0.5 + rnd.uniform(-0.15, 0.15)
            pts.append(Vector((r * math.sin(a), y + rnd.uniform(-0.02, 0.02), r * math.cos(a))))

    def kernel(c, k, s=1.0):
        for i in range(4):
            off = Vector((rnd.uniform(-1, 1), rnd.uniform(-0.6, 1), rnd.uniform(-1, 1))).normalized() * 0.045 * s
            rr = rnd.uniform(0.042, 0.055) * s
            p.blob(tuple(c + off), (rr, rr * 0.92, rr), group='k%d' % k)
        p.blob(tuple(c), (0.05 * s, 0.045 * s, 0.05 * s), group='k%d' % k)
    for k, c in enumerate(pts):
        kernel(c, k)
    p.blob((0, 0.6, 0), (0.27, 0.12, 0.27), group='heap')
    p.paint_fn(lambda q, n: n.y < -0.5 and rxz(q) < 0.08, YELLOW)
    # two kernels popping up above (pop.1, pop.2)
    p.layer('popped', base=PC, target_faces=360, voxel=0.006)
    P1, P2 = Vector((-0.17, 1.08, 0.06)), Vector((0.15, 1.2, -0.02))
    kernel(P1, 90, 0.95)
    kernel(P2, 91, 0.9)
    p.paint_fn(lambda q, n: n.y < -0.6, YELLOW)
    p.layer('skin')
    ispop = lambda c: (lambda q: (q - c).length < 0.13)
    p.bone('body', (0, 0, 0), (0, 0.6, 0), region=lambda q: q.y < 0.97)
    p.bone('pop.1', tuple(P1 - Vector((0, 0.08, 0))), tuple(P1 + Vector((0, 0.08, 0))), parent='body', region=ispop(P1))
    p.bone('pop.2', tuple(P2 - Vector((0, 0.08, 0))), tuple(P2 + Vector((0, 0.08, 0))), parent='body', region=ispop(P2))
    finish(p, 0.78, 1.27)          # measured bounds (x width, height)


def chocolate():
    p = FoodProp('prop_word_chocolate', base=BROWN, target_faces=1000, voxel=0.007, smooth=3)
    p.hard()
    S, T = 0.17, 0.05                    # square size, slab half-thickness
    W, Hh = S * 2, S * 4
    # the slab and eight pillowy squares standing up on the front
    slab(p, [q[:2] for q in rounded([(-W / 2, 0), (W / 2, 0), (W / 2, Hh), (-W / 2, Hh)], 0.045, n=2, closed=True)], -T, T * 0.6, 0.03, seg=2)
    for i in range(2):
        for j in range(4):
            x0, y0 = -W / 2 + i * S + 0.022, j * S + 0.022
            sq = [q[:2] for q in rounded([(x0, y0), (x0 + S - 0.044, y0), (x0 + S - 0.044, y0 + S - 0.044), (x0, y0 + S - 0.044)], 0.045, n=2, closed=True)]
            slab(p, sq, 0.0, T + 0.02, 0.035, seg=1)
    # the bite: a big round mouthful with three tooth scallops, out of the top-right corner
    C = Vector((W / 2 + 0.03, Hh + 0.03, 0))
    cuts = [(tuple(C), 0.13)]
    for a in (192, 228, 262):
        v = C + Vector((math.cos(math.radians(a)), math.sin(math.radians(a)), 0)) * 0.12
        cuts.append((tuple(v), 0.062))
    p.layers['skin']['cuts'] = cuts
    p.paint_fn(lambda q, n: n.z < 0.5, dark(BROWN, 0.22))
    p.paint_fn(lambda q, n: n.z > 0.5 and n.y > 0.3 and q.z > T, light(BROWN, 0.3))
    # the purple foil round the lower half with a yellow band; its front is peeled down and rolled into a curl
    # (the silver inside of the foil shows on the curl)
    p.layer('foil', base=PURPLE, target_faces=550, voxel=0.007)
    fh, fw = Hh * 0.48, W / 2 + 0.022
    back = [q[:2] for q in rounded([(-fw, 0), (fw, 0), (fw, fh), (-fw, fh)], 0.03, n=2, closed=True)]
    slab(p, back, -T - 0.02, 0.0, 0.02, seg=2)
    front = [q[:2] for q in rounded([(-fw, 0), (fw, 0), (fw, fh - 0.075), (-fw, fh - 0.075)], 0.03, n=2, closed=True)]
    slab(p, front, -0.01, T + 0.035, 0.02, seg=2)
    curl = [(x, fh - 0.06, T + 0.065) for x in [-fw - 0.008 + (2 * fw + 0.016) * k / 8 for k in range(9)]]
    p.tube(curl, 0.042, rseg=14)
    p.paint_fn(lambda q, n: 0.09 < q.y < 0.17 and q.z > -T - 0.03 and not (q.z > T + 0.02 and q.y > fh - 0.11), YELLOW)
    p.paint_fn(lambda q, n: q.y > fh - 0.1 and q.z > T + 0.02 and (n.y > 0.2 or n.z < -0.2), GREY)
    p.layer('skin')
    finish(p, 0.39, 0.68)          # measured bounds (x width, height)


def jelly():
    p = FoodProp('prop_word_jelly', base=WHITE, target_faces=200, voxel=0.01, smooth=3)
    well = plate(p, 0.5, tf=500)
    p.layer('jelly', base=RED, target_faces=1500, voxel=0.007)
    prof = rounded([(0, well), (0.38, well), (0.39, well + 0.13), (0.32, well + 0.2), (0.32, well + 0.33), (0.27, well + 0.39),
                    (0.265, well + 0.5), (0.2, well + 0.6), (0.08, well + 0.645), (0, well + 0.65)], 0.04, n=4)
    PH = 0.39

    def flute(a, r, y):
        return r * (1 + 0.12 * math.cos(8 * a + PH)), y
    revolve(p, prof, flute, seg=96)
    # the flute valleys a deeper red so the eight lobes read from the front; one white highlight band (see-through)
    p.paint_fn(lambda q, n: math.cos(8 * ang(q) + PH) < -0.55 and q.y > well + 0.01, dark(RED, 0.2))
    p.paint_fn(lambda q, n: -1.0 < ang(q) < -0.66 and well + 0.14 < q.y < well + 0.56 and n.z > -0.2 and math.cos(8 * ang(q) + PH) > -0.3, WHITE)
    p.paint_fn(lambda q, n: n.y < -0.5, dark(RED, 0.25))
    p.layer('skin')
    isj = lambda q: q.y > well + 0.05 and rxz(q) < 0.43           # the jelly only: the plate rim never wobbles
    p.bone('body', (0, 0, 0), (0, well + 0.1, 0), region=lambda q: not (isj(q) and q.y > well + 0.12))
    p.bone('tail.1', (0, well + 0.1, 0), (0, well + 0.36, 0), parent='body', region=lambda q: isj(q) and q.y > well + 0.08)
    p.bone('tail.2', (0, well + 0.36, 0), (0, well + 0.66, 0), parent='tail.1', region=lambda q: isj(q) and q.y > well + 0.28)
    finish(p, 0.94, 0.70)          # measured bounds (x width, height)


def juice():
    p = FoodProp('prop_word_juice', base=ORANGE, target_faces=520, voxel=0.008, smooth=3)
    # side profile (z, y): the top slopes down toward the child; extruded along x
    side = [(-0.13, 0.0), (0.13, 0.0), (0.13, 0.5), (-0.13, 0.58)]
    side = [q[:2] for q in rounded(side, 0.06, n=3, closed=True)]
    Mx = Matrix(((0, 0, 1), (0, 1, 0), (-1, 0, 0)))   # local (a=z, b=y, c=x) -> game; local z (extrude) -> -x
    v, f = slab_mesh([(-z, y) for z, y in side], -0.19, 0.19, 0.04, seg=2)
    p.mesh(xform(v, Mx), f)
    p.paint_fn(lambda q, n: n.y > 0.7, light(ORANGE, 0.3))
    p.paint_fn(lambda q, n: q.y < 0.03, dark(ORANGE, 0.15))
    # the white front panel with an orange slice on it
    p.layer('panel', base=WHITE, target_faces=200, voxel=0.005)
    p.hard()
    pan = [q[:2] for q in rounded([(-0.14, 0.09), (0.14, 0.09), (0.14, 0.4), (-0.14, 0.4)], 0.04, n=3, closed=True)]
    slab(p, pan, 0.12, 0.142, 0.008, seg=1)
    p.layer('slice', base=0xffc27a, target_faces=220, voxel=0.004)
    sc = (0.0, 0.245)
    slab(p, [(sc[0] + x, sc[1] + y) for x, y in circle_poly(0.105, 32)], 0.13, 0.156, 0.008, seg=1)
    p.paint_fn(lambda q, n: math.hypot(q.x - sc[0], q.y - sc[1]) > 0.083, ORANGE)
    p.paint_fn(lambda q, n: math.hypot(q.x - sc[0], q.y - sc[1]) < 0.083 and (abs(math.sin(4 * math.atan2(q.y - sc[1], q.x - sc[0]))) < 0.16 or math.hypot(q.x - sc[0], q.y - sc[1]) < 0.018), WHITE)
    # the striped bendy straw
    p.layer('straw', base=WHITE, target_faces=260, voxel=0.006)
    s0 = Vector((0.08, 0.46, -0.06))
    pts = [s0 + Vector((0, 0.06 * k, 0)) for k in range(5)]
    bend = pts[-1]
    for k in range(1, 6):
        a = math.radians(14 * k)
        pts.append(bend + Vector((0.07 * (1 - math.cos(a)) * 5 / 5, 0.07 * math.sin(a), 0)) * 1.0)
    end = pts[-1]
    dvec = Vector((math.sin(math.radians(70)), math.cos(math.radians(70)), 0))
    for k in range(1, 4):
        pts.append(end + dvec * 0.055 * k)
    radii = [0.026] * 5 + [0.03, 0.025, 0.03, 0.025, 0.03] + [0.026] * 3
    p.tube([tuple(v) for v in pts], radii, rseg=12)
    p.paint_fn(lambda q, n: ((q.y * 1.0 + q.x * 0.9) % 0.07) < 0.034, RED)
    p.layer('skin')
    finish(p, 0.47, 0.84)          # measured bounds (x width, height)


def water():
    p = FoodProp('prop_word_water', base=SKY, target_faces=1000, voxel=0.008, smooth=3)
    Wl = 0.4                      # water level
    prof = rounded([(0, 0), (0.2, 0), (0.205, 0.06), (0.26, 0.6), (0.262, 0.625), (0.24, 0.63), (0.22, 0.6),
                    (0.2, Wl + 0.02), (0.19, Wl), (0, Wl)], 0.018, n=3)
    p.lathe(prof, seg=48)
    r_of = lambda y: 0.2 + 0.06 * y / 0.6
    p.paint_fn(lambda q, n: 0.06 < q.y < Wl - 0.005 and rxz(q) > r_of(q.y) - 0.02, BLUE)        # water through the glass
    p.paint_fn(lambda q, n: q.y > Wl - 0.03 and q.y < Wl + 0.01 and n.y > 0.6, light(BLUE, 0.45))  # the flat lit surface
    # glint sticker
    p.layer('glint', base=WHITE, target_faces=160, voxel=0.004)
    p.hard()
    p.sticker([q[:2] for q in rounded([(-0.02, -0.17), (0.02, -0.17), (0.02, 0.17), (-0.02, 0.17)], 0.019, n=3, closed=True)],
              0.37, r_of, thick=0.012, ang=-0.5, lift=0.004)
    p.sticker(circle_poly(0.02, 12), 0.13, r_of, thick=0.012, ang=-0.5, lift=0.004)
    # one fat drop hanging above (drop bone)
    p.layer('waterdrop', base=BLUE, target_faces=300, voxel=0.005)
    D = Vector((0.0, 0.84, 0.0))
    drop = rounded([(0, -0.075), (0.05, -0.068), (0.075, -0.035), (0.077, 0.0), (0.064, 0.045), (0.04, 0.09), (0.016, 0.13), (0, 0.15)], 0.02, n=3)
    p.lathe(drop, pos=tuple(D), seg=28)
    p.layer('dshine', base=WHITE, target_faces=60, voxel=0.004)
    p.blob(tuple(D + Vector((-0.032, 0.02, 0.058))), (0.02, 0.03, 0.012), rot=(0, -25, 15), group='s')
    p.layer('skin')
    isdrop = lambda q: q.y > 0.72
    p.bone('body', (0, 0, 0), (0, 0.5, 0), region=lambda q: not isdrop(q))
    p.bone('drop', tuple(D + Vector((0, 0.16, 0))), tuple(D - Vector((0, 0.08, 0))), parent='body', region=isdrop)
    finish(p, 0.50, 0.98)          # measured bounds (x width, height)


def ice():
    p = FoodProp('prop_word_ice', base=SKY, target_faces=900, voxel=0.008, smooth=2)
    p.hard()
    cubes = [((-0.155, 0.165, 0.0), (0, 12, 0)), ((0.16, 0.165, 0.03), (0, -10, 0)), ((0.0, 0.47, 0.01), (0, 22, -7))]
    for c, r in cubes:
        p.box(c, (0.145, 0.145, 0.145), rot=r, bevel=0.06)
    p.paint_fn(lambda q, n: 0.3 < n.y < 0.97 and q.y > 0.2, WHITE)             # lit top bevels
    p.paint_fn(lambda q, n: n.y < -0.3, mix(SKY, BLUE, 0.35))
    # a white glint stripe on the front of each cube
    for c, r in cubes:
        R = rot_m(r)
        Ri = R.inverted()
        p.paint_fn(lambda q, n, c=Vector(c), Ri=Ri: (lambda l, ln: ln.z > 0.9 and -0.1 < l.x < -0.06 and -0.02 < l.y < 0.09)(Ri @ (q - c), Ri @ n), WHITE)
    # the little melt puddle
    p.layer('puddle', base=mix(SKY, BLUE, 0.3), target_faces=300, voxel=0.006)
    p.hard()
    pp = [((0.42 + 0.05 * math.sin(3 * a) + 0.03 * math.cos(5 * a)) * math.sin(a), (0.3 + 0.04 * math.sin(2 * a + 1)) * math.cos(a)) for a in [i / 32 * TAU for i in range(32)]]
    v, f = slab_mesh([(x, -z) for x, z in pp], 0.0, 0.025, 0.01, seg=1)
    p.mesh(xform(v, Matrix(((1, 0, 0), (0, 0, 1), (0, -1, 0))), (0.0, 0.0, 0.04)), f)
    p.paint_fn(lambda q, n: n.y > 0.5 and q.x < -0.2 and q.z > 0.12, light(SKY, 0.4))
    p.layer('skin')
    finish(p, 0.88, 0.63)          # measured bounds (x width, height)


def rice():
    p = FoodProp('prop_word_rice', base=BLUE, target_faces=300, voxel=0.01, smooth=3)
    R, H = 0.42, 0.27
    rim = bowl(p, R, H, BLUE, tf=600)
    # the blue-and-white pattern: a white line under the lip and a ring of white dot stickers
    p.layer('dots', base=WHITE)
    p.hard()
    for k in range(12):
        p.sticker(circle_poly(0.032, 10), 0.14, lambda y: bowl_r(R, H, y), thick=0.012, ang=k * TAU / 12 + 0.12, lift=0.004)
    # a tall rounded dome of rice, pebbled with fat grains
    p.layer('rice', base=WHITE, target_faces=660, voxel=0.007)
    p.blob((0, H + 0.05, 0), (0.33, 0.33, 0.33), group='dome')
    rnd = random.Random(1)
    grains = []
    for k in range(130):
        u = rnd.uniform(0, TAU)
        v = math.acos(rnd.uniform(0.0, 1.0))
        dv = Vector((math.sin(v) * math.sin(u), math.cos(v), math.sin(v) * math.cos(u)))
        c = Vector((0, H + 0.05, 0)) + dv * 0.32
        rot = (rnd.uniform(0, 180), rnd.uniform(0, 180), rnd.uniform(0, 180))
        p.blob(tuple(c), (0.048, 0.026, 0.026), rot=rot, group='g%d' % k)
        grains.append((c, rot_m(rot).inverted()))
    p.paint_fn(lambda q, n: n.y < -0.3, CREAM)
    # grain marks: some grains a cream tint so the surface reads as rice, not a snowball
    marks = grains[::2]
    p.paint_fn(lambda q, n: any((lambda l: (l.x / 0.046) ** 2 + (l.y / 0.026) ** 2 + (l.z / 0.026) ** 2 < 1.2)(Ri @ (q - c)) for c, Ri in marks), mix(CREAM, TAN, 0.45))
    # three peas on top
    p.layer('peas', base=GREEN, target_faces=200, voxel=0.005)
    for k, (x, z) in enumerate(((-0.05, 0.05), (0.05, 0.06), (0.0, -0.03))):
        p.blob((x, H + 0.43, z), (0.052, 0.05, 0.052), group='p%d' % k)
    p.paint_fn(lambda q, n: n.dot(Vector((-0.4, 0.7, 0.6)).normalized()) > 0.9, light(GREEN, 0.5))
    p.layer('skin')
    finish(p, 0.82, 0.74)          # measured bounds (x width, height)


MODELS = dict(prop_word_toast=toast, prop_word_jam=jam, prop_word_honey=honey, prop_word_cereal=cereal, prop_word_soup=soup,
              prop_word_pasta=pasta, prop_word_noodles=noodles, prop_word_pizza=pizza, prop_word_sausage=sausage,
              prop_word_chips=chips, prop_word_pancake=pancake, prop_word_cake=cake, prop_word_popcorn=popcorn,
              prop_word_chocolate=chocolate, prop_word_jelly=jelly, prop_word_juice=juice, prop_word_water=water,
              prop_word_ice=ice, prop_word_rice=rice,
              # word-card variants of reused models that did not read at card size (the originals stay as they are)
              prop_word_bread=bread, prop_word_cracker=cracker, prop_word_sandwich=sandwich, prop_word_yogurt=yogurt,
              prop_word_lolly=lolly)
for name, fn in MODELS.items():
    if not ONLY or name in ONLY:
        fn()
