"""Brick letters picture: B is for Ball. A big bouncy beach ball (diameter 2.0): six gores - red, yellow, blue,
green, orange, purple - meeting at white button caps on both poles. One smooth sphere with the gores painted on it
(crisp paint: the mesh is cut exactly along every gore border, so the seams are clean straight curves, never ragged).
The pole axis is tipped toward the camera so the stripes swirl. Origin = bottom centre."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
import mathutils
from skit import SProp

R = 1.0
COLS = [0xff4f4f, 0xffd23a, 0x3f8cff, 0x4cc75a, 0xff9a2e, 0x9b6dff]
TILT = (34, 0, -22)
M = mathutils.Euler([math.radians(a) for a in TILT]).to_matrix()
Mi = M.inverted()
p = SProp('prop_word_ball', hard=True, base=COLS[0], target_faces=4000)
N = 28
prof = [(R * math.sin(math.pi * i / N), -R * math.cos(math.pi * i / N)) for i in range(N + 1)]
prof[0] = (0, -R); prof[-1] = (0, R)
p.lathe(prof, pos=(0, R, 0), seg=48)


def local(q):
    return Mi @ mathutils.Vector((q.x, q.y - R, q.z))


for k, col in enumerate(COLS[1:], start=1):
    p.paint_fn(lambda q, n, k=k: int(((math.atan2(local(q).x, local(q).z) % math.tau) / (math.tau / 6))) == k, col)
# the white button caps round both poles
p.paint_fn(lambda q, n: abs(local(q).y) > R * 0.955, 0xffffff)
p.bone('body', (0, 0, 0), (0, 2.0, 0))
p.extras['outline'] = 0.022
p.build()
