"""Sunflower (farm scenery, Grow icon, Big and small). Layers: skin = the seed disc (head centre at the origin, facing
+z), 'petals' (two rings of yellow petals around it), 'stem' (a 2.2 tall stem from y = 0 to the head with two leaves;
scenery.js scales it to the flower's height)."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from skit import SProp, dome_profile, rounded

BROWN, BROWN_D, BROWN_L, YEL, YEL_D, GREEN, GREEN_D = 0x7a4a26, 0x5e3618, 0x9a6234, 0xffd23f, 0xf5b324, 0x4f9e3a, 0x3f8a32
p = SProp('prop_sunflower', base=BROWN)
p.lathe([(0, -0.05), (0.27, -0.05)] + dome_profile(0.27, 0.12, n=5, base=-0.02)[1:], rot=(90, 0, 0), seg=18)
p.paint_fn(lambda q, n: math.hypot(q.x, q.y) < 0.15, BROWN_D)
p.layer('petals', base=YEL)
p.layers['petals'].update(psegs=1)
PET = [(0, 0)] + [(0.12 * math.sin(math.pi * t / 5) * (1 - 0.25 * t / 5), 0.42 * t / 5) for t in range(1, 5)] + [(0, 0.44)]
outline = PET + [(-x, y) for x, y in PET[::-1][1:-1]]
for ring, (n, r0, dz, ang0, col) in enumerate([(8, 0.2, -0.035, 0, YEL_D), (8, 0.21, 0.0, 22.5, YEL)]):
    for i in range(n):
        a = math.radians(ang0 + i * 360 / n)
        pts = [(r0 * math.sin(a) + x * math.cos(a) + y * math.sin(a), r0 * math.cos(a) - x * math.sin(a) + y * math.cos(a)) for x, y in outline]
        p.prism(pts, dz - 0.022, dz + 0.022, bevel=0.012)
p.paint_fn(lambda q, n: q.z < -0.012, YEL_D)
p.layer('stem', base=GREEN)
p.layers['stem'].update(psegs=1)
pts = [(0, 0, 0), (0.02, 0.6, 0), (-0.02, 1.3, 0), (0, 1.9, -0.02), (0, 2.2, -0.08)]
p.tube(pts, [0.07, 0.065, 0.06, 0.055, 0.05], rseg=7)
LEAF = [(0, 0)] + [(0.2 * math.sin(math.pi * t / 7) ** 0.8, 0.55 * t / 7) for t in range(1, 7)] + [(0, 0.55)]
leaf = LEAF + [(-x, y) for x, y in LEAF[::-1][1:-1]]
import mathutils
for (y, side, tilt) in ((0.75, 1, -50), (1.25, -1, 55)):
    R = mathutils.Euler((math.radians(-25), 0, math.radians(tilt))).to_matrix()
    verts, faces = [], []
    n = len(leaf)
    for d in (-0.02, 0.02):
        for x, yy in leaf:
            v = R @ mathutils.Vector((x, yy, d))
            verts.append((v.x + side * 0.03, v.y + y, v.z + 0.02))
    faces = [tuple(range(n)), tuple(range(2 * n - 1, n - 1, -1))] + [(i, n + i, n + (i + 1) % n, (i + 1) % n) for i in range(n)]
    p._prims().append(('mesh', verts, faces, 0.015))
p.paint_fn(lambda q, n: q.y < 2.3 and abs(q.x) > 0.12 and n.z < 0.0, GREEN_D)
p.layer('skin')
p.extras['outline'] = 0.02
p.build()
