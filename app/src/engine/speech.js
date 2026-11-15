// Narration through the operating system's offline voices (speechSynthesis).
// If no voice is available the app still works — sound effects and the ghost hand carry each lesson.
import { store } from './store.js';

// The parent asked for no computer voice: narration is shown as on-screen captions only (for a grown-up to read aloud).
// Set VOICE = true to bring the OS voice back.
const VOICE = false;
const synth = VOICE && 'speechSynthesis' in window ? window.speechSynthesis : null;
const PREFERRED = ['Samantha', 'Karen', 'Moira', 'Tessa', 'Zira', 'Hazel', 'Aria', 'Jenny', 'Libby', 'Sonia', 'Natasha', 'Catherine', 'Serena', 'Fiona'];
let voice = null;
let current = null; // keep a reference so the utterance isn't garbage-collected (onend would never fire)
let pending = null;
let volume = 1;
let timer = null;
const captionFns = new Set();
let shown = null;
function caption(text, ifShowing) {
  if (text === null && ifShowing !== undefined && ifShowing !== shown) return; // a newer line is showing
  shown = text;
  for (const f of captionFns) f(text);
}
// macOS ships joke voices; never pick these automatically.
const NOVELTY = /Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Good News|Jester|Organ|Superstar|Trinoids|Whisper|Wobble|Zarvox|Junior|Ralph|Fred|Rocko|Grandpa|Grandma|Eddy|Reed/;

function englishVoices() {
  return synth ? synth.getVoices().filter((v) => /^en/i.test(v.lang)) : [];
}

function pick() {
  const vs = englishVoices();
  const saved = store.get().settings.voiceURI;
  voice = vs.find((v) => v.voiceURI === saved) || null;
  if (!voice) {
    const local = vs.filter((v) => v.localService !== false && !NOVELTY.test(v.name));
    for (const name of PREFERRED) {
      voice = local.find((v) => v.name.includes(name)) || null;
      if (voice) break;
    }
    if (!voice) voice = local[0] || vs[0] || null;
  }
}

export const speech = {
  async init() {
    if (!synth) return;
    await new Promise((res) => {
      if (synth.getVoices().length) return res();
      synth.addEventListener('voiceschanged', () => res(), { once: true });
      setTimeout(res, 2000);
    });
    pick();
    synth.addEventListener('voiceschanged', pick);
    volume = store.get().settings.speechVolume ?? 1;
  },
  warm() {
    if (!synth) return;
    try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; synth.speak(u); } catch (e) { /* ignore */ }
  },
  voices() { return englishVoices(); },
  onCaption(fn) { captionFns.add(fn); return () => captionFns.delete(fn); },
  current() { return voice; },
  setVoice(uri) { store.update((s) => { s.settings.voiceURI = uri; }); pick(); },
  setVolume(v) { volume = v; store.update((s) => { s.settings.speechVolume = v; }); },
  stop() {
    if (pending) { pending(); pending = null; }
    clearTimeout(timer);
    if (synth) synth.cancel();
  },
  // Speak text. Resolves when finished (or after a safety timeout). Interrupts by default.
  say(text, { interrupt = true, rate = 0.92, pitch = 1.12 } = {}) {
    return new Promise((resolve) => {
      const estimate = text.length * 85 + 1200;
      caption(text);
      const hideLater = () => setTimeout(() => caption(null, text), 1600);
      if (!synth || !voice || volume === 0) { setTimeout(() => { hideLater(); resolve(); }, Math.max(1400, estimate - 600)); return; }
      if (interrupt) speech.stop();
      let done = false;
      const finish = () => { if (done) return; done = true; if (pending === finish) pending = null; hideLater(); resolve(); };
      pending = finish;
      // Windows drops an utterance spoken in the same tick as cancel(); defer slightly.
      timer = setTimeout(() => {
        const u = new SpeechSynthesisUtterance(text);
        u.voice = voice; u.lang = voice.lang; u.rate = rate; u.pitch = pitch; u.volume = volume;
        u.onend = finish; u.onerror = finish;
        current = u;
        synth.speak(u);
        setTimeout(finish, estimate + 1500);
      }, 60);
    });
  },
};
