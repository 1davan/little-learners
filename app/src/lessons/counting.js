// Lesson 2 — Apple count. Topics mt_WcfaSfVT33 "One-to-one counting" and mt_dmNvjroCPT "How many in total?".
// Tap each thing once: its numeral pops up and it tumbles (real physics) into the container, piling up.
// The last numeral is shown big as the total, the pile jumps once per number (a recount), then a friend eats them.
// Each level is its own little world: L1 the orchard (Hedgehog, apples, a wicker basket), L2 the berry patch
// (Bunny, strawberries and berries, a blue pail), L3 the tea party (Bear, cookies, cupcakes, donuts, a mixing bowl).
// Every round has a new host (tree, bush, patch, balloons, table, cake stand…) and a twist (ladybug, frog visitor,
// golden one, super-bouncy, worm), and the payoff rotates (trot, leap, roll, juggle, dance, worm steals it).
import * as T from '../three.js';
import { Lesson } from '../engine/lesson.js';
import { makeAnimal, popIn, popOut, hop, wiggle, dance, setFace } from '../engine/actors.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';
import { physics } from '../engine/physics.js';
import { makeWorm, makeHost } from './counting-hosts.js';
import { makeItem, makeLadybug, makeContainer, PLURAL } from './counting-items.js';
import { frame, calmBackdrop, isTree } from './view-tools.js';
import { camera, getLook } from '../engine/stage.js';

// Camera per host so the things to count are big: high for the tree's fruit, low for the blanket / patch / tray.
const CAMS = {
  tree: [0, 4.3, 13.6, 0, 3.3, 0], balloons: [0, 4.1, 13.6, 0, 2.9, 0],
  blanket: [0, 5.2, 13.6, 0, 1.0, 2.4], tray: [0, 5.2, 13.6, 0, 1.0, 2.4], patch: [0, 5.2, 13.6, 0, 1.0, 2.4],
  other: [0, 3.6, 13, 0, 2.1, 0],
};

const WORDS = ['One', 'Two', 'Three', 'Four', 'Five'];
const NUM_COL = ['#ff5a5a', '#ff9f3f', '#5fd068', '#4a90ff', '#a77bff'];
const BOX = new T.Vector3(0, 0, 3.2);
const HOME = new T.Vector3(3.9, 0, 2.7); // close to the container, so the eater walks (not slides) over at ~3 units/s
const HOME_RY = -0.6;
const tmp = new T.Vector3();

// Per level: who eats, what they eat from, and 6 rounds. Counts are the learning plan (L1 to 3, L2 to 4, L3 to 5).
// host: tree | blossom | bush | patch | balloons | blanket | table | stand | tray
// twist: ladybug (sits on one, flies off) | frog (a visitor watches and cheers) | golden (one sparkly one) | bouncy | worm
// pay: trot | leap | roll | spin | juggle | worm
export const PLANS = [
  { eater: 'hedgehog', scale: 1, box: 'basket', rounds: [
    { n: 1, item: 'apple', host: 'tree', pay: 'trot' },
    { n: 2, item: 'apple', host: 'bush', twist: 'ladybug', pay: 'juggle' },
    { n: 3, item: 'pear', host: 'blossom', twist: 'bouncy', pay: 'roll' },
    { n: 2, item: 'orange', host: 'balloons', twist: 'frog', pay: 'leap' },
    { n: 3, item: 'plum', host: 'blanket', pay: 'worm' },
    { n: 3, item: 'apple', host: 'tree', layout: 'arc', twist: 'golden', pay: 'spin' },
  ] },
  { eater: 'bunny', scale: 0.9, box: 'pail', rounds: [
    { n: 2, item: 'strawberry', host: 'patch', pay: 'leap' },
    { n: 3, item: 'blueberry', host: 'bush', twist: 'ladybug', pay: 'juggle' },
    { n: 3, item: 'cherry', host: 'blossom', twist: 'bouncy', pay: 'spin' },
    { n: 4, item: 'strawberry', host: 'patch', layout: 'scatter', pay: 'worm' },
    { n: 3, item: 'lemon', host: 'balloons', layout: 'arc', twist: 'frog', pay: 'leap' },
    { n: 4, item: 'strawberry', host: 'patch', layout: 'arc', twist: 'golden', pay: 'trot' },
  ] },
  { eater: 'bear', scale: 0.78, box: 'bowl', rounds: [
    { n: 3, item: 'cookie', host: 'table', pay: 'trot' },
    { n: 4, item: 'cupcake', host: 'stand', twist: 'ladybug', pay: 'leap' },
    { n: 3, item: 'donut', host: 'balloons', layout: 'scatter', twist: 'frog', pay: 'juggle' },
    { n: 4, item: 'cookie', host: 'tray', layout: 'scatter', twist: 'bouncy', pay: 'spin' },
    { n: 5, item: 'cupcake', host: 'table', twist: 'golden', pay: 'trot' },
    { n: 4, item: 'sweet', host: 'stand', twist: 'ladybug', pay: 'leap' },
  ] },
];
const HOST_SND = { tree: 'sparkle', blossom: 'twinkle', bush: 'rustle', patch: 'rustle', balloons: 'whoosh', blanket: 'swoosh', table: 'swoosh', stand: 'twinkle', tray: 'thunk' };

// A physics cup built from static boxes: an octagon floor and a ring of tangent walls.
// (physics.container's walls come out rotated radially, leaving gaps, so this lesson builds its own.)
function cup(pos, r, h, n = 16, wall = 0.3) {
  const seg = (2 * Math.PI * (r + wall / 2)) / n;
  for (const a of [0, Math.PI / 4]) physics.box(new T.Vector3(pos.x, pos.y - 0.1, pos.z), new T.Vector3(r * 2, 0.2, r * 2 * 0.83), a);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    physics.box(new T.Vector3(pos.x + Math.sin(a) * (r + wall / 2), pos.y + h / 2, pos.z + Math.cos(a) * (r + wall / 2)), new T.Vector3(seg * 1.15, h, wall), a);
  }
}

export default class CountingLesson extends Lesson {
  build() {
    this.theme = PLANS[this.level] || PLANS[0];
    this.plan = this.theme.rounds;
    const c = makeContainer(this.theme.box);
    this.box = c;
    c.obj.position.copy(BOX);
    this.root.add(c.obj);
    // invisible walls rise well above the rim so a lively bounce never escapes
    // invisible walls rise a little above the rim so a lively bounce never escapes
    cup(new T.Vector3(BOX.x, c.phys.y, BOX.z), c.phys.r, c.phys.h + 0.3);
    this.hog = makeAnimal(this.theme.eater);
    this.hog.scale.setScalar(this.theme.scale);
    this.hog.userData.baseScale = this.theme.scale;
    this.hog.position.copy(HOME);
    this.hog.rotation.y = HOME_RY;
    this.root.add(this.hog);
    this.hogLook = null;
    this.fruits = [];
    // no scenery trees / leaf litter between or behind the things to count; weather falls behind the play area
    calmBackdrop(this.meadow, { hide: (o) => (isTree(o) && Math.abs(o.position.x) < 10) || (o.userData.flower && o.position.z > -6 && Math.abs(o.position.x) < 9) });
    this.pip.position.set(-6.5, 0, -2);
    frame(...CAMS.other);
  }

  // glide the camera to frame this round's host
  frameHost(kind) {
    const to = CAMS[kind] || CAMS.other;
    const p0 = camera.position.clone(), l0 = getLook().clone();
    this.s.anim(0.5, (e) => frame(
      p0.x + (to[0] - p0.x) * e, p0.y + (to[1] - p0.y) * e, p0.z + (to[2] - p0.z) * e,
      l0.x + (to[3] - l0.x) * e, l0.y + (to[4] - l0.y) * e, l0.z + (to[5] - l0.z) * e), Ease.inOut);
  }

  // stuck child: the next thing to count hops
  nudgeTarget() { return this.fruits.find((f) => !f.userData.counted && f.userData.tap) || null; }

  get base() { return this.theme.scale; }

  async startRound(r) {
    const R = this.plan[r];
    this.R = R;
    this.n = R.n; this.kind = R.item; this.count = 0;
    // tidy up the last round: anything not eaten yet (the juggle payoff leaves the pile in the container) is gobbled up
    // by the eater on the way out; visitors hop away; eaten ones (already shrunk to nothing) are simply removed
    this.clearLeftovers(this.fruits);
    if (this.frog) { const fr = this.frog; this.s.anim(0.45, (_, p) => { fr.position.x = -3.3 - p * 7; fr.position.y = Math.abs(Math.sin(p * Math.PI * 3)) * 0.5; }).then(() => this.root.remove(fr)); }
    for (const v of [this.worm, this.bug]) if (v) this.root.remove(v); // both already gone from view (sunk / flown off)
    this.worm = this.frog = this.bug = null;
    if (this.hog.userData.eating) this.homeLater = true; else this.hogHome();
    // swap the host: the old one pops away as the new one springs up
    const old = this.host;
    if (old) popOut(this.s, old.obj, 0.2).then(() => this.root.remove(old.obj));
    this.frameHost(R.host === 'blossom' ? 'tree' : R.host);
    const host = makeHost(R.host === 'blossom' ? 'tree' : R.host, R.host === 'blossom' ? 1 : 0);
    this.host = host;
    this.root.add(host.obj);
    popIn(this.s, host.obj, host.obj.scale.x, 0.45, { sound: false });
    sfx[HOST_SND[R.host]]?.();

    this.fruits = [];
    const slots = host.slots(R.n, R.layout);
    const goldI = R.twist === 'golden' ? Math.floor(Math.random() * R.n) : -1;
    for (let i = 0; i < R.n; i++) {
      const f = makeItem(R.item, { golden: i === goldI });
      if (host.decorate) host.decorate(f, i);
      f.position.copy(slots[i]);
      if (host.restY) {
        // treats on a plate / tray / stand sit right on it (no floating, no sinking)
        f.updateMatrixWorld(true);
        const bb = new T.Box3().setFromObject(f);
        f.position.y = host.restY(f.position) + (f.position.y - bb.min.y);
      }
      f.userData.home = f.position.clone();
      f.userData.ph = i * 1.3;
      f.scale.setScalar(0.001);
      this.root.add(f);
      this.fruits.push(f);
      if (R.host === 'balloons') {
        const y = f.position.y;
        f.position.y = -2;
        f.scale.setScalar(1);
        this.s.wait(i * 0.07).then(() => { if (!f.userData.counted) this.s.tween(f.position, { y }, 0.55, Ease.out); });
      } else if (R.host === 'patch') {
        // berries poke up out of the leaves
        const y = f.position.y;
        f.position.y = y - 0.6;
        this.s.wait(0.1 + i * 0.08).then(() => { if (f.userData.counted) return; sfx.pop(); f.scale.setScalar(1); this.s.tween(f.position, { y }, 0.3, Ease.back); });
      } else popIn(this.s, f, 1, 0.4, { sound: i === 0 }).catch(() => {});
      f.userData.tap = input.addTap(f, { radius: 0.85, onTap: () => this.tapFruit(f) });
    }
    if (R.twist === 'ladybug') this.addBug();
    if (R.twist === 'frog') this.addFrog();
    if (R.twist === 'golden') this.s.wait(0.5).then(() => { const g = this.fruits[goldI]; if (g && !g.userData.counted) { sfx.sparkle(); g.getWorldPosition(tmp); fx.float(tmp.clone().add(new T.Vector3(0, 0.7, 0)), '✦', { color: '#ffd23f', size: 6 }); } });
    this.hogLook = null;
    // the prompt starts right away; the very first round waits until the fruit is in place for the demo
    if (this.demoDone) { this.cue(); return; }
    await this.wait(0.45 + R.n * 0.07);
    this.cue();
  }

  promptText() { return `Count the ${PLURAL[this.kind] || this.kind + 's'}!`; }

  addBug() {
    const f = this.fruits[Math.floor(Math.random() * this.fruits.length)];
    const b = makeLadybug();
    b.position.set(0.05, (f.userData.r || 0.45) + 0.05, 0.15);
    b.rotation.y = 0.6;
    f.add(b);
    f.userData.bug = b;
    this.bug = null;
  }

  addFrog() {
    const fr = makeAnimal('frog');
    fr.scale.setScalar(0.6);
    fr.userData.baseScale = 0.6;
    fr.position.set(-3.3, 0, 4.6);
    fr.rotation.y = 0.5;
    this.root.add(fr);
    this.frog = fr;
    popIn(this.s, fr, 0.6, 0.4, { sound: false });
    this.s.wait(0.2).then(() => { sfx.ribbit(); hop(this.s, fr, 0.6, 0.35, { sound: true }); });
  }

  hogHome() {
    const h = this.hog;
    if (h.userData.face) setFace(h.userData.face, 'happy');
    h.rotation.z = 0; h.rotation.x = 0;
    h.scale.setScalar(this.base);
    this.s.tween(h.position, { x: HOME.x, y: 0, z: HOME.z }, 0.6, Ease.inOut); // walks back (the motion layer adds steps)
  }

  // Last round's things that are still about (not eaten) fly into the eater's mouth with a chomp; eaten ones go.
  clearLeftovers(list) {
    const h = this.hog, left = list.filter((q) => q.parent && q.scale.x > 0.05);
    for (const q of list) if (!left.includes(q)) { physics.remove(q); this.root.remove(q); }
    if (!left.length) return;
    const mouth = h.position.clone().add(new T.Vector3(0, 1.2 * this.base, 0.4));
    sfx.chomp();
    left.forEach((q, k) => {
      physics.remove(q);
      const from = q.position.clone(), s0 = q.scale.x;
      this.s.anim(0.26, (e) => { q.position.lerpVectors(from, mouth, e); q.position.y += Math.sin(e * Math.PI) * 0.8; q.scale.setScalar(Math.max(0.001, s0 * (1 - e))); }, Ease.in)
        .then(() => this.root.remove(q));
    });
    this.s.wait(0.26).then(() => { if (!this.dead) { sfx.mmm(); hop(this.s, h, 0.25, 0.25); } });
  }

  update(dt, t) {
    // balloons bob, fruit on the tree sways, the ladybug wanders on its fruit
    for (const f of this.fruits) {
      if (f.userData.counted) continue;
      const b = f.userData.balloon;
      if (b) { b.rotation.z = Math.sin(t * 1.6 + f.userData.ph) * 0.12; b.position.y = 1.95 + Math.sin(t * 1.8 + f.userData.ph) * 0.1; }
      else if (this.host?.kind === 'tree') f.rotation.z = Math.sin(t * 2 + f.userData.ph) * 0.06;
      if (f.userData.bug) f.userData.bug.rotation.y = 0.6 + Math.sin(t * 1.5) * 0.8;
    }
    // the eater keeps an eye on the fruit (turns toward what was just tapped, or the next one)
    const h = this.hog;
    if (!h.userData.eating) {
      const look = this.hogLook || this.fruits.find((f) => !f.userData.counted);
      let ry = HOME_RY;
      if (look) { look.getWorldPosition(tmp); ry = Math.atan2(tmp.x - h.position.x, tmp.z - h.position.z + 3) * 0.8; }
      h.rotation.y += (ry - h.rotation.y) * Math.min(1, dt * 6);
      if (h.userData.head) h.userData.head.rotation.x = Math.max(0, Math.sin(t * 9)) * 0.05 * (Math.sin(t * 0.7) > 0.6 ? 1 : 0);
    }
    if (this.frog && !this.frog.userData.busyAnim) {
      const look = this.hogLook || this.fruits.find((f) => !f.userData.counted);
      if (look) { look.getWorldPosition(tmp); const ry = Math.atan2(tmp.x - this.frog.position.x, tmp.z - this.frog.position.z + 3) * 0.7; this.frog.rotation.y += (ry - this.frog.rotation.y) * Math.min(1, dt * 5); }
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
    if (f.userData.golden) { sfx.sparkle(); fx.confetti(tmp.clone(), 18); }
    this.release(f, i);
    // the eater follows it with its eyes and gets more excited with every fruit
    this.hogLook = f;
    if (!this.hog.userData.eating) {
      if (this.hog.userData.face) setFace(this.hog.userData.face, 'scared'); // big wide "ooh" eyes
      this.s.wait(0.35).then(() => { if (!this.hog.userData.eating && this.hog.userData.face) setFace(this.hog.userData.face, 'happy'); });
      hop(this.s, this.hog, 0.18 + i * 0.07, 0.3);
      if (i % 2) sfx.squeak();
    }
    if (this.frog && i % 2 === 0) this.s.wait(0.15).then(() => { if (this.frog) { sfx.ribbit(); hop(this.s, this.frog, 0.35, 0.3); } });
    if (!last) { this.say(`${WORDS[i]}!`); return; }

    // last one: the total shows big while the fruit lands, the pile jumps once per number, then the payoff
    const n = this.n, R = this.R;
    this.success(new T.Vector3(BOX.x, 2, BOX.z), `${WORDS[n - 1]}!`);
    this.s.wait(0.42).then(() => {
      fx.float(new T.Vector3(BOX.x, 2.9, BOX.z), String(n), { color: '#ffd23f', size: 20 });
      sfx.twinkle();
    });
    // recount: once everything has landed, the pile jumps once per number
    if (R.pay !== 'juggle') this.fruits.forEach((q, k) => this.s.wait(0.68 + k * 0.05).then(() => { if (physics.has(q)) physics.impulse(q, { x: 0, y: 2.2, z: 0 }); sfx.note(k); }));
    this.payoff(R).then(() => { if (this.homeLater) { this.homeLater = false; this.hogHome(); } });
  }
  afterSuccess() { return this.wait(0.3); }

  // How a tapped thing leaves its host, then it is thrown with real physics into the container and piles up.
  async release(f, i) {
    const s = this.s, kind = this.R.host, R = this.R;
    s.stop(f.position); s.stop(f.scale);
    f.rotation.z = 0;
    f.scale.setScalar(1);
    if (f.userData.bug) this.flyBug(f);
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
      await s.tween(f.position, { y: f.position.y + 0.6 }, 0.1, Ease.out);
    } else if (kind === 'tree' || kind === 'blossom') {
      // a little pluck: stretch down, snap
      await s.anim(0.1, (_, p) => f.scale.set(1 - p * 0.1, 1 + p * 0.15, 1 - p * 0.1));
      f.scale.setScalar(1);
      wiggle(s, this.host.obj, 0.015, 0.3);
      sfx.tick();
    } else if (kind === 'patch') {
      // pull! it stretches, then pops out of the ground with a puff of soil
      await s.anim(0.12, (_, p) => f.scale.set(1 - p * 0.15, 1 + p * 0.3, 1 - p * 0.15));
      f.scale.setScalar(1);
      sfx.pop();
      f.getWorldPosition(tmp);
      fx.float(tmp.clone().add(new T.Vector3(0, -0.3, 0)), '·•·', { color: '#8a5a3a', size: 5 });
    } else {
      // on a plate / table / stand: a little hop up first
      sfx.tick();
      await s.anim(0.1, (_, p) => { f.position.y = f.userData.home.y + Math.sin(p * Math.PI / 2) * 0.3; });
    }
    if (this.dead) return;
    const c = this.box.phys;
    // things on the ground (patch, blanket, tray) spring straight up first, so the throw comes down over the rim
    if (f.position.y < 1.5) { sfx.boing2(); await s.tween(f.position, { y: c.y + c.h + 1.3 }, 0.14, Ease.out); }
    if (this.dead) return;
    const target = new T.Vector3(BOX.x + (i - (this.n - 1) / 2) * 0.22 + (Math.random() - 0.5) * 0.15, c.y + c.h + 1.05, BOX.z + (Math.random() - 0.5) * 0.3);
    const bouncy = R.twist === 'bouncy';
    if (bouncy) sfx.boing();
    else sfx.swoosh();
    const opts = { ...(f.userData.hull ? { shape: 'hull' } : { r: f.userData.r || 0.45 }), bounce: bouncy ? 0.62 : 0.3, friction: 0.8, time: bouncy ? 0.5 : 0.42, arc: kind === 'tree' || kind === 'blossom' ? 0.3 : 1.4, maxT: 1.0 };
    await this.throwIn(f, target, opts);
    // the container gives a squashy "got it" when it lands
    s.wait(0.28).then(() => {
      if (this.dead) return;
      if (bouncy) sfx.highBoing(); else sfx.pop();
      if (f.userData.golden) { sfx.twinkle(); fx.float(new T.Vector3(BOX.x, 2.2, BOX.z), '★', { color: '#ffd23f', size: 9 }); }
      const b = this.box.obj;
      s.anim(0.2, (_, p) => { const k = Math.sin(p * Math.PI) * 0.08; b.scale.set(1 + k, 1 - k, 1 + k); }).then(() => b.scale.setScalar(1));
    });
  }

  // Throw f on an arc to a point above the container; over it, f loses its sideways speed and drops straight in.
  // While flying it passes through other flying things (so two quick taps never knock each other out),
  // and anything that still ends up outside hops back in.
  async throwIn(f, target, opts, tries = 2) {
    const s = this.s, c = this.box.phys;
    const fly = (on) => { try { physics.body(f)?.collider(0)?.setCollisionGroups(on ? 0x00020001 : 0xffffffff); } catch (e) { /* older physics */ } };
    const done = physics.toss(f, target, opts);
    fly(true);
    await s.wait(opts.time);
    const body = physics.body(f);
    if (body && !this.dead) { const v = body.linvel(); body.setLinvel({ x: v.x * 0.1, y: -3, z: v.z * 0.1 }, true); }
    s.wait(0.25).then(() => fly(false));
    done.then(() => {
      if (this.dead || !physics.has(f) || tries <= 0) return;
      f.getWorldPosition(tmp);
      if (Math.hypot(tmp.x - BOX.x, tmp.z - BOX.z) > c.r + 0.15) {
        sfx.boing2();
        this.throwIn(f, new T.Vector3(BOX.x, c.y + c.h + 1.5, BOX.z), { ...opts, bounce: 0.2, time: 0.5, maxT: 0.7 }, tries - 1);
      }
    });
  }

  flyBug(f) {
    const b = f.userData.bug;
    f.userData.bug = null;
    b.getWorldPosition(tmp);
    f.remove(b);
    b.position.copy(tmp);
    this.root.add(b);
    this.bug = b;
    sfx.buzz();
    const p0 = tmp.clone(), dir = p0.x > 0 ? 1 : -1;
    this.s.anim(0.9, (_, p) => {
      b.position.set(p0.x + dir * p * 5, p0.y + p * 4 + Math.sin(p * 18) * 0.25, p0.z + Math.cos(p * 14) * 0.3);
      b.rotation.z = Math.sin(p * 30) * 0.4;
    }).then(() => { if (this.bug === b) { this.root.remove(b); this.bug = null; } });
  }

  // Gobble: every counted thing flies into the eater's mouth (physics off), cheeks puff, a heart.
  chomp(spot) {
    const s = this.s, h = this.hog;
    sfx.chomp();
    const mouth = new T.Vector3(spot.x - 0.3, 1.2 * this.base, spot.z + 0.4);
    this.fruits.forEach((q, k) => s.wait(k * 0.04).then(() => {
      physics.remove(q);
      const from = q.position.clone();
      s.anim(0.22, (e) => { q.position.lerpVectors(from, mouth, e); q.scale.setScalar(Math.max(0.001, 1 - e)); }, Ease.in);
    }));
    fx.float(new T.Vector3(spot.x, 2.2, spot.z), '♥', { color: '#ff7aa8', size: 7 });
    const b = this.base;
    s.anim(0.25, (_, p) => { const k = Math.sin(p * Math.PI) * 0.18; h.scale.set(b * (1 + k), b * (1 - k * 0.5), b * (1 + k)); }).then(() => { h.scale.setScalar(b); sfx.mmm(); wiggle(s, h, 0.2, 0.3); });
  }

  // The payoff for a correct total, different every round (about 0.9 s, runs during the praise).
  async payoff(R) {
    const s = this.s, h = this.hog, u = h.userData, b = this.base;
    u.eating = true;
    let how = R.pay;
    if (how === 'roll' && this.theme.eater !== 'hedgehog') how = 'spin';
    const spot = new T.Vector3(BOX.x + 1.8 + 1.0 * b, 0, BOX.z - 0.1); // beside the rim, never inside it
    h.rotation.y = -1.2;
    if (this.frog) { const fr = this.frog; s.wait(0.5).then(() => { sfx.ribbit(); hop(s, fr, 1.0, 0.45, { sound: true }); }); }
    if (how === 'juggle') {
      // the container bounces and everything inside jumps up and tumbles back down; the eater cheers
      await s.wait(0.72);
      sfx.boing();
      const box = this.box.obj;
      s.anim(0.3, (_, p) => { const k = Math.sin(p * Math.PI) * 0.2; box.scale.set(1 + k, 1 - k, 1 + k); box.position.y = Math.sin(p * Math.PI) * 0.25; }).then(() => { box.scale.setScalar(1); box.position.y = 0; });
      for (const q of this.fruits) physics.poke(q, 0.9);
      if (u.face) setFace(u.face, 'happy');
      await hop(s, h, 0.9, 0.4, { sound: true });
      sfx.giggle();
      u.eating = false;
      return;
    }
    await s.wait(0.42);
    const x0 = h.position.x, z0 = h.position.z;
    const go = (fn, dur = 0.42, ease) => s.anim(dur, (e, p) => { h.position.x = x0 + (spot.x - x0) * e; h.position.z = z0 + (spot.z - z0) * e; fn(e, p); }, ease);
    if (how === 'worm') this.wormGag();
    if (how === 'roll') {
      sfx.boing2();
      await go((e, p) => { h.rotation.z = e * Math.PI * 2; const k = 1 - Math.sin(p * Math.PI) * 0.3; h.scale.set(b * 1.1, b * k, b * 1.1); }, 0.35, Ease.inOut);
      h.rotation.z = 0; h.scale.setScalar(b);
    } else if (how === 'leap') {
      sfx.highBoing();
      await go((e, p) => { h.position.y = Math.sin(p * Math.PI) * 1.4; });
      h.position.y = 0;
      sfx.land();
    } else {
      sfx.patter();
      await go((e, p) => { h.position.y = Math.abs(Math.sin(p * Math.PI * 4)) * 0.15; });
      h.position.y = 0;
    }
    if (this.dead) return;
    if (how === 'worm') {
      // the worm got there first! the eater jumps back in surprise, then giggles
      if (u.face) setFace(u.face, 'scared');
      sfx.gasp();
      await s.anim(0.3, (_, p) => { h.position.x = spot.x + Math.sin(p * Math.PI / 2) * 0.8; h.position.y = Math.sin(p * Math.PI) * 0.6; });
      h.position.y = 0;
      if (u.face) setFace(u.face, 'happy');
      sfx.giggle();
    } else {
      this.chomp(spot);
      if (how === 'spin') { await s.wait(0.2); sfx.twinkle(); await dance(s, h); }
    }
    u.eating = false;
  }

  wormGag() {
    const w = makeWorm();
    w.position.set(BOX.x - 0.3, this.box.phys.y, BOX.z);
    w.scale.setScalar(0.001);
    this.root.add(w);
    this.worm = w;
    const s = this.s, segs = w.userData.segs;
    sfx.squeak();
    const y0 = w.position.y;
    s.anim(0.3, (_, p) => { w.scale.setScalar(Math.max(0.001, Ease.back(p) * 0.9)); w.position.y = y0 + p * 0.5; });
    s.anim(1.1, (_, p) => {
      segs.forEach((q, k) => { q.position.x = Math.sin(p * 14 - k * 0.9) * 0.08; });
      w.userData.head.position.x = Math.sin(p * 14 - 4 * 0.9) * 0.1;
      w.rotation.z = Math.sin(p * 10) * 0.2;
    });
    s.wait(0.4).then(() => {
      sfx.chomp();
      for (const q of this.fruits) { physics.remove(q); s.tween(q.scale, { x: 0.001, y: 0.001, z: 0.001 }, 0.2, Ease.in); }
      fx.float(new T.Vector3(BOX.x, 2.6, BOX.z), '♥', { color: '#ff7aa8', size: 7 });
    });
    s.wait(0.9).then(() => { if (this.worm === w) { sfx.boing2(); s.tween(w.position, { y: -0.8 }, 0.3, Ease.in); } });
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
