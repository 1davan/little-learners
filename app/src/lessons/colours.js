// Lesson 1 — Colour tubes. Topic mt_xppl18avyY "Sorting into categories".
// Drag each thing into the container of the same colour. Each level has its own world of things:
//   Level 1: bouncy toys into tall glass tubes, Level 2: fruit into wicker baskets, Level 3: craft things into toy buckets.
// Every round brings a new item and a new arrival (rolls in, falls from the sky, a friend throws it…).
// Things really fall in (rigid-body physics) and pile up; the containers have faces: they watch, open wide and GULP.
import * as T from '../three.js';
import { Lesson } from '../engine/lesson.js';
import { popIn, hop, makeAnimal } from '../engine/actors.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { physics } from '../engine/physics.js';
import { Ease } from '../engine/tween.js';
import { makeTube, makeItem } from './colours-items.js';
import { frame, calmBackdrop, trueLights, makeMat, isTree } from './view-tools.js';
import { blobShadow } from '../engine/toon.js';

const cap = (s) => s[0].toUpperCase() + s.slice(1);
const LAYOUT = { 2: [-2.8, 2.8], 3: [-4, 0, 4], 4: [-4.2, -1.4, 1.4, 4.2] };
const SPAWN = new T.Vector3(0, 0.85, 5.3);
// the throwing friend stands at the front, right of the item's spot and below every container in the picture
// (in front of the mat, its head stays under the containers' feet), so it never hides a container
const FRIEND_AT = new T.Vector3(3.1, 0.07, 5.2); // (y: standing ON the mat, not sunk into it)
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
    { color: 'blue', item: 'blueberry', twist: 'bounce' }, // (a plum is purple, not blue)
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
    this.demoDur = 3.0; // the demo's item ride takes about 2.9 s (engine: playDemo's window)
    this.plan = this.P.rounds;
    // big, true colours: a closer camera, white light (the autumn theme tints everything orange), a calm cream mat
    // under the play area, and no coloured trees / flowers / leaf litter right behind or around the containers.
    // The short baskets get a lower, closer camera so they fill the frame (the tubes and buckets are taller).
    this.cam = this.P.style === 'basket' ? [0, 2.6, 10.3, 0, 1.0, 0] : [0, 3.2, 12.6, 0, 1.9, 0];
    frame(...this.cam);
    trueLights();
    // also nothing cut by the left frame edge or crowding Pip (the snowman, pumpkins and mushrooms at x < -8.5)
    calmBackdrop(this.meadow, { box: { x0: -10, x1: 10, z0: -6, z1: 9 }, hide: (o) => (isTree(o) && Math.abs(o.position.x) < 11) || (o.userData.flower && o.position.z > -8) || (Math.abs(o.position.x) > 8.5 && o.position.z > -9) });
    const mat = makeMat(13, 7.6);
    mat.position.set(0, 0, 2.1);
    this.root.add(mat);
    this.pip.position.set(this.P.style === 'basket' ? -7.35 : -7.9, 0, -3.6); // clear of the left container with 3 or 4 of them
    // where a throwing friend stands (closer camera for the baskets: a bit further in and smaller)
    this.friendAt = this.P.style === 'basket' ? new T.Vector3(2.4, 0.07, 4.6) : FRIEND_AT.clone();
    this.tubes = [];
    for (const c of this.P.start) this.addTube(c, false);
    this.placeTubes(false);
  }

  addTube(color, animate = true, x = 0) {
    const t = makeTube(color, this.P.style);
    t.position.set(x, 0, -1);
    // a soft contact shadow so the container stands on the mat
    const sh = blobShadow(t.userData.dims.rb * 1.15);
    sh.position.y = 0.075;
    t.add(sh);
    this.root.add(t);
    this.tubes.push(t);
    const u = t.userData;
    // rigid-body walls + floor so things fall in and pile up (moved with the container on layout changes)
    u.phys = cupBoxes(t.position.x, t.position.z, u.physDims.r, u.physDims.floor, u.mouthY + 0.3);
    u.tap = input.addTap(u.glass, { radius: 1.2, onTap: () => this.tickle(t) });
    if (animate) t.scale.setScalar(0.001);
    return t;
  }

  // Lock the contents to their container (no physics) while it moves, then re-simulate at the new spot.
  freeze() {
    this.moving = true; // (no drops while the containers move: zones are off)
    for (const t of this.tubes) for (const it of t.userData.items) { physics.remove(it); t.userData.body.attach(it); }
  }
  unfreeze() {
    for (const t of this.tubes) {
      const u = t.userData;
      moveCup(u.phys, t.position.x, t.position.z);
      for (const it of u.items) { if (physics.has(it)) continue; this.root.attach(it); physics.add(it, it.userData.phys); }
    }
    this.moving = false;
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
    await this.landedSoon();
    await this.waitRest(0.5);
    this.freeze();
    await Promise.all(this.tubes.map((t, i) => this.s.tween(t.position, { x: xs[i] }, 0.65, Ease.inOut)));
    this.unfreeze();
  }
  // Level 3's shuffle: every bucket steps one place to the right and the right-most one walks round the BACK to the
  // left end, so no two buckets ever pass through each other (they used to cross in one line).
  async shuffleTubes() {
    const n = this.tubes.length, xs = LAYOUT[n];
    await this.landedSoon();
    await this.waitRest(0.5);
    this.freeze();
    const last = this.tubes[n - 1];
    this.tubes = [last, ...this.tubes.slice(0, n - 1)];
    sfx.swoosh();
    const z0 = last.position.z;
    await Promise.all(this.tubes.map((t, i) => (t === last
      ? this.s.anim(1.1, (e, p) => { t.position.x = xs[n - 1] + (xs[0] - xs[n - 1]) * e; t.position.z = z0 - Math.sin(p * Math.PI) * 2.9; }, Ease.inOut).then(() => { t.position.z = z0; })
      : this.s.tween(t.position, { x: xs[i] }, 1.1, Ease.inOut))));
    this.unfreeze();
  }

  // the last swallowed item has landed in its container (so containers can move with their piles)
  async landedSoon() { await this.settled; }

  // Lay out the NEXT round while this one's payoff settles (rule 0: she can act within ~1.5 s of a round starting):
  // a new colour's container hops in, Level 3's buckets shuffle, a throwing friend walks in to its spot at the side.
  async prepNext() {
    const R = this.plan[this.round];
    if (!R || this.dead) return;
    const jobs = [];
    if (!this.tubes.find((t) => t.userData.color === R.color)) {
      jobs.push((async () => {
        // the others slide apart to make room, then the new one pops up in the free place at the right end
        const xs = LAYOUT[this.tubes.length + 1];
        const t = this.addTube(R.color, true, xs[xs.length - 1]);
        await this.placeTubes();
        await popIn(this.s, t, 1, 0.4);
      })());
    } else if (R.shuffle) jobs.push(this.shuffleTubes());
    if (R.twist === 'friend') { this.friendInP = this.friendIn(R.friend); jobs.push(this.friendInP); }
    await Promise.all(jobs);
  }

  zones() {
    return this.tubes.map((t) => ({ obj: t.userData.glass, pos: new T.Vector3(t.position.x, Math.max(1.2, t.userData.mouthY - 0.85), t.position.z), radius: 1.6, tube: t, enabled: t.userData.enabled !== false && !this.moving, onNear: (k) => { t.userData.near = t.userData.enabled !== false ? k : 0; } }));
  }

  async startRound(r) {
    const R = this.plan[r];
    const color = R.color;
    this.hover = null;
    for (const t of this.tubes) { t.userData.enabled = true; t.userData.sleepy = false; }
    // (the new container / the shuffle / the friend are laid out from the last drop on: prepNext); the prompt waits
    // until a new container is there or the shuffle is done
    const prep = this.prepP || Promise.resolve();
    this.prepP = null;
    prep.then(() => { if (!this.dead && this.round === r && this.demoDone) this.cue(); });
    if (this.dead) return;

    const item = makeItem(color, R.item);
    this.root.add(item);
    this.item = item;
    // no Go! and no grabbing until the thing has really arrived (a drag before addDrag was silently ignored)
    this.busy = true;
    await this.enter(item, R);
    if (this.dead || this.item !== item) return;
    this.busy = false;
    item.userData.ready = true;
    this.target = input.addDrag(item, {
      radius: 0.9,
      zones: () => this.zones(),
      onPick: () => { this.stopRide(); this.s.stop(item.position); this.s.tween(item.scale, { x: 1.2, y: 1.2, z: 1.2 }, 0.15, Ease.back); },
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
    await this.alive(physics.toss(item, new T.Vector3(SPAWN.x, r, SPAWN.z), { ...ph, time, arc, spin, maxT: time + 0.2 }));
    physics.remove(item);
    await this.settle(item);
  }
  async settle(item) {
    const q0 = item.quaternion.clone(), p0 = item.position.clone(), qI = new T.Quaternion();
    await this.s.anim(0.22, (e) => { item.quaternion.slerpQuaternions(q0, qI, e); item.position.lerpVectors(p0, SPAWN, e); }, Ease.inOut);
    item.position.copy(SPAWN); item.quaternion.identity();
  }

  async enter(item, R) {
    const b = item.userData.body, s = this.s, P = SPAWN;
    item.position.copy(P);
    const tw = R.twist;
    if (tw === 'sky') {
      await this.physArrive(item, new T.Vector3(-0.6, 7, P.z), { time: 0.6, arc: 0 });
    } else if (tw === 'tree') {
      // drops off a branch high up with a rustle and a falling leaf, bounces on the grass
      sfx.rustle();
      await this.wait(0.15);
      await this.physArrive(item, new T.Vector3(1.4, 6.5, P.z - 1.2), { time: 0.75, arc: 0, spin: 0.6 });
    } else if (tw === 'friend') {
      await this.friendThrow(item, R.friend);
    } else if (tw === 'bounce') {
      // three bouncy hops in from the left, each landing squashes (one soft sound when it settles)
      item.position.x = -7.5;
      for (let i = 0; i < 3; i++) {
        const x0 = -7.5 + i * 2.5, x1 = x0 + 2.5;
        await s.anim(0.34, (_, p) => { item.position.x = x0 + (x1 - x0) * p; item.position.y = P.y + Math.sin(p * Math.PI) * (1.2 - i * 0.3); b.rotation.z = -p * 1.0; });
        if (i === 2) sfx.land();
        await s.anim(0.12, (_, p) => { const k = Math.sin(p * Math.PI) * 0.18; b.scale.set(1 + k, 1 - k, 1 + k); });
      }
      b.rotation.z = 0; b.scale.setScalar(1);
    } else if (tw === 'spin') {
      // whirls up out of the ground like a spring
      b.scale.setScalar(0.001);
      sfx.whoosh();
      await s.anim(0.9, (_, p) => { const k = Ease.out(p); b.scale.setScalar(Math.max(0.001, k)); b.rotation.y = (1 - k) * Math.PI * 2; });
      b.rotation.y = 0; b.scale.setScalar(1);
    } else if (tw === 'drive') {
      item.position.x = -8;
      sfx.patter();
      await s.anim(1.0, (e, p) => { item.position.x = -8 * (1 - e); b.position.y = Math.abs(Math.sin(p * Math.PI * 5)) * 0.08; }, Ease.out);
      b.position.y = 0;
      await s.anim(0.3, (_, p) => { b.rotation.z = Math.sin(p * Math.PI) * 0.15; });
    } else {
      // roll: rolls in from the right with little bounces
      item.position.x = 7;
      sfx.swoosh();
      await s.anim(0.8, (e, p) => { item.position.x = 7 * (1 - e); b.rotation.z = e * Math.PI * 3; item.position.y = P.y + Math.abs(Math.sin(p * Math.PI * 3)) * 0.5 * (1 - p); }, Ease.out);
      b.rotation.z = 0;
    }
    item.position.copy(P);
    item.quaternion.identity();
  }

  // A friend walks in at the end of the round before (prepNext) and waits at the front-right corner, clear of every
  // container; at the round start it winds up and throws the item onto the grass (real physics bounce).
  async friendIn(kind) {
    const f = makeAnimal(kind || 'bunny');
    const k = this.P.style === 'basket' ? 0.5 : 0.55;
    const at = this.friendAt;
    f.scale.setScalar(k); f.userData.baseScale = k;
    f.position.set(at.x + 2.0, at.y, at.z); // just outside the frame at this depth
    f.rotation.y = -Math.PI / 2;
    this.root.add(f);
    this.friend = f;
    // walks in (the creature's own gait) at walking pace, then turns to face the child
    await this.walkTo(f, at, { speed: 3.0, faceCamera: false });
    this.s.tween(f.rotation, { y: -0.45 }, 0.3, Ease.inOut); // (turns to the child as it winds up)
  }
  async friendThrow(item, kind) {
    if (this.friendInP) await this.friendInP; // (it walked in during the last swallow)
    else if (!this.friend) await this.friendIn(kind);
    this.friendInP = null;
    const f = this.friend;
    const sn = FRIEND_SND[kind]; sn && sfx[sn] && sfx[sn]();
    // wind-up lean, then throw (arms forward no further than 1.2 rad: no armpit creases)
    const a = f.userData.arms;
    await this.s.anim(0.15, (_, p) => { f.rotation.z = -0.2 * p; if (a) a.forEach((x) => (x.rotation.x = -1.2 * p)); }, Ease.inOut);
    this.s.anim(0.3, (_, p) => { f.rotation.z = -0.2 + 0.3 * p; if (a) a.forEach((x) => (x.rotation.x = -1.2 + 1.2 * p)); }).then(() => this.s.tween(f.rotation, { z: 0 }, 0.3));
    await this.physArrive(item, new T.Vector3(this.friendAt.x - 0.6, 1.1, this.friendAt.z), { time: 0.45, arc: 1.1 });
    // it stays to watch from its corner, hops once when the item lands in its container, and leaves after the round
  }

  // stuck child: the thing to sort hops (the base class adds a halo at 12 s)
  nudgeTarget() { const it = this.item; return it && it.userData.ready && !it.userData.inTube ? it : null; }

  promptText() {
    const c = this.plan[this.round]?.color;
    return c ? `${cap(c)}! Put it in the ${c} one!` : '';
  }

  onHover(z) {
    this.hover = z ? z.tube : null;
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
      if (!this.busy && item.userData.ready && !dragging && !this.riding) b.position.y = Math.sin(t * 3) * 0.05; // a little idle bob
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
      // mouth: opens wider the closer the carried item comes (E2 onNear), wide when it is over this one,
      // or forced during a gulp / wrong answer
      const near = dragging ? (this.hover === tube ? 1 : (u.near || 0) * 0.8) : 0;
      const want = u.forceOpen ?? near;
      u.open += (want - u.open) * Math.min(1, dt * 14);
      const o = Math.max(0.001, u.open);
      u.mouth.scale.set(0.7 + o * 0.5, o, 0.25);
      u.mouth.visible = o > 0.03; // (a closed mouth drew a hairline across the smile)
      u.smile.visible = o < 0.25;
      // and leans a little toward it
      const lean = dragging && u.near ? T.MathUtils.clamp((tmp.x - tube.position.x) * 0.03, -0.08, 0.08) * u.near : 0;
      if (!u.tickling && !u.shaking) u.body.rotation.z += (-lean - u.body.rotation.z) * Math.min(1, dt * 8);
    }
  }

  goHome(item) {
    this.s.tween(item.position, { x: SPAWN.x, y: SPAWN.y, z: SPAWN.z }, 0.5, Ease.inOut);
    this.s.tween(item.scale, { x: 1, y: 1, z: 1 }, 0.3);
  }

  async drop(zone, { tapped }) {
    if (zone && this.moving) zone = null; // (the containers are moving: it floats home and she drops again)
    const item = this.item;
    this.hover = null;
    this.stopRide(); // a drop always ends the demo ride (it must never move the item afterwards)
    for (const t of this.tubes) t.userData.near = 0;
    if (!item || !item.userData.ready || item.userData.inTube || this.busy || item.userData.bouncing) return;
    if (!zone) {
      this.s.stop(item.scale);
      this.goHome(item);
      if (tapped) {
        // a happy little jump (no sound: tapping it is not the task)
        const b = item.userData.body;
        this.s.anim(0.45, (_, p) => { b.position.y = Math.sin(p * Math.PI) * 0.5; }).then(() => { b.position.y = 0; });
      }
      return;
    }
    const tube = zone.tube;
    const color = item.userData.color;
    if (tube.userData.color !== color) {
      // the container clamps its mouth shut and shakes "no no" with one soft "nope"; the item bounces back home
      const u = tube.userData;
      u.forceOpen = 0;
      u.shaking = true;
      sfx.nope();
      const ry = u.body.rotation.y;
      this.s.anim(0.7, (_, p) => { u.body.rotation.y = ry + Math.sin(p * Math.PI * 4) * 0.35 * (1 - p); }).then(() => { u.body.rotation.y = ry; u.forceOpen = null; u.shaking = false; });
      this.redirect(`That's ${tube.userData.color}. Find ${color}!`);
      this.bounceBack(item);
      return;
    }
    // correct: the item drops in; the round waits for the gulp (payoff) and then a moment of stillness
    input.remove(this.target);
    tube.userData.count++;
    item.userData.inTube = true;
    item.scale.setScalar(1);
    // the round moves on once the item is lifted over the mouth (rule 0: the next item arrives while it is
    // swallowed); the next round's layout (new container, shuffle, friend) starts right now
    this.oldFriend = this.friend; this.friend = null; // (it hops once below, then leaves after the round)
    let lifted; const liftP = new Promise((res) => { lifted = res; });
    this.settled = this.gulp(tube, item, lifted);
    this.success(new T.Vector3(tube.position.x, tube.userData.mouthY + 0.3, tube.position.z), `${cap(color)}!`, { payoff: liftP, still: 0 });
    this.prepP = this.prepNext();
  }

  async bounceBack(item) {
    item.userData.bouncing = true;
    if (this.target) this.target.enabled = false;
    item.scale.setScalar(1);
    const ph = item.userData.phys;
    const r = ph.shape === 'box' ? ph.size.y / 2 : ph.r;
    item.position.z = SPAWN.z - 0.5;
    await this.alive(physics.toss(item, new T.Vector3(SPAWN.x, r, SPAWN.z), { ...ph, time: 0.65, arc: 1.5, maxT: 1.0 }));
    physics.remove(item);
    await this.settle(item);
    item.userData.bouncing = false;
    if (this.target) this.target.enabled = true;
  }

  // mouth opens wide -> the item is lifted over the opening -> a held breath (beat) -> it falls in with physics and
  // lands on the pile with the level's note -> one swallow: a bulge travels down the wall
  async gulp(tube, item, lifted = () => {}) {
    const u = tube.userData, s = this.s;
    u.forceOpen = 1.2;
    item.userData.body.position.set(0, 0, 0);
    // lift first, then slide over the mouth, so a thing dropped in front of the container never cuts through its wall
    {
      const p0 = item.position.clone(), p1 = new T.Vector3(tube.position.x + (Math.random() - 0.5) * 0.3, Math.max(u.mouthY + 0.8, item.position.y), tube.position.z);
      await s.anim(0.5, (_, p) => {
        const up = 1 - (1 - Math.min(1, p * 1.6)) ** 2, over = Math.max(0, (p - 0.3) / 0.7) ** 1.5;
        item.position.set(p0.x + (p1.x - p0.x) * over, p0.y + (p1.y - p0.y) * up, p0.z + (p1.z - p0.z) * over);
      });
    }
    lifted();
    await this.beat(u.body, 0.35, { squash: 0.06 });
    if (this.dead) return;
    u.items.push(item);
    const landed = this.landed = this.alive(physics.toss(item, new T.Vector3(tube.position.x, u.physDims.floor + 0.45, tube.position.z), { ...item.userData.phys, time: 0.45, arc: 0, spin: 1.2, maxT: 0.8 }));
    await this.wait(0.3);
    sfx.step(Math.max(0, this.round - 1), this.totalRounds);
    u.forceOpen = 0;
    const swallow = this.payoff(tube);
    await landed;
    this.swallowP = swallow;
  }

  // the one reaction: a swallow (a bulge travels down the wall, a gentle squash with the face kept readable);
  // a watching friend hops once
  payoff(tube) {
    const u = tube.userData, s = this.s, b = u.body, f = u.face;
    if (this.oldFriend) hop(s, this.oldFriend, 0.4, 0.5);
    u.bulge.visible = true;
    return s.anim(0.7, (_, q) => {
      const k = Math.sin(q * Math.PI) * (1 - q * 0.4);
      b.scale.set(1 + k * 0.07, 1 - k * 0.08, 1 + k * 0.07);
      f.scale.set(1 / (1 + k * 0.07), 1 / (1 - k * 0.08), 1); // the face does not squash
      u.bulge.position.y = u.mouthY - 0.15 - q * (u.mouthY - 0.6);
      { const r = u.wallR(u.bulge.position.y); u.bulge.scale.set(r, r, 1); }
    }).then(() => { b.scale.set(1, 1, 1); f.scale.set(1, 1, 1); u.bulge.visible = false; if (u.forceOpen === 0) u.forceOpen = null; });
  }

  async afterSuccess() {
    // the watching friend (if this round had one) walks off the side at walking pace
    const f = this.oldFriend;
    this.oldFriend = null;
    if (f) this.walkTo(f, new T.Vector3(this.friendAt.x + 4.8, f.position.y, f.position.z), { speed: 2.6, faceCamera: false }).then(() => { f.parent && f.parent.remove(f); });
  }

  // The demo: a ghost hand drags from the item to its container AND the real item rides along under it: it lifts,
  // floats over the right mouth (which opens), hovers, then floats back home (it never drops in).
  showHint(glow = true) {
    const item = this.item;
    if (!item || !item.userData.ready || item.userData.inTube) return;
    const tube = this.tubes.find((t) => t.userData.color === item.userData.color);
    if (!tube) return;
    if (glow) this.addHalo(tube.userData.glass, 1.6);
    const over = new T.Vector3(tube.position.x, tube.userData.mouthY + 0.75, tube.position.z + 0.3);
    // the hand's fingertip ends just under the carried item, so it reads as the hand holding it
    const r = item.userData.phys.shape === 'box' ? item.userData.phys.size.y / 2 : item.userData.phys.r;
    fx.ghostPath([item.position.clone().add(new T.Vector3(0, -r * 0.6, 0)), over.clone().add(new T.Vector3(0, -r * 0.9, 0))], { mode: 'drag', maxDur: 3.0 });
    this.ride(item, tube, over);
  }
  async ride(item, tube, over) {
    const tok = (this.riding = {});
    const u = tube.userData, s = this.s, home = SPAWN.clone();
    const go = (dur, fn, ease = Ease.inOut) => s.anim(dur, (e, p) => { if (this.riding === tok) fn(e, p); }, ease);
    // a touch anywhere ends the demo: the item floats home unless she picked it up
    const off = input.onAny(() => { off(); if (this.riding !== tok) return; this.riding = null; u.forceOpen = null; s.wait(0.06).then(() => { if (!input.dragging() && !item.userData.inTube && !item.userData.bouncing) this.goHome(item); }); });
    this.offs.push(off);
    const lift = home.clone(); lift.y += 0.35;
    // in step with the hand: it moves in and presses (0.55 s), lifts, carries (1 s), holds, lets go
    await go(0.55, () => {});
    await go(0.25, (e) => item.position.lerpVectors(home, lift, e));
    await go(1.0, (e) => { item.position.lerpVectors(lift, over, e); if (e > 0.6) u.forceOpen = 1; });
    await go(0.4, () => {});
    if (this.riding === tok) u.forceOpen = null;
    await go(0.6, (e) => item.position.lerpVectors(over, home, e));
    off();
    if (this.riding === tok) { this.riding = null; item.position.copy(home); }
  }
  stopRide() { if (this.riding) { this.riding = null; for (const t of this.tubes) if (t.userData.forceOpen === 1) t.userData.forceOpen = null; } }

  makeErrorless() {
    // the other containers close their eyes and stop accepting (no scaling, so their piles stay put)
    const color = this.item?.userData.color;
    for (const t of this.tubes) if (t.userData.color !== color) { t.userData.enabled = false; t.userData.sleepy = true; }
  }

  // ---- the ending: the containers she filled, pokeable (each giggles and its pile jumps) ----
  creationView() {
    const st = this.P.style;
    // from a little higher, so the piles inside show over the rims
    // (fitted to the 4:3 photo: every container side to side, the row in the middle of the picture)
    if (st === 'basket') return { pos: [0, 4.2, 11.4], look: [0, 0.7, -1] };
    if (st === 'bucket') return { pos: [0, 4.8, 11.8], look: [0, 1.2, -1] };
    return { pos: [-0.6, 6.0, 11.6], look: [-0.6, 2.2, -1] };
  }
  creationObjects() { return this.tubes.map((t) => t.userData.body); }
  onAdmirePoke(obj) {
    const t = this.tubes.find((x) => x.userData.body === obj);
    if (t) this.tickle(t);
  }
  onFinale() {
    // the fullest container giggles, and its colour is named once more
    const fullest = this.tubes.reduce((a, b) => (b.userData.count > a.userData.count ? b : a));
    this.s.wait(0.9).then(() => {
      if (this.dead) return;
      this.tickle(fullest);
      this.say(`Look! So much ${fullest.userData.color}!`, { voice: true });
    });
  }
}
