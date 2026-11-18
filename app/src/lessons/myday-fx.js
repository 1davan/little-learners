// My day: little effects — running water, soap foam, soap bubbles you can pop, water drops, mess splats on paws
// (paint, mud, jam), toothpaste foam, a sneeze puff, Zzz and night stars. Bubbles, foam and splats come from the old
// Splash wash game.
import * as T from '../three.js';
import { mesh, geo, toon, toonUnique, basic } from '../engine/toon.js';
import { makeWaterDrop } from '../engine/beach.js';

// ---------------- running water ----------------
// A soft see-through ribbon of water from a spout down onto whatever is under it (`floorY`), with a bright wobbling
// core and a little crown of splashes where it lands. set(on) eases it in / out; setLen(l) sets where it lands.
const streamMat = new T.MeshBasicMaterial({ color: 0x7fd2ff, transparent: true, opacity: 0.62, depthWrite: false });
const coreMat = new T.MeshBasicMaterial({ color: 0xf2fcff, transparent: true, opacity: 0.85, depthWrite: false });
const splashMat = new T.MeshBasicMaterial({ color: 0xbfeaff, transparent: true, opacity: 0.85, depthWrite: false });
streamMat.userData.shared = coreMat.userData.shared = splashMat.userData.shared = true;
export function makeStream(top, floorY, r = 0.07) {
  const g = new T.Group();
  g.position.copy(top);
  const len = Math.max(0.05, top.y - floorY);
  const col = new T.Mesh(new T.CylinderGeometry(r * 0.9, r * 1.2, 1, 16, 1, true), streamMat);
  col.geometry.translate(0, -0.5, 0);
  const core = new T.Mesh(new T.CylinderGeometry(r * 0.28, r * 0.36, 1, 8, 1, true), coreMat);
  core.geometry.translate(0, -0.5, 0);
  core.position.set(-r * 0.35, 0, r * 0.4);
  // where it lands: a few little drops jumping out in a ring
  const crown = new T.Group();
  const drops = [];
  for (let i = 0; i < 6; i++) {
    const d = new T.Mesh(new T.SphereGeometry(r * 0.42, 10, 8), splashMat);
    d.userData.a = (i / 6) * Math.PI * 2;
    crown.add(d); drops.push(d);
  }
  crown.position.y = -len;
  g.add(col, core, crown);
  g.userData = { col, core, crown, len, amt: 0, want: 0, r };
  col.scale.y = core.scale.y = 0.001;
  crown.visible = false;
  g.userData.set = (on) => { g.userData.want = on ? 1 : 0; };
  g.userData.setLen = (l) => { g.userData.len = l; crown.position.y = -l; };
  g.userData.update = (dt, t) => {
    const u = g.userData;
    u.amt += Math.sign(u.want - u.amt) * Math.min(Math.abs(u.want - u.amt), dt * 4);
    const L = u.len * u.amt;
    col.scale.y = core.scale.y = Math.max(0.001, L);
    const w = 1 + Math.sin(t * 40) * 0.07;
    col.scale.x = col.scale.z = w;
    core.scale.x = core.scale.z = 2 - w;
    crown.visible = u.amt > 0.9;
    if (crown.visible) for (const d of drops) {
      const ph = (t * 3.2 + d.userData.a * 0.7) % 1;
      const rr = r * (1.2 + 2.2 * ph);
      d.position.set(Math.cos(d.userData.a) * rr, Math.sin(ph * Math.PI) * r * 2.2, Math.sin(d.userData.a) * rr);
      d.scale.setScalar(1 - ph * 0.6);
    }
  };
  return g;
}

// ---------------- bath water ----------------
// The water in the claw-foot tub (prop_md_bath): a soft blue surface with a lighter rim where it meets the tub and a
// couple of shine streaks. setLevel(y) keeps it just inside the tub's inner wall at that height.
export function makeBathWater(rx = 1.9, rz = 0.84) {
  const g = new T.Group();
  const flat = (geo, col, y, opts = {}) => { const m = new T.Mesh(geo, toonUnique(col, opts)); m.rotation.x = -Math.PI / 2; m.position.y = y; g.add(m); return m; };
  flat(new T.CircleGeometry(1, 56), 0x7fd0f5, 0);
  flat(new T.RingGeometry(0.86, 1.0, 56), 0xbfe9fb, 0.004);
  const s1 = flat(new T.CircleGeometry(1, 24), 0xeefaff, 0.008); s1.scale.set(0.32, 0.06, 1); s1.position.set(-0.3, 0.008, -0.25);
  const s2 = flat(new T.CircleGeometry(1, 24), 0xeefaff, 0.008); s2.scale.set(0.16, 0.045, 1); s2.position.set(0.25, 0.008, 0.3);
  // the tub's inner wall radius (fraction of its 2.1 x 0.95 size) at height y, from prop_md_bath's profile
  const inner = (y) => (y < 0.88 ? 0.78 + 0.12 * Math.max(0, (y - 0.64) / 0.24) : 0.9 + 0.035 * Math.min(1, (y - 0.88) / 0.42));
  g.userData.setLevel = (y) => { const k = inner(y) * 0.985; g.scale.set(2.1 * k, 1, 0.95 * k); };
  g.userData.setLevel(0.62);
  g.userData.update = (dt, t) => { s1.position.x = -0.3 + Math.sin(t * 0.7) * 0.06; s2.position.x = 0.25 + Math.sin(t * 0.9 + 1) * 0.05; };
  return g;
}

// ---------------- foam and bubbles ----------------
// a soft puff of foam: a few smooth round blobs melted together, pale blue-white with a little shine (no ink line)
const foamMat = toonUnique(0xf6fbff);
const foamShine = basic(0xffffff);
export function makeFoam(r = 0.09 + Math.random() * 0.08) {
  const g = new T.Group();
  const s = geo.sphere(1, 20, 14);
  for (const [x, y, z, k] of [[0, 0, 0, 1], [0.62, -0.18, 0.05, 0.68], [-0.55, -0.22, 0.1, 0.6], [0.1, 0.42, -0.05, 0.55]]) {
    const m = new T.Mesh(s, foamMat); m.position.set(x * r, y * r, z * r); m.scale.setScalar(r * k); g.add(m);
  }
  const hi = new T.Mesh(geo.sphere(1, 10, 8), foamShine); hi.scale.set(r * 0.22, r * 0.15, r * 0.1); hi.position.set(-r * 0.35, r * 0.45, r * 0.82); g.add(hi);
  return g;
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

// ---------------- mess on the paws: small glossy blobs the size of a paw pad ----------------
export const MESS = {
  paint: { cols: [0xff4b6b, 0x4a90ff, 0xffd23f] },
  mud: { cols: [0x8a5a34, 0x7a4f2c] },
  jam: { cols: [0xd8306b, 0xc22a60] },
};
// one rounded blob (about 0.15 across, facing +z), a soft bulge with a little white shine
export function makeMess(kind, seed = Math.random() * 9) {
  const g = new T.Group();
  const cols = MESS[kind].cols;
  const col = cols[Math.floor(seed * 7) % cols.length];
  const R = 0.075 + 0.015 * Math.sin(seed * 3);
  const mat = toonUnique(col, { transparent: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
  const b = new T.Mesh(geo.sphere(1, 18, 12), mat);
  b.scale.set(R * (1 + 0.15 * Math.sin(seed)), R * (1 - 0.1 * Math.sin(seed)), R * 0.38);
  g.add(b);
  if (kind === 'mud' || kind === 'jam') {   // a second little lump
    const b2 = new T.Mesh(geo.sphere(1, 14, 10), mat);
    b2.scale.set(R * 0.5, R * 0.45, R * 0.3); b2.position.set(R * 0.75, -R * 0.45, 0); g.add(b2);
  }
  const hi = new T.Mesh(geo.sphere(1, 10, 8), toonUnique(0xffffff, { transparent: true }));
  hi.scale.set(R * 0.28, R * 0.18, R * 0.1); hi.position.set(-R * 0.35, R * 0.38, R * 0.32);
  g.add(hi);
  return g;
}
// a ruffled tuft of fur (3 soft spikes fanning out, fur white with the ink line), base at the origin pointing +y
const furMat = toon(0xfffbf7);
export function makeTuft(size = 0.18) {
  const g = new T.Group();
  for (const [a, k] of [[-0.45, 0.8], [0, 1], [0.45, 0.75]]) {
    const m = mesh(geo.sphere(1, 12, 10), 0xfffbf7, { outline: 0.18, mat: furMat });
    m.scale.set(size * 0.22, size * 0.6 * k, size * 0.16);
    m.position.set(Math.sin(a) * size * 0.4, Math.cos(a) * size * 0.45 * k, 0);
    m.rotation.z = -a;
    g.add(m);
  }
  return g;
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
