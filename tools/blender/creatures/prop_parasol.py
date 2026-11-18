"""Beach parasol canopy (Where's Crab? umbrella, Bear's beach umbrella). The pole is its own model (prop_pole) because
Where's Crab squashes the pole for its 'under' gag. Origin = canopy centre as the old cone: rib tips at y -0.375, radius
2.0, canopy crown y 0.4, ball finial on top (its top at y 0.56: a friend standing ON the umbrella stands there).
A hub collar runs from y -0.24 up into the crown, so a pole ending anywhere from the origin to the crown is hidden in it.

Look: eight scalloped panels - red / white / yellow / white / blue / white / green / white - each sagging softly between
its ribs, its outer edge curving in between the rib tips; a scalloped valance (two round lobes per panel) hangs from
the edge; cream ribs and stretchers underneath with round rib-tip caps, a runner collar, and a red ball finial."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded, TAU

R, TOP, EDGE, TH = 2.0, 0.4, -0.375, 0.045
SAG, SCAL, VH = 0.1, 0.11, 0.2
CREAM, FRAME, RED = 0xfffaf0, 0xf3ece0, 0xff5a5a
COLS = [0xff5a5a, None, 0xffd23f, None, 0x4a90ff, None, 0x5fd068, None]


class Clean(Prop):
    """hard-surface: layers are clean swept / revolved pieces joined as they are (no voxel remesh)"""
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
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        bmesh.ops.triangulate(bm, faces=bm.faces[:])
        print('CLEAN', self._cur, 'tris', len(bm.faces))
        bm.to_mesh(skin.data)
        bm.free()
        skin.data.update()
        for f in skin.data.polygons:
            f.use_smooth = True
        return skin


def crown(r):
    """canopy height along a rib at radius r"""
    return TOP - (TOP - EDGE) * (r / R) ** 1.75


def surf(i, u, t):
    """top surface point of panel i at radial u (0..1) and across t (0..1): sags between the ribs, edge scalloped in"""
    s = math.sin(math.pi * t)
    a = (i + t) / 8 * TAU
    r = u * (R - SCAL * s)
    y = crown(r) - SAG * s * min(1.0, u * 1.6) ** 1.2
    return r, a, y


def P(r, a, y):
    return (r * math.sin(a), y, r * math.cos(a))


def solid(top, bot):
    """a closed slab from two (rows x cols) grids of points (top and bottom), with side walls"""
    n, m = len(top), len(top[0])
    verts = [p for row in top for p in row] + [p for row in bot for p in row]
    off = n * m
    idx = lambda k, j: k * m + j
    faces = []
    for k in range(n - 1):
        for j in range(m - 1):
            faces.append((idx(k, j), idx(k, j + 1), idx(k + 1, j + 1), idx(k + 1, j)))
            faces.append((off + idx(k, j), off + idx(k + 1, j), off + idx(k + 1, j + 1), off + idx(k, j + 1)))
    for k in range(n - 1):
        for j in (0, m - 1):
            faces.append((idx(k, j), idx(k + 1, j), off + idx(k + 1, j), off + idx(k, j)))
    for j in range(m - 1):
        for k in (0, n - 1):
            faces.append((idx(k, j), off + idx(k, j), off + idx(k, j + 1), idx(k, j + 1)))
    return verts, faces


def panel(p, i):
    NU, NT = 12, 10
    top, bot = [], []
    for k in range(NU + 1):
        u = 0.03 + 0.97 * k / NU
        rt, rb = [], []
        for j in range(NT + 1):
            t = j / NT
            r, a, y = surf(i, u, t)
            rt.append(P(r, a, y))
            rb.append(P(r - 0.01, a, y - TH))
        top.append(rt); bot.append(rb)
    p.mesh(*solid(top, bot))
    # valance: a skirt hanging from the edge, its hem in two round lobes
    NV = 20
    out_, in_ = [], []
    for k in range(2):
        ro, ri = [], []
        for j in range(NV + 1):
            t = j / NV
            r, a, y = surf(i, 1.0, t)
            lobe = abs(math.sin(TAU * t)) ** 0.6
            drop = 0 if k == 0 else VH * (0.55 + 0.45 * lobe)
            rr = r - 0.025 + drop * 0.18                       # flares out a touch as it hangs
            ro.append(P(rr + 0.012, a, y - TH * 0.5 - drop))
            ri.append(P(rr - 0.012, a, y - TH * 0.5 - drop))
        out_.append(ro); in_.append(ri)
    p.mesh(*solid(out_, in_))


p = Clean('prop_parasol', base=CREAM)
for i, c in enumerate(COLS):
    if c is None:
        panel(p, i)
for i, c in enumerate(COLS):
    if c is not None:
        p.layer('panel%d' % i, base=c)
        panel(p, i)

# frame: ribs + tip caps + stretchers + hub + runner
p.layer('frame', base=FRAME)
for i in range(8):
    a = i / 8 * TAU
    pts = []
    for k in range(13):
        r = 0.1 + (R - 0.08 - 0.1) * k / 12
        pts.append(P(r, a, crown(r) - TH - 0.03))
    p.tube(pts, 0.026, rseg=8)
    p.lathe([(0, -0.055)] + [(0.055 * math.sin(math.pi * k / 6), -0.055 * math.cos(math.pi * k / 6)) for k in range(1, 6)] + [(0, 0.055)],
            pos=P(R + 0.005, a, EDGE - TH * 0.5), seg=10)        # round rib-tip cap
    s0, s1 = (0, -0.42, 0), P(0.95, a, crown(0.95) - TH - 0.04)
    p.tube([s0, s1], 0.018, rseg=6)
p.cyl((0, -0.24, 0), 0.11, 0.6, bevel=0.03, seg=20)                  # hub collar (pole hides inside)
p.cyl((0, -0.5, 0), 0.115, 0.16, bevel=0.04, seg=20)                  # runner
# finial: a red ball on a little neck
p.layer('knob', base=RED)
p.lathe(rounded([(0, TOP - 0.06), (0.08, TOP - 0.06), (0.085, TOP - 0.01), (0.05, TOP + 0.02), (0.04, TOP + 0.08), (0, TOP + 0.08)], 0.02, n=2), seg=20)
BC, BR = TOP + 0.15, 0.1                                              # ball: top at y 0.65
p.lathe([(0, BC - BR)] + [(BR * math.sin(math.pi * k / 10), BC - BR * math.cos(math.pi * k / 10)) for k in range(1, 10)] + [(0, BC + BR)], seg=20)
p.layer('skin')
p.bone('body', (0, EDGE, 0), (0, TOP, 0))
p.extras['outline'] = 0.02
p.build()
