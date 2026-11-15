// Props for Barn band: the four instruments (each in a big/loud and small/quiet size) and the light-up beat dots.
import * as T from '../three.js';
import { mesh, geo, toon, toonUnique, basic, blobShadow } from '../engine/toon.js';
import { makeDrum } from '../engine/farm.js';

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

const MAKE = { drum, bucket, pot, cowbell };
// kind: drum | bucket | pot | cowbell. big = the loud one.
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

// ---------- beat dots ----------
// One dot per beat: big red = loud, small blue = quiet. Pip's beats light them in turn; the child's beats fill them.
export function makeDots(pat) {
  const g = new T.Group();
  const gap = 1.4, dots = [];
  pat.forEach((k, i) => {
    const loud = k === 'B';
    const col = loud ? LOUD : QUIET;
    const mat = toonUnique(0xffffff);
    const d = mesh(geo.sphere(loud ? 0.55 : 0.32, 18, 12), 0xffffff, { outline: 0.03, mat });
    d.position.x = (i - (pat.length - 1) / 2) * gap;
    d.userData = { col: new T.Color(col), mat, loud, base: 1, state: 'idle' };
    g.add(d); dots.push(d);
  });
  g.userData.dots = dots;
  return g;
}
// state: 'idle' (pale), 'lit' (bright, glowing), 'done' (full colour).
export function setDot(d, state) {
  const u = d.userData;
  u.state = state;
  const white = new T.Color(0xffffff);
  if (state === 'idle') { u.mat.color.copy(white).lerp(u.col, 0.4); u.mat.emissive.setRGB(0, 0, 0); }
  else if (state === 'lit') { u.mat.color.copy(u.col); u.mat.emissive.copy(u.col).multiplyScalar(0.5); }
  else { u.mat.color.copy(u.col); u.mat.emissive.copy(u.col).multiplyScalar(0.15); }
}
