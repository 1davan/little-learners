// Toddler-proof touch input: one finger at a time, palm rejection, generous screen-space hit areas,
// drag-and-drop with snapping, mash detection, and a sparkle on every touch.
import * as T from '../three.js';
import { project, screenRadius, screenToPlaneZ, onFrame } from './stage.js';
import { fx } from './fx.js';
import { sfx, resumeAudio } from './audio.js';
import { cursor } from './cursor.js';

const canvas = document.getElementById('c');
let targets = [];
let lockUntil = 0;
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

function zoneAt(t, x, y) {
  let best = null, bestScore = Infinity;
  for (const z of t.zones()) {
    if (z.enabled === false) continue;
    const pos = z.pos || z.obj.getWorldPosition(new T.Vector3());
    const c = project(pos);
    const r = Math.max(screenRadius(pos, z.radius || 1.5), minSide() * 0.16);
    const d = Math.hypot(c.x - x, c.y - y);
    if (d / r < 1 && d / r < bestScore) { best = z; bestScore = d / r; }
  }
  return best;
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
  const pokeOnly = () => { for (const fn of missFns) if (fn(e.clientX, e.clientY)) return; sfx.tap(); };
  if (now < lockUntil) { pokeOnly(); return; }
  // Mash detection: >5 taps in 1.5 s → answers rest a moment (pokes keep working)
  taps.push(now);
  while (taps.length && now - taps[0] > 1500) taps.shift();
  if (taps.length > 5) { taps.length = 0; lockUntil = now + 1200; for (const fn of mashFns) fn(); pokeOnly(); return; }

  const t = hitTest(e.clientX, e.clientY);
  if (!t) { for (const fn of missFns) if (fn(e.clientX, e.clientY)) return; sfx.tap(); return; }
  if (t.kind === 'tap') {
    if (t.onRelease) gesture.tap = t; // fire on lift, so a swipe that starts on it doesn't trigger it
    else t.onTap(t);
    return;
  }
  gesture = null;
  // drag
  active = { id: e.pointerId, target: t, moved: false, sx: e.clientX, sy: e.clientY, t0: now, lx: e.clientX, rz0: t.obj.rotation.z, lean: 0 };
  try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  t.onPick && t.onPick(t);
  cursor.setGrab(true);
  sfx.pick();
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
  if (p) {
    t.obj.position.x = p.x;
    t.obj.position.y = Math.max(t.minY ?? 0.3, p.y);
  }
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
    if (g.tap && e.type !== 'pointercancel' && Math.hypot(dx, dy) < minSide() * 0.06) g.tap.onTap(g.tap);
    return;
  }
  if (!active || e.pointerId !== active.id) return;
  const { target: t, moved } = active;
  t.obj.rotation.z = active.rz0;
  active = null;
  if (e.type === 'pointercancel' || !moved) {
    t.onDrop(null, { tapped: !moved });
    return;
  }
  t.onDrop(zoneAt(t, e.clientX, e.clientY), { tapped: false });
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
  addTap(obj, { radius = 1, onTap, offset = null, onRelease = false }) {
    const t = { kind: 'tap', obj, radius, onTap, offset, onRelease, enabled: true };
    targets.push(t);
    return t;
  },
  // Drag target. zones() returns [{obj|pos, radius, ...}]. onDrop(zone|null, {tapped}) decides what happens.
  addDrag(obj, { radius = 1, zones, onDrop, onPick, onMove, minY, offset = null }) {
    const t = { kind: 'drag', obj, radius, zones, onDrop, onPick, onMove, minY, offset, enabled: true, home: obj.position.clone() };
    targets.push(t);
    return t;
  },
  remove(t) { targets = targets.filter((x) => x !== t); if (active && active.target === t) active = null; },
  clear() { targets = []; active = null; gesture = null; },
  lock(ms) { lockUntil = Math.max(lockUntil, performance.now() + ms); },
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
