// Paint & mix: the game's own three soft material sounds (plus the lid's wooden tok), synthesised on the engine's
// shared WebAudio context through its cue bus (same approach as cook-sound.js). Every sound checks effectsHushed()
// first, so a beat() silences them. No stirring sound, no sound for a brush that moves without painting, no boings.
//   plip   brush or stamp into a pot; a dab into the dish        (a short sine drop 520 -> 300 Hz + a 30 ms tick), 0.3
//   swish  the start of a stroke (the lesson limits it to once per 0.8 s)   (band-passed noise 1.5-4 kHz, 180 ms), 0.15
//   pat    a splat; a stamp (pitched a fourth lower)             (low-passed noise < 900 Hz, 70 ms + a 140 Hz thump), 0.3
//   tok    a closed pot's lid wobbles / a lid goes on            (the engine's thunk at 40 % volume)
//   squish stirring the dish, very quiet, follows the finger's speed (stops at the beat: hushed)
import { sharedCtx, cueOut, effectsHushed } from '../engine/audio.js';

let ctx = null, out = null;
function ac() {
  if (!ctx) { ctx = sharedCtx(); out = ctx.createGain(); out.connect(cueOut()); }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
function env(g, now, vol, attack, dur) {
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(Math.max(vol, 0.0002), now + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
}
function tone({ type = 'sine', f0, f1 = null, dur = 0.1, vol = 0.2, t = 0, attack = 0.004 }) {
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
function noise({ dur = 0.1, vol = 0.2, type = 'bandpass', f = 1000, q = 1, t = 0, attack = 0.003 }) {
  const c = ac(), now = c.currentTime + t;
  if (!buf) { buf = c.createBuffer(1, c.sampleRate, c.sampleRate); const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const s = c.createBufferSource(); s.buffer = buf;
  const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
  const g = c.createGain(); env(g, now, vol, attack, dur);
  s.connect(fl); fl.connect(g); g.connect(out);
  s.start(now, Math.random() * 0.5); s.stop(now + dur + 0.05);
}
const vary = () => 1 + (Math.random() * 2 - 1) * 0.05;
const safe = (fn) => (...a) => { try { if (!effectsHushed()) fn(...a); } catch (e) { /* audio unavailable */ } };

export const psfx = {
  plip: safe(() => {
    const k = vary();
    tone({ f0: 520 * k, f1: 300 * k, dur: 0.09, vol: 0.3 * vary(), attack: 0.003 });
    noise({ dur: 0.03, vol: 0.05, type: 'highpass', f: 3500 });
  }),
  swish: safe(() => { noise({ dur: 0.18, vol: 0.15 * vary(), type: 'bandpass', f: 2600 * vary(), q: 0.8, attack: 0.06 }); }),
  pat: safe((low = false) => {
    const k = (low ? 0.75 : 1) * vary();
    noise({ dur: 0.07, vol: 0.3 * vary(), type: 'lowpass', f: 900 * k, attack: 0.003 });
    tone({ f0: 140 * k, f1: 90 * k, dur: 0.08, vol: 0.12, attack: 0.003 });
  }),
  // stirring the dish: a very quiet wet squish, louder when she rubs faster (k 0..1)
  squish: safe((k = 0.5) => { noise({ dur: 0.16, vol: 0.08 * Math.max(0.2, Math.min(1, k)), type: 'lowpass', f: 400 + 500 * Math.min(1, k), q: 0.7, attack: 0.03 }); }),
  tok: safe(() => { tone({ f0: 180, f1: 70, dur: 0.12, vol: 0.13 }); noise({ dur: 0.05, vol: 0.05, type: 'lowpass', f: 600 }); }),
};
