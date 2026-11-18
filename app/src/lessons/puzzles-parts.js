// Shape puzzles: the things on stage, built from the Blender models in tools/blender/creatures/prop_puzzles.py.
// Every model is drawn through scProp (one static mesh per layer + ink), so moving parts (lids, hinges, wheels, the
// glass pane, the ring, the door, the padlock) are layers that this file hangs on pivots.
import * as T from '../three.js';
import { scProp, scMesh } from '../engine/scenery.js';
import { toonUnique, INK } from '../engine/toon.js';
import { makeFace, setFace } from '../engine/faces.js';
import { pieceDecal, faceUVs } from './puzzles-art.js';

// the shared board layout (holes, outlines): loaded once
export let LAYOUT = null;
export const layoutReady = fetch('src/lessons/puzzles-layout.json').then((r) => r.json()).then((j) => { LAYOUT = j; return j; }).catch((e) => { console.error('puzzles layout', e); });

export const DECK = 1.0;          // cart deck top
export const PLANE = 0.6;         // the free drag plane above the cupboard (in front of every lid and knob on the board)
export const FRONT = 1.55;        // the drag plane in front of the cupboard (in front of every fitting, even an open door)
export const SEAT_Z = -0.05;      // a seated piece's centre (0.22 thick, 0.06 proud)
export const FLOOR_CLOSED = -0.04, FLOOR_OPEN = -0.2;   // floor tile centre (0.08 thick): flush / 0.16 down

// ---------------------------------------------------------------- helpers
// hang a layer mesh on a pivot at `at` (prop space) so it turns / slides about that point
function pivot(parent, mesh, at) {
  const p = new T.Group();
  p.position.set(at[0], at[1], at[2]);
  parent.add(p);
  if (mesh) { mesh.position.x -= at[0]; mesh.position.y -= at[1]; mesh.position.z -= at[2]; p.add(mesh); }
  return p;
}
function prop(kind, layers = {}, base = {}) {
  const g = scProp(kind, layers, base);
  if (!g) console.error('missing model', kind);
  return g || new T.Group();
}
// glass: a clear toon pane with a soft white edge line instead of ink (an inked back shell would fill the pane white)
const glassLine = new T.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });
export function glassify(mesh, opacity = 0.22) {
  if (!mesh) return;
  mesh.material = toonUnique(0xe8f6ff, { vertexColors: true, transparent: true, opacity, depthWrite: false });
  mesh.renderOrder = 5;
  for (const c of mesh.children) if (c.userData.outline) c.visible = false;
  const e = new T.LineSegments(new T.EdgesGeometry(mesh.geometry, 35), glassLine);
  e.renderOrder = 6;
  mesh.add(e);
}

// ---------------------------------------------------------------- the board
// holes: [{ id, shape, x, y, sx, sy, a, poly, tile, box, floor (mesh), open, filled, ... }]
export function makeBoard(levelIdx, tex) {
  const L = LAYOUT.levels[levelIdx];
  const g = prop('prop_pz_board' + (levelIdx + 1), { face: { ink: 0 }, shutter: {} }, { ink: 0.024 });
  const face = g.userData.parts?.face;
  if (face) { face.updateMatrix(); faceUVs(face.geometry, face.matrix); face.material = toonUnique(0xffffff, { map: tex }); }
  const holes = L.holes.map((h) => {
    const floor = scMesh('prop_pz_' + h.shape, 'floor', { tint: 0xf3dfbf, ink: 0.012 }) || new T.Group();
    const k = h.tile;
    floor.scale.set(h.sx * k, h.sy * k, 1);
    floor.rotation.z = (h.a * Math.PI) / 180;
    floor.position.set(h.x, h.y, FLOOR_CLOSED);
    g.add(floor);
    return { ...h, floor, open: false, filled: null, lid: null, plug: null };
  });
  return { group: g, holes };
}
export function tintFloor(h, col) {
  h.floor.material = toonUnique(col, { vertexColors: true });
  h.floorCol = new T.Color(col);
}

// ---------------------------------------------------------------- the toy cupboard
// The board's lower band holds a toy cupboard (x -2.3..3.7, floor level with the ledge). Everything for a puzzle sits
// on its floor in "cart" coordinates (the old cart's deck frame: slots A..D at x -1.5..1.5, deck top y 1.0, z 0.12..1.08),
// placed in the world at CUP_FRAME. Between puzzles the roll-up door (board layer 'shutter') drops, the set is swapped
// out of sight, and it rolls up again.
export const CUPBOARD = { x0: -2.3, x1: 3.7, y0: 0.8, y1: 2.36 };
export const CUP_FRAME = [0, -0.2, -1.4];
export const SHUTTER_RISE = 1.62;
export function makeFrame() {
  const g = new T.Group();
  g.position.set(...CUP_FRAME);
  g.userData.load = new T.Group();
  g.add(g.userData.load);
  const tray = prop('prop_pz_tray');
  g.add(tray);
  return g;
}

// ---------------------------------------------------------------- pieces
// A piece: group (the drag target, at the piece's centre) > spin (turns in the picture plane) > model + decal (+ face).
export function makePiece(pz) {
  const unit = LAYOUT.shapes[pz.shape];
  const g = new T.Group(), spin = new T.Group();
  g.add(spin);
  const m = prop('prop_pz_' + pz.shape, {}, { tint: pz.color, ink: 0.02 });
  m.scale.set(pz.size[0], pz.size[1], 1);
  spin.add(m);
  const d = pz.deco && pieceDecal(pz.deco, unit, pz.size);
  if (d) {
    const pl = new T.Mesh(new T.PlaneGeometry(d.w, d.h), toonUnique(0xffffff, { map: d.tex, transparent: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    pl.position.set(d.cx, d.cy, 0.1115);
    spin.add(pl);
  }
  let face = null;
  if (pz.deco === 'sun' || pz.deco === 'moon' || pz.deco === 'robot') {
    const R = Math.min(pz.size[0], pz.size[1]) * (pz.deco === 'robot' ? 0.5 : 0.44);
    face = makeFace(R, { cheeks: pz.deco !== 'robot' });
    face.scale.z = 0.28;
    face.position.set(0, pz.deco === 'robot' ? -0.02 : 0, 0.11 - R * 0.62 * 0.28);
    spin.add(face);
    if (pz.deco === 'moon') face.userData.sleepy = true;
    g.userData.face = face;
  }
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const [x, y] of unit) { x0 = Math.min(x0, x * pz.size[0]); x1 = Math.max(x1, x * pz.size[0]); y0 = Math.min(y0, y * pz.size[1]); y1 = Math.max(y1, y * pz.size[1]); }
  Object.assign(g.userData, { piece: true, pz, spin, face, model: m, unit, ext: [x0, x1, y0, y1] });
  if (face) setFriendFace(g, 'calm');
  return g;
}
// the lowest point of a piece turned by angle a (radians), relative to its centre; and its half extents at that angle
export function pieceExtent(p, a = p.userData.spin.rotation.z) {
  const { unit, pz } = p.userData, c = Math.cos(a), s = Math.sin(a);
  let lo = Infinity, hi = -Infinity, l = Infinity, r = -Infinity;
  for (const [ux, uy] of unit) {
    const x = ux * pz.size[0], y = uy * pz.size[1];
    const X = x * c - y * s, Y = x * s + y * c;
    lo = Math.min(lo, Y); hi = Math.max(hi, Y); l = Math.min(l, X); r = Math.max(r, X);
  }
  return { lo, hi, l, r };
}
export function setFriendFace(p, emo) {
  const f = p?.userData.face;
  if (!f) return;
  setFace(f, emo);
  if (f.userData.sleepy && emo !== 'joy') for (const e of f.userData.eyes) e.scale.y = 0.42;
}

// ---------------------------------------------------------------- fittings
export const STAND_TOP = 0.072;
export function makeStand() { return prop('prop_pz_stand'); }

// a lid sized to its hole (+0.12): the plate scales, the knob keeps its shape. Origin: the hole centre, z 0 = the face.
export function makeLid(h) {
  const g = prop('prop_pz_lid', { knob: { tint: 0xffffff } }, { tint: 0x6ec3ff });   // a clear sky-blue plate, red knob
  const P = g.userData.parts || {};
  const [x0, y0, x1, y1] = h.box;
  const w = x1 - x0 + 0.12, hh = y1 - y0 + 0.12;
  if (P.skin) P.skin.scale.set(w, hh, 1);
  if (P.knob) { P.knob.scale.setScalar(1.4); P.knob.position.z -= 0.16 * 0.4; }   // a big red knob to grab
  Object.assign(g.userData, { lid: true, w, h: hh });
  return g;
}
export function makePlug(s = 1) {
  const g = prop('prop_pz_plug', { knob: {} });
  const P = g.userData.parts || {};
  if (P.knob) P.knob.scale.set(1.4, 1.4, 1.2);
  g.scale.setScalar(s);
  g.userData.plug = true;
  return g;
}
// toy chest: its front door slides UP through a slot under the cream lip into the cupboard's hidden top (nothing ever
// leaves the cupboard). userData.door is the sliding group; setBoxDoor(b, k) with k 0 (shut) .. 1 (up and out of sight)
export const BOX = { W: 0.85, H: 1.42, D: 0.4, travel: 1.55 };
export function makeBox(col) {
  const g = prop('prop_pz_box', { trim: { tint: 0xffffff }, lid: { tint: col }, lift: { tint: 0xffffff }, knob: { tint: 0xffffff } }, { tint: col });
  const P = g.userData.parts || {};
  const door = new T.Group(); g.add(door);
  for (const k of ['lid', 'knob']) if (P[k]) door.add(P[k]);
  Object.assign(g.userData, { box: true, door, doorK: 0, opened: false });
  return g;
}
export function setBoxDoor(b, k) { const u = b.userData; u.doorK = k; u.door.position.y = BOX.travel * k; }
// upturned cup: lifting it raises it straight up into the cupboard's hidden top
export const CUP_UP = 1.6;
export function makeCup(col) {
  const g = prop('prop_pz_cup', { knob: { tint: 0xffffff } }, { tint: col });
  const P = g.userData.parts || {};
  const slide = new T.Group();
  g.add(slide);
  for (const k of ['skin', 'knob']) if (P[k]) slide.add(P[k]);
  Object.assign(g.userData, { cup: true, slide, lifted: false });
  return g;
}
// glass case over two slots, the pull ring hanging from the pulley arm over the next slot (local x 1.5)
export const CASE = { W: 1.05, H: 1.35, ringX: 1.5, ringY: 0.88, ringZ: 0.33, travel: 0.45, lift: 1.25, paneZ: 0.27, ringK: 2.0 };
export function makeCase() {
  const g = prop('prop_pz_case', { glass: {}, ring: {}, cord: {} });
  const P = g.userData.parts || {};
  const pane = pivot(g, P.glass, [0, 0, 0]);
  glassify(P.glass, 0.2);
  const ring = pivot(g, P.ring, [0, 0, 0]);
  ring.position.set(CASE.ringX, CASE.ringY, CASE.ringZ);
  ring.scale.setScalar(CASE.ringK);              // a big pull ring
  if (P.cord) P.cord.visible = false;
  const cords = [0, 1, 2].map(() => { const c = scMesh('prop_pz_case', 'cord', { ink: 0.008 }); g.add(c); return c; });
  // the cord over the arm (fixed), down to the ring, down to the pane's corner
  cords[0].position.set(CASE.W - 0.04, CASE.H + 0.07, CASE.ringZ); cords[0].rotation.z = Math.PI / 2; cords[0].scale.y = CASE.ringX - CASE.W + 0.04;
  Object.assign(g.userData, { glassCase: true, pane, ring, cords, pull: 0, latched: false });
  updateCase(g);
  return g;
}
export function updateCase(g) {
  const u = g.userData, k = u.pull;          // 0..1 of the ring's travel
  u.ring.position.y = CASE.ringY - k * CASE.travel;
  u.pane.position.y = k * CASE.lift;
  const c1 = u.cords[1], c2 = u.cords[2];
  c1.position.set(CASE.ringX, CASE.H - 0.07, CASE.ringZ);
  c1.scale.y = Math.max(0.02, CASE.H - 0.07 - (u.ring.position.y + 0.24 * CASE.ringK));
  c2.position.set(CASE.W - 0.11, CASE.H - 0.07, CASE.ringZ - 0.04);
  c2.scale.y = Math.max(0.02, CASE.H - 0.07 - (0.12 + u.pane.position.y));
}
// glass-front lock box (two sizes): its glass front slides UP into the cupboard's hidden top once the big padlock (lying
// on its side at the box's right, keyhole facing right) is unlocked. The key goes in from the right, lying flat.
export const LOCKS = { std: { model: 'prop_pz_lockbox', W: 0.78, H: 1.52, D: 0.33 }, wide: { model: 'prop_pz_lockbox2', W: 0.92, H: 1.12, D: 0.33 } };
export const KEY_IN = 0.83;          // the key's bow centre sits this far right of the padlock's keyhole face when it is in
export function makeLockbox(wide = false) {
  const S = wide ? LOCKS.wide : LOCKS.std;
  const g = prop(S.model, { door: {}, doorglass: {}, lock: {}, shackle: {} });
  const P = g.userData.parts || {};
  const door = new T.Group(); g.add(door);
  for (const k of ['door', 'doorglass']) if (P[k]) door.add(P[k]);
  if (P.doorglass) glassify(P.doorglass, 0.2);
  const pad = new T.Group(); pad.position.set(S.W + 0.36, S.H / 2, S.D + 0.08); g.add(pad);
  if (P.lock) pad.add(P.lock);
  const shackle = new T.Group(); pad.add(shackle);
  if (P.shackle) shackle.add(P.shackle);
  Object.assign(g.userData, { lockbox: true, S, door, pad, shackle, locked: true });
  return g;
}
// the keyhole on the padlock's right face (world), and where the key's bow centre is when the key is in it
export function keyholeOf(lb) { lb.updateMatrixWorld(true); return lb.userData.pad.localToWorld(new T.Vector3(0.28, 0.04, 0)); }
export const HOOK = { y: 1.25, z: 0.24 };   // the hook's peg (post-local): the key's bow hangs on it (its centre 0.13 lower)
export function makeHook() { return prop('prop_pz_hook', { hook: {} }); }
export function makeKeyRest() { return scMesh('prop_pz_hook', 'rest', { ink: 0.018 }) || new T.Group(); }
export const KEY_K = 1.0;
export function makeKey() {
  const k = prop('prop_pz_key', {}, { tint: 0xffffff, ink: 0.02 });
  const g = new T.Group(), turn = new T.Group(), roll = new T.Group();
  g.add(turn); turn.add(roll); roll.add(k);
  Object.assign(g.userData, { key: true, turn, roll });
  return g;
}
// ramp: a chunky gutter (floor at local y 0.62 at x -2.15, 8 degrees), a clear tube round the ball at x -1.62, the
// cradle at x 1.45, the peg standing in the gutter at x -0.8
export const RAMP = { x0: -2.15, x1: 1.95, top: 0.62, slope: Math.tan((8 * Math.PI) / 180), cradle: 1.45, ball: -1.62, pegX: -0.8 };
export const rampFloor = (x) => { const d = x - RAMP.cradle; return RAMP.top - (x - RAMP.x0) * RAMP.slope - 0.07 * Math.max(0, 1 - (d / 0.4) ** 2); };
export function makeRamp() {
  const g = prop('prop_pz_ramp', { tube: {} });
  glassify(g.userData.parts?.tube, 0.25);
  g.userData.ramp = true;
  return g;
}
export const PEG_K = 1.0, PEG_HEAD = 0.84;   // a fat mushroom peg, 1.09 tall, its head (0.62 across) centred 0.84 up
export function makePeg() { return prop('prop_pz_peg'); }

// ---------------------------------------------------------------- the home page icon
// a little puzzle board corner: a stand with a yellow star leaning in it and a red circle beside it
export function iconPuzzles() {
  const g = new T.Group();
  const st = scProp('prop_pz_stand');
  if (!st) return g;
  st.scale.setScalar(1.6); g.add(st);
  const star = scProp('prop_pz_star', {}, { tint: 0xffd23f, ink: 0.02 });
  if (star) { star.scale.set(1.35, 1.35, 1.6); star.position.set(0, 0.85, 0); star.rotation.x = -0.18; g.add(star); }
  const circ = scProp('prop_pz_circle', {}, { tint: 0x3fb6a8, ink: 0.02 });
  if (circ) { circ.scale.set(0.8, 0.8, 1.4); circ.position.set(0.85, 0.42, 0.3); circ.rotation.set(-0.1, -0.35, 0); g.add(circ); }
  const tri = scProp('prop_pz_triangle', {}, { tint: 0xff7a5a, ink: 0.02 });
  if (tri) { tri.scale.set(0.75, 0.7, 1.4); tri.position.set(-0.85, 0.37, 0.3); tri.rotation.set(-0.1, 0.35, 0); g.add(tri); }
  return g;
}
export { INK };
