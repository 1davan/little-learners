// Tap reactions: poking a character (that isn't the answer) or a bit of scenery makes it react.
// Characters have ~15 different reactions, chosen at random without repeating the last few; they get bigger and
// sillier the more you tap (taps 1-5 small, 6-10 medium, 11-14 big), and on the 15th tap the character gets
// sleepy: it yawns and naps for a while (taps then only make it snore), then wakes with a stretch.
// The tap count drains away if the child leaves it alone for a few seconds.
import * as T from '../three.js';
import { sfx } from './audio.js';
import { fx } from './fx.js';
import { Ease } from './tween.js';
import { setFace } from './faces.js';

const LIMIT = 15;          // taps before the nap
const NAP = 4.5;           // seconds asleep (3 taps wake it early)
const DRAIN = 6;           // seconds of no taps before the count starts dropping

// the animal's own call, if it has one
const CALL = {
  pip: 'cheep', bear: 'mmm', bunny: 'boing2', cat: 'meow', frog: 'ribbit', elephant: 'trumpet', hedgehog: 'squeak',
  crab: 'tap', gull: 'gull', duck: 'quack', cow: 'moo', pig: 'oink', sheep: 'baa', hen: 'cluck', horse: 'neigh', chick: 'cheep',
  monkey: 'ooh',
};
const play = (n, ...a) => { const f = sfx[n]; if (f) { f(...a); return true; } return false; };
const snd = (...names) => { for (const n of names) if (play(n)) return; };

const _p = new T.Vector3();
function top(g, k = 1) { g.getWorldPosition(_p); const s = g.getWorldScale(new T.Vector3()).y; _p.y += (g.userData.height || 2.3) * s * k; return _p.clone(); }

// ---------- shared motion helpers (all restore what they touch) ----------
function base(g) { return g.userData.baseScale ?? g.scale.y; }
async function squash(s, g, dur, fn) {
  const b = base(g), y0 = g.position.y, rz = g.rotation.z, ry = g.rotation.y, rx = g.rotation.x;
  await s.anim(dur, (_, p) => {
    const r = fn(p) || {};
    const k = r.k ?? 1;
    g.scale.set(b / Math.sqrt(k) * (r.sx ?? 1), b * k, b / Math.sqrt(k) * (r.sx ?? 1));
    g.position.y = y0 + (r.y || 0);
    g.rotation.z = rz + (r.rz || 0);
    g.rotation.y = ry + (r.ry || 0);
    g.rotation.x = rx + (r.rx || 0);
  });
  g.scale.setScalar(b); g.position.y = y0; g.rotation.set(rx, ry, rz);
}
function armsTo(s, g, up, dur) {
  const arms = g.userData.arms || g.userData.wings || g.userData.claws;
  if (!arms) return Promise.resolve();
  const r0 = arms.map((a) => a.rotation.z);
  return s.anim(dur, (_, p) => {
    const e = Math.sin(p * Math.PI);
    arms[0].rotation.z = r0[0] + up * e; arms[1].rotation.z = r0[1] - up * e;
  }).then(() => { arms[0].rotation.z = r0[0]; arms[1].rotation.z = r0[1]; });
}
function headTo(s, g, { x = 0, y = 0, z = 0 }, dur, shape = (p) => Math.sin(p * Math.PI)) {
  const h = g.userData.head;
  if (!h || h === g) return Promise.resolve();
  const r0 = h.rotation.clone();
  return s.anim(dur, (_, p) => { const e = shape(p); h.rotation.set(r0.x + x * e, r0.y + y * e, r0.z + z * e); })
    .then(() => h.rotation.copy(r0));
}
function face(g, emo) { const f = g.userData.face; if (f) setFace(f, emo); }
function kick(g, x = 0, y = 3, z = 0) { g.userData.kick && g.userData.kick(new T.Vector3(x, y, z)); }
function eyesShut(g, amt) { for (const e of g.userData.face?.userData?.eyes || []) e.scale.y = amt; }

// ---------- the reactions ----------
// each: (s, g, big) => Promise ; big is 0..1 (grows with the tap count)
const R = {
  giggleHop: async (s, g, big) => {
    snd('giggle', 'boing'); kick(g, 0, -4); face(g, 'joy');
    await squash(s, g, 0.45 + big * 0.15, (p) => ({ y: Math.sin(p * Math.PI) * (0.5 + big * 0.7), k: p < 0.15 ? 1 - p * 1.2 : p > 0.85 ? 0.85 + (1 - p) : 1.08 }));
    fx.float(top(g), '♪', { color: '#ff7ab6', size: 6 });
    face(g, 'happy');
  },
  spin: async (s, g, big) => {
    snd('swoosh', 'whoosh'); kick(g, 4, 1);
    await squash(s, g, 0.6, (p) => ({ ry: Ease.inOut(p) * Math.PI * 2 * (big > 0.6 ? 2 : 1), k: 1 + Math.sin(p * Math.PI) * 0.12, y: Math.sin(p * Math.PI) * 0.25 }));
  },
  wobble: async (s, g, big) => {
    snd('wobble', 'boing2', 'boing'); kick(g, 3, 0);
    await squash(s, g, 0.6, (p) => ({ k: 1 + Math.sin(p * Math.PI * 5) * (0.12 + big * 0.08) * (1 - p), rz: Math.sin(p * Math.PI * 4) * 0.12 * (1 - p) }));
  },
  shy: async (s, g) => {
    snd('aww', 'twinkle'); face(g, 'calm');
    const cheeks = g.userData.face?.userData?.cheeks || [];
    for (const c of cheeks) { c.visible = true; c.scale.multiplyScalar(1.5); }
    fx.float(top(g), '♥', { color: '#ff5a8a', size: 7 });
    await Promise.all([headTo(s, g, { y: 0.6, z: 0.15 }, 0.9), squash(s, g, 0.9, (p) => ({ rz: Math.sin(p * Math.PI * 3) * 0.05 }))]);
    for (const c of cheeks) c.scale.multiplyScalar(1 / 1.5);
    face(g, 'happy');
  },
  surprise: async (s, g, big) => {
    snd('pop', 'boing'); face(g, 'scared'); kick(g, 0, -6);
    await squash(s, g, 0.35, (p) => ({ y: Math.sin(p * Math.PI) * (0.8 + big * 0.5), k: 1.2 - p * 0.2 }));
    face(g, 'joy'); snd('giggle', 'twinkle');
    await squash(s, g, 0.25, (p) => ({ k: 1 - Math.sin(p * Math.PI) * 0.15 }));
  },
  dance: async (s, g) => {
    snd('jingle', 'twinkle'); face(g, 'joy');
    fx.float(top(g), '♫', { color: '#a77bff', size: 7 });
    await Promise.all([armsTo(s, g, 1.1, 0.9), squash(s, g, 0.9, (p) => ({ rz: Math.sin(p * Math.PI * 4) * 0.14, y: Math.abs(Math.sin(p * Math.PI * 4)) * 0.18 }))]);
    face(g, 'happy');
  },
  wave: async (s, g) => {
    play(CALL[g.userData.kind]) || snd('hello', 'chirp');
    const arms = g.userData.arms || g.userData.wings || g.userData.claws;
    if (arms) {
      const a = arms[1], r0 = a.rotation.z;
      await s.anim(0.9, (_, p) => { a.rotation.z = r0 - Math.sin(Math.min(1, p * 3) * Math.PI / 2) * 1.6 * (p > 0.85 ? (1 - p) / 0.15 : 1) + Math.sin(p * Math.PI * 6) * 0.3; });
      a.rotation.z = r0;
    } else await headTo(s, g, { z: 0.25 }, 0.6, (p) => Math.sin(p * Math.PI * 3));
  },
  tickle: async (s, g, big) => {
    snd('giggle', 'squeak'); face(g, 'joy');
    await squash(s, g, 0.7, (p) => ({ sx: 1 + Math.sin(p * Math.PI * 14) * 0.05, k: 1 + Math.sin(p * Math.PI * 14) * 0.06 * (1 + big), rz: Math.sin(p * Math.PI * 10) * 0.05 }));
    fx.float(top(g), 'hee!', { color: '#ff9f3f', size: 5 });
    face(g, 'happy');
  },
  sneeze: async (s, g) => {
    await headTo(s, g, { x: -0.35 }, 0.35, (p) => Ease.out(p));
    snd('sneeze', 'pop'); kick(g, 0, 2, 5);
    fx.float(top(g, 0.75), '✨', { size: 6 });
    await Promise.all([headTo(s, g, { x: 0.3 }, 0.3), squash(s, g, 0.3, (p) => ({ k: 1 - Math.sin(p * Math.PI) * 0.2 }))]);
  },
  flop: async (s, g) => {
    snd('slideDown', 'boing'); kick(g, -5, 2);
    const side = Math.random() < 0.5 ? -1 : 1;
    await squash(s, g, 0.4, (p) => ({ rz: side * Ease.out(p) * 1.1 }));
    snd('thunk', 'land');
    await squash(s, g, 0.45, (p) => ({ rz: side * 1.1 * (1 - Ease.back(p)) }));
    snd('giggle', 'twinkle');
  },
  earWiggle: async (s, g) => {
    snd('boing2', 'boing');
    for (let i = 0; i < 3; i++) { kick(g, (i % 2 ? -1 : 1) * 7, 2); await s.wait(0.14); }
    await squash(s, g, 0.25, (p) => ({ k: 1 + Math.sin(p * Math.PI) * 0.08 }));
  },
  sing: async (s, g) => {
    play(CALL[g.userData.kind]) || snd('twinkle');
    const notes = ['♪', '♫', '♬'];
    for (let i = 0; i < 3; i++) s.wait(i * 0.22).then(() => fx.float(top(g), notes[i], { color: ['#ff5a5a', '#4a90ff', '#5fd068'][i], size: 6 }));
    await headTo(s, g, { z: 0.2 }, 0.9, (p) => Math.sin(p * Math.PI * 3));
  },
  starEyes: async (s, g) => {
    snd('twinkle', 'chime');
    fx.float(top(g), '⭐', { size: 7 }); s.wait(0.15).then(() => fx.float(top(g), '✨', { size: 6 }));
    const eyes = g.userData.face?.userData?.eyes || [];
    await s.anim(0.6, (_, p) => { const k = 1 + Math.sin(p * Math.PI) * 0.45; for (const e of eyes) e.scale.set(k, k, 1); });
    for (const e of eyes) e.scale.set(1, 1, 1);
  },
  trampoline: async (s, g, big) => {
    for (let i = 0; i < 3; i++) {
      snd('boing', 'bloop'); kick(g, 0, -4);
      await squash(s, g, 0.28, (p) => ({ y: Math.sin(p * Math.PI) * (0.35 + i * 0.15 + big * 0.2), k: p < 0.2 ? 0.85 : 1.08 }));
    }
  },
  peekaboo: async (s, g) => {
    face(g, 'calm');
    await Promise.all([armsTo(s, g, 1.9, 0.5), headTo(s, g, { x: 0.35 }, 0.5)]);
    eyesShut(g, 0.12);
    await s.wait(0.15);
    eyesShut(g, 1); face(g, 'scared');
    snd('pop', 'boing'); fx.float(top(g), 'boo!', { color: '#4a90ff', size: 6 });
    await squash(s, g, 0.3, (p) => ({ y: Math.sin(p * Math.PI) * 0.4, k: 1.15 }));
    face(g, 'happy');
  },
};
const SMALL = ['giggleHop', 'wobble', 'wave', 'sing', 'shy', 'earWiggle', 'starEyes'];
const MED = ['spin', 'tickle', 'dance', 'surprise', 'peekaboo', 'sneeze', 'giggleHop', 'trampoline'];
const BIG = ['flop', 'trampoline', 'spin', 'dance', 'surprise', 'sneeze'];

// ---------- the nap ----------
async function nap(s, g) {
  const u = g.userData;
  u.napping = true;
  snd('yawn', 'slideDown');
  face(g, 'calm');
  await Promise.all([armsTo(s, g, 1.4, 0.9), headTo(s, g, { x: -0.3 }, 0.9), squash(s, g, 0.9, (p) => ({ k: 1 + Math.sin(p * Math.PI) * 0.12 }))]);
  eyesShut(g, 0.1);
  u.napUntil = performance.now() + NAP * 1000;
  // gentle snoring bob while asleep
  const head = u.head;
  let zz = 0;
  while (performance.now() < u.napUntil && g.parent && !s.dead) {
    await squash(s, g, 1.2, (p) => ({ k: 1 + Math.sin(p * Math.PI * 2) * 0.03 }));
    if (++zz % 2) fx.float(top(g), 'z', { color: '#7b8cff', size: 5 });
    eyesShut(g, 0.1);
  }
  // wake up: stretch and a happy hop
  eyesShut(g, 1); face(g, 'happy');
  snd('twinkle', 'chime');
  await Promise.all([armsTo(s, g, 1.6, 0.7), squash(s, g, 0.7, (p) => ({ k: 1 + Math.sin(p * Math.PI) * 0.15 }))]);
  if (head && head !== g) head.rotation.x = 0;
  u.taps = 0;
  u.napping = false;
}

// ---------- public ----------
export function canPoke(g) { const u = g && g.userData; return !!(u && (u.creature || (u.kind && CALL[u.kind]))); }

export async function poke(s, g) {
  const u = g.userData;
  const now = performance.now() / 1000;
  // drain the counter if left alone for a while
  if (u.lastTap && now - u.lastTap > DRAIN) u.taps = Math.max(0, (u.taps || 0) - Math.floor((now - u.lastTap) / 1.5));
  u.lastTap = now;
  if (u.napping) {
    // asleep: a soft snore; three taps wake it up early with a stretch
    u.wakeTaps = (u.wakeTaps || 0) + 1;
    if (u.wakeTaps >= 3) { u.napUntil = 0; u.wakeTaps = 0; play('pop'); return; }
    if (!u.snoreBusy) {
      u.snoreBusy = true;
      play('snore') || play('bloop', 0);
      fx.float(top(g), 'z', { color: '#7b8cff', size: 4 });
      await squash(s, g, 0.3, (p) => ({ k: 1 - Math.sin(p * Math.PI) * 0.05 }));
      u.snoreBusy = false;
    }
    return;
  }
  if (u.poking) {
    // mid-reaction: still answer the tap instantly (sound, a jiggle of the floppy bits, a little sparkle)
    play(['pop', 'bloop', 'squeak', 'boop'][(Math.random() * 4) | 0]);
    kick(g, (Math.random() - 0.5) * 6, 3);
    if (Math.random() < 0.5) fx.float(top(g, 0.9), ['✨', '♪', '♥'][(Math.random() * 3) | 0], { color: '#ff7ab6', size: 4 });
    u.taps = (u.taps || 0) + 0.5; // fast tapping still tires it out eventually
    return;
  }
  u.poking = true;
  u.taps = (u.taps || 0) + 1;
  // whatever face the game gave this character (e.g. 'sad' in the Feelings game) comes back afterwards
  const prevEmo = u.face?.userData?.emotion;
  try {
    if (u.taps >= LIMIT) { u.wakeTaps = 0; await nap(s, g); return; }
    const pool = u.taps <= 5 ? SMALL : u.taps <= 10 ? MED : BIG;
    const recent = u.recent || (u.recent = []);
    const opts = pool.filter((k) => !recent.includes(k));
    const pick = opts[(Math.random() * opts.length) | 0] || pool[0];
    recent.push(pick); if (recent.length > 3) recent.shift();
    const big = Math.min(1, (u.taps - 1) / (LIMIT - 2));
    // the character's own voice on a good share of taps
    if (Math.random() < 0.45 && pick !== 'wave' && pick !== 'sing') s.wait(0.05).then(() => play(CALL[u.kind]));
    if (u.kind === 'hedgehog' && Math.random() < 0.5) await R.wobble(s, g, big);
    else await R[pick](s, g, big);
    if (u.taps === LIMIT - 3) fx.float(top(g), '🥱', { size: 6 });
  } catch (e) { console.warn('poke', e); }
  finally {
    if (u.face && prevEmo) setFace(u.face, prevEmo);
    u.poking = false;
  }
}

// ---------- scenery: trees, flowers, clouds, sun, barn, palm... ----------
// Any top-level piece of scenery under `root` that the tap ray hits gets a springy boing (and the occasional sparkle).
const ray = new T.Raycaster();
export function pokeScenery(s, root, camera, x, y) {
  if (!root) return false;
  const nx = (x / innerWidth) * 2 - 1, ny = -(y / innerHeight) * 2 + 1;
  ray.setFromCamera({ x: nx, y: ny }, camera);
  const hits = ray.intersectObjects(root.children, true);
  for (const h of hits) {
    if (h.object.userData.outline) continue;
    let o = h.object;
    while (o.parent && o.parent !== root) o = o.parent;
    if (o.parent !== root) continue;
    const r = new T.Box3().setFromObject(o).getSize(new T.Vector3()).length();
    if (r > 14 || o.userData.noPoke) continue; // ground, sea, hills
    boing(s, o);
    return true;
  }
  return false;
}
async function boing(s, o) {
  const u = o.userData;
  if (u.boinging) return;
  u.boinging = true;
  u.sTaps = (u.sTaps || 0) + 1;
  const sc = o.scale.clone(), rz = o.rotation.z, ry = o.rotation.y;
  const kind = u.cloud ? 'cloud' : u.flower ? 'flower' : 'thing';
  const tired = u.sTaps > LIMIT;
  if (!tired) snd(...(kind === 'cloud' ? ['puff', 'bloop'] : kind === 'flower' ? ['twinkle', 'boing2'] : ['boing', 'bloop']));
  const amp = tired ? 0.03 : 0.14;
  await s.anim(0.55, (_, p) => {
    const k = 1 + Math.sin(p * Math.PI * 4) * amp * (1 - p);
    o.scale.set(sc.x / Math.sqrt(k), sc.y * k, sc.z / Math.sqrt(k));
    if (kind === 'flower') o.rotation.y = ry + Ease.out(p) * Math.PI * 2;
    else o.rotation.z = rz + Math.sin(p * Math.PI * 3) * 0.06 * (1 - p);
  });
  o.scale.copy(sc); o.rotation.z = rz; o.rotation.y = ry;
  if (!tired && Math.random() < 0.3) fx.float(o.getWorldPosition(new T.Vector3()).add(new T.Vector3(0, 2, 0)), ['✨', '♪', '★'][(Math.random() * 3) | 0], { color: '#ffb020', size: 5 });
  if (u.sTaps > LIMIT) setTimeout(() => (u.sTaps = 0), NAP * 1000);
  u.boinging = false;
}
