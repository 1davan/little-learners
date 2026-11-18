// Snack chef: the foods (Blender props), the food groups and the three level plans.
import * as T from '../three.js';
import { prop } from './view-tools.js';

// model, tint (undefined = painted colours), longest side in game units, resting rotation, caption name (+ plural)
export const FOOD = {
  strawberry: { model: 'prop_m_strawberry', tint: 0xff3b4e, group: 'fruit', size: 0.62, rz: 1.25, name: 'strawberry', many: 'strawberries' },
  banana: { model: 'prop_m_banana', tint: 0xffd23f, group: 'fruit', size: 0.85, rx: Math.PI / 2, name: 'banana', many: 'bananas' },
  apple: { model: 'prop_m_apple', tint: 0xff4b4b, group: 'fruit', size: 0.62, name: 'apple', many: 'apples' },
  orange: { model: 'prop_m_orange', tint: 0xff9a2e, group: 'fruit', size: 0.62, name: 'orange', many: 'oranges' },
  pear: { model: 'prop_m_pear', tint: 0x9ed64a, group: 'fruit', size: 0.68, name: 'pear', many: 'pears' },
  carrot: { model: 'prop_carrot', group: 'veg', size: 0.9, rz: -Math.PI / 2, across: true, name: 'carrot', many: 'carrots' },
  cucumber: { model: 'prop_k_cucumber', group: 'veg', size: 0.88, across: true, name: 'cucumber', many: 'cucumbers' },
  broccoli: { model: 'prop_k_broccoli', group: 'veg', size: 0.72, name: 'broccoli', many: 'broccoli' },
  peas: { model: 'prop_k_peapod', group: 'veg', size: 0.85, across: true, name: 'peas', many: 'peas' },
  corn: { model: 'prop_corn', group: 'veg', size: 0.88, rz: Math.PI / 2, across: true, name: 'corn', many: 'corn' },
  bread: { model: 'prop_bread', group: 'grain', size: 0.7, name: 'bread', many: 'bread' },
  cracker: { model: 'prop_k_cracker', group: 'grain', size: 0.62, rx: Math.PI / 2 - 0.1, ry: 0.3, name: 'cracker', many: 'crackers' },
  cheese: { model: 'prop_k_cheese', group: 'dairy', size: 0.72, ry: 0.4, name: 'cheese', many: 'cheese' },
  milk: { model: 'prop_k_milk', group: 'dairy', size: 0.7, name: 'milk', many: 'milk' },
  yogurt: { model: 'prop_k_yogurt', group: 'dairy', size: 0.62, name: 'yogurt', many: 'yogurt' },
};

// the four groups: plate4 section (x, z in plate units), the caption word and a colour for the floating numbers
export const GROUPS = {
  fruit: { name: 'fruit', col: '#ff4f86', sec4: [-0.47, -0.45], sec2: [-0.48, 0] },
  veg: { name: 'veg', col: '#3fae48', sec4: [0.47, -0.45], sec2: [0.48, 0] },
  grain: { name: 'bread', col: '#e09a12', sec4: [-0.47, 0.45] },
  dairy: { name: 'dairy', col: '#3f8cff', sec4: [0.47, 0.45] },
};
export const NUM_COL = ['#ff4f4f', '#ff9a2e', '#ffc531', '#4cc75a', '#3f8cff', '#9b6dff'];

// One level = three snacks. Each snack: a hungry friend washes hands at the sink, then gets a plate.
//   wash: the hand-washing steps the child does (Level 1: the tap, then the friend soaps itself; she rubs; the rinse
//         plays by itself (autoRinse))
//   L1 foods: three of one fruit to count onto a plain plate
//   L2/L3 foods: the choices laid out on the boards; want: one food from each of these groups
export const PLANS = [
  {
    plate: 'plain', wash: ['tap', 'rub'], autoRinse: true, look: 'morning',
    snacks: [
      { friend: 'bear', foods: ['strawberry', 'strawberry', 'strawberry'] },
      { friend: 'bunny', foods: ['banana', 'banana', 'banana'] },
      { friend: 'pig', foods: ['apple', 'apple', 'apple'] },
    ],
  },
  {
    plate: 'plate2', wash: ['soap', 'rub', 'rinse'], want: ['fruit', 'veg'], look: 'noon',
    snacks: [
      { friend: 'cat', foods: ['strawberry', 'carrot', 'banana', 'cucumber'] },
      { friend: 'frog', foods: ['broccoli', 'orange', 'peas', 'apple'] },
      { friend: 'monkey', foods: ['banana', 'corn', 'pear', 'carrot'] },
    ],
  },
  {
    plate: 'plate4', wash: ['soap', 'rub', 'rinse', 'dry'], want: ['fruit', 'veg', 'grain', 'dairy'], washFruit: true, fridge: true, look: 'evening',
    snacks: [
      { friend: 'bear', foods: ['strawberry', 'carrot', 'bread', 'apple'], fridge: ['cheese', 'milk'] },
      { friend: 'cat', foods: ['cracker', 'banana', 'broccoli', 'pear'], fridge: ['yogurt', 'cheese'] },
      { friend: 'pig', foods: ['orange', 'bread', 'cucumber', 'strawberry'], fridge: ['milk', 'yogurt'] },
    ],
  },
];

// world-space box of the drawn triangles under obj (skinned props are in their rest pose)
export function boxOf(obj) {
  const b = new T.Box3(), v = new T.Vector3();
  obj.updateMatrixWorld(true);
  obj.traverse((m) => {
    if (!m.isMesh || m.userData.outline || !m.visible) return;
    const pos = m.geometry.attributes.position, idx = m.geometry.index;
    const n = idx ? idx.count : pos.count;
    for (let i = 0; i < n; i++) b.expandByPoint(v.fromBufferAttribute(pos, idx ? idx.array[i] : i).applyMatrix4(m.matrixWorld));
  });
  return b;
}

// A food: a Group whose origin is the centre of its bounding box (so a physics ball sits right), longest side
// FOOD.size. userData: { food (its kind), group, h (height: it rests on a surface at y + h / 2), r (footprint radius) }
const fit = new Map();
export function makeFood(kind) {
  const F = FOOD[kind];
  const pm = prop(F.model, { tint: F.tint, face: false });
  if (!pm) return null;
  pm.rotation.set(F.rx || 0, F.ry || 0, F.rz || 0);
  const inner = new T.Group();
  inner.add(pm);
  if (!fit.has(kind)) {
    const b = boxOf(inner), s = b.getSize(new T.Vector3());
    const k = F.size / Math.max(s.x, s.y, s.z);
    const c = b.getCenter(new T.Vector3());
    fit.set(kind, { k, off: new T.Vector3(-c.x * k, -c.y * k, -c.z * k), h: s.y * k, r: Math.max(s.x, s.z) * k / 2 });
  }
  const f = fit.get(kind);
  inner.scale.setScalar(f.k);
  inner.position.copy(f.off);
  const g = new T.Group();
  g.add(inner);
  Object.assign(g.userData, { food: kind, group: F.group, h: f.h, r: f.r });
  return g;
}

export const groupOf = (kind) => FOOD[kind].group;
