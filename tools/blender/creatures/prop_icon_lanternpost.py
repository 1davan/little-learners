"""Beach-evening pedestal trim (home menu): a round paper lantern (layer 'lantern', painted white/greys so the game tints
it and can draw it unlit to glow) with dark wooden caps, hung from a little crook at the top of a bamboo stake. Base at
y 0; lantern centre ~(0.2, 1.22, 0) (anchor 'light')."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

BAMBOO, BAMBOO_D, CAP = 0xc9a464, 0x9a7a42, 0x6a4a32
p = Prop('prop_icon_lanternpost', base=BAMBOO, target_faces=900, voxel=0.012)
p.tube([(0, 0, 0), (0, 1.55, 0)], [0.05, 0.04], rseg=10)
p.tube(rounded([(0, 1.5, 0), (0.0, 1.62, 0), (0.12, 1.66, 0), (0.24, 1.6, 0)], 0.06, n=4), 0.028, rseg=8)
for y in (0.35, 0.75, 1.15):
    p.ring((0, y, 0), 0.047, 0.016, seg=16, rseg=6)
p.paint_fn(lambda q, n: any(abs(q.y - y) < 0.025 for y in (0.35, 0.75, 1.15)), BAMBOO_D)
LX, LY = 0.24, 1.22
p.layer('caps', base=CAP, target_faces=500, voxel=0.01)
p.tube([(LX, 1.6, 0), (LX, LY + 0.2, 0)], 0.012, rseg=5)
p.cyl((LX, LY + 0.15, 0), 0.12, 0.07, bevel=0.02, seg=20)
p.cyl((LX, LY - 0.22, 0), 0.12, 0.07, bevel=0.02, seg=20)
p.tube([(LX, LY - 0.22, 0), (LX, LY - 0.36, 0)], 0.02, rseg=5)
p.blob((LX, LY - 0.38, 0), (0.035, 0.05, 0.035), group='tassel')
p.layer('lantern', base=0xffffff, target_faces=800, voxel=0.012)
p.lathe(rounded([(0, -0.19), (0.13, -0.19), (0.25, -0.08), (0.27, 0.0), (0.25, 0.08), (0.13, 0.19), (0, 0.19)], 0.08, n=5), pos=(LX, LY, 0), seg=40)
p.paint_fn(lambda q, n: abs(((math.atan2(q.x - LX, q.z) / math.tau) * 12) % 1 - 0.5) > 0.44, 0xe2e2e2)
p.layer('skin')
p.bone('body', (0, 0, 0), (0, 1.6, 0))
p.anchor('light', (LX, LY, 0))
p.extras['outline'] = 0.018
p.build()
