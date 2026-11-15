// Game 12 — Grow a flower. Topics mt_0B64gfJf7j "Seeds & plant growth" and mt_L1469gt34A "What living things need".
// Plant the seed, water it, let the sun shine: the plant grows one stage per step and blooms.
import * as T from '../three.js';
import { Lesson } from '../engine/lesson.js';
import { mesh, geo, toon, basic } from '../engine/toon.js';
import { popIn, hop, wiggle, shake } from '../engine/actors.js';
import { makeWateringCan, makeSeedBag, makeSeed } from '../engine/farm.js';
import { makeCloud } from '../engine/scenery.js';
import { makeBeachBall } from '../engine/beach.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';

const MOUND = new T.Vector3(0.8, 0, 0.6);
const SUN_AT = new T.Vector3(4.6, 6.1, -1.5);
const ALL = ['seed', 'water', 'sun'];
const TOOL_AT = { seed: new T.Vector3(-4.4, 0, 3.0), water: new T.Vector3(-1.9, 0, 3.4), extra: new T.Vector3(4.4, 0, 3.0) };
const SAY = [
  { seed: 'Plant the seed!', water: 'Water it!', sun: 'Let the sun shine!' },
  { seed: 'Plant the seed!', water: 'Water it!', sun: 'Let the sun shine!' },
  { seed: 'The pot is empty! Plant a seed!', water: "It's thirsty! Water it!", sun: "It's too dark! Sun please!" },
];
const NOUN = { seed: 'the seed', water: 'water', sun: 'the sun' };
const EXTRA = { rock: 'A rock', sock: 'A sock', ball: 'A ball' };

// { steps, pre: stages already done, flower, extra: L3 distractor tool }
const PLANS = [
  [{ steps: ['seed'], pre: 0, flower: 'daisy' }, { steps: ['water'], pre: 1, flower: 'daisy' }, { steps: ['sun'], pre: 2, flower: 'tulip' },
    { steps: ['seed', 'water'], pre: 0, flower: 'tulip' }, { steps: ['water', 'sun'], pre: 1, flower: 'sunflower' }, { steps: ALL, pre: 0, flower: 'sunflower' }],
  ['daisy', 'tulip', 'sunflower', 'rose', 'daisy', 'sunflower'].map((flower) => ({ steps: ALL, pre: 0, flower })),
  [['rock', 'daisy'], ['sock', 'tulip'], ['ball', 'rose'], ['rock', 'sunflower'], ['sock', 'daisy'], ['ball', 'rose']]
    .map(([extra, flower], i) => ({ steps: i >= 4 ? ['seed', 'sun', 'water'] : ALL, pre: 0, flower, extra })),
];

function makeBloom(kind) {
  const g = new T.Group();
  const col = { daisy: 0xffffff, tulip: 0xff4b6b, sunflower: 0xffd23f, rose: 0xff8fc0 }[kind];
  const mid = { daisy: 0xffd23f, tulip: 0xffd23f, sunflower: 0x7a4a26, rose: 0xff5a9a }[kind];
  const petals = [];
  if (kind === 'tulip') {
    for (let i = 0; i < 3; i++) {
      const p = mesh(geo.sphere(0.3, 14, 10), col, { outline: 0.02 });
      p.scale.set(0.7, 1.2, 0.6); const a = (i / 3) * Math.PI * 2;
      p.position.set(Math.cos(a) * 0.15, 0.25, Math.sin(a) * 0.15);
      g.add(p); petals.push(p);
    }
  } else {
    const n = kind === 'sunflower' ? 12 : kind === 'rose' ? 7 : 9, r = kind === 'sunflower' ? 0.55 : 0.4;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const p = mesh(geo.sphere(0.2, 12, 8), col, { outline: 0.015 });
      p.scale.set(0.6, 1.3, 0.35); p.position.set(Math.cos(a) * r, Math.sin(a) * r, 0); p.rotation.z = a - Math.PI / 2;
      g.add(p); petals.push(p);
    }
    const d = mesh(geo.sphere(kind === 'sunflower' ? 0.36 : 0.22, 14, 10), mid, { outline: 0.02 }); d.scale.z = 0.5; d.position.z = 0.06;
    g.add(d);
  }
  g.userData.petals = petals;
  return g;
}

function makePlant(kind) {
  const g = new T.Group();
  const seed = makeSeed(); seed.position.y = 0.42; seed.visible = false;
  const sprout = new T.Group();
  const stem = mesh(geo.cyl(0.07, 0.09, 1, 8), 0x4f9e3a, { outline: 0.015 }); stem.position.y = 0.5;
  sprout.add(stem);
  const leaves = [];
  for (const s of [-1, 1]) {
    const l = mesh(geo.sphere(0.22, 12, 8), 0x58c45e, { outline: 0.015 });
    l.scale.set(1.5, 0.35, 0.8); l.position.set(s * 0.3, 0.45, 0); l.rotation.z = s * 0.5;
    sprout.add(l); leaves.push(l);
  }
  sprout.position.y = 0.4; sprout.scale.setScalar(0.001); sprout.visible = false;
  const bloom = makeBloom(kind); bloom.position.set(0, 1.4, 0.05); bloom.visible = false;
  sprout.add(bloom);
  g.add(seed, sprout);
  g.userData = { seed, sprout, stem, bloom, stage: 0 };
  return g;
}

function makeExtra(kind) {
  if (kind === 'ball') { const b = makeBeachBall(0.45); b.position.y = 0.45; const g = new T.Group(); g.add(b); return g; }
  const g = new T.Group();
  if (kind === 'rock') { const r = mesh(geo.sphere(0.5, 8, 6), 0x9a95a6, { outline: 0.03 }); r.scale.set(1.2, 0.7, 1); r.position.y = 0.35; g.add(r); }
  else {
    const leg = mesh(geo.cyl(0.25, 0.25, 0.9, 12), 0xff5a5a, { outline: 0.025 }); leg.position.y = 0.7;
    const foot = mesh(geo.sphere(0.3, 12, 8), 0xff5a5a, { outline: 0.025 }); foot.scale.set(1.5, 0.8, 1); foot.position.set(0.25, 0.25, 0);
    const stripe = mesh(geo.cyl(0.26, 0.26, 0.15, 12), 0xffffff, { outline: 0 }); stripe.position.y = 0.95;
    g.add(leg, foot, stripe);
  }
  return g;
}

export default class GrowLesson extends Lesson {
  build() {
    this.plan = PLANS[this.level];
    this.pip.position.set(-7.6, 0, -1.5);
    // soil bed + mound
    const bed = mesh(geo.box(16, 0.3, 1.6), 0x8a5a3b, { hull: 1.01, outline: 0 }); bed.position.set(0, 0.1, -2.6);
    this.root.add(bed);
    this.mound = mesh(geo.sphere(1.2, 20, 12), 0x7a4a2c, { outline: 0.03 }); this.mound.scale.set(1.3, 0.35, 1); this.mound.position.copy(MOUND);
    this.root.add(this.mound);
    // sun behind a cloud
    this.sunG = new T.Group(); this.sunG.position.copy(SUN_AT);
    this.sun = mesh(geo.sphere(0.95, 20, 14), 0xffd23f, { outline: 0.03 });
    this.rays = new T.Group();
    for (let i = 0; i < 10; i++) { const r = mesh(geo.cone(0.16, 0.5, 6), 0xffb020, { outline: 0.012 }); const a = (i / 10) * Math.PI * 2; r.position.set(Math.cos(a) * 1.3, Math.sin(a) * 1.3, 0); r.rotation.z = a - Math.PI / 2; this.rays.add(r); }
    this.sunG.add(this.rays, this.sun);
    this.cloud = makeCloud(0, 0, 0.9, 1.05); this.cloud.userData.cloud = false; this.cloud.position.set(SUN_AT.x, SUN_AT.y - 0.15, SUN_AT.z + 0.9);
    this.root.add(this.sunG, this.cloud);
    this.sunTap = input.addTap(this.cloud, { radius: 1.6, onTap: () => this.use('sun') });
    // tools
    this.tools = {};
    const seedBag = makeSeedBag(), can = makeWateringCan();
    for (const [k, o] of [['seed', seedBag], ['water', can]]) {
      o.position.copy(TOOL_AT[k]);
      this.root.add(o);
      this.tools[k] = o;
      o.userData.drag = input.addDrag(o, {
        radius: 1.0, minY: 0, offset: new T.Vector3(0, 0.6, 0),
        zones: () => [{ pos: MOUND.clone().add(new T.Vector3(0, 0.8, 0)), radius: 1.8 }],
        onPick: () => this.s.tween(o.scale, { x: 1.15, y: 1.15, z: 1.15 }, 0.12),
        onDrop: (z) => this.dropTool(k, z),
      });
    }
    this.planted = [];
  }

  get step() { const p = this.plan[this.round]; return p && p.steps[this.done]; }

  async startRound(r) {
    this.busy = true;
    const p = this.plan[r];
    this.done = 0;
    this.cloud.position.set(SUN_AT.x, SUN_AT.y - 0.15, SUN_AT.z + 0.9);
    this.sunG.scale.setScalar(0.85);
    this.sunTap.enabled = true;
    // only show the tools this round uses (Level 1), plus the silly distractor (Level 3)
    for (const k of ['seed', 'water']) {
      const t = this.tools[k], need = p.steps.includes(k) || this.level > 0;
      t.visible = need; t.userData.drag.enabled = need; t.position.copy(TOOL_AT[k]); t.scale.setScalar(1);
    }
    this.cloud.visible = p.steps.includes('sun') || this.level > 0; this.sunTap.enabled = this.cloud.visible;
    if (this.extra) { input.remove(this.extra.userData.drag); this.root.remove(this.extra); this.extra = null; }
    if (p.extra) {
      const e = makeExtra(p.extra); e.position.copy(TOOL_AT.extra); e.userData.kind = p.extra;
      this.root.add(e); popIn(this.s, e, 1, 0.35); this.extra = e;
      e.userData.drag = input.addDrag(e, { radius: 1.0, minY: 0, offset: new T.Vector3(0, 0.5, 0), zones: () => [{ pos: MOUND.clone().add(new T.Vector3(0, 0.8, 0)), radius: 1.8 }], onDrop: (z) => this.dropTool(p.extra, z) });
    }
    // a fresh plant in the mound, with any stages already done
    this.plant = makePlant(p.flower); this.plant.position.copy(MOUND); this.root.add(this.plant);
    for (let i = 0; i < p.pre; i++) this.grow(true);
    await this.wait(0.3);
    this.busy = false;
    this.cue();
  }

  promptText() { return this.step ? SAY[this.level][this.step] : ''; }

  // the plant grows a stage: 1 seed in soil, 2 sprout, 3 bloom
  grow(instant = false) {
    const u = this.plant.userData;
    u.stage++;
    const d = instant ? 0.001 : 1;
    if (u.stage === 1) { u.seed.visible = true; if (!instant) popIn(this.s, u.seed, 0.9, 0.3); }
    if (u.stage === 2) {
      u.seed.visible = false; u.sprout.visible = true;
      this.s.tween(u.sprout.scale, { x: 0.8, y: 0.8, z: 0.8 }, 0.5 * d, Ease.back);
    }
    if (u.stage === 3) {
      u.bloom.visible = true;
      this.s.tween(u.sprout.scale, { x: 1.25, y: 1.4, z: 1.25 }, 0.45 * d, Ease.back);
      u.bloom.scale.setScalar(0.001);
      this.s.tween(u.bloom.scale, { x: 1, y: 1, z: 1 }, 0.5 * d, Ease.elastic);
      if (!instant) u.bloom.userData.petals.forEach((pt, i) => { const s0 = pt.scale.clone(); pt.scale.multiplyScalar(0.01); this.s.wait(0.05 * i).then(() => this.s.tween(pt.scale, { x: s0.x, y: s0.y, z: s0.z }, 0.3, Ease.back)); });
    }
    if (!instant) { sfx.bloop(u.stage); sfx.twinkle(); }
  }

  async dropTool(k, zone) {
    const o = k in this.tools ? this.tools[k] : this.extra;
    const home = k in this.tools ? TOOL_AT[k] : TOOL_AT.extra;
    this.s.tween(o.scale, { x: 1, y: 1, z: 1 }, 0.15);
    if (!zone || this.busy) { this.s.tween(o.position, { x: home.x, y: home.y, z: home.z }, 0.35, Ease.back); sfx.land(); return; }
    this.use(k);
  }

  async use(k) {
    if (this.busy) return;
    const want = this.step;
    const o = this.tools[k] || this.extra;
    const home = TOOL_AT[k] || TOOL_AT.extra;
    if (k !== want) {
      if (o && k !== 'sun') { shake(this.s, o, 0.2); this.s.tween(o.position, { x: home.x, y: home.y, z: home.z }, 0.45, Ease.back); }
      else wiggle(this.s, this.cloud, 0.2);
      if (EXTRA[k]) { sfx.boing(); this.redirect(`${EXTRA[k]}? Silly! Try ${NOUN[want]}.`); }
      else this.redirect(`Not yet. ${want === 'seed' ? 'Seed' : want === 'water' ? 'Water' : 'Sun'} first!`);
      return;
    }
    this.busy = true;
    input.lock(1400);
    this.clearHints();
    if (k === 'seed') {
      await this.s.tween(o.position, { x: MOUND.x - 0.2, y: 1.6, z: MOUND.z }, 0.25, Ease.out);
      await this.s.tween(o.rotation, { z: -2.2 }, 0.2);
      const seed = makeSeed(); seed.position.set(MOUND.x, 1.6, MOUND.z); this.root.add(seed);
      this.s.tween(seed.position, { y: 0.45 }, 0.3, Ease.in).then(() => { this.root.remove(seed); sfx.land(); });
      await this.wait(0.3);
      this.s.tween(o.rotation, { z: 0 }, 0.25);
      this.s.tween(o.position, { x: home.x, y: home.y, z: home.z }, 0.45, Ease.inOut);
    } else if (k === 'water') {
      await this.s.tween(o.position, { x: MOUND.x - 1.7, y: 1.6, z: MOUND.z }, 0.25, Ease.out);
      await this.s.tween(o.rotation, { z: -0.6 }, 0.2);
      sfx.pour();
      for (let i = 0; i < 14; i++) this.s.wait(i * 0.04).then(() => {
        const d = new T.Mesh(geo.sphere(0.07, 6, 4), basic(0x7fd0ff));
        const rp = o.userData.rose.getWorldPosition(new T.Vector3());
        d.position.copy(rp).add(new T.Vector3(Math.random() * 0.3, 0, Math.random() * 0.3 - 0.15));
        this.root.add(d);
        this.s.tween(d.position, { y: 0.4, x: d.position.x + 0.2 }, 0.4, Ease.in).then(() => this.root.remove(d));
      });
      await this.wait(0.65);
      this.s.tween(o.rotation, { z: 0 }, 0.25);
      this.s.tween(o.position, { x: home.x, y: home.y, z: home.z }, 0.45, Ease.inOut);
    } else {
      sfx.swoosh();
      this.s.tween(this.cloud.position, { x: SUN_AT.x + 6 }, 0.5, Ease.in);
      this.s.tween(this.sunG.scale, { x: 1.15, y: 1.15, z: 1.15 }, 0.4, Ease.back);
      sfx.twinkle();
      await this.wait(0.35);
    }
    this.grow();
    this.done++;
    this.cur.hints = this.cur.hints; // steps within a round share the round's record
    if (this.done < this.plan[this.round].steps.length) {
      await this.wait(0.35);
      this.busy = false;
      this.idle = 0; this.ladder = 0;
      this.cue();
      return;
    }
    // bloomed!
    await this.wait(0.35);
    this.bee();
    hop(this.s, this.plant, 0.3, 0.3);
    this.busy = false;
    this.success(MOUND.clone().add(new T.Vector3(0, 2.4, 0)), 'It grew!');
  }

  bee() {
    const b = new T.Group();
    const body = mesh(geo.sphere(0.2, 12, 8), 0xffd23f, { outline: 0.02 }); body.scale.set(1.3, 1, 1);
    const stripe = mesh(geo.cyl(0.21, 0.21, 0.08, 12), 0x3a2838, { outline: 0 }); stripe.rotation.z = Math.PI / 2;
    const w = mesh(geo.sphere(0.14, 8, 6), 0xffffff, { outline: 0.01 }); w.scale.set(0.6, 1, 0.3); w.position.y = 0.2;
    b.add(body, stripe, w);
    this.root.add(b);
    sfx.buzz();
    this.s.anim(1.4, (_, p) => {
      const a = p * Math.PI * 2;
      b.position.set(MOUND.x + Math.cos(a) * 1.4, 2.4 + Math.sin(a * 2) * 0.4, MOUND.z + Math.sin(a) * 0.8 + 0.5);
      w.rotation.x = Math.sin(p * 80) * 0.6;
    }).then(() => this.root.remove(b));
  }

  async afterSuccess() {
    // the finished flower hops to its spot in the back row
    const pl = this.plant, i = this.planted.length;
    this.planted.push(pl);
    const to = new T.Vector3(-5 + i * 2, 0.25, -2.6);
    const from = pl.position.clone();
    sfx.swoosh();
    this.s.anim(0.45, (e) => { pl.position.lerpVectors(from, to, e); pl.position.y += Math.sin(e * Math.PI) * 1.2; pl.scale.setScalar(1 - e * 0.25); }, Ease.inOut).then(() => sfx.land());
    if (this.round < 6) this.s.tween(this.mound.scale, { x: 1.3, y: 0.35, z: 1 }, 0.2);
  }

  target() {
    const k = this.step;
    if (k === 'sun') return this.cloud.position.clone();
    return this.tools[k].position.clone().add(new T.Vector3(0, 0.6, 0));
  }
  showHint(glow = true) {
    const k = this.step;
    if (!k) return;
    if (glow) this.addHalo(k === 'sun' ? this.cloud : this.tools[k], 1.3);
    if (k === 'sun') fx.ghostPath([this.cloud.position.clone()], { mode: 'tap' });
    else fx.ghostPath([this.target(), MOUND.clone().add(new T.Vector3(0, 1, 0))], { mode: 'drag' });
  }
  choicePoints() {
    const pts = [];
    for (const k of ['seed', 'water']) if (this.tools[k].visible) pts.push(this.tools[k].position.clone().add(new T.Vector3(0, 0.6, 0)));
    if (this.extra) pts.push(this.extra.position.clone().add(new T.Vector3(0, 0.6, 0)));
    if (this.cloud.visible) pts.push(this.cloud.position.clone());
    return pts;
  }
  makeErrorless() {
    const k = this.step;
    for (const t of ['seed', 'water']) if (t !== k) { this.tools[t].userData.drag.enabled = false; this.tools[t].visible = false; }
    if (k !== 'sun') this.sunTap.enabled = false;
    if (this.extra) { this.extra.userData.drag.enabled = false; this.extra.visible = false; }
  }
  // errorless lasts only for the step that triggered it
  cue() { if (this.errorlessOn && this.lastStep !== this.step) { this.errorlessOn = false; this.restoreTools(); } this.lastStep = this.step; super.cue(); }
  restoreTools() {
    const p = this.plan[this.round];
    for (const k of ['seed', 'water']) { const need = p.steps.includes(k) || this.level > 0; this.tools[k].visible = need; this.tools[k].userData.drag.enabled = need; }
    this.sunTap.enabled = this.cloud.visible;
    if (this.extra) { this.extra.visible = true; this.extra.userData.drag.enabled = true; }
  }

  update(dt, t) {
    this.rays.rotation.z = t * 0.4;
    for (const pl of this.planted) pl.rotation.z = Math.sin(t * 1.4 + pl.position.x) * 0.06;
  }

  onFinale() {
    this.planted.forEach((pl, i) => this.s.wait(i * 0.15).then(() => { hop(this.s, pl, 0.5, 0.35); sfx.note(i); }));
    this.bee();
  }
}
