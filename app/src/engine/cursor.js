// The on-screen hand cursor. Follows the mouse (always visible) or appears under a finger on touch.
// Pressing squishes the hand and throws out a ring of coloured stars; dragging closes it into a grab.
const INK = '#2a2440';
const glove = (curled) => `
<svg viewBox="0 0 100 124" xmlns="http://www.w3.org/2000/svg">
  <g stroke="${INK}" stroke-width="5" stroke-linejoin="round" fill="#fffdf7">
    ${curled ? '<rect x="27" y="36" width="20" height="28" rx="10"/>' : '<rect x="27" y="3" width="20" height="58" rx="10"/>'}
    <rect x="46" y="38" width="15" height="26" rx="7.5"/>
    <rect x="59" y="43" width="14" height="24" rx="7"/>
    <rect x="70" y="50" width="12" height="22" rx="6"/>
    <ellipse cx="21" cy="72" rx="10" ry="17" transform="rotate(-32 21 72)"/>
    <rect x="21" y="48" width="60" height="50" rx="22"/>
    <rect x="26" y="92" width="50" height="20" rx="7" fill="#ffd23f"/>
  </g>
  <path d="M34 72 q8 7 16 0" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round" opacity=".55"/>
  <ellipse cx="62" cy="64" rx="6" ry="3.5" fill="#ff9eb5" opacity=".7"/>
</svg>`;

const COLS = ['#ff5a5a', '#ffd23f', '#4a90ff', '#5fd068', '#ff8fc0', '#a77bff'];
let el, point, grab, fxLayer, x = -200, y = -200, down = false, grabbing = false, touchHideT = 0, isMouse = false;

function place() { el.style.transform = `translate(${x}px, ${y}px)`; }

function burst(bx, by) {
  const b = document.createElement('div');
  b.className = 'cur-burst';
  b.style.left = bx + 'px'; b.style.top = by + 'px';
  const n = 6, rot = Math.random() * 60;
  for (let i = 0; i < n; i++) {
    const s = document.createElement('i');
    s.textContent = i % 2 ? '★' : '●';
    s.style.color = COLS[(i + Math.floor(Math.random() * 6)) % COLS.length];
    s.style.setProperty('--a', rot + (i * 360) / n + 'deg');
    s.style.setProperty('--d', 5 + Math.random() * 2.5 + 'vmin');
    b.appendChild(s);
  }
  const ring = document.createElement('b');
  b.appendChild(ring);
  fxLayer.appendChild(b);
  setTimeout(() => b.remove(), 700);
}

function onMove(e) {
  isMouse = e.pointerType === 'mouse';
  x = e.clientX; y = e.clientY; place();
  if (isMouse) el.classList.add('show');
}
function onDown(e) {
  isMouse = e.pointerType === 'mouse';
  x = e.clientX; y = e.clientY; place();
  down = true;
  clearTimeout(touchHideT);
  el.classList.add('show', 'down');
  el.classList.remove('pop');
  void el.offsetWidth; // restart the squish animation
  el.classList.add('pop');
  burst(x, y);
}
function onUp() {
  down = false;
  el.classList.remove('down');
  cursor.setGrab(false);
  if (!isMouse) touchHideT = setTimeout(() => el.classList.remove('show'), 650);
}

export const cursor = {
  init() {
    fxLayer = document.getElementById('fx');
    el = document.createElement('div');
    el.id = 'cursor';
    el.innerHTML = `<div class="cur-body"><div class="cur-point">${glove(false)}</div><div class="cur-grab">${glove(true)}</div></div>`;
    document.body.appendChild(el);
    window.addEventListener('pointermove', onMove, { capture: true, passive: true });
    window.addEventListener('pointerdown', onDown, { capture: true, passive: true });
    window.addEventListener('pointerup', onUp, { capture: true, passive: true });
    window.addEventListener('pointercancel', onUp, { capture: true, passive: true });
    document.addEventListener('mouseleave', () => el.classList.remove('show'));
  },
  setGrab(on) { if (!el || on === grabbing) return; grabbing = on; el.classList.toggle('grab', on); },
  setOver(on) { if (el) el.classList.toggle('over', !!on && !down); },
};
