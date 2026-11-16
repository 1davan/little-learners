"""Sandcastle (Where's Crab? 'on' prop). Round base tower (r 1.4, 1.25 tall) under a smaller top tower (to y 2.1) with
crenellations, an arched door, a side turret with a cone roof and a red flag, and shells pressed into the sand."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

SAND, SAND_D, SAND_L, DOOR, RED = 0xf2cf7e, 0xd9b062, 0xf8dc98, 0x8a5a32, 0xff5a5a
p = Prop('prop_castle', base=SAND, target_faces=4200, voxel=0.02)
p.lathe(rounded([(0, 0), (1.5, 0), (1.38, 1.25), (0, 1.25)], 0.08, n=3), seg=48)
p.lathe(rounded([(0, 1.2), (1.05, 1.2), (0.96, 2.08), (0, 2.08)], 0.06, n=3), seg=40)
for i in range(8):
    a = i / 8 * math.tau
    p.box((math.sin(a) * 1.3, 1.36, math.cos(a) * 1.3), (0.15, 0.13, 0.15), rot=(0, math.degrees(a), 0), bevel=0.06)
for i in range(6):
    a = i / 6 * math.tau + 0.3
    p.box((math.sin(a) * 0.9, 2.17, math.cos(a) * 0.9), (0.12, 0.11, 0.12), rot=(0, math.degrees(a), 0), bevel=0.05)
p.lathe(rounded([(0, 0), (0.48, 0), (0.42, 1.6), (0, 1.6)], 0.05, n=3), pos=(1.45, 0, -0.45), seg=28)
p.paint_fn(lambda q, n: any(abs(q.y - y) < 0.03 for y in (0.42, 0.84, 1.62)), SAND_D)      # bucket ridges
p.paint_fn(lambda q, n: q.y < 0.12, SAND_D)
p.layer('roof', base=0xffb347, target_faces=500, voxel=0.014)
p.lathe(rounded([(0, 1.58), (0.55, 1.58), (0, 2.25)], 0.04, n=2), pos=(1.45, 0, -0.45), seg=28)
p.layer('door', base=DOOR, target_faces=500, voxel=0.012)
p.sticker([(x, y) for x, y in [(-0.3, 0), (0.3, 0), (0.3, 0.35)] + [(0.3 * math.cos(math.radians(a)), 0.35 + 0.3 * math.sin(math.radians(a))) for a in range(15, 166, 15)] + [(-0.3, 0.35)]],
          0.02, lambda y: 1.5 - 0.12 * y / 1.25, thick=0.05, lift=0.0)
p.layer('flag', base=RED, target_faces=400, voxel=0.01)
p.tube([(1.45, 2.2, -0.45), (1.45, 2.85, -0.45)], 0.03, rseg=6)
p.mesh([(1.47, 2.85, -0.47), (1.47, 2.55, -0.47), (1.85, 2.7, -0.47), (1.47, 2.85, -0.43), (1.47, 2.55, -0.43), (1.85, 2.7, -0.43)],
       [(0, 1, 2), (3, 5, 4), (0, 3, 4, 1), (1, 4, 5, 2), (2, 5, 3, 0)])
p.layer('shells', base=0xffc1d6, target_faces=600, voxel=0.01)
cols = [0xffc1d6, 0xffffff, 0xd8b6ff, 0xffd9a8, 0xa8e0ff]
for i in range(5):
    a = i * 1.25 + 0.6
    y = 0.4 + (i % 2) * 0.4
    r = 1.5 - 0.12 * y / 1.25 + 0.01
    p.blob((r * math.sin(a), y, r * math.cos(a)), (0.1, 0.09, 0.05), rot=(0, math.degrees(a), 0), group='sh%d' % i)
    p.paint('c%d' % i, (r * math.sin(a), y, r * math.cos(a)), (0.15, 0.15, 0.15), cols[i])
p.layer('skin')
p.bone('body', (0, 0, 0), (0, 2.1, 0))
p.extras['outline'] = 0.026
p.build()
