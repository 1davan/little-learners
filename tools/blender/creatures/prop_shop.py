"""Shop front (dress-up street). A facade 12 wide x 6.2 tall x 1 deep (origin = bottom centre, front face at z = 0.5),
wall tinted (skin painted white); white trim: cornice, pilasters, plinth, window frames with deep sills and an arched
door frame ('trim'); two big panes with shine streaks ('glass'); an arched door with a heart window and gold knob
('door', tinted); a striped awning with a scalloped valance ('awning', tinted stripes; the white ones are in 'trim')."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from skit import SProp, arc

W, H, ZF = 6.0, 6.2, 0.5
WX, WY, WW, WH = 3.9, 2.45, 1.6, 1.2          # window centre x (both sides), centre y, half width, half height
DW, DH = 0.95, 2.35                              # door half width, height of the straight part
p = SProp('prop_shop', base=0xffffff)
p.box((0, H / 2, 0), (W, H / 2, ZF), bevel=0.1)
p.paint_fn(lambda q, n: q.y < 0.3, 0xe6e2ee)
# ---- white trim ----
p.layer('trim', base=0xffffff)
p.layers['trim'].update(segs=2, psegs=2)
p.box((0, H + 0.12, 0.05), (W + 0.3, 0.2, ZF + 0.2), bevel=0.08)
p.box((0, H - 0.18, 0.05), (W + 0.12, 0.1, ZF + 0.1), bevel=0.04)
for s in (-1, 1):
    p.box((s * (W - 0.15), H / 2, 0.06), (0.22, H / 2, ZF + 0.08), bevel=0.06)
p.box((0, 0.14, 0.05), (W + 0.05, 0.14, ZF + 0.06), bevel=0.05)
for s in (-1, 1):
    x = s * WX
    p.box((x, WY + WH + 0.1, ZF + 0.06), (WW + 0.2, 0.12, 0.1), bevel=0.04)
    p.box((x, WY - WH - 0.1, ZF + 0.3), (WW + 0.32, 0.12, 0.34), bevel=0.05)      # deep sill (hat stands stand on it)
    for k in (-1, 1):
        p.box((x + k * (WW + 0.1), WY, ZF + 0.06), (0.12, WH + 0.2, 0.1), bevel=0.04)
    p.box((x, WY, ZF + 0.04), (0.06, WH, 0.06), bevel=0.02)
arch = arc(0, DH, DW + 0.14, 0, 180, 10)
outer = [(DW + 0.14, 0.2), (DW + 0.14, DH)] + arch[1:-1] + [(-DW - 0.14, DH), (-DW - 0.14, 0.2)]
inner = [(-DW, 0.2), (-DW, DH)] + arc(0, DH, DW, 180, 0, 10)[1:-1] + [(DW, DH), (DW, 0.2)]
p.prism(outer + inner, ZF - 0.05, ZF + 0.14, bevel=0.035)
# white awning stripes (the coloured ones are in 'awning')
AY0, AY1, AZ1 = 4.45, 3.75, 2.1
NS = 13
sw = (2 * W) / NS
ang = math.degrees(math.atan2(AY0 - AY1, AZ1 - ZF))
L = math.hypot(AY0 - AY1, AZ1 - ZF) / 2


def stripe(i):
    x = -W + sw * (i + 0.5)
    p.box((x, (AY0 + AY1) / 2, (ZF + AZ1) / 2), (sw / 2 - 0.004, 0.05, L), rot=(ang, 0, 0), bevel=0.03)
    pts = [(x - sw / 2 + 0.01, AY1)] + [(x + (sw / 2 - 0.01) * math.cos(a), AY1 - 0.32 * math.sin(a)) for a in [math.pi - math.pi * k / 6 for k in range(1, 6)]] + [(x + sw / 2 - 0.01, AY1)]
    p.prism(pts[::-1], AZ1 - 0.06, AZ1 + 0.02, bevel=0.025)


for i in range(1, NS, 2):
    stripe(i)
# ---- glass ----
p.layer('glass', base=0xcfeeff)
p.layers['glass'].update(segs=1)
for s in (-1, 1):
    p.box((s * WX, WY, ZF + 0.005), (WW, WH, 0.03), bevel=0.01)
    for (dx, w) in ((-0.75, 0.13), (-0.42, 0.06)):
        p.box((s * WX + dx, WY + 0.05, ZF + 0.04), (w, WH * 0.75, 0.01), rot=(0, 0, -25), bevel=0.005)
p.paint_fn(lambda q, n: q.z > ZF + 0.03, 0xffffff)
# ---- door ----
p.layer('door', base=0xffffff)
p.layers['door'].update(segs=2, psegs=2)
dpts = [(DW, 0.2), (DW, DH)] + arc(0, DH, DW, 0, 180, 10)[1:-1] + [(-DW, DH), (-DW, 0.2)]
p.prism(dpts[::-1], ZF - 0.05, ZF + 0.08, bevel=0.03)
p.lathe([(0, 0), (0.11, 0), (0.12, 0.05), (0.08, 0.1), (0, 0.11)], pos=(0.65, 1.5, ZF + 0.07), rot=(90, 0, 0), seg=12)
heart = []
for k in range(16):
    t = k / 16 * math.tau
    hx = 16 * math.sin(t) ** 3
    hy = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
    heart.append((hx * 0.024, 2.55 + hy * 0.024))
p.prism(heart, ZF + 0.07, ZF + 0.1, bevel=0.012)
p.paint_fn(lambda q, n: q.x > 0.5 and q.z > ZF + 0.09 and q.y < 1.7, 0xffd23f)
p.paint_fn(lambda q, n: q.z > ZF + 0.085 and q.y > 2.0, 0xffd6e6)
# ---- coloured awning stripes ----
p.layer('awning', base=0xffffff)
p.layers['awning'].update(segs=2, psegs=2)
for i in range(0, NS, 2):
    stripe(i)
p.layer('skin')
p.extras['outline'] = 0.026
p.build()
