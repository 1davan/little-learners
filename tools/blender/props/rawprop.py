"""RawProp: a kit Prop whose layers can opt out of the voxel remesh / decimate / smoothing.

Use for clean manufactured shapes that must keep straight, crisp borders (canvas stripes, ribbon bands, beach-ball gores,
flat water): the remesh + decimate + smoothing chain wobbles long straight edges into saw-teeth.
    p = RawProp('prop_x', ...)
    p.layer('band', base=PINK); p.raw()          # this layer keeps its exact primitive geometry
Raw layers get smooth shading with an edge split at sharp corners (angle in radians, default 0.7), so flat faces stay
flat and curved sweeps stay smooth. Only `mesh`, `lathe`, `cyl`, `tube` and `box` (no bevel) primitives make sense here."""
from kit import Prop
import bpy


class RawProp(Prop):
    def raw(self, split=0.7):
        L = self.layers[self._cur]
        L['raw'] = True
        L['split'] = split
        return self

    def _skin(self):
        L = self.layers[self._cur]
        if not L.get('raw'):
            return super()._skin()
        objs = self._metaballs()
        bpy.context.view_layer.update()
        meshes = []
        for ob in objs:   # apply any modifiers (box bevels) by evaluating, like the kit does
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
        skin.name = skin.data.name = self._cur
        if L.get('split'):
            es = skin.modifiers.new('es', 'EDGE_SPLIT')
            es.split_angle = L['split']
            bpy.ops.object.modifier_apply(modifier='es')
        bpy.ops.object.shade_smooth()
        return skin
