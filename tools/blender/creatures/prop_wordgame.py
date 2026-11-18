"""Word world (docs/design/words.md 7.2): the scene pieces the game needs that are not words. One script, several
models; ONLY=prop_wg_book,... builds a subset:   ONLY=prop_wg_book tools/blender/build.sh prop_wordgame
  prop_wg_rail       a fence run for Pip to sit on: 4.4 long, a wide flat top rail at y 1.5, two posts, a middle rail
  prop_wg_hedge      a clipped hedge run, flat-topped at 1.5, with a few little flowers
  prop_wg_sideboard  an indoor low cupboard run (top at 1.5): two doors with round knobs, short feet
  prop_wg_wall       a low garden / street wall of chunky bricks with a coping on top (1.5)
  prop_wg_peg        a wooden clothes peg with a grey spring (the photo line's pegs)
  prop_wg_easel      a low wooden easel: a ledge for the word book (anchor 'book') and a top bar for Pip (anchor 'bar')
  prop_wg_book       the word book standing open: 3.6 x 2.1, blue hard covers, cream pages, a ribbon; the left half
                     (cover + left page) is on bone 'cover' hinged at the spine (rest = open; turn it about y to shut)
  prop_wg_camera     Pip's toy camera: chunky red body, big lens, yellow button, flash window
  prop_wg_barn / _hamper / _toybox / _wardrobe / _garage
                     Level 3 homes: open cubbies 2.3 wide x 2.4 tall, two shelves of three spots (y 0.14 and 1.22),
                     doors (doorL / doorR, or 'lid' / 'up'), and a round friend sign on top on bone 'sign'
                     (paw print, apple, ball, T-shirt, car)
Everything stands on y = 0, centred on x, facing +z.
"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded, star_poly, circle_poly

ONLY = [s for s in os.environ.get('ONLY', '').split(',') if s]
RED, ORANGE, YELLOW, GREEN, LEAF = 0xff4f4f, 0xff9a2e, 0xffd23a, 0x4cc75a, 0x2f8a3a
BLUE, SKY, PURPLE, PINK, ROSE = 0x3f8cff, 0x8fd3ff, 0x9b6dff, 0xff7fbf, 0xff9ec4
CREAM, WHITE, BROWN, WOOD, TAN = 0xf2e8d8, 0xfffaf0, 0xb07a4a, 0xd8924f, 0xf3d9ae
GREY, SLATE, INK = 0xb9c0c9, 0x6f7a8c, 0x3a2838
WOOD_D, WOOD_L = 0xb06f34, 0xe8a866


def want(k):
    return not ONLY or k in ONLY


def flat(p, poly, z0, z1, at=(0, 0), scale=1.0):
    """extrude a star-shaped 2D polygon (around its own 0,0) between z0 and z1, centred at `at` (x, y)"""
    ax, ay = at
    m = len(poly)
    verts = [(ax, ay, z0)] + [(ax + x * scale, ay + y * scale, z0) for x, y in poly]
    verts += [(ax, ay, z1)] + [(ax + x * scale, ay + y * scale, z1) for x, y in poly]
    faces = []
    k = m + 1
    for i in range(m):
        j = (i + 1) % m
        faces.append((0, 1 + j, 1 + i))
        faces.append((k, k + 1 + i, k + 1 + j))
        faces.append((1 + i, 1 + j, k + 1 + j, k + 1 + i))
    p.mesh(verts, faces)


def flat_rot(p, poly, plane_pt, thick):
    """a thin slab of poly lying in a plane facing +z at plane_pt"""
    flat(p, poly, plane_pt[2] - thick / 2, plane_pt[2] + thick / 2, at=(plane_pt[0], plane_pt[1]))


def rrect(w, h, r, n=4):
    return [p[:2] for p in rounded([(-w / 2, -h / 2), (w / 2, -h / 2), (w / 2, h / 2), (-w / 2, h / 2)], r, n=n, closed=True)]


L = 4.4  # ledge run length


# ---------------------------------------------------------------- ledges
if want('prop_wg_rail'):
    p = Prop('prop_wg_rail', base=WOOD, target_faces=2600)
    for s in (-1, 1):
        p.box((s * 1.75, 0.72, 0), (0.13, 0.72, 0.13), bevel=0.06)
    p.box((0, 0.82, 0.02), (L / 2, 0.08, 0.06), bevel=0.04)          # middle rail
    p.box((0, 1.42, 0), (L / 2, 0.08, 0.26), bevel=0.05)             # wide flat top rail (Pip sits here)
    p.paint_fn(lambda q, n: n.y < -0.5, WOOD_D)
    p.paint_fn(lambda q, n: q.y > 1.34 and abs(q.z) < 0.27 and any(abs(q.x - x) < 0.018 for x in (-1.2, -0.25, 0.9, 1.7)), WOOD_D)
    p.layer('caps', base=WOOD_L, target_faces=400, voxel=0.012)
    for s in (-1, 1):
        p.box((s * 1.75, 1.52, 0), (0.15, 0.025, 0.15), bevel=0.02)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 1.5, 0))
    p.extras['outline'] = 0.02
    p.build()

if want('prop_wg_hedge'):
    # a clipped hedge run: a soft core under rows of round leaf clusters (front, top and back), three greens so the
    # clusters read, and white and pink flowers. The top is lumpy; Pip stands on the plank the game lays on it (1.5).
    p = Prop('prop_wg_hedge', base=GREEN, target_faces=4200, voxel=0.022)
    p.box((0, 0.62, -0.02), (L / 2 - 0.1, 0.6, 0.34), bevel=0.26)
    J = [0.0, 0.05, -0.04, 0.03, -0.05, 0.02, 0.06, -0.03, 0.01, -0.06, 0.04, -0.02, 0.05, -0.01]
    n = 13
    for i in range(n):
        x = -L / 2 + 0.28 + i * (L - 0.56) / (n - 1)
        j = J[i % len(J)]
        p.blob((x + j, 0.42 + j, 0.3), (0.3 + abs(j), 0.27, 0.17))                 # lower front row
        p.blob((x + 0.17 - j, 0.92 - j, 0.31), (0.29, 0.28 + abs(j), 0.17))       # upper front row
        p.blob((x - j, 1.27 + j * 0.4, 0.04), (0.29, 0.19, 0.33))                 # the lumpy top (top at ~1.48)
        p.blob((x + 0.1, 0.8, -0.3), (0.3, 0.38, 0.12))                            # back
    p.paint_fn(lambda q, n: n.y > 0.55, 0x6fd872)                                  # sunlit tops of the clusters
    p.paint_fn(lambda q, n: n.y < -0.35 or q.y < 0.16, 0x2f9a45)                   # shade under each cluster
    FL = [(-2.0, 0.95, 0.47), (-1.55, 0.45, 0.46), (-1.0, 1.1, 0.46), (-0.45, 0.62, 0.47), (0.15, 1.02, 0.47),
          (0.7, 0.4, 0.46), (1.2, 0.85, 0.47), (1.75, 0.5, 0.46), (2.05, 1.12, 0.45)]
    for lay, col, pick in (('flowers', WHITE, lambda i: i % 3 != 1), ('pinks', PINK, lambda i: i % 3 == 1)):
        p.layer(lay, base=col, target_faces=500, voxel=0.01)
        for i, (x, y, z) in enumerate(FL):
            if not pick(i):
                continue
            for k in range(5):
                a = k * math.tau / 5
                p.blob((x + math.cos(a) * 0.06, y + math.sin(a) * 0.06, z), (0.05, 0.05, 0.022), group='f%d' % i)
    p.layer('hearts', base=YELLOW, target_faces=240, voxel=0.01)
    for x, y, z in FL:
        p.blob((x, y, z + 0.02), (0.032, 0.032, 0.022))
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 1.5, 0))
    p.extras['outline'] = 0.02
    p.build()

if want('prop_wg_sideboard'):
    p = Prop('prop_wg_sideboard', base=WOOD_L, target_faces=3000)
    p.box((0, 0.76, 0), (L / 2 - 0.05, 0.62, 0.36), bevel=0.06)      # cabinet
    p.box((0, 1.44, 0.02), (L / 2, 0.06, 0.42), bevel=0.04)           # top plank (Pip sits here)
    for x in (-L / 2 + 0.25, L / 2 - 0.25):
        for z in (-0.24, 0.24):
            p.cyl((x, 0, z), 0.07, 0.16, r2=0.05, bevel=0.02)
    p.paint_fn(lambda q, n: q.y > 1.37, WOOD)
    p.paint_fn(lambda q, n: q.y < 0.16, WOOD_D)
    p.layer('doors', base=CREAM, target_faces=1200, voxel=0.012)
    for x in (-1.05, 1.05):
        p.box((x, 0.78, 0.37), (0.92, 0.48, 0.03), bevel=0.04)
    p.layer('knobs', base=BLUE, target_faces=300, voxel=0.01)
    for x in (-0.3, 0.3):
        p.blob((x, 0.86, 0.43), (0.06, 0.06, 0.04))
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 1.5, 0))
    p.extras['outline'] = 0.02
    p.build()

if want('prop_wg_wall'):
    p = Prop('prop_wg_wall', base=0xf0c89a, target_faces=3000)
    p.box((0, 0.66, 0), (L / 2 - 0.03, 0.64, 0.27), bevel=0.07)
    p.box((0, 1.4, 0), (L / 2, 0.1, 0.33), bevel=0.06)                 # coping (Pip sits here)
    p.paint_fn(lambda q, n: q.y > 1.28, CREAM)
    # chunky stones in staggered courses (their own layer: crisp edges, every other one a shade darker)
    p.layer('stones', base=0xf6d3a8, target_faces=2200, voxel=0.014)
    for row in range(4):
        y = 0.16 + row * 0.3
        off = 0.32 if row % 2 else 0.0
        x = -L / 2 + 0.06 - off
        while x < L / 2 - 0.1:
            x0, x1 = max(x, -L / 2 + 0.06), min(x + 0.6, L / 2 - 0.06)
            if x1 - x0 > 0.2:
                p.box(((x0 + x1) / 2, y, 0.25), ((x1 - x0) / 2 - 0.03, 0.12, 0.05), bevel=0.04)
            x += 0.64
    p.paint_fn(lambda q, n: (int((q.x + 3.2 + (0.32 if int((q.y - 0.01) / 0.3) % 2 else 0)) / 0.64) + int((q.y - 0.01) / 0.3)) % 3 == 0, 0xe9bf8c)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 1.5, 0))
    p.extras['outline'] = 0.02
    p.build()

# ---------------------------------------------------------------- the photo line's peg
if want('prop_wg_peg'):
    p = Prop('prop_wg_peg', base=WOOD_L, target_faces=900, voxel=0.006)
    for s in (-1, 1):
        p.box((s * 0.035, 0.2, 0), (0.028, 0.2, 0.04), rot=(0, 0, s * -3), bevel=0.02)
    p.paint_fn(lambda q, n: q.y < 0.05, WOOD)
    p.layer('spring', base=GREY, target_faces=400, voxel=0.006)
    p.ring((0, 0.25, 0), 0.05, 0.014, rot=(0, 90, 0))
    p.ring((0, 0.25, 0), 0.05, 0.014, rot=(0, 90, 0))
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 0.4, 0))
    p.extras['outline'] = 0.008
    p.build()

# ---------------------------------------------------------------- the easel (book on its ledge, Pip on its top bar)
if want('prop_wg_easel'):
    # wide enough that the 3.6-wide book sits between the legs; leans back 20 degrees like the book
    p = Prop('prop_wg_easel', base=WOOD, target_faces=3400)
    for sx in (-1, 1):
        p.capsule((sx * 2.0, 0.02, 0.28), (sx * 1.86, 3.05, -0.5), 0.1)            # front legs, leaning back
    p.capsule((0, 0.02, -0.55), (0, 2.95, -0.62), 0.085)                          # back leg (stays close behind)
    p.box((0, 0.86, 0.2), (2.08, 0.07, 0.2), bevel=0.04)                          # the book ledge
    p.box((0, 0.97, 0.37), (2.08, 0.05, 0.035), bevel=0.02)                       # its lip
    p.box((0, 3.1, -0.52), (1.1, 0.09, 0.24), bevel=0.06)                         # the top bar (Pip sits here)
    p.box((0, 2.6, -0.62), (1.9, 0.05, 0.05), bevel=0.02)                         # cross bar, behind the book
    p.paint_fn(lambda q, n: q.y > 3.02 and n.y > 0.5, WOOD_L)
    p.paint_fn(lambda q, n: q.y < 0.08, WOOD_D)
    p.bone('body', (0, 0, 0), (0, 3.1, 0))
    p.anchor('book', (0, 0.93, 0.2))
    p.anchor('bar', (0, 3.19, -0.52))
    p.extras['outline'] = 0.022
    p.build()

# ---------------------------------------------------------------- the word book (open)
if want('prop_wg_book'):
    W, H = 3.6, 2.1
    p = Prop('prop_wg_book', base=BLUE, target_faces=3600, voxel=0.016)
    for s in (-1, 1):
        p.box((s * (W / 4 + 0.03), H / 2, -0.03), (W / 4 + 0.05, H / 2 + 0.08, 0.04), bevel=0.05)  # boards
    p.cyl((0, -0.08, -0.04), 0.07, H + 0.16, bevel=0.03)                              # the spine
    p.paint_fn(lambda q, n: abs(q.x) < 0.08 and q.z < 0.03, 0x2c6fd9)
    p.layer('pages', base=WHITE, target_faces=1600, voxel=0.012)
    for s in (-1, 1):
        p.box((s * (W / 4), H / 2, 0.05), (W / 4 - 0.04, H / 2 - 0.02, 0.05), bevel=0.035)
    p.paint_fn(lambda q, n: n.z < 0.6 and q.z < 0.09, CREAM)   # page edges
    p.layer('star', base=YELLOW, target_faces=500, voxel=0.01)
    flat(p, star_poly(0.38, inner=0.48), -0.095, -0.07, at=(-W / 4 - 0.03, H / 2))      # on the outside of the cover
    p.layer('ribbon', base=RED, target_faces=300, voxel=0.01)
    p.box((0.06, H - 0.25, 0.105), (0.04, 0.32, 0.008), bevel=0.006)
    p.layer('skin')
    left = lambda q: q.x < -0.02
    p.bone('body', (0, 0, 0), (0, H, 0), region=lambda q: not left(q))
    p.bone('cover', (0, 0, 0.0), (0, H, 0.0), parent='body', region=left)
    p.extras['outline'] = 0.02
    p.build()

# ---------------------------------------------------------------- Pip's camera
if want('prop_wg_camera'):
    p = Prop('prop_wg_camera', base=RED, target_faces=1600, voxel=0.008)
    p.box((0, 0.15, 0), (0.22, 0.14, 0.08), bevel=0.06)
    p.box((-0.12, 0.31, 0), (0.06, 0.03, 0.05), bevel=0.02)            # viewfinder hump
    p.paint_fn(lambda q, n: q.y < 0.06, 0xd93a3f)
    p.layer('lens', base=INK, target_faces=500, voxel=0.006)
    p.cyl((0.02, 0.14, 0.06), 0.095, 0.07, rot=(90, 0, 0), bevel=0.02)
    p.layer('glass', base=SKY, target_faces=300, voxel=0.005)
    p.cyl((0.02, 0.14, 0.12), 0.065, 0.025, rot=(90, 0, 0), bevel=0.01)
    p.layer('shine', base=WHITE, target_faces=100, voxel=0.004)
    p.blob((-0.005, 0.165, 0.15), (0.02, 0.014, 0.006))
    p.layer('button', base=YELLOW, target_faces=200, voxel=0.006)
    p.cyl((0.13, 0.29, 0), 0.035, 0.04, bevel=0.012)
    p.layer('flash', base=WHITE, target_faces=150, voxel=0.006)
    p.box((0.15, 0.22, 0.085), (0.04, 0.025, 0.01), bevel=0.01)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 0.3, 0))
    p.extras['outline'] = 0.01
    p.build()


# ---------------------------------------------------------------- Level 3 homes (open cubbies)
HW, HH, HD = 2.3, 2.4, 1.0
T = 0.12


def cubby(p, inner):
    """the shell: back, sides, floor, middle shelf, top; inside painted `inner`"""
    p.box((0, HH / 2, -HD / 2 + T / 2), (HW / 2, HH / 2, T / 2), bevel=0.05)
    for s in (-1, 1):
        p.box((s * (HW / 2 - T / 2), HH / 2, 0), (T / 2, HH / 2, HD / 2), bevel=0.05)
    p.box((0, T / 2, 0), (HW / 2, T / 2, HD / 2), bevel=0.04)
    p.box((0, 1.15, 0.02), (HW / 2 - 0.04, 0.05, HD / 2 - 0.04), bevel=0.03)
    p.box((0, HH - T / 2, 0), (HW / 2, T / 2, HD / 2), bevel=0.05)
    inside = lambda q, n: abs(q.x) < HW / 2 - T + 0.02 and q.z < HD / 2 - 0.02 and T - 0.02 < q.y < HH - T + 0.02
    p.paint_fn(inside, inner)


def sign(p, base, icon):
    """a round friend sign on a short post on the roof (bone 'sign'); icon(p, cx, cy, z) adds the picture layers"""
    p.layer('sign', base=CREAM, target_faces=700, voxel=0.012)
    cy = HH + 0.7
    p.cyl((0, cy, -0.04), 0.46, 0.08, rot=(90, 0, 0), bevel=0.03)
    p.layer('signrim', base=base, target_faces=500, voxel=0.01)
    p.ring((0, cy, 0.0), 0.46, 0.04, rot=(90, 0, 0))
    p.cyl((0, HH - 0.05, -0.04), 0.05, 0.3, bevel=0.02)
    icon(p, 0, cy, 0.03)
    p.layer('skin')
    return cy


def door_pair(p, col, trim=None):
    """two half doors at the front edges, hinged outward; rest = closed (the game opens them)"""
    p.layer('doors', base=col, target_faces=1400, voxel=0.012)
    dw = HW / 2 - 0.02
    for s in (-1, 1):
        p.box((s * (HW / 2 - dw / 2), HH / 2, HD / 2 + 0.05), (dw / 2 - 0.02, HH / 2 - 0.08, 0.035), bevel=0.04)
    if trim:
        p.layer('xtrim', base=trim, target_faces=900, voxel=0.01)
        for s in (-1, 1):
            cx = s * (HW / 2 - dw / 2)
            ang = math.degrees(math.atan2(HH - 0.4, dw - 0.25))
            for a in (ang, -ang):
                p.box((cx, HH / 2, HD / 2 + 0.095), (math.hypot(HH - 0.4, dw - 0.25) / 2, 0.045, 0.012), rot=(0, 0, a), bevel=0.012)
            for dy in (-1, 1):
                p.box((cx, HH / 2 + dy * (HH / 2 - 0.16), HD / 2 + 0.095), (dw / 2 - 0.08, 0.04, 0.012), bevel=0.012)
            for dx in (-1, 1):
                p.box((cx + dx * (dw / 2 - 0.1), HH / 2, HD / 2 + 0.095), (0.04, HH / 2 - 0.16, 0.012), bevel=0.012)
        p.layer('skin')
    p.layer('skin')


def home_bones(p, kind, cy):
    door_l = lambda q: q.z > HD / 2 + 0.005 and q.x < 0 and q.y < HH
    door_r = lambda q: q.z > HD / 2 + 0.005 and q.x > 0 and q.y < HH
    is_sign = lambda q: q.y > HH + 0.15 and abs(q.x) < 0.5
    p.bone('body', (0, 0, 0), (0, HH, 0), region=lambda q: not (door_l(q) or door_r(q) or is_sign(q)))
    if kind == 'doors':
        p.bone('doorL', (-HW / 2, 0.1, HD / 2 + 0.05), (-HW / 2, HH - 0.1, HD / 2 + 0.05), parent='body', region=door_l)
        p.bone('doorR', (HW / 2, 0.1, HD / 2 + 0.05), (HW / 2, HH - 0.1, HD / 2 + 0.05), parent='body', region=door_r)
    p.bone('sign', (0, HH, -0.04), (0, cy + 0.4, -0.04), parent='body', region=is_sign)
    for i, (x, y) in enumerate([(x, y) for y in (0.14, 1.22) for x in (-0.68, 0, 0.68)]):
        p.anchor('spot%d' % i, (x, y, 0.05))


def icon_paw(p, cx, cy, z):
    p.layer('icon', base=BROWN, target_faces=500, voxel=0.008)
    p.blob((cx, cy - 0.07, z + 0.02), (0.13, 0.11, 0.025))
    for a in (-55, -18, 18, 55):
        r = math.radians(a)
        p.blob((cx + math.sin(r) * 0.17, cy + 0.06 + math.cos(r) * 0.08, z + 0.02), (0.055, 0.065, 0.025))


def icon_apple(p, cx, cy, z):
    p.layer('icon', base=RED, target_faces=500, voxel=0.008)
    p.blob((cx - 0.06, cy - 0.03, z + 0.02), (0.15, 0.17, 0.03))
    p.blob((cx + 0.06, cy - 0.03, z + 0.02), (0.15, 0.17, 0.03))
    p.layer('icon2', base=LEAF, target_faces=200, voxel=0.008)
    p.blob((cx + 0.08, cy + 0.18, z + 0.03), (0.08, 0.04, 0.02), rot=(0, 0, 30))
    p.box((cx, cy + 0.16, z + 0.03), (0.018, 0.06, 0.015), bevel=0.008)


def icon_ball(p, cx, cy, z):
    p.layer('icon', base=BLUE, target_faces=500, voxel=0.008)
    p.cyl((cx, cy, z), 0.2, 0.04, rot=(90, 0, 0), bevel=0.012)
    p.paint_fn(lambda q, n: q.z > z - 0.01 and abs(q.y - cy) < 0.2 and abs(q.x - cx) < 0.2 and abs((q.x - cx) + (q.y - cy) * 0.3) < 0.06, YELLOW)
    p.paint_fn(lambda q, n: q.z > z - 0.01 and abs(q.y - cy) < 0.2 and abs(q.x - cx) < 0.2 and (q.x - cx) + (q.y - cy) * 0.3 > 0.06, RED)


def icon_shirt(p, cx, cy, z):
    p.layer('icon', base=SKY, target_faces=500, voxel=0.008)
    shirt = [(-0.08, -0.16), (0.08, -0.16), (0.08, 0.05), (0.15, 0.0), (0.2, 0.08), (0.1, 0.16), (0.04, 0.13), (-0.04, 0.13), (-0.1, 0.16), (-0.2, 0.08), (-0.15, 0.0), (-0.08, 0.05)]
    flat(p, shirt, z, z + 0.035, at=(cx, cy))


def icon_car(p, cx, cy, z):
    p.layer('icon', base=RED, target_faces=500, voxel=0.008)
    p.box((cx, cy - 0.03, z + 0.02), (0.2, 0.06, 0.02), bevel=0.02)
    p.box((cx - 0.02, cy + 0.06, z + 0.02), (0.11, 0.06, 0.02), bevel=0.03)
    p.layer('icon2', base=INK, target_faces=200, voxel=0.008)
    for x in (-0.11, 0.11):
        p.cyl((cx + x, cy - 0.1, z + 0.02), 0.045, 0.03, rot=(90, 0, 0), bevel=0.01)


HOMES = {
    'prop_wg_barn': dict(col=RED, inner=0xf3d9ae, roof='gable', roofc=0xb73a32, door=RED, trim=WHITE, icon=icon_paw),
    'prop_wg_hamper': dict(col=0xd8a35a, inner=0xf3d9ae, roof='lid', roofc=0xc48a44, door=None, trim=None, icon=icon_apple, weave=True),
    'prop_wg_toybox': dict(col=BLUE, inner=0xfff3d6, roof='round', roofc=YELLOW, door=None, trim=None, icon=icon_ball, stars=True),
    'prop_wg_wardrobe': dict(col=PURPLE, inner=0xf6e6ff, roof='crown', roofc=0x7d52e0, door=PURPLE, trim=None, icon=icon_shirt),
    'prop_wg_garage': dict(col=GREEN, inner=0xe8eef4, roof='flat', roofc=0x36a548, door=None, trim=None, icon=icon_car, roll=True),
}
for kind, o in HOMES.items():
    if not want(kind):
        continue
    p = Prop(kind, base=o['col'], target_faces=5200, voxel=0.018)
    cubby(p, o['inner'])
    if o.get('weave'):
        outside = lambda q: abs(q.x) > HW / 2 - T + 0.02 or q.z < -HD / 2 + T - 0.02 or q.z > HD / 2 - 0.03 or q.y < T - 0.02 or q.y > HH - T + 0.02
        p.paint_fn(lambda q, n: outside(q) and int((q.y + 0.02) / 0.2) % 2 == 0, 0xc48a44)
    # the roof
    p.layer('roof', base=o['roofc'], target_faces=1400, voxel=0.016)
    if o['roof'] == 'gable':
        for s in (-1, 1):
            p.box((s * 0.66, HH + 0.27, 0.01), (0.78, 0.07, HD / 2 + 0.12), rot=(0, 0, -s * 26), bevel=0.05)
        p.layer('skin')
        p.box((0, HH + 0.18, -HD / 2 + 0.08), (0.9, 0.2, 0.06), bevel=0.04)   # gable end behind the sign
        p.layer('roof')
    elif o['roof'] == 'lid':
        p.box((0, HH + 0.06, -HD / 2 - 0.02), (HW / 2 + 0.06, 0.06, 0.14), rot=(-70, 0, 0), bevel=0.05)
        p.box((0, HH + 0.04, 0), (HW / 2 + 0.06, 0.05, HD / 2 + 0.04), bevel=0.04)
    elif o['roof'] == 'round':
        p.cyl((0, HH - 0.02, 0), HW / 2 + 0.05, 0.22, rot=(0, 0, 0), bevel=0.1, scale=(1, 0.5))
    elif o['roof'] == 'crown':
        p.box((0, HH + 0.06, 0), (HW / 2 + 0.08, 0.08, HD / 2 + 0.06), bevel=0.05)
        for x in (-0.8, 0.8):
            p.blob((x, HH + 0.2, 0.0), (0.12, 0.12, 0.12))
    else:
        p.box((0, HH + 0.05, 0.04), (HW / 2 + 0.12, 0.07, HD / 2 + 0.14), bevel=0.05)
    p.layer('skin')
    if o.get('roll'):
        p.layer('roll', base=0xe8eef4, target_faces=600, voxel=0.012)
        p.cyl((-HW / 2 + 0.1, HH - 0.2, HD / 2 + 0.06), 0.12, HW - 0.2, rot=(0, 0, -90), bevel=0.03)
        p.paint_fn(lambda q, n: int((q.x + 3) / 0.18) % 2 == 0, GREY)
        p.layer('skin')
    if o.get('stars'):
        p.layer('stickers', base=YELLOW, target_faces=600, voxel=0.008)
        for s in (-1, 1):
            flat(p, star_poly(0.14, inner=0.48), HD / 2 + 0.005, HD / 2 + 0.03, at=(s * (HW / 2 - T / 2), HH - 0.35))
        p.layer('skin')
    if o['door']:
        door_pair(p, o['door'], o['trim'])
    cy = sign(p, o['roofc'], o['icon'])
    home_bones(p, 'doors' if o['door'] else 'none', cy)
    p.extras['outline'] = 0.022
    p.build()
