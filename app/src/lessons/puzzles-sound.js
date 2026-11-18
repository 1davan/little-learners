// Shape puzzles sounds the engine doesn't have, all soft wood and glass (docs/design/puzzles.md 7.2):
//   lidLift   a soft wooden knock (a lid lifts, a cup lifts, a piece sinks into its box)
//   boxOpen   a little hinge and a knock (a box lid opens)
//   ratchet   one soft wooden click (the string pull: one per 0.2 of travel)
//   latch     one clean click (the glass latches up, the padlock opens)
//   glassTink a quiet glass tink (touching a piece behind glass or a lock)
//   roll      a wooden ball rolling down the ramp (about 1.2 s)
// Synthesized on the engine's context (like cook-sound.js); silent while the engine hushes effects (a beat).
import { sharedCtx, cueOut, effectsHushed } from '../engine/audio.js';

let ctx = null, out = null;
function ac() {
  if (!ctx) { ctx = sharedCtx(); out = ctx.createGain(); out.gain.value = 0.9; out.connect(cueOut()); }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
function env(g, now, vol, attack, dur) {
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(Math.max(vol, 0.0002), now + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
}
function tone({ type = 'sine', f0, f1 = null, dur = 0.2, vol = 0.2, t = 0, attack = 0.003 }) {
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
  if (!buf) { buf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate); const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const s = c.createBufferSource(); s.buffer = buf;
  const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, now); fl.Q.value = q;
  if (f1) fl.frequency.exponentialRampToValueAtTime(f1, now + dur);
  const g = c.createGain(); env(g, now, vol, attack, dur);
  s.connect(fl); fl.connect(g); g.connect(out);
  s.start(now, Math.random() * 1.5); s.stop(now + dur + 0.05);
}
const semi = (s) => 2 ** (s / 12);
const wob = () => semi((Math.random() * 2 - 1) * 0.6);
const safe = (fn) => (...a) => { if (effectsHushed()) return; try { fn(...a); } catch (e) { /* audio unavailable */ } };

export const psfx = {
  lidLift: safe(() => { const k = wob(); tone({ f0: 520 * k, f1: 300 * k, dur: 0.09, vol: 0.11 }); noise({ dur: 0.05, vol: 0.05, type: 'bandpass', f: 1100 * k, q: 2 }); }),
  boxOpen: safe(() => {
    const k = wob();
    tone({ type: 'triangle', f0: 380 * k, f1: 520 * k, dur: 0.22, vol: 0.035, attack: 0.04 });
    tone({ f0: 470 * k, f1: 260 * k, dur: 0.1, vol: 0.12, t: 0.3 });
    noise({ dur: 0.05, vol: 0.05, type: 'bandpass', f: 1000 * k, q: 2, t: 0.3 });
  }),
  ratchet: safe((i = 0) => { const k = semi(i * 0.7) * wob(); tone({ f0: 1250 * k, f1: 900 * k, dur: 0.025, vol: 0.06 }); noise({ dur: 0.018, vol: 0.05, type: 'bandpass', f: 2600 * k, q: 3 }); }),
  latch: safe(() => { tone({ type: 'square', f0: 1700, dur: 0.018, vol: 0.05 }); tone({ f0: 900, f1: 600, dur: 0.06, vol: 0.12, t: 0.012 }); noise({ dur: 0.025, vol: 0.06, type: 'highpass', f: 3200 }); }),
  glassTink: safe(() => { const k = wob(); tone({ f0: 2350 * k, dur: 0.35, vol: 0.05 }); tone({ f0: 3520 * k, dur: 0.22, vol: 0.025 }); }),
  roll: safe((dur = 1.2) => {
    // a soft rumble that grows as the ball speeds up, with little wooden ticks
    noise({ dur, vol: 0.06, type: 'lowpass', f: 260, f1: 700, attack: dur * 0.6 });
    const n = Math.round(dur * 9);
    for (let i = 0; i < n; i++) { const t = dur * Math.sqrt(i / n); tone({ f0: 300 + i * 12, f1: 220, dur: 0.03, vol: 0.025 + 0.02 * (i / n), t }); }
  }),
};
