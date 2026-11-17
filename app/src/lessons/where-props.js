// Where's Crab? props. Each prop is a group with userData.zones = { in|on|under: { pos, rest, radius } }
// in prop-local space (pos = where you drop, rest = where the friend ends up) and optional cover/uncover
// animations for "under" (the prop lifts, the friend scoots beneath, it drops back down).
import * as T from '../three.js';
import { mesh, geo, toon, basic, blobShadow } from '../engine/toon.js';
import { C } from '../engine/actors.js';
import { sfx } from '../engine/audio.js';
import { Ease } from '../engine/tween.js';
import { makeShell, makeBeachBall, makeSeaStar, makeCoin, makeMelon, makeSandwich, makeWaterDrop } from '../engine/beach.js';
import { propModel } from '../engine/prop-models.js';

const V = (x, y, z) => new T.Vector3(x, y, z);
const SAND = 0xf2cf7e, SAND_DK = 0xd9b062;

// Open-topped pail. The holder pivots at the back edge so "under" can tip the front up for a peek.
function pail(color, r, h, upsideDown) {
  const holder = new T.Group();
  const pm = propModel('prop_bucket', { tint: color, size: [r, h / 1.3, r] });
  if (pm) { // Blender pail: upside down = turned over about z (sticker stays in front), handle flopped against the front
    if (upsideDown) { pm.userData.bones.handle.rotation.x = 1.85; pm.rotation.z = Math.PI; pm.position.set(0, h, r); holder.position.z = -r; }
    holder.add(pm);
    holder.userData.handle = pm.userData.bones.handle;
    return holder;
  }
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
    // fit: the friend shrinks a little inside so its claws stay clear of the walls; the handle flops back out of its way
    g.userData.zones = { in: { pos: V(0, 1.9, 0), rest: V(0, 0.55, 0.05), radius: 1.5, rim: h, fit: 0.78 } };
    const hb = body.userData.handle;
    if (hb) g.userData.flop = (s) => s.tween(hb.rotation, { x: -1.75 }, 0.25, Ease.out).then(() => sfx.tap());
  } else {
    g.userData.zones = {
      on: { pos: V(0, 2.4, 0), rest: V(0, h + 0.04, 0), radius: 1.3 },
      under: { pos: V(0, 0.55, 1.3), rest: V(0, 0, 0), radius: 1.2, fit: 0.72 },
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
  const pm = propModel('prop_box'); // Blender box (same size); open = its two top flaps folded out
  if (pm) {
    box.add(pm);
    if (mode === 'open') { pm.userData.bones.flapL.rotation.z = 2.0; pm.userData.bones.flapR.rotation.z = -2.0; }
  }
  const panel = (w, h, d, x, y, z, c = col) => { const m = mesh(geo.box(w, h, d), c, { hull: 1.03, outline: 0 }); m.position.set(x, y, z); if (!pm) box.add(m); return m; };
  panel(W, t, D, 0, t / 2, 0, dk);
  panel(W, H, t, 0, H / 2, D / 2 - t / 2);
  panel(W, H, t, 0, H / 2, -D / 2 + t / 2, dk);
  panel(t, H, D, -W / 2 + t / 2, H / 2, 0);
  panel(t, H, D, W / 2 - t / 2, H / 2, 0);
  // tape stripe and a little smiley label on the front
  const tape = new T.Mesh(geo.box(0.32, H * 0.6, 0.02), basic(0xf4e3c0));
  tape.position.set(0, H * 0.7, D / 2 + 0.01);
  if (!pm) box.add(tape);
  const lid = new T.Group();
  const lidM = mesh(geo.box(W + 0.06, t, D + 0.06), col, { hull: 1.03, outline: 0 });
  lidM.position.z = D / 2;
  lid.add(lidM);
  lid.position.set(0, H, -D / 2);
  if (!pm) box.add(lid);
  if (mode === 'open') {
    lid.rotation.x = -2.5; // flipped open, hanging down the back
    const inside = new T.Mesh(geo.box(W - 2 * t, 0.02, D - 2 * t), basic(0x8a5a32));
    inside.position.y = t + 0.01;
    if (!pm) box.add(inside);
    g.userData.zones = { in: { pos: V(0, 1.8, 0), rest: V(0, t, 0.05), radius: 1.5, rim: H, fit: 0.9 } };
  } else {
    g.userData.zones = {
      on: { pos: V(0, 2.1, 0), rest: V(0, H + t, 0), radius: 1.3 },
      under: { pos: V(0, 0.5, 1.2), rest: V(0, 0, 0), radius: 1.2, fit: 0.85 },
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
  const pm = propModel('prop_boat'); // Blender boat (same size), else the code-built hull
  if (pm) boat.add(pm); else boat.add(hull, inner, rim, stripe, mast, flag);
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
  const pm = propModel('prop_castle'); // Blender sandcastle (same size) replaces the code-built one
  if (pm) { c.clear(); c.add(pm); }
  g.add(c, blobShadow(1.6));
  g.userData.zones = { on: { pos: V(0, 2.75, 0), rest: V(0, 2.24, 0), radius: 1.35 } };   // feet on the battlements
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
  const pm = propModel('prop_parasol'); // Blender canopy (same size)
  if (pm) { canopy.clear(); canopy.add(pm); }
  const pp = propModel('prop_pole'); // Blender pole (foot at the sand) in a holder, so the 'under' gag can still squash it
  const pole2 = pp ? new T.Group() : null;
  if (pp) { pp.position.y = -POLE / 2; pole2.add(pp); pole2.position.y = POLE / 2; }
  canopy.position.y = POLE;
  const shade = blobShadow(1.9);
  shade.material = shade.material.clone();
  g.add(pole2 || pole, canopy, shade);
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
      const pl = pole2 || pole;
      await s.anim(0.22, (e) => { canopy.position.y = POLE - e * 1.55; pl.scale.y = 1 - e * 0.5; pl.position.y = POLE * pl.scale.y / 2; }, Ease.out);
    },
    tip(s) { return s.anim(0.15, (_, p) => { canopy.rotation.x = -Math.sin(p * Math.PI) * 0.12; }); },
    reset() { const pl = pole2 || pole; canopy.position.y = POLE; canopy.rotation.x = 0; pl.scale.y = 1; pl.position.y = POLE / 2; },
    hides: false,
  };
  g.userData.wobble = canopy;
  return g;
}

function makeTowelProp() {
  const g = new T.Group();
  const towel = new T.Group();
  const tm = propModel('prop_towel', { tint: C.pink, size: [3.1 / 3, 1, 2.1 / 2] }); // Blender towel: pink and white bands, tassels
  if (tm) {
    const wl = tm.userData.model.userData.layers.white;
    if (wl) wl.outline.visible = false;
    tm.position.y = 0.03;
    towel.add(tm);
    towel.rotation.y = 0.12;
    g.add(towel);
    g.userData.zones = { on: { pos: V(0, 0.9, 0.3), rest: V(0, 0.1, 0.1), radius: 1.6 } };
    g.userData.wobble = towel;
    return g;
  }
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

// A striped deck chair: sit ON the seat, or scoot UNDER it (between the legs).
function makeChairProp() {
  const g = new T.Group();
  const ch = new T.Group();
  const wood = 0xc98b4f, SEAT = 1.15, W = 2.1;
  for (const x of [-W / 2 + 0.1, W / 2 - 0.1]) for (const z of [-0.65, 0.65]) {
    const leg = mesh(geo.box(0.12, SEAT, 0.12), wood, { hull: 1.1, outline: 0 });
    leg.position.set(x, SEAT / 2, z);
    ch.add(leg);
  }
  const cols = [C.blue, 0xffffff, C.blue, 0xffffff, C.blue];
  for (let i = 0; i < 5; i++) {
    const s = mesh(geo.box(W / 5, 0.1, 1.5), cols[i], { outline: 0 });
    s.position.set(-W / 2 + W / 10 + (i * W) / 5, SEAT, 0);
    ch.add(s);
    const b = mesh(geo.box(W / 5, 1.4, 0.08), cols[i], { outline: 0 });
    b.position.set(-W / 2 + W / 10 + (i * W) / 5, SEAT + 0.62, -0.85);
    b.rotation.x = -0.32;
    ch.add(b);
  }
  const frame = new T.Mesh(geo.box(W + 0.08, 0.14, 1.58), basic(0x3a2838));
  frame.position.y = SEAT - 0.02;
  const arm = mesh(geo.box(0.12, 0.1, 1.5), wood, { hull: 1.1, outline: 0 });
  arm.position.set(-W / 2 - 0.02, SEAT + 0.45, 0);
  const arm2 = arm.clone(); arm2.position.x = W / 2 + 0.02;
  ch.add(frame, arm, arm2);
  const pm = propModel('prop_chair'); // Blender deck chair (same size) replaces the code-built one
  if (pm) { ch.clear(); ch.add(pm); }
  g.add(ch, blobShadow(1.3));
  g.userData.zones = {
    // fit: the friend sits between the arm rests / between the legs, claws clear of the frame (a crab is 3.5 wide)
    on: { pos: V(0, 2.1, 0.1), rest: V(0, SEAT + 0.06, 0.2), radius: 1.3, fit: 0.52 },
    under: { pos: V(0, 0.5, 1.3), rest: V(0, 0, 0.1), radius: 1.2, fit: 0.5 },
  };
  g.userData.cover = {
    async lift() {},
    async drop(s) { sfx.thunk(); await s.anim(0.18, (_, p) => { const k = Math.sin(p * Math.PI); ch.scale.set(1 + k * 0.05, 1 - k * 0.08, 1 + k * 0.05); }); ch.scale.setScalar(1); },
    tip(s) { return s.anim(0.15, (_, p) => { ch.rotation.z = Math.sin(p * Math.PI * 2) * 0.03; }); },
    reset() { ch.scale.setScalar(1); ch.rotation.z = 0; },
    hides: false,
  };
  g.userData.phys = [{ box: [0, SEAT, 0], size: [W, 0.12, 1.5] }];
  g.userData.wobble = ch;
  return g;
}

// A swim ring lying on the sand: hop IN the hole.
function makeRingProp() {
  const g = new T.Group();
  const ring = new T.Group();
  const cols = [C.red, 0xffffff];
  for (let i = 0; i < 8; i++) {
    const seg = mesh(geo.torus(1.05, 0.36, Math.PI / 4 + 0.01, 10, 8), cols[i % 2], { outline: 0.02 });
    seg.rotation.z = (i / 8) * Math.PI * 2;
    ring.add(seg);
  }
  const rm = propModel('prop_ring'); // Blender swim ring (modelled lying flat: stand it in the old torus plane)
  if (rm) { ring.clear(); rm.rotation.x = Math.PI / 2; ring.add(rm); }
  ring.rotation.x = -Math.PI / 2 + 0.25; // tilted toward you so the hole reads
  ring.position.y = 0.42;
  const hole = new T.Mesh(geo.circle(0.7, 24), toon(0x7fd8ee));
  hole.rotation.x = -Math.PI / 2 + 0.25;
  hole.position.y = 0.2;
  g.add(hole, ring, blobShadow(1.4));
  g.userData.zones = { in: { pos: V(0, 1.4, 0), rest: V(0, 0.05, 0), radius: 1.5, rim: 0.5, fit: 0.85 } };
  g.userData.wobble = ring;
  g.userData.spin = ring;
  return g;
}

// A woven picnic basket with a handle and a checked cloth: IN.
function makeBasketProp() {
  const g = new T.Group();
  const b = new T.Group();
  const W = 2.0, H = 1.0, D = 1.5, t = 0.1, col = 0xd99a4e, dk = 0xb9783a;
  const panel = (w, h, d, x, y, z, c = col) => { const m = mesh(geo.box(w, h, d), c, { hull: 1.03, outline: 0 }); m.position.set(x, y, z); b.add(m); };
  panel(W, t, D, 0, t / 2, 0, dk);
  panel(W, H, t, 0, H / 2, D / 2 - t / 2);
  panel(W, H, t, 0, H / 2, -D / 2 + t / 2, dk);
  panel(t, H, D, -W / 2 + t / 2, H / 2, 0);
  panel(t, H, D, W / 2 - t / 2, H / 2, 0);
  for (let i = 0; i < 3; i++) { // woven stripes on the front
    const s = new T.Mesh(geo.box(W - 0.05, 0.06, 0.02), basic(dk));
    s.position.set(0, 0.25 + i * 0.25, D / 2 + 0.01);
    b.add(s);
  }
  const handle = mesh(geo.torus(0.85, 0.06, Math.PI, 6, 20), dk, { outline: 0.012 });
  handle.position.y = H;
  // checked cloth peeking over the rim
  for (let i = 0; i < 4; i++) {
    const c = mesh(geo.box(0.36, 0.05, 0.36), i % 2 ? 0xffffff : C.red, { outline: 0 });
    c.position.set(-0.75 + i * 0.12, H + 0.02, -0.5 + i * 0.05);
    c.rotation.set(0.3, i, 0.2);
    b.add(c);
  }
  b.add(handle);
  const pm = propModel('prop_picnic'); // Blender picnic basket (same size)
  if (pm) { b.clear(); b.add(pm); }
  g.add(b, blobShadow(1.2));
  // in the basket the friend sits low (fit), so its eyes stay under the arched handle
  g.userData.zones = { in: { pos: V(0, 1.6, 0), rest: V(0, 0.12, 0.12), radius: 1.4, rim: H, fit: 0.7 } };
  g.userData.phys = [{ cont: [0, 0, 0], r: 0.7, h: H }];
  g.userData.wobble = b;
  return g;
}

// A treasure chest: open (IN, gold inside) or shut (ON the lid).
function makeChestProp(mode) {
  const g = new T.Group();
  const c = new T.Group();
  const W = 2.1, H = 1.05, D = 1.4, t = 0.1, col = 0x9a5a2e, gold = 0xffc23f;
  const panel = (w, h, d, x, y, z, k = col) => { const m = mesh(geo.box(w, h, d), k, { hull: 1.03, outline: 0 }); m.position.set(x, y, z); c.add(m); };
  panel(W, t, D, 0, t / 2, 0);
  panel(W, H, t, 0, H / 2, D / 2 - t / 2);
  panel(W, H, t, 0, H / 2, -D / 2 + t / 2);
  panel(t, H, D, -W / 2 + t / 2, H / 2, 0);
  panel(t, H, D, W / 2 - t / 2, H / 2, 0);
  for (const x of [-0.65, 0.65]) panel(0.14, H + 0.02, D + 0.04, x, H / 2, 0, gold);
  const lock = mesh(geo.box(0.26, 0.3, 0.08), gold, { hull: 1.08, outline: 0 });
  lock.position.set(0, H - 0.1, D / 2 + 0.04);
  c.add(lock);
  const lid = new T.Group();
  const top = mesh(new T.CylinderGeometry(D / 2, D / 2, W, 16, 1, false, 0, Math.PI), col, { outline: 0.025 });
  top.rotation.z = Math.PI / 2;
  top.position.z = D / 2;
  lid.add(top);
  lid.position.set(0, H, -D / 2);
  c.add(lid);
  if (mode === 'open') {
    lid.rotation.x = -1.75;
    for (let i = 0; i < 7; i++) {
      const coin = makeCoin(0.16);
      coin.position.set(-0.7 + (i % 4) * 0.45, H - 0.08 + (i % 2) * 0.05, -0.2 + Math.floor(i / 4) * 0.3);
      coin.rotation.set(-1.0 + (i % 3) * 0.25, 0.4 * i, 0.3 * i);
      coin.userData.coin = true;
      c.add(coin);
    }
    g.userData.zones = { in: { pos: V(0, 1.7, 0), rest: V(0, 0.15, 0.05), radius: 1.4, rim: H, fit: 0.8 } };
    g.userData.phys = [{ cont: [0, 0, 0], r: 0.6, h: H }];
  } else {
    g.userData.zones = { on: { pos: V(0, 2.4, 0), rest: V(0, H + D / 2 - 0.05, 0), radius: 1.3 } };
    g.userData.phys = [{ box: [0, (H + D / 2) / 2, 0], size: [W, H + D / 2, D] }];
  }
  const pm = propModel('prop_chest'); // Blender chest (same size, lid on a bone); keeps the code-built coins
  if (pm) {
    const coins = c.children.filter((o) => o.userData.coin);
    c.clear(); c.add(pm, ...coins);
    g.userData.coins = coins;
    if (mode === 'open') pm.userData.bones.lid.rotation.x = -1.75;
  }
  g.add(c, blobShadow(1.3));
  g.userData.wobble = c;
  g.userData.lid = pm ? pm.userData.bones.lid : lid;
  return g;
}

// A big floppy sun hat on the sand: ON the crown, or hide UNDER it.
function makeHatProp() {
  const g = new T.Group();
  const holder = new T.Group();
  const h = new T.Group();
  const straw = 0xf2d16b;
  const crown = mesh(new T.SphereGeometry(0.95, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), straw, { outline: 0.03 });
  crown.scale.y = 1.05;
  crown.position.y = 0.18;
  const brim = mesh(geo.cyl(1.75, 1.85, 0.12, 32), straw, { outline: 0.025 });
  brim.position.y = 0.12;
  const band = mesh(geo.cyl(0.97, 0.97, 0.22, 24), C.pink, { outline: 0 });
  band.position.y = 0.3;
  const bow = mesh(geo.sphere(0.2, 10, 8), C.pink, { outline: 0.015 });
  bow.position.set(0.55, 0.35, 0.75);
  bow.scale.set(1.5, 0.8, 0.6);
  h.add(crown, brim, band, bow);
  const pm = propModel('prop_hat'); // Blender sun hat (same size)
  if (pm) { h.clear(); h.add(pm); }
  h.position.z = 1.0;
  holder.add(h);
  holder.position.z = -1.0;
  g.add(holder, blobShadow(1.6));
  g.userData.zones = {
    on: { pos: V(0, 1.9, 0), rest: V(0, 1.15, 0), radius: 1.2 },
    under: { pos: V(0, 0.5, 1.5), rest: V(0, 0, 0), radius: 1.3, fit: 0.75 },
  };
  g.userData.cover = liftCover(holder, 1.8, 0.35);
  g.userData.phys = [{ box: [0, 0.6, 0], size: [2.0, 1.1, 2.0] }];
  g.userData.wobble = h;
  return g;
}

const MAKERS = { bucket: makeBucketProp, box: makeBoxProp, boat: makeBoatProp, castle: makeCastleProp, umbrella: makeUmbrellaProp, towel: makeTowelProp, chair: makeChairProp, ring: makeRingProp, basket: makeBasketProp, chest: makeChestProp, hat: makeHatProp };
// what the caption calls each place (short words, so the prompt stays on one line)
export const PROP_NAME = { bucket: 'bucket', box: 'box', boat: 'boat', castle: 'castle', umbrella: 'umbrella', towel: 'towel', chair: 'chair', ring: 'ring', basket: 'basket', chest: 'chest', hat: 'hat' };

// which places a prop offers, without building it
export function zoneIds(kind, mode) {
  if (kind === 'bucket') return mode === 'down' ? ['on', 'under'] : ['in'];
  if (kind === 'box') return mode === 'open' ? ['in'] : ['on', 'under'];
  if (kind === 'chest') return mode === 'open' ? ['in'] : ['on'];
  return { boat: ['in'], castle: ['on'], umbrella: ['on', 'under'], towel: ['on'], chair: ['on', 'under'], ring: ['in'], basket: ['in'], hat: ['on', 'under'] }[kind];
}

// Static physics shapes (prop-local) for the loose beach bits to land on / in, for the older props.
const PHYS = {
  'bucket:up': [{ cont: [0, 0, 0], r: 1.05, h: 1.65 }],
  'bucket:down': [{ box: [0, 0.82, 0], size: [2.3, 1.65, 2.3] }],
  'box:open': [{ cont: [0, 0, 0], r: 0.8, h: 1.35 }],
  'box:shut': [{ box: [0, 0.7, 0], size: [2.3, 1.4, 1.8] }],
  'boat:': [{ cont: [0, 0.1, 0], r: 0.95, h: 0.85 }],
  'castle:': [{ box: [0, 1.05, 0], size: [2.6, 2.1, 2.6] }],
  'umbrella:': [{ box: [0, 1.5, 0], size: [0.16, 3.0, 0.16] }],
};

export function makeProp(kind, mode) {
  const g = MAKERS[kind](mode);
  g.userData.prop = kind;
  g.userData.mode = mode;
  g.userData.phys ||= PHYS[`${kind}:${mode || ''}`] || [];
  return g;
}

// ---- loose beach bits (rigid bodies): shells, starfish, beach balls, coins, snacks (Blender models) ----
const SHELLS = [0xffb6c9, 0xffd9a8, 0xd8b6ff, 0xffffff, 0xa8e0ff];
const BALLS = [[C.red, C.yellow, C.blue], [C.green, C.pink, C.yellow], [C.purple, C.orange, C.blue]];
const pick = (a) => a[Math.floor(Math.random() * a.length)];
export function makeBit(kind) {
  const g = new T.Group();
  let m, shape = 'auto', r = null;
  if (kind === 'shell') { m = makeShell(pick(SHELLS), 0.6); r = null; }
  else if (kind === 'star') { m = makeSeaStar(pick([0xff8a5c, 0xffc23f, 0xff6f9c]), 0.3); m.rotation.x = -Math.PI / 2 + 0.25; }
  else if (kind === 'ball') { m = makeBeachBall(0.38, pick(BALLS)); r = 0.38; }
  else if (kind === 'coin') { m = makeCoin(0.18); }
  else if (kind === 'apple' || kind === 'melon') { m = makeMelon(0.32); }
  else if (kind === 'drop') { m = makeWaterDrop(0.13); r = 0.13; }
  else { m = makeSandwich(0.62); }   // sandwich
  g.add(m);
  g.userData.bit = kind;
  g.userData.shape = r ? 'ball' : shape;
  g.userData.r = r;
  return g;
}

// ---- gags ----

// the grumpy rain cloud (Blender, with a face) and the rainbow that follows it; code-built fallbacks
export function makeRainCloud() {
  const pm = propModel('prop_cloud');
  if (pm) return pm;
  const cloud = new T.Group();
  for (const [x, y, r] of [[-0.8, 0, 0.7], [0, 0.3, 0.9], [0.9, 0, 0.65], [0.2, -0.25, 0.7]]) {
    const p = mesh(geo.sphere(r, 14, 10), 0xc9d3e6, { outline: 0.03 });
    p.position.set(x, y, 0);
    cloud.add(p);
  }
  return cloud;
}
export function makeRainbow() {
  const pm = propModel('prop_rainbow');
  if (pm) return pm;
  const bow = new T.Group();
  [0xff5a5a, 0xffb020, 0xffe14d, 0x5fd068, 0x4a90ff, 0xa77bff].forEach((c, i) => bow.add(new T.Mesh(geo.torus(3.2 - i * 0.22, 0.12, Math.PI, 6, 40), basic(c))));
  return bow;
}

// "In": a crown of water drops bursts up around the rim.
export function splashCrown(s, parent, center, r, color = 0x7fd0ff) {
  sfx.splash();
  const drops = [];
  const n = 12;
  for (let i = 0; i < n; i++) {
    const d = makeWaterDrop(0.085 + (i % 3) * 0.025, i % 3 ? color : 0xdff6ff);   // small, so the crown never hides the friend's face
    const a = (i / n) * Math.PI * 2;
    d.userData.a = a;
    d.userData.k = d.scale.x;
    d.position.copy(center);
    parent.add(d);
    drops.push(d);
  }
  // a tall centre spout
  const spout = makeWaterDrop(0.16, color);
  spout.userData.k = spout.scale.x;
  spout.position.copy(center);
  parent.add(spout);
  return s.anim(0.6, (_, p) => {
    for (const d of drops) {
      const rr = r * (0.95 + p * 1.1);   // flies outward, clear of the friend in the middle
      d.position.set(center.x + Math.cos(d.userData.a) * rr, center.y + Math.sin(p * Math.PI) * 1.5 - p * 0.4, center.z + Math.sin(d.userData.a) * rr * 0.7);
      d.scale.setScalar(d.userData.k * Math.max(0.01, 1 - p * p));
    }
    spout.position.y = center.y + Math.sin(p * Math.PI) * 2.0;
    const k = spout.userData.k;
    spout.scale.set(k * (1 - p * 0.6), k * (1 + Math.sin(p * Math.PI) * 1.2), k * (1 - p * 0.6));
  }).then(() => { for (const d of drops) parent.remove(d); parent.remove(spout); });
}
