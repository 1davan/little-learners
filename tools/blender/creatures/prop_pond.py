"""Duck pond dressing (farm scenery): a rim of chunky rounded rocks round an ellipse 3.3 x 1.76, bold reed clumps
with cattails at the back left and right, and lily pads with a pink flower (layers skin, reeds, lily). Layer 'water':
the water surface itself (two blues with ripple rings) - scenery.js keeps its own flat code disc and does not draw it,
direct uses (catalogue, word cards) show it so the kind always reads as a pond."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from skit import SProp, dome_profile, rounded

STONE, STONE_D, STONE_L = 0xc8c2d6, 0xa9a1bf, 0xe0dbea
RX, RZ = 3.3, 1.76
p = SProp('prop_pond', base=STONE)
N = 20
for i in range(N):
    a = (i + 0.25 * math.sin(i * 1.7)) / N * math.tau
    r = 0.3 + 0.08 * math.sin(i * 2.3) + 0.05 * math.cos(i * 5.1)
    x, z = (RX + 0.12) * math.cos(a), (RZ + 0.12) * math.sin(a)
    p.lathe(rounded([(0, -0.02), (r, -0.02), (r * 0.98, r * 0.22), (r * 0.8, r * 0.48), (r * 0.42, r * 0.66), (0, r * 0.7)], r * 0.25, n=3),
            pos=(x, -0.02, z), rot=(0, math.degrees(a) * 1.7, 0), seg=11, scale=(1.3, 0.95))
p.paint_fn(lambda q, n: (math.atan2(q.z / RZ, q.x / RX) * N / math.tau) % 3 < 1 and n.y < 0.8, STONE_D)
p.paint_fn(lambda q, n: n.y > 0.8 and q.y > 0.14, STONE_L)
p.layer('reeds', base=0x5fae4a)
CLUMPS = [(-2.55, -1.3, 1.0), (2.9, -0.95, 0.85)]
for ci, (cx, cz, sc) in enumerate(CLUMPS):
    for k in range(5):                       # broad blade leaves fanning out of the clump
        ang = (-50 + 25 * k) * (1 if ci == 0 else -1)
        L = sc * (0.85 + 0.25 * math.cos(k * 1.9))
        sa, ca = math.sin(math.radians(ang)), math.cos(math.radians(ang))
        base = (cx + 0.05 * (k - 2), 0, cz + 0.03 * k)
        mid = (base[0] + sa * L * 0.35, L * 0.55, base[2] + 0.04)
        tip = (base[0] + sa * L * 0.8, L * (0.9 + 0.1 * ca), base[2] + 0.08)
        p.tube([base, mid, tip], [0.065, 0.05, 0.008], rseg=6)
    for k, (dx, h) in enumerate(((-0.12, 1.35), (0.12, 1.6), (0.32, 1.15))):    # cattail stems with fat heads
        x = cx + dx * (1 if ci == 0 else -1)
        h *= sc
        p.tube([(x, 0, cz - 0.05), (x + 0.02, h * 0.5, cz - 0.05), (x + 0.04, h, cz - 0.05)], 0.032, rseg=6)
        p.lathe(rounded([(0, 0), (0.08, 0.03), (0.095, 0.12), (0.095, 0.3), (0.075, 0.37), (0, 0.39)], 0.04, n=3),
                pos=(x + 0.04, h - 0.34, cz - 0.05), seg=9)
        p.tube([(x + 0.04, h + 0.03, cz - 0.05), (x + 0.04, h + 0.16, cz - 0.05)], 0.014, rseg=5)
HEADS = [(cx + dx * (1 if ci == 0 else -1) + 0.04, sc * h - 0.15) for ci, (cx, cz, sc) in enumerate(CLUMPS) for dx, h in ((-0.12, 1.35), (0.12, 1.6), (0.32, 1.15))]
p.paint_fn(lambda q, n: any(abs(q.x - hx) < 0.11 and abs(q.y - hy) < 0.19 for hx, hy in HEADS), 0x8a5a3b)
p.paint_fn(lambda q, n: q.y < 0.25 and n.y < 0.5, 0x4f9a3e)
p.layer('lily', base=0x6cc95a)
p.layers['lily'].update(psegs=1)
for (x, z, r, rot) in [(0.55, 0.2, 0.42, 30), (-0.75, -0.3, 0.34, 160), (2.35, -0.75, 0.32, 250), (-2.2, 0.6, 0.3, 90), (1.4, 0.75, 0.26, 300)]:
    pts = []
    for i in range(17):
        a = math.radians(rot + 22 + i * 316 / 16)
        pts.append((x + r * math.cos(a), z + r * math.sin(a)))
    pts.append((x, z))
    p.prism(pts, 0.03, 0.075, axis='y', bevel=0.02)
for i in range(7):
    a = i * math.tau / 7
    p.lathe([(0, 0), (0.08, 0.03), (0.09, 0.13), (0.0, 0.23)], pos=(0.55 + 0.06 * math.cos(a), 0.07, 0.2 + 0.06 * math.sin(a)),
            rot=(math.degrees(0.6 * math.sin(a)), 0, math.degrees(-0.6 * math.cos(a))), seg=8, scale=(1, 0.5))
p.lathe(dome_profile(0.06, 0.06, n=3), pos=(0.55, 0.11, 0.2), seg=10)
p.paint_fn(lambda q, n: q.y > 0.085 and math.hypot(q.x - 0.55, q.z - 0.2) < 0.25, 0xff9ac4)
p.paint_fn(lambda q, n: q.y > 0.14 and math.hypot(q.x - 0.55, q.z - 0.2) < 0.065, 0xffd23f)
p.paint_fn(lambda q, n: q.y < 0.04, 0x58b04a)
p.layer('water', base=0x7fc8ee)
p.layers['water'].update(psegs=1)
p.prism([(RX * 1.04 * math.cos(a), RZ * 1.04 * math.sin(a)) for a in [math.tau * k / 48 for k in range(48)]], -0.02, 0.025, axis='y', bevel=0.012)


def ripple(q, n):
    for cx, cz, r in ((-1.1, 0.35, 0.5), (1.2, -0.3, 0.38)):
        d = math.hypot((q.x - cx) / 1.2, q.z - cz)
        if abs(d - r) < 0.035 or abs(d - r * 0.55) < 0.03:
            return True
    return False


p.paint_fn(lambda q, n: (q.x / RX) ** 2 + (q.z / RZ) ** 2 > 0.72, 0x9ad6f3)
p.paint_fn(ripple, 0xd4f0ff)
p.layer('skin')
p.extras['outline'] = 0.022
p.build()
