// My day: little effects — running water, soap foam, soap bubbles you can pop, water drops, mess splats on paws
// (paint, mud, jam), toothpaste foam, a sneeze puff, Zzz and night stars. Bubbles, foam and splats come from the old
// Splash wash game.
import * as T from '../three.js';
import { mesh, geo, toonUnique, basic } from '../engine/toon.js';
import { makeWaterDrop } from '../engine/beach.js';

// ---------------- running water ----------------
// A soft see-through stream from a spout down to `floorY`, with a shiny core and a splash ring where it lands.
// set(on) eases it in / out; update(dt, t) wobbles it.
const streamMat = new T.MeshBasicMaterial({ color: 0x8fdcff, transparent: true, opacity: 0.55, depthWrite: false });
const coreMat = new T.MeshBasicMaterial({ color: 0xe8fbff, transparent: true, opacity: 0.7, depthWrite: false });
streamMat.userData.shared = coreMat.userData.shared = true;
export function makeStream(top, floorY, r = 0.07) {
  const g = new T.Group();
  g.position.copy(top);
  const len = Math.max(0.05, top.y - floorY);
  const col = new T.Mesh(new T.CylinderGeometry(r, r * 1.25, 1, 14, 1, true), streamMat);
  col.geometry.translate(0, -0.5, 0);
  const core = new T.Mesh(new T.CylinderGeometry(r * 0.35, r * 0.45, 1, 8, 1, true), coreMat);
  core.geometry.translate(0, -0.5, 0);
  core.position.x = -r * 0.3;
  const ring = new T.Mesh(new T.TorusGeometry(r * 2.2, r * 0.45, 6, 18), streamMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -len + 0.02;
  g.add(col, core, ring);
  g.userData = { col, core, ring, len, amt: 0, want: 0, r };
  col.scale.y = core.scale.y = 0.001;
  ring.visible = false;
  g.userData.set = (on) => { g.userData.want = on ? 1 : 0; };
  g.userData.setLen = (l) => { g.userData.len = l; ring.position.y = -l + 0.02; };
  g.userData.update = (dt, t) => {
    const u = g.userData;
    u.amt += Math.sign(u.want - u.amt) * Math.min(Math.abs(u.want - u.amt), dt * 4);
    const L = u.len * u.amt;
    col.scale.y = core.scale.y = Math.max(0.001, L);
    const w = 1 + Math.sin(t * 40) * 0.06;
    col.scale.x = col.scale.z = w;
    core.scale.x = core.scale.z = 2 - w;
    ring.visible = u.amt > 0.95;
    ring.scale.setScalar(1 + Math.sin(t * 25) * 0.15);
  };
  return g;
}

// ---------------- foam and bubbles ----------------
export function makeFoam(r = 0.09 + Math.random() * 0.08) {
  return mesh(geo.sphere(Math.round(r * 100) / 100, 10, 8), 0xffffff, { outline: 0.012 });
}
// a soap bubble: see-through with a bright rim and a shine (reads as a bubble on any background)
const bubbleBody = new T.MeshBasicMaterial({ color: 0xeaf8ff, transparent: true, opacity: 0.32, depthWrite: false });
const bubbleRim = new T.MeshBasicMaterial({ color: 0x8fd0ff, transparent: true, opacity: 0.75, side: T.BackSide, depthWrite: false });
bubbleBody.userData.shared = bubbleRim.userData.shared = true;
export function makeSoapBubble(r = 0.3) {
  const b = new T.Mesh(geo.sphere(1, 18, 14), bubbleBody);
  const rim = new T.Mesh(geo.sphere(1, 18, 14), bubbleRim); rim.scale.setScalar(1.08);
  const hi = new T.Mesh(geo.sphere(0.22, 8, 6), basic(0xffffff)); hi.position.set(-0.42, 0.42, 0.75); hi.scale.set(1, 0.7, 0.5);
  const hi2 = new T.Mesh(geo.sphere(0.1, 8, 6), basic(0xffffff)); hi2.position.set(0.45, -0.4, 0.8);
  const tint = new T.Mesh(geo.torus(0.93, 0.05, Math.PI * 0.7, 6, 20), basic(0xffb6e6, { transparent: true, opacity: 0.8 }));
  tint.position.z = 0.25; tint.rotation.z = -2.2;
  b.add(rim, hi, hi2, tint);
  b.scale.setScalar(r);
  return b;
}
export const makeDrop = (r = 0.08, col) => makeWaterDrop(r, col);

// ---------------- mess on the paws (flat splats that lie on the fur) ----------------
let layerN = 0;
function messMat(col, layer) {
  return toonUnique(col, { transparent: true, polygonOffset: true, polygonOffsetFactor: -2 - layer * 2, polygonOffsetUnits: -4 - layer * 4 });
}
function splatGeo(outline, R, cx, cy, lift, rings = 4, segs = 32) {
  const pos = [], idx = [];
  pos.push(cx, cy, lift);
  for (let i = 1; i <= rings; i++) {
    const u = i / rings;
    for (let j = 0; j < segs; j++) {
      const t = (j / segs) * Math.PI * 2, r = R * u * outline(t);
      pos.push(cx + Math.cos(t) * r, cy + Math.sin(t) * r, lift - 0.03 * u * u);
    }
  }
  for (let j = 0; j < segs; j++) idx.push(0, 1 + j, 1 + ((j + 1) % segs));
  for (let i = 1; i < rings; i++) for (let j = 0; j < segs; j++) {
    const a = 1 + (i - 1) * segs + j, b = 1 + (i - 1) * segs + ((j + 1) % segs), c = a + segs, d = b + segs;
    idx.push(a, c, d, a, d, b);
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
function blobby(seed, lobes = 6) {
  const ph = seed * 1.7;
  return (t) => 1 + 0.1 * Math.sin(t * 3 + ph) + 0.16 * Math.max(0, Math.sin(t * lobes + ph * 2)) ** 2;
}
function splat(g, { col, rim, R, x = 0, y = 0, seed = 0, lobes = 6, lift = 0.012 }) {
  const out = blobby(seed, lobes);
  const L = layerN; layerN += 2;
  g.add(new T.Mesh(splatGeo((t) => out(t) + 0.12, R, x, y, lift), messMat(rim, L % 12)));
  g.add(new T.Mesh(splatGeo(out, R, x, y, lift + 0.004), messMat(col, (L + 1) % 12)));
}
export const MESS = {
  paint: { cols: [[0xff4b6b, 0xc23050], [0x4a90ff, 0x2f64c0], [0xffd23f, 0xd9a520]] },
  mud: { cols: [[0x7a5030, 0x4a2c14]] },
  jam: { cols: [[0xd0306b, 0x8a0e40]] },
};
// a little mess splat (about 0.5 across) facing +z
export function makeMess(kind, seed = Math.random() * 9) {
  const g = new T.Group();
  const cols = MESS[kind].cols;
  const [c, r] = cols[Math.floor(seed * 7) % cols.length];
  splat(g, { col: c, rim: r, R: 0.2, seed, lobes: kind === 'mud' ? 5 : 7 });
  if (kind === 'paint') { const [c2, r2] = cols[(Math.floor(seed * 7) + 1) % cols.length]; splat(g, { col: c2, rim: r2, R: 0.1, x: 0.12, y: 0.1, seed: seed + 3, lift: 0.02 }); }
  if (kind === 'mud') splat(g, { col: 0x8f6040, rim: 0x6b4423, R: 0.07, x: -0.06, y: 0.05, seed: 2, lift: 0.02 });
  if (kind === 'jam') splat(g, { col: 0xff7aa8, rim: 0xd0306b, R: 0.06, x: -0.06, y: 0.06, seed: 4, lift: 0.02 });
  return g;
}
export function setMessLook(m, p, base = 1) {
  const k = Math.max(0, 1 - p);
  m.scale.setScalar(base * (0.35 + 0.65 * k));
  m.traverse((o) => { if (o.material) o.material.opacity = 0.15 + 0.85 * k; });
}

// ---------------- the sleepy Zzz and the night ----------------
export function makeZ(size = 0.5) {
  const s = new T.Shape();
  s.moveTo(-0.5, 0.5); s.lineTo(0.5, 0.5); s.lineTo(0.5, 0.32); s.lineTo(-0.16, -0.32); s.lineTo(0.5, -0.32); s.lineTo(0.5, -0.5);
  s.lineTo(-0.5, -0.5); s.lineTo(-0.5, -0.32); s.lineTo(0.16, 0.32); s.lineTo(-0.5, 0.32); s.closePath();
  const g = new T.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 2 });
  g.center();
  const m = mesh(g, 0x9fb8ff, { outline: 0.06 });
  m.scale.setScalar(size);
  return m;
}
// a twinkly glowing star (night window, lights-off finale)
export function makeTwinkle(size = 0.2, col = 0xffe27a) {
  const s = new T.Shape();
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2, r = i % 2 ? 0.45 : 1; s[i ? 'lineTo' : 'moveTo'](Math.sin(a) * r, Math.cos(a) * r); }
  const m = new T.Mesh(new T.ShapeGeometry(s), basic(col, { fog: false }));
  m.scale.setScalar(size);
  return m;
}
