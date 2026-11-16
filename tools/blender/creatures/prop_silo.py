"""Farm silo (scenery beside the barn). A cream tower 1.1 radius, 4.6 tall, under a blue-grey dome with a vent knob;
blue-grey hoop bands, a ladder up the front-right, a little red door and a hatch window. Static scenery (skin, metal)."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from skit import SProp, dome_profile

CREAM, CREAM_D, METAL, METAL_D, RED, DARK, GLASS = 0xf4ecdf, 0xe6dccb, 0xa9bccf, 0x8ea3ba, 0xe8493c, 0x5a3440, 0xbfe6ff
R, H = 1.1, 4.6
p = SProp('prop_silo', base=CREAM)
p.cyl((0, 0, 0), R, H, bevel=0.08, seg=30)
p.box((0, 0.62, R - 0.02), (0.34, 0.6, 0.06), bevel=0.04)                    # door
p.box((0, 3.75, R - 0.03), (0.22, 0.24, 0.05), bevel=0.03)                   # hatch window
p.paint_fn(lambda q, n: q.z > R + 0.005 and q.y < 1.25 and abs(q.x) < 0.36, RED)
p.paint_fn(lambda q, n: q.z > R + 0.005 and 3.5 < q.y < 4.0 and abs(q.x) < 0.24, GLASS)
p.paint_fn(lambda q, n: q.y < 0.22 and q.z < R - 0.01, CREAM_D)

p.layer('metal', base=METAL)
p.layers['metal'].update(segs=1)
p.lathe([(0, 0), (R + 0.1, 0), (R + 0.12, 0.05)] + dome_profile(R + 0.06, 0.9, n=8, base=0.08)[1:], pos=(0, H - 0.04, 0), seg=28)
p.lathe([(0, 0), (0.16, 0), (0.18, 0.1), (0.14, 0.22), (0.2, 0.26), (0.18, 0.34), (0, 0.36)], pos=(0, H + 0.88, 0), seg=10)
for y in (1.45, 2.65, 3.45):
    p.ring((0, y, 0), R + 0.01, 0.055, seg=30, rseg=6)
A = math.radians(38)                                                      # ladder angle from the front
for k in (-1, 1):
    a = A + k * 0.17
    x, z = (R + 0.12) * math.sin(a), (R + 0.12) * math.cos(a)
    p.box((x, 2.35, z), (0.04, 2.0, 0.04), rot=(0, math.degrees(a), 0), bevel=0.02)
for i in range(11):
    y = 0.7 + i * 0.35
    p.box(((R + 0.12) * math.sin(A), y, (R + 0.12) * math.cos(A)), (0.2, 0.025, 0.025), rot=(0, math.degrees(A), 0), bevel=0.012)
for k in (-1, 1):                                                          # ladder brackets
    for y in (1.0, 3.8):
        a = A + k * 0.17
        p.box(((R + 0.05) * math.sin(a), y, (R + 0.05) * math.cos(a)), (0.03, 0.03, 0.09), rot=(0, math.degrees(a), 0), bevel=0.01)
p.paint_fn(lambda q, n: q.y > H + 0.86, METAL_D)
p.layer('skin')
p.extras['outline'] = 0.028
p.build()
