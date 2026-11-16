"""Sky rainbow (scenery makeRainbow), modelled at unit size: a half-arch of outer radius 1.0 standing on y = 0, facing +z,
six soft rounded bands (red, orange, yellow, green, blue, violet) melted side by side like squeezed clay, each band
painted crisp. The game scales it by makeRainbow's radius and shows it unlit far behind the scene."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop

COLS = [0xff6b6b, 0xffa94d, 0xffe066, 0x8ce99a, 0x74c0fc, 0xb197fc]
W = 0.0375                       # band width (the old rainbow's 0.9 at radius 24)
p = Prop('prop_scene_rainbow', base=COLS[0], target_faces=1500, voxel=0.0045, smooth=4)
for i in range(6):
    R = 1.0 - W * 0.5 - i * W
    pts = [(R * math.cos(math.pi * k / 72), R * math.sin(math.pi * k / 72) - 0.02, 0) for k in range(73)]
    p.tube(pts, W * 0.56, rseg=10)
for i, c in enumerate(COLS[1:], 1):
    p.paint_fn(lambda q, n, i=i: math.hypot(q.x, q.y + 0.02) < 1.0 - i * W, c)
p.bone('body', (0, 0, 0), (0, 1, 0))
p.extras['outline'] = 0.004
p.build()
