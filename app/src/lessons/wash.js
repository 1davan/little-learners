// Game 10 — Splash wash. Topic mt_vbbxnY7ZDT "Keeping clean and healthy".
// A messy friend needs a wash: rub each messy spot with the sponge until it's clean. Level 3: dip the sponge in water first.
// Each round brings a different mess (sand, mud, paint, jam, grass, chocolate). Rubbing builds foam and makes the
// friend squirm and giggle; a clean spot lets go of bubbles you can pop; a clean friend does a shake-dry.
import * as T from '../three.js';
import { Lesson } from '../engine/lesson.js';
import { mesh, geo, toonUnique } from '../engine/toon.js';
import { makeAnimal, setFace, popIn, popOut, hop, wiggle } from '../engine/actors.js';
import { partAnchors, makeSponge, makeBucket } from '../engine/beach.js';
import { input } from '../engine/input.js';
import { project, screenRadius } from '../engine/stage.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';
import { MESS, makeMess, setMessLook, makeFoam, makeCause, makeDrop, makeSoapBubble } from './wash-mess.js';

const SCALE = 2.2;
const SPONGE_HOME = new T.Vector3(4.7, 1.0, 3);
const BUCKET_POS = new T.Vector3(-4.6, 0, 3);
const CAUSE_AT = new T.Vector3(-3.0, 0, 1.4);
const WORD = { tummy: 'tummy', handL: 'hand', handR: 'hand', footL: 'foot', footR: 'foot', nose: 'nose', earL: 'ear', earR: 'ear' };
const NAME = { bear: 'Bear', bunny: 'Bunny', cat: 'Kitty', frog: 'Froggy' };
const NEED = [0.35, 0.6, 0.8]; // how much rubbing each spot needs (fraction of screen size travelled)
const DAB = [0.5, 0.25, 0]; // how much one tap on a spot cleans
const FOAM_MAX = 8;
const PLANS = [
  [['bear', ['tummy']], ['bear', ['tummy', 'handR']], ['bunny', ['tummy', 'footL']], ['cat', ['handL', 'handR']], ['frog', ['tummy', 'footR']], ['bear', ['handL', 'handR'], 'snack']],
  [['bear', ['tummy', 'handR']], ['bunny', ['tummy', 'footL', 'footR']], ['cat', ['nose', 'handL', 'handR']], ['frog', ['tummy', 'earL', 'footR']], ['bear', ['nose', 'tummy', 'footL', 'footR']], ['bunny', ['handL', 'handR', 'tummy'], 'snack']],
  [['bear', ['tummy', 'handL', 'handR']], ['bunny', ['earL', 'tummy', 'footR']], ['cat', ['nose', 'handL', 'footL', 'footR']], ['frog', ['tummy', 'handL', 'handR', 'footL']], ['bear', ['earL', 'earR', 'nose', 'tummy']], ['cat', ['handL', 'handR', 'nose', 'tummy'], 'snack']],
];
// a different mess every round (per level)
const MESSES = [
  ['sand', 'mud', 'paint', 'jam', 'grass', 'choc'],
  ['mud', 'paint', 'sand', 'grass', 'jam', 'choc'],
  ['paint', 'jam', 'mud', 'sand', 'grass', 'choc'],
];

export default class WashLesson extends Lesson {
  build() {
    this.plan = PLANS[this.level];
    this.need = NEED[this.level];
    // a flat rock for the sponge to rest on
    const rock = mesh(geo.sphere(1, 16, 10), 0xb7b2a6, { outline: 0.03 });
    rock.scale.set(1.1, 0.45, 0.8);
    rock.position.set(SPONGE_HOME.x, 0.2, SPONGE_HOME.z);
    this.root.add(rock);
    this.sponge = makeSponge();
    this.sponge.position.copy(SPONGE_HOME);
    this.root.add(this.sponge);
    if (this.level === 2) {
      this.water = makeBucket(0x4a90ff, 0.9, 1.0);
      this.water.position.copy(BUCKET_POS);
      const surf = new T.Mesh(geo.circle(0.85, 24), toonUnique(0x7fd8ee));
      surf.rotation.x = -Math.PI / 2; surf.position.y = 0.8;
      this.water.add(surf);
      this.root.add(this.water);
      this.wet = false;
      this.setWet(false);
    } else this.wet = true;
    this.dragT = input.addDrag(this.sponge, {
      radius: 1.0, minY: 0.5, zones: () => [],
      onPick: () => { this.last = null; this.s.tween(this.sponge.scale, { x: 1.15, y: 1.15, z: 1.15 }, 0.12); },
      onMove: () => this.rub(),
      onDrop: (_z, info) => this.dropSponge(info),
    });
    this.bubbles = [];
    this.lastScrub = 0;
    this.lastGiggle = 0;
    this.tickle = 0;
    // bubbles pop on a tap that hits nothing else, so they never steal a grab of the sponge
    this.offs.push(input.onMiss((x, y) => this.popAt(x, y)));
  }

  setWet(w) {
    this.wet = w;
    this.sponge.children[0].material = toonUnique(w ? 0xffd23f : 0xfff3b0);
  }

  dirty() { return (this.spots || []).filter((s) => !s.clean); }

  async startRound(r) {
    this.busy = true;
    const [kind, parts] = this.plan[r];
    this.mess = MESSES[this.level][r];
    for (const t of this.spotTaps || []) input.remove(t);
    const f = makeAnimal(kind);
    f.scale.setScalar(SCALE);
    f.userData.baseScale = SCALE;
    f.position.set(-9, 0, 0.3);
    this.root.add(f);
    this.friend = f;
    this.tickle = 0;
    setFace(f.userData.face, 'sad');
    // the thing that made the mess pops up beside the spot the friend runs to
    this.cause = makeCause(this.mess);
    this.cause.position.copy(CAUSE_AT);
    this.root.add(this.cause);
    popIn(this.s, this.cause, 1, 0.35);
    // run in with little bounces
    sfx.patter();
    this.s.anim(0.5, (e, p) => { f.position.x = -9 + 9 * e; f.position.y = Math.abs(Math.sin(p * Math.PI * 3)) * 0.35 * (1 - p); f.rotation.z = Math.sin(p * Math.PI * 3) * 0.08 * (1 - p); }, Ease.out)
      .then(() => { f.position.y = 0; f.rotation.z = 0; sfx.land(); });
    await this.wait(0.18);
    const anchors = partAnchors(f);
    this.spots = parts.map((name, i) => {
      const sp = makeMess(this.mess);
      sp.position.z = 0.12;
      sp.rotation.z = (i % 2 ? 1 : -1) * 0.3;
      sp.userData.k = name === 'tummy' ? 1 : 0.68; // smaller splats on hands, feet, ears and noses
      anchors[name].add(sp);
      this.s.wait(0.06 * i).then(() => popIn(this.s, sp, sp.userData.k, 0.3, { sound: false }));
      return { name, obj: sp, anchor: anchors[name], done: 0, clean: false, foam: [] };
    });
    sfx[MESS[this.mess].snd]();
    this.s.wait(0.15).then(() => sfx.aww());
    this.spotTaps = this.spots.map((s) => (s.tap = input.addTap(s.anchor, { radius: 0.6, onTap: () => this.dab(s) })));
    this.washedOnce = 0;
    await this.wait(0.15);
    this.busy = false;
    this.cue();
  }

  who() { return NAME[this.friend?.userData.kind] || 'friend'; }
  promptText() {
    const d = this.dirty()[0];
    if (!d) return '';
    if (this.level === 2 && !this.wet) return 'Dip, dip! Water first.';
    return `${MESS[this.mess].adj} ${WORD[d.name]}! Rub rub rub!`;
  }

  // called while the sponge is dragged: rubbing near a dirty spot cleans it
  rub() {
    const sp = this.sponge;
    const p = project(sp.position);
    const m = Math.min(window.innerWidth, window.innerHeight);
    if (this.level === 2 && !this.wet) {
      const b = project(BUCKET_POS.clone().setY(0.9));
      if (Math.hypot(p.x - b.x, p.y - b.y) < m * 0.13) this.dip();
      this.last = p;
      return;
    }
    if (this.last) {
      const travel = Math.min(0.08, Math.hypot(p.x - this.last.x, p.y - this.last.y) / m);
      for (const s of this.dirty()) {
        const wp = s.anchor.getWorldPosition(new T.Vector3());
        const c = project(wp);
        const r = Math.max(screenRadius(wp, 0.7) * 1.4, m * 0.11);
        if (Math.hypot(p.x - c.x, p.y - c.y) < r && travel > 0.002) this.scrub(s, travel);
      }
    }
    this.last = p;
  }

  dip() {
    this.setWet(true);
    this.washedOnce = 0;
    sfx.splash();
    this.splashAt(BUCKET_POS.clone().setY(1.0), 10, 3.2);
    wiggle(this.s, this.water, 0.12, 0.4);
    this.say('Splash! Now rub!');
  }

  scrub(s, amt) {
    if (s.clean) return;
    const before = s.done;
    s.done = Math.min(this.need, s.done + amt);
    const p = s.done / this.need;
    setMessLook(s.obj, p, s.obj.userData.k);
    const now = performance.now();
    if (now - this.lastScrub > 120) { sfx.scrub(); this.lastScrub = now; }
    this.lastRub = now;
    // foam builds up as you rub
    const want = Math.ceil(p * FOAM_MAX);
    while (s.foam.length < want) this.addFoam(s);
    // the friend squirms and giggles: it tickles!
    this.tickle = 1;
    if (now - this.lastGiggle > 1100 && p < 1) {
      this.lastGiggle = now;
      sfx.giggle();
      const f = this.friend;
      setFace(f.userData.face, 'happy');
      fx.float(f.position.clone().add(new T.Vector3(1.2, 4.6, 0.5)), 'hee', { color: '#ff8fc0', size: 4.5 });
    }
    if (Math.floor(p * 4) > Math.floor((before / this.need) * 4)) sfx.bubble();
    if (s.done >= this.need) this.cleaned(s);
  }

  addFoam(s) {
    const n = s.foam.length;
    const puff = makeFoam();
    const a = n * 2.4 + Math.random(), r = 0.1 + (n / FOAM_MAX) * 0.32;
    puff.position.set(Math.cos(a) * r * 1.2, Math.sin(a) * r, 0.22 + (n % 3) * 0.05);
    s.anchor.add(puff);
    s.foam.push(puff);
    popIn(this.s, puff, 1, 0.22, { sound: false });
  }

  dab(s) {
    if (this.busy || s.clean) return;
    const wp = s.anchor.getWorldPosition(new T.Vector3());
    this.s.tween(this.sponge.position, { x: wp.x + 0.3, y: wp.y + 0.2, z: wp.z + 0.8 }, 0.25, Ease.out);
    const amt = this.errorlessOn ? 1 : DAB[this.level];
    if (!amt || (this.level === 2 && !this.wet)) { wiggle(this.s, this.sponge, 0.3); return; }
    this.scrub(s, amt * this.need);
  }

  cleaned(s) {
    if (s.clean) return;
    s.clean = true;
    this.clearHints();
    if (s.tap) { input.remove(s.tap); s.tap = null; }
    s.anchor.remove(s.obj);
    const wp = s.anchor.getWorldPosition(new T.Vector3());
    // the foam turns into bubbles you can pop, and the clean spot sparkles
    s.foam.forEach((puff, i) => {
      const pw = puff.getWorldPosition(new T.Vector3());
      s.anchor.remove(puff);
      if (i % 3 === 0) this.addBubble(pw, 0.2 + Math.random() * 0.14);
    });
    s.foam = [];
    fx.confetti(wp, 10);
    sfx.note(this.spots.indexOf(s) * 2);
    sfx.sparkle();
    this.washedOnce++;
    if (this.level === 2 && this.washedOnce >= 2) this.setWet(false);
    const left = this.dirty();
    if (!left.length) return this.allClean();
    this.say(`Clean ${WORD[s.name]}! ${this.level === 2 && !this.wet ? 'Dip again!' : 'More!'}`);
    this.idle = 0;
  }

  // ---- bubbles ----
  addBubble(pos, r) {
    const b = makeSoapBubble(r);
    b.position.copy(pos);
    b.position.z += 0.5;
    this.root.add(b);
    b.userData.life = 3.2 + Math.random() * 1.2;
    b.userData.ph = Math.random() * 6;
    b.userData.vx = (Math.random() - 0.5) * 2.2;
    b.userData.r = r;
    this.bubbles.push(b);
    b.userData.k = r;
    popIn(this.s, b, r, 0.25, { sound: false });
  }
  popBubble(b, loud = true) {
    const i = this.bubbles.indexOf(b);
    if (i < 0) return;
    this.bubbles.splice(i, 1);
    if (loud) {
      sfx.pop();
      fx.confetti(b.position, 6);
      fx.float(b.position.clone(), '✦', { color: '#7fd0ff', size: 5 });
    }
    const k = b.userData.k * 1.6;
    this.s.tween(b.scale, { x: k, y: k, z: k }, 0.08).then(() => this.root.remove(b));
  }
  popAt(x, y) {
    if (this.dead) return false;
    let best = null, bd = Infinity;
    for (const b of this.bubbles) {
      const c = project(b.position);
      const r = Math.max(screenRadius(b.position, b.userData.r) * 1.6, Math.min(innerWidth, innerHeight) * 0.05);
      const d = Math.hypot(c.x - x, c.y - y) / r;
      if (d < 1 && d < bd) { bd = d; best = b; }
    }
    if (!best) return false;
    this.popBubble(best);
    return true;
  }

  splashAt(pos, n = 14, up = 3.5) {
    for (let i = 0; i < n; i++) {
      const d = makeDrop();
      d.position.copy(pos);
      this.root.add(d);
      const a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 3;
      const v = new T.Vector3(Math.cos(a) * sp, up * (0.6 + Math.random() * 0.6), Math.sin(a) * sp * 0.4 + 0.8);
      const p0 = d.position.clone();
      this.s.anim(0.55 + Math.random() * 0.2, (_, q) => {
        const t = q * 0.7;
        d.position.set(p0.x + v.x * t, p0.y + v.y * t - 6 * t * t, p0.z + v.z * t);
        d.scale.setScalar(1 - q * 0.6);
      }).then(() => this.root.remove(d));
    }
  }

  allClean() {
    this.busy = true;
    input.lock(1200);
    this.payoff = this.shakeDry();
    this.busy = false;
    this.success(this.friend.position.clone().add(new T.Vector3(0, 3.5, 0))); // praise word only: keeps the next round close
  }

  // the clean friend shakes itself dry like a puppy, then sparkles
  async shakeDry() {
    const f = this.friend;
    const snack = this.plan[this.round]?.[2] === 'snack'; // called before success() advances the round
    setFace(f.userData.face, 'happy');
    this.tickle = 0;
    f.rotation.z = 0;
    this.s.tween(this.sponge.position, { x: SPONGE_HOME.x, y: SPONGE_HOME.y, z: SPONGE_HOME.z }, 0.45, Ease.out);
    this.s.tween(this.sponge.scale, { x: 1, y: 1, z: 1 }, 0.3);
    // anticipation squash
    await this.s.anim(0.1, (_, p) => { const k = 1 - 0.12 * p; f.scale.set(SCALE / Math.sqrt(k), SCALE * k, SCALE / Math.sqrt(k)); });
    sfx.swoosh();
    sfx.splash();
    this.splashAt(f.position.clone().add(new T.Vector3(0, 2.4, 0.6)), 20, 3);
    const r0 = f.rotation.y;
    await this.s.anim(0.5, (_, p) => {
      const k = 1 - p, w = Math.sin(p * Math.PI * 12);
      f.rotation.y = r0 + w * 0.45 * k;
      const sq = 1 + Math.abs(w) * 0.07 * k;
      f.scale.set(SCALE * sq, SCALE / sq, SCALE * sq);
    });
    f.rotation.y = r0; f.scale.setScalar(SCALE);
    sfx.twinkle();
    fx.float(f.position.clone().add(new T.Vector3(-0.9, 4.4, 0.5)), '✨', { size: 6 });
    if (snack) {
      const apple = mesh(geo.sphere(0.45, 16, 12), 0xff4b4b, { outline: 0.03 });
      const leaf = mesh(geo.sphere(0.12, 8, 6), 0x5fd068, { outline: 0.012 }); leaf.scale.set(1.6, 0.5, 0.8); leaf.position.set(0.15, 0.48, 0);
      apple.add(leaf);
      apple.position.set(f.position.x + 1.4, 2.4, f.position.z + 1.2);
      this.root.add(apple);
      await popIn(this.s, apple, 1, 0.25);
      sfx.chomp();
      await this.s.tween(apple.scale, { x: 0.001, y: 0.001, z: 0.001 }, 0.2);
      this.root.remove(apple);
      fx.float(f.position.clone().add(new T.Vector3(0.6, 4.2, 0.5)), '♥', { color: '#ff5a7a', size: 6 });
    } else hop(this.s, f, 0.5, 0.35, { sound: true });
  }

  async afterSuccess() {
    if (this.payoff) await this.payoff;
    this.payoff = null;
    // the friend skips off, the messy prop goes too
    sfx.patter();
    const f = this.friend, c = this.cause;
    this.s.anim(0.6, (e, p) => { f.position.x = 10 * e; f.position.y = Math.abs(Math.sin(p * Math.PI * 3)) * 0.4; }, Ease.in).then(() => this.root.remove(f));
    if (c) popOut(this.s, c, 0.2).then(() => this.root.remove(c));
  }

  dropSponge() {
    // the sponge stays where it was put, unless it fell off
    this.s.tween(this.sponge.scale, { x: 1, y: 1, z: 1 }, 0.15);
    this.last = null;
    const p = project(this.sponge.position);
    if (p.x < 0 || p.x > window.innerWidth || p.y > window.innerHeight * 0.95) this.s.tween(this.sponge.position, { x: SPONGE_HOME.x, y: SPONGE_HOME.y, z: SPONGE_HOME.z }, 0.4, Ease.out);
  }

  update(dt, t) {
    // squirm while being scrubbed
    const f = this.friend;
    if (f && this.tickle > 0) {
      this.tickle = Math.max(0, this.tickle - dt * 1.6);
      f.rotation.z = Math.sin(t * 22) * 0.07 * this.tickle;
      if (this.tickle === 0) f.rotation.z = 0;
    }
    // the sponge squishes while it rubs
    if (input.dragging() && performance.now() - (this.lastRub || 0) < 160) {
      const w = Math.sin(t * 34) * 0.1;
      this.sponge.scale.set(1.15 * (1 + w), 1.15 * (1 - w), 1.15);
    }
    // bubbles drift up and wobble
    for (const b of this.bubbles.slice()) {
      const u = b.userData;
      u.life -= dt;
      b.position.y += dt * 0.95;
      b.position.x += dt * (u.vx + Math.sin(t * 2 + u.ph) * 0.4);
      const w = 1 + Math.sin(t * 5 + u.ph) * 0.06;
      if (b.scale.x > u.k * 0.9 && b.scale.x < u.k * 1.2) b.scale.set(u.k * w, u.k / w, u.k);
      if (u.life <= 0 || b.position.y > 9) this.popBubble(b, false);
    }
  }

  showHint(glow = true) {
    const d = this.dirty()[0];
    if (!d) return;
    const wp = d.anchor.getWorldPosition(new T.Vector3());
    if (glow) this.addHalo(d.anchor, 0.9);
    const pts = [this.sponge.position.clone()];
    if (this.level === 2 && !this.wet) pts.push(BUCKET_POS.clone().setY(1.2));
    pts.push(wp);
    fx.ghostPath(pts, { mode: 'rub' });
  }
  demoL3() { this.showHint(false); }

  makeErrorless() {
    // the sponge floats to the next spot and spots need half the rubbing
    this.need *= 0.5;
    if (this.level === 2) this.setWet(true);
    const d = this.dirty()[0];
    if (d) { const wp = d.anchor.getWorldPosition(new T.Vector3()); this.s.tween(this.sponge.position, { x: wp.x + 0.6, y: wp.y, z: wp.z + 0.9 }, 0.6, Ease.inOut); }
  }

  nextRound() { this.need = NEED[this.level]; super.nextRound(); }

  onFinale() {
    // a shower of bubbles floats up; one giant bubble pops at the top
    for (let i = 0; i < 10; i++) this.addBubble(new T.Vector3(-5 + i * 1.1, 1 + Math.random() * 2, 1), 0.25 + Math.random() * 0.25);
    const b = makeSoapBubble(0.9);
    b.position.set(0, 3, 2);
    this.root.add(b);
    this.s.tween(b.position, { y: 7 }, 1.6, Ease.out).then(() => { sfx.pop(); fx.confetti(b.position, 30); this.root.remove(b); });
    hop(this.s, this.pip, 0.6);
  }
}
