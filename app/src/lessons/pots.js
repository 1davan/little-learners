// Game 15 — Peekaboo pots. Topic mt_AzNSWFgtxC "Remembering visual forms".
// A friend hides under one of the pots; remember which one. Later the pots swap places.
// Each round a different friend (Chick, Piglet, Kitten) hides under different things (flowerpots, hay bales,
// buckets, boxes). The wrong ones hide silly surprises; the right one gets a "peekaboo!" and a jump into Pip's arms.
// (The hiding places are still called pots in the code and in the test hooks.)
// Each level is a different place with its own hiding things and friends: a garden bed (flowerpots, baskets, buckets),
// a straw farmyard pen (hay, boxes, buckets) and a vegetable patch with a scarecrow (pumpkins, barrels, baskets).
// The hiding things drop in with real physics, and the right one is flung off and tumbles away.
import * as T from '../three.js';
import { Lesson, shuffle } from '../engine/lesson.js';
import { popIn, popOut, hop, wiggle, setFace } from '../engine/actors.js';
import { disposeTree } from '../engine/toon.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';
import { physics } from '../engine/physics.js';
import { setCamera } from '../engine/stage.js';
import { makeCover, COVER_SFX, COVER_SIZE, HIDERS, makeHider, makePeek, GAGS, makeGag, gagShow, makeSet } from './pots-props.js';

const XS = { 2: [-2.2, 2.4], 3: [-3.5, 0.3, 4.1], 4: [-4.6, -1.5, 1.6, 4.7] };
const POT_Z = 1.0, LIFT = 2.6;      // brought forward: big, and the ground in front is used
// [pots, swaps, peek (a tail peeks out), frog decoy]
const PLANS = [
  [[2, 0, 1], [2, 0, 1], [2, 0, 0], [3, 0, 1], [2, 0, 0], [3, 0, 0]],
  [[3, 0, 0], [3, 1, 0], [3, 1, 0], [3, 2, 0], [3, 1, 0], [3, 2, 0]],
  [[3, 2, 0], [3, 3, 0], [4, 1, 0], [4, 2, 0], [3, 3, 0], [4, 3, 0, 1]],
];
// [who hides, under what] for each round
// [who hides, under what, how the right one flies off] for each round. Each level has its own place, friends and things.
const THEMES = [
  [['chick', 'pot', 'flip'], ['bunny', 'basket', 'fling'], ['piglet', 'bucket', 'pop'], ['chick', 'basket', 'fling'], ['bunny', 'pot', 'pop'], ['piglet', 'bucket', 'flip']],
  [['kitten', 'hay', 'fling'], ['piglet', 'box', 'flip'], ['chick', 'bucket', 'pop'], ['kitten', 'box', 'fling'], ['piglet', 'hay', 'pop'], ['chick', 'bucket', 'flip']],
  [['hedgehog', 'pumpkin', 'pop'], ['bunny', 'barrel', 'fling'], ['kitten', 'basket', 'flip'], ['hedgehog', 'barrel', 'pop'], ['chick', 'pumpkin', 'fling'], ['bunny', 'basket', 'flip']],
];
// the silly surprises under the wrong ones, per level
const GAG_KINDS = [['ball', 'worm', 'sock', 'snail'], ['sock', 'ball', 'frog', 'worm'], ['snail', 'ball', 'worm', 'sock', 'frog']];

export default class PotsLesson extends Lesson {
  build() {
    this.plan = PLANS[this.level];
    this.themes = THEMES[this.level];
    // closer in: the hiding things are big and the ground in front is used
    setCamera(new T.Vector3(0, 3.3, 11.8), new T.Vector3(0, 2.4, 0));
    this.pip.position.set(-7.0, 0, -2.4);
    this.pots = [];
    this.gags = [];
    this.gagKinds = GAG_KINDS[this.level];
    this.gagI = Math.floor(Math.random() * this.gagKinds.length);
    this.set = makeSet(this.level);
    this.root.add(this.set);
  }

  nudgeTarget() { const p = this.hidePot; return p && p.userData.tap?.enabled && !this.busy ? p : null; }

  clearRound() {
    // (no physics.clear(): every body leaves the physics world on its own, so nothing ever freezes mid-air)
    for (const b of this.flyBoxes || []) physics.removeStatic(b);
    this.flyBoxes = [];
    for (const p of this.pots) physics.remove(p);
    for (const g of this.gags) physics.remove(g);
    for (const p of this.pots) { input.remove(p.userData.tap); this.root.remove(p); disposeTree(p); }
    for (const g of this.gags) { this.root.remove(g); disposeTree(g); }
    this.gags = [];
    if (this.frog) { this.root.remove(this.frog); disposeTree(this.frog); this.frog = null; }
    for (const o of [this.chick, this.tail]) if (o) { o.parent && o.parent.remove(o); disposeTree(o); }
    this.chick = this.tail = null;
  }

  async startRound(r) {
    this.busy = true;
    this.clearRound();
    const [n, swaps, peek, frog] = this.plan[r];
    const [who, cover, fly] = this.themes[r];
    this.who = who;
    this.fly = fly;
    this.coverKind = cover;
    const xs = XS[n];
    this.pots = xs.map((x, i) => {
      const p = makeCover(cover, i);
      p.position.set(x, LIFT, POT_Z);
      p.userData.slot = i;
      this.root.add(p);
      p.scale.setScalar(0.001);
      this.s.wait(i * 0.06).then(() => popIn(this.s, p, 1, 0.35, { sound: i === 0 }));
      p.userData.tap = input.addTap(p, { radius: 1.3, offset: new T.Vector3(0, 0.9, 0), onTap: () => this.tapPot(p) });
      p.userData.tap.enabled = false;
      return p;
    });
    // choose a hiding place (not the same as last time if possible)
    let h;
    do { h = Math.floor(Math.random() * n); } while (n > 1 && h === this.lastHide && Math.random() < 0.8);
    this.lastHide = h;
    this.hidePot = this.pots[h];
    // the friend and the bit of them that peeks out
    const c = (this.chick = makeHider(who));
    this.root.add(c);
    c.visible = false;
    this.tail = makePeek(who);
    this.tail.visible = false;
    this.root.add(this.tail);
    // something silly under each of the others
    for (const p of this.pots) {
      if (p === this.hidePot) continue;
      const g = makeGag(this.gagKinds[this.gagI++ % this.gagKinds.length]);
      g.visible = false;
      this.root.add(g);
      p.userData.gag = g;
      this.gags.push(g);
    }
    // the friend runs in, says hello and hops under it
    const call = () => sfx[HIDERS[who].call]?.();
    c.position.set(0.4, 0, 3.6);
    c.rotation.set(0, 0, 0);
    await popIn(this.s, c, c.userData.baseScale, 0.3, { sound: false });
    call();
    if (c.userData.face) setFace(c.userData.face, 'happy');
    const to = this.hidePot.position.clone().setY(0);
    const from = c.position.clone();
    c.rotation.y = Math.atan2(to.x - from.x, to.z - from.z) * 0.6;
    const hops = who === 'kitten' ? 1 : who === 'piglet' ? 3 : 2;
    await this.s.anim(0.45, (e) => { c.position.lerpVectors(from, to, e); c.position.y = Math.abs(Math.sin(e * Math.PI * hops)) * (who === 'kitten' ? 0.9 : 0.5); }, Ease.inOut);
    c.rotation.y = 0;
    call();
    wiggle(this.s, c, 0.3, 0.35);
    if (frog) {
      const o = this.pots.find((p) => p !== this.hidePot);
      // the frog decoy: Frog hides too, under a different one
      const g = o.userData.gag;
      if (g) { this.root.remove(g); this.gags = this.gags.filter((x) => x !== g); disposeTree(g); }
      this.frog = makeGag('frog');
      this.frog.position.copy(o.position).setY(0); this.frog.userData.pot = o;
      o.userData.gag = this.frog;
      this.root.add(this.frog); popIn(this.s, this.frog, 0.5, 0.3); sfx.ribbit();
    }
    await this.wait(0.2);
    // down they come with real physics: they drop, bounce and settle (thunk!)
    const [sx, sy, sz] = COVER_SIZE[cover] || [2.4, 1.8, 2.2];
    for (const [i, p] of this.pots.entries()) this.s.wait(i * 0.06).then(() => {
      physics.add(p, { shape: 'box', size: { x: sx, y: sy, z: sz }, spin: false, bounce: 0.05, friction: 1, mass: 3 });
      physics.impulse(p, { x: 0, y: -7, z: 0 });
      this.s.wait(0.2).then(() => { sfx[COVER_SFX[cover]](); this.squash(p); });
    });
    await this.wait(0.62 + n * 0.06);
    // settled: back under our control, exactly in its slot
    for (const [i, p] of this.pots.entries()) { physics.remove(p); p.position.set(xs[i], 0, POT_Z); p.rotation.set(0, 0, 0); }
    c.visible = false;
    if (this.frog) this.frog.visible = false;
    this.peek = !!peek;
    this.placeTail();
    // shuffle
    if (swaps) {
      this.say('Watch!', { max: 0.6 });
      await this.wait(0.3);
      for (let k = 0; k < swaps; k++) {
        let a = Math.floor(Math.random() * n), b = (a + 1 + Math.floor(Math.random() * (n - 1))) % n;
        if (k === 0 && Math.random() < 0.7) { a = this.pots.indexOf(this.hidePot); b = (a + 1 + Math.floor(Math.random() * (n - 1))) % n; }
        await this.swap(this.pots[a], this.pots[b], this.level === 2 ? 0.45 : 0.55);
      }
    }
    for (const p of this.pots) p.userData.tap.enabled = true;
    await this.wait(0.1);
    this.busy = false;
    this.cue();
  }

  placeTail() {
    if (!this.tail) return;
    this.tail.visible = this.peek;
    const p = this.hidePot.position;
    this.tail.position.set(p.x + 0.75, 0.05, p.z + 1.05);
  }

  squash(p) { this.s.anim(0.22, (_, q) => { const k = 1 - Math.sin(q * Math.PI) * 0.12; p.scale.set(1 / Math.sqrt(k), k, 1 / Math.sqrt(k)); }).then(() => p.scale.setScalar(1)); }

  async swap(a, b, dur) {
    const pa = a.position.clone(), pb = b.position.clone();
    const mid = (pa.x + pb.x) / 2, r = Math.abs(pa.x - pb.x) / 2;
    sfx.swoosh();
    if (this.tail) this.tail.visible = false;
    await this.s.anim(dur, (e) => {
      const ang = e * Math.PI;
      a.position.set(mid + (pa.x < pb.x ? -1 : 1) * Math.cos(ang) * r, Math.sin(ang) * 0.3, POT_Z + Math.sin(ang) * 1.3);
      b.position.set(mid + (pa.x < pb.x ? 1 : -1) * Math.cos(ang) * r, 0, POT_Z - Math.sin(ang) * 1.3);
      a.rotation.z = Math.sin(ang * 2) * 0.08; b.rotation.z = -Math.sin(ang * 2) * 0.08;
    }, Ease.inOut);
    a.position.set(pb.x, 0, POT_Z); b.position.set(pa.x, 0, POT_Z);
    a.rotation.z = b.rotation.z = 0;
    const i = this.pots.indexOf(a), j = this.pots.indexOf(b);
    this.pots[i] = b; this.pots[j] = a;
    sfx.thunk();
    this.squash(a); this.squash(b);
    this.placeTail();
  }

  name() { return HIDERS[this.who]?.name || 'Chick'; }
  promptText() { return this.plan[this.round]?.[1] ? `Where's ${this.name()} now?` : `Where's ${this.name()}?`; }

  async lift(p, up = true) {
    // (lifted clear above Pip's head, so a cover on the far left never hides Pip)
    await this.s.tween(p.position, { y: up ? (p.position.x < -3 ? 2.85 : 2.3) : 0 }, up ? 0.22 : 0.2, up ? Ease.out : Ease.in);
    if (!up) { sfx[COVER_SFX[this.coverKind]](); this.squash(p); }
  }

  async tapPot(p) {
    if (this.busy) return;
    this.busy = true;
    sfx.pick();
    const isChick = p === this.hidePot;
    if (!isChick) {
      // a silly surprise underneath
      input.lock(900);
      const g = p.userData.gag;
      if (g) { g.position.copy(p.position).setY(0); g.rotation.y = g.userData.gag === 'sock' ? 0.9 : 0; }
      this.s.wait(0.08).then(() => {
        if (!g) return;
        popIn(this.s, g, g.userData.baseScale, 0.3, { sound: false });
        sfx[GAGS[g.userData.gag].sfx]?.();
        const ph = GAGS[g.userData.gag].phys;
        if (g.userData.gag === 'frog') hop(this.s, g, 0.6);
        else if (ph) {
          // a ball bounces off, a sock flips over: real physics
          g.position.y = 0.05;
          physics.add(g, { ...ph, mass: 0.5 });
          physics.impulse(g, { x: (Math.random() - 0.5) * 2.5, y: 6.5, z: 1.6 }, { x: 0.4, y: 0.6, z: 0.3 });
        } else gagShow(this.s, g);
      });
      await this.lift(p);
      // Pip giggles at it
      sfx.giggle();
      wiggle(this.s, this.pip, 0.2, 0.5);
      this.busy = false;
      const gl = g ? GAGS[g.userData.gag].line : 'Not there!', full = `${gl} Where's ${this.name()}?`;
      this.redirect(full.length <= 30 ? full : gl);   // one line
      this.busy = true;
      await this.wait(0.45);
      if (g) { physics.remove(g); await popOut(this.s, g, 0.15); g.rotation.set(0, g.userData.gag === 'sock' ? 0.9 : 0, 0); }
      await this.lift(p, false);
      this.busy = false;
      return;
    }
    input.lock(1500);
    this.clearHints();
    this.tail.visible = false;
    // peekaboo! the pot flips up and away, the friend pops up surprised, then jumps into Pip's arms
    const c = this.chick, u = c.userData;
    c.position.copy(p.position).setY(0);
    c.visible = true;
    this.flyOff(p);
    if (u.face) setFace(u.face, 'scared');
    await this.wait(0.1);
    sfx[HIDERS[this.who].call]?.();
    hop(this.s, c, 0.8, 0.35);
    fx.confetti(c.position.clone().add(new T.Vector3(0, 1, 0)), 25);
    this.busy = false;
    this.success(c.position.clone().add(new T.Vector3(0, 1.6, 0)), 'Peekaboo!');
    await this.wait(0.3);
    if (this.dead) return;
    if (u.face) setFace(u.face, 'happy');
    this.jumpToPip(c);
  }

  // the hiding place is thrown off with real physics, a different way each round, and tumbles on the grass
  flyOff(p) {
    const [sx, sy, sz] = COVER_SIZE[this.coverKind] || [2.4, 1.8, 2.2];
    const side = p.position.x > 0 ? 1 : -1;
    sfx.whoosh();
    // the others become solid for a moment, so the flying one bounces off them
    this.flyBoxes = this.pots.filter((q) => q !== p).map((q) => physics.box(new T.Vector3(q.position.x, sy / 2, q.position.z), new T.Vector3(sx * 0.9, sy, sz * 0.9)));
    // Pip (and the scarecrow on Level 3) are solid too, so a flung cover bounces off them instead of landing inside them
    const pp = this.pip.position;
    this.flyBoxes.push(physics.box(new T.Vector3(pp.x, 1.3, pp.z), new T.Vector3(1.9, 2.6, 1.6)));
    if (this.level === 2) this.flyBoxes.push(physics.box(new T.Vector3(8.4, 1.9, -2.6), new T.Vector3(2.6, 3.8, 1.0)));
    physics.add(p, { shape: 'box', size: { x: sx * 0.9, y: sy, z: sz * 0.9 }, bounce: 0.35, friction: 0.8, mass: 2 });
    if (this.fly === 'pop') {
      // straight up like a cork, spinning, and back down beside the friend
      physics.impulse(p, { x: side * 1.2, y: 11, z: -1.0 }, { x: 0, y: 2.5, z: side * 0.8 });
      sfx.pop();
    } else if (this.fly === 'fling') {
      // tossed sideways, cartwheeling away
      physics.impulse(p, { x: side * 6.5, y: 7, z: -1.5 }, { x: 0, y: 0, z: -side * 3.5 });
    } else {
      // flipped backwards head over heels
      physics.impulse(p, { x: 0, y: 8.5, z: -4.5 }, { x: -4, y: 0, z: 0 });
    }
  }

  async jumpToPip(c) {
    const pip = this.pip, s = this.s;
    const from = c.position.clone();
    const to = pip.position.clone().add(new T.Vector3(0.4, 0.3, 1.25)); // held in front of Pip's tummy, not inside it
    const h = 2.6;
    sfx.boing2();
    const ry0 = c.rotation.y;
    await s.anim(0.42, (e) => {
      c.position.lerpVectors(from, to, e);
      c.position.y += Math.sin(e * Math.PI) * h;
      c.rotation.y = ry0 + Math.sin(e * Math.PI) * 0.8;
    }, Ease.inOut);
    if (this.dead) return;
    c.rotation.y = 0.3;
    // the hug: Pip's wings wrap round, both squish, hearts
    pip.attach(c);
    sfx.giggle();
    setFace(pip.userData.face, 'happy');
    const w = pip.userData.wings, r0 = w.map((x) => x.rotation.z);
    s.anim(0.5, (_, p) => w.forEach((x, i) => (x.rotation.z = r0[i] + (i ? -1 : 1) * Math.sin(p * Math.PI) * 0.9))).then(() => w.forEach((x, i) => (x.rotation.z = r0[i])));
    const b = c.scale.x;
    s.anim(0.3, (_, p) => { const q = 1 - Math.sin(p * Math.PI) * 0.2; c.scale.set(b / Math.sqrt(q), b * q, b / Math.sqrt(q)); }).then(() => c.scale.setScalar(b));
    fx.float(to.clone().add(new T.Vector3(0, 1.4, 0)), '♥', { color: '#ff5a8a', size: 8 });
  }

  async afterSuccess() {
    // everything shrinks away together (the flung one keeps tumbling while it shrinks, then leaves the physics world)
    if (this.chick) this.s.tween(this.chick.scale, { x: 0.001, y: 0.001, z: 0.001 }, 0.2, Ease.in);
    for (const q of this.pots) this.s.tween(q.scale, { x: 0.001, y: 0.001, z: 0.001 }, 0.2, Ease.in);
    await this.wait(0.2);
    physics.remove(this.hidePot);
  }

  center(p) { return p.position.clone().add(new T.Vector3(0, 1.0, 0.5)); }
  showHint(glow = true) {
    if (glow) { this.addHalo(this.hidePot, 1.4); wiggle(this.s, this.hidePot, 0.12, 0.5); sfx[HIDERS[this.who].call]?.(); }
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
    this.stopPeep = this.s.every(2, () => { if (!this.busy) { wiggle(this.s, this.hidePot, 0.1, 0.4); sfx[HIDERS[this.who].call]?.(); } });
  }
  nextRound() { if (this.stopPeep) { this.stopPeep(); this.stopPeep = null; } super.nextRound(); }

  onFinale() {
    // everyone who hid today comes out to play
    const kinds = shuffle(Object.keys(HIDERS));
    kinds.forEach((k, i) => {
      const c = makeHider(k);
      const b = c.userData.baseScale;
      this.root.add(c);
      c.position.set(-2 + i * 2.4, 0, 2);
      popIn(this.s, c, b, 0.35, { sound: false });
      this.s.wait(0.2 + i * 0.25).then(() => sfx[HIDERS[k].call]?.());
      this.s.anim(2, (_, p) => { c.position.x = -2 + i * 2.4 + Math.sin(p * Math.PI * 4 + i) * 1.2; c.position.y = Math.abs(Math.sin(p * Math.PI * 10 + i)) * 0.4; });
    });
  }
}
