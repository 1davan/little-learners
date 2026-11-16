// Sink or float lab (World 2: the beach). Topics mt_auVZZEuXjs "Describing material properties", mt_Wa44s-f8Ws
// "Simple tests and experiments" and mt_MRQcEvyPJv "Did it happen as predicted?".
// A glass water tank stands in the middle of the beach. Each round a thing hops onto the crate beside it; tap it and
// it flies over and drops into the water: real rigid-body physics plus a buoyancy force (an upward push that grows with
// how much of it is under the water line, applied at the centre of the wet part, with water drag), so a duck splashes,
// dips and bobs up to float, a log wallows and settles low, a key plunges and clunks onto the sandy floor with bubbles.
// The water rises a little when something big goes in and the surface ripples where things land. Then sort it: tap
// the float tub (blue, sign with a ball on a wave) or the sink tub (coral, sign with a down arrow); it is lifted out
// dripping and lands in its tub, where it stays. Crab the lab helper scuttles over to watch it go in.
// Level 1: obvious things (duck, rock, beach ball, stone, sponge, shell): drop, watch, sort.
// Level 2: guess first (tap a sign: float or sink), then test, with "Did it happen?" feedback (a tick, or a surprise).
// Level 3: surprises (a big log floats, a tiny coin sinks, a big apple floats, a tiny marble sinks), plus two
//          ramp-and-drop tests: "Which one rolls?" (beach ball or block down a ramp) and "Which one bounces?".
//
// Test hooks: phase ('guess' | 'drop' | 'sort' | 'pick' | other = busy), item (item.userData.floats), guess(floats),
// dropIn(), sort(floats), choices (x.userData.right), pick(x).
import * as T from '../three.js';
import { Lesson } from '../engine/lesson.js';
import { setFace, popIn, popOut, hop, wiggle } from '../engine/actors.js';
import { makeCrab, makeBucket, makeBubble } from '../engine/beach.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { physics } from '../engine/physics.js';
import { project, setCamera } from '../engine/stage.js';
import { Ease } from '../engine/tween.js';
import { propModel } from '../engine/prop-models.js';
import { blobShadow } from '../engine/toon.js';
import { ITEMS, makeItem, samplePoints, makeTank, animateWater, TANK, makeSign, SIGN_Y, makeRamp, RAMP } from './sink-items.js';

const PLANS = [
  ['duck', 'rock', 'ball', 'stone', 'sponge', 'shell'],
  ['apple', 'key', 'leaf', 'marble', 'block', 'gem'],
  ['log', 'roll', 'coin', 'bounce', 'bigapple', 'tinymarble'],
];
const CAM = { pos: new T.Vector3(0.4, 3.5, 14.4), look: new T.Vector3(0.4, 1.4, 0) };
const TP = new T.Vector3(-0.6, 0, -0.2);           // the tank
const CRATE = new T.Vector3(-4.35, 0, 0.75);       // the crate things wait on
const CRATE_K = 0.7, CRATE_TOP = 0.86 * CRATE_K;   // its straw bed
const TUBS = { float: new T.Vector3(3.95, 0, 0.85), sink: new T.Vector3(6.55, 0, 0.85) };
const TUB_R = 1.12, TUB_H = 0.85;   // shallow, so what is in them peeks over the rim
const CRAB_HOME = new T.Vector3(-3.25, 0, 3.0);
const RAMP_AT = new T.Vector3(-1.95, 0, 2.55);     // Level 3 ramp (high end on the left, next to the crate)
const DROP_AT = new T.Vector3(-2.9, 0, 2.8);       // Level 3 bounce test: dropped onto the sand here
const G = 9.81 * 1.6;                              // the physics world's gravity

export default class SinkLesson extends Lesson {
  build() {
    setCamera(CAM.pos, CAM.look);
    this.plan = PLANS[this.level] || PLANS[0];
    this.pip.position.set(-6.9, 0, 0.6);
    this.pip.rotation.y = 0.45;
    // the tank and its colliders: a floor at the sand line and four walls a little above the glass
    const tank = (this.tank = makeTank());
    tank.position.copy(TP);
    this.root.add(tank);
    const { IX, IZ, FLOOR, TOP } = TANK, wh = TOP + 0.35;
    physics.box(new T.Vector3(TP.x, FLOOR - 0.2, TP.z), new T.Vector3(IX * 2 + 0.4, 0.4, IZ * 2 + 0.4));
    for (const s of [-1, 1]) {
      physics.box(new T.Vector3(TP.x + s * (IX + 0.1), wh / 2, TP.z), new T.Vector3(0.2, wh, IZ * 2 + 0.4));
      physics.box(new T.Vector3(TP.x, wh / 2, TP.z + s * (IZ + 0.1)), new T.Vector3(IX * 2 + 0.4, wh, 0.2));
    }
    this.level0 = TANK.WATER;
    this.waterY = TANK.WATER;
    this.tankTap = input.addTap(tank, { radius: 1.9, offset: new T.Vector3(0, 1.7, 0), onTap: () => this.tapTank() });
    // the crate the things wait on
    const crate = propModel('prop_crate', { tint: 0xf3d29a, size: CRATE_K });
    if (crate) { crate.position.copy(CRATE); crate.rotation.y = Math.PI + 0.12; /* its blank picture disc faces away */ crate.add(blobShadow(1.1)); this.root.add(crate); }
    physics.box(new T.Vector3(CRATE.x, CRATE_TOP / 2, CRATE.z), new T.Vector3(1.9, CRATE_TOP, 1.0), 0.12);
    // the two tubs, each with its picture sign behind it
    this.tubs = {};
    for (const [k, p] of Object.entries(TUBS)) {
      const floats = k === 'float';
      const tub = makeBucket(floats ? 0x4a90ff : 0xff7a59, TUB_R, TUB_H);
      tub.position.copy(p);
      tub.rotation.y = floats ? 0.25 : -0.25;
      // a tub, not a pail: no handle (it would cross the path of things dropping in)
      for (const [ln, hl] of Object.entries(tub.userData.model?.userData?.layers || {})) if (ln.startsWith('handle')) { hl.mesh.visible = false; if (hl.outline) hl.outline.visible = false; }
      this.root.add(tub);
      physics.container(p, { r: TUB_R * 0.78, h: TUB_H + 0.2, floor: 0.14 });
      const sign = makeSign(floats);
      if (sign) { sign.position.set(p.x + (floats ? -0.15 : 0.15), 0, p.z - 1.45); sign.rotation.y = floats ? 0.12 : -0.12; this.root.add(sign); }
      const board = new T.Object3D();
      board.position.set(0, SIGN_Y, 0);
      (sign || tub).add(board);
      tub.userData.floats = floats;
      tub.userData.sign = sign;
      tub.userData.board = board;
      tub.userData.count = 0;
      tub.userData.tapT = input.addTap(tub, { radius: 1.3, offset: new T.Vector3(0, 0.7, 0), onTap: () => this.tapSide(floats) });
      if (sign) sign.userData.tapT = input.addTap(sign, { radius: 0.75, offset: new T.Vector3(0, SIGN_Y, 0), onTap: () => this.tapSide(floats) });
      this.tubs[k] = tub;
    }
    // Crab, the lab helper
    const crab = (this.crab = makeCrab());
    crab.scale.setScalar(0.72);
    crab.position.copy(CRAB_HOME);
    crab.rotation.y = 0.4;
    this.root.add(crab);
    this.crabArms = crab.userData.claws ? crab.userData.claws.map((c) => c.rotation.z) : null;
    this.wet = [];       // things in the water: { obj, d, pts, ph, entered, t }
    this.ripples = [];
    this.phase = 'idle';
    this.choices = [];
    this.item = null;
  }

  // ---------------- rounds ----------------
  async startRound(r) {
    this.busy = true;
    this.guessed = null;
    this.choices = [];
    const id = this.plan[r];
    if (id === 'roll' || id === 'bounce') return this.startTest(id);
    const it = (this.item = makeItem(id));
    if (!it) { this.busy = false; return; }
    this.root.add(it);
    this.placeOnCrate(it, 0);
    it.userData.tap = input.addTap(it, { radius: Math.max(0.6, it.userData.rad * 1.15), offset: new T.Vector3(0, it.userData.cy, 0), onTap: () => this.tapItem(it) });
    // it drops onto the crate from above with a little squash
    const y1 = it.position.y;
    it.position.y = y1 + 2.6;
    sfx.swoosh();
    await this.s.tween(it.position, { y: y1 }, 0.3, Ease.in);
    if (this.dead) return;
    sfx.land();
    this.squash(it, 0.22);
    this.phase = this.level === 0 ? 'drop' : 'guess';
    this.busy = false;
    if (this.phase === 'guess') this.lightSigns(true);
    if (r === 0 && !this.demoDone) this.cue(); else this.prompt();
  }

  promptText() {
    const d = this.item?.userData.item;
    if (this.phase === 'pick') return this.test === 'roll' ? 'Which one rolls?' : 'Which one bounces?';
    if (!d) return '';
    if (this.phase === 'guess') return d.big || d.small ? `A ${d.name}! Float or sink?` : `The ${d.name}! Float or sink?`;
    if (this.phase === 'drop') return this.level === 0 ? `Drop the ${d.name} in the water!` : "Drop it in! Let's see!";
    if (this.phase === 'sort') return this.level === 0 ? (d.floats ? 'Put it in the float tub!' : 'Put it in the sink tub!') : 'Which tub does it go in?';
    return '';
  }
  prompt() { const t = this.promptText(); if (t) this.say(t, { max: 1.6 }); }

  // where a thing sits on the crate (slot -1 / 1 for the two Level 3 test choices)
  placeOnCrate(it, slot) {
    it.position.set(0, 0, 0);
    this.root.updateMatrixWorld(true);
    const b = new T.Box3().setFromObject(it);
    const c = b.getCenter(new T.Vector3()), sz = b.getSize(new T.Vector3());
    it.userData.cy = c.y - b.min.y;                 // centre height above its bottom
    it.userData.rad = Math.max(sz.x, sz.y, sz.z) / 2;
    it.userData.off = new T.Vector3(c.x, b.min.y, c.z);
    it.position.set(CRATE.x - c.x + slot * 0.5, CRATE_TOP - b.min.y + 0.01, CRATE.z - c.z + 0.05);
    it.userData.home = it.position.clone();
  }
  squash(o, amt = 0.2) {
    const k = o.scale.clone();
    this.s.anim(0.22, (_, p) => { const w = Math.sin(p * Math.PI) * (1 - p * 0.3) * amt; o.scale.set(k.x * (1 + w * 0.5), k.y * (1 - w), k.z * (1 + w * 0.5)); }).then(() => o.scale.copy(k));
  }

  // ---------------- guess (Level 2 and 3) ----------------
  tapSide(floats) {
    if (this.dead || this.busy || this.demoing) return;
    if (this.phase === 'guess') return this.guess(floats);
    if (this.phase === 'sort') return this.sort(floats);
    if (this.phase === 'drop') { const tub = this.tub(floats); wiggle(this.s, tub.userData.sign || tub, 0.08, 0.35); sfx.tap(); }
  }
  tub(floats) { return floats ? this.tubs.float : this.tubs.sink; }

  guess(floats) {
    if (this.dead || this.phase !== 'guess' || this.busy) return;
    this.idle = 0;
    this.guessed = !!floats;
    this.lightSigns(false);
    fx.clearHands();
    const tub = this.tub(floats), sign = tub.userData.sign;
    sfx.pop();
    if (sign) hop(this.s, sign, 0.35, 0.3);
    this.addHalo(tub.userData.board, 0.85);
    const bp = tub.userData.board.getWorldPosition(new T.Vector3());
    fx.float(bp.clone().add(new T.Vector3(0, 0.9, 0.3)), floats ? '?' : '?', { color: floats ? '#2f8fd8' : '#ff6a4a', size: 9 });
    // Pip thinks about it
    const ph = this.pip.userData.head;
    if (ph) this.s.anim(0.5, (_, p) => { ph.rotation.z = Math.sin(p * Math.PI) * 0.3; }).then(() => (ph.rotation.z = 0));
    this.phase = 'drop';
    this.say(floats ? "You think it floats! Let's test it!" : "You think it sinks! Let's test it!", { max: 1.4 });
  }
  // the signs breathe while a guess is wanted
  lightSigns(on) { this.signsLit = on; }

  // ---------------- drop it in ----------------
  tapItem(it) {
    if (this.dead || this.demoing) return;
    if (this.phase === 'pick') return this.pick(it);
    if (it !== this.item) return;
    if (this.phase === 'drop') return this.dropIn();
    if (this.phase === 'guess') { this.idle = 0; sfx.boing(); hop(this.s, it, 0.3, 0.3); this.prompt(); return; }
    // in the water: push it under (a floater bobs straight back up)
    if (physics.has(it) && (this.phase === 'sort' || this.phase === 'watch')) this.dunk(it);
  }
  tapTank() {
    if (this.dead || this.demoing) return;
    if (this.phase === 'drop') return this.dropIn();
    if ((this.phase === 'sort') && this.item && physics.has(this.item)) this.dunk(this.item);
  }
  dunk(it) {
    if (it.userData.dunkT && performance.now() - it.userData.dunkT < 500) return;
    it.userData.dunkT = performance.now();
    this.idle = 0;
    physics.impulse(it, { x: (Math.random() - 0.5) * 0.6, y: -5.5, z: 0 }, { x: (Math.random() - 0.5) * 0.4, y: 0, z: (Math.random() - 0.5) * 0.4 });
    const p = it.position;
    this.splash(p.x, p.z, 0.6);
  }

  async dropIn() {
    if (this.dead || this.phase !== 'drop' || this.busy || !this.item) return;
    const it = this.item;
    this.phase = 'watch';
    this.busy = true;
    this.demoDone = true;
    this.clearHints();
    fx.clearHands();
    const d = it.userData.item;
    // an arc from the crate to just above the water, turning as it goes
    const a = it.position.clone();
    const b = new T.Vector3(TP.x + (Math.random() - 0.5) * 0.8 - it.userData.off.x, TANK.TOP + 0.45 + (d.big ? 0.2 : 0), TP.z - it.userData.off.z);
    const r0 = it.rotation.clone(), spin = (Math.random() < 0.5 ? -1 : 1) * 0.6;
    sfx.swoosh();
    this.crabLook(true);
    await this.s.anim(0.42, (e, q) => {
      it.position.lerpVectors(a, b, e);
      it.position.y += Math.sin(q * Math.PI) * 1.1;
      it.rotation.z = r0.z + spin * e;
    }, Ease.inOut);
    if (this.dead) return;
    // let go: real physics from here, with the water pushing up (see update)
    physics.add(it, { r: d.r || null, mass: 1, bounce: 0.15, friction: 0.6, sleep: false });
    physics.body(it)?.setLinvel({ x: 0, y: -1.5, z: 0 }, true);
    this.wet.push({ obj: it, d, pts: samplePoints(it), ph: Math.random() * 6, entered: false, t: 0, bub: 0 });
    // watch it: floaters settle into a bob, sinkers clunk onto the floor
    const t0 = performance.now();
    await new Promise((res) => {
      const chk = () => {
        if (this.dead) return;
        const el = (performance.now() - t0) / 1000, w = this.wetOf(it);
        const done = d.floats ? el > 1.05 : (w && w.floor) ? el > 0.45 : el > 1.4;
        if (done || el > 1.6) return res();
        requestAnimationFrame(chk);
      };
      requestAnimationFrame(chk);
    });
    if (this.dead) return;
    this.result(it);
  }
  wetOf(o) { return this.wet.find((w) => w.obj === o); }

  // ---------------- what happened ----------------
  async result(it) {
    const floats = it.userData.floats, d = it.userData.item;
    const tank = this.tank.position;
    const top = new T.Vector3(tank.x, TANK.TOP + 0.7, tank.z + 1);
    fx.float(top, floats ? '⬆' : '⬇', { color: floats ? '#2f8fd8' : '#ff6a4a', size: 13 });
    const pf = this.pip.userData.face;
    let line = floats ? 'It floats!' : 'It sinks!';
    if (this.guessed !== null) {
      const right = this.guessed === floats;
      const bp = this.tub(this.guessed).userData.board.getWorldPosition(new T.Vector3());
      this.clearHints();
      if (right) {
        line = floats ? 'You were right! It floats!' : 'You were right! It sinks!';
        fx.float(bp.clone().add(new T.Vector3(0, 0.95, 0.3)), '✓', { color: '#3fbf5a', size: 14 });
        sfx.twinkle();
        const sc = project(bp); fx.sparkle(sc.x, sc.y);
        if (pf) setFace(pf, 'joy');
      } else {
        line = floats ? 'Surprise! It floats!' : 'Surprise! It sinks!';
        sfx.gasp ? sfx.gasp() : sfx.boing();
        if (pf) setFace(pf, 'scared');
        hop(this.s, this.pip, 0.5, 0.35);
      }
      if (pf) this.s.wait(1.1).then(() => setFace(pf, 'happy'));
    } else {
      sfx.twinkle();
    }
    // Crab claps along
    this.crabCheer(floats);
    this.say(line, { max: 1.0 });
    await this.wait(0.75);
    if (this.dead) return;
    this.phase = 'sort';
    this.busy = false;
    this.crabLook(false);
    this.prompt();
  }

  // ---------------- sorting ----------------
  sort(floats) {
    if (this.dead || this.phase !== 'sort' || this.busy || !this.item) return;
    const it = this.item;
    this.idle = 0;
    if (!!floats !== it.userData.floats) {
      const tub = this.tub(floats);
      wiggle(this.s, tub, 0.12, 0.4);
      this.redirect(it.userData.floats ? 'It floated! The float tub!' : 'It sank! The sink tub!');
      return;
    }
    this.putAway(it);
  }

  async putAway(it) {
    this.phase = 'away';
    this.busy = true;
    fx.clearHands();
    const floats = it.userData.floats, tub = this.tub(floats);
    input.remove(it.userData.tap);
    // lifted out, dripping
    physics.remove(it);
    this.wet = this.wet.filter((w) => w.obj !== it);
    this.splash(it.position.x, it.position.z, 0.5, true);
    sfx.pop();
    const a = it.position.clone(), up = new T.Vector3(a.x, TANK.TOP + 1.0, a.z);
    this.walkCrab(new T.Vector3(tub.position.x - 0.15, 0, tub.position.z + TUB_R + 0.9));
    await this.s.anim(0.32, (e) => { it.position.lerpVectors(a, up, e); }, Ease.out);
    if (this.dead) return;
    this.drips(it);
    // into its tub on a real arc; it stays there
    const n = tub.userData.count++;
    const target = new T.Vector3(tub.position.x + Math.sin(n * 2.4) * 0.3, 0.6 + Math.min(n, 3) * 0.25, tub.position.z + Math.cos(n * 2.4) * 0.25);
    sfx.swoosh();
    const d = it.userData.item;
    const land = physics.toss(it, target, { arc: 0.7, maxT: 1.2, r: d.r || null, bounce: 0.25, friction: 0.8 });
    this.s.wait(0.5).then(() => { if (!this.dead) { sfx.bloop(); this.squash(tub, 0.1); } });
    await Promise.race([land, this.wait(0.65)]);
    if (this.dead) return;
    this.item = null;
    this.busy = false;   // success() takes it from here
    const pos = tub.position.clone().add(new T.Vector3(0, 1.6, 0.5));
    this.success(pos, floats ? 'In the float tub!' : 'In the sink tub!');
  }
  async afterSuccess() {
    this.walkCrab(CRAB_HOME);
    await this.wait(0.1);
  }

  // ---------------- Level 3: which rolls? which bounces? ----------------
  async startTest(kind) {
    this.test = kind;
    this.item = null;
    const pair = kind === 'roll' ? ['ball', 'block'] : ['ball', 'rock'];
    const right = 'ball';
    if (kind === 'roll') {
      const ramp = (this.ramp = makeRamp());
      if (ramp) {
        ramp.position.copy(RAMP_AT);
        this.root.add(ramp);
        await popIn(this.s, ramp, 1, 0.35);
        if (this.dead) return;
        // a fixed collider in the ramp's real wedge shape
        physics.add(ramp, { friction: 0.9, bounce: 0.1 });
        physics.body(ramp)?.setBodyType(1, true);
      }
    }
    // Crab steps back to watch from the side
    this.walkCrab(new T.Vector3(5.25, 0, 2.85));
    this.choices = pair.map((id, i) => {
      const it = makeItem(id);
      it.scale.multiplyScalar(0.85);      // each squeezed a touch so the pair fits on the crate
      it.userData.k = it.scale.x;
      this.root.add(it);
      this.placeOnCrate(it, i ? 0.95 : -0.95);
      it.userData.right = id === right;
      it.userData.tap = input.addTap(it, { radius: Math.max(0.55, it.userData.rad * 1.1), offset: new T.Vector3(0, it.userData.cy, 0), onTap: () => this.tapItem(it) });
      popIn(this.s, it, it.scale.x, 0.35);
      return it;
    });
    await this.wait(0.4);
    if (this.dead) return;
    this.phase = 'pick';
    this.busy = false;
    this.prompt();
  }
  choicePoints() { return this.choices.map((c) => c.position.clone().add(new T.Vector3(0, c.userData.cy, 0))); }

  async pick(x) {
    if (this.dead || this.phase !== 'pick' || this.busy || !this.choices.includes(x)) return;
    this.idle = 0;
    this.phase = 'testing';
    this.busy = true;
    fx.clearHands();
    const d = x.userData.item;
    const k = x.userData.k;
    // to the ramp's top (roll) or high over the sand (bounce), then let go
    const a = x.position.clone();
    let b;
    if (this.test === 'roll') {
      const xs = RAMP_AT.x + RAMP.X0 + RAMP.FLAT + 0.45;
      const slope = (RAMP.HI - 0.04) / (RAMP.X1 - RAMP.X0 - RAMP.FLAT);
      const yTop = RAMP.HI - slope * (xs - RAMP_AT.x - RAMP.X0 - RAMP.FLAT);
      const th = Math.atan(slope), h = d.r ? d.r * k : x.userData.cy;
      b = new T.Vector3(xs + Math.sin(th) * h, yTop + Math.cos(th) * h + 0.04, RAMP_AT.z);
    } else {
      b = new T.Vector3(DROP_AT.x, 3.1, DROP_AT.z);
    }
    sfx.swoosh();
    await this.s.anim(0.38, (e, q) => { x.position.lerpVectors(a, b, e); x.position.y += Math.sin(q * Math.PI) * 0.8; }, Ease.inOut);
    if (this.dead) return;
    const R = d.r ? d.r * k : null;
    if (this.test === 'roll') {
      // tilt the block to sit flat on the slope
      if (!d.r) x.rotation.z = -Math.atan((RAMP.HI - 0.04) / (RAMP.X1 - RAMP.X0 - RAMP.FLAT));
      physics.add(x, { r: R, mass: 1, bounce: 0.2, friction: 0.9 });
      const body = physics.body(x);
      if (body && d.rolls) { body.setLinearDamping(0.55); body.setAngularDamping(0.5); body.setLinvel({ x: 0.6, y: 0, z: 0 }, true); }
    } else {
      physics.add(x, { r: R, mass: 1, bounce: d.bounces ? 0.86 : 0.0, friction: 0.8, spin: false });
    }
    await this.wait(d.rolls || d.bounces ? 1.1 : 0.8);
    if (this.dead) return;
    if (x.userData.right) {
      for (const c of this.choices) input.remove(c.userData.tap);
      this.busy = false;
      this.phase = 'done';
      this.crabCheer(true);
      const p = x.position.clone().add(new T.Vector3(0, 1, 0));
      this.success(p, this.test === 'roll' ? 'The ball rolls!' : 'Boing! The ball bounces!');
      return;
    }
    // it did not: say so, and it hops back to the crate to try the other one
    this.busy = false;
    this.phase = 'pick';
    this.redirect(this.test === 'roll' ? 'The block does not roll! Try the other one!' : 'Thud! The rock does not bounce!');
    physics.remove(x);
    const c = x.position.clone(), h = x.userData.home.clone(), r0 = x.rotation.clone();
    this.s.anim(0.4, (e, q) => { x.position.lerpVectors(c, h, e); x.position.y += Math.sin(q * Math.PI) * 0.9; x.rotation.set(r0.x * (1 - e), r0.y, r0.z * (1 - e)); }).then(() => { if (!this.dead) { sfx.land(); x.position.copy(h); } });
  }

  // between rounds: the test things hop away (shrink-pop), and the ramp goes
  async clearTest() {
    const list = this.choices.splice(0);
    for (const c of list) { input.remove(c.userData.tap); physics.remove(c); hop(this.s, c, 0.5, 0.25); this.s.wait(0.12).then(() => popOut(this.s, c, 0.22)).then(() => this.root.remove(c)); }
    if (this.ramp) { const r = this.ramp; this.ramp = null; physics.remove(r); this.s.wait(0.15).then(() => popOut(this.s, r, 0.22)).then(() => this.root.remove(r)); }
    this.test = null;
  }
  nextRound() {
    if (this.choices.length || this.ramp) { this.clearTest(); this.s.wait(0.3).then(() => super.nextRound()); return; }
    super.nextRound();
  }

  // ---------------- water: buoyancy, splashes, ripples, bubbles ----------------
  update(dt, t) {
    dt = Math.min(dt, 0.05);
    // the water rises a little with what is in it
    let disp = 0;
    const { IX, IZ, FLOOR } = TANK;
    for (const w of this.wet) {
      const o = w.obj, body = physics.body(o);
      if (!body) continue;
      o.updateMatrixWorld(true);
      const e = o.matrixWorld.elements;
      let lo = Infinity, hi = -Infinity, cx = 0, cz = 0, n = 0;
      for (const p of w.pts) {
        const y = e[1] * p.x + e[5] * p.y + e[9] * p.z + e[13];
        if (y < lo) lo = y;
        if (y > hi) hi = y;
        if (y < this.waterY) { cx += e[0] * p.x + e[4] * p.y + e[8] * p.z + e[12]; cz += e[2] * p.x + e[6] * p.y + e[10] * p.z + e[14]; n++; }
      }
      const span = Math.max(0.05, hi - lo);
      const sub = Math.max(0, Math.min(1, (this.waterY - lo) / span));
      w.sub = sub;
      w.t += dt;
      const v = body.linvel();
      if (!w.entered && sub > 0.05) {
        w.entered = true;
        const k = Math.min(1.4, Math.max(0.35, -v.y / 5)) * (w.d.big ? 1.4 : w.d.small ? 0.6 : 1);
        this.splash(o.position.x, o.position.z, k);
      }
      disp += sub * (w.d.big ? 0.09 : w.d.small ? 0.005 : 0.03);
      if (sub > 0 && n) {
        const m = body.mass();
        const bob = w.d.floats ? 1 + 0.06 * Math.sin(t * 2.4 + w.ph) : 1;
        const J = m * G * w.d.b * bob * sub * dt;
        const cy = (lo + Math.min(this.waterY, hi)) / 2;
        body.applyImpulseAtPoint({ x: 0, y: J, z: 0 }, { x: cx / n, y: cy, z: cz / n }, true);
        // water drag: much thicker than air
        body.setLinearDamping(0.15 + 3.4 * sub);
        body.setAngularDamping(0.6 + 3.0 * sub);
        // upright floaters right themselves (a duck sits on its tummy)
        if (w.d.up && w.d.floats) {
          const q = body.rotation();
          const ux = 2 * (q.x * q.y - q.w * q.z), uy = 1 - 2 * (q.x * q.x + q.z * q.z), uz = 2 * (q.y * q.z + q.w * q.x);
          w.r2 = w.r2 || Math.max(0.02, span * span * 0.25);
          const kk = m * w.r2 * 30 * sub * dt * (uy < 0 ? 2 : 1);
          // turn the object's up axis toward the sky: axis = up x worldUp = (-uz, 0, ux)
          body.applyTorqueImpulse({ x: -uz * kk, y: 0, z: ux * kk }, true);
        }
      } else {
        body.setLinearDamping(0.15);
        body.setAngularDamping(0.6);
      }
      // a sinker on the floor: a few bubbles escape
      const onFloor = lo < FLOOR + 0.08 && Math.abs(v.y) < 0.4;
      if (!w.d.floats && sub > 0.5) {
        if (onFloor && !w.floor) { w.floor = true; this.bubbles(o, 4); }
        if (!onFloor && (w.bub -= dt) < 0) { w.bub = 0.09; this.bubbles(o, 1); }
      }
      // never through the glass (a guard: walls are colliders too)
      const p = body.translation();
      if (Math.abs(p.x - TP.x) > IX + 0.5 || Math.abs(p.z - TP.z) > IZ + 0.5) body.setTranslation({ x: TP.x, y: TANK.WATER + 0.5, z: TP.z }, true);
    }
    this.waterY += (TANK.WATER + disp - this.waterY) * Math.min(1, dt * 4);
    animateWater(this.tank, dt, t, this.waterY);
    // the signs breathe while a guess is wanted
    for (const tub of Object.values(this.tubs)) {
      const s = tub.userData.sign;
      if (!s) continue;
      const k = this.signsLit && this.phase === 'guess' ? 1 + Math.sin(t * 5 + (tub.userData.floats ? 0 : 1.6)) * 0.035 : 1;
      s.scale.setScalar(k);
    }
  }

  // a splash at world (x, z): droplets fly up and fall back, the surface ripples
  splash(x, z, k = 1, quiet = false) {
    const tp = this.tank.position;
    this.tank.userData.water.ripples.push({ x: x - tp.x, z: z - tp.z, t: 0, a: 0.07 * k });
    if (!quiet) sfx.splash ? sfx.splash() : sfx.bloop();
    const n = Math.round(5 + 6 * k);
    for (let i = 0; i < n; i++) {
      const dr = propModel('prop_m_drop', { size: 0.9 + Math.random() * 0.5 });
      if (!dr) break;
      const a = Math.random() * Math.PI * 2, sp = (0.6 + Math.random() * 1.1) * k;
      const p0 = new T.Vector3(x + Math.cos(a) * 0.2, this.waterY + 0.05, Math.max(tp.z - TANK.IZ + 0.1, Math.min(tp.z + TANK.IZ - 0.05, z + Math.sin(a) * 0.15)));
      const vx = Math.cos(a) * sp, vz = Math.sin(a) * sp * 0.4, vy = (3 + Math.random() * 2.2) * Math.sqrt(k);
      dr.position.copy(p0);
      this.root.add(dr);
      const dur = (2 * vy) / G + 0.05;
      this.s.anim(dur, (_, q) => {
        const tt = q * dur;
        dr.position.set(p0.x + vx * tt, p0.y + vy * tt - 0.5 * G * tt * tt, p0.z + vz * tt);
        const vyy = vy - G * tt;
        dr.rotation.z = Math.atan2(vx, -vyy) * 0.6;
        dr.scale.setScalar(q > 0.8 ? Math.max(0.01, (1 - q) * 5) : 1);
      }).then(() => { this.root.remove(dr); });
    }
  }
  // drops falling off something lifted out of the water
  drips(o) {
    for (let i = 0; i < 4; i++) {
      this.s.wait(i * 0.06).then(() => {
        if (this.dead) return;
        const dr = propModel('prop_m_drop', { size: 0.8 });
        if (!dr) return;
        const p0 = o.position.clone().add(new T.Vector3((Math.random() - 0.5) * 0.4, o.userData.off ? 0 : 0, (Math.random() - 0.5) * 0.2));
        dr.position.copy(p0);
        this.root.add(dr);
        const fall = Math.max(0.2, p0.y - this.waterY);
        this.s.anim(Math.sqrt((2 * fall) / G), (_, q) => { dr.position.y = p0.y - fall * q * q; }).then(() => { this.root.remove(dr); this.tank.userData.water.ripples.push({ x: p0.x - this.tank.position.x, z: p0.z - this.tank.position.z, t: 0, a: 0.02 }); });
      });
    }
  }
  bubbles(o, n) {
    for (let i = 0; i < n; i++) {
      const b = makeBubble(0.06 + Math.random() * 0.06);
      const p = o.position.clone().add(new T.Vector3((Math.random() - 0.5) * 0.3, 0.15, (Math.random() - 0.5) * 0.2));
      b.position.copy(p);
      this.root.add(b);
      const rise = Math.max(0.1, this.waterY - p.y - 0.05), dur = rise / 1.6, ph = Math.random() * 6;
      if (i === 0 && n > 1) sfx.bubble && sfx.bubble();
      this.s.anim(dur, (_, q) => { b.position.set(p.x + Math.sin(q * 9 + ph) * 0.06, p.y + rise * q, p.z); }).then(() => {
        this.s.anim(0.12, (_, q) => b.scale.setScalar(1 + q * 0.6)).then(() => { this.root.remove(b); });
      });
    }
  }

  // ---------------- Crab ----------------
  async walkCrab(to) {
    const c = this.crab;
    const id = (c.userData.walkId = (c.userData.walkId || 0) + 1);
    const a = c.position.clone(), dist = a.distanceTo(to);
    if (dist < 0.05) return;
    // a crab scuttles sideways
    c.rotation.y = to.x > a.x ? -0.2 : 0.2;
    await this.s.anim(dist / 3.0, (e) => { if (c.userData.walkId === id) c.position.lerpVectors(a, to, e); }, Ease.inOut);
    if (c.userData.walkId === id) c.rotation.y = to.x < 0 ? 0.4 : -0.3;
  }
  crabLook(on) {
    const h = this.crab.userData.head;
    if (!h) return;
    this.s.tween(h.rotation, { x: on ? 0.25 : 0 }, 0.25);
  }
  crabCheer(floats) {
    const c = this.crab, cl = c.userData.claws, f = c.userData.face;
    if (f) { setFace(f, 'joy'); this.s.wait(1).then(() => setFace(f, 'happy')); }
    if (cl && this.crabArms) this.s.anim(0.7, (_, p) => { const u = Math.abs(Math.sin(p * Math.PI * 3)) * 0.9; cl[0].rotation.z = this.crabArms[0] + u; cl[1].rotation.z = this.crabArms[1] - u; }).then(() => { cl[0].rotation.z = this.crabArms[0]; cl[1].rotation.z = this.crabArms[1]; });
    hop(this.s, c, floats ? 0.35 : 0.2, 0.3);
    sfx.squeak && sfx.squeak();
  }

  // ---------------- hints ----------------
  nudgeTarget() {
    if (this.phase === 'drop' || this.phase === 'guess') return this.item;
    if (this.phase === 'sort' && this.item) return this.tub(this.item.userData.floats);
    if (this.phase === 'pick') return this.choices.find((c) => c.userData.right) || null;
    return null;
  }
  nudge(step) {
    const o = this.nudgeTarget();
    sfx.boing && sfx.boing();
    if (!o) return hop(this.s, this.pip, 0.5, 0.4);
    if (this.phase === 'guess') {
      for (const tub of Object.values(this.tubs)) if (tub.userData.sign) hop(this.s, tub.userData.sign, 0.3, 0.3);
      return;
    }
    if (o.userData.sign !== undefined) { this.squash(o, 0.18); if (o.userData.sign) hop(this.s, o.userData.sign, 0.35, 0.3); }
    else if (!physics.has(o)) hop(this.s, o, 0.45, 0.4);
    if (step >= 2) { const stop = fx.halo(o.userData.board || o, 1.0); this.s.wait(3).then(stop); }
  }
  showHint(glowOn = true) {
    const o = this.nudgeTarget();
    if (this.phase === 'guess') {
      const pts = Object.values(this.tubs).map((tb) => tb.userData.board.getWorldPosition(new T.Vector3()));
      fx.ghostPath(pts, { mode: 'scan' });
      return;
    }
    if (this.phase === 'pick') { fx.ghostPath(this.choicePoints(), { mode: 'scan' }); return; }
    if (!o) return;
    const at = o.userData.sign !== undefined ? o.position.clone().add(new T.Vector3(0, 0.8, 0)) : o.position.clone().add(new T.Vector3(0, o.userData.cy || 0, 0));
    if (glowOn) this.addHalo(o, 1.0);
    fx.ghostPath([at], { mode: 'tap' });
  }
  demoL3() { this.showHint(false); }
  makeErrorless() {
    const o = this.nudgeTarget();
    if (this.phase === 'guess') return;
    if (o) this.addHalo(o.userData.board && this.phase === 'sort' ? o : o, 1.0);
  }
}
