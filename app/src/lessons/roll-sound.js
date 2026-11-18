// Roll & push sounds the engine doesn't have, all soft and wooden (no boings, no chimes, no squeaks):
//   rollSound.roll(speed)   a very quiet low wooden rumble whose volume follows the speed (0 = silent); one shared bed
//   rollSound.slide(on)     a soft wood-on-wood slide bed while a box or ramp is being pushed (on / off, eased)
//   rollSound.click()       a button dome going down
//   rollSound.tok(k)        a tiny wooden tok (a ledge drop; k 0..1 = how hard)
//   rollSound.reform()      the table re-forming: five quiet toks, falling
// Synthesised on the engine's audio context (cueOut bus); every one-shot respects effectsHushed() (beats, finale).
import { sharedCtx, cueOut, effectsHushed } from '../engine/audio.js';

let ctx = null, out = null;
function ac() {
  if (!ctx) { ctx = sharedCtx(); out = ctx.createGain(); out.gain.value = 1; out.connect(cueOut()); }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
let nbuf = null;
function noiseBuf(c) {
  if (!nbuf) { nbuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate); const d = nbuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  return nbuf;
}
function env(g, now, vol, attack, dur) {
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(Math.max(vol, 0.0002), now + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
}
function tone({ type = 'sine', f0, f1 = null, dur = 0.1, vol = 0.1, t = 0, attack = 0.003 }) {
  const c = ac(), now = c.currentTime + t;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, now);
  if (f1) o.frequency.exponentialRampToValueAtTime(f1, now + dur);
  env(g, now, vol, attack, dur);
  o.connect(g); g.connect(out); o.start(now); o.stop(now + dur + 0.05);
}
function noise({ dur = 0.1, vol = 0.1, type = 'bandpass', f = 800, q = 1, t = 0, attack = 0.003 }) {
  const c = ac(), now = c.currentTime + t;
  const s = c.createBufferSource(); s.buffer = noiseBuf(c);
  const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
  const g = c.createGain(); env(g, now, vol, attack, dur);
  s.connect(fl); fl.connect(g); g.connect(out); s.start(now, Math.random()); s.stop(now + dur + 0.05);
}
const safe = (fn) => (...a) => { try { if (!effectsHushed()) fn(...a); } catch (e) { /* audio unavailable */ } };

// a looping filtered-noise bed with an eased gain (the roll and the slide)
function bed(freq, q) {
  let b = null;
  return (vol) => {
    try {
      const c = ac();
      if (!b) {
        const s = c.createBufferSource(); s.buffer = noiseBuf(c); s.loop = true;
        const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = freq; fl.Q.value = q;
        const g = c.createGain(); g.gain.value = 0.0001;
        s.connect(fl); fl.connect(g); g.connect(out); s.start();
        b = { s, g, fl, v: 0 };
      }
      const v = effectsHushed() ? 0 : Math.max(0, Math.min(0.2, vol));
      if (Math.abs(v - b.v) > 0.004) { b.g.gain.setTargetAtTime(Math.max(0.0001, v), c.currentTime, 0.08); b.v = v; }
      b.fl.frequency.setTargetAtTime(freq * (0.8 + v * 2), c.currentTime, 0.1);
    } catch (e) { /* */ }
  };
}
const rollBed = bed(170, 0.9), slideBed = bed(520, 0.6);

export const rollSound = {
  roll(speed) { rollBed(Math.min(0.18, Math.max(0, speed) * 0.075)); },
  slide(on) { slideBed(on ? 0.12 : 0); },
  stop() { rollBed(0); slideBed(0); },
  click: safe(() => { tone({ type: 'triangle', f0: 1400, f1: 900, dur: 0.035, vol: 0.06 }); noise({ dur: 0.03, vol: 0.05, type: 'bandpass', f: 2600, q: 2 }); }),
  tok: safe((k = 0.5) => { const p = 0.9 + Math.random() * 0.2; tone({ f0: 620 * p, f1: 300 * p, dur: 0.06, vol: 0.05 + 0.08 * k }); noise({ dur: 0.03, vol: 0.03, type: 'bandpass', f: 1300 * p, q: 2 }); }),
  reform: safe(() => { for (let i = 0; i < 5; i++) tone({ f0: 760 - i * 70, f1: 380 - i * 30, dur: 0.05, vol: 0.035, t: i * 0.12 }); }),
  // a soft crunchy nibble (one bite of a cookie)
  nibble: safe(() => { noise({ dur: 0.07, vol: 0.07, type: 'bandpass', f: 2400, q: 1.2 }); noise({ dur: 0.05, vol: 0.05, type: 'bandpass', f: 1500, q: 1.5, t: 0.08 }); }),
  // a jelly's soft squish (low, round, no boing)
  squish: safe(() => { tone({ type: 'sine', f0: 210, f1: 150, dur: 0.16, vol: 0.09, attack: 0.02 }); noise({ dur: 0.1, vol: 0.03, type: 'lowpass', f: 500 }); }),
  // a balloon popping softly: a breathy puff, never a bang
  puff: safe(() => { noise({ dur: 0.16, vol: 0.08, type: 'bandpass', f: 1200, q: 0.7, attack: 0.008 }); }),
  // something soft going into water (a crate or a stone)
  splash: safe((k = 1) => { noise({ dur: 0.28, vol: 0.07 * k, type: 'lowpass', f: 900, attack: 0.01 }); tone({ type: 'sine', f0: 320, f1: 520, dur: 0.08, vol: 0.04 * k, t: 0.02 }); }),
};
