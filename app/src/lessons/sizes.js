// Lesson 5 — Big and small. Topics mt_NtJYlJdUe9 "Measurable attributes" and mt_uhuxX8sg9f "Comparing lengths & heights".
// Two (later three) of the same thing stand on one ground line; tap the big one or the small one.
// Size has consequences: the big one stomps and shakes the ground, the small one zips about with a squeak.
// Some rounds have a surprise: a puff of magic swaps the sizes before the question.
import * as T from '../three.js';
import { Lesson, shuffle } from '../engine/lesson.js';
import { mesh, geo, basic, blobShadow } from '../engine/toon.js';
import { C, makeAnimal, setFace, popIn, popOut, hop, wiggle } from '../engine/actors.js';
import { makeTree, makeSunflower } from '../engine/scenery.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';
import { camera } from '../engine/stage.js';

const NOUN = { elephant: 'elephant', tree: 'tree', ball: 'ball', bear: 'bear', bunny: 'bunny', frog: 'frog', cat: 'kitty', hedgehog: 'hedgehog', sunflower: 'flower' };
const ICON = { elephant: '🐘', tree: '🌳', ball: '🔴', bear: '🐻', bunny: '🐰', frog: '🐸', cat: '🐱', hedgehog: '🦔', sunflower: '🌻' };
const PLANTS = new Set(['tree', 'sunflower']);

function makeBall(col = C.red, band = C.yellow) {
  const g = new T.Group();
  const b = mesh(geo.sphere(1, 24, 18), col, { outline: 0.035 });
  b.position.y = 1;
  const stripe = mesh(geo.torus(1.0, 0.12, Math.PI * 2, 8, 36), band, { outline: 0 });
  stripe.position.y = 1;
  stripe.rotation.y = Math.PI / 2;
  const hi = new T.Mesh(geo.sphere(0.18, 8, 6), basic(0xffffff));
  hi.position.set(-0.4, 1.45, 0.75);
  g.add(b, stripe, hi, blobShadow(1));
  return g;
}

function makeThing(kind, th = {}) {
  if (kind === 'tree') return makeTree(1, th.leaf ?? C.leaf);
  if (kind === 'ball') return makeBall(th.col, th.band);
  if (kind === 'sunflower') { const g = new T.Group(), f = makeSunflower(2.4); f.scale.setScalar(1.3); g.add(f); return g; }
  return makeAnimal(kind);
}

// [kind, ask, sizes, theme] — the ask and sizes are the level's difficulty; kinds rotate so no two rounds look alike.
// theme.swap: a magic puff swaps big and small before the question.
const PLANS = [
  [
    ['elephant', 'big', [1.5, 0.6]],
    ['ball', 'big', [1.5, 0.6], { col: C.red, band: C.yellow }],
    ['bunny', 'small', [1.5, 0.6]],
    ['tree', 'big', [1.4, 0.85], { leaf: 0xffa040 }],
    ['frog', 'small', [1.4, 0.7], { swap: true }],
    ['bear', 'big', [1.35, 0.9, 0.5]],
  ],
  [
    ['elephant', 'small', [1.4, 0.7]],
    ['sunflower', 'big', [1.35, 0.85]],
    ['ball', 'small', [1.3, 0.8], { col: C.blue, band: 0xffffff }],
    ['bear', 'big', [1.5, 0.9], { swap: true }],
    ['cat', 'small', [1.35, 0.9, 0.5]],
    ['tree', 'big', [1.4, 0.95, 0.55], { leaf: 0xff8fc0 }],
  ],
  [
    ['tree', 'small', [1.3, 0.85]],
    ['bunny', 'big', [1.35, 0.95, 0.6], { swap: true }],
    ['ball', 'small', [1.4, 0.95, 0.55], { col: C.purple, band: C.green }],
    ['elephant', 'big', [1.3, 1.0, 0.6], { swap: true }],
    ['sunflower', 'small', [1.4, 0.95, 0.6]],
    ['hedgehog', 'small', [1.5, 1.0, 0.6]],
  ],
];

export default class SizesLesson extends Lesson {
  build() {
    this.plan = PLANS[this.level];
    this.pip.position.set(-7.4, 0, -2.5);
    this.things = [];
  }

  // visual bounds of a thing at a given size (for tap areas, halos and confetti)
  measure(t, s) {
    const s0 = t.scale.clone();
    t.scale.setScalar(s);
    t.updateMatrixWorld(true);
    const box = new T.Box3();
    // ignore flat ground shadows so the centre sits on the thing itself
    t.traverse((o) => { if (o.isMesh && o.geometry && !(o.geometry.type === 'CircleGeometry' || o.geometry.type === 'PlaneGeometry')) box.expandByObject(o); });
    t.scale.copy(s0);
    const c = box.getCenter(new T.Vector3()).sub(t.position);
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

  async startRound(r) {
    this.busy = true;
    const [kind, ask, sizes, th = {}] = this.plan[r];
    this.kind = kind; this.ask = ask;
    // last round's things pop away (and their tap targets go with them, so a stale one can never answer a tap)
    for (const t of this.things) {
      if (t.userData.tap) input.remove(t.userData.tap);
      popOut(this.s, t, 0.18).then(() => this.root.remove(t));
    }
    this.things = [];
    const order = shuffle(sizes.map((s, i) => i));
    const xs = sizes.length === 2 ? [-3.4, 3.4] : [-4.6, 0.2, 4.8];
    order.forEach((idx, slot) => {
      const s = sizes[idx];
      const t = makeThing(kind, th);
      t.position.set(xs[slot], 0, 0);
      t.rotation.y = -xs[slot] * 0.05;
      t.userData.size = s;
      t.userData.baseScale = s;
      this.root.add(t);
      this.things.push(t);
      popIn(this.s, t, s, 0.45 + slot * 0.1);
      t.userData.tap = this.fitTap(t);
      t.userData.tap.enabled = false;
    });
    this.setRoles();
    sfx.boing();
    await this.wait(0.35);
    if (th.swap) await this.magicSwap();
    for (const t of this.things) t.userData.tap.enabled = true;
    this.busy = false;
    this.cue();
  }

  // Surprise! A sparkle puff swaps the biggest and the smallest, so the child has to look again.
  async magicSwap() {
    const big = this.things.find((t) => t.userData.role === 'big');
    const small = this.things.find((t) => t.userData.role === 'small');
    await this.wait(0.25);
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
    else if (k === 'ball') big ? sfx.lowBoing() : small ? sfx.highBoing() : sfx.boing();
    else if (k === 'tree') { sfx.rustle(); sfx.note(big ? 0 : small ? 7 : 4); }
    else if (k === 'sunflower') { big ? sfx.note(0) : small ? sfx.twinkle() : sfx.note(4); }
    else if (k === 'bear') big ? sfx.grr() : sfx.squeak();
    else if (k === 'cat') { sfx.meow(); if (small) sfx.squeak(); }
    else if (k === 'frog') { sfx.ribbit(); big ? sfx.lowBoing() : small && sfx.highBoing(); }
    else if (k === 'bunny') big ? sfx.lowBoing() : small ? sfx.highBoing() : sfx.boing2();
    else big ? sfx.lowBoing() : sfx.squeak();
  }

  async tapThing(t) {
    if (this.busy || !this.things.includes(t)) return;
    this.voice(t);
    const role = t.userData.role;
    if (role !== this.ask) {
      hop(this.s, t, 0.3 / t.userData.size + 0.2);
      const name = NOUN[this.kind];
      this.redirect(role === 'middle' ? `That's the middle ${name}. Find the ${this.ask} one!` : `That's the ${role} ${name}. Find the ${this.ask} one!`);
      return;
    }
    this.busy = true;
    input.lock(2500);
    for (const x of this.things) x.userData.tap.enabled = false;
    if (role === 'big') await this.bigPayoff(t);
    else await this.smallPayoff(t);
    this.busy = false;
    const n = NOUN[this.kind];
    this.success(this.centre(t), role === 'big' ? `BIG ${n}! ${ICON[this.kind]}` : `Small ${n}! ${ICON[this.kind]}`);
  }

  // Big: a crouch, a heavy jump and a STOMP that shakes the ground and bounces everyone else up.
  async bigPayoff(t) {
    const others = this.things.filter((x) => x !== t);
    if (PLANTS.has(this.kind)) {
      // a big plant sways hard and things tumble out of it
      sfx.rustle();
      await wiggle(this.s, t, 0.18, 0.45);
      this.drops(t);
    } else {
      await hop(this.s, t, 0.9, 0.45);
    }
    sfx.thunk(); sfx.lowBoing();
    this.puffs(t);
    const y0 = camera.position.y;
    this.s.anim(0.4, (_, p) => { camera.position.y = y0 + Math.sin(p * Math.PI * 6) * 0.14 * (1 - p); }).then(() => { camera.position.y = y0; });
    for (const o of others) {
      const f = o.userData.face;
      if (f) { setFace(f, 'scared'); this.s.wait(0.6).then(() => setFace(f, 'happy')); }
      hop(this.s, o, 0.55 / o.userData.size + 0.2, 0.35);
    }
    await this.wait(0.3);
  }

  // Small: zippy little hops with squeaks and a spin; the big one leans down to look.
  async smallPayoff(t) {
    const big = this.things.find((x) => x.userData.role === 'big');
    if (big && big.userData.head) this.s.tween(big.userData.head.rotation, { x: 0.35 }, 0.25).then(() => this.s.wait(0.4)).then(() => this.s.tween(big.userData.head.rotation, { x: 0 }, 0.25));
    if (PLANTS.has(this.kind)) {
      sfx.twinkle();
      await wiggle(this.s, t, 0.3, 0.4);
      fx.float(this.centre(t).add(new T.Vector3(0, t.userData.hit.r, 0)), '♥', { color: '#ff7aa8', size: 5 });
      await this.wait(0.2);
      return;
    }
    const r0 = t.rotation.y;
    for (let k = 0; k < 3; k++) {
      sfx.highBoing();
      if (k === 1) this.s.anim(0.22, (e) => { t.rotation.y = r0 + e * Math.PI * 2; }).then(() => { t.rotation.y = r0; });
      await hop(this.s, t, 0.9 - k * 0.2, 0.22);
    }
    sfx.squeak();
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

  // apples (or seeds) fall out of a big plant and bounce
  drops(t) {
    const c = this.centre(t), s = t.userData.size;
    const col = this.kind === 'tree' ? C.red : 0x7a4a26;
    for (let i = 0; i < 3; i++) {
      const m = mesh(geo.sphere(this.kind === 'tree' ? 0.24 : 0.12, 12, 10), col, { outline: 0.02 });
      m.position.set(c.x + (i - 1) * 0.9 * s, c.y + 0.4 * s, c.z + 0.9);
      this.root.add(m);
      const y0 = m.position.y;
      this.s.wait(i * 0.08).then(() => this.s.anim(0.6, (e) => { m.position.y = 0.25 + (y0 - 0.25) * (1 - e); }, Ease.bounce)).then(() => { sfx.tap(); return this.s.wait(0.5); }).then(() => popOut(this.s, m, 0.2)).then(() => this.root.remove(m));
    }
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
    wiggle(this.s, t, 0.15, 0.8);
    fx.ghostHand(c);
  }

  choicePoints() { return this.things.map((t) => this.centre(t)); }

  makeErrorless() {
    for (const t of this.things) if (t.userData.role !== this.ask) t.userData.tap.enabled = false;
  }

  onFinale() {
    // parade: biggest to smallest hop in turn
    const sorted = this.things.slice().sort((a, b) => b.userData.size - a.userData.size);
    sorted.forEach((t, i) => this.s.wait(0.4 + i * 0.35).then(() => { hop(this.s, t, 0.8); this.voice(t); }));
  }
}
