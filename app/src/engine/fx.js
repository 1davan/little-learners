// Reward effects: 3D confetti, hint halos, DOM sparkles and the "ghost hand" demo.
import * as T from '../three.js';
import { scene, onFrame, project, camera } from './stage.js';

const MAX = 420;
const confGeo = new T.PlaneGeometry(0.22, 0.14);
const confMat = new T.MeshBasicMaterial({ side: T.DoubleSide });
const im = new T.InstancedMesh(confGeo, confMat, MAX);
im.frustumCulled = false;
im.instanceMatrix.setUsage(T.DynamicDrawUsage);
const COLS = [0xff5a5a, 0x4a90ff, 0xffd23f, 0x5fd068, 0xff8fc0, 0xa77bff, 0xff9f3f].map((c) => new T.Color(c));
const parts = [];
const _m = new T.Matrix4(), _q = new T.Quaternion(), _e = new T.Euler(), _s = new T.Vector3(), zero = new T.Matrix4().makeScale(0, 0, 0);
for (let i = 0; i < MAX; i++) {
  parts.push({ alive: false, p: new T.Vector3(), v: new T.Vector3(), r: new T.Vector3(), w: new T.Vector3(), life: 0 });
  im.setMatrixAt(i, zero);
  im.setColorAt(i, COLS[i % COLS.length]);
}
scene.add(im);
let cursor = 0;

function spawn(p, v, life) {
  const q = parts[cursor];
  cursor = (cursor + 1) % MAX;
  q.alive = true; q.p.copy(p); q.v.copy(v); q.life = life;
  q.r.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
  q.w.set(Math.random() * 10 - 5, Math.random() * 10 - 5, Math.random() * 10 - 5);
}

onFrame((dt) => {
  for (let i = 0; i < MAX; i++) {
    const q = parts[i];
    if (!q.alive) continue;
    q.life -= dt;
    if (q.life <= 0) { q.alive = false; im.setMatrixAt(i, zero); continue; }
    q.v.y -= 7 * dt;
    q.v.multiplyScalar(1 - 1.6 * dt);
    if (q.v.y < -2.2) q.v.y = -2.2; // flutter
    q.v.x += Math.sin(q.life * 7 + i) * dt * 2;
    q.p.addScaledVector(q.v, dt);
    q.r.addScaledVector(q.w, dt);
    const sc = Math.min(1, q.life * 2);
    _q.setFromEuler(_e.set(q.r.x, q.r.y, q.r.z));
    _m.compose(q.p, _q, _s.set(sc, sc, sc));
    im.setMatrixAt(i, _m);
  }
  im.instanceMatrix.needsUpdate = true;
});

// The halo: a soft warm ring with a bright white core line, fading out on both sides (one shared texture).
// The plane is 2.8 units wide, so at scale r the ring's core sits at radius r.
const haloGeo = new T.PlaneGeometry(2.8, 2.8);
let _haloTex = null;
function haloTex() {
  if (_haloTex) return _haloTex;
  const S = 256, c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  const R = S / 2, core = R / 1.4; // radius 1.0 of 1.4
  const grad = g.createRadialGradient(R, R, core * 0.7, R, R, R);
  const at = (rr) => (rr * core - core * 0.7) / (R - core * 0.7);
  grad.addColorStop(0, 'rgba(255,208,60,0)');
  grad.addColorStop(at(0.84), 'rgba(255,208,60,0.7)');
  grad.addColorStop(at(0.96), 'rgba(255,250,215,1)');
  grad.addColorStop(at(1.04), 'rgba(255,250,215,1)');
  grad.addColorStop(at(1.16), 'rgba(255,200,50,0.65)');
  grad.addColorStop(1, 'rgba(255,200,50,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, S, S);
  _haloTex = new T.CanvasTexture(c);
  _haloTex.colorSpace = T.SRGBColorSpace;
  _haloTex.userData.shared = true;
  return _haloTex;
}

const hands = new Set();
function ripple(x, y) {
  const r = document.createElement('div');
  r.className = 'tap-ripple';
  r.style.left = x + 'px'; r.style.top = y + 'px';
  document.getElementById('fx').appendChild(r);
  setTimeout(() => r.remove(), 600);
}

export const fx = {
  // A floating symbol (♪, ♥, +1, a number…) that rises from a world position and fades.
  float(pos, text = '♪', { color = '#ff5a5a', size = 7 } = {}) {
    const c = project(pos);
    const el = document.createElement('div');
    el.className = 'float-note';
    el.textContent = text;
    el.style.left = c.x + 'px'; el.style.top = c.y + 'px';
    el.style.color = color; el.style.fontSize = size + 'vmin';
    el.style.setProperty('--dx', (Math.random() * 6 - 3).toFixed(1) + 'vmin');
    document.getElementById('fx').appendChild(el);
    setTimeout(() => el.remove(), 1100);
  },
  // A short, tidy pop of confetti from a world point: a compact fountain that settles within ~1.6 s.
  confetti(pos, n = 36) {
    const v = new T.Vector3();
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = 1.8 + Math.random() * 3;
      v.set(Math.cos(a) * sp, 3.5 + Math.random() * 4, Math.sin(a) * sp * 0.4 + 1);
      spawn(pos, v, 1.0 + Math.random() * 0.7);
    }
  },
  // The finale: a light shower over the whole scene.
  rain(n = 120) {
    const p = new T.Vector3(), v = new T.Vector3();
    for (let i = 0; i < n; i++) {
      p.set(Math.random() * 24 - 12, 9 + Math.random() * 6, Math.random() * 6 - 1);
      v.set(Math.random() - 0.5, -1 - Math.random(), 0);
      spawn(p, v, 3.5 + Math.random() * 2);
    }
  },

  // A soft glowing ring around an object's origin (drawn over everything), gently breathing. Returns a stop function.
  halo(obj, r = 1.2) {
    const m = new T.Mesh(haloGeo, new T.MeshBasicMaterial({ map: haloTex(), transparent: true, opacity: 0.9, depthWrite: false, depthTest: false }));
    m.renderOrder = 5;
    m.scale.setScalar(r);
    scene.add(m);
    const wp = new T.Vector3();
    const t0 = performance.now() / 1000;
    const off = onFrame((dt, t) => {
      obj.getWorldPosition(wp);
      m.position.copy(wp);
      m.quaternion.copy(camera.quaternion);
      const age = performance.now() / 1000 - t0;
      const k = 1 + Math.sin(t * 4.5) * 0.06;
      m.scale.setScalar(r * k * (age < 0.25 ? 0.7 + 1.2 * age : 1));
      m.material.opacity = Math.min(1, age * 4) * (0.78 + Math.sin(t * 4.5) * 0.2);
    });
    return () => { off(); scene.remove(m); m.material.dispose(); };
  },

  sparkle(x, y) {
    const el = document.createElement('div');
    el.className = 'sparkle';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    for (let i = 0; i < 6; i++) {
      const d = document.createElement('i');
      d.style.setProperty('--a', i * 60 + 'deg');
      el.appendChild(d);
    }
    document.getElementById('fx').appendChild(el);
    setTimeout(() => el.remove(), 600);
  },

  // A friendly hand that demonstrates a tap (to = null) or a drag from one world point to another.
  ghostHand(from3, to3 = null) {
    return fx.ghostPath(to3 ? [from3, to3] : [from3], { mode: to3 ? 'drag' : 'tap' });
  },

  /**
   * Ghost-hand demo along world points. Modes:
   *  tap  – presses twice on the first point
   *  drag – presses on the first point and glides through the rest (dotted trail)
   *  rub  – glides to the last point, then scrubs back and forth there
   *  scan – hops over each point, pressing once on each (shows "choose one" without revealing the answer)
   * Returns a stop function. The hand is DOM-only, so it never completes a task.
   */
  ghostPath(points3, { mode = 'tap', maxDur = 2.4 } = {}) {
    const pts = points3.map((p) => project(p));
    const F = [];
    const K = (p, press, dur, dx = 0, dy = 0) => F.push({ x: p.x + dx, y: p.y + dy, press, dur });
    const a = pts[0], last = pts[pts.length - 1];
    F.push({ x: a.x + 30, y: a.y + 60, press: 0, dur: 0 });
    K(a, 0, 0.35);
    if (mode === 'tap') { for (let i = 0; i < 2; i++) { K(a, 1, 0.22); K(a, 0, 0.3); } }
    else if (mode === 'drag' || mode === 'rub') {
      K(a, 1, 0.3);
      for (const p of pts.slice(1)) K(p, 1, Math.min(1.3, Math.max(0.6, Math.hypot(p.x - a.x, p.y - a.y) / 350)));
      if (mode === 'rub') for (let i = 0; i < 4; i++) { K(last, 1, 0.16, 45, -12); K(last, 1, 0.16, -45, 12); }
      K(last, 1, 0.25); K(last, 0, 0.3);
    } else if (mode === 'scan') {
      for (const p of pts) { K(p, 0, 0.45); K(p, 1, 0.18); K(p, 0, 0.2); }
    }
    K(last, 0, 0.35);
    // the whole demo always fits in maxDur seconds
    const want = F.reduce((s, f) => s + f.dur, 0);
    if (want > maxDur) for (const f of F) f.dur *= maxDur / want;
    const el = document.createElement('div');
    el.className = 'ghost-hand';
    el.textContent = '👆';
    const fxRoot = document.getElementById('fx');
    fxRoot.appendChild(el);
    const total = F.reduce((s, f) => s + f.dur, 0);
    const t0 = performance.now();
    let lastDot = 0, stopped = false;
    const stop = () => { stopped = true; el.remove(); hands.delete(stop); };
    hands.add(stop);
    const ease = (m) => (m < 0.5 ? 2 * m * m : 1 - (-2 * m + 2) ** 2 / 2);
    const step = (now) => {
      if (stopped) return;
      const t = (now - t0) / 1000;
      let acc = 0, i = 1;
      while (i < F.length && acc + F[i].dur < t) { acc += F[i].dur; i++; }
      if (i >= F.length) { stop(); return; }
      const A = F[i - 1], B = F[i];
      const m = B.dur ? ease(Math.min(1, (t - acc) / B.dur)) : 1;
      const x = A.x + (B.x - A.x) * m, y = A.y + (B.y - A.y) * m;
      const press = B.press && (A.press || m > 0.5);
      el.style.transform = `translate(${x}px, ${y}px) scale(${press ? 0.86 : 1})`;
      el.style.opacity = t < 0.2 ? t * 5 : t > total - 0.3 ? Math.max(0, (total - t) / 0.3) : 1;
      if (press && A.press && (mode === 'drag' || mode === 'rub') && now - lastDot > 55) {
        lastDot = now;
        const d = document.createElement('div');
        d.className = 'trail-dot';
        d.style.left = x + 'px'; d.style.top = y + 'px';
        fxRoot.appendChild(d);
        setTimeout(() => d.remove(), 1400);
      }
      if (press && !A.press && m > 0.5 && !el.dataset.pressed) { el.dataset.pressed = 1; ripple(x, y); }
      if (!press) delete el.dataset.pressed;
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    return stop;
  },
  clearHands() { for (const s of [...hands]) s(); },
};
