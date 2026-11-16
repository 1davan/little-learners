"""Beach shower (Wash, level 3). Origin = foot of the post. A white post 4.2 tall bends over to the left into a big blue
shower rose (holes underneath), with a red tap wheel at hand height, standing on a slatted wooden tray (centre x -0.4)."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

WHITE, WHITE_D, BLUE, BLUE_D, RED, WOOD, WOOD_D = 0xf6f9ff, 0xd9e2ee, 0x4a90ff, 0x2f6fd0, 0xff5a5a, 0xc98b4f, 0xa86f3a
p = Prop('prop_shower', base=WHITE, target_faces=2400)
path = rounded([(0, 0.25, 0), (0, 4.15, 0), (-0.95, 4.15, 0), (-0.95, 3.95, 0)], 0.3, n=6)
p.tube(path, 0.1, rseg=14)
p.cyl((0, 0.12, 0), 0.2, 0.22, r2=0.15, bevel=0.06, seg=24)                # base collar
p.cyl((0, 2.75, 0), 0.15, 0.14, bevel=0.05, seg=24)                        # collar at the tap
p.paint_fn(lambda q, n: q.y < 0.36 or abs(q.y - 2.82) < 0.08, WHITE_D)

p.layer('rose', base=BLUE, target_faces=900, voxel=0.014)
p.lathe(rounded([(0, 3.98), (0.12, 3.98), (0.42, 3.62), (0.4, 3.56), (0, 3.56)], 0.05, n=3), pos=(-0.95, 0, 0), seg=36)
p.paint_fn(lambda q, n: q.y < 3.6 and any(math.hypot(q.x + 0.95 - r * math.cos(a), q.z - r * math.sin(a)) < 0.04
                                          for r, k in ((0.0, 1), (0.18, 6), (0.31, 10)) for a in [i / k * math.tau for i in range(k)]), BLUE_D)

p.layer('tap', base=RED, target_faces=500, voxel=0.012)
p.ring((0, 2.82, 0.32), 0.17, 0.04, rot=(90, 0, 0), seg=24, rseg=8)
p.tube([(0, 2.82, 0.1), (0, 2.82, 0.32)], 0.04, rseg=8)
for a in (0, 90):
    r = math.radians(a)
    p.tube([(-0.17 * math.cos(r), 2.82 - 0.17 * math.sin(r), 0.32), (0.17 * math.cos(r), 2.82 + 0.17 * math.sin(r), 0.32)], 0.03, rseg=6)

p.layer('tray', base=WOOD, target_faces=1300)
for i in range(5):
    p.box((-0.4 + (i - 2) * 0.3, 0.1, 0), (0.12, 0.05, 0.75), bevel=0.04)
for z in (-0.5, 0.5):
    p.box((-0.4, 0.035, z), (0.75, 0.035, 0.09), bevel=0.03)
p.paint_fn(lambda q, n: q.y < 0.06, WOOD_D)
p.layer('skin')

p.bone('body', (0, 0, 0), (0, 4.2, 0))
p.anchor('rose', (-0.95, 3.5, 0), 'body')
p.extras['outline'] = 0.024
p.build()
