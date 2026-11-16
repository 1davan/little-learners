"""Grow a flower seeds, centred on the origin, standing upright (the game's physics treats them as balls).
  prop_farmseed  one big plump seed (L1, and the seed that sits in the soil): a chestnut-brown teardrop, 0.26 wide x
                 0.38 tall, with a pale cream stripe down its front and a tiny dimple tip
  prop_sunseed   a striped sunflower seed (L2): slim black-brown teardrop 0.16 x 0.32 with cream stripes
  prop_bean      a speckled bean (L3): a fat kidney bean 0.36 x 0.24 x 0.22, orange-brown with darker speckles
ONLY=prop_bean tools/blender/build.sh prop_seeds builds one."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

ONLY = [k for k in os.environ.get('ONLY', '').split(',') if k]


def seed():
    p = Prop('prop_farmseed', base=0x8a5530, target_faces=360, voxel=0.007, smooth=3)
    p.quadriflow = False
    p.lathe(rounded([(0, -0.19), (0.1, -0.16), (0.13, -0.04), (0.1, 0.09), (0.04, 0.18), (0, 0.2)], 0.05, n=4), seg=28, scale=(1, 0.8))
    p.paint_fn(lambda q, n: q.z > 0.02 and abs(q.x) < 0.028 and q.y > -0.15 and q.y < 0.15, 0xf2d6a0)
    p.paint_fn(lambda q, n: q.y > 0.15, 0x6b3f22)
    p.bone('body', (0, -0.2, 0), (0, 0.2, 0))
    p.extras['outline'] = 0.012
    p.build()


def sunseed():
    p = Prop('prop_sunseed', base=0x3a2a2a, target_faces=360, voxel=0.006, smooth=3)
    p.quadriflow = False
    p.lathe(rounded([(0, -0.16), (0.06, -0.13), (0.08, -0.02), (0.06, 0.09), (0.02, 0.16), (0, 0.17)], 0.04, n=4), seg=28, scale=(1, 0.6))
    p.paint_fn(lambda q, n: any(abs(q.x - x) < 0.012 for x in (-0.04, 0.0, 0.04)) and abs(q.y) < 0.14, 0xfff1d6)
    p.bone('body', (0, -0.17, 0), (0, 0.17, 0))
    p.extras['outline'] = 0.01
    p.build()


def bean():
    p = Prop('prop_bean', base=0xd9774a, target_faces=380, voxel=0.007, smooth=3)
    p.quadriflow = False
    p.blob((-0.07, 0.0, 0), (0.12, 0.12, 0.11), rot=(0, 0, 20))
    p.blob((0.07, 0.0, 0), (0.12, 0.12, 0.11), rot=(0, 0, -20))
    p.blob((0, -0.03, 0), (0.12, 0.09, 0.1))
    for (x, y, z) in [(-0.1, 0.05, 0.1), (0.06, 0.07, 0.1), (0.12, -0.03, 0.08), (-0.02, -0.05, 0.11), (-0.14, -0.04, 0.07), (0.02, 0.1, -0.08), (-0.1, 0.02, -0.1), (0.1, -0.02, -0.09)]:
        p.paint('sp', (x, y, z), (0.03, 0.03, 0.05), 0x8a3b2e)
    p.paint_fn(lambda q, n: q.y < -0.08 and abs(q.x) < 0.03, 0xfff0d8)
    p.bone('body', (0, -0.12, 0), (0, 0.12, 0))
    p.extras['outline'] = 0.011
    p.build()


for name, fn in [('prop_farmseed', seed), ('prop_sunseed', sunseed), ('prop_bean', bean)]:
    if not ONLY or name in ONLY:
        fn()
