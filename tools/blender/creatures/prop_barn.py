"""Red toy barn (farm scenery). 5 wide x 4 deep, gambrel roof ridge at 5.1 (+ cupola), front faces +z, floor y = 0.
Red walls on a stone footing, big double doors with white frames and X braces, an open hay loft with hay spilling
out under a little pulley beam, white corner boards, a slate roof with white gable fascia, a cupola with dark vents and
a weathervane, cross-paned side windows. Static: scenery.js draws each layer once (skin, trim, roof, hay)."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from skit import SProp, offset_line

RED, DOOR, STONE, DARK = 0xe8493c, 0xc23d33, 0xcdbcae, 0x5a3440
WHITE, ROOF, GLASS, METAL = 0xfff6e8, 0x66708f, 0xbfe6ff, 0x6a5a7a
HAY, HAY_D, WOOD = 0xf2cf5a, 0xd9ad3a, 0x9a6a44

W, D, EAVE, KX, KY, RIDGE = 2.5, 2.0, 3.0, 1.72, 4.35, 5.1
FOOT = 0.26
p = SProp('prop_barn', base=RED)
gable = [(-W, 0), (W, 0), (W, EAVE), (KX, KY), (0, RIDGE), (-KX, KY), (-W, EAVE)]
p.prism(gable, -D, D, bevel=0.1)
for s in (-1, 1):                                                  # door leaves, proud of the wall
    p.box((s * 0.56, FOOT + 1.06, D + 0.04), (0.52, 1.06, 0.05), bevel=0.03)
p.box((0, 3.84, D + 0.01), (0.5, 0.5, 0.02), bevel=0.01)           # dark loft opening
for s in (-1, 1):
    p.box((s * (W + 0.01), 1.82, 0), (0.02, 0.46, 0.44), bevel=0.01)   # window glass
p.box((0, RIDGE - 0.02, 0), (0.44, 0.27, 0.44), bevel=0.05)          # cupola base (mostly in the roof)
for a in range(4):                                                   # cupola vents
    ang = a * math.pi / 2
    p.box((0.4 * math.sin(ang), RIDGE + 0.52, 0.4 * math.cos(ang)), (0.2, 0.15, 0.03), rot=(0, math.degrees(ang), 0), bevel=0.012)
p.paint_fn(lambda q, n: q.z > D + 0.035 and abs(q.x) < 1.1 and q.y < 2.5, DOOR)
p.paint_fn(lambda q, n: q.z > D - 0.03 and abs(q.x) < 0.52 and 3.32 < q.y < 4.36, DARK)
p.paint_fn(lambda q, n: abs(q.x) > W - 0.005 and abs(q.z) < 0.46 and 1.34 < q.y < 2.3, GLASS)
p.paint_fn(lambda q, n: q.y > RIDGE - 0.3 and abs(q.x) < 0.5 and abs(q.z) < 0.5, WHITE)
p.paint_fn(lambda q, n: q.y > RIDGE + 0.33 and math.hypot(q.x, q.z) > 0.38, DARK)
p.paint_fn(lambda q, n: q.y < FOOT and not (q.z > D + 0.01 and abs(q.x) < 1.2), STONE)

# ---- white trim ----
p.layer('trim', base=WHITE)
p.layers['trim']['segs'] = 2
for sx in (-1, 1):
    for sz in (-1, 1):
        p.box((sx * W, EAVE / 2 + FOOT / 2, sz * D), (0.13, (EAVE - FOOT) / 2 + 0.02, 0.13), bevel=0.05)   # corner boards
ZF = D + 0.08
for x in (-1.2, 1.2):
    p.box((x, FOOT + 1.12, ZF), (0.1, 1.14, 0.07), bevel=0.04)       # jambs
p.box((0, FOOT + 2.22, ZF), (1.3, 0.1, 0.07), bevel=0.04)           # header
p.box((0, FOOT + 1.06, ZF + 0.01), (0.07, 1.06, 0.06), bevel=0.03)  # centre stile
for s in (-1, 1):
    cx = s * 0.6
    p.box((cx, FOOT + 0.08, ZF), (0.55, 0.08, 0.06), bevel=0.03)    # bottom rail
    p.box((cx, FOOT + 1.06, ZF), (0.55, 0.07, 0.06), bevel=0.03)    # mid rail
    for (y0, h) in ((FOOT + 0.575, 0.83), (FOOT + 1.625, 0.99)):    # the X in each panel
        th = math.degrees(math.atan2(1.0, h))
        half = math.hypot(1.0, h) / 2
        for k in (-1, 1):
            p.box((cx, y0, ZF + 0.005), (0.06, half, 0.045), rot=(0, 0, k * th), bevel=0.025)
for x in (-0.58, 0.58):                                              # loft frame + sill
    p.box((x, 3.84, D + 0.05), (0.08, 0.58, 0.07), bevel=0.03)
p.box((0, 4.42, D + 0.05), (0.66, 0.08, 0.07), bevel=0.03)
p.box((0, 3.26, D + 0.09), (0.74, 0.07, 0.13), bevel=0.03)
for s in (-1, 1):                                                    # side windows: frame + cross
    X = s * (W + 0.04)
    for z in (-0.5, 0.5):
        p.box((X, 1.82, z), (0.06, 0.54, 0.07), bevel=0.025)
    for y in (1.3, 2.34):
        p.box((X, y, 0), (0.06, 0.07, 0.57), bevel=0.025)
    p.box((X, 1.82, 0), (0.045, 0.46, 0.035), bevel=0.015)
    p.box((X, 1.82, 0), (0.045, 0.035, 0.46), bevel=0.015)
p.box((0, RIDGE + 0.5, 0), (0.4, 0.26, 0.4), bevel=0.04)            # cupola louvre box (vents sit on it)

# ---- roof: a thick gambrel band, white fascia on the gable ends, cupola cap and weathervane ----
p.layer('roof', base=ROOF)
line = [(-W, EAVE), (-KX, KY), (0, RIDGE), (KX, KY), (W, EAVE)]
ex = 0.4
dx, dy = W - KX, EAVE - KY
L = math.hypot(dx, dy)
line[0] = (-W - dx / L * ex, EAVE - dy / L * ex)
line[-1] = (W + dx / L * ex, EAVE - dy / L * ex)
outer = offset_line(line, -0.26)
inner = offset_line(line, 0.03)
p.prism(outer + inner[::-1], -D - 0.3, D + 0.3, bevel=0.07)
p.paint_fn(lambda q, n: abs(q.z) > D + 0.265 and q.y < RIDGE + 0.32, WHITE)
p.cyl((0, RIDGE + 0.74, 0), 0.8, 0.46, r2=0.04, rot=(0, 45, 0), seg=4, bevel=0.035)
p.cyl((0, RIDGE + 1.1, 0), 0.03, 0.55, seg=8, bevel=0.01)
p.lathe([(0, -0.08), (0.05, -0.065), (0.08, 0), (0.05, 0.065), (0, 0.08)], pos=(0, RIDGE + 1.7, 0), seg=12)
ARROW = [(-0.42, -0.03), (0.22, -0.03), (0.22, -0.1), (0.42, 0), (0.22, 0.1), (0.22, 0.03), (-0.42, 0.03)]
p.prism(ARROW, -0.025, 0.025, bevel=0.01, at=(0, RIDGE + 1.5, 0))
p.prism([(-0.42, 0.0), (-0.3, 0.03), (-0.52, 0.13)][::-1], -0.02, 0.02, bevel=0.008, at=(0, RIDGE + 1.5, 0))
p.prism([(-0.42, 0.0), (-0.3, -0.03), (-0.52, -0.13)], -0.02, 0.02, bevel=0.008, at=(0, RIDGE + 1.5, 0))
p.paint_fn(lambda q, n: q.y > RIDGE + 1.05, METAL)

# ---- hay spilling from the loft, the pulley beam with its rope and hook ----
p.layer('hay', base=HAY)
from mathutils import Vector, Euler
BALE_C, BALE_R = Vector((0.04, 3.52, D + 0.2)), Euler([math.radians(a) for a in (0, 8, -6)]).to_matrix()
p.box(tuple(BALE_C), (0.4, 0.21, 0.26), rot=(0, 8, -6), bevel=0.08)                    # a little bale in the loft door
for k in range(5):                                                                     # loose straws on the sill
    x0 = -0.5 + k * 0.24
    a = 0.5 * (k - 2)
    p.tube([(x0, 3.33, D + 0.22), (x0 + math.sin(a) * 0.22, 3.3, D + 0.4)], 0.018, rseg=6)
for x in (-0.2, 0.2):
    p.box(tuple(BALE_C + BALE_R @ Vector((x, 0, 0))), (0.022, 0.222, 0.272), rot=(0, 8, -6), bevel=0.012)
def twine(q, n):
    l = BALE_R.transposed() @ (q - BALE_C)
    return abs(l.x) < 0.42 and (abs(l.y) > 0.214 or abs(l.z) > 0.264) and min(abs(l.x + 0.2), abs(l.x - 0.2)) < 0.03
p.paint_fn(twine, 0xa86f3a)
p.box((0, 4.74, D + 0.28), (0.09, 0.09, 0.44), bevel=0.03)                             # pulley beam
p.tube([(0, 4.66, D + 0.6), (0, 4.2, D + 0.6)], 0.02, rseg=6)                          # rope
p.lathe([(0, -0.05), (0.07, -0.05), (0.08, 0), (0.07, 0.05), (0, 0.05)], pos=(0, 4.14, D + 0.6), rot=(90, 0, 0), seg=12)
p.paint_fn(lambda q, n: q.y > 4.0, WOOD)
p.paint_fn(lambda q, n: q.y > 4.0 and q.y < 4.6 and q.z > D + 0.45, 0xd8c8a8)
p.layer('skin')
p.extras['outline'] = 0.03
p.build()
