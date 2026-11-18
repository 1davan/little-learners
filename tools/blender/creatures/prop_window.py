"""Room windows, white painted frames facing +z (origin = the glass centre; the wall surface is at z = 0).
Skin: the bedroom window (glass 3.0 x 2.1) with a cross of glazing bars and a deep sill. Layer 'big': the cosy
room's window (glass 7.0 x 3.6) with a centre post, a transom bar and a deep sill. Layer 'glass': the bedroom window's
panes with shine streaks, for direct uses (scenery.js draws only the frames, the rooms show sky through them)."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from skit import SProp

p = SProp('prop_window', base=0xffffff)


def frame(hw, hh, bars, sill_d, t=0.16):
    """chunky moulded frame: a fat outer casing (rounded), a stepped inner lip, glazing bars, a deep bull-nosed sill
    with a bracket under it"""
    for y in (hh + t, -hh - t):
        p.box((0, y, 0.12), (hw + 2 * t, t, 0.15), bevel=0.08)
    for s in (-1, 1):
        p.box((s * (hw + t), 0, 0.12), (t, hh + 2 * t, 0.15), bevel=0.08)
    lip = 0.05
    for y in (hh + lip * 0.5, -hh - lip * 0.5):
        p.box((0, y, 0.05), (hw + lip, lip, 0.07), bevel=0.025)
    for s in (-1, 1):
        p.box((s * (hw + lip * 0.5), 0, 0.05), (lip, hh + lip, 0.07), bevel=0.025)
    for (x, y, w, h) in bars:
        p.box((x, y, 0.07), (w, h, 0.065), bevel=0.035)
    p.box((0, -hh - 2 * t - 0.08, sill_d / 2 + 0.02), (hw + 3 * t, 0.11, sill_d / 2 + 0.08), bevel=0.09)
    p.box((0, -hh - 2 * t - 0.24, 0.1), (hw + 2 * t, 0.07, 0.1), bevel=0.04)


frame(1.5, 1.05, [(0, 0, 0.07, 1.05), (0, 0, 1.5, 0.07)], 0.4, t=0.15)
p.paint_fn(lambda q, n: n.y < -0.6, 0xe6e2ee)
p.paint_fn(lambda q, n: max(abs(q.x) - 1.5, abs(q.y) - 1.05) < 0.06 and q.z < 0.13 and abs(q.x) < 1.56 and abs(q.y) < 1.11, 0xf0ecf4)
p.layer('big', base=0xffffff)
frame(3.5, 1.8, [(0, 0, 0.1, 1.8), (0, 0.2, 3.5, 0.09)], 1.0, t=0.2)
p.paint_fn(lambda q, n: n.y < -0.6, 0xe6e2ee)
p.layer('glass', base=0xcfeaf8)
# the bedroom window's panes (direct uses only: the rooms show their own sky through the opening)
p.box((0, 0, -0.02), (1.52, 1.07, 0.02), bevel=0.01)
p.paint_fn(lambda q, n: n.z > 0.5 and (0.25 < (q.y - 0.8 * q.x) % 1.6 < 0.5 or 0.62 < (q.y - 0.8 * q.x) % 1.6 < 0.7), 0xffffff)
p.layer('skin')
p.extras['outline'] = 0.024
path = p.build()
# direct uses (word cards) show ONE window: the cosy room's 'big' frame is bound to the 'root' joint, which the rest
# pose collapses ('body' is moved beside it). scenery.js reads the raw layers and still has both frames.
from glbpost import Glb
Glb(path).bind_layer('big', 'root').unparent('body').hide('root').save()
