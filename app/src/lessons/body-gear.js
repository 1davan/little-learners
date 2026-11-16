// Bear's nose — beach gear that pops onto a body part after the child finds it.
// Built in the friend's model space (scale 1, ~2.4 units tall, facing +z).
import * as T from '../three.js';
import { mesh, geo, ink, basic } from '../engine/toon.js';
import { C } from '../engine/actors.js';
import { propModel } from '../engine/prop-models.js';
import { makeBeachBall, makeShell, makeSeaStar } from '../engine/beach.js';

// The gear, the set and the toys are Blender models (tools/blender/creatures/prop_*.py); each keeps its code fallback.
const pm = (kind, opts) => propModel(kind, opts);

function sunglasses(span) {
  const b = pm('prop_shades', { tint: C.red, size: span });
  if (b) return b;
  const g = new T.Group();
  for (const s of [-1, 1]) {
    const lens = mesh(geo.cyl(0.15, 0.15, 0.05, 20), 0x2a2440, { outline: 0.02 });
    lens.rotation.x = Math.PI / 2;
    lens.position.x = s * span / 2;
    const shine = new T.Mesh(geo.sphere(0.04, 6, 4), basic(0xffffff));
    shine.position.set(s * span / 2 - 0.05, 0.05, 0.03);
    shine.scale.z = 0.3;
    const frame = mesh(geo.torus(0.155, 0.03, Math.PI * 2, 6, 20), C.red, { outline: 0 });
    frame.position.x = s * span / 2;
    g.add(lens, shine, frame);
  }
  const bridge = mesh(geo.box(Math.max(0.05, span - 0.3), 0.04, 0.04), C.red, { outline: 0 });
  bridge.position.y = 0.05;
  g.add(bridge);
  return g;
}

function sunscreen() {
  const d = pm('prop_dollop');
  if (d) return d;
  const b = mesh(geo.sphere(0.11, 12, 8), 0xffffff, { outline: 0.012 });
  b.scale.set(1.3, 0.9, 0.7);
  return b;
}

function flower(s = 0.22, col = C.pink) {
  const f = pm('prop_hibiscus', { tint: col, size: s });
  if (f) return f;
  const g = new T.Group();
  for (let i = 0; i < 5; i++) {
    const p = mesh(geo.sphere(0.1, 10, 8), C.pink, { outline: 0.01 });
    const a = (i / 5) * Math.PI * 2;
    p.position.set(Math.cos(a) * 0.1, Math.sin(a) * 0.1, 0);
    p.scale.set(1, 1, 0.4);
    g.add(p);
  }
  const mid = mesh(geo.sphere(0.06, 8, 6), C.yellow, { outline: 0.008 });
  mid.position.z = 0.03;
  g.add(mid);
  return g;
}

function swimRing() {
  const r = pm('prop_ring', { size: [0.95, 0.55, 0.95] });
  if (r) return r;
  const g = new T.Group();
  const cols = [C.red, 0xffffff];
  for (let i = 0; i < 8; i++) {
    const seg = mesh(geo.torus(0.88, 0.17, Math.PI / 4, 8, 6), cols[i % 2], { outline: 0.015 });
    seg.rotation.z = (i / 8) * Math.PI * 2;
    g.add(seg);
  }
  g.rotation.x = Math.PI / 2;
  return g;
}

function spade(s = 0.8, col = C.blue) {
  const sp = pm('prop_spade', { tint: col, size: s });
  if (sp) { sp.rotation.z = 0.5; return sp; }
  const g = new T.Group();
  const handle = mesh(geo.cyl(0.035, 0.035, 0.55, 8), C.yellow, { outline: 0.01 });
  handle.position.y = 0.2;
  const blade = mesh(geo.box(0.22, 0.24, 0.04), C.blue, { hull: 1.08, outline: 0 });
  blade.position.y = -0.15;
  g.add(handle, blade);
  g.rotation.z = 0.5;
  return g;
}

function flipper() {
  const fm = pm('prop_flipper', { tint: C.green, size: 0.75 });
  if (fm) { fm.userData.model.position.z = -0.22; return fm; }
  const f = mesh(geo.cone(0.22, 0.6, 4), C.green, { outline: 0.015 });
  f.rotation.x = Math.PI / 2;
  f.scale.set(1.2, 1, 0.25);
  return f;
}

function iceLolly() {
  const l = pm('prop_lolly', { tint: C.orange, size: 0.5 });
  if (l) return l;
  const g = new T.Group();
  const stick = mesh(geo.box(0.05, 0.25, 0.02), 0xe0b98c, { hull: 1.1, outline: 0 });
  stick.position.y = -0.2;
  const pop = mesh(geo.box(0.18, 0.3, 0.08), C.orange, { hull: 1.06, outline: 0 });
  pop.position.y = 0.05;
  g.add(stick, pop);
  return g;
}

// name → list of { make, at: anchor name, on: 'head'|'root'|'hand', off: [x,y,z] }
export const GEAR = {
  eyes: [{ make: (span) => sunglasses(span), at: 'eyes', on: 'head', off: [0, 0, 0.09] }],
  nose: [{ make: sunscreen, at: 'nose', on: 'head', off: [0, 0.01, 0.05] }],
  ears: [{ make: () => flower(), at: 'earL', on: 'head', off: [0.05, -0.08, 0.15] }],
  mouth: [{ make: iceLolly, at: 'mouth', on: 'head', off: [0.12, -0.1, 0.2], eat: true }],
  tummy: [{ make: swimRing, at: 'tummy', on: 'root', off: [0, -0.1, -0.62] }],
  hands: [{ make: () => spade(), at: 'handR', on: 'hand', off: [0.05, 0.05, 0.12] }],
  feet: [{ make: flipper, at: 'footL', on: 'root', off: [0, -0.05, 0.25] }, { make: flipper, at: 'footR', on: 'root', off: [0, -0.05, 0.25] }],
};

// ---- the beach spot for each level (decor around the friend) ----
// Level 1: a striped towel under a big umbrella. Level 2: a paddling pool and a lifeguard flag.
// Level 3: a rock pool with rocks, seaweed and a starfish. Returns a group; userData.statics = physics shapes (world):
// [cx, cy, cz, sx, sy, sz] boxes, or { cont: [x, y, z], r, h } containers (the paddling pool: toys float at the water line).
export function makeSet(level) {
  const g = new T.Group();
  const statics = [];
  if (level === 0) {
    const towel = pm('prop_towel', { tint: 0xffb020, size: [4.34 / 3, 1, 3.4 / 2] });
    if (towel) {
      const wl = towel.userData.model.userData.layers.white;
      if (wl) wl.outline.visible = false;
      towel.position.set(0.4, 0.03, 0.4);
      g.add(towel);
    } else {
      const t = new T.Group();
      const cols = [C.yellow, 0xffffff, C.orange, 0xffffff, C.yellow, 0xffffff, C.orange];
      cols.forEach((c, i) => { const s = new T.Mesh(geo.box(0.62, 0.05, 3.4), basic(c)); s.position.x = -1.86 + i * 0.62; t.add(s); });
      t.position.set(0.4, 0.03, 0.4);
      g.add(t);
    }
    // the umbrella: a pole tilted a little, its canopy on top
    const TILT = 0.12, FOOT = new T.Vector3(-3.3, 0, -1.2), H = 5;
    const pole = pm('prop_pole', { size: [1.15, H / 3.1, 1.15] });
    const canopy = pm('prop_parasol', { size: 1.3 });
    if (pole && canopy) {
      pole.position.copy(FOOT); pole.rotation.z = TILT;
      const top = new T.Vector3(FOOT.x - Math.sin(TILT) * H, Math.cos(TILT) * H, FOOT.z);
      canopy.position.set(top.x + Math.sin(TILT) * 0.5, top.y - Math.cos(TILT) * 0.5, FOOT.z);
      canopy.rotation.z = TILT;
      g.add(pole, canopy);
    } else {
      const p = mesh(geo.cyl(0.08, 0.08, 5, 8), 0xffffff, { outline: 0.015 });
      p.position.set(-3.6, 2.5, -1.2); p.rotation.z = TILT;
      const c = new T.Group();
      const cc = [C.red, 0xffffff];
      for (let i = 0; i < 8; i++) c.add(new T.Mesh(new T.ConeGeometry(2.6, 0.9, 4, 1, true, (i / 8) * Math.PI * 2, Math.PI / 4), basic(cc[i % 2], { side: T.DoubleSide })));
      c.position.set(-3.3, 5.0, -1.2); c.rotation.z = TILT;
      g.add(p, c);
    }
    statics.push([-3.6, 2.5, -1.2, 0.2, 5, 0.2]);
  } else if (level === 1) {
    const pool = pm('prop_pool');
    if (pool) pool.position.set(-4.2, 0, 0.4);
    else {
      const p = new T.Group();
      const ring = mesh(geo.torus(1.5, 0.32, Math.PI * 2, 10, 32), C.blue, { outline: 0.02 });
      ring.rotation.x = -Math.PI / 2; ring.position.y = 0.32;
      const water = new T.Mesh(geo.circle(1.5, 32), basic(0x7fd8ee));
      water.rotation.x = -Math.PI / 2; water.position.y = 0.5;
      p.add(ring, water); p.position.set(-4.2, 0, 0.4);
      g.add(p);
    }
    if (pool) g.add(pool);
    const flag = pm('prop_lifeflag');
    if (flag) { flag.position.set(4.6, 0, -1.5); g.add(flag); g.userData.flag = flag.userData.bones.flag; }
    statics.push({ cont: [-4.2, 0.5, 0.4], r: 1.3, h: 0.45 });
  } else {
    const pool = new T.Mesh(geo.circle(2.2, 28), basic(0x5cc6e6));
    pool.rotation.x = -Math.PI / 2; pool.scale.set(1, 0.6, 1); pool.position.set(-4.0, 0.03, 0.6);
    const rim = new T.Mesh(geo.ring(2.2, 2.45, 40), basic(0xbfe9f5));
    rim.rotation.x = -Math.PI / 2; rim.scale.set(1, 0.6, 1); rim.position.set(-4.0, 0.025, 0.6);
    g.add(rim, pool);
    for (const [x, z, r, c, ry] of [[-5.6, 0.4, 0.8, 0x9a948a, 0.3], [-2.6, -0.2, 0.6, 0xb7b2a6, -0.5], [4.4, -0.6, 0.9, 0xa8a196, 0.8], [5.4, 0.8, 0.5, 0xb7b2a6, 2.0]]) {
      const rock = pm('prop_rock', { tint: c, size: r });
      if (rock) { rock.position.set(x, 0, z); rock.rotation.y = ry; }
      else { const m = mesh(geo.sphere(r, 12, 8), c, { outline: 0.025 }); m.scale.set(1.3, 0.7, 1); m.position.set(x, r * 0.35, z); g.add(m); }
      if (rock) g.add(rock);
      statics.push([x, r * 0.5, z, r * 2.3, r * 1.0, r * 1.6]);
    }
    for (const [x, z, s] of [[-4.7, 0.15, 0.85], [-3.55, 0.45, 0.65]]) {
      const weed = pm('prop_seaweed', { size: s });
      if (weed) { weed.position.set(x, 0, z); g.add(weed); }
    }
    const star = makeSeaStar(0xff8a5c, 0.3);
    star.rotation.set(-1.2, 0, 0.4);
    star.position.set(-3.0, 0.07, 1.2);
    g.add(star);
  }
  g.userData.statics = statics;
  return g;
}

// ---- loose toys (rigid bodies) that shower down after a right answer ----
const SHELL_COLS = [0xffb6c9, 0xffd9a8, 0xd8b6ff, 0xa8e0ff, 0xffffff];
const BALLS = [[C.red, C.yellow, C.blue], [C.green, C.pink, C.yellow], [C.purple, C.orange, C.blue]];
const pick = (a) => a[Math.floor(Math.random() * a.length)];
export function makeToy(kind) {
  const g = new T.Group();
  let m, r = null, shape = 'auto';
  if (kind === 'ball') { m = makeBeachBall(0.42, pick(BALLS)); r = 0.42; }
  else if (kind === 'shell') { m = makeShell(pick(SHELL_COLS), 0.5); }
  else if (kind === 'star') { m = makeSeaStar(pick([0xff8a5c, 0xffc23f, 0xff6f9c]), 0.3); }
  else if (kind === 'flower') { m = flower(0.32, pick([C.pink, 0xff5a5a, 0xffb020])); }
  else if (kind === 'spade') { m = spade(0.7, pick([C.blue, C.red, C.green])); m.rotation.set(0, 0, 1.3); }
  else if (kind === 'duck') {
    m = pm('prop_duckie', { size: 0.5 });
    if (m) m.rotation.y = -0.6 + Math.random() * 1.2;
    else { m = mesh(geo.sphere(0.24, 12, 10), 0xffd23f, { outline: 0.02 }); r = 0.24; }
  } else { // apple (old plans)
    m = mesh(geo.sphere(0.24, 12, 10), 0xff4b4b, { outline: 0.02 }); r = 0.24;
  }
  g.add(m);
  g.userData = { toy: kind, shape: r ? 'ball' : shape, r };
  return g;
}
