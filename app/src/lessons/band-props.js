// Props for Barn band: the four instruments (each in a big/loud and small/quiet size) and the light-up beat dots.
import * as T from '../three.js';
import { mesh, geo, toon, toonUnique, basic, blobShadow } from '../engine/toon.js';
import { makeDrum, stillProp } from '../engine/farm.js';
import { propModel } from '../engine/prop-models.js';
import { makePumpkin } from '../engine/scenery.js';
import { makeApple, makeCorn } from './share-props.js';

// A still Blender prop (or null), and helpers to colour one of its white-painted layers and to get a flashable material.
function still(kind, opts) { const pm = propModel(kind, opts); return pm ? stillProp(pm) : null; }
function tintLayer(pm, name, col) {
  const l = pm.userData.model.userData.layers[name];
  if (!l) return null;
  l.mesh.material = toonUnique(col, { vertexColors: true });
  return l.mesh.material;
}
const skinMat = (pm) => pm.userData.model.userData.skin.material; // unique per instance (tinted props)

const PI = Math.PI;
export const LOUD = 0xff5a5a, QUIET = 0x4a90ff;

function flashMat(color) { return toonUnique(color); }

function drum(big) {
  const g = big ? makeDrum(0xd94f3d, 1.55, 1.4) : makeDrum(0x4a90ff, 0.85, 0.8);
  const { skin, h, r } = g.userData;
  skin.material = flashMat(0xfff6e6);
  return { g, h, r, mats: [skin.material] };
}

function bucket(big) {
  const r = big ? 1.35 : 0.78, h = big ? 1.55 : 0.9, col = big ? 0xff6a4a : 0x4aa8ff;
  const pm = still('prop_bucket', { tint: col, size: [r, h / 1.3, r] });
  if (pm) { // the Blender pail turned over: its base is the drum head; the handle flops against the front
    const m = pm.userData.model;
    m.rotation.z = Math.PI; m.position.y = h;
    if (pm.userData.bones.handle) pm.userData.bones.handle.rotation.x = 1.85;
    pm.add(blobShadow(r * 1.1));
    return { g: pm, h, r: r * 0.8, mats: [skinMat(pm)] };
  }
  const g = new T.Group();
  // upside-down bucket: wide at the bottom, the base is the drum head
  const body = mesh(geo.cyl(r * 0.8, r, h, 26), col, { outline: 0.03 });
  body.position.y = h / 2;
  const light = new T.Color(col).offsetHSL(0, 0, 0.12).getHex();
  const rim = mesh(geo.torus(r * 1.0, 0.09 * (big ? 1 : 0.7), PI * 2, 8, 30), light, { outline: 0.015 });
  rim.rotation.x = PI / 2; rim.position.y = 0.08;
  for (const y of [0.45, 0.75]) {
    const rr = r * (1 - y * 0.2);
    const ridge = mesh(geo.torus(rr, 0.035, PI * 2, 6, 30), light, { outline: 0 });
    ridge.rotation.x = PI / 2; ridge.position.y = h * y; g.add(ridge);
  }
  const mat = flashMat(light);
  const top = new T.Mesh(geo.circle(r * 0.8, 26), mat);
  top.rotation.x = -PI / 2; top.position.y = h + 0.005;
  g.add(body, rim, top, blobShadow(r * 1.1));
  return { g, h, r, mats: [mat] };
}

function pot(big) {
  const r = big ? 1.3 : 0.75, h = big ? 1.15 : 0.66, accent = big ? LOUD : QUIET;
  const pm = still('prop_cookpot', { tint: 0xffffff, size: [r, h / 0.88, r] });
  if (pm) { // a steel cooking pot with coloured handles, and a wooden spoon pivoting at its handle end
    tintLayer(pm, 'handles', accent);
    const spoon = new T.Group();
    const len = big ? 1.5 : 1.0;
    const sm = still('prop_farmspoon', { size: len });
    if (sm) spoon.add(sm);
    spoon.position.set(r + len * 0.55, h + len * 0.75, 0.3);
    spoon.userData.rest = -1.35;
    spoon.rotation.z = spoon.userData.rest;
    // the pot is hollow: a dark inner bottom just under the rim is what the little things sit on (seen over the rim)
    const fill = new T.Mesh(geo.circle(r * 0.9, 32), toon(0x4a5060)); fill.rotation.x = -PI / 2; fill.position.y = h - 0.07;
    pm.add(spoon, fill, blobShadow(r * 1.1));
    return { g: pm, h, r, mats: [skinMat(pm)], spoon };
  }
  const g = new T.Group();
  const mat = flashMat(0xb9c3d1);
  const body = mesh(geo.cyl(r, r * 0.92, h, 26), 0xb9c3d1, { outline: 0.03, mat });
  body.position.y = h / 2;
  const shine = new T.Mesh(geo.box(0.12, h * 0.6, 0.02), basic(0xffffff));
  shine.position.set(-r * 0.45, h * 0.55, r * 0.86); shine.rotation.y = -0.5;
  const rim = mesh(geo.torus(r, 0.07, PI * 2, 8, 30), 0x8a94a6, { outline: 0.015 });
  rim.rotation.x = PI / 2; rim.position.y = h;
  const inside = new T.Mesh(geo.circle(r * 0.97, 26), toon(0x4a5060));
  inside.rotation.x = -PI / 2; inside.position.y = h - 0.02;
  for (const s of [-1, 1]) {
    const hd = mesh(geo.torus(0.22 * (big ? 1 : 0.7), 0.06, PI * 2, 6, 14), accent, { outline: 0.012 });
    hd.position.set(s * (r + 0.12), h * 0.78, 0); hd.rotation.y = PI / 2;
    g.add(hd);
  }
  // wooden spoon, pivoting at its handle end
  const spoon = new T.Group();
  const len = big ? 1.5 : 1.0;
  const handle = mesh(geo.cyl(0.05, 0.065, len, 8), 0xd9a05b, { outline: 0.014 });
  handle.position.y = -len / 2;
  const bowl = mesh(geo.sphere(0.2 * (big ? 1 : 0.75), 12, 8), 0xd9a05b, { outline: 0.014 });
  bowl.scale.set(1, 1.5, 0.45); bowl.position.y = -len - 0.15;
  spoon.add(handle, bowl);
  spoon.position.set(r + len * 0.55, h + len * 0.75, 0.3);
  spoon.userData.rest = -1.35;
  spoon.rotation.z = spoon.userData.rest;
  g.add(body, shine, rim, inside, spoon, blobShadow(r * 1.1));
  return { g, h, r, mats: [mat], spoon };
}

function cowbell(big) {
  const s = big ? 1 : 0.6, accent = big ? LOUD : QUIET;
  const pm = still('prop_cowbell', { tint: 0xffffff, size: s });
  if (pm) { // a gold bell swinging from a wooden stand (bone 'swing'), strap and band in the accent colour
    tintLayer(pm, 'accent', accent);
    pm.add(blobShadow(1.1 * s));
    const H = 3.3 * s;
    return { g: pm, h: H - 0.1 - 1.0 * s, r: 0.85 * s, mats: [skinMat(pm)], swing: pm.userData.bones.swing };
  }
  const g = new T.Group();
  const H = 3.3 * s;
  const post = mesh(geo.cyl(0.09, 0.11, H, 8), 0xa86f3a, { outline: 0.016 });
  post.position.set(-1.0 * s, H / 2, -0.2);
  const bar = mesh(geo.cyl(0.08, 0.08, 1.3 * s, 8), 0xa86f3a, { outline: 0.016 });
  bar.rotation.z = PI / 2; bar.position.set(-0.4 * s, H - 0.05, -0.2);
  const foot = mesh(geo.box(0.9 * s, 0.14, 0.7 * s), 0x8a5a2e, { hull: 1.05 });
  foot.position.set(-1.0 * s, 0.07, -0.2);
  // the bell swings from the bar
  const swing = new T.Group();
  swing.position.set(0, H - 0.1, -0.2);
  const strap = mesh(geo.box(0.12 * s, 0.4 * s, 0.06), accent, { hull: 1.06 });
  strap.position.y = -0.2 * s;
  const mat = flashMat(0xf2b51d);
  const bell = mesh(geo.cyl(0.42 * s, 0.75 * s, 1.15 * s, 4), 0xf2b51d, { hull: 1.04, mat });
  bell.rotation.y = PI / 4; bell.position.y = -0.4 * s - 0.575 * s;
  const mouth = new T.Mesh(geo.box(1.0 * s, 0.1, 0.02), basic(0x3a2838));
  mouth.position.set(0, -0.4 * s - 1.12 * s, 0.54 * s);
  const band = mesh(geo.box(0.95 * s, 0.14 * s, 0.03), accent, { outline: 0 });
  band.position.set(0, -0.4 * s - 0.3 * s, 0.38 * s);
  const clapper = mesh(geo.sphere(0.13 * s, 10, 8), 0x6b4424, { outline: 0.012 });
  clapper.position.y = -0.4 * s - 1.25 * s;
  swing.add(strap, bell, mouth, band, clapper);
  g.add(post, bar, foot, swing, blobShadow(1.1 * s));
  const h = H - 0.1 - 1.0 * s; // middle of the bell
  return { g, h, r: 0.85 * s, mats: [mat], swing };
}

function pumpkin(big) {
  // a big pumpkin drum: you tap its top
  const r = big ? 1.35 : 0.8, h = big ? 1.3 : 0.78;
  const pk = makePumpkin(1);
  if (pk) { // the farm's pumpkin (Blender when built), scaled to a drum
    pk.scale.set(r / 0.55, h / 0.8, r / 0.55);
    // a pumpkin turned drum: the stalk is gone and a cream drum skin is stretched over its top
    // (the Blender pumpkin's stalk/leaf part is the untinted, white-material mesh; the code pumpkin's stalk is green)
    pk.traverse((o) => { if (o.isMesh && !o.userData.outline && o.material && !o.material.transparent && (o.material.color?.getHex() === 0xffffff || o.material.color?.getHex() === 0x5c8a2e || o.material.color?.getHex() === 0x5fb84a)) o.visible = false; });
    const g = new T.Group(); g.add(pk);
    // its own copies of the materials, so only this pumpkin glows when it is played
    const mats = [];
    pk.traverse((o) => { if (o.isMesh && o.visible && !o.userData.outline && o.material && o.material.emissive && !o.material.transparent) { o.material = o.material.clone(); mats.push(o.material); } });
    const head = mesh(geo.cyl(r * 0.52, r * 0.5, 0.12, 28), 0xfff1d6, { outline: 0.02, mat: flashMat(0xfff1d6) });
    head.position.y = h * 0.98;
    const lash = mesh(geo.torus(r * 0.52, 0.035, PI * 2, 6, 28), 0xa86f3a, { outline: 0 }); lash.rotation.x = PI / 2; lash.position.y = h * 0.98 + 0.02;
    g.add(head, lash);
    mats.push(head.material);
    return { g, h: h * 0.98 + 0.06, r: r * 0.55, mats };
  }
  const g = new T.Group();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * PI * 2;
    const lobe = mesh(geo.sphere(r * 0.55, 16, 12), i % 2 ? 0xff8a2a : 0xff9a3a, { outline: 0.025 });
    lobe.scale.set(0.8, h / (r * 0.95), 0.8); lobe.position.set(Math.cos(a) * r * 0.5, h * 0.5, Math.sin(a) * r * 0.5);
    g.add(lobe);
  }
  const mat = flashMat(0xffb35a);
  const top = new T.Mesh(geo.circle(r * 0.5, 24), mat); top.rotation.x = -PI / 2; top.position.y = h * 1.07;
  const stem = mesh(geo.cyl(0.08 * r, 0.12 * r, 0.3 * r, 8), 0x58a03a, { outline: 0.012 }); stem.position.set(r * 0.35, h + 0.05, -r * 0.3); stem.rotation.z = 0.4;
  const leaf = mesh(geo.sphere(0.2 * r, 10, 8), 0x5cc45a, { outline: 0.01 }); leaf.scale.set(1.5, 0.3, 0.8); leaf.position.set(r * 0.55, h, -r * 0.2);
  g.add(top, stem, leaf, blobShadow(r * 1.1));
  return { g, h: h * 1.07, r: r * 0.55, mats: [mat] };
}

function churn(big) {
  // a metal milk churn: tap its lid
  const s = big ? 1 : 0.6, accent = big ? LOUD : QUIET;
  const pm = still('prop_milkchurn', { tint: 0xffffff, size: s });
  if (pm) {
    const lid = tintLayer(pm, 'lid', accent);
    pm.add(blobShadow(1.1 * s));
    return { g: pm, h: 2.23 * s, r: 0.5 * s, mats: [skinMat(pm), lid].filter(Boolean) };
  }
  const g = new T.Group();
  const mat = flashMat(0xc9d1dc);
  const body = mesh(geo.cyl(0.95 * s, 1.0 * s, 1.5 * s, 24), 0xc9d1dc, { outline: 0.03, mat }); body.position.y = 0.75 * s;
  const shoulder = mesh(geo.cyl(0.55 * s, 0.95 * s, 0.4 * s, 24), 0xc9d1dc, { outline: 0.025 }); shoulder.position.y = 1.7 * s;
  const neck = mesh(geo.cyl(0.55 * s, 0.55 * s, 0.25 * s, 20), 0xb0b9c6, { outline: 0.02 }); neck.position.y = 2.02 * s;
  const lid = mesh(geo.cyl(0.62 * s, 0.62 * s, 0.1 * s, 20), accent, { outline: 0.02 }); lid.position.y = 2.18 * s;
  const knob = mesh(geo.sphere(0.12 * s, 10, 8), accent, { outline: 0.012 }); knob.position.y = 2.28 * s;
  for (const y of [0.2, 1.3]) { const b = mesh(geo.torus(1.0 * s, 0.05 * s, PI * 2, 6, 28), 0x8a94a6, { outline: 0 }); b.rotation.x = PI / 2; b.position.y = y * s; g.add(b); }
  for (const k of [-1, 1]) { const hd = mesh(geo.torus(0.2 * s, 0.05 * s, PI, 6, 12), 0x8a94a6, { outline: 0.01 }); hd.position.set(k * 0.95 * s, 1.55 * s, 0); hd.rotation.y = PI / 2; g.add(hd); }
  g.add(body, shoulder, neck, lid, knob, blobShadow(1.1 * s));
  return { g, h: 2.23 * s, r: 0.5 * s, mats: [mat, lid.material = flashMat(accent)] };
}

const MAKE = { drum, bucket, pot, cowbell, pumpkin, churn };
// where little things can sit and bounce on each instrument: [height of the surface, radius] (null: nowhere)
export function surface(g) {
  const u = g.userData;
  if (u.inst === 'cowbell') return null;
  if (u.inst === 'drum') return [u.h + 0.06, u.r * 0.7];
  if (u.inst === 'pot') return [u.h - 0.02, u.r * 0.75];
  if (u.inst === 'churn') return [u.h - 0.05, u.r * 1.0];
  return [u.h, u.r * 0.75];
}
// kind: drum | bucket | pot | cowbell | pumpkin | churn. big = the loud one.
export function makeInstrument(kind, big) {
  const o = MAKE[kind](big);
  Object.assign(o.g.userData, { inst: kind, h: o.h, r: o.r, mats: o.mats, spoon: o.spoon, swing: o.swing, big });
  return o.g;
}

// Light up the playing surface for a moment and play the instrument's own strike animation.
export function strike(s, g, loud) {
  const u = g.userData;
  const glow = new T.Color(loud ? 0xffd23f : 0x9fd0ff);
  s.anim(0.3, (_, p) => { for (const m of u.mats) m.emissive.copy(glow).multiplyScalar((1 - p) * (loud ? 0.75 : 0.5)); });
  if (u.spoon) {
    const sp = u.spoon, r0 = sp.userData.rest;
    s.anim(0.26, (_, p) => { sp.rotation.z = r0 + Math.sin(Math.min(1, p * 1.6) * PI) * (loud ? 0.65 : 0.35); }).then(() => (sp.rotation.z = r0));
  }
  if (u.swing) {
    const sw = u.swing, a = loud ? 0.45 : 0.18;
    s.anim(0.7, (_, p) => { sw.rotation.z = Math.sin(p * PI * 4) * a * (1 - p); }).then(() => (sw.rotation.z = 0));
  }
}

// ---------- beat board ----------
// A wooden board on two posts, above the drums, with one big dot per beat: big red = loud, smaller blue = quiet.
// Each dot carries its beat number (1, 2, 3…), hidden while the dot is pale; it pops up the moment the dot fills
// (Pip's beat lights it, the child's beat fills it).
const numTex = {};
function numberTexture(n) {
  if (numTex[n]) return numTex[n];
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  g.font = 'bold 104px "Arial Rounded MT Bold", "Nunito", sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineJoin = 'round'; g.lineWidth = 16; g.strokeStyle = '#3a2838';
  g.strokeText(String(n), 64, 70);
  g.fillStyle = '#ffffff'; g.fillText(String(n), 64, 70);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.userData.shared = true;
  return (numTex[n] = t);
}
export function makeDots(pat) {
  const g = new T.Group();
  const gap = 1.85, dots = [];
  const w = Math.max(3.2, pat.length * gap + 0.6), h = 2.0;
  // the board (a cream panel in a wooden frame) and its posts down to the ground behind the drums
  const bb = still('prop_beatboard', { size: [w / 6, 1, 1] });
  if (bb) g.add(bb); // the Blender board: a wooden frame with gold corner nails, a cream panel and two posts
  const frameM = mesh(geo.box(w + 0.3, h + 0.3, 0.22), 0xa86f3a, { hull: 1.03 });
  frameM.position.z = -0.2;
  const panel = new T.Mesh(geo.box(w, h, 0.1), toon(0xfff3dc));
  panel.position.z = -0.06;
  if (!bb) g.add(frameM, panel);
  for (const sx of bb ? [] : [-1, 1]) {
    const post = mesh(geo.box(0.22, 4.6, 0.22), 0x8a5228, { hull: 1.04 });
    post.position.set(sx * (w / 2 - 0.25), -h / 2 - 2.2, -0.3);
    g.add(post);
  }
  pat.forEach((k, i) => {
    const loud = k === 'B';
    const col = loud ? LOUD : QUIET;
    const mat = toonUnique(0xffffff);
    const r = loud ? 0.74 : 0.5;
    const d = mesh(geo.sphere(r, 20, 14), 0xffffff, { outline: 0.035, mat });
    d.position.set((i - (pat.length - 1) / 2) * gap, 0, 0.25);
    const num = new T.Mesh(new T.PlaneGeometry(r * 1.6, r * 1.6), new T.MeshBasicMaterial({ map: numberTexture(i + 1), transparent: true, depthWrite: false }));
    num.position.z = r * 1.02 + 0.02;
    num.visible = false;
    d.add(num);
    d.userData = { col: new T.Color(col), mat, loud, base: 1, state: 'idle', num };
    g.add(d); dots.push(d);
  });
  g.userData.dots = dots;
  return g;
}
// state: 'idle' (pale, no number), 'lit' (bright, glowing, number shows), 'done' (full colour, number shows).
export function setDot(d, state) {
  const u = d.userData;
  const was = u.state;
  u.state = state;
  const white = new T.Color(0xffffff);
  if (state === 'idle') { u.mat.color.copy(white).lerp(u.col, 0.25); u.mat.emissive.setRGB(0, 0, 0); }
  else if (state === 'lit') { u.mat.color.copy(u.col); u.mat.emissive.copy(u.col).multiplyScalar(0.5); }
  else { u.mat.color.copy(u.col); u.mat.emissive.copy(u.col).multiplyScalar(0.15); }
  if (u.num) {
    u.num.visible = state !== 'idle';
    // the number pops (overshoots, then settles) whenever the dot fills
    if (state !== 'idle' && was === 'idle') { u.num.userData.pop = performance.now(); }
  }
}
// called every frame by the lesson: number pop animation
export function animDots(g) {
  const now = performance.now();
  for (const d of g.userData.dots || []) {
    const n = d.userData.num; if (!n || !n.visible) continue;
    const t = (now - (n.userData.pop || 0)) / 1000;
    const k = t < 0.35 ? 1 + Math.sin((t / 0.35) * Math.PI) * 0.6 * (1 - t / 0.35) : 1;
    const e = Math.min(1, t / 0.12);
    n.scale.setScalar(Math.max(0.001, e * k));
  }
}

// ---------- little things that sit on the instruments and jump when they are played (real physics) ----------
const BITS = {
  corn: { r: 0.11, cols: [0xffd23f, 0xf2b51d] },
  peas: { r: 0.13, cols: [0x6fcf4a, 0x58b43a] },
  berries: { r: 0.14, cols: [0xff4b6b, 0xd93a5a, 0x7a5cff] },
  apples: { r: 0.2, cols: [0xf0453a, 0x8fd14f] },
  eggs: { r: 0.17, cols: [0xfff3dc, 0xf2dcc0] },
  buttons: { r: 0.15, cols: [0xff5a5a, 0x4a90ff, 0xffd23f, 0x5fd068], flat: true },
};
const BIT_MODEL = { peas: 'prop_farmpea', berries: 'prop_farmberry', eggs: 'prop_farmegg' };
export function makeBit(kind, i) {
  const b = BITS[kind] || BITS.corn;
  const col = b.cols[i % b.cols.length];
  // the Blender bits: a mini corn cob, a farm apple, a pea, a berry, an egg (buttons stay code: a button is a disc)
  let pm = null, r = b.r;
  if (kind === 'corn') { pm = makeCorn(0.3); r = 0.08; pm.rotation.z = Math.PI / 2; }
  else if (kind === 'apples') pm = makeApple(0.62, col);
  else if (BIT_MODEL[kind]) { pm = still(BIT_MODEL[kind], { tint: col, size: kind === 'eggs' ? 0.86 : kind === 'berries' ? 0.95 : 1.0 }); if (kind === 'eggs') r = 0.19; }
  if (pm) { const g = new T.Group(); g.add(pm); g.userData.bitR = r; return g; }
  let m;
  if (b.flat) {
    m = mesh(geo.cyl(b.r, b.r, b.r * 0.6, 14), col, { outline: 0.012 });
    for (const [x, z] of [[-0.04, -0.04], [0.04, 0.04]]) { const h = new T.Mesh(geo.circle(0.025, 8), basic(0x3a2838)); h.rotation.x = -PI / 2; h.position.set(x, b.r * 0.31, z); m.add(h); }
  } else {
    m = mesh(geo.sphere(b.r, 12, 10), col, { outline: 0.012 });
    if (kind === 'eggs') m.scale.set(0.85, 1.1, 0.85);
    if (kind === 'apples') { const st = mesh(geo.cyl(0.02, 0.025, 0.1, 5), 0x7a4a26, { outline: 0 }); st.position.y = b.r; m.add(st); }
  }
  const g = new T.Group(); g.add(m);
  g.userData.bitR = b.r;
  return g;
}
export const BIT_KINDS = Object.keys(BITS);

// ---------- the stage: a different one for each level ----------
function planks(g, w, d, col, line, x, z) {
  const f = mesh(geo.box(w, 0.25, d), col, { hull: 1.01, outline: 0 }); f.position.set(x, -0.075, z); g.add(f);
  for (let i = 1; i < Math.round(w / 0.9); i++) { const l = new T.Mesh(geo.box(0.03, 0.01, d), basic(line)); l.position.set(x - w / 2 + i * 0.9, 0.055, z); g.add(l); }
}
export function makeStage(level, makeHay) {
  const g = new T.Group();
  if (level === 0) {
    // a hay-bale stage on the grass (bales sit back far enough that the beat board's posts stand clear in front)
    planks(g, 12, 4.6, 0xd9a05b, 0xa86f3a, 1.4, 1.2);
    for (const [x, z, s, ry] of [[0.9, -2.75, 0.9, 0.2], [2.5, -2.95, 1.0, -0.1], [4.1, -2.75, 0.85, 0.15], [-4.7, -2.4, 0.85, -0.2]]) { const h = makeHay(s); h.position.set(x, 0, z); h.rotation.y = ry; g.add(h); }
  } else if (level === 1) {
    // a little theatre: red curtains, a scalloped top and a dark wooden floor
    planks(g, 13, 4.8, 0x8a5228, 0x5a3418, 1.4, 1.1);
    const curtainCol = 0xc9283a, dark = 0x8a1a2a;
    for (const s of [-1, 1]) {
      for (let i = 0; i < 4; i++) { const f = mesh(geo.cyl(0.32, 0.4, 5.6, 10), i % 2 ? curtainCol : dark, { outline: 0.015 }); f.position.set(1.4 + s * (7.8 - i * 0.45), 2.8, -1.8 + i * 0.05); g.add(f); }
    }
    for (let i = 0; i < 10; i++) { const sc = mesh(geo.sphere(0.75, 14, 8, ), curtainCol, { outline: 0.02 }); sc.scale.set(1, 0.55, 0.4); sc.position.set(1.4 - 6.0 + i * 1.33, 5.5, -1.7); g.add(sc); }
    const bar = mesh(geo.box(14, 0.5, 0.4), 0xffd23f, { hull: 1.03 }); bar.position.set(1.4, 5.85, -1.75); g.add(bar);
  } else {
    // an evening concert: a round stage, fairy lights and two spotlights
    const disc = mesh(geo.cyl(5.6, 5.8, 0.25, 40), 0x5a4a8a, { outline: 0.02 }); disc.scale.set(1.25, 1, 0.55); disc.position.set(1.4, -0.075, 0.9); g.add(disc);
    const rim = mesh(geo.torus(5.7, 0.08, PI * 2, 6, 48), 0xffd23f, { outline: 0 }); rim.rotation.x = PI / 2; rim.scale.set(1.25, 0.55, 1); rim.position.set(1.4, 0.055, 0.9); g.add(rim);
    for (const x of [-4.0, 8.4]) { const p = mesh(geo.cyl(0.08, 0.1, 5.6, 8), 0x3a2838, { outline: 0.012 }); p.position.set(x, 2.8, -2.0); g.add(p); }
    const bulbs = [];
    for (let i = 0; i < 18; i++) {
      const t = (i + 0.5) / 18, x = -4.0 + 12.4 * t, y = 5.5 - Math.sin(t * PI) * 0.6;
      const col = [0xff5a5a, 0xffd23f, 0x4a90ff, 0x5fd068, 0xff8fc0][i % 5];
      const b = new T.Mesh(geo.sphere(0.13, 10, 8), toonUnique(col, { emissive: col, emissiveIntensity: 0.6 }));
      b.position.set(x, y, -2.0); g.add(b); bulbs.push(b);
    }
    for (const x of [-2.2, 5.0]) {
      const beam = new T.Mesh(geo.cone(1.6, 6, 24, true), new T.MeshBasicMaterial({ color: 0xfff2a0, transparent: true, opacity: 0.16, depthWrite: false, side: T.DoubleSide }));
      beam.position.set(x * 0.6 + 0.6, 3.0, 0.6); beam.rotation.z = x < 0 ? -0.25 : 0.25; g.add(beam);
    }
    g.userData.bulbs = bulbs;
  }
  return g;
}
