// Game 8 — Which has more? Topic mt__h7hvT4tEb "Comparing groups: more or fewer".
// Two towels hang on drying racks with groups of beach things. Tap the one with more (Level 3: sometimes fewer).
// After a correct answer the groups line up one-to-one so the extras are easy to see.
import * as T from '../three.js';
import { Lesson } from '../engine/lesson.js';
import { mesh, geo, basic } from '../engine/toon.js';
import { C, popIn, hop, wiggle } from '../engine/actors.js';
import { makeStarfish } from '../engine/scenery.js';
import { makeBeachBall, makeShell, makeGull } from '../engine/beach.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';

const RACK_X = 3.7, RACK_Y = 2.3, RACK_Z = 0.8;
const NAME = { shell: 'shells', star: 'stars', ball: 'balls' };

function makeThing(kind) {
  const g = new T.Group();
  let m;
  if (kind === 'shell') { m = makeShell(0xff9ec0, 0.85); m.rotation.x = 1.3; }
  else if (kind === 'star') m = makeStarfish(0xff9f3f, 0.4);
  else m = makeBeachBall(0.36);
  g.add(m);
  g.userData.kind = kind;
  return g;
}

// [left count, right count, kind, ask ('more'|'fewer'), options]
const PLANS = [
  [[1, 4, 'shell'], [5, 1, 'shell'], [2, 6, 'star'], [3, 1, 'ball'], [1, 5, 'shell'], [6, 2, 'star']],
  [[2, 4, 'shell'], [5, 3, 'star'], [3, 6, 'shell'], [4, 2, 'ball'], [3, 5, 'star'], [6, 4, 'shell']],
  [[3, 4, 'shell'], [5, 4, 'star'], [3, 5, 'ball', 'more', { scale: [1.35, 0.7] }], [2, 5, 'shell', 'fewer'], [4, 3, 'star', 'fewer'], [4, 5, 'shell', 'more', { spread: [1.35, 0.75] }]],
];

function makeRack(stripe) {
  const g = new T.Group();
  const towel = new T.Group();
  for (let i = 0; i < 5; i++) {
    const s = new T.Mesh(geo.box(0.86, 3.4, 0.1), basic(i % 2 ? 0xffffff : stripe));
    s.position.x = -1.72 + i * 0.86;
    towel.add(s);
  }
  const edge = new T.Mesh(geo.box(4.5, 3.55, 0.06), basic(0x2a2440));
  edge.position.z = -0.05;
  towel.add(edge);
  towel.position.y = RACK_Y;
  towel.rotation.x = -0.18;
  const bar = mesh(geo.cyl(0.1, 0.1, 5, 10), 0xa86f3a, { outline: 0.02 });
  bar.rotation.z = Math.PI / 2;
  bar.position.set(0, RACK_Y + 1.75, -0.2);
  g.add(towel, bar);
  for (const x of [-2.4, 2.4]) {
    const post = mesh(geo.cyl(0.11, 0.13, RACK_Y + 1.8, 10), 0xa86f3a, { outline: 0.02 });
    post.position.set(x, (RACK_Y + 1.8) / 2, -0.2);
    g.add(post);
  }
  g.userData.towel = towel;
  return g;
}

export default class MoreLesson extends Lesson {
  build() {
    this.plan = PLANS[this.level];
    this.racks = [makeRack(0xff5a5a), makeRack(0x4a90ff)];
    this.racks[0].position.set(-RACK_X, 0, RACK_Z);
    this.racks[1].position.set(RACK_X, 0, RACK_Z);
    this.root.add(...this.racks);
    this.gull = makeGull();
    this.gull.position.set(0, 4.2, -1.5);
    const post = mesh(geo.cyl(0.15, 0.17, 4.2, 10), 0xa86f3a, { outline: 0.02 });
    post.position.set(0, 2.1, -1.6);
    this.root.add(this.gull, post);
    this.groups = [[], []];
    this.pip.position.set(-7.8, 0, -2.2);
  }

  ask() { return this.plan[this.round]?.[3] || 'more'; }
  rightSide() {
    const [l, r] = this.plan[this.round];
    return (this.ask() === 'more') === (l > r) ? 0 : 1;
  }

  layoutGroup(side, n, kind, opts) {
    const spread = opts?.spread?.[side] ?? 1;
    const scale = opts?.scale?.[side] ?? 1;
    const cols = 3, rows = Math.ceil(n / cols);
    const items = [];
    for (let i = 0; i < n; i++) {
      const c = i % cols, r = Math.floor(i / cols);
      const inRow = Math.min(cols, n - r * cols);
      const t = makeThing(kind);
      const x = (c - (inRow - 1) / 2) * 1.2 * spread;
      const y = RACK_Y + ((rows - 1) / 2 - r) * 1.05 * Math.min(spread, 1.15);
      t.position.set(this.racks[side].position.x + x, y, RACK_Z + 0.35);
      t.userData.baseScale = scale;
      this.root.add(t);
      popIn(this.s, t, scale, 0.35 + i * 0.05);
      items.push(t);
    }
    return items;
  }

  async startRound(r) {
    this.busy = true;
    for (const g of this.groups) for (const t of g) this.root.remove(t);
    for (const rk of this.racks) rk.scale.setScalar(1);
    const [l, rr, kind, , opts] = this.plan[r];
    this.kind = kind;
    this.groups = [this.layoutGroup(0, l, kind, opts), this.layoutGroup(1, rr, kind, opts)];
    sfx.sparkle();
    this.taps = this.racks.map((rk, side) => input.addTap(rk, { radius: 2.2, offset: new T.Vector3(0, RACK_Y, 0.4), onTap: () => this.pick(side) }));
    await this.wait(0.7);
    this.busy = false;
    this.cue();
  }

  promptText() {
    const n = NAME[this.kind];
    return this.ask() === 'more' ? `More! Which has more ${n}?` : `Fewer! Which has fewer ${n}?`;
  }
  prompt() { this.say(this.promptText(), this.ask() === 'more' ? { pitch: 0.95 } : { pitch: 1.4 }); }

  async pick(side) {
    if (this.busy) return;
    this.gull.rotation.y = side ? -0.5 : 0.5;
    sfx.gull();
    if (side !== this.rightSide()) {
      this.groups[side].forEach((t, i) => this.s.wait(i * 0.05).then(() => hop(this.s, t, 0.3, 0.3)));
      this.redirect(this.ask() === 'more' ? `That one has fewer. Find more!` : `That one has more. Find fewer!`);
      return;
    }
    this.busy = true;
    input.lock(5000);
    // line the two groups up, one-to-one, so the extras stand out
    const [L, R] = this.groups;
    const n = Math.max(L.length, R.length);
    const sp = Math.min(1.1, 6 / n);
    const moves = [];
    for (let i = 0; i < n; i++) {
      const x = (i - (n - 1) / 2) * sp;
      if (L[i]) moves.push(this.s.tween(L[i].position, { x, y: 5.6, z: 2 }, 0.6, Ease.inOut));
      if (R[i]) moves.push(this.s.tween(R[i].position, { x, y: 4.4, z: 2 }, 0.45, Ease.inOut));
    }
    sfx.whoosh();
    await Promise.all(moves);
    for (let i = 0; i < Math.min(L.length, R.length); i++) {
      sfx.note(i);
      hop(this.s, L[i], 0.25, 0.25); hop(this.s, R[i], 0.25, 0.25);
      await this.wait(0.2);
    }
    const bigger = L.length > R.length ? L : R;
    const extras = bigger.slice(Math.min(L.length, R.length));
    for (const e of extras) wiggle(this.s, e, 0.5, 0.9);
    sfx.sparkle();
    const word = this.ask() === 'more' ? 'More' : 'Fewer';
    await this.say(`${word} ${NAME[this.kind]}!`, { max: 0.9 });
    // the gull gobbles the side that was picked
    const chosen = this.groups[side];
    sfx.gull();
    await this.s.tween(this.gull.position, { x: chosen[0].position.x, y: chosen[0].position.y + 0.8, z: 2.2 }, 0.5, Ease.inOut);
    sfx.chomp();
    for (const t of chosen) this.s.tween(t.scale, { x: 0.001, y: 0.001, z: 0.001 }, 0.3, Ease.in);
    await this.wait(0.35);
    this.s.tween(this.gull.position, { x: 0, y: 4.2, z: -1.5 }, 0.6, Ease.inOut);
    for (const t of this.groups[1 - side]) this.s.tween(t.scale, { x: 0.001, y: 0.001, z: 0.001 }, 0.3, Ease.in);
    this.busy = false;
    this.success(new T.Vector3(0, 5, 2), 'Yum!');
  }

  afterSuccess() { for (const t of this.taps || []) input.remove(t); }

  center(side) { return new T.Vector3(this.racks[side].position.x, RACK_Y, RACK_Z + 0.4); }
  showHint(glow = true) {
    const side = this.rightSide();
    if (glow) {
      const a = new T.Object3D(); a.position.copy(this.center(side)); this.root.add(a);
      this.addHalo(a, 2.2);
    }
    fx.ghostPath([this.center(side)], { mode: 'tap' });
  }
  choicePoints() { return [this.center(0), this.center(1)]; }

  makeErrorless() {
    const wrong = 1 - this.rightSide();
    this.taps[wrong].enabled = false;
    this.s.tween(this.racks[wrong].scale, { x: 0.75, y: 0.75, z: 0.75 }, 0.4);
    for (const t of this.groups[wrong]) t.visible = false;
  }

  update(dt, t) {
    const w = this.gull.userData.wings;
    if (w) { w[0].rotation.z = Math.sin(t * 3) * 0.15; w[1].rotation.z = -Math.sin(t * 3) * 0.15; }
  }

  onFinale() {
    const g = this.gull;
    this.s.anim(2.5, (e) => { g.position.set(Math.sin(e * Math.PI * 2) * 4, 4.2 + Math.sin(e * Math.PI * 4) * 1.5 + e * 0.5, -1.5 + Math.cos(e * Math.PI * 2) * 2); });
  }
}
