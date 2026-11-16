// Game 12 — Grow a flower. Topics mt_0B64gfJf7j "Seeds & plant growth" and mt_L1469gt34A "What living things need".
// Plant the seed, water it, let the sun shine: the plant grows one stage per step and blooms.
// Each round uses a different planter (pot, boot, teacup…). Water makes leaves unfurl around a bud; sun makes the bud
// burst into a smiling flower, and a bee or butterfly comes to visit.
// Each level is a different garden: the back garden with a picket fence (one big seed, a blue can), the vegetable patch
// (three striped sunflower seeds, a green can) and the greenhouse (two speckled beans, an orange can).
// Planters drop in, seeds fall and bounce into the soil, water drops splash and the bloom's petals flutter down,
// all with real physics.
import * as T from '../three.js';
import { Lesson } from '../engine/lesson.js';
import { mesh, geo, basic } from '../engine/toon.js';
import { popIn, hop, wiggle, shake, setFace } from '../engine/actors.js';
import { makeWateringCan, makeSeedBag, stillProp } from '../engine/farm.js';
import { propModel } from '../engine/prop-models.js';
import { makeCloud } from '../engine/scenery.js';
import { makeBeachBall } from '../engine/beach.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';
import { physics } from '../engine/physics.js';
import { toon } from '../engine/toon.js';
import { frame, calmBackdrop } from './view-tools.js';
import { makePlanter, makePlant, setStem, STEM_H, SOIL, WET_SOIL, petalColor, makeBee, makeButterfly, makeLevelSeed, makeGardenSet, CAN_COLS } from './grow-garden.js';

const MOUND = new T.Vector3(0.8, 0, 0.6);
const PSCALE = 1.3; // planters are drawn a bit bigger than life
const SUN_AT = new T.Vector3(4.4, 5.0, -1.5);
const ALL = ['seed', 'water', 'sun'];
const TOOL_AT = { seed: new T.Vector3(-4.0, 0, 2.6), water: new T.Vector3(-1.6, 0, 3.0), extra: new T.Vector3(3.9, 0, 2.6) };
const SAY = [
  { seed: 'Plant the seed!', water: 'Water it!', sun: 'Let the sun shine!' },
  { seed: 'Plant the seed!', water: 'Water it!', sun: 'Let the sun shine!' },
  { seed: 'The pot is empty! Plant a seed!', water: "It's thirsty! Water it!", sun: "It's too dark! Sun please!" },
];
const NOUN = { seed: 'the seed', water: 'water', sun: 'the sun' };
const EXTRA = { rock: 'A rock', sock: 'A sock', ball: 'A ball' };
// a different planter every round
const POTS = [
  ['mound', 'pot', 'boot', 'box', 'teacup', 'tub'],
  ['pot', 'box', 'teacup', 'mound', 'tub', 'boot'],
  ['boot', 'tub', 'bluepot', 'teacup', 'pot', 'box'],
];

// { steps, pre: stages already done, flower, extra: L3 distractor tool }
const PLANS = [
  [{ steps: ['seed'], pre: 0, flower: 'daisy' }, { steps: ['water'], pre: 1, flower: 'daisy' }, { steps: ['sun'], pre: 2, flower: 'tulip' },
    { steps: ['seed', 'water'], pre: 0, flower: 'tulip' }, { steps: ['water', 'sun'], pre: 1, flower: 'sunflower' }, { steps: ALL, pre: 0, flower: 'sunflower' }],
  ['daisy', 'tulip', 'sunflower', 'rose', 'daisy', 'sunflower'].map((flower) => ({ steps: ALL, pre: 0, flower })),
  [['rock', 'daisy'], ['sock', 'tulip'], ['ball', 'rose'], ['rock', 'sunflower'], ['sock', 'daisy'], ['ball', 'rose']]
    .map(([extra, flower], i) => ({ steps: i >= 4 ? ['seed', 'sun', 'water'] : ALL, pre: 0, flower, extra })),
];
PLANS.forEach((plan, l) => plan.forEach((p, i) => { p.pot = POTS[l][i]; }));

function makeExtra(kind) {
  if (kind === 'ball') { const b = makeBeachBall(0.45); b.position.y = 0.45; const g = new T.Group(); g.add(b); return g; }
  const g = new T.Group();
  const pm = propModel(kind === 'rock' ? 'prop_farmrock' : 'prop_farmsock', { size: kind === 'rock' ? 1.0 : 0.82 });
  if (pm) { stillProp(pm); if (kind === 'sock') pm.rotation.y = 0.9; g.add(pm); return g; }
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
    this.pip.position.set(-6.5, 0, -1.2); // in front of the back bed, never standing inside it
    frame(0, 3.4, 12.6, 0, 2.4, 0);
    // one sun only (this game's own sun with a face): the scenery's sky sun goes; no leaf litter by the tools;
    // weather falls behind the garden
    calmBackdrop(this.meadow, { hide: (o) => !!o.userData.sun });
    // soil bed at the back where finished flowers line up
    const bed = mesh(geo.box(16, 0.3, 1.6), 0x8a5a3b, { hull: 1.01, outline: 0 }); bed.position.set(0, 0.1, -2.6);
    this.root.add(bed);
    // sun (with a face) behind a cloud
    this.sunG = new T.Group(); this.sunG.position.copy(SUN_AT);
    const sm = propModel('prop_growsun');
    if (sm) { // the Blender sun: a code face, rays on their own bone so they can turn
      stillProp(sm);
      this.sun = sm; this.rays = sm.userData.bones.rays; this.sunFace = sm.userData.model.userData.face;
      this.sunG.add(sm);
    } else this.codeSun();
    this.cloud = makeCloud(0, 0, 0.9, 1.05); this.cloud.userData.cloud = false; this.cloud.position.set(SUN_AT.x, SUN_AT.y - 0.15, SUN_AT.z + 0.9);
    this.root.add(this.sunG, this.cloud);
    this.buildTools();
  }

  codeSun() {
    this.sun = mesh(geo.sphere(0.95, 20, 14), 0xffd23f, { outline: 0.03 });
    const face = new T.Group(); face.position.z = 0.9;
    for (const s of [-1, 1]) {
      const e = mesh(geo.sphere(0.09, 8, 6), 0x3a2838, { outline: 0 }); e.position.set(s * 0.3, 0.15, 0); e.scale.set(1, 1.3, 0.5); face.add(e);
      const c = new T.Mesh(geo.sphere(0.12, 8, 6), basic(0xff9f3f)); c.position.set(s * 0.5, -0.12, -0.05); c.scale.z = 0.3; face.add(c);
    }
    const smile = mesh(geo.torus(0.25, 0.045, Math.PI, 4, 12), 0x3a2838, { outline: 0 }); smile.rotation.z = Math.PI; smile.position.y = -0.1; face.add(smile);
    this.sun.add(face);
    this.rays = new T.Group();
    for (let i = 0; i < 10; i++) { const r = mesh(geo.cone(0.16, 0.5, 6), 0xffb020, { outline: 0.012 }); const a = (i / 10) * Math.PI * 2; r.position.set(Math.cos(a) * 1.3, Math.sin(a) * 1.3, 0); r.rotation.z = a - Math.PI / 2; this.rays.add(r); }
    this.sunG.add(this.rays, this.sun);
  }

  buildTools() {
    this.sunTap = input.addTap(this.cloud, { radius: 1.6, onTap: () => this.use('sun') });
    // tools
    this.tools = {};
    const seedBag = makeSeedBag(), can = makeWateringCan(CAN_COLS[this.level]);
    for (const [k, o] of [['seed', seedBag], ['water', can]]) {
      o.position.copy(TOOL_AT[k]);
      this.root.add(o);
      this.tools[k] = o;
      o.userData.drag = input.addDrag(o, {
        radius: 1.0, minY: 0, offset: new T.Vector3(0, 0.6, 0),
        zones: () => [{ pos: this.soilTop().add(new T.Vector3(0, 0.5, 0)), radius: 1.8 }],
        onPick: () => this.s.tween(o.scale, { x: 1.15, y: 1.15, z: 1.15 }, 0.12),
        onDrop: (z) => this.dropTool(k, z),
      });
    }
    this.planted = [];
    this.visitorI = 0;
    this.debris = [];
    this.garden = makeGardenSet(this.level);
    this.root.add(this.garden);
    // each level has its own colour of watering can
    const col = CAN_COLS[this.level];
    if (col !== 0x4a90ff && !can.userData.model) can.traverse((o) => { if (o.material && !o.userData.outline && (o.material.color?.getHex() === 0x4a90ff || o.material.color?.getHex() === 0x3a78d8)) o.material = toon(o.material.color.getHex() === 0x4a90ff ? col : new T.Color(col).multiplyScalar(0.8).getHex()); });
  }

  get step() { const p = this.plan[this.round]; return p && p.steps[this.done]; }
  soilTop() { return MOUND.clone().setY((this.planter ? this.planter.userData.soilY : 0.4) * PSCALE); }

  async startRound(r) {
    this.busy = true;
    const p = this.plan[r];
    this.done = 0;
    // last round's catcher goes (no physics.clear(): nothing freezes); the fallen petals on the grass shrink away
    physics.removeStatic(this.potBody); this.potBody = null;
    this.debris.forEach((d, i) => { physics.remove(d); this.s.wait(i * 0.02).then(() => this.s.tween(d.scale, { x: 0.001, y: 0.001, z: 0.001 }, 0.18, Ease.in)).then(() => this.root.remove(d)); });
    this.debris = [];
    this.cloud.position.set(SUN_AT.x, SUN_AT.y - 0.15, SUN_AT.z + 0.9);
    this.s.tween(this.sunG.scale, { x: 0.85, y: 0.85, z: 0.85 }, 0.3);
    this.sunTap.enabled = true;
    // only show the tools this round uses (Level 1), plus the silly distractor (Level 3)
    for (const k of ['seed', 'water']) {
      const t = this.tools[k], need = p.steps.includes(k) || this.level > 0;
      t.visible = need; t.userData.drag.enabled = need; t.position.copy(TOOL_AT[k]); t.scale.setScalar(1); t.rotation.set(0, 0, 0);
    }
    this.cloud.visible = p.steps.includes('sun') || this.level > 0; this.sunTap.enabled = this.cloud.visible;
    if (this.extra) { input.remove(this.extra.userData.drag); this.root.remove(this.extra); this.extra = null; }
    if (p.extra) {
      const e = makeExtra(p.extra); e.position.copy(TOOL_AT.extra); e.userData.kind = p.extra;
      this.root.add(e); popIn(this.s, e, 1, 0.35); this.extra = e;
      e.userData.drag = input.addDrag(e, { radius: 1.0, minY: 0, offset: new T.Vector3(0, 0.5, 0), zones: () => [{ pos: this.soilTop().add(new T.Vector3(0, 0.5, 0)), radius: 1.8 }], onDrop: (z) => this.dropTool(p.extra, z) });
    }
    // a new planter drops in, with a fresh plant (and any stages already done)
    this.planter = makePlanter(p.pot);
    this.planter.position.copy(MOUND);
    this.planter.scale.setScalar(PSCALE);
    this.root.add(this.planter);
    this.plant = makePlant(p.flower);
    this.plant.position.y = this.planter.userData.soilY;
    this.planter.add(this.plant);
    for (let i = 0; i < p.pre; i++) this.grow(true);
    // it drops in with real physics, lands with a bump, then becomes a solid catcher for seeds and water
    const pl = this.planter, u = pl.userData;
    // (it falls in from above the top of the picture, so it never hangs in the sky, and arrives once last round's
    // flower has hopped out of the way)
    pl.position.y = 8.5;
    await this.wait(0.05);
    const fr = (u.kind === 'box' ? 1.3 : u.kind === 'mound' ? 1.6 : 0.9) * PSCALE;
    physics.add(pl, { shape: 'box', size: { x: fr * 1.6, y: u.soilY * PSCALE, z: fr }, spin: false, bounce: 0.05, mass: 3 });
    physics.impulse(pl, { x: 0, y: -11, z: 0 });
    this.s.wait(0.5).then(() => { sfx.thunk(); this.squash(pl, 0.25); });
    await this.wait(0.66);
    physics.remove(pl);
    pl.position.copy(MOUND);
    const sy = u.soilY * PSCALE;
    this.potBody = physics.container(new T.Vector3(MOUND.x, 0, MOUND.z), { r: u.soilR * PSCALE, h: sy + 0.5, floor: sy });
    this.busy = false;
    this.cue();
  }

  promptText() { return this.step ? SAY[this.level][this.step] : ''; }

  squash(o, amt = 0.2, dur = 0.3) {
    const b = o.scale.x;
    return this.s.anim(dur, (_, p) => { const k = 1 - amt * Math.sin(p * Math.PI) * (1 - p * 0.5); o.scale.set(b / Math.sqrt(k), b * k, b / Math.sqrt(k)); }).then(() => o.scale.setScalar(b));
  }

  // the plant grows a stage: 1 seed in soil, 2 stem + unfurling leaves + bud, 3 the bud bursts into a bloom
  grow(instant = false) {
    const pl = this.plant, u = pl.userData;
    u.stage++;
    if (u.stage === 1) { u.seed.visible = true; if (!instant) popIn(this.s, u.seed, 1, 0.3, { sound: false }); }
    if (u.stage === 2) {
      u.stemG.visible = true;
      if (instant) {
        u.seed.visible = false; setStem(pl, STEM_H.sprout);
        u.leaves.forEach((l) => { l.rotation.z = l.userData.s * 0.25; l.scale.setScalar(1); });
        u.bud.visible = true;
      } else {
        // the seed pops open, the stem shoots up, the leaves unfurl one after the other, a bud appears
        this.s.tween(u.seed.scale, { x: 0.001, y: 0.001, z: 0.001 }, 0.15).then(() => { u.seed.visible = false; });
        sfx.bloop(1);
        this.s.anim(0.4, (e) => setStem(pl, 0.001 + e * STEM_H.sprout), Ease.back);
        u.leaves.forEach((l, i) => this.s.wait(0.18 + i * 0.16).then(() => {
          sfx.rustle();
          this.s.anim(0.38, (e) => { l.scale.setScalar(Math.max(0.001, e)); l.rotation.z = l.userData.s * (1.45 - 1.2 * e); }, Ease.back);
        }));
        u.bud.visible = true; u.bud.scale.setScalar(0.001);
        this.s.wait(0.35).then(() => { popIn(this.s, u.bud, 1, 0.35, { sound: false }); sfx.bloop(3); });
      }
    }
    if (u.stage === 3) {
      if (instant) { setStem(pl, STEM_H.bloom); u.bud.visible = false; u.bloom.visible = true; return; }
      this.bloom();
    }
  }

  // anticipation (the bud swells and wiggles), then POP: petals burst out and the flower smiles
  async bloom() {
    const pl = this.plant, u = pl.userData;
    const h0 = u.h;
    this.s.anim(0.3, (e) => setStem(pl, h0 + (STEM_H.bloom - h0) * e), Ease.back);
    await this.s.anim(0.28, (_, p) => { const k = 1 + p * 0.35; u.bud.scale.set(k, k * (1 + Math.sin(p * Math.PI * 6) * 0.08), k); u.bud.rotation.z = Math.sin(p * Math.PI * 6) * 0.15; });
    u.bud.visible = false;
    u.bloom.visible = true;
    sfx.pop();
    sfx.twinkle();
    u.bloom.scale.setScalar(0.001);
    this.s.anim(0.5, (_, p) => u.bloom.scale.setScalar(Math.max(0.001, Ease.elastic(p))));
    u.bloom.userData.petals.forEach((pt, i) => { const s0 = pt.scale.clone(); pt.scale.multiplyScalar(0.01); this.s.wait(0.03 * i).then(() => this.s.tween(pt.scale, { x: s0.x, y: s0.y, z: s0.z }, 0.3, Ease.back)); });
    // petal burst
    const c = u.bloom.getWorldPosition(new T.Vector3());
    const col = petalColor(u.kind);
    // petals burst out and flutter down onto the grass (real physics), where they stay until the next round
    for (let i = 0; i < 10; i++) {
      const d = mesh(geo.sphere(0.14, 8, 6), col, { outline: 0.01 }); d.scale.set(0.6, 0.25, 1.2);
      const a = (i / 10) * Math.PI * 2;
      d.position.copy(c).add(new T.Vector3(Math.cos(a) * 0.5, Math.sin(a) * 0.5, 0.3)); this.root.add(d);
      physics.add(d, { shape: 'box', size: { x: 0.17, y: 0.07, z: 0.34 }, bounce: 0.2, mass: 0.05 });
      physics.impulse(d, { x: Math.cos(a) * 3.2, y: Math.sin(a) * 2.5 + 3.5, z: 1.4 + Math.random() }, { x: Math.random() * 0.3, y: Math.random() * 0.3, z: Math.random() * 0.3 });
      this.debris.push(d);
    }
    fx.confetti(c, 14);
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
      if (o && k !== 'sun') {
        // a silly thing bounces off the planter; a tool that isn't needed yet just shakes
        if (EXTRA[k]) this.spitOut(o, home);
        else { shake(this.s, o, 0.2); this.s.tween(o.position, { x: home.x, y: home.y, z: home.z }, 0.45, Ease.back); }
      } else wiggle(this.s, this.cloud, 0.2);
      wiggle(this.s, this.planter, 0.08, 0.4);
      if (EXTRA[k]) this.redirect(`${EXTRA[k]}? Silly! Try ${NOUN[want]}.`);
      else this.redirect(`Not yet. ${want === 'seed' ? 'Seed' : want === 'water' ? 'Water' : 'Sun'} first!`);
      return;
    }
    this.busy = true;
    input.lock(1400);
    this.clearHints();
    const top = this.soilTop();
    if (k === 'seed') {
      await this.s.tween(o.position, { x: top.x - 0.2, y: top.y + 1.4, z: top.z }, 0.22, Ease.out);
      await this.s.tween(o.rotation, { z: -2.2 }, 0.16, Ease.back);
      // the seeds tumble out and bounce into the soil (real physics)
      sfx.swoosh();
      const seeds = [];
      const n = { 0: 1, 1: 3, 2: 2 }[this.level];
      for (let i = 0; i < n; i++) {
        const seed = makeLevelSeed(this.level);
        seed.position.set(top.x - 0.1 + i * 0.12, top.y + 1.3 + i * 0.12, top.z + (i - 1) * 0.08); this.root.add(seed);
        physics.add(seed, { shape: 'ball', r: seed.userData.r * 0.95, bounce: 0.45, mass: 0.2 });
        physics.impulse(seed, { x: 0.4 + i * 0.3, y: 0.5, z: (i - 1) * 0.4 }, { x: 0.5, y: 0.5, z: 0.5 });
        seeds.push(seed);
      }
      this.s.tween(o.rotation, { z: 0 }, 0.25);
      this.s.tween(o.position, { x: home.x, y: home.y, z: home.z }, 0.45, Ease.inOut);
      await this.wait(0.3);
      this.dirt(top, 0x7a4a2c);
      this.squash(this.planter, 0.12, 0.25);
      // they snuggle into the soil
      this.s.wait(0.2).then(() => { for (const sd of seeds) { physics.remove(sd); this.s.tween(sd.scale, { x: 0.001, y: 0.001, z: 0.001 }, 0.2, Ease.in).then(() => this.root.remove(sd)); } });
    } else if (k === 'water') {
      await this.pour(o, top, home);
    } else {
      sfx.swoosh();
      this.s.tween(this.cloud.position, { x: SUN_AT.x + 6 }, 0.4, Ease.in);
      this.s.anim(0.5, (_, p) => this.sunG.scale.setScalar(0.85 + Ease.back(p) * 0.35));
      if (this.sunFace) { setFace(this.sunFace, 'joy'); this.s.wait(1.2).then(() => setFace(this.sunFace, 'happy')); }
      this.s.wait(0.2).then(() => { sfx.sparkle(); fx.float(top.clone().add(new T.Vector3(0.6, 2.2, 0.5)), '☀', { color: '#ffb020', size: 6 }); });
      // the plant stretches towards the sun
      this.s.anim(0.6, (_, p) => { this.plant.rotation.z = -Math.sin(p * Math.PI) * 0.18; }).then(() => { this.plant.rotation.z = 0; });
      await this.wait(0.15);
    }
    this.grow();
    this.done++;
    if (this.done < this.plan[this.round].steps.length) {
      await this.wait(0.3);
      this.busy = false;
      this.idle = 0; this.ladder = 0;
      this.cue();
      return;
    }
    if (this.plant.userData.stage >= 3) {
      // bloomed! a visitor comes, the praise starts while the petals are still flying
      await this.wait(0.22);
      this.visit();
    } else {
      // a seed or a sprout (Level 1's short rounds): the planter does a happy bounce
      await this.wait(0.1);
      hop(this.s, this.planter, 0.4, 0.35, { sound: true });
      sfx.sparkle();
      fx.float(top.clone().add(new T.Vector3(0, 1.4, 0.5)), this.plant.userData.stage === 1 ? '♥' : '✨', { color: '#ff5a7a', size: 6 });
    }
    this.busy = false;
    this.success(top.clone().add(new T.Vector3(0, 2.0, 0)));
  }

  // a silly thing lands in the planter, and the planter spits it right back out (real physics)
  spitOut(o, home) {
    const top = this.soilTop();
    o.userData.drag.enabled = false;
    physics.add(o, { shape: 'ball', r: 0.45, bounce: 0.5, mass: 0.6 });
    physics.toss(o, top.clone().add(new T.Vector3(0, 0.5, 0)), { arc: 1.2, time: 0.35 });
    this.s.wait(0.38).then(() => {
      sfx.boing();
      this.squash(this.planter, 0.2, 0.25);
      physics.impulse(o, { x: 3.2, y: 6.5, z: 1.2 }, { x: 0, y: 0, z: -2 });
    });
    this.s.wait(1.1).then(() => {
      physics.remove(o);
      o.rotation.set(0, 0, 0);
      this.s.tween(o.position, { x: home.x, y: home.y, z: home.z }, 0.35, Ease.back).then(() => { if (o.userData.drag && !this.errorlessOn) o.userData.drag.enabled = true; });
    });
  }

  // the watering can leans back, tips forward with a stream of drops that splash on the soil, and the soil darkens
  async pour(o, top, home) {
    await this.s.tween(o.position, { x: top.x - 1.75, y: top.y + 0.75, z: top.z + 0.2 }, 0.22, Ease.out);
    await this.s.tween(o.rotation, { z: 0.2 }, 0.1, Ease.out);
    await this.s.tween(o.rotation, { z: -0.75 }, 0.18, Ease.back);
    sfx.pour();
    const soil = this.planter.userData.soil, c0 = new T.Color(SOIL), c1 = new T.Color(WET_SOIL);
    const n = 18;
    // real water drops: they arc out of the spout, splash into the soil and soak in
    for (let i = 0; i < n; i++) this.s.wait(i * 0.03).then(() => {
      if (this.dead) return;
      const d = new T.Mesh(geo.sphere(0.08, 6, 4), basic(0x7fd0ff));
      const rp = o.userData.rose.getWorldPosition(new T.Vector3());
      d.position.copy(rp);
      this.root.add(d);
      physics.add(d, { shape: 'ball', r: 0.08, bounce: 0.25, mass: 0.05, spin: false });
      physics.impulse(d, { x: 1.5 + Math.random() * 0.6, y: 0.2, z: (Math.random() - 0.5) * 0.7 });
      this.s.wait(0.42).then(() => {
        physics.remove(d);
        if (i % 3 === 0) this.ring(d.position.clone().setY(top.y + 0.03));
        this.s.tween(d.scale, { x: 1.8, y: 0.01, z: 1.8 }, 0.12).then(() => this.root.remove(d));
      });
    });
    this.s.anim(0.6, (_, p) => soil.material.color.copy(c0).lerp(c1, p));
    this.s.wait(0.3).then(() => wiggle(this.s, this.plant, 0.12, 0.4));
    await this.wait(0.6);
    sfx.splash();
    this.s.tween(o.rotation, { z: 0 }, 0.25);
    this.s.tween(o.position, { x: home.x, y: home.y, z: home.z }, 0.45, Ease.inOut);
  }
  ring(pos) {
    const r = new T.Mesh(geo.ring(0.12, 0.18, 18), basic(0xbfeaff, { transparent: true, opacity: 0.9 }));
    r.rotation.x = -Math.PI / 2; r.position.copy(pos); this.root.add(r);
    this.s.anim(0.35, (_, p) => r.scale.setScalar(1 + p * 2)).then(() => this.root.remove(r));
  }
  dirt(pos, col) {
    for (let i = 0; i < 6; i++) {
      const d = mesh(geo.sphere(0.08, 6, 4), col, { outline: 0 }); d.position.copy(pos); this.root.add(d);
      const a = (i / 6) * Math.PI * 2, v = new T.Vector3(Math.cos(a) * 1.2, 1.6, Math.sin(a) * 0.6);
      this.s.anim(0.35, (_, q) => { const t = q * 0.5; d.position.set(pos.x + v.x * t, pos.y + v.y * t - 6 * t * t, pos.z + v.z * t); }).then(() => this.root.remove(d));
    }
  }

  // a bee or a butterfly (taking turns) flies in, lands on the new flower, and flies away
  visit() {
    const bee = this.visitorI++ % 2 === 0;
    const v = bee ? makeBee() : makeButterfly([0xa77bff, 0x4a90ff, 0xff9f3f][this.round % 3]);
    const land = this.plant.userData.bloom.getWorldPosition(new T.Vector3()).add(new T.Vector3(0.15, 0.55, 0.25));
    const from = new T.Vector3(9, 6, 1), to = new T.Vector3(-9, 7, 1);
    this.root.add(v);
    if (bee) sfx.buzz(); else sfx.twinkle();
    const w = v.userData.wings;
    const flap = (t, fast) => { for (let i = 0; i < w.length; i++) { if (bee) w[i].rotation.x = Math.sin(t * 60) * 0.6; else w[i].rotation.z = (i ? -1 : 1) * Math.sin(t * (fast ? 22 : 8)) * 0.9; } };
    let t = 0;
    return this.s.anim(1.5, (_, p) => {
      t += 1 / 60;
      if (p < 0.35) { const e = Ease.out(p / 0.35); v.position.lerpVectors(from, land, e); v.position.y += Math.sin(e * Math.PI * 3) * 0.4 * (1 - e); v.rotation.y = bee ? Math.PI : -0.4; flap(t, true); }
      else if (p < 0.65) { v.position.copy(land); v.position.y += Math.abs(Math.sin(t * 6)) * 0.05; flap(t, false); if (!v.userData.sat) { v.userData.sat = true; fx.float(land.clone().add(new T.Vector3(0, 0.6, 0)), '♥', { color: '#ff5a7a', size: 5 }); } }
      else { const e = Ease.in((p - 0.65) / 0.35); v.position.lerpVectors(land, to, e); v.position.y += Math.sin(e * Math.PI * 2) * 0.5; v.rotation.y = bee ? 0 : 0.4; flap(t, true); }
    }).then(() => this.root.remove(v));
  }

  async afterSuccess() {
    // the finished flower hops, planter and all, to its spot in the back row
    const pl = this.planter, i = this.planted.length;
    this.planted.push(pl);
    const to = new T.Vector3(-5 + i * 2, 0.25, -2.6);
    const from = pl.position.clone();
    sfx.swoosh();
    this.s.anim(0.45, (e) => { pl.position.lerpVectors(from, to, e); pl.position.y += Math.sin(e * Math.PI) * 1.4; pl.scale.setScalar(PSCALE * (1 - e * 0.62)); }, Ease.inOut).then(() => { sfx.land(); this.squash(pl, 0.15, 0.25); });
    this.planter = null;
  }

  // stuck child: the tool for the next step (or the cloud hiding the sun) hops
  nudgeTarget() {
    const k = this.step;
    if (!k || this.busy) return null;
    return k === 'sun' ? this.cloud : this.tools[k] || null;
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
    else fx.ghostPath([this.target(), this.soilTop().add(new T.Vector3(0, 0.6, 0))], { mode: 'drag' });
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
    for (const pl of this.planted) pl.rotation.z = Math.sin(t * 1.4 + pl.position.x) * 0.04;
    // blooms nod gently and blink now and then
    const all = this.planter ? [...this.planted, this.planter] : this.planted;
    for (const p of all) {
      const pt = p.children.find((c) => c.userData && c.userData.bloom);
      const b = pt && pt.userData.bloom;
      if (!b || !b.visible) continue;
      b.rotation.z = Math.sin(t * 1.8 + p.position.x) * 0.08;
      const blink = ((t + p.position.x * 0.37) % 3.2) < 0.12;
      const ey = b.userData.eyeY ?? 1.3;
      for (const e of b.userData.eyes) if (e.visible) e.scale.y = blink ? 0.15 * ey : ey;
    }
  }

  onFinale() {
    this.planted.forEach((pl, i) => this.s.wait(i * 0.15).then(() => { hop(this.s, pl, 0.5, 0.35); sfx.note(i); }));
    this.visit();
  }
}
