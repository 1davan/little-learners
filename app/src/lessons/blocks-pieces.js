// Block builder pieces: the painted wooden toy blocks (Blender prop_blk_*), their ghost outlines, the corner furniture
// (build mat, model stand, tray, toy box, ramp) and the models to copy.
//
// Blocks are painted WHITE in Blender wherever their paint goes; each block here gets its own colour by swapping that
// white in the vertex colours (the bare-wood details stay wood). A block is a Group whose origin is the block's
// centre (so it turns and tumbles about its middle under physics); `h` is its height, `w` its width (units = cubes).
import * as T from '../three.js';
import { garmentProp, hasCreature } from '../engine/creature.js';
import { mesh, geo, toon, INK } from '../engine/toon.js';

// ---------- the shapes ----------
// w: width along x, h: height, rolls: rolls on a slope, name: what the caption calls it
export const SHAPES = {
  cube: { kind: 'prop_blk_cube', w: 1, h: 1, name: 'cube' },
  cuboid: { kind: 'prop_blk_cuboid', w: 2, h: 1, name: 'long block' },
  cyl: { kind: 'prop_blk_cyl', w: 1, h: 1, name: 'cylinder', rolls: true },
  cone: { kind: 'prop_blk_cone', w: 1, h: 1, name: 'cone' },
  roof: { kind: 'prop_blk_roof', w: 2, h: 1, name: 'roof' },
  arch: { kind: 'prop_blk_arch', w: 2, h: 1, name: 'arch' },
  ball: { kind: 'prop_blk_ball', w: 1, h: 1, name: 'ball', rolls: true },
};
export const COL = {
  red: 0xff5a4f, blue: 0x3f8cff, yellow: 0xffd23a, green: 0x4cc75a, orange: 0xff9a2e, purple: 0x9b6dff,
  pink: 0xff7fbf, teal: 0x2fc4b8, brown: 0xc98a52, white: 0xf7f1e3, sky: 0x7fc8ff, lime: 0xa6dc4a,
};
export const hexCss = (c) => '#' + c.toString(16).padStart(6, '0');

// ---------- block geometry (baked once per shape, recoloured once per shape + colour; shared, never disposed) ----------
const baked = new Map();
function bakedGeo(kind) {
  if (baked.has(kind)) return baked.get(kind);
  let g = null;
  const gp = hasCreature(kind) ? garmentProp(kind, kind) : null;
  if (gp) {
    let src = null;
    gp.traverse((o) => { if (o.isMesh && !o.userData.outline) src = o; });
    src.updateMatrix();
    g = new T.BufferGeometry();
    for (const k of ['position', 'normal', 'color']) if (src.geometry.attributes[k]) g.setAttribute(k, src.geometry.attributes[k].clone());
    g.setIndex(src.geometry.index.clone());
    g.applyMatrix4(src.matrix);
    g.computeBoundingBox();
    g.userData.shared = true;
  }
  baked.set(kind, g);
  return g;
}
const painted = new Map();
const _c = new T.Color();
function paintedGeo(shape, col) {
  const key = shape + ':' + col;
  if (painted.has(key)) return painted.get(key);
  const src = bakedGeo(SHAPES[shape].kind);
  let g = null;
  if (src) {
    g = src.clone();
    const c = g.attributes.color;
    if (c) {
      _c.setHex(col);
      const a = new T.BufferAttribute(new Float32Array(c.count * 3), 3);
      for (let i = 0; i < c.count; i++) {
        const r = c.getX(i), gg = c.getY(i), b = c.getZ(i);
        if (r > 0.93 && gg > 0.93 && b > 0.93) a.setXYZ(i, _c.r, _c.g, _c.b);
        else a.setXYZ(i, r, gg, b);
      }
      g.setAttribute('color', a);
    }
    g.userData.shared = true;
  }
  painted.set(key, g);
  return g;
}
// code fallback shapes (only if the models are not built)
function fallbackGeo(shape) {
  const s = SHAPES[shape];
  let g;
  if (shape === 'cyl') g = new T.CylinderGeometry(0.5, 0.5, 1, 28);
  else if (shape === 'cone') g = new T.ConeGeometry(0.5, 1, 28);
  else if (shape === 'ball') g = new T.SphereGeometry(0.5, 24, 16);
  else if (shape === 'roof') { const sh = new T.Shape([new T.Vector2(-1, 0), new T.Vector2(1, 0), new T.Vector2(0, 1)]); g = new T.ExtrudeGeometry(sh, { depth: 1, bevelEnabled: false }); g.translate(0, -0.5, -0.5); }
  else g = new T.BoxGeometry(s.w, 1, 1);
  if (shape !== 'roof') g.translate(0, 0.5, 0);
  else g.translate(0, 0.5, 0);
  g.userData.shared = true;
  return g;
}

// A block: Group (origin at the block's centre) > mesh (bottom at y -h/2) + ink outline. k = world size of one unit.
export function makeBlock(shape, col, k = 1) {
  const s = SHAPES[shape];
  const b = new T.Group();
  const g = paintedGeo(shape, col);
  const m = g ? mesh(g, 0xffffff, { outline: 0.02, mat: toon(0xffffff, { vertexColors: true }) }) : mesh(fallbackGeo(shape), col, { outline: 0.02 });
  m.position.y = -s.h / 2;
  b.add(m);
  b.scale.setScalar(k);
  Object.assign(b.userData, { shape, col, k, w: s.w, h: s.h, m });
  return b;
}

// ---------- ghosts: the faint shape of a slot on the mat ----------
// A soft white see-through copy of the block with a bright rim (back faces pushed out along the normals).
const ghostRim = new Map();
function rimMat() {
  const m = new T.MeshBasicMaterial({ color: 0xffffff, side: T.BackSide, transparent: true, opacity: 0.85, depthWrite: false });
  m.onBeforeCompile = (sh) => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', 'vec3 transformed = position + normal * 0.045;'); };
  m.customProgramCacheKey = () => 'blk-ghost-rim';
  return m;
}
export function makeGhost(shape, k = 1) {
  const s = SHAPES[shape];
  const g = new T.Group();
  const src = bakedGeo(s.kind) || fallbackGeo(shape);
  const fill = new T.Mesh(src, new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, depthWrite: false }));
  const rim = new T.Mesh(src, rimMat());
  fill.position.y = rim.position.y = -s.h / 2;
  fill.renderOrder = rim.renderOrder = 2;
  g.add(rim, fill);
  g.scale.setScalar(k);
  Object.assign(g.userData, { shape, fill, rim, w: s.w, h: s.h });
  return g;
}
export function setGhost(g, fillA, rimA, col = 0xffffff) {
  g.userData.fill.material.opacity = fillA;
  g.userData.rim.material.opacity = rimA;
  g.userData.fill.material.color.setHex(col);
  g.userData.rim.material.color.setHex(col);
}

// ---------- the corner furniture: plain static meshes sharing the loaded geometry (no sway, no skeleton) ----------
function staticModel(kind, layers = [], tints = {}) {
  if (!hasCreature(kind)) return null;
  const g = new T.Group();
  for (const name of [kind, ...layers]) {
    const gp = garmentProp(kind, name);
    let src = null;
    if (gp) gp.traverse((o) => { if (o.isMesh && !o.userData.outline) src = o; });
    if (!src) continue;
    const col = tints[name] ?? 0xffffff;
    const m = mesh(src.geometry, col, { outline: name === kind ? 0.022 : 0.016, mat: toon(col, { vertexColors: true }) });
    m.position.copy(src.position); m.quaternion.copy(src.quaternion); m.scale.copy(src.scale);
    m.name = name;
    g.add(m);
  }
  return g;
}
const box = (w, h, d, col, y = h / 2) => { const m = mesh(geo.box(w, h, d), col, { hull: 1.03 }); m.position.y = y; return m; };

export const MAT = { w: 6.4, d: 3.2, top: 0.205 };
export function makeMat(felt) {
  const m = staticModel('prop_blk_mat', ['felt', 'grid'], { felt });
  if (m) return m;
  const g = new T.Group();
  g.add(box(MAT.w, 0.16, MAT.d, 0xe8bf86));
  g.add(box(MAT.w - 0.44, 0.045, MAT.d - 0.44, felt, 0.18));
  return g;
}
export const STAND = { top: 1.45, r: 1.3 };
export function makeStand() {
  const m = staticModel('prop_blk_stand', ['pad']);
  if (m) return m;
  const g = new T.Group();
  const c = mesh(geo.cyl(0.48, 0.6, 1.2, 24), 0xffc21a, { outline: 0.02 }); c.position.y = 0.6; g.add(c);
  const t = mesh(geo.cyl(1.3, 1.3, 0.25, 32), 0xe8bf86, { outline: 0.02 }); t.position.y = 1.32; g.add(t);
  return g;
}
// two trays: the long one (11.0) and a short one (6.2) for Level 1's two- and three-block models
export const TRAY = { len: 11.0, short: 6.2, d: 1.7, floor: 0.12, rim: 0.34 };
export function makeTray(len = TRAY.len) {
  const short = len < 8;
  const m = staticModel(short ? 'prop_blk_tray_s' : 'prop_blk_tray', ['rim']);
  if (m) return m;
  const g = new T.Group();
  g.add(box(short ? TRAY.short : TRAY.len, TRAY.floor, TRAY.d, 0xe8bf86));
  return g;
}
// the keepsake shelf behind the mat: every finished model goes to stand on it
export const SHELF = { len: 5.8, d: 0.9, top: 0.72 };
export function makeShelf() {
  const m = staticModel('prop_blk_shelf', ['legs']);
  if (m) return m;
  const g = new T.Group();
  g.add(box(SHELF.len, 0.14, SHELF.d, 0xe8bf86, SHELF.top - 0.07));
  for (const sx of [-1, 1]) { const leg = box(0.3, SHELF.top - 0.14, SHELF.d - 0.1, 0xc98f55); leg.position.x = sx * (SHELF.len / 2 - 0.35); g.add(leg); }
  return g;
}
export const TOYBOX = { w: 2.6, h: 1.3, d: 1.7 };
export function makeToyBox() {
  const m = staticModel('prop_blk_box', ['stickers']);
  if (m) return m;
  const g = new T.Group();
  g.add(box(TOYBOX.w, TOYBOX.h, TOYBOX.d, 0xff5a4f));
  return g;
}
// The ramp: 4.6 wide, its slope from y 1.8 at the back (z -1.3) down to a 0.04 lip at the front (z +1.3); three lanes.
export const RAMP = { w: 4.6, l: 2.6, h: 1.8, lip: 0.04, lanes: [-1.53, 0, 1.53] };
RAMP.ang = Math.atan2(RAMP.h - RAMP.lip, RAMP.l);
export function makeRamp() {
  const m = staticModel('prop_blk_ramp', ['lanes', 'trim']);
  if (m) return m;
  const g = new T.Group();
  const w = new T.Mesh(rampGeo(), toon(0x3f8cff));
  g.add(w);
  return g;
}
// the ramp's exact solid (for its physics collider; also the fallback look)
export function rampGeo() {
  const { w, l, h, lip } = RAMP, x = w / 2, z = l / 2;
  const P = [[-x, 0, -z], [-x, 0, z], [-x, lip, z], [-x, h, -z], [x, 0, -z], [x, 0, z], [x, lip, z], [x, h, -z]];
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.BufferAttribute(new Float32Array(P.flat()), 3));
  g.setIndex([0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6, 0, 4, 5, 0, 5, 1, 1, 5, 6, 1, 6, 2, 2, 6, 7, 2, 7, 3, 3, 7, 4, 3, 4, 0]);
  g.computeVertexNormals();
  return g;
}
// the slope surface at local depth z (ramp space): its height
export const rampY = (z) => RAMP.lip + (RAMP.h - RAMP.lip) * (RAMP.l / 2 - z) / RAMP.l;

// ---------- the models to copy ----------
// Each slot: [shape, x, y (bottom, in cubes), colour]. Every model stands in one row facing us, so nothing hides.
const S = (shape, x, y, col) => ({ shape, x, y, col: COL[col] ?? col });
export const MODELS = {
  tree: { name: 'a tree', slots: [S('cyl', 0, 0, 'brown'), S('cone', 0, 1, 'green')], gag: 'bounce' },
  house: { name: 'a house', slots: [S('cuboid', 0, 0, 'yellow'), S('roof', 0, 1, 'red')], gag: 'flag' },
  tower: { name: 'a tower', slots: [S('cube', 0, 0, 'blue'), S('cube', 0, 1, 'yellow'), S('cone', 0, 2, 'red')], gag: 'flag' },
  bridge: { name: 'a bridge', slots: [S('cube', -1, 0, 'orange'), S('cube', 1, 0, 'orange'), S('cuboid', 0, 1, 'teal')], gag: 'bounce' },
  rocket: { name: 'a rocket', slots: [S('cyl', 0, 0, 'white'), S('cyl', 0, 1, 'red'), S('cone', 0, 2, 'white')], gag: 'rocket' },
  door: { name: 'a little house', slots: [S('arch', 0, 0, 'pink'), S('roof', 0, 1, 'purple')], gag: 'flag' },
  // Level 2: 4–5 blocks, mostly with a roof
  bighouse: { name: 'a big house', slots: [S('cube', -0.5, 0, 'yellow'), S('cube', 0.5, 0, 'orange'), S('cuboid', 0, 1, 'sky'), S('roof', 0, 2, 'red')], gag: 'flag' },
  castle: { name: 'a castle', slots: [S('cube', -1.5, 0, 'purple'), S('arch', 0, 0, 'pink'), S('cube', 1.5, 0, 'purple'), S('cone', -1.5, 1, 'yellow'), S('cone', 1.5, 1, 'yellow')], gag: 'flag' },
  rocket2: { name: 'a big rocket', slots: [S('cyl', 0, 0, 'blue'), S('cyl', 0, 1, 'white'), S('cyl', 0, 2, 'blue'), S('cone', 0, 3, 'red')], gag: 'rocket' },
  temple: { name: 'a gate', slots: [S('cyl', -0.5, 0, 'teal'), S('cyl', 0.5, 0, 'teal'), S('cuboid', 0, 1, 'yellow'), S('roof', 0, 2, 'orange')], gag: 'bounce' },
  hometree: { name: 'a house and a tree', slots: [S('arch', -0.9, 0, 'sky'), S('cuboid', -0.9, 1, 'yellow'), S('roof', -0.9, 2, 'red'), S('cyl', 1.6, 0, 'brown'), S('cone', 1.6, 1, 'green')], gag: 'bounce' },
  tower2: { name: 'a tall tower', slots: [S('cube', 0, 0, 'red'), S('cyl', 0, 1, 'yellow'), S('cube', 0, 2, 'blue'), S('cone', 0, 3, 'green')], gag: 'flag' },
  // Level 3
  towers: { name: 'a bridge with towers', slots: [S('cyl', -1.5, 0, 'blue'), S('arch', 0, 0, 'orange'), S('cyl', 1.5, 0, 'blue'), S('cone', -1.5, 1, 'red'), S('cone', 1.5, 1, 'red')], gag: 'flag' },
  tallhouse: { name: 'a tall house', slots: [S('cube', -0.5, 0, 'teal'), S('cube', 0.5, 0, 'teal'), S('cuboid', 0, 1, 'yellow'), S('cuboid', 0, 2, 'pink'), S('roof', 0, 3, 'purple')], gag: 'flag' },
  fort: { name: 'a castle', slots: [S('cuboid', 0, 0, 'purple'), S('cyl', -0.5, 1, 'sky'), S('cyl', 0.5, 1, 'sky'), S('cone', -0.5, 2, 'pink'), S('cone', 0.5, 2, 'pink')], gag: 'flag' },
};
// Rounds per level: build a model, or (Level 3) a twist - which one rolls (on the ramp), which one stacks (on a tower).
export const PLANS = [
  { felt: 0x6fa8ff, tray: TRAY.short, rounds: [{ build: 'tree' }, { build: 'house' }, { build: 'tower' }, { build: 'bridge' }, { build: 'rocket' }, { build: 'door' }] },
  { felt: 0x7fd6b0, extra: 1, rounds: [{ build: 'bighouse' }, { build: 'castle' }, { build: 'rocket2' }, { build: 'temple' }, { build: 'hometree' }, { build: 'tower2' }] },
  {
    felt: 0x9a8cff, extra: 1, rounds: [
      { build: 'towers' },
      { roll: [['cube', COL.red], ['ball', COL.yellow], ['cone', COL.blue]], answer: 'ball' },
      { build: 'tallhouse' },
      { stack: [['ball', COL.orange], ['cube', COL.green]], answer: 'cube', tower: [COL.blue, COL.yellow] },
      { build: 'fort' },
      { roll: [['cone', COL.purple], ['cube', COL.orange], ['cyl', COL.teal]], answer: 'cyl' },
    ],
  },
];

// Which slots hold each slot up (the ones right under it that it overlaps).
export function supportsOf(slots) {
  return slots.map((b) => {
    if (b.y < 0.01) return [];
    const bw = SHAPES[b.shape].w;
    return slots.filter((a) => a !== b && Math.abs(a.y + SHAPES[a.shape].h - b.y) < 0.01 &&
      Math.min(a.x + SHAPES[a.shape].w / 2, b.x + bw / 2) - Math.max(a.x - SHAPES[a.shape].w / 2, b.x - bw / 2) > 0.1);
  });
}

// A little flag on a stick that pops up on top of a finished build (Blender prop_blk_flag: its white cloth takes the
// flag's colour, the stick and knob stay as painted).
export function makeFlag(col = COL.red) {
  if (hasCreature('prop_blk_flag')) {
    const src = bakedGeo('prop_blk_flag');
    const g = new T.Group();
    const c = src.clone();
    c.userData = {};
    const a = c.attributes.color;
    if (a) { _c.setHex(col); for (let i = 0; i < a.count; i++) if (a.getX(i) > 0.93 && a.getY(i) > 0.93 && a.getZ(i) > 0.93) a.setXYZ(i, _c.r, _c.g, _c.b); }
    const m = mesh(c, 0xffffff, { outline: 0.016, mat: toon(0xffffff, { vertexColors: true }) });
    g.add(m);
    return g;
  }
  const g = new T.Group();
  const stick = mesh(geo.cyl(0.035, 0.035, 0.9, 8), 0xc98a52, { outline: 0.012 }); stick.position.y = 0.45; g.add(stick);
  const knob = mesh(geo.sphere(0.07, 10, 8), 0xffd23a, { outline: 0.012 }); knob.position.y = 0.92; g.add(knob);
  const sh = new T.Shape([new T.Vector2(0, 0), new T.Vector2(0.5, 0.14), new T.Vector2(0, 0.3)]);
  const fl = mesh(new T.ShapeGeometry(sh), col, { outline: 0 });
  fl.material = new T.MeshBasicMaterial({ color: col, side: T.DoubleSide });
  fl.position.set(0.03, 0.56, 0);
  const ink = new T.Mesh(new T.ShapeGeometry(sh), new T.MeshBasicMaterial({ color: INK, side: T.DoubleSide }));
  ink.scale.setScalar(1.12); ink.position.set(0.0, 0.54, -0.005);
  g.add(ink, fl);
  g.userData.flag = fl;
  return g;
}
