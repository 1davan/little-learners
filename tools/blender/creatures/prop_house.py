"""Cosy little house (Home world: the front-garden scenery and the world map's Home island). Front faces +z, floor
y = 0, origin = floor centre. Walls 3.4 wide x 2.8 deep, eaves at 2.4, ridge at 3.95.
Layers (all static, one draw each):
  skin     butter-yellow walls on a stone footing, a teal front door with a round top, brass knob and letterbox,
           a stone doorstep
  trim     white: corner boards, window frames with glazing crosses and sills, the door frame, the attic window ring
  glass    the window panes (pale sky blue; scenery draws them unlit and warm at night so the house glows)
  roof     a chunky coral roof with white fascia at the gable ends, and a brick chimney with a cap
  flowers  two window boxes with round pink / yellow / white flowers and leaves"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from skit import SProp, offset_line, circle_poly

WALL, WALL_D, STONE, DOOR = 0xffe6a8, 0xf2cf86, 0xcdbcae, 0x3fae9a
WHITE, GLASS, ROOF, ROOF_D, BRICK = 0xfffaf0, 0xbfe6ff, 0xff6b5a, 0xd94a3d, 0xc8553e
W, D, EAVE, RIDGE, FOOT = 1.7, 1.4, 2.4, 3.95, 0.22
DW, DH = 0.48, 1.62           # door half width, door height (to the top of the arch)
WX, WY, WS = 1.08, 1.42, 0.36  # front windows: centre x, centre y, half size

p = SProp('prop_house', base=WALL)
gable = [(-W, 0), (W, 0), (W, EAVE), (0, RIDGE), (-W, EAVE)]
p.prism(gable, -D, D, bevel=0.08)
# the door: a slab proud of the wall with a round top
door = [(-DW, FOOT), (DW, FOOT)] + [(DW * math.cos(math.pi * k / 12), DH - DW + DW * math.sin(math.pi * k / 12)) for k in range(13)]
p.prism(door, D - 0.02, D + 0.06, bevel=0.02)
p.cyl((0.3, 0.95, D + 0.05), 0.06, 0.08, rot=(90, 0, 0), seg=12, bevel=0.02)                 # knob
p.box((0, 1.05, D + 0.07), (0.17, 0.04, 0.02), bevel=0.01)                                   # letterbox
p.box((0, FOOT / 2 - 0.02, D + 0.32), (0.72, FOOT / 2 + 0.02, 0.3), bevel=0.05)              # doorstep
p.paint_fn(lambda q, n: q.z > D + 0.01 and abs(q.x) < DW + 0.01 and q.y > FOOT - 0.01 and q.y < DH + 0.02, DOOR)
p.paint_fn(lambda q, n: q.z > D + 0.04 and (math.hypot(q.x - 0.3, q.y - 0.95) < 0.07 or (abs(q.x) < 0.18 and abs(q.y - 1.05) < 0.05)), 0xffc93a)
p.paint_fn(lambda q, n: q.y < FOOT and not (q.z > D + 0.05 and abs(q.x) < DW + 0.02 and q.y > FOOT - 0.02), STONE)
p.paint_fn(lambda q, n: q.z > D + 0.05 and q.y < FOOT + 0.01 and abs(q.x) < 0.8, 0xb8a898)
p.paint_fn(lambda q, n: n.y < -0.5, WALL_D)

# ---- white trim ----
p.layer('trim', base=WHITE)
for sx in (-1, 1):
    for sz in (-1, 1):
        p.box((sx * W, (EAVE - 0.12 + FOOT) / 2, sz * D), (0.11, (EAVE - 0.12 - FOOT) / 2, 0.11), bevel=0.04)
ZF = D + 0.05
for sx in (-1, 1):                                                   # front windows: frame, cross, sill
    x = sx * WX
    for dx in (-WS, WS):
        p.box((x + dx, WY, ZF), (0.06, WS + 0.06, 0.06), bevel=0.025)
    for dy in (-WS, WS):
        p.box((x, WY + dy, ZF), (WS + 0.06, 0.06, 0.06), bevel=0.025)
    p.box((x, WY, ZF), (0.035, WS, 0.04), bevel=0.012)
    p.box((x, WY, ZF), (WS, 0.035, 0.04), bevel=0.012)
    p.box((x, WY - WS - 0.1, D + 0.12), (WS + 0.14, 0.05, 0.14), bevel=0.02)
for sx in (-1, 1):                                                   # side windows (one per side wall)
    X = sx * (W + 0.04)
    for z in (-0.38, 0.38):
        p.box((X, WY, z), (0.05, 0.42, 0.06), bevel=0.02)
    for y in (WY - 0.38, WY + 0.38):
        p.box((X, y, 0), (0.05, 0.06, 0.44), bevel=0.02)
    p.box((X, WY, 0), (0.035, 0.36, 0.03), bevel=0.01)
# door frame: two jambs and an arch
for s in (-1, 1):
    p.box((s * (DW + 0.06), (FOOT + DH - DW) / 2 + 0.02, D + 0.04), (0.07, (DH - DW - FOOT) / 2 + 0.02, 0.07), bevel=0.025)
arch = [(math.cos(math.pi * k / 14) * (DW + 0.06), DH - DW + math.sin(math.pi * k / 14) * (DW + 0.06)) for k in range(15)]
p.tube([(x, y, D + 0.04) for x, y in arch], 0.07, rseg=8)
# attic window ring
p.ring((0, EAVE + 0.55, D + 0.03), 0.3, 0.06, rot=(90, 0, 0), seg=28, rseg=6)
p.box((0, EAVE + 0.55, D + 0.02), (0.03, 0.28, 0.03), bevel=0.01)
p.box((0, EAVE + 0.55, D + 0.02), (0.28, 0.03, 0.03), bevel=0.01)

# ---- window glass ----
p.layer('glass', base=GLASS)
for sx in (-1, 1):
    p.box((sx * WX, WY, D + 0.005), (WS, WS, 0.02), bevel=0.01)
    p.box((sx * (W + 0.005), WY, 0), (0.02, 0.36, 0.36), bevel=0.01)
p.cyl((0, EAVE + 0.55, D - 0.03), 0.28, 0.05, rot=(90, 0, 0), seg=24, bevel=0.01)
p.paint_fn(lambda q, n: (q.x - (-WX if q.x < 0 else WX)) - (q.y - WY) * 0.6 > 0.05 and (q.x - (-WX if q.x < 0 else WX)) - (q.y - WY) * 0.6 < 0.16 and q.z > D - 0.01, 0xeaf8ff)

# ---- roof: a thick band over the gables, fascia, chimney ----
p.layer('roof', base=ROOF)
ex = 0.42
dx, dy = W, RIDGE - EAVE
L = math.hypot(dx, dy)
line = [(-W - dx / L * ex, EAVE - dy / L * ex), (0, RIDGE), (W + dx / L * ex, EAVE - dy / L * ex)]
outer = offset_line(line, -0.3)
inner = offset_line(line, 0.02)
p.prism(outer + inner[::-1], -D - 0.28, D + 0.28, bevel=0.08)
p.box((0.85, RIDGE - 0.15, -0.45), (0.25, 0.75, 0.25), bevel=0.04)                         # chimney
p.box((0.85, RIDGE + 0.62, -0.45), (0.32, 0.08, 0.32), bevel=0.03)                         # chimney cap
p.paint_fn(lambda q, n: abs(q.z) > D + 0.24, WHITE)
p.paint_fn(lambda q, n: n.y < -0.4 and abs(q.z) < D + 0.24, ROOF_D)
p.paint_fn(lambda q, n: abs(q.x - 0.85) < 0.27 and abs(q.z + 0.45) < 0.27 and q.y < RIDGE + 0.53, BRICK)
p.paint_fn(lambda q, n: abs(q.x - 0.85) < 0.27 and abs(q.z + 0.45) < 0.27 and q.y < RIDGE + 0.53 and int((q.y - RIDGE) / 0.14) % 2 == 0 and abs(((q.x if abs(n.z) > 0.5 else q.z) * 7) % 1 - 0.5) < 0.06, 0xa8452f)
p.paint_fn(lambda q, n: q.y > RIDGE + 0.53, 0x8a8f9a)

# ---- window boxes with flowers ----
p.layer('flowers', base=0x5fb05a)
for sx in (-1, 1):
    x = sx * WX
    p.box((x, WY - WS - 0.3, D + 0.22), (WS + 0.08, 0.14, 0.14), bevel=0.04)
    for k in range(5):
        fx = x - WS + 0.06 + k * (2 * WS - 0.12) / 4
        p.blob((fx, WY - WS - 0.1, D + 0.24), (0.11, 0.08, 0.1))
        p.blob((fx + 0.05, WY - WS - 0.02, D + 0.27 + 0.02 * (k % 2)), (0.09, 0.09, 0.07), group='f%d' % k)
p.paint_fn(lambda q, n: q.y < WY - WS - 0.16, 0xc8553e)
cols = [0xff6fa8, 0xffd23f, 0xffffff, 0xff8a5c, 0xb197fc]
for sx in (-1, 1):
    x = sx * WX
    for k in range(5):
        fx = x - WS + 0.06 + k * (2 * WS - 0.12) / 4 + 0.05
        p.paint('fl%d%d' % (sx, k), (fx, WY - WS - 0.02, D + 0.3), (0.1, 0.1, 0.12), cols[(k + (sx > 0) * 2) % 5])
p.layer('skin')
p.extras['outline'] = 0.026
p.build()
