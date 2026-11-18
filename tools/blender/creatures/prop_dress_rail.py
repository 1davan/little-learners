"""Dress Monkey's clothes rail (a dress-only kind; prop_clothesrail stays as it is for scenery.js).
Skin: a free-standing rail 5.8 wide (origin = floor centre, facing +z): two turned pink posts with beads on round
bun feet, a gold bar at y 4.6 with ball finials.
Layers (each with its own origin at the point where it hangs from the bar, y = 0 = the bar's centre):
  'hanger'  a chunky wooden coat hanger (gold hook; shoulders 1.5 wide at y -0.42): tops hang on it.
  'clipbar' a straight wooden trouser hanger (gold hook; bar 1.6 wide at y -0.34): clips hang from it.
  'clip'    one wooden peg with a silver spring (origin = its top, where it hangs on the clipbar; 0.34 long)."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from skit import SProp, rounded, dome_profile

PINK, PINK_D, GOLD, GOLD_L = 0xff9ec4, 0xff7fb0, 0xffc531, 0xffe08a
WOOD, WOOD_D, STEEL = 0xe0a66a, 0xc98a52, 0xc9cfdc
HW, BY = 2.9, 4.6           # half width (post centres), bar height

p = SProp('prop_dress_rail', base=PINK)
# turned posts: a slim shaft with a bead low down, a bead in the middle and a collar under the finial
prof = [(0, 0.2), (0.16, 0.2), (0.16, 0.38), (0.1, 0.44), (0.085, 0.6), (0.13, 0.7), (0.085, 0.8), (0.08, 2.3),
        (0.12, 2.38), (0.12, 2.46), (0.08, 2.54), (0.078, BY - 0.3), (0.115, BY - 0.22), (0.115, BY - 0.14), (0.0, BY - 0.14)]
for s in (-1, 1):
    p.lathe(rounded(prof, 0.025, n=2), pos=(s * HW, 0, 0), seg=20)
    # a round bun foot under each post (a low turned dome)
    p.lathe(rounded([(0, 0), (0.36, 0), (0.38, 0.05), (0.3, 0.16), (0.17, 0.24), (0, 0.24)], 0.04, n=2), pos=(s * HW, 0, 0), seg=24)
p.paint_fn(lambda q, n: q.y < 0.37, PINK_D)
p.layer('gold', base=GOLD)
p.cyl((-HW - 0.05, BY, 0), 0.075, 2 * HW + 0.1, rot=(0, 0, -90), seg=16, bevel=0.02)
for s in (-1, 1):
    p.lathe(dome_profile(0.2, 0.2, n=6), pos=(s * HW, BY, 0), seg=18)
    p.lathe(dome_profile(0.2, 0.2, n=6), pos=(s * HW, BY, 0), rot=(180, 0, 0), seg=18)
    p.cyl((s * HW, BY - 0.2, 0), 0.06, 0.08, seg=12, bevel=0.0)
p.paint_fn(lambda q, n: n.y > 0.55 and q.y > BY + 0.05 and abs(abs(q.x) - HW) < 0.2, GOLD_L)


def hook(r=0.1, drop=0.3):
    """the hook: over the bar (centre at the origin) and down to the hanger's neck at (0, -drop)"""
    pts = [(-r * 0.85, -0.035, 0)]
    for k in range(13):
        a = math.pi * k / 12
        pts.append((-r * math.cos(a), r * math.sin(a), 0))
    pts += [(r, -0.06, 0), (r * 0.7, -drop * 0.55, 0), (0.0, -drop, 0)]
    p.tube(pts, 0.026, rseg=8)


# ---- coat hanger ----
p.layer('hanger', base=WOOD)
SY = -0.42
arm = [(-0.78, SY - 0.2), (-0.62, SY - 0.13), (-0.3, SY - 0.03), (0.0, SY + 0.0), (0.3, SY - 0.03), (0.62, SY - 0.13), (0.78, SY - 0.2)]
p.tube([(x, y, 0) for x, y in arm], [0.055, 0.07, 0.07, 0.07, 0.07, 0.07, 0.055], rseg=10)
for s in (-1, 1):
    p.lathe(dome_profile(0.07, 0.07, n=3), pos=(s * 0.78, SY - 0.2, 0), rot=(0, 0, s * -62), seg=10)
p.cyl((0, SY - 0.02, 0), 0.06, 0.12, seg=10, bevel=0.02)
p.paint_fn(lambda q, n: abs(q.y - (SY + 0.06)) < 0.02 and abs(q.x) < 0.1, WOOD_D)
p.layer('hangerhook', base=GOLD)
hook(drop=-SY - 0.04)

# ---- trouser hanger: a straight bar the clips hang from ----
p.layer('clipbar', base=WOOD)
CY = -0.34
p.cyl((-0.8, CY, 0), 0.055, 1.6, rot=(0, 0, -90), seg=12, bevel=0.03)
p.cyl((0, CY + 0.02, 0), 0.06, 0.1, seg=10, bevel=0.02)
p.layer('clipbarhook', base=GOLD)
hook(drop=-CY - 0.04)

# ---- one peg clip (origin at its top; it hangs down 0.34) ----
p.layer('clip', base=0xf3c993)
for s in (-1, 1):
    p.box((0, -0.17, s * 0.034), (0.15, 0.34, 0.05), bevel=0.02)
p.cyl((-0.085, -0.12, 0), 0.03, 0.17, rot=(0, 0, -90), seg=10, bevel=0.01)      # the spring's wire, across the jaws
p.paint_fn(lambda q, n: abs(q.y + 0.12) < 0.035 and abs(q.x) < 0.09, STEEL)
p.paint_fn(lambda q, n: q.y < -0.29, 0xe9b77a)

p.layer('skin')
p.extras['outline'] = 0.022
p.build()
