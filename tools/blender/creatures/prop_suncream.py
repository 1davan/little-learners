"""Sun cream bottle (Bear's nose: the 'nose' gear tool). Upright, facing +z, about 1.0 tall, origin at the bottom
centre. A chunky soft squeezy bottle standing on its white flip cap (sun cream style), sunny orange, with a white
oval sky-blue label carrying a round yellow sun with short rays. She drags it to the nose; it squeezes a dab of cream on."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop

ORANGE, WHITE, SUN, LABEL = 0xff9a3c, 0xfffaf0, 0xffd23f, 0x8fd8ff
p = Prop('prop_suncream', base=ORANGE, target_faces=1800, voxel=0.012, smooth=4)
# the body: a soft rounded slab, a little narrower at the shoulders
p.box((0, 0.56, 0), (0.25, 0.33, 0.13), bevel=0.12)
p.box((0, 0.9, 0), (0.2, 0.06, 0.11), bevel=0.06)
p.layer('cap', base=WHITE, target_faces=500, voxel=0.01)
p.cyl((0, 0.0, 0), 0.17, 0.24, r2=0.19, bevel=0.08, scale=(1.0, 0.75))
p.cyl((0, 0.93, 0), 0.07, 0.09, bevel=0.03)       # the nozzle tip on top
p.layer('label', base=LABEL, target_faces=400, voxel=0.008)
p.quadriflow = False
p.cyl((0, 0.57, 0.1), 0.165, 0.045, rot=(90, 0, 0), scale=(1.0, 1.25), bevel=0.015, seg=48)
p.layer('sun', base=SUN, target_faces=1200, voxel=0.006)
p.resolution = 0.008
p.blob((0, 0.57, 0.152), (0.075, 0.075, 0.02), group='disc')
for i in range(8):
    a = 2 * math.pi * i / 8
    p.blob((0.128 * math.cos(a), 0.57 + 0.128 * math.sin(a), 0.15), (0.035, 0.02, 0.018), rot=(0, 0, math.degrees(a)), group='ray%d' % i)
p.layer('skin')
p.bone('root', (0, 0, 0), (0, 1.0, 0))
p.extras['outline'] = 0.014
p.build()
