// Letter friends: the Alphabet Train (World 5, the building site). Design: docs/design/letters.md; storyboard:
// docs/storyboards/letters.md (the rebuilt core of docs/storyboards/AUDIT-letters.md section 3); words and their
// models: docs/design/VOCAB.md. Topics mt_frDIaXzWbx "Knowing all letters", mt_F978c32kDr "Single letter sounds",
// mt_j89i4u2fKr "Spotting and making alliteration", mt_NP101Zl-4g "Using new vocabulary".
//
// The Alphabet Train stands at a little station with its four letter friends already riding on their decks.
//   Level 1 "Meet the letters" (4 rounds, one per letter): the friend says its name, the box glows ("Open the box!");
//     one tap and its three things pop out onto the rug, each draggable the moment it lands ("Put them on the
//     train!"); every one she drags in, the friend says its sound-word ("a, a, a... apple!"). The last one in, the
//     train chuffs one carriage on and the next friend arrives with it.
//   Level 2 "Which letter?" (6 rounds, one drag each): a clue thing already rides in every carriage; the round's thing
//     is already on the rug ("Put it on the train!"); then one "Where is S?" (tap the friend: it hoists its own flag).
//   Level 3 "First sounds" (6 rounds, one drag or tap each): the round's things were named as they landed; the friend
//     says its sound and "Put mine on the train!"; the right one goes in with its sound-word.
// Shared rules (FEEL rule 0): nothing walks or rolls in from far away; the next round is laid out during this round's
// success beat; things are live the moment they land; no line, roll or tumble ever holds `busy`; the hand demo plays
// on the real object in each level's first round and again after 8 s with no touch (a touch ends it, never a lock).
// Names say who a friend is; sounds link it to its things (linkWord). The set advances when a level is finished.
//
// Test hooks: autoStep(wrongFirst) does the current step (tools/autoplay.js); driverMove(wrongFirst) returns the
// screen points of the next real tap or drag (pointer-event test drivers); window.__lt logs round start -> first
// touchable target (ready) and every wait over 2 s with nothing to touch (gaps).
import * as T from '../three.js';
import { Lesson } from '../engine/lesson.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { physics } from '../engine/physics.js';
import { camera, project, setSky } from '../engine/stage.js';
import { Ease } from '../engine/tween.js';
import { setFace } from '../engine/actors.js';
import { store } from '../engine/store.js';
import { propModel } from '../engine/prop-models.js';
import { THINGS, SETS, SETS_L3, NAME, SOUND, HELD, soundWord, SAY, whereIs } from './letters-data.js';
import {
  PY, RUG_Y, TRACK_Z, TRAIN_Y, PITCH, STATION_X, SPOTS, TRUNK, SEATS, DECK, SEAT_K, FLAP_OPEN, LID_OPEN,
  makeFriend, makeThing, thingReady, makeTrain, rollWheels, makeTrunk, makeStation, makeSign, LIVERY,
} from './letters-stage.js';
import { ltSfx } from './letters-sound.js';

const V = (x, y, z) => new T.Vector3(x, y, z);
const EL = 0.42;                                      // camera elevation (about 24 degrees)
const cam = (lx, ly, lz, d, el = EL) => ({ look: V(lx, ly, lz), pos: V(lx, ly + Math.sin(el) * d, lz + Math.cos(el) * d) });
// Views are fitted at run time (fitView) to the real camera FOV and the window's aspect, so every carriage, the
// rug, the box and Pip are fully on screen at 16:10 and 16:9, clear of the caption band at the top and the Go!
// badge band at the bottom (FEEL rule 3; docs/QA-NEW-GAMES.md letters items 2, 5, 7, 8).
const MARGIN = [0.025, 0.025, 0.15, 0.13];           // left, right, top, bottom (fractions of the screen)
const VMAX = 1.9;                                     // the train never goes faster than 2 units/s
const STUCK_DEMO = 8;                                 // seconds without a touch -> the hand shows the step again
const BOB_EVERY = 1.4;                                // the target's silent "use me" bob
const PIP_HOME = V(3.95, PY, 0.55);                   // beside the box, inside every view
const SIGN_AT = V(10.5, 0, -2.8);                     // well right of the station: never cut by a frame edge

export default class LettersLesson extends Lesson {
  get totalRounds() { return this.plan ? this.plan.length : 4; }

  // ======================================================================= build
  build() {
    const lv = (this.lv = Math.max(0, Math.min(2, this.level | 0)));
    this.meadow.visible = false;                      // our own station instead of the sandpit site
    setSky(['meadow', 'build', 'build'][lv], [0, 0, 1][lv]);
    this.pickSet();
    this.livery = LIVERY[lv];
    this.station = makeStation(lv, this.set);
    this.root.add(this.station);
    physics.box(V(0, PY / 2, 1.05), V(26, PY, 4));                     // the platform top
    this.sign = makeSign(this.set);
    this.sign.position.copy(SIGN_AT);
    this.root.add(this.sign);
    this.lanterns = [];
    if (lv === 2) for (const x of [-2.6, 2.9]) this.addLantern(x);
    this.trunk = makeTrunk();
    this.root.add(this.trunk);
    this.train = makeTrain(this.livery, [...this.set]);
    this.root.add(this.train);
    this.cars = this.train.userData.cars;
    // Pip, the station porter, behind and to the right of the box
    this.pip.position.copy(PIP_HOME);
    this.pip.rotation.y = -0.5;
    this.pip.scale.setScalar(0.5);
    this.pip.userData.baseScale = 0.5;
    // every friend rides on its own deck from the start (no walk-ins)
    this.friends = {};
    for (const L of this.set) {
      const f = makeFriend(L);
      this.friends[L] = f;
      this.seatFriend(f, this.carOf(L));
      this.pokeable(f, { fn: () => this.pokeFriend(f) });
    }
    this.pokeable(this.train.userData.engine, { fn: () => this.pokeEngine() });
    this.objs = new Map();
    this.rug = [null, null, null];
    this.lastWord = new Map();
    this.taught = new Set();
    this.voicedOnce = new Set();
    this.saidN = new Map();
    this.stepI = 0;
    this.placingN = 0;
    this.glowing = new Set();
    this.phase = 'intro';
    this.ptr = { x: 0, y: 0, down: false };
    const cv = document.getElementById('c');
    const mv = (e) => { this.ptr.x = e.clientX; this.ptr.y = e.clientY; };
    const dn = (e) => { mv(e); this.ptr.down = true; };
    const up = () => { this.ptr.down = false; };
    cv.addEventListener('pointermove', mv); cv.addEventListener('pointerdown', dn); cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    this.offs.push(() => { cv.removeEventListener('pointermove', mv); cv.removeEventListener('pointerdown', dn); cv.removeEventListener('pointerup', up); cv.removeEventListener('pointercancel', up); });
    // any touch resets the stuck clock (the demo is about HER taps, not about the round's age)
    this.offs.push(input.onAny(() => { this.stuck = 0; }));
    this.plan = [this.planL1, this.planL2, this.planL3][lv].call(this);
    this.stepN = this.countSteps();
    // the train is at the station when the level opens (no roll-in)
    this.trainX = this.stationX(this.plan[0].at);
    this.train.position.set(this.trainX, TRAIN_Y, TRACK_Z);
    // Level 2: a clue thing already rides in every carriage
    for (const [L, def] of this.anchors || []) {
      if (!def) continue;
      const o = this.thing(def, L), car = this.carOf(L);
      car.add(o);
      o.position.copy(this.seatSpot(o, 0));
      o.scale.setScalar(this.seatK(o));
      o.visible = true;
      o.userData.seated = true;
      o.userData.note = 0;
      if (o.userData.creature) o.userData.inner.userData.noWalk = true;
      car.userData.things.push(o);
      car.userData.clue = o;
    }
    // Levels 2 and 3: the first round's things already stand on the rug
    const r0 = this.plan[0];
    const first = r0.k === 'sort' ? [r0.def] : r0.k === 'sound' ? [r0.target, ...r0.others] : [];
    for (const d of first) {
      if (!d) continue;
      const o = this.thing(d, this.letterOf(d));
      o.visible = true;
      this.landed(o, this.freeSpot());
    }
    this.setView(this.viewFor(r0), 0);
    window.__lt = { ready: [], gaps: [], lv, set: this.set, t0: performance.now() };
    // the Go! badge: bottom centre over the empty floor band (the top-right corner holds a letter friend's face)
    const go = document.getElementById('go-badge');
    if (go) {
      const old = go.getAttribute('style') || '';
      Object.assign(go.style, { top: 'auto', bottom: '3vmin', left: '0', right: '0', width: 'fit-content', margin: '0 auto' });
      this.offs.push(() => go.setAttribute('style', old));
    }
  }
  addLantern(x) {
    const p = propModel('prop_lanternpost');
    if (!p) return;
    p.position.set(x, 0, -2.75);
    this.root.add(p);
    this.lanterns.push(p);
    const lan = propModel('prop_lantern', { tint: 0xffb04a });
    if (lan) { lan.position.set(x + 0.48, 1.67, -2.75); this.root.add(lan); this.lanterns.push(lan); }
  }

  // which set of four letters (each FINISHED level brings the next; sets with missing models are skipped)
  pickSet() {
    const lv = this.lv, sets = lv === 2 ? SETS_L3 : SETS;
    const st = store.get();
    const ctr = (st.lettersSet && st.lettersSet[lv]) || 0;
    let idx = typeof window.__ltSet === 'number' ? window.__ltSet : ctr;
    for (let k = 0; k < sets.length; k++) {
      const s = sets[(idx + k) % sets.length];
      if ([...s].every((L) => this.thingsOf(L).length >= 2)) { idx = (idx + k) % sets.length; break; }
    }
    this.setIdx = idx % sets.length;
    this.set = sets[this.setIdx];
  }
  // a letter's things in the order this level uses them (Level 3: first-sound words only, and S's order of the design)
  thingsOf(L) {
    let list = (THINGS[L] || []).filter(thingReady);
    if (this.lv === 2) {
      list = list.filter((t) => !t.nameOnly && SOUND[L]);
      if (L === 'S') { const o = ['sock', 'sun', 'snail']; list.sort((a, b) => o.indexOf(a.w) - o.indexOf(b.w)); }
    }
    return list;
  }
  letterOf(def) { return Object.keys(THINGS).find((k) => THINGS[k].includes(def)); }
  carOf(L) { return this.cars[this.set.indexOf(L)]; }

  // ======================================================================= plans
  // Level 1: one round per letter: one tap on the box, then drag its things aboard
  planL1() { return [...this.set].map((L, i) => ({ k: 'letter', L, i, at: [i] })); }
  // Level 2: 2 sorts at A/B, 2 at C/D, 1 at B/C/D, then "Where is D?". Clues (audit LF6): A's clue is its third thing
  // (ambulance, so banana never sits beside apple), the others their first.
  planL2() {
    const [A, B, C, D] = [...this.set];
    const t = (L, n) => this.thingsOf(L)[n] || null;
    this.anchors = [[A, t(A, 2) || t(A, 0)], [B, t(B, 0)], [C, t(C, 0)], [D, t(D, 0)]];
    // all four carriages stay in view and take a drop in every round (the train never moves in this level)
    const r = [], ALL = [0, 1, 2, 3];
    const sort = (L, def, intro = null) => { if (def) r.push({ k: 'sort', at: ALL, L, def, intro }); };
    sort(B, t(B, 1), ALL);
    sort(A, t(A, 1));
    sort(D, t(D, 1));
    sort(C, t(C, 1));
    const l5 = [[B, t(B, 2)], [C, t(C, 2)], [D, t(D, 2)], [A, t(A, 2) ? t(A, 0) : null]].find((x) => x[1]);
    if (l5) sort(l5[0], l5[1]);
    r.push({ k: 'find', at: ALL, L: D });
    return r;
  }
  // Level 3: A, B, M, S with two choices, then M and A with three. Each round's distractor is the next round's
  // answer, so only one or two new things hop out per round, and the trains rolls one or two carriages at most.
  planL3() {
    const Ls = [...this.set];
    const t = (L, n) => this.thingsOf(L)[n] || null;
    const p1 = Ls.map((L) => t(L, 0)), p2 = Ls.map((L) => t(L, 1));
    const R = (i, target, others) => ({ k: 'sound', L: Ls[i], i, at: [i], target, others: others.filter(Boolean) });
    return [
      R(0, p1[0], [p1[1]]), R(1, p1[1], [p1[2]]), R(2, p1[2], [p1[3]]), R(3, p1[3], [p2[2]]),
      R(2, p2[2], [p2[0], p2[1]]), R(0, p2[0], [p2[1], p2[3]]),
    ].filter((x) => x.target);
  }
  countSteps() {
    let n = 0;
    for (const r of this.plan) n += r.k === 'letter' ? this.thingsOf(r.L).length : r.k === 'find' ? 0 : 1;
    return Math.max(1, n);
  }

  // ======================================================================= camera and train position
  setView(name, dur = 0.85) {
    const v = (this.views = this.views || {})[name] || (this.views[name] = this.fitView(this.viewPts(name)));
    this.viewName = name;
    return this.glideCamera(v.pos, v.look, dur || 0.01);
  }
  // one view per level: Level 2 always shows all four carriages (the train never moves); Levels 1 and 3 frame the
  // station carriage with its friend, the rug and the box
  viewFor(rd) { return this.lv === 1 ? 'all' : 'one:' + rd.at[0]; }
  viewPts(name) {
    const P = [];
    const box = (x0, x1, y0, y1, z0, z1) => { for (const x of [x0, x1]) for (const y of [y0, y1]) for (const z of [z0, z1]) P.push(V(x, y, z)); };
    const at = name === 'all' ? [0, 1, 2, 3] : [+name.split(':')[1]];
    const tx = this.stationX(at);
    for (const i of at) { const cx = tx + i * PITCH; box(cx - 1.05, cx + 1.05, 0, 2.3, TRACK_Z - 0.45, TRACK_Z + 0.75); }
    box(-1.6, 1.6, RUG_Y, RUG_Y + 0.85, 0.35, 1.6);                                   // the rug and its things
    const t = TRUNK.pos; box(t.x - 0.65, t.x + 0.65, 0, 0.95, t.z - 0.45, t.z + 0.45); // the (closed) box
    box(PIP_HOME.x - 0.3, PIP_HOME.x + 0.3, 0, 1.05, PIP_HOME.z - 0.2, PIP_HOME.z + 0.2);
    return P;
  }
  // the camera (elevation el) that fits these points inside the margins, for the current FOV and aspect
  fitView(pts, { el = 0.38, m = MARGIN } = {}) {
    const cam = camera.clone();
    cam.aspect = innerWidth / innerHeight;
    cam.updateProjectionMatrix();
    const dir = V(0, Math.sin(el), Math.cos(el)), right = V(1, 0, 0), up = V(0, Math.cos(el), -Math.sin(el));
    const look = new T.Box3().setFromPoints(pts).getCenter(V(0, 0, 0));
    const xr = [-1 + 2 * m[0], 1 - 2 * m[1]], yr = [-1 + 2 * m[3], 1 - 2 * m[2]];
    const ext = (d) => {
      cam.position.copy(look).addScaledVector(dir, d); cam.lookAt(look); cam.updateMatrixWorld();
      const e = { x0: 9, x1: -9, y0: 9, y1: -9 }, v = V(0, 0, 0);
      for (const p of pts) { v.copy(p).project(cam); e.x0 = Math.min(e.x0, v.x); e.x1 = Math.max(e.x1, v.x); e.y0 = Math.min(e.y0, v.y); e.y1 = Math.max(e.y1, v.y); }
      return e;
    };
    let d = 8;
    for (let it = 0; it < 8; it++) {
      let lo = 1, hi = 80;
      for (let k = 0; k < 32; k++) { const mid = (lo + hi) / 2, e = ext(mid); if (e.x1 - e.x0 <= xr[1] - xr[0] && e.y1 - e.y0 <= yr[1] - yr[0]) hi = mid; else lo = mid; }
      d = hi;
      const e = ext(d);
      const halfH = d * Math.tan((cam.fov * Math.PI) / 360), halfW = halfH * cam.aspect;
      look.addScaledVector(right, -(((xr[0] + xr[1]) - (e.x0 + e.x1)) / 2) * halfW * 0.9);
      look.addScaledVector(up, -(((yr[0] + yr[1]) - (e.y0 + e.y1)) / 2) * halfH * 0.9);
    }
    ext(d);
    return { pos: cam.position.clone(), look: look.clone() };
  }
  // the train x that brings these carriages (indices) to the station: one or two centred on STATION_X, more on -0.5
  stationX(at) {
    const n = at.length, mid = (at[0] + at[n - 1]) / 2;
    if (n >= 4) return 1.0 - 3 * PITCH;          // Level 2: the whole train, its last carriage ending left of the box
    return (n <= 2 ? STATION_X : -0.5) - mid * PITCH;
  }

  // ======================================================================= rounds
  get rd() { return this.plan[this.round] || {}; }
  startRound() {
    this.cur.voiced = new Set();
    this.cur.reprompted = false;
    this.stuck = 0;
    this.errorlessOn = false;
    this.bobT = 0;
    const rd = this.rd;
    if (rd.k === 'letter') return this.startLetter(rd);
    if (rd.k === 'sort') return this.startSort(rd);
    if (rd.k === 'find') return this.startFind(rd);
    if (rd.k === 'sound') return this.startSound(rd);
  }

  // ---------- Level 1: one letter ----------
  startLetter(rd) {
    const f = this.friends[rd.L];
    this.phase = 'box';
    this.packSaid = false;
    this.enableTrunkTap(true);
    this.knobGlow(true);
    // the friend says who it is (not awaited) while the box already glows; then the instruction
    this.rock(f);
    const name = this.speakFriend(f, NAME(rd.L));
    this.instruct(SAY.open, 'trunk', { after: name });
  }
  // her tap: the box opens and the letter's things pop out onto the rug, each live the moment it lands
  async openBox() {
    if (this.phase !== 'box' || this.dead) return;
    this.logReady();                     // a touch in the very instant the round opens still counts as ready
    const rd = this.rd, car = this.carOf(rd.L);
    this.phase = 'pack';
    this.enableTrunkTap(false);
    this.knobGlow(false);
    this.endDemo();
    input.press(this.trunk, 140);
    await this.beat(this.trunk, 0.3, { squash: 0.08 });
    if (this.dead) return;
    ltSfx.latch();
    const defs = this.thingsOf(rd.L);
    this.boxOut(defs.map((d) => [d, rd.L]), { cars: [car] });
  }
  // a letter's things are all aboard: the flap shuts and the train chuffs one carriage on (the payoff); the next
  // round opens while the next carriage is still arriving
  finishLetter(car) {
    this.phase = 'won';
    const next = this.plan[this.round + 1];
    this.flapTo(car, 0, 0.35);
    this.closeLid();
    if (next) this.rollTo(this.stationX(next.at));
    this.payoffP = this.wait(next ? 0.6 : 0.8);
    this.win(car.getWorldPosition(V(0, 0, 0)));
  }

  // ---------- Level 2: sort and find ----------
  startSort(rd) {
    const o = this.thing(rd.def, rd.L);
    this.phase = 'sort';
    this.sortObj = o;
    this.live(o, rd.at.map((i) => this.cars[i]));
    this.glowOn(o, 0.5);
    // it says its name and bobs; then the instruction; then (a new pair at the station) the clues say themselves
    const name = this.line(() => { this.hopThing(o, 0.2); this.lastWord.set(rd.def.cap, performance.now()); return this.say(rd.def.cap, { repeat: true }); });
    const ins = this.instruct(SAY.put, 'drag', { after: name });
    if (rd.intro) this.introClues(rd.intro, ins);
  }
  // each clue thing hops while its friend says the sound-word (input stays open)
  introClues(at, after) {
    let p = after;
    for (const i of at) {
      const car = this.cars[i], clue = car.userData.clue, f = car.userData.friend;
      if (!clue || !f) continue;
      p = p.then(() => {
        if (this.dead || this.phase !== 'sort') return null;
        this.hopThing(clue, 0.18);
        return this.sayLink(f, f.userData.L, clue.userData.def);
      });
    }
    return p;
  }
  startFind(rd) {
    this.phase = 'find';
    this.findL = rd.L;
    for (const L of this.stationLetters()) {
      const f = this.friends[L], u = f.userData;
      if (!u.tapT) u.tapT = input.addTap(f, { radius: 0.55, offset: V(0, 0.6, 0), onTap: () => this.tapFriendAnswer(f) });
      u.tapT.enabled = true;
    }
    this.instruct(whereIs(rd.L), 'tapFriend');
  }
  tapFriendAnswer(f) {
    if (this.phase !== 'find') return;
    this.logReady();
    if (f.userData.L === this.findL) { this.foundFriend(f); return; }
    // wrong: that friend says its own name and shakes its head; the right one rocks and glows from the first miss
    this.cur.wrong++;
    this.sayNo(f);
    this.speakFriend(f, NAME(f.userData.L)).then(() => { if (!this.dead && this.phase === 'find') this.say(whereIs(this.findL), { voice: false }); });
    const r = this.friends[this.findL];
    this.rock(r);
    this.glowOn(r.userData.body, 0.7);
  }
  foundFriend(f) {
    this.phase = 'won';
    for (const g of Object.values(this.friends)) if (g.userData.tapT) g.userData.tapT.enabled = false;
    this.rock(f);
    this.joy(f, 1.2);
    this.speakFriend(f, NAME(f.userData.L));
    const car = this.carOf(f.userData.L);
    this.payoffP = this.hoistFlag(car, f);
    this.win(car.getWorldPosition(V(0, 1, 0)));
  }

  // ---------- Level 3: first sounds ----------
  startSound(rd) {
    const f = this.friends[rd.L], car = this.carOf(rd.L);
    this.phase = 'choose';
    this.soundL = rd.L;
    this.choices = [rd.target, ...rd.others].map((d) => this.thing(d, this.letterOf(d)));
    for (const o of this.choices) this.live(o, [car], { choose: true });
    // tell before asking: the things are named (as they landed; round 1 here), then the friend's sound, then "Put
    // mine on the train!" in the friend's voice. Nothing waits for it: the things are live already.
    // (things still flying in from the box are named as they land: wait for those names first)
    let p = (this.outP || Promise.resolve()).then(() => this.nameQ);
    if (this.round === 0) for (const o of this.choices) p = p.then(() => this.nameNow(o));
    const snd = p.then(() => (this.dead || this.phase !== 'choose' ? null : (this.rock(f), this.speakFriend(f, SOUND[rd.L]))));
    this.instruct(SAY.mine, 'choose', { after: snd, by: f });
  }
  // a tap or a drop chooses it
  chooseThing(o, tapped, car = null) {
    if (this.phase !== 'choose' || this.dead) return;
    this.logReady();
    const u = o.userData, want = this.objs.get(this.rd.target);
    if (o === want) {
      this.phase = 'placing';
      this.disableAll();
      fx.clearHands();
      this.placeOnSeat(o, this.carOf(this.soundL));
      return;
    }
    // wrong: it wobbles and says its own sound-word; the friend says its sound again. No lock: from the first miss
    // only the right one stays draggable, and it glows and hops.
    this.cur.wrong++;
    this.sayNo(o);
    if (car) this.flapTo(car, 0, 0.3);
    for (const x of this.choices) if (x !== want && x.userData.drag) x.userData.drag.enabled = false;
    if (!tapped) this.goHome(o, false);
    if (want) this.glowOn(want, 0.55);
    if (want) this.hopThing(want, 0.22);
    const f = this.friends[this.soundL];
    this.lastWord.set(this.linkLine(u.L, u.def), performance.now());
    this.say(this.linkLine(u.L, u.def), { repeat: true })
      .then(() => { if (!this.dead && this.phase === 'choose') this.speakFriend(f, SOUND[this.soundL]); });
  }

  // the round is won: success() needs the round not to be busy (it makes it busy itself)
  win(pos) {
    if (this.dead) return;
    this.busy = false;
    this.phase = 'won';
    this.endDemo();
    return this.success(pos, '');
  }
  // Levels 2 and 3, during the success beat: the train rolls to the next round's carriages and the next round's
  // things pop out of the box. The next round starts as they land (the roll may still be finishing).
  layoutNext() {
    const nx = this.plan[this.round + 1];
    if (!nx) return this.boxIn(this.rugThings());
    const x = this.stationX(nx.at);
    let rollDur = 0;
    if (Math.abs(x - this.trainX) > 0.01) { this.rollTo(x); rollDur = this.rollDur; }
    const v = this.viewFor(nx);
    if (v !== this.viewName) this.setView(v, 1.0);
    const defs = nx.k === 'sort' ? [nx.def] : nx.k === 'sound' ? [nx.target, ...nx.others] : [];
    const need = defs.filter((d) => d && !this.rug.includes(this.objs.get(d)) && !this.objs.get(d)?.userData.seated);
    this.outP = need.length ? this.boxOut(need.map((d) => [d, nx.k === 'sort' ? nx.L : this.letterOf(d)]), { name: this.lv === 2 }) : null;
    // the next round opens while its carriage is still pulling in (at most 1 s of payoff: rule 0), and its
    // things are live as they land; a thing dropped on a moving carriage follows it into its seat
    return this.wait(Math.min(1.0, Math.max(0.6, rollDur - 1.2)));
  }

  // ======================================================================= instructions, demos, hints
  // An instruction: action + object + result. Voiced in a level's first two rounds (and the first re-prompt of any
  // round when stuck), caption only otherwise. `after`: the line waits for this (never the input). `by`: a friend
  // says it. The hand demo of this kind of action plays at once the first time in the level.
  instruct(line, kind, { after = null, by = null } = {}) {
    const n = this.saidN.get(line) || 0;
    this.saidN.set(line, n + 1);
    this.promptLine = line;
    this.promptBy = by;
    const voice = n < 2;
    const go = () => {
      if (this.dead || this.phase === 'won' || this.phase === 'placing') return null;
      return by ? this.speakFriend(by, line, { voice, repeat: voice }) : this.say(line, { voice, repeat: voice });
    };
    if (kind) this.teach(kind);
    this.stuck = 0;
    return after ? after.then(go) : Promise.resolve(go());
  }
  // a chain of lines that never holds input (each waits for the one before)
  line(fn) { return Promise.resolve().then(() => (this.dead ? null : fn())); }
  promptText() { return this.phase === 'won' || this.phase === 'placing' ? '' : this.promptLine || ''; }
  // stuck re-prompt (the engine's 6 s and 12 s steps): the first in a round is voiced
  prompt() {
    const t = this.promptText();
    if (!t) return;
    const v = !this.cur.reprompted;
    this.cur.reprompted = true;
    if (this.phase === 'choose') {
      const f = this.friends[this.soundL];
      this.speakFriend(f, SOUND[this.soundL], { voice: v, repeat: v })
        .then(() => { if (!this.dead && this.phase === 'choose') this.speakFriend(f, SAY.mine, { voice: v, repeat: v }); });
      return;
    }
    if (this.promptBy) this.speakFriend(this.promptBy, t, { voice: v, repeat: v });
    else this.say(t, { voice: v, repeat: v });
  }
  teach(kind) {
    if (this.taught.has(kind)) return false;
    this.taught.add(kind);
    this.demo(kind, true);
    return true;
  }
  // the slow hand on the real object. Never locks input: her first touch ends it.
  demo(kind = this.demoKind(), first = false) {
    if (this.dead || !kind) return;
    fx.clearHands();
    this.demoing = true;
    const id = (this.demoId = (this.demoId || 0) + 1);
    this.showHint(true, kind, first);
    const off = input.onAny(() => { off(); if (this.demoId === id) this.endDemo(); });
    this.offs.push(off);
    this.s.wait(3.3).then(() => { off(); if (this.demoId === id) { this.demoing = false; this.idle = 0; this.stuck = 0; } });
  }
  endDemo() {
    this.demoId = (this.demoId || 0) + 1;
    fx.clearHands();
    this.demoing = false;
    this.stuck = 0;
  }
  demoKind() {
    switch (this.phase) {
      case 'box': return 'trunk';
      case 'pack': case 'sort': return this.wantThing() ? 'drag' : null;
      case 'choose': return 'choose';
      case 'find': return 'tapFriend';
      default: return null;
    }
  }
  playDemo() { /* the engine's one-demo-per-game is replaced by teach() per action per level */ this.demoDone = true; }
  showHint(glow = true, kind, first = false) {
    if (kind === undefined) {
      // called by the engine's stuck ladder: only if our own demo hasn't just played
      if (performance.now() - (this.lastDemoT || 0) < 7000) return;
      kind = this.demoKind();
    }
    if (!kind) return;
    this.lastDemoT = performance.now();
    const W3 = (o, dy = 0) => o.getWorldPosition(V(0, 0, 0)).add(V(0, dy, 0));
    if (kind === 'trunk') {
      fx.ghostPath([this.trunk.userData.knob()], { mode: 'tap', maxDur: 2.6 });
    } else if (kind === 'drag' || kind === 'choose') {
      const o = this.wantThing();
      const car = o && (kind === 'choose' ? this.carOf(this.soundL) : this.carFor(o));
      if (o && car) {
        fx.ghostPath([W3(o, o.userData.h * 0.5), this.bayPos(car).add(V(0, 0.2, 0))], { mode: 'drag', maxDur: 3.0 });
      }
    } else if (kind === 'tapFriend') {
      // the first time: a scan over the friends (how to answer); when stuck: a tap on the right one
      if (first) fx.ghostPath(this.stationLetters().map((L) => W3(this.friends[L], 0.65)), { mode: 'scan', maxDur: 2.8 });
      else fx.ghostPath([W3(this.friends[this.findL], 0.65)], { mode: 'tap', maxDur: 2.4 });
    }
  }
  // the engine's stuck ladder: 6 s and 12 s (the first re-prompt is voiced, see prompt()): the target hops high and glows
  nudge(step) {
    const ph = this.phase;
    // one ring at a time: no second ring on something that already glows
    const glow = (o, r) => { if (this.glowing.has(o)) return; const stop = fx.halo(o, r); this.glowing.add(o); this.s.wait(3).then(() => { stop(); this.glowing.delete(o); }); };
    if (ph === 'box') { this.lidBob(); glow(this.trunk.userData.knobO, 0.5); return; }
    if (ph === 'find') { const f = this.friends[this.findL]; this.rock(f); glow(f.userData.body, 0.7); return; }
    const o = this.wantThing();
    if (!o) return;
    this.hopThing(o, 0.3);
    glow(o, 0.6);
    if (ph === 'sort') {
      // Level 2: the right friend rocks and its clue thing hops; at 12 s it also says the clue's sound-word
      const car = this.carFor(o), f = car?.userData.friend, clue = car?.userData.clue;
      if (f) this.rock(f);
      if (clue) this.s.wait(0.5).then(() => this.hopThing(clue, 0.18));
      if (step >= 2 && f && clue) this.s.wait(1.6).then(() => { if (this.phase === 'sort') this.sayLink(f, f.userData.L, clue.userData.def); });
    }
  }
  makeErrorless() {
    // 20 s stuck: the step does itself, gently
    const ph = this.phase;
    if (ph === 'box') this.openBox();
    else if (ph === 'pack' || ph === 'sort') { const o = this.wantThing(); if (o) this.autoPlace(o); }
    else if (ph === 'choose') { const o = this.objs.get(this.rd.target); if (o && o.userData.drag?.enabled) this.chooseThing(o, true); }
    else if (ph === 'find') this.tapFriendAnswer(this.friends[this.findL]);
  }
  // the ladder's 20 s step makes the move happen by itself, and keeps doing so every 6 s for a multi-thing round
  errorless() {
    const auto = this.idle >= 19;
    if (auto) {
      this.errorlessOn = true;
      this.makeErrorless();
      if ((this.cur.autos = (this.cur.autos || 0) + 1) < 4) { this.ladder = 2; this.idle = 14; }
      return;
    }
    if (this.errorlessOn) return;
    this.errorlessOn = true;
    this.prompt();
  }
  stationLetters() { return (this.rd.at || []).map((i) => this.set[i]); }

  // the thing that should go next, and where
  wantThing() {
    const ok = (o) => o && o.visible && o.userData.drag?.enabled && !o.userData.busy && !o.userData.placing && !o.userData.seated;
    const ph = this.phase;
    if (ph === 'choose') { const o = this.objs.get(this.rd.target); return ok(o) ? o : null; }
    if (ph === 'sort') return ok(this.sortObj) ? this.sortObj : null;
    if (ph === 'pack') return this.rugThings().find(ok) || null;
    return null;
  }
  liveThings() { return this.rugThings().filter((o) => o.userData.drag?.enabled && !o.userData.placing && !o.userData.busy); }
  carFor(o) { return this.carOf(o.userData.L); }
  bayPos(car) { return car.localToWorld(V(0, 0.75, 0.32)); }

  // ======================================================================= the box (the station trunk)
  enableTrunkTap(on) {
    if (!this.trunkTap) this.trunkTap = input.addTap(this.trunk, { radius: 0.75, offset: V(0, 0.5, 0), onTap: () => this.openBox() });
    this.trunkTap.enabled = on;
  }
  // a lasting halo (until the round is won), at most one per object
  glowOn(o, r) {
    if (this.glowing.has(o)) return;
    this.glowing.add(o);
    this.addHalo(o, r);
  }
  clearHints() { super.clearHints(); this.glowing?.clear(); }
  knobGlow(on) {
    if (this.knobStop) { this.knobStop(); this.knobStop = null; }
    if (on) { const stop = fx.halo(this.trunk.userData.knobO, 0.4); this.knobStop = stop; this.stopHints.push(stop); }
  }
  // lid tweens: a newer one takes over from an older one (the lid never jumps)
  lidTo(a, dur = 0.6) {
    const lid = this.trunk.userData.lid, a0 = lid.rotation.x;
    const tok = (this.lidTok = (this.lidTok || 0) + 1);
    return this.s.anim(dur, (e) => { if (tok === this.lidTok) lid.rotation.x = a0 + (a - a0) * e; }, Ease.inOut);
  }
  closeLid() { if (this.trunk.userData.lid.rotation.x < -0.01) this.lidTo(0, 0.7); }
  lidBob() {
    const lid = this.trunk.userData.lid, a0 = lid.rotation.x;
    if (a0 < -0.05 || this.lidBobbing) return;
    this.lidBobbing = true;
    const tok = this.lidTok;
    this.s.anim(0.7, (_, p) => { if (tok === this.lidTok) lid.rotation.x = a0 - Math.sin(p * Math.PI) * 0.14; })
      .then(() => { if (tok === this.lidTok) lid.rotation.x = a0; this.lidBobbing = false; });
  }
  // the lid swings open and the things pop out one by one (0.35 s apart) onto free rug spots. Each is live the
  // moment it lands if the current round wants it (opts.cars: Level 1, this round); Level 3 things say their names
  // as they land. The lid shuts again after the last (opts.close).
  async boxOut(items, { cars = null, name = false, close = true } = {}) {
    if (!items.length) return;
    if (!cars) ltSfx.latch();
    this.lidTo(LID_OPEN, 0.45);
    await this.wait(0.2);
    const ps = [];
    for (let k = 0; k < items.length; k++) {
      if (this.dead) return;
      const [def, L] = items[k];
      const o = this.thing(def, L);
      if (cars) o.userData.liveCars = cars;
      ps.push(this.popOut(o, this.freeSpot()).then(() => {
        if (this.dead) return;
        if (name) this.nameThing(o);
        if (o.userData.liveCars) this.goLive(o);
      }));
      if (k < items.length - 1) await this.wait(0.35);
    }
    await Promise.all(ps);
    if (close && !this.dead) this.closeLid();
  }
  // the end of a level: the things she did not choose go back into the box (nearest first), so the rug is tidy for
  // "All aboard!" and the photo (they were never hers: E8 allows them to go)
  async boxIn(objs) {
    if (!objs.length) return this.wait(0.8);
    const tr = this.trunk;
    ltSfx.latch();
    this.lidTo(LID_OPEN, 0.45);
    await this.wait(0.3);
    const list = objs.slice().sort((a, b) => b.position.x - a.position.x);
    await Promise.all(list.map((o, k) => this.wait(k * 0.3).then(async () => {
      const u = o.userData;
      if (u.drag) u.drag.enabled = false;
      u.busy = true;
      this.rug[u.spot] = null;
      const up = tr.userData.inside(0, 0.8, 0.04), down = tr.userData.inside(0, 0.72 - u.h - 0.02, 0.04);
      await this.hopTo(o, up, 0.6, 0.7, { yaw: TRUNK.ry, rz: 0 });
      await this.s.anim(0.3, (e) => o.position.lerpVectors(up, down, e), Ease.in);
      o.visible = false;
    })));
    if (!this.dead) this.closeLid();
  }
  // out of the box: straight up out of the dark inside, then one arc to its rug spot (a spin for props, a hop for
  // animals), a soft landing squash. About 1 s. Arcs always go to the farthest free spot first, so nothing ever
  // flies through a thing already standing on the rug.
  async popOut(o, i) {
    this.rug[i] = o;
    o.userData.landedOk = false;
    const u = o.userData, tr = this.trunk;
    const start = tr.userData.inside(0, 0.72 - u.h - 0.02, 0.04);
    const up = tr.userData.inside(0, 0.8, 0.04);
    o.position.copy(start);
    o.rotation.set(0, TRUNK.ry, 0);
    o.visible = true;
    await this.s.anim(0.3, (e) => { o.position.lerpVectors(start, up, e); }, Ease.out);
    if (this.dead) return;
    // props turn once round on the way (they land facing us); animals just hop and face us
    await this.hopTo(o, this.restPos(o, i), 0.85, 0.75, { yaw: u.creature ? 0 : Math.PI * 2, rz: u.def.lie ? Math.PI / 2 : null });
    this.landed(o, i);
    this.squashLand(o);
  }
  squashLand(o) {
    const inner = o.userData.inner, k = o.userData.k;
    this.s.anim(0.25, (_, p) => { const q = 1 - Math.sin(p * Math.PI) * 0.12; inner.scale.set(k / Math.sqrt(q), k * q, k / Math.sqrt(q)); }).then(() => inner.scale.setScalar(k));
  }
  // where a thing rests on rug spot i: standing on it, or (def.lie: the sock) lying on its side, centred on the spot
  restPos(o, i) {
    const p = SPOTS[i].clone();
    if (o.userData.def.lie) { p.x += o.userData.h / 2; p.y += o.userData.w / 2; }
    return p;
  }
  landed(o, i) {
    o.position.copy(this.restPos(o, i));
    o.rotation.set(0, 0, o.userData.def.lie ? Math.PI / 2 : 0);
    o.userData.spot = i;
    o.userData.home = o.position.clone();
    o.userData.landedOk = true;
    this.rug[i] = o;
  }
  // this round wants o: it is live now if it has landed, or the moment it lands
  live(o, cars, opts = {}) {
    o.userData.liveCars = cars;
    o.userData.liveOpts = opts;
    if (o.userData.landedOk && !o.userData.seated) this.goLive(o);
  }
  goLive(o) {
    const u = o.userData;
    if (!u.liveCars || u.seated || u.placing || this.phase === 'won') return;
    this.makeDragThing(o, u.liveCars, u.liveOpts || {});
    if (this.phase === 'pack' && !this.packSaid) { this.packSaid = true; this.instruct(SAY.packThem, 'drag'); }
  }

  // ======================================================================= things
  thing(def, L = null) {
    let o = this.objs.get(def);
    if (o) { if (L) o.userData.L = L; return o; }
    o = makeThing(def);
    o.userData.L = L || this.letterOf(def);
    o.visible = false;
    this.root.add(o);
    this.objs.set(def, o);
    this.pokeable(o, { fn: () => this.pokeThing(o) });
    return o;
  }
  rugThings() { return this.rug.filter(Boolean); }
  // rug spots: Level 1 left to right (first out lands farthest), Level 2 the middle, Level 3 the two outer ones first
  freeSpot() {
    const order = [[0, 1, 2], [1, 0, 2], [0, 2, 1]][this.lv];
    for (const i of order) if (!this.rug[i]) return i;
    return order[0];
  }
  // a thing says its name as it lands (Level 3: tell before asking); the names queue, one after the other
  nameThing(o) {
    this.nameQ = (this.nameQ || Promise.resolve()).then(() => this.nameNow(o));
  }
  nameNow(o) {
    if (this.dead || !o.visible || o.userData.seated) return null;
    this.hopThing(o, 0.18);
    this.lastWord.set(o.userData.def.cap, performance.now());
    return this.say(o.userData.def.cap, { repeat: true });
  }
  // an arc through the air. `to` may be a function (a seat on a carriage that is still rolling in): the arc follows
  // it every frame, so nothing jumps when it is attached
  arcTo(o, to, h = 0.6, dur = 0.6, { yaw = null, scale = null, rz = null } = {}) {
    const p0 = o.position.clone(), r0 = o.rotation.y, s0 = o.scale.x, z0 = o.rotation.z;
    const at = typeof to === 'function' ? to : () => to;
    return this.s.anim(dur, (e, p) => {
      o.position.lerpVectors(p0, at(), e);
      o.position.y += Math.sin(p * Math.PI) * h;
      if (yaw !== null) o.rotation.y = r0 + (yaw - r0) * e;
      if (scale !== null) o.scale.setScalar(s0 + (scale - s0) * e);
      if (rz !== null) o.rotation.z = z0 + (rz - z0) * e;
    }, Ease.inOut);
  }
  // a hop on a true parabola (straight line in plan, so it clears what it passes over)
  hopTo(o, to, h = 0.6, dur = 0.7, { yaw = null, scale = null, rz = null } = {}) {
    const p0 = o.position.clone(), r0 = o.rotation.y, s0 = o.scale.x, z0 = o.rotation.z;
    const at = typeof to === 'function' ? to : () => to;
    return this.s.anim(dur, (_, p) => {
      o.position.lerpVectors(p0, at(), p);
      o.position.y += 4 * h * p * (1 - p);
      if (yaw !== null) o.rotation.y = r0 + (yaw - r0) * Math.min(1, p * 1.5);
      if (scale !== null) o.scale.setScalar(s0 + (scale - s0) * p);
      if (rz !== null) o.rotation.z = z0 + (rz - z0) * p;
    });
  }
  // the line that links a thing to its letter: its sound-word, or (no first sound: Q, X, ice cream, owl) its name
  linkLine(L, def) { return SOUND[L] && !def.nameOnly ? soundWord(L, def) : def.cap; }
  // the friend says it: "a, a, a... apple!" (or "O!", then "Owl!")
  sayLink(f, L, def) {
    if (SOUND[L] && !def.nameOnly) return this.speakFriend(f, soundWord(L, def));
    return this.speakFriend(f, NAME(L)).then(() => (this.dead ? null : this.say(def.cap, { repeat: true })));
  }
  sayThing(o, line) {
    const now = performance.now();
    if (now - (this.lastWord.get(line) || 0) < 1500) return null;
    this.lastWord.set(line, now);
    return this.say(line, { repeat: true });
  }
  pokeThing(o) {
    // things that are not a current target answer a poke: soft press, a small hop, its note, its word
    if (o.userData.drag?.enabled || o.userData.placing) return;
    input.press(o, 140);
    if (this.finaleOn && o.userData.def.w === 'xylophone') [0, 2, 4].forEach((n, k) => setTimeout(() => sfx.step(n, 5, { soft: true }), k * 180));
    else if (this.finaleOn && o.userData.def.call && sfx[o.userData.def.call]) sfx[o.userData.def.call]();
    else if (o.userData.seated) sfx.step(o.userData.note ?? 0, this.stepN, { soft: true });
    this.hopThing(o, 0.12);
    // aboard (or in the sounds level) it is one of the friend's things: its sound-word; on the rug just its name
    const u = o.userData;
    this.sayThing(o, u.seated || this.lv === 2 ? this.linkLine(u.L, u.def) : u.def.cap);
  }
  hopThing(o, h = 0.2) {
    // never while it is still flying out of the box (two moves on one thing would make it jump)
    if (o.userData.showing || o.userData.placing || (!o.userData.seated && o.userData.landedOk === false)) return null;
    o.userData.showing = true;
    const y0 = o.position.y, inner = o.userData.inner, k = o.userData.k;
    return this.s.anim(0.5, (_, p) => {
      if (o.userData.dragging || o.userData.placing || o.userData.busy) return;   // her finger (or a move) wins
      o.position.y = y0 + Math.sin(p * Math.PI) * h;
      const sq = 1 + Math.sin(p * Math.PI * 2) * 0.06 * (1 - p);
      inner.scale.set(k / Math.sqrt(sq), k * sq, k / Math.sqrt(sq));
    }).then(() => { if (!o.userData.dragging && !o.userData.placing) o.position.y = y0; inner.scale.setScalar(k); o.userData.showing = false; });
  }
  // the thing's own small show (silent, ~0.7 s) when she taps it without dragging
  showThing(o) {
    if (o.userData.showing) return;
    const def = o.userData.def, inner = o.userData.inner, k = o.userData.k, h = o.userData.h;
    input.press(o, 120);
    if (o.userData.seated) return this.hopThing(o, 0.12);
    if (o.userData.creature) {
      const face = inner.userData.face;
      if (face) { setFace(face, 'joy'); this.s.wait(1.0).then(() => setFace(face, 'happy')); }
      inner.userData.kick?.(V(0, 3, 0));
      return this.hopThing(o, 0.18);
    }
    o.userData.showing = true;
    const y0 = o.position.y;
    const done = () => { o.position.y = y0; inner.rotation.set(0, 0, 0); inner.scale.setScalar(k); o.userData.showing = false; };
    const A = (dur, fn) => this.s.anim(dur, fn).then(done);
    switch (def.show) {
      case 'bounce': return A(0.7, (_, p) => { const hh = [[0, 0.6, 0.28], [0.6, 1, 0.1]]; let y = 0; for (const [a, b, m] of hh) if (p >= a && p < b) y = Math.sin(((p - a) / (b - a)) * Math.PI) * m; o.position.y = y0 + y; });
      case 'jiggle': return A(0.7, (_, p) => { const w = 1 + Math.sin(p * Math.PI * 4) * 0.1 * (1 - p); inner.scale.set(k * w, k / w, k * w); });
      case 'rock': return A(0.7, (_, p) => { const r = Math.sin(p * Math.PI * 3) * 0.2 * (1 - p); inner.rotation.z = r; o.position.y = y0 + Math.abs(Math.sin(r)) * o.userData.w * 0.45; });
      case 'wobble': return A(0.7, (_, p) => { const r = Math.sin(p * Math.PI * 4) * 0.18 * (1 - p); inner.rotation.z = r; o.position.y = y0 + Math.abs(Math.sin(r)) * o.userData.w * 0.45; });
      case 'spin': return A(0.8, (_, p) => { inner.rotation.y = Ease.inOut(p) * Math.PI * 2; o.position.y = y0 + Math.sin(p * Math.PI) * 0.15; });
      case 'flip': return A(0.8, (_, p) => { inner.rotation.z = Ease.inOut(p) * Math.PI * 2; o.position.y = y0 + Math.sin(p * Math.PI) * (0.25 + h * 0.5); });
      case 'float': return A(0.8, (_, p) => { o.position.y = y0 + Math.sin(p * Math.PI) * 0.25; const w = 1 + Math.sin(p * Math.PI * 4) * 0.06; inner.scale.set(k * w, k / w, k * w); });
      case 'fly': return A(0.8, (_, p) => { o.position.y = y0 + Math.sin(p * Math.PI) * 0.35; inner.rotation.z = Math.sin(p * Math.PI * 3) * 0.2; });
      case 'flutter': return A(0.8, (_, p) => { o.position.y = y0 + Math.sin(p * Math.PI) * 0.3; inner.rotation.z = Math.sin(p * Math.PI * 4) * 0.25 * (1 - p * 0.5); });
      case 'sway': return A(0.8, (_, p) => { inner.rotation.z = Math.sin(p * Math.PI * 3) * 0.1 * (1 - p); o.position.y = y0 + Math.abs(Math.sin(inner.rotation.z)) * o.userData.w * 0.45; });
      case 'hop': return A(0.7, (_, p) => { o.position.y = y0 + Math.abs(Math.sin(p * Math.PI * 2)) * 0.16; });
      default: return A(0.6, (_, p) => { o.position.y = y0 + Math.sin(p * Math.PI) * 0.15; });
    }
  }

  // ---------- dragging a thing to a carriage ----------
  // cars: the carriages at the station (drop zones). opts.choose: Level 3 (a tap chooses it too)
  makeDragThing(o, cars, opts = {}) {
    const u = o.userData;
    u.dragOpts = opts;
    u.cars = cars;
    if (!u.drag) {
      // an animal is never lifted: an invisible handle follows the finger and the animal walks after it
      const tgt = u.creature ? (u.proxy = this.makeProxy(o)) : o;
      u.drag = input.addDrag(tgt, {
        radius: 0.5, minY: RUG_Y, offset: u.creature ? null : V(0, u.h * 0.45, 0), autoHome: !u.creature, feel: !u.creature, magnet: u.creature ? 0 : 0.3,
        // from the first miss (or errorless) only the right carriage takes it
        zones: () => (u.cars || []).map((car) => ({ car, pos: this.bayPos(car), radius: 1.1, enabled: (this.cur.wrong === 0 && !this.errorlessOn) || car === this.carFor(o) || this.phase === 'choose', onNear: (k) => this.nearCar(car, k, o) })),
        onPick: () => this.pickThing(o),
        onMove: () => { if (!u.creature) this.overNeighbours(o); },
        onDrop: (z, info) => this.dropThing(o, z, info),
      });
    }
    u.drag.home = (u.creature ? u.proxy.position : (u.home || o.position)).clone();
    u.drag.enabled = true;
  }
  // an invisible drag handle for something that walks instead of being lifted (kept on it while not dragged)
  makeProxy(o) {
    const px = new T.Object3D();
    px.userData.follow = o;
    px.userData.dy = (o.userData.h || 1) * 0.5;
    px.position.copy(o.position).add(V(0, px.userData.dy, 0));
    this.root.add(px);
    (this.proxies = this.proxies || []).push(px);
    return px;
  }
  // a carried thing passes over the things still on the rug, never through them
  overNeighbours(o) {
    const u = o.userData;
    for (const n of this.rugThings()) {
      if (n === o) continue;
      const dx = Math.abs(n.position.x - o.position.x), dz = Math.abs(n.position.z - o.position.z);
      if (dx < (u.w + n.userData.w) / 2 + 0.05 && dz < (u.d + n.userData.d) / 2 + 0.05) o.position.y = Math.max(o.position.y, RUG_Y + n.userData.h + 0.04);
    }
  }
  disableAll() {
    for (const o of this.objs.values()) { if (o.userData.drag) o.userData.drag.enabled = false; if (o.userData.tap) o.userData.tap.enabled = false; }
  }
  pickThing(o) {
    const u = o.userData;
    this.logReady();
    this.stuck = 0;
    if (u.creature) { u.walkPos = o.position.clone(); this.walker = o; }
    this.endDemo();
    // picked up, it says its name ("Apple!"), unless it has only just said it
    if (performance.now() - (this.lastWord.get(u.def.cap) || 0) > 2500) this.sayThing(o, u.def.cap);
  }
  nearCar(car, k, o) {
    // its flap lowers as the thing comes close; its friend leans toward it and watches
    if ((this.cur.wrong > 0 || this.errorlessOn) && this.phase !== 'choose' && car !== this.carFor(o)) k = 0;
    car.userData.flapWant = k;
    const f = car.userData.friend;
    if (f) f.userData.lean = k;
  }
  dropThing(o, zone, info = {}) {
    const u = o.userData;
    this.walker = null;
    for (const c of this.cars) { c.userData.flapWant = 0; if (c.userData.friend) c.userData.friend.userData.lean = 0; }
    if (!zone) {
      if (info.tapped && this.phase === 'choose') {
        if (u.creature && o !== this.objs.get(this.rd.target)) this.walkHome(o);
        this.chooseThing(o, true);
        return;
      }
      if (info.tapped) { this.showThing(o); this.sayThing(o, u.def.cap); }
      if (u.creature) { this.walkHome(o); return; }
      this.landed(o, u.spot);
      return;
    }
    const car = zone.car;
    if (this.phase === 'choose') { this.chooseThing(o, false, car); return; }
    if (car === this.carFor(o)) { if (this.phase === 'sort') this.phase = 'placing'; this.placeOnSeat(o, car); }
    else this.wrongCar(o, car);
  }
  // back to its rug spot (it walks if it is an animal); live again on arrival
  async goHome(o, relive = true) {
    const u = o.userData;
    if (u.drag) u.drag.enabled = false;
    u.busy = true;
    if (u.creature) await this.walkVia(o, u.home.clone());
    else await input.sendHome(u.drag, { to: u.home });
    if (this.dead) return;
    this.landed(o, u.spot);
    u.busy = false;
    if (relive && u.drag && !u.seated) u.drag.enabled = true;
  }
  async walkHome(o) { return this.goHome(o, this.phase !== 'choose' || o === this.objs.get(this.rd.target)); }
  // a creature walks along the ground (its gait plays), max 2.4 units/s
  walkThing(o, to, speed = 2.2) {
    const p0 = o.position.clone(), d = p0.distanceTo(to);
    if (d < 0.02) return this.wait(0);
    const yaw = Math.atan2(to.x - p0.x, to.z - p0.z);
    const dur = Math.max(0.4, d / speed);
    return this.s.anim(dur, (e, p) => { o.position.lerpVectors(p0, to, e); o.rotation.y = p < 0.85 ? yaw * Math.min(1, p * 5) : yaw * (1 - (p - 0.85) / 0.15); }, Ease.inOut).then(() => { o.rotation.y = 0; });
  }
  // an animal walks along a lane behind the rug row, so it never walks through the things still on the rug
  async walkVia(o, to) {
    const LANE = -0.05, y = to.y;
    const pts = [];
    if (o.position.z > 0.4) pts.push(V(o.position.x, y, LANE));
    if (to.z > 0.4) pts.push(V(to.x, y, LANE));
    pts.push(to);
    for (const p of pts) { if (this.dead) return; await this.walkThing(o, p); }
  }
  // Level 2, the wrong carriage: that friend shakes its head ("Try the other one!" with two carriages; "Not me!" in
  // its own voice with more). From the first miss only the right flap opens, and it glows.
  wrongCar(o, car) {
    const u = o.userData;
    this.cur.wrong++;
    const f = car.userData.friend;
    if (f) this.sayNo(f);
    if ((u.cars || []).length > 2 && f) this.speakFriend(f, SAY.notMe, { voice: true, repeat: true });
    else { const first = !this.voicedOnce.has(SAY.other); this.voicedOnce.add(SAY.other); this.say(SAY.other, { voice: first }); }
    this.flapTo(car, 0, 0.3);
    const rc = this.carFor(o);
    if (rc) this.rock(rc.userData.friend);
    this.goHome(o);
  }
  // into the next free seat: an arc (it eases smaller on the way, which reads as distance), clonk + the rising note
  async placeOnSeat(o, car) {
    const u = o.userData;
    if (u.placing || u.seated) return;
    u.placing = true;
    this.placingN++;
    u.drag.enabled = false;
    this.rug[u.spot] = null;
    this.stuck = 0;
    this.endDemo();
    const seatI = car.userData.things.length;
    car.userData.things.push(o);
    const seatL = this.seatSpot(o, seatI), sk = this.seatK(o);
    const seatW = () => car.localToWorld(seatL.clone());
    car.userData.flapWant = 1;
    if (u.creature) {
      // walks to the platform edge in front of its seat, then hops up onto it
      await this.walkVia(o, V(seatW().x, RUG_Y, -0.68 + u.d / 2));
      u.inner.userData.noWalk = true;
      await this.hopTo(o, seatW, 0.6, 0.65, { yaw: 0, scale: sk });
    } else await this.arcTo(o, seatW, 0.5, 0.5, { yaw: 0, scale: sk, rz: 0 });
    if (this.dead) return;
    car.attach(o);
    o.position.copy(seatL);
    o.userData.seated = true;
    u.note = this.stepI;
    u.placing = false;
    this.placingN--;
    ltSfx.clonk();
    sfx.step(this.stepI++, this.stepN);
    const f = car.userData.friend || this.friends[u.L];
    if (f) this.joy(f, 1.0);
    car.userData.flapWant = 0;
    this.afterPlace(o, car);
  }
  // seat scale: tall things (the teddy, the monkey) a little smaller, so their heads stay below the friend's feet
  seatK(o) { return SEAT_K * (o.userData.h > 0.7 ? 0.82 : 1); }
  // seat spot (carriage-local): deep things sit further back, so nothing pokes through the sill
  seatSpot(o, i) {
    const s = SEATS[Math.min(2, i)].clone();
    s.z = Math.min(s.z, 0.5 - (o.userData.d * this.seatK(o)) / 2);
    return s;
  }
  afterPlace(o, car) {
    const L = o.userData.L, def = o.userData.def, f = car.userData.friend;
    // the friend says what it has: "a, a, a... apple!" (never awaited)
    if (f) { this.rock(f); this.sayLink(f, L, def); }
    if (this.lv === 0) {
      // the last one in (and none still on its way): the letter is done
      if (this.phase === 'pack' && car.userData.things.length >= this.thingsOf(L).length && this.placingN === 0) this.finishLetter(car);
      return;
    }
    this.payoffP = this.layoutNext();
    this.win(car.getWorldPosition(V(0, 0, 0)));
  }
  // errorless: the thing goes there itself, gently
  async autoPlace(o) {
    const u = o.userData;
    if (u.busy || u.placing) return;
    if (u.drag) u.drag.enabled = false;
    if (this.phase === 'sort') this.phase = 'placing';
    await this.wait(0.2);
    if (this.dead) return;
    await this.placeOnSeat(o, this.carFor(o));
  }

  // ======================================================================= friends
  seatFriend(f, car) {
    car.add(f);
    f.position.copy(DECK);
    f.rotation.set(0, 0, 0);
    f.visible = true;
    car.userData.friend = f;
  }
  rock(f, amt = 0.1) {
    if (!f || f.userData.rocking) return this.wait(0);
    f.userData.rocking = true;
    const b = f.userData.body;
    return this.s.anim(0.6, (_, p) => { b.rotation.z = Math.sin(p * Math.PI * 2) * (amt || 0.06) * (1 - p * 0.4); }).then(() => { b.rotation.z = 0; f.userData.rocking = false; });
  }
  joy(f, sec = 1) {
    const face = f.userData.face;
    if (!face) return;
    setFace(face, 'joy');
    this.s.wait(sec).then(() => { if (face.userData.emotion === 'joy') setFace(face, 'happy'); });
  }
  // the friend speaks (its name, its sound, its line): mouth open while the line plays; a held sound shivers the
  // body, a stop sound nods three times
  async speakFriend(f, line, { repeat = true, voice = true } = {}) {
    if (!f || this.dead) return;
    const face = f.userData.face, b = f.userData.body;
    f.userData.speaking = true;
    if (face) setFace(face, 'joy');
    const L = f.userData.L, isSound = line === SOUND[L];
    let on = true;
    if (isSound) {
      const held = HELD.has(L);
      const t0 = performance.now();
      const tick = () => {
        if (!on || this.dead) { b.rotation.x = 0; b.rotation.y = 0; return; }
        const t = (performance.now() - t0) / 1000;
        if (held) b.rotation.y = Math.sin(t * Math.PI * 2 * 12) * 0.05;
        else b.rotation.x = Math.max(0, Math.sin(Math.min(t, 1.2) / 1.2 * Math.PI * 3)) * 0.12;
        requestAnimationFrame(tick);
      };
      tick();
    }
    this.lastWord.set(line, performance.now());
    await this.say(line, { repeat, voice });
    on = false;
    b.rotation.x = 0; b.rotation.y = 0;
    f.userData.speaking = false;
    if (face) setFace(face, 'happy');
  }
  // a poke on a friend that is not the answer: it rocks and says who it is (Level 3: its sound)
  pokeFriend(f) {
    const L = f.userData.L;
    const line = this.lv === 2 ? SOUND[L] : NAME(L);
    input.press(f.userData.body, 140);
    this.rock(f);
    if (performance.now() - (this.lastWord.get(line) || 0) < 1500) return;
    this.speakFriend(f, line);
  }
  // "Where is S?": the found friend hoists its own little flag on its carriage's corner post (about 1 s; it stays)
  hoistFlag(car, f) {
    const pen = new T.Group();
    const pf = propModel('prop_pennant', { tint: 0xffd23f });
    if (pf) { pf.rotation.z = Math.PI / 2; pf.position.set(0.02, 0, 0); pen.add(pf); }
    car.add(pen);
    const y0 = 1.0, y1 = 1.42, k = 0.55;
    pen.position.set(0.86, y0, -0.48);
    pen.scale.set(k, k * 0.2, k);
    // the friend gives one happy hop on its deck
    const fy = f.position.y;
    this.s.anim(0.5, (_, p) => { f.position.y = fy + Math.sin(p * Math.PI) * 0.25; }).then(() => { f.position.y = fy; });
    sfx.step(this.stepN - 1, this.stepN, { soft: true });
    return this.s.anim(0.8, (e) => { pen.position.y = y0 + (y1 - y0) * e; pen.scale.y = k * (0.2 + 0.8 * e); }, Ease.out);
  }

  // ======================================================================= the train
  // roll the train: one soft chuff, ramps up and down, never faster than VMAX
  rollTo(x) {
    const x0 = this.trainX, d = x - x0;
    this.trainX = x;
    if (Math.abs(d) < 0.01) return this.wait(0);
    const ramp = 0.6;
    const dur = Math.abs(d) / VMAX + ramp;
    this.rollDur = dur;
    const a = ramp / dur;
    const f = (p) => (p < a ? (0.5 * p * p) / a / (1 - a) : p <= 1 - a ? (p - a / 2) / (1 - a) : 1 - (0.5 * (1 - p) * (1 - p)) / a / (1 - a));
    ltSfx.chuff();
    const tr = this.train, dist0 = tr.userData.dist;
    const tok = (this.rollTok = (this.rollTok || 0) + 1);
    return this.s.anim(dur, (_, p) => {
      if (tok !== this.rollTok) return;
      const e = Math.min(1, Math.max(0, f(p)));
      tr.position.x = x0 + d * e;
      tr.userData.dist = dist0 + d * e;
      rollWheels(tr);
    }).then(() => { if (tok === this.rollTok) tr.position.x = x; });
  }
  flapTo(car, a, dur = 0.4) {
    car.userData.flapWant = a / FLAP_OPEN;
    const fl = car.userData.flap, a0 = fl.rotation.x;
    car.userData.flapLock = true;
    return this.s.anim(dur, (e) => { fl.rotation.x = a0 + (a - a0) * e; }, Ease.inOut).then(() => { car.userData.flapLock = false; });
  }
  pokeEngine() {
    if (!this.finaleOn) { input.press(this.train.userData.engine, 120); return; }
    if (this.engineBusy) return;
    this.engineBusy = true;
    ltSfx.toot();
    const tr = this.train, x0 = tr.position.x, d0 = tr.userData.dist;
    this.s.anim(1.5, (_, p) => { const o = Math.sin(p * Math.PI) * -0.4; tr.position.x = x0 + o; tr.userData.dist = d0 + o; rollWheels(tr); })
      .then(() => { tr.position.x = x0; tr.userData.dist = d0; rollWheels(tr); this.engineBusy = false; });
  }

  // ======================================================================= every frame
  update(dt, t) {
    // flaps follow their want (lowering as a thing comes close); friends lean toward a thing that comes near
    for (const c of this.cars) {
      const u = c.userData;
      if (!u.flapLock) {
        const want = (u.flapWant || 0) * FLAP_OPEN;
        u.flap.rotation.x += (want - u.flap.rotation.x) * Math.min(1, dt * 7);
      }
      const f = u.friend;
      if (f && !f.userData.rocking && !f.userData.speaking) f.userData.body.rotation.x += ((f.userData.lean || 0) * 0.14 - f.userData.body.rotation.x) * Math.min(1, dt * 6);
    }
    // friends standing still sway a tiny bit (alive, never statue-still)
    for (const f of Object.values(this.friends)) {
      const u = f.userData;
      if (!f.visible || u.rocking || u.speaking || u.shaking) continue;
      u.body.rotation.z = Math.sin(t * 1.3 + u.L.charCodeAt(0)) * 0.018;
    }
    // a carried animal walks under the finger (on the platform, round the things on the rug)
    const w = this.walker;
    if (w && w.userData.walkPos) this.walkUnderFinger(w, dt);
    // drag handles stay on what they move while it isn't being carried
    for (const px of this.proxies || []) {
      const o = px.userData.follow;
      if (o === this.walker) continue;
      o.getWorldPosition(px.position);
      px.position.y += px.userData.dy;
    }
    if (!this.cur || this.finaleOn) return;
    // the target's silent "use me" cue from the round start: the box lid bobs; live things hop in turn
    const calm = !this.busy && !this.demoing && !input.dragging();
    if (calm) {
      this.bobT = (this.bobT || 0) + dt;
      if (this.bobT > BOB_EVERY) {
        this.bobT = 0;
        if (this.phase === 'box') this.lidBob();
        else if (this.phase === 'pack' || this.phase === 'sort' || this.phase === 'choose') {
          const live = this.liveThings();
          if (live.length) this.hopThing(live[(this.bobI = ((this.bobI || 0) + 1) % live.length)], 0.08);
        }
      }
    }
    // no touch for 8 s: the hand shows the step again, slowly (her taps reset the clock; see build())
    if (calm && this.demoKind()) {
      this.stuck = (this.stuck || 0) + dt;
      if (this.stuck > STUCK_DEMO) { this.stuck = 0; this.demo(); }
    }
    this.logReady();
  }
  // FEEL rule 0 log: round start -> the first moment something answers her (taps open and a target live), and every
  // stretch over 2 s with nothing to touch
  anyLive() {
    if (this.trunkTap?.enabled && this.phase === 'box') return true;
    for (const o of this.objs.values()) if (o.visible && o.userData.drag?.enabled && !o.userData.placing && !o.userData.busy) return true;
    for (const f of Object.values(this.friends)) if (f.userData.tapT?.enabled) return true;
    return false;
  }
  logReady() {
    const lg = window.__lt, c = this.cur;
    if (!lg || !c) return;
    const now = performance.now();
    const live = this.canGo() && this.phase !== 'won' && this.anyLive();
    if (live && !c.readyAt) {
      c.readyAt = now;
      const ms = Math.round(now - c.t0);
      lg.ready.push({ round: this.round + 1, k: this.rd.k, L: this.rd.L, ms, at: Math.round(now - lg.t0) });
      console.log(`LT_READY L${this.lv + 1} r${this.round + 1} ${this.rd.k} ${ms}ms`);
    }
    if (live) {
      if (this.gapFrom && now - this.gapFrom > 2000) { lg.gaps.push({ round: this.round + 1, ms: Math.round(now - this.gapFrom) }); console.log(`LT_GAP L${this.lv + 1} r${this.round + 1} ${Math.round(now - this.gapFrom)}ms`); }
      this.gapFrom = 0;
    } else if (!this.gapFrom && !input.dragging() && !this.placingN) this.gapFrom = now;
  }
  walkUnderFinger(w, dt) {
    const g = groundAt(this.ptr.x, this.ptr.y - Math.min(innerWidth, innerHeight) * 0.06, PY);
    if (!g) return;
    const u = w.userData, r = Math.max(u.w, u.d) * 0.5;
    g.x = Math.max(-3.4, Math.min(2.0 - r, g.x));
    g.z = Math.max(-0.62 + u.d / 2, Math.min(2.5, g.z));
    const p = u.walkPos, d = g.clone().sub(p);
    d.y = 0;
    const L = d.length(), step = Math.min(L, 2.4 * dt);
    if (L > 0.001) p.addScaledVector(d, step / L);
    // never through the things on the rug, the box or Pip: push out of their circles
    const obs = this.rugThings().filter((o) => o !== w).map((o) => [o.position.x, o.position.z, Math.max(o.userData.w, o.userData.d) * 0.5]);
    const tp = this.trunk.position;
    obs.push([tp.x, tp.z, 0.78], [this.pip.position.x, this.pip.position.z, 0.42]);
    for (const [ox, oz, orr] of obs) {
      const dx = p.x - ox, dz = p.z - oz, dd = Math.hypot(dx, dz), need = orr + r + 0.03;
      if (dd < need && dd > 1e-4) { p.x = ox + (dx / dd) * need; p.z = oz + (dz / dd) * need; }
    }
    p.y = RUG_Y;
    w.position.copy(p);
    if (L > 0.05) w.rotation.y += (Math.atan2(d.x, d.z) * 0.6 - w.rotation.y) * Math.min(1, dt * 6);
  }
  // taps on nothing: no scenery boings; things, friends and the engine answer through pokeables
  pokeAt(x, y) {
    if (this.dead) return false;
    if (this.pokeables.length && this.pokeAtPokeable(x, y)) return true;
    return true;
  }
  mash() { /* Pip stays calm: no wiggle, no sound */ }

  // ======================================================================= finale
  onFinale() {
    this.finaleOn = true;
    this.disableAll();
    this.enableTrunkTap(false);
    for (const c of this.cars) { c.userData.flapWant = 0; }
    // the level is finished: the next play of this level brings the next set (audit LF20)
    const lv = this.lv, n = (lv === 2 ? SETS_L3 : SETS).length, next = (this.setIdx + 1) % n;
    store.update((s) => { s.lettersSet = s.lettersSet || [0, 0, 0]; s.lettersSet[lv] = next; });
    this.say(SAY.aboard, { voice: !this.voicedOnce.has('finaleAboard') });
    this.voicedOnce.add('finaleAboard');
  }
  get admireTime() { return 6; }
  async showOff() {
    // "All aboard!": the train chuffs to its photo spot, centred over the rug (so the rug lies whole beneath it and
    // the train can fill 90% of the width); the box and the Level 3 lamp posts leave the picture; Pip walks out of
    // the shot to the right (he never stands in front of a carriage); then the camera frames the train
    const photoX = -((this.cars.length - 1) * PITCH - 2.5) / 2;
    for (const l of this.lanterns) this.fadeAway(l, 0.6);
    this.fadeAway(this.trunk, 0.6);
    this.walkTo(this.pip, V(6.4, PY, 0.55), { speed: 2.2, faceCamera: true });
    if (Math.abs(this.trainX - photoX) > 0.01) await this.rollTo(photoX);
    await super.showOff();
    // admire: every thing, friend and the engine answer a poke (answers are all off, so a tap can only poke)
    this.disableAll();
    input.unlock();
  }
  get finaleRain() { return false; }
  creationView() {
    const n = this.cars.length, x0 = this.train.position.x - 3.55, x1 = this.train.position.x + (n - 1) * PITCH + 1.05;
    const pts = [];
    for (const x of [x0, x1]) for (const y of [0, 2.3]) for (const z of [TRACK_Z - 0.6, TRACK_Z + 0.75]) pts.push(V(x, y, z));
    // the train spans about 90% of the width (QA-FINAL-B); the rug lies whole beneath it (never cut by an edge)
    for (const x of [-1.75, 1.75]) for (const z of [0.15, 1.65]) pts.push(V(x, RUG_Y, z));
    const v = this.fitView(pts, { el: 0.3, m: [0.05, 0.05, 0.17, 0.04] });
    return { pos: v.pos, look: v.look, dur: 0.9 };
  }
  creationObjects() {
    const things = [...this.objs.values()].filter((o) => o.userData.seated);
    return [...things, ...Object.values(this.friends), this.train.userData.engine];
  }
  onAdmirePoke(obj) {
    const p = this.pokeables.find((q) => q.obj === obj);
    if (p && p.fn) p.fn(obj);
  }

  // ======================================================================= test hooks
  // tools/autoplay.js: does the current step directly (once a second)
  autoStep(wrongFirst = false) {
    if (this.busy || input.dragging() || this.placingN > 0 || !this.canGo() || !this.anyLive()) return;
    const ph = this.phase;
    if (ph === 'box') this.openBox();
    else if (ph === 'pack' || ph === 'sort') {
      const o = this.wantThing(); if (!o) return;
      const right = this.carFor(o);
      const wrong = this.lv > 0 && wrongFirst && this.cur.wrong === 0 ? (o.userData.cars || []).find((c) => c !== right) : null;
      this.logReady();
      if (wrong) this.wrongCar(o, wrong); else { if (ph === 'sort') this.phase = 'placing'; this.placeOnSeat(o, right); }
    } else if (ph === 'find') {
      const wrong = wrongFirst && this.cur.wrong === 0 ? this.stationLetters().find((L) => L !== this.findL) : null;
      this.tapFriendAnswer(this.friends[wrong || this.findL]);
    } else if (ph === 'choose') {
      const want = this.objs.get(this.rd.target);
      const wrong = wrongFirst && this.cur.wrong === 0 ? this.choices.find((o) => o !== want && o.userData.drag?.enabled) : null;
      if (wrong || want?.userData.drag?.enabled) this.chooseThing(wrong || want, true);
    }
  }
  // pointer-event drivers: the screen points (CSS px) of the next real gesture, or null while there is none.
  // { tap: [x, y] } or { from: [x, y], to: [x, y] }; wrongFirst tries the wrong carriage / friend / thing once.
  driverMove(wrongFirst = false) {
    if (this.dead || this.finaleOn || input.dragging() || this.placingN > 0 || !this.anyLive()) return null;
    const P = (v) => { const p = project(v); return [Math.round(p.x), Math.round(p.y)]; };
    const W = (o, dy = 0) => o.getWorldPosition(V(0, 0, 0)).add(V(0, dy, 0));
    const grab = (o) => (o.userData.creature ? P(o.userData.proxy.getWorldPosition(V(0, 0, 0))) : P(W(o, o.userData.h * 0.45)));
    const ph = this.phase, tryWrong = wrongFirst && this.cur.wrong === 0;
    if (ph === 'box') return this.trunkTap?.enabled ? { tap: P(W(this.trunk, 0.5)) } : null;
    if (ph === 'find') {
      const L = (tryWrong && this.stationLetters().find((x) => x !== this.findL)) || this.findL;
      return { tap: P(W(this.friends[L], 0.6)) };
    }
    if (ph === 'choose') {
      const want = this.objs.get(this.rd.target);
      const o = (tryWrong && this.choices.find((x) => x !== want && x.userData.drag?.enabled)) || want;
      if (!o?.userData.drag?.enabled || o.userData.busy) return null;
      return { from: grab(o), to: P(this.bayPos(this.carOf(this.soundL))), car: this.set.indexOf(this.soundL) };
    }
    const o = this.wantThing();
    if (!o) return null;
    const right = this.carFor(o);
    const car = (tryWrong && this.lv === 1 && (o.userData.cars || []).find((c) => c !== right)) || right;
    return { from: grab(o), to: P(this.bayPos(car)), car: this.cars.indexOf(car) };
  }
  // where that carriage's bay is on screen now (a driver's finger follows a carriage that is still rolling in)
  driverBay(i) { const p = project(this.bayPos(this.cars[i])); return [Math.round(p.x), Math.round(p.y)]; }
  dispose() { this.walker = null; super.dispose(); }
}

// the ground point (plane y = h) under a screen point
const _ray = new T.Raycaster();
function groundAt(x, y, h) {
  _ray.setFromCamera(new T.Vector2((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1), camera);
  const r = _ray.ray;
  if (Math.abs(r.direction.y) < 1e-4) return null;
  const t = (h - r.origin.y) / r.direction.y;
  if (t < 0) return null;
  return r.origin.clone().addScaledVector(r.direction, t);
}
