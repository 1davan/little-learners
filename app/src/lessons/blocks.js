// Block builder (World 5: the building site). Topics mt_Qcp2d_kuta "3-D shapes" and mt_XjwUlmxdCT "Combining simple
// shapes".
// A little model stands on the display stand at the left. On the blueprint build mat its shape waits as soft white
// ghost outlines, one per block. The loose painted wooden blocks (cube, long block, cylinder, cone, roof, arch, ball)
// hop out of the toy box into the tray at the front. Drag a block onto a white shape: it flies over, drops in with real
// physics (a wooden "tok", a little squash) and settles; its twin on the stand gives a hop. On Level 1 a block whose
// base isn't there yet hovers over its place and waits for it; on Levels 2-3 Bear says which block goes first.
// The finished build gets a held breath, a xylophone run and a little gag (a flag pops up, the rocket lifts off, the
// tree and the bridge bounce). Then it is hers: Bear admires it, and a tap on any block knocks the whole build down
// (real physics, away from her finger). If she leaves it, Bear asks "Knock it down?"; a little later the blocks hop
// back into the toy box one by one, still standing until they go. The little model from the stand moves to the shelf
// at the back and stays: a row of everything she built grows all level, and the finale shows it.
// Levels: L1 2–3 blocks, every block in the tray is needed (a block dropped on the wrong ghost finds its own).
//         L2 4–5 blocks, mostly with a roof, plus one spare block that isn't needed; it must go on its own shape.
//         L3 5-block models and the twist: "Which one rolls?" (tap a block on the ramp; physics shows who rolls) and
//         "Put a block on the tower!" (a ball put on the tower really rolls off; the cube stacks).
//
// Test hooks: kind ('build' | 'roll' | 'stack'), blocks (loose tray blocks, b.userData.shape), zones() (z.shape,
// z.open; 'any' on the stack round), drop(block, zone), choices + answer + tapChoice(b) (roll rounds), slots,
// knock() (knocks the finished build down while Bear admires it).
import * as T from '../three.js';
import { Lesson, shuffle } from '../engine/lesson.js';
import { makeAnimal, setFace, popIn, hop } from '../engine/actors.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { physics } from '../engine/physics.js';
import { setCamera, camera, getLook } from '../engine/stage.js';
import { Ease } from '../engine/tween.js';
import { glow } from '../engine/scenery.js';
import { blobShadow, geo, toonUnique, disposeTree } from '../engine/toon.js';
import { makeHardHat } from './bricks-pieces.js';
import {
  SHAPES, COL, MODELS, PLANS, MAT, STAND, TRAY, TOYBOX, RAMP, rampGeo, rampY, supportsOf,
  makeBlock, makeGhost, setGhost, makeMat, makeStand, makeTray, makeToyBox, makeRamp, makeFlag, makeShelf, SHELF,
} from './blocks-pieces.js';
import { ksfx } from './blocks-sound.js';

const K = 1.25;                                           // world size of one block unit on the mat
const KT = 0.9;                                           // ... waiting in the tray (nearer the camera)
const KR = 1.0;                                           // ... on the ramp (three lanes)
const MINI = 0.4;                                         // the model on the stand (the smallest size; small models are shown bigger)
const SHELF_K = 0.27;                                     // a finished model on the keepsake shelf
// The corner, close together: the model stand just left of the blueprint mat, the toy box just right of it, the tray
// in front, the keepsake shelf behind the mat. The camera opens wide, then each round looks close at the model on the
// stand and glides over to the mat and tray, framed to fit what is being built.
const CAMS = {
  wide: { pos: new T.Vector3(0.8, 6.0, 13.4), look: new T.Vector3(0.8, 1.5, -0.8) },
};
const MATP = new T.Vector3(1.0, 0, -1.4);
const STANDP = new T.Vector3(-3.65, 0, -1.7);
const TRAYP = new T.Vector3(1.0, 0, 2.25);
const BOXP = new T.Vector3(5.95, 0, -1.6);
const BEARP = new T.Vector3(7.0, 0, -3.9);               // Bear at the back right, behind the toy box (never behind a build)
const PIPP = new T.Vector3(4.5, 0, -3.2);                 // Pip beside Bear at the shelf's end: in every mat view, never in the model view
const SHELFP = new T.Vector3(1.0, 0, -3.65);              // the keepsake shelf, behind the mat
const _cp = new T.Vector3(), _cl = new T.Vector3();
const RYAW = -0.55;                                       // the ramp's turn: downhill toward the front left, its side to the camera
const FIXED = 1, DYNAMIC = 0;                             // Rapier body types
const ACTION = 'Put the blocks on the white shapes!';
const name = (shape) => SHAPES[shape].name;
const an = (shape) => (/^[aeiou]/.test(name(shape)) ? 'an ' : 'a ') + name(shape);
const cap = (s) => s[0].toUpperCase() + s.slice(1);

export default class BlocksLesson extends Lesson {
  get totalRounds() { return (PLANS[this.level] || PLANS[0]).rounds.length; }

  build() {
    this.plan = PLANS[this.level] || PLANS[0];
    setCamera(CAMS.wide.pos, CAMS.wide.look);
    this.feelInit();
    // the corner: blueprint mat in the middle, the model stand at the left, the tray in front, the toy box at the right
    const mat = (this.mat = makeMat(this.plan.felt));
    mat.position.copy(MATP);
    this.root.add(mat);
    const st = makeStand();
    st.position.copy(STANDP);
    st.add(blobShadow(1.2));
    this.root.add(st);
    // the tray: just long enough for this level's widest row of blocks
    this.trayLen = this.plan.tray || TRAY.len;
    const tray = makeTray(this.trayLen);
    tray.position.copy(TRAYP);
    this.root.add(tray);
    const box = (this.toybox = makeToyBox());
    box.position.copy(BOXP);
    box.rotation.y = -0.2;
    box.add(blobShadow(1.5));
    this.root.add(box);
    // the keepsake shelf at the back: every finished model ends up here
    const shelf = (this.shelf = makeShelf());
    shelf.position.copy(SHELFP);
    this.root.add(shelf);
    this.shelfX = SHELFP.x - SHELF.len / 2 + 0.35;
    this.kept = [];
    // colliders: the mat top, the tray (floor + rims), the stand, the toy box, the shelf, Bear and Pip
    // (things that topple or roll bump them instead of passing through)
    physics.box(new T.Vector3(MATP.x, MAT.top / 2, MATP.z), new T.Vector3(MAT.w, MAT.top, MAT.d));
    const TL = this.trayLen;
    physics.box(new T.Vector3(TRAYP.x, TRAY.floor / 2, TRAYP.z), new T.Vector3(TL, TRAY.floor, TRAY.d));
    for (const s of [-1, 1]) {
      physics.box(new T.Vector3(TRAYP.x, TRAY.rim / 2, TRAYP.z + s * (TRAY.d / 2 - 0.07)), new T.Vector3(TL, TRAY.rim, 0.14));
      physics.box(new T.Vector3(TRAYP.x + s * (TL / 2 - 0.07), TRAY.rim / 2, TRAYP.z), new T.Vector3(0.14, TRAY.rim, TRAY.d));
    }
    physics.box(new T.Vector3(STANDP.x, STAND.top / 2, STANDP.z), new T.Vector3(STAND.r * 1.6, STAND.top, STAND.r * 1.6));
    physics.box(new T.Vector3(BOXP.x, TOYBOX.h / 2, BOXP.z), new T.Vector3(TOYBOX.w, TOYBOX.h, TOYBOX.d), -0.2);
    physics.box(new T.Vector3(SHELFP.x, SHELF.top / 2, SHELFP.z), new T.Vector3(SHELF.len, SHELF.top, SHELF.d));
    physics.box(new T.Vector3(BEARP.x, 1.1, BEARP.z), new T.Vector3(1.6, 2.2, 1.4));
    physics.box(new T.Vector3(PIPP.x, 0.9, PIPP.z), new T.Vector3(1.3, 1.8, 1.2));
    // Bear the builder (hard hat) beside the stand, Pip by the toy box
    const bear = (this.bear = makeAnimal('bear'));
    bear.position.copy(BEARP);
    bear.rotation.y = -0.45;
    this.root.add(bear);
    const hat = makeHardHat();
    hat.scale.setScalar(1.12);
    hat.position.set(0, 0.88, 0.02);
    hat.rotation.x = -0.12;
    (bear.userData.head || bear).add(hat);
    for (const e of ['earL1', 'earR1']) bear.userData.bones?.[e]?.scale.setScalar(0.3);
    this.bearArms = bear.userData.arms ? bear.userData.arms.map((a) => a.rotation.clone()) : null;
    this.bearYaw = bear.rotation.y;
    this.pip.position.copy(PIPP);
    this.pip.rotation.y = -0.3;
    this.pip.scale.setScalar(0.85);
    this.pip.userData.baseScale = 0.85;
    // the model on the stand turns to face us
    this.mini = new T.Group();
    this.mini.position.set(STANDP.x, STAND.top, STANDP.z + 0.1);
    this.root.add(this.mini);
    const bc = this.buildCam(2);
    this.mini.rotation.y = Math.atan2(bc.pos.x - STANDP.x, bc.pos.z - STANDP.z) * 0.8;
    this.pokeable(this.mini, { fn: () => this.pokeModel() });
    // the glow behind a finished build, and the "?" glow on the stack round
    this.halo = glow(0xffe27a, 1, 0);
    this.halo.position.set(MATP.x, 2, MATP.z - 0.9);
    this.root.add(this.halo);
    this.topGlow = glow(0xffffff, 1.6, 0);
    this.root.add(this.topGlow);
    this.slots = [];
    this.loose = [];
    this.placedB = [];
    this.choices = [];
    this.strays = [];
    this.minis = [];
    this.kind = 'build';
    this.phase = 'idle';
    this.dropN = 0;
  }

  // ---------------- helpers ----------------
  get blocks() { return this.loose.filter((b) => b.userData.state === 'tray'); }
  get spec() { return this.plan.rounds[this.round]; }
  get answer() { const s = this.spec; return s && (s.answer || null); }
  slotCenter(s) { return new T.Vector3(MATP.x + s.x * K, MAT.top + (s.y + SHAPES[s.shape].h / 2) * K, MATP.z); }
  isOpen(s) { return s.sup.every((q) => q.claimed); }   // (a support on its way counts: the block waits for it)
  zones() {
    if (this.phase !== 'build') return [];
    if (this.kind === 'stack') return this.topZone ? [this.topZone] : [];
    return this.slots.filter((s) => !s.claimed).map((s) => ({ id: s.i, slot: s, shape: s.shape, open: this.isOpen(s), pos: this.slotCenter(s), radius: Math.max(0.75, SHAPES[s.shape].w * 0.6) * K }));
  }
  // the next sensible move: a loose block and where it goes
  pair() {
    if (this.kind === 'roll') return null;
    const loose = this.blocks.filter((b) => !b.userData.extra);
    if (this.kind === 'stack') { const b = loose.find((x) => x.userData.shape === this.answer); return b && this.topZone ? { b, z: this.topZone } : null; }
    const zs = this.zones().filter((z) => z.open).sort((a, c) => a.slot.y - c.slot.y);
    for (const z of zs) { const b = loose.find((x) => x.userData.shape === z.shape && x.userData.col === z.slot.col) || loose.find((x) => x.userData.shape === z.shape); if (b) return { b, z }; }
    return null;
  }

  // move a block along an arc (cancels any move before it)
  fly(b, to, { dur = 0.4, arc = 1.0, spin = 0, scale = K, rot = null, ease = Ease.out } = {}) {
    const id = (b.userData.mv = (b.userData.mv || 0) + 1);
    const a = b.position.clone(), k0 = b.scale.x;
    const q0 = b.quaternion.clone(), q1 = rot ? new T.Quaternion().setFromEuler(rot) : new T.Quaternion();
    return this.s.anim(dur, (e, q) => {
      if (b.userData.mv !== id) return;
      b.position.lerpVectors(a, to, e);
      b.position.y += Math.sin(q * Math.PI) * arc;
      b.quaternion.slerpQuaternions(q0, q1, e);
      if (spin) b.rotateY(spin * Math.PI * 2 * e);
      b.scale.setScalar(k0 + (scale - k0) * e);
    }, ease).then(() => {
      if (b.userData.mv !== id || this.dead) return false;
      b.position.copy(to); b.quaternion.copy(q1); b.scale.setScalar(scale);
      return true;
    });
  }
  squash(b, amt = 0.18) {
    const k = b.scale.x;
    return this.s.anim(0.22, (_, q) => { const w = 1 - Math.sin(q * Math.PI) * amt * (1 - q * 0.5); b.scale.set(k / Math.sqrt(w), k * w, k / Math.sqrt(w)); }).then(() => b.scale.setScalar(k));
  }
  // physics: pin a body still exactly at a pose / let it go again
  freeze(b, pos = b.position, quat = b.quaternion) {
    const body = physics.body(b);
    if (!body) { b.position.copy(pos); b.quaternion.copy(quat); return; }
    body.setBodyType(FIXED, true);
    body.setTranslation({ x: pos.x, y: pos.y, z: pos.z }, true);
    body.setRotation({ x: quat.x, y: quat.y, z: quat.z, w: quat.w }, true);
    b.position.copy(pos); b.quaternion.copy(quat);
  }
  unfreeze(b, spin = true) {
    const body = physics.body(b);
    if (!body) return null;
    body.setBodyType(DYNAMIC, true);
    if (spin) body.lockRotations(false, true);
    body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    body.wakeUp();
    return body;
  }
  // a frozen block's pose can still be shown off (hop, shake): move its fixed body
  moveFixed(b, p) { const body = physics.body(b); if (body) body.setTranslation({ x: p.x, y: p.y, z: p.z }, true); else b.position.copy(p); }

  // ---------------- the tray ----------------
  newBlock(shape, col, extra = false) {
    const b = makeBlock(shape, col, KT);
    b.userData.extra = extra;
    b.userData.state = 'move';
    b.visible = false;                 // it appears when it hops out of the toy box (never at the world origin)
    this.root.add(b);
    b.userData.drag = input.addDrag(b, {
      radius: Math.max(0.62, SHAPES[shape].w * 0.55) * KT, minY: TRAY.floor + SHAPES[shape].h * KT / 2,
      zones: () => this.zones(),
      onPick: () => this.onPick(b),
      onMove: (_t, z) => this.onHover(b, z),
      onDrop: (z, info) => this.drop(b, z, info),
    });
    b.userData.drag.enabled = false;
    return b;
  }
  // lay a row of blocks out along the tray, centred (closer together when the row is long, never into the rims)
  traySpots(list) {
    const ws = list.map((b) => SHAPES[b.userData.shape].w * KT);
    const sum = ws.reduce((a, w) => a + w, 0);
    const gap = list.length > 1 ? Math.max(0.12, Math.min(0.4, (this.trayLen - 0.8 - sum) / (list.length - 1))) : 0;
    const tot = sum + gap * (list.length - 1);
    let x = TRAYP.x - tot / 2;
    return list.map((b, i) => { const p = new T.Vector3(x + ws[i] / 2, TRAY.floor + SHAPES[b.userData.shape].h * KT / 2 + 0.005, TRAYP.z); x += ws[i] + gap; return p; });
  }
  // blocks hop out of the toy box into the tray, one after another
  fromBox(list, delay = 0) {
    const spots = this.traySpots(list);
    list.forEach((b, i) => {
      b.userData.spot = spots[i];
      b.visible = false;
      this.s.wait(delay + 0.05 + i * 0.3).then(() => {
        if (this.dead) return;
        b.position.copy(BOXP).add(new T.Vector3(0, TOYBOX.h, 0));
        b.scale.setScalar(KT * 0.4);
        b.rotation.set(0, 0, 0);
        b.visible = true;
        this.fly(b, spots[i], { dur: 0.8, arc: 1.6, spin: i % 2 ? 0.5 : -0.5, scale: KT, ease: Ease.inOut }).then((ok) => {
          if (!ok) return;
          ksfx.knock();
          this.squash(b, 0.1);
          b.userData.state = 'tray';
          b.userData.drag.enabled = !this.errorlessOn || !b.userData.extra;
        });
      });
    });
  }
  goBack(b) {
    b.userData.state = 'move';
    b.userData.drag.enabled = false;
    return this.fly(b, b.userData.spot, { dur: 0.65, arc: 0.9, scale: KT, ease: Ease.inOut }).then((ok) => {
      if (!ok) return;
      this.squash(b, 0.08);
      b.userData.state = 'tray';
      b.userData.drag.enabled = !(this.errorlessOn && b.userData.extra);
    });
  }

  // ---------------- rounds ----------------
  async startRound(r) {
    this.busy = true;
    const spec = this.spec;
    this.kind = spec.build ? 'build' : spec.roll ? 'roll' : 'stack';
    this.phase = 'setup';
    this.dropN = 0;
    this.knocked = false;
    if (this.kind === 'roll') {
      // the ramp and its blocks come while the camera turns to it (the first block lands as it arrives)
      this.glide(this.buildCam(1.8), r === 0 ? 0.9 : 0.6);
      this.setupRoll(spec);
      await this.wait(1.15);
    } else {
      // everything at once (rule 0): the little model builds itself up on its stand, the ghosts fade in on the mat
      // and the blocks hop out of the toy box, all in one view; she can take the first block as soon as it lands
      // (about 0.9 s). The model stays on its stand all round (tap it: it wiggles, "Like this!").
      if (this.kind === 'build') this.setupBuild(MODELS[spec.build]);
      else this.setupStack(spec);
      this.say(this.introText(), { max: 1.4 });
      this.saidAt = this.round;
      const top = Math.max(...this.slots.map((sl) => sl.y + SHAPES[sl.shape].h));
      this.glide(this.buildCam(top), r === 0 ? 0.9 : 0.6);
      this.showGhosts();
      this.fromBox(this.loose, 0);
      await this.wait(0.88);
    }
    if (this.dead) return;
    this.phase = this.kind === 'roll' ? 'roll' : 'build';
    this.busy = false;
    this.cue();
  }
  // the close-up on the mat and the tray: the whole tray and the finished build (with room for its flag and the
  // caption above it) always in view, as close as that allows
  // (the model on its stand at the left and the toy box at the right are in the same view, so nothing has to wait)
  buildCam(top) {
    const H = MAT.top + top * K;
    const x0 = STANDP.x - STAND.r - 0.25, x1 = BOXP.x + TOYBOX.w / 2 + 0.3;
    const cx = (x0 + x1) / 2;
    const look = new T.Vector3(cx, 0.35 + H * 0.36, 0.2);
    const tanH = Math.tan((camera.fov * Math.PI) / 360) * camera.aspect;
    const dSides = (x1 - x0) / 2 / tanH - (look.z - STANDP.z) * 0.9;           // stand and box (further back)
    const dTray = (this.trayLen / 2 + 0.4) / tanH + (TRAYP.z - look.z);        // the tray (nearer)
    const D = Math.max(7.6, dSides, dTray, (H + 3.6) / 0.6 - 1.6);
    return { pos: new T.Vector3(cx, look.y + D * 0.4, look.z + D), look };
  }
  // a tap on the little model: it wiggles on its stand and says what it's for
  pokeModel() {
    if (this.dead || !this.minis.length || this.modelWig) return;
    this.modelWig = true;
    const g = this.mini;
    this.s.anim(0.6, (_, p) => { g.rotation.z = Math.sin(p * Math.PI * 3) * 0.12 * (1 - p); g.scale.setScalar(1 + Math.sin(p * Math.PI) * 0.08); })
      .then(() => { g.rotation.z = 0; g.scale.setScalar(1); this.modelWig = false; });
    this.say('Like this!', { max: 1 });
  }
  introText() {
    const s = this.spec;
    if (!s) return '';
    if (this.kind === 'roll') return 'Which one rolls? Tap it!';
    if (this.kind === 'stack') return 'Put a block on the tower!';
    const m = MODELS[s.build];
    return this.round === 0 ? `Let's build ${m.name} like this!` : `Now ${m.name}!`;
  }
  // what to do (said at the start of the first build of a level, and again by the reminders when she is stuck)
  promptText() {
    if (!this.spec) return '';
    if (this.kind === 'roll') return 'Which one rolls? Tap it!';
    if (this.kind === 'stack') return 'Put a block on the tower!';
    return ACTION;
  }
  prompt(opts = {}) { const t = this.promptText(); if (t) this.say(t, { max: 1.5, ...opts }); }
  // what the child is being asked to do (each new kind gets its own slow hand demo)
  action() {
    if (this.busy || this.phase === 'setup' || this.phase === 'done') return null;
    return this.kind === 'roll' ? (this.phase === 'roll' ? 'roll' : null) : this.phase === 'build' ? this.kind : null;
  }

  setupBuild(model) {
    this.model = model;
    const slots = (this.slots = model.slots.map((s, i) => ({ ...s, i, filled: false, block: null })));
    const sup = supportsOf(slots);
    slots.forEach((s, i) => { s.sup = sup[i]; s.ready = new Promise((res) => (s.done = res)); });
    // the ghosts (shown once the camera turns to the mat)
    for (const s of slots) {
      const g = (s.ghost = makeGhost(s.shape, K));
      g.position.copy(this.slotCenter(s));
      g.scale.setScalar(0.01);
      g.visible = false;
      this.root.add(g);
    }
    this.showMini(slots);
    // the blocks for it (and on Levels 2-3 one spare) hop into the tray
    const list = shuffle(slots).map((s) => this.newBlock(s.shape, s.col));
    if (this.plan.extra) {
      const used = new Set(slots.map((s) => s.shape));
      const spare = shuffle(['cube', 'cyl', 'cone', 'ball', 'cuboid', 'roof', 'arch'].filter((k) => !used.has(k)))[0];
      if (spare) list.splice(Math.floor(Math.random() * (list.length + 1)), 0, this.newBlock(spare, shuffle([COL.green, COL.pink, COL.sky, COL.orange])[0], true));
    }
    this.loose = list;
  }
  // the ghosts fade in on the mat, bottom first
  showGhosts() {
    for (const f of this.later || []) f();
    this.later = [];
    const order = this.slots.filter((s) => s.ghost).sort((a, b) => a.y - b.y || a.x - b.x);
    order.forEach((s, i) => { const g = s.ghost; g.visible = true; this.s.wait(0.05 + i * 0.15).then(() => { if (s.ghost === g) this.s.tween(g.scale, { x: K, y: K, z: K }, 0.5, Ease.inOut); }); });
  }
  // the little model on the stand: each mini block pops in, bottom first
  showMini(slots, { mark = null } = {}) {
    if (!slots.length) return;
    const xs = slots.flatMap((s) => [s.x - SHAPES[s.shape].w / 2, s.x + SHAPES[s.shape].w / 2]);
    const cx = (this.miniCx = (Math.min(...xs) + Math.max(...xs)) / 2);
    // as big as fits the stand's top (2.2 wide, 1.9 tall): a two-block tree is shown at 0.7, a wide castle at 0.4
    const wU = Math.max(...xs) - Math.min(...xs), hU = Math.max(...slots.map((s) => s.y + SHAPES[s.shape].h));
    const MK = (this.miniK = Math.max(MINI, Math.min(0.7, 2.2 / wU, 1.9 / hU)));
    const order = slots.slice().sort((a, b) => a.y - b.y || a.x - b.x);
    this.minis = slots.map((s) => {
      const m = makeBlock(s.shape, s.col, MK);
      m.position.set((s.x - cx) * MK, (s.y + SHAPES[s.shape].h / 2) * MK, 0);
      m.userData.rest = m.position.clone();
      m.userData.slot = s;
      m.visible = false;
      this.mini.add(m);
      const k = order.indexOf(s);
      this.s.wait(0.2 + k * 0.22).then(() => { if (this.dead) return; if (k === 0) ksfx.tick(0); popIn(this.s, m, MK, 0.5, { sound: false }); });
      return m;
    });
    // the stand gives the new model one slow turn so you can see it all round
    const r0 = this.mini.userData.r0 ?? (this.mini.userData.r0 = this.mini.rotation.y);
    this.s.wait(0.3 + slots.length * 0.22).then(() => this.s.anim(1.6, (e) => { this.mini.rotation.y = r0 + e * Math.PI * 2; }, Ease.inOut)).then(() => { this.mini.rotation.y = r0; });
    if (mark) { const q = new T.Vector3(mark.x, mark.y, 0); this.mini.localToWorld(q); this.s.wait(0.5).then(() => fx.float(q, '?', { color: '#ffffff', size: 9 })); }
  }
  // a mini twin on the stand takes on a colour (when she built the model with the colours the other way round)
  recolourMini(slot) {
    const old = this.minis[slot.i];
    if (!old) return;
    const m = makeBlock(slot.shape, slot.col, this.miniK || MINI);
    m.position.copy(old.position);
    m.userData.rest = old.userData.rest;
    m.userData.slot = slot;
    m.visible = old.visible;
    this.mini.add(m);
    this.mini.remove(old);
    this.minis[slot.i] = m;
  }

  // ---------------- dragging ----------------
  onPick(b) {
    if (b.userData.state !== 'tray') return;
    this.carrying = b;
    this.idle = 0;
    this.endDemo();
    this.s.stop(b.scale);
    this.s.tween(b.scale, { x: KT * 1.12, y: KT * 1.12, z: KT * 1.12 }, 0.2, Ease.out);
    // what is it called? (said, so a child who can't read hears the shape's name; repeats are caption only)
    this.say(`${cap(an(b.userData.shape))}!`, { max: 0.6 });
  }
  onHover(b, z) {
    const on = z && (z.shape === 'any' || z.shape === b.userData.shape) && (z.open || this.level === 0) ? z : null;
    if ((on && on.id) === (this.hoverZ && this.hoverZ.id) && !!on === !!this.hoverZ) return;
    this.hoverZ = on;
    if (on) sfx.tick();
  }

  async drop(b, zone, { tapped = false } = {}) {
    this.carrying = null;
    this.hoverZ = null;
    if (this.dead || b.userData.state !== 'tray') return;
    this.s.stop(b.scale);
    b.scale.setScalar(KT);
    if (this.phase !== 'build' || this.busy) { this.goBack(b); return; }
    if (!zone) {
      this.goBack(b);
      if (tapped) ksfx.knock();
      return;
    }
    const shape = b.userData.shape, col = b.userData.col;
    if (this.kind === 'stack') {
      if (this.topSlot.claimed) { this.goBack(b); return; }
      if (shape === this.answer) return this.place(b, this.topSlot);
      return this.rollOff(b);
    }
    if (b.userData.extra) { this.goBack(b); this.redirect(`We don't need ${an(shape)}!`); return; }
    let slot = zone.slot;
    const mine = this.slots.filter((s) => !s.filled && !s.claimed && s.shape === shape);
    if (slot.shape !== shape || slot.claimed) {
      // Level 1 is forgiving: a needed block dropped anywhere on the build goes to its own place (its colour first)
      const own = mine.find((s) => s.col === col && this.isOpen(s)) || mine.find((s) => s.col === col) || mine.find((s) => this.isOpen(s)) || mine[0];
      if (this.level === 0 && own) slot = own;
      else {
        this.goBack(b);
        this.flashGhosts(shape);
        this.redirect(`The ${name(shape)} goes there!`);
        return;
      }
    } else if (!this.isOpen(slot)) {
      // the same shape lower down and ready (a second cube on a tower): it goes there
      const open = mine.find((s) => s.col === col && this.isOpen(s)) || mine.find((s) => this.isOpen(s));
      if (open) slot = open;
    }
    if (!this.isOpen(slot) && this.level > 0) {
      // Levels 2-3: say which block goes first (the lowest one still missing under it), and light its place
      const low = this.lowestMissing(slot);
      this.goBack(b);
      if (low) { this.flashGhosts(null, [low]); this.redirect(`First the ${name(low.shape)}!`); }
      return;
    }
    // the colours of the copy follow what she does: if this shape's place has the other colour, the two swap
    if (slot.col !== col) {
      const twin = mine.find((s) => s !== slot && s.col === col);
      if (twin) { twin.col = slot.col; slot.col = col; this.recolourMini(twin); this.recolourMini(slot); }
    }
    this.place(b, slot);
  }
  // the lowest empty place holding `slot` up (following the supports down)
  lowestMissing(slot) {
    let best = null;
    const walk = (s) => { for (const q of s.sup) { if (!q.filled && !q.claimed && (!best || q.y < best.y)) best = q; walk(q); } };
    walk(slot);
    return best;
  }
  flashGhosts(shape, list = null) {
    const gs = (list || this.slots.filter((s) => !s.filled && s.shape === shape)).map((s) => s.ghost).filter(Boolean);
    for (const g of gs) g.userData.flash = 1.2;
  }

  // a block flies over its place and drops in with physics, then settles, pinned. On Level 1 a block whose base
  // isn't there yet hovers high over its place (bobbing gently) until the base is in.
  async place(b, slot) {
    slot.claimed = true;
    slot.block = b;
    b.userData.state = 'placed';
    b.userData.drag.enabled = false;
    input.remove(b.userData.drag);
    this.loose = this.loose.filter((x) => x !== b);
    this.idle = 0;
    this.clearHints();
    this.endDemo();
    const p = this.slotCenter(slot);
    const above = p.clone().add(new T.Vector3(0, 0.55, 0));
    if (!this.isOpen(slot)) {
      // wait up high, clear of the blocks still to come under it
      const hover = p.clone().add(new T.Vector3(0, 1.5, 0));
      const ok = await this.fly(b, hover, { dur: 0.7, arc: 0.9, ease: Ease.inOut });
      if (!ok || this.dead) return;
      const id = b.userData.mv;
      let waiting = true;
      Promise.all(slot.sup.map((q) => q.ready)).then(() => { waiting = false; });
      while (waiting && !this.dead && b.userData.mv === id) {
        const t = performance.now() / 1000;
        b.position.y = hover.y + Math.sin(t * 2.4) * 0.08;   // every waiting block bobs in step (never into another)
        await this.wait(1 / 60);
      }
      if (this.dead) return;
      const ok2 = await this.fly(b, above, { dur: 0.45, arc: 0, ease: Ease.inOut });
      if (!ok2 || this.dead) return;
    } else {
      const ok = await this.fly(b, above, { dur: 0.6, arc: 1.0, ease: Ease.inOut });
      if (!ok || this.dead) return;
      // wait for whatever it stands on
      await Promise.all(slot.sup.map((q) => q.ready));
      if (this.dead) return;
    }
    if (slot.ghost) { const g = slot.ghost; slot.ghost = null; this.fadeAway(g, 0.15).then(() => this.gone(g)); }
    if (physics.ok) {
      physics.add(b, { spin: false, bounce: 0.12, friction: 0.9 });
      physics.body(b).setLinvel({ x: 0, y: -1.5, z: 0 }, true);
      const t0 = performance.now();
      while (!this.dead) {
        await this.wait(1 / 60);
        const el = (performance.now() - t0) / 1000;
        const body = physics.body(b);
        if (!body) break;
        const v = body.linvel();
        if ((el > 0.16 && Math.abs(v.y) < 0.25) || el > 0.6) break;
      }
      if (this.dead) return;
      this.freeze(b, p, new T.Quaternion());
    } else {
      await this.fly(b, p, { dur: 0.12, arc: 0 });
      this.squash(b, 0.2);
    }
    slot.filled = true;
    this.placedB.push(b);
    const n = this.dropN++;
    ksfx.tok(n);
    // its twin on the stand hops (with whatever stands on it), Bear nods
    this.hopMini(slot);
    const bh = this.bear.userData.head;
    if (bh) this.s.anim(0.6, (_, q) => { bh.rotation.x = Math.sin(q * Math.PI) * 0.2; }).then(() => { bh.rotation.x = 0; });
    slot.done();
    if (this.slots.every((s) => s.filled) && this.phase === 'build') {
      await Promise.all(this.slots.map((s) => s.ready));
      if (!this.dead && this.phase === 'build') this.complete();
    }
  }
  // the slots standing on `slot` (directly or higher up)
  aboveOf(slot) {
    const out = new Set();
    const add = (s) => { for (const q of this.slots) if (q.sup && q.sup.includes(s) && !out.has(q)) { out.add(q); add(q); } };
    add(slot);
    return [...out];
  }
  hopMini(slot) {
    const list = [slot, ...this.aboveOf(slot)].map((s) => this.minis[s.i]).filter(Boolean);
    if (!list.length) return;
    this.s.anim(0.5, (_, q) => { const y = Math.sin(q * Math.PI) * 0.12; for (const m of list) m.position.y = m.userData.rest.y + y; }).then(() => { for (const m of list) m.position.copy(m.userData.rest); });
  }

  // the stack twist: a ball put on the tower rolls straight off (physics), then hops back to the tray. It's no
  // mistake: that's what balls do.
  async rollOff(b) {
    b.userData.state = 'placed';
    b.userData.drag.enabled = false;
    const top = this.slotCenter(this.topSlot).add(new T.Vector3(0.12, 0.6, 0));
    const ok = await this.fly(b, top, { dur: 0.6, arc: 1.0, ease: Ease.inOut });
    if (!ok || this.dead) return;
    this.say(`Oops! The ${name(b.userData.shape)} rolls off!`, { max: 1.2 });
    if (physics.ok) {
      physics.add(b, { shape: 'ball', r: 0.5 * K, bounce: 0.3, friction: 0.8 });
      physics.body(b).setLinvel({ x: 1.6, y: -0.5, z: 0.25 }, true);
      ksfx.roll(0.8);
      await this.wait(1.2);
      if (this.dead || b.userData.state === 'gone') return;
      physics.remove(b);
    }
    if (b.userData.state === 'gone') return;
    b.userData.state = 'tray';
    this.goBack(b);
  }

  // ---------------- the finished build ----------------
  // every block hops in turn, carrying what stands on it (so nothing ever rises into the block above)
  runHops(list, { lift = 0.18, step = 0.12, dur = 0.35, notes = false } = {}) {
    const bySlot = new Map(this.slots.map((s) => [s, s.block]));
    const order = this.slots.slice().filter((s) => s.block).sort((a, b) => a.y - b.y);
    const rest = new Map(order.map((s) => [s, s.block.position.clone()]));
    const sup = supportsOf(order);
    const total = dur + step * order.length;
    if (notes) order.forEach((s, i) => this.s.wait(i * step).then(() => { if (!this.dead) ksfx.tok(i); }));
    return this.s.anim(total, (_, p) => {
      const t = p * total, off = new Map();
      order.forEach((s, i) => {
        const q = (t - i * step) / dur;
        const own = q > 0 && q < 1 ? Math.sin(q * Math.PI) * lift : 0;
        const under = Math.max(0, ...sup[i].map((u) => off.get(u) || 0));
        off.set(s, own + under);
        this.moveFixed(bySlot.get(s), rest.get(s).clone().add(new T.Vector3(0, own + under, 0)));
      });
    }).then(() => { for (const s of order) this.moveFixed(s.block, rest.get(s)); });
  }
  async complete() {
    this.phase = 'done';
    const list = this.slots.map((s) => s.block).filter(Boolean).sort((a, c) => a.position.y - c.position.y);
    const topY = Math.max(...list.map((b) => b.position.y + (b.userData.h * K) / 2));
    const xs = list.map((b) => b.position.x);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    // the held breath, then a xylophone run up the build
    await this.beat(null, 0.4);
    if (this.dead) return;
    ksfx.run(list.length);
    const runP = this.runHops(list);
    // the glow behind it
    this.halo.position.set(cx, topY / 2 + 0.2, MATP.z - 0.9);
    this.halo.scale.setScalar(Math.max(3.5, topY * 1.8));
    this.s.anim(1.8, (_, p) => { this.halo.material.opacity = Math.sin(Math.min(1, p * 1.2) * Math.PI) * 0.45; }).then(() => { this.halo.material.opacity = 0; });
    const gagP = runP.then(() => this.gag(this.model?.gag, list, cx, topY));
    // Bear is delighted (face and arms)
    const bf = this.bear.userData.face;
    if (bf) { setFace(bf, 'joy'); this.s.wait(1.2).then(() => setFace(bf, 'happy')); }
    const arms = this.bear.userData.arms;
    if (arms) this.s.anim(1.2, (_, p) => { const up = Math.sin(Math.min(1, p * 1.4) * Math.PI) * 2.2; arms[0].rotation.z = this.bearArms[0].z + up; arms[1].rotation.z = this.bearArms[1].z - up; }).then(() => { arms[0].rotation.z = this.bearArms[0].z; arms[1].rotation.z = this.bearArms[1].z; });
    this.payoffP = gagP;
    if (this.kind === 'stack') this.success(new T.Vector3(cx, topY + 0.8, MATP.z + 0.5), 'The cube stacks!', { voice: true });
    else this.success(new T.Vector3(cx, topY + 0.8, MATP.z + 0.5), `You built ${this.model.name}!`);
  }
  gag(kind, list, cx, topY) {
    if (this.dead) return null;
    const top = list[list.length - 1];
    if (kind === 'flag' && top) {
      const cols = [COL.red, COL.yellow, COL.blue, COL.pink, COL.green].filter((c) => c !== top.userData.col);
      const f = (this.flag = makeFlag(cols[this.round % cols.length]));
      const y = top.userData.shape === 'cone' || top.userData.shape === 'roof' ? top.position.y + top.userData.h * K / 2 - 0.12 : top.position.y + top.userData.h * K / 2;
      f.position.set(top.position.x, y, top.position.z);
      this.root.add(f);
      return popIn(this.s, f, 1, 0.6, { sound: false });
    }
    if (kind === 'rocket') {
      // the rocket rumbles, lifts off a little in a puff of smoke and lands again
      ksfx.blast();
      const rest = list.map((b) => b.position.clone());
      for (let i = 0; i < 6; i++) this.s.wait(0.06 + i * 0.12).then(() => this.puff(new T.Vector3(cx + (i % 2 ? 0.55 : -0.55) + (Math.random() - 0.5) * 0.3, MAT.top + 0.25, MATP.z + 0.5 + Math.random() * 0.3)));
      return this.s.anim(1.3, (_, p) => {
        const lift = Math.sin(p * Math.PI) * 0.7, sh = Math.sin(p * 50) * 0.025 * (1 - p);
        list.forEach((b, i) => this.moveFixed(b, rest[i].clone().add(new T.Vector3(sh, lift, 0))));
      }).then(() => { list.forEach((b, i) => this.moveFixed(b, rest[i])); });
    }
    if (kind === 'bounce') {
      // a second, bigger run up the build, one note per block
      return this.runHops(list, { lift: 0.3, step: 0.16, dur: 0.42, notes: true });
    }
    return null;
  }

  // take something out of the scene for good (its own materials / geometry freed; shared ones are kept)
  gone(o) { if (o.parent) o.parent.remove(o); disposeTree(o); }
  // a soft white smoke puff that swells, drifts up and fades
  puff(p) {
    if (this.dead) return;
    const m = new T.Mesh(geo.sphere(0.32, 14, 10), toonUnique(0xffffff, { transparent: true, opacity: 0.9 }));
    m.position.copy(p);
    this.root.add(m);
    this.s.anim(0.6, (e) => { m.scale.setScalar(0.5 + e * 1.3); m.position.y = p.y + e * 0.7; m.material.opacity = 0.9 * (1 - e); }, Ease.out).then(() => { this.root.remove(m); m.material.dispose(); });
  }

  async afterSuccess() {
    const last = this.round >= this.totalRounds;
    if (this.kind === 'roll') {
      // let the roll play out: until it reaches the tray or slows right down (at most ~0.8 s more)
      const b = this.choices.find((c) => c.userData.state === 'rolling');
      for (let i = 0; i < 48 && b && !this.dead; i++) {
        const body = physics.body(b);
        if (!body) break;
        const v = body.linvel();
        if (b.position.z > TRAYP.z - 1.3 || (i > 10 && Math.hypot(v.x, v.y, v.z) < 0.3)) break;
        await this.wait(1 / 60);
      }
      await this.wait(0.2);
      if (this.dead) return;
      this.sweep();
      await this.wait(0.8);
      return;
    }
    // the build is hers now: Bear admires it; a tap on any block knocks it down
    await this.admireBuild();
    if (this.dead) return;
    this.keepMini();
    if (last && !this.knocked) { this.tidyRound(); return; }   // the last build stays standing for the finale
    this.sweep();
    await this.wait(last ? 1.6 : 0.7);
  }
  // Bear turns to the build and claps once; every block is live: a tap topples the build from that block. Left alone,
  // Bear asks "Knock it down?" at 8 s and leans toward it; at 14 s the round moves on with the build still standing.
  async admireBuild() {
    this.phase = 'admire';
    const list = this.placedB.slice();
    if (!list.length) return;
    this.knockTaps = list.map((b) => input.addTap(b, { radius: Math.max(0.7, b.userData.w * 0.55) * K, press: false, onTap: () => this.knock(b) }));
    const bear = this.bear, yaw0 = this.bearYaw;
    const toward = Math.atan2(MATP.x - BEARP.x, MATP.z - BEARP.z);
    this.s.tween(bear.rotation, { y: yaw0 + (toward - yaw0) * 0.6 }, 0.5, Ease.inOut).then(() => this.clap());
    let asked = false;
    const t0 = performance.now();
    while (!this.dead && !this.knocked) {
      const el = (performance.now() - t0) / 1000;
      if (el > 8 && !asked) {
        asked = true;
        this.say('Knock it down?', { max: 1.5 });
        const b = bear.userData.body || bear;
        const x0 = b.rotation.x;
        this.s.anim(0.6, (e) => { if (!this.knocked) b.rotation.x = x0 + 0.18 * e; }, Ease.inOut).then(() => this.s.wait(1.4)).then(() => this.s.anim(0.6, (e) => { b.rotation.x = x0 + 0.18 * (1 - e); }, Ease.inOut));
      }
      if (el > 14) break;
      await this.wait(0.1);
    }
    for (const t of this.knockTaps || []) input.remove(t);
    this.knockTaps = [];
    if (this.knocked) await this.wait(1.6);   // let it tumble and settle
    if (this.dead) return;
    this.s.tween(bear.rotation, { y: yaw0 }, 0.5, Ease.inOut);
  }
  clap() {
    const arms = this.bear.userData.arms;
    if (!arms || this.dead) return;
    this.s.anim(0.45, (_, p) => { const k = Math.sin(p * Math.PI); arms[0].rotation.z = this.bearArms[0].z - k * 0.9; arms[1].rotation.z = this.bearArms[1].z + k * 0.9; })
      .then(() => { arms[0].rotation.z = this.bearArms[0].z; arms[1].rotation.z = this.bearArms[1].z; });
  }
  // knock the finished build down from block b: everything tumbles away from her finger (real physics)
  knock(b = null) {
    if (this.knocked || this.dead || this.phase !== 'admire') return;
    const list = this.placedB.slice();
    if (!list.length || !physics.ok) return;
    this.knocked = true;
    this.idle = 0;
    for (const t of this.knockTaps || []) input.remove(t);
    this.knockTaps = [];
    const hit = b || list[list.length - 1];
    // the flag goes first (it never hangs in the air beside a falling block)
    if (this.flag) { const f = this.flag; this.flag = null; this.fadeAway(f, 0.25).then(() => this.gone(f)); }
    ksfx.crash(list.length);
    const xs = list.map((q) => q.position.x), cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const base = Math.min(...list.map((q) => q.position.y));
    const side = (q) => { const d = q.position.x - hit.position.x; return Math.abs(d) > 0.2 ? Math.sign(d) : (hit.position.x >= cx ? 1 : -1); };
    for (const q of list) {
      const body = this.unfreeze(q);
      if (!body) continue;
      const up = (q.position.y - base) / K, s = side(q);
      physics.impulse(q, { x: s * (0.5 + up * 0.55) + (Math.random() - 0.5) * 0.3, y: 0.9 + Math.random() * 0.5, z: (Math.random() - 0.5) * 0.4 },
        { x: (Math.random() - 0.5) * 0.4, y: (Math.random() - 0.5) * 0.3, z: -s * (0.3 + Math.random() * 0.3) });
    }
    const bf = this.bear.userData.face;
    if (bf) { setFace(bf, 'joy'); this.s.wait(1.4).then(() => setFace(bf, 'happy')); }
    hop(this.s, this.bear, 0.25, 0.4);
  }
  // the little model on the stand moves to the keepsake shelf at the back and stays there
  keepMini() {
    const list = this.minis.filter((m) => m.parent === this.mini);
    this.minis = [];
    if (!list.length) return;
    const g = new T.Group();
    g.position.copy(this.mini.position);
    g.rotation.y = this.mini.rotation.y;
    this.root.add(g);
    for (const m of list) g.attach(m);
    // its footprint on the shelf
    const MK = this.miniK || MINI;
    const xs = list.map((m) => [m.position.x - (m.userData.w * MK) / 2, m.position.x + (m.userData.w * MK) / 2]).flat();
    const w = ((Math.max(...xs) - Math.min(...xs)) / MK) * SHELF_K;
    const to = new T.Vector3(this.shelfX + w / 2, SHELF.top + 0.005, SHELFP.z + 0.05);
    this.shelfX += w + 0.32;
    const from = g.position.clone(), k0 = 1, k1 = SHELF_K / MK, r0 = g.rotation.y;
    this.kept.push(g);
    this.pokeable(g, { note: this.kept.length - 1, of: 6 });
    this.s.anim(1.0, (e, q) => {
      g.position.lerpVectors(from, to, e);
      g.position.y += Math.sin(q * Math.PI) * 1.2;
      g.scale.setScalar(k0 + (k1 - k0) * e);
      g.rotation.y = r0 * (1 - e);
    }, Ease.inOut).then(() => { g.position.copy(to); g.scale.setScalar(k1); g.rotation.y = 0; ksfx.knock(); });
  }
  // the end of a round with the build left standing (the last round): the ghosts and the spare go, the build stays
  tidyRound() {
    for (const b of this.loose) { if (b.userData.drag) input.remove(b.userData.drag); }
    const spare = this.loose.slice();
    this.loose = [];
    const into = BOXP.clone().add(new T.Vector3(0, TOYBOX.h * 0.7, 0));
    spare.forEach((b, i) => this.s.wait(i * 0.25).then(() => this.fly(b, into, { dur: 0.7, arc: 1.4, scale: K * 0.3, ease: Ease.inOut })).then(() => { ksfx.knock(); this.root.remove(b); }));
    this.topGlow.material.opacity = 0;
  }
  // clear the round: every block hops into the toy box one at a time (a wooden knock each), the ghosts fade, the
  // ramp folds away. The little model has already gone to the shelf.
  sweep() {
    const all = [...this.placedB, ...this.loose, ...this.choices, ...this.strays];
    this.placedB = []; this.loose = []; this.choices = []; this.strays = [];
    const into = BOXP.clone().add(new T.Vector3(0, TOYBOX.h * 0.7, 0));
    // the ones nearest the box go first, so no flight crosses another block
    all.sort((a, b) => b.position.x - a.position.x);
    all.forEach((b, i) => {
      if (b.userData.drag) input.remove(b.userData.drag);
      if (b.userData.tap) input.remove(b.userData.tap);
      physics.remove(b);
      b.userData.state = 'gone';
      this.s.wait(i * 0.25).then(() => this.fly(b, into, { dur: 0.7, arc: 1.4 + Math.random() * 0.4, scale: K * 0.3, ease: Ease.inOut })).then((ok) => {
        if (ok !== false) ksfx.knock();
        this.root.remove(b);
      });
    });
    for (const s of this.slots) if (s.ghost) { const g = s.ghost; s.ghost = null; this.fadeAway(g, 0.4).then(() => this.gone(g)); }
    this.slots = [];
    for (const m of this.minis) { const mm = m; this.fadeAway(mm, 0.4).then(() => this.mini.remove(mm)); }
    this.minis = [];
    this.topZone = null; this.topSlot = null;
    this.topGlow.material.opacity = 0;
    if (this.flag) { const f = this.flag; this.flag = null; this.fadeAway(f, 0.4).then(() => this.gone(f)); }
    if (this.ramp) {
      const r = this.ramp, h = this.rampHelper;
      this.ramp = null; this.rampHelper = null;
      physics.remove(h); this.gone(h);
      this.s.wait(0.6).then(() => this.fadeAway(r, 0.5)).then(() => this.root.remove(r));
    }
  }

  // ---------------- Level 3: which one rolls? ----------------
  setupRoll(spec) {
    // the ramp unfolds on the mat (turned a little so its side shows the slope)
    const r = (this.ramp = makeRamp());
    r.position.set(MATP.x, MAT.top, MATP.z - 0.1);
    r.rotation.y = RYAW;
    this.root.add(r);
    popIn(this.s, r, 1, 0.6, { sound: false });
    const h = (this.rampHelper = new T.Mesh(rampGeo(), new T.MeshBasicMaterial({ visible: false })));
    h.position.copy(r.position);
    h.rotation.y = RYAW;
    this.root.add(h);
    if (physics.ok) { physics.add(h, { friction: 1.0, bounce: 0.1 }); physics.body(h).setBodyType(FIXED, true); }
    // the three blocks sit high on the slope, one in each lane
    const a = RAMP.ang, zl = -0.45, yaw = new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), RYAW);
    const n = new T.Vector3(0, Math.cos(a), Math.sin(a)).applyQuaternion(yaw);
    const lanes = RAMP.lanes;
    this.choices = shuffle(spec.roll).map(([shape, col], i) => {
      const b = makeBlock(shape, col, KR);
      b.userData.state = 'move';
      b.visible = false;
      this.root.add(b);
      const lying = shape === 'cyl';
      const rot = new T.Euler().setFromQuaternion(yaw.clone().multiply(new T.Quaternion().setFromEuler(new T.Euler(a, 0, lying ? Math.PI / 2 : 0))));
      const at = new T.Vector3(lanes[i], rampY(zl), zl).applyQuaternion(yaw).add(r.position).addScaledVector(n, 0.5 * KR + 0.01);
      b.userData.tap = input.addTap(b, { radius: 0.75, onTap: () => this.tapChoice(b) });
      b.userData.tap.enabled = false;
      this.s.wait(0.3 + i * 0.3).then(() => {
        if (this.dead) return;
        b.position.copy(BOXP).add(new T.Vector3(0, TOYBOX.h, 0));
        b.scale.setScalar(KR * 0.4);
        b.visible = true;
        this.fly(b, at, { dur: 0.8, arc: 1.4, rot, scale: KR, ease: Ease.inOut }).then((ok) => {
          if (!ok) return;
          ksfx.knock();
          if (physics.ok) {
            physics.add(b, shape === 'ball' ? { shape: 'ball', r: 0.5 * KR, friction: 1.0, bounce: 0.1 } : { friction: 1.0, bounce: 0.1 });
            this.freeze(b, at, b.quaternion);
          }
          b.userData.state = 'ramp';
          b.userData.tap.enabled = !(this.errorlessOn && shape !== this.answer);
        });
      });
      return b;
    });
  }
  tapChoice(b) {
    if (this.dead || this.phase !== 'roll' || b.userData.state !== 'ramp' || this.busy) return;
    this.idle = 0;
    this.clearHints();
    this.endDemo();
    const shape = b.userData.shape;
    const down = new T.Vector3(0, -Math.sin(RAMP.ang), Math.cos(RAMP.ang)).applyAxisAngle(new T.Vector3(0, 1, 0), RYAW);   // down the slope, toward us
    if (shape === this.answer) {
      this.phase = 'done';
      b.userData.state = 'rolling';
      b.userData.tap.enabled = false;
      const body = this.unfreeze(b);
      if (body) body.setLinvel({ x: down.x * 1.2, y: down.y * 1.2, z: down.z * 1.2 }, true);
      ksfx.roll(1.2);
      const bf = this.bear.userData.face;
      if (bf) { setFace(bf, 'joy'); this.s.wait(1.2).then(() => setFace(bf, 'happy')); }
      this.success(b.position.clone().add(new T.Vector3(0, 1, 1.4)), `The ${name(shape)} rolls!`, { voice: true });
      return;
    }
    // it gets a little push... and stays put (it's flat underneath)
    b.userData.state = 'test';
    const body = this.unfreeze(b, false);
    if (body) body.setLinvel({ x: down.x * 0.7, y: down.y * 0.7, z: down.z * 0.7 }, true);
    ksfx.knock();
    this.redirect(`The ${name(shape)} stays still!`);
    this.s.wait(1.0).then(() => {
      if (this.dead || b.userData.state !== 'test') return;
      this.freeze(b);
      b.userData.state = 'ramp';
      if (this.errorlessOn) b.userData.tap.enabled = false;
    });
  }
  choicePoints() { return this.kind === 'roll' ? this.choices.map((c) => c.position.clone()) : null; }

  // ---------------- Level 3: put a block on the tower ----------------
  setupStack(spec) {
    this.later = [];
    // a two-cube tower hops onto the mat (once the camera turns to the mat)
    const slots = (this.slots = [{ shape: 'cube', x: 0, y: 0, col: spec.tower[0] }, { shape: 'cube', x: 0, y: 1, col: spec.tower[1] }]
      .map((s, i) => ({ ...s, i, filled: true, claimed: true, sup: [], ready: Promise.resolve(), done() {} })));
    slots[1].sup = [slots[0]];
    slots.forEach((s, i) => {
      const b = makeBlock('cube', s.col, K);
      b.userData.state = 'placed';
      b.visible = false;
      this.root.add(b);
      s.block = b;
      const p = this.slotCenter(s);
      this.later.push(() => this.s.wait(0.1 + i * 0.35).then(() => {
        if (this.dead) return;
        b.position.copy(BOXP).add(new T.Vector3(0, TOYBOX.h, 0));
        b.scale.setScalar(K * 0.4);
        b.visible = true;
        this.fly(b, p, { dur: 0.8, arc: 1.6, ease: Ease.inOut }).then((ok) => {
          if (!ok) return;
          ksfx.tok(i);
          if (physics.ok) { physics.add(b, { spin: false, bounce: 0.1 }); this.freeze(b, p, new T.Quaternion()); }
          this.placedB.push(b);
        });
      }));
    });
    // the top: a "?" glow where the next block goes
    const top = (this.topSlot = { shape: this.answer, x: 0, y: 2, i: 2, sup: [slots[1]], filled: false, ready: Promise.resolve(), done() {} });
    slots.push(top);
    this.topZone = { id: 'top', slot: top, shape: 'any', open: true, pos: this.slotCenter(top), radius: 1.1 * K };
    this.topGlow.position.copy(this.slotCenter(top));
    this.model = { name: 'a tower', gag: 'flag' };
    // the model: the tower with the cube on top (what she is making)
    this.showMini([...slots.slice(0, 2).map((s) => ({ ...s })), { shape: 'cube', x: 0, y: 2, col: spec.stack.find(([sh]) => sh === this.answer)?.[1] ?? COL.green, i: 2 }]);
    // a ball and a cube for the tray
    this.loose = shuffle(spec.stack).map(([shape, col]) => this.newBlock(shape, col));
  }

  // ---------------- hints ----------------
  nudgeTarget() {
    if (this.kind === 'roll') return this.phase === 'roll' ? this.choices.find((c) => c.userData.shape === this.answer) || null : null;
    return this.phase === 'build' ? this.pair()?.b || null : null;
  }
  // a stuck child: the block to use gives a slow, quiet bob (on the ramp: every block, so the answer isn't given away)
  nudge(step) {
    const b = this.nudgeTarget();
    if (!b) return;
    if (this.kind === 'roll') {
      for (const c of this.choices) if (c.userData.state === 'ramp') this.s.anim(0.7, (_, q) => c.scale.setScalar(KR * (1 + Math.sin(q * Math.PI) * 0.08))).then(() => c.scale.setScalar(KR));
    } else if (b.userData.state === 'tray' && b.userData.spot) {
      const sp = b.userData.spot, id = b.userData.mv;
      this.s.anim(0.7, (_, q) => { if (b.userData.mv !== id || b.userData.state !== 'tray' || this.carrying === b) return; b.position.y = sp.y + Math.sin(q * Math.PI) * 0.4; }).then(() => { if (b.userData.mv === id && b.userData.state === 'tray' && this.carrying !== b) b.position.copy(sp); });
    }
    if (step >= 2 && this.kind !== 'roll') { const stop = fx.halo(b, 0.6); this.s.wait(3).then(stop); }
  }
  // the slow hand on the real block: pick it up, lift it, carry it onto its ghost (on the ramp: tap each block in turn)
  showHint(glowOn = true) {
    if (this.kind === 'roll') {
      const pts = this.choicePoints();
      if (pts && pts.length) fx.ghostPath(pts, { mode: 'scan', maxDur: 3.6 });
      return;
    }
    const pr = this.pair();
    if (!pr) return;
    if (glowOn) this.addHalo(pr.b, 0.6);
    const a = pr.b.position.clone();
    fx.ghostPath([a, a.clone().add(new T.Vector3(0, 1.3, -0.4)), pr.z.pos.clone()], { mode: 'drag', maxDur: 4.0 });
  }
  makeErrorless() {
    if (this.kind === 'roll') {
      for (const c of this.choices) if (c.userData.shape !== this.answer && c.userData.tap) c.userData.tap.enabled = false;
    } else {
      for (const b of this.loose) if ((b.userData.extra || (this.kind === 'stack' && b.userData.shape !== this.answer)) && b.userData.drag) b.userData.drag.enabled = false;
    }
    const t = this.nudgeTarget();
    if (t) this.addHalo(t, 0.55);
  }

  // ---------------- feel: camera stations, slow hand demos ----------------
  feelInit() {
    this.taught = new Set();
    this.demoAt = 8;
    this.demoId = 0;
    this.offs.push(input.onAny(() => { this.demoAt = 8; this.endDemo(); }));
  }
  // glide the camera to a station, eased (the latest glide wins)
  glide(c, dur = 0.85) {
    const id = (this.camId = (this.camId || 0) + 1);
    const p0 = camera.position.clone(), l0 = getLook().clone();
    if (p0.distanceTo(c.pos) < 0.01 && l0.distanceTo(c.look) < 0.01) return Promise.resolve();
    return this.s.anim(dur, (e) => { if (this.camId === id) setCamera(_cp.lerpVectors(p0, c.pos, e), _cl.lerpVectors(l0, c.look, e)); }, Ease.inOut);
  }
  // a slow hand demo on the real thing; any touch ends it
  demo(dur = 4.2) {
    if (this.dead) return;
    fx.clearHands();
    this.demoing = true;
    const id = ++this.demoId;
    this.showHint(true);
    this.s.wait(dur).then(() => { if (this.demoId === id) this.endDemo(); });
  }
  endDemo() { if (!this.demoing) return; this.demoing = false; this.demoId++; fx.clearHands(); }
  // say what to do (the first build of a level, the roll rounds); the first time each kind of action comes up, show it
  cue() {
    if (this.dead || this.busy) return;
    if (this.kind === 'roll' || (this.kind === 'build' && this.round === 0)) this.prompt();
    this.demoAt = 8;
    const k = this.action();
    if (k && !this.taught.has(k)) { this.taught.add(k); this.demo(); }
  }
  // stuck for about 8 s: show it again (and again every ~14 s)
  stuckCheck() {
    if (this.busy || this.demoing || input.dragging() || !this.action()) return;
    if (this.idle >= this.demoAt) { this.demoAt = this.idle + 14; this.demo(); }
  }

  // ---------------- the finale: the shelf of everything she built (and the last build, if it is still standing) ----
  creationView() {
    const standing = this.placedB.length > 0;
    // the build still standing on the mat (with its flag) and the shelf behind it, or just the shelf
    const top = standing ? Math.max(...this.placedB.map((b) => b.position.y + (b.userData.h * K) / 2)) + 1.0 : 0;
    if (!standing) {
      // just the shelf of everything she built, seen low and straight on (the empty mat stays a thin strip), with
      // Pip and Bear whole at its right end
      // (wide enough that the 4:3 photo keeps the whole shelf and Bear too)
      const look = new T.Vector3(SHELFP.x + 1.75, 1.15, SHELFP.z);
      return { pos: new T.Vector3(look.x, 2.7, look.z + 10.2), look };
    }
    const look = new T.Vector3(SHELFP.x + 0.6, Math.max(1.6, top * 0.45), -2.4);
    const d = Math.max(9.6, top * 2.1);
    return { pos: new T.Vector3(look.x, look.y + 2.4, look.z + d), look };
  }
  creationObjects() { return [...this.kept, ...this.placedB]; }
  onFinale() { this.clap(); }

  // ---------------- every frame ----------------
  update(dt, t) {
    this.stuckCheck();
    // ghosts: open spots glow softly; ones still waiting for their base are fainter; the carried block's own
    // shape lights up in its colour, and brightest under the finger
    const car = this.carrying && input.dragging() ? this.carrying : null;
    for (const s of this.slots) {
      const g = s.ghost;
      if (!g) continue;
      const open = this.isOpen(s);
      const fl = g.userData.flash || 0;
      if (fl > 0) g.userData.flash = Math.max(0, fl - dt);
      let fill = open ? 0.26 : 0.14, rim = open ? 0.75 : 0.45, col = 0xffffff;
      if (car && car.userData.shape === s.shape) {
        const k = 0.5 + 0.5 * Math.sin(t * 3.5);
        col = car.userData.col;
        fill = (open ? 0.32 : 0.14) + k * 0.12;
        rim = open ? 0.95 : 0.4;
        if (this.hoverZ && this.hoverZ.slot === s) { fill = 0.6; rim = 1; }
      }
      if (fl > 0) { const k = 0.5 + 0.5 * Math.sin(t * 7); fill = Math.max(fill, 0.25 + k * 0.3); rim = 1; }
      setGhost(g, fill, rim, col);
    }
    // the "?" spot on top of the stack tower
    if (this.topZone && this.phase === 'build') {
      this.topGlow.material.opacity = 0.35 + Math.sin(t * 2.2) * 0.15 + (this.hoverZ === this.topZone ? 0.3 : 0);
      this.topGlow.scale.setScalar(1.6 + Math.sin(t * 2.2) * 0.1);
    } else this.topGlow.material.opacity = 0;
  }
}
