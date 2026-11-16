"""Beach ball (beach games). Radius 1.0, centred on the origin. A white ball with three coloured gores on their own
layers 'g1', 'g2', 'g3' (painted white: the game colours each layer per round) alternating with white
ones, an ink seam round every coloured gore, and small white caps at both poles. Root bone 'root' (no idle sway)."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, TAU

p = Prop('prop_beachball', base=0xfffaf0, target_faces=900, voxel=0.02, smooth=3)
p.quadriflow = False
p.blob((0, 0, 0), (1.0, 1.0, 1.0), group='ball')
LAT = math.radians(76)
outer = [(1.012 * math.cos(b), 1.012 * math.sin(b)) for b in [-LAT + 2 * LAT * k / 16 for k in range(17)]]
inner = [(0.97 * math.cos(b), 0.97 * math.sin(b)) for b in [LAT - 2 * LAT * k / 16 for k in range(17)]]
for n, (i, col) in enumerate(((0, 0xff5a5a), (2, 0xffd23f), (4, 0x4a90ff))):
    p.layer("g%d" % (n + 1), base=0xffffff, target_faces=520, voxel=0.014)
    p.quadriflow = False
    a0, a1 = i / 6 * TAU, (i + 1) / 6 * TAU
    p.lathe(outer + inner, a0=a0, a1=a1, seg=10, closed=True)
p.layer('cap', base=0xfffaf0, target_faces=160, voxel=0.012)
for s in (-1, 1):
    p.lathe([(0, 0.995), (0.27, 0.955), (0.27, 1.0), (0, 1.04)], rot=(0 if s > 0 else 180, 0, 0), seg=24)
p.layer('skin')
p.bone('root', (0, -1, 0), (0, 1, 0))
p.extras['outline'] = 0.02
p.build()
