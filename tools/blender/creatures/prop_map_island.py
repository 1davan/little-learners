"""World-map island (home screen overview). A chunky round toy island of radius 1 (scale it), slightly oval; its grassy
top at y ~0.06, the waterline at y -0.55, the bottom at y -0.9. Origin = top centre.
Layers (static):
  skin  earthy cliffs with darker strata and a few boulders round the rim
  top   the cap, painted white with a soft pale edge: tinted per world (meadow green, beach sand, farm green...)
  sand  a sandy beach ring at the waterline"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from skit import SProp, rounded

EARTH, EARTH_D, ROCK = 0xc98f5a, 0xa8703f, 0xb8b0a8
SC = (1.0, 0.86)

p = SProp('prop_map_island', base=EARTH, hard=False, voxel=0.02, target_faces=2600)
p.lathe(rounded([(0, -0.9), (0.8, -0.9), (0.94, -0.62), (1.0, -0.32), (0.97, -0.05), (0, -0.05)], 0.08, n=3), scale=SC, seg=56)
ROCKS = []
for k, (a, r) in enumerate(((0.5, 0.13), (1.25, 0.1), (2.6, 0.12), (3.5, 0.09), (4.6, 0.13), (5.5, 0.1))):   # round boulders on the sand
    c = (math.sin(a) * 1.04 * SC[0], -0.5 + r * 0.55, math.cos(a) * 1.04 * SC[1])
    p.blob(c, (r * 1.2, r * 0.85, r), rot=(0, math.degrees(a), 0), group='b%d' % k)
    ROCKS.append((c, r))
p.paint_fn(lambda q, n: any((q.x - c[0]) ** 2 + (q.y - c[1]) ** 2 + (q.z - c[2]) ** 2 < (r * 1.35) ** 2 for c, r in ROCKS), ROCK)
p.paint_fn(lambda q, n: any((q.x - c[0]) ** 2 + (q.y - c[1] - r * 0.5) ** 2 + (q.z - c[2]) ** 2 < (r * 0.75) ** 2 for c, r in ROCKS) and n.y > 0.5, 0xd2ccc4)
p.paint_fn(lambda q, n: math.hypot(q.x / SC[0], q.z / SC[1]) <= 1.02 and -0.5 < q.y < -0.3 and not any((q.x - c[0]) ** 2 + (q.y - c[1]) ** 2 + (q.z - c[2]) ** 2 < (r * 1.35) ** 2 for c, r in ROCKS), EARTH_D)

p.layer('top', base=0xffffff)
p.lathe(rounded([(0, -0.1), (0.99, -0.1), (1.02, -0.02), (0.9, 0.05), (0.5, 0.075), (0, 0.08)], 0.07, n=3), scale=SC, seg=56)
for k in range(12):                                                       # a soft lumpy grass edge over the cliff
    a = k * 2 * math.pi / 12
    p.blob((math.sin(a) * 0.98 * SC[0], -0.05, math.cos(a) * 0.98 * SC[1]), (0.13, 0.07, 0.13), rot=(0, math.degrees(a), 0))
p.paint_fn(lambda q, n: q.y < -0.04, 0xe2e6dc)

p.layer('sand', base=0xf6dc9b)
p.ring((0, -0.55, 0), 1.0, 0.08, scale=(1.04, 1.04 * SC[1] / SC[0]), seg=56, rseg=8)
p.lathe(rounded([(0, -0.6), (1.06, -0.62), (1.09, -0.55), (1.0, -0.5), (0, -0.5)], 0.03, n=2), scale=SC, seg=56)
p.layer('skin')
p.extras['outline'] = 0.02
p.build()
