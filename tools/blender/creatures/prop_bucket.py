"""Toy sand pail (tintable: makeBucket(colour) multiplies the light-grey body). Unit size: top radius 1.0, bottom 0.8,
height 1.3 - the game scales it to each caller's (r, h). Hollow with a floor, a rolled rim, a star sticker and a
yellow handle on its own bone 'handle' (hinged at the side lugs; rotation.x flops it down)."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded, star_poly

R, RB, H, T = 1.0, 0.8, 1.3, 0.085
BODY, RIM, INSIDE, STAR = 0xe2e2e2, 0xffffff, 0x9c9c9c, 0xffffff
YEL, YEL_D = 0xffd23f, 0xf0b52a

p = Prop('prop_bucket', base=BODY, target_faces=4200)
# wall + floor as one revolved section (outer down, across the floor, back up the inside)
wall = rounded([(0, 0), (RB, 0), (R, H), (R - T, H), (RB - T * 0.9, T * 1.3), (0, T * 1.3)], 0.07, n=4)
p.lathe(wall, seg=56)
p.ring((0, H - 0.01, 0), R - T * 0.4, 0.085, seg=56)               # rolled rim
p.ring((0, 0.06, 0), RB + 0.02, 0.06, seg=56)                     # foot ring
# side lugs the handle hangs from
for s in (-1, 1):
    p.blob((s * 0.98, H - 0.17, 0), (0.05, 0.09, 0.09), group='lug%d' % s)

# handle: own layer (stays yellow when the body is tinted), own bone
p.layer('handle', base=YEL, target_faces=900)
HY = H - 0.17
pts = [(-(R + 0.1) * math.cos(math.radians(a)), HY + (R + 0.1) * math.sin(math.radians(a)) * 0.92, 0) for a in range(0, 181, 10)]
p.tube(pts, 0.05, rseg=10)
for s in (-1, 1):
    p.blob((s * (R + 0.1), HY, 0), (0.055, 0.07, 0.07), group='pin%d' % s)
p.layer('skin')

# a white star sticker on the front (own layer: crisp edge, never tinted)
p.layer('deco', base=STAR, target_faces=500, voxel=0.012)
p.sticker(star_poly(0.27, inner=0.5), 0.64, lambda y: RB + (R - RB) * y / H, thick=0.05, lift=0.01)
p.layer('skin')

# ---- paint ----
inner_r = lambda y: (RB - T) + (R - RB) * y / H
inward = lambda q, n: (n.x * q.x + n.z * q.z) < -0.25 * math.hypot(q.x, q.z) or (n.y > 0.6 and q.y < H * 0.5)
p.paint_fn(lambda q, n: q.y < H - 0.07 and q.y > 0.03 and math.hypot(q.x, q.z) < inner_r(q.y) + 0.03 and inward(q, n), INSIDE)
p.paint_fn(lambda q, n: q.y > H - 0.1, RIM)
p.paint_fn(lambda q, n: q.y < 0.13, RIM)


p.layer('handle')
p.paint_fn(lambda q, n: abs(q.x) > R - 0.02 and q.y < HY + 0.1, YEL_D)
p.layer('skin')

# ---- rig ----
is_handle = lambda q: q.y > H + 0.02 or abs(q.x) > R + 0.045
p.bone('body', (0, 0, 0), (0, H, 0), region=lambda q: not is_handle(q))
p.bone('handle', (0, HY, 0), (0, HY + 1.0, 0), parent='body', region=is_handle)
p.extras['argMode'] = 'tint'
p.extras['argDefault'] = 0x4a90ff
p.extras['outline'] = 0.024
p.build()
