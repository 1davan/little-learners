// Props for Share the snacks: the snacks, the bins they come in, and the plates that light up when everyone has the same.
import * as T from '../three.js';
import { mesh, geo, toon, toonUnique, basic, blobShadow } from '../engine/toon.js';
import { makeCarrot } from '../engine/farm.js';
import { makeBucket } from '../engine/beach.js';

const PI = Math.PI;

export function makeApple(s = 1) {
  const g = new T.Group();
  const a = mesh(geo.sphere(0.3, 18, 14), 0xf0453a, { outline: 0.022 });
  a.scale.set(1, 0.9, 1);
  const shine = new T.Mesh(geo.sphere(0.07, 8, 6), basic(0xffd0c8));
  shine.position.set(-0.13, 0.1, 0.24); shine.scale.set(1, 1.4, 0.5);
  const stem = mesh(geo.cyl(0.025, 0.035, 0.18, 6), 0x7a4a26, { outline: 0.01 });
  stem.position.y = 0.3; stem.rotation.z = -0.25;
  const leaf = mesh(geo.sphere(0.1, 10, 6), 0x4fb84a, { outline: 0.01 });
  leaf.scale.set(1.2, 0.35, 0.6); leaf.position.set(0.1, 0.33, 0); leaf.rotation.z = 0.5;
  g.add(a, shine, stem, leaf);
  g.scale.setScalar(s);
  return g;
}

export function makeCorn(s = 1) {
  const g = new T.Group();
  const cob = mesh(geo.cyl(0.17, 0.13, 0.8, 14), 0xffd23f, { outline: 0.022 });
  const tip = mesh(geo.sphere(0.17, 14, 8), 0xffd23f, { outline: 0.022 }); tip.position.y = 0.4; tip.scale.y = 0.8;
  for (let i = 0; i < 5; i++) {
    const r = new T.Mesh(geo.torus(0.165 - i * 0.008, 0.018, PI * 2, 4, 16), basic(0xf2b51d));
    r.rotation.x = PI / 2; r.position.y = 0.3 - i * 0.15;
    cob.add(r);
  }
  g.add(cob, tip);
  for (const [rz, ry] of [[0.5, 0], [-0.5, 0.4], [0.1, 2.2]]) {
    const h = mesh(geo.sphere(0.16, 10, 8), 0x7cc95c, { outline: 0.014 });
    h.scale.set(0.55, 2.0, 0.35); h.position.set(Math.sin(rz) * 0.12, -0.28, 0); h.rotation.set(0, ry, rz);
    g.add(h);
  }
  g.scale.setScalar(s);
  return g;
}

export function makeFish(s = 1) {
  const g = new T.Group();
  const body = mesh(geo.sphere(0.3, 16, 12), 0x6fb6e8, { outline: 0.022 });
  body.scale.set(1.5, 0.85, 0.5);
  const belly = new T.Mesh(geo.sphere(0.24, 12, 8), toon(0xdff1ff));
  belly.scale.set(1.3, 0.5, 0.45); belly.position.set(0.02, -0.1, 0.03);
  const tail = mesh(geo.cone(0.22, 0.32, 3), 0x4a90d8, { outline: 0.016 });
  tail.rotation.z = PI / 2; tail.position.x = -0.55; tail.scale.z = 0.4;
  const eye = new T.Mesh(geo.circle(0.06, 12), basic(0x3a2838));
  eye.position.set(0.28, 0.06, 0.155);
  const eyeB = eye.clone(); eyeB.position.z = -0.155; eyeB.rotation.y = PI;
  const fin = mesh(geo.cone(0.12, 0.2, 3), 0x4a90d8, { outline: 0.012 });
  fin.position.set(-0.02, 0.27, 0); fin.scale.z = 0.4;
  g.add(body, belly, tail, eye, eyeB, fin);
  g.scale.setScalar(s);
  return g;
}

export function makeCookie(s = 1) {
  const g = new T.Group();
  const c = mesh(geo.cyl(0.3, 0.3, 0.1, 20), 0xd9a05b, { outline: 0.02 });
  c.rotation.x = PI / 2;
  for (const [x, y] of [[-0.12, 0.1], [0.1, 0.13], [0.03, -0.04], [-0.1, -0.13], [0.15, -0.1]]) {
    const chip = new T.Mesh(geo.sphere(0.045, 8, 6), toon(0x5a3420));
    chip.position.set(x, y, 0.05); chip.scale.z = 0.5;
    g.add(chip);
  }
  g.add(c);
  g.scale.setScalar(s);
  return g;
}

// lay: how the snack rests on a plate. held: tilt while carried. size: on-plate scale. gap: spacing on the plate.
export const SNACKS = {
  carrot: { make: () => makeCarrot(1), lay: [0, 0, 1.05], held: 0.3, size: 0.8, y: 0.3, gap: 0.5, plural: 'carrots' },
  apple: { make: () => makeApple(1.15), lay: [0, 0, 0], held: 0, size: 0.95, y: 0.4, gap: 0.62, plural: 'apples' },
  corn: { make: () => makeCorn(1.15), lay: [0, 0, 1.05], held: 0.3, size: 0.85, y: 0.3, gap: 0.5, plural: 'corn' },
  fish: { make: () => makeFish(1.2), lay: [0, 0, 0.6], held: 0.2, size: 0.85, y: 0.4, gap: 0.55, plural: 'fish' },
  cookie: { make: () => makeCookie(1.25), lay: [-0.35, 0, 0], held: 0, size: 0.95, y: 0.42, gap: 0.62, plural: 'cookies' },
};
export function makeSnack(kind) {
  const s = SNACKS[kind].make();
  s.userData.snack = kind;
  return s;
}

// ---------- bins ----------
function crate(wood, dark) {
  const g = new T.Group();
  const inside = mesh(geo.box(2.5, 0.86, 1.3), 0x5a3a20, { outline: 0 }); inside.position.y = 0.45;
  g.add(inside);
  for (const y of [0.2, 0.5, 0.8]) {
    for (const z of [-0.7, 0.7]) { const s = mesh(geo.box(2.72, 0.22, 0.1), wood, { hull: 1.025 }); s.position.set(0, y, z); g.add(s); }
    for (const x of [-1.33, 1.33]) { const s = mesh(geo.box(0.1, 0.22, 1.42), wood, { hull: 1.025 }); s.position.set(x, y, 0); g.add(s); }
  }
  for (const x of [-1.33, 1.33]) for (const z of [-0.7, 0.7]) {
    const p = mesh(geo.box(0.2, 1.0, 0.2), dark, { hull: 1.06 }); p.position.set(x, 0.5, z); g.add(p);
  }
  // a little hand-painted sign on the front
  const sign = mesh(geo.cyl(0.36, 0.36, 0.06, 24), 0xfff6e6, { outline: 0.018 });
  sign.rotation.x = PI / 2; sign.position.set(0, 0.5, 0.79);
  g.add(sign);
  g.userData.sign = new T.Vector3(0, 0.5, 0.86);
  g.userData.top = 0.9;
  return g;
}
function basket(col) {
  const g = new T.Group();
  const b = mesh(geo.cyl(1.35, 1.0, 0.95, 26), col, { outline: 0.03 }); b.position.y = 0.48;
  const dark = new T.Color(col).multiplyScalar(0.72).getHex();
  for (const y of [0.22, 0.48, 0.74]) {
    const r = mesh(geo.torus(1.0 + y * 0.37, 0.05, PI * 2, 6, 32), dark, { outline: 0 });
    r.rotation.x = PI / 2; r.position.y = y; g.add(r);
  }
  const rim = mesh(geo.torus(1.36, 0.1, PI * 2, 8, 32), dark, { outline: 0.02 }); rim.rotation.x = PI / 2; rim.position.y = 0.95;
  const inside = new T.Mesh(geo.circle(1.3, 26), toon(0x6b4424)); inside.rotation.x = -PI / 2; inside.position.y = 0.9;
  const handle = mesh(geo.torus(1.25, 0.07, PI, 6, 24), dark, { outline: 0.015 });
  handle.position.set(0, 0.95, -0.3); handle.rotation.x = -0.35;
  g.add(b, rim, inside, handle, blobShadow(1.4));
  g.userData.sign = new T.Vector3(0, 0.5, 1.2);
  g.userData.top = 0.95;
  return g;
}
function pail() {
  const g = makeBucket(0x4a90ff, 1.15, 1.0);
  g.userData = { sign: new T.Vector3(0, 0.5, 1.05), top: 0.85 };
  return g;
}

const BINS = {
  carrot: () => crate(0xd9a05b, 0xa86f3a),
  apple: () => basket(0xd9a85b),
  corn: () => crate(0xe2574a, 0xa8382c),
  fish: () => pail(),
  cookie: () => basket(0xff9fc0),
};
// A bin of snacks: a pile on top and one more on the sign, so the bin says what is inside.
export function makeBin(kind) {
  const g = BINS[kind]();
  const sp = SNACKS[kind];
  const top = g.userData.top;
  for (let i = 0; i < 6; i++) {
    const s = makeSnack(kind);
    const a = (i / 6) * PI * 2;
    s.position.set(Math.cos(a) * 0.65 * (i % 2 ? 1 : 0.5), top + 0.05 + (i % 2) * 0.08, Math.sin(a) * 0.3 - 0.05);
    s.rotation.set(sp.lay[0] + (i % 3) * 0.2, a, sp.lay[2] + (i % 2 ? 0.4 : -0.6));
    s.scale.multiplyScalar(0.7);
    g.add(s);
  }
  const icon = makeSnack(kind);
  icon.position.copy(g.userData.sign).add(new T.Vector3(0, 0, 0.05));
  icon.rotation.set(0, 0, sp.lay[2] * 0.7);
  icon.scale.multiplyScalar(0.55);
  g.add(icon);
  return g;
}

// ---------- plates ----------
const GOLD = new T.Color(0xffd23f);
export function makePlate(color, each, gap) {
  const g = new T.Group();
  const base = mesh(geo.cyl(1.0, 0.8, 0.12, 28), 0xffffff, { outline: 0.025 });
  base.position.y = 0.06;
  const rimMat = toonUnique(color);
  const rim = mesh(geo.torus(0.92, 0.07, PI * 2, 8, 32), color, { outline: 0.012, mat: rimMat });
  rim.rotation.x = PI / 2; rim.position.y = 0.13;
  const glowMat = new T.MeshBasicMaterial({ color: 0xfff27a, transparent: true, opacity: 0, depthWrite: false });
  const glow = new T.Mesh(geo.circle(1.45, 32), glowMat);
  glow.rotation.x = -PI / 2; glow.position.y = 0.025; glow.renderOrder = -1;
  g.add(glow, base, rim);
  // dotted rings: one empty spot for each snack this friend will get
  const slotMat = new T.MeshBasicMaterial({ color: 0x3a2838, transparent: true, opacity: 0.55, depthWrite: false });
  const slots = [];
  for (let i = 0; i < each; i++) {
    const r = new T.Mesh(geo.ring(0.16, 0.23, 24), slotMat);
    r.rotation.x = -PI / 2; r.position.set((i - (each - 1) / 2) * gap, 0.135, 0.05);
    g.add(r); slots.push(r);
  }
  g.userData = { rim, rimMat, glow, glowMat, slots, base: new T.Color(color), lit: 0 };
  return g;
}
// k: 0 = normal, 1 = fully lit gold.
export function lightPlate(p, k) {
  const u = p.userData;
  u.lit = k;
  u.rimMat.color.copy(u.base).lerp(GOLD, k);
  u.rimMat.emissive.copy(GOLD).multiplyScalar(k * 0.45);
  u.glowMat.opacity = k * 0.75;
}
