"""Treasure chest (Where's Crab?). Unit size W 2.1 x H 1.05 x D 1.4 (box) + a round lid (radius D/2).
Hollow box with a floor; gold straps, corner caps and a lock plate with a keyhole. The lid is on bone 'lid', hinged
along the top back edge: rest = shut; the game opens it with lid.rotation.x = -1.75."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

W, H, D, T = 2.1, 1.05, 1.4, 0.11
WOOD, WOOD_D, WOOD_IN = 0xb8703a, 0x9a5a2c, 0x6e3c1e
GOLD, GOLD_D, INK = 0xffc93f, 0xe6a22a, 0x4a2a1a
hw, hd = W / 2, D / 2

p = Prop('prop_chest', base=WOOD, target_faces=3600)
p.box((0, T / 2, 0), (hw, T / 2, hd), bevel=0.04)
p.box((0, H / 2, hd - T / 2), (hw, H / 2, T / 2), bevel=0.05)
p.box((0, H / 2, -hd + T / 2), (hw, H / 2, T / 2), bevel=0.05)
for s in (-1, 1):
    p.box((s * (hw - T / 2), H / 2, 0), (T / 2, H / 2, hd), bevel=0.05)
# plank grooves on the front/sides (painted darker), inside darker
inside = lambda q: abs(q.x) < hw - T + 0.02 and abs(q.z) < hd - T + 0.02 and q.y > T - 0.02
p.paint_fn(lambda q, n: inside(q), WOOD_IN)
p.paint_fn(lambda q, n: not inside(q) and any(abs(q.y - y) < 0.022 for y in (0.36, 0.71)), WOOD_D)

# lid: half-round barrel top, hollow underneath (own layer, own bone)
LY = H + 0.03
p.layer('lid', base=WOOD, target_faces=1600)
sec = [(z, y) for z, y in [(hd * math.cos(math.radians(a)), hd * math.sin(math.radians(a)) * 0.8) for a in range(0, 181, 10)]]
# sweep the half-round section along x: build as a closed loop (outer arc, inner arc) extruded W
outer = [(z, LY + y) for z, y in sec]
inner = [(z * 0.86, LY + 0.05 + y * 0.8) for z, y in reversed(sec)]
loop = outer + inner
verts, faces = [], []
for x in (-hw, hw):
    for z, y in loop:
        verts.append((x, y, z))
m = len(loop)
for i in range(m):
    j = (i + 1) % m
    faces.append((i, j, m + j, m + i))
# end caps (fan the loop: it is a thick arch, so fan from the inner/outer pairs)
half = len(outer)
for base in (0, m):
    for i in range(half - 1):
        a, b = i, i + 1
        c, d = m - 1 - (i + 1), m - 1 - i
        faces.append((base + a, base + b, base + c, base + d))
p.mesh(verts, faces)
p.paint_fn(lambda q, n: abs(q.x) < hw - 0.03 and (n.y * (q.y - LY) * 1.5 + n.z * q.z) < 0, WOOD_IN)
p.paint_fn(lambda q, n: any(abs(q.x - x) < 0.022 for x in (-0.35, 0.35)), WOOD_D)
p.layer('skin')

# gold: straps over box and lid, corner caps, lock plate (own layer: crisp and shiny)
p.layer('gold', base=GOLD, target_faces=1800, voxel=0.014)
for x in (-0.62, 0.62):
    p.box((x, H / 2, hd + 0.005), (0.08, H / 2 - 0.02, 0.035), bevel=0.025)
    p.box((x, H / 2, -hd - 0.005), (0.08, H / 2 - 0.02, 0.035), bevel=0.025)
    p.tube([(x, LY + 0.04 + (hd + 0.02) * math.sin(math.radians(a)) * 0.8, (hd + 0.02) * math.cos(math.radians(a))) for a in range(4, 177, 8)], 0.055, rseg=8)
for sx in (-1, 1):
    for sz in (-1, 1):
        p.box((sx * (hw - 0.02), 0.1, sz * (hd - 0.02)), (0.07, 0.1, 0.07), bevel=0.04)
p.box((0, H - 0.2, hd + 0.03), (0.17, 0.2, 0.04), bevel=0.06)                     # lock plate
p.paint_fn(lambda q, n: n.y < -0.6, GOLD_D)
p.layer('keyhole', base=INK, target_faces=300, voxel=0.01)
p.blob((0, H - 0.17, hd + 0.075), (0.045, 0.045, 0.02), group='kh')
p.blob((0, H - 0.25, hd + 0.075), (0.025, 0.07, 0.02), group='kh')
p.layer('skin')

# ---- rig: everything above the box top belongs to the lid ----
is_lid = lambda q: q.y > H + 0.012
p.bone('body', (0, 0, 0), (0, H, 0), region=lambda q: not is_lid(q))
p.bone('lid', (0, LY, -hd), (0, LY + 1.0, -hd), parent='body', region=is_lid)
p.extras['outline'] = 0.022
p.build()
