"""Big polka-dot bowl (Apple count 'bowl'). Rim radius 1.5 at y 0.95, a cream foot, a pink band, white dots all round;
the inside floor sits at y 0.6 where the fruit lands."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

BLUE, BLUE_IN, CREAM, PINK, DOT = 0x8fd3ff, 0x5fa8d8, 0xfff6ee, 0xff7ab8, 0xffffff
p = Prop('prop_bowl', base=BLUE, target_faces=4200, voxel=0.02)
outer = [(0, 0.08), (0.8, 0.08)] + [(0.8 + 0.7 * math.sin(math.radians(a)), 0.08 + 0.87 * (1 - math.cos(math.radians(a)))) for a in range(10, 91, 10)]
inner = [(1.38, 0.95)] + [(0.0 + 1.38 * math.sin(math.radians(a)) * 0.95, 0.6 + 0.35 * (1 - math.cos(math.radians(a)))) for a in range(80, -1, -10)]
p.lathe(rounded(outer + inner, 0.05, n=3), seg=64)
inward = lambda q, n: (n.x * q.x + n.z * q.z) < -0.15 * math.hypot(q.x, q.z) or (n.y > 0.6 and q.y < 0.9)
p.paint_fn(lambda q, n: q.y > 0.55 and q.y < 0.93 and inward(q, n), BLUE_IN)

p.layer('foot', base=CREAM, target_faces=900, voxel=0.016)
p.cyl((0, 0, 0), 0.9, 0.14, r2=0.82, bevel=0.05, seg=48)
p.ring((0, 0.95, 0), 1.44, 0.075, seg=72, rseg=10)
p.layer('band', base=PINK, target_faces=900, voxel=0.014)
rr = lambda y: 0.8 + 0.7 * math.sin(math.acos(max(-1, min(1, 1 - (y - 0.08) / 0.87))))
p.ring((0, 0.42, 0), rr(0.42) + 0.01, 0.05, seg=64, rseg=8)
p.layer('dots', base=DOT, target_faces=1400, voxel=0.01)
for i in range(14):
    a = i / 14 * math.tau
    y = 0.66
    r = rr(y) + 0.005
    p.blob((r * math.sin(a), y, r * math.cos(a)), (0.08, 0.08, 0.025), rot=(0, math.degrees(a), 0), group='d%d' % i)
p.layer('skin')
p.bone('body', (0, 0, 0), (0, 0.95, 0))
p.extras['outline'] = 0.03
p.build()
