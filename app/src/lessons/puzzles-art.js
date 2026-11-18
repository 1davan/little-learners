// Shape puzzles: code-made canvas paint. The three painted board scenes (the face sheet of prop_pz_board1..3, mapped
// flat from board x, y) and the small decals on the pieces. Pale and calm: the colour belongs to the pieces.
import * as T from '../three.js';

export const BW = 2048, BH = 664;               // canvas size; the board face is x -6.8..6.8, y 0.8..5.2
const X0 = -6.8, Y0 = 0.8, SX = 13.6, SY = 4.4;
const px = (x) => ((x - X0) / SX) * BW;
const py = (y) => BH - ((y - Y0) / SY) * BH;
const pu = (d) => (d / SX) * BW;                 // a length in board units -> pixels

// UVs for the face sheet geometry: from the model-space x, y (the board stands at the origin)
export function faceUVs(geom, matrix) {
  if (geom.userData.pzUV) return;
  geom.userData.pzUV = true;
  const p = geom.attributes.position, uv = new Float32Array(p.count * 2), v = new T.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    if (matrix) v.applyMatrix4(matrix);
    uv[i * 2] = (v.x - X0) / SX; uv[i * 2 + 1] = (v.y - Y0) / SY;
  }
  geom.setAttribute('uv', new T.BufferAttribute(uv, 2));
}

function path(c, poly) { c.beginPath(); poly.forEach(([x, y], i) => (i ? c.lineTo(px(x), py(y)) : c.moveTo(px(x), py(y)))); c.closePath(); }
function blob(c, x, y, rx, ry, col) { c.fillStyle = col; c.beginPath(); c.ellipse(px(x), py(y), pu(rx), pu(ry), 0, 0, Math.PI * 2); c.fill(); }
function line(c, pts, w, col, cap = 'round') { c.strokeStyle = col; c.lineWidth = pu(w); c.lineCap = cap; c.lineJoin = 'round'; c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(px(x), py(y)) : c.moveTo(px(x), py(y)))); c.stroke(); }
function rnd(seed) { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); }
// a little offset of a polygon outward by d (vertex normals; the hole outlines are smooth)
function grow(poly, d) {
  const n = poly.length, out = [];
  for (let i = 0; i < n; i++) {
    const a = poly[(i + n - 1) % n], b = poly[i], c = poly[(i + 1) % n];
    let nx = (b[1] - a[1]) + (c[1] - b[1]), ny = -(b[0] - a[0]) - (c[0] - b[0]);
    const l = Math.hypot(nx, ny) || 1;
    out.push([b[0] + (nx / l) * d, b[1] + (ny / l) * d]);
  }
  return out;
}
function polyLen(poly) { let L = 0; for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length]; L += Math.hypot(b[0] - a[0], b[1] - a[1]); } return L; }
function dotted(c, poly, col, step = 0.11, r = 0.022) {
  const P = grow(poly, 0.05), L = polyLen(P), n = Math.max(6, Math.round(L / step));
  c.fillStyle = col;
  let acc = 0, k = 0, want = 0;
  for (let i = 0; i < P.length && k < n; i++) {
    const a = P[i], b = P[(i + 1) % P.length], s = Math.hypot(b[0] - a[0], b[1] - a[1]);
    while (want <= acc + s && k < n) { const t = (want - acc) / (s || 1); c.beginPath(); c.arc(px(a[0] + (b[0] - a[0]) * t), py(a[1] + (b[1] - a[1]) * t), pu(r), 0, Math.PI * 2); c.fill(); k++; want = (k * L) / n; }
    acc += s;
  }
}

// ---------------------------------------------------------------- the three scenes
const SCENES = [
  // Level 1: the sunny garden
  (c, H) => {
    const g = c.createLinearGradient(0, py(5.2), 0, py(2.4));
    g.addColorStop(0, '#bfe6fb'); g.addColorStop(1, '#e4f5fd');
    c.fillStyle = g; c.fillRect(0, 0, BW, py(2.4));
    // soft clouds
    for (const [x, y, s] of [[-3.4, 4.75, 0.5], [2.0, 4.85, 0.42], [5.3, 4.65, 0.36], [-0.2, 4.95, 0.3]]) {
      for (const [dx, dy, r] of [[-0.3, 0, 0.6], [0.15, 0.1, 0.75], [0.55, -0.02, 0.55]]) blob(c, x + dx * s, y + dy * s, r * s * 0.7, r * s * 0.55, 'rgba(255,255,255,0.9)');
    }
    // sun rays round the sun
    const sun = H.sun;
    c.strokeStyle = '#ffe48a'; c.lineCap = 'round'; c.lineWidth = pu(0.07);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2 + 0.13, r0 = 0.74, r1 = 0.95; c.beginPath(); c.moveTo(px(sun.x + Math.cos(a) * r0), py(sun.y + Math.sin(a) * r0)); c.lineTo(px(sun.x + Math.cos(a) * r1), py(sun.y + Math.sin(a) * r1)); c.stroke(); }
    // rolling hills
    c.fillStyle = '#c4ec9e'; c.beginPath(); c.moveTo(0, py(2.4));
    for (let x = -6.8; x <= 6.81; x += 0.1) c.lineTo(px(x), py(3.0 + Math.sin(x * 0.55 + 0.4) * 0.28 + Math.sin(x * 1.3) * 0.08));
    c.lineTo(BW, py(2.4)); c.closePath(); c.fill();
    c.fillStyle = '#ace28a'; c.beginPath(); c.moveTo(0, py(2.4));
    for (let x = -6.8; x <= 6.81; x += 0.1) c.lineTo(px(x), py(2.68 + Math.sin(x * 0.8 + 2.1) * 0.12));
    c.lineTo(BW, py(2.4)); c.closePath(); c.fill();
    // the tree trunk, the bird house post and perch, the kite string and tail, the boat, the ladybird's leaf
    const tr = H.tree; line(c, [[tr.x, tr.y - 0.6], [tr.x, 2.55]], 0.26, '#b98a5c', 'butt');
    line(c, [[tr.x - 0.02, 2.6], [tr.x - 0.25, 2.5]], 0.07, '#b98a5c'); line(c, [[tr.x + 0.02, 2.62], [tr.x + 0.24, 2.5]], 0.07, '#b98a5c');
    const ho = H.house; line(c, [[ho.x, ho.y - 0.5], [ho.x, 2.48]], 0.14, '#c49a6c', 'butt');
    const ki = H.kite; line(c, [[ki.x, ki.y - 0.72], [ki.x + 0.25, 3.2], [ki.x - 0.05, 2.95], [ki.x + 0.2, 2.7], [ki.x + 0.05, 2.5]], 0.025, '#8a7aa8');
    for (const [dx, dy, col] of [[0.18, 3.25, '#ff8fc0'], [0.05, 2.97, '#ffd23f'], [0.15, 2.72, '#7fc8ff']]) {
      c.fillStyle = col; c.beginPath(); const x = ki.x + dx, y = dy;
      c.moveTo(px(x - 0.09), py(y)); c.lineTo(px(x), py(y + 0.06)); c.lineTo(px(x + 0.09), py(y)); c.lineTo(px(x), py(y - 0.06)); c.closePath(); c.fill();
    }
    const sa = H.sail;
    c.fillStyle = '#9fd8f5'; c.fillRect(px(3.6), py(2.62), px(6.6) - px(3.6), py(2.4) - py(2.62));
    c.fillStyle = '#c47a4a'; c.beginPath();
    c.moveTo(px(sa.x - 0.75), py(2.82)); c.lineTo(px(sa.x + 0.75), py(2.82)); c.lineTo(px(sa.x + 0.52), py(2.52)); c.lineTo(px(sa.x - 0.52), py(2.52)); c.closePath(); c.fill();
    line(c, [[sa.x - 0.6, 2.72], [sa.x + 0.6, 2.72]], 0.025, '#ffe1b8');
    const lb = H.ladybird; c.fillStyle = '#7fcf6a'; c.beginPath();
    c.ellipse(px(lb.x + 0.1), py(lb.y - 0.08), pu(0.9), pu(0.55), -0.25, 0, Math.PI * 2); c.fill();
    line(c, [[lb.x - 0.75, lb.y + 0.12], [lb.x + 0.95, lb.y - 0.3]], 0.03, '#5fae55');
    // flowers along the grass
    const r = rnd(11);
    for (let i = 0; i < 26; i++) {
      const x = -6.4 + r() * 12.8, y = 2.5 + r() * 0.35;
      if (Object.values(H).some((h) => Math.abs(h.x - x) < h.sx * 0.65 && Math.abs(h.y - y) < h.sy * 0.65 + 0.1)) continue;
      const col = ['#ff8fc0', '#ffffff', '#ffd23f', '#c9a8ff'][i % 4];
      for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; blob(c, x + Math.cos(a) * 0.045, y + Math.sin(a) * 0.045, 0.035, 0.035, col); }
      blob(c, x, y, 0.025, 0.025, '#ffb43d');
    }
  },
  // Level 2: the rocket night
  (c, H) => {
    const g = c.createLinearGradient(0, py(5.2), 0, py(2.4));
    g.addColorStop(0, '#26306e'); g.addColorStop(1, '#3a4790');
    c.fillStyle = g; c.fillRect(0, 0, BW, py(2.4));
    const r = rnd(5);
    for (let i = 0; i < 140; i++) {
      const x = -6.6 + r() * 13.2, y = 2.5 + r() * 2.55, s = 0.012 + r() * 0.022;
      blob(c, x, y, s, s, `rgba(255,248,210,${0.45 + r() * 0.5})`);
    }
    // a soft glow round the moon and the Earth, the planet's ring, rocket flames, the flag pole, the satellite's arm
    const mo = H.moon, ea = H.earth, pl = H.planet, bo = H.body, fl = H.flag, sat = H.satellite, pa = H.panel;
    for (const [h, col] of [[mo, 'rgba(255,240,190,0.18)'], [ea, 'rgba(140,200,255,0.16)']]) blob(c, h.x, h.y, h.sx * 0.78, h.sx * 0.78, col);
    c.strokeStyle = '#c9a8ff'; c.lineWidth = pu(0.07); c.beginPath(); c.ellipse(px(pl.x), py(pl.y), pu(0.98), pu(0.26), -0.25, 0, Math.PI * 2); c.stroke();
    c.fillStyle = '#ffb43d'; c.beginPath();
    c.moveTo(px(bo.x - 0.42), py(bo.y - 0.68)); c.quadraticCurveTo(px(bo.x - 0.3), py(2.6), px(bo.x), py(2.45));
    c.quadraticCurveTo(px(bo.x + 0.3), py(2.6), px(bo.x + 0.42), py(bo.y - 0.68)); c.closePath(); c.fill();
    c.fillStyle = '#ffe48a'; c.beginPath();
    c.moveTo(px(bo.x - 0.22), py(bo.y - 0.68)); c.quadraticCurveTo(px(bo.x - 0.12), py(2.7), px(bo.x), py(2.6));
    c.quadraticCurveTo(px(bo.x + 0.12), py(2.7), px(bo.x + 0.22), py(bo.y - 0.68)); c.closePath(); c.fill();
    for (const s of [-1, 1]) { c.fillStyle = '#ff7a6a'; c.beginPath(); c.moveTo(px(bo.x + s * 0.58), py(bo.y - 0.1)); c.lineTo(px(bo.x + s * 0.9), py(bo.y - 0.7)); c.lineTo(px(bo.x + s * 0.58), py(bo.y - 0.62)); c.closePath(); c.fill(); }
    line(c, [[fl.x - 0.52, fl.y + 0.56], [fl.x - 0.52, 2.45]], 0.07, '#d8d0e8', 'butt');
    blob(c, fl.x - 0.52, fl.y + 0.6, 0.06, 0.06, '#ffd23f');
    line(c, [[sat.x + 0.45, sat.y], [pa.x - 0.65, pa.y]], 0.07, '#b8c0d8', 'butt');
    line(c, [[sat.x, sat.y + 0.45], [sat.x, sat.y + 0.72]], 0.03, '#b8c0d8'); blob(c, sat.x, sat.y + 0.75, 0.05, 0.05, '#ff7a6a');
    // a low line of hills for the ground
    c.fillStyle = '#2f3a7a'; c.beginPath(); c.moveTo(0, py(2.4));
    for (let x = -6.8; x <= 6.81; x += 0.1) c.lineTo(px(x), py(2.62 + Math.sin(x * 0.7 + 1) * 0.08));
    c.lineTo(BW, py(2.4)); c.closePath(); c.fill();
  },
  // Level 3: the robot's party
  (c, H) => {
    c.fillStyle = '#fff4dc'; c.fillRect(0, 0, BW, py(2.4));
    // bunting along the top
    const cols = ['#ff8fc0', '#ffd23f', '#7fc8ff', '#7fd36e', '#c9a8ff', '#ff9f6a'];
    for (const [a, b, sag] of [[-6.6, -2.2, 0.25], [-2.2, 2.4, 0.28], [2.4, 6.6, 0.25]]) {
      const pts = []; for (let i = 0; i <= 20; i++) { const t = i / 20; pts.push([a + (b - a) * t, 5.0 - Math.sin(t * Math.PI) * sag]); }
      line(c, pts, 0.02, '#c8a080');
      for (let i = 1; i < 8; i++) {
        const t = i / 8, x = a + (b - a) * t, y = 5.0 - Math.sin(t * Math.PI) * sag;
        if (Object.values(H).some((h) => Math.abs(h.x - x) < h.sx * 0.6 + 0.12 && Math.abs(h.y - y) < h.sy * 0.6 + 0.2)) continue;
        c.fillStyle = cols[(i + Math.round(a)) % cols.length]; c.beginPath();
        c.moveTo(px(x - 0.13), py(y)); c.lineTo(px(x + 0.13), py(y)); c.lineTo(px(x), py(y - 0.24)); c.closePath(); c.fill();
      }
    }
    // confetti dots
    const r = rnd(9);
    for (let i = 0; i < 70; i++) {
      const x = -6.5 + r() * 13, y = 2.5 + r() * 2.2;
      if (Object.values(H).some((h) => Math.abs(h.x - x) < h.sx * 0.62 + 0.05 && Math.abs(h.y - y) < h.sy * 0.62 + 0.05)) continue;
      blob(c, x, y, 0.03, 0.03, cols[i % cols.length]);
    }
    // the robot's neck, arms, legs; the balloon string to its hand; the wagon's wheels and handle; a table line
    const he = H.head, bo = H.body, ht = H.heart, wa = H.wagon;
    line(c, [[bo.x - 0.7, bo.y + 0.1], [bo.x - 1.05, bo.y - 0.25], [bo.x - 1.0, bo.y - 0.5]], 0.09, '#8fa8b8');
    line(c, [[bo.x + 0.7, bo.y + 0.15], [bo.x + 1.05, bo.y + 0.45], [bo.x + 1.18, bo.y + 0.78]], 0.09, '#8fa8b8');
    blob(c, bo.x + 1.2, bo.y + 0.83, 0.1, 0.1, '#8fa8b8');
    line(c, [[ht.x, ht.y - 0.5], [ht.x - 0.25, ht.y - 1.0], [bo.x + 1.2, bo.y + 0.86]], 0.025, '#b88a6a');
    for (const s of [-1, 1]) line(c, [[he.x + s * 0.53, he.y + 0.1], [he.x + s * 0.75, he.y + 0.1]], 0.05, '#8fa8b8');
    for (const dx of [-0.45, 0.45]) { blob(c, wa.x + dx, wa.y - 0.48, 0.19, 0.19, '#7a6a8a'); blob(c, wa.x + dx, wa.y - 0.48, 0.07, 0.07, '#ffd23f'); }
    line(c, [[wa.x + 0.76, wa.y + 0.05], [wa.x + 1.05, wa.y + 0.35]], 0.05, '#7a6a8a');
    c.fillStyle = '#f6dfba'; c.fillRect(0, py(2.55), BW, py(2.4) - py(2.55));
  },
];

const FLOOR = '#eac796';
// The board's painted face: the scene, wood for the skirt band, and a dotted outline round every hole not yet filled.
// Returns { tex, draw(filled) } - call draw(set of filled hole ids) again after each fit (the dots of that hole go).
export function boardTexture(level, holes) {
  const cv = document.createElement('canvas'); cv.width = BW; cv.height = BH;
  const c = cv.getContext('2d');
  const tex = new T.CanvasTexture(cv);
  tex.colorSpace = T.SRGBColorSpace;
  tex.anisotropy = 4;
  const H = Object.fromEntries(holes.map((h) => [h.id, h]));
  const dotCol = ['rgba(60,90,70,0.32)', 'rgba(230,235,255,0.42)', 'rgba(150,100,80,0.3)'][level];
  const draw = (filled = new Set()) => {
    c.fillStyle = FLOOR; c.fillRect(0, 0, BW, BH);
    // the skirt band: plain wood with a soft grain
    const r = rnd(3);
    c.strokeStyle = 'rgba(190,140,90,0.18)'; c.lineWidth = 2;
    for (let i = 0; i < 26; i++) { const y = py(0.85 + r() * 1.5); c.beginPath(); c.moveTo(0, y); for (let x = 0; x <= BW; x += 64) c.lineTo(x, y + Math.sin(x * 0.004 + i) * 3); c.stroke(); }
    SCENES[level](c, H);
    for (const h of holes) if (!filled.has(h.id)) dotted(c, h.poly, dotCol);
    tex.needsUpdate = true;
  };
  draw();
  return { tex, draw };
}

// ---------------------------------------------------------------- piece decals
// A transparent canvas texture for the front of a piece. unit: the piece's unit outline [[x, y]...] (from the layout),
// size [w, h]. Returns { tex, w, h, cx, cy } (plane size and centre in the piece's own units) or null for a plain piece.
const DECALS = {
  crate: (c, W, H) => { c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = W * 0.06; c.strokeRect(W * 0.2, H * 0.2, W * 0.6, H * 0.6); c.beginPath(); c.moveTo(W * 0.2, H * 0.2); c.lineTo(W * 0.8, H * 0.8); c.moveTo(W * 0.8, H * 0.2); c.lineTo(W * 0.2, H * 0.8); c.stroke(); },
  tent: (c, W, H) => { c.fillStyle = 'rgba(150,60,10,0.55)'; c.beginPath(); c.moveTo(W * 0.5, H * 0.38); c.lineTo(W * 0.66, H * 0.84); c.lineTo(W * 0.34, H * 0.84); c.closePath(); c.fill(); c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = W * 0.025; c.beginPath(); c.moveTo(W * 0.5, H * 0.18); c.lineTo(W * 0.5, H * 0.38); c.stroke(); },
  tree: (c, W, H) => { for (const [x, y, r] of [[0.35, 0.36, 0.13], [0.62, 0.3, 0.12], [0.5, 0.58, 0.15], [0.3, 0.62, 0.1], [0.7, 0.6, 0.11]]) { c.fillStyle = 'rgba(160,230,120,0.75)'; c.beginPath(); c.arc(W * x, H * y, W * r, 0, 7); c.fill(); } for (const [x, y] of [[0.42, 0.45], [0.66, 0.44], [0.55, 0.72]]) { c.fillStyle = '#ff5a5a'; c.beginPath(); c.arc(W * x, H * y, W * 0.045, 0, 7); c.fill(); } },
  house: (c, W, H) => { c.fillStyle = '#5a3a2a'; c.beginPath(); c.arc(W * 0.5, H * 0.46, W * 0.16, 0, 7); c.fill(); c.fillStyle = '#c49a6c'; c.fillRect(W * 0.42, H * 0.7, W * 0.16, H * 0.06); },
  roof: (c, W, H) => { c.strokeStyle = 'rgba(255,255,255,0.45)'; c.lineWidth = W * 0.022; for (const y of [0.55, 0.75]) { c.beginPath(); for (let x = 0.1; x < 0.92; x += 0.12) c.arc(W * (x + 0.06), H * y, W * 0.06, 0, Math.PI); c.stroke(); } },
  ladybird: (c, W, H) => { c.fillStyle = '#3a2838'; c.fillRect(W * 0.485, H * 0.12, W * 0.03, H * 0.76); for (const [x, y, r] of [[0.32, 0.36, 0.08], [0.68, 0.36, 0.08], [0.3, 0.64, 0.065], [0.7, 0.64, 0.065], [0.5, 0.82, 0.05]]) { c.beginPath(); c.arc(W * x, H * y, W * r, 0, 7); c.fill(); } },
  kite: (c, W, H) => { c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = W * 0.035; c.beginPath(); c.moveTo(W * 0.15, H * 0.15); c.lineTo(W * 0.85, H * 0.85); c.moveTo(W * 0.85, H * 0.15); c.lineTo(W * 0.15, H * 0.85); c.stroke(); c.fillStyle = 'rgba(255,220,120,0.65)'; c.beginPath(); c.moveTo(W * 0.5, H * 0.5); c.lineTo(W * 0.85, H * 0.15); c.lineTo(W * 0.85, H * 0.5); c.closePath(); c.fill(); },
  sail: (c, W, H) => { c.fillStyle = '#ff5a5a'; c.fillRect(0, H * 0.48, W, H * 0.16); },
  ball: (c, W, H) => { const cols = ['#ff5a5a', '#ffffff', '#4a90ff', '#ffffff', '#ffd23f', '#ffffff']; for (let i = 0; i < 6; i++) { c.fillStyle = cols[i]; c.beginPath(); c.moveTo(W / 2, H / 2); c.arc(W / 2, H / 2, W, (i / 6) * Math.PI * 2 - 0.3, ((i + 1) / 6) * Math.PI * 2 - 0.3); c.closePath(); c.fill(); } c.fillStyle = '#ffffff'; c.beginPath(); c.arc(W / 2, H / 2, W * 0.08, 0, 7); c.fill(); },
  moon: (c, W, H) => { for (const [x, y, r] of [[0.26, 0.3, 0.06], [0.72, 0.7, 0.07], [0.78, 0.32, 0.04]]) { c.fillStyle = 'rgba(220,200,140,0.45)'; c.beginPath(); c.arc(W * x, H * y, W * r, 0, 7); c.fill(); } },
  rocket: (c, W, H) => { c.fillStyle = '#ff6a5a'; c.fillRect(0, H * 0.82, W, H * 0.12); c.fillStyle = '#ffffff'; c.beginPath(); c.arc(W * 0.5, H * 0.4, W * 0.22, 0, 7); c.fill(); c.fillStyle = '#7fc8ff'; c.beginPath(); c.arc(W * 0.5, H * 0.4, W * 0.16, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,0.8)'; c.beginPath(); c.arc(W * 0.45, H * 0.35, W * 0.045, 0, 7); c.fill(); },
  earth: (c, W, H) => { c.fillStyle = '#5fd068'; for (const [x, y, rx, ry, a] of [[0.36, 0.34, 0.2, 0.13, 0.4], [0.64, 0.62, 0.17, 0.2, -0.3], [0.3, 0.7, 0.09, 0.07, 0], [0.72, 0.28, 0.07, 0.05, 0.3]]) { c.beginPath(); c.ellipse(W * x, H * y, W * rx, H * ry, a, 0, 7); c.fill(); } },
  satellite: (c, W, H) => { c.strokeStyle = 'rgba(90,100,130,0.5)'; c.lineWidth = W * 0.03; c.strokeRect(W * 0.22, H * 0.22, W * 0.56, H * 0.56); c.fillStyle = '#ff7a6a'; c.beginPath(); c.arc(W * 0.5, H * 0.5, W * 0.1, 0, 7); c.fill(); },
  panel: (c, W, H) => { c.strokeStyle = 'rgba(255,255,255,0.65)'; c.lineWidth = H * 0.05; for (const x of [0.25, 0.5, 0.75]) { c.beginPath(); c.moveTo(W * x, H * 0.12); c.lineTo(W * x, H * 0.88); c.stroke(); } c.beginPath(); c.moveTo(W * 0.08, H * 0.5); c.lineTo(W * 0.92, H * 0.5); c.stroke(); },
  robot: (c, W, H) => { c.fillStyle = 'rgba(255,255,255,0.6)'; for (const [x, y] of [[0.18, 0.18], [0.82, 0.18], [0.18, 0.82], [0.82, 0.82]]) { c.beginPath(); c.arc(W * x, H * y, W * 0.04, 0, 7); c.fill(); } },
  buttons: (c, W, H) => { const cols = ['#ff5a5a', '#ffd23f', '#4a90ff']; cols.forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.arc(W * (0.3 + i * 0.2), H * 0.45, H * 0.11, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,0.6)'; c.beginPath(); c.arc(W * (0.3 + i * 0.2) - H * 0.03, H * 0.42, H * 0.03, 0, 7); c.fill(); }); c.fillStyle = 'rgba(255,255,255,0.55)'; c.fillRect(W * 0.25, H * 0.7, W * 0.5, H * 0.07); },
  hat: (c, W, H) => { const cols = ['#ff8fc0', '#7fc8ff', '#7fd36e']; for (let i = 0; i < 9; i++) { c.fillStyle = cols[i % 3]; c.beginPath(); c.arc(W * (0.2 + (i % 3) * 0.3), H * (0.85 - Math.floor(i / 3) * 0.22), W * 0.05, 0, 7); c.fill(); } },
  bow: (c, W, H) => { c.fillStyle = '#ffd23f'; c.fillRect(W * 0.44, 0, W * 0.12, H); c.fillRect(0, H * 0.44, W, H * 0.12); c.beginPath(); c.ellipse(W * 0.36, H * 0.38, W * 0.14, H * 0.09, -0.5, 0, 7); c.ellipse(W * 0.64, H * 0.38, W * 0.14, H * 0.09, 0.5, 0, 7); c.fill(); c.fillStyle = '#f0b81a'; c.beginPath(); c.arc(W * 0.5, H * 0.44, W * 0.07, 0, 7); c.fill(); },
};
export function pieceDecal(deco, unit, size) {
  const fn = DECALS[deco];
  if (!fn) return null;
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const [x, y] of unit) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const w = (x1 - x0) * size[0], h = (y1 - y0) * size[1];
  const res = 256, W = Math.round(res * Math.min(1, w / h) * (w > h ? 1 : 1)), Hh = Math.round(res * Math.min(1, h / w));
  const cv = document.createElement('canvas'); cv.width = Math.max(64, W); cv.height = Math.max(64, Hh);
  const c = cv.getContext('2d'), CW = cv.width, CH = cv.height;
  // clip to the piece's flat front (the outline pulled in past the bevel)
  const inset = 0.07, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  c.save(); c.beginPath();
  unit.forEach(([x, y], i) => {
    const X = x * size[0], Y = y * size[1];
    const kx = Math.max(0, 1 - inset / (w / 2)), ky = Math.max(0, 1 - inset / (h / 2));
    const u = ((X - cx * size[0]) * kx + w / 2) / w * CW, v = (1 - ((Y - cy * size[1]) * ky + h / 2) / h) * CH;
    i ? c.lineTo(u, v) : c.moveTo(u, v);
  });
  c.closePath(); c.clip();
  fn(c, CW, CH);
  c.restore();
  const tex = new T.CanvasTexture(cv); tex.colorSpace = T.SRGBColorSpace;
  return { tex, w, h, cx: cx * size[0], cy: cy * size[1] };
}
