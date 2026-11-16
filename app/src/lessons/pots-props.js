// Props for Peekaboo pots: the hiding places (flowerpots, hay bales, buckets, boxes), the friends who hide,
// the bits of them that peek out, and the silly surprises under the wrong ones (a worm, a frog, a sock, a rubber duck).
import * as T from '../three.js';
import { mesh, geo, toon, basic, blobShadow } from '../engine/toon.js';
import { makeAnimal, makeFace } from '../engine/actors.js';
import { makePot, makeChick, makeCarrot, stillProp } from '../engine/farm.js';
import { makePumpkin } from '../engine/scenery.js';
import { makeBeachBall } from '../engine/beach.js';
import { makeFence } from '../engine/scenery.js';
import { propModel } from '../engine/prop-models.js';

const PI = Math.PI;

// ---------- hiding places (origin on the ground, about 1.7–1.9 tall) ----------
function hay() {
  const pm = propModel('prop_hay');
  if (pm) { pm.add(blobShadow(1.4)); return pm; }
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
  const pm = propModel('prop_bucket', { tint: col, size: [1.3, 1.75 / 1.3, 1.3] });
  if (pm) { // Blender pail turned over (sticker still in front), handle flopped against the front
    const m = pm.userData.model;
    m.rotation.z = Math.PI; m.position.y = 1.75;
    pm.userData.bones.handle.rotation.x = 1.85;
    pm.add(blobShadow(1.35));
    return pm;
  }
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
  const pm = propModel('prop_box', { size: [2.4 / 2.3, 1.86 / 1.455, 2.0 / 1.8] });
  if (pm) { pm.add(blobShadow(1.4)); return pm; }
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
function basket(col) {
  // an upside-down woven basket (the Blender wicker basket turned over, when built)
  const pm = propModel('prop_wicker', { size: [0.78, 1.2, 0.78] });
  if (pm) {
    stillProp(pm);
    const m = pm.userData.model;
    m.rotation.z = Math.PI; m.position.y = 1.09 * 1.2;
    pm.add(blobShadow(1.4));
    return pm;
  }
  const g = new T.Group();
  const b = mesh(geo.cyl(0.95, 1.25, 1.6, 26), col, { outline: 0.03 }); b.position.y = 0.8;
  const dark = new T.Color(col).multiplyScalar(0.75).getHex();
  for (let i = 0; i < 5; i++) { const y = 0.2 + i * 0.32, r = 1.25 - (y / 1.6) * 0.3 + 0.01; const ring = mesh(geo.torus(r, 0.045, PI * 2, 6, 30), dark, { outline: 0 }); ring.rotation.x = PI / 2; ring.position.y = y; g.add(ring); }
  for (let i = 0; i < 10; i++) { const a = (i / 10) * PI * 2; const st = new T.Mesh(geo.box(0.06, 1.6, 0.03), toon(dark)); st.position.set(Math.sin(a) * 1.11, 0.8, Math.cos(a) * 1.11); st.rotation.y = a; st.rotation.x = Math.cos(a) * 0.18; st.rotation.z = -Math.sin(a) * 0.18; g.add(st); }
  const rim = mesh(geo.torus(1.27, 0.1, PI * 2, 8, 30), dark, { outline: 0.015 }); rim.rotation.x = PI / 2; rim.position.y = 0.08;
  const knob = mesh(geo.torus(0.3, 0.07, PI, 6, 14), dark, { outline: 0.012 }); knob.position.y = 1.6;
  g.add(b, rim, knob, blobShadow(1.35));
  return g;
}
function barrel() {
  const pm = propModel('prop_barrel');
  if (pm) { pm.add(blobShadow(1.3)); return pm; }
  const g = new T.Group();
  const b = mesh(geo.cyl(1.0, 1.0, 1.8, 24), 0xb8763e, { outline: 0.03 }); b.position.y = 0.9; b.scale.set(1, 1, 1);
  const belly = mesh(geo.sphere(1.12, 24, 14), 0xb8763e, { outline: 0.03 }); belly.scale.set(1, 0.72, 1); belly.position.y = 0.9;
  for (const y of [0.25, 0.9, 1.55]) { const r = mesh(geo.torus(y === 0.9 ? 1.13 : 1.04, 0.06, PI * 2, 6, 30), 0x6b6f7a, { outline: 0 }); r.rotation.x = PI / 2; r.position.y = y; g.add(r); }
  for (let i = 0; i < 12; i++) { const a = (i / 12) * PI * 2; const l = new T.Mesh(geo.box(0.03, 1.5, 0.02), basic(0x8a5228)); l.position.set(Math.sin(a) * 1.12, 0.9, Math.cos(a) * 1.12); l.rotation.y = a; g.add(l); }
  const top = new T.Mesh(geo.circle(1.0, 24), toon(0xd9965a)); top.rotation.x = -PI / 2; top.position.y = 1.805;
  g.add(b, belly, top, blobShadow(1.3));
  return g;
}
function pumpkin() {
  // a big hollow pumpkin over the friend like a hat (the farm's pumpkin, big)
  const pk = makePumpkin(2.25);
  if (pk) { const g = new T.Group(); g.add(pk); return g; }
  const g = new T.Group();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * PI * 2;
    const lobe = mesh(geo.sphere(0.75, 16, 12), i % 2 ? 0xff8a2a : 0xff9a3a, { outline: 0.025 });
    lobe.scale.set(0.75, 1.1, 0.75); lobe.position.set(Math.cos(a) * 0.62, 0.85, Math.sin(a) * 0.62);
    g.add(lobe);
  }
  const stem = mesh(geo.cyl(0.13, 0.18, 0.45, 8), 0x58a03a, { outline: 0.015 }); stem.position.y = 1.85; stem.rotation.z = 0.25;
  const leaf = mesh(geo.sphere(0.25, 10, 8), 0x5cc45a, { outline: 0.012 }); leaf.scale.set(1.4, 0.3, 0.8); leaf.position.set(0.35, 1.8, 0.1);
  g.add(stem, leaf, blobShadow(1.35));
  return g;
}
const POTCOLS = [0xd9774a, 0xe8915e, 0xc9663c, 0xdd8452];
const BASKETCOLS = [0xd9a85b, 0xe2b56a, 0xc99a4e, 0xddb060];
const BUCKETCOLS = [0xff5a5a, 0x4a90ff, 0xffd23f, 0x5cc96a];
export function makeCover(kind, i) {
  let g;
  if (kind === 'hay') g = hay();
  else if (kind === 'bucket') g = bucket(BUCKETCOLS[i % 4]);
  else if (kind === 'box') g = box();
  else if (kind === 'basket') g = basket(BASKETCOLS[i % 4]);
  else if (kind === 'barrel') g = barrel();
  else if (kind === 'pumpkin') g = pumpkin();
  else g = makePot(POTCOLS[i % 4]);
  g.userData.cover = kind;
  return g;
}
export const COVER_SFX = { pot: 'thunk', hay: 'rustle', bucket: 'thunk', box: 'thunk', basket: 'rustle', barrel: 'thunk', pumpkin: 'bloop' };
// rigid-body collider for each hiding place (a box from the ground up)
export const COVER_SIZE = { pot: [2.5, 1.75, 2.5], hay: [2.5, 1.85, 1.9], bucket: [2.5, 1.75, 2.5], box: [2.4, 1.9, 2.0], basket: [2.3, 1.3, 2.3], barrel: [2.2, 1.8, 2.2], pumpkin: [2.4, 1.8, 2.4] };

// ---------- the friends who hide ----------
export const HIDERS = {
  chick: { name: 'Chick', call: 'cheep', col: 0xffe14d },
  piglet: { name: 'Piglet', call: 'oink', col: 0xffb3c7 },
  kitten: { name: 'Kitten', call: 'meow', col: 0xffa142 },
  bunny: { name: 'Bunny', call: 'boing2', col: 0xffffff },
  hedgehog: { name: 'Hedgehog', call: 'squeak', col: 0x9a6a44 },
};
export function makeHider(kind) {
  let g;
  if (kind === 'piglet') { g = makeAnimal('pig'); g.userData.baseScale = 0.5; }
  else if (kind === 'kitten') { g = makeAnimal('cat'); g.userData.baseScale = 0.5; }
  else if (kind === 'bunny') { g = makeAnimal('bunny'); g.userData.baseScale = 0.48; }
  else if (kind === 'hedgehog') { g = makeAnimal('hedgehog'); g.userData.baseScale = 0.55; }
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
  } else if (kind === 'bunny') {
    // a fluffy cotton tail
    const t = mesh(geo.sphere(0.2, 12, 10), 0xffffff, { outline: 0.016 }); t.position.y = 0.18;
    const t2 = mesh(geo.sphere(0.13, 10, 8), 0xffffff, { outline: 0.012 }); t2.position.set(0.12, 0.3, 0.05);
    g.add(t, t2);
  } else if (kind === 'hedgehog') {
    // a few prickles
    for (let i = 0; i < 5; i++) { const sp = mesh(geo.cone(0.08, 0.4, 6), i % 2 ? 0x7a5236 : 0x9a6a44, { outline: 0.01 }); sp.position.set(-0.24 + i * 0.12, 0.15, 0); sp.rotation.z = (2 - i) * 0.35; g.add(sp); }
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
  const pm = propModel('prop_farmworm', { size: 1.35 });
  if (pm) { // the Blender worm: one bone per segment (seg1 = the head, with the face)
    const g = new T.Group(); g.add(pm);
    const b = pm.userData.bones;
    const segs = [1, 2, 3, 4, 5].map((i) => b['seg' + i]).filter(Boolean);
    for (const x of segs) x.userData.y0 = x.position.y;
    g.userData.segs = segs; g.userData.face = pm.userData.model.userData.face;
    return g;
  }
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
  const pm = propModel('prop_farmsock', { size: 0.8 });
  if (pm) { stillProp(pm); const g = new T.Group(); g.add(pm); g.rotation.y = 0.9; return g; }
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
  const pm = propModel('prop_farmsnail', { size: 1.25 });
  if (pm) { const g = new T.Group(); g.add(pm); g.userData.face = pm.userData.model.userData.face; return g; }
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
function ball() {
  const g = new T.Group();
  const b = makeBeachBall(0.42, [0xff5a5a, 0x4a90ff, 0xffd23f]); b.position.y = 0.42;
  g.add(b);
  return g;
}
export const GAGS = {
  ball: { make: ball, sfx: 'boing', line: 'A bouncy ball!', phys: { shape: 'ball', r: 0.42, bounce: 0.75 } },
  worm: { make: worm, sfx: 'squeak', line: 'A wiggly worm!' },
  frog: { make: () => { const f = makeAnimal('frog'); f.userData.baseScale = 0.5; f.scale.setScalar(0.5); return f; }, sfx: 'ribbit', line: "That's Frog!" },
  sock: { make: sock, sfx: 'boing', line: 'A silly sock!', phys: { shape: 'box', size: { x: 0.55, y: 1.3, z: 0.95 }, bounce: 0.4 } },
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
    if (segs[0].isBone) s.anim(0.7, (_, p) => segs.forEach((x, i) => (x.position.y = x.userData.y0 + Math.max(0, Math.sin(p * PI * 3 - i * 0.7)) * 0.2))).then(() => segs.forEach((x) => (x.position.y = x.userData.y0)));
    else s.anim(0.7, (_, p) => segs.forEach((x, i) => (x.position.y = 0.18 + Math.max(0, Math.sin(p * PI * 3 - i * 0.7)) * 0.25 + (i === 0 ? 0.27 : 0))));
  } else if (k === 'sock') {
    const r0 = g.rotation.y;
    s.anim(0.6, (e) => { g.rotation.y = r0 + e * PI * 2; g.position.y = Math.sin(e * PI) * 0.8; }).then(() => { g.rotation.y = r0; g.position.y = 0; });
  } else if (k === 'snail') {
    s.anim(0.6, (_, p) => (g.rotation.z = Math.sin(p * PI * 4) * 0.12 * (1 - p))).then(() => (g.rotation.z = 0));
  }
}

// ---------- the place: a different set for each level ----------
export function makeSet(level) {
  const g = new T.Group();
  if (level === 0) {
    // a garden bed: dark soil, little sprouts and a row of stones
    const bed = mesh(geo.box(14, 0.12, 3.8), 0x8a5a3b, { hull: 1.01, outline: 0 }); bed.position.set(0.3, 0.04, 0.8);
    g.add(bed);
    for (let i = 0; i < 18; i++) {
      const x = -6.3 + i * 0.77, z = i % 2 ? -0.95 : 2.55;
      const sp = new T.Group(); sp.position.set(x, 0.1, z);
      for (const s of [-1, 1]) { const l = mesh(geo.sphere(0.1, 8, 6), 0x5cc45a, { outline: 0.008 }); l.scale.set(1.6, 0.4, 0.8); l.position.set(s * 0.1, 0.12, 0); l.rotation.z = s * 0.5; sp.add(l); }
      g.add(sp);
    }
    for (let i = 0; i < 20; i++) { const st = mesh(geo.sphere(0.2, 8, 6), i % 2 ? 0xb7b2a6 : 0xd8d2c4, { outline: 0.012 }); st.scale.set(1.3, 0.6, 1); st.position.set(-6.6 + i * 0.72, 0.08, 2.85); g.add(st); }
  } else if (level === 1) {
    // a farmyard pen: a straw floor inside a low wooden fence
    const floor = new T.Mesh(geo.circle(1, 40), toon(0xf0d27a)); floor.rotation.x = -PI / 2; floor.scale.set(7.4, 3.0, 1); floor.position.set(0.3, 0.02, 0.7);
    g.add(floor);
    for (let i = 0; i < 60; i++) { const st = new T.Mesh(geo.box(0.42, 0.025, 0.04), toon(i % 2 ? 0xd9b04a : 0xe8c35a)); const a = i * 2.39, r = Math.sqrt((i + 0.5) / 60); st.position.set(0.3 + Math.cos(a) * r * 6.8, 0.04, 0.7 + Math.sin(a) * r * 2.6); st.rotation.y = i * 1.3; g.add(st); }
    const fence = makeFence(15, 0xc98a50); fence.position.set(0.3, 0, -2.2); fence.scale.set(1, 0.8, 1); g.add(fence);
  } else {
    // a vegetable patch with a scarecrow: striped soil rows under the hiding places, cabbages and carrots along the front
    for (let r = 0; r < 5; r++) { const row = new T.Mesh(geo.box(15, 0.04, 0.8), toon(r % 2 ? 0x8a5a3b : 0x9a6a44)); row.position.set(0.3, 0.02 + r * 0.001, -1.0 + r * 0.8); g.add(row); }
    for (let i = 0; i < 12; i++) {
      const x = -6.4 + i * 1.22, z = 3.1;
      const cab = i % 2 && propModel('prop_farmcabbage', { size: 0.85 });
      if (cab) { stillProp(cab); cab.position.set(x, 0.02, z); cab.rotation.y = i; g.add(cab); }
      else if (i % 2) { const c = mesh(geo.sphere(0.34, 12, 10), 0x7cc95c, { outline: 0.016 }); c.scale.y = 0.75; c.position.set(x, 0.24, z); g.add(c); const c2 = mesh(geo.sphere(0.22, 10, 8), 0xa6e07a, { outline: 0.01 }); c2.position.set(x, 0.4, z + 0.05); g.add(c2); }
      else if (propModel('prop_carrot')) { const c = makeCarrot(0.55); c.position.set(x, -0.15, z); c.rotation.y = i * 1.1; g.add(c); }
      else { for (const s2 of [-1, 0, 1]) { const l = mesh(geo.sphere(0.09, 8, 6), 0x4fb84a, { outline: 0.008 }); l.scale.set(0.6, 2.4, 0.6); l.position.set(x + s2 * 0.08, 0.25, z); l.rotation.z = -s2 * 0.4; g.add(l); } const top = mesh(geo.sphere(0.1, 8, 6), 0xff8a2a, { outline: 0.008 }); top.position.set(x, 0.04, z); g.add(top); }
    }
    const sc = new T.Group(); sc.position.set(8.4, 0, -2.6);
    const post = mesh(geo.cyl(0.08, 0.1, 3.2, 8), 0xa86f3a, { outline: 0.015 }); post.position.y = 1.6;
    const shirt = mesh(geo.box(0.9, 1.0, 0.45), 0x4a90ff, { hull: 1.05 }); shirt.position.y = 2.2;
    const arms = mesh(geo.box(2.2, 0.22, 0.22), 0x4a90ff, { hull: 1.06 }); arms.position.y = 2.5;
    const head = mesh(geo.sphere(0.38, 14, 10), 0xf2d6a0, { outline: 0.02 }); head.position.y = 3.1;
    const face = makeFace(0.38, { mouth: true }); head.add(face);
    const brim = mesh(geo.cyl(0.6, 0.6, 0.05, 18), 0xf2d16b, { outline: 0.015 }); brim.position.y = 3.38;
    const crown = mesh(geo.cyl(0.3, 0.36, 0.3, 14), 0xf2d16b, { outline: 0.015 }); crown.position.y = 3.55;
    for (const s of [-1, 1]) { const tuft = mesh(geo.cone(0.12, 0.35, 5), 0xf0c648, { outline: 0.01 }); tuft.position.set(s * 1.2, 2.5, 0); tuft.rotation.z = s * PI / 2; sc.add(tuft); }
    sc.add(post, shirt, arms, head, brim, crown);
    const scm = propModel('prop_scarecrow'); // Blender scarecrow replaces the code-built one
    if (scm) { sc.clear(); sc.add(scm); }
    g.add(sc);
  }
  return g;
}
