"""Swim ring (Where's Crab?): a fat torus, R 1.05, tube 0.36, lying flat (the game tilts it), red and white segments."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop

RED, WHITE = 0xff5a5a, 0xfffaf0
p = Prop('prop_ring', base=RED, target_faces=3000, voxel=0.018)
N = 8
def seg(i):
    a0, a1 = i / N * math.tau + 0.004, (i + 1) / N * math.tau - 0.004
    p.ring((0, 0, 0), 1.05, 0.36, seg=10, a0=a0, a1=a1, rseg=20)
for i in range(0, N, 2):
    seg(i)
p.layer('white', base=WHITE, target_faces=2400, voxel=0.018)
for i in range(1, N, 2):
    seg(i)
p.blob((0, 0.33, 1.05), (0.07, 0.06, 0.07), group='valve')
p.layer('skin')
p.bone('body', (0, -0.4, 0), (0, 0.4, 0))
p.extras['outline'] = 0.026
p.build()
