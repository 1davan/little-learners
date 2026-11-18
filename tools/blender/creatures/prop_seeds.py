"""Grow a flower seeds, centred on the origin, standing upright (the game's physics treats them as balls).
  prop_farmseed  one big plump seed (L1, and the seed that sits in the soil): a chestnut-brown teardrop, 0.26 wide x
                 0.38 tall, with a pale cream stripe down its front and a tiny dimple tip
  prop_sunseed   a striped sunflower seed (L2): slim black-brown teardrop 0.16 x 0.32 with cream stripes
  prop_bean      a speckled bean (L3): a fat kidney bean 0.38 x 0.24 x 0.22 (C-curve, dented belly with a pale hilum),\n                 orange-brown with small round darker speckles and a soft highlight
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
    p = Prop('prop_sunseed', base=0x3a2a2a, target_faces=900, voxel=0.005, smooth=3)
    p.quadriflow = False
    p.lathe(rounded([(0, -0.16), (0.06, -0.13), (0.08, -0.02), (0.06, 0.09), (0.02, 0.16), (0, 0.17)], 0.04, n=4), seg=40, scale=(1, 0.6))

    def stripe(q, n):
        # smooth tapered cream stripes running tip to tail (by angle round the seed, so they stay evenly spaced)
        phi = math.atan2(q.x, q.z / 0.6)
        w = 0.17 * max(0.0, 1 - (q.y / 0.15) ** 2) ** 0.7
        return any(abs(((phi - c + math.pi) % math.tau) - math.pi) < w for c in (-0.62, 0.0, 0.62, math.pi - 0.62, math.pi, math.pi + 0.62))
    p.paint_fn(stripe, 0xfff1d6)
    p.bone('body', (0, -0.17, 0), (0, 0.17, 0))
    p.extras['outline'] = 0.01
    p.build()


def bean():
    p = Prop('prop_bean', base=0xd9774a, target_faces=3400, voxel=0.004, smooth=4)
    p.quadriflow = False
    # a fat kidney bean: a soft C-curve of blobs (convex back up, the dented belly down) with a pale hilum in the dent
    arc = [(-0.12, -0.035, 0), (-0.07, 0.025, 0), (0.0, 0.045, 0), (0.07, 0.025, 0), (0.12, -0.035, 0)]
    p.curve(arc, [0.085, 0.105, 0.11, 0.105, 0.085], group='bean', flat=0.92, per=5)
    p.blob((0, -0.105, 0), (0.05, 0.035, 0.05), group='bean', negative=True)          # the dent in the belly
    p.paint_fn(lambda q, n: abs(q.x) < 0.035 and q.y < -0.035 and n.y < -0.3, 0xfff0d8)  # hilum
    from mathutils import Vector
    SPK = [Vector(v) for v in [(-0.1, 0.03, 1), (0.05, 0.09, 1), (0.12, -0.0, 1), (-0.03, 0.0, 1), (-0.15, -0.04, 1),
                               (0.02, 0.1, -1), (-0.09, 0.05, -1), (0.1, 0.02, -1), (0.08, 0.07, 1), (-0.06, 0.1, 1)]]
    # small round speckles: by (x, y) on the front / back face (z sign), so they always land on the surface
    p.paint_fn(lambda q, n: any(math.hypot(q.x - v.x, q.y - v.y) < 0.02 and q.z * v.z > 0.03 for v in SPK), 0x9a4630)
    p.paint_fn(lambda q, n: (q.x + 0.05) ** 2 / 0.0025 + (q.y - 0.1) ** 2 / 0.0006 < 1 and q.z > 0.03, 0xf6b08a)   # highlight
    p.bone('body', (0, -0.12, 0), (0, 0.12, 0))
    p.extras['outline'] = 0.008
    p.build()


for name, fn in [('prop_farmseed', seed), ('prop_sunseed', sunseed), ('prop_bean', bean)]:
    if not ONLY or name in ONLY:
        fn()
