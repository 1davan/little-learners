"""Toy pine tree (scenery makePine): three soft skirt tiers with gently scalloped rims on a stubby trunk, 3.75 tall
and 2.9 wide at the bottom tier like the old stacked-cone pine. Layers:
  skin  tiers (pine green, darker underside) + trunk (bark brown)
  snow  white crusts with drippy wavy edges on every tier (makePine snow: true)"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, TAU

PINE, PINE_D, PINE_L, BARK = 0x2f9a62, 0x237d4f, 0x3fae70, 0x8a5a3b
TIERS = [(1.45, 0.62, 2.25, 0.0), (1.12, 1.6, 3.05, 0.6), (0.78, 2.5, 3.78, 1.3)]   # rim radius, bottom, top, wave phase
p = Prop('prop_scene_pine', base=PINE, target_faces=1150, voxel=0.02, smooth=5)


def rev(prof_at, seg=40, closed=False):
    """revolve a per-angle profile [(r, y)...] about y: from the axis back to the axis, or a closed loop (a ring)"""
    profs = [prof_at(TAU * i / seg) for i in range(seg)]
    n = len(profs[0])
    verts, faces = [], []
    for i, pr in enumerate(profs):
        a = TAU * i / seg
        for r, y in pr:
            verts.append((r * math.sin(a), y, r * math.cos(a)))
    for i in range(seg):
        j = (i + 1) % seg
        for k in range(n if closed else n - 1):
            k2 = (k + 1) % n
            faces.append((i * n + k, j * n + k, j * n + k2, i * n + k2))
    p.mesh(verts, faces)


def surf(R, bot, top, r):
    """height of a tier's upper surface at radius r (a soft, slightly bulging cone)"""
    t = min(1.0, r / R)
    return top - (top - bot) * (t ** 1.25) + 0.12 * (top - bot) * math.sin(t * math.pi) * 0.5


def tier(R, bot, top, ph):
    def prof(a):
        Rr = R * (1 + 0.09 * math.cos(7 * a + ph))
        pts = [(Rr * k / 10 * 0.94, surf(Rr, bot, top, Rr * k / 10 * 0.94)) for k in range(11)]
        pts += [(Rr, bot + 0.04), (Rr * 0.97, bot - 0.06), (Rr * 0.8, bot - 0.08), (Rr * 0.45, bot + 0.05), (0, bot + 0.16)]
        return pts
    rev(prof)


for R, bot, top, ph in TIERS:
    tier(R, bot, top, ph)
p.cyl((0, 0, 0), 0.27, 1.0, r2=0.2, bevel=0.06, seg=24)
p.paint_fn(lambda q, n: math.hypot(q.x, q.z) < 0.32 and q.y < 0.66, BARK)
p.paint_fn(lambda q, n: n.y < -0.35 and q.y > 0.5, PINE_D)

# ---- snow ----
p.layer('snow', base=0xffffff, target_faces=520, voxel=0.016)
for i, (R, bot, top, ph) in enumerate(TIERS):
    # a crust on the part of each tier that shows: the top tier's peak, and the shoulder ring below the next tier's rim
    r_in = 0.0 if i == 2 else 0.5 * R
    def prof(a, R=R, bot=bot, top=top, ph=ph, i=i, r_in=r_in):
        Rr = R * (1 + 0.09 * math.cos(7 * a + ph))
        Rs = Rr * ((0.6 if i == 2 else 0.76) + 0.07 * math.cos(6 * a + ph * 2 + i) + 0.035 * math.cos(13 * a))
        su = lambda r: surf(Rr, bot, top, r)
        if i == 2:
            pts = [(Rs * k / 8, su(Rs * k / 8) + 0.07) for k in range(9)]
            return pts + [(Rs + 0.03, su(Rs) - 0.02), (Rs * 0.9, su(Rs * 0.9) - 0.12), (0, top - 0.25)]
        pts = [(r_in + (Rs - r_in) * k / 6, su(r_in + (Rs - r_in) * k / 6) + 0.06) for k in range(7)]
        return pts + [(Rs + 0.03, su(Rs) - 0.02), (Rs * 0.95, su(Rs * 0.95) - 0.12), (r_in, su(r_in) - 0.1)]
    rev(prof, seg=48, closed=i != 2)
p.layer('skin')

p.bone('body', (0, 0, 0), (0, 3.8, 0))
p.extras['outline'] = 0.03
p.build()
