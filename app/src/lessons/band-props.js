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
// the Blender extras (c.extras[...]) live on the model's inner root
const extras = (pm) => { const m = pm.userData.model; return (m.children[0] && m.children[0].userData) || m.userData || {}; };

const PI = Math.PI;
export const LOUD = 0xff5a5a, QUIET = 0x4a90ff;

function flashMat(color) { return toonUnique(color); }

// The glow on a played instrument: only its playing surface lights (drum head, lid, rim, bell), never the whole body
// changing colour, and never brighter than 0.35.
const GLOW_MAX = 0.35;

function drum(big) {
  const g = big ? makeDrum(0xd94f3d, 1.55, 1.4) : makeDrum(0x4a90ff, 0.85, 0.8);
  const { skin, h, r } = g.userData;
  skin.material = flashMat(0xfff6e6);
  return { g, h, r, mats: [skin.material] };
}

function bucket(big) {
  const r = big ? 1.35 : 0.78, h = big ? 1.55 : 0.9, col = big ? 0xff6a4a : 0x4aa8ff;
  const pm = still('prop_bucket', { tint: col, size: [r, h / 1.3, r] });
  if (pm) { // the Blender pail turned over: its base is the drum, with a cream skin stretched over it
    const m = pm.userData.model;
    m.rotation.z = Math.PI; m.position.y = h;
    // the bail handle has no place on an upturned pail (it lay on the floor as a yellow ring): hidden
    for (const [name, l] of Object.entries(m.userData.layers || {})) if (/^handle/.test(name)) { l.mesh.visible = false; if (l.outline) l.outline.visible = false; }
    const head = mesh(geo.cyl(r * 0.74, r * 0.74, 0.07, 32), 0xfff1d6, { outline: 0.02, mat: flashMat(0xfff1d6) });
    head.position.y = h + 0.02;
    const lash = mesh(geo.torus(r * 0.745, 0.035, PI * 2, 6, 32), 0xffffff, { outline: 0, mat: toonUnique(new T.Color(col).offsetHSL(0, -0.05, 0.12).getHex()) });
    lash.rotation.x = PI / 2; lash.position.y = h + 0.03;
    pm.add(head, lash, blobShadow(r * 1.1));
    return { g: pm, h: h + 0.06, r: r * 0.74, mats: [head.material] };
  }
  const g = new T.Group();
  // upside-down bucket: wide at the bottom, the base is the drum head
  const body = mesh(geo.cyl(r * 0.8, r, h, 26), col, { outline: 0.03 });
  body.position.y = h / 2;
  const light = new T.Color(col).offsetHSL(0, 0, 0.12).getHex();
  const mat = flashMat(0xfff1d6);
  const top = mesh(geo.cyl(r * 0.8, r * 0.8, 0.06, 26), 0xfff1d6, { outline: 0.02, mat });
  top.position.y = h + 0.02;
  const rim = mesh(geo.torus(r * 1.0, 0.09 * (big ? 1 : 0.7), PI * 2, 8, 30), light, { outline: 0.015 });
  rim.rotation.x = PI / 2; rim.position.y = 0.08;
  g.add(body, rim, top, blobShadow(r * 1.1));
  return { g, h: h + 0.05, r: r * 0.8, mats: [mat] };
}

// A wooden spoon resting on the pot's rim (the rim is its pivot): the bowl dips inside, the handle leans out.
// Played, the bowl lifts and taps back down into the pot.
function restingSpoon(r, h, len) {
  const pivot = new T.Group();
  const sm = still('prop_farmspoon', { size: len });
  const sp = new T.Group();
  if (sm) sp.add(sm);
  else {
    const handle = mesh(geo.cyl(0.05, 0.065, len, 8), 0xd9a05b, { outline: 0.014 }); handle.position.y = -len / 2;
    const bowl = mesh(geo.sphere(0.2 * len / 1.5, 12, 8), 0xd9a05b, { outline: 0.014 }); bowl.scale.set(1, 1.5, 0.45); bowl.position.y = -len - 0.15;
    sp.add(handle, bowl);
  }
  sp.position.y = len * 0.48;        // the rim touches the handle a little under half way down
  pivot.add(sp);
  pivot.position.set(r * 0.9, h + 0.07, 0.28);
  pivot.rotation.set(0, -0.35, -0.62); // bowl down and in, handle up and out
  pivot.userData.rest = -0.62;
  return pivot;
}

function pot(big, opts = {}) {
  const r = big ? 1.3 : 0.75, h = big ? 1.15 : 0.66, accent = big ? LOUD : QUIET;
  const pm = still('prop_cookpot', { tint: 0xffffff, size: [r, h / 0.88, r] });
  if (pm) { // a steel cooking pot with coloured handles and a wooden spoon resting on its rim
    tintLayer(pm, 'handles', accent);
    const rimMat = tintLayer(pm, 'rim', 0x8a94a6);
    // the pot is hollow: a dark inner bottom just under the rim is what the little things sit on (seen over the rim)
    const fill = new T.Mesh(geo.circle(r * 0.9, 32), toon(0x4a5060)); fill.rotation.x = -PI / 2; fill.position.y = h - 0.07;
    pm.add(fill, blobShadow(r * 1.1));
    const spoon = opts.pip ? null : restingSpoon(r, h, big ? 1.45 : 1.0);
    if (spoon) pm.add(spoon);
    return { g: pm, h, r, mats: [rimMat || skinMat(pm)], spoon };
  }
  const g = new T.Group();
  const mat = flashMat(0x8a94a6);
  const body = mesh(geo.cyl(r, r * 0.92, h, 26), 0xb9c3d1, { outline: 0.03 });
  body.position.y = h / 2;
  const rim = mesh(geo.torus(r, 0.07, PI * 2, 8, 30), 0x8a94a6, { outline: 0.015, mat });
  rim.rotation.x = PI / 2; rim.position.y = h;
  const inside = new T.Mesh(geo.circle(r * 0.97, 26), toon(0x4a5060));
  inside.rotation.x = -PI / 2; inside.position.y = h - 0.02;
  for (const s of [-1, 1]) {
    const hd = mesh(geo.torus(0.22 * (big ? 1 : 0.7), 0.06, PI * 2, 6, 14), accent, { outline: 0.012 });
    hd.position.set(s * (r + 0.12), h * 0.78, 0); hd.rotation.y = PI / 2;
    g.add(hd);
  }
  const spoon = opts.pip ? null : restingSpoon(r, h, big ? 1.45 : 1.0);
  g.add(body, rim, inside, blobShadow(r * 1.1));
  if (spoon) g.add(spoon);
  return { g, h, r, mats: [mat], spoon };
}

function cowbell(big) {
  const s = big ? 1 : 0.6, accent = big ? LOUD : QUIET;
  const pm = still('prop_bandbell', { tint: 0xffffff, size: s }) || still('prop_cowbell', { tint: 0xffffff, size: s });
  if (pm) { // a chunky riveted bell hanging from a sturdy A-frame (bone 'swing'), strap and band in the accent colour
    tintLayer(pm, 'accent', accent);
    pm.add(blobShadow(1.1 * s));
    const mu = extras(pm);
    const H = mu.H || 3.3;
    return { g: pm, h: (mu.bellMid ?? H - 1.1) * s, r: 0.85 * s, mats: [skinMat(pm)], swing: pm.userData.bones.swing, bellX: 0, bellZ: mu.bellZ ?? -0.2, bellR: mu.bellMid ? 0.5 * s : 0.6 * s };
  }
  const g = new T.Group();
  const H = 3.3 * s;
  const post = mesh(geo.cyl(0.09, 0.11, H, 8), 0xa86f3a, { outline: 0.016 });
  post.position.set(-1.0 * s, H / 2, -0.2);
  const bar = mesh(geo.cyl(0.08, 0.08, 1.3 * s, 8), 0xa86f3a, { outline: 0.016 });
  bar.rotation.z = PI / 2; bar.position.set(-0.4 * s, H - 0.05, -0.2);
  const foot = mesh(geo.box(0.9 * s, 0.14, 0.7 * s), 0x8a5a2e, { hull: 1.05 });
  foot.position.set(-1.0 * s, 0.07, -0.2);
  const swing = new T.Group();
  swing.position.set(0, H - 0.1, -0.2);
  const strap = mesh(geo.box(0.12 * s, 0.4 * s, 0.06), accent, { hull: 1.06 });
  strap.position.y = -0.2 * s;
  const mat = flashMat(0xf2b51d);
  const bell = mesh(geo.cyl(0.42 * s, 0.75 * s, 1.15 * s, 4), 0xf2b51d, { hull: 1.04, mat });
  bell.rotation.y = PI / 4; bell.position.y = -0.4 * s - 0.575 * s;
  const clapper = mesh(geo.sphere(0.13 * s, 10, 8), 0x6b4424, { outline: 0.012 });
  clapper.position.y = -0.4 * s - 1.25 * s;
  swing.add(strap, bell, clapper);
  g.add(post, bar, foot, swing, blobShadow(1.1 * s));
  return { g, h: H - 0.1 - 1.0 * s, r: 0.85 * s, mats: [mat], swing, bellX: 0, bellZ: -0.2 };
}

function pumpkin(big) {
  // a pumpkin drum: a sculpted pumpkin with a cream skin lashed over its top (Blender prop_pumpkindrum)
  const s = big ? 1.35 : 0.8;
  const pm = still('prop_pumpkindrum', { size: s });
  if (pm) {
    const headMat = tintLayer(pm, 'head', 0xfff1d6);
    pm.add(blobShadow(s * 1.1));
    const ex = extras(pm);
    const top = ex.top || 1.26;
    return { g: pm, h: top * s, r: (ex.headR || 0.66) * s, mats: [headMat].filter(Boolean) };
  }
  const r = s, h = big ? 1.3 : 0.78;
  const g = new T.Group();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * PI * 2;
    const lobe = mesh(geo.sphere(r * 0.55, 16, 12), i % 2 ? 0xff8a2a : 0xff9a3a, { outline: 0.025 });
    lobe.scale.set(0.8, h / (r * 0.95), 0.8); lobe.position.set(Math.cos(a) * r * 0.5, h * 0.5, Math.sin(a) * r * 0.5);
    g.add(lobe);
  }
  const mat = flashMat(0xfff1d6);
  const top = mesh(geo.cyl(r * 0.5, r * 0.5, 0.08, 24), 0xfff1d6, { outline: 0.02, mat }); top.position.y = h * 1.04;
  g.add(top, blobShadow(r * 1.1));
  return { g, h: h * 1.07, r: r * 0.5, mats: [mat] };
}

function churn(big) {
  // a metal milk churn: tap its lid
  const s = big ? 1 : 0.6, accent = big ? LOUD : QUIET;
  const pm = still('prop_milkchurn', { tint: 0xffffff, size: s });
  if (pm) {
    const lid = tintLayer(pm, 'lid', accent);
    pm.add(blobShadow(1.1 * s));
    return { g: pm, h: 2.23 * s, r: 0.5 * s, mats: [lid || skinMat(pm)] };
  }
  const g = new T.Group();
  const body = mesh(geo.cyl(0.95 * s, 1.0 * s, 1.5 * s, 24), 0xc9d1dc, { outline: 0.03 }); body.position.y = 0.75 * s;
  const shoulder = mesh(geo.cyl(0.55 * s, 0.95 * s, 0.4 * s, 24), 0xc9d1dc, { outline: 0.025 }); shoulder.position.y = 1.7 * s;
  const neck = mesh(geo.cyl(0.55 * s, 0.55 * s, 0.25 * s, 20), 0xb0b9c6, { outline: 0.02 }); neck.position.y = 2.02 * s;
  const mat = flashMat(accent);
  const lid = mesh(geo.cyl(0.62 * s, 0.62 * s, 0.1 * s, 20), accent, { outline: 0.02, mat }); lid.position.y = 2.18 * s;
  g.add(body, shoulder, neck, lid, blobShadow(1.1 * s));
  return { g, h: 2.23 * s, r: 0.5 * s, mats: [mat] };
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
// The point a drumstick hits, in the instrument's own (unscaled) space: the near (left) part of the head, the rim
// of a pot, the side of a bell.
export function strikePoint(g) {
  const u = g.userData;
  if (u.inst === 'cowbell') return new T.Vector3((u.bellX || 0) - (u.bellR || 0.5) * 0.55, u.h, (u.bellZ ?? -0.2) + (u.bellR || 0.5) * 0.45); // the bell's front-left face
  if (u.inst === 'pot') return new T.Vector3(-u.r * 0.9, u.h + 0.08, 0.15); // on the rim
  return new T.Vector3(-u.r * 0.35, u.h + 0.02, 0.1);
}
// kind: drum | bucket | pot | cowbell | pumpkin | churn. big = the loud one.
// opts.pip: Pip's own little copy (no spoon: his drumstick plays it). opts.mini: a band member's.
export function makeInstrument(kind, big, opts = {}) {
  const o = MAKE[kind](big, opts);
  Object.assign(o.g.userData, { inst: kind, h: o.h, r: o.r, mats: o.mats, spoon: o.spoon, swing: o.swing, bellX: o.bellX, bellZ: o.bellZ, bellR: o.bellR, big });
  return o.g;
}

// Light up the playing surface for a moment and play the instrument's own strike animation.
export function strike(s, g, loud) {
  const u = g.userData;
  const glow = new T.Color(loud ? 0xffd23f : 0x9fd0ff);
  s.anim(0.3, (_, p) => { for (const m of u.mats) m.emissive.copy(glow).multiplyScalar((1 - p) * (loud ? GLOW_MAX : GLOW_MAX * 0.7)); });
  if (u.spoon) {
    const sp = u.spoon, r0 = sp.userData.rest;
    s.anim(0.3, (_, p) => { sp.rotation.z = r0 - Math.sin(Math.min(1, p * 1.4) * PI) * (loud ? 0.5 : 0.25); }).then(() => (sp.rotation.z = r0));
  }
  if (u.swing) {
    const sw = u.swing, a = loud ? 0.35 : 0.15;
    s.anim(0.8, (_, p) => { sw.rotation.z = Math.sin(p * PI * 4) * a * (1 - p); }).then(() => (sw.rotation.z = 0));
  }
}

// Pip's drumstick: a wooden stick with a round red tip, along +z from its grip (origin); userData.tip is the tip.
export function makeStick() {
  const g = new T.Group();
  const pm = still('prop_drumstick');
  if (pm) g.add(pm);
  else {
    const st = mesh(geo.cyl(0.035, 0.045, 0.82, 8), 0xd9a05b, { outline: 0.012 }); st.rotation.x = PI / 2; st.position.z = 0.41;
    const ball = mesh(geo.sphere(0.075, 12, 8), 0xff5a5a, { outline: 0.012 }); ball.position.z = 0.84;
    g.add(st, ball);
  }
  const tip = new T.Object3D(); tip.position.z = 0.9; g.add(tip);
  g.userData.tip = tip;
  return g;
}

// The band riser at the back of the stage: a wooden platform RISER.top high, n spots wide, with steps down at the
// right end (Blender prop_bandriser; the skirt is the level's colour). Origin = middle of its front-to-back depth,
// on the ground, at the middle of the platform.
// (top 1.5: the band stands clear above the big instruments in front of it)
export const RISER = { top: 1.5, depth: 1.75, stepsW: 1.2, stepsX: 3.8, steps: [1.125, 0.75, 0.375] };
const RISER_SKIRT = [0xe8a23c, 0xc9283a, 0x6b55b0];
export function makeRiser(level, n = 6, spacing = 1.2) {
  const w = n * spacing + 0.4;
  RISER.stepsX = w / 2;
  const pm = still('prop_bandriser', { tint: RISER_SKIRT[level] ?? RISER_SKIRT[0], size: [w / 7.6, 1, 1] });
  if (pm) return pm;
  const g = new T.Group();
  const top = mesh(geo.box(w, RISER.top, RISER.depth), 0xc98b4f, { hull: 1.01 });
  top.position.y = RISER.top / 2; g.add(top);
  RISER.steps.forEach((h, i) => {
    const st = mesh(geo.box(RISER.stepsW / 3, h, RISER.depth * 0.7), 0xa86f3c, { hull: 1.01 });
    st.position.set(w / 2 + (i + 0.5) * RISER.stepsW / 3, h / 2, 0);
    g.add(st);
  });
  return g;
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
  // one board size for every round (three beats at most), so its posts always stand in the same place
  const w = Math.max(3.2, 3 * gap + 0.6), h = 2.0;
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
    const k = t < 0.35 ? 1 + Math.sin((t / 0.35) * Math.PI) * 0.35 * (1 - t / 0.35) : 1;
    const e = Math.min(1, t / 0.12);
    n.scale.setScalar(Math.max(0.001, e * k));
  }
}

// ---------- little things that sit on the instruments and jump when they are played (real physics) ----------
const BITS = {
  corn: { r: 0.11, cols: [0xffd23f, 0xf2b51d] },
  peas: { r: 0.13, cols: [0x6fcf4a, 0x58b43a] },
  berries: { r: 0.14, cols: [0xff4b6b, 0xd93a5a, 0x7a5cff] },
  apples: { r: 0.22, cols: [0xf0453a, 0x8fd14f] },
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
  if (pm) { const g = new T.Group(); g.add(pm); g.userData.bitR = kind === 'apples' ? b.r : r; return g; }
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
  g.userData.flat = !!b.flat;
  return g;
}
export const BIT_KINDS = Object.keys(BITS);

// ---------- the stage: a different one for each level ----------
function planks(g, w, d, col, line, x, z) {
  const f = mesh(geo.box(w, 0.25, d), col, { hull: 1.01, outline: 0 }); f.position.set(x, -0.075, z); g.add(f);
  for (let i = 1; i < Math.round(w / 0.9); i++) { const l = new T.Mesh(geo.box(0.03, 0.01, d), basic(line)); l.position.set(x - w / 2 + i * 0.9, 0.055, z); g.add(l); }
}
// a soft round pool of light on the stage floor (radial gradient, additive: it never reads as a puddle)
let poolTex = null;
function lightPool(r, x, z) {
  if (!poolTex) {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 4, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,246,200,0.55)'); gr.addColorStop(0.55, 'rgba(255,240,180,0.25)'); gr.addColorStop(1, 'rgba(255,240,180,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    poolTex = new T.CanvasTexture(c); poolTex.colorSpace = T.SRGBColorSpace; poolTex.userData.shared = true;
  }
  const m = new T.Mesh(new T.PlaneGeometry(r * 2, r * 2), new T.MeshBasicMaterial({ map: poolTex, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
  m.rotation.x = -PI / 2; m.position.set(x, 0.16, z); m.renderOrder = 1;
  return m;
}
// Fairy-light string: the Blender posts + sagging cable (prop_fairylights); the bulbs are glowing code drops hung
// from the cable's sockets so the game can twinkle them one by one. Posts at x0 and x1 (world), cable height top.
export const LIGHTS = { x0: -5.9, x1: 9.3, z: -5.0, top: 5.6, sag: 0.75, n: 15 };
function fairyLights(g) {
  const { x0, x1, z, top, sag, n } = LIGHTS;
  const pm = still('prop_fairylights');
  if (pm) { pm.position.set((x0 + x1) / 2, 0, z); pm.scale.x = (x1 - x0) / 15.2; g.add(pm); }
  else for (const x of [x0, x1]) { const p = mesh(geo.cyl(0.1, 0.13, top + 0.2, 10), 0x6b4424, { outline: 0.016 }); p.position.set(x, (top + 0.2) / 2, z); g.add(p); }
  const bulbs = [];
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n, x = x0 + (x1 - x0) * t, y = top - Math.sin(t * PI) * sag;
    const col = [0xff5a5a, 0xffd23f, 0x4a90ff, 0x5fd068, 0xff8fc0][i % 5];
    const b = mesh(geo.sphere(0.14, 12, 10), col, { outline: 0.014, mat: toonUnique(col, { emissive: col, emissiveIntensity: 0.6 }) });
    b.scale.set(0.85, 1.15, 0.85);
    b.position.set(x, y - 0.24, z + 0.02);
    const cap = mesh(geo.cyl(0.07, 0.08, 0.1, 10), 0x4a4250, { outline: 0.01 }); cap.position.set(x, y - 0.1, z + 0.02);
    g.add(b, cap); bulbs.push(b);
  }
  g.userData.bulbs = bulbs;
}
// The stage, one per level. Everything stands clear of the band riser (z -4.1..-2.4), Pip (x -5) and the
// audience (x 5.5..7.4) so nothing passes through anything.
export function makeStage(level, makeHay) {
  const g = new T.Group();
  if (level === 0) {
    // a plank stage on the grass, hay bales at the back corners
    planks(g, 10.6, 7.6, 0xd9a05b, 0xa86f3a, 0.4, -0.25);
    for (const [x, z, sc, ry] of [[-4.75, -3.9, 0.85, -0.2], [-6.3, -3.6, 0.8, 0.3], [8.9, -3.4, 0.9, 0.2]]) { const h = makeHay(sc); h.position.set(x, 0, z); h.rotation.y = ry; g.add(h); }
  } else if (level === 1) {
    // a little theatre: a back cloth, draped red curtains with tie-backs and a scalloped valance, dark plank floor
    planks(g, 10.6, 7.6, 0x8a5228, 0x5a3418, 0.4, -0.25);
    const th = still('prop_theatre');
    if (th) {
      th.position.set(1.0, 0, -5.1); g.add(th);
      // the draped side curtains, gathered back with tie-backs (prop_curtain: unit panel, outer side -x)
      for (const sx of [-1, 1]) {
        const c = still('prop_curtain');
        if (!c) continue;
        const cu = c.userData.model.userData;
        if (cu.skin) cu.skin.material = toonUnique(0xd8333f, { vertexColors: true });
        if (cu.layers?.tie) cu.layers.tie.mesh.material = toonUnique(0xffc93a, { vertexColors: true });
        c.scale.set(sx < 0 ? 2.7 : -2.7, 6.5, 1.6); // mirrored on the right, so both gather toward the outside
        c.position.set(1.0 + sx * 7.95, 0, -4.75);
        g.add(c);
      }
    }
    else {
      const back = mesh(geo.box(18, 7, 0.2), 0x7a1f30, { outline: 0 }); back.position.set(1.0, 3.5, -4.8); g.add(back);
      for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) { const f = mesh(geo.cyl(0.32, 0.4, 6.4, 10), i % 2 ? 0xc9283a : 0x8a1a2a, { outline: 0.015 }); f.position.set(1.0 + sx * (8.4 - i * 0.45), 3.2, -1.9 + i * 0.05); g.add(f); }
    }
  } else {
    // an evening concert: a round stage with a step, fairy lights on two posts, soft pools of light
    const st = still('prop_bandstage');
    if (st) { st.position.set(0.6, 0, -0.6); g.add(st); }
    else { const disc = mesh(geo.cyl(5.6, 5.8, 0.25, 40), 0x5a4a8a, { outline: 0.02 }); disc.scale.set(1.0, 1, 0.75); disc.position.set(0.6, 0, -0.6); g.add(disc); }
    fairyLights(g);
    g.add(lightPool(2.0, -0.6, 1.2), lightPool(1.5, 3.3, 1.6));
  }
  return g;
}
