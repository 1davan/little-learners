"""Duck pond dressing (farm scenery): a ring of chunky pebbles round an ellipse 3.3 x 1.76 (the water stays a flat code
disc inside), reeds and cattails at the back left, and lily pads with a pink flower (layers skin, reeds, lily)."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from skit import SProp, dome_profile

STONE, STONE_D, STONE_L = 0xc8c2d6, 0xaaa3bd, 0xdcd7e6
RX, RZ = 3.3, 1.76
p = SProp('prop_pond', base=STONE)
N = 26
for i in range(N):
    a = (i + 0.3 * math.sin(i * 1.7)) / N * math.tau
    r = 0.2 + 0.07 * math.sin(i * 2.3) + 0.04 * math.cos(i * 5.1)
    x, z = (RX + 0.05) * math.cos(a), (RZ + 0.05) * math.sin(a)
    p.lathe(dome_profile(r, r * 0.62, n=3), pos=(x, -0.02, z), rot=(0, math.degrees(a) * 1.7, 0), seg=7, scale=(1.25, 0.95))
p.paint_fn(lambda q, n: (math.atan2(q.z / RZ, q.x / RX) * N / math.tau * 1.0) % 3 < 1, STONE_D)
p.paint_fn(lambda q, n: n.y > 0.85 and q.y > 0.1, STONE_L)
p.layer('reeds', base=0x5fae4a)
for k, (x, z, h) in enumerate([(-2.6, -1.25, 1.25), (-2.25, -1.45, 1.55), (-1.95, -1.55, 1.15), (-2.9, -0.95, 1.0), (2.85, -1.05, 1.1), (3.05, -0.7, 0.85)]):
    lean = 0.1 * math.sin(k * 2.1)
    top = (x + lean, h, z)
    p.tube([(x, 0, z), (x + lean * 0.5, h * 0.5, z), top], 0.03, rseg=5)
    if k % 3 != 2:
        p.lathe([(0, 0), (0.06, 0.02), (0.075, 0.1), (0.075, 0.24), (0.055, 0.3), (0, 0.32)], pos=(top[0], h - 0.32, z), seg=10)
        p.tube([(top[0], h - 0.01, z), (top[0], h + 0.12, z)], 0.012, rseg=4)
for k, (x, z, a, L) in enumerate([(-2.45, -1.3, 20, 0.9), (-2.1, -1.4, -25, 0.8), (-2.75, -1.1, 35, 0.7), (2.95, -0.9, -30, 0.75)]):
    s, c = math.sin(math.radians(a)), math.cos(math.radians(a))
    p.tube([(x, 0, z), (x + s * L * 0.3, L * 0.55, z + 0.04), (x + s * L * 0.75, L * 0.95, z + 0.08)], [0.04, 0.03, 0.006], rseg=5)
p.paint_fn(lambda q, n: q.y > 0.6 and math.hypot(q.x, q.z) > 0 and abs(n.y) < 0.95 and q.y < 1.6 and q.y > (0.0) and q.y > 0 and any(abs(q.x - tx) < 0.09 and abs(q.y - (th - 0.16)) < 0.17 for tx, th in [(-2.6 + 0.1 * math.sin(0), 1.25), (-2.25 + 0.1 * math.sin(2.1), 1.55), (-2.9 + 0.1 * math.sin(6.3), 1.0), (2.85 + 0.1 * math.sin(8.4), 1.1)]), 0x8a5a3b)
p.layer('lily', base=0x6cc95a)
p.layers['lily'].update(psegs=1)
for (x, z, r, rot) in [(0.55, 0.2, 0.38, 30), (-0.55, -0.22, 0.28, 160), (2.55, -0.85, 0.3, 250), (-2.45, 0.7, 0.28, 90)]:
    pts = []
    for i in range(13):
        a = math.radians(rot + 20 + i * 320 / 12)
        pts.append((x + r * math.cos(a), z + r * math.sin(a)))
    pts.append((x, z))
    p.prism(pts, 0.03, 0.065, axis='y', bevel=0.015)
for i in range(6):
    a = i * math.pi / 3
    p.lathe([(0, 0), (0.07, 0.03), (0.08, 0.12), (0.0, 0.2)], pos=(0.55 + 0.05 * math.cos(a), 0.06, 0.2 + 0.05 * math.sin(a)), rot=(math.degrees(0.6 * math.sin(a)), 0, math.degrees(-0.6 * math.cos(a))), seg=6, scale=(1, 0.5))
p.lathe(dome_profile(0.05, 0.05, n=3), pos=(0.55, 0.1, 0.2), seg=8)
p.paint_fn(lambda q, n: q.y > 0.07 and math.hypot(q.x - 0.55, q.z - 0.2) < 0.2, 0xff9ac4)
p.paint_fn(lambda q, n: q.y > 0.13 and math.hypot(q.x - 0.55, q.z - 0.2) < 0.055, 0xffd23f)
p.layer('skin')
p.extras['outline'] = 0.022
p.build()
