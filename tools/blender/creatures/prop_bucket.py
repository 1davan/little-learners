"""Toy sand pail (tintable: makeBucket(colour) multiplies the light-grey body). Unit size: top radius 1.0, bottom 0.8,
height 1.3 - the game scales it to each caller's (r, h). Callers rely on: the straight tapered wall (outer r 0.8 -> 1.0,
inner r 0.72 -> 0.915), the floor top at y 0.11, the rolled rim (inner edge ~0.875 at y 1.3), handle layers named
'handle*', the front motif in layer 'deco' (colours hides it for its face), and the bone 'handle' (rotation.x flops it:
-1.75 back over the rim, +1.85 down the front of a turned-over pail).

Look: a chunky moulded toy pail - fat rolled rim, a foot band and a stacking ridge, a white wave band and a star
moulded proud of the wall (own layer, crisp ink), a darker inner wall and floor so it reads hollow, and a sturdy yellow
handle with a thick grip that hangs from two hinge lugs moulded under the rim (round pin caps). The handle is on its
own bone and moves ONLY the handle layer (weights by layer), so turning it never pulls the rim."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded, star_poly, TAU

R, RB, H, T = 1.0, 0.8, 1.3, 0.085
BODY, RIM, IN_WALL, IN_FLOOR, DECO = 0xe0e0e0, 0xffffff, 0xa9a9a9, 0x8e8e8e, 0xffffff
YEL, YEL_D = 0xffd23f, 0xf2b52c
HY = 1.1                     # hinge height (lugs + handle pivot)
PX = 1.15                    # handle pivot / pin distance from the axis
LEAN = 0.41                  # the handle rests tipped back ~22 deg: flopped (+1.85) on a turned-over pail it lies on the ground
wall_r = lambda y: RB + (R - RB) * y / H


class Pail(Prop):
    """Hard-surface toy: every layer is built from clean revolved / swept / bevelled pieces joined as they are (no voxel
    remesh, so the wall is truly round and the rim truly smooth); mesh pieces with a bevel get a bevel modifier.
    Weights per layer: the handle bone owns the handle layer and nothing else."""
    def _weights(self, skin, ao, smooth_iters=None):
        self._wl = skin.name
        return super()._weights(skin, ao, smooth_iters)

    def _metaballs(self):
        import bpy
        objs = super()._metaballs()
        prims = self.layers[self._cur].get('prims', [])
        for pr, ob in zip(prims, objs[len(objs) - len(prims):]):
            if pr[0] == 'mesh' and pr[3]:
                md = ob.modifiers.new('bev', 'BEVEL')
                md.width = pr[3]
                md.segments = 1
                md.limit_method = 'ANGLE'
                md.angle_limit = math.radians(30)
        return objs

    def _skin(self):
        import bpy, bmesh
        objs = self._metaballs()
        bpy.context.view_layer.update()
        dg = bpy.context.evaluated_depsgraph_get()
        meshes = []
        for ob in objs:
            me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
            mo = bpy.data.objects.new(ob.name + '_mesh', me)
            bpy.context.scene.collection.objects.link(mo)
            meshes.append(mo)
        for ob in objs:
            bpy.data.objects.remove(ob)
        bpy.ops.object.select_all(action='DESELECT')
        for m in meshes:
            m.select_set(True)
        bpy.context.view_layer.objects.active = meshes[0]
        if len(meshes) > 1:
            bpy.ops.object.join()
        skin = bpy.context.view_layer.objects.active
        skin.name = skin.data.name = self.kind if self._cur == 'skin' else self._cur
        bm = bmesh.new()
        bm.from_mesh(skin.data)
        bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)
        bmesh.ops.triangulate(bm, faces=bm.faces[:])
        print('CLEAN', self._cur, 'tris', len(bm.faces))
        bm.to_mesh(skin.data)
        bm.free()
        skin.data.update()
        for f in skin.data.polygons:
            f.use_smooth = True
        return skin


p = Pail('prop_bucket', base=BODY)
# wall + floor as one revolved section (outer down, across the floor, back up the inside)
def dense(pts, step=0.2):
    """split long profile segments so crisp paint borders (inner wall / floor / rim) cut cleanly"""
    out = [pts[0]]
    for a, b in zip(pts, pts[1:]):
        n = max(1, int(math.hypot(b[0] - a[0], b[1] - a[1]) / step + 0.999))
        out += [(a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n) for k in range(1, n + 1)]
    return out
wall = dense(rounded([(0, 0), (RB, 0), (R, H), (R - T, H), (RB - T * 0.9, T * 1.3), (0, T * 1.3)], 0.06, n=4))
p.lathe(wall, seg=64)
p.ring((0, H - 0.005, 0), R - 0.03, 0.095, seg=56, rseg=12)        # fat rolled rim
p.ring((0, 0.075, 0), RB + 0.004, 0.072, seg=56, rseg=8)           # foot band
p.ring((0, 0.97, 0), wall_r(0.97) + 0.004, 0.032, seg=56, rseg=6)   # stacking ridge
# hinge lugs: moulded blocks under the rim, either side
for s in (-1, 1):
    p.box((s * (wall_r(HY) + 0.075), HY + 0.01, 0), (0.085, 0.115, 0.105), bevel=0.05)

# ---- handle: own layer (stays yellow when the body is tinted), own bone ----
p.layer('handle', base=YEL)
pts, rad = [], []
for k in range(41):
    a = math.pi * k / 40
    c, sn = math.cos(a), math.sin(a)
    x = PX * math.copysign(abs(c) ** 0.7, c)
    pts.append((x, HY + 1.12 * sn, -LEAN * 1.12 * sn))
    g = max(0.0, 1 - abs(x) / 0.42)                                 # thick moulded grip across the top
    rad.append(0.05 + 0.024 * min(1.0, g * 1.6))
p.tube(pts, rad, rseg=12)
for s in (-1, 1):                                                   # round pin caps on the lugs
    p.cyl((s * 1.115, HY, 0), 0.078, 0.075, rot=(0, 0, -90 * s), bevel=0.025, seg=20)
p.paint_fn(lambda q, n: abs(q.x) > PX - 0.06 and q.y < HY + 0.09, YEL_D)
p.layer('skin')

# ---- deco: a white wave band all round the foot and a star on the front, moulded proud of the wall ----
p.layer('deco', base=DECO)
N, Y0B, THK, LIFT = 135, 0.15, 0.04, 0.012
def wave_top(th):
    ph = (th * 9 / TAU) % 1.0                                         # nine leaning crests round the pail
    return 0.27 + 0.115 * math.sin(math.pi * ph ** 1.45) ** 0.85
verts, faces = [], []
for i in range(N):
    th = TAU * i / N
    for (y, d) in ((Y0B, -1), (wave_top(th), -1), (wave_top(th), 1), (Y0B, 1)):
        r = wall_r(y) + LIFT + d * THK * 0.5
        verts.append((r * math.sin(th), y, r * math.cos(th)))
for i in range(N):
    j = (i + 1) % N
    for k in range(4):
        k2 = (k + 1) % 4
        faces.append((i * 4 + k, j * 4 + k, j * 4 + k2, i * 4 + k2))
p.mesh(verts, faces, bevel=0.01)
p.sticker(star_poly(0.25, inner=0.52), 0.76, wall_r, thick=0.05, lift=0.012)
p.layer('skin')

# ---- paint ----
inner_r = lambda y: (RB - T) + (R - RB) * y / H
inward = lambda q, n: (n.x * q.x + n.z * q.z) < -0.25 * math.hypot(q.x, q.z) or (n.y > 0.6 and q.y < H * 0.5)
is_in = lambda q, n: q.y < H - 0.1 and q.y > 0.03 and math.hypot(q.x, q.z) < inner_r(q.y) + 0.03 and inward(q, n)
p.paint_fn(is_in, IN_WALL)
p.paint_fn(lambda q, n: is_in(q, n) and (q.y < T * 1.3 + 0.12), IN_FLOOR)   # the floor and the corner into it
p.paint_fn(lambda q, n: q.y > H - 0.12 and math.hypot(q.x, q.z) > R - 0.16, RIM)
p.paint_fn(lambda q, n: q.y < 0.15 and not is_in(q, n), RIM)

# ---- rig ----
p.bone('body', (0, 0, 0), (0, H, 0), region=lambda q: getattr(p, '_wl', '') != 'handle')
p.bone('handle', (0, HY, 0), (0, HY + 1.0, 0), parent='body', region=lambda q: getattr(p, '_wl', '') == 'handle')
p.extras['argMode'] = 'tint'
p.extras['argDefault'] = 0x4a90ff
p.extras['outline'] = 0.024
p.build()
