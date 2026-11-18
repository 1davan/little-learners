"""Candy beats (Home world). One script, several models (ONLY=prop_cd_bean,... builds a subset). Game space, +z faces us,
every model stands on y = 0.
The five singing candies (one colour = one note, low to high; each has a code face that opens its mouth to sing):
  prop_cd_bean    red jelly bean lying along x (~1.2 x 0.7 x 0.55), kidney-curved, a glossy shine.            (C)
  prop_cd_wrap    orange round sweet in a twist wrapper: a glossy ball r ~0.42 with pleated fan ends (layer 'wrap')
                  out to x +-0.82.                                                                             (D)
  prop_cd_drop    yellow teardrop drop (~1.0 wide, 1.12 tall), point up.                                       (E)
  prop_cd_gummy   green chunky square gummy (0.92 x 0.86 x 0.62) with a lighter bevelled front window.         (F)
  prop_cd_lolly   blue swirl lollipop: a disc r 0.52 (centre y 1.0) on a white stick (layer 'stick') standing in
                  a pink marshmallow (layer 'base').                                                           (G)
Stage and progress:
  prop_cd_stage   a long strawberry-cake stage 10.6 x 0.55 x 3.2 (top of the icing at y 0.61) with icing drips
                  (layer 'icing'), front sprinkles (layer 'sprinkles') and two striped candy canes at the back
                  corners (layer 'canes', up to y 4.4) holding a cream music board (layer 'board', x +-4.7,
                  y 2.92-4.04, front z -1.11) with a tintable frame (layer 'frame').
  prop_cd_jar     a glass sweet jar (layer 'glass', drawn see-through in game; inner floor y 0.07, inner r 0.6,
                  1.45 tall) with a glass rim (layer 'rim') and a pink polka-dot lid with a red knob (layer 'lid').
  prop_cd_pill    a short sugar tile for the phrase track (0.56 x 0.36 x 0.14), white so the game can tint it.
  prop_cd_pill2   a long one (1.3 x 0.36 x 0.14) for long notes.
"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded
from mathutils import Vector

ONLY = [s for s in os.environ.get('ONLY', '').split(',') if s]
want = lambda n: not ONLY or n in ONLY
TAU = math.tau
SHINE = 0xfffaf4


def finish(p, h, outline=0.02):
    p.bone('body', (0, 0, 0), (0, max(h, 0.3), 0))
    p.extras['outline'] = outline
    p.build()


def shine(p, spots):
    p.layer('shine', base=SHINE, target_faces=260, voxel=0.006)
    for i, (c, s, r) in enumerate(spots):
        p.blob(c, s, rot=r, group='sh%d' % i)
    p.layer('skin')


# ---------------- C: red jelly bean ----------------
def bean():
    RED, RED_D = 0xff3d57, 0xe82e4a
    p = Prop('prop_cd_bean', base=RED, target_faces=1800, voxel=0.01, smooth=4)
    pts = [(-0.5, 0.41, 0), (-0.27, 0.33, 0), (0, 0.305, 0), (0.27, 0.33, 0), (0.5, 0.41, 0)]
    p.curve(pts, [0.29, 0.3, 0.3, 0.3, 0.29], group='bean', flat=0.92, per=6)
    shine(p, [((-0.36, 0.6, 0.16), (0.13, 0.05, 0.035), (-20, -25, 18)), ((-0.53, 0.52, 0.17), (0.035, 0.03, 0.025), (0, 0, 0)),
              ((0.42, 0.62, 0.1), (0.07, 0.03, 0.025), (-25, 20, -15))])
    p.face(center=(0, 0.33, 0), radius=0.42, bone='body', faceScale=1.0)
    finish(p, 0.72)


# ---------------- D: orange wrapped sweet ----------------
def wrap():
    ORANGE, WRAP, PLEAT = 0xff9420, 0xffc25e, 0xf4a640
    p = Prop('prop_cd_wrap', base=ORANGE, target_faces=1800, voxel=0.01, smooth=4)
    p.blob((0, 0.43, 0), (0.45, 0.42, 0.37), group='ball')
    shine(p, [((-0.2, 0.68, 0.24), (0.12, 0.055, 0.035), (-30, -28, 30)), ((-0.33, 0.56, 0.28), (0.03, 0.028, 0.02), (0, 0, 0))])
    p.layer('wrap', base=WRAP, target_faces=1600, voxel=0.008)
    for s in (-1, 1):
        # the twist, then a pleated fan opening outward
        p.blob((s * 0.45, 0.43, 0), (0.09, 0.1, 0.09), group='tw%d' % s)
        for k in range(7):
            t = k / 6
            x = s * (0.5 + 0.3 * t)
            ry = 0.08 + 0.22 * t ** 0.8
            p.blob((x, 0.43, 0), (0.05, ry, ry * 0.42), group='fan%d' % s)
        # little rounded scallops along the fan's outer edge
        for k in range(5):
            a = (k - 2) / 2 * 0.95
            p.blob((s * 0.8, 0.43 + math.sin(a) * 0.27, 0), (0.05, 0.07, 0.07), group='fan%d' % s)
    # pleats: darker grooves fanning out from the twist
    def pleat(q, n):
        if abs(q.x) < 0.52:
            return False
        a = math.atan2(q.y - 0.43, abs(q.x) - 0.44)
        return abs(math.sin(a * 9)) < 0.22
    p.paint_fn(pleat, PLEAT)
    p.layer('skin')
    p.face(center=(0, 0.42, 0), radius=0.42, bone='body', faceScale=1.0)
    finish(p, 0.86)


# ---------------- E: yellow drop ----------------
def drop():
    YEL, YEL_D = 0xffd21f, 0xf5b90f
    p = Prop('prop_cd_drop', base=YEL, target_faces=1800, voxel=0.01, smooth=4)
    prof = rounded([(0, 0.0), (0.3, 0.01), (0.47, 0.14), (0.52, 0.34), (0.47, 0.56), (0.33, 0.76), (0.17, 0.95), (0.06, 1.08), (0, 1.12)], 0.08, n=5)
    p.lathe(prof, seg=56, scale=(1, 0.78))
    p.paint_fn(lambda q, n: n.y < -0.6, YEL_D)
    shine(p, [((-0.2, 0.66, 0.27), (0.04, 0.13, 0.03), (-25, -30, -28)), ((-0.32, 0.44, 0.33), (0.035, 0.03, 0.022), (0, 0, 0))])
    p.face(center=(0, 0.4, 0), radius=0.44, bone='body', faceScale=1.0)
    finish(p, 1.12)


# ---------------- F: green square gummy ----------------
def gummy():
    GREEN, WINDOW, GREEN_D = 0x36c24c, 0x6ee070, 0x27a23e
    p = Prop('prop_cd_gummy', base=GREEN, target_faces=1800, voxel=0.01, smooth=3)
    p.box((0, 0.43, 0), (0.46, 0.43, 0.31), bevel=0.2)
    # a lighter bevelled window on the front, like a cut sweet
    p.paint_fn(lambda q, n: n.z > 0.8 and abs(q.x) < 0.3 and abs(q.y - 0.43) < 0.28, WINDOW)
    p.paint_fn(lambda q, n: n.y < -0.6, GREEN_D)
    shine(p, [((-0.28, 0.7, 0.29), (0.1, 0.035, 0.03), (0, 0, 20)), ((-0.36, 0.58, 0.3), (0.03, 0.028, 0.02), (0, 0, 0))])
    p.face(center=(0, 0.42, -0.075), radius=0.42, bone='body', faceScale=1.0, snap=False)
    finish(p, 0.86)


# ---------------- G: blue swirl lollipop ----------------
def lolly():
    BLUE, SWIRL, STICK, MALLOW, MALLOW_D = 0x3f8cff, 0x8fc4ff, 0xfff4e6, 0xffc2da, 0xffa8c8
    p = Prop('prop_cd_lolly', base=BLUE, target_faces=2000, voxel=0.01, smooth=3)
    C = 1.0
    prof = rounded([(0, -0.13), (0.52, -0.13), (0.55, 0.0), (0.52, 0.13), (0, 0.13)], 0.11, n=5)
    p.lathe(prof, pos=(0, C, 0), rot=(90, 0, 0), seg=56)

    def swirl(q, n):
        x, y = q.x, q.y - C
        r = math.hypot(x, y)
        if r < 0.06:
            return False
        a = math.atan2(y, x)
        return ((r / 0.55) * 2.2 - a / TAU) % 1.0 < 0.38
    p.paint_fn(swirl, SWIRL)
    shine(p, [((-0.26, C + 0.32, 0.135), (0.11, 0.04, 0.02), (0, 0, 35)), ((-0.39, C + 0.17, 0.13), (0.03, 0.028, 0.018), (0, 0, 0))])
    p.layer('stick', base=STICK, target_faces=300, voxel=0.007)
    p.cyl((0, 0.12, 0), 0.055, C - 0.5, bevel=0.02, seg=16)
    p.layer('base', base=MALLOW, target_faces=700, voxel=0.008)
    p.cyl((0, 0, 0), 0.27, 0.26, r2=0.25, bevel=0.1, seg=36)
    p.paint_fn(lambda q, n: n.y > 0.7, 0xffd6e6)
    p.paint_fn(lambda q, n: n.y < -0.6, MALLOW_D)
    p.layer('skin')
    p.face(center=(0, C - 0.02, -0.255), radius=0.42, bone='body', faceScale=1.0, snap=False)
    finish(p, 1.55)


# ---------------- the stage ----------------
def stage():
    PINK, PINK_D, ICING = 0xffffff, 0xe6dde2, 0xffffff   # white: the game tints body and icing per level
    p = Prop('prop_cd_stage', base=PINK, target_faces=3200, voxel=0.03, smooth=3)
    p.box((0, 0.26, 0), (5.3, 0.26, 1.6), bevel=0.22)
    p.paint_fn(lambda q, n: q.y < 0.07, PINK_D)
    p.layer('icing', base=ICING, target_faces=2600, voxel=0.022)
    p.box((0, 0.55, 0), (5.36, 0.06, 1.66), bevel=0.06)
    import random
    rnd = random.Random(7)
    x = -5.2
    while x < 5.25:
        ln = 0.1 + rnd.random() * 0.17
        p.capsule((x, 0.55, 1.67), (x, 0.55 - ln, 1.69), 0.085, r2=0.075, group='d%.2f' % x)
        x += 0.36 + rnd.random() * 0.12
    for s in (-1, 1):   # drips down the two ends too
        for z in (-1.1, -0.45, 0.25, 0.95):
            ln = 0.12 + rnd.random() * 0.14
            p.capsule((s * 5.37, 0.55, z), (s * 5.39, 0.55 - ln, z), 0.08, r2=0.07, group='e%d%.1f' % (s, z))
    p.layer('sprinkles', base=0xffffff, target_faces=1500, voxel=0.01)
    cols = [0xffd23f, 0x5ec8ff, 0x7fe07a, 0xffffff, 0xb48cff]
    k = 0
    for i in range(30):
        sx = -5.0 + i * 10.0 / 29 + (rnd.random() - 0.5) * 0.15
        sy = 0.13 + rnd.random() * 0.2
        a = rnd.random() * 180
        ca, sa = math.cos(math.radians(a)) * 0.06, math.sin(math.radians(a)) * 0.06
        g = 'sp%d' % i
        p.capsule((sx - ca, sy - sa, 1.61), (sx + ca, sy + sa, 1.61), 0.028, group=g)
        p.paint_group(g, cols[k % len(cols)]); k += 1
    p.layer('canes', base=0xfffaf6, target_faces=2400, voxel=0.012)
    for s in (-1, 1):
        cx, cz = s * 4.85, -1.15
        path = [(cx, 0.5, cz), (cx, 2.0, cz), (cx, 4.1, cz)]
        for k2 in range(1, 10):   # the hooks curl outward, away from the music board
            a = math.pi * k2 / 9
            path.append((cx + s * 0.32 * (1 - math.cos(a)), 4.1 + 0.32 * math.sin(a), cz))
        path.append((cx + s * 0.64, 3.95, cz))
        p.tube(rounded(path, 0.1, n=3), 0.13, rseg=14)

    def stripe(q, n):
        return ((q.y * 1.3 + q.x * 0.9 * (1 if q.x > 0 else -1)) * 2.2) % 1.0 < 0.45
    p.paint_fn(stripe, 0xff3d57)
    # the music board hung between the canes (the phrase track sits on it): a cream panel in a frame the game tints
    p.layer('board', base=0xfffaf0, target_faces=600, voxel=0.03)
    p.box((0, 3.48, -1.17), (4.7, 0.56, 0.06), bevel=0.05)
    p.layer('frame', base=0xffffff, target_faces=1400, voxel=0.02)
    ring = rounded([(-4.62, 2.98), (4.62, 2.98), (4.62, 3.98), (-4.62, 3.98)], 0.16, n=4, closed=True)
    p.tube([(x, y, -1.1) for x, y in ring], 0.075, closed=True, rseg=10)
    # a little shelf on the board's right end where the sweet jar stands (top y 2.86, front z -0.07)
    p.box((3.75, 2.81, -0.62), (0.86, 0.05, 0.55), bevel=0.04)
    for sx in (3.15, 4.35):
        p.blob((sx, 2.68, -1.0), (0.07, 0.13, 0.12), group='br%.2f' % sx)
    p.layer('skin')
    finish(p, 0.6, 0.03)


# ---------------- the sweet jar ----------------
def jar():
    GLASS, RIM, LID, DOT, KNOB = 0xdcf2ff, 0xc4e6ff, 0xff70a8, 0xfff4f8, 0xff3d5a
    p = Prop('prop_cd_jar', base=RIM, target_faces=900, voxel=0.01, smooth=2)
    p.ring((0, 1.36, 0), 0.56, 0.05, seg=48, rseg=10)
    p.ring((0, 0.04, 0), 0.62, 0.04, seg=48, rseg=8)
    p.layer('glass', base=GLASS, target_faces=2200, voxel=0.012)
    outer = [(0.62, 0.02), (0.7, 0.12), (0.73, 0.4), (0.73, 0.95), (0.68, 1.14), (0.56, 1.28), (0.54, 1.36)]
    inner = [(0.5, 1.36), (0.52, 1.27), (0.64, 1.13), (0.69, 0.95), (0.69, 0.4), (0.66, 0.14), (0.58, 0.07)]
    prof = rounded(outer, 0.06, n=3) + rounded(inner, 0.05, n=3)
    p.lathe(prof, closed=True, seg=56)
    p.cyl((0, 0.0, 0), 0.6, 0.07, bevel=0.02, seg=48)
    # glossy highlight streaks on the glass (front left), so the see-through jar reads as glass
    p.layer('shine', base=0xffffff, target_faces=300, voxel=0.006)
    for i, (ang, y0, y1, r) in enumerate([(-0.62, 0.3, 1.0, 0.035), (-0.42, 0.5, 0.85, 0.02)]):
        R = 0.745
        p.capsule((math.sin(ang) * R, y0, math.cos(ang) * R), (math.sin(ang) * R, y1, math.cos(ang) * R), r, group='g%d' % i)
    p.layer('lid', base=LID, target_faces=1600, voxel=0.01)
    lp = rounded([(0, 1.36), (0.6, 1.36), (0.62, 1.44), (0.55, 1.52), (0.3, 1.57), (0, 1.58)], 0.04, n=3)
    p.lathe(lp, seg=48)
    p.blob((0, 1.66, 0), (0.12, 0.11, 0.12), group='knob')
    p.paint('knob', (0, 1.66, 0), (0.16, 0.13, 0.16), KNOB)
    for i in range(7):
        a = TAU * i / 7 + 0.3
        p.paint('dot%d' % i, (math.sin(a) * 0.58, 1.43, math.cos(a) * 0.58), (0.06, 0.05, 0.06), DOT)
    p.layer('skin')
    finish(p, 1.7, 0.018)


# ---------------- A: purple gumdrop ----------------
def grape():
    PURPLE, PURPLE_D, SUGAR = 0xa258ef, 0x8c44d8, 0xe9d4ff
    p = Prop('prop_cd_grape', base=PURPLE, target_faces=1800, voxel=0.01, smooth=4)
    prof = rounded([(0, 0.0), (0.46, 0.0), (0.52, 0.08), (0.5, 0.3), (0.42, 0.58), (0.26, 0.8), (0.0, 0.86)], 0.12, n=5)
    p.lathe(prof, seg=56)
    p.paint_fn(lambda q, n: n.y < -0.6, PURPLE_D)
    # little sugar crystals sprinkled over the dome (kept off the face)
    import random
    rnd = random.Random(3)
    for i in range(46):
        a = rnd.random() * TAU
        y = 0.12 + rnd.random() * 0.68
        if math.cos(a) > 0.55 and 0.2 < y < 0.62:
            continue
        r = 0.5 * (1 - (y / 0.9) ** 2.2) + 0.01
        p.paint('s%d' % i, (math.sin(a) * r, y, math.cos(a) * r), (0.035, 0.035, 0.035), SUGAR)
    shine(p, [((-0.22, 0.66, 0.25), (0.11, 0.045, 0.03), (-35, -30, 30)), ((-0.36, 0.5, 0.3), (0.03, 0.028, 0.02), (0, 0, 0))])
    p.face(center=(0, 0.36, 0), radius=0.42, bone='body', faceScale=1.0)
    finish(p, 0.86)


# ---------------- a single candy cane (home icon) ----------------
def cane():
    p = Prop('prop_cd_cane', base=0xfffaf6, target_faces=1600, voxel=0.01, smooth=2)
    path = [(0, 0.08, 0), (0, 0.7, 0), (0, 1.15, 0)]
    for k in range(1, 10):
        a = math.pi * k / 9
        path.append((-0.26 * (1 - math.cos(a)), 1.15 + 0.26 * math.sin(a), 0))
    path.append((-0.52, 1.0, 0))
    p.tube(rounded(path, 0.08, n=3), 0.1, rseg=14)
    p.paint_fn(lambda q, n: ((q.y * 1.3 - q.x * 0.9) * 2.6) % 1.0 < 0.45, 0xff3d57)
    finish(p, 1.45, 0.018)


def pill(name, hx):
    p = Prop(name, base=0xffffff, target_faces=500, voxel=0.008, smooth=2)
    p.box((0, 0, 0), (hx, 0.18, 0.07), bevel=0.07)
    finish(p, 0.36, 0.016)


for name, fn in [('prop_cd_bean', bean), ('prop_cd_wrap', wrap), ('prop_cd_drop', drop), ('prop_cd_gummy', gummy),
                 ('prop_cd_lolly', lolly), ('prop_cd_grape', grape), ('prop_cd_cane', cane), ('prop_cd_stage', stage), ('prop_cd_jar', jar),
                 ('prop_cd_pill', lambda: pill('prop_cd_pill', 0.28)), ('prop_cd_pill2', lambda: pill('prop_cd_pill2', 0.65))]:
    if want(name):
        fn()
