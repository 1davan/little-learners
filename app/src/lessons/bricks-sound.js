// Brick letters sounds the engine doesn't have: the plastic click/clack of a brick snapping in (pitched up the scale
// as the count rises), a little hop whoosh, a rattle as the bricks tumble back, a hoot for Owl, a kite flutter and
// a magic "ta-da" for the finished letter. Synthesized on a small WebAudio context of our own that follows the engine
// volume (the same approach as dress-sound.js and band-sound.js).
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
const V = () => 2 ** ((Math.random() * 2 - 1) * 0.8 / 12);
const safe = (fn) => (...a) => { try { fn(...a); } catch (e) { /* audio unavailable */ } };
// a major pentatonic ladder, so counting up always sounds happy
const PENTA = [0, 2, 4, 7, 9];
const step = (i) => 2 ** ((PENTA[i % 5] + 12 * Math.floor(i / 5)) / 12);

export const bsfx = {
  // the snap: a hard plastic "click" (two quick ticks) with a bright pitched knock that climbs with the count
  click: safe((i = 0) => {
    const k = V();
    noise({ dur: 0.025, vol: 0.32, type: 'highpass', f: 3200 * k, q: 0.7 });
    noise({ dur: 0.035, vol: 0.26, type: 'bandpass', f: 2200 * k, q: 3, t: 0.03 });
    const f = 520 * step(Math.min(i, 19));
    tone({ type: 'triangle', f0: f * 1.5, f1: f, dur: 0.09, vol: 0.2, t: 0.005 });
    tone({ type: 'sine', f0: f * 2, dur: 0.12, vol: 0.06, t: 0.02 });
  }),
  // a softer clack when you tap a brick that is already in the letter
  clack: safe(() => { const k = V(); noise({ dur: 0.03, vol: 0.25, type: 'bandpass', f: 1500 * k, q: 2.5 }); noise({ dur: 0.03, vol: 0.18, type: 'bandpass', f: 1100 * k, q: 2.5, t: 0.06 }); }),
  // the hop: a rising little whoosh
  hop: safe(() => { const k = V(); tone({ type: 'sine', f0: 380 * k, f1: 900 * k, dur: 0.16, vol: 0.09 }); noise({ dur: 0.18, vol: 0.05, f: 900, f1: 2600, q: 1.2, attack: 0.04 }); }),
  // bricks tumbling back: a cascade of little clacks
  rattle: safe((n = 8) => { for (let i = 0; i < Math.min(14, n); i++) noise({ dur: 0.03, vol: 0.14, type: 'bandpass', f: 1200 + Math.random() * 1600, q: 2.5, t: 0.08 + i * 0.045 + Math.random() * 0.02 }); }),
  // the finished letter: a sparkly up-arpeggio
  tada: safe(() => { [0, 4, 7, 12, 16].forEach((n, i) => tone({ type: 'triangle', f0: 523 * 2 ** (n / 12), dur: 0.22, vol: 0.12, t: i * 0.06 })); }),
  // Owl: "hoo-hoo"
  hoot: safe(() => { const k = V(); for (const [t, f] of [[0, 420], [0.28, 380]]) { tone({ type: 'sine', f0: f * k * 1.05, f1: f * k, dur: 0.22, vol: 0.22, t, attack: 0.04 }); tone({ type: 'sine', f0: f * k * 2.01, dur: 0.18, vol: 0.03, t, attack: 0.04 }); } }),
  // a kite/leaf/jellyfish flutter: a soft swirly whoosh
  flutter: safe(() => { for (let i = 0; i < 4; i++) noise({ dur: 0.1, vol: 0.06, f: 1500 + i * 400, q: 2, t: i * 0.07, attack: 0.02 }); }),
  // a soft bouncy "boing" for the ball and apple
  boing: safe(() => { const k = V(); tone({ type: 'sine', f0: 180 * k, f1: 420 * k, dur: 0.22, vol: 0.2 }); }),
};
