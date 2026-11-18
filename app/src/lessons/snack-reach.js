// Snack chef: posing a friend's arms so its paws reach a spot (into the sink basin under the running water, up for
// the towel, round the plate it carries), with the head kept clear of the tap, the soap and the basin.
// Every friend has its own arms (one rigid bone each, a paw at its end) and a big head, so the pose is searched on
// the real skinned shape: where to stand (a little left / right, a step closer), how far to lean, and how to swing
// each arm (rotation x = forward / back, rotation z = in / out, the same offsets snack.js applies every frame).
// A pose that puts any head vertex in a keep-out box, an arm through the tap or the worktop, or the tummy through the
// counter is rejected. Results are cached per kind and goal, so each kind is searched once per game.
import * as T from '../three.js';

const cache = new Map();
const _v = new T.Vector3();
const under = (b, h) => { for (let q = b; q; q = q.parent) if (q === h) return true; return false; };

// the friend's skinned vertices, sampled and sorted by the bone that moves them: head (and ears), each arm, the rest
export function samples(f) {
  const u = f.userData;
  if (u._samp) return u._samp;
  const S = { head: [], arms: [[], []], body: [] };
  const meshes = [];
  f.traverse((m) => {
    if (!m.isSkinnedMesh || !m.visible || m.userData.outline || m.material?.side === T.BackSide) return;
    if (m.geometry.attributes.skinIndex && m.geometry.attributes.skinWeight) meshes.push(m);
  });
  // about 1600 samples in all (enough to catch a head in the tap, cheap enough to test a few dozen poses)
  const total = meshes.reduce((n, m) => n + m.geometry.attributes.position.count, 0);
  const step = Math.max(1, Math.round(total / 1600));
  for (const m of meshes) {
    const si = m.geometry.attributes.skinIndex, sw = m.geometry.attributes.skinWeight, pos = m.geometry.attributes.position;
    for (let k = 0; k < pos.count; k += step) {
      let bi = 0, bw = -1;
      for (let j = 0; j < 4; j++) { const w = sw.getComponent(k, j); if (w > bw) { bw = w; bi = si.getComponent(k, j); } }
      const b = m.skeleton.bones[bi];
      if (u.head && u.head.isBone && under(b, u.head)) S.head.push([m, k]);
      else if (u.arms && under(b, u.arms[0])) S.arms[0].push([m, k]);
      else if (u.arms && under(b, u.arms[1])) S.arms[1].push([m, k]);
      else S.body.push([m, k]);
    }
  }
  u._samp = S;
  return S;
}
export const vert = ([m, k], v = _v) => m.getVertexPosition(k, v).applyMatrix4(m.matrixWorld);

// The space an object really fills (its drawn triangles, skinned or not), as a set of small cubes, grown by `grow`
// cubes all round. has(v) says whether a point is in it. Thin things (a gooseneck tap) keep their real shape.
export function occupancy(obj, cell = 0.05, grow = 1) {
  const set = new Set(), v = new T.Vector3(), a = new T.Vector3(), b = new T.Vector3(), c = new T.Vector3();
  const key = (x, y, z) => `${x},${y},${z}`;
  const mark = (p) => {
    const x = Math.floor(p.x / cell), y = Math.floor(p.y / cell), z = Math.floor(p.z / cell);
    for (let i = -grow; i <= grow; i++) for (let j = -grow; j <= grow; j++) for (let k = -grow; k <= grow; k++) set.add(key(x + i, y + j, z + k));
  };
  obj.updateMatrixWorld(true);
  obj.traverse((m) => {
    if (!m.isMesh || !m.visible || m.userData.outline || m.material?.side === T.BackSide) return;
    const g = m.geometry, pos = g.attributes.position, idx = g.index;
    const n = idx ? idx.count : pos.count;
    const P = (i, out) => { const j = idx ? idx.array[i] : i; return (m.isSkinnedMesh ? m.getVertexPosition(j, out) : out.fromBufferAttribute(pos, j)).applyMatrix4(m.matrixWorld); };
    for (let i = 0; i + 2 < n; i += 3) {
      P(i, a); P(i + 1, b); P(i + 2, c);
      // a few points over each triangle, so big triangles fill their cubes
      const L = Math.max(a.distanceTo(b), b.distanceTo(c), c.distanceTo(a)), steps = Math.min(12, Math.ceil(L / cell));
      for (let s = 0; s <= steps; s++) for (let t = 0; t <= steps - s; t++) {
        const w = steps ? s / steps : 0, q = steps ? t / steps : 0;
        v.copy(a).multiplyScalar(1 - w - q).addScaledVector(b, w).addScaledVector(c, q);
        mark(v);
      }
    }
  });
  return { has: (p) => set.has(key(Math.floor(p.x / cell), Math.floor(p.y / cell), Math.floor(p.z / cell))) };
}

// set the arm offsets the way snack.js does every frame (P.armLx / P.armL for the left arm, ...Rx / ...R for the right)
export function setArm(f, i, ax, az) {
  const u = f.userData, r = u.rest[i];
  u.arms[i].rotation.set(r.x + ax, r.y, r.z + (i ? -az : az));
  u.arms[i].updateMatrixWorld(true);
}
export function handW(f, i) { const u = f.userData; return u.arms[i].localToWorld(u.handLocal[i].clone()); }

// point one arm's paw as close to `goal` as the rigid arm allows (a coarse grid, then finer steps)
function aim(f, i, goal, start) {
  const err = (ax, az) => { setArm(f, i, ax, az); return handW(f, i).distanceTo(goal); };
  let best = null;
  if (start) best = { ax: start.ax, az: start.az, d: err(start.ax, start.az) };
  const R = start ? [start.ax - 0.5, start.ax + 0.5, start.az - 0.5, start.az + 0.5, 0.125] : [-2.8, 0.6, -1.6, 1.4, 0.2];
  for (let ax = R[0]; ax <= R[1] + 1e-6; ax += R[4]) for (let az = R[2]; az <= R[3] + 1e-6; az += R[4]) {
    const d = err(ax, az);
    if (!best || d < best.d) best = { ax, az, d };
  }
  for (const st of [0.08, 0.04, 0.02, 0.01]) {
    for (let n = 0, moved = true; moved && n < 24; n++) {
      moved = false;
      for (const [dx, dz] of [[st, 0], [-st, 0], [0, st], [0, -st]]) {
        const d = err(best.ax + dx, best.az + dz);
        if (d < best.d - 1e-5) { best = { ax: best.ax + dx, az: best.az + dz, d }; moved = true; }
      }
    }
  }
  setArm(f, i, best.ax, best.az);
  return best;
}

// Search a pose. opts:
//   key         cache key (kind is added)
//   at          (x, z) the friend's base spot; dxs / dzs: offsets to try; leans: body leans to try
//   goals(f)    -> [left paw goal, right paw goal] (world), evaluated with the friend placed
//   headBad(v)  -> true when a head vertex is somewhere it must never be; armBad(v), bodyBad(v) the same for arms / tummy
// Returns { dx, dz, lean, lx, l, rx, r, err, bad } (lx/l = left arm x/z offsets, rx/r = right) and leaves the friend
// where it was, in its rest pose.
export async function solve(f, opts) {
  const u = f.userData;
  const key = `${u.kind}|${opts.key}`;
  if (cache.has(key)) return cache.get(key);
  // one search at a time (two friends' searches would move each other's bones mid-way)
  while (busy) await busy;
  if (cache.has(key)) return cache.get(key);
  let done;
  busy = new Promise((r) => { done = r; });
  try { return await search(f, opts, key); } finally { busy = null; done(); }
}
let busy = null;
const frame = () => new Promise((r) => setTimeout(r, 0));
async function search(f, opts, key) {
  const u = f.userData;
  const S = samples(f);
  const body = u.body && u.body !== f && u.body.isBone ? u.body : null;
  const head = u.head && u.head.isBone && u.head !== u.body ? u.head : null;
  const hx0 = head ? head.rotation.x : 0;
  f.rotation.y = 0;
  let best = null, prev = [null, null], t0 = performance.now();
  const count = (list, bad) => { let n = 0; for (const s of list) if (bad(vert(s))) n++; return n; };
  // a short-armed friend may reach a little further at the sink (its arms a little longer, never a stretched tube)
  const k = opts.stretch || 1;
  u.arms.forEach((a) => a.scale.set(1, k, 1));
  const grab = () => ({ p: f.position.clone(), ry: f.rotation.y, arms: u.arms.map((a) => a.rotation.clone()), lean: body ? body.rotation.x : 0 });
  let save = grab();
  for (const dz of opts.dzs || [0]) for (const dx of opts.dxs || [0]) for (const lean of body ? (opts.leans || [0]) : [0]) {
    // give the frame back every ~12 ms (the friend is put back as it was while the picture is drawn)
    if (performance.now() - t0 > 12) {
      f.position.copy(save.p); f.rotation.y = save.ry; u.arms.forEach((a, i) => a.rotation.copy(save.arms[i])); if (body) body.rotation.x = save.lean;
      if (head) head.rotation.x = hx0;
      u.arms.forEach((a) => a.scale.set(1, 1, 1));
      await frame();
      u.arms.forEach((a) => a.scale.set(1, k, 1));
      save = grab();          // (it may have walked on meanwhile)
      t0 = performance.now();
      f.rotation.y = 0;
    }
    f.position.set(opts.at.x + dx, 0, opts.at.z + dz);
    if (body) body.rotation.x = lean;
    // leaning in, the head tips back a little (the face stays up, the chin comes up off the tap)
    if (head) head.rotation.x = -lean * (opts.headTilt ?? 0);
    u.arms.forEach((a, i) => a.rotation.copy(u.rest[i]));
    f.updateMatrixWorld(true);
    const G = opts.goals(f);
    const sol = [0, 1].map((i) => aim(f, i, G[i], prev[i]));
    prev = sol;
    f.updateMatrixWorld(true);
    const why = { head: opts.headBad ? count(S.head, opts.headBad) : 0, arm: opts.armBad ? count(S.arms[0], opts.armBad) + count(S.arms[1], opts.armBad) : 0, body: opts.bodyBad ? count(S.body, opts.bodyBad) : 0 };
    const W = opts.weights || { head: 0.03, arm: 0.012, body: 0.02 };
    const bad = why.head * W.head + why.arm * W.arm + why.body * W.body;
    const err = sol[0].d + sol[1].d;
    if (opts.trace) opts.trace.push({ dx, dz: +dz.toFixed(2), lean, err: +err.toFixed(2), ...why });
    const score = err + lean * (opts.leanCost ?? 0.35) + Math.abs(dx) * 0.08 + bad + (why.head > (opts.maxHead ?? 12) ? 9 : 0);
    // the best trade of reach against anything in the way (a head near the tap counts most)
    if (!best || score < best.score) {
      best = { dx, dz, lean, head: -lean * (opts.headTilt ?? 0), lx: sol[0].ax, l: sol[0].az, rx: sol[1].ax, r: sol[1].az, err, bad, why, score };
    }
  }
  f.position.copy(save.p); f.rotation.y = save.ry; u.arms.forEach((a, i) => a.rotation.copy(save.arms[i])); if (body) body.rotation.x = save.lean;
  if (head) head.rotation.x = hx0;
  u.arms.forEach((a) => a.scale.set(1, 1, 1));
  f.updateMatrixWorld(true);
  best.stretch = k;
  cache.set(key, best);
  return best;
}
