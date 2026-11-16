"""Brick letters picture: B is for Ball. A big bouncy beach ball (diameter 2.0): six puffy gores - red, yellow, blue,
green, orange, purple - each its own soft piece with an ink seam, meeting at white button caps on both poles. The
pole axis is tipped toward the camera so the stripes swirl. Origin = bottom centre."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop

R = 1.0
COLS = [0xff4f4f, 0xffd23a, 0x3f8cff, 0x4cc75a, 0xff9a2e, 0x9b6dff]
TILT = (34, 0, -22)
p = Prop('prop_word_ball', base=COLS[0], target_faces=1300, voxel=0.013)
prof = [(R * math.sin(math.pi * i / 24), -R * math.cos(math.pi * i / 24)) for i in range(25)]
for k, col in enumerate(COLS):
    if k:
        p.layer('gore%d' % k, base=col, target_faces=1300, voxel=0.013)
    a0 = k / 6 * math.tau + 0.012
    p.lathe(prof, pos=(0, R, 0), rot=TILT, a0=a0, a1=a0 + math.tau / 6 - 0.024, seg=16)
p.layer('caps', base=0xffffff, target_faces=500, voxel=0.01)
import mathutils
M = mathutils.Euler([math.radians(a) for a in TILT]).to_matrix()
for s in (-1, 1):
    v = M @ mathutils.Vector((0, s * (R - 0.02), 0))
    p.blob((v.x, R + v.y, v.z), (0.2, 0.08, 0.2), rot=TILT, group='cap%d' % s)
p.layer('skin')
p.bone('body', (0, 0, 0), (0, 2.0, 0))
p.extras['outline'] = 0.022
p.build()
