// Characters built from primitives: Pip the chick and animal friends with expressive faces.
import * as T from '../three.js';
import { mesh, geo, ink, blobShadow, toon, basic } from './toon.js';
import { Ease } from './tween.js';
import { sfx } from './audio.js';

import { makePip } from '../models/pip.js';
import { makeBear } from '../models/bear.js';
import { makeBunny } from '../models/bunny.js';
import { makeCat } from '../models/cat.js';
import { makeFrog } from '../models/frog.js';
import { makeElephant } from '../models/elephant.js';
import { makeHedgehog } from '../models/hedgehog.js';
import { makeCow } from '../models/cow.js';
import { makePig } from '../models/pig.js';
import { makeSheep } from '../models/sheep.js';
import { makeHorse } from '../models/horse.js';
import { C, makeFace, setFace } from './faces.js';
import { orCreature } from './creature.js';
const makePipAny = orCreature('pip', makePip);
export { C, makeFace, setFace, makePipAny as makePip };
const MAKERS = Object.fromEntries(Object.entries({ bear: makeBear, bunny: makeBunny, cat: makeCat, frog: makeFrog, elephant: makeElephant, hedgehog: makeHedgehog, cow: makeCow, pig: makePig, sheep: makeSheep, horse: makeHorse }).map(([k, f]) => [k, orCreature(k, f)]));
export function makeAnimal(kind = 'bear') { return (MAKERS[kind] || makeBear)(); }

// ---------- reusable animations (all take a tween scope) ----------
// Hop with anticipation squash, stretch in the air and a squashy landing (volume-preserving).
export async function hop(s, g, h = 0.6, dur = 0.42, { sound = false } = {}) {
  if (g.userData.busyAnim) return;
  g.userData.busyAnim = true;
  const y0 = g.position.y;
  const base = g.userData.baseScale ?? g.scale.y;
  const pre = 0.08, land = 0.2, air = Math.max(0.12, dur - pre);
  const sq = (k) => g.scale.set(base / Math.sqrt(k), base * k, base / Math.sqrt(k));
  await s.anim(pre, (_, p) => sq(1 - 0.2 * Math.sin(p * Math.PI / 2)));
  await s.anim(air, (_, p) => {
    g.position.y = y0 + Math.sin(p * Math.PI) * h;
    sq(p < 0.5 ? 0.8 + p * 0.64 : 1.12 - (p - 0.5) * 0.24);
  });
  g.position.y = y0;
  if (sound) sfx.land();
  await s.anim(land, (_, p) => sq(1 - 0.18 * Math.sin(p * Math.PI) * (1 - p * 0.5) + Math.sin(p * Math.PI * 2) * 0.05 * p));
  g.scale.setScalar(base);
  g.userData.busyAnim = false;
}

export async function dance(s, g) {
  if (g.userData.busyAnim) return;
  g.userData.busyAnim = true;
  const base = g.userData.baseScale ?? 1;
  const y0 = g.position.y;
  const r0 = g.rotation.y;
  await s.anim(1.0, (_, p) => {
    g.rotation.y = r0 + Ease.inOut(p) * Math.PI * 2;
    g.position.y = y0 + Math.abs(Math.sin(p * Math.PI * 3)) * 0.5;
    const sq = 1 + Math.sin(p * Math.PI * 6) * 0.08;
    g.scale.set(base / Math.sqrt(sq), base * sq, base / Math.sqrt(sq));
  });
  g.rotation.y = r0; g.position.y = y0; g.scale.setScalar(base);
  g.userData.busyAnim = false;
}

export async function wiggle(s, g, amt = 0.25, dur = 0.5) {
  const r0 = g.rotation.z;
  await s.anim(dur, (_, p) => { g.rotation.z = r0 + Math.sin(p * Math.PI * 4) * amt * (1 - p); });
  g.rotation.z = r0;
}

export async function shake(s, g, amt = 0.15, dur = 0.45) {
  const x0 = g.position.x;
  await s.anim(dur, (_, p) => { g.position.x = x0 + Math.sin(p * Math.PI * 8) * amt * (1 - p); });
  g.position.x = x0;
}

// Springy appearance: grows past full size, squashes, settles. A soft bloop plays as it lands.
export async function popIn(s, g, scale = 1, dur = 0.45, { sound = true } = {}) {
  g.scale.setScalar(0.001);
  g.visible = true;
  if (sound) s.wait(dur * 0.35).then(() => sfx.bloop(Math.random() * 3));
  await s.anim(dur, (_, p) => {
    const e = Ease.elastic(p);
    const k = Math.max(0.001, e * scale);
    const st = 1 + (1 - p) * Math.sin(p * Math.PI * 3) * 0.12;
    g.scale.set(k / Math.sqrt(st), k * st, k / Math.sqrt(st));
  });
  g.scale.setScalar(scale);
}

export async function popOut(s, g, dur = 0.22) {
  const k0 = g.scale.x;
  await s.anim(dur, (_, p) => g.scale.setScalar(Math.max(0.001, k0 * (p < 0.3 ? 1 + p * 0.4 : 1.12 * (1 - Ease.in((p - 0.3) / 0.7))))));
  g.visible = false;
}

export function wave(s, pip) {
  const w = pip.userData.wings?.[1];
  if (!w) return Promise.resolve();
  const r0 = w.rotation.z;
  return s.anim(1.2, (_, p) => { w.rotation.z = r0 + 0.9 + Math.sin(p * Math.PI * 6) * 0.5 * (p < 0.9 ? 1 : 0); }).then(() => { w.rotation.z = r0; });
}

// Idle life for any character: breathing, head sway, blinking and the odd ear / wing twitch.
export function breathe(g, t, phase = 0) {
  const u = g.userData;
  if (u.still || (typeof u.kind === 'string' && u.kind.startsWith('prop_'))) return;
  const b = u.body;
  if (b) { const k = 1 + Math.sin(t * 2.2 + phase) * 0.025; b.scale.y = (b.userData.sy ?? (b.userData.sy = b.scale.y)) * k; }
  const h = u.head;
  if (h && !u.poking) h.rotation.z = Math.sin(t * 1.3 + phase) * 0.05;
  // blink
  const eyes = u.face?.userData?.eyes;
  if (eyes) {
    if (u.blinkAt === undefined) u.blinkAt = t + 1 + Math.random() * 3;
    if (t >= u.blinkAt && !u.blinking) { u.blinking = t; u.eyeY = eyes.map((e) => e.scale.y); }
    if (u.blinking) {
      const p = (t - u.blinking) / 0.13;
      if (p >= 1) { eyes.forEach((e, i) => (e.scale.y = u.eyeY[i])); u.blinking = 0; u.blinkAt = t + 2.2 + Math.random() * 3.5; }
      else eyes.forEach((e, i) => (e.scale.y = u.eyeY[i] * (0.12 + 0.88 * Math.abs(1 - 2 * p))));
    }
  }
  // wings flutter a little now and then (Pip, gull)
  if (u.wings && u.kind === 'pip' && !u.poking) {
    const f = Math.max(0, Math.sin(t * 0.9 + phase) - 0.92) * 6;
    const w = u.wings[0];
    if (w.userData.rz0 === undefined) w.userData.rz0 = w.rotation.z; // flutter around the wing's own rest angle
    w.rotation.z = w.userData.rz0 + f * Math.sin(t * 30) * 0.3;
  }
}

// ---------- poke reactions live in react.js (varied, escalating, naps after 15 taps) ----------
export { poke, canPoke } from './react.js';
