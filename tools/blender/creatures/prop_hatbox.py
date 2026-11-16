"""Round hat box (dress-up scenery): a drum box radius 0.6, height 0.55 (tinted: painted white), a lid with a lip and a
ribbon band crossing over the top (layer 'lid', tinted with the lid colour; top of the band at y 0.568) and a bow on
top (layer 'bow', same tint: only on the top box of a stack). Bottom at y = 0."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from skit import SProp, rounded

R, H = 0.6, 0.55
p = SProp('prop_hatbox', base=0xffffff)
p.cyl((0, 0, 0), R, H - 0.06, seg=20, bevel=0.04)
p.paint_fn(lambda q, n: q.y < 0.08, 0xe8e4ec)
p.layer('lid', base=0xffffff)
p.layers['lid'].update(segs=1)
p.cyl((0, H - 0.16, 0), R + 0.05, 0.17, seg=20, bevel=0.05)
for rot in (0, 90):
    p.box((0, H / 2 - 0.02, 0), (0.07, H / 2 - 0.02, R + 0.012), rot=(0, rot, 0), bevel=0.02)
    p.box((0, H + 0.008, 0), (0.07, 0.01, R + 0.06), rot=(0, rot, 0), bevel=0.008)
p.paint_fn(lambda q, n: q.y < H - 0.15 or (q.y > H + 0.0 and math.hypot(q.x, q.z) < 0.32), 0xfff0f6)
p.layer('bow', base=0xffffff)
p.layers['bow'].update(psegs=1)
for s in (-1, 1):
    loop = rounded([(0, 0), (s * 0.14, 0.12), (s * 0.3, 0.1), (s * 0.3, -0.06), (s * 0.12, -0.04)], 0.06, n=3, closed=True)
    p.prism([(x, z) for x, z, *_ in loop][::s], H + 0.01, H + 0.09, axis='y', bevel=0.03)
p.layer('skin')
p.extras['outline'] = 0.022
p.build()
