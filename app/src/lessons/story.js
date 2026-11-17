// What happens next? (World 3: the farm). Topics mt_VEwM7ClYYE "Story sequence and central message",
// mt_-vvVxpOHG2 "Ordering events in time" and mt_8-POYyg7GJ "Predicting what happens next".
// Little picture stories told with 3D story cards: each card is a chunky shadow-box frame with a tiny scene inside
// (an egg in a nest, a seed in the soil, a caterpillar on a leaf…). A row of wooden crate stands, numbered with one,
// two, three (four) dice dots, holds the story in order; the cards to choose from stand on the grass in front. Tap a
// card (or drag it up to the stands) and it flies onto the next stand. A wrong card wiggles and hops back.
// When the story is complete it plays in order, card by card: the egg wobbles, cracks, the chick hops out and cheeps.
// Six stories (chick hatching, seed to flower, caterpillar to butterfly, apple tree to Bunny's snack, sun, rain and
// rainbow, Piggy's mud bath), each round a new one.
// Levels:
//   L1  the first two cards are already on the stands; tap what comes next (two choices).
//   L2  three empty stands: put three cards in order.
//   L3  four stands: put three cards in order, then predict the ending (two choices).
//
// Test hooks: phase ('pick' while waiting for a card), cards (the cards on the grass, c.userData.step),
// want() (the step id the next stand needs), choose(card) (as if the child tapped it).
import * as T from '../three.js';
import { Lesson, shuffle } from '../engine/lesson.js';
import { popIn, popOut } from '../engine/actors.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { setCamera, project } from '../engine/stage.js';
import { Ease } from '../engine/tween.js';
import { disposeTree } from '../engine/toon.js';
import { makeCard, makeStand, makeQMark, CARD, STAND_TOP } from './story-props.js';
import { TALES, TALE_IDS } from './story-tales.js';

const CAM = { pos: new T.Vector3(1.0, 6.6, 13.6), look: new T.Vector3(1.0, 1.75, 0) };
const XC = 1.0;             // the middle of the stands and of the choices
const STAND_Z = -0.8;
const GAP = 0.32;           // the gap between two stands
const CH_Z = 4.4;           // the choice row on the grass
const CH_S = 0.84;          // a choice card's size
const CH_GAP = 2.9;
const CARD_Z = 0.05;        // a card's centre on its stand (stand-relative)

export default class StoryLesson extends Lesson {
  build() {
    setCamera(CAM.pos, CAM.look);
    this.pip.position.set(-5.1, 0, 1.0); // (in from the left edge: the hat brim was clipped by the frame)
    this.pip.rotation.y = 0.5;
    // three big stands (Levels 1 and 2) or four (Level 3); the cards on them are this size too
    const n = this.level === 2 ? 4 : 3;
    const k = (this.SK = n === 4 ? 1.0 : 1.12), step = CARD.w * k + GAP;
    this.slots = [];
    for (let i = 0; i < n; i++) {
      const x = XC + (i - (n - 1) / 2) * step;
      const st = makeStand(i + 1);
      st.position.set(x, 0, STAND_Z);
      st.scale.setScalar(k);
      this.root.add(st);
      this.slots.push({ x, stand: st, card: null, pos: new T.Vector3(x, STAND_TOP * k, STAND_Z + CARD_Z * k) });
    }
    this.q = makeQMark();
    this.q.visible = false;
    this.root.add(this.q);
    this.q.userData.tap = input.addTap(this.q, { radius: 0.7, offset: new T.Vector3(0, 0.5, 0), onTap: () => this.tapQ() });
    this.cards = [];      // choices on the grass
    this.placed = [];     // cards on the stands, in order
    this.phase = 'idle';
    // a fresh order of stories every game; level 3 tells the long versions
    this.tales = shuffle(TALE_IDS).map((id) => TALES[id]);
    this.qT = 0;
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
    return s ? [{ pos: s.pos.clone().add(new T.Vector3(0, (CARD.h / 2) * this.SK, 0)), radius: 1.6, slot: this.si }] : [];
  }
  lift(c, on) { this.s.tween(c.scale, { x: CH_S * (on ? 1.08 : 1), y: CH_S * (on ? 1.08 : 1), z: CH_S * (on ? 1.08 : 1) }, 0.12); }
  dropCard(c, zone, tapped) {
    this.lift(c, false);
    if (this.phase !== 'pick' || this.dead || this.demoing) { this.goHome(c); return; }
    if (zone || tapped) this.choose(c);
    else this.goHome(c);
  }
  goHome(c, dur = 0.3) {
    const a = c.position.clone(), b = c.userData.home;
    if (a.distanceTo(b) < 0.01) return Promise.resolve();
    return this.s.anim(dur, (e, p) => { c.position.lerpVectors(a, b, e); c.position.y += Math.sin(p * Math.PI) * 0.4; }, Ease.out)
      .then(() => { c.position.copy(b); c.rotation.z = 0; sfx.land(); });
  }

  // ---------------- choosing ----------------
  choose(c) {
    if (this.phase !== 'pick' || this.dead || !this.cards.includes(c)) return;
    this.idle = 0;
    this.demoDone = true;
    fx.clearHands();
    if (c.userData.step === this.want()) this.place(c);
    else this.wrong(c);
  }
  wrong(c) {
    const lines = this.predicting || this.level === 0 ? ['Hmm, not that one!', 'Look again!'] : this.si === 0 ? ['Not yet! What comes first?'] : ['Not yet! What comes next?'];
    this.redirect(lines[this.cur.wrong % lines.length]);
    // a little "no" wiggle, then it hops back to its spot
    this.goHome(c, 0.25).then(() => {
      const r0 = c.userData.ry;
      this.s.anim(0.4, (_, p) => { c.rotation.y = r0 + Math.sin(p * Math.PI * 4) * 0.25 * (1 - p); }).then(() => { c.rotation.y = r0; });
    });
  }
  async place(c) {
    this.phase = 'fly';
    this.clearHints();
    input.remove(c.userData.drag);
    this.cards = this.cards.filter((x) => x !== c);
    const slot = this.slots[this.si];
    this.si++;
    this.oi++;
    sfx.swoosh();
    // the question mark hops on to the next stand while the card flies in
    if (this.oi < this.order.length || (this.level === 2 && !this.predicting)) this.moveQ(); else this.hideQ();
    await this.flyTo(c, slot);
    if (this.dead) return;
    this.seat(c, slot);
    // the card shows its little scene once
    c.userData.act();
    if (this.oi < this.order.length) {
      this.phase = 'pick';
      this.prompt();
    } else if (this.level === 2 && !this.predicting) this.predict();
    else this.complete();
  }
  flyTo(c, slot, dur = 0.5) {
    const a = c.position.clone(), b = slot.pos, k0 = c.scale.x, ry0 = c.rotation.y;
    const h = 1.8 + Math.abs(a.x - b.x) * 0.1;
    return this.s.anim(dur, (e, p) => {
      c.position.lerpVectors(a, b, e);
      c.position.y += Math.sin(p * Math.PI) * h;
      c.scale.setScalar(k0 + (this.SK - k0) * e);
      c.rotation.y = ry0 * (1 - e);
      c.rotation.z = Math.sin(p * Math.PI) * 0.12;
    }, Ease.inOut).then(() => { c.position.copy(b); c.scale.setScalar(this.SK); c.rotation.set(0, 0, 0); });
  }
  // a card lands on its stand: thunk, squash, and it becomes tappable (tap it to see its little scene again)
  seat(c, slot) {
    slot.card = c;
    this.placed.push(c);
    sfx.thunk();
    const k = this.SK;
    c.scale.setScalar(k);
    this.s.anim(0.22, (_, p) => { const w = Math.sin(p * Math.PI) * (1 - p * 0.5); c.scale.set(k * (1 + 0.05 * w), k * (1 - 0.1 * w), k * (1 + 0.05 * w)); }).then(() => c.scale.setScalar(k));
    c.userData.tap = input.addTap(c, { radius: 1.15 * k, offset: new T.Vector3(0, (CARD.h / 2) * k, 0), onTap: () => this.tapPlaced(c) });
  }
  tapPlaced(c) {
    if (this.dead || c.userData.acting) return;
    c.userData.acting = true;
    const k = this.SK;
    this.s.anim(0.3, (_, p) => c.scale.setScalar(k * (1 + Math.sin(p * Math.PI) * 0.05))).then(() => c.scale.setScalar(k));
    Promise.resolve(c.userData.act()).then(() => { c.userData.acting = false; });
  }

  // ---------------- the question mark on the next stand ----------------
  moveQ() {
    const s = this.slots[this.si];
    if (!s) { this.hideQ(); return; }
    const q = this.q, to = s.pos.clone().add(new T.Vector3(0, 0.05, 0.2));
    if (!q.visible) { q.position.copy(to); popIn(this.s, q, 1.15, 0.35, { sound: false }); return; }
    const a = q.position.clone();
    this.s.anim(0.3, (e, p) => { q.position.lerpVectors(a, to, e); q.position.y += Math.sin(p * Math.PI) * 0.8; }, Ease.out).then(() => q.position.copy(to));
  }
  hideQ() { if (this.q.visible) popOut(this.s, this.q, 0.18); }
  tapQ() { if (this.phase !== 'pick') return; sfx.boing(); this.prompt(); this.nudge(1); }

  // ---------------- rounds ----------------
  async startRound(r) {
    this.busy = true;
    this.phase = 'deal';
    const tale = (this.tale = this.tales[r % this.tales.length]);
    const keys = (this.keys = this.level === 2 ? tale.four : tale.three);
    this.predicting = false;
    this.si = 0;
    this.oi = 0;
    if (this.level === 0) {
      // the first two cards drop onto their stands; you choose the third
      for (let i = 0; i < 2; i++) {
        const c = this.newCard(tale, keys[i]), slot = this.slots[i];
        c.position.copy(slot.pos).add(new T.Vector3(0, 6, 0));
        c.scale.setScalar(this.SK);
        this.s.wait(0.1 + i * 0.16).then(() => this.dropIn(c, slot));
      }
      this.si = 2;
      this.order = [tale.id + ':' + keys[2]];
      await this.wait(0.3);
      this.deal([keys[2]], tale, true);
    } else {
      this.order = keys.slice(0, 3).map((k) => tale.id + ':' + k);
      this.deal(keys.slice(0, 3), tale, false);
    }
    await this.wait(0.35);
    if (this.dead) return;
    this.moveQ();
    this.phase = 'pick';
    this.busy = false;
    this.cue();
  }
  dropIn(c, slot) {
    if (this.dead) return;
    const a = c.position.clone(), b = slot.pos;
    sfx.swoosh();
    this.s.anim(0.4, (e) => { c.position.lerpVectors(a, b, e); }, Ease.in).then(() => { c.position.copy(b); this.seat(c, slot); });
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
      this.s.wait(0.08 + i * 0.12).then(() => { if (!this.dead) popIn(this.s, c, CH_S, 0.4, { sound: i === 0 }); });
    });
  }
  // the wrong choice: the same moment from a different story (an ending for an ending, so it looks just as finished)
  otherCard(tale, key) {
    const keys = this.level === 2 ? tale.four : tale.three;
    const idx = keys.indexOf(key);
    const others = TALE_IDS.filter((id) => id !== tale.id);
    this.otherI = ((this.otherI ?? Math.floor(Math.random() * others.length)) + 1) % others.length;
    const ot = TALES[others[this.otherI]], ok = ot.four.length === keys.length ? ot.four : ot.three;
    return { tale: ot, k: ok[Math.min(idx, ok.length - 1)] };
  }
  // Level 3: after three in order, what happens at the end?
  async predict() {
    this.predicting = true;
    this.phase = 'deal';
    this.order = [this.tale.id + ':' + this.keys[3]];
    this.oi = 0;
    await this.wait(0.35);
    if (this.dead) return;
    this.deal([this.keys[3]], this.tale, true);
    await this.wait(0.5);
    if (this.dead) return;
    this.phase = 'pick';
    this.prompt();
  }
  promptText() {
    if (this.phase === 'deal' && !this.order) return '';
    if (this.level === 0 || this.predicting) return this.predicting ? 'What happens at the end?' : 'What happens next?';
    return this.si === 0 ? 'What happens first?' : 'What happens next?';
  }
  prompt() { const t = this.promptText(); if (t) this.say(t, { max: 1.4 }); }

  // ---------------- the finished story plays ----------------
  complete() {
    this.phase = 'done';
    this.hideQ();
    const list = this.placed.slice();
    const per = 0.36;
    // card by card, left to right: it lifts, rings a rising note and acts out its moment
    this.playing = new Promise((res) => {
      list.forEach((c, i) => this.s.wait(0.1 + i * per).then(() => {
        if (this.dead) return;
        sfx.note(i * 2);
        const k = this.SK, y0 = c.position.y;
        this.s.anim(0.36, (_, p) => { c.scale.setScalar(k * (1 + Math.sin(p * Math.PI) * 0.09)); c.position.y = y0 + Math.sin(p * Math.PI) * 0.25; }).then(() => { c.scale.setScalar(k); c.position.y = y0; });
        c.userData.act();
        const sc = project(c.position.clone().add(new T.Vector3(0, CARD.h * this.SK, 0)));
        fx.sparkle(sc.x, sc.y);
      }));
      this.s.wait(0.1 + list.length * per + 0.12).then(res);
    });
    const last = list[list.length - 1];
    this.success(last.position.clone().add(new T.Vector3(0, CARD.h * this.SK + 0.3, 0.6)), this.tale.line);
  }
  async afterSuccess() {
    await this.alive(this.playing);
    if (this.dead) return;
    this.clearRound();
    await this.wait(0.12);
  }
  // the story cards fly straight up off their stands one after another (like pages lifting away), any card left on
  // the grass pops; the stands stay for the next story
  clearRound() {
    sfx.whoosh();
    this.placed.forEach((c, i) => {
      input.remove(c.userData.tap);
      const a = c.position.clone(), sp = i % 2 ? 1 : -1;
      this.s.wait(i * 0.07).then(() => this.s.anim(0.42, (e, p) => {
        c.position.set(a.x, a.y - Math.sin(Math.min(1, p * 4) * Math.PI) * 0.12 + e * 9, a.z);
        c.rotation.z = sp * e * 0.35;
      }, Ease.in)).then(() => this.drop(c));
    });
    for (const c of this.cards) { input.remove(c.userData.drag); popOut(this.s, c, 0.2).then(() => this.drop(c)); }
    this.placed = [];
    this.cards = [];
    for (const s of this.slots) s.card = null;
  }
  drop(c) { if (c.parent) c.parent.remove(c); disposeTree(c); }

  // ---------------- hints ----------------
  right() { return this.cards.find((c) => c.userData.step === this.want()) || null; }
  nudgeTarget() { return this.phase === 'pick' ? this.right() : null; }
  nudge(step) {
    const c = this.nudgeTarget();
    if (!c) return super.nudge(step);
    sfx.boing();
    const y0 = c.userData.home.y;
    this.s.anim(0.45, (_, p) => { if (this.cards.includes(c) && !input.dragging()) c.position.y = y0 + Math.sin(p * Math.PI) * 0.45; }).then(() => { if (this.cards.includes(c)) c.position.y = y0; });
    if (step >= 2) { const stop = fx.halo(c, 1.6); this.s.wait(3).then(stop); }
  }
  centre(c) { return c.position.clone().add(new T.Vector3(0, CARD.h * c.scale.y * 0.5, 0.4)); }
  showHint(glowOn = true) {
    const c = this.right(), z = this.slotZones()[0];
    if (!c || !z) return;
    if (glowOn) this.addHalo(c, 1.6);
    fx.ghostPath([this.centre(c), z.pos], { mode: 'drag' });
  }
  choicePoints() { return this.cards.map((c) => this.centre(c)); }
  makeErrorless() { const c = this.right(); if (c) this.addHalo(c, 1.6); }

  update(dt, t) {
    // the question mark bobs and turns a little
    if (this.q.visible && this.q.scale.x > 0.9) {
      const s = this.slots[this.si];
      if (s && this.phase === 'pick') { this.q.position.y = s.pos.y + 0.05 + Math.abs(Math.sin(t * 3)) * 0.18; this.q.rotation.y = Math.sin(t * 1.6) * 0.35; }
    }
  }
}
