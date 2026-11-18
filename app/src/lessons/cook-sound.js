// Cook a soup sounds the engine doesn't have: a crisp knife chop on the board (varied in pitch), a plop into the soup,
// the stove knob's clicks, a soft gas whoomp, a gentle simmer (a quiet bubbling bed plus the odd blub), a scrape as the
// pieces are gathered and a slosh for stirring. Synthesized on a small WebAudio context of our own that follows the
// engine volume (the same approach as blocks-sound.js).
import { getVolume, sharedCtx, cueOut, effectsHushed } from '../engine/audio.js';

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
const semi = (s) => 2 ** (s / 12);
// (nothing plays during the engine's hush - the held breath before a reveal, the finale)
const safe = (fn, always = false) => (...a) => { try { if (!always && effectsHushed()) return; fn(...a); } catch (e) { /* audio unavailable */ } };

let simmer = null;
export const csfx = {
  // a knife chop: the blade's crisp slice, then the knock of the board (a little higher or lower every time)
  chop: safe((big = false) => {
    const k = semi((Math.random() * 2 - 1) * 2.5);
    noise({ dur: 0.05, vol: 0.16, type: 'highpass', f: 3800 * k, attack: 0.004 });
    tone({ type: 'sine', f0: 820 * k, f1: 360 * k, dur: 0.07, vol: 0.34, t: 0.03 });
    tone({ type: 'triangle', f0: 1650 * k, dur: 0.03, vol: 0.05, t: 0.03 });
    noise({ dur: 0.04, vol: 0.14, type: 'bandpass', f: 1500 * k, q: 2.5, t: 0.03 });
    if (big) noise({ dur: 0.1, vol: 0.12, type: 'highpass', f: 2600, t: 0.02 });
  }),
  // the knife lands on the bare board (nothing under it): just the knock
  knock: safe(() => { const k = semi((Math.random() * 2 - 1) * 2); tone({ f0: 700 * k, f1: 330 * k, dur: 0.07, vol: 0.22 }); noise({ dur: 0.03, vol: 0.08, type: 'bandpass', f: 1400 * k, q: 2.5 }); }),
  // a piece drops into the soup
  plop: safe(() => {
    const k = semi((Math.random() * 2 - 1) * 3);
    tone({ f0: 260 * k, f1: 760 * k, dur: 0.09, vol: 0.2, attack: 0.002 });
    noise({ dur: 0.12, vol: 0.06, type: 'lowpass', f: 900 * k });
  }),
  // the stove knob turns: three soft clicks
  click: safe(() => { [0, 0.11, 0.22].forEach((t, i) => { tone({ type: 'square', f0: 2200 + i * 150, dur: 0.018, vol: 0.05, t }); noise({ dur: 0.02, vol: 0.06, type: 'highpass', f: 4000, t }); }); }),
  // the gas lights: a soft breathy whoomp
  whoomp: safe(() => { noise({ dur: 0.45, vol: 0.2, type: 'lowpass', f: 220, f1: 1100, attack: 0.05 }); tone({ f0: 90, f1: 140, dur: 0.3, vol: 0.12, attack: 0.04 }); }),
  // one soft bubble in the pot
  blub: safe(() => { const k = semi(Math.random() * 6 - 3); tone({ f0: 190 * k, f1: 420 * k, dur: 0.07, vol: 0.05, attack: 0.004 }); }),
  // the pieces gathered up on the board
  scrape: safe(() => { noise({ dur: 0.28, vol: 0.07, type: 'bandpass', f: 1800, f1: 1100, q: 1.2, attack: 0.04 }); }),
  // a stir round the pot
  slosh: safe(() => { noise({ dur: 0.35, vol: 0.09, type: 'lowpass', f: 500, f1: 1300, attack: 0.08 }); }),
  // Bear blows on the spoon: a soft breathy puff
  blow: safe(() => { noise({ dur: 0.5, vol: 0.07, type: 'bandpass', f: 1300, f1: 700, q: 0.8, attack: 0.08 }); }),
  // ... and sips: a tiny slurp
  sip: safe(() => { noise({ dur: 0.22, vol: 0.06, type: 'bandpass', f: 900, f1: 2400, q: 2, attack: 0.03 }); tone({ f0: 520, f1: 740, dur: 0.12, vol: 0.04, t: 0.08 }); }),
  // a quiet bubbling bed under the cooking (on / off, eased)
  simmer: safe((on) => {
    const c = ac();
    if (on && !simmer) {
      const s = c.createBufferSource(); s.buffer = noiseBuf(c); s.loop = true;
      const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 420; fl.Q.value = 0.7;
      const g = c.createGain(); g.gain.value = 0.0001;
      g.gain.setTargetAtTime(0.035, c.currentTime, 0.6);
      s.connect(fl); fl.connect(g); g.connect(out); s.start();
      simmer = { s, g };
    } else if (!on && simmer) {
      const old = simmer; simmer = null;
      old.g.gain.setTargetAtTime(0.0001, c.currentTime, 0.25);
      setTimeout(() => { try { old.s.stop(); } catch (e) { /* */ } }, 1200);
    }
  }, true),
};
