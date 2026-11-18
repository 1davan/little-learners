// DOM overlays: fade transitions, the child home button (hold), the parent gate (hold corner 3 s),
// the sticker shelf (with the creation photo strip), the sticker award, and the finale photo (frame + fly to home).
import { store } from './store.js';
import { speech } from './speech.js';
import { setVolume, getVolume, sfx, getMusicVolume, setMusicVolume } from './audio.js';
import { LESSON_LIST, WORLDS } from '../lessons/meta.js';
import { THEMES } from './theme.js';
import { HAND_SVG } from './fx.js';

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
// Each button also shows that level's look for the current world (🌷 🍂 ⛄ / ☀️ 🌅 🌙 / 🌱 🎃 🌈), or for the map.
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
// A big, obvious way back to the world map: the 🗺️ button sits top-left on every world page (where the 🏠 button
// sits inside a game).
const mapBtn = document.createElement('div');
mapBtn.id = 'map-btn';
mapBtn.innerHTML = '<span>🗺️</span>';
mapBtn.addEventListener('pointerdown', (e) => { e.stopPropagation(); mapBtn.classList.add('press'); setTimeout(() => mapBtn.classList.remove('press'), 180); onJump('map'); });
ui.append(mapBtn);
let onPage = () => {};
export function setPageHandler(fn) { onPage = fn; }
arrowL.addEventListener('pointerdown', (e) => { e.stopPropagation(); onPage('right'); });
arrowR.addEventListener('pointerdown', (e) => { e.stopPropagation(); onPage('left'); });
// The dots are buttons too: 🗺️ goes back to the world map, a world's dot jumps straight to that world.
let onJump = () => {};
export function setJumpHandler(fn) { onJump = fn || (() => {}); }
export function renderPages(page) {
  dots.innerHTML = `<span class="map" title="World map">🗺️</span>` + WORLDS.map((w, i) => `<span data-i="${i}" class="${i === page ? 'on' : ''}" title="${w.name}">${w.icon}</span>`).join('');
  dots.querySelectorAll('span').forEach((d) => d.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    onJump(d.classList.contains('map') ? 'map' : +d.dataset.i);
  }));
}

// ---------- sticker shelf (home screen) ----------
// A small row in the top-left corner showing only the stickers this world has earned: one sticker per game,
// with a little "×n" when it has more. Hidden until the first sticker.
const shelf = document.createElement('div');
shelf.id = 'shelf';
ui.appendChild(shelf);
export function renderShelf(lessons = LESSON_LIST.slice(0, 5), newId = null) {
  shelf.innerHTML = '';
  const row = document.createElement('div');
  row.className = 'stickers';
  const photos = document.createElement('div');
  photos.className = 'photos';
  for (const l of lessons) {
    // the photo strip: the latest thing the child made in each game (tap to see it big)
    const url = store.latestCreation(l.id);
    if (url) {
      const ph = document.createElement('div');
      ph.className = 'thumb';
      ph.style.setProperty('--c', l.color);
      ph.style.backgroundImage = `url(${url})`;
      ph.addEventListener('pointerdown', (e) => { e.stopPropagation(); showPhoto(url, { from: ph }); });
      photos.appendChild(ph);
    }
    const n = store.stickers(l.id);
    if (n < 1) continue;
    const s = document.createElement('div');
    s.className = 'slot got' + (newId === l.id ? ' new' : '');
    s.style.setProperty('--c', l.color);
    s.textContent = l.icon;
    if (n > 1) { const b = document.createElement('i'); b.className = 'extra'; b.textContent = '×' + n; s.appendChild(b); }
    s.addEventListener('pointerdown', (e) => { e.stopPropagation(); s.classList.remove('spin'); void s.offsetWidth; s.classList.add('spin'); sfx.note(LESSON_LIST.indexOf(l)); });
    row.appendChild(s);
  }
  if (row.children.length) shelf.appendChild(row);
  if (photos.children.length) shelf.appendChild(photos);
  shelf.classList.toggle('empty', !shelf.children.length);
}

// ---------- creation photos (docs/SATISFACTION.md E3/E4) ----------
const HOME_XY = () => { const v = Math.min(innerWidth, innerHeight) / 100; return { x: 8.7 * v, y: 8.7 * v }; };
// The finale photo: a soft white frame closes in around the view (0.4 s), holds a moment, then the framed picture
// shrinks into the home button (top-left). Resolves when it has landed (~1.3 s).
export function photoFlash(url) {
  return new Promise((resolve) => {
    const el = document.createElement('div');
    el.className = 'snap';
    el.innerHTML = '<div class="flash"></div><div class="frame"></div>';
    ui.appendChild(el);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('on')));
    setTimeout(() => {
      // the picture itself (4:3) takes the frame's place and shrinks into the home button
      el.classList.add('away');
      if (!url) { setTimeout(() => { el.remove(); resolve(); }, 350); return; }
      const card = document.createElement('div');
      card.className = 'card';
      card.style.backgroundImage = `url(${url})`;
      el.appendChild(card);
      const r = card.getBoundingClientRect(), h = HOME_XY();
      const dx = h.x - (r.left + r.width / 2), dy = h.y - (r.top + r.height / 2);
      card.animate([{ transform: 'translate(0,0) scale(1) rotate(0deg)', opacity: 0.4 }, { transform: 'translate(0,0) scale(1) rotate(-2deg)', opacity: 1, offset: 0.2 },
        { transform: `translate(${dx * 0.4}px, ${dy * 0.3}px) scale(.5) rotate(-4deg)`, offset: 0.55 },
        { transform: `translate(${dx}px, ${dy}px) scale(.06) rotate(-8deg)`, opacity: 0.7 }], { duration: 900, easing: 'cubic-bezier(.5,0,.6,1)', fill: 'forwards' });
      setTimeout(() => { el.remove(); resolve(); }, 930);
    }, 800);
  });
}
// Tap a photo frame: the picture grows to the middle of the screen for 3 s (a tap closes it sooner).
// opts.from: an element or {x, y} to grow out of. Resolves when closed.
let viewer = null;
export function showPhoto(url, { from = null, ms = 3000, line = 'You made this!' } = {}) {
  if (!url) return Promise.resolve();
  if (viewer) viewer.close();
  return new Promise((resolve) => {
    const el = document.createElement('div');
    el.className = 'photo-view';
    el.innerHTML = '<div class="pic"></div>';
    const pic = el.querySelector('.pic');
    pic.style.backgroundImage = `url(${url})`;
    let fx0 = innerWidth / 2, fy0 = innerHeight / 2;
    if (from && from.getBoundingClientRect) { const r = from.getBoundingClientRect(); fx0 = r.left + r.width / 2; fy0 = r.top + r.height / 2; }
    else if (from && from.x !== undefined) { fx0 = from.x; fy0 = from.y; }
    ui.appendChild(el);
    const pr = pic.getBoundingClientRect();
    const dx = fx0 - (pr.left + pr.width / 2), dy = fy0 - (pr.top + pr.height / 2);
    pic.animate([{ transform: `translate(${dx}px, ${dy}px) scale(.12) rotate(-6deg)`, opacity: 0.4 }, { transform: 'translate(0,0) scale(1) rotate(-2deg)', opacity: 1 }],
      { duration: 420, easing: 'cubic-bezier(.3,1.3,.5,1)', fill: 'forwards' });
    if (line) speech.say(line);
    let done = false;
    const close = () => {
      if (done) return; done = true;
      if (viewer && viewer.el === el) viewer = null;
      el.classList.add('off');
      pic.animate([{ transform: 'translate(0,0) scale(1) rotate(-2deg)', opacity: 1 }, { transform: `translate(${dx}px, ${dy}px) scale(.12) rotate(-6deg)`, opacity: 0 }],
        { duration: 360, easing: 'cubic-bezier(.5,0,.7,1)', fill: 'forwards' });
      setTimeout(() => { el.remove(); resolve(); }, 380);
    };
    viewer = { el, close };
    el.addEventListener('pointerdown', (e) => { e.stopPropagation(); close(); });
    setTimeout(close, ms);
  });
}
// The new photo, back on the home screen: it flies from the home-button corner onto (x, y) (its frame on the
// pedestal) and shrinks into it. Resolves on arrival (~0.9 s).
export function flyPhoto(url, x, y) {
  return new Promise((resolve) => {
    if (!url) { resolve(); return; }
    const el = document.createElement('div');
    el.className = 'photo-fly';
    el.style.backgroundImage = `url(${url})`;
    ui.appendChild(el);
    const h = HOME_XY();
    const v = Math.min(innerWidth, innerHeight) / 100;
    el.style.left = h.x + 'px'; el.style.top = h.y + 'px';
    const dx = x - h.x, dy = y - h.y;
    el.animate([{ transform: 'translate(-50%,-50%) scale(.2) rotate(-10deg)', opacity: 0 }, { transform: `translate(calc(-50% + ${dx * 0.45}px), calc(-50% + ${dy * 0.25 - 10 * v}px)) scale(1) rotate(-3deg)`, opacity: 1, offset: 0.5 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.38) rotate(0deg)`, opacity: 1 }], { duration: 900, easing: 'cubic-bezier(.4,0,.4,1)', fill: 'forwards' });
    setTimeout(() => { el.remove(); resolve(); }, 900);
  });
}

export function setMode(mode) {
  document.body.dataset.mode = mode === 'home' || mode === 'map' ? mode : 'lesson';
}

// ---------- sticker award ----------
// A clean, short moment: the scene dims a touch, the game's sticker pops in (die-cut look, slight tilt) on a soft glow,
// a few sparkles twinkle once and a shine sweeps across it; ~2.4 s later (or on a tap) it flies off to the top-left
// corner, where the sticker shelf lives on the home screen.
const SPARKS = [[-17, -11, 1.0, 0.35], [16, -14, 0.8, 0.5], [19, 7, 1.0, 0.65], [-18, 10, 0.7, 0.8], [-6, -19, 0.6, 0.95], [8, 18, 0.65, 1.05]];
// opts.quiet: no sounds at all (games that end quietly, e.g. bedtime); opts.sparkle: false skips the sparkle sound
// (the finale plays its own 3-note resolve instead, so nothing stacks).
export function awardSticker(meta, { quiet = false, sparkle = true } = {}) {
  return new Promise((resolve) => {
    const el = document.createElement('div');
    el.className = 'award';
    el.style.setProperty('--c', meta.color);
    el.innerHTML = '<div class="glow"></div><div class="stk-wrap"><div class="sticker"><span>' + meta.icon + '</span><i class="shine"></i></div>' +
      SPARKS.map(([x, y, k, d]) => `<i class="tw" style="--x:${x}vmin;--y:${y}vmin;--k:${k};--d:${d}s"></i>`).join('') + '</div>';
    if (quiet) el.classList.add('quiet');
    ui.appendChild(el);
    if (!quiet && sparkle) sfx.sparkle && sfx.sparkle();
    let done = false;
    const finish = () => {
      if (done) return; done = true;
      el.classList.add('fly');
      if (!quiet) sfx.swoosh();
      // fly into the top-left corner (the sticker shelf on the home screen / the home button in a game)
      const w = el.querySelector('.stk-wrap');
      const r = w.getBoundingClientRect();
      const v = Math.min(innerWidth, innerHeight) / 100;
      const dx = 8 * v - (r.left + r.width / 2), dy = 8 * v - (r.top + r.height / 2);
      w.animate([{ transform: 'translate(0, 0) scale(1)' }, { transform: `translate(${dx * 0.55}px, ${dy * 0.35 - 4 * v}px) scale(.62)`, offset: 0.45 },
        { transform: `translate(${dx}px, ${dy}px) scale(.16)`, opacity: 0.9 }], { duration: 560, easing: 'cubic-bezier(.5,0,.6,1)', fill: 'forwards' });
      setTimeout(() => { el.remove(); resolve(); }, 580);
    };
    el.addEventListener('pointerdown', (e) => { e.stopPropagation(); if (!quiet) sfx.tap(); finish(); });
    setTimeout(finish, 2600);
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
      <p>Current level: <b>Level ${store.level() + 1}</b> (change it with the 1 · 2 · 3 buttons on the home screen).</p><table><tr><th>Game</th><th>Stickers</th><th>Plays</th><th>Recent: level and first-try</th></tr>${rows}</table>${store.parentNotes ? store.parentNotes() : ''}
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

// ---------- 'Go!' badge: it's your turn now ----------
const go = document.createElement('div');
go.id = 'go-badge';
go.innerHTML = '<span class="g">Go!</span><span class="h">' + HAND_SVG + '</span>';
ui.appendChild(go);
let goT = 0;
// side: 'right' (default, under the parent gear), 'left' (under the home button) or 'bottom' (bottom centre), so it never covers a face
export function showGo(side = 'right') {
  clearTimeout(goT);
  go.classList.toggle('left', side === 'left');
  go.classList.toggle('bottom', side === 'bottom');
  go.classList.remove('on'); void go.offsetWidth; go.classList.add('on');
  // silent: the badge is enough (very few sounds)
  goT = setTimeout(() => go.classList.remove('on'), 1300);
}
