"""Grow a flower planters (each origin on the ground, the soil on top is a separate tintable model, prop_soiltop, except
the mound which IS soil). ONLY=prop_teacup tools/blender/build.sh prop_planters builds one.
  prop_soiltop     a lumpy soil top: radius 1.0, 0.14 thick (y 0..0.14), crumbs on top; tintable (painted light grey, the
                   game tints it soil brown and darkens it when watered)
  prop_soilmound   a soft soil mound 3.1 x 0.42 x 2.4 (tintable like the soil top) ringed by nine round grey stones
  prop_planterbox  a wooden planter box 2.4 x 0.7 x 1.3: chunky planks, corner posts, two painted flowers on the front;
                   its soil sits at y 0.68
  prop_welly       a red welly boot planter: leg radius 0.6 up to a yellow cuff at y 1.28 (soil at 1.22), the foot
                   toward +x, a dark sole and a pull tab
  prop_metaltub    a galvanised tub: top radius 0.95, rim at y 0.82, two ridges, side handles
  prop_teacup      a giant teacup on a saucer: rim radius 0.95 at y 1.08, a blue band, pink polka dots, a loop handle
"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, rounded

ONLY = [k for k in os.environ.get('ONLY', '').split(',') if k]
want = lambda n: not ONLY or n in ONLY


def soiltop():
    p = Prop('prop_soiltop', base=0xffffff, target_faces=900, voxel=0.016, smooth=3)
    p.cyl((0, 0, 0), 1.0, 0.1, bevel=0.04, seg=48)
    p.blob((0, 0.08, 0), (0.95, 0.07, 0.95), group='top')                      # a soft smooth domed top (no scribbly lumps)
    p.paint_fn(lambda q, n: q.y < 0.06 and math.hypot(q.x, q.z) > 0.9, 0xd6d6d6)
    p.layer('crumbs', base=0xcfcfcf, target_faces=300, voxel=0.01)
    p.quadriflow = False
    for i, (x, z, s) in enumerate([(0.3, 0.4, 0.07), (-0.45, 0.2, 0.06), (0.1, -0.5, 0.075), (-0.2, 0.55, 0.055), (0.55, -0.15, 0.065), (-0.1, 0.05, 0.06)]):
        p.blob((x, 0.155, z), (s, s * 0.7, s * 0.9), rot=(0, i * 40, 0), group='c%d' % i)      # a few clean round crumbs
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 0.2, 0))
    p.extras['argMode'] = 'tint'; p.extras['argDefault'] = 0x7a4a2c
    p.extras['outline'] = 0.018
    p.build()


def mound():
    p = Prop('prop_soilmound', base=0xffffff, target_faces=1600, voxel=0.02, smooth=3)
    p.blob((0, 0.0, 0), (1.55, 0.42, 1.2))
    for i in range(10):
        a = i * 2.3
        r = 0.9 * math.sqrt((i + 0.5) / 10)
        p.blob((r * math.cos(a) * 1.2, 0.32 - r * 0.25, r * math.sin(a)), (0.22, 0.1, 0.2), group='lump%d' % i)
    p.paint_fn(lambda q, n: (math.sin(q.x * 7 + q.z * 3) + math.sin(q.z * 9 - q.x * 4)) > 1.3, 0xc8c8c8)
    # round pebbles set into the mound's lower slope (half sunk, on the surface, never hanging off the edge)
    p.layer('stones', base=0xd8d2c4, target_faces=1800, voxel=0.012)
    for i in range(9):
        a = i / 9 * math.tau + 0.2
        f = 0.86 + 0.05 * (i % 2)
        x, z = math.cos(a) * 1.55 * f, math.sin(a) * 1.2 * f
        y = 0.42 * math.sqrt(max(0.0, 1 - f * f))
        s = 0.15 + 0.03 * ((i * 5) % 3) / 2
        p.blob((x, y - 0.03, z), (s * 1.15, s * 0.75, s), rot=(0, math.degrees(-a), 0), group='s%d' % i)
    p.paint_fn(lambda q, n: (int((math.atan2(q.z, q.x) - 0.2 + 7) / (math.tau / 9) + 0.5)) % 3 == 0, 0xb7b2a6)
    p.paint_fn(lambda q, n: n.y > 0.8, 0xe8e3d8)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 0.45, 0))
    p.extras['argMode'] = 'tint'; p.extras['argDefault'] = 0x7a4a2c
    p.extras['outline'] = 0.026
    p.build()


def planterbox():
    WOOD, WOOD_D = 0xc98a50, 0xa0623a
    p = Prop('prop_planterbox', base=WOOD, target_faces=2400, voxel=0.018, smooth=3)
    for y in (0.17, 0.5):
        for z in (-0.6, 0.6):
            p.box((0, y, z), (1.15, 0.16, 0.06), bevel=0.04)
        for x in (-1.15, 1.15):
            p.box((x, y, 0), (0.06, 0.16, 0.6), bevel=0.04)
    for x in (-1.17, 1.17):
        for z in (-0.62, 0.62):
            p.box((x, 0.36, z), (0.1, 0.38, 0.1), bevel=0.05)
    p.box((0, 0.36, 0), (1.12, 0.3, 0.56), bevel=0.02)          # inside fill so it isn't see-through
    p.paint_fn(lambda q, n: abs(q.x) > 1.06 and abs(q.z) > 0.51, WOOD_D)
    p.paint_fn(lambda q, n: abs(abs(q.y - 0.335)) < 0.02, WOOD_D)
    p.layer('flowers', base=0xff8fc0, target_faces=700, voxel=0.009)
    for fx, col in ((-0.7, 0), (0.7, 1)):
        for k in range(5):
            a = k / 5 * math.tau + 0.3
            p.blob((fx + 0.1 * math.cos(a), 0.36 + 0.1 * math.sin(a), 0.68), (0.065, 0.065, 0.02), group='f%d%d' % (col, k))
    p.paint_fn(lambda q, n: q.x > 0, 0xa77bff)
    p.layer('mids', base=0xffd23f, target_faces=120, voxel=0.008)
    for fx in (-0.7, 0.7):
        p.blob((fx, 0.36, 0.7), (0.05, 0.05, 0.02), group='m%d' % (fx > 0))
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 0.72, 0))
    p.extras['outline'] = 0.024
    p.build()


def welly():
    RED, RED_D, CUFF, SOLE = 0xff5a5a, 0xe04848, 0xffd23f, 0x5a4a5a
    p = Prop('prop_welly', base=RED, target_faces=2400, voxel=0.016, smooth=3)
    p.lathe(rounded([(0, 0.05), (0.58, 0.05), (0.6, 0.6), (0.6, 1.22), (0.0, 1.22)], 0.08, n=3), seg=48)
    p.blob((0.55, 0.3, 0.0), (0.62, 0.28, 0.5), group='foot')
    p.blob((0.95, 0.24, 0.0), (0.3, 0.22, 0.42), group='foot')
    p.paint_fn(lambda q, n: q.y < 0.14, RED_D)
    p.layer('sole', base=SOLE, target_faces=600, voxel=0.016)
    p.box((0.42, 0.05, 0), (0.95, 0.05, 0.5), bevel=0.05)
    p.box((-0.18, 0.08, 0), (0.42, 0.08, 0.48), bevel=0.06)
    p.layer('cuff', base=CUFF, target_faces=700, voxel=0.014)
    p.lathe(rounded([(0.56, 1.12), (0.68, 1.12), (0.68, 1.3), (0.56, 1.3)], 0.04, n=2, closed=True), closed=True, seg=48)
    p.layer('tab', base=CUFF, target_faces=150, voxel=0.01)
    p.box((-0.66, 1.15, 0), (0.06, 0.14, 0.12), bevel=0.04)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 1.3, 0))
    p.extras['outline'] = 0.026
    p.build()


def metaltub():
    TIN, TIN_D, TIN_L = 0xb9c4cc, 0x9aa6ae, 0xdfe6ea
    p = Prop('prop_metaltub', base=TIN, target_faces=2000, voxel=0.015, smooth=3)
    p.lathe(rounded([(0, 0), (0.8, 0), (0.95, 0.8), (0.0, 0.8)], 0.06, n=3), seg=56)
    p.paint_fn(lambda q, n: q.x < -0.3 and q.z > 0.2 and abs(q.x + q.z * 0.2 + 0.55) < 0.07 and 0.15 < q.y < 0.7, TIN_L)
    p.layer('ridges', base=TIN_D, target_faces=1200, voxel=0.012)
    for y in (0.16, 0.6):
        p.ring((0, y, 0), 0.8 + 0.15 * y / 0.8 + 0.02, 0.035, seg=56, rseg=8)
    p.ring((0, 0.8, 0), 0.96, 0.05, seg=56, rseg=8)
    for s in (-1, 1):
        p.tube([(s * 0.9, 0.52, -0.16), (s * 1.12, 0.6, -0.12), (s * 1.12, 0.6, 0.12), (s * 0.9, 0.52, 0.16)], 0.04, rseg=8)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 0.85, 0))
    p.extras['outline'] = 0.026
    p.build()


def teacup():
    CHINA, BAND, DOT = 0xfff6e6, 0x4a90ff, 0xff8fc0
    p = Prop('prop_teacup', base=CHINA, target_faces=4200, voxel=0.012, smooth=3)
    p.lathe(rounded([(0, 0.12), (0.62, 0.12), (0.92, 0.6), (0.97, 1.08), (0.0, 1.08)], 0.06, n=3), seg=56)
    p.lathe(rounded([(0, 0.0), (1.35, 0.0), (1.4, 0.06), (1.32, 0.14), (0.0, 0.12)], 0.03, n=2), seg=64)  # saucer
    p.tube([(0.88, 0.85, 0)] + [(1.06 + 0.24 * math.sin(math.radians(a)), 0.62 + 0.24 * math.cos(math.radians(a)), 0) for a in range(0, 181, 20)] + [(0.82, 0.38, 0)], 0.075, rseg=10)
    p.paint_fn(lambda q, n: n.y > 0.6 and 1.16 < math.hypot(q.x, q.z) < 1.3 and q.y < 0.16, 0xc9dcff)          # a clean saucer ring
    rw = lambda y: 0.92 + 0.05 * (y - 0.6) / 0.48
    p.layer('band', base=BAND, target_faces=900, voxel=0.011)
    p.lathe(rounded([(rw(0.78) - 0.01, 0.78), (rw(0.94) - 0.01, 0.94), (rw(0.94) + 0.03, 0.94), (rw(0.78) + 0.03, 0.78)], 0.015, n=2, closed=True), closed=True, seg=64)
    p.layer('dots', base=DOT, target_faces=500, voxel=0.01)
    for i in range(9):
        a = i / 9 * math.tau + 0.35
        r = 0.87
        p.blob((r * math.sin(a), 0.5, r * math.cos(a)), (0.075, 0.075, 0.03), rot=(0, math.degrees(a), 0), group='d%d' % i)
    p.layer('skin')
    p.bone('body', (0, 0, 0), (0, 1.1, 0))
    p.extras['outline'] = 0.026
    p.build()


for n, fn in [('prop_soiltop', soiltop), ('prop_soilmound', mound), ('prop_planterbox', planterbox), ('prop_welly', welly), ('prop_metaltub', metaltub), ('prop_teacup', teacup)]:
    if want(n):
        fn()
