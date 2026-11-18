"""Swim flipper (Bear's nose 'feet' gear). Lies flat, toes toward +z; origin at the heel of the foot pocket.
A chunky rounded foot pocket (a shade darker, with a soft opening) and a smooth fan blade about 0.8 long with a
gently scalloped tip and two raised ribs. Clean pillow edges all round. Tintable (argMode 'tint', green)."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded


def blade_outline():
    """the blade seen from above (x, z), counter-clockwise looking down: narrow at the pocket, fanning out to a
    wide tip with two shallow scallops"""
    pts = [(0.15, 0.22), (0.2, 0.45), (0.26, 0.66), (0.29, 0.78)]
    tip = []
    for i in range(25):
        t = i / 24
        x = 0.29 - 0.58 * t
        z = 0.84 + 0.03 * math.cos(t * math.pi * 2 * 1.5) * 0  # flat base line, scallops added below
        z += 0.035 * math.sin(math.pi * ((t * 3) % 1.0)) if i not in (0, 24) else 0
        tip.append((x, z))
    left = [(-x, z) for x, z in reversed(pts)]
    poly = pts + tip + left
    return [q[:2] for q in rounded(poly, 0.05, n=3, closed=True)]


def offset(poly, d):
    n = len(poly); out = []
    for i in range(n):
        (x0, y0), (x1, y1), (x2, y2) = poly[i - 1], poly[i], poly[(i + 1) % n]
        def nrm(ax, ay, bx, by):
            dx, dy = bx - ax, by - ay; L = math.hypot(dx, dy) or 1
            return (-dy / L, dx / L)
        a, b = nrm(x0, y0, x1, y1), nrm(x1, y1, x2, y2)
        mx, my = a[0] + b[0], a[1] + b[1]; L = math.hypot(mx, my) or 1
        out.append((x1 + mx / L * d, y1 + my / L * d))
    return out


p = Prop('prop_flipper', base=0xffffff, target_faces=1600, voxel=0.008, smooth=6)
# the blade: a pillow-edged slab (outline in x/z; it lies in the plane, thickness along y), sloping down a little
# toward the tip so it rests on the sand
poly = blade_outline()
# the polygon was built going +x side up then across the tip to -x: that is clockwise seen from above (+y),
# i.e. counter-clockwise in (x, z) maths coordinates, so 'inward' is the left normal there
TH, E = 0.035, 0.03
rings = [(TH * math.sin(math.radians(f)), E * (1 - math.cos(math.radians(f)))) for f in range(-90, 91, 30)]
n = len(poly)
verts, faces = [], []
for yv, d in rings:
    for x, z in offset(poly, d):
        verts.append((x, 0.045 + yv - 0.03 * max(0.0, z - 0.3), z))
for r in range(len(rings) - 1):
    for i in range(n):
        j = (i + 1) % n
        faces.append((r * n + i, r * n + j, (r + 1) * n + j, (r + 1) * n + i))
last = len(rings) - 1
faces.append(tuple(range(n - 1, -1, -1)))
faces.append(tuple(last * n + i for i in range(n)))
p.mesh(verts, faces)
# two soft ribs along the blade
for s in (-1, 1):
    p.capsule((s * 0.07, 0.075, 0.3), (s * 0.15, 0.058, 0.72), 0.026, r2=0.018, group='rib%d' % s, steps=9)
# the foot pocket: a rounded shoe shape over the heel
p.blob((0, 0.1, 0.12), (0.155, 0.095, 0.16), group='pocket', stiffness=2.2)
p.blob((0, 0.075, 0.3), (0.14, 0.055, 0.11), group='pocket', stiffness=2.2)
p.paint_fn(lambda q, nn: q.z < 0.36 and q.y > 0.085, 0xc8c8c8)
p.bone('root', (0, 0, 0), (0, 0.3, 0))
p.extras['argMode'] = 'tint'
p.extras['argDefault'] = 0x5fd068
p.extras['outline'] = 0.012
p.build()
