"""A heap of autumn leaves (meadow autumn): a soft low mound (about 2.4 wide, 0.9 deep, 0.55 tall, on y = 0) covered in
overlapping leaf shapes in orange, red, gold and rust, each leaf its own clay shape so the edges read."""
import sys, os, math, random
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop
from mathutils import Vector

COLS = [0xff8a1f, 0xe8503a, 0xffc23a, 0xd9662a, 0xf0a030]
p = Prop('prop_scene_leafpile', base=0xd9662a, target_faces=900, voxel=0.014, smooth=3)
p.blob((0, 0.0, 0), (1.05, 0.42, 0.72), group='mound')
random.seed(4)
leaves = []
for i in range(34):
    a = random.uniform(0, math.tau)
    rr = math.sqrt(random.uniform(0, 1))
    x, z = math.cos(a) * rr * 1.0, math.sin(a) * rr * 0.68
    y = 0.42 * math.sqrt(max(0, 1 - (x / 1.05) ** 2 - (z / 0.72) ** 2)) + 0.02
    nrm = Vector((x / 1.05 ** 2, y / 0.42 ** 2, z / 0.72 ** 2)).normalized()
    tilt_x = math.degrees(math.atan2(nrm.z, nrm.y))
    tilt_z = -math.degrees(math.atan2(nrm.x, nrm.y))
    yaw = random.uniform(0, 360)
    p.blob((x, y, z), (0.2, 0.035, 0.12), rot=(tilt_x, yaw, tilt_z), group='lf%d' % i)
    leaves.append((Vector((x, y, z)), COLS[i % len(COLS)]))


def leaf_col(c):
    def f(q, n):
        best = min(leaves, key=lambda L: (q - L[0]).length)
        return best[1] == c
    return f


for c in COLS:
    p.paint_fn(leaf_col(c), c)
p.bone('body', (0, 0, 0), (0, 0.6, 0))
p.extras['outline'] = 0.02
p.build()
