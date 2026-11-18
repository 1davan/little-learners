// What happens next? pieces: the story card (a chunky shadow-box frame with a little 3D scene inside), the crate
// stands the cards go on (with one to four dice dots on the front), the bobbing question mark, and small helpers
// for building the scenes out of Blender props and the farm creatures.
// All Blender models: tools/blender/creatures/prop_story.py (prop_st_*) plus shared props and creatures.
import * as T from '../three.js';
import { propModel } from '../engine/prop-models.js';
import { makeFarmAnimal } from '../engine/farm.js';
import { makeAnimal } from '../engine/actors.js';
import { toonUnique } from '../engine/toon.js';

export const CARD = { w: 2.4, h: 2.1, d: 1.0, floor: 0.36 };   // the frame (origin = bottom centre)
export const STAND_TOP = 1.31;

// A Blender prop that holds perfectly still (no idle sway, no look, no walk bob when the card is carried).
export function still(w) {
  const m = w && w.userData.model;
  if (m) { m.userData.body = m; m.userData.head = m; m.userData.noLook = true; m.userData.noWalk = true; }
  return w;
}
// prop(kind, { s, at: [x, y, z], r: [rx, ry, rz], tint, hide }) -> still prop wrapper (or an empty group if not built).
// 'tint*' layers share the tinted skin colour, 'shine' layers draw without ink, layers named in hide are hidden.
export function prop(kind, { s = 1, at = [0, 0, 0], r = [0, 0, 0], tint, hide = [] } = {}) {
  const w = still(propModel(kind, tint !== undefined ? { tint } : {})) || new T.Group();
  const u = w.userData.model?.userData;
  if (u) for (const [name, l] of Object.entries(u.layers || {})) {
    if (/^shine/.test(name)) l.outline.visible = false;
    if (/^tint/.test(name) && u.skin) l.mesh.material = u.skin.material;
    if (hide.includes(name)) { l.mesh.visible = false; l.outline.visible = false; }
  }
  w.scale.setScalar(s);
  w.position.set(at[0], at[1], at[2]);
  w.rotation.set(r[0], r[1], r[2]);
  return w;
}
// a living character for a little scene: it may look around and blink, but never walks when its card is carried
export function critter(kind, { s = 1, at = [0, 0, 0], ry = 0 } = {}) {
  const c = kind === 'hen' || kind === 'chick' ? makeFarmAnimal(kind) : makeAnimal(kind);
  c.userData.noWalk = true;
  c.scale.setScalar(s);
  c.userData.baseScale = s;
  c.position.set(at[0], at[1], at[2]);
  c.rotation.y = ry;
  return c;
}
// tint a creature's whole skin (the muddy pig)
export function tintSkin(c, col) {
  const sk = c.userData.skin;
  if (sk) sk.material = toonUnique(col, { vertexColors: true });
}

// The story card: frame + scene. The scene group sits on the turf (y = 0 is the grass inside the frame).
const SKY_MAT = new T.MeshBasicMaterial({ vertexColors: true });
export function makeCard(tint) {
  const g = new T.Group();
  const f = prop('prop_st_frame', { tint });
  // the painted sky panel at the back is unlit, so it stays a clear bright sky under every level's light (the autumn
  // look turned it grey-green), and it has no ink line (its edge showed as a hairline beside the side walls)
  const back = f.userData.model?.userData.layers?.back;
  if (back) { back.mesh.material = SKY_MAT; back.outline.visible = false; }
  g.add(f);
  const dio = new T.Group();
  dio.position.y = CARD.floor;
  g.add(dio);
  g.userData.frame = f;
  g.userData.dio = dio;
  return g;
}

// A crate stand with n dots on its badge.
export function makeStand(n) {
  const w = prop('prop_st_stand');
  w.userData.model?.userData.wear('cloth_n' + n, true);
  return w;
}

export function makeQMark() {
  const w = prop('prop_st_qmark');
  return w;
}
