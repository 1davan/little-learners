"""Puffy toy clouds (scenery makeCloud). Three shapes in one file, one per layer: skin = A (the classic, four big
puffs), 'b' = a compact tall one, 'c' = a long low one. Each is a soft flat-bottomed pillow with round puffs on top,
about 4.4 wide x 2.4 tall x 1.6 deep, centred on the origin like the old sphere cloud. Painted white with a cool lilac
underside band; tintable (argMode 'tint': makeCloud's colour multiplies it, so sunset / rain / night clouds work)."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop

WHITE, UNDER = 0xffffff, 0xdfe3f3
SHAPES = {   # puffs (x, y, r, z): alternate depths so each puff reads as its own ball in the toon shading
    'skin': ([(-1.62, -0.2, 0.6, 0.12), (-0.72, 0.22, 0.76, -0.08), (0.4, 0.5, 0.9, 0.1), (1.4, 0.0, 0.7, -0.05),
              (-0.2, 0.05, 0.7, -0.5), (0.85, -0.12, 0.62, 0.3), (-1.15, -0.2, 0.58, 0.32)], (2.15, 0.36)),
    'b': ([(-0.98, -0.1, 0.66, 0.1), (0.0, 0.45, 0.92, -0.05), (1.0, 0.0, 0.72, 0.08), (0.2, -0.05, 0.75, -0.45),
           (0.45, -0.15, 0.6, 0.35)], (1.65, 0.36)),
    'c': ([(-1.95, -0.28, 0.52, 0.08), (-1.08, 0.02, 0.68, -0.06), (-0.08, 0.2, 0.8, 0.08), (0.95, 0.06, 0.7, -0.04),
           (1.85, -0.22, 0.55, 0.06), (-0.6, -0.18, 0.55, 0.3), (0.5, -0.15, 0.55, 0.32)], (2.4, 0.32)),
}
p = Prop('prop_scene_cloud', base=WHITE, target_faces=1150, voxel=0.022, smooth=8)


def cloud(name):
    puffs, (bw, bh) = SHAPES[name]
    for i, (x, y, r, z) in enumerate(puffs):
        p.blob((x, y, z), (r, r * 0.96, r * 0.86), group='p%d' % i)
    p.blob((0, -0.4, -0.05), (bw, bh, 0.58), group='base')
    # cool underside: a soft wavy band across the flat bottom
    p.paint_fn(lambda q, n: q.y < -0.5 + 0.06 * math.sin(q.x * 2.6) and n.y < 0.55, UNDER)


cloud('skin')
for nm in ('b', 'c'):
    p.layer(nm, base=WHITE, target_faces=1150, voxel=0.022)
    cloud(nm)
p.layer('skin')
p.bone('body', (0, -0.8, 0), (0, 1.4, 0))
p.extras['argMode'] = 'tint'
p.extras['argDefault'] = 0xffffff
p.extras['outline'] = 0.03
p.build()
