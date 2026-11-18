"""Toy steam engine (Pattern parade, level 2), facing +x. Origin on the rails under its middle. Tintable boiler
(argMode 'tint') with gold bands and a steam dome, a dark smokebox with a big lamp, a flared chimney on bone 'chimney'
(the game puffs it by scaling), a red open cab (roof on four posts, low walls) whose seat is at (-0.45, 0.3, 0) for
the driver, a cow-catcher, and big red wheels with yellow hubs on bones 'wheel.F' / 'wheel.B'."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

BOIL, GOLD, DARK, RED, ROOF, HUB, LAMP = 0xffffff, 0xffc23f, 0x4a3a52, 0xff5a5a, 0x4a3a52, 0xffd23f, 0xfff3a8
p = Prop('prop_engine', base=BOIL, target_faces=2400, voxel=0.02, smooth=3)
# boiler along x
p.cyl((-0.15, 0.6, 0), 0.4, 1.05, rot=(0, 0, -90), bevel=0.05, seg=36)
p.blob((0.25, 1.02, 0), (0.17, 0.12, 0.17), group='dome')
p.paint_fn(lambda q, n: any(abs(q.x - x) < 0.045 for x in (0.05, 0.55)) and q.y > 0.2, 0xdcdcdc)
p.layer('gold', base=GOLD, target_faces=600, voxel=0.014)
for x in (0.05, 0.55):
    p.ring((x, 0.6, 0), 0.41, 0.035, rot=(0, 0, 90), seg=36, rseg=8)
p.blob((0.25, 1.15, 0), (0.08, 0.05, 0.08), group='domecap')
p.layer('dark', base=DARK, target_faces=1300, voxel=0.016)
p.cyl((0.88, 0.6, 0), 0.42, 0.14, rot=(0, 0, -90), bevel=0.05, seg=36)              # smokebox front
p.box((0.05, 0.17, 0), (0.95, 0.09, 0.42), bevel=0.04)                             # running board
for s in (-1, 1):                                                                   # cow-catcher
    p.box((1.08, 0.13, s * 0.14), (0.1, 0.08, 0.14), rot=(0, s * 35, 0), bevel=0.03)
p.layer('chimney', base=DARK, target_faces=500, voxel=0.014)
p.lathe(rounded([(0, 0.95), (0.13, 0.95), (0.12, 1.32), (0.2, 1.46), (0.2, 1.5), (0, 1.5)], 0.03, n=3), pos=(0.62, 0, 0), seg=28)
p.layer('lamp', base=LAMP, target_faces=200, voxel=0.01)
p.blob((1.0, 0.88, 0), (0.06, 0.08, 0.08), group='lamp')
p.layer('cab', base=RED, target_faces=1200, voxel=0.016)
CX = -0.48
p.box((CX, 0.32, 0), (0.36, 0.05, 0.44), bevel=0.03)                               # floor
p.box((CX - 0.33, 0.62, 0), (0.04, 0.32, 0.44), bevel=0.03)                        # back wall
for z in (-1, 1):
    p.box((CX, 0.5, z * 0.42), (0.36, 0.18, 0.035), bevel=0.03)                    # low side walls
    for x in (CX - 0.31, CX + 0.31):
        p.box((x, 0.9, z * 0.4), (0.04, 0.24, 0.04), bevel=0.02)                   # posts
p.layer('roof', base=ROOF, target_faces=400, voxel=0.016)
p.box((CX, 1.17, 0), (0.46, 0.05, 0.54), rot=(0, 0, 0), bevel=0.04)
p.layer('wheels', base=RED, target_faces=900, voxel=0.014)
WH = ((-0.45, 0.24), (0.5, 0.24))
for x, r in WH:
    for z in (-1, 1):
        p.cyl((x, 0.12, z * 0.42), r, 0.1, rot=(90 * z, 0, 0), bevel=0.03, seg=28)
p.layer('hubs', base=HUB, target_faces=240, voxel=0.01)
for x, r in WH:
    for z in (-1, 1):
        p.blob((x, 0.12, z * 0.53), (0.08, 0.08, 0.035), group='h%d%d' % (x * 10, z))
p.layer('skin')
wheel = lambda x: (lambda q: abs(q.x - x) < 0.27 and q.y < 0.38 and abs(q.z) > 0.36)   # (no connecting rod: spun with the wheels it broke into ink cracks)
chim = lambda q: q.y > 0.97 and abs(q.x - 0.62) < 0.22
p.bone('root', (0, 0, 0), (0, 0.6, 0), region=lambda q: not (wheel(-0.45)(q) or wheel(0.5)(q) or chim(q)))
p.bone('wheel.F', (0.5, 0.12, 0), (0.5, 0.42, 0), parent='root', region=wheel(0.5))
p.bone('wheel.B', (-0.45, 0.12, 0), (-0.45, 0.42, 0), parent='root', region=wheel(-0.45))
p.bone('chimney', (0.62, 0.97, 0), (0.62, 1.5, 0), parent='root', region=chim)
p.extras['argMode'] = 'tint'
p.extras['argDefault'] = 0x4ab0ff
p.extras['outline'] = 0.022
p.build()
