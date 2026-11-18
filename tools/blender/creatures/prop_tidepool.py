"""Tide pool for the Where's Crab? boat. Oval, 2.35 x 1.3 (x by z) to the inner edge of the bank, origin on the sand.
A soft damp-sand bank (darker on its wet inner slope) with a few pebbles on it, and real-looking water inside: a calm
surface at y 0.26 (brim-full, so it shows over the low bank) (tint 'water'), a paler shallow band round the edge, and a few soft white glints. The boat floats in it
(the game adds slow ripple rings)."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded
import bpy

PX, PZ, WATER = 2.35, 1.3, 0.26
SZ = PZ / PX          # oval: the lathe is scaled in z
SAND, WET, DEEP, MID, SHALLOW, GLINT = 0xf2c87a, 0xd9a85a, 0x3aa9d8, 0x5cc8e6, 0xa6ecf6, 0xffffff


class Pool(Prop):
    """flat layers (flag 'raw') keep their exact geometry: a remeshed thin disc of water went lumpy at the edge"""
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
        bpy.ops.object.shade_smooth()
        return skin


p = Pool('prop_tidepool', base=SAND, target_faces=2600, voxel=0.03, smooth=3)
# the bank: a rounded ring of sand round the water, a little lumpy, with a wet inner slope
bank = [(PX - 0.16, -0.02), (PX - 0.08, 0.24), (PX + 0.08, 0.33), (PX + 0.32, 0.27), (PX + 0.58, 0.07), (PX + 0.64, -0.02)]
p.lathe(rounded(bank, 0.06, n=3), scale=(1, SZ), seg=64, closed=True)
for i, (a, s) in enumerate([(0.5, 0.16), (2.1, 0.12), (2.6, 0.1), (3.9, 0.15), (4.4, 0.11), (5.6, 0.13)]):
    r = PX + 0.18 + (i % 2) * 0.12
    p.blob((math.sin(a) * r, 0.28 + s * 0.4, math.cos(a) * r * SZ), (s * 1.25, s * 0.75, s), group='lump%d' % i)
p.paint_fn(lambda q, n: (q.x / PX) ** 2 + (q.z / PZ) ** 2 < 1.04 ** 2, WET)

# pebbles on the bank (one layer, a couple of greys and a pink)
p.layer('pebbles', base=0xd8cfc2, target_faces=500, voxel=0.012)
for i, (a, s, col) in enumerate([(0.55, 0.11, 0xc9c1b6), (0.7, 0.075, 0xe8e0d4), (2.4, 0.09, 0xd8cfc2), (3.95, 0.1, 0xc9c1b6), (4.1, 0.065, 0xffcfc0)]):
    r = PX + 0.26
    p.blob((math.sin(a) * r, 0.36, math.cos(a) * r * SZ), (s * 1.3, s * 0.7, s), group='peb%d' % i)
    p.paint_group(['peb%d' % i], col)

# the water: a calm oval surface (it meets the bank's wet slope just below the rim)
def disc(rx, rz, y, n=72):
    verts = [(0, y, 0)] + [(math.sin(2 * math.pi * i / n) * rx, y, math.cos(2 * math.pi * i / n) * rz) for i in range(n)]
    faces = [(0, 1 + i, 1 + (i + 1) % n) for i in range(n)]
    p.mesh(verts, faces)


def ring(r0, r1, y, n=72):
    verts, faces = [], []
    for i in range(n):
        a = 2 * math.pi * i / n
        verts += [(math.sin(a) * r0, y, math.cos(a) * r0 * SZ), (math.sin(a) * r1, y, math.cos(a) * r1 * SZ)]
    for i in range(n):
        j = (i + 1) % n
        faces.append((2 * i, 2 * i + 1, 2 * j + 1, 2 * j))
    p.mesh(verts, faces)


p.layer('water', base=MID)
p.layers['water']['raw'] = True
disc(PX + 0.0, PZ + 0.0, WATER)
p.layer('deep', base=DEEP)            # the deeper middle (mostly under the boat; shows round its ends)
p.layers['deep']['raw'] = True
disc(PX - 0.75, PZ - 0.42, WATER + 0.002)
p.layer('shallow', base=SHALLOW)
p.layers['shallow']['raw'] = True
ring(PX - 0.42, PX - 0.08, WATER + 0.004)
p.layer('glint', base=GLINT)
p.layers['glint']['raw'] = True
for cx, cz, l, w in [(-1.55, 0.42, 0.34, 0.08), (-1.2, 0.66, 0.16, 0.055), (1.6, -0.45, 0.3, 0.07), (1.75, 0.38, 0.14, 0.05)]:
    n = 16
    verts = [(cx, WATER + 0.008, cz)] + [(cx + math.cos(2 * math.pi * i / n) * l, WATER + 0.008, cz + math.sin(2 * math.pi * i / n) * w) for i in range(n)]
    p.mesh(verts, [(0, 1 + (i + 1) % n, 1 + i) for i in range(n)])
p.layer('skin')
p.bone('root', (0, 0, 0), (0, 0.5, 0))
p.extras['outline'] = 0.02
p.build()
