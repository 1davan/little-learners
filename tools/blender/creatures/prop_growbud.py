"""Grow a flower: the flower bud. Base on the origin, ~0.42 tall: a plump teardrop bud whose tip (the skin, painted white so
the game tints it the flower's colour) peeks out of five pointed green sepals cupping it from below."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop
from mathutils import Vector, Matrix

p = Prop('prop_growbud', base=0xffffff, target_faces=1400, voxel=0.007, smooth=3)
p.quadriflow = False
p.resolution = 0.012
p.blob((0, 0.22, 0), (0.13, 0.17, 0.13))
p.blob((0, 0.36, 0), (0.06, 0.07, 0.06))
p.paint_fn(lambda q, n: q.y < 0.2, 0xe8e8e8)
p.layer('sepals', base=0x58b43a, target_faces=1600, voxel=0.007)
p.blob((0, 0.06, 0), (0.1, 0.08, 0.1), group='cup')


def flat(pos, axis, normal, size, group):
    yv = Vector(axis).normalized(); zv = Vector(normal); zv = (zv - yv * zv.dot(yv)).normalized(); xv = yv.cross(zv)
    e = Matrix((xv, yv, zv)).transposed().to_euler('XYZ')
    p.blob(tuple(pos), size, rot=tuple(math.degrees(v) for v in e), group=group)


for i in range(5):                       # five smooth pointed sepals cupping the bud, tips curling out a little
    a = i / 5 * math.tau + 0.3
    out = Vector((math.sin(a), 0, math.cos(a)))
    for k in range(11):
        t = k / 10
        r = 0.07 + 0.075 * math.sin(math.pi * min(1.0, t * 0.9)) + 0.03 * t * t
        pos = Vector((0, 0.05 + 0.27 * t, 0)) + out * r
        axis = Vector((0, 1, 0)) + out * (0.35 + 0.6 * t - 0.5 * (1 - t))
        w = 0.052 * math.sin(math.pi * (0.1 + 0.8 * (1 - t))) ** 0.8 + 0.006
        flat(pos, axis, out, (w, 0.035, 0.016), 's%d' % i)
p.paint_fn(lambda q, n: q.y < 0.05, 0x4a9a34)
p.layer('skin')
p.bone('body', (0, 0, 0), (0, 0.42, 0))
p.extras['argMode'] = 'tint'
p.extras['argDefault'] = 0xff4b6b
p.extras['outline'] = 0.011
p.build()
