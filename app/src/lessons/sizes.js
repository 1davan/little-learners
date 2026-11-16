// Lesson 5 — Big and small. Topics mt_NtJYlJdUe9 "Measurable attributes" and mt_uhuxX8sg9f "Comparing lengths & heights".
// Two (later three) of the same thing stand on one ground line; tap the big one or the small one.
// Each level is its own world: L1 meadow animals, L2 a toy room, L3 a garden harvest.
// Every round brings the things in a new way (walk in, peekaboo, drop from the sky with real physics, grow…),
// some rounds add a visitor or a magic size swap, and the answer gets a size-flavoured payoff:
// big things stomp, topple, BOOM and shake the little props on the grass; small things zip, bounce and squeak.
import * as T from '../three.js';
import { Lesson, shuffle } from '../engine/lesson.js';
import { mesh, geo } from '../engine/toon.js';
import { C, makeAnimal, setFace, popIn, popOut, hop, wiggle } from '../engine/actors.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';
import { camera, project } from '../engine/stage.js';
import { physics } from '../engine/physics.js';
import { makeThing, makeScatter, makeStage, makeBush, NOUN, ICON, PLANTS, ANIMALS } from './sizes-things.js';
import { frame, calmBackdrop, isTree } from './view-tools.js';

// [kind, ask, sizes, theme] — the ask and sizes are the level's difficulty; the theme is the round's look and twist.
// theme.arrive: how the things come in (walk | peek | drop | sky (physics) | build | grow | pop)
// theme.scatter: little physics props on the grass; theme.rain: they fall from the sky first
// theme.visitor: a surprise friend who watches and cheers; theme.swap: a magic puff swaps big and small
const PLANS = [
  // Level 1 — meadow animals
  [
    ['elephant', 'big', [1.5, 0.6], { arrive: 'walk', scatter: 'apples' }],
    ['bunny', 'small', [1.5, 0.6], { arrive: 'peek', scatter: 'acorns', visitor: 'frog' }],
    ['bear', 'big', [1.5, 0.6], { arrive: 'drop', scatter: 'balls', rain: true }],
    ['hedgehog', 'big', [1.4, 0.85], { arrive: 'walk', scatter: 'acorns', visitor: 'bunny' }],
    ['frog', 'small', [1.4, 0.7], { arrive: 'drop', swap: true, scatter: 'berries' }],
    ['cat', 'big', [1.35, 0.9, 0.5], { arrive: 'peek', scatter: 'balls', visitor: 'hedgehog' }],
  ],
  // Level 2 — toy room
  [
    ['ball', 'small', [1.4, 0.7], { arrive: 'sky', col: C.blue, band: 0xffffff, scatter: 'marbles' }],
    ['tower', 'big', [1.35, 0.85], { arrive: 'build', scatter: 'blocks', visitor: 'bear' }],
    ['gift', 'small', [1.3, 0.8], { arrive: 'sky', scatter: 'marbles', rain: true }],
    ['duck', 'big', [1.5, 0.9], { arrive: 'walk', swap: true, scatter: 'balls' }],
    ['drum', 'small', [1.35, 0.9, 0.5], { arrive: 'drop', scatter: 'blocks', visitor: 'cat' }],
    ['beachball', 'big', [1.4, 0.95, 0.55], { arrive: 'sky', scatter: 'marbles', rain: true }],
  ],
  // Level 3 — garden harvest
  [
    ['tree', 'small', [1.3, 0.85], { arrive: 'grow', snow: true, scatter: 'snowballs', rain: true }],
    ['pumpkin', 'big', [1.35, 0.95, 0.6], { arrive: 'drop', swap: true, scatter: 'snowballs' }],
    ['mushroom', 'small', [1.4, 0.95, 0.55], { arrive: 'grow', scatter: 'berries', visitor: 'frog' }],
    ['watermelon', 'big', [1.3, 1.0, 0.6], { arrive: 'drop', swap: true, scatter: 'apples' }],
    ['sunflower', 'small', [1.4, 0.95, 0.6], { arrive: 'grow', scatter: 'berries', visitor: 'bunny' }],
    ['carrot', 'small', [1.5, 1.0, 0.6], { arrive: 'grow', scatter: 'acorns', visitor: 'hedgehog' }],
  ],
];
export { PLANS };

export default class SizesLesson extends Lesson {
  build() {
    this.plan = PLANS[this.level];
    this.pip.position.set(-8.3, 0, -4.6); // back-left, clear of the biggest thing
    frame(0, 3.5, 13.4, 0, 2.2, 0);
    calmBackdrop(this.meadow);
    this.things = [];
    this.props = [];
    this.bigI = 0; this.smallI = 0;
    this.stage = makeStage(this.level);
    this.root.add(this.stage);
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

  setRoles() {
    const sizes = this.things.map((t) => t.userData.size);
    const maxS = Math.max(...sizes), minS = Math.min(...sizes);
    for (const t of this.things) t.userData.role = t.userData.size === maxS ? 'big' : t.userData.size === minS ? 'small' : 'middle';
  }

  // a hop for anything: physics things get an impulse, the rest the squashy tween hop
  jump(t, h = 0.6, dur = 0.4) {
    if (physics.has(t)) { physics.poke(t, Math.min(1.4, 0.45 + h * 0.6)); return this.wait(0.3); }
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
    physics.poke(best, 0.7);
    sfx.boing();
  }

  shake(amt = 0.14, dur = 0.4) {
    const y0 = this.camY ?? (this.camY = camera.position.y);
    this.s.anim(dur, (_, p) => { camera.position.y = y0 + Math.sin(p * Math.PI * 6) * amt * (1 - p); }).then(() => { camera.position.y = y0; });
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
  clearRound() {
    for (const t of this.things) {
      if (t.userData.tap) input.remove(t.userData.tap);
      physics.remove(t);
      for (const b of t.userData.blocks || []) physics.remove(b);
      if (t.userData.lid) physics.remove(t.userData.lid);
      this.uncollide(t);
      popOut(this.s, t, 0.18).then(() => this.root.remove(t));
    }
    for (const p of this.props) popOut(this.s, p, 0.18).then(() => this.root.remove(p));
    if (this.visitor) { const v = this.visitor; popOut(this.s, v, 0.2).then(() => this.root.remove(v)); this.visitor = null; }
    this.things = [];
    this.props = [];
  }

  async startRound(r) {
    this.busy = true;
    const [kind, ask, sizes, th = {}] = this.plan[r];
    this.kind = kind; this.ask = ask; this.th = th;
    const had = this.things.length > 0;
    this.clearRound();
    if (had) await this.wait(0.2); // last round's things finish popping away before the new ones arrive (no overlap)
    // when the things are trees, the scenery's own trees must not stand between them
    for (const o of this.meadow.children) if (isTree(o) && Math.abs(o.position.x) < 12) o.visible = kind !== 'tree';
    const order = shuffle(sizes.map((s, i) => i));
    const xs = sizes.length === 2 ? [-3.0, 3.5] : [-3.8, 0.4, 4.6];
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
    if (th.visitor) this.spawnVisitor(th.visitor);
    await this.arrive(th.arrive || 'pop');
    for (const t of this.things) this.fitTap(t);
    if (th.swap) await this.magicSwap();
    for (const t of this.things) this.collide(t);
    for (const t of this.things) t.userData.tap.enabled = true;
    this.busy = false;
    this.cue();
  }

  spawnProps(th) {
    if (!th.scatter) return;
    const n = 6;
    const xs = shuffle([-6.8, -5.2, -2.2, -0.8, 1.4, 2.6, 5.6, 7]).slice(0, n);
    xs.forEach((x, i) => {
      const p = makeScatter(th.scatter);
      const { r, shape } = p.userData.scatter;
      const z = 1.9 + Math.random() * 1.3; // in front of the things (clear of a big one's toes)
      this.root.add(p);
      this.props.push(p);
      if (th.rain) {
        p.position.set(x + (Math.random() - 0.5), 7 + i * 0.4, z);
        p.rotation.set(Math.random() * 3, Math.random() * 3, 0);
        physics.add(p, { shape, r, bounce: 0.55 });
        physics.impulse(p, { x: 0, y: -6, z: 0 });
      } else {
        p.position.set(x, r + 0.01, z);
        p.rotation.y = Math.random() * 6;
        physics.add(p, { shape, r, bounce: 0.5 });
      }
    });
    if (th.rain) { sfx.whoosh(); this.wait(0.45).then(() => sfx.patter && sfx.patter()); }
  }

  spawnVisitor(kind) {
    const v = makeAnimal(kind);
    v.userData.baseScale = 0.55;
    v.position.set(11, 0, -2.8);
    v.rotation.y = -0.6;
    v.scale.setScalar(0.55);
    this.root.add(v);
    this.visitor = v;
    this.s.wait(0.3).then(() => {
      this.s.anim(0.6, (_, p) => { v.position.x = 11 - 4.2 * Ease.out(p); v.position.y = Math.abs(Math.sin(p * Math.PI * 3)) * 0.35; }).then(() => { v.position.y = 0; sfx.land(); });
      sfx.patter && sfx.patter();
    });
  }

  // How the things come in. Every path ends within ~0.75 s.
  async arrive(mode) {
    const T0 = this.things;
    if (mode === 'walk') {
      sfx.patter && sfx.patter();
      await Promise.all(T0.map((t, i) => {
        const x1 = t.position.x, x0 = x1 < 0 ? -13 : 13;
        t.scale.setScalar(t.userData.size);
        t.position.x = x0;
        return this.s.anim(0.7, (_, p) => {
          const e = Ease.out(p);
          t.position.x = x0 + (x1 - x0) * e;
          t.position.y = Math.abs(Math.sin(p * Math.PI * (t.userData.size > 1 ? 3 : 5))) * 0.3 * (1 - p);
        }).then(() => { t.position.y = 0; if (i === 0) sfx.land(); });
      }));
    } else if (mode === 'peek') {
      // bushes rustle, then — peekaboo! — out they pop
      const bushes = T0.map((t) => {
        const b = makeBush(0.6 + t.userData.size * 0.5);
        b.position.set(t.position.x, 0, 0.9);
        this.root.add(b);
        popIn(this.s, b, b.scale.x, 0.3, { sound: false });
        return b;
      });
      sfx.rustle();
      await this.wait(0.3);
      bushes.forEach((b) => wiggle(this.s, b, 0.2, 0.3));
      sfx.rustle();
      await this.wait(0.25);
      sfx.pop();
      bushes.forEach((b) => popOut(this.s, b, 0.15).then(() => this.root.remove(b)));
      T0.forEach((t) => { popIn(this.s, t, t.userData.size, 0.4, { sound: false }); fx.float(this.centre(t).add(new T.Vector3(0, 0.5, 0)), '👀', { size: 5 }); });
      sfx.giggle();
      await this.wait(0.35);
    } else if (mode === 'drop') {
      // fall from the sky, squash on landing (characters are not simulated)
      await Promise.all(T0.map((t, i) => {
        const s = t.userData.size;
        t.scale.setScalar(s);
        t.position.y = 8;
        return this.s.wait(i * 0.1).then(() => sfx.whoosh()).then(() => this.s.anim(0.4, (e) => { t.position.y = 8 * (1 - e); }, Ease.in)).then(() => {
          t.position.y = 0;
          s > 1.1 ? sfx.thunk() : sfx.land();
          if (s > 1.1) { this.shake(0.08, 0.25); this.jolt(0.6); }
          return this.s.anim(0.2, (_, p) => { const k = 1 - Math.sin(p * Math.PI) * 0.25; t.scale.set(s / Math.sqrt(k), s * k, s / Math.sqrt(k)); });
        }).then(() => t.scale.setScalar(s));
      }));
    } else if (mode === 'sky') {
      // real physics: tossed from up high, they bounce and settle
      sfx.whoosh();
      await Promise.all(T0.map((t, i) => {
        const s = t.userData.size;
        const target = t.position.clone();
        t.scale.setScalar(s);
        t.position.set(target.x, 7 + i * 0.6, 0);
        const opts = t.userData.phys === 'ball'
          ? { shape: 'ball', r: s * t.userData.r, bounce: 0.45, mass: 1 / s }
          : { shape: 'box', bounce: 0.3, spin: 0 };
        return physics.toss(t, target, { arc: 0, time: 0.42, maxT: 0.75, spin: 0, ...opts });
      }));
    } else if (mode === 'build') {
      // blocks drop onto each other one by one
      const all = [];
      T0.forEach((t) => { t.scale.setScalar(t.userData.size); for (const b of t.userData.blocks) { b.userData.y0 = b.position.y; b.position.y = 9; all.push([t, b]); } });
      await Promise.all(all.map(([t, b], i) => {
        const k = t.userData.blocks.indexOf(b);
        return this.s.wait(k * 0.16 + (i % 2) * 0.05).then(() => this.s.anim(0.3, (e) => { b.position.y = 9 + (b.userData.y0 - 9) * e; }, Ease.in)).then(() => { sfx.tick ? sfx.tick() : sfx.tap(); });
      }));
    } else if (mode === 'grow') {
      // sprout from the soil: stretch up, then settle wide
      sfx.pop();
      await Promise.all(T0.map((t, i) => {
        const s = t.userData.size;
        return this.s.wait(i * 0.08).then(() => this.s.anim(0.55, (_, p) => {
          const y = Ease.elastic(p);
          const x = Ease.out(Math.min(1, p * 1.4));
          t.scale.set(s * Math.max(0.001, x), s * Math.max(0.001, y), s * Math.max(0.001, x));
        })).then(() => { t.scale.setScalar(s); sfx.rustle(); });
      }));
      sfx.twinkle();
    } else {
      sfx.boing();
      T0.forEach((t, i) => popIn(this.s, t, t.userData.size, 0.45 + i * 0.1));
      await this.wait(0.45);
    }
    for (const t of T0) if (!physics.has(t)) t.scale.setScalar(t.userData.size);
  }

  // Surprise! A sparkle puff swaps the biggest and the smallest, so the child has to look again.
  async magicSwap() {
    const big = this.things.find((t) => t.userData.role === 'big');
    const small = this.things.find((t) => t.userData.role === 'small');
    await this.wait(0.2);
    sfx.twinkle();
    for (const t of [big, small]) fx.float(this.centre(t).add(new T.Vector3(0, 0.6, 0)), '✨', { color: '#ffd23f', size: 7 });
    const a = big.userData.size, b = small.userData.size;
    wiggle(this.s, big, 0.2, 0.6);
    wiggle(this.s, small, 0.2, 0.6);
    await this.s.anim(0.6, (e) => {
      big.scale.setScalar(a + (b - a) * e);
      small.scale.setScalar(b + (a - b) * e);
    }, Ease.back);
    big.userData.size = big.userData.baseScale = b;
    small.userData.size = small.userData.baseScale = a;
    big.scale.setScalar(b); small.scale.setScalar(a);
    sfx.pop();
    this.setRoles();
    for (const t of [big, small]) this.fitTap(t);
  }

  // stuck child: the right one hops
  nudgeTarget() { return this.busy ? null : this.things.find((t) => t.userData.role === this.ask) || null; }

  promptText() {
    const n = NOUN[this.kind], i = ICON[this.kind];
    return this.ask === 'big' ? `Big! Where is the BIG ${n}? ${i}` : `Small! Where is the small ${n}? ${i}`;
  }
  prompt() {
    this.say(this.promptText(), this.ask === 'big' ? { pitch: 0.75, rate: 0.85 } : { pitch: 1.6, rate: 1.0 });
  }

  voice(t) {
    const role = t.userData.role, big = role === 'big', small = role === 'small', k = this.kind;
    if (k === 'elephant') big ? sfx.trumpet() : small ? sfx.trumpetHi() : sfx.boing();
    else if (k === 'ball' || k === 'beachball') big ? sfx.lowBoing() : small ? sfx.highBoing() : sfx.boing();
    else if (k === 'tree') { sfx.rustle(); sfx.note(big ? 0 : small ? 7 : 4); }
    else if (k === 'sunflower' || k === 'carrot') { big ? sfx.note(0) : small ? sfx.twinkle() : sfx.note(4); }
    else if (k === 'bear') big ? sfx.grr() : sfx.squeak();
    else if (k === 'cat') { sfx.meow(); if (small) sfx.squeak(); }
    else if (k === 'frog') { sfx.ribbit(); big ? sfx.lowBoing() : small && sfx.highBoing(); }
    else if (k === 'bunny') big ? sfx.lowBoing() : small ? sfx.highBoing() : sfx.boing2();
    else if (k === 'duck') { sfx.quack(); if (small) sfx.squeak(); }
    else if (k === 'drum') big ? sfx.drumLoud() : sfx.drumSoft();
    else if (k === 'tower') { sfx.tick(); sfx.note(big ? 0 : small ? 9 : 4); }
    else if (k === 'gift') { sfx.tap(); sfx.note(big ? 2 : small ? 9 : 5); }
    else if (k === 'hedgehog') big ? sfx.grr() : sfx.squeak();
    else big ? sfx.lowBoing() : sfx.highBoing();
  }

  async tapThing(t) {
    if (this.busy || !this.things.includes(t)) return;
    this.voice(t);
    const role = t.userData.role;
    if (role !== this.ask) {
      this.jump(t, 0.3 / t.userData.size + 0.2);
      const name = NOUN[this.kind];
      this.redirect(role === 'middle' ? `That's the middle ${name}. Find the ${this.ask} one!` : `That's the ${role} ${name}. Find the ${this.ask} one!`);
      return;
    }
    this.busy = true;
    input.lock(2500);
    for (const x of this.things) x.userData.tap.enabled = false;
    const c = this.centre(t);
    if (role === 'big') await this.bigPayoff(t);
    else await this.smallPayoff(t);
    this.cheerVisitor();
    this.busy = false;
    const n = NOUN[this.kind];
    this.success(c, role === 'big' ? `BIG ${n}! ${ICON[this.kind]}` : `Small ${n}! ${ICON[this.kind]}`);
  }

  cheerVisitor() {
    const v = this.visitor;
    if (!v) return;
    const f = v.userData.face;
    if (f) setFace(f, 'happy');
    hop(this.s, v, 0.6, 0.35).then(() => hop(this.s, v, 0.35, 0.3));
    fx.float(v.getWorldPosition(new T.Vector3()).add(new T.Vector3(0, 1.6, 0)), '♥', { color: '#ff7aa8', size: 5 });
  }

  // the others are startled by something big
  startle(t) {
    for (const o of this.things) {
      if (o === t) continue;
      const f = o.userData.face;
      if (f) { setFace(f, 'scared'); this.s.wait(0.6).then(() => setFace(f, 'happy')); }
      this.jump(o, 0.55 / o.userData.size + 0.2, 0.35);
    }
  }

  // ---- big payoffs (each ≤ ~0.7 s) ----
  async bigPayoff(t) {
    const k = this.kind;
    if (k === 'tower') return this.topple(t);
    if (k === 'gift') return this.burst(t, true);
    if (k === 'ball' || k === 'beachball') {
      physics.poke(t, 1.3); sfx.lowBoing(); sfx.whoosh();
      await this.wait(0.45);
      sfx.thunk(); this.shake(); this.jolt(1.1); this.startle(t);
      return this.wait(0.25);
    }
    if (k === 'drum') {
      const sk = t.userData.skin;
      for (let i = 0; i < 2; i++) {
        sfx.drumLoud();
        this.s.anim(0.2, (_, p) => { sk.scale.y = 1 - Math.sin(p * Math.PI) * 0.7; t.scale.setScalar(t.userData.size * (1 + Math.sin(p * Math.PI) * 0.08)); });
        fx.float(this.centre(t).add(new T.Vector3(i ? 0.6 : -0.6, t.userData.hit.r, 0)), 'BOOM', { color: '#d94f3d', size: 6 });
        this.shake(0.1, 0.25); this.jolt(0.8);
        await this.wait(0.25);
      }
      this.startle(t);
      return this.wait(0.2);
    }
    if (PLANTS.has(k)) {
      // a big plant sways hard and its fruit tumbles down for real
      sfx.rustle();
      await wiggle(this.s, t, 0.18, 0.4);
      this.drops(t, k === 'tree' ? 4 : 5);
      sfx.thunk(); this.jolt(0.6);
      return this.wait(0.3);
    }
    // characters, pumpkin, melon: three flavours, rotating
    const v = this.bigI++ % 3;
    if (v === 0) {
      // STOMP
      await hop(this.s, t, 0.9, 0.45);
      sfx.thunk(); sfx.lowBoing();
      this.puffs(t); this.shake(); this.jolt(1); this.startle(t);
      await this.wait(0.3);
    } else if (v === 1) {
      // puff up even bigger, then a mighty bellow that blows the props away
      const s = t.userData.size;
      this.voice(t);
      await this.s.anim(0.35, (e) => t.scale.setScalar(s * (1 + 0.18 * e)), Ease.back);
      sfx.whoosh();
      for (const p of this.props) { const dx = p.position.x - t.position.x; physics.impulse(p, { x: Math.sign(dx || 1) * 3.2, y: 2.5, z: 0.6 }); }
      this.startle(t);
      fx.float(this.centre(t).add(new T.Vector3(0, t.userData.hit.r, 0)), ANIMALS.has(this.kind) ? 'ROAR' : 'BIG!', { color: '#d94f3d', size: 7 });
      await this.s.anim(0.3, (e) => t.scale.setScalar(s * (1.18 - 0.18 * e)), Ease.out);
    } else {
      // double bounce: each landing rocks the ground
      for (let i = 0; i < 2; i++) {
        await hop(this.s, t, 0.55, 0.3);
        sfx.thunk(); this.shake(0.1, 0.25); this.jolt(0.7); this.puffs(t);
      }
      this.startle(t);
      await this.wait(0.1);
    }
  }

  // ---- small payoffs ----
  async smallPayoff(t) {
    const k = this.kind;
    const big = this.things.find((x) => x.userData.role === 'big');
    if (big && big.userData.head) this.s.tween(big.userData.head.rotation, { x: 0.35 }, 0.25).then(() => this.s.wait(0.4)).then(() => this.s.tween(big.userData.head.rotation, { x: 0 }, 0.25));
    if (k === 'gift') return this.burst(t, false);
    if (k === 'tower') {
      this.uncollide(t);
      const top = t.userData.blocks[t.userData.blocks.length - 1];
      physics.add(top, { shape: 'box', bounce: 0.5 });
      physics.impulse(top, { x: 0, y: 5, z: 0.4 }, { x: 0, y: 0.6, z: 0.3 });
      sfx.highBoing();
      await this.wait(0.55); sfx.tick();
      return this.wait(0.1);
    }
    if (k === 'ball' || k === 'beachball') {
      // a tiny super-bouncy ball: boing boing boing
      for (let i = 0; i < 3; i++) { physics.poke(t, 0.9 - i * 0.15); sfx.highBoing(); await this.wait(0.22); }
      return this.wait(0.1);
    }
    if (k === 'drum') {
      const sk = t.userData.skin;
      for (let i = 0; i < 4; i++) {
        sfx.drumSoft();
        this.s.anim(0.12, (_, p) => { sk.scale.y = 1 - Math.sin(p * Math.PI) * 0.5; });
        fx.float(this.centre(t).add(new T.Vector3((i - 1.5) * 0.4, t.userData.hit.r, 0)), '♪', { color: '#4a90ff', size: 4 });
        await this.wait(0.15);
      }
      return this.wait(0.1);
    }
    if (PLANTS.has(k)) {
      sfx.twinkle();
      if (k === 'tree' || k === 'sunflower') this.drops(t, 1);
      if (k === 'mushroom') { this.drops(t, 2); sfx.boing(); }
      if (k === 'carrot') { sfx.crunch(); this.jump(t, 0.5, 0.3); }
      await wiggle(this.s, t, 0.3, 0.4);
      fx.float(this.centre(t).add(new T.Vector3(0, t.userData.hit.r, 0)), '♥', { color: '#ff7aa8', size: 5 });
      sfx.squeak();
      return this.wait(0.2);
    }
    const v = this.smallI++ % 2;
    const r0 = t.rotation.y;
    if (v === 0) {
      // zippy little hops with a spin
      for (let i = 0; i < 3; i++) {
        sfx.highBoing();
        if (i === 1) this.s.anim(0.22, (e) => { t.rotation.y = r0 + e * Math.PI * 2; }).then(() => { t.rotation.y = r0; });
        await hop(this.s, t, 0.9 - i * 0.2, 0.22);
      }
      sfx.squeak();
    } else {
      // a quick zoom in a little circle, leaving sparkles
      const x0 = t.position.x, z0 = t.position.z;
      sfx.swoosh();
      await this.s.anim(0.6, (_, p) => {
        const a = p * Math.PI * 2;
        t.position.x = x0 + Math.sin(a) * 0.9;
        t.position.z = z0 + (1 - Math.cos(a)) * 0.6;
        t.position.y = Math.abs(Math.sin(a * 2)) * 0.25;
        t.rotation.y = r0 + a;
        if (Math.random() < 0.12) fx.float(this.centre(t), '✦', { color: '#ffd23f', size: 3 });
      });
      t.position.set(x0, 0, z0); t.rotation.y = r0;
      sfx.squeak();
    }
  }

  // tower topples: every block becomes a rigid body and tumbles across the grass
  async topple(t) {
    this.uncollide(t);
    const dir = t.position.x > 0 ? -1 : 1;
    sfx.crunch();
    t.userData.blocks.forEach((b, i) => {
      physics.add(b, { shape: 'box', bounce: 0.35, friction: 0.6 });
      physics.impulse(b, { x: dir * (1 + i * 1.6), y: 1 + i * 0.6, z: 0.8 + Math.random() }, { x: (Math.random() - 0.5) * 0.4, y: 0.3, z: -dir * 0.5 });
    });
    await this.wait(0.35);
    sfx.thunk(); this.shake(0.1, 0.3); this.jolt(0.8); this.startle(t);
    await this.wait(0.3);
  }

  // a present pops its lid and things burst out
  async burst(t, big) {
    this.uncollide(t);
    const lid = t.userData.lid;
    physics.remove(t);
    sfx.pop();
    physics.add(lid, { shape: 'box', bounce: 0.4 });
    physics.impulse(lid, { x: (Math.random() - 0.5) * 2, y: big ? 7 : 5, z: 1.2 }, { x: 0.4, y: 0.3, z: 0.5 });
    const top = this.centre(t).add(new T.Vector3(0, t.userData.hit.r * 0.8, 0.3));
    if (big) {
      fx.confetti(top, 40);
      sfx.twinkle();
      for (let i = 0; i < 5; i++) {
        const p = makeScatter(i % 2 ? 'balls' : 'marbles');
        const { r, shape } = p.userData.scatter;
        p.position.copy(top).add(new T.Vector3((i - 2) * 0.3, 0.3, 0));
        this.root.add(p); this.props.push(p);
        physics.add(p, { shape, r, bounce: 0.65 });
        physics.impulse(p, { x: (i - 2) * 1.6, y: 5 + Math.random() * 2, z: 1.5 + Math.random() });
      }
      await this.wait(0.45);
      this.startle(t);
      await this.wait(0.2);
    } else {
      // a tiny present holds one tiny star
      fx.float(top, '⭐', { size: 6 });
      sfx.chime();
      await wiggle(this.s, t, 0.2, 0.35);
      sfx.squeak();
      await this.wait(0.2);
    }
  }

  // dust puffs at the feet
  puffs(t) {
    const p = t.getWorldPosition(new T.Vector3());
    const s = t.userData.size;
    for (let i = 0; i < 6; i++) {
      const m = new T.Mesh(geo.sphere(0.28, 10, 8), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 }));
      const a = (i / 6) * Math.PI * 2;
      m.position.set(p.x + Math.cos(a) * 0.8 * s, 0.2, p.z + Math.sin(a) * 0.5 * s + 0.3);
      this.root.add(m);
      const dx = Math.cos(a) * 1.4 * s, x0 = m.position.x;
      this.s.anim(0.5, (e) => { m.position.x = x0 + dx * e; m.scale.setScalar(1 + e * 1.5 * s); m.material.opacity = 0.9 * (1 - e); }, Ease.out).then(() => { this.root.remove(m); m.material.dispose(); });
    }
  }

  // fruit / seeds fall out of a plant as rigid bodies and bounce on the grass
  drops(t, n = 3) {
    const c = this.centre(t), s = t.userData.size;
    const k = this.kind;
    for (let i = 0; i < n; i++) {
      let m, r;
      if (k === 'tree') { m = makeScatter('apples'); r = 0.24; }
      else if (k === 'sunflower') { m = mesh(geo.sphere(0.13, 10, 8), 0x5a3a1e, { outline: 0.015 }); r = 0.13; }
      else if (k === 'mushroom') { m = makeScatter('berries'); r = 0.17; }
      else { m = makeScatter('acorns'); r = 0.2; }
      m.position.set(c.x + (i - (n - 1) / 2) * 0.7 * s, c.y + 0.5 * s, c.z + 0.8);
      this.root.add(m);
      this.props.push(m);
      physics.add(m, { shape: 'ball', r, bounce: 0.55 });
      physics.impulse(m, { x: (Math.random() - 0.5) * 2, y: 1, z: 1 + Math.random() });
    }
    sfx.swoosh();
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

  onFinale() {
    // parade: biggest to smallest hop in turn
    const sorted = this.things.slice().sort((a, b) => b.userData.size - a.userData.size);
    sorted.forEach((t, i) => this.s.wait(0.4 + i * 0.35).then(() => { if (t.parent) { this.jump(t, 0.8); this.voice(t); } }));
    this.s.wait(0.5).then(() => this.jolt(1));
  }
}
