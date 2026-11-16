// Splash wash helpers: the six kinds of mess, foam puffs, and the little "how it got messy" prop.
import * as T from '../three.js';
import { mesh, geo, toonUnique, toon, basic, blobShadow } from '../engine/toon.js';
import { propModel } from '../engine/prop-models.js';
import { makeWaterDrop, makeSeaStar } from '../engine/beach.js';

export const MESS = {
  sand: { adj: 'Sandy', snd: 'crunch' },
  mud: { adj: 'Muddy', snd: 'thunk' },
  paint: { adj: 'Painty', snd: 'pop' },
  jam: { adj: 'Jammy', snd: 'chomp' },
  grass: { adj: 'Grassy', snd: 'rustle' },
  choc: { adj: 'Chocolatey', snd: 'mmm' },
};
const PAINT = [0xff4b6b, 0x4a90ff, 0xffd23f, 0x5fd068, 0xa77bff, 0xff9f3f];

// ---- the mess: flat organic splats that hug the body ----
// Each splat is a polar grid (centre + rings) whose outline wobbles into lobes and drips. Its vertices are bent onto
// the body's surface with `curve` (a quadratic fitted under the spot by wash.js: z = a x² + b x + c y² + d y in the
// spot's own frame, whose +z is the surface normal), so it lies on the fur like paint instead of floating like a disc.
// A darker copy just behind each splat is its soft cartoon rim. Everything fades together (setMessLook).
const FLAT = { a: 0, b: 0, c: 0, d: 0 };
let layerN = 0;
function messMat(col, layer) {
  return toonUnique(col, { transparent: true, polygonOffset: true, polygonOffsetFactor: -2 - layer * 2, polygonOffsetUnits: -4 - layer * 4 });
}
function surfZ(cv, x, y) {
  const z = cv.a * x * x + cv.b * x + cv.c * y * y + cv.d * y;
  return Math.max(-0.5, Math.min(0.2, z));
}
// outline(t) -> radius multiplier for angle t; (cx, cy) centre; R radius; lift above the surface
function splatGeo(outline, R, cx, cy, cv, lift, rings = 5, segs = 40) {
  const pos = [], idx = [];
  pos.push(cx, cy, surfZ(cv, cx, cy) + lift);
  for (let i = 1; i <= rings; i++) {
    const u = i / rings;
    for (let j = 0; j < segs; j++) {
      const t = (j / segs) * Math.PI * 2, r = R * u * outline(t);
      const x = cx + Math.cos(t) * r, y = cy + Math.sin(t) * r;
      pos.push(x, y, surfZ(cv, x, y) + lift);
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
// a lobed, drippy outline (seeded so each splat differs)
function blobby(seed, lobes = 6, drip = 0) {
  const ph = seed * 1.7;
  return (t) => {
    let k = 1 + 0.1 * Math.sin(t * 3 + ph) + 0.16 * Math.max(0, Math.sin(t * lobes + ph * 2)) ** 2;
    if (drip) k += drip * Math.max(0, Math.cos(t + Math.PI / 2 + Math.sin(ph) * 0.4)) ** 12; // a drip running down (-y)
    return k;
  };
}
// splat + its darker rim, added to g
function splat(g, cv, { col, rim, R, x = 0, y = 0, seed = 0, lobes = 6, drip = 0, lift = 0.012 }) {
  const out = blobby(seed, lobes, drip);
  const L = layerN; layerN += 2;
  if (rim !== null) g.add(new T.Mesh(splatGeo((t) => out(t) * 1.0 + 0.09, R, x, y, cv, lift, 4, 40), messMat(rim ?? new T.Color(col).multiplyScalar(0.72).getHex(), L % 12)));
  g.add(new T.Mesh(splatGeo(out, R, x, y, cv, lift + 0.004, 5, 40), messMat(col, (L + 1) % 12)));
}
// a little flat detail (grain, seed, sprinkle, leaf, shine) lying on the splat
function fleck(g, cv, { col, x, y, rx, ry, rot = 0, lift = 0.024, pointy = 0 }) {
  const m = new T.Mesh(splatGeo((t) => {
    const k = pointy ? 1 / (1 + pointy * Math.abs(Math.sin(t))) : 1;
    const c = Math.cos(t - rot), s2 = Math.sin(t - rot);
    return k / Math.sqrt((c * c) / (rx * rx) + (s2 * s2) / (ry * ry));
  }, 1, x, y, cv, lift, 2, 16), messMat(col, 11));
  g.add(m);
}

export function makeMess(kind, cv = FLAT) {
  const g = new T.Group();
  const rnd = (() => { let s = 7 + kind.length * 13 + Math.floor(Math.random() * 1000); return () => ((s = (s * 9301 + 49297) % 233280) / 233280); })();
  if (kind === 'sand') {
    splat(g, cv, { col: 0xe6c283, rim: 0xc99a55, R: 0.36, seed: rnd() * 9, lobes: 7 });
    for (let i = 0; i < 14; i++) {
      const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * 0.32;
      fleck(g, cv, { col: i % 3 ? 0xb8863f : 0xfff3d6, x: Math.cos(a) * r * 1.2, y: Math.sin(a) * r, rx: 0.028 + rnd() * 0.02, ry: 0.024 + rnd() * 0.015, rot: rnd() * 3 });
    }
  } else if (kind === 'mud') {
    splat(g, cv, { col: 0x6b4423, rim: 0x4a2c14, R: 0.36, seed: rnd() * 9, lobes: 5, drip: 0.75 });
    splat(g, cv, { col: 0x6b4423, rim: 0x4a2c14, R: 0.08, x: 0.46, y: 0.16, seed: 2, lift: 0.01 });
    splat(g, cv, { col: 0x6b4423, rim: 0x4a2c14, R: 0.06, x: -0.44, y: 0.2, seed: 5, lift: 0.01 });
    fleck(g, cv, { col: 0x8f6040, x: -0.1, y: 0.1, rx: 0.12, ry: 0.07, rot: 0.4 });
    fleck(g, cv, { col: 0xb48a62, x: -0.13, y: 0.13, rx: 0.045, ry: 0.025, rot: 0.4, lift: 0.03 });
  } else if (kind === 'paint') {
    const cols = PAINT.slice().sort(() => rnd() - 0.5);
    for (let i = 0; i < 3; i++) {
      const a = i * 2.1 + 0.4;
      splat(g, cv, { col: cols[i], rim: null, R: 0.21 - i * 0.02, x: Math.cos(a) * 0.15, y: Math.sin(a) * 0.12, seed: i * 2 + rnd() * 3, lobes: 7, drip: i === 0 ? 0.6 : 0, lift: 0.012 + i * 0.006 });
      for (let k = 0; k < 2; k++) {
        const b = a + (k - 0.5) * 1.2, d = 0.36 + k * 0.06;
        fleck(g, cv, { col: cols[i], x: Math.cos(b) * d, y: Math.sin(b) * d * 0.85, rx: 0.035 - k * 0.008, ry: 0.035 - k * 0.008 });
      }
    }
  } else if (kind === 'jam') {
    splat(g, cv, { col: 0xc2185b, rim: 0x8a0e40, R: 0.34, seed: rnd() * 9, lobes: 6, drip: 0.6 });
    fleck(g, cv, { col: 0xff7aa8, x: -0.12, y: 0.1, rx: 0.12, ry: 0.06, rot: 0.5 });
    fleck(g, cv, { col: 0xffd0e4, x: -0.15, y: 0.13, rx: 0.05, ry: 0.025, rot: 0.5, lift: 0.03 });
    for (let i = 0; i < 6; i++) fleck(g, cv, { col: 0xffe08a, x: -0.2 + i * 0.09, y: ((i * 7) % 3) * 0.07 - 0.1, rx: 0.018, ry: 0.03, rot: i, lift: 0.03 });
  } else if (kind === 'grass') {
    splat(g, cv, { col: 0x8fcf55, rim: 0x5a9e34, R: 0.33, seed: rnd() * 9, lobes: 5 });
    for (let i = 0; i < 5; i++) {
      const a = i * 1.25 + rnd(), r = 0.1 + rnd() * 0.12;
      fleck(g, cv, { col: i % 2 ? 0x3f8f2e : 0x58b43a, x: Math.cos(a) * r, y: Math.sin(a) * r * 0.8, rx: 0.13, ry: 0.045, rot: a + 0.6, pointy: 0.6, lift: 0.03 });
    }
  } else { // chocolate with sprinkles
    splat(g, cv, { col: 0x5a3220, rim: 0x3a1f12, R: 0.35, seed: rnd() * 9, lobes: 6, drip: 0.65 });
    fleck(g, cv, { col: 0x8a5a3c, x: -0.12, y: 0.12, rx: 0.11, ry: 0.06, rot: 0.4 });
    for (let i = 0; i < 8; i++) {
      const a = rnd() * Math.PI * 2, r = 0.05 + rnd() * 0.2;
      fleck(g, cv, { col: PAINT[i % PAINT.length], x: Math.cos(a) * r, y: Math.sin(a) * r, rx: 0.05, ry: 0.016, rot: rnd() * 3, lift: 0.03 });
    }
  }
  return g;
}

export function setMessLook(m, p, base = 1) {
  const k = Math.max(0, 1 - p);
  m.scale.setScalar(base * (0.35 + 0.65 * k));
  m.traverse((o) => { if (o.material) o.material.opacity = 0.2 + 0.8 * k; });
}

export function makeFoam() {
  const r = 0.09 + Math.random() * 0.08;
  return mesh(geo.sphere(Math.round(r * 100) / 100, 10, 8), 0xffffff, { outline: 0.012 });
}

// a little prop beside the friend that shows where the mess came from (Blender models; code fallbacks below)
const CAUSE = { sand: 'prop_sandpile', mud: 'prop_mud', paint: 'prop_paintpot', jam: 'prop_jamjar', grass: 'prop_grass', choc: 'prop_icecream' };
export function makeCause(kind) {
  const g = new T.Group();
  const col = PAINT[Math.floor(Math.random() * PAINT.length)];
  const pm = propModel(CAUSE[kind], kind === 'paint' ? { tint: col } : kind === 'choc' ? { tint: 0x6a3a22, size: 0.85 } : { size: kind === 'mud' ? 0.6 : kind === 'grass' ? 0.9 : 0.75 });
  if (pm) {
    if (kind === 'choc') { // dropped on the sand: the cone sticks up, the scoop melts into a brown puddle
      pm.rotation.z = 1.75; pm.position.set(0.05, 0.27, 0);
      const puddle = new T.Group();
      splat(puddle, FLAT, { col: 0x5a3220, rim: 0x3a1f12, R: 0.42, seed: 3, lobes: 5, lift: 0 });
      puddle.rotation.x = -Math.PI / 2; puddle.position.set(-0.25, 0.012, 0.1);
      g.add(puddle);
    }
    g.add(pm, blobShadow(0.7));
    return g;
  }
  if (kind === 'sand') {
    const pile = mesh(geo.sphere(0.8, 16, 10), 0xe8c787, { outline: 0.025 }); pile.scale.set(1.2, 0.45, 1); pile.position.y = 0.05;
    const handle = mesh(geo.cyl(0.05, 0.05, 0.9, 8), 0xff5a5a, { outline: 0.012 }); handle.position.set(0.2, 0.75, 0); handle.rotation.z = -0.5;
    const blade = mesh(geo.box(0.32, 0.36, 0.06), 0xffd23f, { hull: 1.08 }); blade.position.set(0.02, 0.35, 0); blade.rotation.z = -0.5;
    g.add(pile, handle, blade);
  } else if (kind === 'mud') {
    const rim = new T.Mesh(geo.circle(1.0, 24), toon(0x8a5a34)); rim.rotation.x = -Math.PI / 2; rim.position.y = 0.025; rim.scale.set(1.4, 0.9, 1);
    const pud = new T.Mesh(geo.circle(0.82, 24), toon(0x6b4423)); pud.rotation.x = -Math.PI / 2; pud.position.y = 0.035; pud.scale.set(1.4, 0.9, 1);
    for (const [x, z] of [[-0.4, 0.1], [0.45, -0.15]]) { const b = mesh(geo.sphere(0.12, 10, 8), 0x5a3a20, { outline: 0.012 }); b.scale.y = 0.5; b.position.set(x, 0.06, z); g.add(b); }
    g.add(rim, pud);
  } else if (kind === 'paint') {
    const pot = mesh(geo.cyl(0.42, 0.38, 0.6, 18), 0xfff6e6, { outline: 0.025 }); pot.position.y = 0.3;
    const col = PAINT[Math.floor(Math.random() * PAINT.length)];
    const top = new T.Mesh(geo.circle(0.39, 18), toon(col)); top.rotation.x = -Math.PI / 2; top.position.y = 0.605;
    const drip = mesh(geo.sphere(0.09, 8, 6), col, { outline: 0.01 }); drip.scale.set(1, 2, 0.6); drip.position.set(0.1, 0.42, 0.38);
    const brush = mesh(geo.cyl(0.04, 0.04, 0.9, 8), 0xa0623a, { outline: 0.012 }); brush.position.set(-0.1, 0.8, 0); brush.rotation.z = 0.35;
    const tip = mesh(geo.cone(0.08, 0.2, 8), col, { outline: 0.01 }); tip.position.set(0.05, 1.28, 0); tip.rotation.z = 0.35;
    const splat = new T.Mesh(geo.circle(0.3, 14), toon(col)); splat.rotation.x = -Math.PI / 2; splat.position.set(0.55, 0.02, 0.35);
    g.add(pot, top, drip, brush, tip, splat);
  } else if (kind === 'jam') {
    const jar = mesh(geo.cyl(0.36, 0.36, 0.7, 18), 0xc2185b, { outline: 0.025 }); jar.position.y = 0.35;
    const lid = mesh(geo.cyl(0.4, 0.4, 0.14, 18), 0xffffff, { outline: 0.02 }); lid.position.set(0.45, 0.07, 0.2); lid.rotation.z = 1.3;
    const label = new T.Mesh(geo.cyl(0.365, 0.365, 0.28, 18, true), toon(0xfff1c9)); label.position.y = 0.36;
    const berry = mesh(geo.sphere(0.1, 10, 8), 0xff3b5c, { outline: 0.01 }); berry.position.set(0, 0.36, 0.37);
    const spill = new T.Mesh(geo.circle(0.32, 14), toon(0xc2185b)); spill.rotation.x = -Math.PI / 2; spill.position.set(-0.45, 0.02, 0.3);
    g.add(jar, label, berry, lid, spill);
  } else if (kind === 'grass') {
    for (let i = 0; i < 7; i++) {
      const b = mesh(geo.cone(0.09, 0.7 + (i % 3) * 0.2, 6), i % 2 ? 0x58b43a : 0x7fc24a, { outline: 0.01 });
      b.position.set(-0.5 + i * 0.17, 0.35, (i % 2) * 0.15); b.rotation.z = (i - 3) * 0.12; g.add(b);
    }
    const fl = mesh(geo.sphere(0.13, 10, 8), 0xff8fc0, { outline: 0.012 }); fl.position.set(0.2, 0.95, 0.1);
    const mid = mesh(geo.sphere(0.06, 8, 6), 0xffd23f, { outline: 0 }); mid.position.set(0.2, 0.95, 0.2);
    g.add(fl, mid);
  } else { // ice-cream cone dropped on the ground
    const cone = mesh(geo.cone(0.25, 0.7, 12), 0xe0a860, { outline: 0.02 }); cone.position.set(0, 0.3, 0); cone.rotation.z = 1.9;
    const scoop = mesh(geo.sphere(0.3, 14, 10), 0x5a3220, { outline: 0.02 }); scoop.position.set(0.42, 0.22, 0); scoop.scale.y = 0.75;
    const splat = new T.Mesh(geo.circle(0.35, 14), toon(0x5a3220)); splat.rotation.x = -Math.PI / 2; splat.position.set(0.5, 0.02, 0.1);
    g.add(cone, scoop, splat);
  }
  g.add(blobShadow(0.7));
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

export function makeDrop() {
  return makeWaterDrop(0.085);
}

// a crumb of mess (rigid body) that falls off while scrubbing: a lumpy clod (sand, mud, choc, jam), a paint drop
// or a little leaf (grass). Lumps share a few cached geometries.
const CRUMB = { sand: [0xe0b878, 0xfff6e0], mud: [0x6b4423, 0x8a5a34], paint: PAINT, jam: [0xc2185b, 0xff3b5c], grass: [0x58b43a, 0x7fc24a], choc: [0x5a3220, 0x8a5a3c] };
const lumpGeos = [0, 1, 2].map((v) => {
  const g = new T.IcosahedronGeometry(1, 2);
  const p = g.attributes.position, q = new T.Vector3();
  for (let i = 0; i < p.count; i++) {
    q.fromBufferAttribute(p, i);
    const k = 1 + 0.16 * Math.sin(q.x * 3.1 + v * 2) * Math.cos(q.y * 2.7 + v) + 0.1 * Math.sin(q.z * 4.3 + v * 3);
    q.multiplyScalar(k); p.setXYZ(i, q.x, q.y, q.z);
  }
  g.computeVertexNormals();
  g.userData.shared = true;
  return g;
});
const leafGeo = (() => {
  const sh = new T.Shape();
  sh.moveTo(-1, 0); sh.quadraticCurveTo(0, 0.75, 1, 0); sh.quadraticCurveTo(0, -0.75, -1, 0);
  const g = new T.ExtrudeGeometry(sh, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 2, curveSegments: 8 });
  g.center(); g.userData.shared = true;
  return g;
})();
export function makeCrumb(kind) {
  const cols = CRUMB[kind] || CRUMB.sand;
  const col = cols[Math.floor(Math.random() * cols.length)];
  const r = 0.07 + Math.random() * 0.05;
  let m;
  if (kind === 'grass') { m = mesh(leafGeo, col, { outline: 0.1 }); m.scale.set(r * 1.4, r * 1.4, r * 1.4); }
  else if (kind === 'paint') { m = makeWaterDrop(r * 0.9, col); }
  else { m = mesh(lumpGeos[Math.floor(Math.random() * 3)], col, { outline: 0.12 }); m.scale.set(r, r * 0.78, r); }
  const g = new T.Group();
  g.add(m);
  g.userData.r = r * 0.9;
  return g;
}

// where the sponge rests, one per level: a flat rock / a wooden tub with a rubber duck / a rock under a beach shower.
// userData.statics = physics boxes [cx, cy, cz, sx, sy, sz] (world) so a dropped sponge lands on it.
export function makeStation(level, home) {
  const g = new T.Group();
  const statics = [];
  if (level === 1) {
    const tub = new T.Group();
    const water = new T.Mesh(geo.circle(1.08, 24), toon(0x7fd8ee));
    water.rotation.x = -Math.PI / 2; water.position.y = 0.96;
    const shine = new T.Mesh(geo.ring(0.55, 0.62, 24, 1), basic(0xc4f1fb));
    shine.rotation.x = -Math.PI / 2; shine.position.set(0.25, 0.965, -0.1);
    let duck = propModel('prop_duckie', { size: 0.5 });   // a rubber duck bobbing in the tub
    if (duck) { duck.rotation.y = -0.6; duck.position.set(-0.55, 0.93, 0.3); }
    else {
      duck = new T.Group();
      const db = mesh(geo.sphere(0.24, 12, 10), 0xffd23f, { outline: 0.015 }); db.scale.set(1.2, 0.8, 1);
      const dh = mesh(geo.sphere(0.15, 10, 8), 0xffd23f, { outline: 0.012 }); dh.position.set(0.18, 0.2, 0);
      duck.add(db, dh);
      duck.position.set(-0.6, 1.02, 0.3);
    }
    const tm = propModel('prop_tub'); // Blender wooden tub
    if (tm) tub.add(tm, water, shine, duck);
    else {
      const wall = mesh(geo.cyl(1.15, 0.95, 0.95, 24), 0xb9783a, { outline: 0.03 });
      wall.position.y = 0.48;
      tub.add(wall, water, duck);
    }
    tub.position.set(home.x, 0, home.z);
    const sh = blobShadow(1.2);
    sh.position.set(home.x, 0.02, home.z);
    g.add(tub, sh);
    g.userData.duck = duck;
    statics.push([home.x, 0.48, home.z, 2.1, 0.96, 2.1]);
  } else {
    const rm = propModel('prop_rock', { tint: 0xb7b2a6, size: [0.88, 0.56, 0.8] });
    if (rm) { rm.position.set(home.x, 0, home.z); rm.rotation.y = 0.15; g.add(rm); }
    else {
      const rock = mesh(geo.sphere(1, 16, 10), 0xb7b2a6, { outline: 0.03 });
      rock.scale.set(1.1, 0.45, 0.8);
      rock.position.set(home.x, 0.2, home.z);
      g.add(rock);
    }
    statics.push([home.x, 0.33, home.z, 2.0, 0.66, 1.4]);
    if (level === 2) { // a beach shower post behind
      const sm = propModel('prop_shower'); // Blender beach shower (post foot at the old post's foot)
      if (sm) { sm.position.set(6.4, 0, -0.8); g.add(sm); }
      else {
        const post = mesh(geo.cyl(0.1, 0.1, 4.2, 10), 0xffffff, { outline: 0.015 });
        post.position.set(6.4, 2.1, -0.8);
        const head = mesh(geo.cone(0.35, 0.3, 16), 0x4a90ff, { outline: 0.015 });
        head.position.set(5.45, 3.95, -0.8);
        g.add(post, head);
      }
      g.userData.rose = new T.Vector3(5.45, 3.5, -0.8);   // where the shower water comes out
    }
  }
  g.userData.statics = statics;
  return g;
}
