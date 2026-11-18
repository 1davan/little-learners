"""Round hat box (dress-up scenery): a drum box radius 0.6, height 0.55 (tinted: painted white), a lid with a lip and a
ribbon band crossing over the top (layer 'lid', tinted with the lid colour; top of the band at y 0.568) and a bow on
top (layer 'bow', same tint: only on the top box of a stack). Bottom at y = 0."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from skit import SProp, dome_profile, rounded

R, H = 0.6, 0.55
p = SProp('prop_hatbox', base=0xffffff)
p.cyl((0, 0, 0), R, H - 0.06, seg=48, bevel=0.04)
p.paint_fn(lambda q, n: q.y < 0.08, 0xe8e4ec)
p.layer('lid', base=0xffffff)
p.layers['lid'].update(segs=1)
p.cyl((0, H - 0.16, 0), R + 0.05, 0.17, seg=48, bevel=0.05)
p.cyl((0, 0.17, 0), R + 0.012, 0.12, seg=48, bevel=0.03)          # ribbon band round the box
for rot in (0, 90):
    p.box((0, H + 0.012, 0), (0.075, 0.012, R + 0.035), rot=(0, rot, 0), bevel=0.01)   # flat ribbons on the lid top
p.paint_fn(lambda q, n: q.y < H - 0.15 or q.y > H + 0.003, 0xfff0f6)
p.layer('bow', base=0xffffff)
p.layers['bow'].update(psegs=1)
for s in (-1, 1):
    loop = []                                    # a plump ribbon loop standing up and leaning out
    for k in range(20):
        a = k / 20 * math.tau
        r = 0.12 + 0.02 * math.cos(2 * a)
        loop.append((s * (0.15 + r * math.cos(a) * 1.1), H + 0.13 + r * math.sin(a) * 0.85, -0.02 * math.cos(a)))
    p.tube(loop, 0.04, closed=True, rseg=10)
    p.prism([(s * 0.04, 0.0), (s * 0.11, 0.0), (s * 0.27, -0.03), (s * 0.24, 0.05), (s * 0.08, 0.06)][::s], H + 0.012, H + 0.035, axis='y', bevel=0.01)
p.lathe(dome_profile(0.075, 0.09, n=4), pos=(0, H + 0.03, 0), seg=16)
p.layer('skin')
p.extras['outline'] = 0.022
p.build()
