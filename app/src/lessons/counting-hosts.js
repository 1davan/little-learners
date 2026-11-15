// Apple count helpers: the fruit, the basket, the worm, and the "hosts" the fruit sits on
// (a tree, a bush, a picnic blanket, a bunch of balloons). Each host lays the fruit out and lets it go its own way.
import * as T from '../three.js';
import { mesh, geo, basic, ink, toon, blobShadow } from '../engine/toon.js';
import { C } from '../engine/actors.js';
import { makeTree } from '../engine/scenery.js';

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

const BALLOON_COLS = [C.blue, C.yellow, C.purple, C.pink, C.green];
function addBalloon(fruit, i) {
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
  if (kind === 'blanket') {
    const obj = makeBlanket();
    // the blanket is spread in front of the basket so every fruit is in plain view
    obj.position.set(0, 0, 5.3);
    return {
      kind, obj,
      slots: (n) => Array.from({ length: n }, (_, i) => new T.Vector3((i - (n - 1) / 2) * (n >= 5 ? 1.35 : 1.6), 0.55, 5.2 + (i % 2) * 0.2)),
      decorate: (f) => {
        const plate = new T.Mesh(geo.cyl(0.62, 0.5, 0.08, 20), toon(0xfaf6ee));
        plate.position.y = -0.48;
        f.add(plate);
      },
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
  // tree (variant 1 = pink blossom tree)
  const obj = makeTree(2.1, variant ? 0xffb3d1 : C.leaf);
  obj.position.z = -2.5;
  return {
    kind, obj,
    slots: (n, layout) => Array.from({ length: n }, (_, i) => {
      let x = (i - (n - 1) / 2) * 1.9, y = 5.0;
      if (layout === 'arc') y = 5.6 - Math.abs(i - (n - 1) / 2) * 0.7;
      if (layout === 'scatter') { x += (i % 2 ? 0.4 : -0.3); y = 4.4 + ((i * 7) % 3) * 0.6; }
      return new T.Vector3(x, y, 0.9);
    }),
  };
}
