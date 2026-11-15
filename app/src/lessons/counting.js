// Lesson 2 — Apple count. Topics mt_WcfaSfVT33 "One-to-one counting" and mt_dmNvjroCPT "How many in total?".
// Tap each fruit once: it flies into the basket as its numeral pops up. The last numeral is shown big as the total.
// Every round the fruit hangs somewhere new (tree, bush, picnic blanket, balloons); Hedgehog watches every fruit,
// then eats them in its own way each round. One round has a worm surprise.
import * as T from '../three.js';
import { Lesson } from '../engine/lesson.js';
import { makeAnimal, popIn, popOut, hop, wiggle, setFace } from '../engine/actors.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';
import { makeFruit, makeBasket, makeWorm, makeHost } from './counting-hosts.js';

const WORDS = ['One', 'Two', 'Three', 'Four', 'Five'];
const NUM_COL = ['#ff5a5a', '#ff9f3f', '#5fd068', '#4a90ff', '#a77bff'];
const BASKET = new T.Vector3(0, 0, 3.2);
const HOG_HOME = new T.Vector3(4.6, 0, 2.6);
const HOG_RY = -0.6;
const EATS = ['trot', 'roll', 'leap'];
const WORM_ROUND = 3;
const tmp = new T.Vector3();

export default class CountingLesson extends Lesson {
  build() {
    const L = this.level;
    // [count, fruit, layout, host] — counts and fruit unchanged; the host changes every round
    this.plan = L === 0
      ? [[1, 'apple', null, 'tree'], [2, 'apple', null, 'bush'], [3, 'apple', null, 'blanket'], [2, 'orange', null, 'balloons'], [3, 'pear', null, 'tree'], [3, 'apple', 'arc', 'bush']]
      : L === 1
        ? [[2, 'apple', null, 'tree'], [3, 'apple', null, 'balloons'], [3, 'orange', null, 'blanket'], [4, 'pear', null, 'bush'], [3, 'plum', 'arc', 'tree'], [4, 'apple', null, 'balloons']]
        : [[3, 'apple', null, 'tree'], [4, 'orange', null, 'blanket'], [3, 'pear', 'scatter', 'balloons'], [4, 'plum', 'scatter', 'bush'], [5, 'apple', null, 'blanket'], [4, 'orange', 'scatter', 'tree']];
    this.basket = makeBasket();
    this.basket.position.copy(BASKET);
    this.root.add(this.basket);
    this.hog = makeAnimal('hedgehog');
    this.hog.position.copy(HOG_HOME);
    this.hog.rotation.y = HOG_RY;
    this.root.add(this.hog);
    this.hogLook = null;
    this.fruits = [];
    this.trees = 0;
  }

  async startRound(r) {
    const [n, kind, layout, hostKind] = this.plan[r];
    this.n = n; this.kind = kind; this.count = 0;
    // tidy up the last round (fruit eaten, worm gone, hedgehog back home)
    for (const q of this.fruits) this.root.remove(q);
    if (this.worm) { this.root.remove(this.worm); this.worm = null; }
    if (this.hog.userData.eating) this.homeLater = true; else this.hogHome();
    // swap the host: the old one pops away as the new one springs up
    const old = this.host;
    if (old) popOut(this.s, old.obj, 0.2).then(() => this.root.remove(old.obj));
    const host = makeHost(hostKind, hostKind === 'tree' ? this.trees++ % 2 : 0);
    this.host = host;
    this.root.add(host.obj);
    popIn(this.s, host.obj, host.obj.scale.x, 0.45, { sound: false });
    if (hostKind === 'bush') sfx.rustle(); else if (hostKind === 'balloons') sfx.whoosh(); else if (hostKind === 'blanket') sfx.swoosh(); else sfx.sparkle();

    this.fruits = [];
    const slots = host.slots(n, layout);
    for (let i = 0; i < n; i++) {
      const f = makeFruit(kind);
      if (host.decorate) host.decorate(f, i);
      f.position.copy(slots[i]);
      f.userData.home = f.position.clone();
      f.userData.ph = i * 1.3;
      f.scale.setScalar(0.001);
      this.root.add(f);
      this.fruits.push(f);
      if (hostKind === 'balloons') {
        // balloons drift up from below
        const y = f.position.y;
        f.position.y = -2;
        f.scale.setScalar(1);
        this.s.wait(i * 0.07).then(() => this.s.tween(f.position, { y }, 0.55, Ease.out));
      } else popIn(this.s, f, 1, 0.4, { sound: i === 0 }).catch(() => {});
      f.userData.tap = input.addTap(f, { radius: 0.85, onTap: () => this.tapFruit(f) });
    }
    this.hogLook = null;
    // the prompt starts right away; the very first round waits until the fruit is in place for the demo
    if (this.demoDone) { this.cue(); return; }
    await this.wait(0.45 + n * 0.07);
    this.cue();
  }

  promptText() { return `Count the ${this.kind === 'apple' ? 'apples' : this.kind + 's'}!`; }

  hogHome() {
    const h = this.hog;
    setFace(h.userData.face, 'happy');
    h.rotation.z = 0;
    h.scale.setScalar(h.userData.baseScale ?? 1);
    this.s.tween(h.position, { x: HOG_HOME.x, y: 0, z: HOG_HOME.z }, 0.45, Ease.inOut);
  }

  update(dt, t) {
    // balloons bob, fruit on the tree sways
    for (const f of this.fruits) {
      if (f.userData.counted) continue;
      const b = f.userData.balloon;
      if (b) { b.rotation.z = Math.sin(t * 1.6 + f.userData.ph) * 0.12; b.position.y = 1.95 + Math.sin(t * 1.8 + f.userData.ph) * 0.1; }
      else if (this.host?.kind === 'tree') f.rotation.z = Math.sin(t * 2 + f.userData.ph) * 0.06;
    }
    // Hedgehog keeps an eye on the fruit (turns toward what was just tapped, or the next one)
    const h = this.hog;
    if (!h.userData.eating) {
      const look = this.hogLook || this.fruits.find((f) => !f.userData.counted);
      let ry = HOG_RY;
      if (look) { look.getWorldPosition(tmp); ry = Math.atan2(tmp.x - h.position.x, tmp.z - h.position.z + 3) * 0.8; }
      h.rotation.y += (ry - h.rotation.y) * Math.min(1, dt * 6);
      // sniff sniff
      if (h.userData.head) h.userData.head.rotation.x = Math.max(0, Math.sin(t * 9)) * 0.05 * (Math.sin(t * 0.7) > 0.6 ? 1 : 0);
    }
  }

  async tapFruit(f) {
    if (f.userData.counted || this.busy) return;
    f.userData.counted = true;
    input.remove(f.userData.tap);
    this.clearHints();
    const i = this.count++;
    sfx.note(i);
    const last = this.count === this.n;
    // the numeral pops up big over the fruit (no voice: the numeral carries the count)
    f.getWorldPosition(tmp);
    fx.float(tmp.clone().add(new T.Vector3(0, 0.9, 0)), String(i + 1), { color: NUM_COL[i], size: 11 });
    this.release(f, i);
    // Hedgehog follows it with its eyes and gets more excited with every fruit
    this.hogLook = f;
    if (!this.hog.userData.eating) {
      setFace(this.hog.userData.face, 'scared'); // big wide "ooh" eyes
      this.s.wait(0.35).then(() => { if (!this.hog.userData.eating) setFace(this.hog.userData.face, 'happy'); });
      hop(this.s, this.hog, 0.18 + i * 0.07, 0.3);
      if (i % 2) sfx.squeak();
    }
    if (!last) { this.say(`${WORDS[i]}!`); return; }

    // last one: the total shows big while the fruit lands, a quick recount, Hedgehog eats — no dead air
    const n = this.n, round = this.round;
    this.success(new T.Vector3(BASKET.x, 2, BASKET.z), `${WORDS[n - 1]}!`);
    this.s.wait(0.42).then(() => {
      fx.float(new T.Vector3(BASKET.x, 2.8, BASKET.z), String(n), { color: '#ffd23f', size: 20 });
      sfx.twinkle();
      this.fruits.forEach((q, k) => this.s.wait(k * 0.08).then(() => { hop(this.s, q, 0.3, 0.2); sfx.note(k); }));
    });
    this.eat(round).then(() => { if (this.homeLater) { this.homeLater = false; this.hogHome(); } });
  }

  // How a tapped fruit leaves its host and lands in the basket (≈0.45 s).
  async release(f, i) {
    const s = this.s, kind = this.host.kind;
    const slot = new T.Vector3(BASKET.x + (i - (this.n - 1) / 2) * 0.55, 1.25 + (i % 2) * 0.08, BASKET.z + (i % 2 ? -0.25 : 0.2));
    f.rotation.z = 0;
    if (kind === 'balloons' && f.userData.balloon) {
      // POP! the balloon bursts and the fruit drops
      const b = f.userData.balloon;
      sfx.pop();
      f.getWorldPosition(tmp);
      fx.confetti(tmp.clone().add(new T.Vector3(0, 1.9, 0)), 10);
      await s.anim(0.08, (_, p) => b.scale.setScalar(1 + p * 0.4));
      f.remove(b);
      f.userData.balloon = null;
    } else if (kind === 'bush') {
      sfx.rustle();
      wiggle(s, this.host.obj, 0.03, 0.3);
      const y0 = f.position.y;
      await s.tween(f.position, { y: y0 + 0.8 }, 0.12, Ease.out);
    } else if (kind === 'tree') {
      // a little pluck: stretch down, snap
      await s.anim(0.1, (_, p) => f.scale.set(1 - p * 0.1, 1 + p * 0.15, 1 - p * 0.1));
      f.scale.setScalar(1);
      wiggle(s, this.host.obj, 0.015, 0.3);
      sfx.tick();
    }
    const from = f.position.clone();
    const arc = kind === 'blanket' ? 1.8 : 1.2;
    await s.anim(0.38, (e) => {
      f.position.lerpVectors(from, slot, e);
      f.position.y += Math.sin(e * Math.PI) * arc;
      f.rotation.z = e * Math.PI * 2;
    }, Ease.inOut);
    f.rotation.z = 0;
    f.position.copy(slot);
    sfx.pop();
    const b = this.basket;
    s.anim(0.2, (_, p) => { const k = Math.sin(p * Math.PI) * 0.08; b.scale.set(1 + k, 1 - k, 1 + k); }).then(() => b.scale.setScalar(1));
  }

  // Hedgehog's payoff, different each round (≈0.9 s, runs during the praise).
  async eat(round) {
    const s = this.s, h = this.hog, u = h.userData;
    u.eating = true;
    const how = round === WORM_ROUND ? 'worm' : EATS[round % EATS.length];
    const spot = new T.Vector3(BASKET.x + 2.0, 0, BASKET.z - 0.1);
    h.rotation.y = -1.2;
    await s.wait(0.2);
    if (how === 'worm') this.wormGag();
    if (how === 'roll') {
      // curls into a spiky ball and rolls over
      sfx.boing2();
      await s.anim(0.36, (e, p) => {
        h.position.x = HOG_HOME.x + (spot.x - HOG_HOME.x) * e;
        h.position.z = HOG_HOME.z + (spot.z - HOG_HOME.z) * e;
        h.rotation.z = e * Math.PI * 2;
        const k = 1 - Math.sin(p * Math.PI) * 0.3;
        h.scale.set(1.1, k, 1.1);
      }, Ease.inOut);
      h.rotation.z = 0; h.scale.setScalar(1);
    } else if (how === 'leap') {
      // a big excited leap
      sfx.highBoing();
      await s.anim(0.36, (e, p) => {
        h.position.x = HOG_HOME.x + (spot.x - HOG_HOME.x) * e;
        h.position.z = HOG_HOME.z + (spot.z - HOG_HOME.z) * e;
        h.position.y = Math.sin(p * Math.PI) * 1.4;
      });
      h.position.y = 0;
      sfx.land();
    } else {
      // trot trot trot
      sfx.patter();
      await s.anim(0.36, (e, p) => {
        h.position.x = HOG_HOME.x + (spot.x - HOG_HOME.x) * e;
        h.position.z = HOG_HOME.z + (spot.z - HOG_HOME.z) * e;
        h.position.y = Math.abs(Math.sin(p * Math.PI * 4)) * 0.15;
      });
      h.position.y = 0;
    }
    if (this.dead) return;
    if (how === 'worm') {
      // the worm got there first! Hedgehog jumps back in surprise, then giggles
      setFace(u.face, 'scared');
      sfx.gasp();
      await s.anim(0.3, (_, p) => { h.position.x = spot.x + Math.sin(p * Math.PI / 2) * 0.8; h.position.y = Math.sin(p * Math.PI) * 0.6; });
      h.position.y = 0;
      setFace(u.face, 'happy');
      sfx.giggle();
    } else {
      // CHOMP: the fruit vanishes, cheeks puff, a happy wiggle
      sfx.chomp();
      for (const q of this.fruits) s.tween(q.scale, { x: 0.001, y: 0.001, z: 0.001 }, 0.2, Ease.in);
      fx.float(new T.Vector3(spot.x, 2.0, spot.z), '♥', { color: '#ff7aa8', size: 7 });
      await s.anim(0.25, (_, p) => { const k = Math.sin(p * Math.PI) * 0.18; h.scale.set(1 + k, 1 - k * 0.5, 1 + k); });
      h.scale.setScalar(1);
      sfx.mmm();
      wiggle(s, h, 0.2, 0.35);
    }
    u.eating = false;
  }

  wormGag() {
    const w = makeWorm();
    w.position.set(BASKET.x - 0.3, 0.7, BASKET.z);
    w.scale.setScalar(0.001);
    this.root.add(w);
    this.worm = w;
    const s = this.s, segs = w.userData.segs;
    sfx.squeak();
    s.anim(0.3, (_, p) => { w.scale.setScalar(Math.max(0.001, Ease.back(p) * 0.9)); w.position.y = 0.7 + p * 0.4; });
    // wiggle-waggle, gobble the fruit, wave, dive back down
    s.anim(1.1, (_, p) => {
      segs.forEach((q, k) => { q.position.x = Math.sin(p * 14 - k * 0.9) * 0.08; });
      w.userData.head.position.x = Math.sin(p * 14 - 4 * 0.9) * 0.1;
      w.rotation.z = Math.sin(p * 10) * 0.2;
    });
    s.wait(0.4).then(() => {
      sfx.chomp();
      for (const q of this.fruits) s.tween(q.scale, { x: 0.001, y: 0.001, z: 0.001 }, 0.2, Ease.in);
      fx.float(new T.Vector3(BASKET.x, 2.6, BASKET.z), '♥', { color: '#ff7aa8', size: 7 });
    });
    s.wait(0.9).then(() => { if (this.worm === w) { sfx.boing2(); s.tween(w.position, { y: -0.6 }, 0.3, Ease.in); } });
  }

  showHint(glow = true) {
    const next = this.fruits.find((f) => !f.userData.counted);
    if (!next) return;
    if (glow) this.addHalo(next, 0.85);
    wiggle(this.s, next, 0.4, 0.8);
    fx.ghostHand(next.position.clone());
  }

  onFinale() {
    hop(this.s, this.hog, 0.8).then(() => hop(this.s, this.hog, 0.8));
  }
}
