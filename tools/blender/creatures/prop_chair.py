"""Big striped sling deck chair (Where's Crab?, Words). Seat at y 1.25, 4.0 wide: a crab (3.5 wide) sits in it at full
size, and there is room for one to hide underneath between the legs. No arm rests (claws hang free over the sides).
One continuous canvas sling sags a little in the seat and runs up the leaning back; it is woven in five full-thickness
bands (blue, white, blue, white, blue), each band a straight strip on its own colour layer, so the stripes are crisp.
Chunky rounded beech frame: four legs, side rails, a front bar the canvas wraps over, leaning back uprights, a top bar,
and one low stretcher at the back (nothing low at the front, so a friend underneath peeks out freely)."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop
import bpy


class Chair(Prop):
    """Canvas layers (flag 'raw') keep their exact swept geometry: no voxel remesh / decimate / smoothing, which
    wobbled the long straight stripe edges. Sharp sides via an edge split; the faces stay smooth-shaded."""
    def _skin(self):
        L = self.layers[self._cur]
        if not L.get('raw'):
            return super()._skin()
        objs = self._metaballs()
        bpy.ops.object.select_all(action='DESELECT')
        for o in objs:
            o.select_set(True)
        bpy.context.view_layer.objects.active = objs[0]
        if len(objs) > 1:
            bpy.ops.object.join()
        skin = bpy.context.view_layer.objects.active
        skin.name = skin.data.name = self._cur
        es = skin.modifiers.new('es', 'EDGE_SPLIT')
        es.split_angle = 0.7
        bpy.ops.object.modifier_apply(modifier='es')
        bpy.ops.object.shade_smooth()
        return skin


SEAT, W = 1.25, 4.0
WOOD, WOOD_D, BLUE, WHITE = 0xd29457, 0xa86f3a, 0x3f8cff, 0xfffaf0
LEAN = math.radians(16)
hw = W / 2
XL = hw - 0.1          # frame centre-line x
p = Chair('prop_chair', base=WOOD, target_faces=9000, voxel=0.013)
for s in (-1, 1):
    x = s * XL
    for z in (-0.72, 0.72):
        p.box((x, (SEAT - 0.08) / 2, z), (0.09, (SEAT - 0.08) / 2, 0.09), bevel=0.05)       # legs
    p.box((x, SEAT - 0.06, 0.02), (0.1, 0.08, 0.86), bevel=0.06)                          # side rails
    # back uprights, leaning back from the rear of the seat
    L = 1.55
    p.box((x, SEAT - 0.1 + math.cos(LEAN) * L / 2, -0.78 - math.sin(LEAN) * L / 2), (0.09, L / 2, 0.08), rot=(-math.degrees(LEAN), 0, 0), bevel=0.05)
TOPY = SEAT - 0.1 + math.cos(LEAN) * 1.55
TOPZ = -0.78 - math.sin(LEAN) * 1.55
p.cyl((-XL - 0.05, SEAT + 0.02, 0.86), 0.075, 2 * XL + 0.1, rot=(0, 0, -90), bevel=0.03, seg=20)   # front bar
p.cyl((-XL - 0.06, TOPY, TOPZ), 0.08, 2 * XL + 0.12, rot=(0, 0, -90), bevel=0.03, seg=20)          # top bar
p.box((0, 0.42, -0.72), (XL, 0.055, 0.055), bevel=0.04)                                  # back stretcher (low)
p.paint_fn(lambda q, n: n.y < -0.65, WOOD_D)

# ---- the canvas sling: path (z, y) from over the front bar, sagging through the seat, round the back corner, up the back
path = [(0.95, SEAT + 0.0), (0.9, SEAT + 0.085)]
for i in range(1, 25):
    t = i / 24
    path.append((0.86 - t * 1.62, SEAT + 0.085 - 0.13 * math.sin(t * math.pi) - 0.02 * t))
for i in range(1, 17):
    t = i / 16
    path.append((-0.8 - math.sin(LEAN) * 1.45 * t, SEAT + 0.07 + math.cos(LEAN) * 1.45 * t))
TH = 0.1


def band(x0, x1, nx=4, th=TH):
    """one canvas band: the path swept across x0..x1, th thick"""
    verts, faces, idx = [], [], {}
    n = len(path)
    for side in (0, 1):
        for i, (z, y) in enumerate(path):
            a = path[max(0, i - 1)]; b = path[min(n - 1, i + 1)]
            tz, ty = b[0] - a[0], b[1] - a[1]
            L = math.hypot(tz, ty) or 1
            nz, ny = ty / L, -tz / L
            if ny < 0: nz, ny = -nz, -ny
            o = th * (side - 0.5)
            for k in range(nx + 1):
                x = x0 + (x1 - x0) * k / nx
                idx[side, i, k] = len(verts)
                verts.append((x, y + ny * o, z + nz * o))
    for i in range(n - 1):
        for k in range(nx):
            faces.append((idx[1, i, k], idx[1, i, k + 1], idx[1, i + 1, k + 1], idx[1, i + 1, k]))
            faces.append((idx[0, i, k], idx[0, i + 1, k], idx[0, i + 1, k + 1], idx[0, i, k + 1]))
    for i in range(n - 1):
        faces.append((idx[0, i, 0], idx[1, i, 0], idx[1, i + 1, 0], idx[0, i + 1, 0]))
        faces.append((idx[0, i + 1, nx], idx[1, i + 1, nx], idx[1, i, nx], idx[0, i, nx]))
    for k in range(nx):
        for i in (0, n - 1):
            a, b = (k, k + 1) if i == 0 else (k + 1, k)
            faces.append((idx[0, i, a], idx[0, i, b], idx[1, i, b], idx[1, i, a]))
    p.mesh(verts, faces)


CW = 2 * (XL - 0.11)        # canvas width, just inside the rails
bw = CW / 5
x0 = -CW / 2
p.layer('blue', base=BLUE)
p.layers['blue']['raw'] = True
for i in (0, 2, 4):
    band(x0 + bw * i, x0 + bw * (i + 1))
p.layer('white', base=WHITE)
p.layers['white']['raw'] = True
for i in (1, 3):
    band(x0 + bw * i - 0.006, x0 + bw * (i + 1) + 0.006, th=TH + 0.012)   # a hair thicker: no flicker at the seams
p.layer('skin')
p.bone('body', (0, 0, 0), (0, SEAT, 0))
p.extras['outline'] = 0.024
p.build()
