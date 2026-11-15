// Props for Peekaboo pots: the hiding places (flowerpots, hay bales, buckets, boxes), the friends who hide,
// the bits of them that peek out, and the silly surprises under the wrong ones (a worm, a frog, a sock, a rubber duck).
import * as T from '../three.js';
import { mesh, geo, toon, basic, blobShadow } from '../engine/toon.js';
import { makeAnimal, makeFace } from '../engine/actors.js';
import { makePot, makeChick } from '../engine/farm.js';

const PI = Math.PI;

// ---------- hiding places (origin on the ground, about 1.7–1.9 tall) ----------
function hay() {
  const g = new T.Group();
  const b = mesh(geo.box(2.5, 1.8, 1.9), 0xf0c648, { hull: 1.03 });
  b.position.y = 0.9;
  for (const y of [0.45, 0.85, 1.3]) { const l = new T.Mesh(geo.box(2.42, 0.04, 0.02), basic(0xd9a92e)); l.position.set(0, y, 0.96); g.add(l); }
  for (const x of [-0.65, 0.65]) {
    const t = mesh(geo.box(0.1, 1.84, 1.94), 0xa86f3a, { outline: 0 });
    t.position.set(x, 0.9, 0); g.add(t);
  }
  for (let i = 0; i < 6; i++) {
    const s = mesh(geo.cone(0.05, 0.4, 4), 0xf7d46a, { outline: 0.008 });
    s.position.set(-1 + i * 0.4, 1.85, -0.3 + (i % 3) * 0.3); s.rotation.z = (i % 2 ? 1 : -1) * 0.5;
    g.add(s);
  }
  g.add(b, blobShadow(1.4));
  return g;
}
function bucket(col) {
  const g = new T.Group();
  const r = 1.3, h = 1.75;
  const body = mesh(geo.cyl(r * 0.78, r, h, 26), col, { outline: 0.03 });
  body.position.y = h / 2;
  const light = new T.Color(col).offsetHSL(0, 0, 0.12).getHex();
  const rim = mesh(geo.torus(r, 0.09, PI * 2, 8, 30), light, { outline: 0.015 });
  rim.rotation.x = PI / 2; rim.position.y = 0.08;
  const top = new T.Mesh(geo.circle(r * 0.78, 26), toon(light));
  top.rotation.x = -PI / 2; top.position.y = h + 0.005;
  // the handle flops down the front
  const handle = mesh(geo.torus(0.55, 0.045, PI, 6, 16), 0xffd23f, { outline: 0.012 });
  handle.rotation.z = PI; handle.position.set(0, 0.55, r * 0.95); handle.rotation.x = -0.25;
  g.add(body, rim, top, handle, blobShadow(1.35));
  return g;
}
function box() {
  const g = new T.Group();
  const b = mesh(geo.box(2.4, 1.85, 2.0), 0xd2a06a, { hull: 1.03 });
  b.position.y = 0.925;
  const tape = new T.Mesh(geo.box(0.42, 1.86, 2.02), toon(0xe9c99a));
  tape.position.y = 0.925;
  const flapL = mesh(geo.box(1.2, 0.06, 2.0), 0xc28f5a, { outline: 0 }); flapL.position.set(-0.6, 1.86, 0);
  const flapR = flapL.clone(); flapR.position.x = 0.6;
  // a printed sticker on the front: an up arrow on a white label
  const label = new T.Mesh(geo.box(0.62, 0.62, 0.02), basic(0xfff6e6)); label.position.set(-0.75, 0.95, 1.01);
  const arrow = new T.Mesh(geo.cone(0.18, 0.26, 3), basic(0xd94f3d)); arrow.position.set(-0.75, 1.05, 1.03);
  const stem = new T.Mesh(geo.box(0.08, 0.22, 0.01), basic(0xd94f3d)); stem.position.set(-0.75, 0.84, 1.03);
  g.add(b, tape, flapL, flapR, label, arrow, stem, blobShadow(1.4));
  return g;
}
const POTCOLS = [0xd9774a, 0xe8915e, 0xc9663c, 0xdd8452];
const BUCKETCOLS = [0xff5a5a, 0x4a90ff, 0xffd23f, 0x5cc96a];
export function makeCover(kind, i) {
  let g;
  if (kind === 'hay') g = hay();
  else if (kind === 'bucket') g = bucket(BUCKETCOLS[i % 4]);
  else if (kind === 'box') g = box();
  else g = makePot(POTCOLS[i % 4]);
  g.userData.cover = kind;
  return g;
}
export const COVER_SFX = { pot: 'thunk', hay: 'rustle', bucket: 'thunk', box: 'thunk' };

// ---------- the friends who hide ----------
export const HIDERS = {
  chick: { name: 'Chick', call: 'cheep', col: 0xffe14d },
  piglet: { name: 'Piglet', call: 'oink', col: 0xffb3c7 },
  kitten: { name: 'Kitten', call: 'meow', col: 0xffa142 },
};
export function makeHider(kind) {
  let g;
  if (kind === 'piglet') { g = makeAnimal('pig'); g.userData.baseScale = 0.5; }
  else if (kind === 'kitten') { g = makeAnimal('cat'); g.userData.baseScale = 0.5; }
  else g = makeChick(0.6);
  g.scale.setScalar(g.userData.baseScale);
  g.userData.hider = kind;
  return g;
}
// The little bit that pokes out from under the hiding place.
export function makePeek(kind) {
  const g = new T.Group();
  const col = HIDERS[kind].col;
  if (kind === 'piglet') {
    // a curly tail
    const c = mesh(geo.torus(0.14, 0.05, PI * 1.7, 8, 16), col, { outline: 0.014 });
    c.position.y = 0.2; c.rotation.y = 0.3;
    const st = mesh(geo.cyl(0.05, 0.05, 0.2, 8), col, { outline: 0.014 }); st.position.set(0.14, 0.08, 0);
    g.add(c, st);
  } else if (kind === 'kitten') {
    // a stripy tail, curling up
    for (let i = 0; i < 6; i++) {
      const a = i / 5;
      const s = mesh(geo.sphere(0.11 - a * 0.02, 10, 8), i % 2 ? 0xe8742a : col, { outline: 0.012 });
      s.position.set(Math.sin(a * 1.8) * 0.3, Math.sin(a * 1.4) * 0.65, 0);
      g.add(s);
    }
  } else {
    for (const [x, rz] of [[-0.12, 0.5], [0, 0], [0.12, -0.5]]) {
      const fe = mesh(geo.cone(0.13, 0.6, 8), col, { outline: 0.012 });
      fe.position.set(x, 0.25, 0); fe.rotation.z = rz;
      g.add(fe);
    }
    g.rotation.x = 0.5;
  }
  return g;
}

// ---------- surprises under the wrong ones ----------
function worm() {
  const g = new T.Group();
  g.scale.setScalar(1.35);
  const segs = [];
  for (let i = 0; i < 5; i++) {
    const s = mesh(geo.sphere(0.2 - i * 0.015, 12, 10), i % 2 ? 0xff8fb0 : 0xff9fbe, { outline: 0.016 });
    s.position.set(0.3 - i * 0.24, 0.18, 0);
    g.add(s); segs.push(s);
  }
  const face = makeFace(0.2, { mouth: true });
  face.position.set(0, 0.02, 0.05);
  segs[0].add(face);
  segs[0].position.y = 0.45;
  g.userData.segs = segs;
  return g;
}
function sock() {
  const g = new T.Group();
  const leg = new T.Group();
  for (let i = 0; i < 4; i++) {
    const b = mesh(geo.cyl(0.24, 0.24, 0.22, 16), i % 2 ? 0xff5a5a : 0xffffff, { outline: 0.014 });
    b.position.y = 0.55 + i * 0.22; leg.add(b);
  }
  const heel = mesh(geo.sphere(0.25, 14, 10), 0xff5a5a, { outline: 0.016 }); heel.position.y = 0.35;
  const foot = mesh(geo.cyl(0.22, 0.24, 0.6, 14), 0xffffff, { outline: 0.016 }); foot.rotation.x = PI / 2; foot.position.set(0, 0.3, 0.3);
  const toe = mesh(geo.sphere(0.23, 14, 10), 0xff5a5a, { outline: 0.016 }); toe.position.set(0, 0.3, 0.62);
  g.add(leg, heel, foot, toe);
  g.rotation.y = 0.9;
  return g;
}
function snail() {
  const g = new T.Group();
  const body = mesh(geo.sphere(0.22, 14, 10), 0xb6e07a, { outline: 0.016 });
  body.scale.set(2.6, 0.7, 1); body.position.set(0.05, 0.16, 0);
  const head = mesh(geo.sphere(0.2, 14, 10), 0xb6e07a, { outline: 0.016 });
  head.position.set(0.55, 0.34, 0.05);
  const face = makeFace(0.2, { mouth: true });
  head.add(face);
  for (const z of [-0.08, 0.1]) {
    const st = mesh(geo.cyl(0.025, 0.03, 0.3, 6), 0xb6e07a, { outline: 0.008 }); st.position.set(0.6, 0.6, z); st.rotation.z = -0.3;
    const knob = mesh(geo.sphere(0.05, 8, 6), 0xb6e07a, { outline: 0.008 }); knob.position.set(0.65, 0.76, z);
    g.add(st, knob);
  }
  const shell = mesh(geo.sphere(0.4, 18, 14), 0xff9f3f, { outline: 0.02 });
  shell.position.set(-0.12, 0.55, 0); shell.scale.set(1, 1, 0.75);
  for (const [r, t] of [[0.27, 0.05], [0.14, 0.045]]) {
    const sp = mesh(geo.torus(r, t, Math.PI * 2, 6, 24), 0xd9701f, { outline: 0 });
    sp.position.set(-0.12, 0.55, 0.28); g.add(sp);
  }
  g.add(body, head, shell);
  g.userData.shell = shell;
  return g;
}
export const GAGS = {
  worm: { make: worm, sfx: 'squeak', line: 'A wiggly worm!' },
  frog: { make: () => { const f = makeAnimal('frog'); f.userData.baseScale = 0.5; f.scale.setScalar(0.5); return f; }, sfx: 'ribbit', line: "That's Frog!" },
  sock: { make: sock, sfx: 'boing', line: 'A silly sock!' },
  snail: { make: snail, sfx: 'bloop', line: 'A sleepy snail!' },
};
export function makeGag(kind) {
  const g = GAGS[kind].make();
  g.userData.gag = kind;
  if (g.userData.baseScale === undefined) g.userData.baseScale = g.scale.x;
  return g;
}
// each gag's own little show (s: tween scope)
export function gagShow(s, g) {
  const k = g.userData.gag;
  if (k === 'worm') {
    const segs = g.userData.segs;
    s.anim(0.7, (_, p) => segs.forEach((x, i) => (x.position.y = 0.18 + Math.max(0, Math.sin(p * PI * 3 - i * 0.7)) * 0.25 + (i === 0 ? 0.27 : 0))));
  } else if (k === 'sock') {
    const r0 = g.rotation.y;
    s.anim(0.6, (e) => { g.rotation.y = r0 + e * PI * 2; g.position.y = Math.sin(e * PI) * 0.8; }).then(() => { g.rotation.y = r0; g.position.y = 0; });
  } else if (k === 'snail') {
    s.anim(0.6, (_, p) => (g.rotation.z = Math.sin(p * PI * 4) * 0.12 * (1 - p))).then(() => (g.rotation.z = 0));
  }
}
