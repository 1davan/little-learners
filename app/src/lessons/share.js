// Game 13 — Share the snacks. Topics mt_FwI7q7DSIx "Taking turns and sharing", mt_LpSuPgL31x "Division as equal sharing".
// Drag carrots from the crate to the bunnies' plates, one at a time, so everyone gets the same.
import * as T from '../three.js';
import { Lesson } from '../engine/lesson.js';
import { mesh, geo, toon } from '../engine/toon.js';
import { makeAnimal, popIn, popOut, hop, shake, setFace, wiggle } from '../engine/actors.js';
import { makeCarrot } from '../engine/farm.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';

const CRATE = new T.Vector3(0.6, 0, 4.0);
const XS = { 2: [-2.6, 3.2], 3: [-3.6, 0.6, 4.8], 4: [-4.6, -1.5, 1.8, 5.0] };
const BOWS = [0xff5a5a, 0x4a90ff, 0xffd23f, 0xa77bff];
// [bunnies, each, pre-filled (one bunny already has one)]
const PLANS = [
  [[2, 1], [2, 1], [3, 1], [2, 1], [3, 1], [3, 1]],
  [[2, 1], [3, 1], [2, 2], [2, 2], [3, 1], [3, 2]],
  [[2, 2], [3, 2, 1], [2, 3], [3, 2, 1], [4, 1], [2, 3]],
];
const ONE = ['One for you!', 'One for you!', 'And one for you!'];

function makeCrate() {
  const g = new T.Group();
  const b = mesh(geo.box(2.6, 0.9, 1.4), 0xc98b4f, { hull: 1.03, outline: 0 }); b.position.y = 0.45;
  for (const y of [0.25, 0.65]) { const s = mesh(geo.box(2.7, 0.12, 1.5), 0xa86f3a, { outline: 0 }); s.position.y = y; g.add(s); }
  const inside = mesh(geo.box(2.4, 0.05, 1.2), 0x6b4424, { outline: 0 }); inside.position.y = 0.88;
  g.add(b, inside);
  return g;
}

export default class ShareLesson extends Lesson {
  build() {
    this.plan = PLANS[this.level];
    this.pip.position.set(-7.6, 0, -1.8);
    this.crate = makeCrate(); this.crate.position.copy(CRATE); this.root.add(this.crate);
    // a few decorative carrots poking out of the crate
    for (let i = 0; i < 5; i++) { const c = makeCarrot(0.8); c.position.set(CRATE.x - 1 + i * 0.5, 0.95, CRATE.z - 0.2); c.rotation.z = Math.PI * 0.5 + (i - 2) * 0.2; c.rotation.y = 0.3; this.root.add(c); }
    this.bunnies = [];
  }

  async startRound(r) {
    this.busy = true;
    for (const b of this.bunnies) { popOut(this.s, b, 0.18).then(() => this.root.remove(b)); for (const c of b.userData.carrots) this.root.remove(c); this.root.remove(b.userData.plate); }
    const [n, each, pre] = this.plan[r];
    this.each = each;
    this.bunnies = XS[n].map((x, i) => {
      const b = makeAnimal('bunny');
      b.position.set(x, 0, -0.6);
      b.rotation.y = -x * 0.04;
      const bow = new T.Group();
      for (const s of [-1, 1]) { const l = mesh(geo.sphere(0.13, 10, 8), BOWS[i], { outline: 0.014 }); l.scale.set(1.3, 0.8, 0.6); l.position.x = s * 0.15; bow.add(l); }
      bow.position.set(0.32, 0.5, 0.35);
      b.userData.head.add(bow);
      this.root.add(b);
      popIn(this.s, b, 1, 0.4);
      const plate = mesh(geo.cyl(0.85, 0.7, 0.12, 24), 0xffffff, { outline: 0.025 });
      plate.position.set(x, 0.06, 1.0);
      this.root.add(plate);
      // dotted ghost carrots show how many each bunny will get
      b.userData = { ...b.userData, plate, carrots: [], n: 0, baseScale: 1 };
      return b;
    });
    if (pre) { const b = this.bunnies[1]; this.placeCarrot(b, true); }
    await this.wait(0.3);
    this.spawnCarrot();
    this.busy = false;
    this.cue();
  }

  spawnCarrot() {
    const c = makeCarrot(1);
    c.position.set(CRATE.x, 1.5, CRATE.z + 0.3);
    c.rotation.z = 0.3;
    c.scale.setScalar(1.25);
    this.root.add(c);
    popIn(this.s, c, 1.25, 0.3);
    this.carrot = c;
    c.userData.drag = input.addDrag(c, {
      radius: 1.0, minY: 0.5, offset: new T.Vector3(0, 0.1, 0),
      zones: () => this.bunnies.map((b) => ({ bunny: b, pos: b.userData.plate.position.clone().add(new T.Vector3(0, 0.8, -0.4)), radius: 1.5, enabled: b.userData.enabled !== false })),
      onPick: () => { this.s.tween(c.scale, { x: 1.45, y: 1.45, z: 1.45 }, 0.12); this.bunnies.forEach((b) => wiggle(this.s, b.userData.head, 0.15, 0.4)); },
      onDrop: (z) => this.drop(z),
    });
  }

  min() { return Math.min(...this.bunnies.map((b) => b.userData.n)); }
  valid() { const m = this.min(); return this.bunnies.filter((b) => b.userData.n === m); }

  placeCarrot(b, instant = false, c = null) {
    const u = b.userData, i = u.n++;
    c = c || makeCarrot(1);
    const to = new T.Vector3(u.plate.position.x + (i - (this.each - 1) / 2) * 0.45, 0.32, u.plate.position.z);
    if (instant) { c.position.copy(to); c.rotation.set(0, 0, Math.PI / 2); this.root.add(c); }
    else {
      const from = c.position.clone();
      this.s.anim(0.3, (e) => { c.position.lerpVectors(from, to, e); c.position.y += Math.sin(e * Math.PI) * 0.8; c.rotation.z = 0.3 + e * (Math.PI / 2 - 0.3); c.scale.setScalar(1.2 - e * 0.2); }, Ease.inOut)
        .then(() => { sfx.land(); });
    }
    u.carrots.push(c);
  }

  async drop(z) {
    const c = this.carrot;
    this.s.tween(c.scale, { x: 1.25, y: 1.25, z: 1.25 }, 0.12);
    const back = () => this.s.tween(c.position, { x: CRATE.x, y: 1.5, z: CRATE.z + 0.3 }, 0.35, Ease.back);
    if (!z || this.busy) { back(); sfx.land(); return; }
    const b = z.bunny;
    if (b.userData.n > this.min()) {
      // that bunny already has more: shake head, point at the friend who's waiting
      back();
      shake(this.s, b.userData.head, 0.08, 0.5);
      const wait = this.valid()[0];
      hop(this.s, wait, 0.4, 0.35);
      this.redirect(`Bunny has ${b.userData.n === 1 ? 'one' : 'some'}. Give one to this bunny!`);
      return;
    }
    input.remove(c.userData.drag);
    this.clearHints();
    this.placeCarrot(b, false, c);
    sfx.note(this.given = (this.given || 0) + 1);
    setFace(b.userData.face, 'happy');
    hop(this.s, b, 0.4, 0.35);
    fx.float(b.position.clone().add(new T.Vector3(0, 3.2, 0)), '♥', { color: '#ff5a8a', size: 6 });
    const done = this.bunnies.every((x) => x.userData.n >= this.each);
    if (!done) {
      this.say(ONE[Math.min(ONE.length - 1, this.given - 1)], { interrupt: true });
      this.idle = 0; this.ladder = 0;
      this.busy = true;
      await this.wait(0.35);
      this.busy = false;
      this.spawnCarrot();
      if (this.errorlessOn) { this.errorlessOn = false; this.unErrorless(); }
      return;
    }
    // everyone has the same: munch together
    this.busy = true;
    this.given = 0;
    input.lock(1500);
    await this.wait(0.35);
    sfx.crunch();
    this.s.wait(0.25).then(() => sfx.crunch());
    for (const x of this.bunnies) {
      hop(this.s, x, 0.5, 0.4);
      for (const cc of x.userData.carrots) this.s.tween(cc.scale, { x: 0.001, y: 0.001, z: 0.001 }, 0.35, Ease.in);
      fx.float(x.position.clone().add(new T.Vector3(0, 3.4, 0)), '♥', { color: '#ff5a8a', size: 7 });
    }
    this.busy = false;
    this.success(new T.Vector3(0.6, 3.5, 0), 'Same for everyone!');
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
    for (const b of this.bunnies) if (!ok.includes(b)) { b.userData.enabled = false; this.s.tween(b.scale, { x: 0.8, y: 0.8, z: 0.8 }, 0.3); }
  }
  unErrorless() { for (const b of this.bunnies) { b.userData.enabled = true; this.s.tween(b.scale, { x: 1, y: 1, z: 1 }, 0.3); } }

  promptText() {
    if (this.level === 0) return 'One for each bunny!';
    if (this.level === 2 && this.each === 1) return 'Everyone gets one!';
    return 'Share the carrots!';
  }

  update(dt, t) {
    // the carrot to move bobs and twinkles so it reads as "pick me up"
    const c = this.carrot;
    if (c && c.userData.drag && !input.dragging() && Math.abs(c.position.x - CRATE.x) < 0.01) c.position.y = 1.5 + Math.sin(t * 3) * 0.12;
  }

  onFinale() { this.bunnies.forEach((b, i) => this.s.wait(i * 0.2).then(() => hop(this.s, b, 0.9, 0.5))); }
}
