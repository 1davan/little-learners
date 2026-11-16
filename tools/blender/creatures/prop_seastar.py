"""Chunky starfish with a little face for the beach games (pattern pieces, loose bits, toys; beach.js makeSeaStar).
Stands upright facing +z, arm tips on a circle of radius 1.0, centred on the origin, puffy (about 0.6 deep in the
middle). Tintable (argMode 'tint'): the body is white; cream bumps run down each arm; shiny eyes, a smile and pink
cheeks. Root bone 'root' (no idle sway). (prop_starfish is the scenery's starfish.)"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop

p = Prop('prop_seastar', base=0xffffff, target_faces=620, voxel=0.016, smooth=4)
p.blob((0, 0, 0), (0.48, 0.48, 0.24), group='star')
for k in range(5):
    a = math.radians(90 + 72 * k)
    for i in range(7):
        t = i / 6
        r = 0.08 + 0.78 * t
        w = 0.31 - 0.15 * t
        p.blob((r * math.cos(a), r * math.sin(a), 0.03 * t), (w, w, w * (0.72 - 0.15 * t)), rot=(0, 0, math.degrees(a)), group='star')
p.paint_fn(lambda q, n: n.z < -0.55, 0xe6e6e6)          # a slightly paler back

# cream bumps along each arm (own layer: crisp and never tinted)
p.layer('dots', base=0xfff2d9, target_faces=260, voxel=0.01)
for k in range(5):
    a = math.radians(90 + 72 * k)
    for r, s in ((0.5, 0.07), (0.67, 0.058), (0.82, 0.045)):
        z = 0.25 - 0.22 * (r - 0.4)
        p.blob((r * math.cos(a), r * math.sin(a), z), (s, s, s * 0.6), group='d%d_%d' % (k, int(r * 100)))
# face: two shiny eyes and a smile
p.layer('ink', base=0x3a2838, target_faces=160, voxel=0.008)
for s in (-1, 1):
    p.blob((s * 0.13, 0.07, 0.295), (0.058, 0.075, 0.04), group='eye%d' % s)
p.tube([(-0.1, -0.07, 0.29), (-0.05, -0.115, 0.296), (0, -0.128, 0.298), (0.05, -0.115, 0.296), (0.1, -0.07, 0.29)], 0.019, rseg=6)
p.layer('shine', base=0xffffff, target_faces=60, voxel=0.006)
for s in (-1, 1):
    p.blob((s * 0.13 - 0.02, 0.1, 0.335), (0.021, 0.021, 0.012), group='hi%d' % s)
p.layer('cheek', base=0xff9eb5, target_faces=60, voxel=0.008)
for s in (-1, 1):
    p.blob((s * 0.25, -0.05, 0.27), (0.052, 0.034, 0.024), group='ck%d' % s)
p.layer('skin')
p.bone('root', (0, -0.5, 0), (0, 0.5, 0))
p.extras['argMode'] = 'tint'
p.extras['argDefault'] = 0xff9f3f
p.extras['outline'] = 0.016
p.build()
