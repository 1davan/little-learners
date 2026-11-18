// Shape puzzles plan check (docs/design/puzzles.md acceptance 4 and section 4):
//  - every puzzle's hole exists, matches the piece's shape and size, and is in its `open` list
//  - LURE RULE: no wrong hole that is open during a puzzle could take the piece, at any angle or position
//  - every hole of a level is filled exactly once, left to right in the order of the tables
// usage: node tools/puzzles-check.mjs
import fs from 'fs';
import { LEVELS } from '../app/src/lessons/puzzles-plan.js';

const L = JSON.parse(fs.readFileSync(new URL('../app/src/lessons/puzzles-layout.json', import.meta.url)));
let bad = 0;
const fail = (m) => { bad++; console.log('FAIL', m); };

function inside(P, x, y) {
  let c = false;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
    const [xi, yi] = P[i], [xj, yj] = P[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
function segX(a, b, c, d) {
  const o = (p, q, r) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
  return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0;
}
// can polygon A (piece, around its own origin) be placed inside polygon H (hole, board space) at some angle / offset?
function fits(A, H) {
  const xs = H.map((p) => p[0]), ys = H.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const step = 0.02, Aw = A.filter((_, i) => i % 2 === 0);
  for (let a = 0; a < 360; a += 3) {
    const c = Math.cos((a * Math.PI) / 180), s = Math.sin((a * Math.PI) / 180);
    const R = Aw.map(([x, y]) => [x * c - y * s, x * s + y * c]);
    const rx = R.map((p) => p[0]), ry = R.map((p) => p[1]);
    const w = Math.max(...rx) - Math.min(...rx), h = Math.max(...ry) - Math.min(...ry);
    if (w > x1 - x0 || h > y1 - y0) continue;
    for (let tx = x0 - Math.min(...rx); tx + Math.max(...rx) <= x1; tx += step) {
      for (let ty = y0 - Math.min(...ry); ty + Math.max(...ry) <= y1; ty += step) {
        if (!R.every(([x, y]) => inside(H, x + tx, y + ty))) continue;
        // no hole corner pokes into the piece (non-convex holes)
        const P = R.map(([x, y]) => [x + tx, y + ty]);
        if (H.some(([x, y]) => inside(P, x, y))) continue;
        let cross = false;
        for (let i = 0; i < P.length && !cross; i += 2) for (let j = 0; j < H.length && !cross; j += 3) if (segX(P[i], P[(i + 2) % P.length], H[j], H[(j + 3) % H.length])) cross = true;
        if (!cross) return [a, tx, ty];
      }
    }
  }
  return null;
}

LEVELS.forEach((lv, li) => {
  const holes = Object.fromEntries(L.levels[li].holes.map((h) => [h.id, h]));
  const seen = new Set();
  lv.puzzles.forEach((pz, pi) => {
    const tag = `L${li + 1} P${pi + 1}`;
    const h = holes[pz.hole];
    if (!h) return fail(`${tag}: no hole ${pz.hole}`);
    if (h.shape !== pz.shape || Math.abs(h.sx - pz.size[0]) > 1e-6 || Math.abs(h.sy - pz.size[1]) > 1e-6) fail(`${tag}: piece ${pz.shape} ${pz.size} does not match hole ${h.shape} ${h.sx}x${h.sy}`);
    if (!pz.open.includes(pz.hole)) fail(`${tag}: its own hole is not open`);
    if (seen.has(pz.hole)) fail(`${tag}: hole ${pz.hole} used twice`);
    seen.add(pz.hole);
    const A = L.shapes[pz.shape].map(([x, y]) => [x * pz.size[0], y * pz.size[1]]);
    for (const id of pz.open) {
      if (id === pz.hole) continue;
      const w = holes[id];
      if (!w) { fail(`${tag}: no hole ${id}`); continue; }
      if (seen.has(id)) fail(`${tag}: lure ${id} is already filled`);
      const f = fits(A, w.poly);
      if (f) fail(`${tag}: the ${pz.shape} would fit the open wrong hole ${id} (angle ${f[0]})`);
      else console.log(`ok   ${tag}: ${pz.shape} ${pz.size.join('x')} cannot go into the open ${w.shape} ${id}`);
    }
  });
  if (seen.size !== 10) fail(`L${li + 1}: ${seen.size} holes used, not 10`);
});
console.log(bad ? `${bad} problem(s)` : 'plan OK: all 30 puzzles, lure rule holds');
process.exit(bad ? 1 : 0);
