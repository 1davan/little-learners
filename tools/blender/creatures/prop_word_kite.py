"""Brick letters picture: K is for Kite. A classic diamond kite in four bright panels (red and yellow), crossed wooden
spars, and a wiggly tail string with three little bows. The kite face is in the xy plane facing the camera; about
1.6 wide, 2.0 tall for the diamond and ~1.2 more for the tail. Origin = the tail's lowest point."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

RED, YEL, BLUE, GREEN, WOOD, STR = 0xff4f4f, 0xffd23a, 0x3f8cff, 0x4cc75a, 0xc98a4b, 0xf6f0e6
p = Prop('prop_word_kite', base=RED, target_faces=3000, voxel=0.013)
CY = 2.45   # where the spars cross
top, left, right, bot = (0, CY + 0.72), (-0.8, CY), (0.8, CY), (0, CY - 1.32)
poly = rounded([top, right, bot, left], 0.12, n=3, closed=True)
th = 0.06
verts = [(x, y, -th) for x, y, _ in [(a, b, 0) for a, b, *_ in poly]] + [(x, y, th) for x, y, _ in [(a, b, 0) for a, b, *_ in poly]]
n = len(poly)
faces = [tuple(range(n - 1, -1, -1)), tuple(range(n, 2 * n))] + [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)]
p.mesh(verts, faces)
p.paint_fn(lambda q, n: (q.x < 0) == (q.y > CY), YEL)
p.layer('spars', base=WOOD, target_faces=600, voxel=0.01)
p.tube([(0, CY + 0.66, 0.09), (0, CY - 1.24, 0.09)], 0.04, rseg=8)
p.tube([(-0.74, CY, 0.09), (0.74, CY, 0.09)], 0.04, rseg=8)
p.blob((0, CY, 0.12), (0.08, 0.08, 0.05), group='knot')
p.layer('tail', base=STR, target_faces=900, voxel=0.01)
tail = [(0, CY - 1.3, 0.02), (0.2, CY - 1.55, 0.02), (0.05, CY - 1.85, 0.02), (-0.25, CY - 2.05, 0.02), (-0.15, CY - 2.32, 0.02), (0.12, CY - 2.45, 0.02)]
p.tube(tail, 0.025, rseg=6)
p.layer('bows', base=BLUE, target_faces=900, voxel=0.01)
for i, (x, y) in enumerate([tail[1][:2], tail[3][:2], tail[5][:2]]):
    for s in (-1, 1):
        p.blob((x + s * 0.13, y, 0.03), (0.14, 0.08, 0.04), rot=(0, 0, s * 20), group='b%d%d' % (i, s))
    p.blob((x, y, 0.05), (0.05, 0.05, 0.04), group='bk%d' % i)
for i, (x, y) in enumerate([tail[1][:2], tail[3][:2], tail[5][:2]]):
    p.paint('bc%d' % i, (x, y, 0), (0.32, 0.12, 0.2), [BLUE, GREEN, RED][i])
p.layer('skin')
p.bone('body', (0, 0, 0), (0, CY + 0.7, 0))
p.extras['outline'] = 0.022
p.build()
