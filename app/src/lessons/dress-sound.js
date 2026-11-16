// Dress Monkey sounds the engine doesn't have: Monkey's "ooh-ooh-aah", a wardrobe creak, a fabric whoomp
// and a puff. Synthesized on a small WebAudio context of our own (the engine's is private), following the
// engine volume — the same approach as band-sound.js.
import { getVolume } from '../engine/audio.js';

let ctx = null, out = null;
function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    out = ctx.createGain();
    out.connect(comp); comp.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  out.gain.value = getVolume() * 0.8;
  return ctx;
}
function env(g, now, vol, attack, dur) {
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(Math.max(vol, 0.0002), now + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
}
// a vowel-ish voice: sawtooth through two formant bandpasses, pitch path [[t, f]...]
function voice(path, dur, { vol = 0.22, t = 0, f1 = 700, f2 = 1150, vib = 6 } = {}) {
  const c = ac(), now = c.currentTime + t;
  const o = c.createOscillator();
  o.type = 'sawtooth';
  path.forEach(([pt, pf], i) => (i === 0 ? o.frequency.setValueAtTime(pf, now) : o.frequency.exponentialRampToValueAtTime(pf, now + pt)));
  const l = c.createOscillator(), lg = c.createGain();
  l.frequency.value = vib; lg.gain.value = 12; l.connect(lg); lg.connect(o.frequency);
  const g = c.createGain(); env(g, now, vol, 0.03, dur);
  for (const [f, q, k] of [[f1, 5, 1], [f2, 6, 0.6]]) {
    const b = c.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = f; b.Q.value = q;
    const bg = c.createGain(); bg.gain.value = k;
    o.connect(b); b.connect(bg); bg.connect(g);
  }
  g.connect(out);
  o.start(now); o.stop(now + dur + 0.05); l.start(now); l.stop(now + dur + 0.05);
}
function tone({ type = 'sine', f0, f1 = null, dur = 0.2, vol = 0.2, t = 0, attack = 0.004 }) {
  const c = ac(), now = c.currentTime + t;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, now);
  if (f1) o.frequency.exponentialRampToValueAtTime(f1, now + dur);
  env(g, now, vol, attack, dur);
  o.connect(g); g.connect(out);
  o.start(now); o.stop(now + dur + 0.05);
}
let buf = null;
function noise({ dur = 0.1, vol = 0.2, type = 'bandpass', f = 1000, f1 = null, q = 1, t = 0, attack = 0.005 }) {
  const c = ac(), now = c.currentTime + t;
  if (!buf) { buf = c.createBuffer(1, c.sampleRate, c.sampleRate); const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const s = c.createBufferSource(); s.buffer = buf;
  const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, now); fl.Q.value = q;
  if (f1) fl.frequency.exponentialRampToValueAtTime(f1, now + dur);
  const g = c.createGain(); env(g, now, vol, attack, dur);
  s.connect(fl); fl.connect(g); g.connect(out);
  s.start(now, Math.random() * 0.5); s.stop(now + dur + 0.05);
}
const V = () => 2 ** ((Math.random() * 2 - 1) * 1.2 / 12);
const safe = (fn) => (...a) => { try { fn(...a); } catch (e) { /* audio unavailable */ } };

export const msfx = {
  // happy monkey: "ooh ooh AAH!"
  ooh: safe(() => {
    const k = V();
    voice([[0, 420 * k], [0.12, 560 * k]], 0.14, { f1: 450, f2: 800 });
    voice([[0, 450 * k], [0.12, 620 * k]], 0.14, { t: 0.17, f1: 450, f2: 800 });
    voice([[0, 640 * k], [0.08, 900 * k], [0.32, 700 * k]], 0.36, { t: 0.36, vol: 0.26, f1: 850, f2: 1300 });
  }),
  // a short curious "ooh?"
  hmm: safe(() => { const k = V(); voice([[0, 380 * k], [0.25, 520 * k]], 0.28, { f1: 430, f2: 780, vol: 0.18 }); }),
  // a giggly chatter
  chatter: safe(() => { const k = V(); for (let i = 0; i < 4; i++) voice([[0, (600 + (i % 2) * 140) * k], [0.06, (720 + (i % 2) * 140) * k]], 0.07, { t: i * 0.085, vol: 0.16, f1: 900, f2: 1500 }); }),
  // shivery "brrr"
  brr: safe(() => { const k = V(); voice([[0, 300 * k], [0.45, 260 * k]], 0.5, { vol: 0.14, f1: 500, f2: 900, vib: 28 }); }),
  // wardrobe door creak (a squeaky rising hinge) then a soft "bloom" of air
  creak: safe(() => {
    const k = V();
    for (let i = 0; i < 6; i++) tone({ type: 'square', f0: (520 + i * 40) * k, f1: (600 + i * 50) * k, dur: 0.035, vol: 0.03, t: i * 0.04 });
    noise({ dur: 0.3, vol: 0.08, f: 500, f1: 1400, q: 1.2, t: 0.1, attack: 0.08 });
  }),
  // soft fabric flop as a garment lands
  flop: safe(() => { noise({ dur: 0.12, vol: 0.14, type: 'lowpass', f: 900, f1: 300 }); tone({ f0: 200, f1: 120, dur: 0.08, vol: 0.08 }); }),
  // magic puff when clothes snap on
  puff: safe(() => {
    noise({ dur: 0.25, vol: 0.16, f: 2500, f1: 600, q: 0.8, attack: 0.01 });
    for (const [i, f] of [[0, 1047], [1, 1319], [2, 1568]]) tone({ type: 'triangle', f0: f, dur: 0.12, vol: 0.06, t: 0.05 + i * 0.05 });
  }),
  // a slide-whistle "wheee" for things that tumble off
  whee: safe(() => { tone({ type: 'sine', f0: 900, f1: 380, dur: 0.35, vol: 0.12 }); }),
  // mitten clap
  clap: safe(() => { for (const t of [0, 0.18]) noise({ dur: 0.07, vol: 0.25, type: 'bandpass', f: 1600, q: 0.9, t }); }),
};
