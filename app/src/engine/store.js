// Persistent progress (stickers, per-lesson stats, settings) in localStorage.
const KEY = 'll.v1';
const blank = () => ({ stickers: {}, stats: {}, level: {}, settings: { volume: 0.6, speechVolume: 1, voiceURI: null, level: 0 } });

let state = load();

// The child's creations (finale photos, E4): the last 3 per game as small JPEG data URLs, kept under their own
// key so the main progress record stays small. { [gameId]: [oldest, ..., newest] }
const CKEY = 'll.creations.v1';
let creations = loadCreations();
function loadCreations() { try { return JSON.parse(localStorage.getItem(CKEY) || '{}') || {}; } catch (e) { return {}; } }
function saveCreations() {
  for (let tries = 0; tries < 30; tries++) {
    try { localStorage.setItem(CKEY, JSON.stringify(creations)); return true; } catch (e) {
      // storage full: drop the oldest photo of the game that has the most, and try again
      const ids = Object.keys(creations).filter((k) => creations[k].length > 1).sort((a, b) => creations[b].length - creations[a].length);
      const id = ids[0] || Object.keys(creations)[0];
      if (!id) return false;
      creations[id].shift();
      if (!creations[id].length) delete creations[id];
    }
  }
  return false;
}
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const s = JSON.parse(raw); const b = blank(); return { ...b, ...s, settings: { ...b.settings, ...(s.settings || {}) } }; }
  } catch (e) { /* storage unavailable */ }
  return blank();
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ } }

const resetHooks = [], parentNoteFns = [];
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
  reset() { const settings = state.settings; state = blank(); state.settings = settings; save(); creations = {}; saveCreations(); for (const f of resetHooks) { try { f(); } catch (e) { /* */ } } },
  // Games with their own saved record (e.g. Word world's word memory) register here so Reset clears it too, and
  // may add one line of their own to the parent panel.
  onReset(fn) { resetHooks.push(fn); },
  addParentNote(fn) { parentNoteFns.push(fn); },
  parentNotes() { return parentNoteFns.map((f) => { try { return f() || ''; } catch (e) { return ''; } }).join(''); },
  // ---- creation gallery ----
  creations: (id) => (creations[id] || []).slice(),
  latestCreation: (id) => { const l = creations[id]; return l && l.length ? l[l.length - 1] : null; },
  addCreation(id, url) {
    if (!url) return;
    (creations[id] = creations[id] || []).push(url);
    creations[id] = creations[id].slice(-3);
    saveCreations();
  },
};
