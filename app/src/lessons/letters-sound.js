// Letter friends: the game's few sounds, synthesised on the shared audio context (through the engine's cue bus, so
// they follow the volume and respect a hush). Very few on purpose: a wooden latch click when the trunk opens, a wooden
// clonk as a thing lands on its seat (played together with sfx.step, as one event), one soft chuff when the train
// starts to roll, and a soft two-note toot when she pokes the engine in the finale. No boings.
import { sharedCtx, cueOut, effectsHushed } from '../engine/audio.js';

let ctx = null, out = null, nbuf = null;
function ac() {
  if (!ctx) {
    ctx = sharedCtx();
    out = ctx.createGain();
    out.gain.value = 0.9;
    out.connect(cueOut());
    nbuf = ctx.createBuffer(1, ctx.sampleRate * 1.0, ctx.sampleRate);
    const d = nbuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
function noise(at, { dur, vol, type = 'bandpass', f0 = 1000, f1 = null, q = 1, attack = 0.004 }) {
  const c = ctx, s = c.createBufferSource(); s.buffer = nbuf;
  const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f0, at); if (f1) fl.frequency.exponentialRampToValueAtTime(f1, at + dur); fl.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(vol, at + attack); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  s.connect(fl); fl.connect(g); g.connect(out);
  s.start(at, Math.random() * 0.4); s.stop(at + dur + 0.05);
}
function tone(at, { f, f1 = null, dur, vol, type = 'sine', attack = 0.005 }) {
  const c = ctx, o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f, at); if (f1) o.frequency.exponentialRampToValueAtTime(f1, at + dur);
  g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(vol, at + attack); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g); g.connect(out);
  o.start(at); o.stop(at + dur + 0.05);
}
const wob = () => 1 + (Math.random() - 0.5) * 0.06;
function play(fn) {
  if (effectsHushed()) return;
  try { const c = ac(); fn(c.currentTime + 0.005); } catch (e) { /* no audio */ }
}

export const ltSfx = {
  // the trunk's wooden latch: two tiny clicks, pitched low
  latch: () => play((t) => {
    noise(t, { dur: 0.035, vol: 0.12, f0: 1500 * wob(), q: 4 });
    tone(t, { f: 620 * wob(), f1: 380, dur: 0.04, vol: 0.05, type: 'triangle' });
    noise(t + 0.07, { dur: 0.03, vol: 0.08, f0: 1100 * wob(), q: 5 });
  }),
  // a wooden block set down on wood: a short hollow knock
  clonk: () => play((t) => {
    tone(t, { f: 230 * wob(), f1: 160, dur: 0.12, vol: 0.18, type: 'sine', attack: 0.002 });
    tone(t, { f: 690 * wob(), dur: 0.05, vol: 0.05, type: 'triangle', attack: 0.001 });
    noise(t, { dur: 0.05, vol: 0.06, type: 'lowpass', f0: 900 });
  }),
  // one soft steam puff as the train starts to roll
  chuff: () => play((t) => {
    noise(t, { dur: 0.42, vol: 0.13, type: 'bandpass', f0: 700, f1: 260, q: 0.8, attack: 0.05 });
    noise(t, { dur: 0.25, vol: 0.05, type: 'highpass', f0: 2500, attack: 0.03 });
  }),
  // the engine's toot (finale pokes only): two soft sine notes a fifth apart, in the world's key (C)
  toot: () => play((t) => {
    for (const [f, vol] of [[523.25, 0.11], [783.99, 0.08]]) {
      tone(t, { f, dur: 0.5, vol, attack: 0.04 });
      tone(t, { f: f * 2, dur: 0.35, vol: vol * 0.12, attack: 0.05 });
    }
  }),
};
