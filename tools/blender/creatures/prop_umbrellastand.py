"""Umbrella stand (cosy rainy room): a plum pot 1.0 tall (origin = floor centre) holding a furled red umbrella and a
furled green one with crook handles (layer 'brollies')."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from skit import SProp, dome_profile

p = SProp('prop_umbrellastand', base=0x8a6ad0)
p.lathe([(0, 0), (0.36, 0), (0.4, 0.05), (0.38, 0.9), (0.44, 0.95), (0.44, 1.02), (0.34, 1.02), (0.32, 0.92), (0, 0.92)], seg=48)
for k in range(12):                                     # clean vertical ribs round the pot
    a = k / 12 * math.tau
    p.box((0.395 * math.sin(a), 0.48, 0.395 * math.cos(a)), (0.03, 0.36, 0.02), rot=(0, math.degrees(a), 0), bevel=0.018)
p.paint_fn(lambda q, n: q.y > 0.93, 0xb197fc)
p.layer('brollies', base=0xff4b4b)
for dx, rz, col in ((-0.1, 8, 0xff4b4b), (0.11, -9, 0x3fae4a)):
    c, s = math.cos(math.radians(rz)), math.sin(math.radians(rz))
    base = (dx, 0.2, 0)
    prof = [(0, 0), (0.05, 0.02), (0.13, 0.5), (0.17, 0.95), (0.11, 1.3), (0.03, 1.45), (0, 1.47)]
    p.lathe(prof, pos=base, rot=(0, 0, rz), seg=24)
    sy = 1.0                                             # a strap with a button round the furled canopy
    sp = (dx - s * sy, 0.2 + c * sy, 0)
    p.ring(sp, 0.165, 0.03, rot=(0, 0, rz), seg=24, rseg=6)
    p.lathe([(0, 0), (0.035, 0), (0.03, 0.02), (0, 0.025)], pos=(sp[0], sp[1], 0.2), rot=(90, 0, 0), seg=10)
    tip = (dx - s * 1.47, 0.2 + c * 1.47, 0)
    p.tube([tip, (tip[0] - s * 0.25, tip[1] + c * 0.25, 0)] + [(tip[0] - s * 0.25 + 0.11 - 0.11 * math.cos(a), tip[1] + c * 0.25 + 0.11 * math.sin(a), 0) for a in [k * math.pi / 8 for k in range(1, 9)]], 0.035, rseg=8)
def _axis_d(q, x0, deg):
    a = math.radians(deg)
    dx, dy = -math.sin(a), math.cos(a)
    px, py = q.x - x0, q.y - 0.2
    t = px * dx + py * dy
    return math.hypot(px - t * dx, py - t * dy)


p.paint_fn(lambda q, n: q.y < 1.75 and _axis_d(q, 0.11, -9) < _axis_d(q, -0.1, 8), 0x3fae4a)      # each brolly its own colour
p.paint_fn(lambda q, n: q.y > 1.62, 0x6a5a7a)
STRAPS = [(-0.1 - math.sin(math.radians(8)) * 1.0, 0.2 + math.cos(math.radians(8)) * 1.0), (0.11 - math.sin(math.radians(-9)) * 1.0, 0.2 + math.cos(math.radians(-9)) * 1.0)]
p.paint_fn(lambda q, n: any(math.hypot(q.x - x, q.y - y) < 0.26 and abs(q.y - y) < 0.045 for x, y in STRAPS), 0xfffaf0)
p.layer('skin')
p.extras['outline'] = 0.022
p.build()
