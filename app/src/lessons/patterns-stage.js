// Pattern parade — the three stages the pattern stands on, one per level:
//  Level 1: a boardwalk on posts (the parade marches in, the things drop onto the planks)
//  Level 2: a toy train on a wooden track (each thing rides in its own wagon)
//  Level 3: a row of striped circus podiums that pop out of the sand
// Every builder returns a group in world space; userData.statics = physics boxes [cx, cy, cz, sx, sy, sz] (world).
// The stages are Blender models (tools/blender/creatures/prop_boardwalk, prop_track, prop_traincart, prop_engine,
// prop_podium); each builder keeps its old code model as a fallback.
// Wheels: userData.wheels = bones (or meshes) and userData.spin(angle) turns them all.
import * as T from '../three.js';
import { mesh, geo, basic } from '../engine/toon.js';
import { C } from '../engine/actors.js';
import { propModel } from '../engine/prop-models.js';

const WOOD = 0xc98b4f, WOOD_DK = 0xa86f3a;

export function makeBoardwalk(rowY, rowZ) {
  const g = new T.Group();
  const pm = propModel('prop_boardwalk', { size: [1, rowY / 2.25, 1] });
  if (pm) {
    g.add(pm);
    g.position.z = rowZ;
    g.userData.statics = [[0, rowY - 0.15, rowZ, 13, 0.3, 1.4]];
    g.userData.surf = 0;
    return g;
  }
  const plank = mesh(geo.box(13, 0.3, 1.4), WOOD, { hull: 1.02 });
  plank.position.y = rowY - 0.15;
  g.add(plank);
  for (let i = 0; i < 12; i++) { // plank seams
    const seam = new T.Mesh(geo.box(0.04, 0.31, 1.41), basic(WOOD_DK));
    seam.position.set(-6 + i * 1.1, rowY - 0.15, 0);
    g.add(seam);
  }
  for (const x of [-5.8, -2, 2, 5.8]) {
    const post = mesh(geo.cyl(0.14, 0.16, rowY, 10), WOOD_DK, { outline: 0.02 });
    post.position.set(x, rowY / 2 - 0.15, 0);
    g.add(post);
  }
  g.position.z = rowZ;
  g.userData.statics = [[0, rowY - 0.15, rowZ, 13, 0.3, 1.4]];
  g.userData.surf = 0;
  return g;
}

// the track the train runs on: a raised wooden rail with sleepers
export function makeTrack(rowY, rowZ) {
  const g = new T.Group();
  const pm = propModel('prop_track', { size: [1, (rowY - 0.41) / 1.84, 1] });
  if (pm) { g.add(pm); g.position.z = rowZ; return g; }
  const beam = mesh(geo.box(14, 0.22, 1.0), WOOD_DK, { hull: 1.02 });
  beam.position.y = rowY - 0.36;
  g.add(beam);
  for (const z of [-0.32, 0.32]) {
    const rail = mesh(geo.box(14, 0.08, 0.08), 0x8a8fa0, { hull: 1.1, outline: 0 });
    rail.position.set(0, rowY - 0.2, z);
    g.add(rail);
  }
  for (const x of [-6, -3, 0, 3, 6]) {
    const leg = mesh(geo.box(0.2, rowY - 0.45, 0.2), WOOD, { hull: 1.06, outline: 0 });
    leg.position.set(x, (rowY - 0.45) / 2, 0);
    g.add(leg);
  }
  g.position.z = rowZ;
  return g;
}

// one open wagon; origin on the rails, things sit on its floor at y = userData.surf
export function makeCart(col) {
  const g = new T.Group();
  const pm = propModel('prop_traincart', { tint: col });
  if (pm) {
    g.add(pm);
    const b = pm.userData.bones;
    const wheels = [b.wheelF, b.wheelB].filter(Boolean);
    g.userData = { surf: 0.29, wheels, half: 0.62, spin: (a) => wheels.forEach((w) => (w.rotation.z = a)) };
    return g;
  }
  const bed = mesh(geo.box(1.36, 0.18, 1.0), col, { hull: 1.04, outline: 0 });
  bed.position.y = 0.2;
  g.add(bed);
  for (const x of [-0.64, 0.64]) {
    const w = mesh(geo.box(0.08, 0.42, 1.0), col, { hull: 1.06, outline: 0 });
    w.position.set(x, 0.42, 0);
    g.add(w);
  }
  const front = mesh(geo.box(1.36, 0.32, 0.06), 0xffffff, { hull: 1.06, outline: 0 });
  front.position.set(0, 0.36, 0.52);
  g.add(front);
  const wheels = [];
  for (const x of [-0.4, 0.4]) {
    const wh = mesh(geo.cyl(0.17, 0.17, 0.1, 14), 0x3a2838, { outline: 0.01 });
    wh.rotation.x = Math.PI / 2;
    wh.position.set(x, 0.05, 0.52);
    g.add(wh);
    wheels.push(wh);
  }
  const hitch = new T.Mesh(geo.box(0.32, 0.06, 0.06), basic(0x3a2838));
  hitch.position.set(-0.82, 0.18, 0);
  g.add(hitch);
  g.userData = { surf: 0.29, wheels, half: 0.62, spin: (a) => wheels.forEach((w) => (w.rotation.y = a)) };
  return g;
}

export function makeEngine(col) {
  const g = new T.Group();
  const pm = propModel('prop_engine', { tint: col });
  if (pm) {
    g.add(pm);
    const b = pm.userData.bones;
    const wheels = [b.wheelF, b.wheelB].filter(Boolean);
    g.userData = { wheels, chimney: b.chimney || new T.Object3D(), seat: new T.Vector3(-0.48, 0.36, 0), spin: (a) => wheels.forEach((w) => (w.rotation.z = a)) };
    return g;
  }
  const body = mesh(geo.cyl(0.42, 0.42, 1.1, 16), col, { outline: 0.025 });
  body.rotation.z = Math.PI / 2;
  body.position.set(0.25, 0.55, 0);
  const nose = mesh(geo.cyl(0.44, 0.44, 0.1, 16), 0x3a2838, { outline: 0 });
  nose.rotation.z = Math.PI / 2;
  nose.position.set(0.82, 0.55, 0);
  const chimney = mesh(geo.cyl(0.13, 0.2, 0.5, 10), 0x3a2838, { outline: 0.015 });
  chimney.position.set(0.55, 1.1, 0);
  const cab = mesh(geo.box(0.7, 0.9, 0.95), C.red, { hull: 1.04, outline: 0 });
  cab.position.set(-0.45, 0.65, 0);
  const roof = mesh(geo.box(0.85, 0.1, 1.1), 0x3a2838, { hull: 1.06, outline: 0 });
  roof.position.set(-0.45, 1.15, 0);
  const base = mesh(geo.box(1.7, 0.18, 0.95), 0x3a2838, { hull: 1.04, outline: 0 });
  base.position.set(0.05, 0.16, 0);
  g.add(body, nose, chimney, cab, roof, base);
  const wheels = [];
  for (const x of [-0.45, 0.5]) {
    const wh = mesh(geo.cyl(0.24, 0.24, 0.1, 14), C.red, { outline: 0.012 });
    wh.rotation.x = Math.PI / 2;
    wh.position.set(x, 0.1, 0.5);
    g.add(wh);
    wheels.push(wh);
  }
  g.userData = { wheels, chimney, seat: new T.Vector3(-0.45, 0.6, 0.1), spin: (a) => wheels.forEach((w) => (w.rotation.y = a)) };
  return g;
}

// a striped circus podium standing on the sand; things stand on its top at world y = rowY
export function makePodium(col, rowY) {
  const g = new T.Group();
  const p = new T.Group();
  const pm = propModel('prop_podium', { tint: col, size: [1, rowY / 2.25, 1] });
  if (pm) {
    p.add(pm);
    g.add(p);
    g.userData = { inner: p, surf: 0 };
    return g;
  }
  const h = rowY - 0.12;
  const body = mesh(geo.cyl(0.36, 0.5, h, 18), col, { outline: 0.025 });
  body.position.y = h / 2;
  p.add(body);
  for (let i = 1; i < 3; i++) { // fat white candy stripes
    const r = 0.5 - (0.14 * i) / 3 + 0.02;
    const band = mesh(geo.cyl(r - 0.02, r, 0.22, 18), 0xffffff, { outline: 0 });
    band.position.y = (h * i) / 3;
    p.add(band);
  }
  const star = new T.Mesh(new T.CircleGeometry(0.18, 5), basic(C.yellow));
  star.position.set(0, h * 0.5, 0.46);
  star.rotation.x = -0.1;
  p.add(star);
  const top = mesh(geo.cyl(0.66, 0.6, 0.14, 20), C.yellow, { outline: 0.02 });
  top.position.y = h + 0.05;
  for (let i = 0; i < 6; i++) { // little light bulbs around the top
    const a = (i / 6) * Math.PI * 2;
    const b = mesh(geo.sphere(0.06, 8, 6), 0xfff6c0, { outline: 0 });
    b.position.set(Math.cos(a) * 0.66, h + 0.05, Math.sin(a) * 0.66);
    p.add(b);
  }
  p.add(top);
  g.add(p);
  g.userData = { inner: p, surf: 0 };
  return g;
}

// the striped towel the choices sit on (w x d, lying on the sand); setColor(c) repaints its coloured stripes
export function makeChoiceTowel(w = 7, d = 1.8, col = 0x4ab0ff) {
  const g = new T.Group();
  const pm = propModel('prop_towel', { tint: col, size: [w / 3, 1, d / 2] });
  if (pm) {
    g.add(pm);
    const sk = pm.userData.model.userData.skin;
    const wl = pm.userData.model.userData.layers.white;
    if (wl) wl.outline.visible = false; // clean printed stripes (no ink line round each one)
    g.userData.setColor = (c) => sk.material.color.setHex(c);
    return g;
  }
  const stripes = [];
  const n = Math.round(w);
  for (let i = 0; i < n; i++) {
    const stripe = new T.Mesh(geo.box(w / n, 0.06, d), i % 2 ? basic(0xffffff) : new T.MeshBasicMaterial({ color: col }));
    stripe.position.x = -w / 2 + (w / n) * (i + 0.5);
    stripe.position.y = 0.03;
    g.add(stripe);
    if (!(i % 2)) stripes.push(stripe);
  }
  g.userData.setColor = (c) => stripes.forEach((s) => s.material.color.setHex(c));
  return g;
}

// the parade leader's flag on a stick (origin at the foot of the stick), flying backwards (toward -x)
export function makeParadeFlag(col) {
  const pm = propModel('prop_flag', { tint: col });
  if (pm) { pm.userData.model.rotation.y = Math.PI; return pm; }
  const g = new T.Group();
  const stick = mesh(geo.cyl(0.035, 0.035, 1.5, 6), 0xa86f3a, { outline: 0.012 });
  stick.position.y = 0.75;
  const flag = new T.Mesh(geo.box(0.55, 0.36, 0.03), basic(col));
  flag.position.set(0.28, 1.3, 0);
  g.add(stick, flag);
  return g;
}
