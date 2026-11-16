"""Circus podium (Pattern parade, level 3). Origin on the sand; things stand on its top at y 2.25. A drum that narrows
a little toward the top, tintable (argMode 'tint') with white bunting points round its shoulder, a white band at the
foot, a star on the front, and a fat golden top with a rim of cream light bulbs."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded, star_poly, TAU

H = 2.13
R0, R1 = 0.52, 0.4
p = Prop('prop_podium', base=0xffffff, target_faces=1800, voxel=0.02, smooth=3)
p.lathe(rounded([(0, 0), (R0, 0), (R1, H - 0.02), (0, H - 0.02)], 0.06, n=3), seg=40)
rad = lambda y: R0 + (R1 - R0) * y / H
p.layer('trim', base=0xffffff, target_faces=1100, voxel=0.014)
p.lathe(rounded([(0, 0.0), (R0 + 0.04, 0.0), (R0 + 0.035, 0.2), (0, 0.2)], 0.04, n=3), seg=40)    # foot band
for i in range(10):                                   # bunting: white triangles hanging from the shoulder
    a = i / 10 * TAU
    pts = [(-0.17, 0), (0.17, 0), (0, -0.3)]
    p.sticker([(x, y) for x, y in pts], H - 0.12, rad, thick=0.04, ang=a, lift=0.01)
p.layer('star', base=0xffd23f, target_faces=300, voxel=0.012)
p.sticker(star_poly(0.24, inner=0.48), H * 0.45, rad, thick=0.05, lift=0.012)
p.layer('top', base=0xffc23f, target_faces=700, voxel=0.016)
p.lathe(rounded([(0, H - 0.04), (0.62, H - 0.04), (0.66, H + 0.06), (0.6, H + 0.12), (0, H + 0.12)], 0.04, n=3), seg=40)
p.layer('bulbs', base=0xfff6c0, target_faces=400, voxel=0.01)
for i in range(10):
    a = i / 10 * TAU + 0.31
    p.blob((0.66 * math.sin(a), H + 0.04, 0.66 * math.cos(a)), (0.055, 0.055, 0.055), group='b%d' % i)
p.layer('skin')
p.bone('root', (0, 0, 0), (0, H, 0))
p.extras['argMode'] = 'tint'
p.extras['argDefault'] = 0xff5a5a
p.extras['outline'] = 0.024
p.build()
