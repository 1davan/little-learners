// Where's Crab? props. Each prop is a group with userData.zones = { in|on|under: { pos, rest, radius } }
// in prop-local space (pos = where you drop, rest = where the friend ends up) and optional cover/uncover
// animations for "under" (the prop lifts, the friend scoots beneath, it drops back down).
import * as T from '../three.js';
import { mesh, geo, toon, basic, blobShadow } from '../engine/toon.js';
import { C } from '../engine/actors.js';
import { sfx } from '../engine/audio.js';
import { Ease } from '../engine/tween.js';

const V = (x, y, z) => new T.Vector3(x, y, z);
const SAND = 0xf2cf7e, SAND_DK = 0xd9b062;

// Open-topped pail. The holder pivots at the back edge so "under" can tip the front up for a peek.
function pail(color, r, h, upsideDown) {
  const holder = new T.Group();
  const b = new T.Group();
  const outer = mesh(geo.cyl(r, r * 0.8, h, 28, true), color, { outline: 0.03 });
  outer.material = new T.MeshToonMaterial({ color, gradientMap: outer.material.gradientMap, side: T.DoubleSide });
  outer.position.y = h / 2;
  const bottom = mesh(geo.cyl(r * 0.8, r * 0.8, 0.06, 28), color, { outline: 0 });
  bottom.position.y = 0.03;
  const inside = new T.Mesh(geo.cyl(r * 0.96, r * 0.77, h * 0.98, 28, true), new T.MeshBasicMaterial({ color: new T.Color(color).multiplyScalar(0.55), side: T.BackSide }));
  inside.position.y = h / 2 + 0.01;
  const rim = mesh(geo.torus(r, 0.09, Math.PI * 2, 8, 32), new T.Color(color).offsetHSL(0, 0, 0.12).getHex(), { outline: 0.02 });
  rim.rotation.x = Math.PI / 2;
  rim.position.y = h;
  const handle = mesh(geo.torus(r * 0.95, 0.045, Math.PI, 6, 24), C.yellow, { outline: 0.012 });
  handle.position.y = h;
  handle.rotation.y = 0.25;
  // a white star sticker on the front
  const star = new T.Mesh(new T.CircleGeometry(0.3, 5), basic(0xffffff));
  star.position.set(0, h * 0.5, r * 0.92);
  star.rotation.x = -0.12;
  b.add(outer, bottom, inside, rim, handle, star);
  if (upsideDown) {
    handle.visible = false;
    b.rotation.x = Math.PI;
    b.position.set(0, h, r);
    holder.position.z = -r;
  }
  holder.add(b);
  return holder;
}

function makeBucketProp(mode) {
  const g = new T.Group();
  const r = 1.2, h = 1.65;
  const up = mode !== 'down';
  const body = pail(up ? C.blue : C.green, r, h, !up);
  g.add(body, blobShadow(r * 1.05));
  if (up) {
    g.userData.zones = { in: { pos: V(0, 1.9, 0), rest: V(0, 0.65, 0), radius: 1.5, rim: h } };
  } else {
    g.userData.zones = {
      on: { pos: V(0, 2.4, 0), rest: V(0, h + 0.04, 0), radius: 1.3 },
      under: { pos: V(0, 0.55, 1.3), rest: V(0, 0, 0), radius: 1.2 },
    };
    g.userData.cover = liftCover(body, 2.1, 0.42);
  }
  g.userData.wobble = body;
  return g;
}

// A cardboard box: open (in) or shut (on / under).
function makeBoxProp(mode) {
  const g = new T.Group();
  const W = 2.3, H = 1.35, D = 1.8, t = 0.08;
  const col = 0xd9a066, dk = 0xb98048;
  const box = new T.Group();
  const holder = new T.Group();
  const panel = (w, h, d, x, y, z, c = col) => { const m = mesh(geo.box(w, h, d), c, { hull: 1.03, outline: 0 }); m.position.set(x, y, z); box.add(m); return m; };
  panel(W, t, D, 0, t / 2, 0, dk);
  panel(W, H, t, 0, H / 2, D / 2 - t / 2);
  panel(W, H, t, 0, H / 2, -D / 2 + t / 2, dk);
  panel(t, H, D, -W / 2 + t / 2, H / 2, 0);
  panel(t, H, D, W / 2 - t / 2, H / 2, 0);
  // tape stripe and a little smiley label on the front
  const tape = new T.Mesh(geo.box(0.32, H * 0.6, 0.02), basic(0xf4e3c0));
  tape.position.set(0, H * 0.7, D / 2 + 0.01);
  box.add(tape);
  const lid = new T.Group();
  const lidM = mesh(geo.box(W + 0.06, t, D + 0.06), col, { hull: 1.03, outline: 0 });
  lidM.position.z = D / 2;
  lid.add(lidM);
  lid.position.set(0, H, -D / 2);
  box.add(lid);
  if (mode === 'open') {
    lid.rotation.x = -1.9; // flipped open at the back
    const inside = new T.Mesh(geo.box(W - 2 * t, 0.02, D - 2 * t), basic(0x8a5a32));
    inside.position.y = t + 0.01;
    box.add(inside);
    g.userData.zones = { in: { pos: V(0, 1.8, 0), rest: V(0, t, 0.05), radius: 1.5, rim: H } };
  } else {
    g.userData.zones = {
      on: { pos: V(0, 2.1, 0), rest: V(0, H + t, 0), radius: 1.3 },
      under: { pos: V(0, 0.5, 1.2), rest: V(0, 0, 0), radius: 1.2 },
    };
    g.userData.cover = liftCover(holder, 2.0, 0.5);
  }
  box.position.z = D / 2;
  holder.position.z = -D / 2;
  holder.add(box);
  g.add(holder, blobShadow(1.3));
  g.userData.wobble = holder;
  return g;
}

// Lifts the whole prop up (friend scoots under), drops it with a thunk, then tips the front up for a peek.
function liftCover(holder, lift, tip) {
  return {
    async lift(s) { sfx.swoosh(); await s.tween(holder.position, { y: lift }, 0.16, Ease.out); },
    async drop(s) {
      await s.tween(holder.position, { y: 0 }, 0.12, Ease.in);
      sfx.thunk();
      await s.anim(0.12, (_, p) => { holder.scale.set(1 + Math.sin(p * Math.PI) * 0.08, 1 - Math.sin(p * Math.PI) * 0.1, 1 + Math.sin(p * Math.PI) * 0.08); });
      holder.scale.setScalar(1);
    },
    tip(s) { return s.tween(holder.rotation, { x: -tip }, 0.18, Ease.back); },
    reset() { holder.position.y = 0; holder.rotation.x = 0; holder.scale.setScalar(1); },
    hides: true,
  };
}

function makeBoatProp() {
  const g = new T.Group();
  const hullCol = C.red;
  const hullGeo = new T.SphereGeometry(1, 28, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
  const hull = mesh(hullGeo, hullCol, { outline: 0.03 });
  hull.material = new T.MeshToonMaterial({ color: hullCol, gradientMap: hull.material.gradientMap, side: T.DoubleSide });
  hull.scale.set(2.0, 0.95, 1.05);
  hull.position.y = 0.95;
  const inner = new T.Mesh(hullGeo, new T.MeshBasicMaterial({ color: 0x8a3b30, side: T.BackSide }));
  inner.scale.set(1.92, 0.9, 0.98);
  inner.position.y = 0.96;
  const rim = mesh(geo.torus(1, 0.08, Math.PI * 2, 8, 40), 0xffffff, { outline: 0.02 });
  rim.rotation.x = Math.PI / 2;
  rim.scale.set(2.0, 1.05, 1);
  rim.position.y = 0.95;
  const stripe = mesh(geo.torus(1, 0.05, Math.PI * 2, 6, 40), 0xffffff, { outline: 0 });
  stripe.rotation.x = Math.PI / 2;
  stripe.scale.set(1.75, 0.92, 1);
  stripe.position.y = 0.55;
  // little flag at the back
  const mast = mesh(geo.cyl(0.04, 0.04, 1.1, 6), 0xa86f3a, { outline: 0.01 });
  mast.position.set(-1.75, 1.45, 0);
  const flag = new T.Mesh(geo.cone(0.22, 0.5, 3), toon(C.yellow));
  flag.rotation.z = -Math.PI / 2;
  flag.position.set(-1.5, 1.8, 0);
  const puddle = new T.Mesh(geo.circle(2.4, 32), toon(0x7fd8ee));
  puddle.rotation.x = -Math.PI / 2;
  puddle.scale.set(1, 0.55, 1);
  puddle.position.y = 0.02;
  const boat = new T.Group();
  boat.add(hull, inner, rim, stripe, mast, flag);
  g.add(puddle, boat);
  g.userData.zones = { in: { pos: V(0, 1.7, 0), rest: V(0, 0.32, 0), radius: 1.6, rim: 0.95 } };
  g.userData.wobble = boat;
  g.userData.rock = boat; // rocks gently on the water
  return g;
}

function makeCastleProp() {
  const g = new T.Group();
  const c = new T.Group();
  const base = mesh(geo.cyl(1.35, 1.5, 1.25, 24), SAND, { outline: 0.03 });
  base.position.y = 0.62;
  const top = mesh(geo.cyl(0.95, 1.05, 0.85, 22), SAND, { outline: 0.03 });
  top.position.y = 1.25 + 0.42;
  c.add(base, top);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const m = mesh(geo.box(0.26, 0.24, 0.26), SAND, { hull: 1.06, outline: 0 });
    m.position.set(Math.cos(a) * 1.25, 1.36, Math.sin(a) * 1.25);
    m.rotation.y = -a;
    c.add(m);
  }
  const door = new T.Mesh(new T.CircleGeometry(0.32, 16, 0, Math.PI), basic(0x8a5a32));
  door.position.set(0, 0.02, 1.43);
  door.scale.y = 1.3;
  c.add(door);
  // side turret with a flag
  const tur = mesh(geo.cyl(0.38, 0.45, 1.6, 16), SAND_DK, { outline: 0.025 });
  tur.position.set(1.45, 0.8, -0.4);
  const cap = mesh(geo.cone(0.48, 0.55, 16), SAND_DK, { outline: 0.02 });
  cap.position.set(1.45, 1.88, -0.4);
  const pole = mesh(geo.cyl(0.03, 0.03, 0.7, 6), 0xffffff, { outline: 0 });
  pole.position.set(1.45, 2.4, -0.4);
  const flag = new T.Mesh(geo.cone(0.18, 0.4, 3), toon(C.red));
  flag.rotation.z = -Math.PI / 2;
  flag.position.set(1.65, 2.6, -0.4);
  c.add(tur, cap, pole, flag);
  for (let i = 0; i < 4; i++) {
    const sh = mesh(geo.sphere(0.09, 8, 6), [0xffc1d6, 0xffffff, 0xd8b6ff, 0xffd9a8][i], { outline: 0.01 });
    sh.position.set(Math.cos(i * 1.4 + 0.3) * 1.42, 0.5 + (i % 2) * 0.35, Math.sin(i * 1.4 + 0.3) * 1.42);
    c.add(sh);
  }
  g.add(c, blobShadow(1.6));
  g.userData.zones = { on: { pos: V(0, 2.75, 0), rest: V(0, 2.1, 0), radius: 1.35 } };
  g.userData.wobble = c;
  return g;
}

function makeUmbrellaProp() {
  const g = new T.Group();
  const POLE = 3.1, R = 2.0, CH = 0.75;
  const pole = mesh(geo.cyl(0.07, 0.07, POLE, 8), 0xffffff, { outline: 0.015 });
  pole.position.y = POLE / 2;
  const canopy = new T.Group();
  const cols = [C.red, 0xffffff, C.yellow, 0xffffff, C.blue, 0xffffff, C.green, 0xffffff];
  for (let i = 0; i < 8; i++) {
    const w = new T.Mesh(new T.ConeGeometry(R, CH, 4, 1, true, (i / 8) * Math.PI * 2, Math.PI / 4), toon(cols[i], { side: T.DoubleSide }));
    canopy.add(w);
  }
  const edge = mesh(geo.torus(R, 0.05, Math.PI * 2, 6, 40), 0xffffff, { outline: 0.015 });
  edge.rotation.x = Math.PI / 2;
  edge.position.y = -CH / 2;
  const knob = mesh(geo.sphere(0.12, 10, 8), C.red, { outline: 0.015 });
  knob.position.y = CH / 2 + 0.05;
  canopy.add(edge, knob);
  canopy.position.y = POLE;
  const shade = blobShadow(1.9);
  shade.material = shade.material.clone();
  g.add(pole, canopy, shade);
  const tipY = POLE + CH / 2 + 0.12;
  g.userData.zones = {
    on: { pos: V(0, tipY + 0.6, 0), rest: V(0, tipY, 0), radius: 1.3 },
    under: { pos: V(0, 0.8, 0.8), rest: V(0, 0, 0.35), radius: 1.5 },
  };
  // "under": the umbrella dips down low like a hat over the friend
  g.userData.cover = {
    async lift() {},
    async drop(s) {
      sfx.boing2();
      await s.anim(0.22, (e) => { canopy.position.y = POLE - e * 1.55; pole.scale.y = 1 - e * 0.5; pole.position.y = POLE * pole.scale.y / 2; }, Ease.out);
    },
    tip(s) { return s.anim(0.15, (_, p) => { canopy.rotation.x = -Math.sin(p * Math.PI) * 0.12; }); },
    reset() { canopy.position.y = POLE; canopy.rotation.x = 0; pole.scale.y = 1; pole.position.y = POLE / 2; },
    hides: false,
  };
  g.userData.wobble = canopy;
  return g;
}

function makeTowelProp() {
  const g = new T.Group();
  const towel = new T.Group();
  const cols = [C.pink, 0xffffff, C.purple, 0xffffff, C.pink, 0xffffff];
  for (let i = 0; i < 6; i++) {
    const s = mesh(geo.box(0.5, 0.06, 2.0), cols[i], { outline: 0 });
    s.position.set(-1.25 + i * 0.5, 0.04, 0);
    towel.add(s);
  }
  const edge = new T.Mesh(geo.box(3.1, 0.04, 2.1), basic(0x3a2838));
  edge.position.y = 0.02;
  towel.add(edge);
  for (const x of [-1.55, 1.55]) for (let k = 0; k < 5; k++) {
    const f = new T.Mesh(geo.box(0.14, 0.03, 0.05), basic(0xffffff));
    f.position.set(x + Math.sign(x) * 0.06, 0.04, -0.8 + k * 0.4);
    towel.add(f);
  }
  towel.rotation.y = 0.12;
  g.add(towel);
  g.userData.zones = { on: { pos: V(0, 0.9, 0.3), rest: V(0, 0.08, 0.1), radius: 1.6 } };
  g.userData.wobble = towel;
  return g;
}

const MAKERS = { bucket: makeBucketProp, box: makeBoxProp, boat: makeBoatProp, castle: makeCastleProp, umbrella: makeUmbrellaProp, towel: makeTowelProp };
export const PROP_NAME = { bucket: 'bucket', box: 'box', boat: 'boat', castle: 'sandcastle', umbrella: 'umbrella', towel: 'towel' };

// which places a prop offers, without building it
export function zoneIds(kind, mode) {
  if (kind === 'bucket') return mode === 'down' ? ['on', 'under'] : ['in'];
  if (kind === 'box') return mode === 'open' ? ['in'] : ['on', 'under'];
  return { boat: ['in'], castle: ['on'], umbrella: ['on', 'under'], towel: ['on'] }[kind];
}

export function makeProp(kind, mode) {
  const g = MAKERS[kind](mode);
  g.userData.prop = kind;
  g.userData.mode = mode;
  return g;
}

// ---- gags ----

// "In": a crown of water drops bursts up around the rim.
export function splashCrown(s, parent, center, r, color = 0x7fd0ff) {
  sfx.splash();
  const drops = [];
  const n = 12;
  for (let i = 0; i < n; i++) {
    const d = mesh(geo.sphere(0.13 + (i % 3) * 0.03, 8, 6), i % 3 ? color : 0xffffff, { outline: 0.012 });
    const a = (i / n) * Math.PI * 2;
    d.userData.a = a;
    d.position.copy(center);
    parent.add(d);
    drops.push(d);
  }
  // a tall centre spout
  const spout = mesh(geo.sphere(0.22, 10, 8), color, { outline: 0.015 });
  spout.position.copy(center);
  parent.add(spout);
  return s.anim(0.7, (_, p) => {
    for (const d of drops) {
      const rr = r * (0.7 + p * 0.9);
      d.position.set(center.x + Math.cos(d.userData.a) * rr, center.y + Math.sin(p * Math.PI) * 1.5 - p * 0.4, center.z + Math.sin(d.userData.a) * rr * 0.7);
      d.scale.setScalar(Math.max(0.01, 1 - p * p));
    }
    spout.position.y = center.y + Math.sin(p * Math.PI) * 2.0;
    spout.scale.set(1 - p * 0.6, 1 + Math.sin(p * Math.PI) * 1.2, 1 - p * 0.6);
  }).then(() => { for (const d of drops) parent.remove(d); parent.remove(spout); });
}
