// Lesson 1 — Colour tubes. Topic mt_xppl18avyY "Sorting into categories".
// Drag each thing into the container of the same colour. Each level has its own world of things:
//   Level 1: bouncy toys into tall glass tubes, Level 2: fruit into wicker baskets, Level 3: craft things into toy buckets.
// Every round brings a new item and a new arrival (rolls in, falls from the sky, a friend throws it…).
// Things really fall in (rigid-body physics) and pile up; the containers have faces: they watch, open wide and GULP.
import * as T from '../three.js';
import { Lesson } from '../engine/lesson.js';
import { popIn, wiggle, hop, makeAnimal } from '../engine/actors.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { physics } from '../engine/physics.js';
import { Ease } from '../engine/tween.js';
import { makeTube, makeItem } from './colours-items.js';
import { frame, calmBackdrop, trueLights, makeMat, isTree } from './view-tools.js';

const cap = (s) => s[0].toUpperCase() + s.slice(1);
const LAYOUT = { 2: [-2.8, 2.8], 3: [-4, 0, 4], 4: [-4.2, -1.4, 1.4, 4.2] };
const SPAWN = new T.Vector3(0, 0.85, 5.3);
const FRIEND_AT = new T.Vector3(3.6, 0, 3.6);
const HEX = { red: '#ff5a5a', blue: '#4a90ff', yellow: '#ffc800', green: '#3fb84a' };
const FRIEND_SND = { bunny: 'boing2', frog: 'ribbit', hedgehog: 'squeak', elephant: 'trumpet', cat: 'meow', pig: 'oink', bear: 'mmm', sheep: 'baa' };
const tmp = new T.Vector3(), tmp2 = new T.Vector3();

// Per level: container style, the containers there at the start, and 6 rounds of [colour, item, arrival twist, friend?].
// A new colour's container hops in the first time it is needed. Level 3 shuffles the buckets before round 5.
export const PLANS = [
  { style: 'tube', start: ['red', 'blue'], rounds: [
    { color: 'red', item: 'ball', twist: 'roll' },
    { color: 'blue', item: 'beachball', twist: 'sky' },
    { color: 'red', item: 'smiley', twist: 'friend', friend: 'bunny' },
    { color: 'yellow', item: 'pompom', twist: 'bounce' },
    { color: 'blue', item: 'dotty', twist: 'friend', friend: 'frog' },
    { color: 'yellow', item: 'star', twist: 'spin' },
  ] },
  { style: 'basket', start: ['red', 'blue', 'yellow'], rounds: [
    { color: 'red', item: 'apple', twist: 'tree' },
    { color: 'blue', item: 'blueberry', twist: 'roll' },
    { color: 'yellow', item: 'banana', twist: 'friend', friend: 'hedgehog' },
    { color: 'green', item: 'pear', twist: 'tree' },
    { color: 'blue', item: 'plum', twist: 'bounce' },
    { color: 'green', item: 'grapes', twist: 'friend', friend: 'elephant' },
  ] },
  { style: 'bucket', start: ['red', 'blue', 'yellow', 'green'], rounds: [
    { color: 'green', item: 'block', twist: 'sky' },
    { color: 'red', item: 'crayon', twist: 'roll' },
    { color: 'yellow', item: 'paintpot', twist: 'friend', friend: 'cat' },
    { color: 'blue', item: 'car', twist: 'drive' },
    { color: 'green', item: 'brush', twist: 'spin', shuffle: true },
    { color: 'red', item: 'button', twist: 'friend', friend: 'pig' },
  ] },
];
const PAYOFFS = ['gulp', 'popcorn', 'spin', 'wink'];

// A physics cup from static boxes: a floor at floorY and a ring of walls tangent to the rim up to h.
// (physics.container's walls leave gaps that let a ball wedge into the wall.) Returns the parts so moveCup can slide it.
function cupBoxes(x, z, r, floorY, h, n = 14, wall = 0.25) {
  const out = [];
  const add = (dx, y, dz, size, rot) => out.push({ b: physics.box(new T.Vector3(x + dx, y, z + dz), size, rot), dx, y, dz, rot });
  add(0, floorY - 0.1, 0, new T.Vector3(r * 2, 0.2, r * 2), 0);
  add(0, floorY - 0.1, 0, new T.Vector3(r * 2, 0.2, r * 2), Math.PI / 4);
  const seg = (2 * Math.PI * (r + wall / 2)) / n;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    add(Math.sin(a) * (r + wall / 2), h / 2, Math.cos(a) * (r + wall / 2), new T.Vector3(seg * 1.15, h, wall), a);
  }
  return out;
}
function moveCup(parts, x, z) { for (const c of parts || []) physics.moveStatic(c.b, new T.Vector3(x + c.dx, c.y, z + c.dz), c.rot); }

export default class ColoursLesson extends Lesson {
  get totalRounds() { return 6; }

  build() {
    this.P = PLANS[this.level] || PLANS[0];
    this.plan = this.P.rounds;
    this.payI = Math.floor(Math.random() * PAYOFFS.length);
    // big, true colours: a closer camera, white light (the autumn theme tints everything orange), a calm cream mat
    // under the play area, and no coloured trees / flowers / leaf litter right behind or around the containers
    frame(0, 3.2, 12.6, 0, 1.9, 0);
    trueLights();
    calmBackdrop(this.meadow, { box: { x0: -10, x1: 10, z0: -6, z1: 9 }, hide: (o) => (isTree(o) && Math.abs(o.position.x) < 11) || (o.userData.flower && o.position.z > -8) });
    const mat = makeMat(13, 7.6);
    mat.position.set(0, 0, 2.1);
    this.root.add(mat);
    this.pip.position.set(-7.1, 0, -3.6);
    this.tubes = [];
    for (const c of this.P.start) this.addTube(c, false);
    this.placeTubes(false);
  }

  addTube(color, animate = true) {
    const t = makeTube(color, this.P.style);
    t.position.set(0, 0, -1);
    this.root.add(t);
    this.tubes.push(t);
    const u = t.userData;
    // rigid-body walls + floor so things fall in and pile up (moved with the container on layout changes)
    u.phys = cupBoxes(t.position.x, t.position.z, u.physDims.r, u.physDims.floor, u.mouthY + 0.3);
    u.tap = input.addTap(u.glass, { radius: 1.2, onTap: () => this.tickle(t) });
    if (animate) popIn(this.s, t);
    return t;
  }

  // Lock the contents to their container (no physics) while it moves, then re-simulate at the new spot.
  freeze() {
    for (const t of this.tubes) for (const it of t.userData.items) { physics.remove(it); t.userData.body.attach(it); }
  }
  unfreeze() {
    for (const t of this.tubes) {
      const u = t.userData;
      moveCup(u.phys, t.position.x, t.position.z);
      for (const it of u.items) { this.root.attach(it); physics.add(it, it.userData.phys); }
    }
  }
  // wait (briefly) until everything in the containers has stopped bouncing
  async waitRest(maxT) {
    const t0 = performance.now();
    const moving = () => this.tubes.some((t) => t.userData.items.some((it) => {
      const b = physics.body(it); if (!b || b.isSleeping()) return false;
      const v = b.linvel(); return Math.hypot(v.x, v.y, v.z) > 0.4;
    }));
    while (!this.dead && moving() && performance.now() - t0 < maxT * 1000) await this.wait(0.05);
  }
  async placeTubes(animate = true) {
    const xs = LAYOUT[this.tubes.length];
    if (!animate) { this.tubes.forEach((t, i) => (t.position.x = xs[i])); this.unfreeze(); return; }
    await this.settled;
    await this.waitRest(0.7);
    this.freeze();
    await Promise.all(this.tubes.map((t, i) => this.s.tween(t.position, { x: xs[i] }, 0.45, Ease.inOut)));
    this.unfreeze();
  }

  zones() {
    return this.tubes.map((t) => ({ obj: t.userData.glass, pos: new T.Vector3(t.position.x, Math.max(1.2, t.userData.mouthY - 0.85), t.position.z), radius: 1.6, tube: t, enabled: t.userData.enabled !== false }));
  }

  async startRound(r) {
    const R = this.plan[r];
    const color = R.color;
    this.hover = null;
    for (const t of this.tubes) { t.userData.enabled = true; t.userData.sleepy = false; }
    if (this.demoDone) this.cue();
    // a new colour's container hops in when first needed
    if (!this.tubes.find((t) => t.userData.color === color)) {
      this.busy = true;
      const t = this.addTube(color);
      sfx.sparkle();
      fx.float(new T.Vector3(0, 4.2, -1), '★', { color: HEX[color], size: 9 });
      await this.placeTubes();
      hop(this.s, t, 0.5, 0.35, { sound: true });
      this.busy = false;
    }
    // Level 3: the buckets swap places (a little dance) before this round
    if (R.shuffle) {
      this.busy = true;
      this.tubes.reverse(); sfx.swoosh();
      this.tubes.forEach((t, i) => this.s.wait(0.1 + i * 0.05).then(() => hop(this.s, t, 0.5, 0.4)));
      await this.placeTubes();
      this.busy = false;
    }
    if (this.dead) return;

    const item = makeItem(color, R.item);
    this.root.add(item);
    this.item = item;
    await this.enter(item, R);
    if (this.dead || this.item !== item) return;
    item.userData.ready = true;
    this.target = input.addDrag(item, {
      radius: 0.9,
      zones: () => this.zones(),
      onPick: () => { sfx.bloop(2); this.s.tween(item.scale, { x: 1.2, y: 1.2, z: 1.2 }, 0.15, Ease.back); },
      onMove: (_t, z) => this.onHover(z),
      onDrop: (z, info) => this.drop(z, info),
    });
    if (!this.demoDone) this.cue();
  }

  // ---- arrivals: same task, new surprise every round ----
  // physics fall from `from` onto the grass at the spawn spot, then a quick tidy-up into the display pose
  async physArrive(item, from, { time = 0.55, arc = 1, spin = 1 } = {}) {
    item.position.copy(from);
    const ph = item.userData.phys;
    const r = ph.shape === 'box' ? ph.size.y / 2 : ph.r;
    await this.alive(physics.toss(item, new T.Vector3(SPAWN.x, r, SPAWN.z), { ...ph, time, arc, spin, maxT: 0.8 }));
    physics.remove(item);
    await this.settle(item);
  }
  async settle(item) {
    const q0 = item.quaternion.clone(), p0 = item.position.clone(), qI = new T.Quaternion();
    await this.s.anim(0.18, (e) => { item.quaternion.slerpQuaternions(q0, qI, e); item.position.lerpVectors(p0, SPAWN, e); }, Ease.out);
    item.position.copy(SPAWN); item.quaternion.identity();
  }

  async enter(item, R) {
    const b = item.userData.body, s = this.s, P = SPAWN;
    item.position.copy(P);
    const tw = R.twist;
    if (tw === 'sky') {
      sfx.twinkle();
      fx.float(new T.Vector3(0, 6, P.z), '✦', { color: HEX[R.color], size: 6 });
      await this.physArrive(item, new T.Vector3(-0.6, 8, P.z), { time: 0.5, arc: 0 });
    } else if (tw === 'tree') {
      // drops off a branch high up with a rustle and a falling leaf, bounces on the grass
      sfx.rustle();
      fx.float(new T.Vector3(1.6, 6.2, P.z - 1), '🍃', { size: 6 });
      await this.wait(0.12);
      await this.physArrive(item, new T.Vector3(1.4, 6.5, P.z - 1.2), { time: 0.5, arc: 0, spin: 0.6 });
    } else if (tw === 'friend') {
      await this.friendThrow(item, R.friend);
    } else if (tw === 'bounce') {
      // three bouncy hops in from the left, each landing squashes
      item.position.x = -9;
      for (let i = 0; i < 3; i++) {
        const x0 = -9 + i * 3, x1 = x0 + 3;
        await s.anim(0.2, (_, p) => { item.position.x = x0 + (x1 - x0) * p; item.position.y = P.y + Math.sin(p * Math.PI) * (1.6 - i * 0.4); b.rotation.z = -p * 1.2; });
        sfx.land();
        s.anim(0.12, (_, p) => { const k = Math.sin(p * Math.PI) * 0.22; b.scale.set(1 + k, 1 - k, 1 + k); });
      }
      b.rotation.z = 0; b.scale.setScalar(1);
    } else if (tw === 'spin') {
      // whirls up out of the ground like a spring
      b.scale.setScalar(0.001);
      sfx.whoosh();
      await s.anim(0.5, (_, p) => { const k = Ease.elastic(p); b.scale.setScalar(Math.max(0.001, k)); b.rotation.y = (1 - p) * Math.PI * 4; });
      b.rotation.y = 0; b.scale.setScalar(1);
      sfx.sparkle();
    } else if (tw === 'drive') {
      item.position.x = -9;
      sfx.patter();
      await s.anim(0.55, (e, p) => { item.position.x = -9 * (1 - e); b.position.y = Math.abs(Math.sin(p * Math.PI * 5)) * 0.08; }, Ease.out);
      b.position.y = 0;
      sfx.highBoing();
      s.anim(0.3, (_, p) => { b.rotation.z = Math.sin(p * Math.PI) * 0.15; });
    } else {
      // roll: rolls in from the right with little bounces
      item.position.x = 9;
      sfx.swoosh();
      await s.anim(0.55, (e, p) => { item.position.x = 9 * (1 - e); b.rotation.z = e * Math.PI * 3; item.position.y = P.y + Math.abs(Math.sin(p * Math.PI * 3)) * 0.5 * (1 - p); }, Ease.out);
      b.rotation.z = 0;
      sfx.land();
    }
    item.position.copy(P);
    item.quaternion.identity();
  }

  // a surprise friend hops in from the side and throws the item onto the grass (it bounces with real physics)
  async friendThrow(item, kind) {
    const f = makeAnimal(kind || 'bunny');
    const k = 0.75;
    f.scale.setScalar(k); f.userData.baseScale = k;
    f.position.set(11, 0, FRIEND_AT.z);
    f.rotation.y = -0.6;
    this.root.add(f);
    this.friend = f;
    const sn = FRIEND_SND[kind]; sn && sfx[sn] && sfx[sn]();
    await this.s.anim(0.35, (_, p) => { f.position.x = 11 + (FRIEND_AT.x - 11) * p; f.position.y = Math.abs(Math.sin(p * Math.PI * 2)) * 0.5; });
    f.position.y = 0;
    sfx.land();
    // wind-up lean, then throw
    const a = f.userData.arms;
    await this.s.anim(0.14, (_, p) => { f.rotation.z = -0.25 * p; if (a) a.forEach((x) => (x.rotation.x = -1.6 * p)); });
    sfx.swoosh();
    this.s.anim(0.2, (_, p) => { f.rotation.z = -0.25 + 0.4 * p; if (a) a.forEach((x) => (x.rotation.x = -1.6 + 1.6 * p)); }).then(() => this.s.tween(f.rotation, { z: 0 }, 0.2));
    await this.physArrive(item, new T.Vector3(FRIEND_AT.x - 0.8, 1.6, FRIEND_AT.z), { time: 0.55, arc: 2.5 });
    // then waves and hops away, so it never stands in front of a container while the child chooses
    this.afterSuccess();
  }

  // stuck child: the thing to sort hops (the base class adds a halo at 12 s)
  nudgeTarget() { const it = this.item; return it && it.userData.ready && !it.userData.inTube ? it : null; }

  promptText() {
    const c = this.plan[this.round]?.color;
    return c ? `${cap(c)}! Put it with ${c}.` : '';
  }

  onHover(z) {
    const t = z ? z.tube : null;
    if (t !== this.hover && t) sfx.bloop(1);
    this.hover = t;
  }

  // tapping a container: it giggles and everything inside jumps
  tickle(t) {
    const u = t.userData;
    if (u.tickling) return;
    u.tickling = true;
    sfx.giggle();
    for (const it of u.items) physics.poke(it, u.style === 'tube' ? 0.9 : 0.55);
    const b = u.body;
    this.s.anim(0.45, (_, p) => { const k = Math.sin(p * Math.PI * 3) * 0.1 * (1 - p); b.scale.set(1 + k, 1 - k, 1 + k); }).then(() => { b.scale.set(1, 1, 1); u.tickling = false; });
  }

  update(dt, t) {
    const item = this.item;
    const dragging = input.dragging();
    if (item && !item.userData.inTube) {
      item.getWorldPosition(tmp);
      const b = item.userData.body;
      if (!this.busy && item.userData.ready && !dragging) b.position.y = Math.sin(t * 3) * 0.05; // a little idle bob
    }
    for (const tube of this.tubes) {
      const u = tube.userData;
      // pupils follow the item
      u.face.getWorldPosition(tmp2);
      const dx = item ? T.MathUtils.clamp((tmp.x - tmp2.x) * 0.03, -0.08, 0.08) : 0;
      const dy = item ? T.MathUtils.clamp((tmp.y - tmp2.y) * 0.03, -0.07, 0.07) : 0;
      for (const p of u.eyes) { p.position.x += (dx - p.position.x) * 0.2; p.position.y += (dy - p.position.y) * 0.2; }
      if (u.sleepy) for (const w of u.whites) w.scale.y += (0.25 - w.scale.y) * 0.15;
      else if (!u.squint) for (const w of u.whites) w.scale.y += (1 - w.scale.y) * 0.2;
      // mouth: open when the item hovers over this one (or forced during a gulp / wrong answer)
      const want = u.forceOpen ?? (dragging && this.hover === tube ? 1 : 0);
      u.open += (want - u.open) * Math.min(1, dt * 14);
      const o = Math.max(0.001, u.open);
      u.mouth.scale.set(0.7 + o * 0.5, o, 0.25);
      u.smile.visible = o < 0.25;
    }
  }

  goHome(item) {
    this.s.tween(item.position, { x: SPAWN.x, y: SPAWN.y, z: SPAWN.z }, 0.5, Ease.back);
    this.s.tween(item.scale, { x: 1, y: 1, z: 1 }, 0.3);
  }

  async drop(zone, { tapped }) {
    const item = this.item;
    this.hover = null;
    if (!item || !item.userData.ready || item.userData.inTube || this.busy || item.userData.bouncing) return;
    if (!zone) {
      this.goHome(item);
      if (tapped) {
        // a happy little jump with a twirl
        sfx.squeak();
        const b = item.userData.body;
        this.s.anim(0.45, (_, p) => { b.position.y = Math.sin(p * Math.PI) * 0.7; b.rotation.y = p * Math.PI * 2; }).then(() => { b.position.y = 0; b.rotation.y = 0; });
      } else sfx.swoosh();
      return;
    }
    const tube = zone.tube;
    const color = item.userData.color;
    if (tube.userData.color !== color) {
      // the container clamps its mouth shut and shakes "no no"; the item boings off the rim and bounces back home
      const u = tube.userData;
      u.forceOpen = 0;
      sfx.boing();
      const ry = u.body.rotation.y;
      this.s.anim(0.55, (_, p) => { u.body.rotation.y = ry + Math.sin(p * Math.PI * 4) * 0.35 * (1 - p); }).then(() => { u.body.rotation.y = ry; u.forceOpen = null; });
      this.redirect(`That's ${tube.userData.color}. Find ${color}!`);
      this.bounceBack(item);
      return;
    }
    // correct: praise starts now; the item drops in during the celebration
    input.remove(this.target);
    tube.userData.count++;
    item.userData.inTube = true;
    item.scale.setScalar(1);
    this.success(new T.Vector3(tube.position.x, tube.userData.mouthY + 0.3, tube.position.z), `${cap(color)}!`);
    this.settled = this.gulp(tube, item);
  }

  async bounceBack(item) {
    item.userData.bouncing = true;
    if (this.target) this.target.enabled = false;
    item.scale.setScalar(1);
    const ph = item.userData.phys;
    const r = ph.shape === 'box' ? ph.size.y / 2 : ph.r;
    item.position.z = SPAWN.z - 0.5;
    await this.alive(physics.toss(item, new T.Vector3(SPAWN.x, r, SPAWN.z), { ...ph, time: 0.45, arc: 1.5, maxT: 0.7 }));
    physics.remove(item);
    await this.settle(item);
    item.userData.bouncing = false;
    if (this.target) this.target.enabled = true;
  }

  // mouth opens wide → item is sucked over the opening → falls in with physics and lands on the pile → payoff
  async gulp(tube, item) {
    const u = tube.userData, s = this.s, b = u.body;
    u.forceOpen = 1.2;
    sfx.gasp();
    s.anim(0.18, (_, q) => { b.scale.set(1 - q * 0.06, 1 + q * 0.12, 1 - q * 0.06); });
    item.userData.body.position.set(0, 0, 0);
    await s.tween(item.position, { x: tube.position.x + (Math.random() - 0.5) * 0.3, y: u.mouthY + 0.8, z: tube.position.z }, 0.18, Ease.out);
    b.scale.set(1, 1, 1);
    u.items.push(item);
    sfx.swoosh();
    const landed = this.alive(physics.toss(item, new T.Vector3(tube.position.x, u.physDims.floor + 0.45, tube.position.z), { ...item.userData.phys, time: 0.28, arc: 0, spin: 1.2, maxT: 0.8 }));
    await this.wait(0.2);
    sfx.pop();
    u.forceOpen = 0;
    this.payoff(tube, item);
    await landed;
  }

  // a short, varied reaction (≤0.9 s), rotating so it never repeats twice in a row
  payoff(tube, fresh) {
    const u = tube.userData, s = this.s, b = u.body;
    const kind = PAYOFFS[this.payI++ % PAYOFFS.length];
    const top = new T.Vector3(tube.position.x + 0.9, u.mouthY + 0.5, tube.position.z);
    if (this.friend) hop(s, this.friend, 0.6, 0.4, { sound: true });
    if (kind === 'gulp') {
      sfx.lowBoing();
      u.bulge.visible = true;
      s.anim(0.4, (_, q) => {
        const k = Math.sin(q * Math.PI) * (1 - q * 0.4);
        b.scale.set(1 + k * 0.14, 1 - k * 0.16, 1 + k * 0.14);
        u.bulge.position.y = u.mouthY - 0.15 - q * (u.mouthY - 0.6);
        { const r = u.wallR(u.bulge.position.y); u.bulge.scale.set(r, r, 1); }
      }).then(() => { b.scale.set(1, 1, 1); u.bulge.visible = false; });
      this.squint(u, 0.5);
      s.wait(0.15).then(() => sfx.mmm());
      fx.float(top, '♥', { color: HEX[u.color], size: 7 });
    } else if (kind === 'popcorn') {
      // a hiccup: the container jumps and everything inside pops up
      sfx.boing2();
      s.wait(0.25).then(() => { for (const it of u.items) if (it !== fresh) physics.poke(it, u.style === 'tube' ? 0.8 : 0.5); sfx.pop(); });
      s.anim(0.5, (_, q) => { const k = Math.sin(q * Math.PI * 2) * 0.14 * (1 - q); b.scale.set(1 - k, 1 + k, 1 - k); }).then(() => b.scale.set(1, 1, 1));
      fx.float(top, '♪', { color: HEX[u.color], size: 7 });
    } else if (kind === 'spin') {
      // a happy twirl (the face goes round the back and comes again)
      sfx.whoosh();
      const r0 = b.rotation.y;
      s.anim(0.6, (e) => { b.rotation.y = r0 + e * Math.PI * 2; }, Ease.inOut).then(() => { b.rotation.y = r0; sfx.twinkle(); });
      fx.float(top, '★', { color: HEX[u.color], size: 8 });
    } else {
      // a wink and a lick of the lips
      sfx.twinkle();
      const w = u.whites[1];
      u.squint = true;
      s.anim(0.6, (_, q) => { w.scale.y = 1 - Math.sin(q * Math.PI) * 0.9; u.forceOpen = Math.sin(q * Math.PI) * 0.4; }).then(() => { w.scale.y = 1; u.squint = false; u.forceOpen = null; });
      s.wait(0.2).then(() => sfx.chomp());
      for (const c of u.cheeks) s.anim(0.6, (_, q) => { const k = Math.sin(q * Math.PI); c.scale.set(1 + k * 0.8, 0.6 + k * 0.5, 0.3); });
      fx.float(top, '😋', { size: 6 });
    }
    if (kind !== 'wink') s.wait(0.5).then(() => { if (u.forceOpen === 0) u.forceOpen = null; });
  }

  squint(u, dur) {
    const s = this.s;
    u.squint = true;
    s.anim(dur, (_, q) => {
      const k = Math.sin(q * Math.PI);
      for (const w of u.whites) w.scale.y = 1 - k * 0.7;
      for (const c of u.cheeks) c.scale.set(1 + k * 0.8, 0.6 + k * 0.5, 0.3);
    }).then(() => { for (const w of u.whites) w.scale.y = 1; u.squint = false; u.forceOpen = null; });
  }

  async afterSuccess() {
    // the friend waves bye and hops off the side
    const f = this.friend;
    if (!f) return;
    this.friend = null;
    const x0 = f.position.x;
    this.s.anim(0.4, (_, p) => { f.position.x = x0 + (12 - x0) * p; f.position.y = Math.abs(Math.sin(p * Math.PI * 2)) * 0.5; }).then(() => { f.parent && f.parent.remove(f); });
  }

  showHint(glow = true) {
    const item = this.item;
    if (!item) return;
    const tube = this.tubes.find((t) => t.userData.color === item.userData.color);
    if (glow) this.addHalo(tube.userData.glass, 1.6);
    fx.ghostHand(item.position.clone(), new T.Vector3(tube.position.x, tube.userData.mouthY - 0.4, tube.position.z));
  }

  makeErrorless() {
    // the other containers close their eyes and stop accepting (no scaling, so their piles stay put)
    const color = this.item?.userData.color;
    for (const t of this.tubes) if (t.userData.color !== color) { t.userData.enabled = false; t.userData.sleepy = true; }
  }

  onFinale() {
    // every container giggles and its pile jumps, then the fullest one burps a star
    this.tubes.forEach((t, i) => this.s.wait(0.3 + i * 0.18).then(() => this.tickle(t)));
    const fullest = this.tubes.reduce((a, b) => (b.userData.count > a.userData.count ? b : a));
    this.s.wait(1.4).then(() => {
      wiggle(this.s, fullest, 0.2, 1);
      sfx.boing2();
      fx.float(new T.Vector3(fullest.position.x, fullest.userData.mouthY + 1, fullest.position.z), '★', { color: HEX[fullest.userData.color], size: 12 });
      this.say(`Look! So much ${fullest.userData.color}!`);
    });
  }
}
