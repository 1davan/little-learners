"""Winter pedestal trim (home menu): a lumpy drift of snow piled round the rim of a home pedestal, with three snowballs
at its foot. In pedestal space (rim radius ~1.36, top at y 0.22)."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop

p = Prop('prop_icon_snowring', base=0xffffff, target_faces=1600, voxel=0.016)
N = 30
for i in range(N):
    a = math.tau * i / N
    h = 0.085 + 0.04 * math.sin(a * 3 + 1) + 0.025 * math.sin(a * 7)
    r = 1.4 + 0.02 * math.sin(a * 5)
    p.blob((r * math.sin(a), 0.2, r * math.cos(a)), (0.12, h, 0.11), rot=(0, math.degrees(a), 0), group='drift')
for k, (x, z, r) in enumerate([(1.12, 0.95, 0.19), (1.42, 0.62, 0.14), (-1.25, 0.82, 0.16)]):
    p.blob((x, r * 0.92, z), (r, r * 0.95, r), group='ball%d' % k)
p.paint_fn(lambda q, n: n.y < -0.15, 0xdfeaf8)
p.paint_fn(lambda q, n: n.y < -0.6, 0xcbdcf2)
p.bone('body', (0, 0, 0), (0, 0.3, 0))
p.extras['outline'] = 0.02
p.build()
