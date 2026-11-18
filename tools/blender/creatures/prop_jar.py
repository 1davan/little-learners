"""Big clip-top glass sweetie jar (Which has more?, level 2; also the 'jar' word). 4.3 wide, 1.1 deep, glass to y 3.0,
origin on the sand; the floor inside (top of the thick glass base) is at y 0.14, the inner side walls at x +-2.12.
Layers:
  skin   the domed lid with its rubber seal and knob (tintable, argMode 'tint'), on bone 'lid' (hinged at the back
         rim: the game swings it open by rotating the bone about its local x axis)
  glass  the see-through walls: one hollow rounded-rectangle shell with soft rounded corners, a rounded base and a
         gentle shoulder into a thick rolled rim (the game makes it transparent and hides its outline)
  back   a pale aqua panel just inside the back wall, so what is in the jar reads against a clean tint instead of
         the scenery behind it
  base   the thick glass foot
  rim    the rolled glass rim at the mouth
  metal  the hinge barrel at the back and the wire clip at the front
  shine  two long highlight streaks and a short one (the game makes them soft white)"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop

W, H, D, FL = 4.3, 3.0, 1.1, 0.14
HX, HZ = W / 2, D / 2          # outer half sizes of the glass body
R = 0.42                        # corner radius of the rounded rectangle (seen from above)
T_ = 0.05                       # wall thickness


def rrect(hx, hz, r, n=6):
    """rounded rectangle loop in xz (counter-clockwise from +x), corner radius r"""
    r = min(r, hx * 0.95, hz * 0.95)
    pts = []
    for cx, cz, a0 in ((hx - r, hz - r, 0), (-(hx - r), hz - r, 90), (-(hx - r), -(hz - r), 180), (hx - r, -(hz - r), 270)):
        for k in range(n + 1):
            a = math.radians(a0 + 90 * k / n)
            pts.append((cx + r * math.cos(a), cz + r * math.sin(a)))
    return pts


def shell(p, rings, thick):
    """a hollow wall: rings = [(y, inset), ...] bottom to top; outer loop inset by `inset`, inner loop by inset+thick.
    Closed at the bottom and top with ring faces (the top is the open mouth)."""
    verts, faces = [], []
    loops = []
    for y, ins in rings:
        lo = rrect(HX - ins, HZ - ins, max(0.08, R - ins))
        li = rrect(HX - ins - thick, HZ - ins - thick, max(0.06, R - ins - thick))
        loops.append((y, lo, li))
    m = len(loops[0][1])
    # outer then inner vertex rings
    for y, lo, li in loops:
        verts += [(x, y, z) for x, z in lo]
    base_i = len(verts)
    for y, lo, li in loops:
        verts += [(x, y, z) for x, z in li]
    nr = len(loops)
    for r in range(nr - 1):
        for k in range(m):
            k2 = (k + 1) % m
            a, b, c, d = r * m + k, r * m + k2, (r + 1) * m + k2, (r + 1) * m + k
            faces.append((a, b, c, d))                                   # outer
            ai, bi, ci, di = base_i + a, base_i + b, base_i + c, base_i + d
            faces.append((ai, di, ci, bi))                               # inner (reversed)
    for r in (0, nr - 1):
        for k in range(m):
            k2 = (k + 1) % m
            a, b = r * m + k, r * m + k2
            ai, bi = base_i + a, base_i + b
            faces.append((a, ai, bi, b) if r == nr - 1 else (a, b, bi, ai))
    p.mesh(verts, faces)


p = Prop('prop_jar', base=0xffffff, target_faces=2400, voxel=0.018, smooth=2)
# ---- the lid: a domed cap over the mouth with a rubber seal ring and a round knob ----
LY = H + 0.06
p.box((0, LY + 0.07, 0), (HX - 0.12, 0.08, HZ - 0.03), bevel=0.07)                   # cap plate
p.blob((0, LY + 0.17, 0), (HX - 0.32, 0.17, HZ - 0.16), group='dome')                 # gentle dome
p.blob((0, LY + 0.42, 0), (0.24, 0.17, 0.22), group='knob')                          # knob
p.box((0, LY + 0.02, 0), (HX - 0.1, 0.035, HZ - 0.01), bevel=0.03)                   # seal (painted orange)
p.paint_fn(lambda q, n: q.y < LY + 0.045, 0xff9a4a)
p.paint_fn(lambda q, n: q.y > LY + 0.3 and abs(q.x) < 0.3, 0xffffff)                 # knob stays white (tint mixes)

# ---- the glass wall shell: rounded base, straight sides, a soft shoulder into the mouth ----
p.layer('glass', base=0xd8f4ff, target_faces=1800, voxel=0.016)
p.quadriflow = False
shell(p, [(FL - 0.02, 0.06), (FL + 0.1, 0.0), (H - 0.32, 0.0), (H - 0.14, 0.05), (H - 0.04, 0.12), (H, 0.14)], T_)

# ---- the tinted back panel (opaque, inside the back wall) ----
p.layer('back', base=0xa9def2, target_faces=300, voxel=0.02)
p.quadriflow = False
p.box((0, (FL + H - 0.2) / 2, -HZ + T_ + 0.035), (HX - 0.28, (H - 0.2 - FL) / 2 - 0.05, 0.02), bevel=0.015)

# ---- the thick glass foot ----
p.layer('base', base=0xffffff, target_faces=700, voxel=0.02)
p.quadriflow = False
shell_pts = rrect(HX + 0.04, HZ + 0.04, R + 0.04)
verts = [(x, 0.0, z) for x, z in shell_pts] + [(x, FL, z) for x, z in shell_pts]
m = len(shell_pts)
faces = [tuple(range(m))[::-1], tuple(range(m, 2 * m))] + [(k, (k + 1) % m, m + (k + 1) % m, m + k) for k in range(m)]
p.mesh(verts, faces)

# ---- the rolled rim at the mouth ----
p.layer('rim', base=0xffffff, target_faces=900, voxel=0.014)
p.quadriflow = False
rp = rrect(HX - 0.16, HZ - 0.16, R - 0.16, n=8)
p.tube([(x, H + 0.02, z) for x, z in rp], 0.05, closed=True, rseg=10)

# ---- hinge barrel (back) and wire clip (front), brushed steel ----
p.layer('metal', base=0xc9d3dc, target_faces=600, voxel=0.012)
p.quadriflow = False
p.cyl((-0.55, H + 0.02, -HZ + 0.02), 0.055, 1.1, rot=(0, 0, -90), bevel=0.02, seg=14)
p.tube([(-0.32, H - 0.28, HZ - 0.05), (-0.32, H + 0.02, HZ + 0.02), (0.32, H + 0.02, HZ + 0.02), (0.32, H - 0.28, HZ - 0.05)], 0.03, rseg=8)
p.box((0, H - 0.3, HZ - 0.03), (0.4, 0.04, 0.03), bevel=0.02)

# ---- highlights ----
p.layer('shine', base=0xffffff, target_faces=240, voxel=0.012)
p.quadriflow = False
for x, y0, y1 in ((-HX + 0.42, FL + 0.45, H - 0.55), (-HX + 0.66, FL + 0.6, FL + 1.25), (HX - 0.5, H - 0.95, H - 0.55)):
    p.capsule((x, y0, HZ + 0.012), (x, y1, HZ + 0.012), 0.04, group='s%.2f' % x)
p.layer('skin')

islid = lambda q: q.y > H + 0.035 and not (q.z < -HZ + 0.09 and q.y < H + 0.09) and not (q.z > HZ - 0.06 and q.y < H + 0.1)   # never the hinge or the front clip
p.bone('root', (0, 0, 0), (0, H, 0), region=lambda q: not islid(q))
p.bone('lid', (0, H + 0.03, -HZ + 0.02), (0, H + 0.63, -HZ + 0.02), parent='root', region=islid)
p.extras['argMode'] = 'tint'
p.extras['argDefault'] = 0x4a90ff
p.extras['outline'] = 0.022
p.build()
