// My day: the cosy house — a bathroom (left) and the bunny's bedroom (right) side by side like a doll's house, split by
// a little wall. Every object is a Blender prop (tools/blender/creatures/prop_myday.py + shared room props); walls,
// floors and the views out of the windows are painted canvases. Level 1 is a sunny day, Level 2 an early morning
// (pink dawn, sun coming up), Level 3 the evening (dusk, a moon, a glowing lamp).
import * as T from '../three.js';
import { mesh, geo, toon, toonUnique, basic, blobShadow } from '../engine/toon.js';
import { propModel, propAnchor } from '../engine/prop-models.js';
import { scMesh, scProp } from '../engine/scenery.js';
import { makeAnimal } from '../engine/actors.js';

export const WALL_Z = -4.6;
export const PART_X = 0.6;                        // the little wall between the rooms
export const CAMS = {
  bath: { pos: new T.Vector3(-5.4, 3.7, 12.8), look: new T.Vector3(-5.4, 2.65, 0) },
  bed: { pos: new T.Vector3(7.2, 3.7, 12.8), look: new T.Vector3(7.2, 2.65, 0) },
};
export const SINK = new T.Vector3(-4.3, 0, -1.0);
export const BATH = new T.Vector3(-10.6, 0, -1.9);
export const BED = new T.Vector3(7.4, 0, -2.2);
export const STOOL_TOP = 0.94;
export const SPOTS = {
  sink: new T.Vector3(-4.3, STOOL_TOP, -2.1),      // on the step stool behind the basin
  bath: new T.Vector3(-10.4, 0.05, -1.9),         // sitting in the bath (feet hidden by the tub)
  mat: new T.Vector3(-7.3, 0, -1.2),              // on the bath mat, out of the bath
  bathDoor: new T.Vector3(-1.2, 0, 0.6),          // by the doorway, bathroom side
  bedDoor: new T.Vector3(2.0, 0, 0.6),            // by the doorway, bedroom side
  rug: new T.Vector3(9.9, 0, -0.1),               // on the bedroom rug
  bedside: new T.Vector3(4.0, 0, -0.4),           // beside the bed, ready to climb in
};
const DAY = ['day', 'dawn', 'dusk'];

function canvasTex(w, h, draw, rx = 1, ry = 1) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new T.CanvasTexture(c);
  t.colorSpace = T.SRGBColorSpace;
  t.wrapS = t.wrapT = T.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.anisotropy = 4;
  return t;
}
const flat = (map, extra = {}) => new T.MeshBasicMaterial({ map, fog: false, ...extra });
const lit = (map) => toonUnique(0xffffff, { map });
function plane(w, h, mat, x, y, z) { const m = new T.Mesh(new T.PlaneGeometry(w, h), mat); m.position.set(x, y, z); return m; }

// ---------------- canvases ----------------
function tiles() {
  return canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#cfeef3'; g.fillRect(0, 0, w, h);
    const t = w / 2;
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      g.fillStyle = (i + j) % 2 ? '#e9fbfd' : '#bfe7ef';
      g.beginPath(); g.roundRect(i * t + 4, j * t + 4, t - 8, t - 8, 10); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.roundRect(i * t + 10, j * t + 10, 14, 6, 3); g.fill();
    }
  }, 26, 4);
}
function bathPaper() {
  return canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#e8f7ff'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#d2ecfb'; g.lineWidth = 3;
    for (const [x, y, r] of [[30, 34, 9], [96, 92, 7], [92, 30, 4], [26, 100, 5]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke(); }
    g.fillStyle = '#ffffff';
    for (const [x, y] of [[27, 31], [94, 89]]) { g.beginPath(); g.arc(x, y, 2, 0, Math.PI * 2); g.fill(); }
  }, 9, 4);
}
function bedPaper() {
  return canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#fff3d9'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ffe6b8'; g.fillRect(0, 0, w / 2, h);
    g.fillStyle = '#ffd27a';
    const star = (cx, cy, r) => { g.beginPath(); for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2, rr = i % 2 ? r * 0.45 : r; g.lineTo(cx + Math.sin(a) * rr, cy - Math.cos(a) * rr); } g.fill(); };
    star(32, 30, 11); star(96, 94, 11);
    g.fillStyle = '#ffffff';
    for (const [x, y] of [[96, 28], [32, 96]]) { g.beginPath(); g.arc(x, y, 4, 0, Math.PI * 2); g.fill(); }
  }, 8, 4);
}
function floorTiles() {
  return canvasTex(128, 128, (g, w, h) => {
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.fillStyle = (i + j) % 2 ? '#fff6ea' : '#ffd9c4'; g.fillRect(i * 32, j * 32, 32, 32); }
  }, 8, 6);
}
function planks() {
  return canvasTex(256, 256, (g, w, h) => {
    const cols = ['#f1c58c', '#ecbd82', '#f4cb95', '#e9b97c'];
    for (let i = 0; i < 8; i++) {
      g.fillStyle = cols[i % 4]; g.fillRect(0, i * 32, w, 32);
      g.fillStyle = '#d59f62'; g.fillRect(0, i * 32, w, 3);
      g.fillRect(((i * 97) % 200) + 20, i * 32, 3, 32);
    }
  }, 4, 4);
}
function rugTex(cols) {
  return canvasTex(256, 256, (g) => {
    cols.forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.arc(128, 128, 126 - i * 20, 0, Math.PI * 2); g.fill(); });
    g.fillStyle = '#ffffff';
    for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; g.beginPath(); g.arc(128 + Math.cos(a) * 116, 128 + Math.sin(a) * 116, 4, 0, Math.PI * 2); g.fill(); }
  });
}
// the view out of a window: sky + hills, the sun up (day), coming up pink (dawn) or a moon and stars (dusk)
export function viewTex(kind) {
  return canvasTex(256, 180, (g, w, h) => {
    const sky = { day: ['#7cc8ff', '#d4f0ff'], dawn: ['#ffb2c8', '#ffe2a8'], dusk: ['#2b2f6b', '#7a5aa8'] }[kind];
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, sky[0]); gr.addColorStop(1, sky[1]); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    if (kind === 'day') { g.fillStyle = '#fff3a0'; g.beginPath(); g.arc(190, 52, 26, 0, Math.PI * 2); g.fill(); }
    if (kind === 'dawn') { g.fillStyle = '#ffd36b'; g.beginPath(); g.arc(150, 150, 34, 0, Math.PI * 2); g.fill(); }
    if (kind === 'dusk') {
      g.fillStyle = '#fff4c4'; g.beginPath(); g.arc(70, 50, 22, 0, Math.PI * 2); g.fill();
      g.fillStyle = sky[0]; g.beginPath(); g.arc(80, 44, 20, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#fff6c8';
      for (const [x, y] of [[150, 30], [200, 60], [120, 80], [230, 24], [30, 100]]) { g.beginPath(); g.arc(x, y, 2.5, 0, Math.PI * 2); g.fill(); }
    }
    if (kind !== 'dusk') { g.fillStyle = '#ffffff'; for (const [x, y] of [[60, 50], [84, 44], [104, 52]]) { g.beginPath(); g.arc(x, y, 16, 0, Math.PI * 2); g.fill(); } }
    const hill = (cx, cy, rx, ry, c) => { g.fillStyle = c; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); g.fill(); };
    const k = kind === 'dusk' ? ['#3d5a6e', '#4f6f7a'] : ['#7ac25a', '#9bd46e'];
    hill(60, h + 20, 160, 70, k[0]); hill(220, h + 30, 170, 80, k[1]);
  });
}

// ---------------- the house ----------------
export function makeHouse(level) {
  const g = new T.Group();
  const day = DAY[level] || 'day';
  // floors
  const bf = new T.Mesh(new T.PlaneGeometry(PART_X + 18, 22), lit(floorTiles()));
  bf.rotation.x = -Math.PI / 2; bf.position.set((PART_X - 18) / 2, 0, WALL_Z + 11); g.add(bf);
  const rf = new T.Mesh(new T.PlaneGeometry(18 - PART_X, 22), lit(planks()));
  rf.rotation.x = -Math.PI / 2; rf.position.set((PART_X + 18) / 2, 0, WALL_Z + 11); g.add(rf);
  // back walls: tiles below a white rail in the bathroom, starry wallpaper in the bedroom
  const W0 = -18, W1 = 18, H = 16;
  g.add(plane(PART_X - W0, 2.6, lit(tiles()), (W0 + PART_X) / 2, 1.3, WALL_Z));
  g.add(plane(PART_X - W0, H - 2.6, lit(bathPaper()), (W0 + PART_X) / 2, 2.6 + (H - 2.6) / 2, WALL_Z));
  g.add(plane(W1 - PART_X, H, lit(bedPaper()), (W1 + PART_X) / 2, H / 2, WALL_Z));
  const trim = (w, h, d, col, x, y, z) => { const m = mesh(geo.box(w, h, d), col, { hull: 1.03, outline: 0 }); m.position.set(x, y, z); g.add(m); return m; };
  trim(PART_X - W0, 0.16, 0.14, 0xffffff, (W0 + PART_X) / 2, 2.62, WALL_Z + 0.07);          // tile rail
  trim(W1 - PART_X, 0.4, 0.16, 0xffffff, (W1 + PART_X) / 2, 0.2, WALL_Z + 0.08);             // skirting
  // the little wall between the rooms (a doll's-house cut: we see its end)
  const part = new T.Group();
  const pw = mesh(geo.box(0.5, H, 2.6), 0xfff6ec, { hull: 0, outline: 0 }); pw.position.set(0, H / 2, -1.3); part.add(pw);
  const cap = mesh(geo.box(0.62, H, 0.16), 0xffffff, { hull: 1.03, outline: 0 }); cap.position.set(0, H / 2, 0.02); part.add(cap);
  part.position.set(PART_X, 0, WALL_Z + 2.6);
  g.add(part);

  // ---- bathroom ----
  const win = (x, y, kind) => {
    const v = plane(3.0, 2.1, flat(viewTex(kind)), x, y, WALL_Z + 0.02);
    g.add(v);
    const fr = scMesh('prop_window', 'prop_window', { ink: 0.022 });
    if (fr) { fr.position.set(x, y, WALL_Z); g.add(fr); }
    return v;
  };
  const bathWin = win(-10.6, 5.6, day);
  const bathMat = new T.Mesh(new T.CircleGeometry(1.2, 40), flat(rugTex(['#7fd0ff', '#ffffff', '#7fd0ff', '#ffffff', '#ffd23f'])));
  bathMat.rotation.x = -Math.PI / 2; bathMat.scale.set(1.6, 0.8, 1); bathMat.position.set(-8.5, 0.015, -0.45); g.add(bathMat);
  const shelf = scProp('prop_shelf', { toys: false }, { ink: 0.022 });
  if (shelf) { shelf.position.set(-4.3, 5.9, WALL_Z + 0.25); g.add(shelf); }
  const duckS = propModel('prop_duckie', { size: 0.42 });
  if (duckS) { duckS.position.set(-5.0, 5.97, WALL_Z + 0.3); duckS.rotation.y = 0.5; g.add(duckS); }
  for (const [x, col, s] of [[-4.15, 0x9be6c8, 0.42], [-3.55, 0xffb6d5, 0.36]]) {
    const b = propModel('prop_md_bottle', { tint: col, size: s }); if (b) { b.position.set(x, 5.97, WALL_Z + 0.35); g.add(b); }
  }
  const plant = scProp('prop_plant', { leaves: { ink: 0.016 } }, { ink: 0.02 });
  if (plant) { plant.position.set(-13.3, 0, -3.4); g.add(plant); }
  const frame = scProp('prop_frame', { canvas: { tint: 0xbfe8ff, ink: 0 }, art: { ink: 0.012 } }, { ink: 0.02 });
  if (frame) { frame.position.set(-1.6, 5.4, WALL_Z); g.add(frame); }

  const sink = propModel('prop_md_sink'); sink.position.copy(SINK); g.add(sink);
  const stool = propModel('prop_md_stool', { size: [1.15, 1.85, 1.0] }); stool.position.set(SINK.x, 0, -2.1); g.add(stool);
  const bath = propModel('prop_md_bath'); bath.position.copy(BATH); g.add(bath);
  const cab = propModel('prop_md_table'); cab.position.set(-1.6, 0, -3.1); g.add(cab);
  const bin = propModel('prop_md_bin', { tint: 0x7fd8b0 }); bin.position.set(-0.4, 0, -1.3); g.add(bin);
  const lid = propModel('prop_md_binlid', { tint: 0x7fd8b0 }); lid.position.set(-0.4, 0.95, -1.3 - 0.52); bin.userData.lid = lid; g.add(lid);
  const sh = blobShadow(1.5); sh.position.set(SINK.x, 0.02, SINK.z); g.add(sh);

  // ---- bedroom ----
  const bedWin = win(BED.x, 5.6, day);
  const drapes = [];
  for (const s of [-1, 1]) {
    const d = propModel('prop_md_drape', { tint: 0x9fd0ff });
    d.position.set(BED.x + s * 1.75, 3.35, WALL_Z + 0.35);
    d.userData.side = s;
    g.add(d); drapes.push(d);
  }
  const rod = mesh(geo.cyl(0.07, 0.07, 5.0, 12), 0xffc531, { outline: 0.018 }); rod.rotation.z = Math.PI / 2;
  rod.position.set(BED.x, 6.95, WALL_Z + 0.4); g.add(rod);
  for (const s of [-1, 1]) { const k = mesh(geo.sphere(0.15, 14, 10), 0xffc531, { outline: 0.018 }); k.position.set(BED.x + s * 2.55, 6.95, WALL_Z + 0.4); g.add(k); }
  const bshelf = scProp('prop_shelf', { toys: {} }, { ink: 0.022 });
  if (bshelf) { bshelf.position.set(12.6, 5.2, WALL_Z + 0.25); g.add(bshelf); }
  const pic = scProp('prop_frame', { canvas: { tint: 0xffd6e8, ink: 0 }, art: { ink: 0.012 } }, { ink: 0.02 });
  if (pic) { pic.position.set(2.8, 5.0, WALL_Z); g.add(pic); }
  const rug = new T.Mesh(new T.CircleGeometry(2.4, 48), flat(rugTex(['#ff9ec4', '#fff2f7', '#b99cf0', '#fff2f7', '#8fe0cf', '#fff2f7'])));
  rug.rotation.x = -Math.PI / 2; rug.scale.set(1.45, 0.75, 1); rug.position.set(10.6, 0.015, -0.4); g.add(rug);
  const bed = propModel('prop_md_bed'); bed.position.copy(BED); g.add(bed);
  const table = propModel('prop_md_table'); table.position.set(2.75, 0, -3.3); g.add(table);
  const lamp = propModel('prop_md_lamp'); lamp.position.set(2.45, 1.4, -3.45); g.add(lamp);
  const clock = propModel('prop_md_clock'); clock.position.set(3.05, 1.4, -3.05); clock.rotation.y = -0.15; g.add(clock);
  const bplant = scProp('prop_plant', { leaves: { ink: 0.016 } }, { ink: 0.02 });
  if (bplant) { bplant.position.set(13.6, 0, -3.4); g.add(bplant); }
  // the lamp's shade glows (unlit, warm); its light pool on the wall
  const shade = lamp.userData.model.userData.layers?.shade?.mesh;
  if (shade) shade.material = basic(0xfff1c0, { vertexColors: true, fog: false });
  // (a soft radial glow that fades to nothing: a flat disc read as a hard-edged yellow plate on the wallpaper)
  const glow = document.createElement('canvas'); glow.width = glow.height = 128;
  const gx = glow.getContext('2d'), gr = gx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.45, 'rgba(255,255,255,0.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  gx.fillStyle = gr; gx.fillRect(0, 0, 128, 128);
  const glowTex = new T.CanvasTexture(glow); glowTex.colorSpace = T.SRGBColorSpace;
  const pool = new T.Mesh(new T.PlaneGeometry(4.2, 4.2), new T.MeshBasicMaterial({ color: 0xffe9a8, map: glowTex, transparent: true, opacity: level === 2 ? 0.45 : 0.16, depthWrite: false, fog: false }));
  pool.position.set(2.45, 2.6, WALL_Z + 0.03); g.add(pool);

  return { group: g, bathWin, sink, stool, bath, cab, bin, lid, bed, table, lamp, clock, drapes, bedWin, shade, pool };
}

// The things the bunny uses. Each: { key, obj, home (pos), rot (Euler), size }. Positions use the house props'
// anchors so everything sits on its dish / shelf / mat.
export function makeItems(h, level) {
  const out = {};
  // the turn goes on the model inside the wrapper (the wrapper only ever leans while it is dragged)
  const add = (key, obj, pos, rot = [0, 0, 0], extra = {}) => {
    obj.position.copy(pos);
    const rn = obj.userData.model || obj;
    rn.rotation.set(rot[0], rot[1], rot[2], rot[3] || 'XYZ');
    h.group.add(obj);
    out[key] = { key, obj, rn, home: pos.clone(), rot: rn.rotation.clone(), ...extra };
    return out[key];
  };
  const at = (prop, name) => { const a = propAnchor(prop, name); prop.updateMatrixWorld(true); const p = a.getWorldPosition(new T.Vector3()); prop.remove(a); return p; };
  const soapAt = at(h.sink, 'soap'), cupAt = at(h.sink, 'cup');
  add('soap', propModel('prop_md_soap', { tint: [0xff9ec8, 0xffd23f, 0xb99cf0][level] }), soapAt.clone().add(new T.Vector3(0, -0.02, 0)), [0, -0.3, 0]);
  add('cup', propModel('prop_md_cup', { tint: 0xffb020, size: 1.15 }), cupAt.clone().add(new T.Vector3(0, -0.03, 0)), [0, 0.5, 0]);
  // the toothbrush and the paste stand up in the cup (head / cap up, bristles toward us)
  add('brush', propModel('prop_md_brush', { tint: 0x7ad16b, size: 1.5 }), cupAt.clone().add(new T.Vector3(0.12, 0.8, 0.02)), [Math.PI / 2, 0, Math.PI / 2 - 0.25, 'ZYX']);
  add('paste', propModel('prop_md_paste', { size: 1.4 }), cupAt.clone().add(new T.Vector3(-0.13, 0.62, -0.05)), [Math.PI / 2, 0, Math.PI / 2 + 0.3, 'ZYX']);
  const ub = out.brush.obj.userData.model.userData.layers.paste;
  if (ub) { ub.mesh.visible = false; ub.outline.visible = false; }
  // the hand towel hangs on the bar under the basin; the big bath towel is draped over the side of the bath
  add('towel', propModel('prop_md_towel', { tint: [0x5fc8a8, 0xff9ec4, 0x7fb8ff][level], size: 0.85 }), at(h.sink, 'towel'), [0, 0, 0]);
  add('bigtowel', propModel('prop_md_towel', { tint: 0xffa64a, size: 0.95 }), new T.Vector3(-9.05, 1.47, -1.22), [0, -0.45, 0]);
  add('sponge', propModel('prop_sponge', { tint: 0xffd23f, size: 0.55 }), new T.Vector3(-9.6, 0.02, -0.2), [0, 0.3, 0]);
  add('bottle', propModel('prop_md_bottle', { tint: 0xff8fc0, size: 1.0 }), new T.Vector3(-10.6, 0, -0.45), [0, 0.2, 0]);
  const tb = propModel('prop_md_tissues', { tint: 0xb99cf0 }); tb.position.set(-1.6, 1.4, -3.1); tb.rotation.y = -0.2; h.group.add(tb);
  const tl = tb.userData.model.userData.layers.tissue; if (tl) { tl.mesh.visible = false; tl.outline.visible = false; }
  h.tissueBox = tb;
  add('tissue', propModel('prop_md_tissue', { size: 1.0 }), new T.Vector3(-1.62, 2.12, -3.0), [-0.25, -0.2, 0.15]);
  // the hairbrush lies flat along the front of the cabinet top, in front of the tissues (it used to lean out over the sink)
  add('hairbrush', propModel('prop_md_hairbrush', { tint: 0xffb020, size: 1.12 }), new T.Vector3(-1.45, 1.47, -2.62), [-Math.PI / 2, 0, 0.1]);
  // bedroom
  add('duvet', propModel('prop_md_duvet', { tint: 0x8fc7ff }), new T.Vector3(BED.x + 0.6, 1.05, BED.z), [0, 0, 0]);
  const teddy = makeAnimal('bear');
  teddy.userData.noWalk = true;
  add('teddy', teddy, new T.Vector3(12.3, 0, -1.4), [0, -0.35, 0], { scale: 0.42 });
  teddy.scale.setScalar(0.42);
  teddy.userData.baseScale = 0.42;
  return out;
}
