// Props for Big and small: the things being compared (per level: meadow animals, toys, garden harvest),
// little scatter props that live in the physics world, and per-level stage dressing.
// Every builder returns a Group. userData.phys says how it joins the physics world:
//   'ball' — origin at the centre, collider radius userData.r (× scale)
//   'box'  — origin at the bottom
//   null   — animated by tweens only (characters, plants)
import * as T from '../three.js';
import { mesh, geo, basic, blobShadow, toon } from '../engine/toon.js';
import { C, makeAnimal } from '../engine/actors.js';
import { makeTree, makeSunflower } from '../engine/scenery.js';
import { makeBeachBall, makeDuck } from '../engine/beach.js';
import { makeDrum, makeCarrot } from '../engine/farm.js';
import { propModel } from '../engine/prop-models.js';
import { toonUnique } from '../engine/toon.js';
import { prop } from './view-tools.js';

// A Blender prop inside a plain group (the game scales / tweens the group; the model keeps its own fit).
function wrapped(kind, opts, scale = 1, y = 0) {
  const pm = prop(kind, opts);
  if (!pm) return null;
  pm.scale.setScalar(scale); pm.position.y = y;
  const g = new T.Group(); g.add(pm); g.userData.pm = pm;
  return g;
}
function layerTint(w, name, col) { const l = w && w.userData.layers[name]; if (l) l.mesh.material = toonUnique(col, { vertexColors: true }); }

export const ANIMALS = new Set(['elephant', 'bunny', 'frog', 'bear', 'cat', 'hedgehog', 'pig', 'duck']);
export const PLANTS = new Set(['tree', 'sunflower', 'mushroom', 'carrot']);

export const NOUN = {
  elephant: 'elephant', bunny: 'bunny', frog: 'frog', bear: 'bear', cat: 'kitty', hedgehog: 'hedgehog', pig: 'piggy',
  ball: 'ball', beachball: 'beach ball', tower: 'tower', gift: 'present', duck: 'duck', drum: 'drum',
  tree: 'tree', pumpkin: 'pumpkin', sunflower: 'flower', mushroom: 'mushroom', watermelon: 'melon', carrot: 'carrot',
};
export const ICON = {
  elephant: '🐘', bunny: '🐰', frog: '🐸', bear: '🐻', cat: '🐱', hedgehog: '🦔', pig: '🐷',
  ball: '⚽', beachball: '🏐', tower: '🧱', gift: '🎁', duck: '🦆', drum: '🥁',
  tree: '🌳', pumpkin: '🎃', sunflower: '🌻', mushroom: '🍄', watermelon: '🍉', carrot: '🥕',
};

function ball(col = C.red, band = C.yellow) {
  const w = wrapped('prop_m_toyball', { tint: col, hide: ['dots'], face: false }, 1 / 0.44);
  if (w) {
    if (band !== 0xffffff) { layerTint(w.userData.pm, 'band', band); layerTint(w.userData.pm, 'star', band); }
    w.userData.phys = 'ball'; w.userData.r = 1;
    return w;
  }
  const g = new T.Group();
  const b = mesh(geo.sphere(1, 24, 18), col, { outline: 0.035 });
  const stripe = mesh(geo.torus(1.0, 0.12, Math.PI * 2, 8, 36), band, { outline: 0 });
  stripe.rotation.y = Math.PI / 2;
  const stripe2 = mesh(geo.torus(1.0, 0.12, Math.PI * 2, 8, 36), band, { outline: 0 });
  stripe2.rotation.x = Math.PI / 2;
  const hi = new T.Mesh(geo.sphere(0.18, 8, 6), basic(0xffffff));
  hi.position.set(-0.4, 0.45, 0.75);
  g.add(b, stripe, stripe2, hi);
  g.userData.phys = 'ball'; g.userData.r = 1;
  return g;
}

function beachball(slot = 0) {
  const w = wrapped('prop_m_beachball', { tint: [C.red, C.blue, 0xffc800][slot % 3] }, 1 / 0.45);
  if (w) { w.userData.pm.rotation.x = 0.3; w.userData.phys = 'ball'; w.userData.r = 1; return w; }
  const g = new T.Group();
  const b = makeBeachBall(1, [C.red, C.yellow, C.blue]);
  b.rotation.x = 0;
  g.add(b);
  g.userData.phys = 'ball'; g.userData.r = 1;
  return g;
}

const BLOCK_COLS = [C.red, C.yellow, C.blue, C.green, C.purple, 0xff8a2a];
function tower(n = 3, seed = 0) {
  const g = new T.Group();
  const blocks = [];
  for (let i = 0; i < n; i++) {
    const s = 1.1 - i * 0.08;
    const pb = prop('prop_m_block', { tint: BLOCK_COLS[(i + seed) % BLOCK_COLS.length], size: [s / 0.78, s * 0.85 / 0.78, s / 0.78] });
    if (pb) {
      // Blender toy block (its painted star / circle stickers replace the dot)
      const b = new T.Group(); b.add(pb);
      let y = 0; for (let k = 0; k < i; k++) y += (1.1 - k * 0.08) * 0.85;
      b.position.set(0, y + s * 0.425, 0);
      b.rotation.y = (i % 2 ? 0.25 : -0.15);
      blocks.push(b); g.add(b);
      continue;
    }
    const b = mesh(geo.box(s, s * 0.85, s), BLOCK_COLS[(i + seed) % BLOCK_COLS.length], { hull: 1.05 });
    let y = 0; for (let k = 0; k < i; k++) y += (1.1 - k * 0.08) * 0.85;
    b.position.set(0, y + s * 0.425, 0);
    b.rotation.y = (i % 2 ? 0.25 : -0.15);
    // a dot on the front so blocks read as toys
    const dot = new T.Mesh(geo.circle(s * 0.22, 16), basic(0xffffff));
    dot.position.z = s / 2 + 0.01;
    b.add(dot);
    blocks.push(b);
    g.add(b);
  }
  g.add(blobShadow(0.9));
  g.userData.blocks = blocks;
  return g;
}

function gift(col = C.purple, ribbon = C.yellow) {
  const gb = prop('prop_m_giftbox', { tint: col, size: [1.6, 1.62, 1.6] });
  if (gb) {
    const g = new T.Group();
    layerTint(gb, 'ribbon', ribbon);
    const lid = new T.Group();
    lid.position.y = 1.42;
    const lm = prop('prop_m_giftlid', { tint: col, size: 1.6 });
    layerTint(lm, 'ribbon', ribbon);
    lid.add(lm);
    g.add(gb, lid, blobShadow(1.1));
    g.userData.lid = lid;
    g.userData.phys = 'box';
    return g;
  }
  const g = new T.Group();
  const box = mesh(geo.box(1.6, 1.3, 1.6), col, { hull: 1.04 });
  box.position.y = 0.65;
  const r1 = new T.Mesh(geo.box(0.3, 1.32, 1.62), toon(ribbon)); r1.position.y = 0.65;
  const r2 = new T.Mesh(geo.box(1.62, 1.32, 0.3), toon(ribbon)); r2.position.y = 0.65;
  const lid = new T.Group();
  lid.position.y = 1.42;
  const lm = mesh(geo.box(1.78, 0.28, 1.78), col, { hull: 1.04 });
  const lr = new T.Mesh(geo.box(0.32, 0.3, 1.8), toon(ribbon));
  for (const sx of [-1, 1]) {
    const bow = mesh(geo.torus(0.26, 0.09, Math.PI * 2, 6, 14), ribbon, { outline: 0.015 });
    bow.position.set(sx * 0.27, 0.32, 0); bow.rotation.set(0, Math.PI / 2, sx * 0.6);
    lid.add(bow);
  }
  lid.add(lm, lr);
  g.add(box, r1, r2, lid, blobShadow(1.1));
  g.userData.lid = lid;
  g.userData.phys = 'box';
  return g;
}

function pumpkin() {
  const pm = prop('prop_m_pumpkin');
  if (pm) { pm.add(blobShadow(1.1)); return pm; }
  const g = new T.Group();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const r = mesh(geo.sphere(0.62, 16, 12), i % 2 ? 0xff8a2a : 0xf47a1c, { outline: 0.03 });
    r.scale.set(0.75, 1, 1.05);
    r.position.set(Math.cos(a) * 0.45, 0.78, Math.sin(a) * 0.45);
    r.rotation.y = -a;
    g.add(r);
  }
  const stem = mesh(geo.cyl(0.08, 0.13, 0.45, 8), 0x5a8a2a, { outline: 0.015 });
  stem.position.y = 1.55; stem.rotation.z = 0.25;
  const leaf = mesh(geo.sphere(0.2, 8, 6), C.leaf, { outline: 0.012 });
  leaf.scale.set(1.6, 0.25, 0.9); leaf.position.set(0.25, 1.48, 0.05);
  g.add(stem, leaf, blobShadow(1.1));
  return g;
}

function watermelon() {
  const pm = prop('prop_m_watermelon');
  if (pm) { pm.add(blobShadow(1.2)); return pm; }
  const g = new T.Group();
  const m = mesh(geo.sphere(1, 24, 18), 0x3f9a3a, { outline: 0.035 });
  m.scale.set(1.25, 0.82, 0.95); m.position.y = 0.82;
  // stripes: thin discs through the middle, slightly bigger than the melon, so only a band shows on the skin
  const sg = new T.Group();
  sg.scale.set(1.25 * 1.015, 0.82 * 1.015, 0.95 * 1.015); sg.position.y = 0.82;
  for (let i = 0; i < 6; i++) {
    const st = new T.Mesh(geo.sphere(1, 24, 18), toon(0x2b6e2a));
    st.scale.set(0.09, 1, 1); st.rotation.y = (i / 6) * Math.PI;
    sg.add(st);
  }
  g.add(sg);
  const hi = new T.Mesh(geo.sphere(0.15, 8, 6), basic(0xcff5c0)); hi.position.set(-0.5, 1.3, 0.6);
  g.add(m, hi, blobShadow(1.2));
  return g;
}

function mushroom(cap = 0xe8453c) {
  const pm = prop('prop_m_mushroom', { tint: cap, size: 0.98 });
  if (pm) { pm.add(blobShadow(0.9)); return pm; }
  const g = new T.Group();
  const stem = mesh(geo.cyl(0.38, 0.48, 1.1, 16), 0xfff1d6, { outline: 0.03 });
  stem.position.y = 0.55;
  const top = mesh(geo.sphere(1, 24, 14), cap, { outline: 0.035 });
  top.scale.set(1.1, 0.62, 1.1); top.position.y = 1.15;
  g.add(stem, top);
  const spots = [[0, 1.75, 0.2], [-0.55, 1.45, 0.65], [0.6, 1.45, 0.6], [0.15, 1.35, 0.95], [-0.8, 1.25, 0.1]];
  for (const [x, y, z] of spots) {
    const s = new T.Mesh(geo.sphere(0.15, 8, 6), basic(0xffffff));
    s.position.set(x, y, z); s.scale.set(1, 0.5, 1);
    g.add(s);
  }
  // a tiny face so it is cute, not scary
  for (const sx of [-1, 1]) { const e = new T.Mesh(geo.sphere(0.06, 8, 6), toon(0x3a2838)); e.position.set(sx * 0.14, 0.7, 0.45); g.add(e); }
  g.add(blobShadow(0.9));
  g.userData.cap = top;
  return g;
}

function carrot() {
  const g = new T.Group();
  // the shared Blender carrot (another kit: prop_carrot, springy leafy tuft), planted in a little soil mound
  const pc = propModel('prop_carrot');
  if (pc) {
    pc.scale.setScalar(2.1); pc.position.y = 1.0;
    const mound = prop('prop_m_mound', { hide: ['leaves'] }) || mesh(geo.sphere(0.8, 16, 8), 0x8a5a3b, { outline: 0.02 });
    if (mound.userData.model) mound.scale.set(1.15, 0.9, 1.15); else mound.scale.set(1, 0.25, 0.8);
    g.add(pc, mound, blobShadow(0.9));
    g.userData.carrot = pc;
    return g;
  }
  const c = makeCarrot(2.2);
  c.position.y = 1.1;
  const mound = mesh(geo.sphere(0.8, 16, 8), 0x8a5a3b, { outline: 0.02 });
  mound.scale.set(1, 0.25, 0.8);
  g.add(c, mound, blobShadow(0.9));
  g.userData.carrot = c;
  return g;
}

export function makeThing(kind, th = {}, slot = 0) {
  let g;
  if (kind === 'ball') g = ball(th.col, th.band);
  else if (kind === 'beachball') g = beachball(slot);
  else if (kind === 'tower') g = tower(3, slot * 2);
  else if (kind === 'gift') g = gift([C.purple, C.blue, C.red][slot % 3], [C.yellow, 0xffffff, C.yellow][slot % 3]);
  else if (kind === 'duck') g = makeDuck();
  else if (kind === 'drum') { g = makeDrum([0xd94f3d, 0x4a90ff, 0x4fb84a][slot % 3], 1, 1.1); g.userData.kind = undefined; g.userData.drum = true; }
  else if (kind === 'tree') {
    g = prop('prop_m_tree', { tint: th.leaf ?? C.leaf, hide: th.snow ? [] : ['snow'] });
    if (g) g.add(blobShadow(1.2)); else g = makeTree(1, th.leaf ?? C.leaf, { snow: !!th.snow });
  }
  else if (kind === 'sunflower') { g = prop('prop_m_sunflower'); if (g) g.add(blobShadow(0.7)); else { g = new T.Group(); const f = makeSunflower(2.4); f.scale.setScalar(1.3); g.add(f); } }
  else if (kind === 'pumpkin') g = pumpkin();
  else if (kind === 'watermelon') g = watermelon();
  else if (kind === 'mushroom') g = mushroom(th.cap);
  else if (kind === 'carrot') g = carrot();
  else g = makeAnimal(kind);
  g.userData.thingKind = kind;
  return g;
}

// ---------- scatter: small physics props on the grass in front, they jump when something big stomps ----------
const SCATTER = {
  balls: () => { const c = [C.red, C.blue, C.yellow, C.green][Math.floor(Math.random() * 4)]; return [mesh(geo.sphere(0.22, 14, 10), c, { outline: 0.02 }), 0.22]; },
  apples: () => {
    const g = new T.Group();
    const a = mesh(geo.sphere(0.24, 14, 10), Math.random() < 0.3 ? 0x9bd14a : C.red, { outline: 0.02 });
    const st = mesh(geo.cyl(0.02, 0.03, 0.14, 5), 0x6b4226, { outline: 0 }); st.position.y = 0.26;
    g.add(a, st); return [g, 0.24];
  },
  acorns: () => {
    const g = new T.Group();
    const n = mesh(geo.sphere(0.17, 12, 10), 0xc98a4a, { outline: 0.02 }); n.scale.y = 1.2;
    const cap = mesh(geo.sphere(0.19, 12, 8), 0x7a4a26, { outline: 0.015 }); cap.scale.y = 0.55; cap.position.y = 0.12;
    g.add(n, cap); return [g, 0.2];
  },
  blocks: () => { const s = 0.36; return [mesh(geo.box(s, s, s), BLOCK_COLS[Math.floor(Math.random() * 6)], { hull: 1.06 }), 0.2, 'box']; },
  marbles: () => { const c = [0x7fd6ff, 0xff8fc0, 0xb197fc, 0xffe066][Math.floor(Math.random() * 4)]; return [mesh(geo.sphere(0.16, 12, 10), c, { outline: 0.015 }), 0.16]; },
  snowballs: () => [mesh(geo.sphere(0.22, 14, 10), 0xffffff, { outline: 0.02 }), 0.22],
  berries: () => { const m = mesh(geo.sphere(0.17, 12, 10), Math.random() < 0.5 ? 0x5a4fcf : 0xd8344a, { outline: 0.015 }); return [m, 0.17]; },
  leaves: () => { const m = mesh(geo.sphere(0.26, 10, 6), [0xffa040, 0xe8453c, 0xffd23f][Math.floor(Math.random() * 3)], { outline: 0.015 }); m.scale.set(1, 0.25, 0.6); return [m, 0.13]; },
};
// Blender scatter props: [kind, scale, options, radius, shape]
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const SCATTER_PROP = {
  balls: () => ['prop_m_toyball', 0.5, { tint: pick([C.red, C.blue, C.yellow, C.green]), hide: ['dots', 'star'], face: false }, 0.22],
  apples: () => ['prop_m_apple', 0.52, { tint: Math.random() < 0.3 ? 0x9bd14a : 0xff4b4b }, 0.24],
  acorns: () => ['prop_m_acorn', 0.85, {}, 0.2],
  blocks: () => ['prop_m_block', 0.46, { tint: pick(BLOCK_COLS) }, 0.2, 'box'],
  marbles: () => ['prop_m_marble', 0.8, { tint: pick([0x7fd6ff, 0xff8fc0, 0xb197fc, 0xffe066]) }, 0.16],
  snowballs: () => ['prop_m_snowball', 1.0, {}, 0.22],
  berries: () => ['prop_m_blueberry', 0.4, { tint: Math.random() < 0.5 ? 0x5a4fcf : 0xd8344a }, 0.17],
  leaves: () => ['prop_m_leaf', 1.0, { tint: pick([0xffa040, 0xe8453c, 0xffd23f]) }, 0.13],
};
export function makeScatter(type) {
  const P = (SCATTER_PROP[type] || SCATTER_PROP.balls)();
  const w = wrapped(P[0], P[2], P[1]);
  if (w) { w.userData.scatter = { r: P[3], shape: P[4] || 'ball' }; return w; }
  const [m, r, shape = 'ball'] = (SCATTER[type] || SCATTER.balls)();
  m.userData.scatter = { r, shape };
  return m;
}

// ---------- per-level stage dressing ----------
// level 0 (L1): meadow bushes. 1 (L2): a stripy play rug and a toy box. 2 (L3): garden soil beds and a fence.
export function makeStage(level) {
  const g = new T.Group();
  if (level === 1) {
    const cols = [0xff8fc0, 0xffe066, 0x7fd6ff, 0xb5e48c];
    for (let i = 0; i < 8; i++) {
      const s = new T.Mesh(geo.box(2.4, 0.03, 10), toon(cols[i % 4]));
      s.position.set(-8.4 + i * 2.4, 0.015, 2.3); // reaches the bottom of the (closer) camera's view
      g.add(s);
    }
    const tb = prop('prop_m_toybox');
    if (tb) { tb.position.set(8.6, 0, -3.2); tb.rotation.y = -0.4; g.add(tb); }
    else {
      const box = mesh(geo.box(2.2, 1.4, 1.4), 0xd94f3d, { hull: 1.03 });
      box.position.set(8.6, 0.7, -3.2); box.rotation.y = -0.4;
      const lid = mesh(geo.box(2.3, 0.2, 1.5), 0xffd23f, { hull: 1.03 });
      lid.position.set(8.6, 1.5, -3.2); lid.rotation.set(0, -0.4, 0.25);
      g.add(box, lid);
    }
  } else if (level === 2) {
    for (const x of [-3.8, 0.4, 4.6, -3.0, 3.5]) {
      // a snowy garden (this level is the winter meadow): frosted beds, not mud
      const bed = new T.Mesh(geo.circle(1.9, 28), toon(0xd5e2f2));
      bed.rotation.x = -Math.PI / 2; bed.scale.set(1, 0.55, 1);
      bed.position.set(x, 0.02 + Math.abs(x) * 0.0003, 0.2);
      g.add(bed);
    }
    if (propModel('prop_fence')) {
      // the shared Blender picket fence (sections 1.7 long), a little lower than a farm fence
      for (let i = 0; i < 10; i++) { const f = propModel('prop_fence', { tint: 0xd9b07a }); f.scale.setScalar(0.7); f.position.set(-8.5 + i * 1.7, 0, -3); g.add(f); }
    } else {
      for (let i = 0; i < 9; i++) {
        const p = mesh(geo.cyl(0.06, 0.08, 0.9, 6), 0xc9a06a, { outline: 0.01 });
        p.position.set(-8 + i * 2, 0.45, -3); g.add(p);
      }
      const rail = mesh(geo.box(16.5, 0.12, 0.1), 0xc9a06a, { hull: 0 }); rail.position.set(0, 0.75, -3); g.add(rail);
    }
  } else {
    for (const [x, z, s] of [[-9, -2.8, 1.1], [9.2, -2.6, 1.3], [-1.2, -4.5, 0.9], [6, -4.2, 1]]) {
      const pb = prop('prop_m_bush');
      if (pb) { pb.scale.setScalar(s * 0.75); pb.position.set(x, 0, z); pb.rotation.y = x * 0.05; g.add(pb); continue; }
      const b = new T.Group();
      for (let k = 0; k < 3; k++) { const m = mesh(geo.sphere(0.75, 14, 10), k ? 0x5fbf4f : 0x4fae45, { outline: 0.025 }); m.position.set((k - 1) * 0.6, 0.55 + (k === 1 ? 0.25 : 0), 0); b.add(m); }
      for (let k = 0; k < 3; k++) { const c = mesh(geo.sphere(0.62, 14, 10), 0xffffff, { outline: 0.02 }); c.scale.y = 0.45; c.position.set((k - 1) * 0.6, 0.95 + (k === 1 ? 0.25 : 0), 0.05); b.add(c); }
      b.position.set(x, 0, z); b.scale.setScalar(s); g.add(b);
    }
  }
  return g;
}

// A puffy bush used by the "peekaboo" arrival.
export function makeBush(s = 1) {
  const pb = prop('prop_m_bush', { size: 0.95 });
  if (pb) { pb.scale.setScalar(s); return pb; }
  const b = new T.Group();
  for (let k = 0; k < 4; k++) {
    const m = mesh(geo.sphere(0.9, 14, 10), k % 2 ? 0x5fbf4f : 0x4fae45, { outline: 0.03 });
    m.position.set((k - 1.5) * 0.75, 0.7 + (k === 1 || k === 2 ? 0.45 : 0), 0);
    b.add(m);
  }
  b.scale.setScalar(s);
  return b;
}
