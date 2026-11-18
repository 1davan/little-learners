"""VOCAB.md batch 5 (clothes): word-card models, one script (ONLY=prop_word_shoe,... builds a subset).
Clothes are shown empty and puffed, as if an invisible toddler were wearing them, standing upright and facing +z.
Every garment is modelled around the SAME invisible toddler (words5.WProp, toddler space: stands on y = 0, chin ~1.62)
and carved hollow with that body, so sizes match and the neck, sleeves and hems open onto a darker inside.
  prop_word_shoe      a chunky red trainer, toe toward +x (white toe cap, sole and laces with a big bow, yellow heel tab)
  prop_word_coat      a puffy yellow hooded winter coat (blue toggles, cream fur hood rim, patch pockets)
  prop_word_jumper    a chunky green knitted jumper, arms out (white zigzag bands, ribbed cuffs/hem/collar)
  prop_word_tshirt    a sky tee in the classic T outline (yellow star sticker, white neck and sleeve trim)
  prop_word_trousers  blue denim trousers standing (orange stitching, turned-up cuffs, waistband, wood button, pockets)
  prop_word_shorts    red shorts (white side stripes, white drawstring bow)
  prop_word_dress     a pink bell dress with white polka dots, puff sleeves, white collar, purple bow (hem springs tail.1/2)
  prop_word_pyjamas   a sky pyjama suit (yellow moons and stars, white cuffs, collar and three buttons)
  prop_word_nappy     a puffy white nappy (green waistband and tabs, yellow duck sticker)
  prop_word_bib       an orange bib with a white rim, neck loop, crumb pocket and a carrot sticker
  prop_word_gloves    a pair of red mittens with white snowflakes, cream ribbed cuffs, joined by a string
  prop_word_scarf     a purple and yellow striped scarf in one loop, both ends hanging with tassels (springs)
  prop_word_zip       a strip of blue cloth with a chunky yellow zip open in a V at the top, a red pull (bone 'pull')
  prop_word_bag       a green toddler backpack (front pocket, yellow zip line, orange straps, grab loop, bear patch)
  prop_word_necklace  15 big beads in a U as if round a neck, a pink heart bead at the bottom (spring)
  prop_word_xray      an ink-blue x-ray plate on a grey stand showing a white cartoon hand skeleton, sky glow rim
Word-card variants of reused models (baked colour, the originals are untouched):
  prop_word_wellies   a pair of chunky yellow wellies seen from the side (slate treaded soles, pull tabs)
  prop_word_button    a big chunky red four-hole button standing on its edge
  prop_word_hat       a blue woolly bobble hat with a white stripe, white ribbed cuff and a big yellow bobble
"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from words5 import *   # noqa: F401,F403
from mathutils import Vector

ONLY = [s for s in os.environ.get('ONLY', '').split(',') if s]


def finish(p, h, w, outline=None, bones=True):
    if bones:
        p.bone('body', (0, p.oy, 0), (0, p.oy + h, 0))
    fit_extras(p, h, w)
    if outline:
        p.extras['outline'] = outline
    p.build()


def zrot(d):
    """game euler (deg) that turns +y to the 2D direction d=(dx, dy) in the x-y plane"""
    return (0, 0, math.degrees(math.atan2(-d[0], d[1])))


def unit(a, b):
    v = Vector(b) - Vector(a)
    return v.normalized(), v.length


# ---------------- the invisible toddler ----------------
NECK = ((0, 1.42, 0), (0, 2.3, 0), 0.17)
CHEST = ((0, 1.2, 0), (0.39, 0.34, 0.27))
TUM = ((0, 0.95, 0.02), (0.41, 0.33, 0.3))
SH = 0.33, 1.34         # shoulder joint (x, y)


def cut_torso(p, hem=None, neck=True, deep=1.22):
    """carve the neck (down to y = deep) and, if hem is given, a shallow hollow up into the hem (y = hem)"""
    if neck:
        p.cut_cap((0, deep, 0), NECK[1], NECK[2])
    if hem is not None:
        p.cut_ell((0, hem - 0.05, 0.01), (0.41, 0.3, 0.3))


def cut_arms(p, a, b, r=0.13, depth=0.3):
    """open the sleeve ends: a cutter from `depth` inside the cuff b (right arm x, y) outward along a->b"""
    for s in (-1, 1):
        A = Vector((s * a[0], a[1], 0))
        B = Vector((s * b[0], b[1], 0))
        d = (B - A).normalized()
        p.cut_cap(tuple(B - d * depth), tuple(B + d * 0.6), r)


def cut_legs(p, bottom, top=None, r=0.165, depth=0.3):
    for s in (-1, 1):
        p.cut_cap((s * 0.21, bottom + depth, 0), (s * 0.215, bottom - 0.6, 0), r)


def sleeve(p, s, a, b, r0, r1, bevel=0.06):
    a = (s * a[0], a[1], a[2] if len(a) > 2 else 0)
    b = (s * b[0], b[1], b[2] if len(b) > 2 else 0)
    d, L = unit(a, b)
    p.cyl(a, r0, L, r2=r1, rot=zrot((d.x, d.y)), bevel=bevel, seg=32)


def cuff_ring(p, s, a, b, R, r, at=1.0, scale=(1, 1)):
    a = Vector((s * a[0], a[1], 0)); b = Vector((s * b[0], b[1], 0))
    d = (b - a).normalized()
    c = a.lerp(b, at)
    p.ring(tuple(c), R, r, rot=zrot((d.x, d.y)), scale=scale, seg=36, rseg=10)


# ======================================================================= T-SHIRT
def tshirt():
    p = WProp('prop_word_tshirt', oy=0.48, base=SKY, voxel=0.013, target_faces=1500)
    prof = rounded([(0, 0.48), (0.5, 0.48), (0.53, 0.8), (0.53, 1.15), (0.49, 1.36), (0.34, 1.52), (0.22, 1.56), (0, 1.56)], 0.07, n=3)
    p.lathe(prof, scale=(1, 0.74), seg=40)
    SA, SB = (0.34, 1.38), (0.84, 1.16)
    for s in (-1, 1):
        sleeve(p, s, SA, SB, 0.24, 0.22, bevel=0.05)
    cut_torso(p, hem=0.48)
    cut_arms(p, SA, SB)
    p.paint_fn(lambda q, n: q.y < 0.57 and n.y < 0.3 and abs(q.x) < 0.6, SKY_D)    # a soft hem band
    p.inside(SKY_D)
    # white trim: neck ring and sleeve cuffs
    p.layer('trim', base=WHITE, voxel=0.011, target_faces=420)
    p.ring((0, 1.555, 0.005), 0.215, 0.05, scale=(1, 0.95), seg=32, rseg=8)
    for s in (-1, 1):
        cuff_ring(p, s, SA, SB, 0.225, 0.05, at=0.97)
    cut_torso(p)
    cut_arms(p, SA, SB)
    p.inside(WHITE_D)
    # the star
    p.layer('star', base=YELLOW, voxel=0.007, target_faces=200, quadriflow=False)
    p.sticker(star_poly(0.27, inner=0.5), (0, 1.0), thick=0.035, lift=0.01)
    p.layer('skin')
    finish(p, 1.1, 1.9)


def rib_band(p, a, b, r, n=18, amp=0.022, scale=(1, 1), seg=None, end=0.03, rings=8):
    """a knitted rib band: a short tube from a to b (radius r) with n vertical grooves, ends rounded"""
    a, b = Vector(a), Vector(b)
    d = (b - a).normalized()
    L = (b - a).length
    up = Vector((0, 0, 1)) if abs(d.z) < 0.9 else Vector((1, 0, 0))
    e1 = d.cross(up).normalized(); e2 = d.cross(e1).normalized()
    if abs(d.y) > 0.95:     # vertical bands: keep x/z frame so `scale` means (x, z)
        e1, e2 = Vector((1, 0, 0)), Vector((0, 0, 1))
    seg = seg or n * 4
    verts, faces = [], []
    prof = []
    for k in range(rings + 1):
        t = k / rings
        y = t * L
        # rounded ends
        u = min(y, L - y)
        k_r = math.sqrt(max(0.0, 1 - max(0.0, (end - u) / end) ** 2)) if end > 0 else 1
        prof.append((y, k_r))
    for (y, kr) in prof:
        for i in range(seg):
            th = TAU * i / seg
            rr = (r + amp * (0.5 + 0.5 * math.cos(n * th))) * (0.75 + 0.25 * kr) - (1 - kr) * 0.02
            v = a + d * y + e1 * (math.cos(th) * rr * scale[0]) + e2 * (math.sin(th) * rr * scale[1])
            verts.append(tuple(v))
    R = len(prof)
    for k in range(R - 1):
        for i in range(seg):
            j = (i + 1) % seg
            faces.append((k * seg + i, k * seg + j, (k + 1) * seg + j, (k + 1) * seg + i))
    c0 = len(verts); verts.append(tuple(a))
    c1 = len(verts); verts.append(tuple(b))
    for i in range(seg):
        j = (i + 1) % seg
        faces.append((c0, j, i))
        faces.append((c1, (R - 1) * seg + i, (R - 1) * seg + j))
    p.mesh(verts, faces)


# ======================================================================= JUMPER
def jumper():
    p = WProp('prop_word_jumper', oy=0.5, base=GREEN, voxel=0.013, target_faces=1500)
    prof = rounded([(0, 0.6), (0.53, 0.6), (0.56, 0.85), (0.55, 1.15), (0.5, 1.36), (0.34, 1.52), (0.22, 1.55), (0, 1.55)], 0.07, n=3)
    p.lathe(prof, scale=(1, 0.74), seg=40)
    SA, SB = (0.34, 1.37), (1.0, 0.98)
    for s in (-1, 1):
        sleeve(p, s, SA, SB, 0.22, 0.18, bevel=0.05)
    cut_torso(p)
    cut_arms(p, SA, SB, depth=0.25)
    # two white zigzag bands across the chest (and on round the back)
    for yc in (1.2, 0.95):
        p.paint_fn(lambda q, n, yc=yc: abs(q.x) < 0.62 and abs(q.y - (yc + 0.045 * tri_wave(q.x + 0.05, 0.2))) < 0.045, WHITE)
    p.inside(GREEN_D)
    # knitted ribs: hem, cuffs, collar
    p.layer('rib', base=GREEN_D, voxel=0.008, target_faces=1000, quadriflow=False)
    rib_band(p, (0, 0.5, 0), (0, 0.66, 0), 0.535, n=44, amp=0.02, scale=(1, 0.75), end=0.04)
    rib_band(p, (0, 1.48, 0), (0, 1.6, 0), 0.24, n=22, amp=0.018, scale=(1, 0.92), end=0.03)
    for s in (-1, 1):
        A = Vector((s * SA[0], SA[1], 0)); B = Vector((s * SB[0], SB[1], 0))
        d = (B - A).normalized()
        rib_band(p, tuple(B - d * 0.13), tuple(B + d * 0.05), 0.175, n=16, amp=0.016, end=0.03)
    cut_torso(p)
    cut_arms(p, SA, SB, depth=0.25)
    p.inside(GREEN_D)
    p.layer('skin')
    finish(p, 1.12, 2.3)


# ======================================================================= COAT
def coat():
    p = WProp('prop_word_coat', oy=0.3, base=YELLOW, voxel=0.014, target_faces=1700)
    # a quilted puffer: the profile bulges once per quilt band
    base = [(0.3, 0.6), (0.6, 0.6), (0.95, 0.57), (1.2, 0.54), (1.36, 0.47), (1.48, 0.36), (1.55, 0.24)]
    def rb(y):
        for (y0, r0), (y1, r1) in zip(base, base[1:]):
            if y0 <= y <= y1:
                return r0 + (r1 - r0) * (y - y0) / (y1 - y0)
        return base[-1][1]
    prof = [(0, 0.3)]
    N = 40
    for k in range(N + 1):
        y = 0.32 + (1.53 - 0.32) * k / N
        bump = 0.03 * abs(math.sin((y - 0.32) / 0.24 * math.pi)) if y < 1.4 else 0
        prof.append((rb(y) + bump, y))
    prof.append((0, 1.55))
    prof = [(0, 0.3)] + rounded(prof[1:-1], 0.05, n=2) + [(0, 1.55)]
    prof[1] = (prof[1][0] - 0.05, 0.3)
    p.lathe(prof, scale=(1, 0.78), seg=44)
    SA, SB = (0.36, 1.38), (0.8, 0.66)
    for s in (-1, 1):
        sleeve(p, s, SA, SB, 0.25, 0.22, bevel=0.06)
    # the hood, down on the back: a soft bump that peeks over the shoulders
    p.blob((0, 1.62, -0.32), (0.4, 0.3, 0.22), rot=(-20, 0, 0), group='hood')
    p.blob((0, 1.5, -0.38), (0.36, 0.22, 0.2), group='hood')
    cut_torso(p, deep=1.25)
    cut_arms(p, SA, SB, depth=0.25)
    # quilt seams and the front opening
    p.paint_fn(lambda q, n: q.y < 1.42 and abs(((q.y - 0.32) % 0.24) - 0.0) < 0.012 and q.y > 0.4, YELLOW_D)
    p.paint_fn(lambda q, n: n.z > 0.2 and abs(q.x) < 0.025 and q.y < 1.5, YELLOW_D)
    p.paint_fn(lambda q, n: q.y < 0.4 and abs(q.x) < 0.64, YELLOW_D)            # hem band
    for s in (-1, 1):
        A = Vector((s * SA[0], SA[1], 0)); B = Vector((s * SB[0], SB[1], 0))
        d = (B - A).normalized()
        p.paint_fn(lambda q, n, B=B, d=d: (q - B).dot(d) > -0.1, YELLOW_D)       # cuff bands
    p.inside(YELLOW_D)
    # cream fur round the neck / hood rim: a ring of fluffy puffs
    p.layer('fur', base=CREAM, voxel=0.012, target_faces=700)
    for k in range(18):
        a = TAU * k / 18
        rr = 0.105 if k % 2 else 0.09
        x, z = 0.31 * math.sin(a), 0.27 * math.cos(a) - 0.04
        y = 1.56 + 0.07 * (1 - math.cos(a)) * 0.5 + 0.02 * math.sin(3 * a)
        p.blob((x, y, z), (rr, rr * 0.9, rr), group='fur')
    p.paint_fn(lambda q, n: n.z < -0.3 and q.y < 1.6, CREAM_D)
    cut_torso(p, deep=1.25)
    p.inside(CREAM_D)
    # four big blue toggles down the front
    p.layer('toggles', base=BLUE, voxel=0.008, target_faces=600)
    for k, y in enumerate((1.3, 1.04, 0.78, 0.52)):
        zf = 0.78 * rb(y) + 0.03
        p.blob((0, y, zf), (0.085, 0.085, 0.05), group='t%d' % k)
        p.paint('hl%d' % k, (-0.03, y + 0.035, zf + 0.04), (0.03, 0.022, 0.05), BLUE_L)
    # two patch pockets with flaps
    p.layer('pockets', base=YELLOW, voxel=0.008, target_faces=500, quadriflow=False)
    pk = rounded([(-0.15, -0.14), (0.15, -0.14), (0.15, 0.14), (-0.15, 0.14)], 0.07, n=3)
    for s in (-1, 1):
        p.sticker(pk, (s * 0.32, 0.62), thick=0.05, lift=0.02, step=0.03)
    p.paint_fn(lambda q, n: q.y > 0.7, YELLOW_D)
    p.layer('skin')
    finish(p, 1.4, 1.7)


# ======================================================================= TROUSERS
LEGX = 0.26


def legs_and_seat(p, bottom, r0, r1, hip_y=0.84, waist=1.0, seat=(0.49, 0.24, 0.35)):
    p.blob((0, hip_y, 0), seat, group='seat')
    p.blob((0, waist - 0.05, 0), (seat[0] - 0.02, 0.1, seat[2] - 0.01), group='seat')
    for s in (-1, 1):
        p.capsule((s * LEGX * 0.9, hip_y - 0.05, 0.0), (s * LEGX, bottom + r1 + 0.02, 0.01), r0, r2=r1, group='leg%d' % s)
        p.cyl((s * LEGX, bottom, 0.01), r1, 0.3, r2=r1, bevel=0.05, seg=32)


def trousers():
    p = WProp('prop_word_trousers', oy=0.0, base=BLUE, voxel=0.013, target_faces=1300)
    legs_and_seat(p, 0.0, 0.24, 0.215)
    p.cut_ell((0, 1.08, 0.0), (0.4, 0.22, 0.27))      # waist opening
    p.inside(BLUE_D)
    # pocket openings and the fly: dark grooves; orange stitching beside them
    p.layer('grooves', base=BLUE_D, voxel=0.006, target_faces=500, quadriflow=False)
    for s in (-1, 1):
        pts = [(s * 0.17, 0.97), (s * 0.2, 0.88), (s * 0.29, 0.81), (s * 0.45, 0.78)]
        dash_line(p, rounded(pts, 0.05, n=3), w=0.032, dash=0.5, gap=0.0, thick=0.02, lift=0.004)
    dash_line(p, [(0.0, 0.92), (0.0, 0.66)], w=0.03, dash=0.065, gap=0.0, thick=0.02, lift=0.004)
    p.layer('stitch', base=ORANGE, voxel=0.006, target_faces=700, quadriflow=False)
    for s in (-1, 1):
        pts = [(s * 0.13, 0.9), (s * 0.17, 0.82), (s * 0.26, 0.75), (s * 0.44, 0.72)]
        dash_line(p, rounded(pts, 0.05, n=3), w=0.032, dash=0.07, gap=0.045, thick=0.022, lift=0.006)
    dash_line(p, rounded([(0.085, 0.92), (0.085, 0.72), (0.05, 0.64), (0.0, 0.62)], 0.05, n=3), w=0.032, dash=0.07, gap=0.045, thick=0.022, lift=0.006)
    # waistband with belt loops and a wood button
    p.layer('band', base=BLUE, voxel=0.01, target_faces=600)
    p.lathe(rounded([(0.47, 0.93), (0.5, 0.93), (0.5, 1.07), (0.47, 1.07)], 0.025, n=2), scale=(1, 0.74), seg=48, closed=True)
    for s in (-1, 1):
        x = s * 0.32
        p.box((x, 1.0, 0.36 * math.sqrt(max(0, 1 - (x / 0.52) ** 2)) + 0.03), (0.035, 0.09, 0.03), bevel=0.02)
    p.cut_ell((0, 1.08, 0.0), (0.4, 0.22, 0.27))
    p.inside(BLUE_D)
    p.layer('button', base=WOOD, voxel=0.007, target_faces=200)
    p.blob((0, 1.0, 0.39), (0.065, 0.065, 0.035), group='b')
    p.paint('hole', (0, 1.0, 0.43), (0.02, 0.02, 0.02), WOOD_D)
    # turned-up cuffs: the lighter inside of the denim shows
    p.layer('cuffs', base=BLUE_L, voxel=0.01, target_faces=600)
    for s in (-1, 1):
        p.lathe(rounded([(0.2, 0.0), (0.25, 0.0), (0.255, 0.17), (0.2, 0.17)], 0.025, n=2), pos=(s * LEGX, 0, 0.01), seg=40, closed=True)
    p.paint_fn(lambda q, n: q.y > 0.065 and q.y < 0.095 and n.y < 0.5, ORANGE)
    p.layer('skin')
    finish(p, 1.07, 1.02)


# ======================================================================= SHORTS
def shorts():
    p = WProp('prop_word_shorts', oy=0.42, base=RED, voxel=0.012, target_faces=1100)
    p.blob((0, 0.86, 0), (0.5, 0.24, 0.36), group='seat')
    p.blob((0, 0.98, 0), (0.48, 0.1, 0.35), group='seat')
    for s in (-1, 1):
        p.cyl((s * 0.29, 0.42, 0.01), 0.26, 0.4, r2=0.25, bevel=0.05, seg=32)
    p.cut_ell((0, 1.08, 0.0), (0.4, 0.22, 0.27))
    for s in (-1, 1):
        p.cut_cap((s * 0.29, 0.62, 0.01), (s * 0.29, -0.2, 0.01), 0.18)
    # white side stripes
    p.paint_fn(lambda q, n: abs(n.x) > 0.5 and abs(q.z) < 0.065 and q.y < 0.98, WHITE)
    p.inside(RED_D)
    p.layer('band', base=RED_D, voxel=0.008, target_faces=600, quadriflow=False)
    rib_band(p, (0, 0.92, 0), (0, 1.07, 0), 0.5, n=40, amp=0.012, scale=(1, 0.74), end=0.03)
    p.cut_ell((0, 1.08, 0.0), (0.4, 0.22, 0.27))
    p.inside(RED_D)
    # white drawstring bow at the front
    p.layer('bow', base=WHITE, voxel=0.008, target_faces=500)
    z0 = 0.4
    for s in (-1, 1):
        loop = [(0, 1.0, z0)] + [(s * (0.04 + 0.11 * math.sin(t * math.pi) ** 0.8 + 0.06 * t), 1.0 + 0.07 * math.sin(t * TAU), z0 + 0.015) for t in [k / 10 for k in range(1, 10)]] + [(0, 1.0, z0)]
        p.tube(loop, 0.032, rseg=8)
        p.tube([(0, 0.99, z0), (s * 0.04, 0.9, z0 + 0.02), (s * 0.06, 0.8, z0 + 0.03)], 0.032, rseg=8)
        p.blob((s * 0.065, 0.78, z0 + 0.03), (0.042, 0.048, 0.042), group='aglet%d' % s)
    p.blob((0, 1.0, z0 + 0.01), (0.048, 0.042, 0.038), group='knot')
    p.layer('skin')
    finish(p, 0.66, 1.08)


# ======================================================================= DRESS
def dress():
    p = WProp('prop_word_dress', oy=0.0, base=PINK, voxel=0.013, target_faces=1500)
    # bodice
    p.lathe(rounded([(0, 0.95), (0.4, 0.95), (0.42, 1.15), (0.4, 1.36), (0.3, 1.5), (0.2, 1.54), (0, 1.54)], 0.06, n=3), scale=(1, 0.8), seg=40)
    # bell skirt with a fluted, wavy hem
    def R(y):
        t = max(0.0, (1.0 - y) / 1.0)
        return 0.4 + 0.42 * t ** 1.3
    verts, faces = [], []
    SEG, NY = 64, 26
    ys = [1.02 - 1.0 * k / NY for k in range(NY + 1)]
    for y in ys:
        w = max(0.0, (0.75 - y) / 0.75) ** 1.5
        for i in range(SEG):
            th = TAU * i / SEG
            r = R(y) * (1 + 0.075 * w * math.cos(8 * th))
            yy = y + 0.035 * w * math.cos(8 * th) if y < 0.05 else y
            verts.append((r * math.sin(th), max(0.0, yy) if y < 0.05 else y, r * math.cos(th) * 0.9))
    for k in range(NY):
        for i in range(SEG):
            j = (i + 1) % SEG
            faces.append((k * SEG + i, k * SEG + j, (k + 1) * SEG + j, (k + 1) * SEG + i))
    c0 = len(verts); verts.append((0, 1.02, 0)); c1 = len(verts); verts.append((0, 0.0, 0))
    for i in range(SEG):
        j = (i + 1) % SEG
        faces.append((c0, j, i)); faces.append((c1, NY * SEG + i, NY * SEG + j))
    p.mesh(verts, faces)
    # puff sleeves
    for s in (-1, 1):
        p.blob((s * 0.44, 1.36, 0), (0.2, 0.17, 0.19), rot=(0, 0, s * 30), group='puff%d' % s)
    p.cut_cone((0, -0.3, 0), (0, 0.7, 0), 0.82, 0.37)
    p.cut_cap((0, 1.25, 0), (0, 2.3, 0), 0.165)
    for s in (-1, 1):
        p.cut_cap((s * 0.48, 1.3, 0), (s * 1.0, 1.0, 0), 0.12)
    p.inside(PINK_D)
    # polka dots: little stickers all round, rows staggered, spaced by real arc length
    p.layer('dots', base=WHITE, voxel=0.006, target_faces=1200, quadriflow=False)
    rows = [(0.16, 0), (0.42, 1), (0.68, 0), (1.2, 1)]
    for yr, odd in rows:
        rr = R(yr) if yr < 1.0 else 0.42
        cnt = max(6, round(TAU * rr / 0.27))
        for k in range(cnt):
            ang = 360.0 * (k + 0.5 * odd) / cnt
            p.sticker(circle_poly(0.058, n=14), (0, yr), thick=0.025, lift=0.01, step=0.03, ang=ang)
    p.layer('skin')
    # white round collar
    p.layer('collar', base=WHITE, voxel=0.008, target_faces=500, quadriflow=False)
    for s in (-1, 1):
        p.sticker(circle_poly(0.135, n=28, sy=0.78), (s * 0.125, 1.43), thick=0.04, lift=0.02, step=0.025)
    p.cut_cap((0, 1.25, 0), (0, 2.3, 0), 0.165)
    # purple ribbon bow at the waist
    p.layer('bow', base=PURPLE, voxel=0.009, target_faces=700)
    p.lathe(rounded([(0.405, 0.92), (0.44, 0.92), (0.44, 1.02), (0.405, 1.02)], 0.02, n=2), scale=(1, 0.82), seg=48, closed=True)
    zb = 0.42
    for s in (-1, 1):
        p.blob((s * 0.14, 0.99, zb), (0.13, 0.085, 0.05), rot=(0, 0, s * 12), group='loop%d' % s)
        p.capsule((s * 0.03, 0.95, zb), (s * 0.11, 0.84, zb + 0.02), 0.045, r2=0.05, group='tail%d' % s)
    p.blob((0, 0.97, zb + 0.02), (0.06, 0.06, 0.05), group='knot')
    p.paint_fn(lambda q, n: q.z > 0.3 and abs(q.x) > 0.05 and abs(q.x) < 0.25 and abs(q.y - 0.99) < 0.02, PURPLE_D)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 1.0, 0))
    p.bone('tail.1', (0, 0.9, 0), (0, 0.5, 0), parent='body', region=lambda q: q.y < 0.86)
    p.bone('tail.2', (0, 0.5, 0), (0, 0.0, 0), parent='tail.1', region=lambda q: q.y < 0.6)
    finish(p, 1.56, 1.66, bones=False)


# ======================================================================= PYJAMAS
def pyjamas():
    p = WProp('prop_word_pyjamas', oy=0.0, base=SKY, voxel=0.014, target_faces=1300)
    # trousers (skin) under a top (layer 'top')
    p.blob((0, 0.78, 0), (0.46, 0.22, 0.33), group='seat')
    for s in (-1, 1):
        p.capsule((s * 0.22, 0.72, 0.0), (s * 0.25, 0.22, 0.01), 0.21, r2=0.2, group='leg%d' % s)
        p.cyl((s * 0.25, 0.0, 0.01), 0.2, 0.25, bevel=0.05, seg=32)
    p.layer('top', base=SKY, voxel=0.014, target_faces=1300)
    p.lathe(rounded([(0, 0.6), (0.52, 0.6), (0.54, 0.85), (0.53, 1.15), (0.48, 1.36), (0.33, 1.52), (0.21, 1.55), (0, 1.55)], 0.07, n=3), scale=(1, 0.76), seg=40)
    SA, SB = (0.34, 1.37), (0.82, 0.78)
    for s in (-1, 1):
        sleeve(p, s, SA, SB, 0.21, 0.18, bevel=0.05)
    cut_torso(p)
    cut_arms(p, SA, SB, depth=0.25)
    p.paint_fn(lambda q, n: n.z > 0.2 and abs(q.x) < 0.02 and q.y < 1.45, SKY_D)
    p.inside(SKY_D)
    # yellow moons and stars
    p.layer('prints', base=YELLOW, voxel=0.007, target_faces=900, quadriflow=False)
    p.sticker(moon_poly(0.13, rot=-30), (-0.26, 1.12), onto='top', thick=0.03)
    p.sticker(star_poly(0.1, inner=0.5), (0.27, 1.2), onto='top', thick=0.03)
    p.sticker(star_poly(0.08, inner=0.5), (-0.2, 0.78), onto='top', thick=0.03)
    p.sticker(moon_poly(0.11, rot=150), (0.27, 0.8), onto='top', thick=0.03)
    p.sticker(star_poly(0.08, inner=0.5), (-0.28, 0.3), onto='skin', thick=0.03)
    p.sticker(moon_poly(0.1, rot=-30), (0.27, 0.42), onto='skin', thick=0.03)
    # white cuffs, collar and three buttons
    p.layer('cuffs', base=WHITE, voxel=0.01, target_faces=700)
    for s in (-1, 1):
        cuff_ring(p, s, SA, SB, 0.185, 0.05, at=0.98)
        p.ring((s * 0.25, 0.06, 0.01), 0.205, 0.05, seg=32, rseg=8)
    cut_arms(p, SA, SB, depth=0.25)
    p.inside(WHITE_D)
    p.layer('collar', base=WHITE, voxel=0.008, target_faces=500, quadriflow=False)
    for s in (-1, 1):
        flap = [(0, 0), (s * 0.2, 0.05), (s * 0.22, -0.02), (s * 0.08, -0.17)]
        p.sticker(rounded(flap, 0.03, n=2, closed=True), (s * 0.005, 1.5), onto='top', thick=0.04, lift=0.02, step=0.02)
    p.layer('buttons', base=WHITE, voxel=0.007, target_faces=300)
    for k, y in enumerate((1.22, 1.0, 0.78)):
        zf = 0.76 * 0.535 + 0.02
        p.blob((0, y, zf), (0.05, 0.05, 0.03), group='b%d' % k)
    p.layer('skin')
    finish(p, 1.57, 1.75)


# ======================================================================= NAPPY
def nappy():
    p = WProp('prop_word_nappy', oy=0.48, base=WHITE, voxel=0.012, target_faces=1000)
    p.blob((0, 0.98, 0), (0.5, 0.2, 0.37), group='n')
    p.blob((0, 0.8, 0.01), (0.45, 0.25, 0.37), group='n')
    p.blob((0, 0.62, 0.01), (0.23, 0.13, 0.31), group='n')
    p.cut_ell((0, 1.18, 0.0), (0.4, 0.2, 0.28))          # waist opening
    for s in (-1, 1):
        p.cut_cap((s * 0.13, 0.66, 0.0), (s * 0.7, 0.36, 0.0), 0.17)   # leg holes
    p.paint_fn(lambda q, n: n.z > 0.3 and abs(q.x) < 0.24 and 0.6 < q.y < 0.95 and abs(abs(q.x) - 0.24) < 0.012, WHITE_D)
    p.inside(WHITE_D)
    # green waistband round the top
    p.layer('band', base=GREEN, voxel=0.01, target_faces=500)
    p.lathe(rounded([(0.44, 1.0), (0.505, 1.0), (0.505, 1.12), (0.44, 1.12)], 0.03, n=2), scale=(1, 0.74), seg=44, closed=True)
    p.cut_ell((0, 1.18, 0.0), (0.4, 0.2, 0.28))
    p.inside(GREEN_D)
    # two tabs fastened at the front
    p.layer('tabs', base=GREEN, voxel=0.007, target_faces=300, quadriflow=False)
    tab = rounded([(-0.1, -0.075), (0.1, -0.075), (0.1, 0.075), (-0.1, 0.075)], 0.05, n=3)
    for s in (-1, 1):
        p.sticker(tab, (s * 0.3, 0.97), thick=0.045, lift=0.025, step=0.025)
    p.paint_fn(lambda q, n: abs(q.x) > 0.36, GREEN_D)
    p.layer('duck', base=YELLOW, voxel=0.006, target_faces=300, quadriflow=False)
    body = [(0.12 * math.cos(TAU * k / 28), 0.08 * math.sin(TAU * k / 28) - 0.03) for k in range(28)]
    head = [(0.08 + 0.06 * math.cos(TAU * k / 20), 0.085 + 0.06 * math.sin(TAU * k / 20)) for k in range(20)]
    p.sticker(body, (0, 0.76), thick=0.03, lift=0.012, step=0.02)
    p.sticker(head, (0, 0.76), thick=0.03, lift=0.012, step=0.02)
    p.paint('eye', (0.09, 0.86 - 0.5, 0.5), (0.016, 0.016, 0.3), INK)
    p.layer('beak', base=ORANGE, voxel=0.006, target_faces=120)
    p.blob((0.15, 0.835, 0.37), (0.045, 0.024, 0.028), group='bk')
    p.layer('skin')
    finish(p, 0.72, 1.02)


# ======================================================================= BIB
def bib():
    p = WProp('prop_word_bib', oy=0.016, base=ORANGE, voxel=0.011, target_faces=900)
    # a round bib with a scooped neck notch at the top (the two lobes either side of it tie behind the neck);
    # the flat front is left unremeshed (cheap, crisp paint) and the badge and carrot are painted on it
    C1, R1, C2, R2 = 0.84, 0.62, 1.47, 0.25
    yi = ((C1 ** 2 - C2 ** 2) - (R1 ** 2 - R2 ** 2)) / (2 * (C1 - C2))
    xi = math.sqrt(R2 ** 2 - (yi - C2) ** 2)
    a1 = math.degrees(math.atan2(yi - C1, xi))
    a2 = math.degrees(math.atan2(yi - C2, -xi)) % 360
    out = arc(0, C1, R1, a1, -180 - a1, n=40) + arc(0, C2, R2, a2, 540 - a2, n=14)[1:-1]
    out = resample(rounded(out, 0.05, n=2, closed=True), 0.115)
    zb = lambda x, y: -0.2 * x * x
    p.layers['skin']['remesh'] = False
    p.slab(out, 0.1, z=zb, step=0.16)
    BX, BY = 0.0, 0.86
    car = rounded([(-0.075, 0.1), (0.075, 0.1), (0.0, -0.22)], 0.035, n=3, closed=True)
    car = [(BX + 0.01 + x * math.cos(0.3) - y * math.sin(0.3), BY - 0.05 + x * math.sin(0.3) + y * math.cos(0.3)) for x, y in car]
    leaves = []
    for ang in (-0.35, 0.3, 0.95):
        lf = [(0.042 * math.cos(TAU * k / 16), 0.085 * math.sin(TAU * k / 16) + 0.08) for k in range(16)]
        leaves.append([(BX - 0.02 + x * math.cos(ang) - y * math.sin(ang), BY + 0.05 + x * math.sin(ang) + y * math.cos(ang)) for x, y in lf])
    p.paint_fn(lambda q, n: n.z < -0.3, ORANGE_D)
    # the badge: a cream sticker with the carrot painted on it
    p.layer('badge', base=CREAM, remesh=False)
    p.sticker(resample(circle_poly(0.28, n=60), 0.05), (BX, BY), thick=0.03, lift=0.016, step=0.056)
    p.paint_fn(lambda q, n: any(in_poly(q.x, q.y, lf) for lf in leaves), GREEN)
    p.paint_fn(lambda q, n: in_poly(q.x, q.y, car), ORANGE)
    p.paint_fn(lambda q, n: n.z < 0.3, CREAM_D)
    p.layer('skin')
    p.layer('rim', base=WHITE, remesh=False)
    rim = [(x, y, zb(x, y)) for x, y in out]
    p.tube(rim, 0.055, closed=True, rseg=5)
    # the neck loop: a strap from one lobe round the back of the neck to the other, with a snap
    p.layer('loop', base=ORANGE, remesh=False)
    lp = [(-0.4, 1.36, -0.02), (-0.4, 1.4, -0.18), (-0.24, 1.42, -0.32), (0, 1.43, -0.37), (0.24, 1.42, -0.32), (0.4, 1.4, -0.18), (0.4, 1.36, -0.02)]
    p.tube(resample(rounded(lp, 0.08, n=2), 0.1, closed=False), 0.045, rseg=6)
    p.layer('snap', base=WHITE, voxel=0.008, target_faces=120)
    p.blob((0.4, 1.36, 0.08), (0.06, 0.06, 0.04), group='sn')
    # crumb pocket: a scooped lip along the bottom
    p.layer('pocket', base=ORANGE, voxel=0.012, target_faces=220)
    p.blob((0, 0.2, 0.08), (0.5, 0.2, 0.22), group='pk')
    p.cut_ell((0, 0.36, 0.1), (0.44, 0.24, 0.16))
    p.cut_ell((0, 0.4, -0.55), (0.9, 0.7, 0.55))
    p.inside(ORANGE_D)
    p.layer('skin')
    finish(p, 1.5, 1.36)


# ======================================================================= GLOVES
def gloves():
    p = WProp('prop_word_gloves', oy=0.0, base=RED, voxel=0.012, target_faces=1300)
    for s in (-1, 1):
        x0 = s * 0.42
        g = 'm%d' % s
        p.blob((x0, 0.62, 0), (0.27, 0.3, 0.16), group=g)
        p.blob((x0 - s * 0.01, 0.86, 0), (0.24, 0.17, 0.15), group=g)
        p.blob((x0, 0.35, 0), (0.24, 0.12, 0.15), group=g)
        tg = 't%d' % s
        p.capsule((x0 + s * 0.17, 0.48, 0), (x0 + s * 0.31, 0.66, 0.0), 0.095, r2=0.09, group=tg)
    p.layer('flakes', base=WHITE, voxel=0.006, target_faces=600, quadriflow=False)
    for s in (-1, 1):
        p.sticker(star_poly(0.16, inner=0.3, n=6, rot=90), (s * 0.42, 0.64), thick=0.03, lift=0.012, step=0.018)
        p.sticker(circle_poly(0.03, n=10), (s * 0.42 - s * 0.12, 0.88), thick=0.03, lift=0.012, step=0.02)
        p.sticker(circle_poly(0.025, n=10), (s * 0.42 + s * 0.08, 0.42), thick=0.03, lift=0.012, step=0.02)
    p.layer('cuffs', base=CREAM, voxel=0.008, target_faces=800, quadriflow=False)
    for s in (-1, 1):
        rib_band(p, (s * 0.42, 0.0, 0), (s * 0.42, 0.26, 0), 0.22, n=20, amp=0.016, scale=(1, 0.66), end=0.035)
    p.layer('string', base=CREAM, voxel=0.01, target_faces=300)
    st = [(-0.4, 0.08, 0.14), (-0.32, 0.05, 0.3), (-0.16, 0.045, 0.44), (0, 0.045, 0.48), (0.16, 0.045, 0.44), (0.32, 0.05, 0.3), (0.4, 0.08, 0.14)]
    p.tube(rounded(st, 0.05, n=3), 0.042, rseg=8)
    p.layer('skin')
    finish(p, 1.05, 1.5)


# ======================================================================= SCARF
def scarf():
    p = WProp('prop_word_scarf', oy=0.15, base=PURPLE, voxel=0.011, target_faces=1800)
    YL = 1.42
    # the loop round the (invisible) neck: a fat soft ring, lower at the front so it reads as wrapped
    for k in range(30):
        a = TAU * k / 30
        x, z = 0.38 * math.sin(a), 0.32 * math.cos(a)
        y = YL - 0.12 * math.cos(a)
        p.blob((x, y, z), (0.15, 0.135, 0.15), group='loop')
    # both ends hang from the front left, side by side and overlapping, at different lengths: flat knitted bands
    ends = {-1: [(-0.1, 1.26, 0.42), (-0.19, 1.0, 0.46), (-0.22, 0.66, 0.45), (-0.26, 0.38, 0.44)],
            1: [(0.06, 1.26, 0.36), (0.02, 1.02, 0.38), (0.02, 0.8, 0.37), (0.03, 0.64, 0.36)]}
    for s, pts in ends.items():
        P = [Vector(q) for q in rounded(pts, 0.1, n=3)]
        cum = [0.0]
        for a, b in zip(P, P[1:]):
            cum.append(cum[-1] + (b - a).length)
        n = int(cum[-1] / 0.035)
        for i in range(n + 1):
            u = cum[-1] * i / n
            k = max(j for j in range(len(P) - 1) if cum[j] <= u + 1e-9)
            q = P[k].lerp(P[k + 1], (u - cum[k]) / max(1e-9, cum[k + 1] - cum[k]))
            d = (P[k + 1] - P[k]).normalized()
            tilt = math.degrees(math.atan2(d.x, -d.y))
            band = int(math.floor((1.2 - q.y + 0.04) / 0.16)) if q.y < 1.2 else -1
            p.layer('yellow' if band % 2 == 1 else 'skin', base=YELLOW, voxel=0.011, target_faces=900)
            p.blob(tuple(q), (0.165, 0.05, 0.05), rot=(0, 0, tilt), group='end%d_%d' % (s, band))
    p.layer('skin')
    p.blob((-0.02, 1.27, 0.4), (0.17, 0.11, 0.1), group='knot')
    ST = 0.16
    def yellow(q):
        if q.z > 0.28 and q.y < 1.2:                       # the hanging ends are striped by layers
            return False
        a = math.atan2(q.x, q.z)
        return int(math.floor((a / TAU) * 14 + 100.5)) % 2 == 0
    p.paint_fn(lambda q, n: yellow(q), YELLOW)
    p.layer('fringe', base=YELLOW, voxel=0.008, target_faces=600)
    for s, pts in ends.items():
        bx, by, bz = pts[-1]
        dx = (pts[-1][0] - pts[-2][0]) * 0.35
        for k in range(4):
            x = bx + (-0.105 + 0.07 * k)
            p.capsule((x, by - 0.02, bz), (x + dx + 0.012 * (k - 1.5), by - 0.2, bz + 0.01), 0.042, group='f%d%d' % (s, k))
    p.layer('skin')
    p.bone('body', (0, 0.15, 0), (0, YL, 0), region=lambda q: q.y > 1.2 or q.z < 0.28)
    for s, nm in ((-1, 'L'), (1, 'R')):
        pts = ends[s]
        top = (pts[0][0], 1.22, pts[0][2])
        mid = pts[len(pts) // 2]
        bot = (pts[-1][0], pts[-1][1] - 0.22, pts[-1][2])
        p.bone('tail.%s.1' % nm, top, mid, parent='body', region=lambda q, s=s: (q.z > 0.4 if s < 0 else q.z <= 0.4) and q.y < 1.2 and q.z > 0.28)
        p.bone('tail.%s.2' % nm, mid, bot, parent='tail.%s.1' % nm, region=lambda q, s=s, my=mid[1]: (q.z > 0.4 if s < 0 else q.z <= 0.4) and q.y < my + 0.05 and q.z > 0.28)
    finish(p, 1.45, 1.2, bones=False)


# ======================================================================= ZIP
def zip_():
    p = WProp('prop_word_zip', oy=0.0, base=BLUE, voxel=0.012, target_faces=1000)
    p.layers['skin']['quadriflow'] = False
    W, H, T, YV = 0.92, 1.8, 0.12, 1.0
    # closed cloth below the V, two flaps opening above it
    p.box((0, YV / 2 + 0.02, 0), (W / 2, YV / 2 + 0.02, T / 2), bevel=0.05)
    for s in (-1, 1):
        a = math.radians(-s * 13)
        cx, cy = s * (W / 4) + math.sin(-a) * 0.0, YV + (H - YV) / 2
        # pivot about the bottom of the V (x = 0, y = YV)
        hx, hy = W / 4, (H - YV) / 2 + 0.06
        ox, oy = s * hx, hy - 0.06
        rx = ox * math.cos(a) - oy * math.sin(a)
        ry = ox * math.sin(a) + oy * math.cos(a)
        p.box((rx + s * 0.005, YV + ry, 0), (hx, hy, T / 2), rot=(0, 0, math.degrees(a)), bevel=0.05)
    p.paint_fn(lambda q, n: abs(n.z) > 0.6 and (abs(abs(q.x) - (W / 2 - 0.08)) < 0.012 and q.y < YV) , BLUE_D)
    p.layer('teeth', base=YELLOW, voxel=0.007, target_faces=1000)
    k = 0
    y = 0.12
    while y < YV - 0.02:
        s = 1 if k % 2 else -1
        p.blob((s * 0.06, y, 0.01), (0.125, 0.058, 0.12), group='tc%d' % k)
        y += 0.115; k += 1
    for s in (-1, 1):
        a = math.radians(-s * 13)
        for j in range(7):
            d = 0.13 + j * 0.125
            ox, oy = s * 0.06, d
            x = ox * math.cos(a) - oy * math.sin(a)
            yy = YV + ox * math.sin(a) + oy * math.cos(a)
            p.blob((x, yy, 0.01), (0.11, 0.056, 0.12), rot=(0, 0, math.degrees(a)), group='to%d%d' % (s, j))
    p.layer('pull', base=RED, voxel=0.008, target_faces=800)
    p.box((0, YV + 0.02, 0.0), (0.12, 0.14, 0.11), bevel=0.06)
    p.box((0, YV - 0.26, 0.13), (0.1, 0.19, 0.035), rot=(10, 0, 0), bevel=0.03)
    p.capsule((0, YV - 0.05, 0.11), (0, YV - 0.1, 0.13), 0.045, group='lnk')
    p.blob((0, YV - 0.36, 0.15), (0.045, 0.045, 0.06), group='hole', negative=True)
    p.paint('hl', (-0.06, YV + 0.08, 0.12), (0.03, 0.04, 0.03), RED_L)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, YV, 0))
    p.bone('pull', (0, YV - 0.4, 0.1), (0, YV + 0.2, 0.1), parent='body', region=lambda q: abs(q.x) < 0.15 and q.z > 0.0 and q.y < YV + 0.18 and q.y > YV - 0.5 and abs(q.z) > -1)
    for s, nm in ((-1, 'L'), (1, 'R')):
        p.bone('flap.' + nm, (0, YV, 0), (s * 0.4, H, 0), parent='body', region=lambda q, s=s: q.y > YV + 0.04 and q.x * s > -0.02)
    finish(p, H, W + 0.2, bones=False)


# ======================================================================= BAG
def bag():
    p = WProp('prop_word_bag', oy=0.026, base=GREEN, voxel=0.013, target_faces=1300)
    p.box((0, 0.7, 0), (0.52, 0.68, 0.3), bevel=0.28)
    p.blob((0, 1.15, 0), (0.5, 0.3, 0.29), group='top')
    p.paint_fn(lambda q, n: n.y > 0.2 and abs(q.z) < 0.02 and q.y > 1.1, YELLOW_D)
    p.layer('pocket', base=GREEN_D, voxel=0.011, target_faces=700)
    p.box((0, 0.42, 0.29), (0.4, 0.3, 0.11), bevel=0.1)
    p.blob((0, 0.6, 0.3), (0.39, 0.13, 0.11), group='pt')
    zip_pts = [(x, 0.7 - 0.07 * (x / 0.37) ** 2) for x in [-0.34 + 0.68 * k / 20 for k in range(21)]]
    p.paint_fn(lambda q, n: n.z > 0.2 and poly_dist(q.x, q.y, zip_pts) < 0.022, YELLOW)
    p.layer('straps', base=ORANGE, voxel=0.01, target_faces=700)
    for s in (-1, 1):
        pts = [(s * 0.22, 1.32, -0.24), (s * 0.48, 1.18, -0.34), (s * 0.66, 0.85, -0.3), (s * 0.64, 0.45, -0.24), (s * 0.45, 0.18, -0.2)]
        pts = rounded(pts, 0.12, n=3)
        for q in pts:
            p.blob(q, (0.07, 0.07, 0.05), group='st%d' % s)
    p.layer('loop', base=ORANGE, voxel=0.008, target_faces=300)
    p.tube([(-0.14, 1.36, -0.05)] + [(0.14 * math.cos(a), 1.4 + 0.17 * math.sin(a), -0.05) for a in [math.pi - math.pi * k / 10 for k in range(11)]] + [(0.14, 1.36, -0.05)], 0.045, rseg=8)
    p.layer('patch', base=TAN, voxel=0.006, target_faces=500, quadriflow=False)
    p.sticker(circle_poly(0.155, n=36), (0, 0.39), onto='pocket', thick=0.03, lift=0.012, step=0.02)
    p.paint('eL', (-0.055, 0.42, 0.42), (0.022, 0.026, 0.2), INK)
    p.paint('eR', (0.055, 0.42, 0.42), (0.022, 0.026, 0.2), INK)
    p.paint('nose', (0.0, 0.35, 0.42), (0.035, 0.025, 0.2), BROWN_D)
    p.layer('ears', base=BROWN, voxel=0.006, target_faces=300, quadriflow=False)
    for s in (-1, 1):
        p.sticker(circle_poly(0.06, n=20), (s * 0.12, 0.52), onto='pocket', thick=0.03, lift=0.008, step=0.02)
    p.layer('skin')
    finish(p, 1.57, 1.36)


# ======================================================================= NECKLACE
def necklace():
    p = WProp('prop_word_necklace', oy=0.183, base=RED, voxel=0.01, target_faces=600)
    RX, RZ, YT, D = 0.5, 0.32, 1.5, 0.95
    def cpt(a):
        c = max(0.0, math.cos(a))
        return Vector((RX * math.sin(a) * (1 + 0.15 * c), YT - D * c ** 1.6, RZ * math.cos(a)))
    # arc-length sample the loop: 16 slots, slot 0 (front bottom) is the heart
    N = 400
    pts = [cpt(TAU * i / N) for i in range(N + 1)]
    cum = [0.0]
    for i in range(N):
        cum.append(cum[-1] + (pts[i + 1] - pts[i]).length)
    Ltot = cum[-1]
    def at(s):
        s %= Ltot
        for i in range(N):
            if cum[i + 1] >= s:
                t = (s - cum[i]) / max(1e-9, cum[i + 1] - cum[i])
                return pts[i].lerp(pts[i + 1], t)
    COLS = [RED, YELLOW, BLUE, GREEN]
    names = ['skin', 'yellow', 'blue', 'green']
    gap = Ltot / 17.2
    # 15 beads spread round the loop, leaving the front bottom slot for the heart
    beads = []
    for k in range(15):
        s = gap * 1.1 + (Ltot - 2.2 * gap) * k / 14
        beads.append(at(s))
    for k, q in enumerate(beads):
        L = names[k % 4]
        if L != 'skin':
            p.layer(L, base=COLS[k % 4], voxel=0.01, target_faces=450)
        r = 0.105 if q.z > 0 else 0.095
        p.blob(tuple(q), (r, r, r), group='b%d' % k)
        p.layer('skin')
    p.layer('cord', base=CREAM, voxel=0.008, target_faces=300)
    p.tube([tuple(at(s)) for s in [gap * 0.2 * j for j in range(int(Ltot / (gap * 0.2)) + 1)]], 0.022, closed=True, rseg=6)
    # the heart bead hangs at the front bottom
    p.layer('heart', base=PINK, voxel=0.009, target_faces=500)
    hb = at(0)
    hy = hb.y - 0.2
    p.prism(heart_poly(0.2), -0.08, 0.08, bevel=0.06, at=(0, hy, hb.z))
    p.blob((0, hb.y - 0.03, hb.z), (0.05, 0.05, 0.05), group='bail')
    p.paint('hl', (-0.07, hy + 0.08, hb.z + 0.1), (0.035, 0.03, 0.06), PINK_L)
    p.layer('skin')
    lo = 0.183
    p.bone('body', (0, lo, 0), (0, YT, 0))
    p.bone('tail.1', (0, hb.y + 0.02, hb.z), (0, lo, hb.z), parent='body', region=lambda q: q.y < hb.y - 0.03 and abs(q.x) < 0.25)
    print('heart bottom', lo)
    finish(p, YT + 0.12 - lo, 1.2, bones=False)


# ======================================================================= X-RAY
def xray():
    NAVY, NAVY_D = 0x2c3a6e, 0x232e58
    p = WProp('prop_word_xray', oy=0.0, base=NAVY, voxel=0.012, target_faces=900)
    PW, PH, Y0 = 0.66, 0.82, 0.42
    plate = rounded([(-PW, Y0), (PW, Y0), (PW, Y0 + 2 * PH), (-PW, Y0 + 2 * PH)], 0.18, n=4, closed=True)
    p.prism(plate, -0.07, 0.07, bevel=0.04)
    p.layer('rim', base=SKY, voxel=0.01, target_faces=500)
    p.tube([(x, y, 0.0) for x, y in densify(plate, 0.05)], 0.055, closed=True, rseg=8)
    p.layer('stand', base=GREY, voxel=0.011, target_faces=600)
    p.box((0, 0.07, 0), (0.42, 0.07, 0.28), bevel=0.065)
    p.cyl((0, 0.1, -0.02), 0.075, 0.36, bevel=0.03)
    p.box((0, Y0 + 0.02, -0.02), (0.18, 0.06, 0.11), bevel=0.04)
    p.paint_fn(lambda q, n: q.y > 0.11 and q.y < 0.15 and n.y < 0.5, GREY_L)
    # the friendly hand skeleton, fat rounded bones in their own layer
    p.layer('bones', base=WHITE, voxel=0.0075, target_faces=1400)
    zf = 0.085
    def bone_(a, b, r, g):
        a = Vector((a[0], a[1], zf)); b = Vector((b[0], b[1], zf))
        p.capsule(tuple(a), tuple(b), r * 0.82, group=g)
        p.blob(tuple(a), (r, r, r * 0.6), group=g)
        p.blob(tuple(b), (r, r, r * 0.6), group=g)
    bone_((-0.1, 0.5), (-0.08, 0.83), 0.055, 'ulna')
    bone_((0.1, 0.5), (0.09, 0.83), 0.06, 'radius')
    for k, (x, y) in enumerate([(-0.11, 0.92), (-0.03, 0.93), (0.05, 0.93), (0.12, 0.91), (-0.07, 1.0), (0.03, 1.01), (0.11, 1.0)]):
        p.blob((x, y, zf), (0.04, 0.035, 0.03), group='carp%d' % k)
    fingers = [(-0.2, 1.72, 3, -0.17), (-0.07, 1.82, 3, -0.06), (0.06, 1.8, 3, 0.05), (0.18, 1.68, 3, 0.15)]
    bases = [(-0.12, 1.06), (-0.04, 1.08), (0.04, 1.08), (0.12, 1.06)]
    for i, ((tx, ty, n, sp), (bx, by)) in enumerate(zip(fingers, bases)):
        # metacarpal then n phalanges, little gaps between
        kx, ky = bx + sp * 0.5, by + 0.25
        bone_((bx, by + 0.02), (kx, ky), 0.035, 'mc%d' % i)
        d = Vector((tx - kx, ty - ky)); L = d.length; d.normalize()
        seg = L / n
        for j in range(n):
            a = (kx + d.x * (j * seg + 0.045), ky + d.y * (j * seg + 0.045))
            b = (kx + d.x * ((j + 1) * seg - 0.035), ky + d.y * ((j + 1) * seg - 0.035))
            bone_(a, b, 0.036 - 0.003 * j, 'ph%d%d' % (i, j))
    # thumb out to the side
    bone_((0.17, 1.0), (0.3, 1.13), 0.036, 'th0')
    bone_((0.34, 1.18), (0.42, 1.3), 0.035, 'th1')
    bone_((0.45, 1.35), (0.5, 1.44), 0.033, 'th2')
    p.layer('skin')
    finish(p, Y0 + 2 * PH + 0.05, 2 * PW + 0.1)


# ======================================================================= SHOE
def shoe():
    p = WProp('prop_word_shoe', oy=0.0, base=RED, voxel=0.012, target_faces=1200)
    # upper: heel and ankle at -x, a long rounded vamp to the toe at +x
    p.blob((-0.36, 0.5, 0), (0.33, 0.33, 0.29), group='up')
    p.blob((-0.32, 0.72, 0), (0.29, 0.22, 0.26), group='up')
    p.blob((0.05, 0.38, 0), (0.42, 0.22, 0.3), group='up')
    p.blob((0.42, 0.3, 0), (0.3, 0.17, 0.29), group='up')
    p.blob((0.14, 0.5, 0), (0.24, 0.12, 0.2), rot=(0, 0, -28), group='up')       # the tongue ridge
    p.cut_ell((-0.32, 0.98, 0), (0.22, 0.2, 0.18), rot=(0, 0, -8))               # the ankle opening
    p.paint_fn(lambda q, n: ((q.x - 0.62) / 0.36) ** 2 + ((q.y - 0.22) / 0.3) ** 2 < 1.0, WHITE)   # rubber toe cap
    p.paint_fn(lambda q, n: q.y > 0.84 and math.hypot((q.x + 0.32) / 0.26, q.z / 0.22) < 1.18 and n.y > 0.0, RED_D)
    p.inside(RED_D)
    # thick white sole
    p.layer('sole', base=WHITE, voxel=0.011, target_faces=700)
    foot = []
    for k in range(40):
        a = TAU * k / 40
        x = 0.78 * math.cos(a)
        w = 0.34 if x > 0.1 else 0.3 + 0.04 * (x + 0.78) / 0.88
        foot.append((x - 0.01, w * math.sin(a)))
    p.prism(foot, 0.0, 0.17, bevel=0.06, axis='y')
    p.paint_fn(lambda q, n: q.y < 0.05 and n.y > -0.5, GREY_L)
    # laces: three crosses on the tongue and a big bow
    p.layer('laces', base=WHITE, voxel=0.007, target_faces=700, quadriflow=False)
    for x in (0.33, 0.19, 0.05):
        for sg in (-1, 1):
            p.sticker(bar_poly(0.4, 0.075, math.pi / 2 + sg * 0.55, n=2), (x, 0.0), down=True, thick=0.045, lift=0.018, step=0.025)
    p.layer('bow', base=WHITE, voxel=0.008, target_faces=600)
    bx, by = -0.05, 0.8
    for sg in (-1, 1):
        p.blob((bx + 0.01, by + 0.07, sg * 0.13), (0.065, 0.085, 0.13), rot=(sg * 35, 0, 0), group='loop%d' % sg)
        p.blob((bx + 0.02, by + 0.08, sg * 0.15), (0.03, 0.04, 0.07), rot=(sg * 35, 0, 0), group='loop%d' % sg, negative=True)
        p.capsule((bx + 0.04, by - 0.01, sg * 0.04), (bx + 0.16, by - 0.15, sg * 0.2), 0.04, r2=0.042, group='tail%d' % sg)
    p.blob((bx, by + 0.01, 0), (0.06, 0.06, 0.065), group='knot')
    # yellow heel tab
    p.layer('tab', base=YELLOW, voxel=0.008, target_faces=300)
    p.tube([(-0.62, 0.62, -0.05), (-0.7, 0.72, -0.05), (-0.73, 0.86, -0.0), (-0.7, 0.96, 0.0), (-0.62, 0.92, 0.0)], 0.05, rseg=8)
    p.blob((-0.67, 0.75, 0), (0.06, 0.15, 0.09), group='tab')
    p.layer('skin')
    finish(p, 1.0, 1.6)


# ======================================================================= WELLIES (word-card variant of prop_wellies)
def wellies():
    """A pair of chunky yellow wellies seen from the side (toes toward +x), one a little behind the other."""
    p = WProp('prop_word_wellies', oy=0.0, base=YELLOW, voxel=0.012, target_faces=1300)
    BOOTS = ((-0.27, -0.24), (0.27, 0.24))        # (x offset, z offset): back boot left, front boot right
    for bx, bz in BOOTS:
        g = 'b%d' % (bx > 0)
        p.cyl((bx - 0.16, 0.12, bz), 0.21, 0.92, r2=0.235, bevel=0.07, scale=(1, 0.9), seg=36)   # the shaft
        p.blob((bx + 0.12, 0.22, bz), (0.36, 0.17, 0.2), group=g)                             # the foot
        p.blob((bx + 0.33, 0.2, bz), (0.17, 0.15, 0.19), group=g)                              # round toe
        p.blob((bx - 0.1, 0.33, bz), (0.24, 0.22, 0.21), group=g)                              # instep
        p.cut_cap((bx - 0.16, 0.7, bz), (bx - 0.16, 1.6, bz), 0.155)                           # the opening
    p.paint_fn(lambda q, n: q.y > 0.95 and n.y < 0.6, YELLOW_D)                                # top band
    p.paint_fn(lambda q, n: n.z > 0.55 and abs(q.y - 0.58) < 0.03 and (q.x > -0.4), YELLOW_L)   # a shine stripe
    p.inside(YELLOW_D)
    # chunky treaded soles
    p.layer('soles', base=SLATE, voxel=0.01, target_faces=600)
    for bx, bz in BOOTS:
        p.box((bx + 0.05, 0.06, bz), (0.47, 0.06, 0.21), bevel=0.05)
        p.box((bx - 0.22, 0.09, bz), (0.14, 0.09, 0.2), bevel=0.05)                            # heel
    p.paint_fn(lambda q, n: n.y < -0.5, SLATE_D)
    # pull tabs at the back of the cuffs
    p.layer('tabs', base=YELLOW_D, voxel=0.008, target_faces=300)
    for bx, bz in BOOTS:
        p.tube([(bx - 0.36, 0.92, bz), (bx - 0.45, 0.98, bz), (bx - 0.46, 1.08, bz), (bx - 0.38, 1.1, bz)], 0.04, rseg=7)
    p.layer('skin')
    finish(p, 1.12, 1.3)


# ======================================================================= BUTTON (word-card variant of prop_m_button)
def button():
    """A big chunky red sewing button standing on its edge, facing +z: a raised rim, a dished centre, four holes."""
    p = WProp('prop_word_button', oy=0.01, base=RED, voxel=0.011, target_faces=900)
    R, T, C = 0.9, 0.17, 0.9         # radius, half thickness, centre height
    prof = rounded([(0, -T), (R - 0.05, -T), (R, -0.06), (R, 0.06), (R - 0.06, T + 0.03), (R - 0.2, T + 0.04), (R - 0.3, 0.08)], 0.05, n=1)
    prof += [(0.45, 0.065), (0.34, 0.06), (0.22, 0.06), (0.1, 0.06), (0, 0.06)]     # rings across the dish: no long fan slivers
    p.lathe(prof, pos=(0, C, 0), rot=(-90, 0, 0), seg=32)
    p.cut_tris = 360
    for sx in (-1, 1):
        for sy in (-1, 1):
            p.cut_cap((sx * 0.22, C + sy * 0.22, -1.0), (sx * 0.22, C + sy * 0.22, 1.0), 0.12)
    p.paint_fn(lambda q, n: math.hypot(q.x, q.y - C) < R - 0.31 and n.z > 0.5, RED_D)             # the dished centre
    p.inside(RED_D)
    p.layer('skin')
    finish(p, 2 * R + 0.06, 2 * R)


# ======================================================================= HAT (word-card variant of prop_hat)
def hat():
    """A woolly bobble hat: a knitted dome with soft vertical ribs, a white turned-up ribbed cuff and a big bobble."""
    p = WProp('prop_word_hat', oy=0.022, base=BLUE, voxel=0.012, target_faces=1300)
    H0, H1, RB = 0.3, 1.25, 0.62     # cuff top, crown top, radius at the cuff
    verts, faces = [], []
    SEG, NY = 64, 22
    for k in range(NY + 1):
        t = k / NY
        y = H0 - 0.05 + (H1 - H0 + 0.05) * t
        r0 = RB * math.sqrt(max(0.0, 1 - t ** 2.2)) * (1 + 0.04 * math.sin(t * math.pi))
        for i in range(SEG):
            th = TAU * i / SEG
            r = r0 * (1 + 0.035 * math.cos(16 * th) * (1 - t))      # knit ribs, fading toward the crown
            verts.append((r * math.sin(th), y, r * math.cos(th)))
    for k in range(NY):
        for i in range(SEG):
            j = (i + 1) % SEG
            faces.append((k * SEG + i, k * SEG + j, (k + 1) * SEG + j, (k + 1) * SEG + i))
    c0 = len(verts); verts.append((0, H0 - 0.05, 0)); c1 = len(verts); verts.append((0, H1, 0))
    for i in range(SEG):
        j = (i + 1) % SEG
        faces.append((c0, j, i)); faces.append((c1, NY * SEG + i, NY * SEG + j))
    p.mesh(verts, faces)
    p.paint_fn(lambda q, n: abs(q.y - 0.72) < 0.07 and n.y < 0.7, WHITE)        # a white knitted stripe
    # turned-up ribbed cuff
    p.layer('cuff', base=WHITE, voxel=0.008, target_faces=900, quadriflow=False)
    rib_band(p, (0, 0.0, 0), (0, 0.36, 0), RB + 0.03, n=24, amp=0.024, seg=72, end=0.05, rings=7)
    p.cut_cap((0, 0.2, 0), (0, -1.0, 0), RB - 0.08)
    p.inside(WHITE_D)
    # big fluffy bobble
    p.layer('bobble', base=YELLOW, voxel=0.01, target_faces=600)
    for k in range(9):
        a = TAU * k / 9
        p.blob((0.12 * math.sin(a), H1 + 0.2 + 0.07 * math.cos(2 * a), 0.12 * math.cos(a)), (0.17, 0.16, 0.17), group='bob')
    p.blob((0, H1 + 0.22, 0), (0.22, 0.2, 0.22), group='bob')
    p.paint_fn(lambda q, n: n.y < -0.3, YELLOW_D)
    p.layer('skin')
    finish(p, H1 + 0.44, 2 * RB + 0.1)


MODELS = dict(prop_word_shoe=shoe, prop_word_coat=coat, prop_word_jumper=jumper, prop_word_tshirt=tshirt,
              prop_word_trousers=trousers, prop_word_shorts=shorts, prop_word_dress=dress, prop_word_pyjamas=pyjamas,
              prop_word_nappy=nappy, prop_word_bib=bib, prop_word_gloves=gloves, prop_word_scarf=scarf,
              prop_word_zip=zip_, prop_word_bag=bag, prop_word_necklace=necklace, prop_word_xray=xray,
              prop_word_wellies=wellies, prop_word_button=button, prop_word_hat=hat)
BUDGETS = dict(prop_word_shoe=2500, prop_word_coat=3500, prop_word_jumper=3000, prop_word_tshirt=2000, prop_word_trousers=2500, prop_word_shorts=1800, prop_word_dress=3000, prop_word_pyjamas=3500, prop_word_nappy=1800, prop_word_bib=1500, prop_word_gloves=2500, prop_word_scarf=2500, prop_word_zip=2500, prop_word_bag=3000, prop_word_necklace=2500, prop_word_xray=2500, prop_word_wellies=2500, prop_word_button=1200, prop_word_hat=2500)   # VOCAB.md 'tris' column
run_models(MODELS, BUDGETS, ONLY)
