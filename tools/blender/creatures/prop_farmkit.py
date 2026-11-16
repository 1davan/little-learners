"""The farm kit: props for Barn band, Who says moo?, Grow a flower and Peekaboo pots, one model each.
ONLY=prop_cowbell,prop_farmspoon tools/blender/build.sh prop_farmkit builds a subset. Game space, origin as noted.
Layers called 'accent' / 'lid' / 'handles' are painted white so the game can colour them per instrument in code.

Barn band (unit size; the game scales):
  prop_cowbell    stand + bell. Origin = the ground under the stand, as the old code cowbell (s = 1): a wooden post at
                  x -1.0 (z -0.2) 3.3 tall with a bar across the top to x +0.25; the bell hangs from the pivot
                  (0, 3.2, -0.2) on bone 'swing' (rotation.z swings it). Skin = the gold bell (tint white: unique
                  material, so the game can flash it); 'accent' = strap + band.
  prop_milkchurn  milk churn, origin on the ground: body r 1.0 to y 1.5, shoulder, neck r 0.55, lid (layer 'lid') at
                  2.18, knob 2.3, two grey bands and side handles. Skin = the steel body (flashable).
  prop_cookpot    cooking pot, rim radius 1.0 at y 0.88, hollow with a dark inside, a rolled rim, a shine streak and
                  two loop handles (layer 'handles'). Skin = the steel body (flashable).
  prop_farmspoon      wooden spoon hanging from its handle end (origin), 1.0 long down -y, bowl at the bottom.
  prop_farmegg    egg 0.38 wide x 0.5 tall centred on the origin, tintable (white / brown eggs), a few speckles.
  prop_farmberry      a plump berry r 0.15 (tintable) with a little green star cap.
  prop_farmpea        a shiny round pea r 0.13 (tintable green) with a tiny curly stalk.
Grow a flower / Peekaboo pots:
  prop_farmrock   a chunky soft boulder ~1.1 x 0.7 x 0.95 on the ground, a lighter top and a moss patch.
  prop_farmcabbage    a round cabbage r ~0.42 on the ground: a pale heart wrapped in curling outer leaves.
  prop_farmsock       a red-and-white striped sock standing on its heel (leg up to y 1.35, foot toward +z).
  prop_farmsnail      a snail: soft green body along +x, an orange swirl shell, eye stalks, a code face on its head.
Who says moo? spots (origin = the spot centre on the ground unless noted):
  prop_farmhedge      a trimmed hedge block 3.0 x 2.3 x 0.95 with a bumpy top and little white flowers (origin at its
                  bottom centre).
  prop_farmbush       a round leafy bush r ~0.5 (origin on the ground).
  prop_haycart    a hay cart: bed 2.4 x 0.5 x 1.2 at y 0.95 loaded with hay, two wheels on its front side, a shaft
                  (origin on the ground under the bed's middle).
  prop_trough     a wooden water trough 1.6 x 0.6 x 0.62 on two feet, water inside (origin on the ground, centre).
  prop_barnwall   a red barn wall 2.8 x 2.6 with a white-trimmed X door and roof eaves (origin on the ground, centre
                  of the wall's front face at z 0).
  prop_penfence   the pen: five posts and rails (back and both sides), 2.95 wide (origin = pen centre).
  prop_cartwheel  a wooden cart wheel r 0.9 standing in the x-y plane, six spokes and a yellow hub (origin = hub).
"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded
from mathutils import Vector, Matrix

ONLY = [k for k in os.environ.get('ONLY', '').split(',') if k]
want = lambda n: not ONLY or n in ONLY
WOOD, WOOD_D, WOOD_L = 0xa86f3a, 0x8a5228, 0xc98a50


def cowbell():
    H = 3.3
    p = Prop('prop_cowbell', base=0xf2b51d, target_faces=1400, voxel=0.016, smooth=3)
    # the bell: a soft four-sided flared bell, wide at the mouth
    by0, by1 = H - 0.1 - 0.4 - 1.15, H - 0.1 - 0.4
    V, F = [], []
    rows = 10
    for i in range(rows + 1):
        t = i / rows
        y = by1 - (by1 - by0) * t
        r = 0.42 + (0.75 - 0.42) * t ** 1.3
        for k in range(32):
            a = k / 32 * math.tau + math.pi / 4
            sq = 1 / max(abs(math.cos(a)), abs(math.sin(a))) ** 0.75      # rounded square
            V.append((r * sq * math.cos(a) * 0.82, y, -0.2 + r * sq * math.sin(a) * 0.82))
    for i in range(rows):
        for k in range(32):
            k2 = (k + 1) % 32
            F.append((i * 32 + k, i * 32 + k2, (i + 1) * 32 + k2, (i + 1) * 32 + k))
    c0 = len(V); V.append((0, by1 + 0.02, -0.2)); c1 = len(V); V.append((0, by0 + 0.05, -0.2))
    for k in range(32):
        F.append((c0, (k + 1) % 32, k)); F.append((c1, rows * 32 + k, rows * 32 + (k + 1) % 32))
    p.mesh(V, F)
    p.paint_fn(lambda q, n: q.y < by0 + 0.06 and n.y < -0.5, 0x5a3a20)                 # the dark mouth
    p.paint_fn(lambda q, n: q.y < by0 + 0.12 and n.y > -0.5, 0xd99a12)                 # a deeper lip
    p.layer('accent', base=0xffffff, target_faces=500, voxel=0.012)
    p.box((0, H - 0.3, -0.2), (0.07, 0.22, 0.04), bevel=0.03)                          # strap
    yb = by1 - 0.3
    rb = 0.42 + 0.33 * (0.3 / 1.15) ** 1.3
    p.lathe(rounded([(0, yb - 0.07), (rb * 0.98, yb - 0.07), (rb * 1.0, yb + 0.07), (0, yb + 0.07)], 0.02, n=2), pos=(0, 0, -0.2), seg=4, rot=(0, 45, 0))
    p.layer('stand', base=WOOD, target_faces=1000, voxel=0.016)
    p.cyl((-1.0, 0, -0.2), 0.11, H, r2=0.09, bevel=0.03, seg=14)
    p.tube([(-1.0, H - 0.05, -0.2), (0.25, H - 0.05, -0.2)], 0.08, rseg=10)
    p.box((-1.0, 0.07, -0.2), (0.45, 0.07, 0.35), bevel=0.05)
    p.blob((0.0, H - 0.05, -0.2), (0.1, 0.1, 0.1), group='hook')
    p.paint_fn(lambda q, n: q.y < 0.16, WOOD_D)
    p.layer('clapper', base=0x6b4424, target_faces=120, voxel=0.01)
    p.blob((0, by0 - 0.06, -0.2), (0.13, 0.13, 0.13), group='cl')
    p.layer('skin')
    swing = lambda q: q.x > -0.62 and q.y < H - 0.17
    p.bone('body', (-1.0, 0, -0.2), (-1.0, H, -0.2), region=lambda q: not swing(q))
    p.bone('swing', (0, H - 0.1, -0.2), (0, H + 0.4, -0.2), parent='body', region=swing)
    p.extras['argMode'] = 'tint'; p.extras['argDefault'] = 0xffffff
    p.extras['outline'] = 0.024
    p.build()


def churn():
    p = Prop('prop_milkchurn', base=0xc9d1dc, target_faces=1800, voxel=0.016, smooth=3)
    p.lathe(rounded([(0, 0), (0.98, 0), (1.0, 1.5), (0.55, 1.92), (0.55, 2.16), (0, 2.16)], 0.08, n=3), seg=48)
    p.paint_fn(lambda q, n: q.x < -0.3 and q.z > 0.3 and abs(q.x * 0.6 + q.z * 0.25 + 0.55) < 0.06 and 0.15 < q.y < 1.4, 0xeef2f6)
    p.paint_fn(lambda q, n: q.y > 1.9, 0xb0b9c6)
    p.layer('bands', base=0x8a94a6, target_faces=900, voxel=0.013)
    for y in (0.2, 1.3):
        p.ring((0, y, 0), 1.0, 0.05, seg=56, rseg=8)
    for s in (-1, 1):
        p.tube([(s * 0.86, 1.6, -0.18), (s * 1.14, 1.66, -0.12), (s * 1.14, 1.66, 0.12), (s * 0.86, 1.6, 0.18)], 0.05, rseg=8)
    p.layer('lid', base=0xffffff, target_faces=600, voxel=0.012)
    p.cyl((0, 2.12, 0), 0.62, 0.11, bevel=0.04, seg=40)
    p.blob((0, 2.3, 0), (0.12, 0.1, 0.12), group='knob')
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 2.3, 0))
    p.extras['argMode'] = 'tint'; p.extras['argDefault'] = 0xffffff
    p.extras['outline'] = 0.026
    p.build()


def cookpot():
    p = Prop('prop_cookpot', base=0xb9c3d1, target_faces=1800, voxel=0.016, smooth=3)
    outer = [(0, 0), (0.9, 0), (0.97, 0.06), (1.0, 0.86)]
    inner = [(0.92, 0.86), (0.9, 0.16), (0.0, 0.14)]
    p.lathe(rounded(outer + inner, 0.04, n=3), seg=56)
    p.paint_fn(lambda q, n: q.y > 0.1 and math.hypot(q.x, q.z) < 0.93 and (n.x * q.x + n.z * q.z) < 0.1 * math.hypot(q.x, q.z), 0x4a5060)
    p.paint_fn(lambda q, n: q.x < -0.2 and q.z > 0.3 and abs(q.x * 0.55 + q.z * 0.3 + 0.62) < 0.06 and 0.12 < q.y < 0.75, 0xffffff)
    p.layer('rim', base=0x8a94a6, target_faces=700, voxel=0.012)
    p.ring((0, 0.87, 0), 0.97, 0.06, seg=56, rseg=8)
    p.layer('handles', base=0xffffff, target_faces=600, voxel=0.012)
    for s in (-1, 1):
        p.ring((s * 1.12, 0.68, 0), 0.2, 0.06, rot=(0, 90, 90), seg=20, rseg=8)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 0.9, 0))
    p.extras['argMode'] = 'tint'; p.extras['argDefault'] = 0xffffff
    p.extras['outline'] = 0.026
    p.build()


def spoon():
    p = Prop('prop_farmspoon', base=0xd9a05b, target_faces=500, voxel=0.01, smooth=3)
    p.quadriflow = False
    p.tube([(0, 0, 0), (0, -0.45, 0), (0, -0.92, 0)], [0.05, 0.058, 0.065], rseg=10)
    p.blob((0, -1.12, 0), (0.2, 0.28, 0.09))
    p.paint_fn(lambda q, n: q.y < -0.95 and n.z > 0.4 and math.hypot(q.x / 0.17, (q.y + 1.12) / 0.24) < 1, 0xb8803e)
    p.bone('body', (0, -1.3, 0), (0, 0, 0))
    p.extras['outline'] = 0.014
    p.build()


def egg():
    p = Prop('prop_farmegg', base=0xffffff, target_faces=420, voxel=0.008, smooth=3)
    p.quadriflow = False
    p.lathe(rounded([(0, -0.25), (0.14, -0.23), (0.19, -0.09), (0.17, 0.08), (0.1, 0.21), (0, 0.25)], 0.07, n=4), seg=32)
    for (x, y, z) in [(0.08, 0.1, 0.15), (-0.1, -0.02, 0.15), (0.12, -0.12, 0.12), (-0.05, 0.16, 0.08), (-0.15, -0.1, -0.06), (0.1, 0.02, -0.15)]:
        p.paint('sp', (x, y, z), (0.022, 0.022, 0.05), 0xd9c4a8)
    p.bone('body', (0, -0.25, 0), (0, 0.25, 0))
    p.extras['argMode'] = 'tint'; p.extras['argDefault'] = 0xfff3dc
    p.extras['outline'] = 0.012
    p.build()


def berry():
    p = Prop('prop_farmberry', base=0xffffff, target_faces=360, voxel=0.007, smooth=3)
    p.quadriflow = False
    p.blob((0, 0, 0), (0.15, 0.145, 0.15))
    p.paint('shine', (-0.07, 0.07, 0.11), (0.035, 0.05, 0.05), 0xffffff)
    p.paint_fn(lambda q, n: not (abs(q.x + 0.07) < 0.04 and abs(q.y - 0.07) < 0.05 and q.z > 0.08), 0xd8d8d8)
    p.layer('cap', base=0x4fae3e, target_faces=160, voxel=0.006)
    for k in range(5):
        a = k / 5 * math.tau
        p.blob((0.045 * math.cos(a), 0.138, 0.045 * math.sin(a)), (0.04, 0.014, 0.02), rot=(0, -math.degrees(a), 0), group='c%d' % k)
    p.blob((0.0, 0.17, 0), (0.014, 0.03, 0.014), group='stalk')
    p.layer('skin')
    p.bone('body', (0, -0.15, 0), (0, 0.15, 0))
    p.extras['argMode'] = 'tint'; p.extras['argDefault'] = 0xff4b6b
    p.extras['outline'] = 0.01
    p.build()


def pea():
    p = Prop('prop_farmpea', base=0xffffff, target_faces=300, voxel=0.007, smooth=3)
    p.quadriflow = False
    p.blob((0, 0, 0), (0.13, 0.13, 0.13))
    p.paint_fn(lambda q, n: not (n.z > 0.5 and n.x < -0.25 and n.y > 0.25), 0xd0d0d0)
    p.layer('stalk', base=0x7fc24a, target_faces=100, voxel=0.006)
    p.tube([(0, 0.11, 0), (0.02, 0.17, 0), (0.06, 0.19, 0.0), (0.07, 0.16, 0)], 0.016, rseg=6)
    p.layer('skin')
    p.bone('body', (0, -0.13, 0), (0, 0.13, 0))
    p.extras['argMode'] = 'tint'; p.extras['argDefault'] = 0x6fcf4a
    p.extras['outline'] = 0.01
    p.build()


def rock():
    p = Prop('prop_farmrock', base=0x9a95a6, target_faces=700, voxel=0.016, smooth=4)
    p.quadriflow = False
    p.blob((0, 0.32, 0), (0.55, 0.34, 0.47))
    p.blob((0.2, 0.42, 0.1), (0.32, 0.26, 0.32), group='lump')
    p.blob((-0.25, 0.25, -0.1), (0.3, 0.22, 0.3), group='lump2')
    p.paint('moss', (-0.2, 0.55, 0.05), (0.22, 0.12, 0.2), 0x7fc24a)
    p.bone('body', (0, 0, 0), (0, 0.7, 0))
    p.extras['outline'] = 0.024
    p.build()


def flat(p, pos, axis, normal, size, group, stiff=2.0):
    yv = Vector(axis).normalized(); zv = Vector(normal); zv = (zv - yv * zv.dot(yv)).normalized(); xv = yv.cross(zv)
    e = Matrix((xv, yv, zv)).transposed().to_euler('XYZ')
    p.blob(tuple(pos), size, rot=tuple(math.degrees(v) for v in e), group=group, stiffness=stiff)


def cabbage():
    p = Prop('prop_farmcabbage', base=0xb6e07a, target_faces=1100, voxel=0.011, smooth=3)
    p.blob((0, 0.36, 0), (0.3, 0.29, 0.3), group='heart')
    p.layer('leaves', base=0x6fc04f, target_faces=1400, voxel=0.011)
    for i in range(7):
        a = i / 7 * math.tau + 0.2
        out = Vector((math.sin(a), 0, math.cos(a)))
        c = Vector((0, 0.28, 0)) + out * 0.27
        flat(p, c, Vector((0, 1, 0)) + out * 0.35, out, (0.22, 0.24, 0.05), 'l%d' % i)
    p.paint_fn(lambda q, n: q.y > 0.42, 0x8fd45c)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 0.7, 0))
    p.extras['outline'] = 0.016
    p.build()


def sock():
    RED, WHITE = 0xff5a5a, 0xffffff
    p = Prop('prop_farmsock', base=WHITE, target_faces=1100, voxel=0.012, smooth=3)
    p.resolution = 0.02
    p.capsule((0, 0.38, 0), (0, 1.25, 0), 0.25, group='leg')
    p.capsule((0, 0.3, 0), (0, 0.3, 0.6), 0.24, r2=0.23, group='foot')
    p.blob((0, 0.32, -0.05), (0.25, 0.25, 0.25), group='heel')
    p.paint_fn(lambda q, n: q.y > 0.5 and int((q.y - 0.5) / 0.16) % 2 == 0 and q.y < 1.2, RED)
    p.paint_fn(lambda q, n: q.y < 0.55 and q.z < 0.02, RED)                       # heel
    p.paint_fn(lambda q, n: q.z > 0.55, RED)                                     # toe
    p.layer('cuff', base=WHITE, target_faces=400, voxel=0.011)
    p.lathe(rounded([(0.2, 1.22), (0.28, 1.22), (0.28, 1.38), (0.2, 1.38)], 0.03, n=2, closed=True), closed=True, seg=32)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 1.4, 0))
    p.extras['outline'] = 0.022
    p.build()


def snail():
    BODY, SHELL, SWIRL = 0xb6e07a, 0xff9f3f, 0xd9701f
    p = Prop('prop_farmsnail', base=BODY, target_faces=1300, voxel=0.012, smooth=3)
    p.curve([(-0.5, 0.12, 0), (0.0, 0.14, 0), (0.42, 0.2, 0.03), (0.56, 0.38, 0.05)], [0.1, 0.16, 0.17, 0.2], group='body')
    for z in (-0.08, 0.1):
        p.capsule((0.58, 0.5, z), (0.66, 0.78, z * 1.3), 0.03, group='st%d' % (z > 0))
        p.blob((0.67, 0.8, z * 1.3), (0.055, 0.055, 0.055), group='knob%d' % (z > 0))
    p.layer('shell', base=SHELL, target_faces=1200, voxel=0.012)
    p.blob((-0.1, 0.52, 0), (0.4, 0.4, 0.3))
    p.paint_fn(lambda q, n: (lambda r, a: abs(((r - 0.04 - 0.3 * ((a + math.pi) / math.tau)) % 0.15) - 0.075) < 0.022 and r < 0.38)(math.hypot(q.x + 0.1, q.y - 0.52), math.atan2(q.y - 0.52, q.x + 0.1)) and abs(q.z) > 0.15, SWIRL)
    p.layer('skin')
    head = lambda q: q.x > 0.36 and q.y > 0.22
    p.bone('body', (-0.5, 0.1, 0), (0.3, 0.1, 0), region=lambda q: not head(q))
    p.bone('head', (0.5, 0.25, 0), (0.56, 0.7, 0), parent='body', region=head)
    p.face(center=(0.57, 0.38, 0.04), radius=0.19, faceScale=0.95)
    p.extras['outline'] = 0.018
    p.build()


def hedge():
    LEAF, LEAF_D, LEAF_L = 0x58b43a, 0x4a9e32, 0x6cc84a
    p = Prop('prop_farmhedge', base=LEAF, target_faces=2400, voxel=0.022, smooth=3)
    p.box((0, 0.95, 0), (1.5, 0.95, 0.47), bevel=0.25)
    for i in range(6):
        x = -1.25 + i * 0.5
        p.blob((x, 1.95 + 0.06 * math.sin(i * 2.1), 0), (0.36, 0.3, 0.45), group='top%d' % i)
    for i in range(5):
        p.blob((-1.2 + i * 0.6, 1.3 - (i % 2) * 0.5, 0.42), (0.3, 0.3, 0.12), group='f%d' % i)
    p.paint_fn(lambda q, n: (math.sin(q.x * 5.3 + q.y * 3.1) + math.sin(q.y * 6.7 - q.x * 2.3 + q.z * 4)) > 1.15, LEAF_D)
    p.paint_fn(lambda q, n: n.y > 0.6, LEAF_L)
    p.layer('flowers', base=0xffffff, target_faces=500, voxel=0.012)
    for i, (x, y) in enumerate([(-1.1, 1.5), (-0.4, 0.8), (0.5, 1.6), (1.05, 0.95), (0.05, 1.25), (-0.8, 0.45), (0.85, 0.4)]):
        p.blob((x, y, 0.5), (0.07, 0.07, 0.04), group='fl%d' % i)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 2.3, 0))
    p.extras['outline'] = 0.026
    p.build()


def bush():
    p = Prop('prop_farmbush', base=0x5cc45a, target_faces=900, voxel=0.016, smooth=3)
    for i, (x, y, z, r) in enumerate([(0, 0.4, 0, 0.42), (-0.28, 0.3, 0.1, 0.3), (0.3, 0.32, 0.05, 0.3), (0.05, 0.62, -0.05, 0.3)]):
        p.blob((x, y, z), (r, r, r), group='b%d' % i)
    p.paint_fn(lambda q, n: n.y > 0.6, 0x74d266)
    p.paint_fn(lambda q, n: q.y < 0.12, 0x4a9e32)
    p.bone('body', (0, 0, 0), (0, 0.9, 0))
    p.extras['outline'] = 0.018
    p.build()


def haycart():
    p = Prop('prop_haycart', base=WOOD_L, target_faces=2400, voxel=0.018, smooth=3)
    p.box((0, 0.95, 0), (1.2, 0.12, 0.6), bevel=0.05)
    for z in (-0.6, 0.6):
        p.box((0, 1.18, z), (1.2, 0.14, 0.04), bevel=0.03)
    for x in (-1.2, 1.2):
        p.box((x, 1.18, 0), (0.04, 0.14, 0.6), bevel=0.03)
    p.tube([(1.15, 0.92, 0.25), (2.0, 0.55, 0.65)], 0.06, rseg=8)
    p.tube([(1.15, 0.92, -0.25), (2.0, 0.55, 0.15)], 0.06, rseg=8)
    p.paint_fn(lambda q, n: q.y < 0.86, WOOD_D)
    p.layer('hay', base=0xf0c648, target_faces=1600, voxel=0.02)
    for i in range(7):
        p.blob((-0.9 + i * 0.3, 1.38 + 0.08 * math.sin(i * 1.7), 0.05 * math.cos(i)), (0.32, 0.26, 0.55), group='h%d' % i)
    for i in range(6):
        p.capsule((-0.9 + i * 0.36, 1.55, 0.3 - (i % 2) * 0.5), (-0.9 + i * 0.36 + (0.2 if i % 2 else -0.2), 1.82, 0.3 - (i % 2) * 0.5), 0.03, r2=0.02, group='s%d' % i)
    p.paint_fn(lambda q, n: (math.sin(q.x * 13 + q.y * 5) + math.sin(q.z * 11 - q.y * 7)) > 1.25, 0xd9a92e)
    p.layer('wheels', base=0x8a5228, target_faces=1400, voxel=0.014)
    for x in (-0.75, 0.75):
        p.ring((x, 0.55, 0.68), 0.47, 0.07, rot=(90, 0, 0), seg=36, rseg=8)
        for k in range(6):
            a = k / 6 * math.pi
            p.tube([(x - 0.45 * math.cos(a), 0.55 - 0.45 * math.sin(a), 0.68), (x + 0.45 * math.cos(a), 0.55 + 0.45 * math.sin(a), 0.68)], 0.035, rseg=6)
    p.layer('hubs', base=0xffd23f, target_faces=200, voxel=0.01)
    for x in (-0.75, 0.75):
        p.blob((x, 0.55, 0.74), (0.1, 0.1, 0.07), group='hub%d' % (x > 0))
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 1.8, 0))
    p.extras['outline'] = 0.024
    p.build()


def trough():
    p = Prop('prop_trough', base=0xa0623a, target_faces=1600, voxel=0.016, smooth=3)
    p.box((0, 0.36, 0), (0.8, 0.27, 0.3), bevel=0.05)
    for x in (-0.65, 0.65):
        p.box((x, 0.14, 0), (0.07, 0.14, 0.36), bevel=0.03)
    p.paint_fn(lambda q, n: abs(q.y - 0.36) < 0.015 and n.z > 0.5, 0x7a4a26)
    p.paint_fn(lambda q, n: n.y > 0.7 and abs(q.x) < 0.72 and abs(q.z) < 0.22, 0x6fd0f0)
    p.layer('water', base=0x6fd0f0, target_faces=300, voxel=0.012)
    p.box((0, 0.6, 0), (0.72, 0.03, 0.22), bevel=0.02)
    p.paint_fn(lambda q, n: (math.sin(q.x * 14) + math.sin(q.z * 22)) > 1.3, 0xaee6f6)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 0.65, 0))
    p.extras['outline'] = 0.022
    p.build()


def barnwall():
    RED, RED_D, TRIM = 0xd94f3d, 0xb83c2e, 0xfff6e6
    p = Prop('prop_barnwall', base=RED, target_faces=1800, voxel=0.02, smooth=3)
    p.box((0, 1.3, -0.1), (1.4, 1.3, 0.1), bevel=0.04)
    gh = 1.4 * math.tan(math.radians(34))      # the gable under the roof
    p.mesh([(-1.4, 2.55, 0.0), (1.4, 2.55, 0.0), (0, 2.6 + gh, 0.0), (-1.4, 2.55, -0.2), (1.4, 2.55, -0.2), (0, 2.6 + gh, -0.2)],
           [(0, 1, 2), (3, 5, 4), (0, 3, 4, 1), (1, 4, 5, 2), (2, 5, 3, 0)])
    p.paint_fn(lambda q, n: q.y < 0.12, RED_D)
    p.layer('door', base=0x8a3b2e, target_faces=600, voxel=0.014)
    p.box((0, 0.9, 0.02), (0.7, 0.9, 0.04), bevel=0.02)
    p.layer('trim', base=TRIM, target_faces=1200, voxel=0.014)
    for a, b in [((-0.72, 0.0), (-0.72, 1.82)), ((0.72, 0.0), (0.72, 1.82)), ((-0.72, 1.82), (0.72, 1.82)), ((-0.66, 0.08), (0.66, 1.74)), ((0.66, 0.08), (-0.66, 1.74))]:
        p.tube([(a[0], a[1], 0.08), (b[0], b[1], 0.08)], 0.055, rseg=8)
    p.layer('roof', base=0x8a3b2e, target_faces=600, voxel=0.016)
    for k in (-1, 1):
        p.box((k * 0.7, 2.6 + 0.47 + 0.11, -0.1), (0.92, 0.09, 0.27), rot=(0, 0, -k * 34), bevel=0.04)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 3.6, 0))
    p.extras['outline'] = 0.024
    p.build()


def penfence():
    p = Prop('prop_penfence', base=WOOD_L, target_faces=2000, voxel=0.016, smooth=3)
    posts = [(-1.4, -0.9), (0, -0.95), (1.4, -0.9), (-1.4, 0.6), (1.4, 0.6)]
    for x, z in posts:
        p.box((x, 0.52, z), (0.09, 0.52, 0.09), bevel=0.04)
        p.blob((x, 1.05, z), (0.1, 0.06, 0.1), group='cap%d%d' % (int(x * 10), int(z * 10)))
    for y in (0.42, 0.78):
        p.box((0, y, -0.92), (1.48, 0.07, 0.04), bevel=0.03)
        for x in (-1.4, 1.4):
            p.box((x, y, -0.15), (0.04, 0.07, 0.76), bevel=0.03)
    p.paint_fn(lambda q, n: q.y > 1.0, 0xa86f3a)
    p.bone('body', (0, 0, 0), (0, 1.1, 0))
    p.extras['outline'] = 0.022
    p.build()


def cartwheel():
    p = Prop('prop_cartwheel', base=0x8a5228, target_faces=1400, voxel=0.014, smooth=3)
    p.ring((0, 0, 0), 0.86, 0.09, rot=(90, 0, 0), seg=40, rseg=8)
    for k in range(6):
        a = k / 6 * math.pi
        p.tube([(-0.8 * math.cos(a), -0.8 * math.sin(a), 0), (0.8 * math.cos(a), 0.8 * math.sin(a), 0)], 0.045, rseg=6)
    p.layer('hub', base=0xffd23f, target_faces=200, voxel=0.01)
    p.blob((0, 0, 0), (0.14, 0.14, 0.11), group='hub')
    p.layer('skin')
    p.bone('body', (0, -0.9, 0), (0, 0.9, 0))
    p.extras['outline'] = 0.02
    p.build()


def worm():
    PINK, PINK_D = 0xff9fbe, 0xff8fb0
    p = Prop('prop_farmworm', base=PINK, target_faces=1400, voxel=0.011, smooth=3)
    p.resolution = 0.016
    xs = [0.3 - i * 0.24 for i in range(5)]
    for i, x in enumerate(xs):
        r = 0.2 - i * 0.015
        p.blob((x, r if i else 0.27, 0), (r, r, r), group='s%d' % i)
    p.paint_fn(lambda q, n: any(abs(q.x - (x - 0.12)) < 0.025 for x in xs[:-1]) and q.x < 0.25, PINK_D)
    p.layer('skin')
    p.bone('body', (-0.2, 0.0, 0), (-0.2, 0.5, 0), region=lambda q: False)   # (points up: the seg bones' rest is identity)
    for i, x in enumerate(xs):
        p.bone('seg.%d' % (i + 1), (x, 0.0, 0), (x, 0.4, 0), parent='body', group='s%d' % i)
    p.face(center=(0.33, 0.29, 0.06), radius=0.2, bone='seg.1', faceScale=1.0)
    p.extras['outline'] = 0.018
    p.build()


def beatboard():
    W, H = 6.0, 2.0
    p = Prop('prop_beatboard', base=0xa86f3a, target_faces=1600, voxel=0.02, smooth=3)
    for y in (-H / 2 - 0.08, H / 2 + 0.08):
        p.box((0, y, -0.2), (W / 2 + 0.16, 0.13, 0.13), bevel=0.06)
    for x in (-W / 2 - 0.08, W / 2 + 0.08):
        p.box((x, 0, -0.2), (0.13, H / 2 + 0.2, 0.13), bevel=0.06)
    for x in (-W / 2 + 0.25, W / 2 - 0.25):
        p.box((x, -H / 2 - 2.3, -0.3), (0.12, 2.3, 0.12), bevel=0.05)
    p.paint_fn(lambda q, n: q.y < -H / 2 - 0.3, 0x8a5228)
    p.layer('panel', base=0xfff3dc, target_faces=500, voxel=0.02)
    p.box((0, 0, -0.1), (W / 2, H / 2, 0.06), bevel=0.04)
    p.layer('nails', base=0xffd23f, target_faces=200, voxel=0.012)
    for x in (-W / 2 - 0.08, W / 2 + 0.08):
        for y in (-H / 2 - 0.08, H / 2 + 0.08):
            p.blob((x, y, -0.05), (0.07, 0.07, 0.05), group='n%d%d' % (x > 0, y > 0))
    p.layer('skin')
    p.bone('body', (0, -H / 2 - 4.6, 0), (0, H / 2, 0))
    p.extras['outline'] = 0.024
    p.build()


def pennant():
    p = Prop('prop_pennant', base=0xffffff, target_faces=300, voxel=0.012, smooth=3)
    p.quadriflow = False
    V, F = [], []
    rows, cols = 8, 6
    for side in (-1, 1):
        for i in range(rows + 1):
            t = i / rows
            for j in range(cols + 1):
                u = -1 + 2 * j / cols
                w = 0.27 * (1 - t)
                V.append((u * w, -0.6 * t, side * 0.025 + 0.04 * math.sin(t * 2.5) + 0.02 * math.cos(u * 1.5)))
    Wd = cols + 1; off = (rows + 1) * Wd
    for i in range(rows):
        for j in range(cols):
            a, b, c, d = i * Wd + j, i * Wd + j + 1, (i + 1) * Wd + j + 1, (i + 1) * Wd + j
            F.append((a, d, c, b)); F.append((off + a, off + b, off + c, off + d))
    for i in range(rows):
        for j in (0, cols):
            a, d = i * Wd + j, (i + 1) * Wd + j
            F.append((a, off + a, off + d, d) if j == 0 else (a, d, off + d, off + a))
    for j in range(cols):
        F.append((j, j + 1, off + j + 1, off + j))
    p.mesh(V, F)
    p.paint_fn(lambda q, n: q.y > -0.07, 0xe8e8e8)
    p.bone('body', (0, -0.6, 0), (0, 0, 0))
    p.extras['argMode'] = 'tint'; p.extras['argDefault'] = 0xff5a5a
    p.extras['outline'] = 0.014
    p.build()


def wheelbarrow():
    GREEN, GREEN_D = 0x5fd068, 0x48b052
    p = Prop('prop_wheelbarrow', base=GREEN, target_faces=1800, voxel=0.016, smooth=3)
    # the tray: a deep rounded tub, wider at the top, nose toward +x
    V, F = [], []
    rows, seg = 6, 32
    for i in range(rows + 1):
        t = i / rows
        y = 0.62 + 0.55 * t
        for k in range(seg):
            a = k / seg * math.tau
            rx, rz = 0.55 + 0.35 * t, 0.36 + 0.22 * t
            x = rx * math.cos(a) + 0.12 * t * max(0, math.cos(a))
            V.append((x, y, rz * math.sin(a)))
    for i in range(rows):
        for k in range(seg):
            k2 = (k + 1) % seg
            F.append((i * seg + k, i * seg + k2, (i + 1) * seg + k2, (i + 1) * seg + k))
    c0 = len(V); V.append((0, 0.6, 0)); c1 = len(V); V.append((0.06, 1.15, 0))
    for k in range(seg):
        F.append((c0, (k + 1) % seg, k)); F.append((c1, rows * seg + k, rows * seg + (k + 1) % seg))
    p.mesh(V, F)
    p.paint_fn(lambda q, n: q.y < 0.72, GREEN_D)
    p.layer('soil', base=0x7a4a2c, target_faces=500, voxel=0.016)
    p.blob((0.05, 1.16, 0), (0.85, 0.16, 0.52))
    p.layer('wood', base=0xa86f3a, target_faces=900, voxel=0.014)
    for z in (-0.32, 0.32):
        p.tube([(1.0, 0.36, z * 0.5), (0.0, 0.62, z), (-1.35, 0.92, z * 1.2)], 0.05, rseg=8)
        p.tube([(-0.5, 0.0, z * 1.05), (-0.5, 0.72, z)], 0.045, rseg=8)
    p.layer('wheel', base=0x3a2838, target_faces=600, voxel=0.012)
    p.ring((1.05, 0.36, 0), 0.28, 0.08, rot=(90, 0, 0), seg=28, rseg=8)
    p.layer('hub', base=0xffd23f, target_faces=150, voxel=0.01)
    p.blob((1.05, 0.36, 0), (0.1, 0.1, 0.13), group='hub')
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 1.3, 0))
    p.extras['outline'] = 0.022
    p.build()


def bee():
    p = Prop('prop_farmbee', base=0xffd23f, target_faces=900, voxel=0.008, smooth=3)
    p.quadriflow = False
    p.blob((0, 0, 0), (0.27, 0.2, 0.2))
    p.blob((0.22, 0.03, 0), (0.15, 0.15, 0.15), group='head')
    p.blob((-0.3, -0.01, 0), (0.05, 0.04, 0.04), group='sting')
    p.paint_fn(lambda q, n: q.x < 0.12 and any(abs(q.x - x) < 0.04 for x in (-0.15, 0.0)), 0x3a2838)
    p.paint_fn(lambda q, n: q.x < -0.26, 0x3a2838)
    for s_ in (-1, 1):   # a big friendly eye on each side of the head, and a rosy cheek
        p.paint('eye', (0.3, 0.07, s_ * 0.11), (0.035, 0.05, 0.06), 0x3a2838)
        p.paint('cheek', (0.3, -0.03, s_ * 0.12), (0.03, 0.022, 0.05), 0xff9eb5)
    p.layer('wings', base=0xeaf6ff, target_faces=300, voxel=0.007)
    for s_ in (-1, 1):
        p.blob((-0.02, 0.27, s_ * 0.08), (0.09, 0.14, 0.03), rot=(s_ * 20, 0, 15), group='w%d' % s_)
    p.layer('skin')
    wing = lambda q: q.y > 0.16
    p.bone('body', (0, -0.2, 0), (0, 0.2, 0), region=lambda q: not wing(q))   # (up: the wing bones' rest is identity)
    p.bone('wing.L', (0, 0.16, -0.05), (0, 0.4, -0.08), parent='body', region=lambda q: wing(q) and q.z < 0)
    p.bone('wing.R', (0, 0.16, 0.05), (0, 0.4, 0.08), parent='body', region=lambda q: wing(q) and q.z >= 0)
    p.extras['outline'] = 0.012
    p.build()


for n, fn in [('prop_farmbee', bee), ('prop_farmworm', worm), ('prop_beatboard', beatboard), ('prop_pennant', pennant), ('prop_wheelbarrow', wheelbarrow),
              ('prop_cowbell', cowbell), ('prop_milkchurn', churn), ('prop_cookpot', cookpot), ('prop_farmspoon', spoon),
              ('prop_farmegg', egg), ('prop_farmberry', berry), ('prop_farmpea', pea), ('prop_farmrock', rock), ('prop_farmcabbage', cabbage),
              ('prop_farmsock', sock), ('prop_farmsnail', snail), ('prop_farmhedge', hedge), ('prop_farmbush', bush), ('prop_haycart', haycart),
              ('prop_trough', trough), ('prop_barnwall', barnwall), ('prop_penfence', penfence), ('prop_cartwheel', cartwheel)]:
    if want(n):
        fn()
