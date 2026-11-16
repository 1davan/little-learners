"""Ice-cream cone (Which has more? / Splash wash). About 1.0 tall, centred near the origin: the cone tip points down
(y -0.5), a fat drippy scoop on top (tintable: argMode 'tint', strawberry pink by default), rainbow sprinkles, a
waffle cone and a cherry with a stalk."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

CONE, CONE_D, CHERRY = 0xe8b06a, 0xc98b4f, 0xff3b5c
p = Prop('prop_icecream', base=0xffffff, target_faces=900, voxel=0.012, smooth=3)
p.quadriflow = False
p.blob((0, 0.17, 0), (0.29, 0.25, 0.29), group='scoop')
p.blob((0, 0.32, 0), (0.17, 0.12, 0.17), group='scoop')
for i in range(9):                                    # the drippy rim where it sits on the cone
    a = i / 9 * math.tau + 0.3
    d = 0.06 + 0.05 * (i % 3 == 0)
    p.blob((0.27 * math.sin(a), 0.02 - d * 0.5, 0.27 * math.cos(a)), (0.075, 0.06 + d, 0.075), group='scoop')
p.layer('cone', base=CONE, target_faces=500, voxel=0.012)
p.quadriflow = False
p.lathe(rounded([(0, -0.5), (0.03, -0.5), (0.25, 0.04), (0.27, 0.08), (0, 0.08)], 0.03, n=3), seg=28)
p.paint_fn(lambda q, n: min(abs(math.sin((math.atan2(q.x, q.z) * 3.2 + q.y * 9))), abs(math.sin((math.atan2(q.x, q.z) * 3.2 - q.y * 9)))) < 0.16 and q.y < 0.0, CONE_D)
p.layer('cherry', base=CHERRY, target_faces=200, voxel=0.01)
p.blob((0.02, 0.5, 0.02), (0.075, 0.07, 0.075), group='cherry')
p.tube([(0.03, 0.55, 0.02), (0.05, 0.63, 0.0), (0.1, 0.68, -0.02)], 0.012, rseg=6)
p.paint_fn(lambda q, n: q.y > 0.57, 0x5a8a3a)
p.layer('sprinkles', base=0xffd23f, target_faces=300, voxel=0.008)
p.quadriflow = False
SPR = [0xffd23f, 0x4a90ff, 0x5fd068, 0xffffff, 0xa77bff, 0xff9f3f]
import random
random.seed(4)
pts = []
for i in range(14):
    a = random.uniform(0, math.tau); el = random.uniform(0.25, 1.2)
    x, y, z = 0.27 * math.cos(el) * math.sin(a), 0.17 + 0.25 * math.sin(el), 0.27 * math.cos(el) * math.cos(a)
    d = (x * x + (y - 0.17) ** 2 + z * z) ** 0.5
    x, y, z = x / d * 0.3, 0.17 + (y - 0.17) / d * 0.27, z / d * 0.3
    if y > 0.36:
        y = 0.38
    ang = random.uniform(0, 180)
    p.capsule((x - 0.025 * math.cos(math.radians(ang)), y - 0.02 * math.sin(math.radians(ang)), z), (x + 0.025 * math.cos(math.radians(ang)), y + 0.02 * math.sin(math.radians(ang)), z), 0.016, group='sp%d' % i, steps=3)
    pts.append(((x, y, z), SPR[i % len(SPR)]))
for (x, y, z), c in pts:
    p.paint('s%.2f%.2f' % (x, z), (x, y, z), (0.05, 0.05, 0.05), c)
p.layer('skin')
p.bone('root', (0, -0.5, 0), (0, 0.5, 0))
p.extras['argMode'] = 'tint'
p.extras['argDefault'] = 0xffb6d9
p.extras['outline'] = 0.014
p.build()
