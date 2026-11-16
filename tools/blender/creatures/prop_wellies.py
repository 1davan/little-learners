"""A pair of wellington boots (farm rainy day, dress-up rainy room). Tintable boots (white paint x colour) with dark
soles and white top bands in layer 'trim'. About 0.62 tall, toes toward +z, pair centred at the origin."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from skit import SProp, dome_profile

p = SProp('prop_wellies', base=0xffffff)
for x, ry in ((-0.24, 6), (0.24, -10)):
    p.cyl((x, 0.06, -0.03), 0.17, 0.56, r2=0.185, bevel=0.06, seg=20)
    p.box((x, 0.13, 0.1), (0.16, 0.08, 0.2), rot=(0, ry, 0), bevel=0.075)
    p.lathe(dome_profile(0.16, 0.14, n=6), pos=(x + math.sin(math.radians(ry)) * 0.24, 0.05, 0.22), rot=(0, ry, 0), seg=16, scale=(1, 0.85))
p.paint_fn(lambda q, n: n.y > 0.8 and q.y > 0.55, 0xd9d9d9)
p.layer('trim', base=0x5a4a6a)
for x, ry in ((-0.24, 6), (0.24, -10)):
    p.box((x + math.sin(math.radians(ry)) * 0.06, 0.035, 0.07), (0.18, 0.035, 0.31), rot=(0, ry, 0), bevel=0.03)
    p.ring((x, 0.6, -0.03), 0.185, 0.03, seg=24, rseg=6)
p.paint_fn(lambda q, n: q.y > 0.4, 0xfffaf0)
p.layer('skin')
p.extras['outline'] = 0.02
p.build()
