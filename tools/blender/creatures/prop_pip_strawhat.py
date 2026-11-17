"""Pip's farm straw hat (worn on Pip's head bone, see app/src/engine/piphat.js). A farmer's straw hat: a crown with a
soft dimple on top that fits over Pip's head (opening 0.82 x 0.75 at y 0), a woven brim (radius ~1.22) whose rim
curls up a little, painted weave rings, and a red band with a neat bow-knot on the left.
Hat space: base of the crown at y 0, front +z."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

STRAW, STRAW_D, STRAW_L, RED, RED_D = 0xf2cf68, 0xd8ae48, 0xf8df8e, 0xe0503e, 0xb83a2c
SZ = 0.91
p = Prop('prop_pip_strawhat', base=STRAW, target_faces=2400, voxel=0.013)
# crown: straight-ish sides, a pinched dimple on top
p.lathe(rounded([(0, -0.02), (0.82, -0.02), (0.8, 0.2), (0.72, 0.44), (0.56, 0.52), (0.3, 0.5), (0, 0.44)], 0.1, n=5), scale=(1, SZ), seg=56)
# brim: flat, dipping a touch, the rim curling up
top = [(0.76, 0.06), (0.92, 0.045), (1.06, 0.03), (1.16, 0.04), (1.22, 0.08)]
bot = [(r, y - 0.05) for r, y in top]
p.lathe(rounded(top + [(1.25, 0.06)] + list(reversed(bot)), 0.022, n=2, closed=True), scale=(1, SZ), seg=64, closed=True)
# weave: rings on the brim, rows on the crown (crisp, light against base)
def weave(q, n):
    r = math.hypot(q.x, q.z / SZ)
    if q.y < 0.1 and r > 0.84:
        return n.y > 0.3 and int(r * 16) % 2 == 0
    return q.y > 0.18 and r < 0.84 and int(q.y * 13) % 2 == 0 and abs(n.y) < 0.8
p.paint_fn(weave, STRAW_L)
p.paint_fn(lambda q, n: n.y < -0.4, STRAW_D)
# band
p.layer('band', base=RED, target_faces=700, voxel=0.011)
p.lathe([(0.79, 0.04), (0.84, 0.04), (0.835, 0.18), (0.79, 0.18)], scale=(1, SZ), seg=56, closed=True)
p.paint_fn(lambda q, n: n.y < -0.5, RED_D)
# a flat bow-knot on the band at the left side: two loops and a knot
a = math.radians(-70)
bx, bz = 0.86 * math.sin(a), 0.86 * math.cos(a) * SZ
for s_ in (-1, 1):
    p.blob((bx + s_ * 0.1 * math.cos(a), 0.11, bz - s_ * 0.1 * math.sin(a)), (0.11, 0.065, 0.035), rot=(0, math.degrees(a), s_ * 12), group='loop%d' % s_)
p.blob((bx * 1.02, 0.11, bz * 1.02), (0.045, 0.05, 0.04), rot=(0, math.degrees(a), 0), group='knot')
p.layer('skin')
p.bone('body', (0, 0, 0), (0, 0.55, 0))
p.extras['outline'] = 0.02
p.build()
