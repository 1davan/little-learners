"""Vocabulary batch 7: toys, music and play (docs/design/VOCAB.md, words 181-210). One script, several models
(ONLY=prop_word_book,prop_word_top tools/blender/build.sh prop_words_toys builds a subset). Every model stands on
y = 0, centred on x and z, facing +z, and fills the 2.0 word card (extras fit / wide, see VOCAB.md). Primary colours, WOOD parts,
visible toy construction (pegs, knobs, stitched seams). Things that would lie flat (puzzle, xylophone, piano keys)
are tipped toward the camera so they read from the games' near-level view.

  prop_word_book       a thick RED picture book standing open in a V toward the camera: CREAM page blocks with three
                       page lines, a sun-and-hill picture on the right page, one page mid-turn (bone page: rotation.y
                       turns it), a YELLOW star on the front cover.
  prop_word_doll       a floppy rag doll sitting with legs out: YELLOW wool plaits with RED bows, PINK dress, WHITE
                       apron, RED-and-WHITE striped legs, stitched seams; code face (faceScale small). Bones: body,
                       head, arm.L/R, leg.L/R, mane.L.1/mane.R.1 (springy plaits).
  prop_word_teddy      a classic sitting teddy (not the Bear character): golden TAN plush, a stitched seam down the
                       tummy, a BLUE patch on the left knee, CREAM paw pads, a RED neck bow, head tilted.
                       Bones: body, head, arm.L/R, leg.L/R, ear.L.1/ear.R.1. Code face on the head.
  prop_word_puzzle     four chunky jigsaw pieces (RED, YELLOW, GREEN, BLUE fronts, WOOD sides) standing like a tray:
                       three joined in an L, the BLUE one lifted out toward the camera above its gap (bone piece: move
                       it -z/-y to drop it in).
  prop_word_pencil     a fat short YELLOW hexagon pencil leaning at 60 deg, point down on a WHITE paper square, a curly
                       GREY line drawn behind the point; PINK rubber, GREY band, WOOD cone, INK tip.
  prop_word_xylophone  eight rainbow bars getting shorter left to right on a WOOD wedge frame (tipped toward the camera)
                       with four round feet and GREY pegs, two beaters with RED ball heads. Bones bar.1 .. bar.8
                       (rotation.x dips a bar).
  prop_word_bell       a YELLOW hand bell with an ORANGE rim band, a RED clapper ball under the rim (spring bone
                       tail.1), a WOOD handle.
  prop_word_guitar     a toy guitar standing up: ORANGE figure-eight body, INK sound hole in a WHITE ring, WOOD neck
                       and head, four fat CREAM strings, four YELLOW pegs.
  prop_word_violin     a small BROWN violin leaning back with its bow across it: C-cut waist, two f-holes, a curled
                       scroll, an INK chin rest and fingerboard; the bow is a WOOD stick with WHITE hair.
  prop_word_piano      a toy upright piano: RED rounded cabinet on WOOD feet, 8 fat WHITE keys and 5 INK keys tipped
                       toward the camera, a YELLOW music-note sticker. Bones key.1 .. key.8 (rotation.x dips a key).
  prop_word_yoyo       a RED yo-yo with YELLOW stars hanging from a fat WHITE string with a finger loop. Bone yoyo
                       (position.y slides it, rotation.z spins it).
  prop_word_swing      an A-frame of fat WOOD posts, two YELLOW ropes down to a RED bucket seat. Bone swing (rotation.x
                       rocks it from the top bar).
  prop_word_slide      a chunky slide: BLUE ladder with four rungs and hand rails at -x, a platform, a wide YELLOW
                       chute with raised sides curving down to the front-right.
  prop_word_robot      a boxy toy robot: SKY head with the code face on a darker screen, a springy antenna (antenna.1)
                       with a RED ball, GREY body with three buttons and a dial, tube arms (arm.L/R) with C-claws, fat
                       feet. Bones: body, head, arm.L/R, antenna.1.
  prop_word_rocket     a toy rocket on three RED fins: fat WHITE body, RED nose cone, SKY porthole with a YELLOW rim, a
                       BLUE band. The ORANGE-and-YELLOW flame (layer flame) is tucked inside the body at rest; bone
                       flame: position.y -= ~0.6 pushes it out under the rocket.
  prop_word_rattle     a baby rattle: a SKY see-through ball (a cage of rings) with five coloured beads inside, a
                       ringed PINK handle ending in a YELLOW loop.
  prop_word_top        a spinning top balanced on its point leaning 8 deg: banded RED/YELLOW/GREEN/BLUE double cone,
                       WOOD plunger knob. Spins on body.
  prop_word_tent       a play tent: ORANGE-and-WHITE striped ridge tent, front flaps tied back, a dark PURPLE inside
                       with a YELLOW cushion, a flag on the ridge, two guy ropes with WOOD pegs.
  word-card variants of reused models (colour baked, base on y = 0; the originals are untouched):
  prop_word_seesaw     chunky toy seesaw: RED pivot, tilted YELLOW plank (bone plank), BLUE seats, RED handles.
  prop_word_paint      GREY paint tin, YELLOW label with a RED splat, RED paint and drip, a brush resting in it.
  prop_word_balloon    RED balloon with a shine and knot on a curly CREAM string (spring bone tail.1).
  prop_word_castle     toy castle: GREY crenellated wall and keep, two towers with RED cone roofs, WOOD door, YELLOW flag.
"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from skit import SProp
from kit import rounded, star_poly, circle_poly
from mathutils import Vector, Euler, Matrix

ONLY = [s for s in os.environ.get('ONLY', '').split(',') if s]
TAU = math.tau
RED, ORANGE, YELLOW, GREEN, LEAF, BLUE, SKY = 0xff4f4f, 0xff9a2e, 0xffd23a, 0x4cc75a, 0x2f8a3a, 0x3f8cff, 0x8fd3ff
PURPLE, PINK, ROSE, CREAM, WHITE, BROWN, WOOD = 0x9b6dff, 0xff7fbf, 0xff9ec4, 0xf2e8d8, 0xfffaf0, 0xb07a4a, 0xd8924f
TAN, GREY, SLATE, INK = 0xf3d9ae, 0xb9c0c9, 0x6f7a8c, 0x3a2838
WOOD_D, WOOD_L = 0xb8743a, 0xe8b07a
SKIN_L = 0xf6cfa6


# per-model triangle trims (crisp paint cuts add triangles after the remesh, so painted models aim lower)
TRIM = dict(prop_word_pencil=0.78, prop_word_bell=0.75, prop_word_guitar=0.72, prop_word_violin=0.72, prop_word_piano=0.75,
            prop_word_yoyo=0.75, prop_word_rocket=0.68, prop_word_rattle=0.6, prop_word_top=0.66, prop_word_tent=0.4)


class WProp(SProp):
    """SProp (bevelled prisms / meshes) that always voxel-remeshes every layer into one soft skin."""
    def __init__(self, kind, **kw):
        self.tfk = TRIM.get(kind, 1.0)
        if 'target_faces' in kw:
            kw['target_faces'] = int(kw['target_faces'] * self.tfk)
        super().__init__(kind, hard=False, **kw)
        self.quadriflow = False
        self.layers['skin']['remesh'] = True
        self.layers['skin']['quadriflow'] = False

    def _skin(self):
        """after the remesh, decimate again if the layer still has more triangles than its target (a voxel skin under
        the face target is never decimated, but it triangulates to twice its quad count)"""
        import bpy
        L = self.layers[self._cur]
        if L.get('clean'):
            # hard-surface layer built only from bevelled prims: no voxel remesh (crisp flat faces and edges), but
            # every edge smooth so the ink outline (pushed along the normals) never cracks at a corner
            L['remesh'] = False
            skin = super()._skin()
            for e in skin.data.edges:
                e.use_edge_sharp = False
            for f in skin.data.polygons:
                f.use_smooth = True
            return skin
        skin = super()._skin()
        tf = L.get('target_faces') or (self.target_faces if self._cur == 'skin' else 1500)
        tris = sum(len(f.vertices) - 2 for f in skin.data.polygons)
        if tris > tf * 1.1:
            bpy.context.view_layer.objects.active = skin
            d = skin.modifiers.new('dec2', 'DECIMATE')
            d.ratio = tf / tris
            bpy.ops.object.modifier_apply(modifier='dec2')
        return skin

    def layer(self, name, base=0xffffff, voxel=None, target_faces=None, clean=False):
        if target_faces:
            target_faces = max(80, int(target_faces * self.tfk))
        existed = name in self.layers
        r = super().layer(name, base=base, voxel=voxel, target_faces=target_faces)
        if existed and not clean:
            return r          # switching back to a layer keeps its settings
        self.layers[name]['remesh'] = not clean
        self.layers[name]['clean'] = clean
        if clean:
            self.layers[name]['psegs'] = 2
        self.layers[name]['quadriflow'] = False
        return r


def finish(p, size, top=None, outline=None):
    w, h, d = size
    k = min(2.0 / h, 2.0 / w, 2.0 / d)
    p.layer('skin')
    if not any(b[0] == 'body' for b in p.bones):
        p.bone('body', (0, 0, 0), (0, top or h, 0))
    p.extras['fit'] = 2.0
    if w > h:
        p.extras['wide'] = 2.0
    p.extras['outline'] = outline or round(max(0.012, min(0.034, 0.024 / k)), 4)
    p.build()


def M(rot):
    return Euler([math.radians(a) for a in rot], 'XYZ').to_matrix()


def prism(p, poly, z0, z1, bevel=0.03, rot=(0, 0, 0), at=(0, 0, 0)):
    """extrude a 2D (x, y) outline from z0 to z1 (local), bevel its edges, rotate (deg XYZ) and move it."""
    R = M(rot)
    A = Vector(at)
    n = len(poly)
    verts = []
    for z in (z0, z1):
        for pt in poly:
            verts.append(tuple(R @ Vector((pt[0], pt[1], z)) + A))
    faces = [tuple(range(n - 1, -1, -1)), tuple(range(n, 2 * n))] + [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)]
    p._prims().append(('mesh', verts, faces, bevel))


def rbox(p, c, h, rot=(0, 0, 0), bevel=0.05):
    p.box(c, h, rot=rot, bevel=bevel)


def heart_poly(r, n=40):
    pts = []
    for i in range(n):
        t = i / n * TAU
        x = 16 * math.sin(t) ** 3
        y = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
        pts.append((x / 17 * r, y / 17 * r + 0.1 * r))
    return pts


def to_local(q, R, at):
    """game point -> local frame of a part placed with rotation matrix R at `at`"""
    return R.transposed() @ (Vector((q.x, q.y, q.z)) - Vector(at))


def dist_seg(q, a, b):
    a, b, q = Vector(a), Vector(b), Vector((q.x, q.y, q.z))
    ab = b - a
    t = max(0.0, min(1.0, (q - a).dot(ab) / max(1e-9, ab.dot(ab))))
    return (q - (a + ab * t)).length, t


# ================================================================== book
def book():
    p = WProp('prop_word_book', base=RED, target_faces=700, voxel=0.013)
    p.layers['skin']['clean'] = True
    p.layers['skin']['psegs'] = 2
    CW, CH, CT = 0.86, 1.36, 0.075          # cover width, height, thickness
    PB = 0.18                               # page block thickness (three stacked slabs -> three page lines)
    OPEN = 36                               # each half turned this far toward the camera from flat
    ZS = -0.26                              # spine z
    halves = {}
    for side in (-1, 1):
        rot = (0, -OPEN, 0) if side > 0 else (0, OPEN, 0)
        halves[side] = M(rot)
        cover = rounded([(0, 0), (side * CW, 0), (side * CW, CH), (0, CH)], 0.08, n=3, closed=True)
        if side < 0:
            cover = cover[::-1]
        prism(p, [c[:2] for c in cover], -CT, 0.0, bevel=0.03, rot=rot, at=(0, 0, ZS))
    p.cyl((0, 0, ZS - 0.02), 0.1, CH, bevel=0.05, scale=(1.0, 0.8), seg=24)       # spine
    # page blocks: three CREAM slabs per half, each its own layer so an ink line shows between them
    for k, (col, nm) in enumerate(((0xeadcc6, 'pagesA'), (CREAM, 'pagesB'), (0xfbf3e6, 'pagesC'))):
        p.layer(nm, base=col, target_faces=260, voxel=0.011, clean=True)
        z0, z1 = PB * k / 3, PB * (k + 1) / 3
        for side in (-1, 1):
            rot = (0, -OPEN, 0) if side > 0 else (0, OPEN, 0)
            x0, x1 = 0.035, CW - 0.05 - 0.008 * k
            poly = rounded([(side * x0, 0.06), (side * x1, 0.06), (side * x1, CH - 0.06), (side * x0, CH - 0.06)], 0.035, n=2, closed=True)
            if side < 0:
                poly = poly[::-1]
            prism(p, [c[:2] for c in poly], z0, z1, bevel=0.015, rot=rot, at=(0, 0, ZS))
        p.layers[nm]['psegs'] = 1
    # the page turning: a soft curved sheet lifting off the right page toward the left
    p.layer('page', base=WHITE, target_faces=300, voxel=0.011, clean=True)
    verts, faces = [], []
    NZ, NYp = 14, 6
    PL = CW - 0.12
    PHI = math.radians(22)                 # how far the page still leans left of straight-out
    for side, th in ((0, -0.022), (1, 0.022)):
        for i in range(NZ + 1):
            t = i / NZ
            r = PL * t
            ang = PHI + 0.35 * t * t       # curls back over toward the left page as it goes out
            x = r * math.sin(ang) - th * math.cos(ang)
            z = ZS + 0.08 + r * math.cos(ang) + th * math.sin(ang)
            for j in range(NYp + 1):
                y = 0.1 + (CH - 0.2) * j / NYp
                verts.append((x, y, z))
    def vi(s, i, j):
        return s * (NZ + 1) * (NYp + 1) + i * (NYp + 1) + j
    for i in range(NZ):
        for j in range(NYp):
            faces.append((vi(1, i, j), vi(1, i + 1, j), vi(1, i + 1, j + 1), vi(1, i, j + 1)))
            faces.append((vi(0, i, j), vi(0, i, j + 1), vi(0, i + 1, j + 1), vi(0, i + 1, j)))
    for i in range(NZ):
        faces.append((vi(0, i, 0), vi(1, i, 0), vi(1, i + 1, 0), vi(0, i + 1, 0)))
        faces.append((vi(0, i, NYp), vi(0, i + 1, NYp), vi(1, i + 1, NYp), vi(1, i, NYp)))
    for j in range(NYp):
        faces.append((vi(0, NZ, j), vi(1, NZ, j), vi(1, NZ, j + 1), vi(0, NZ, j + 1)))
        faces.append((vi(0, 0, j), vi(0, 0, j + 1), vi(1, 0, j + 1), vi(1, 0, j)))
    p.mesh(verts, faces)
    # the picture on the left page (it faces the camera when the game turns the card): a YELLOW sun over a GREEN hill
    p.layer('sun', base=YELLOW, target_faces=300, voxel=0.008, clean=True)
    sun = []
    for i in range(32):
        a = TAU * i / 32
        ph = (i % 4) / 4
        r = 0.15 + 0.06 * max(0.0, math.cos(ph * TAU)) ** 2
        sun.append((-0.48 + r * math.cos(a), 0.92 + r * math.sin(a)))
    prism(p, sun, PB - 0.01, PB + 0.03, bevel=0.008, rot=(0, OPEN, 0), at=(0, 0, ZS))
    p.layers['sun']['psegs'] = 1
    p.layer('hill', base=GREEN, target_faces=200, voxel=0.008, clean=True)
    hill = [(-0.1 - 0.68 * i / 16, 0.1 + 0.36 * math.sin(math.pi * i / 16) ** 0.8) for i in range(17)][::-1]
    prism(p, hill, PB - 0.01, PB + 0.025, bevel=0.008, rot=(0, OPEN, 0), at=(0, 0, ZS))
    # the YELLOW star on the outside of the front (left) cover
    p.layer('star', base=YELLOW, target_faces=200, voxel=0.008, clean=True)
    st = [(-0.45 + x, 0.75 + y) for x, y in star_poly(0.26, inner=0.5)]
    prism(p, st[::-1], -CT - 0.03, -CT + 0.01, bevel=0.01, rot=(0, OPEN, 0), at=(0, 0, ZS))
    p.layers['star']['psegs'] = 1
    p.layer('skin')
    def in_page(q):
        # close to the curled sheet itself: polar angle from the spine vs the sheet's angle at that radius
        dz = q.z - ZS - 0.08
        r = math.hypot(q.x, dz)
        if r < 0.06 or r > PL + 0.06 or q.y < 0.05:
            return False
        ang = math.atan2(q.x, dz)
        return abs(ang - (PHI + 0.35 * (min(r, PL) / PL) ** 2)) * r < 0.05
    p.bone('body', (0, 0, ZS), (0, CH, ZS), region=lambda q: not in_page(q))
    p.bone('page', (0, 0.05, ZS + 0.02), (0, CH, ZS + 0.02), parent='body', region=in_page)
    w = 2 * (CW * math.cos(math.radians(OPEN)) + 0.05)
    finish(p, (w, CH, CW * math.sin(math.radians(OPEN)) + 0.4))


# ================================================================== doll
def doll():
    DRESS, DRESS_D, HAIR, HAIR_D = PINK, 0xe3609f, YELLOW, 0xe8b820
    p = WProp('prop_word_doll', base=SKIN_L, target_faces=1500, voxel=0.013)
    HY = 1.2
    SH = lambda s: (s * 0.27, 0.84, 0.0)
    HD = lambda s: (s * 0.45, 0.5, 0.17)
    # skin: the head (the code face mounts on it), neck and floppy arms with mitten hands
    p.blob((0, HY, 0.02), (0.37, 0.35, 0.33), group='h')
    p.capsule((0, 0.86, 0), (0, 0.98, 0), 0.1, group='neck')
    for s in (-1, 1):
        p.capsule(SH(s), HD(s), 0.082, r2=0.078, group='arm%d' % s)
        p.blob(HD(s), (0.095, 0.1, 0.09), group='arm%d' % s)
    # the PINK dress: a soft torso flaring into a skirt spread over the lap, puffed sleeves, a painted WHITE apron
    p.layer('dress', base=DRESS, target_faces=1200, voxel=0.013)
    p.blob((0, 0.66, -0.02), (0.27, 0.28, 0.22), group='body')
    p.blob((0, 0.34, 0.02), (0.44, 0.24, 0.38), group='body')
    p.blob((0, 0.2, 0.12), (0.46, 0.17, 0.42), group='body')
    for s in (-1, 1):
        p.blob((s * 0.3, 0.83, 0.0), (0.13, 0.12, 0.12), group='sl%d' % s)
    def apron(q, n):
        if n.z < 0.15 or q.z < 0.05:
            return False
        if q.y > 0.42:      # bib
            return abs(q.x) < 0.14 and q.y < 0.78
        return abs(q.x) < 0.27 - (0.42 - q.y) * -0.15 and q.y > 0.1
    p.paint_fn(apron, WHITE)
    p.paint_fn(lambda q, n: apron(q, n) and q.y < 0.42 and abs(abs(q.x) - (0.27 - (0.42 - q.y) * -0.15) + 0.04) < 0.018 and math.sin(q.y * 70) > 0, ROSE)
    p.paint_fn(lambda q, n: 0.1 < q.y < 0.14 and math.sin(math.atan2(q.x, q.z) * 30) > 0.3 and n.y < 0.6 and not apron(q, n), DRESS_D)
    # striped legs out in front, little INK shoes
    p.layer('legs', base=WHITE, target_faces=800, voxel=0.01)
    for s in (-1, 1):
        p.capsule((s * 0.17, 0.12, 0.25), (s * 0.21, 0.11, 0.76), 0.098, group='leg%d' % s)
    p.paint_fn(lambda q, n: math.sin(q.z * 40) > 0, RED)
    p.layer('shoes', base=INK, target_faces=260, voxel=0.011)
    for s in (-1, 1):
        p.blob((s * 0.215, 0.15, 0.83), (0.105, 0.12, 0.085), group='shoe%d' % s)
    # wool hair: a cap with a fringe and two plaits with RED bows
    p.layer('hair', base=HAIR, target_faces=900, voxel=0.012)
    p.blob((0, HY + 0.1, -0.05), (0.4, 0.32, 0.35), group='cap')
    for x in (-0.2, -0.07, 0.07, 0.2):
        p.blob((x, HY + 0.25, 0.23 - abs(x) * 0.25), (0.09, 0.08, 0.07), group='cap')
    for s in (-1, 1):
        for i, c in enumerate([(s * 0.33, HY - 0.02, -0.04), (s * 0.39, HY - 0.19, 0.0), (s * 0.42, HY - 0.35, 0.03), (s * 0.43, HY - 0.5, 0.05)]):
            p.blob(c, (0.085, 0.085, 0.08), group='pl%d' % s)
    p.paint_fn(lambda q, n: (abs(q.x) < 0.3 and q.y > HY and math.sin(q.x * 40) > 0.55) or (abs(q.x) > 0.3 and q.y < HY - 0.05 and math.sin(q.y * 38 + q.x * 10) > 0.55), HAIR_D)
    p.layer('bows', base=RED, target_faces=300, voxel=0.009)
    for s in (-1, 1):
        c = (s * 0.44, HY - 0.57, 0.06)
        p.blob((c[0] - 0.065, c[1], c[2]), (0.07, 0.05, 0.035), rot=(0, 0, 20), group='b%dl' % s)
        p.blob((c[0] + 0.065, c[1], c[2]), (0.07, 0.05, 0.035), rot=(0, 0, -20), group='b%dr' % s)
        p.blob(c, (0.035, 0.035, 0.035), group='b%dk' % s)
    p.layer('skin')
    # rig
    def plait(q, s):
        return q.x * s > 0.29 and HY - 0.68 < q.y < HY - 0.06 and q.z < 0.14
    def arm(q, s):
        return dist_seg(q, SH(s), HD(s))[0] < 0.12 and q.x * s > 0.3
    p.bone('body', (0, 0.1, 0), (0, 0.95, 0), region=lambda q: q.y <= 0.92 and not any(arm(q, s) or plait(q, s) for s in (-1, 1)))
    p.bone('head', (0, 0.95, 0), (0, HY + 0.45, 0), parent='body', region=lambda q: q.y > 0.92 and not any(plait(q, s) for s in (-1, 1)))
    for s, nm in ((-1, 'L'), (1, 'R')):
        p.bone('arm.' + nm, SH(s), HD(s), parent='body', region=lambda q, s=s: arm(q, s))
        p.bone('leg.' + nm, (s * 0.17, 0.12, 0.3), (s * 0.22, 0.12, 0.95), parent='body', region=lambda q, s=s: q.x * s > 0.06 and q.z > 0.5 and q.y < 0.3)
        p.bone('mane.' + nm + '.1', (s * 0.35, HY - 0.02, -0.04), (s * 0.44, HY - 0.6, 0.06), parent='head', region=lambda q, s=s: plait(q, s))
    p.face(center=(0, HY - 0.03, 0.02), radius=0.34, faceScale=0.9)
    p.anchor('hair', (0.44, HY - 0.3, 0.05), 'head')
    finish(p, (1.05, HY + 0.43, 1.0))


# ================================================================== teddy
def teddy():
    FUR, FUR_D, PADC = 0xe0b06e, 0xc08f50, CREAM
    p = WProp('prop_word_teddy', base=FUR, target_faces=3300, voxel=0.015)
    HY = 1.36
    TILT = 10
    def tilt(v):   # tilt the head about the neck (z axis through (0, 1.0))
        a = math.radians(TILT)
        x, y = v[0], v[1] - 1.02
        return (x * math.cos(a) - y * math.sin(a), 1.02 + x * math.sin(a) + y * math.cos(a), v[2])
    p.blob((0, 0.6, 0), (0.42, 0.44, 0.36), group='body')
    p.blob((0, 0.38, 0.06), (0.44, 0.3, 0.38), group='body')
    # head (tilted), muzzle, round ears
    p.blob(tilt((0, HY, 0.02)), (0.47, 0.41, 0.4), rot=(0, 0, TILT), group='head')
    p.blob(tilt((0, HY - 0.15, 0.33)), (0.2, 0.14, 0.15), rot=(0, 0, TILT), group='muz')
    for s in (-1, 1):
        p.blob(tilt((s * 0.37, HY + 0.33, -0.04)), (0.16, 0.16, 0.08), rot=(0, 0, TILT - s * 20), group='ear%d' % s)
    # chunky jointed limbs
    for s in (-1, 1):
        p.capsule((s * 0.36, 0.86, 0.04), (s * 0.6, 0.56, 0.24), 0.135, r2=0.125, group='arm%d' % s)
        p.capsule((s * 0.22, 0.24, 0.16), (s * 0.29, 0.2, 0.66), 0.17, r2=0.16, group='leg%d' % s)
        p.blob((s * 0.3, 0.26, 0.7), (0.16, 0.2, 0.1), group='leg%d' % s)
    # paint: muzzle, inner ears, pads, tummy seam
    p.paint_group('muz', PADC)
    for s in (-1, 1):
        c = tilt((s * 0.37, HY + 0.33, 0.02))
        p.paint('in%d' % s, c, (0.1, 0.1, 0.06), PADC, only=lambda q: q.z > -0.02)
        p.paint('foot%d' % s, (s * 0.3, 0.26, 0.8), (0.12, 0.15, 0.06), PADC)
        p.paint('palm%d' % s, (s * 0.64, 0.53, 0.33), (0.09, 0.09, 0.06), PADC, only=lambda q: q.z > 0.27)
    # nose
    p.layer('nose', base=INK, target_faces=300, voxel=0.008)
    p.blob(tilt((0, HY - 0.08, 0.47)), (0.07, 0.05, 0.04), rot=(0, 0, TILT), group='n')
    # the BLUE knee patch with white stitches
    p.layer('patch', base=BLUE, target_faces=400, voxel=0.008)
    pc = (-0.255, 0.4, 0.5)
    p.box(pc, (0.15, 0.035, 0.14), rot=(-32, 0, 4), bevel=0.03)
    # stitched seam down the tummy: little dark stitches (own layer, crisp)
    p.layer('stitch', base=FUR_D, target_faces=300, voxel=0.007)
    for k in range(6):
        y = 0.36 + k * 0.1
        z = max(0.36 * math.sqrt(max(0.0, 1 - ((y - 0.6) / 0.44) ** 2)), 0.06 + 0.38 * math.sqrt(max(0.0, 1 - ((y - 0.38) / 0.3) ** 2))) + 0.035
        p.box((0, y, z), (0.014, 0.032, 0.02), bevel=0.012)
    # RED ribbon bow at the neck
    p.layer('bow', base=RED, target_faces=600, voxel=0.01)
    BY = 1.0
    p.blob((-0.13, BY, 0.36), (0.13, 0.08, 0.05), rot=(0, -15, 18), group='bl')
    p.blob((0.13, BY, 0.36), (0.13, 0.08, 0.05), rot=(0, 15, -18), group='br')
    p.blob((0, BY, 0.39), (0.055, 0.055, 0.05), group='bk')
    p.capsule((-0.04, BY - 0.04, 0.37), (-0.1, BY - 0.2, 0.39), 0.035, group='t1')
    p.capsule((0.04, BY - 0.04, 0.37), (0.1, BY - 0.2, 0.39), 0.035, group='t2')
    p.layer('skin')
    p.bone('body', (0, 0.12, 0), (0, 1.0, 0))
    p.bone('head', (0, 1.0, 0), (0, HY + 0.5, 0), parent='body', region=lambda q: q.y > 1.04 and not (q.y < 1.15 and abs(q.x) < 0.3 and q.z > 0.3))
    for s, nm in ((-1, 'L'), (1, 'R')):
        p.bone('arm.' + nm, (s * 0.36, 0.86, 0.04), (s * 0.62, 0.54, 0.26), parent='body', region=lambda q, s=s: q.x * s > 0.42 and q.y > 0.38 and q.y < 1.02)
        p.bone('leg.' + nm, (s * 0.22, 0.24, 0.2), (s * 0.3, 0.24, 0.8), parent='body', region=lambda q, s=s: q.x * s > 0.04 and q.z > 0.38 and q.y < 0.52)
        e0 = tilt((s * 0.31, HY + 0.26, -0.04)); e1 = tilt((s * 0.42, HY + 0.47, -0.04))
        p.bone('ear.' + nm + '.1', e0, e1, parent='head', region=lambda q, s=s: q.y > tilt((s * 0.37, HY + 0.2, 0))[1] and q.x * s > 0.24 and q.z < 0.08)
    fc = tilt((0, HY + 0.02, 0.02))
    p.face(center=fc, radius=0.42, faceScale=1.12, bone='head', mouthY=-0.02, mouthZ=0.06)
    finish(p, (1.4, HY + 0.55, 1.05))


# ================================================================== puzzle
def jig_edge(p0, p1, kind):
    """points from p0 toward p1 (p1 excluded); kind +1 knob out (right of travel), -1 hole in, 0 straight."""
    (x0, y0), (x1, y1) = p0, p1
    L = math.hypot(x1 - x0, y1 - y0)
    ux, uy = (x1 - x0) / L, (y1 - y0) / L
    nx, ny = uy, -ux               # right of travel (outward for a counter-clockwise outline)
    mx, my = (x0 + x1) / 2, (y0 + y1) / 2
    pts = [(x0, y0)]
    if kind == 0:
        for i in range(1, 2):
            t = i / 2
            pts.append((x0 + (x1 - x0) * t, y0 + (y1 - y0) * t))
        return pts
    def P(u, v):
        return (mx + ux * u + nx * v * kind, my + uy * u + ny * v * kind)
    pts += [P(-L / 2 + L * k / 8, 0) for k in range(2, 3)]
    pts.append(P(-0.085, 0.0))
    pts.append(P(-0.078, 0.05))
    for i in range(9):
        th = math.radians(235 - 290 * i / 8)
        pts.append(P(0.13 * math.cos(th) * (1 if kind > 0 else 1), 0.16 + 0.13 * math.sin(th)))
    pts.append(P(0.078, 0.05))
    pts.append(P(0.085, 0.0))
    pts += [P(L / 2 - L * k / 8, 0) for k in (2,)]
    return pts


def puzzle():
    S = 0.72                      # piece size
    T = 0.11                      # half thickness
    LEAN = -14                    # tipped back so the faces look up a little
    p = WProp('prop_word_puzzle', base=WOOD, target_faces=320, voxel=0.011)
    # piece outlines (counter-clockwise): A top-left RED, B bottom-left YELLOW, C bottom-right GREEN, D top-right BLUE
    # shared edges: A-B (A knob down), A-D (A knob right), B-C (B knob right), C-D (C knob up)
    def outline(x0, y0, kb, kr, kt, kl):
        corners = [(x0, y0), (x0 + S, y0), (x0 + S, y0 + S), (x0, y0 + S)]
        pts = []
        for (a, b), k in zip(zip(corners, corners[1:] + corners[:1]), (kb, kr, kt, kl)):
            pts += jig_edge(a, b, k)
        return [q[:2] for q in pts]
    pieces = {
        'A': (outline(-S, 0, +1, +1, 0, 0), RED),
        'B': (outline(-S, -S, 0, +1, -1, 0), YELLOW),
        'C': (outline(0, -S, 0, 0, +1, -1), GREEN),
        'D': (outline(0, 0, -1, 0, 0, -1), BLUE),
    }
    rotD = (6, -14, -12)
    liftD = Vector((0.06, 0.2, 0.42))
    Y0 = S + 0.04
    Rl = M((LEAN, 0, 0))
    def place(v, key):
        w = Vector(v)
        if key == 'D':
            c = Vector((S / 2, S / 2, 0))
            w = M(rotD) @ (w - c) + c + liftD
        return tuple(Rl @ Vector((w.x, w.y + Y0, w.z)))
    def slab(poly, z0, z1, key, bevel):
        n = len(poly)
        verts = [place((x, y, z), key) for z in (z0, z1) for x, y in poly]
        faces = [tuple(range(n - 1, -1, -1)), tuple(range(n, 2 * n))] + [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)]
        p._prims().append(('mesh', verts, faces, bevel))
    # each piece: a thick WOOD body and a coloured painted face (its own layer, so the colour edge is crisp and inked)
    for key, (poly, col) in pieces.items():
        p.layer('skin' if key == 'A' else 'wood' + key, base=WOOD, target_faces=300, voxel=0.011, clean=True)
        p.layers[p._cur]['psegs'] = 1
        slab(poly, -T, T - 0.03, key, 0.03)
        p.layer('face' + key, base=col, target_faces=300, voxel=0.011, clean=True)
        p.layers[p._cur]['psegs'] = 1
        slab(poly, T - 0.05, T + 0.01, key, 0.012)
    p.layer('skin')
    def local_z(q):
        return (Rl.transposed() @ Vector((q.x, q.y, q.z))).z
    p.bone('body', (0, 0, 0), (0, 1.0, 0), region=lambda q: local_z(q) < T + 0.08)
    cD = place((S / 2, S / 2, 0), 'D')
    p.bone('piece', (cD[0], cD[1] - 0.3, cD[2]), (cD[0], cD[1] + 0.3, cD[2]), parent='body', region=lambda q: local_z(q) >= T + 0.08)
    finish(p, (2 * S + 0.4, 2 * S + 0.45, 0.8))


# ================================================================== pencil
def pencil():
    p = WProp('prop_word_pencil', base=YELLOW, target_faces=600, voxel=0.012)
    TIP = Vector((0.3, 0.075, 0.12))
    ANG = 60
    # pencil axis from the tip up and back-left
    d = Vector((-math.cos(math.radians(ANG)) * 0.92, math.sin(math.radians(ANG)), -math.cos(math.radians(ANG)) * 0.38)).normalized()
    # rotation taking local +y to d
    R = Vector((0, 1, 0)).rotation_difference(d).to_matrix()
    def at(t):
        return TIP + d * t
    rot_e = R.to_euler('XYZ')
    rotd = tuple(math.degrees(a) for a in rot_e)
    RH = 0.17
    LC, LB, LBand, LR = 0.34, 0.86, 0.13, 0.16
    # body: hexagon, from the cone up
    p.lathe(rounded([(0, LC - 0.02), (RH, LC), (RH, LC + LB), (0, LC + LB)], 0.02, n=2), pos=tuple(TIP), rot=rotd, seg=6)
    # facet shading: alternate faces a shade darker
    def facet(q, n):
        l = R.transposed() @ (Vector((q.x, q.y, q.z)) - TIP)
        a = math.atan2(l.x, l.z) % TAU
        return int((a + TAU / 12) // (TAU / 6)) % 2 == 1 and LC < l.y < LC + LB
    p.paint_fn(facet, 0xf2c21e)
    # WOOD cone
    p.layer('cone', base=WOOD, target_faces=260, voxel=0.01)
    p.lathe([(0, 0.06), (0.06, 0.08), (RH * 0.98, LC), (0, LC)], pos=tuple(TIP), rot=rotd, seg=24)
    p.layer('tip', base=INK, target_faces=120, voxel=0.008)
    p.lathe(rounded([(0, 0.0), (0.035, 0.02), (0.066, 0.11), (0, 0.11)], 0.02, n=2), pos=tuple(TIP), rot=rotd, seg=16)
    # metal band + rubber
    p.layer('band', base=GREY, target_faces=220, voxel=0.01)
    y0 = LC + LB - 0.01
    p.lathe(rounded([(0, y0), (RH + 0.012, y0), (RH + 0.012, y0 + LBand), (0, y0 + LBand)], 0.02, n=2), pos=tuple(TIP), rot=rotd, seg=28)
    p.paint_fn(lambda q, n: abs((R.transposed() @ (Vector((q.x, q.y, q.z)) - TIP)).y - (y0 + LBand * 0.5)) < 0.022, WHITE)
    p.layer('rubber', base=PINK, target_faces=240, voxel=0.01)
    y1 = y0 + LBand - 0.01
    p.lathe(rounded([(0, y1), (RH - 0.005, y1), (RH - 0.005, y1 + LR - 0.06), (0.0, y1 + LR)], 0.07, n=4), pos=tuple(TIP), rot=rotd, seg=28)
    # WHITE paper square under the point
    p.layer('paper', base=WHITE, target_faces=160, voxel=0.012)
    p.box((0, 0.03, 0), (0.7, 0.03, 0.5), rot=(0, 8, 0), bevel=0.025)
    # the curly GREY line drawn on the paper ending at the point
    p.layer('line', base=0x8a919c, target_faces=300, voxel=0.008)
    pts = []
    for i in range(60):
        t = i / 59
        x = -0.48 + 0.78 * t
        a = t * TAU * 2.2
        pts.append((x + 0.09 * math.sin(a), 0.07, 0.05 + 0.11 * math.cos(a) - 0.08 + 0.15 * t))
    pts[-1] = (TIP.x, 0.07, TIP.z)
    p.tube(pts, 0.026, rseg=8)
    p.layer('skin')
    top = (TIP + d * (LC + LB + LBand + LR)).y
    finish(p, (1.42, top, 1.05))


# ================================================================== xylophone
def xylophone():
    TILT = 40                       # the bar plane tipped toward the camera (back raised on two legs)
    p = WProp('prop_word_xylophone', base=WOOD, target_faces=700, voxel=0.013)
    COLS = [RED, ORANGE, YELLOW, GREEN, SKY, BLUE, PURPLE, PINK]
    N = 8
    BW, GAP = 0.22, 0.05
    X0 = -(N * BW + (N - 1) * GAP) / 2 + BW / 2
    Lmax, Lmin = 1.0, 0.6
    def blen(i):
        return Lmax + (Lmin - Lmax) * i / (N - 1)
    Rt = M((TILT, 0, 0))
    H0 = 0.5                         # height of the bar plane centre
    def P(x, y, z):
        return tuple(Rt @ Vector((x, y, z)) + Vector((0, H0, 0.0)))
    def L(q):
        return Rt.transposed() @ (Vector((q.x, q.y, q.z)) - Vector((0, H0, 0)))
    xa, xb = X0 - 0.2, X0 + (N - 1) * (BW + GAP) + 0.2
    # the frame: two chunky rails under the bar ends (converging), joined by end blocks
    for s in (-1, 1):
        za, zb = s * (Lmax / 2 - 0.12), s * (Lmin / 2 - 0.12)
        p.tube([P(xa, -0.1, za), P(xb, -0.1, zb)], 0.085, rseg=12)
    for x in (xa, xb):
        za = (Lmax if x == xa else Lmin) / 2 - 0.12
        rbox(p, P(x, -0.1, 0), (0.08, 0.065, za + 0.08), rot=(TILT, 0, 0), bevel=0.05)
    # two back legs down to the floor
    for x, zl in ((xa + 0.08, -(Lmax / 2 - 0.12)), (xb - 0.08, -(Lmin / 2 - 0.12))):
        top = P(x, -0.16, zl)
        p.tube([top, (top[0], 0.12, top[2] - 0.05)], 0.06, rseg=10)
    p.paint_fn(lambda q, n: abs(L(q).y + 0.1) < 0.02 and abs(L(q).x) < xb, WOOD_D)
    # four round RED feet
    p.layer('feet', base=RED, target_faces=300, voxel=0.012)
    for x, zl in ((xa + 0.08, -(Lmax / 2 - 0.12)), (xb - 0.08, -(Lmin / 2 - 0.12))):
        top = P(x, -0.16, zl)
        p.blob((top[0], 0.09, top[2] - 0.05), (0.1, 0.09, 0.1), group='fb%.2f' % x)
    for x, zl in ((xa + 0.08, Lmax / 2 - 0.12), (xb - 0.08, Lmin / 2 - 0.12)):
        f = P(x, -0.18, zl)
        p.blob((f[0], max(0.09, f[1] - 0.04), f[2]), (0.1, 0.09, 0.1), group='ff%.2f' % x)
    # bars (each its own layer and bone), with two GREY pegs each
    bars = []
    for i in range(N):
        x = X0 + i * (BW + GAP)
        Lb = blen(i)
        p.layer('b%d' % (i + 1), base=COLS[i], target_faces=180, voxel=0.011)
        rbox(p, P(x, 0.0, 0), (BW / 2, 0.055, Lb / 2), rot=(TILT, 0, 0), bevel=0.045)
        bars.append((x, Lb))
    p.layer('pegs', base=GREY, target_faces=400, voxel=0.008)
    for i, (x, Lb) in enumerate(bars):
        for s in (-1, 1):
            p.blob(P(x, 0.06, s * (Lb / 2 - 0.12)), (0.035, 0.022, 0.035), rot=(TILT, 0, 0), group='pg%d%d' % (i, s))
    # two beaters crossing over the low end of the bars
    p.layer('sticks', base=WOOD_L, target_faces=300, voxel=0.01)
    ST = [((-0.15, 0.17, -0.3), (0.62, 0.17, 0.2)), ((-0.05, 0.13, 0.32), (0.7, 0.13, -0.12))]
    for a, b in ST:
        p.tube([P(*a), P(*b)], 0.035, rseg=8)
    p.layer('heads', base=RED, target_faces=300, voxel=0.01)
    for k, (a, b) in enumerate(ST):
        p.blob(P(b[0] + 0.04, b[1] + 0.02, b[2] + (0.03 if k == 0 else -0.02)), (0.1, 0.1, 0.1), group='h%d' % k)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 1.0, 0), region=lambda q: L(q).y < -0.03 or L(q).y > 0.075)
    for i, (x, Lb) in enumerate(bars):
        a = P(x, 0.0, -Lb / 2); b = P(x, 0.0, Lb / 2)
        p.bone('bar.%d' % (i + 1), a, b, parent='body',
               region=lambda q, x=x: abs(q.x - x) < BW / 2 + 0.01 and -0.03 <= L(q).y <= 0.075)
    finish(p, (xb - xa + 0.3, 1.0, 1.0))


# ================================================================== bell
def bell():
    p = WProp('prop_word_bell', base=YELLOW, target_faces=700, voxel=0.012)
    Y0 = 0.25                       # rim height (the clapper ball peeks out under it)
    prof = rounded([(0.62, Y0), (0.6, Y0 + 0.08), (0.5, Y0 + 0.22), (0.42, Y0 + 0.5), (0.38, Y0 + 0.82), (0.26, Y0 + 0.98), (0.0, Y0 + 1.02),
                    (0.0, Y0 + 0.93), (0.22, Y0 + 0.9), (0.31, Y0 + 0.8), (0.35, Y0 + 0.5), (0.43, Y0 + 0.22), (0.53, Y0 + 0.08), (0.53, Y0)], 0.04, n=3)
    p.lathe(prof, seg=48, closed=True)
    p.paint_fn(lambda q, n: math.hypot(q.x, q.z) < 0.5 and q.y < Y0 + 0.86 and n.y < 0.2 and (q.x * n.x + q.z * n.z) < 0, 0xe8b420)
    # hard-edged shine band
    p.paint_fn(lambda q, n: n.z > 0.35 and -0.24 < q.x < -0.14 and Y0 + 0.3 < q.y < Y0 + 0.82, 0xffe98a)
    # ORANGE rim band
    p.layer('rim', base=ORANGE, target_faces=300, voxel=0.01)
    p.ring((0, Y0 + 0.07, 0), 0.6, 0.065, seg=48, rseg=10)
    # RED clapper on a short rod
    p.layer('clapper', base=RED, target_faces=250, voxel=0.01)
    p.blob((0, 0.15, 0), (0.15, 0.15, 0.15), group='c')
    p.capsule((0, 0.2, 0), (0, Y0 + 0.9, 0), 0.04, group='rod')
    p.paint_fn(lambda q, n: q.y > 0.3, GREY)
    # WOOD handle
    p.layer('handle', base=WOOD, target_faces=350, voxel=0.011)
    p.lathe(rounded([(0, Y0 + 0.96), (0.13, Y0 + 0.97), (0.15, Y0 + 1.04), (0.1, Y0 + 1.1), (0.1, Y0 + 1.42), (0.15, Y0 + 1.52), (0.16, Y0 + 1.62),
                     (0.1, Y0 + 1.7), (0, Y0 + 1.72)], 0.04, n=3), seg=28)
    p.layer('skin')
    p.bone('body', (0, 0.0, 0), (0, Y0 + 1.7, 0), region=lambda q: not (math.hypot(q.x, q.z) < 0.2 and q.y < Y0 + 0.88))
    p.bone('tail.1', (0, Y0 + 0.88, 0), (0, 0.02, 0), parent='body', region=lambda q: math.hypot(q.x, q.z) < 0.2 and q.y < Y0 + 0.88)
    finish(p, (1.32, Y0 + 1.72, 1.32))


# ================================================================== guitar
def guitar():
    p = WProp('prop_word_guitar', base=ORANGE, target_faces=1300, voxel=0.013)
    TH = 0.15
    p.blob((0, 0.52, 0), (0.58, 0.52, TH), group='gb')
    p.blob((0, 1.2, 0), (0.45, 0.4, TH), group='gb')
    # sound hole in a WHITE ring, darker edge band
    HC = (0, 0.95)
    p.paint_fn(lambda q, n: n.z > 0.5 and math.hypot(q.x - HC[0], q.y - HC[1]) < 0.28, WHITE)
    p.paint_fn(lambda q, n: n.z > 0.5 and math.hypot(q.x - HC[0], q.y - HC[1]) < 0.205, INK)
    p.paint_fn(lambda q, n: abs(n.z) < 0.35, 0xe8801c)
    # bridge
    p.layer('bridge', base=WOOD_D, target_faces=300, voxel=0.01)
    p.box((0, 0.4, TH + 0.01), (0.2, 0.045, 0.04), bevel=0.03)
    # neck + head + frets
    p.layer('neck', base=WOOD, target_faces=700, voxel=0.012)
    p.box((0, 1.7, 0.03), (0.17, 0.4, 0.075), bevel=0.05)
    p.box((0, 2.22, 0.0), (0.2, 0.2, 0.07), bevel=0.07)
    p.paint_fn(lambda q, n: 1.42 < q.y < 2.0 and n.z > 0.5 and abs(((q.y - 1.42) % 0.16) - 0.08) < 0.014, WOOD_D)
    # four fat CREAM strings
    p.layer('strings', base=CREAM, target_faces=500, voxel=0.008)
    for i in range(4):
        x0 = (i - 1.5) * 0.085
        p.tube([(x0, 0.42, TH + 0.075), (x0, 1.3, TH + 0.06), (x0, 2.04, 0.11)], 0.022, rseg=6)
    # four YELLOW tuning pegs, two each side of the head
    p.layer('pegs', base=YELLOW, target_faces=400, voxel=0.01)
    for s in (-1, 1):
        for y in (2.12, 2.3):
            p.capsule((s * 0.18, y, 0), (s * 0.27, y, 0), 0.04, group='pk%d%.1f' % (s, y))
            p.blob((s * 0.31, y, 0), (0.07, 0.07, 0.05), group='pk%d%.1f' % (s, y))
    p.layer('skin')
    finish(p, (1.16, 2.42, 0.36))


# ================================================================== violin
def violin():
    LEAN = 12
    p = WProp('prop_word_violin', base=BROWN, target_faces=1200, voxel=0.012)
    Rl = M((-LEAN, 0, 0))
    def P(x, y, z):
        return tuple(Rl @ Vector((x, y, z)) + Vector((0, 0, 0.1)))
    TH = 0.1
    # body: lower bout, upper bout, a narrow waist with C-cuts
    p.blob(P(0, 0.36, 0), (0.37, 0.31, TH), rot=(-LEAN, 0, 0), group='vb')
    p.blob(P(0, 0.95, 0), (0.3, 0.25, TH), rot=(-LEAN, 0, 0), group='vb')
    p.blob(P(0, 0.66, 0), (0.2, 0.2, TH * 0.95), rot=(-LEAN, 0, 0), group='vb')
    for s in (-1, 1):
        p.blob(P(s * 0.31, 0.66, 0), (0.12, 0.1, 0.2), rot=(-LEAN, 0, 0), group='vb', negative=True)
    # darker edge purfling
    p.paint_fn(lambda q, n: abs((Rl.transposed() @ Vector((n.x, n.y, n.z))).z) < 0.45, 0x8f5f36)
    # INK fingerboard + chin rest + tailpiece
    p.layer('board', base=INK, target_faces=400, voxel=0.01)
    p.box(P(0, 1.0, TH + 0.01), (0.055, 0.42, 0.025), rot=(-LEAN, 0, 0), bevel=0.02)
    p.box(P(0, 0.22, TH + 0.0), (0.06, 0.1, 0.022), rot=(-LEAN, 0, 0), bevel=0.02)
    p.blob(P(-0.17, 0.1, TH - 0.01), (0.12, 0.075, 0.04), rot=(-LEAN, 0, 0), group='chin')
    # f-holes: two INK S-curves
    for s in (-1, 1):
        pts = [P(s * 0.15 + s * 0.03 * math.sin(t * math.pi * 2) , 0.47 + 0.3 * t, TH + 0.005) for t in [k / 10 for k in range(11)]]
        p.tube(pts, 0.018, rseg=6)
        p.blob(pts[0], (0.03, 0.03, 0.02), group='fa%d' % s)
        p.blob(pts[-1], (0.03, 0.03, 0.02), group='fb%d' % s)
    # neck, pegbox and curled scroll (BROWN)
    p.layer('neck', base=0x9a6a40, target_faces=600, voxel=0.011)
    p.box(P(0, 1.36, 0.03), (0.05, 0.2, 0.055), rot=(-LEAN, 0, 0), bevel=0.04)
    p.box(P(0, 1.62, 0.0), (0.06, 0.1, 0.06), rot=(-LEAN, 0, 0), bevel=0.04)
    sc = []
    for i in range(30):
        t = i / 29
        a = t * TAU * 1.15
        r = 0.14 * (1 - 0.6 * t)
        sc.append(P(0, 1.8 + r * math.sin(a), 0.0 + r * math.cos(a) - 0.0))
    p.tube(sc, [0.07 - 0.03 * (i / 29) for i in range(30)], rseg=10)
    for s in (-1, 1):
        p.capsule(P(s * 0.06, 1.6, 0.0), P(s * 0.13, 1.6, 0.0), 0.03, group='pg%d' % s)
    # the bow across the front: WOOD stick + WHITE hair + INK frog
    p.layer('bow', base=WOOD, target_faces=500, voxel=0.01)
    b0, b1 = Vector((-0.62, 0.16, 0.42)), Vector((0.58, 1.62, 0.2))
    p.tube([tuple(b0), tuple(b1)], 0.03, rseg=8)
    p.blob(tuple(b1), (0.04, 0.05, 0.04), group='bt')
    p.layer('hair', base=WHITE, target_faces=400, voxel=0.009)
    off = Vector((0.07, -0.05, 0.0))
    p.tube([tuple(b0 + off + (b1 - b0) * 0.08), tuple(b1 + off * 0.6)], 0.022, rseg=6)
    p.layer('frog', base=INK, target_faces=200, voxel=0.009)
    p.box(tuple(b0 + (b1 - b0) * 0.07 + off * 0.5), (0.05, 0.035, 0.03), rot=(0, 0, 50), bevel=0.02)
    p.layer('skin')
    finish(p, (1.3, 1.98, 0.75))


# ================================================================== piano
def piano():
    p = WProp('prop_word_piano', base=RED, target_faces=1300, voxel=0.015)
    W, D = 0.82, 0.36
    p.box((0, 0.88, -0.12), (W, 0.62, D), bevel=0.14)                   # the upright cabinet
    p.box((0, 0.64, 0.24), (W, 0.08, 0.2), bevel=0.06)                 # key bed shelf
    p.box((0, 0.42, 0.14), (W - 0.06, 0.14, 0.14), bevel=0.06)         # below the keys
    # top lid line + hard-edged shine
    # WOOD feet
    p.layer('feet', base=WOOD, target_faces=400, voxel=0.012)
    for s in (-1, 1):
        for z in (-0.32, 0.22):
            p.cyl((s * (W - 0.14), 0, z), 0.09, 0.3, r2=0.07, bevel=0.03, seg=16)
    # keys: 8 WHITE + 5 INK, tipped toward the camera
    KT = 18
    Rk = M((KT, 0, 0))
    KY, KZ = 0.75, 0.28
    def K(x, y, z):
        return tuple(Rk @ Vector((x, y, z)) + Vector((0, KY, KZ)))
    NW = 8
    KW = (2 * W - 0.2) / NW
    xs = [-(W - 0.1) + KW / 2 + i * KW for i in range(NW)]
    for i, x in enumerate(xs):
        p.layer('key%d' % (i + 1), base=WHITE, target_faces=150, voxel=0.01)
        p.box(K(x, 0.0, 0.0), (KW / 2 - 0.012, 0.05, 0.19), rot=(KT, 0, 0), bevel=0.03)
    p.layer('black', base=INK, target_faces=500, voxel=0.01)
    for i in (0, 1, 3, 4, 5):
        x = xs[i] + KW / 2
        p.box(K(x, 0.07, -0.06), (KW * 0.28, 0.05, 0.12), rot=(KT, 0, 0), bevel=0.025)
    # YELLOW music note sticker on the front above the keys
    p.layer('note', base=YELLOW, target_faces=400, voxel=0.008)
    nz = -0.12 + D + 0.005
    p.blob((-0.1, 1.0, nz), (0.1, 0.075, 0.03), rot=(0, 0, 25), group='h1')
    p.blob((0.17, 1.06, nz), (0.1, 0.075, 0.03), rot=(0, 0, 25), group='h2')
    p.box((-0.015, 1.18, nz), (0.025, 0.17, 0.025), bevel=0.012)
    p.box((0.255, 1.24, nz), (0.025, 0.17, 0.025), bevel=0.012)
    p.box((0.12, 1.36, nz), (0.15, 0.035, 0.025), rot=(0, 0, 12), bevel=0.012)
    p.layer('skin')
    def keyloc(q):
        return Rk.transposed() @ (Vector((q.x, q.y, q.z)) - Vector((0, KY, KZ)))
    p.bone('body', (0, 0, 0), (0, 1.4, 0), region=lambda q: not (keyloc(q).y > -0.06 and keyloc(q).z > -0.21 and abs(q.x) < W - 0.08 and keyloc(q).y < 0.06))
    for i, x in enumerate(xs):
        p.bone('key.%d' % (i + 1), K(x, 0, -0.19), K(x, 0, 0.19), parent='body',
               region=lambda q, x=x: abs(q.x - x) < KW / 2 - 0.005 and keyloc(q).y > -0.06 and keyloc(q).y < 0.052 and keyloc(q).z > -0.21)
    finish(p, (2 * W, 1.5, 0.95))


# ================================================================== yo-yo
def yoyo():
    p = WProp('prop_word_yoyo', base=RED, target_faces=900, voxel=0.012)
    R, C = 0.5, 0.52                    # disc radius, centre height
    for s in (-1, 1):
        prof = rounded([(0, s * 0.03), (0.2, s * 0.03), (R - 0.02, s * 0.08), (R, s * 0.2), (R - 0.06, s * 0.27), (0, s * 0.28)], 0.06, n=3)
        if s < 0:
            prof = prof[::-1]
        p.lathe(prof, pos=(0, C, 0), rot=(90, 0, 0), seg=40)
    p.cyl((0, C, -0.06), 0.11, 0.12, rot=(90, 0, 0), bevel=0.0, seg=20)
    p.paint_fn(lambda q, n: abs(q.z) < 0.065 and math.hypot(q.x, q.y - C) < 0.2, 0xd93838)
    # YELLOW stars on both faces
    p.layer('stars', base=YELLOW, target_faces=400, voxel=0.008)
    st = star_poly(0.27, inner=0.5)
    prism(p, st, 0.0, 0.04, bevel=0.01, at=(0, C, 0.265))
    prism(p, st[::-1], -0.04, 0.0, bevel=0.01, at=(0, C, -0.265))
    # the fat WHITE string up to a finger loop
    p.layer('string', base=WHITE, target_faces=500, voxel=0.01)
    TOP = 2.0
    p.tube([(0, C, 0), (0, C + R - 0.02, 0), (0.0, TOP - 0.26, 0)], 0.045, rseg=8)
    p.ring((0, TOP - 0.14, 0), 0.12, 0.045, rot=(90, 0, 0), rseg=8)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, TOP, 0), region=lambda q: q.y > C + R + 0.02)
    p.bone('yoyo', (0, C, 0), (0, C + R, 0), parent='body', region=lambda q: q.y <= C + R + 0.02)
    finish(p, (2 * R, TOP, 0.6))


# ================================================================== swing
def swing():
    p = WProp('prop_word_swing', base=WOOD, target_faces=1300, voxel=0.015)
    TOPY, X = 2.0, 0.95
    for s in (-1, 1):
        for zz in (-1, 1):
            p.tube([(s * X, TOPY - 0.02, 0), (s * (X + 0.08), 0.05, zz * 0.62)], 0.075, rseg=10)
            p.blob((s * (X + 0.08), 0.06, zz * 0.62), (0.1, 0.07, 0.1), group='ft%d%d' % (s, zz))
        p.tube([(s * (X + 0.04), 0.7, -0.33), (s * (X + 0.04), 0.7, 0.33)], 0.05, rseg=8)
    p.tube([(-X - 0.12, TOPY, 0), (X + 0.12, TOPY, 0)], 0.09, rseg=12)
    for s in (-1, 1):
        p.blob((s * (X + 0.12), TOPY, 0), (0.11, 0.11, 0.11), group='cap%d' % s)
    # YELLOW ropes
    p.layer('ropes', base=YELLOW, target_faces=600, voxel=0.01)
    SY = 0.62
    for s in (-1, 1):
        p.tube([(s * 0.32, TOPY - 0.06, 0), (s * 0.32, SY + 0.3, 0)], 0.04, rseg=8)
        p.ring((s * 0.32, TOPY - 0.03, 0), 0.07, 0.03, rot=(0, 0, 90), rseg=6)
    p.paint_fn(lambda q, n: math.sin(q.y * 26) > 0.7, 0xe8b820)
    # RED bucket seat with leg holes
    p.layer('seat', base=RED, target_faces=900, voxel=0.013)
    p.box((0, SY + 0.02, 0), (0.36, 0.08, 0.24), bevel=0.07)
    p.box((0, SY + 0.22, -0.2), (0.36, 0.22, 0.06), rot=(-10, 0, 0), bevel=0.06)
    for s in (-1, 1):
        p.box((s * 0.33, SY + 0.17, 0.0), (0.05, 0.16, 0.24), bevel=0.05)
    p.box((0, SY + 0.14, 0.2), (0.12, 0.13, 0.05), bevel=0.05)          # the front bar between the leg holes
    p.paint_fn(lambda q, n: q.y > SY + 0.29 and n.y > 0.5, 0xd93838)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, TOPY, 0), region=lambda q: q.y > TOPY - 0.14 or abs(q.x) > 0.6)
    p.bone('swing', (0, TOPY, 0), (0, SY, 0), parent='body', region=lambda q: q.y <= TOPY - 0.14 and abs(q.x) <= 0.6)
    finish(p, (2 * X + 0.4, TOPY + 0.1, 1.45))


# ================================================================== slide
def slide():
    p = WProp('prop_word_slide', base=BLUE, target_faces=1300, voxel=0.014)
    PY = 1.3                                   # platform height
    LX = -0.78                                 # ladder top x
    ZW = 0.36                                  # half width (ladder / platform / chute)
    for zz in (-ZW, ZW):
        p.tube([(LX - 0.38, 0.04, zz), (LX, PY + 0.02, zz), (LX + 0.02, PY + 0.5, zz)], 0.065, rseg=10)     # ladder rail + hand rail post
        p.blob((LX - 0.38, 0.05, zz), (0.09, 0.06, 0.09), group='lf%.1f' % zz)
        p.tube([(LX + 0.44, 0.04, zz), (LX + 0.44, PY + 0.02, zz)], 0.065, rseg=10)                         # back leg of the platform
        p.blob((LX + 0.44, 0.05, zz), (0.09, 0.06, 0.09), group='pf%.1f' % zz)
        p.tube([(LX + 0.02, PY + 0.5, zz), (LX + 0.2, PY + 0.6, zz), (LX + 0.42, PY + 0.42, zz)], 0.055, rseg=8)  # hand rail arc
    for k in range(4):
        t = (k + 0.8) / 4.8
        p.tube([(LX - 0.38 + 0.38 * t, 0.04 + (PY - 0.02) * t, -ZW), (LX - 0.38 + 0.38 * t, 0.04 + (PY - 0.02) * t, ZW)], 0.05, rseg=8)
    p.box((LX + 0.22, PY, 0), (0.3, 0.06, ZW + 0.05), bevel=0.05)               # platform
    # the YELLOW chute: a trough from the platform swooping down to the right and flattening out at the floor
    p.layer('chute', base=YELLOW, target_faces=1100, voxel=0.013)
    path = []
    NS = 28
    for i in range(NS + 1):
        t = i / NS
        x = LX + 0.48 + 1.55 * t
        y = 0.08 + (PY - 0.02) * (0.5 + 0.5 * math.cos(math.pi * min(1.0, t * 1.12))) ** 1.15
        path.append(Vector((x, y, 0.0)))
    WID, WALL = ZW - 0.02, 0.16
    sec = rounded([(-WID - 0.06, WALL), (-WID - 0.06, -0.05), (WID + 0.06, -0.05), (WID + 0.06, WALL), (WID, WALL), (WID, 0.03), (-WID, 0.03), (-WID, WALL)], 0.035, n=2, closed=True)
    ns = len(sec)
    verts, faces = [], []
    for i, c in enumerate(path):
        tv = (path[min(i + 1, NS)] - path[max(i - 1, 0)]).normalized()
        side = Vector((0, 0, 1))
        up = side.cross(tv).normalized()
        for u, v, *_ in sec:
            verts.append(tuple(c + side * u + up * v))
    for i in range(NS):
        for k in range(ns):
            k2 = (k + 1) % ns
            faces.append((i * ns + k, i * ns + k2, (i + 1) * ns + k2, (i + 1) * ns + k))
    faces.append(tuple(range(ns - 1, -1, -1)))
    faces.append(tuple(NS * ns + k for k in range(ns)))
    p._prims().append(('mesh', verts, faces, 0.02))
    # the sliding surface a lighter yellow (hard edge), the raised sides stay YELLOW
    p.paint_fn(lambda q, n: n.y > 0.45 and abs(q.z) < WID - 0.01, 0xffe57a)
    p.layer('skin')
    finish(p, (2.4, PY + 0.66, 2 * ZW + 0.2))


# ================================================================== robot
def robot():
    BODY, BODY_D = GREY, 0x9aa3ae
    p = WProp('prop_word_robot', base=BODY, target_faces=2000, voxel=0.015)
    # body + legs + fat feet
    p.box((0, 0.88, 0), (0.42, 0.36, 0.3), bevel=0.12)
    p.paint_fn(lambda q, n: abs(n.y) < 0.3 and abs(n.x) > 0.6, BODY_D)
    p.layer('legs', base=SLATE, target_faces=700, voxel=0.013)
    for s in (-1, 1):
        p.cyl((s * 0.2, 0.2, 0.0), 0.1, 0.36, bevel=0.03, seg=20)
        p.box((s * 0.21, 0.1, 0.06), (0.17, 0.1, 0.24), bevel=0.08)
    p.paint_fn(lambda q, n: q.y < 0.21, 0x58637a)
    # head: SKY rounded box, screen panel
    p.layer('head', base=SKY, target_faces=1400, voxel=0.014)
    HY = 1.62
    p.box((0, HY, 0), (0.4, 0.33, 0.3), bevel=0.13)
    for s in (-1, 1):
        p.cyl((s * 0.38, HY, 0), 0.1, 0.1, rot=(0, 0, -s * 90), bevel=0.03, seg=20)   # ear bolts
    p.paint_fn(lambda q, n: n.z > 0.85 and abs(q.x) < 0.3 and abs(q.y - HY) < 0.23, 0x2f6fa8)
    p.paint_fn(lambda q, n: abs(q.x) > 0.43, 0x6fbde8)
    # antenna + RED ball
    p.layer('antenna', base=SLATE, target_faces=300, voxel=0.01)
    p.tube([(0, HY + 0.3, 0), (0.0, HY + 0.62, 0)], 0.035, rseg=8)
    p.layer('ball', base=RED, target_faces=200, voxel=0.01)
    p.blob((0, HY + 0.7, 0), (0.1, 0.1, 0.1), group='ab')
    # arms with C-claws
    p.layer('arms', base=SLATE, target_faces=900, voxel=0.012)
    for s in (-1, 1):
        p.blob((s * 0.46, 1.06, 0), (0.1, 0.1, 0.1), group='sh%d' % s)
        p.tube([(s * 0.46, 1.06, 0), (s * 0.6, 0.86, 0.06), (s * 0.64, 0.62, 0.12)], 0.065, rseg=10)
        cc = (s * 0.66, 0.47, 0.14)
        p.ring(cc, 0.13, 0.055, rot=(90, 0, 0), a0=math.radians(220), a1=math.radians(500), seg=20, rseg=8)
    p.paint_fn(lambda q, n: q.y < 0.6, YELLOW)
    # chest: three coloured buttons and a dial
    p.layer('buttons', base=RED, target_faces=500, voxel=0.009)
    for i, (x, col) in enumerate(((-0.2, RED), (-0.04, YELLOW), (0.12, GREEN))):
        p.cyl((x, 0.98, 0.29), 0.06, 0.05, rot=(90, 0, 0), bevel=0.02, seg=16)
    p.paint_fn(lambda q, n: -0.11 < q.x < 0.04, YELLOW)
    p.paint_fn(lambda q, n: q.x >= 0.04, GREEN)
    p.layer('dial', base=WHITE, target_faces=300, voxel=0.009)
    p.cyl((0.0, 0.72, 0.28), 0.12, 0.05, rot=(90, 0, 0), bevel=0.02, seg=24)
    p.paint_fn(lambda q, n: q.z > 0.32 and abs(q.x - (q.y - 0.72) * 0.6) < 0.02 and q.y > 0.7, RED)
    p.layer('skin')
    p.bone('body', (0, 0.0, 0), (0, 1.25, 0), region=lambda q: q.y < 1.25 and abs(q.x) < 0.44)
    p.bone('head', (0, 1.25, 0), (0, HY + 0.33, 0), parent='body', region=lambda q: q.y >= 1.25 and q.y < HY + 0.6)
    p.bone('antenna.1', (0, HY + 0.3, 0), (0, HY + 0.78, 0), parent='head', region=lambda q: q.y >= HY + 0.36)
    for s, nm in ((-1, 'L'), (1, 'R')):
        p.bone('arm.' + nm, (s * 0.46, 1.06, 0), (s * 0.65, 0.5, 0.12), parent='body', region=lambda q, s=s: q.x * s >= 0.44 and q.y < 1.2)
    p.face(center=(0, HY, 0.3), radius=0.3, faceScale=1.2, bone='head')
    finish(p, (1.5, HY + 0.82, 0.62))


# ================================================================== rocket
def rocket():
    p = WProp('prop_word_rocket', base=WHITE, target_faces=1300, voxel=0.014)
    B0, R = 0.3, 0.4
    prof = rounded([(0, B0 - 0.05), (0.3, B0 - 0.05), (R, B0 + 0.12), (R + 0.03, B0 + 0.7), (R - 0.02, B0 + 1.15), (0.0, B0 + 1.16)], 0.08, n=3)
    p.lathe(prof, seg=40)
    p.paint_fn(lambda q, n: n.z > 0.3 and -0.3 < q.x < -0.2 and B0 + 0.2 < q.y < B0 + 1.0, 0xe6e6ee)
    # RED nose cone
    p.layer('nose', base=RED, target_faces=500, voxel=0.012)
    p.lathe(rounded([(0, B0 + 1.1), (R - 0.01, B0 + 1.1), (R - 0.06, B0 + 1.32), (0.2, B0 + 1.6), (0, B0 + 1.72)], 0.08, n=4), seg=40)
    # BLUE band
    p.layer('band', base=BLUE, target_faces=400, voxel=0.011)
    p.lathe(rounded([(0, B0 + 0.22), (R + 0.03, B0 + 0.22), (R + 0.045, B0 + 0.36), (0, B0 + 0.36)], 0.03, n=2), seg=40)
    # three RED fins
    p.layer('fins', base=RED, target_faces=700, voxel=0.012)
    fin = rounded([(0.3, B0 + 0.62), (0.68, B0 + 0.04), (0.68, 0.0), (0.42, 0.0), (0.3, B0 + 0.1)], 0.07, n=3, closed=True)
    p.layers['fins']['clean'] = True
    p.layers['fins']['remesh'] = False
    p.layers['fins']['psegs'] = 1
    for a in (90, -30, 210):
        prism(p, [(x, y) for x, y, *_ in fin], -0.05, 0.05, bevel=0.035, rot=(0, a, 0))
    # porthole: SKY glass, YELLOW rim, white glint
    p.layer('rim', base=YELLOW, target_faces=400, voxel=0.01)
    PY = B0 + 0.78
    p.ring((0, PY, R + 0.02), 0.16, 0.045, rot=(90, 0, 0), rseg=8)
    p.layer('glass', base=SKY, target_faces=300, voxel=0.01)
    p.blob((0, PY, R - 0.03), (0.15, 0.15, 0.06), group='g')
    p.paint_fn(lambda q, n: math.hypot(q.x + 0.05, q.y - PY - 0.05) < 0.04, WHITE)
    # flame tucked inside the body (bone flame pushes it out below)
    p.layer('flame', base=ORANGE, target_faces=500, voxel=0.012)
    p.blob((0, B0 + 0.25, 0), (0.2, 0.3, 0.2), group='fl')
    p.blob((0, B0 + 0.05, 0), (0.13, 0.2, 0.13), group='fl')
    p.paint_fn(lambda q, n: math.hypot(q.x, q.z) < 0.13 and q.y > B0 - 0.05 and n.y < 0.3, YELLOW)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, B0 + 1.7, 0), region=lambda q: not (math.hypot(q.x, q.z) < 0.215 and q.y < B0 + 0.58 and q.y > B0 - 0.2))
    p.bone('flame', (0, B0 + 0.55, 0), (0, B0 - 0.1, 0), parent='body', region=lambda q: math.hypot(q.x, q.z) < 0.215 and q.y < B0 + 0.58 and q.y > B0 - 0.2)
    finish(p, (1.36, B0 + 1.72, 1.36))


# ================================================================== rattle
def rattle():
    p = WProp('prop_word_rattle', base=PINK, target_faces=900, voxel=0.012)
    # PINK ringed handle
    p.tube([(0, 0.42, 0), (0, 1.02, 0)], 0.085, rseg=12)
    for y in (0.5, 0.66, 0.82):
        p.ring((0, y, 0), 0.09, 0.04, rseg=8)
    p.lathe(rounded([(0, 0.98), (0.17, 1.0), (0.15, 1.08), (0, 1.12)], 0.04, n=2), seg=24)
    # YELLOW loop at the bottom (stands on it)
    p.layer('loop', base=YELLOW, target_faces=500, voxel=0.012)
    p.ring((0, 0.24, 0), 0.19, 0.065, rot=(90, 0, 0), rseg=10)
    # see-through SKY ball: a cage of three fat rings
    BC, BR = 1.52, 0.46
    p.layer('cage', base=SKY, target_faces=1100, voxel=0.012)
    p.ring((0, BC, 0), BR, 0.05, rseg=8)
    p.ring((0, BC, 0), BR, 0.05, rot=(90, 0, 0), rseg=8)
    p.ring((0, BC, 0), BR, 0.05, rot=(90, 90, 0), rseg=8)
    p.ring((0, BC, 0), BR, 0.05, rot=(90, 45, 0), rseg=8)
    p.ring((0, BC, 0), BR, 0.05, rot=(90, -45, 0), rseg=8)
    p.blob((0, BC + BR, 0), (0.08, 0.06, 0.08), group='top')
    # five coloured beads inside
    BEADS = [((-0.15, BC - 0.1, 0.08), RED), ((0.15, BC - 0.08, 0.1), YELLOW), ((0.0, BC + 0.13, 0.12), GREEN),
             ((-0.12, BC + 0.14, -0.12), BLUE), ((0.14, BC + 0.12, -0.08), PURPLE)]
    for i, (c, col) in enumerate(BEADS):
        p.layer('bead%d' % i, base=col, target_faces=150, voxel=0.01)
        p.blob(c, (0.13, 0.13, 0.13), group='b')
    p.layer('skin')
    finish(p, (2 * BR + 0.1, BC + BR + 0.06, 2 * BR + 0.1))


# ================================================================== top
def top():
    p = WProp('prop_word_top', base=RED, target_faces=1000, voxel=0.012)
    LEAN = 8
    prof = rounded([(0, -0.05), (0.06, -0.02), (0.42, 0.3), (0.76, 0.58), (0.8, 0.66), (0.72, 0.8), (0.4, 1.0), (0.13, 1.06), (0, 1.07)], 0.07, n=4)
    p.lathe(prof, rot=(0, 0, -LEAN), seg=48)
    Rl = M((0, 0, -LEAN))
    def ly(q):
        return (Rl.transposed() @ Vector((q.x, q.y, q.z))).y
    p.paint_fn(lambda q, n: 0.3 < ly(q) <= 0.54, YELLOW)
    p.paint_fn(lambda q, n: 0.54 < ly(q) <= 0.76, GREEN)
    p.paint_fn(lambda q, n: 0.76 < ly(q), BLUE)
    p.paint_fn(lambda q, n: ly(q) < 0.06, GREY)
    p.layer('knob', base=WOOD, target_faces=500, voxel=0.011)
    p.lathe(rounded([(0, 1.0), (0.07, 1.0), (0.07, 1.3), (0.15, 1.36), (0.15, 1.46), (0.1, 1.52), (0, 1.53)], 0.04, n=3), rot=(0, 0, -LEAN), seg=24)
    p.layer('skin')
    finish(p, (1.62, 1.55, 1.62))


# ================================================================== tent
def tent():
    p = WProp('prop_word_tent', base=ORANGE, target_faces=1500, voxel=0.014)
    HW, H, D2 = 0.86, 1.36, 0.72          # half width at the base, ridge height, half depth
    TH = 0.05
    # two roof panels (slabs from the ridge to the ground), cut along z into 7 stripes: ORANGE ones in the skin, WHITE
    # ones in their own layer (each stripe edge crisp and inked like a sewn seam); the inside of both is dark PURPLE
    NSTR = 7
    def outside(q, n):
        return abs(n.x) > 0.3 and n.x * q.x > 0
    for lay in ('skin', 'stripes'):
        p.layer(lay, base=ORANGE if lay == 'skin' else WHITE, target_faces=600, voxel=0.012, clean=True)
        for k in range(NSTR):
            if (k % 2 == 0) != (lay == 'skin'):
                continue
            z0, z1 = -D2 + 2 * D2 * k / NSTR, -D2 + 2 * D2 * (k + 1) / NSTR
            for s_ in (-1, 1):
                poly = [(0, H), (s_ * HW, 0.02), (s_ * (HW - TH * 2.2), 0.02), (0, H - TH * 2.6)]
                if s_ > 0:
                    poly = poly[::-1]
                p._prims().append(('mesh', [(x, y, z) for z in (z0, z1) for x, y in poly],
                                   [tuple(range(3, -1, -1)), tuple(range(4, 8))] + [(i, (i + 1) % 4, 4 + (i + 1) % 4, 4 + i) for i in range(4)], 0.012))
        p.layers[lay]['psegs'] = 1
        p.paint_fn(lambda q, n: not outside(q, n) and abs(n.z) < 0.6, 0x5a3a8a)
    p.layer('back', base=ORANGE, target_faces=300, voxel=0.012)
    prism(p, [(-HW + 0.08, 0.02), (HW - 0.08, 0.02), (0, H - 0.1)], -D2 + 0.01, -D2 + 0.01 + TH * 1.6, bevel=0.025)
    p.paint_fn(lambda q, n: n.z > 0.5, 0x5a3a8a)
    # floor + YELLOW cushion inside
    p.layer('floor', base=0x5a3a8a, target_faces=300, voxel=0.012)
    p.box((0, 0.025, 0), (HW - 0.12, 0.025, D2 - 0.04), bevel=0.02)
    p.layer('cushion', base=YELLOW, target_faces=300, voxel=0.012)
    p.box((0.05, 0.13, -0.15), (0.28, 0.1, 0.22), rot=(0, 15, 0), bevel=0.09)
    # front flaps tied back: rolled bundles along the front edges, with RED ties
    p.layer('flaps', base=ORANGE, target_faces=600, voxel=0.012)
    for s in (-1, 1):
        a, b = Vector((s * 0.12, H - 0.16, D2 + 0.04)), Vector((s * (HW - 0.06), 0.08, D2 + 0.04))
        mid = (a + b) / 2 + Vector((s * 0.1, 0.0, 0.03))
        p.tube([tuple(a), tuple(mid), tuple(b)], [0.05, 0.1, 0.06], rseg=10)
    p.paint_fn(lambda q, n: math.sin(q.y * 14) > 0.3, WHITE)
    p.layer('ties', base=RED, target_faces=300, voxel=0.01)
    for s in (-1, 1):
        c = Vector((s * 0.52, 0.56, D2 + 0.08))
        p.ring(tuple(c), 0.105, 0.03, rot=(0, 0, -s * 58), rseg=6)
    # ridge pole + flag
    p.layer('pole', base=WOOD, target_faces=400, voxel=0.01)
    p.tube([(0, H - 0.02, D2 + 0.02), (0, H + 0.42, D2 + 0.02)], 0.03, rseg=8)
    p.blob((0, H + 0.44, D2 + 0.02), (0.045, 0.045, 0.045), group='kn')
    p.layer('flag', base=RED, target_faces=200, voxel=0.01)
    prism(p, [(0.02, H + 0.38), (0.32, H + 0.29), (0.02, H + 0.2)], D2 - 0.0, D2 + 0.04, bevel=0.015)
    # two guy ropes out to WOOD pegs at the sides
    p.layer('ropes', base=CREAM, target_faces=300, voxel=0.009)
    for s in (-1, 1):
        p.tube([(s * 0.42, H * 0.53, 0.0), (s * (HW + 0.32), 0.07, 0.15)], 0.028, rseg=6)
    p.layer('pegs', base=WOOD, target_faces=200, voxel=0.009)
    for s in (-1, 1):
        p.box((s * (HW + 0.34), 0.08, 0.15), (0.04, 0.08, 0.04), rot=(0, 0, -s * 18), bevel=0.02)
    p.layer('skin')
    finish(p, (2 * HW + 0.8, H + 0.48, 2 * D2 + 0.2))


# ================================================================== word-card variants of reused models
def seesaw():
    """a chunky toy seesaw (word-card variant of prop_bal_seesaw): RED rounded pivot stand, a YELLOW plank tilted
    left-end-down, BLUE seats and RED handles at both ends. Bone plank (rotation.z rocks it on the pivot)."""
    p = WProp('prop_word_seesaw', base=RED, target_faces=900, voxel=0.013)
    PY = 0.56                                      # pivot height
    TILT = -13                                     # left end down
    L, Wz, T = 1.2, 0.26, 0.07                     # plank half length, half width, half thickness
    # the pivot stand: a rounded wedge with a WHITE axle cap
    p.prism([(-0.36, 0.0), (0.36, 0.0), (0.12, PY - 0.02), (-0.12, PY - 0.02)], -0.24, 0.24, bevel=0.06)
    p.cyl((0, PY - 0.04, -0.27), 0.11, 0.54, rot=(90, 0, 0), bevel=0.03, seg=20)
    p.paint_fn(lambda q, n: abs(n.z) > 0.7 and math.hypot(q.x, q.y - (PY - 0.04)) < 0.075, WHITE)
    Rz = M((0, 0, TILT))
    def P(x, y, z):
        return tuple(Rz @ Vector((x, y, z)) + Vector((0, PY + 0.07, 0)))
    p.layer('plank', base=YELLOW, target_faces=500, voxel=0.012)
    rbox(p, P(0, 0, 0), (L, T, Wz), rot=(0, 0, TILT), bevel=0.06)
    p.paint_fn(lambda q, n: n.y > 0.5 and abs((Rz.transposed() @ Vector((q.x, q.y, q.z - 0))).x) < 0.06, 0xe8b820)
    p.layer('seats', base=BLUE, target_faces=500, voxel=0.012)
    for s in (-1, 1):
        rbox(p, P(s * (L - 0.24), T + 0.07, 0), (0.22, 0.07, Wz + 0.02), rot=(0, 0, TILT), bevel=0.06)
        rbox(p, P(s * (L - 0.04), T + 0.26, 0), (0.06, 0.24, Wz), rot=(0, 0, TILT), bevel=0.05)   # backrest
    p.layer('handles', base=RED, target_faces=500, voxel=0.011)
    for s in (-1, 1):
        x0 = s * (L - 0.56)
        p.tube([P(x0, T, -0.15), P(x0, T + 0.3, -0.15), P(x0, T + 0.38, -0.08), P(x0, T + 0.38, 0.08), P(x0, T + 0.3, 0.15), P(x0, T, 0.15)], 0.045, rseg=8)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, PY, 0), region=lambda q: q.y < PY - 0.1 and abs(q.x) < 0.4)
    p.bone('plank', (0, PY + 0.07, 0), (0, PY + 0.6, 0), parent='body', region=lambda q: not (q.y < PY - 0.1 and abs(q.x) < 0.4))
    finish(p, (2 * L + 0.1, PY + 0.95, 0.7))


def paint():
    """a pot of paint (word-card variant of prop_m_paintpot, no face-like marks): a GREY tin with a WHITE highlight
    band and a YELLOW label with a RED splat, RED paint inside with a fat drip over the rim, a brush resting in it
    (WOOD handle, GREY ferrule, RED-tipped bristles)."""
    p = WProp('prop_word_paint', base=GREY, target_faces=900, voxel=0.012)
    R, H = 0.5, 0.78
    p.lathe(rounded([(0.0, 0.0), (R - 0.02, 0.0), (R, 0.04), (R, H - 0.06), (R + 0.04, H - 0.04), (R + 0.04, H), (R - 0.05, H), (R - 0.05, H - 0.12),
                     (0.0, H - 0.12)], 0.025, n=2), seg=48)
    p.layer('shine', base=WHITE, target_faces=300, voxel=0.01, clean=True)
    p.lathe([(R - 0.01, H - 0.2), (R + 0.012, H - 0.2), (R + 0.012, H - 0.15), (R - 0.01, H - 0.15)], seg=48, closed=True)
    p.layer('label', base=YELLOW, target_faces=400, voxel=0.01, clean=True)
    p.lathe([(R - 0.01, 0.14), (R + 0.025, 0.14), (R + 0.025, 0.48), (R - 0.01, 0.48)], seg=48, closed=True)
    # a RED paint splat on the label (crisp, own layer)
    p.layer('splat', base=RED, target_faces=300, voxel=0.008)
    spl = [(0.13 * (1 + 0.14 * math.sin(6 * TAU * i / 36)) * math.cos(TAU * i / 36), 0.11 * (1 + 0.14 * math.sin(6 * TAU * i / 36)) * math.sin(TAU * i / 36)) for i in range(36)]
    p.sticker(spl, 0.31, lambda y: R + 0.025, thick=0.03, lift=0.012, ang=0.0)
    # RED paint inside, a fat drip over the front rim
    p.layer('paint', base=RED, target_faces=500, voxel=0.011)
    p.cyl((0, H - 0.13, 0), R - 0.05, 0.06, bevel=0.0, seg=40)
    a = 0.35
    x, z = (R + 0.04) * math.sin(a), (R + 0.04) * math.cos(a)
    p.capsule((x * 0.9, H + 0.02, z * 0.9), (x, H - 0.05, z + 0.03), 0.07, group='d1')
    p.capsule((x, H - 0.05, z + 0.03), (x * 1.0, H - 0.3, z + 0.02), 0.06, r2=0.075, group='d1')
    p.blob((x, H - 0.34, z + 0.02), (0.08, 0.08, 0.07), group='d1')
    p.capsule((-0.3, H + 0.01, 0.36), (-0.31, H - 0.12, 0.42), 0.05, r2=0.055, group='d2')
    # the brush resting in the pot
    d = Vector((0.45, 1.0, -0.15)).normalized()
    b0 = Vector((-0.08, H - 0.2, -0.05))
    p.layer('handle', base=WOOD, target_faces=300, voxel=0.01)
    p.tube([tuple(b0 + d * 0.3), tuple(b0 + d * 1.15)], [0.055, 0.045], rseg=10)
    p.blob(tuple(b0 + d * 1.17), (0.06, 0.06, 0.06), group='k')
    p.layer('ferrule', base=GREY, target_faces=200, voxel=0.009)
    p.tube([tuple(b0 + d * 0.16), tuple(b0 + d * 0.32)], 0.07, rseg=12)
    p.layer('bristles', base=RED, target_faces=200, voxel=0.009)
    p.tube([tuple(b0 + d * 0.0), tuple(b0 + d * 0.17)], [0.05, 0.075], rseg=12)
    p.layer('skin')
    finish(p, (1.2, (b0 + d * 1.23).y, 1.1))


def balloon():
    """a RED party balloon on its string (word-card variant of prop_m_balloon, colour baked): a teardrop balloon with a
    WHITE shine, a knot, a curly CREAM string down to a little loop on the ground. Spring bone tail.1 (the balloon
    sways); body holds the string end."""
    p = WProp('prop_word_balloon', base=RED, target_faces=900, voxel=0.013)
    C = 1.5
    p.blob((0, C, 0), (0.56, 0.62, 0.54), group='bal')
    p.blob((0, C - 0.42, 0), (0.3, 0.3, 0.29), group='bal')
    p.paint_fn(lambda q, n: n.z > 0.3 and -0.35 < q.x < -0.15 and C + 0.12 < q.y < C + 0.42 and n.x < -0.1, 0xffb0b0)
    p.layer('knot', base=0xd93838, target_faces=200, voxel=0.009)
    p.cyl((0, C - 0.78, 0), 0.09, 0.1, r2=0.04, bevel=0.03, seg=16)
    p.blob((0, C - 0.8, 0), (0.06, 0.04, 0.06), group='k')
    p.layer('glint', base=WHITE, target_faces=100, voxel=0.008)
    p.blob((-0.27, C + 0.25, 0.43), (0.11, 0.07, 0.05), rot=(-25, -30, 40), group='g')
    p.layer('string', base=CREAM, target_faces=300, voxel=0.009)
    pts = []
    for i in range(40):
        t = i / 39
        y = C - 0.8 - (C - 0.92) * t
        pts.append((0.08 * math.sin(t * TAU * 2.2), y, 0.05 * math.cos(t * TAU * 2.2)))
    p.tube(pts, 0.036, rseg=6)
    p.ring((0.0, 0.1, 0.05), 0.08, 0.036, rot=(90, 0, 0), rseg=6)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, C - 0.85, 0), region=lambda q: q.y < C - 0.9)
    p.bone('tail.1', (0, C - 0.85, 0), (0, C + 0.62, 0), parent='body', region=lambda q: q.y >= C - 0.9)
    finish(p, (1.14, C + 0.64, 1.1))


def castle():
    """a toy castle (word-card variant of the sandcastle prop_castle): GREY stone walls with crenellations and darker
    brick marks, two round towers with RED cone roofs, a taller middle keep with a YELLOW flag, a WOOD arched door."""
    p = WProp('prop_word_castle', base=GREY, target_faces=1300, voxel=0.013)
    p.layers['skin']['clean'] = True
    p.layers['skin']['psegs'] = 2
    p.layers['skin']['segs'] = 2
    WH, WT = 0.78, 0.16                         # front wall height, half thickness
    # the front wall and a middle keep behind it
    rbox(p, (0, WH / 2, 0.12), (0.62, WH / 2, WT), bevel=0.05)
    rbox(p, (0, 0.62, -0.12), (0.34, 0.62, 0.26), bevel=0.06)
    for i in range(5):
        x = -0.48 + i * 0.24
        rbox(p, (x, WH + 0.08, 0.12), (0.075, 0.09, WT), bevel=0.035)
    for i in range(3):
        x = -0.22 + i * 0.22
        rbox(p, (x, 1.32, -0.12), (0.07, 0.09, 0.24), bevel=0.035)
    # two round towers
    TX = 0.72
    for s in (-1, 1):
        p.cyl((s * TX, 0.0, 0.05), 0.27, 1.12, bevel=0.05, seg=24)
    def bricks(q, n):
        if abs(n.y) > 0.6:
            return False
        row = int(q.y / 0.13)
        off = 0.11 if row % 2 else 0.0
        u = q.x if abs(n.z) > 0.5 else math.atan2(q.z, q.x - math.copysign(TX, q.x)) * 0.27
        return abs((q.y % 0.13) - 0.065) < 0.012 and False or (abs(((u + off) % 0.22) - 0.11) < 0.011 and abs((q.y % 0.13) - 0.065) < 0.035 and row % 3 == 1)
    p.paint_fn(lambda q, n: n.y > 0.7 and q.y > WH - 0.02, 0xd6dbe2)
    # RED cone roofs
    p.layer('roofs', base=RED, target_faces=500, voxel=0.011, clean=True)
    for s in (-1, 1):
        p.lathe(rounded([(0, 1.08), (0.36, 1.08), (0.36, 1.13), (0.0, 1.72)], 0.04, n=2), pos=(s * TX, 0, 0.05), seg=32)
    # WOOD arched door with a darker frame, INK window slits
    p.layer('door', base=WOOD, target_faces=300, voxel=0.009)
    door = [(-0.17, 0.0)] + [(0.17 * math.cos(math.pi * (1 - i / 10)), 0.34 + 0.17 * math.sin(math.pi * (1 - i / 10))) for i in range(11)] + [(0.17, 0.0)]
    p.prism(door, 0.12 + WT - 0.01, 0.12 + WT + 0.035, bevel=0.012)
    p.paint_fn(lambda q, n: abs(q.x) < 0.012 and n.z > 0.5, WOOD_D)
    p.layer('windows', base=INK, target_faces=300, voxel=0.008)
    for s in (-1, 1):
        p.sticker([(-0.045, -0.1), (0.045, -0.1), (0.045, 0.05), (0.0, 0.1), (-0.045, 0.05)], 0.72, lambda y: 0.27, thick=0.03, lift=0.008, ang=0.0)
        # (sticker wraps round a wall centred on the y axis; move it onto each tower)
        verts, faces, b = p._prims()[-1][1], p._prims()[-1][2], p._prims()[-1][3]
        p._prims()[-1] = ('mesh', [(v[0] + s * TX, v[1], v[2] + 0.05) for v in verts], faces, b)
    p.prism([(-0.05, 0.88), (0.05, 0.88), (0.05, 1.06), (0.0, 1.12), (-0.05, 1.06)], 0.13, 0.155, bevel=0.01)
    # flag pole + YELLOW flag on the keep
    p.layer('pole', base=WOOD, target_faces=200, voxel=0.009)
    p.tube([(0, 1.38, -0.12), (0, 1.95, -0.12)], 0.03, rseg=8)
    p.blob((0, 1.97, -0.12), (0.045, 0.045, 0.045), group='kn')
    p.layer('flag', base=YELLOW, target_faces=200, voxel=0.009)
    p.prism([(0.02, 1.92), (0.36, 1.82), (0.02, 1.7)], -0.14, -0.1, bevel=0.012)
    p.layer('skin')
    finish(p, (2 * TX + 0.6, 2.0, 0.8))


MODELS = dict(prop_word_book=book, prop_word_doll=doll, prop_word_teddy=teddy, prop_word_puzzle=puzzle,
              prop_word_pencil=pencil, prop_word_xylophone=xylophone, prop_word_bell=bell, prop_word_guitar=guitar,
              prop_word_violin=violin, prop_word_piano=piano, prop_word_yoyo=yoyo, prop_word_swing=swing,
              prop_word_slide=slide, prop_word_robot=robot, prop_word_rocket=rocket, prop_word_rattle=rattle,
              prop_word_top=top, prop_word_tent=tent,
              prop_word_seesaw=seesaw, prop_word_paint=paint, prop_word_balloon=balloon, prop_word_castle=castle)
for name, fn in MODELS.items():
    if not ONLY or name in ONLY:
        fn()
