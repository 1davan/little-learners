// Who says moo? helpers: the farm spots animals stand in, the sound bubble, and each animal's signature move.
import * as T from '../three.js';
import { mesh, geo, toon, basic } from '../engine/toon.js';
import { makeHay, makeTree, makeFlower } from '../engine/scenery.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';

export const SPOTS = ['pen', 'hay', 'barn', 'pond', 'mud', 'tree', 'flowers', 'trough'];

function box(w, h, d, col, x, y, z) { const m = mesh(geo.box(w, h, d), col, { hull: 1.04, outline: 0 }); m.position.set(x, y, z); return m; }
function disc(r, col, y = 0.03, sx = 1.3, sz = 0.85) {
  const m = new T.Mesh(geo.circle(r, 28), toon(col));
  m.rotation.x = -Math.PI / 2; m.position.y = y; m.scale.set(sx, sz, 1);
  return m;
}

// A farm spot centred on the animal's feet. Props stay low in front and tall behind, so the animal is never hidden.
export function makeSpot(kind) {
  const g = new T.Group();
  if (kind === 'pen') {
    const wood = 0xc98a50;
    g.add(disc(1.25, 0xc9a06a, 0.025, 1.25, 0.9));
    for (const [x, z] of [[-1.4, -0.9], [0, -0.95], [1.4, -0.9], [-1.4, 0.6], [1.4, 0.6]]) g.add(box(0.16, 1.0, 0.16, wood, x, 0.5, z));
    g.add(box(2.95, 0.12, 0.08, wood, 0, 0.75, -0.92), box(2.95, 0.12, 0.08, wood, 0, 0.4, -0.92));
    for (const x of [-1.4, 1.4]) { g.add(box(0.08, 0.12, 1.5, wood, x, 0.75, -0.15), box(0.08, 0.12, 1.5, wood, x, 0.4, -0.15)); }
  } else if (kind === 'hay') {
    const h = makeHay(0.85); h.position.set(1.0, 0, -0.9); h.rotation.y = 0.5;
    const h2 = makeHay(0.7); h2.position.set(-1.1, 0, -1.0); h2.rotation.y = -0.4;
    g.add(h, h2, disc(1.0, 0xf0d070, 0.03, 1.3, 0.8));
    for (let i = 0; i < 9; i++) {
      const s = new T.Mesh(geo.box(0.36, 0.03, 0.04), toon(0xe0b848));
      s.position.set(-0.9 + i * 0.22, 0.05, 0.25 + ((i * 7) % 5) * 0.08); s.rotation.y = i * 1.1;
      g.add(s);
    }
  } else if (kind === 'barn') {
    const wall = box(2.8, 2.6, 0.2, 0xd94f3d, 0, 1.3, -1.2);
    const door = box(1.4, 1.8, 0.06, 0x8a3b2e, 0, 0.9, -1.07);
    for (const k of [-1, 1]) { const r = box(1.75, 0.18, 0.5, 0x8a3b2e, k * 0.72, 2.95, -1.2); r.rotation.z = -k * 0.6; g.add(r); }
    for (const s of [-1, 1]) { const b = box(1.9, 0.1, 0.04, 0xfff6e6, 0, 0.9, -1.03); b.rotation.z = s * 0.9; g.add(b); }
    g.add(wall, door, disc(1.1, 0xf0d070, 0.025, 1.4, 0.7));
  } else if (kind === 'pond') {
    g.add(disc(1.25, 0xb9e98a, 0.02, 1.4, 0.8), disc(1.05, 0x6fd0f0, 0.03, 1.4, 0.8));
    const pad = disc(0.25, 0x58b43a, 0.04, 1, 1); pad.position.set(1.1, 0.04, 0.3); g.add(pad);
    const ring = new T.Mesh(geo.ring(0.5, 0.58, 28), basic(0xffffff, { transparent: true, opacity: 0.5 }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(-0.7, 0.045, 0.2); g.add(ring);
    g.userData.ring = ring;
  } else if (kind === 'mud') {
    g.add(disc(1.2, 0x8a5a34, 0.02, 1.35, 0.8), disc(1.0, 0x6b4423, 0.03, 1.35, 0.8));
    for (const [x, z] of [[-1.0, 0.2], [1.05, -0.1], [0.6, 0.45]]) { const b = mesh(geo.sphere(0.13, 10, 8), 0x5a3a20, { outline: 0.01 }); b.scale.y = 0.45; b.position.set(x, 0.05, z); g.add(b); }
  } else if (kind === 'tree') {
    const t = makeTree(0.75); t.position.set(-1.0, 0, -1.4); g.add(t);
    const apple = mesh(geo.sphere(0.13, 10, 8), 0xff4b4b, { outline: 0.012 }); apple.position.set(0.9, 0.12, 0.3); g.add(apple);
  } else if (kind === 'flowers') {
    const cols = [0xff8fc0, 0xffd23f, 0xffffff, 0xa77bff, 0xff5a5a];
    for (let i = 0; i < 7; i++) { const f = makeFlower(cols[i % 5]); const a = Math.PI * (0.05 + i * 0.15); f.position.set(-Math.cos(a) * 1.5, 0, -Math.sin(a) * 0.9 + 0.35); f.scale.setScalar(1.3); g.add(f); }
  } else if (kind === 'trough') {
    const t = box(1.6, 0.55, 0.6, 0xa0623a, 1.2, 0.3, -1.0);
    const w = new T.Mesh(geo.box(1.45, 0.05, 0.45), toon(0x6fd0f0)); w.position.set(1.2, 0.56, -1.0);
    for (const x of [0.55, 1.85]) g.add(box(0.12, 0.3, 0.7, 0x7a4a26, x, 0.15, -1.0));
    const bucket = mesh(geo.cyl(0.25, 0.2, 0.4, 14), 0xb9c4cc, { outline: 0.02 }); bucket.position.set(-1.2, 0.2, -0.3);
    g.add(t, w, bucket);
  }
  g.userData.kind = kind;
  return g;
}

// ---- the sound bubble: a speech bubble by Pip with a little icon (the animal on Levels 1-2, just a note on Level 3) ----
const ICON = { cow: '🐮', pig: '🐷', sheep: '🐑', duck: '🦆', hen: '🐔', horse: '🐴' };
const texCache = new Map();
function bubbleTex(icon, col) {
  const key = icon + col;
  if (texCache.has(key)) return texCache.get(key);
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d');
  x.lineWidth = 10; x.strokeStyle = '#3a2838'; x.fillStyle = '#ffffff';
  x.beginPath(); x.ellipse(128, 112, 104, 88, 0, 0, Math.PI * 2); x.fill(); x.stroke();
  // tail towards Pip (bottom-left)
  x.beginPath(); x.moveTo(52, 170); x.lineTo(22, 240); x.lineTo(96, 192); x.closePath(); x.fill(); x.stroke();
  x.fillStyle = '#ffffff'; x.beginPath(); x.ellipse(128, 112, 98, 82, 0, 0, Math.PI * 2); x.fill();
  // sound waves either side
  x.strokeStyle = col; x.lineWidth = 9; x.lineCap = 'round';
  for (const s of [-1, 1]) for (const r of [26, 46]) { x.beginPath(); x.arc(128 + s * 52, 112, r, s < 0 ? Math.PI * 0.75 : -Math.PI * 0.25, s < 0 ? Math.PI * 1.25 : Math.PI * 0.25); x.stroke(); }
  x.textAlign = 'center'; x.textBaseline = 'middle';
  if (icon === '♪') { x.fillStyle = col; x.font = 'bold 110px sans-serif'; x.fillText('♪', 128, 116); }
  else { x.font = '92px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; x.fillText(icon, 128, 118); }
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace;
  texCache.set(key, t);
  return t;
}
export function makeSoundBubble() {
  const mat = new T.SpriteMaterial({ transparent: true, depthTest: false, fog: false });
  const sp = new T.Sprite(mat);
  sp.renderOrder = 10;
  sp.visible = false;
  sp.userData.size = 2.6;
  return sp;
}
export function setBubble(sp, kind, col, soundOnly) {
  sp.material.map = bubbleTex(soundOnly ? '♪' : ICON[kind], col);
  sp.material.needsUpdate = true;
}

// ---- signature moves (each about 0.8 s). s = tween scope, root = where temporary bits go ----
function bits(s, root, pos, col, n, { up = 3, spread = 2.5, r = 0.1, life = 0.6 } = {}) {
  for (let i = 0; i < n; i++) {
    const d = mesh(geo.sphere(r, 8, 6), col, { outline: 0 });
    d.position.copy(pos); root.add(d);
    const a = Math.random() * Math.PI * 2, sp = spread * (0.5 + Math.random() * 0.6);
    const v = new T.Vector3(Math.cos(a) * sp, up * (0.6 + Math.random() * 0.6), Math.sin(a) * sp * 0.4 + 0.6);
    const p0 = pos.clone();
    s.anim(life + Math.random() * 0.2, (_, q) => {
      const t = q * 0.7;
      d.position.set(p0.x + v.x * t, Math.max(0.05, p0.y + v.y * t - 6 * t * t), p0.z + v.z * t);
      d.scale.setScalar(1 - q * 0.5);
    }).then(() => root.remove(d));
  }
}
function puddle(s, root, pos, col) {
  const p = disc(0.9, col, 0.05, 1.3, 0.8); p.position.x = pos.x; p.position.z = pos.z + 0.2;
  root.add(p);
  p.scale.set(0.01, 0.01, 1);
  s.tween(p.scale, { x: 1.3, y: 0.8 }, 0.25, Ease.back);
  return p;
}

export const SIGNATURE = {
  // the cow munches a mouthful of grass
  async cow(s, a, root) {
    const h = a.userData.head;
    const tuft = new T.Group();
    for (let i = -2; i <= 2; i++) { const b = mesh(geo.cone(0.07, 0.6, 5), i % 2 ? 0x58b43a : 0x7fc24a, { outline: 0.01 }); b.position.set(0.25, i * 0.05, 0); b.rotation.z = -Math.PI / 2 + i * 0.25; tuft.add(b); }
    const fl = mesh(geo.sphere(0.07, 8, 6), 0xffd23f, { outline: 0.008 }); fl.position.set(0.55, 0.12, 0); tuft.add(fl);
    tuft.position.set(0.1, -0.42, 0.8); h.add(tuft);
    const r0 = h.rotation.z, x0 = h.rotation.x;
    sfx.rustle();
    await s.anim(0.75, (_, p) => {
      h.rotation.z = r0 + Math.sin(p * Math.PI * 8) * 0.12;
      h.rotation.x = x0 + Math.abs(Math.sin(p * Math.PI * 4)) * 0.08;
      tuft.scale.setScalar(Math.max(0.01, 1.5 * (1 - p)));
      tuft.rotation.z = Math.sin(p * Math.PI * 8) * 0.3;
      if (Math.floor(p * 4) !== tuft.userData.c) { tuft.userData.c = Math.floor(p * 4); sfx.crunch(); }
    });
    h.remove(tuft); h.rotation.z = r0; h.rotation.x = x0;
    sfx.mmm();
  },
  // the pig rolls over in a mud puddle and gets a muddy spot
  async pig(s, a, root) {
    const home = a.position.clone(), base = a.userData.baseScale ?? 1, c = 0.9 * base;
    puddle(s, root, home, 0x6b4423);
    sfx.splash();
    // roll over sideways around the middle of the body
    await s.anim(0.7, (e) => {
      const th = e * Math.PI * 2;
      a.rotation.z = th;
      a.position.set(home.x + c * Math.sin(th), home.y + c - c * Math.cos(th) + Math.sin(e * Math.PI) * 0.3, home.z);
    }, Ease.inOut);
    a.rotation.z = 0; a.position.copy(home);
    bits(s, root, home.clone().add(new T.Vector3(0, 0.3, 0.3)), 0x6b4423, 10, { up: 3, spread: 2.2, r: 0.11 });
    sfx.thunk();
    for (const [x, y, z] of [[0.32, 0.95, 0.72], [-0.38, 0.6, 0.7], [0.12, 0.4, 0.78]]) { const m = mesh(geo.sphere(0.17, 10, 8), 0x6b4423, { outline: 0.01 }); m.scale.set(1.2, 0.9, 0.5); m.position.set(x, y, z); a.add(m); }
  },
  // the sheep's wool goes POOF
  async sheep(s, a, root) {
    const base = a.userData.baseScale ?? 1;
    await s.anim(0.12, (_, p) => { const k = 1 - 0.15 * p; a.scale.set(base / k, base * k, base / k); });
    sfx.pop();
    const c = a.position.clone().add(new T.Vector3(0, 1.0 * base, 0.2));
    for (let i = 0; i < 10; i++) {
      const w = mesh(geo.sphere(0.24, 10, 8), 0xfffaf0, { outline: 0.015 });
      w.position.copy(c); root.add(w);
      const ang = (i / 10) * Math.PI * 2, v = new T.Vector3(Math.cos(ang) * 1.6, Math.sin(ang) * 1.3 + 0.6, 0.5);
      s.anim(0.6, (_, q) => { w.position.copy(c).addScaledVector(v, Ease.out(q)); w.scale.setScalar(Math.max(0.01, 1.2 - q)); }).then(() => root.remove(w));
    }
    await s.anim(0.6, (_, p) => { const k = 1 + 0.35 * Math.sin(p * Math.PI) * (1 - p * 0.3); a.scale.set(base * k, base * (1 + (k - 1) * 0.6), base * k); }, Ease.out);
    a.scale.setScalar(base);
  },
  // the hen squats and lays an egg, which rolls out in front
  async hen(s, a, root) {
    const base = a.userData.baseScale ?? 1;
    const r0 = a.rotation.z;
    await s.anim(0.35, (_, p) => { const k = 1 - 0.2 * Math.sin(p * Math.PI / 2); a.scale.set(base / Math.sqrt(k), base * k, base / Math.sqrt(k)); a.rotation.z = r0 + Math.sin(p * Math.PI * 6) * 0.08; });
    a.rotation.z = r0;
    const egg = mesh(geo.sphere(0.22, 14, 10), 0xfff3dc, { outline: 0.02 }); egg.scale.set(0.85, 1.1, 0.85);
    egg.position.copy(a.position).add(new T.Vector3(0, 0.25, -0.2)); root.add(egg);
    sfx.pop();
    s.anim(0.2, (_, p) => { const k = 1 + 0.25 * Math.sin(p * Math.PI); a.scale.set(base / Math.sqrt(k), base * k, base / Math.sqrt(k)); }).then(() => a.scale.setScalar(base));
    const z0 = egg.position.z;
    await s.anim(0.45, (e, p) => { egg.position.z = z0 + e * 1.4; egg.position.y = 0.25 + Math.abs(Math.sin(p * Math.PI * 2)) * 0.25 * (1 - p); egg.rotation.x = e * 6; }, Ease.out);
    egg.rotation.x = 0;
    sfx.cheep();
    fx.float(egg.position.clone().add(new T.Vector3(0, 0.5, 0)), '✨', { size: 5 });
    return egg; // stays until the next round
  },
  // the horse trots clip-clop on the spot, then rears
  async horse(s, a, root) {
    const y0 = a.position.y, r0 = a.rotation.z, x0 = a.rotation.x;
    for (let i = 0; i < 4; i++) {
      (i % 2 ? sfx.tick : sfx.tap)();
      bits(s, root, a.position.clone().add(new T.Vector3((i % 2 ? 0.35 : -0.35), 0.1, 0.3)), 0xd9b27a, 3, { up: 1.2, spread: 0.8, r: 0.08, life: 0.35 });
      await s.anim(0.13, (_, p) => { a.position.y = y0 + Math.sin(p * Math.PI) * 0.18; a.rotation.z = r0 + (i % 2 ? 1 : -1) * Math.sin(p * Math.PI) * 0.08; });
    }
    a.position.y = y0; a.rotation.z = r0;
    await s.anim(0.3, (_, p) => { a.rotation.x = x0 - Math.sin(p * Math.PI) * 0.35; });
    a.rotation.x = x0;
  },
  // the duck dunks in a puddle and splashes
  async duck(s, a, root) {
    const home = a.position.clone();
    puddle(s, root, home, 0x6fd0f0);
    await s.anim(0.25, (_, p) => { a.position.y = home.y - Math.sin(p * Math.PI / 2) * 0.35; a.rotation.x = Math.sin(p * Math.PI / 2) * 0.5; });
    sfx.splash();
    bits(s, root, home.clone().add(new T.Vector3(0, 0.3, 0.3)), 0x7fd0ff, 14, { up: 4, spread: 2.2, r: 0.1 });
    await s.anim(0.35, (_, p) => { a.position.y = home.y - 0.35 + Math.sin(p * Math.PI) * 0.9 + p * 0.35; a.rotation.x = 0.5 * (1 - p); }, Ease.out);
    a.position.copy(home); a.rotation.x = 0;
  },
};
