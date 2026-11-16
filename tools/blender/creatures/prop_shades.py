"""Sunglasses (Bear's nose 'eyes' gear). Lens centres at x +-0.5 (the game scales by the eye span), facing +z, centred.
Two round dark lenses with a white shine, a chunky frame (tintable, argMode 'tint', red by default), a bridge and two
short arms going back."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop

R = 0.33
p = Prop('prop_shades', base=0xffffff, target_faces=900, voxel=0.012, smooth=3)
p.quadriflow = False
for s in (-1, 1):
    p.ring((s * 0.5, 0, 0), R, 0.065, rot=(90, 0, 0), seg=36, rseg=10)
    p.tube([(s * (0.5 + R), 0.05, 0), (s * (0.5 + R + 0.05), 0.06, -0.1), (s * (0.5 + R + 0.06), 0.05, -0.45)], 0.04, rseg=8)
p.tube([(-0.5 + R - 0.02, 0.06, 0.0), (-0.1, 0.13, 0.03), (0.1, 0.13, 0.03), (0.5 - R + 0.02, 0.06, 0.0)], 0.045, rseg=8)
p.layer('lens', base=0x2a2440, target_faces=400, voxel=0.01)
p.quadriflow = False
for s in (-1, 1):
    p.cyl((s * 0.5, 0, -0.03), R - 0.01, 0.06, rot=(90, 0, 0), bevel=0.02, seg=32)
p.layer('shine', base=0xffffff, target_faces=120, voxel=0.006)
for s in (-1, 1):
    p.blob((s * 0.5 - 0.12, 0.12, 0.04), (0.07, 0.05, 0.015), rot=(0, 0, 35), group='h%d' % s)
p.layer('skin')
p.bone('root', (0, -0.3, 0), (0, 0.3, 0))
p.extras['argMode'] = 'tint'
p.extras['argDefault'] = 0xff5a5a
p.extras['outline'] = 0.014
p.build()
