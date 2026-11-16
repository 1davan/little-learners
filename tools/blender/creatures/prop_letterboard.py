"""Brick letters: the building-site letter board the bricks click onto. A plain cream plywood panel (face at z = 0.12,
6.0 wide, y 0.9..6.5) between two chunky wooden posts, with a yellow header bar carrying black hazard stripes, a
bottom rail, round bolt heads and heavy grey feet. Hard bevelled toy pieces (no voxel remesh), ~2k triangles.
The face must stay perfectly flat: the game lays its faint letter outline and the bricks right on it."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
import bpy
from kit import Prop

PLY, PLY_D = 0xf7e4bf, 0xead2a4
WOOD, WOOD_D = 0xd8924f, 0xb9743a
YEL, INK = 0xffc21a, 0x3a3036
GREY, BOLT = 0x7c8290, 0xc9ced6


class CrispProp(Prop):
    """Bevelled primitives joined without the voxel remesh: crisp toy edges and dead-flat faces."""

    def _skin(self):
        objs = self._metaballs()
        bpy.context.view_layer.update()
        meshes = []
        for ob in objs:
            dg = bpy.context.evaluated_depsgraph_get()
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
        bpy.ops.object.shade_smooth()
        return skin


p = CrispProp('prop_letterboard', base=PLY)
p.paint_refine = 0
# the panel (cream plywood)
p.box((0, 3.7, 0), (3.0, 2.85, 0.12), bevel=0.06)

# posts, rails and header: their own layer so the panel stays one clean colour
p.layer('frame', base=WOOD)
for s in (-1, 1):
    p.box((s * 3.25, 3.45, 0.02), (0.24, 3.45, 0.24), bevel=0.1)          # posts
    p.box((s * 3.25, 7.02, 0.02), (0.3, 0.12, 0.3), bevel=0.09)           # post caps
p.box((0, 0.74, 0.04), (3.05, 0.16, 0.2), bevel=0.08)                     # bottom rail

p.layer('header', base=YEL)
p.box((0, 6.68, 0.08), (3.15, 0.34, 0.26), bevel=0.12)

# black hazard stripes on the header front: slanted parallelogram plates
p.layer('stripes', base=INK)
z0, z1 = 0.33, 0.37
for i in range(-6, 7):
    x = i * 0.55
    h = 0.27
    pts = [(x - 0.13 - h * 0.6, 6.68 - h), (x + 0.13 - h * 0.6, 6.68 - h), (x + 0.13 + h * 0.6, 6.68 + h), (x - 0.13 + h * 0.6, 6.68 + h)]
    # clip to the header face
    pts = [(max(-2.98, min(2.98, a)), b) for a, b in pts]
    if abs(pts[1][0] - pts[0][0]) < 0.02 and abs(pts[2][0] - pts[3][0]) < 0.02:
        continue
    verts = [(a, b, z0) for a, b in pts] + [(a, b, z1) for a, b in pts]
    p.mesh(verts, [(0, 1, 2, 3), (7, 6, 5, 4), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)])

# heavy grey feet and round bolt heads
p.layer('metal', base=GREY)
for s in (-1, 1):
    p.box((s * 3.25, 0.14, 0.05), (0.42, 0.14, 0.62), bevel=0.1)
p.layer('bolts', base=BOLT)
for s in (-1, 1):
    for y in (1.3, 6.0):
        p.cyl((s * 3.25, y, 0.23), 0.1, 0.06, bevel=0.035, rot=(90, 0, 0), seg=14)
p.layer('skin')

p.bone('body', (0, 0, 0), (0, 3.5, 0))
p.extras['outline'] = 0.024
p.build()
