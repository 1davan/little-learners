// Game 15 — Peekaboo pots. Topic mt_AzNSWFgtxC "Remembering visual forms".
// A friend hides under one of the covers; remember which one. Later the covers swap places.
// Each round a different friend (Chick, Piglet, Kitten…) hides under different things (flowerpots, hay bales,
// buckets, boxes). The wrong ones hide silly surprises; the right one gets a "peekaboo!" and a jump into Pip's arms.
// (The hiding places are still called pots in the code and in the test hooks.)
// Each level is a different place with its own hiding things and friends: a garden bed (flowerpots, baskets, buckets),
// a straw farmyard pen (hay, boxes, buckets) and a vegetable patch with a scarecrow (pumpkins, barrels, baskets).
//
// Mechanics are calm and fully tweened (no physics): covers sit on the ground, one lifts straight up, the friend walks
// under it and it sets back down. Swaps are always between neighbours: one slides round the front, the other round the
// back, so they never pass through each other or anything else. A tap lifts a cover straight up for a peek and sets it
// back down; under the right one the friend hops out, cheers and jumps to Pip.
import * as T from '../three.js';
import { Lesson, shuffle } from '../engine/lesson.js';
import { popIn, popOut, hop, wiggle, setFace } from '../engine/actors.js';
import { disposeTree } from '../engine/toon.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';
import { setCamera } from '../engine/stage.js';
import { makeCover, COVER_SFX, HIDERS, makeHider, makePeek, GAGS, makeGag, gagShow, makeSet } from './pots-props.js';

const XS = { 2: [-1.9, 2.5], 3: [-3.1, 0.6, 4.3] }; // (the left one, lifted, stays clear of Pip)
const POT_Z = 0.7;     // the row of covers
const LIFT = 2.4;      // how high a cover lifts (well clear of the tallest friend, 1.5)
const SWAP_Z = 1.45;   // a swap: one cover goes round the front, the other round the back (covers are ~2.6 across)
const FRONT_Z = 3.4;   // where the friend appears: on the grass right in front of its cover
// [covers, swaps, peek (a tail peeks out), frog decoy]
const PLANS = [
  [[2, 0, 1], [2, 0, 1], [2, 0, 0], [3, 0, 1], [2, 0, 0], [3, 0, 0]],
  [[3, 0, 0], [3, 1, 0], [3, 1, 0], [3, 2, 0], [3, 1, 0], [3, 2, 0]],
  [[3, 2, 0], [3, 3, 0], [3, 2, 0], [3, 3, 0], [3, 3, 0], [3, 3, 0, 1]],
];
const SWAP_DUR = [0.8, 0.8, 0.6]; // seconds per swap (Level 3: a bit faster)
// [who hides, under what] for each round. Each level has its own place, friends and things.
const THEMES = [
  [['chick', 'pot'], ['bunny', 'basket'], ['piglet', 'bucket'], ['chick', 'basket'], ['bunny', 'pot'], ['piglet', 'bucket']],
  [['kitten', 'hay'], ['piglet', 'box'], ['chick', 'bucket'], ['kitten', 'box'], ['piglet', 'hay'], ['chick', 'bucket']],
  [['hedgehog', 'pumpkin'], ['bunny', 'barrel'], ['kitten', 'basket'], ['hedgehog', 'barrel'], ['chick', 'pumpkin'], ['bunny', 'basket']],
];
// the silly surprises under the wrong ones, per level
const GAG_KINDS = [['ball', 'worm', 'sock', 'snail'], ['sock', 'ball', 'frog', 'worm'], ['snail', 'ball', 'worm', 'sock', 'frog']];
const smooth = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };

export default class PotsLesson extends Lesson {
  build() {
    this.plan = PLANS[this.level];
    this.themes = THEMES[this.level];
    setCamera(new T.Vector3(0, 3.6, 12.4), new T.Vector3(0, 2.1, 0));
    this.pip.position.set(-7.2, 0, -2.6);
    this.pots = [];
    this.gags = [];
    this.gagKinds = GAG_KINDS[this.level];
    this.gagI = Math.floor(Math.random() * this.gagKinds.length);
    this.set = makeSet(this.level);
    this.root.add(this.set);
  }

  nudgeTarget() { const p = this.hidePot; return p && p.userData.tap?.enabled && !this.busy ? p : null; }

  clearRound() {
    for (const p of this.pots) { input.remove(p.userData.tap); this.root.remove(p); disposeTree(p); }
    for (const g of this.gags) { g.parent && g.parent.remove(g); disposeTree(g); }
    this.pots = [];
    this.gags = [];
    for (const o of [this.chick, this.tail]) if (o) { o.parent && o.parent.remove(o); disposeTree(o); }
    this.chick = this.tail = this.frog = null;
  }

  async startRound(r) {
    this.busy = true;
    this.clearRound();
    const [n, swaps, peek, frog] = this.plan[r];
    const [who, cover] = this.themes[r];
    this.who = who;
    this.coverKind = cover;
    const xs = XS[n];
    // the covers pop up on the ground, side by side
    this.pots = xs.map((x, i) => {
      const p = makeCover(cover, i);
      p.position.set(x, 0, POT_Z);
      p.userData.slot = i;
      p.userData.base = 1;
      this.root.add(p);
      p.scale.setScalar(0.001);
      this.s.wait(i * 0.08).then(() => popIn(this.s, p, 1, 0.35, { sound: i === 0 }));
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
    // something silly under each of the others (the frog decoy takes one of them)
    const frogPot = frog ? this.pots.find((p) => p !== this.hidePot) : null;
    for (const p of this.pots) {
      if (p === this.hidePot) continue;
      const g = p === frogPot ? (this.frog = makeGag('frog')) : makeGag(this.gagKinds[this.gagI++ % this.gagKinds.length]);
      g.visible = false;
      this.root.add(g);
      p.userData.gag = g;
      this.gags.push(g);
    }
    await this.wait(0.35);
    // the friend pops in at the front and says hello
    c.position.set(this.hidePot.position.x, 0, FRONT_Z);
    c.rotation.set(0, 0, 0);
    popIn(this.s, c, c.userData.baseScale, 0.3, { sound: false });
    this.call();
    if (c.userData.face) setFace(c.userData.face, 'happy');
    await this.wait(0.3);
    // its cover lifts, the friend walks under it, turns round to wave, and the cover comes down
    const goes = [this.hideUnder(c, this.hidePot)];
    if (this.frog) {
      const f = this.frog;
      f.position.set(frogPot.position.x, 0, FRONT_Z);
      popIn(this.s, f, f.userData.baseScale, 0.3, { sound: false });
      sfx.ribbit();
      goes.push(this.wait(0.15).then(() => this.hideUnder(f, frogPot)));
    }
    await Promise.all(goes);
    if (this.dead) return;
    this.peek = !!peek;
    this.placeTail();
    // shuffle: neighbours swap, one round the front and one round the back
    if (swaps) {
      this.say('Watch!', { max: 0.6 });
      await this.wait(0.35);
      for (let k = 0; k < swaps; k++) {
        let a = Math.floor(Math.random() * (n - 1));
        if (k === 0 && Math.random() < 0.7) { const hi = this.pots.indexOf(this.hidePot); a = hi === 0 ? 0 : hi === n - 1 ? n - 2 : hi - (Math.random() < 0.5 ? 1 : 0); }
        await this.swap(this.pots[a], this.pots[a + 1], SWAP_DUR[this.level]);
        if (this.dead) return;
        if (k < swaps - 1) await this.wait(0.08);
      }
    }
    for (const p of this.pots) p.userData.tap.enabled = true;
    this.busy = false;
    this.cue();
  }

  call() { sfx[HIDERS[this.who].call]?.(); }

  // A friend (or the frog) goes under a cover: the cover lifts straight up, the friend walks in, turns to wave,
  // and the cover is set down over it (the friend ducks as it comes down, so nothing pokes through).
  async hideUnder(c, p) {
    await this.lift(p, true);
    const from = c.position.clone(), to = new T.Vector3(p.position.x, 0, p.position.z);
    const dist = from.distanceTo(to);
    c.rotation.y = Math.atan2(to.x - from.x, to.z - from.z);
    await this.s.anim(Math.max(0.5, dist / 5.5), (e) => { c.position.lerpVectors(from, to, e); c.position.y = 0; }, Ease.inOut);
    if (this.dead) return;
    await this.s.tween(c.rotation, { y: 0 }, 0.15);
    if (c === this.chick) this.call();
    await wiggle(this.s, c, 0.15, 0.3);
    // down it comes; the friend ducks under it
    const base = c.userData.baseScale ?? 1;
    const top = new T.Box3().setFromObject(c).max.y + 0.05;
    const y0 = p.position.y, r0 = p.rotation.x;
    await this.s.anim(0.3, (e) => {
      p.position.y = y0 * (1 - e);
      p.rotation.x = r0 * (1 - e);
      const k = Math.max(0.15, Math.min(1, p.position.y / top));
      c.scale.set(base, base * k, base);
    }, Ease.in);
    c.visible = false;
    c.scale.setScalar(base);
    p.rotation.x = 0;
    this.land(p);
  }

  // set down with a soft thunk and a little squash
  land(p) {
    p.position.y = 0;
    sfx[COVER_SFX[this.coverKind]]?.();
    this.squash(p);
  }

  placeTail() {
    if (!this.tail) return;
    this.tail.visible = this.peek;
    const p = this.hidePot.position;
    this.tail.position.set(p.x + 0.75, 0.05, p.z + 1.05);
  }

  squash(p) {
    const b = p.userData.base ?? 1;
    this.s.anim(0.22, (_, q) => { const k = 1 - Math.sin(q * Math.PI) * 0.1; p.scale.set(b / Math.sqrt(k), b * k, b / Math.sqrt(k)); }).then(() => p.scale.setScalar(b));
  }

  // two neighbouring covers swap: out (front / back), across, and back into the row. Their centres stay > 2.8 apart.
  async swap(a, b, dur) {
    const xa = a.position.x, xb = b.position.x;
    if (this.tail) this.tail.visible = false;
    sfx.swoosh();
    this.s.wait(dur * 0.5).then(() => sfx.swoosh());
    await this.s.anim(dur, (_, e) => {
      const x = smooth((e - 0.15) / 0.7), z = e < 0.5 ? smooth(e / 0.3) : smooth((1 - e) / 0.3);
      a.position.set(xa + (xb - xa) * x, 0, POT_Z + z * SWAP_Z);
      b.position.set(xb + (xa - xb) * x, 0, POT_Z - z * SWAP_Z);
    });
    a.position.set(xb, 0, POT_Z); b.position.set(xa, 0, POT_Z);
    const i = this.pots.indexOf(a), j = this.pots.indexOf(b);
    this.pots[i] = b; this.pots[j] = a;
    sfx.thunk();
    this.squash(a); this.squash(b);
    this.placeTail();
  }

  name() { return HIDERS[this.who]?.name || 'Chick'; }
  promptText() { return this.plan[this.round]?.[1] ? `Where's ${this.name()} now?` : `Where's ${this.name()}?`; }

  // straight up with a little peek (the front edge tips up a touch), or straight back down
  async lift(p, up = true) {
    if (up) {
      sfx.swoosh();
      const b = p.userData.base ?? 1;
      await this.s.anim(0.08, (_, q) => { const k = 1 - Math.sin(q * Math.PI / 2) * 0.08; p.scale.set(b / Math.sqrt(k), b * k, b / Math.sqrt(k)); });
      p.scale.setScalar(b);
      await this.s.anim(0.28, (e) => { p.position.y = e * LIFT; p.rotation.x = -0.14 * e; }, Ease.back);
    } else {
      const y0 = p.position.y, r0 = p.rotation.x;
      await this.s.anim(0.24, (e) => { p.position.y = y0 * (1 - e); p.rotation.x = r0 * (1 - e); }, Ease.in);
      p.rotation.x = 0;
      this.land(p);
    }
  }

  async tapPot(p) {
    if (this.busy || !p.userData.tap?.enabled) return;
    this.busy = true;
    sfx.pick();
    const isChick = p === this.hidePot;
    if (this.tail) this.tail.visible = false;
    if (!isChick) {
      // a silly surprise underneath (Frog sits under one on the hardest rounds)
      input.lock(900);
      const g = p.userData.gag;
      if (g) { g.position.set(p.position.x, 0, p.position.z); g.rotation.set(0, g.userData.gag === 'sock' ? 0.9 : 0, 0); g.visible = true; g.scale.setScalar(g.userData.baseScale); }
      await this.lift(p);
      if (g) {
        sfx[GAGS[g.userData.gag].sfx]?.();
        if (g.userData.gag === 'frog') hop(this.s, g, 0.6);
        else gagShow(this.s, g);
      }
      // Pip giggles at it
      sfx.giggle();
      wiggle(this.s, this.pip, 0.2, 0.5);
      const gl = g ? GAGS[g.userData.gag].line : 'Not here!';
      this.redirect(`${gl} Where's ${this.name()}?`.length <= 30 ? `${gl} Where's ${this.name()}?` : gl);
      await this.wait(0.75);
      if (this.dead) return;
      if (g) { await popOut(this.s, g, 0.15); g.position.y = 0; }
      await this.lift(p, false);
      this.placeTail();
      this.busy = false;
      return;
    }
    input.lock(1500);
    this.clearHints();
    if (this.stopPeep) { this.stopPeep(); this.stopPeep = null; }
    // peekaboo! the cover lifts, the friend pops up, hops out in front, cheers, then jumps into Pip's arms
    const c = this.chick, u = c.userData, base = u.baseScale ?? 1;
    c.position.set(p.position.x, 0, p.position.z);
    c.rotation.set(0, 0, 0);
    c.scale.set(base, base * 0.3, base);
    c.visible = true;
    const up = this.lift(p);
    this.s.wait(0.12).then(() => this.s.anim(0.22, (e) => c.scale.set(base, base * (0.3 + 0.7 * e), base), Ease.back));
    await up;
    if (this.dead) return;
    this.call();
    if (u.face) setFace(u.face, 'joy');
    fx.confetti(c.position.clone().add(new T.Vector3(0, 1.4, 0.4)), 25);
    this.busy = false;
    this.success(c.position.clone().add(new T.Vector3(0, 1.6, 1.4)), 'Peekaboo!');
    // a cheering hop out from under the cover, onto the grass in front
    const from = c.position.clone(), out = from.clone().setZ(POT_Z + 1.9);
    await this.s.anim(0.3, (e, q) => { c.position.lerpVectors(from, out, e); c.position.y = Math.sin(q * Math.PI) * 0.7; }, Ease.inOut);
    c.position.y = 0;
    if (this.dead) return;
    this.lowered = this.lift(p, false);
    if (u.face) setFace(u.face, 'happy');
    await this.jumpToPip(c);
  }

  // out in front of the row first, then up and over to Pip (never through a cover)
  async jumpToPip(c) {
    const pip = this.pip, s = this.s;
    const from = c.position.clone();
    const to = pip.position.clone().add(new T.Vector3(0.4, 0.3, 1.25)); // held in front of Pip's tummy, not inside it
    const clearX = Math.min(...this.pots.map((p) => p.position.x)) - 1.6; // left of every cover
    sfx.boing2();
    const ry0 = c.rotation.y;
    await s.anim(0.5, (e, q) => {
      const x = from.x + (to.x - from.x) * e;
      c.position.x = x;
      // stay in front of the row until past the last cover, then step back to Pip
      const k = from.x <= clearX ? e : smooth((clearX - x) / (clearX - to.x));
      c.position.z = from.z + (to.z - from.z) * k;
      c.position.y = from.y + (to.y - from.y) * e + Math.sin(q * Math.PI) * 1.6;
      c.rotation.y = ry0 + Math.sin(q * Math.PI) * 0.8;
    }, Ease.inOut);
    if (this.dead) return;
    c.position.copy(to);
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
    // the cover is set back down, then everything shrinks away together
    if (this.lowered) await this.lowered;
    this.lowered = null;
    if (this.chick) this.s.tween(this.chick.scale, { x: 0.001, y: 0.001, z: 0.001 }, 0.2, Ease.in);
    for (const q of this.pots) this.s.tween(q.scale, { x: 0.001, y: 0.001, z: 0.001 }, 0.2, Ease.in);
    await this.wait(0.2);
  }

  center(p) { return p.position.clone().add(new T.Vector3(0, 1.0, 0.5)); }
  showHint(glow = true) {
    if (glow) { this.addHalo(this.hidePot, 1.4); wiggle(this.s, this.hidePot, 0.08, 0.5); this.call(); }
    fx.ghostPath([this.center(this.hidePot)], { mode: 'tap' });
  }
  // only Level 1's first cue points at the cover; from Level 2 the cue scans so the game stays a memory game
  demoL3() { fx.ghostPath(this.pots.map((p) => this.center(p)), { mode: 'scan' }); }
  playDemo() {
    this.demoing = true;
    input.lock(2500);
    if (this.level >= 1) this.demoL3(); else this.showHint(false);
    this.s.wait(2.5).then(() => { fx.clearHands(); this.demoing = false; this.idle = 0; });
  }
  makeErrorless() {
    for (const p of this.pots) if (p !== this.hidePot) { p.userData.tap.enabled = false; p.userData.base = 0.8; this.s.tween(p.scale, { x: 0.8, y: 0.8, z: 0.8 }, 0.3); }
    this.peek = true;
    if (!this.busy) this.placeTail();
    this.stopPeep = this.s.every(2, () => { if (!this.busy) { wiggle(this.s, this.hidePot, 0.06, 0.4); this.call(); } });
  }
  nextRound() { if (this.stopPeep) { this.stopPeep(); this.stopPeep = null; } super.nextRound(); }

  onFinale() {
    // everyone who hid today comes out to play
    const kinds = shuffle(Object.keys(HIDERS));
    kinds.forEach((k, i) => {
      const c = makeHider(k);
      const b = c.userData.baseScale;
      this.root.add(c);
      c.position.set(-3.6 + i * 2.2, 0, 2);
      this.s.wait(i * 0.12).then(() => popIn(this.s, c, b, 0.35, { sound: false }));
      this.s.wait(0.2 + i * 0.25).then(() => { sfx[HIDERS[k].call]?.(); hop(this.s, c, 0.6, 0.4); });
      this.s.wait(1.0 + i * 0.2).then(() => hop(this.s, c, 0.5, 0.4));
    });
  }
}
