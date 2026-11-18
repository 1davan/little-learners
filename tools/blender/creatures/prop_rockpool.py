"""Rock pool (Bear's nose, level 3). Origin on the sand at its centre, an oval about 4.6 wide and 2.9 deep, low
(top of the lip at y 0.16): a soft sandy lip that rises a little out of the beach, the water sunk just inside it
(a clean teal surface with two pale ripple rings), and a few chunky grey pebbles sitting on the lip."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop

SAND, SAND_D, WATER, RIPPLE, PEB, PEB_D = 0xead7a4, 0xd9bf85, 0x45b4dc, 0xa9e6f6, 0xaaa59b, 0x8e897f
SX, SZ = 1.0, 0.62
p = Prop('prop_rockpool', base=SAND, target_faces=2400, voxel=0.02, smooth=4)
# the lip: a fat low ring, flattened, melting into a thin sandy apron on the outside
p.ring((0, 0.0, 0), 2.05, 0.17, scale=(SX, SZ), seg=64, rseg=14)
p.ring((0, -0.08, 0), 2.3, 0.14, scale=(SX, SZ), seg=64, rseg=12)
p.paint_fn(lambda q, n: n.y < 0.55, SAND_D)
p.layer('water', base=WATER, target_faces=900, voxel=0.02)
p.quadriflow = False
p.cyl((0, -0.05, 0), 2.0, 0.13, bevel=0.02, scale=(SX, SZ), seg=64)
p.layer('ripple', base=RIPPLE, target_faces=500, voxel=0.012)
for R, cx, cz in ((0.55, 0.35, 0.05), (1.0, 0.35, 0.05)):
    p.ring((cx, 0.085, cz), R, 0.022, scale=(1.0, SZ), seg=48, rseg=6)
p.layer('pebbles', base=PEB, target_faces=900, voxel=0.014)
for i, (a, s) in enumerate(((200, 0.2), (225, 0.14), (330, 0.17), (20, 0.12), (120, 0.15))):
    x, z = 2.1 * SX * math.cos(math.radians(a)), 2.1 * SZ * math.sin(math.radians(a))
    p.blob((x, 0.12 + s * 0.4, z), (s * 1.25, s * 0.75, s), rot=(0, a * 0.7, 6), group='peb%d' % i)
p.paint_fn(lambda q, n: n.y < 0.2, PEB_D)
p.layer('skin')
p.bone('root', (0, 0, 0), (0, 0.4, 0))
p.extras['outline'] = 0.02
p.build()
