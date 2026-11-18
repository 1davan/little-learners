"""Dressing table (dress-up dressing room). Origin = floor under the mirror's centre, against the wall (z = 0 is the
wall). A white table (top at y 2.15) on curvy legs with a drawer, a tall white mirror frame (glass 3.0 x 3.4 left open:
the room draws its own glass), round bulbs round the frame (layer 'bulbs', unlit), a pink cushioned stool with a gold
leg (layer 'stool', standing at (0.3, 0, 1.6)) and three little perfume bottles (layer 'bits')."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from skit import SProp, dome_profile

p = SProp('prop_vanity', base=0xffffff)
MY, MHW, MHH = 4.3, 1.5, 1.7
for (x, y, w, h) in ((0, MY + MHH + 0.15, MHW + 0.3, 0.15), (0, MY - MHH - 0.15, MHW + 0.3, 0.15), (-MHW - 0.15, MY, 0.15, MHH + 0.3), (MHW + 0.15, MY, 0.15, MHH + 0.3)):
    p.box((x, y, 0.15), (w, h, 0.13), bevel=0.06)
p.box((0, 2.0, 0.85), (2.2, 0.15, 0.8), bevel=0.07)
p.box((0, 1.62, 0.95), (1.9, 0.24, 0.62), bevel=0.06)
for s in (-1, 1):
    for z in (0.42, 1.5):
        p.lathe([(0, 0), (0.12, 0), (0.16, 0.15), (0.11, 0.55), (0.15, 0.8), (0.12, 1.15), (0.18, 1.38), (0, 1.42)], pos=(s * 1.9, 0, z), seg=20)
p.box((0, 1.62, 1.55), (1.2, 0.17, 0.04), bevel=0.03)                  # the drawer front
p.lathe([(0, 0), (0.1, 0), (0.1, 0.04), (0.06, 0.1), (0, 0.12)], pos=(0, 1.62, 1.57), rot=(90, 0, 0), seg=16)   # its knob
p.paint_fn(lambda q, n: q.z > 1.6 and math.hypot(q.x, q.y - 1.62) < 0.11, 0xffc531)
p.paint_fn(lambda q, n: n.y < -0.6 and q.y < 1.9, 0xe6e2ee)
p.layer('bulbs', base=0xfff4c4)
for i in range(14):
    side = -1 if i < 4 else 1 if i < 8 else 0
    k = (i % 4) / 3
    x, y = (side * (MHW + 0.15), MY - MHH + 0.2 + k * (2 * MHH - 0.4)) if side else (-MHW + 0.25 + (i - 8) * (2 * MHW - 0.5) / 5, MY + MHH + 0.15)
    p.lathe(dome_profile(0.15, 0.15, n=5), pos=(x, y, 0.28), rot=(90, 0, 0), seg=18)
p.layer('stool', base=0xff8fc0)
p.lathe([(0, 0), (0.55, 0)] + dome_profile(0.55, 0.3, n=5, base=0.05)[1:], pos=(0.3, 0.98, 1.6), seg=32)
p.lathe([(0, 0), (0.45, 0), (0.45, 0.05), (0.12, 0.12), (0.08, 0.98), (0, 0.98)], pos=(0.3, 0, 1.6), seg=24)
p.paint_fn(lambda q, n: q.y < 1.0, 0xffc531)
p.layer('bits', base=0xff8fc0)
for (dx, c, h) in ((-1.4, 0xff8fc0, 0.42), (-0.95, 0xb197fc, 0.34), (1.45, 0x74c0fc, 0.46)):
    p.lathe([(0, 0), (0.17, 0), (0.18, h * 0.6), (0.08, h * 0.75), (0.05, h * 0.9), (0.08, h), (0, h)], pos=(dx, 2.15, 0.6), seg=20)
p.paint_fn(lambda q, n: q.x < -1.2, 0xff8fc0)
p.paint_fn(lambda q, n: -1.2 < q.x < -0.5, 0xb197fc)
p.paint_fn(lambda q, n: q.x > 1.0, 0x74c0fc)
p.paint_fn(lambda q, n: q.y > 2.15 + 0.3 and math.hypot(q.x - (-1.4 if q.x < -1.2 else -0.95 if q.x < 0 else 1.45), q.z - 0.6) < 0.1, 0xffc531)
p.layer('glass', base=0xcfeaf8)                     # mirror glass with two shine streaks (no game draws this kind)
p.box((0, MY, 0.08), (MHW + 0.05, MHH + 0.05, 0.02), bevel=0.01)
p.paint_fn(lambda q, n: n.z > 0.5 and (0.5 < (q.y - MY) - 0.9 * q.x < 0.85 or 1.05 < (q.y - MY) - 0.9 * q.x < 1.18), 0xffffff)
p.layer('skin')
p.extras['outline'] = 0.024
p.build()
