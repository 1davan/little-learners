"""Friendly toy sun (scenery makeSun): a puffy cookie disc (radius 2.2, facing +z) with a sleepy-happy face, and a ring
of twelve soft rounded rays. Shown unlit in game (it glows), with the shader halo behind it. Layers:
  skin  the disc, white so makeSun's colour tints it
  rays  the rays, a warmer cream so the same tint makes them a deeper orange-yellow (spun slowly in game)
  face  closed happy eyes and a smile (warm brown) with pink cheeks, never tinted"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

R, FRONT, BACK = 2.2, 0.5, -0.35
INK, CHEEK = 0x6e3a24, 0xff9a7a
p = Prop('prop_scene_sun', base=0xffffff, target_faces=1400, voxel=0.03, smooth=6)
prof = rounded([(0, BACK), (R, BACK), (R + 0.05, 0.05), (R * 0.85, FRONT * 0.92), (0, FRONT)], 0.32, n=6)
p.lathe(prof, rot=(90, 0, 0), seg=56)


def zf(x, y):
    """front surface depth of the disc at (x, y)"""
    r = math.hypot(x, y) / R
    return FRONT - (FRONT - FRONT * 0.92) * r * r / 0.72 if r < 0.85 else FRONT * 0.92 - (r - 0.85) * 1.5


p.layer('rays', base=0xffd9a6, target_faces=1400, voxel=0.024)
for k in range(12):
    a = k / 12 * math.tau + math.pi / 12
    rz = math.degrees(a) - 90
    for rr, w, l in ((2.35, 0.44, 0.38), (2.72, 0.3, 0.3), (3.0, 0.17, 0.17)):
        p.blob((rr * math.cos(a), rr * math.sin(a), -0.05), (w, l, 0.2), rot=(0, 0, rz), group='r%d' % k)

p.layer('face', base=INK, target_faces=900, voxel=0.014)


def arc(cx, cy, r, a0, a1, n=12):
    pts = []
    for i in range(n + 1):
        a = math.radians(a0 + (a1 - a0) * i / n)
        x, y = cx + r * math.cos(a), cy + r * math.sin(a)
        pts.append((x, y, zf(x, y) + 0.02))
    return pts


for s in (-1, 1):
    p.tube(arc(s * 0.72, 0.2, 0.3, 25, 155), 0.1, rseg=8)          # happy closed eyes
p.tube(arc(0, 0.05, 0.72, 205, 335, n=16), 0.11, rseg=8)            # smile
for s in (-1, 1):
    x, y = s * 1.32, -0.42
    p.cyl((x, y, zf(x, y) - 0.06), 0.34, 0.1, rot=(90, 0, 0), bevel=0.04, seg=24)
p.paint_fn(lambda q, n: abs(abs(q.x) - 1.32) < 0.42 and abs(q.y + 0.42) < 0.42, CHEEK)
p.layer('skin')

p.bone('body', (0, -R, 0), (0, R, 0))
p.extras['outline'] = 0.03
p.build()
