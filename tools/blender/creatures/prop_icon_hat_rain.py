"""Rainy level hat (home menu): a shiny yellow sou'wester. A domed crown with stitched seams, a wide soft brim that is
longer at the back and droops a little, and a button on top. Base at y 0, ~1.2 across the brim."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

YEL, YEL_D, YEL_L, SEAM = 0xffd23f, 0xe8b020, 0xffe98a, 0xe0a800
p = Prop('prop_icon_hat_rain', base=YEL, target_faces=2000, voxel=0.012)
p.lathe(rounded([(0, 0.02), (0.36, 0.02), (0.36, 0.14), (0.3, 0.32), (0.16, 0.4), (0, 0.42)], 0.12, n=5), seg=48)
brim = rounded([(0.2, 0.06), (0.34, 0.07), (0.6, -0.02), (0.62, -0.06), (0.58, -0.05), (0.34, 0.02), (0.2, 0.02)], 0.02, n=2)
p.lathe(brim, pos=(0, 0.02, -0.07), scale=(1.0, 1.15), seg=56, closed=True)
p.blob((0, 0.43, 0), (0.05, 0.03, 0.05), group='btn')
p.paint_fn(lambda q, n: n.y < -0.3, YEL_D)
p.paint('shine', (-0.14, 0.33, 0.2), (0.06, 0.05, 0.06), YEL_L)


def seam(q, n):
    if q.y < 0.1 or n.y < -0.1 or math.hypot(q.x, q.z) > 0.37:
        return False
    a = math.atan2(q.x, q.z)
    k = a / (math.tau / 6)
    return abs(k - round(k)) < 0.035
p.paint_fn(seam, SEAM)
p.layer('skin')
p.bone('body', (0, 0, 0), (0, 0.5, 0))
p.extras['outline'] = 0.02
p.build()
