"""Slatted wooden crate (Share the snacks bin). Tintable (the slats are painted white, the corner posts light grey):
2.72 wide x 1.0 tall x 1.42 deep, three rows of chunky slats with gaps, four corner posts, a straw bed inside whose top
is at y 0.86 (snacks pile on it), and a round cream sign on the front (centre (0, 0.5, 0.76), radius 0.36) where the
game hangs a picture of the snack."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

p = Prop('prop_crate', base=0xffffff, target_faces=3200, voxel=0.016, smooth=3)
for y in (0.2, 0.5, 0.8):
    for z in (-0.68, 0.68):
        p.box((0, y, z), (1.32, 0.11, 0.055), bevel=0.04)
    for x in (-1.3, 1.3):
        p.box((x, y, 0), (0.055, 0.11, 0.66), bevel=0.04)
for x in (-1.3, 1.3):
    for z in (-0.68, 0.68):
        p.box((x, 0.5, z), (0.11, 0.5, 0.11), bevel=0.05)
p.paint_fn(lambda q, n: abs(q.x) > 1.18 and abs(q.z) > 0.56, 0xbdbdbd)                    # posts a shade darker
p.paint_fn(lambda q, n: n.y > 0.7 and abs(q.x) < 1.18, 0xf2f2f2)                           # slat tops catch light

p.layer('straw', base=0xf0d27a, target_faces=900, voxel=0.02)
p.box((0, 0.5, 0), (1.25, 0.36, 0.62), bevel=0.05)
for i in range(9):
    x = -1.05 + i * 0.26
    p.blob((x, 0.86, -0.3 + (i % 3) * 0.3), (0.16, 0.05, 0.14), group='tuft%d' % i)
p.paint_fn(lambda q, n: (math.sin(q.x * 19 + q.z * 7) + math.sin(q.z * 23 - q.x * 5)) > 1.2, 0xd9b04a)
p.paint_fn(lambda q, n: q.y < 0.8, 0x6b4a2a)                                                # shadowy inside walls

p.layer('sign', base=0xfff6e6, target_faces=1400, voxel=0.008)
p.cyl((0, 0.5, 0.72), 0.36, 0.07, rot=(90, 0, 0), bevel=0.025, seg=40)
p.paint_fn(lambda q, n: math.hypot(q.x, q.y - 0.5) > 0.3, 0xf2d6a0)
# a big clear apple stencil on the disc: round red apple, a brown stalk and a green leaf
p.paint_fn(lambda q, n: q.z > 0.76 and (math.hypot(q.x + 0.06, q.y - 0.47) < 0.15 or math.hypot(q.x - 0.06, q.y - 0.47) < 0.15) and q.y < 0.64, 0xe8443a)
p.paint_fn(lambda q, n: q.z > 0.76 and abs(q.x - 0.005) < 0.022 and 0.6 < q.y < 0.7, 0x7a4a2a)
p.paint_fn(lambda q, n: q.z > 0.76 and ((q.x - 0.1) / 0.09) ** 2 + ((q.y - 0.68) / 0.045) ** 2 < 1, 0x5cbf4a)
p.layer('nails', base=0x8a7a6a, target_faces=200, voxel=0.01)
for x in (-1.3, 1.3):
    for y in (0.2, 0.5, 0.8):
        p.blob((x, y, 0.8), (0.03, 0.03, 0.02), group='n%d%d' % (x > 0, int(y * 10)))
p.layer('skin')
p.bone('body', (0, 0, 0), (0, 1.0, 0))
p.extras['argMode'] = 'tint'
p.extras['argDefault'] = 0xd9a05b
p.extras['outline'] = 0.028
p.build()
