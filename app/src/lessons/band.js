// Game 14 — Barn band. Topic mt_2mb17lUCPD "Creating and shaping musical sound".
// Pip plays a few beats; the child copies them. Level 2 adds a quiet instrument (loud vs quiet); Level 3 mixes them.
// Each round brings a new instrument pair (drum, bucket drum, pot and spoon, cowbell: big = loud, small = quiet)
// and a new friend in the audience. A row of beat dots (big red = loud, small blue = quiet) shows how many beats to copy.
// Each level is a different stage with its own instruments and audience: a hay-bale stage (drum, pumpkin, bucket),
// a little red-curtain theatre (pot and spoon, cowbell, milk churn) and an evening concert with fairy lights (all mixed).
// Little things sit on the instruments (corn, peas, berries, buttons…, new each round) and jump with real physics
// when they are played: high for loud, a tiny hop for quiet.
import * as T from '../three.js';
import { Lesson } from '../engine/lesson.js';
import { hop, popIn, popOut, wiggle, setFace } from '../engine/actors.js';
import { makeFarmAnimal } from '../engine/farm.js';
import { disposeTree } from '../engine/toon.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';
import { physics } from '../engine/physics.js';
import { makeHay } from '../engine/scenery.js';
import { makeInstrument, strike, makeDots, setDot, animDots, surface, makeBit, makeStage } from './band-props.js';
import { frame, calmBackdrop } from './view-tools.js';
import { playInstrument } from './band-sound.js';

const PLANS = [
  ['B', 'BB', 'BB', 'BBB', 'B', 'BBB'],
  ['BB', 'ss', 'B', 'sss', 'BBB', 'ss'],
  ['Bs', 'sB', 'BBs', 'ssB', 'BsB', 'BBss'],
];
// the instrument pair for each round
const KINDS = [
  ['drum', 'pumpkin', 'bucket', 'drum', 'pumpkin', 'bucket'],
  ['pot', 'cowbell', 'churn', 'pot', 'churn', 'cowbell'],
  ['churn', 'drum', 'cowbell', 'pumpkin', 'pot', 'bucket'],
];
// what sits on the instruments and jumps when they are played, a new thing each round
const BITS = [
  ['corn', 'peas', 'apples', 'berries', 'eggs', 'buttons'],
  ['berries', 'corn', 'buttons', 'peas', 'apples', 'eggs'],
  ['buttons', 'apples', 'corn', 'eggs', 'berries', 'peas'],
];
// the "what a band!" payoff, never the same twice in a row
const PAYOFF = [
  ['pop', 'notes', 'spin', 'pop', 'spin', 'notes'],
  ['notes', 'pop', 'spin', 'notes', 'pop', 'spin'],
  ['spin', 'notes', 'pop', 'spin', 'pop', 'notes'],
];
const NAMES = { drum: 'drum', bucket: 'bucket drum', pot: 'pot', cowbell: 'bell', pumpkin: 'pumpkin drum', churn: 'milk can' };
const BEAT = 0.5;
const NUM = ['1', '2', '3', '4', '5'];
const POS = { B: new T.Vector3(-0.5, 0, 1.3), s: new T.Vector3(3.4, 0, 1.8) };
const PIP_INST = new T.Vector3(-4.2, 0, 0.1);
const DOTS_AT = new T.Vector3(1.4, 4.1, -0.8); // the beat board, above and behind the drums
// the audience: three seats; one new friend takes a seat each round
const SEATS = [[5.0, -3.4], [7.2, -2.2], [-2.6, -3.6]]; // (back from the quiet instrument, so no friend stands behind it)
// the audience for each level (the first three take their seats, the rest come in one by one)
const POOLS = [['cow', 'hen', 'pig', 'sheep', 'horse'], ['horse', 'sheep', 'chick', 'cow', 'pig'], ['pig', 'chick', 'hen', 'horse', 'sheep', 'cow']];
const FAN_SIZE = { cow: 0.8, hen: 0.7, pig: 0.7, sheep: 0.72, horse: 0.72, chick: 0.95 };
const CALL = { cow: 'moo', hen: 'cluck', pig: 'oink', sheep: 'baa', horse: 'neigh', chick: 'cheep' };

export default class BandLesson extends Lesson {
  build() {
    this.plan = PLANS[this.level];
    this.kinds = KINDS[this.level];
    this.pip.position.set(-5.7, 0, -0.4); // clear of the Level 2 curtain folds behind
    frame(0.4, 3.6, 13, 0.4, 2.3, 0);
    calmBackdrop(this.meadow);
    this.drums = {};
    this.pool = POOLS[this.level];
    this.stage = makeStage(this.level, makeHay);
    this.root.add(this.stage);
    this.fans = this.pool.slice(0, 3).map((k, i) => this.makeFan(k, i, false));
    this.bits = [];
  }

  makeFan(kind, seat, pop = true) {
    const [x, z] = SEATS[seat];
    const a = makeFarmAnimal(kind);
    const sc = FAN_SIZE[kind] || 0.7;
    a.position.set(x, 0, z); a.rotation.y = -x * 0.06;
    a.scale.setScalar(sc);
    const u = a.userData;
    Object.assign(u, { baseScale: sc, seat, ry0: a.rotation.y, headX0: u.head ? u.head.rotation.x : 0, wingR0: (u.wings || []).map((w) => w.rotation.z), armR0: (u.arms || []).map((w) => w.rotation.z) });
    this.root.add(a);
    if (pop) popIn(this.s, a, sc, 0.4, { sound: false });
    return a;
  }

  // a new friend joins the audience each round (with a hello in its own voice)
  swapFan(r) {
    const seat = (r + 2) % 3;
    const have = this.fans.map((f) => f.userData.kind);
    const P = this.pool;
    const kind = P.map((_, j) => P[(r + j) % P.length]).find((k) => !have.includes(k));
    if (!kind) return;
    const old = this.fans[seat];
    // the new friend pops in once the old one has gone, so the two never stand inside each other on the seat
    popOut(this.s, old, 0.18).then(() => {
      this.root.remove(old); disposeTree(old);
      if (this.dead || this.fans[seat] !== old) return;
      this.fans[seat] = this.makeFan(kind, seat);
      this.s.wait(0.1).then(() => sfx[CALL[kind]]?.());
    });
  }

  setInstruments(kind) {
    if (this.kind === kind) return;
    this.kind = kind;
    for (const d of Object.values(this.drums)) { input.remove(d.userData.tap); popOut(this.s, d, 0.18).then(() => { this.root.remove(d); disposeTree(d); }); }
    if (this.pipInst) { const o = this.pipInst; popOut(this.s, o, 0.18).then(() => { this.root.remove(o); disposeTree(o); }); }
    const big = makeInstrument(kind, true), small = makeInstrument(kind, false);
    big.userData.kind = 'B'; small.userData.kind = 's';
    big.position.copy(POS.B); small.position.copy(POS.s);
    this.drums = { B: big, s: small };
    for (const d of [big, small]) {
      this.root.add(d);
      d.visible = d === big || this.level > 0;
      if (d.visible) this.s.wait(d === big ? 0.05 : 0.15).then(() => popIn(this.s, d, 1, 0.4, { sound: d === big }));
      d.userData.tap = input.addTap(d, { radius: d === big ? 1.7 : 1.1, offset: new T.Vector3(0, d.userData.h, 0), onTap: () => this.hit(d.userData.kind) });
      d.userData.tap.enabled = false;
    }
    // Pip plays a little one of the same instrument
    this.pipInst = makeInstrument(kind, true);
    this.pipInst.position.copy(PIP_INST);
    this.pipInst.userData.baseScale = 0.5;
    this.root.add(this.pipInst);
    popIn(this.s, this.pipInst, 0.5, 0.35, { sound: false });
  }

  async startRound(r) {
    this.busy = true;
    this.pat = this.plan[r].split('');
    this.i = 0;
    this.listening = false;
    this.lastHit = 0;
    this.setInstruments(this.kinds[r]);
    if (r > 0) this.swapFan(r);
    this.placeBits(r);
    if (this.dots) { const o = this.dots; popOut(this.s, o, 0.15).then(() => { this.root.remove(o); disposeTree(o); }); }
    this.dots = makeDots(this.pat);
    this.dots.position.copy(DOTS_AT);
    this.root.add(this.dots);
    for (const d of this.dots.userData.dots) setDot(d, 'idle');
    popIn(this.s, this.dots, 1, 0.35, { sound: false });
    await this.wait(0.3);
    this.busy = false;
    this.cue();
  }

  // new little things drop onto the instruments (into a bowl-shaped catcher on each playing surface)
  placeBits(r) {
    // last round's little things hop off and pop (no physics.clear(): nothing freezes mid-air), their catchers go
    this.bits.forEach((b, i) => {
      physics.remove(b);
      const y0 = b.position.y, k = b.scale.x;
      this.s.wait(i * 0.025).then(() => this.s.anim(0.22, (_, p) => { b.position.y = y0 + Math.sin(p * Math.PI) * 0.5; b.scale.setScalar(Math.max(0.001, k * (1 - p))); }))
        .then(() => { this.root.remove(b); disposeTree(b); });
    });
    if (this.bits.length) this.s.wait(0.05).then(() => sfx.pop());
    this.bits = [];
    for (const c of this.catchers || []) physics.removeStatic(c);
    this.catchers = [];
    const kind = BITS[this.level][r % 6];
    for (const d of Object.values(this.drums)) {
      d.userData.bits = [];
      const sf = surface(d);
      if (!d.visible || !sf) continue;
      const [sh, sr] = sf;
      this.catchers.push(physics.container(new T.Vector3(d.position.x, sh - 0.05, d.position.z), { r: sr, h: 3.5, floor: 0.05 }));
      // the milk churn's knob stands up in the middle of its lid: solid, so nothing rests inside it
      const k = d.userData.inst === 'churn' ? d.userData.r / 0.5 : 0;
      if (k) this.catchers.push(physics.box(new T.Vector3(d.position.x, sh + 0.1 * k, d.position.z), new T.Vector3(0.28 * k, 0.3 * k, 0.28 * k)));
      const n = d.userData.kind === 'B' ? 4 : 3;
      for (let i = 0; i < n; i++) {
        const b = makeBit(kind, i);
        const a = (i / n) * Math.PI * 2 + r;
        b.position.set(d.position.x + Math.cos(a) * sr * 0.45, sh + 1.2 + i * 0.3, d.position.z + Math.sin(a) * sr * 0.45);
        b.visible = false;
        this.root.add(b);
        d.userData.bits.push(b); this.bits.push(b);
        this.s.wait(0.3 + i * 0.07).then(() => { b.visible = true; physics.add(b, { shape: 'ball', r: b.userData.bitR, bounce: 0.45, mass: 0.3 }); });
      }
    }
  }
  // the little things on an instrument jump: high when it's loud, a tiny hop when it's quiet
  jumpBits(d, loud, k = 1) { for (const b of d.userData.bits || []) physics.poke(b, (loud ? 1.0 : 0.32) * k); }

  promptText() {
    const name = NAMES[this.kind] || 'drum';
    if (this.level === 0) return 'Copy Pip! ' + this.pat.map(() => 'Boom!').join(' ');
    if (this.level === 1) return this.pat[0] === 'B' ? `Loud ${name}! Copy Pip!` : `Quiet ${name}! Copy Pip!`;
    return 'Listen… now you!';
  }

  // the prompt is Pip playing the beats (each lights a beat dot and flashes the instrument to copy), then "Your turn!"
  async prompt() {
    const token = (this.playTok = (this.playTok || 0) + 1);
    this.listening = true;
    this.i = 0;
    for (const d of Object.values(this.drums)) d.userData.tap.enabled = false;
    const dots = this.dots.userData.dots;
    for (const d of dots) setDot(d, 'idle');
    await this.say(this.promptText(), { max: this.level === 0 ? 0.45 : 0.9 });
    for (const [j, k] of this.pat.entries()) {
      if (this.dead || token !== this.playTok) return;
      this.pipHit(k, dots[j]);
      await this.wait(BEAT);
    }
    if (this.dead || token !== this.playTok) return;
    this.listening = false;
    for (const d of dots) setDot(d, 'idle');
    for (const d of Object.values(this.drums)) d.userData.tap.enabled = d.visible && !d.userData.off;
    this.say('Your turn!', { max: 0.6 });
    sfx.twinkle();
    for (const d of Object.values(this.drums)) if (d.visible && !d.userData.off) hop(this.s, d, 0.25, 0.3);
    this.idle = 0;
  }

  cue() {
    if (this.dead || this.busy) return;
    fx.clearHands();
    this.prompt().then(() => {
      if (this.busy || this.dead || this.listening) return;
      if (!this.demoDone) { this.demoDone = true; this.playDemo(); }
    });
  }
  hint() { this.prompt(); }

  popDot(d, state) {
    if (!d) return;
    setDot(d, state);
    const b = 1;
    this.s.anim(0.3, (_, p) => d.scale.setScalar(b + Math.sin(p * Math.PI) * (d.userData.loud ? 0.45 : 0.3))).then(() => d.scale.setScalar(b));
  }

  pipHit(k, dot) {
    const loud = k === 'B';
    playInstrument(this.kind, loud);
    const pip = this.pip, w = pip.userData.wings[1];
    this.s.anim(0.22, (_, p) => { w.rotation.z = 0.3 + Math.sin(p * Math.PI) * (loud ? 1.5 : 0.7); });
    hop(this.s, pip, loud ? 0.3 : 0.1, 0.22);
    this.squash(this.pipInst, loud ? 0.75 : 0.9, 0.5);
    strike(this.s, this.pipInst, loud);
    // light the instrument to copy, and this beat's dot
    const d = this.drums[k];
    if (d.visible) { this.squash(d, 0.94, 1); strike(this.s, d, loud); this.jumpBits(d, loud, 0.8); }
    this.popDot(dot, 'lit');
    this.s.wait(0.35).then(() => { if (this.listening && dot.userData.state === 'lit') setDot(dot, 'done'); });
    fx.float(this.pipInst.position.clone().add(new T.Vector3(0, 1.6, 0)), loud ? '♪' : '♩', { color: loud ? '#ff5a5a' : '#4a90ff', size: loud ? 8 : 5 });
    for (const f of this.fans) this.react(f, loud ? 'loud' : 'soft', 0.4);
  }

  squash(o, k, base) {
    this.s.anim(0.25, (_, p) => { const q = 1 - (1 - k) * Math.sin(p * Math.PI) * (1 - p * 0.3); o.scale.set(base / Math.sqrt(q), base * q, base / Math.sqrt(q)); }).then(() => o.scale.setScalar(base));
  }

  // ---------- the audience, each in character ----------
  react(f, mode, amt = 1) {
    const s = this.s, u = f.userData, kind = u.kind;
    const face = u.face;
    if (mode === 'loud' || mode === 'soft') {
      const big = (mode === 'loud' ? 1 : 0.4) * amt;
      if (kind === 'hen') { this.flap(f, 0.35, big * 1.2); hop(s, f, 0.35 * big, 0.3); }
      else if (kind === 'cow' || kind === 'horse') this.nod(f, 0.3 * big + 0.05, 0.35);
      else if (kind === 'pig') { wiggle(s, f, 0.18 * big + 0.03, 0.35); if (u.tail) s.anim(0.35, (_, p) => (u.tail.rotation.y = p * Math.PI * 2)); }
      else hop(s, f, 0.35 * big + 0.05, 0.3);
      return;
    }
    if (mode === 'tooLoud') {
      // wow, too loud! big eyes, arms up to the ears, a little cower
      if (face) setFace(face, 'scared');
      this.arms(f, 2.4, 0.7);
      if (kind === 'hen') this.flap(f, 0.6, 1.4);
      const b = u.baseScale;
      s.anim(0.7, (_, p) => { const q = 1 - Math.sin(p * Math.PI) * 0.15; f.scale.set(b / Math.sqrt(q), b * q, b / Math.sqrt(q)); }).then(() => f.scale.setScalar(b));
      s.wait(0.8).then(() => face && setFace(face, 'happy'));
      return;
    }
    if (mode === 'tooSoft') {
      // can't hear it: lean in and listen
      if (face) setFace(face, 'calm');
      s.anim(0.8, (_, p) => { f.rotation.x = Math.sin(p * Math.PI) * 0.3; f.rotation.z = Math.sin(p * Math.PI) * 0.15 * (f.position.x > 0 ? 1 : -1); }).then(() => { f.rotation.x = 0; f.rotation.z = 0; });
      s.wait(0.8).then(() => face && setFace(face, 'happy'));
      return;
    }
    // cheer: their own call and their own dance
    sfx[CALL[kind]]?.();
    if (face) setFace(face, 'happy');
    if (kind === 'hen') { this.flap(f, 0.8, 1.6); hop(s, f, 0.8, 0.45); }
    else if (kind === 'cow') { this.nod(f, 0.35, 0.8, 2); s.anim(0.8, (_, p) => (f.rotation.z = Math.sin(p * Math.PI * 2) * 0.18)).then(() => (f.rotation.z = 0)); }
    else if (kind === 'pig') { hop(s, f, 0.6, 0.45); s.anim(0.6, (e) => (f.rotation.y = u.ry0 + e * Math.PI * 2), Ease.inOut).then(() => (f.rotation.y = u.ry0)); }
    else if (kind === 'horse') s.anim(0.7, (_, p) => { f.rotation.x = -Math.sin(p * Math.PI) * 0.45; f.position.y = Math.sin(p * Math.PI) * 0.3; }).then(() => { f.rotation.x = 0; f.position.y = 0; });
    else hop(s, f, 0.6, 0.38).then(() => hop(s, f, 0.4, 0.3));
    this.arms(f, 2.0, 0.8);
  }
  flap(f, dur, amt) {
    const u = f.userData;
    if (!u.wings) return;
    this.s.anim(dur, (_, p) => u.wings.forEach((w, i) => (w.rotation.z = u.wingR0[i] + (i ? 1 : -1) * Math.abs(Math.sin(p * Math.PI * 5)) * amt))).then(() => u.wings.forEach((w, i) => (w.rotation.z = u.wingR0[i])));
  }
  nod(f, amt, dur, n = 1) {
    const h = f.userData.head, x0 = f.userData.headX0 || 0;
    if (!h) return;
    this.s.anim(dur, (_, p) => (h.rotation.x = x0 + Math.abs(Math.sin(p * Math.PI * n)) * amt)).then(() => (h.rotation.x = x0));
  }
  arms(f, amt, dur) {
    const u = f.userData;
    if (!u.arms) return;
    this.s.anim(dur, (_, p) => u.arms.forEach((a, i) => (a.rotation.z = u.armR0[i] + (i ? 1 : -1) * Math.sin(p * Math.PI) * amt))).then(() => u.arms.forEach((a, i) => (a.rotation.z = u.armR0[i])));
  }

  hit(k) {
    if (this.busy || this.listening) return;
    const d = this.drums[k];
    const loud = k === 'B';
    playInstrument(this.kind, loud);
    this.squash(d, loud ? 0.72 : 0.82, 1);
    strike(this.s, d, loud);
    this.jumpBits(d, loud);
    this.lastHit = performance.now();
    this.idle = 0;
    const dots = this.dots.userData.dots;
    if (k !== this.pat[this.i]) {
      fx.float(d.position.clone().add(new T.Vector3(0, d.userData.h + 1.2, 0)), '♪', { color: '#9a95a6' });
      for (const f of this.fans) this.react(f, loud ? 'tooLoud' : 'tooSoft');
      const nd = dots[this.i];
      if (nd) { const x0 = nd.position.x; this.s.anim(0.4, (_, p) => (nd.position.x = x0 + Math.sin(p * Math.PI * 6) * 0.15 * (1 - p))).then(() => (nd.position.x = x0)); }
      this.redirect(k === 'B' ? "That's loud. Tap quiet!" : "That's quiet. Tap loud!");
      return;
    }
    this.clearHints();
    for (const f of this.fans) this.react(f, loud ? 'loud' : 'soft');
    const dot = dots[this.i];
    this.popDot(dot, 'done');
    // (the dot's own number pops up on the beat board as it fills)
    this.i++;
    if (this.i < this.pat.length) return;
    // whole pattern copied: the dots flash, and the audience cheers in character
    this.busy = true;
    input.lock(1200);
    dots.forEach((x, j) => this.s.wait(0.12 + j * 0.07).then(() => { this.popDot(x, 'lit'); sfx.note(j + 2); }));
    this.fans.forEach((f, j) => this.s.wait(0.15 + j * 0.18).then(() => this.react(f, 'cheer')));
    this.s.wait(0.12).then(() => this.payoff(PAYOFF[this.level][this.round % 6]));
    this.busy = false;
    this.success(d.position.clone().add(new T.Vector3(0, 3, 0)), 'What a band!');
  }

  // a quick, different payoff each round (under 0.9 s)
  payoff(kind) {
    const drums = Object.values(this.drums).filter((d) => d.visible);
    if (kind === 'pop') {
      // everything on the instruments goes flying up like popcorn
      sfx.boing();
      for (const d of drums) this.jumpBits(d, true, 1.45);
      this.s.wait(0.25).then(() => sfx.pop());
    } else if (kind === 'notes') {
      // a fountain of music notes
      sfx.twinkle();
      const syms = ['♪', '♫', '♩', '♬'];
      drums.forEach((d) => { for (let i = 0; i < 4; i++) this.s.wait(i * 0.1).then(() => fx.float(d.position.clone().add(new T.Vector3((i - 1.5) * 0.5, d.userData.h + 0.8, 0.4)), syms[i], { color: ['#ff5a5a', '#4a90ff', '#ffb020', '#5fd068'][i], size: 6 })); });
      for (const d of drums) this.jumpBits(d, false, 2);
    } else {
      // the big instrument does a happy twirl on the spot (it stays on the ground, so the bits land back on it)
      sfx.whoosh();
      const d = this.drums.B, r0 = d.rotation.y;
      this.jumpBits(d, true, 1.25);
      this.s.anim(0.55, (e) => { d.rotation.y = r0 + e * Math.PI * 2; }, Ease.inOut).then(() => { d.rotation.y = r0; sfx.thunk(); });
    }
  }

  update(dt, t) {
    const bl = this.stage.userData.bulbs;
    if (bl) bl.forEach((b, i) => { b.material.emissiveIntensity = 0.35 + Math.max(0, Math.sin(t * 3 + i * 1.3)) * 0.6; });
    // a gentle "one more!" if the child stopped part-way
    if (!this.busy && !this.listening && this.i > 0 && this.i < this.pat.length && this.lastHit && performance.now() - this.lastHit > 2500) {
      this.lastHit = 0;
      this.say(this.pat.length - this.i === 1 ? 'One more!' : 'More!', { max: 0.6 });
    }
    // on the child's turn, the next beat dot breathes so it's clear how many are left
    if (this.dots && !this.busy && !this.listening) {
      const d = this.dots.userData.dots[this.i];
      if (d) d.scale.setScalar(1 + Math.max(0, Math.sin(t * 5)) * 0.15);
    }
    if (this.dots) animDots(this.dots);
  }

  // stuck child: the instrument to play next hops
  nudgeTarget() {
    if (this.busy || this.listening || !this.pat) return null;
    const d = this.drums[this.pat[this.i]];
    return d && d.visible ? d : null;
  }

  showHint(glow = true) {
    const k = this.pat[this.i] || this.pat[0];
    const d = this.drums[k];
    if (glow) this.addHalo(d, 1.6);
    fx.ghostPath([d.position.clone().add(new T.Vector3(0, d.userData.h, 0.3))], { mode: 'tap' });
  }
  choicePoints() { return Object.values(this.drums).filter((d) => d.visible).map((d) => d.position.clone().add(new T.Vector3(0, d.userData.h, 0.3))); }
  makeErrorless() {
    // only the instrument needed next can be played
    const k = this.pat[this.i];
    for (const d of Object.values(this.drums)) { d.userData.off = d.userData.kind !== k && !this.pat.slice(this.i).includes(d.userData.kind); d.userData.tap.enabled = d.visible && !d.userData.off && !this.listening; }
  }
  nextRound() { for (const d of Object.values(this.drums || {})) d.userData.off = false; super.nextRound(); }

  onFinale() {
    for (let i = 0; i < 6; i++) this.s.wait(i * 0.3).then(() => {
      const loud = i % 2 === 0;
      playInstrument(this.kind, loud);
      const d = this.drums[loud || !this.drums.s.visible ? 'B' : 's'];
      strike(this.s, d, loud); this.squash(d, 0.8, 1);
      for (const f of this.fans) this.react(f, loud ? 'loud' : 'soft');
    });
    this.fans.forEach((f, j) => this.s.wait(0.4 + j * 0.3).then(() => this.react(f, 'cheer')));
  }
}
