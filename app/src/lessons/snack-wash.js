// Snack chef: the hand-washing effects. The running water (a clear stream from the spout with a splash ring), the soap
// foam that grows on the friend's hands as they rub, bubbles that float up and pop, water droplets when hands shake.
// These are effects (like confetti), not objects: soft code shapes in the game's toon style.
import * as T from '../three.js';
import { mesh, geo, basic, toon } from '../engine/toon.js';

// ---- the water stream: spout → basin floor ----
function streamTex() {
  // (u runs along the stream: streaks of light water on blue)
  const c = document.createElement('canvas'); c.width = 64; c.height = 16;
  const g = c.getContext('2d');
  g.fillStyle = '#5fbcff'; g.fillRect(0, 0, 64, 16);
  g.fillStyle = '#d8f1ff';
  for (let x = 0; x < 64; x += 16) { g.fillRect(x, 3, 9, 3); g.fillRect(x + 7, 10, 6, 2); }
  const t = new T.CanvasTexture(c);
  t.colorSpace = T.SRGBColorSpace;
  t.wrapS = t.wrapT = T.RepeatWrapping;
  return t;
}
export function makeWater(from, floorY) {
  const g = new T.Group();
  const H = from.y - floorY;
  const tex = streamTex();
  // the stream: a ribbon of water from the nozzle to wherever it lands. It leaves the nozzle going down and curves
  // a little toward where it lands (the paws held just beside the tip), so it falls a good way, clearly visible.
  const mat = new T.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.95, depthWrite: false, fog: false });
  const coreMat = new T.MeshBasicMaterial({ color: 0xf2fbff, transparent: true, opacity: 0.85, depthWrite: false, fog: false });
  const stream = new T.Mesh(new T.BufferGeometry(), mat);
  const core = new T.Mesh(new T.BufferGeometry(), coreMat);
  stream.renderOrder = 3; core.renderOrder = 4;
  g.add(stream, core);
  // where it lands: a soft crown of splash and a few drops that jump out and fall back
  const splash = new T.Group();
  const crownMat = basic(0xbfe6ff, { transparent: true, opacity: 0.85, fog: false, depthWrite: false });
  const crown = new T.Mesh(geo.torus(0.1, 0.024, Math.PI * 2, 8, 20), crownMat);
  crown.rotation.x = Math.PI / 2;
  splash.add(crown);
  const dropGeo = geo.sphere(0.03, 8, 6), dropMat = basic(0xbfe8ff, { transparent: true, opacity: 0.9, fog: false, depthWrite: false });
  const drops = [];
  for (let i = 0; i < 8; i++) { const d = new T.Mesh(dropGeo, dropMat); d.userData.a = (i / 8) * Math.PI * 2 + Math.random() * 0.4; d.userData.ph = Math.random(); splash.add(d); drops.push(d); }
  g.add(splash);
  // water running off the paws: a thinner stream from under them down to the basin floor, and a ring where it lands
  const offGeo = new T.CylinderGeometry(0.04, 0.05, 1, 12, 1, true);
  offGeo.translate(0, -0.5, 0);
  const runoff = new T.Mesh(offGeo, new T.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.9, depthWrite: false, fog: false }));
  runoff.renderOrder = 3;
  const pool = new T.Mesh(geo.torus(0.12, 0.022, Math.PI * 2, 8, 20), crownMat);
  pool.rotation.x = Math.PI / 2;
  g.add(runoff, pool);
  g.position.copy(from);
  g.visible = false;
  let on = 0, want = 0, land = null;
  const cur = new T.Vector3(0, -H, 0), tgt = new T.Vector3(), last = new T.Vector3(9, 9, 9);
  const build = (end, k) => {
    // nozzle (0, 0, 0) -> end, leaving straight down, bending toward the end in its lower part
    const pts = [];
    for (let i = 0; i <= 12; i++) {
      const s = i / 12, bend = s * s;
      pts.push(new T.Vector3(end.x * bend, end.y * (0.25 * s + 0.75 * s * s) + end.y * 0, end.z * bend));
    }
    const curve = new T.CatmullRomCurve3(pts);
    stream.geometry.dispose(); core.geometry.dispose();
    stream.geometry = new T.TubeGeometry(curve, 20, 0.07 * k + 0.012, 12, false);
    core.geometry = new T.TubeGeometry(curve, 20, 0.026 * k + 0.006, 8, false);
    tex.repeat.set(curve.getLength() * 1.6, 1);
  };
  return {
    group: g,
    get on() { return want > 0; },
    set(v) { want = v ? 1 : 0; if (v) g.visible = true; },
    // a world point where the water meets something (the top of the paws), or null: it falls to the basin floor
    landAt(p) { land = p ? p.clone() : null; },
    // (old API: only a height) the stream stops at y, straight under the nozzle
    stopAt(y) { land = y == null ? null : new T.Vector3(from.x, y, from.z); },
    update(dt, t) {
      on += (want - on) * Math.min(1, dt * 5);
      if (on < 0.02 && !want) { g.visible = false; return; }
      tgt.copy(land ? land : new T.Vector3(from.x, floorY, from.z)).sub(from);
      tgt.y = Math.min(-0.06, tgt.y);
      cur.lerp(tgt, Math.min(1, dt * 12));
      // the water runs out from the nozzle as the tap opens, and thins as it closes
      const reach = cur.clone().multiplyScalar(Math.min(1, on * 1.4));
      if (reach.distanceTo(last) > 0.004 || Math.abs(on - (g.userData.k ?? 0)) > 0.05) { build(reach, Math.max(0.3, on)); last.copy(reach); g.userData.k = on; }
      tex.offset.x = -t * 2.4;
      // the run-off from under the paws to the basin floor
      const offOn = !!land && on > 0.5;
      runoff.visible = pool.visible = offOn;
      if (offOn) {
        const top = reach.clone().add(new T.Vector3(0.02, -0.17, 0.06)), drop = Math.max(0.05, top.y - (floorY - from.y) - 0.02);
        runoff.position.copy(top);
        runoff.scale.set(on, drop, on);
        pool.position.set(top.x, floorY - from.y + 0.02, top.z);
        const kk = 1 + Math.sin(t * 8) * 0.1; pool.scale.set(kk, kk, 1);
      }
      splash.position.copy(reach).add(new T.Vector3(0, 0.01, 0));
      splash.visible = on > 0.6;
      const k = (land ? 0.9 : 1.15) * (1 + Math.sin(t * 9) * 0.08);
      crown.scale.set(k, k, 0.85);
      crownMat.opacity = 0.85 * on;
      for (const d of drops) {
        const q = (t * 1.6 + d.userData.ph) % 1, r = 0.1 + q * 0.2;
        d.position.set(Math.cos(d.userData.a) * r, Math.sin(q * Math.PI) * 0.13, Math.sin(d.userData.a) * r);
        d.scale.setScalar(1 - q * 0.5);
      }
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
    const m = mesh(geo.sphere(r, 14, 10), i % 3 ? 0xffffff : 0xeef8ff, { outline: 0.008 });
    m.scale.y = 0.85;
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
        const k = Math.max(0.001, Math.min(1, (shown * 1.1 - u.order) / 0.22));
        const w = 1 + Math.sin(t * 7 + u.order * 9) * 0.07;
        m.scale.set(k * w, k / w, k);
        m.position.copy(u.p0).multiplyScalar(0.6 + 0.4 * shown);
      }
    },
  };
}

// ---- little floating soap bubbles that pop: clear, with a thin rim and a shine (a sprite, so never a grey ball) ----
let bubbleTex = null;
function bubbleMap() {
  if (bubbleTex) return bubbleTex;
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 18, 32, 32, 30);
  gr.addColorStop(0, 'rgba(255,255,255,0.05)'); gr.addColorStop(0.75, 'rgba(210,240,255,0.25)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(32, 32, 30, 0, Math.PI * 2); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.95)'; g.lineWidth = 3; g.beginPath(); g.arc(32, 32, 27, 0, Math.PI * 2); g.stroke();
  g.strokeStyle = 'rgba(150,215,255,0.8)'; g.lineWidth = 1.5; g.beginPath(); g.arc(32, 32, 24.5, 0.6, 2.4); g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.95)'; g.beginPath(); g.ellipse(22, 21, 6, 3.5, -0.7, 0, Math.PI * 2); g.fill();
  bubbleTex = new T.CanvasTexture(c);
  bubbleTex.colorSpace = T.SRGBColorSpace;
  return bubbleTex;
}
export function bubbles(s, root, at, n = 4) {
  for (let i = 0; i < n; i++) {
    const r = 0.1 + Math.random() * 0.06;
    const b = new T.Sprite(new T.SpriteMaterial({ map: bubbleMap(), transparent: true, depthWrite: false, fog: false }));
    const side = i % 2 ? 1 : -1;   // they drift up and out beside the paws (never up over the friend's face)
    const p0 = at.clone().add(new T.Vector3(side * (0.35 + Math.random() * 0.2), 0.1 + Math.random() * 0.1, 0.3 + Math.random() * 0.15));
    b.position.copy(p0);
    b.scale.setScalar(0.001);
    root.add(b);
    const dur = 1.0 + Math.random() * 0.5, sway = Math.random() * 6;
    s.anim(dur, (_, p) => {
      b.position.set(p0.x + side * p * 0.45 + Math.sin(p * 5 + sway) * 0.06, p0.y + p * 0.45, p0.z + p * 0.1);
      const pop = p > 0.85 ? 1 + (p - 0.85) * 3 : 1;
      b.scale.setScalar(r * 2 * Math.min(1, p * 6) * pop);
      b.material.opacity = p > 0.85 ? 1 - (p - 0.85) / 0.15 : 1;
    }).then(() => { root.remove(b); b.material.dispose(); });
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
export function dollop(s, root, from, to, dur = 0.6) {
  const d = mesh(geo.sphere(0.09, 12, 10), 0xffd6ea, { outline: 0.012 });
  d.position.copy(from);
  root.add(d);
  return s.anim(dur, (_, p) => {
    d.position.lerpVectors(from, to, p);
    d.position.y += Math.sin(p * Math.PI) * 0.45;
  }).then(() => { root.remove(d); });
}
