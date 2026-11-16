"""Little beach wagon (Which has more? cart holder). Bed floor at y 0.75, 4.3 wide; low front/back walls, taller
tinted side boards, four chunky wheels with yellow hubs and a pull handle. Tintable (makeHolder colour): the walls are
painted white in the skin; the wooden bed, wheels and handle are their own layers."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop

FY, W = 0.75, 4.1
HW = (W + 0.2) / 2
TINT, TINT_D = 0xffffff, 0xdadada
WOOD, WOOD_D, TYRE, HUB = 0xc98b4f, 0xa86f3a, 0x4a3a48, 0xffd23f

p = Prop('prop_wagon', base=TINT, target_faces=3000)
for z in (-0.6, 0.6):
    p.box((0, FY + 0.05, z), (HW, 0.2, 0.06), bevel=0.05)                 # front/back walls
for s in (-1, 1):
    p.box((s * (W / 2 + 0.05), FY + 0.18, 0), (0.07, 0.33, 0.66), bevel=0.06)   # side boards
p.paint_fn(lambda q, n: q.y > FY + 0.19, TINT_D)

p.layer('wood', base=WOOD, target_faces=1600)
p.box((0, FY - 0.08, 0), (HW + 0.05, 0.08, 0.66), bevel=0.05)              # bed
for x in (-1.4, 1.4):
    p.box((x, FY - 0.22, 0), (0.12, 0.07, 0.75), bevel=0.04)              # axle blocks
p.paint_fn(lambda q, n: abs(q.y - (FY - 0.08)) < 0.09 and q.z > 0.6 and abs(q.x) < HW, WOOD_D)
p.layer('handle', base=TYRE, target_faces=700, voxel=0.014)
# pull handle: a bar from the right side, bending up to a T grip
p.tube([(HW + 0.05, FY - 0.08, 0), (HW + 0.6, FY + 0.1, 0), (HW + 1.15, FY + 0.55, 0)], 0.055, rseg=10)
p.tube([(HW + 1.15, FY + 0.55, -0.28), (HW + 1.15, FY + 0.55, 0.28)], 0.075, rseg=10)
p.paint_fn(lambda q, n: q.x > HW + 1.0, 0xff5a5a)
p.layer('skin')

p.layer('wheels', base=TYRE, target_faces=2200)
for x in (-1.4, 1.4):
    for z in (-0.72, 0.72):
        sz = 1 if z > 0 else -1
        p.cyl((x, 0.38, z - 0.09), 0.38, 0.18, rot=(90, 0, 0), bevel=0.07, seg=32)
p.layer('hubs', base=HUB, target_faces=600, voxel=0.012)
for x in (-1.4, 1.4):
    for z in (-0.72, 0.72):
        sz = 1 if z > 0 else -1
        p.blob((x, 0.38, z + sz * 0.1), (0.14, 0.14, 0.05), group='hub%d%d' % (x > 0, z > 0))
p.layer('skin')

p.bone('body', (0, 0, 0), (0, FY, 0))
p.extras['argMode'] = 'tint'
p.extras['argDefault'] = 0x4a90ff
p.extras['outline'] = 0.026
p.build()
