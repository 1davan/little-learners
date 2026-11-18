// Lesson 5 — Big and small. Topics mt_NtJYlJdUe9 "Measurable attributes" and mt_uhuxX8sg9f "Comparing lengths & heights".
// Two (later three) of the same thing stand on one ground line; tap the big one or the small one. With three things
// it is always odd-one-out by size (two small and one big, or two big and one small), so "big" and "small" stay
// unambiguous. Each level is its own world: L1 meadow animals, L2 a toy room, L3 a garden.
// The right one: a held breath, then the big one stomps once (one thud, the little props on the grass jump) or the
// small one hops once with a squeak. Then a few seconds of play: pressing the big one makes a slow heavy stomp, the
// small one a quick light bounce, so she makes the contrast herself. Then the one she found walks (or hops) to its
// place in a line on the rug at the back, sorted by size; the line is what the level builds and the finale shows.
import * as T from '../three.js';
import { Lesson, shuffle } from '../engine/lesson.js';
import { C, setFace, popIn, popOut, hop, wiggle } from '../engine/actors.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';
import { project, onFrame } from '../engine/stage.js';
import { physics } from '../engine/physics.js';
import { makeTray } from '../engine/keepsake.js';
import { makeThing, makeScatter, makeStage, makeBush, NOUN, ICON, ANIMALS } from './sizes-things.js';
import { frame, calmBackdrop, isTree } from './view-tools.js';

// [kind, ask, sizes, theme] — the ask and sizes are the level's difficulty; the theme is the round's look and twist.
// theme.arrive: how the things come in, two calm styles per level (walk | peek | pop | grow)
// theme.scatter: three little physics props behind the line (they jump when something big stomps)
// theme.swap: a magic puff swaps big and small (Level 3 only, once)
const PLANS = [
  // Level 1 — meadow animals
  [
    ['elephant', 'big', [1.5, 0.6], { arrive: 'walk', scatter: 'apples' }],
    ['bunny', 'small', [1.5, 0.6], { arrive: 'peek', scatter: 'acorns' }],
    ['bear', 'big', [1.5, 0.6], { arrive: 'walk', scatter: 'balls' }],
    ['hedgehog', 'big', [1.4, 0.85], { arrive: 'peek', scatter: 'acorns' }],
    ['frog', 'small', [1.4, 0.7], { arrive: 'walk', scatter: 'berries' }],
    ['cat', 'big', [1.45, 0.65, 0.55], { arrive: 'peek', scatter: 'balls' }],
  ],
  // Level 2 — toy room
  [
    ['ball', 'small', [1.4, 0.7], { arrive: 'pop', col: C.blue, band: 0xffffff, scatter: 'marbles' }],
    ['tower', 'big', [1.35, 0.85], { arrive: 'peek', scatter: 'blocks' }],
    ['gift', 'small', [1.3, 0.8], { arrive: 'pop', scatter: 'marbles' }],
    ['duck', 'big', [1.5, 0.9], { arrive: 'peek', scatter: 'balls' }],
    ['drum', 'small', [1.35, 1.2, 0.5], { arrive: 'pop', scatter: 'blocks' }],
    ['beachball', 'big', [1.45, 0.65, 0.55], { arrive: 'peek', scatter: 'marbles' }],
  ],
  // Level 3 — garden
  [
    ['tree', 'small', [1.3, 0.85], { arrive: 'grow', snow: true, scatter: 'snowballs' }],
    ['pumpkin', 'big', [1.4, 0.65, 0.55], { arrive: 'peek', scatter: 'snowballs' }],
    ['mushroom', 'small', [1.4, 1.25, 0.55], { arrive: 'grow', scatter: 'berries' }],
    ['watermelon', 'big', [1.35, 0.65, 0.55], { arrive: 'peek', swap: true, scatter: 'apples' }],
    ['sunflower', 'small', [1.4, 1.25, 0.6], { arrive: 'grow', scatter: 'berries' }],
    ['carrot', 'small', [1.5, 1.3, 0.6], { arrive: 'grow', scatter: 'acorns' }],
  ],
];
export { PLANS };
const XS2 = [-3.0, 3.5], XS3 = [-3.2, 0.8, 4.8];
// the size line on a rug at the FRONT: from the camera it sits below the choices' feet, so a kept thing never peeks
// out behind (or over) the next round's choices
const RUG = [0.4, 0, 4.0];

export default class SizesLesson extends Lesson {
  build() {
    this.plan = PLANS[this.level];
    this.pip.position.set(-8.3, 0, -4.6); // back-left, clear of the biggest thing
    frame(0, 3.2, 12.4, 0, 2.4, 0);
    calmBackdrop(this.meadow, { hide: (o) => Math.abs(o.position.x) > 8.6 && o.position.z > -9 && !isTree(o) });
    this.things = [];
    this.props = [];
    this.stage = makeStage(this.level);
    this.root.add(this.stage);
    // the line-up rug at the back: the one she found each round joins it, biggest to smallest
    this.tray = makeTray(this, this.totalRounds, RUG, { style: 'rug', spacing: 1.4, scale: 0.4 });
    // tapping a loose prop on the grass makes it hop (never counts as an answer)
    this.offs.push(input.onMiss((x, y) => this.pokeProp(x, y)));
  }

  // ---- helpers ----
  // visual bounds of a thing at a given size (for tap areas, halos and confetti)
  measure(t, s) {
    const s0 = t.scale.clone();
    t.scale.setScalar(s);
    t.updateMatrixWorld(true);
    const box = new T.Box3();
    // ignore flat ground shadows so the centre sits on the thing itself
    t.traverse((o) => { if (o.isMesh && o.geometry && !(o.geometry.type === 'CircleGeometry' || o.geometry.type === 'PlaneGeometry')) box.expandByObject(o); });
    t.scale.copy(s0);
    t.updateMatrixWorld(true);
    const c = box.getCenter(new T.Vector3()).sub(t.getWorldPosition(new T.Vector3()));
    const size = box.getSize(new T.Vector3());
    t.userData.hit = { offset: c, r: Math.max(size.x, size.y) / 2 };
    return t.userData.hit;
  }
  centre(t) { return t.getWorldPosition(new T.Vector3()).add(t.userData.hit.offset); }

  fitTap(t) {
    const h = this.measure(t, t.userData.size);
    if (t.userData.tap) { t.userData.tap.radius = h.r * 0.85; t.userData.tap.offset = h.offset; return t.userData.tap; }
    return input.addTap(t, { radius: h.r * 0.85, offset: h.offset, onTap: () => this.tapThing(t) });
  }

  // the answer is the biggest (ask big) or the smallest (ask small); every other thing has the OPPOSITE role, so with
  // three things "big" and "small" stay unambiguous (two small and one big, or two big and one small)
  setRoles() {
    const sizes = this.things.map((t) => t.userData.size);
    const maxS = Math.max(...sizes), minS = Math.min(...sizes);
    const want = this.ask === 'big' ? maxS : minS, other = this.ask === 'big' ? 'small' : 'big';
    for (const t of this.things) t.userData.role = t.userData.size === want ? this.ask : other;
  }

  // a hop for anything: physics things get an impulse, the rest the squashy tween hop
  // (a planted carrot hops on its own: its soil mound and shadow stay put, its leafy tuft is not squashed)
  jump(t, h = 0.6, dur = 0.4) {
    if (physics.has(t)) { physics.poke(t, Math.min(1.4, 0.45 + h * 0.6)); return this.wait(0.3); }
    const c = t.userData.carrot;
    if (c) { const y0 = c.position.y; return this.s.anim(dur, (_, p) => { c.position.y = y0 + Math.sin(p * Math.PI) * h; }).then(() => { c.position.y = y0; }); }
    return hop(this.s, t, h, dur);
  }

  pokeProp(x, y) {
    if (this.dead) return;
    let best = null, bd = Infinity;
    const wp = new T.Vector3();
    for (const p of this.props) {
      if (!p.parent) continue;
      p.getWorldPosition(wp);
      const c = project(wp);
      const d = Math.hypot(c.x - x, c.y - y);
      if (d < Math.min(innerWidth, innerHeight) * 0.06 && d < bd) { bd = d; best = p; }
    }
    if (!best) return;
    physics.poke(best, 0.6);
    sfx.pop();
  }

  // everything loose on the grass jumps (the ground shook)
  jolt(k = 1) {
    for (const p of this.props) physics.poke(p, (0.5 + Math.random() * 0.4) * k);
    for (const t of this.things) if (physics.has(t) && t.userData.role !== 'big') physics.poke(t, 0.5 * k);
  }

  // A static body round a thing that isn't simulated itself (animals, plants, a tower...), so the little props that
  // roll and jump on the grass bump into it instead of passing through it.
  collide(t) {
    if (physics.has(t) || t.userData.col || this.dead) return;
    const h = this.measure(t, t.userData.size), c = this.centre(t);
    const w = Math.min(h.r * 1.5, 3.2);
    t.userData.col = physics.box(new T.Vector3(c.x, c.y, c.z), new T.Vector3(w, Math.max(0.4, (c.y - t.position.y) * 2), Math.min(w, 2.2) * 0.7));
  }
  uncollide(t) { if (t.userData.col) { physics.removeStatic(t.userData.col); t.userData.col = null; } }

  // ---- the round ----
  async startRound(r) {
    this.busy = true;
    // (the last round's found thing is just stepping out of its spot: the new ones come a moment later)
    if (this.leaving) await this.wait(0.2);
    this.leaving = false;
    if (this.dead) return;
    const [kind, ask, sizes, th = {}] = this.plan[r];
    this.kind = kind; this.ask = ask; this.th = th;
    // (last round's things already left in afterSuccess: the found one is on the rug, the others walked off)
    // when the things are trees, the scenery's own trees must not stand between them
    for (const o of this.meadow.children) if (isTree(o) && Math.abs(o.position.x) < 12) o.visible = kind !== 'tree';
    const order = shuffle(sizes.map((s, i) => i));
    const xs = sizes.length === 2 ? XS2 : XS3;
    order.forEach((idx, slot) => {
      const s = sizes[idx];
      const t = makeThing(kind, th, slot);
      const ball = t.userData.phys === 'ball';
      t.position.set(xs[slot], ball ? s * t.userData.r : 0, 0);
      t.rotation.y = ball ? 0 : -xs[slot] * 0.05;
      t.userData.size = s;
      t.userData.baseScale = s;
      t.userData.slotX = xs[slot];
      t.scale.setScalar(s);
      t.userData.tap = this.fitTap(t);
      t.userData.tap.enabled = false;
      t.scale.setScalar(0.001);
      this.root.add(t);
      this.things.push(t);
    });
    this.setRoles();
    this.spawnProps(th);
    // taps are open while they arrive (rule 0: she can answer within about a second of the round starting);
    // behind peekaboo bushes they open as the bushes rustle
    const open = () => { if (this.dead) return; for (const t of this.things) t.userData.tap.enabled = true; this.busy = false; };
    const mode = th.arrive || 'pop';
    open(); // (a tap on a peekaboo bush counts as the thing hiding behind it)
    this.arriveP = this.arrive(mode);
    this.arriveScales = mode !== 'walk'; // (walking in only moves them: a payoff need not wait for it)
    await this.arriveP;
    if (this.dead) return;
    for (const t of this.things) this.fitTap(t);
    for (const t of this.things) this.collide(t);
    // the magic swap plays while taps are already open (its roles count from the moment it starts)
    this.swapP = th.swap ? this.magicSwap() : null;
    this.cue();
  }

  // three little props sit on the grass BEHIND the line (never in front of the things, never a reason to look away)
  spawnProps(th) {
    if (!th.scatter) return;
    const xs = shuffle([-6.2, -1.2, 2.8, 6.6]).slice(0, 3);
    xs.forEach((x) => {
      const p = makeScatter(th.scatter);
      const { r, shape } = p.userData.scatter;
      p.position.set(x, r + 0.01, -2.0 - Math.random() * 0.6);
      p.rotation.y = Math.random() * 6;
      this.root.add(p);
      this.props.push(p);
      physics.add(p, { shape, r, bounce: 0.5 });
    });
  }

  // How the things come in: two calm styles per level, about a second.
  async arrive(mode) {
    const T0 = this.things;
    if (mode === 'walk') {
      // they walk in from just outside the picture at walking pace (the motion layer adds steps)
      await Promise.all(T0.map((t) => {
        const x1 = t.position.x, x0 = x1 < 0 ? -9 : 9;
        t.scale.setScalar(t.userData.size);
        t.position.x = x0;
        return this.s.anim(Math.abs(x1 - x0) / 4.2, (_, p) => { t.position.x = x0 + (x1 - x0) * Ease.inOut(p); }).then(() => { t.position.x = x1; t.position.y = 0; });
      }));
    } else if (mode === 'peek') {
      // small bushes rustle, then - peekaboo! - out they pop (the stage's own bushes step aside meanwhile)
      this.stage.visible = this.level !== 0;
      const bushes = T0.map((t) => {
        const b = makeBush(0.45 + t.userData.size * 0.4);
        b.position.set(t.position.x, 0, 0.9);
        this.root.add(b);
        popIn(this.s, b, b.scale.x, 0.25, { sound: false });
        return b;
      });
      await this.wait(0.25);
      bushes.forEach((b) => wiggle(this.s, b, 0.2, 0.45));
      sfx.rustle();
      await this.wait(0.3);
      bushes.forEach((b) => popOut(this.s, b, 0.3).then(() => this.root.remove(b)));
      T0.forEach((t) => popIn(this.s, t, t.userData.size, 0.5, { sound: false }));
      await this.wait(0.5);
      this.stage.visible = true;
    } else if (mode === 'grow') {
      // sprout from the soil: stretch up, then settle wide
      sfx.rustle();
      await Promise.all(T0.map((t, i) => {
        const s = t.userData.size;
        return this.s.wait(i * 0.15).then(() => this.s.anim(0.9, (_, p) => {
          const y = Ease.out(p);
          const x = Ease.out(Math.min(1, p * 1.4));
          t.scale.set(s * Math.max(0.001, x), s * Math.max(0.001, y), s * Math.max(0.001, x));
        })).then(() => { t.scale.setScalar(s); });
      }));
    } else {
      T0.forEach((t, i) => this.s.wait(i * 0.15).then(() => popIn(this.s, t, t.userData.size, 0.5, { sound: i === 0 })));
      await this.wait(0.5 + T0.length * 0.15);
    }
    for (const t of T0) if (!physics.has(t)) t.scale.setScalar(t.userData.size);
  }

  // Level 3, once: a sparkle puff swaps the biggest and the smallest, so the child has to look again.
  async magicSwap() {
    const big = this.things.find((t) => t.userData.size === Math.max(...this.things.map((x) => x.userData.size)));
    const small = this.things.find((t) => t.userData.size === Math.min(...this.things.map((x) => x.userData.size)));
    sfx.twinkle();
    for (const t of [big, small]) fx.float(this.centre(t).add(new T.Vector3(0, (t.userData.hit?.r || 1) + 0.4, 0)), '✨', { color: '#ffd23f', size: 7 });
    const a = big.userData.size, b = small.userData.size;
    big.userData.size = big.userData.baseScale = b;
    small.userData.size = small.userData.baseScale = a;
    this.setRoles();
    for (const t of [big, small]) { this.uncollide(t); this.fitTap(t); } // (tap areas at the new sizes)
    big.scale.setScalar(a); small.scale.setScalar(b);
    // 0.9 s, or it hurries to the end (0.15 s) the moment she taps during it
    this.swapHurry = false;
    await new Promise((res) => {
      let p = 0;
      const off = onFrame((dt) => {
        if (this.dead) { off(); res(); return; }
        p = Math.min(1, p + dt / (this.swapHurry ? 0.15 : 0.9));
        const e = Ease.inOut(p);
        big.scale.setScalar(a + (b - a) * e);
        small.scale.setScalar(b + (a - b) * e);
        if (p >= 1) { off(); res(); }
      });
      this.offs.push(off);
    });
    big.scale.setScalar(b); small.scale.setScalar(a);
    for (const t of [big, small]) this.collide(t);
  }

  // stuck child: the right one hops
  nudgeTarget() { return this.busy ? null : this.things.find((t) => t.userData.role === this.ask) || null; }

  // a simulated thing gets a real physics hop, never a tween that fights the body
  nudge(step) {
    const o = this.nudgeTarget();
    if (!o || !physics.has(o)) return super.nudge(step);
    physics.poke(o, 0.6);
    if (step >= 2) { const stop = fx.halo(o, (o.userData.hit?.r || 1) + 0.3); this.s.wait(3).then(stop); }
  }

  promptText() {
    const n = NOUN[this.kind], i = ICON[this.kind];
    return this.ask === 'big' ? `Find the BIG ${n}! ${i}` : `Find the small ${n}! ${i}`;
  }
  prompt(opts = {}) {
    this.say(this.promptText(), { ...opts, ...(this.ask === 'big' ? { pitch: 0.75, rate: 0.85 } : { pitch: 1.6, rate: 1.0 }) });
  }

  // each thing's own sound, low and deep for big, high for small (role: 'big' | 'small')
  voiceOf(k, big) {
    if (k === 'elephant') big ? sfx.trumpet() : sfx.trumpetHi();
    else if (k === 'ball' || k === 'beachball' || k === 'bunny') big ? sfx.lowBoing() : sfx.highBoing();
    else if (k === 'tree' || k === 'tower') sfx.note(big ? 0 : 7);
    else if (k === 'sunflower' || k === 'carrot' || k === 'mushroom') sfx.note(big ? 0 : 9);
    else if (k === 'bear' || k === 'hedgehog') big ? sfx.grr() : sfx.squeak();
    else if (k === 'cat') big ? sfx.meow() : sfx.squeak();
    else if (k === 'frog') sfx.ribbit();
    else if (k === 'duck') big ? sfx.quack() : sfx.squeak();
    else if (k === 'drum') big ? sfx.drumLoud() : sfx.drumSoft();
    else if (k === 'gift') sfx.note(big ? 2 : 9);
    else big ? sfx.lowBoing() : sfx.highBoing();
  }
  voice(t) { this.voiceOf(this.kind, t.userData.role === 'big'); }

  async tapThing(t) {
    if (this.busy || !this.things.includes(t)) return;
    const role = t.userData.role;
    if (role !== this.ask) {
      this.voice(t);
      this.jump(t, 0.3 / t.userData.size + 0.2);
      this.redirect(this.ask === 'big' ? 'That one is small. Find the BIG one!' : 'That one is big. Find the small one!');
      return;
    }
    for (const x of this.things) x.userData.tap.enabled = false;
    this.found = t;
    this.payoffP = this.payoff(t);
    const n = NOUN[this.kind];
    this.success(this.centre(t), role === 'big' ? `BIG ${n}!` : `Small ${n}!`, { still: 0 });
  }

  // one payoff with a held breath: the big one stomps once (one thud, the props behind jump a little),
  // the small one hops once with a squeak
  async payoff(t) {
    if (this.arriveP && this.arriveScales) await this.arriveP; // (tapped while it was still growing in: that finishes first)
    if (this.swapP) { this.swapHurry = true; await this.swapP; } // (tapped mid-swap: it hurries to its end first)
    await this.beat(t.userData.carrot || t, 0.2);
    if (this.dead) return;
    if (t.userData.role === 'big') await this.stomp(t, 0.4);
    else await this.bounce(t, 0.4);
  }
  async stomp(t, h = 0.5) {
    const big = t.userData.size;
    if (physics.has(t)) { physics.poke(t, 0.7); await this.wait(0.35); }
    else await this.jump(t, h, 0.42);
    sfx.thunk();
    this.jolt(0.4);
    if (t.userData.drum) this.voiceOf('drum', true);
    // the others feel the ground move: a little sway, no fright
    for (const o of this.things) if (o !== t && o.parent && !physics.has(o)) wiggle(this.s, o, 0.06 / Math.max(0.5, o.userData.size), 0.4);
    return big;
  }
  async bounce(t, h = 0.5) {
    this.voiceOf(this.kind, false);
    if (physics.has(t)) { physics.poke(t, 0.5); await this.wait(0.3); }
    else await this.jump(t, h, 0.36);
  }

  // After the payoff: a few seconds when the big one and the small one answer her finger (heavy stomp / light
  // bounce), then the one she found walks to its place on the rug line and the others walk off.
  async afterSuccess() {
    const t = this.found;
    this.found = null;
    const play = this.things.filter((x) => x.parent);
    for (const x of play) this.pokeable(x, { fn: (o) => { if (o.userData.playing) return; o.userData.playing = true; const p = o.userData.role === 'big' ? this.stomp(o, 0.35) : this.bounce(o, 0.4); p.then(() => { o.userData.playing = false; }); } });
    await this.wait(0.2); // a short play window (pokes stay live until they leave)
    this.pokeables = this.pokeables.filter((p) => !play.includes(p.obj));
    if (this.dead) return;
    this.leaving = true;
    this.toLine(t, this.arriveP); // (not awaited: the next round starts while it walks to the rug)
  }

  // the found one goes to the rug line (sorted biggest to smallest); the others walk off (or settle away)
  async toLine(t, arrived = null) {
    for (const x of this.things) {
      if (x.userData.tap) input.remove(x.userData.tap);
      this.uncollide(x);
      if (x === t) continue;
      physics.remove(x);
      for (const b of x.userData.blocks || []) physics.remove(b);
      // (they settle away on the spot: walking off they would cross the next round's things walking in)
      this.fadeAway(x, 0.4).then(() => this.root.remove(x));
    }
    for (const p of this.props) { physics.remove(p); this.fadeAway(p, 0.5).then(() => this.root.remove(p)); }
    this.props = [];
    this.things = [];
    if (!t) return;
    if (arrived) await arrived; // (it may still be walking in)
    if (this.dead) return;
    physics.remove(t);
    for (const b of t.userData.blocks || []) physics.remove(b);
    if (t.userData.lid) physics.remove(t.userData.lid);
    t.quaternion.identity();
    if (t.userData.phys === 'ball') t.position.y = t.userData.size * (t.userData.r || 1);
    t.userData.lineKind = this.kind; t.userData.lineBig = t.userData.role === 'big';
    if (t.userData.face) setFace(t.userData.face, 'happy');
    await this.tray.add(t, { walk: ANIMALS.has(this.kind), arc: 0.9 });
    this.sortLine();
    // a poke on a thing in the line: its own big or small sound and a little hop
    this.pokeable(t, { fn: (o) => { input.press(o, 140); this.voiceOf(o.userData.lineKind, o.userData.lineBig); } });
  }
  // keep the rug line in order of size, biggest on the left: the newcomer (on the last spot) steps out behind the
  // line and walks along to its place while the ones it passes shuffle one spot to the right, so nobody ever passes
  // through anybody, at walking pace
  sortLine() {
    const slots = this.tray.slots();
    const fresh = slots[slots.length - 1];
    const size = (sl) => { const o = sl.children[0]; if (!o) return 0; const b = new T.Box3().setFromObject(o); return b.max.y - b.min.y; };
    const others = slots.slice(0, -1).sort((a, b) => a.position.x - b.position.x);
    let k = others.findIndex((sl) => size(sl) < size(fresh));
    if (k < 0) return; // the smallest so far: it is already in its place at the right end
    const sp = 1.55, x0 = fresh.position.x, xk = others[k].position.x;
    for (let j = k; j < others.length; j++) { const sl = others[j], x = sl.position.x + sp; this.s.wait(0.35).then(() => this.s.tween(sl.position, { x }, 0.9, Ease.inOut)); }
    const z0 = fresh.position.z, dur = Math.max(1.0, Math.abs(x0 - xk) / 2.4);
    this.s.anim(dur, (e, p) => { fresh.position.x = x0 + (xk - x0) * e; fresh.position.z = z0 - Math.sin(p * Math.PI) * 1.1; }, Ease.inOut).then(() => { fresh.position.z = z0; });
  }

  showHint(glow = true) {
    const t = this.things.find((x) => x.userData.role === this.ask);
    if (!t) return;
    const c = this.centre(t);
    if (glow) {
      const anchor = new T.Object3D();
      anchor.position.copy(c);
      this.root.add(anchor);
      this.addHalo(anchor, t.userData.hit.r + 0.3);
    }
    if (!physics.has(t)) wiggle(this.s, t, 0.15, 0.8);
    fx.ghostHand(c);
  }

  choicePoints() { return this.things.map((t) => this.centre(t)); }

  makeErrorless() {
    for (const t of this.things) if (t.userData.role !== this.ask) t.userData.tap.enabled = false;
  }

  // ---- the ending: the rug line, biggest to smallest, each hopping with its own sound ----
  creationView() { const v = this.tray.view(0.8); v.look.y -= 0.3; return v; }
  creationObjects() { return []; } // (the line's things are already pokeable: each makes its own sound)
  onFinale() {
    // falling leaves would cover the photo
    for (const o of this.meadow.children) if (o.isInstancedMesh && !o.frustumCulled) o.visible = false;
    const line = this.tray.slots().slice().sort((a, b) => a.position.x - b.position.x).map((sl) => sl.children[0]).filter(Boolean);
    line.forEach((o, i) => this.s.wait(1.2 + i * 0.6).then(() => {
      if (this.dead || !o.parent) return;
      this.voiceOf(o.userData.lineKind, o.userData.lineBig);
      const c = o.userData.carrot;
      const tgt = c || o, y0 = tgt.position.y;
      this.s.anim(0.45, (_, p) => { tgt.position.y = y0 + Math.sin(p * Math.PI) * 0.35; }).then(() => { tgt.position.y = y0; });
    }));
    this.admireTime = 1.2 + line.length * 0.6 + 0.8;
  }
}
