"""Brick letters picture: I is for Ice cream. A crunchy waffle cone (criss-cross lines) holding a pink strawberry scoop
with a drippy rim and a creamy vanilla scoop on top, rainbow sprinkles and a red cherry. About 1.3 wide, 2.7 tall.
Origin = the cone tip."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

CONE, CONE_D, PINK, PINK_L, VAN, VAN_D, CHERRY = 0xe8a95a, 0xc4823a, 0xff8fc0, 0xffb6d6, 0xfff1d0, 0xf1dcae, 0xe8273a
p = Prop('prop_word_icecream', base=CONE, target_faces=3600, voxel=0.013)
p.lathe(rounded([(0, 0.0), (0.12, 0.12), (0.55, 1.25), (0.6, 1.36), (0, 1.36)], 0.06, n=3), seg=48)
def waffle(q, n):
    if q.y > 1.22 or n.y > 0.6:
        return False
    a = math.atan2(q.x, q.z)
    u, v = a * 1.6 + q.y * 3.2, a * 1.6 - q.y * 3.2
    return (u % 0.9) < 0.12 or (v % 0.9) < 0.12
p.paint_fn(waffle, CONE_D)
# pink scoop with a drippy rim, then vanilla on top
p.layer('pink', base=PINK, target_faces=1800, voxel=0.013)
p.blob((0, 1.66, 0), (0.66, 0.5, 0.62), group='s')
for k in range(9):
    a = k / 9 * math.tau
    p.blob((math.sin(a) * 0.58, 1.34 - (0.08 if k % 3 == 0 else 0.0), math.cos(a) * 0.55), (0.16, 0.18 if k % 3 == 0 else 0.12, 0.14), group='s')
p.paint('pl', (-0.25, 1.9, 0.4), (0.22, 0.14, 0.2), PINK_L)
p.layer('vanilla', base=VAN, target_faces=1600, voxel=0.013)
p.blob((0, 2.2, 0), (0.55, 0.45, 0.52), group='v')
for k in range(7):
    a = k / 7 * math.tau + 0.3
    p.blob((math.sin(a) * 0.46, 1.93, math.cos(a) * 0.44), (0.15, 0.12, 0.13), group='v')
p.paint_fn(lambda q, n: n.y < -0.4, VAN_D)
# sprinkles and the cherry
p.layer('sprinkles', base=0xffffff, target_faces=900, voxel=0.007)
SPR = [0xff4f4f, 0x3f8cff, 0xffd23a, 0x4cc75a, 0x9b6dff, 0xff9a2e]
pts = [(-0.25, 2.48, 0.32), (0.18, 2.52, 0.33), (0.32, 2.32, 0.38), (-0.36, 2.25, 0.38), (0.02, 2.36, 0.48), (-0.08, 2.58, 0.2), (0.4, 2.12, 0.28), (-0.42, 2.06, 0.25)]
for k, c in enumerate(pts):
    p.capsule((c[0] - 0.04, c[1], c[2]), (c[0] + 0.04, c[1] + 0.03, c[2]), 0.025, group='sp%d' % k)
for k, c in enumerate(pts):
    p.paint('spc%d' % k, c, (0.09, 0.09, 0.09), SPR[k % len(SPR)])
p.layer('cherry', base=CHERRY, target_faces=600, voxel=0.009)
p.blob((0.05, 2.74, 0.02), (0.17, 0.16, 0.17), group='c')
p.paint('ch', (-0.02, 2.8, 0.14), (0.05, 0.04, 0.04), 0xff9aa6)
p.layer('cstem', base=0x5a8a2a, target_faces=200, voxel=0.008)
p.tube([(0.05, 2.86, 0.02), (0.08, 3.0, 0.0), (0.16, 3.1, -0.02)], 0.022, rseg=6)
p.layer('skin')
p.bone('body', (0, 0, 0), (0, 2.7, 0))
p.extras['outline'] = 0.022
p.build()
