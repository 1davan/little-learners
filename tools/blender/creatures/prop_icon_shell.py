"""Scallop shell (tintable, default pink) for the home icon of Which has more?. A ribbed fan lying flat (hinge at the
back, -z), domed up to ~0.2, ~1.0 wide, with two little hinge ears. Paint is light grey/white so the tint shows; the
grooves between the ribs are a shade darker."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

p = Prop('prop_icon_shell', base=0xffffff, target_faces=900, voxel=0.014)
HZ = -0.36
N = 9
for i in range(N):
    a = math.radians(-68 + 136 * i / (N - 1))
    pts, rad = [], []
    for k in range(6):
        t = k / 5
        L = 0.05 + 0.6 * t
        pts.append((L * math.sin(a), 0.04 + 0.16 * math.sin(math.pi * min(1, t * 0.85 + 0.15)) * (1 - 0.35 * abs(math.sin(a))), HZ + L * math.cos(a)))
        rad.append(0.04 + 0.05 * t)
    p.curve(pts, rad, group='fan', per=3)
p.blob((0, 0.05, HZ + 0.25), (0.3, 0.07, 0.25), group='fan')
for s in (-1, 1):
    p.blob((s * 0.13, 0.04, HZ - 0.02), (0.11, 0.04, 0.07), rot=(0, s * 20, 0), group='ear%d' % s)


def groove(q, n):
    r = math.hypot(q.x, q.z - HZ)
    if r < 0.18 or n.y < 0.2:
        return False
    a = math.degrees(math.atan2(q.x, q.z - HZ))
    u = (a + 68) / (136 / (N - 1))
    return abs(u - round(u) - 0.5) < 0.16 if -68 < a < 68 else False


p.paint_fn(groove, 0xd2d2d2)
p.paint_fn(lambda q, n: n.y < -0.3, 0xe2e2e2)
p.paint_fn(lambda q, n: math.hypot(q.x, q.z - HZ) < 0.16 and n.y > 0, 0xc8c8c8)
p.bone('body', (0, 0, 0), (0, 0.3, 0))
p.extras['argMode'] = 'tint'
p.extras['argDefault'] = 0xffb6c9
p.extras['outline'] = 0.02
p.build()
