// Dress Monkey: the cosy bedroom (wallpaper, wooden floor, rug, a window that shows the weather, a wall mirror
// with a "reflection room" behind it), the picture bubble, the body-part glow and the magic puff.
import * as T from '../three.js';
import { mesh, geo, toon, basic } from '../engine/toon.js';
import { WEATHER } from './dress-clothes.js';
import { scMesh, scProp } from '../engine/scenery.js';

export const WALL_Z = -4.5;
export const MIRROR = { x: -5.7, y0: 0.45, y1: 5.2, hw: 1.25 };    // the hole in the wall the mirror covers
export const WINDOW = { x: 1.7, y: 6.5, hw: 1.5, hh: 1.05 };

function canvasTex(w, h, draw, repeat = null) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new T.CanvasTexture(c);
  t.colorSpace = T.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}
const flat = (map, extra = {}) => new T.MeshBasicMaterial({ map, fog: false, ...extra });

function wallpaper(tint = 0) {
  return canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = tint ? '#e3f1ff' : '#ffeedd'; g.fillRect(0, 0, w, h);
    g.fillStyle = tint ? '#d3e7fb' : '#ffe2cc'; g.fillRect(0, 0, w / 2, h);
    // little hearts and dots
    g.fillStyle = tint ? '#bcd8f5' : '#ffc4b0';
    const heart = (x, y, s) => { g.beginPath(); g.moveTo(x, y + s * 0.35); g.bezierCurveTo(x, y, x - s, y, x - s, y + s * 0.35); g.bezierCurveTo(x - s, y + s * 0.8, x, y + s, x, y + s * 1.25); g.bezierCurveTo(x, y + s, x + s, y + s * 0.8, x + s, y + s * 0.35); g.bezierCurveTo(x + s, y, x, y, x, y + s * 0.35); g.fill(); };
    heart(32, 20, 9); heart(96, 84, 9);
    g.fillStyle = tint ? '#fff' : '#fff6ee';
    for (const [x, y] of [[96, 26], [32, 92]]) { g.beginPath(); g.arc(x, y, 5, 0, Math.PI * 2); g.fill(); }
  }, [14, 6]);
}
function planks() {
  return canvasTex(256, 256, (g, w, h) => {
    const cols = ['#f1c58c', '#ecbd82', '#f4cb95', '#e9b97c'];
    for (let i = 0; i < 8; i++) {
      g.fillStyle = cols[i % 4]; g.fillRect(0, i * 32, w, 32);
      g.fillStyle = '#d59f62'; g.fillRect(0, i * 32, w, 3);
      g.fillRect(((i * 97) % 200) + 20, i * 32, 3, 32);
      g.fillStyle = 'rgba(200,140,80,0.25)';
      for (let k = 0; k < 3; k++) g.fillRect((i * 53 + k * 71) % w, i * 32 + 10 + k * 6, 40, 2);
    }
  }, [6, 4]);
}
function rugTex() {
  return canvasTex(256, 256, (g, w, h) => {
    const cols = ['#ff9ec4', '#fff2f7', '#b99cf0', '#fff2f7', '#8fe0cf', '#fff2f7', '#ffd36b'];
    cols.forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.arc(128, 128, 126 - i * 18, 0, Math.PI * 2); g.fill(); });
    g.fillStyle = '#ffffff';
    for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; g.beginPath(); g.arc(128 + Math.cos(a) * 117, 128 + Math.sin(a) * 117, 4, 0, Math.PI * 2); g.fill(); }
  });
}
function box(w, h, d, col, x, y, z) { const m = mesh(geo.box(w, h, d), col, { hull: 1.03, outline: 0 }); m.position.set(x, y, z); return m; }

// ---------------- the room ----------------
export function makeRoom() {
  const g = new T.Group();
  const wp = wallpaper();
  // back wall, built round the mirror's hole
  const M = MIRROR, W0 = -22, W1 = 22, H = 18;
  const wallPiece = (x0, x1, y0, y1) => {
    const t = wp.clone(); t.needsUpdate = true;
    t.repeat.set((x1 - x0) / 3, (y1 - y0) / 3); t.offset.set(x0 / 3, y0 / 3);
    const m = new T.Mesh(new T.PlaneGeometry(x1 - x0, y1 - y0), flat(t));
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, WALL_Z);
    g.add(m);
  };
  wallPiece(W0, M.x - M.hw, 0, H); wallPiece(M.x + M.hw, W1, 0, H);
  wallPiece(M.x - M.hw, M.x + M.hw, M.y1, H); wallPiece(M.x - M.hw, M.x + M.hw, 0, M.y0);
  // floor
  const floor = new T.Mesh(new T.PlaneGeometry(44, 24), flat(planks()));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, WALL_Z + 12);
  g.add(floor);
  // skirting board and a dado rail
  g.add(box(44, 0.35, 0.12, 0xffffff, 0, 0.17, WALL_Z + 0.06));
  // (in two pieces: it must not run across the mirror's glass)
  const rx0 = M.x - M.hw - 0.3, rx1 = M.x + M.hw + 0.3;
  g.add(box(rx0 - W0, 0.12, 0.08, 0xffc8a8, (W0 + rx0) / 2, 2.6, WALL_Z + 0.04), box(W1 - rx1, 0.12, 0.08, 0xffc8a8, (rx1 + W1) / 2, 2.6, WALL_Z + 0.04));
  // rug under Monkey
  const rug = new T.Mesh(new T.CircleGeometry(2.6, 48), flat(rugTex()));
  rug.rotation.x = -Math.PI / 2; rug.scale.set(1.25, 0.85, 1); rug.position.set(-2.6, 0.02, 1.2);
  g.add(rug);

  // ---- window with curtains and live weather ----
  const Wn = WINDOW;
  const sky = new T.Mesh(new T.PlaneGeometry(Wn.hw * 2, Wn.hh * 2), flat(null));
  sky.position.set(Wn.x, Wn.y, WALL_Z + 0.02);
  g.add(sky);
  // the window frame, gathered curtains with gold tie-backs and a gold rod (Blender props; boxes if not built)
  const wFrame = scMesh('prop_window', 'prop_window', { ink: 0.022 });
  const fr = 0xffffff;
  if (wFrame) { wFrame.position.set(Wn.x, Wn.y, WALL_Z); g.add(wFrame); } else {
    g.add(box(Wn.hw * 2 + 0.3, 0.2, 0.2, fr, Wn.x, Wn.y + Wn.hh + 0.05, WALL_Z + 0.1), box(Wn.hw * 2 + 0.5, 0.22, 0.4, fr, Wn.x, Wn.y - Wn.hh - 0.06, WALL_Z + 0.2));
    g.add(box(0.2, Wn.hh * 2 + 0.2, 0.2, fr, Wn.x - Wn.hw - 0.05, Wn.y, WALL_Z + 0.1), box(0.2, Wn.hh * 2 + 0.2, 0.2, fr, Wn.x + Wn.hw + 0.05, Wn.y, WALL_Z + 0.1));
    g.add(box(0.1, Wn.hh * 2, 0.1, fr, Wn.x, Wn.y, WALL_Z + 0.08), box(Wn.hw * 2, 0.1, 0.1, fr, Wn.x, Wn.y, WALL_Z + 0.08));
  }
  const curtains = [];
  for (const s of [-1, 1]) {
    const c = new T.Group();
    const cur = scProp('prop_curtain', { prop_curtain: { tint: 0xff9ec4 }, tie: { tint: 0xffc531, ink: 0.016 } }, { ink: 0.02 });
    if (cur) { cur.scale.set(-s * 1.1, Wn.hh * 2 + 0.75, 1); cur.position.set(0, -Wn.hh - 0.55, -0.1); c.add(cur); }
    else for (let i = 0; i < 4; i++) {
      const f = mesh(geo.cyl(0.17, 0.24, Wn.hh * 2 + 0.7, 12), i % 2 ? 0xff9ec4 : 0xff8ab6, { outline: 0.02 });
      f.position.set(s * (i * 0.26), -0.1, 0);
      c.add(f);
    }
    c.position.set(Wn.x + s * (Wn.hw + 0.25), Wn.y, WALL_Z + 0.35);
    g.add(c); curtains.push(c);
  }
  const rod = mesh(geo.cyl(0.07, 0.07, Wn.hw * 2 + 2.6, 12), 0xffc531, { outline: 0.018 }); rod.rotation.z = Math.PI / 2;
  rod.position.set(Wn.x, Wn.y + Wn.hh + 0.4, WALL_Z + 0.4); g.add(rod);
  for (const s of [-1, 1]) { const k = mesh(geo.sphere(0.15, 14, 10), 0xffc531, { outline: 0.018 }); k.position.set(Wn.x + s * (Wn.hw + 1.35), Wn.y + Wn.hh + 0.4, WALL_Z + 0.4); g.add(k); }
  const weather = new T.Group();
  weather.position.set(Wn.x, Wn.y, WALL_Z + 0.05);
  g.add(weather);

  // ---- a shelf with toys, and framed pictures ----
  const shelf = scProp('prop_shelf', { toys: {} }, { ink: 0.022 });
  if (shelf) { shelf.position.set(-2.3, 6.3, WALL_Z + 0.25); g.add(shelf); } else {   // clear of the window curtain
    g.add(box(2.6, 0.12, 0.5, 0xffffff, -1.6, 6.3, WALL_Z + 0.25));
    const ball = mesh(geo.sphere(0.32, 18, 12), 0xff5a5a, { outline: 0.02 }); ball.position.set(-2.4, 6.68, WALL_Z + 0.3); g.add(ball);
    const stripe = mesh(geo.torus(0.32, 0.05, Math.PI * 2, 8, 24), 0xffffff, { outline: 0 }); stripe.position.copy(ball.position); g.add(stripe);
    for (const [x, col, h] of [[-1.5, 0x5ab4ff, 0.5], [-1.05, 0xffd23f, 0.4], [-0.65, 0x5fd068, 0.6]]) g.add(box(0.36, h, 0.36, col, x, 6.36 + h / 2, WALL_Z + 0.3));
  }
  const pic = (x, y, col) => {
    const fp = scProp('prop_frame', { canvas: { tint: col, ink: 0 }, art: { ink: 0.012 } }, { ink: 0.02 });
    if (fp) { fp.position.set(x, y, WALL_Z); g.add(fp); return; }
    g.add(box(1.3, 1.0, 0.08, 0xffffff, x, y, WALL_Z + 0.05));
    const p = new T.Mesh(new T.PlaneGeometry(1.0, 0.7), basic(col, { fog: false })); p.position.set(x, y, WALL_Z + 0.1); g.add(p);
    const sun = new T.Mesh(geo.circle(0.15, 16), basic(0xffd23f, { fog: false })); sun.position.set(x + 0.25, y + 0.12, WALL_Z + 0.11); g.add(sun);
    const hill = new T.Mesh(geo.circle(0.45, 20, 0), basic(0x5fd068, { fog: false })); hill.scale.y = 0.4; hill.position.set(x - 0.1, y - 0.3, WALL_Z + 0.11); g.add(hill);
  };
  pic(8.6, 5.2, 0x9ad8ff);
  pic(-9.3, 5.6, 0xffd6e8);

  // ---- the wall mirror: a pink-and-gold frame round the hole, glass in it, a little room behind it ----
  const mx = M.x, my = (M.y0 + M.y1) / 2, mh = (M.y1 - M.y0) / 2;
  const frame = new T.Group();
  const mirrorProp = scProp('prop_mirror', { gold: {}, bow: {} }, { ink: 0.025 });
  if (mirrorProp) frame.add(mirrorProp);
  const bar = mirrorProp ? () => {} : (len, x, y, rotZ) => { const b = mesh(geo.cyl(0.17, 0.17, len, 14), 0xff9ec4, { outline: 0.025 }); b.position.set(x, y, 0); b.rotation.z = rotZ; frame.add(b); };
  bar(mh * 2, -M.hw - 0.05, 0, 0); bar(mh * 2, M.hw + 0.05, 0, 0); bar(M.hw * 2, 0, mh + 0.05, Math.PI / 2); bar(M.hw * 2, 0, -mh - 0.05, Math.PI / 2);
  if (!mirrorProp) for (const [x, y] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const k = mesh(geo.sphere(0.26, 16, 12), 0xffc531, { outline: 0.02 }); k.position.set(x * (M.hw + 0.05), y * (mh + 0.05), 0.02); frame.add(k); }
  const bow = new T.Group();
  for (const s of [-1, 1]) { const l = mesh(geo.sphere(0.32, 14, 10), 0xff6fa8, { outline: 0.02 }); l.scale.set(1.1, 0.7, 0.4); l.position.set(s * 0.33, 0, 0); l.rotation.z = s * 0.3; bow.add(l); }
  const knot = mesh(geo.sphere(0.15, 12, 10), 0xff4b8a, { outline: 0.02 }); bow.add(knot);
  bow.position.set(0, mh + 0.3, 0.12); if (!mirrorProp) frame.add(bow);
  frame.position.set(mx, my, WALL_Z + 0.12);
  g.add(frame);
  const glassTex = canvasTex(128, 256, (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#e6f7ff'); gr.addColorStop(1, '#b8def5');
    c.fillStyle = gr; c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineCap = 'round';
    for (const [x0, y0, x1, y1, lw] of [[20, 120, 70, 60, 10], [30, 150, 90, 80, 5], [60, 230, 110, 170, 7]]) { c.lineWidth = lw; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); }
  });
  const glass = new T.Mesh(new T.PlaneGeometry(M.hw * 2, mh * 2), flat(glassTex, { transparent: true, opacity: 1, depthWrite: false }));
  glass.position.set(mx, my, WALL_Z + 0.01);
  glass.renderOrder = 2;
  g.add(glass);
  // the reflection room (only seen through the hole): same wallpaper, cooler and paler; a floor
  const back = new T.Group();
  const D = 9;
  const rwall = new T.Mesh(new T.PlaneGeometry(12, 10), flat(wallpaper(1)));
  rwall.position.set(mx, 5, WALL_Z - D);
  const rfloor = new T.Mesh(new T.PlaneGeometry(12, D), flat(planks(), { color: 0xdde8ff }));
  rfloor.rotation.x = -Math.PI / 2; rfloor.position.set(mx, 0, WALL_Z - D / 2);
  for (const s of [-1, 1]) {
    const side = new T.Mesh(new T.PlaneGeometry(D, 10), flat(wallpaper(1), { side: T.DoubleSide }));
    side.rotation.y = Math.PI / 2; side.position.set(mx + s * 6, 5, WALL_Z - D / 2);
    back.add(side);
  }
  back.add(rwall, rfloor);
  g.add(back);

  const room = {
    group: g, sky, weather, curtains, glass, frame, kind: null, parts: [],
    setWeather(kind) { setWeather(room, kind); },
    update(dt, t) { updateWeather(room, dt, t); },
  };
  return room;
}

// ---------------- weather in the window ----------------
const skyCache = {};
function skyTex(kind) {
  if (skyCache[kind]) return skyCache[kind];
  const [a, b] = WEATHER[kind].sky;
  skyCache[kind] = canvasTex(8, 128, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, a); gr.addColorStop(1, b); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  return skyCache[kind];
}
function setWeather(room, kind) {
  if (room.kind === kind) return;
  room.kind = kind;
  room.sky.material.map = skyTex(kind);
  room.sky.material.needsUpdate = true;
  const w = room.weather;
  for (const c of [...w.children]) w.remove(c);
  room.parts = [];
  const { hw, hh } = WINDOW;
  const add = (m, x, y, data = {}) => { m.position.set(x, y, data.z ?? 0.02); w.add(m); room.parts.push({ m, ...data }); return m; };
  const cloud = (x, y, col, s = 1) => {
    const c = new T.Group();
    for (const [dx, dy, r] of [[-0.3, 0, 0.26], [0, 0.1, 0.33], [0.32, 0, 0.25]]) { const p = new T.Mesh(geo.circle(r, 18), basic(col, { fog: false })); p.position.set(dx, dy, 0); c.add(p); }
    c.scale.setScalar(s);
    return add(c, x, y, { cloud: true, z: 0.03 });
  };
  const fxk = WEATHER[kind].fx;
  if (fxk === 'sun') {
    const sun = new T.Group();
    sun.add(new T.Mesh(geo.circle(0.38, 24), basic(0xffd23f, { fog: false })));
    for (let i = 0; i < 8; i++) { const r = new T.Mesh(geo.box(0.07, 0.22, 0.01), basic(0xffe680, { fog: false })); const a = (i / 8) * Math.PI * 2; r.position.set(Math.sin(a) * 0.55, Math.cos(a) * 0.55, -0.005); r.rotation.z = -a; sun.add(r); }
    add(sun, 0.7, 0.45, { spin: 0.6 });
    cloud(-0.8, -0.3, 0xffffff, 0.8);
  } else if (fxk === 'rain' || fxk === 'snow') {
    cloud(-0.7, 0.75, fxk === 'rain' ? 0x8d96a8 : 0xeef4ff, 1.1); cloud(0.6, 0.85, fxk === 'rain' ? 0x7d879a : 0xffffff, 1.2);
    for (let i = 0; i < 26; i++) {
      const m = fxk === 'rain' ? new T.Mesh(geo.box(0.03, 0.2, 0.01), basic(0x5aa0ff, { fog: false })) : new T.Mesh(geo.circle(0.055, 8), basic(0xffffff, { fog: false }));
      if (fxk === 'rain') m.rotation.z = 0.25;
      add(m, (Math.random() * 2 - 1) * hw, (Math.random() * 2 - 1) * hh, { fall: fxk === 'rain' ? 3.2 : 0.5, drift: fxk === 'rain' ? -0.8 : 0.25, ph: Math.random() * 6 });
    }
  } else if (fxk === 'wind') {
    cloud(-0.6, 0.6, 0xffffff, 0.9); cloud(0.8, 0.2, 0xffffff, 0.7);
    for (let i = 0; i < 7; i++) {
      const leaf = new T.Mesh(geo.circle(0.09, 10), basic([0x5fd068, 0xffb020, 0xff7a3f][i % 3], { fog: false }));
      leaf.scale.set(1.6, 0.8, 1);
      add(leaf, (Math.random() * 2 - 1) * hw, (Math.random() * 2 - 1) * hh * 0.8, { blow: 1.6 + Math.random(), ph: Math.random() * 6, spin: 4 });
    }
  } else if (fxk === 'stars') {
    const moon = new T.Mesh(geo.circle(0.32, 24), basic(0xfff3b0, { fog: false })); add(moon, -0.75, 0.45);
    const bite = new T.Mesh(geo.circle(0.28, 24), basic(0x2f3575, { fog: false })); add(bite, -0.6, 0.55, { z: 0.025 });
    for (let i = 0; i < 12; i++) add(new T.Mesh(geo.circle(0.05, 5), basic(0xffffff, { fog: false })), (Math.random() * 2 - 1) * hw, (Math.random() * 2 - 1) * hh, { twinkle: true, ph: Math.random() * 6 });
  } else if (fxk === 'balloons') {
    for (let i = 0; i < 6; i++) {
      const b = new T.Mesh(geo.circle(0.16, 14), basic([0xff5a5a, 0xffd23f, 0x5ab4ff, 0xa77bff, 0x5fd068, 0xff8fc0][i], { fog: false }));
      b.scale.y = 1.2;
      add(b, (i / 5 - 0.5) * hw * 1.8, (Math.random() * 2 - 1) * hh, { rise: 0.4 + Math.random() * 0.3, ph: Math.random() * 6 });
    }
  }
}
function updateWeather(room, dt, t) {
  const { hw, hh } = WINDOW;
  for (const p of room.parts) {
    const m = p.m;
    if (p.fall) {
      m.position.y -= p.fall * dt; m.position.x += (p.drift + Math.sin(t * 2 + p.ph) * 0.1) * dt;
      if (m.position.y < -hh) { m.position.y = hh; m.position.x = (Math.random() * 2 - 1) * hw; }
      if (m.position.x < -hw) m.position.x += hw * 2; if (m.position.x > hw) m.position.x -= hw * 2;
    }
    if (p.blow) {
      m.position.x += p.blow * dt; m.position.y += Math.sin(t * 3 + p.ph) * 0.4 * dt; m.rotation.z += p.spin * dt;
      if (m.position.x > hw) { m.position.x = -hw; m.position.y = (Math.random() * 2 - 1) * hh * 0.8; }
    } else if (p.spin) m.rotation.z += p.spin * dt;
    if (p.rise) { m.position.y += p.rise * dt; m.position.x += Math.sin(t * 1.5 + p.ph) * 0.15 * dt; if (m.position.y > hh) m.position.y = -hh; }
    if (p.twinkle) m.scale.setScalar(0.6 + 0.4 * Math.abs(Math.sin(t * 2 + p.ph)));
    if (p.cloud) m.position.x += Math.sin(t * 0.4) * 0.03 * dt;
  }
  // curtains sway a little (more when windy)
  const k = room.kind === 'windy' ? 0.06 : 0.015;
  room.curtains.forEach((c, i) => { c.rotation.z = Math.sin(t * (room.kind === 'windy' ? 3 : 1) + i) * k; });
}

// ---------------- picture bubble: one design at every level ----------------
// A plain thought bubble; the wanted garment itself sits in it as a small turning 3-D model (dress.js). On the weather
// level a little round weather badge sits on the bubble's rim, clear of the garment. The trail of dots runs down-left
// toward Monkey's head and ends beside it, never on it.
function drawBadge(g, kind, x, y) {
  if (kind !== 'snowy' && kind !== 'sunny' && kind !== 'rainy') return;
  g.save();
  g.translate(x, y);
  g.fillStyle = kind === 'snowy' ? '#dff0ff' : kind === 'sunny' ? '#fff3c4' : '#e3ecf7';
  g.strokeStyle = '#3a2838'; g.lineWidth = 5;
  g.beginPath(); g.arc(0, 0, 30, 0, Math.PI * 2); g.fill(); g.stroke();
  g.lineCap = 'round';
  if (kind === 'snowy') {
    // a chunky six-armed snowflake
    g.strokeStyle = '#4a90ff'; g.lineWidth = 5;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2, cx = Math.sin(a), cy = -Math.cos(a);
      g.beginPath(); g.moveTo(0, 0); g.lineTo(cx * 19, cy * 19); g.stroke();
      for (const s of [-1, 1]) {
        const b = a + s * 0.7;
        g.beginPath(); g.moveTo(cx * 11, cy * 11); g.lineTo(cx * 11 + Math.sin(b) * 7, cy * 11 - Math.cos(b) * 7); g.stroke();
      }
    }
    g.fillStyle = '#4a90ff'; g.beginPath(); g.arc(0, 0, 4.5, 0, Math.PI * 2); g.fill();
  } else if (kind === 'sunny') {
    g.strokeStyle = '#ffb020'; g.lineWidth = 4;
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; g.beginPath(); g.moveTo(Math.sin(a) * 14, Math.cos(a) * 14); g.lineTo(Math.sin(a) * 21, Math.cos(a) * 21); g.stroke(); }
    g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(0, 0, 11, 0, Math.PI * 2); g.fill();
  } else {
    g.fillStyle = '#9aa6bd';
    for (const [dx, dy, r] of [[-8, -3, 9], [3, -8, 11], [12, -2, 8]]) { g.beginPath(); g.arc(dx, dy, r, 0, Math.PI * 2); g.fill(); }
    g.strokeStyle = '#4a90ff'; g.lineWidth = 3.5;
    for (const dx of [-8, 2, 12]) { g.beginPath(); g.moveTo(dx, 8); g.lineTo(dx - 3, 16); g.stroke(); }
  }
  g.restore();
}
const bubbleCache = {};
function bubbleTex(badge) {
  const key = badge || '-';
  if (bubbleCache[key]) return bubbleCache[key];
  bubbleCache[key] = canvasTex(256, 256, (g) => {
    g.fillStyle = '#ffffff'; g.strokeStyle = '#3a2838'; g.lineWidth = 7;
    g.beginPath(); g.arc(128, 110, 100, 0, Math.PI * 2); g.fill(); g.stroke();
    // trail dots, down and to the left (toward Monkey's head)
    g.lineWidth = 5;
    g.beginPath(); g.arc(46, 214, 12, 0, Math.PI * 2); g.fill(); g.stroke();
    g.beginPath(); g.arc(24, 240, 6, 0, Math.PI * 2); g.fill(); g.stroke();
    // a soft blush backing behind the little garment
    g.fillStyle = '#fff1f6'; g.beginPath(); g.arc(128, 110, 81, 0, Math.PI * 2); g.fill();
    if (badge) drawBadge(g, badge, 205, 36);
  });
  return bubbleCache[key];
}
export function makeBubble() {
  // depth-tested (not drawn over everything) so the little 3-D garment in front of it shows
  const sp = new T.Sprite(new T.SpriteMaterial({ transparent: true, depthWrite: false, fog: false }));
  sp.renderOrder = 10;
  sp.visible = false;
  sp.userData.size = 1.95;
  sp.userData.centre = new T.Vector2(0, (128 - 110) / 256);   // the round part's centre (sprite units)
  return sp;
}
// badge: a weather kind ('snowy', ...) for a small badge on the rim, or null
export function setBubble(sp, badge = null) {
  sp.material.map = bubbleTex(badge);
  sp.material.needsUpdate = true;
}

// ---------------- the clothes rail: a Blender rail; each garment hangs from it on a real hanger ----------------
// RAIL.cx: the rail's centre; posts at cx +- hw; the bar at y. A coat hanger / trouser hanger hooks over the bar.
export const RAIL = { cx: 4.5, hw: 2.9, y: 4.6, z: 1.6 };
const RK = 'prop_dress_rail';
export function makeRail() {
  const g = new T.Group();
  const frame = scProp(RK, { gold: {} }, { ink: 0.022 });
  if (frame) { frame.position.x = RAIL.cx; g.add(frame); return g; }
  // fallback (model not built): plain bar and posts
  const { cx, hw, y } = RAIL;
  const bar = mesh(geo.cyl(0.07, 0.07, hw * 2 + 0.2, 14), 0xffc531, { outline: 0.02 });
  bar.rotation.z = Math.PI / 2; bar.position.set(cx, y, 0);
  g.add(bar);
  for (const x of [cx - hw, cx + hw]) {
    const pole = mesh(geo.cyl(0.08, 0.08, y, 12), 0xff9ec4, { outline: 0.02 }); pole.position.set(x, y / 2, 0);
    g.add(pole);
  }
  return g;
}
// A hanger hooked on the bar (group origin = where the hook rests on the bar). kind 'coat' (tops) or 'clip'.
// Geometry (unscaled): coat shoulders at y -0.42, 1.56 wide; clip bar at y -0.34, 1.6 wide; a clip hangs 0.34 below it.
export const HANGER = { coatY: -0.42, clipY: -0.34, clipLen: 0.34 };
export function makeHanger(kind) {
  const g = new T.Group();
  const l = kind === 'coat' ? 'hanger' : 'clipbar';
  const body = scMesh(RK, l, { ink: 0.016 }), hook = scMesh(RK, l + 'hook', { ink: 0.014 });
  if (body) g.add(body);
  if (hook) g.add(hook);
  if (!body) {   // fallback: a simple wooden bar and hook
    const b = mesh(geo.cyl(0.05, 0.05, 1.5, 10), 0xe0a66a, { outline: 0.014 }); b.rotation.z = Math.PI / 2; b.position.y = kind === 'coat' ? HANGER.coatY : HANGER.clipY; g.add(b);
    const h = mesh(geo.cyl(0.025, 0.025, 0.35, 8), 0xffc531, { outline: 0.01 }); h.position.y = -0.15; g.add(h);
  }
  return g;
}
export function makeClip() {
  const m = scMesh(RK, 'clip', { ink: 0.012 });
  if (m) return m;
  const b = mesh(geo.box(0.15, 0.34, 0.1), 0xf3c993, { outline: 0.01 }); b.position.y = -0.17;
  const g = new T.Group(); g.add(b); return g;
}

// ---------------- a soft yellow glow sprite (marks the body part on Monkey) ----------------
let glowTex = null;
export function makeGlow() {
  glowTex = glowTex || canvasTex(64, 64, (g) => {
    const r = g.createRadialGradient(32, 32, 2, 32, 32, 32);
    r.addColorStop(0, 'rgba(255,240,140,0.95)'); r.addColorStop(0.45, 'rgba(255,214,70,0.55)'); r.addColorStop(1, 'rgba(255,200,40,0)');
    g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  });
  const sp = new T.Sprite(new T.SpriteMaterial({ map: glowTex, transparent: true, depthTest: false, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
  sp.renderOrder = 9;
  return sp;
}
