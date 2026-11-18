"""Ice lolly (Bear's nose: the 'mouth' gear, held in the paw). Upright facing +z, about 1.0 tall, centred.
A chunky rounded two-tone popsicle (strawberry top, vanilla bottom with a wavy edge between them), a bite taken out of
its top corner, a soft shine on the front and a wooden stick. Not tintable (its own colours)."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

PINK = 0xff5f7e
CREAM = 0xfff1cf
SHINE = 0xffa9bb


def outline():
    """the pop's front outline (counter-clockwise): a rounded rectangle with a round bite out of its top-right corner"""
    W, B, TOP = 0.19, -0.13, 0.42
    arc = lambda cx, cy, r, a0, a1, n: [(cx + r * math.cos(math.radians(a0 + (a1 - a0) * i / n)), cy + r * math.sin(math.radians(a0 + (a1 - a0) * i / n))) for i in range(n + 1)]
    pts = []
    pts += arc(W - 0.06, B + 0.06, 0.06, 270, 360, 6)          # bottom-right corner
    pts += arc(W, TOP, 0.13, 270, 180, 14)                     # the bite (enters the right side, leaves the top)
    pts += arc(-W + 0.12, TOP - 0.12, 0.12, 90, 180, 10)       # top-left corner (a soft dome)
    pts += arc(-W + 0.06, B + 0.06, 0.06, 180, 270, 6)         # bottom-left corner
    return [q[:2] for q in rounded(pts, 0.03, n=4, closed=True)]


def offset(poly, d):
    """move every vertex d inward along its averaged edge normal (polygon is counter-clockwise)"""
    n = len(poly)
    out = []
    for i in range(n):
        (x0, y0), (x1, y1), (x2, y2) = poly[i - 1], poly[i], poly[(i + 1) % n]
        def nrm(ax, ay, bx, by):
            dx, dy = bx - ax, by - ay; L = math.hypot(dx, dy) or 1
            return (-dy / L, dx / L)   # left normal = inward for a CCW polygon
        a, b = nrm(x0, y0, x1, y1), nrm(x1, y1, x2, y2)
        mx, my = a[0] + b[0], a[1] + b[1]; L = math.hypot(mx, my) or 1
        out.append((x1 + mx / L * d, y1 + my / L * d))
    return out


p = Prop('prop_lolly', base=PINK, target_faces=2400, voxel=0.008, smooth=8)
p.quadriflow = True
poly = outline()
# a pillow-edged slab: rings of the outline at several depths, inset toward the faces (soft rounded rim)
T = 0.085
rings = [(T * math.sin(math.radians(f)), 0.05 * (1 - math.cos(math.radians(f)))) for f in range(-90, 91, 20)]
verts, faces = [], []
n = len(poly)
for z, d in rings:
    for x, y in offset(poly, d):
        verts.append((x, y, z))
for r in range(len(rings) - 1):
    for i in range(n):
        j = (i + 1) % n
        faces.append((r * n + i, r * n + j, (r + 1) * n + j, (r + 1) * n + i))
# the two flat faces as single n-gons (Blender tessellates the concave bite properly; a centre fan folded there)
last = len(rings) - 1
faces.append(tuple(range(n - 1, -1, -1)))
faces.append(tuple(last * n + i for i in range(n)))
p.mesh(verts, faces)
# vanilla bottom with a gentle wave, and a soft shine stripe down the front-left
p.paint_fn(lambda q, nn: q.y < 0.0, CREAM)
p.paint_fn(lambda q, nn: nn.z > 0.7 and -0.14 < q.x < -0.09 and 0.08 < q.y < 0.3, SHINE)
p.layer('stick', base=0xe2b57f, target_faces=300, voxel=0.01)
p.box((0, -0.33, 0), (0.042, 0.2, 0.022), bevel=0.02)
p.layer('skin')
p.bone('root', (0, -0.5, 0), (0, 0.5, 0))
p.extras['outline'] = 0.012
p.build()
