"""Home icon for Pattern parade: a cheerful caterpillar whose body is a red-blue-red-blue pattern, marching with its body
in a wave. Green head (code face) with two springy antennae. ~2.5 long, ~1.5 tall, feet on y 0, faces +z (head on the
right, turned a little toward the viewer)."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

RED, BLUE, GREEN, GREEN_D, FOOT = 0xff5a5a, 0x4a90ff, 0x6fd06a, 0x4fb04c, 0x3d8a3a
SEGS = [(-1.1, 0.34, -0.05, RED), (-0.62, 0.48, 0.0, BLUE), (-0.14, 0.38, 0.05, RED), (0.34, 0.46, 0.08, BLUE)]
HX, HY, HZ, HR = 0.84, 0.8, 0.12, 0.46
SR = 0.3
p = Prop('prop_icon_caterpillar', base=GREEN, target_faces=3600, voxel=0.016)
for i, (x, y, z, c) in enumerate(SEGS):
    p.blob((x, y, z), (SR + 0.02 * i, SR + 0.02 * i, SR + 0.01 * i), group='s%d' % i)
    for fz in (-1, 1):
        p.blob((x, 0.07, z + fz * 0.17), (0.08, 0.07, 0.09), group='f%d%d' % (i, fz))
# head + a neck bridge into it
p.blob((HX, HY, HZ), (HR, HR * 0.95, HR * 0.92), group='head')
for fz in (-1, 1):
    p.blob((0.74, 0.07, 0.1 + fz * 0.17), (0.08, 0.07, 0.09), group='hf%d' % fz)
p.blob((0.74, 0.22, 0.1), (0.14, 0.16, 0.14), group='hneck')


def nearest(q):
    best, bi = 9, -1
    for i, (x, y, z, c) in enumerate(SEGS):
        d = (q.x - x) ** 2 + (q.y - y) ** 2 + (q.z - z) ** 2
        if d < best:
            best, bi = d, i
    dh = (q.x - HX) ** 2 + (q.y - HY) ** 2 + (q.z - HZ) ** 2
    return 'h' if dh - HR * HR * 0.6 < best else bi


for i, (x, y, z, c) in enumerate(SEGS):
    p.paint_fn(lambda q, n, i=i: q.y > 0.16 and nearest(q) == i, c)
    p.paint('shine%d' % i, (x - 0.1, y + 0.2, z + 0.22), (0.075, 0.06, 0.08), 0xffffff)
p.paint_fn(lambda q, n: q.y <= 0.16, FOOT)
p.paint('cheekshade', (HX, HY - 0.32, HZ + 0.2), (0.3, 0.12, 0.3), GREEN_D)

# antennae (own groups, springy bones)
ANT = []
for s in (-1, 1):
    base = (HX + s * 0.17, HY + 0.38, HZ - 0.05)
    mid = (HX + s * 0.26, HY + 0.62, HZ - 0.02)
    tip = (HX + s * 0.36, HY + 0.78, HZ + 0.02)
    p.curve([base, mid, tip], [0.04, 0.035, 0.03], group='ant%d' % s, per=5)
    p.blob(tip, (0.09, 0.09, 0.09), group='antb%d' % s)
    ANT.append((s, base, mid, tip))
p.paint_fn(lambda q, n: q.y > HY + 0.7, 0xffd23f)

p.bone('body', (0, 0, 0), (0, 0.6, 0))
p.bone('head', (HX, HY - 0.2, HZ), (HX, HY + 0.4, HZ), parent='body', group=['head', 'ant-1', 'ant1', 'antb-1', 'antb1'])
for s, base, mid, tip in ANT:
    side = 'L' if s < 0 else 'R'
    p.chain('antenna.' + side, [base, mid, (tip[0] + s * 0.05, tip[1] + 0.12, tip[2])], 'head', group=['ant%d' % s, 'antb%d' % s])
p.face(center=(HX, HY - 0.02, HZ), radius=HR * 0.92, bone='head', faceScale=1.0)
p.extras['outline'] = 0.026
p.extras['gait'] = 'walk'
p.build()
