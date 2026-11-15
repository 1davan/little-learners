// Game 15 — Peekaboo pots. Topic mt_AzNSWFgtxC "Remembering visual forms".
// A friend hides under one of the pots; remember which one. Later the pots swap places.
// Each round a different friend (Chick, Piglet, Kitten) hides under different things (flowerpots, hay bales,
// buckets, boxes). The wrong ones hide silly surprises; the right one gets a "peekaboo!" and a jump into Pip's arms.
// (The hiding places are still called pots in the code and in the test hooks.)
import * as T from '../three.js';
import { Lesson, shuffle } from '../engine/lesson.js';
import { popIn, popOut, hop, wiggle, setFace } from '../engine/actors.js';
import { disposeTree } from '../engine/toon.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';
import { makeCover, COVER_SFX, HIDERS, makeHider, makePeek, GAGS, makeGag, gagShow } from './pots-props.js';

const XS = { 2: [-2.4, 2.6], 3: [-3.8, 0.4, 4.6], 4: [-5.0, -1.6, 1.8, 5.2] };
const POT_Z = 0.6, LIFT = 2.6;
// [pots, swaps, peek (a tail peeks out), frog decoy]
const PLANS = [
  [[2, 0, 1], [2, 0, 1], [2, 0, 0], [3, 0, 1], [2, 0, 0], [3, 0, 0]],
  [[3, 0, 0], [3, 1, 0], [3, 1, 0], [3, 2, 0], [3, 1, 0], [3, 2, 0]],
  [[3, 2, 0], [3, 3, 0], [4, 1, 0], [4, 2, 0], [3, 3, 0], [4, 3, 0, 1]],
];
// [who hides, under what] for each round
const THEMES = [
  [['chick', 'pot'], ['piglet', 'hay'], ['kitten', 'bucket'], ['chick', 'box'], ['piglet', 'pot'], ['kitten', 'hay']],
  [['kitten', 'pot'], ['chick', 'hay'], ['piglet', 'box'], ['kitten', 'bucket'], ['chick', 'pot'], ['piglet', 'hay']],
  [['piglet', 'pot'], ['kitten', 'box'], ['chick', 'bucket'], ['piglet', 'hay'], ['kitten', 'pot'], ['chick', 'box']],
];
const GAG_KINDS = ['worm', 'sock', 'snail', 'frog'];

export default class PotsLesson extends Lesson {
  build() {
    this.plan = PLANS[this.level];
    this.themes = THEMES[this.level];
    this.pip.position.set(-7.6, 0, -2.2);
    this.pots = [];
    this.gags = [];
    this.gagI = Math.floor(Math.random() * GAG_KINDS.length);
  }

  clearRound() {
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
    const [who, cover] = this.themes[r];
    this.who = who;
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
      const g = makeGag(GAG_KINDS[this.gagI++ % GAG_KINDS.length]);
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
    // down they come: thunk!
    for (const [i, p] of this.pots.entries()) this.s.wait(i * 0.06).then(() => this.s.tween(p.position, { y: 0 }, 0.26, Ease.in).then(() => { sfx[COVER_SFX[cover]](); this.squash(p); }));
    await this.wait(0.32 + n * 0.06);
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
    await this.s.tween(p.position, { y: up ? 2.2 : 0 }, up ? 0.22 : 0.2, up ? Ease.out : Ease.in);
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
        if (g.userData.gag === 'frog') hop(this.s, g, 0.6);
        else gagShow(this.s, g);
      });
      await this.lift(p);
      // Pip giggles at it
      sfx.giggle();
      wiggle(this.s, this.pip, 0.2, 0.5);
      this.busy = false;
      this.redirect(`${g ? GAGS[g.userData.gag].line : 'Not there!'} Where's ${this.name()}?`);
      this.busy = true;
      await this.wait(0.45);
      if (g) await popOut(this.s, g, 0.15);
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
    sfx.swoosh();
    this.s.tween(p.position, { y: 4.2, z: POT_Z - 1.5 }, 0.4, Ease.out);
    this.s.tween(p.rotation, { x: -1.2 }, 0.4, Ease.out);
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

  async jumpToPip(c) {
    const pip = this.pip, s = this.s;
    const from = c.position.clone();
    const to = pip.position.clone().add(new T.Vector3(0.45, 0.35, 0.95));
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
    const p = this.hidePot;
    this.s.tween(p.position, { y: 0, z: POT_Z }, 0.22, Ease.in);
    this.s.tween(p.rotation, { x: 0 }, 0.22);
    if (this.chick) this.s.tween(this.chick.scale, { x: 0.001, y: 0.001, z: 0.001 }, 0.2, Ease.in);
    for (const q of this.pots) this.s.tween(q.scale, { x: 0.001, y: 0.001, z: 0.001 }, 0.2, Ease.in);
    await this.wait(0.2);
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
