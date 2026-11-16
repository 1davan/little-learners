// Home: one page per world (meadow, beach…) with five big, bouncy game objects. Tap one to play; swipe for the next world.
// Every icon, pedestal, level hat and sticker crown is a Blender model (tools/blender/creatures/prop_icon_*.py, plus the
// shared creatures and props); the old code-built shapes stay only as fallbacks for when a model isn't built.
import * as T from './three.js';
import { scene, onFrame, camera, getLook, CAM_HOME, setSky } from './engine/stage.js';
import { scope, Ease } from './engine/tween.js';
import { input } from './engine/input.js';
import { speech } from './engine/speech.js';
import { sfx, setAmbience } from './engine/audio.js';
import { fx } from './engine/fx.js';
import { store } from './engine/store.js';
import { mesh, geo, toon, basic, disposeTree, ink } from './engine/toon.js';
import { C, makePip, makeAnimal, makeFace, hop, dance, breathe, popIn } from './engine/actors.js';
import { makeScenery, makeTree, animateScenery, makeStarfish, makePumpkin, makeLantern, glow } from './engine/scenery.js';
import { theme } from './engine/theme.js';
import { physics } from './engine/physics.js';
import { renderShelf, checkSleepy, setPageHandler, renderPages, setLevelHandler, setUiWorld } from './engine/ui.js';
import { WORLDS } from './lessons/meta.js';
import { makeCreature, hasCreature, garmentProp } from './engine/creature.js';
import { propModel, propAnchor } from './engine/prop-models.js';
import { makeFarmAnimal, makeCarrot, makeDrum, makePot, makeChick } from './engine/farm.js';
import { makeSunflower } from './engine/scenery.js';
import { makeCrab, makeBucket, makeBeachBall, makeShell, makeSponge, makeDuck, makeBubble } from './engine/beach.js';
import { makeBrick } from './lessons/bricks-pieces.js';
import { layoutLetter } from './lessons/bricks-letters.js';

let greeted = false;

// ---- Blender model helpers ----
// A built creature-style model, or null (callers fall back to the old code-built shape).
const creature = (kind) => (hasCreature(kind) ? makeCreature(kind) : null);
// The creature inside a propModel wrapper (or the object itself).
const modelOf = (o) => o.userData.model || o;
// Where a hat or crown rides: the head bone (so it turns and nods with the head), else the model's body bone (so it
// sways with the toy), else the object itself.
function mountOf(o) {
  const u = modelOf(o).userData;
  return u.head?.isBone ? u.head : u.body?.isBone ? u.body : modelOf(o);
}
// Layer names and outline weight of a model (read once from a throwaway instance).
const _info = new Map();
function modelInfo(kind) {
  if (!_info.has(kind)) {
    const c = makeCreature(kind);
    _info.set(kind, { layers: Object.keys(c.userData.layers || {}).filter((n) => !/^cloth/.test(n)), outline: c.children[0]?.userData.outline ?? 0.025 });
  }
  return _info.get(kind);
}
// A Blender prop as plain static meshes sharing the loaded geometry: no skeleton, no idle sway, no per-frame cost.
// For things that sit still: pedestals, hats, crowns, pedestal trim. tint: colour for the base layer (painted white /
// greys in Blender); layerTint: { layerName: colour } for others; unlit: layer names drawn flat (glowing lanterns).
function staticProp(kind, { tint = null, layerTint = {}, unlit = [] } = {}) {
  if (!hasCreature(kind)) return null;
  const info = modelInfo(kind);
  const g = new T.Group();
  for (const name of [kind, ...info.layers]) {
    const gp = garmentProp(kind, name);
    const src = gp && gp.children[0].children.find((o) => o.isMesh && !o.userData.outline);
    if (!src) continue;
    const col = name === kind ? tint ?? 0xffffff : layerTint[name] ?? 0xffffff;
    const mat = unlit.includes(name) ? basic(col, { vertexColors: true }) : toon(col, { vertexColors: true });
    const m = mesh(src.geometry, col, { outline: name === kind ? info.outline : info.outline * 0.8, mat });
    m.position.copy(src.position); m.quaternion.copy(src.quaternion); m.scale.copy(src.scale);
    m.name = name;
    g.add(m);
  }
  return g;
}
// Recolour one layer of a creature-style model (its white / grey paint times the colour).
function tintLayer(m, name, col) {
  const L = m.userData.layers?.[name];
  if (!L) return;
  L.mesh.material = L.mesh.material.clone();
  L.mesh.material.color.set(col);
}

// ---- meadow world icons ----
function iconColours() {
  const w = propModel('prop_icon_tubes'); // three toy tubes in a wooden rack, a ball bobbing in each
  if (w) return w;
  const g = new T.Group();
  [[C.red, -0.75], [C.blue, 0], [C.yellow, 0.75]].forEach(([c, x], i) => {
    const glass = new T.Mesh(geo.cyl(0.36, 0.36, 1.6, 20, true), new T.MeshToonMaterial({ color: c, transparent: true, opacity: 0.35, side: T.DoubleSide, depthWrite: false }));
    glass.position.set(x, 0.95, 0);
    const base = mesh(geo.cyl(0.42, 0.44, 0.2, 20), c, { outline: 0.03 }); base.position.set(x, 0.1, 0);
    const ball = mesh(geo.sphere(0.3, 16, 12), c, { outline: 0.03 }); ball.position.set(x, 0.5 + i * 0.15, 0);
    g.add(glass, base, ball);
  });
  return g;
}
function iconCounting(world, level) {
  // the apple tree follows the meadow's season: orange in autumn, snow-capped in winter
  const autumn = world === 'meadow' && level === 1, winter = world === 'meadow' && level === 2;
  const w = propModel('prop_icon_tree');
  if (w) {
    const m = w.userData.model;
    tintLayer(m, 'canopy', autumn ? 0xf7953a : 0x5cc45a);
    if (winter) m.userData.wear('cloth_snow', true);
    w.scale.setScalar(0.92);
    return w;
  }
  const t = autumn ? makeTree(0.85, 0xf08a2c) : makeTree(0.85, C.leaf, { snow: winter });
  [[-0.6, 2.4], [0.5, 2.7], [0.1, 1.9]].forEach(([x, y]) => {
    const a = mesh(geo.sphere(0.3, 16, 12), 0xff4b4b, { outline: 0.03 }); a.position.set(x / 0.85, y / 0.85, 1.25); t.add(a);
  });
  return t;
}
function iconShapes() {
  const w = propModel('prop_icon_house'); // a toy shape-sorter cottage: circle, square, triangle on the front
  if (w) return w;
  const g = new T.Group();
  const wall = mesh(geo.box(2.3, 1.7, 0.5), 0xfff1d6, { hull: 1.03 }); wall.position.y = 0.85;
  const rs = new T.Shape(); rs.moveTo(-1.45, 0); rs.lineTo(1.45, 0); rs.lineTo(0, 1); rs.closePath();
  const rg = new T.ExtrudeGeometry(rs, { depth: 0.7, bevelEnabled: false }); rg.translate(0, 0, -0.35);
  const roof = mesh(rg, 0xff6b5a, { hull: 1.03 }); roof.position.y = 1.7;
  g.add(wall, roof);
  return g;
}
function iconFeelings() {
  const b = creature('prop_icon_balloon'); // a smiling balloon (code face, so it blinks) tied to a little present
  if (b) return b;
  const g = new T.Group();
  const ball = mesh(geo.sphere(0.95, 24, 18), 0xffc83a, { outline: 0.04 }); ball.position.y = 2.15;
  const face = makeFace(0.95); ball.add(face);
  const string = new T.Mesh(geo.cyl(0.02, 0.02, 1.3, 4), basic(0x555555)); string.position.y = 0.65;
  g.add(ball, string);
  g.userData.face = face;
  return g;
}
function iconSizes() {
  const g = new T.Group();
  const big = makeAnimal('elephant'); big.scale.setScalar(0.72); big.position.x = -0.35;
  const small = makeAnimal('elephant'); small.scale.setScalar(0.36); small.position.set(0.95, 0, 0.5); small.rotation.y = -0.35;
  g.add(big, small);
  return g;
}
// ---- beach world icons ----
function iconPatterns() {
  const c = creature('prop_icon_caterpillar'); // a caterpillar whose body goes red, blue, red, blue
  if (c) { c.scale.setScalar(0.95); c.position.x = -0.05; c.rotation.y = -0.18; const g = new T.Group(); g.add(c); return g; }
  const g = new T.Group();
  [C.red, C.blue, C.red, C.blue].forEach((col, i) => { const b = makeBeachBall(0.32, [col, col, col]); b.position.set(-0.85 + i * 0.57, 0.45, 0); g.add(b); });
  return g;
}
function iconWhere() {
  const g = new T.Group();
  const b = makeBucket(0x4a90ff, 0.75, 0.9);
  const crab = makeCrab();
  crab.scale.setScalar(0.6);
  crab.position.set(0, 0.92, 0.05);
  g.add(b, crab);
  return g;
}
// lots of shells on the left, just one on the right
const SHELLS = [[-1.0, 0.3, 0xffb6c9, 0.2], [-0.38, 0.38, 0xffd9a8, -0.15], [-0.72, -0.12, 0xd8b6ff, 0.05], [-1.12, -0.42, 0xfff4e8, 0.3],
  [-0.3, -0.36, 0xffb6c9, -0.25]];
function iconMore() {
  const g = new T.Group();
  if (hasCreature('prop_icon_shell')) {
    const shell = (col, x, z, spin, s = 0.8) => {
      const w = staticProp('prop_icon_shell', { tint: col });
      w.scale.setScalar(s);
      w.rotation.set(1.05, Math.PI + spin, 0); // stood up on its hinge, fan toward the viewer
      w.position.set(x, 0.24 * s, z);
      g.add(w);
      return w;
    };
    SHELLS.forEach(([x, z, col, spin]) => shell(col, x, z, spin));
    shell(0xffd9a8, 0.92, 0.15, -0.1);
    return g;
  }
  const cols = [0xffb6c9, 0xffffff, 0xffd9a8, 0xd8b6ff, 0xffb6c9];
  const many = [[-0.95, 0.15, 0.2], [-0.55, 0.15, 0.35], [-0.75, 0.42, 0.25], [-1.15, 0.15, -0.1], [-0.45, 0.4, 0]];
  many.forEach(([x, y, z], i) => { const s = makeShell(cols[i], 0.7); s.position.set(x, y, z); g.add(s); });
  const one = makeShell(0xffd9a8, 0.7); one.position.set(0.85, 0.15, 0.2); g.add(one);
  return g;
}
function iconBody() {
  const b = makeAnimal('bear');
  b.scale.setScalar(0.85);
  return b;
}
function iconWash() {
  const g = new T.Group();
  const bath = propModel('prop_icon_bath'); // a clawfoot tub heaped with foam, sponge on the rim
  if (bath) {
    bath.scale.setScalar(0.95);
    g.add(bath);
    const duck = makeDuck(0.62); duck.position.set(-0.3, 1.05, 0.28); duck.rotation.y = 0.35; g.add(duck);
    return g;
  }
  const tub = makeBucket(0xffffff, 1.05, 0.7);
  g.add(tub);
  const duck = makeDuck(0.6); duck.position.set(0.1, 0.75, 0.3); g.add(duck);
  for (let i = 0; i < 6; i++) { const b = makeBubble(0.2 + (i % 3) * 0.06); b.position.set(-0.6 + (i % 3) * 0.6, 0.85 + Math.floor(i / 3) * 0.3, (i % 2) * 0.2); g.add(b); }
  const sp = makeSponge(); sp.scale.setScalar(0.55); sp.position.set(1.0, 1.55, 0.2); sp.rotation.z = -0.4; g.add(sp);
  return g;
}

// ---- farm world icons ----
// Monkey dressed for the level's look: a sun hat from the hat shop (L1), a party dress in the dressing room (L2),
// raincoat and wellies by the rainy window (L3). Falls back to any garment of the same slot.
const DRESS_OUTFIT = [['cloth_head_sunhat'], ['cloth_body_dress', 'cloth_neck_bowtie'], ['cloth_body_raincoat', 'cloth_feet_wellies']];
function iconDress(world, level = 0) {
  if (!hasCreature('monkey')) return makeAnimal('bear');
  const m = makeCreature('monkey');
  m.scale.setScalar(0.85);
  const names = Object.keys(m.userData.layers || {});
  for (const want of DRESS_OUTFIT[level] || DRESS_OUTFIT[0]) {
    if (m.userData.wear(want, true)) continue;
    const slot = want.split('_')[1], alt = names.find((n) => n.startsWith('cloth_' + slot + '_'));
    if (alt) m.userData.wear(alt, true);
  }
  return m;
}
function iconMoo() { const c = makeFarmAnimal('cow'); c.scale.setScalar(0.8); return c; }
function iconGrow() {
  const g = new T.Group();
  const pot = propModel('prop_pot', { tint: 0xd9774a, size: [0.7, 0.86 / 1.3, 0.7] });
  const flower = propModel('prop_icon_sunflower');
  if (pot && flower) {
    flower.position.y = 0.76; // the soil mound fills the pot just under its rim
    g.add(pot, flower);
    return g;
  }
  const p = mesh(geo.cyl(0.7, 0.5, 0.8, 18), 0xd9774a, { outline: 0.03 }); p.position.y = 0.4;
  const stem = mesh(geo.cyl(0.06, 0.08, 1.2, 8), 0x4f9e3a, { outline: 0.012 }); stem.position.y = 1.3;
  const sf = makeSunflower(0.01); sf.position.y = 1.85; sf.scale.setScalar(1.3);
  g.add(p, stem, sf);
  return g;
}
function iconShare() {
  const g = new T.Group();
  const b = makeAnimal('bunny'); b.scale.setScalar(0.7); g.add(b);
  const c = propModel('prop_carrot', { size: 0.95 }) || makeCarrot(0.9);
  // held up in the bunny's paw
  const hand = b.userData.anchors?.handR;
  if (hand) c.position.set(hand[0] * 0.7 + 0.22, hand[1] * 0.7 + 0.28, hand[2] * 0.7 + 0.12);
  else c.position.set(0.75, 0.9, 0.5);
  c.rotation.z = -0.55;
  g.add(c);
  return g;
}
function iconBand() {
  return propModel('prop_icon_drum') || makeDrum(0xd94f3d, 1.0, 0.95); // drum with two sticks resting on top
}
// any game without its own icon yet: a big gold star
function iconFallback() {
  const s = new T.Shape();
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2, r = i % 2 ? 0.45 : 1; s[i ? 'lineTo' : 'moveTo'](Math.sin(a) * r, Math.cos(a) * r); }
  const g = new T.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08 }); g.translate(0, 1.1, -0.15);
  const o = new T.Group(); o.add(mesh(g, C.yellow, { outline: 0.03 }));
  return o;
}
function iconPots() {
  const g = new T.Group();
  // the flowerpot tipped up on one edge, the chick peeking out from underneath
  const p = makePot(); p.scale.setScalar(0.8); p.rotation.z = 0.35; p.position.set(-0.3, 0.37, -0.2); g.add(p);
  p.traverse((o) => { if (o.isMesh && o.renderOrder === -1) o.visible = false; }); // its blob shadow would tip with it
  const c = makeChick(0.75); c.position.set(0.5, 0, 0.32); c.rotation.y = -0.3; g.add(c);
  return g;
}

// Brick letters: a little capital A clicked together from five toy bricks, with two spare bricks at its feet.
function iconBricks() {
  const g = new T.Group();
  const k = 0.42, cols = [0xff4f4f, 0x3f8cff, 0xffd23a, 0x4cc75a, 0xff9a2e, 0x9b6dff, 0xff7fbf];
  const t = 0.62 * k, lay = layoutLetter('A', 5, { H: 2.3, t });
  // the A stands on its two feet: lift it so its lowest (rounded) corner touches the pedestal
  const low = Math.min(...lay.slots.map((s) => s.y - (Math.abs(Math.sin(s.ang)) * (s.len / 2 - 0.11 * k) + Math.abs(Math.cos(s.ang)) * (t / 2 - 0.11 * k) + 0.11 * k)));
  lay.slots.forEach((s, i) => { const b = makeBrick(cols[i], s.len, k); b.position.set(s.x - lay.W / 2, s.y - low, 0); b.rotation.z = s.ang; g.add(b); });
  // two spares lying studs-up on the pedestal, clear of the A
  [[1.0, 0.75, 0.15, cols[5]], [-1.05, 0.62, -0.1, cols[6]]].forEach(([x, z, r, c]) => { const b = makeBrick(c, 0.55, k); b.position.set(x, 0.25 * k, z); b.rotation.set(-Math.PI / 2, 0, r); g.add(b); });
  return g;
}
const ICONS = { colours: iconColours, counting: iconCounting, shapes: iconShapes, feelings: iconFeelings, sizes: iconSizes,
  patterns: iconPatterns, where: iconWhere, more: iconMore, body: iconBody, wash: iconWash,
  moo: iconMoo, grow: iconGrow, share: iconShare, band: iconBand, pots: iconPots, dress: iconDress, bricks: iconBricks };
const SPOTS = [[-6, 0.4], [-3, -0.6], [0, -1], [3, -0.6], [6, 0.4]];
const PED_TOP = 0.22; // icons stand on top of their pedestal
const GREETING = { meadow: 'The meadow! Tap a game!', beach: 'The beach! Tap a game!', farm: 'The farm! Tap a game!', dressup: 'Dress up time! Tap Monkey!', build: 'The building site! Tap the bricks!' };
const CENTER_Y = { colours: 1, counting: 1.8, shapes: 1.1, feelings: 1.7, sizes: 1.1, patterns: 0.8, where: 1.0, more: 0.5, body: 1.2, wash: 0.9, moo: 1.4, grow: 1.1, share: 1.0, band: 0.6, pots: 0.8, dress: 1.3, bricks: 1.2 };

// Gold sticker crown (3+ stickers): band radius ~0.42, base at y 0.
function makeCrown() {
  const m = staticProp('prop_icon_crown');
  if (m) return m;
  const g = new T.Group();
  const band = mesh(geo.cyl(0.42, 0.42, 0.25, 16, true), C.yellow, { outline: 0.03 });
  g.add(band);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const p = mesh(geo.cone(0.12, 0.3, 6), C.yellow, { outline: 0.02 });
    p.position.set(Math.cos(a) * 0.38, 0.25, Math.sin(a) * 0.38);
    g.add(p);
  }
  return g;
}

// ---- per-level looks for the home icons: a seasonal hat on every object, a tint, and a decorated pedestal ----
// Highest point of an object (in its parent's space), so a hat can sit on it.
function topOf(o) {
  o.updateMatrixWorld(true);
  const v = new T.Vector3();
  let best = null;
  o.traverse((m) => {
    if (!m.isMesh || m.isInstancedMesh || m.userData.outline || !m.geometry?.attributes?.position) return;
    for (let p = m; p && p !== o.parent; p = p.parent) if (!p.visible) return; // skip hidden garments
    const mt = m.material;
    if (!mt || mt.visible === false || (mt.transparent && mt.opacity < 0.5)) return;
    const p = m.geometry.attributes.position, step = Math.max(1, Math.floor(p.count / 500));
    for (let i = 0; i < p.count; i += step) {
      v.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld);
      if (!best || v.y > best.y) best = v.clone();
    }
  });
  return best || new T.Vector3(0, 2, 0);
}
// Shift every lit material of an object a little toward the season's colour.
function tintObject(o, [col, amt]) {
  const c = new T.Color(col), done = new Map();
  o.traverse((m) => {
    if (!m.isMesh || m.userData.outline || !m.material || Array.isArray(m.material) || m.material.isMeshBasicMaterial || !m.material.color) return;
    if (!done.has(m.material)) { const n = m.material.clone(); n.userData = {}; n.color.lerp(c, amt); done.set(m.material, n); }
    m.material = done.get(m.material);
  });
}
const lerpHex = (a, b, k) => new T.Color(a).lerp(new T.Color(b), k).getHex();
const half = (r, w = 16, h = 8) => new T.SphereGeometry(r, w, h, 0, Math.PI * 2, 0, Math.PI / 2);
function pompom(col, r, y) { const p = mesh(geo.sphere(r, 12, 10), col, { outline: 0.015 }); p.position.y = y; return p; }

// Code-built hats (fallbacks for the Blender ones), base at y = 0, about 0.85 wide.
const HATS = {
  leaves() { // a little crown of autumn leaves with an acorn
    const g = new T.Group();
    [[0xff8a1f, -0.5], [0xe8503a, 0], [0xffc23a, 0.5]].forEach(([c, a]) => {
      const l = mesh(geo.sphere(0.22, 10, 8), c, { outline: 0.015 });
      l.scale.set(0.7, 1.6, 0.25); l.position.set(Math.sin(a) * 0.28, 0.28, 0); l.rotation.z = -a;
      g.add(l);
    });
    const nut = mesh(geo.sphere(0.13, 10, 8), 0xc98b4f, { outline: 0.015 }); nut.position.set(0.18, 0.1, 0.18);
    const cap = mesh(half(0.15), 0x7a5230, { outline: 0.012 }); cap.position.set(0.18, 0.15, 0.18);
    g.add(nut, cap);
    return g;
  },
  beanie(col) { // bobble hat for the snow
    const g = new T.Group();
    const dome = mesh(half(0.42, 18, 10), col, { outline: 0.025 }); dome.scale.y = 1.05;
    const band = mesh(geo.torus(0.41, 0.09, Math.PI * 2, 8, 22), 0xffffff, { outline: 0.015 }); band.rotation.x = Math.PI / 2; band.position.y = 0.04;
    g.add(dome, band, pompom(0xffffff, 0.16, 0.48));
    return g;
  },
  flower() { // a hibiscus for the sunset
    const g = new T.Group();
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const p = mesh(geo.sphere(0.16, 10, 8), 0xff6b9a, { outline: 0.012 });
      p.scale.set(1, 0.35, 1.5); p.position.set(Math.cos(a) * 0.2, 0.1, Math.sin(a) * 0.2); p.rotation.y = -a + Math.PI / 2;
      g.add(p);
    }
    g.add(pompom(0xffd23f, 0.09, 0.16));
    g.rotation.x = 0.5;
    return g;
  },
  nightcap(col) { // sleepy cap with a star on the end
    const g = new T.Group();
    const cone = mesh(geo.cone(0.4, 0.9, 16), col, { outline: 0.025 }); cone.position.set(0.08, 0.42, 0); cone.rotation.z = -0.45;
    const band = mesh(geo.torus(0.38, 0.1, Math.PI * 2, 8, 22), 0xffffff, { outline: 0.015 }); band.rotation.x = Math.PI / 2; band.position.y = 0.05;
    const tip = pompom(0xffe27a, 0.12, 0.78); tip.position.x = 0.45;
    const gl = glow(0xffe27a, 0.9, 0.6); gl.position.copy(tip.position);
    g.add(cone, band, tip, gl);
    return g;
  },
  straw() { // straw hat for the harvest
    const g = new T.Group();
    const brim = mesh(geo.cyl(0.62, 0.62, 0.05, 20), 0xf0c648, { outline: 0.015 });
    const crown = mesh(geo.cyl(0.3, 0.36, 0.3, 18), 0xf0c648, { outline: 0.015 }); crown.position.y = 0.17;
    const band = mesh(geo.cyl(0.365, 0.365, 0.08, 18), 0xff5a5a, { outline: 0 }); band.position.y = 0.07;
    const leaf = mesh(geo.sphere(0.1, 8, 6), 0xff8a1f, { outline: 0.01 }); leaf.scale.set(1.4, 0.4, 0.8); leaf.position.set(0.33, 0.12, 0.12);
    g.add(brim, crown, band, leaf);
    return g;
  },
  rainhat() { // a yellow sou'wester for the rain (no pole to poke through anyone's head)
    const g = new T.Group();
    const crown = mesh(half(0.36, 18, 8), 0xffd23f, { outline: 0.02 }); crown.scale.y = 0.85;
    const brim = mesh(geo.cyl(0.62, 0.62, 0.05, 22), 0xffd23f, { outline: 0.015 }); brim.position.set(0, 0.03, -0.05); brim.rotation.x = 0.22;
    const seam = mesh(geo.torus(0.35, 0.03, Math.PI * 2, 6, 22), 0xe0a800, { outline: 0 }); seam.rotation.x = Math.PI / 2; seam.position.y = 0.06;
    g.add(crown, brim, seam, pompom(0xe0a800, 0.06, 0.32));
    return g;
  },
};
const HAT_FOR = { meadow: [null, 'leaves', 'beanie'], beach: [null, 'flower', 'nightcap'], farm: [null, 'straw', 'rainhat'] };
// Blender hats (base at y 0, ~0.85 across like the code ones). The straw hat is the big Where's-Crab sun hat, shrunk.
const HAT_MODEL = { leaves: 'prop_icon_hat_leaves', beanie: 'prop_icon_hat_beanie', flower: 'prop_icon_hat_flower', nightcap: 'prop_icon_hat_nightcap', straw: 'prop_hat', rainhat: 'prop_icon_hat_rain' };
const HAT_FIT = { straw: 0.36, leaves: 1.2 };
const HAT_TINTS = { beanie: true, nightcap: true }; // the others keep their own colours
// how far (in hat units) each hat slips down over the crown of the head, so it is worn rather than balanced on top
const HAT_SINK = { leaves: 0.02, beanie: 0.17, flower: 0.0, nightcap: 0.15, straw: 0.07, rainhat: 0.1 };
function makeHat(kind, col) {
  const h = staticProp(HAT_MODEL[kind], { tint: HAT_TINTS[kind] ? col : null });
  if (!h) return HATS[kind](col);
  const g = new T.Group();
  if (HAT_FIT[kind]) h.scale.setScalar(HAT_FIT[kind]);
  h.position.y = -(HAT_SINK[kind] || 0);
  g.add(h);
  if (kind === 'nightcap') { // the pompom glows
    const gl = glow(0xffe27a, 0.9, 0.6); gl.position.set(0.52, 0.5 - HAT_SINK.nightcap, 0); g.add(gl);
  }
  g.userData.top = new T.Box3().setFromObject(h).max.y;
  return g;
}
const HAT_SIZE = { feelings: 1.25, pots: 0.7, where: 0.7, wash: 0.6, patterns: 0.8 };
// Long ears or horns stick up past the head: drop the hat this share of the wearer's height so it sits on the head.
const HAT_DROP = {};
// Hats go on characters only (never on drums, pots or flowers). Returns the part of the icon that wears it.
const HAT_ON = {
  feelings: (o) => o, body: (o) => o, moo: (o) => o,
  sizes: (o) => o.children[0], // the big elephant
  share: (o) => o.children[0], // the bunny
  pots: (o) => o.children[1], // the chick
  where: (o) => o.children[1], // the crab
  wash: (o) => o.children[1], // the rubber duck
  patterns: (o) => o.children[0], // the caterpillar
};
// Top of a character's head (world): the highest skin point in a thin column straight over the head bone, so ears,
// horns and antennae either side don't count. Null for things without a head (then the overall top is used).
function headTop(w) {
  const hb = mountOf(w), u = modelOf(w).userData;
  if (!hb.isBone || hb === u.body) return null;
  w.updateMatrixWorld(true);
  const c = hb.getWorldPosition(new T.Vector3());
  const r = 0.16 * w.getWorldScale(new T.Vector3()).y;
  const v = new T.Vector3();
  let best = null;
  w.traverse((m) => {
    if (!m.isMesh || m.userData.outline || !m.geometry?.attributes?.position) return;
    for (let p = m; p && p !== w.parent; p = p.parent) if (!p.visible) return;
    const p = m.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld);
      if (v.y > c.y && Math.hypot(v.x - c.x, v.z - c.z) < r && (!best || v.y > best.y)) best = v.clone();
    }
  });
  return best;
}
// The top of a wearer's head (world), when the highest point isn't it (the caterpillar's antennae).
const HEAD_TOP = { patterns: (w) => { const h = w.userData.head; return h?.isBone ? h.localToWorld(new T.Vector3(0, 0.66, 0)) : null; } };

// Sit obj on `mount` at a world point, at a world size, upright in the icon's frame.
function perch(mount, obj, worldPos, worldSize, frame) {
  mount.updateMatrixWorld(true);
  const ws = mount.getWorldScale(new T.Vector3());
  obj.scale.setScalar(worldSize / ws.y);
  obj.position.copy(mount.worldToLocal(worldPos.clone()));
  const q = mount.getWorldQuaternion(new T.Quaternion()).invert();
  obj.quaternion.copy(q.multiply(frame.getWorldQuaternion(new T.Quaternion())));
  mount.add(obj);
  obj.updateMatrixWorld(true);
}

// Put the level's hat on an object; returns the hat (riding the wearer's head bone), or null.
function addHat(o, world, level, col, size = 1, wearer = o, drop = 0, customTop = null) {
  const kind = HAT_FOR[world]?.[level];
  if (!kind || !wearer) return null;
  const top = (customTop && customTop(wearer)) || headTop(wearer) || topOf(wearer);
  if (drop) top.y -= drop * (top.y - wearer.getWorldPosition(new T.Vector3()).y);
  const hat = makeHat(kind, lerpHex(col, 0xffffff, 0.1));
  const ws = new T.Vector3(); o.getWorldScale(ws);
  perch(mountOf(wearer), hat, top.add(new T.Vector3(0, -0.06 * ws.y, 0)), size * ws.y, o);
  return hat;
}

// The sticker crown: on top of the level hat, else on the wearer's head (or the toy's top), riding with it.
function addCrown(o, hat, wearer, id) {
  const crown = makeCrown();
  if (hat) { crown.position.y = hat.userData.top - 0.05; crown.scale.setScalar(0.85); hat.add(crown); return crown; }
  const top = (HEAD_TOP[id] && HEAD_TOP[id](wearer)) || headTop(wearer) || topOf(wearer);
  if (HAT_DROP[id]) top.y -= HAT_DROP[id] * (top.y - wearer.getWorldPosition(new T.Vector3()).y);
  perch(mountOf(wearer), crown, top.add(new T.Vector3(0, -0.07, 0)), 1, o);
  return crown;
}

// The soft toy pedestal under each game, in the game's colour.
function makePedestal(col) {
  const p = staticProp('prop_icon_pedestal', { tint: col, layerTint: { piping: lerpHex(col, 0xffffff, 0.75) } });
  if (p) return p;
  const m = mesh(geo.cyl(1.35, 1.45, 0.22, 28), col, { outline: 0.03 });
  m.position.y = 0.11;
  const g = new T.Group(); g.add(m);
  return g;
}

// Seasonal trim around a pedestal. Returns the objects (added to parent) and an optional animator.
function decoratePedestal(parent, world, level, col, x, z, i) {
  const out = [];
  const add = (o, dx, dy, dz) => { o.position.set(x + dx, dy, z + dz); parent.add(o); out.push(o); return o; };
  const key = world + level;
  const lantern = (lcol, night) => {
    const post = staticProp('prop_icon_lanternpost', { layerTint: { lantern: lcol }, unlit: night ? ['lantern'] : [] });
    if (post) {
      add(post, 1.32, 0, -0.95);
      if (night) { const gl = glow(lcol, 1.6, 0.7); gl.position.set(0.24, 1.22, 0); post.add(gl); }
      return;
    }
    const lan = makeLantern(lcol, night ? 0.7 : 0.35); lan.scale.setScalar(0.75);
    const stake = mesh(geo.cyl(0.03, 0.03, 1.2, 6), 0x7a5230, { outline: 0.01 });
    add(stake, 1.4, 0.6, -1.0); add(lan, 1.4, 1.32, -1.0);
  };
  if (key === 'meadow1' || key === 'farm1') {
    // fallen leaves on the pedestal rim and a little pumpkin beside it
    const ring = staticProp('prop_icon_leafring');
    if (ring) { ring.rotation.y = i * 1.7; add(ring, 0, 0, 0); }
    else for (let k = 0; k < 7; k++) {
      const a = (k / 7) * Math.PI * 2 + i;
      const l = mesh(geo.sphere(0.16, 8, 6), [0xff8a1f, 0xe8503a, 0xffc23a][k % 3], { outline: 0.01 });
      l.scale.set(1, 0.2, 0.6); l.rotation.y = a;
      add(l, Math.cos(a) * 1.2, 0.24, Math.sin(a) * 1.2);
    }
    const p = makePumpkin(key === 'farm1' ? 0.5 : 0.42); p.rotation.y = i;
    add(p, 0.95, 0.2, -0.7);
  } else if (key === 'meadow2') {
    // snow piled on the pedestal edge, with snowballs
    const snow = staticProp('prop_icon_snowring');
    if (snow) { snow.rotation.y = i * 1.3; add(snow, 0, 0, 0); }
    else {
      const s = mesh(geo.torus(1.36, 0.17, Math.PI * 2, 8, 40), 0xffffff, { outline: 0.02 }); s.rotation.x = Math.PI / 2; s.scale.z = 0.7;
      add(s, 0, 0.22, 0);
    }
  } else if (key === 'beach1') {
    lantern([0xff8fb0, 0xffb04a, 0xffe066, 0xb197fc, 0x74c0fc][i % 5], false);
  } else if (key === 'beach2') {
    // a soft glowing ring around the pedestal and a glowing lantern
    const ring = new T.Mesh(new T.RingGeometry(1.4, 1.9, 40), new T.MeshBasicMaterial({ color: lerpHex(col, 0xffffff, 0.3), transparent: true, opacity: 0.45, fog: false, depthWrite: false, blending: T.AdditiveBlending }));
    ring.rotation.x = -Math.PI / 2; add(ring, 0, 0.03, 0);
    lantern(0xffd27a, true);
    return { out, anim: (t) => { ring.material.opacity = 0.35 + Math.sin(t * 2 + i) * 0.15; } };
  } else if (key === 'farm2') {
    // a puddle round the pedestal, with ripples
    const pud = staticProp('prop_icon_puddle');
    if (pud) add(pud, 0.3, 0.0, -0.2);
    else {
      const m = new T.Mesh(geo.circle(1, 28), toon(0x8fc8ee)); m.rotation.x = -Math.PI / 2; m.scale.set(1.9, 1.3, 1);
      add(m, 0.3, 0.02, -0.2);
    }
    const ripple = new T.Mesh(new T.RingGeometry(0.3, 0.38, 20), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 }));
    ripple.rotation.x = -Math.PI / 2; add(ripple, 1.6, 0.05, -0.6);
    return { out, anim: (t) => { const k = ((t * 0.8 + i * 0.3) % 1); ripple.scale.setScalar(0.5 + k * 1.5); ripple.material.opacity = 0.8 * (1 - k); } };
  }
  return { out, anim: null };
}

export class Home {
  constructor(router, opts = {}) {
    this.router = router;
    this.opts = opts;
    this.root = new T.Group();
    this.s = scope();
    this.offs = [];
    this.idle = 0;
    this.dead = false;
    this.decoAnims = [];
  }

  async start() {
    physics.clear(); physics.ground(0);
    this.page = this.opts.page || 0;
    this.world = WORLDS[this.page];
    scene.add(this.root);
    this.level = store.level();
    setSky(this.world.id, this.level);
    setAmbience(this.world.id);
    this.meadow = makeScenery(this.world.id, this.level);
    this.root.add(this.meadow);
    // a world with a single game shows it big in the middle
    const solo = this.world.lessons.length === 1;
    const big = solo ? 1.75 : 1;
    this.objects = this.world.lessons.map((l, i) => {
      const o = (ICONS[l.id] || iconFallback)(this.world.id, this.level);
      const [x, z] = SPOTS[i + Math.floor((SPOTS.length - this.world.lessons.length) / 2)];
      o.position.set(x, PED_TOP, z);
      if (solo) { o.scale.multiplyScalar(big); o.userData.baseScale = o.scale.y; }
      o.userData.big = big;
      o.rotation.y = -x * 0.04;
      o.userData.lesson = l;
      o.userData.phase = i * 1.3;
      // the level's look: tint, seasonal hat, decorated pedestal
      const th = theme(this.world.id, this.level);
      if (th.tint) tintObject(o, th.tint);
      o.updateMatrixWorld(true);
      const wearer = HAT_ON[l.id] ? HAT_ON[l.id](o) : null;
      const hat = wearer ? addHat(o, this.world.id, this.level, new T.Color(l.color).getHex(), HAT_SIZE[l.id] || 1, wearer, HAT_DROP[l.id] || 0, HEAD_TOP[l.id]) : null;
      this.root.add(o);
      // a soft toy pedestal in the lesson colour so each target reads as one big button
      const pedCol = th.tint ? lerpHex(new T.Color(l.color).getHex(), th.tint[0], th.tint[1]) : new T.Color(l.color).getHex();
      const ped = makePedestal(pedCol);
      ped.position.set(x, 0, z);
      ped.rotation.y = i * 0.7;
      if (solo) ped.scale.set(1.45, 1, 1.45);
      this.root.add(ped);
      const deco = decoratePedestal(this.root, this.world.id, this.level, new T.Color(l.color).getHex(), x, z, i);
      if (deco.anim) this.decoAnims.push(deco.anim);
      if (store.stickers(l.id) >= 3) addCrown(o, hat, wearer || o, l.id);
      input.addTap(o, { radius: 1.45 * big, offset: new T.Vector3(0, (CENTER_Y[l.id] ?? 1) * big, 0), onTap: () => this.pick(o), onRelease: true });
      return o;
    });
    this.pip = makePip();
    // on the build site Pip stands up on the sandpit's front plank (0.32 tall) instead of sunk into it
    this.pip.position.set(0, this.world.id === 'build' ? 0.32 : 0, 6.6);
    this.pip.scale.setScalar(0.55);
    this.pip.userData.baseScale = 0.55;
    this.root.add(this.pip);
    addHat(this.pip, this.world.id, this.level, 0x6a8fff, 0.72);
    input.addTap(this.pip, { radius: 0.7, offset: new T.Vector3(0, 0.6, 0), onTap: () => this.tapPip(), onRelease: true });

    this.offs.push(input.onAny(() => { this.idle = 0; }));
    this.offs.push(onFrame((dt, t) => this.tick(dt, t)));
    this.offs.push(input.onSwipe((dir) => this.swipe(dir)));
    setPageHandler((dir) => this.swipe(dir));
    // tapping Level 1/2/3 rebuilds this page straight away in the new look
    setUiWorld(this.world.id);
    setLevelHandler(() => { if (!this.dead && !this.picking) this.router.go('home', { page: this.page, relevel: true }); });
    renderShelf(this.world.lessons, this.opts.newSticker || null);
    renderPages(this.page);
    // slide in from the side we swiped toward
    if (this.opts.from) {
      this.root.position.x = this.opts.from === 'left' ? 24 : -24;
      this.s.tween(this.root.position, { x: 0 }, 0.55, Ease.out);
    }

    await this.s.wait(0.4);
    if (this.opts.relevel) { sfx.sparkle(); dance(this.s, this.pip); speech.say(`Level ${this.level + 1}! ${theme(this.world.id, this.level).name}!`); }
    else if (this.opts.newSticker) { sfx.sparkle(); speech.say('Look! A new sticker! Tap another game!'); }
    else if (this.opts.from) { sfx.sparkle(); speech.say(GREETING[this.world.id] || 'Tap a game!'); }
    else if (!greeted) { greeted = true; dance(this.s, this.pip); speech.say("Hi! I'm Pip! Tap a game! Swipe for more games!"); }
    else speech.say('Tap one!');
  }

  tick(dt, t) {
    animateScenery(this.meadow, dt, t);
    for (const f of this.decoAnims) f(t);
    breathe(this.pip, t);
    for (const o of this.objects) {
      if (o.userData.busyAnim) continue;
      o.position.y = PED_TOP + Math.abs(Math.sin(t * 1.6 + o.userData.phase)) * 0.12;
      if (o.userData.face) breathe(o, t, o.userData.phase);
    }
    this.idle += dt;
    if (this.idle > 10 && !this.picking) {
      this.idle = 0;
      this.objects.forEach((o, i) => this.s.wait(i * 0.25).then(() => { hop(this.s, o, 0.6, 0.42, { sound: true }); sfx.note(i); }));
      speech.say('Tap one!');
    }
  }

  async swipe(dir) {
    if (this.picking || this.dead) return;
    this.picking = true;
    // swiping left (or tapping ▶) goes to the next world; right goes back. Wraps around.
    const n = WORLDS.length;
    const next = dir === 'left' ? (this.page + 1) % n : (this.page - 1 + n) % n;
    sfx.whoosh();
    await this.s.tween(this.root.position, { x: dir === 'left' ? -24 : 24 }, 0.35, Ease.in);
    this.router.go('home', { page: next, from: dir });
  }

  tapPip() {
    sfx.giggle();
    dance(this.s, this.pip);
    speech.say(["Hi! I'm Pip!", 'Hee hee! That tickles!', 'Tap a game!'][Math.floor(Math.random() * 3)]);
  }

  async pick(o) {
    if (this.picking) return;
    this.picking = true;
    input.lock(5000);
    const l = o.userData.lesson;
    sfx.boing();
    const cy = (CENTER_Y[l.id] ?? 1) * (o.userData.big || 1);
    fx.confetti(o.position.clone().add(new T.Vector3(0, cy, 0)), 30);
    hop(this.s, o, 0.8);
    speech.say(l.name);
    // camera swoops in toward the chosen object
    const look = getLook();
    const target = o.position.clone().add(new T.Vector3(0, cy, 0));
    this.s.tween(look, { x: target.x, y: target.y, z: target.z }, 0.65, Ease.inOut);
    await this.s.tween(camera.position, { x: target.x * 0.8, y: target.y + 1.5, z: target.z + 7 }, 0.7, Ease.inOut);
    input.unlock();
    this.router.go(l.id);
  }

  dispose() {
    physics.clear();
    this.dead = true;
    setLevelHandler(null);
    this.s.kill();
    input.clear();
    for (const f of this.offs) f();
    scene.remove(this.root);
    disposeTree(this.root);
  }
}
