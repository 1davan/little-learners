"""Room windows, white painted frames facing +z (origin = the glass centre; the wall surface is at z = 0).
Skin: the bedroom window (glass 3.0 x 2.1) with a cross of glazing bars and a deep sill. Layer 'big': the cosy
room's window (glass 7.0 x 3.6) with a centre post, a transom bar and a deep sill."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from skit import SProp

p = SProp('prop_window', base=0xffffff)


def frame(hw, hh, bars, sill_d, t=0.16):
    p.box((0, hh + t, 0.1), (hw + 2 * t, t, 0.12), bevel=0.05)
    p.box((0, -hh - t, 0.1), (hw + 2 * t, t, 0.12), bevel=0.05)
    for s in (-1, 1):
        p.box((s * (hw + t), 0, 0.1), (t, hh + 2 * t, 0.12), bevel=0.05)
    for (x, y, w, h) in bars:
        p.box((x, y, 0.06), (w, h, 0.05), bevel=0.025)
    p.box((0, -hh - 2 * t - 0.06, sill_d / 2), (hw + 3 * t, 0.09, sill_d / 2 + 0.05), bevel=0.05)
    p.box((0, -hh - 2 * t - 0.2, 0.08), (hw + 2 * t, 0.07, 0.08), bevel=0.03)


frame(1.5, 1.05, [(0, 0, 0.05, 1.05), (0, 0, 1.5, 0.05)], 0.4, t=0.12)
p.paint_fn(lambda q, n: n.y < -0.6, 0xe6e2ee)
p.layer('big', base=0xffffff)
frame(3.5, 1.8, [(0, 0, 0.09, 1.8), (0, 0.2, 3.5, 0.08)], 1.0, t=0.17)
p.paint_fn(lambda q, n: n.y < -0.6, 0xe6e2ee)
p.layer('skin')
p.extras['outline'] = 0.024
p.build()
