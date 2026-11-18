// Paint & mix: the studio. Every piece is a Blender model from tools/blender/creatures/prop_paint.py (prefix prop_pt_),
// drawn as static meshes (scProp: one draw per layer, ink on merged normals). The numbers here mirror that script.
// World layout (section 3.0 of docs/design/paint.md): table top at y = 0, x right, z toward the child.
import * as T from '../three.js';
import { scProp } from '../engine/scenery.js';
import { toon, toonUnique } from '../engine/toon.js';
import { propModel } from '../engine/prop-models.js';
import { planarUV } from './paint-canvas.js';
import { COLOURS, hex } from './paint-shapes.js';

// ---- the easel (prop_pt_easel) ----
export const LEAN = (12 * Math.PI) / 180;
export const BOARD_W = 2.0, BOARD_H = 1.75, BOARD_Y0 = 0.12, LEDGE_TOP = 0.12, LEDGE_D = 0.24, PEG_S = 1.585, PEG_L = 0.12;
export const TOY_PROUD = 0.03;    // a toy's back face sits this far in front of the board
// a point on the easel in easel space: s up the board's front face from its foot, x across, d out of the face
export function boardPoint(s, x = 0, d = 0, out = new T.Vector3()) {
  const c = Math.cos(LEAN), sn = Math.sin(LEAN);
  return out.set(x, BOARD_Y0 + s * c + d * sn, -s * sn + d * c);
}
// ---- pots / dish / wall ----
export const POT_R = 0.27, POT_H = 0.42, RIM_Y = 0.425, PAINT_Y = 0.383;
export const DISH_R = 0.5, DISH_RIM = 0.09, WELL_Y = 0.032;
export const WALL_PEGS_Y = [3.3, 1.55], WALL_PEGS_X = [-2.25, -0.75, 0.75, 2.25];

function prop(kind, layers = {}, ink = 0.02) { return scProp(kind, layers, { ink }); }
function pivot(mesh) {
  // wrap a layer mesh in a pivot at its own bbox centre, so it can squash about its middle
  const g = new T.Group();
  mesh.geometry.computeBoundingBox();
  const c = mesh.geometry.boundingBox.getCenter(new T.Vector3()).applyMatrix4(mesh.matrix);
  const parent = mesh.parent;
  g.position.copy(c);
  mesh.position.sub(c);
  parent.add(g);
  g.add(mesh);
  return g;
}

export function makeTable() { return prop('prop_pt_table', { apron: {}, legs: {}, splatR: { ink: 0 }, splatB: { ink: 0 }, splatY: { ink: 0 } }, 0.02); }

export function makeEasel() {
  const g = prop('prop_pt_easel', { frame: {}, peg: {} }, 0.018);
  return g;
}

// A paint pot. pot.userData: { key, setColour(k), surface (pivot of the paint disc) }
export function makePot(key) {
  const g = prop('prop_pt_pot', { paint: { tint: hex(key) }, drip: { tint: hex(key) } }, 0.014);
  const u = g.userData;
  u.key = key;
  u.surface = pivot(u.parts.paint);
  u.setColour = (k) => { u.key = k; u.parts.paint.material = toon(hex(k), { vertexColors: true }); if (u.parts.drip) u.parts.drip.material = toon(hex(k), { vertexColors: true }); };
  return g;
}
export function makeLid() { return prop('prop_pt_lid', { knob: {} }, 0.014); }

// The brush: origin = bristle tip, handle along +y. userData.tip = the bristle mesh (tinted, scaled by the load).
export const BARE = 0xf6e7c8;
export function makeBrush() {
  const g = prop('prop_pt_brush', { ferrule: {}, tip: { tint: BARE } }, 0.013);
  const u = g.userData;
  u.tip = u.parts.tip;
  u.setTip = (col, load = 0) => {
    u.tip.material = toon(col ? hex(col) : BARE, { vertexColors: true });
    const k = 1 + 0.15 * (col ? Math.max(0, Math.min(1, load)) : 0);
    u.tip.scale.set(k, 1 + (k - 1) * 0.6, k);
  };
  return g;
}
// The dot stamp: origin = sponge face (y = 0), knob up.
export const SPONGE = 0xf3e6a8;
export function makeStamp() {
  const g = prop('prop_pt_stamp', { sponge: { tint: SPONGE } }, 0.013);
  const u = g.userData;
  u.setTip = (col) => { u.parts.sponge.material = toon(col ? hex(col) : SPONGE, { vertexColors: true }); };
  return g;
}
export const HOLE_A = new T.Vector3(-0.17, 0.3, 0), HOLE_B = new T.Vector3(0.17, 0.3, 0);
export function makeBlock() { return prop('prop_pt_block', { holes: {} }, 0.016); }

// The mixing dish: its well gets a 128 x 128 canvas (the swirl). userData.well, .canvas, .ctx, .tex
export function makeDish() {
  const g = prop('prop_pt_dish', {}, 0.009);   // (thin: no ink streaks inside the bowl)
  const well = scProp('prop_pt_dish', { well: {} }, { ink: 0 });
  // (scProp gives skin + well; use only its well mesh, with its own geometry copy for the UVs)
  const wm = well && well.userData.parts.well;
  const u = g.userData;
  if (wm) {
    wm.geometry = wm.geometry.clone();
    planarUV(wm.geometry, 'xz');
    // (256 px, drawn in 128 units: the puddles' edges stay smooth close up)
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const ctx = c.getContext('2d');
    ctx.scale(2, 2);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 128, 128);
    const tex = new T.CanvasTexture(c);
    tex.colorSpace = T.SRGBColorSpace;
    tex.generateMipmaps = false;
    tex.minFilter = T.LinearFilter;
    wm.material = toonUnique(0xffffff, { map: tex });
    wm.parent.remove(wm);
    g.add(wm);
    u.well = wm; u.canvas = c; u.ctx = ctx; u.tex = tex;
  }
  return g;
}
export function makeDot(col) { return prop('prop_pt_dot', { prop_pt_dot: { tint: hex(col) } }, 0.004); }

export function makeWall() {
  const g = prop('prop_pt_wall', { rails: {}, pegs: {} }, 0.02);
  g.userData.pegs = [];
  for (const y of WALL_PEGS_Y) for (const x of WALL_PEGS_X) g.userData.pegs.push(new T.Vector3(x, y, 0.1));
  return g;
}

// The picture card on its stand: the card layer gets a 256 canvas (drawn by paint-canvas drawPicture)
export function makeCardStand() {
  const g = prop('prop_pt_cardstand', { card: {} }, 0.014);
  const cm = g.userData.parts.card;
  if (cm) {
    cm.geometry = cm.geometry.clone();
    planarUV(cm.geometry, 'xy');
    cm.material = toonUnique(0xffffff, {});
  }
  g.userData.setPicture = (canvas) => {
    if (!cm) return;
    const t = new T.CanvasTexture(canvas);
    t.colorSpace = T.SRGBColorSpace;
    t.anisotropy = 4;
    if (cm.material.map) cm.material.map.dispose();
    cm.material.map = t;
    cm.material.needsUpdate = true;
  };
  return g;
}

// The 'hang it up' sign (prop_pt_hangsign): a little gallery board on a post; she taps it when her toy is finished.
// Origin = the foot of its post; its middle is 0.32 up.
export function makeHangSign() { return prop('prop_pt_hangsign', { frame: {}, peg: {}, pic: {} }, 0.012); }

// The gallery hook (prop_pt_hook): a little wooden batten with one peg, hanging on a twine cord from above the easel.
// Origin = the peg's axis where a toy's ring rests; the cord goes straight up from 0.5 to 4.5.
export function makeHook() { return prop('prop_pt_hook', { peg: {}, cord: {} }, 0.012); }

// The stamp's little cup at the easel ledge's right end (prop_pt_stampcup); the stamp stands in it at y 0.05.
export function makeStampCup() { return prop('prop_pt_stampcup', {}, 0.008); }

// Pip's portrait stool (prop_md_stool scaled to 0.35 high)
export function makeStool() {
  const s = scProp('prop_md_stool', { star: {} }, { ink: 0.02 }) || propModel('prop_md_stool');
  if (s) s.scale.setScalar(0.7);
  return s;
}
export { COLOURS };
