"""Grow a flower: the friendly sun the child calls out from behind the cloud. A puffy golden ball (radius 0.95, facing
+z, centred on the origin) with the game's code face, a warm orange rim, and a ring of ten soft rounded rays (radius
1.15 - 1.75) on their own bone 'rays' (bone points up, so rays.rotation.z spins them in the picture plane)."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop

SUN, SUN_D, RAY, RAY_D = 0xffd23f, 0xffb52e, 0xffb020, 0xff9a1a
p = Prop('prop_growsun', base=SUN, target_faces=1800, voxel=0.016, smooth=3)
p.blob((0, 0, 0), (0.95, 0.95, 0.78))
p.paint_fn(lambda q, n: n.z < 0.45, SUN_D)
p.layer('rays', base=RAY, target_faces=1600, voxel=0.014)
for i in range(10):
    a = i / 10 * math.tau + math.pi / 2
    d = (math.cos(a), math.sin(a))
    pts = [(d[0] * r, d[1] * r, -0.15) for r in (1.02, 1.32, 1.6)]
    p.curve(pts, [0.2, 0.15, 0.07], group='r%d' % i, flat=0.55, per=4)
p.paint_fn(lambda q, n: math.hypot(q.x, q.y) < 1.18, RAY_D)
p.layer('skin')
p.bone('body', (0, -0.95, 0), (0, 0.95, 0))
p.bone('rays', (0, 0, 0), (0, 0.5, 0), parent='body', group=['r%d' % i for i in range(10)])
p.face(center=(0, 0.0, 0), radius=0.8, bone='body', faceScale=1.0)
p.extras['outline'] = 0.026
p.build()
