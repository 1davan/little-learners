"""Brick letters picture: O is for Owl. A round, cuddly little owl (about 2.3 tall): a soft egg-shaped body and head in
one, two pointy ear tufts, a pale face disc around the big code eyes, a little orange hooked beak, a cream belly with
three rows of soft feather marks, folded darker wings on the sides (wing.L / wing.R flap) and orange toes.
The head bone turns the top of the owl (owls swivel their heads)."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from lib import Creature
from kit import Prop

BROWN, BROWN_D, DISC, BELLY, MARK, BEAK, FEET, WING = 0xb07a4a, 0x93613a, 0xf6dfbf, 0xf3d9ae, 0xd2a46a, 0xffa23a, 0xff9a2e, 0x8a5634
c = Prop('prop_word_owl', base=BROWN, target_faces=8000, voxel=0.016)
c.quadriflow = False
HY = 1.62
c.blob((0, 0.95, 0), (0.78, 0.9, 0.68))                      # body
c.blob((0, HY, 0), (0.74, 0.6, 0.62))                       # head (melts into the body: owls have no neck)
c.blob((0, 0.5, 0.05), (0.72, 0.45, 0.62))                  # round bottom
for s in (-1, 1):
    g = 'tuft' + ('L' if s < 0 else 'R')
    c.blob((s * 0.47, HY + 0.55, -0.02), (0.14, 0.27, 0.11), rot=(0, 0, -s * 26), group=g)
    c.blob((s * 0.38, HY + 0.36, -0.02), (0.17, 0.15, 0.13), group=g)
c.paint_fn(lambda q, n: q.z < -0.3 and n.z < -0.3, BROWN_D)
for s in (-1, 1):
    c.decal('disc%d' % s, (s * 0.27, HY + 0.03), (0.33, 0.33, 0.25), DISC)
c.decal('belly', (0, 0.74), (0.5, 0.5, 0.3), BELLY)
# wings: their own meshes, so they read as folded wings with an ink edge
for s, n in ((-1, 'L'), (1, 'R')):
    c.layer('wing' + n, base=WING, target_faces=900, voxel=0.012)
    c.blob((s * 0.72, 1.0, 0.0), (0.2, 0.55, 0.42), rot=(0, s * 10, s * 10), group='w')
    c.blob((s * 0.76, 0.62, -0.02), (0.15, 0.3, 0.32), rot=(0, 0, s * 22), group='w')
    c.paint_fn(lambda q, n, s=s: q.y < 0.72 and q.y > 0.5 and abs(q.x) > 0.8, BROWN_D)
# soft feather marks on the belly: little smiles in three rows
c.layer('marks', base=MARK, target_faces=900, voxel=0.007)
for row, (y, xs) in enumerate([(1.0, (-0.2, 0.0, 0.2)), (0.78, (-0.3, -0.1, 0.1, 0.3)), (0.56, (-0.2, 0.0, 0.2))]):
    for x in xs:
        pts = []
        for k in range(7):
            a = math.radians(200 + k * 140 / 6)
            px, py = x + math.cos(a) * 0.075, y + math.sin(a) * 0.06
            pz = math.sqrt(max(0.0, 0.62 ** 2 * (1 - (px / 0.8) ** 2) - (py - 0.85) ** 2 * 0.35)) + 0.06
            pts.append((px, py, pz))
        c.tube(pts, 0.018, rseg=6)
# beak and toes
c.layer('beak', base=BEAK, target_faces=500, voxel=0.008)
c.blob((0, HY - 0.08, 0.62), (0.1, 0.1, 0.1), group='b')
c.blob((0, HY - 0.2, 0.66), (0.06, 0.09, 0.07), rot=(25, 0, 0), group='b')
c.layer('toes', base=FEET, target_faces=600, voxel=0.01)
for s in (-1, 1):
    for k in (-1, 0, 1):
        c.blob((s * 0.25 + k * 0.1, 0.07, 0.52 + (0.04 if k == 0 else 0)), (0.06, 0.06, 0.11), group='t%d%d' % (s, k))
c.layer('skin')
# rig
c.bone('body', (0, 0.15, 0), (0, 1.25, 0))
c.bone('head', (0, 1.25, 0), (0, 2.3, 0), parent='body', region=lambda q: q.y > 1.22)
for s, n in ((-1, 'L'), (1, 'R')):
    c.bone('wing.' + n, (s * 0.62, 1.38, -0.02), (s * 0.82, 0.55, -0.02), parent='body', region=lambda q, s=s: q.x * s > 0.55)
c.face(center=(0, HY + 0.04, 0.05), radius=0.6, faceScale=1.12, mouth=0)
c.extras['outline'] = 0.026
c.build()
