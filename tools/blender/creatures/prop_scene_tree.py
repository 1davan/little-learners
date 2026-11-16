"""Round toy tree (scenery makeTree): a chunky tapered trunk with root toes and a knot hole, under a soft lumpy
canopy (about 3.4 wide, top at 3.95, front at z ~1.25 like the old sphere tree, so apples hung on it by callers
still sit on the leaves). Layers:
  skin    trunk (bark brown, never tinted)
  leaves  canopy, painted white with a soft grey underside: makeTree's leaf colour tints it (argMode 'tint')
  snow    white caps with drippy edges on every lump (makeTree snow: true)
  apples  seven shiny red apples with stalks (makeTree apples > 0)"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

BARK, BARK_D, HOLE = 0x9a6542, 0x80522f, 0x4a2c1c
LEAF, LEAF_D = 0xffffff, 0xcfd3cf
APPLE, APPLE_HI, STALK, LEAFG = 0xff4b4b, 0xff8f8f, 0x6a4326, 0x5fbf4a

# canopy lumps (x, y, z, r): a big round crown, side lumps and a few front/back lumps for depth
LUMPS = [(0, 2.68, 0, 1.28), (-0.98, 2.2, 0.08, 0.84), (1.0, 2.26, 0.0, 0.88), (-0.6, 3.12, -0.12, 0.74),
         (0.62, 3.1, -0.05, 0.76), (0.05, 2.0, 0.42, 0.78), (0.0, 2.75, -0.7, 0.95)]

p = Prop('prop_scene_tree', base=BARK, target_faces=420, voxel=0.02, smooth=5)
# trunk: tapered, a little wider at the foot, running up into the crown
prof = rounded([(0, 0), (0.36, 0), (0.3, 0.35), (0.24, 1.3), (0.21, 2.3), (0, 2.3)], 0.08, n=4)
p.lathe(prof, seg=28)
for i, a in enumerate((0.5, 2.6, 4.4)):
    p.capsule((0.18 * math.sin(a), 0.16, 0.18 * math.cos(a)), (0.44 * math.sin(a), 0.06, 0.44 * math.cos(a)), 0.12, r2=0.08, group='root%d' % i)
p.capsule((0.05, 1.45, 0), (-0.55, 2.15, 0.1), 0.11, r2=0.08, group='br1')
p.capsule((0.05, 1.6, 0), (0.6, 2.25, 0.05), 0.1, r2=0.07, group='br2')
p.decal('hole', (0.02, 0.95), (0.1, 0.14, 0.2), HOLE)
p.paint_fn(lambda q, n: q.y < 0.12, BARK_D)

# ---- canopy (tinted) ----
p.layer('leaves', base=LEAF, target_faces=1000, voxel=0.024)
for i, (x, y, z, r) in enumerate(LUMPS):
    p.blob((x, y, z), (r, r * 0.95, r), group='l%d' % i)
p.paint_fn(lambda q, n: q.y < 2.0 + 0.08 * math.sin(q.x * 4 + q.z * 3) and n.y < 0.2, LEAF_D)


def front(x, y):
    """z of the canopy's front surface at (x, y)"""
    best = -9
    for lx, ly, lz, r in LUMPS:
        d2 = r * r - (x - lx) ** 2 - ((y - ly) / 0.95) ** 2
        if d2 > 0:
            best = max(best, lz + math.sqrt(d2))
    return best


# ---- snow caps ----
p.layer('snow', base=0xffffff, target_faces=700, voxel=0.02)
for i, (x, y, z, r) in enumerate(LUMPS[:5]):
    # a thin crust over the top third of each lump, with a few soft drips on the front and sides
    p.blob((x, y + r * 0.5, z), (r * 0.94, r * 0.5, r * 0.94), group='s%d' % i)
    for k, a in enumerate((-1.1, -0.35, 0.4, 1.15)):
        a += i * 0.4
        rr = r * 0.86
        p.blob((x + rr * math.sin(a), y + r * (0.4 if k % 2 else 0.33), z + rr * math.cos(a)), (r * 0.15, r * 0.19, r * 0.15), group='s%d' % i)

# ---- apples ----
p.layer('apples', base=APPLE, target_faces=1100, voxel=0.012)
APPLES = [(-0.78, 2.65), (0.45, 3.15), (0.05, 2.18), (0.92, 2.42), (-0.32, 3.3), (-1.3, 2.05), (1.32, 1.95)]
for i, (x, y) in enumerate(APPLES):
    z = front(x, y) + 0.06
    p.blob((x, y, z), (0.2, 0.19, 0.2), group='a%d' % i)
    p.capsule((x, y + 0.14, z), (x + 0.03, y + 0.27, z), 0.025, group='st%d' % i)
    if i % 3 == 0:
        p.blob((x + 0.1, y + 0.22, z), (0.08, 0.03, 0.05), rot=(0, 0, -30), group='lf%d' % i)
STALKS = [(x, y, front(x, y) + 0.06) for x, y in APPLES]
p.paint_fn(lambda q, n: any(((q.x - x - 0.1) / 0.1) ** 2 + ((q.y - y - 0.22) / 0.06) ** 2 < 1 and abs(q.z - z) < 0.09 for x, y, z in STALKS[::3]), LEAFG)
p.paint_fn(lambda q, n: any(abs(q.x - x - 0.015) < 0.045 and q.y > y + 0.13 and abs(q.z - z) < 0.05 for x, y, z in STALKS), STALK)
p.paint_fn(lambda q, n: any((q.x - x + 0.07) ** 2 + (q.y - y - 0.07) ** 2 < 0.05 ** 2 and q.z > z for x, y, z in STALKS), APPLE_HI)

p.layer('skin')
p.bone('body', (0, 0, 0), (0, 3.9, 0))
p.extras['argMode'] = 'tint'
p.extras['argDefault'] = 0x58c45e
p.extras['outline'] = 0.03
p.build()
