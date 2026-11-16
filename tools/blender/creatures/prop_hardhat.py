"""A chunky yellow builder's hard hat (Brick letters: the bear builder wears it). Soft vinyl-toy shapes: a round dome
(radius ~0.5) with a raised ridge from front to back, a wide brim that sticks out more at the front (the peak), and
a little white sticker star on the front. Origin = the centre of the brim's underside, so it sits on a head top."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, star_poly

YEL, YEL_D, WHITE, ORANGE = 0xffc21a, 0xe8a40c, 0xffffff, 0xff8a2a
p = Prop('prop_hardhat', base=YEL, target_faces=2600, voxel=0.012)
# dome: a squashed ball, flat underneath
p.lathe([(0, 0.06), (0.5, 0.06), (0.52, 0.2), (0.47, 0.38), (0.33, 0.52), (0.0, 0.57)], seg=48)
# brim: a thin ring, longer at the front (peak) - built as an elliptical lathe offset forward
p.lathe([(0, 0.0), (0.64, 0.0), (0.66, 0.05), (0.62, 0.09), (0, 0.09)], pos=(0, 0, 0.08), scale=(1.0, 1.18), seg=56)
# the ridge over the top, front to back
p.tube([(0, 0.3, 0.46), (0, 0.5, 0.25), (0, 0.585, 0.0), (0, 0.5, -0.25), (0, 0.3, -0.46)], 0.07, rseg=10)
p.paint_fn(lambda q, n: n.y < -0.6, YEL_D)
# a white star sticker on the front of the dome
p.layer('sticker', base=WHITE, target_faces=400, voxel=0.006)
p.sticker(star_poly(0.13, inner=0.5), 0.26, lambda y: math.sqrt(max(0.02, 0.5 ** 2 - (y - 0.06) ** 2 * 0.9)) - 0.01, thick=0.03)
p.layer('skin')
p.bone('body', (0, 0, 0), (0, 0.5, 0))
p.extras['outline'] = 0.02
p.build()
