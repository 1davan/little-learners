"""Two-tier cake stand (Apple count 'stand' host). Oval plates (wide in x) with scalloped rims: bottom plate top at
y 1.92 (4.8 wide), top plate top at y 3.62 (3.4 wide); a sky-blue pillar, a pink bead finial, a round foot."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

WHITE, WHITE_D, BLUE, BLUE_D, PINK, YEL = 0xfffaf2, 0xe6ddd0, 0x9ed6ff, 0x7cbbe8, 0xff9ec8, 0xffd23f
p = Prop('prop_cakestand', base=BLUE, target_faces=2400, voxel=0.018)
p.lathe(rounded([(0, 0), (0.85, 0), (0.85, 0.12), (0.45, 0.32), (0.32, 0.5), (0.32, 1.6), (0.42, 1.78), (0, 1.8)], 0.08, n=4), seg=40)
p.lathe(rounded([(0, 1.9), (0.14, 1.9), (0.1, 2.3), (0.1, 3.45), (0.2, 3.52), (0, 3.52)], 0.05, n=3), seg=24)
p.paint_fn(lambda q, n: q.y < 0.14, BLUE_D)
for y in (0.9, 1.25):
    p.paint_fn(lambda q, n, y=y: abs(q.y - y) < 0.05, 0xffffff)

p.layer('plates', base=WHITE, target_faces=2600, voxel=0.018)


def plate(y, rx, rz):
    p.lathe(rounded([(0, y - 0.14), (0.8, y - 0.14), (1.0, y - 0.04), (1.0, y), (0, y)], 0.04, n=3), scale=(rx, rz), seg=56)
    per = math.pi * (3 * (rx + rz) - math.sqrt((3 * rx + rz) * (rx + 3 * rz)))
    n = int(per / 0.32)
    for i in range(n):
        a = i / n * math.tau
        p.blob((rx * 0.985 * math.sin(a), y - 0.1, rz * 0.985 * math.cos(a)), (0.13, 0.07, 0.13), group='sc%.1f_%d' % (y, i))
plate(1.92, 2.4, 1.08)
plate(3.62, 1.7, 0.77)
p.paint_fn(lambda q, n: n.y < -0.4, WHITE_D)

p.layer('trim', base=PINK, target_faces=900, voxel=0.014)
p.blob((0, 3.72, 0), (0.15, 0.15, 0.15), group='bead')
p.blob((0, 3.9, 0), (0.09, 0.09, 0.09), group='bead2')
p.ring((0, 1.8, 0), 0.4, 0.05, seg=32, rseg=8)
p.ring((0, 0.13, 0), 0.82, 0.05, seg=40, rseg=8)
p.paint('dot', (0, 3.9, 0), (0.12, 0.12, 0.12), YEL)
p.layer('skin')
p.bone('body', (0, 0, 0), (0, 3.6, 0))
p.extras['outline'] = 0.026
p.build()
