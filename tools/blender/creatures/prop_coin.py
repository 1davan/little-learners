"""Gold coin (Where's Crab? treasure). Stands upright facing +z: radius 1.0, 0.3 thick, centred on the origin.
A raised rim on both faces and a fat embossed star in a paler gold."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded, star_poly

GOLD, GOLD_D, PALE = 0xffc23f, 0xe9a52a, 0xffe58a
p = Prop('prop_coin', base=GOLD, target_faces=380, voxel=0.016, smooth=2)
p.quadriflow = False
prof = rounded([(0, -0.1), (0.8, -0.1), (0.84, -0.16), (1.0, -0.16), (1.0, 0.16), (0.84, 0.16), (0.8, 0.1), (0, 0.1)], 0.04, n=3)
p.lathe(prof, rot=(90, 0, 0), seg=40)
p.paint_fn(lambda q, n: math.hypot(q.x, q.y) > 0.97 or (math.hypot(q.x, q.y) > 0.78 and math.hypot(q.x, q.y) < 0.83), GOLD_D)
p.layer('star', base=PALE, target_faces=240, voxel=0.012)
p.quadriflow = False
poly = star_poly(0.6, inner=0.48)
for d in (1, -1):
    verts = [(0, 0, 0.06 * d)] + [(x, y, 0.06 * d) for x, y in poly] + [(0, 0, 0.19 * d)] + [(x * 0.88, y * 0.88, 0.17 * d) for x, y in poly]
    m = len(poly); k = m + 1
    faces = []
    for i in range(m):
        j = (i + 1) % m
        faces += [(0, 1 + j, 1 + i), (k, k + 1 + i, k + 1 + j), (1 + i, 1 + j, k + 1 + j, k + 1 + i)]
    p.mesh(verts, faces)
p.layer('skin')
p.bone('root', (0, -1, 0), (0, 1, 0))
p.extras['outline'] = 0.04
p.build()
