"""Clothes rail (dressing room): a chunky gold tubular frame 4.8 wide, fat bar at y 4.5 with ball finials (origin =
floor centre), splayed rounded feet on chunky pink casters (layer 'wheels'). Layers 'dress' and 'top' are hanging garments (tinted) built from their hook at the
origin downward, each on its own wooden hanger (layer 'hanger', hook at the origin)."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from skit import SProp, dome_profile, rounded

GOLD = 0xffc93a
p = SProp('prop_clothesrail', base=GOLD)
# a chunky tubular rail: fat posts, a fat bar with big ball finials, splayed rounded feet on chunky pink casters
for s in (-1, 1):
    p.cyl((s * 2.3, 0.3, 0), 0.11, 4.2, seg=24, bevel=0.04)
    p.box((s * 2.3, 0.22, 0), (0.12, 0.1, 0.72), bevel=0.08)                       # splayed foot
    p.lathe(rounded([(0, -0.2), (0.15, -0.17), (0.2, 0.0), (0.15, 0.17), (0, 0.2)], 0.06, n=3), pos=(s * 2.42, 4.52, 0), rot=(0, 0, 90), seg=24)   # ball finial
    p.ring((s * 2.3, 4.25, 0), 0.13, 0.04, seg=24, rseg=8)                         # collar under the bar
p.cyl((-2.3, 4.52, 0), 0.1, 4.6, rot=(0, 0, -90), seg=24, bevel=0.03)
p.paint_fn(lambda q, n: n.y > 0.6 and q.y < 0.4, 0xe0a820)
p.layer('wheels', base=0xff8fc0)
for s in (-1, 1):
    for z in (-0.62, 0.62):
        p.cyl((s * 2.3 - 0.06, 0.12, z), 0.12, 0.12, rot=(0, 0, -90), seg=20, bevel=0.04)
p.paint_fn(lambda q, n: abs(n.x) > 0.7, 0xffb3d1)
p.layer('hanger', base=0x9a7a5a)
p.tube([(0.0, -0.14, 0)] + [(0.07 * math.sin(a), 0.03 + 0.07 * math.cos(a), 0) for a in [math.pi * k / 6 for k in range(0, 9)]], 0.022, rseg=8)
p.tube([(-0.42, -0.32, 0), (-0.1, -0.16, 0), (0.0, -0.14, 0), (0.1, -0.16, 0), (0.42, -0.32, 0)], 0.045, rseg=10)
p.paint_fn(lambda q, n: q.y > -0.15 and abs(q.x) < 0.1, 0x8a8aa0)
p.layer('dress', base=0xffffff)
prof = [(0, -0.28), (0.2, -0.28), (0.24, -0.5), (0.2, -0.75), (0.34, -0.95), (0.55, -1.5), (0.62, -1.75), (0.58, -1.82), (0, -1.82)]
p.lathe(prof, seg=36, scale=(1, 0.42))
for s in (-1, 1):
    p.box((s * 0.14, -0.33, 0.0), (0.04, 0.06, 0.08), bevel=0.03)
p.paint_fn(lambda q, n: -0.98 < q.y < -0.86, 0xe8e0f0)
p.layer('top', base=0xffffff)
p.box((0, -0.65, 0), (0.36, 0.38, 0.11), bevel=0.09)
for s in (-1, 1):
    p.box((s * 0.47, -0.42, 0), (0.15, 0.2, 0.1), rot=(0, 0, s * 35), bevel=0.07)
p.paint_fn(lambda q, n: q.y > -0.34 and abs(q.x) < 0.14 and q.z > 0.05, 0xe8e0f0)
p.layer('skin')
p.bone('body', (0, 0, 0), (0, 1, 0))
p.bone('hang.1', (0, 0, 0), (0, 0.3, 0), parent='body')
p.bone('hang.2', (0, 0, 0), (0, 0.3, 0), parent='body')
p.extras['outline'] = 0.022
path = p.build()
# direct uses (catalogue, word cards) see the garments hanging on the bar: rest pose only (bind pose unchanged), the
# hanger + dress ride 'hang.1', the top 'hang.2'. scenery.js reads the raw layers (hook at the origin) as before.
from glbpost import Glb
g = Glb(path)
for m in ('prop_clothesrail', 'wheels'):
    g.bind_layer(m, 'body')
for m in ('hanger', 'dress'):
    g.bind_layer(m, 'hang.1')
g.bind_layer('top', 'hang.2')
g.move('hang.1', lift=(-0.95, 4.5, 0)).move('hang.2', lift=(0.95, 4.5, 0)).save()
