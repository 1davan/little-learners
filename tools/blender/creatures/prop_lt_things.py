"""Letter friends: the three things the Alphabet Train needs that have no word in docs/design/VOCAB.md (every other
thing is a WORDS model). Built to the WORDS shared style (chunky vinyl toy, its palette, crisp paint, ink outline;
only animals have faces). One script, several models (ONLY=prop_lt_insect,... builds a subset). Game space, +z faces
the child, bottom at y 0, centred on x and z.

  prop_lt_envelope    E: a fat cream envelope standing on its long edge (1.0 wide, 0.7 tall, 0.16 thick), its pointed
                      flap (layer 'flap', warm yellow) closed with a big RED heart seal (layer 'seal').
  prop_lt_insect      I: a friendly green insect seen side-on (head at +x, code face toward the camera): head, thorax
                      and a long oval abdomen as three clear beads, two pale folded wings, six thin elbowed legs,
                      two feelers. Built by bug(), like the ant.
  prop_lt_ant         A: the game's own ant (the VOCAB ant read as a tomato on a stool): dark brown, head + thorax +
                      a round gaster on a thin waist, six thin elbowed legs, elbowed feelers with clubs.
  prop_lt_underpants  U: puffy toddler briefs seen from the front (0.95 wide, 0.78 tall, 0.26 deep), SKY with white polka
                      dots, leg openings scooped from the lower corners with white elastic edging, a fat white rolled
                      waistband (layer 'band'); shown "as if worn", like the VOCAB clothes.
"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded
from mathutils import Vector

ONLY = [s for s in os.environ.get('ONLY', '').split(',') if s]
want = lambda n: not ONLY or n in ONLY
TAU = math.tau

RED, ORANGE, YELLOW, GREEN, LEAF, BLUE, SKY = 0xff4f4f, 0xff9a2e, 0xffd23a, 0x4cc75a, 0x2f8a3a, 0x3f8cff, 0x8fd3ff
CREAM, WHITE, BROWN, INK, PINK = 0xf2e8d8, 0xfffaf0, 0xb07a4a, 0x3a2838, 0xff7fbf


def heart_poly(s, cx, cy, n=36):
    pts = []
    for i in range(n):
        a = TAU * i / n
        x = 16 * math.sin(a) ** 3
        y = 13 * math.cos(a) - 5 * math.cos(2 * a) - 2 * math.cos(3 * a) - math.cos(4 * a)
        pts.append((cx + x * s, cy + y * s))
    return pts


def slab(p, poly, z0, z1):
    """extrude a 2D polygon (x, y) between z0 and z1"""
    m = len(poly)
    verts = [(x, y, z0) for x, y in poly] + [(x, y, z1) for x, y in poly]
    faces = [tuple(range(m - 1, -1, -1)), tuple(range(m, 2 * m))]
    for i in range(m):
        j = (i + 1) % m
        faces.append((i, j, m + j, m + i))
    p.mesh(verts, faces)


# ---------------- E: envelope ----------------
def envelope():
    p = Prop('prop_lt_envelope', base=CREAM, target_faces=1400, voxel=0.01, smooth=3)
    W, Hh, D = 0.5, 0.35, 0.08
    p.box((0, Hh, 0), (W, Hh, D), bevel=0.06)
    # the closed flap: a soft raised triangle on the front, from the top corners down to the middle
    p.layer('flap', base=0xffe2a8, target_faces=900, voxel=0.0035)
    tri = rounded([(-W + 0.04, 2 * Hh - 0.04), (W - 0.04, 2 * Hh - 0.04), (0, Hh * 0.55)], 0.05, n=4, closed=True)
    slab(p, [(q[0], q[1]) for q in tri], D - 0.005, D + 0.03)
    p.layer('seal', base=RED, target_faces=500, voxel=0.006)
    slab(p, heart_poly(0.0068, 0.0, Hh * 0.66), D + 0.025, D + 0.065)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 2 * Hh, 0))
    p.extras['outline'] = 0.018
    p.build()


# ---------------- A: ant, I: insect (one side-on bug builder) ----------------
# Both lie along x with the head at +x and the code face on the head's camera side (+z), so the silhouette reads at
# a glance from the game camera: three separate body beads, six thin elbowed legs, two feelers.
def bug(kind, body, dark, shine, wings=None, gaster=(0.28, 0.23, 0.23), muzzle=None):
    p = Prop(kind, base=body, target_faces=2600, voxel=0.0095, smooth=3)
    # low to the ground (an ant crouches; long straight legs read as a stool)
    HP = Vector((0.52, 0.34, 0.0))
    p.blob(tuple(HP), (0.2, 0.19, 0.19), group='head', stiffness=2.5)
    p.blob((0.16, 0.27, 0), (0.17, 0.105, 0.105), rot=(0, 0, -10), group='thorax', stiffness=2.5)
    p.blob((-0.06, 0.27, 0), (0.07, 0.075, 0.07), group='waist', stiffness=2.5)
    gx = -0.08 - gaster[0] * 0.95
    gy = max(0.3, gaster[1] + 0.07)
    p.blob((gx, gy, 0), gaster, rot=(0, 0, 10), group='gaster', stiffness=2.5)
    p.paint('shineG', (gx + 0.05, gy + gaster[1] * 0.75, 0.08), (0.11, 0.05, 0.08), shine)
    p.paint('shineH', (HP.x - 0.02, HP.y + 0.15, 0.05), (0.07, 0.04, 0.06), shine)
    if muzzle:
        p.paint('muzzle', (HP.x + 0.03, HP.y - 0.03, 0.16), (0.13, 0.11, 0.08), muzzle)   # a lighter face patch: the eyes read
    if wings:
        p.layer('wings', base=wings, target_faces=500, voxel=0.007)
        for s_ in (-1, 1):
            p.blob((-0.12, 0.5, s_ * 0.09), (0.3, 0.035, 0.13), rot=(s_ * 18, s_ * 8, 16), group='w%d' % s_)
    p.layer('legs', base=dark, target_faces=1300, voxel=0.0075)
    # elbowed legs: up and out to a knee above the back, then down and well out to the foot (front ones forward,
    # back ones backward), so they read as an insect's legs and not as table legs
    LEGS = [((0.25, 0.23), (0.42, 0.44), (0.66, 0.02)), ((0.16, 0.22), (0.24, 0.47), (0.08, 0.02)), ((0.07, 0.22), (-0.16, 0.44), (-0.46, 0.02))]
    for (r, k, f) in LEGS:
        for s_ in (-1, 1):
            root = (r[0], r[1], s_ * 0.07)
            knee = (k[0], k[1], s_ * 0.31)
            foot = (f[0], f[1] + 0.02, s_ * 0.4)
            p.tube([root, knee, foot], [0.036, 0.031, 0.026], rseg=8)
            p.blob((f[0], f[1] + 0.012, s_ * 0.41), (0.04, 0.026, 0.04), group='ft%d%d' % (int(f[0] * 100), s_))
    p.layer('feelers', base=dark, target_faces=600, voxel=0.0065)
    for s_ in (-1, 1):
        a0 = (HP.x + 0.06, HP.y + 0.14, s_ * 0.07)
        a1 = (HP.x + 0.1, HP.y + 0.38, s_ * 0.12)      # the elbow
        a2 = (HP.x + 0.32, HP.y + 0.46, s_ * 0.17)
        p.tube([a0, a1, a2], 0.022, rseg=8)
        p.blob(a2, (0.04, 0.04, 0.04), group='club%d' % s_)
    p.layer('skin')
    p.bone('body', (-0.1, 0.1, 0), (-0.1, 0.8, 0))
    p.bone('head', (HP.x, 0.3, 0), (HP.x, 0.85, 0), parent='body', region=lambda q: q.x > 0.34)
    p.face(center=(HP.x + 0.05, HP.y - 0.02, 0.165), radius=0.19, bone='head', faceScale=1.0, eyeSize=1.5)
    p.extras['outline'] = 0.014
    p.build()


def ant():
    """prop_lt_ant  A: an unmistakable ant: dark brown, head + thorax + a big round gaster on a thin waist, six thin
    elbowed legs, elbowed feelers with little clubs, warm shine spots. Replaces the VOCAB ant in this game (it read as
    a tomato on a stool)."""
    bug('prop_lt_ant', 0x5b3324, 0x3a2018, 0x9a6a50, muzzle=0x9a6650)


def insect():
    """prop_lt_insect  I: a friendly green insect (not the ant, not the ladybug): the same three-bead body in leaf green
    with a longer oval abdomen, two pale see-through-looking wings folded on its back, six thin legs, two feelers."""
    bug('prop_lt_insect', 0x3f9a4a, 0x24552c, 0x9ee08a, wings=0xdff6f0, gaster=(0.32, 0.2, 0.2))


# ---------------- U: underpants ----------------
def underpants():
    p = Prop('prop_lt_underpants', base=SKY, target_faces=1800, voxel=0.01, smooth=3)
    # classic toddler briefs seen from the front, puffed as if worn: a wide waist, the leg openings scooped out of the
    # lower corners (with white elastic edging), a soft gusset at the bottom. Flat-ish (0.26 deep) like the VOCAB clothes.
    p.blob((0, 0.56, 0), (0.47, 0.18, 0.13), group='pants', stiffness=2.5)
    p.blob((0, 0.36, 0), (0.42, 0.2, 0.13), group='pants', stiffness=2.5)
    p.blob((0, 0.16, 0), (0.2, 0.15, 0.12), group='pants', stiffness=2.5)
    LEG = [(s * 0.43, 0.08) for s in (-1, 1)]
    for i, (x, y) in enumerate(LEG):
        p.blob((x, y, 0), (0.25, 0.25, 0.4), group='leg%d' % i, negative=True)
    near_leg = lambda q: any(((q.x - x) / 0.25) ** 2 + ((q.y - y) / 0.25) ** 2 < 1.32 for x, y in LEG)
    dots = [(-0.26, 0.6), (0.02, 0.64), (0.28, 0.58), (-0.14, 0.42), (0.15, 0.44), (0.0, 0.24), (-0.36, 0.5), (0.36, 0.5)]
    for i, (x, y) in enumerate(dots):
        p.decal('dot%d' % i, (x, y), (0.05, 0.05, 0.08), WHITE)
    p.paint_fn(lambda q, n: near_leg(q), WHITE)
    # a fat rolled waistband hugging the top edge
    p.layer('band', base=WHITE, target_faces=800, voxel=0.009)
    p.ring((0, 0.71, 0), 0.45, 0.06, scale=(1.0, 0.29), seg=56, rseg=12)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 0.8, 0))
    p.extras['outline'] = 0.018
    p.build()


for name, fn in [('prop_lt_envelope', envelope), ('prop_lt_insect', insect), ('prop_lt_ant', ant), ('prop_lt_underpants', underpants)]:
    if want(name):
        fn()
