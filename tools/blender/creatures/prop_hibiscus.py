"""Hibiscus flower (Bear's nose: the ear flower and a toy). Faces +z, radius 1.0, centred: five round ruffled petals
(tintable, argMode 'tint', pink by default) with a deeper heart, and a yellow stamen sticking out."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop

p = Prop('prop_hibiscus', base=0xffffff, target_faces=900, voxel=0.016, smooth=3)
for i in range(5):
    a = math.radians(90 + 72 * i)
    for r, s in ((0.35, 0.3), (0.62, 0.36)):
        p.blob((r * math.cos(a), r * math.sin(a), 0.06 * (1 - r)), (s, s * 0.95, 0.1), rot=(0, 0, math.degrees(a)), group='petal%d' % i)
p.blob((0, 0, 0.05), (0.3, 0.3, 0.14), group='mid')
p.paint_fn(lambda q, n: math.hypot(q.x, q.y) < 0.3, 0xcc8899)
p.paint_fn(lambda q, n: math.hypot(q.x, q.y) > 0.3 and math.cos(math.atan2(q.y, q.x) * 5 - math.radians(90) * 5) > 0.97 and math.hypot(q.x, q.y) < 0.75, 0xe8d0d8)
p.layer('stamen', base=0xffd23f, target_faces=300, voxel=0.012)
p.quadriflow = False
p.tube([(0, 0, 0.1), (0.05, 0.08, 0.35), (0.1, 0.2, 0.5)], 0.03, rseg=8)
for dx, dy in ((0.0, 0.0), (0.07, 0.03), (-0.04, 0.05), (0.03, -0.05)):
    p.blob((0.1 + dx, 0.2 + dy, 0.52), (0.04, 0.04, 0.04), group='d%d%d' % (dx * 100, dy * 100))
p.layer('skin')
p.bone('root', (0, -0.5, 0), (0, 0.5, 0))
p.extras['argMode'] = 'tint'
p.extras['argDefault'] = 0xff6fa8
p.extras['outline'] = 0.02
p.build()
