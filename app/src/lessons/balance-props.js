// Fill & balance pieces: the clear measuring pail with its live sand / water fill, the jug and the scoop, the pouring
// stream (a curved flowing tube plus grains, drops and ripples), the see-saw plank on its brick (a damped spring
// driven by the weights on each end, which bumps on the ground), the sand heap, the water tub and the castle a
// tipped-out pail leaves behind. Every object is a Blender model (tools/blender/creatures/prop_balance.py); the
// fill, stream and particles are code because they change shape every frame.
import * as T from '../three.js';
import { scMesh } from '../engine/scenery.js';
import { toon, toonUnique, mesh, geo, blobShadow } from '../engine/toon.js';

// ---------- the pail (unit model; see prop_balance.py) ----------
export const PAIL = { RB: 0.6, R: 0.78, H: 1.2, TW: 0.035, YF: 0.222, YFULL: 1.06 };
const ro = (y) => PAIL.RB + (PAIL.R - PAIL.RB) * y / PAIL.H;
const ri = (y) => ro(y) - PAIL.TW - 0.008;
export const levelY = (L) => PAIL.YF + L * (PAIL.YFULL - PAIL.YF);
export const MATS = {
  sand: { side: 0xf8d68e, top: 0xfff0c4, deep: 0xeec074, stream: [0xf7d690, 0xe0b066], grain: 0xeec274 },
  water: { side: 0x45a8f2, top: 0xbfeaff, deep: 0x2c86e0, stream: [0x5cc0ff, 0xffffff], grain: 0x8fdcff },
  mud: { side: 0xb58650, top: 0xcda06a, deep: 0x9a6c3c, stream: [0xc79a60, 0xa57a46], grain: 0xb88a52 },
};
const V = (a) => new T.Vector3(a[0], a[1], a[2]);

// a Blender layer as a static mesh, or a code fallback when the model isn't built
function part(kind, layer, opts, fb) { return scMesh(kind, layer, opts) || (fb ? fb() : new T.Group()); }

// see-through plastic: faint in the middle, brighter at the silhouette edges (no ink: the rim and base carry the outline)
let _glass = null;
function glassMat() {
  if (_glass) return _glass;
  const m = toonUnique(0xf2fbff, { transparent: true, depthWrite: false, side: T.DoubleSide });
  m.onBeforeCompile = (s) => {
    s.fragmentShader = s.fragmentShader.replace('#include <dithering_fragment>', `#include <dithering_fragment>
      float fr = 1.0 - abs(dot(normalize(normal), normalize(vViewPosition)));
      gl_FragColor.a = mix(0.07, 0.62, pow(fr, 2.4));
      gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(1.0), 0.25);`);
  };
  m.customProgramCacheKey = () => 'bal-glass';
  m.userData.shared = true;
  return (_glass = m);
}

// The fill: a frustum that hugs the inside wall up to the surface. Water keeps its surface level with the world (and
// sloshes); sand moves with the pail and heaps up in a little dome, highest when full.
class Fill {
  constructor() {
    const N = (this.N = 36);
    const nv = 1 + N * 4 + 1;
    this.pos = new Float32Array(nv * 3);
    this.col = new Float32Array(nv * 3);
    const g = (this.geo = new T.BufferGeometry());
    g.setAttribute('position', new T.BufferAttribute(this.pos, 3));
    g.setAttribute('color', new T.BufferAttribute(this.col, 3));
    const idx = [];
    const BR = 1, TS = 1 + N, TC = 1 + 2 * N, MD = 1 + 3 * N, TOP = 1 + 4 * N;
    for (let i = 0; i < N; i++) {
      const j = (i + 1) % N;
      idx.push(BR + i, TS + j, TS + i, BR + i, BR + j, TS + j);          // the wall
      idx.push(TC + i, TC + j, MD + j, TC + i, MD + j, MD + i);          // the outer ring of the top
      idx.push(MD + i, MD + j, TOP);                                     // the middle of the top
    }
    g.setIndex(idx);
    this.I = { BR, TS, TC, MD, TOP };
    this.matSand = toonUnique(0xffffff, { vertexColors: true });
    this.matWater = toonUnique(0xffffff, { vertexColors: true, transparent: true, opacity: 0.93 });
    this.mesh = new T.Mesh(g, this.matSand);
    this.mesh.renderOrder = 2;
    this.mesh.visible = false;
    this.mesh.frustumCulled = false;
    this.kind = null;
  }
  setKind(kind) {
    if (this.kind === kind) return;
    this.kind = kind;
    const M = MATS[kind] || MATS.sand;
    this.mesh.material = kind === 'water' ? this.matWater : this.matSand;
    const c = new T.Color(), N = this.N, I = this.I;
    const set = (i, hex) => { c.setHex(hex); this.col[i * 3] = c.r; this.col[i * 3 + 1] = c.g; this.col[i * 3 + 2] = c.b; };
    set(0, M.deep);
    for (let i = 0; i < N; i++) { set(I.BR + i, M.deep); set(I.TS + i, M.side); set(I.TC + i, M.top); set(I.MD + i, M.top); }
    set(I.TOP, M.top);
    this.geo.attributes.color.needsUpdate = true;
  }
  // L: level 0..1, slope: dy/dx of the surface (pail space), dome: sand heap height at the middle, wob: ripple height
  update(L, slope = 0, dome = 0, wob = 0, t = 0) {
    if (L <= 0.004) { this.mesh.visible = false; return; }
    this.mesh.visible = true;
    const N = this.N, I = this.I, p = this.pos;
    const h = levelY(L), y0 = PAIL.YF, ymax = PAIL.H - 0.03;
    const put = (i, x, y, z) => { p[i * 3] = x; p[i * 3 + 1] = y; p[i * 3 + 2] = z; };
    put(0, 0, y0, 0);
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2, cx = Math.cos(a), cz = -Math.sin(a);
      const rr = ri(h);
      let y = h + slope * rr * cx + wob * Math.sin(a * 3 + t * 9) * 0.5;
      y = Math.max(y0 + 0.004, Math.min(ymax, y));
      const r = ri(y);
      put(I.BR + i, cx * ri(y0), y0, cz * ri(y0));
      put(I.TS + i, cx * r, y, cz * r);
      put(I.TC + i, cx * r, y, cz * r);
      const rm = r * 0.55;
      let ym = h + slope * rm * cx + dome * 0.62 + wob * Math.sin(a * 2 - t * 11) * 0.7;
      ym = Math.max(y0 + 0.004, Math.min(ymax + dome, ym));
      put(I.MD + i, cx * rm, ym, cz * rm);
    }
    put(I.TOP, 0, Math.max(y0 + 0.004, h + dome + wob * Math.sin(t * 13)), 0);
    this.geo.attributes.position.needsUpdate = true;
    this.geo.computeVertexNormals();
  }
}

export class Pail {
  constructor(col = 0xff5a5a, sx = 1, sy = sx) {
    const g = (this.g = new T.Group());
    const m = (this.m = new T.Group());
    m.scale.set(sx, sy, sx);
    g.add(m);
    this.skin = part('prop_bal_pail', 'prop_bal_pail', { tint: col }, () => mesh(geo.cyl(PAIL.RB + 0.08, PAIL.RB + 0.08, 0.2, 28), col, { outline: 0.02 }));
    if (!this.skin.isMesh) this.skin.position.y = 0.1;
    this.glass = part('prop_bal_pail', 'glass', { ink: 0 }, () => new T.Mesh(geo.cyl(PAIL.R, PAIL.RB, PAIL.H, 32, true)));
    this.glass.material = glassMat();
    this.glass.renderOrder = 3;
    this.handle = part('prop_bal_pail', 'handle', {});
    this.floor = part('prop_bal_pail', 'floor', { ink: 0 });
    this.half = part('prop_bal_pail', 'markHalf', {});
    this.full = part('prop_bal_pail', 'markFull', {});
    this.star = part('prop_bal_pail', 'star', {});
    // the marks get their own materials so they can light up when the sand reaches them
    for (const mk of [this.half, this.full, this.star]) if (mk.isMesh) { mk.material = mk.material.clone(); mk.material.emissive = new T.Color(0); }
    this.fill = new Fill();
    m.add(this.skin, this.floor, this.fill.mesh, this.glass, this.handle, this.half, this.full, this.star);
    this.mid = new T.Object3D();          // the middle of the pail (for halos and hint hands)
    this.mid.position.y = PAIL.H * 0.55;
    m.add(this.mid);
    this.shadow = blobShadow(0.78 * sx);
    g.add(this.shadow);
    this.sx = sx; this.sy = sy;
    this.cap = sx * sx * sy;           // how much it holds (a unit pail holds 1)
    this.col = col;
    this.level = 0;
    this.mat = null;
    this.slope = 0; this.sloshV = 0; this.wob = 0;
    this.glowT = { half: 0, full: 0 };
    g.userData.pail = this;
    g.userData.kind = 'prop_bal_pail';
  }
  get mass() { return 0.3 * this.cap + this.level * this.cap; }
  // the middle of the opening, in world space
  mouth(out = new T.Vector3()) { return this.m.localToWorld(out.set(0, PAIL.H, 0)); }
  surface(out = new T.Vector3()) { return this.m.localToWorld(out.set(0, levelY(this.level) + (this.mat === 'water' ? 0 : 0.05), 0)); }
  add(amount, mat) {
    if (!this.mat || this.level <= 0.004) this.mat = mat;
    else if (this.mat !== mat) this.mat = 'mud';
    this.level = Math.min(1, Math.max(0, this.level + amount));
    this.fill.setKind(this.mat);
  }
  set(L, mat) { this.level = L; if (mat) this.mat = mat; if (this.mat) this.fill.setKind(this.mat); }
  flash(which) { this.glowT[which] = 1; }
  // per frame: water stays level with the world and sloshes when the plank moves; sand heaps up
  tick(dt, t, worldTilt = 0, kick = 0) {
    const water = this.mat === 'water';
    if (water) {
      this.sloshV += (-this.slope * 60 - this.sloshV * 5 - kick * 0.6) * dt;
      this.slope += this.sloshV * dt;
      this.slope = Math.max(-0.35, Math.min(0.35, this.slope));
    } else { this.slope = 0; this.sloshV = 0; }
    this.wob = Math.max(0, this.wob - dt * 1.5);
    const dome = water ? 0 : 0.05 + Math.max(0, this.level - 0.82) * 1.0;
    const sl = water ? -Math.tan(worldTilt) + this.slope : 0;
    this.fill.update(this.level, sl, dome, water ? this.wob * 0.05 : this.wob * 0.02, t);
    for (const k of ['half', 'full']) {
      if (this.glowT[k] <= 0) continue;
      this.glowT[k] = Math.max(0, this.glowT[k] - dt / 1.1);
      const e = Math.abs(Math.sin(this.glowT[k] * Math.PI * 3)) * this.glowT[k];
      const list = k === 'half' ? [this.half] : [this.full, this.star];
      for (const mk of list) if (mk.isMesh) mk.material.emissive.setRGB(e * 0.9, e * 0.75, e * 0.1);
    }
  }
}

// the castle a full pail of sand leaves when it's tipped out (pail sized)
export function makeCastle(sx = 1, sy = sx) {
  const g = new T.Group();
  const m = new T.Group(); m.scale.set(sx, sy, sx); g.add(m);
  m.add(part('prop_bal_castle', 'prop_bal_castle', {}, () => mesh(geo.cyl(PAIL.RB, PAIL.R, PAIL.H, 24), 0xedc477, { outline: 0.02 })));
  m.add(part('prop_bal_castle', 'shells', {}), part('prop_bal_castle', 'flag', {}));
  g.add(blobShadow(0.85 * sx));
  return g;
}

export function makeHeap() {
  const g = new T.Group();
  g.add(part('prop_bal_heap', 'prop_bal_heap', {}, () => { const d = mesh(geo.sphere(1, 20, 10), 0xedc477, { outline: 0.02 }); d.scale.set(1.6, 1.2, 1.1); return d; }));
  g.add(part('prop_bal_heap', 'pebbles', {}), part('prop_bal_heap', 'flag', {}));
  return g;
}
export function makeTub(col = 0x3f8cff) {
  const g = new T.Group();
  g.add(part('prop_bal_tub', 'prop_bal_tub', { tint: col }, () => mesh(geo.cyl(1.05, 0.88, 0.78, 28), col, { outline: 0.02 })));
  const w = part('prop_bal_tub', 'water', {});
  g.add(w);
  g.userData.water = w;
  g.add(blobShadow(1.15));
  return g;
}

// ---------- the jug and the scoop ----------
// The drag target is the "hand" (g): it holds the handle, so tipping (tilt.rotation.z) pivots round the grip like a
// real hand pouring. spout = where the stream leaves (model units), body = middle of the body (for the hit area).
export const POURERS = {
  jug: { kind: 'prop_bal_jug', tint: 0x3f8cff, k: 0.86, spout: [0.77, 1.13, 0], grip: [-0.66, 0.72, 0], body: [0.02, 0.55, 0], pour: -1.15, mat: 'water' },
  scoop: { kind: 'prop_bal_scoop', tint: 0xff8a2a, k: 1.05, spout: [0.47, 0.48, 0], grip: [-0.97, 0.58, 0], body: [0, 0.3, 0], pour: -1.4, mat: 'sand' },
};
export function makePourer(type) {
  const P = POURERS[type];
  const g = new T.Group();
  const tilt = new T.Group();
  g.add(tilt);
  const m = new T.Group();
  m.scale.setScalar(P.k);
  m.position.set(-P.grip[0] * P.k, -P.grip[1] * P.k, 0);
  tilt.add(m);
  m.add(part(P.kind, P.kind, { tint: P.tint }, () => mesh(geo.cyl(0.45, 0.4, 1.0, 20), P.tint, { outline: 0.02 })));
  let load = null;
  if (type === 'jug') m.add(part(P.kind, 'drop', {}));
  else { load = part(P.kind, 'sand', {}); m.add(load); }
  g.userData = { type, P, tilt, model: m, load, mat: P.mat };
  return g;
}
const _sv = new T.Vector3();
export function spoutWorld(g, out = new T.Vector3()) { const P = g.userData.P; return g.userData.model.localToWorld(out.set(P.spout[0], P.spout[1], P.spout[2])); }
// offset from the hand to the spout (world units) when the pourer is tipped by angle a
export function spoutOffset(g, a, out = new T.Vector3()) {
  const P = g.userData.P;
  const x = (P.spout[0] - P.grip[0]) * P.k, y = (P.spout[1] - P.grip[1]) * P.k;
  const c = Math.cos(a), s = Math.sin(a);
  return out.set(x * c - y * s, x * s + y * c, 0);
}

// ---------- particles (grains of sand, water drops) ----------
class Bits {
  constructor(n = 90) {
    this.n = n;
    this.im = new T.InstancedMesh(geo.sphere(1, 6, 4), toon(0xffffff), n);
    this.im.frustumCulled = false;
    this.im.instanceMatrix.setUsage(T.DynamicDrawUsage);
    this.p = Array.from({ length: n }, () => ({ alive: false, p: new T.Vector3(), v: new T.Vector3(), life: 0, s: 0.04, floor: -1, bounce: 0 }));
    this.k = 0;
    const z = new T.Matrix4().makeScale(0, 0, 0);
    const c = new T.Color(0xffffff);
    for (let i = 0; i < n; i++) { this.im.setMatrixAt(i, z); this.im.setColorAt(i, c); }
  }
  spawn(pos, vel, { life = 0.6, s = 0.04, col = 0xffffff, floor = -1, bounce = 0 } = {}) {
    const q = this.p[this.k];
    this.im.setColorAt(this.k, _c.setHex(col));
    this.im.instanceColor.needsUpdate = true;
    this.k = (this.k + 1) % this.n;
    q.alive = true; q.p.copy(pos); q.v.copy(vel); q.life = life; q.s = s; q.floor = floor; q.bounce = bounce;
  }
  update(dt) {
    for (let i = 0; i < this.n; i++) {
      const q = this.p[i];
      if (!q.alive) continue;
      q.life -= dt;
      q.v.y -= 15 * dt;
      q.p.addScaledVector(q.v, dt);
      if (q.p.y < q.floor) {
        if (q.bounce > 0) { q.p.y = q.floor; q.v.y = -q.v.y * 0.3; q.v.x *= 0.5; q.v.z *= 0.5; q.bounce--; }
        else q.life = 0;
      }
      if (q.life <= 0) { q.alive = false; this.im.setMatrixAt(i, _zero); continue; }
      const s = q.s * Math.min(1, q.life * 5);
      _m4.compose(q.p, _q0, _s3.set(s, s, s));
      this.im.setMatrixAt(i, _m4);
    }
    this.im.instanceMatrix.needsUpdate = true;
  }
}
const _c = new T.Color(), _zero = new T.Matrix4().makeScale(0, 0, 0), _m4 = new T.Matrix4(), _q0 = new T.Quaternion(), _s3 = new T.Vector3();

// ---------- the pouring stream ----------
// A tube along a curve from the spout down to the surface: it leaves the spout sideways and falls, it narrows as it
// speeds up, and bright bands slide down it so it visibly flows. On start the front runs down from the spout; on stop
// the tail lets go and falls in after it. Sand also sheds grains and puffs where it lands; water throws drops and
// rings out ripples.
export class Stream {
  constructor(parent) {
    const S = (this.S = 26), R = (this.R = 9);
    const nv = (S + 1) * R;
    this.pos = new Float32Array(nv * 3);
    this.col = new Float32Array(nv * 3);
    const g = (this.geo = new T.BufferGeometry());
    g.setAttribute('position', new T.BufferAttribute(this.pos, 3));
    g.setAttribute('color', new T.BufferAttribute(this.col, 3));
    const idx = [];
    for (let i = 0; i < S; i++) for (let k = 0; k < R; k++) {
      const a = i * R + k, b = i * R + (k + 1) % R, c = (i + 1) * R + k, d = (i + 1) * R + (k + 1) % R;
      idx.push(a, c, b, b, c, d);
    }
    g.setIndex(idx);
    this.matWater = toonUnique(0xffffff, { vertexColors: true, transparent: true, opacity: 0.88, side: T.DoubleSide });
    this.matSand = toonUnique(0xffffff, { vertexColors: true, side: T.DoubleSide });
    this.mesh = new T.Mesh(g, this.matWater);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 4;
    this.mesh.visible = false;
    parent.add(this.mesh);
    this.bits = new Bits(110);
    parent.add(this.bits.im);
    // ripple rings on the water surface
    this.rings = [0, 1].map(() => {
      const r = new T.Mesh(geo.ring(0.8, 1, 32), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, side: T.DoubleSide }));
      r.rotation.x = -Math.PI / 2; r.visible = false; r.renderOrder = 5;
      parent.add(r);
      return r;
    });
    this.ringT = 0;
    this.p0 = new T.Vector3(); this.c = new T.Vector3(); this.p2 = new T.Vector3(); this.dir = new T.Vector3(1, 0, 0);
    this.head = 0; this.tail = 0; this.on = false; this.kind = 'water'; this.k = 1; this.spawnAcc = 0;
    this.landed = 0;   // seconds the stream has been hitting the surface (for sounds)
  }
  start(kind, k = 1) {
    if (this.on && this.kind === kind) return;
    this.kind = kind; this.k = k;
    this.on = true;
    if (this.tail >= this.head || !this.mesh.visible) { this.head = 0; this.tail = 0; }
    this.mesh.material = kind === 'water' ? this.matWater : this.matSand;
  }
  stop() { this.on = false; }
  get active() { return this.on || (this.mesh.visible && this.tail < 1); }
  // where it leaves (p0, heading dir) and where it lands (p2)
  aim(p0, dir, p2) {
    this.p0.copy(p0); this.p2.copy(p2);
    this.dir.copy(dir).setY(0);
    if (this.dir.lengthSq() < 1e-4) this.dir.set(1, 0, 0);
    this.dir.normalize();
    const reach = Math.min(0.45, this.p0.distanceTo(this.p2) * 0.3);
    this.c.copy(this.p0).addScaledVector(this.dir, reach);
    this.c.y += 0.05;
  }
  at(u, out) {
    const a = (1 - u) * (1 - u), b = 2 * (1 - u) * u, c = u * u;
    return out.set(a * this.p0.x + b * this.c.x + c * this.p2.x, a * this.p0.y + b * this.c.y + c * this.p2.y, a * this.p0.z + b * this.c.z + c * this.p2.z);
  }
  update(dt, t, floorY = null) {
    if (this.on) this.head = Math.min(1, this.head + dt / 0.13);
    else if (this.mesh.visible) this.tail = Math.min(this.head, this.tail + dt / 0.16);
    const show = this.on || this.tail < this.head - 0.01;
    this.mesh.visible = show;
    this.landed = this.on && this.head >= 1 ? this.landed + dt : 0;
    const M = MATS[this.kind] || MATS.water;
    const water = this.kind === 'water';
    if (show) {
      const S = this.S, R = this.R, p = this.pos, col = this.col;
      const c0 = _c.setHex(M.stream[0]).clone(), c1 = new T.Color(M.stream[1]);
      for (let i = 0; i <= S; i++) {
        const u = this.tail + (this.head - this.tail) * (i / S);
        this.at(u, _a);
        this.at(Math.min(1, u + 0.02), _b);
        _tn.subVectors(_b, _a);
        if (_tn.lengthSq() < 1e-8) _tn.set(0, -1, 0);
        _tn.normalize();
        _n1.crossVectors(_tn, _zax);
        if (_n1.lengthSq() < 1e-6) _n1.set(1, 0, 0);
        _n1.normalize();
        _n2.crossVectors(_tn, _n1).normalize();
        const wob = 1 + Math.sin(t * 31 + u * 17) * (water ? 0.06 : 0.06) + (water ? 0 : Math.sin(t * 47 + u * 41) * 0.04);
        let r = (water ? 0.1 : 0.095) * this.k * (1 - 0.35 * u) * wob;
        // round off the two ends
        const e0 = (i / S), e1 = 1 - i / S;
        if (e0 < 0.06) r *= 0.55 + 0.45 * (e0 / 0.06);
        if (e1 < 0.04 && !this.on) r *= 0.4 + 0.6 * (e1 / 0.04);
        const band = ((u * (water ? 9 : 13) - t * (water ? 5.5 : 6.5)) % 1 + 1) % 1;
        for (let k = 0; k < R; k++) {
          const a = (k / R) * Math.PI * 2, cs = Math.cos(a), sn = Math.sin(a);
          const j = (i * R + k) * 3;
          p[j] = _a.x + (_n1.x * cs + _n2.x * sn) * r;
          p[j + 1] = _a.y + (_n1.y * cs + _n2.y * sn) * r;
          p[j + 2] = _a.z + (_n1.z * cs + _n2.z * sn) * r;
          // water: a glossy highlight running down the upper-left side plus faint bands sliding down it;
          // sand: soft darker grainy bands sliding down
          const nx = _n1.x * cs + _n2.x * sn, ny = _n1.y * cs + _n2.y * sn, nz = _n1.z * cs + _n2.z * sn;
          const gl = Math.max(0, nx * -0.55 + ny * 0.45 + nz * 0.7);
          const w = water ? Math.min(1, Math.pow(gl, 6) * 1.1 + (band < 0.14 ? 0.3 : 0)) : (band < 0.3 ? 0.45 : 0);
          col[j] = c0.r + (c1.r - c0.r) * w; col[j + 1] = c0.g + (c1.g - c0.g) * w; col[j + 2] = c0.b + (c1.b - c0.b) * w;
        }
      }
      this.geo.attributes.position.needsUpdate = true;
      this.geo.attributes.color.needsUpdate = true;
      this.geo.computeVertexNormals();
      this.geo.computeBoundingSphere();
    }
    // bits: grains falling alongside the sand, drops jumping out where water lands
    const floor = floorY ?? this.p2.y;
    if (this.on && this.head > 0.3) {
      this.spawnAcc += dt;
      const every = water ? 0.035 : 0.022;
      while (this.spawnAcc > every) {
        this.spawnAcc -= every;
        if (water) {
          if (this.head >= 1) {
            const a = Math.random() * Math.PI * 2, sp = 0.6 + Math.random() * 0.9;
            this.bits.spawn(this.p2, _v.set(Math.cos(a) * sp, 1.6 + Math.random() * 1.6, Math.sin(a) * sp * 0.7), { life: 0.5, s: 0.028 + Math.random() * 0.025, col: Math.random() < 0.5 ? 0xd8f6ff : 0x8fdcff, floor: floor - 0.02 });
          }
        } else {
          const u = 0.15 + Math.random() * 0.7 * this.head;
          this.at(u, _a);
          _a.x += (Math.random() - 0.5) * 0.14; _a.z += (Math.random() - 0.5) * 0.14;
          this.bits.spawn(_a, _v.set((Math.random() - 0.5) * 0.5, -1.5 - Math.random(), (Math.random() - 0.5) * 0.3), { life: 0.6, s: 0.03 + Math.random() * 0.025, col: Math.random() < 0.5 ? M.grain : 0xd9a85e, floor });
          if (this.head >= 1 && Math.random() < 0.5) {
            const a = Math.random() * Math.PI * 2;
            this.bits.spawn(this.p2, _v.set(Math.cos(a) * 0.9, 0.9 + Math.random() * 0.9, Math.sin(a) * 0.6), { life: 0.35, s: 0.026, col: M.grain, floor: floor - 0.01 });
          }
        }
      }
    }
    this.bits.update(dt);
    // ripples
    this.ringT += dt;
    for (let i = 0; i < this.rings.length; i++) {
      const r = this.rings[i];
      const ph = ((this.ringT / 0.5 + i * 0.5) % 1);
      r.visible = water && this.on && this.head >= 1;
      if (!r.visible) continue;
      r.position.set(this.p2.x, this.p2.y + 0.012, this.p2.z);
      const s = 0.08 + ph * 0.42 * this.k;
      r.scale.set(s, s, s);
      r.material.opacity = 0.75 * (1 - ph);
    }
  }
}
const _a = new T.Vector3(), _b = new T.Vector3(), _tn = new T.Vector3(), _n1 = new T.Vector3(), _n2 = new T.Vector3(), _zax = new T.Vector3(0, 0, 1), _v = new T.Vector3();

// ---------- the see-saw ----------
const PIV = 0.97, PLANK_TOP = 1.2, PL = 4.1;
export const SEESAW = { PIV, PLANK_TOP, PL, ARM: 3.12, TMAX: Math.asin((PIV + 0.02) / PL) - 0.012, LEVEL: [0, 1.31, 0.645] };
// The plank is a damped spring towards the angle its weights ask for (heavier end down, saturating where the plank
// meets the ground), so it swings, overshoots a little and settles; a hard landing bounces and thumps.
export class SeeSaw {
  constructor() {
    const g = (this.g = new T.Group());
    g.add(part('prop_bal_seesaw', 'prop_bal_seesaw', {}, () => { const b = mesh(geo.box(1.56, 0.84, 1.0), 0xd65a3c, { hull: 1.04 }); b.position.y = 0.42; return b; }));
    g.add(blobShadow(1.0));
    const pivot = (this.pivot = new T.Group());
    pivot.position.y = PIV;
    g.add(pivot);
    const hold = (this.hold = new T.Group());
    hold.position.y = -PIV;
    pivot.add(hold);
    hold.add(part('prop_bal_seesaw', 'plank', {}, () => { const b = mesh(geo.box(8.2, 0.2, 1.32), 0xe5a865, { hull: 1.03 }); b.position.y = 1.1; return b; }));
    hold.add(part('prop_bal_seesaw', 'level', {}));
    // the bubble in the spirit level
    const bub = (this.bubble = mesh(geo.sphere(0.05, 12, 8), 0xffffff, { outline: 0.012 }));
    bub.scale.set(1.5, 0.95, 0.5);
    bub.position.set(0, SEESAW.LEVEL[1], SEESAW.LEVEL[2]);
    hold.add(bub);
    this.seats = [-1, 1].map((s) => { const o = new T.Group(); o.position.set(s * SEESAW.ARM, PLANK_TOP, 0); hold.add(o); return o; });
    this.theta = 0; this.omega = 0; this.acc = 0;
    this.W = 7.5; this.zeta = 0.32;
    this.sense = 0.3;          // this much more weight on one end tips it right down
    this.tol = 0;              // weight difference that counts as balanced (the plank then settles dead level)
    this.onBump = null;        // (side -1 left / 1 right, speed)
    this.lastBump = 0;
  }
  get balanced() { return Math.abs(this.theta) < 0.02 && Math.abs(this.omega) < 0.2; }
  // positive theta = left end down
  step(dt, mL, mR) {
    const d = mL - mR;
    let tgt = (d / this.sense) * SEESAW.TMAX;
    if (Math.abs(d) <= this.tol) tgt = 0;
    const n = 4, h = Math.min(dt, 0.05) / n;
    for (let i = 0; i < n; i++) {
      const acc = this.W * this.W * (tgt - this.theta) - 2 * this.zeta * this.W * this.omega;
      this.acc = acc;
      this.omega += acc * h;
      this.theta += this.omega * h;
      const lim = SEESAW.TMAX;
      if (Math.abs(this.theta) > lim) {
        const s = Math.sign(this.theta);
        this.theta = s * lim;
        if (this.omega * s > 0) {
          const sp = Math.abs(this.omega);
          this.omega = -this.omega * 0.3;
          const now = performance.now();
          if (sp > 0.35 && now - this.lastBump > 160 && this.onBump) { this.lastBump = now; this.onBump(s > 0 ? -1 : 1, sp); }
        }
      }
    }
    this.pivot.rotation.z = this.theta;
    // the bubble floats to the high end
    const bx = Math.max(-0.3, Math.min(0.3, -this.theta * 2.4));
    this.bubble.position.x += (bx - this.bubble.position.x) * Math.min(1, dt * 10);
  }
  kick(v) { this.omega += v; }
}

// ---------- the home-screen icon: the see-saw tipped down under a full pail of sand, an empty one up high ----------
export function makeBalanceIcon() {
  const g = new T.Group();
  const ss = new SeeSaw();
  ss.g.scale.setScalar(0.4);
  ss.pivot.rotation.z = SEESAW.TMAX * 0.9;
  g.add(ss.g);
  const full = new Pail(0xff5a5a, 1.0), empty = new Pail(0x3f8cff, 1.0);
  full.set(1, 'sand');
  full.tick(0, 0);
  ss.seats[0].add(full.g);
  ss.seats[1].add(empty.g);
  for (const p of [full, empty]) { p.g.scale.setScalar(1.75); p.g.position.x = (p === full ? 1 : -1) * 0.25; }
  return g;
}
