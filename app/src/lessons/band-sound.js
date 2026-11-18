// Instrument sounds for Barn band: loud and quiet versions of a drum, a bucket drum, a pot-and-spoon, a cowbell,
// a pumpkin drum and a milk churn.
// The engine's sfx has the two drums; the others are synthesized here on a small WebAudio context of our own
// (the engine's context is private), following the engine volume.
import { sfx, getVolume, sharedCtx, cueOut } from '../engine/audio.js';

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
function tone({ type = 'sine', f0, f1 = null, dur = 0.2, vol = 0.2, t = 0, attack = 0.003, filter = null }) {
  const c = ac(), now = c.currentTime + t;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, now);
  if (f1) o.frequency.exponentialRampToValueAtTime(f1, now + dur);
  env(g, now, vol, attack, dur);
  if (filter) { const f = c.createBiquadFilter(); f.type = filter.type; f.frequency.value = filter.f; f.Q.value = filter.q || 1; o.connect(f); f.connect(g); } else o.connect(g);
  g.connect(out);
  o.start(now); o.stop(now + dur + 0.05);
}
let buf = null;
function noise({ dur = 0.1, vol = 0.2, type = 'bandpass', f = 1000, q = 1, t = 0 }) {
  const c = ac(), now = c.currentTime + t;
  if (!buf) { buf = c.createBuffer(1, c.sampleRate, c.sampleRate); const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const s = c.createBufferSource(); s.buffer = buf;
  const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
  const g = c.createGain(); env(g, now, vol, 0.002, dur);
  s.connect(fl); fl.connect(g); g.connect(out);
  s.start(now, Math.random() * 0.5); s.stop(now + dur + 0.05);
}

const VARY = () => 2 ** ((Math.random() * 2 - 1) * 0.6 / 12);
const PLAY = {
  drum: (loud) => (loud ? sfx.drumLoud() : sfx.drumSoft()),
  bucket: (loud) => {
    const k = VARY();
    if (loud) { tone({ f0: 120 * k, f1: 60 * k, dur: 0.32, vol: 0.55 }); tone({ type: 'triangle', f0: 420 * k, f1: 260 * k, dur: 0.07, vol: 0.18 }); noise({ dur: 0.06, vol: 0.25, type: 'lowpass', f: 1200 }); }
    else { tone({ f0: 280 * k, f1: 180 * k, dur: 0.12, vol: 0.14 }); tone({ type: 'triangle', f0: 640 * k, f1: 420 * k, dur: 0.04, vol: 0.06 }); }
  },
  pot: (loud) => {
    const k = VARY();
    // a clangy metal pot: inharmonic partials that ring out
    const parts = [[523, 1], [1187, 0.6], [1873, 0.45], [2687, 0.3], [3511, 0.18]];
    for (const [f, a] of parts) tone({ f0: f * k, dur: loud ? 0.75 : 0.32, vol: (loud ? 0.16 : 0.035) * a, attack: 0.001 });
    noise({ dur: loud ? 0.05 : 0.03, vol: loud ? 0.25 : 0.06, type: 'highpass', f: 3000 });
  },
  pumpkin: (loud) => {
    // a hollow, woody thock
    const k = VARY();
    if (loud) { tone({ f0: 95 * k, f1: 55 * k, dur: 0.38, vol: 0.6 }); tone({ type: 'triangle', f0: 230 * k, f1: 150 * k, dur: 0.12, vol: 0.22 }); noise({ dur: 0.05, vol: 0.18, type: 'lowpass', f: 800 }); }
    else { tone({ f0: 210 * k, f1: 140 * k, dur: 0.14, vol: 0.13 }); tone({ type: 'triangle', f0: 380 * k, f1: 260 * k, dur: 0.05, vol: 0.05 }); }
  },
  churn: (loud) => {
    // a deep metal bong
    const k = VARY();
    const parts = [[262, 1], [611, 0.55], [977, 0.4], [1440, 0.22]];
    for (const [f, a] of parts) tone({ f0: f * k, dur: loud ? 0.9 : 0.35, vol: (loud ? 0.2 : 0.04) * a, attack: 0.001 });
    noise({ dur: loud ? 0.04 : 0.02, vol: loud ? 0.2 : 0.05, type: 'bandpass', f: 2200, q: 2 });
  },
  cowbell: (loud) => {
    const k = VARY();
    const filter = { type: 'bandpass', f: 900, q: 2 };
    tone({ type: 'square', f0: 545 * k, dur: loud ? 0.5 : 0.22, vol: loud ? 0.45 : 0.09, filter, attack: 0.001 });
    tone({ type: 'square', f0: 815 * k, dur: loud ? 0.4 : 0.18, vol: loud ? 0.35 : 0.07, filter, attack: 0.001 });
  },
};
export function playInstrument(kind, loud) {
  try { (PLAY[kind] || PLAY.drum)(loud); } catch (e) { /* audio unavailable */ }
}
