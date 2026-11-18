// Candy beats: the candies' voices. A soft marimba-glockenspiel blend (a round sine fundamental, a quick bright
// 4th partial like a wooden bar, a faint glassy ring and a tiny felt-mallet tick), through a little room reverb,
// plus a gentle backing band (warm pad chords, a round bass and a soft brush) for the "whole song" playback.
// Everything is scheduled on the audio clock, so phrases keep perfect time; the game asks now() to sync visuals.
// Runs on a small WebAudio context of its own (the engine's is private), following the engine volume.
import { getVolume, sharedCtx, cueOut } from '../engine/audio.js';

// one fixed pitch per candy colour, low to high: C D E F G A (C5 up)
export const PITCH = [523.25, 587.33, 659.25, 698.46, 783.99, 880.0];

let ctx = null, out = null, wet = null, dry = null;
function ac() {
  if (!ctx) {
    ctx = sharedCtx();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 3;
    out = ctx.createGain();
    out.connect(cueOut());
    dry = ctx.createGain(); dry.gain.value = 1; dry.connect(out);
    // a small, soft room: a decaying noise impulse, low-passed
    const len = Math.floor(ctx.sampleRate * 1.6), ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < len; i++) { lp = lp * 0.6 + (Math.random() * 2 - 1) * 0.4; d[i] = lp * (1 - i / len) ** 2.6; }
    }
    const conv = ctx.createConvolver(); conv.buffer = ir;
    wet = ctx.createGain(); wet.gain.value = 0.32;
    dry.connect(conv); conv.connect(wet); wet.connect(out);
  }
  if (ctx.state === 'suspended') ctx.resume();
  out.gain.value = 1;
  return ctx;
}
export function now() { try { return ac().currentTime; } catch (e) { return performance.now() / 1000; } }

function osc(type, f, at, vol, attack, dur, dest = dry) {
  const c = ctx, o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f, at);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(Math.max(vol, 0.0002), at + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g); g.connect(dest);
  o.start(at); o.stop(at + dur + 0.05);
}
let nbuf = null;
function tick(at, vol, f = 3200, dur = 0.03, q = 1.2, dest = dry) {
  const c = ctx;
  if (!nbuf) { nbuf = c.createBuffer(1, c.sampleRate * 0.5, c.sampleRate); const d = nbuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const s = c.createBufferSource(); s.buffer = nbuf;
  const fl = c.createBiquadFilter(); fl.type = 'bandpass'; fl.frequency.value = f; fl.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(vol, at + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  s.connect(fl); fl.connect(g); g.connect(dest);
  s.start(at, Math.random() * 0.3); s.stop(at + dur + 0.02);
}

// One candy note. i: candy index (0 = C ... 5 = A); at: seconds from now; long: ring out longer; soft: quieter.
export function note(i, { at = 0, long = false, soft = false, oct = 1 } = {}) {
  try {
    const c = ac(), t = c.currentTime + at + 0.005;
    const f = PITCH[Math.max(0, Math.min(PITCH.length - 1, i))] * oct;
    const v = soft ? 0.12 : 0.26, d = long ? 1.7 : 1.15;
    osc('sine', f, t, v, 0.004, d);                       // the round body
    osc('sine', f * 4, t, v * 0.16, 0.002, 0.22);         // the wooden-bar partial (marimba)
    osc('sine', f * 2.756, t, v * 0.07, 0.002, 0.55);     // a faint glassy ring (glockenspiel)
    osc('triangle', f * 2, t, v * 0.05, 0.003, 0.4);
    tick(t, v * 0.12, Math.min(6000, f * 5), 0.02);       // felt mallet
  } catch (e) { /* audio unavailable */ }
}

// A little rising sparkle run up the candies (the "phrase done" flourish): notes = candy indices.
export function flourish(notes, { at = 0, step = 0.085 } = {}) {
  notes.forEach((n, k) => note(n, { at: at + k * step, soft: true }));
  note(notes[notes.length - 1], { at: at + notes.length * step + 0.04, oct: 2, soft: true, long: true });
}

// A soft sugar "clink" for a sweet landing in the glass jar.
export function clink(at = 0) {
  try {
    const c = ac(), t = c.currentTime + at;
    osc('sine', 2093, t, 0.06, 0.002, 0.35);
    osc('sine', 2093 * 2.4, t, 0.025, 0.002, 0.2);
    tick(t, 0.03, 5000, 0.015);
  } catch (e) { /* */ }
}

// ---------- backing band for the whole-song playback ----------
// Each two beats get a chord (I, IV or V in C) chosen to fit the melody notes sounding in them.
const CHORDS = { I: [0, 4, 7], IV: [5, 9, 12], V: [7, 11, 14] };   // semitones above C
const DEG = [0, 2, 4, 5, 7, 9];                                       // candy index -> semitones above C
const C3 = 130.81;
function pickChord(notes, isLast) {
  if (isLast) return 'I';
  let best = 'I', bs = -1;
  for (const k of ['I', 'IV', 'V']) {
    const pcs = CHORDS[k].map((x) => x % 12);
    const s = notes.reduce((a, n) => a + (pcs.includes(DEG[n] % 12) ? 2 : 0), 0) + (k === 'I' ? 0.5 : 0);
    if (s > bs) { bs = s; best = k; }
  }
  return best;
}
// melody: [{ n, at, dur }] (seconds from now; dur in seconds); beat: seconds per beat.
const buses = new Set();
export function stopBacking() {
  for (const b of buses) { try { b.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.08); setTimeout(() => b.disconnect(), 600); } catch (e) { /* */ } }
  buses.clear();
}
export function backing(melody, beat, { at = 0 } = {}) {
  try {
    const c = ac(), t0 = c.currentTime + at + 0.005;
    const bus = c.createGain(); bus.connect(dry); buses.add(bus);
    setTimeout(() => buses.delete(bus), (at + melody.length * beat * 2 + 8) * 1000);
    const end = Math.max(...melody.map((m) => m.at + m.dur)) + 0.001;
    const bars = Math.max(1, Math.ceil(end / (beat * 2) - 0.02));
    const pad = c.createBiquadFilter(); pad.type = 'lowpass'; pad.frequency.value = 1400; pad.connect(bus);
    for (let b = 0; b < bars; b++) {
      const s = b * beat * 2, e = s + beat * 2;
      const inBar = melody.filter((m) => m.at < e - 0.01 && m.at + m.dur > s + 0.01).map((m) => m.n);
      const ch = CHORDS[pickChord(inBar, b === bars - 1)];
      const last = b === bars - 1, len = beat * 2 * (last ? 1.6 : 1.02);
      for (const st of ch) {
        const f = C3 * 2 ** (st / 12);
        osc('triangle', f, t0 + s, 0.05, 0.12, len, pad);
        osc('sine', f * 2, t0 + s, 0.025, 0.15, len * 0.9, pad);
      }
      const root = C3 / 2 * 2 ** (ch[0] / 12);
      osc('sine', root, t0 + s, 0.2, 0.01, beat * 0.95, bus);
      osc('sine', root * 2, t0 + s, 0.05, 0.01, beat * 0.7, bus);
      osc('sine', root * 1.5, t0 + s + beat, 0.11, 0.01, beat * 0.8, bus);
      for (let k = 0; k < 2; k++) tick(t0 + s + k * beat + beat * 0.5, 0.025, 7000, 0.06, 0.8, bus);   // a soft brush on the off-beats
    }
  } catch (e) { /* */ }
}
