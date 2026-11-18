// Props for Share the snacks: the snacks, the bins they come in, and the plates that light up when everyone has the same.
import * as T from '../three.js';
import { mesh, geo, toon, toonUnique, basic, blobShadow } from '../engine/toon.js';
import { makeCarrot, stillProp } from '../engine/farm.js';
import { propModel } from '../engine/prop-models.js';
import { makeBucket } from '../engine/beach.js';
import { makeFlower } from '../engine/scenery.js';

const PI = Math.PI;

// A Blender snack (or null), tinted, scaled to the old code size, with no idle sway.
function snackModel(kind, size, tint) {
  const pm = propModel(kind, { tint, size });
  return pm ? stillProp(pm) : null;
}

export function makeApple(s = 1, col = 0xf0453a) {
  const pm = snackModel('prop_farmapple', 0.97, col);
  if (pm) { // a crisp shine spot on the upper left (code-drawn so the tint never colours it)
    const shine = new T.Mesh(geo.sphere(0.05, 10, 8), basic(new T.Color(col).lerp(new T.Color(0xffffff), 0.72).getHex()));
    shine.position.set(-0.155, 0.12, 0.235); shine.scale.set(0.75, 1.3, 0.3); shine.lookAt(-0.155 * 3, 0.12 * 3, 0.235 * 3);
    pm.add(shine);
    pm.scale.setScalar(s);
    return pm;
  }
  const g = new T.Group();
  const a = mesh(geo.sphere(0.3, 18, 14), col, { outline: 0.022 });
  a.scale.set(1, 0.9, 1);
  const shine = new T.Mesh(geo.sphere(0.07, 8, 6), basic(0xffd0c8));
  shine.position.set(-0.13, 0.1, 0.24); shine.scale.set(1, 1.4, 0.5);
  const stem = mesh(geo.cyl(0.025, 0.035, 0.18, 6), 0x7a4a26, { outline: 0.01 });
  stem.position.y = 0.3; stem.rotation.z = -0.25;
  const leaf = mesh(geo.sphere(0.1, 10, 6), 0x4fb84a, { outline: 0.01 });
  leaf.scale.set(1.2, 0.35, 0.6); leaf.position.set(0.1, 0.33, 0); leaf.rotation.z = 0.5;
  g.add(a, shine, stem, leaf);
  g.scale.setScalar(s);
  return g;
}

export function makeCorn(s = 1) {
  const pm = snackModel('prop_corn', 0.95);
  if (pm) { pm.scale.setScalar(s); return pm; }
  const g = new T.Group();
  const cob = mesh(geo.cyl(0.17, 0.13, 0.8, 14), 0xffd23f, { outline: 0.022 });
  const tip = mesh(geo.sphere(0.17, 14, 8), 0xffd23f, { outline: 0.022 }); tip.position.y = 0.4; tip.scale.y = 0.8;
  for (let i = 0; i < 5; i++) {
    const r = new T.Mesh(geo.torus(0.165 - i * 0.008, 0.018, PI * 2, 4, 16), basic(0xf2b51d));
    r.rotation.x = PI / 2; r.position.y = 0.3 - i * 0.15;
    cob.add(r);
  }
  g.add(cob, tip);
  for (const [rz, ry] of [[0.5, 0], [-0.5, 0.4], [0.1, 2.2]]) {
    const h = mesh(geo.sphere(0.16, 10, 8), 0x7cc95c, { outline: 0.014 });
    h.scale.set(0.55, 2.0, 0.35); h.position.set(Math.sin(rz) * 0.12, -0.28, 0); h.rotation.set(0, ry, rz);
    g.add(h);
  }
  g.scale.setScalar(s);
  return g;
}

export function makeFish(s = 1) {
  const pm = snackModel('prop_fish', 0.88);
  if (pm) { pm.scale.setScalar(s); return pm; }
  const g = new T.Group();
  const body = mesh(geo.sphere(0.3, 16, 12), 0x6fb6e8, { outline: 0.022 });
  body.scale.set(1.5, 0.85, 0.5);
  const belly = new T.Mesh(geo.sphere(0.24, 12, 8), toon(0xdff1ff));
  belly.scale.set(1.3, 0.5, 0.45); belly.position.set(0.02, -0.1, 0.03);
  const tail = mesh(geo.cone(0.22, 0.32, 3), 0x4a90d8, { outline: 0.016 });
  tail.rotation.z = PI / 2; tail.position.x = -0.55; tail.scale.z = 0.4;
  const eye = new T.Mesh(geo.circle(0.06, 12), basic(0x3a2838));
  eye.position.set(0.28, 0.06, 0.155);
  const eyeB = eye.clone(); eyeB.position.z = -0.155; eyeB.rotation.y = PI;
  const fin = mesh(geo.cone(0.12, 0.2, 3), 0x4a90d8, { outline: 0.012 });
  fin.position.set(-0.02, 0.27, 0); fin.scale.z = 0.4;
  g.add(body, belly, tail, eye, eyeB, fin);
  g.scale.setScalar(s);
  return g;
}

export function makeCookie(s = 1) {
  const pm = snackModel('prop_cookie', 0.84);
  if (pm) { pm.scale.setScalar(s); return pm; }
  const g = new T.Group();
  const c = mesh(geo.cyl(0.3, 0.3, 0.1, 20), 0xd9a05b, { outline: 0.02 });
  c.rotation.x = PI / 2;
  for (const [x, y] of [[-0.12, 0.1], [0.1, 0.13], [0.03, -0.04], [-0.1, -0.13], [0.15, -0.1]]) {
    const chip = new T.Mesh(geo.sphere(0.045, 8, 6), toon(0x5a3420));
    chip.position.set(x, y, 0.05); chip.scale.z = 0.5;
    g.add(chip);
  }
  g.add(c);
  g.scale.setScalar(s);
  return g;
}

// (hull: a true-shape collider, so a long carrot or cob lies flat on the plate instead of sinking into it.)
// lay: how the snack rests on a plate. held: tilt while carried. size: on-plate scale. gap: spacing on the plate.
export const SNACKS = {
  // carrots and cobs lie side by side on the plate, tips toward the child (never end to end through each other)
  carrot: { make: () => makeCarrot(1), lay: [0, -1.15, 1.45], held: 1.3, show: 0.85, size: 0.72, y: 0.3, gap: 0.46, plural: 'carrots', hull: true },
  apple: { make: () => makeApple(1.15), lay: [0, 0, 0], held: 0, size: 0.95, y: 0.4, gap: 0.62, plural: 'apples' },
  corn: { make: () => makeCorn(1.15), lay: [0, 1.15, 1.45], held: 1.3, show: 0.85, size: 0.74, y: 0.3, gap: 0.46, plural: 'corn', hull: true },
  // the fish lies on its side, tilted up to the camera, as big as it looked waiting on the bin
  fish: { make: () => makeFish(1.2), lay: [-0.9, 0, 0], held: 0.2, size: 0.95, y: 0.4, gap: 0.5, plural: 'fish', hull: true, rows: true },
  cookie: { make: () => makeCookie(1.25), lay: [-1.2, 0, 0], held: 0, size: 0.95, y: 0.42, gap: 0.62, plural: 'cookies', hull: true },
};
// Where the i-th of `each` snacks rests on a plate ([x, z] from the plate centre). Long snacks (carrots, cobs) lie side
// by side; apples sit in a little triangle when there are three; fish (long sideways) lie one behind the other.
export function slotAt(kind, i, each) {
  const sp = SNACKS[kind], g = sp.gap;
  if (each === 1) return [0, 0];
  if (sp.rows) { const k = i - (each - 1) / 2; return [k * 0.16, k * (each === 2 ? 0.46 : 0.4)]; }
  if (each === 3 && kind === 'apple') return [[-g / 2, -0.2], [g / 2, -0.2], [0, 0.32]][i];
  return [(i - (each - 1) / 2) * g, 0];
}
export function makeSnack(kind) {
  const s = SNACKS[kind].make();
  s.userData.snack = kind;
  return s;
}

// ---------- bins ----------
function crate(wood, dark) {
  const pm = propModel('prop_crate', { tint: wood });
  if (pm) {
    stillProp(pm);
    pm.add(blobShadow(1.5));
    pm.userData.sign = new T.Vector3(0, 0.5, 0.79);
    pm.userData.top = 0.87;
    pm.userData.scale = 0.64;
    return pm;
  }
  const g = new T.Group();
  const inside = mesh(geo.box(2.5, 0.86, 1.3), 0x5a3a20, { outline: 0 }); inside.position.y = 0.45;
  g.add(inside);
  for (const y of [0.2, 0.5, 0.8]) {
    for (const z of [-0.7, 0.7]) { const s = mesh(geo.box(2.72, 0.22, 0.1), wood, { hull: 1.025 }); s.position.set(0, y, z); g.add(s); }
    for (const x of [-1.33, 1.33]) { const s = mesh(geo.box(0.1, 0.22, 1.42), wood, { hull: 1.025 }); s.position.set(x, y, 0); g.add(s); }
  }
  for (const x of [-1.33, 1.33]) for (const z of [-0.7, 0.7]) {
    const p = mesh(geo.box(0.2, 1.0, 0.2), dark, { hull: 1.06 }); p.position.set(x, 0.5, z); g.add(p);
  }
  // a little hand-painted sign on the front
  const sign = mesh(geo.cyl(0.36, 0.36, 0.06, 24), 0xfff6e6, { outline: 0.018 });
  sign.rotation.x = PI / 2; sign.position.set(0, 0.5, 0.79);
  g.add(sign);
  g.userData.sign = new T.Vector3(0, 0.5, 0.86);
  g.userData.top = 0.9;
  return g;
}
function basket(col) {
  const pm = propModel('prop_wicker', { size: 0.86 });
  if (pm) { // the woven basket, with a round cream sign tied on the front
    stillProp(pm);
    const sign = mesh(geo.cyl(0.36, 0.36, 0.06, 28), 0xfff6e6, { outline: 0.018 });
    sign.rotation.x = PI / 2; sign.position.set(0, 0.5, 1.2); sign.rotation.z = 0.05;
    pm.add(sign, blobShadow(1.5));
    pm.userData.sign = new T.Vector3(0, 0.5, 1.23);
    pm.userData.top = 0.56;
    pm.userData.scale = 0.64;
    return pm;
  }
  const g = new T.Group();
  const b = mesh(geo.cyl(1.35, 1.0, 0.95, 26), col, { outline: 0.03 }); b.position.y = 0.48;
  const dark = new T.Color(col).multiplyScalar(0.72).getHex();
  for (const y of [0.22, 0.48, 0.74]) {
    const r = mesh(geo.torus(1.0 + y * 0.37, 0.05, PI * 2, 6, 32), dark, { outline: 0 });
    r.rotation.x = PI / 2; r.position.y = y; g.add(r);
  }
  const rim = mesh(geo.torus(1.36, 0.1, PI * 2, 8, 32), dark, { outline: 0.02 }); rim.rotation.x = PI / 2; rim.position.y = 0.95;
  const inside = new T.Mesh(geo.circle(1.3, 26), toon(0x6b4424)); inside.rotation.x = -PI / 2; inside.position.y = 0.9;
  const handle = mesh(geo.torus(1.25, 0.07, PI, 6, 24), dark, { outline: 0.015 });
  handle.position.set(0, 0.95, -0.3); handle.rotation.x = -0.35;
  g.add(b, rim, inside, handle, blobShadow(1.4));
  g.userData.sign = new T.Vector3(0, 0.5, 1.2);
  g.userData.top = 0.95;
  return g;
}
function pail() {
  const g = makeBucket(0x4a90ff, 1.15, 1.0);
  if (g.userData.model) g.userData.model.rotation.y = Math.PI; // its own star sticker turned to the back (the fish picture goes in front)
  // a pail of water: the fish stand up in it, heads out
  const water = new T.Mesh(geo.circle(1.0, 32), toon(0x7fd0ff)); water.rotation.x = -PI / 2; water.position.y = 0.8;
  g.add(water);
  g.userData = { sign: new T.Vector3(0, 0.5, 1.035), top: 0.8, water: true, scale: 0.58, dz: -0.25 };
  return g;
}

const BINS = {
  carrot: () => crate(0xd9a05b, 0xa86f3a),
  apple: () => basket(0xd9a85b),
  corn: () => crate(0xe2574a, 0xa8382c),
  fish: () => pail(),
  cookie: () => basket(0xff9fc0),
};
// A bin of snacks, packed neatly so nothing pokes through anything else: carrots and cobs lie side by side (tops
// alternating front and back), apples sit four-and-one in a little pyramid, cookies lie flat two layers deep and fish
// stand up in the pail's water. One more is stuck on the sign (flattened like a sticker), so the bin says what's inside.
export function makeBin(kind) {
  const g = BINS[kind]();
  const sp = SNACKS[kind];
  const top = g.userData.top, K = 0.7;
  const put = (x, y, z, rx, ry, rz) => { const s = makeSnack(kind); s.position.set(x, y, z); s.rotation.set(rx, ry, rz); s.scale.multiplyScalar(K); g.add(s); return s; };
  if (kind === 'carrot' || kind === 'corn') {
    const r = kind === 'carrot' ? 0.275 * K : 0.2 * 1.15 * K, gap = kind === 'carrot' ? 0.42 : 0.46;
    for (let i = 0; i < 5; i++) put((i - 2) * gap, top + r, 0, (i % 2 ? 1 : -1) * PI / 2, 0, (i % 2 ? 0.6 : -0.4));
  } else if (kind === 'apple') {
    const r = 0.31 * 0.97 * 1.15 * K;
    for (const [x, z] of [[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25]]) put(x, top + r, z, 0, x * 3 + z, 0);
    put(0, top + r + 0.33, 0, 0, 0.4, 0.1);
  } else if (kind === 'cookie') {
    const ht = 0.075;
    for (const [x, z] of [[-0.29, -0.29], [0.29, -0.29], [-0.29, 0.29], [0.29, 0.29]]) put(x, top + ht, z, -PI / 2, 0, x * 2 + z);
    put(0, top + 3 * ht, -0.22, -PI / 2, 0, 0.5); put(0.05, top + 3 * ht, 0.3, -PI / 2, 0, 1.2);
  } else { // fish floating on their sides in the water, side up to the camera, in a loose fan
    for (const [x, z, ry] of [[-0.44, -0.22, 0.35], [0.46, -0.18, -0.3], [0.02, 0.2, 0.08]]) put(x, top + 0.08, z, -1.0, ry, 0);
  }
  const icon = makeSnack(kind);
  icon.rotation.set(0, 0, kind === 'cookie' || kind === 'apple' ? 0 : sp.lay[2] * 0.7);
  icon.scale.multiplyScalar(0.55); icon.scale.z *= 0.32;   // a sticker: flattened onto the sign
  icon.position.copy(g.userData.sign).add(new T.Vector3(0, 0, 0.06));
  g.add(icon);
  return g;
}

let _glowTex = null;
function glowTex() {
  if (_glowTex) return _glowTex;
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d');
  const gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(0.55, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
  _glowTex = new T.CanvasTexture(c); _glowTex.colorSpace = T.SRGBColorSpace; _glowTex.userData.shared = true;
  return _glowTex;
}
// ---------- plates (a different style per level: china plate, wooden bowl, big leaf) ----------
const GOLD = new T.Color(0xffd23f);
// userData.floorY: where snacks rest (the physics floor), userData.rr: the inside radius snacks can land in
export function makePlate(color, each, kind, style = 'plate') {
  const g = new T.Group();
  const rimMat = toonUnique(color);
  let rim, floorY, rr = 0.82;
  const PM = { plate: 'prop_chinaplate', bowl: 'prop_woodbowl', leaf: 'prop_leafplate' };
  const pm = propModel(PM[style], { tint: color });
  if (pm) { // Blender plate: its tinted skin is the rim band that lights up gold
    stillProp(pm);
    rimMat.dispose();
    rim = pm.userData.model.userData.skin;
    g.add(pm);
    floorY = style === 'bowl' ? 0.245 : style === 'leaf' ? 0.155 : 0.125;
    rr = style === 'bowl' ? 0.8 : style === 'leaf' ? 0.85 : 0.8;
  } else if (style === 'bowl') {
    const wood = mesh(geo.cyl(1.0, 0.72, 0.32, 28), 0xb8763e, { outline: 0.025 }); wood.position.y = 0.16;
    const band = new T.Mesh(geo.cyl(0.92, 0.86, 0.09, 28), rimMat); band.position.y = 0.14; band.scale.set(1.04, 1, 1.04);
    const inside = new T.Mesh(geo.circle(0.92, 28), toon(0x8a5228)); inside.rotation.x = -PI / 2; inside.position.y = 0.325;
    rim = mesh(geo.torus(0.96, 0.06, PI * 2, 8, 32), 0xd9965a, { outline: 0.012 }); rim.rotation.x = PI / 2; rim.position.y = 0.32;
    g.add(wood, band, inside, rim);
    rim = band; floorY = 0.33;
  } else if (style === 'leaf') {
    const leaf = mesh(geo.sphere(1, 28, 12), 0x5cc45a, { outline: 0.02 }); leaf.scale.set(1.25, 0.09, 0.9); leaf.position.y = 0.06;
    const vein = new T.Mesh(geo.box(2.2, 0.02, 0.05), basic(0x3f9a3e)); vein.position.y = 0.15;
    for (const s of [-1, 1]) for (const x of [-0.5, 0.1, 0.6]) { const v = new T.Mesh(geo.box(0.5, 0.02, 0.035), basic(0x3f9a3e)); v.position.set(x, 0.15, s * 0.22); v.rotation.y = s * 0.7; g.add(v); }
    rim = mesh(geo.torus(1.0, 0.06, PI * 2, 8, 36), color, { outline: 0.01, mat: rimMat }); rim.rotation.x = PI / 2; rim.scale.set(1.2, 0.86, 1); rim.position.y = 0.1;
    g.add(leaf, vein, rim);
    floorY = 0.15; rr = 0.85;
  } else {
    const base = mesh(geo.cyl(1.0, 0.8, 0.12, 28), 0xffffff, { outline: 0.025 });
    base.position.y = 0.06;
    rim = mesh(geo.torus(0.92, 0.07, PI * 2, 8, 32), color, { outline: 0.012, mat: rimMat });
    rim.rotation.x = PI / 2; rim.position.y = 0.13;
    g.add(base, rim);
    floorY = 0.13;
  }
  // the gold glow under a full plate: a soft additive radial pool, never a hard-edged disc
  const glowMat = new T.MeshBasicMaterial({ color: 0xfff9c4, map: glowTex(), transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending });
  const glow = new T.Mesh(geo.circle(1.6, 40), glowMat);
  glow.rotation.x = -PI / 2; glow.position.y = 0.03; glow.renderOrder = -1;
  g.add(glow);
  // dotted rings: one empty spot for each snack this friend will get (cream on the dark wooden bowl)
  const slotMat = new T.MeshBasicMaterial({ color: style === 'bowl' ? 0xfff6e6 : 0x3a2838, transparent: true, opacity: style === 'bowl' ? 0.8 : 0.55, depthWrite: false });
  const slots = [];
  const sy = floorY + (style === 'leaf' ? 0.035 : 0.008);
  for (let i = 0; i < each; i++) {
    const r = new T.Mesh(geo.ring(0.16, 0.23, 24), slotMat);
    const [sx, sz] = slotAt(kind, i, each);
    r.rotation.x = -PI / 2; r.position.set(sx, sy, 0.05 + sz);
    r.renderOrder = 1;
    g.add(r); slots.push(r);
  }
  g.userData = { rim, rimMat: pm ? rim.material : rimMat, glow, glowMat, slots, base: new T.Color(color), lit: 0, floorY, rr, style };
  return g;
}
// k: 0 = normal, 1 = fully lit gold.
export function lightPlate(p, k) {
  const u = p.userData;
  u.lit = k;
  u.rimMat.color.copy(u.base).lerp(GOLD, k);
  u.rimMat.emissive.copy(GOLD).multiplyScalar(k * 0.45);
  u.glowMat.opacity = k * 0.9;
}

// ---------- the place where the sharing happens: a different set for each level ----------
function checkerTex(a, b, n = 8) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d'), w = 256 / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { x.fillStyle = (i + j) % 2 ? a : b; x.fillRect(i * w, j * w, w, w); }
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.wrapS = t.wrapT = T.RepeatWrapping;
  return t;
}
function flagString(g, x0, x1, y, z, cols) {
  const n = Math.round((x1 - x0) / 0.75);
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n, x = x0 + (x1 - x0) * t, yy = y - Math.sin(t * PI) * 0.7;
    const pf = propModel('prop_pennant', { tint: cols[i % cols.length] });
    if (pf) { stillProp(pf); pf.position.set(x, yy - 0.02, z); pf.rotation.z = (t - 0.5) * 0.35; pf.userData.flag = i; g.add(pf); continue; }
    const f = mesh(geo.cone(0.26, 0.55, 3), cols[i % cols.length], { outline: 0.012 });
    f.rotation.x = PI; f.position.set(x, yy - 0.3, z); f.scale.z = 0.25;
    f.userData.flag = i; g.add(f);
  }
  const rope = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(x0, y, z), new T.Vector3((x0 + x1) / 2, y - 0.72, z), new T.Vector3(x1, y, z)]), 24, 0.025, 5), basic(0x6b4424));
  g.add(rope);
}
export const SET_STYLE = ['plate', 'bowl', 'leaf'];
// The picnic blanket: soft cloth (a finely divided sheet) with square red-and-cream checks, rounded corners, two gentle
// folds out at the ends where nothing stands, edges that settle onto the grass, and a rolled hem with an ink line.
function makeBlanket(w, d) {
  const g = new T.Group();
  const CHECK = 0.65, rc = 0.35, hw = w / 2, hd = d / 2;
  const geom = new T.PlaneGeometry(w, d, 104, 50);
  geom.rotateX(-PI / 2);
  const pos = geom.attributes.position, uv = geom.attributes.uv;
  const bump = (u, w0) => Math.exp(-((u / w0) ** 2));
  const fold = (x, z) => 0.05 * bump(x + 0.35 * z + 5.3, 0.3) + 0.04 * bump(x - 0.25 * z - 5.5, 0.28);
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i), z = pos.getZ(i);
    // round the corners: pull corner vertices onto the corner arc
    const cx = Math.max(Math.abs(x) - (hw - rc), 0), cz = Math.max(Math.abs(z) - (hd - rc), 0);
    const r = Math.hypot(cx, cz);
    if (r > rc) { const k = rc / r; x = Math.sign(x) * (hw - rc + cx * k); z = Math.sign(z) * (hd - rc + cz * k); }
    const edge = Math.min(hw - Math.abs(x), hd - Math.abs(z));
    const y = 0.035 + fold(x, z) - 0.025 * Math.max(0, 1 - edge / 0.25);
    pos.setXYZ(i, x, y, z);
    uv.setXY(i, (x + hw) / (CHECK * 10), (z + hd) / (CHECK * 10));
  }
  geom.computeVertexNormals();
  const tex = checkerTex('#ff6b6b', '#fff6e6', 10);
  tex.anisotropy = 4;
  const cloth = new T.Mesh(geom, toonUnique(0xffffff, { map: tex }));
  g.add(cloth);
  // the rolled hem all the way round (a soft tube just inside the edge, with its own ink)
  const pts = [];
  const ins = 0.03, rr = rc - ins;
  const corners = [[hw - rc, hd - rc, 0], [-(hw - rc), hd - rc, PI / 2], [-(hw - rc), -(hd - rc), PI], [hw - rc, -(hd - rc), 1.5 * PI]];
  corners.forEach(([cx, cz, a0], ci) => {
    for (let j = 0; j <= 6; j++) { const a = a0 + (j / 6) * (PI / 2); pts.push(new T.Vector3(cx + Math.cos(a) * rr, 0.03, cz + Math.sin(a) * rr)); }
    // the straight edge to the next corner
    const [nx, nz, na] = corners[(ci + 1) % 4];
    const e0 = pts[pts.length - 1], e1 = new T.Vector3(nx + Math.cos(na) * rr, 0.03, nz + Math.sin(na) * rr);
    for (let j = 1; j < 12; j++) pts.push(e0.clone().lerp(e1, j / 12));
  });
  const hem = mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts, true), 220, 0.05, 8, true), 0xe0503f, { outline: 0.015 });
  g.add(hem);
  return g;
}
// A Blender prop placed in world space (set group at the origin), or null when the model is not built.
function place(g, kind, x, y, z, { s = 1, ry = 0, tint } = {}) {
  const pm = propModel(kind, tint !== undefined ? { tint } : {});
  if (!pm) return null;
  stillProp(pm);
  pm.position.set(x, y, z); pm.rotation.y = ry; pm.scale.setScalar(s);
  g.add(pm);
  return pm;
}
// Everything is laid out at its final size and place (the lesson does not stretch the set):
//  friends stand at z -0.6, plates at z 1.35-1.5, the bin at z 3.9, the rug of fed friends at z -3.2 (x -4.3..4.3).
export function makeSet(level) {
  const g = new T.Group();
  if (level === 0) {
    // a picnic: a big soft checked blanket (square checks, a rolled hem, gentle folds near the ends)
    const bl = makeBlanket(13, 6.2);
    bl.position.set(0, 0, 1.55);
    g.add(bl);
    for (const [x, z, c] of [[-4.8, -2.4, 0xffffff], [7.4, -1.8, 0xffd23f], [7.8, 2.8, 0xff8fc0], [-8.4, 2.9, 0xa77bff]]) {
      const f = makeFlower(c); f.position.set(x, 0, z); f.scale.setScalar(1.4); g.add(f);
    }
  } else if (level === 1) {
    // inside the barn: a tall red plank wall with a hay loft beam behind, a straw-strewn plank floor, hay bales in the
    // back corners and two lanterns hung on the wall above the friends' heads
    if (!place(g, 'prop_barnback', 0, 0, -4.75)) {
      const wall = mesh(geo.box(24, 6.6, 0.3), 0xc9483a, { outline: 0 }); wall.position.set(0, 3.3, -4.8); g.add(wall);
    }
    if (!place(g, 'prop_strawfloor', 0, 0, 0.4)) {
      const floor = mesh(geo.box(24, 0.05, 10.4), 0xf0d27a, { outline: 0 }); floor.position.set(0, 0.02, 0.4); g.add(floor);
    }
    place(g, 'prop_hay', -9.0, 0, -3.7, { s: 1.15, ry: 0.15 });
    place(g, 'prop_hay', 9.0, 0, -3.7, { s: 1.15, ry: -0.15 });
    for (const x of [-1.75, 1.75]) {
      if (!place(g, 'prop_barnlantern', x, 3.05, -4.45, { s: 1 })) {
        const lamp = mesh(geo.cyl(0.18, 0.22, 0.42, 10), 0xffd23f, { outline: 0.015, mat: toonUnique(0xffe48a, { emissive: 0xffb020, emissiveIntensity: 0.5 }) });
        lamp.position.set(x, 3.0, -4.4); g.add(lamp);
      }
    }
  } else {
    // a garden party: a big woven rug with a fringe, bunting flags between two poles well clear of Pip and the friends
    if (!place(g, 'prop_partyrug', 0, 0, 1.0)) {
      const rug = new T.Mesh(geo.circle(1, 48), toon(0xa77bff)); rug.rotation.x = -PI / 2; rug.scale.set(7.2, 3.3, 1); rug.position.set(0, 0.05, 1.0);
      rug.material.polygonOffset = true; rug.material.polygonOffsetFactor = -2;
      g.add(rug);
    }
    // (behind the hay bench, so the flags never hang in front of the friends sitting on it)
    for (const x of [-8.2, 8.2]) { const p = mesh(geo.cyl(0.08, 0.1, 4.6, 8), 0xfff6e6, { outline: 0.015 }); p.position.set(x, 2.3, -4.7); g.add(p); const k = mesh(geo.sphere(0.16, 10, 8), 0xffd23f, { outline: 0.012 }); k.position.set(x, 4.65, -4.7); g.add(k); }
    flagString(g, -8.2, 8.2, 4.45, -4.7, [0xff5a5a, 0xffd23f, 0x4a90ff, 0x5fd068, 0xff8fc0]);
  }
  g.userData.level = level;
  return g;
}
// The bench along the back where each round's first (fed) friend comes to sit: four hay bales in a row, top at y 1.69
// (high enough that the friends sitting on it show above the heads of the friends in the row).
export function makeBench() {
  const g = new T.Group();
  for (const [x, ry] of [[-3.0, 0.03], [-1.0, -0.02], [1.0, 0.025], [3.0, -0.03]]) {
    const pm = propModel('prop_hay', { size: [0.8, 0.94, 0.8] });
    if (pm) {
      stillProp(pm);
      const L = pm.userData.model.userData.layers || {};
      if (L.straws) { L.straws.mesh.visible = false; L.straws.outline.visible = false; } // nothing pokes up where they sit
      pm.position.set(x, 0, 0); pm.rotation.y = ry;
      g.add(pm);
    } else {
      const b = mesh(geo.box(2.0, 1.69, 1.5), 0xf0c648, { outline: 0.02 }); b.position.set(x, 0.845, 0); g.add(b);
    }
  }
  return g;
}
