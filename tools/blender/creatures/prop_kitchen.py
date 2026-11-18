"""Snack chef kitchen (Home world). One script, several models (ONLY=prop_k_tap,... builds a subset):
  prop_k_counter  the kitchen island (skin + 'doors' painted white: the game tints them per level): 11.6 long (x -5.8..5.8), 2.35 deep (z -1.175..1.175), worktop surface at y 1.15.
                  Mint cupboards with round gold knobs, a butcher-block worktop, and a steel sink basin let into the top
                  (inner floor y 0.75, opening x SINK_X +-0.62, z SINK_Z +-0.45). Layers: 'top', 'doors', 'knobs', 'basin'.
  prop_k_tap      a chrome gooseneck tap, origin at its base (stands on the worktop): the spout rises 0.95 and arcs
                  forward (+z) to pour at (0, 0.78, 0.82). A red/blue cross handle on its right (bone 'handle', turns about y).
  prop_k_soap     a pink pump bottle (~0.62 tall) with a white pump head (bone 'pump', pushes down) and a bubble sticker.
  prop_k_towel    a striped hand towel folded over a little rail: origin at the rail centre, the brackets go back to z -0.16
                  (they screw onto the cupboard front), the towel hangs ~0.85 below the rail.
  prop_k_fridge   a rounded retro fridge, 1.9 wide, 1.5 deep, 4.2 tall, origin on the floor at its centre. Hollow, with two
                  white shelves inside (tops at y SHELVES); the door (bone 'door', hinge on the right front edge; in game
                  rotation.y > 0 swings it open toward us, to the right) carries a chrome handle and fridge magnets.
  prop_k_board    a wooden chopping board 1.7 x 1.0 x 0.1 (bottom at y 0) with a handle tab on +x.
  prop_k_plate2   a plate split in two (r 1.05, floor y 0.07): a pink fruit half (-x, a strawberry print) and a green veg half
                  (+x, a carrot print).
  prop_k_plate4   a plate split in four (r 1.25): fruit (back left, pink), veg (back right, green), grain (front left,
                  yellow, a bread print) and dairy (front right, blue, a milk-bottle print)."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded, circle_poly
from skit import SProp, star_poly

ONLY = [s for s in os.environ.get('ONLY', '').split(',') if s]


class FlatProp(SProp):
    """SProp whose layers listed in .flat get flat-shaded upward faces (a big flat top shades evenly: no diagonal
    light/dark triangles), the bevels stay smooth."""
    flat = ()

    def _skin(self):
        sk = super()._skin()
        if self._cur in self.flat:
            for f in sk.data.polygons:
                if f.normal.z > 0.985:          # (Blender z = game y, up)
                    f.use_smooth = False
        return sk
TOP = 1.15
FY = 0.75          # the basin's inner floor
SINK_X, SINK_Z, SHW, SHD = -3.6, -0.6, 0.62, 0.45
SHELVES = (1.35, 2.45)


def inside(poly, x, y):
    c = False
    n = len(poly)
    for i in range(n):
        x0, y0 = poly[i]; x1, y1 = poly[(i + 1) % n]
        if (y0 > y) != (y1 > y) and x < x0 + (y - y0) * (x1 - x0) / (y1 - y0):
            c = not c
    return c


# ---------------- the island counter ----------------
def counter():
    p = FlatProp('prop_k_counter', base=0xffffff, voxel=0.028, target_faces=5000)   # tinted per level in game
    HX, HZ = 5.7, 1.06
    # plinth (recessed, darker) and the cupboard body; above y 0.86 the body goes round the sink's well
    p.box((0, 0.09, -0.02), (HX - 0.08, 0.09, HZ - 0.06), bevel=0.03)
    p.box((0, 0.42, 0), (HX, 0.26, HZ), bevel=0.06)
    x0, x1, z0, z1 = SINK_X - SHW - 0.06, SINK_X + SHW + 0.06, SINK_Z - SHD - 0.06, SINK_Z + SHD + 0.06
    y0, y1 = 0.62, TOP - 0.11
    hy, cy = (y1 - y0) / 2, (y0 + y1) / 2
    p.box(((-HX + x0) / 2, cy, 0), ((x0 + HX) / 2, hy, HZ), bevel=0.05)
    p.box(((x1 + HX) / 2, cy, 0), ((HX - x1) / 2, hy, HZ), bevel=0.05)
    p.box((SINK_X, cy, (z1 + HZ) / 2), (SHW + 0.06, hy, (HZ - z1) / 2), bevel=0.03)
    p.box((SINK_X, cy, (-HZ + z0) / 2), (SHW + 0.06, hy, (z0 + HZ) / 2), bevel=0.03)
    p.paint_fn(lambda q, n: q.y < 0.19, 0xb4b4b4)
    # the worktop: one butcher-block slab with the sink hole cut in it (no joins), overhanging a little. It is a grid
    # whose lines fall on the plank borders, so every plank is one clean colour; the top is flat-shaded.
    p.layer('top', base=0xf0c084, voxel=0.024, target_faces=2600)
    TX, TZ, th = 5.85, 1.175, 0.11
    hx0, hx1, hz0, hz1 = SINK_X - SHW - 0.03, SINK_X + SHW + 0.03, SINK_Z - SHD - 0.03, SINK_Z + SHD + 0.03
    PL, GR = 0.29, 0.014                     # plank width, the groove between planks
    zs = {-TZ, TZ, hz0, hz1}
    zz = -TZ
    while zz < TZ:
        zs.add(round(zz, 4)); zs.add(round(min(TZ, zz + GR), 4)); zz += PL
    zs = sorted(z for z in zs if -TZ <= z <= TZ)
    xs = sorted({-TX, TX, hx0, hx1} | {round(-TX + i * 0.58, 4) for i in range(1, 21) if -TX + i * 0.58 < TX})
    hole = lambda x, z: hx0 <= x < hx1 and hz0 <= z < hz1
    V, F, idx = [], [], {}
    def vid(x, y, z):
        k = (round(x, 4), round(y, 4), round(z, 4))
        if k not in idx:
            idx[k] = len(V); V.append(k)
        return idx[k]
    yt, yb = TOP, TOP - th
    for i in range(len(xs) - 1):
        for j in range(len(zs) - 1):
            x0, x1, z0, z1 = xs[i], xs[i + 1], zs[j], zs[j + 1]
            if hole((x0 + x1) / 2, (z0 + z1) / 2):
                continue
            F.append((vid(x0, yt, z0), vid(x0, yt, z1), vid(x1, yt, z1), vid(x1, yt, z0)))
            F.append((vid(x0, yb, z0), vid(x1, yb, z0), vid(x1, yb, z1), vid(x0, yb, z1)))
            # walls where this cell borders the outside or the hole
            for (ax, az, bx, bz, ox, oz) in ((x0, z0, x1, z0, 0, -1), (x1, z0, x1, z1, 1, 0), (x1, z1, x0, z1, 0, 1), (x0, z1, x0, z0, -1, 0)):
                cx, cz = (ax + bx) / 2 + ox * 1e-3, (az + bz) / 2 + oz * 1e-3
                if abs(cx) > TX or abs(cz) > TZ or hole(cx, cz):
                    F.append((vid(ax, yt, az), vid(bx, yt, bz), vid(bx, yb, bz), vid(ax, yb, az)))
    p.mesh(V, F, bevel=0.035)
    p.flat = ('top',)
    def plank(q, n):
        k = math.floor((q.z + TZ + 1e-4) / PL)
        f = (q.z + TZ + 1e-4) - k * PL
        return n.y > 0.7 and f < GR
    p.paint_fn(lambda q, n: n.y > 0.7 and int(math.floor((q.z + TZ + 1e-4) / PL)) % 2 == 0, 0xeab676)
    p.paint_fn(plank, 0xd9a062)
    p.paint_fn(lambda q, n: n.y < 0.7, 0xd99e5c)
    # the steel basin: a rounded tub let into the hole (walls + floor), with a drain
    p.layer('basin', base=0xd6e2ee, voxel=0.016, target_faces=1800)
    bw = 0.05
    fy = FY
    p.box((SINK_X, fy - 0.03, SINK_Z), (SHW + 0.04, 0.05, SHD + 0.04), bevel=0.04)
    for s in (-1, 1):
        p.box((SINK_X + s * (SHW + bw / 2), (fy + TOP) / 2 - 0.01, SINK_Z), (bw / 2 + 0.02, (TOP - fy) / 2 + 0.02, SHD + 0.06), bevel=0.02)
        p.box((SINK_X, (fy + TOP) / 2 - 0.01, SINK_Z + s * (SHD + bw / 2)), (SHW + 0.06, (TOP - fy) / 2 + 0.02, bw / 2 + 0.02), bevel=0.02)
    # a rolled rim round the hole
    rim = rounded([(SINK_X - SHW - 0.03, SINK_Z - SHD - 0.03), (SINK_X + SHW + 0.03, SINK_Z - SHD - 0.03),
                   (SINK_X + SHW + 0.03, SINK_Z + SHD + 0.03), (SINK_X - SHW - 0.03, SINK_Z + SHD + 0.03)], 0.05, n=4, closed=True)
    p.tube([(x, TOP + 0.005, z) for x, z in rim], 0.035, closed=True, rseg=10)
    inside = lambda q: abs(q.x - SINK_X) < SHW + 0.005 and abs(q.z - SINK_Z) < SHD + 0.005
    p.paint_fn(lambda q, n: inside(q) and q.y < TOP - 0.02 and n.z > 0.5, 0xb4c3d4)                 # back wall (faces us)
    p.paint_fn(lambda q, n: inside(q) and q.y < TOP - 0.02 and abs(n.x) > 0.5, 0xc4d1df)            # side walls
    p.paint_fn(lambda q, n: inside(q) and q.y < TOP - 0.02 and n.z < -0.5, 0xe4edf5)                # front wall (lit)
    p.paint_fn(lambda q, n: q.y < fy + 0.04 and n.y > 0.6, 0xa3b4c8)                               # floor
    p.paint_fn(lambda q, n: n.y > 0.6 and q.y < fy + 0.04 and math.hypot(q.x - SINK_X, q.z - SINK_Z) < 0.11, 0x6f8196)
    p.paint_fn(lambda q, n: n.y > 0.6 and q.y < fy + 0.04 and 0.11 <= math.hypot(q.x - SINK_X, q.z - SINK_Z) < 0.14, 0xd8e3ee)
    # cupboard doors on the front: raised panels, two drawers over the sink end
    p.layer('doors', base=0xffffff, voxel=0.02, target_faces=2600)   # tinted per level in game
    FZ = HZ
    xs = [-5.0, -3.6, -2.2, -0.75, 0.75, 2.2, 3.6, 5.0]
    for x in xs:
        p.box((x, 0.5, FZ + 0.02), (0.6, 0.29, 0.035), bevel=0.03)
        p.box((x, 0.93, FZ + 0.02), (0.6, 0.085, 0.035), bevel=0.03)
    for x in (-HX, HX):   # the ends get one big panel each
        p.box((x + (0.02 if x > 0 else -0.02), 0.62, 0), (0.035, 0.4, 0.82), bevel=0.03)
    p.layer('knobs', base=0xffc531, voxel=0.01, target_faces=1400)
    for x in xs:
        kx = x + (0.42 if xs.index(x) % 2 == 0 else -0.42)
        p.blob((kx, 0.6, FZ + 0.1), (0.065, 0.065, 0.05), group='k%d' % xs.index(x))
        p.blob((x, 0.93, FZ + 0.1), (0.07, 0.04, 0.04), group='d%d' % xs.index(x))
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, TOP, 0))
    p.extras['outline'] = 0.026
    p.build()


# ---------------- tap ----------------
CHROME, CHROME_D = 0xe3ecf5, 0xa9bacb


def tap():
    p = Prop('prop_k_tap', base=CHROME, target_faces=2200, voxel=0.011, smooth=3)
    p.cyl((0, 0, 0), 0.17, 0.06, r2=0.15, bevel=0.025, seg=28)            # the round foot
    p.cyl((0, 0.04, 0), 0.085, 0.3, r2=0.075, bevel=0.02, seg=24)         # the column
    # gooseneck: up, over, down to the nozzle
    path = [(0, 0.3, 0)] + [(0, 0.3 + 0.62 * t, 0) for t in (0.3, 0.6, 0.85)]
    for i in range(1, 12):
        a = math.pi * i / 12
        path.append((0, 0.93 + 0.36 * math.sin(a) * 0.55, 0.38 - 0.38 * math.cos(a)))
    path.append((0, 0.82, 0.78))
    p.tube(path, 0.06, rseg=14)
    p.cyl((0, 0.72, 0.78), 0.075, 0.12, r2=0.07, bevel=0.02, seg=20)        # nozzle
    p.paint_fn(lambda q, n: n.y < -0.5 and q.y < 0.76 and q.z > 0.7, 0x8fa3b8)
    p.paint_fn(lambda q, n: q.y < 0.07, CHROME_D)
    # shine streaks (crisp white)
    p.layer('shine', base=0xffffff, target_faces=150, voxel=0.006)
    p.capsule((-0.05, 0.12, 0.06), (-0.05, 0.26, 0.055), 0.016, group='s1')
    p.layer('skin')
    # the lever on the right (own bone): a short round arm out of the column, a chunky round knob on it with a
    # domed cap that is half red (hot) and half blue (cold)
    p.layer('handle', base=CHROME, target_faces=900, voxel=0.009)
    HX = 0.3
    p.capsule((0.06, 0.15, 0), (HX - 0.02, 0.15, 0), 0.05, group='arm')
    p.cyl((HX, 0.08, 0), 0.105, 0.17, r2=0.095, bevel=0.04, seg=28)
    p.capsule((HX, 0.24, 0), (HX + 0.13, 0.29, 0), 0.042, group='lever')
    p.blob((HX + 0.15, 0.295, 0), (0.06, 0.05, 0.06), group='lever')
    p.layer('dot', base=0xff5a5a, target_faces=360, voxel=0.006)
    p.lathe(rounded([(0.0, 0.0), (0.075, 0.0), (0.072, 0.02), (0.0, 0.035)], 0.012, n=2), pos=(HX, 0.25, 0), seg=28)
    p.paint_fn(lambda q, n: q.z < 0, 0x4a9cff)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 0.9, 0))
    p.bone('handle', (HX, 0.1, 0), (HX, 0.4, 0), parent='body', region=lambda q: q.x > 0.18 and q.y > 0.05 and q.y < 0.4)
    p.anchor('spout', (0, 0.7, 0.78), 'body')
    p.extras['outline'] = 0.018
    p.build()


def tapsnack():
    """prop_k_tapsnack: Snack chef's low tap, so it never comes up in front of a friend's face (nothing higher than
    y 0.55): a chunky chrome pillar (origin at its foot, on the worktop) with a round lever knob on top (bone 'handle',
    turns about y; a paddle points back (-z); the cap is half red (hot), half blue (cold)), and a long low spout that
    reaches out along +z and turns down at its tip: the water leaves at (0, 0.28, 0.72) (anchor 'spout')."""
    p = Prop('prop_k_tapsnack', base=CHROME, target_faces=2400, voxel=0.011, smooth=3)
    p.cyl((0, 0, 0), 0.16, 0.06, r2=0.145, bevel=0.025, seg=28)            # the round foot
    p.cyl((0, 0.04, 0), 0.095, 0.33, r2=0.085, bevel=0.02, seg=28)         # the pillar
    # the spout: straight out at y 0.29, a soft bend down at the tip, a little flared nozzle
    R = 0.07
    Y = 0.37
    path = [(0, Y, 0.0), (0, Y, 0.3), (0, Y, 0.72 - R)]
    for i in range(1, 7):
        a = (math.pi / 2) * i / 6
        path.append((0, Y - R * (1 - math.cos(a)), 0.72 - R + R * math.sin(a)))
    p.tube(path, 0.056, rseg=16)
    p.cyl((0, Y - 0.09, 0.72), 0.062, 0.03, r2=0.058, bevel=0.01, seg=20)
    p.paint_fn(lambda q, n: n.y < -0.5 and q.y < Y - 0.08 and q.z > 0.66, 0x8fa3b8)
    p.paint_fn(lambda q, n: q.y < 0.07 and q.z < 0.3, CHROME_D)
    p.layer('shine', base=0xffffff, target_faces=150, voxel=0.006)
    p.capsule((-0.044, Y + 0.028, 0.12), (-0.044, Y + 0.032, 0.5), 0.012, group='s1')
    p.capsule((-0.07, 0.1, 0.04), (-0.07, 0.28, 0.04), 0.013, group='s2')
    p.layer('skin')
    # the lever: a chunky round knob on top of the pillar with a short paddle pointing back, and a red / blue cap
    p.layer('handle', base=CHROME, target_faces=900, voxel=0.009)
    p.cyl((0, 0.37, 0), 0.105, 0.11, r2=0.095, bevel=0.04, seg=28)
    p.capsule((0, 0.44, -0.04), (0, 0.46, -0.21), 0.04, group='lever')
    p.blob((0, 0.465, -0.23), (0.06, 0.045, 0.06), group='lever')
    p.layer('dot', base=0xff5a5a, target_faces=360, voxel=0.006)
    p.lathe(rounded([(0.0, 0.0), (0.075, 0.0), (0.072, 0.02), (0.0, 0.034)], 0.012, n=2), pos=(0, 0.475, 0), seg=28)
    p.paint_fn(lambda q, n: q.x > 0, 0x4a9cff)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 0.37, 0))
    p.bone('handle', (0, 0.37, 0), (0, 0.55, 0), parent='body', region=lambda q: (q.y > 0.405 and q.z < 0.12) or (q.y > 0.37 and q.z < -0.03))
    p.anchor('spout', (0, Y - 0.09, 0.72), 'body')
    p.extras['outline'] = 0.012
    p.build()


# ---------------- soap ----------------
def soap():
    p = Prop('prop_k_soap', base=0xff9ec4, target_faces=1500, voxel=0.01, smooth=3)
    prof = rounded([(0, 0), (0.2, 0), (0.22, 0.05), (0.22, 0.34), (0.17, 0.42), (0.08, 0.46), (0.07, 0.5), (0, 0.5)], 0.05, n=4)
    p.lathe(prof, seg=36)
    p.paint_fn(lambda q, n: n.y < -0.6, 0xe880aa)
    p.layer('label', base=0xffffff, target_faces=400, voxel=0.006)
    p.lathe(rounded([(0.218, 0.09), (0.232, 0.09), (0.232, 0.3), (0.218, 0.3)], 0.008, n=2, closed=True), closed=True, seg=36, a0=-1.0, a1=1.0)
    p.layer('bubble', base=0x8fd3ff, target_faces=260, voxel=0.005)
    for (x, y, r) in ((-0.03, 0.2, 0.045), (0.05, 0.16, 0.03), (0.04, 0.25, 0.022)):
        p.sticker(circle_poly(r, 14), y, lambda yy: 0.232, thick=0.01, ang=x / 0.232, lift=0.003)
    p.layer('pump', base=0xffffff, target_faces=700, voxel=0.008)
    p.cyl((0, 0.48, 0), 0.04, 0.16, bevel=0.01, seg=16)
    p.box((0.04, 0.66, 0), (0.12, 0.045, 0.06), bevel=0.035)
    p.capsule((0.15, 0.65, 0), (0.22, 0.6, 0), 0.025, group='nz')
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 0.45, 0))
    p.bone('pump', (0, 0.5, 0), (0, 0.72, 0), parent='body', region=lambda q: q.y > 0.5)
    p.extras['outline'] = 0.016
    p.build()


# ---------------- towel ----------------
def smooth01(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def cloth(p, W, front, back, thick=0.036, bar=0.034, nu=28, nv=40, corner=0.09, wave=0.034, folds=3.5):
    """A hand towel draped over a bar that runs along x through the origin: a soft fold over the top, a front flap
    (+z side) `front` long and a back flap `back` long, each with a rounded hem and a few soft vertical folds that
    deepen toward the hem. Built as one closed thick sheet (outer and inner skins joined round the edges)."""
    R = bar + thick / 2                            # the fold's mid-surface radius round the bar
    arc = math.pi * R
    L = back + arc + front                         # the length of the cloth's mid-line, back hem -> front hem

    def mid(v):
        """the mid-line point (y, z) and its outward normal (ny, nz) at distance v from the back hem"""
        if v < back:                                # back flap: hangs down at z = -R, a little flare at the hem
            d = back - v
            fl = 0.05 * smooth01(d / back) ** 2
            return (-d, -R - fl), (0.0, -1.0)
        if v < back + arc:                          # the fold over the bar
            a = (v - back) / R                      # 0..pi, from the back round over the top to the front
            return (R * math.sin(a), -R * math.cos(a)), (math.sin(a), -math.cos(a))
        d = v - back - arc                          # front flap
        fl = 0.075 * smooth01(d / front) ** 2
        return (-d, R + fl), (0.0, 1.0)

    def hem_cut(u):
        """how far each hem is trimmed at this x (rounded bottom corners)"""
        ax = abs(u)
        if ax <= W - corner:
            return 0.0
        dx = ax - (W - corner)
        return corner - math.sqrt(max(0.0, corner * corner - dx * dx))

    verts, faces = [], []
    grid = {}
    for side, sgn in (('o', 1), ('i', -1)):
        for iu in range(nu + 1):
            u = -W + 2 * W * iu / nu
            cut = hem_cut(u)
            for iv in range(nv + 1):
                v = cut + (L - 2 * cut) * iv / nv
                (y, z), (ny, nz) = mid(v)
                # soft vertical folds on the flaps (none over the bar), deeper toward the hems
                if v < back:
                    k = smooth01((back - v) / back)
                elif v > back + arc:
                    k = smooth01((v - back - arc) / front)
                else:
                    k = 0.0
                w = wave * k * math.sin(u / W * math.pi * folds + 0.6)
                ox = 0.012 * k * math.sin(u / W * math.pi * folds * 2)
                pos = (u + ox, y + ny * (w + sgn * thick / 2), z + nz * (w + sgn * thick / 2))
                grid[(side, iu, iv)] = len(verts)
                verts.append(pos)
    q = lambda *k: grid[k]
    for iu in range(nu):
        for iv in range(nv):
            faces.append((q('o', iu, iv), q('o', iu + 1, iv), q('o', iu + 1, iv + 1), q('o', iu, iv + 1)))
            faces.append((q('i', iu, iv), q('i', iu, iv + 1), q('i', iu + 1, iv + 1), q('i', iu + 1, iv)))
    for iu in range(nu):            # the two hems
        for iv in (0, nv):
            faces.append((q('o', iu, iv), q('i', iu, iv), q('i', iu + 1, iv), q('o', iu + 1, iv)))
    for iv in range(nv):            # the two side edges
        for iu in (0, nu):
            faces.append((q('o', iu, iv), q('o', iu, iv + 1), q('i', iu, iv + 1), q('i', iu, iv)))
    p.mesh(verts, faces)
    return R


TOWEL = dict(W=0.25, front=0.36, back=0.3)


def towel():
    """prop_k_towel: a soft terry hand towel draped over a bar (origin = the bar's centre; the bar runs along x).
    Coral with two white stripes and a darker woven band near each hem. Bones: 'body', and 'flapF' / 'flapB' that
    swing the front / back flap open (rotation.x) so it can drape over a friend's paws."""
    # (no remesh: the stripes follow the cloth's own rows, so they stay clean)
    p = SProp('prop_k_towel', base=0xff8f6b, target_faces=2600, voxel=0.0105, smooth=2)
    W, F, B = TOWEL['W'], TOWEL['front'], TOWEL['back']
    R = cloth(p, W, F, B)
    # stripes and the woven hem band: by height, on both flaps (the flaps hang straight down from y 0)
    for y0, y1, c in ((-F + 0.035, -F + 0.075, 0xe8664a), (-F + 0.13, -F + 0.165, 0xffffff), (-F + 0.2, -F + 0.225, 0xffffff)):
        p.paint_fn(lambda q, n, y0=y0, y1=y1: q.z > 0.02 and y0 < q.y < y1, c)
    for y0, y1, c in ((-B + 0.035, -B + 0.075, 0xe8664a), (-B + 0.13, -B + 0.165, 0xffffff), (-B + 0.2, -B + 0.225, 0xffffff)):
        p.paint_fn(lambda q, n, y0=y0, y1=y1: q.z < -0.02 and y0 < q.y < y1, c)
    p.paint_fn(lambda q, n: abs(q.x) > W - 0.028 and q.y < -0.06, 0xf57a58)    # the hemmed side edges
    p.bone('body', (0, -0.02, 0), (0, 0.06, 0))
    p.bone('flapF', (0, 0.0, R), (0, -F, R + 0.03), parent='body', region=lambda q: q.z > 0.0 and q.y < -0.02)
    p.bone('flapB', (0, 0.0, -R), (0, -B, -R - 0.03), parent='body', region=lambda q: q.z < 0.0 and q.y < -0.02)
    p.extras['outline'] = 0.016
    p.build()


def towelrail():
    """prop_k_towelrail: a chrome rail screwed to a cupboard front (origin = the bar's centre, the brackets go back
    to z -0.16). The towel hangs over it (prop_k_towel at the same origin)."""
    p = SProp('prop_k_towelrail', base=CHROME, voxel=0.008, target_faces=900)
    HW = 0.36
    p.tube(rounded([(-HW, 0.0, -0.15), (-HW, 0.0, 0.0), (HW, 0.0, 0.0), (HW, 0.0, -0.15)], 0.05, n=4), 0.026, rseg=12)
    for s in (-1, 1):
        p.cyl((s * HW, 0.0, -0.17), 0.065, 0.035, rot=(90, 0, 0), bevel=0.012, seg=20)
    p.paint_fn(lambda q, n: q.z < -0.13, CHROME_D)
    p.bone('body', (0, -0.1, 0), (0, 0.1, 0))
    p.extras['outline'] = 0.014
    p.build()


TOWELSTAND_H = 0.44


def towelstand():
    """prop_k_towelstand: a little chrome towel stand for the worktop: an oval foot, two posts and a bar at y 0.44
    (origin on the worktop under the bar's middle). The towel hangs over the bar."""
    p = SProp('prop_k_towelstand', base=CHROME, voxel=0.008, target_faces=1400)
    H, HW = TOWELSTAND_H, 0.3
    p.cyl((0, 0, 0), 0.37, 0.05, bevel=0.022, scale=(1.0, 0.45), seg=40)
    # one chrome arch: up the left post, over the top (the towel bar), down the right post
    arch = rounded([(-HW, 0.03, 0.0), (-HW, H, 0.0), (HW, H, 0.0), (HW, 0.03, 0.0)], 0.09, n=6)
    p.tube(arch, 0.028, rseg=12)
    for sx in (-1, 1):
        p.cyl((sx * HW, 0.03, 0), 0.05, 0.05, r2=0.035, bevel=0.012, seg=16)
    p.paint_fn(lambda q, n: q.y < 0.04, CHROME_D)
    p.layer('feet', base=0x9aa9ba, voxel=0.008, target_faces=200)
    p.cyl((0, -0.005, 0), 0.35, 0.012, bevel=0.004, scale=(1.0, 0.43), seg=32)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, H, 0))
    p.extras['outline'] = 0.014
    p.build()


# ---------------- fridge ----------------
def fridge():
    p = SProp('prop_k_fridge', base=0x9ed8f0, voxel=0.024, target_faces=4200)
    W, D, H = 0.95, 0.75, 4.2
    FZ = D - 0.2          # the cabinet's front opening plane (the door sits in front of it)
    wall = 0.12
    # the hollow cabinet: back, sides, top (domed), bottom
    p.box((0, H / 2, -D + wall / 2 + 0.02), (W, H / 2 - 0.02, wall / 2 + 0.02), bevel=0.08)
    for s in (-1, 1):
        p.box((s * (W - wall / 2), H / 2, (FZ - D) / 2), (wall / 2, H / 2 - 0.02, (FZ + D) / 2), bevel=0.08)
    p.box((0, H - 0.18, (FZ - D) / 2), (W, 0.18, (FZ + D) / 2), bevel=0.16)
    p.box((0, 0.25, (FZ - D) / 2), (W, 0.25, (FZ + D) / 2), bevel=0.08)
    # little feet
    for s in (-1, 1):
        p.cyl((s * 0.7, -0.02, 0.0), 0.09, 0.08, bevel=0.02, seg=12)
    p.paint_fn(lambda q, n: q.y < 0.08, 0x6b8aa0)
    # the inside: pale, with two shelves
    inner = lambda q: abs(q.x) < W - wall + 0.01 and q.z > -D + wall + 0.01 and 0.5 - 0.01 < q.y < H - 0.36 + 0.01
    p.paint_fn(lambda q, n: inner(q), 0xeaf6ff)
    p.paint_fn(lambda q, n: inner(q) and q.z < -D + wall + 0.03, 0xcfe9fb)          # the back wall, a cool blue
    p.layer('shelves', base=0xffffff, voxel=0.014, target_faces=1400)
    for y in SHELVES:
        p.box((0, y - 0.04, (FZ - D + wall) / 2 - 0.03), (W - wall - 0.005, 0.04, (FZ + D - wall) / 2 - 0.06), bevel=0.02)
        # a rounded lip along the front of each shelf
        p.tube([(-(W - wall - 0.02), y + 0.01, FZ - 0.1), (W - wall - 0.02, y + 0.01, FZ - 0.1)], 0.03, rseg=10)
    # the drawer at the bottom (salad crisper) with a handle groove
    p.box((0, 0.68, (FZ - D + wall) / 2 - 0.02), (W - wall - 0.01, 0.16, (FZ + D - wall) / 2 - 0.05), bevel=0.04)
    p.paint_fn(lambda q, n: q.y < 0.86 and n.z > 0.5 and abs(q.y - 0.74) < 0.03 and abs(q.x) < 0.3, 0xbfe0f5)
    p.layer('light', base=0xfff2a8, voxel=0.008, target_faces=300)
    p.blob((0, H - 0.4, -0.2), (0.16, 0.05, 0.1), group='lamp')
    p.layer('skin')
    # the door: a thick rounded slab in front of the opening, handle on the right
    p.layer('door', base=0x9ed8f0, voxel=0.02, target_faces=1600)
    DZ = FZ + 0.16       # the door slab's back face sits 0.05 in front of the cabinet rim
    p.box((0, H / 2 + 0.02, DZ), (W - 0.02, H / 2 - 0.08, 0.11), bevel=0.1)
    p.paint_fn(lambda q, n: n.z < -0.5, 0xd6eefa)                     # the door's inner face is pale
    p.paint_fn(lambda q, n: n.z > 0.5 and abs(q.y - 3.0) < 0.05, 0x5aa8d0)    # a clear split line between freezer and fridge
    p.layer('handle', base=CHROME, voxel=0.01, target_faces=600)
    p.tube([(-W + 0.34, 3.3, DZ + 0.1), (-W + 0.24, 3.3, DZ + 0.25), (-W + 0.24, 1.7, DZ + 0.25), (-W + 0.34, 1.7, DZ + 0.1)], 0.07, rseg=12)   # chunky handle
    p.layer('magnets', base=0xff6b6b, voxel=0.008, target_faces=900)
    for (x, y, c, k) in ((0.45, 3.55, 0xff6b6b, 0), (0.1, 3.45, 0xffd23f, 1), (0.25, 2.2, 0x6bd968, 2), (-0.25, 1.4, 0xb38cff, 3)):
        p.blob((x, y, DZ + 0.12), (0.11, 0.11, 0.05), group='m%d' % k)
    p.paint_fn(lambda q, n: q.y > 3.3 and q.x < 0.3, 0xffd23f)
    p.paint_fn(lambda q, n: q.y > 3.5 and q.x > 0.3, 0xff6b6b)
    p.paint_fn(lambda q, n: 2.0 < q.y < 2.4, 0x6bd968)
    p.paint_fn(lambda q, n: q.y < 1.6, 0xb38cff)
    # a child's drawing (a sun over a house on grass) held up by the yellow magnet: paper, then crisp cut-out shapes
    p.layer('drawing', base=0xffffff, voxel=0.008, target_faces=500)
    PZ = DZ + 0.115
    p.box((0.12, 2.95, PZ), (0.36, 0.42, 0.012), bevel=0.01)
    p.layer('art', base=0xff6b6b, voxel=0.006, target_faces=700)
    p.blob((0.3, 3.18, PZ + 0.015), (0.085, 0.085, 0.01), group='sun')
    p.box((0.04, 2.73, PZ + 0.015), (0.13, 0.11, 0.008), bevel=0.005)
    p.mesh([(-0.13, 2.84, PZ + 0.008), (0.21, 2.84, PZ + 0.008), (0.04, 3.02, PZ + 0.008), (-0.13, 2.84, PZ + 0.024), (0.21, 2.84, PZ + 0.024), (0.04, 3.02, PZ + 0.024)],
           [(0, 1, 2), (3, 5, 4), (0, 3, 4, 1), (1, 4, 5, 2), (2, 5, 3, 0)])
    p.box((0.12, 2.6, PZ + 0.014), (0.33, 0.05, 0.008), bevel=0.005)
    p.paint_fn(lambda q, n: q.y > 3.08, 0xffc531)
    p.paint_fn(lambda q, n: 2.84 <= q.y <= 3.08 and q.x < 0.25, 0x5a8cff)
    p.paint_fn(lambda q, n: q.y < 2.66, 0x6bd968)
    p.layer('skin')
    door = lambda q: q.z > FZ + 0.025
    p.bone('body', (0, 0, -0.3), (0, H, -0.3), region=lambda q: not door(q))
    p.bone('door', (W - 0.02, 0.2, DZ), (W - 0.02, H - 0.2, DZ), parent='body', region=door)
    p.extras['outline'] = 0.024
    p.build()


# ---------------- board ----------------
def board():
    """prop_k_board: a wooden chopping board 1.7 x 1.0 x 0.1 (bottom at y 0, x -0.85..0.85 plus a handle tab to x 1.17)
    with a hanging hole in the tab. One clean slab: a flat-shaded top with a soft juice groove round its edge and a
    few long grain lines, darker sides."""
    p = FlatProp('prop_k_board', base=0xe9b77e, voxel=0.014, target_faces=1400)
    L, Wd, H = 0.85, 0.5, 0.1
    poly = rounded([(-L, -Wd), (L, -Wd), (L, -0.16), (L + 0.32, -0.12), (L + 0.32, 0.12), (L, 0.16), (L, Wd), (-L, Wd)], 0.1, n=4, closed=True)
    p.prism(poly, 0.0, H, bevel=0.03, axis='y')
    p.layers['skin']['edge'] = 0.22
    p.flat = ('skin',)
    p.paint_fn(lambda q, n: n.y < 0.6, 0xcf965a)
    p.paint_fn(lambda q, n: n.y > 0.6 and math.hypot(q.x - (L + 0.18), q.z) < 0.065, 0x9a6a3a)   # the hanging hole
    # the juice groove: a thin darker band 0.1 in from the edge of the cutting area
    groove = lambda q: q.x < L - 0.02 and (L - 0.13 < max(abs(q.x + 0.0), 0) < L - 0.1 and abs(q.z) < Wd - 0.1 or Wd - 0.13 < abs(q.z) < Wd - 0.1 and abs(q.x) < L - 0.1)
    p.paint_fn(lambda q, n: n.y > 0.6 and groove(q), 0xd9a265)
    for gz in (-0.27, -0.05, 0.19):
        p.paint_fn(lambda q, n, gz=gz: n.y > 0.6 and abs(q.z - gz - 0.03 * math.sin(q.x * 3)) < 0.008 and abs(q.x) < L - 0.2 and abs(q.z) < Wd - 0.16, 0xdcaa6e)
    p.bone('body', (0, 0, 0), (0, H, 0))
    p.extras['outline'] = 0.018
    p.build()


# ---------------- divided plates ----------------
FLOOR = 0.075


def flat_icon(p, poly, cx, cz, y=FLOOR + 0.004, t=0.012, s=1.0):
    """a flat cut-out lying on the plate floor: poly is (x, up) with 'up' pointing away from us (-z)"""
    pts = [(cx + x * s, cz - yy * s) for x, yy in poly]
    n = len(pts)
    mx, mz = sum(q[0] for q in pts) / n, sum(q[1] for q in pts) / n
    verts = [(mx, y, mz), (mx, y + t, mz)] + [(x, y, z) for x, z in pts] + [(x, y + t, z) for x, z in pts]
    faces = []
    for i in range(n):
        j = (i + 1) % n
        faces.append((0, 2 + j, 2 + i))
        faces.append((1, 2 + n + i, 2 + n + j))
        faces.append((2 + i, 2 + j, 2 + n + j, 2 + n + i))
    p.mesh(verts, faces)


def circ(r, n=14, sx=1.0, sy=1.0, ox=0.0, oy=0.0):
    return [(ox + r * sx * math.cos(math.tau * i / n), oy + r * sy * math.sin(math.tau * i / n)) for i in range(n)]


def berry_poly():
    out = []
    for i in range(28):
        a = i / 28 * math.tau
        x = math.sin(a) * 0.5 * (1 - 0.3 * max(0, -math.cos(a)))
        y = 0.42 * math.cos(a) if math.cos(a) > 0 else 0.62 * math.cos(a)
        out.append((x, y - 0.02))
    return out


def leaf_star(r=0.2, oy=0.42):
    return [(x, y + oy) for x, y in star_poly(r, inner=0.45, n=5, rot=90)]


def carrot_shape():
    pts = [(0.0, -0.66)]
    for i in range(1, 9):
        a = math.pi * i / 8
        pts.append((0.2 * math.cos(math.pi - a) * -1 if False else 0.2 * -math.cos(a), 0.28 + 0.1 * math.sin(a)))
    pts = [(0.0, -0.66), (0.17, 0.0)] + [(0.2 * math.cos(a), 0.28 + 0.06 * math.sin(a)) for a in [i * math.pi / 8 for i in range(9)]] + [(-0.17, 0.0)]
    return pts


def carrot_leaves():
    return [(0.0, 0.3), (0.16, 0.55), (0.1, 0.62), (0.03, 0.46), (0.0, 0.68), (-0.03, 0.46), (-0.1, 0.62), (-0.16, 0.55)]


def bread_shape():
    pts = [(-0.4, -0.5), (0.4, -0.5), (0.4, 0.12)]
    pts += [(0.22 + 0.22 * math.cos(a), 0.2 + 0.26 * math.sin(a)) for a in [i * math.pi / 8 for i in range(1, 9)]][:-1]
    pts += [(-0.22 + 0.22 * math.cos(a), 0.2 + 0.26 * math.sin(a)) for a in [i * math.pi / 8 for i in range(1, 9)]]
    pts += [(-0.4, 0.12)]
    return rounded(pts, 0.06, n=2, closed=True)


def bread_inner():
    return [(x * 0.74, y * 0.74 - 0.04) for x, y in bread_shape()]


def bottle_shape():
    return rounded([(-0.26, -0.58), (0.26, -0.58), (0.26, 0.12), (0.12, 0.3), (0.12, 0.46), (-0.12, 0.46), (-0.12, 0.3), (-0.26, 0.12)], 0.07, n=2, closed=True)


def cap_shape():
    return rounded([(-0.14, 0.44), (0.14, 0.44), (0.14, 0.6), (-0.14, 0.6)], 0.04, n=2, closed=True)


ICONS = {
    # food: [(layer colour, polygon, scale tweak)]
    'fruit': [(0xff4f6a, berry_poly()), (0x5cc552, leaf_star(0.2, 0.42))] + [(0xffe066, circ(0.035, 8, ox=x, oy=y)) for x, y in ((-0.18, 0.12), (0.16, 0.14), (0.0, -0.08), (-0.14, -0.26), (0.12, -0.3), (0.0, 0.26))],
    'veg': [(0xff8a2a, carrot_shape()), (0x5cc552, carrot_leaves())] + [(0xe86f12, [(x - 0.07, y), (x + 0.05, y - 0.02), (x + 0.05, y + 0.02)]) for x, y in ((0.0, -0.1), (0.02, -0.35))],
    'grain': [(0xd38a3c, bread_shape()), (0xffe0a1, bread_inner())],
    'dairy': [(0xffffff, bottle_shape()), (0x4a8cff, cap_shape()), (0x9fd0ff, rounded([(-0.2, -0.35), (0.2, -0.35), (0.2, -0.05), (-0.2, -0.05)], 0.04, n=2, closed=True))],
}


def plate(name, R, rim_col, floor_cols, cuts, icons, divider):
    """A chunky toddler plate (origin on the table, floor top at y 0.075, rim top ~0.2): white with a coloured rim
    band, pastel sections, one moulded rounded divider, and a crisp outlined food picture in each section."""
    # (built without remeshing: the cut-out pictures and the divider keep crisp edges)
    p = SProp(name, base=0xfffdf8, target_faces=3600, voxel=0.012, smooth=2)
    p.lathe(rounded([(0.0, 0.02), (R * 0.62, 0.0), (R * 0.8, 0.04), (R, 0.15), (R, 0.19), (R * 0.95, 0.2), (R * 0.78, FLOOR + 0.005), (0.0, FLOOR)], 0.03, n=3), seg=72)
    p.paint_fn(lambda q, n: n.y < -0.3, 0xe8e2d8)
    for test, col in floor_cols:
        p.paint_fn(lambda q, n, test=test: n.y > 0.85 and q.y < FLOOR + 0.02 and math.hypot(q.x, q.z) < R * 0.79 and test(q.x, q.z), col)
    # the coloured rim band (its own layer: a crisp edge and ink)
    p.layer('rim', base=rim_col, target_faces=1200, voxel=0.01)
    p.lathe(rounded([(R * 0.82, FLOOR + 0.035), (R * 0.985, 0.185), (R * 0.99, 0.215), (R * 0.81, FLOOR + 0.06)], 0.012, n=2, closed=True), closed=True, seg=72)
    # the divider: one rounded moulded piece
    p.layer('divider', base=0xffffff, target_faces=900, voxel=0.01)
    for (x0, z0), (x1, z1) in divider:
        L = math.hypot(x1 - x0, z1 - z0)
        ang = math.degrees(math.atan2(x1 - x0, z1 - z0))
        p.box(((x0 + x1) / 2, FLOOR + 0.045, (z0 + z1) / 2), (0.035, 0.05, L / 2), rot=(0, ang, 0), bevel=0.03)
    # the pictures
    cols = {}
    for g, (cx, cz), k in icons:
        for col, poly in ICONS[g]:
            cols.setdefault(col, []).append((poly, cx, cz, k))
    for i, (col, items) in enumerate(cols.items()):
        p.layer('pic%d' % i, base=col, target_faces=500, voxel=0.006)
        for poly, cx, cz, k in items:
            lift = 0.0 if col in (0xff4f6a, 0xff8a2a, 0xd38a3c, 0xffffff) else 0.012
            flat_icon(p, poly, cx, cz, y=FLOOR + 0.004 + lift, s=k)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 0.2, 0))
    p.extras['outline'] = 0.016
    p.build()


def plate2():
    R = 1.05
    w = R * 0.79
    plate('prop_k_plate2', R, 0x56c7a0, [(lambda x, z: x < 0, 0xffd3df), (lambda x, z: x >= 0, 0xd5f1c0)], None,
          [('fruit', (-0.46, 0.0), 0.5), ('veg', (0.46, 0.0), 0.5)], [((0, -w), (0, w))])


def plate4():
    R = 1.25
    w = R * 0.79
    plate('prop_k_plate4', R, 0xffa94d, [
        (lambda x, z: x < 0 and z < 0, 0xffd3df), (lambda x, z: x >= 0 and z < 0, 0xd5f1c0),
        (lambda x, z: x < 0 and z >= 0, 0xffeab0), (lambda x, z: x >= 0 and z >= 0, 0xcfe6ff)], None,
          [('fruit', (-0.47, -0.45), 0.42), ('veg', (0.47, -0.45), 0.42), ('grain', (-0.47, 0.45), 0.42), ('dairy', (0.47, 0.45), 0.42)],
          [((0, -w), (0, w)), ((-w, 0), (w, 0))])


# ---------------- fruit bowl ----------------
def fruitbowl():
    """prop_k_bowl: Snack chef's deep fruit bowl (origin on the worktop at its middle): a glazed ceramic bowl, rim radius
    0.97 at y 0.47, a wide flat floor (radius 0.62) at y 0.13 for the fruit, a cream inside you can see into, a sunny
    coral outside with white polka dots, and a rolled white rim."""
    p = Prop('prop_k_bowl', base=0xff8a6e, target_faces=3200, voxel=0.011, smooth=2)
    p.quadriflow = False
    outer = [(0.0, 0.0), (0.5, 0.0), (0.56, 0.035), (0.8, 0.14), (0.95, 0.3), (0.99, 0.43)]
    inner = [(0.93, 0.455), (0.9, 0.33), (0.78, 0.2), (0.62, 0.135), (0.0, 0.13)]
    p.lathe(rounded(outer + inner, 0.03, n=3), seg=72)
    p.paint_fn(lambda q, n: q.y > 0.115 and math.hypot(q.x, q.z) < 0.935 and (n.x * q.x + n.z * q.z) <= 0.1 * math.hypot(q.x, q.z) + 1e-6 and n.y > -0.3, 0xfff1df)
    p.paint_fn(lambda q, n: q.y > 0.115 and math.hypot(q.x, q.z) < 0.6 and n.y > 0.8, 0xffe6cc)
    p.paint_fn(lambda q, n: q.y < 0.05, 0xe86a52)
    p.layer('rim', base=0xffffff, target_faces=800, voxel=0.01)
    p.ring((0, 0.452, 0), 0.955, 0.04, seg=72, rseg=10)
    p.layer('dots', base=0xffffff, target_faces=900, voxel=0.006)

    def outer_r(y):
        for (r0, y0), (r1, y1) in zip(outer[1:], outer[2:]):
            if y0 <= y <= y1:
                return r0 + (r1 - r0) * (y - y0) / (y1 - y0)
        return outer[-1][0]
    k = 0
    for row, (yy, n, off) in enumerate(((0.33, 14, 0.0), (0.18, 12, 0.5))):
        for i in range(n):
            ang = (i + off) / n * math.tau
            p.sticker(circle_poly(0.045, 14), yy, outer_r, thick=0.012, ang=ang, lift=0.004)
            k += 1
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 0.5, 0))
    p.extras['outline'] = 0.02
    p.build()


# ---------------- the dining table ----------------
def diningtable():
    """prop_k_table: the long table in the dining corner (origin on the floor at its middle): top 8.1 x 2.5 at y 0.92
    (x +-4.05, z +-1.25), under a red-and-white checked cloth that hangs in soft folds to y ~0.3 all round (it hides
    the friends' legs and the stools), with a scalloped white trim (layer 'edge'). Chunky wooden legs show below."""
    p = SProp('prop_k_table', base=0xc98a4e, voxel=0.02, target_faces=1200)
    HX, HZ, Y = 4.05, 1.25, 0.92
    for sx in (-1, 1):
        for sz in (-1, 1):
            p.cyl((sx * (HX - 0.35), 0.0, sz * (HZ - 0.3)), 0.11, 0.6, r2=0.13, bevel=0.03, seg=16)
    p.box((0, Y - 0.12, 0), (HX - 0.05, 0.1, HZ - 0.05), bevel=0.04)
    p.paint_fn(lambda q, n: q.y < 0.05, 0xa86c38)
    # the cloth: a slab on top and a skirt all round, rippled into soft folds, double-skinned
    p.layer('cloth', base=0xffffff, voxel=0.018, target_faces=5000)
    T, LO = 0.03, 0.34
    C = 0.3375                                  # one check (the top's grid lines fall on the check borders)
    # the cloth's top: a grid of quads, one per check, so each check is one crisp colour
    nx, nz = int(round(2 * (HX + 0.06) / C)), int(round(2 * (HZ + 0.06) / C))
    gx, gz = (HX + 0.06) * 2 / nx, (HZ + 0.06) * 2 / nz
    tv, tf = [], []
    for yy in (Y + 0.045, Y - 0.005):
        for i in range(nx + 1):
            for j in range(nz + 1):
                tv.append((-(HX + 0.06) + i * gx, yy, -(HZ + 0.06) + j * gz))
    G = lambda layer, i, j: layer * (nx + 1) * (nz + 1) + i * (nz + 1) + j
    for i in range(nx):
        for j in range(nz):
            tf.append((G(0, i, j), G(0, i, j + 1), G(0, i + 1, j + 1), G(0, i + 1, j)))
            tf.append((G(1, i, j), G(1, i + 1, j), G(1, i + 1, j + 1), G(1, i, j + 1)))
    for i in range(nx):
        for j in (0, nz):
            tf.append((G(0, i, j), G(0, i + 1, j), G(1, i + 1, j), G(1, i, j)) if j == 0 else (G(0, i, j), G(1, i, j), G(1, i + 1, j), G(0, i + 1, j)))
    for j in range(nz):
        for i in (0, nx):
            tf.append((G(0, i, j), G(1, i, j), G(1, i, j + 1), G(0, i, j + 1)) if i == 0 else (G(0, i, j), G(0, i, j + 1), G(1, i, j + 1), G(1, i, j)))
    p.mesh(tv, tf)
    CHK = (gx, gz)

    def perim(t):
        """a point on the cloth's outline (rounded rectangle) at t in [0, 1), and its outward normal"""
        L1, L2 = 2 * HX, 2 * HZ
        tot = 2 * (L1 + L2)
        d = t * tot
        if d < L1: return (-HX + d, HZ + 0.06), (0, 1)
        d -= L1
        if d < L2: return (HX + 0.06, HZ - d), (1, 0)
        d -= L2
        if d < L1: return (HX - d, -HZ - 0.06), (0, -1)
        d -= L1
        return (-HX - 0.06, -HZ + d), (-1, 0)
    N, M = 176, 4
    verts, faces = [], []
    for side, off in ((0, 0.0), (1, -T)):
        for i in range(N):
            t = i / N
            (x, z), (nx, nz) = perim(t)
            for j in range(M + 1):
                v = j / M
                y = Y + 0.02 - (Y + 0.02 - LO) * v
                w = (0.05 * math.sin(t * N / 2.6) + 0.015 * math.sin(t * N / 1.3 + 1.0)) * v * v     # folds deepen downward
                o = 0.015 + w + off + 0.05 * v * v
                hem = 0.03 * (0.5 + 0.5 * math.cos(i * math.pi)) if j == M else 0.0
                verts.append((x + nx * o, y - hem, z + nz * o))
    idx = lambda side, i, j: side * N * (M + 1) + (i % N) * (M + 1) + j
    for i in range(N):
        for j in range(M):
            faces.append((idx(0, i, j), idx(0, i + 1, j), idx(0, i + 1, j + 1), idx(0, i, j + 1)))
            faces.append((idx(1, i, j), idx(1, i, j + 1), idx(1, i + 1, j + 1), idx(1, i + 1, j)))
        faces.append((idx(0, i, M), idx(0, i + 1, M), idx(1, i + 1, M), idx(1, i, M)))
        faces.append((idx(0, i, 0), idx(1, i, 0), idx(1, i + 1, 0), idx(0, i + 1, 0)))
    p.mesh(verts, faces)
    def check(q):
        if q.y > Y - 0.012 and abs(q.x) < HX + 0.07 and abs(q.z) < HZ + 0.07:
            a, b = (q.x + HX + 0.06) / CHK[0] + 0.5, (q.z + HZ + 0.06) / CHK[1] + 0.5
            return (int(math.floor(a - 0.5)) + int(math.floor(b - 0.5))) % 2 == 0
        a = q.x if abs(q.z) > HZ else q.z
        return (int(math.floor(a / C)) + int(math.floor(q.y / C))) % 2 == 0
    p.paint_fn(lambda q, n: check(q), 0xff9a9a)
    # a white ribbon trim along the top edge and a red one along the hem
    p.layer('edge', base=0xffffff, voxel=0.012, target_faces=1600)
    loop = rounded([(-HX - 0.1, Y + 0.035, -HZ - 0.1), (HX + 0.1, Y + 0.035, -HZ - 0.1), (HX + 0.1, Y + 0.035, HZ + 0.1), (-HX - 0.1, Y + 0.035, HZ + 0.1)], 0.12, n=4, closed=True)
    p.tube(loop, 0.035, closed=True, rseg=10)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, Y, 0))
    p.extras['outline'] = 0.022
    p.build()


# ---------------- canisters for the shelf ----------------
def jars():
    p = Prop('prop_k_jars', base=0xfffaf2, target_faces=2400, voxel=0.012, smooth=3)
    J = [(-0.75, 0.62, 0.26, 0xff9ec4), (0.0, 0.85, 0.3, 0x8ed6c0), (0.72, 0.5, 0.24, 0xffd23f)]
    for x, h, r, c in J:
        p.lathe(rounded([(0, 0), (r, 0), (r, h), (0, h)], 0.06, n=3), pos=(x, 0, 0), seg=32)
    p.paint_fn(lambda q, n: n.y < -0.6, 0xe9e2d6)
    for k, (x, h, r, c) in enumerate(J):
        p.layer('lid%d' % k, base=c, target_faces=500, voxel=0.01)
        p.cyl((x, h - 0.02, 0), r + 0.03, 0.12, bevel=0.04, seg=28)
        p.blob((x, h + 0.14, 0), (0.07, 0.06, 0.07), group='knob%d' % k)
        p.layer('label%d' % k, base=c, target_faces=300, voxel=0.006)
        y0 = h * 0.45
        p.lathe(rounded([(r - 0.004, y0 - 0.11), (r + 0.014, y0 - 0.11), (r + 0.014, y0 + 0.11), (r - 0.004, y0 + 0.11)], 0.01, n=2, closed=True), pos=(x, 0, 0), closed=True, seg=24, a0=-0.62, a1=0.62)
        p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 0.9, 0))
    p.extras['outline'] = 0.02
    p.build()


MODELS = dict(prop_k_jars=jars, prop_k_counter=counter, prop_k_tap=tap, prop_k_tapsnack=tapsnack, prop_k_soap=soap, prop_k_towel=towel, prop_k_towelrail=towelrail,
              prop_k_towelstand=towelstand, prop_k_fridge=fridge,
              prop_k_board=board, prop_k_bowl=fruitbowl, prop_k_table=diningtable, prop_k_plate2=plate2, prop_k_plate4=plate4)
for name, fn in MODELS.items():
    if not ONLY or name in ONLY:
        fn()
