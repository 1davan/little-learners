// Who says moo? helpers: the farm spots animals stand in, the sound bubble, and each animal's signature move.
import * as T from '../three.js';
import { mesh, geo, toon, toonUnique, basic } from '../engine/toon.js';
import { physics } from '../engine/physics.js';
import { makeHay, makeTree, makeFlower, makePumpkin, makeLanternPost } from '../engine/scenery.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';
import { makeCarrot, stillProp } from '../engine/farm.js';
import { makeApple, makeCorn } from './share-props.js';
import { propModel } from '../engine/prop-models.js';

export const SPOTS = ['pen', 'hay', 'barn', 'pond', 'mud', 'tree', 'flowers', 'trough', 'hedge', 'pumpkins', 'cart'];
// each level has its own kind of places: a sunny meadow, the barnyard, and the garden with hedges and pumpkins
export const SPOT_POOLS = [
  ['flowers', 'tree', 'pond', 'hay'],
  ['pen', 'trough', 'barn', 'mud', 'hay', 'pond'],
  ['pumpkins', 'cart', 'tree', 'flowers', 'pond', 'barn', 'trough'], // (no hedge spot: it vanished against the garden hedge)
];

// a still Blender prop placed in a spot (null when it isn't built: the caller keeps its code version)
function prop(kind, x, y, z, size, ry = 0) {
  const pm = propModel(kind, size !== undefined ? { size } : {});
  if (!pm) return null;
  stillProp(pm); pm.position.set(x, y, z); pm.rotation.y = ry;
  return pm;
}
function box(w, h, d, col, x, y, z) { const m = mesh(geo.box(w, h, d), col, { hull: 1.04, outline: 0 }); m.position.set(x, y, z); return m; }
function disc(r, col, y = 0.03, sx = 1.3, sz = 0.85) {
  const m = new T.Mesh(geo.circle(r, 28), toon(col));
  m.rotation.x = -Math.PI / 2; m.position.y = y; m.scale.set(sx, sz, 1);
  return m;
}

// A sculpted ground patch (pond, mud, straw), or null when its Blender model isn't built.
function ground(kind, size, ry = 0) { return prop(kind, 0, 0, 0, size, ry); }
// straw strewn under the animal (the sculpted straw patch; the old flat disc only as a fallback)
// (the loose straws draw without ink: thin ink round thin sticks reads as scribble)
function noInk(pm, layer) { const l = pm && pm.userData.model?.userData.layers?.[layer]; if (l) l.outline.visible = false; return pm; }
function straw(g, sx = 1, sz = 1, col = 0xf0d070) {
  const st = noInk(ground('prop_strawpatch', [sx, 1, sz]), 'straw');
  g.add(st || disc(1.05, col, 0.025, 1.35 * sx, 0.8 * sz));
}

// A farm spot centred on the animal's feet. Props stay low in front and tall behind, so the animal is never hidden;
// side props stay within |x| <= 1.5 of the animal so neighbouring spots never touch, and nothing reaches further back
// than z -1.95 (behind the row is the lane the found animal walks along to the hay stack).
// opts.side: which side tall things (the tree) go: +1 right (the last slot), -1 left.
export function makeSpot(kind, { side = -1 } = {}) {
  const g = new T.Group();
  const pen = kind === 'pen' && prop('prop_penfence', 0, 0, -0.1);
  if (pen) { straw(g, 1.05, 1.1, 0xd9b27a); g.add(pen); }
  else if (kind === 'pen') {
    const wood = 0xc98a50;
    g.add(disc(1.25, 0xc9a06a, 0.025, 1.25, 0.9));
    for (const [x, z] of [[-1.85, -0.9], [0, -0.95], [1.85, -0.9], [-1.85, 0.6], [1.85, 0.6]]) g.add(box(0.16, 1.0, 0.16, wood, x, 0.5, z));
    g.add(box(3.8, 0.12, 0.08, wood, 0, 0.75, -0.92), box(3.8, 0.12, 0.08, wood, 0, 0.4, -0.92));
    for (const x of [-1.85, 1.85]) { g.add(box(0.08, 0.12, 1.5, wood, x, 0.75, -0.15), box(0.08, 0.12, 1.5, wood, x, 0.4, -0.15)); }
  } else if (kind === 'hay') {
    // two round bales behind and to the sides: the animal stands clear between them, hooves never on a bale
    const h = makeHay(0.85); h.position.set(1.45, 0, -1.3); h.rotation.y = 0.5;
    const h2 = makeHay(0.7); h2.position.set(-1.45, 0, -1.35); h2.rotation.y = -0.4;
    g.add(h, h2);
    straw(g);
  } else if (kind === 'barn' && propModel('prop_barnwall')) {
    g.add(prop('prop_barnwall', 0, 0, -1.25));
    straw(g, 1.1, 0.95);
  } else if (kind === 'barn') {
    const wall = box(2.8, 2.6, 0.2, 0xd94f3d, 0, 1.3, -1.2);
    const door = box(1.4, 1.8, 0.06, 0x8a3b2e, 0, 0.9, -1.07);
    for (const k of [-1, 1]) { const r = box(1.75, 0.18, 0.5, 0x8a3b2e, k * 0.72, 2.95, -1.2); r.rotation.z = -k * 0.6; g.add(r); }
    for (const s of [-1, 1]) { const b = box(1.9, 0.1, 0.04, 0xfff6e6, 0, 0.9, -1.03); b.rotation.z = s * 0.9; g.add(b); }
    g.add(wall, door, disc(1.1, 0xf0d070, 0.025, 1.4, 0.7));
  } else if (kind === 'pond') {
    const pd = ground('prop_farmpond', 1, 0);
    if (pd) g.add(pd);
    else {
      g.add(disc(1.25, 0xb9e98a, 0.02, 1.4, 0.8), disc(1.05, 0x6fd0f0, 0.03, 1.4, 0.8));
      const pad = disc(0.25, 0x58b43a, 0.04, 1, 1); pad.position.set(1.1, 0.04, 0.3); g.add(pad);
    }
    // a soft ripple spreading round the feet
    const ring = new T.Mesh(geo.ring(0.5, 0.58, 28), basic(0xffffff, { transparent: true, opacity: 0.5, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(0, 0.07, 0.25); g.add(ring);
    g.userData.ring = ring;
  } else if (kind === 'mud') {
    const md = ground('prop_mud', 0.82, 0.1);
    if (md) g.add(md);
    else {
      g.add(disc(1.2, 0xb08050, 0.02, 1.35, 0.8), disc(1.0, 0x9a6a40, 0.03, 1.35, 0.8));
      for (const [x, z] of [[-1.2, 0.25], [1.2, -0.15], [1.05, 0.6]]) { const b = mesh(geo.sphere(0.13, 10, 8), 0x80562f, { outline: 0.01 }); b.scale.y = 0.45; b.position.set(x, 0.05, z); g.add(b); }
    }
  } else if (kind === 'tree') {
    // a proper tree, taller than the animal, off to one side and back, its canopy clear of the animal's head
    const t = makeTree(0.8); t.position.set(side * 2.45, 0, -0.9); g.add(t); // (its crown stays clear of the lane behind the row)
    const apple = makeApple(0.45); apple.position.set(side * 1.25, 0.13, 0.55); apple.rotation.set(0.2, 0.6, -0.3); g.add(apple);
  } else if (kind === 'flowers') {
    const cols = [0xff8fc0, 0xffd23f, 0xffffff, 0xa77bff, 0xff5a5a];
    for (let i = 0; i < 7; i++) { const f = makeFlower(cols[i % 5]); const a = Math.PI * (0.05 + i * 0.15); f.position.set(-Math.cos(a) * 1.6, 0, -Math.sin(a) * 0.7 - 0.6); f.scale.setScalar(1.15); g.add(f); } // behind the feet, never in front
  } else if (kind === 'trough' && propModel('prop_trough')) {
    // the trough stands behind, to one side (nothing else beside it to bump into a neighbour)
    g.add(prop('prop_trough', 0.95, 0, -1.45));
  } else if (kind === 'trough') {
    const t = box(1.6, 0.55, 0.6, 0xa0623a, 0.95, 0.3, -1.45);
    const w = new T.Mesh(geo.box(1.45, 0.05, 0.45), toon(0x6fd0f0)); w.position.set(0.95, 0.56, -1.45);
    for (const x of [0.3, 1.6]) g.add(box(0.12, 0.3, 0.7, 0x7a4a26, x, 0.15, -1.45));
    g.add(t, w);
  }
  else if (kind === 'hedge' && propModel('prop_farmhedge')) {
    g.add(prop('prop_farmhedge', 0, 0, -1.3, [1, 0.95, 0.95]), prop('prop_farmbush', -1.5, 0, -0.3, 0.95), prop('prop_farmbush', 1.5, 0, -0.3, 0.95, 2.1));
  }
  else if (kind === 'hedge') {
    // a tall trimmed hedge behind, round bushes either side
    const h = mesh(geo.box(3.0, 2.2, 0.9), 0x4f9e3a, { hull: 1.03 }); h.position.set(0, 1.1, -1.3);
    for (let i = 0; i < 5; i++) { const b = mesh(geo.sphere(0.42, 12, 10), 0x58b43a, { outline: 0.015 }); b.position.set(-1.2 + i * 0.6, 2.25, -1.3); g.add(b); }
    for (const x of [-1.5, 1.5]) { const b = mesh(geo.sphere(0.45, 12, 10), 0x5cc45a, { outline: 0.016 }); b.position.set(x, 0.35, -0.3); g.add(b); }
    g.add(h);
  } else if (kind === 'pumpkins') {
    for (const [x, z, r] of [[-1.25, -1.3, 0.42], [1.3, -1.4, 0.5], [1.15, 0.75, 0.3]]) { // clear of the animal's arms and hooves
      const big = makePumpkin(r / 0.45); // the farm's pumpkin
      if (big) { big.position.set(x, 0, z); big.rotation.y = x * 1.3; g.add(big); continue; }
      const pk = new T.Group(); pk.position.set(x, 0, z);
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; const l = mesh(geo.sphere(r * 0.6, 12, 10), i % 2 ? 0xff8a2a : 0xff9a3a, { outline: 0.016 }); l.scale.set(0.8, 1, 0.8); l.position.set(Math.cos(a) * r * 0.45, r * 0.62, Math.sin(a) * r * 0.45); pk.add(l); }
      const st = mesh(geo.cyl(0.05, 0.07, 0.2, 6), 0x58a03a, { outline: 0.01 }); st.position.y = r * 1.25; pk.add(st);
      g.add(pk);
    }
  } else if (kind === 'cart' && propModel('prop_haycart')) {
    // the hay cart stands back and to the side, its shafts pointing away to the back
    g.add(prop('prop_haycart', 1.2, 0, -1.25, 0.85, 0.25));
    straw(g, 0.9, 0.9, 0xe8c878);
  } else if (kind === 'cart') {
    // a hay cart behind
    const bed = box(2.4, 0.5, 1.2, 0xc98a50, 0, 0.95, -1.3);
    const hay = mesh(geo.box(2.2, 0.6, 1.0), 0xf0c648, { hull: 1.03 }); hay.position.set(0, 1.45, -1.3);
    for (const x of [-0.9, 0.9]) { const w = mesh(geo.cyl(0.55, 0.55, 0.12, 16), 0x8a5228, { outline: 0.02 }); w.rotation.x = Math.PI / 2; w.position.set(x, 0.55, -0.68); g.add(w); const hub = mesh(geo.sphere(0.12, 8, 6), 0xffd23f, { outline: 0.01 }); hub.position.set(x, 0.55, -0.6); g.add(hub); }
    g.add(bed, hay, disc(1.0, 0xd9b27a, 0.025, 1.4, 0.8));
  }
  g.userData.kind = kind;
  return g;
}

// Pip's feed bowl at the front: a low wooden bowl the treat pops up in. userData.seat = where a treat sits.
export function makeFeedBowl() {
  const pm = propModel('prop_woodbowl', { tint: 0x7fc24a });
  const g = new T.Group();
  if (pm) { stillProp(pm); pm.scale.setScalar(0.62); g.add(pm); g.userData.seat = new T.Vector3(0, 0.62 * 0.24, 0); }
  else {
    const b = mesh(geo.cyl(0.62, 0.42, 0.3, 24), 0xa86f3a, { outline: 0.02 }); b.position.y = 0.15; g.add(b);
    g.userData.seat = new T.Vector3(0, 0.3, 0);
  }
  return g;
}
// The hay stack the farm chorus stands on (in front of the farm fence): a front step one bale high and a back row two
// bales high, square bales (prop_hay) laid end to end. Origin on the ground at the centre of its front face; it reaches
// back to z -1.52. HAY_STACK = { w, step: { y, z }, top: { y, z } } (top = where the chorus stands, step = the hop up).
export const HAY_STACK = { w: 9.0, step: { y: 1.08, z: -0.39 }, top: { y: 2.16, z: -1.15 } };
export function makeHayStack() {
  const g = new T.Group();
  const bale = (x, y, z, sz, ry, straws) => {
    const pm = propModel('prop_hay');
    if (!pm) { const b = mesh(geo.box(1.48, 1.08, 0.74), 0xf0c648, { hull: 1.03 }); b.position.set(x, y + 0.54, z); return b; }
    stillProp(pm);
    pm.scale.set(0.6, 0.6, sz);
    pm.position.set(x, y, z); pm.rotation.y = ry;
    const l = pm.userData.model.userData.layers?.straws; // loose straws on top: only where nothing stands
    if (l && !straws) { l.mesh.visible = false; l.outline.visible = false; }
    return pm;
  };
  for (let i = 0; i < 6; i++) {
    const x = -3.75 + i * 1.5;
    g.add(bale(x + Math.sin(i * 2.3) * 0.03, 0, -0.39, 0.4, Math.sin(i * 1.7) * 0.02, true));   // the step
    g.add(bale(x - Math.sin(i * 1.9) * 0.03, 1.08, -1.15, 0.4, Math.sin(i * 2.9) * 0.02, false)); // the top row (on the hidden lower row)
    g.add(bale(x, 0, -1.15, 0.4, 0, false));
  }
  return g;
}
// The long straw bed by the fence where the farm chorus stands (null when not built: the tray's own rug shows).
export function makeStrawBed(width) {
  const pm = propModel('prop_strawbed');
  if (!pm) return null;
  stillProp(pm);
  pm.scale.set(width / 9, 1, 1);
  return noInk(pm, 'straw');
}

// ---- treats: Pip gives the right animal its favourite food, and it falls and piles up with real physics ----
// [colour(s), shape, size, how many]
const TREATS = {
  cow: { cols: [0x58b43a, 0x7fc24a], shape: 'clover', n: 4 },
  sheep: { cols: [0x7fc24a, 0xb6e07a], shape: 'clover', n: 4 },
  pig: { cols: [0xf0453a, 0x8fd14f], shape: 'apple', n: 4 },
  hen: { cols: [0xffd23f, 0xf2b51d], shape: 'corn', n: 4 },
  horse: { cols: [0xff8a2a], shape: 'carrot', n: 3 },
  duck: { cols: [0xe8c38a, 0xd9a86a], shape: 'bread', n: 5 },
};
export function treatCount(kind) { return TREATS[kind]?.n || 4; }
export function makeTreat(kind, i) {
  const t = TREATS[kind] || TREATS.cow, col = t.cols[i % t.cols.length];
  // the Blender treats (hull colliders: a carrot rolls like a carrot, a cob like a cob)
  let pm = null;
  if (t.shape === 'apple') pm = makeApple(0.82, col);
  else if (t.shape === 'carrot') pm = makeCarrot(0.56);
  else if (t.shape === 'corn') pm = makeCorn(0.55);
  else if (t.shape === 'bread') { pm = propModel('prop_bread', { size: 1.1 }); if (pm) stillProp(pm); }
  else { pm = propModel('prop_clover', { size: 1.05 }); if (pm) stillProp(pm); }
  if (pm) {
    pm.userData.phys = { bounce: 0.3, friction: 0.9, mass: 0.4, ...(t.shape === 'apple' ? { shape: 'ball', r: 0.26 } : {}) };
    pm.userData.treat = t.shape;
    return seated(pm, t.shape);
  }
  const g = new T.Group();
  let phys;
  if (t.shape === 'apple') {
    const a = mesh(geo.sphere(0.24, 14, 10), col, { outline: 0.016 }); g.add(a);
    const st = mesh(geo.cyl(0.02, 0.03, 0.12, 5), 0x7a4a26, { outline: 0 }); st.position.y = 0.25; g.add(st);
    phys = { shape: 'ball', r: 0.24 };
  } else if (t.shape === 'corn') {
    const k = mesh(geo.sphere(0.12, 10, 8), col, { outline: 0.012 }); k.scale.set(1, 0.8, 0.9); g.add(k);
    phys = { shape: 'ball', r: 0.11 };
  } else if (t.shape === 'carrot') {
    const c = mesh(geo.cone(0.14, 0.7, 10), col, { outline: 0.016 }); c.rotation.x = Math.PI; g.add(c);
    for (const s of [-1, 0, 1]) { const l = mesh(geo.sphere(0.07, 6, 5), 0x4fb84a, { outline: 0.008 }); l.scale.set(0.6, 2, 0.6); l.position.set(s * 0.05, 0.45, 0); l.rotation.z = -s * 0.4; g.add(l); }
    phys = { shape: 'box', size: { x: 0.3, y: 0.85, z: 0.3 } };
  } else if (t.shape === 'bread') {
    const b = mesh(geo.box(0.3, 0.2, 0.26), col, { hull: 1.06 }); g.add(b);
    phys = { shape: 'box', size: { x: 0.3, y: 0.2, z: 0.26 } };
  } else {
    // a little clover bunch: three leaves on a stalk
    for (let j = 0; j < 3; j++) { const l = mesh(geo.sphere(0.13, 10, 8), col, { outline: 0.012 }); const a = (j / 3) * Math.PI * 2; l.position.set(Math.cos(a) * 0.12, 0.05, Math.sin(a) * 0.12); l.scale.y = 0.5; g.add(l); }
    const f = mesh(geo.sphere(0.08, 8, 6), i % 2 ? 0xffffff : 0xff8fc0, { outline: 0.008 }); f.position.y = 0.12; g.add(f);
    phys = { shape: 'ball', r: 0.22 };
  }
  g.userData.phys = { bounce: 0.35, friction: 0.9, mass: 0.4, ...phys };
  return seated(g, t.shape);
}
// wrap a treat so its wrapper origin is the bottom of the treat (it sits in the bowl; a carrot lies down)
function seated(o, shape) {
  const w = new T.Group();
  if (shape === 'carrot') o.rotation.z = Math.PI / 2;
  w.add(o);
  w.updateMatrixWorld(true);
  const bb = new T.Box3().setFromObject(o);
  o.position.y -= bb.min.y;
  o.position.x -= (bb.min.x + bb.max.x) / 2;
  o.position.z -= (bb.min.z + bb.max.z) / 2;
  w.userData.treat = shape;
  return w;
}

// ---- a backdrop for each level, behind the animals ----
export function makeBackdrop(level) {
  const g = new T.Group();
  if (level === 0) {
    // a sunny meadow: a rainbow over the far field and a carpet of little flowers
    const cols = [0xff5a5a, 0xff9f3f, 0xffd23f, 0x5fd068, 0x4a90ff, 0xa77bff];
    cols.forEach((c, i) => { const r = new T.Mesh(geo.torus(5.2 - i * 0.3, 0.16, Math.PI, 6, 40), basic(c, { fog: false })); r.position.set(6.5, -0.5, -18); g.add(r); });
    const cc = [0xffffff, 0xffd23f, 0xff8fc0, 0xa77bff];
    for (let i = 0; i < 14; i++) {
      const x = -6.5 + ((i * 2.71) % 14), z = -2.6 + ((i * 1.37) % 1.4) + (i % 2 ? 4.6 : 0);
      if (Math.abs(x) < 6.8) continue; // keep the play band clear: the animals, and the straw bed by the fence behind them
      const f = makeFlower(cc[i % 4]); f.position.set(x, 0, z); f.scale.setScalar(1.2); g.add(f);
    }
  } else if (level === 1) {
    // the barnyard: a packed-dirt yard with a cart wheel and a few hens' feathers
    const yard = new T.Mesh(geo.circle(1, 48), toon(0xd9b27a)); yard.rotation.x = -Math.PI / 2; yard.scale.set(8.2, 2.9, 1); yard.position.set(0, 0.012, 0.2); g.add(yard);
    for (let i = 0; i < 30; i++) { const p = mesh(geo.sphere(0.12, 6, 5), i % 2 ? 0xc9a06a : 0xb88f5a, { outline: 0 }); p.scale.y = 0.35; const a = i * 2.4, r = 0.85 + (i % 3) * 0.05; p.position.set(Math.cos(a) * 8.2 * r, 0.03, 0.2 + Math.sin(a) * 2.9 * r); g.add(p); }
    const cw = prop('prop_cartwheel', 7.6, 1.0, -2.6, 1.05, -0.5);
    if (cw) { cw.rotation.z = 0.15; g.add(cw); }
    const wheel = new T.Group(); wheel.position.set(7.6, 1.0, -2.6); wheel.rotation.y = -0.5;
    if (!cw) wheel.add(mesh(geo.torus(0.9, 0.09, Math.PI * 2, 6, 24), 0x8a5228, { outline: 0.015 }));
    for (let i = 0; i < 6; i++) { const sp = new T.Mesh(geo.box(0.07, 1.75, 0.07), toon(0xa0623a)); sp.rotation.z = (i / 6) * Math.PI; wheel.add(sp); }
    if (!cw) g.add(wheel);
  } else {
    // the garden: a long trimmed hedge behind the fence (clear of the straw bed by the fence at z -3.3 and of Pip's
    // hay bale), with glowing lanterns on posts in front of it
    for (let i = 1; i < 6; i++) {
      const hb = prop('prop_farmhedge', -6.5 + i * 2.6, 0, -5.0, [0.88, 1.18, 0.85]);
      if (hb) { g.add(hb); continue; }
      const h = mesh(geo.box(2.6, 2.6, 0.8), i % 2 ? 0x4f9e3a : 0x58a640, { hull: 1.02 }); h.position.set(-6.5 + i * 2.6, 1.3, -5.0); g.add(h); const top = mesh(geo.sphere(0.5, 12, 10), 0x5cc45a, { outline: 0.015 }); top.position.set(-6.5 + i * 2.6, 2.75, -5.0); g.add(top);
    }
    for (const x of [-4.4, 7.6]) { // (either side of the hay stack, never behind the chorus)
      const lp = makeLanternPost(0xffb04a, 0.45, 2.6);
      lp.position.set(x, 0, -4.55); lp.rotation.y = -0.2;
      g.add(lp);
    }
  }
  return g;
}

// ---- the sound bubble: a speech bubble by Pip with a little icon (the animal on Levels 1-2, just a note on Level 3) ----
const ICON = { cow: '🐮', pig: '🐷', sheep: '🐑', duck: '🦆', hen: '🐔', horse: '🐴' };
const texCache = new Map();
function bubbleTex(icon, col) {
  const key = icon + col;
  if (texCache.has(key)) return texCache.get(key);
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d');
  x.lineWidth = 10; x.strokeStyle = '#3a2838'; x.fillStyle = '#ffffff';
  x.beginPath(); x.ellipse(128, 112, 104, 88, 0, 0, Math.PI * 2); x.fill(); x.stroke();
  // tail towards Pip (bottom-left)
  x.beginPath(); x.moveTo(52, 170); x.lineTo(22, 240); x.lineTo(96, 192); x.closePath(); x.fill(); x.stroke();
  x.fillStyle = '#ffffff'; x.beginPath(); x.ellipse(128, 112, 98, 82, 0, 0, Math.PI * 2); x.fill();
  // sound waves either side
  x.strokeStyle = col; x.lineWidth = 9; x.lineCap = 'round';
  for (const s of [-1, 1]) for (const r of [26, 46]) { x.beginPath(); x.arc(128 + s * 52, 112, r, s < 0 ? Math.PI * 0.75 : -Math.PI * 0.25, s < 0 ? Math.PI * 1.25 : Math.PI * 0.25); x.stroke(); }
  x.textAlign = 'center'; x.textBaseline = 'middle';
  if (icon === '♪') { x.fillStyle = col; x.font = 'bold 110px sans-serif'; x.fillText('♪', 128, 116); }
  else { x.font = '92px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; x.fillText(icon, 128, 118); }
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace;
  texCache.set(key, t);
  return t;
}
export function makeSoundBubble() {
  const mat = new T.SpriteMaterial({ transparent: true, depthTest: false, fog: false });
  const sp = new T.Sprite(mat);
  sp.renderOrder = 10;
  sp.visible = false;
  sp.userData.size = 2.6;
  return sp;
}
export function setBubble(sp, kind, col, soundOnly) {
  sp.material.map = bubbleTex(soundOnly ? '♪' : ICON[kind], col);
  sp.material.needsUpdate = true;
}

// ---- signature moves (each about 0.8 s). s = tween scope, root = where temporary bits go ----
function bits(s, root, pos, col, n, { up = 3, spread = 2.5, r = 0.1, life = 0.6 } = {}) {
  for (let i = 0; i < n; i++) {
    const d = mesh(geo.sphere(r, 8, 6), col, { outline: 0 });
    d.position.copy(pos); root.add(d);
    const a = Math.random() * Math.PI * 2, sp = spread * (0.5 + Math.random() * 0.6);
    const v = new T.Vector3(Math.cos(a) * sp, up * (0.6 + Math.random() * 0.6), Math.sin(a) * sp * 0.4 + 0.6);
    const p0 = pos.clone();
    s.anim(life + Math.random() * 0.2, (_, q) => {
      const t = q * 0.7;
      d.position.set(p0.x + v.x * t, Math.max(0.05, p0.y + v.y * t - 6 * t * t), p0.z + v.z * t);
      d.scale.setScalar(1 - q * 0.5);
    }).then(() => root.remove(d));
  }
}
// a puddle grows under the animal (the sculpted mud / pond prop); none when it already stands in mud or water
function puddle(s, root, a, kind) {
  if (a.userData.spot === 'pond' || a.userData.spot === 'mud') return null;
  const pos = a.position;
  // (lifted a little so it lies on top of a straw patch too)
  const p = prop(kind === 'mud' ? 'prop_mud' : 'prop_farmpond', pos.x, 0.035, pos.z + 0.15, kind === 'mud' ? 0.55 : 0.6, 0.15);
  const q = p || disc(0.9, kind === 'mud' ? 0x9a6a40 : 0x6fd0f0, 0.05, 1.3, 0.8);
  if (!p) { q.position.x = pos.x; q.position.z = pos.z + 0.2; }
  root.add(q);
  const k = q.scale.clone();
  q.scale.set(k.x * 0.01, k.y, k.z * 0.01);
  s.anim(0.35, (e) => q.scale.set(k.x * e, k.y, k.z * e), Ease.back);
  return q;
}

export const SIGNATURE = {
  // the cow munches a mouthful of grass
  async cow(s, a, root) {
    const h = a.userData.head;
    const tuft = new T.Group();
    for (let i = -2; i <= 2; i++) { const b = mesh(geo.cone(0.07, 0.6, 5), i % 2 ? 0x58b43a : 0x7fc24a, { outline: 0.01 }); b.position.set(0.25, i * 0.05, 0); b.rotation.z = -Math.PI / 2 + i * 0.25; tuft.add(b); }
    const fl = mesh(geo.sphere(0.07, 8, 6), 0xffd23f, { outline: 0.008 }); fl.position.set(0.55, 0.12, 0); tuft.add(fl);
    tuft.position.set(0.1, -0.42, 0.8); h.add(tuft);
    const r0 = h.rotation.z, x0 = h.rotation.x;
    sfx.crunch();
    await s.anim(1.3, (_, p) => {
      h.rotation.z = r0 + Math.sin(p * Math.PI * 6) * 0.12;
      h.rotation.x = x0 + Math.abs(Math.sin(p * Math.PI * 3)) * 0.08;
      tuft.scale.setScalar(Math.max(0.01, 1.5 * (1 - p)));
      tuft.rotation.z = Math.sin(p * Math.PI * 6) * 0.3;
    });
    h.remove(tuft); h.rotation.z = r0; h.rotation.x = x0;
  },
  // the pig rolls over in a mud puddle and comes up muddy (and stays muddy)
  async pig(s, a, root) {
    const home = a.position.clone(), base = a.userData.baseScale ?? 1, c = 0.9 * base;
    puddle(s, root, a, 'mud');
    sfx.splash();
    // roll over sideways around the middle of the body
    // (a calm roll: 1.7 s on a sine ease, never a fast spin)
    await s.anim(1.7, (_, p) => {
      const e = (1 - Math.cos(p * Math.PI)) / 2;
      const th = e * Math.PI * 2;
      a.rotation.z = th;
      a.position.set(home.x + c * Math.sin(th), home.y + c - c * Math.cos(th) + Math.sin(e * Math.PI) * 0.3, home.z);
    });
    a.rotation.z = 0; a.position.copy(home);
    bits(s, root, home.clone().add(new T.Vector3(0, 0.3, 0.3)), 0x6b4423, 10, { up: 3, spread: 2.2, r: 0.11 });
    // the mud stays on: soft painted splats on its skin (the model's hidden 'cloth_mud' layer), all level
    a.userData.wear?.('cloth_mud', true);
  },
  // the sheep's wool goes POOF
  async sheep(s, a, root) {
    const base = a.userData.baseScale ?? 1;
    await s.anim(0.3, (_, p) => { const k = 1 - 0.15 * p; a.scale.set(base / k, base * k, base / k); });
    sfx.pop();
    const c = a.position.clone().add(new T.Vector3(0, 1.0 * base, 0.2));
    for (let i = 0; i < 10; i++) {
      const w = mesh(geo.sphere(0.24, 10, 8), 0xfffaf0, { outline: 0.015 });
      w.position.copy(c); root.add(w);
      const ang = (i / 10) * Math.PI * 2, v = new T.Vector3(Math.cos(ang) * 1.6, Math.sin(ang) * 1.3 + 0.6, 0.5);
      s.anim(0.9, (_, q) => { w.position.copy(c).addScaledVector(v, Ease.out(q)); w.scale.setScalar(Math.max(0.01, 1.2 - q)); }).then(() => root.remove(w));
    }
    await s.anim(0.9, (_, p) => { const k = 1 + 0.35 * Math.sin(p * Math.PI) * (1 - p * 0.3); a.scale.set(base * k, base * (1 + (k - 1) * 0.6), base * k); }, Ease.out);
    a.scale.setScalar(base);
  },
  // the hen squats and lays an egg, which rolls out in front
  async hen(s, a, root) {
    const base = a.userData.baseScale ?? 1;
    const r0 = a.rotation.z;
    await s.anim(0.7, (_, p) => { const k = 1 - 0.2 * Math.sin(p * Math.PI / 2); a.scale.set(base / Math.sqrt(k), base * k, base / Math.sqrt(k)); a.rotation.z = r0 + Math.sin(p * Math.PI * 4) * 0.08; });
    a.rotation.z = r0;
    const em = propModel('prop_farmegg', { tint: 0xfff3dc, size: 1.05 });
    const egg = em ? stillProp(em) : mesh(geo.sphere(0.22, 14, 10), 0xfff3dc, { outline: 0.02 });
    if (!em) egg.scale.set(0.85, 1.1, 0.85);
    egg.position.copy(a.position).add(new T.Vector3(0, 0.25, -0.2)); root.add(egg);
    sfx.pop();
    s.anim(0.2, (_, p) => { const k = 1 + 0.25 * Math.sin(p * Math.PI); a.scale.set(base / Math.sqrt(k), base * k, base / Math.sqrt(k)); }).then(() => a.scale.setScalar(base));
    // the egg pops out and rolls away with real physics
    physics.add(egg, { shape: 'ball', r: 0.21, bounce: 0.3, friction: 0.6, mass: 0.4 });
    const eb = physics.body(egg); if (eb) { eb.setLinearDamping(1.2); eb.setAngularDamping(1.2); }
    physics.impulse(egg, { x: (Math.random() - 0.5) * 0.5, y: 1.6, z: 1.1 }, { x: 0.3, y: 0, z: 0.1 }); // (a short roll, stopped by the kerb in front of the row)
    await s.wait(0.7);
    return egg; // stays until the round ends
  },
  // the horse trots clip-clop on the spot, then rears
  async horse(s, a, root) {
    const y0 = a.position.y, r0 = a.rotation.z, x0 = a.rotation.x;
    for (let i = 0; i < 4; i++) {
      (i % 2 ? sfx.tick : sfx.tap)();
      bits(s, root, a.position.clone().add(new T.Vector3((i % 2 ? 0.35 : -0.35), 0.1, 0.3)), 0xd9b27a, 3, { up: 1.2, spread: 0.8, r: 0.08, life: 0.35 });
      await s.anim(0.24, (_, p) => { a.position.y = y0 + Math.sin(p * Math.PI) * 0.18; a.rotation.z = r0 + (i % 2 ? 1 : -1) * Math.sin(p * Math.PI) * 0.08; });
    }
    a.position.y = y0; a.rotation.z = r0;
    await s.anim(0.6, (_, p) => { a.rotation.x = x0 - Math.sin(p * Math.PI) * 0.35; });
    a.rotation.x = x0;
  },
  // the duck dunks in a puddle and splashes
  async duck(s, a, root) {
    const home = a.position.clone();
    puddle(s, root, a, 'water');
    await s.anim(0.45, (_, p) => { a.position.y = home.y - Math.sin(p * Math.PI / 2) * 0.35; a.rotation.x = Math.sin(p * Math.PI / 2) * 0.5; });
    sfx.splash();
    bits(s, root, home.clone().add(new T.Vector3(0, 0.3, 0.3)), 0x7fd0ff, 14, { up: 4, spread: 2.2, r: 0.1 });
    await s.anim(0.6, (_, p) => { a.position.y = home.y - 0.35 + Math.sin(p * Math.PI) * 0.9 + p * 0.35; a.rotation.x = 0.5 * (1 - p); }, Ease.out);
    a.position.copy(home); a.rotation.x = 0;
  },
};
