// Farm animals (cow, pig, sheep, horse built on the chibi animal body; hen and chick custom) and farm props.
import * as T from '../three.js';
import { mesh, geo, toon, ink, blobShadow, basic } from './toon.js';
import { makeAnimal, makeFace, C } from './actors.js';

import { makeHen as makeHenCode } from '../models/hen.js';
import { makeChick as makeChickCode } from '../models/chick.js';
import { orCreature } from './creature.js';
import { propModel, propAnchor } from './prop-models.js';
const makeHen = orCreature('hen', makeHenCode);
export const makeChick = orCreature('chick', makeChickCode);
export function makeFarmAnimal(kind) {
  if (kind === 'hen') return makeHen();
  if (kind === 'chick') return makeChick();
  return makeAnimal(kind);
}

// ---------- props ----------
export function makePot(col = 0xd9774a) {
  const pm = propModel('prop_pot', { tint: col, size: [1.32, 1.75 / 1.3, 1.32] });
  if (pm) { // the flowerpot model stands upright: turn it over (drainage hole on top)
    stillProp(pm);
    pm.userData.model.rotation.x = Math.PI; pm.userData.model.position.y = 1.75;
    pm.add(blobShadow(1.3)); pm.userData.kind = 'pot'; return pm;
  }
  const g = new T.Group();
  // upside-down flowerpot: wide rim at the bottom
  const pot = mesh(geo.cyl(0.85, 1.2, 1.7, 22), col, { outline: 0.035 });
  pot.position.y = 0.85;
  const rim = mesh(geo.cyl(1.32, 1.32, 0.34, 22), col, { outline: 0.03 });
  rim.position.y = 0.17;
  const hole = new T.Mesh(geo.circle(0.22, 16), toon(0x5a3420));
  hole.rotation.x = -Math.PI / 2; hole.position.y = 1.71;
  const band = new T.Mesh(geo.cyl(1.0, 1.06, 0.12, 22), toon(0xffffff));
  band.position.y = 1.0; band.scale.set(1.02, 1, 1.02);
  g.add(pot, rim, hole, band, blobShadow(1.3));
  g.userData.kind = 'pot';
  return g;
}

// A Blender prop that should just sit there: no idle sway, no walking bob when dragged, no look-at (springs still work).
export function stillProp(pm) {
  const m = pm.userData.model;
  m.userData.body = m; m.userData.head = m; m.userData.noWalk = true; m.userData.noLook = true;
  return pm;
}

// Root centred on the origin (tip at y -0.52*s, shoulder at +0.5*s), leafy spring tuft above.
// opts.face: show the cute face (hero moments); the wrapper's userData.face is then the face for setFace.
export function makeCarrot(s = 1, { face = false } = {}) {
  const pm = propModel('prop_carrot');
  if (pm) {
    stillProp(pm);
    const f = pm.userData.model.userData.face;
    if (f) f.visible = face;
    pm.userData.face = face ? f : null;
    pm.scale.setScalar(s);
    return pm;
  }
  const g = new T.Group();
  const c = mesh(geo.cone(0.22, 1.0, 12), 0xff8a2a, { outline: 0.025 });
  c.rotation.x = Math.PI;
  for (let i = 0; i < 3; i++) {
    const line = new T.Mesh(geo.torus(0.13 - i * 0.03, 0.012, Math.PI, 4, 10), basic(0xd96a14));
    line.position.y = -0.05 - i * 0.22; line.rotation.x = Math.PI / 2;
    c.add(line);
  }
  const tops = new T.Group(); tops.position.y = 0.5;
  for (let i = -1; i <= 1; i++) {
    const l = mesh(geo.sphere(0.12, 8, 6), 0x4fb84a, { outline: 0.012 });
    l.scale.set(0.6, 2.2, 0.6); l.position.set(i * 0.08, 0.2, 0); l.rotation.z = -i * 0.4;
    tops.add(l);
  }
  g.add(c, tops);
  g.scale.setScalar(s);
  g.userData.face = null;
  return g;
}

export function makeDrum(col = 0xd94f3d, r = 1.2, h = 1.2) {
  const pm = propModel('prop_drum', { tint: col, size: [r, h, r] });
  if (pm) { // Blender shell; the drum head stays a code mesh (games flash and squash userData.skin)
    stillProp(pm);
    const skin = mesh(geo.cyl(r * 1.0, r * 1.0, 0.08, 24), 0xfff6e6, { outline: 0.02 });
    skin.position.y = h + 0.02;
    pm.add(skin, blobShadow(r * 1.1));
    pm.userData = { skin, shell: pm.userData.model, r, h };
    return pm;
  }
  const g = new T.Group();
  const shell = mesh(geo.cyl(r, r * 0.95, h, 24), col, { outline: 0.035 });
  shell.position.y = h / 2;
  const skin = mesh(geo.cyl(r * 1.02, r * 1.02, 0.08, 24), 0xfff6e6, { outline: 0.02 });
  skin.position.y = h + 0.02;
  for (const y of [0.12, h - 0.12]) { const b = mesh(geo.torus(r * 1.0, 0.06, Math.PI * 2, 6, 28), 0xffd23f, { outline: 0 }); b.rotation.x = Math.PI / 2; b.position.y = y; g.add(b); }
  // zig-zag cords
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const c = new T.Mesh(geo.box(0.05, h * 0.8, 0.05), basic(0xfff6e6));
    c.position.set(Math.cos(a) * r * 1.0, h / 2, Math.sin(a) * r * 1.0);
    c.rotation.set(0, -a, i % 2 ? 0.5 : -0.5);
    g.add(c);
  }
  g.add(shell, skin, blobShadow(r * 1.1));
  g.userData = { skin, shell, r, h };
  return g;
}

export function makeWateringCan(col = 0x4a90ff) {
  const pm = propModel('prop_can', { tint: col });
  if (pm) { stillProp(pm); pm.userData.rose = propAnchor(pm, 'rose'); return pm; }
  const g = new T.Group();
  const body = mesh(geo.cyl(0.55, 0.6, 0.9, 18), 0x4a90ff, { outline: 0.03 });
  body.position.y = 0.45;
  const spout = mesh(geo.cyl(0.06, 0.1, 1.1, 10), 0x4a90ff, { outline: 0.02 });
  spout.position.set(0.75, 0.75, 0); spout.rotation.z = -0.9;
  const rose = mesh(geo.cyl(0.16, 0.08, 0.14, 12), 0x3a78d8, { outline: 0.015 });
  rose.position.set(1.2, 1.08, 0); rose.rotation.z = -0.9;
  const handle = mesh(geo.torus(0.35, 0.06, Math.PI, 6, 14), 0x3a78d8, { outline: 0.015 });
  handle.position.set(-0.1, 0.9, 0);
  g.add(body, spout, rose, handle);
  g.userData.rose = rose;
  return g;
}

export function makeSeedBag() {
  const pm = propModel('prop_seedbag');
  if (pm) return stillProp(pm);
  const g = new T.Group();
  const b = mesh(geo.box(0.9, 1.1, 0.3), 0xfff1c9, { hull: 1.06, outline: 0 });
  b.position.y = 0.55;
  const pic = new T.Mesh(geo.circle(0.25, 16), toon(0xff5a5a)); pic.position.set(0, 0.65, 0.16);
  const ctr = new T.Mesh(geo.circle(0.1, 12), toon(0xffd23f)); ctr.position.set(0, 0.65, 0.17);
  const stem = new T.Mesh(geo.box(0.05, 0.3, 0.01), toon(0x4fb84a)); stem.position.set(0, 0.32, 0.16);
  g.add(b, pic, ctr, stem);
  return g;
}

export function makeSeed() {
  const pm = propModel('prop_farmseed');
  if (pm) return stillProp(pm);
  const s = mesh(geo.sphere(0.16, 10, 8), 0x7a4a26, { outline: 0.015 });
  s.scale.set(0.8, 1.15, 0.8);
  return s;
}
