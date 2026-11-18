"""Little butterfly (scenery makeButterfly: the farm / dress-up flutterers), about 0.9 across, flying along +z with its
wings lying flat (in the xz plane). The game flaps the two wings about the body axis (z), so only the RIGHT wing (+x)
is modelled; the game mirrors it for the left. Layers:
  skin  the body: a soft segmented plum body, round head and two curly antennae with knobs
  wing  the right wing (front and back lobes), white with a soft grey rim: makeButterfly's colour tints it
  dots  white spots on the right wing (never tinted)
  wingL, dotsL  the mirrored left wing and dots, for direct uses only (the game mirrors 'wing' / 'dots' itself)
The glb's rest pose pitches the body up 62 degrees (bind pose unchanged), so a direct use shows it facing the viewer."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop

BODY, BODY_L = 0x3a2838, 0x5a4458
p = Prop('prop_scene_butterfly', base=BODY, target_faces=450, voxel=0.006, smooth=3)
for z, r in ((-0.14, 0.026), (-0.08, 0.034), (-0.02, 0.037), (0.04, 0.035)):
    p.blob((0, 0, z), (r, r, r * 1.3), group='body')
p.blob((0, 0.012, 0.1), (0.05, 0.048, 0.046), group='head')
for s in (-1, 1):
    p.tube([(s * 0.02, 0.04, 0.11), (s * 0.05, 0.1, 0.17), (s * 0.075, 0.15, 0.22), (s * 0.1, 0.17, 0.26)], 0.016, rseg=6)
    p.blob((s * 0.105, 0.175, 0.27), (0.03, 0.03, 0.03), group='knob%d' % s)
p.paint_fn(lambda q, n: q.z < 0.06 and abs(math.sin(q.z * 52)) > 0.82 and q.y > 0, BODY_L)

p.layer('wing', base=0xffffff, target_faces=500, voxel=0.007)
WING = [((0.2, 0.0, 0.085), (0.2, 0.022, 0.135), -22), ((0.15, -0.005, -0.1), (0.13, 0.02, 0.095), 28)]
for k, (c, sz, yaw) in enumerate(WING):
    p.blob(c, sz, rot=(0, yaw, 0), group='lobe%d' % k)


def rim(q, n):
    # the outer edge of either lobe (in its own ellipse frame) is a darker band
    for (cx, cy, cz), (sx, sy, sz), yaw in WING:
        a = math.radians(yaw)
        dx, dz = q.x - cx, q.z - cz
        lx, lz = dx * math.cos(a) - dz * math.sin(a), dx * math.sin(a) + dz * math.cos(a)
        e = (lx / sx) ** 2 + (lz / sz) ** 2
        if e < 1.15 and e > 0.55 and (lx > 0 or k_out(lx, lz, sx)):
            return True
    return False


def k_out(lx, lz, sx):
    return abs(lz) > sx * 0.5


p.paint_fn(rim, 0xa8a8a8)
p.layer('dots', base=0xffffff, target_faces=240, voxel=0.006)
for x, z, r in ((0.31, 0.12, 0.042), (0.2, 0.17, 0.03), (0.2, -0.13, 0.034)):
    p.blob((x, 0.018, z), (r, 0.01, r), group='d%d%d' % (int(x * 100), int(z * 100)))
# the LEFT wing and its dots, mirrored: only for direct uses of the kind (makeButterfly mirrors 'wing' / 'dots' itself
# and never draws these), so the model on its own is a whole, symmetric butterfly
p.layer('wingL', base=0xffffff, target_faces=500, voxel=0.007)
for k, (c, sz, yaw) in enumerate(WING):
    p.blob((-c[0], c[1], c[2]), sz, rot=(0, -yaw, 0), group='lobe%d' % k)
p.paint_fn(lambda q, n: rim(type(q)((-q.x, q.y, q.z)), n), 0xa8a8a8)
p.layer('dotsL', base=0xffffff, target_faces=240, voxel=0.006)
for x, z, r in ((0.31, 0.12, 0.042), (0.2, 0.17, 0.03), (0.2, -0.13, 0.034)):
    p.blob((-x, 0.018, z), (r, 0.01, r), group='d%d%d' % (int(x * 100), int(z * 100)))
p.layer('skin')

p.bone('body', (0, 0, -0.2), (0, 0, 0.2))
p.extras['argMode'] = 'tint'
p.extras['argDefault'] = 0xff8fc0
p.extras['outline'] = 0.01
path = p.build()
# rest pose (bind pose unchanged): pitched up 62 degrees and lifted, so a direct use shows it facing the viewer with its
# wings spread like a sticker, while scenery.js (raw layer geometry) keeps its flat flyer
from glbpost import Glb
Glb(path).move('body', lift=(0, 0.3, 0), turn_x=-62).save()
