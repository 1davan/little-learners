// Game 13 — Share the snacks. Topics mt_FwI7q7DSIx "Taking turns and sharing", mt_LpSuPgL31x "Division as equal sharing".
// Drag snacks from the bin to the friends' plates, one at a time, so everyone gets the same.
// Each round brings new friends and a new snack (carrots for bunnies, apples for pigs, corn for hens, fish for kittens,
// and a cookie party for everyone). Dotted spots on each plate show how many each friend gets; plates glow gold when equal.
// Each level is a different place: a picnic blanket with china plates (L1), inside the barn with wooden bowls (L2),
// a garden party with leaf plates and bunting (L3). Snacks arc onto their dotted spot on the plate.
import * as T from '../three.js';
import { Lesson } from '../engine/lesson.js';
import { mesh, geo, disposeTree } from '../engine/toon.js';
import { makeAnimal, popIn, popOut, hop, shake, setFace, wiggle } from '../engine/actors.js';
import { makeFarmAnimal } from '../engine/farm.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';
import { frame, calmBackdrop } from './view-tools.js';
import { SNACKS, makeSnack, makeBin, makePlate, lightPlate, makeSet, SET_STYLE } from './share-props.js';

// The snack bin sits low at the front, between two plates (it moves with the layout), so the snack waiting on
// top never covers Pip or a plate; Pip stands back-left. Everything fits a 4:3 screen with the closer camera.
const CRATE = new T.Vector3(0, 0, 4.9);
const SPAWN = new T.Vector3(CRATE.x, 1.0, CRATE.z + 0.2);
// the snack waiting to be picked up hovers clear above the bin's pile (bob included), never dipping into it
const SPAWN_Y = { carrot: 1.95, corn: 1.9, apple: 1.9, fish: 1.85, cookie: 1.5 };
const XS = { 2: [-2.3, 2.3], 3: [-3.5, 0, 3.5], 4: [-4.5, -1.5, 1.5, 4.5] };
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
const PARTY = ['bunny', 'pig', 'hen', 'cat'];
const SIZE = { bunny: 0.95, pig: 0.92, hen: 0.95, cat: 0.95 };
const CALL = { bunny: 'boing2', pig: 'oink', hen: 'cluck', cat: 'meow' };
const ONE = ['One for you!', 'One for you!', 'And one for you!'];
// the payoff when everyone has the same: never the same twice in a row
const PAYOFFS = [
  ['munch', 'juggle', 'spin', 'munch', 'juggle', 'spin'],
  ['juggle', 'spin', 'munch', 'juggle', 'munch', 'spin'],
  ['spin', 'munch', 'juggle', 'spin', 'juggle', 'munch'],
];

function makeFriend(kind, i) {
  const f = kind === 'hen' ? makeFarmAnimal('hen') : makeAnimal(kind);
  if (kind === 'bunny' && f.userData.head) {
    // a coloured bow so the bunnies are easy to tell apart
    const bow = new T.Group();
    for (const s of [-1, 1]) { const l = mesh(geo.sphere(0.13, 10, 8), BOWS[i], { outline: 0.014 }); l.scale.set(1.3, 0.8, 0.6); l.position.x = s * 0.15; bow.add(l); }
    bow.position.set(0.32, 0.5, 0.35);
    f.userData.head.add(bow);
  }
  const u = f.userData;
  u.limbs = u.arms || u.wings || [];
  u.limbR0 = u.limbs.map((a) => a.rotation.z);
  u.reach = 0; u.reachTo = 0; u.lean = 0;
  return f;
}

export default class ShareLesson extends Lesson {
  build() {
    this.plan = PLANS[this.level];
    this.themes = THEMES[this.level];
    this.pip.position.set(-6.8, 0, -2.4); // clear of the leftmost friend in a four-friend party
    frame(0, 5.6, 12.8, 0, 1.2, 1.0);
    calmBackdrop(this.meadow);
    this.bunnies = [];
    this.hungryT = 0;
    this.style = SET_STYLE[this.level];
    this.set = makeSet(this.level);
    // centre the set on the play area and stretch its ground pieces forward to reach the bin at the front
    this.set.position.x = -1.0;
    for (const c of this.set.children) {
      if (c.isGroup || c.position.y > 0.07) continue; // flat ground pieces only (not flowers, poles or walls)
      c.position.z = c.position.z * 1.45 + 1.19;
      if (Math.abs(c.rotation.x) > 1) c.scale.y *= 1.45; else c.scale.z *= 1.45;
    }
    this.root.add(this.set);
  }

  setBin(kind) {
    if (this.binKind === kind) return;
    this.binKind = kind;
    const old = this.bin;
    if (old) popOut(this.s, old, 0.18).then(() => { this.root.remove(old); disposeTree(old); });
    this.bin = makeBin(kind);
    this.bin.position.copy(CRATE); this.bin.position.x = this.spawnAt ? this.spawnAt.x : CRATE.x;
    this.root.add(this.bin);
    popIn(this.s, this.bin, 0.7, 0.4);
  }

  async startRound(r) {
    this.busy = true;
    for (const b of this.bunnies) {
      popOut(this.s, b, 0.18).then(() => this.root.remove(b));
      // (the snacks were all eaten in the payoff: chomped down to nothing)
      for (const c of b.userData.carrots) this.root.remove(c);
      const p = b.userData.plate;
      popOut(this.s, p, 0.18).then(() => { this.root.remove(p); disposeTree(p); });
    }
    // last round's friends and plates are fully gone before the new ones pop in (never two sets overlapping)
    if (this.bunnies.length) await this.wait(0.2);
    // one bowl-shaped catcher per plate (last round's catchers went with their plates; the floor stays)
    const [n, each, pre] = this.plan[r];
    this.each = each;
    this.snack = this.themes[r];
    this.friend = FRIENDS[this.snack];
    // the bin sits between the first two plates
    this.spawnAt = SPAWN.clone(); this.spawnAt.x = (XS[n][0] + XS[n][1]) / 2;
    this.spawnAt.y = SPAWN_Y[this.snack] ?? SPAWN.y;
    this.setBin(this.snack);
    if (this.bin.position.x !== this.spawnAt.x) this.s.tween(this.bin.position, { x: this.spawnAt.x }, 0.3, Ease.inOut);
    const sp = SNACKS[this.snack];
    const party = this.friend.kind ? null : PARTY.slice(r % 2, (r % 2) + 4).concat(PARTY).slice(0, n);
    this.bunnies = XS[n].map((x, i) => {
      const kind = party ? party[i] : this.friend.kind;
      const b = makeFriend(kind, i);
      const sc = SIZE[kind] || 1;
      b.position.set(x, 0, -0.6);
      b.rotation.y = -x * 0.04;
      b.userData.baseScale = sc;
      this.root.add(b);
      b.scale.setScalar(0.001);
      this.s.wait(0.05 + i * 0.07).then(() => popIn(this.s, b, sc, 0.4, { sound: i === 0 }));
      const plate = makePlate(BOWS[i], each, sp.gap, this.style);
      plate.position.set(x, 0, 1.0);
      this.root.add(plate);
      popIn(this.s, plate, 1, 0.3, { sound: false });
      Object.assign(b.userData, { plate, carrots: [], n: 0, kind, col: i, enabled: true });
      return b;
    });
    if (pre) { const b = this.bunnies[1]; this.placeCarrot(b, true); }
    await this.wait(0.3);
    this.spawnCarrot();
    this.busy = false;
    this.cue();
  }

  spawnCarrot() {
    const c = makeSnack(this.snack);
    const sp = SNACKS[this.snack];
    const SP = this.spawnAt;
    c.position.copy(SP);
    c.rotation.z = sp.held;
    this.root.add(c);
    // pops up out of the bin
    c.position.y = CRATE.y + 0.6;
    this.s.tween(c.position, { y: SP.y }, 0.3, Ease.back);
    popIn(this.s, c, SHOW, 0.3);
    sfx.pop();
    hop(this.s, this.pip, 0.25, 0.3); // Pip hands out the next snack
    this.carrot = c;
    c.userData.drag = input.addDrag(c, {
      radius: 1.0, minY: 0.5, offset: new T.Vector3(0, 0.1, 0),
      zones: () => this.bunnies.map((b) => ({ bunny: b, pos: b.userData.plate.position.clone().add(new T.Vector3(0, 0.8, -0.4)), radius: 1.5, enabled: b.userData.enabled !== false })),
      onPick: () => {
        this.s.tween(c.scale, { x: HELD, y: HELD, z: HELD }, 0.12);
        // the hungry ones go "ooh!" and reach out
        for (const b of this.bunnies) {
          const u = b.userData;
          if (u.n < this.each) { u.reachTo = 1; if (u.face) setFace(u.face, 'scared'); wiggle(this.s, u.head || b, 0.12, 0.35); }
        }
        sfx.gasp();
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
    const fy = u.plate.userData.floorY;
    const [rx, ry, rz] = sp.lay;
    // where it rests: centred on its spot, its lowest point just on the plate
    const from = c.position.clone(), q0 = c.quaternion.clone(), s0 = c.scale.x;
    c.rotation.set(rx, ry, rz); c.scale.setScalar(sp.size); c.position.set(0, 0, 0); c.updateMatrixWorld(true);
    const bb = new T.Box3().setFromObject(c), ctr = bb.getCenter(new T.Vector3());
    const to = new T.Vector3(u.plate.position.x + (i - (this.each - 1) / 2) * sp.gap - ctr.x, fy + 0.01 - bb.min.y, u.plate.position.z + 0.05 - ctr.z);
    const q1 = c.quaternion.clone();
    u.carrots.push(c);
    if (instant) { c.position.copy(to); if (slot) slot.visible = false; return; }
    c.quaternion.copy(q0); c.scale.setScalar(s0); c.position.copy(from);
    this.s.stop(c.scale); this.s.stop(c.position);
    const qt = new T.Quaternion();
    this.s.anim(0.42, (e, p) => {
      c.position.lerpVectors(from, to, e);
      c.position.y += Math.sin(p * Math.PI) * 1.0;
      qt.slerpQuaternions(q0, q1, e); c.quaternion.copy(qt);
      c.scale.setScalar(s0 + (sp.size - s0) * e);
    }, Ease.inOut).then(() => {
      if (this.dead) return;
      c.position.copy(to); c.quaternion.copy(q1); c.scale.setScalar(sp.size);
      if (slot) slot.visible = false;
      sfx.land();
      // the plate bounces as the snack lands
      this.s.anim(0.22, (_, p) => u.plate.scale.set(1 + Math.sin(p * Math.PI) * 0.1, 1 - Math.sin(p * Math.PI) * 0.2, 1 + Math.sin(p * Math.PI) * 0.1)).then(() => u.plate.scale.setScalar(1));
    });
  }

  async drop(z) {
    const c = this.carrot;
    if (!c) return;
    const sp = SNACKS[this.snack];
    this.s.tween(c.scale, { x: SHOW, y: SHOW, z: SHOW }, 0.12);
    const SP = this.spawnAt;
    const back = () => { this.s.tween(c.position, { x: SP.x, y: SP.y, z: SP.z }, 0.35, Ease.back); c.rotation.z = sp.held; };
    if (!z || this.busy) { back(); sfx.land(); this.calmDown(); return; }
    const b = z.bunny;
    if (b.userData.n > this.min()) {
      // that friend already has more: shakes its head and points at the friend who's waiting
      back();
      this.calmDown();
      const bu = b.userData;
      if (bu.face) setFace(bu.face, 'calm');
      shake(this.s, bu.head || b, 0.1, 0.5);
      const wait = this.valid()[0];
      const wu = wait.userData;
      if (wu.face) setFace(wu.face, 'sad');
      wu.reachTo = 1;
      hop(this.s, wait, 0.45, 0.35);
      sfx[CALL[wu.kind]]?.();
      this.s.wait(0.9).then(() => { if (wu.face && wu.n < this.each) setFace(wu.face, 'happy'); if (bu.face) setFace(bu.face, 'happy'); wu.reachTo = 0; });
      this.redirect('This one is waiting!');
      return;
    }
    input.remove(c.userData.drag);
    this.carrot = null;
    this.clearHints();
    this.calmDown();
    this.placeCarrot(b, false, c);
    sfx.note(this.given = (this.given || 0) + 1);
    const u = b.userData;
    if (u.face) setFace(u.face, 'happy');
    this.s.wait(0.2).then(() => { hop(this.s, b, 0.5, 0.35); sfx[CALL[u.kind]]?.(); u.reach = 1.3; });
    fx.float(b.position.clone().add(new T.Vector3(0, 3.2, 0)), '♥', { color: '#ff5a8a', size: 6 });
    // how many on this plate now
    this.s.wait(0.25).then(() => fx.float(u.plate.position.clone().add(new T.Vector3(0, 1.0, 0.4)), String(u.n), { color: HEX[u.col], size: 7 }));
    const done = this.bunnies.every((x) => x.userData.n >= this.each);
    if (!done) {
      // everyone has the same so far: the plates shimmer
      if (this.bunnies.every((x) => x.userData.n === u.n)) this.s.wait(0.3).then(() => this.shimmer(0.55));
      this.say(ONE[Math.min(ONE.length - 1, this.given - 1)], { interrupt: true });
      this.idle = 0; this.ladder = 0;
      this.busy = true;
      await this.wait(0.3);
      this.busy = false;
      this.spawnCarrot();
      if (this.errorlessOn) { this.errorlessOn = false; this.unErrorless(); }
      return;
    }
    // everyone has the same: the plates light up gold one by one, then everyone munches together
    this.busy = true;
    this.given = 0;
    input.lock(1500);
    await this.wait(0.3);
    this.bunnies.forEach((x, i) => this.s.wait(i * 0.09).then(() => {
      const p = x.userData.plate;
      sfx.note(i + 3);
      this.s.anim(0.25, (_, q) => lightPlate(p, q));
      this.s.anim(0.3, (_, q) => p.scale.setScalar(1 + Math.sin(q * Math.PI) * 0.18)).then(() => p.scale.setScalar(1));
      const nx = this.bunnies[i + 1];
      if (nx) fx.float(p.position.clone().lerp(nx.userData.plate.position, 0.5).add(new T.Vector3(0, 1.2, 0.3)), '=', { color: '#e8a800', size: 9 });
    }));
    this.s.wait(0.3).then(() => this.payoff(PAYOFFS[this.level][this.round % 6]));
    this.busy = false;
    this.success(new T.Vector3(1.2, 3.5, 0), 'Same for everyone!');
  }

  // everyone has the same: a quick party, a different one each round (all under 0.9 s)
  payoff(kind) {
    // munch: each snack loses a big bite, then the rest goes (two quick chomps), never just vanishing
    const eat = (x, d) => this.s.wait(d).then(() => { for (const cc of x.userData.carrots) { const k = cc.scale.x * 0.6; this.s.tween(cc.scale, { x: k, y: k, z: k }, 0.12, Ease.out).then(() => this.s.tween(cc.scale, { x: 0.001, y: 0.001, z: 0.001 }, 0.16, Ease.in)); } });
    if (kind === 'juggle') {
      // the snacks hop up off the plates and drop back, then get gobbled
      sfx.boing();
      for (const x of this.bunnies) { for (const [j, cc] of x.userData.carrots.entries()) { const y0 = cc.position.y, r0 = cc.rotation.y; this.s.wait(j * 0.05).then(() => this.s.anim(0.4, (_, p) => { cc.position.y = y0 + Math.sin(p * Math.PI) * 0.9; cc.rotation.y = r0 + Math.sin(p * Math.PI) * 0.6; })); } x.userData.reach = 1.5; hop(this.s, x, 0.4, 0.35); }
      this.s.wait(0.45).then(() => sfx.chomp());
      this.bunnies.forEach((x) => eat(x, 0.5));
    } else if (kind === 'spin') {
      // everyone does a happy twirl, then munch
      sfx.whoosh();
      for (const x of this.bunnies) { const r0 = x.rotation.y; this.s.anim(0.5, (e) => (x.rotation.y = r0 + e * Math.PI * 2), Ease.inOut).then(() => (x.rotation.y = r0)); hop(this.s, x, 0.35, 0.5); }
      this.s.wait(0.35).then(() => { sfx.chomp(); this.s.wait(0.2).then(() => sfx.crunch()); });
      this.bunnies.forEach((x) => eat(x, 0.4));
    } else {
      sfx.chomp();
      this.s.wait(0.25).then(() => sfx.crunch());
      for (const x of this.bunnies) { hop(this.s, x, 0.5, 0.4); x.userData.reach = 1.4; eat(x, 0); }
    }
    for (const x of this.bunnies) fx.float(x.position.clone().add(new T.Vector3(0, 3.4, 0)), '♥', { color: '#ff5a8a', size: 7 });
    this.s.wait(0.2).then(() => sfx[CALL[this.bunnies[0].userData.kind]]?.());
  }

  shimmer(k) {
    sfx.twinkle();
    for (const b of this.bunnies) { const p = b.userData.plate; this.s.anim(0.6, (_, q) => lightPlate(p, Math.sin(q * Math.PI) * k)); }
  }

  showHint(glow = true) {
    const b = this.valid()[0];
    if (!b || !this.carrot) return;
    if (glow) this.addHalo(b.userData.plate, 1.2);
    fx.ghostPath([this.carrot.position.clone(), b.userData.plate.position.clone().add(new T.Vector3(0, 0.6, 0))], { mode: 'drag' });
  }
  demoL3() {
    if (!this.carrot) return;
    fx.ghostPath([this.carrot.position.clone(), ...this.bunnies.map((b) => b.position.clone().add(new T.Vector3(0, 1.4, 1.2)))], { mode: 'scan' });
  }
  makeErrorless() {
    const ok = this.valid();
    for (const b of this.bunnies) if (!ok.includes(b)) { b.userData.enabled = false; const k = (b.userData.baseScale || 1) * 0.8; this.s.tween(b.scale, { x: k, y: k, z: k }, 0.3); }
  }
  unErrorless() { for (const b of this.bunnies) { b.userData.enabled = true; const k = b.userData.baseScale || 1; this.s.tween(b.scale, { x: k, y: k, z: k }, 0.3); } }

  promptText() {
    const name = this.friend?.name || 'friend';
    if (this.snack === 'cookie') return this.each === 1 ? 'A cookie for each friend!' : 'Share the cookies!';
    if (this.level === 0) return `One for each ${name}!`;
    if (this.level === 2 && this.each === 1) return 'Everyone gets one!';
    return `Share the ${SNACKS[this.snack]?.plural || 'snacks'}!`;
  }

  update(dt, t) {
    // the snack to move bobs so it reads as "pick me up"
    const c = this.carrot;
    const dragging = input.dragging();
    if (c && c.userData.drag && !dragging && this.spawnAt && Math.abs(c.position.x - this.spawnAt.x) < 0.01 && !(performance.now() - (this.nudgeT || 0) < 600)) { c.position.y = this.spawnAt.y + Math.sin(t * 3) * 0.12; c.rotation.y = Math.sin(t * 1.7) * 0.3; }
    if (!dragging) this.hover = null;
    const k = Math.min(1, dt * 10);
    for (const b of this.bunnies) {
      const u = b.userData;
      if (!b.visible) continue;
      // everyone watches the snack
      if (u.head && c) {
        const want = Math.max(-0.6, Math.min(0.6, Math.atan2(c.position.x - b.position.x, c.position.z - b.position.z) * 0.8));
        u.head.rotation.y += (want - u.head.rotation.y) * k;
      }
      // arms / wings reach out for the snack (and a cheer after eating)
      u.reach += ((u.reachTo || 0) - u.reach) * Math.min(1, dt * (u.reach > 1 ? 4 : 8));
      const flap = u.kind === 'hen' && u.reachTo ? Math.sin(t * 22) * 0.25 : 0;
      u.limbs.forEach((a, i) => { a.rotation.z = u.limbR0[i] + (i ? 1 : -1) * (u.reach * 1.5 + flap); });
      // the friend the snack is held over leans in, mouth open
      const lean = this.hover === b && u.n === this.min() ? 0.2 : 0;
      u.lean += (lean - u.lean) * k;
      b.rotation.x = u.lean;
    }
    // a hungry friend bounces now and then while waiting
    if (!this.busy && !dragging && c) {
      this.hungryT += dt;
      if (this.hungryT > 2.6) {
        this.hungryT = 0;
        const waiting = this.valid().filter((b) => b.userData.n < this.each);
        const b = waiting[Math.floor(Math.random() * waiting.length)];
        if (b) {
          hop(this.s, b, 0.3, 0.3);
          b.userData.reach = 0.7;
          if (Math.random() < 0.5) sfx[CALL[b.userData.kind]]?.();
        }
      }
    }
  }

  onFinale() { this.bunnies.forEach((b, i) => this.s.wait(i * 0.2).then(() => { hop(this.s, b, 0.9, 0.5); b.userData.reach = 1.5; })); }
}
