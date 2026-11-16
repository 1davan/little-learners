"""Little toy rowing boat (Where's Crab? boat). Oval hull 4.0 long x 2.1 wide, rim at y 0.95, hollow (the friend sits
inside at y ~0.32). Red hull with a white stripe and rim, a wooden bench at the back, a mast with a yellow flag."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

RED, RED_D, RED_IN, WHITE, WOOD, YEL = 0xff5a4a, 0xe0453a, 0xa8382e, 0xfffaf0, 0xc98b4f, 0xffd23f
SX, SZ = 2.0, 1.05
p = Prop('prop_boat', base=RED, target_faces=3800, voxel=0.02)
outer = [(0, 0.02)] + [(math.sin(math.radians(a)), 0.95 - 0.93 * math.cos(math.radians(a))) for a in range(10, 91, 8)] + [(1.0, 0.95)]
inner = [(0.93, 0.95)] + [(0.93 * math.sin(math.radians(a)), 0.95 - 0.66 * math.cos(math.radians(a))) for a in range(82, -1, -8)]
p.lathe(rounded(outer + inner, 0.03, n=3), scale=(SX, SZ), seg=72)
inward = lambda q, n: (n.x * q.x / SX ** 2 + n.z * q.z / SZ ** 2) < 0 or (n.y > 0.5 and q.y > 0.2)
p.paint_fn(lambda q, n: q.y > 0.25 and (q.x / SX) ** 2 + (q.z / SZ) ** 2 < 0.93 ** 2 * 1.02 and inward(q, n), RED_IN)
p.paint_fn(lambda q, n: q.y < 0.18, RED_D)

p.layer('trim', base=WHITE, target_faces=2400, voxel=0.016)
p.ring((0, 0.95, 0), 0.965, 0.075, scale=(SX, SZ), seg=96, rseg=10)
yb = 0.55
rb = math.sin(math.acos((0.95 - yb) / 0.93))
p.ring((0, yb, 0), rb + 0.012, 0.05, scale=(SX, SZ), seg=96, rseg=8)
p.layer('wood', base=WOOD, target_faces=1400, voxel=0.016)
p.box((-1.15, 0.7, 0), (0.18, 0.05, 0.75), bevel=0.03)                           # bench
p.cyl((-1.55, 0.3, 0), 0.05, 1.7, bevel=0.02, seg=12)                             # mast
p.layer('flag', base=YEL, target_faces=400, voxel=0.012)
p.mesh([(-1.53, 1.95, -0.03), (-1.53, 1.55, -0.03), (-1.05, 1.75, -0.03), (-1.53, 1.95, 0.03), (-1.53, 1.55, 0.03), (-1.05, 1.75, 0.03)],
       [(0, 1, 2), (3, 5, 4), (0, 3, 4, 1), (1, 4, 5, 2), (2, 5, 3, 0)])
p.blob((-1.55, 2.04, 0), (0.08, 0.08, 0.08), group='ball')
p.layer('skin')
p.bone('body', (0, 0, 0), (0, 0.95, 0))
p.extras['outline'] = 0.026
p.build()
