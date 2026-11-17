// Game 8 — Which has more? Topic mt__h7hvT4tEb "Comparing groups: more or fewer".
// Two groups of beach things tumble (real physics) into two holders; tap the one with more (Level 3: sometimes fewer).
// Then the groups hop out into two rows and pair up with little links so the extras stand out, and a hungry friend
// gobbles the pick while the other row drops and bounces on the sand.
// Each level has its own look: Level 1 picnic trays with Gull on her post, Level 2 glass jars with Duck,
// Level 3 beach wagons with big Crab. Every round brings a new snack or beach thing and new colours.
import * as T from '../three.js';
import { Lesson } from '../engine/lesson.js';
import { mesh, geo } from '../engine/toon.js';
import { popIn, popOut, hop, wiggle } from '../engine/actors.js';
import { makeGull, makeDuck, makeCrab } from '../engine/beach.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';
import { physics } from '../engine/physics.js';
import { setCamera } from '../engine/stage.js';
import { makeThing, NAME, STRIPES, makeHolder, HOLDER, makePost, HALF } from './more-items.js';

const RACK_X = 3.7, RACK_Z = 0.8;
const ROW_Y = [4.4, 3.3], ROW_Z = 2.4;   // the matched-up rows (kept below the caption)

// [left count, right count, kind, ask ('more'|'fewer'), options] — a new thing every round
const PLANS = [
  [[1, 4, 'fish'], [5, 1, 'shell'], [2, 6, 'star'], [3, 1, 'icecream'], [1, 5, 'ball'], [6, 2, 'cookie']],
  [[2, 4, 'shell'], [5, 3, 'icecream'], [3, 6, 'fish'], [4, 2, 'ball'], [3, 5, 'star'], [6, 4, 'cookie']],
  [[3, 4, 'cookie'], [5, 4, 'star'], [3, 5, 'ball', 'more', { scale: [1.35, 0.7] }], [2, 5, 'fish', 'fewer'], [4, 3, 'icecream', 'fewer'], [4, 5, 'shell', 'more', { spread: [1.35, 0.75] }]],
];
// who eats the pick on each level, where it waits, and where its mouth is (relative to its position)
const EATERS = [
  { make: () => makeGull(), at: [0.95, 2.6, -3.6], mouth: [0, 1.0, 0.5], call: 'gull', post: true },   // post right of Pip, never growing out of him
  { make: () => makeDuck(1.5), at: [0.95, 0, -2.8], mouth: [0, 1.6, 0.7], call: 'quack' },
  // big Crab at 1.1 (3.9 wide): its claws stay clear of the wagons' inner ends and it doesn't hide Pip behind it
  { make: () => { const c = makeCrab(0xff6a3a); c.scale.setScalar(1.1); return c; }, at: [0, 0, -2.6], mouth: [0, 0.82, 0.65], call: 'squeak' },
];

export default class MoreLesson extends Lesson {
  build() {
    // closer in: the holders and the things in them are big
    setCamera(new T.Vector3(0, 3.1, 12.2), new T.Vector3(0, 2.1, 0));
    this.plan = PLANS[this.level];
    this.hkind = HOLDER[this.level];
    this.racks = [makeHolder(this.hkind), makeHolder(this.hkind)];
    this.racks[0].position.set(-RACK_X, 0, RACK_Z);
    this.racks[1].position.set(RACK_X, 0, RACK_Z);
    this.racks.forEach((r) => (r.userData.base = 1));
    this.root.add(...this.racks);
    const E = (this.eaterCfg = EATERS[this.level]);
    this.gull = E.make();
    this.gull.position.set(...E.at);
    this.gull.userData.baseScale = this.gull.scale.x;
    this.home = this.gull.position.clone();
    this.root.add(this.gull);
    if (E.post) {
      const post = makePost();
      post.position.set(E.at[0], 0, E.at[2]);
      this.root.add(post);
    }
    this.groups = [[], []];
    this.links = [];
    this.fallen = [];
    // the holders never move, so their floors and walls are made once (never physics.clear() between rounds)
    this.holderStatics();
    // Pip stands in the gap between the tall stalls / glass jars (no room at the sides, and behind a jar he looked
    // like one of the things to count); the low wagons leave him room at the back
    // L2: Pip and Duck stand further back so both fit inside the gap between the jars (the jars' glass posts and the
    // things in them no longer overlap them)
    const PIP = [[-0.8, 0, -1.7], [-0.7, 0, -3.3], [-2.9, 0, -8.5]][this.level];   // set back so he never stands in front of a holder's things
    this.pip.position.set(...PIP);
    this.pip.rotation.y = 0.2;
    this.mood = { t: 0, next: 2, look: 0, tilt: 0 };
  }

  nudgeTarget() { return this.busy || !this.taps ? null : this.racks[this.rightSide()]; }
  ask() { return this.plan[this.round]?.[3] || 'more'; }
  rightSide() {
    const [l, r] = this.plan[this.round];
    return (this.ask() === 'more') === (l > r) ? 0 : 1;
  }

  // physics floor and walls for both holders (once, in build)
  holderStatics() {
    for (const rk of this.racks) for (const [x, y, z, sx, sy, sz] of rk.userData.statics) {
      physics.box(new T.Vector3(rk.position.x + x, y, rk.position.z + z), new T.Vector3(sx, sy, sz));
    }
  }

  // a body that only moves in the picture plane, so things never hide behind each other
  flat(obj, roll = true) {
    const b = physics.body(obj);
    if (!b) return;
    b.setEnabledTranslations(true, true, false, true);
    b.setEnabledRotations(false, false, roll, true);
    b.setAngularDamping(2.5);
  }

  // the things drop in one after another (under the stall's awning / through the jar's lifted lid / out of the sky
  // into the wagon) and pile up in the holder, always landing between its walls
  layoutGroup(side, n, kind, opts) {
    const spread = opts?.spread?.[side] ?? 1;
    const rk = this.racks[side], fy = rk.userData.floorY;
    // never more than fit side by side between the walls: a pile that hides things would spoil the counting
    const fit = (2 * rk.userData.inner - 0.12) / (Math.max(1, n) * 2 * (HALF[kind] || 0.4) * 1.06);
    const scale = Math.min(opts?.scale?.[side] ?? 1, fit);
    const half = (HALF[kind] || 0.4) * scale;
    const room = rk.userData.inner - half - 0.04;          // furthest a thing's middle may be from the holder's middle
    const step = n > 1 ? Math.min(0.82 * spread * scale, (2 * room) / (n - 1)) : 0;
    const items = [];
    for (let i = 0; i < n; i++) {
      const t = makeThing(kind);
      t.userData.baseScale = scale;
      t.scale.setScalar(scale);
      const x = rk.position.x + (i - (n - 1) / 2) * step;
      t.position.set(x + (Math.random() - 0.5) * 0.3, rk.userData.dropY + (i % 2) * 0.2, RACK_Z);
      t.rotation.z = (Math.random() - 0.5) * 0.8;
      t.visible = false;
      this.root.add(t);
      const d = 0.04 + side * 0.12 + i * 0.07;
      this.s.wait(d).then(() => {
        if (!t.parent) return;
        t.visible = true;
        const round = kind === 'ball';
        physics.add(t, { shape: round ? 'ball' : 'box', bounce: round ? 0.45 : 0.2, friction: 0.9 });
        this.flat(t, true);
        const sky = this.hkind === 'cart';
        physics.toss(t, new T.Vector3(x, fy + half + 0.05, RACK_Z), { time: sky ? 0.62 : 0.32, arc: sky ? 0.4 : 0.25, spin: 0.4 });
        if (i % 2 === 0) sfx.bloop(i % 5);
      });
      items.push(t);
    }
    return items;
  }

  // Level 2: the jar lids lift while the things drop in, then close
  openJars() {
    for (const rk of this.racks) {
      const lid = rk.userData.lid?.userData?.bones?.lid;
      if (!lid) continue;
      const y0 = lid.userData.y0 ??= lid.position.y;
      this.s.anim(0.22, (e) => { lid.position.y = y0 + e * 1.1; lid.rotation.z = -e * 0.25; }, Ease.out)
        .then(() => this.s.wait(0.75))
        .then(() => this.s.anim(0.2, (e) => { lid.position.y = y0 + (1 - e) * 1.1; lid.rotation.z = -(1 - e) * 0.25; }, Ease.in))
        .then(() => { if (!this.dead) sfx.tap(); });
    }
  }

  async startRound(r) {
    this.busy = true;
    for (const t of [...this.groups.flat(), ...this.fallen]) { physics.remove(t); popOut(this.s, t, 0.15).then(() => this.root.remove(t)); }
    for (const l of this.links) this.root.remove(l);
    this.links = []; this.fallen = [];
    for (const rk of this.racks) rk.scale.setScalar(1);
    const [l, rr, kind, , opts] = this.plan[r];
    this.kind = kind;
    // fresh colours for a fresh thing: the holders get a new paint job
    const [ca, cb] = STRIPES[kind];
    this.paint(ca, cb);
    for (const rk of this.racks) this.s.anim(0.3, (_, p) => { const k = Math.sin(p * Math.PI) * 0.06; rk.scale.set(1 + k, 1 - k, 1); }).then(() => rk.scale.setScalar(1));
    sfx.swoosh();
    if (this.hkind === 'jar') this.openJars();
    this.groups = [this.layoutGroup(0, l, kind, opts), this.layoutGroup(1, rr, kind, opts)];
    this.gullExcited();
    this.taps = this.racks.map((rk, side) => input.addTap(rk, { radius: 2.3, offset: new T.Vector3(0, rk.userData.mid, 0.4), onTap: () => this.pick(side) }));
    await this.wait(0.55);
    this.busy = false;
    this.cue();
  }

  // repaint the coloured parts of the holders (their first-level toon meshes in the holder's own colour)
  paint(ca, cb) {
    this.racks.forEach((rk, side) => {
      if (!rk.userData.paintParts) {
        rk.userData.paintParts = [];
        rk.traverse((o) => { if (o.isMesh && o.material?.type === 'MeshToonMaterial' && o.material.color.getHex() === rk.userData.col) { o.material = o.material.clone(); rk.userData.paintParts.push(o); } });
      }
      for (const o of rk.userData.paintParts) o.material.color.setHex(side ? cb : ca);
    });
  }

  promptText() {
    const n = NAME[this.kind];
    const w = this.ask() === 'more' ? 'more' : 'fewer';
    const full = `${w === 'more' ? 'More' : 'Fewer'}! Which has ${w} ${n}?`;
    return full.length <= 30 ? full : `Which has ${w} ${n}?`;   // one line
  }
  prompt() { this.say(this.promptText(), this.ask() === 'more' ? { pitch: 0.95 } : { pitch: 1.4 }); }

  // ---- the eater's personality ----
  gullExcited() {
    const g = this.gull, s = this.s;
    s.wait(0.25).then(() => { sfx[this.eaterCfg.call](); hop(s, g, 0.45, 0.35); this.flap(0.5, 1.0); });
  }
  flap(dur, amt = 0.8) {
    this.flapUntil = this.time + dur;
    this.flapAmt = amt;
  }
  gullConfused(side) {
    const g = this.gull, s = this.s;
    this.mood.look = side ? -0.7 : 0.7;
    this.mood.tilt = side ? -0.35 : 0.35;
    s.anim(0.6, (_, p) => { g.rotation.x = Math.sin(p * Math.PI * 4) * 0.1; }).then(() => { g.rotation.x = 0; this.mood.tilt = 0; });
    fx.float(g.position.clone().add(new T.Vector3(0, 1.7 * g.scale.y, 0)), '?', { color: this.level === 2 ? '#ffd23f' : '#3fb6e0', size: 7 });   // yellow on the night beach (blue vanished)
  }

  async pick(side) {
    if (this.busy) return;
    this.mood.look = side ? -0.6 : 0.6;
    if (side !== this.rightSide()) {
      sfx[this.eaterCfg.call]();
      this.gullConfused(side);
      // the holder gives a shake and its things jump
      const rk = this.racks[side];
      wiggle(this.s, rk, 0.06, 0.35);
      this.groups[side].forEach((t, i) => this.s.wait(i * 0.04).then(() => physics.poke(t, 0.7)));
      this.redirect(this.ask() === 'more' ? `That one has fewer. Find more!` : `That one has more. Find fewer!`);
      return;
    }
    this.busy = true;
    input.lock(3000);
    sfx[this.eaterCfg.call]();
    this.flap(0.6, 1.1);
    hop(this.s, this.gull, 0.5, 0.35);
    // quick pairing: both groups hop out into two rows, one above the other
    const [Lg, Rg] = this.groups;
    for (const t of [...Lg, ...Rg]) { physics.remove(t); t.visible = true; }   // (the errorless step hid the wrong group: both rows must show for the match-up)
    const n = Math.max(Lg.length, Rg.length), m = Math.min(Lg.length, Rg.length);
    const sp = Math.min(1.15, 6.5 / n);
    const xAt = (i) => (i - (n - 1) / 2) * sp;
    sfx.whoosh();
    const moves = [];
    [Lg, Rg].forEach((grp, row) => grp.forEach((t, i) => {
      const k = 0.85; // same size in the rows, so it's a fair match-up
      const from = t.position.clone(), to = new T.Vector3(xAt(i), ROW_Y[row], ROW_Z);
      const r0 = t.rotation.z, s0 = t.scale.x;
      moves.push(this.s.anim(0.32, (e, p) => {
        t.position.lerpVectors(from, to, e);
        t.position.y += Math.sin(p * Math.PI) * 1.2; // a little hop out of the holder
        t.rotation.z = r0 * (1 - e);
        t.scale.setScalar(s0 + (k - s0) * e);
      }, Ease.out));
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

  // The eater gobbles the chosen row: each thing arcs into its mouth (chomp!), it puffs up and hearts float.
  // The other row lets go and tumbles onto the sand with real physics.
  async gobble(side) {
    const g = this.gull, s = this.s;
    const chosen = this.groups[side], other = this.groups[1 - side];
    for (const l of this.links) s.tween(l.scale, { x: 0.001, y: 0.001, z: 0.001 }, 0.15).then(() => this.root.remove(l));
    this.links = [];
    await this.wait(0.12);
    other.forEach((t, i) => {
      physics.add(t, { shape: t.userData.kind === 'ball' ? 'ball' : 'box', bounce: 0.55 });
      this.flat(t, true);
      physics.impulse(t, { x: (Math.random() - 0.5) * 3, y: 2 + Math.random() * 2, z: 0 }, { x: 0, y: 0, z: (Math.random() - 0.5) * 2 });
      this.fallen.push(t);
    });
    const mouth = g.position.clone().add(new T.Vector3(...this.eaterCfg.mouth));
    this.flap(0.9, 1.2);
    const base = g.userData.baseScale;
    const per = Math.min(0.08, 0.5 / chosen.length);
    chosen.forEach((t, i) => {
      const from = t.position.clone(), s0 = t.scale.x;
      s.wait(i * per).then(() => s.anim(0.3, (e, p) => {
        t.position.lerpVectors(from, mouth, e);
        t.position.y += Math.sin(p * Math.PI) * 1.0;
        t.scale.setScalar(Math.max(0.001, s0 * (1 - e * 0.85)));
      }, Ease.in)).then(() => {
        t.visible = false;
        sfx.chomp();
        // belly puffs with every bite
        const q = base * (1 + Math.min(0.45, (i + 1) * 0.07));
        s.anim(0.12, (_, p) => { const k = 1 + Math.sin(p * Math.PI) * 0.08; g.scale.set(q * k, base * (1 + (q / base - 1) * 0.4) / k, q * k); });
      });
    });
    await this.wait(chosen.length * per + 0.35);
    sfx.pop();
    fx.float(g.position.clone().add(new T.Vector3(0, 1.8 * base, 0)), '♥', { color: '#ff5a8a', size: 6 });
  }

  afterSuccess() {
    for (const t of this.taps || []) input.remove(t);
    const g = this.gull, s = this.s;
    this.flap(0.5, 1.0);
    const base = g.userData.baseScale;
    s.tween(g.position, { x: this.home.x, y: this.home.y, z: this.home.z }, 0.35, Ease.inOut);
    s.tween(g.scale, { x: base, y: base, z: base }, 0.45, Ease.out);
  }

  center(side) { return new T.Vector3(this.racks[side].position.x, this.racks[side].userData.mid, RACK_Z + 0.4); }
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
    // wings (or claws): a lazy idle sway, or a big flap when excited
    const flapping = this.flapUntil && t < this.flapUntil;
    const a = flapping ? Math.sin(t * 26) * this.flapAmt : Math.sin(t * 3) * 0.15;
    if (w) { w[0].rotation.z = a; w[1].rotation.z = -a; }
    const claws = g.userData.claws;
    if (claws && !w) { claws[0].rotation.x = (claws[0].userData.rx0 ??= claws[0].rotation.x) + a * 0.4; claws[1].rotation.x = (claws[1].userData.rx0 ??= claws[1].rotation.x) - a * 0.4; }
    // idle life: every few seconds the eater glances at one holder or the other, or at you, and tilts its head
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
    // the wagon wheels roll a little when the wagon wobbles
    for (const rk of this.racks) if (rk.userData.wheels) for (const wh of rk.userData.wheels) wh.rotation.y = (rk.scale.x - 1) * 8;
  }

  onFinale() {
    const g = this.gull;
    this.flap(2.5, 1.1);
    const h = this.home;
    this.s.anim(2.5, (e) => { g.position.set(h.x + Math.sin(e * Math.PI * 2) * 3, h.y + Math.abs(Math.sin(e * Math.PI * 4)) * 1.5, h.z + 1); });
  }
}
