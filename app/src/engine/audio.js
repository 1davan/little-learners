// All sound effects are synthesized with WebAudio — no audio files needed.
let ctx = null, master = null, fxBus = null, volume = 0.6;

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    master = ctx.createGain();
    master.gain.value = volume * 0.8;
    master.connect(comp);
    comp.connect(ctx.destination);
    // every sound effect goes through fxBus (music, ambience and voice go straight to master), so the engine
    // can hush effects for a beat or the finale without touching the music
    fxBus = ctx.createGain();
    fxBus.connect(master);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
// Game sound modules (band, candy, cook, bricks...) play through the engine's context on this bus, so they follow
// the volume, are loud enough to copy, and never fight a separate mixer.
let cueOutNode = null;
export function sharedCtx() { return ac(); }
export function cueOut() {
  const c = ac();
  if (!cueOutNode) { cueOutNode = c.createGain(); cueOutNode.gain.value = 1.6; cueOutNode.connect(master); }
  return cueOutNode;
}
export function resumeAudio() { try { ac(); } catch (e) { /* no audio */ } }
export function setVolume(v) { volume = v; if (master) master.gain.value = v * 0.8; }
export function getVolume() { return volume; }

function env(g, now, vol, attack, dur) {
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(Math.max(vol, 0.0002), now + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
}

let rateMul = 1; // set per sound call: a little random detune so repeats don't grate
let volMul = 1;  // set per sound call: ±5% random volume, same reason
function duck() { try { return window.speechSynthesis && window.speechSynthesis.speaking ? 0.65 : 1; } catch (e) { return 1; } }
function tone({ type = 'sine', f0 = 440, f1 = null, dur = 0.2, vol = 0.3, t = 0, attack = 0.006, dest = null, glide = 'exp' }) {
  const c = ac();
  const k = rateMul; f0 *= k; if (f1) f1 *= k; vol *= duck() * volMul;
  const now = c.currentTime + t;
  const o = c.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f0, now);
  if (f1) {
    if (glide === 'exp') o.frequency.exponentialRampToValueAtTime(f1, now + dur);
    else o.frequency.linearRampToValueAtTime(f1, now + dur);
  }
  const g = c.createGain();
  env(g, now, vol, attack, dur);
  o.connect(g);
  g.connect(dest || fxBus);
  o.start(now);
  o.stop(now + dur + 0.05);
  return { o, g, now, c };
}

let noiseBuf = null;
function noise({ dur = 0.2, vol = 0.3, t = 0, type = 'bandpass', f0 = 1000, f1 = null, q = 1, attack = 0.01 }) {
  const c = ac();
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const now = c.currentTime + t;
  f0 *= rateMul; if (f1) f1 *= rateMul; vol *= duck() * volMul;
  const src = c.createBufferSource();
  src.buffer = noiseBuf;
  const f = c.createBiquadFilter();
  f.type = type; f.Q.value = q;
  f.frequency.setValueAtTime(f0, now);
  if (f1) f.frequency.exponentialRampToValueAtTime(f1, now + dur);
  const g = c.createGain();
  env(g, now, vol, attack, dur);
  src.connect(f); f.connect(g); g.connect(fxBus);
  src.start(now, Math.random() * 0.5);
  src.stop(now + dur + 0.05);
}

const SCALE = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5];

// Wrap a sound: never throws, rate-limits repeats (60 ms), and adds a little random pitch variation.
function safe(fn, vary = 1.2) {
  let last = 0;
  return (...a) => {
    const now = performance.now();
    if (now - last < 60) return;
    last = now;
    try { rateMul = 2 ** (((Math.random() * 2 - 1) * vary) / 12); volMul = vary ? 1 + (Math.random() * 2 - 1) * 0.05 : 1; fn(...a); } catch (e) { /* audio unavailable */ }
    rateMul = 1; volMul = 1;
  };
}
const exact = (fn) => safe(fn, 0);
// A little filtered sawtooth "voice" for animal calls: freq path [[t, f]...], filter freq, optional AM/vibrato.
function voice({ type = 'sawtooth', path, dur, vol = 0.25, filt = 'lowpass', ff = 900, q = 1, am = 0, amDepth = 0.5, vib = 0, vibDepth = 0, t = 0, attack = 0.04, ff1 = null }) {
  const c = ac(), now = c.currentTime + t;
  const o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain(), a = c.createGain();
  o.type = type;
  path.forEach(([pt, pf], i) => (i === 0 ? o.frequency.setValueAtTime(pf * rateMul, now) : o.frequency.exponentialRampToValueAtTime(pf * rateMul, now + pt)));
  f.type = filt; f.frequency.setValueAtTime(ff, now); f.Q.value = q;
  if (ff1) f.frequency.exponentialRampToValueAtTime(ff1, now + dur);
  env(g, now, vol * duck() * volMul, attack, dur);
  a.gain.value = 1;
  const extras = [];
  if (am) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = am; lg.gain.value = amDepth; a.gain.value = 1 - amDepth; l.connect(lg); lg.connect(a.gain); extras.push(l); }
  if (vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = vib; lg.gain.value = vibDepth; l.connect(lg); lg.connect(o.frequency); extras.push(l); }
  o.connect(f); f.connect(a); a.connect(g); g.connect(fxBus);
  o.start(now); o.stop(now + dur + 0.05);
  for (const l of extras) { l.start(now); l.stop(now + dur + 0.05); }
}

const CHIMES = [[0, 2, 4, 7], [2, 4, 5, 7], [0, 3, 5, 7], [4, 2, 5, 7]];
let chimeI = 0;

export const sfx = {
  // ---- touch & motion ----
  tap: safe(() => { tone({ f0: 1300, f1: 800, dur: 0.05, vol: 0.07 }); }, 3),
  pick: safe(() => { tone({ f0: 500, f1: 950, dur: 0.07, vol: 0.16 }); noise({ dur: 0.04, vol: 0.05, type: 'highpass', f0: 4000 }); }, 2),
  land: safe(() => { tone({ f0: 190, f1: 70, dur: 0.1, vol: 0.22 }); noise({ dur: 0.04, vol: 0.06, type: 'lowpass', f0: 700 }); }, 2),
  thunk: safe(() => { tone({ f0: 180, f1: 70, dur: 0.12, vol: 0.32 }); noise({ dur: 0.05, vol: 0.12, type: 'lowpass', f0: 600 }); }),
  bloop: safe((step = 0) => tone({ f0: 260 * 2 ** (step * 3 / 12), f1: 780 * 2 ** (step * 3 / 12), dur: 0.14, vol: 0.16 }), 2),
  patter: safe(() => { for (let i = 0; i < 5; i++) tone({ type: 'triangle', f0: 420 + (i % 2) * 90, f1: 300, dur: 0.05, vol: 0.08, t: i * 0.09 }); }),
  hello: safe(() => { tone({ type: 'triangle', f0: SCALE[0], dur: 0.12, vol: 0.14 }); tone({ type: 'triangle', f0: SCALE[4], dur: 0.25, vol: 0.14, t: 0.11 }); }),
  roundStart: safe(() => { tone({ type: 'triangle', f0: SCALE[0], dur: 0.1, vol: 0.12 }); tone({ type: 'triangle', f0: SCALE[3], dur: 0.16, vol: 0.12, t: 0.09 }); }, 0.5),
  swoosh: safe(() => noise({ dur: 0.22, vol: 0.1, f0: 800, f1: 2600, q: 1.5, attack: 0.06 })),
  boing2: safe(() => tone({ f0: 300, f1: 700, dur: 0.18, vol: 0.18 })),
  // ---- farm animals ----
  moo: safe(() => voice({ path: [[0, 150], [0.3, 185], [0.95, 118]], dur: 0.95, vol: 0.38, ff: 500, ff1: 420, attack: 0.12, vib: 5, vibDepth: 3 })),
  oink: safe(() => { for (const t of [0, 0.2]) voice({ type: 'square', path: [[0, 230], [0.14, 140]], dur: 0.15, vol: 0.2, filt: 'bandpass', ff: 900, q: 4, am: 35, t, attack: 0.01 }); }),
  baa: safe(() => voice({ path: [[0, 390], [0.65, 330]], dur: 0.7, vol: 0.28, filt: 'bandpass', ff: 1300, q: 2, am: 9, amDepth: 0.6, attack: 0.04 })),
  quack: safe(() => { for (const t of [0, 0.18]) voice({ path: [[0, 520], [0.12, 380]], dur: 0.13, vol: 0.26, filt: 'bandpass', ff: 1500, q: 5, t, attack: 0.008 }); }),
  cluck: safe(() => { [0, 0.11, 0.22].forEach((t) => tone({ type: 'triangle', f0: 700, f1: 1100, dur: 0.05, vol: 0.18, t })); tone({ type: 'triangle', f0: 900, f1: 1500, dur: 0.16, vol: 0.2, t: 0.36 }); }),
  neigh: safe(() => voice({ path: [[0, 900], [0.25, 1400], [0.85, 500]], dur: 0.85, vol: 0.2, filt: 'bandpass', ff: 1800, q: 1.5, vib: 12, vibDepth: 80, attack: 0.03 })),
  cheep: safe(() => { tone({ f0: 2400, f1: 3400, dur: 0.07, vol: 0.12 }); tone({ f0: 2500, f1: 3500, dur: 0.07, vol: 0.12, t: 0.11 }); }, 2),
  ribbit: safe(() => { for (const t of [0, 0.16]) voice({ type: 'square', path: [[0, 180], [0.1, 240]], dur: 0.11, vol: 0.18, filt: 'lowpass', ff: 1200, am: 60, t, attack: 0.01 }); }),
  meow: safe(() => voice({ path: [[0, 500], [0.2, 800], [0.6, 450]], dur: 0.6, vol: 0.18, filt: 'bandpass', ff: 1400, q: 2, attack: 0.05 })),
  buzz: safe(() => voice({ path: [[0, 190], [0.6, 210]], dur: 0.6, vol: 0.12, ff: 800, am: 30, attack: 0.05 })),
  trumpetHi: safe(() => voice({ path: [[0, 300], [0.12, 700], [0.5, 520]], dur: 0.5, vol: 0.25, filt: 'bandpass', ff: 1500, q: 1.2 })),
  // ---- instruments & things ----
  drumLoud: safe(() => { tone({ f0: 140, f1: 55, dur: 0.3, vol: 0.55, attack: 0.002 }); noise({ dur: 0.05, vol: 0.2, type: 'lowpass', f0: 900 }); }, 0.6),
  drumSoft: safe(() => { tone({ f0: 330, f1: 220, dur: 0.12, vol: 0.16, attack: 0.002 }); noise({ dur: 0.03, vol: 0.06, f0: 2500 }); }, 0.6),
  pour: safe(() => { noise({ dur: 0.65, vol: 0.18, f0: 2000, f1: 2600, q: 1.5, attack: 0.08 }); for (let i = 0; i < 5; i++) tone({ f0: 600 + Math.random() * 600, f1: 1300, dur: 0.06, vol: 0.06, t: 0.08 + i * 0.11 }); }),
  crunch: safe(() => { [0, 0.07, 0.14].forEach((t) => noise({ dur: 0.04, vol: 0.2, type: 'highpass', f0: 3000, t })); tone({ type: 'square', f0: 120, dur: 0.03, vol: 0.06 }); }, 2),
  twinkle: safe(() => { [5, 7, 6, 7, 4].forEach((n, k) => tone({ f0: SCALE[n] * 2, dur: 0.18, vol: 0.05, t: k * 0.06 })); }),
  tick: safe(() => tone({ f0: 1400, f1: 900, dur: 0.05, vol: 0.06 })),
  pop: safe(() => tone({ f0: 620, f1: 150, dur: 0.09, vol: 0.35 })),
  note: exact((i = 0) => {
    const f = SCALE[((i % SCALE.length) + SCALE.length) % SCALE.length];
    tone({ f0: f, dur: 0.6, vol: 0.32, attack: 0.004 });
    tone({ f0: f * 4, dur: 0.18, vol: 0.05, attack: 0.002 });
  }),
  chime: exact(() => {
    const v = CHIMES[chimeI++ % CHIMES.length];
    v.forEach((n, k) => { tone({ f0: SCALE[n], dur: 0.5, vol: 0.2, t: k * 0.07 }); tone({ type: 'triangle', f0: SCALE[n] * 2, dur: 0.2, vol: 0.04, t: k * 0.07 }); });
  }),
  boop: safe(() => { tone({ f0: 392, dur: 0.16, vol: 0.12 }); tone({ f0: 330, dur: 0.22, vol: 0.12, t: 0.13 }); }),
  boing: safe(() => {
    const c = ac(), now = c.currentTime;
    const o = c.createOscillator(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
    o.frequency.setValueAtTime(180, now);
    o.frequency.exponentialRampToValueAtTime(420, now + 0.08);
    o.frequency.exponentialRampToValueAtTime(200, now + 0.4);
    lfo.frequency.value = 14; lg.gain.value = 25;
    lfo.connect(lg); lg.connect(o.frequency);
    env(g, now, 0.3, 0.01, 0.42);
    o.connect(g); g.connect(fxBus);
    o.start(now); lfo.start(now); o.stop(now + 0.5); lfo.stop(now + 0.5);
  }),
  whoosh: safe(() => noise({ dur: 0.45, vol: 0.25, f0: 400, f1: 3000, q: 2, attack: 0.15 })),
  chomp: safe(() => {
    for (const t of [0, 0.22]) {
      noise({ dur: 0.08, vol: 0.4, t, type: 'lowpass', f0: 1800 });
      tone({ type: 'square', f0: 90, f1: 60, dur: 0.08, vol: 0.12, t });
    }
  }),
  fanfare: safe(() => {
    const seq = [[0, 0], [2, 0.12], [3, 0.24], [5, 0.36], [3, 0.52], [5, 0.62]];
    seq.forEach(([n, t]) => {
      tone({ type: 'triangle', f0: SCALE[n], dur: n === 5 && t > 0.5 ? 0.8 : 0.25, vol: 0.25, t });
      tone({ type: 'sine', f0: SCALE[n] / 2, dur: 0.3, vol: 0.12, t });
    });
  }),
  giggle: safe(() => { [500, 700, 560, 820, 640].forEach((f, k) => tone({ f0: f, f1: f * 1.3, dur: 0.09, vol: 0.18, t: k * 0.1 })); }),
  aww: safe(() => tone({ type: 'triangle', f0: 440, f1: 290, dur: 0.7, vol: 0.25, attack: 0.05 })),
  grr: safe(() => {
    const c = ac(), now = c.currentTime;
    const o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain(), am = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
    o.type = 'sawtooth'; o.frequency.value = 95;
    f.type = 'lowpass'; f.frequency.value = 650;
    lfo.frequency.value = 25; lg.gain.value = 0.5; am.gain.value = 0.5;
    lfo.connect(lg); lg.connect(am.gain);
    env(g, now, 0.3, 0.05, 0.6);
    o.connect(f); f.connect(am); am.connect(g); g.connect(fxBus);
    o.start(now); lfo.start(now); o.stop(now + 0.7); lfo.stop(now + 0.7);
  }),
  gasp: safe(() => { noise({ dur: 0.3, vol: 0.2, type: 'highpass', f0: 2000, attack: 0.1 }); tone({ f0: 600, f1: 1000, dur: 0.3, vol: 0.15 }); }),
  trumpet: safe(() => {
    const c = ac(), now = c.currentTime;
    const o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(160, now);
    o.frequency.exponentialRampToValueAtTime(420, now + 0.15);
    o.frequency.exponentialRampToValueAtTime(260, now + 0.6);
    f.type = 'bandpass'; f.frequency.value = 1100; f.Q.value = 1.2;
    env(g, now, 0.35, 0.04, 0.7);
    o.connect(f); f.connect(g); g.connect(fxBus);
    o.start(now); o.stop(now + 0.75);
  }),
  squeak: safe(() => { tone({ f0: 1800, f1: 2600, dur: 0.08, vol: 0.2 }); tone({ f0: 1900, f1: 2800, dur: 0.08, vol: 0.2, t: 0.12 }); }),
  lowBoing: safe(() => tone({ f0: 110, f1: 70, dur: 0.35, vol: 0.4 })),
  highBoing: safe(() => tone({ f0: 900, f1: 1400, dur: 0.15, vol: 0.2 })),
  rustle: safe(() => noise({ dur: 0.5, vol: 0.18, f0: 3000, q: 0.7, attack: 0.08 })),
  mmm: safe(() => tone({ type: 'triangle', f0: 260, f1: 300, dur: 0.35, vol: 0.18, attack: 0.05 })),
  thunder: safe(() => noise({ dur: 1.2, vol: 0.4, type: 'lowpass', f0: 400, f1: 80, attack: 0.02 })),
  splash: safe(() => { noise({ dur: 0.4, vol: 0.35, f0: 1200, f1: 300, q: 0.8, attack: 0.02 }); tone({ f0: 300, f1: 900, dur: 0.12, vol: 0.08 }); }),
  scrub: safe(() => noise({ dur: 0.09, vol: 0.12, type: 'highpass', f0: 2500, attack: 0.01 })),
  bubble: safe(() => tone({ f0: 500, f1: 1100, dur: 0.08, vol: 0.12 })),
  gull: safe(() => { tone({ type: 'sawtooth', f0: 900, f1: 700, dur: 0.18, vol: 0.06 }); tone({ type: 'sawtooth', f0: 950, f1: 720, dur: 0.2, vol: 0.06, t: 0.22 }); }),
  sparkle: safe(() => { [7, 5, 6, 7].forEach((n, k) => tone({ f0: SCALE[n], dur: 0.25, vol: 0.08, t: k * 0.05 })); }),

  // ---- satisfaction pass (docs/SATISFACTION.md E2/E3/E7) ----
  // The quiet default pick-up sound for drags: a soft "pup" (replaces sfx.pick, which is no longer used by the engine).
  pup: safe(() => { tone({ type: 'triangle', f0: 330, f1: 470, dur: 0.07, vol: 0.07, attack: 0.008 }); noise({ dur: 0.03, vol: 0.02, type: 'lowpass', f0: 900 }); }, 1.5),
  // A soft "no" when a wrong thing shakes its head (replaces sfx.boop in redirect()).
  nope: safe(() => { tone({ type: 'triangle', f0: 300, f1: 262, dur: 0.2, vol: 0.07, attack: 0.02 }); }, 0.8),
  // A soft camera shutter for the finale photo.
  shutter: safe(() => { noise({ dur: 0.035, vol: 0.1, type: 'highpass', f0: 3500 }); noise({ dur: 0.05, vol: 0.08, type: 'bandpass', f0: 1800, q: 2, t: 0.07 }); tone({ f0: 900, f1: 600, dur: 0.03, vol: 0.03, t: 0.07 }); }, 0.5),
  // Note i (0-based) of a rising pentatonic run in the key of the world's music (see setStepKey). With n (the
  // number of actions in the run) the run spreads over one octave and the last action (i = n - 1) lands on the top
  // tonic, so a level's actions climb and resolve. Without n it cycles the six notes. opts: { vol, soft }.
  step: exact((i = 0, n = 0, opts = {}) => {
    const f = stepFreq(i, n);
    const vol = (opts.vol ?? 0.2) * (1 + (Math.random() * 2 - 1) * 0.04);
    tone({ type: 'sine', f0: f, dur: opts.soft ? 0.35 : 0.5, vol, attack: 0.004 });
    tone({ type: 'triangle', f0: f * 2, dur: 0.12, vol: vol * 0.18, attack: 0.002 });
    if (!opts.soft) tone({ type: 'sine', f0: f * 3.01, dur: 0.06, vol: vol * 0.08, attack: 0.001 }); // a little mallet "tok"
  }),
  // The finale: a calm 3-note resolve onto the tonic (replaces sfx.fanfare).
  resolve: exact(() => {
    [[4, 0], [7, 0.17], [12, 0.34]].forEach(([semi, t], k) => {
      const f = stepRoot() * 2 ** (semi / 12);
      tone({ type: 'sine', f0: f, dur: k === 2 ? 1.1 : 0.4, vol: 0.18, t, attack: 0.006 });
      tone({ type: 'triangle', f0: f / 2, dur: k === 2 ? 0.9 : 0.3, vol: 0.06, t });
    });
  }),
};

// ---------- the level's tune: sfx.step() is pitched in the key of the world's music ----------
// Keys measured from app/assets/music/<world>.ogg (chroma + key profile): meadow, beach, build in C major;
// farm, dressup in G major. Roots are near C5 so steps sit above the music, never under it.
const STEP_ROOT = { meadow: 523.25, beach: 523.25, build: 523.25, farm: 392.0, dressup: 392.0 };
let stepKey = 523.25;
export function setStepKey(world) { stepKey = STEP_ROOT[world] || 523.25; }
function stepRoot() { return stepKey; }
const PENTA = [0, 2, 4, 7, 9, 12];
function stepFreq(i, n) {
  let semi;
  if (n > 1) semi = PENTA[Math.round((Math.max(0, Math.min(i, n - 1)) / (n - 1)) * (PENTA.length - 1))];
  else semi = PENTA[((i % PENTA.length) + PENTA.length) % PENTA.length];
  return stepRoot() * 2 ** (semi / 12);
}

// ---------- hush & duck: silence for a beat, music carries on ----------
let hushUntil = 0;
// Block new sound effects for sec seconds. cut: also fade out effects already playing (fast, 40 ms) - used when
// the finale's show-off starts. Music, ambience and voice are not affected.
export function hushEffects(sec = 0.45, { cut = false } = {}) {
  hushUntil = Math.max(hushUntil, performance.now() + sec * 1000);
  if (!cut) return;
  try {
    const c = ac(), now = c.currentTime;
    fxBus.gain.cancelScheduledValues(now);
    fxBus.gain.setTargetAtTime(0.0001, now, 0.04);
    fxBus.gain.setTargetAtTime(1, now + sec, 0.05);
  } catch (e) { /* audio unavailable */ }
}
export function effectsHushed() { return performance.now() < hushUntil; }
// Dip the music to k (0..1 of its level) for sec seconds, then bring it back.
export function duckMusic(k = 0.7, sec = 0.5) {
  try {
    if (!mus) return;
    const c = ac(), now = c.currentTime;
    mus.g.gain.setTargetAtTime(0.28 * musicVol * k, now, 0.06);
    mus.g.gain.setTargetAtTime(0.28 * musicVol, now + sec, 0.25);
  } catch (e) { /* audio unavailable */ }
}

// ---------- the calm mix gate (applies to every sfx.*, synth or recorded) ----------
// - nothing plays while effects are hushed (a beat, the start of the finale)
// - no more than 4 effects in any 700 ms
// - the boing family shares a 1.2 s cooldown (and plays at half volume when recorded)
// - no effect starts within 250 ms of another one at the same or a higher level (LEVEL below), so sounds never
//   stack; a louder, more important sound can still follow a quiet one
// Musical sounds (note, step, resolve, drums, chime) are exempt from the stacking rules (tunes and jams need
// fast notes) and don't count against other effects; they are still silenced by a hush.
const BOINGY = new Set(['boing', 'boing2', 'highBoing', 'lowBoing', 'spring', 'wobble']);
const MUSICAL = new Set(['note', 'step', 'resolve', 'drumLoud', 'drumSoft', 'chime']);
const LEVEL = { tap: 0.1, tick: 0.1, pup: 0.15, pick: 0.2, nope: 0.2, scrub: 0.2, bubble: 0.2, sparkle: 0.25, twinkle: 0.15, shutter: 0.3,
  patter: 0.3, swoosh: 0.3, bloop: 0.35, land: 0.4, cheep: 0.35, gull: 0.3, mmm: 0.4, rustle: 0.4,
  pop: 0.6, thunk: 0.6, chomp: 0.6, splash: 0.7, whoosh: 0.5, thunder: 0.9, fanfare: 0.8, success: 0.8, trumpet: 0.8 };
let lastBoing = 0;
const recent = []; // [{t, lv}]
function allow(ev) {
  const now = performance.now();
  if (now < hushUntil) return false;
  if (MUSICAL.has(ev)) return true;
  while (recent.length && now - recent[0].t > 700) recent.shift();
  if (recent.length >= 4) return false;
  const lv = LEVEL[ev] ?? 0.5;
  for (const r of recent) if (now - r.t < 250 && r.lv >= lv) return false;
  if (BOINGY.has(ev)) { if (now - lastBoing < 1200) return false; lastBoing = now; }
  recent.push({ t: now, lv });
  return true;
}
function gated(ev, fn) { const g = (...a) => { if (allow(ev)) fn(...a); }; g.raw = fn; return g; }
for (const k of Object.keys(sfx)) sfx[k] = gated(k, sfx[k]);

// ---------- recorded sounds (CC0, app/assets/sfx, see CREDITS.md) ----------
// Each event has several takes; a random one plays (never the same twice running) with a touch of pitch
// variation. Events without recordings keep their synthesized versions above.
const SKIP = new Set(['moo_2.ogg', 'cheep_2.ogg', 'mouse_1.ogg']);       // people imitating animals
const KEEP_SYNTH = new Set(['chime', 'note', 'tick', 'step', 'resolve', 'pup', 'nope', 'shutter']); // pitched / musical: keep exact
const ALIAS = { boing2: 'highBoing', ooh: 'monkey', puff: 'pop', jingle: 'success', yawn: 'slideDown', chirp: 'cheep' };
const GAIN = { giggle: 0.8, oink: 0.8, sneeze: 0.7, splash: 0.8, fanfare: 0.85, success: 0.85 };
const buffers = {};
export async function loadSamples() {
  let man;
  try { man = await (await fetch('assets/sfx/manifest.json')).json(); } catch (e) { console.warn('no sfx', e); return; }
  const c = ac();
  await Promise.all(Object.entries(man).map(async ([ev, files]) => {
    const list = await Promise.all(files.filter((f) => !SKIP.has(f)).map(async (f) => {
      try { return await c.decodeAudioData(await (await fetch('assets/sfx/' + f)).arrayBuffer()); } catch (e) { return null; }
    }));
    const ok = list.filter(Boolean);
    if (ok.length) buffers[ev] = ok;
  }));
  const keys = new Set([...Object.keys(sfx), ...Object.keys(buffers), ...Object.keys(ALIAS)]);
  for (const k of keys) {
    if (KEEP_SYNTH.has(k)) continue;
    const src = buffers[k] ? k : ALIAS[k] && buffers[ALIAS[k]] ? ALIAS[k] : null;
    if (!src) continue;
    sfx[k] = gated(k, sampled(src, GAIN[k] ?? GAIN[src] ?? 1));
  }
}
// A recorded event: one of its takes (never the same twice running), ±1 semitone and ±5% volume wobble.
// The calm-mix gate (allow(), above) wraps it in loadSamples.
function sampled(ev, gain) {
  let last = 0, lastI = -1;
  if (BOINGY.has(ev)) gain *= 0.5;
  return (arg) => {
    const now = performance.now();
    if (now - last < 60) return;
    last = now;
    try {
      const c = ac(), list = buffers[ev];
      let i = (Math.random() * list.length) | 0;
      if (list.length > 1 && i === lastI) i = (i + 1) % list.length;
      lastI = i;
      const s = c.createBufferSource();
      s.buffer = list[i];
      // numeric argument = a step up in pitch (counting, rising sequences); otherwise ±1 semitone wobble
      const semis = typeof arg === 'number' ? arg * 2 : (Math.random() * 2 - 1);
      s.playbackRate.value = 2 ** (semis / 12);
      const g = c.createGain();
      g.gain.value = gain * duck() * (1 + (Math.random() * 2 - 1) * 0.05);
      s.connect(g); g.connect(fxBus);
      s.start();
    } catch (e) { /* audio unavailable */ }
  };
}

// ---------- background ambience: a quiet loop per world, crossfaded on world change ----------
const AMB = { meadow: ['amb_meadow', 1.0], beach: ['amb_beach', 0.6], farm: ['amb_farm', 0.4], dressup: ['amb_room', 0.55] };
let amb = null, ambKey = null;
export function setAmbience(world) {
  setMusic(world);
  const e = AMB[world];
  const key = e && e[0];
  if (key === ambKey) return;
  ambKey = key;
  try {
    const c = ac();
    if (amb) { const old = amb; old.g.gain.setTargetAtTime(0.0001, c.currentTime, 0.4); setTimeout(() => { try { old.s.stop(); } catch (er) { /* */ } }, 2000); amb = null; }
    const buf = key && buffers[key] && buffers[key][0];
    if (!buf) { if (key) setTimeout(() => { if (ambKey === key) { ambKey = null; setAmbience(world); } }, 1500); return; }
    const s = c.createBufferSource(); s.buffer = buf; s.loop = true;
    const g = c.createGain(); g.gain.value = 0.0001;
    g.gain.setTargetAtTime(0.16 * e[1], c.currentTime, 0.8);
    s.connect(g); g.connect(master); s.start();
    amb = { s, g };
  } catch (er) { /* audio unavailable */ }
}

// ---------- background music (Suno instrumentals, app/assets/music/<world>.ogg), one loop per world ----------
// Quiet, crossfaded on world changes, ducked a little while effects play. Loaded on first use per world.
let musicVol = 0.5, mus = null, musKey = null;
const musBufs = {};
export function setMusicVolume(v) { musicVol = v; if (mus) mus.g.gain.setTargetAtTime(0.28 * musicVol, ac().currentTime, 0.2); }
export function getMusicVolume() { return musicVol; }
async function musicBuf(world) {
  if (!musBufs[world]) {
    musBufs[world] = (async () => {
      try { return await ac().decodeAudioData(await (await fetch(`assets/music/${world}.ogg`)).arrayBuffer()); } catch (e) { return null; }
    })();
  }
  return musBufs[world];
}
export async function setMusic(world) {
  if (world === musKey) return;
  musKey = world;
  try {
    const c = ac();
    if (mus) { const old = mus; old.g.gain.setTargetAtTime(0.0001, c.currentTime, 0.5); setTimeout(() => { try { old.s.stop(); } catch (e) { /* */ } }, 2500); mus = null; }
    const buf = world && (await musicBuf(world));
    if (!buf || musKey !== world) return;
    const s = c.createBufferSource(); s.buffer = buf; s.loop = true;
    const g = c.createGain(); g.gain.value = 0.0001;
    g.gain.setTargetAtTime(0.28 * musicVol, c.currentTime, 1.0);
    s.connect(g); g.connect(master); s.start();
    mus = { s, g };
  } catch (e) { /* audio unavailable */ }
}

// ---------- voice clips: one at a time (a new line interrupts the last), music dips while speaking ----------
let voiceSrc = null;
const voiceBufs = new Map();
export async function playVoice(file) {
  try {
    const c = ac();
    if (!voiceBufs.has(file)) voiceBufs.set(file, fetch('assets/voice/' + file).then((r) => r.arrayBuffer()).then((b) => c.decodeAudioData(b)).catch(() => null));
    const buf = await voiceBufs.get(file);
    if (!buf) return 0;
    if (voiceSrc) { try { voiceSrc.stop(); } catch (e) { /* */ } }
    const s = c.createBufferSource(); s.buffer = buf;
    const g = c.createGain(); g.gain.value = 1.0;
    s.connect(g); g.connect(master); s.start();
    voiceSrc = s;
    if (mus) { mus.g.gain.setTargetAtTime(0.12 * musicVol, c.currentTime, 0.1); s.onended = () => { if (voiceSrc === s && mus) mus.g.gain.setTargetAtTime(0.28 * musicVol, c.currentTime, 0.4); }; }
    return buf.duration;
  } catch (e) { return 0; }
}
