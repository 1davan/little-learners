// Splash wash helpers: the six kinds of mess, foam puffs, and the little "how it got messy" prop.
import * as T from '../three.js';
import { mesh, geo, toonUnique, toon, basic, blobShadow } from '../engine/toon.js';

export const MESS = {
  sand: { adj: 'Sandy', snd: 'crunch' },
  mud: { adj: 'Muddy', snd: 'thunk' },
  paint: { adj: 'Painty', snd: 'pop' },
  jam: { adj: 'Jammy', snd: 'chomp' },
  grass: { adj: 'Grassy', snd: 'rustle' },
  choc: { adj: 'Chocolatey', snd: 'mmm' },
};
const PAINT = [0xff4b6b, 0x4a90ff, 0xffd23f, 0x5fd068, 0xa77bff, 0xff9f3f];

// fading-friendly blob (unique transparent material, no outline)
function blob(r, col, sx, sy, sz, x = 0, y = 0, z = 0) {
  const m = new T.Mesh(geo.sphere(r, 14, 10), toonUnique(col, { transparent: true }));
  m.scale.set(sx, sy, sz); m.position.set(x, y, z);
  return m;
}

export function makeMess(kind) {
  const g = new T.Group();
  if (kind === 'sand') {
    g.add(blob(0.34, 0xe0b878, 1.35, 1, 0.4));
    for (let i = 0; i < 7; i++) {
      const a = i * 2.4, r = 0.08 + (i % 3) * 0.09;
      g.add(blob(0.05 + (i % 2) * 0.02, i % 3 ? 0xb88a4a : 0xfff6e0, 1, 1, 1, Math.cos(a) * r * 1.3, Math.sin(a) * r, 0.12));
    }
  } else if (kind === 'mud') {
    g.add(blob(0.34, 0x6b4423, 1.4, 1.05, 0.4));
    g.add(blob(0.1, 0x6b4423, 0.9, 2.0, 0.6, -0.16, -0.32, 0.04), blob(0.08, 0x6b4423, 0.9, 2.2, 0.6, 0.14, -0.3, 0.04));
    g.add(blob(0.09, 0x8a5a34, 1.3, 0.8, 0.5, 0.08, 0.1, 0.12));
    for (const [x, y] of [[0.5, 0.18], [-0.5, 0.12], [0.36, -0.22]]) g.add(blob(0.06, 0x6b4423, 1, 1, 0.5, x, y, 0.02));
  } else if (kind === 'paint') {
    const cols = PAINT.slice().sort(() => Math.random() - 0.5);
    for (let i = 0; i < 3; i++) {
      const a = i * 2.1 + 0.4;
      g.add(blob(0.2, cols[i], 1.3, 1, 0.4, Math.cos(a) * 0.2, Math.sin(a) * 0.15, 0.02 * i));
      g.add(blob(0.05, cols[i], 1, 1, 0.5, Math.cos(a) * 0.48, Math.sin(a) * 0.36, 0.04));
    }
  } else if (kind === 'jam') {
    g.add(blob(0.33, 0xc2185b, 1.35, 1.05, 0.45));
    g.add(blob(0.1, 0xc2185b, 0.8, 1.8, 0.6, 0.12, -0.32, 0.03));
    g.add(blob(0.07, 0xffd0e4, 1.4, 0.8, 0.5, -0.14, 0.12, 0.14));
    for (let i = 0; i < 5; i++) g.add(blob(0.03, 0xffe08a, 1, 1.4, 0.6, -0.25 + i * 0.12, ((i * 7) % 3) * 0.08 - 0.08, 0.15));
  } else if (kind === 'grass') {
    g.add(blob(0.32, 0x7fc24a, 1.4, 0.95, 0.4));
    for (let i = 0; i < 4; i++) {
      const l = blob(0.13, i % 2 ? 0x3f8f2e : 0x58b43a, 1.6, 0.55, 0.4, -0.28 + i * 0.19, (i % 2) * 0.14 - 0.06, 0.12);
      l.rotation.z = i * 0.9 - 1.2; g.add(l);
    }
  } else { // chocolate with sprinkles
    g.add(blob(0.34, 0x5a3220, 1.35, 1.05, 0.45));
    g.add(blob(0.08, 0x8a5a3c, 1.4, 0.8, 0.5, -0.12, 0.13, 0.14));
    for (let i = 0; i < 6; i++) {
      const sp = new T.Mesh(geo.box(0.12, 0.035, 0.035), toonUnique(PAINT[i], { transparent: true }));
      sp.position.set(-0.3 + i * 0.12, ((i * 5) % 3) * 0.1 - 0.1, 0.15); sp.rotation.z = i * 1.3;
      g.add(sp);
    }
  }
  return g;
}

export function setMessLook(m, p, base = 1) {
  const k = Math.max(0, 1 - p);
  m.scale.setScalar(base * (0.35 + 0.65 * k));
  m.traverse((o) => { if (o.material) o.material.opacity = 0.2 + 0.8 * k; });
}

export function makeFoam() {
  const r = 0.09 + Math.random() * 0.08;
  return mesh(geo.sphere(Math.round(r * 100) / 100, 10, 8), 0xffffff, { outline: 0.012 });
}

// a little prop beside the friend that shows where the mess came from
export function makeCause(kind) {
  const g = new T.Group();
  if (kind === 'sand') {
    const pile = mesh(geo.sphere(0.8, 16, 10), 0xe8c787, { outline: 0.025 }); pile.scale.set(1.2, 0.45, 1); pile.position.y = 0.05;
    const handle = mesh(geo.cyl(0.05, 0.05, 0.9, 8), 0xff5a5a, { outline: 0.012 }); handle.position.set(0.2, 0.75, 0); handle.rotation.z = -0.5;
    const blade = mesh(geo.box(0.32, 0.36, 0.06), 0xffd23f, { hull: 1.08 }); blade.position.set(0.02, 0.35, 0); blade.rotation.z = -0.5;
    g.add(pile, handle, blade);
  } else if (kind === 'mud') {
    const rim = new T.Mesh(geo.circle(1.0, 24), toon(0x8a5a34)); rim.rotation.x = -Math.PI / 2; rim.position.y = 0.025; rim.scale.set(1.4, 0.9, 1);
    const pud = new T.Mesh(geo.circle(0.82, 24), toon(0x6b4423)); pud.rotation.x = -Math.PI / 2; pud.position.y = 0.035; pud.scale.set(1.4, 0.9, 1);
    for (const [x, z] of [[-0.4, 0.1], [0.45, -0.15]]) { const b = mesh(geo.sphere(0.12, 10, 8), 0x5a3a20, { outline: 0.012 }); b.scale.y = 0.5; b.position.set(x, 0.06, z); g.add(b); }
    g.add(rim, pud);
  } else if (kind === 'paint') {
    const pot = mesh(geo.cyl(0.42, 0.38, 0.6, 18), 0xfff6e6, { outline: 0.025 }); pot.position.y = 0.3;
    const col = PAINT[Math.floor(Math.random() * PAINT.length)];
    const top = new T.Mesh(geo.circle(0.39, 18), toon(col)); top.rotation.x = -Math.PI / 2; top.position.y = 0.605;
    const drip = mesh(geo.sphere(0.09, 8, 6), col, { outline: 0.01 }); drip.scale.set(1, 2, 0.6); drip.position.set(0.1, 0.42, 0.38);
    const brush = mesh(geo.cyl(0.04, 0.04, 0.9, 8), 0xa0623a, { outline: 0.012 }); brush.position.set(-0.1, 0.8, 0); brush.rotation.z = 0.35;
    const tip = mesh(geo.cone(0.08, 0.2, 8), col, { outline: 0.01 }); tip.position.set(0.05, 1.28, 0); tip.rotation.z = 0.35;
    const splat = new T.Mesh(geo.circle(0.3, 14), toon(col)); splat.rotation.x = -Math.PI / 2; splat.position.set(0.55, 0.02, 0.35);
    g.add(pot, top, drip, brush, tip, splat);
  } else if (kind === 'jam') {
    const jar = mesh(geo.cyl(0.36, 0.36, 0.7, 18), 0xc2185b, { outline: 0.025 }); jar.position.y = 0.35;
    const lid = mesh(geo.cyl(0.4, 0.4, 0.14, 18), 0xffffff, { outline: 0.02 }); lid.position.set(0.45, 0.07, 0.2); lid.rotation.z = 1.3;
    const label = new T.Mesh(geo.cyl(0.365, 0.365, 0.28, 18, true), toon(0xfff1c9)); label.position.y = 0.36;
    const berry = mesh(geo.sphere(0.1, 10, 8), 0xff3b5c, { outline: 0.01 }); berry.position.set(0, 0.36, 0.37);
    const spill = new T.Mesh(geo.circle(0.32, 14), toon(0xc2185b)); spill.rotation.x = -Math.PI / 2; spill.position.set(-0.45, 0.02, 0.3);
    g.add(jar, label, berry, lid, spill);
  } else if (kind === 'grass') {
    for (let i = 0; i < 7; i++) {
      const b = mesh(geo.cone(0.09, 0.7 + (i % 3) * 0.2, 6), i % 2 ? 0x58b43a : 0x7fc24a, { outline: 0.01 });
      b.position.set(-0.5 + i * 0.17, 0.35, (i % 2) * 0.15); b.rotation.z = (i - 3) * 0.12; g.add(b);
    }
    const fl = mesh(geo.sphere(0.13, 10, 8), 0xff8fc0, { outline: 0.012 }); fl.position.set(0.2, 0.95, 0.1);
    const mid = mesh(geo.sphere(0.06, 8, 6), 0xffd23f, { outline: 0 }); mid.position.set(0.2, 0.95, 0.2);
    g.add(fl, mid);
  } else { // ice-cream cone dropped on the ground
    const cone = mesh(geo.cone(0.25, 0.7, 12), 0xe0a860, { outline: 0.02 }); cone.position.set(0, 0.3, 0); cone.rotation.z = 1.9;
    const scoop = mesh(geo.sphere(0.3, 14, 10), 0x5a3220, { outline: 0.02 }); scoop.position.set(0.42, 0.22, 0); scoop.scale.y = 0.75;
    const splat = new T.Mesh(geo.circle(0.35, 14), toon(0x5a3220)); splat.rotation.x = -Math.PI / 2; splat.position.set(0.5, 0.02, 0.1);
    g.add(cone, scoop, splat);
  }
  g.add(blobShadow(0.7));
  return g;
}

// a soap bubble: see-through with a bright rim and a shine (reads as a bubble on any background)
const bubbleBody = new T.MeshBasicMaterial({ color: 0xeaf8ff, transparent: true, opacity: 0.32, depthWrite: false });
const bubbleRim = new T.MeshBasicMaterial({ color: 0x8fd0ff, transparent: true, opacity: 0.75, side: T.BackSide, depthWrite: false });
bubbleBody.userData.shared = bubbleRim.userData.shared = true;
export function makeSoapBubble(r = 0.3) {
  const b = new T.Mesh(geo.sphere(1, 18, 14), bubbleBody);
  const rim = new T.Mesh(geo.sphere(1, 18, 14), bubbleRim); rim.scale.setScalar(1.08);
  const hi = new T.Mesh(geo.sphere(0.22, 8, 6), basic(0xffffff)); hi.position.set(-0.42, 0.42, 0.75); hi.scale.set(1, 0.7, 0.5);
  const hi2 = new T.Mesh(geo.sphere(0.1, 8, 6), basic(0xffffff)); hi2.position.set(0.45, -0.4, 0.8);
  const tint = new T.Mesh(geo.torus(0.93, 0.05, Math.PI * 0.7, 6, 20), basic(0xffb6e6, { transparent: true, opacity: 0.8 }));
  tint.position.z = 0.25; tint.rotation.z = -2.2;
  b.add(rim, hi, hi2, tint);
  b.scale.setScalar(r);
  return b;
}

export function makeDrop() {
  return new T.Mesh(geo.sphere(0.09, 6, 4), basic(0x8fd8ff));
}
