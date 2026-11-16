"""Beach umbrella canopy (Where's Crab? umbrella; the pole stays code-built so the 'under' gag can squash it).
Origin = canopy centre as the old cone (edge at y -0.375, apex +0.375), radius 2.0: eight soft panels red / white /
yellow / white / blue / white / green / white, each drooping a little between the ribs, white tips and a red knob."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'props'))
from kit import Prop, TAU

R, TOP, EDGE, TH = 2.0, 0.4, -0.375, 0.07
COLS = [0xff5a5a, None, 0xffd23f, None, 0x4a90ff, None, 0x5fd068, None]
p = Prop('prop_parasol', base=0xfffaf0, target_faces=2400, voxel=0.018)


def panel(i):
    a0, a1 = i / 8 * TAU + 0.004, (i + 1) / 8 * TAU - 0.004
    prof = []
    for k in range(13):
        r = R * k / 12
        prof.append((r, TOP - (TOP - EDGE) * (r / R) ** 1.35))
    lower = [(r, y - TH) for r, y in reversed(prof)]
    p.lathe(prof + lower, a0=a0, a1=a1, seg=12)
for i, c in enumerate(COLS):
    if c is None:
        panel(i)
p.layer('knob', base=0xff5a5a, target_faces=300, voxel=0.012)
p.blob((0, TOP + 0.1, 0), (0.13, 0.12, 0.13), group='knob')
p.layer('tips', base=0xfffaf0, target_faces=500, voxel=0.012)
for i in range(8):
    a = i / 8 * TAU
    p.blob(((R + 0.02) * math.sin(a), EDGE - 0.06, (R + 0.02) * math.cos(a)), (0.07, 0.07, 0.07), group='t%d' % i)
for i, c in enumerate(COLS):
    if c is not None:
        p.layer('panel%d' % i, base=c, target_faces=900, voxel=0.018)
        panel(i)
p.layer('skin')
p.bone('body', (0, EDGE, 0), (0, TOP, 0))
p.extras['outline'] = 0.022
p.build()
