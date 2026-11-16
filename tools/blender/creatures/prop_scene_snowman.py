"""Friendly toy snowman (scenery makeSnowman, meadow winter), about 3.35 tall standing on y = 0: three soft snowballs
(rosy cheeks), coal eyes with a twinkle, a coal smile and buttons, a carrot nose, a red
striped scarf with a hanging tail, twig arms with little forked hands, and a plum top hat with a red band. Layers:
  skin  the snow
  bits  everything else (coal, carrot, scarf, hat, twigs), painted per part"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

SNOW, SNOW_D, CHEEK = 0xffffff, 0xdfe8f6, 0xffbccb
COAL, SHINE, CARROT, RED, CREAM, HAT, TWIG = 0x3a3346, 0xffffff, 0xff8a1f, 0xff5a5a, 0xfff1d6, 0x46406a, 0x8a5a3b
BALLS = [((0, 0.7, 0), 0.78, 0.9), ((0, 1.72, 0), 0.56, 0.95), ((0, 2.52, 0), 0.44, 1.0)]   # centre, radius, y squash
p = Prop('prop_scene_snowman', base=SNOW, target_faces=950, voxel=0.018, smooth=5)
for i, (c, r, sq) in enumerate(BALLS):
    p.blob(c, (r, r * sq, r), group='b%d' % i)
HEAD, HR = BALLS[2][0], BALLS[2][1]
p.paint_fn(lambda q, n: q.z > 0.2 and ((abs(q.x) - 0.25) / 0.078) ** 2 + ((q.y - 2.44) / 0.064) ** 2 < 1, CHEEK)


def on_head(x, y, lift=0.0):
    z = math.sqrt(max(0.01, HR * HR - x * x - (y - HEAD[1]) ** 2))
    return (x, y, z + lift)


def on_mid(x, y, lift=0.0):
    c, r = BALLS[1][0], BALLS[1][1]
    z = math.sqrt(max(0.01, r * r - x * x - ((y - c[1]) / 0.95) ** 2))
    return (x, y, z + lift)


p.layer('bits', base=COAL, target_faces=1350, voxel=0.011)
# coal eyes (with a painted twinkle), smile and buttons
for s in (-1, 1):
    p.blob(on_head(s * 0.15, 2.62, -0.01), (0.055, 0.07, 0.04), group='eye%d' % s)
for k in range(5):
    a = math.radians(205 + 130 * k / 4)
    p.blob(on_head(0.17 * math.cos(a), 2.47 + 0.15 * math.sin(a), -0.005), (0.03, 0.03, 0.025), group='m%d' % k)
for k, y in enumerate((1.98, 1.75, 1.52)):
    p.blob(on_mid(0, y, -0.01), (0.06, 0.06, 0.04), group='btn%d' % k)
# carrot nose, drooping a touch
p.capsule(on_head(0, 2.52, -0.06), (0.0, 2.47, 0.82), 0.07, r2=0.018, group='nose')
# scarf: a soft ring round the neck and a tail hanging down the front
p.ring((0, 2.14, 0), 0.4, 0.1, scale=(1.0, 1.0), seg=40, rseg=10)
p.curve([(0.18, 2.1, 0.36), (0.26, 1.9, 0.5), (0.3, 1.66, 0.52)], [0.09, 0.085, 0.08], flat=0.45, group='tail')
# twig arms with forked hands
for s in (-1, 1):
    a, b = (s * 0.5, 1.86, 0.0), (s * 1.15, 2.28, 0.05)
    p.capsule(a, b, 0.036, r2=0.03, group='arm%d' % s)
    p.capsule(b, (s * 1.33, 2.45, 0.08), 0.028, r2=0.022, group='arm%d' % s)
    p.capsule(b, (s * 1.36, 2.24, 0.06), 0.026, r2=0.02, group='arm%d' % s)
    p.capsule((s * 0.88, 2.08, 0.02), (s * 0.98, 2.3, 0.05), 0.022, r2=0.018, group='arm%d' % s)
# top hat, tipped a little
HAT_ROT = (0, 0, -9)
p.cyl((0.0, 2.84, 0), 0.42, 0.07, rot=HAT_ROT, bevel=0.03, seg=32)
p.cyl((0.0, 2.88, 0), 0.28, 0.48, r2=0.3, rot=HAT_ROT, bevel=0.05, seg=32)

# ---- paint the parts ----
p.paint_fn(lambda q, n: abs(q.x) > 0.52 and q.y > 1.8 and q.y < 2.5, TWIG)
p.paint_fn(lambda q, n: (abs(q.y - 2.14) < 0.13 and 0.27 < math.hypot(q.x, q.z) < 0.56 and not (abs(q.x) < 0.09 and q.y < 2.05)) or (q.y < 2.12 and q.x > 0.1 and q.z > 0.3 and q.y > 1.5), RED)
p.paint_fn(lambda q, n: q.y < 1.95 and q.x > 0.1 and q.z > 0.3 and (abs(q.y - 1.82) < 0.035 or abs(q.y - 1.72) < 0.035), CREAM)
p.paint_fn(lambda q, n: q.z > HR - 0.02 and abs(q.y - 2.5) < 0.1 and abs(q.x) < 0.1, CARROT)
p.paint_fn(lambda q, n: q.y > 2.76 - 0.16 * q.x, HAT)
p.paint_fn(lambda q, n: 2.95 - 0.16 * q.x < q.y < 3.06 - 0.16 * q.x and math.hypot(q.x, q.z) < 0.35, RED)
for s in (-1, 1):   # a twinkle in each eye
    ex, ey, ez = on_head(s * 0.15, 2.62, -0.01)
    p.paint_fn(lambda q, n, ex=ex, ey=ey, ez=ez: (q.x - ex - 0.018) ** 2 + (q.y - ey - 0.025) ** 2 < 0.02 ** 2 and q.z > ez, SHINE)
p.layer('skin')

p.bone('body', (0, 0, 0), (0, 3.3, 0))
p.extras['outline'] = 0.024
p.build()
