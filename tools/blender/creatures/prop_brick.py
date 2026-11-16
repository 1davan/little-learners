"""Chunky toy building brick (Brick letters). Crisp hard-edged vinyl toy: a rounded block with big rounded studs.
Modelled in LETTER orientation: the long axis is x (template length 2.0), the stroke width is y (0.62) and the studs
face the camera (+z); the body is 0.5 deep (z -0.25..0.25), the studs stand 0.12 proud of the front face.
Two meshes: 'prop_brick' = the body, 'stud' = ONE stud (centred at x = y = 0). The game stretches the body to any
length along x (only the straight middle stretches, the rounded ends stay rigid) and lays one stud every ~0.62 along
it, then tints the whole brick (painted white). Not voxel-remeshed: hard bevelled primitives keep the edges crisp and
the faces flat, so the stretch never distorts anything (~300 + ~150 triangles)."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
import bpy
from kit import Prop

L0, W, D = 2.0, 0.62, 0.5      # body length (x), stroke width (y), depth (z)
R_BEV = 0.11                    # body edge radius
SR, SH, SB = 0.2, 0.15, 0.055   # stud radius, height above an embed point, top-edge radius


class CrispProp(Prop):
    """A prop made of bevelled primitives only, joined without the voxel remesh (crisp toy edges, tiny budget)."""

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


p = CrispProp('prop_brick', base=0xffffff)
p.paint_refine = 0
# the body: one bevelled box (4-segment round edges)
p.box((0, 0, 0), (L0 / 2, W / 2, D / 2), bevel=R_BEV)
# one stud on the front face, a short rounded cylinder standing along +z (sunk 0.03 into the face)
p.layer('stud', base=0xffffff)
p.cyl((0, 0, D / 2 - 0.03), SR, SH, bevel=SB, rot=(90, 0, 0), seg=22)
p.layer('skin')
p.bone('body', (0, -0.3, 0), (0, 0.3, 0))
p.extras['outline'] = 0.02
p.build()
