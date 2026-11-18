"""Carrot (Share the snacks, Who says moo?, Sizes, the farm). A plump, tapered orange root ~1.04 long, centred on the
origin (soft round tip at y -0.52, a rounded shoulder at y +0.5), with gentle groove rings (shallow dents painted a deeper
orange) and a clean tuft of three broad feathery fronds that melt into one leafy shape (no ink inside the tuft). Each
frond is a spring chain (bones tuftA.1/2 ... tuftC.1/2, each moving only its own sector of the tuft) so the leaves wobble when the carrot is moved or lands. A face anchor on the shoulder (hidden by default in game, for hero moments)."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded
from mathutils import Vector, Matrix

ORANGE, GROOVE, SHOULDER, TIP = 0xff8a24, 0xe0641a, 0xffa53c, 0xff9a30
LEAF, LEAF_D = 0x62c84a, 0x46a83c

p = Prop('prop_carrot', base=ORANGE, target_faces=1100, voxel=0.009, smooth=3)

# ---------- the root: a custom lathe with shallow groove dents on alternating sides ----------
prof = rounded([(0.0, -0.52), (0.05, -0.5), (0.105, -0.38), (0.16, -0.18), (0.215, 0.05), (0.258, 0.27),
                (0.272, 0.4), (0.25, 0.48), (0.16, 0.53), (0.0, 0.545)], 0.05, n=5)
prof = [(r, y) for r, y in prof]


def r_of(y):
    if y <= prof[0][1]:
        return 0.0
    for (r0, y0), (r1, y1) in zip(prof, prof[1:]):
        if y0 <= y <= y1:
            return r0 + (r1 - r0) * (y - y0) / max(1e-6, y1 - y0)
    return 0.0


# grooves: (height, centre angle (0 = front, +x side positive), half-width in radians)
GROOVES = [(0.4, -0.45, 0.8), (0.3, 1.25, 0.6), (0.17, -1.3, 0.55), (-0.02, 0.5, 0.8), (-0.17, -0.45, 0.7),
           (-0.31, 0.4, 0.55), (0.26, 2.7, 0.9), (0.04, -2.6, 0.8), (-0.18, 2.9, 0.7)]   # (none across the face)
GW, GD = 0.021, 0.013   # groove half-height, depth


def groove(y, a):
    """0..1 depth of a groove dent at height y, angle a."""
    best = 0.0
    for gy, ga, gw in GROOVES:
        da = math.atan2(math.sin(a - ga), math.cos(a - ga))
        u = da / gw
        if abs(u) >= 1:
            continue
        taper = 1 - u * u
        dy = (y - gy - 0.01 * u * u) / (GW * (0.45 + 0.55 * taper))
        if abs(dy) < 1:
            best = max(best, taper * (1 - dy * dy))
    return best


def bend(y):   # a tiny curve to the tip, for charm
    return 0.035 * ((0.5 - y) / 1.0) ** 2


SEG, NY = 56, 110
ys = [-0.52 + (0.545 + 0.52) * k / NY for k in range(NY + 1)]
verts, faces = [], []
for y in ys[1:-1]:
    for i in range(SEG):
        a = math.tau * i / SEG
        r = r_of(y)
        r -= GD * groove(y, a) * min(1, r / 0.12)
        verts.append((r * math.sin(a) + bend(y), y, r * math.cos(a)))
nr = len(ys) - 2
for k in range(nr - 1):
    for i in range(SEG):
        j = (i + 1) % SEG
        faces.append((k * SEG + i, k * SEG + j, (k + 1) * SEG + j, (k + 1) * SEG + i))
bot = len(verts); verts.append((bend(ys[0]), ys[0], 0))
top = len(verts); verts.append((0, ys[-1], 0))
for i in range(SEG):
    j = (i + 1) % SEG
    faces.append((bot, j, i))
    faces.append((top, (nr - 1) * SEG + i, (nr - 1) * SEG + j))
p.mesh(verts, faces)


def in_groove(q, n):
    r = math.hypot(q.x - bend(q.y), q.z)
    if r < 0.05:
        return False
    return groove(q.y, math.atan2(q.x - bend(q.y), q.z)) > 0.22


p.paint_fn(lambda q, n: q.y > 0.47, SHOULDER)            # the rounded shoulder catches the light
p.paint_fn(in_groove, GROOVE)

# ---------- the leafy tuft: five feathery fronds fanning up out of the shoulder ----------
# Each frond is a stalk carrying overlapping oval leaflets (alternating sides) that melt into one soft, scalloped,
# feather-shaped blade - lush and chunky, and it reads at thumbnail size.
p.layer('leaves', base=LEAF, target_faces=1300, voxel=0.0085)
p.resolution = 0.009                     # fine metaballs: the stalks are thin
TOP = Vector((0, 0.49, 0))
# (lean in x (deg), lean in z (deg), length, blade width)
FRONDS = [(-30, 6, 0.52, 1.12), (0, -8, 0.64, 1.18), (30, 6, 0.52, 1.12)]


def leaflet(pos, axis, normal, size, group, stiff=2.0):
    """a flattened oval leaf blob: long along axis, flat across normal."""
    yv = axis.normalized()
    zv = (normal - yv * normal.dot(yv)).normalized()
    xv = yv.cross(zv)
    M = Matrix((xv, yv, zv)).transposed()
    e = M.to_euler('XYZ')
    p.blob(tuple(pos), size, rot=tuple(math.degrees(v) for v in e), group=group, stiffness=stiff)


def bez(a, b, c, t):
    return a * (1 - t) ** 2 + b * 2 * (1 - t) * t + c * t * t


chains = []
for fi, (lx, lz, L, wk) in enumerate(FRONDS):
    tag = 'ABC'[fi]
    ax, az = math.radians(lx), math.radians(lz)
    d = Vector((math.sin(ax), math.cos(ax) * math.cos(az), math.sin(az))).normalized()
    side = Vector((math.cos(ax), -math.sin(ax), 0)).normalized()        # across the frond, in the fan plane
    nrm = d.cross(side).normalized()
    if nrm.z < 0:
        nrm = -nrm
    out = 1 if lx > 0 else -1
    curl = abs(lx) / 30
    base = TOP + d * 0.01
    ctrl = base + d * L * 0.55
    tipp = base + d * L + side * out * 0.07 * curl - Vector((0, 0.03 * curl, 0))
    g = 'tuft'   # one group: the fronds melt together where they meet, so the tuft has one clean outline
    p.curve([tuple(base), tuple(bez(base, ctrl, tipp, 0.5)), tuple(tipp)], [0.034, 0.026, 0.02], group=g, per=6)
    # leaflets: alternating sides, growing then shrinking toward the tip
    LEAF_T = [(0.3, -1, 0.058), (0.39, 1, 0.07), (0.49, -1, 0.084), (0.59, 1, 0.094), (0.69, -1, 0.094), (0.79, 1, 0.088), (0.88, -1, 0.078)]
    for t, s, sz in LEAF_T:
        sz *= wk
        pt = bez(base, ctrl, tipp, t)
        tan = (bez(base, ctrl, tipp, min(1, t + 0.02)) - bez(base, ctrl, tipp, max(0, t - 0.02))).normalized()
        sd = (side - tan * side.dot(tan)).normalized()
        ang = math.radians(64 - t * 26)
        a2 = (tan * math.cos(ang) + sd * s * math.sin(ang)).normalized()
        leaflet(pt + a2 * sz * 0.86, a2, nrm, (sz * 0.6, sz, 0.03), g)
    tan = (tipp - bez(base, ctrl, tipp, 0.92)).normalized()
    leaflet(tipp + tan * 0.06, tan, nrm, (0.062 * wk, 0.1 * wk, 0.03), g)
    chains.append((tag, [tuple(base), tuple(bez(base, ctrl, tipp, 0.5)), tuple(tipp + tan * 0.15)], lx))
# a neat little collar where the fronds sprout out of the root
p.blob((0, 0.515, 0), (0.085, 0.05, 0.085), group='tuft')
p.paint_fn(lambda q, n: q.y < 0.56 and math.hypot(q.x, q.z) < 0.1, LEAF_D)
p.layer('skin')

p.bone('body', (0, -0.52, 0), (0, 0.5, 0))
# each frond's spring bones move only its own sector of the tuft (by the angle out of the shoulder)
def sector(lx):
    lo, hi = {-30: (-90, -15), 0: (-15, 15), 30: (15, 90)}[lx]
    return lambda q: q.y > 0.52 and lo <= math.degrees(math.atan2(q.x, max(1e-4, q.y - 0.49))) <= hi
for tag, pts, lx in chains:
    p.chain('tuft' + tag, pts, 'body', region=sector(lx))
p.face(center=(0, 0.2, 0), radius=0.27, bone='body', faceScale=1.0)
p.extras['outline'] = 0.018
p.build()
