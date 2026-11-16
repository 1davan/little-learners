"""Beach bonfire (starry night). A ring of eight soft stones (skin), four crossed logs with pale cut ends (layer 'logs'),
flames in two unlit layers that flicker in scenery.js ('flame' orange outer tongues, 'flame2' yellow heart; both built
from y = 0.2 up), and a separate sitting log (layer 'seat', centred at the origin, lying along x)."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from skit import SProp, dome_profile

p = SProp('prop_bonfire', base=0xa9a3bd)
for i in range(8):
    a = i / 8 * math.tau + 0.2
    r = 0.17 + 0.03 * math.sin(i * 2.7)
    p.lathe(dome_profile(r, r * 0.7, n=3), pos=(0.66 * math.cos(a), 0, 0.66 * math.sin(a)), rot=(0, math.degrees(a), 0), seg=8, scale=(1.3, 1))
p.paint_fn(lambda q, n: n.y > 0.85, 0xc8c2d6)
p.layer('logs', base=0x8a5a3b)
for k in range(4):
    a = k * math.pi / 2 + 0.4
    ca, sa = math.cos(a), math.sin(a)
    p.cyl((0.55 * ca, 0.06, 0.55 * sa), 0.085, 0.9, rot=(0, 0, 0), seg=10, bevel=0.03) if False else None
    base = (0.58 * ca, 0.08, 0.58 * sa)
    top = (0.08 * ca, 0.55, 0.08 * sa)
    import mathutils
    d = mathutils.Vector(top) - mathutils.Vector(base)
    L = d.length
    # tilt a y-cylinder onto the base->top direction
    rx = math.degrees(math.atan2(d.z, d.y))
    rz = -math.degrees(math.atan2(d.x, math.hypot(d.y, d.z)))
    p.cyl(base, 0.085, L, rot=(rx, 0, rz), seg=10, bevel=0.03)
p.paint_fn(lambda q, n: math.hypot(q.x, q.z) > 0.56 and q.y < 0.2, 0xf2d6a0)
for name, col, tongues in (('flame', 0xff7a2f, [(0, 0.02, 0.36, 1.0), (0.2, 0.06, 0.2, 0.62), (-0.19, -0.04, 0.21, 0.68), (0.02, -0.2, 0.19, 0.55)]),
                           ('flame2', 0xffe27a, [(0.0, 0.16, 0.22, 0.62), (0.1, 0.12, 0.13, 0.42), (-0.1, 0.14, 0.12, 0.38)])):
    p.layer(name, base=col)
    for (x, z, r, h) in tongues:
        prof = [(0, 0)]
        for i in range(1, 12):
            t = i / 12
            prof.append((r * math.sin(math.pi * t) ** 0.85 * (1 - 0.45 * t) + 0.01, h * t))
        prof.append((0, h))
        p.lathe(prof, pos=(x, 0.18, z), rot=(0, 0, -math.degrees(x * 0.8)), seg=10)
    if name == 'flame':
        p.paint_fn(lambda q, n: q.y < 0.36, 0xff5a3a)
p.layer('seat', base=0x8a5a3b)
p.cyl((-0.8, 0.25, 0), 0.25, 1.6, rot=(0, 0, -90), seg=14, bevel=0.06)
p.paint_fn(lambda q, n: abs(q.x) > 0.76, 0xf2d6a0)
p.paint_fn(lambda q, n: abs(q.x) > 0.77 and math.hypot(q.y - 0.25, q.z) < 0.1, 0xd9b27a)
p.layer('skin')
p.extras['outline'] = 0.024
p.build()
