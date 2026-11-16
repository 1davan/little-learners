"""Colour tubes containers (TINTABLE, argMode 'tint': the game multiplies the white/grey paint by the container's colour).
  prop_m_ctube   - L1 tall toy tube: rounded foot, straight wall, thick rolled rim; rim top at y 3.15, wall radius 0.95,
                 foot radius 1.1 (0..0.32). Face goes on the front at y ~2.3 (code face). Inner floor at 0.32.
  prop_m_cbasket - L2 woven basket: top radius 1.25, bottom 1.0, rim at y 1.55, two side handles, floor at 0.17.
Both hollow (open top, darker inside). Layer 'shine' = a soft gloss streak (no ink outline in game)."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

ONLY = [s for s in os.environ.get('ONLY', '').split(',') if s]
WHITE, RIMG, INSIDE = 0xffffff, 0xd4d4d4, 0x6e6e6e


def ctube():
    R, T, H = 0.95, 0.09, 3.06
    p = Prop('prop_m_ctube', base=WHITE, target_faces=3600, voxel=0.02)
    # foot + wall + inner floor as one revolved section (outside up, over the lip, down the inside, across the floor)
    sec = [(0, 0), (1.06, 0), (1.12, 0.08), (1.12, 0.26), (1.04, 0.34), (R, 0.38), (R, H), (R - T, H), (R - T, 0.36), (0, 0.36)]
    p.lathe(rounded(sec, 0.06, n=4), seg=64)
    p.ring((0, H + 0.02, 0), R - T * 0.4, 0.13, seg=64, rseg=14)       # fat rolled rim
    p.ring((0, 0.78, 0), R + 0.005, 0.055, seg=64, rseg=8)             # a ridge ring low on the wall
    inside = lambda q, n: math.hypot(q.x, q.z) < R - T * 0.5 and q.y > 0.3 and q.y < H - 0.02 and (n.x * q.x + n.z * q.z) < 0 or (q.y < 0.4 and q.y > 0.3 and n.y > 0.7 and math.hypot(q.x, q.z) < R - T)
    p.paint_fn(inside, INSIDE)
    p.paint_fn(lambda q, n: q.y < 0.36 and not inside(q, n), RIMG)
    p.paint_fn(lambda q, n: q.y > H - 0.12 and not inside(q, n), RIMG)
    p.paint_fn(lambda q, n: abs(q.y - 0.78) < 0.07 and math.hypot(q.x, q.z) > R - 0.01, RIMG)
    # gloss streak on the left of the wall (between the ridge and the face)
    p.layer('shine', base=WHITE, target_faces=300, voxel=0.01)
    a = -0.95
    pts = [((R + 0.004) * math.sin(a), y, (R + 0.004) * math.cos(a)) for y in (1.0, 1.35, 1.7)]
    p.tube(pts, 0.05, rseg=8)
    pts = [((R + 0.004) * math.sin(a - 0.13), y, (R + 0.004) * math.cos(a - 0.13)) for y in (1.0, 1.12)]
    p.tube(pts, 0.035, rseg=8)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, H, 0))
    p.extras.update(argMode='tint', argDefault=0xff5a5a, outline=0.03)
    p.build()


def cbasket():
    R, RB, H, T = 1.25, 1.0, 1.5, 0.09
    p = Prop('prop_m_cbasket', base=WHITE, target_faces=5200, voxel=0.018)
    sec = [(0, 0), (RB - 0.05, 0), (R - 0.07, H), (R - T - 0.04, H), (RB - T * 0.8 - 0.04, 0.17), (0, 0.17)]
    p.lathe(rounded(sec, 0.05, n=3), seg=64)
    r_at = lambda y: RB + (R - RB) * y / H
    # coiled, woven rows: fat bumpy rings stacked up the wall (alternate rows a shade darker)
    rows = 8
    for k in range(rows):
        y = 0.12 + k * (H - 0.2) / (rows - 1)
        pts = []
        for i in range(120):
            a = i / 120 * math.tau
            rr = r_at(y) - 0.04 + 0.022 * math.cos(a * 26 + k * math.pi)
            pts.append((rr * math.sin(a), y + 0.012 * math.sin(a * 26 + k * math.pi), rr * math.cos(a)))
        p.tube(pts, 0.1, closed=True, rseg=8)
    row_of = lambda y: int(round((y - 0.12) / ((H - 0.2) / (rows - 1))))
    p.paint_fn(lambda q, n: math.hypot(q.x, q.z) > r_at(q.y) - 0.07 and q.y < H - 0.06 and row_of(q.y) % 2 == 1, 0xe2e2e2)
    p.paint_fn(lambda q, n: math.hypot(q.x, q.z) < r_at(q.y) - 0.1 and q.y > 0.1, INSIDE)
    # braided rim: two twisted ropes
    for ph in (0, math.pi):
        pts = []
        for i in range(144):
            a = i / 144 * math.tau
            rr = R - T / 2 + 0.05 * math.cos(a * 22 + ph)
            pts.append((rr * math.sin(a), H + 0.01 + 0.05 * math.sin(a * 22 + ph), rr * math.cos(a)))
        p.tube(pts, 0.085, closed=True, rseg=8)
    # a woven foot band
    p.ring((0, 0.05, 0), RB + 0.01, 0.06, seg=64, rseg=8)
    # side handles
    for s in (-1, 1):
        arc = [(s * (r_at(H - 0.3) - 0.02), H - 0.3, -0.36)]
        arc += [(s * (r_at(H - 0.3) + 0.13 * math.sin(math.radians(a))), H - 0.3 + 0.3 * math.sin(math.radians(a)), -0.34 * math.cos(math.radians(a))) for a in range(15, 166, 15)]
        arc += [(s * (r_at(H - 0.3) - 0.02), H - 0.3, 0.36)]
        p.tube(arc, 0.07, rseg=8)
    p.paint_fn(lambda q, n: q.y > H - 0.06 and math.hypot(q.x, q.z) > R - T - 0.1, RIMG)
    p.bone('body', (0, 0, 0), (0, H, 0))
    p.extras.update(argMode='tint', argDefault=0xff5a5a, outline=0.03)
    p.build()


MODELS = dict(prop_m_ctube=ctube, prop_m_cbasket=cbasket)
for name, fn in MODELS.items():
    if not ONLY or name in ONLY:
        fn()
