// Toddler-proof touch input: one finger at a time, palm rejection, generous screen-space hit areas,
// drag-and-drop with snapping, mash detection, and a sparkle on every touch.
//
// Grab feel (docs/SATISFACTION.md E2) - every game gets this for free:
//  - pick: a 0.12 s squash-and-lift (scale y 0.9 then 1.06, rise 0.15) and a quiet "pup" (addDrag opts.sound)
//  - carry: the object is drawn through a critically damped spring (~12 Hz) behind the finger, leans into the
//    move and stretches up to 8% along the direction of travel
//  - near a zone: within 1.2x the zone radius the object is pulled up to 30% toward the zone centre (opts.magnet)
//    and the zone's onNear(k, obj) is called every move with k = 0..1 closeness (0 once when leaving / dropping).
//    Put onNear on the zone ({ obj, radius, onNear }) or on zone.obj.userData.onNear.
//  - drop: one overshoot settle (0.25 s) and a landing squash scaled by the fall speed
//  - tap targets press in (scale 0.94) on down and spring back on release (addTap opts.press = false to opt out)
// Everything except the magnet is a presentation layer (applied just for the render, then undone), so game code
// still sees obj.position at the finger and obj.scale untouched, and can tween them freely.
import * as T from '../three.js';
import { project, screenRadius, screenToPlaneZ, onFrame, onBeforeRender, onAfterRender } from './stage.js';
import { fx } from './fx.js';
import { sfx, resumeAudio } from './audio.js';
import { cursor } from './cursor.js';

const canvas = document.getElementById('c');
let targets = [];
let lockUntil = 0;
let readyFn = () => true;
const notReady = () => !readyFn();
let active = null; // {id, target, moved, sx, sy, t0}
const anyFns = new Set();
const mashFns = new Set();
const swipeFns = new Set();
const missFns = new Set(); // taps that hit no target: lessons use these for poke-able characters
let gesture = null; // {id, sx, sy, t0, tap} for swipes and tap-on-release targets
const taps = [];
const wp = new T.Vector3();

function onStage(o) {
  while (o) { if (o.isScene) return true; if (!o.visible) return false; o = o.parent; }
  return false;
}
function minSide() { return Math.min(window.innerWidth, window.innerHeight); }

function hitTest(x, y, kinds) {
  let best = null, bestScore = Infinity;
  for (const t of targets) {
    if (!t.enabled || !t.obj.visible || (kinds && !kinds.includes(t.kind))) continue;
    if (!onStage(t.obj)) continue; // its object was removed from the scene: a stale target from an earlier round
    t.obj.getWorldPosition(wp);
    if (t.offset) wp.add(t.offset);
    const c = project(wp);
    const r = Math.max(screenRadius(wp, t.radius) * 1.25, minSide() * 0.09);
    const d = Math.hypot(c.x - x, c.y - y);
    const score = d / r;
    if (score < 1 && score < bestScore) { best = t; bestScore = score; }
  }
  return best;
}

function zoneAt(t, x, y, reach = 1, out = null) {
  let best = null, bestScore = Infinity;
  for (const z of t.zones ? t.zones() || [] : []) {
    if (!z || z.enabled === false) continue;
    const pos = z.pos || z.obj.getWorldPosition(new T.Vector3());
    const c = project(pos);
    const r = Math.max(screenRadius(pos, z.radius || 1.5), minSide() * 0.16);
    const d = Math.hypot(c.x - x, c.y - y);
    if (d / r < reach && d / r < bestScore) { best = z; bestScore = d / r; if (out) out.pos = pos; }
  }
  if (out) out.q = bestScore;
  return best;
}

// ---------- grab feel: a presentation layer per object ----------
// feel record: { obj, vp (drawn position), vv (its velocity), mode: 'carry'|'settle'|'press', t, lift, ... }
const feels = new Map();
function feelOf(obj, mode = 'carry') {
  let f = feels.get(obj);
  if (!f) {
    f = { obj, vp: obj.position.clone(), vv: new T.Vector3(), parent: obj.parent, lift: 0, pickT: -1, landT: -1, landAmt: 0, press: 0, pressV: 0, pressWant: 0, mode, t: 0 };
    feels.set(obj, f);
  }
  return f;
}
const W = 2 * Math.PI * 12; // carry spring, ~12 Hz, critically damped
const _d = new T.Vector3();
// exact critically damped / damped spring step (stable for any dt): x is offset from target, v its velocity
function springStep(x, v, w, zeta, dt) {
  if (zeta >= 1) {
    const e = Math.exp(-w * dt), k = v + w * x;
    return [(x + k * dt) * e, (v - w * k * dt) * e];
  }
  const wd = w * Math.sqrt(1 - zeta * zeta), e = Math.exp(-zeta * w * dt), c = Math.cos(wd * dt), s = Math.sin(wd * dt);
  const B = (v + zeta * w * x) / wd;
  const nx = e * (x * c + B * s);
  const nv = -zeta * w * nx + e * (-x * wd * s + B * wd * c);
  return [nx, nv];
}
onFrame((dt) => {
  if (dt <= 0) return;
  for (const f of feels.values()) {
    const o = f.obj;
    f.t += dt;
    if (!o.parent || o.parent !== f.parent || f.vp.distanceTo(o.position) > 2.5) { f.vp.copy(o.position); f.vv.set(0, 0, 0); f.parent = o.parent; }
    if (f.mode === 'carry' || f.mode === 'settle') {
      const w = f.mode === 'carry' ? W : 2 * Math.PI * 3.2, z = f.mode === 'carry' ? 1 : 0.42;
      for (const ax of ['x', 'y', 'z']) {
        const [nx, nv] = springStep(f.vp[ax] - o.position[ax], f.vv[ax], w, z, dt);
        f.vp[ax] = o.position[ax] + Math.max(-0.7, Math.min(0.7, nx)); f.vv[ax] = nv;
      }
      // the lift eases up while held, back down when dropped
      const want = f.mode === 'carry' ? 0.15 : 0;
      f.lift += (want - f.lift) * Math.min(1, dt * (f.mode === 'carry' ? 18 : 22));
    }
    // press spring (tap targets): 0 = rest, 1 = fully pressed (scale 0.94)
    const [px, pv] = springStep(f.press - f.pressWant, f.pressV, 2 * Math.PI * 7, 0.45, dt);
    f.press = f.pressWant + px; f.pressV = pv;
    if (f.mode === 'settle' && f.t > 0.45) { f.done = true; }
    if (f.mode === 'press' && f.pressWant === 0 && Math.abs(f.press) < 0.004 && Math.abs(f.pressV) < 0.05) f.done = true;
    if (f.done) feels.delete(o);
  }
});
const savedP = [];
onBeforeRender(() => {
  savedP.length = 0;
  for (const f of feels.values()) {
    const o = f.obj;
    if (!o.parent || !o.visible) continue;
    savedP.push(o, o.position.clone(), o.scale.clone());
    let sx = 1, sy = 1, sz = 1;
    if (f.mode !== 'press') {
      // drawn position: spring lag (fading out at the end of the settle) plus the lift
      const fade = f.mode === 'settle' ? Math.max(0, Math.min(1, (0.45 - f.t) / 0.15)) : 1;
      _d.copy(f.vp).sub(o.position).multiplyScalar(fade);
      o.position.add(_d);
      o.position.y += f.lift;
      // pick: squash then stretch (0.12 s)
      if (f.pickT >= 0) {
        const p = (performance.now() / 1000 - f.pickT) / 0.12;
        if (p < 1) sy *= p < 0.35 ? 1 - 0.1 * (p / 0.35) : p < 0.75 ? 0.9 + 0.16 * ((p - 0.35) / 0.4) : 1.06 - 0.06 * ((p - 0.75) / 0.25);
      }
      // carry: stretch up to 8% along the direction of travel
      const sp = Math.hypot(f.vv.x, f.vv.y);
      if (f.mode === 'carry' && sp > 0.3) {
        const a = Math.min(0.08, sp * 0.006), ux = f.vv.x / sp, uy = f.vv.y / sp;
        sx *= 1 + a * ux * ux - a * 0.5 * uy * uy;
        sy *= 1 + a * uy * uy - a * 0.5 * ux * ux;
      }
      // landing squash
      if (f.landT >= 0) {
        const p = (performance.now() / 1000 - f.landT) / 0.25;
        if (p < 1) sy *= 1 - f.landAmt * Math.sin(Math.min(1, p * 2) * Math.PI) * (p < 0.5 ? 1 : 0) + (p >= 0.5 ? f.landAmt * 0.35 * Math.sin((p - 0.5) * 2 * Math.PI) : 0);
      }
    }
    if (f.press) { sy *= 1 - 0.06 * f.press; sx *= 1 + 0.025 * f.press; sz *= 1 + 0.025 * f.press; }
    if (sy !== 1 && sx === 1) { const k = 1 / Math.sqrt(sy); sx = k; sz *= k; }
    o.scale.set(o.scale.x * sx, o.scale.y * sy, o.scale.z * sz);
  }
});
onAfterRender(() => {
  for (let i = 0; i < savedP.length; i += 3) { savedP[i].position.copy(savedP[i + 1]); savedP[i].scale.copy(savedP[i + 2]); }
  savedP.length = 0;
});
function pressDown(obj) { const f = feelOf(obj, 'press'); f.pressWant = 1; f.done = false; }
function pressUp(obj) { const f = feels.get(obj); if (f) f.pressWant = 0; }
function playPickSound(t) {
  const snd = t.sound;
  if (snd === false || snd === null) return;
  if (typeof snd === 'function') snd(t);
  else if (typeof snd === 'string' && sfx[snd]) sfx[snd]();
  else sfx.pup();
}
// Walk the object home (t.home) on a low arc at walking pace. Resolves when it arrives (or is grabbed again).
const homing = new Map();
function sendHome(t, { dur = 0.5, arc = 0.45 } = {}) {
  const o = t.obj, from = o.position.clone(), to = t.home.clone();
  const tok = {};
  homing.set(o, tok);
  return new Promise((res) => {
    let el = 0;
    const off = onFrame((dt) => {
      if (homing.get(o) !== tok) { off(); res(false); return; }
      el += dt;
      const p = Math.min(1, el / dur), e = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
      o.position.lerpVectors(from, to, e);
      o.position.y += Math.sin(p * Math.PI) * arc;
      if (p >= 1) { off(); homing.delete(o); o.position.copy(to); res(true); }
    });
  });
}

function onDown(e) {
  e.preventDefault();
  resumeAudio();
  if (active || gesture) return; // ignore extra fingers
  if ((e.width || 0) > 70 || (e.height || 0) > 70) return; // palm
  for (const fn of anyFns) fn(e);
  gesture = { id: e.pointerId, sx: e.clientX, sy: e.clientY, t0: performance.now(), tap: null };
  try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  const now = performance.now();
  // Every touch does something: while answers are locked (demo, success, mashing) taps still poke
  // characters and scenery and make a sound; only answer/drag targets wait.
  // Taps while the game isn't ready yet (narrator talking, demo playing) stay silent: no pokes, no sounds,
  // just the hand cursor's own press. A 'Go!' badge tells the child when it's their turn.
  const pokeOnly = () => { for (const fn of missFns) if (fn(e.clientX, e.clientY)) return; };
  if (now < lockUntil) { pokeOnly(); return; } // answers locked (success, demo, finale admire): pokes still work
  if (notReady()) return;
  // Mash detection: >5 taps in 1.5 s → answers rest a moment (pokes keep working)
  taps.push(now);
  while (taps.length && now - taps[0] > 1500) taps.shift();
  if (taps.length > 5) { taps.length = 0; lockUntil = now + 1200; for (const fn of mashFns) fn(); pokeOnly(); return; }

  const t = hitTest(e.clientX, e.clientY);
  if (!t) { for (const fn of missFns) if (fn(e.clientX, e.clientY)) return; return; } // empty space: silent
  if (t.kind === 'tap') {
    if (t.press !== false) { pressDown(t.obj); gesture.pressed = t.obj; }
    if (t.onRelease) gesture.tap = t; // fire on lift, so a swipe that starts on it doesn't trigger it
    else t.onTap(t);
    return;
  }
  gesture = null;
  // drag
  homing.delete(t.obj);
  active = { id: e.pointerId, target: t, moved: false, sx: e.clientX, sy: e.clientY, t0: now, lx: e.clientX, rz0: t.obj.rotation.z, lean: 0, near: null };
  try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  t.onPick && t.onPick(t);
  cursor.setGrab(true);
  t.obj.userData.dragging = true;
  if (t.feel !== false) {
    const f = feelOf(t.obj);
    f.mode = 'carry'; f.done = false; f.t = 0; f.pickT = performance.now() / 1000; f.landT = -1;
    f.vp.copy(t.obj.position); f.vv.set(0, 0, 0); f.parent = t.obj.parent;
  }
  playPickSound(t);
}
function setNear(a, z, k) {
  const call = (zone, kk) => { const fn = zone && (zone.onNear || zone.obj?.userData?.onNear); if (fn) { try { fn(kk, a.target.obj, zone); } catch (err) { console.error(err); } } };
  if (a.near && a.near !== z) call(a.near, 0);
  a.near = z;
  if (z) call(z, k);
}

function onMove(e) {
  if (!active && e.pointerType === 'mouse' && !gesture) cursor.setOver(!!hitTest(e.clientX, e.clientY));
  if (!active || e.pointerId !== active.id) return;
  e.preventDefault();
  const t = active.target;
  if (Math.hypot(e.clientX - active.sx, e.clientY - active.sy) > 10) active.moved = true;
  const p = screenToPlaneZ(e.clientX, e.clientY - minSide() * 0.06, t.obj.position.z);
  // lean the carried thing into the direction of travel (eased back to upright every frame)
  active.lean = Math.max(-0.45, Math.min(0.45, active.lean - (e.clientX - active.lx) * 0.006));
  active.lx = e.clientX;
  // magnet: within 1.2x a zone's radius, pull up to 30% toward its centre (and tell the zone it's near)
  const info = {};
  const near = zoneAt(t, e.clientX, e.clientY, 1.2, info);
  if (p) {
    const mag = t.magnet ?? 0.3;
    if (near && mag > 0 && info.pos) {
      const w = mag * Math.max(0, Math.min(1, (1.2 - info.q) / 0.5));
      p.x += (info.pos.x - p.x) * w;
      p.y += (info.pos.y - p.y) * w;
    }
    t.obj.position.x = p.x;
    t.obj.position.y = Math.max(t.minY ?? 0.3, p.y);
  }
  setNear(active, near, near ? Math.max(0, Math.min(1, 1 - info.q / 1.2)) : 0);
  if (t.onMove) t.onMove(t, zoneAt(t, e.clientX, e.clientY));
}

function onUp(e) {
  if (gesture && e.pointerId === gesture.id) {
    const g = gesture;
    gesture = null;
    const dx = e.clientX - g.sx, dy = e.clientY - g.sy;
    if (e.type !== 'pointercancel' && Math.abs(dx) > window.innerWidth * 0.1 && Math.abs(dx) > Math.abs(dy) * 1.3 && performance.now() - g.t0 < 1200) {
      for (const fn of swipeFns) fn(dx < 0 ? 'left' : 'right');
      return;
    }
    if (g.pressed) pressUp(g.pressed);
    if (g.tap && e.type !== 'pointercancel' && Math.hypot(dx, dy) < minSide() * 0.06) g.tap.onTap(g.tap);
    return;
  }
  if (!active || e.pointerId !== active.id) return;
  const a = active, { target: t, moved } = a;
  t.obj.rotation.z = a.rz0;
  setNear(a, null, 0);
  active = null;
  t.obj.userData.dragging = false;
  const f = feels.get(t.obj);
  if (f && f.mode === 'carry') {
    // settle: one overshoot, and a landing squash scaled by how fast it was moving down
    f.mode = 'settle'; f.t = 0; f.landT = performance.now() / 1000;
    f.landAmt = Math.max(0.05, Math.min(0.14, 0.05 + Math.max(0, -f.vv.y) * 0.01 + f.lift * 0.2));
  }
  const zone = e.type === 'pointercancel' || !moved ? null : zoneAt(t, e.clientX, e.clientY);
  // autoHome: a drop on nothing walks home on a low arc (0.5 s, no sound) before onDrop(null) is called
  if (!zone && t.autoHome) { sendHome(t).then((ok) => { if (ok) t.onDrop(null, { tapped: !moved, home: true }); }); return; }
  t.onDrop(zone, { tapped: e.type !== 'pointercancel' && !moved });
}

onFrame((dt) => {
  if (!active) return;
  active.lean *= Math.max(0, 1 - dt * 6);
  active.target.obj.rotation.z = active.rz0 + active.lean;
});

canvas.addEventListener('pointerdown', onDown);
canvas.addEventListener('pointermove', onMove);
canvas.addEventListener('pointerup', onUp);
canvas.addEventListener('pointercancel', onUp);

export const input = {
  // Tap target. radius is in world units around the object's centre (offset optional).
  // press (default true): the object presses in (scale 0.94) on down and springs back on release.
  addTap(obj, { radius = 1, onTap, offset = null, onRelease = false, press = true }) {
    const t = { kind: 'tap', obj, radius, onTap, offset, onRelease, press, enabled: true };
    targets.push(t);
    return t;
  },
  // Drag target. zones() returns [{obj|pos, radius, onNear?, ...}]. onDrop(zone|null, {tapped}) decides what happens.
  //  sound:    the pick-up sound: undefined = a quiet "pup", false = none, 'name' = sfx[name], or a function
  //  magnet:   0..1 pull toward a nearby zone's centre (default 0.3; 0 turns it off)
  //  feel:     false turns off the grab feel (lift, spring lag, stretch, settle) for this object
  //  autoHome: true = a drop on nothing first walks the object home (0.5 s arc, no sound), then onDrop(null, { home: true })
  addDrag(obj, { radius = 1, zones, onDrop, onPick, onMove, minY, offset = null, sound, magnet = 0.3, feel = true, autoHome = false }) {
    const t = { kind: 'drag', obj, radius, zones, onDrop, onPick, onMove, minY, offset, sound, magnet, feel, autoHome, enabled: true, home: obj.position.clone() };
    targets.push(t);
    return t;
  },
  // Walk a drag target's object back to t.home (or opts.to) on a low arc at walking pace. Resolves true on arrival.
  sendHome(t, opts = {}) { if (opts.to) t.home = opts.to.clone ? opts.to.clone() : opts.to; return sendHome(t, opts); },
  // Squash-press any object for a moment (the same press a tap target gets), e.g. when a game pokes it.
  press(obj, ms = 120) { pressDown(obj); setTimeout(() => pressUp(obj), ms); },
  remove(t) { targets = targets.filter((x) => x !== t); if (active && active.target === t) { t.obj.userData.dragging = false; active = null; } },
  clear() { targets = []; if (active) active.target.obj.userData.dragging = false; active = null; gesture = null; feels.clear(); homing.clear(); },
  lock(ms) { lockUntil = Math.max(lockUntil, performance.now() + ms); },
  // the lesson tells input whether it's the child's turn yet (false while the narrator/demo still runs)
  setReady(fn) { readyFn = fn || (() => true); },
  locked() { return performance.now() < lockUntil || notReady(); },
  unlock() { lockUntil = 0; },
  dragging() { return !!active; },
  onAny(fn) { anyFns.add(fn); return () => anyFns.delete(fn); },
  onMash(fn) { mashFns.add(fn); return () => mashFns.delete(fn); },
  onSwipe(fn) { swipeFns.add(fn); return () => swipeFns.delete(fn); },
  onMiss(fn) { missFns.add(fn); return () => missFns.delete(fn); },
};

// Block browser gestures that would break a toddler kiosk.
for (const ev of ['contextmenu', 'gesturestart', 'gesturechange', 'dragstart', 'selectstart']) {
  window.addEventListener(ev, (e) => e.preventDefault(), { passive: false });
}
window.addEventListener('wheel', (e) => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
window.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
