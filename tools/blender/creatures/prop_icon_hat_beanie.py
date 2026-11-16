"""Winter level hat (home menu, tintable): a knitted bobble beanie. Ribbed dome (painted in light greys so the tint
shows), a chunky white folded cuff and a fluffy white pompom. Base at y 0, ~0.9 across, top ~0.68."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

p = Prop('prop_icon_hat_beanie', base=0xffffff, target_faces=1300, voxel=0.012)
p.lathe(rounded([(0, 0.0), (0.4, 0.0), (0.41, 0.18), (0.36, 0.38), (0.2, 0.5), (0, 0.52)], 0.12, n=5), seg=48)
p.paint_fn(lambda q, n: (int((math.atan2(q.x, q.z) / math.tau) * 32 + 64) % 2 == 0) and q.y > 0.14, 0xe6e6e6)
p.layer('trim', base=0xffffff, target_faces=1000, voxel=0.012)
p.ring((0, 0.08, 0), 0.41, 0.1, seg=48, rseg=10)
p.blob((0, 0.6, 0), (0.15, 0.14, 0.15), group='pom')
for k in range(7):
    a = math.tau * k / 7
    p.blob((0.09 * math.sin(a), 0.6 + 0.06 * math.cos(a * 2), 0.09 * math.cos(a)), (0.08, 0.08, 0.08), group='pom')
p.paint_fn(lambda q, n: q.y < 0.3 and (int((math.atan2(q.x, q.z) / math.tau) * 40 + 80) % 2 == 0), 0xeef2f8)
p.paint_fn(lambda q, n: q.y > 0.45 and n.y < -0.3, 0xe4eaf4)
p.layer('skin')
p.bone('body', (0, 0, 0), (0, 0.7, 0))
p.extras['argMode'] = 'tint'
p.extras['argDefault'] = 0x6a8fff
p.extras['outline'] = 0.02
p.build()
