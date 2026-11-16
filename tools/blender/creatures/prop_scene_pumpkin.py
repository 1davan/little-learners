"""Chunky toy pumpkin (scenery makePumpkin): a squat ribbed pumpkin about 1.2 wide and 0.75 tall standing on y = 0, with
eight deep soft lobes, a dimpled top, a curved stalk, a leaf and a curly tendril. Layers:
  skin  stalk, leaf and tendril (never tinted)
  body  the pumpkin, white: makePumpkin's colour tints it (argMode 'tint')"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, TAU

STALK, STALK_L, LEAF, LEAF_D, GROOVE, BASE = 0x6f8a32, 0xb9c77a, 0x62bb4c, 0x4a9a3c, 0xe2dcd4, 0xffffff
p = Prop('prop_scene_pumpkin', base=STALK, target_faces=320, voxel=0.008, smooth=4)
# stalk: curved and tapering, with a flared foot and a pale cut end
p.curve([(0, 0.62, 0), (0.0, 0.78, 0.0), (0.04, 0.9, 0.0), (0.1, 0.96, 0.0)], [0.075, 0.062, 0.055, 0.052], group='stalk')
p.blob((0, 0.68, 0), (0.12, 0.05, 0.12), group='stalk')
p.paint_fn(lambda q, n: q.x > 0.08 and q.y > 0.92 and n.x > 0.3, STALK_L)
# a leaf lying on the shoulder, and a curly tendril
p.blob((0.2, 0.74, 0.16), (0.17, 0.028, 0.11), rot=(8, -35, -22), group='leaf')
spiral = []
for i in range(40):
    t = i / 39
    a = t * TAU * 1.6
    rr = 0.07 * (1 - t * 0.6)
    spiral.append((-0.08 - t * 0.16 + rr * math.cos(a), 0.72 + 0.05 * t + rr * math.sin(a) * 0.6, 0.05 + rr * math.sin(a)))
p.tube(spiral, 0.016, rseg=6)
p.paint_fn(lambda q, n: q.y < 0.9 and math.hypot(q.x - 0.2, q.z - 0.16) < 0.2 and abs(q.y - 0.75) < 0.06, LEAF)
p.paint_fn(lambda q, n: math.hypot(q.x - 0.2, q.z - 0.16) < 0.17 and abs((q.x - 0.2) * 0.57 - (q.z - 0.16) * 0.82) < 0.012 and n.y > 0, LEAF_D)

# ---- the pumpkin ----
p.layer('body', base=BASE, target_faces=650, voxel=0.012)


# eight fat lobes, each its own clay shape so the grooves between them stay crisp, round a core that dimples the top
for k in range(8):
    a = k / 8 * TAU
    p.blob((0.38 * math.sin(a), 0.375, 0.38 * math.cos(a)), (0.17, 0.375, 0.23), rot=(0, math.degrees(a), 0), group='lobe%d' % k)
p.blob((0, 0.36, 0), (0.4, 0.3, 0.4), group='core')
p.layer('skin')

p.bone('body', (0, 0, 0), (0, 1.0, 0))
p.extras['argMode'] = 'tint'
p.extras['argDefault'] = 0xff8a1f
p.extras['outline'] = 0.02
p.build()
