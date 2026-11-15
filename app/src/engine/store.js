// Persistent progress (stickers, per-lesson stats, settings) in localStorage.
const KEY = 'll.v1';
const blank = () => ({ stickers: {}, stats: {}, level: {}, settings: { volume: 0.6, speechVolume: 1, voiceURI: null, level: 0 } });

let state = load();
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const s = JSON.parse(raw); const b = blank(); return { ...b, ...s, settings: { ...b.settings, ...(s.settings || {}) } }; }
  } catch (e) { /* storage unavailable */ }
  return blank();
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ } }

export const store = {
  get: () => state,
  update(fn) { fn(state); save(); },
  stickers: (id) => state.stickers[id] || 0,
  addSticker(id) { state.stickers[id] = (state.stickers[id] || 0) + 1; save(); return state.stickers[id]; },
  // The parent picks Level 1/2/3 (stored 0..2) on the home screen; it applies to every game.
  level: () => state.settings.level || 0,
  setLevel(l) { state.settings.level = l; save(); },
  // Record a finished session (stats only; the level is chosen by the parent).
  record(id, rounds) {
    const st = (state.stats[id] = state.stats[id] || { plays: 0, sessions: [] });
    const firstTry = rounds.filter((r) => r.firstTry).length;
    st.plays++;
    st.sessions.push({ firstTry, rounds: rounds.length, level: state.settings.level || 0, at: Date.now() });
    st.sessions = st.sessions.slice(-20);
    save();
  },
  reset() { const settings = state.settings; state = blank(); state.settings = settings; save(); },
};
