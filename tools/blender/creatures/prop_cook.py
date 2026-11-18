"""Cook a soup (Home world). One script, several models (ONLY=prop_ck_tomato,... builds a subset). Game space, +z faces us.
Vegetables (centred on the origin, solid all the way through so the game can slice them into pieces):
  prop_ck_tomato   a plump round tomato r ~0.42 (0.74 tall), gentle lobes, a shine and a green star calyx with a stalk
                   (layer 'calyx').
  prop_ck_potato   a lumpy golden potato lying along x (~0.9 x 0.5 x 0.62) with little dark eyes.
  prop_ck_onion    a red onion bulb r 0.36 with soft purple stripes, a dry golden neck on top (layer 'neck') and a tuft
                   of roots underneath (layer 'roots').
  prop_ck_pepper   a red bell pepper with four soft lobes (~0.74 wide, 0.8 tall) and a curly green stalk (layer 'stalk').
Tools:
  prop_ck_knife    a chunky friendly chef's knife lying in the x-y plane (blade face toward +z). Origin = the middle of the
                   cutting edge (edge along y = 0, blade x -0.66..0.6, spine at y ~0.42, round tip at -x); a straight
                   darker spine band (layer 'spine'); the wooden handle (layer 'handle', brass rivets layer 'rivets') runs
                   from x 0.66 to 1.42 (grip centre (1.04, 0.26, 0)).
  prop_ck_hob      a low cream table-top hob (2.7 x 0.12 x 1.6, bottom at y 0) with a coral front edge, a dark burner well
                   at (-0.25, -0.1) under a low pot grate (layer 'grate', pot stands at y 0.165) and one big chunky dial on
                   the top at the front right (layers 'knob', 'ridge', 'pointer', axis vertical through (0.95, 0.12, 0.5); the game spins it
                   about y) with a little lamp beside it (layer 'lamp').
  prop_ck_flame    one cartoon fire tongue (0.47 tall, slender, origin at its base, S-curving to a long point that flicks toward -x, with
                   a small side flick), orange with a yellow inner flame on its +z face (layer 'core'). The game rings a
                   dozen round the pot and flickers each.
  prop_ck_ladle    a soup ladle: a deep steel cup (r 0.2, rim at y 0, opening up) at the origin and a long handle rising
                   from its back rim toward -z at 53 degrees (to (0, 0.7, -0.75)) with a chunky coral grip and a hook end
                   (layer 'grip').
  prop_ck_block    a chunky wooden knife rest (0.48 wide, 1.0 long along z, 0.33 tall): a base and two cradle posts with
                   mint pads (layer 'slot') on top at z -0.32 and 0.28; the knife lies flat across them.
  prop_ck_spoon    a little wooden tasting spoon: oval bowl (r ~0.1) at the origin opening up, handle along +x to 0.55.
  prop_ck_step     Bear's long wooden kitchen step (6.8 x 1.0 x 1.2, top at y 1.0) that stands behind the counter.
  prop_ck_card     a recipe card on a wooden stand (0.66 tall): cream card 1.3 x 1.7 (leaning back 10 degrees) with a coral border
                   (layer 'border') and a red clip on top (layer 'clip'). Anchors row0..row3 mark the middle of each row.
  prop_ck_tick     a chunky green tick in the x-y plane (~0.42 wide), centred on the origin.
"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded, circle_poly
from skit import SProp
from mathutils import Vector, Matrix

ONLY = [s for s in os.environ.get('ONLY', '').split(',') if s]
want = lambda n: not ONLY or n in ONLY
TAU = math.tau


def sphere_mesh(p, rfn, nu=48, nv=32):
    """a closed mesh around the origin: rfn(u, v) -> point for u (0..tau round y) and v (-pi/2 bottom .. pi/2 top)"""
    verts, faces = [], []
    for j in range(1, nv):
        v = -math.pi / 2 + math.pi * j / nv
        for i in range(nu):
            verts.append(rfn(TAU * i / nu, v))
    rows = nv - 1
    for j in range(rows - 1):
        for i in range(nu):
            k = (i + 1) % nu
            faces.append((j * nu + i, j * nu + k, (j + 1) * nu + k, (j + 1) * nu + i))
    b = len(verts); verts.append(rfn(0, -math.pi / 2))
    t = len(verts); verts.append(rfn(0, math.pi / 2))
    for i in range(nu):
        k = (i + 1) % nu
        faces.append((b, k, i))
        faces.append((t, (rows - 1) * nu + i, (rows - 1) * nu + k))
    p.mesh(verts, faces)


def leaf(p, pos, axis, normal, size, group, stiff=2.0):
    """a flattened oval blob: long along axis, flat across normal"""
    yv = Vector(axis).normalized()
    zv = (Vector(normal) - yv * Vector(normal).dot(yv)).normalized()
    xv = yv.cross(zv)
    M = Matrix((xv, yv, zv)).transposed()
    e = M.to_euler('XYZ')
    p.blob(tuple(pos), size, rot=tuple(math.degrees(a) for a in e), group=group, stiffness=stiff)


def finish(p, h, outline=0.018):
    p.bone('body', (0, -h / 2, 0), (0, h / 2, 0))
    p.extras['outline'] = outline
    p.build()


# ---------------- tomato ----------------
def tomato():
    RED, RED_D, SHINE, GREEN, GREEN_D = 0xff4636, 0xe8392c, 0xfff1ea, 0x4cae47, 0x3a8f3a
    p = Prop('prop_ck_tomato', base=RED, target_faces=1500, voxel=0.01, smooth=3)
    R, RY = 0.42, 0.36

    def pt(u, v):
        top = max(0.0, math.sin(v))
        lobe = 0.5 + 0.5 * math.cos(5 * u)
        r = R * (1 - 0.045 * (1 - lobe) * (0.3 + 0.7 * top))
        y = RY * math.sin(v)
        if v > 1.1:                         # the soft dimple where the stalk sits
            y -= 0.05 * ((v - 1.1) / (math.pi / 2 - 1.1)) ** 1.5
        if v < -1.2:
            y += 0.02 * ((-v - 1.2) / 0.37)
        return (r * math.cos(v) * math.sin(u), y, r * math.cos(v) * math.cos(u))
    sphere_mesh(p, pt, nu=60, nv=40)
    # the shoulders round the stalk are a little deeper red (between the lobes)
    p.paint_fn(lambda q, n: q.y > 0.24 and abs(math.cos(5 * math.atan2(q.x, q.z))) < 0.35 and math.hypot(q.x, q.z) > 0.12, RED_D)
    p.layer('shine', base=SHINE, target_faces=200, voxel=0.006)
    p.blob((-0.2, 0.2, 0.3), (0.075, 0.045, 0.03), rot=(-30, -32, 28), group='sh')
    p.blob((-0.27, 0.11, 0.3), (0.025, 0.022, 0.02), rot=(-20, -40, 0), group='sh2')
    p.layer('calyx', base=GREEN, target_faces=900, voxel=0.007)
    top = RY - 0.05
    for k in range(5):
        a = TAU * k / 5 + 0.3
        d = Vector((math.sin(a), 0, math.cos(a)))
        for t, s in ((0.05, 0.05), (0.11, 0.042), (0.165, 0.03)):
            yy = top + 0.012 + 0.05 * (t / 0.17) ** 2 * 0 - 0.06 * (t / 0.2) ** 2
            leaf(p, d * t + Vector((0, yy + 0.02, 0)), d + Vector((0, -0.35 * t / 0.17, 0)), Vector((0, 1, 0)), (s, 0.045, 0.016), 'cal')
    p.blob((0, top + 0.03, 0), (0.06, 0.03, 0.06), group='cal')
    p.capsule((0, top + 0.03, 0), (0.025, top + 0.14, 0.01), 0.026, group='stalk', r2=0.022)
    p.paint_fn(lambda q, n: q.y > top + 0.11, GREEN_D)
    p.layer('skin')
    finish(p, 0.74, 0.02)


# ---------------- potato ----------------
def potato():
    SKIN, PATCH, EYE = 0xd9a45c, 0xe6b872, 0x8a5a2e
    p = Prop('prop_ck_potato', base=SKIN, target_faces=1500, voxel=0.01, smooth=4)
    p.blob((0, 0, 0), (0.4, 0.24, 0.29), group='m')
    p.blob((-0.2, 0.02, 0.03), (0.26, 0.23, 0.27), group='m')
    p.blob((0.23, -0.01, -0.02), (0.24, 0.22, 0.26), rot=(0, 20, 8), group='m')
    p.blob((0.05, 0.08, 0.1), (0.22, 0.16, 0.18), group='m')
    # soft lighter patches and a few little eyes (dents painted darker)
    for c, s in [((-0.15, 0.2, 0.12), (0.16, 0.06, 0.12)), ((0.22, 0.14, 0.18), (0.12, 0.08, 0.1))]:
        p.paint('patch', c, s, PATCH)
    for c in [(-0.3, 0.12, 0.2), (0.12, 0.2, 0.17), (0.36, 0.04, 0.17), (-0.05, -0.02, 0.32), (-0.42, -0.02, 0.0), (0.2, 0.16, -0.18), (-0.12, 0.2, -0.17)]:
        p.paint('eye', c, (0.028, 0.028, 0.028), EYE)
        p.blob(c, (0.022, 0.022, 0.022), group='m', negative=True)
    finish(p, 0.5, 0.02)


# ---------------- onion ----------------
def onion():
    PURPLE, STRIPE, NECK, ROOT = 0xa850c8, 0xc887e0, 0xd8a85a, 0xf2e2c2
    p = Prop('prop_ck_onion', base=PURPLE, target_faces=1500, voxel=0.01, smooth=3)
    prof = rounded([(0.0, -0.3), (0.12, -0.3), (0.28, -0.22), (0.36, -0.06), (0.35, 0.08), (0.27, 0.22), (0.13, 0.33), (0.05, 0.4), (0.0, 0.42)], 0.07, n=5)
    p.lathe(prof, seg=56)
    p.paint_fn(lambda q, n: abs(math.sin(math.atan2(q.x, q.z) * 7)) < 0.13 and -0.24 < q.y < 0.34, STRIPE)
    p.layer('neck', base=NECK, target_faces=300, voxel=0.006)
    p.capsule((0, 0.36, 0), (0.02, 0.5, 0.0), 0.04, group='n', r2=0.016)
    p.capsule((0.02, 0.5, 0), (0.06, 0.56, 0.0), 0.016, group='n', r2=0.01)
    p.layer('roots', base=ROOT, target_faces=400, voxel=0.005)
    for k in range(6):
        a = TAU * k / 6 + 0.2
        d = Vector((math.sin(a), 0, math.cos(a)))
        a0 = d * 0.03 + Vector((0, -0.29, 0))
        p.capsule(tuple(a0), tuple(a0 + d * 0.06 + Vector((0, -0.07, 0))), 0.013, group='r%d' % k, r2=0.008)
    p.layer('skin')
    finish(p, 0.72, 0.02)


# ---------------- bell pepper ----------------
def pepper():
    RED, RED_D, SHINE, STALK = 0xff3d2e, 0xd92c22, 0xfff1ea, 0x4c9e3a
    p = Prop('prop_ck_pepper', base=RED, target_faces=1600, voxel=0.01, smooth=3)
    prof = [(0.0, -0.4), (0.12, -0.39), (0.24, -0.3), (0.32, -0.12), (0.36, 0.06), (0.355, 0.2), (0.3, 0.3), (0.16, 0.33), (0.08, 0.3), (0.0, 0.3)]
    prof = rounded(prof, 0.05, n=5)

    def r_of(y):
        for (r0, y0), (r1, y1) in zip(prof, prof[1:]):
            if min(y0, y1) <= y <= max(y0, y1) and abs(y1 - y0) > 1e-6:
                return r0 + (r1 - r0) * (y - y0) / (y1 - y0)
        return 0.0
    NY, SEG = 50, 64
    ys = [prof[0][1] + (0.34 - prof[0][1]) * k / NY for k in range(NY + 1)]
    verts, faces = [], []
    rings = []
    for y in ys:
        ring = []
        for i in range(SEG):
            a = TAU * i / SEG
            r = max(0.0, r_of(min(y, 0.329)))
            lobe = math.cos(4 * a)
            r *= 1 + 0.07 * lobe
            yy = y
            if y < -0.3:
                yy -= 0.035 * max(0, lobe)       # four little feet underneath
            if y > 0.29:
                yy = 0.3 + (y - 0.29) * 0.2 + 0.03 * max(0, lobe) * (1 - min(1, (0.34 - y) / 0.05))
            ring.append((r * math.sin(a), yy, r * math.cos(a)))
        rings.append(ring)
    # build: bottom cap to the first ring, rings, top dip to the stalk
    for ring in rings:
        verts.extend(ring)
    for j in range(len(rings) - 1):
        for i in range(SEG):
            k = (i + 1) % SEG
            faces.append((j * SEG + i, j * SEG + k, (j + 1) * SEG + k, (j + 1) * SEG + i))
    b = len(verts); verts.append((0, -0.39, 0))
    t = len(verts); verts.append((0, 0.27, 0))
    last = len(rings) - 1
    for i in range(SEG):
        k = (i + 1) % SEG
        faces.append((b, k, i))
        faces.append((t, last * SEG + i, last * SEG + k))
    p.mesh(verts, faces)
    p.paint_fn(lambda q, n: math.cos(4 * math.atan2(q.x, q.z)) < -0.8 and -0.25 < q.y < 0.26, RED_D)
    p.layer('shine', base=SHINE, target_faces=200, voxel=0.006)
    p.blob((-0.17, 0.12, 0.31), (0.03, 0.09, 0.025), rot=(0, -28, 6), group='sh')
    p.layer('stalk', base=STALK, target_faces=600, voxel=0.007)
    p.blob((0, 0.3, 0), (0.1, 0.035, 0.1), group='cal')
    p.curve([(0, 0.3, 0), (0.01, 0.4, 0), (0.06, 0.47, 0), (0.12, 0.47, 0)], [0.04, 0.036, 0.032, 0.03], group='st')
    p.paint_fn(lambda q, n: q.x > 0.1 and q.y > 0.44, 0x8ac46a)
    p.layer('skin')
    finish(p, 0.8, 0.02)


# ---------------- knife ----------------
def knife():
    STEEL, SPINE, WOOD, WOOD_D, BRASS = 0xe4ebf4, 0xb3c0d2, 0xbf7a3a, 0x94582a, 0xffcf5a
    p = SProp('prop_ck_knife', base=STEEL, voxel=0.01, target_faces=1600)
    # the blade outline (x, y): the edge along y = 0 curving up into a soft round tip at -x, the spine at y ~0.42
    blade = [(0.6, 0.0), (0.2, 0.0), (-0.3, 0.01), (-0.52, 0.05), (-0.64, 0.12), (-0.68, 0.2), (-0.64, 0.29), (-0.52, 0.36), (-0.2, 0.4), (0.3, 0.42), (0.6, 0.42)]
    blade = rounded(blade, 0.05, n=4, closed=True)
    p.prism(blade, -0.024, 0.024, bevel=0.012, axis='z')
    # the bolster: a rounded steel collar between blade and handle
    p.box((0.64, 0.26, 0), (0.05, 0.13, 0.055), bevel=0.03)
    # the spine: one clean straight darker band along the back of the blade (its own layer, so its edges are crisp)
    p.layer('spine', base=SPINE, voxel=0.006, target_faces=300)
    band = rounded([(-0.36, 0.35), (0.58, 0.37), (0.58, 0.425), (-0.2, 0.407), (-0.4, 0.385)], 0.03, n=3, closed=True)
    p.prism(band, -0.027, 0.027, bevel=0.006, axis='z')
    p.layer('handle', base=WOOD, voxel=0.01, target_faces=900)
    hp = rounded([(0.66, 0.16), (1.3, 0.13), (1.42, 0.2), (1.42, 0.3), (1.3, 0.37), (0.66, 0.36)], 0.06, n=4, closed=True)
    p.prism(hp, -0.06, 0.06, bevel=0.04, axis='z')
    p.paint_fn(lambda q, n: q.x > 1.36, WOOD_D)
    p.layer('rivets', base=BRASS, voxel=0.006, target_faces=300)
    for x in (0.86, 1.14):
        p.cyl((x, 0.255, -0.068), 0.03, 0.136, rot=(90, 0, 0), bevel=0.012, seg=16)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 0.4, 0))
    p.extras['outline'] = 0.016
    p.build()


# ---------------- hob ----------------
def hob():
    CREAM, CORAL, DARK, GRATE, KNOB, POINT = 0xfff2e0, 0xff7a5c, 0x4a4256, 0x3e3846, 0xffffff, 0xff4a3a
    p = SProp('prop_ck_hob', base=CREAM, voxel=0.012, target_faces=2400)
    W, H, D = 1.35, 0.12, 0.8
    BX, BZ = -0.25, -0.1                      # the burner (the pot stands over it)
    KX, KZ = 0.95, 0.5                        # the dial
    p.box((0, H / 2 - 0.01, 0), (W, H / 2 - 0.01, D), bevel=0.05)
    # a coral trim round the front and sides, just under the top
    p.layer('trim', base=CORAL, voxel=0.01, target_faces=500)
    p.box((0, 0.045, D - 0.012), (W - 0.03, 0.035, 0.02), bevel=0.018)
    for sx in (-1, 1):
        p.box((sx * (W - 0.012), 0.045, 0), (0.02, 0.035, D - 0.03), bevel=0.018)
    # the dark burner well and a soft dish for the dial (thin discs on the top)
    p.layer('well', base=DARK, voxel=0.008, target_faces=500)
    p.cyl((BX, H - 0.012, BZ), 0.7, 0.018, bevel=0.008, seg=56)
    p.layer('dish', base=0xffd9b8, voxel=0.008, target_faces=300)
    p.cyl((KX, H - 0.012, KZ), 0.28, 0.016, bevel=0.007, seg=40)
    p.layer('grate', base=GRATE, voxel=0.008, target_faces=1400)
    GY = 0.165                                # the pot stands here
    p.ring((BX, GY - 0.03, BZ), 0.5, 0.03, seg=56, rseg=8)
    for k in range(4):
        a = TAU * k / 4 + math.pi / 4
        d = (math.sin(a), math.cos(a))
        p.tube([(BX + d[0] * 0.2, GY - 0.03, BZ + d[1] * 0.2), (BX + d[0] * 0.66, GY - 0.03, BZ + d[1] * 0.66),
                (BX + d[0] * 0.7, H + 0.01, BZ + d[1] * 0.7)], 0.03, rseg=8)
    p.cyl((BX, H - 0.01, BZ), 0.2, 0.05, bevel=0.02, seg=32)       # the burner cap
    p.layer('knob', base=0xff6248, voxel=0.007, target_faces=900)
    p.cyl((KX, H - 0.005, KZ), 0.21, 0.09, r2=0.195, bevel=0.035, seg=40)            # the dial: a big coral-red knob
    p.cyl((KX, H + 0.07, KZ), 0.16, 0.05, r2=0.145, bevel=0.025, seg=40)
    p.layer('ridge', base=0xfff4e2, voxel=0.007, target_faces=500)
    p.box((KX, H + 0.15, KZ - 0.01), (0.055, 0.05, 0.165), bevel=0.04)               # the cream grip ridge (front-back when off)
    p.layer('pointer', base=0xd93a2a, voxel=0.006, target_faces=200)
    p.blob((KX, H + 0.2, KZ + 0.11), (0.035, 0.012, 0.035), group='pt')             # a red dot on its front end
    p.layer('lamp', base=0xffffff, voxel=0.006, target_faces=200)
    p.blob((KX - 0.36, H + 0.012, KZ + 0.14), (0.06, 0.025, 0.06), group='l')
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, H, 0))
    p.extras['outline'] = 0.02
    p.build()


# ---------------- flame ----------------
def flame():
    OUTER, CORE = 0xff7a2a, 0xffd23f
    p = Prop('prop_ck_flame', base=OUTER, target_faces=1100, voxel=0.004, smooth=3)
    # one cartoon fire tongue (origin at its base, rising along y; outward is +z): a plump base, an S-curve up to a
    # sharp point that flicks toward -x, and a small side flick - warm orange so a toddler reads it as fire at once
    p.curve([(0, 0.035, 0), (0.012, 0.1, 0.008), (0.0, 0.19, 0.012), (-0.03, 0.29, 0.012), (-0.055, 0.38, 0.008), (-0.06, 0.47, 0.0)],
            [0.062, 0.06, 0.046, 0.03, 0.014, 0.003], group='t')
    p.curve([(0.035, 0.06, 0), (0.06, 0.13, 0.004), (0.075, 0.2, 0.004), (0.072, 0.25, 0.0)], [0.032, 0.022, 0.01, 0.003], group='t')
    p.layer('core', base=CORE, target_faces=600, voxel=0.0035)
    p.curve([(0, 0.04, 0.042), (0.006, 0.1, 0.048), (-0.006, 0.17, 0.045), (-0.025, 0.24, 0.035)], [0.036, 0.032, 0.02, 0.004], group='c')
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 0.4, 0))
    p.extras['outline'] = 0.008
    p.build()


# ---------------- ladle ----------------
def ladle():
    STEEL, STEEL_D, CORAL, CORAL_D = 0xe1e8f2, 0x9eaabd, 0xff7a5c, 0xe85c40
    p = SProp('prop_ck_ladle', base=STEEL, voxel=0.008, target_faces=2000)
    p.quadriflow = False
    # the cup: a hollow bowl wall (rolled rim at y 0, round bottom at y -0.16)
    prof = [(0.0, -0.17), (0.12, -0.155), (0.19, -0.09), (0.215, 0.0), (0.235, 0.01), (0.235, 0.025), (0.205, 0.02), (0.18, -0.065), (0.11, -0.125), (0.0, -0.135)]
    p.lathe(rounded(prof, 0.02, n=3), seg=48, closed=True)
    p.paint_fn(lambda q, n: n.y > 0.3 and math.hypot(q.x, q.z) < 0.19 and q.y < -0.02, STEEL_D)    # the inside of the cup, darker
    # the handle: from the back of the rim, up and back toward -z, ending in a soft hook
    H = [(0, 0.0, -0.22), (0, 0.1, -0.3), (0, 0.4, -0.525)]
    p.tube(H, [0.032, 0.032, 0.036], rseg=10)
    p.layer('grip', base=CORAL, voxel=0.008, target_faces=700)
    G = [(0, 0.34, -0.48), (0, 0.66, -0.72), (0, 0.72, -0.75), (0, 0.745, -0.71), (0, 0.72, -0.67)]
    GR = rounded(G, 0.04, n=3)
    p.tube(GR, [0.058 - 0.016 * max(0.0, (q[1] - 0.66) / 0.09) for q in GR], rseg=12)
    p.paint_fn(lambda q, n: q.y > 0.7, CORAL_D)
    p.layer('skin')
    p.bone('body', (0, -0.17, 0), (0, 0.9, 0))
    p.extras['outline'] = 0.014
    p.build()


# ---------------- knife block ----------------
def block():
    WOOD, WOOD_D, FELT = 0xc98a4e, 0xa86c36, 0x8fd3c0
    p = SProp('prop_ck_block', base=WOOD, voxel=0.012, target_faces=1400)
    # a chunky wooden knife rest: a low base and two rounded cradles the knife lies across, flat, handle toward Bear
    p.box((0, 0.05, 0), (0.24, 0.05, 0.5), bevel=0.04)                       # the base, long along z
    for z in (-0.32, 0.28):
        p.box((0, 0.19, z), (0.21, 0.13, 0.08), bevel=0.06)                   # a cradle post
    p.layer('band', base=WOOD_D, voxel=0.01, target_faces=300)
    p.box((0, 0.012, 0), (0.25, 0.014, 0.51), bevel=0.01)                     # a darker foot round the bottom
    p.layer('slot', base=FELT, voxel=0.008, target_faces=300)
    for z in (-0.32, 0.28):
        p.box((0, 0.322, z), (0.17, 0.008, 0.06), bevel=0.006)                 # soft mint pads the blade rests on
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 0.33, 0))
    p.extras['outline'] = 0.018
    p.build()


# ---------------- tasting spoon ----------------
def spoon():
    WOOD, WOOD_D = 0xe0a560, 0xc4844a
    p = SProp('prop_ck_spoon', base=WOOD, voxel=0.006, target_faces=900)
    p.quadriflow = False
    # a little wooden spoon: an oval bowl at the origin (opening up) and a handle along +x
    prof = [(0.0, -0.045), (0.06, -0.04), (0.095, -0.012), (0.105, 0.008), (0.088, 0.01), (0.07, -0.02), (0.0, -0.028)]
    p.lathe(rounded(prof, 0.012, n=3), seg=32, closed=True, scale=(1.0, 0.78))
    p.paint_fn(lambda q, n: n.y > 0.4 and q.y < 0.0 and math.hypot(q.x, q.z / 0.78) < 0.075, WOOD_D)
    p.tube([(0.09, 0.0, 0), (0.2, 0.02, 0), (0.42, 0.05, 0), (0.55, 0.06, 0)], [0.022, 0.02, 0.026, 0.03], rseg=10)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0.55, 0.06, 0))
    p.extras['outline'] = 0.01
    p.build()


# ---------------- Bear's step ----------------
def step():
    WOOD, WOOD_L, WOOD_D = 0xd99a58, 0xf0bd7a, 0xb87a40
    p = SProp('prop_ck_step', base=WOOD, voxel=0.02, target_faces=1600)
    L, H, D = 3.4, 1.0, 0.6
    p.box((0, H - 0.07, 0), (L, 0.07, D), bevel=0.05)                     # the top tread
    p.layer('frame', base=WOOD_D, voxel=0.02, target_faces=900)
    p.box((0, H / 2 - 0.05, D - 0.08), (L - 0.12, H / 2 - 0.1, 0.05), bevel=0.03)   # the front apron
    for x in (-L + 0.15, -1.15, 1.15, L - 0.15):
        p.box((x, (H - 0.14) / 2, 0), (0.1, (H - 0.14) / 2, D - 0.05), bevel=0.03)  # legs / side frames
    p.layer('stripe', base=WOOD_L, voxel=0.015, target_faces=300)
    p.box((0, H + 0.002, D - 0.12), (L - 0.1, 0.006, 0.05), bevel=0.004)     # a lighter strip along the front of the tread
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, H, 0))
    p.extras['outline'] = 0.02
    p.build()


# ---------------- recipe card ----------------
def card():
    PAPER, BORDER, WOOD, CLIP = 0xfff8ea, 0xff8a6a, 0xc98a50, 0xff4a5a
    p = SProp('prop_ck_card', base=PAPER, voxel=0.012, target_faces=1600)
    tilt = math.radians(10)
    Wc, Hc = 0.65, 0.85
    ctr = Vector((0, 0.62 + Hc * math.cos(tilt), -Hc * math.sin(tilt)))

    def on_card(x, y, z=0.0):
        """card-plane point (x right, y up from the card centre, z out of the card) -> game space"""
        return (x, ctr.y + y * math.cos(tilt) + z * math.sin(tilt), ctr.z - y * math.sin(tilt) + z * math.cos(tilt))
    poly = rounded([(-Wc, -Hc), (Wc, -Hc), (Wc, Hc), (-Wc, Hc)], 0.08, n=4, closed=True)
    V, F = [], []
    for z in (-0.02, 0.02):
        for x, y in poly:
            V.append(on_card(x, y, z))
    n = len(poly)
    F.append(tuple(range(n - 1, -1, -1)))
    F.append(tuple(range(n, 2 * n)))
    for i in range(n):
        j = (i + 1) % n
        F.append((i, j, n + j, n + i))
    p._prims().append(('mesh', V, F, 0.012))
    p.layer('border', base=BORDER, voxel=0.008, target_faces=800)
    ring = rounded([(-Wc + 0.05, -Hc + 0.05), (Wc - 0.05, -Hc + 0.05), (Wc - 0.05, Hc - 0.05), (-Wc + 0.05, Hc - 0.05)], 0.07, n=4, closed=True)
    p.tube([on_card(x, y, 0.03) for x, y in ring], 0.018, closed=True, rseg=6)
    p.layer('stand', base=WOOD, voxel=0.01, target_faces=500)
    p.box((0, 0.33, -0.12), (0.6, 0.33, 0.2), bevel=0.06)
    p.box((0, 0.06, -0.12), (0.72, 0.06, 0.26), bevel=0.04)
    p.layer('clip', base=CLIP, voxel=0.008, target_faces=500)
    cp = on_card(0, Hc + 0.02, 0.0)
    p.box(cp, (0.2, 0.07, 0.05), rot=(math.degrees(-tilt), 0, 0), bevel=0.03)
    p.layer('skin')
    for i, y in enumerate((0.52, 0.17, -0.18, -0.53)):
        p.anchor('row%d' % i, on_card(0, y, 0.03))
    p.anchor('normal', on_card(0, 0, 1.0))
    p.anchor('centre', on_card(0, 0, 0.0))
    p.bone('body', (0, 0, 0), (0, 1.8, 0))
    p.extras['outline'] = 0.016
    p.build()


def tick():
    p = Prop('prop_ck_tick', base=0x3fc25a, target_faces=500, voxel=0.008, smooth=2)
    p.tube([(-0.2, 0.0, 0), (-0.06, -0.13, 0), (0.2, 0.17, 0)], 0.055, rseg=10)
    p.blob((-0.2, 0.0, 0), (0.055, 0.055, 0.055), group='a')
    p.blob((-0.06, -0.13, 0), (0.06, 0.06, 0.06), group='b')
    p.blob((0.2, 0.17, 0), (0.055, 0.055, 0.055), group='c')
    p.bone('body', (0, -0.2, 0), (0, 0.2, 0))
    p.extras['outline'] = 0.014
    p.build()


for name, fn in [('prop_ck_tomato', tomato), ('prop_ck_potato', potato), ('prop_ck_onion', onion), ('prop_ck_pepper', pepper),
                 ('prop_ck_knife', knife), ('prop_ck_hob', hob), ('prop_ck_flame', flame), ('prop_ck_card', card), ('prop_ck_tick', tick),
                 ('prop_ck_ladle', ladle), ('prop_ck_step', step), ('prop_ck_block', block),
                 ('prop_ck_spoon', spoon)]:
    if want(name):
        fn()
