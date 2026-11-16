"""Beach stall (Which has more? tray holder). Counter top at y 1.35, 4.4 wide, with a back board, a striped awning
with a scalloped edge, white side rails and a front skirt. Tintable (makeHolder colour): the board, counter, skirt and
every other awning stripe are painted white in the skin; white trim and wood live in their own layers."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop

FY, W = 1.35, 4.1
HW = (W + 0.3) / 2          # counter half width 2.2
TINT, TINT_D = 0xffffff, 0xd8d8d8
WHITE, WOOD, WOOD_D = 0xfffaf0, 0xc98b4f, 0xa86f3a

p = Prop('prop_stall', base=TINT, target_faces=4200)
p.box((0, FY - 0.08, 0), (HW, 0.08, 0.6), bevel=0.05)                      # counter
p.box((0, (FY - 0.15) / 2 + 0.12, 0.42), (HW - 0.1, (FY - 0.15) / 2 - 0.06, 0.07), bevel=0.06)   # front skirt
p.box((0, FY + 1.2, -0.62), (HW, 1.2, 0.07), bevel=0.06)                  # back board
AY0, AY1, AZ0, AZ1 = FY + 2.55, FY + 2.2, -0.75, 0.35                      # awning back/front
NS = 7
sw = (2 * HW + 0.3) / NS


def stripe(i):
    x = -HW - 0.15 + sw * (i + 0.5)
    yc, zc = (AY0 + AY1) / 2, (AZ0 + AZ1) / 2
    ang = math.degrees(math.atan2(AY0 - AY1, AZ1 - AZ0))
    L = math.hypot(AY0 - AY1, AZ1 - AZ0) / 2
    p.box((x, yc, zc), (sw / 2 - 0.005, 0.05, L), rot=(ang, 0, 0), bevel=0.04)
    p.blob((x, AY1 - 0.1, AZ1 + 0.02), (sw / 2 - 0.02, 0.17, 0.05), group='scallop%d' % i)
for i in range(0, NS, 2):
    stripe(i)
p.paint_fn(lambda q, n: q.y < 0.3 and q.z > 0.3, TINT_D)
p.paint_fn(lambda q, n: q.z < -0.54 and FY + 0.1 < q.y < FY + 2.2 and n.z > 0.5 and (abs(q.x) > HW - 0.22 or q.y > FY + 2.0 or q.y < FY + 0.22), TINT_D)  # board frame

# white trim: odd awning stripes, the front lip, side rails, skirt edge
p.layer('trim', base=WHITE, target_faces=2600)
for i in range(1, NS, 2):
    stripe(i)
p.box((0, FY + 0.06, 0.6), (HW + 0.02, 0.1, 0.06), bevel=0.05)              # lip
for s in (-1, 1):
    p.box((s * (W / 2 + 0.1), FY + 0.22, 0), (0.06, 0.25, 0.6), bevel=0.05)  # side rails
    p.box((s * (W / 2 + 0.1), FY + 0.47, 0), (0.08, 0.04, 0.64), bevel=0.035)
# a big white flower sticker on the skirt
for k in range(6):
    a = k * math.pi / 3
    p.blob((math.cos(a) * 0.2, 0.68 + math.sin(a) * 0.2, 0.5), (0.13, 0.13, 0.04), group='petal')
p.layer('skin')

p.layer('wood', base=WOOD, target_faces=1400)
for s in (-1, 1):
    p.cyl((s * (HW - 0.05), 0, -0.62), 0.09, AY0 + 0.05, bevel=0.04, seg=16)      # posts up to the awning
    p.cyl((s * (HW - 0.12), 0, 0.45), 0.1, 0.2, r2=0.08, bevel=0.04, seg=16)   # little feet under the skirt
    p.blob((s * (HW - 0.05), AY0 + 0.12, -0.62), (0.13, 0.13, 0.13), group='knob%d' % s)
p.blob((0, 0.68, 0.53), (0.09, 0.09, 0.04), group='mid')
p.paint('mid', (0, 0.68, 0.55), (0.12, 0.12, 0.1), 0xffd23f)
p.layer('skin')

p.bone('body', (0, 0, 0), (0, FY, 0))
p.extras['argMode'] = 'tint'
p.extras['argDefault'] = 0x4a90ff
p.extras['outline'] = 0.026
p.build()
