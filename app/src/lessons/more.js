// Game 8 — Which has more? Topic mt__h7hvT4tEb "Comparing groups: more or fewer".
// Two towels hang on drying racks with groups of beach things. Tap the one with more (Level 3: sometimes fewer).
// Then the groups snap into two rows, pair up with little links so the extras stand out, and hungry Gull gobbles the pick.
import * as T from '../three.js';
import { Lesson } from '../engine/lesson.js';
import { mesh, geo, basic } from '../engine/toon.js';
import { popIn, hop, wiggle } from '../engine/actors.js';
import { makeGull } from '../engine/beach.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';
import { makeThing, NAME, STRIPES } from './more-items.js';

const RACK_X = 3.7, RACK_Y = 2.3, RACK_Z = 0.8;
const GULL_HOME = new T.Vector3(0, 4.2, -1.5);
const ROW_Y = [6.25, 5.1], ROW_Z = 2.2;

// [left count, right count, kind, ask ('more'|'fewer'), options] — a new thing every round
const PLANS = [
  [[1, 4, 'fish'], [5, 1, 'shell'], [2, 6, 'star'], [3, 1, 'icecream'], [1, 5, 'ball'], [6, 2, 'cookie']],
  [[2, 4, 'shell'], [5, 3, 'icecream'], [3, 6, 'fish'], [4, 2, 'ball'], [3, 5, 'star'], [6, 4, 'cookie']],
  [[3, 4, 'cookie'], [5, 4, 'star'], [3, 5, 'ball', 'more', { scale: [1.35, 0.7] }], [2, 5, 'fish', 'fewer'], [4, 3, 'icecream', 'fewer'], [4, 5, 'shell', 'more', { spread: [1.35, 0.75] }]],
];

function makeRack() {
  const g = new T.Group();
  const towel = new T.Group();
  const stripes = [];
  for (let i = 0; i < 5; i++) {
    const s = new T.Mesh(geo.box(0.86, 3.4, 0.1), basic(0xffffff));
    s.position.x = -1.72 + i * 0.86;
    towel.add(s);
    stripes.push(s);
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
  g.userData.stripes = stripes;
  return g;
}

export default class MoreLesson extends Lesson {
  build() {
    this.plan = PLANS[this.level];
    this.racks = [makeRack(), makeRack()];
    this.racks[0].position.set(-RACK_X, 0, RACK_Z);
    this.racks[1].position.set(RACK_X, 0, RACK_Z);
    this.root.add(...this.racks);
    this.gull = makeGull();
    this.gull.position.copy(GULL_HOME);
    this.gull.userData.baseScale = 1;
    const post = mesh(geo.cyl(0.15, 0.17, 4.2, 10), 0xa86f3a, { outline: 0.02 });
    post.position.set(0, 2.1, -1.6);
    this.root.add(this.gull, post);
    this.groups = [[], []];
    this.links = [];
    this.pip.position.set(-7.8, 0, -2.2);
    this.mood = { t: 0, next: 2, look: 0, tilt: 0 };
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
      t.rotation.z = (Math.random() - 0.5) * 0.4;
      this.root.add(t);
      t.scale.setScalar(0.001);
      // they drop onto the towel one by one
      const d = 0.06 + side * 0.18 + i * 0.07;
      this.s.wait(d).then(() => { t.position.y = y + 1.2; this.s.tween(t.position, { y }, 0.3, Ease.bounce); popIn(this.s, t, scale, 0.35, { sound: false }); sfx.bloop(i % 5); });
      items.push(t);
    }
    return items;
  }

  async startRound(r) {
    this.busy = true;
    for (const g of this.groups) for (const t of g) this.root.remove(t);
    for (const l of this.links) this.root.remove(l);
    this.links = [];
    for (const rk of this.racks) rk.scale.setScalar(1);
    const [l, rr, kind, , opts] = this.plan[r];
    this.kind = kind;
    // fresh towels for a fresh thing
    const [ca, cb] = STRIPES[kind];
    this.racks.forEach((rk, side) => rk.userData.stripes.forEach((s, i) => { s.material = basic(i % 2 ? 0xffffff : side ? cb : ca); }));
    for (const rk of this.racks) wiggle(this.s, rk.userData.towel, 0.06, 0.4);
    sfx.swoosh();
    this.groups = [this.layoutGroup(0, l, kind, opts), this.layoutGroup(1, rr, kind, opts)];
    this.gullExcited();
    this.taps = this.racks.map((rk, side) => input.addTap(rk, { radius: 2.2, offset: new T.Vector3(0, RACK_Y, 0.4), onTap: () => this.pick(side) }));
    await this.wait(0.45);
    this.busy = false;
    this.cue();
  }

  promptText() {
    const n = NAME[this.kind];
    return this.ask() === 'more' ? `More! Which has more ${n}?` : `Fewer! Which has fewer ${n}?`;
  }
  prompt() { this.say(this.promptText(), this.ask() === 'more' ? { pitch: 0.95 } : { pitch: 1.4 }); }

  // ---- Gull's personality ----
  gullExcited() {
    // snacks are coming! flap, hop, squawk
    const g = this.gull, s = this.s;
    s.wait(0.25).then(() => { sfx.gull(); hop(s, g, 0.45, 0.35); this.flap(0.5, 1.0); });
  }
  flap(dur, amt = 0.8) {
    this.flapUntil = this.time + dur;
    this.flapAmt = amt;
  }
  gullConfused(side) {
    const g = this.gull, s = this.s;
    this.mood.look = side ? -0.7 : 0.7;
    // head tilt and a little "hmm?" shake
    this.mood.tilt = side ? -0.35 : 0.35;
    s.anim(0.6, (_, p) => { g.rotation.x = Math.sin(p * Math.PI * 4) * 0.1; }).then(() => { g.rotation.x = 0; this.mood.tilt = 0; });
    fx.float(g.position.clone().add(new T.Vector3(0, 1.7, 0)), '?', { color: '#3fb6e0', size: 7 });
  }

  async pick(side) {
    if (this.busy) return;
    this.mood.look = side ? -0.6 : 0.6;
    if (side !== this.rightSide()) {
      sfx.gull();
      this.gullConfused(side);
      this.groups[side].forEach((t, i) => this.s.wait(i * 0.05).then(() => hop(this.s, t, 0.3, 0.3)));
      this.redirect(this.ask() === 'more' ? `That one has fewer. Find more!` : `That one has more. Find fewer!`);
      return;
    }
    this.busy = true;
    input.lock(3000);
    sfx.gull();
    this.flap(0.6, 1.1);
    hop(this.s, this.gull, 0.5, 0.35);
    // quick pairing: both groups snap into two rows, one above the other
    const [Lg, Rg] = this.groups;
    const n = Math.max(Lg.length, Rg.length), m = Math.min(Lg.length, Rg.length);
    const sp = Math.min(1.15, 6.5 / n);
    const xAt = (i) => (i - (n - 1) / 2) * sp;
    sfx.whoosh();
    const moves = [];
    [Lg, Rg].forEach((grp, row) => grp.forEach((t, i) => {
      const k = 0.85; // same size in the rows, so it's a fair match-up
      moves.push(this.s.tween(t.position, { x: xAt(i), y: ROW_Y[row], z: ROW_Z }, 0.3, Ease.back));
      this.s.tween(t.scale, { x: k, y: k, z: k }, 0.3);
      this.s.tween(t.rotation, { z: 0 }, 0.3);
    }));
    await Promise.all(moves);
    // links zip across each pair, left to right, with a rising scale
    for (let i = 0; i < m; i++) {
      this.s.wait(i * 0.06).then(() => {
        const link = mesh(geo.cyl(0.06, 0.06, ROW_Y[0] - ROW_Y[1] - 0.5, 8), 0xffffff, { outline: 0.015 });
        link.position.set(xAt(i), (ROW_Y[0] + ROW_Y[1]) / 2, ROW_Z - 0.05);
        this.root.add(link);
        this.links.push(link);
        popIn(this.s, link, 1, 0.2, { sound: false });
        sfx.note(i);
        hop(this.s, Lg[i], 0.2, 0.2); hop(this.s, Rg[i], 0.2, 0.2);
      });
    }
    await this.wait(m * 0.06 + 0.12);
    // the extras have no partner: they bounce and get counted
    const bigger = Lg.length > Rg.length ? Lg : Rg;
    const extras = bigger.slice(m);
    sfx.sparkle();
    extras.forEach((e, i) => {
      wiggle(this.s, e, 0.5, 0.6);
      hop(this.s, e, 0.35, 0.3);
      fx.float(e.position.clone().add(new T.Vector3(0, 0.6, 0)), '+' + (i + 1), { color: '#ff5a5a', size: 5 });
    });
    // the counts at the end of each row
    [Lg, Rg].forEach((grp, row) => fx.float(new T.Vector3(xAt(-1) - 0.2, ROW_Y[row], ROW_Z), String(grp.length), { color: row ? '#4a90ff' : '#ff5a5a', size: 7 }));
    const word = this.ask() === 'more' ? 'More' : 'Fewer';
    this.busy = false;
    this.success(new T.Vector3(0, ROW_Y[1], ROW_Z), `${word}!`);
    this.gobble(side);
  }

  // Gull swoops onto the chosen row and gobbles it, then puffs up full and burps
  async gobble(side) {
    const g = this.gull, s = this.s;
    const chosen = this.groups[side];
    const row = side;
    const mid = chosen[Math.floor((chosen.length - 1) / 2)].position;
    await this.wait(0.1);
    this.flap(0.5, 1.2);
    await s.tween(g.position, { x: mid.x, y: ROW_Y[row] - 0.6, z: ROW_Z + 0.6 }, 0.3, Ease.inOut);
    sfx.chomp();
    for (const t of chosen) s.tween(t.scale, { x: 0.001, y: 0.001, z: 0.001 }, 0.2, Ease.in);
    for (const t of chosen) s.tween(t.position, { x: g.position.x, y: g.position.y + 0.9 }, 0.2, Ease.in);
    // belly puffs with every bite
    const k = 1 + Math.min(0.5, chosen.length * 0.07);
    await s.anim(0.3, (_, p) => { const q = 1 + (k - 1) * Math.sin(Math.min(1, p * 1.6) * Math.PI / 2); g.scale.set(q, 1 + (q - 1) * 0.4, q); });
    sfx.pop();
    fx.float(g.position.clone().add(new T.Vector3(0, 1.6, 0)), '♥', { color: '#ff5a8a', size: 6 });
  }

  afterSuccess() {
    for (const t of this.taps || []) input.remove(t);
    const g = this.gull, s = this.s;
    for (const t of this.groups.flat()) s.tween(t.scale, { x: 0.001, y: 0.001, z: 0.001 }, 0.2, Ease.in);
    for (const l of this.links) s.tween(l.scale, { x: 0.001, y: 0.001, z: 0.001 }, 0.2, Ease.in);
    this.flap(0.5, 1.0);
    s.tween(g.position, { x: GULL_HOME.x, y: GULL_HOME.y, z: GULL_HOME.z }, 0.45, Ease.inOut);
    s.tween(g.scale, { x: 1, y: 1, z: 1 }, 0.45, Ease.out);
  }

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
    this.time = t;
    const g = this.gull, w = g.userData.wings, mo = this.mood;
    // wings: a lazy idle sway, or a big flap when excited
    const flapping = this.flapUntil && t < this.flapUntil;
    const a = flapping ? Math.sin(t * 26) * this.flapAmt : Math.sin(t * 3) * 0.15;
    if (w) { w[0].rotation.z = a; w[1].rotation.z = -a; }
    // idle life: every few seconds Gull glances at one towel or the other, or at you, and tilts its head
    if (!this.busy) {
      mo.t += dt;
      if (mo.t > mo.next) {
        mo.t = 0; mo.next = 1.6 + Math.random() * 2.2;
        const r = Math.random();
        mo.look = r < 0.35 ? 0.6 : r < 0.7 ? -0.6 : 0;
        mo.tilt = Math.random() < 0.5 ? (Math.random() - 0.5) * 0.5 : 0;
      }
    }
    g.rotation.y += (mo.look - g.rotation.y) * Math.min(1, dt * 6);
    g.rotation.z += (mo.tilt - g.rotation.z) * Math.min(1, dt * 5);
  }

  onFinale() {
    const g = this.gull;
    this.flap(2.5, 1.1);
    this.s.anim(2.5, (e) => { g.position.set(Math.sin(e * Math.PI * 2) * 4, 4.2 + Math.sin(e * Math.PI * 4) * 1.5 + e * 0.5, -1.5 + Math.cos(e * Math.PI * 2) * 2); });
  }
}
