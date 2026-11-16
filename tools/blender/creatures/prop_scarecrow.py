"""Friendly scarecrow (Peekaboo pots, vegetable patch). About 3.8 tall: a wooden post, a blue patched shirt with straw
tufts at the cuffs and collar, a round burlap head with the game's code face (head bone), a floppy straw hat with a red band."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop

WOOD, SHIRT, SHIRT_D, PATCH, HEAD, CHEEK, STRAW, STRAW_D, BAND = 0xa86f3a, 0x4a90ff, 0x3a76d8, 0xffd23f, 0xf2d6a0, 0xffb0a0, 0xf2cf5a, 0xd9ad3a, 0xff5a5a
p = Prop('prop_scarecrow', base=SHIRT, target_faces=4200, voxel=0.018)
# shirt: a soft body with a stiff arm bar
p.blob((0, 2.15, 0), (0.5, 0.55, 0.32), group='shirt')
p.blob((0, 1.75, 0), (0.46, 0.25, 0.3), group='shirt')
p.capsule((-1.05, 2.45, 0), (1.05, 2.45, 0), 0.17, group='arms')
p.blob((0, 2.45, 0), (0.45, 0.2, 0.3), group='arms')
p.paint_fn(lambda q, n: abs(q.x) > 0.8 and abs(q.x) < 0.9, SHIRT_D)            # cuff seams
p.paint('patch', (0.22, 1.85, 0.3), (0.13, 0.13, 0.12), PATCH)
p.paint('patch2', (-0.7, 2.47, 0.15), (0.1, 0.1, 0.1), 0xff8fc0)
p.paint_fn(lambda q, n: abs(q.x) < 0.035 and q.z > 0.15 and 1.6 < q.y < 2.55, SHIRT_D)   # button placket
for y in (1.85, 2.1, 2.35):
    p.paint('btn', (0, y, 0.3), (0.05, 0.05, 0.06), 0xfff6e6)

p.layer('post', base=WOOD, target_faces=700)
p.cyl((0, 0, 0), 0.1, 1.75, r2=0.09, bevel=0.03, seg=16)

p.layer('straw', base=STRAW, target_faces=1600, voxel=0.014)
for s in (-1, 1):
    for k in range(5):
        a = (k - 2) * 22
        r = math.radians(a)
        x0 = s * 1.15
        p.capsule((x0, 2.45, 0), (x0 + s * 0.28 * math.cos(r), 2.45 + 0.28 * math.sin(r), 0.04 * (k - 2)), 0.045, r2=0.025, group='st%d%d' % (s, k))
for k in range(6):
    a = math.radians(k * 60)
    p.capsule((0.1 * math.cos(a), 2.72, 0.1 * math.sin(a)), (0.25 * math.cos(a), 2.62, 0.25 * math.sin(a)), 0.04, r2=0.025, group='col%d' % k)
for k in range(5):
    x = -0.3 + k * 0.15
    p.capsule((x, 1.55, 0.05), (x * 1.3, 1.3, 0.12), 0.045, r2=0.025, group='hem%d' % k)

p.layer('head', base=HEAD, target_faces=1300, voxel=0.014)
p.blob((0, 3.12, 0), (0.42, 0.4, 0.38))
p.blob((0, 2.75, 0), (0.12, 0.1, 0.1), group='neck')
p.paint_fn(lambda q, n: q.y > 2.72 and q.y < 2.82, 0xc9a070)                    # twine at the neck

p.layer('hat', base=STRAW, target_faces=1400, voxel=0.016)
p.cyl((0, 3.42, 0), 0.72, 0.06, r2=0.7, bevel=0.03, rot=(-6, 0, 4), seg=36)
p.blob((0, 3.62, -0.02), (0.36, 0.25, 0.34), group='crown')
p.paint_fn(lambda q, n: 3.5 < q.y < 3.62 and math.hypot(q.x, q.z) < 0.42, BAND)
p.paint_fn(lambda q, n: n.y < -0.5, STRAW_D)
p.layer('skin')

is_head = lambda q: q.y > 2.7 and abs(q.x) < 0.75
p.bone('body', (0, 0, 0), (0, 2.7, 0), region=lambda q: not is_head(q))
p.bone('head', (0, 2.7, 0), (0, 3.9, 0), parent='body', region=is_head)
p.face(center=(0, 3.08, 0), radius=0.4, faceScale=0.95)
p.extras['outline'] = 0.026
p.build()
