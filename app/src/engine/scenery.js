// Shared scenery pieces and the three world sceneries, each in three looks (Level 1/2/3):
//   meadow: spring · autumn (falling leaves, pumpkins) · winter (snow, snowman, snowflakes)
//   beach:  noon · sunset (sailboat, lanterns) · starry night (smiling moon, fireflies, jellyfish, bonfire)
//   farm:   spring · harvest (pumpkins, scarecrow, apple tree) · rainy day (rainbow, rain, puddles)
//   dressup: hat shop street (awning, hat windows, bunting) · dressing room (curtains, bulb mirror, clothes rail)
//            · cosy room with a rainy window (coat pegs, wellies, armchair)
//   build:  sunny sandpit site (crane, digger, sand heaps) · brick yard at golden hour (pallets, cement mixer)
//            · night site (stars, moon, tall work lights, blinking lamps)
// Play areas (x -6..6, z -2..4) are kept clear; animated extras are instanced / Points so they stay cheap.
import * as T from '../three.js';
import { mesh, geo, toon, toonUnique, blobShadow, basic, INK } from './toon.js';
import { C } from './actors.js';
import { makeDuck } from './beach.js';
import { garmentProp, hasCreature } from './creature.js';
import { propModel } from './prop-models.js';

let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const rr = (a, b) => a + rnd() * (b - a);

// ---------- textures (made once, shared) ----------
function canvasTex(size, draw) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.userData.shared = true;
  return t;
}
let _glow = null, _star = null;
function glowTex() {
  return _glow || (_glow = canvasTex(64, (x, n) => {
    const r = x.createRadialGradient(n / 2, n / 2, 1, n / 2, n / 2, n / 2);
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.25, 'rgba(255,255,255,0.6)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = r; x.fillRect(0, 0, n, n);
  }));
}
function starTex() {
  return _star || (_star = canvasTex(64, (x, n) => {
    const r = x.createRadialGradient(32, 32, 1, 32, 32, 30);
    r.addColorStop(0, 'rgba(255,250,210,0.9)'); r.addColorStop(1, 'rgba(255,250,210,0)');
    x.fillStyle = r; x.fillRect(0, 0, n, n);
    x.fillStyle = '#fffbe0'; x.beginPath();
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 - Math.PI / 2, d = i % 2 ? 9 : 22; x.lineTo(32 + Math.cos(a) * d, 32 + Math.sin(a) * d); }
    x.closePath(); x.fill();
  }));
}
// A soft additive glow sprite (lanterns, fire, jellyfish, moon).
export function glow(col, s = 1, opacity = 0.8) {
  const sp = new T.Sprite(new T.SpriteMaterial({ map: glowTex(), color: col, transparent: true, opacity, depthWrite: false, fog: false, blending: T.AdditiveBlending }));
  sp.scale.setScalar(s);
  return sp;
}
const glowMat = (col, o = {}) => new T.MeshBasicMaterial({ color: col, fog: false, ...o });
// top half of a sphere (not cached: each caller owns it)
const dome = (r, w = 16, h = 8) => new T.SphereGeometry(r, w, h, 0, Math.PI * 2, 0, Math.PI / 2);
const bowl = (r, w = 16, h = 8) => new T.SphereGeometry(r, w, h, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);

// ---------- Blender-built nature scenery (tools/blender/creatures/prop_*.py) ----------
// Scenery is on screen all the time and in dozens, so each model layer becomes a plain static mesh that shares the
// loaded geometry (no skeleton, no per-frame cost): one toon draw + one ink outline per layer. Colour variants tint a
// layer (its white vertex paint multiplied by the material colour). Null when the model isn't built, so every maker
// keeps its code-built fallback.
const _parts = new Map();
function propPart(kind, layer) {
  const key = kind + '/' + layer;
  if (!_parts.has(key) && hasCreature(kind)) {
    const gp = garmentProp(kind, layer === 'skin' ? kind : layer);
    const m = gp && gp.children[0].children.find((o) => o.isMesh && !o.userData.outline);
    _parts.set(key, m ? { geometry: m.geometry, pos: m.position.clone(), quat: m.quaternion.clone(), scale: m.scale.clone() } : null);
  }
  return _parts.get(key) || null;
}
// unlit: for the sky (sun, moon, rainbow): flat glowing colour and an ink line the fog doesn't wash out
const _skyInk = new Map();
function skyInk(th) {
  if (!_skyInk.has(th)) {
    const m = new T.MeshBasicMaterial({ color: INK, side: T.BackSide, fog: false });
    m.onBeforeCompile = (s) => { s.vertexShader = s.vertexShader.replace('#include <begin_vertex>', `vec3 transformed = position + normal * ${th.toFixed(4)};`); };
    m.customProgramCacheKey = () => 'sky-ink' + th;
    m.userData.shared = true;
    _skyInk.set(th, m);
  }
  return _skyInk.get(th);
}
function natPart(kind, layer = 'skin', { tint = 0xffffff, outline = 0.03, unlit = false } = {}) {
  const p = propPart(kind, layer);
  if (!p) return null;
  let m;
  if (unlit) {
    m = new T.Mesh(p.geometry, basic(tint, { vertexColors: true, fog: false }));
    if (outline) { const o = new T.Mesh(p.geometry, skyInk(outline)); o.userData.outline = true; m.add(o); }
  } else m = mesh(p.geometry, tint, { outline, mat: toon(tint, { vertexColors: true }) });
  m.position.copy(p.pos); m.quaternion.copy(p.quat); m.scale.copy(p.scale);
  return m;
}
// stable pseudo-random variant pick from a position, so a scene looks the same every visit
const natPick = (n, ...k) => Math.abs(Math.round(k.reduce((a, v, i) => a + v * (3.7 + i * 5.3), 0))) % n;

// ---------- ground ----------
export function makeMeadow({ ground = 0x8fdc6c, hills = [0x7cc95c, 0x6ab84f], grass = 0x6fc24f, patch = 0x7fcf5e,
  flowers = [C.pink, C.yellow, 0xffffff, C.purple], trees = [0x4fb456, 0x63c25a], snow = false, sun = true, cloud = 0xffffff } = {}) {
  const g = new T.Group();
  g.userData.anim = [];
  const floor = new T.Mesh(geo.cyl(40, 40, 1, 48), toon(ground));
  floor.position.y = -0.5;
  g.add(floor);
  // hills sit behind the tree line (front edges at z <= -15.6) so no tree stands half-buried in one
  const hillSpots = [[-14, -24.8, 9, hills[0]], [6, -28, 12, hills[1]], [22, -23.8, 8, hills[0]], [-28, -22.8, 7, hills[1]]];
  for (const [x, z, r, col] of hillSpots) {
    const h = mesh(hillGeom(), col, { outline: 0.02 });
    h.scale.set(r * 1.6, r * 0.55, r);
    h.position.set(x, -0.5, z);
    g.add(h);
  }
  for (let i = 0; i < 5; i++) g.add(makeCloud(-16 + i * 8 + (i % 2) * 2, 9 + (i % 3), -20 - (i % 2) * 4, 1 + (i % 3) * 0.3, cloud));
  // scatter flowers
  if (flowers) for (let i = 0; i < 16; i++) {
    const f = makeFlower(flowers[i % flowers.length]);
    const a = i * 2.4;
    f.position.set(Math.cos(a) * (7 + (i % 5) * 2.2), 0, -3 - (i % 4) * 2.5 + Math.sin(a) * 1.5);
    g.add(f);
  }
  if (grass) addGrass(g, grass, 160, 26, -1.5);
  addPatches(g, patch, 18);
  if (sun) g.add(makeSun(-23, 10.5, -44));
  const hillFront = (x) => hillSpots.reduce((z, [hx, hz, r]) => {
    const k = 1 - ((x - hx) / (r * 1.6)) ** 2;
    return k > 0 ? Math.max(z, hz + r * Math.sqrt(k)) : z;
  }, -99);
  // a far tree line along the foot of the hills (in winter every other tree is a snowy pine), on the flat ground
  for (let i = 0; i < 9; i++) {
    const s = 0.82 + (i % 3) * 0.2;
    const pine = snow && i % 2;
    const t = pine ? makePine(s * 1.1, true) : makeTree(s, trees[i % trees.length], { snow });
    // keep the whole crown / skirt in front of the hill rims (the hills only start rising behind it)
    const x = -24 + i * 6, back = pine ? 1.75 * s : 1.75 * s, half = pine ? 1.7 * s : 1.75 * s;
    const rim = Math.max(...[-1, -0.5, 0, 0.5, 1].map((k) => hillFront(x + k * half)));
    t.position.set(x, 0, Math.max(-13.4 - (i % 2) * 1.1, rim + back));
    g.add(t);
  }
  g.userData.clouds = g.children.filter((c) => c.userData.cloud);
  g.userData.sway = g.children.filter((c) => c.userData.flower);
  return g;
}

// Rolling hills: a smooth dome (only the top half shows above the ground), shared by every hill.
let _hill = null;
function hillGeom() {
  if (!_hill) { _hill = new T.SphereGeometry(1, 56, 14, 0, Math.PI * 2, 0, Math.PI / 2); _hill.userData.shared = true; }
  return _hill;
}

// Grass: soft tufts of three curved, tapering blades, darker at the root (vertex colour), one instanced draw call for
// the whole meadow. Kept out of the front play area.
let _tuft = null;
function tuftGeom() {
  if (_tuft) return _tuft;
  const pos = [], col = [], idx = [];
  const S = 3; // rings per blade, then the tip
  for (const [x0, z0, lean, yaw, h, w] of [[-0.08, 0.015, -0.6, 0.5, 0.32, 0.08], [0.0, -0.01, 0.1, 1.4, 0.42, 0.09], [0.085, 0.01, 0.65, -0.5, 0.3, 0.075]]) {
    const b0 = pos.length / 3;
    const ux = Math.cos(yaw), uz = Math.sin(yaw), vx = -uz, vz = ux;
    const axis = [];
    for (let i = 0; i < S; i++) {
      const t = i / S, cx = x0 + Math.sin(lean) * h * t * t, cy = h * t, hw = w * (1 - t * 0.75), th = hw * 0.45;
      axis.push([cx, cy, z0]);
      for (const [a, b] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
        pos.push(cx + a * hw * ux + b * th * vx, cy, z0 + a * hw * uz + b * th * vz);
        const c = 0.6 + 0.4 * t; col.push(c, c, c);
      }
    }
    pos.push(x0 + Math.sin(lean) * h, h, z0); col.push(1, 1, 1);
    axis.push([x0 + Math.sin(lean) * h, h, z0]);
    const tip = b0 + S * 4;
    const tri = (a, b, c, ring) => {
      // wind every face outward from the blade's axis
      const P = (k) => pos.slice(k * 3, k * 3 + 3);
      const [pa, pb, pc] = [P(a), P(b), P(c)];
      const n = new T.Vector3(pb[0] - pa[0], pb[1] - pa[1], pb[2] - pa[2]).cross(new T.Vector3(pc[0] - pa[0], pc[1] - pa[1], pc[2] - pa[2]));
      const ax = axis[ring], out = new T.Vector3((pa[0] + pb[0] + pc[0]) / 3 - ax[0], 0, (pa[2] + pb[2] + pc[2]) / 3 - ax[2]);
      if (n.dot(out) < 0) idx.push(a, c, b); else idx.push(a, b, c);
    };
    for (let i = 0; i < S; i++) for (let k = 0; k < 4; k++) {
      const a = b0 + i * 4 + k, b = b0 + i * 4 + ((k + 1) % 4);
      if (i < S - 1) { tri(a, b, b + 4, i); tri(a, b + 4, a + 4, i); } else tri(a, b, tip, i);
    }
  }
  _tuft = new T.BufferGeometry();
  _tuft.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  _tuft.setAttribute('color', new T.Float32BufferAttribute(col, 3));
  _tuft.setIndex(idx);
  _tuft.computeVertexNormals();
  _tuft.userData.shared = true;
  return _tuft;
}
export function addGrass(g, color, n, spread, zMax) {
  const im = new T.InstancedMesh(tuftGeom(), toon(color, { vertexColors: true }), n);
  const m = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), v = new T.Vector3(), sc = new T.Vector3();
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < n; i++) {
    const x = (rnd() * 2 - 1) * spread, z = -rnd() * 14 + zMax + (Math.abs(x) > 9 ? 6 : 0);
    e.set((rnd() - 0.5) * 0.25, rnd() * Math.PI * 2, (rnd() - 0.5) * 0.2);
    q.setFromEuler(e);
    const h = 0.75 + rnd() * 0.65, w = 0.9 + rnd() * 0.45;
    m.compose(v.set(x, 0, z), q, sc.set(w, h, w));
    im.setMatrixAt(i, m);
  }
  // static, so it keeps normal frustum culling (three bounds the instances); one draw call either way
  g.add(im);
  return im;
}

// Soft organic darker patches break up the flat ground colour (one instanced draw call).
let _patch = null;
function patchGeom() {
  if (_patch) return _patch;
  const sh = new T.Shape();
  for (let i = 0; i <= 30; i++) {
    const a = (i / 30) * Math.PI * 2, r = 1 + 0.1 * Math.sin(3 * a + 0.7) + 0.06 * Math.sin(5 * a + 2.1);
    if (i) sh.lineTo(Math.cos(a) * r, Math.sin(a) * r); else sh.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  _patch = new T.ShapeGeometry(sh);
  _patch.rotateX(-Math.PI / 2);
  _patch.userData.shared = true;
  return _patch;
}
export function addPatches(g, color, n) {
  const im = new T.InstancedMesh(patchGeom(), toon(color), n);
  const m = new T.Matrix4(), q = new T.Quaternion(), v = new T.Vector3(), sc = new T.Vector3(), up = new T.Vector3(0, 1, 0);
  for (let i = 0; i < n; i++) {
    const a = i * 2.39;
    q.setFromAxisAngle(up, i * 0.9);
    m.compose(v.set(Math.cos(a) * (4 + (i % 6) * 3.4), 0.012 + i * 0.0004, -1 - (i % 5) * 2.6 + Math.sin(a) * 2), q, sc.set(1.6 + (i % 3) * 0.9, 1, 0.9 + (i % 2) * 0.5));
    im.setMatrixAt(i, m);
  }
  g.add(im);
  return im;
}

// Sun with a soft glowing halo.
let haloTex = null;
export function makeSun(x, y, z, col = 0xfff1a0, { halo: hcol = 0xffffff, haloSize = 13, size = 1 } = {}) {
  const g = new T.Group();
  const disc = new T.Mesh(geo.sphere(2.2, 24, 16), new T.MeshBasicMaterial({ color: col, fog: false }));
  if (!haloTex) {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const x2 = c.getContext('2d');
    const r = x2.createRadialGradient(64, 64, 10, 64, 64, 64);
    r.addColorStop(0, 'rgba(255,250,210,0.9)'); r.addColorStop(0.35, 'rgba(255,240,180,0.35)'); r.addColorStop(1, 'rgba(255,240,180,0)');
    x2.fillStyle = r; x2.fillRect(0, 0, 128, 128);
    haloTex = new T.CanvasTexture(c);
    haloTex.userData.shared = true;
  }
  const halo = new T.Sprite(new T.SpriteMaterial({ map: haloTex, color: hcol, transparent: true, depthWrite: false, fog: false, blending: T.AdditiveBlending }));
  halo.scale.setScalar(haloSize);
  const toy = natPart('prop_scene_sun', 'skin', { tint: col, unlit: true, outline: 0.09 });
  if (toy) {
    // the Blender sun: a puffy disc with a happy face and a ring of soft rays that turns very slowly
    const rays = natPart('prop_scene_sun', 'rays', { tint: col, unlit: true, outline: 0.08 });
    const spin = new T.Group();
    spin.add(rays);
    rays.onBeforeRender = () => { spin.rotation.z = performance.now() * 0.00006; };
    const body = new T.Group();
    body.add(spin, toy, natPart('prop_scene_sun', 'face', { unlit: true, outline: 0 }));
    body.scale.setScalar(size * 0.86);
    halo.position.z = -1.2; // behind the disc, so the additive glow never washes over its ink line
    g.add(halo, body);
  } else {
    disc.scale.setScalar(size);
    g.add(halo, disc);
  }
  g.position.set(x, y, z);
  g.userData.sun = halo;
  return g;
}

// A big, friendly full moon with a sleepy smile.
export function makeMoon(x, y, z, s = 1) {
  const g = new T.Group();
  const toy = natPart('prop_scene_moon', 'skin', { unlit: true, outline: 0.09 });
  if (toy) {
    const glows = [glow(0xbfd0ff, 16, 0.55), glow(0xfff2c0, 8, 0.5)];
    for (const gl of glows) gl.position.z = -1.2; // behind the disc, so they never wash over its ink line
    g.add(...glows, toy, natPart('prop_scene_moon', 'face', { unlit: true, outline: 0 }));
    g.position.set(x, y, z);
    g.scale.setScalar(s);
    g.userData.moon = true;
    return g;
  }
  const disc = new T.Mesh(geo.sphere(2.4, 28, 18), glowMat(0xfff4c4));
  g.add(glow(0xbfd0ff, 16, 0.55), glow(0xfff2c0, 8, 0.5), disc);
  const ink = glowMat(0x6a5a7a);
  for (const sx of [-1, 1]) {
    const eye = new T.Mesh(geo.torus(0.36, 0.09, Math.PI, 6, 14), ink); // closed happy eyes ⌒
    eye.position.set(sx * 0.85, 0.35, 2.3);
    g.add(eye);
    const cheek = new T.Mesh(geo.circle(0.38, 18), glowMat(0xffb6c4));
    cheek.position.set(sx * 1.35, -0.35, 2.32);
    g.add(cheek);
  }
  const smile = new T.Mesh(geo.torus(0.6, 0.1, Math.PI, 6, 18), ink);
  smile.rotation.z = Math.PI; smile.position.set(0, -0.25, 2.33);
  for (const [cx, cy, r] of [[-1.2, 1.3, 0.35], [1.4, 1.0, 0.25], [0.5, 1.65, 0.2]]) {
    const crater = new T.Mesh(geo.circle(r, 16), glowMat(0xf3e2a6)); crater.position.set(cx, cy, 2.2); g.add(crater);
  }
  g.add(smile);
  g.position.set(x, y, z);
  g.scale.setScalar(s);
  g.userData.moon = true;
  return g;
}

export function makeCloud(x, y, z, s = 1, col = 0xffffff) {
  const c = new T.Group();
  const pm = natPart('prop_scene_cloud', ['skin', 'b', 'c'][natPick(3, x, y)], { tint: col, outline: 0.032 });
  if (pm) c.add(pm);
  else for (const [dx, dy, r] of [[0, 0, 1.2], [1.2, -0.2, 0.9], [-1.2, -0.25, 0.85], [0.5, 0.6, 0.8]]) {
    const p = mesh(geo.sphere(r, 16, 12), col, { outline: 0.03 });
    p.position.set(dx, dy, 0);
    c.add(p);
  }
  c.position.set(x, y, z);
  c.scale.setScalar(s);
  c.userData.cloud = true;
  return c;
}

// Round tree. opts.snow puts white caps on the leaves; opts.apples hangs red apples.
export function makeTree(s = 1, leaf = C.leaf, { snow = false, apples = 0 } = {}) {
  const t = new T.Group();
  const crown = natPart('prop_scene_tree', 'leaves', { tint: leaf, outline: 0.035 });
  if (crown) {
    t.add(natPart('prop_scene_tree', 'skin'), crown, blobShadow(1.2));
    if (snow) t.add(natPart('prop_scene_tree', 'snow', { outline: 0.025 }));
    if (apples) t.add(natPart('prop_scene_tree', 'apples', { outline: 0.02 }));
    t.scale.setScalar(s);
    t.userData.top = crown;
    return t;
  }
  const trunk = mesh(geo.cyl(0.25, 0.35, 2, 12), C.trunk, { outline: 0.03 });
  trunk.position.y = 1;
  const top = mesh(geo.sphere(1.3, 18, 14), leaf, { outline: 0.04 });
  top.position.y = 2.6;
  const top2 = mesh(geo.sphere(0.9, 16, 12), leaf, { outline: 0.035 });
  top2.position.set(0.8, 2.2, 0.2);
  const top3 = mesh(geo.sphere(0.85, 16, 12), leaf, { outline: 0.035 });
  top3.position.set(-0.8, 2.25, 0.1);
  t.add(trunk, top, top2, top3, blobShadow(1.2));
  if (snow) {
    for (const [b, r] of [[top, 1.3], [top2, 0.9], [top3, 0.85]]) {
      const cap = mesh(dome(r * 0.86), 0xffffff, { outline: 0 });
      cap.position.copy(b.position); cap.position.y += r * 0.3;
      cap.scale.set(1.04, 0.62, 1.04);
      t.add(cap);
    }
  }
  for (let i = 0; i < apples; i++) {
    const a = (i / apples) * Math.PI * 1.4 - 0.3;
    const ap = mesh(geo.sphere(0.2, 12, 10), 0xff4b4b, { outline: 0.02 });
    ap.position.set(Math.cos(a) * 1.15, 2.2 + Math.sin(i * 2.3) * 0.5, Math.sin(a) * 0.5 + 0.75);
    t.add(ap);
  }
  t.scale.setScalar(s);
  t.userData.top = top;
  return t;
}

// Stacked-cone pine, optionally with snow on every tier.
export function makePine(s = 1, snow = false) {
  const t = new T.Group();
  const body = natPart('prop_scene_pine', 'skin', { outline: 0.032 });
  if (body) {
    t.add(body, blobShadow(1));
    if (snow) t.add(natPart('prop_scene_pine', 'snow', { outline: 0.022 }));
    t.scale.setScalar(s);
    t.userData.top = body; // isTree() (lessons' calm backdrops) recognises it
    return t;
  }
  const trunk = mesh(geo.cyl(0.2, 0.28, 1, 10), C.trunk, { outline: 0.03 }); trunk.position.y = 0.5;
  t.add(trunk, blobShadow(1));
  [[1.4, 1.6, 1.4], [1.1, 1.4, 2.3], [0.75, 1.2, 3.1]].forEach(([r, h, y]) => {
    const c = mesh(geo.cone(r, h, 14), 0x2f9a62, { outline: 0.035 }); c.position.y = y; t.add(c);
    if (snow) { const cap = mesh(geo.cone(r * 0.62, h * 0.5, 14), 0xffffff, { outline: 0 }); cap.position.y = y + h * 0.26; t.add(cap); }
  });
  t.scale.setScalar(s);
  return t;
}

const FLOWER_KINDS = [['skin', 'daisy_p'], ['tulip', 'tulip_p'], ['prim', 'prim_p']];
let flowerN = 0;
export function makeFlower(col) {
  const f = new T.Group();
  const [sl, pl] = FLOWER_KINDS[flowerN++ % 3];
  const petals = natPart('prop_scene_flower', pl, { tint: col, outline: 0.012 });
  if (petals) {
    f.add(natPart('prop_scene_flower', sl, { outline: 0.01 }), petals);
    f.userData.flower = true;
    f.userData.ph = Math.random() * 6;
    return f;
  }
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

// ---------- seasonal props ----------
export function makePumpkin(s = 1, col = 0xff8a1f) {
  const g = new T.Group();
  const body = natPart('prop_scene_pumpkin', 'body', { tint: col, outline: 0.025 });
  if (body) {
    const k = new T.Group();
    k.add(body, natPart('prop_scene_pumpkin', 'skin', { outline: 0.014 }));
    k.scale.set(0.88, 1, 0.88); k.position.y = -0.03;
    g.add(k, blobShadow(0.5));
    g.scale.setScalar(s);
    return g;
  }
  for (let i = 0; i < 4; i++) {
    const lobe = mesh(geo.sphere(0.5, 16, 12), col, { outline: i ? 0 : 0.03 });
    lobe.scale.set(i ? 0.62 : 1.05, 0.78, i ? 1.05 : 0.95);
    lobe.rotation.y = (i * Math.PI) / 4;
    lobe.position.y = 0.39;
    g.add(lobe);
  }
  const stem = mesh(geo.cyl(0.06, 0.09, 0.28, 8), 0x5c8a2e, { outline: 0.015 }); stem.position.y = 0.82; stem.rotation.z = 0.25;
  const leaf = mesh(geo.sphere(0.13, 8, 6), 0x5fb84a, { outline: 0.012 }); leaf.scale.set(1.5, 0.3, 0.9); leaf.position.set(0.16, 0.78, 0.05);
  g.add(stem, leaf, blobShadow(0.5));
  g.scale.setScalar(s);
  return g;
}

export function makeSnowman(s = 1) {
  const g = new T.Group();
  const snow = natPart('prop_scene_snowman', 'skin', { outline: 0.03 });
  if (snow) {
    snow.position.y -= 0.05; // the bottom snowball is pressed into the ground, not balanced on a point
    const bits = natPart('prop_scene_snowman', 'bits', { outline: 0.02 }); bits.position.y -= 0.05;
    g.add(snow, bits, blobShadow(0.9));
    g.scale.setScalar(s);
    return g;
  }
  [[0.75, 0.68], [0.55, 1.75], [0.42, 2.55]].forEach(([r, y]) => { const b = mesh(geo.sphere(r, 20, 14), 0xffffff, { outline: 0.03 }); b.position.y = y; g.add(b); });
  for (const sx of [-1, 1]) {
    const eye = new T.Mesh(geo.sphere(0.06, 8, 6), toon(INK)); eye.position.set(sx * 0.15, 2.65, 0.37); g.add(eye);
    const arm = mesh(geo.cyl(0.03, 0.04, 0.9, 5), 0x7a5230, { outline: 0.012 }); arm.position.set(sx * 0.82, 1.95, 0); arm.rotation.z = sx * -1.0; g.add(arm);
  }
  for (let i = 0; i < 3; i++) { const btn = new T.Mesh(geo.sphere(0.06, 8, 6), toon(INK)); btn.position.set(0, 1.55 + i * 0.22, 0.53 - Math.abs(i - 1) * 0.02); g.add(btn); }
  const smile = new T.Mesh(geo.torus(0.13, 0.025, Math.PI, 5, 10), toon(INK)); smile.rotation.z = Math.PI; smile.position.set(0, 2.5, 0.39); g.add(smile);
  const nose = mesh(geo.cone(0.07, 0.38, 8), 0xff8a1f, { outline: 0.012 }); nose.rotation.x = Math.PI / 2; nose.position.set(0, 2.56, 0.55); g.add(nose);
  const scarf = mesh(geo.torus(0.42, 0.11, Math.PI * 2, 8, 20), 0xff5a5a, { outline: 0.015 }); scarf.rotation.x = Math.PI / 2; scarf.position.y = 2.2; g.add(scarf);
  const tail = mesh(geo.box(0.22, 0.5, 0.08), 0xff5a5a, { hull: 1.08 }); tail.position.set(0.25, 1.95, 0.42); tail.rotation.z = 0.2; g.add(tail);
  const brim = mesh(geo.cyl(0.42, 0.42, 0.06, 18), 0x3a3550, { outline: 0.015 }); brim.position.y = 2.88;
  const hat = mesh(geo.cyl(0.28, 0.3, 0.45, 18), 0x3a3550, { outline: 0.015 }); hat.position.y = 3.12;
  const band = mesh(geo.cyl(0.305, 0.305, 0.1, 18), 0xff5a5a, { outline: 0 }); band.position.y = 2.97;
  g.add(brim, hat, band, blobShadow(0.9));
  g.scale.setScalar(s);
  return g;
}

// A post with a glowing paper lantern hanging from it.
export function makeLanternPost(col = 0xffb04a, glowAmt = 0.6, h = 2.4) {
  const post = scProp('prop_lanternpost', { arm: { ink: 0.016 } }, { ink: 0.02 });
  if (!post) return makeLanternPostCode(col, glowAmt, h);
  const g = new T.Group();
  post.scale.y = h / 2.4;
  const lan = makeLantern(col, glowAmt); lan.position.set(0.48, h - 0.73, 0);
  g.add(post, lan, blobShadow(0.3));
  g.userData.lantern = lan;
  return g;
}
function makeLanternPostCode(col, glowAmt, h) {
  const g = new T.Group();
  const post = mesh(geo.cyl(0.07, 0.09, h, 8), 0x7a5230, { outline: 0.015 }); post.position.y = h / 2;
  const arm = mesh(geo.box(0.6, 0.06, 0.06), 0x7a5230, { hull: 1.1 }); arm.position.set(0.25, h - 0.05, 0);
  const lan = makeLantern(col, glowAmt); lan.position.set(0.48, h - 0.55, 0);
  g.add(post, arm, lan, blobShadow(0.3));
  g.userData.lantern = lan;
  return g;
}
// A ribbed paper lantern drawn unlit (it glows), dark caps and a tassel; centre at the origin, loop top at y 0.49.
export function makeLantern(col = 0xffb04a, glowAmt = 0.6) {
  const body = scMesh('prop_lantern', 'prop_lantern', { tint: col, glow: true, ink: 0.02 });
  if (!body) return makeLanternCode(col, glowAmt);
  const g = new T.Group();
  g.add(body, scMesh('prop_lantern', 'caps', { ink: 0.014 }));
  if (glowAmt > 0) { const gl = glow(col, 1.8, glowAmt); g.add(gl); g.userData.glow = gl; }
  return g;
}
function makeLanternCode(col, glowAmt) {
  const g = new T.Group();
  const body = new T.Mesh(geo.sphere(0.26, 14, 10), glowMat(col));
  body.scale.y = 1.2;
  const ol = new T.Mesh(geo.sphere(0.26, 14, 10), new T.MeshBasicMaterial({ color: INK, side: T.BackSide }));
  ol.scale.set(1.1, 1.3, 1.1);
  for (const y of [-0.3, 0.3]) { const cap = mesh(geo.cyl(0.13, 0.13, 0.07, 10), 0x5a3a2a, { outline: 0 }); cap.position.y = y; g.add(cap); }
  const string = new T.Mesh(geo.cyl(0.012, 0.012, 0.25, 4), toon(INK)); string.position.y = 0.45;
  g.add(ol, body, string);
  if (glowAmt > 0) { const gl = glow(col, 1.8, glowAmt); g.add(gl); g.userData.glow = gl; }
  return g;
}

// Stones, crossed logs and two unlit flame layers that flicker out of step (userData.anim).
export function makeBonfire() {
  const g = scProp('prop_bonfire', { logs: {} }, { ink: 0.024 });
  if (!g) return makeBonfireCode();
  const flames = ['flame', 'flame2'].map((name) => {
    const piv = new T.Group(); piv.position.y = 0.2;
    const f = scMesh('prop_bonfire', name, { glow: true, ink: 0.012 }); f.position.y -= 0.2;
    piv.add(f); g.add(piv);
    return piv;
  });
  const gl = glow(0xff9a40, 4.5, 0.75); gl.position.y = 0.8;
  g.add(gl, blobShadow(0.9));
  g.userData.anim = (dt, t) => {
    flames.forEach((f, i) => {
      const k = 1 + Math.sin(t * (9 + i * 4) + i) * 0.1 + Math.sin(t * 23 + i * 2) * 0.05;
      f.scale.set(1 / Math.sqrt(k), k, 1 / Math.sqrt(k));
      f.rotation.y = Math.sin(t * 3 + i * 2) * 0.25;
      f.rotation.z = Math.sin(t * 5.3 + i) * 0.05;
    });
    gl.material.opacity = 0.65 + Math.sin(t * 7) * 0.08 + Math.sin(t * 17) * 0.05;
  };
  return g;
}
function makeBonfireCode() {
  const g = new T.Group();
  for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2; const st = mesh(geo.sphere(0.18, 8, 6), 0x9a9aaa, { outline: 0.015 }); st.scale.y = 0.7; st.position.set(Math.cos(a) * 0.6, 0.1, Math.sin(a) * 0.6); g.add(st); }
  for (const r of [0.5, -0.5, 1.6]) { const log = mesh(geo.cyl(0.09, 0.09, 1.0, 8), 0x8a5a3b, { outline: 0.015 }); log.rotation.order = 'YXZ'; log.rotation.set(Math.PI / 2 - 0.25, r, 0); log.position.y = 0.2; g.add(log); }
  const flames = [];
  [[0.42, 1.1, 0xff7a2f, 0, 0], [0.3, 0.85, 0xffb43a, 0.12, 0.08], [0.17, 0.55, 0xfff08a, 0, 0.12]].forEach(([r, h, col, dx, dz]) => {
    const f = new T.Mesh(geo.cone(r, h, 10), glowMat(col)); f.position.set(dx, 0.25 + h / 2, dz);
    f.userData = { h, y0: 0.25 }; g.add(f); flames.push(f);
  });
  const gl = glow(0xff9a40, 4.5, 0.75); gl.position.y = 0.8;
  g.add(gl, blobShadow(0.9));
  g.userData.anim = (dt, t) => {
    flames.forEach((f, i) => { const k = 1 + Math.sin(t * (9 + i * 3) + i) * 0.12 + Math.sin(t * 23 + i * 2) * 0.05; f.scale.set(1 / Math.sqrt(k), k, 1 / Math.sqrt(k)); f.position.y = f.userData.y0 + (f.userData.h * k) / 2; });
    gl.material.opacity = 0.65 + Math.sin(t * 7) * 0.08 + Math.sin(t * 17) * 0.05;
  };
  return g;
}

// A glowing scalloped bell with a happy face and wavy tentacles (rim at y 0; tentacles hang to y -0.72).
export function makeJellyfish(col = 0xff9ad8) {
  const bell = scMesh('prop_jellyfish', 'prop_jellyfish', { tint: col, glow: true, ink: 0.02 });
  if (!bell) return makeJellyfishCode(col);
  const g = new T.Group();
  const light = new T.Color(col).lerp(new T.Color(0xffffff), 0.35).getHex();
  g.add(bell, scMesh('prop_jellyfish', 'face', { glow: true, ink: 0 }), scMesh('prop_jellyfish', 'tentacles', { tint: light, glow: true, ink: 0.014 }));
  g.add(glow(col, 2.6, 0.55));
  return g;
}
function makeJellyfishCode(col) {
  const g = new T.Group();
  const bell = new T.Mesh(dome(0.45, 16, 10), glowMat(col, { transparent: true, opacity: 0.9 }));
  bell.scale.y = 0.8;
  const eyes = new T.Group();
  for (const sx of [-1, 1]) { const e = new T.Mesh(geo.sphere(0.045, 8, 6), glowMat(0x3a2838)); e.position.set(sx * 0.14, 0.17, 0.36); eyes.add(e); }
  g.add(bell, eyes);
  for (let i = 0; i < 4; i++) { const tn = new T.Mesh(geo.cyl(0.03, 0.015, 0.6, 5), glowMat(col, { transparent: true, opacity: 0.75 })); tn.position.set(-0.24 + i * 0.16, -0.28, 0.05); g.add(tn); }
  g.add(glow(col, 2.6, 0.55));
  return g;
}

// Hull (bow +x), white gunwale, wooden deck and mast, mainsail and jib; each colour is a tinted layer.
export function makeSailboat(sail = 0xffffff, sail2 = 0xff8fb0, hull = 0xd94f3d) {
  const g = scProp('prop_sailboat', { prop_sailboat: { tint: hull }, trim: {}, sail: { tint: sail }, sail2: { tint: sail2 } }, { ink: 0.024 });
  return g || makeSailboatCode(sail, sail2, hull);
}
function makeSailboatCode(sail, sail2, hull) {
  const g = new T.Group();
  const h = mesh(bowl(1), hull, { outline: 0.03 });
  h.scale.set(1.6, 0.55, 0.55); h.position.y = 0.35;
  const deck = mesh(geo.cyl(1, 1, 0.08, 16), 0xf0d2a0, { outline: 0 }); deck.scale.set(1.6, 1, 0.55); deck.position.y = 0.34;
  const mast = mesh(geo.cyl(0.05, 0.05, 2.6, 6), 0x8a5a3b, { outline: 0.012 }); mast.position.y = 1.6;
  const tri = (w, ht, col, x, flip) => {
    const sh = new T.Shape(); sh.moveTo(0, 0); sh.lineTo(flip * w, 0); sh.lineTo(0, ht); sh.closePath();
    const gg = new T.ShapeGeometry(sh);
    const m = mesh(gg, col, { hull: 0, outline: 0 });
    m.material = toonUnique(col, { side: T.DoubleSide });
    m.position.set(x, 0.55, 0.02);
    return m;
  };
  g.add(h, deck, mast, tri(1.3, 2.3, sail, 0.08, 1), tri(0.8, 1.9, sail2, -0.08, -1));
  const flag = mesh(geo.box(0.35, 0.2, 0.02), 0xffd23f, { hull: 0 }); flag.position.set(0.2, 2.95, 0); g.add(flag);
  return g;
}

// The sculpted Peekaboo-pots scarecrow (prop_scarecrow, with a code face that looks around), at scenery size.
export function makeScarecrow() {
  const m = propModel('prop_scarecrow');
  if (!m) return makeScarecrowCode();
  const g = new T.Group();
  m.scale.setScalar(0.85);
  g.add(m, blobShadow(0.7));
  return g;
}
function makeScarecrowCode() {
  const g = new T.Group();
  const post = mesh(geo.cyl(0.08, 0.1, 2.6, 8), 0x8a5a3b, { outline: 0.015 }); post.position.y = 1.3;
  const bar = mesh(geo.cyl(0.06, 0.06, 2.0, 8), 0x8a5a3b, { outline: 0.015 }); bar.rotation.z = Math.PI / 2; bar.position.y = 1.95;
  const shirt = mesh(geo.box(0.95, 0.95, 0.5), 0x5a8fd8, { hull: 1.04 }); shirt.position.y = 1.65;
  const patch = mesh(geo.box(0.24, 0.24, 0.04), 0xff5a5a, { hull: 0 }); patch.position.set(-0.2, 1.5, 0.27);
  const sleeves = mesh(geo.box(1.9, 0.32, 0.34), 0x5a8fd8, { hull: 1.04 }); sleeves.position.y = 1.95;
  const head = mesh(geo.sphere(0.38, 16, 12), 0xf0d29a, { outline: 0.025 }); head.position.y = 2.5;
  for (const sx of [-1, 1]) { const e = new T.Mesh(geo.sphere(0.05, 8, 6), toon(INK)); e.position.set(sx * 0.13, 2.56, 0.34); g.add(e); }
  const smile = new T.Mesh(geo.torus(0.13, 0.022, Math.PI, 5, 10), toon(INK)); smile.rotation.z = Math.PI; smile.position.set(0, 2.44, 0.35);
  const brim = mesh(geo.cyl(0.65, 0.65, 0.06, 18), 0xf0c648, { outline: 0.015 }); brim.position.y = 2.8;
  const crown = mesh(geo.cyl(0.3, 0.36, 0.34, 16), 0xf0c648, { outline: 0.015 }); crown.position.y = 2.98;
  const hb = mesh(geo.cyl(0.365, 0.365, 0.09, 16), 0xff5a5a, { outline: 0 }); hb.position.y = 2.88;
  for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) { const st = mesh(geo.cone(0.06, 0.3, 5), 0xf0c648, { outline: 0 }); st.position.set(sx * (1.0 + i * 0.03), 1.9 - i * 0.08, 0); st.rotation.z = sx * (1.4 + i * 0.25); g.add(st); }
  g.add(post, bar, shirt, patch, sleeves, head, smile, brim, crown, hb, blobShadow(0.7));
  return g;
}

// A pastel rainbow arc far behind the scene.
export function makeRainbow(r = 22) {
  const g = new T.Group();
  const arch = natPart('prop_scene_rainbow', 'skin', { unlit: true, outline: 0.11 / r });
  if (arch) {
    arch.scale.setScalar(r + 0.48); // the model's outer edge sits where the old outer band's edge was
    arch.position.y = -0.01 * r;
    g.add(arch);
    return g;
  }
  const cols = [0xff6b6b, 0xffa94d, 0xffe066, 0x8ce99a, 0x74c0fc, 0xb197fc];
  cols.forEach((c, i) => {
    const band = new T.Mesh(new T.TorusGeometry(r - i * 0.9, 0.48, 6, 48, Math.PI), glowMat(c, { transparent: true, opacity: 0.8, depthWrite: false }));
    g.add(band);
  });
  return g;
}

// ---------- animated weather (one draw call each) ----------
const _m = new T.Matrix4(), _q = new T.Quaternion(), _e = new T.Euler(), _v = new T.Vector3(), _s = new T.Vector3();
// Things that fall and drift: leaves, snowflakes, rain. Respawn at the top when they reach the ground.
function addFalling(g, { n, geom, mat, colors = null, x = [-16, 16], y = [0, 10], z = [-14, 4], fall = 1, sway = 0.5, spin = 1, size = [1, 1], tilt = null }) {
  const im = new T.InstancedMesh(geom, mat, n);
  const st = [];
  for (let i = 0; i < n; i++) {
    st.push({ x: rr(...x), y: rr(...y), z: rr(...z), ph: rnd() * 6.3, sp: fall * rr(0.7, 1.3), s: rr(...size), rx: rnd() * 6, ry: rnd() * 6 });
    if (colors) im.setColorAt(i, new T.Color(colors[i % colors.length]));
  }
  im.frustumCulled = false;
  const update = (dt, t) => {
    for (let i = 0; i < n; i++) {
      const p = st[i];
      p.y -= p.sp * dt;
      if (p.y < y[0]) { p.y = y[1]; p.x = rr(...x); p.z = rr(...z); }
      const sw = Math.sin(t * 1.3 + p.ph) * sway;
      if (tilt) _e.set(tilt[0], 0, tilt[1]);
      else _e.set(p.rx + t * spin * 0.7, p.ry + t * spin, Math.sin(t * 2 + p.ph) * 0.8);
      _q.setFromEuler(_e);
      _m.compose(_v.set(p.x + sw, p.y, p.z + sw * 0.3), _q, _s.setScalar(p.s));
      im.setMatrixAt(i, _m);
    }
    im.instanceMatrix.needsUpdate = true;
  };
  update(0, 0);
  g.add(im);
  g.userData.anim.push(update);
  return im;
}
function leafGeom() { const gg = new T.SphereGeometry(0.16, 6, 4); gg.scale(1, 0.18, 0.6); return gg; }
const LEAF_COLS = [0xff8a1f, 0xe8503a, 0xffc23a, 0xd9662a, 0xb5452e];
function addFallingLeaves(g, n = 45) {
  addFalling(g, { n, geom: leafGeom(), mat: toonUnique(0xffffff, { side: T.DoubleSide }), colors: LEAF_COLS, y: [0.05, 9], z: [-14, 2], fall: 0.9, sway: 0.8, spin: 1.6, size: [0.9, 1.4] });
}
// Static fallen leaves on the ground: one instanced draw call.
function addFallenLeaves(g, n = 110, area = 18) {
  const im = new T.InstancedMesh(leafGeom(), toonUnique(0xffffff), n);
  for (let i = 0; i < n; i++) {
    const x = rr(-area, area), z = rr(-12, 6);
    _e.set(0, rnd() * 6, 0); _q.setFromEuler(_e);
    _m.compose(_v.set(x, 0.03 + i * 0.0002, z), _q, _s.setScalar(rr(1, 1.6)));
    im.setMatrixAt(i, _m); im.setColorAt(i, new T.Color(LEAF_COLS[i % LEAF_COLS.length]));
  }
  g.add(im);
}
function addSnowfall(g, n = 140) {
  addFalling(g, { n, geom: new T.SphereGeometry(0.07, 6, 4), mat: glowMat(0xffffff), y: [0, 11], z: [-16, 5], x: [-18, 18], fall: 0.8, sway: 0.5, spin: 0, size: [0.7, 1.5] });
}
function addRain(g, n = 150) {
  addFalling(g, { n, geom: new T.CylinderGeometry(0.018, 0.018, 0.55, 4), mat: glowMat(0xeaf4ff, { transparent: true, opacity: 0.55, depthWrite: false }), y: [0, 12], z: [-16, 5], x: [-18, 18], fall: 11, sway: 0, size: [0.8, 1.3], tilt: [0, 0.18] });
}
// Twinkling stars: three Points groups that pulse out of step.
function addStars(g, n = 90) {
  const groups = [];
  for (let k = 0; k < 3; k++) {
    const pos = [];
    for (let i = 0; i < n / 3; i++) pos.push(rr(-75, 75), rr(9, 42), rr(-62, -50));
    const geom = new T.BufferGeometry(); geom.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    const p = new T.Points(geom, new T.PointsMaterial({ map: starTex(), size: 3.2 + k * 0.8, transparent: true, depthWrite: false, fog: false, blending: T.AdditiveBlending }));
    p.frustumCulled = false;
    g.add(p); groups.push(p);
  }
  g.userData.anim.push((dt, t) => groups.forEach((p, k) => { p.material.opacity = 0.55 + 0.45 * Math.sin(t * (1.6 + k * 0.5) + k * 2.1); }));
}
// Fireflies: soft glowing dots that wander, all in one Points object.
function addFireflies(g, n = 26, col = 0xfff27a, area = { x: 15, y: [0.6, 3.6], z: [-11, -3] }) {
  const base = [], pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) base.push([rr(-area.x, area.x), rr(...area.y), rr(...area.z), rnd() * 6.3, rr(0.3, 0.7)]);
  const geom = new T.BufferGeometry(); geom.setAttribute('position', new T.BufferAttribute(pos, 3));
  const p = new T.Points(geom, new T.PointsMaterial({ map: glowTex(), color: col, size: 0.75, transparent: true, depthWrite: false, fog: false, blending: T.AdditiveBlending }));
  p.frustumCulled = false;
  g.add(p);
  const upd = (dt, t) => {
    base.forEach(([x, y, z, ph, sp], i) => { pos[i * 3] = x + Math.sin(t * sp + ph) * 1.2; pos[i * 3 + 1] = y + Math.sin(t * sp * 1.7 + ph * 2) * 0.4; pos[i * 3 + 2] = z + Math.cos(t * sp * 0.8 + ph) * 0.8; });
    geom.attributes.position.needsUpdate = true;
    p.material.opacity = 0.75 + Math.sin(t * 3) * 0.2;
  };
  upd(0, 0);
  g.userData.anim.push(upd);
}
// A glittering path of light across the sea toward the sun or moon.
function addSeaGlitter(g, x, col, z0 = -40, z1 = -8) {
  const bars = [];
  for (let i = 0; i < 10; i++) {
    const z = z0 + ((z1 - z0) * i) / 9;
    const w = 1.4 + (i / 9) * 2.6;
    const b = new T.Mesh(geo.circle(1, 16), glowMat(col, { transparent: true, opacity: 0.6, depthWrite: false }));
    b.rotation.x = -Math.PI / 2; b.scale.set(w, 0.22 + (i / 9) * 0.3, 1);
    b.position.set(x + Math.sin(i * 1.7) * 0.4, 0.13, z);
    b.userData.ph = i * 1.3;
    g.add(b); bars.push(b);
  }
  g.userData.anim.push((dt, t) => bars.forEach((b) => { b.material.opacity = 0.35 + 0.3 * Math.sin(t * 2 + b.userData.ph); }));
}
function addPuddle(g, x, z, s = 1, col = 0x8fc8ee) {
  const p = new T.Mesh(geo.circle(1, 24), toon(col));
  p.rotation.x = -Math.PI / 2; p.scale.set(1.3 * s, 0.7 * s, 1); p.position.set(x, 0.025, z);
  g.add(p);
  const ring = new T.Mesh(new T.RingGeometry(0.4, 0.5, 20), glowMat(0xffffff, { transparent: true, opacity: 0.6 }));
  ring.rotation.x = -Math.PI / 2; ring.position.set(x, 0.04, z);
  const ph = rnd() * 2;
  g.add(ring);
  g.userData.anim.push((dt, t) => { const k = ((t + ph) % 1.4) / 1.4; ring.scale.set(s * (0.4 + k * 1.6), s * (0.25 + k * 0.9), 1); ring.material.opacity = 0.7 * (1 - k); });
}
function bob(g, obj, amp = 0.15, sp = 1.2, rock = 0.05) {
  const y0 = obj.position.y, ph = rnd() * 6;
  g.userData.anim.push((dt, t) => { obj.position.y = y0 + Math.sin(t * sp + ph) * amp; obj.rotation.z = Math.sin(t * sp * 0.8 + ph) * rock; });
}
function place(g, obj, x, y, z, ry = 0) { obj.position.set(x, y, z); obj.rotation.y = ry; g.add(obj); return obj; }

export function driftClouds(meadow, dt) {
  for (const c of meadow.userData.clouds || []) {
    c.position.x += dt * 0.25;
    if (c.position.x > 26) c.position.x = -26;
  }
}

// Ringed trunk leaning to +x, coconuts, and fronds tinted leafCol on their own pivot at the crown (userData.top),
// so the beach can flutter them; animateScenery sways the whole palm by userData.ph.
export function makePalm(s = 1, ph = 0, leafCol = 0x3fbf5a) {
  const p = scProp('prop_palm', { nuts: {} }, { ink: 0.025 });
  if (!p) return makePalmCode(s, ph, leafCol);
  const top = new T.Group(); top.position.set(1.07, 4.44, 0);
  const fr = scMesh('prop_palm', 'fronds', { tint: leafCol, ink: 0.024 }); fr.position.sub(top.position);
  top.add(fr);
  p.add(top, blobShadow(1.1));
  p.scale.setScalar(s);
  p.userData.ph = ph; p.userData.top = top;
  return p;
}
function makePalmCode(s, ph, leafCol) {
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
    const leaf = mesh(geo.sphere(0.5, 12, 8), leafCol, { outline: 0.025 });
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

// A puffy starfish of radius r standing in the XY plane facing +z (lay it flat with rotation.x = -PI / 2).
export function makeStarfish(col = 0xff8a5c, r = 0.35) {
  const ink = +(0.013 / r).toFixed(3);
  const m = scProp('prop_starfish', { prop_starfish: { tint: col }, dots: { ink: ink * 0.6 } }, { ink });
  if (!m) return makeStarfishCode(col, r);
  m.scale.setScalar(r);
  const g = new T.Group();
  g.add(m);
  return g;
}
function makeStarfishCode(col, r) {
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

// ---------- Blender-built buildings, beach, farm and room props (tools/blender/creatures/prop_*.py) ----------
// Each layer of a model is one static Mesh sharing the loaded geometry (no skeleton, no per-frame cost); pieces that
// repeat a lot (fence, wheat, shells) are one InstancedMesh per layer. These hard-surface models keep crisp flat faces
// with split normals, so their ink is pushed along merged smooth normals (attribute inkN) and never cracks at edges.
// Every maker returns its code-built fallback when the model isn't built.
const _scParts = new Map(), _scInks = new Map();
function scInkMat(th) {
  if (!_scInks.has(th)) {
    const m = new T.MeshBasicMaterial({ color: INK, side: T.BackSide });
    m.onBeforeCompile = (s) => {
      s.vertexShader = 'attribute vec3 inkN;\n' + s.vertexShader.replace('#include <begin_vertex>', `vec3 transformed = position + inkN * ${th.toFixed(4)};`);
    };
    m.customProgramCacheKey = () => 'scenery-ink' + th;
    m.userData.shared = true;
    _scInks.set(th, m);
  }
  return _scInks.get(th);
}
function scInkNormals(g) {
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
function scPart(kind, layer) {
  const key = kind + '/' + layer;
  if (!_scParts.has(key)) {
    const gp = hasCreature(kind) ? garmentProp(kind, layer) : null;
    const m = gp && gp.children[0].children.find((o) => o.isMesh && !o.userData.outline);
    if (m) scInkNormals(m.geometry);
    _scParts.set(key, m ? { geometry: m.geometry, matrix: m.matrix.clone() } : null);
  }
  return _scParts.get(key);
}
const scMat = (tint, glowing, opacity) => (glowing ? basic(tint, { vertexColors: true, fog: false, ...(opacity < 1 ? { transparent: true, opacity, depthWrite: false } : {}) }) : toon(tint, { vertexColors: true }));
// One layer (default: the model's skin) as a static mesh with ink. tint multiplies the vertex paint; glow = unlit.
export function scMesh(kind, layer = kind, { tint = 0xffffff, ink = 0.025, glow = false, opacity = 1 } = {}) {
  const pt = scPart(kind, layer);
  if (!pt) return null;
  const m = new T.Mesh(pt.geometry, scMat(tint, glow, opacity));
  m.applyMatrix4(pt.matrix);
  if (ink) { const o = new T.Mesh(pt.geometry, scInkMat(ink)); o.userData.outline = true; m.add(o); }
  return m;
}
// A whole model: layers = { layerName: opts | false } (missing layers are skipped). The skin is the model's own name.
export function scProp(kind, layers = {}, base = {}) {
  if (!scPart(kind, kind)) return null;
  const g = new T.Group();
  g.userData.parts = {};
  for (const [name, o] of Object.entries({ [kind]: {}, ...layers })) {
    if (o === false) continue;
    const m = scMesh(kind, name, { ...base, ...o });
    if (m) { g.add(m); g.userData.parts[name === kind ? 'skin' : name] = m; }
  }
  return g;
}
// Many copies of one layer in one draw call (+ one for the ink). items: [{ x, y, z, ry, rx, rz, s (number | [x, y, z]),
// col }]. userData.place(i, item) re-poses one copy (for swaying wheat); call userData.commit() after.
const _sm = new T.Matrix4(), _sq = new T.Quaternion(), _se = new T.Euler(), _sv = new T.Vector3(), _ss = new T.Vector3();
export function scInstances(kind, layer, items, { tint = 0xffffff, ink = 0.025 } = {}) {
  const pt = scPart(kind, layer);
  if (!pt || !items.length) return null;
  const im = new T.InstancedMesh(pt.geometry, scMat(tint, false, 1), items.length);
  const place = (i, it) => {
    _se.set(it.rx || 0, it.ry || 0, it.rz || 0, 'YXZ'); _sq.setFromEuler(_se);
    const s = it.s ?? 1;
    if (Array.isArray(s)) _ss.set(s[0], s[1], s[2]); else _ss.setScalar(s);
    _sm.compose(_sv.set(it.x || 0, it.y || 0, it.z || 0), _sq, _ss).multiply(pt.matrix);
    im.setMatrixAt(i, _sm);
  };
  const cols = items.some((q) => q.col !== undefined);
  items.forEach((it, i) => { place(i, it); if (cols) im.setColorAt(i, new T.Color(it.col ?? 0xffffff)); });
  const g = new T.Group();
  g.add(im);
  if (ink) {
    const ol = new T.InstancedMesh(pt.geometry, scInkMat(ink), items.length);
    ol.instanceMatrix = im.instanceMatrix; ol.userData.outline = true;
    g.add(ol);
    g.userData.ink = ol;
  }
  g.userData.mesh = im;
  g.userData.place = place;
  g.userData.commit = () => { im.instanceMatrix.needsUpdate = true; };
  return g;
}

// ---------- World 3: the farm ----------
function box(w, h, d, col, x, y, z, o = 0.025) { const m = mesh(geo.box(w, h, d), col, { hull: o ? 1 + o : 0, outline: 0 }); m.position.set(x, y, z); return m; }

export function makeBarn() {
  const g = scProp('prop_barn', { trim: {}, roof: {}, hay: {} }, { ink: 0.03 });
  if (!g) return makeBarnCode();
  g.add(blobShadow(3.4));
  return g;
}
function makeBarnCode() {
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
  const g = scProp('prop_silo', { metal: {} }, { ink: 0.028 });
  if (!g) return makeSiloCode();
  g.add(blobShadow(1.4));
  return g;
}
function makeSiloCode() {
  const g = new T.Group();
  const c = mesh(geo.cyl(1.1, 1.1, 5, 20), 0xe9e4d8, { outline: 0.02 }); c.position.y = 2.5;
  const cap = mesh(geo.sphere(1.15, 20, 10), 0xb9c4cc, { outline: 0.02 }); cap.position.y = 5; cap.scale.y = 0.7;
  for (let i = 0; i < 3; i++) { const b = mesh(geo.torus(1.12, 0.05, Math.PI * 2, 6, 24), 0xb9c4cc, { outline: 0 }); b.rotation.x = Math.PI / 2; b.position.y = 1 + i * 1.5; g.add(b); }
  g.add(c, cap, blobShadow(1.4));
  return g;
}

// The sails are their own layer, built around the hub (0, 6.1, 0.7): they turn on userData.blades (animateScenery).
export function makeWindmill() {
  const g = scProp('prop_windmill', { trim: {}, cap: {} }, { ink: 0.028 });
  if (!g) return makeWindmillCode();
  const hub = new T.Group();
  hub.position.set(0, 6.1, 0.7);
  const sails = scMesh('prop_windmill', 'blades', { ink: 0.025 });
  sails.position.sub(hub.position);
  hub.add(sails);
  g.add(hub, blobShadow(1.3));
  g.userData.blades = hub;
  return g;
}
function makeWindmillCode() {
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

// Picket sections (1.7 long) and posts, each one instanced draw for the whole fence. Tinted by col.
export function makeFence(len = 20, col = 0xfff6e6) {
  const n = Math.max(1, Math.round(len / 1.7)), step = len / n;
  const secs = [], posts = [];
  for (let i = 0; i < n; i++) secs.push({ x: -len / 2 + i * step, s: [step / 1.7, 1, 1] });
  for (let i = 0; i <= n; i++) posts.push({ x: -len / 2 + i * step });
  const a = scInstances('prop_fence', 'prop_fence', secs, { tint: col, ink: 0.022 });
  const b = scInstances('prop_fence', 'post', posts, { tint: col, ink: 0.022 });
  if (!a || !b) return makeFenceCode(len, col);
  const g = new T.Group();
  g.add(a, b);
  return g;
}
function makeFenceCode(len, col) {
  const g = new T.Group();
  const n = Math.round(len / 1.6);
  for (let i = 0; i <= n; i++) {
    const p = mesh(geo.box(0.2, 1.3, 0.2), col, { hull: 1.06 }); p.position.set(-len / 2 + i * (len / n), 0.65, 0);
    g.add(p);
  }
  for (const y of [0.45, 0.95]) g.add(box(len, 0.14, 0.08, col, 0, y, 0.1, 0.004));
  return g;
}

// A round hay bale lying on its side (radius 0.7, 1.1 long), scaled by s.
export function makeHay(s = 1) {
  const g = scProp('prop_hayroll', { spiral: { ink: 0.02 }, twine: { ink: 0.018 } }, { ink: 0.025 });
  if (!g) return makeHayCode(s);
  g.add(blobShadow(0.9));
  g.scale.setScalar(s);
  return g;
}
function makeHayCode(s) {
  const g = new T.Group();
  const h = mesh(geo.cyl(0.7, 0.7, 1.1, 18), 0xf0c648, { outline: 0.025 });
  h.rotation.z = Math.PI / 2; h.position.y = 0.7;
  for (const x of [-0.3, 0.3]) { const b = mesh(geo.torus(0.71, 0.04, Math.PI * 2, 6, 20), 0xc99a2e, { outline: 0 }); b.rotation.y = Math.PI / 2; b.position.set(x, 0.7, 0); g.add(b); }
  g.add(h, blobShadow(0.9));
  g.scale.setScalar(s);
  return g;
}

// Head (seed disc + petals, facing +z) at height h on a stem with two leaves (no stem when h is tiny: a lone head).
export function makeSunflower(h = 2.2) {
  const head = scProp('prop_sunflower', { petals: { ink: 0.018 } }, { ink: 0.02 });
  if (!head) return makeSunflowerCode(h);
  const f = new T.Group();
  head.position.set(0, h, 0.05);
  f.add(head);
  if (h > 0.3) { const st = scMesh('prop_sunflower', 'stem', { ink: 0.02 }); st.scale.y *= h / 2.2; f.add(st); }
  f.userData.flower = true; f.userData.ph = Math.random() * 6;
  f.userData.head = head;
  return f;
}
function makeSunflowerCode(h) {
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
  const toy = natPart('prop_scene_butterfly', 'skin', { outline: 0.012 });
  if (toy) {
    // one modelled (right) wing, mirrored for the left; the game flaps them about the body axis
    for (const [w, s] of [[wl, -1], [wr, 1]]) {
      for (const [layer, o] of [['wing', { tint: col, outline: 0.012 }], ['dots', { outline: 0 }]]) {
        const m = natPart('prop_scene_butterfly', layer, o);
        m.position.x *= s; m.scale.x *= s;
        w.add(m);
      }
      b.add(w);
    }
    b.add(toy);
    b.scale.setScalar(1.15);
    b.userData = { wl, wr, cx, cy, cz, rx: 3 + Math.random() * 2, rz: 1.5, sp: 0.35 + Math.random() * 0.2, ph: Math.random() * 6 };
    return b;
  }
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


// ---------- World 2: the beach ----------
export function makeBeach({ sand = 0xf6dc9b, sea = 0x3fb6e0, shallow: shallowCol = 0x7fd8ee, foam = 0xffffff, island = 0xf0cf86,
  palmLeaf = 0x3fbf5a, cloud = 0xffffff, clouds = 4, sun = true, shells = [0xffc1d6, 0xffffff, 0xffd9a8, 0xd8b6ff] } = {}) {
  const g = new T.Group();
  g.userData.anim = [];
  const sandM = new T.Mesh(geo.cyl(40, 40, 1, 48), toon(sand));
  sandM.position.y = -0.5;
  g.add(sandM);
  // the sea: a big flat band behind the beach, with a foamy edge
  const seaM = new T.Mesh(geo.box(120, 0.2, 40), toon(sea));
  seaM.position.set(0, 0.0, -26);
  const shallow = new T.Mesh(geo.box(120, 0.2, 3), toon(shallowCol));
  shallow.position.set(0, 0.02, -7.5);
  g.add(seaM, shallow);
  const waves = [];
  for (let i = 0; i < 9; i++) {
    const w = mesh(geo.sphere(1, 16, 8), foam, { outline: 0.02 });
    w.userData = { sx: 2.2 + (i % 3) * 0.6, z0: -6.1, ph: i * 0.9 };
    w.scale.set(w.userData.sx, 0.12, 0.35);
    w.position.set(-20 + i * 5, 0.1, -6.1);
    g.add(w); waves.push(w);
  }
  // a little island far away
  const isl = mesh(geo.sphere(1, 20, 10), island, { outline: 0.02 });
  isl.scale.set(5, 1.2, 2.5);
  isl.position.set(13, -0.3, -30);
  const ipalm = makePalm(1.6, 2, palmLeaf);
  ipalm.position.set(13, 0.6, -30);
  g.add(isl, ipalm);
  if (sun) g.add(makeSun(-23, 10.5, -45));
  const palms = [];
  for (const [x, z, s, ph] of [[-9.5, -3, 1.3, 0], [10, -2.5, 1.15, 1.5], [-12, -5, 1, 3]]) {
    const p = makePalm(s, ph, palmLeaf);
    p.position.set(x, 0, z);
    g.add(p); palms.push(p);
  }
  for (let i = 0; i < clouds; i++) g.add(makeCloud(-16 + i * 10, 10 + (i % 2), -26, 0.9, cloud));
  // shells and starfish scattered on the sand (instanced: a few draws for all of them)
  const fans = [], swirls = [], stars = [];
  for (let i = 0; i < 12; i++) {
    const a = i * 2.3;
    const x = Math.cos(a) * (8 + (i % 4) * 2.4), z = Math.max(-4.6, -2 - (i % 4) * 1.2 + Math.sin(a));   // out of the surf
    const col = i % 4 === 0 ? [0xff8a5c, 0xffb04a, 0xff7a9a][(i / 4) % 3] : shells[i % shells.length];
    if (i % 4 === 0) stars.push({ x, y: 0.04, z, rx: -Math.PI / 2, ry: a, s: 0.3, col });
    else if (i % 4 === 3) swirls.push({ x, y: 0.2, z, ry: a, rz: Math.PI / 2 - 0.25, col });
    else fans.push({ x, z, ry: a, s: 0.9 + (i % 3) * 0.15, col });
  }
  const bits = [scInstances('prop_shell', 'prop_shell', fans, { ink: 0.016 }), scInstances('prop_shell', 'swirl', swirls, { ink: 0.016 }),
    scInstances('prop_starfish', 'prop_starfish', stars, { ink: 0.045 }), scInstances('prop_starfish', 'dots', stars.map((q) => ({ ...q, col: 0xfff4e0 })), { ink: 0.03 })];
  if (bits.every(Boolean)) g.add(...bits);
  else for (let i = 0; i < 12; i++) {
    const a = i * 2.3;
    const x = Math.cos(a) * (8 + (i % 4) * 2.4), z = -2 - (i % 4) * 1.2 + Math.sin(a);
    const sh = i % 4 === 0 ? makeStarfish(0xff8a5c, 0.3) : makeShell(shells[i % shells.length]);
    if (i % 4 === 0) { sh.rotation.x = -Math.PI / 2; sh.position.y = 0.06; }
    sh.position.x = x; sh.position.z = z;
    g.add(sh);
  }
  g.userData.clouds = g.children.filter((c) => c.userData.cloud);
  g.userData.waves = waves;
  g.userData.palms = palms;
  // fronds flutter in the sea breeze
  const tops = [...palms, ipalm].map((q) => q.userData.top).filter(Boolean);
  if (tops.length) g.userData.anim.push((dt, t) => tops.forEach((u, i) => { u.rotation.x = Math.sin(t * 1.7 + i * 1.9) * 0.035; u.rotation.z = Math.sin(t * 1.25 + i * 2.6) * 0.045; }));
  return g;
}

function beachSunset() {
  const g = makeBeach({ sand: 0xf7cf98, sea: 0x7a86d8, shallow: 0xb59ae0, foam: 0xffe6f0, island: 0xe8b882, palmLeaf: 0x3aa860,
    cloud: 0xffcadb, clouds: 5, sun: false, shells: [0xffb6c9, 0xffffff, 0xffd09a, 0xe0b6ff] });
  // a big low sun sitting on the sea, with a glittering path of light
  g.add(makeSun(-4, 3.6, -48, 0xffb35c, { halo: 0xff9a7a, haloSize: 26, size: 1.5 }));
  addSeaGlitter(g, -4, 0xffd27a);
  const boat = place(g, makeSailboat(0xffffff, 0xff8fb0), 8.5, 0, -24, -0.2); boat.scale.setScalar(1.2);
  bob(g, boat, 0.12, 1.1, 0.06);
  const boat2 = place(g, makeSailboat(0xfff2c0, 0xffb04a, 0x4a90ff), -14, 0, -28, 0.3); boat2.scale.setScalar(0.9);
  bob(g, boat2, 0.1, 0.9, 0.05);
  // paper lanterns on posts, and a string of lanterns between the two left palms
  for (const [x, z, col] of [[-7.8, -4.8, 0xff8fb0], [8.4, -4.6, 0xffb04a]]) place(g, makeLanternPost(col, 0.45), x, 0, z, x < 0 ? 0 : Math.PI);
  const cols = [0xff6b8a, 0xffb04a, 0xffe066, 0xb197fc, 0x74c0fc];
  // the string is tied to the two trunks at y 4.2 (under the fronds) and sags; the lanterns hang from it
  const A = new T.Vector3(-8.79, 4.2, -3), B = new T.Vector3(-11.01, 4.2, -5);
  const at = (k) => A.clone().lerp(B, k).setY(4.2 - Math.sin(k * Math.PI) * 0.7);
  const cord = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(Array.from({ length: 9 }, (_, i) => at(i / 8))), 24, 0.018, 4), basic(0x6a4a6a));
  g.add(cord);
  for (let i = 0; i < 5; i++) {
    const k = (i + 1) / 6;
    const l = makeLantern(cols[i], 0.35); l.scale.setScalar(0.7);
    l.position.copy(at(k)).y -= 0.34;
    g.add(l); bob(g, l, 0.03, 2, 0.06);
  }
  // seagull-ish birds: little ink ticks far away
  for (let i = 0; i < 3; i++) {
    const b = new T.Mesh(geo.torus(0.35, 0.05, Math.PI, 4, 10), toon(0x6a4a6a));
    b.position.set(-12 + i * 3.5, 9 + (i % 2), -30); b.scale.y = 0.6;
    g.add(b); bob(g, b, 0.3, 1.5, 0.15);
  }
  return g;
}

function beachNight() {
  const g = makeBeach({ sand: 0xf3dca8, sea: 0x2f5fb8, shallow: 0x4f8fd6, foam: 0xd8e6ff, island: 0xc9b07e, palmLeaf: 0x38a070,
    cloud: 0x8f9ae0, clouds: 3, sun: false, shells: [0xffc1d6, 0xffffff, 0xffe0a8, 0xd8b6ff] });
  g.add(makeMoon(23, 10, -44, 1.2));
  addStars(g, 96);
  addSeaGlitter(g, 14, 0xfff2c0);
  addFireflies(g, 22, 0xfff27a);
  // glowing jellyfish bobbing out in the sea
  [[-3, -11, 0xff9ad8], [4.5, -13, 0x7fe8ff], [-11, -14, 0xb9a0ff], [14, -10.5, 0x9affc4], [0.5, -17, 0x7fe8ff]].forEach(([x, z, c]) => {
    const j = place(g, makeJellyfish(c), x, 0.35, z); bob(g, j, 0.18, 1.4, 0.1);
  });
  const fire = place(g, makeBonfire(), 8.6, 0, -5.2);
  g.userData.anim.push(fire.userData.anim);
  // logs to sit on by the fire
  const log = scMesh('prop_bonfire', 'seat', { ink: 0.024 });
  if (log) place(g, log, 10.2, 0, -4.5, 0.4);
  else { const seat = mesh(geo.cyl(0.25, 0.25, 1.6, 10), 0x8a5a3b, { outline: 0.02 }); seat.rotation.set(0, 0.4, Math.PI / 2); seat.position.set(10.2, 0.25, -4.5); g.add(seat); }
  for (const [x, z, col] of [[-7.8, -4.8, 0xffd27a], [-11.2, -1.8, 0xff9ad8]]) {
    const lp = place(g, makeLanternPost(col, 0.85), x, 0, z);
    bob(g, lp.userData.lantern, 0.03, 1.8, 0.1);
  }
  return g;
}

// ---------- World 3: the farm ----------
export function makeFarm({ floor: floorCol = 0x9bd45a, hills = [0x86c44e, 0xe8c95a], path: pathCol = 0xd9a66b, wheat = 0xe8c95a,
  sunflowers = true, grass = 0x7cc04a, patch = 0x8cc952, pond = 0x6fd0f0, rim: rimCol = 0xb9e98a, cloud = 0xffffff, clouds = 5,
  sun = true, flies = true, hay = true } = {}) {
  const g = new T.Group();
  g.userData.anim = [];
  const floor = new T.Mesh(geo.cyl(40, 40, 1, 48), toon(floorCol));
  floor.position.y = -0.5;
  g.add(floor);
  for (const [x, z, r, col] of [[-16, -26, 9, hills[0]], [6, -30, 12, hills[1]], [24, -24, 8, hills[0]], [-30, -22, 7, hills[1]]]) {
    const h = mesh(geo.sphere(1, 24, 12), col, { outline: 0.02 });
    h.scale.set(r * 1.6, r * 0.55, r); h.position.set(x, -0.5, z);
    g.add(h);
  }
  // dirt path across the front
  const path = new T.Mesh(geo.box(60, 0.02, 2.6), toon(pathCol));
  path.position.set(0, 0.01, 4.4);
  g.add(path);
  const barn = makeBarn(); barn.position.set(-9.5, 0, -9); barn.rotation.y = 0.3; g.add(barn);
  const silo = makeSilo(); silo.position.set(-5.6, 0, -11); g.add(silo);
  const mill = makeWindmill(); mill.position.set(11, 0, -12); mill.rotation.y = -0.3; g.add(mill);
  const fence = makeFence(34); fence.position.set(0, 0, -4.2); g.add(fence);
  // two round bales side by side (axes along z, clear of the fence at z -4.2) and a smaller one resting on top
  if (hay) for (const [x, y, z, s] of [[8.9, 0, -3.4, 1], [10.35, 0, -3.4, 1], [9.63, 1.178, -3.35, 0.85]]) { const h = makeHay(s); h.position.set(x, y, z); h.rotation.y = Math.PI / 2; if (y) h.children.filter((c) => c.geometry === geo.circle(1.25, 28)).forEach((c) => (c.visible = false)); g.add(h); }
  // wheat on the far field, left of the pond and beyond it (clumps of three ears, one instanced draw, swaying)
  const wheatAt = [];
  for (let i = 0; i < 18; i++) {
    const row = Math.floor(i / 6), k = i % 6;
    const x = i < 12 ? -4.2 + k * 1.0 + row * 0.5 : 9.6 + k * 0.9 + (k % 2) * 0.2, z = i < 12 ? -6.6 - row * 1.1 : -6.4 - (k % 3) * 0.9;
    wheatAt.push({ x, z, ry: i * 2.1, s: 0.95 + ((i * 7) % 4) * 0.08, ph: i * 0.7 });
  }
  const wf = scInstances('prop_wheat', 'prop_wheat', wheatAt, { tint: wheat, ink: 0.018 });
  if (wf) {
    g.add(wf);
    g.userData.anim.push((dt, t) => { wheatAt.forEach((w, i) => { w.rz = Math.sin(t * 1.1 + w.ph) * 0.07; wf.userData.place(i, w); }); wf.userData.commit(); });
  } else for (let i = 0; i < 28; i++) {
    const w = mesh(geo.cone(0.18, 1.1, 6), wheat, { outline: 0.012 });
    w.position.set(-3 + (i % 14) * 1.1, 0.55, -7 - Math.floor(i / 14) * 1.2);
    w.userData.flower = true; w.userData.ph = i * 0.4;
    g.add(w);
  }
  if (sunflowers) for (const [x, z] of [[-12.5, -2.5], [-11.4, -3.1], [12.6, -1.5], [13.6, -2.4]]) { const f = makeSunflower(2 + (x % 2) * 0.3); f.position.set(x, 0, z); g.add(f); }
  // pond
  const pondM = new T.Mesh(geo.circle(2.2, 28), toon(pond)); pondM.rotation.x = -Math.PI / 2; pondM.scale.set(1.5, 0.8, 1); pondM.position.set(5.5, 0.02, -7);
  const rim = new T.Mesh(geo.circle(2.5, 28), toon(rimCol)); rim.rotation.x = -Math.PI / 2; rim.scale.set(1.5, 0.8, 1); rim.position.set(5.5, 0.015, -7);
  const ripple = new T.Mesh(new T.RingGeometry(0.6, 0.75, 24), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 }));
  ripple.rotation.x = -Math.PI / 2; ripple.position.set(5.5, 0.04, -7);
  g.add(rim, pondM, ripple);
  const pondDeco = scProp('prop_pond', { reeds: {}, lily: {} }, { ink: 0.022 });
  if (pondDeco) { pondDeco.position.set(5.5, 0, -7); g.add(pondDeco); }
  if (grass) addGrass(g, grass, 140, 26, -1.5);
  addPatches(g, patch, 14);
  if (sun) g.add(makeSun(23, 10.5, -44));
  for (let i = 0; i < clouds; i++) g.add(makeCloud(-18 + i * (45 / clouds), 9.5 + (i % 3), -22 - (i % 2) * 4, 0.9 + (i % 3) * 0.25, cloud));
  const fl = flies ? [makeButterfly(0xff8fc0, -4, 2.6, -3), makeButterfly(0xffd23f, 5, 3, -2.5)] : [];
  if (fl.length) g.add(...fl);
  g.userData.clouds = g.children.filter((c) => c.userData.cloud);
  g.userData.sway = g.children.filter((c) => c.userData.flower);
  g.userData.blades = mill.userData.blades;
  g.userData.flies = fl;
  g.userData.ripple = ripple;
  return g;
}

function farmHarvest() {
  const g = makeFarm({ floor: 0xb2c25c, hills: [0xe9a948, 0xd9823c], path: 0xc98a52, wheat: 0xe6a83a, sunflowers: false, grass: 0xc0a848,
    patch: 0xd0b45c, pond: 0x7fc8e0, rim: 0xd8cf7a, flies: false });
  // pumpkin patch behind the fence, plus a few at the sides
  [[-2.4, -5.6, 0.9], [-0.6, -5.4, 1.1], [1.4, -5.7, 0.85], [3.3, -5.4, 1.0], [-12.6, -1.6, 1.1], [-11.4, -2.6, 0.8], [11.6, -0.6, 0.9]].forEach(([x, z, s], i) =>
    place(g, makePumpkin(s, i % 3 === 2 ? 0xffa33a : 0xff8a1f), x, 0, z, i));
  place(g, makeScarecrow(), 13, 0, -2.6, -0.3);
  place(g, makeTree(1.1, 0x63b04a, { apples: 7 }), 15.5, 0, -7);
  // autumn trees behind the barn
  [[-16, -13, 0xf08a2c], [-2, -16, 0xe8503a], [3, -17, 0xffc23a], [18, -15, 0xf08a2c]].forEach(([x, z, c]) => place(g, makeTree(1.1, c), x, 0, z));
  const hayStack = place(g, makeHay(1), -13.6, 0, -2.9, 0.3);
  const topP = makePumpkin(0.5); topP.position.y = hasCreature('prop_hayroll') ? 1.4 : 1.3; hayStack.add(topP);
  addFallenLeaves(g, 60, 16);
  addFallingLeaves(g, 28);
  g.userData.bladeSpeed = 0.9;
  return g;
}

function farmRain() {
  const g = makeFarm({ floor: 0x86cc58, hills: [0x6fbf4e, 0x9fd36a], path: 0xc4925e, wheat: 0xa8d46a, grass: 0x5fae3e, patch: 0x7cc44e,
    pond: 0x6fbfe8, rim: 0x9fdc7a, cloud: 0xeef2f8, clouds: 6, sun: false, flies: false });
  const rb = makeRainbow(24); rb.position.set(-2, -3, -52); g.add(rb);
  g.add(makeSun(23, 11, -46, 0xfff4b0, { haloSize: 10, size: 0.8 }));
  // two grey rain clouds
  for (const [x, y, z] of [[-9, 12, -33], [7, 13, -35]]) { const c = makeCloud(x, y, z, 1.9, 0xc6d0e0); g.add(c); } // behind both cloud rows
  g.userData.clouds = g.children.filter((c) => c.userData.cloud);
  [[-12, -0.8, 1], [12.4, 0.4, 0.9], [-9.5, 4.6, 1.1], [9.5, 4.4, 0.8], [2.8, -5.6, 0.7]].forEach(([x, z, s]) => addPuddle(g, x, z, s));
  // yellow rain boots and a red umbrella by the fence
  const boots = scProp('prop_wellies', { prop_wellies: { tint: 0xffd23f }, trim: { ink: 0.018 } }, { ink: 0.02 });
  const umb = scProp('prop_umbrella', { prop_umbrella: { tint: 0xff5a5a }, stick: { ink: 0.018 } }, { ink: 0.024 });
  if (boots && umb) {
    place(g, boots, -10.3, 0, -2.6, 0.3).add(blobShadow(0.45));
    umb.add(blobShadow(0.8)); umb.rotation.z = -0.2; place(g, umb, 15.6, 0, -3.0, 0.4);
  } else for (const sx of [-1, 1]) {
    const boot = mesh(geo.cyl(0.2, 0.2, 0.6, 12), 0xffd23f, { outline: 0.02 }); boot.position.set(-11 + sx * 0.25, 0.3, -3.2);
    const toe = mesh(geo.sphere(0.2, 12, 8), 0xffd23f, { outline: 0.02 }); toe.scale.set(1, 0.7, 1.4); toe.position.set(-11 + sx * 0.25, 0.12, -3.0);
    g.add(boot, toe);
  }
  const um = new T.Group();
  const can = mesh(dome(1.0, 18, 6), 0xff5a5a, { outline: 0.03 }); can.scale.y = 0.6; can.position.y = 2.1;
  const stick = mesh(geo.cyl(0.04, 0.04, 2.1, 6), 0x5a3a2a, { outline: 0.012 }); stick.position.y = 1.05;
  um.add(can, stick, blobShadow(0.8)); um.rotation.z = 0.2; if (!umb) place(g, um, 13.2, 0, -3.4);
  // ducks enjoying the pond
  for (const [dx, ph] of [[-1, 0], [1, 2.5]]) {
    const d = makeDuck(0.45); g.add(d);
    g.userData.anim.push((dt, t) => { const k = t * 0.35 + ph; d.position.set(5.5 + Math.cos(k) * 1.9 * dx, 0.05 + Math.sin(t * 3 + ph) * 0.03, -7 + Math.sin(k) * 0.9); d.rotation.y = Math.atan2(-Math.sin(k) * dx, Math.cos(k) * 0.5); });
  }
  addRain(g, 150);
  return g;
}

// ---------- World 4: dress up ----------
// The single Dress Monkey icon stands big in the middle (x -3..3); props stay at the sides and against the back.
const stripes = (g, cols, n, w, h, d, x0, y, z, rx = 0) => {
  for (let i = 0; i < n; i++) { const b = mesh(geo.box(w, h, d), cols[i % cols.length], { hull: 0, outline: 0 }); b.position.set(x0 + i * w, y, z); b.rotation.x = rx; g.add(b); }
};
function hatStand(hat, x, y, z) {
  const g = new T.Group();
  const pole = mesh(geo.cyl(0.04, 0.04, 0.7, 6), 0x9a7a5a, { outline: 0.01 }); pole.position.y = 0.35;
  const base = mesh(geo.cyl(0.25, 0.28, 0.08, 12), 0x9a7a5a, { outline: 0.01 });
  const head = mesh(geo.sphere(0.24, 12, 10), 0xfff1e6, { outline: 0.012 }); head.position.y = 0.85;
  hat.position.y = 1.0; g.add(pole, base, head, hat);
  g.position.set(x, y, z);
  return g;
}
function miniHat(kind, col) {
  const g = new T.Group();
  if (kind === 'top') {
    const brim = mesh(geo.cyl(0.4, 0.4, 0.05, 16), col, { outline: 0.012 });
    const crown = mesh(geo.cyl(0.25, 0.27, 0.5, 16), col, { outline: 0.012 }); crown.position.y = 0.25;
    const band = mesh(geo.cyl(0.275, 0.275, 0.1, 16), 0xff6fa8, { outline: 0 }); band.position.y = 0.08;
    g.add(brim, crown, band);
  } else if (kind === 'party') {
    const c = mesh(geo.cone(0.26, 0.6, 14), col, { outline: 0.012 }); c.position.y = 0.28;
    const p = mesh(geo.sphere(0.08, 8, 6), 0xffffff, { outline: 0.008 }); p.position.y = 0.6;
    g.add(c, p);
  } else { // sun hat
    const brim = mesh(geo.cyl(0.55, 0.58, 0.04, 18), col, { outline: 0.012 });
    const crown = mesh(dome(0.28, 14, 6), col, { outline: 0.012 });
    const fl = mesh(geo.sphere(0.08, 8, 6), 0xff5a8a, { outline: 0.008 }); fl.position.set(0.24, 0.1, 0.12);
    g.add(brim, crown, fl);
  }
  return g;
}
function hatBox(col, lid, r = 0.6, h = 0.55) {
  const g = new T.Group();
  const b = mesh(geo.cyl(r, r, h, 20), col, { outline: 0.02 }); b.position.y = h / 2;
  const l = mesh(geo.cyl(r + 0.05, r + 0.05, 0.14, 20), lid, { outline: 0.02 }); l.position.y = h + 0.02;
  const rib = mesh(geo.box(0.12, h + 0.02, r * 2 + 0.06), lid, { hull: 0, outline: 0 }); rib.position.y = h / 2;
  g.add(b, l, rib);
  return g;
}
function bunting(g, x0, x1, y, z, sag = 0.6, cols = [0xff6fa8, 0xffd23f, 0x74c0fc, 0x8ce99a, 0xb197fc]) {
  const n = Math.round((x1 - x0) / 0.8);
  const line = [];
  for (let i = 0; i <= n; i++) { const k = i / n; line.push(new T.Vector3(x0 + (x1 - x0) * k, y - Math.sin(k * Math.PI) * sag, z)); }
  const str = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(line), 32, 0.025, 4), new T.MeshBasicMaterial({ color: 0x6a5a7a }));
  g.add(str);
  for (let i = 0; i < n; i++) {
    const k = (i + 0.5) / n;
    const f = mesh(geo.cone(0.28, 0.55, 3), cols[i % cols.length], { outline: 0.012 });
    f.rotation.z = Math.PI; f.scale.z = 0.25;
    f.position.set(x0 + (x1 - x0) * k, y - Math.sin(k * Math.PI) * sag - 0.3, z);
    f.userData.flower = true; f.userData.ph = i * 0.7; g.add(f);
  }
}
function shopFront(g, x, z, w, h, wall, awn, sign = null) {
  const body = mesh(geo.box(w, h, 1), wall, { hull: 1.01 }); body.position.set(x, h / 2, z); g.add(body);
  const top = mesh(geo.box(w + 0.6, 0.45, 1.4), 0xffffff, { hull: 1.02 }); top.position.set(x, h + 0.2, z); g.add(top);
  // striped awning, tilted out over the pavement, with a scalloped edge
  const n = Math.round(w / 0.9), sw = w / n;
  const aw = new T.Group();
  stripes(aw, [awn, 0xffffff], n, sw, 0.1, 1.8, -w / 2 + sw / 2, 0, 0);
  for (let i = 0; i < n; i++) { const sc = mesh(dome(sw / 2, 12, 4), i % 2 ? 0xffffff : awn, { outline: 0.01 }); sc.rotation.x = Math.PI; sc.scale.y = 0.6; sc.position.set(-w / 2 + sw / 2 + i * sw, -0.05, 0.9); aw.add(sc); }
  aw.position.set(x, h * 0.66, z + 1.3); aw.rotation.x = 0.38; g.add(aw);
  if (sign) { sign.position.set(x, h + 0.42, z); g.add(sign); }
  return body;
}
function shopWindow(g, x, y, z, w, h) {
  const glass = new T.Mesh(geo.box(w, h, 0.06), toon(0xd6f0ff)); glass.position.set(x, y, z); g.add(glass);
  for (const [dx, dy, ww, hh] of [[0, h / 2, w + 0.2, 0.18], [0, -h / 2, w + 0.4, 0.22], [-w / 2, 0, 0.18, h], [w / 2, 0, 0.18, h]]) {
    const f = mesh(geo.box(ww, hh, 0.2), 0xffffff, { hull: 1.04 }); f.position.set(x + dx, y + dy, z + 0.05); g.add(f);
  }
  const shine = new T.Mesh(geo.box(w * 0.12, h * 0.9, 0.01), glowMat(0xffffff, { transparent: true, opacity: 0.5 })); shine.position.set(x - w * 0.25, y, z + 0.04); shine.rotation.z = -0.35; g.add(shine);
}

function dressShopCode() {
  const g = new T.Group();
  g.userData.anim = [];
  const floor = new T.Mesh(geo.cyl(40, 40, 1, 48), toon(0xf1d9c0)); floor.position.y = -0.5; g.add(floor);
  // a round paved square in front of the shop
  const sq = new T.Mesh(geo.circle(6.5, 40), toon(0xe9cbb0)); sq.rotation.x = -Math.PI / 2; sq.scale.set(1.5, 0.75, 1); sq.position.set(0, 0.01, 0.2); g.add(sq);
  const sqIn = new T.Mesh(geo.circle(5.6, 40), toon(0xf6e2cf)); sqIn.rotation.x = -Math.PI / 2; sqIn.scale.set(1.5, 0.75, 1); sqIn.position.set(0, 0.015, 0.2); g.add(sqIn);
  // pavement in front of the shops
  const pave = new T.Mesh(geo.box(60, 0.04, 3.2), toon(0xe2c4a8)); pave.position.set(0, 0.02, -6.2); g.add(pave);
  // distant hills and trees peek over the rooftops
  for (const [x, z, r, col] of [[-16, -26, 9, 0x8fd06c], [6, -30, 12, 0x7cc95c], [24, -24, 8, 0x8fd06c], [-30, -22, 7, 0x7cc95c]]) {
    const h = mesh(geo.sphere(1, 24, 12), col, { outline: 0.02 }); h.scale.set(r * 1.6, r * 0.55, r); h.position.set(x, -0.5, z); g.add(h);
  }
  // the hat shop
  const sign = new T.Group();
  const board = mesh(geo.box(4.2, 1.3, 0.3), 0x8a5ad0, { hull: 1.03 }); board.position.y = 0.65; sign.add(board);
  const bigHat = miniHat('top', 0xffffff); bigHat.scale.setScalar(1.5); bigHat.position.set(0, 0.35, 0.3); sign.add(bigHat);
  shopFront(g, 0, -8.6, 12, 6.2, 0xffc6da, 0xff6fa8, sign);
  // door with a round top and a heart window
  const door = mesh(geo.box(2.2, 3.4, 0.2), 0x8a5ad0, { hull: 1.03 }); door.position.set(0, 1.7, -8.05); g.add(door);
  const arch = mesh(geo.cyl(1.1, 1.1, 0.2, 20), 0x8a5ad0, { outline: 0.02 }); arch.rotation.x = Math.PI / 2; arch.position.set(0, 3.4, -8.05); g.add(arch);
  const knob = mesh(geo.sphere(0.12, 10, 8), 0xffd23f, { outline: 0.01 }); knob.position.set(0.75, 1.7, -7.9); g.add(knob);
  // two display windows full of hats
  for (const sx of [-1, 1]) {
    shopWindow(g, sx * 3.9, 2.4, -8.05, 3.4, 2.7);
    const hats = sx < 0 ? [['sun', 0xffe08a], ['top', 0x5a4a80], ['party', 0xff6fa8]] : [['party', 0x74c0fc], ['sun', 0xffb3d1], ['top', 0xd94f3d]];
    hats.forEach(([k, c], i) => g.add(hatStand(miniHat(k, c), sx * 3.9 + (i - 1) * 1.05, 1.15, -7.85)));
  }
  // flower boxes under the windows
  for (const sx of [-1, 1]) {
    const bx = mesh(geo.box(3.4, 0.4, 0.5), 0xffffff, { hull: 1.04 }); bx.position.set(sx * 3.9, 0.95, -7.65); g.add(bx);
    for (let i = 0; i < 6; i++) { const f = mesh(geo.sphere(0.16, 8, 6), [0xff6fa8, 0xffd23f, 0xb197fc][i % 3], { outline: 0.01 }); f.position.set(sx * 3.9 - 1.4 + i * 0.56, 1.25, -7.6); g.add(f); }
  }
  // neighbours: a mint shoe shop and a lemon scarf shop
  shopFront(g, -13.2, -9.4, 10, 5.4, 0xbfeedd, 0x3fae8a);
  shopFront(g, 13.2, -9.4, 10, 5.4, 0xfff0b0, 0xffb020);
  shopWindow(g, -12, 2.2, -8.85, 4, 2.4); shopWindow(g, 12, 2.2, -8.85, 4, 2.4);
  // shoes in the mint window, scarves in the lemon one
  for (let i = 0; i < 3; i++) {
    const shoe = mesh(geo.sphere(0.3, 12, 8), [0xff4b4b, 0x4a90ff, 0x3fae4a][i], { outline: 0.012 }); shoe.scale.set(1.4, 0.6, 0.8); shoe.position.set(-13.2 + i * 1.2, 1.4, -8.7); g.add(shoe);
    const sc = mesh(geo.box(0.35, 1.6, 0.08), [0xff6fa8, 0x8a5ad0, 0x74c0fc][i], { hull: 1.06 }); sc.position.set(10.8 + i * 1.2, 2.4, -8.7); sc.rotation.z = 0.1 * (i - 1); g.add(sc);
  }
  bunting(g, -6.3, 6.3, 6.9, -7.2, 0.5);
  // street lamps and stacks of hat boxes at the sides
  for (const sx of [-1, 1]) {
    const post = mesh(geo.cyl(0.08, 0.1, 4.2, 8), 0x5a4a80, { outline: 0.015 }); post.position.set(sx * 7.3, 2.1, -6.3); g.add(post);
    const lamp = new T.Mesh(geo.sphere(0.32, 14, 10), glowMat(0xfff4c4)); lamp.position.set(sx * 7.3, 4.4, -6.3); g.add(lamp);
    const cap = mesh(geo.cone(0.4, 0.35, 12), 0x5a4a80, { outline: 0.015 }); cap.position.set(sx * 7.3, 4.85, -6.3); g.add(cap);
  }
  const stackL = [[0xff8fc0, 0xffffff, 0.75, 0.6], [0xb197fc, 0xffd23f, 0.6, 0.5], [0x74c0fc, 0xffffff, 0.45, 0.4]];
  let y = 0;
  for (const [c, l, r, h] of stackL) { const b = hatBox(c, l, r, h); b.position.set(-8.6, y, -3.4); b.rotation.y = y; g.add(b); y += h + 0.14; }
  y = 0;
  for (const [c, l, r, h] of [[0xffd23f, 0xff6fa8, 0.7, 0.55], [0x8ce99a, 0xffffff, 0.5, 0.45]]) { const b = hatBox(c, l, r, h); b.position.set(8.8, y, -2.8); g.add(b); y += h + 0.14; }
  const loose = hatBox(0xff6fa8, 0xffffff, 0.55, 0.45); loose.position.set(9.9, 0, -1.7); loose.rotation.y = 0.6; g.add(loose);
  // sky
  g.add(makeSun(-23, 10.5, -44));
  for (let i = 0; i < 4; i++) g.add(makeCloud(-18 + i * 11, 10 + (i % 2), -24 - (i % 2) * 4, 0.9 + (i % 3) * 0.2));
  g.add(makeButterfly(0xff8fc0, -5, 3.2, -3), makeButterfly(0xffd23f, 5.5, 3.6, -2.5));
  g.userData.clouds = g.children.filter((c) => c.userData.cloud);
  g.userData.sway = g.children.filter((c) => c.userData.flower);
  g.userData.flies = g.children.filter((c) => c.userData.wl);
  return g;
}

// ---- dress-up set dressing from Blender props (each placed clear of the walls and of each other) ----
// a mini hat (from the hat stand model) as its own group, brim at y 0
function propHat(kind, col, s = 1) {
  const trim = { top: 'topband', party: 'partypom', sun: 'sunflower' }[kind];
  const g = new T.Group();
  for (const m of [scMesh('prop_hatstand', kind, { tint: col, ink: 0.018 }), scMesh('prop_hatstand', trim, { ink: 0.014 })]) { m.position.y -= 1.02; g.add(m); }
  g.scale.setScalar(s);
  return g;
}
function propHatStand(kind, col, s = 1) {
  const g = scProp('prop_hatstand', {}, { ink: 0.018 });
  const hat = propHat(kind, col, s); hat.position.y = 1.02; g.add(hat);
  return g;
}
// a round hat box of radius r and height h (bow only when it's the top of a stack); returns [group, top y]
function propHatBox(col, lid, r, h, bow = true) {
  const g = scProp('prop_hatbox', { prop_hatbox: { tint: col }, lid: { tint: lid }, bow: bow ? { tint: lid } : false }, { ink: 0.022 });
  g.scale.set(r / 0.6, h / 0.55, r / 0.6);
  return [g, h * (0.568 / 0.55) + 0.004];
}
function hatStack(g, x, z, boxes, ry = 0) {
  let y = 0;
  boxes.forEach(([c, l, r, h], i) => { const [b, top] = propHatBox(c, l, r, h, i === boxes.length - 1); b.position.set(x, y, z); b.rotation.y = ry + i * 0.7; g.add(b); y += top; });
}
const curtainProp = (col, tie = 0xffc93a) => scProp('prop_curtain', { prop_curtain: { tint: col }, tie: { tint: tie, ink: 0.016 } }, { ink: 0.022 });

function dressShop() {
  if (!hasCreature('prop_shop') || !hasCreature('prop_hatstand')) return dressShopCode();
  const g = new T.Group();
  g.userData.anim = [];
  const floor = new T.Mesh(geo.cyl(40, 40, 1, 48), toon(0xf1d9c0)); floor.position.y = -0.5; g.add(floor);
  const sq = new T.Mesh(geo.circle(6.5, 40), toon(0xe9cbb0)); sq.rotation.x = -Math.PI / 2; sq.scale.set(1.5, 0.75, 1); sq.position.set(0, 0.01, 0.2); g.add(sq);
  const sqIn = new T.Mesh(geo.circle(5.6, 40), toon(0xf6e2cf)); sqIn.rotation.x = -Math.PI / 2; sqIn.scale.set(1.5, 0.75, 1); sqIn.position.set(0, 0.015, 0.2); g.add(sqIn);
  const pave = new T.Mesh(geo.box(60, 0.04, 3.2), toon(0xe2c4a8)); pave.position.set(0, 0.02, -6.2); g.add(pave);
  for (const [x, z, r, col] of [[-16, -26, 9, 0x8fd06c], [6, -30, 12, 0x7cc95c], [24, -24, 8, 0x8fd06c], [-30, -22, 7, 0x7cc95c]]) {
    const h = mesh(geo.sphere(1, 24, 12), col, { outline: 0.02 }); h.scale.set(r * 1.6, r * 0.55, r); h.position.set(x, -0.5, z); g.add(h);
  }
  // the hat shop (front at z -8.1) and its neighbours, a mint shoe shop and a lemon scarf shop (front at z -8.9)
  const shop = (x, z, sx, sy, wall, awn, door) => {
    const sp = scProp('prop_shop', { prop_shop: { tint: wall }, trim: {}, glass: { ink: 0.012 }, door: { tint: door }, awning: { tint: awn } }, { ink: 0.026 });
    sp.scale.set(sx, sy, 1); sp.position.set(x, 0, z); g.add(sp);
    return sp;
  };
  shop(0, -8.6, 1, 1, 0xffc6da, 0xff6fa8, 0x8a5ad0);
  shop(-13.2, -9.4, 10 / 12, 5.4 / 6.2, 0xbfeedd, 0x3fae8a, 0x3fae8a);
  shop(13.2, -9.4, 10 / 12, 5.4 / 6.2, 0xfff0b0, 0xffb020, 0xffb020);
  // the sign sits on the cornice, a big white top hat on top of the sign
  const board = mesh(geo.box(4.2, 1.3, 0.3), 0x8a5ad0, { hull: 1.03 }); board.position.set(0, 6.52 + 0.65, -8.6); g.add(board);
  const bigHat = propHat('top', 0xffffff, 1.5); bigHat.position.set(0, 7.82, -8.6); g.add(bigHat);
  // hats on stands in the windows, standing on the deep sills (top 1.27, z -8.14 .. -7.34) clear of the glass and bars
  [[-1, [['top', 0x5a4a80, 1], ['party', 0xff6fa8, 1]]], [1, [['sun', 0xffb3d1, 0.62], ['top', 0xd94f3d, 1]]]].forEach(([sx, hats]) =>
    hats.forEach(([k, c, sc], i) => { const st = propHatStand(k, c, sc); st.position.set(sx * 3.9 + (i ? 0.75 : -0.75), 1.27, -7.62); st.rotation.y = 0.3 - i * 0.6; g.add(st); }));
  // planters on the pavement under the windows (clear of the plinth)
  for (const sx of [-1, 1]) { const fb = scProp('prop_flowerbox', { flowers: { ink: 0.014 } }, { ink: 0.02 }); fb.position.set(sx * 3.9, 0.2, -7.68); g.add(fb); }
  // shoes in the mint shop's inner window, scarves in the lemon one's (sills top 1.106, glass front z -8.865)
  for (let i = 0; i < 3; i++) {
    const shoe = mesh(geo.sphere(0.3, 12, 8), [0xff4b4b, 0x4a90ff, 0x3fae4a][i], { outline: 0.012 }); shoe.scale.set(1.12, 0.48, 0.64); shoe.position.set(-9.95 + (i - 1) * 0.8, 1.25, -8.5); g.add(shoe);
    const sc = mesh(geo.box(0.35, 1.5, 0.08), [0xff6fa8, 0x8a5ad0, 0x74c0fc][i], { hull: 1.06 }); sc.position.set(9.95 + (i - 1) * 0.62, 2.3, -8.7); sc.rotation.z = 0.08 * (i - 1); g.add(sc);
  }
  bunting(g, -6.3, 6.3, 6.9, -7.2, 0.5);
  // street lamps with glowing globes
  for (const sx of [-1, 1]) {
    const lamp = scProp('prop_streetlamp', { glass: { glow: true, ink: 0.016 }, cap: {} }, { ink: 0.022 }); lamp.position.set(sx * 7.3, 0, -6.3); g.add(lamp);
    const gl = glow(0xfff1b0, 1.6, 0.35); gl.position.set(sx * 7.3, 4.4, -6.3); g.add(gl);
  }
  // stacks of hat boxes at the sides
  hatStack(g, -8.6, -3.4, [[0xff8fc0, 0xffffff, 0.75, 0.6], [0xb197fc, 0xffd23f, 0.6, 0.5], [0x74c0fc, 0xffffff, 0.45, 0.4]]);
  hatStack(g, 8.8, -2.8, [[0xffd23f, 0xff6fa8, 0.7, 0.55], [0x8ce99a, 0xffffff, 0.5, 0.45]], 0.4);
  hatStack(g, 9.9, -1.7, [[0xff6fa8, 0xffffff, 0.55, 0.45]], 0.6);
  g.add(makeSun(-23, 10.5, -44));
  for (let i = 0; i < 4; i++) g.add(makeCloud(-18 + i * 11, 10 + (i % 2), -24 - (i % 2) * 4, 0.9 + (i % 3) * 0.2));
  g.add(makeButterfly(0xff8fc0, -5, 3.2, -3), makeButterfly(0xffd23f, 5.5, 3.6, -2.5));
  g.userData.clouds = g.children.filter((c) => c.userData.cloud);
  g.userData.sway = g.children.filter((c) => c.userData.flower);
  g.userData.flies = g.children.filter((c) => c.userData.wl);
  return g;
}

function dressRoom() {
  if (!hasCreature('prop_vanity') || !hasCreature('prop_curtain')) return dressRoomCode();
  const g = new T.Group();
  makeRoomShell(g, { wall: 0xffd6e4, stripe: 0xffe6ee, floor: 0xe3ae7a, plank: 0xcd935e });
  const rug = new T.Mesh(geo.circle(5, 40), toon(0xc58bff)); rug.rotation.x = -Math.PI / 2; rug.scale.set(1.35, 0.7, 1); rug.position.set(0, 0.02, 0); g.add(rug);
  const rugIn = new T.Mesh(geo.ring(3.9, 4.2, 40), toon(0xffffff)); rugIn.rotation.x = -Math.PI / 2; rugIn.scale.set(1.35, 0.7, 1); rugIn.position.set(0, 0.025, 0); g.add(rugIn);
  // the changing curtains behind Monkey: velvet panels tied back with gold, hung from a gold rail, a scalloped pelmet
  for (const sx of [-1, 1]) { const c = curtainProp(0xd9366a); c.scale.set(-sx * 2.0, 7.2, 1); c.position.set(sx * 3.7, 0.05, -6.6); g.add(c); }
  const rail = mesh(geo.cyl(0.08, 0.08, 9.8, 10), 0xffc93a, { outline: 0.014 }); rail.rotation.z = Math.PI / 2; rail.position.set(0, 7.3, -6.6); g.add(rail);
  for (const sx of [-1, 1]) { const ball = mesh(geo.sphere(0.18, 12, 10), 0xffc93a, { outline: 0.012 }); ball.position.set(sx * 4.95, 7.3, -6.6); g.add(ball); }
  for (let i = 0; i < 9; i++) { const sc = mesh(dome(0.48, 12, 4), 0xd9366a, { outline: 0.014 }); sc.rotation.x = Math.PI; sc.scale.set(1, 0.7, 0.4); sc.position.set(-3.8 + i * 0.95, 7.05, -6.2); g.add(sc); }
  // fairy lights across the wall
  const bulbs = [];
  for (const sx of [-1, 1]) for (let i = 0; i < 7; i++) {
    const k = i / 6, x = sx * (5.4 + k * 6.0), y = 8.2 - Math.sin(k * Math.PI) * 0.6;
    const b = new T.Mesh(geo.sphere(0.13, 8, 6), glowMat([0xffe27a, 0xff9ad8, 0x9fd8ff][i % 3])); b.position.set(x, y, -6.8); g.add(b); bulbs.push(b);
    const gl = glow([0xffe27a, 0xff9ad8, 0x9fd8ff][i % 3], 0.9, 0.5); gl.position.copy(b.position); g.add(gl); b.userData.gl = gl;
  }
  g.userData.anim.push((dt, t) => bulbs.forEach((b, i) => { b.userData.gl.material.opacity = 0.35 + 0.3 * Math.sin(t * 2.4 + i * 1.3); }));
  // left: the dressing table with its bulb mirror (against the wall at z -7), stool and perfume bottles; a sun hat
  const mx = -9.2;
  const van = scProp('prop_vanity', { bulbs: { glow: true, ink: 0.014 }, stool: {}, bits: { ink: 0.016 } }, { ink: 0.024 });
  van.position.set(mx, 0, -7.0); g.add(van);
  const glass = new T.Mesh(new T.PlaneGeometry(3.0, 3.4), new T.MeshBasicMaterial({ fog: false, map: canvasTex(64, (x, n) => { const gr = x.createLinearGradient(0, 0, n, n); gr.addColorStop(0, '#d9f2ff'); gr.addColorStop(1, '#9fcff0'); x.fillStyle = gr; x.fillRect(0, 0, n, n); }) }));
  glass.position.set(mx, 4.3, -6.72); g.add(glass);
  for (const [dx, w] of [[-0.6, 0.35], [-0.05, 0.18]]) { const sh = new T.Mesh(geo.box(w, 3.0, 0.01), glowMat(0xffffff, { transparent: true, opacity: 0.6 })); sh.position.set(mx + dx, 4.3, -6.71); sh.rotation.z = -0.4; g.add(sh); }
  const tHat = propHat('sun', 0xffe08a); tHat.position.set(mx + 0.35, 2.15, -5.95); g.add(tHat);
  // right: a gold clothes rail with four garments on wooden hangers (spaced so they never touch), hat boxes on a shelf
  const rx = 9.2, rz = -5.0;
  const rl = scProp('prop_clothesrail', { wheels: { ink: 0.016 } }, { ink: 0.02 }); rl.position.set(rx, 0, rz); g.add(rl);
  const clothes = [];
  [['dress', 0xff6fa8], ['top', 0x74c0fc], ['dress', 0xffd23f], ['top', 0x8ce99a]].forEach(([k, c], i) => {
    const h = new T.Group();
    h.add(scMesh('prop_clothesrail', 'hanger', { ink: 0.014 }), scMesh('prop_clothesrail', k, { tint: c, ink: 0.02 }));
    h.scale.setScalar(0.85); h.position.set(rx + (i - 1.5) * 1.12, 4.45, rz); g.add(h); clothes.push(h);
  });
  g.userData.anim.push((dt, t) => clothes.forEach((h, i) => { h.rotation.z = Math.sin(t * 1.2 + i) * 0.035; }));
  const shelf = scMesh('prop_shelf', 'prop_shelf', { ink: 0.022 }); shelf.scale.set(1.77, 1, 1.5); shelf.position.set(rx, 6.6, -6.625); g.add(shelf);
  [[0xff8fc0, 0xffffff], [0xffd23f, 0xff6fa8], [0x74c0fc, 0xffffff]].forEach(([c, l], i) => { const [b] = propHatBox(c, l, 0.35, 0.42); b.position.set(rx + (i - 1) * 1.25, 6.66, -6.6); b.rotation.y = i; g.add(b); });
  const plant = scProp('prop_plant', { leaves: { ink: 0.016 } }, { ink: 0.02 }); plant.position.set(-13.2, 0, -4.4); g.add(plant);
  return g;
}

function dressRainy() {
  if (!hasCreature('prop_window') || !hasCreature('prop_armchair')) return dressRainyCode();
  const g = new T.Group();
  makeRoomShell(g, { wall: 0xfff0d6, stripe: null, floor: 0xcf9a66, plank: 0xb98353 });
  // wood panelling on the lower wall
  const pan = mesh(geo.box(80, 2.6, 0.2), 0x9fcbe6, { hull: 0, outline: 0 }); pan.position.set(0, 1.3, -6.95); g.add(pan);
  const railW = mesh(geo.box(80, 0.18, 0.35), 0xffffff, { hull: 0, outline: 0 }); railW.position.set(0, 2.65, -6.85); g.add(railW);
  const lines = new T.InstancedMesh(geo.box(0.06, 2.3, 0.02), toon(0x8ab9d8), 40);
  for (let i = 0; i < 40; i++) { _m.makeTranslation(-39 + i * 2, 1.3, -6.84); lines.setMatrixAt(i, _m); }
  g.add(lines);
  const rug = new T.Mesh(geo.circle(5, 40), toon(0x74c0fc)); rug.rotation.x = -Math.PI / 2; rug.scale.set(1.35, 0.7, 1); rug.position.set(0, 0.02, 0); g.add(rug);
  for (const [r1, r2, c] of [[3.4, 3.8, 0xffffff], [2.2, 2.6, 0xffd23f]]) { const rg = new T.Mesh(geo.ring(r1, r2, 40), toon(c)); rg.rotation.x = -Math.PI / 2; rg.scale.set(1.35, 0.7, 1); rg.position.set(0, 0.025, 0); g.add(rg); }
  // the big window: grey sky, green hills, houses, drifting clouds and rain outside (inside the frame at z -6.75)
  const WX = 0, WY = 5.3, WW = 7.0, WH = 3.6, WZ = -6.95;
  // the view outside is painted into the sky texture, so hills and houses never spill past the window frame
  const view = roomTex('rainyview', 512, 264, (x, w, h) => {
    const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#8fa3c4'); gr.addColorStop(1, '#d6e0ee'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
    const ell = (cx, cy, rx, ry, c) => { x.fillStyle = c; x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); x.fill(); };
    for (const [hx, c] of [[110, '#ff8a8a'], [440, '#ffd27a']]) {
      x.fillStyle = c; x.fillRect(hx - 26, h - 120, 52, 40);
      x.fillStyle = '#8a5a5a'; x.beginPath(); x.moveTo(hx - 34, h - 118); x.lineTo(hx, h - 148); x.lineTo(hx + 34, h - 118); x.fill();
      x.fillStyle = '#fff6d8'; x.fillRect(hx - 8, h - 108, 14, 14);
    }
    ell(140, h + 20, 230, 95, '#7ab85a');
    ell(390, h + 30, 260, 100, '#8cc96a');
  }, 1, 1);
  const sky = new T.Mesh(new T.PlaneGeometry(WW, WH), new T.MeshBasicMaterial({ map: view, fog: false }));
  sky.position.set(WX, WY, WZ + 0.2); g.add(sky);
  const outClouds = [];
  for (const [cx, cy, s] of [[-2.2, 1.25, 0.55], [1.2, 1.15, 0.7], [2.8, 0.75, 0.45]]) {
    const c = new T.Group();
    for (const [dx, dy, r] of [[0, 0, 0.6], [0.6, -0.1, 0.45], [-0.6, -0.12, 0.42]]) { const q = new T.Mesh(geo.circle(r, 16), glowMat(0xeef2f8)); q.position.set(dx, dy, 0); c.add(q); }
    c.scale.setScalar(s); c.position.set(WX + cx, WY + cy, WZ + 0.25); g.add(c); outClouds.push(c);
  }
  const drops = new T.InstancedMesh(new T.PlaneGeometry(0.035, 0.32), glowMat(0x4a7ab8, { transparent: true, opacity: 0.7, side: T.DoubleSide }), 46);
  const ds = [];
  for (let i = 0; i < 46; i++) ds.push({ x: rr(-WW / 2 + 0.2, WW / 2 - 0.2), y: rr(-WH / 2, WH / 2), sp: rr(3, 4.5) });
  drops.frustumCulled = false; g.add(drops);
  g.userData.anim.push((dt, t) => {
    ds.forEach((d, i) => {
      d.y -= d.sp * dt; if (d.y < -WH / 2 + 0.15) { d.y = WH / 2 - 0.2; d.x = rr(-WW / 2 + 0.2, WW / 2 - 0.2); }
      _q.setFromEuler(_e.set(0, 0, 0.15)); _m.compose(_v.set(WX + d.x, WY + d.y, WZ + 0.27), _q, _s.setScalar(1)); drops.setMatrixAt(i, _m);
    });
    drops.instanceMatrix.needsUpdate = true;
    outClouds.forEach((c, i) => { c.position.x = WX + [-2.2, 1.2, 2.8][i] + Math.sin(t * 0.25 + i * 2) * 0.12; });
  });
  const win = scMesh('prop_window', 'big', { ink: 0.024 }); win.position.set(WX, WY, -6.75); g.add(win);
  const glassDrops = [];
  for (let i = 0; i < 6; i++) { const d = new T.Mesh(geo.sphere(0.07, 8, 6), glowMat(0xffffff, { transparent: true, opacity: 0.8 })); d.scale.y = 1.4; d.userData = { x: rr(-3.2, 3.2), ph: rnd() }; g.add(d); glassDrops.push(d); }
  g.userData.anim.push((dt, t) => glassDrops.forEach((d) => { const k = (t * 0.12 + d.userData.ph) % 1; d.position.set(WX + d.userData.x, WY + WH / 2 - 0.3 - k * (WH - 0.6), WZ + 0.45); }));
  // sill-length curtains on a wooden rail, and a little plant on the sill (sill top y 3.19)
  for (const sx of [-1, 1]) { const c = curtainProp(0xffb6c9, 0xffffff); c.scale.set(-sx * 1.9, 4.4, 1); c.position.set(WX + sx * (WW / 2 + 0.9), 3.25, -6.3); g.add(c); }
  const crail = mesh(geo.cyl(0.06, 0.06, WW + 3.6, 8), 0x9a7a5a, { outline: 0.01 }); crail.rotation.z = Math.PI / 2; crail.position.set(WX, WY + WH / 2 + 0.55, WZ + 0.6); g.add(crail);
  const sp = scProp('prop_plant', { leaves: { ink: 0.016 } }, { ink: 0.02 }); sp.scale.setScalar(0.55); sp.position.set(WX + 2.4, 3.19, -6.2); g.add(sp);
  // left: coat pegs with a yellow raincoat, a stripy scarf and a sun hat; an umbrella stand; wellies on a mat
  const px = -9.2;
  const pegs = scProp('prop_coatpegs', { coat: {}, scarf: { ink: 0.016 } }, { ink: 0.022 }); pegs.position.set(px, 5.4, -7.0); g.add(pegs);
  const hat = propHat('sun', 0x74c0fc); hat.rotation.x = 1.3; hat.position.set(px + 1.3, 5.05, -6.45); g.add(hat);
  const stand = scProp('prop_umbrellastand', { brollies: { ink: 0.018 } }, { ink: 0.022 }); stand.position.set(px + 2.2, 0, -5.8); g.add(stand);
  const mat = mesh(geo.box(3.0, 0.06, 1.4), 0x8a6a4a, { hull: 1.02 }); mat.position.set(px - 0.6, 0.03, -4.4); g.add(mat);
  for (const [dx, c, ry] of [[-1.2, 0xff4b4b, 0.15], [0.3, 0x3fae4a, -0.2]]) {
    const b = scProp('prop_wellies', { prop_wellies: { tint: c }, trim: { ink: 0.016 } }, { ink: 0.02 }); b.position.set(px + dx, 0.06, -4.45); b.rotation.y = ry; g.add(b);
  }
  // right: a cosy armchair with a cushion and a blanket, a glowing floor lamp, a picture of a sunny day
  const ax = 9.4, az = -4.6;
  const chair = scProp('prop_armchair', { prop_armchair: { tint: 0x9a6ae0 }, feet: { ink: 0.016 }, cushion: {}, blanket: { ink: 0.018 } }, { ink: 0.024 });
  chair.position.set(ax, 0, az); g.add(chair);
  const lx = ax + 2.4;
  const lamp = scProp('prop_floorlamp', { shade: { glow: true, ink: 0.018 }, cord: { ink: 0.01 } }, { ink: 0.02 }); lamp.position.set(lx, 0, az - 0.6); g.add(lamp);
  const lg = glow(0xffe0a0, 3.2, 0.55); lg.position.set(lx, 4.25, az - 0.6); g.add(lg);
  const pic = scProp('prop_frame', { canvas: { tint: 0x9fd8ff, ink: 0 }, art: { ink: 0.012 } }, { ink: 0.02 }); pic.scale.setScalar(1.4); pic.position.set(ax, 5.6, -7.0); g.add(pic);
  return g;
}

// Indoor rooms: a wooden floor and a papered back wall that fills the whole view (wall front at z -7.0, skirting
// front at -6.775). Planks and stripes are canvas textures: a couple of draws instead of fifty.
const _roomTex = new Map();
function roomTex(key, w, h, draw, rx, ry) {
  if (!_roomTex.has(key)) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rx, ry);
    t.anisotropy = 4; t.userData.shared = true;
    _roomTex.set(key, t);
  }
  return _roomTex.get(key);
}
const hexCss = (c) => '#' + c.toString(16).padStart(6, '0');
function makeRoomShell(g, opts) {
  if (!hasCreature('prop_window')) return makeRoomShellCode(g, opts);
  const { wall, stripe, floor, plank, skirting = 0xffffff } = opts;
  g.userData.anim = [];
  const ft = roomTex('floor' + floor + plank, 256, 256, (x, w, h) => {
    x.fillStyle = hexCss(floor); x.fillRect(0, 0, w, h);
    for (let i = 0; i < 8; i++) {
      x.fillStyle = hexCss(plank); x.fillRect(0, i * 32, w, 3);
      for (const j of [(i * 97) % 256, (i * 97 + 128) % 256]) x.fillRect(j, i * 32, 3, 32);
      x.fillStyle = 'rgba(255,255,255,0.08)'; x.fillRect(0, i * 32 + 3, w, 6);
    }
  }, 6.25, 6.25);
  const fl = new T.Mesh(geo.cyl(40, 40, 1, 48), toonUnique(0xffffff, { map: ft })); fl.position.y = -0.5; g.add(fl);
  const wt = stripe ? roomTex('wall' + wall + stripe, 64, 8, (x, w, h) => { x.fillStyle = hexCss(wall); x.fillRect(0, 0, w, h); x.fillStyle = hexCss(stripe); x.fillRect(0, 0, 22, h); }, 40, 1) : null;
  const w = new T.Mesh(geo.box(80, 30, 0.4), wt ? toonUnique(0xffffff, { map: wt }) : toon(wall)); w.position.set(0, 15, -7.2); g.add(w);
  const sk = mesh(geo.box(80, 0.45, 0.25), skirting, { hull: 0, outline: 0 }); sk.position.set(0, 0.22, -6.9); g.add(sk);
}
function makeRoomShellCode(g, { wall, stripe, floor, plank, skirting = 0xffffff }) {
  g.userData.anim = [];
  const fl = new T.Mesh(geo.cyl(40, 40, 1, 48), toon(floor)); fl.position.y = -0.5; g.add(fl);
  for (let i = 0; i < 14; i++) { const p = new T.Mesh(geo.box(80, 0.01, 0.05), toon(plank)); p.position.set(0, 0.006, -6.4 + i * 1.6); g.add(p); }
  const w = new T.Mesh(geo.box(80, 30, 0.4), toon(wall)); w.position.set(0, 15, -7.2); g.add(w);
  if (stripe) for (let i = 0; i < 40; i++) { const st = new T.Mesh(geo.box(0.7, 30, 0.02), toon(stripe)); st.position.set(-39 + i * 2, 15, -6.99); g.add(st); }
  const sk = mesh(geo.box(80, 0.45, 0.25), skirting, { hull: 0, outline: 0 }); sk.position.set(0, 0.22, -6.9); g.add(sk);
}

function dressRoomCode() {
  const g = new T.Group();
  makeRoomShell(g, { wall: 0xffd6e4, stripe: 0xffe6ee, floor: 0xe3ae7a, plank: 0xcd935e });
  // a round rug for Monkey's catwalk
  const rug = new T.Mesh(geo.circle(5, 40), toon(0xc58bff)); rug.rotation.x = -Math.PI / 2; rug.scale.set(1.35, 0.7, 1); rug.position.set(0, 0.02, 0); g.add(rug);
  const rugIn = new T.Mesh(geo.ring(3.9, 4.2, 40), toon(0xffffff)); rugIn.rotation.x = -Math.PI / 2; rugIn.scale.set(1.35, 0.7, 1); rugIn.position.set(0, 0.025, 0); g.add(rugIn);
  // the changing curtains behind Monkey: a gold rail, velvet curtains tied back, a scalloped pelmet
  const rail = mesh(geo.cyl(0.08, 0.08, 8.4, 8), 0xffc93a, { outline: 0.012 }); rail.rotation.z = Math.PI / 2; rail.position.set(0, 7.3, -6.6); g.add(rail);
  for (const sx of [-1, 1]) {
    const c = mesh(geo.cyl(0.7, 1.15, 7.2, 14), 0xd9366a, { outline: 0.025 }); c.position.set(sx * 3.7, 3.65, -6.4); c.scale.z = 0.45; g.add(c);
    for (let k = -1; k <= 1; k++) { const fold = mesh(geo.box(0.1, 7, 0.1), 0xb52a58, { hull: 0, outline: 0 }); fold.position.set(sx * 3.7 + k * 0.4, 3.7, -5.85); g.add(fold); }
    const tie = mesh(geo.torus(0.75, 0.1, Math.PI * 2, 6, 18), 0xffc93a, { outline: 0.01 }); tie.rotation.x = Math.PI / 2; tie.scale.set(1, 0.5, 1); tie.position.set(sx * 3.7, 2.6, -6.4); g.add(tie);
    const ball = mesh(geo.sphere(0.18, 10, 8), 0xffc93a, { outline: 0.01 }); ball.position.set(sx * 4.2, 7.3, -6.6); g.add(ball);
  }
  for (let i = 0; i < 9; i++) { const sc = mesh(dome(0.48, 12, 4), 0xd9366a, { outline: 0.012 }); sc.rotation.x = Math.PI; sc.scale.set(1, 0.7, 0.4); sc.position.set(-3.8 + i * 0.95, 7.05, -6.3); g.add(sc); }
  // fairy lights across the wall
  const bulbs = [];
  for (const sx of [-1, 1]) for (let i = 0; i < 7; i++) {
    const k = i / 6, x = sx * (4.8 + k * 6.5), y = 8.2 - Math.sin(k * Math.PI) * 0.7;
    const b = new T.Mesh(geo.sphere(0.13, 8, 6), glowMat([0xffe27a, 0xff9ad8, 0x9fd8ff][i % 3])); b.position.set(x, y, -6.8); g.add(b); bulbs.push(b);
    const gl = glow([0xffe27a, 0xff9ad8, 0x9fd8ff][i % 3], 0.9, 0.5); gl.position.copy(b.position); g.add(gl); b.userData.gl = gl;
  }
  g.userData.anim.push((dt, t) => bulbs.forEach((b, i) => { b.userData.gl.material.opacity = 0.35 + 0.3 * Math.sin(t * 2.4 + i * 1.3); }));
  // left: a dressing table with a bulb mirror
  const mx = -9.2;
  const frame = mesh(geo.box(3.6, 4.0, 0.25), 0xffffff, { hull: 1.03 }); frame.position.set(mx, 4.3, -6.85); g.add(frame);
  const glass = new T.Mesh(new T.PlaneGeometry(3.0, 3.4), new T.MeshBasicMaterial({ fog: false, map: canvasTex(64, (x, n) => { const gr = x.createLinearGradient(0, 0, n, n); gr.addColorStop(0, '#d9f2ff'); gr.addColorStop(1, '#9fcff0'); x.fillStyle = gr; x.fillRect(0, 0, n, n); }) }));
  glass.position.set(mx, 4.3, -6.69); g.add(glass);
  for (const [dx, w] of [[-0.6, 0.35], [-0.05, 0.18]]) { const sh = new T.Mesh(geo.box(w, 3.2, 0.01), glowMat(0xffffff, { transparent: true, opacity: 0.6 })); sh.position.set(mx + dx, 4.3, -6.66); sh.rotation.z = -0.4; g.add(sh); }
  for (let i = 0; i < 12; i++) {
    const side = i < 4 ? -1 : i < 8 ? 1 : 0, k = (i % 4) / 3;
    const p = side ? [mx + side * 1.8, 2.7 + k * 3.2] : [mx - 1.2 + (i - 8) * 0.8, 6.3];
    const b = new T.Mesh(geo.sphere(0.15, 8, 6), glowMat(0xfff4c4)); b.position.set(p[0], p[1], -6.65); g.add(b);
  }
  const table = mesh(geo.box(4.4, 0.3, 1.6), 0xffffff, { hull: 1.03 }); table.position.set(mx, 2.0, -6.0); g.add(table);
  for (const sx of [-1, 1]) { const leg = mesh(geo.cyl(0.08, 0.08, 2, 8), 0xffffff, { outline: 0.012 }); leg.position.set(mx + sx * 1.9, 1.0, -5.5); g.add(leg); }
  for (const [dx, c] of [[-1.4, 0xff8fc0], [-0.9, 0xb197fc], [1.4, 0x74c0fc]]) { const bt = mesh(geo.cyl(0.18, 0.2, 0.45, 10), c, { outline: 0.012 }); bt.position.set(mx + dx, 2.38, -5.8); g.add(bt); }
  const tHat = miniHat('sun', 0xffe08a); tHat.position.set(mx + 0.4, 2.17, -5.7); g.add(tHat);
  const stool = mesh(geo.cyl(0.55, 0.55, 0.35, 16), 0xff8fc0, { outline: 0.02 }); stool.position.set(mx + 0.3, 1.1, -4.4); g.add(stool);
  const stLeg = mesh(geo.cyl(0.08, 0.12, 1.0, 8), 0xffc93a, { outline: 0.012 }); stLeg.position.set(mx + 0.3, 0.5, -4.4); g.add(stLeg);
  // right: a clothes rail of tops and dresses
  const rx = 9.2, rz = -5.0;
  for (const sx of [-1, 1]) { const post = mesh(geo.cyl(0.08, 0.08, 4.6, 8), 0xffc93a, { outline: 0.012 }); post.position.set(rx + sx * 2.3, 2.3, rz); g.add(post); }
  const bar = mesh(geo.cyl(0.07, 0.07, 4.8, 8), 0xffc93a, { outline: 0.012 }); bar.rotation.z = Math.PI / 2; bar.position.set(rx, 4.5, rz); g.add(bar);
  for (const sx of [-1, 1]) { const ft = mesh(geo.box(0.2, 0.1, 1.4), 0xffc93a, { hull: 1.05 }); ft.position.set(rx + sx * 2.3, 0.05, rz); g.add(ft); }
  const clothes = [];
  [['dress', 0xff6fa8], ['top', 0x74c0fc], ['dress', 0xffd23f], ['top', 0x8ce99a], ['dress', 0xb197fc]].forEach(([k, c], i) => {
    const h = new T.Group();
    const hook = new T.Mesh(geo.torus(0.1, 0.02, Math.PI * 1.3, 4, 10), basic(0x6a5a7a)); hook.position.y = 0.05; h.add(hook);
    const hanger = mesh(geo.box(0.8, 0.05, 0.05), 0x9a7a5a, { hull: 0, outline: 0 }); hanger.position.y = -0.15; h.add(hanger);
    if (k === 'dress') { const d = mesh(geo.cone(0.6, 1.6, 14), c, { outline: 0.015 }); d.scale.z = 0.35; d.position.y = -1.0; h.add(d); }
    else {
      const b = mesh(geo.box(0.75, 0.9, 0.2), c, { hull: 1.04 }); b.position.y = -0.62; h.add(b);
      for (const s2 of [-1, 1]) { const sl = mesh(geo.box(0.3, 0.45, 0.18), c, { hull: 1.05 }); sl.position.set(s2 * 0.48, -0.35, 0); sl.rotation.z = s2 * 0.5; h.add(sl); }
    }
    h.position.set(rx - 1.8 + i * 0.9, 4.45, rz); h.rotation.y = 0.25; g.add(h); clothes.push(h);
  });
  g.userData.anim.push((dt, t) => clothes.forEach((h, i) => { h.rotation.z = Math.sin(t * 1.2 + i) * 0.04; }));
  // a shelf of hat boxes above the rail
  const shelf = mesh(geo.box(4.6, 0.2, 0.9), 0xffffff, { hull: 1.03 }); shelf.position.set(rx, 6.6, -6.6); g.add(shelf);
  [[0xff8fc0, 0xffffff], [0xffd23f, 0xff6fa8], [0x74c0fc, 0xffffff]].forEach(([c, l], i) => { const b = hatBox(c, l, 0.55, 0.5); b.position.set(rx - 1.5 + i * 1.5, 6.7, -6.5); g.add(b); });
  // a plant at the far left and a full-length bow on the wall
  const pot = mesh(geo.cyl(0.55, 0.42, 0.8, 14), 0xffffff, { outline: 0.02 }); pot.position.set(-13.2, 0.4, -4.4); g.add(pot);
  for (let i = 0; i < 6; i++) { const lf = mesh(geo.sphere(0.32, 10, 8), 0x58c45e, { outline: 0.012 }); lf.scale.set(0.6, 1.6, 0.4); const a = (i / 6) * Math.PI * 2; lf.position.set(-13.2 + Math.cos(a) * 0.3, 1.4, -4.4 + Math.sin(a) * 0.2); lf.rotation.z = Math.cos(a) * 0.5; g.add(lf); }
  return g;
}

function dressRainyCode() {
  const g = new T.Group();
  makeRoomShell(g, { wall: 0xfff0d6, stripe: null, floor: 0xcf9a66, plank: 0xb98353 });
  // wood panelling on the lower wall
  const pan = mesh(geo.box(80, 2.6, 0.2), 0x9fcbe6, { hull: 0, outline: 0 }); pan.position.set(0, 1.3, -6.95); g.add(pan);
  const railW = mesh(geo.box(80, 0.18, 0.35), 0xffffff, { hull: 0, outline: 0 }); railW.position.set(0, 2.65, -6.85); g.add(railW);
  for (let i = 0; i < 40; i++) { const l = new T.Mesh(geo.box(0.06, 2.3, 0.02), toon(0x8ab9d8)); l.position.set(-39 + i * 2, 1.3, -6.84); g.add(l); }
  // a striped rug
  const rug = new T.Mesh(geo.circle(5, 40), toon(0x74c0fc)); rug.rotation.x = -Math.PI / 2; rug.scale.set(1.35, 0.7, 1); rug.position.set(0, 0.02, 0); g.add(rug);
  for (const [r1, r2, c] of [[3.4, 3.8, 0xffffff], [2.2, 2.6, 0xffd23f]]) { const rg = new T.Mesh(geo.ring(r1, r2, 40), toon(c)); rg.rotation.x = -Math.PI / 2; rg.scale.set(1.35, 0.7, 1); rg.position.set(0, 0.025, 0); g.add(rg); }
  // the big window: grey sky, a green hill, clouds and rain outside
  const WX = 0, WY = 5.3, WW = 7.0, WH = 3.6, WZ = -6.95;
  const sky = new T.Mesh(new T.PlaneGeometry(WW, WH), new T.MeshBasicMaterial({ map: canvasTex(64, (x, n) => { const gr = x.createLinearGradient(0, 0, 0, n); gr.addColorStop(0, '#8fa3c4'); gr.addColorStop(1, '#d6e0ee'); x.fillStyle = gr; x.fillRect(0, 0, n, n); }), fog: false }));
  sky.position.set(WX, WY, WZ + 0.2); g.add(sky);
  const hill = new T.Mesh(geo.circle(4, 28), glowMat(0x8cc96a)); hill.scale.set(1.2, 0.35, 1); hill.position.set(WX + 1.2, WY - WH / 2 - 0.4, WZ + 0.22); g.add(hill);
  const hill2 = new T.Mesh(geo.circle(3, 28), glowMat(0x7ab85a)); hill2.scale.set(1.2, 0.4, 1); hill2.position.set(WX - 2.4, WY - WH / 2 - 0.3, WZ + 0.23); g.add(hill2);
  const houses = [[-2.4, 0xff8a8a], [2.6, 0xffd27a]];
  for (const [hx, c] of houses) {
    const hb = new T.Mesh(geo.box(0.7, 0.55, 0.01), glowMat(c)); hb.position.set(WX + hx, WY - WH / 2 + 0.75, WZ + 0.24); g.add(hb);
    const rf = new T.Mesh(geo.cone(0.5, 0.4, 3), glowMat(0x8a5a5a)); rf.position.set(WX + hx, WY - WH / 2 + 1.2, WZ + 0.24); rf.scale.z = 0.02; g.add(rf);
  }
  const outClouds = [];
  for (const [cx, cy, s] of [[-2.2, 1.3, 0.55], [1.6, 1.5, 0.7], [3.4, 1.0, 0.45]]) {
    const c = new T.Group();
    for (const [dx, dy, r] of [[0, 0, 0.6], [0.6, -0.1, 0.45], [-0.6, -0.12, 0.42]]) { const p = new T.Mesh(geo.circle(r, 16), glowMat(0xeef2f8)); p.position.set(dx, dy, 0); c.add(p); }
    c.scale.setScalar(s); c.position.set(WX + cx, WY + cy, WZ + 0.25); g.add(c); outClouds.push(c);
  }
  const drops = new T.InstancedMesh(new T.PlaneGeometry(0.035, 0.32), glowMat(0x4a7ab8, { transparent: true, opacity: 0.7, side: T.DoubleSide }), 46);
  const ds = [];
  for (let i = 0; i < 46; i++) ds.push({ x: rr(-WW / 2 + 0.2, WW / 2 - 0.2), y: rr(-WH / 2, WH / 2), sp: rr(3, 4.5) });
  drops.frustumCulled = false; g.add(drops);
  g.userData.anim.push((dt, t) => {
    ds.forEach((d, i) => {
      d.y -= d.sp * dt; if (d.y < -WH / 2 + 0.15) { d.y = WH / 2 - 0.2; d.x = rr(-WW / 2 + 0.2, WW / 2 - 0.2); }
      _q.setFromEuler(_e.set(0, 0, 0.15)); _m.compose(_v.set(WX + d.x, WY + d.y, WZ + 0.27), _q, _s.setScalar(1)); drops.setMatrixAt(i, _m);
    });
    drops.instanceMatrix.needsUpdate = true;
    outClouds.forEach((c, i) => { c.position.x = WX + [-2.2, 1.6, 3.4][i] + Math.sin(t * 0.25 + i * 2) * 0.35; });
  });
  // frame, cross bars and a deep sill with a plant and a rubber duck
  for (const [dx, dy, w, h] of [[0, WH / 2 + 0.15, WW + 0.6, 0.3], [0, -WH / 2 - 0.15, WW + 0.6, 0.3], [-WW / 2 - 0.15, 0, 0.3, WH + 0.6], [WW / 2 + 0.15, 0, 0.3, WH + 0.6], [0, 0, 0.18, WH], [0, 0.2, WW, 0.16]]) {
    const f = mesh(geo.box(w, h, 0.3), 0xffffff, { hull: 1.03 }); f.position.set(WX + dx, WY + dy, WZ + 0.35); g.add(f);
  }
  const sill = mesh(geo.box(WW + 1.2, 0.25, 1.0), 0xffffff, { hull: 1.03 }); sill.position.set(WX, WY - WH / 2 - 0.35, WZ + 0.6); g.add(sill);
  // drops sliding down the glass
  const glassDrops = [];
  for (let i = 0; i < 6; i++) { const d = new T.Mesh(geo.sphere(0.07, 8, 6), glowMat(0xffffff, { transparent: true, opacity: 0.8 })); d.scale.y = 1.4; d.userData = { x: rr(-3.2, 3.2), ph: rnd() }; g.add(d); glassDrops.push(d); }
  g.userData.anim.push((dt, t) => glassDrops.forEach((d) => { const k = (t * 0.12 + d.userData.ph) % 1; d.position.set(WX + d.userData.x, WY + WH / 2 - 0.3 - k * (WH - 0.6), WZ + 0.45); }));
  // curtains each side of the window
  for (const sx of [-1, 1]) {
    const c = mesh(geo.cyl(0.55, 0.85, 5.6, 12), 0xffb6c9, { outline: 0.02 }); c.scale.z = 0.4; c.position.set(WX + sx * (WW / 2 + 0.9), WY - 0.4, WZ + 0.6); g.add(c);
    for (let k = -1; k <= 1; k++) { const dot = mesh(geo.box(0.06, 5.2, 0.06), 0xffffff, { hull: 0, outline: 0 }); dot.position.set(WX + sx * (WW / 2 + 0.9) + k * 0.3, WY - 0.4, WZ + 0.95); g.add(dot); }
  }
  const crail = mesh(geo.cyl(0.06, 0.06, WW + 3.6, 8), 0x9a7a5a, { outline: 0.01 }); crail.rotation.z = Math.PI / 2; crail.position.set(WX, WY + WH / 2 + 0.55, WZ + 0.6); g.add(crail);
  // left: coat pegs with a yellow raincoat and a stripy scarf, an umbrella stand and wellies on a mat
  const px = -9.2;
  const board = mesh(geo.box(4, 0.4, 0.2), 0x9a7a5a, { hull: 1.04 }); board.position.set(px, 5.4, -6.8); g.add(board);
  for (let i = 0; i < 3; i++) { const pg = mesh(geo.cyl(0.07, 0.07, 0.4, 8), 0x7a5a3a, { outline: 0.01 }); pg.rotation.x = Math.PI / 2; pg.position.set(px - 1.3 + i * 1.3, 5.3, -6.55); g.add(pg); }
  const coat = mesh(geo.cone(0.85, 2.4, 14), 0xffd23f, { outline: 0.02 }); coat.scale.z = 0.4; coat.position.set(px - 1.3, 4.0, -6.4); g.add(coat);
  const hood = mesh(geo.sphere(0.42, 12, 10), 0xffd23f, { outline: 0.02 }); hood.position.set(px - 1.3, 5.0, -6.4); g.add(hood);
  for (let k = 0; k < 3; k++) { const bt = mesh(geo.sphere(0.07, 6, 4), 0x5a4a80, { outline: 0 }); bt.position.set(px - 1.3, 4.4 - k * 0.45, -6.02); g.add(bt); }
  for (let i = 0; i < 7; i++) { const b = mesh(geo.box(0.36, 0.3, 0.08), i % 2 ? 0xffffff : 0xff4b4b, { hull: 0, outline: 0 }); b.position.set(px, 5.1 - i * 0.3, -6.45); g.add(b); }
  const hat = miniHat('sun', 0x74c0fc); hat.rotation.x = 1.3; hat.position.set(px + 1.3, 5.0, -6.4); g.add(hat);
  const stand = mesh(geo.cyl(0.4, 0.35, 1.0, 14), 0x5a4a80, { outline: 0.02 }); stand.position.set(px + 2.2, 0.5, -5.8); g.add(stand);
  for (const [dx, c, rz] of [[-0.12, 0xff4b4b, 0.12], [0.14, 0x3fae4a, -0.15]]) {
    const um = mesh(geo.cone(0.2, 1.6, 8), c, { outline: 0.015 }); um.position.set(px + 2.2 + dx, 1.5, -5.8); um.rotation.z = rz; g.add(um);
    const hk = new T.Mesh(geo.torus(0.12, 0.035, Math.PI, 6, 10), basic(0x6a5a7a)); hk.position.set(px + 2.2 + dx - rz, 2.42, -5.8); g.add(hk);
  }
  const mat = mesh(geo.box(3.0, 0.06, 1.4), 0x8a6a4a, { hull: 1.02 }); mat.position.set(px - 0.6, 0.03, -4.4); g.add(mat);
  [[-1.5, 0xff4b4b], [-0.95, 0xff4b4b], [0.0, 0x3fae4a], [0.5, 0x3fae4a]].forEach(([dx, c]) => {
    const leg = mesh(geo.cyl(0.2, 0.2, 0.7, 12), c, { outline: 0.02 }); leg.position.set(px + dx, 0.41, -4.5); g.add(leg);
    const toe = mesh(geo.sphere(0.21, 12, 8), c, { outline: 0.02 }); toe.scale.set(1, 0.65, 1.5); toe.position.set(px + dx, 0.18, -4.28); g.add(toe);
  });
  // right: a cosy armchair with a blanket, and a glowing floor lamp
  const ax = 9.4, az = -4.6;
  const seat = mesh(geo.box(2.6, 0.7, 1.8), 0x8a5ad0, { hull: 1.03 }); seat.position.set(ax, 0.75, az); g.add(seat);
  const back = mesh(geo.box(2.6, 2.0, 0.5), 0x8a5ad0, { hull: 1.03 }); back.position.set(ax, 1.8, az - 0.75); g.add(back);
  for (const sx of [-1, 1]) { const arm = mesh(geo.cyl(0.32, 0.32, 1.8, 12), 0x9a6ae0, { outline: 0.02 }); arm.rotation.x = Math.PI / 2; arm.position.set(ax + sx * 1.35, 1.25, az); g.add(arm); }
  const cush = mesh(geo.sphere(0.5, 12, 10), 0xffd23f, { outline: 0.015 }); cush.scale.set(1, 0.9, 0.45); cush.position.set(ax - 0.5, 1.6, az - 0.35); cush.rotation.z = 0.3; g.add(cush);
  const blanket = mesh(geo.box(1.2, 1.3, 0.06), 0xff8fc0, { hull: 1.05 }); blanket.position.set(ax + 0.6, 1.5, az - 0.45); blanket.rotation.z = -0.1; g.add(blanket);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const lg = mesh(geo.cyl(0.07, 0.07, 0.4, 6), 0x7a5a3a, { outline: 0.01 }); lg.position.set(ax + sx * 1.1, 0.2, az + sz * 0.7); g.add(lg); }
  const lx = ax + 2.4;
  const lpost = mesh(geo.cyl(0.06, 0.06, 4, 8), 0x5a4a80, { outline: 0.012 }); lpost.position.set(lx, 2, az - 0.6); g.add(lpost);
  const shade = mesh(geo.cyl(0.4, 0.7, 0.8, 14, true), 0xfff1c0, { outline: 0.015 }); shade.position.set(lx, 4.2, az - 0.6); g.add(shade);
  const lg = glow(0xffe0a0, 3.2, 0.55); lg.position.set(lx, 4.0, az - 0.6); g.add(lg);
  // a picture of a sunny day on the wall, for later
  const pic = mesh(geo.box(1.8, 1.4, 0.12), 0xffffff, { hull: 1.04 }); pic.position.set(ax, 5.6, -6.9); g.add(pic);
  const pin = new T.Mesh(geo.box(1.5, 1.1, 0.02), glowMat(0x9fd8ff)); pin.position.set(ax, 5.6, -6.82); g.add(pin);
  const ps = new T.Mesh(geo.circle(0.25, 16), glowMat(0xffd23f)); ps.position.set(ax + 0.35, 5.8, -6.8); g.add(ps);
  return g;
}

// ---------- the meadow's three seasons ----------
function meadowAutumn() {
  const g = makeMeadow({ ground: 0xbccb62, hills: [0xd6b85e, 0xc49a52], grass: 0xa8a640, patch: 0xc9bd62,
    flowers: [0xff8a1f, 0xe8503a, 0xffc23a, 0xb5452e], trees: [0xf08a2c, 0xe8503a, 0xffc23a] });
  [[-10.6, -3.4, 1.1], [-9.4, -2.6, 0.75], [10.6, -3.2, 1.2], [11.8, -4.4, 0.85], [-12.5, -6, 0.9]].forEach(([x, z, s], i) => place(g, makePumpkin(s), x, 0, z, i));
  // leaf piles
  for (const [x, z, s] of [[-12.2, -1.2, 1], [12.8, -0.6, 0.9], [7.5, -7.5, 0.8]]) {
    const heap = natPart('prop_scene_leafpile', 'skin', { outline: 0.022 });
    if (heap) { heap.scale.setScalar(s); place(g, heap, x, 0, z, x * 0.7); continue; }
    const pile = mesh(dome(1, 14, 6), 0xf08a2c, { outline: 0.025 }); pile.scale.set(1.2 * s, 0.45 * s, 0.9 * s); pile.position.set(x, 0, z); g.add(pile);
  }
  // toadstools (a big one with a little one beside it)
  for (const [x, z] of [[-8.5, -5.5], [9.2, -6.2], [-13, -3.5]]) {
    const stalk = natPart('prop_scene_mushroom', 'skin', { outline: 0.016 });
    if (stalk) {
      for (const [dx, dz, k] of [[0, 0, 1.15], [0.6, 0.32, 0.7]]) { // apart, so the caps never touch
        const t = new T.Group(); t.add(k === 1.15 ? stalk : natPart('prop_scene_mushroom', 'skin', { outline: 0.016 }), natPart('prop_scene_mushroom', 'cap', { outline: 0.018 }));
        t.scale.setScalar(k); place(g, t, x + dx, 0, z + dz, x + dx);
      }
      continue;
    }
    const st = mesh(geo.cyl(0.1, 0.12, 0.3, 8), 0xfff1d6, { outline: 0.012 }); st.position.set(x, 0.15, z);
    const cap = mesh(dome(0.26), 0xe8503a, { outline: 0.015 }); cap.position.set(x, 0.28, z);
    g.add(st, cap);
  }
  addFallenLeaves(g);
  addFallingLeaves(g, 45);
  return g;
}

function meadowWinter() {
  const g = makeMeadow({ ground: 0xf0f5fc, hills: [0xe2ebf7, 0xd2dff1], grass: null, patch: 0xdfe8f5, flowers: null,
    trees: [0x4fa66a, 0x5fb070], snow: true });
  place(g, makeSnowman(1.15), -10.2, 0, -5.6, 0.35);
  place(g, makeSnowman(0.6), 11.6, 0, -5, -0.4);
  for (const [x, z, s] of [[-13.5, -3, 1.0], [13.5, -2.6, 0.9], [-7.5, -9.5, 0.8], [9, -10, 0.9]]) place(g, makePine(s, true), x, 0, z);
  // snow drifts
  for (const [x, z, s] of [[-12, 0.5, 1.2], [12.5, 1, 1], [1.6, -8.6, 1.2], [-4, -9.4, 1]]) {
    const d = mesh(dome(1, 18, 6), 0xffffff, { outline: 0.02 }); d.scale.set(1.6 * s, 0.4 * s, 1 * s); d.position.set(x, 0, z); g.add(d);
  }
  // a frozen pond with shiny streaks
  const ice = new T.Mesh(geo.circle(2, 28), toon(0xbfe4fa)); ice.rotation.x = -Math.PI / 2; ice.scale.set(1.6, 0.75, 1); ice.position.set(6.5, 0.02, -7.5);
  g.add(ice);
  for (const [dx, dz, w] of [[-0.6, -0.3, 0.9], [0.5, 0.25, 0.6]]) {
    const st = new T.Mesh(geo.box(w, 0.01, 0.07), glowMat(0xffffff)); st.position.set(6.5 + dx, 0.035, -7.5 + dz); st.rotation.y = 0.5; g.add(st);
  }
  addSnowfall(g, 150);
  return g;
}

// ---------- world themes ----------
// level: 0/1/2 (store.level()). Each world gets a different season or time of day per level.
export function makeScenery(theme = 'meadow', level = 0) {
  seed = 7 + level * 101 + (theme === 'beach' ? 13 : theme === 'farm' ? 29 : theme === 'dressup' ? 41 : theme === 'build' ? 53 : 0);
  let g;
  if (theme === 'build') g = buildSite(level);
  else if (theme === 'dressup') g = level === 2 ? dressRainy() : level === 1 ? dressRoom() : dressShop();
  else if (theme === 'beach') g = level === 2 ? beachNight() : level === 1 ? beachSunset() : makeBeach();
  else if (theme === 'farm') g = level === 2 ? farmRain() : level === 1 ? farmHarvest() : makeFarm();
  else g = level === 2 ? meadowWinter() : level === 1 ? meadowAutumn() : makeMeadow();
  g.userData.theme = theme; g.userData.level = level;
  return g;
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
  for (const f of g.userData.anim || []) f(dt, t);
}

// ---------- World 5: the building site ----------
// Brick letters keeps the middle clear (heap x -6..-2, letter board x -0.7..6.3, picture x 6..8, all z -2..2);
// machines, cones and fences stand at the back (z < -4) and far sides (|x| > 9).
//   level 0: sunny sandpit site (crane, digger, sand heaps) · 1: brick yard at golden hour (pallets of bricks, cement
//   mixer, wheelbarrow) · 2: the site at night (stars, moon, tall work lights with soft beams, blinking lamps)
function trafficCone(s = 1) {
  const g = new T.Group();
  const base = mesh(geo.box(0.62, 0.08, 0.62), 0xff6a1a, { hull: 1.06 }); base.position.y = 0.04; g.add(base);
  const c = mesh(geo.cone(0.24, 0.78, 16), 0xff7a26, { outline: 0.02 }); c.position.y = 0.47; g.add(c);
  const band = mesh(geo.cyl(0.155, 0.19, 0.15, 16), 0xffffff, { outline: 0 }); band.position.y = 0.43; g.add(band);
  g.add(blobShadow(0.4));
  g.scale.setScalar(s);
  return g;
}
function siteBarrier(len, col = 0xff5a3a) {
  const g = new T.Group();
  const n = Math.max(2, Math.round(len / 2.2));
  for (let i = 0; i <= n; i++) {
    const x = -len / 2 + (len * i) / n;
    const post = mesh(geo.cyl(0.07, 0.07, 1.25, 8), 0xf2f2f2, { outline: 0.012 }); post.position.set(x, 0.62, 0); g.add(post);
    const foot = mesh(geo.box(0.5, 0.12, 0.5), 0x8a8f9a, { hull: 1.05 }); foot.position.set(x, 0.06, 0); g.add(foot);
  }
  for (const y of [0.85, 0.45]) {
    const k = Math.round(len / 0.45);
    for (let i = 0; i < k; i++) {
      const b = mesh(geo.box(len / k, 0.22, 0.06), i % 2 ? 0xffffff : col, { hull: 0, outline: 0 }); b.position.set(-len / 2 + (len / k) * (i + 0.5), y, 0.02); g.add(b);
    }
    const rim = mesh(geo.box(len, 0.24, 0.05), 0xffffff, { hull: 1.02 }); rim.position.set(0, y, 0); g.add(rim);
  }
  return g;
}
function toyCrane(col = 0xffc21a) {
  const g = new T.Group();
  const base = mesh(geo.box(2.2, 0.5, 2.2), 0x8a8f9a, { hull: 1.03 }); base.position.y = 0.25; g.add(base);
  const H = 10;
  const mast = mesh(geo.box(0.7, H, 0.7), col, { hull: 1.03 }); mast.position.y = H / 2 + 0.5; g.add(mast);
  // lattice: diagonal braces on the front face
  for (let i = 0; i < 9; i++) {
    const br = mesh(geo.box(0.08, 1.35, 0.04), 0xc98a12, { hull: 0, outline: 0 }); br.position.set(0, 1.1 + i * 1.08, 0.37); br.rotation.z = i % 2 ? 0.55 : -0.55; g.add(br);
  }
  const top = new T.Group(); top.position.y = H + 0.5; g.add(top);
  const cab = mesh(geo.box(1.1, 0.9, 1.0), col, { hull: 1.03 }); cab.position.set(0.2, 0.45, 0); top.add(cab);
  const win = mesh(geo.box(0.6, 0.45, 0.04), 0x9fd8ff, { hull: 0, outline: 0 }); win.position.set(0.2, 0.55, 0.52); top.add(win);
  const jib = mesh(geo.box(9.5, 0.45, 0.45), col, { hull: 1.03 }); jib.position.set(3.6, 1.15, 0); top.add(jib);
  const cj = mesh(geo.box(3, 0.4, 0.45), col, { hull: 1.03 }); cj.position.set(-2.2, 1.12, 0); top.add(cj);
  const weight = mesh(geo.box(0.9, 0.8, 0.7), 0x8a8f9a, { hull: 1.04 }); weight.position.set(-3.1, 0.6, 0); top.add(weight);
  const peak = mesh(geo.cone(0.4, 1.4, 4), col, { outline: 0.02 }); peak.position.set(0, 2.0, 0); top.add(peak);
  // the hook on its cable
  const hookG = new T.Group(); hookG.position.set(6.4, 0.95, 0); top.add(hookG);
  const cable = new T.Mesh(geo.cyl(0.025, 0.025, 4, 4), toon(0x3a3550)); cable.position.y = -2; hookG.add(cable);
  const block = mesh(geo.box(0.35, 0.3, 0.3), 0xff5a3a, { hull: 1.05 }); block.position.y = -4.1; hookG.add(block);
  const hook = mesh(geo.torus(0.16, 0.05, Math.PI * 1.3, 6, 12), 0x8a8f9a, { outline: 0.012 }); hook.position.y = -4.4; hook.rotation.z = Math.PI * 0.85; hookG.add(hook);
  g.userData.top = top; g.userData.hook = hookG;
  g.add(blobShadow(1.6));
  return g;
}
function toyDigger(col = 0xffc21a) {
  const g = new T.Group();
  for (const z of [-0.55, 0.55]) {
    const tr = mesh(geo.box(2.4, 0.55, 0.42), 0x4a4658, { hull: 1.04 }); tr.position.set(0, 0.3, z); g.add(tr);
    for (const x of [-0.85, 0, 0.85]) { const w = mesh(geo.cyl(0.2, 0.2, 0.46, 12), 0x8a8f9a, { outline: 0.012 }); w.rotation.x = Math.PI / 2; w.position.set(x, 0.3, z); g.add(w); }
  }
  const body = mesh(geo.box(2.0, 0.8, 1.3), col, { hull: 1.03 }); body.position.set(-0.1, 0.95, 0); g.add(body);
  const cab = mesh(geo.box(0.95, 1.0, 1.1), col, { hull: 1.03 }); cab.position.set(-0.45, 1.85, 0); g.add(cab);
  const win = mesh(geo.box(0.7, 0.55, 0.04), 0x9fd8ff, { hull: 0, outline: 0 }); win.position.set(-0.45, 1.95, 0.57); g.add(win);
  const roof = mesh(geo.box(1.15, 0.12, 1.25), 0x4a4658, { hull: 1.04 }); roof.position.set(-0.45, 2.42, 0); g.add(roof);
  const arm = new T.Group(); arm.position.set(0.6, 1.3, 0); g.add(arm);
  const a1 = mesh(geo.box(1.9, 0.32, 0.32), col, { hull: 1.04 }); a1.position.set(0.8, 0.5, 0); a1.rotation.z = 0.55; arm.add(a1);
  const a2 = mesh(geo.box(1.4, 0.28, 0.28), col, { hull: 1.04 }); a2.position.set(1.95, 0.55, 0); a2.rotation.z = -0.9; arm.add(a2);
  const bucket = mesh(geo.box(0.6, 0.45, 0.7), 0x8a8f9a, { hull: 1.05 }); bucket.position.set(2.35, -0.05, 0); bucket.rotation.z = 0.4; arm.add(bucket);
  g.userData.arm = arm;
  g.add(blobShadow(1.5));
  return g;
}
function sandHeap(r, col) {
  const d = mesh(dome(1, 20, 8), col, { outline: 0.025 }); d.scale.set(r * 1.4, r * 0.62, r); return d;
}
function brickStack(cols, rows, along, col = 0xd2553e, mortar = 0xf0e0c8) {
  // a pallet with a neat stack of real (small) bricks, alternate rows offset
  const g = new T.Group();
  const w = cols * 0.5 + 0.2, d = along * 0.42 + 0.2;
  const pal = mesh(geo.box(w, 0.2, d), 0xc08a52, { hull: 1.03 }); pal.position.y = 0.14; g.add(pal);
  for (const z of [-d / 2 + 0.1, d / 2 - 0.1]) { const sk = mesh(geo.box(w, 0.08, 0.14), 0xa87444, { hull: 0, outline: 0 }); sk.position.set(0, 0.04, z); g.add(sk); }
  const fill = mesh(geo.box(cols * 0.5, rows * 0.24, along * 0.42), mortar, { hull: 1.02 }); fill.position.y = 0.25 + rows * 0.12; g.add(fill);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const b = mesh(geo.box(0.46, 0.2, 0.03), r % 3 === 1 ? 0xc44a36 : col, { hull: 0, outline: 0 });
    b.position.set(-cols * 0.25 + 0.25 + c * 0.5 + (r % 2 ? 0.12 : -0.12) * (c === 0 || c === cols - 1 ? 0 : 1), 0.37 + r * 0.24, along * 0.21 + 0.016);
    g.add(b);
  }
  g.add(blobShadow(Math.max(w, d) * 0.6));
  return g;
}
function cementMixer() {
  const g = new T.Group();
  const frame = mesh(geo.box(1.6, 0.18, 0.9), 0x5a6a8a, { hull: 1.04 }); frame.position.y = 0.55; g.add(frame);
  for (const z of [-0.5, 0.5]) { const w = mesh(geo.cyl(0.36, 0.36, 0.16, 16), 0x3a3550, { outline: 0.015 }); w.rotation.x = Math.PI / 2; w.position.set(-0.4, 0.36, z); g.add(w); }
  const leg = mesh(geo.box(0.14, 0.55, 0.14), 0x5a6a8a, { hull: 1.05 }); leg.position.set(0.65, 0.28, 0); g.add(leg);
  const drum = new T.Group(); drum.position.set(0.05, 1.35, 0); drum.rotation.z = -0.6; g.add(drum);
  const body = mesh(geo.cyl(0.6, 0.72, 0.9, 20), 0xff7a26, { outline: 0.025 }); drum.add(body);
  const mouth = mesh(geo.cyl(0.36, 0.6, 0.45, 20), 0xff7a26, { outline: 0.025 }); mouth.position.y = 0.67; drum.add(mouth);
  const hole = new T.Mesh(geo.circle(0.32, 20), toon(0x4a3a3a)); hole.rotation.x = -Math.PI / 2; hole.position.y = 0.9; drum.add(hole);
  const back = mesh(geo.cyl(0.72, 0.4, 0.35, 20), 0xff7a26, { outline: 0.025 }); back.position.y = -0.62; drum.add(back);
  for (const y of [-0.15, 0.2]) { const st = mesh(geo.cyl(0.665, 0.69, 0.08, 20), 0xffc21a, { outline: 0 }); st.position.y = y; drum.add(st); }
  g.userData.drum = drum;
  g.add(blobShadow(1.0));
  return g;
}
function wheelbarrow(load = 0xd2553e) {
  const g = new T.Group();
  const tray = mesh(geo.cyl(0.75, 0.45, 0.5, 4, false), 0x3f8cff, { hull: 1.04 }); tray.rotation.y = Math.PI / 4; tray.scale.set(1.3, 1, 0.8); tray.position.set(0, 0.8, 0); g.add(tray);
  const wheel = mesh(geo.cyl(0.3, 0.3, 0.16, 16), 0x3a3550, { outline: 0.015 }); wheel.rotation.x = Math.PI / 2; wheel.position.set(0.95, 0.3, 0); g.add(wheel);
  for (const z of [-0.32, 0.32]) {
    const h = mesh(geo.cyl(0.045, 0.045, 1.9, 8), 0x8a8f9a, { outline: 0.01 }); h.rotation.z = Math.PI / 2 - 0.25; h.position.set(-0.3, 0.7, z); g.add(h);
    const l = mesh(geo.cyl(0.05, 0.05, 0.55, 8), 0x8a8f9a, { outline: 0.01 }); l.position.set(-0.6, 0.27, z); g.add(l);
  }
  for (let i = 0; i < 4; i++) { const b = mesh(geo.box(0.42, 0.2, 0.22), load, { hull: 1.06 }); b.position.set(-0.25 + (i % 2) * 0.45, 1.12 + Math.floor(i / 2) * 0.2, (i % 2 ? 0.12 : -0.12)); b.rotation.y = i * 0.6; g.add(b); }
  g.add(blobShadow(0.9));
  return g;
}
function siteCabin(col = 0x3f8cff) {
  const g = new T.Group();
  const body = mesh(geo.box(4.2, 2.4, 2.2), col, { hull: 1.02 }); body.position.y = 1.4; g.add(body);
  const roof = mesh(geo.box(4.5, 0.25, 2.5), 0xf2f2f2, { hull: 1.03 }); roof.position.y = 2.72; g.add(roof);
  const door = mesh(geo.box(0.9, 1.7, 0.06), 0xf2f2f2, { hull: 1.05 }); door.position.set(-1.2, 1.05, 1.12); g.add(door);
  const win = mesh(geo.box(1.5, 0.85, 0.06), 0x9fd8ff, { hull: 1.06 }); win.position.set(0.8, 1.65, 1.12); g.add(win);
  for (const x of [-1.6, 1.6]) { const leg = mesh(geo.box(0.3, 0.3, 2.0), 0x8a8f9a, { hull: 1.04 }); leg.position.set(x, 0.15, 0); g.add(leg); }
  g.userData.win = win;
  return g;
}
function workLight(h = 6.5, aim = 0) {
  const g = new T.Group();
  const foot = mesh(geo.box(1.1, 0.2, 1.1), 0x5a5f6a, { hull: 1.04 }); foot.position.y = 0.1; g.add(foot);
  const pole = mesh(geo.cyl(0.08, 0.11, h, 8), 0x8a8f9a, { outline: 0.012 }); pole.position.y = h / 2; g.add(pole);
  const bar = mesh(geo.box(1.4, 0.12, 0.12), 0x5a5f6a, { hull: 1.06 }); bar.position.y = h; g.add(bar);
  const heads = [];
  for (const x of [-0.45, 0.45]) {
    const hd = new T.Group(); hd.position.set(x, h + 0.05, 0.15); hd.rotation.x = 0.55; hd.rotation.z = aim; g.add(hd);
    const box = mesh(geo.box(0.55, 0.45, 0.3), 0xffc21a, { hull: 1.06 }); hd.add(box);
    const lens = new T.Mesh(geo.box(0.44, 0.34, 0.02), glowMat(0xfff6d0)); lens.position.z = 0.16; hd.add(lens);
    const gl = glow(0xfff0b0, 2.6, 0.85); gl.position.z = 0.3; hd.add(gl);
    heads.push(gl);
  }
  // the soft beam: a tall faint cone of light down onto the ground
  const beam = new T.Mesh(new T.ConeGeometry(2.6, h, 24, 1, true), new T.MeshBasicMaterial({ color: 0xfff2c0, transparent: true, opacity: 0.09, depthWrite: false, side: T.DoubleSide, fog: false, blending: T.AdditiveBlending }));
  beam.position.set(0, h / 2, 1.2); beam.rotation.x = -0.2;
  g.add(beam);
  const pool = new T.Mesh(geo.circle(2.6, 32), new T.MeshBasicMaterial({ color: 0xfff0b0, transparent: true, opacity: 0.16, depthWrite: false, fog: false, blending: T.AdditiveBlending }));
  pool.rotation.x = -Math.PI / 2; pool.position.set(0, 0.03, 2.2); pool.scale.set(1.3, 1, 1); g.add(pool);
  g.userData.heads = heads; g.userData.beam = beam;
  return g;
}
function blinkLamp(col = 0xff9a2a) {
  const g = new T.Group();
  const cap = mesh(geo.sphere(0.13, 12, 8), col, { outline: 0.012 }); g.add(cap);
  const gl = glow(col, 1.4, 0.8); g.add(gl);
  g.userData.gl = gl; g.userData.cap = cap;
  return g;
}
function buildGround(g, { floor, sand, rim, patch }) {
  const fl = new T.Mesh(geo.cyl(40, 40, 1, 48), toon(floor)); fl.position.y = -0.5; g.add(fl);
  // the big sandpit the game is played in, framed by chunky wooden planks
  const pit = new T.Mesh(geo.circle(1, 48), toon(sand)); pit.rotation.x = -Math.PI / 2; pit.scale.set(11.5, 6.2, 1); pit.position.set(0.3, 0.012, 0.2); g.add(pit);
  if (rim) {
    const n = 22;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const x = 0.3 + Math.cos(a) * 11.7, z = 0.2 + Math.sin(a) * 6.4;
      if (z < -3 && Math.abs(x) < 9) continue; // hidden behind the board anyway
      const p = mesh(geo.box(3.4, 0.32, 0.4), rim, { hull: 1.04 }); p.position.set(x, 0.16, z); p.rotation.y = -Math.atan2(Math.cos(a) * 6.4, -Math.sin(a) * 11.7); g.add(p);
    }
  }
  if (patch) addPatches(g, patch, 12);
}
function buildSite(level) {
  const g = new T.Group();
  g.userData.anim = [];
  const night = level === 2, gold = level === 1;
  buildGround(g, night ? { floor: 0x5e6a8e, sand: 0x9a8f9e, rim: 0x8a6a52, patch: 0x6a7496 }
    : gold ? { floor: 0xd9b07a, sand: 0xe8c48e, rim: 0xb9743a, patch: 0xcf9f68 }
      : { floor: 0xa9d86e, sand: 0xf3d79a, rim: 0xd8924f, patch: 0x98cc62 });
  // far hills
  for (const [x, z, r, c] of [[-16, -28, 9, 0], [6, -32, 12, 1], [24, -26, 8, 0], [-30, -24, 7, 1]]) {
    const cols = night ? [0x3f4e86, 0x34427a] : gold ? [0xe0a868, 0xc98a52] : [0x8fd06c, 0x7cc95c];
    const h = mesh(geo.sphere(1, 24, 12), cols[c], { outline: 0.02 }); h.scale.set(r * 1.6, r * 0.55, r); h.position.set(x, -0.5, z); g.add(h);
  }
  // the crane at the back left, slowly turning; the digger at the back right
  const crane = place(g, toyCrane(night ? 0xf0b81a : 0xffc21a), -12.5, 0, -15, 0.3);
  const top = crane.userData.top, hookG = crane.userData.hook;
  g.userData.anim.push((dt, t) => { top.rotation.y = 0.35 + Math.sin(t * 0.12) * 0.5; hookG.rotation.z = Math.sin(t * 0.9) * 0.04; });
  const dig = place(g, toyDigger(), 13.2, 0, -9.5, -0.5);
  const arm = dig.userData.arm;
  g.userData.anim.push((dt, t) => { arm.rotation.z = Math.sin(t * 0.6) * 0.12 - 0.05; });
  // a fence of striped barriers behind the board, cones here and there
  const bar = place(g, siteBarrier(14, night ? 0xff6a3a : 0xff5a3a), 1.5, 0, -6.6);
  [[-9.6, -3.4, 1], [-10.6, -2.4, 0.8], [10.2, -2.6, 1], [-9.2, 3.6, 0.85], [10.4, 3.2, 0.9]].forEach(([x, z, s]) => place(g, trafficCone(s), x, 0, z, x));
  if (level === 0) {
    // sunny sandpit: sand heaps with a spade, a blue site cabin, sun and clouds
    for (const [x, z, r] of [[-9.8, -6.5, 1.6], [10.5, -14.5, 2.2], [-4.5, -10.5, 1.8]]) place(g, sandHeap(r, 0xf0cd86), x, 0, z);
    const spade = new T.Group();
    const sh = mesh(geo.cyl(0.05, 0.05, 1.5, 8), 0xd8924f, { outline: 0.012 }); sh.position.y = 0.75; spade.add(sh);
    const bl = mesh(geo.box(0.42, 0.5, 0.06), 0x3f8cff, { hull: 1.06 }); bl.position.y = 0.1; spade.add(bl);
    spade.rotation.z = 0.35; place(g, spade, -9.2, 0.6, -6.2);
    place(g, siteCabin(0x3f8cff), 4.5, 0, -12.5, 0);
    g.add(makeSun(18, 11, -44));
    for (let i = 0; i < 4; i++) g.add(makeCloud(-18 + i * 12, 10 + (i % 2), -24 - (i % 2) * 4, 0.9 + (i % 3) * 0.2));
  } else if (gold) {
    // brick yard: pallets of bricks, a cement mixer and a full wheelbarrow, a low orange sun
    place(g, brickStack(5, 4, 3), -10.4, 0, -5.4, 0.25);
    place(g, brickStack(4, 5, 3, 0xc9513a), -6.5, 0, -9.5, -0.1);
    place(g, brickStack(6, 3, 3, 0xd8653e), 7.8, 0, -10.5, 0.15);
    place(g, brickStack(3, 3, 2), 10.6, 0, -4.2, -0.4);
    const mix = place(g, cementMixer(), 10.6, 0, 0.6, -0.6);
    const drum = mix.userData.drum;
    g.userData.anim.push((dt, t) => { drum.rotation.y = t * 1.6; });
    place(g, wheelbarrow(), -10.6, 0, 1.6, 0.5);
    place(g, siteCabin(0x4cc75a), 4.5, 0, -13, 0);
    g.add(makeSun(-6, 4.5, -44, 0xffb45a, { halo: 0xffc080, haloSize: 18, size: 1.4 }));
    for (let i = 0; i < 3; i++) g.add(makeCloud(-14 + i * 14, 11 + (i % 2), -26, 1.1, 0xffe0c8));
  } else {
    // night: stars, the moon, big work lights pouring warm light over the sandpit, blinking amber lamps
    addStars(g, 90);
    g.add(makeMoon(17, 11.5, -46, 0.9));
    const cab = place(g, siteCabin(0x3f6cbf), 4.5, 0, -12.5, 0);
    const lit = new T.Mesh(geo.box(1.4, 0.75, 0.02), glowMat(0xffe39a)); lit.position.set(0.8, 1.65, 1.16); cab.add(lit);
    const lights = [place(g, workLight(6.8, 0.25), -9.2, 0, -5.3, 0.55), place(g, workLight(6.8, -0.25), 10.4, 0, -4.4, -0.5)];
    const lamps = [];
    for (const [x, y, z] of [[-5.5, 1.35, -6.6], [1.5, 1.35, -6.6], [8.5, 1.35, -6.6]]) { const l = blinkLamp(); l.position.set(x, y, z); g.add(l); lamps.push(l); }
    const red = blinkLamp(0xff3a3a); red.position.set(0, 3.0, 0); crane.userData.top.add(red); lamps.push(red);
    g.userData.anim.push((dt, t) => {
      lamps.forEach((l, i) => { const on = Math.sin(t * 3.2 + i * 1.9) > 0.2; l.userData.gl.material.opacity = on ? 0.85 : 0.08; });
      lights.forEach((w, i) => { w.userData.beam.material.opacity = 0.085 + Math.sin(t * 7 + i) * 0.006; });
    });
    for (let i = 0; i < 3; i++) g.add(makeCloud(-18 + i * 15, 12 + (i % 2), -28, 1.0, 0x6070b0));
  }
  g.userData.clouds = g.children.filter((c) => c.userData.cloud);
  return g;
}
