"""Cosy armchair (rainy room): a squashy club chair (tinted: painted white) 2.8 wide, seat top at y 1.05, origin =
floor centre, back toward -z. Fat rolled arms with scroll fronts, a deep seat cushion, a tall rounded buttoned back,
stubby turned bun feet (layer 'feet'), a round yellow scatter cushion propped in the corner (layer 'cushion') and a
pink striped knitted blanket draped over the right arm (layer 'blanket')."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from skit import SProp, dome_profile, rounded, offset_line

SHADE, SHADE_D, BUTTON = 0xe9e3f1, 0xd6cde6, 0xbfb2d6
p = SProp('prop_armchair', base=0xffffff)
p.box((0, 0.6, 0.08), (1.02, 0.3, 0.84), bevel=0.26)                  # seat base (skirt)
p.box((0, 0.93, 0.2), (0.93, 0.13, 0.74), bevel=0.13)                # deep seat cushion, top at y 1.06
p.box((0, 1.72, -0.6), (1.12, 0.92, 0.3), bevel=0.3)                 # back
p.box((0, 2.5, -0.62), (0.98, 0.22, 0.32), bevel=0.21)               # rounded top roll of the back
for s in (-1, 1):
    p.box((s * 1.18, 0.86, 0.08), (0.24, 0.52, 0.86), bevel=0.22)    # arm side panels
    p.cyl((s * 1.2, 1.36, -0.72), 0.31, 1.72, rot=(90, 0, 0), seg=28, bevel=0.12)   # fat rolled arm (along +z)
    p.cyl((s * 1.2, 1.36, 0.98), 0.27, 0.05, rot=(90, 0, 0), seg=24, bevel=0.025)   # scroll face
# soft shading: underside, piping seam on the seat, scroll faces, a lilac seam along the seat front
p.paint_fn(lambda q, n: n.y < -0.55, SHADE_D)
p.paint_fn(lambda q, n: q.z > 1.0 and abs(q.x) > 0.9 and math.hypot(abs(q.x) - 1.2, q.y - 1.36) < 0.2, SHADE)
p.paint_fn(lambda q, n: abs(q.y - 0.8) < 0.03 and q.z > 0.6 and abs(q.x) < 0.95, SHADE_D)
# deep buttoned back: six tufting buttons in two rows
BUT = [(x, y) for y in (1.55, 2.1) for x in (-0.55, 0.0, 0.55)]
p.layer('feet', base=0x8a5a36)
for sx in (-1, 1):
    for sz in (-1, 1):
        p.lathe(rounded([(0, 0), (0.1, 0), (0.15, 0.1), (0.12, 0.2), (0.15, 0.3), (0, 0.32)], 0.04, n=3),
                pos=(sx * 1.08, 0, sz * 0.66 + 0.06), seg=16)
p.paint_fn(lambda q, n: 0.18 < q.y < 0.24, 0x6e4426)
for bx, by in BUT:                     # deep tufting buttons on the back (untinted, so they stay a rich plum)
    p.lathe(dome_profile(0.075, 0.045, n=4), pos=(bx, by, -0.31), rot=(90, 0, 0), seg=14)
p.paint_fn(lambda q, n: q.y > 1.3, 0x7b5aa6)
p.layer('cushion', base=0xffd23f)
CX, CY, CZ = -0.5, 1.48, -0.17
p.lathe(dome_profile(0.44, 0.17, n=6), pos=(CX, CY, CZ), rot=(72, 0, 16), seg=28)
p.lathe(dome_profile(0.44, 0.15, n=6), pos=(CX, CY, CZ), rot=(252, 0, -16), seg=28)
p.ring((CX, CY, CZ), 0.43, 0.04, rot=(72, 0, 16), seg=40, rseg=8)                 # piping round the edge
p.paint_fn(lambda q, n: math.hypot(q.x - CX, q.y - CY - 0.06) < 0.06 and q.z > CZ, 0xf5a623)   # centre button
p.paint_fn(lambda q, n: math.hypot(math.hypot(q.x - CX, q.y - CY), 0) > 0.38 and n.z < 0.6, 0xf5b324)
p.layer('blanket', base=0xff8fc0)
# a thick knitted blanket folded over the right arm roll: cross-section in x-y, extruded along z
path = [(0.86, 0.98), (0.92, 1.4), (1.05, 1.66), (1.2, 1.71), (1.38, 1.65), (1.5, 1.42), (1.52, 1.0), (1.5, 0.62), (1.55, 0.5)]
inner = offset_line(path, -0.02)
outer = offset_line(path, 0.1)
poly = [tuple(v) for v in rounded(outer, 0.05, n=3)] + [tuple(v) for v in rounded(inner, 0.05, n=3)][::-1]
p.prism([(x, y) for x, y, *_ in poly], -0.28, 0.5, bevel=0.035)
p.paint_fn(lambda q, n: int((q.y - 0.4) / 0.16) % 2 == 1, 0xffd3e5)    # knitted stripes round the drape
p.paint_fn(lambda q, n: abs(q.z - 0.5) < 0.03 or abs(q.z + 0.28) < 0.03, 0xff6fae)  # cast-off edges
p.layer('skin')
p.extras['outline'] = 0.024
p.build()
