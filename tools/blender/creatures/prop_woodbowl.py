"""Wooden bowl (Share the snacks, barn level; Cook a soup's veg bowl). The inside is a lighter, honey wood so it reads as a
deep bowl you can see into (not a pie); the rim is a pale rolled edge. Tintable painted band (skin layer): a low round wooden bowl, rim radius
1.0 at y 0.49, foot radius 0.62, hollow with its inside floor at y 0.24 (snacks sit inside), a lighter rolled rim and
a coloured band round its belly."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

WOOD, WOOD_IN, WOOD_L = 0xc07a3e, 0xe2a865, 0xf0c48a
p = Prop('prop_woodbowl', base=0xffffff, target_faces=900, voxel=0.011, smooth=3)
# the band hugging the belly (skin = tinted)
p.lathe(rounded([(0.895, 0.18), (0.975, 0.33), (1.02, 0.33), (0.935, 0.18)], 0.012, n=2, closed=True), closed=True, seg=64)
p.layer('wood', base=WOOD, target_faces=2000, voxel=0.016)
outer = [(0.0, 0.0), (0.62, 0.0), (0.7, 0.04), (0.86, 0.16), (0.97, 0.34), (1.0, 0.48)]
inner = [(0.92, 0.49), (0.87, 0.36), (0.78, 0.26), (0.62, 0.245), (0.0, 0.24)]
p.lathe(rounded(outer + inner, 0.04, n=3), seg=64)
p.paint_fn(lambda q, n: q.y > 0.225 and math.hypot(q.x, q.z) < 0.9 and n.y > -0.2 and (n.x * q.x + n.z * q.z) <= 0.05 * math.hypot(q.x, q.z), WOOD_IN)
p.paint_fn(lambda q, n: 0.3 < q.y < 0.43 and math.hypot(q.x, q.z) < 0.9 and (n.x * q.x + n.z * q.z) <= 0.05 * math.hypot(q.x, q.z), 0xd3965a)
p.paint_fn(lambda q, n: (math.sin(math.atan2(q.x, q.z) * 9 + q.y * 14) > 0.75) and q.y < 0.44 and (n.x * q.x + n.z * q.z) > 0.2 * math.hypot(q.x, q.z), 0xb06e36)
p.layer('rim', base=WOOD_L, target_faces=700, voxel=0.012)
p.ring((0, 0.485, 0), 0.96, 0.045, seg=72, rseg=8)
p.layer('skin')
p.bone('body', (0, 0, 0), (0, 0.5, 0))
p.extras['argMode'] = 'tint'
p.extras['argDefault'] = 0xff5a5a
p.extras['outline'] = 0.022
p.build()
