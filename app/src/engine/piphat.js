// Pip's hats: what Pip wears in each world and level look, fitted to the Blender Pip's head and riding the head bone
// (so they turn and nod with it). Used by the home pages and every lesson, so Pip dresses the same in both.
// Pip's head (head-bone space): an egg 0.80 wide (x), 0.70 deep (z), top at y 0.75; at y 0.3 it is 0.74 x 0.64.
// Each hat's opening is wider than the head where it sits, so nothing pokes through; the sprout tuft folds away
// under hats that cover the crown.
//
// Also home of staticProp(): a Blender prop as plain static meshes (no skeleton, no idle sway, no per-frame cost).
import * as T from '../three.js';
import { mesh, toon, basic } from './toon.js';
import { makeCreature, hasCreature, garmentProp } from './creature.js';

const _info = new Map();
function modelInfo(kind) {
  if (!_info.has(kind)) {
    const c = makeCreature(kind);
    _info.set(kind, { layers: Object.keys(c.userData.layers || {}).filter((n) => !/^cloth/.test(n)), outline: c.children[0]?.userData.outline ?? 0.025 });
  }
  return _info.get(kind);
}
// tint: colour for the base layer (painted white / greys in Blender); layerTint: { layerName: colour } for others;
// unlit: layer names drawn flat (glowing lanterns).
export function staticProp(kind, { tint = null, layerTint = {}, unlit = [] } = {}) {
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

// Which hat Pip wears: [level 1, level 2, level 3] per world (matching the world's look: sunny beach, sunset, night...).
const PIP_HAT = { meadow: [null, 'leaves', 'beanie'], beach: ['sun', 'flower', 'nightcap'], farm: ['straw', 'straw', 'rainhat'] };
// Fit on the head bone: pos, rot (x tips the front up when negative, z rolls), scale (number or [x, y, z]),
// tuck: fold the sprout tuft away, tint: colour for tintable hats.
const FIT = {
  sun: { model: 'prop_pip_sunhat', pos: [0, 0.3, -0.02], rot: [-0.2, 0, 0.07], scale: 1, tuck: true },
  straw: { model: 'prop_pip_strawhat', pos: [0, 0.31, -0.02], rot: [-0.16, 0, -0.06], scale: 1, tuck: true },
  beanie: { model: 'prop_icon_hat_beanie', pos: [0, 0.3, -0.03], rot: [-0.12, 0, 0.05], scale: [1.86, 1.4, 1.7], tuck: true, tint: 0x7b9bff },
  nightcap: { model: 'prop_icon_hat_nightcap', pos: [0, 0.3, -0.03], rot: [-0.12, 0, 0.05], scale: [1.86, 1.4, 1.7], tuck: true, tint: 0x7b9bff },
  rainhat: { model: 'prop_pip_rainhat', pos: [0, 0.35, -0.03], rot: [-0.26, 0, 0.06], scale: 1, tuck: true },
  leaves: { model: 'prop_icon_hat_leaves', pos: [0, 0.5, -0.05], rot: [-0.12, 0, 0.04], scale: 1.55, tuck: true },
  flower: { model: 'prop_icon_hat_flower', pos: [0.4, 0.55, 0.22], rot: [0.1, 0.35, -0.55], scale: 1.0, tuck: false },
};

export function pipHatKind(world, level) { return PIP_HAT[world]?.[level] ?? null; }

// Put the right hat on Pip for this world + level. Returns the hat (a child of the head bone) or null.
export function dressPip(pip, world, level, kind = pipHatKind(world, level)) {
  const f = kind && FIT[kind];
  const head = pip?.userData?.head;
  if (!f || !head?.isBone) return null;
  const h = staticProp(f.model, { tint: f.tint ?? null });
  if (!h) return null;
  const g = new T.Group();
  g.name = 'pipHat';
  g.add(h);
  g.position.set(...f.pos);
  g.rotation.set(...f.rot);
  if (Array.isArray(f.scale)) g.scale.set(...f.scale); else g.scale.setScalar(f.scale);
  head.add(g);
  if (f.tuck) pip.userData.bones?.tuft1?.scale.setScalar(0.01);
  pip.userData.hat = g;
  return g;
}
