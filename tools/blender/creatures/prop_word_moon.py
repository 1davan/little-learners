"""Brick letters picture: M is for Moon. A plump golden crescent moon (about 2.0 tall) like a soft croissant opening
to the right, with pale craters, a sweet code face on its fat middle and a little twinkly star tucked in the curve.
Bones body + head (the whole moon) so it can look at you. Origin = bottom."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, star_poly

MOON, MOON_D, CRATER, STAR = 0xffe27a, 0xf2c94e, 0xf7d466, 0xfff4b0
p = Prop('prop_word_moon', base=MOON, target_faces=3200, voxel=0.014)
CX, CY, R = 0.2, 1.05, 0.78
path, rad = [], []
for i in range(25):
    t = i / 24
    a = math.radians(62 + t * (298 - 62))
    path.append((CX + R * math.cos(a), CY + R * math.sin(a), 0))
    rad.append(0.07 + 0.37 * math.sin(math.pi * t) ** 1.3)
p.tube(path, rad, rseg=20)
p.paint_fn(lambda q, n: n.z < -0.4, MOON_D)
for i, (x, y, s) in enumerate([(-0.48, 1.55, 0.08), (-0.72, 0.78, 0.07), (-0.2, 0.42, 0.06), (-0.25, 1.75, 0.05)]):
    p.decal('c%d' % i, (x, y), (s, s, 0.2), CRATER)
p.layer('star', base=STAR, target_faces=500, voxel=0.008)
st = star_poly(0.2, inner=0.48)
sx, sy = 0.72, 1.12
verts = [(sx + x, sy + y, -0.06) for x, y in st] + [(sx + x, sy + y, 0.06) for x, y in st]
n = len(st)
p.mesh(verts, [tuple(range(n - 1, -1, -1)), tuple(range(n, 2 * n))] + [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)])
p.layer('skin')
p.bone('body', (0, 0, 0), (0, 0.3, 0), region=lambda q: False)
p.bone('head', (0, 0.3, 0), (0, 2.0, 0), parent='body')
p.face(center=(CX - R, CY, 0.0), radius=0.36, faceScale=0.95)
p.extras['outline'] = 0.024
p.build()
