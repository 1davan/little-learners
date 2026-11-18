// Fill & balance sounds the engine doesn't have. The pour is a live loop: water is a soft rush with glugs whose
// pitch climbs as the pail fills (the sound of a bottle filling up), sand is a dry hiss with a patter of grains.
// Plus a "ding" for reaching the half and full marks, a wooden creak/clonk for the see-saw, a plop for a tipped-out
// castle and a balance chime. Synthesized on a small WebAudio context that follows the engine volume (the same
// approach as bricks-sound.js).
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
function noiseBuf(c) {
  if (!buf) { buf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate); const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  return buf;
}
function noise({ dur = 0.1, vol = 0.2, type = 'bandpass', f = 1000, f1 = null, q = 1, t = 0, attack = 0.002 }) {
  const c = ac(), now = c.currentTime + t;
  const s = c.createBufferSource(); s.buffer = noiseBuf(c);
  const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, now); fl.Q.value = q;
  if (f1) fl.frequency.exponentialRampToValueAtTime(f1, now + dur);
  const g = c.createGain(); env(g, now, vol, attack, dur);
  s.connect(fl); fl.connect(g); g.connect(out);
  s.start(now, Math.random() * 1.5); s.stop(now + dur + 0.05);
}
const safe = (fn) => (...a) => { try { return fn(...a); } catch (e) { /* audio unavailable */ } };

// ---- the pour loop ----
let loop = null;
export const pourSound = {
  start: safe((kind = 'water') => {
    if (loop && loop.kind === kind) return;
    pourSound.stop();
    const c = ac(), now = c.currentTime;
    const src = c.createBufferSource(); src.buffer = noiseBuf(c); src.loop = true;
    const f = c.createBiquadFilter();
    const g = c.createGain();
    if (kind === 'water') { f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 0.8; }
    else { f.type = 'highpass'; f.frequency.value = 2600; f.Q.value = 0.6; }
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(kind === 'water' ? 0.16 : 0.1, now + 0.08);
    src.connect(f); f.connect(g); g.connect(out);
    src.start(now, Math.random());
    loop = { kind, src, f, g, acc: 0 };
  }),
  // per frame while pouring: level (0..1) of the pail being filled
  update: safe((dt, level = 0) => {
    if (!loop) return;
    loop.acc += dt;
    const water = loop.kind === 'water';
    if (water) {
      loop.f.frequency.value = 700 + level * 900;
      // glugs: little bubbly blips climbing in pitch as it fills
      if (loop.acc > 0.085 + Math.random() * 0.05) {
        loop.acc = 0;
        const f = 260 + level * 620 + Math.random() * 60;
        tone({ type: 'sine', f0: f, f1: f * 1.6, dur: 0.06, vol: 0.06 });
      }
    } else if (loop.acc > 0.035) {
      loop.acc = 0;
      noise({ dur: 0.02, vol: 0.05 + Math.random() * 0.04, type: 'bandpass', f: 2500 + Math.random() * 3000, q: 3 });
    }
  }),
  stop: safe(() => {
    if (!loop) return;
    const c = ac(), now = c.currentTime, l = loop;
    loop = null;
    l.g.gain.cancelScheduledValues(now);
    l.g.gain.setValueAtTime(Math.max(0.0002, l.g.gain.value), now);
    l.g.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    l.src.stop(now + 0.15);
  }),
};

export const bal = {
  // the level reached a mark: a bright two-note ding (higher for full)
  ding: safe((full = false) => {
    const b = full ? 784 : 587;
    tone({ type: 'triangle', f0: b, dur: 0.18, vol: 0.16 });
    tone({ type: 'triangle', f0: b * 1.5, dur: 0.3, vol: 0.14, t: 0.09 });
    tone({ type: 'sine', f0: b * 3, dur: 0.25, vol: 0.04, t: 0.09 });
  }),
  // the see-saw end lands on the sand: a woody clonk with a soft thud
  clonk: safe((k = 1) => {
    tone({ type: 'sine', f0: 150, f1: 70, dur: 0.18, vol: 0.28 * k });
    noise({ dur: 0.06, vol: 0.14 * k, type: 'bandpass', f: 700, q: 2 });
    tone({ type: 'triangle', f0: 420, f1: 300, dur: 0.07, vol: 0.08 * k, t: 0.01 });
  }),
  // a little wooden creak as the plank swings
  creak: safe(() => { for (let i = 0; i < 3; i++) tone({ type: 'sawtooth', f0: 210 + i * 25, f1: 180 + i * 30, dur: 0.05, vol: 0.025, t: i * 0.05 }); }),
  // the pail turned out on the sand: a soft wet plop
  plop: safe(() => { tone({ type: 'sine', f0: 300, f1: 90, dur: 0.16, vol: 0.3 }); noise({ dur: 0.12, vol: 0.12, type: 'lowpass', f: 900 }); }),
  // water thrown out: a splash
  splash: safe(() => { noise({ dur: 0.45, vol: 0.28, f: 1400, f1: 400, q: 0.7, attack: 0.01 }); for (let i = 0; i < 4; i++) tone({ f0: 700 + Math.random() * 700, f1: 1500, dur: 0.05, vol: 0.05, t: 0.05 + i * 0.07 }); }),
  // the plank settles level: a gentle sparkly chime
  balance: safe(() => { [0, 4, 7, 12].forEach((n, i) => tone({ type: 'sine', f0: 659 * 2 ** (n / 12), dur: 0.35, vol: 0.09, t: i * 0.07 })); }),
  // scooping up sand / dipping the jug
  scoop: safe(() => { noise({ dur: 0.16, vol: 0.14, type: 'highpass', f: 2200, attack: 0.02 }); tone({ f0: 300, f1: 520, dur: 0.1, vol: 0.06 }); }),
  dip: safe(() => { tone({ f0: 380, f1: 900, dur: 0.12, vol: 0.12 }); noise({ dur: 0.2, vol: 0.08, f: 1200, q: 1 }); }),
  // a pop up for the light end flying up
  whee: safe(() => tone({ type: 'sine', f0: 400, f1: 1200, dur: 0.25, vol: 0.12 })),
};
