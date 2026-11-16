"""Bath sponge (Splash wash). Origin under the middle: a squashy rounded block 1.1 wide, 0.55 tall, 0.75 deep, with a
scrubby top layer (y 0.55-0.73) on layer 'scrub'. Both are painted near-white so the game colours them: the body by
tint (argMode 'tint', default yellow) and the scrub by recolouring its layer (green). Pores are a paler shade."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop

p = Prop('prop_sponge', base=0xffffff, target_faces=1200, voxel=0.014, smooth=3)
p.box((0, 0.28, 0), (0.55, 0.28, 0.375), bevel=0.12)
p.blob((0.0, 0.3, 0.0), (0.45, 0.24, 0.3), group='puff')
import random
random.seed(7)
pores = [(random.uniform(-0.47, 0.47), random.uniform(0.08, 0.48), r) for r in [0.035, 0.05, 0.03, 0.045, 0.06, 0.035, 0.04, 0.05, 0.03, 0.045, 0.055, 0.035]]
def pore(q, n):
    if abs(n.z) > 0.6:
        return any(math.hypot(q.x - x, q.y - y) < r for x, y, r in pores)
    if abs(n.x) > 0.6:
        return any(math.hypot(q.z - x * 0.7, q.y - y) < r for x, y, r in pores[:6])
    return False
p.paint_fn(pore, 0xd2c8a8)
p.layer('scrub', base=0xffffff, target_faces=700, voxel=0.012)
p.box((0, 0.64, 0), (0.55, 0.09, 0.375), bevel=0.06)
p.paint_fn(lambda q, n: (n.y > 0.6 and math.sin(q.x * 40) > 0.4) or (n.y < 0.6 and q.y > 0.66 and math.sin(q.x * 40 + q.z * 40) > 0.6), 0xcfcfcf)
p.layer('skin')
p.bone('root', (0, 0, 0), (0, 0.7, 0))
p.extras['argMode'] = 'tint'
p.extras['argDefault'] = 0xffd23f
p.extras['outline'] = 0.02
p.build()
