"""Night level hat (home menu, tintable): a soft sleepy nightcap - a cone whose long tip flops over to the side - with a
fluffy white cuff and a glowing yellow pompom at the tip (anchor 'tip' marks it for the game's glow). Base at y 0."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

p = Prop('prop_icon_hat_nightcap', base=0xffffff, target_faces=1600, voxel=0.012)
# path: straight up, then bending over to +x and drooping
path, rad = [], []
N = 22
for k in range(N + 1):
    t = k / N
    ang = max(0.0, (t - 0.35) / 0.65) ** 1.3 * math.radians(150)
    rad.append(0.37 * (1 - t) ** 1.15 + 0.045)
    path.append(t)
pts = [(0.0, 0.06, 0.0)]
L = 1.0
for k in range(1, N + 1):
    t = k / N
    ang = max(0.0, (t - 0.3) / 0.7) ** 1.2 * math.radians(140)
    x0, y0, _ = pts[-1]
    step = L / N
    pts.append((x0 + math.sin(ang) * step, y0 + math.cos(ang) * step, 0.0))
p.tube(pts, rad, rseg=24)
p.paint_fn(lambda q, n: n.y < -0.5 and q.y > 0.35, 0xdddddd)
p.layer('trim', base=0xffffff, target_faces=900, voxel=0.012)
p.ring((0, 0.08, 0), 0.38, 0.1, seg=44, rseg=10)
p.paint_fn(lambda q, n: n.y < -0.3, 0xe4eaf4)
TIP = (pts[-1][0] + 0.03, pts[-1][1] - 0.06, 0.0)
p.layer('pom', base=0xffe27a, target_faces=500, voxel=0.01)
p.blob(TIP, (0.12, 0.12, 0.12), group='pom')
p.paint('hi', (TIP[0] - 0.04, TIP[1] + 0.05, TIP[2] + 0.08), (0.04, 0.04, 0.05), 0xfff6c8)
p.layer('skin')
p.bone('body', (0, 0, 0), (0, 0.7, 0))
p.anchor('tip', TIP)
p.extras['argMode'] = 'tint'
p.extras['argDefault'] = 0x6a8fff
p.extras['outline'] = 0.02
print('TIP', TIP)
p.build()
