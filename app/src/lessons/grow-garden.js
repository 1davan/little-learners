// Grow a flower helpers: planters (a different pot or bed each round), the plant with its growth stages,
// and the bee / butterfly that visits the new bloom.
import * as T from '../three.js';
import { mesh, geo, toon, toonUnique, basic, blobShadow, ink } from '../engine/toon.js';
import { makeSeed, stillProp, makeCarrot } from '../engine/farm.js';
import { propModel } from '../engine/prop-models.js';

export const SOIL = 0x7a4a2c, WET_SOIL = 0x4a2a18;
const PETAL = { daisy: 0xffffff, tulip: 0xff4b6b, sunflower: 0xffd23f, rose: 0xff8fc0 };
const MID = { daisy: 0xffd23f, tulip: 0xffd23f, sunflower: 0x7a4a26, rose: 0xff5a9a };
export const petalColor = (k) => PETAL[k];

// the soil: a lumpy Blender soil top (tinted, so watering can darken it) or a code disc. Returns the group to add and
// the mesh whose material colour darkens.
function soilTop(g, r, y, sz = r) {
  const pm = propModel('prop_soiltop', { tint: SOIL, size: [r, 1, sz] });
  if (pm) { stillProp(pm); pm.position.y = y - 0.08; g.add(pm); return pm.userData.model.userData.skin; }
  const s = mesh(geo.cyl(r, r, 0.12, 24), SOIL, { outline: 0.02, mat: toonUnique(SOIL) });
  s.scale.z = sz / r;
  s.position.y = y; g.add(s);
  return s;
}
function planterModel(g, kind, opts) {
  const pm = propModel(kind, opts);
  if (pm) { stillProp(pm); g.add(pm); }
  return pm;
}

// Every planter: origin on the ground, userData { soil (its soil mesh, darkens when watered), soilY (top of the soil) }.
export function makePlanter(kind) {
  const g = new T.Group();
  let soil, soilY;
  if (kind === 'mound' && planterModel(g, 'prop_soilmound', { tint: SOIL, size: [0.85, 0.95, 0.88] })) {
    soil = g.children[0].userData.model.userData.skin; soilY = 0.4;
  } else if (kind === 'mound') {
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
    const pm = propModel('prop_pot', { tint: col, size: [0.9, (h + 0.12) / 1.3, 0.9] }); // Blender flowerpot, same rim height
    if (pm) stillProp(pm);
    g.add(...(pm ? [pm] : [body, rim]));
    if (kind === 'bluepot') for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2, d = new T.Mesh(geo.sphere(0.08, 8, 6), toon(0xffffff));
      d.position.set(Math.sin(a) * 0.7, h * 0.45 + (i % 2) * 0.15, Math.cos(a) * 0.7); d.scale.z = 0.4; d.lookAt(0, d.position.y, 0); g.add(d);
    } else { const band = new T.Mesh(geo.cyl(0.74, 0.7, 0.1, 22), toon(0xffffff)); band.position.y = h * 0.55; band.scale.set(1.03, 1, 1.03); if (!pm) g.add(band); }
    soil = soilTop(g, 0.8, h + 0.06); soilY = h + 0.12;
  } else if (kind === 'box' && planterModel(g, 'prop_planterbox')) {
    soil = soilTop(g, 1.1, 0.66, 0.56); soilY = 0.74;
  } else if (kind === 'box') {
    const wood = 0xc98a50;
    const b = mesh(geo.box(2.4, 0.7, 1.3), wood, { hull: 1.03, outline: 0 }); b.position.y = 0.35;
    for (const y of [0.18, 0.5]) { const p = new T.Mesh(geo.box(2.42, 0.04, 1.32), toon(0xa0623a)); p.position.y = y; g.add(p); }
    soil = new T.Mesh(geo.box(2.2, 0.1, 1.1), toonUnique(SOIL)); soil.position.y = 0.68; soilY = 0.74;
    for (const x of [-0.8, 0.8]) { const f = mesh(geo.sphere(0.12, 8, 6), x < 0 ? 0xff8fc0 : 0xa77bff, { outline: 0.012 }); f.position.set(x, 0.85, 0.2); g.add(f); }
    g.add(b, soil);
  } else if (kind === 'boot' && planterModel(g, 'prop_welly')) {
    soil = soilTop(g, 0.56, 1.27); soilY = 1.3;
  } else if (kind === 'boot') {
    const col = 0xff5a5a;
    const leg = mesh(geo.cyl(0.6, 0.58, 1.2, 20), col, { outline: 0.03 }); leg.position.y = 0.6;
    const foot = mesh(geo.sphere(0.6, 18, 12), col, { outline: 0.03 }); foot.scale.set(1.5, 0.5, 0.95); foot.position.set(0.5, 0.28, 0.05);
    const sole = new T.Mesh(geo.box(1.95, 0.1, 1.1), toon(0x3a2838)); sole.position.set(0.3, 0.05, 0);
    const cuff = mesh(geo.cyl(0.66, 0.66, 0.16, 20), 0xffd23f, { outline: 0.02 }); cuff.position.y = 1.2;
    g.add(leg, foot, sole, cuff);
    soil = soilTop(g, 0.56, 1.22); soilY = 1.28;
  } else if (kind === 'tub' && planterModel(g, 'prop_metaltub')) {
    soil = soilTop(g, 0.9, 0.86); soilY = 0.88;
  } else if (kind === 'tub') {
    const col = 0xb9c4cc;
    const body = mesh(geo.cyl(0.95, 0.8, 0.8, 24), col, { outline: 0.03 }); body.position.y = 0.4;
    for (const y of [0.15, 0.62]) { const r = mesh(geo.torus(0.88 + y * 0.1, 0.035, Math.PI * 2, 6, 28), 0x9aa6ae, { outline: 0 }); r.rotation.x = Math.PI / 2; r.position.y = y; g.add(r); }
    for (const s of [-1, 1]) { const h = mesh(geo.torus(0.18, 0.04, Math.PI, 6, 12), 0x9aa6ae, { outline: 0.01 }); h.position.set(s * 0.98, 0.65, 0); h.rotation.y = Math.PI / 2; g.add(h); }
    g.add(body);
    soil = soilTop(g, 0.9, 0.78); soilY = 0.84;
  } else if (planterModel(g, 'prop_teacup')) { // a giant teacup
    soil = soilTop(g, 0.92, 1.12); soilY = 1.14;
  } else { // a giant teacup
    const saucer = mesh(geo.cyl(1.35, 1.1, 0.12, 26), 0xfff6e6, { outline: 0.02 }); saucer.position.y = 0.06;
    const cup = mesh(geo.cyl(0.95, 0.62, 0.95, 24), 0xfff6e6, { outline: 0.03 }); cup.position.y = 0.6;
    const band = new T.Mesh(geo.cyl(0.9, 0.86, 0.12, 24), toon(0x4a90ff)); band.position.y = 0.85; band.scale.set(1.03, 1, 1.03);
    const handle = mesh(geo.torus(0.3, 0.08, Math.PI * 2, 8, 16), 0xfff6e6, { outline: 0.015 }); handle.position.set(1.0, 0.65, 0);
    for (let i = 0; i < 5; i++) { const d = new T.Mesh(geo.sphere(0.07, 8, 6), toon(0xff8fc0)); const a = -0.9 + i * 0.45; d.position.set(Math.sin(a) * 0.79, 0.45, Math.cos(a) * 0.79); d.scale.z = 0.4; d.lookAt(0, 0.45, 0); g.add(d); }
    g.add(saucer, cup, band, handle);
    soil = soilTop(g, 0.9, 1.04); soilY = 1.1;
  }
  g.add(blobShadow(1.3));
  const SOIL_R = { mound: 1.0, pot: 0.74, bluepot: 0.74, box: 0.55, boot: 0.5, tub: 0.82, teacup: 0.82 };
  g.userData = { soil, soilY, kind, soilR: SOIL_R[kind] || 0.7 };
  return g;
}

// The Blender bloom: one model per flower, every petal on its own bone (scaled to unfurl them one by one), a code face.
function makeBloom(kind) {
  const pm = propModel('prop_bloom_' + kind);
  if (pm) {
    stillProp(pm);
    const m = pm.userData.model, b = m.userData.bones;
    const petals = Object.keys(b).filter((n) => /^petal\d+$/.test(n)).sort((x, y) => x.slice(5) - y.slice(5)).map((n) => b[n]);
    const face = m.userData.face;
    pm.userData = { ...pm.userData, petals, face, eyes: face ? face.userData.eyes : [], eyeY: 1 };
    return pm;
  }
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
  const stem = mesh(geo.cyl(0.06, 0.085, 1, 12), 0x4fa83a, { outline: 0.016 });
  stemG.add(stem);
  const leaves = [];
  for (const [s, y] of [[-1, 0.28], [1, 0.5]]) {
    const pivot = new T.Group(); pivot.position.y = y;
    const pl = propModel('prop_growleaf');
    if (pl) { stillProp(pl); pl.rotation.y = s > 0 ? 0 : Math.PI; pl.position.x = s * 0.03; pivot.add(pl); }
    else {
      const l = mesh(geo.sphere(0.24, 12, 8), 0x58c45e, { outline: 0.015 });
      l.scale.set(1.6, 0.35, 0.8); l.position.x = s * 0.34;
      const vein = new T.Mesh(geo.box(0.4, 0.02, 0.02), basic(0x3f8f2e)); vein.position.set(s * 0.32, 0.07, 0.1);
      pivot.add(l, vein);
    }
    pivot.userData.s = s;
    pivot.rotation.z = s * 1.45; pivot.scale.setScalar(0.001); // folded up and tiny until it unfurls
    stemG.add(pivot); leaves.push(pivot);
  }
  const top = new T.Group(); stemG.add(top);
  const bud = new T.Group();
  const pb = propModel('prop_growbud', { tint: PETAL[kind] === 0xffffff ? 0xfff6e6 : PETAL[kind] });
  if (pb) { stillProp(pb); pb.position.y = -0.04; bud.add(pb); }
  const budBody = mesh(geo.sphere(0.2, 12, 10), 0x58b43a, { outline: 0.018 }); budBody.scale.set(0.8, 1.15, 0.8); budBody.position.y = 0.16;
  const tip = mesh(geo.sphere(0.12, 10, 8), PETAL[kind] === 0xffffff ? 0xfff6e6 : PETAL[kind], { outline: 0.012 }); tip.scale.set(0.8, 1.2, 0.8); tip.position.y = 0.33;
  if (!pb) bud.add(tip, budBody);
  bud.visible = false;
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
  const pm = propModel('prop_farmbee');
  if (pm) { // the Blender bee: stripy, big eyes, its wings on bones wingL / wingR (rotation.x flaps them)
    stillProp(pm);
    const bn = pm.userData.bones;
    pm.userData = { ...pm.userData, wings: [bn.wingL, bn.wingR].filter(Boolean), kind: 'bee' };
    return pm;
  }
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

// ---- seeds: a different kind each level (one big seed, three striped sunflower seeds, two speckled beans) ----
export const SEED_KINDS = [
  { n: 1, col: 0x7a4a26, r: 0.16, sx: 0.8, sy: 1.15 },
  { n: 3, col: 0x3a2838, stripe: 0xfff6e6, r: 0.11, sx: 0.7, sy: 1.4 },
  { n: 2, col: 0xd9774a, spot: 0x8a3b2e, r: 0.14, sx: 1.25, sy: 0.85 },
];
const SEED_MODEL = ['prop_farmseed', 'prop_sunseed', 'prop_bean'];
export function makeLevelSeed(level) {
  const k = SEED_KINDS[level];
  const pm = propModel(SEED_MODEL[level], { size: level === 0 ? 0.85 : 0.75 });
  if (pm) { stillProp(pm); pm.userData.r = k.r; return pm; }
  const s = mesh(geo.sphere(k.r, 12, 10), k.col, { outline: 0.014 });
  s.scale.set(k.sx, k.sy, k.sx);
  if (k.stripe) for (const x of [-0.04, 0.04]) { const st = new T.Mesh(geo.box(0.02, k.r * 1.6, 0.02), basic(k.stripe)); st.position.set(x, 0, k.r * 0.95); s.add(st); }
  if (k.spot) for (const [x, y] of [[-0.05, 0.03], [0.06, -0.02], [0, 0.07]]) { const d = new T.Mesh(geo.sphere(0.025, 6, 4), basic(k.spot)); d.position.set(x, y, k.r * 0.95); s.add(d); }
  s.userData.r = k.r;
  return s;
}

// ---- the garden: a different place each level ----
export const CAN_COLS = [0x4a90ff, 0x5fd068, 0xff8a3a];
export function makeGardenSet(level) {
  const g = new T.Group();
  if (level === 0) {
    // the back garden: a white picket fence and a wheelbarrow
    for (let i = 0; i < 22; i++) {
      const x = -9 + i * 0.85;
      const p = mesh(geo.box(0.32, 1.3, 0.1), 0xfff6e6, { hull: 1.05 }); p.position.set(x, 0.65, -4.2);
      const tip = mesh(geo.cone(0.23, 0.25, 4), 0xfff6e6, { outline: 0.01 }); tip.rotation.y = Math.PI / 4; tip.position.set(x, 1.42, -4.2);
      g.add(p, tip);
    }
    for (const y of [0.4, 1.0]) { const r = mesh(geo.box(19, 0.12, 0.06), 0xfff6e6, { hull: 1.02 }); r.position.set(0, y, -4.27); g.add(r); }
    const wbm = propModel('prop_wheelbarrow', { size: 1.05 });
    if (wbm) { stillProp(wbm); wbm.position.set(7.4, 0, -0.6); wbm.rotation.y = -0.6; g.add(wbm); }
    const wb = new T.Group(); wb.position.set(7.4, 0, -0.6); wb.rotation.y = -0.6;
    const tray = mesh(geo.cyl(0.9, 0.6, 0.6, 4), 0x5fd068, { hull: 1.04 }); tray.rotation.y = Math.PI / 4; tray.scale.set(1.3, 1, 0.8); tray.position.y = 0.9;
    const wheel = mesh(geo.cyl(0.35, 0.35, 0.14, 14), 0x3a2838, { outline: 0.015 }); wheel.rotation.x = Math.PI / 2; wheel.position.set(1.1, 0.35, 0);
    for (const z of [-0.35, 0.35]) { const h = mesh(geo.cyl(0.05, 0.05, 1.6, 6), 0xa86f3a, { outline: 0.01 }); h.rotation.z = Math.PI / 2 - 0.25; h.position.set(-0.6, 0.85, z); wb.add(h); const leg = mesh(geo.cyl(0.05, 0.05, 0.6, 6), 0xa86f3a, { outline: 0.01 }); leg.position.set(-0.6, 0.3, z); wb.add(leg); }
    const soil = new T.Mesh(geo.sphere(0.7, 12, 8), toon(SOIL)); soil.scale.set(1.3, 0.35, 0.75); soil.position.y = 1.15;
    wb.add(tray, wheel, soil);
    if (!wbm) g.add(wb);
  } else if (level === 1) {
    // the vegetable patch: rows of cabbages and carrots, and a bean-pole teepee
    // two little patches either side of the planter, in front of the flower bed
    for (const [cx, w] of [[-3.75, 3.3], [4.9, 3.4]]) for (let r = 0; r < 2; r++) { // (clear of Pip on the left)
      const z = -0.2 - r * 1.1;
      const row = new T.Mesh(geo.box(w, 0.06, 0.8), toon(0x8a5a3b)); row.position.set(cx, 0.03, z); g.add(row);
      const n = Math.floor(w / 0.85);
      for (let i = 0; i < n; i++) {
        const x = cx - w / 2 + 0.45 + i * 0.85;
        const cab = r === 1 && propModel('prop_farmcabbage', { size: 0.9 });
        if (cab) { stillProp(cab); cab.position.set(x, 0.03, z); cab.rotation.y = i * 1.7; g.add(cab); }
        else if (r === 0 && propModel('prop_carrot')) {
          // carrots growing in the row: just the orange shoulder and the leafy top show above the soil
          const c = makeCarrot(0.62); c.position.set(x, -0.18, z); c.rotation.set(0.05 * (i % 3 - 1), i * 1.3, 0.08 * ((i % 2) * 2 - 1)); g.add(c);
        }
        else if (r === 1) { const c = mesh(geo.sphere(0.36, 12, 10), 0x7cc95c, { outline: 0.016 }); c.scale.y = 0.75; c.position.set(x, 0.28, z); const c2 = mesh(geo.sphere(0.24, 10, 8), 0xa6e07a, { outline: 0.01 }); c2.position.set(x, 0.45, z + 0.06); g.add(c, c2); }
        else { for (const s2 of [-1, 0, 1]) { const l = mesh(geo.sphere(0.1, 8, 6), 0x4fb84a, { outline: 0.008 }); l.scale.set(0.6, 2.5, 0.6); l.position.set(x + s2 * 0.09, 0.28, z); l.rotation.z = -s2 * 0.4; g.add(l); } const top = mesh(geo.sphere(0.11, 8, 6), 0xff8a2a, { outline: 0.008 }); top.position.set(x, 0.06, z); g.add(top); }
      }
    }
    const tp = new T.Group(); tp.position.set(7.9, 0, -2.2);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const pole = mesh(geo.cyl(0.05, 0.06, 3.4, 6), 0xa86f3a, { outline: 0.01 }); pole.position.set(Math.cos(a) * 0.45, 1.6, Math.sin(a) * 0.45); pole.rotation.set(Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25); tp.add(pole);
      for (let j = 0; j < 4; j++) { const lf = mesh(geo.sphere(0.13, 8, 6), 0x58c45e, { outline: 0.008 }); lf.scale.set(1.3, 0.5, 0.8); lf.position.set(Math.cos(a) * (0.62 - j * 0.12), 0.5 + j * 0.7, Math.sin(a) * (0.62 - j * 0.12)); tp.add(lf); }
    }
    g.add(tp);
  } else {
    // a greenhouse: glass panes behind and a potting shelf with tiny seedlings
    const glass = new T.MeshBasicMaterial({ color: 0xcdeeff, transparent: true, opacity: 0.35, depthWrite: false });
    const back = new T.Mesh(new T.PlaneGeometry(18, 4.2), glass); back.position.set(0, 2.1, -4.4); g.add(back);
    const roof = new T.Mesh(new T.PlaneGeometry(18, 2.4), glass); roof.position.set(0, 4.8, -3.6); roof.rotation.x = -0.9; g.add(roof);
    for (let i = 0; i <= 9; i++) { const st = mesh(geo.box(0.12, 4.3, 0.12), 0xfff6e6, { hull: 1.06 }); st.position.set(-9 + i * 2, 2.15, -4.38); g.add(st); const rs = mesh(geo.box(0.1, 0.1, 2.5), 0xfff6e6, { hull: 1.06 }); rs.position.set(-9 + i * 2, 4.8, -3.6); rs.rotation.x = -0.9 + Math.PI / 2; g.add(rs); }
    for (const y of [0.06, 4.25]) { const b = mesh(geo.box(18.2, 0.14, 0.14), 0xfff6e6, { hull: 1.04 }); b.position.set(0, y, -4.38); g.add(b); }
    const shelf = mesh(geo.box(6, 0.12, 0.8), 0xc98a50, { hull: 1.03 }); shelf.position.set(4.5, 1.1, -3.8); g.add(shelf);
    for (const x of [1.7, 7.3]) { const l = mesh(geo.box(0.12, 1.1, 0.7), 0xa86f3a, { hull: 1.04 }); l.position.set(x, 0.55, -3.8); g.add(l); }
    for (let i = 0; i < 6; i++) {
      const x = 2.2 + i * 0.95;
      const p = mesh(geo.cyl(0.24, 0.18, 0.32, 12), 0xd9774a, { outline: 0.012 }); p.position.set(x, 1.32, -3.75); g.add(p);
      const sp = mesh(geo.sphere(0.1, 8, 6), 0x5cc45a, { outline: 0.008 }); sp.scale.set(1.5, 0.5, 0.8); sp.position.set(x, 1.6, -3.75); g.add(sp);
    }
  }
  return g;
}
