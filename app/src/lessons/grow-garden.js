// Grow a flower helpers: planters (a different pot or bed each round), the plant with its growth stages,
// and the bee / butterfly that visits the new bloom.
import * as T from '../three.js';
import { mesh, geo, toon, toonUnique, basic, blobShadow, ink } from '../engine/toon.js';
import { makeSeed } from '../engine/farm.js';

export const SOIL = 0x7a4a2c, WET_SOIL = 0x4a2a18;
const PETAL = { daisy: 0xffffff, tulip: 0xff4b6b, sunflower: 0xffd23f, rose: 0xff8fc0 };
const MID = { daisy: 0xffd23f, tulip: 0xffd23f, sunflower: 0x7a4a26, rose: 0xff5a9a };
export const petalColor = (k) => PETAL[k];

function soilDisc(r, y) {
  const s = mesh(geo.cyl(r, r, 0.12, 24), SOIL, { outline: 0.02, mat: toonUnique(SOIL) });
  s.position.y = y;
  return s;
}

// Every planter: origin on the ground, userData { soil (its soil mesh, darkens when watered), soilY (top of the soil) }.
export function makePlanter(kind) {
  const g = new T.Group();
  let soil, soilY;
  if (kind === 'mound') {
    soil = mesh(geo.sphere(1.2, 20, 12), SOIL, { outline: 0.03, mat: toonUnique(SOIL) }); soil.scale.set(1.3, 0.35, 1);
    soilY = 0.4;
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const st = mesh(geo.sphere(0.16, 8, 6), i % 2 ? 0xb7b2a6 : 0xd8d2c4, { outline: 0.012 });
      st.scale.set(1.2, 0.7, 1); st.position.set(Math.cos(a) * 1.6, 0.08, Math.sin(a) * 1.15);
      g.add(st);
    }
    g.add(soil);
  } else if (kind === 'pot' || kind === 'bluepot') {
    const col = kind === 'pot' ? 0xd9774a : 0x4a90ff, h = kind === 'pot' ? 1.0 : 0.8;
    const body = mesh(geo.cyl(0.78, 0.56, h, 22), col, { outline: 0.03 }); body.position.y = h / 2;
    const rim = mesh(geo.cyl(0.9, 0.9, 0.24, 22), col, { outline: 0.025 }); rim.position.y = h;
    g.add(body, rim);
    if (kind === 'bluepot') for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2, d = new T.Mesh(geo.sphere(0.08, 8, 6), toon(0xffffff));
      d.position.set(Math.sin(a) * 0.7, h * 0.45 + (i % 2) * 0.15, Math.cos(a) * 0.7); d.scale.z = 0.4; d.lookAt(0, d.position.y, 0); g.add(d);
    } else { const band = new T.Mesh(geo.cyl(0.74, 0.7, 0.1, 22), toon(0xffffff)); band.position.y = h * 0.55; band.scale.set(1.03, 1, 1.03); g.add(band); }
    soil = soilDisc(0.82, h + 0.06); soilY = h + 0.12;
    g.add(soil);
  } else if (kind === 'box') {
    const wood = 0xc98a50;
    const b = mesh(geo.box(2.4, 0.7, 1.3), wood, { hull: 1.03, outline: 0 }); b.position.y = 0.35;
    for (const y of [0.18, 0.5]) { const p = new T.Mesh(geo.box(2.42, 0.04, 1.32), toon(0xa0623a)); p.position.y = y; g.add(p); }
    soil = new T.Mesh(geo.box(2.2, 0.1, 1.1), toonUnique(SOIL)); soil.position.y = 0.68; soilY = 0.74;
    for (const x of [-0.8, 0.8]) { const f = mesh(geo.sphere(0.12, 8, 6), x < 0 ? 0xff8fc0 : 0xa77bff, { outline: 0.012 }); f.position.set(x, 0.85, 0.2); g.add(f); }
    g.add(b, soil);
  } else if (kind === 'boot') {
    const col = 0xff5a5a;
    const leg = mesh(geo.cyl(0.6, 0.58, 1.2, 20), col, { outline: 0.03 }); leg.position.y = 0.6;
    const foot = mesh(geo.sphere(0.6, 18, 12), col, { outline: 0.03 }); foot.scale.set(1.5, 0.5, 0.95); foot.position.set(0.5, 0.28, 0.05);
    const sole = new T.Mesh(geo.box(1.95, 0.1, 1.1), toon(0x3a2838)); sole.position.set(0.3, 0.05, 0);
    const cuff = mesh(geo.cyl(0.66, 0.66, 0.16, 20), 0xffd23f, { outline: 0.02 }); cuff.position.y = 1.2;
    g.add(leg, foot, sole, cuff);
    soil = soilDisc(0.56, 1.22); soilY = 1.28;
    g.add(soil);
  } else if (kind === 'tub') {
    const col = 0xb9c4cc;
    const body = mesh(geo.cyl(0.95, 0.8, 0.8, 24), col, { outline: 0.03 }); body.position.y = 0.4;
    for (const y of [0.15, 0.62]) { const r = mesh(geo.torus(0.88 + y * 0.1, 0.035, Math.PI * 2, 6, 28), 0x9aa6ae, { outline: 0 }); r.rotation.x = Math.PI / 2; r.position.y = y; g.add(r); }
    for (const s of [-1, 1]) { const h = mesh(geo.torus(0.18, 0.04, Math.PI, 6, 12), 0x9aa6ae, { outline: 0.01 }); h.position.set(s * 0.98, 0.65, 0); h.rotation.y = Math.PI / 2; g.add(h); }
    g.add(body);
    soil = soilDisc(0.9, 0.78); soilY = 0.84;
    g.add(soil);
  } else { // a giant teacup
    const saucer = mesh(geo.cyl(1.35, 1.1, 0.12, 26), 0xfff6e6, { outline: 0.02 }); saucer.position.y = 0.06;
    const cup = mesh(geo.cyl(0.95, 0.62, 0.95, 24), 0xfff6e6, { outline: 0.03 }); cup.position.y = 0.6;
    const band = new T.Mesh(geo.cyl(0.9, 0.86, 0.12, 24), toon(0x4a90ff)); band.position.y = 0.85; band.scale.set(1.03, 1, 1.03);
    const handle = mesh(geo.torus(0.3, 0.08, Math.PI * 2, 8, 16), 0xfff6e6, { outline: 0.015 }); handle.position.set(1.0, 0.65, 0);
    for (let i = 0; i < 5; i++) { const d = new T.Mesh(geo.sphere(0.07, 8, 6), toon(0xff8fc0)); const a = -0.9 + i * 0.45; d.position.set(Math.sin(a) * 0.79, 0.45, Math.cos(a) * 0.79); d.scale.z = 0.4; d.lookAt(0, 0.45, 0); g.add(d); }
    g.add(saucer, cup, band, handle);
    soil = soilDisc(0.9, 1.04); soilY = 1.1;
    g.add(soil);
  }
  g.add(blobShadow(1.3));
  g.userData = { soil, soilY, kind };
  return g;
}

function makeBloom(kind) {
  const g = new T.Group();
  const col = PETAL[kind], mid = MID[kind];
  const petals = [];
  let faceZ = 0.14, faceY = 0, faceK = 1;
  if (kind === 'tulip') {
    for (let i = 0; i < 3; i++) {
      const p = mesh(geo.sphere(0.3, 14, 10), col, { outline: 0.02 });
      p.scale.set(0.7, 1.2, 0.6); const a = (i / 3) * Math.PI * 2 + Math.PI / 2;
      p.position.set(Math.cos(a) * 0.15, 0.25, Math.sin(a) * 0.15);
      g.add(p); petals.push(p);
    }
    faceZ = 0.36; faceY = 0.22; faceK = 0.8;
  } else {
    const n = kind === 'sunflower' ? 12 : kind === 'rose' ? 7 : 9, r = kind === 'sunflower' ? 0.55 : 0.4;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const p = mesh(geo.sphere(0.2, 12, 8), col, { outline: 0.015 });
      p.scale.set(0.6, 1.3, 0.35); p.position.set(Math.cos(a) * r, Math.sin(a) * r, 0); p.rotation.z = a - Math.PI / 2;
      g.add(p); petals.push(p);
    }
    const d = mesh(geo.sphere(kind === 'sunflower' ? 0.36 : 0.24, 14, 10), mid, { outline: 0.02 }); d.scale.z = 0.5; d.position.z = 0.06;
    g.add(d);
    faceK = kind === 'sunflower' ? 1.3 : 0.95;
    faceZ = (kind === 'sunflower' ? 0.36 : 0.24) * 0.5 + 0.07; // just in front of the centre disc
  }
  // a happy little face
  const face = new T.Group(); face.position.set(0, faceY, faceZ); face.scale.setScalar(faceK);
  const eyes = [];
  for (const s of [-1, 1]) { const e = ink(geo.sphere(0.045, 8, 6)); e.position.set(s * 0.08, 0.04, 0); e.scale.set(1, 1.3, 0.5); face.add(e); eyes.push(e); }
  const smile = ink(geo.torus(0.07, 0.018, Math.PI, 4, 10)); smile.rotation.z = Math.PI; smile.position.y = -0.03; face.add(smile);
  for (const s of [-1, 1]) { const c = new T.Mesh(geo.sphere(0.035, 8, 6), basic(0xff8fa8)); c.position.set(s * 0.15, -0.02, 0); c.scale.z = 0.4; face.add(c); }
  g.add(face);
  g.userData = { petals, face, eyes };
  return g;
}

// Plant on top of the soil. Stage 1 seed, stage 2 stem + leaves + bud, stage 3 bloom.
export const STEM_H = { sprout: 0.75, bloom: 1.5 };
export function makePlant(kind) {
  const g = new T.Group();
  const seed = makeSeed(); seed.position.y = 0.05; seed.visible = false;
  const stemG = new T.Group(); stemG.visible = false;
  const stem = mesh(geo.cyl(0.07, 0.09, 1, 8), 0x4f9e3a, { outline: 0.015 });
  stemG.add(stem);
  const leaves = [];
  for (const [s, y] of [[-1, 0.28], [1, 0.5]]) {
    const pivot = new T.Group(); pivot.position.y = y;
    const l = mesh(geo.sphere(0.24, 12, 8), 0x58c45e, { outline: 0.015 });
    l.scale.set(1.6, 0.35, 0.8); l.position.x = s * 0.34;
    const vein = new T.Mesh(geo.box(0.4, 0.02, 0.02), basic(0x3f8f2e)); vein.position.set(s * 0.32, 0.07, 0.1);
    pivot.add(l, vein);
    pivot.userData.s = s;
    pivot.rotation.z = s * 1.45; pivot.scale.setScalar(0.001); // folded up and tiny until it unfurls
    stemG.add(pivot); leaves.push(pivot);
  }
  const top = new T.Group(); stemG.add(top);
  const bud = new T.Group();
  const budBody = mesh(geo.sphere(0.2, 12, 10), 0x58b43a, { outline: 0.018 }); budBody.scale.set(0.8, 1.15, 0.8); budBody.position.y = 0.16;
  const tip = mesh(geo.sphere(0.12, 10, 8), PETAL[kind] === 0xffffff ? 0xfff6e6 : PETAL[kind], { outline: 0.012 }); tip.scale.set(0.8, 1.2, 0.8); tip.position.y = 0.33;
  bud.add(tip, budBody); bud.visible = false;
  const bloom = makeBloom(kind); bloom.position.set(0, 0.25, 0.05); bloom.visible = false;
  top.add(bud, bloom);
  g.add(seed, stemG);
  g.userData = { seed, stemG, stem, leaves, top, bud, bloom, kind, stage: 0, h: 0 };
  setStem(g, 0.001);
  return g;
}
export function setStem(plant, h) {
  const u = plant.userData;
  u.h = h;
  u.stem.scale.y = Math.max(0.001, h); u.stem.position.y = h / 2;
  u.top.position.y = h;
  u.leaves[0].position.y = Math.min(0.28, h * 0.4);
  u.leaves[1].position.y = Math.min(0.5, h * 0.7);
}

// ---- visitors ----
export function makeBee() {
  const b = new T.Group();
  const body = mesh(geo.sphere(0.2, 12, 8), 0xffd23f, { outline: 0.02 }); body.scale.set(1.3, 1, 1);
  const stripe = mesh(geo.cyl(0.205, 0.205, 0.07, 12), 0x3a2838, { outline: 0 }); stripe.rotation.z = Math.PI / 2;
  const stripe2 = stripe.clone(); stripe2.position.x = -0.12; stripe2.scale.set(0.85, 1, 0.85);
  const eye = ink(geo.sphere(0.04, 6, 4)); eye.position.set(0.2, 0.06, 0.12);
  const wings = [];
  for (const s of [-1, 1]) { const w = new T.Mesh(geo.sphere(0.14, 8, 6), basic(0xffffff, { transparent: true, opacity: 0.85 })); w.scale.set(0.6, 1, 0.3); w.position.set(0, 0.2, s * 0.08); b.add(w); wings.push(w); }
  b.add(body, stripe, stripe2, eye);
  b.userData = { wings, kind: 'bee' };
  return b;
}
export function makeButterfly(col = 0xa77bff) {
  const b = new T.Group();
  const wings = [];
  for (const s of [-1, 1]) {
    const w = new T.Group();
    const up = mesh(geo.sphere(0.24, 10, 8), col, { outline: 0.012 }); up.scale.set(1, 0.12, 0.85); up.position.set(s * 0.24, 0, -0.08);
    const lo = mesh(geo.sphere(0.16, 10, 8), 0xffd23f, { outline: 0.01 }); lo.scale.set(1, 0.12, 0.8); lo.position.set(s * 0.18, 0, 0.18);
    w.add(up, lo); b.add(w); wings.push(w);
  }
  const body = mesh(geo.cyl(0.04, 0.04, 0.4, 6), 0x3a2838, { outline: 0 }); body.rotation.x = Math.PI / 2;
  b.add(body);
  b.userData = { wings, kind: 'butterfly' };
  return b;
}
