"""Pip's rainy-day sou'wester (worn on Pip's head bone, see app/src/engine/piphat.js). Shiny sky-blue so it reads on a
yellow chick: a domed crown with stitched seams and a button, fitting over Pip's head (opening 0.82 x 0.74 at y 0), and a
soft brim that is a little longer at the back and droops gently, with a paler rim.
Hat space: base of the crown at y 0, front +z."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

BLUE, BLUE_D, BLUE_L, SEAM, RIM = 0x4fa8ff, 0x3a86e0, 0x8cc8ff, 0x2f74c8, 0xbfe2ff
SZ = 0.9
p = Prop('prop_pip_rainhat', base=BLUE, target_faces=2600, voxel=0.013)
p.lathe(rounded([(0, -0.02), (0.82, -0.02), (0.81, 0.16), (0.72, 0.38), (0.45, 0.52), (0, 0.55)], 0.16, n=5), scale=(1, SZ), seg=56)
# sou'wester brim: slopes down and out all round, deeper at the back (rain runs off), with a soft rolled rim
top = [(0.74, 0.08), (0.88, 0.03), (1.0, -0.05), (1.1, -0.14), (1.17, -0.22)]
bot = [(r - 0.012 * i, y - 0.05) for i, (r, y) in enumerate(top)]
p.lathe(rounded(top + [(1.2, -0.25)] + list(reversed(bot)), 0.022, n=2, closed=True), pos=(0, 0, -0.07), scale=(1, SZ * 1.08), seg=64, closed=True)
p.blob((0, 0.555, 0), (0.08, 0.04, 0.08), group='btn')
p.paint_fn(lambda q, n: n.y < -0.35, BLUE_D)
p.paint('shine', (-0.32, 0.4, 0.42), (0.14, 0.1, 0.13), BLUE_L)
# a pale rolled rim and a soft stitched band where the brim meets the crown
p.layer('rim', base=RIM, target_faces=900, voxel=0.011)
p.lathe([(0.8, 0.05), (0.845, 0.05), (0.84, 0.14), (0.8, 0.14)], scale=(1, SZ), seg=56, closed=True)
p.layer('skin')
p.bone('body', (0, 0, 0), (0, 0.6, 0))
p.extras['outline'] = 0.02
p.build()
