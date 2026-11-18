// Paint & mix: the paint surface. The toys are flat plywood cut-outs facing the camera, so a straight-on planar
// projection needs no UV unwrapping: every vertex gets  u = (x - cx) / S + 0.5,  v = (y - cy) / S + 0.5  from its
// model-space position (S = 1.04 * max(w, h) of the bbox), the same formula prop_paint.py used to normalise the
// shape data. The side walls share the edge texels, so paint wraps round the edge like real paint.
//
// One working set for the whole game (512 x 512): wood (drawn once per toy), paint (every mark, opaque, never
// faded), lines (burnt lines, eyes, smile; drawn once per toy) and the visible canvas (the texture), recomposed only
// inside the dirty rectangle of new marks and uploaded at most once per rendered frame. Coverage is counted on a
// 48 x 48 grid (which part each cell is in; the latest colour in it) - never getImageData.
// When a toy is hung its picture is frozen into its own 256 x 256 mipmapped texture and the working set moves on.
import * as T from '../three.js';
import { garmentProp } from '../engine/creature.js';
import { toonUnique, INK } from '../engine/toon.js';
import { camera } from '../engine/stage.js';
import { shapeOf, COLOURS, partAt } from './paint-shapes.js';

export const N = 768;   // (the toy is about half the screen high: a 768 canvas keeps it crisp)
const G = 48;
const BURNT = '#8a5a3a', INKC = '#3a2838';
export const WOODS = ['#f3e0bd', '#ecd0a4', '#f6e6cc'];   // birch, beech, maple
export const FRONT = 0.14;                                 // the toy's front face (model z)
const RING_UP = 0.068;                                     // ring centre above the hang point

// ---------- ink on merged normals (hard-edged cut-outs never crack at their bevels) ----------
const inkMats = new Map();
export function inkMat(th, color = INK) {
  const key = th + '|' + color;
  if (!inkMats.has(key)) {
    const m = new T.MeshBasicMaterial({ color, side: T.BackSide });
    m.onBeforeCompile = (s) => { s.vertexShader = 'attribute vec3 inkN;\n' + s.vertexShader.replace('#include <begin_vertex>', `vec3 transformed = position + inkN * ${th.toFixed(4)};`); };
    m.customProgramCacheKey = () => 'paint-ink' + th;
    m.userData.shared = true;
    inkMats.set(key, m);
  }
  return inkMats.get(key);
}
export function inkNormals(g) {
  if (g.attributes.inkN) return;
  const p = g.attributes.position, nr = g.attributes.normal, n = p.count, out = new Float32Array(n * 3), at = new Map();
  for (let i = 0; i < n; i++) {
    const k = Math.round(p.getX(i) * 2e3) + ',' + Math.round(p.getY(i) * 2e3) + ',' + Math.round(p.getZ(i) * 2e3);
    let a = at.get(k);
    if (!a) at.set(k, (a = [0, 0, 0, []]));
    a[0] += nr.getX(i); a[1] += nr.getY(i); a[2] += nr.getZ(i); a[3].push(i);
  }
  for (const a of at.values()) { const l = Math.hypot(a[0], a[1], a[2]) || 1; for (const i of a[3]) out.set([a[0] / l, a[1] / l, a[2] / l], i * 3); }
  g.setAttribute('inkN', new T.BufferAttribute(out, 3));
}
// a layer of a built model, baked into model space: { geometry (own copy), mesh template }
function layerGeo(kind, layer) {
  const gp = garmentProp(kind, layer);
  if (!gp) return null;
  const m = gp.children[0].children.find((o) => o.isMesh && !o.userData.outline);
  m.updateMatrix();
  const g = m.geometry.clone();
  g.applyMatrix4(m.matrix);
  g.userData = { shared: true };
  return g;
}
// planar UVs from model x, y (toys and cards) or x, z (the dish well)
export function planarUV(g, axes = 'xy', box = null) {
  g.computeBoundingBox();
  const b = box || g.boundingBox;
  const p = g.attributes.position, uv = new Float32Array(p.count * 2);
  const a0 = axes[0], a1 = axes[1];
  const c0 = (b.min[a0] + b.max[a0]) / 2, c1 = (b.min[a1] + b.max[a1]) / 2;
  const S = 1.04 * Math.max(b.max[a0] - b.min[a0], b.max[a1] - b.min[a1]);
  const get = (ax, i) => (ax === 'x' ? p.getX(i) : ax === 'y' ? p.getY(i) : p.getZ(i));
  for (let i = 0; i < p.count; i++) {
    uv[i * 2] = (get(a0, i) - c0) / S + 0.5;
    uv[i * 2 + 1] = axes === 'xz' ? 0.5 - (get(a1, i) - c1) / S : (get(a1, i) - c1) / S + 0.5;
  }
  g.setAttribute('uv', new T.BufferAttribute(uv, 2));
  return { c0, c1, S };
}

const toyGeos = new Map();
function toyParts(key) {
  if (toyGeos.has(key)) return toyGeos.get(key);
  const kind = 'prop_pt_' + key;
  const g = layerGeo(kind, kind);
  let res = null;
  if (g) {
    const { c0, c1, S } = planarUV(g, 'xy');
    inkNormals(g);
    const sh = shapeOf(key);
    if (sh && Math.abs(sh.S - S) > 0.01) console.warn('paint: canvas/mesh scale differ', key, sh.S, S);
    res = { geo: g, cx: c0, cy: c1, S, loop: layerGeo(kind, 'loop') };
    if (res.loop) inkNormals(res.loop);
  }
  toyGeos.set(key, res);
  return res;
}

// A toy: group origin = its twine ring centre, z = 0 its back face (hang it by putting the group on a peg).
// toy.mat.map is the picture (the working texture while painted, its own frozen texture after).
export function makeToy(key) {
  const sh = shapeOf(key), tp = toyParts(key);
  if (!sh || !tp) return null;
  const group = new T.Group();
  const body = new T.Group();
  const S = sh.S;
  const hx = (sh.hang[0] - 0.5) * S, hy = (sh.hang[1] - 0.5) * S + RING_UP;
  body.position.set(-hx, -hy, 0);
  group.add(body);
  const mat = toonUnique(0xffffff, {});
  const mesh = new T.Mesh(tp.geo, mat);
  const ink = new T.Mesh(tp.geo, inkMat(0.016));
  ink.userData.outline = true;
  mesh.add(ink);
  body.add(mesh);
  if (tp.loop) {
    const lm = new T.Mesh(tp.loop, toonUnique(0xc9a877, {}));
    const li = new T.Mesh(tp.loop, inkMat(0.008));
    li.userData.outline = true;
    lm.add(li);
    body.add(lm);
  }
  group.userData = { toy: true, key };
  const toy = { key, sh, S, group, body, mesh, ink, mat, hx, hy, tex: null, centre: new T.Vector3(hx * 0 - 0, 0, 0) };
  // the toy's middle (bbox centre) in group space, for cameras, hints and pokes
  toy.centre.set(-hx, -hy, FRONT / 2);
  return toy;
}
export function toyCentreWorld(toy, out = new T.Vector3()) { return toy.group.localToWorld(out.copy(toy.centre)); }
// group-local point of a unit-square point on the front face
export function toyLocal(toy, u, v, out = new T.Vector3()) { return out.set((u - 0.5) * toy.S - toy.hx, (v - 0.5) * toy.S - toy.hy, FRONT); }
export function toyWorld(toy, u, v, out = new T.Vector3()) { toyLocal(toy, u, v, out); return toy.group.localToWorld(out); }

// screen point -> unit-square point on the toy's front plane (and whether it is on the cut-out)
const _ray = new T.Raycaster(), _inv = new T.Matrix4(), _ndc = new T.Vector2(), _o = new T.Vector3(), _d = new T.Vector3();
export function screenToToy(toy, sx, sy) {
  _ndc.set((sx / innerWidth) * 2 - 1, -(sy / innerHeight) * 2 + 1);
  _ray.setFromCamera(_ndc, camera);
  toy.body.updateMatrixWorld(true);
  _inv.copy(toy.body.matrixWorld).invert();
  _o.copy(_ray.ray.origin).applyMatrix4(_inv);
  _d.copy(_ray.ray.direction).transformDirection(_inv);
  if (Math.abs(_d.z) < 1e-6) return null;
  const t = (FRONT - _o.z) / _d.z;
  if (t < 0) return null;
  const x = _o.x + _d.x * t, y = _o.y + _d.y * t;
  const u = x / toy.S + 0.5, v = y / toy.S + 0.5;
  return { u, v, part: partAt(toy.sh, u, v) };
}

// ---------- drawing helpers (any canvas size: everything in unit-square coordinates times `n`) ----------
function rng(seed) { let s = (seed * 9301 + 49297) % 233280 || 1; return () => (s = (s * 9301 + 49297) % 233280) / 233280; }
function shade(hexs, k) {
  const c = parseInt(hexs.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)));
  return `rgb(${f(c >> 16)},${f((c >> 8) & 255)},${f(c & 255)})`;
}
function polyPath(P, n, close = true) {
  const p = new Path2D();
  P.forEach(([u, v], i) => (i ? p.lineTo(u * n, (1 - v) * n) : p.moveTo(u * n, (1 - v) * n)));
  if (close) p.closePath();
  return p;
}
// the polygon pushed out (d > 0) or in (d < 0) by d unit-square units along its vertex normals
function offsetPoly(P, d) {
  let a2 = 0;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) a2 += P[j][0] * P[i][1] - P[i][0] * P[j][1];
  const s = a2 > 0 ? 1 : -1;
  return P.map((p, i) => {
    const a = P[(i - 1 + P.length) % P.length], b = P[(i + 1) % P.length];
    const tx = b[0] - a[0], ty = b[1] - a[1], L = Math.hypot(tx, ty) || 1;
    return [p[0] + (s * ty / L) * d, p[1] - (s * tx / L) * d];
  });
}
export function drawWood(ctx, n, tone, seed) {
  ctx.fillStyle = tone;
  ctx.fillRect(0, 0, n, n);
  const r = rng(seed + 3);
  ctx.strokeStyle = shade(tone, -0.04);
  ctx.lineWidth = Math.max(1, 3 * n / N);
  ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    const y = (0.1 + 0.8 * (i + r() * 0.6) / 6) * n, a = (r() - 0.5) * 0.08 * n, b = (r() - 0.5) * 0.08 * n;
    ctx.beginPath();
    ctx.moveTo(-0.05 * n, y);
    ctx.bezierCurveTo(0.3 * n, y + a, 0.7 * n, y + b, 1.05 * n, y + (a - b) * 0.5);
    ctx.stroke();
  }
}
export function drawLines(ctx, n, sh, { skipRings = false } = {}) {
  const k = n / N;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = BURNT;
  ctx.lineWidth = 7 * k;
  const ringSet = new Set((sh.rings || []).map((r) => r.join(',')));
  for (const ln of sh.lines) ctx.stroke(polyPath(ln, n, false));
  ctx.strokeStyle = INKC;
  ctx.lineWidth = 7 * k;
  for (const s of sh.smile || []) ctx.stroke(polyPath(s, n, false));
  ctx.fillStyle = INKC;
  for (const [u, v, r] of [...(sh.eyes || []), ...(sh.dots || [])]) { ctx.beginPath(); ctx.arc(u * n, (1 - v) * n, r * n, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = '#ffffff';
  for (const [u, v, r] of sh.eyes || []) { ctx.beginPath(); ctx.arc((u - r * 0.3) * n, (1 - v - r * 0.35) * n, r * n * 0.32, 0, Math.PI * 2); ctx.fill(); }
  return ringSet;
}
// a picture of the finished toy for the card (flat fills, burnt lines, an ink silhouette), on a white card
export function drawPicture(key, fills = {}, { n = 256, spots = null, wood = WOODS[0] } = {}) {
  const sh = shapeOf(key);
  const c = document.createElement('canvas');
  c.width = c.height = n;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fffaf2';
  ctx.fillRect(0, 0, n, n);
  if (!sh) return c;
  const m = 0.1, s = n * (1 - 2 * m);
  ctx.save();
  ctx.translate(n * m, n * m);
  const out = polyPath(sh.outline, s);
  ctx.save();
  ctx.clip(out);
  ctx.fillStyle = wood; ctx.fillRect(0, 0, s, s);
  const names = Object.keys(sh.parts);
  // the rest part first (whole outline), then the others on top
  const order = names.slice().sort((a, b) => (a === sh.rest ? -1 : b === sh.rest ? 1 : 0));
  for (const nm of order) {
    const col = fills[nm] ?? (names.length === 1 ? fills.body ?? fills.all : fills.all);
    if (!col) continue;
    ctx.fillStyle = COLOURS[col] || col;
    ctx.fill(polyPath(sh.parts[nm], s));
  }
  if (spots) { ctx.fillStyle = COLOURS[spots]; for (const [u, v, r] of sh.rings || []) { ctx.beginPath(); ctx.arc(u * s, (1 - v) * s, r * s * 1.05, 0, Math.PI * 2); ctx.fill(); } }
  drawLines(ctx, s, sh);
  ctx.restore();
  ctx.lineWidth = n * 0.018; ctx.strokeStyle = INKC; ctx.lineJoin = 'round';
  ctx.stroke(out);
  ctx.restore();
  return c;
}
// a blank toy's picture: wood and lines only (256, mipmapped)
export function blankTexture(key, tone, seed) {
  const sh = shapeOf(key);
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  drawWood(ctx, 256, tone, seed);
  if (sh) drawLines(ctx, 256, sh);
  return finishTex(new T.CanvasTexture(c), true);
}
function finishTex(t, mips) {
  t.colorSpace = T.SRGBColorSpace;
  t.generateMipmaps = mips;
  t.minFilter = mips ? T.LinearMipmapLinearFilter : T.LinearFilter;
  t.magFilter = T.LinearFilter;
  t.anisotropy = 4;
  return t;
}
export function setToyTexture(toy, tex) {
  const old = toy.tex;
  toy.mat.map = tex;
  toy.mat.needsUpdate = true;
  toy.tex = tex;
  if (old && old !== tex && !old.userData.shared) old.dispose();
}

// ---------- mark sprites, cached per colour ----------
const sprites = new Map();
function disc(ctx, cx, cy, r, lump, seed, pts = 22) {
  const R = rng(seed);
  ctx.beginPath();
  for (let i = 0; i <= pts; i++) {
    const a = (i / pts) * Math.PI * 2, rr = r * (1 + (i === pts ? 0 : (R() - 0.5) * lump));
    i ? ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr) : ctx.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
}
function spritesFor(col) {
  if (sprites.has(col)) return sprites.get(col);
  const hexs = COLOURS[col];
  const mk = (w) => { const c = document.createElement('canvas'); c.width = c.height = w; return [c, c.getContext('2d')]; };
  // dab: a slightly irregular disc with five fine lighter bristle streaks along the travel direction (x)
  const dab = (dry) => {
    const [c, g] = mk(64);
    g.fillStyle = hexs;
    disc(g, 32, 32, 29, 0.09, dry ? 7 : 3);
    g.strokeStyle = shade(hexs, col === 'white' ? -0.05 : 0.1);
    g.lineWidth = 1;
    for (let i = 0; i < 5; i++) { const y = 14 + i * 9 + (i % 2) * 2; g.beginPath(); g.moveTo(8, y); g.lineTo(56, y + (i - 2) * 0.6); g.stroke(); }
    if (dry) {
      // the brush is running out: soft, thin gaps between the bristles at the dab's trailing half only (no hard comb
      // of stripes where a stroke ends: the leading half stays solid, the gaps are faint)
      g.globalCompositeOperation = 'destination-out';
      g.globalAlpha = 0.35;
      g.lineWidth = 2;
      g.lineCap = 'round';
      for (let i = 0; i < 4; i++) { const y = 15 + i * 11; g.beginPath(); g.moveTo(4, y); g.lineTo(30, y + 0.5); g.stroke(); }
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';
    }
    return c;
  };
  // splats: a lumpy blob and 3-5 satellite drops (four shapes)
  const splat = (seed) => {
    const [c, g] = mk(128);
    const R = rng(seed * 17 + 5);
    g.fillStyle = hexs;
    disc(g, 64, 64, 38, 0.32, seed * 13 + 1, 14);
    disc(g, 64, 64, 33, 0.12, seed * 5 + 2, 20);
    const nSat = 3 + Math.floor(R() * 3);
    for (let i = 0; i < nSat; i++) {
      const a = R() * Math.PI * 2, d = 46 + R() * 12, r = 4 + R() * 5;
      g.beginPath(); g.arc(64 + Math.cos(a) * d, 64 + Math.sin(a) * d, r, 0, Math.PI * 2); g.fill();
    }
    g.strokeStyle = shade(hexs, col === 'white' ? -0.05 : 0.1); g.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(64, 64, 14 + i * 7, 0.4 + i, 1.6 + i); g.stroke(); }
    return c;
  };
  // the dot stamp: a crisp disc with twenty one-pixel notches and a faintly speckled sponge edge
  const stamp = () => {
    const [c, g] = mk(96);
    g.fillStyle = hexs;
    g.beginPath();
    for (let i = 0; i <= 40; i++) { const a = (i / 40) * Math.PI * 2, r = i % 2 ? 44 : 46; i ? g.lineTo(48 + Math.cos(a) * r, 48 + Math.sin(a) * r) : g.moveTo(48 + r, 48); }
    g.closePath(); g.fill();
    const R = rng(31);
    g.fillStyle = shade(hexs, col === 'white' ? -0.06 : 0.14);
    for (let i = 0; i < 40; i++) { const a = R() * Math.PI * 2, d = 30 + R() * 13; g.fillRect(48 + Math.cos(a) * d, 48 + Math.sin(a) * d, 1.5, 1.5); }
    return c;
  };
  const s = { dab: dab(false), dry: dab(true), splats: [0, 1, 2, 3].map(splat), stamp: stamp() };
  sprites.set(col, s);
  return s;
}

// ---------- the working set ----------
export class PaintSurface {
  constructor() {
    const mk = () => { const c = document.createElement('canvas'); c.width = c.height = N; return c; };
    this.wood = mk(); this.paint = mk(); this.lines = mk(); this.vis = mk();
    this.wctx = this.wood.getContext('2d');
    this.pctx = this.paint.getContext('2d');
    this.lctx = this.lines.getContext('2d');
    this.vctx = this.vis.getContext('2d');
    this.tex = finishTex(new T.CanvasTexture(this.vis), false);
    this.tex.userData.shared = true;   // owned here, not by a toy's material
    this.part = new Int8Array(G * G);
    this.col = new Int8Array(G * G);
    this.keys = Object.keys(COLOURS);
    this.dirty = null;
    this.toy = null;
  }
  dispose() { this.tex.dispose(); }
  // start painting a toy: draws its wood and lines, clears the paint, builds the coverage grid and clip paths
  attach(toy, { tone = WOODS[0], seed = 1, mirror = false } = {}) {
    this.toy = toy;
    const sh = toy.sh;
    this.sh = sh;
    this.mirror = !!(mirror || sh.mirror);
    drawWood(this.wctx, N, tone, seed);
    this.lctx.clearRect(0, 0, N, N);
    drawLines(this.lctx, N, sh);
    this.pctx.setTransform(1, 0, 0, 1, 0, 0);
    this.pctx.clearRect(0, 0, N, N);
    this.partNames = Object.keys(sh.parts);
    const pIndex = Object.fromEntries(this.partNames.map((n, i) => [n, i]));
    this.total = new Int32Array(this.partNames.length);
    this.count = this.partNames.map(() => new Int32Array(this.keys.length + 1));   // [colour index + 1] (0 = bare)
    for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) {
      const p = partAt(sh, (i + 0.5) / G, (j + 0.5) / G);
      const k = j * G + i;
      this.part[k] = p === null ? -1 : pIndex[p];
      this.col[k] = -1;
      if (p !== null) { this.total[pIndex[p]]++; this.count[pIndex[p]][0]++; }
    }
    // clip paths: each part grown by 3 px; the rest part is the grown outline minus the other parts (shrunk 3 px)
    const g = 4.5 / N;
    this.clips = {};
    for (const nm of this.partNames) {
      const p = new Path2D();
      if (nm === sh.rest || this.partNames.length === 1) {
        p.addPath(polyPath(offsetPoly(sh.outline, g), N));
        for (const o of this.partNames) if (o !== nm) p.addPath(polyPath(offsetPoly(sh.parts[o], -g), N));
      } else p.addPath(polyPath(offsetPoly(sh.parts[nm], g), N));
      this.clips[nm] = p;
    }
    this.marks = 0; this.splats = 0; this.stamps = 0;
    this.vctx.drawImage(this.wood, 0, 0);
    this.vctx.drawImage(this.lines, 0, 0);
    this.tex.needsUpdate = true;
    setToyTexture(toy, this.tex);
    this.last = null;
  }
  // freeze the toy's picture into its own small mipmapped texture (the working set is then free for the next toy)
  freeze() {
    const toy = this.toy;
    if (!toy) return null;
    this.flush();
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    c.getContext('2d').drawImage(this.vis, 0, 0, 256, 256);
    const t = finishTex(new T.CanvasTexture(c), true);
    setToyTexture(toy, t);
    toy.frozen = c;
    this.toy = null;
    return t;
  }
  // ---- marks: (u, v) unit-square on the toy; clip = part name or null; returns the cells' part names touched ----
  px(u, v) { return [u * N, (1 - v) * N]; }
  begin(clip) {
    this.clipName = clip || null;
    this.last = null;
  }
  withClip(fn) {
    const c = this.pctx;
    if (this.clipName && this.clips[this.clipName]) { c.save(); c.clip(this.clips[this.clipName], 'evenodd'); fn(c); c.restore(); }
    else fn(c);
  }
  grow(x0, y0, x1, y1) {
    const d = this.dirty;
    if (!d) this.dirty = [x0, y0, x1, y1];
    else { d[0] = Math.min(d[0], x0); d[1] = Math.min(d[1], y0); d[2] = Math.max(d[2], x1); d[3] = Math.max(d[3], y1); }
  }
  // writes colour ci into the grid cells within radius r (px) of (x, y) px, respecting the clip
  cells(x, y, r, ci) {
    const cs = N / G;
    const clipIdx = this.clipName ? this.partNames.indexOf(this.clipName) : -1;
    const i0 = Math.max(0, Math.floor((x - r) / cs)), i1 = Math.min(G - 1, Math.floor((x + r) / cs));
    const jy0 = Math.max(0, Math.floor((N - (y + r)) / cs)), jy1 = Math.min(G - 1, Math.floor((N - (y - r)) / cs));
    let hits = 0;
    for (let j = jy0; j <= jy1; j++) for (let i = i0; i <= i1; i++) {
      const cx = (i + 0.5) * cs, cy = N - (j + 0.5) * cs;
      if ((cx - x) ** 2 + (cy - y) ** 2 > r * r) continue;
      const k = j * G + i, p = this.part[k];
      if (p < 0 || (clipIdx >= 0 && p !== clipIdx)) continue;
      const old = this.col[k];
      if (old === ci) continue;
      this.count[p][old + 1]--;
      this.count[p][ci + 1]++;
      this.col[k] = ci;
      hits++;
    }
    return hits;
  }
  sprite(img, x, y, w, h, ang, ci, rCov) {
    const draw = (X, Y, A) => {
      this.withClip((c) => { c.save(); c.translate(X, Y); c.rotate(A); c.drawImage(img, -w / 2, -h / 2, w, h); c.restore(); });
      const m = Math.max(w, h) * 0.75;
      this.grow(X - m, Y - m, X + m, Y + m);
      this.cells(X, Y, rCov, ci);
    };
    draw(x, y, ang);
    if (this.mirror) draw(N - x, y, Math.PI - ang);
  }
  // one stroke segment: dabs every 9 px from the last point to (u, v). size: 1 normal, < 1 thinner; dry: bristle gaps
  strokeTo(u, v, col, { size = 1, dry = false, world = 0.22 } = {}) {
    const [x, y] = this.px(u, v);
    const ci = this.keys.indexOf(col);
    const sp = spritesFor(col);
    const w = (world / this.toy.S) * N * size;
    const L = this.last;
    if (!L) { this.sprite(dry ? sp.dry : sp.dab, x, y, w, w, 0, ci, w * 0.45); this.last = { x, y, a: 0 }; this.marks++; return 0; }
    const dx = x - L.x, dy = y - L.y, d = Math.hypot(dx, dy);
    const stp = (9 * N) / 512;   // (a dab every ~9 px of a 512 canvas: no gaps at any speed)
    if (d < stp) return 0;
    const ang = Math.atan2(dy, dx);
    const steps = Math.floor(d / stp);
    for (let s = 1; s <= steps; s++) {
      const t = (s * stp) / d;
      this.sprite(dry ? sp.dry : sp.dab, L.x + dx * t, L.y + dy * t, w * 1.08, w, ang, ci, w * 0.45);
    }
    const t = (steps * stp) / d;
    this.last = { x: L.x + dx * t, y: L.y + dy * t, a: ang };
    this.marks += steps;
    return ((steps * stp) / N) * this.toy.S;   // distance painted (toy units)
  }
  end() { this.last = null; this.clipName = null; }
  splat(u, v, col, rot = Math.random(), world = 0.32) {
    const [x, y] = this.px(u, v);
    const ci = this.keys.indexOf(col);
    const sp = spritesFor(col);
    const w = (world / this.toy.S) * N * (128 / 76);
    const ang = Math.floor(rot * 4) * (Math.PI / 2) + (Math.random() - 0.5) * 0.7;
    this.sprite(sp.splats[Math.floor(Math.random() * 4)], x, y, w, w, ang, ci, (world / 2 / this.toy.S) * N);
    this.splats++;
  }
  stamp(u, v, col, world = 0.24) {
    const [x, y] = this.px(u, v);
    const ci = this.keys.indexOf(col);
    const w = (world / this.toy.S) * N * (96 / 92);
    this.sprite(spritesFor(col).stamp, x, y, w, w, Math.random() * 6.28, ci, (world / 2 / this.toy.S) * N);
    this.stamps++;
  }
  // recompose the dirty rectangle (wood, paint, lines) and upload: once per frame, only when something changed
  flush() {
    const d = this.dirty;
    if (!d) return false;
    this.dirty = null;
    const x0 = Math.max(0, Math.floor(d[0])), y0 = Math.max(0, Math.floor(d[1]));
    const x1 = Math.min(N, Math.ceil(d[2])), y1 = Math.min(N, Math.ceil(d[3]));
    const w = x1 - x0, h = y1 - y0;
    if (w <= 0 || h <= 0) return false;
    const c = this.vctx;
    c.drawImage(this.wood, x0, y0, w, h, x0, y0, w, h);
    c.drawImage(this.paint, x0, y0, w, h, x0, y0, w, h);
    c.drawImage(this.lines, x0, y0, w, h, x0, y0, w, h);
    this.tex.needsUpdate = true;
    return true;
  }
  // ---- coverage (0..1) ----
  coverage(part = null, col = null) {
    if (!this.partNames) return 0;
    const idx = part ? [this.partNames.indexOf(part)] : this.partNames.map((_, i) => i);
    let tot = 0, hit = 0;
    for (const p of idx) {
      if (p < 0) continue;
      tot += this.total[p];
      if (col) hit += this.count[p][this.keys.indexOf(col) + 1];
      else hit += this.total[p] - this.count[p][0];
    }
    return tot ? hit / tot : 0;
  }
  // the part of the toy that holds most of `col` (for 'wrong colour' checks)
  colourIn(part, col) { return this.coverage(part, col); }
}
