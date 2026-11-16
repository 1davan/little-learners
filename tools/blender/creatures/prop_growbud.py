"""Grow a flower: the flower bud. Base on the origin, ~0.42 tall: a plump teardrop bud whose tip (the skin, painted white so
the game tints it the flower's colour) peeks out of five pointed green sepals cupping it from below."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop
from mathutils import Vector, Matrix

p = Prop('prop_growbud', base=0xffffff, target_faces=600, voxel=0.009, smooth=3)
p.quadriflow = False
p.resolution = 0.012
p.blob((0, 0.22, 0), (0.13, 0.17, 0.13))
p.blob((0, 0.36, 0), (0.06, 0.07, 0.06))
p.paint_fn(lambda q, n: q.y < 0.2, 0xe8e8e8)
p.layer('sepals', base=0x58b43a, target_faces=800, voxel=0.009)
p.blob((0, 0.06, 0), (0.1, 0.08, 0.1), group='cup')
for i in range(5):
    a = i / 5 * math.tau + 0.3
    out = Vector((math.sin(a), 0, math.cos(a)))
    pts = [Vector((0, 0.04, 0)) + out * 0.06, Vector((0, 0.16, 0)) + out * 0.135, Vector((0, 0.3, 0)) + out * 0.11]
    p.curve([tuple(v) for v in pts], [0.05, 0.055, 0.012], group='s%d' % i, flat=0.35, per=4)
p.paint_fn(lambda q, n: q.y < 0.05, 0x4a9a34)
p.layer('skin')
p.bone('body', (0, 0, 0), (0, 0.42, 0))
p.extras['argMode'] = 'tint'
p.extras['argDefault'] = 0xff4b6b
p.extras['outline'] = 0.013
p.build()
