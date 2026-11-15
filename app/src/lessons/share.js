// Game 13 — Share the snacks. Topics mt_FwI7q7DSIx "Taking turns and sharing", mt_LpSuPgL31x "Division as equal sharing".
// Drag snacks from the bin to the friends' plates, one at a time, so everyone gets the same.
// Each round brings new friends and a new snack (carrots for bunnies, apples for pigs, corn for hens, fish for kittens,
// and a cookie party for everyone). Dotted spots on each plate show how many each friend gets; plates glow gold when equal.
import * as T from '../three.js';
import { Lesson } from '../engine/lesson.js';
import { mesh, geo, disposeTree } from '../engine/toon.js';
import { makeAnimal, popIn, popOut, hop, shake, setFace, wiggle } from '../engine/actors.js';
import { makeFarmAnimal } from '../engine/farm.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';
import { SNACKS, makeSnack, makeBin, makePlate, lightPlate } from './share-props.js';

const CRATE = new T.Vector3(-5.6, 0, 3.7);
const SPAWN = new T.Vector3(CRATE.x, 1.6, CRATE.z + 0.2);
const XS = { 2: [-1.4, 3.6], 3: [-2.6, 1.2, 5.0], 4: [-3.6, -0.6, 2.4, 5.4] };
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
    this.pip.position.set(-7.4, 0, -1.2);
    this.bunnies = [];
    this.hungryT = 0;
  }

  setBin(kind) {
    if (this.binKind === kind) return;
    this.binKind = kind;
    const old = this.bin;
    if (old) popOut(this.s, old, 0.18).then(() => { this.root.remove(old); disposeTree(old); });
    this.bin = makeBin(kind);
    this.bin.position.copy(CRATE);
    this.root.add(this.bin);
    popIn(this.s, this.bin, 0.85, 0.4);
  }

  async startRound(r) {
    this.busy = true;
    for (const b of this.bunnies) {
      popOut(this.s, b, 0.18).then(() => this.root.remove(b));
      for (const c of b.userData.carrots) this.root.remove(c);
      const p = b.userData.plate;
      popOut(this.s, p, 0.18).then(() => { this.root.remove(p); disposeTree(p); });
    }
    const [n, each, pre] = this.plan[r];
    this.each = each;
    this.snack = this.themes[r];
    this.friend = FRIENDS[this.snack];
    this.setBin(this.snack);
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
      const plate = makePlate(BOWS[i], each, sp.gap);
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
    c.position.copy(SPAWN);
    c.rotation.z = sp.held;
    this.root.add(c);
    // pops up out of the bin
    c.position.y = CRATE.y + 0.6;
    this.s.tween(c.position, { y: SPAWN.y }, 0.3, Ease.back);
    popIn(this.s, c, 1.25, 0.3);
    sfx.pop();
    hop(this.s, this.pip, 0.25, 0.3); // Pip hands out the next snack
    this.carrot = c;
    c.userData.drag = input.addDrag(c, {
      radius: 1.0, minY: 0.5, offset: new T.Vector3(0, 0.1, 0),
      zones: () => this.bunnies.map((b) => ({ bunny: b, pos: b.userData.plate.position.clone().add(new T.Vector3(0, 0.8, -0.4)), radius: 1.5, enabled: b.userData.enabled !== false })),
      onPick: () => {
        this.s.tween(c.scale, { x: 1.45, y: 1.45, z: 1.45 }, 0.12);
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

  min() { return Math.min(...this.bunnies.map((b) => b.userData.n)); }
  valid() { const m = this.min(); return this.bunnies.filter((b) => b.userData.n === m); }

  calmDown() {
    this.hover = null;
    for (const b of this.bunnies) { const u = b.userData; u.reachTo = 0; if (u.face) setFace(u.face, 'happy'); }
  }

  placeCarrot(b, instant = false, c = null) {
    const u = b.userData, i = u.n++;
    const sp = SNACKS[this.snack];
    c = c || makeSnack(this.snack);
    const slot = u.plate.userData.slots[i];
    const to = new T.Vector3(u.plate.position.x + (i - (this.each - 1) / 2) * sp.gap, sp.y, u.plate.position.z + 0.05);
    const [rx, ry, rz] = sp.lay;
    if (instant) {
      c.position.copy(to); c.rotation.set(rx, ry, rz); c.scale.setScalar(sp.size); this.root.add(c);
      if (slot) slot.visible = false;
    } else {
      const from = c.position.clone(), r0 = c.rotation.clone(), k0 = c.scale.x;
      this.s.anim(0.28, (e) => {
        c.position.lerpVectors(from, to, e); c.position.y += Math.sin(e * Math.PI) * 0.8;
        c.rotation.set(r0.x + (rx - r0.x) * e, r0.y + (ry - r0.y) * e, r0.z + (rz - r0.z) * e);
        c.scale.setScalar(k0 + (sp.size - k0) * e);
      }, Ease.inOut).then(() => {
        sfx.land();
        if (slot) slot.visible = false;
        // the snack lands with a little squash, the plate bounces
        this.s.anim(0.2, (_, p) => { const q = 1 - Math.sin(p * Math.PI) * 0.25; c.scale.set(sp.size / Math.sqrt(q), sp.size * q, sp.size / Math.sqrt(q)); }).then(() => c.scale.setScalar(sp.size));
        this.s.anim(0.22, (_, p) => u.plate.scale.set(1 + Math.sin(p * Math.PI) * 0.1, 1 - Math.sin(p * Math.PI) * 0.2, 1 + Math.sin(p * Math.PI) * 0.1)).then(() => u.plate.scale.setScalar(1));
      });
    }
    u.carrots.push(c);
  }

  async drop(z) {
    const c = this.carrot;
    if (!c) return;
    const sp = SNACKS[this.snack];
    this.s.tween(c.scale, { x: 1.25, y: 1.25, z: 1.25 }, 0.12);
    const back = () => { this.s.tween(c.position, { x: SPAWN.x, y: SPAWN.y, z: SPAWN.z }, 0.35, Ease.back); c.rotation.z = sp.held; };
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
      this.redirect(`That one has ${bu.n === 1 ? 'one' : 'some'}. This one is waiting!`);
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
    this.s.wait(0.3).then(() => {
      sfx.chomp();
      this.s.wait(0.25).then(() => sfx.crunch());
      for (const x of this.bunnies) {
        const xu = x.userData;
        hop(this.s, x, 0.5, 0.4);
        xu.reach = 1.4;
        for (const cc of xu.carrots) this.s.tween(cc.scale, { x: 0.001, y: 0.001, z: 0.001 }, 0.35, Ease.in);
        fx.float(x.position.clone().add(new T.Vector3(0, 3.4, 0)), '♥', { color: '#ff5a8a', size: 7 });
      }
    });
    this.busy = false;
    this.success(new T.Vector3(1.2, 3.5, 0), 'Same for everyone!');
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
    if (c && c.userData.drag && !dragging && Math.abs(c.position.x - SPAWN.x) < 0.01) { c.position.y = SPAWN.y + Math.sin(t * 3) * 0.12; c.rotation.y = Math.sin(t * 1.7) * 0.3; }
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
