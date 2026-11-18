// Game 13 — Share the snacks. Topics mt_FwI7q7DSIx "Taking turns and sharing", mt_LpSuPgL31x "Division as equal sharing".
// Drag snacks from the bin to the friends' plates, one at a time, so everyone gets the same.
// Each round brings new friends and a new snack (carrots for bunnies, apples for pigs, corn for hens, fish for kittens,
// and a cookie party for everyone). Dotted spots on each plate show how many each friend gets; plates glow gold when equal.
// Each level is a different place: a picnic blanket with china plates (L1), inside the barn with wooden bowls (L2),
// a garden party with leaf plates and bunting (L3). Snacks arc onto their dotted spot on the plate.
// When everyone has the same the plates light up gold one by one ("The same! One each!"), then the friends eat in
// turn, left to right, two bites each. The first friend of the round then walks to the hay bench at the back, hops up
// and stays there (the keepsake tray: one fed friend per round, what the finale shows); the others walk off to the right.
import * as T from '../three.js';
import { Lesson } from '../engine/lesson.js';
import { disposeTree } from '../engine/toon.js';
import { makeAnimal, hop, setFace, wiggle } from '../engine/actors.js';
import { makeFarmAnimal } from '../engine/farm.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';
import { makeTray } from '../engine/keepsake.js';
import { propModel } from '../engine/prop-models.js';
import { stillProp } from '../engine/farm.js';
import { frame, calmBackdrop } from './view-tools.js';
import { SNACKS, makeSnack, makeBin, makePlate, lightPlate, makeSet, makeBench, slotAt, SET_STYLE } from './share-props.js';

// The snack bin sits low at the front, between two plates (in the middle for four friends; it moves with the layout), so the snack waiting on
// top never covers Pip or a plate; Pip stands back-left. The hay bench for the fed friends runs along the back.
const CRATE = new T.Vector3(0, 0, 3.3);
const SPAWN = new T.Vector3(CRATE.x, 1.0, CRATE.z + 0.2);
const XS = { 2: [-2.3, 2.3], 3: [-3.5, 0, 3.5], 4: [-3.6, -1.2, 1.2, 3.6] };
const FRIEND_Z = -0.6;
const PLATE_Z = { plate: 1.35, bowl: 1.5, leaf: 1.35 };
const FLOOR_Y = [0.04, 0.035, 0.09]; // the top of the blanket / floorboards / party rug that plates and the bin stand on
const BENCH = { z: -3.6, top: 1.69, spacing: 1.15, front: -2.55 }; // the hay-bale bench the fed friends sit on
// Lanes the fed friends walk in, so leaving friends never pass through the friends still eating or the new ones
// stepping in: the bench friend goes straight back to the bench lane; the others go back to the exit lane, then right.
const EXIT_Z = -1.8;
const SHOW = 1.0, HELD = 1.15; // snack scale waiting on the bin / while dragged (it is close to the camera)
const BOWS = [0xff5a5a, 0x4a90ff, 0xffd23f, 0xa77bff];
const HEX = ['#ff5a5a', '#4a90ff', '#e8a800', '#a77bff'];
// [friends, each, pre-filled (one friend already has one)]
const PLANS = [
  [[2, 1], [2, 1], [3, 1], [2, 1], [3, 1], [3, 1]],
  [[2, 1], [3, 1], [2, 2], [2, 2], [3, 1], [3, 2]],
  [[2, 2], [3, 2, 1], [2, 3], [3, 2, 1], [4, 1], [2, 3]],
];
// the snack (and so the friends) for each round
const THEMES = [
  ['carrot', 'apple', 'corn', 'fish', 'cookie', 'apple'],
  ['apple', 'carrot', 'fish', 'corn', 'cookie', 'carrot'],
  ['corn', 'fish', 'carrot', 'apple', 'cookie', 'fish'],
];
const FRIENDS = {
  carrot: { kind: 'bunny', name: 'bunny' },
  apple: { kind: 'pig', name: 'piggy' },
  corn: { kind: 'hen', name: 'hen' },
  fish: { kind: 'cat', name: 'kitty' },
  cookie: { kind: null, name: 'friend' }, // a party: one of each
};
const A_SNACK = { carrot: 'a carrot', apple: 'an apple', corn: 'some corn', fish: 'a fish', cookie: 'a cookie' };
const COUNT = ['', 'One', 'Two', 'Three'];
const SAME = ['The same! One each!', 'The same! Two each!', 'The same! Three each!'];
const PARTY = ['bunny', 'pig', 'hen', 'cat'];
const SIZE = { bunny: 0.95, pig: 0.92, hen: 0.95, cat: 0.95 };
const CALL = { bunny: 'squeak', pig: 'oink', hen: 'cluck', cat: 'meow' };
// how far the arms / wings may swing up in a reach or cheer (a hen's wings must stay clear of its beak)
const REACH_MAX = { hen: 0.7, bunny: 1.1, pig: 1.1, cat: 1.1 };
const ONE = ['One for you!', 'One for you!', 'And one for you!'];

// A calm arrival / exit in place: grows (or settles away) over about half a second with only a tiny overshoot.
function appear(s, g, scale = 1, dur = 0.45) {
  g.visible = true;
  g.scale.setScalar(0.001);
  return s.anim(dur, (_, p) => { const e = 1 - (1 - p) ** 3; const k = Math.max(0.001, scale * (e + Math.sin(p * Math.PI) * 0.05)); g.scale.setScalar(k); }).then(() => g.scale.setScalar(scale));
}
function vanish(s, g, dur = 0.3) {
  const k0 = g.scale.x;
  return s.anim(dur, (_, p) => g.scale.setScalar(Math.max(0.001, k0 * (1 - p * p)))).then(() => { g.visible = false; });
}

function makeFriend(kind, i) {
  const f = kind === 'hen' ? makeFarmAnimal('hen') : makeAnimal(kind);
  if (kind === 'bunny' && f.userData.head) {
    // a coloured bow at the base of the ear, so the bunnies are easy to tell apart
    const pm = propModel('prop_bunnybow', { tint: BOWS[i] });
    if (pm) {
      stillProp(pm);
      const mu = pm.userData.model.userData;
      for (const [name, l] of Object.entries(mu.layers || {})) {
        if (/^tint/.test(name) && mu.skin) l.mesh.material = mu.skin.material; // the knot takes the bow's colour
        if (/^shine/.test(name)) l.outline.visible = false;
      }
      // tied round the base of the right ear (it bobs with the ear)
      f.updateMatrixWorld(true);
      const ear = f.userData.bones?.earR1 || f.userData.head;
      const at = f.localToWorld(new T.Vector3(0.34, 2.14, 0.22));
      pm.position.copy(ear.worldToLocal(at));
      pm.quaternion.copy(ear.getWorldQuaternion(new T.Quaternion()).invert()).multiply(new T.Quaternion().setFromEuler(new T.Euler(-0.2, 0.35, -0.35)));
      pm.scale.setScalar(0.95 / ear.getWorldScale(new T.Vector3()).y);
      ear.add(pm);
    }
  }
  const u = f.userData;
  u.limbs = u.arms || u.wings || [];
  u.limbR0 = u.limbs.map((a) => a.rotation.z);
  u.reach = 0; u.reachTo = 0; u.lean = 0; u.leanTo = 0;
  return f;
}

export default class ShareLesson extends Lesson {
  build() {
    this.plan = PLANS[this.level];
    this.themes = THEMES[this.level];
    this.style = SET_STYLE[this.level];
    this.pip.position.set(-6.78, 0, -3.55); // back-left, clear of the bench, the friends (even four of them) and the bunting pole
    // close on the friends and plates; the bench of fed friends along the back and the bin at the front stay in view
    frame(0, 4.6, 9.8, 0, 1.2, 0.35);
    // inside the barn (L2) nothing of the farm outside shows: only the ground under the straw floor stays
    const ground = this.meadow.children[0];
    calmBackdrop(this.meadow, { hide: this.level === 1 ? (o) => o !== ground : null });
    this.bunnies = [];
    this.leaving = [];
    this.hungryT = 0;
    this.set = makeSet(this.level);
    this.root.add(this.set);
    // the keepsake tray: a long bench of hay bales along the back; each round's first friend, fed and happy, climbs
    // up and sits there for the rest of the level (high enough to be seen over the friends in the row)
    this.bench = makeBench();
    this.bench.position.z = BENCH.z;
    this.root.add(this.bench);
    this.tray = makeTray(this, this.totalRounds, [0, BENCH.top - 0.07, BENCH.z], { style: 'rug', spacing: BENCH.spacing, fit: 1.05 });
    this.tray.group.children[0].visible = false; this.tray.group.children[1].visible = false; // the bales are the seat
    this.offs.push(() => this.tray.dispose());
  }

  async setBin(kind) {
    if (this.binKind === kind) return;
    this.binKind = kind;
    const old = this.bin;
    // the old bin is fully gone before the new one appears (never two bins inside each other)
    if (old) { await vanish(this.s, old, 0.3); this.root.remove(old); disposeTree(old); }
    if (this.dead) return;
    this.bin = makeBin(kind);
    this.bin.position.copy(CRATE); this.bin.position.x = this.spawnAt ? this.spawnAt.x : CRATE.x; this.bin.position.y = FLOOR_Y[this.level]; this.bin.position.z += this.bin.userData.dz ?? 0;
    this.root.add(this.bin);
    await appear(this.s, this.bin, this.bin.userData.scale ?? 0.7, 0.45);
  }

  // a spot in the row is free once every fed friend has walked well clear of it (those still eating hold their spot)
  spotClear(x) {
    const wp = new T.Vector3();
    return this.leaving.every((w) => {
      if (!w.parent || !w.visible) return true;
      w.getWorldPosition(wp);
      // the bench friend walks straight back, away from the row; the others pass behind it in the exit lane
      return Math.hypot(wp.x - x, wp.z - FRIEND_Z) > (w.userData.goRight === false ? 1.45 : 1.5);
    });
  }

  async startRound(r) {
    this.busy = true;
    this.firstT = 0;
    this.roundT0 = performance.now();
    const [n, each, pre] = this.plan[r];
    this.each = each;
    this.snack = this.themes[r];
    this.friend = FRIENDS[this.snack];
    // the bin sits between the first two plates (in the middle for four)
    this.spawnAt = SPAWN.clone(); this.spawnAt.x = n === 4 ? 0 : (XS[n][0] + XS[n][1]) / 2;
    const party = this.friend.kind ? null : PARTY.slice(r % 2, (r % 2) + 4).concat(PARTY).slice(0, n);
    const pz = PLATE_Z[this.style] ?? 1.35;
    const ps = n === 4 ? (this.style === 'leaf' ? 0.76 : 0.82) : 1;
    this.bunnies = XS[n].map((x, i) => {
      const kind = party ? party[i] : this.friend.kind;
      const b = makeFriend(kind, i);
      const sc = SIZE[kind] || 1;
      b.position.set(x, 0, FRIEND_Z);
      b.rotation.y = -x * 0.04;
      b.userData.baseScale = sc;
      b.visible = false;
      this.root.add(b);
      const plate = makePlate(BOWS[i], each, this.snack, this.style);
      plate.position.set(x, FLOOR_Y[this.level], pz);
      plate.userData.size = ps;
      plate.visible = false;
      this.root.add(plate);
      Object.assign(b.userData, { plate, carrots: [], n: 0, kind, col: i, enabled: false });
      return b;
    });
    // each new friend steps in as soon as its spot is clear (last round's friends are still strolling off)
    this.bunnies.forEach((b, i) => {
      const u = b.userData;
      const arrive = async () => {
        await this.wait(0.1 + i * 0.15);
        for (let k = 0; k < 60 && !this.spotClear(b.position.x); k++) await this.wait(0.05);
        if (this.dead) return;
        appear(this.s, u.plate, ps, 0.4);
        const grown = appear(this.s, b, u.baseScale, 0.5);
        await this.wait(0.15);
        u.enabled = true;   // she may already give it a snack while it finishes growing in
        if (this.dropT && !this.firstT) { this.firstT = performance.now(); console.log('SHARE last drop -> first friend ready', Math.round(this.firstT - this.dropT), 'ms'); }
        await grown;
        if (pre && i === 1) {
          // this friend already has one: it pats its plate and looks over at the others
          this.placeCarrot(b, true);
          wiggle(this.s, b, 0.08, 0.6);
          if (u.head) { u.lookAt = this.bunnies[0]; this.s.wait(1.6).then(() => { u.lookAt = null; }); }
        }
      };
      u.arrived = arrive();
    });
    await this.setBin(this.snack);
    if (this.dead) return;
    if (Math.abs(this.bin.position.x - this.spawnAt.x) > 0.01) await this.s.tween(this.bin.position, { x: this.spawnAt.x }, 0.5, Ease.inOut);
    this.spawnCarrot();
    this.busy = false;
    this.readyMs = performance.now() - this.roundT0;
    console.log('SHARE round', r + 1, 'start->input ready', Math.round(this.readyMs), 'ms' + (this.dropT ? ', last drop -> snack draggable ' + Math.round(performance.now() - this.dropT) + ' ms' : ''));
    this.cue();
  }

  // The next snack lies on top of the bin's pile (just clear of it, bobbing a little), low in the picture, so it never
  // covers a plate or a friend.
  spawnCarrot() {
    const c = makeSnack(this.snack);
    const sp = SNACKS[this.snack];
    const SP = this.spawnAt;
    const show = sp.show ?? SHOW;
    // a long snack lies with its leafy end toward the middle of the row (never across the plate beside the bin)
    this.held = SP.x < -0.5 ? -sp.held : sp.held;
    c.rotation.z = this.held;
    c.scale.setScalar(show);
    c.position.set(0, 0, 0);
    c.updateMatrixWorld(true);
    const below = -new T.Box3().setFromObject(c).min.y;
    // the top of the pile (the snacks in the bin; not a pail's handle)
    this.bin.updateMatrixWorld(true);
    const bb = new T.Box3();
    for (const o of this.bin.children) if (o.userData.snack) bb.expandByObject(o);
    const top = bb.isEmpty() ? new T.Box3().setFromObject(this.bin).max.y : bb.max.y;
    SP.y = top + below + 0.06;
    SP.z = this.bin.position.z + 0.2;
    c.position.copy(SP);
    this.root.add(c);
    // rises up out of the bin (no sound: the next snack is routine)
    c.position.y = SP.y - 0.4;
    this.s.tween(c.position, { y: SP.y }, 0.5, Ease.out);
    appear(this.s, c, show, 0.45);
    this.carrot = c;
    c.userData.drag = input.addDrag(c, {
      radius: 1.0, minY: 0.5, offset: new T.Vector3(0, 0.1, 0),
      zones: () => this.bunnies.map((b) => ({ bunny: b, pos: b.userData.plate.position.clone().add(new T.Vector3(0, 0.8, -0.4)), radius: 1.5, enabled: b.userData.enabled !== false })),
      onPick: () => {
        this.s.tween(c.scale, { x: HELD, y: HELD, z: HELD }, 0.12);
        // the hungry ones go "ooh!" and reach out
        for (const b of this.bunnies) {
          const u = b.userData;
          if (u.enabled && u.n < this.each) { u.reachTo = 0.6; if (u.face) setFace(u.face, 'joy'); }
        }
      },
      onMove: (_, z) => { this.hover = z ? z.bunny : null; },
      onDrop: (z) => this.drop(z),
    });
  }

  // stuck child: the waiting snack hops
  nudgeTarget() { const c = this.carrot; if (!c || !c.userData.drag || !c.parent || this.busy) return null; this.nudgeT = performance.now(); return c; }

  min() { return Math.min(...this.bunnies.map((b) => b.userData.n)); }
  valid() { const m = this.min(); return this.bunnies.filter((b) => b.userData.n === m); }

  calmDown() {
    this.hover = null;
    for (const b of this.bunnies) { const u = b.userData; u.reachTo = 0; if (u.face) setFace(u.face, 'happy'); }
  }

  // The snack goes onto its dotted spot on the plate: a clean tweened arc that lands exactly in the spot, lying flat
  // (no physics, so it can never bounce off the rim or end up on the blanket).
  placeCarrot(b, instant = false, c = null) {
    const u = b.userData, i = u.n++;
    const sp = SNACKS[this.snack];
    c = c || makeSnack(this.snack);
    if (!c.parent) this.root.add(c);
    const slot = u.plate.userData.slots[i];
    const ps = u.plate.userData.size || 1;
    const fy = u.plate.userData.floorY * ps;
    const [rx, ry, rz] = sp.lay;
    const size = sp.size * ps;
    // where it rests: centred on its spot, its lowest point just on the plate
    const from = c.position.clone(), q0 = c.quaternion.clone(), s0 = c.scale.x;
    c.rotation.set(rx, ry, rz); c.scale.setScalar(size); c.position.set(0, 0, 0); c.updateMatrixWorld(true);
    const bb = new T.Box3().setFromObject(c), ctr = bb.getCenter(new T.Vector3());
    const [sx, sz] = slotAt(this.snack, i, this.each);
    const to = new T.Vector3(u.plate.position.x + sx * ps - ctr.x, u.plate.position.y + fy + 0.01 - bb.min.y, u.plate.position.z + (0.05 + sz) * ps - ctr.z);
    const q1 = c.quaternion.clone();
    u.carrots.push(c);
    if (instant) { c.position.copy(to); if (slot) slot.visible = false; return Promise.resolve(); }
    c.quaternion.copy(q0); c.scale.setScalar(s0); c.position.copy(from);
    this.s.stop(c.scale); this.s.stop(c.position);
    const qt = new T.Quaternion();
    // a low arc that reaches the plate's depth first, so it never swings across the friend's face
    return this.s.anim(0.7, (e, p) => {
      const ez = Ease.out(Math.min(1, p * 1.6));
      c.position.set(from.x + (to.x - from.x) * e, from.y + (to.y - from.y) * e + Math.sin(p * Math.PI) * 0.6, from.z + (to.z - from.z) * ez);
      qt.slerpQuaternions(q0, q1, e); c.quaternion.copy(qt);
      c.scale.setScalar(s0 + (size - s0) * e);
    }, Ease.inOut).then(() => {
      if (this.dead) return;
      c.position.copy(to); c.quaternion.copy(q1); c.scale.setScalar(size);
      if (slot) slot.visible = false;
      sfx.land();
      // the plate dips as the snack lands (straight down only, so a bowl never swells into its friend)
      const p0 = u.plate.scale.x;
      this.s.anim(0.3, (_, p) => u.plate.scale.set(p0, p0 * (1 - Math.sin(p * Math.PI) * 0.12), p0)).then(() => u.plate.scale.setScalar(p0));
    });
  }

  async drop(z) {
    const c = this.carrot;
    if (!c) return;
    const sp = SNACKS[this.snack];
    const sh = sp.show ?? SHOW;
    this.s.tween(c.scale, { x: sh, y: sh, z: sh }, 0.12);
    const SP = this.spawnAt;
    const back = () => { this.s.tween(c.position, { x: SP.x, y: SP.y, z: SP.z }, 0.55, Ease.inOut); c.rotation.z = this.held ?? sp.held; };
    if (!z || this.busy || !z.bunny || z.bunny.userData.enabled === false) { back(); this.calmDown(); return; }
    const b = z.bunny;
    if (b.userData.n > this.min()) {
      // that friend already has more: it shakes its head, and the friend who is waiting hops and reaches out
      back();
      this.calmDown();
      const bu = b.userData;
      if (bu.face) setFace(bu.face, 'calm');
      const wait = this.valid().find((x) => x.userData.enabled) || this.valid()[0];
      const wu = wait.userData;
      if (wu.face) setFace(wu.face, 'sad');
      wu.reachTo = 0.8;
      hop(this.s, wait, 0.3, 0.5);
      const stop = fx.halo(wu.plate, 1.2 * (wu.plate.userData.size || 1));
      this.s.wait(2).then(stop);
      this.s.wait(1.4).then(() => { if (wu.face && wu.n < this.each) setFace(wu.face, 'happy'); if (bu.face) setFace(bu.face, 'happy'); wu.reachTo = 0; });
      this.redirect(`That ${this.friend.name} is waiting!`, { obj: b });
      return;
    }
    input.remove(c.userData.drag);
    this.carrot = null;
    this.clearHints();
    this.calmDown();
    const landed = this.placeCarrot(b, false, c);
    this.given = (this.given || 0) + 1;
    const u = b.userData;
    if (u.face) setFace(u.face, 'joy');
    // served: a little bounce and its own happy call; the count floats up in front of the plate
    this.s.wait(0.75).then(() => {
      if (this.dead) return;
      hop(this.s, b, u.kind === 'hen' ? 0.18 : 0.25, 0.45);
      sfx[CALL[u.kind]]?.();
      const ps = u.plate.userData.size || 1;
      fx.float(u.plate.position.clone().add(new T.Vector3(0, 0.45, 1.3 * ps)), String(u.n), { color: HEX[u.col], size: 7 });
      this.s.wait(0.6).then(() => { if (u.face && u.face.userData.emotion === 'joy') setFace(u.face, 'happy'); });
    });
    const done = this.bunnies.every((x) => x.userData.n >= this.each);
    if (!done) {
      this.say(ONE[Math.min(ONE.length - 1, this.given - 1)], { voice: false });
      this.idle = 0; this.ladder = 0;
      this.busy = true;
      await this.wait(1.2);
      this.busy = false;
      this.spawnCarrot();
      if (this.errorlessOn) { this.errorlessOn = false; this.unErrorless(); }
      return;
    }
    // Everyone has the same. The plates light up gold, "The same!" is said, and the friends eat in turn, left to
    // right, each leaving as soon as it has finished (the first to the hay bench, the others off to the right). The
    // next round lays itself out at the same time: her next snack is ready about 1.5 s after this drop and the first new
    // friend steps in as soon as its spot is clear (rule 0: never more than 2 s to the next thing she can do).
    this.busy = true;
    this.given = 0;
    this.dropT = performance.now();
    const list = this.bunnies.slice();
    this.leaving = this.leaving.concat(list);     // they hold their spots until they walk away
    const last = this.round + 1 >= this.totalRounds;
    // the bin goes now if the next round needs a different one (nothing more comes out of it this round)
    if (!last && this.themes[this.round + 1] !== this.binKind && this.bin) {
      const old = this.bin; this.bin = null; this.binKind = null;
      vanish(this.s, old, 0.3).then(() => { this.root.remove(old); disposeTree(old); });
    }
    await this.alive(landed);
    if (this.dead) return;
    this.party = this.eatAll(list);
    this.payoffP = this.wait(0.3);                 // a look at the gold plates; the eating carries on into the next round
    this.busy = false;
    this.success(new T.Vector3(0, 1.5, 0.5), SAME[this.each - 1], { voice: true, still: 0 });
  }

  // The payoff: gold plates (this is "the same"), a glance along the row, then each friend eats in turn, left to right:
  // head down, a munch, a bitten snack, a second bite and it is gone, a happy face; then that friend walks off.
  async eatAll(list) {
    list.forEach((x, i) => this.s.wait(i * 0.08).then(() => this.s.anim(0.3, (_, q) => lightPlate(x.userData.plate, q))));
    list.forEach((x, i) => { x.userData.lookAt = list[(i + 1) % list.length]; });
    const one = async (x, i) => {
      const u = x.userData, h = u.head;
      u.lookAt = null;
      const hx = h ? h.rotation.x : 0;
      if (h) this.s.tween(h.rotation, { x: hx + 0.35 }, 0.15, Ease.out);
      sfx.chomp();
      for (const cc of u.carrots) { const k = cc.scale.x * 0.6; this.s.tween(cc.scale, { x: k, y: k, z: k }, 0.14, Ease.out); }
      await this.wait(0.26);
      for (const cc of u.carrots) this.s.tween(cc.scale, { x: 0.001, y: 0.001, z: 0.001 }, 0.16, Ease.in).then(() => { cc.visible = false; });
      await this.wait(0.18);
      if (h) this.s.tween(h.rotation, { x: hx }, 0.25, Ease.inOut);
      if (u.face) setFace(u.face, 'joy');
      if (this.dead) return;
      return this.leave(x, i === 0);
    };
    await Promise.all(list.map((x, i) => this.wait(0.12 + i * 0.25).then(() => (this.dead ? null : one(x, i)))));
  }

  // A fed friend leaves at walking pace: the first of the round goes straight back to its spot in front of the hay bench
  // and hops up (it stays all level); the others step back into the exit lane and walk off to the right.
  async leave(b, toBench) {
    const u = b.userData;
    u.reach = u.reachTo = 0; u.lean = u.leanTo = 0; b.rotation.x = 0; u.lookAt = null;
    u.limbs.forEach((a, i) => { a.rotation.z = u.limbR0[i]; });
    this.bunnies = this.bunnies.filter((x) => x !== b);
    for (const cc of u.carrots) if (cc.parent) { cc.parent.remove(cc); disposeTree(cc); }
    // the plate was never hers to keep: it settles away slowly
    const p = u.plate;
    this.fadeAway(p, 0.45).then(() => { this.root.remove(p); disposeTree(p); });
    u.goRight = !toBench;
    const done = () => { this.leaving = this.leaving.filter((x) => x !== b); };
    if (toBench) {
      const spot = this.tray.spot(this.joinI = (this.joinI ?? -1) + 1);
      await this.stroll(b, [new T.Vector3(b.position.x, 0, BENCH.front), new T.Vector3(spot.x, 0, BENCH.front)], 2.6, true);
      if (!this.dead) await this.tray.add(b, { arc: 0.4, dur: 0.95 });
      if (u.face) setFace(u.face, 'happy');
      done();
    } else {
      await this.stroll(b, [new T.Vector3(b.position.x, 0, EXIT_Z), new T.Vector3(10.5, 0, EXIT_Z)], 2.8, false);
      done();
      if (b.parent) b.parent.remove(b);
      disposeTree(b);
    }
  }
  // Walk along a path of points at walking pace (a short ease in and out, turning to face the way it goes; never a
  // straight slide through anyone). faceCamera: turn back to the camera at the end.
  async stroll(obj, pts, speed, faceCamera) {
    for (const to of pts) {
      const from = obj.position.clone();
      const dist = Math.hypot(to.x - from.x, to.z - from.z);
      if (dist < 0.05) continue;
      const dur = Math.max(0.35, dist / speed);
      const r0 = obj.rotation.y, r1 = Math.atan2(to.x - from.x, to.z - from.z);
      let dr = r1 - r0; dr = Math.atan2(Math.sin(dr), Math.cos(dr));
      const acc = Math.min(0.2, dur * 0.3);
      await this.s.anim(dur, (_, p) => {
        const t = p * dur;
        // trapezoid speed: ease in over acc, steady, ease out over acc
        const d = t < acc ? (t * t) / (2 * acc) : t > dur - acc ? dur - acc - (dur - t) ** 2 / (2 * acc) : t - acc / 2;
        const e = Math.min(1, d / (dur - acc));
        obj.position.lerpVectors(from, to, e);
        obj.rotation.y = r0 + dr * Math.min(1, p * dur / 0.25);
      });
      obj.position.copy(to);
    }
    if (faceCamera && !this.dead) await this.s.tween(obj.rotation, { y: 0 }, 0.25, Ease.inOut);
  }

  // Nothing to wait for between rounds: the friends finish eating and walk off while the next round lays out.
  // After the last round everyone settles first, so the finale camera turns to a quiet bench of fed friends.
  async afterSuccess() {
    if (this.dead) return;
    if (this.round >= this.totalRounds) { await this.alive(Promise.resolve(this.party)); await this.alive(this.until(() => !this.leaving.length, 6)); }
  }
  until(fn, max = 4) { return (async () => { for (let k = 0; k < max * 20 && !fn() && !this.dead; k++) await this.wait(0.05); })(); }

  // a fed friend on the bench answers a poke in its own voice
  onAdmirePoke(obj) {
    input.press(obj, 140);
    const k = obj.userData.kind;
    if (CALL[k]) sfx[CALL[k]]?.(); else sfx.tap();
  }
  // Finale: Pip walks over to stand beside the bench of fed friends, and the camera frames both inside the middle of
  // the picture (the saved photo is a centre 4:3 crop of the screen).
  onFinale() {
    this.stroll(this.pip, [new T.Vector3(-5.05, 0, BENCH.z + 0.3)], 2.0, true);
  }
  creationView() {
    const v = this.tray.view();
    v.pos.sub(v.look).multiplyScalar(1.28).add(v.look);
    v.pos.x -= 1.2; v.look.x -= 1.2;
    return v;
  }
  creationObjects() { return this.tray.items(); }

  showHint(glow = true) {
    const b = this.valid().find((x) => x.userData.enabled) || this.valid()[0];
    if (!b || !this.carrot) return;
    if (glow) this.addHalo(b.userData.plate, 1.2);
    fx.ghostPath([this.carrot.position.clone(), b.userData.plate.position.clone().add(new T.Vector3(0, 0.6, 0))], { mode: 'drag' });
  }
  // the drag demo at every level (a scan hand never showed her the drag): any friend with the fewest is right
  demoL3() { this.showHint(false); }
  makeErrorless() {
    const ok = this.valid();
    for (const b of this.bunnies) if (!ok.includes(b)) { b.userData.enabled = false; const k = (b.userData.baseScale || 1) * 0.8; this.s.tween(b.scale, { x: k, y: k, z: k }, 0.3); }
  }
  unErrorless() { for (const b of this.bunnies) { b.userData.enabled = true; const k = b.userData.baseScale || 1; this.s.tween(b.scale, { x: k, y: k, z: k }, 0.3); } }

  promptText() {
    if (!this.snack) return '';
    const name = this.friend?.name || 'friend';
    if (this.each === 1) return `Give each ${name} ${A_SNACK[this.snack]}!`;
    return `${COUNT[this.each]} ${SNACKS[this.snack]?.plural || 'snacks'} each!`;
  }

  update(dt, t) {
    // the snack to move bobs so it reads as "pick me up"
    const c = this.carrot;
    const dragging = input.dragging();
    if (c && c.userData.drag && !dragging && this.spawnAt && Math.abs(c.position.x - this.spawnAt.x) < 0.01 && !(performance.now() - (this.nudgeT || 0) < 600)) { c.position.y = this.spawnAt.y + (1 - Math.cos(t * 3)) * 0.06; c.rotation.y = Math.sin(t * 1.7) * 0.3; }
    if (!dragging) this.hover = null;
    const k = Math.min(1, dt * 8);
    const wp = new T.Vector3();
    for (const b of this.bunnies) {
      const u = b.userData;
      if (!b.visible) continue;
      // everyone watches the snack (or, for a moment, a friend's plate)
      if (u.head) {
        let want = null;
        if (u.lookAt) { u.lookAt.userData.plate.getWorldPosition(wp); want = Math.atan2(wp.x - b.position.x, wp.z - b.position.z) * 0.8; }
        else if (c) want = Math.atan2(c.position.x - b.position.x, c.position.z - b.position.z) * 0.8;
        const lim = u.kind === 'hen' ? 0.35 : 0.6; // a hen turning further puts its beak behind its own wing
        if (want !== null) { want = Math.max(-lim, Math.min(lim, want)); u.head.rotation.y += (want - u.head.rotation.y) * k; }
      }
      // arms / wings reach out for the snack (and a little cheer when served), never up past the face
      u.reach += ((u.reachTo || 0) - u.reach) * Math.min(1, dt * 6);
      const top = REACH_MAX[u.kind] ?? 1.0;
      const a = Math.min(top, u.reach * 1.2);
      u.limbs.forEach((l, i) => { l.rotation.z = u.limbR0[i] + (i ? 1 : -1) * a; });
      // the friend the snack is held over leans in; after eating, a happy lean back
      const lean = this.hover === b && u.n === this.min() ? 0.15 : (u.leanTo || 0);
      u.lean += (lean - u.lean) * k;
      b.rotation.x = u.lean;
    }
    // a hungry friend bounces now and then while waiting
    if (!this.busy && !dragging && c) {
      this.hungryT += dt;
      if (this.hungryT > 5) {
        this.hungryT = 0;
        const waiting = this.valid().filter((b) => b.userData.enabled && b.userData.n < this.each);
        const b = waiting[Math.floor(Math.random() * waiting.length)];
        if (b) hop(this.s, b, b.userData.kind === 'hen' ? 0.15 : 0.22, 0.5);
      }
    }
  }
}
