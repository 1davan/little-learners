// DOM overlays: fade transitions, the child home button (hold), the parent gate (hold corner 3 s),
// the sticker shelf, and the sticker award.
import { store } from './store.js';
import { speech } from './speech.js';
import { setVolume, getVolume, sfx, getMusicVolume, setMusicVolume } from './audio.js';
import { LESSON_LIST, WORLDS } from '../lessons/meta.js';
import { THEMES } from './theme.js';

const $ = (sel) => document.querySelector(sel);
const ui = document.getElementById('ui');

// ---------- fade ----------
const fade = document.createElement('div');
fade.id = 'fade';
ui.appendChild(fade);
export function fadeTo(on) {
  fade.classList.toggle('on', on);
  return new Promise((r) => setTimeout(r, 320));
}

// ---------- hold-to-activate helper ----------
function holdButton(el, ms, onDone) {
  let timer = null, start = 0, raf = 0;
  const ring = el.querySelector('.ring');
  const reset = () => { clearTimeout(timer); cancelAnimationFrame(raf); if (ring) ring.style.setProperty('--p', 0); el.classList.remove('holding'); };
  const tick = () => { const p = Math.min(1, (performance.now() - start) / ms); if (ring) ring.style.setProperty('--p', p); if (p < 1) raf = requestAnimationFrame(tick); };
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault(); e.stopPropagation();
    start = performance.now();
    el.classList.add('holding');
    tick();
    timer = setTimeout(() => { reset(); onDone(); }, ms);
  });
  for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) el.addEventListener(ev, reset);
}

// ---------- home button (child, 0.8 s hold) ----------
const homeBtn = document.createElement('div');
homeBtn.id = 'home-btn';
homeBtn.innerHTML = '<div class="ring"></div><span>🏠</span>';
ui.appendChild(homeBtn);
let onHome = () => {};
holdButton(homeBtn, 800, () => onHome());
export function setHomeHandler(fn) { onHome = fn; }

// ---------- caption: shows what Pip is saying, so a grown-up can read it out and show the move ----------
const cap = document.createElement('div');
cap.id = 'caption';
cap.innerHTML = '<span class="who">🐥</span><span class="txt"></span>';
ui.appendChild(cap);
speech.onCaption((text) => {
  if (text) { cap.querySelector('.txt').textContent = text; cap.classList.add('on'); }
  else cap.classList.remove('on');
});

// ---------- level picker (home screen): Level 1 / 2 / 3 for every game ----------
const levels = document.createElement('div');
levels.id = 'levels';
ui.appendChild(levels);
// Each button also shows that level's look for the current world (🌷 🍂 ⛄ / ☀️ 🌅 🌙 / 🌱 🎃 🌈).
let uiWorld = 'meadow';
let onLevel = null;
export function setLevelHandler(fn) { onLevel = fn; }
export function setUiWorld(world) { uiWorld = world; renderLevels(); }
function renderLevels() {
  const cur = store.level();
  const looks = THEMES[uiWorld] || THEMES.meadow;
  levels.innerHTML = '<span class="lbl">Level</span>' + [0, 1, 2].map((l) =>
    `<button data-l="${l}" class="${l === cur ? 'on' : ''}" title="${looks[l].name}"><b>${l + 1}</b><i>${'★'.repeat(l + 1)}</i><em>${looks[l].emoji}</em></button>`).join('');
  levels.querySelectorAll('button').forEach((b) => b.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    const l = +b.dataset.l;
    const changed = l !== store.level();
    store.setLevel(l);
    sfx.note(l * 2);
    renderLevels();
    if (changed && onLevel) onLevel(l);
    else speech.say(`Level ${l + 1}!`);
  }));
}
renderLevels();

// ---------- world paging (home screen): swipe or tap the arrows ----------
const arrowL = document.createElement('div');
arrowL.className = 'page-arrow left';
arrowL.textContent = '◀';
const arrowR = document.createElement('div');
arrowR.className = 'page-arrow right';
arrowR.textContent = '▶';
const dots = document.createElement('div');
dots.id = 'page-dots';
ui.append(arrowL, arrowR, dots);
let onPage = () => {};
export function setPageHandler(fn) { onPage = fn; }
arrowL.addEventListener('pointerdown', (e) => { e.stopPropagation(); onPage('right'); });
arrowR.addEventListener('pointerdown', (e) => { e.stopPropagation(); onPage('left'); });
export function renderPages(page) {
  dots.innerHTML = WORLDS.map((w, i) => `<span class="${i === page ? 'on' : ''}">${w.icon}</span>`).join('');
}

// ---------- sticker shelf (home screen) ----------
// A small row in the top-left corner showing only the stickers this world has earned: one sticker per game,
// with a little "×n" when it has more. Hidden until the first sticker.
const shelf = document.createElement('div');
shelf.id = 'shelf';
ui.appendChild(shelf);
export function renderShelf(lessons = LESSON_LIST.slice(0, 5), newId = null) {
  shelf.innerHTML = '';
  for (const l of lessons) {
    const n = store.stickers(l.id);
    if (n < 1) continue;
    const s = document.createElement('div');
    s.className = 'slot got' + (newId === l.id ? ' new' : '');
    s.style.setProperty('--c', l.color);
    s.textContent = l.icon;
    if (n > 1) { const b = document.createElement('i'); b.className = 'extra'; b.textContent = '×' + n; s.appendChild(b); }
    s.addEventListener('pointerdown', (e) => { e.stopPropagation(); s.classList.remove('spin'); void s.offsetWidth; s.classList.add('spin'); sfx.note(LESSON_LIST.indexOf(l)); });
    shelf.appendChild(s);
  }
  shelf.classList.toggle('empty', !shelf.children.length);
}

export function setMode(mode) {
  document.body.dataset.mode = mode === 'home' ? 'home' : 'lesson';
}

// ---------- sticker award ----------
export function awardSticker(meta) {
  return new Promise((resolve) => {
    const el = document.createElement('div');
    el.className = 'award';
    el.style.setProperty('--c', meta.color);
    el.innerHTML = `<div class="burst"></div><div class="sticker">${meta.icon}</div>`;
    ui.appendChild(el);
    let done = false;
    const finish = () => {
      if (done) return; done = true;
      el.classList.add('fly');
      sfx.whoosh();
      setTimeout(() => { el.remove(); resolve(); }, 650);
    };
    el.addEventListener('pointerdown', (e) => { e.stopPropagation(); sfx.pop(); finish(); });
    setTimeout(finish, 6500);
  });
}

// ---------- parent menu: a visible gear, top-right. Hold it 1.5 s (so little fingers don't open it by accident) ----------
const corner = document.createElement('div');
corner.id = 'parent-corner';
corner.innerHTML = '<div class="ring"></div><span class="gear">⚙️</span><span class="hold">hold</span>';
ui.appendChild(corner);
holdButton(corner, 1500, () => openParentPanel());

const panel = document.createElement('div');
panel.id = 'parent-panel';
ui.appendChild(panel);
let onReset = () => {};
export function setResetHandler(fn) { onReset = fn; }

function openParentPanel() {
  const st = store.get();
  const voices = speech.voices();
  const cur = speech.current();
  const rows = LESSON_LIST.map((l) => {
    const s = st.stats[l.id];
    const last = s ? s.sessions.slice(-5).map((x) => `L${(x.level ?? 0) + 1}: ${x.firstTry}/${x.rounds}`).join(' · ') : '—';
    return `<tr><td>${l.icon} ${l.title}</td><td>${store.stickers(l.id)}</td><td>${s ? s.plays : 0}</td><td>${last}</td></tr>`;
  }).join('');
  panel.innerHTML = `
    <div class="card">
      <h2>Grown-ups</h2>
      <p class="muted">Each lesson is based on a topic from the Marble learning taxonomy. "First try" shows how many rounds were solved with no hint and no wrong choice.</p>
      <p>Current level: <b>Level ${store.level() + 1}</b> (change it with the 1 · 2 · 3 buttons on the home screen).</p><table><tr><th>Game</th><th>Stickers</th><th>Plays</th><th>Recent: level and first-try</th></tr>${rows}</table>
      <label>Sound effects <input type="range" id="pp-vol" min="0" max="1" step="0.05" value="${getVolume()}"></label>
      <label>Music <input type="range" id="pp-music" min="0" max="1" step="0.05" value="${getMusicVolume()}"></label>
      <div class="btns">
        <button id="pp-reset">Reset stickers</button>
        <button id="pp-close" class="primary">Back to play</button>
        <button id="pp-quit" class="danger">Quit app</button>
      </div>
      <p class="muted">Tip: Ctrl+Shift+Q (⌘⇧Q on Mac) also quits.</p>
    </div>`;
  panel.classList.add('open');
  $('#pp-music').oninput = (e) => { setMusicVolume(+e.target.value); store.update((s) => { s.settings.music = +e.target.value; }); };
  $('#pp-vol').oninput = (e) => { setVolume(+e.target.value); store.update((s) => { s.settings.volume = +e.target.value; }); };
  $('#pp-reset').onclick = () => { if (confirm('Reset all stickers and progress?')) { store.reset(); onReset(); openParentPanel(); } };
  $('#pp-close').onclick = () => { panel.classList.remove('open'); };
  $('#pp-quit').onclick = () => window.close();
}
panel.addEventListener('pointerdown', (e) => e.stopPropagation());

// (No bedtime screen: the parent decides when play ends.)
export function checkSleepy() { return false; }
