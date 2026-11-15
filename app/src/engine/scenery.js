// Shared scenery pieces: meadow, hills, clouds, trees, flowers.
import * as T from '../three.js';
import { mesh, geo, toon, blobShadow } from './toon.js';
import { C } from './actors.js';

export function makeMeadow({ ground = 0x8fdc6c, hills = [0x7cc95c, 0x6ab84f] } = {}) {
  const g = new T.Group();
  const floor = new T.Mesh(geo.cyl(40, 40, 1, 48), toon(ground));
  floor.position.y = -0.5;
  g.add(floor);
  const hillSpots = [[-14, -24, 9, hills[0]], [6, -28, 12, hills[1]], [22, -22, 8, hills[0]], [-28, -20, 7, hills[1]]];
  for (const [x, z, r, col] of hillSpots) {
    const h = mesh(geo.sphere(1, 24, 12), col, { outline: 0.02 });
    h.scale.set(r * 1.6, r * 0.55, r);
    h.position.set(x, -0.5, z);
    g.add(h);
  }
  for (let i = 0; i < 5; i++) g.add(makeCloud(-16 + i * 8 + (i % 2) * 2, 9 + (i % 3), -20 - (i % 2) * 4, 1 + (i % 3) * 0.3));
  // scatter flowers
  const cols = [C.pink, C.yellow, 0xffffff, C.purple];
  for (let i = 0; i < 16; i++) {
    const f = makeFlower(cols[i % cols.length]);
    const a = i * 2.4;
    f.position.set(Math.cos(a) * (7 + (i % 5) * 2.2), 0, -3 - (i % 4) * 2.5 + Math.sin(a) * 1.5);
    g.add(f);
  }
  addGrass(g, 0x6fc24f, 160, 26, -1.5);
  addPatches(g, 0x7fcf5e, 18);
  g.add(makeSun(-15, 12.5, -44));
  // a far tree line on the hills
  for (let i = 0; i < 9; i++) {
    const t = makeTree(0.9 + (i % 3) * 0.25, i % 2 ? 0x4fb456 : 0x63c25a);
    t.position.set(-24 + i * 6 + (i % 2) * 1.5, 0, -15 - (i % 3) * 2);
    g.add(t);
  }
  g.userData.clouds = g.children.filter((c) => c.userData.cloud);
  g.userData.sway = g.children.filter((c) => c.userData.flower);
  return g;
}

// Instanced grass tufts: lots of detail for one draw call. Kept out of the front play area.
export function addGrass(g, color, n, spread, zMax) {
  const geom = new T.ConeGeometry(0.09, 0.42, 4);
  geom.translate(0, 0.21, 0);
  const im = new T.InstancedMesh(geom, toon(color), n * 3);
  const m = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), v = new T.Vector3(), sc = new T.Vector3();
  let k = 0, seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < n; i++) {
    const x = (rnd() * 2 - 1) * spread, z = -rnd() * 14 + zMax + (Math.abs(x) > 9 ? 6 : 0);
    for (let j = 0; j < 3; j++) {
      e.set((rnd() - 0.5) * 0.5, rnd() * 3, (j - 1) * 0.45);
      q.setFromEuler(e);
      const h = 0.7 + rnd() * 0.7;
      m.compose(v.set(x + (j - 1) * 0.07, 0, z), q, sc.set(1, h, 1));
      im.setMatrixAt(k++, m);
    }
  }
  im.frustumCulled = false;
  g.add(im);
  return im;
}

// Flat darker patches break up the flat ground colour.
export function addPatches(g, color, n) {
  for (let i = 0; i < n; i++) {
    const p = new T.Mesh(geo.circle(1, 20), toon(color));
    p.rotation.x = -Math.PI / 2;
    const a = i * 2.39;
    p.position.set(Math.cos(a) * (4 + (i % 6) * 3.4), 0.012 + i * 0.0004, -1 - (i % 5) * 2.6 + Math.sin(a) * 2);
    p.scale.set(1.6 + (i % 3) * 0.9, 0.9 + (i % 2) * 0.5, 1);
    g.add(p);
  }
}

// Sun with a soft glowing halo.
let haloTex = null;
export function makeSun(x, y, z, col = 0xfff1a0) {
  const g = new T.Group();
  const disc = new T.Mesh(geo.sphere(2.2, 24, 16), new T.MeshBasicMaterial({ color: col, fog: false }));
  if (!haloTex) {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const x2 = c.getContext('2d');
    const r = x2.createRadialGradient(64, 64, 10, 64, 64, 64);
    r.addColorStop(0, 'rgba(255,250,210,0.9)'); r.addColorStop(0.35, 'rgba(255,240,180,0.35)'); r.addColorStop(1, 'rgba(255,240,180,0)');
    x2.fillStyle = r; x2.fillRect(0, 0, 128, 128);
    haloTex = new T.CanvasTexture(c);
  }
  const halo = new T.Sprite(new T.SpriteMaterial({ map: haloTex, transparent: true, depthWrite: false, fog: false, blending: T.AdditiveBlending }));
  halo.scale.setScalar(13);
  g.add(halo, disc);
  g.position.set(x, y, z);
  g.userData.sun = halo;
  return g;
}

export function makeCloud(x, y, z, s = 1) {
  const c = new T.Group();
  for (const [dx, dy, r] of [[0, 0, 1.2], [1.2, -0.2, 0.9], [-1.2, -0.25, 0.85], [0.5, 0.6, 0.8]]) {
    const p = mesh(geo.sphere(r, 16, 12), 0xffffff, { outline: 0.03 });
    p.position.set(dx, dy, 0);
    c.add(p);
  }
  c.position.set(x, y, z);
  c.scale.setScalar(s);
  c.userData.cloud = true;
  return c;
}

export function makeTree(s = 1, leaf = C.leaf) {
  const t = new T.Group();
  const trunk = mesh(geo.cyl(0.25, 0.35, 2, 12), C.trunk, { outline: 0.03 });
  trunk.position.y = 1;
  const top = mesh(geo.sphere(1.3, 18, 14), leaf, { outline: 0.04 });
  top.position.y = 2.6;
  const top2 = mesh(geo.sphere(0.9, 16, 12), leaf, { outline: 0.035 });
  top2.position.set(0.8, 2.2, 0.2);
  const top3 = mesh(geo.sphere(0.85, 16, 12), leaf, { outline: 0.035 });
  top3.position.set(-0.8, 2.25, 0.1);
  t.add(trunk, top, top2, top3, blobShadow(1.2));
  t.scale.setScalar(s);
  t.userData.top = top;
  return t;
}

export function makeFlower(col) {
  const f = new T.Group();
  const stem = new T.Mesh(geo.cyl(0.03, 0.03, 0.5, 6), toon(0x3f9e3f));
  stem.position.y = 0.25;
  const head = mesh(geo.sphere(0.14, 10, 8), col, { outline: 0.015 });
  head.position.y = 0.52;
  const mid = new T.Mesh(geo.sphere(0.07, 8, 6), toon(C.yellow));
  mid.position.set(0, 0.54, 0.1);
  // petals around the centre
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const pt = new T.Mesh(geo.sphere(0.09, 8, 6), toon(col));
    pt.position.set(Math.cos(a) * 0.12, 0.52 + Math.sin(a) * 0.12, 0.04);
    f.add(pt);
  }
  f.add(stem, head, mid);
  f.userData.flower = true;
  f.userData.ph = Math.random() * 6;
  return f;
}

export function driftClouds(meadow, dt) {
  for (const c of meadow.userData.clouds || []) {
    c.position.x += dt * 0.25;
    if (c.position.x > 26) c.position.x = -26;
  }
}

// ---------- world themes ----------
export function makeScenery(theme = 'meadow') {
  return theme === 'beach' ? makeBeach() : theme === 'farm' ? makeFarm() : makeMeadow();
}
export function animateScenery(g, dt, t) {
  driftClouds(g, dt);
  for (const f of g.userData.sway || []) f.rotation.z = Math.sin(t * 1.1 + f.userData.ph) * 0.07;
  if (g.userData.blades) g.userData.blades.rotation.z += dt * (g.userData.bladeSpeed || 0.6);
  for (const b of g.userData.flies || []) {
    const u = b.userData, k = t * u.sp + u.ph;
    b.position.set(u.cx + Math.sin(k) * u.rx, u.cy + Math.sin(k * 2.3) * 0.5, u.cz + Math.cos(k * 0.7) * u.rz);
    b.rotation.y = Math.atan2(Math.cos(k) * u.rx, -Math.sin(k * 0.7) * u.rz);
    u.wl.rotation.z = Math.sin(t * 16 + u.ph) * 0.9; u.wr.rotation.z = -u.wl.rotation.z;
  }
  if (g.userData.ripple) {
    const r = g.userData.ripple, p = (t % 4) / 4;
    r.scale.setScalar(1 + p * 0.8); r.material.opacity = 0.6 * (1 - p);
  }
  if (g.userData.sunHalo) g.userData.sunHalo.material.rotation = t * 0.05;
  for (const w of g.userData.waves || []) {
    w.position.z = w.userData.z0 + Math.sin(t * 0.9 + w.userData.ph) * 0.35;
    w.scale.x = w.userData.sx * (1 + Math.sin(t * 1.3 + w.userData.ph) * 0.08);
  }
  for (const p of g.userData.palms || []) p.rotation.z = Math.sin(t * 0.8 + p.userData.ph) * 0.03;
}

export function makePalm(s = 1, ph = 0) {
  const p = new T.Group();
  let y = 0, x = 0;
  for (let i = 0; i < 6; i++) {
    const seg = mesh(geo.cyl(0.2 - i * 0.015, 0.24 - i * 0.015, 0.75, 10), 0xb07a4a, { outline: 0.025 });
    seg.position.set(x, y + 0.37, 0);
    seg.rotation.z = -0.08 * i;
    p.add(seg);
    y += 0.72; x += 0.07 * i;
  }
  const top = new T.Group();
  top.position.set(x, y + 0.1, 0);
  for (let i = 0; i < 7; i++) {
    const leaf = mesh(geo.sphere(0.5, 12, 8), 0x3fbf5a, { outline: 0.025 });
    leaf.scale.set(2.6, 0.18, 0.7);
    const a = (i / 7) * Math.PI * 2;
    leaf.position.set(Math.cos(a) * 1.0, -0.25, Math.sin(a) * 1.0);
    leaf.rotation.y = -a;
    leaf.rotation.z = -0.35;
    // tilt each leaf downward away from the trunk
    const holder = new T.Group();
    holder.add(leaf);
    holder.rotation.y = 0;
    top.add(holder);
  }
  for (let i = 0; i < 3; i++) {
    const nut = mesh(geo.sphere(0.2, 10, 8), 0x7a5230, { outline: 0.02 });
    nut.position.set(Math.cos(i * 2.1) * 0.25, -0.3, Math.sin(i * 2.1) * 0.25 + 0.15);
    top.add(nut);
  }
  p.add(top, blobShadow(1.1));
  p.scale.setScalar(s);
  p.userData.ph = ph;
  return p;
}

function makeShell(col) {
  const s = mesh(geo.sphere(0.18, 12, 8), col, { outline: 0.015 });
  s.scale.set(1, 0.45, 0.9);
  s.position.y = 0.04;
  return s;
}

export function makeStarfish(col = 0xff8a5c, r = 0.35) {
  const sh = new T.Shape();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    i ? sh.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : sh.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  sh.closePath();
  const g = new T.ExtrudeGeometry(sh, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 1 });
  g.userData.shared = false;
  return mesh(g, col, { hull: 1.08 });
}

export function makeBeach() {
  const g = new T.Group();
  const sand = new T.Mesh(geo.cyl(40, 40, 1, 48), toon(0xf6dc9b));
  sand.position.y = -0.5;
  g.add(sand);
  // the sea: a big flat band behind the beach, with a foamy edge
  const sea = new T.Mesh(geo.box(120, 0.2, 40), toon(0x3fb6e0));
  sea.position.set(0, 0.0, -26);
  const shallow = new T.Mesh(geo.box(120, 0.2, 3), toon(0x7fd8ee));
  shallow.position.set(0, 0.02, -7.5);
  g.add(sea, shallow);
  const waves = [];
  for (let i = 0; i < 9; i++) {
    const w = mesh(geo.sphere(1, 16, 8), 0xffffff, { outline: 0.02 });
    w.userData = { sx: 2.2 + (i % 3) * 0.6, z0: -6.1, ph: i * 0.9 };
    w.scale.set(w.userData.sx, 0.12, 0.35);
    w.position.set(-20 + i * 5, 0.1, -6.1);
    g.add(w); waves.push(w);
  }
  // a little island far away
  const island = mesh(geo.sphere(1, 20, 10), 0xf0cf86, { outline: 0.02 });
  island.scale.set(5, 1.2, 2.5);
  island.position.set(13, -0.3, -30);
  const ipalm = makePalm(1.6, 2);
  ipalm.position.set(13, 0.6, -30);
  g.add(island, ipalm);
  // sun
  g.add(makeSun(-16, 13, -45));
  const palms = [];
  for (const [x, z, s, ph] of [[-9.5, -3, 1.3, 0], [10, -2.5, 1.15, 1.5], [-12, -5, 1, 3]]) {
    const p = makePalm(s, ph);
    p.position.set(x, 0, z);
    g.add(p); palms.push(p);
  }
  for (let i = 0; i < 4; i++) g.add(makeCloud(-16 + i * 10, 10 + (i % 2), -26, 0.9));
  // shells and starfish scattered on the sand
  const cols = [0xffc1d6, 0xffffff, 0xffd9a8, 0xd8b6ff];
  for (let i = 0; i < 12; i++) {
    const a = i * 2.3;
    const x = Math.cos(a) * (8 + (i % 4) * 2.4), z = -2 - (i % 4) * 1.2 + Math.sin(a);
    const sh = i % 4 === 0 ? makeStarfish(0xff8a5c, 0.3) : makeShell(cols[i % cols.length]);
    if (i % 4 === 0) { sh.rotation.x = -Math.PI / 2; sh.position.y = 0.06; }
    sh.position.x = x; sh.position.z = z;
    g.add(sh);
  }
  g.userData.clouds = g.children.filter((c) => c.userData.cloud);
  g.userData.waves = waves;
  g.userData.palms = palms;
  return g;
}

// ---------- World 3: the farm ----------
function box(w, h, d, col, x, y, z, o = 0.025) { const m = mesh(geo.box(w, h, d), col, { hull: o ? 1 + o : 0, outline: 0 }); m.position.set(x, y, z); return m; }

export function makeBarn() {
  const g = new T.Group();
  g.add(box(5, 3.6, 4, 0xd94f3d, 0, 1.8, 0, 0.012));
  // roof: two tilted slabs
  for (const s of [-1, 1]) {
    const r = box(3.1, 0.25, 4.4, 0x8a3b2e, s * 1.3, 4.25, 0, 0.02);
    r.rotation.z = -s * 0.62;
    g.add(r);
  }
  // doors with a white X
  g.add(box(2.4, 2.4, 0.12, 0xb43c2f, 0, 1.2, 2.02, 0.01));
  for (const s of [-1, 1]) { const b = box(3.2, 0.2, 0.06, 0xfff6e6, 0, 1.2, 2.1, 0); b.rotation.z = s * 0.79; g.add(b); }
  g.add(box(2.6, 0.2, 0.06, 0xfff6e6, 0, 2.45, 2.1, 0));
  const loft = new T.Mesh(geo.circle(0.45, 20), toon(0x4a2a24));
  loft.position.set(0, 3.25, 2.02);
  g.add(loft, box(1.2, 0.12, 0.06, 0xfff6e6, 0, 3.25, 2.06, 0));
  g.add(blobShadow(3.4));
  return g;
}

export function makeSilo() {
  const g = new T.Group();
  const c = mesh(geo.cyl(1.1, 1.1, 5, 20), 0xe9e4d8, { outline: 0.02 }); c.position.y = 2.5;
  const cap = mesh(geo.sphere(1.15, 20, 10), 0xb9c4cc, { outline: 0.02 }); cap.position.y = 5; cap.scale.y = 0.7;
  for (let i = 0; i < 3; i++) { const b = mesh(geo.torus(1.12, 0.05, Math.PI * 2, 6, 24), 0xb9c4cc, { outline: 0 }); b.rotation.x = Math.PI / 2; b.position.y = 1 + i * 1.5; g.add(b); }
  g.add(c, cap, blobShadow(1.4));
  return g;
}

export function makeWindmill() {
  const g = new T.Group();
  const tower = mesh(geo.cyl(0.35, 0.7, 6, 12), 0xfff6e6, { outline: 0.02 }); tower.position.y = 3;
  const hub = new T.Group(); hub.position.set(0, 6.1, 0.6);
  const cap = mesh(geo.sphere(0.35, 12, 10), 0xd94f3d, { outline: 0.02 });
  hub.add(cap);
  for (let i = 0; i < 4; i++) {
    const arm = new T.Group(); arm.rotation.z = (i * Math.PI) / 2;
    const blade = box(0.6, 2.4, 0.06, 0xfff6e6, 0, 1.5, 0, 0.03);
    arm.add(blade); hub.add(arm);
  }
  g.add(tower, hub);
  g.userData.blades = hub;
  return g;
}

export function makeFence(len = 20, col = 0xfff6e6) {
  const g = new T.Group();
  const n = Math.round(len / 1.6);
  for (let i = 0; i <= n; i++) {
    const p = mesh(geo.box(0.2, 1.3, 0.2), col, { hull: 1.06 }); p.position.set(-len / 2 + i * (len / n), 0.65, 0);
    g.add(p);
  }
  for (const y of [0.45, 0.95]) g.add(box(len, 0.14, 0.08, col, 0, y, 0.1, 0.004));
  return g;
}

export function makeHay(s = 1) {
  const g = new T.Group();
  const h = mesh(geo.cyl(0.7, 0.7, 1.1, 18), 0xf0c648, { outline: 0.025 });
  h.rotation.z = Math.PI / 2; h.position.y = 0.7;
  for (const x of [-0.3, 0.3]) { const b = mesh(geo.torus(0.71, 0.04, Math.PI * 2, 6, 20), 0xc99a2e, { outline: 0 }); b.rotation.y = Math.PI / 2; b.position.set(x, 0.7, 0); g.add(b); }
  g.add(h, blobShadow(0.9));
  g.scale.setScalar(s);
  return g;
}

export function makeSunflower(h = 2.2) {
  const f = new T.Group();
  const stem = mesh(geo.cyl(0.06, 0.08, h, 6), 0x4f9e3a, { outline: 0.012 }); stem.position.y = h / 2;
  const head = new T.Group(); head.position.set(0, h, 0.05);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const pt = mesh(geo.sphere(0.2, 10, 8), 0xffd23f, { outline: 0.012 });
    pt.scale.set(0.55, 1.15, 0.3); pt.position.set(Math.cos(a) * 0.36, Math.sin(a) * 0.36, 0); pt.rotation.z = a - Math.PI / 2;
    head.add(pt);
  }
  const disc = mesh(geo.sphere(0.27, 14, 10), 0x7a4a26, { outline: 0.015 }); disc.scale.z = 0.4; disc.position.z = 0.05;
  head.add(disc);
  const leaf = mesh(geo.sphere(0.25, 10, 8), 0x58c45e, { outline: 0.012 }); leaf.scale.set(1.4, 0.3, 0.7); leaf.position.set(0.25, h * 0.45, 0); leaf.rotation.z = 0.4;
  f.add(stem, head, leaf);
  f.userData.flower = true; f.userData.ph = Math.random() * 6;
  return f;
}

function makeButterfly(col, cx, cy, cz) {
  const b = new T.Group();
  const wl = new T.Group(), wr = new T.Group();
  for (const [w, s] of [[wl, -1], [wr, 1]]) {
    const m = new T.Mesh(geo.sphere(0.2, 8, 6), toon(col, { side: T.DoubleSide }));
    m.scale.set(1.1, 0.15, 0.9); m.position.x = s * 0.2;
    w.add(m); b.add(w);
  }
  const body = new T.Mesh(geo.cyl(0.03, 0.03, 0.3, 5), toon(0x3a2838)); body.rotation.x = Math.PI / 2;
  b.add(body);
  b.userData = { wl, wr, cx, cy, cz, rx: 3 + Math.random() * 2, rz: 1.5, sp: 0.35 + Math.random() * 0.2, ph: Math.random() * 6 };
  return b;
}

export function makeFarm() {
  const g = new T.Group();
  const floor = new T.Mesh(geo.cyl(40, 40, 1, 48), toon(0x9bd45a));
  floor.position.y = -0.5;
  g.add(floor);
  for (const [x, z, r, col] of [[-16, -26, 9, 0x86c44e], [6, -30, 12, 0xe8c95a], [24, -24, 8, 0x86c44e], [-30, -22, 7, 0xe8c95a]]) {
    const h = mesh(geo.sphere(1, 24, 12), col, { outline: 0.02 });
    h.scale.set(r * 1.6, r * 0.55, r); h.position.set(x, -0.5, z);
    g.add(h);
  }
  // dirt path across the front
  const path = new T.Mesh(geo.box(60, 0.02, 2.6), toon(0xd9a66b));
  path.position.set(0, 0.01, 4.4);
  g.add(path);
  const barn = makeBarn(); barn.position.set(-9.5, 0, -9); barn.rotation.y = 0.3; g.add(barn);
  const silo = makeSilo(); silo.position.set(-5.6, 0, -11); g.add(silo);
  const mill = makeWindmill(); mill.position.set(11, 0, -12); mill.rotation.y = -0.3; g.add(mill);
  const fence = makeFence(34); fence.position.set(0, 0, -4.2); g.add(fence);
  for (const [x, z, s] of [[8.6, -2.8, 1], [10.1, -3.3, 0.85], [9.2, -2.2, 0.7]]) { const h = makeHay(s); h.position.set(x, 0, z); h.rotation.y = x * 0.3; g.add(h); }
  // wheat rows on the far field
  for (let i = 0; i < 28; i++) {
    const w = mesh(geo.cone(0.18, 1.1, 6), 0xe8c95a, { outline: 0.012 });
    w.position.set(-3 + (i % 14) * 1.1, 0.55, -7 - Math.floor(i / 14) * 1.2);
    w.userData.flower = true; w.userData.ph = i * 0.4;
    g.add(w);
  }
  for (const [x, z] of [[-12.5, -2.5], [-11.4, -3.1], [12.6, -1.5], [13.6, -2.4]]) { const f = makeSunflower(2 + (x % 2) * 0.3); f.position.set(x, 0, z); g.add(f); }
  // pond
  const pond = new T.Mesh(geo.circle(2.2, 28), toon(0x6fd0f0)); pond.rotation.x = -Math.PI / 2; pond.scale.set(1.5, 0.8, 1); pond.position.set(5.5, 0.02, -7);
  const rim = new T.Mesh(geo.circle(2.5, 28), toon(0xb9e98a)); rim.rotation.x = -Math.PI / 2; rim.scale.set(1.5, 0.8, 1); rim.position.set(5.5, 0.015, -7);
  const ripple = new T.Mesh(new T.RingGeometry(0.6, 0.75, 24), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 }));
  ripple.rotation.x = -Math.PI / 2; ripple.position.set(5.5, 0.04, -7);
  g.add(rim, pond, ripple);
  addGrass(g, 0x7cc04a, 140, 26, -1.5);
  addPatches(g, 0x8cc952, 14);
  g.add(makeSun(14, 13, -44));
  for (let i = 0; i < 5; i++) g.add(makeCloud(-18 + i * 9, 9.5 + (i % 3), -22 - (i % 2) * 4, 0.9 + (i % 3) * 0.25));
  const flies = [makeButterfly(0xff8fc0, -4, 2.6, -3), makeButterfly(0xffd23f, 5, 3, -2.5)];
  g.add(...flies);
  g.userData.clouds = g.children.filter((c) => c.userData.cloud);
  g.userData.sway = g.children.filter((c) => c.userData.flower);
  g.userData.blades = mill.userData.blades;
  g.userData.flies = flies;
  g.userData.ripple = ripple;
  return g;
}
