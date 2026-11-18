// What happens next? (World 3: the farm). Topics mt_VEwM7ClYYE "Story sequence and central message",
// mt_-vvVxpOHG2 "Ordering events in time" and mt_8-POYyg7GJ "Predicting what happens next".
// Little picture stories told with 3D story cards: each card is a chunky shadow-box frame with a tiny scene inside
// (an egg in a nest, a seed in the soil, a caterpillar on a leaf…). A row of three wooden crate stands, numbered with
// one, two and three dice dots, holds the story in order; the cards to choose from stand on the grass in front. Tap a
// card (or drag it up to the stands) and it walks through the air onto the next stand. A wrong card shakes and goes back.
// The narrator tells each story: every card names its moment as it lands ("An egg!", "Crack, crack!"), and each story
// asks its own question for its ending ("Who comes out?"). When the story is complete SHE tells it: card 1 plays,
// then each next card waits for her tap (it pulses; a hand shows it after 3 s; it plays by itself after 4 s), and the
// ending is spoken ("The chick hatched!"). The ending card then goes onto the story shelf at the back and stays all
// level (tap it to see it again); the earlier cards slide down behind their stands. The finale shows the shelf.
// Six stories (chick hatching, seed to flower, caterpillar to butterfly, apple tree to Bunny's snack, sun, rain and
// rainbow, Piggy's mud bath), each round a new one.
// Levels:
//   L1  the narrator tells cards 1 and 2 onto the stands; she picks the ending from two (one from another story).
//   L2  the narrator tells card 1; she puts card 2 and then card 3 on the stands (two cards to choose from, no decoy).
//   L3  three empty stands: she puts all three cards in order.
//
// Test hooks: phase ('pick' while waiting for a card, 'tell' while she tells the finished story), cards (the cards on
// the grass, c.userData.step), want() (the step id the next stand needs), choose(card) (as if the child tapped it),
// tellNext (the card waiting for her tap while she tells it) and tapPlaced(card).
import * as T from '../three.js';
import { Lesson, shuffle } from '../engine/lesson.js';
import { popIn, popOut, hop } from '../engine/actors.js';
import { input } from '../engine/input.js';
import { speech } from '../engine/speech.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { setCamera, camera, getLook } from '../engine/stage.js';
import { Ease } from '../engine/tween.js';
import { disposeTree } from '../engine/toon.js';
import { makeTray } from '../engine/keepsake.js';
import { makeCard, makeStand, makeQMark, CARD, STAND_TOP } from './story-props.js';
import { TALES, TALE_IDS } from './story-tales.js';
import { calmBackdrop, isTree } from './view-tools.js';

// Camera stations: PICK frames the story stands and the choice cards; the STORY camera (built in build()) is close on
// the stands, for the narrator's set-up and while she tells the finished story. WIDE is only the opening shot.
const CAMS = {
  wide: { pos: new T.Vector3(1.0, 6.6, 13.6), look: new T.Vector3(1.0, 1.75, 0) },
  pick: { pos: new T.Vector3(1.0, 5.3, 10.3), look: new T.Vector3(1.0, 1.55, 0.9) },
};
const XC = 1.0;             // the middle of the stands and of the choices
const STAND_Z = -0.8;
const GAP = 0.32;           // the gap between two stands
const SK = 1.12;            // the stands' (and the placed cards') size
const CH_Z = 3.1;           // the choice row on the grass
const CH_S = 0.74;          // a choice card's size
const CH_GAP = 2.6;
const SHELF_Z = -3.4;       // the story shelf at the back (the keepsake tray): one ending card per story
const CARD_Z = 0.05;        // a card's centre on its stand (stand-relative)
const _cp = new T.Vector3(), _cl = new T.Vector3();
const sine = (p) => 0.5 - 0.5 * Math.cos(Math.PI * p);

export default class StoryLesson extends Lesson {
  build() {
    setCamera(CAMS.wide.pos, CAMS.wide.look);
    this.feelInit();
    this.pip.position.set(-6.7, 0, 1.6);   // just off the close-up frame; walks to the story shelf for the finale
    this.pip.rotation.y = 0.5;
    this.pip.scale.setScalar(0.8);
    this.pip.userData.baseScale = 0.8;
    const n = 3, step = CARD.w * SK + GAP;
    this.SK = SK;
    this.slots = [];
    for (let i = 0; i < n; i++) {
      const x = XC + (i - (n - 1) / 2) * step;
      const st = makeStand(i + 1);
      st.position.set(x, 0, STAND_Z);
      st.scale.setScalar(SK);
      this.root.add(st);
      this.slots.push({ x, stand: st, card: null, pos: new T.Vector3(x, STAND_TOP * SK, STAND_Z + CARD_Z * SK) });
    }
    // the story shelf: every finished story leaves its ending card here (E5 keepsake tray)
    this.tray = makeTray(this, this.totalRounds, [XC, 0, SHELF_Z], { style: 'shelf', spacing: 1.3 });
    this.q = makeQMark();
    this.q.visible = false;
    this.root.add(this.q);
    this.q.userData.tap = input.addTap(this.q, { radius: 0.7, offset: new T.Vector3(0, 0.5, 0), onTap: () => this.tapQ() });
    this.cards = [];      // choices on the grass
    this.placed = [];     // cards on the stands, in order
    this.phase = 'idle';
    this.tales = shuffle(TALE_IDS).map((id) => TALES[id]); // a fresh order of stories every game
    // rain, snow and falling leaves stay behind the cards (never across a picture), and the trees that stood right
    // behind the stands (blobs between and above the cards) are hidden
    calmBackdrop(this.meadow, { hide: (o) => isTree(o) && Math.abs(o.position.x - XC) < 6.5 && o.position.z > -16 });
    // close on the stands (the narrator's set-up, and while she tells the finished story)
    const w = n * CARD.w * SK + (n - 1) * GAP + 0.9, d = w / 1.05;
    this.storyCam = { pos: new T.Vector3(XC, 2.55 + d * 0.16, STAND_Z + d), look: new T.Vector3(XC, 2.55, STAND_Z) };
  }

  // ---------------- test hooks ----------------
  want() { return this.order ? this.order[this.oi] : null; }

  // ---------------- cards ----------------
  // every card in a round wears the round's frame colour, so the odd one out has to be spotted by its picture
  newCard(tale, key) {
    const c = makeCard(this.tale ? this.tale.tint : tale.tint);
    const step = tale.steps[key], st = {};
    step.build(c.userData.dio, st);
    c.userData.st = st;
    c.userData.act = () => step.act(this.s, st);
    c.userData.step = tale.id + ':' + key;
    c.userData.key = key;
    c.userData.tale = tale;
    this.root.add(c);
    return c;
  }
  // a card on the grass that the child can tap or drag
  addChoice(c, x) {
    c.position.set(x, 0, CH_Z);
    c.rotation.set(0, (XC - x) * 0.025, 0);
    c.userData.home = c.position.clone();
    c.userData.ry = c.rotation.y;
    c.userData.drag = input.addDrag(c, {
      radius: 1.15, offset: new T.Vector3(0, CARD.h * CH_S * 0.5, 0), minY: 0,
      zones: () => this.slotZones(),
      onPick: () => { if (this.phase === 'pick') this.lift(c, true); },
      // carried up toward the stands it shrinks to about their size (it is much nearer the camera)
      onMove: () => { this.s.stop(c.scale); const u = Math.min(1, Math.max(0, c.position.y / 3)); c.scale.setScalar(CH_S * (1.08 - 0.3 * u)); },
      onDrop: (z, { tapped }) => this.dropCard(c, z, tapped),
    });
    this.cards.push(c);
    return c;
  }
  slotZones() {
    const s = this.slots[this.si];
    return s && this.phase === 'pick' ? [{ pos: s.pos.clone().add(new T.Vector3(0, (CARD.h / 2) * SK, 0)), radius: 1.6, slot: this.si }] : [];
  }
  lift(c, on) { this.s.tween(c.scale, { x: CH_S * (on ? 1.08 : 1), y: CH_S * (on ? 1.08 : 1), z: CH_S * (on ? 1.08 : 1) }, 0.12); }
  dropCard(c, zone, tapped) {
    this.lift(c, false);
    if (this.phase !== 'pick' || this.dead) { this.goHome(c); return; }
    if (zone || tapped) this.choose(c);
    else this.goHome(c);
  }
  goHome(c, dur = 0.55) {
    const a = c.position.clone(), b = c.userData.home;
    if (a.distanceTo(b) < 0.01) return Promise.resolve();
    return this.s.anim(dur, (e, p) => { c.position.lerpVectors(a, b, e); c.position.y += Math.sin(p * Math.PI) * 0.4; }, Ease.out)
      .then(() => { c.position.copy(b); c.rotation.z = 0; });
  }
  // a card shows its little moment: a soft swell on its stand (it stays standing on it) and its act
  actCard(c) {
    if (!c || c.userData.acting) return Promise.resolve();
    c.userData.acting = true;
    const k = c.scale.x;
    const swell = this.s.anim(0.6, (_, p) => c.scale.setScalar(k * (1 + Math.sin(p * Math.PI) * 0.05))).then(() => c.scale.setScalar(k));
    return Promise.all([swell, Promise.resolve(c.userData.act())]).then(() => { c.userData.acting = false; });
  }

  // ---------------- choosing ----------------
  choose(c) {
    if (this.phase !== 'pick' || this.dead || !this.cards.includes(c)) return;
    this.idle = 0;
    this.endDemo();
    this.goPending = false; // she has already started: no late Go! badge over her cards
    if (c.userData.step === this.want()) this.place(c);
    else this.wrong(c);
  }
  wrong(c) {
    const lines = this.level === 0 ? ['Hmm, not that one!', 'Look again!'] : this.si === 0 ? ['Not yet! What comes first?'] : ['Not yet! What comes next?'];
    this.redirect(lines[this.cur.wrong % lines.length]);
    // it goes back to its spot and shakes its head "no"
    this.goHome(c, 0.5).then(() => {
      const r0 = c.userData.ry;
      this.s.anim(0.7, (_, p) => { c.rotation.y = r0 + Math.sin(p * Math.PI * 3) * 0.2 * (1 - p); }).then(() => { c.rotation.y = r0; });
    });
  }
  async place(c) {
    this.phase = 'fly';
    this.clearHints();
    fx.clearHands();
    speech.say(''); // an old "Not yet!" caption must not hang over the new card
    input.remove(c.userData.drag);
    this.cards = this.cards.filter((x) => x !== c);
    const slot = this.slots[this.si];
    this.si++;
    this.oi++;
    const last = this.oi >= this.order.length;
    // the question mark hops on to the next stand while the card flies in
    if (!last) this.moveQ(); else this.hideQ();
    await this.flyTo(c, slot);
    if (this.dead) return;
    this.seat(c, slot);
    await this.wait(0.25);
    if (this.dead) return;
    // the card shows its moment and the narrator names it (the ending's line waits for her telling)
    const line = !last && this.tale.lines[c.userData.key];
    await Promise.all([this.actCard(c), line ? this.say(line, { max: 1.8 }) : null, this.wait(0.8)]);
    if (this.dead) return;
    if (last) { this.complete(); return; }
    this.phase = 'pick';
    this.prompt();
  }
  // the card travels on a low, calm arc onto its stand (never faster than a walk, never out of the frame)
  flyTo(c, slot) {
    const a = c.position.clone(), b = slot.pos, k0 = c.scale.x, ry0 = c.rotation.y;
    const dist = a.distanceTo(b), dur = Math.min(1.7, 0.8 + dist * 0.13);
    const h = 0.7 + Math.abs(a.x - b.x) * 0.05;
    return this.s.anim(dur, (_, p) => {
      const e = sine(p);
      c.position.lerpVectors(a, b, e);
      c.position.y += Math.sin(p * Math.PI) * h;
      c.scale.setScalar(k0 + (SK - k0) * e);
      c.rotation.y = ry0 * (1 - e);
      c.rotation.z = Math.sin(p * Math.PI) * 0.08;
    }).then(() => { c.position.copy(b); c.scale.setScalar(SK); c.rotation.set(0, 0, 0); });
  }
  // a card lands on its stand: thunk, squash, and it becomes tappable (tap it to see its little scene again)
  seat(c, slot) {
    slot.card = c;
    this.placed.push(c);
    sfx.thunk();
    c.scale.setScalar(SK);
    this.s.anim(0.22, (_, p) => { const w = Math.sin(p * Math.PI) * (1 - p * 0.5); c.scale.set(SK * (1 + 0.05 * w), SK * (1 - 0.1 * w), SK * (1 + 0.05 * w)); }).then(() => c.scale.setScalar(SK));
    c.userData.tap = input.addTap(c, { radius: 1.15 * SK, offset: new T.Vector3(0, (CARD.h / 2) * SK, 0), onTap: () => this.tapPlaced(c) });
  }
  // tapping a card on a stand: while she tells the story, a tap on the waiting card (or any card after it) plays the
  // next moment; otherwise the card plays its moment again
  tapPlaced(c) {
    if (this.dead) return;
    if (this.phase === 'tell' && this.tellGo) {
      const i = this.placed.indexOf(c), j = this.placed.indexOf(this.tellNext);
      if (j >= 0 && i >= j) { this.tellGo(); return; }
    }
    if (this.phase === 'tell' && this.placed.indexOf(c) >= (this.told || 0)) return; // not told yet: it waits its turn
    this.actCard(c);
  }

  // ---------------- the question mark on the next stand ----------------
  moveQ() {
    const s = this.slots[this.si];
    if (!s) { this.hideQ(); return; }
    const q = this.q, to = s.pos.clone().add(new T.Vector3(0, 0.02, 0.2));
    if (!q.visible) { q.position.copy(to); popIn(this.s, q, 1.15, 0.35, { sound: false }); return; }
    const a = q.position.clone();
    this.s.anim(0.7, (e, p) => { q.position.lerpVectors(a, to, e); q.position.y += Math.sin(p * Math.PI) * 0.6; }, Ease.inOut).then(() => q.position.copy(to));
  }
  hideQ() { if (this.q.visible) popOut(this.s, this.q, 0.3); }
  tapQ() { if (this.phase !== 'pick') return; this.prompt({ repeat: true }); this.nudge(1); }

  // ---------------- rounds ----------------
  async startRound(r) {
    this.busy = true;
    this.phase = 'setup';
    const tale = (this.tale = this.tales[r % this.tales.length]);
    const keys = (this.keys = tale.three);
    const ids = keys.map((k) => tale.id + ':' + k);
    this.si = 0;
    this.oi = 0;
    this.said = null;
    this.order = null;
    this.tellNext = null;
    if (this.level === 2) {
      // Level 3: all three cards are hers to put in order (they come out as the camera settles)
      const dur = r === 0 ? 1.1 : 0.85;
      if (this.camTo !== CAMS.pick) this.glide(CAMS.pick, dur);
      await this.wait(dur * 0.6);
      if (this.dead) return;
      this.order = ids;
      this.deal(keys, tale, false);
    } else {
      // the narrator starts the story (about 2 s): the told cards come down together, each shows its moment and is
      // named, and the choices come out while the last line is still being said (taps open all the way through)
      if (this.camTo !== CAMS.pick) this.glide(CAMS.pick, r === 0 ? 1.1 : 0.8);
      const pre = this.level === 0 ? 2 : 1;
      const told = [];
      for (let i = 0; i < pre; i++) told.push(this.dropCard3(tale, keys[i], this.slots[i], i * 0.15));
      await this.wait(0.6);
      if (this.dead) return;
      let lastLine = Promise.resolve();
      for (let i = 0; i < pre; i++) {
        if (i > 0) { await this.wait(0.85); if (this.dead) return; }
        const c = await told[i];
        if (this.dead) return;
        this.actCard(c);
        const line = tale.lines[keys[i]];
        if (line) lastLine = this.say(line, { max: 2.5 });
      }
      await this.wait(0.3);
      if (this.dead) return;
      this.si = pre;
      this.order = ids.slice(pre);
      if (this.level === 0) this.deal([keys[2]], tale, true);
      else this.deal(keys.slice(1), tale, false);
      this.phase = 'pick';
      this.busy = false;
      this.moveQ();
      // the question follows the last card's line (never on top of it, never queued behind a pile of lines)
      lastLine.then(() => { if (!this.dead && this.phase === 'pick' && this.round === r) this.prompt(); });
      await this.firstDemo();
      return;
    }
    if (this.dead) return;
    // the cards take a finger as they appear (rule 0); the question and the first demo follow
    this.phase = 'pick';
    this.busy = false;
    this.moveQ();
    this.prompt();
    await this.firstDemo();
  }
  // the first time she picks a card in this game, a slow hand shows how (once the cards are out, unless she has
  // already touched something)
  async firstDemo() {
    if (this.taught.has('card')) return;
    const oi = this.oi, t0 = performance.now();
    await this.wait(0.9);
    if (this.dead || this.phase !== 'pick' || this.oi !== oi || input.dragging() || this.touchedAt > t0) return;
    this.taught.add('card');
    this.demo();
  }
  // one told card of the narrator's set-up comes down onto its stand (eased, 0.6 s) and becomes tappable
  async dropCard3(tale, key, slot, delay = 0) {
    const c = this.newCard(tale, key), b = slot.pos;
    c.scale.setScalar(SK);
    c.position.set(b.x, b.y + 2.4, b.z);
    if (delay) await this.wait(delay);
    if (this.dead) return c;
    // lowered gently (sine ease: no fast start, so a slow frame never makes it jump)
    await this.s.anim(0.6, (_, p) => { c.position.y = b.y + 2.4 * (1 - sine(p)); });
    if (this.dead) return c;
    c.position.copy(b);
    this.seat(c, slot);
    return c;
  }
  // choice cards pop up on the grass (with a card from another story when it's a "which one?" question)
  deal(keys, tale, withOther) {
    const list = keys.map((k) => ({ tale, k }));
    if (withOther) list.push(this.otherCard(tale, keys[keys.length - 1]));
    const order = shuffle(list);
    order.forEach((o, i) => {
      const c = this.newCard(o.tale, o.k);
      const x = XC + (i - (order.length - 1) / 2) * CH_GAP;
      this.addChoice(c, x);
      c.scale.setScalar(0.001);
      this.s.wait(0.1 + i * 0.2).then(() => { if (!this.dead && this.cards.includes(c)) popIn(this.s, c, CH_S, 0.55, { sound: false }); });
    });
  }
  // the wrong choice: the same moment from a different story (an ending for an ending, so it looks just as finished)
  otherCard(tale, key) {
    const idx = tale.three.indexOf(key);
    const others = TALE_IDS.filter((id) => id !== tale.id);
    this.otherI = ((this.otherI ?? Math.floor(Math.random() * others.length)) + 1) % others.length;
    const ot = TALES[others[this.otherI]];
    return { tale: ot, k: ot.three[Math.min(idx, ot.three.length - 1)] };
  }
  promptText() {
    if (!this.order || (this.phase !== 'pick' && this.phase !== 'fly')) return '';
    if (this.si >= this.slots.length - 1) return this.tale.ask;   // the story's own question for its ending
    return this.si === 0 ? 'What happens first?' : 'What happens next?';
  }
  // the question is spoken once a round; asked again in the same round it shows as a caption only (unless she is
  // stuck or asks for it by tapping the "?")
  prompt(opts = {}) {
    const t = this.promptText();
    if (!t) return;
    const first = this.said !== t;
    this.say(t, { max: 1.4, voice: first || !!opts.repeat, repeat: (first && t === this.tale.ask) || !!opts.repeat });
    this.said = t;
  }
  action() { return this.phase === 'pick' && !this.busy ? 'card' : null; }
  // taps are open while the narrator sets the story up and while she tells it (the cards replay and turn the page);
  // the Go! badge only shows when there is a card to choose
  canGo() { return this.phase === 'setup' || this.phase === 'tell' ? performance.now() - this.goT0 > 300 : super.canGo(); }
  checkGo() { if (this.phase === 'pick') super.checkGo(); }

  // ---------------- she tells the finished story ----------------
  // the camera moves in on the stands; card 1 plays, then each next card waits for her tap (soft pulse; the hand after
  // 3 s; it plays by itself after 4 s); the ending is spoken as the last card plays
  async complete() {
    this.phase = 'tell';
    this.busy = true;
    this.told = 0;
    this.hideQ();
    for (const c of this.cards) { input.remove(c.userData.drag); this.fadeAway(c, 0.5).then(() => this.drop(c)); } // the other story's card
    this.cards = [];
    await this.glide(this.storyCam, 0.9);
    if (this.dead) return;
    const list = this.placed.slice();
    this.told = 0;
    for (let i = 0; i < list.length; i++) {
      const c = list[i], last = i === list.length - 1;
      if (i > 0) { await this.waitTell(c); if (this.dead) return; }
      this.told = i + 1;
      if (last) {
        // the ending plays and is spoken; the next story starts while the shelf move is still going (rule: from her
        // last tap to the next thing she can touch, about 2 s)
        this.payoffP = Promise.all([this.actCard(c), this.wait(0.5)]);
        this.busy = false;
        this.success(c.position.clone().add(new T.Vector3(0, CARD.h * SK * 0.6, 0.6)), this.tale.line, { voice: true, still: 0.2 });
      } else {
        const line = this.tale.lines[c.userData.key];
        await Promise.all([this.actCard(c), line ? this.say(line, { max: 1.6 }) : null, this.wait(1.0)]);
        if (this.dead) return;
      }
    }
  }
  waitTell(c) {
    return new Promise((res) => {
      let done = false, stopHand = null;
      const go = () => {
        if (done) return;
        done = true;
        if (stopHand) stopHand();
        this.tellNext = null; this.tellGo = null;
        if (c.parent) c.scale.setScalar(SK);
        res();
      };
      this.tellNext = c; this.tellGo = go;
      // her turn: the hand shows her after 3 s; only after 8 s does the card play by itself
      this.s.wait(3).then(() => { if (!done && !this.dead) stopHand = fx.ghostPath([this.centre(c)], { mode: 'tap', maxDur: 1.0 }); });
      this.s.wait(8).then(go);
    });
  }

  // ---------------- the story is kept ----------------
  // the ending goes to the shelf and the earlier cards tuck away; the next story's cards come down 0.45 s in, once the
  // old cards have slid back off the stand tops (they never meet). Before the finale everything is let finish.
  async afterSuccess() {
    if (this.dead) return;
    this.phase = 'done';
    const clear = this.clearRound();
    if (this.round >= this.totalRounds) { await clear; return; }
    this.glide(CAMS.pick, 0.9); // the camera already backs off, so the next cards never come down cut by the frame
    await this.wait(0.45);
  }
  // the ending card goes onto the story shelf at the back and stays (tap it to see its moment again); the earlier
  // cards slide back off their stands and down behind them, out of the way. The stands stay for the next story.
  async clearRound() {
    const list = this.placed;
    this.placed = [];
    for (const s of this.slots) s.card = null;
    for (const c of list) input.remove(c.userData.tap);
    for (const c of this.cards) { input.remove(c.userData.drag); popOut(this.s, c, 0.3).then(() => this.drop(c)); }
    this.cards = [];
    const last = list[list.length - 1];
    const away = list.slice(0, -1).map((c, i) => this.s.wait(i * 0.12).then(() => this.putAway(c)));
    if (last) {
      await this.tray.add(last, { arc: 0.7 });
      if (!this.dead) this.pokeable(last, { fn: (o) => this.pokeCard(o) });
    }
    await this.alive(Promise.all(away));
  }
  putAway(c) {
    if (this.dead) return Promise.resolve();
    const a = c.position.clone(), k0 = c.scale.x, k1 = 0.4;
    const bz = STAND_Z - 0.5 * SK - 0.7;   // behind its stand, clear of the crate's back
    return this.s.anim(0.9, (_, p) => {
      const zb = sine(Math.min(1, p / 0.5)), yb = sine(Math.max(0, (p - 0.5) / 0.5));
      c.position.set(a.x, a.y * (1 - yb), a.z + (bz - a.z) * zb);
      c.scale.setScalar(k0 + (k1 - k0) * sine(Math.min(1, p / 0.6)));
      c.rotation.x = -Math.sin(Math.min(1, p / 0.5) * Math.PI) * 0.06;
    }).then(() => { c.rotation.x = 0; c.visible = false; }); // tucked away behind the crate
  }
  pokeCard(o) {
    input.press(o, 140);
    if (o.userData.acting) return;
    o.userData.acting = true;
    Promise.resolve(o.userData.act()).then(() => { o.userData.acting = false; });
  }
  drop(c) { if (c.parent) c.parent.remove(c); disposeTree(c); }

  // ---------------- the finale: the story shelf ----------------
  creationObjects() { return this.tray.items(); }
  // the whole shelf and Pip beside it, framed for this screen's shape (nothing cut at the edges)
  creationView() {
    const z = this.tray.group.position.z;
    const l = this.tray.spot(0).x - 2.7, r = this.tray.spot(this.totalRounds - 1).x + 1.1;
    const cx = (l + r) / 2, hw = (r - l) / 2;
    // the saved photo is the middle 4:3 of the screen, so the shelf and Pip must fit inside that part too
    const k = Math.tan((camera.fov * Math.PI) / 360) * camera.aspect * Math.min(1, 4 / 3 / camera.aspect);
    const d = Math.max(6.5, hw / k / 0.94);
    return { pos: new T.Vector3(cx, 1.2 + d * 0.17, z + d), look: new T.Vector3(cx, 1.2, z) };
  }
  onFinale() {
    // pokes on the shelf answer while answers are locked for the finale
    this.offs.push(input.onAny((e) => { if (!this.dead && input.locked() && e && e.clientX !== undefined) this.pokeAtPokeable(e.clientX, e.clientY); }));
    // the empty stands (props, not her work) step aside so nothing stands between the camera and her stories
    this.hideQ();
    for (const sl of this.slots) this.fadeAway(sl.stand, 0.5);
    // Pip walks over to stand beside the stories
    // (pipWatch must not turn him while he walks: it would restore his walking heading and leave his back to us)
    const p = this.tray.spot(0);
    this.watching = true;
    this.walkTo(this.pip, [p.x - 1.45, 0, p.z + 0.45], { speed: 2.4 }).then(() => { this.watching = false; });
  }

  // ---------------- hints ----------------
  right() { return this.cards.find((c) => c.userData.step === this.want()) || null; }
  nudgeTarget() { return this.phase === 'pick' ? this.right() : null; }
  // a stuck child: the right card gives a slow, quiet bob; at the second step it also glows (the hand demo is the
  // engine's, once, at the same step)
  nudge(step) {
    const c = this.nudgeTarget();
    if (!c) return hop(this.s, this.pip, 0.4, 0.6);
    const y0 = c.userData.home.y;
    this.s.anim(0.7, (_, p) => { if (this.cards.includes(c) && !input.dragging()) c.position.y = y0 + Math.sin(p * Math.PI) * 0.35; }).then(() => { if (this.cards.includes(c) && !input.dragging()) c.position.y = y0; });
    if (step >= 2) { const stop = fx.halo(c, 1.6); this.s.wait(3).then(stop); }
  }
  centre(c) { return c.position.clone().add(new T.Vector3(0, CARD.h * c.scale.y * 0.5, 0.4)); }
  // the slow hand: pick the card up, lift it, carry it onto the stand with the "?"
  showHint(glowOn = true) {
    const c = this.right(), z = this.slotZones()[0];
    if (!c || !z) return;
    if (glowOn) this.addHalo(c, 1.6);
    const a = this.centre(c);
    fx.ghostPath([a, a.clone().add(new T.Vector3(0, 1.0, -0.6)), z.pos], { mode: 'drag', maxDur: 3.6 });
  }
  choicePoints() { return this.cards.map((c) => this.centre(c)); }
  makeErrorless() { const c = this.right(); if (c) this.addHalo(c, 1.6); }

  // ---------------- feel: camera stations, the first slow hand demo ----------------
  feelInit() {
    this.taught = new Set();
    this.demoId = 0;
    this.touchedAt = 0;
    this.offs.push(input.onAny(() => { this.touchedAt = performance.now(); this.endDemo(); }));
  }
  // glide the camera to a station, eased (the latest glide wins)
  glide(c, dur = 0.85) {
    this.camTo = c;
    const id = (this.camId = (this.camId || 0) + 1);
    const p0 = camera.position.clone(), l0 = getLook().clone();
    if (p0.distanceTo(c.pos) < 0.01 && l0.distanceTo(c.look) < 0.01) return Promise.resolve();
    return this.s.anim(dur, (e) => { if (this.camId === id) setCamera(_cp.lerpVectors(p0, c.pos, e), _cl.lerpVectors(l0, c.look, e)); }, Ease.inOut);
  }
  // a slow hand demo on the real thing; any touch ends it
  demo(dur = 3.8) {
    if (this.dead) return;
    fx.clearHands();
    this.demoing = true;
    const id = ++this.demoId;
    this.showHint(true);
    this.s.wait(dur).then(() => { if (this.demoId === id) this.endDemo(); });
  }
  endDemo() { if (!this.demoing) return; this.demoing = false; this.demoId++; fx.clearHands(); }

  update(_dt, t) {
    // the question mark bobs gently on its stand
    if (this.q.visible && this.q.scale.x > 0.9) {
      const s = this.slots[this.si];
      if (s && this.phase === 'pick') { this.q.position.y = s.pos.y + 0.02 + Math.abs(Math.sin(t * 1.8)) * 0.1; this.q.rotation.y = Math.sin(t * 1.1) * 0.3; }
    }
    // while she tells the story, the card that waits for her tap breathes
    const c = this.tellNext;
    if (c && !c.userData.acting) c.scale.setScalar(SK * (1 + Math.sin(t * 4.2) * 0.035));
  }
}
