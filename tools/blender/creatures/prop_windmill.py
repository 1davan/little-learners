"""Toy windmill (farm scenery). A tapered cream tower (6 tall) on a stone base, a red cap, a red arched door, two round
blue windows and a little balcony; the four sails are their own layer 'blades', built in the XY plane around the
hub H = (0, 6.1, 0.7) so scenery.js can spin them (userData.blades). Static otherwise."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from skit import SProp, rounded, arc, dome_profile

CREAM, STONE, RED, RED_D, GLASS, WOOD, WHITE, SAIL = 0xfff3e3, 0xcdbcae, 0xe8493c, 0xc23d33, 0x9fd8ff, 0x9a6a44, 0xfffaf2, 0xfff1dc
HX, HY, HZ = 0, 6.1, 0.7
p = SProp('prop_windmill', base=CREAM)
prof = [(0, 0), (0.86, 0), (0.86, 0.32), (0.74, 0.36), (0.44, 5.75), (0, 5.75)]
p.lathe(prof, seg=8, rot=(0, 22.5, 0))
p.paint_fn(lambda q, n: q.y < 0.34, STONE)
# arched door
door = [(-0.3, 0.3), (-0.3, 1.15)] + arc(0, 1.15, 0.3, 180, 0, 8)[1:-1] + [(0.3, 1.15), (0.3, 0.3)]
p.prism(door[::-1], 0.6, 0.71, bevel=0.03)
p.paint_fn(lambda q, n: q.z > 0.64 and n.z > 0.3 and q.y < 1.5 and abs(q.x) < 0.32 and q.y > 0.29, RED)
zf = lambda y: (0.74 - 0.3 * (y - 0.36) / 5.39) * 0.924
WINS = ((1.95, 0.2), (4.3, 0.17))
for y, r in WINS:
    p.lathe([(0, 0), (r, 0), (r, 0.06), (0, 0.06)], pos=(0, y, zf(y) - 0.03), rot=(90, 0, 0), seg=14)
p.paint_fn(lambda q, n: q.y > 1.6 and n.z > 0.5 and q.z > zf(q.y) + 0.01 and math.hypot(q.x, q.y - (1.95 if q.y < 3.0 else 4.3)) < (0.21 if q.y < 3.0 else 0.18), GLASS)
p.layer('trim', base=WHITE)
for y, r in WINS:
    p.ring((0, y, zf(y) + 0.03), r + 0.02, 0.045, rot=(90, 0, 0), seg=16, rseg=6)
BY = 2.72
p.ring((0, BY + 0.36, 0), 0.74, 0.045, seg=8, rseg=8, rot=(0, 22.5, 0))         # balcony rail
p.cyl((0, BY, 0), 0.76, 0.08, seg=8, bevel=0.03, rot=(0, 22.5, 0))              # balcony floor
for i in range(8):
    a = i * math.pi / 4 + math.radians(22.5)
    p.cyl((0.68 * math.sin(a), BY + 0.06, 0.68 * math.cos(a)), 0.028, 0.3, seg=6, bevel=0.01)
p.layer('cap', base=RED)
p.lathe([(0, 0), (0.64, 0), (0.66, 0.08)] + dome_profile(0.6, 0.86, n=8, base=0.1)[1:], pos=(0, 5.62, 0), seg=20)
p.lathe([(0, 0), (0.1, 0), (0.1, 0.12), (0.14, 0.18), (0.08, 0.32), (0, 0.34)], pos=(0, 6.48, 0), seg=12)
p.cyl((HX, HY, 0.2), 0.16, 0.42, r2=0.13, rot=(90, 0, 0), seg=16, bevel=0.03)   # axle housing
p.paint_fn(lambda q, n: q.y < 5.72 and q.y > 5.5, RED_D)

p.layer('blades', base=SAIL)
p.layers['blades'].update(segs=1)
p.lathe([(0, -0.2), (0.22, -0.2), (0.26, -0.1), (0.22, 0.06), (0.1, 0.16), (0, 0.18)], pos=(HX, HY, HZ), rot=(90, 0, 0), seg=16)
for i in range(4):
    a = i * math.pi / 2 + math.pi / 4
    ca, sa = math.cos(a), math.sin(a)
    def at(r, t, z):
        return (HX + ca * r - sa * t, HY + sa * r + ca * t, HZ + z)
    deg = math.degrees(a)
    p.box(at(1.38, 0, 0), (1.3, 0.05, 0.05), rot=(0, 0, deg), bevel=0.025)              # spar
    p.box(at(1.55, 0.32, -0.04), (0.95, 0.26, 0.02), rot=(0, 0, deg), bevel=0.02)        # sail cloth
    for r in (0.72, 1.18, 1.64, 2.1, 2.48):
        p.box(at(r, 0.33, -0.01), (0.022, 0.29, 0.02), rot=(0, 0, deg), bevel=0.01)      # battens
    p.box(at(1.6, 0.6, -0.01), (0.92, 0.022, 0.02), rot=(0, 0, deg), bevel=0.01)


def wood(q, n):
    dx, dy = q.x - HX, q.y - HY
    r = math.hypot(dx, dy)
    if r < 0.28:
        return False
    ang = math.atan2(dy, dx)
    k = round((ang - math.pi / 4) / (math.pi / 2))
    t = r * math.sin(ang - (math.pi / 4 + k * math.pi / 2))
    return q.z > HZ - 0.008 or abs(t) < 0.06
p.paint_fn(wood, WOOD)
p.paint_fn(lambda q, n: math.hypot(q.x - HX, q.y - HY) < 0.28, RED)
p.layer('skin')
p.extras['outline'] = 0.028
p.build()
