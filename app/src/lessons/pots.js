// Game 15 — Peekaboo pots. Topic mt_AzNSWFgtxC "Remembering visual forms".
// Chick hides under a flowerpot; remember which one. Later the pots swap places.
import * as T from '../three.js';
import { Lesson } from '../engine/lesson.js';
import { popIn, hop, wiggle, setFace, makeAnimal } from '../engine/actors.js';
import { makePot, makeChick } from '../engine/farm.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';

const XS = { 2: [-2.4, 2.6], 3: [-3.8, 0.4, 4.6], 4: [-5.0, -1.6, 1.8, 5.2] };
const POT_Z = 0.6, LIFT = 2.6;
const COLS = [0xd9774a, 0xe8915e, 0xc9663c, 0xdd8452];
// [pots, swaps, peek (a tail feather shows), frog decoy]
const PLANS = [
  [[2, 0, 1], [2, 0, 1], [2, 0, 0], [3, 0, 1], [2, 0, 0], [3, 0, 0]],
  [[3, 0, 0], [3, 1, 0], [3, 1, 0], [3, 2, 0], [3, 1, 0], [3, 2, 0]],
  [[3, 2, 0], [3, 3, 0], [4, 1, 0], [4, 2, 0], [3, 3, 0], [4, 3, 0, 1]],
];

export default class PotsLesson extends Lesson {
  build() {
    this.plan = PLANS[this.level];
    this.pip.position.set(-7.6, 0, -2.2);
    this.chick = makeChick(0.6);
    this.root.add(this.chick);
    this.chick.visible = false;
    // the peeking tail feather
    const f = makeChick(0.001).userData.body; // reuse the chick's yellow
    this.tail = new T.Group();
    for (const [x, rz] of [[-0.12, 0.5], [0, 0], [0.12, -0.5]]) {
      const fe = new T.Mesh(new T.ConeGeometry(0.13, 0.6, 8), f.material);
      fe.position.set(x, 0.25, 0); fe.rotation.z = rz;
      this.tail.add(fe);
    }
    this.tail.rotation.x = 0.5;
    this.root.add(this.tail);
    this.tail.visible = false;
    this.pots = [];
  }

  async startRound(r) {
    this.busy = true;
    for (const p of this.pots) { input.remove(p.userData.tap); this.root.remove(p); }
    if (this.frog) { this.root.remove(this.frog); this.frog = null; }
    const [n, swaps, peek, frog] = this.plan[r];
    const xs = XS[n];
    this.pots = xs.map((x, i) => {
      const p = makePot(COLS[i % COLS.length]);
      p.position.set(x, LIFT, POT_Z);
      p.userData.slot = i;
      this.root.add(p);
      popIn(this.s, p, 1, 0.35);
      p.userData.tap = input.addTap(p, { radius: 1.3, offset: new T.Vector3(0, 0.9, 0), onTap: () => this.tapPot(p) });
      p.userData.tap.enabled = false;
      return p;
    });
    // choose a hiding pot (not the same as last time if possible)
    let h;
    do { h = Math.floor(Math.random() * n); } while (n > 1 && h === this.lastHide && Math.random() < 0.8);
    this.lastHide = h;
    this.hidePot = this.pots[h];
    // chick runs in and hops under it
    const c = this.chick;
    c.visible = true;
    c.position.set(0.4, 0, 3.4);
    c.rotation.set(0, 0, 0);
    await popIn(this.s, c, 0.6, 0.3);
    sfx.cheep();
    const to = this.hidePot.position.clone().setY(0);
    const from = c.position.clone();
    await this.s.anim(0.45, (e) => { c.position.lerpVectors(from, to, e); c.position.y = Math.abs(Math.sin(e * Math.PI * 2)) * 0.5; }, Ease.inOut);
    sfx.cheep();
    wiggle(this.s, c, 0.3, 0.35);
    if (frog) {
      const o = this.pots.find((p) => p !== this.hidePot);
      this.frog = makeAnimal('frog'); this.frog.scale.setScalar(0.5); this.frog.userData.baseScale = 0.5;
      this.frog.position.copy(o.position).setY(0); this.frog.userData.pot = o;
      this.root.add(this.frog); popIn(this.s, this.frog, 0.5, 0.3); sfx.ribbit();
    }
    await this.wait(0.3);
    // pots drop down: thunk!
    for (const [i, p] of this.pots.entries()) this.s.wait(i * 0.06).then(() => this.s.tween(p.position, { y: 0 }, 0.28, Ease.in).then(() => { sfx.thunk(); this.squash(p); }));
    await this.wait(0.4 + n * 0.06);
    c.visible = false;
    if (this.frog) this.frog.visible = false;
    this.peek = !!peek;
    this.placeTail();
    // shuffle
    if (swaps) {
      this.say('Watch!', { max: 0.6 });
      await this.wait(0.35);
      for (let k = 0; k < swaps; k++) {
        let a = Math.floor(Math.random() * n), b = (a + 1 + Math.floor(Math.random() * (n - 1))) % n;
        if (k === 0 && Math.random() < 0.7) { a = this.pots.indexOf(this.hidePot); b = (a + 1 + Math.floor(Math.random() * (n - 1))) % n; }
        await this.swap(this.pots[a], this.pots[b], this.level === 2 ? 0.45 : 0.55);
      }
    }
    for (const p of this.pots) p.userData.tap.enabled = true;
    await this.wait(0.15);
    this.busy = false;
    this.cue();
  }

  placeTail() {
    this.tail.visible = this.peek;
    const p = this.hidePot.position;
    this.tail.position.set(p.x + 0.7, 0.05, p.z + 1.05);
  }

  squash(p) { this.s.anim(0.22, (_, q) => { const k = 1 - Math.sin(q * Math.PI) * 0.12; p.scale.set(1 / Math.sqrt(k), k, 1 / Math.sqrt(k)); }).then(() => p.scale.setScalar(1)); }

  async swap(a, b, dur) {
    const pa = a.position.clone(), pb = b.position.clone();
    const mid = (pa.x + pb.x) / 2, r = Math.abs(pa.x - pb.x) / 2;
    sfx.swoosh();
    await this.s.anim(dur, (e) => {
      const ang = e * Math.PI;
      a.position.set(mid + (pa.x < pb.x ? -1 : 1) * Math.cos(ang) * r, 0, POT_Z + Math.sin(ang) * 1.3);
      b.position.set(mid + (pa.x < pb.x ? 1 : -1) * Math.cos(ang) * r, 0, POT_Z - Math.sin(ang) * 1.3);
    }, Ease.inOut);
    a.position.set(pb.x, 0, POT_Z); b.position.set(pa.x, 0, POT_Z);
    const i = this.pots.indexOf(a), j = this.pots.indexOf(b);
    this.pots[i] = b; this.pots[j] = a;
    sfx.thunk();
    this.squash(a); this.squash(b);
    this.placeTail();
  }

  promptText() { return this.plan[this.round]?.[1] ? "Where's Chick now?" : "Where's Chick?"; }

  async lift(p, up = true) {
    await this.s.tween(p.position, { y: up ? 2.2 : 0 }, up ? 0.25 : 0.22, up ? Ease.out : Ease.in);
    if (!up) { sfx.thunk(); this.squash(p); }
  }

  async tapPot(p) {
    if (this.busy) return;
    this.busy = true;
    sfx.pick();
    const isChick = p === this.hidePot;
    if (!isChick) {
      input.lock(900);
      const frog = this.frog && this.frog.userData.pot === p;
      await this.lift(p);
      if (frog) { this.frog.visible = true; sfx.ribbit(); hop(this.s, this.frog, 0.5); }
      this.busy = false;
      this.redirect(frog ? "That's Frog! Where's Chick?" : 'Not there! Try again!');
      this.busy = true;
      await this.wait(0.5);
      if (frog) this.frog.visible = false;
      await this.lift(p, false);
      this.busy = false;
      return;
    }
    input.lock(1500);
    this.clearHints();
    this.tail.visible = false;
    // the pot flips up and away; Chick jumps out
    const c = this.chick;
    c.position.copy(p.position).setY(0);
    c.visible = true;
    sfx.swoosh();
    this.s.tween(p.position, { y: 4.2, z: POT_Z - 1.5 }, 0.4, Ease.out);
    this.s.tween(p.rotation, { x: -1.2 }, 0.4, Ease.out);
    await this.wait(0.12);
    sfx.cheep();
    this.s.wait(0.2).then(() => sfx.cheep());
    hop(this.s, c, 1.1, 0.45, { sound: true });
    setFace(c.userData.face, 'happy');
    fx.confetti(c.position.clone().add(new T.Vector3(0, 1, 0)), 25);
    this.busy = false;
    this.success(c.position.clone().add(new T.Vector3(0, 1.6, 0)), 'Peekaboo!');
  }

  async afterSuccess() {
    const p = this.hidePot;
    this.s.tween(p.position, { y: 0, z: POT_Z }, 0.25, Ease.in);
    this.s.tween(p.rotation, { x: 0 }, 0.25);
    this.s.tween(this.chick.scale, { x: 0.001, y: 0.001, z: 0.001 }, 0.2, Ease.in);
    for (const q of this.pots) this.s.tween(q.scale, { x: 0.001, y: 0.001, z: 0.001 }, 0.22, Ease.in);
    await this.wait(0.22);
  }

  center(p) { return p.position.clone().add(new T.Vector3(0, 1.0, 0.5)); }
  showHint(glow = true) {
    if (glow) { this.addHalo(this.hidePot, 1.4); wiggle(this.s, this.hidePot, 0.12, 0.5); sfx.cheep(); }
    fx.ghostPath([this.center(this.hidePot)], { mode: 'tap' });
  }
  // only Level 1's first cue points at the pot; from Level 2 the cue scans so the game stays a memory game
  demoL3() { fx.ghostPath(this.pots.map((p) => this.center(p)), { mode: 'scan' }); }
  playDemo() {
    this.demoing = true;
    input.lock(2500);
    if (this.level >= 1) this.demoL3(); else this.showHint(false);
    this.s.wait(2.5).then(() => { fx.clearHands(); this.demoing = false; this.idle = 0; });
  }
  makeErrorless() {
    for (const p of this.pots) if (p !== this.hidePot) { p.userData.tap.enabled = false; this.s.tween(p.scale, { x: 0.8, y: 0.8, z: 0.8 }, 0.3); }
    this.peek = true; this.placeTail();
    this.stopPeep = this.s.every(2, () => { if (!this.busy) { wiggle(this.s, this.hidePot, 0.1, 0.4); sfx.cheep(); } });
  }
  nextRound() { if (this.stopPeep) { this.stopPeep(); this.stopPeep = null; } super.nextRound(); }

  onFinale() {
    const c = this.chick;
    c.scale.setScalar(0.6); c.visible = true; c.position.set(0.4, 0, 2);
    this.s.anim(2, (_, p) => { c.position.x = 0.4 + Math.sin(p * Math.PI * 4) * 3; c.position.y = Math.abs(Math.sin(p * Math.PI * 10)) * 0.4; });
  }
}
