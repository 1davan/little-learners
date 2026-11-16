"""China plate (Share the snacks, picnic level). Tintable rim band (the game lights it gold): a white plate radius 1.0,
centre top at y 0.12, a raised rim to y 0.18 with a coloured band (the skin layer, painted white so the tint shows)
and little white dots on the band."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

p = Prop('prop_chinaplate', base=0xffffff, target_faces=1200, voxel=0.01, smooth=3)
# the coloured band on the rim (skin = tinted): a soft flat ring lying on the rim slope
p.lathe(rounded([(0.775, 0.13), (0.955, 0.172), (0.96, 0.21), (0.77, 0.168)], 0.012, n=2, closed=True), closed=True, seg=64)
p.layer('china', base=0xfffbf4, target_faces=1400, voxel=0.014)
p.lathe(rounded([(0.0, 0.02), (0.6, 0.0), (0.8, 0.045), (1.0, 0.14), (1.0, 0.17), (0.95, 0.182), (0.74, 0.125), (0.0, 0.118)], 0.03, n=3), seg=64)
p.paint_fn(lambda q, n: n.y < -0.3, 0xe8e2d8)
p.layer('dots', base=0xffffff, target_faces=400, voxel=0.008)
for i in range(14):
    a = i / 14 * math.tau
    r = 0.865
    p.blob((r * math.sin(a), 0.192, r * math.cos(a)), (0.04, 0.016, 0.04), rot=(-13 * math.cos(a), 0, 13 * math.sin(a)), group='d%d' % i)
p.layer('skin')
p.bone('body', (0, 0, 0), (0, 0.2, 0))
p.extras['argMode'] = 'tint'
p.extras['argDefault'] = 0xff5a5a
p.extras['outline'] = 0.02
p.build()
