"""Cardboard box (Where's Crab? box, Peekaboo pots box). Unit size W 2.3 x H 1.35 x D 1.8, hollow with a floor.
Two top flaps on bones flap.L / flap.R, hinged along the top side edges: rest = shut (lying flat on top, taped);
the game opens them with flap.L.rotation.z = +a, flap.R.rotation.z = -a (about 2.3 flops them down the sides)."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop
from rawprop import RawProp

W, H, D, T = 2.3, 1.35, 1.8, 0.1
CARD, CARD_D, CARD_IN, TAPE = 0xdba76b, 0xc58f55, 0xa8763f, 0xf3dfb4
FL = 0.07      # flap thickness

p = RawProp('prop_box', base=CARD, target_faces=3600)
hw, hd = W / 2, D / 2
p.box((0, T / 2, 0), (hw, T / 2, hd), bevel=0.04)                                   # floor
p.box((0, H / 2, hd - T / 2), (hw, H / 2, T / 2), bevel=0.05)                       # front
p.box((0, H / 2, -hd + T / 2), (hw, H / 2, T / 2), bevel=0.05)                      # back
for s in (-1, 1):
    p.box((s * (hw - T / 2), H / 2, 0), (T / 2, H / 2, hd), bevel=0.05)            # sides

# flaps: one layer, two bones (separate from the walls so they can swing)
p.layer('flaps', base=CARD, target_faces=1400)
FY = H + 0.035 + FL / 2
for s in (-1, 1):
    p.box((s * (hw / 2 - 0.005), FY, 0), (hw / 2 - 0.03, FL / 2, hd - 0.01), bevel=0.03)
p.paint_fn(lambda q, n: abs(q.x) < 0.2 and n.y > -0.3, TAPE)                        # tape across the seam
p.paint_fn(lambda q, n: n.y < -0.5, CARD_IN)                                         # flap undersides
p.layer('skin')

# tape down the front (ending just under the rim, flush), a white "this way up" label and a red arrow: each its own
# exact layer, so the edges are crisp stickers instead of remeshed blobs
p.layer('deco', base=TAPE)
p.raw(0.7)
p.box((0, H - 0.32, hd + 0.008), (0.2, 0.3, 0.012), bevel=0)
p.layer('label', base=0xfff8ec)
p.raw(0.7)
p.box((-0.68, 0.72, hd + 0.008), (0.3, 0.3, 0.012), bevel=0)
p.layer('arrow', base=0xe8513f)
p.raw(0.7)
p.box((-0.68, 0.70, hd + 0.022), (0.04, 0.13, 0.008), bevel=0)
for sgn in (-1, 1):
    p.box((-0.68 + sgn * 0.06, 0.8, hd + 0.022), (0.1, 0.035, 0.008), rot=(0, 0, -sgn * 40), bevel=0)   # the arrow head: ^
p.layer('skin')

# ---- paint: darker inside, a lighter top edge and a printed corner stripe ----
inside = lambda q: abs(q.x) < hw - T + 0.02 and abs(q.z) < hd - T + 0.02 and q.y > T - 0.02
p.paint_fn(lambda q, n: inside(q), CARD_IN)
p.paint_fn(lambda q, n: q.y < 0.14 and not inside(q), CARD_D)
p.paint_fn(lambda q, n: q.z > hd - 0.02 and 0.3 < q.x < 1.0 and 0.25 < q.y < 0.33, CARD_D)
p.paint_fn(lambda q, n: q.z > hd - 0.02 and 0.3 < q.x < 0.8 and 0.4 < q.y < 0.46, CARD_D)

# ---- rig ----
is_flap = lambda q: q.y > H + 0.015
p.bone('body', (0, 0, 0), (0, H, 0), region=lambda q: not is_flap(q))
p.bone('flap.L', (-hw, H + 0.035, 0), (-hw, H + 1.0, 0), parent='body', region=lambda q: is_flap(q) and q.x < 0)
p.bone('flap.R', (hw, H + 0.035, 0), (hw, H + 1.0, 0), parent='body', region=lambda q: is_flap(q) and q.x >= 0)
p.extras['outline'] = 0.022
p.build()
