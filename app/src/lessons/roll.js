// Roll & push. Topics mt_B3W5EfimJw "Pushes & pulls", mt_AvrQauS_zX "Gravity & falling objects", mt_UHQfb-n-w3
// "Actions and their consequences", mt_20WfHhnL39 "Hands-on problem solving", mt_8-POYyg7GJ "Predicting what happens next",
// mt_qeZYF6HZ4o "Positional language", mt_QR3vxbN1o4 "Planning a task" (Level 3) and mt_WcfaSfVT33 "One-to-one counting".
// docs/design/roll.md is the spec. A baby hedgehog curls into a ball and rolls home to Mummy along a wooden toy track.
// Something is in the way (a block, a hole, a step, a door); the child taps, pushes or presses one chunky piece and the
// physics does the rest. Colour tells the verb: yellow is tapped, blue is pushed, round domes are pressed.
//   Level 1: tap (yellow blocks, up-blocks, the red door button)                                    10 puzzles
//   Level 2: push (boxes, ramps, a bridge, a cart, a cookie wall, a floating crate, a jelly)          12 puzzles
//   Level 3: think (lifts, coloured doors, a balloon, a see-saw, sink or float, what comes first)     12 puzzles
// Colour tells the verb: yellow is tapped (blocks, bridge, cookies, jelly, balloon), blue is pushed (box, ramp, crate,
// the stone's band), domes are pressed (or tap the door / lift they work). The wooden cart rolls by itself.
// Every baby stays in the nest, one per cushion; the level ends with a nest full of hoglets the child brought home.
// How it is built:
//   - the table: 11 wooden columns (c0 under the log, c1..c10 the track) that rise out of and sink into a fixed plinth;
//     between puzzles they dip into the plinth, swap their pieces there, and rise to the next skyline (no pops, no fades)
//   - the hoglet rolls on the real 2-D outline of the columns and pieces (roll-pieces.js floorAt): gravity on slopes and
//     ledges, a calm drive ("it wants to go home"), and it brakes to a stop 0.15 clear of the first closed gate
//   - pushed pieces are Rapier bodies (planar, rotation locked) driven by the finger's x, so a box drops into a hole the
//     moment it is over it and pushes another box; blocks, doors and the see-saw are kinematic bodies moved in code
import * as T from '../three.js';
import { Lesson, shuffle } from '../engine/lesson.js';
import { makeAnimal, setFace, wiggle } from '../engine/actors.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { setCamera, camera, project, screenRadius, setSky } from '../engine/stage.js';
import { Ease } from '../engine/tween.js';
import { physics } from '../engine/physics.js';
import { makeScenery } from '../engine/scenery.js';
import { propModel } from '../engine/prop-models.js';
import { showGo } from '../engine/ui.js';
import { store } from '../engine/store.js';
import { LEVELS, ACTIONS, parseCols } from './roll-courses.js';
import {
  BASE, STEP, R, colX, topY, CHUTE_X, NEST_X, NEST_ROWS, NEST_COLS, PAD_X, COLORS, WOOD_TINT, NOTE_TINTS, chutePts,
  makeColumn, makeSlopeCap, makeLiftCap, makePlinth, makeLog, makeChute, makeNest, makeCushion, makePop, makePlank, makeBox,
  makeRamp, makeCart, makeDoor, makeButton, makeCable, makeSeesaw, makePivot, makeHatch, makeHoglet, floorAt, depth, poly, rectPoly,
  makeCookieStack, makeCrumb, makeJelly, makeBalloon, makePeg, makeCrate, makeStone, makeWater, VARIANTS,
} from './roll-pieces.js';
import { rollSound } from './roll-sound.js';

const G = 9.81 * 1.6;               // the same gravity as the physics world
const V_FLAT = 1.3, V_MAX = 2.2;    // drive speed, top speed (slopes)
const V_HOME = 3.2, V_HOME_MAX = 3.6;   // the run home once nothing is shut ahead (rule 0: next puzzle within 5 s)
const SG = 0.15 + R;                // a stop point keeps 0.15 between the ball and the obstacle
const DIP = -2.45;                  // how far a column sinks into the plinth between puzzles (track units below BASE)
const SEE_WAIT = 4 * Math.PI / 180, SEE_TIP = -19 * Math.PI / 180;
const NUMS = ['One!', 'Two!', 'Three!', 'Four!', 'Five!', 'Six!', 'Seven!', 'Eight!', 'Nine!', 'Ten!', 'Eleven!', 'Twelve!', 'Thirteen!', 'Fourteen!'];
const UH = {
  block: 'Uh-oh! A block!', hole: 'Uh-oh! A hole!', door: 'Uh-oh! The door is shut.',
  high: 'Uh-oh! Too high!', down: 'Uh-oh! A long way down!', cookie: 'Uh-oh! Cookies!', water: 'Uh-oh! Water!',
  box: 'Uh-oh! A box!', cart: 'Uh-oh! A cart!', step: 'Uh-oh! A big step!',
};
const POS = {
  down: 'Down it rolls!', ramp: 'Up the ramp!', bridge: 'Over the bridge!', door: 'Under the door!', in: 'In it goes!',
  liftDown: 'Down goes the lift!', liftUp: 'Up goes the lift!', wheels: 'Wheels roll!', seesaw: 'The see-saw tips!',
  floats: 'It floats!', sinks: 'It sinks!', jump: 'Up it jumps!', balloon: 'Up, up, up!',
};
const INSTR = {
  pop: 'Tap the yellow block!', up: 'Tap the yellow block!', again: 'Tap it again!', red: 'Press the red button!',
  green: 'Press the green button!', lift: 'Press the purple button!', box: 'Push the box into the hole!',
  ramp: 'Push the ramp to the step!', plank: 'Tap the yellow bridge!', cart: 'Tap the yellow block!', rampbox: 'Push the ramp!',
  cookie: 'Tap the cookie!', jelly: 'Tap the jelly!', balloon: 'Tap the balloon!', burst: 'Pop the balloon!',
  crate: 'Push the crate into the water!', stone: 'Push the stone in!',
};
const HINT = { fill: 'Fill the hole first!', snail: 'Hello, snail!' };
const PUSH = new Set(['box', 'ramp', 'crate', 'stone']);            // blue: pushed (the wooden cart rolls by itself)
const MOVE = new Set(['box', 'ramp', 'crate', 'stone', 'cart']);   // simulated pieces
const BOXY = new Set(['box', 'cart', 'crate', 'stone']);           // drop into holes
const FILL = new Set(['box', 'cart', 'crate']);                    // fill a hole (a stone sinks)
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const V3 = (x, y, z) => new T.Vector3(x, y, z);

export default class RollLesson extends Lesson {
  get totalRounds() { return LEVELS[this.level].length; }

  // ================================================================ the scene
  build() {
    this.courses = LEVELS[this.level];
    this.N = ACTIONS[this.level];
    this.tint = WOOD_TINT[this.level];
    this.voiceLines = true;
    this.finaleRain = false;
    this.admireTime = 5;
    // morning and midday on the sunny site, golden late afternoon for Level 3; nothing stands in front of the track
    const look = [0, 0, 1][this.level];
    setSky('build', look);
    this.root.remove(this.meadow);
    this.meadow = makeScenery('build', look);
    for (const o of this.meadow.children) if (o.isGroup && o.position.z > -3.2 && Math.abs(o.position.x) < 13.5) o.visible = false;
    // nothing behind the track or the nest that looks like a piece or grows out of Mummy: the site cabin (blue on
    // blue behind the box), the digger and the brick stacks go too
    for (const o of this.meadow.children) if (o.isGroup && !o.userData.cloud && o.position.x > 3 && o.position.x < 16 && o.position.z > -16) o.visible = false;
    this.root.add(this.meadow);
    const st = (this.stage = new T.Group());
    this.root.add(st);
    const pl = makePlinth();
    if (pl) { pl.position.set(0, BASE, 0); st.add(pl); }
    // eleven columns, flush with the plinth to begin with (puzzle 1 rises from flat)
    this.cols = [];
    // (dev / QA: window.__rlSkip = n starts at puzzle n)
    if (typeof window !== 'undefined' && window.__rlSkip) this.round = Math.min(window.__rlSkip, this.courses.length - 1);
    const ext0 = this.extents(this.courses[this.round], parseCols(this.courses[this.round]));
    for (let ci = 0; ci <= 10; ci++) {
      const g = makeColumn(this.tint);
      g.position.set(colX(ci), BASE - ext0[ci] - (ext0[ci] > 0 ? 0.06 : 0), 0);
      st.add(g);
      this.cols.push({ ci, g, kind: 'flat', h: 0, att: [], tintNow: this.tint });
    }
    const log = makeLog();
    if (log) { log.position.set(-0.15, 0, 0); this.log = log; this.logBox = new T.Box3().setFromObject(log); }
    const chute = makeChute(this.tint);
    if (chute) { chute.position.set(CHUTE_X, BASE, 0); st.add(chute); }
    const nest = makeNest();
    if (nest) { nest.position.set(NEST_X, 0, 0); st.add(nest); }
    this.makeCushions();
    // Mummy watches from a mossy mound behind the nest; Pip sits on a stump behind the log
    const mound = propModel('prop_m_mound');
    this.moundTop = 0;
    if (mound) {
      mound.position.set(NEST_X + 1.5, 0, -3.15);
      mound.scale.setScalar(1.6);
      st.add(mound);
      mound.updateMatrixWorld(true);
      // taller, so Mummy's whole face clears the raised back row of the nest
      const t0 = new T.Box3().setFromObject(mound).max.y;
      mound.scale.y = 1.6 * (t0 + 0.6) / Math.max(0.1, t0);
      mound.updateMatrixWorld(true);
      this.moundTop = new T.Box3().setFromObject(mound).max.y - 0.04;
    }
    const mum = (this.mum = makeAnimal('hedgehog'));
    mum.scale.setScalar(1.25);
    mum.userData.baseScale = 1.25;
    mum.position.set(NEST_X + 1.5, this.moundTop, -3.15);
    mum.rotation.y = -0.35;
    this.mumYaw = -0.35;
    st.add(mum);
    // Pip stands on a low stump (as high as the table's base) just left of the table's end, in front: in plain
    // view beside the log, never in front of it, clear of the Home button; framed while she picks a baby
    const stump = propModel('prop_m_stump');
    let stumpTop = BASE;
    if (stump) {
      stump.position.set(-7.15, 0, 0.35);
      stump.updateMatrixWorld(true);
      const h0 = new T.Box3().setFromObject(stump).max.y;
      stump.scale.setScalar(BASE / Math.max(0.1, h0));
      st.add(stump);
      stump.updateMatrixWorld(true);
      stumpTop = new T.Box3().setFromObject(stump).max.y - 0.03;
    }
    this.pip.position.set(-7.15, stumpTop, 0.35);
    this.pip.rotation.y = 0.45;
    this.pip.userData.noWalk = true;
    this.pipTop = stumpTop;
    if (this.level === 2) this.makeLanterns();
    // state
    this.pieces = [];
    this.statics = [];
    this.nestHogs = [];
    // every baby looks different; babies she has not brought home before come first (the collection is kept)
    const seen = (store.get().rollHogs && store.get().rollHogs.seen) || [];
    const all = [...Array(VARIANTS).keys()];
    this.order = [...shuffle(all.filter((v) => !seen.includes(v))), ...shuffle(all.filter((v) => seen.includes(v)))];
    this.nextV = 0;
    this.peekers = [null, null];
    this.spoken = new Set();
    this.taught = new Set();
    this.uhSaid = new Set();
    this.stepI = 0;
    this.phase = 'intro';
    this.hog = null;
    this.push = null;
    this.camMode = 'log';
    this.camC = { pos: V3(-3.4, 3.4, 7), look: V3(-3.4, 2.4, 0), vp: V3(), vl: V3() };
    this.camT = { pos: this.camC.pos.clone(), look: this.camC.look.clone() };
    setCamera(this.camC.pos, this.camC.look);
    this.offs.push(() => rollSound.stop());
  }

  makeCushions() {
    const n = this.courses.length;
    // fill order: back row right-to-left, then the middle, then the front (so every new baby is in plain view)
    const rows = n <= 10 ? [[4, 3, 2, 1], [4, 3, 2], [4, 3, 2]] : n <= 12 ? [[4, 3, 2, 1], [4, 3, 2, 1], [4, 3, 2, 1]] : [[4, 3, 2, 1, 0], [4, 3, 2, 1, 0], [4, 3, 2, 1]];
    this.slots = [];
    [2, 1, 0].forEach((ri, k) => {
      for (const c of rows[k]) {
        const row = NEST_ROWS[ri];
        const cu = makeCushion(NOTE_TINTS[(this.slots.length * 5) % NOTE_TINTS.length]);
        const p = V3(NEST_COLS[c], row.y, row.z);
        if (cu) { cu.position.copy(p); this.stage.add(cu); }
        this.slots.push({ row: ri, col: c, pos: p, cushion: cu });
      }
    });
  }
  makeLanterns() {
    this.lanterns = [];
    for (const [x, z] of [[NEST_X - 2.75, -2.4], [NEST_X + 3.7, -2.4]]) {
      const l = propModel('prop_lantern', { size: 0.8 });
      if (!l) continue;
      l.position.set(x, 0, z);
      this.stage.add(l);
      this.lanterns.push(l);
    }
  }

  // ================================================================ rounds
  get course() { return this.courses[this.round]; }
  async startRound(r) {
    this.busy = true;
    this.tableReady = false;
    this.roundT0 = performance.now();
    this.phase = 'reform';
    this.posSaid = false;
    this.lastGate = null;
    this.cur.stops = 0;
    // the level's tune: each puzzle starts on its own first note (spare notes of a shorter solution are skipped)
    this.stepI = this.courses.slice(0, r).reduce((s, c) => s + c.acts, 0);
    this.stepEnd = this.stepI + this.course.acts;
    this.camMode = 'log';
    this.camFast = this.round > 0;
    // the old table already sank while the last baby settled in the nest (landHome); the new one rises now with the
    // next hoglet already curled up inside the log, so the child can act the moment the table is up (< 1.5 s)
    await this.reform(this.course, !this.formed);
    this.formed = true;
    if (this.dead) return;
    this.tableReady = true;
    this.busy = false;
    console.log('ROUND READY r' + this.round + ' ' + Math.round(performance.now() - this.roundT0) + 'ms');
    if (this.hog && this.hog.state === 'wait') { this.logTouch(); this.launchHoglet(); return; }
    // the babies only ask once they are on screen (the camera may still be gliding back from the nest)
    await this.until(() => this.logInView(), 2.5);
    if (this.dead) return;
    this.logTouch();
    this.startChoice();
  }
  logTouch() {
    const now = performance.now();
    const a = this.actT ? Math.round(now - this.actT) + 'ms' : '-';
    console.log('ROUND TOUCH r' + this.round + ' act->touch ' + a + ' start->touch ' + Math.round(now - this.roundT0) + 'ms');
  }
  // Go! as soon as the table is up: pieces may be used in any order, even while the hoglet rolls out
  checkGo() {
    if (!this.goPending || this.dead) return;
    const H = this.hog;
    if (this.tableReady && !this.demoing && H && (H.state === 'stop' || H.state === 'float')) { this.goPending = false; this.goKey = this.lastGate; showGo(); }
  }
  canGo() { return !!this.tableReady && !this.dead; }

  // ---------------------------------------------------------------- the table re-forms
  // 1. columns sink into the plinth just deep enough to hide their old and new pieces (right to left, so a plank
  //    lying across two columns never digs in); old buttons slide back into their sockets, the hatch closes.
  //    Run early (from landHome) so it is already done when the next puzzle starts.
  sinkOld(course) {
    if (this.sinking) return this.sinking;
    const cols = parseCols(course);
    const extNew = this.extents(course, cols);
    this.clearStatics();
    for (const P of this.pieces) {
      this.detachPhysics(P);
      if (MOVE.has(P.k) && P.obj && P.obj.parent === this.stage) this.reparent(P.obj, this.colAt(P.obj.position.x));
    }
    const down = [];
    rollSound.reform();
    const tuck = this.tuckP || Promise.all([this.popButtons(false), this.hatch ? this.closeHatch() : null]);
    this.tuckP = null;
    for (let i = 10; i >= 0; i--) {
      const c = this.cols[i];
      const e = Math.max(this.extentOld(c), extNew[i]);
      const y0 = c.g.position.y, y1 = BASE - e - 0.06;
      if (e <= 0 || y0 <= y1) continue;
      down.push(tuck.then(() => this.wait((10 - i) * 0.015)).then(() => this.s.anim(clamp((y0 - y1) * 0.1, 0.25, 0.45), (k) => { c.g.position.y = y0 + (y1 - y0) * k; }, Ease.inOut)));
    }
    down.push(tuck);
    this.sinking = Promise.all(down);
    return this.sinking;
  }
  async reform(course, first) {
    const cols = parseCols(course);
    if (!first) await this.sinkOld(course);
    this.sinking = null;
    if (this.dead) return;
    const old = this.pieces;
    this.pieces = [];
    this.seesaw = null;
    // 2. down in the plinth: swap the pieces and column caps for the new course
    for (const P of old) this.disposePiece(P);
    for (const c of this.cols) { for (const o of c.att) c.g.remove(o); c.att = []; }
    this.colSpec = cols;
    cols.forEach((spec) => this.shapeColumn(this.cols[spec.i], spec));
    this.shapeColumn(this.cols[0], { i: 0, h: cols[0].h });
    if (this.log) this.attach(this.cols[0], this.log);
    for (const spec of course.pieces) this.makePiece(spec, cols);
    this.makeButtons(course);
    // the next hoglet waits curled up inside the log (it rises with it, hidden)
    // round 1: the first baby waits in the log; then two babies peek out of the log's windows and she picks one
    if (this.hog && (this.hog.state === 'home' || this.hog.state === 'nest')) this.hog = null;   // (it finishes settling by itself)
    if (this.round === 0 || !this.peekers.some(Boolean)) this.makeHoglet(this.takeVariant());
    this.makePeekers();
    // 3. the new skyline rises, left to right; new buttons slide out of their sockets
    const up = [];
    for (let i = 0; i <= 10; i++) {
      const c = this.cols[i];
      const y0 = c.g.position.y, y1 = topY(c.h);
      if (Math.abs(y1 - y0) < 0.001) continue;
      up.push(this.wait(i * 0.015).then(() => this.s.anim(clamp(Math.abs(y1 - y0) * 0.1, 0.3, 0.5), (k) => { c.g.position.y = y0 + (y1 - y0) * k; }, Ease.out)));
    }
    await Promise.all(up);
    this.popButtons(true);
    if (this.hatch) { const h = this.hatch; this.s.anim(0.3, (k) => { h.position.z = 0.58 + 0.12 * k; }, Ease.out); }
    if (this.dead) return;
    for (const c of this.cols) c.g.position.y = topY(c.h);
    this.buildStatics();
    for (const P of this.pieces) this.attachPhysics(P);
  }
  // how far above its top a column's pieces reach (old: measured; new: from the course)
  extentOld(c) {
    let e = 0;
    c.g.updateMatrixWorld(true);
    const top = c.g.position.y;
    for (const o of c.att) { const b = new T.Box3().setFromObject(o); if (!b.isEmpty()) e = Math.max(e, b.max.y - top); }
    return e;
  }
  extents(course, cols) {
    const e = Array(11).fill(0);
    e[0] = 1.4;
    cols.forEach((c) => { if (c.slope) e[c.i] = Math.max(e[c.i], 0.45); });
    for (const p of course.pieces) {
      const k = p.k, c = p.col;
      if (k === 'pop') e[c] = Math.max(e[c], (p.n || 1) + 0.05);
      else if (k === 'up') e[c] = Math.max(e[c], 0.3);
      else if (k === 'plank' || k === 'door') e[c] = Math.max(e[c], 2.4);
      else if (k === 'seesaw') for (let i = c; i <= c + 2; i++) e[i] = Math.max(e[i], 2.0);
      else if (k === 'box' || k === 'ramp' || k === 'crate' || k === 'stone' || k === 'cookie') e[c] = Math.max(e[c], 1.05);
      else if (k === 'jelly') e[c] = Math.max(e[c], 0.5);
      else if (k === 'balloon') e[c] = Math.max(e[c], 2.1);
      else if (k === 'cart') e[c] = Math.max(e[c], 1.2);
    }
    return e;
  }
  closeHatch() {
    const h = this.hatch, door = h.userData.door, sn = this.snail;
    const z0 = sn ? sn.position.z : 0, r0 = door ? door.rotation.y : 0;
    return this.s.anim(0.5, (k) => { if (sn) sn.position.z = z0 + (-0.35 - z0) * k; if (door) door.rotation.y = r0 * (1 - k); }, Ease.inOut)
      .then(() => this.s.anim(0.25, (k) => { h.position.z = 0.7 - 0.12 * k; }, Ease.inOut));
  }

  // one column: its height, slope cap or lift cap (new caps are made while it is down in the plinth)
  shapeColumn(c, spec) {
    c.kind = spec.lift ? 'lift' : spec.seesaw ? 'seesaw' : spec.slope ? 'slope' : spec.hole ? 'hole' : 'flat';
    c.h = spec.slope ? spec.h - 1 : spec.h;
    c.spec = spec;
    const body = c.g.userData.body;
    if (body) {
      // lifts are purple; the rest wood
      const want = c.kind === 'lift' ? 0xd9c2ff : this.tint;
      if (c.tintNow !== want) { c.g.remove(body); const nb = makeColumn(want).userData.body; if (nb) { c.g.add(nb); c.g.userData.body = nb; } c.tintNow = want; }
    }
    if (c.kind === 'slope') { const cap = makeSlopeCap(this.tint); if (cap) { c.g.add(cap); c.att.push(cap); } }
    c.water = !!spec.water;
    if (spec.water) {
      // the water's surface sits 0.35 under the track; a crate floats with its top flush with the track
      const w = makeWater();
      const track = this.colSpec[spec.i - 2] ? (this.colSpec[spec.i - 2].slope ? this.colSpec[spec.i - 2].h - 1 : this.colSpec[spec.i - 2].h) : 4;
      c.waterY = (track - spec.h) * STEP - 0.35;
      w.position.set(0, c.waterY, 0);
      c.g.add(w); c.att.push(w);
      c.waterMesh = w;
    }
    if (c.kind === 'lift') { const cap = makeLiftCap(); if (cap) { c.g.add(cap); c.att.push(cap); } }
  }
  attach(c, o) { c.g.add(o); c.att.push(o); }

  // the world outline of column ci's top: y at x
  colTopAt(ci, x) {
    const c = this.cols[ci];
    const y = c.g.position.y;
    if (c.kind === 'slope') return y + STEP * clamp(0.5 - (x - colX(ci)), 0, 1);
    return y;
  }
  trackH(ci) { return this.cols[ci].kind === 'slope' ? this.cols[ci].h + 1 : this.cols[ci].h; }

  // ---------------------------------------------------------------- pieces
  makePiece(spec, cols) {
    const ci = spec.col, c = this.cols[ci], x = colX(ci);
    const P = { k: spec.k, spec, col: ci, x, state: 'idle', taps: 0 };
    if (spec.k === 'pop') {
      P.n = spec.n || 1; P.sunk = 0; P.depth = 0;
      P.obj = makePop(P.n);
      P.tall = true;
      this.attach(c, P.obj);
    } else if (spec.k === 'up') {
      // sunk in the hole: 0.2 of it shows; it rises until its top is flush with the track
      P.full = (this.leftTrack(ci) - c.h) * STEP;
      P.obj = makePop(1);
      P.obj.position.y = 0.2 - 1.0;
      P.y0 = P.obj.position.y;
      this.attach(c, P.obj);
    } else if (spec.k === 'plank') {
      P.obj = makePlank();
      P.obj.position.set(0.5 - 0.06, 0.08, 0);
      P.obj.userData.vis.rotation.z = Math.PI / 2;
      P.a = Math.PI / 2;
      P.tall = true;
      this.attach(c, P.obj);
    } else if (spec.k === 'door') {
      P.color = spec.color;
      P.obj = makeDoor(spec.color);
      P.dx = spec.at === 'left' ? -0.25 : 0;
      P.obj.position.x = P.dx;
      P.x = x + P.dx;
      P.leaf = P.obj.userData.leaf;
      P.btnCol = spec.btn || ci;
      P.tall = true;
      this.attach(c, P.obj);
    } else if (spec.k === 'button') {
      P.color = spec.color;
      P.btnCol = ci;
      P.obj = null;
    } else if (spec.k === 'lift') {
      P.a = spec.a; P.b = spec.b; P.at = spec.a; P.moving = false;
      P.btnCol = ci;
      P.obj = c.g;
    } else if (spec.k === 'seesaw') {
      const pc = this.cols[ci + 1];
      const post = makePivot(this.tint);
      if (post) this.attach(pc, post);
      P.obj = makeSeesaw();
      P.obj.position.set(0, 1.305, 0);
      P.a = spec.box ? SEE_TIP : SEE_WAIT;
      P.obj.rotation.z = P.a;
      P.tall = true;
      P.pc = pc.ci;
      P.x = colX(ci + 1);
      this.attach(pc, P.obj);
      this.seesaw = P;
    } else if (MOVE.has(spec.k)) {
      P.obj = { box: makeBox, ramp: makeRamp, cart: makeCart, crate: makeCrate, stone: makeStone }[spec.k]();
      P.half = spec.k === 'ramp' ? 0.5 : spec.k === 'stone' ? 0.46 : 0.48;
      P.tall = spec.k === 'stone' ? 0.64 : 0.8;
      P.goal = spec.goal;
      P.goalX = colX(spec.goal);
      if (spec.onSeesaw && this.seesaw) {
        // sitting on the see-saw's right end (held down by it)
        P.obj.position.set(0.95, 0, 0);
        this.seesaw.obj.add(P.obj);
        this.seesaw.obj.userData.att = P.obj;
        P.onSee = true;
      } else if (spec.k === 'cart') {
        // on the slope, leaning against whatever holds it at the right
        const holder = this.courseHolder(spec);
        const face = holder && holder.k === 'door' ? colX(holder.col) - 0.25 - 0.15 : colX(ci + 1) - 0.45;
        const th = Math.atan(STEP);
        const cx = face - 0.48 * Math.cos(th) - 0.8 * Math.sin(th) - 0.004;
        const lx = cx - x, ly = STEP * clamp(0.5 - lx, 0, 1);
        P.obj.position.set(lx, ly, 0);
        P.obj.rotation.z = -th;
        this.attach(c, P.obj);
      } else this.attach(c, P.obj);
    }
    else if (spec.k === 'cookie') {
      P.obj = makeCookieStack();
      P.bites = 0;
      this.attach(c, P.obj);
    } else if (spec.k === 'jelly') {
      P.obj = makeJelly();
      this.attach(c, P.obj);
      P.wob = 0; P.wobV = 0;
    } else if (spec.k === 'balloon') {
      // tied to a little peg at the back of the column, floating up behind the track
      const peg = makePeg();
      if (peg) { peg.position.set(-0.2, 0.0, -0.62); this.attach(c, peg); }
      P.obj = makeBalloon();
      P.obj.position.set(-0.2, 0.34, -0.62);
      this.attach(c, P.obj);
      P.state = 'tied';
    }
    this.pieces.push(P);
    if (P.obj) P.obj.userData.piece = P;
    this.addInput(P);
    return P;
  }
  courseHolder(spec) {
    return this.course.pieces.find((q) => q.holds);
  }
  leftTrack(ci) { const L = this.colSpec[ci - 2]; return L ? (L.slope ? L.h - 1 : L.h) : 4; }

  // dome buttons on the plinth's front (one per door, lift and decoy); they slide out of their sockets as the table rises
  // Dome buttons sit on the front face of the very block they work (a door's own column, the lift itself; 3-3's two
  // buttons on the columns either side of the green door), with a bright cable in their colour running up to the
  // door that lights when pressed. They hide inside their column while it moves and pop out once it is up.
  makeButtons(course) {
    this.hatch = null; this.snail = null;
    this.buttons = [];
    const BY = -0.36;   // button centre below the column top
    for (const P of this.pieces) {
      if (!['door', 'lift', 'button'].includes(P.k)) continue;
      const color = P.k === 'lift' ? 'purple' : P.color;
      const g = makeButton(color, P.k === 'lift');
      const c = this.cols[P.btnCol];
      const bx = P.k === 'door' && P.btnCol === P.col ? P.dx : 0;
      g.position.set(bx, BY, 0.4);          // inside the column until it is up
      this.attach(c, g);
      const b = { g, P, color, dome: g.userData.dome, z1: 0.7, lits: [] };
      if (P.k === 'door') {
        // the cable: (across to the door's column,) then up its front post to the hood
        const dc = this.cols[P.col], px = P.dx - 0.21;
        if (P.btnCol !== P.col) {
          const from = colX(P.btnCol) - colX(P.col), w = Math.abs(from - px);
          const hc = makeCable(color, w);
          hc.rotation.z = from > px ? Math.PI / 2 : -Math.PI / 2;
          hc.position.set(from, BY, 0.7005);
          this.attach(dc, hc);
          b.lits.push(hc);
        }
        const vc = makeCable(color, 0.95 - BY);
        vc.position.set(px, BY, 0.7005);
        this.attach(dc, vc);
        b.lits.push(vc);
      }
      P.btn = b;
      this.buttons.push(b);
      b.tap = input.addTap(g, { radius: 0.5, press: false, onTap: () => this.pressButton(b) });
    }
    // 3-3: the red decoy opens a little hatch below it, with a snail inside
    const decoy = this.pieces.find((P) => P.k === 'button');
    if (decoy) {
      const c = this.cols[decoy.btnCol];
      const h = makeHatch();
      h.position.set(-0.25, -0.98, 0.58);     // tucked into the column until it is up
      this.attach(c, h);
      this.hatch = h;
      const sn = propModel('prop_farmsnail');
      if (sn) {
        const b = new T.Box3().setFromObject(sn), s = b.getSize(new T.Vector3());
        sn.scale.multiplyScalar(0.3 / Math.max(s.x, s.y));
        sn.position.set(0.25, -0.14, -0.35);
        sn.rotation.y = 0.5;
        const m = sn.userData.model?.userData; if (m) { m.noWalk = true; m.noLook = true; }
        h.add(sn);
        this.snail = sn;
      }
    }
  }
  popButtons(out) {
    return Promise.all((this.buttons || []).map((b) => { const z0 = b.g.position.z, z1 = out ? b.z1 : 0.4; return this.s.anim(out ? 0.35 : 0.25, (k) => { b.g.position.z = z0 + (z1 - z0) * k; }, out ? Ease.out : Ease.inOut); }));
  }

  addInput(P) {
    const o = P.obj;
    if (!o) return;
    if (P.k === 'pop' || P.k === 'up') {
      // the whole visible stack is the target (a tall block: both blocks; after a sink: the block still showing)
      const n = P.k === 'pop' ? P.n || 1 : 1;
      P.tap = input.addTap(o, { radius: 0.62 + (n - 1) * 0.4, offset: V3(0, n * 0.5, 0.3), onTap: () => this.tapPiece(P) });
    } else if (P.k === 'door') {
      P.tap = input.addTap(P.leaf, { radius: 0.6, offset: V3(0, 0.5, 0.3), press: false, onTap: () => this.tapDoor(P) });
    } else if (P.k === 'lift') {
      P.tap = input.addTap(o, { radius: 0.55, offset: V3(0, -0.2, 0.4), press: false, onTap: () => P.btn && this.pressLift(P.btn) });
    } else if (P.k === 'cart') {
      P.tap = input.addTap(o, { radius: 0.6, offset: V3(0, 0.4, 0.3), press: false, onTap: () => { this.wobble(o.userData.vis, 0.05); const h = this.waitGate && this.helperFor(this.waitGate); if (h && h.obj) this.bob(h); } });
    } else if (P.k === 'cookie') {
      P.tap = input.addTap(o, { radius: 0.6, offset: V3(0, 0.5, 0.4), onTap: () => this.tapPiece(P) });
    } else if (P.k === 'jelly') {
      P.tap = input.addTap(o, { radius: 0.55, offset: V3(0, 0.2, 0.4), press: false, onTap: () => this.tapPiece(P) });
    } else if (P.k === 'balloon') {
      P.tap = input.addTap(o.userData.vis, { radius: 0.45, offset: V3(0, 1.3, 0), press: false, onTap: () => this.tapPiece(P) });
    } else if (P.k === 'plank') {
      P.tap = input.addTap(o, { radius: 0.66, offset: V3(0.12, 0.7, 0.4), press: false, onTap: () => this.tapPiece(P) });
    } else if (PUSH.has(P.k)) {
      P.drag = input.addDrag(o, {
        radius: 0.62, offset: V3(0, P.k === 'ramp' ? 0.25 : 0.4, 0.3), feel: false, magnet: 0, sound: false, minY: -20, zones: () => [],
        onPick: () => this.pickPush(P), onMove: () => this.movePush(P), onDrop: (z, info) => this.dropPush(P, info),
      });
    }
  }

  // Rapier: static outline of the table (equal flat columns merged into one box), kinematic blocks / doors / see-saw,
  // dynamic pushed pieces.
  buildStatics() {
    this.clearStatics();
    const add = (b) => { if (b) this.statics.push(b); };
    let i = 1;
    while (i <= 10) {
      const c = this.cols[i];
      if (c.kind === 'lift') { i++; continue; }
      let j = i;
      while (j + 1 <= 10 && this.cols[j + 1].kind !== 'lift' && Math.abs(this.cols[j + 1].g.position.y - c.g.position.y) < 1e-4 && c.kind !== 'slope' && this.cols[j + 1].kind !== 'slope') j++;
      const x0 = colX(i) - 0.5, x1 = colX(j) + 0.5, y = c.g.position.y;
      add(physics.box(V3((x0 + x1) / 2, y - 1.6, 0), V3(x1 - x0, 3.2, 1.4)));
      if (c.kind === 'slope') {
        const th = Math.atan(STEP), L = Math.hypot(1, STEP);
        const q = new T.Quaternion().setFromAxisAngle(V3(0, 0, 1), -th);
        add(physics.slab(V3(colX(i), y + STEP / 2 - 0.05 / Math.cos(th), 0), V3(L, 0.1, 1.4), q));
      }
      i = j + 1;
    }
    // the log's floor and a wall at each end so nothing ever leaves the track
    add(physics.box(V3(-6.6, BASE + 3, 0), V3(0.4, 6, 1.4)));
    add(physics.box(V3(5.2, BASE + 3, 0), V3(0.4, 6, 1.4)));
  }
  clearStatics() { for (const b of this.statics) physics.removeStatic(b); this.statics = []; }
  attachPhysics(P) {
    const o = P.obj;
    if (!o || !physics.ok) return;
    if (P.k === 'pop' || P.k === 'up') physics.kinematic(o, { size: [0.9, P.n || 1, 1.18], offset: [0, (P.n || 1) / 2, 0] });
    else if (P.k === 'cookie') physics.kinematic(o, { size: [0.96, 0.99, 1.1], offset: [0, 0.5, 0] });
    else if (P.k === 'door') physics.kinematic(P.leaf, { size: [0.3, 0.95, 1.2], offset: [0, 0.475, 0] });
    else if (P.k === 'seesaw') physics.kinematic(o, { size: [3.0, 0.12, 1.1], offset: [0, -0.06, 0], friction: 0.9 });
    else if (MOVE.has(P.k)) {
      // out of the column into the world, then simulated
      o.updateMatrixWorld(true);
      const wp = o.getWorldPosition(new T.Vector3()), wq = o.getWorldQuaternion(new T.Quaternion());
      o.parent.remove(o);
      this.stage.add(o);
      o.position.copy(wp); o.quaternion.copy(wq);
      for (const c of this.cols) c.att = c.att.filter((a) => a !== o);
      if (this.seesaw && this.seesaw.obj.userData.att === o) this.seesaw.obj.userData.att = null;
      o.userData.quiet = true;
      o.userData.noSquash = true;
      const q0 = o.quaternion.clone();
      o.quaternion.identity();
      const body = physics.add(o, P.k === 'ramp'
        ? { shape: 'hull', mass: 3, bounce: 0, friction: 0.6, planar: true, sleep: false }
        : { shape: 'box', size: P.k === 'stone' ? V3(0.92, 0.64, 1.1) : V3(0.96, 0.8, 1.2), mass: 3, bounce: 0, friction: P.k === 'cart' ? 0 : 0.6, planar: true, sleep: false });
      o.quaternion.copy(q0);
      if (!body) return;
      body.setRotation({ x: q0.x, y: q0.y, z: q0.z, w: q0.w }, true);
      body.setLinearDamping(P.k === 'cart' ? 0.3 : 0.5);
      P.rotFree = P.k === 'cart' || P.onSee;
      if (!P.rotFree) body.lockRotations(true, true);
      if (P.k === 'cart') { const col = body.collider(0); if (col && physics.rapier) col.setFrictionCombineRule(physics.rapier.CoefficientCombineRule.Min); }
      P.body = body;
      P.state = 'free';
    }
  }
  detachPhysics(P) {
    if (!P.obj) return;
    physics.removeKinematic(P.obj);
    if (P.leaf) physics.removeKinematic(P.leaf);
    if (physics.has(P.obj)) physics.remove(P.obj);
    P.body = null;
  }
  disposePiece(P) {
    this.detachPhysics(P);
    if (P.tap) input.remove(P.tap);
    if (P.drag) input.remove(P.drag);
    if (P.obj && P.obj.parent && P.k !== 'lift') P.obj.parent.remove(P.obj);
    if (P.halo) { P.halo(); P.halo = null; }
  }

  // ================================================================ the hoglet
  takeVariant() { return this.order[(this.nextV++) % this.order.length]; }
  makeHoglet(v) {
    const h = makeHoglet(v);
    const c0 = this.cols[0];
    h.position.set(-0.25, 0.14 + R, 0);          // in the log, in c0's frame: it rides up with it, out of sight
    c0.g.add(h);
    const u = h.userData;
    if (u.face) setFace(u.face, 'happy');
    this.hog = { obj: h, u, x: -5.75, y: 0, v: 0, vy: 0, ground: true, spin: 0, state: 'wait', still: 0, lean: 0, squash: 0, look: null, lookT: 0, v0: v };
  }
  // two babies wait at the log's front windows (only their faces show); the one she taps rolls next
  makePeekers() {
    const log = this.log;
    if (!log) return;
    for (let i = 0; i < 2; i++) {
      if (this.peekers[i]) continue;
      const v = this.takeVariant();
      const h = makeHoglet(v);
      h.userData.ball.visible = false;
      h.scale.setScalar(0.78);
      h.position.set(i ? 0.26 : -0.36, 0.62, 0.4);   // its face just out of the dark window
      log.add(h);
      if (h.userData.face) setFace(h.userData.face, 'happy');
      const pk = { h, v, i };
      pk.tap = input.addTap(h, { radius: 0.45, offset: V3(0, 0, 0.4), onTap: () => this.choose(pk) });
      pk.tap.enabled = false;
      this.peekers[i] = pk;
    }
  }
  startChoice() {
    this.choosing = true;
    for (const pk of this.peekers) if (pk) pk.tap.enabled = true;
    if (this.round <= 2) this.say('Tap a baby!', { voice: true });
    this.bobBabies();
    // it never chooses for her: the help ladder bobs the faces, says the line and shows the hand; the baby nearest
    // the mouth only rolls out when she uses a piece instead (acted)
  }
  bobBabies() {
    this.peekers.forEach((pk, i) => {
      if (!pk || pk.bobbing) return;
      pk.bobbing = true;
      const y0 = pk.h.position.y;
      this.s.wait(i * 0.4).then(() => this.s.anim(0.8, (_, t) => { if (this.choosing) pk.h.position.y = y0 + Math.abs(Math.sin(t * Math.PI * 2)) * 0.05; }).then(() => { pk.h.position.y = y0; pk.bobbing = false; }));
    });
  }
  // the log's window (where the babies peek out) is inside the screen, clear of the corner buttons
  logInView() {
    const W = innerWidth, Hh = innerHeight;
    for (const pk of this.peekers) {
      if (!pk) continue;
      const w = pk.h.getWorldPosition(new T.Vector3());
      for (const [dx, dy] of [[-0.3, -0.25], [0.3, 0.3]]) {
        const q = project(V3(w.x + dx, w.y + dy, w.z));
        if (q.x < 16 || q.x > W - 16 || q.y < 16 || q.y > Hh - 16 || (q.x < 140 && q.y < 150)) return false;   // (clear of the Home button)
      }
    }
    return true;
  }
  // the ladder while she chooses: hand on the nearest face, both faces glow (never chosen for her)
  choiceHint(glow) {
    const pks = this.peekers.filter(Boolean);
    if (!pks.length) return;
    this.demoing = true;
    fx.clearHands();
    const pk = this.peekers[1] || pks[0];
    const w = pk.h.getWorldPosition(new T.Vector3());
    fx.ghostPath([V3(w.x, w.y, w.z + 0.45)], { mode: 'tap', maxDur: 2.2 });
    if (glow) for (const q of pks) { const stop = fx.halo(q.h, 0.42); this.s.wait(3).then(stop); }
    this.bobBabies();
    const id = (this.demoId = (this.demoId || 0) + 1);
    const end = () => { if (this.demoId !== id) return; this.demoId++; fx.clearHands(); this.demoing = false; };
    const off = input.onAny(() => { off(); end(); });
    this.offs.push(off);
    this.s.wait(2.7).then(() => { off(); end(); });
  }
  async choose(pk) {
    if (!this.choosing || !pk || this.dead) return;
    this.choosing = false;
    for (const q of this.peekers) if (q) q.tap.enabled = false;
    this.peekers[pk.i] = null;
    input.remove(pk.tap);
    // it ducks back into the log (the window is dark inside), and out of the mouth it rolls
    const h = pk.h, z0 = h.position.z;
    if (h.userData.face) setFace(h.userData.face, 'joy');
    await this.s.anim(0.3, (e) => { h.position.z = z0 - 0.45 * e; }, Ease.in);
    if (h.parent) h.parent.remove(h);
    this.makeHoglet(pk.v);
    this.launchHoglet();
  }
  // out of the log it rolls (two blinks in the dark mouth on the way, without stopping)
  launchHoglet() {
    const H = this.hog;
    if (!H || H.state !== 'wait') return;
    const o = H.obj, wp = o.getWorldPosition(new T.Vector3());
    o.parent.remove(o);
    this.stage.add(o);
    o.position.copy(wp);
    H.x = wp.x; H.y = wp.y;
    H.state = 'roll';
    this.s.wait(0.25).then(() => this.blink(H, 2));
  }
  blink(H, n = 1) {
    const f = H.u.face;
    if (!f) return this.wait(0.3);
    const eyes = f.userData.eyes;
    let p = Promise.resolve();
    for (let i = 0; i < n; i++) {
      p = p.then(() => this.s.anim(0.18, (_, t) => { const k = 1 - Math.sin(t * Math.PI) * 0.9; for (const e of eyes) e.scale.y = k; })).then(() => { for (const e of eyes) e.scale.y = 1; return this.wait(0.06); });
    }
    return p;
  }
  until(fn, max = 10) {
    return new Promise((res) => {
      const t0 = performance.now();
      const chk = () => { if (fn() || performance.now() - t0 > max * 1000 || this.dead) res(); else requestAnimationFrame(chk); };
      chk();
    });
  }

  // the 2-D world the hoglet rolls on: columns, pieces, log floor, chute and nest pad
  polys() {
    const out = [];
    for (let ci = 0; ci <= 10; ci++) {
      const c = this.cols[ci], x0 = colX(ci) - 0.5, x1 = colX(ci) + 0.5, y = c.g.position.y;
      if (c.kind === 'slope') out.push(poly([[x0, -10], [x1, -10], [x1, y], [x0, y + STEP]], c));
      else out.push(poly([[x0, -10], [x1, -10], [x1, y], [x0, y]], c));
    }
    // the log's inside floor (0.14 above its column top) up to its mouth
    const ly = this.cols[0].g.position.y;
    out.push(poly([[-6.4, ly], [-4.95, ly], [-4.95, ly + 0.14], [-6.4, ly + 0.14]], 'log'));
    out.push(poly([[-6.4, ly], [-6.3, ly], [-6.3, ly + 1.3], [-6.4, ly + 1.3]], 'logback'));
    const cp = chutePts();
    out.push(poly([...cp.map(([x, y]) => [x, y - 0.1]), ...cp.slice().reverse()], 'chute'));
    out.push(poly([[5.6, -1], [11, -1], [11, NEST_ROWS[0].y], [5.6, NEST_ROWS[0].y]], 'nest'));
    for (const P of this.pieces) { const p = this.piecePoly(P); if (p) out.push(p); }
    return out;
  }
  piecePoly(P) {
    const o = P.obj;
    if (!o) return null;
    if (P.k === 'pop' || P.k === 'up') {
      const wp = o.getWorldPosition(this._v || (this._v = new T.Vector3()));
      const h = P.k === 'pop' ? P.n : 1;
      return rectPoly(wp.x - 0.45, wp.x + 0.45, wp.y, wp.y + h, 0, 0, 0, P);
    }
    if (P.k === 'cookie') {
      if (P.bites >= 3) return null;
      const wp = o.getWorldPosition(this._v || (this._v = new T.Vector3()));
      return rectPoly(wp.x - 0.48, wp.x + 0.48, wp.y, wp.y + (3 - P.bites) * 0.33, 0, 0, 0, P);
    }
    if (P.k === 'jelly') {
      const wp = o.getWorldPosition(this._v || (this._v = new T.Vector3()));
      return rectPoly(wp.x - 0.46, wp.x + 0.46, wp.y, wp.y + 0.42, 0, 0, 0, P);
    }
    if (P.k === 'door') {
      const c = this.cols[P.col], y = c.g.position.y + P.leaf.position.y;
      return rectPoly(P.x - 0.15, P.x + 0.15, y, y + 0.95, 0, 0, 0, P);
    }
    if (P.k === 'plank') {
      const c = this.cols[P.col], px = colX(P.col) + 0.44, py = c.g.position.y + 0.08;
      return rectPoly(px, px + 2.3, py - 0.08, py + 0.06, P.a, px, py, P);
    }
    if (P.k === 'seesaw') {
      const c = this.cols[P.pc], px = P.x, py = c.g.position.y + 1.305;
      return rectPoly(px - 1.5, px + 1.5, py - 0.12, py, P.obj.rotation.z, px, py, P);
    }
    if (BOXY.has(P.k)) {
      const wp = o.getWorldPosition(this._v || (this._v = new T.Vector3()));
      const a = P.k === 'cart' || P.onSee ? new T.Euler().setFromQuaternion(o.getWorldQuaternion(new T.Quaternion())).z : 0;
      if (P.state === 'sunk') return null;
      return rectPoly(wp.x - P.half, wp.x + P.half, wp.y, wp.y + P.tall, a, wp.x, wp.y, P);
    }
    if (P.k === 'ramp') {
      const wp = o.getWorldPosition(this._v || (this._v = new T.Vector3()));
      return poly([[wp.x - 0.5, wp.y], [wp.x + 0.5, wp.y], [wp.x + 0.5, wp.y + 0.4], [wp.x - 0.5, wp.y + 0.025]], P);
    }
    return null;
  }
  pieceLeft(P) {
    const o = P.obj, wp = o.getWorldPosition(new T.Vector3());
    if (P.k === 'cart') {
      const a = new T.Euler().setFromQuaternion(o.getWorldQuaternion(new T.Quaternion())).z;
      const c = Math.cos(a), s = Math.sin(a);
      return Math.min(wp.x - 0.48 * c, wp.x - 0.48 * c - 0.8 * s, wp.x + 0.48 * c - 0.8 * s);
    }
    return wp.x - P.half;
  }

  // ---------------------------------------------------------------- gates: what may stop the hoglet, and what opens it
  gates() {
    const list = [];
    const settled = (P) => P.state === 'settled' || P.state === 'locked' || P.state === 'sunk';
    for (const P of this.pieces) {
      if (P.k === 'cookie') list.push({ kind: 'cookie', P, stop: P.x - 0.48 - SG, open: P.bites >= 3 });
      // the jelly: it rolls down onto it and waits in the middle; the bounce carries it on (scripted)
      else if (P.k === 'jelly') list.push({ kind: 'high', P, stop: P.x, open: !!P.launched });
      // the balloon: it waits at the foot of the step; the balloon carries it up (scripted)
      else if (P.k === 'balloon') list.push({ kind: 'high', P, stop: colX(P.col) + 0.5 - SG, open: P.state === 'done' });
      else if (P.k === 'pop') list.push({ kind: 'block', P, stop: P.x - 0.45 - SG, open: P.sunk >= P.n && !P.anim });
      else if (P.k === 'plank') list.push({ kind: 'hole', P, stop: colX(P.col) + 0.38 - SG, open: P.state === 'down' });
      else if (P.k === 'door') list.push({ kind: 'door', P, stop: P.x - 0.15 - SG, open: P.state === 'open' });
      else if (P.k === 'lift') {
        const L = colX(P.col) - 0.5, near = this.cols[P.col - 1].h, far = this.farH(P.col);
        const atNear = !P.moving && Math.abs(this.cols[P.col].h - near) < 0.01, atFar = !P.moving && Math.abs(this.cols[P.col].h - far) < 0.01;
        list.push({ kind: this.cols[P.col].h < near ? 'down' : 'high', P, stop: L - SG, open: atNear || (this.hog && this.hog.x > L) });
        list.push({ kind: far < near ? 'down' : 'high', P, stop: colX(P.col), open: atFar, ride: true });
      } else if (P.k === 'seesaw') {
        const left = this.seeEnd(P, -1);
        list.push({ kind: 'high', P, stop: colX(P.col) - 0.5 - SG, open: Math.abs(left.y - topY(this.cols[P.col - 1].h)) < 0.05 || (this.hog && this.hog.x > colX(P.col) - 0.5) });
      } else if (BOXY.has(P.k) && P.obj) {
        if (!settled(P)) list.push({ kind: 'block', P, stop: this.pieceLeft(P) - SG, open: false, dyn: true });
      } else if (P.k === 'ramp' && P.obj) {
        if (!settled(P)) list.push({ kind: 'high', P, stop: this.pieceLeft(P) - SG, open: false, dyn: true });
      }
    }
    // holes (runs of hole columns that a box, cart or up-block fills)
    for (let ci = 1; ci <= 10; ci++) {
      const c = this.cols[ci];
      if (c.kind !== 'hole' || (ci > 1 && this.cols[ci - 1].kind === 'hole')) continue;
      if (this.pieces.some((P) => P.k === 'plank' && P.col === ci - 1)) continue;   // the bridge's gap: its plank is the gate
      const run = [ci];
      while (run[run.length - 1] + 1 <= 10 && this.cols[run[run.length - 1] + 1].kind === 'hole') run.push(run[run.length - 1] + 1);
      if (this.pieces.some((P) => P.k === 'jelly' && run.includes(P.col))) continue;   // a jelly pit: the jelly is the gate
      list.push({ kind: c.water ? 'water' : 'hole', cols: run, stop: colX(ci) - 0.5 - SG, open: run.every((k) => this.filled(k)) });
    }
    // the lip of the chute: a held breath before the plop
    // (no stop at the chute's lip any more: once the way is clear it rolls straight home, rule 0)
    list.sort((a, b) => a.stop - b.stop);
    return list;
  }
  farH(ci) { const n = this.cols[ci + 1]; return n ? (n.kind === 'slope' ? n.h + 1 : n.h) : 0; }
  filled(ci) {
    return this.pieces.some((P) => (P.k === 'up' && P.col === ci && P.state === 'up')
      || (FILL.has(P.k) && P.state === 'settled' && P.inCol === ci));
  }
  seeEnd(P, s) {
    const c = this.cols[P.pc], py = c.g.position.y + 1.305, a = P.obj.rotation.z;
    return { x: P.x + s * 1.5 * Math.cos(a), y: py + s * 1.5 * Math.sin(a) };
  }
  nextGate() {
    const H = this.hog;
    if (!H) return null;
    for (const g of this.gates()) if (g.stop > H.x - 0.03 && !g.open) return g;
    return null;
  }
  // the piece that opens a gate (for the hint, the look, the demo and autoplay)
  helperFor(g) {
    if (!g) return null;
    if (g.kind === 'lip') return null;
    const P = g.P;
    if (P && (P.k === 'pop' || P.k === 'plank' || P.k === 'cookie' || P.k === 'jelly' || P.k === 'balloon')) return P;
    if (P && (P.k === 'door' || P.k === 'lift')) return P.btn ? { k: 'button', P, obj: P.btn.g, btn: P.btn } : null;
    if (P && P.k === 'seesaw') return this.pieces.find((q) => q.onSee && q.state !== 'settled') || null;
    if (P && P.k === 'cart') {
      const hold = this.pieces.find((q) => q.spec.holds);
      if (hold && hold.k === 'pop' && hold.sunk < hold.n) return hold;
      if (hold && hold.k === 'door' && hold.state === 'idle') return { k: 'button', P: hold, obj: hold.btn.g, btn: hold.btn };
      return null;   // it is rolling by itself: wait
    }
    if (P && (P.k === 'box' || P.k === 'ramp' || P.k === 'crate' || P.k === 'stone')) return this.blockedByDoor(P) || P;
    if (g.cols) {
      const up = this.pieces.find((q) => q.k === 'up' && g.cols.includes(q.col) && q.state !== 'up');
      if (up) return up;
      const st = this.pieces.find((q) => q.k === 'stone' && q.state === 'free' && g.cols.includes(q.goal));
      if (st) return st;
      const fill = this.pieces.find((q) => FILL.has(q.k) && q.state !== 'settled' && g.cols.includes(q.goal));
      if (fill && fill.k === 'cart') return this.helperFor({ P: fill });
      if (fill) return this.blockedByDoor(fill) || fill;
    }
    return null;
  }
  blockedByDoor(P) {
    const x = P.obj.getWorldPosition(new T.Vector3()).x;
    for (const D of this.pieces) if (D.k === 'door' && D.state === 'idle' && (D.x - x) * (D.x - P.goalX) < 0) return { k: 'button', P: D, obj: D.btn.g, btn: D.btn };
    return null;
  }
  // autoplay hook: { kind: 'tap' | 'drag', obj, toX }
  nextPiece() {
    if (this.choosing) { const pk = this.peekers[1] || this.peekers[0]; if (pk && pk.tap.enabled) return { kind: 'baby', obj: pk.h, pk }; return null; }
    const B = this.pieces.find((q) => q.k === 'balloon' && q.hover);
    if (B && !B.anim) return { kind: 'tap', obj: B.obj, P: B };
    if (!this.hog || this.hog.state !== 'stop') return null;
    const g = this.nextGate();
    const h = this.helperFor(g);
    if (!h) return null;
    if (h.k === 'button') return { kind: 'tap', obj: h.obj, btn: h.btn, P: h.P };
    if (PUSH.has(h.k)) return { kind: 'drag', obj: h.obj, toX: h.goalX, P: h };
    return { kind: 'tap', obj: h.obj, P: h };
  }
  doPiece(p) {
    if (!p) return;
    if (p.kind === 'baby') { this.choose(p.pk); return; }
    if (p.btn) this.pressButton(p.btn);
    else if (p.kind === 'tap') this.tapPiece(p.P);
    else this.autoPush(p.P, p.toX);
  }

  // ================================================================ child actions
  note(progress = true) {
    if (progress && this.stepI < this.stepEnd) { sfx.step(this.stepI, this.N); this.stepI++; return; }
    rollSound.click();
  }
  async tapPiece(P) {
    if (this.dead || !P || P.anim) return;
    this.acted(P);
    if (P.k === 'pop') {
      if (P.sunk >= P.n) { input.press(P.obj, 120); return; }
      P.anim = true;
      await this.beat(null, 0.15, { hush: false });
      this.note(true);
      const y0 = P.obj.position.y, y1 = -(P.sunk + 1);
      await this.s.anim(0.4, (e) => { P.obj.position.y = y0 + (y1 - y0) * e; }, Ease.inOut);
      P.sunk++;
      P.anim = false;
      if (P.tap && P.sunk < P.n) { P.tap.offset.y = P.sunk + (P.n - P.sunk) * 0.5; P.tap.radius = 0.62 + (P.n - P.sunk - 1) * 0.4; }
      if (P.sunk < P.n) this.say(INSTR.again, { voice: true });
      else this.lookBack();
    } else if (P.k === 'up') {
      if (P.state === 'up') { input.press(P.obj, 120); return; }
      P.anim = true;
      await this.beat(null, 0.15, { hush: false });
      this.note(true);
      const y0 = P.obj.position.y, y1 = P.full - 1.0;
      await this.s.anim(0.6, (e) => { P.obj.position.y = y0 + (y1 - y0) * e; }, Ease.inOut);
      P.state = 'up';
      P.anim = false;
    } else if (P.k === 'cookie') return this.eatCookie(P);
    else if (P.k === 'jelly') return this.bounceJelly(P);
    else if (P.k === 'balloon') return this.tapBalloon(P);
    else if (P.k === 'plank') {
      if (P.state !== 'idle') return;
      P.anim = true;
      P.state = 'falling';
      // held breath: it leans a little, then falls flat across the gap (slow start, fast end) and lies there
      const vis = P.obj.userData.vis;
      await this.s.anim(0.25, (e) => { P.a = Math.PI / 2 - 0.035 * e; vis.rotation.z = P.a; }, Ease.out);
      const a0 = P.a;
      await this.s.anim(0.7, (_, t) => { P.a = a0 * (1 - t * t); vis.rotation.z = P.a; });
      P.a = 0; vis.rotation.z = 0;
      this.note(true);
      await this.s.anim(0.22, (_, t) => { P.a = Math.sin(t * Math.PI) * 0.03; vis.rotation.z = P.a; });
      P.a = 0; vis.rotation.z = 0;
      P.state = 'down';
      P.anim = false;
      this.lookBack();
    }
  }
  // ---- the cookie wall: the hoglet nibbles it away, three cookies, top first; crumbs fall; Mummy says "Yum!"
  async eatCookie(P) {
    const H = this.hog;
    if (P.anim || P.bites >= 3) return;
    const near = H && H.state === 'stop' && P.x - H.x < 1.3 && P.x > H.x;
    if (!near) { input.press(P.obj, 120); this.wobble(P.obj.userData.vis, 0.05); return; }   // it waits for the hoglet
    P.anim = true;
    this.note(true);
    const cs = P.obj.userData.cookies, u = H.u;
    if (u.face) setFace(u.face, 'joy');
    const k = 2 - P.bites, ck = cs[k];
    // lean in and bite: the cookie shows a bite, crumbs fall, then the rest is gobbled
    await this.s.anim(0.22, (e) => { u.lean.position.x = 0.12 * e; u.lean.rotation.z = -0.12 * e; }, Ease.out);
    if (ck.userData.whole) ck.userData.whole.visible = false;
    if (ck.userData.bit) ck.userData.bit.visible = true;
    rollSound.nibble();
    this.crumbs(ck.getWorldPosition(new T.Vector3()).add(V3(-0.4, 0.15, 0.3)), 4);
    await this.s.anim(0.2, (e) => { u.lean.position.x = 0.12 * (1 - e); u.lean.rotation.z = -0.12 * (1 - e); }, Ease.inOut);
    await this.wait(0.15);
    await this.s.anim(0.22, (e) => { u.lean.position.x = 0.12 * e; }, Ease.out);
    this.crumbs(ck.getWorldPosition(new T.Vector3()).add(V3(-0.3, 0.1, 0.3)), 3);
    const s0 = ck.scale.x;
    await this.s.anim(0.22, (e) => { const k2 = Math.max(0.001, s0 * (1 - e)); ck.scale.set(k2, k2, k2); u.lean.position.x = 0.12 * (1 - e); }, Ease.in);
    if (this.dead) return;
    ck.visible = false;
    u.lean.position.x = 0; u.lean.rotation.z = 0;
    P.bites++;
    P.anim = false;
    if (P.bites < 3) {
      if (u.face) setFace(u.face, 'happy');
      return;   // the next cookie waits for her next tap (the ladder helps if she stops)
    }
    physics.removeKinematic(P.obj);
    const mf = this.mum?.userData.face;
    if (mf) { setFace(mf, 'joy'); this.s.wait(1.2).then(() => setFace(mf, 'happy')); }
    this.sayLine('Yum!');
    if (u.face) this.s.wait(0.6).then(() => setFace(u.face, 'happy'));
  }
  crumbs(at, n) {
    for (let i = 0; i < n; i++) {
      const c = makeCrumb();
      if (!c) return;
      this.stage.add(c);
      const p0 = at.clone().add(V3((Math.random() - 0.5) * 0.3, Math.random() * 0.1, (Math.random() - 0.5) * 0.2));
      const floorY = this.colTopAt(this.colIndex(p0.x), p0.x) + 0.035;
      const vx = (Math.random() - 0.5) * 0.8;
      c.position.copy(p0);
      c.rotation.set(Math.random() * 3, Math.random() * 3, 0);
      const t1 = Math.sqrt(Math.max(0.01, 2 * (p0.y - floorY) / G));
      this.s.anim(t1, (_, t) => { const tt = t * t1; c.position.set(p0.x + vx * tt, Math.max(floorY, p0.y - 0.5 * G * tt * tt), p0.z); })
        .then(() => this.wait(1.2)).then(() => this.fadeAway(c, 0.5)).then(() => { if (c.parent) c.parent.remove(c); });
    }
  }
  wobble(vis, amt = 0.08) {
    if (!vis) return;
    this.s.anim(0.5, (_, t) => { const k = Math.sin(t * Math.PI * 3) * amt * (1 - t); vis.scale.set(1 + k, 1 - k, 1 + k); }).then(() => vis.scale.set(1, 1, 1));
  }
  // ---- the jelly: tapped with the hoglet on it, it squashes and bounces the hoglet up onto the high column
  async bounceJelly(P) {
    const H = this.hog, vis = P.obj.userData.vis;
    const on = H && H.state === 'stop' && Math.abs(H.x - P.x) < 0.1;
    if (P.anim || P.launched) return;
    if (!on) { rollSound.squish(); P.wobV -= 1.2; return; }        // a happy wobble, it waits for the hoglet
    P.anim = true;
    this.note(true);
    // held breath: the jelly squashes down under the hoglet
    await this.s.anim(0.35, (e) => { vis.scale.set(1 + 0.12 * e, 1 - 0.3 * e, 1 + 0.12 * e); H.obj.position.y = H.y - 0.42 * 0.3 * e; }, Ease.out);
    rollSound.squish();
    P.launched = true;
    this.posWord('jump');
    P.wobV = 4;
    vis.scale.set(1, 1, 1);
    // up and over onto the next column: one smooth arc (a real parabola), clear of the column's corner
    const nx = colX(P.col + 1) + 0.05, ny = topY(this.trackH(P.col + 1)) + R;
    const x0 = H.x, y0 = H.y, apex = Math.max(y0, ny) + 0.45;
    const vy0 = Math.sqrt(2 * G * (apex - y0)), tUp = vy0 / G, tDn = Math.sqrt(2 * (apex - ny) / G), T_ = tUp + tDn;
    H.state = 'jump';
    rollSound.roll(0);
    await this.s.anim(T_, (_, t) => {
      const tt = t * T_;
      H.x = x0 + (nx - x0) * t;
      H.y = y0 + vy0 * tt - 0.5 * G * tt * tt;
      H.spin -= 0.05;
      H.u.ball.rotation.z = H.spin;
      H.obj.position.set(H.x, H.y, 0);
    });
    H.y = ny; H.obj.position.y = ny;
    H.squash = 0.6; H.ground = true; H.vy = 0; H.v = 0.3;
    rollSound.tok(0.6);
    H.state = 'roll';
    this.onGo();
    P.anim = false;
  }
  // ---- the balloon: tap, it floats over and ties onto the hoglet and lifts it up the step; tap, it pops softly
  async tapBalloon(P) {
    const H = this.hog, o = P.obj;
    if (P.anim || P.state === 'done') return;
    if (P.state === 'tied') {
      const at = H && H.state === 'stop' && Math.abs(H.x - (colX(P.col) + 0.5 - SG)) < 0.1;
      if (!at) { this.wobble(o.userData.vis, 0.06); return; }       // it bobs; it waits for the hoglet
      P.anim = true;
      this.note(true);
      // float over to the hoglet's head and tie on
      const wp = o.getWorldPosition(new T.Vector3());
      o.parent.remove(o); this.stage.add(o); o.position.copy(wp);
      const to = V3(H.x, H.y + R - 0.02, 0.0);
      const p0 = o.position.clone();
      await this.s.anim(0.8, (e) => { o.position.lerpVectors(p0, to, e); o.position.y += Math.sin(e * Math.PI) * 0.25; }, Ease.inOut);
      if (this.dead) return;
      P.state = 'carrying';
      H.state = 'float';
      rollSound.roll(0);
      this.posWord('balloon');
      if (H.u.face) setFace(H.u.face, 'joy');
      // up, gently, then across over the step, and it hovers there
      const hx = colX(P.col + 1) + 0.05, hy = topY(this.trackH(P.col + 1)) + R + 0.45;
      const s0 = V3(H.x, H.y, 0), s1 = V3(H.x, hy, 0), s2 = V3(hx, hy, 0);
      await this.s.anim(1.5, (e) => { H.obj.position.lerpVectors(s0, s1, e); o.position.set(H.obj.position.x, H.obj.position.y + R - 0.02, 0); }, Ease.inOut);
      await this.s.anim(1.1, (e) => { H.obj.position.lerpVectors(s1, s2, e); H.spin -= 0.012; H.u.ball.rotation.z = H.spin; o.position.set(H.obj.position.x, H.obj.position.y + R - 0.02, 0); }, Ease.inOut);
      H.x = hx; H.y = hy;
      P.hover = true;
      P.anim = false;
      this.waitGate = { kind: 'high', P, stop: H.x, open: false };
      this.idle = 0; this.ladder = 0; this.stuck = 0;
      this.busy = false;
      this.cueKey = 'burst';
      this.say(INSTR.burst, { voice: true });
      if (!this.taught.has('burst')) { this.taught.add('burst'); this.s.wait(0.4).then(() => this.demo(P)); }
    } else if (P.state === 'carrying' && P.hover) {
      P.anim = true;
      P.hover = false;
      this.note(true);
      // a soft puff: it squeezes, then shrinks away to nothing; the hoglet floats down onto the column
      rollSound.puff();
      const vis = o.userData.vis;
      await this.s.anim(0.12, (e) => { vis.scale.set(1 + 0.15 * e, 1 + 0.15 * e, 1 + 0.15 * e); });
      await this.s.anim(0.18, (e) => { const k = Math.max(0.001, 1.15 * (1 - e)); vis.scale.set(k, k, k); });
      o.visible = false;
      const y0 = H.obj.position.y, y1 = topY(this.trackH(P.col + 1)) + R;
      await this.s.anim(1.0, (e) => { H.obj.position.y = y0 + (y1 - y0) * e; }, Ease.inOut);
      H.y = y1; H.squash = 0.4; H.ground = true; H.v = 0.2; H.vy = 0;
      P.state = 'done';
      P.anim = false;
      H.state = 'roll';
      this.onGo();
    }
  }
  // a tap on the door: its own button presses (the dome sinks and the cable lights, so the link stays visible);
  // in "Which button?" the door only points at its green button (the colour choice stays hers)
  tapDoor(P) {
    if (!P.btn || P.state !== 'idle') return;
    if (P.btnCol === P.col) return this.pressButton(P.btn);
    this.acted(P);
    this.bob({ obj: P.btn.g });
    this.addHalo(P.btn.g, 0.5);
  }
  async pressButton(b) {
    if (this.dead || !b || b.busy) return;
    const P = b.P;
    this.acted(P);
    if (P.k === 'lift') return this.pressLift(b);
    if (b.down) { input.press(b.g, 100); return; }
    b.down = true;
    b.busy = true;
    const d = b.dome;
    this.s.anim(0.14, (e) => { d.position.z = -0.045 * e; }, Ease.out);
    if (P.k === 'button') {
      // the decoy: the snail's hatch opens (harmless); it stays open
      rollSound.click();
      const door = this.hatch?.userData.door;
      if (door) await this.s.anim(0.5, (e) => { door.rotation.y = -1.9 * e; }, Ease.inOut);
      if (this.snail) {
        const z0 = this.snail.position.z;
        await this.s.anim(0.45, (e) => { this.snail.position.z = z0 + (0.12 - z0) * e; }, Ease.out);
        wiggle(this.s, this.snail, 0.2, 0.6);
      }
      this.cur.wrong++;
      this.say(HINT.snail, { voice: !this.spoken.has(HINT.snail), max: 1.4 }).then(() => { if (!this.dead) this.sayInstr(INSTR.green); });
      this.spoken.add(HINT.snail);
      b.busy = false;
      return;
    }
    this.note(true);
    // the cable lights up from the button to the door, a held breath, then the door slides up into its hood
    const lits = (b.lits || []).map((c) => c.userData.lit);
    for (const l of lits) l.visible = true;
    await this.s.anim(0.3, (e) => { lits.forEach((l, i) => { const k = clamp(e * lits.length - i, 0, 1); l.scale.y = Math.max(0.0001, k * (l.parent.userData.len || 1)); }); });
    await this.beat(null, 0.35, { hush: false });
    P.state = 'opening';
    const leaf = P.leaf;
    await this.s.anim(0.7, (e) => { leaf.position.y = 0.98 * e; }, Ease.inOut);
    P.state = 'open';
    b.busy = false;
    this.lookBack();
    this.recue();
  }
  async pressLift(b) {
    const P = b.P, H = this.hog, c = this.cols[P.col];
    if (P.moving) { input.press(b.g, 100); return; }
    // never while the hoglet is rolling onto it or off it (it would be shoved): just the soft press
    const L = colX(P.col) - 0.5;
    const near = H && H.state === 'roll' && H.x > L - 0.6 && H.x < L + 1.6;
    const d = b.dome;
    this.s.anim(0.12, (e) => { d.position.z = -0.045 * e; }, Ease.out).then(() => this.s.anim(0.25, (e) => { d.position.z = -0.045 * (1 - e); }, Ease.inOut));
    if (near) { rollSound.click(); return; }
    const riding = H && H.state === 'stop' && Math.abs(H.x - colX(P.col)) < 0.06;
    this.note(riding);
    const to = Math.abs(c.h - P.a) < 0.01 ? P.b : P.a;
    P.moving = true;
    if (riding) this.posWord(to < c.h ? 'liftDown' : 'liftUp');
    await this.beat(null, 0.15, { hush: false });
    const y0 = c.g.position.y, y1 = topY(to);
    await this.s.anim(Math.max(1.0, Math.abs(y1 - y0) / 0.95), (e) => { c.g.position.y = y0 + (y1 - y0) * e; }, Ease.inOut);
    c.h = to;
    P.moving = false;
  }

  // ---- pushing (the finger's x drives the body's sideways speed)
  pickPush(P) {
    if (P.state !== 'free') return;
    this.acted(P);
    this.push = { P, fx: P.obj.position.x, moved: false, t0: performance.now() };
    rollSound.slide(false);
  }
  movePush(P) {
    if (!this.push || this.push.P !== P) return;
    this.push.fx = P.obj.position.x;   // input put the finger's x there; the physics puts the piece back each frame
    this.push.moved = true;
  }
  dropPush(P, info = {}) {
    const p = this.push;
    this.push = null;
    if (p && p.moved) this.actT = performance.now();   // (rule 0 is timed from the moment she lets go)
    rollSound.slide(false);
    if (!p || p.P !== P || P.state !== 'free') return;
    if (P.body && P.k !== 'cart') { const v = P.body.linvel(); P.body.setLinvel({ x: 0, y: v.y, z: 0 }, true); }
    if (info.tapped && !p.auto) {
      // a tap on a push piece: it leans toward where it goes; every second tap the hand shows the push again
      P.taps++;
      if (P.taps % 2 === 0) this.demo(P);
      else this.leanToward(P);
    }
  }
  leanToward(P) {
    const vis = P.obj.userData.vis;
    if (!vis || vis.userData.leaning) return;
    vis.userData.leaning = true;
    const s = Math.sign(P.goalX - P.obj.position.x) || 1, x0 = vis.position.x;
    rollSound.tok(0.6);
    this.s.anim(0.6, (_, t) => { vis.position.x = x0 + Math.sin(t * Math.PI) * 0.12 * s; vis.rotation.z = -Math.sin(t * Math.PI) * 0.06 * s; }).then(() => { vis.position.x = x0; vis.rotation.z = 0; vis.userData.leaning = false; });
  }
  // (autoplay hook only: the game itself never pushes for her)
  autoPush(P, toX) {
    if (!P || P.state !== 'free') return;
    this.acted(P);
    const x = P.obj.position.x;
    this.push = { P, fx: x, auto: true, toX: clamp(toX, Math.min(x, toX), Math.max(x, toX)), speed: 1.0 };
  }
  // the rail stops for a pushed piece: its own range (start to goal, plus one flat column the other way) and never
  // closer than 0.15 to the hoglet; a ramp waits at the edge of an open hole
  limits(P) {
    if (!P.range) {
      const s = P.col, g = P.goal, dir = Math.sign(g - s) || 1;
      let lo = Math.min(s, g), hi = Math.max(s, g);
      const back = s - dir, bc = this.cols[back];
      if (!P.onSee && bc && back >= 2 && back <= 10 && bc.kind === 'flat' && bc.h === this.cols[s].h && !this.pieces.some((q) => q !== P && q.col === back && q.k !== 'button')) { if (dir > 0) lo = back; else hi = back; }
      P.range = [colX(lo), colX(hi)];
      if (P.onSee) P.range[0] = P.obj.position.x - 0.02;
      if (P.k === 'cart') P.range = [P.obj.position.x - 0.02, colX(g)];
    }
    let [lo, hi] = P.range;
    const H = this.hog;
    if (H && H.state !== 'home') {
      if (H.x < P.obj.position.x) lo = Math.max(lo, H.x + R + 0.15 + P.half);
      else hi = Math.min(hi, H.x - R - 0.15 - P.half);
    }
    if (P.k === 'ramp') {
      for (let ci = 1; ci <= 10; ci++) if (this.cols[ci].kind === 'hole' && !this.filled(ci) && colX(ci) > P.obj.position.x) { hi = Math.min(hi, colX(ci) - 0.5 - P.half + 0.035); P.holeStop = ci; break; }
    }
    return [lo, hi];
  }
  updatePush(dt) {
    for (const P of this.pieces) {
      if (!P.body || P.state !== 'free') continue;
      const b = P.body, o = P.obj;
      const v = b.linvel();
      const x = o.position.x;
      const [lo, hi] = this.limits(P);
      const pushed = this.push && this.push.P === P;
      let vx = v.x;
      if (pushed) {
        const p = this.push;
        if (p.auto) { p.fx += Math.sign(p.toX - p.fx) * Math.min(Math.abs(p.toX - p.fx), p.speed * dt); }
        vx = clamp((p.fx - x) * 8, -2.5, 2.5);
        // the rail stops: ease into them, and a soft bump when the finger keeps going
        if (vx > 0) vx = Math.min(vx, Math.max(0, (hi - x) * 8));
        if (vx < 0) vx = Math.max(vx, Math.min(0, (lo - x) * 8));
        const atStop = (p.fx > hi + 0.25 && x > hi - 0.02) || (p.fx < lo - 0.25 && x < lo + 0.02);
        if (atStop && !p.bumped) {
          p.bumped = true;
          const coming = P.holeStop && this.pieces.some((q) => FILL.has(q.k) && q.state === 'free' && Math.abs(q.obj.position.x - colX(P.holeStop)) < 0.6);
          if (coming) { /* the box is dropping in right now: no "no" */ } else if (P.k === 'ramp' && P.holeStop && p.fx > hi) { this.sayNo(o.userData.vis); this.say(HINT.fill, { voice: !this.spoken.has(HINT.fill) }); this.spoken.add(HINT.fill); }
          else this.sayNo(o.userData.vis);
        }
        if (!atStop) p.bumped = false;
        if (p.auto && Math.abs(p.toX - x) < 0.03 && Math.abs(p.fx - p.toX) < 0.001) { this.push = null; this.actT = performance.now(); }
        // a helping hand that gets nowhere (pushed against a shut door) lets go after a moment
        if (p.auto) { if (Math.abs(x - (p.lastX ?? x)) > 0.01) { p.lastX = x; p.stall = 0; } else { p.lastX = x; p.stall = (p.stall || 0) + dt; if (p.stall > 1.5) this.push = null; } }
        rollSound.slide(Math.abs(v.x) > 0.15 && Math.abs(v.y) < 0.5);
      } else if (P.k !== 'cart') vx = v.x;
      else {
        vx = clamp(vx, -2.0, 2.0);
        if (x > hi && vx > 0) vx = 0;
      }
      b.setLinvel({ x: vx, y: v.y, z: 0 }, true);
      // a pushed cart / see-saw box turns with the ground under it, but is flat (and locked flat) on level ground
      if (P.rotFree) {
        const a = new T.Euler().setFromQuaternion(o.quaternion).z;
        const over = this.colAt(x);
        const onSlope = over && over.kind === 'slope';
        const onSee = this.seesaw && x < this.seesaw.x + 1.45 && x > this.seesaw.x - 1.5 && P.onSee;
        if (!onSlope && !onSee) {
          if (Math.abs(a) < 0.012) { b.setAngvel({ x: 0, y: 0, z: 0 }, true); b.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true); b.lockRotations(true, true); P.rotFree = false; }
          else b.setAngvel({ x: 0, y: 0, z: -a * 10 }, true);
        }
      }
      if (P.k === 'cart') {
        for (const w of o.userData.wheels || []) w.rotation.z -= (vx * dt) / 0.11;
        if (!P.rolled && Math.abs(vx) > 0.3) { P.rolled = true; this.posWord('wheels'); }
      }
      // over water: a crate floats (a bridge), a stone sinks
      if ((P.k === 'crate' || P.k === 'stone') && !P.rotFree) {
        const hc = this.colIndex(x), hcol = this.cols[hc];
        if (hcol && hcol.water && Math.abs(x - colX(hc)) < 0.14 && !this.filled(hc)) { this.intoWater(P, hc); continue; }
      }
      // over an open hole: it drops in now (centred, so it can never catch on a corner)
      if (P.k !== 'ramp') {
        const hc = this.colIndex(x), hcol = this.cols[hc];
        if (hcol && hcol.kind === 'hole' && !this.filled(hc) && Math.abs(x - colX(hc)) < 0.12 && o.position.y > hcol.g.position.y + 0.05 && !P.rotFree) {
          b.setTranslation({ x: x + (colX(hc) - x) * 0.5, y: o.position.y, z: 0 }, true);
          b.setLinvel({ x: 0, y: Math.min(v.y, -0.6), z: 0 }, true);
        }
      }
      // settled: at rest in a hole, or a ramp against its step
      const still = Math.hypot(v.x, v.y) < 0.05 && !pushed;
      P.stillT = still ? (P.stillT || 0) + dt : 0;
      if (P.k === 'ramp' && Math.abs(x - P.goalX) < 0.06 && Math.abs(v.y) < 0.2) this.lockRamp(P);
      else if (P.k !== 'ramp') {
        const ci = this.colIndex(x);
        const c = this.cols[ci];
        if (c && c.kind === 'hole' && Math.abs(x - colX(ci)) < 0.08 && o.position.y < topY(this.holeRim(ci)) - 0.3) {
          if (Math.abs(o.position.y - c.g.position.y) < 0.03 && Math.hypot(v.x, v.y) < 0.08) this.settle(P, ci);
          else if (P.stillT > 1) { console.warn('ROLL: box wedged, easing down'); b.setTranslation({ x: colX(ci), y: c.g.position.y + 0.002, z: 0 }, true); }
        }
      }
    }
  }
  // a crate drops into the water with a splash, dips and bobs up until its top is flush with the track (a bridge);
  // a stone drops in and sinks slowly to the bottom (it stays there)
  intoWater(P, ci) {
    const c = this.cols[ci], o = P.obj;
    P.state = P.k === 'crate' ? 'settled' : 'sinking';
    P.inCol = ci;
    if (this.push && this.push.P === P) { this.push = null; this.actT = performance.now(); }
    rollSound.slide(false);
    physics.remove(o);
    P.body = null;
    if (P.drag) { input.remove(P.drag); P.drag = null; }
    o.rotation.set(0, 0, 0);
    const x0 = o.position.x, y0 = o.position.y, wy = c.g.position.y + c.waterY;
    rollSound.splash(P.k === 'crate' ? 1 : 0.8);
    this.note(true);
    if (P.k === 'crate') {
      // rest: top flush with the track (bottom 0.8 under it)
      const rest = wy + 0.35 - 0.8;
      this.sayLine(POS.floats);
      if (P.k === 'crate') { const b = physics.box(V3(colX(ci), rest + 0.4, 0), V3(1.0, 0.8, 1.4)); if (b) this.statics.push(b); }
      return this.s.anim(1.4, (_, t) => {
        o.position.x = x0 + (colX(ci) - x0) * Math.min(1, t * 4);
        const dip = t < 0.25 ? (t / 0.25) : 1;
        const fall = y0 + (rest - 0.12 - y0) * (1 - (1 - dip) ** 2);
        o.position.y = t < 0.25 ? fall : rest - 0.12 * Math.cos((t - 0.25) / 0.75 * Math.PI * 1.5) * (1 - (t - 0.25) / 0.75);
      }).then(() => { o.position.set(colX(ci), rest, 0); this.reparent(o, c); P.bob = true; this.lookBack(); });
    }
    this.sayLine(POS.sinks);
    const bottom = c.g.position.y + 0.01;
    return this.s.anim(1.8, (e) => { o.position.x = x0 + (colX(ci) - x0) * Math.min(1, e * 3); o.position.y = y0 + (bottom - y0) * e; }, Ease.inOut)
      .then(() => { o.position.set(colX(ci), bottom, 0); this.reparent(o, c); P.state = 'sunk'; this.recue(); });
  }
  holeRim(ci) { let i = ci; while (i > 1 && this.cols[i - 1].kind === 'hole') i--; return this.cols[i - 1].h; }
  colIndex(x) { return clamp(Math.round(x + 5.5), 0, 10); }
  colAt(x) { return this.cols[this.colIndex(x)]; }
  lockRamp(P) {
    P.state = 'locked';
    if (this.push && this.push.P === P) { this.push = null; this.actT = performance.now(); }   // (her push is done here)
    rollSound.slide(false);
    physics.remove(P.obj);
    P.body = null;
    if (P.drag) { input.remove(P.drag); P.drag = null; }   // (ends a finger that is still down on it)
    const c = this.cols[P.goal], o = P.obj, x0 = o.position.x, y0 = o.position.y, y1 = c.g.position.y;
    this.note(true);
    this.s.anim(0.1, (e) => { o.position.x = x0 + (P.goalX - x0) * e; o.position.y = y0 + (y1 - y0) * e; }).then(() => {
      o.position.set(P.goalX, y1, 0); o.rotation.set(0, 0, 0);
      this.reparent(o, c);
    });
    this.lookBack();
  }
  settle(P, ci) {
    P.state = 'settled';
    P.inCol = ci;
    if (this.push && this.push.P === P) { this.push = null; this.actT = performance.now(); }
    rollSound.slide(false);
    physics.remove(P.obj);
    P.body = null;
    if (P.drag) { input.remove(P.drag); P.drag = null; }   // (ends a finger that is still down on it)
    const c = this.cols[ci], o = P.obj, x0 = o.position.x, y0 = o.position.y, y1 = c.g.position.y;
    o.rotation.set(0, 0, 0);
    this.note(true);
    this.posWord('in');
    const yv = y1 + 0.015;   // seated a hair proud: no sliver of the fence through the gap along its top
    this.s.anim(0.1, (e) => { o.position.x = x0 + (colX(ci) - x0) * e; o.position.y = y0 + (yv - y0) * e; }).then(() => {
      o.position.set(colX(ci), yv, 0);
      this.reparent(o, c);
    });
    // others ride over it now
    const b = physics.box(V3(colX(ci), y1 + 0.4, 0), V3(1.0, 0.8, 1.4));
    if (b) this.statics.push(b);
    this.lookBack();
  }
  reparent(o, c) {
    const wp = o.getWorldPosition(new T.Vector3());
    o.parent.remove(o);
    c.g.add(o);
    c.g.updateMatrixWorld(true);
    o.position.copy(c.g.worldToLocal(wp));
    c.att.push(o);
  }

  // ================================================================ every frame
  update(dt, t) {
    if (this.dead) return;
    const H = this.hog;
    // kinematic bodies follow their objects
    for (const P of this.pieces) {
      if (P.k === 'pop' || P.k === 'up') physics.moveKinematic(P.obj);
      else if (P.k === 'door') physics.moveKinematic(P.leaf);
      else if (P.k === 'seesaw') physics.moveKinematic(P.obj);
    }
    this.updatePush(dt);
    this.updateSeesaw(dt);
    for (const P of this.pieces) {
      if (P.k === 'jelly' && !P.anim) {
        P.wobV += (-90 * P.wob - 5 * P.wobV) * Math.min(dt, 0.05);
        P.wob += P.wobV * Math.min(dt, 0.05);
        const k = clamp(P.wob, -0.25, 0.25), vis = P.obj.userData.vis;
        vis.scale.set(1 - k * 0.4, 1 + k, 1 - k * 0.4);
      }
      if (P.bob && P.obj) { const vis = P.obj.userData.vis; if (vis) vis.position.y = Math.sin(t * 1.8 + P.col) * 0.012; }
      if (P.k === 'balloon' && P.state === 'tied' && P.obj) { const vis = P.obj.userData.vis; vis.rotation.z = Math.sin(t * 1.1) * 0.05; }
    }
    if (H) this.updateHog(dt, t);
    this.updateMum(dt, t);
    this.updateNest(dt, t);
    this.updateCamera(dt);
  }

  updateSeesaw(dt) {
    const P = this.seesaw;
    if (!P || !this.pieces.includes(P)) return;
    const H = this.hog;
    const onRight = (H && H.state !== 'home' && H.x > P.x + 0.02 && H.x < P.x + 1.6 && H.y > this.cols[P.pc].g.position.y + 1.0);
    const box = this.pieces.find((q) => q.onSee && q.state === 'free' && q.obj.position.x > P.x - 0.2 && q.obj.position.x < P.x + 2.05);
    const want = onRight || box ? SEE_TIP : SEE_WAIT;
    const a = P.obj.rotation.z;
    if (Math.abs(want - a) > 0.0005) {
      const sp = want < a ? 1.0 : 0.55;           // tips with the weight; drifts back slowly
      const na = a + clamp(want - a, -sp * dt, sp * dt);
      P.obj.rotation.z = na;
      if (Math.abs(want - na) < 0.0005 && want === SEE_WAIT && P.wasTip) { rollSound.tok(0.9); P.wasTip = false; }
      if (want === SEE_TIP) P.wasTip = true;
      if (onRight && !P.saidTip) { P.saidTip = true; this.posWord('seesaw'); }
    }
  }

  // the hoglet: a ball rolling on the outline; the drive wants home, braking for the first closed gate
  updateHog(dt, t) {
    const H = this.hog, o = H.obj, u = H.u;
    if (H.state === 'home' || H.state === 'nest' || H.state === 'wait' || H.state === 'jump' || H.state === 'float') { if (H.state !== 'wait') this.poseHog(H, dt, t); return; }
    const polys = this.polys();
    const gate = (H.state === 'roll' || H.state === 'stop') ? this.nextGate() : null;
    // the target: the log's mouth first, then the gate
    let stopX = Infinity;
    if (H.state === 'out') stopX = H.target;
    else if (gate) stopX = gate.stop;
    if (H.state === 'stop' || H.state === 'roll') this.checkStop(H, gate);
    const holding = H.state === 'stop' || H.state === 'peek' || H.hold > 0 || (this.push && H.state === 'stop');
    const N = 3, h = Math.min(dt, 0.05) / N;
    const fo = {};
    let moved = 0, lastSlope = 0;
    for (let k = 0; k < N; k++) {
      if (H.ground) {
        floorAt(polys, H.x, H.y, fo);
        const slope = fo.y > -Infinity ? fo.slope : 0;
        lastSlope = slope;
        // gravity along the slope, then the drive (or the brake) toward the wanted speed
        // gravity speeds it up downhill; uphill the drive ("it wants to go home") all but cancels it
        const ag = -G * slope / (1 + slope * slope);
        let v = H.v + (slope > 0 ? ag * 0.1 : ag) * h;
        const k2 = Math.sqrt(1 + slope * slope);
        const homeward = !gate && H.state === 'roll';
        // the way home is clear: the buttons tuck back into their sockets now (one step less when the table re-forms)
        if (homeward && !this.tuckP && this.buttons && this.buttons.length) this.tuckP = Promise.all([this.popButtons(false), this.hatch ? this.closeHatch() : null]);
        let want = (slope < -0.05 ? (homeward ? V_HOME_MAX : V_MAX) : (homeward ? V_HOME : V_FLAT)) / k2;
        const d = stopX - H.x;
        want = Math.min(want, V_FLAT * Math.sqrt(Math.max(0, d) / 0.6));
        if (holding || (H.state !== 'roll' && H.state !== 'out')) want = 0;
        if (v < want) v = Math.min(want, v + (homeward ? 5.5 : 3.0) * h);
        else v = Math.max(want, v - 8.0 * h);
        if (Math.abs(v) < 0.02 && want === 0) v = 0;
        v = Math.max(0, v);
        let nx = H.x + v * h;
        if (nx > stopX) { nx = Math.max(H.x, stopX); v = 0; }
        floorAt(polys, nx, H.y, fo);
        if (fo.wall || fo.y === -Infinity || depth(polys, nx, Math.max(fo.y, H.y - 0.5)) > Math.max(0.01, depth(polys, H.x, H.y) + 0.0005)) { H.v = 0; continue; }
        const yFree = H.y + H.vy * h - 0.5 * G * h * h;
        if (fo.y < yFree - 0.004) {
          H.ground = false;
          moved += nx - H.x;
          H.x = nx; H.vy = H.vy - G * h; H.y = yFree; H.v = v;
        } else {
          H.vy = (fo.y - H.y) / h;
          moved += Math.hypot(nx - H.x, fo.y - H.y) * Math.sign(nx - H.x || 1);
          H.x = nx; H.y = fo.y; H.v = v;
          if (H.x > CHUTE_X + 0.1) { this.leaveTable(H); return; }
        }
      } else {
        H.vy -= G * h;
        let nx = H.x + H.v * h;
        const ny = H.y + H.vy * h;
        if (nx > stopX) { nx = Math.max(H.x, stopX); H.v = 0; }
        floorAt(polys, nx, H.y, fo);
        let x2 = nx;
        if (fo.wall || depth(polys, nx, ny) > Math.max(0.01, depth(polys, H.x, H.y) + 0.0005)) { x2 = H.x; H.v = 0; floorAt(polys, x2, H.y, fo); }
        if (fo.y > -Infinity && ny <= fo.y) {
          const hit = -H.vy;
          H.y = fo.y; H.x = x2; H.ground = true; H.vy = 0;
          if (hit > 2.4) { rollSound.tok(Math.min(1, hit / 6)); H.squash = Math.min(1, hit / 6); }
          const J = this.pieces.find((q) => q.k === 'jelly' && Math.abs(q.x - x2) < 0.5);
          if (J && hit > 1) { J.wobV -= hit * 0.35; rollSound.squish(); }
          if (x2 > CHUTE_X + 0.1) { this.leaveTable(H); return; }
        } else { moved += x2 - H.x; H.x = x2; H.y = ny; }
      }
    }
    if (H.state === 'roll' && H.x > CHUTE_X + 0.1) { this.leaveTable(H); return; }
    // the last place it rolled fine (for the watchdog)
    if (H.ground && H.state === 'roll' && Math.abs(H.v) > 0.2 && H.y > -1) H.good = { x: H.x, y: H.y };
    // spin, lean, sound
    H.spin -= moved / R;
    u.ball.rotation.z = H.spin;
    o.position.set(H.x, H.y, 0);
    const sp = Math.abs(H.v);
    rollSound.roll(H.state === 'roll' || H.state === 'out' ? sp : 0);
    this.poseHog(H, dt, t);
    // a ramp, the bridge, a door: the position word as it happens
    if (H.state === 'roll') this.watchWords(H, lastSlope);
    // watchdog: stuck while the way ahead is open (should never happen)
    if (H.state === 'roll' && sp < 0.02 && (!gate || stopX - H.x > 0.08)) {
      H.stuckT = (H.stuckT || 0) + dt;
      if (H.stuckT > 5) {
        console.warn('ROLL WATCHDOG', this.round, H.x.toFixed(2));
        H.stuckT = 0;
        if (H.good) { const a = V3(H.x, H.y, 0), b = V3(H.good.x, H.good.y, 0); H.state = 'jump'; this.moveHog(H, [a, b], 1.0).then(() => { H.x = b.x; H.y = b.y; H.v = 0; H.vy = 0; H.ground = true; H.state = 'roll'; }); }
      }
    } else H.stuckT = 0;
    if (H.state === 'out' && H.x >= H.target - 0.01) { H.state = 'peek'; H.v = 0; }
  }
  // stopped at a closed gate (or rolling on once it opens)
  checkStop(H, gate) {
    const atStop = gate && gate.stop - H.x < 0.012 && Math.abs(H.v) < 0.03 && H.ground;
    if (H.state === 'roll' && atStop) {
      if (gate.kind === 'lip') { this.lip(H); return; }
      H.state = 'stop';
      H.v = 0;
      this.onStop(gate);
    } else if (H.state === 'stop' && (!gate || gate.stop - H.x > 0.25)) {
      if (this.push || input.dragging()) return;   // calm: nothing rolls while a finger is pushing
      H.state = 'roll';
      this.onGo();
    }
  }
  async lip(H) {
    H.state = 'lip';
    this.busy = true;
    this.camMode = 'home';
    await this.beat(null, 0.25, { hush: false });
    if (this.dead) return;
    H.lipDone = true;
    H.state = 'roll';
  }

  onStop(gate) {
    const H = this.hog;
    rollSound.roll(0);
    const helper = this.helperFor(gate);
    this.cur.stops++;
    const key = (gate.P ? 'p' + this.pieces.indexOf(gate.P) : 'h' + gate.cols) + gate.kind + (gate.ride ? 'r' : '');
    const fresh = this.lastGate !== key;
    this.lastGate = key;
    this.waitGate = gate;
    this.idle = 0; this.ladder = 0; this.errorlessOn = false; this.stuck = 0;
    // a short "oh!" for a hole or a big drop, otherwise calm; it looks at the thing that helps
    if (H.u.face) setFace(H.u.face, gate.kind === 'hole' || gate.kind === 'down' ? 'scared' : 'calm');
    this.s.wait(0.55).then(() => { if (H.state === 'stop' && H.u.face && H.u.face.userData.emotion === 'scared') setFace(H.u.face, 'calm'); });
    H.look = helper ? helper.obj : null;
    H.lookT = 0;
    if (!helper) return;           // e.g. the cart is rolling: wait for it
    this.busy = false;
    const tk = this.teachKey(helper);
    this.cueKey = tk;
    // the first time a kind of obstacle comes up in this level: "Uh-oh! ..." first, then (after it) the instruction
    let uh = null;
    const uk = this.uhKey(gate);
    if (fresh && !this.uhSaid.has(uk)) { this.uhSaid.add(uk); uh = this.sayLine(UH[uk] || UH.block, { max: 1.8 }); }
    const line = INSTR[tk];
    Promise.resolve(uh).then(() => { if (!this.dead && this.waitGate === gate && this.cueKey === tk && (H.state === 'stop' || H.state === 'float') && line) this.sayInstr(line); });
    // the first time a kind of piece comes up in this level: a slow hand demo (it starts while "Uh-oh!" plays)
    if (!this.taught.has(tk)) {
      this.taught.add(tk);
      this.s.wait(0.6).then(() => { if (!this.dead && H.state === 'stop') this.demo(helper); });
    }
  }
  uhKey(g) {
    const k = g.P && g.P.k;
    if (g.dyn && k === 'ramp') return 'step';
    if (g.dyn && (k === 'box' || k === 'crate' || k === 'stone')) return 'box';
    if (g.dyn && k === 'cart') return 'cart';
    return g.kind;
  }
  // the next step changed while the baby waits (a door opened, the stone sank): say and show the new one
  recue() {
    const H = this.hog;
    if (!H || H.state !== 'stop' || !this.waitGate) return;
    const h = this.helperFor(this.waitGate);
    if (!h) return;
    H.look = h.obj; H.lookT = 0;
    const tk = this.teachKey(h);
    if (tk === this.cueKey) return;
    this.cueKey = tk;
    this.clearHints();
    fx.clearHands();
    this.idle = 0; this.ladder = 0; this.errorlessOn = false;
    this.sayInstr(INSTR[tk]);
    if (!this.taught.has(tk)) { this.taught.add(tk); this.s.wait(0.4).then(() => { if (!this.dead && H.state === 'stop') this.demo(h); }); }
  }
  onGo() {
    const H = this.hog;
    this.busy = true;
    this.waitGate = null;
    this.clearHints();
    fx.clearHands();
    if (H.u.face) setFace(H.u.face, 'happy');
    H.look = null;
  }
  teachKey(h) {
    if (h.k === 'button') return h.P.k === 'lift' ? 'lift' : h.P.color === 'green' ? 'green' : 'red';
    if (h.k === 'pop' && h.spec.holds) return 'cart';
    if (h.k === 'ramp' && this.pieces.some((q) => q.k === 'box' && q.state !== 'settled' && q.goal > h.col && q.goal < h.goal)) return 'rampbox';
    if (h.k === 'balloon' && h.hover) return 'burst';
    return h.k;
  }
  acted(P) {
    this.actT = performance.now();
    if (this.choosing) this.choose(this.peekers[1] || this.peekers[0]);
    this.idle = 0; this.ladder = 0; this.stuck = 0;
    fx.clearHands();
    this.clearHints();
  }
  watchWords(H, slope) {
    if (this.posSaid) return;
    const ci = this.colIndex(H.x), c = this.cols[ci];
    if (c.kind === 'slope' && ci < 10 && this.cols[ci + 1].kind === 'slope' && H.x > colX(ci) - 0.3) this.posWord('down');
    for (const P of this.pieces) {
      if (P.k === 'ramp' && P.state === 'locked' && Math.abs(H.x - P.goalX) < 0.45) this.posWord('ramp');
      if (P.k === 'plank' && P.state === 'down' && H.x > colX(P.col) + 0.7 && H.x < colX(P.col) + 1.6) this.posWord('bridge');
      if (P.k === 'door' && P.state === 'open' && Math.abs(H.x - P.x) < 0.3) this.posWord('door');
    }
  }
  posWord(k) {
    if (this.posSaid) return;
    this.posSaid = true;
    this.sayLine(POS[k]);
  }
  // spoken the first time in a level, caption only after that
  sayLine(text, opts = {}) {
    if (!text) return;
    const voice = !this.spoken.has(text);
    this.spoken.add(text);
    return this.say(text, { ...opts, voice });
  }
  sayInstr(text) { return this.sayLine(text); }

  // the face: upright, leaning into the travel, squashing on landings; it looks at what helps, then at the child
  poseHog(H, dt, t) {
    const u = H.u;
    H.lean += (clamp(-H.v * 0.05, -0.1, 0.1) - H.lean) * Math.min(1, dt * 6);
    u.lean.rotation.z = H.lean;
    H.squash = Math.max(0, (H.squash || 0) - dt * 4);
    const sq = Math.sin(Math.min(1, H.squash) * Math.PI) * 0.06;
    H.obj.scale.set(1 + sq * 0.5, 1 - sq, 1);
    // the look: at the helping piece (0..1.6 s), at the child (1.6..3 s), back, every 4 s
    let yaw = 0, pitch = 0;
    if (H.look && H.state === 'stop') {
      H.lookT += dt;
      const ph = H.lookT % 4;
      if (ph < 1.8 || ph > 3.2) {
        const p = H.look.getWorldPosition(new T.Vector3());
        yaw = clamp((p.x - H.x) * 0.25, -0.32, 0.32);
        pitch = clamp(-(p.y - H.y) * 0.18, -0.22, 0.22);
      }
    }
    u.look.rotation.y += (yaw - u.look.rotation.y) * Math.min(1, dt * 5);
    u.look.rotation.x += (pitch - u.look.rotation.x) * Math.min(1, dt * 5);
  }
  lookBack() { const H = this.hog; if (H && H.u.face && H.state === 'stop') setFace(H.u.face, 'happy'); }

  // ================================================================ home
  // Off the end of the table and onto the chute: from here the baby slides home by itself, so the next puzzle
  // starts now (rule 0): the old table sinks and the new one rises while it slides down and lands, the camera
  // stays on the nest until Mummy has started counting, then glides back to the log
  leaveTable(H) {
    H.state = 'home';
    this.leaveT = performance.now();
    console.log('ROLL LEAVE r' + this.round + ' act->leave ' + (this.actT ? Math.round(this.leaveT - this.actT) : '-') + 'ms');
    const pts = [V3(H.x, H.y, 0)];
    for (const [x, y] of chutePts()) if (x > H.x + 0.05) pts.push(V3(x, y + R, 0));
    this.homeRun = this.moveHog(H, pts, Math.max(2.6, H.v || 0), false, (t) => t).then(() => { if (!this.dead) this.landHome(H); });
    if (this.round + 1 >= this.courses.length) return;   // the last baby: the finale waits for it to sit down
    this.camHold = true;
    this.sinkOld(this.courses[this.round + 1]);
    this.busy = false;
    const slot = this.slots[(this.homeHogs || []).length];
    this.success(V3(slot.pos.x, slot.pos.y + 0.5, slot.pos.z), '', { watch: true, payoff: this.wait(0.1), still: 0 });
  }
  landHome(H) {
    H.state = 'home';
    rollSound.roll(0);
    sfx.pup();
    H.squash = 0.8;
    if (H.u.face) setFace(H.u.face, 'joy');
    this.homeHogs = this.homeHogs || [];
    this.homeHogs.push(H);
    try { store.update((s) => { const c = s.rollHogs || (s.rollHogs = { count: 0, seen: [] }); c.count++; if (!c.seen.includes(H.v0)) c.seen.push(H.v0); }); } catch (e) { /* storage off */ }
    const slot = this.slots[this.homeHogs.length - 1];
    this.landT = performance.now();
    console.log('ROLL LAND r' + this.round + ' act->land ' + (this.actT ? Math.round(this.landT - this.actT) : '-') + 'ms');
    // rule 0: her next puzzle is already rising (leaveTable). Mummy counts as it lands; the camera lets go of the
    // nest 0.4 s later, and the baby rolls on into its seat by itself (the nest babies and Mummy answer pokes)
    const seated = this.settleHoglet(H, slot);
    this.nuzzle(H, this.homeHogs.length);
    if (this.camHold) { this.s.wait(0.15).then(() => { this.camHold = false; }); return; }
    // the last baby: the finale starts once it sits on its cushion
    this.busy = false;
    this.success(V3(slot.pos.x, slot.pos.y + 0.5, slot.pos.z), '', { watch: true, payoff: seated, still: 0.4 });
  }
  // a short slide to a stop on the pad, then it rolls up the lane at the nest's left end to its row and along the
  // row to its own cushion, over the cushion's soft rim into the seat: always rolling on the real surfaces (the
  // ball's centre follows the rolling envelope), so there is no hop anywhere. Resolves when it sits on its cushion
  // (Mummy's nuzzle and count carry on through the stillness).
  async settleHoglet(H, slot) {
    const o = H.obj;
    const pad = V3(PAD_X, this.nestSurf(PAD_X, 0) + R, 0);
    const p0 = o.position.clone();
    await this.moveHog(H, [p0, pad], 2.4, false);
    if (this.dead) return;
    const row = NEST_ROWS[slot.row];
    const pts = [V3(PAD_X, 0, 0)];
    if (slot.row > 0) pts.push(V3(PAD_X, 0, row.z));
    pts.push(V3(slot.pos.x, 0, row.z));
    await this.moveHog(H, pts, 3.0, true);
    if (this.dead) return;
    H.state = 'nest';
    H.slot = slot;
    this.nestHogs.push(H);
    this.pokeable(o, { fn: () => this.peek(H) });
    console.log('ROLL SEATED r' + this.round + ' land->seated ' + Math.round(performance.now() - this.landT) + 'ms');
    this.s.wait(0.6).then(() => { if (H.u.face && H.state === 'nest') setFace(H.u.face, 'calm'); });
  }
  // the nest's surface height (world y) at (x, z): the lane ramp at the left, the steps, and every cushion
  nestSurf(x, z) {
    const lx = NEST_X - 1.37;
    let y;
    if (x < lx) y = z >= -0.2 ? NEST_ROWS[0].y : z <= -1.7 ? NEST_ROWS[2].y : NEST_ROWS[0].y + (-0.2 - z) / 1.5 * (NEST_ROWS[2].y - NEST_ROWS[0].y);
    else y = z > -0.45 ? NEST_ROWS[0].y : z > -1.35 ? NEST_ROWS[1].y : NEST_ROWS[2].y;
    for (const s of this.slots) {
      const r = Math.hypot(x - s.pos.x, z - s.pos.z);
      if (r > 0.42) continue;
      const h = r < 0.27 ? 0.075 : 0.065 + Math.sqrt(Math.max(0, 0.0049 - (r - 0.34) ** 2));
      y = Math.max(y, s.pos.y + Math.max(h, r < 0.34 ? 0.075 : 0));
    }
    return y;
  }
  // the ball's centre height resting on the nest at (x, z): the highest surface point within its reach
  nestRest(x, z, dir) {
    let best = -Infinity;
    for (let k = -10; k <= 10; k++) {
      const d = (k / 10) * (R - 0.01);
      const px = x + dir.x * d, pz = z + dir.z * d;
      best = Math.max(best, this.nestSurf(px, pz) + Math.sqrt(R * R - d * d));
    }
    return best;
  }
  // roll along a path (eased start and end); onNest: the height follows the nest surface (rolling envelope)
  moveHog(H, pts, speed, onNest = false, ease = Ease.inOut) {
    const o = H.obj;
    const segs = [];
    let L = 0;
    for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z, onNest ? 0 : pts[i].y - pts[i - 1].y); segs.push(d); L += d; }
    if (L < 0.01) return Promise.resolve();
    let lastS = 0;
    const dir = new T.Vector3();
    return this.s.anim(Math.max(0.35, L / speed), (e) => {
      let s = e * L, i = 0;
      while (i < segs.length - 1 && s > segs[i]) { s -= segs[i]; i++; }
      const k = segs[i] ? clamp(s / segs[i], 0, 1) : 1;
      o.position.lerpVectors(pts[i], pts[i + 1], k);
      dir.set(pts[i + 1].x - pts[i].x, 0, pts[i + 1].z - pts[i].z).normalize();
      if (onNest) o.position.y = this.nestRest(o.position.x, o.position.z, dir);
      const ds = e * L - lastS; lastS = e * L;
      // it rolls: about z when it goes sideways, about x when it goes back up the lane
      H.spin -= (ds * dir.x) / R;
      H.u.ball.rotation.z = H.spin;
      H.u.ball.rotation.x -= (ds * dir.z) / R * -1;
      H.x = o.position.x; H.y = o.position.y;
    }, ease);
  }
  async nuzzle(H, k) {
    const m = this.mum;
    const style = k % 3;
    const p = H.obj.getWorldPosition(new T.Vector3());
    const yaw = Math.atan2(p.x - m.position.x, p.z - m.position.z);
    const y0 = m.rotation.y;
    this.mumBusy = true;
    const mf = m.userData.face;
    if (mf) setFace(mf, 'joy');
    this.say(NUMS[k - 1] || String(k), { voice: true });
    // a small turn of the whole body only (never through the babies beside her); the head does the rest
    await this.s.tween(m.rotation, { y: clamp(yaw * 0.35, -0.35, 0.35) }, 0.3, Ease.inOut);
    const head = m.userData.head || m.userData.body || m;
    const r0x = head.rotation.x, r0z = head.rotation.z;
    if (style === 0) await this.s.anim(0.6, (_, t) => { head.rotation.x = r0x + Math.sin(t * Math.PI) * 0.22; });            // a nod down to the baby
    else if (style === 1) await this.s.anim(0.6, (_, t) => { head.rotation.x = r0x + Math.sin(t * Math.PI * 2) * 0.1 * (1 - t) + Math.sin(t * Math.PI) * 0.1; }); // pat with her nose
    else await this.s.anim(0.7, (_, t) => { head.rotation.z = r0z + Math.sin(t * Math.PI * 2) * 0.08; });                   // a happy sway
    head.rotation.x = r0x; head.rotation.z = r0z;
    if (mf) this.s.wait(0.3).then(() => setFace(mf, 'happy'));
    await this.s.tween(m.rotation, { y: this.mumYaw }, 0.4, Ease.inOut);
    this.mumBusy = false;
  }
  peek(H) {
    const f = H.u.face;
    input.press(H.obj, 140);
    if (f) { setFace(f, 'happy'); this.s.wait(1.2).then(() => { if (H.state === 'nest') setFace(f, 'calm'); }); }
    wiggle(this.s, H.u.look, 0.18, 0.5);
    const i = this.nestHogs.indexOf(H);
    sfx.step(Math.max(0, i), this.nestHogs.length || 1, { soft: true });
  }
  updateMum(dt, t) {
    const m = this.mum;
    if (!m || this.mumBusy || this.finaleOn) return;
    // she watches the baby on its way
    const H = this.hog;
    let want = this.mumYaw;
    if (H) want = clamp(Math.atan2(H.x - m.position.x, 2.6 - m.position.z) * 0.6, -0.9, 0.3);
    m.rotation.y += (want - m.rotation.y) * Math.min(1, dt * 1.5);
  }
  updateNest(dt, t) {
    for (const H of this.nestHogs) {
      const k = 1 + Math.sin(t * 1.6 + H.v0 * 1.3) * 0.012;
      H.obj.scale.set(1 / Math.sqrt(k), k, 1);
    }
  }

  // ================================================================ camera
  // play: frame the hoglet and the piece that helps (with where it goes); rolling: the hoglet and the way ahead;
  // home: the chute lip, the nest and Mummy. Followed with critical damping (no cuts); frozen while a finger is down.
  // Fit the points (world x, y near z = 0) on screen with margins: the caption strip at the top, the corner buttons,
  // a little air at the bottom. Works for any window shape (the stage sets the fov from the aspect).
  frame(pts, minW = 5.9) {
    const aspect = camera.aspect || 1.6;
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const p of pts) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }
    const TOP = 0.17, BOT = 0.12, SIDE = 0.08;   // (12% free at the bottom: hint rings never touch the edge)
    const needH = (y1 - y0) / (1 - TOP - BOT), needW = (x1 - x0) / (1 - 2 * SIDE) + 0.4;
    const W = clamp(Math.max(minW, needW, needH * aspect), minW, 13);
    const Hh = W / aspect;
    const tanV = Math.tan((camera.fov * Math.PI) / 360);
    const d = Hh / 2 / tanV;
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2 + Hh * (TOP - BOT) / 2;
    const el = 0.14;
    return { pos: V3(cx, cy + Math.sin(el) * d, Math.cos(el) * d), look: V3(cx, cy, 0) };
  }
  // everything the child may still need in this puzzle (ahead of the hoglet), as points to keep on screen
  neededPts(H) {
    const pts = [];
    const ahead = (x) => !H || H.state === 'wait' || x > H.x - 0.9;
    const top = (ci) => topY(this.cols[ci].h);
    for (const P of this.pieces) {
      const x = P.x;
      if (P.k === 'pop' && P.sunk < P.n && ahead(x)) pts.push(V3(x - 0.5, top(P.col), 0), V3(x + 0.5, top(P.col) + (P.n - P.sunk) * 0.8, 0));
      else if (P.k === 'cookie' && P.bites < 3 && ahead(x)) pts.push(V3(x - 0.5, top(P.col), 0), V3(x + 0.5, top(P.col) + 1.0, 0));
      else if (P.k === 'jelly' && !P.launched && ahead(x)) pts.push(V3(x - 0.5, top(P.col), 0), V3(x + 1.5, topY(this.trackH(P.col + 1)) + 1.3, 0));
      else if (P.k === 'balloon' && P.state !== 'done' && (P.state === 'carrying' || ahead(x))) {
        const bw = P.obj.getWorldPosition(new T.Vector3());
        pts.push(V3(Math.min(x, bw.x) - 0.5, top(P.col), 0), V3(Math.max(x + 1.5, bw.x + 0.5), Math.max(topY(this.trackH(P.col + 1)) + R * 2 + 0.5, bw.y) + 1.75, 0));
      }
      else if (P.k === 'up' && P.state !== 'up' && ahead(x)) pts.push(V3(x - 0.5, top(P.col), 0), V3(x + 0.5, top(P.col - 1), 0));
      else if (P.k === 'plank' && P.state !== 'down' && ahead(x)) pts.push(V3(x + 0.2, top(P.col), 0), V3(x + 0.6, top(P.col) + 1.3, 0), V3(x + 2.6, top(P.col), 0));
      else if (P.k === 'door' && P.state !== 'open' && ahead(x)) {
        // the whole door house (roof apex too) and its button with room round it
        pts.push(V3(P.x - 0.4, top(P.col) + 2.4, 0), V3(colX(P.btnCol) + 0.4, top(P.btnCol) - 0.75, 0));
        if (P.btn) { const b = P.btn.g.getWorldPosition(new T.Vector3()); pts.push(V3(b.x - 0.5, b.y - 0.5, 0), V3(b.x + 0.5, b.y + 0.5, 0)); }
      }
      else if (P.k === 'button' && ahead(x)) { const D = this.pieces.find((q) => q.k === 'door'); if (D && D.state !== 'open') pts.push(V3(x, top(P.col) - 0.75, 0)); }
      else if (P.k === 'lift' && ahead(x)) {
        // both ends of its travel: the button (it rides with the lift) at the bottom, a hoglet riding it at the top
        const lo = Math.min(topY(P.a), topY(P.b)), hi = Math.max(topY(P.a), topY(P.b));
        pts.push(V3(x - 0.5, lo - 0.75 - 0.5, 0), V3(x + 0.5, hi + 2 * R + 0.4, 0));
        if (P.btn) { const b = P.btn.g.getWorldPosition(new T.Vector3()); pts.push(V3(b.x - 0.5, b.y - 0.5, 0), V3(b.x + 0.5, b.y + 0.5, 0)); }
      }
      else if (MOVE.has(P.k) && P.obj && P.state !== 'settled' && P.state !== 'locked' && P.state !== 'sunk' && P.state !== 'sinking') {
        const w = P.obj.getWorldPosition(new T.Vector3());
        if (!ahead(w.x)) continue;
        pts.push(V3(w.x - 0.55, w.y, 0), V3(w.x + 0.55, w.y + 0.85, 0), V3(P.goalX - 0.5, top(P.goal), 0), V3(P.goalX + 0.5, top(P.goal) + 0.3, 0));
      } else if (P.k === 'seesaw' && ahead(x)) pts.push(V3(x - 1.5, top(P.pc) + 1.3, 0), V3(x + 1.5, top(P.pc) + 0.8, 0));
    }
    return pts;
  }
  camTarget() {
    const H = this.hog;
    if (this.camHold || this.camMode === 'home' || (H && (H.state === 'home' || H.state === 'nest' || H.x > 4.2))) {
      return this.frame([V3(4.6, topY(2), 0), V3(NEST_X - 2.5, 0.1, 0), V3(NEST_X + 3.4, 0.2, 0), V3(NEST_X + 1.5, this.moundTop + 1.9, 0)], 7.2);
    }
    const pts = [];
    if (H && H.state !== 'wait') pts.push(V3(H.x - 0.6, H.y - R, 0), V3(H.x + 0.6, H.y + R + 0.3, 0));
    else {
      const y = topY(this.cols[1].h);
      pts.push(V3(-6.3, y, 0), V3(-4.6, y + 1.4, 0));
      if (this.choosing || !this.hog) pts.push(V3(-8.05, this.pipTop || 0, 0), V3(-6.6, (this.pipTop || 0) + 1.35, 0));   // Pip beside the log
    }
    const need = this.neededPts(H);
    pts.push(...need);
    if (!need.length && H && H.state !== 'wait') pts.push(V3(H.x + 2.2, H.y - 0.3, 0));
    return this.frame(pts);
  }
  updateCamera(dt) {
    if (!input.dragging() && !this.finaleOn) {
      const T_ = this.camTarget();
      this.camT.pos.copy(T_.pos); this.camT.look.copy(T_.look);
    }
    if (this.finaleOn) return;
    const C = this.camC, h = Math.min(dt, 0.05);
    // the return leg from the nest to the log is quicker (rule 0), every other move is the calm follow
    if (this.camFast && !this.camHold && C.pos.distanceTo(this.camT.pos) < 0.3) this.camFast = false;
    const w = this.camFast ? 8.0 : 3.2;
    // critically damped follow, per axis (pos and look)
    for (const [cur, vel, tgt] of [[C.pos, C.vp, this.camT.pos], [C.look, C.vl, this.camT.look]]) {
      for (const ax of ['x', 'y', 'z']) {
        const x = cur[ax] - tgt[ax], v = vel[ax];
        const e = Math.exp(-w * h), k = v + w * x;
        cur[ax] = tgt[ax] + (x + k * h) * e;
        vel[ax] = (v - w * k * h) * e;
      }
    }
    setCamera(C.pos, C.look);
  }

  // ================================================================ hints, demos, errorless
  promptText() {
    if (this.choosing) return 'Tap a baby!';
    const g = this.waitGate;
    if (!g || !this.hog || (this.hog.state !== 'stop' && this.hog.state !== 'float')) return '';
    const h = this.helperFor(g);
    return h ? INSTR[this.teachKey(h)] || '' : '';
  }
  prompt() { const t = this.promptText(); if (t) this.say(t, { voice: true }); }
  demo(h, first = false) {
    if (!h || this.dead) return;
    const obj = h.obj || h.P?.obj;
    if (!obj) return;
    this.demoing = true;
    fx.clearHands();
    const w = obj.getWorldPosition(new T.Vector3());
    if (PUSH.has(h.k)) {
      const y = w.y + 0.4;
      const to = clamp(h.goalX, w.x - 2.2, w.x + 2.2);
      fx.ghostPath([V3(w.x, y, 0.3), V3((w.x + to) / 2, y, 0.3), V3(to, y, 0.3)], { mode: 'drag', maxDur: 2.6 });
    } else if (h.k === 'button') fx.ghostPath([V3(w.x, w.y, 1.1)], { mode: 'tap', maxDur: 2.2 });
    else if (h.k === 'plank') fx.ghostPath([V3(w.x + 0.24, w.y + 0.55, 0.6)], { mode: 'tap', maxDur: 2.2 });
    else {
      const dy = { pop: h.sunk + ((h.n || 1) - (h.sunk || 0)) * 0.5, cookie: 0.55, jelly: 0.25, balloon: 1.3 }[h.k] ?? 0.95;
      fx.ghostPath([V3(w.x, w.y + dy, 0.45)], { mode: 'tap', maxDur: 2.2 });
    }
    this.glow(h);
    const id = (this.demoId = (this.demoId || 0) + 1);
    const end = () => { if (this.demoId !== id) return; this.demoId++; fx.clearHands(); this.demoing = false; if (this.goKey !== this.lastGate && !this.goPending) { this.goKey = this.lastGate; showGo(); } };
    const off = input.onAny(() => { off(); end(); });   // any touch ends the hand (her taps are never blocked)
    this.offs.push(off);
    this.s.wait(2.7).then(() => { off(); end(); });
  }
  showHint(glow) { if (this.choosing) this.choiceHint(glow); else if (this.waitGate) this.demo(this.helperFor(this.waitGate)); }
  glow(h) {
    const obj = h.obj;
    if (!obj) return;
    const r = h.k === 'button' ? 0.5 : h.k === 'plank' ? 0.9 : 0.75;
    const tgt = h.k === 'plank' ? obj : (obj.userData.vis || obj);
    this.addHalo(tgt, r);
    this.bob(h);
  }
  bob(h) {
    const vis = h.obj?.userData?.vis;
    if (!vis || vis.userData.bobbing) return;
    vis.userData.bobbing = true;
    const y0 = vis.position.y;
    this.s.anim(1.2, (_, t) => { vis.position.y = y0 + Math.sin(t * Math.PI * 2) * 0.03; }).then(() => { vis.position.y = y0; vis.userData.bobbing = false; });
  }
  nudgeTarget() { const h = this.waitGate && this.helperFor(this.waitGate); return h ? h.obj : null; }
  nudge(step) {
    if (this.choosing) { this.bobBabies(); if (step >= 2) for (const q of this.peekers) if (q) { const stop = fx.halo(q.h, 0.42); this.s.wait(3).then(stop); } return; }
    const h = this.waitGate && this.helperFor(this.waitGate);
    if (!h) return;
    this.bob(h);
    if (step >= 2) { const stop = fx.halo(h.k === 'plank' ? h.obj : (h.obj.userData.vis || h.obj), 0.75); this.s.wait(3).then(stop); }
  }
  makeErrorless() {
    // hints only show, they never act: the hand and a glow on the one thing to use (her turn stays hers)
    if (this.choosing) { this.choiceHint(true); return; }
    const p = this.nextPiece();
    if (!p) return;
    this.demo(p.btn ? { k: 'button', obj: p.btn.g, P: p.P } : p.P);
  }
  pokeAt(x, y) {
    if (this.dead) return false;
    const H = this.hog;
    if (H && H.state !== 'nest' && H.state !== 'home') {
      const c = project(H.obj.position), r = Math.max(screenRadius(H.obj.position, R * 1.1), 30);
      if (Math.hypot(c.x - x, c.y - y) < r) {
        // poked: it blinks, wiggles and looks at the helpful piece
        this.blink(H, 1);
        wiggle(this.s, H.u.lean, 0.12, 0.45);
        H.lookT = 0;
        return true;
      }
    }
    return super.pokeAt(x, y);
  }
  tick(dt, t) {
    super.tick(dt, t);   // the engine's help ladder: cue + hop 5 s, cue + glow + hand 8 s, errorless 20 s, home 90 s
  }

  // ================================================================ the ending
  // the photo: the whole nest, Mummy's head with room above it (the caption strip), Pip at the chute's foot
  creationView() { return { pos: V3(NEST_X + 0.05, 3.5, 9.0), look: V3(NEST_X + 0.05, 1.85, -0.8), dur: 1.0 }; }
  creationObjects() { return (this.homeHogs || this.nestHogs).map((H) => H.obj); }
  onAdmirePoke(obj, i, n) { const H = this.nestHogs.find((q) => q.obj === obj); if (H) this.peek(H); else super.onAdmirePoke(obj, i, n); }
  onFinale() {
    rollSound.stop();
    this.say('Everyone is home!', { voice: true });
    // Mummy stays sitting up tall on her mound behind them all (her whole face over the top row) and turns to the
    // camera, happy; Pip walks over to the nest's left side
    const m = this.mum;
    this.mumBusy = true;
    this.s.tween(m.rotation, { y: 0 }, 0.6, Ease.inOut);
    if (m.userData.face) setFace(m.userData.face, 'happy');
    const pip = this.pip;
    pip.userData.noWalk = false;
    // a little hop down off the stump, then a steady walk along the front of the table to the chute's foot (in the
    // finale photo, beside the nest)
    // ...and a hop up onto the front step's free left end (no cushion there): beside the babies, never in front of them
    const p0 = pip.position.clone(), p1 = V3(p0.x + 0.2, 0, 1.65), p2 = V3(NEST_X - 1.9, 0, 0.95), p3 = V3(NEST_X - 1.45, NEST_ROWS[0].y, 0.05);
    this.s.tween(pip.rotation, { y: Math.PI / 2 }, 0.3, Ease.inOut)
      .then(() => this.s.anim(0.6, (e) => { pip.position.lerpVectors(p0, p1, e); pip.position.y = p0.y * (1 - e) + Math.sin(e * Math.PI) * 0.3; }, Ease.inOut))
      .then(() => this.s.anim(3.2, (e) => pip.position.lerpVectors(p1, p2, e), Ease.inOut))
      .then(() => this.s.anim(0.5, (e) => { pip.position.lerpVectors(p2, p3, e); pip.position.y = p3.y * e + Math.sin(e * Math.PI) * 0.35; }, Ease.inOut))
      .then(() => this.s.tween(pip.rotation, { y: 0 }, 0.3, Ease.inOut));   // and he turns to face her
    for (const l of this.lanterns || []) this.glowLantern(l);
  }
  glowLantern(l) {
    l.traverse((o) => { if (o.isMesh && !o.userData.outline && o.material && o.material.emissive) { o.material = o.material.clone(); o.material.emissive = new T.Color(0xffb347); o.material.emissiveIntensity = 0.0; } });
    this.s.anim(1.2, (e) => { l.traverse((o) => { if (o.isMesh && o.material && o.material.emissive) o.material.emissiveIntensity = 0.45 * e; }); });
  }
  async showOff() {
    this.finaleOn = true;
    return super.showOff();
  }
}
