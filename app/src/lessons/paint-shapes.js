// Paint & mix: the 2D toy shapes (app/assets/paint-shapes.json, written by tools/blender/creatures/prop_paint.py
// from the same polygons it extrudes into the prop_pt_<key> models), the paint colours and the mixing table.
//
// Shape data, per toy, in a unit square (0..1, y up) over the toy's bbox: x_world = (u - 0.5) * S, y = (v - 0.5) * S
//   outline   closed polygon (the cut-out's silhouette)
//   parts     { name: polygon }; `rest` names the part that is "inside the outline and in no other part"
//   lines     burnt detail polylines;  eyes / dots: [u, v, r] ink dots;  smile: ink polylines;  rings: stamp targets
//   hang      where the twine loop sits (its ring centre is 0.068 above this point, world units)
//   size      [w, h] in world units;  S = 1.04 * max(w, h);  mirror: 1 for the butterfly
let SHAPES = null;
export async function loadShapes() {
  if (SHAPES) return SHAPES;
  try { SHAPES = await (await fetch('assets/paint-shapes.json')).json(); } catch (e) { console.error('paint shapes', e); SHAPES = {}; }
  return SHAPES;
}
export function shapeOf(key) { return SHAPES ? SHAPES[key] : null; }

// The paints. Ready-made pots in Levels 1 and 2 use exactly the colours Level 3 mixes (section 8.4).
export const COLOURS = {
  // thick poster paint (audit P7): the pots, the dish and the Level 3 mixes all read this one table
  red: '#e8302a', yellow: '#ffbf00', blue: '#1f66e5', green: '#1fae4b',
  pink: '#ff6fae', orange: '#ff8000', white: '#ffffff', purple: '#8a3fdc',
};
export const COLOUR_KEYS = Object.keys(COLOURS);
export const NAME = { red: 'Red!', yellow: 'Yellow!', blue: 'Blue!', green: 'Green!', pink: 'Pink!', orange: 'Orange!', white: 'White!', purple: 'Purple!' };
// The mixing table: a lookup, never colour arithmetic.
const MIX = { 'red+yellow': 'orange', 'blue+yellow': 'green', 'blue+red': 'purple', 'red+white': 'pink' };
export function mixOf(a, b) { return MIX[[a, b].sort().join('+')] || null; }
export const RECIPE = { orange: ['red', 'yellow'], green: ['blue', 'yellow'], purple: ['red', 'blue'], pink: ['red', 'white'] };
export const RECIPE_LINE = {
  orange: 'Red and yellow make orange!', green: 'Blue and yellow make green!',
  purple: 'Red and blue make purple!', pink: 'Red and white make pink!',
};
export const hex = (k) => parseInt(COLOURS[k].slice(1), 16);

// point in polygon (even-odd), polygon [[x, y], ...]
export function inPoly(x, y, P) {
  let s = false;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
    const a = P[i], b = P[j];
    if ((a[1] > y) !== (b[1] > y) && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) s = !s;
  }
  return s;
}
// which part a unit-square point is in (null outside the outline). Non-rest parts are tested first.
export function partAt(sh, u, v) {
  if (!inPoly(u, v, sh.outline)) return null;
  for (const [name, P] of Object.entries(sh.parts)) if (name !== sh.rest && Object.keys(sh.parts).length > 1 && inPoly(u, v, P)) return name;
  return sh.rest || Object.keys(sh.parts)[0];
}
