// Apple count helpers: the fruit, the basket, the worm, and the "hosts" the fruit sits on
// (a tree, a bush, a picnic blanket, a bunch of balloons). Each host lays the fruit out and lets it go its own way.
import * as T from '../three.js';
import { mesh, geo, basic, ink, toon, blobShadow } from '../engine/toon.js';
import { C } from '../engine/actors.js';
import { makeTree } from '../engine/scenery.js';
import { propModel } from '../engine/prop-models.js';
import { prop } from './view-tools.js';

export function makeFruit(kind) {
  const g = new T.Group();
  let body;
  if (kind === 'pear') {
    body = mesh(geo.sphere(0.45, 20, 14), 0x9ed64a, { outline: 0.035 });
    const top = mesh(geo.sphere(0.3, 16, 12), 0x9ed64a, { outline: 0.03 });
    top.position.y = 0.42;
    g.add(top);
  } else if (kind === 'orange') {
    body = mesh(geo.sphere(0.5, 20, 14), C.orange, { outline: 0.035 });
  } else if (kind === 'plum') {
    body = mesh(geo.sphere(0.46, 20, 14), 0x9b5de5, { outline: 0.035 });
    body.scale.set(0.95, 1.05, 0.95);
  } else {
    body = mesh(geo.sphere(0.5, 20, 14), 0xff4b4b, { outline: 0.035 });
    body.scale.set(1.05, 0.95, 1);
  }
  g.add(body);
  const hi = new T.Mesh(geo.sphere(0.1, 8, 6), basic(0xffffff));
  hi.position.set(-0.18, 0.18, 0.42);
  g.add(hi);
  const stem = mesh(geo.cyl(0.04, 0.05, 0.28, 6), C.trunk, { outline: 0.012 });
  stem.position.y = kind === 'pear' ? 0.78 : 0.52;
  const leaf = mesh(geo.sphere(0.14, 10, 8), C.leaf, { outline: 0.015 });
  leaf.scale.set(1.4, 0.35, 0.8);
  leaf.position.set(0.15, stem.position.y + 0.05, 0);
  leaf.rotation.z = 0.5;
  g.add(stem, leaf);
  return g;
}

export function makeBasket() {
  const g = new T.Group();
  const b = mesh(geo.cyl(1.5, 1.1, 1.0, 24), 0xc98b4f, { outline: 0.04 });
  b.position.y = 0.5;
  const rim = mesh(geo.torus(1.5, 0.12, Math.PI * 2, 8, 32), 0xa86f3a, { outline: 0.03 });
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 1.0;
  const inside = new T.Mesh(geo.circle(1.42, 28), basic(0x6b4424));
  inside.rotation.x = -Math.PI / 2;
  inside.position.y = 0.97;
  for (let i = 0; i < 3; i++) {
    const band = mesh(geo.torus(1.3 + i * 0.07, 0.04, Math.PI * 2, 6, 32), 0xa86f3a, { outline: 0 });
    band.rotation.x = Math.PI / 2;
    band.position.y = 0.25 + i * 0.25;
    g.add(band);
  }
  g.add(b, rim, inside, blobShadow(1.3));
  return g;
}

// A little pink worm with googly eyes, for the one surprise round.
export function makeWorm() {
  const pm = propModel('prop_m_worm'); // Blender worm (segments on bones, the game's code face): keeps idle life + look-at
  if (pm) {
    const b = pm.userData.bones;
    pm.userData.segs = [b.w1, b.w2, b.w3].filter(Boolean);
    pm.userData.head = b.head;
    pm.userData.face = pm.userData.model.userData.face;
    return pm;
  }
  const g = new T.Group();
  const segs = [];
  for (let i = 0; i < 4; i++) {
    const s = mesh(geo.sphere(0.2 - i * 0.015, 14, 10), C.pink, { outline: 0.025 });
    s.position.y = i * 0.26;
    g.add(s); segs.push(s);
  }
  const head = mesh(geo.sphere(0.24, 16, 12), C.pink, { outline: 0.03 });
  head.position.y = 1.05;
  for (const sx of [-1, 1]) {
    const w = mesh(geo.sphere(0.09, 10, 8), 0xffffff, { outline: 0.015 });
    w.position.set(sx * 0.1, 0.07, 0.19);
    const p = ink(geo.sphere(0.045, 8, 6));
    p.position.z = 0.06;
    w.add(p);
    head.add(w);
  }
  const smile = ink(geo.torus(0.08, 0.02, Math.PI, 4, 12));
  smile.rotation.z = Math.PI;
  smile.position.set(0, -0.07, 0.22);
  head.add(smile);
  g.add(head);
  g.userData = { segs, head };
  return g;
}

function makeBush(width) {
  const n0 = Math.max(1, Math.round(width / 3));
  if (prop('prop_m_bush')) {
    // a row of Blender bushes (the middle one a little taller), little blossoms only on the outer ones
    const g = new T.Group();
    for (let i = 0; i < n0; i++) {
      const mid = i === (n0 - 1) / 2;
      const b = prop('prop_m_bush', { hide: mid ? ['flowers'] : [] });
      const k = (width / n0) / 3.0 * (mid ? 1.12 : 1.0);
      b.scale.set(k, k * (mid ? 1.08 : 1), k);
      b.position.set((i - (n0 - 1) / 2) * (width / n0) * 0.95, 0, mid ? 0.1 : -0.1);
      b.rotation.y = (i - (n0 - 1) / 2) * 0.12;
      g.add(b);
    }
    g.add(blobShadow(width / 2.2));
    return g;
  }
  const g = new T.Group();
  const n = Math.max(3, Math.round(width / 1.5));
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * (width / n) * 1.05;
    const r = 1.05 + ((i * 37) % 5) * 0.06;
    const s = mesh(geo.sphere(r, 16, 12), i % 2 ? 0x4fb553 : C.leaf, { outline: 0.04 });
    s.position.set(x, 0.75 + ((i * 13) % 3) * 0.12, 0.2);
    s.scale.set(1, 0.9, 0.85);
    g.add(s);
  }
  for (let i = 0; i < n - 1; i++) {
    const s = mesh(geo.sphere(0.8, 14, 10), 0x6acb5c, { outline: 0.035 });
    s.position.set((i - (n - 2) / 2) * (width / n) * 1.05, 1.55, -0.1);
    g.add(s);
  }
  g.add(blobShadow(width / 2.2));
  return g;
}

function makeBlanket() {
  const pm = prop('prop_m_blanket');
  if (pm) return pm;
  const g = new T.Group();
  const W = 9.4, D = 2.4, n = 8, m = 2;
  const base = new T.Mesh(geo.box(W, 0.06, D), toon(0xffffff));
  g.add(base);
  for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) {
    if ((i + j) % 2) continue;
    const sq = new T.Mesh(geo.box(W / n, 0.07, D / m), toon(0xff7a7a));
    sq.position.set(-W / 2 + (i + 0.5) * (W / n), 0.005, -D / 2 + (j + 0.5) * (D / m));
    g.add(sq);
  }
  g.position.y = 0.03;
  return g;
}

function makeTray() {
  const pm = prop('prop_m_tray');
  if (pm) return pm;
  const g = new T.Group();
  const t = mesh(geo.box(8.6, 0.12, 2.1), 0xb9c2cc, { hull: 1.02 });
  t.position.y = 0.1;
  const lip = mesh(geo.box(8.8, 0.22, 0.12), 0x9aa4ae, { hull: 1.03 });
  lip.position.set(0, 0.18, 1.06);
  const mitt = mesh(geo.sphere(0.45, 12, 10), 0xff7a7a, { outline: 0.03 });
  mitt.scale.set(1.3, 0.35, 0.9); mitt.position.set(4.9, 0.15, 0.4);
  g.add(t, lip, mitt);
  return g;
}

function makeTable() {
  const pm = prop('prop_m_table');
  if (pm) { pm.add(blobShadow(3)); return pm; }
  const g = new T.Group();
  const top = mesh(geo.cyl(3.9, 3.9, 0.16, 32), 0xffffff, { outline: 0.03 });
  top.scale.z = 0.45; top.position.y = 2.35;
  const cloth = mesh(geo.cyl(4.0, 4.3, 1.3, 32, true), 0xff9ec8, { outline: 0.02 });
  cloth.scale.z = 0.47; cloth.position.y = 1.75;
  const leg = mesh(geo.cyl(0.25, 0.4, 1.2, 12), 0xc98b4f, { outline: 0.03 });
  leg.position.y = 0.6;
  // bunting dots along the cloth
  for (let i = 0; i < 9; i++) {
    const d = new T.Mesh(geo.circle(0.16, 10), basic([C.yellow, 0xffffff, C.blue][i % 3]));
    d.position.set(-3.2 + i * 0.8, 1.6, 1.95);
    g.add(d);
  }
  g.add(top, cloth, leg, blobShadow(3));
  return g;
}

function makeStand() {
  const pm = propModel('prop_cakestand'); // Blender cake stand: plate tops at the same heights (1.92, 3.62)
  if (pm) { pm.add(blobShadow(1.4)); return pm; }
  const g = new T.Group();
  const pole = mesh(geo.cyl(0.1, 0.1, 1.7, 10), 0xffd23f, { outline: 0.02 });
  pole.position.y = 2.7;
  const base = mesh(geo.cyl(0.6, 0.8, 0.3, 18), 0xffd23f, { outline: 0.025 });
  base.position.y = 0.15;
  const t1 = mesh(geo.cyl(2.4, 2.2, 0.14, 30), 0xffffff, { outline: 0.03 });
  t1.scale.z = 0.45; t1.position.y = 1.85;
  const t2 = mesh(geo.cyl(1.7, 1.5, 0.14, 30), 0xffffff, { outline: 0.03 });
  t2.scale.z = 0.45; t2.position.y = 3.55;
  const pillar = mesh(geo.cyl(0.6, 0.5, 1.6, 18), 0x9ed6ff, { outline: 0.02 });
  pillar.position.y = 1.0;
  g.add(pole, base, pillar, t1, t2, blobShadow(1.4));
  return g;
}

const BALLOON_COLS = [C.blue, C.yellow, C.purple, C.pink, C.green];
// a little plate under a treat (Blender plate, else a code disc)
function plate(r, col) {
  const pm = prop('prop_m_plate');
  if (pm) { pm.scale.setScalar(r / 0.64); return pm; }
  const m = new T.Mesh(geo.cyl(r, r * 0.8, 0.08, 20), toon(col));
  m.position.y = 0.04;
  const g = new T.Group(); g.add(m); return g;
}
function addBalloon(fruit, i) {
  const pm = prop('prop_m_balloon', { tint: BALLOON_COLS[i % BALLOON_COLS.length] });
  if (pm) { pm.position.y = 1.95; pm.rotation.y = (i % 2 ? 0.3 : -0.3); fruit.add(pm); fruit.userData.balloon = pm; return; }
  const b = new T.Group();
  const ball = mesh(geo.sphere(0.5, 18, 14), BALLOON_COLS[i % BALLOON_COLS.length], { outline: 0.035 });
  ball.scale.set(1, 1.18, 1);
  const hi = new T.Mesh(geo.sphere(0.1, 8, 6), basic(0xffffff));
  hi.position.set(-0.18, 0.25, 0.4);
  ball.add(hi);
  const knot = mesh(geo.cone(0.1, 0.14, 8), BALLOON_COLS[i % BALLOON_COLS.length], { outline: 0.015 });
  knot.position.y = -0.62;
  knot.rotation.x = Math.PI;
  const string = ink(geo.cyl(0.015, 0.015, 0.7, 4));
  string.position.y = -1.0;
  b.add(ball, knot, string);
  b.position.y = 1.95;
  fruit.add(b);
  fruit.userData.balloon = b;
}

// Builds the host for a round and returns { obj, slots(n, layout) → Vector3[], decorate(fruit, i) }
export function makeHost(kind, variant = 0) {
  if (kind === 'bush') {
    return {
      kind, obj: makeBush(9),
      slots: (n, layout) => Array.from({ length: n }, (_, i) => {
        const step = n >= 5 ? 1.6 : 1.9;
        const x = (i - (n - 1) / 2) * step + (layout === 'scatter' ? (i % 2 ? 0.35 : -0.25) : 0);
        const y = layout === 'arc' ? 2.4 - Math.abs(i - (n - 1) / 2) * 0.45 : 1.75 + (i % 2) * 0.55;
        return new T.Vector3(x, y, 1.45);
      }),
    };
  }
  if (kind === 'blanket' || kind === 'tray') {
    const obj = kind === 'tray' ? makeTray() : makeBlanket();
    // spread in front of the container so every item is in plain view; each item sits on its own plate
    obj.position.set(0, 0, 5.3);
    return {
      kind, obj,
      slots: (n, layout) => Array.from({ length: n }, (_, i) => {
        const x = (i - (n - 1) / 2) * (n >= 5 ? 1.35 : 1.6) + (layout === 'scatter' ? (i % 2 ? 0.25 : -0.2) : 0);
        const p = new T.Vector3(x, 0.6, 5.2 + (i % 2) * 0.2);
        if (kind !== 'tray') { const pl = plate(0.62, 0xfaf6ee); pl.position.set(p.x, 0.08, p.z - 5.3); obj.add(pl); }
        return p;
      }),
      restY: () => (kind === 'tray' ? 0.16 : 0.125), // things sit on the tray / in the middle of their plate
    };
  }
  if (kind === 'patch') {
    // a strawberry patch: soil mounds with leafy tufts; the berries peek out of the leaves
    const obj = new T.Group();
    obj.position.set(0, 0, 6.0);
    return {
      kind, obj,
      slots: (n, layout) => Array.from({ length: n }, (_, i) => {
        // mounds at least 2.1 apart (centre to centre), so no two ever overlap, and sitting level (no tilt)
        const x = (i - (n - 1) / 2) * (n >= 4 ? 2.2 : 2.6) + (layout === 'scatter' ? (i % 2 ? 0.12 : -0.12) : 0);
        const z = 6.0 + (layout === 'arc' ? -Math.abs(i - (n - 1) / 2) * 0.4 : (i % 2) * 0.3);
        const pm = prop('prop_m_mound');
        if (pm) { pm.position.set(x, 0, z - 6.0 - 0.25); pm.rotation.set(0, (i % 3 - 1) * 0.25, 0); obj.add(pm); return new T.Vector3(x, 0.72, z); }
        const mound = mesh(geo.sphere(0.75, 14, 8), 0x8a5a3a, { outline: 0.03 });
        mound.scale.set(1, 0.35, 0.8);
        mound.position.set(x, 0.05, z - 6.0 - 0.25);
        obj.add(mound);
        for (let k = 0; k < 4; k++) {
          const a = (k / 4) * Math.PI * 2 + i;
          const l = mesh(geo.sphere(0.3, 10, 8), k % 2 ? 0x4fb553 : C.leaf, { outline: 0.02 });
          l.scale.set(1.2, 0.45, 0.8);
          l.position.set(x + Math.cos(a) * 0.45, 0.3, z - 6.0 - 0.35 + Math.sin(a) * 0.2);
          l.rotation.set(0.3, -a, Math.cos(a) * 0.5);
          obj.add(l);
        }
        return new T.Vector3(x, 0.72, z);
      }),
    };
  }
  if (kind === 'table') {
    // a round party table with a pink cloth; treats stand along the front edge
    const obj = makeTable();
    obj.position.set(0, 0, -0.3);
    return {
      kind, obj,
      slots: (n, layout) => Array.from({ length: n }, (_, i) => {
        const x = (i - (n - 1) / 2) * (n >= 5 ? 1.25 : 1.5) + (layout === 'scatter' ? (i % 2 ? 0.2 : -0.2) : 0);
        const pl = plate(0.55, 0xffffff);
        pl.position.set(x, 2.43, 0.9);
        obj.add(pl);
        return new T.Vector3(x, 2.98, 0.6);
      }),
      restY: () => 2.475,
    };
  }
  if (kind === 'stand') {
    // a tiered cake stand: treats sit on two tiers
    const obj = makeStand();
    obj.position.set(0, 0, -0.6);
    return {
      kind, obj,
      slots: (n) => {
        const top = Math.floor(n / 2), bot = n - top;
        const out = [];
        for (let i = 0; i < bot; i++) out.push(new T.Vector3((i - (bot - 1) / 2) * 1.35, 2.35, 0.6));
        for (let i = 0; i < top; i++) out.push(new T.Vector3((i - (top - 1) / 2) * 1.3, 4.05, 0.1));
        return out;
      },
      restY: (p) => (p.y > 3 ? 3.62 : 1.92), // the cake stand's plate tops
    };
  }
  if (kind === 'balloons') {
    return {
      kind, obj: new T.Group(),
      slots: (n, layout) => Array.from({ length: n }, (_, i) => {
        const x = (i - (n - 1) / 2) * 1.9 + (layout === 'scatter' ? (i % 2 ? 0.3 : -0.3) : 0);
        const y = layout === 'arc' ? 3.9 - Math.abs(i - (n - 1) / 2) * 0.5 : 3.2 + ((i * 7) % 3) * 0.35;
        return new T.Vector3(x, y, 1.0);
      }),
      decorate: (f, i) => addBalloon(f, i),
    };
  }
  // tree (variant 1 = pink blossom tree): the Blender tree tinted leaf-green or blossom-pink
  // set back a little so the whole crown fits under the caption (it was cut off at the top of the frame)
  const obj = prop('prop_m_tree', { tint: variant ? 0xffb3d1 : C.leaf, hide: ['snow'], size: 1.95 }) || makeTree(1.95, variant ? 0xffb3d1 : C.leaf);
  if (obj.userData.model) obj.add(blobShadow(2.3));
  obj.position.z = -3.6;
  return {
    kind, obj,
    slots: (n, layout) => Array.from({ length: n }, (_, i) => {
      let x = (i - (n - 1) / 2) * 1.9, y = 4.6;
      if (layout === 'arc') y = 5.15 - Math.abs(i - (n - 1) / 2) * 0.7;
      if (layout === 'scatter') { x += (i % 2 ? 0.4 : -0.3); y = 4.0 + ((i * 7) % 3) * 0.6; }
      return new T.Vector3(x, y, 0.9);
    }),
  };
}
