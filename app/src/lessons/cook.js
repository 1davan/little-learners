// Cook a soup. Topics mt_F62VTeHB4- "Preparing simple healthy snacks", mt_QhLAeAlHI0 "Balanced diet and food groups",
// mt_QR3vxbN1o4 "Planning a task" (follow the steps, a recipe card) and mt_WcfaSfVT33 "One-to-one counting".
// Bear stands on his kitchen step behind the counter and does the cooking with his own paws; the child tells him
// what to do, one step at a time, with the camera close on whatever is being done:
//   1. put a veggie on the board: it hops from the bowl onto the chopping board (Level 2 asks for a colour:
//      "Find the orange one!"; Level 3 follows a picture recipe card: 1 carrot, then 2 tomatoes)
//   2. tap the knife: Bear pulls it out of its block and holds it over the board, following the finger
//   3. chop! Every tap (or swipe) brings Bear's knife down and really slices the vegetable (cook-slice.js): carrot
//      coins flop over to show their rings, then get diced. Chop as long as you like; a few seconds without a chop
//      (or everything diced small) and Bear puts the knife back: "Hold the board!"
//   4. hold the board: the pieces slide together, Bear lifts the board and carries it where the finger leads; let go
//      over the pot and he tips it - the pieces slide off, plop, splash and bob in the soup
//   5. (the first time) tap the knob: click, whoomp, flames, bubbles and steam; the soup takes on the colours
//   Level 3 then stirs the soup with Bear's ladle and fills a bowl, which Bear blows on and tastes.
// Bear's arms are posed every frame so his paw is always on the knife's handle, the board's edge, the ladle or the
// bowl (cook-bear.js): nothing ever floats "held by nobody".
// Each new kind of action gets a slow hand demo the first time (and again when the child is stuck for ~8 s).
import * as T from '../three.js';
import { Lesson } from '../engine/lesson.js';
import { makeAnimal, setFace, popIn } from '../engine/actors.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { project, setCamera, camera, onBeforeRender } from '../engine/stage.js';
import { Ease } from '../engine/tween.js';
import { toon, toonUnique, geo } from '../engine/toon.js';
import { scProp } from '../engine/scenery.js';
import { VEG, PLANS, makeVeg } from './cook-veg.js';
import { bake, makePiece, measure, extentAlong, cutPiece, disposePiece, AXES } from './cook-slice.js';
import {
  makeCookKitchen, radialTex, cardRow, CARD_TILT, TOP, COUNTER_BACK, HOB, BURNER, KNOB_AT, POT, POT_RIM, POT_R, BOARD, BW, BD, BOARD_TOP,
  VBOWL, VBOWL_K, KNIFE_K, KNIFE_GRIP, KNIFE_REST, KNIFE_REST_Q, KNIFE_LIFT, KBLOCK, STEP_Y, FRIEND_AT,
} from './cook-kitchen.js';
import { BearRig } from './cook-bear.js';
import { csfx } from './cook-sound.js';

// the two blade directions (cut normals), 35 degrees either side of x so Bear's knife always comes from behind
const A35 = 35 * Math.PI / 180;
const N1 = [Math.cos(A35), Math.sin(A35)], N2 = [Math.cos(A35), -Math.sin(A35)];
const MIN = 0.075;                // the thinnest slice
const MAXP = 18;                  // most pieces on the board (so they always fit side by side, or one on another)
const MAX_CHOPS = 100;
const IDLE_SCOOP = 3;             // seconds without a chop -> Bear puts the knife away (audit K3)
const ALL_DICED = 2;              // ... or this long after everything has been cut 3 times
const BAND = [-0.4, 0.46];       // pieces stay in this band of the board (board z), where Bear's knife reaches
const GRIP_Z = -0.95;
const MAX_LIFT = (STEP_Y + 1.3 * 1.1 - 0.42) - (TOP + BOARD_TOP);   // the edge's highest: the handle stays well below Bear's chin             // where Bear likes to hold the knife's handle (world z)
const XE = [-0.3, 0.5];           // the part of the blade (knife model x) that may do the cutting
const CARRY_Y = POT_RIM + 0.06;   // the board's bottom over the pot (just clear of its rim)
const CARRY_LOW = TOP + 0.36;     // ... and while Bear walks with it (low, so his face shows over the pile)
const TILT = 0.24;                // how far the board tips over the pot (about its front edge)
const MAXF = 18;                  // pieces floating in the soup at once (older ones sink)
const IN_BOWL = 0.86;             // vegetables sit a little smaller in the bowl
const FLOOR = TOP + 0.24 * VBOWL_K;
const STUCK_DEMO = 8;
const LADLE_K = 1.0;
const SERVE_SPOT = new T.Vector3(BOARD.x - BW + 0.55, TOP + BOARD_TOP, BOARD.z - 0.05);   // the bowl's place, by the pot
const BOWL_K = 0.34;

// Camera views, framed from the real extents of what must be seen (FEEL-BRIEF rule 3): the camera looks from
// elevation el (and a little turn yaw) and pulls back just far enough that every point is on screen, clear of the
// caption bubble at the top, whatever the window's shape.
const HEAD_Y = STEP_Y + 2.62;            // the top of Bear's ears
function bearPts(x, z) { return [new T.Vector3(x - 0.75, HEAD_Y, z), new T.Vector3(x + 0.75, HEAD_Y, z), new T.Vector3(x, HEAD_Y, z + 0.4)]; }
const box = (x0, x1, y0, y1, z0, z1) => { const o = []; for (const x of [x0, x1]) for (const y of [y0, y1]) for (const z of [z0, z1]) o.push(new T.Vector3(x, y, z)); return o; };
function fitView(pts, el, yaw = 0, { top = 0.36, bottom = 0.05, side = 0.07 } = {}) {
  const dir = new T.Vector3(Math.sin(yaw) * Math.cos(el), Math.sin(el), Math.cos(yaw) * Math.cos(el));
  const f = dir.clone().negate(), r = new T.Vector3().crossVectors(f, UP).normalize(), u = new T.Vector3().crossVectors(r, f);
  const th = Math.tan((camera.fov * Math.PI) / 360), asp = camera.aspect || 1.6;
  const L = pts.reduce((a, p) => a.add(p), new T.Vector3()).multiplyScalar(1 / pts.length);
  const yMid = (bottom - top) / 2;
  const bounds = (d) => {
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const p of pts) {
      const q = p.clone().sub(L), depth = d + q.dot(f);
      const nx = q.dot(r) / (depth * th * asp), ny = q.dot(u) / (depth * th);
      x0 = Math.min(x0, nx); x1 = Math.max(x1, nx); y0 = Math.min(y0, ny); y1 = Math.max(y1, ny);
    }
    return { x0, x1, y0, y1 };
  };
  let d = 6;
  for (let it = 0; it < 5; it++) {
    let lo = 1.5, hi = 40;
    for (let k = 0; k < 32; k++) {
      d = (lo + hi) / 2;
      const b = bounds(d);
      const fits = Math.max(-b.x0, b.x1) <= 1 - side && (b.y1 - b.y0) / 2 <= 1 - (top + bottom) / 2;
      if (fits) hi = d; else lo = d;
    }
    d = hi;
    const b = bounds(d);
    L.addScaledVector(r, ((b.x0 + b.x1) / 2) * d * th * asp).addScaledVector(u, ((b.y0 + b.y1) / 2 - yMid) * d * th);
  }
  return { look: L, pos: L.clone().addScaledVector(dir, d) };
}
const VIEWDEFS = {
  bowl: () => fitView([...box(-1.3, 4.45, TOP, TOP + 0.75, -1.1, 1.25), ...bearPts(FRIEND_AT.x, -1.7)], 0.5),
  board: () => fitView([...box(BOARD.x - BW, KBLOCK.x + 0.2, TOP, TOP + 0.3, COUNTER_BACK + 0.05, BOARD.z + BD + 0.15), new T.Vector3(KBLOCK.x, TOP + 1.45, KBLOCK.z), ...bearPts(BOARD.x - 0.2, -1.7), ...bearPts(BOARD.x + 0.5, -1.7)], 0.52),
  carry: () => fitView([...box(POT.x - 0.9, BOARD.x + BW + 0.3, TOP, POT_RIM, -1.1, POT.z + 1.0), ...bearPts(POT.x, -1.8), ...bearPts(BOARD.x, -1.8)], 0.7),
  pot: () => fitView([...box(HOB.x - 1.35, HOB.x + 1.35, TOP, POT_RIM + 0.1, -1.0, HOB.z + 0.8), ...bearPts(POT.x + 0.5, -1.8), ...bearPts(POT.x - 0.1, -1.8)], 0.66),
  serve: () => fitView([...box(POT.x - 0.95, SERVE_SPOT.x + 0.6, TOP, POT_RIM + 0.1, -1.0, POT.z + 0.95), ...bearPts((POT.x + SERVE_SPOT.x) / 2, -1.8), ...bearPts(SERVE_SPOT.x - 0.5, -1.75)], 0.45),
};
const VIEW = (name) => (VIEWDEFS[name] ? VIEWDEFS[name]() : name);
const SAY = {
  any: 'Put a veggie on the board!', knife: 'Pick up the knife!', chop: 'Tap to chop!',
  scoop: 'Hold the board!', carry: 'Take it to the pot!', knob: 'Tap the knob! Stove on!',
  stir: 'Stir the soup!', serve: 'Take the bowl to the pot!', card: 'Look at the card!',
};
const NUM = ['One!', 'Two!', 'Three!'];
const NUM_COL = ['#ff4f4f', '#ff9a2e', '#3f8cff'];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
// the top of a piece on the board (it may lie on top of others: base)
const ptop = (pc) => (pc.base || 0) + pc.y1 - pc.y0;
const UP = new T.Vector3(0, 1, 0);

export default class CookLesson extends Lesson {
  get totalRounds() { return (this.plan || PLANS[this.level] || PLANS[0]).rounds.length; }

  build() {
    const P = PLANS[this.level] || PLANS[0];
    this.plan = { ...P, rounds: P.rounds.map((r) => ({ ...r })) };     // (Level 1 may swap its rounds' order)
    this.meadow.visible = false;
    const S = (this.S = makeCookKitchen(this.plan.look));
    this.root.add(S.group);
    this.top = S.top;
    this.soup = S.soup;
    this.soup.onPop = () => { if (Math.random() < 0.35) csfx.blub(); };
    const v0 = VIEW('bowl');
    this.cam = { pos: v0.pos.clone(), look: v0.look.clone() };
    this.viewName = 'bowl';
    setCamera(this.cam.pos, this.cam.look);
    // Pip watches from the floor at the end of the counter, fully in view of the opening shot
    this.pip.position.set(5.3, 0, 2.3);
    this.pip.rotation.y = -0.5;
    this.pieces = [];     // on the board (in the board's 'top' space)
    this.floating = [];   // in the soup (soup space)
    this.bits = [];       // little juicy bits from the chops
    this.vegs = [];       // whole vegetables (bowl / flying / on the board)
    this.taught = new Set();
    this.phase = 'intro';
    // the knife: at rest in its block, or held (t: 0 = the block .. 1 = over the board), E: the cut point (board space)
    this.knife = { held: false, t: 0, E: new T.Vector3(0, 0, 0.1), target: new T.Vector3(0, 0, 0.1), n: N1, lift: 0.6, pitch: 0.1, grip: new T.Vector3(), kp: new T.Vector3(), kq: new T.Quaternion() };
    // the board: down on the counter, or held by Bear (pose from his paws)
    this.boardHeld = false;
    this.stoveOn = false;
    this.chops = 0;
    // tap targets: the knob (big and forgiving, audit K2) and the knife (its handle and the block)
    this.knobTap = input.addTap(S.knob || S.hob || S.group, { radius: 0.9, offset: new T.Vector3(0, 0.1, 0.05), onTap: () => this.turnKnob() });
    this.knobTap.enabled = false;
    this.knifeTap = input.addTap(S.kblock || S.knife, { radius: 0.75, offset: new T.Vector3(0, 0.75, 0), press: false, onTap: () => this.takeKnife() });
    this.knifeTap.enabled = false;
    // raw pointer handling for chopping, holding the board, carrying and stirring
    const cv = document.getElementById('c');
    const down = (e) => this.onDown(e), move = (e) => this.onMove(e), up = (e) => this.onUp(e);
    cv.addEventListener('pointerdown', down);
    cv.addEventListener('pointermove', move);
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);
    this.offs.push(() => { cv.removeEventListener('pointerdown', down); cv.removeEventListener('pointermove', move); cv.removeEventListener('pointerup', up); cv.removeEventListener('pointercancel', up); });
    this.offs.push(() => csfx.simmer(false));
    this.fillBowl();
    this.makeFriend();
    if (this.plan.card) this.makeCard();
    if (this.plan.rounds.some((r) => r.stir || r.serve)) this.makeLadle();
    // Bear's paws are posed after the engine's motion layer, right before every render
    this.offs.push(onBeforeRender(() => this.lateHold()));
  }

  // ---------------- camera ----------------
  view(name, dur = 0.85) {
    if (this.viewName === name) return this.wait(0);
    // a demo hand belongs to the old view: it goes as soon as the camera starts to move (the next step brings its own)
    fx.clearHands();
    if (this.demoing) { this.demoing = false; this.demoId = (this.demoId || 0) + 1; }
    const v = VIEW(name);
    this.viewName = name;
    const p0 = this.cam.pos.clone(), l0 = this.cam.look.clone();
    const id = (this.camId = (this.camId || 0) + 1);
    this.camMoving = true;
    return this.s.anim(dur, (e) => {
      if (this.camId !== id) return;
      this.cam.pos.lerpVectors(p0, v.pos, e);
      this.cam.look.lerpVectors(l0, v.look, e);
      setCamera(this.cam.pos, this.cam.look);
    }, Ease.inOut).then(() => { if (this.camId === id) this.camMoving = false; });
  }

  // ---------------- the scene ----------------
  fillBowl() {
    // lay the vegetables out in the bowl: a packing pass on their real footprints so none overlaps another or the wall
    const n = this.plan.bowl.length;
    const list = this.plan.bowl.map((kind, i) => {
      const v = makeVeg(kind);
      if (!v) return null;
      const u = v.userData;
      u.yaw = (u.len > u.dep * 1.6) ? [0.35, -0.5, 1.2, -1.1, 0.1, 2.2][i % 6] : i * 1.3;
      const a = (i / n) * Math.PI * 2 + 0.6, r = n > 2 ? 0.55 : 0.34;
      u.px = Math.cos(a) * r; u.pz = Math.sin(a) * r * 0.85;
      return v;
    }).filter(Boolean);
    const half = (v) => [v.userData.len * IN_BOWL / 2, v.userData.dep * IN_BOWL / 2];
    const ext = (v, ax, az) => { const [hx, hz] = half(v), c = Math.cos(v.userData.yaw), s = Math.sin(v.userData.yaw); return Math.abs(hx * (c * ax - s * az)) + Math.abs(hz * (s * ax + c * az)); };
    const gap = n > 4 ? 0.035 : 0.06;
    for (let it = 0; it < 400; it++) {
      for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
        const A = list[i].userData, B = list[j].userData;
        let pen = Infinity, ax = 0, az = 0;
        for (const [x, z] of AXES) {
          const d = (B.px - A.px) * x + (B.pz - A.pz) * z;
          const ov = ext(list[i], x, z) + ext(list[j], x, z) + gap - Math.abs(d);
          if (ov <= 0) { pen = 0; break; }
          if (ov < pen) { pen = ov; ax = x * Math.sign(d || 1); az = z * Math.sign(d || 1); }
        }
        if (pen > 0) { A.px -= ax * pen / 2; A.pz -= az * pen / 2; B.px += ax * pen / 2; B.pz += az * pen / 2; }
      }
      for (const v of list) {
        const u = v.userData;
        const reach = Math.max(ext(v, 1, 0), ext(v, 0, 1));
        const r = Math.hypot(u.px, u.pz), lim = 0.9 * VBOWL_K - reach;
        if (r > lim && r > 0) { u.px *= lim / r; u.pz *= lim / r; }
        u.px *= 0.997; u.pz *= 0.997;
      }
    }
    for (const v of list) {
      const u = v.userData;
      u.home = new T.Vector3(VBOWL.x + u.px, FLOOR + u.h * IN_BOWL / 2, VBOWL.z + u.pz);
      v.position.copy(u.home);
      v.rotation.y = u.yaw;
      v.scale.setScalar(IN_BOWL);
      this.root.add(v);
      u.drag = input.addDrag(v, {
        radius: Math.max(0.32, u.r * IN_BOWL), minY: TOP + 0.3,
        zones: () => [{ id: 'board', pos: this.top.localToWorld(new T.Vector3(0, 0.2, 0)), radius: 1.6 }],
        onPick: () => this.liftVeg(v),
        onDrop: (z, info) => this.dropVeg(v, z, info),
      });
      u.drag.enabled = false;
      this.vegs.push(v);
    }
  }
  makeFriend() {
    const f = makeAnimal('bear');
    f.scale.setScalar(1.1);
    f.userData.baseScale = 1.1;
    this.root.add(f);
    // Bear stands on his step, already at the board (no walk-in: she can play at once)
    const rig = (this.rig = new BearRig(f, { raise: STEP_Y, z: -1.7, x: FRIEND_AT.x, top: TOP }));
    // at the board: nothing of him below the worktop crosses its back edge, nothing just above it reaches over the
    // board's back edge, nothing at chest height over the pieces' band
    this.boardLimits = [COUNTER_BACK - 0.03, COUNTER_BACK + 0.06, BOARD.z + BAND[0] - 0.12, null];
    // at the pot: his tummy stays behind the pot's back
    this.potLimits = [COUNTER_BACK - 0.03, POT.z - POT_R - 0.06, POT.z - POT_R - 0.06, POT.z - POT_R - 0.06];
    this.zBoard = rig.standZ(this.boardLimits);
    this.zPot = rig.standZ(this.potLimits);
    rig.limits = this.boardLimits;
    rig.z = rig.zTo = this.zBoard;
    // Bear's round ears: stiffer springs so they never sag flat or tear (they bob a little, they don't flop)
    for (const sp of f.userData.springs || []) if (/^ear/.test(sp.b.name)) { sp.k *= 3; sp.grav *= 0.15; sp.damp *= 1.4; sp.max = Math.min(sp.max, 0.3); }
    f.position.set(rig.x, STEP_Y, rig.z);
    f.rotation.y = 0;
    this.friend = f;
  }
  // Level 3: the recipe card is pinned at the side of the view (it travels with the camera, so it is always there):
  // 1 carrot, 2 tomatoes, a ladle (stir) and a bowl (serve); each row gets a green tick when it is done
  makeCard() {
    const card = scProp('prop_ck_card', { border: {}, clip: {} }, { ink: 0.016 });
    if (!card) return;
    const hud = (this.hud = new T.Group());
    const inner = new T.Group();
    inner.add(card);
    card.position.y = -(0.62 + 0.85);         // the card's middle at the HUD's origin
    inner.rotation.x = CARD_TILT;              // stood up straight, facing us
    hud.add(inner);
    hud.scale.setScalar(0.24);
    this.root.add(hud);
    this.cardInner = card;
    const rows = [['carrot'], ['tomato', 'tomato'], ['ladle'], ['soupbowl']];
    this.cardIcons = rows.map((items, i) => {
      const g = new T.Group();
      items.forEach((kind, k) => {
        let o = null;
        if (VEG[kind]) { o = makeVeg(kind); if (o) o.scale.setScalar(0.34 / Math.max(o.userData.len, o.userData.h) * (kind === 'carrot' ? 1.5 : 1)); }
        else if (kind === 'ladle') { o = scProp('prop_ck_ladle', { grip: {} }, { ink: 0.012 }); if (o) { o.scale.setScalar(0.3); o.rotation.set(0.5, 0, -0.5); o.position.set(-0.06, -0.04, 0); } }
        else { o = scProp('prop_bowl', {}, { ink: 0.02 }); if (o) { o.scale.setScalar(0.14); o.position.y = -0.08; } }
        if (!o) return;
        const w = new T.Group();
        w.add(o);
        w.position.x = (k - (items.length - 1) / 2) * 0.36 - 0.1;
        g.add(w);
      });
      g.position.copy(cardRow(i, 0, 0.2));
      g.rotation.x = -CARD_TILT;
      card.add(g);
      return g;
    });
    this.ticks = [];
  }
  placeHud(dt = 0) {
    const h = this.hud;
    if (!h) return;
    // pinned in a top corner: the right one at the bowl and the board (clear of the bowl and everything she drags),
    // the left one at the pot (Bear stands right of it there); it slides over when the camera moves
    const want = ['pot', 'carry', 'serve'].includes(this.viewName) ? -1 : 1;
    this.hudSide = this.hudSide === undefined ? want : this.hudSide + clamp(want - this.hudSide, -dt * 3, dt * 3);
    const d = 2.4, vh = d * Math.tan((camera.fov * Math.PI) / 360), vw = vh * camera.aspect;
    const fwd = new T.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const right = new T.Vector3(1, 0, 0).applyQuaternion(camera.quaternion), up = new T.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
    h.position.copy(camera.position).addScaledVector(fwd, d).addScaledVector(right, (vw - 0.3) * this.hudSide).addScaledVector(up, vh * (this.hudSide > 0 ? 0.3 : 0.12));
    h.quaternion.copy(camera.quaternion);
    h.rotateZ(-0.05);
  }
  tickRow(i) {
    if (!this.plan.card || this.ticks[i]) return;
    const t = scProp('prop_ck_tick', {}, { ink: 0.014 });
    if (!t) return;
    t.position.copy(cardRow(i, 0.44, 0.08));
    t.rotation.x = -CARD_TILT;
    this.cardInner.add(t);
    this.ticks[i] = t;
    popIn(this.s, t, 0.9, 0.45, { sound: false });
    sfx.sparkle();
  }
  // Level 3: Bear's ladle rests in the pot, its handle leaning back toward him
  makeLadle() {
    const l = scProp('prop_ck_ladle', { grip: {} }, { ink: 0.014 });
    if (!l) return;
    l.scale.setScalar(LADLE_K);
    this.ladle = l;
    this.root.add(l);
    this.lad = { cup: new T.Vector3(0.42, 0, -0.38), to: new T.Vector3(0.42, 0, -0.38), held: false, pour: 0, grip: new T.Vector3(), inPot: true, at: null };
    this.ladGoal = () => this.lad.grip;
    // the soup it carries (shown from the dip until it is poured out)
    const dg = new T.CircleGeometry(0.175, 28); dg.rotateX(-Math.PI / 2);
    const disc = new T.Mesh(dg, toonUnique(0xffd98a));
    disc.position.y = -0.03;
    disc.visible = false;
    l.add(disc);
    this.lad.disc = disc;
    this.placeLadle();
  }

  // ---------------- rounds ----------------
  get rd() { return this.plan.rounds[this.round] || {}; }
  async startRound() {
    this.busy = true;
    this.mark('round');
    const rd = this.rd;
    if (rd.veg) return this.startVeg();
    if (rd.stir) return this.startStir();
    if (rd.serve) return this.startServe();
  }
  face(emo, back = 0.8) {
    const fc = this.friend?.userData.face;
    if (!fc) return;
    setFace(fc, emo);
    if (back) this.s.wait(back).then(() => { if (fc.userData.emotion === emo) setFace(fc, 'happy'); });
  }
  // timing log (FEEL-BRIEF rule 0): 'act' when the child's action is done, 'ready' when she can act again
  mark(kind, what = this.phase) {
    const now = performance.now();
    if (kind === 'ready') console.info('COOKT ready', what, Math.round(now - (this.tAct || now)), 'ms after', this.actWhat || '-');
    else { this.tAct = now; this.actWhat = kind === 'round' ? 'round start' : what; }
  }
  // audit K9: the Go! badge comes back at every new step, once the camera has settled
  reArmGo() {
    if (this.goPending || this.dead || this.round === 0 && this.phase === 'pick') return;
    this.goPending = true;
    this.goT0 = performance.now() - 300;
  }

  // ---- 1. pick a veggie ----
  async startVeg() {
    this.phase = 'walk';
    this.onBoard = [];
    this.chops = 0;
    this.need = this.rd.n || 1;
    this.allDiced = null;
    this.view('bowl');
    // the board must be home (Bear may still be bringing it back from the pot)
    if (this.boardHome) { await this.boardHome; this.boardHome = null; }
    if (this.dead) return;
    this.rig.limits = this.boardLimits;
    this.rig.zTo = this.zBoard;
    this.rig.xTo = FRIEND_AT.x;
    this.rig.leanTo = 0;
    this.rig.look(null);
    this.phase = 'pick';
    for (const v of this.vegs) if (v.userData.where !== 'board') v.userData.drag.enabled = true;
    this.busy = false;
    this.idle = 0;
    this.stuck = 0;
    this.mark('ready');
    this.prompt();
    if (!this.teach('pick') && this.level === 0) for (const v of this.vegs) if (v.userData.where !== 'board') this.addHalo(v, 0.5);
    if (this.cardIcons) this.addHalo(this.cardIcons[this.cardRowNow()], 0.22);
  }
  pickText() {
    const rd = this.rd, V_ = VEG[rd.veg];
    if (this.plan.ask === 'any') return this.round === 0 ? SAY.any : `Now the ${V_.name}!`;
    if (this.plan.ask === 'colour') return `Find the ${V_.word} one!`;
    if (this.onBoard.length && this.need > 1) return `One more ${V_.name}!`;
    return this.round === 0 ? 'Look at the card! A carrot!' : (this.need === 2 ? 'Now two tomatoes!' : `Now a ${V_.name}!`);
  }
  // the vegetable a helper would pick
  wantVeg() {
    const free = this.vegs.filter((v) => v.userData.where !== 'board' && !v.userData.busy);
    if (this.plan.ask === 'any') return free.find((v) => v.userData.veg === this.rd.veg) || free[0] || null;
    return free.find((v) => v.userData.veg === this.rd.veg) || null;
  }
  wrongVeg() {
    if (this.plan.ask === 'any') return null;
    return this.vegs.find((v) => v.userData.where !== 'board' && !v.userData.busy && v.userData.veg !== this.rd.veg) || null;
  }
  liftVeg(v) {
    this.s.stop(v.scale);
    this.s.tween(v.scale, { x: 0.85, y: 0.85, z: 0.85 }, 0.15, Ease.out);
    this.clearHints();
    fx.clearHands();
    v.userData.picked = true;
  }
  dropVeg(v, zone, { tapped } = {}) {
    if (!zone && !tapped) { this.vegBack(v); return; }
    this.pickVeg(v);
  }
  vegBack(v) {
    const u = v.userData;
    u.busy = true;
    const a = v.position.clone(), b = u.home, k0 = v.scale.x;
    return this.s.anim(0.45, (e, p) => { v.position.lerpVectors(a, b, e); v.position.y += Math.sin(p * Math.PI) * 0.4; v.scale.setScalar(k0 + (IN_BOWL - k0) * e); }, Ease.out)
      .then(() => { u.busy = false; u.picked = false; });
  }
  // test hook too: choose a vegetable (wrong ones hop back with a gentle word)
  async pickVeg(v) {
    const u = v.userData;
    if (u.busy || u.where === 'board') return;
    if (this.phase !== 'pick' || this.busy || this.dead) { this.vegBack(v); return; }
    const want = this.rd.veg;
    // Level 1 takes any veggie (the round becomes that veggie's round)
    if (this.plan.ask === 'any' && u.veg !== want) {
      const other = this.plan.rounds.findIndex((r, i) => i > this.round && r.veg === u.veg);
      if (other > this.round) { const R = this.plan.rounds; [R[this.round], R[other]] = [R[other], R[this.round]]; }
    } else if (this.plan.ask !== 'any' && u.veg !== want) {
      this.vegBack(v);
      this.face('calm', 0.8);
      if (this.plan.ask === 'colour') this.redirect(`Find the ${VEG[want].word} one!`, { obj: v });
      else { this.redirect(SAY.card, { obj: v }); if (this.cardIcons) this.addHalo(this.cardIcons[this.cardRowNow()], 0.25); }
      return;
    }
    // onto the board
    u.busy = true;
    u.where = 'board';
    u.drag.enabled = false;
    input.remove(u.drag);
    this.clearHints();
    fx.clearHands();
    this.idle = 0;
    const i = this.onBoard.length;
    this.onBoard.push(v);
    const slot = this.need > 1 ? new T.Vector3((i - (this.need - 1) / 2) * 0.95, 0, 0.05) : new T.Vector3(0, 0, 0.05);
    slot.y = u.h / 2;
    const done = this.onBoard.length >= this.need;
    if (done) { this.busy = true; this.mark('act', 'veg on board'); for (const o of this.vegs) if (o.userData.drag) o.userData.drag.enabled = false; this.view('board', 0.9); }
    // Bear watches it land, and sidles over toward his knife block
    this.rig.look(this.top.localToWorld(slot.clone()));
    if (done) this.rig.xTo = KBLOCK.x - 0.95;
    // an easy arc over to the board, settling into its lying pose
    const a = v.position.clone(), to = this.top.localToWorld(slot.clone());
    const r0 = v.rotation.y, k0 = v.scale.x;
    sfx.swoosh();
    await this.s.anim(0.75, (e, p) => {
      v.position.lerpVectors(a, to, e);
      v.position.y += Math.sin(p * Math.PI) * 1.1;
      v.rotation.y = r0 * (1 - e);
      v.scale.setScalar(k0 + (1 - k0) * e);
    }, Ease.inOut);
    if (this.dead) return;
    v.rotation.y = 0;
    v.scale.setScalar(1);
    csfx.knock();
    // it becomes a cuttable piece on the board, resting on the board top
    const pc = makePiece(bake(v, this.top, { skip: ['shine'] }), { kind: u.veg, ink: 0.016 });
    measure(pc);
    pc.gen = 0;
    pc.mesh.position.set(slot.x, -pc.y0, slot.z);
    this.top.add(pc.mesh);
    this.pieces.push(pc);
    this.root.remove(v);
    this.vegs = this.vegs.filter((o) => o !== v);
    // a little squash as it lands
    const m = pc.mesh;
    this.s.anim(0.25, (_, p) => { const q = 1 - 0.12 * Math.sin(p * Math.PI); m.scale.set(1 / Math.sqrt(q), q, 1 / Math.sqrt(q)); }).then(() => m.scale.setScalar(1));
    if (this.need > 1) {
      const n = this.onBoard.length;
      fx.float(this.top.localToWorld(new T.Vector3(slot.x, 1.0, 0.3)), String(n), { color: NUM_COL[(n - 1) % 3], size: 9 });
      sfx.note(n - 1);
      this.say(NUM[n - 1] || String(n), { max: 0.9 });
    }
    if (!done) { u.busy = false; return; }
    if (this.plan.card) this.tickRow(this.cardRowNow());
    this.face('joy', 0.7);
    await this.wait(0.3);
    this.toKnife();
  }
  cardRowNow() { return Math.min(3, this.round); }

  // ---- 2. pick up the knife ----
  toKnife() {
    this.phase = 'knife';
    this.knifeTap.enabled = true;
    this.busy = false;
    this.idle = 0;
    this.stuck = 0;
    this.rig.look(KNIFE_REST);
    this.mark('ready');
    this.prompt();
    if (!this.teach('knife')) this.addHalo(this.S.knife, 0.6);
  }
  async takeKnife() {
    if (this.phase !== 'knife' || this.busy || this.dead) return;
    this.busy = true;
    this.mark('act', 'knife tap');
    this.knifeTap.enabled = false;
    this.clearHints();
    fx.clearHands();
    const K = this.knife, R = this.rig;
    // Bear reaches for the handle in the block...
    this.kRestGrip = KNIFE_REST.clone().add(KNIFE_GRIP.clone().multiplyScalar(KNIFE_K).applyQuaternion(KNIFE_REST_Q));
    R.plan([{ i: 1, p: this.kRestGrip }], { leanMax: 0.3 });
    R.hold(1, () => K.grip, 0.32);
    K.t = 0;
    K.held = true;
    const c = this.biggest();
    K.target.set(c ? c.mesh.position.x : 0, 0, c ? c.mesh.position.z : 0.05);
    K.E.copy(K.target);
    K.n = N1;
    K.lift = this.hoverLift();
    K.pitch = 0;
    while (!this.dead && R.w[1] < 0.999) await this.wait(0.03);
    if (this.dead) return;
    sfx.pup();
    // ...draws it up out of the block and brings it over the vegetable
    this.planKnife(true);
    await this.s.anim(0.7, (e) => { K.t = e; }, Ease.inOut);
    if (this.dead) return;
    K.t = 1;
    this.phase = 'chop';
    this.sinceChop = 0;
    this.busy = false;
    this.idle = 0;
    this.stuck = 0;
    this.mark('ready');
    this.prompt();
    this.teach('chop');
  }
  // the edge's height over the board top while hovering: just clear of the tallest piece
  // (never so high that his paw on the handle comes up near his chin)
  hoverLift() { let h = 0; for (const pc of this.pieces) h = Math.max(h, ptop(pc)); return Math.min(h + 0.13, MAX_LIFT); }
  biggest() {
    let best = null, bv = 0;
    for (const pc of this.pieces) { const v = (pc.hi[0] - pc.lo[0]) * (pc.hi[1] - pc.lo[1]) * (pc.y1 - pc.y0); if (v > bv) { bv = v; best = pc; } }
    return best;
  }
  // The knife held over the board: the contact point E (board space) on its edge at height lift, the blade along the
  // cut plane (normal n) with the handle toward Bear, tipped up by pitch. Sets K.kp / K.kq (pose) and K.grip (world).
  knifeHeld(K, outP, outQ, E = K.E, lift = K.lift, pitch = K.pitch, n = K.n) {
    const at = this.top.localToWorld(new T.Vector3(E.x, lift, E.z));
    const b = new T.Vector3(-n[1], 0, n[0]);
    if (b.z > 0) b.negate();
    // how much of the blade lies between the cut and the handle: the handle as near Bear's favourite spot as can be
    const off = clamp((at.z - GRIP_Z) / -b.z, (KNIFE_GRIP.x - XE[1]) * KNIFE_K, (KNIFE_GRIP.x - XE[0]) * KNIFE_K);
    const xe = KNIFE_GRIP.x - off / KNIFE_K;
    const X = b.clone().multiplyScalar(Math.cos(pitch)).addScaledVector(UP, Math.sin(pitch));
    const Y = b.clone().multiplyScalar(-Math.sin(pitch)).addScaledVector(UP, Math.cos(pitch));
    const Z = new T.Vector3().crossVectors(X, Y);
    outQ.setFromRotationMatrix(new T.Matrix4().makeBasis(X, Y, Z));
    outP.copy(at).addScaledVector(X, -xe * KNIFE_K);
    return xe;
  }
  // the knife's pose this frame (rest / on the way / held), and where its handle is
  poseKnife() {
    const K = this.knife, k = this.S.knife;
    if (!K.held && K.t <= 0) {
      k.position.copy(KNIFE_REST); k.quaternion.copy(KNIFE_REST_Q);
    } else {
      const p1 = new T.Vector3(), q1 = new T.Quaternion();
      this.knifeHeld(K, p1, q1);
      if (K.t >= 1) { k.position.copy(p1); k.quaternion.copy(q1); }
      else {
        // up off its rest, then over to the board (it never comes near Bear's face)
        const e = K.t, up = KNIFE_REST.clone().add(KNIFE_LIFT);
        up.y = Math.max(up.y, p1.y + 0.02);
        const a = e < 0.4 ? KNIFE_REST.clone().lerp(up, Ease.out(e / 0.4)) : up.clone().lerp(p1, Ease.inOut((e - 0.4) / 0.6));
        k.position.copy(a);
        k.quaternion.slerpQuaternions(KNIFE_REST_Q, q1, Ease.inOut(clamp((e - 0.25) / 0.75, 0, 1)));
      }
    }
    K.grip.copy(KNIFE_GRIP).multiplyScalar(KNIFE_K).applyQuaternion(k.quaternion).add(k.position);
  }
  // Bear stands where he can hold the knife over its cut point
  planKnife(force = false) {
    const K = this.knife;
    if (!force && K.planned && K.planned.distanceTo(K.E) < 0.12 && K.plannedN === K.n) return;
    K.planned = (K.planned || new T.Vector3()).copy(K.E);
    K.plannedN = K.n;
    const p = new T.Vector3(), q = new T.Quaternion();
    this.knifeHeld(K, p, q, K.E, this.hoverLift(), 0);
    const g = KNIFE_GRIP.clone().multiplyScalar(KNIFE_K).applyQuaternion(q).add(p);
    this.rig.plan([{ i: 1, p: g }], { leanMax: 0.25 });
    // he watches the cut, but keeps his head up (well away from the blade)
    this.rig.look(this.top.localToWorld(K.E.clone()).setY(TOP + 1.0));
  }

  // ---- 3. chop ----
  // a point on the board under the finger (board 'top' space), or null
  boardPoint(x, y, planeY = BOARD.y + BOARD_TOP) {
    const w = rayY(x, y, planeY);
    return w ? this.top.worldToLocal(w) : null;
  }
  onDown(e) {
    this.ptr = { down: true, id: e.pointerId, x: e.clientX, y: e.clientY };
    if (this.dead) return;
    if (this.demoing) { if (performance.now() < (this.demoLock || 0)) return; this.demoing = false; fx.clearHands(); }
    this.idle = 0;
    this.stuck = 0;
    if (this.phase === 'chop' && !this.busy) {
      const p = this.boardPoint(e.clientX, e.clientY);
      if (!p) return;
      const out = Math.max(Math.abs(p.x) - BW, Math.abs(p.z) - BD);
      if (out > (this.plan.reach > 2 ? 3 : 0.6)) return;
      this.press = { id: e.pointerId, last: p.clone() };
      this.aimKnife(p);
      this.requestChop(p);
    } else if (this.phase === 'scoop' && !this.busy) {
      const p = this.boardPoint(e.clientX, e.clientY);
      if (!p) return;
      const out = Math.max(Math.abs(p.x) - BW, Math.abs(p.z) - BD);
      if (out > (this.plan.reach > 2 ? 3 : 0.8)) return;
      this.press = { id: e.pointerId };
      this.startHold();
    } else if (this.phase === 'carry' && !this.busy) {
      // Bear holds the board up: press near it to lead him on
      const c = this.S.carrier.position, sp = project(c.clone().add(new T.Vector3(0, 0.2, 0)));
      if (Math.hypot(sp.x - e.clientX, sp.y - e.clientY) > Math.min(innerWidth, innerHeight) * 0.35) return;
      this.press = { id: e.pointerId };
      this.carrying = true;
      fx.clearHands();
      this.followPointer(e.clientX, e.clientY);
    } else if (this.phase === 'stir' && !this.busy) {
      this.press = { id: e.pointerId };
      if (this.stirErrorless) { this.stirAuto(); return; }
      this.stirAt(e.clientX, e.clientY, true);
    }
  }
  onMove(e) {
    if (this.ptr && this.ptr.id === e.pointerId) { this.ptr.x = e.clientX; this.ptr.y = e.clientY; }
    if (this.dead || !this.press || e.pointerId !== this.press.id) return;
    this.idle = 0;
    if (this.phase === 'chop') {
      const p = this.boardPoint(e.clientX, e.clientY);
      if (!p) return;
      this.aimKnife(p);
      // a swipe chops along the way
      if (p.distanceTo(this.press.last) > 0.3) { this.press.last.copy(p); this.requestChop(p); }
    } else if (this.phase === 'carry' && this.carrying) this.followPointer(e.clientX, e.clientY);
    else if (this.phase === 'stir') this.stirAt(e.clientX, e.clientY);
  }
  onUp(e) {
    if (this.ptr && this.ptr.id === e.pointerId) this.ptr.down = false;
    if (!this.press || e.pointerId !== this.press.id) return;
    this.press = null;
    if (this.phase === 'scoop') this.hold = false;
    else if (this.phase === 'carry' && this.carrying) { this.carrying = false; this.letGo(); }
    else if (this.phase === 'stir') this.stirLast = null;
  }
  aimKnife(p) { this.knife.target.set(clamp(p.x, -BW + 0.2, BW - 0.2), 0, clamp(p.z, BAND[0], BAND[1])); }
  requestChop(p) {
    if (this.phase !== 'chop' || !this.knife.held || this.knife.t < 1) return;
    if (this.chopping) { this.queued = p.clone(); return; }
    this.doChop(p);
  }
  // test hook: n chops at random spots on the vegetable
  chopAuto(n = 3) {
    if (this.phase !== 'chop') return;
    for (let i = 0; i < n; i++) {
      this.s.wait(i * 0.45).then(() => {
        if (this.phase !== 'chop') return;
        const c = this.biggest();
        if (!c) return;
        const p = c.mesh.position.clone().add(new T.Vector3((Math.random() - 0.5) * 0.3, 0, (Math.random() - 0.5) * 0.2));
        this.aimKnife(p);
        this.requestChop(p);
      });
    }
  }
  finishChop() { if (this.phase === 'chop' && !this.chopping) this.endChop(); }

  // choose what the knife cuts: the cuttable piece nearest the finger, and the blade direction it is longest across
  chopPlan(p) {
    const reach = this.plan.reach;
    let best = null, bd = Infinity;
    for (const pc of this.pieces) {
      if (pc.anim) continue;
      const c = pc.mesh.position;
      const r = Math.max(pc.hi[0] - pc.lo[0], pc.hi[1] - pc.lo[1]) / 2;
      const d = Math.max(0, Math.hypot(c.x - p.x, c.z - p.z) - r);
      if (d > reach) continue;
      let ok = false;
      for (const n of [N1, N2]) { const [a, b] = extentAlong(pc, n[0], n[1]); if (b - a >= MIN * 2 + 0.03) ok = true; }
      if (!ok) continue;
      if (d < bd) { bd = d; best = pc; }
    }
    if (!best || this.pieces.length >= MAXP || this.boardFull()) {
      // nothing left to cut here: the knife still comes down (on the nearest piece, or the bare board)
      let near = null, nd = Infinity;
      for (const pc of this.pieces) { const d = Math.hypot(pc.mesh.position.x - p.x, pc.mesh.position.z - p.z); if (d < nd) { nd = d; near = pc; } }
      const at = near && nd < Math.max(1, reach) ? near.mesh.position.clone() : p.clone();
      at.x = clamp(at.x, -BW + 0.2, BW - 0.2); at.z = clamp(at.z, BAND[0], BAND[1]);
      return { n: this.knife.n, d: at.x * this.knife.n[0] + at.z * this.knife.n[1], at: at.setY(0), cut: [] };
    }
    // the direction it is longest across (stay with the current one while it still works)
    const ext = (n) => { const [a, b] = extentAlong(best, n[0], n[1]); return b - a; };
    let n = this.knife.n;
    const other = n === N1 ? N2 : N1;
    if (ext(n) < MIN * 2 + 0.03 || ext(other) > ext(n) * 1.7) n = other;
    const [a, b] = extentAlong(best, n[0], n[1]);
    // (a tall piece - a whole tomato, a broccoli - is cut through its middle, so both halves can lie down flat)
    const d = best.y1 - best.y0 > 0.36 ? (a + b) / 2 : clamp(p.x * n[0] + p.z * n[1], a + MIN, b - MIN);
    // the blade's line: through the cut point nearest the target's middle
    const c = best.mesh.position;
    const off = d - (c.x * n[0] + c.z * n[1]);
    const at = new T.Vector3(c.x + n[0] * off, 0, c.z + n[1] * off);
    // the blade covers [-tip, heel] along its length from the cut point (toward the handle is +)
    const xe = this.knifeHeld(this.knife, new T.Vector3(), new T.Quaternion(), at, 0, 0, n);
    const bl = this.bladeSpan(n, xe);
    // every piece under the blade that straddles the plane is cut too
    const cut = [];
    for (const pc of this.pieces) {
      if (pc.anim) continue;
      const [lo, hi] = extentAlong(pc, n[0], n[1]);
      if (lo + MIN > d || hi - MIN < d) continue;
      const along = (pc.mesh.position.x - at.x) * bl.bx + (pc.mesh.position.z - at.z) * bl.bz;
      const r = Math.max(pc.hi[0] - pc.lo[0], pc.hi[1] - pc.lo[1]) / 2;
      if (along < bl.a - r * 0.5 || along > bl.b + r * 0.5) continue;
      cut.push(pc);
    }
    if (!cut.includes(best)) cut.push(best);
    return { n, d, at, cut, bl };
  }
  // (once the pieces would cover most of the board, the knife only taps: no more new pieces to crowd it)
  boardFull() {
    let a = 0;
    for (const pc of this.pieces) a += (pc.hi[0] - pc.lo[0]) * (pc.hi[1] - pc.lo[1]);
    return a * 0.75 > 0.78 * (2 * (BW - 0.06)) * (BAND[1] - BAND[0] + 0.12);   // (boxes overstate round pieces)
  }
  // the blade along its length (board space): direction toward the handle, and how far it reaches each way
  bladeSpan(n, xe) {
    let bx = -n[1], bz = n[0];
    if (bz > 0) { bx = -bx; bz = -bz; }
    return { bx, bz, a: -(xe + 0.66) * KNIFE_K, b: (0.62 - xe) * KNIFE_K };
  }
  async doChop(p) {
    this.chopping = true;
    this.queued = null;
    this.sinceChop = 0;
    this.clearHints();
    fx.clearHands();
    const plan = this.chopPlan(p);
    const K = this.knife;
    // glide over the spot and turn the blade (Bear moves with it)
    const E0 = K.E.clone(), n0 = K.n, l0 = K.lift, lift = this.hoverLift();
    K.target.copy(plan.at);
    K.n = plan.n;
    const turn = n0 !== plan.n;
    this.planKnife();
    await this.s.anim(turn ? 0.2 : 0.12, (e) => { K.E.lerpVectors(E0, plan.at, e); K.lift = l0 + (lift - l0) * e; }, Ease.out);
    if (this.dead) return;
    // pieces under the blade that are not being cut hop out of its way
    this.clearBlade(plan);
    // a little lift before the drop (the weight of the chop), then down onto the board
    await this.s.anim(0.08, (e) => { K.lift = lift + 0.07 * e; K.pitch = 0.04 * e; }, Ease.out);
    if (this.dead) return;
    // (nothing to cut here: the blade comes down onto whatever lies under it, never through it; and the handle
    // rocks up over any piece between the cut and Bear's paw, the tip resting on the board)
    const rock = this.handleClear(plan);
    const bottom = Math.max(plan.cut.length ? 0.004 : this.restUnder(plan), rock.tipDrop + 0.004);
    await this.s.anim(0.09, (e) => { K.lift = (lift + 0.07) * (1 - e) + bottom * e; K.pitch = 0.04 * (1 - e) + rock.p * e; }, Ease.in);
    if (this.dead) return;
    this.impact(plan);
    await this.wait(0.06);
    await this.s.anim(0.18, (e) => { K.lift = bottom + (lift - bottom) * e; K.pitch = rock.p * (1 - e); }, Ease.out);
    if (this.dead) return;
    this.chopping = false;
    if (this.chops >= MAX_CHOPS) { this.endChop(); return; }
    if (this.queued) { const q = this.queued; this.queued = null; this.doChop(q); }
  }
  // how far the knife must rock (handle up) so its handle clears every piece between the cut and Bear's paw
  handleClear(plan) {
    const n = plan.n, xe = this.knifeHeld(this.knife, new T.Vector3(), new T.Quaternion(), plan.at, 0, 0, n), bl = this.bladeSpan(n, xe);
    let sinp = 0;
    for (const pc of this.pieces) {
      if (plan.cut.includes(pc)) continue;
      const dx = pc.mesh.position.x - plan.at.x, dz = pc.mesh.position.z - plan.at.z;
      const along = dx * bl.bx + dz * bl.bz, across = Math.abs(dx * n[0] + dz * n[1]);
      const r = Math.max(pc.hi[0] - pc.lo[0], pc.hi[1] - pc.lo[1]) / 2;
      if (across > r + 0.12 || along < 0.05) continue;
      const s = Math.max(0.12, along - r);
      sinp = Math.max(sinp, (ptop(pc) + 0.03 - 0.13 * KNIFE_K) / s);
    }
    const p = Math.min(0.5, Math.asin(clamp(sinp, 0, 0.95)));
    return { p, tipDrop: (xe + 0.66) * KNIFE_K * Math.sin(p) };
  }
  // the height of the tallest piece lying under the blade (board space), so a stroke with nothing to cut rests on it
  restUnder(plan) {
    const n = plan.n, xe = this.knifeHeld(this.knife, new T.Vector3(), new T.Quaternion(), plan.at, 0, 0, n), bl = this.bladeSpan(n, xe);
    let h = 0.004;
    for (const pc of this.pieces) {
      const dx = pc.mesh.position.x - plan.at.x, dz = pc.mesh.position.z - plan.at.z;
      const along = dx * bl.bx + dz * bl.bz, across = Math.abs(dx * n[0] + dz * n[1]);
      const r = Math.max(pc.hi[0] - pc.lo[0], pc.hi[1] - pc.lo[1]) / 2;
      if (along > bl.a - r && along < bl.b + r && across < r + 0.03) h = Math.max(h, ptop(pc) + 0.01);
    }
    return h;
  }
  clearBlade(plan) {
    const n = plan.n, bl = plan.bl || this.bladeSpan(n, 0.2);
    for (const pc of this.pieces) {
      if (pc.anim || plan.cut.includes(pc)) continue;
      const [lo, hi] = extentAlong(pc, n[0], n[1]);
      if (lo > plan.d + 0.03 || hi < plan.d - 0.03) continue;
      const along = (pc.mesh.position.x - plan.at.x) * bl.bx + (pc.mesh.position.z - plan.at.z) * bl.bz;
      if (along < bl.a - 0.15 || along > bl.b + 0.15) continue;
      // move to whichever side its middle is on, just clear of the blade
      const mid = (lo + hi) / 2, side = mid >= plan.d ? 1 : -1;
      const shift = side > 0 ? plan.d + 0.035 - lo : plan.d - 0.035 - hi;
      this.hopPiece(pc, n[0] * shift, n[1] * shift, 0.08);
    }
  }
  impact(plan) {
    this.chops++;
    const n = plan.n;
    let made = 0, juicy = false;
    const first = this.pieces.length === 1 && plan.cut.length === 1;
    for (const pc of plan.cut) {
      if (this.pieces.length >= MAXP) break;
      const halves = cutPiece(pc, n[0], n[1], plan.d, VEG[pc.kind].bands);
      if (!halves) continue;
      made++;
      if (!pc.juiced) juicy = true;     // juice only on the first cut of each piece (SATISFACTION 19.4)
      // swap the piece for its two halves
      this.pieces = this.pieces.filter((x) => x !== pc);
      disposePiece(pc);
      halves.forEach((h, i) => {
        h.gen = (pc.gen || 0) + 1;
        h.sid = this.sidN = (this.sidN || 0) + 1;
        h.juiced = true;
        this.top.add(h.mesh);
        this.pieces.push(h);
        h.mesh.position.y = -h.y0;
        const s = i ? 1 : -1;
        // the two halves part a little; a thin standing slice flops over onto its back, cut face up
        const thick = (() => { const [a, b] = extentAlong(h, n[0], n[1]); return b - a; })();
        const tall = h.y1 - h.y0;
        if (tall > thick * 1.3 && thick < 0.44) this.tipPiece(h, n, s, thick, tall);
        else this.hopPiece(h, n[0] * s * 0.035, n[1] * s * 0.035, 0.05);
      });
    }
    // feel: one chop sound, the board dips, a few juicy bits on a fresh cut
    const at = plan.at.clone();
    const onPiece = made || this.pieces.some((pc) => Math.hypot(pc.mesh.position.x - at.x, pc.mesh.position.z - at.z) < 0.3);
    if (onPiece) csfx.chop(first); else csfx.knock();
    const kind = (plan.cut[0] || this.pieces[0])?.kind;
    if (juicy && kind) this.juice(at, VEG[kind].bit, Math.min(4, 1 + made));
    const c = this.S.carrier;
    if (!this.boardHeld) this.s.anim(0.16, (_, p) => { c.position.y = BOARD.y - Math.sin(p * Math.PI) * 0.018; }).then(() => { if (!this.boardHeld) c.position.y = BOARD.y; });
    if (made && Math.random() < 0.3) this.face('joy', 0.5);
    if (this.chops === 3 || this.chops % 25 === 0) this.say('Chop, chop, chop!', { voice: false, max: 0.5 });
    if (this.pieces.every((pc) => (pc.gen || 0) >= 3)) this.allDiced = this.allDiced || performance.now();
  }
  hopPiece(pc, dx, dz, h) {
    pc.anim = true;
    const m = pc.mesh, a = m.position.clone();
    return this.s.anim(0.18, (e, p) => { m.position.x = a.x + dx * e; m.position.z = a.z + dz * e; m.position.y = -pc.y0 + (pc.base || 0) + Math.sin(p * Math.PI) * h; }, Ease.out)
      .then(() => { m.position.y = -pc.y0 + (pc.base || 0); pc.anim = false; });
  }
  // a thin standing slice tips over away from the cut so its new face looks up
  tipPiece(pc, n, s, thick, tall) {
    pc.anim = true;
    const m = pc.mesh;
    const cn = new T.Vector3(-s * n[0], 0, -s * n[1]);
    const axis = new T.Vector3().crossVectors(cn, new T.Vector3(0, 1, 0)).normalize();
    const q0 = m.quaternion.clone(), qr = new T.Quaternion();
    const a = m.position.clone();
    const away = (tall - thick) / 2 + 0.03;
    const tx = n[0] * s * away, tz = n[1] * s * away;
    const qEnd = new T.Quaternion().setFromAxisAngle(axis, Math.PI / 2).multiply(q0);
    m.quaternion.copy(qEnd); measure(pc);
    const yEnd = -pc.y0 + (pc.base || 0);
    m.quaternion.copy(q0); measure(pc);
    const yStart = -pc.y0 + (pc.base || 0);
    return this.s.anim(0.3, (e, p) => {
      qr.setFromAxisAngle(axis, Math.PI / 2 * e);
      m.quaternion.copy(qr).multiply(q0);
      m.position.x = a.x + tx * e; m.position.z = a.z + tz * e;
      m.position.y = yStart + (yEnd - yStart) * e + Math.sin(p * Math.PI) * 0.06;
    }, Ease.inOut).then(() => {
      m.quaternion.copy(qEnd);
      measure(pc);
      m.position.y = -pc.y0 + (pc.base || 0);
      pc.anim = false;
    });
  }
  juice(at, col, n) {
    for (let i = 0; i < n; i++) {
      if (this.bits.length > 24) break;
      const b = new T.Mesh(geo.sphere(1, 8, 6), toon(col));
      const s = 0.022 + Math.random() * 0.018;
      b.scale.setScalar(s);
      b.position.set(at.x + (Math.random() - 0.5) * 0.3, 0.12, at.z + (Math.random() - 0.5) * 0.3);
      this.top.add(b);
      const a = Math.random() * Math.PI * 2, sp = 0.4 + Math.random() * 0.5;
      this.bits.push({ m: b, s, v: new T.Vector3(Math.cos(a) * sp, 1.1 + Math.random() * 0.7, Math.sin(a) * sp), t: 0, down: false });
    }
  }
  async endChop() {
    if (this.phase !== 'chop') return;
    this.phase = 'scoopWait';
    this.busy = true;
    this.press = null;
    this.mark('act', 'chopping done');
    this.clearHints();
    fx.clearHands();
    // Bear puts the knife back in its block
    const K = this.knife, R = this.rig;
    R.plan([{ i: 1, p: this.kRestGrip }], { leanMax: 0.3 });
    const p = this.S.knife.position.clone(), q = this.S.knife.quaternion.clone();
    K.held = false;
    this.knifeBack = { p, q };
    await this.s.anim(0.6, (e) => { K.t = 1 - e; }, Ease.inOut);
    if (this.dead) return;
    this.knifeBack = null;
    K.t = 0;
    csfx.knock();
    R.free(1, 0.3);
    R.look(this.top.localToWorld(new T.Vector3(0, 0, 0)));
    R.xTo = BOARD.x;
    this.phase = 'scoop';
    this.gather = 0;
    this.hold = false;
    this.busy = false;
    this.idle = 0;
    this.stuck = 0;
    this.mark('ready');
    this.prompt();
    this.teach('scoop');
  }

  // ---- 4. scoop, lift, carry, tip ----
  startHold() {
    this.hold = true;
    csfx.scrape();
    fx.clearHands();
    this.say('Scoop!', { voice: false, max: 0.6 });
  }
  // where Bear's paws hold the board (carrier space): its back edge, either side
  // (at the back corners, beside the pile of pieces, so the paws show)
  boardGrips() { return [new T.Vector3(-0.8, BOARD_TOP + 0.06, -BD + 0.1), new T.Vector3(0.8, BOARD_TOP + 0.06, -BD + 0.1)]; }
  // the board's planned pose while Bear has it: B.pos / B.tilt (about its front edge) / B.roll
  poseBoard() {
    const B = this.bp, c = this.S.carrier;
    if (!B) return;
    c.position.copy(B.pos);
    c.rotation.set(0, 0, B.roll || 0);
    if (B.tilt) {
      // tip about the front edge: the back edge (Bear's paws) rises
      const pivot = new T.Vector3(0, 0, BD);
      c.rotation.x = -B.tilt;
      c.updateMatrix();
      const moved = pivot.clone().applyEuler(c.rotation);
      c.position.add(pivot.clone().sub(moved));
    }
    c.updateMatrixWorld(true);
    B.g = this.boardGrips().map((g) => c.localToWorld(g));
  }
  async lift() {
    this.phase = 'lift';
    this.busy = true;
    this.hold = false;
    fx.clearHands();
    this.mark('act', 'board held');
    csfx.scrape();
    const c = this.S.carrier, R = this.rig;
    this.bp = { pos: c.position.clone(), tilt: 0, roll: 0 };
    this.poseBoard();
    // Bear leans in, takes the board's back edge in both paws...
    R.plan(this.bp.g.map((p, i) => ({ i, p })), { leanMax: 0.45 });
    const BP = this.bp;
    R.hold(0, () => BP.g[0], 0.3);
    R.hold(1, () => BP.g[1], 0.3);
    R.look(c.position.clone().add(new T.Vector3(0, 0.3, 0)));
    while (!this.dead && (R.w[0] < 0.999 || R.w[1] < 0.999 || Math.abs(R.x - R.xTo) > 0.04)) await this.wait(0.03);
    if (this.dead) return;
    this.boardHeld = true;
    sfx.whoosh();
    this.view('carry', 0.9);
    // ...and lifts it up over the counter, stepping back a little so it clears his chin
    const a = this.bp.pos.clone(), up = a.clone().setY(CARRY_LOW);
    R.limits = this.potLimits;
    R.zTo = this.zPot;
    R.leanTo = 0;
    await this.s.anim(0.6, (e) => { this.bp.pos.lerpVectors(a, up, e); }, Ease.inOut);
    if (this.dead) return;
    R.look(POT.clone().setY(POT_RIM + 0.8));          // (head up: his face stays clear over the board)
    this.phase = 'carry';
    this.carryX = this.bp.pos.x;
    this.busy = false;
    this.idle = 0;
    this.stuck = 0;
    this.drops = 0;
    this.mark('ready');
    if (this.press) { this.carrying = true; this.say(SAY.carry, { max: 1.2 }); }
    else this.prompt();
    this.teach('carry');
  }
  followPointer(x, y) {
    const w = rayY(x, y, CARRY_Y);
    if (!w) return;
    this.carryX = clamp(w.x, POT.x, BOARD.x);
  }
  overPot() { return this.S.carrier.position.x < POT.x + 0.75; }
  letGo() {
    if (this.phase !== 'carry') return;
    if (this.overPot()) { this.tip(); return; }
    this.drops++;
    if (this.drops >= 2 || this.errorlessOn) { this.tip(); return; }
    this.prompt();
    this.showHint(false);
  }
  // test hook: the whole scoop - gather, lift, carry over, tip
  async scoopToPot() {
    if (this.phase === 'scoop' && !this.busy) { this.gather = 1; await this.lift(); }
    if (this.phase === 'carry' && !this.busy) this.tip();
  }
  async tip() {
    if (this.phase !== 'carry') return;
    this.phase = 'tip';
    this.busy = true;
    this.carrying = false;
    this.mark('act', 'board over pot');
    this.clearHints();
    fx.clearHands();
    const B = this.bp, R = this.rig;
    // Bear walks the board over the pot...
    this.carryX = POT.x;
    this.view('pot', 1.0);
    R.look(POT.clone().setY(POT_RIM + 0.8));
    while (!this.dead && Math.abs(B.pos.x - POT.x) > 0.03) await this.wait(0.03);
    if (this.dead) return;
    // ...a held breath, then he tips it (the back edge up), and the pieces slide off the front into the soup
    await this.beat(null, 0.3);
    sfx.swoosh();
    await this.s.anim(0.4, (e) => { B.tilt = TILT * e; }, Ease.inOut);
    if (this.dead) return;
    const list = this.pieces.slice();
    this.pieces = [];
    const kind = list[0]?.kind;
    list.sort((p, q) => q.mesh.position.z - p.mesh.position.z);
    const falls = list.map((pc, i) => this.slideOff(pc, 0.55 * i / Math.max(1, list.length) + Math.random() * 0.04));
    // the pieces pour in while she can already reach for the knob; Bear then takes the board home (the next round
    // waits for that)
    const poured = Promise.all(falls).then(() => {
      if (this.dead) return;
      this.s.anim(0.35, (e) => { B.tilt = TILT * (1 - e); }, Ease.inOut);
      if (kind) { this.soup.tint(VEG[kind].soup, this.vegAdded ? 0.32 : 0.7); }
      this.vegAdded = (this.vegAdded || 0) + 1;
      this.soup.setLevel(0.42 * 0.95 + Math.min(4, this.vegAdded) * 0.035);
      this.face('joy', 1.2);
      if (this.plan.card) this.tickRow(this.cardRowNow());
    });
    const nextStir = !!this.plan.rounds[this.round + 1]?.stir;
    this.boardHome = poured.then(() => (this.dead ? null : this.boardBack())).then(() => {
      // (Level 3: the stirring comes next - Bear goes straight back over to his pot, so it is ready for her at once)
      if (nextStir && !this.dead) { const R = this.rig; R.limits = this.potLimits; R.zTo = this.zPot; R.leanTo = 0; R.xTo = POT.x + 0.35; }
    });
    if (!this.stoveOn) { await this.wait(0.25); if (!this.dead) this.toKnob(); return; }
    await poured;
    if (this.dead) return;
    await this.cook();
  }
  async boardBack() {
    const B = this.bp, R = this.rig;
    this.carryX = BOARD.x;
    while (!this.dead && Math.abs(B.pos.x - BOARD.x) > 0.03) await this.wait(0.03);
    if (this.dead) return;
    R.limits = this.boardLimits;
    R.zTo = this.zBoard;
    const a = B.pos.clone();
    R.plan(this.boardGrips().map((g, i) => ({ i, p: g.clone().add(BOARD) })), { leanMax: 0.45 });
    this.boardDown = true;
    await this.s.anim(0.6, (e) => { B.pos.lerpVectors(a, BOARD, e); }, Ease.inOut);
    this.boardDown = false;
    if (this.dead) return;
    csfx.knock();
    this.boardHeld = false;
    R.free(0, 0.35); R.free(1, 0.35);
    this.bp = null;
    const c = this.S.carrier;
    c.position.copy(BOARD); c.rotation.set(0, 0, 0);
    R.leanTo = 0;
    R.look(null);
    this.boardHome = null;
  }
  async slideOff(pc, delay) {
    pc.anim = true;
    await this.wait(delay);
    if (this.dead) return;
    const m = pc.mesh;
    let v = 0;
    // slide down the tipped board (board space, toward +z) until it passes the front edge
    await new Promise((res) => {
      const step = this.s.every(1 / 60, () => {
        v += 3.6 / 60;
        m.position.z += v / 60;
        if (m.position.z + pc.lo[1] > BD - 0.02) { step(); res(); }
      });
    });
    if (this.dead) return;
    // over the edge: into the pot along an arc, landing well inside it
    const wp = m.getWorldPosition(new T.Vector3()), wq = m.getWorldQuaternion(new T.Quaternion());
    const sg = this.soup.group;
    this.top.remove(m);
    sg.add(m);
    const start = sg.worldToLocal(wp.clone());
    m.quaternion.copy(wq);
    const qFlat = pc.q.clone();
    const ang = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()) * (this.soup.R - 0.3);
    const end = new T.Vector3(Math.cos(ang) * rr * 0.85, 0, Math.sin(ang) * rr * 0.7 + 0.12);
    const lim = this.soup.R - 0.28, er = Math.hypot(end.x, end.z);
    if (er > lim) end.multiplyScalar(lim / er);
    const q0 = m.quaternion.clone();
    const yEnd = () => this.soup.level - pc.y0 - (pc.y1 - pc.y0) * 0.45;
    const dur = 0.38 + Math.random() * 0.1;
    await this.s.anim(dur, (e, p) => {
      m.position.x = start.x + (end.x - start.x) * p;
      m.position.z = start.z + (end.z - start.z) * p;
      m.position.y = start.y + (yEnd() - start.y) * (p * p) + Math.sin(p * Math.PI) * 0.1;
      m.quaternion.slerpQuaternions(q0, qFlat, e);
    }, Ease.linear);
    if (this.dead) return;
    m.quaternion.copy(qFlat);
    measure(pc);
    const now = performance.now();
    if (!this.lastPlop || now - this.lastPlop > 110) { this.lastPlop = now; csfx.plop(); }
    this.soup.splash(end.x, end.z, 0.7);
    pc.anim = false;
    pc.ph = Math.random() * 6;
    pc.sx = end.x; pc.sz = end.z;
    this.floating.push(pc);
    // too many on top: the oldest ones sink out of sight (the soup's colour keeps them)
    // (the most plentiful kind loses its oldest first, so every vegetable she added stays in sight)
    while (this.floating.filter((f) => !f.sinking).length > MAXF) {
      const live = this.floating.filter((f) => !f.sinking), count = {};
      for (const f of live) count[f.kind] = (count[f.kind] || 0) + 1;
      const most = Object.keys(count).sort((a, b) => count[b] - count[a])[0];
      live.find((f) => f.kind === most).sinking = 0.001;
    }
  }

  // ---- 5. the stove ----
  toKnob() {
    this.phase = 'knob';
    this.knobTap.enabled = true;
    this.busy = false;
    this.idle = 0;
    this.stuck = 0;
    this.mark('ready');
    this.prompt();
    if (!this.teach('knob')) this.addHalo(this.S.knob, 0.42);
  }
  async turnKnob() {
    if (this.phase !== 'knob' || this.busy || this.dead) return;
    this.busy = true;
    this.mark('act', 'knob tap');
    this.knobTap.enabled = false;
    this.clearHints();
    fx.clearHands();
    const kn = this.S.knob;
    csfx.click();
    if (kn) { kn.scale.setScalar(1); await this.s.anim(0.5, (e) => { kn.rotation.y = -Math.PI / 2 * e; }, Ease.inOut); }
    if (this.dead) return;
    if (this.S.lamp) this.S.lamp.material = toon(0xffa52e, { vertexColors: true });
    csfx.whoomp();
    this.stoveOn = true;
    const fl = this.S.flame;
    if (fl) {
      fl.visible = true;
      const [kx, ky] = fl.userData.base;
      await this.s.anim(0.5, (e) => { fl.scale.set(kx, ky * Math.max(0.001, Ease.back(e)), kx); this.S.glow.material.opacity = 0.75 * e; }, Ease.out);
    }
    csfx.simmer(true);
    await this.cook();
  }
  async cook() {
    this.phase = 'cook';
    this.say("It's cooking!", { voice: false, max: 1.4 });
    this.rig.look(POT.clone().setY(POT_RIM));
    await this.wait(1.6);
    if (this.dead) return;
    this.face('joy', 1.2);
    const last = this.round === this.totalRounds - 1;
    const line = last ? 'Yummy soup!' : 'Into the soup!';
    this.busy = false;   // (success() only runs when not busy)
    this.success(this.soupTop(), line, { still: 0.6 });
  }
  soupTop() { return new T.Vector3(POT.x, POT_RIM + 0.2, POT.z); }

  // ---- Level 3: the ladle ----
  // The ladle's cup at C (world), its handle leaning back toward Bear's shoulder; the paw slides along the handle to
  // where his arm reaches (tilting the handle up or down a little when it must). Returns the grip point.
  ladlePose(C0, pour = 0, held = true) {
    const l = this.ladle, R = this.rig, f = R.f, C = C0.clone();
    f.updateMatrixWorld(true);
    let best = null;
    if (!held) {
      // resting in the pot: the handle leans up and back toward the pot's back-right, clear of Bear
      const yaw = Math.atan2(1.0, -0.7) + Math.PI;
      const q = new T.Quaternion().setFromEuler(new T.Euler(-0.35, yaw, 0, 'YXZ'));
      best = { q, g: new T.Vector3(0, 0.55, -0.64).multiplyScalar(LADLE_K).applyQuaternion(q).add(C) };
    } else {
      // Bear's paw holds the handle a little above the cup (never higher than his chin), at arm's length toward it;
      // the handle runs from the cup up through his paw (the paw slides along it, the cup gives way if it must)
      const S = R.arms[1].getWorldPosition(new T.Vector3());
      const chin = f.localToWorld(new T.Vector3(0, 1.3, 0)).y;
      const La = R.La * 0.97;
      let py = Math.max(C.y + 0.15, Math.min(C.y + 0.3, chin - 0.16));
      // (in the pot, the paw stays up above the rim, where we can see it on the handle)
      if (Math.hypot(C.x - POT.x, C.z - POT.z) < POT_R && C.y < POT_RIM) py = Math.max(py, POT_RIM + 0.2);
      py = clamp(py, S.y - La * 0.95, S.y + La * 0.6);
      const rH = Math.sqrt(Math.max(0, La * La - (py - S.y) ** 2));
      const hz = new T.Vector3(C.x - S.x, 0, C.z - S.z);
      if (hz.lengthSq() < 1e-6) hz.set(0, 0, 1);
      hz.normalize();
      const P = new T.Vector3(S.x + hz.x * rH, py, S.z + hz.z * rH);
      // never in front of his face: the paw keeps to the right of his muzzle
      const minX = f.position.x + 0.42;
      if (P.x < minX) { P.x = minX; const back = Math.sqrt(Math.max(0, La * La - (py - S.y) ** 2 - (P.x - S.x) ** 2)); P.z = S.z + back; }
      const len = clamp(P.distanceTo(C), 0.5, 0.82);
      const u = P.clone().sub(C).normalize();
      C.copy(P).addScaledVector(u, -len);
      const yaw = Math.atan2(-u.x, -u.z);                              // model -z (the handle's way) along u
      const tilt = Math.asin(clamp(u.y, -1, 1)) - Math.atan2(0.8, 0.6);
      const q = new T.Quaternion().setFromEuler(new T.Euler(tilt, yaw, 0, 'YXZ'));
      best = { q, g: P };
    }
    l.quaternion.copy(best.q);
    // pouring turns it about its own handle (the paw on the handle stays put; lateHold keeps it there)
    if (pour) l.quaternion.multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 0.8, -0.6).normalize(), pour));
    l.position.copy(C);
    return best.g;
  }
  placeLadle() {
    const L = this.lad;
    if (!this.ladle || !L) return;
    if (L.at) { L.grip.copy(this.ladlePose(L.at, L.pour, true)); return; }
    // in the pot: the cup in the soup at cup (soup space x, z)
    const C = new T.Vector3(POT.x + L.cup.x, POT.y + this.soup.level - 0.02, POT.z + L.cup.z);
    L.grip.copy(this.ladlePose(C, 0, L.held || (this.rig.goal[1] === this.ladGoal && this.rig.w[1] > 0.01)));
  }

  // ---- Level 3: stir ----
  async startStir() {
    this.phase = 'walk';
    this.view('pot');
    // (Bear first puts the board down from the last round)
    if (this.boardHome) { await this.boardHome; this.boardHome = null; }
    if (this.dead) return;
    const R = this.rig, L = this.lad;
    // she can start at once; Bear (already on his way back to the pot) takes his ladle, and the ladle only moves once
    // his paw is on it - her circles before that are kept and it catches up
    this.phase = 'stir';
    this.stirred = 0;
    this.stirLast = null;
    this.busy = false;
    this.idle = 0;
    this.stuck = 0;
    this.mark('ready');
    this.prompt();
    this.teach('stir');
    R.limits = this.potLimits;
    R.zTo = this.zPot;
    R.leanTo = 0;
    R.xTo = POT.x + 0.35;
    R.look(POT.clone().setY(POT_RIM));
    while (!this.dead && Math.abs(R.x - R.xTo) > 0.05) await this.wait(0.05);
    if (this.dead || !this.ladle || this.phase !== 'stir') return;
    R.hold(1, this.ladGoal, 0.3);
    await this.wait(0.32);
    if (this.dead) return;
    L.held = true;
  }
  // the ladle's cup follows the finger round the pot
  stirAt(x, y, fresh = false) {
    if (this.phase !== 'stir' || this.busy) return;
    const w = rayY(x, y, POT.y + this.soup.level);
    if (!w) return;
    let lx = w.x - POT.x, lz = w.z - POT.z;
    const r = Math.hypot(lx, lz), Rr = this.soup.R - 0.32;
    if (r > Rr) { lx *= Rr / r; lz *= Rr / r; }
    if (r < 0.25) { const k = 0.25 / Math.max(r, 1e-3); lx *= k; lz *= k; }
    const a = Math.atan2(lz, lx);
    if (this.stirLast !== null && !fresh && this.lad.held) {
      let da = a - this.stirLast;
      while (da > Math.PI) da -= Math.PI * 2; while (da < -Math.PI) da += Math.PI * 2;
      this.stirAdd(Math.abs(da), Math.sign(da));
    }
    this.stirLast = a;
    this.lad.to.set(lx, 0, lz);
  }
  stirAdd(da, dir) {
    const before = Math.floor(this.stirred / Math.PI);
    this.stirred += da;
    this.soup.stir = Math.min(1, this.soup.stir + da * 0.5);
    this.swirl = (this.swirl || 0) + da * dir * 0.6;
    // the colours blend as she stirs (SATISFACTION 19.2): toward one warm mixed soup
    const k = clamp(this.stirred / (Math.PI * 4), 0, 1);
    if (!this.mixFrom) { this.mixFrom = this.soup.target.clone(); this.mixTo = this.soup.target.clone().lerp(new T.Color(0xff8a3c), 0.55); }
    this.soup.target.copy(this.mixFrom).lerp(this.mixTo, k);
    if (Math.floor(this.stirred / Math.PI) > before) csfx.slosh();
    if (this.stirred >= Math.PI * 4 && this.phase === 'stir') this.stirDone();
  }
  // test hook (and the errorless tap, audit K6): one easy turn of the ladle round the pot
  async stirAuto() {
    if (this.phase !== 'stir' || this.busy || this.stirAnim || !this.lad.held) return;
    this.stirAnim = true;
    const c = this.lad.cup, a0 = Math.atan2(c.z, c.x), Rr = this.soup.R - 0.38;
    let prev = a0;
    await this.s.anim(1.6, (e) => {
      if (this.phase !== 'stir') return;
      const a = a0 + e * Math.PI * 2.05;
      this.lad.to.set(Math.cos(a) * Rr, 0, Math.sin(a) * Rr);
      this.stirAdd(a - prev, 1);
      prev = a;
    }, Ease.inOut);
    this.stirAnim = false;
  }
  async stirDone() {
    this.phase = 'stirred';
    this.busy = true;
    this.press = null;
    this.mark('act', 'stirred');
    this.tickRow(2);
    this.face('joy', 1);
    this.busy = false;   // (success() only runs when not busy)
    this.success(this.soupTop(), 'Stir, stir, stir!', { still: 0.4 });
  }

  // ---- Level 3: serve ----
  async startServe() {
    this.phase = 'walk';
    // an empty soup bowl appears on the board
    const b = (this.serveBowl = scProp('prop_bowl', {}, { ink: 0.02 }));
    if (b) {
      b.position.set(BOARD.x + 0.25, TOP + BOARD_TOP, BOARD.z + 0.1);
      this.root.add(b);
      popIn(this.s, b, BOWL_K, 0.45, { sound: true });
      this.serveTap = input.addDrag(b, {
        radius: 0.6, minY: TOP + 0.3,
        zones: () => [{ id: 'pot', pos: POT.clone().setY(POT_RIM), radius: 1.8 }],
        onPick: () => { fx.clearHands(); this.clearHints(); },
        onDrop: () => this.serve(),
      });
    }
    this.view('serve');
    // Bear leaves the ladle in the pot and waits by it
    const R = this.rig;
    this.lad.held = false;
    R.free(1, 0.3);
    R.xTo = POT.x + 1.1;
    await this.wait(0.5);
    if (this.dead) return;
    this.phase = 'serve';
    this.busy = false;
    this.idle = 0;
    this.stuck = 0;
    this.mark('ready');
    this.prompt();
    this.teach('serve');
  }
  async serve() {
    if (this.phase !== 'serve' || this.busy || this.dead) return;
    this.phase = 'serving';
    this.busy = true;
    this.mark('act', 'bowl dropped');
    this.clearHints();
    fx.clearHands();
    if (this.serveTap) { input.remove(this.serveTap); this.serveTap = null; }
    const b = this.serveBowl, R = this.rig, L = this.lad;
    // the bowl sits down by the pot, on the board's end
    const a = b.position.clone();
    await this.s.anim(0.45, (e, p) => { b.position.lerpVectors(a, SERVE_SPOT, e); b.position.y += Math.sin(p * Math.PI) * 0.4; }, Ease.inOut);
    if (this.dead) return;
    csfx.knock();
    // the soup in the bowl: a domed surface that rises with each ladle, with real little pieces on top
    const fill = this.makeBowlSoup(b);
    // Bear takes the ladle and fills the bowl, twice
    R.hold(1, this.ladGoal, 0.3);
    await this.wait(0.35);
    if (this.dead) return;
    L.held = true;
    for (let i = 0; i < 2; i++) {
      await this.ladleOnce(b, fill, i);
      if (this.dead) return;
    }
    // the ladle goes back into the pot (Bear carries it back over, then lowers it in)
    const back = new T.Vector3(POT.x + L.cup.x, POT.y + this.soup.level - 0.02, POT.z + L.cup.z);
    R.xTo = back.x - 0.42;
    const ly = L.at.y, lz = L.at.z;
    while (!this.dead && Math.abs(R.x - R.xTo) > 0.05) {
      const x = R.x + 0.42;
      L.at.set(x, ly + (POT_RIM + 0.1 - ly) * clamp(1 - (x - (POT.x + POT_R + 0.2)) / 0.45, 0, 1), lz);
      await this.wait(0.016);
    }
    if (this.dead) return;
    const from = L.at.clone();
    await this.s.anim(0.4, (e) => { L.at.lerpVectors(from, back, e); }, Ease.inOut);
    if (this.dead) return;
    L.at = null; L.pour = 0;
    L.held = false;
    R.free(1, 0.3);
    // a little spoon pops into the bowl for tasting
    this.makeSpoon(b);
    await this.wait(0.35);
    if (this.dead) return;
    await this.taste(b);
    if (this.dead) return;
    this.tickRow(3);
    this.busy = false;   // (success() only runs when not busy)
    this.success(b.position.clone().add(new T.Vector3(0, 0.4, 0)), '', { still: 0.6 });
  }
  // a domed soup surface for the served bowl (inside the bowl's own space), and a few real mini pieces on it
  makeBowlSoup(b) {
    const g = new T.Group();
    const geo1 = new T.CircleGeometry(1, 40, 0, Math.PI * 2);
    geo1.rotateX(-Math.PI / 2);
    const p = geo1.attributes.position;
    for (let i = 0; i < p.count; i++) { const r = Math.hypot(p.getX(i), p.getZ(i)); p.setY(i, 0.1 * (1 - r * r)); }
    geo1.computeVertexNormals();
    const col = this.soup.col.getHex();
    g.add(new T.Mesh(geo1, toonUnique(col)));
    const rim = new T.Mesh(geo.ring(0.84, 1.0, 40), toonUnique(new T.Color(col).lerp(new T.Color(0xffffff), 0.28).getHex()));
    rim.rotation.x = -Math.PI / 2; rim.position.y = 0.006;
    g.add(rim);
    // mini pieces: copies of real pieces from the pot, at about half size, floating on top
    const ws = BOWL_K * 1.3;          // this group's world scale when full
    const src = this.floating.filter((f) => !f.sinking).slice(-5);
    src.forEach((pc, i) => {
      const m = new T.Mesh(pc.mesh.geometry, pc.mesh.material);
      const ol = pc.mesh.children[0];
      if (ol) { const o2 = new T.Mesh(ol.geometry, ol.material); o2.userData.outline = true; m.add(o2); }
      m.quaternion.copy(pc.q);
      const size = Math.max(pc.hi[0] - pc.lo[0], pc.hi[1] - pc.lo[1]);
      const k = Math.min(0.55, 0.2 / Math.max(0.05, size)) / ws;
      m.scale.setScalar(k);
      const a = i / Math.max(1, src.length) * Math.PI * 2 + 0.4, r = i === 0 ? 0.05 : 0.5;
      m.position.set(Math.cos(a) * r, 0.1 - (pc.y0 + (pc.y1 - pc.y0) * 0.45) * k, Math.sin(a) * r);
      m.visible = false;
      g.add(m);
    });
    g.position.y = 0.6;
    g.scale.setScalar(0.001);
    b.add(g);
    return g;
  }
  // One ladleful: Bear steps over to the pot, dips, lifts the cup clear of the rim, walks it over to the bowl (the cup
  // stays out in front of his right shoulder all the way, so his paw never comes near his face) and pours.
  async ladleOnce(b, fill, i) {
    const L = this.lad, R = this.rig;
    const AHEAD = 0.56;                                  // the cup's place to the right of Bear's middle
    const dipC = new T.Vector3(POT.x + 0.5, POT.y + this.soup.level - 0.02, POT.z - 0.1);
    const over = SERVE_SPOT.clone().add(new T.Vector3(-0.12, 0.45, 0.05));
    const lift = POT_RIM + 0.1;
    // (high only while it crosses the pot's rim, then down low toward the bowl, so his paw stays low too)
    const yAt = (x) => lift + (over.y - lift) * clamp((x - (POT.x + POT_R + 0.2)) / 0.45, 0, 1);
    const from = L.at ? L.at.clone() : new T.Vector3(POT.x + L.cup.x, POT.y + this.soup.level - 0.02, POT.z + L.cup.z);
    L.at = from.clone();
    R.look(dipC);
    // to the pot: the cup goes along out in front of him (up over the rim), then down into the soup
    R.xTo = dipC.x - AHEAD;
    const fz = from.z;
    const inPot = Math.hypot(from.x - POT.x, from.z - POT.z) < POT_R && from.y < POT_RIM;
    if (inPot) { while (!this.dead && Math.abs(R.x - R.xTo) > 0.05) await this.wait(0.03); }
    else if (Math.abs(R.x - R.xTo) > 0.05) {
      const a0 = L.at.clone(), first = new T.Vector3(R.x + AHEAD, yAt(R.x + AHEAD), fz);
      await this.s.anim(0.2, (e) => { L.at.lerpVectors(a0, first, e); }, Ease.out);
      while (!this.dead && Math.abs(R.x - R.xTo) > 0.05) { L.at.set(R.x + AHEAD, yAt(R.x + AHEAD), fz + (dipC.z - fz) * 0.5); await this.wait(0.016); }
    }
    if (this.dead) return;
    const a1 = L.at.clone();
    await this.s.anim(0.35, (e) => { L.at.lerpVectors(a1, dipC, e); }, Ease.inOut);
    if (this.dead) return;
    csfx.slosh();
    this.soup.splash(dipC.x - POT.x, dipC.z - POT.z, 0.4);
    L.disc.material.color.copy(this.soup.col);
    L.disc.visible = true; L.disc.scale.setScalar(1);
    // up out of the soup, clear of the rim
    const up = dipC.clone().setY(lift);
    await this.s.anim(0.3, (e) => { L.at.lerpVectors(dipC, up, e); }, Ease.out);
    if (this.dead) return;
    // Bear walks it over to the bowl
    R.look(SERVE_SPOT);
    R.xTo = over.x - AHEAD;
    const z0 = up.z;
    while (!this.dead && Math.abs(R.x - R.xTo) > 0.05) {
      const k = clamp((R.x - (dipC.x - AHEAD)) / (R.xTo - (dipC.x - AHEAD)), 0, 1);
      L.at.set(R.x + AHEAD, yAt(R.x + AHEAD), z0 + (over.z - z0) * k);
      await this.wait(0.016);
    }
    if (this.dead) return;
    const top = L.at.clone();
    await this.s.anim(0.25, (e) => { L.at.lerpVectors(top, over, e); }, Ease.inOut);
    if (this.dead) return;
    // pour: the cup turns over the bowl, the soup rises
    await this.s.anim(0.3, (e) => { L.pour = 1.5 * e; L.disc.scale.setScalar(Math.max(0.001, 1 - e)); }, Ease.out);
    L.disc.visible = false;
    csfx.plop();
    const k0 = fill.scale.x, k1 = i ? 1.3 : 1.12, y0 = fill.position.y, y1 = i ? 0.84 : 0.72;
    if (i) fill.children.forEach((m) => { m.visible = true; });
    await this.s.anim(0.3, (e) => { fill.scale.setScalar(Math.max(0.001, k0 + (k1 - k0) * e)); fill.position.y = y0 + (y1 - y0) * e; }, Ease.out);
    await this.s.anim(0.25, (e) => { L.pour = 1.5 * (1 - e); }, Ease.in);
    L.pour = 0;
    // back up for the next one
    const o2 = L.at.clone();
    await this.s.anim(0.2, (e) => { L.at.lerpVectors(o2, o2.clone().setY(o2.y + 0.12), e); }, Ease.out);
  }
  // the tasting spoon: its bowl at spoonAt (world), the handle reaching to the paw (or resting on the bowl's rim)
  makeSpoon(b) {
    const sp = scProp('prop_ck_spoon', {}, { ink: 0.01 });
    if (!sp) return;
    this.spoon = sp;
    this.root.add(sp);
    this.spoonAt = b.localToWorld(new T.Vector3(-0.35, 0.8, 0.2));
    this.spoonRest = b.localToWorld(new T.Vector3(1.0, 1.25, -0.55));      // where the handle leans when nobody holds it
    this.poseSpoon(this.spoonRest);
    popIn(this.s, sp, 1, 0.35, { sound: false });
  }
  // the spoon from its bowl toward the paw P: the paw slides along the handle (0.28 .. 0.5 from the bowl)
  poseSpoon(P) {
    const sp = this.spoon, C = this.spoonAt;
    const u = P.clone().sub(C);
    const d = clamp(u.length(), 0.28, 0.5);
    u.normalize();
    // model +x along the handle, the bowl kept as level as the handle allows
    const side = new T.Vector3().crossVectors(u, UP);
    if (side.lengthSq() < 1e-4) side.set(0, 0, 1);
    side.normalize();
    const y = new T.Vector3().crossVectors(side, u).normalize();
    sp.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(u, y, new T.Vector3().crossVectors(u, y)));
    if (this.spoonHeld) sp.position.copy(P).addScaledVector(u, -d);
    else sp.position.copy(C);
  }
  // Bear takes the spoon, blows on it, sips; his eyes close and his shoulders drop: "Mmm!"
  async taste(b) {
    const R = this.rig, f = this.friend, u = f.userData;
    R.xTo = SERVE_SPOT.x - 0.55;
    R.look(this.spoonAt);
    while (!this.dead && Math.abs(R.x - R.xTo) > 0.05) await this.wait(0.05);
    if (this.dead || !this.spoon) return;
    // the paw goes to the spoon's handle in the bowl...
    const gripAt = () => this.spoonAt.clone().addScaledVector(this.spoonRest.clone().sub(this.spoonAt).normalize(), 0.42);
    R.hold(1, gripAt, 0.3);
    while (!this.dead && R.w[1] < 0.999) await this.wait(0.03);
    if (this.dead) return;
    this.spoonHeld = true;
    // ...scoops a little soup and brings it up in front of his mouth, the paw beside his cheek
    f.updateMatrixWorld(true);
    const mouthAt = () => f.localToWorld(new T.Vector3(...(u.anchors.mouth || [0, 1.55, 0.7]))).add(new T.Vector3(0, -0.04, 0.16));
    const pawAt = () => { const m = mouthAt(); return new T.Vector3(f.position.x + 0.44, m.y - 0.12, m.z - 0.12); };
    const c0 = this.spoonAt.clone();
    const g0 = gripAt();
    R.hold(1, () => this.pawGoal, 0.05);
    this.pawGoal = g0.clone();
    const sipC = () => mouthAt();
    await this.s.anim(0.7, (e) => {
      this.spoonAt.lerpVectors(c0, sipC(), e);
      this.spoonAt.y += Math.sin(e * Math.PI) * 0.15;
      this.pawGoal.lerpVectors(g0, pawAt(), e);
    }, Ease.inOut);
    if (this.dead) return;
    R.look(mouthAt().add(new T.Vector3(0, -0.1, 3)));
    // a blow (the steam puffs away)...
    csfx.blow();
    for (let k = 0; k < 3; k++) this.puff(this.spoonAt.clone().add(new T.Vector3((k - 1) * 0.06, 0.08, 0.05)), k * 0.09);
    await this.wait(0.6);
    if (this.dead) return;
    // ...a sip: eyes closed
    const near = sipC().add(new T.Vector3(0, 0.02, -0.07));
    const c1 = this.spoonAt.clone();
    await this.s.anim(0.25, (e) => { this.spoonAt.lerpVectors(c1, near, e); }, Ease.inOut);
    csfx.sip();
    this.face('joy', 0);
    await this.wait(0.35);
    if (this.dead) return;
    sfx.mmm();
    this.say('Mmm!', { voice: false, max: 0.5 });
    // shoulders drop, a happy sigh; the spoon goes back into the bowl
    R.slump(1);
    const c2 = this.spoonAt.clone(), p2 = this.pawGoal.clone(), back = b.localToWorld(new T.Vector3(-0.35, 0.8, 0.2)), gb = back.clone().addScaledVector(this.spoonRest.clone().sub(back).normalize(), 0.42);
    await this.s.anim(0.7, (e) => { this.spoonAt.lerpVectors(c2, back, e); this.pawGoal.lerpVectors(p2, gb, e); }, Ease.inOut);
    if (this.dead) return;
    this.spoonHeld = false;
    this.poseSpoon(this.spoonRest);
    R.free(1, 0.35);
    await this.wait(0.6);
    R.slump(0);
    this.face('happy', 0);
  }
  puff(p, delay) {
    if (!this.steamTex) this.steamTex = radialTex('rgba(255,255,255,0.8)', 'rgba(255,255,255,0)');
    this.s.wait(delay).then(() => {
      if (this.dead) return;
      const m = new T.Sprite(new T.SpriteMaterial({ map: this.steamTex, transparent: true, opacity: 0.0, depthWrite: false }));
      m.position.copy(p); m.scale.setScalar(0.18);
      this.root.add(m);
      this.s.anim(0.9, (e) => { m.position.z += 0.01; m.position.y += 0.006; m.scale.setScalar(0.18 + e * 0.35); m.material.opacity = 0.6 * Math.sin(e * Math.PI); }).then(() => { this.root.remove(m); m.material.dispose(); });
    });
  }

  // ---------------- the finale: Bear and the soup he made with her ----------------
  // the finale: the pot of soup, Bear beside it, the board she chopped on (and the served bowl on Level 3)
  creationView() {
    const x = this.rig.xTo;
    const v = fitView([...box(HOB.x - 1.35, KBLOCK.x + 0.3, TOP, POT_RIM + 0.1, -1.1, HOB.z + 0.8), ...bearPts(x, this.rig.zTo)], 0.48);
    return { pos: v.pos, look: v.look };
  }
  creationObjects() { return [this.S.pot, this.serveBowl && this.serveBowl.parent ? this.serveBowl : null].filter(Boolean); }
  onAdmirePoke(obj) {
    input.press(obj, 140);
    csfx.slosh();
    if (obj === this.S.pot) { this.soup.stir = 1; this.soup.splash(0, 0.1, 0.6); this.swirl = (this.swirl || 0) + 1.2; }
    this.face('joy', 0.8);
  }
  onFinale() {
    csfx.simmer(false);
    this.rig.free(0); this.rig.free(1);
    this.rig.look(null);
    // Bear stands between his pot and his board to admire it
    this.rig.limits = this.potLimits; this.rig.zTo = this.zPot;
    this.rig.xTo = this.serveBowl && this.serveBowl.parent ? SERVE_SPOT.x - 0.6 : POT.x + 1.45;
  }

  // ---------------- prompts, demos, hints ----------------
  promptText() {
    switch (this.phase) {
      case 'pick': return this.pickText();
      case 'knife': return SAY.knife;
      case 'chop': return SAY.chop;
      case 'scoop': return SAY.scoop;
      case 'carry': return SAY.carry;
      case 'knob': return SAY.knob;
      case 'stir': return SAY.stir;
      case 'serve': return SAY.serve;
      default: return '';
    }
  }
  // a slow hand demo the first time each kind of action comes up (returns true when it played)
  teach(kind) {
    if (this.taught.has(kind)) return false;
    this.taught.add(kind);
    this.demo(kind);
    return true;
  }
  demo(kind = this.phase) {
    if (this.dead) return;
    this.demoing = true;
    this.demoLock = performance.now() + 900;
    fx.clearHands();
    this.showHint(true, kind);
    const id = (this.demoId = (this.demoId || 0) + 1);
    this.s.wait(2.5).then(() => { if (this.demoId === id) { this.demoing = false; this.idle = 0; } });
  }
  showHint(glow = true, kind = this.phase) {
    const T3 = (o, dy = 0) => o.getWorldPosition(new T.Vector3()).add(new T.Vector3(0, dy, 0));
    const boardC = this.top.localToWorld(new T.Vector3(0, 0.15, 0.1));
    if (kind === 'pick') {
      const v = this.wantVeg();
      if (!v) return;
      if (glow) this.addHalo(v, 0.55);
      fx.ghostPath([T3(v, 0.15), boardC], { mode: 'drag', maxDur: 2.3 });
    } else if (kind === 'knife') {
      if (glow) this.addHalo(this.S.knife, 0.6);
      fx.ghostPath([this.knife.grip.clone()], { mode: 'tap' });
    } else if (kind === 'chop') {
      const c = this.biggest();
      const p = c ? this.top.localToWorld(c.mesh.position.clone().setY(0.25)) : boardC;
      fx.ghostPath([p, p.clone().add(new T.Vector3(0.3, 0, 0.3)), p.clone().add(new T.Vector3(-0.3, 0, -0.3))], { mode: 'scan', maxDur: 2.3 });
    } else if (kind === 'scoop') {
      fx.ghostPath([boardC, boardC], { mode: 'drag', maxDur: 2.2 });
    } else if (kind === 'carry') {
      const c = this.S.carrier.position.clone().add(new T.Vector3(0, 0.2, 0.3));
      fx.ghostPath([c, new T.Vector3(POT.x, CARRY_Y + 0.35, POT.z - 0.1)], { mode: 'drag', maxDur: 2.2 });   // (ends over the middle of the pot)
    } else if (kind === 'knob') {
      if (glow && this.S.knob) this.addHalo(this.S.knob, 0.42);
      if (this.S.knob) fx.ghostPath([T3(this.S.knob, 0.1)], { mode: 'tap' });
    } else if (kind === 'stir') {
      const y = POT.y + this.soup.level, Rr = this.soup.R - 0.35;
      const pts = [];
      for (let i = 0; i <= 8; i++) { const a = i / 8 * Math.PI * 2; pts.push(new T.Vector3(POT.x + Math.cos(a) * Rr, y, POT.z + Math.sin(a) * Rr * 0.8)); }
      fx.ghostPath(pts, { mode: 'drag', maxDur: 2.4 });
    } else if (kind === 'serve') {
      if (!this.serveBowl) return;
      if (glow) this.addHalo(this.serveBowl, 0.6);
      fx.ghostPath([T3(this.serveBowl, 0.2), POT.clone().setY(POT_RIM)], { mode: 'drag', maxDur: 2.2 });
    }
  }
  nudgeTarget() {
    switch (this.phase) {
      case 'pick': return this.wantVeg();
      case 'knob': return this.S.knob;
      case 'serve': return this.serveBowl;
      default: return null;
    }
  }
  // a stuck child gets a soft glow and a gentle bob (no boings); the demo itself comes back at ~8 s (update)
  nudge(step) {
    if (this.phase === 'knife') { if (step >= 2) { const stop = fx.halo(this.S.knife, 0.7); this.s.wait(3).then(stop); } return; }
    const o = this.nudgeTarget();
    if (!o) return;
    const y0 = o.position.y;
    this.s.anim(0.6, (_, p) => { o.position.y = y0 + Math.sin(p * Math.PI) * 0.18; }).then(() => (o.position.y = y0));
    if (step >= 2) { const stop = fx.halo(o, 0.7); this.s.wait(3).then(stop); }
  }
  makeErrorless() {
    if (this.phase === 'pick') { const v = this.wantVeg(); if (v) this.addHalo(v, 0.6); }
    else if (this.phase === 'knife') this.addHalo(this.S.knife, 0.6);
    else if (this.phase === 'knob' && this.S.knob) this.addHalo(this.S.knob, 0.45);
    else if (this.phase === 'scoop') this.gather = Math.max(this.gather || 0, 0.6);
    else if (this.phase === 'carry') this.tip();
    else if (this.phase === 'stir') this.stirErrorless = true;
  }
  // taps that land on nothing while chopping or carrying are part of the play, not pokes
  pokeAt(x, y) {
    if (['chop', 'scoop', 'carry', 'stir', 'lift', 'tip'].includes(this.phase)) return true;
    return super.pokeAt(x, y);
  }

  // ---------------- every frame ----------------
  update(dt, t) {
    this.S.K.update(dt, t);
    this.soup.heat += ((this.stoveOn ? 1 : 0) - this.soup.heat) * Math.min(1, dt * 0.8);
    this.soup.stir = Math.max(0, this.soup.stir - dt * 0.6);
    this.soup.update(dt, t);
    // the flames flicker
    const fl = this.S.flame;
    if (fl && this.stoveOn && fl.visible) {
      for (const w of fl.children) {
        const ph = w.userData.ph, k = w.userData.k, tg = w.children[0];
        tg.scale.set(k * (1 + Math.sin(t * 7.3 + ph) * 0.05), k * (1 + Math.sin(t * 11 + ph) * 0.12 + Math.sin(t * 17.3 + ph * 2) * 0.06), k);
        tg.rotation.z = Math.sin(t * 5.1 + ph) * 0.12;
      }
    }
    // the knob breathes while it is the thing to tap (audit K2)
    const kn = this.S.knob;
    if (kn && this.phase === 'knob') kn.scale.setScalar(1 + Math.max(0, Math.sin(t * 3.2)) * 0.08);
    else if (kn && kn.scale.x !== 1 && this.phase !== 'knob') kn.scale.setScalar(1);
    // the knife: it follows the finger over the board (only while nothing is being chopped)
    const K = this.knife;
    if (K.held && K.t >= 1 && !this.chopping && this.phase === 'chop') {
      K.E.lerp(K.target, Math.min(1, dt * 6));
      const lift = this.hoverLift();
      K.lift += (lift - K.lift) * Math.min(1, dt * 8);
      this.planKnife();
    }
    if (this.knifeBack) {
      // putting it away: from where it was, back up over the block and down into it
      const k = this.S.knife, e = K.t;      // 1 -> 0
      const up = KNIFE_REST.clone().add(KNIFE_LIFT);
      up.y = Math.max(up.y, this.knifeBack.p.y);           // (level across, then down onto its rest: never through a piece)
      const u = 1 - e;
      k.position.copy(u < 0.6 ? this.knifeBack.p.clone().lerp(up, Ease.inOut(u / 0.6)) : up.clone().lerp(KNIFE_REST, Ease.in((u - 0.6) / 0.4)));
      k.quaternion.slerpQuaternions(this.knifeBack.q, KNIFE_REST_Q, Ease.inOut(clamp(u / 0.75, 0, 1)));
      K.grip.copy(KNIFE_GRIP).multiplyScalar(KNIFE_K).applyQuaternion(k.quaternion).add(k.position);
    } else this.poseKnife();
    // chopping: time to scoop?
    if (this.phase === 'chop' && !this.chopping) {
      this.sinceChop = (this.sinceChop || 0) + dt;
      const diced = this.allDiced && performance.now() - this.allDiced > ALL_DICED * 1000;
      if (this.chops > 0 && !this.press && (this.sinceChop > IDLE_SCOOP || diced)) this.endChop();
    }
    // holding the board: the pieces slide together; when they're gathered, Bear lifts it
    if (this.phase === 'scoop') {
      // a finger already resting on the board (pressed while the knife was being put away) starts the scoop too
      if (!this.hold && !this.busy && this.ptr?.down && !this.press && performance.now() > (this.demoLock || 0)) {
        const p = this.boardPoint(this.ptr.x, this.ptr.y);
        if (p && Math.max(Math.abs(p.x) - BW, Math.abs(p.z) - BD) < 0.8) { this.press = { id: this.ptr.id }; this.demoing = false; this.startHold(); }
      }
      if (this.hold) this.gather = Math.min(1, (this.gather || 0) + dt / 0.9);
      else this.gather = Math.max(0, (this.gather || 0) - dt * 0.12);
      if (this.hold && this.gather >= 1) this.lift();
    }
    // Bear carries the board where the finger leads (he walks, the board stays in his paws)
    const R = this.rig;
    if (this.bp) {
      if (this.phase === 'carry' || this.phase === 'tip' || this.boardHome) R.xTo = this.carryX ?? R.xTo;
      const B = this.bp;
      if (this.boardHeld) {
        B.pos.x = R.x;
        // low while walking; up over the rim as it nears the pot (and down again going home)
        if (this.phase !== 'lift' && !this.boardDown) {
          const near = clamp(1 - (R.x - BW - POT.x - POT_R - 0.06) / 0.7, 0, 1);   // (its near edge clears the rim first)
          B.pos.y = CARRY_LOW + (CARRY_Y - CARRY_LOW) * Ease.inOut(near);
        }
        B.roll = clamp(-R.vx * 0.03, -0.06, 0.06);
      }
      this.poseBoard();
    }
    if (this.bowlHeld) this.bowlHeld.grips();
    R.update(dt);
    this.relaxBoard(dt);
    this.updateSoupPieces(dt, t);
    this.updateBits(dt);
    // the ladle: its cup follows its target round the pot (stirring), or wherever Bear is ladling
    if (this.ladle) {
      const L = this.lad;
      if (!L.at && L.held) L.cup.lerp(L.to, Math.min(1, dt * 8));
      // while Bear has it, he shuffles so his paw can stay on the handle below his chin (the handle back toward him)
      if (this.phase === 'stir' && (L.held || R.goal[1] === this.ladGoal)) {
        const C = L.at ? L.at.clone() : new T.Vector3(POT.x + L.cup.x, POT.y + this.soup.level, POT.z + L.cup.z);
        const guess = C.add(new T.Vector3(0.3, 0.42, -0.45));
        if (!this.ladPlanned || this.ladPlanned.distanceTo(guess) > 0.06) { this.ladPlanned = guess.clone(); R.plan([{ i: 1, p: guess }], { leanMax: 0 }); }
      }
      this.placeLadle();
    }
    // stuck for a while: the hand shows it again
    const waiting = !this.busy && !this.demoing && ['pick', 'knife', 'scoop', 'carry', 'knob', 'stir', 'serve'].includes(this.phase) || (this.phase === 'chop' && this.chops === 0);
    if (waiting && !this.press) {
      this.stuck = (this.stuck || 0) + dt;
      if (this.stuck > STUCK_DEMO) { this.stuck = -12; this.demo(); }
    }
    this.placeHud(dt);
  }
  // right before the render: Bear's arms reach their goals; whatever he holds sits exactly in his paws
  lateHold() {
    const R = this.rig;
    if (!R || this.dead) return;
    R.apply();
    const K = this.knife;
    if ((K.held || this.knifeBack) && R.held(1)) this.S.knife.position.add(R.paw[1].clone().sub(K.grip));
    if (this.bp && this.boardHeld && R.held(0) && R.held(1)) {
      const err = R.paw[0].clone().sub(this.bp.g[0]).add(R.paw[1].clone().sub(this.bp.g[1])).multiplyScalar(0.5);
      this.S.carrier.position.add(err);
    }
    if (this.ladle && this.lad.held && R.held(1)) this.ladle.position.add(R.paw[1].clone().sub(this.lad.grip));
    if (this.spoon && this.spoonHeld && R.held(1)) this.poseSpoon(R.paw[1]);
    if (this.bowlHeld && R.held(0) && R.held(1)) {
      const G = this.bowlHeld.grips();
      const err = R.paw[0].clone().sub(G[0]).add(R.paw[1].clone().sub(G[1])).multiplyScalar(0.5);
      this.bowlHeld.b.position.add(err);
      this.bowlHeld.b.updateMatrixWorld(true);
    }
  }
  // pieces on the board never overlap: a soft push apart (on four axes) and a fence at the board's edge (they keep
  // to the band Bear's knife reaches); while she holds the board they drift together into a pile
  relaxBoard(dt) {
    const L = this.pieces.filter((pc) => !pc.anim);
    const pull = this.phase === 'scoop' ? (this.gather || 0) * (this.hold ? 1 : 0) : 0;
    // (they draw together into a low heap, not a tall tower: nothing is pulled closer than about 0.45 from the middle)
    if (pull > 0) for (const pc of L) {
      const m = pc.mesh.position, dx = m.x, dz = m.z - 0.12, r = Math.hypot(dx, dz);
      if (r < 0.45) continue;
      const k = Math.min(1, dt * 2.2 * pull) * (1 - 0.45 / r);
      m.x -= dx * k; m.z -= dz * k;
    }
    // (a few passes a frame, each pushing overlapping pieces fully apart, so they never sit inside each other)
    for (let pass = 0; pass < 3; pass++) for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
      const A = L[i], B = L[j], pa = A.mesh.position, pb = B.mesh.position;
      let pen = Infinity, best = 0, ax = 0, az = 0;
      for (let k = 0; k < 4; k++) {
        const [x, z] = AXES[k];
        const ca = pa.x * x + pa.z * z, cb = pb.x * x + pb.z * z;
        const ov = Math.min(ca + A.hi[k], cb + B.hi[k]) - Math.max(ca + A.lo[k], cb + B.lo[k]) + 0.02;
        if (ov <= 0) { pen = 0; break; }
        // (the board is long and shallow: prefer pushing pieces apart along its length, where there is room)
        const cost = ov * (k === 1 ? 1.8 : k === 0 ? 1 : 1.3);
        if (cost < pen) { pen = cost; best = ov; const s = cb >= ca ? 1 : -1; ax = x * s; az = z * s; }
      }
      if (pen > 0 && pen < Infinity) {
        const k = Math.min(best, 0.12) * 0.5;
        pa.x -= ax * k; pa.z -= az * k; pb.x += ax * k; pb.z += az * k;
      }
    }
    const zLo = this.phase === 'scoop' || this.phase === 'lift' ? -BD + 0.08 : BAND[0], zHi = this.phase === 'scoop' || this.phase === 'lift' ? BD - 0.06 : BAND[1] + 0.12;
    for (const pc of L) {
      const m = pc.mesh.position;
      m.x = clamp(m.x, -BW + 0.06 - pc.lo[0], BW - 0.06 - pc.hi[0]);
      m.z = clamp(m.z, zLo - pc.lo[1], zHi - pc.hi[1]);
    }
    // a piece that still overlaps a low, flat piece (no room left) lies ON TOP of it, the way slices fan over each
    // other - never inside it. One layer only, and never on a tall piece, so the heap stays low.
    const vol = (p) => Math.round((p.y1 - p.y0) * (p.hi[0] - p.lo[0]) * (p.hi[1] - p.lo[1]) * 200);
    const all = this.pieces.slice().sort((p, q) => vol(q) - vol(p) || (p.sid || 0) - (q.sid || 0)), onTop = new Set();
    for (let i = 0; i < all.length; i++) {
      const B = all[i];
      let base = 0;
      for (let j = 0; j < i; j++) {
        const A = all[j];
        if (onTop.has(A) || A.y1 - A.y0 > 0.3) continue;
        if (overlapXZ(A, B, 0.02)) base = Math.max(base, A.y1 - A.y0);
      }
      if (base > 0) onTop.add(B);
      if (B.anim) continue;
      B.base = (B.base || 0) + (base - (B.base || 0)) * Math.min(1, dt * 14);
      if (Math.abs(B.base - base) < 0.002) B.base = base;
      B.mesh.position.y = -B.y0 + B.base;
    }
  }
  updateSoupPieces(dt, t) {
    const R = this.soup.R, lvl = this.soup.level;
    const spin = (this.soup.heat * 0.1 + (this.swirl || 0)) * dt;
    if (this.swirl) this.swirl *= Math.max(0, 1 - dt * 1.5);
    const L = this.floating;
    for (let i = L.length - 1; i >= 0; i--) {
      const pc = L[i];
      if (pc.anim) continue;
      const m = pc.mesh;
      if (pc.sinking) {
        pc.sinking += dt;
        m.position.y -= dt * 0.3;
        if (pc.sinking > 1.6) { disposePiece(pc); L.splice(i, 1); }
        continue;
      }
      // drift round with the simmer / the ladle
      const c = Math.cos(spin), s = Math.sin(spin);
      const x = pc.sx * c - pc.sz * s, z = pc.sx * s + pc.sz * c;
      pc.sx = x; pc.sz = z;
      m.rotation.y += spin;
    }
    // the ladle pushes pieces aside as it goes round
    const cup = this.ladle && this.lad && !this.lad.at && this.phase === 'stir' ? this.lad.cup : null;
    // keep them apart and inside the pot (circles)
    const F = L.filter((p) => !p.anim && !p.sinking);
    const rad = (p) => Math.max(p.hi[0] - p.lo[0], p.hi[1] - p.lo[1]) * 0.45;
    for (let i = 0; i < F.length; i++) for (let j = i + 1; j < F.length; j++) {
      const A = F[i], B = F[j];
      const dx = B.sx - A.sx, dz = B.sz - A.sz, d = Math.hypot(dx, dz) || 1e-3, need = rad(A) + rad(B);
      if (d < need) { const k = (need - d) * 0.25; A.sx -= dx / d * k; A.sz -= dz / d * k; B.sx += dx / d * k; B.sz += dz / d * k; }
    }
    for (const pc of F) {
      if (cup) { const dx = pc.sx - cup.x, dz = pc.sz - cup.z, d = Math.hypot(dx, dz) || 1e-3, need = rad(pc) + 0.24; if (d < need) { pc.sx += dx / d * (need - d) * 0.5; pc.sz += dz / d * (need - d) * 0.5; } }
      const r = Math.hypot(pc.sx, pc.sz), lim = R - rad(pc) - 0.06;
      if (r > lim) { pc.sx *= lim / r; pc.sz *= lim / r; }
      const m = pc.mesh;
      m.position.x += (pc.sx - m.position.x) * Math.min(1, dt * 5);
      m.position.z += (pc.sz - m.position.z) * Math.min(1, dt * 5);
      // they float low, so the soup's surface shows round them
      m.position.y = lvl - pc.y0 - (pc.y1 - pc.y0) * 0.55 + Math.sin(t * 1.8 + pc.ph) * 0.012 * (1 + this.soup.heat);
    }
  }
  updateBits(dt) {
    for (let i = this.bits.length - 1; i >= 0; i--) {
      const b = this.bits[i];
      b.t += dt;
      if (!b.down) {
        b.v.y -= 7 * dt;
        b.m.position.addScaledVector(b.v, dt);
        if (b.m.position.y <= b.s * 0.8 && b.v.y < 0) {
          b.m.position.y = b.s * 0.8;
          const out = Math.abs(b.m.position.x) > BW - 0.05 || Math.abs(b.m.position.z) > BD - 0.05;
          b.down = true;
          if (out) b.t = 9;
        }
      }
      if (b.down && b.t > 0.7) {
        const k = Math.max(0, 1 - (b.t - 0.7) / 0.3);
        b.m.scale.setScalar(b.s * k);
        if (k <= 0) { this.top.remove(b.m); this.bits.splice(i, 1); continue; }
      }
      if (b.t > 3) { this.top.remove(b.m); this.bits.splice(i, 1); }
    }
  }
  dispose() { csfx.simmer(false); super.dispose(); }
}

// do two pieces' footprints overlap (on the four axes), by more than tol?
function overlapXZ(A, B, tol) {
  const pa = A.mesh.position, pb = B.mesh.position;
  for (let k = 0; k < 4; k++) {
    const [x, z] = AXES[k];
    const ca = pa.x * x + pa.z * z, cb = pb.x * x + pb.z * z;
    if (Math.min(ca + A.hi[k], cb + B.hi[k]) - Math.max(ca + A.lo[k], cb + B.lo[k]) <= tol) return false;
  }
  return true;
}
// the world point where the ray under a screen point meets the horizontal plane y = h
const _ray = new T.Raycaster();
function rayY(x, y, h) {
  _ray.setFromCamera(new T.Vector2((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1), camera);
  const r = _ray.ray;
  if (Math.abs(r.direction.y) < 1e-4) return null;
  const t = (h - r.origin.y) / r.direction.y;
  if (t < 0) return null;
  return r.origin.clone().addScaledVector(r.direction, t);
}
