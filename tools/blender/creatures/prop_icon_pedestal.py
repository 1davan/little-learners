"""Home menu pedestal: a plump soft-toy disc (tintable with the game's colour). Top radius ~1.36, foot radius 1.45, top
at y 0.22 (the home screen's PED_TOP). A cream piping cord rolls round the top edge and a ring of white stitches runs
round the top, like a sewn felt cushion."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

TOP, SIDE, UNDER, PIPE, STITCH = 0xffffff, 0xdedede, 0xb8b8b8, 0xfff6e2, 0xffffff
p = Prop('prop_icon_pedestal', base=TOP, target_faces=2400, voxel=0.012)
prof = [(0, 0.0), (1.4, 0.0), (1.47, 0.07), (1.46, 0.15), (1.39, 0.205), (1.0, 0.222), (0, 0.226)]
p.lathe(rounded(prof, 0.05, n=4), seg=72)
p.paint_fn(lambda q, n: n.y < 0.55, SIDE)
p.paint_fn(lambda q, n: q.y < 0.035, UNDER)

p.layer('piping', base=PIPE, target_faces=800, voxel=0.012)
p.ring((0, 0.195, 0), 1.385, 0.048, seg=96, rseg=10)
p.ring((0, 0.03, 0), 1.425, 0.04, seg=96, rseg=10)

p.layer('stitch', base=STITCH, target_faces=1200, voxel=0.01)
N, RS = 26, 1.18
for i in range(N):
    a = math.tau * (i + 0.5) / N
    a0, a1 = a - 0.07, a + 0.07
    p.tube([(RS * math.sin(a0), 0.222, RS * math.cos(a0)), (RS * math.sin(a1), 0.222, RS * math.cos(a1))], 0.022, rseg=8)   # half sunk: clean dashes
p.layer('skin')
p.bone('body', (0, 0, 0), (0, 0.22, 0))
p.extras['argMode'] = 'tint'
p.extras['argDefault'] = 0x5fd068
p.extras['outline'] = 0.026
p.build()
