"""Wooden mooring post (Which has more?, Gull's perch). Origin at the foot, 2.6 tall with a flat round top for Gull to
stand on, growth rings on top, darker wood bands, and a coil of rope with a dangling end."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

H = 2.6
p = Prop('prop_post', base=0xb07a48, target_faces=1200, voxel=0.016, smooth=3)
p.lathe(rounded([(0, 0), (0.2, 0), (0.18, H - 0.04), (0.2, H), (0, H)], 0.04, n=3), seg=28)
p.paint_fn(lambda q, n: q.y > H - 0.02 and n.y > 0.7 and any(abs(math.hypot(q.x, q.z) - r) < 0.012 for r in (0.06, 0.12)), 0x8a5a32)
p.paint_fn(lambda q, n: q.y < 0.18 or abs(q.y - 1.1) < 0.04, 0x8f6038)
p.layer('rope', base=0xeedcae, target_faces=900, voxel=0.012)
p.quadriflow = False
for k in range(3):
    p.ring((0, 1.78 + k * 0.085, 0), 0.215, 0.045, seg=32, rseg=8)
p.tube([(0.2, 1.75, 0.08), (0.28, 1.55, 0.12), (0.26, 1.35, 0.15), (0.3, 1.2, 0.14)], 0.042, rseg=8)
p.blob((0.3, 1.18, 0.14), (0.06, 0.05, 0.06), group='knot')
p.paint_fn(lambda q, n: math.sin(math.atan2(q.x, q.z) * 10 + q.y * 30) > 0.6, 0xd6bf8a)
p.layer('skin')
p.bone('root', (0, 0, 0), (0, H, 0))
p.extras['outline'] = 0.02
p.build()
