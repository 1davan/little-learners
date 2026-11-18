// Cook a soup: real slicing. A Blender vegetable is baked into one triangle soup (positions, normals, painted vertex
// colours), then every chop cuts a piece in two along a vertical plane: triangles are split exactly along the plane and
// each open side is closed with a cap - a fan from the middle of each cut outline, coloured in rings like the real
// cross-section (carrot coins with a pale core, onion rings, tomato seed chambers...). The outermost ring takes the
// colour of the surface that was cut, so a half coin shows skin at its ends and flesh along its old cut faces.
// Every piece is a plain mesh (centred on its own middle) with the toon material and an inked outline that uses
// smoothed normals, so the hard cut edges get a clean unbroken outline.
import * as T from '../three.js';
import { toon, INK } from '../engine/toon.js';

const pieceMat = toon(0xffffff, { vertexColors: true });
const inkMats = new Map();
function inkMat(th) {
  if (!inkMats.has(th)) {
    // pushed back in depth so the ink shell can never show through a flat cut face (no scratchy hatching)
    const m = new T.MeshBasicMaterial({ color: INK, side: T.BackSide, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 3 });
    m.onBeforeCompile = (s) => { s.vertexShader = s.vertexShader.replace('#include <begin_vertex>', `vec3 transformed = position + normal * ${th.toFixed(4)};`); };
    m.customProgramCacheKey = () => 'cook-ink' + th;
    m.userData.shared = true;
    inkMats.set(th, m);
  }
  return inkMats.get(th);
}

// Bake every visible, non-outline mesh under obj into triangles in the space of `space`. skip: layer-name prefixes.
export function bake(obj, space, { skip = [] } = {}) {
  obj.updateMatrixWorld(true);
  space.updateMatrixWorld(true);
  const inv = new T.Matrix4().copy(space.matrixWorld).invert();
  const P = [], N = [], C = [];
  const v = new T.Vector3(), n = new T.Vector3(), col = new T.Color(), white = new T.Color(1, 1, 1);
  obj.traverse((m) => {
    if (!m.isMesh || m.userData.outline) return;
    for (let o = m; o && o !== obj.parent; o = o.parent) if (!o.visible) return;
    const name = m.name.replace(/\.\d+$/, '');
    if (skip.some((s) => name.startsWith(s))) return;
    const g = m.geometry, pos = g.attributes.position, nor = g.attributes.normal, ca = g.attributes.color, idx = g.index;
    if (!pos || !nor) return;
    const M = new T.Matrix4().multiplyMatrices(inv, m.matrixWorld);
    const NM = new T.Matrix3().getNormalMatrix(M);
    const mc = m.material && m.material.color ? m.material.color : white;
    const cnt = idx ? idx.count : pos.count;
    for (let i = 0; i < cnt; i++) {
      const k = idx ? idx.getX(i) : i;
      v.fromBufferAttribute(pos, k);
      if (m.isSkinnedMesh && m.applyBoneTransform) m.applyBoneTransform(k, v);
      v.applyMatrix4(M);
      n.fromBufferAttribute(nor, k).applyMatrix3(NM).normalize();
      if (ca) col.setRGB(ca.getX(k), ca.getY(k), ca.getZ(k)); else col.setRGB(1, 1, 1);
      col.multiply(mc);
      P.push(v.x, v.y, v.z); N.push(n.x, n.y, n.z); C.push(col.r, col.g, col.b);
    }
  });
  return { pos: new Float32Array(P), nrm: new Float32Array(N), col: new Float32Array(C), cap: new Uint8Array(P.length / 9) };
}

// ---------------- pieces ----------------
// A piece: { mesh (its position / quaternion live in the parent's space), data (centred triangle arrays), rv (the
// vertices turned by the mesh's quaternion, for extents), lo / hi: the extents along AXES, y0 / y1: bottom / top }.
export const AXES = [[1, 0], [0, 1], [Math.SQRT1_2, Math.SQRT1_2], [Math.SQRT1_2, -Math.SQRT1_2]];

export function makePiece(data, { ink = 0.016, kind = '' } = {}) {
  // centre the triangles on their own box middle
  const p = data.pos;
  let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
  for (let i = 0; i < p.length; i += 3) {
    x0 = Math.min(x0, p[i]); x1 = Math.max(x1, p[i]);
    y0 = Math.min(y0, p[i + 1]); y1 = Math.max(y1, p[i + 1]);
    z0 = Math.min(z0, p[i + 2]); z1 = Math.max(z1, p[i + 2]);
  }
  const c = new T.Vector3((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  const pos = new Float32Array(p.length);
  for (let i = 0; i < p.length; i += 3) { pos[i] = p[i] - c.x; pos[i + 1] = p[i + 1] - c.y; pos[i + 2] = p[i + 2] - c.z; }
  const cap = data.cap || new Uint8Array(pos.length / 9);
  const d = { pos, nrm: data.nrm, col: data.col, cap };
  const g = new T.BufferGeometry();
  const pa = new T.BufferAttribute(pos, 3);
  g.setAttribute('position', pa);
  g.setAttribute('normal', new T.BufferAttribute(d.nrm, 3));
  g.setAttribute('color', new T.BufferAttribute(d.col, 3));
  g.computeBoundingSphere();
  const mesh = new T.Mesh(g, pieceMat);
  // the ink: the vegetable's own skin only (never the flat cut faces, so no dark scratches can show on them), with
  // normals averaged over every skin corner that shares a position (no cracks at hard edges)
  const og = new T.BufferGeometry();
  og.setAttribute('position', pa);
  const skin = [];
  for (let t = 0; t < cap.length; t++) if (!cap[t]) skin.push(t * 3, t * 3 + 1, t * 3 + 2);
  const allCap = skin.length === 0;
  og.setAttribute('normal', new T.BufferAttribute(smoothNormals(pos, d.nrm, allCap ? null : cap), 3));
  if (!allCap) og.setIndex(skin);
  og.boundingSphere = g.boundingSphere;
  const ol = new T.Mesh(og, inkMat(ink));
  ol.userData.outline = true;
  mesh.add(ol);
  const piece = { mesh, data: d, kind, center: c, size: new T.Vector3(x1 - x0, y1 - y0, z1 - z0), lo: [0, 0, 0, 0], hi: [0, 0, 0, 0], y0: 0, y1: 0, ink };
  mesh.userData.piece = piece;
  return piece;
}
export function disposePiece(pc) {
  pc.mesh.geometry.dispose();
  pc.mesh.children.forEach((o) => o.geometry && o.geometry.dispose());
  if (pc.mesh.parent) pc.mesh.parent.remove(pc.mesh);
}

function smoothNormals(pos, nrm, cap = null) {
  const acc = new Map();
  const key = (i) => `${Math.round(pos[i] * 2000)},${Math.round(pos[i + 1] * 2000)},${Math.round(pos[i + 2] * 2000)}`;
  const keys = [];
  for (let i = 0; i < pos.length; i += 3) {
    const k = key(i);
    keys.push(k);
    let a = acc.get(k);
    if (!a) { a = [0, 0, 0]; acc.set(k, a); }
    if (cap && cap[Math.floor(i / 9)]) continue;      // (cut faces don't bend the skin's outline)
    a[0] += nrm[i]; a[1] += nrm[i + 1]; a[2] += nrm[i + 2];
  }
  const out = new Float32Array(pos.length);
  for (let i = 0, j = 0; i < pos.length; i += 3, j++) {
    const a = acc.get(keys[j]);
    const l = Math.hypot(a[0], a[1], a[2]) || 1;
    out[i] = a[0] / l; out[i + 1] = a[1] / l; out[i + 2] = a[2] / l;
  }
  return out;
}

// Update a piece's turned vertices and extents after its quaternion changed.
const _q = new T.Quaternion();
export function measure(pc) {
  const p = pc.data.pos, q = pc.mesh.quaternion;
  const n = p.length;
  if (!pc.rv || pc.rv.length !== n) pc.rv = new Float32Array(n);
  const rv = pc.rv;
  const v = new T.Vector3();
  const lo = [Infinity, Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity, -Infinity];
  let y0 = Infinity, y1 = -Infinity;
  for (let i = 0; i < n; i += 3) {
    v.set(p[i], p[i + 1], p[i + 2]).applyQuaternion(q);
    rv[i] = v.x; rv[i + 1] = v.y; rv[i + 2] = v.z;
    if (v.y < y0) y0 = v.y;
    if (v.y > y1) y1 = v.y;
    for (let k = 0; k < 4; k++) {
      const s = v.x * AXES[k][0] + v.z * AXES[k][1];
      if (s < lo[k]) lo[k] = s;
      if (s > hi[k]) hi[k] = s;
    }
  }
  pc.lo = lo; pc.hi = hi; pc.y0 = y0; pc.y1 = y1;
  pc.q = q.clone();
  return pc;
}
// extent of a piece along a horizontal unit direction (nx, nz), in the parent's space: [min, max]
export function extentAlong(pc, nx, nz) {
  const rv = pc.rv, P = pc.mesh.position;
  let a = Infinity, b = -Infinity;
  for (let i = 0; i < rv.length; i += 3) {
    const s = rv[i] * nx + rv[i + 2] * nz;
    if (s < a) a = s;
    if (s > b) b = s;
  }
  const o = P.x * nx + P.z * nz;
  return [a + o, b + o];
}

// ---------------- the cut ----------------
const _n = new T.Vector3();
// Cut a piece with the vertical plane { x : (nx, 0, nz) . x = d } (parent space). bands: the cap's rings
// [[f0, f1, colour | 'rim' | fn(angle, f) -> colour], ...]. Returns [behind, infront] (behind = the -n side) or null.
export function cutPiece(pc, nx, nz, d, bands) {
  const q = pc.mesh.quaternion, P = pc.mesh.position;
  _q.copy(q).invert();
  _n.set(nx, 0, nz).applyQuaternion(_q);
  const dl = d - (nx * P.x + nz * P.z);     // n . (P + q xl) = d  =>  (q^-1 n) . xl = d - n . P
  const res = split(pc.data, _n.x, _n.y, _n.z, dl, bands);
  if (!res) return null;
  const out = res.map((half) => {
    const np = makePiece(half, { ink: pc.ink, kind: pc.kind });
    np.mesh.quaternion.copy(q);
    np.mesh.position.copy(np.center).applyQuaternion(q).add(P);
    measure(np);
    return np;
  });
  return out;
}

const tmpCol = new T.Color();
function split(src, nx, ny, nz, d, bands) {
  const sp = src.pos, sn = src.nrm, sc = src.col, sf = src.cap || new Uint8Array(sp.length / 9);
  const A = { p: [], n: [], c: [], f: [] }, B = { p: [], n: [], c: [], f: [] };
  let flag = 0;
  const segs = [];   // [px, py, pz, qx, qy, qz, r, g, b]
  const s = [0, 0, 0];
  const V = (i) => [sp[i], sp[i + 1], sp[i + 2]];
  const push = (T_, a, b, c) => { for (const v of [a, b, c]) { T_.p.push(v.p[0], v.p[1], v.p[2]); T_.n.push(v.n[0], v.n[1], v.n[2]); T_.c.push(v.c[0], v.c[1], v.c[2]); } T_.f.push(flag); };
  const vert = (i) => ({ p: V(i), n: [sn[i], sn[i + 1], sn[i + 2]], c: [sc[i], sc[i + 1], sc[i + 2]] });
  const lerp = (a, b, t) => {
    const n0 = a.n[0] + (b.n[0] - a.n[0]) * t, n1 = a.n[1] + (b.n[1] - a.n[1]) * t, n2 = a.n[2] + (b.n[2] - a.n[2]) * t;
    const l = Math.hypot(n0, n1, n2) || 1;
    return {
      p: [a.p[0] + (b.p[0] - a.p[0]) * t, a.p[1] + (b.p[1] - a.p[1]) * t, a.p[2] + (b.p[2] - a.p[2]) * t],
      n: [n0 / l, n1 / l, n2 / l],
      c: [a.c[0] + (b.c[0] - a.c[0]) * t, a.c[1] + (b.c[1] - a.c[1]) * t, a.c[2] + (b.c[2] - a.c[2]) * t],
    };
  };
  let nA = 0, nB = 0;
  for (let t = 0; t < sp.length; t += 9) {
    flag = sf[t / 9] || 0;
    for (let k = 0; k < 3; k++) {
      const i = t + k * 3;
      let v = sp[i] * nx + sp[i + 1] * ny + sp[i + 2] * nz - d;
      if (Math.abs(v) < 1e-6) v = 1e-6;
      s[k] = v;
    }
    const pos = (s[0] > 0) + (s[1] > 0) + (s[2] > 0);
    const tri = [vert(t), vert(t + 3), vert(t + 6)];
    if (pos === 3) { push(B, tri[0], tri[1], tri[2]); nB++; continue; }
    if (pos === 0) { push(A, tri[0], tri[1], tri[2]); nA++; continue; }
    // the lone vertex: the one on its own side
    let lone = 0;
    for (let k = 0; k < 3; k++) { const o1 = (k + 1) % 3, o2 = (k + 2) % 3; if ((s[k] > 0) !== (s[o1] > 0) && (s[k] > 0) !== (s[o2] > 0)) lone = k; }
    const i = lone, j = (i + 1) % 3, k = (i + 2) % 3;
    const pij = lerp(tri[i], tri[j], s[i] / (s[i] - s[j]));
    const pik = lerp(tri[i], tri[k], s[i] / (s[i] - s[k]));
    const loneSide = s[i] > 0 ? B : A, other = s[i] > 0 ? A : B;
    push(loneSide, tri[i], pij, pik);
    push(other, pij, tri[j], tri[k]);
    push(other, pij, tri[k], pik);
    if (s[i] > 0) { nB++; nA += 2; } else { nA++; nB += 2; }
    const cc = tri[i].c;   // the cut surface's own colour (whole-coloured triangles)
    segs.push(pij.p[0], pij.p[1], pij.p[2], pik.p[0], pik.p[1], pik.p[2], (cc[0] + tri[j].c[0] + tri[k].c[0]) / 3, (cc[1] + tri[j].c[1] + tri[k].c[1]) / 3, (cc[2] + tri[j].c[2] + tri[k].c[2]) / 3);
  }
  if (!segs.length || nA < 4 || nB < 4) return null;
  caps(segs, nx, ny, nz, bands, A, B);
  const pack = (X) => ({ pos: new Float32Array(X.p), nrm: new Float32Array(X.n), col: new Float32Array(X.c), cap: Uint8Array.from(X.f) });
  return [pack(A), pack(B)];
}

// Close both sides: group the cut segments into outlines (shared end points), fan each from its middle.
function caps(segs, nx, ny, nz, bands, A, B) {
  const m = segs.length / 9;
  const parent = new Map();
  const find = (k) => { let r = k; while (parent.get(r) !== r) r = parent.get(r); parent.set(k, r); return r; };
  const key = (x, y, z) => `${Math.round(x * 3000)},${Math.round(y * 3000)},${Math.round(z * 3000)}`;
  const ka = [], kb = [];
  for (let i = 0; i < m; i++) {
    const o = i * 9;
    const a = key(segs[o], segs[o + 1], segs[o + 2]), b = key(segs[o + 3], segs[o + 4], segs[o + 5]);
    if (!parent.has(a)) parent.set(a, a);
    if (!parent.has(b)) parent.set(b, b);
    const ra = find(a), rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
    ka.push(a); kb.push(b);
  }
  const groups = new Map();
  for (let i = 0; i < m; i++) { const r = find(ka[i]); if (!groups.has(r)) groups.set(r, []); groups.get(r).push(i); }
  // an in-plane basis for ring patterns (angle round the middle)
  const n = new T.Vector3(nx, ny, nz);
  const u = Math.abs(ny) < 0.9 ? new T.Vector3(0, 1, 0) : new T.Vector3(1, 0, 0);
  u.sub(n.clone().multiplyScalar(u.dot(n))).normalize();
  const w = new T.Vector3().crossVectors(n, u);
  const pa = new T.Vector3(), pb = new T.Vector3(), c = new T.Vector3(), e1 = new T.Vector3(), e2 = new T.Vector3();
  const emit = (X, p0, p1, p2, col, nn) => {
    for (const v of [p0, p1, p2]) { X.p.push(v.x, v.y, v.z); X.n.push(nn[0], nn[1], nn[2]); X.c.push(col[0], col[1], col[2]); }
    X.f.push(1);
  };
  const nA = [nx, ny, nz], nB = [-nx, -ny, -nz];
  for (const list of groups.values()) {
    // the middle: length-weighted average of the segment midpoints
    c.set(0, 0, 0);
    let L = 0;
    for (const i of list) {
      const o = i * 9;
      pa.set(segs[o], segs[o + 1], segs[o + 2]); pb.set(segs[o + 3], segs[o + 4], segs[o + 5]);
      const l = pa.distanceTo(pb);
      c.addScaledVector(pa.add(pb).multiplyScalar(0.5), l);
      L += l;
    }
    if (L < 1e-6) continue;
    c.multiplyScalar(1 / L);
    for (const i of list) {
      const o = i * 9;
      pa.set(segs[o], segs[o + 1], segs[o + 2]); pb.set(segs[o + 3], segs[o + 4], segs[o + 5]);
      // wind it to face +n (side A's cap faces the cut, toward +n)
      e1.subVectors(pa, c); e2.subVectors(pb, c);
      let P0 = pa.clone(), P1 = pb.clone();
      if (e1.clone().cross(e2).dot(n) < 0) { P0 = pb.clone(); P1 = pa.clone(); }
      const mid = P0.clone().add(P1).multiplyScalar(0.5).sub(c);
      const ang = Math.atan2(mid.dot(w), mid.dot(u));
      const segCol = [segs[o + 6], segs[o + 7], segs[o + 8]];
      for (const [f0, f1, spec] of bands) {
        let col;
        if (spec === 'rim') col = segCol;
        else {
          const hex = typeof spec === 'function' ? spec(ang, (f0 + f1) / 2, segCol) : spec;
          if (Array.isArray(hex)) col = hex;
          else { tmpCol.set(hex); col = [tmpCol.r, tmpCol.g, tmpCol.b]; }
        }
        const a0 = c.clone().lerp(P0, f0), b0 = c.clone().lerp(P1, f0), a1 = c.clone().lerp(P0, f1), b1 = c.clone().lerp(P1, f1);
        if (f0 <= 0) {
          emit(A, c, a1, b1, col, nA);
          emit(B, c, b1, a1, col, nB);
        } else {
          emit(A, a0, a1, b1, col, nA); emit(A, a0, b1, b0, col, nA);
          emit(B, a0, b1, a1, col, nB); emit(B, a0, b0, b1, col, nB);
        }
      }
    }
  }
}
