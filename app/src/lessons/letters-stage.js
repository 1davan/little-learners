// Letter friends: the station and everything in it. Builders for the letter friends (Blender letters with a code face
// and two shoes), the things (every word's model, normalised to one size), the train (engine + carriages with flaps,
// livery per level), the trunk (base + hinged lid), the platform, rug, track, sign and the lowercase plates.
// Layout (world units, ground y 0, the camera looks toward -z): track along x at z -1.6, the train heads left (-x);
// the rug's three spots at x -1, 0, 1 (z 0.9); the trunk (the box) at (2.8, 1.3), right of the rug; Pip beside it.
import * as T from '../three.js';
import { propModel } from '../engine/prop-models.js';
import { makeCreature, hasCreature } from '../engine/creature.js';
import { makeFace } from '../engine/faces.js';
import { toonUnique, mesh, geo, basic, blobShadow } from '../engine/toon.js';
import { LETTERS } from './bricks-letters.js';
import { LETTER_COL, FACE } from './letters-data.js';

export const PY = 0.14;                  // platform top
export const RUG_Y = PY + 0.03;          // things stand on the rug here
export const TRACK_Z = -1.6, TRAIN_Y = 0.07;
export const PITCH = 2.2;                // carriage spacing
export const STATION_X = -0.6;           // the active (single) carriage stops here
export const SPOTS = [-1, 0, 1].map((x) => new T.Vector3(x, RUG_Y, 0.9));
export const TRUNK = { pos: new T.Vector3(2.8, PY, 1.3), ry: -0.45 };   // right of the rug, in front: never over a carriage
export const FRIEND_WAIT = new T.Vector3(1.3, PY, -0.66);   // where a friend stands on the platform (Level 1 Meet)
export const SEATS = [-0.6, 0, 0.6].map((x) => new T.Vector3(x, 0.47, 0.3));   // carriage-local
export const DECK = new T.Vector3(0, 1.0, -0.3);                                 // carriage-local, the friend's spot
export const THING_H = 0.8, SEAT_K = 0.55 / 0.8;
export const SHOE_H = 0.1;

const lighten = (c, k) => { const o = new T.Color(c); o.lerp(new T.Color(0xffffff), k); return o.getHex(); };
const darken = (c, k) => { const o = new T.Color(c); o.multiplyScalar(1 - k); return o.getHex(); };

// tint one layer of a Blender model (the skin is tinted by propModel's tint)
function tintLayer(w, name, col) {
  const l = w?.userData.model?.userData.layers?.[name];
  if (l) l.mesh.material = toonUnique(col, { vertexColors: true });
}

// ---------------- the letter friends ----------------
// A Group standing on its shoes at y 0 (local), facing +z. userData: L, body (the pivot that rocks), face, shoes,
// W (letter width), top (height).
export function makeFriend(L) {
  const g = new T.Group();
  const body = new T.Group();
  g.add(body);
  const col = LETTER_COL[L];
  const w = propModel('prop_lt_' + L, { tint: col });
  let W = 0.9, H = 1.08, shoes = [-0.08, 0.08], D = 0.125;
  if (w) {
    const x = w.userData.model.userData;
    W = x.W ?? W; H = x.H ?? H; D = x.depth ?? D;
    if (Array.isArray(x.shoes)) shoes = x.shoes;
    w.position.y = SHOE_H - 0.012;
    w.userData.model.userData.noLook = true;
    body.add(w);
  } else {
    // never a hole: a soft block with the letter's colour
    const b = mesh(geo.box(0.7, 1.0, 0.24), col, { outline: 0.03 }); b.position.y = 0.6; body.add(b);
  }
  // the face
  const F = FACE[L] || { x: 0, y: 0.54, R: 0.2 };
  const face = makeFace(F.R, { eyeSize: 1.5, eyeX: 0.3, cheeks: !!F.cheeks });
  face.position.set(F.x, SHOE_H - 0.012 + F.y, D - F.R * 0.93);
  body.add(face);
  // two shoes, a deeper shade of the letter's colour
  const sh = [];
  for (const sx of shoes) {
    const s = propModel('prop_lt_shoe', { tint: darken(col, 0.28) });
    const o = s || mesh(geo.box(0.12, 0.09, 0.2), darken(col, 0.28), { outline: 0.012 });
    o.position.set(sx, 0, 0.0);
    o.scale.setScalar(1.2);
    o.userData.x0 = sx;
    g.add(o); sh.push(o);
  }
  const shadow = blobShadow(Math.max(0.35, W * 0.42));
  shadow.position.y = 0.005;
  g.add(shadow);
  g.userData = { L, body, face, shoes: sh, W, top: SHOE_H + H, letter: w, kind: 'friend_' + L, col };
  return g;
}

// ---------------- the things ----------------
function boxOf(o) {
  o.updateMatrixWorld(true);
  const b = new T.Box3();
  o.traverse((m) => { if (m.isMesh && !m.userData.outline && m.visible) b.expandByObject(m); });
  return b;
}
// docs/design/VOCAB.md: a word's own word-card model (prop_word_<word>) wins whenever it is built; then the listed ones
export function thingKind(def) {
  if (!def.creature && !def.own) { const k = 'prop_word_' + def.w.toLowerCase().replace(/[^a-z]/g, ''); if (hasCreature(k)) return k; }
  for (const k of def.kinds) if (hasCreature(k)) return k;
  return null;
}
export const thingReady = (def) => !!thingKind(def) && (!def.parts || def.parts.every((k) => hasCreature(k)));

// A thing as a Group whose origin is the bottom centre of its model, about THING_H tall (and never wider than 0.86 or
// deeper than 0.8). userData: inner, def, k (scale of inner), creature (walks), h, w.
export function makeThing(def) {
  const kind = thingKind(def);
  let inner = null, creature = false;
  if (kind && def.creature) { inner = makeCreature(kind); creature = true; }
  else if (kind) {
    inner = propModel(kind);
    if (inner?.userData.model) inner.userData.model.userData.noLook = true;
  }
  if (!inner) {
    inner = new T.Group();
    const s = mesh(geo.sphere(0.4, 24, 18), 0xffb04a, { outline: 0.03 }); s.position.y = 0.4; inner.add(s);
  }
  const g = new T.Group();
  g.add(inner);
  const b = boxOf(inner), sz = b.getSize(new T.Vector3());
  const k = Math.min((THING_H * (def.fit || 1)) / Math.max(0.01, sz.y), 0.86 / Math.max(0.01, sz.x), 0.8 / Math.max(0.01, sz.z));
  inner.scale.multiplyScalar(k);
  const b2 = boxOf(inner), c = b2.getCenter(new T.Vector3());
  inner.position.x -= c.x; inner.position.z -= c.z; inner.position.y -= b2.min.y;
  const s2 = b2.getSize(new T.Vector3());
  if (creature) { inner.userData.baseScale = inner.scale.x; }
  g.userData = { inner, def, k: inner.scale.x, creature, h: s2.y, w: s2.x, d: s2.z };
  return g;
}

// ---------------- the train ----------------
export const LIVERY = [
  { body: 0xff5a4a, trim: 0xffd23f, engine: 0xff5a4a },   // Level 1: red and yellow
  { body: 0x3fbf5a, trim: 0xfff2d6, engine: 0x3fbf5a },   // Level 2: green and cream
  { body: 0x3f8cff, trim: 0xffffff, engine: 0x3f8cff },   // Level 3: blue and white
];

// one carriage: origin on the rails under its middle. userData: flap (pivot; rotation.x 0 = shut, FLAP_OPEN = down),
// spin(a) turns the wheels, plate (the lowercase disc), seats (carriage-local), post (pennant top)
export const FLAP_OPEN = 1.42;
export function makeCarriage(lv, L = null) {
  const g = new T.Group();
  const w = propModel('prop_lt_carriage', { tint: lv.body });
  let wheels = [];
  if (w) {
    g.add(w);
    tintLayer(w, 'trim', lv.trim);
    tintLayer(w, 'post', lighten(lv.trim, 0.3));
    const bn = w.userData.bones || {};
    wheels = [bn.wheelF, bn.wheelB].filter(Boolean);
  } else {
    const b = mesh(geo.box(2.0, 0.55, 1.2), lv.body, { outline: 0.03 }); b.position.y = 0.6; g.add(b);
  }
  const pivot = new T.Group();
  pivot.position.set(0, 0.45, 0.6);
  g.add(pivot);
  const f = propModel('prop_lt_flap', { tint: lv.trim }) || mesh(geo.box(1.88, 0.22, 0.07), lv.trim, { outline: 0.02 });
  if (!f.userData.model) f.position.y = 0.11;
  pivot.add(f);
  let plate = null;
  if (L) { plate = lowerPlate(L); plate.position.set(0, 0.11, 0.05); plate.scale.setScalar(1.6); pivot.add(plate); }   // the tag, big, on the sill centre
  g.userData = { flap: pivot, wheels, spin: (a) => wheels.forEach((x) => (x.rotation.z = a)), plate, L, things: [], friend: null };
  return g;
}

// the whole train: the engine in front (left), carriages behind it at PITCH. Origin = carriage 0's middle on the rails.
export function makeTrain(lv, letters) {
  const g = new T.Group();
  const eng = propModel('prop_engine', { tint: lv.engine });
  const engG = new T.Group();
  if (eng) {
    eng.scale.setScalar(1.22);
    engG.add(eng);
    const bn = eng.userData.bones || {};
    engG.userData.wheels = [bn.wheelF, bn.wheelB].filter(Boolean);
    engG.userData.chimney = bn.chimney || null;
  } else {
    const b = mesh(geo.box(1.8, 1.2, 1.0), lv.engine, { outline: 0.03 }); b.position.y = 0.7; engG.add(b);
    engG.userData.wheels = [];
  }
  engG.rotation.y = Math.PI;      // the model faces +x; ours heads left
  engG.position.x = -2.45;
  g.add(engG);
  // a little coupling bar between the engine and the first carriage
  const bar = mesh(geo.box(0.3, 0.06, 0.08), 0x4a3a52, { outline: 0.01 });
  bar.position.set(-1.2, 0.33, 0);
  g.add(bar);
  const cars = letters.map((L, i) => {
    const c = makeCarriage(lv, L);
    c.position.x = i * PITCH;
    g.add(c);
    if (i > 0) { const b2 = mesh(geo.box(0.22, 0.06, 0.08), 0x4a3a52, { outline: 0.01 }); b2.position.set(i * PITCH - PITCH / 2, 0.33, 0); g.add(b2); }
    return c;
  });
  g.userData = { engine: engG, cars, dist: 0 };
  return g;
}
// turn every wheel for the distance travelled (wheel radius 0.2; the engine's are bigger)
export function rollWheels(train) {
  const d = train.userData.dist;
  for (const c of train.userData.cars) c.userData.spin(-d / 0.2);
  const ew = train.userData.engine.userData.wheels || [];
  for (const w of ew) w.rotation.z = d / 0.3;   // the engine is turned round: its own z points away from us
}

// ---------------- the trunk ----------------
// Group at TRUNK.pos turned TRUNK.ry. userData: lid (pivot at the hinge; rotation.x 0 = shut, negative = open),
// knob() world position of the lid's handle, mouth() world point just above the opening.
export const LID_OPEN = -1.95;
export function makeTrunk() {
  const g = new T.Group();
  const base = propModel('prop_lt_trunk') || mesh(geo.box(1.2, 0.72, 0.8), 0x4aa8e0, { outline: 0.03 });
  if (!base.userData.model) base.position.y = 0.36;
  g.add(base);
  const lid = new T.Group();
  lid.position.set(0, 0.72, -0.4);
  g.add(lid);
  const top = propModel('prop_lt_trunklid') || mesh(geo.box(1.22, 0.24, 0.82), 0x4aa8e0, { outline: 0.03 });
  if (!top.userData.model) top.position.set(0, 0.12, 0.41);
  lid.add(top);
  const knob = new T.Object3D(); knob.position.set(0, 0.13, 0.88); lid.add(knob);
  const shadow = blobShadow(0.85); shadow.scale.z = 0.7; shadow.position.y = 0.005; g.add(shadow);
  g.position.copy(TRUNK.pos);
  g.rotation.y = TRUNK.ry;
  g.userData = {
    lid, knobO: knob,
    knob: () => knob.getWorldPosition(new T.Vector3()),
    mouth: (y = 0.95) => g.localToWorld(new T.Vector3(0, y, 0)),
    inside: (x, y, z) => g.localToWorld(new T.Vector3(x, y, z)),
  };
  return g;
}

// ---------------- lowercase letters (canvas, drawn from strokes so they look the same on every machine) ----------------
// A small stroke table in a 1 x 1 x-height box (y down from the top of the ascender at -0.5 to the descender at 1.5).
const LOWER = {
  a: [['c', 0.5, 0.5, 0.4], ['l', 0.9, 0.05, 0.9, 1.0]],
  b: [['l', 0.1, -0.6, 0.1, 1.0], ['c', 0.5, 0.5, 0.4]],
  c: [['a', 0.52, 0.5, 0.4, 40, 320]],
  d: [['c', 0.5, 0.5, 0.4], ['l', 0.9, -0.6, 0.9, 1.0]],
  e: [['a', 0.5, 0.5, 0.4, 0, 330], ['l', 0.1, 0.5, 0.9, 0.5]],
  f: [['p', [[0.85, -0.45], [0.7, -0.6], [0.5, -0.6], [0.35, -0.4], [0.35, 1.0]]], ['l', 0.1, 0.05, 0.75, 0.05]],
  g: [['c', 0.5, 0.45, 0.38], ['p', [[0.88, 0.05], [0.88, 1.2], [0.75, 1.45], [0.4, 1.5], [0.15, 1.35]]]],
  h: [['l', 0.1, -0.6, 0.1, 1.0], ['p', [[0.1, 0.4], [0.3, 0.08], [0.6, 0.02], [0.85, 0.2], [0.88, 0.45], [0.88, 1.0]]]],
  i: [['l', 0.5, 0.05, 0.5, 1.0], ['d', 0.5, -0.35]],
  j: [['p', [[0.6, 0.05], [0.6, 1.25], [0.45, 1.48], [0.15, 1.42]]], ['d', 0.6, -0.35]],
  k: [['l', 0.15, -0.6, 0.15, 1.0], ['l', 0.85, 0.05, 0.2, 0.6], ['l', 0.42, 0.45, 0.88, 1.0]],
  l: [['l', 0.5, -0.6, 0.5, 1.0]],
  m: [['l', 0.05, 0.05, 0.05, 1.0], ['p', [[0.05, 0.35], [0.2, 0.05], [0.42, 0.08], [0.5, 0.35], [0.5, 1.0]]], ['p', [[0.5, 0.35], [0.65, 0.05], [0.88, 0.08], [0.95, 0.35], [0.95, 1.0]]]],
  n: [['l', 0.1, 0.05, 0.1, 1.0], ['p', [[0.1, 0.4], [0.3, 0.08], [0.6, 0.02], [0.85, 0.2], [0.88, 0.45], [0.88, 1.0]]]],
  o: [['c', 0.5, 0.5, 0.42]],
  p: [['l', 0.1, 0.05, 0.1, 1.55], ['c', 0.5, 0.5, 0.4]],
  q: [['l', 0.9, 0.05, 0.9, 1.55], ['c', 0.5, 0.5, 0.4]],
  r: [['l', 0.2, 0.05, 0.2, 1.0], ['p', [[0.2, 0.45], [0.38, 0.12], [0.6, 0.02], [0.82, 0.1]]]],
  s: [['p', [[0.82, 0.15], [0.6, 0.02], [0.35, 0.02], [0.15, 0.18], [0.2, 0.4], [0.5, 0.5], [0.8, 0.6], [0.85, 0.82], [0.65, 0.98], [0.35, 0.98], [0.12, 0.85]]]],
  t: [['p', [[0.4, -0.45], [0.4, 0.82], [0.55, 1.0], [0.82, 0.95]]], ['l', 0.12, 0.08, 0.78, 0.08]],
  u: [['p', [[0.1, 0.05], [0.1, 0.6], [0.2, 0.9], [0.45, 1.0], [0.7, 0.92], [0.88, 0.65]]], ['l', 0.9, 0.05, 0.9, 1.0]],
  v: [['p', [[0.05, 0.05], [0.5, 1.0], [0.95, 0.05]]]],
  w: [['p', [[0.0, 0.05], [0.25, 1.0], [0.5, 0.3], [0.75, 1.0], [1.0, 0.05]]]],
  x: [['l', 0.1, 0.05, 0.9, 1.0], ['l', 0.9, 0.05, 0.1, 1.0]],
  y: [['l', 0.08, 0.05, 0.5, 1.0], ['p', [[0.92, 0.05], [0.4, 1.3], [0.25, 1.5], [0.08, 1.45]]]],
  z: [['p', [[0.1, 0.05], [0.9, 0.05], [0.1, 1.0], [0.9, 1.0]]]],
};
function drawLower(ctx, ch, x0, y0, s) {
  const P = (x, y) => [x0 + x * s, y0 + y * s];
  for (const st of LOWER[ch] || []) {
    ctx.beginPath();
    if (st[0] === 'l') { ctx.moveTo(...P(st[1], st[2])); ctx.lineTo(...P(st[3], st[4])); }
    else if (st[0] === 'c') { const [x, y] = P(st[1], st[2]); ctx.moveTo(x + st[3] * s, y); ctx.ellipse(x, y, st[3] * s, st[3] * s, 0, 0, Math.PI * 2); }
    else if (st[0] === 'a') { const [x, y] = P(st[1], st[2]); ctx.ellipse(x, y, st[3] * s, st[3] * s, 0, st[4] * Math.PI / 180, st[5] * Math.PI / 180); }
    else if (st[0] === 'p') { st[1].forEach(([x, y], i) => (i ? ctx.lineTo(...P(x, y)) : ctx.moveTo(...P(x, y)))); }
    else if (st[0] === 'd') { const [x, y] = P(st[1], st[2]); ctx.moveTo(x + 0.01, y); ctx.arc(x, y, ctx.lineWidth * 0.55, 0, Math.PI * 2); ctx.fill(); continue; }
    ctx.stroke();
  }
}
// the round plate on a flap: the letter's lowercase in its colour
export function lowerPlate(L) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = '#fff4dc'; x.beginPath(); x.arc(64, 64, 62, 0, Math.PI * 2); x.fill();
  x.strokeStyle = x.fillStyle = '#' + new T.Color(LETTER_COL[L]).getHexString();
  x.lineWidth = 13; x.lineCap = 'round'; x.lineJoin = 'round';
  const ch = L.toLowerCase(), desc = 'gjpqy'.includes(ch), asc = 'bdfhklt'.includes(ch) || ch === 'i' || ch === 'j';
  const s = 44;
  const y0 = desc ? 18 : asc ? 52 : 42;
  drawLower(x, ch, 64 - s / 2, y0, s);
  const tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace;
  const m = new T.Mesh(geo.circle(0.112, 32), basic(0xffffff, { map: tex }));
  m.material = new T.MeshBasicMaterial({ map: tex });
  return m;
}

// the station sign: the set's four capitals, each in its colour, drawn from the Brick letters strokes
export function signTexture(letters) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 160;
  const x = c.getContext('2d');
  x.fillStyle = '#fff4dc'; x.fillRect(0, 0, 512, 160);
  x.lineCap = 'round'; x.lineJoin = 'round';
  const n = letters.length, cell = 512 / n, Hh = 110, cc = 13;
  [...letters].forEach((L, i) => {
    const def = LETTERS[L]?.(Hh, cc);
    if (!def) return;
    const ox = cell * i + (cell - def.W) / 2, oy = 160 - (160 - Hh) / 2;
    x.strokeStyle = '#' + new T.Color(LETTER_COL[L]).getHexString();
    x.lineWidth = cc * 2;
    for (const st of def.strokes) { x.beginPath(); st.pts.forEach(([px, py], k) => (k ? x.lineTo(ox + px, oy - py) : x.moveTo(ox + px, oy - py))); x.stroke(); }
  });
  const tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace;
  return tex;
}
export function makeSign(letters) {
  const g = new T.Group();
  const s = propModel('prop_lt_sign');
  if (s) g.add(s);
  const face = new T.Mesh(new T.PlaneGeometry(1.32, 0.46), new T.MeshBasicMaterial({ map: signTexture(letters) }));
  face.position.set(0, 1.62, 0.066);
  g.add(face);
  g.userData.face = face;
  g.scale.setScalar(1.0);
  return g;
}

// ---------------- platform, track, rug, ground ----------------
export function makeStation(level, setLetters) {
  const g = new T.Group();
  const look = [
    { ground: 0x9fd77a, hill: [0x8fd06c, 0x7cc95c], rug: 0xfff2dc, border: 0xff5a4a },     // morning
    { ground: 0xa6d870, hill: [0x93cc62, 0x7fc055], rug: 0x8ac4ff, border: 0xffffff },     // midday: a striped blue rug
    { ground: 0xc9c26a, hill: [0xd8b468, 0xc49a52], rug: 0xbfe6a8, border: 0x6aa84f },     // golden afternoon
  ][level] || {};
  const ground = new T.Mesh(geo.cyl(40, 40, 1, 48), toonUnique(look.ground));
  ground.position.y = -0.5;
  g.add(ground);
  for (const [x, z, r, c] of [[-16, -26, 9, 0], [6, -30, 12, 1], [24, -24, 8, 0], [-30, -22, 7, 1]]) {
    const h = mesh(geo.sphere(1, 24, 12), look.hill[c], { outline: 0.02 }); h.scale.set(r * 1.6, r * 0.55, r); h.position.set(x, -0.5, z); g.add(h);
  }
  const pf = propModel('prop_lt_platform');
  if (pf) g.add(pf);
  else { const b = mesh(geo.box(26, PY, 4), 0xd99a5b, { outline: 0.02 }); b.position.set(0, PY / 2, 1.05); g.add(b); }
  for (let i = -6; i <= 6; i++) {
    const tr = propModel('prop_lt_track');
    if (!tr) break;
    tr.position.set(i * 2.2, 0, TRACK_Z);
    g.add(tr);
  }
  const rug = propModel('prop_lt_rug', { tint: look.rug });
  if (rug) {
    tintLayer(rug, 'border', look.border);
    rug.position.set(0, PY, 0.9);
    g.add(rug);
  }
  g.userData.rug = rug;
  return g;
}
