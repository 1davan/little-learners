"""Big floppy straw sun hat (Where's Crab?, Words, Brick words): brim radius 2.4 (wider than a crab hiding under it at
0.6) with a soft droop and a chunky rounded edge (so its ink line never breaks), a round crown (top ~1.17), a crisp pink
ribbon band (its own exact layer, straight edges) and a soft bow at the front right."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import rounded
from rawprop import RawProp

STRAW, STRAW_D, PINK, PINK_D = 0xf2d16b, 0xd9b04a, 0xff8fc0, 0xe86fa4
R = 2.4
p = RawProp('prop_hat', base=STRAW, target_faces=4200, voxel=0.018)
top, bot = [], []
for i in range(0, 13):
    t = i / 12
    r = 0.9 + (R - 0.9) * t
    y = 0.22 - 0.17 * t * t
    top.append((r, y + 0.04))
    bot.append((r, y - 0.06))
brim = [(0, 0.1)] + [(r, y) for r, y in bot] + [(R + 0.05, top[-1][1] - 0.01)] + list(reversed(top)) + [(0, 0.26)]
p.lathe(rounded(brim, 0.035, n=2), seg=72)
p.lathe(rounded([(0, 0.15), (0.95, 0.15), (0.95, 0.55), (0.8, 1.0), (0.4, 1.15), (0, 1.17)], 0.25, n=6), seg=60)
p.paint_fn(lambda q, n: n.y < -0.55, STRAW_D)
# the ribbon: an exact band round the crown (crisp top and bottom edges)
p.layer('band', base=PINK)
p.raw(0.7)
p.lathe([(0.93, 0.2), (1.0, 0.2), (1.0, 0.5), (0.93, 0.5)], seg=72, closed=True)
p.layer('bow', base=PINK, target_faces=900, voxel=0.012)
for s in (-1, 1):
    p.blob((0.55 + s * 0.21, 0.36, 0.86), (0.21, 0.13, 0.08), rot=(0, 30, -s * 15), group='bow%d' % s)
p.blob((0.55, 0.36, 0.91), (0.08, 0.08, 0.07), group='knot')
p.paint_group(['knot'], PINK_D)
p.layer('skin')
p.bone('body', (0, 0, 0), (0, 1.15, 0))
p.extras['outline'] = 0.026
p.build()
