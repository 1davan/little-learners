"""Bread roll (Who says moo? duck treats). ~0.38 long x 0.24 tall x 0.27 deep, origin at the centre: a plump golden-brown
roll with a paler underside and two cream score marks across its top."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop

CRUST, CRUST_D, PALE, SCORE = 0xe8a85a, 0xc9863e, 0xf6d9a0, 0xfff0c8
p = Prop('prop_bread', base=CRUST, target_faces=480, voxel=0.01, smooth=3)
p.quadriflow = False
p.blob((0, 0.0, 0), (0.19, 0.12, 0.135))
p.blob((-0.07, 0.015, 0), (0.12, 0.11, 0.12))
p.blob((0.07, 0.015, 0), (0.12, 0.11, 0.12))
p.paint_fn(lambda q, n: q.y < -0.045, PALE)
p.paint_fn(lambda q, n: -0.045 <= q.y < -0.02, CRUST_D)
for x in (-0.065, 0.065):
    p.paint_fn(lambda q, n, x=x: q.y > 0.03 and abs((q.x - x) + 0.25 * q.z) < 0.022 and abs(q.z) < 0.1, SCORE)
p.bone('body', (0, -0.12, 0), (0, 0.12, 0))
p.extras['outline'] = 0.012
p.build()
