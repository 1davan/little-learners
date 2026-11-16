// Game 11 — Who says moo? Topic mt_ppENoD8vf1 "Local plants & animals".
// An animal sound plays; tap the animal that makes it. Every animal answers with its own voice when tapped.
// Each round the animals stand in different farm spots (pen, hay, barn, pond…); a sound bubble by Pip shows the call,
// and the right animal does its signature move (cow chews, pig rolls in mud, sheep poofs, hen lays an egg, horse clip-clops, duck splashes).
// Each level is a different place: a sunny meadow with a rainbow (flowers, tree, pond, hay), the barnyard (pen, trough,
// barn door, mud) and the garden with hedges, pumpkins and a hay cart. The right animal then gets its favourite treat,
// which Pip throws (or which rains down) and which bounces and piles up at its feet with real physics.
import * as T from '../three.js';
import { Lesson, shuffle } from '../engine/lesson.js';
import { popIn, popOut, hop, setFace, wiggle } from '../engine/actors.js';
import { makeFarmAnimal } from '../engine/farm.js';
import { makeDuck } from '../engine/beach.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';
import { physics } from '../engine/physics.js';
import { SPOT_POOLS, makeSpot, makeSoundBubble, setBubble, SIGNATURE, makeTreat, treatCount, makeBackdrop } from './moo-farm.js';
import { frame, calmBackdrop } from './view-tools.js';
import { makeHay } from '../engine/scenery.js';

const SOUND = { cow: 'moo', pig: 'oink', sheep: 'baa', duck: 'quack', hen: 'cluck', horse: 'neigh' };
const WORD = { cow: 'moo', pig: 'oink', sheep: 'baa', duck: 'quack', hen: 'cluck cluck', horse: 'neigh' };
const SHOUT = { cow: 'Moo!', pig: 'Oink!', sheep: 'Baa!', duck: 'Quack!', hen: 'Cluck!', horse: 'Neigh!' };
const NAME = { cow: 'Cow', pig: 'Pig', sheep: 'Sheep', duck: 'Duck', hen: 'Hen', horse: 'Horse' };
const COL = { cow: '#7a6cff', pig: '#ff6f9a', sheep: '#8b7a85', duck: '#ffb020', hen: '#ff4b4b', horse: '#a0623a' };
const XS = { 2: [-2.7, 2.7], 3: [-3.7, 0, 3.7], 4: [-4.6, -1.55, 1.55, 4.6] };
const BUBBLE_AT = new T.Vector3(-4.0, 5.0, -3.4);

// [target, ...others]
const PLANS = [
  [['cow', 'duck'], ['duck', 'cow'], ['pig', 'sheep'], ['sheep', 'hen'], ['cow', 'pig'], ['hen', 'horse']],
  [['cow', 'pig', 'duck'], ['sheep', 'hen', 'cow'], ['horse', 'duck', 'pig'], ['pig', 'sheep', 'horse'], ['hen', 'duck', 'cow'], ['duck', 'hen', 'sheep']],
  [['horse', 'cow', 'sheep'], ['hen', 'duck', 'pig'], ['sheep', 'cow', 'horse', 'pig'], ['duck', 'hen', 'sheep', 'cow'], ['pig', 'horse', 'hen', 'duck'], ['cow', 'sheep', 'pig', 'horse']],
];

// how the treat arrives each round: thrown by Pip, or raining down from the sky (never the same twice in a row)
const DELIVERY = [
  ['toss', 'rain', 'toss', 'rain', 'toss', 'rain'],
  ['rain', 'toss', 'rain', 'toss', 'rain', 'toss'],
  ['toss', 'rain', 'toss', 'rain', 'toss', 'rain'],
];

function makeOne(kind) {
  if (kind === 'duck') return makeDuck(1.7);
  return makeFarmAnimal(kind);
}

export default class MooLesson extends Lesson {
  build() {
    this.plan = PLANS[this.level];
    this.animals = [];
    this.spots = [];
    this.lastSpots = [];
    // Pip sits up on a big hay bale at the back-left, above the animals' heads, so no animal ever hides Pip
    // (or the sound bubble beside it) and the row of animals can fill the frame
    const bale = makeHay(1.7); bale.position.set(-6.3, 0, -3.5); bale.rotation.y = 0.35;
    this.pipStand = new T.Group(); this.pipStand.position.set(-6.3, 2.3, -3.5);
    this.root.add(bale, this.pipStand);
    this.pipStand.add(this.pip);
    this.pip.position.set(0, 0, 0);
    frame(0, 3.6, 11.8, 0, 2.2, 0);
    // farm flowers and sunflowers in the scenery stay out of the band around the animals
    calmBackdrop(this.meadow, { hide: (o) => (o.userData.flower && o.position.z > -5 && Math.abs(o.position.x) < 11) });
    this.bubble = makeSoundBubble();
    this.bubble.position.copy(BUBBLE_AT);
    this.root.add(this.bubble);
    this.pool = SPOT_POOLS[this.level];
    this.backdrop = makeBackdrop(this.level);
    this.root.add(this.backdrop);
  }

  async startRound(r) {
    this.busy = true;
    for (const a of this.animals) popOut(this.s, a, 0.18).then(() => this.root.remove(a));
    for (const sp of this.spots) popOut(this.s, sp, 0.18).then(() => this.root.remove(sp));
    // puddles, eggs and splashes from last round's signature move pop away with it (each body leaves the physics
    // world on its own: no physics.clear(), so nothing freezes mid-air)
    if (this.actRoot) {
      const old = this.actRoot;
      for (const o of old.children) physics.remove(o);
      popOut(this.s, old, 0.18).then(() => this.root.remove(old));
    }
    this.treats = [];
    this.actRoot = new T.Group();
    this.root.add(this.actRoot);
    const [target, ...others] = this.plan[r];
    this.target = target;
    // shuffle positions, but never put the answer in the same place twice running
    let kinds;
    do { kinds = shuffle([target, ...others]); } while (kinds.indexOf(target) === this.lastIdx && kinds.length > 1 && Math.random() < 0.85);
    this.lastIdx = kinds.indexOf(target);
    // new farm spots every round: none of last round's spots come back
    const fresh = shuffle(this.pool.filter((k) => !this.lastSpots.includes(k)));
    const spots = fresh.length >= kinds.length ? fresh.slice(0, kinds.length) : fresh.concat(shuffle(this.pool.filter((k) => !fresh.includes(k)))).slice(0, kinds.length);
    this.lastSpots = spots;
    const xs = XS[kinds.length];
    this.spots = spots.map((k, i) => {
      const sp = makeSpot(k);
      sp.position.set(xs[i], 0, 0.4 - Math.abs(xs[i]) * 0.08 - 0.05);
      sp.scale.setScalar(kinds.length === 4 ? 0.85 : 1);
      this.root.add(sp);
      popIn(this.s, sp, sp.scale.x, 0.35, { sound: false });
      return sp;
    });
    sfx.rustle();
    this.animals = kinds.map((k, i) => {
      const a = makeOne(k);
      a.position.set(xs[i], 0, 0.4 - Math.abs(xs[i]) * 0.08);
      a.rotation.y = -xs[i] * 0.05;
      a.userData.home = a.position.clone();
      a.userData.baseScale = a.userData.baseScale ?? 1;
      a.userData.spot = spots[i];
      this.root.add(a);
      this.s.wait(0.08 + i * 0.07).then(() => popIn(this.s, a, a.userData.baseScale, 0.4));
      a.scale.setScalar(0.001);
      a.userData.tap = input.addTap(a, { radius: 1.3, offset: new T.Vector3(0, 1.2, 0), onTap: () => this.tapAnimal(a) });
      return a;
    });
    setBubble(this.bubble, target, this.level === 2 ? '#4a90ff' : COL[target], this.level === 2); // Level 3: a neutral note, no colour clue
    await this.wait(0.3);
    this.busy = false;
    this.cue();
  }

  head(a) { return a.position.clone().add(new T.Vector3(0, a.userData.kind === 'duck' ? 1.6 : 2.5, 0.3)); }
  voice(a, loud = 1) {
    const k = a.userData.kind;
    sfx[SOUND[k]]();
    fx.float(this.head(a), '♪', { color: COL[k] });
    const f = a.userData.face;
    if (f) { setFace(f, 'scared'); this.s.wait(0.6).then(() => setFace(f, 'happy')); }
    wiggle(this.s, a, 0.12 * loud, 0.5);
  }

  // the sound bubble pops up by Pip and wobbles in time with the call
  playCall() {
    const t = this.target, b = this.bubble, k = b.userData.size;
    if (this.busy || this.dead) return;
    sfx[SOUND[t]]();
    b.visible = true;
    this.s.stop(b.scale);
    this.s.anim(0.75, (_, p) => {
      const e = p < 0.25 ? Ease.back(p / 0.25) : 1;
      const w = 1 + Math.sin(p * Math.PI * 6) * 0.07 * (1 - p);
      b.scale.set(k * e * w, k * e / w, 1);
    });
    fx.float(BUBBLE_AT.clone().add(new T.Vector3(1.0, 0.6, 0)), '♪', { color: COL[t], size: 6 });
    wiggle(this.s, this.pip, 0.12, 0.4);
  }

  promptText() { return this.level === 2 ? 'Listen! Who is it?' : `Who says ${WORD[this.target]}?`; }
  prompt() {
    const t = this.target;
    this.say(this.promptText(), { max: 1.5 });
    this.s.wait(0.25).then(() => { if (t === this.target) this.playCall(); });
  }

  async tapAnimal(a) {
    if (this.busy) return;
    const k = a.userData.kind;
    if (k !== this.target) {
      hop(this.s, a, 0.45, 0.4, { sound: true });
      this.voice(a);
      this.redirect(`That's ${NAME[k]}. ${WORD[k]}! Who says ${WORD[this.target]}?`);
      return;
    }
    this.busy = true;
    input.lock(1200);
    for (const o of this.animals) if (o.userData.tap) input.remove(o.userData.tap);
    // the bubble pops, the animal shouts its call and does its signature move, the others turn and bob along
    popOut(this.s, this.bubble, 0.2);
    this.voice(a, 1.3);
    fx.float(this.head(a).add(new T.Vector3(0, 0.6, 0)), SHOUT[k], { color: COL[k], size: 6 });
    if (a.userData.face) setFace(a.userData.face, 'happy');
    this.animals.forEach((o, i) => {
      if (o === a) return;
      this.s.tween(o.rotation, { y: Math.atan2(a.position.x - o.position.x, 2.5) * 0.6 }, 0.25, Ease.out);
      this.s.wait(0.3 + i * 0.1).then(() => hop(this.s, o, 0.25, 0.3));
    });
    this.act = SIGNATURE[k](this.s, a, this.actRoot);
    this.giveTreats(a, DELIVERY[this.level][this.round % 6]);
    this.busy = false;
    this.success(this.head(a)); // the shouted word floats up, so the caption stays a short praise word
  }

  // the animal's favourite food bounces and piles up at its feet (real physics), thrown by Pip or raining down
  giveTreats(a, how) {
    const k = a.userData.kind, n = treatCount(k);
    const feet = a.position.clone().add(new T.Vector3(0, 0, 1.35)); // in front of the feet, never inside the animal
    const from = this.pip.getWorldPosition(new T.Vector3()).add(new T.Vector3(0.6, 1.6, 0.6));
    if (how === 'toss') { wiggle(this.s, this.pip, 0.15, 0.35); sfx.swoosh(); } else sfx.whoosh();
    for (let i = 0; i < n; i++) this.s.wait(i * 0.045).then(() => {
      if (this.dead) return;
      const t = makeTreat(k, i);
      const to = feet.clone().add(new T.Vector3((Math.random() - 0.5) * 0.9, 0.3, Math.random() * 0.3));
      if (how === 'toss') t.position.copy(from).add(new T.Vector3(0, i * 0.05, 0));
      else t.position.set(to.x + (Math.random() - 0.5) * 0.4, 4.2 + i * 0.25, to.z);
      t.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      this.actRoot.add(t);
      this.treats.push(t);
      physics.add(t, t.userData.phys);
      if (how === 'toss') {
        physics.toss(t, to, { arc: 0, time: 0.5, spin: 1.5 });
        // it lands with a thud and only rolls a little (grass is soft)
        this.s.wait(0.5).then(() => { const b = physics.body(t); if (b) { const v = b.linvel(); b.setLinvel({ x: v.x * 0.15, y: v.y, z: v.z * 0.15 }, true); } });
      }
      else physics.impulse(t, { x: 0, y: -7, z: 0 }, { x: Math.random(), y: Math.random(), z: Math.random() });
    });
    this.s.wait(0.55).then(() => { if (!this.dead) sfx.mmm(); });
  }

  async afterSuccess() {
    if (this.act) await this.act;
    this.act = null;
    // the animal gobbles up its treats: a nod down, then each one is chomped away with a crunch (nothing is left lying about)
    const food = (this.treats || []).filter((t) => t.parent);
    const a = this.animals.find((x) => x.userData.kind === this.target);
    if (!food.length || this.dead) return;
    const h = a && a.userData.head;
    if (h && h !== a) { const x0 = h.rotation.x; this.s.anim(0.36, (_, p) => (h.rotation.x = x0 + Math.abs(Math.sin(p * Math.PI * 2)) * 0.3)).then(() => (h.rotation.x = x0)); }
    sfx.chomp();
    food.forEach((t, i) => this.s.wait(i * 0.04).then(() => {
      physics.remove(t);
      const k = t.scale.x * 0.55;
      this.s.tween(t.scale, { x: k, y: k, z: k }, 0.08, Ease.out).then(() => this.s.tween(t.scale, { x: 0.001, y: 0.001, z: 0.001 }, 0.12, Ease.in)).then(() => t.parent && t.parent.remove(t));
    }));
    this.s.wait(0.16).then(() => sfx.crunch());
    await this.wait(0.3);
    this.treats = [];
  }

  // stuck child: the animal that makes the sound hops
  nudgeTarget() { return this.busy ? null : this.animals.find((a) => a.userData.kind === this.target) || null; }

  showHint(glow = true) {
    const a = this.animals.find((x) => x.userData.kind === this.target);
    if (!a) return;
    if (glow) this.addHalo(a, 1.4);
    fx.ghostPath([this.head(a).add(new T.Vector3(0, -0.8, 0))], { mode: 'tap' });
  }
  choicePoints() { return this.animals.map((a) => this.head(a).add(new T.Vector3(0, -0.8, 0))); }

  makeErrorless() {
    for (const a of this.animals) if (a.userData.kind !== this.target) {
      a.userData.tap.enabled = false;
      const k = (a.userData.baseScale ?? 1) * 0.7;
      this.s.tween(a.scale, { x: k, y: k, z: k }, 0.4);
      a.userData.baseScale = k;
    }
  }

  update(dt, t) {
    // a slow bob for the sound bubble while it waits
    const b = this.bubble;
    if (b.visible && !this.busy) b.position.y = BUBBLE_AT.y + Math.sin(t * 2.2) * 0.12;
    for (const sp of this.spots) if (sp.userData.ring) { const p = (t % 2.5) / 2.5; sp.userData.ring.scale.setScalar(0.6 + p); sp.userData.ring.material.opacity = 0.6 * (1 - p); }
  }

  onFinale() {
    // farm chorus
    this.animals.forEach((a, i) => this.s.wait(0.3 + i * 0.45).then(() => { hop(this.s, a, 0.6); this.voice(a); }));
  }
}
