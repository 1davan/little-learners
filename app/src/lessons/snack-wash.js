// Snack chef: the hand-washing effects. The running water (a clear stream from the spout with a splash ring), the soap
// foam that grows on the friend's hands as they rub, bubbles that float up and pop, water droplets when hands shake.
// These are effects (like confetti), not objects: soft code shapes in the game's toon style.
import * as T from '../three.js';
import { mesh, geo, basic, toon } from '../engine/toon.js';
import { sfx } from '../engine/audio.js';

// ---- the water stream: spout → basin floor ----
function streamTex() {
  const c = document.createElement('canvas'); c.width = 16; c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#8fd0ff'; g.fillRect(0, 0, 16, 64);
  g.fillStyle = '#d8f1ff';
  for (let y = 0; y < 64; y += 16) { g.fillRect(3, y, 3, 9); g.fillRect(10, y + 7, 2, 6); }
  const t = new T.CanvasTexture(c);
  t.colorSpace = T.SRGBColorSpace;
  t.wrapS = t.wrapT = T.RepeatWrapping;
  return t;
}
export function makeWater(from, floorY) {
  const g = new T.Group();
  const H = from.y - floorY;
  const tex = streamTex();
  tex.repeat.set(1, H * 1.5);
  const stream = new T.Mesh(new T.CylinderGeometry(0.075, 0.1, H, 14, 1, true), new T.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.85, depthWrite: false, fog: false }));
  stream.position.y = -H / 2;
  const pivot = new T.Group();      // scaled in y from the spout down when the tap opens
  pivot.add(stream);
  g.add(pivot);
  const ring = new T.Mesh(geo.torus(0.2, 0.035, Math.PI * 2, 8, 20), basic(0xd8f1ff, { transparent: true, opacity: 0.9, fog: false }));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -H + 0.02;
  g.add(ring);
  g.position.copy(from);
  g.visible = false;
  let on = 0, want = 0;
  return {
    group: g,
    get on() { return want > 0; },
    set(v) { want = v ? 1 : 0; if (v) g.visible = true; },
    update(dt, t) {
      on += (want - on) * Math.min(1, dt * 9);
      if (on < 0.02 && !want) { g.visible = false; return; }
      pivot.scale.set(Math.max(0.2, on), Math.max(0.01, on), Math.max(0.2, on));
      tex.offset.y = -t * 3.5;
      const k = on * (1 + Math.sin(t * 22) * 0.12);
      ring.scale.set(k, k, 1);
      ring.material.opacity = 0.9 * on;
    },
  };
}

// ---- soap foam on the hands: a cluster of white puffs whose size follows `level` (0..1) ----
export function makeFoam() {
  const g = new T.Group();
  const puffs = [];
  const spots = [[0, 0, 0, 0.17], [-0.2, 0.04, 0.02, 0.13], [0.2, 0.03, 0.03, 0.13], [-0.08, 0.15, 0.04, 0.12], [0.1, 0.14, -0.02, 0.12],
    [0.0, -0.1, 0.08, 0.11], [-0.3, -0.05, -0.04, 0.09], [0.3, -0.04, -0.03, 0.09], [0.04, 0.24, 0.0, 0.08]];
  spots.forEach(([x, y, z, r], i) => {
    const m = mesh(geo.sphere(r, 12, 10), i % 3 ? 0xffffff : 0xeaf6ff, { outline: 0.012 });
    m.position.set(x, y, z);
    m.userData.p0 = m.position.clone();
    m.userData.order = i / spots.length;
    g.add(m); puffs.push(m);
  });
  g.visible = false;
  let level = 0, shown = 0;
  return {
    group: g,
    get level() { return level; },
    set(v) { level = Math.max(0, Math.min(1, v)); if (level > 0) g.visible = true; },
    update(dt, t) {
      shown += (level - shown) * Math.min(1, dt * 8);
      if (shown < 0.01 && level === 0) { g.visible = false; return; }
      for (const m of puffs) {
        const u = m.userData;
        const k = Math.max(0.001, Math.min(1, (shown * 1.25 - u.order * 0.6) / 0.65));
        const w = 1 + Math.sin(t * 7 + u.order * 9) * 0.07;
        m.scale.set(k * w, k / w, k);
        m.position.copy(u.p0).multiplyScalar(0.6 + 0.4 * shown);
      }
    },
  };
}

// ---- little floating soap bubbles that pop ----
const bubbleMat = basic(0xffffff, { transparent: true, opacity: 0.55, fog: false });
export function bubbles(s, root, at, n = 4) {
  for (let i = 0; i < n; i++) {
    const r = 0.6 + Math.random() * 0.7;
    const b = mesh(geo.sphere(0.1, 10, 8), 0xffffff, { outline: 0.008, mat: bubbleMat });
    const p0 = at.clone().add(new T.Vector3((Math.random() - 0.5) * 0.5, Math.random() * 0.2, (Math.random() - 0.5) * 0.3));
    b.position.copy(p0);
    root.add(b);
    const dur = 0.6 + Math.random() * 0.5, sway = Math.random() * 6;
    s.anim(dur, (_, p) => {
      b.position.set(p0.x + Math.sin(p * 5 + sway) * 0.12, p0.y + p * 1.0, p0.z);
      b.scale.setScalar(r * (p > 0.85 ? 1 + (p - 0.85) * 4 : 1));
    }).then(() => { root.remove(b); if (Math.random() < 0.5) sfx.bubble(); });
  }
}

// ---- water droplets flicked off wet hands / splashing out of the sink ----
const dropMat = toon(0x6cc4ff);
export function droplets(s, root, at, n = 8, spread = 1) {
  for (let i = 0; i < n; i++) {
    const d = new T.Mesh(geo.sphere(0.06, 8, 6), dropMat);
    const k = 0.8 + Math.random() * 0.5;
    d.position.copy(at);
    root.add(d);
    const a = Math.random() * Math.PI * 2;
    const v = new T.Vector3(Math.cos(a) * 1.8 * spread, 2 + Math.random() * 2, Math.sin(a) * 0.9 * spread + 0.4);
    s.anim(0.5, (_, p) => {
      const t = p * 0.5;
      d.position.set(at.x + v.x * t, at.y + v.y * t - 7 * t * t, at.z + v.z * t);
      d.scale.set(k * (1 - p * 0.6), k * 1.3 * (1 - p * 0.6), k * (1 - p * 0.6));
    }).then(() => { root.remove(d); });
  }
}

// ---- a soap dollop that arcs from the pump nozzle onto the hands ----
export function dollop(s, root, from, to) {
  const d = mesh(geo.sphere(0.09, 12, 10), 0xffd6ea, { outline: 0.012 });
  d.position.copy(from);
  root.add(d);
  return s.anim(0.32, (_, p) => {
    d.position.lerpVectors(from, to, p);
    d.position.y += Math.sin(p * Math.PI) * 0.45;
  }).then(() => { root.remove(d); });
}
