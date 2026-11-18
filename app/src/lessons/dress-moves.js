// Dress Monkey: Monkey's moves. The lesson owns a pose object P (all 0 = rest) that it applies to the rig every
// frame; these animate P. Each reaction is about 0.8 s; each "wanting" gesture shows which body part is bare.
import * as T from '../three.js';
import { sfx } from '../engine/audio.js';
import { setFace } from '../engine/actors.js';
import { msfx } from './dress-sound.js';

export function newPose() {
  return { armL: 0, armR: 0, armLx: 0, armRx: 0, headX: 0, headY: 0, headZ: 0, y: 0, spin: 0, tilt: 0, lean: 0, sq: 1, legL: 0, legR: 0, dx: 0 };
}
const bump = (p) => Math.sin(Math.PI * Math.min(1, Math.max(0, p)));
const ramp = (p, a, b) => Math.min(1, Math.max(0, (p - a) / (b - a)));

// run fn(p) for dur seconds, then put every pose field back to rest
const SLOW = 1.45; // every move and gesture eases out over ~1.2-1.5 s: calm, never frantic
function act(L, dur, fn) {
  const P = L.P;
  return L.s.anim(dur * SLOW, (_, p) => fn(p, P)).then(() => Object.assign(P, newPose()));
}
function face(L, emo, back = 0.7) { const f = L.monkey.userData.face; if (!f) return; setFace(f, emo); L.s.wait(back).then(() => setFace(f, 'happy')); }
function drops(L, col, n = 8, dy = 0.2) {
  const pos = L.at(0, dy, 0.5);  // little splash drops round the boots (the wellies' stomp)
  for (let i = 0; i < n; i++) {
    const d = new T.Mesh(new T.SphereGeometry(0.1, 8, 6), new T.MeshToonMaterial({ color: col }));
    d.position.copy(pos); L.root.add(d);
    const a = Math.random() * Math.PI * 2, v = new T.Vector3(Math.cos(a) * 2.2, 3 + Math.random() * 2, Math.sin(a) * 0.8 + 0.5);
    L.s.anim(0.55, (_, p) => { const t = p * 0.55; d.position.set(pos.x + v.x * t, Math.max(0.05, pos.y + v.y * t - 8 * t * t), pos.z + v.z * t); d.scale.setScalar(1 - p * 0.6); })
      .then(() => { L.root.remove(d); d.geometry.dispose(); d.material.dispose(); });
  }
}
const hopP = (p, h = 0.8) => Math.abs(Math.sin(p * Math.PI)) * h;

export const MOVES = {
  party(L) { msfx.ooh(); face(L, 'joy', 0.8);
    return act(L, 0.8, (p, P) => { P.y = hopP(p, 1.1); P.armL = P.armR = 2.4 * bump(p * 1.2); P.sq = 1 + 0.12 * Math.sin(p * Math.PI * 3); }); },
  royal(L) { sfx.twinkle();
    return act(L, 0.85, (p, P) => { P.headX = -0.3 * bump(p); P.armL = P.armR = -0.25 * bump(p); P.y = 0.15 * bump(p); P.spin = Math.sin(p * Math.PI * 2) * 0.25; }); },
  cool(L) { sfx.twinkle();
    return act(L, 0.8, (p, P) => { P.headZ = 0.25 * bump(p); P.headY = Math.sin(p * Math.PI * 2) * 0.35; P.armR = 2.2 * bump(p); P.tilt = -0.1 * bump(p); }); },
  tip(L) { sfx.aww();
    return act(L, 0.85, (p, P) => { P.headZ = -0.12 * bump(p); P.armR = 2.5 * bump(p); P.armL = 0.6 * bump(p); P.tilt = 0.06 * Math.sin(p * Math.PI * 2); }); },
  cosy(L) { sfx.aww(); face(L, 'calm', 0.8);
    return act(L, 0.85, (p, P) => { P.armL = P.armR = -0.35 * bump(p); P.armLx = P.armRx = -0.9 * bump(p); P.tilt = Math.sin(p * Math.PI * 2) * 0.12; P.headZ = 0.2 * bump(p); }); },
  pirate(L) { sfx.grr();
    return act(L, 0.85, (p, P) => { P.tilt = Math.sin(p * Math.PI * 3) * 0.2; P.armR = 1.6 * bump(p); P.headZ = -Math.sin(p * Math.PI * 3) * 0.15; P.y = 0.1 * bump(p * 3 % 1); }); },
  twirl(L) { sfx.swoosh();
    return act(L, 0.85, (p, P) => { P.spin = Math.sin(p * Math.PI * 2) * 0.85 * bump(p * 0.5 + 0.25); P.armL = P.armR = 1.2 * bump(p); P.y = 0.2 * bump(p); }); },   // a swishy half-twirl each way: the face stays to the child
  hop(L) { msfx.ooh(); L.kick(0, 4, 0);
    return act(L, 0.8, (p, P) => { P.y = hopP((p * 2) % 1, 0.7); P.sq = (p * 2) % 1 < 0.15 ? 0.85 : 1.06; P.armL = P.armR = 0.8 * bump(p); }); },
  yum(L) { sfx.mmm(); face(L, 'calm', 0.8);
    return act(L, 0.85, (p, P) => { P.armL = P.armR = -0.3 * bump(p); P.armLx = P.armRx = -0.7 * bump(p) + Math.sin(p * Math.PI * 6) * 0.15; P.headX = -0.2 * bump(p); }); },
  flex(L) { msfx.ooh();
    return act(L, 0.8, (p, P) => { P.armL = P.armR = 1.7 * bump(p * 1.3); P.sq = 1 + 0.1 * bump(p); P.y = 0.2 * bump(p); }); },
  splash(L) { s2(L, () => { sfx.splash(); drops(L, 0x5ab4ff, 10); }, 0.4);
    return act(L, 0.85, (p, P) => { P.y = p < 0.45 ? hopP(p / 0.45, 1.0) : 0; P.sq = p > 0.45 && p < 0.6 ? 0.8 : 1; P.armL = P.armR = 1.5 * bump(p); }); },
  hero(L) { sfx.whoosh(); L.kick(0, 2, -6);
    return act(L, 0.9, (p, P) => { P.armR = 2.9 * ramp(p, 0, 0.25) * (1 - ramp(p, 0.85, 1)); P.armL = -0.4 * bump(p); P.y = 0.35 * bump(p); P.lean = -0.12 * bump(p); P.headX = -0.15 * bump(p); }); },
  yawn(L) { sfx.aww(); face(L, 'calm', 0.9);
    return act(L, 0.85, (p, P) => { P.armL = P.armR = 2.6 * bump(p); P.headX = -0.25 * bump(p); P.sq = 1 + 0.08 * bump(p); }); },
  stomp(L) { s2(L, () => { sfx.splash(); drops(L, 0x5ab4ff, 6, 0.1); }, 0.2); s2(L, () => drops(L, 0x5ab4ff, 6, 0.1), 0.6);
    return act(L, 0.85, (p, P) => { const q = (p * 2) % 1; const lf = p < 0.5; (lf ? P : P).legL = lf ? -0.6 * bump(q) : 0; P.legR = lf ? 0 : -0.6 * bump(q); P.tilt = (lf ? 1 : -1) * 0.1 * bump(q); P.y = 0.12 * bump(q); }); },
  run(L) { sfx.patter();
    return act(L, 0.85, (p, P) => { const w = Math.sin(p * Math.PI * 6); P.legL = 0.55 * w; P.legR = -0.55 * w; P.armLx = -0.6 * w; P.armRx = 0.6 * w; P.y = Math.abs(w) * 0.12; }); },
  wiggle(L) { msfx.chatter();
    return act(L, 0.8, (p, P) => { P.tilt = Math.sin(p * Math.PI * 4) * 0.16 * bump(p); P.armL = P.armR = 0.7 * bump(p); P.y = 0.1 * Math.abs(Math.sin(p * Math.PI * 4)); }); },
  ballet(L) { sfx.swoosh();
    return act(L, 0.9, (p, P) => { P.y = 0.3 * bump(p); P.spin = -Math.sin(p * Math.PI * 2) * 0.8 * bump(p * 0.5 + 0.25); P.armL = P.armR = 2.8 * bump(p); P.sq = 1 + 0.1 * bump(p); }); },   // on tiptoe, swaying round and back
  shades(L) { sfx.twinkle();
    return act(L, 0.85, (p, P) => { P.headZ = -0.3 * bump(p); P.headX = -0.15 * bump(p); P.armL = 0.5 * bump(p); P.tilt = 0.1 * bump(p); P.y = 0.12 * bump(p * 2 % 1); }); },
  love(L) { sfx.aww(); face(L, 'joy', 0.9);
    return act(L, 0.85, (p, P) => { P.armL = P.armR = -0.3 * bump(p); P.armLx = P.armRx = -0.8 * bump(p); P.headZ = Math.sin(p * Math.PI * 2) * 0.2; P.y = 0.15 * bump(p); }); },
  bow(L) { sfx.note(0); s2(L, () => sfx.note(4), 0.35);
    return act(L, 0.85, (p, P) => { P.lean = 0.45 * bump(p); P.armL = 0.5 * bump(p); P.armRx = -0.8 * bump(p); }); },
  hula(L) { sfx.note(4);
    return act(L, 0.9, (p, P) => { const w = Math.sin(p * Math.PI * 4); P.tilt = w * 0.14; P.dx = w * 0.15; P.armL = 1.3 + w * 0.4; P.armR = 1.3 - w * 0.4; Object.assign(P, { armL: P.armL * bump(p), armR: P.armR * bump(p) }); }); },
  clap(L) { s2(L, () => msfx.clap(), 0.3);
    return act(L, 0.85, (p, P) => { const c = Math.abs(Math.sin(p * Math.PI * 3)); P.armLx = P.armRx = -1.3 * bump(p); P.armL = P.armR = -0.35 * c; P.y = 0.12 * bump(p); }); },
};
function s2(L, fn, t = 0.35) { L.s.wait(t * SLOW).then(fn); }

// "I need something here!" — each slot has its own gesture (about 1 s)
export const WANT = {
  head(L) { msfx.hmm(); return act(L, 1.0, (p, P) => { P.armR = 2.7 * bump(p); P.headX = -0.15 * bump(p); P.headZ = 0.12 * Math.sin(p * Math.PI * 4); }); },
  body(L, cold) { (cold ? msfx.brr : msfx.hmm)(); return act(L, 1.0, (p, P) => { P.armL = P.armR = -0.35 * bump(p); P.armLx = P.armRx = -0.8 * bump(p); P.tilt = Math.sin(p * Math.PI * 10) * 0.05 * bump(p); }); },
  feet(L) { msfx.hmm(); return act(L, 1.0, (p, P) => { P.headX = 0.4 * bump(p); P.legL = -0.5 * bump(p * 2 % 1) * (p < 0.5); P.legR = -0.5 * bump(p * 2 % 1) * (p >= 0.5); }); },
  legs(L) { msfx.hmm(); return act(L, 1.0, (p, P) => { P.headX = 0.3 * bump(p); P.tilt = Math.sin(p * Math.PI * 4) * 0.12; }); },
  eyes(L) { msfx.hmm(); face(L, 'calm', 0.9); return act(L, 1.0, (p, P) => { P.armR = 2.3 * bump(p); P.armRx = -0.5 * bump(p); P.headX = -0.2 * bump(p); }); },
  neck(L, cold) { (cold ? msfx.brr : msfx.hmm)(); return act(L, 1.0, (p, P) => { P.headZ = 0.3 * bump(p); P.armL = 1.4 * bump(p); P.armLx = -0.6 * bump(p); P.tilt = Math.sin(p * Math.PI * 10) * 0.04 * bump(p); }); },
  hands(L, cold) { (cold ? msfx.brr : msfx.hmm)(); return act(L, 1.0, (p, P) => { P.armLx = P.armRx = -1.4 * bump(p); P.armL = P.armR = -0.3 * bump(p); P.headX = 0.25 * bump(p); }); },
};
