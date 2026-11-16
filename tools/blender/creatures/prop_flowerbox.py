"""Window flower box (hat shop): a white planter 3.4 x 0.4 x 0.5 (origin = its centre) brimming with round flowers in
pink, yellow and lilac with leaves (layer 'flowers')."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from skit import SProp, dome_profile

p = SProp('prop_flowerbox', base=0xffffff)
p.box((0, 0, 0), (1.7, 0.2, 0.25), bevel=0.06)
p.box((0, 0.2, 0), (1.76, 0.04, 0.29), bevel=0.03)
p.paint_fn(lambda q, n: n.y < -0.5, 0xe6e2ee)
p.layer('flowers', base=0x5fae4a)
for i in range(9):
    x = -1.45 + i * 0.36
    p.lathe(dome_profile(0.14, 0.1, n=3), pos=(x + 0.18, 0.22, 0.05 - 0.1 * (i % 2)), seg=8, scale=(1.3, 0.7))
cols = [0xff6fa8, 0xffd23f, 0xb197fc]
for i in range(7):
    x = -1.35 + i * 0.45
    y = 0.42 + 0.06 * (i % 2)
    for k in range(5):
        a = k / 5 * math.tau
        p.lathe(dome_profile(0.07, 0.04, n=2), pos=(x + 0.08 * math.cos(a), y + 0.08 * math.sin(a), 0.1), rot=(90, 0, 0), seg=6)
    p.lathe(dome_profile(0.05, 0.05, n=2), pos=(x, y, 0.12), rot=(90, 0, 0), seg=8)


def petal_col(q):
    i = round((q.x + 1.35) / 0.45)
    return cols[i % 3]


for i in range(7):
    x = -1.35 + i * 0.45
    y = 0.42 + 0.06 * (i % 2)
    p.paint_fn((lambda x, y, c: lambda q, n: q.y > 0.3 and math.hypot(q.x - x, q.y - y) < 0.17 and q.z > 0.05)(x, y, cols[i % 3]), cols[i % 3])
    p.paint_fn((lambda x, y: lambda q, n: math.hypot(q.x - x, q.y - y) < 0.05 and q.z > 0.14)(x, y), 0xfff1c0)
p.layer('skin')
p.extras['outline'] = 0.02
p.build()
