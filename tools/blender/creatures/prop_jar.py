"""Big glass sweetie jar (Which has more?, level 2), the old holder's size: 4.3 wide, 3.0 tall, 1.1 deep, origin on the
sand; its floor (top of the base) is at y 0.14. Layers: skin = lid with a knob and a ribbon band (tintable,
argMode 'tint'); 'base' a pale-blue base slab; 'frame' white rounded corner posts; 'glass' the see-through walls
(the game makes it transparent and hides its outline). The lid (and knob) is on bone 'lid' (head at the rim
centre), so the game can lift it to drop things in."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

W, H, D, FL = 4.3, 3.0, 1.1, 0.14
p = Prop('prop_jar', base=0xffffff, target_faces=1400, voxel=0.02, smooth=3)
p.box((0, H + 0.12, 0), (W / 2 + 0.22, 0.12, D / 2 + 0.12), bevel=0.1)          # lid
p.box((0, H + 0.27, 0), (W / 2 + 0.05, 0.06, D / 2 - 0.02), bevel=0.05)
p.blob((0, H + 0.42, 0), (0.24, 0.16, 0.22), group='knob')
p.paint_fn(lambda q, n: q.y < H + 0.07, 0xdcdcdc)
p.layer('base', base=0xbfe6f5, target_faces=500, voxel=0.02)
p.box((0, FL / 2, 0), (W / 2 + 0.15, FL / 2, D / 2 + 0.08), bevel=0.06)
p.layer('frame', base=0xfffaf0, target_faces=700, voxel=0.016)
for x in (-W / 2, W / 2):
    for z in (-D / 2, D / 2):
        p.cyl((x, FL - 0.02, z), 0.07, H - FL - 0.02, bevel=0.03, seg=12)
p.layer('glass', base=0xd8f4ff, target_faces=600, voxel=0.02)
p.quadriflow = False
for z in (-D / 2, D / 2):
    p.box((0, (H - 0.05 + FL) / 2, z), (W / 2, (H - 0.05 - FL) / 2, 0.025), bevel=0.02)
for x in (-W / 2, W / 2):
    p.box((x, (H - 0.05 + FL) / 2, 0), (0.025, (H - 0.05 - FL) / 2, D / 2), bevel=0.02)
p.layer('shine', base=0xffffff, target_faces=200, voxel=0.012)
p.quadriflow = False
for x, h in ((-W / 2 + 0.35, 1.6), (-W / 2 + 0.6, 0.6)):
    p.box((x, FL + 0.5 + h / 2, D / 2 + 0.03), (0.05, h / 2, 0.015), bevel=0.012)
p.layer('skin')
islid = lambda q: q.y > H - 0.03
p.bone('root', (0, 0, 0), (0, H, 0), region=lambda q: not islid(q))
p.bone('lid', (0, H, 0), (0, H + 0.6, 0), parent='root', region=islid)
p.extras['argMode'] = 'tint'
p.extras['argDefault'] = 0x4a90ff
p.extras['outline'] = 0.024
p.build()
