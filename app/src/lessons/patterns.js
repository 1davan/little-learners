// Game 6 — Pattern parade. Topics mt_ZjIFGc6zPW "Finding the repeating unit" and mt_WXW0hjNhph "Patterns & sequences".
// A parade of beach things marches onto the boardwalk and plays its pattern as a little tune (shell, star, shell, star…);
// the child taps what comes next (or what's missing). The finished parade plays its tune and marches off.
// Each level has its own stage: Level 1 a boardwalk parade where the things drop onto the planks one per beat,
// Level 2 a toy train where each thing rides in its own wagon, Level 3 striped circus podiums that pop out of the sand
// and catch the things Gull throws. The right answer is thrown into its spot with real physics (bounce, settle).
import * as T from '../three.js';
import { Lesson, shuffle } from '../engine/lesson.js';
import { mesh, geo, basic, ink } from '../engine/toon.js';
import { popIn, popOut, hop } from '../engine/actors.js';
import { makeCrab, makeBucket, makeBeachBall, makeShell, makeSeaStar, makeDuck, makeGull } from '../engine/beach.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';
import { project, setCamera } from '../engine/stage.js';
import { physics } from '../engine/physics.js';
import { makeBoardwalk, makeTrack, makeCart, makeEngine, makePodium, makeChoiceTowel, makeParadeFlag } from './patterns-stage.js';

const NOTE = { shell: 0, star: 2, crab: 4, ball: 5, bucket: 7 };
const NAME = { shell: 'shell', star: 'starfish', crab: 'crab', ball: 'beach ball', bucket: 'bucket' };
const ICON = { shell: '🐚', star: '⭐', crab: '🦀', ball: '🏐', bucket: '🪣' };
const ROW_Y = 2.25, ROW_Z = -1.2, TOWEL_Z = 3.7, CHOICE_S = 1.15, BEAT = 0.17;

// One look per round so no two parades feel the same: towel stripes, item colours and who leads the parade.
const THEMES = [
  { towel: 0x4ab0ff, bucket: 0x4a90ff, shell: 0xff9ec0, star: 0xff9f3f, crab: 0xff5a4a, ball: [0xff5a5a, 0xffd23f, 0x4a90ff], leader: 'duck', flag: 0xff5a5a },
  { towel: 0xff7a9c, bucket: 0x5fd068, shell: 0xffd0a0, star: 0xff6f9c, crab: 0xff7a3a, ball: [0xa77bff, 0x5fd068, 0xff9f3f], leader: 'gull', flag: 0xffd23f },
  { towel: 0x5fd068, bucket: 0xff5a5a, shell: 0xc9a7ff, star: 0xffc23f, crab: 0xff5a4a, ball: [0x4a90ff, 0xff8fc0, 0xffd23f], leader: 'duck', flag: 0x4a90ff },
  { towel: 0xffb020, bucket: 0xa77bff, shell: 0xff9ec0, star: 0xff9f3f, crab: 0xff6a5a, ball: [0xff5a5a, 0x5fd068, 0x4a90ff], leader: 'gull', flag: 0x5fd068 },
  { towel: 0xa77bff, bucket: 0xffb020, shell: 0xa8e0ff, star: 0xff7a5c, crab: 0xff5a4a, ball: [0xffd23f, 0x4a90ff, 0xff8fc0], leader: 'duck', flag: 0xff8fc0 },
  { towel: 0xff5a5a, bucket: 0x4ab0ff, shell: 0xffe08a, star: 0xffa53f, crab: 0xff7a3a, ball: [0x5fd068, 0xff5a5a, 0xa77bff], leader: 'gull', flag: 0xa77bff },
];

function makeItem(kind, th = THEMES[0]) {
  const g = new T.Group();
  let m;
  if (kind === 'shell') { m = makeShell(th.shell, 1.15); m.rotation.x = 1.1; m.position.y = 0.45; }
  else if (kind === 'star') { m = makeSeaStar(th.star, 0.55); m.position.y = 0.55; }
  else if (kind === 'crab') { m = makeCrab(th.crab); m.scale.setScalar(0.55); }
  else if (kind === 'ball') { m = makeBeachBall(0.48, th.ball); m.position.y = 0.5; }
  else { m = makeBucket(th.bucket, 0.42, 0.6); m.position.y = 0.02; }
  g.add(m);
  g.userData.kind = kind;
  g.userData.inner = m;
  return g;
}

function makeLeader(th) {
  const g = new T.Group();
  const bird = th.leader === 'duck' ? makeDuck(0.7) : makeGull();
  if (th.leader === 'gull') bird.scale.setScalar(0.6);
  bird.rotation.y = Math.PI / 2 - 0.35; // faces the way the parade marches
  g.add(bird);
  // a little parade flag on a stick
  const flag = makeParadeFlag(th.flag);
  flag.position.set(-0.35, 0.2, 0.3);
  g.add(flag);
  g.userData.flag = flag;
  g.userData.bird = bird;
  return g;
}

// The smallest repeating unit of a sequence (for the "listen again" replay after a wrong tap).
function period(seq) {
  for (let p = 1; p < seq.length; p++) if (seq.every((k, i) => i < p || k === seq[i - p])) return p;
  return seq.length;
}

// Level tables: seq is the full pattern; gap is the index the child fills (default: the last one).
const PLANS = [
  [
    { seq: ['shell', 'star', 'shell', 'star', 'shell'], choices: ['shell', 'star'] },
    { seq: ['crab', 'ball', 'crab', 'ball', 'crab'], choices: ['crab', 'ball'] },
    { seq: ['star', 'shell', 'star', 'shell', 'star', 'shell'], choices: ['shell', 'star'] },
    { seq: ['bucket', 'crab', 'bucket', 'crab', 'bucket'], choices: ['bucket', 'crab'] },
    { seq: ['ball', 'shell', 'ball', 'shell', 'ball', 'shell'], choices: ['shell', 'ball'] },
    { seq: ['shell', 'crab', 'shell', 'crab', 'shell'], choices: ['shell', 'crab'] },
  ],
  [
    { seq: ['shell', 'star', 'shell', 'star', 'shell', 'star'], choices: ['star', 'shell', 'crab'] },
    { seq: ['crab', 'bucket', 'crab', 'bucket', 'crab'], choices: ['crab', 'bucket', 'ball'] },
    { seq: ['ball', 'star', 'ball', 'star', 'ball', 'star'], choices: ['star', 'ball', 'shell'] },
    { seq: ['shell', 'crab', 'shell', 'crab', 'shell'], choices: ['shell', 'crab', 'bucket'] },
    { seq: ['star', 'star', 'crab', 'star', 'star', 'crab'], choices: ['crab', 'star', 'ball'] },
    { seq: ['bucket', 'ball', 'ball', 'bucket', 'ball', 'ball'], choices: ['ball', 'bucket', 'shell'] },
  ],
  [
    { seq: ['shell', 'shell', 'star', 'shell', 'shell', 'star'], choices: ['star', 'shell', 'crab'] },
    { seq: ['crab', 'ball', 'ball', 'crab', 'ball', 'ball'], choices: ['ball', 'crab', 'star'] },
    { seq: ['shell', 'star', 'crab', 'shell', 'star', 'crab'], choices: ['crab', 'shell', 'star'] },
    { seq: ['bucket', 'bucket', 'ball', 'bucket', 'bucket', 'ball', 'bucket'], choices: ['bucket', 'ball', 'crab'] },
    { seq: ['ball', 'crab', 'shell', 'ball', 'crab', 'shell', 'ball'], choices: ['ball', 'crab', 'shell'] },
    { seq: ['star', 'crab', 'star', 'crab', 'star', 'crab'], gap: 1, choices: ['crab', 'star', 'bucket'] },
  ],
];

const STAGE = ['walk', 'train', 'podium'];
const TOWEL_COLS = [null, 0xffb020, 0xa77bff];

export default class PatternsLesson extends Lesson {
  build() {
    // closer in: the parade fills the middle of the screen and the choices sit big at the bottom
    setCamera(new T.Vector3(0, 3.3, 12.8), new T.Vector3(0, 2.0, 0));
    this.pip.position.set(-6.6, 0, -0.5);
    this.plan = PLANS[this.level];
    this.stage = STAGE[this.level];
    if (this.stage === 'walk') { this.walk = makeBoardwalk(ROW_Y, ROW_Z); this.root.add(this.walk); }
    else if (this.stage === 'train') this.root.add(makeTrack(ROW_Y, ROW_Z));
    // striped towel holding the choices (its colour changes every round)
    const towel = makeChoiceTowel(7, 1.8);
    towel.position.set(0, 0.045, TOWEL_Z);   // just above the sand's little ripples
    this.root.add(towel);
    this.towel = towel;
    this.row = [];
    this.choices = [];
    this.bases = []; // per-slot wagons / podiums (levels 2 and 3)
    this.statics = []; // this round's static colliders (the boardwalk's stay for the whole game)
    this.leader = null;
  }

  nudgeTarget() { return this.choices.find((x) => x.userData.kind === this.answer() && x.parent) || null; }
  answer() { const p = this.plan[this.round]; return p.seq[p.gap ?? p.seq.length - 1]; }
  gapIndex() { const p = this.plan[this.round]; return p.gap ?? p.seq.length - 1; }

  slotX(i, n) { const sp = Math.min(1.7, 11.5 / n); return (i - (n - 1) / 2) * sp; }
  // where a thing stands in slot i (world): on the planks, in its wagon, or on its podium
  surfY() { return ROW_Y + (this.stage === 'train' ? 0.09 : 0); }   // train: the wagon floor (wagons ride at ROW_Y - 0.2)

  // Tap area that matches what you see: measured from the item's own bounds at its towel size.
  fitTap(c) {
    const s0 = c.scale.x;
    c.scale.setScalar(CHOICE_S);
    c.updateMatrixWorld(true);
    const box = new T.Box3().setFromObject(c);
    c.scale.setScalar(s0);
    const centre = box.getCenter(new T.Vector3());
    const size = box.getSize(new T.Vector3());
    const offset = centre.sub(c.position);
    // input.js scales radius by 1.25; aim for ~1.1× the visible half-size so neighbours never overlap
    const radius = (Math.max(size.x, size.y) / 2) * 0.9;
    c.userData.hitOffset = offset;
    return input.addTap(c, { radius, offset, onTap: () => this.pick(c) });
  }
  hitPoint(c) { return c.position.clone().add(c.userData.hitOffset || new T.Vector3(0, 0.5, 0)); }

  clearChoices() {
    // Old tap targets must go too: a stale one from an earlier round used to win the hit test
    // (that is how a tap on the bucket was answered with "That's star").
    for (const c of this.choices) { if (c.userData.tap) input.remove(c.userData.tap); c.userData.tap = null; }
  }

  // ---- physics: a thing is thrown so it lands at `to`, bounces and settles (kept upright), then snaps exactly into place.
  // The crab is a character, so it jumps there itself on a ballistic arc instead.
  async landAt(it, to, { time = 0.42, arc = 1.2, maxWait = 0.5, note = true } = {}) {
    if (this.dead || !it.parent) return;
    it.visible = true;
    if (it.userData.kind === 'crab') {
      const from = it.position.clone();
      const top = Math.max(from.y, to.y) + arc - (from.y + to.y) / 2;
      await this.s.anim(time, (_, t) => { it.position.lerpVectors(from, to, t); it.position.y += 4 * top * t * (1 - t); });
      it.position.copy(to);
      sfx.land();
      hop(this.s, it, 0.12, 0.2);
    } else {
      physics.add(it, { shape: 'box', spin: false, bounce: 0.5, friction: 1 });
      const done = physics.toss(it, to, { time, arc, spin: 0 });
      await this.wait(time);
      await Promise.race([this.alive(done), this.wait(maxWait)]);
      physics.remove(it);
      this.s.tween(it.position, { x: to.x, y: to.y, z: to.z }, 0.08);
    }
  }

  async startRound(r) {
    this.busy = true;
    const p = this.plan[r];
    const th = THEMES[r % THEMES.length];
    const gap = this.gapIndex();
    this.clearChoices();
    for (const o of this.choices) this.root.remove(o);
    for (const o of this.row) if (!o.userData.leaving) this.root.remove(o);
    if (this.leader && !this.leader.userData.leaving) this.root.remove(this.leader);
    for (const b of this.bases) if (!b.userData.leaving) this.root.remove(b);
    if (this.marker) this.root.remove(this.marker);
    this.row = []; this.choices = []; this.bases = [];
    // physics: only this round's static shapes go (never physics.clear(): that would freeze anything mid-air)
    this.dropStatics();
    this.towel.userData.setColor(TOWEL_COLS[this.level] && r % 2 ? TOWEL_COLS[this.level] : th.towel);
    const n = p.seq.length;
    const SY = this.surfY();
    // the empty slot: a pulsing ring with a question mark
    const marker = new T.Group();
    const ring = new T.Mesh(geo.ring(0.55, 0.7, 32), new T.MeshBasicMaterial({ color: 0xffffff })); // own material: it changes colour
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = SY + 0.02;
    const q = new T.Group();
    const arc = ink(geo.torus(0.2, 0.07, Math.PI * 1.4, 6, 16));
    arc.rotation.z = -0.5; arc.position.y = 0.15;
    const dot = ink(geo.sphere(0.08, 8, 6)); dot.position.y = -0.3;
    q.add(arc, dot);
    marker.add(ring, q);
    marker.position.set(this.slotX(gap, n), 0, ROW_Z);
    marker.userData = { q, ring, pulse: 0, qy: SY + 0.9 };
    marker.visible = false;
    this.root.add(marker);
    this.marker = marker;
    this.slotPos = new T.Vector3(this.slotX(gap, n), SY, ROW_Z);

    // caption: the pattern in pictures, so a grown-up can chant it
    this.say(p.seq.map((k, i) => (i === gap ? '❓' : ICON[k])).join(' '), { rate: 0.8 });

    const items = [];
    for (let i = 0; i < n; i++) {
      if (i === gap) continue;
      const it = makeItem(p.seq[i], th);
      it.userData.slot = i;
      it.userData.hx = this.slotX(i, n);
      it.userData.baseScale = 1;
      this.root.add(it);
      items.push(it);
    }
    this.row = items;
    const leader = makeLeader(th);
    this.root.add(leader);
    this.leader = leader;
    if (th.leader === 'duck') sfx.quack(); else sfx.gull();

    if (this.stage === 'walk') await this.arriveWalk(items, leader, n, gap);
    else if (this.stage === 'train') await this.arriveTrain(items, leader, n, gap, th);
    else await this.arrivePodiums(items, leader, n, gap, th);
    if (this.dead) return;

    // the marker drops into the empty spot
    marker.visible = true;
    popIn(this.s, marker, 1, 0.3, { sound: false });
    // the choices pop onto the towel
    const xs = p.choices.length === 2 ? [-1.9, 1.9] : [-2.8, 0, 2.8];
    shuffle(p.choices).forEach((k, i) => {
      const c = makeItem(k, th);
      c.position.set(xs[i], 0.1, TOWEL_Z);
      c.userData.baseScale = CHOICE_S;
      this.root.add(c);
      this.choices.push(c);
      c.userData.tap = this.fitTap(c);
      popIn(this.s, c, CHOICE_S, 0.35 + i * 0.08);
    });
    if (this.stage === 'train') await this.playTune(p.seq.map((k, i) => (i === gap ? null : items.find((o) => o.userData.slot === i))), 0.2);
    this.busy = false;
    this.cue();
  }

  // Level 1: the leader marches in along the boardwalk while the things drop onto the planks, one per beat, singing
  async arriveWalk(items, leader, n, gap) {
    if (!this.walkStatics) this.walkStatics = this.walk.userData.statics.map(([x, y, z, sx, sy, sz]) => physics.box(new T.Vector3(x, y, z), new T.Vector3(sx, sy, sz)));
    const hx = this.slotX(n - 1, n) + 1.45;
    leader.position.set(hx - 13, ROW_Y, ROW_Z);
    this.s.anim(0.7, (e, raw) => { leader.position.x = hx - 13 * (1 - e); leader.position.y = ROW_Y + Math.abs(Math.sin(raw * Math.PI * 6)) * 0.28 * (1 - raw); }, Ease.out);
    for (let k = 0; k < 4; k++) this.s.wait(k * BEAT).then(() => (k % 2 ? sfx.drumSoft() : sfx.tick()));
    const beat = 0.2;
    const lands = [];
    for (let i = 0; i < n; i++) {
      const it = items.find((o) => o.userData.slot === i);
      const t0 = 0.1 + i * beat;
      if (!it) { this.s.wait(t0 + 0.4).then(() => { sfx.tick(); this.pulseMarker(); }); continue; }
      it.position.set(it.userData.hx + (Math.random() - 0.5) * 0.8, ROW_Y + 7, ROW_Z);
      it.visible = false;
      this.s.wait(t0 + 0.4).then(() => { sfx.note(NOTE[it.userData.kind]); fx.float(new T.Vector3(it.userData.hx, ROW_Y + 1.2, ROW_Z), '♪', { color: '#ff7a59', size: 4.5 }); });
      lands.push(this.wait(t0).then(() => this.landAt(it, new T.Vector3(it.userData.hx, ROW_Y, ROW_Z), { time: 0.4, arc: 0.4, maxWait: 0.35 })));
    }
    await Promise.all(lands);
  }

  // Level 2: the train chugs in with every thing riding in its own wagon; the empty wagon waits for the answer
  async arriveTrain(items, leader, n, gap, th) {
    const sp = Math.min(1.7, 11.5 / n);
    const carts = [];
    for (let i = 0; i < n; i++) {
      const c = makeCart(i % 2 ? th.flag : th.bucket);
      c.userData.hx = this.slotX(i, n);
      c.userData.slot = i;
      this.root.add(c);
      carts.push(c);
    }
    const eng = makeEngine(th.towel);
    eng.userData.hx = this.slotX(n - 1, n) + sp * 0.5 + 0.95;
    this.root.add(eng);
    carts.push(eng);
    // the leader drives
    leader.userData.bird.scale.multiplyScalar(0.8);
    leader.userData.flag.parent.remove(leader.userData.flag);
    eng.add(leader);
    leader.position.copy(eng.userData.seat);
    leader.rotation.y = 0;
    this.bases = carts;
    this.engine = eng;
    const D = 14, dur = 1.0;
    const riders = items.map((it) => ({ it, cart: carts[it.userData.slot] }));
    sfx.whoosh();
    for (let k = 0; k < 5; k++) this.s.wait(k * 0.2).then(() => (k % 2 ? sfx.drumSoft() : sfx.tick()));
    await this.s.anim(dur, (e) => {
      for (const c of carts) {
        c.position.set(c.userData.hx - D * (1 - e), ROW_Y - 0.2, ROW_Z);
        c.userData.spin?.(-e * 30);
      }
      for (const { it, cart } of riders) it.position.set(cart.position.x, cart.position.y + 0.29, ROW_Z);
      eng.userData.chimney.scale.y = 1 + Math.abs(Math.sin(e * 30)) * 0.3;
    }, Ease.out);
    sfx.trumpetHi?.();
    // the wagons bump into each other as the train stops
    carts.forEach((c, i) => this.s.wait(i * 0.03).then(() => hop(this.s, c, 0.12, 0.2)));
    // the empty wagon becomes a little box the answer can land in (floor top at ROW_Y + 0.09, four walls)
    const g = carts[gap];
    this.statics.push(physics.box(new T.Vector3(g.position.x, ROW_Y, ROW_Z), new T.Vector3(1.3, 0.18, 1.0)));
    for (const dx of [-0.64, 0.64]) this.statics.push(physics.box(new T.Vector3(g.position.x + dx, ROW_Y + 0.4, ROW_Z), new T.Vector3(0.08, 0.8, 1.0)));
    for (const dz of [-0.5, 0.5]) this.statics.push(physics.box(new T.Vector3(g.position.x, ROW_Y + 0.4, ROW_Z + dz), new T.Vector3(1.3, 0.8, 0.08)));
    await this.wait(0.15);
  }

  // Level 3: podiums pop out of the sand, then Gull throws each thing onto its podium, one per beat
  async arrivePodiums(items, leader, n, gap, th) {
    const cols = [th.towel, th.flag, th.bucket];
    for (let i = 0; i < n; i++) {
      const pd = makePodium(cols[i % 3], ROW_Y);
      pd.position.set(this.slotX(i, n), 0, ROW_Z);
      pd.scale.set(1, 0.001, 1);
      this.root.add(pd);
      this.bases.push(pd);
      this.s.wait(i * 0.05).then(() => { sfx.bloop(i % 5); this.s.tween(pd.scale, { y: 1 }, 0.3, Ease.back); });
      this.statics.push(physics.box(new T.Vector3(this.slotX(i, n), ROW_Y - 0.06, ROW_Z), new T.Vector3(1.2, 0.12, 1.2)));
    }
    // the thrower stands at the right end
    const hx = this.slotX(n - 1, n) + 1.6;
    leader.position.set(hx + 6, 0, ROW_Z + 0.4);
    this.s.tween(leader.position, { x: hx }, 0.35, Ease.out);
    await this.wait(0.3);
    const beat = 0.2;
    const lands = [];
    const from = new T.Vector3(hx - 0.3, 1.6, ROW_Z);
    for (let i = n - 1; i >= 0; i--) { // throws right to left, but the tune plays left to right below
      const it = items.find((o) => o.userData.slot === i);
      if (!it) continue;
      const k = n - 1 - i;
      it.visible = false;
      it.position.copy(from);
      lands.push(this.wait(k * 0.09).then(() => { sfx.swoosh(); return this.landAt(it, new T.Vector3(it.userData.hx, ROW_Y, ROW_Z), { time: 0.42, arc: 1.4, maxWait: 0.3 }); }));
    }
    this.s.wait(0.1).then(() => { hop(this.s, leader, 0.3, 0.3); });
    await Promise.all(lands);
    // now the podiums light up left to right with the tune
    for (let i = 0; i < n; i++) {
      const it = items.find((o) => o.userData.slot === i);
      this.s.wait(i * beat).then(() => {
        const pd = this.bases[i];
        hop(this.s, pd.userData.inner, 0.1, 0.18);
        if (it) { sfx.note(NOTE[it.userData.kind]); hop(this.s, it, 0.4, 0.26); } else { sfx.tick(); this.pulseMarker(); }
      });
    }
    await this.wait(n * beat * 0.6);
  }

  // Play the parade as a tune: each thing hops and sings its note in turn. null = the empty slot ("what?").
  async playTune(list, beat = BEAT, { big = null } = {}) {
    for (const o of list) {
      if (this.dead) return;
      if (o) {
        sfx.note(NOTE[o.userData.kind]);
        hop(this.s, o, o === big ? 0.75 : 0.42, Math.max(0.24, beat * 1.4));
        fx.float(o.getWorldPosition(new T.Vector3()).add(new T.Vector3(0, 1.1, 0)), '♪', { color: '#ff7a59', size: 4.5 });
      } else if (this.marker) {
        sfx.tick();
        this.pulseMarker();
      }
      await this.wait(beat);
    }
  }

  dropStatics() { for (const b of this.statics) physics.removeStatic(b); this.statics = []; }

  pulseMarker() { if (this.marker) this.marker.userData.pulse = 1; }

  promptText() { return this.plan[this.round]?.gap !== undefined ? "What's missing? ❓" : 'What comes next? ❓'; }

  async pick(c) {
    if (this.busy || !this.choices.includes(c)) return;
    const k = c.userData.kind;
    sfx.note(NOTE[k]);
    const ans = this.answer();
    if (k !== ans) {
      this.wrong(c);
      this.redirect(`That's the ${NAME[k]}. Find ${ICON[ans]}!`);
      return;
    }
    this.busy = true;
    input.lock(3000);
    this.clearChoices();
    // thrown into the empty spot: it flies, lands, bounces and settles (the crab jumps there itself)
    const to = this.slotPos;
    this.s.tween(c.scale, { x: 1, y: 1, z: 1 }, 0.3);
    c.userData.baseScale = 1;
    sfx.swoosh();
    this.marker.visible = false;
    await this.landAt(c, to, { time: 0.45, arc: 1.8, maxWait: 0.3 });
    c.scale.setScalar(1);
    sfx.pop();
    c.userData.slot = this.gapIndex();
    this.row.push(c);
    this.choices = this.choices.filter((x) => x !== c);
    for (const o of this.choices) popOut(this.s, o, 0.22);
    // the leader cheers, and the finished parade plays the whole pattern as a tune
    const ordered = this.row.slice().sort((a, b) => a.userData.slot - b.userData.slot);
    const flag = this.leader.userData.flag;
    if (flag.parent) this.s.anim(0.9, (_, pr) => { flag.rotation.z = Math.sin(pr * Math.PI * 6) * 0.5; });
    if (this.stage === 'train') { sfx.trumpetHi?.(); hop(this.s, this.engine, 0.2, 0.3); } else hop(this.s, this.leader, 0.5, 0.35);
    this.payoff(ordered, c);
    this.playTune(ordered, 0.15, { big: c }).then(() => { if (!this.dead) sfx.drumLoud(); });
    const p = this.plan[this.round];
    this.busy = false;
    this.success(to.clone().add(new T.Vector3(0, 1, 0)), p.seq.map((x) => ICON[x]).join(' ') + '!');
  }

  // a different little gag each round on top of the tune (≤ 0.9 s)
  payoff(ordered, c) {
    const g = this.round % 4, s = this.s;
    if (g === 0) { // the new one spins with joy
      const inner = c.userData.inner, r0 = inner.rotation.y;
      s.anim(0.6, (e) => { inner.rotation.y = r0 + e * Math.PI * 2; }, Ease.inOut).then(() => (inner.rotation.y = r0));
    } else if (g === 1) { // a wave of sparkles runs along the line
      ordered.forEach((o, i) => s.wait(i * 0.07).then(() => fx.float(o.position.clone().add(new T.Vector3(0, 1.4, 0)), '✦', { color: '#ffb020', size: 4 })));
    } else if (g === 2) { // everyone leans left, right — a little dance
      s.anim(0.8, (_, p) => ordered.forEach((o) => { o.rotation.z = Math.sin(p * Math.PI * 4) * 0.25 * (1 - p); })).then(() => ordered.forEach((o) => (o.rotation.z = 0)));
    } else { // confetti pops out of the new one
      s.wait(0.2).then(() => { fx.confetti(c.position.clone().add(new T.Vector3(0, 0.8, 0)), 18); sfx.pop(); });
    }
  }

  // Wrong tap: the thing shakes its head "no", the empty slot pulses, and the last bit of the parade sings again.
  wrong(c) {
    const inner = c.userData.inner, ry0 = inner.rotation.y, x0 = c.position.x;
    this.s.anim(0.5, (_, pr) => {
      const w = Math.sin(pr * Math.PI * 6) * (1 - pr);
      inner.rotation.y = ry0 + w * 0.6;
      c.position.x = x0 + w * 0.18;
    }).then(() => { inner.rotation.y = ry0; c.position.x = x0; });
    fx.float(this.hitPoint(c).add(new T.Vector3(0, 0.9, 0)), '✕', { color: '#ff5a5a', size: 6 });
    // replay the unit just before the gap (or just after it, for a missing-middle pattern), then "?"
    const p = this.plan[this.round], gap = this.gapIndex(), per = period(p.seq);
    const idx = [];
    if (gap >= per) for (let i = gap - per; i < gap; i++) idx.push(i);
    else for (let i = gap + 1; i <= gap + per && i < p.seq.length; i++) idx.push(i);
    const list = idx.map((i) => this.row.find((o) => o.userData.slot === i)).filter(Boolean);
    if (gap >= per) list.push(null); else list.unshift(null);
    this.s.wait(0.25).then(() => this.playTune(list, 0.2));
  }

  // Tapping a parade member is never an answer: it just sings its note and hops.
  pokeAt(x, y) {
    if (super.pokeAt(x, y)) return true;
    if (this.busy) return false;
    const min = Math.min(innerWidth, innerHeight) * 0.07;
    for (const o of this.row) {
      const p = project(o.getWorldPosition(new T.Vector3()).add(new T.Vector3(0, 0.5, 0)));
      if (Math.hypot(p.x - x, p.y - y) < min) { sfx.note(NOTE[o.userData.kind]); hop(this.s, o, 0.4, 0.3); return true; }
    }
    return false;
  }

  showHint(glow = true) {
    const c = this.choices.find((x) => x.userData.kind === this.answer());
    if (!c) return;
    if (glow) this.addHalo(c, 1.0);
    fx.ghostPath([this.hitPoint(c)], { mode: 'tap' });
  }

  choicePoints() { return [this.slotPos.clone().add(new T.Vector3(0, 0.6, 0)), ...this.choices.map((c) => this.hitPoint(c))]; }

  makeErrorless() {
    for (const c of this.choices) if (c.userData.kind !== this.answer() && c.userData.tap) {
      c.userData.tap.enabled = false;
      this.s.tween(c.scale, { x: 0.55, y: 0.55, z: 0.55 }, 0.4);
    }
  }

  // Round transition: the finished line leaves (marches off / the train chugs away / everyone bounces off the podiums)
  async afterSuccess() {
    if (this.round >= this.totalRounds) return; // the finale sends the last one off
    this.leave(0.75);
    await this.wait(0.15);
  }

  leave(dur, dist = 13) {
    sfx.swoosh();
    if (this.stage === 'train') {
      const movers = [...this.bases, ...this.row];
      for (const o of movers) { o.userData.leaving = true; o.userData.x0 = o.position.x; }
      for (let k = 0; k < 4; k++) this.s.wait(k * 0.15).then(() => (k % 2 ? sfx.drumSoft() : sfx.tick()));
      this.s.anim(dur, (e) => {
        for (const o of movers) o.position.x = o.userData.x0 + dist * e;
        for (const c of this.bases) c.userData.spin?.(-e * 30);
      }, Ease.in).then(() => { for (const o of movers) this.root.remove(o); });
      return;
    }
    const list = [...this.row, this.leader].filter(Boolean);
    for (let k = 0; k < 4; k++) this.s.wait(k * BEAT).then(() => (k % 2 ? sfx.drumSoft() : sfx.tick()));
    for (const o of list) {
      o.userData.leaving = true;
      const x0 = o.position.x, y0 = this.stage === 'podium' && o !== this.leader ? ROW_Y : o.position.y;
      const yEnd = this.stage === 'podium' ? 0 : y0;
      this.s.anim(dur, (e, raw) => {
        o.position.x = x0 + dist * e;
        o.position.y = y0 + (yEnd - y0) * Math.min(1, raw * 2.5) + Math.abs(Math.sin(raw * Math.PI * 8)) * 0.3;
      }, Ease.in).then(() => { this.root.remove(o); });
    }
    if (this.stage === 'podium') for (const pd of this.bases) {
      pd.userData.leaving = true;
      this.s.tween(pd.scale, { y: 0.001 }, 0.35, Ease.in).then(() => this.root.remove(pd));
    }
  }

  update(dt, t) {
    const m = this.marker;
    if (m) {
      const u = m.userData;
      u.pulse = Math.max(0, u.pulse - dt * 2.2);
      const k = 1 + Math.sin(t * 6) * 0.08 + u.pulse * 0.7;
      u.q.position.y = u.qy + Math.sin(t * 4) * 0.12 + u.pulse * 0.5;
      u.q.scale.setScalar(1 + u.pulse * 0.6);
      u.ring.scale.setScalar(k);
      u.ring.material.color.setRGB(1, 1 - u.pulse * 0.25, 1 - u.pulse * 0.7);
    }
    // the waiting parade sways to the beat and the flag flutters
    if (!this.busy) this.row.forEach((o, i) => { o.rotation.z = Math.sin(t * 5 + i * 1.3) * 0.06; });
    if (this.leader) this.leader.userData.flag.rotation.y = Math.sin(t * 7) * 0.3;
    // the engine puffs
    if (this.engine && this.engine.parent) this.engine.userData.chimney.scale.y = 1 + Math.max(0, Math.sin(t * 5)) * 0.15;
  }

  onFinale() {
    // the last line leaves for good, singing its tune as it goes
    const ordered = this.row.slice().sort((a, b) => b.position.x - a.position.x);
    ordered.forEach((o, i) => this.s.wait(0.5 + i * 0.18).then(() => sfx.note(NOTE[o.userData.kind])));
    this.s.wait(0.5).then(() => this.leave(2.4, 16));
  }
}
