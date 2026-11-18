// Cook a soup: the vegetables (Blender props), how each one lies on the board, what its insides look like when cut
// (the cap rings for cook-slice.js), the colour it gives the soup, and the three level plans.
import * as T from '../three.js';
import { prop } from './view-tools.js';
import { boxOf } from './snack-foods.js';

// tomato: a small pink core, red flesh, four soft juicy chambers just a shade lighter (gentle, not a bold pattern)
const tomatoMid = (a) => (Math.cos(4 * a) > 0.2 ? 0xff9a78 : 0xff5a48);
// corn: a creamy cob, a thin tan ring, then one golden ring of kernels with only faint seams between them (no bold
// wedges or stripes, so it reads as a corn coin, not a citrus or pineapple slice)
const cornKern = (a) => (Math.cos(16 * a) > 0.94 ? 0xf2b72c : 0xffcc33);

// model, layers to hide, longest side on the board, resting turn (rx, ry, rz) so it lies the way it is cut,
// colour word (Level 2 asks by colour), the soup tint it brings, and the cap rings (f0, f1, colour | 'rim' | fn)
export const VEG = {
  carrot: {
    model: 'prop_carrot', hide: ['leaves'], size: 1.02, rz: -Math.PI / 2, word: 'orange', name: 'carrot', many: 'carrots', soup: 0xffa646,
    bands: [[0, 0.36, 0xffcf6a], [0.36, 0.84, 0xff9a36], [0.84, 1, 'rim']], bit: 0xff9a36,
  },
  tomato: {
    model: 'prop_ck_tomato', size: 0.68, word: 'red', name: 'tomato', many: 'tomatoes', soup: 0xff5a3c,
    bands: [[0, 0.16, 0xffb4a0], [0.16, 0.3, 0xff6a54], [0.3, 0.7, tomatoMid], [0.7, 0.92, 0xff5a46], [0.92, 1, 'rim']], bit: 0xff5040,
  },
  potato: {
    model: 'prop_ck_potato', size: 0.92, word: 'brown', name: 'potato', many: 'potatoes', soup: 0xf0d088,
    bands: [[0, 0.9, 0xfff0bc], [0.9, 1, 'rim']], bit: 0xfff0bc,
  },
  onion: {
    model: 'prop_ck_onion', hide: ['roots'], size: 0.68, rz: Math.PI / 2, word: 'purple', name: 'onion', many: 'onions', soup: 0xe2b0d0,
    bands: [[0, 0.18, 0xfff6ff], [0.18, 0.32, 0xe0b0f0], [0.32, 0.48, 0xfff6ff], [0.48, 0.62, 0xe0b0f0], [0.62, 0.78, 0xfff6ff], [0.78, 0.9, 0xd598ea], [0.9, 1, 'rim']], bit: 0xf4e4ff,
  },
  pepper: {
    model: 'prop_ck_pepper', size: 0.72, rz: Math.PI / 2, word: 'red', name: 'pepper', many: 'peppers', soup: 0xff6a3a,
    bands: [[0, 0.3, 0xfff0c0], [0.3, 0.76, 0xfff8f0], [0.76, 0.9, 0xff6a50], [0.9, 1, 'rim']], bit: 0xff4a3a,
  },
  broccoli: {
    model: 'prop_k_broccoli', size: 0.86, rz: Math.PI / 2, word: 'green', name: 'broccoli', many: 'broccoli', soup: 0x8cd060,
    bands: [[0, 0.82, 0xcdeea0], [0.82, 1, 'rim']], bit: 0x4cae47,
  },
  corn: {
    model: 'prop_corn', hide: ['husk', 'stalk'], size: 0.95, rz: -Math.PI / 2, word: 'yellow', name: 'corn', many: 'corn', soup: 0xffd24a,
    bands: [[0, 0.44, 0xffe6a0], [0.44, 0.52, 0xe0b868], [0.52, 0.9, cornKern], [0.9, 1, 'rim']], bit: 0xffd84a,
  },
};

// A vegetable: a Group whose origin is the middle of its box, lying the way it is cut, longest side VEG.size.
// (Everything lies low - the broccoli on its side - so Bear's knife never has to come up near his face.)
// userData: { veg (kind), h (height: it rests on a surface at y + h / 2), r (footprint radius), len (x), dep (z) }
const fit = new Map();
export function makeVeg(kind) {
  const V = VEG[kind];
  const pm = prop(V.model, { face: false, hide: V.hide || [] });
  if (!pm) return null;
  pm.rotation.set(V.rx || 0, V.ry || 0, V.rz || 0);
  const inner = new T.Group();
  inner.add(pm);
  if (!fit.has(kind)) {
    const b = boxOf(inner), s = b.getSize(new T.Vector3());
    const k = V.size / Math.max(s.x, s.y, s.z);
    const c = b.getCenter(new T.Vector3());
    fit.set(kind, { k, off: new T.Vector3(-c.x * k, -c.y * k, -c.z * k), h: s.y * k, len: s.x * k, dep: s.z * k });
  }
  const f = fit.get(kind);
  inner.scale.setScalar(f.k);
  inner.position.copy(f.off);
  const g = new T.Group();
  g.add(inner);
  Object.assign(g.userData, { veg: kind, h: f.h, len: f.len, dep: f.dep, r: Math.max(f.len, f.dep) / 2 });
  return g;
}

// The levels. bowl: what lies in the veg bowl. rounds: one per thing to do -
//   { veg: kind, n: how many go on the board }  pick, take the knife, chop, scoop, tip into the pot
//   { stir: true }  stir the soup three times round (Level 3)        { serve: true }  fill a bowl for the friend (Level 3)
// ask: 'any' (pick either), 'colour' (Now the orange one!), 'card' (follow the recipe card)
export const PLANS = [
  { look: 'morning', ask: 'any', reach: 9, bowl: ['carrot', 'tomato'], rounds: [{ veg: 'carrot' }, { veg: 'tomato' }] },
  { look: 'noon', ask: 'colour', reach: 1.1, bowl: ['carrot', 'broccoli', 'corn', 'tomato', 'potato'], rounds: [{ veg: 'carrot' }, { veg: 'broccoli' }, { veg: 'corn' }] },
  {
    look: 'evening', ask: 'card', reach: 0.8, card: true, bowl: ['tomato', 'carrot', 'onion', 'tomato', 'pepper', 'tomato'],
    rounds: [{ veg: 'carrot' }, { veg: 'tomato', n: 2 }, { stir: true }, { serve: true }],
  },
];
