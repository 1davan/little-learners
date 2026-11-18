// Snack chef: the cosy kitchen. A long island counter (sink at the left end, the plate in the middle, a fruit bowl and a
// chopping board at the right end), a fridge, a window over the sink, a shelf with canisters. Every object is a Blender
// prop (tools/blender/creatures/prop_kitchen.py); the walls and floor are painted canvases.
// Three looks: L1 sunny morning (mint), L2 bright day (butter yellow), L3 rainy evening (lilac, rain on the window).
import * as T from '../three.js';
import { basic, geo } from '../engine/toon.js';
import { scMesh, scProp } from '../engine/scenery.js';
import { propModel } from '../engine/prop-models.js';
import { prop } from './view-tools.js';

export const WALL_Z = -4.5;
export const TOP = 1.15;                                  // the worktop surface
export const COUNTER_X = -1.4;                            // the counter model's centre (it is 11.6 long)
export const SINK = new T.Vector3(-5.0, TOP, -0.6);      // the basin's centre at worktop height (floor 0.42 lower)
export const BASIN_FLOOR = 0.75;
export const PLATE = new T.Vector3(-1.6, TOP, 0.02);      // the stations sit close together so the camera can
                                                          // frame each one tightly (every plate fits the worktop's depth;
                                                          // a friend at the plate never meets one at the sink)
export const LANE_Z = -1.97;                              // friends walk behind the counter
export const BOWL = new T.Vector3(1.3, TOP, 0.05);        // (far enough from the plate that a lifted plate never meets it)
export const BOARD = new T.Vector3(3.2, TOP, 0.25);
// Snack chef stands the fridge at the island's right end, in line with it (so the friends can walk on behind it to
// the dining corner); Cook a soup keeps it against the back wall (makeKitchen without { snack: true }).
export const FRIDGE = new T.Vector3(5.4, 0, 0.05);
const FRIDGE_WALL = new T.Vector3(5.4, 0, -3.65);
export const FRIDGE_SHELVES = [1.35, 2.45];
const WINDOW = { x: -5.0, y: 5.05, hw: 1.5, hh: 1.05 };
const TAP_AT = new T.Vector3(-5.76, TOP, -0.6);
// Snack chef's sink: the tap stands at the basin's back right corner and pours to the left, so the water falls near
// the back of the basin, where the friends' paws can reach it from behind the counter; its lever faces us. The soap
// stands to the left of the basin and the hand towel hangs on a little stand at the worktop's left end.
// (its own low model, prop_k_tapsnack: a pillar at the right of the basin and a long low spout reaching left)
export const SNACK_TAP = { at: new T.Vector3(-4.02, TOP, -0.86), ry: -Math.PI / 2, k: 1.0 };
export const SOAP_AT = new T.Vector3(-6.82, TOP, -0.42);
// a small hand towel hangs over a low chrome stand on the worktop's back edge just left of the basin, where a friend
// at the sink can step over and take it in its paws (the soap stands at the front left)
export const TOWEL_STAND = new T.Vector3(-6.0, TOP, -0.93);
export const TOWEL_STAND_H = 0.44;
// the dining corner beyond the fridge: a long table with a cloth; fed friends sit behind it with their plates, left
// to right (later friends walk on behind the ones already sitting); Pip waits at the far end
export const TABLE = new T.Vector3(10.65, 0, 2.45);         // the table's centre (its top is 8.1 x 2.5)
export const SEATS = [7.9, 10.65, 13.4];
export const SEAT_Z = 0.25;
export const TABLE_TOP = 0.92;
export const PIP_HOST = new T.Vector3(15.6, 0, 1.95);
// the fruit bowl's inside (prop_k_bowl, worktop-relative): the floor height, the radius and height of its physics
// wall, and where three fruits sit without touching
export const BOWL_IN = { floor: 0.13, r: 0.8, h: 0.34, spots: [[-0.32, -0.17], [0.32, -0.17], [0, 0.36]] };

export const LOOKS = {
  morning: { cab: 0x8ed6c0, door: 0xb9eedc, wall: ['#fff3e0', '#ffe6c8'], tile: ['#ffffff', '#cdf0e4'], floor: ['#f6d7a8', '#efc58c'], sky: ['#7fcaff', '#dff3ff'], sun: true, curtain: 0xff9ec4 },
  noon: { cab: 0xffd27a, door: 0xffe6ad, wall: ['#eef8ff', '#dcefff'], tile: ['#ffffff', '#fff0c4'], floor: ['#cfe7f7', '#b9daf0'], sky: ['#4fb2f2', '#c8ecff'], sun: true, curtain: 0x8fd3ff },
  evening: { cab: 0xbfa8f2, door: 0xdcd0fb, wall: ['#fff0f4', '#ffe0ea'], tile: ['#ffffff', '#ead9ff'], floor: ['#e6c9a8', '#d8b58e'], sky: ['#4c5a8e', '#e2b8b8'], rain: true, curtain: 0xffc531 },
};

function canvasTex(w, h, draw, repeat = null) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new T.CanvasTexture(c);
  t.colorSpace = T.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}
const flat = (map, extra = {}) => new T.MeshBasicMaterial({ map, fog: false, ...extra });

function wallTex(L) {
  return canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = L.wall[0]; g.fillRect(0, 0, w, h);
    g.fillStyle = L.wall[1];
    for (let x = 0; x < w; x += 32) g.fillRect(x, 0, 14, h);           // soft stripes
    g.fillStyle = '#ffffff';
    for (const [x, y] of [[23, 30], [55, 94], [87, 30], [119, 94]]) { g.beginPath(); g.arc(x, y, 4, 0, Math.PI * 2); g.fill(); }
  }, [11, 5]);
}
function tileTex(L) {
  return canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#d9d2c8'; g.fillRect(0, 0, w, h);                    // grout
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      g.fillStyle = (i + j) % 2 ? L.tile[1] : L.tile[0];
      g.beginPath(); g.roundRect(i * 32 + 2, j * 32 + 2, 28, 28, 4); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillRect(i * 32 + 6, j * 32 + 6, 8, 3);
    }
  }, [22, 2.6]);
}
function floorTex(L) {
  return canvasTex(128, 128, (g, w, h) => {
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { g.fillStyle = (i + j) % 2 ? L.floor[1] : L.floor[0]; g.fillRect(i * 64, j * 64, 64, 64); }
    g.strokeStyle = 'rgba(160,120,80,0.25)'; g.lineWidth = 2; g.strokeRect(0, 0, w, h);
  }, [16, 9]);
}
function skyTex(L) {
  return canvasTex(256, 180, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, L.sky[0]); gr.addColorStop(1, L.sky[1]);
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    if (L.sun) { g.fillStyle = '#ffe14d'; g.beginPath(); g.arc(196, 52, 24, 0, Math.PI * 2); g.fill(); }
    else { g.fillStyle = '#fff3b0'; g.beginPath(); g.arc(60, 46, 16, 0, Math.PI * 2); g.fill(); }
    // a garden: two soft hills, a hedge and a little tree
    g.fillStyle = L.rain ? '#5f9a6a' : '#7fd16e'; g.beginPath(); g.ellipse(70, 190, 150, 70, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = L.rain ? '#4f8a5c' : '#5fbf5a'; g.beginPath(); g.ellipse(220, 200, 130, 70, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#9a6a3a'; g.fillRect(166, 104, 10, 34);
    g.fillStyle = L.rain ? '#3f7a4c' : '#4cae4a'; g.beginPath(); g.arc(171, 96, 22, 0, Math.PI * 2); g.fill();
    if (!L.rain) { g.fillStyle = '#ffffff'; for (const [x, y, r] of [[70, 50, 16], [92, 44, 20], [114, 52, 14]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); } }
  });
}

// The fridge is hollow: the ink shell of its inner walls sits just inside the cabinet and would show as dark
// smudges when the door opens. Its outline material gets a copy that drops every fragment whose rest position is
// inside the cabinet (model space, see prop_kitchen.py: |x| < 0.83, 0.5 < y < 3.84, -0.61 < z < 0.55).
function hideInnerInk(w) {
  w.traverse((o) => {
    if (!o.isSkinnedMesh || !o.userData.outline || o.userData.innerCut) return;
    const src = o.material;
    const th = parseFloat(String(src.customProgramCacheKey?.() || '').replace('skin-outline', '')) || 0.024;
    const m = new T.MeshBasicMaterial({ color: src.color, side: T.BackSide });
    m.onBeforeCompile = (sh) => {
      sh.vertexShader = 'varying vec3 vRest;\n' + sh.vertexShader.replace('#include <begin_vertex>', `vec3 transformed = position + normal * ${th.toFixed(4)}; vRest = position;`);
      sh.fragmentShader = 'varying vec3 vRest;\n' + sh.fragmentShader.replace('void main() {', 'void main() {\n if (abs(vRest.x) < 0.85 && vRest.y > 0.47 && vRest.y < 3.87 && vRest.z > -0.64 && vRest.z < 0.56) discard;');
    };
    m.customProgramCacheKey = () => 'fridge-outline' + th;
    o.material = m;
    o.userData.innerCut = true;
  });
}

// A static prop layer list (missing layers are skipped).
const sc = (kind, layers = {}, base = {}) => scProp(kind, layers, base);

export function makeKitchen(look = 'morning', { snack = false } = {}) {
  const L = LOOKS[look] || LOOKS.morning;
  const g = new T.Group();
  // ---- walls and floor ----
  const wall = new T.Mesh(new T.PlaneGeometry(44, 14), flat(wallTex(L)));
  wall.position.set(0, 7 + 2.6, WALL_Z - 0.01);
  const tiles = new T.Mesh(new T.PlaneGeometry(44, 2.6), flat(tileTex(L)));
  tiles.position.set(0, 1.3, WALL_Z);
  const floor = new T.Mesh(new T.PlaneGeometry(44, 26), flat(floorTex(L)));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, WALL_Z + 13);
  g.add(wall, tiles, floor);
  // a wooden rail between the tiles and the wallpaper, and a skirting board
  const rail = new T.Mesh(geo.box(44, 0.14, 0.1), basic(0xe7b57c, { fog: false })); rail.position.set(0, 2.62, WALL_Z + 0.05);
  const skirt = new T.Mesh(geo.box(44, 0.28, 0.1), basic(0xffffff, { fog: false })); skirt.position.set(0, 0.14, WALL_Z + 0.05);
  g.add(rail, skirt);

  // ---- the window over the sink (garden outside; rain on the glass in the evening) ----
  const sky = new T.Mesh(new T.PlaneGeometry(WINDOW.hw * 2, WINDOW.hh * 2), flat(skyTex(L)));
  sky.position.set(WINDOW.x, WINDOW.y, WALL_Z + 0.02);
  g.add(sky);
  const frame = scMesh('prop_window', 'prop_window', { ink: 0.022 });
  if (frame) { frame.position.set(WINDOW.x, WINDOW.y, WALL_Z); g.add(frame); }
  for (const s of [-1, 1]) {
    const cur = scProp('prop_curtain', { prop_curtain: { tint: L.curtain }, tie: { tint: 0xffffff, ink: 0.016 } }, { ink: 0.02 });
    if (!cur) continue;
    cur.scale.set(-s * 1.0, WINDOW.hh * 2 + 0.7, 1);
    cur.position.set(WINDOW.x + s * (WINDOW.hw + 0.3), WINDOW.y - WINDOW.hh - 0.45, WALL_Z + 0.3);
    g.add(cur);
  }
  const plant = sc('prop_plant', { leaves: {} });
  if (plant) { plant.scale.setScalar(0.55); plant.position.set(WINDOW.x + 0.9, WINDOW.y - WINDOW.hh - 0.02, WALL_Z + 0.35); g.add(plant); }
  const drops = [];
  if (L.rain) {
    for (let i = 0; i < 18; i++) {
      const d = new T.Mesh(geo.box(0.03, 0.18, 0.01), basic(0x9cc8ff, { fog: false }));
      d.rotation.z = 0.2;
      d.position.set(WINDOW.x + (Math.random() * 2 - 1) * WINDOW.hw * 0.95, WINDOW.y + (Math.random() * 2 - 1) * WINDOW.hh, WALL_Z + 0.03);
      d.userData.ph = Math.random() * 6;
      g.add(d); drops.push(d);
    }
  }

  // ---- a shelf with canisters (and a picture) ----
  const shelf = sc('prop_shelf', { toys: false });
  if (shelf) { shelf.position.set(0.4, 5.0, WALL_Z + 0.25); g.add(shelf); }
  const jars = sc('prop_k_jars', { lid0: {}, lid1: {}, lid2: {}, label0: {}, label1: {}, label2: {} });
  if (jars) { jars.scale.setScalar(0.85); jars.position.set(0.4, 5.06, WALL_Z + 0.3); g.add(jars); }
  const pic = sc('prop_frame', { canvas: { tint: 0x9ad8ff, ink: 0 }, art: { ink: 0.012 } }, { ink: 0.02 });
  if (pic) { pic.position.set(3.6, 5.3, WALL_Z); g.add(pic); }

  // ---- the island counter (tinted per level) ----
  const counter = sc('prop_k_counter', { prop_k_counter: { tint: L.cab }, top: {}, basin: {}, doors: { tint: L.door }, knobs: {} });
  if (counter) { counter.position.set(COUNTER_X, 0, 0); g.add(counter); }
  // the tap and its lever bone (Snack chef: back right corner, pouring left; Cook: the left side, pouring right)
  const tap = (snack && propModel('prop_k_tapsnack')) || propModel('prop_k_tap');
  // its shine streaks have no ink (ink on thin chrome reads as scratches)
  if (tap) for (const [name, l] of Object.entries(tap.userData.model.userData.layers || {})) if (/^shine/.test(name) && l.outline) l.outline.visible = false;
  if (tap) {
    if (snack) { tap.position.copy(SNACK_TAP.at); tap.rotation.y = SNACK_TAP.ry; tap.scale.setScalar(SNACK_TAP.k); }
    else { tap.position.copy(TAP_AT); tap.rotation.y = Math.PI / 2; tap.scale.setScalar(0.85); }
    g.add(tap);
  }
  const soap = propModel('prop_k_soap');
  if (soap) {
    if (snack) { soap.position.copy(SOAP_AT); soap.rotation.y = 0.35; soap.scale.setScalar(1.1); }
    else { soap.position.set(-6.55, TOP, -0.72); soap.rotation.y = -0.4; soap.scale.setScalar(1.15); }
    g.add(soap);
  }
  // the hand towel hangs over its own rail or stand (which stays put when the towel is taken). Origins: the bar's
  // centre for the towel and the rail, the foot for the stand.
  let towelAt;
  const towelRail = snack ? sc('prop_k_towelstand', { feet: {} }, { ink: 0.014 }) : sc('prop_k_towelrail', {}, { ink: 0.014 });
  if (snack) { towelAt = TOWEL_STAND.clone().add(new T.Vector3(0, TOWEL_STAND_H, 0)); if (towelRail) towelRail.position.copy(TOWEL_STAND); }
  else { towelAt = new T.Vector3(-6.5, TOP - 0.17, 1.27); if (towelRail) towelRail.position.copy(towelAt); }
  if (towelRail) g.add(towelRail);
  const towel = propModel('prop_k_towel');
  if (towel) { towel.position.copy(towelAt); g.add(towel); }
  // the plate is the game's (it changes per level); the fruit bowl and the chopping board stay
  let bowl = snack ? propModel('prop_k_bowl') : null;
  if (bowl) { bowl.position.copy(BOWL); g.add(bowl); }
  else {
    bowl = propModel('prop_woodbowl', { tint: 0xff8fbd });
    if (bowl) { bowl.scale.setScalar(0.82); bowl.position.copy(BOWL); g.add(bowl); }
  }
  const board = scProp('prop_k_board');
  if (board) { board.position.copy(BOARD); g.add(board); }

  // ---- the fridge ----
  const fridge = propModel('prop_k_fridge');
  if (fridge) { fridge.position.copy(snack ? FRIDGE : FRIDGE_WALL); hideInnerInk(fridge); g.add(fridge); }

  // ---- Snack chef's dining corner: the table the fed friends sit at, a clock and a picture over it ----
  let table = null;
  if (snack) {
    table = sc('prop_k_table', { cloth: {}, edge: {} });
    if (table) { table.position.copy(TABLE); g.add(table); }
    const clock = sc('prop_md_clock', {}, { ink: 0.02 });
    if (clock) { clock.scale.setScalar(1.1); clock.position.set(TABLE.x - 1.6, 5.6, WALL_Z + 0.1); g.add(clock); }
    const pic2 = sc('prop_frame', { canvas: { tint: 0xffd6e6, ink: 0 }, art: { ink: 0.012 } }, { ink: 0.02 });
    if (pic2) { pic2.position.set(TABLE.x + 1.8, 5.3, WALL_Z); g.add(pic2); }
  }

  for (const p of [tap, soap, towel, bowl, fridge]) if (p) { const u = p.userData.model.userData; u.noWalk = true; u.noLook = true; }
  const K = {
    group: g, counter, tap, soap, towel, towelRail, bowl, board, fridge, table, look: L,
    handle: tap?.userData.bones?.handle, pump: soap?.userData.bones?.pump, door: fridge?.userData.bones?.door,
    // where the water leaves the spout (world)
    spout: tap ? (tap.updateMatrixWorld(true), tap.localToWorld(spoutLocal(tap))) : new T.Vector3(SINK.x - 0.1, TOP + 0.7, SINK.z),
    update(dt, t) {
      for (const d of drops) { d.position.y -= dt * 0.9; if (d.position.y < WINDOW.y - WINDOW.hh) d.position.y += WINDOW.hh * 2; }
    },
  };
  return K;
}

// where the water leaves a tap model (its 'spout' anchor), in the wrapper's space
function spoutLocal(tap) {
  const m = tap.userData.model, a = m?.userData.anchors?.spout;
  return a ? new T.Vector3(a[0] * m.scale.x, a[1] * m.scale.y, a[2] * m.scale.z) : new T.Vector3(0, 0.72, 0.78);
}

// the plate for a level: 'plain' (china plate, three spots), 'plate2' (fruit | veg) or 'plate4' (four groups)
export function makePlate(kind) {
  if (kind === 'plain') {
    const p = prop('prop_chinaplate', { tint: 0x7fd0ff });
    if (p) { const k = 1.05; p.scale.setScalar(k); p.userData.floor = 0.118 * k; p.userData.R = 1.0 * k; p.userData.k = k; }
    return p;
  }
  const p = propModel(kind === 'plate2' ? 'prop_k_plate2' : 'prop_k_plate4');
  if (!p) return null;
  const k = kind === 'plate2' ? 1.0 : 0.92;
  p.scale.setScalar(k);
  p.userData.floor = 0.075 * k;
  p.userData.R = (kind === 'plate2' ? 1.05 : 1.25) * k;
  p.userData.k = k;
  const u = p.userData.model.userData; u.noWalk = true; u.noLook = true;
  return p;
}

// ---- friends behind the counter ----
export const COUNTER_BACK = -1.18;                         // the back face of the island (the worktop's back edge)
// the back of the visible props on the worktop (the soap, the tap): a friend's arms walking past stay short of it
export function propBack(K) {
  K.group.updateMatrixWorld(true);
  return Math.min(...[K.tap, K.soap].filter((o) => o && o.visible).map((o) => new T.Box3().setFromObject(o).min.z), 0);
}
// From the friend's real (skinned) shape: the lane where its tummy and feet clear the back of the counter facing
// us, and the 'carry' arm tuck it walks with sideways along the counter.
export function fitBehindCounter(f, propBack = 0) {
  const u = f.userData, arms = u.arms, r = u.rest || (u.rest = (arms || []).map((b) => b.rotation.clone()));
  const p0 = f.position.clone(), ry0 = f.rotation.y;
  f.position.set(0, 0, 0); f.rotation.y = 0;
  const v = new T.Vector3();
  // what can be seen cutting the worktop is the band of the body just under its surface (anything lower is
  // inside the cabinet, hidden by it): its furthest forward / sideways reach, and the sideways reach above the
  // worktop (where the soap and the tap stand), with the arms swung out (+) or tucked in (-) by a
  const scan = (a) => {
    if (arms && r.length === 2) { arms[0].rotation.set(r[0].x, r[0].y, r[0].z + a); arms[1].rotation.set(r[1].x, r[1].y, r[1].z - a); }
    f.updateMatrixWorld(true);
    let front = 0, side = 0, up = 0;
    f.traverse((m) => {
      if (!m.isMesh || !m.visible || m.material?.side === T.BackSide) return;
      const pos = m.geometry.attributes.position;
      for (let i = 0; i < pos.count; i += 2) {
        m.getVertexPosition(i, v); v.applyMatrix4(m.matrixWorld);
        if (v.y > TOP + 0.05) { if (v.y < TOP + 0.9) up = Math.max(up, Math.abs(v.x)); continue; }
        if (v.y < TOP - 0.4) continue;
        front = Math.max(front, v.z); side = Math.max(side, Math.abs(v.x));
      }
    });
    return { a, front, side, up };
  };
  const rest = scan(0);
  const tries = [rest];
  for (let a = -0.1; a >= -1.0; a -= 0.1) tries.push(scan(a));
  for (let a = 0.1; a <= 0.8; a += 0.1) tries.push(scan(a));
  // the narrowest band; among nearly as narrow poses, the one closest to resting
  const best = Math.min(...tries.map((t) => Math.max(t.side, t.up)));
  const c = tries.filter((t) => Math.max(t.side, t.up) <= best + 0.05).sort((x, y) => Math.abs(x.a) - Math.abs(y.a))[0];
  u.carry = c.a; u.sideW = c.side;
  u.standZ = Math.min(LANE_Z, COUNTER_BACK - rest.front - 0.14);   // (room to lean over the sink)
  u.laneZ = Math.min(u.standZ, COUNTER_BACK - c.side - 0.06, propBack - c.up - 0.05);
  u.fit = { rest, c };
  if (arms && r.length === 2) arms.forEach((b, i) => b.rotation.copy(r[i]));
  f.position.copy(p0); f.rotation.y = ry0;
  f.updateMatrixWorld(true);
}
