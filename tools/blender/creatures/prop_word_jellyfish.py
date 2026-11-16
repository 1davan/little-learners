"""Brick letters picture: J is for Jellyfish. A round pink jellyfish: a soft dome bell (1.7 wide) with a scalloped
rim and pale spots, a sweet code face on the front, and six curly purple tentacles hanging below (about 2.4 tall
in all). Bones: body (tentacles) and head (the bell, so it can look at you). Origin = the tentacle tips' level."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

BELL, BELL_D, SPOT, TENT, TENT_L = 0xff8fcf, 0xe46fb4, 0xffd0ea, 0xb886ff, 0xd8bcff
p = Prop('prop_word_jellyfish', base=BELL, target_faces=3600, voxel=0.014)
Y0 = 1.05
p.lathe(rounded([(0, Y0 + 0.05), (0.62, Y0 - 0.02), (0.84, Y0 + 0.12), (0.8, Y0 + 0.55), (0.6, Y0 + 0.95), (0.3, Y0 + 1.15), (0, Y0 + 1.2)], 0.18, n=5), seg=56)
for k in range(12):
    a = k / 12 * math.tau
    p.blob((math.sin(a) * 0.8, Y0 + 0.02, math.cos(a) * 0.8), (0.17, 0.12, 0.17), group='rim')
p.paint_fn(lambda q, n: q.y < Y0 + 0.14, BELL_D)
for i, (x, y, z) in enumerate([(-0.45, Y0 + 0.85, 0.45), (0.5, Y0 + 0.8, 0.42), (0.05, Y0 + 1.12, 0.3), (-0.62, Y0 + 0.45, 0.3), (0.66, Y0 + 0.4, 0.3)]):
    p.paint('sp%d' % i, (x, y, z), (0.13, 0.11, 0.2), SPOT)
p.layer('tentacles', base=TENT, target_faces=2200, voxel=0.012)
for k in range(6):
    x0 = (k - 2.5) * 0.24
    z0 = 0.18 if k % 2 else -0.12
    pts = []
    for j in range(7):
        t = j / 6
        pts.append((x0 + math.sin(t * 6.0 + k) * 0.12 * (0.3 + t), Y0 + 0.05 - t * (Y0 - 0.05) * (0.85 + 0.15 * (k % 2)), z0 + math.cos(t * 5 + k) * 0.05))
    p.tube(pts, [0.075 - 0.04 * (j / 6) for j in range(7)], rseg=10)
p.paint_fn(lambda q, n: q.z > 0.0 and n.z > 0.5, TENT_L)
p.layer('skin')
p.bone('body', (0, 0.05, 0), (0, Y0, 0))
p.bone('head', (0, Y0, 0), (0, Y0 + 1.2, 0), parent='body', region=lambda q: q.y > Y0 - 0.12)
p.face(center=(0, Y0 + 0.55, 0.2), radius=0.6, faceScale=1.0)
p.extras['outline'] = 0.024
p.build()
