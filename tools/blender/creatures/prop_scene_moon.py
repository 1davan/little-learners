"""Sleepy smiling full moon (scenery makeMoon, beach night): a puffy cream cookie disc (radius 2.4, facing +z) with soft
craters, closed sleepy eyes, a little smile and pink cheeks. Shown unlit in game, with glows behind it. Layers:
  skin  the disc (cream, darker cream craters)
  face  eyes and smile (dusky plum) with pink cheeks"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

R, FRONT, BACK = 2.4, 0.5, -0.35
MOON, CRATER, INK, CHEEK = 0xfff4c4, 0xf0dc9c, 0x6a5a7a, 0xffb0c0
p = Prop('prop_scene_moon', base=MOON, target_faces=1800, voxel=0.03, smooth=6)
prof = rounded([(0, BACK), (R, BACK), (R + 0.05, 0.05), (R * 0.85, FRONT * 0.92), (0, FRONT)], 0.32, n=6)
p.lathe(prof, rot=(90, 0, 0), seg=56)
CRATERS = [(-1.25, 1.25, 0.36), (1.35, 1.05, 0.27), (0.45, 1.68, 0.2), (-1.7, -0.75, 0.22), (1.75, -0.2, 0.16), (0.7, -1.75, 0.24)]
for cx, cy, r in CRATERS:
    p.blob((cx, cy, FRONT * 0.95), (r, r, 0.08), negative=True, group='c')   # a shallow dent
p.paint_fn(lambda q, n: q.z > 0 and any(math.hypot(q.x - cx, q.y - cy) < r for cx, cy, r in CRATERS), CRATER)


def zf(x, y):
    r = math.hypot(x, y) / R
    return FRONT - (FRONT - FRONT * 0.92) * r * r / 0.72 if r < 0.85 else FRONT * 0.92 - (r - 0.85) * 1.5


def arc(cx, cy, r, a0, a1, n=12):
    pts = []
    for i in range(n + 1):
        a = math.radians(a0 + (a1 - a0) * i / n)
        x, y = cx + r * math.cos(a), cy + r * math.sin(a)
        pts.append((x, y, zf(x, y) + 0.02))
    return pts


p.layer('face', base=INK, target_faces=900, voxel=0.014)
for s in (-1, 1):
    p.tube(arc(s * 0.8, 0.45, 0.34, 200, 340), 0.1, rseg=8)       # sleepy closed eyes (smiling lids)
p.tube(arc(0, -0.15, 0.62, 210, 330, n=16), 0.1, rseg=8)          # smile
for s in (-1, 1):
    x, y = s * 1.38, -0.42
    p.cyl((x, y, zf(x, y) - 0.06), 0.36, 0.1, rot=(90, 0, 0), bevel=0.04, seg=24)
p.paint_fn(lambda q, n: abs(abs(q.x) - 1.38) < 0.45 and abs(q.y + 0.42) < 0.45, CHEEK)
p.layer('skin')

p.bone('body', (0, -R, 0), (0, R, 0))
p.extras['outline'] = 0.03
p.build()
