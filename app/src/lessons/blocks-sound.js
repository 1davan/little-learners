// Block builder sounds the engine doesn't have: a hollow wooden "tok" as a block lands (pitched up the scale as the
// build grows), a rolling rumble, a wooden crash for a toppling tower, a soft tick as a block pops into the model,
// and a little xylophone run over a finished build. Synthesized on a small WebAudio context of our own that follows
// the engine volume (the same approach as bricks-sound.js).
import { getVolume, sharedCtx, cueOut } from '../engine/audio.js';

let ctx = null, out = null;
function ac() {
  if (!ctx) {
    ctx = sharedCtx();
    const comp = ctx.createDynamicsCompressor();
    out = ctx.createGain();
    out.connect(cueOut());
  }
  if (ctx.state === 'suspended') ctx.resume();
  out.gain.value = 1;
  return ctx;
}
function env(g, now, vol, attack, dur) {
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(Math.max(vol, 0.0002), now + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
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
function noise({ dur = 0.1, vol = 0.2, type = 'bandpass', f = 1000, f1 = null, q = 1, t = 0, attack = 0.002 }) {
  const c = ac(), now = c.currentTime + t;
  if (!buf) { buf = c.createBuffer(1, c.sampleRate, c.sampleRate); const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const s = c.createBufferSource(); s.buffer = buf;
  const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, now); fl.Q.value = q;
  if (f1) fl.frequency.exponentialRampToValueAtTime(f1, now + dur);
  const g = c.createGain(); env(g, now, vol, attack, dur);
  s.connect(fl); fl.connect(g); g.connect(out);
  s.start(now, Math.random() * 0.5); s.stop(now + dur + 0.05);
}
const V = () => 2 ** ((Math.random() * 2 - 1) * 0.6 / 12);
const safe = (fn) => (...a) => { try { fn(...a); } catch (e) { /* audio unavailable */ } };
const PENTA = [0, 2, 4, 7, 9];
const step = (i) => 2 ** ((PENTA[i % 5] + 12 * Math.floor(i / 5)) / 12);

export const ksfx = {
  // a block lands in its slot: a hollow wooden tok, higher for each block of the build
  tok: safe((i = 0) => {
    const k = V(), f = 330 * step(Math.min(i, 9)) * k;
    tone({ type: 'sine', f0: f * 1.6, f1: f, dur: 0.12, vol: 0.32 });
    tone({ type: 'triangle', f0: f * 3.1, dur: 0.05, vol: 0.06 });
    noise({ dur: 0.03, vol: 0.18, type: 'bandpass', f: 1800 * k, q: 3 });
  }),
  // a soft knock (a block put back, a block tapped)
  knock: safe(() => { const k = V(); tone({ type: 'sine', f0: 520 * k, f1: 300 * k, dur: 0.07, vol: 0.2 }); noise({ dur: 0.025, vol: 0.12, type: 'bandpass', f: 2200 * k, q: 3 }); }),
  // a mini block popping into the model on the stand
  tick: safe((i = 0) => { tone({ type: 'triangle', f0: 880 * step(i), dur: 0.06, vol: 0.1 }); }),
  // the rolling rumble of a ball or a cylinder going down the ramp
  roll: safe((dur = 0.9) => {
    noise({ dur, vol: 0.12, type: 'lowpass', f: 380, f1: 220, q: 1, attack: 0.08 });
    for (let i = 0; i < 7; i++) noise({ dur: 0.03, vol: 0.06, type: 'bandpass', f: 900 + Math.random() * 500, q: 3, t: i * dur / 7 });
  }),
  // a tower toppling over: a cascade of wooden clonks
  crash: safe((n = 5) => {
    for (let i = 0; i < Math.min(9, n + 3); i++) {
      const f = 200 + Math.random() * 260;
      tone({ type: 'sine', f0: f * 1.5, f1: f, dur: 0.1, vol: 0.18, t: 0.04 + i * 0.07 + Math.random() * 0.03 });
      noise({ dur: 0.03, vol: 0.1, type: 'bandpass', f: 1500 + Math.random() * 900, q: 3, t: 0.04 + i * 0.07 });
    }
  }),
  // a xylophone run up a finished build
  run: safe((n = 3) => { for (let i = 0; i < n + 2; i++) tone({ type: 'triangle', f0: 523 * step(i), dur: 0.16, vol: 0.13, t: i * 0.07 }); }),
  // the rocket blasting off a little
  blast: safe(() => { noise({ dur: 0.7, vol: 0.22, type: 'lowpass', f: 300, f1: 1400, q: 1, attack: 0.05 }); tone({ f0: 180, f1: 520, dur: 0.6, vol: 0.12 }); }),
};
