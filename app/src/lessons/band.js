// Game 14 — Barn band. Topic mt_2mb17lUCPD "Creating and shaping musical sound".
// "Listen to Pip!": Pip plays a few beats on his little instrument; the child copies them on the big one.
// Level 2 adds a quiet instrument (big = loud, little = quiet); Level 3 mixes them (at most three beats).
// A row of beat dots on a board (big red = loud, small blue = quiet) shows how many beats to copy.
// After the last beat she has a few seconds of free jam (every tap plays, no right or wrong) while the friend who
// cheered walks up the steps onto the band riser at the back with a little instrument of its own and stays: the
// BAND GROWS by one player every round (the keepsake tray, SATISFACTION E5) and plays along in the finale, where
// poking the big drum makes every band member play one beat.
// Each level is a different stage: a hay-bale stage (drum, pumpkin drum, bucket drum), a little red-curtain theatre
// (pot and spoon, cowbell, milk can) and an evening concert with fairy lights (all mixed).
// Little things sit on the instruments (corn, peas, berries, buttons…, new each round) and jump with real physics
// when they are played: high for loud, a tiny hop for quiet.
//
// Test hooks (tools/autoplay.js): listening, pat, i, hit(k) with k 'B' (big) / 's' (small), busy.
import { voiceIdle, voiceBusy } from '../engine/speech.js';
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
import { makeTray } from '../engine/keepsake.js';
import { makeInstrument, strike, strikePoint, makeDots, setDot, animDots, surface, makeBit, makeStage, makeStick, makeRiser, RISER } from './band-props.js';
import { frame, calmBackdrop } from './view-tools.js';
import { playInstrument } from './band-sound.js';

const PLANS = [
  ['B', 'BB', 'BB', 'BBB', 'B', 'BBB'],
  ['BB', 'ss', 'B', 'sss', 'BBB', 'ss'],
  ['Bs', 'sB', 'BBs', 'ssB', 'BsB', 'sBs'], // at most three beats: a 2-year-old's working memory
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
// L2 names the object AND the concept, big = loud, little = quiet
const L2_NAME = { pot: 'pot', cowbell: 'bell', churn: 'milk can' };
const COUNT = ['', 'Your turn! One bang!', 'Your turn! Two bangs!', 'Your turn! Three bangs!'];
const BEATS = [0.85, 0.85, 1.0]; // Pip's beats: slow and clear (Level 3 slower still: mixed loud and quiet)
const PHRASE = 2.42;   // (a frame of margin under 2.5 s) Pip's whole turn (his line + his beats) fits in 2.5 s: beats close up (never under MIN_SP) when the line is long
const MIN_SP = 0.5;
const LAND = 0.26;     // the stick lands this long after Pip starts a beat
const JAM_OPEN = 0.7, JAM_IDLE = 1.5, JAM_MAX = 3.5; // the free jam: opens after the win's 0.7 s input lock, ends 1.5 s after her last tap, at most 3.5 s
const OPEN_WAIT = 1.5; // round 1: Pip's first phrase starts at most 1.5 s after the round, even if the opening line is still queued
// layout (stage plane z = 0; camera from frame() below)
const POS = { B: new T.Vector3(-0.5, 0, 1.2), s: new T.Vector3(2.95, 0, 1.6) };
const DOTS_AT = new T.Vector3(1.0, 4.35, -4.3); // the beat board, high up behind the band riser (its posts never tangle with the instruments)
const DOTS_K = 1.15;
const PIP_AT = new T.Vector3(-4.65, 0, -0.2);
const PIP_K = 0.42;                              // Pip's little copy of the round's instrument
// the audience: three friends at the right of the stage, turned toward the band
const SEATS = [[4.75, 1.2], [6.2, -0.4], [7.75, -2.0]];
const SEAT_RY = [-0.55, -0.7, -0.8];
// the band riser at the back (the keepsake tray sits on its top); its steps come down at the right end
const RISER_AT = new T.Vector3(0.3, 0, -3.25);
const SPACING = 1.2;
const MEMBER_K = 0.76;                            // a friend on the riser is a little smaller than in the audience
// the audience for each level: the first three are seated, the next three come in as seats empty
const POOLS = [['cow', 'hen', 'pig', 'sheep', 'horse', 'chick'], ['horse', 'sheep', 'chick', 'cow', 'pig', 'hen'], ['pig', 'chick', 'hen', 'horse', 'sheep', 'cow']];
const FAN_SIZE = { cow: 0.8, hen: 0.72, pig: 0.72, sheep: 0.74, horse: 0.74, chick: 1.3 };
const CALL = { cow: 'moo', hen: 'cluck', pig: 'oink', sheep: 'baa', horse: 'neigh', chick: 'cheep' };

export default class BandLesson extends Lesson {
  build() {
    this.voiceLines = false; // 'What a band!' is praise: caption only
    this.plan = PLANS[this.level];
    this.kinds = KINDS[this.level];
    this.beat = BEATS[this.level];
    this.pip.position.copy(PIP_AT);
    this.pip.rotation.y = 0.3;
    frame(1.0, 3.2, 11.7, 1.0, 2.0, 0);
    // weather behind the play plane, and the meadow's butterflies out of the way (they flew through the band)
    calmBackdrop(this.meadow, { hide: (o) => !!(o.userData && o.userData.wl) });
    this.drums = {};
    this.pool = POOLS[this.level];
    this.stage = makeStage(this.level, makeHay);
    this.root.add(this.stage);
    // the band riser + the keepsake tray on top of it. Spots fill from the far (left) end, and new members come up
    // the steps at the right end, so a friend walking to its spot never passes one already standing there.
    this.riser = makeRiser(this.level, 6, SPACING);
    this.riser.position.copy(RISER_AT);
    this.root.add(this.riser);
    this.tray = makeTray(this, 6, [RISER_AT.x, RISER.top - 0.44, RISER_AT.z - 0.1], { style: 'shelf', spacing: SPACING, scale: 1 });
    this.spotN = 0;                        // spots reserved by friends on their way
    this.addChain = Promise.resolve();     // tray.add in arrival order = reservation order
    // the riser is the shelf: hide the tray's own plank and legs (its empty-spot dimples stay)
    for (const o of this.tray.group.children) if (o.isMesh && o.geometry?.type === 'BoxGeometry') o.visible = false;
    this.band = [];
    this.fans = this.pool.slice(0, 3).map((k, i) => this.makeFan(k, i));
    this.nextFan = 3;
    this.bits = [];
    this.pipSticks();
  }

  // ---------- the audience ----------
  audience() { return this.fans.filter(Boolean); }
  makeFan(kind, seat, from = null) {
    const [x, z] = SEATS[seat];
    const a = makeFarmAnimal(kind);
    const sc = FAN_SIZE[kind] || 0.72;
    a.scale.setScalar(sc);
    const u = a.userData;
    Object.assign(u, { baseScale: sc, seat, ry0: SEAT_RY[seat], headX0: u.head ? u.head.rotation.x : 0, wingR0: (u.wings || []).map((w) => w.rotation.z), armR0: (u.arms || []).map((w) => w.rotation.z) });
    this.root.add(a);
    if (from) {
      // a new friend walks in from the side to the empty seat
      a.position.set(from[0], 0, from[1]);
      u.arrive = this.walkPath(a, [new T.Vector3(x, 0, z)], 2.4).then(() => this.s.tween(a.rotation, { y: u.ry0 }, 0.35, Ease.inOut));
    } else {
      a.position.set(x, 0, z);
      a.rotation.y = u.ry0;
    }
    return a;
  }

  // walk along a list of points (y may change: up the riser steps) at a calm walking pace, facing the way it goes
  async walkPath(o, pts, speed = 2.4) {
    for (const p of pts) {
      if (this.dead) return;
      const a = o.position.clone(), d = Math.hypot(p.x - a.x, p.z - a.z), dy = Math.abs(p.y - a.y);
      if (d < 0.01 && dy < 0.01) continue;
      if (d > 0.05) {
        const want = Math.atan2(p.x - a.x, p.z - a.z), y0 = o.rotation.y;
        let dif = want - y0; while (dif > Math.PI) dif -= Math.PI * 2; while (dif < -Math.PI) dif += Math.PI * 2;
        if (Math.abs(dif) > 0.15) await this.s.tween(o.rotation, { y: y0 + dif }, Math.min(0.4, Math.abs(dif) * 0.25), Ease.inOut);
      }
      const hop = p.hop || 0; // a hop up a step
      await this.s.anim(Math.max(hop ? 0.38 : 0.35, (d + dy) / speed), (_, q) => { o.position.lerpVectors(a, p, q); if (hop) o.position.y = a.y + (p.y - a.y) * Math.min(1, q * 1.6) + Math.sin(q * Math.PI) * hop; });
      o.position.copy(p);
    }
  }

  // ---------- Pip and his drumstick ----------
  // A drumstick in Pip's right wing. Each round his little instrument is placed where the stick's tip comes down,
  // so every beat really lands on it.
  pipSticks() {
    const pip = this.pip, w = pip.userData.wings?.[1];
    this.pipWing = w;
    if (!w) return;
    this.wingR0 = w.rotation.z;
    pip.updateMatrixWorld(true);
    const st = makeStick();
    // grip at the wing tip, pointing out, forward and down (model space of Pip)
    const hand = new T.Vector3(0.7, 0.58, 0.16);
    const dir = new T.Vector3(0.62, -0.32, 0.72).normalize();
    st.position.copy(hand);
    st.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), dir);
    pip.add(st);
    pip.updateMatrixWorld(true);
    w.attach(st);
    this.stick = st;
    this.stickTip = st.userData.tip;
  }
  // wing angle (added to the rest angle) at which the stick tip comes down to world height y
  tipAt(a) { this.pipWing.rotation.z = this.wingR0 + a; this.pip.updateMatrixWorld(true); return this.stickTip.getWorldPosition(new T.Vector3()); }
  placePipInst(o) {
    if (!this.pipWing) { o.position.set(PIP_AT.x + 1.3, 0, PIP_AT.z + 0.7); return; }
    // the point to hit, in the instrument's own (scaled) space (the bell: its left face, the stick passes behind the
    // A-frame's front leg)
    const sp = strikePoint(o).multiplyScalar(PIP_K);
    let best = 0, bd = Infinity;
    for (let a = -1.2; a <= 0.6; a += 0.02) { const p = this.tipAt(a); const d = Math.abs(p.y - (sp.y + 0.03)); if (d < bd) { bd = d; best = a; } }
    const tip = this.tipAt(best);
    this.hitA = best;
    this.restA = best - 0.55;           // the stick waits up in the air, ready
    this.pipWing.rotation.z = this.wingR0 + this.restA;
    o.position.set(tip.x - sp.x, 0, tip.z - sp.z);
  }

  // ---------- instruments ----------
  async setInstruments(kind) {
    const old = [...Object.values(this.drums), this.pipInst].filter(Boolean);
    for (const d of Object.values(this.drums)) input.remove(d.userData.tap);
    this.kind = kind;
    // the old pair goes first, so old and new never stand inside each other
    if (old.length) {
      await Promise.all(old.map((o) => popOut(this.s, o, 0.18)));
      for (const o of old) { this.root.remove(o); disposeTree(o); }
    }
    if (this.dead) return;
    const big = makeInstrument(kind, true), small = makeInstrument(kind, false);
    big.userData.kind = 'B'; small.userData.kind = 's';
    big.position.copy(POS.B); small.position.copy(POS.s);
    this.drums = { B: big, s: small };
    for (const d of [big, small]) {
      this.root.add(d);
      d.visible = d === big || this.level > 0;
      if (d.visible) popIn(this.s, d, 1, 0.45, { sound: false });
      d.userData.tap = input.addTap(d, { radius: d === big ? 1.7 : 1.15, offset: new T.Vector3(0, d.userData.h * 0.75, 0), onTap: () => this.hit(d.userData.kind) });
      d.userData.tap.enabled = false;
    }
    // Pip plays a little one of the same instrument (no spoon of its own: his stick plays it)
    this.pipInst = makeInstrument(kind, true, { pip: true });
    this.pipInst.userData.baseScale = PIP_K;
    this.root.add(this.pipInst);
    this.placePipInst(this.pipInst);
    popIn(this.s, this.pipInst, PIP_K, 0.35, { sound: false });
  }

  async startRound(r) {
    this.busy = true;
    // taps reach the instruments during Pip's phrase too (pokes only), even before the first Go!
    input.setReady(() => this.listening || !this.goPending || this.canGo());
    this.pat = this.plan[r].split('');
    this.i = 0;
    this.listening = false;
    this.lastHit = 0;
    this.jam = false;
    this.cheerer = null;
    const oldDots = this.dots;
    if (oldDots) popOut(this.s, oldDots, 0.15).then(() => { this.root.remove(oldDots); disposeTree(oldDots); });
    this.clearBits();
    await this.setInstruments(this.kinds[r]);
    if (this.dead) return;
    this.placeBits(r);
    this.dots = makeDots(this.pat);
    this.dots.position.copy(DOTS_AT);
    this.dots.userData.k = DOTS_K;
    this.root.add(this.dots);
    for (const d of this.dots.userData.dots) setDot(d, 'idle');
    popIn(this.s, this.dots, DOTS_K, 0.35, { sound: false });
    // straight on: "Listen to Pip!" starts while the new things settle (his beats wait for the line to finish)
    this.busy = false;
    this.cue();
  }

  // last round's little things hop off and pop (no physics.clear(): nothing freezes mid-air), their catchers go
  clearBits() {
    this.bits.forEach((b, i) => {
      physics.remove(b);
      const y0 = b.position.y, k = b.scale.x;
      this.s.wait(i * 0.03).then(() => this.s.anim(0.3, (_, p) => { b.position.y = y0 + Math.sin(p * Math.PI) * 0.4; b.scale.setScalar(Math.max(0.001, k * (1 - p))); }))
        .then(() => { this.root.remove(b); disposeTree(b); });
    });
    this.bits = [];
    for (const c of this.catchers || []) physics.removeStatic(c);
    this.catchers = [];
  }
  // new little things drop onto the instruments (into a bowl-shaped catcher on each playing surface)
  placeBits(r) {
    const kind = BITS[this.level][r % 6];
    for (const d of Object.values(this.drums)) {
      d.userData.bits = [];
      const sf = surface(d);
      if (!d.visible || !sf) continue;
      const [sh, sr] = sf;
      this.catchers.push(physics.container(new T.Vector3(d.position.x, sh - 0.05, d.position.z), { r: sr, h: 3.5, floor: 0.05 }));
      const big = d.userData.kind === 'B';
      // a little lid (milk can, pumpkin) holds one thing; a little drum or pot two; a big one four
      const n = big ? 4 : sr < 0.45 ? 1 : 2;
      for (let i = 0; i < n; i++) {
        const b = makeBit(kind, i);
        const a = (i / n) * Math.PI * 2 + r;
        const rr = n === 1 ? 0 : sr * 0.42;
        b.position.set(d.position.x + Math.cos(a) * rr, sh + 0.9 + i * 0.3, d.position.z + Math.sin(a) * rr);
        b.visible = false;
        this.root.add(b);
        d.userData.bits.push(b); this.bits.push(b);
        // buttons are flat discs: they get their real (hull) shape, so they lie flat instead of standing on edge
        const opts = b.userData.flat ? { bounce: 0.3, mass: 0.3 } : { shape: 'ball', r: b.userData.bitR, bounce: 0.45, mass: 0.3 };
        this.s.wait(0.25 + i * 0.12).then(() => { if (this.dead || !b.parent) return; b.visible = true; physics.add(b, opts); });
      }
    }
  }
  // the little things on an instrument jump: high when it's loud, a tiny hop when it's quiet
  jumpBits(d, loud, k = 1) { for (const b of d.userData.bits || []) physics.poke(b, (loud ? 1.0 : 0.32) * k * (b.userData.flat ? 0.6 : 1)); }

  // ---------- the words ----------
  // before Pip plays
  promptText() {
    if (this.level === 1) {
      const name = L2_NAME[this.kind] || 'pot';
      return this.pat[0] === 'B' ? `Big ${name}! Loud!` : `Little ${name}! Quiet!`;
    }
    return 'Listen to Pip!';
  }
  // after Pip plays: Level 1 says how many
  turnText() { return this.level === 0 ? COUNT[this.pat.length] || 'Your turn!' : 'Your turn!'; }

  // The prompt is Pip playing the beats (each lights a beat dot and flashes the instrument to copy), then "Your turn!".
  // When she has already started (some beats tapped) a repeat never wipes her dots: just "One more!" / "More!".
  async prompt(opts = {}) {
    if (this.listening || this.dead) return;
    if (this.i > 0 && !this.busy) {
      const left = this.pat.length - this.i;
      this.say(left === 1 ? 'One more!' : 'More!', { max: 0.6, repeat: !!opts.repeat });
      return;
    }
    const token = (this.playTok = (this.playTok || 0) + 1);
    this.listening = true;
    this.i = 0;
    // her taps stay live: a poke during Pip's phrase just makes the instrument wobble (it never counts, never stops him)
    for (const d of Object.values(this.drums)) d.userData.tap.enabled = d.visible;
    const dots = this.dots.userData.dots;
    for (const d of dots) setDot(d, 'idle');
    const t0 = performance.now(), n = this.pat.length;
    this.turnT0 = t0;
    // the line before Pip plays: spoken, unless the narrator is still busy (then a caption, so Pip never waits long)
    this.say(this.promptText(), voiceBusy() ? { voice: false } : {});
    // the beats never play over the narrator, unless that would push his phrase past 2.5 s (the cap wins)
    await this.alive(Promise.race([voiceIdle(0.05), this.wait(Math.max(0.05, PHRASE - LAND - 0.1 - (n - 1) * MIN_SP))]));
    if (this.dead || token !== this.playTok) return;
    const e = (performance.now() - t0) / 1000;
    const sp = n > 1 ? Math.max(MIN_SP, Math.min(this.beat, (PHRASE - e - LAND - 0.1) / (n - 1))) : 0;
    this.sp = sp;
    for (const [j, k] of this.pat.entries()) {
      if (this.dead || token !== this.playTok) return;
      this.pipHit(k, dots[j]);
      await this.wait(j < n - 1 ? sp : LAND + 0.1); // after the last beat: her turn as soon as it lands
    }
    if (this.dead || token !== this.playTok) return;
    this.listening = false;
    for (const d of dots) setDot(d, 'idle');
    for (const d of Object.values(this.drums)) d.userData.tap.enabled = d.visible && !d.userData.off;
    this.say(this.turnText(), { max: 0.6 });
    // the instruments she can play squash once on the spot (a hop would throw the little things off)
    for (const d of Object.values(this.drums)) if (d.visible && !d.userData.off) this.squash(d, 0.9, 1);
    this.idle = 0;
  }

  async cue() {
    if (this.dead || this.busy) return;
    // the game's opening line ("Let's play drums!") finishes first, so Pip's own phrase stays short (2.5 s);
    // meanwhile her pokes already make the instruments wobble (listening = pokes only)
    if (voiceBusy()) {
      this.listening = true;
      for (const d of Object.values(this.drums)) d.userData.tap.enabled = d.visible;
      // ...but never more than 1.5 s after the round started: then Pip begins anyway
      const left = Math.max(0, OPEN_WAIT - (performance.now() - this.cur.t0) / 1000);
      await this.alive(Promise.race([voiceIdle(0.05), this.wait(left)]));
      this.listening = false;
      if (this.dead || this.busy) return;
    }
    this.prompt().then(() => {
      if (this.busy || this.dead || this.listening) return;
      if (!this.demoDone) { this.demoDone = true; this.playDemo(); }
    });
  }
  hint() { this.prompt(); }

  popDot(d, state) {
    if (!d) return;
    setDot(d, state);
    this.s.anim(0.3, (_, p) => d.scale.setScalar(1 + Math.sin(p * Math.PI) * (d.userData.loud ? 0.12 : 0.2))).then(() => d.scale.setScalar(1));
  }

  // Pip's beat: the stick comes down on his little instrument
  pipHit(k, dot) {
    const loud = k === 'B';
    const w = this.pipWing;
    if (w) {
      const up = this.restA - (loud ? 0.35 : 0.1), hitA = this.hitA, base = this.wingR0;
      this.s.anim(0.16, (_, p) => { w.rotation.z = base + this.restA + (up - this.restA) * Math.sin(p * Math.PI / 2); })
        .then(() => this.s.anim(0.1, (_, p) => { w.rotation.z = base + up + (hitA - up) * p * p; }))
        .then(() => {
          if (this.dead) return;
          playInstrument(this.kind, loud);
          this.squash(this.pipInst, loud ? 0.78 : 0.9, PIP_K);
          strike(this.s, this.pipInst, loud);
          return this.s.anim(0.3, (_, p) => { w.rotation.z = base + hitA + (this.restA - hitA) * Ease.out(p); });
        });
    } else {
      playInstrument(this.kind, loud);
      this.squash(this.pipInst, loud ? 0.78 : 0.9, PIP_K);
      strike(this.s, this.pipInst, loud);
    }
    // light the instrument to copy, and this beat's dot (as the stick lands)
    this.s.wait(LAND).then(() => {
      if (this.dead) return;
      const d = this.drums[k];
      if (d.visible) { this.squash(d, 0.94, 1); strike(this.s, d, loud); this.jumpBits(d, loud, 0.8); }
      this.popDot(dot, 'lit');
      for (const f of this.audience()) this.react(f, loud ? 'loud' : 'soft', 0.4);
      for (const m of this.band) this.nod(m.userData.animal, loud ? 0.22 : 0.1, 0.45);
    });
    this.s.wait(Math.min(0.85, (this.sp || 0.85) + 0.15)).then(() => { if (this.listening && dot.userData.state === 'lit') setDot(dot, 'done'); });
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
      if (kind === 'hen') { this.flap(f, 0.35, big * 0.6); hop(s, f, 0.3 * big, 0.5); }
      else if (kind === 'cow' || kind === 'horse') this.nod(f, 0.3 * big + 0.05, 0.55);
      else if (kind === 'pig') wiggle(s, f, 0.16 * big + 0.03, 0.55);
      else hop(s, f, 0.3 * big + 0.05, 0.5);
      return;
    }
    if (mode === 'tooLoud') {
      // wow, too loud! big eyes, arms up to the ears, a little cower
      if (face) setFace(face, 'scared');
      this.arms(f, 1.6, 0.7);
      if (kind === 'hen') this.flap(f, 0.6, 0.6);
      const b = u.baseScale;
      s.anim(0.7, (_, p) => { const q = 1 - Math.sin(p * Math.PI) * 0.12; f.scale.set(b / Math.sqrt(q), b * q, b / Math.sqrt(q)); }).then(() => f.scale.setScalar(b));
      s.wait(0.8).then(() => face && setFace(face, 'happy'));
      return;
    }
    if (mode === 'tooSoft') {
      // can't hear it: lean in and listen
      if (face) setFace(face, 'calm');
      s.anim(0.8, (_, p) => { f.rotation.x = Math.sin(p * Math.PI) * 0.25; }).then(() => { f.rotation.x = 0; });
      s.wait(0.8).then(() => face && setFace(face, 'happy'));
      return;
    }
    // cheer: its own dance and its own call
    sfx[CALL[kind]]?.();
    if (face) setFace(face, 'joy');
    if (kind === 'hen') { this.flap(f, 0.8, 0.7); hop(s, f, 0.6, 0.45); }
    else if (kind === 'cow') { this.nod(f, 0.35, 0.8, 2); s.anim(0.8, (_, p) => (f.rotation.z = Math.sin(p * Math.PI * 2) * 0.15)).then(() => (f.rotation.z = 0)); }
    else if (kind === 'pig') { hop(s, f, 0.5, 0.45); s.anim(0.7, (e) => (f.rotation.y = u.ry0 + e * Math.PI * 2), Ease.inOut).then(() => (f.rotation.y = u.ry0)); }
    else if (kind === 'horse') s.anim(0.7, (_, p) => { f.rotation.x = -Math.sin(p * Math.PI) * 0.35; f.position.y = Math.sin(p * Math.PI) * 0.25; }).then(() => { f.rotation.x = 0; f.position.y = 0; });
    else hop(s, f, 0.5, 0.38).then(() => hop(s, f, 0.3, 0.3));
    this.arms(f, 1.4, 0.8);
    s.wait(1.2).then(() => face && setFace(face, 'happy'));
  }
  flap(f, dur, amt) {
    const u = f.userData;
    if (!u.wings || !u.wingR0) return;
    this.s.anim(dur * 1.6, (_, p) => u.wings.forEach((w, i) => (w.rotation.z = u.wingR0[i] + (i ? -1 : 1) * Math.abs(Math.sin(p * Math.PI * 2)) * amt))).then(() => u.wings.forEach((w, i) => (w.rotation.z = u.wingR0[i])));
  }
  nod(f, amt, dur, n = 1) {
    const h = f && f.userData.head, x0 = f?.userData.headX0 || 0;
    if (!h || f.userData.nodding) return;
    f.userData.nodding = true;
    this.s.anim(dur, (_, p) => (h.rotation.x = x0 + Math.abs(Math.sin(p * Math.PI * n)) * amt)).then(() => { h.rotation.x = x0; f.userData.nodding = false; });
  }
  arms(f, amt, dur) {
    const u = f.userData;
    if (!u.arms || !u.armR0) return;
    this.s.anim(dur, (_, p) => u.arms.forEach((a, i) => (a.rotation.z = u.armR0[i] + (i ? -1 : 1) * Math.sin(p * Math.PI) * amt))).then(() => u.arms.forEach((a, i) => (a.rotation.z = u.armR0[i])));
  }

  // ---------- her taps ----------
  hit(k) {
    const d = this.drums[k];
    if (!d || !d.visible) return;
    const loud = k === 'B';
    if (this.jam) {
      // free jam: every tap plays, nothing is right or wrong; the audience and the band nod along
      this.jamLast = performance.now();
      playInstrument(this.kind, loud);
      this.squash(d, loud ? 0.75 : 0.85, 1);
      strike(this.s, d, loud);
      this.jumpBits(d, loud);
      for (const f of this.audience()) if (f !== this.cheerer) this.react(f, loud ? 'loud' : 'soft', 0.6);
      for (const m of this.band) this.nod(m.userData.animal, loud ? 0.25 : 0.12, 0.45);
      return;
    }
    if (this.listening) { this.pokeInst(d); return; }
    if (this.busy) return;
    playInstrument(this.kind, loud);
    this.squash(d, loud ? 0.72 : 0.82, 1);
    strike(this.s, d, loud);
    this.jumpBits(d, loud);
    this.lastHit = performance.now();
    this.idle = 0;
    const dots = this.dots.userData.dots;
    if (k !== this.pat[this.i]) {
      for (const f of this.audience()) this.react(f, loud ? 'tooLoud' : 'tooSoft');
      const nd = dots[this.i];
      if (nd) { const x0 = nd.position.x; this.s.anim(0.4, (_, p) => (nd.position.x = x0 + Math.sin(p * Math.PI * 6) * 0.15 * (1 - p))).then(() => (nd.position.x = x0)); }
      this.redirect(loud ? 'Too loud! Tap the little one!' : 'Too quiet! Tap the big one!');
      return;
    }
    this.clearHints();
    for (const f of this.audience()) this.react(f, loud ? 'loud' : 'soft');
    for (const m of this.band) this.nod(m.userData.animal, loud ? 0.2 : 0.1, 0.45);
    this.popDot(dots[this.i], 'done');
    this.i++;
    if (this.i < this.pat.length) return;
    // whole pattern copied: the dots flash in order, ONE friend cheers in character and then joins the band,
    // and she has a few seconds to jam (every tap plays) while it walks up to the riser
    dots.forEach((x, j) => this.s.wait(0.25 + j * 0.18).then(() => this.popDot(x, 'lit')));
    const fan = this.fans[this.round % 3] || this.fans.find(Boolean);
    this.cheerer = fan;
    if (fan) this.s.wait(0.45).then(() => { if (!this.dead) this.react(fan, 'cheer'); });
    // the jam: it opens once the win's short input lock is over (JAM_OPEN), lasts while she keeps tapping, ends
    // 1.5 s after her last jam tap (or 1.5 s after it opens if she doesn't tap), and never runs past 3.5 s
    this.jam = true;
    this.jamOpen = performance.now() + JAM_OPEN * 1000;
    this.jamLast = 0;
    this.jamDone = new Promise((res) => { this.jamRes = res; });
    for (const x of Object.values(this.drums)) { x.userData.off = false; x.userData.tap.enabled = x.visible; }
    this.joinP = fan ? this.wait(1.8).then(() => this.joinBand(fan)) : null;
    this.payoffP = this.jamDone;
    this.success(d.position.clone().add(new T.Vector3(0, 3, 0)), 'What a band!', { still: 0 });
  }

  // a poke while Pip is playing: the instrument answers with a small silent wobble (no sound, no bits jumping),
  // so it never muddles his pattern and never counts as a beat
  pokeInst(d) {
    if (d.userData.poking) return;
    d.userData.poking = true;
    const z0 = d.rotation.z;
    this.s.anim(0.4, (_, p) => { d.rotation.z = z0 + Math.sin(p * Math.PI * 3) * 0.05 * (1 - p); }).then(() => { d.rotation.z = z0; d.userData.poking = false; });
    this.squash(d, 0.95, 1);
  }

  // the friend who cheered walks up the steps onto the riser, a little instrument of the round pops in front of it,
  // and it stays there for the rest of the level; a new friend comes in to the empty seat
  async joinBand(fan) {
    if (this.dead) return;
    const seat = fan.userData.seat;
    this.fans[seat] = null;
    // a friend still walking in to its seat finishes arriving first (its walk moves it, not the band group)
    if (fan.userData.arrive) { const p = fan.userData.arrive; fan.userData.arrive = null; await this.alive(p); }
    if (this.nextFan < this.pool.length) {
      const kind = this.pool[this.nextFan++];
      this.s.wait(0.6).then(() => { if (!this.dead) this.fans[seat] = this.makeFan(kind, seat, [10.2, SEATS[seat][1]]); });
    }
    const kind = this.kind;
    // the friend inside a member group (so the tray can carry the pair as one)
    const m = new T.Group();
    m.position.copy(fan.position);
    m.rotation.y = fan.rotation.y;
    this.root.add(m);
    fan.position.set(0, 0, 0); fan.rotation.y = 0;
    m.add(fan);
    m.userData.animal = fan;
    const k0 = fan.scale.x, k1 = k0 * MEMBER_K;
    // the path: to the foot of the steps, up the steps, along the riser top to the next free spot
    const spot = this.tray.spot(this.spotN++);
    // up the three steps one hop at a time (each step's middle), then onto the riser top
    const z = RISER_AT.z - 0.1, x0 = RISER_AT.x + RISER.stepsX, sw = RISER.stepsW / 3;
    const foot = new T.Vector3(x0 + RISER.stepsW + 0.45, 0, z);
    const steps = RISER.steps.map((h, j) => Object.assign(new T.Vector3(x0 + (j + 0.5) * sw, h, z), { hop: 0.28 })).reverse();
    const top = Object.assign(new T.Vector3(x0 - 0.3, RISER.top, z), { hop: 0.28 });
    const shrink = this.s.anim(1.6, (e) => fan.scale.setScalar(k0 + (k1 - k0) * e), Ease.inOut).then(() => { fan.userData.baseScale = k1; });
    await this.walkPath(m, [foot, ...steps, top, new T.Vector3(spot.x, RISER.top, spot.z)], 2.6);
    await shrink;
    if (this.dead) return;
    await this.s.tween(m.rotation, { y: 0 }, 0.3, Ease.inOut);
    const inst = makeInstrument(kind, false, { mini: true });
    // tall instruments a little smaller, so even the chick's face stays clear above its milk can or bell
    const mk = kind === 'churn' ? 0.36 : kind === 'cowbell' ? 0.42 : 0.5;
    inst.userData.baseScale = mk;
    inst.position.set(0, 0, 0.62);
    m.add(inst);
    m.userData.inst = inst;
    m.userData.kind = kind;
    fan.userData.headX0 = fan.userData.head ? fan.userData.head.rotation.x : 0;
    this.band.push(m);
    popIn(this.s, inst, mk, 0.4, { sound: false });
    const added = (this.addChain = this.addChain.then(() => (this.dead ? null : this.tray.add(m, { dur: 0.25, arc: 0 }))));
    await added;
    this.pokeable(m, { fn: () => this.memberPlay(m, true) });
  }

  // a band member plays one beat on its little instrument (quietly), arms swinging
  memberPlay(m, sound = true) {
    const inst = m.userData.inst, f = m.userData.animal;
    if (!inst || !f) return;
    if (sound) playInstrument(m.userData.kind, false);
    this.squash(inst, 0.82, inst.userData.baseScale || 0.5);
    strike(this.s, inst, false);
    const u = f.userData, limbs = u.arms || u.wings;
    if (limbs && !u.playing) {
      u.playing = true;
      const r0 = limbs.map((l) => l.rotation.z);
      this.s.anim(0.35, (_, p) => limbs.forEach((l, j) => (l.rotation.z = r0[j] + (j ? -1 : 1) * Math.sin(p * Math.PI) * 0.6))).then(() => { limbs.forEach((l, j) => (l.rotation.z = r0[j])); u.playing = false; });
    }
    this.nod(f, 0.2, 0.4);
  }

  async afterSuccess() {
    // straight on when the jam ends (the new band member finishes its walk in the background); only before the
    // finale does the last one get to arrive on the riser first
    if (this.jamDone) await this.alive(this.jamDone);
    this.jam = false;
    if (this.joinP && this.round >= this.totalRounds) await this.alive(Promise.race([this.joinP, this.wait(5)]));
    this.joinP = null;
  }
  endJam() { if (!this.jam) return; this.jam = false; this.jamEndT = performance.now(); if (this.jamRes) this.jamRes(); }

  update(dt, t) {
    if (this.jam && this.jamOpen) {
      const now = performance.now(), last = Math.max(this.jamOpen, this.jamLast || 0);
      if (now - last >= JAM_IDLE * 1000 || now - this.jamOpen >= JAM_MAX * 1000) this.endJam();
    }
    // Pip's turn: no idle time, and the Go! badge never shows while taps are still off
    if (this.listening) { this.idle = 0; this.goT0 = performance.now(); }
    const bl = this.stage.userData.bulbs;
    if (bl) bl.forEach((b, i) => { b.material.emissiveIntensity = 0.35 + Math.max(0, Math.sin(t * 1.5 + i * 1.3)) * 0.6; });
    // on the child's turn, the next beat dot breathes so it's clear how many are left
    if (this.dots && !this.busy && !this.listening) {
      const d = this.dots.userData.dots[this.i];
      if (d) d.scale.setScalar(1 + Math.max(0, Math.sin(t * 3)) * (d.userData.loud ? 0.08 : 0.15));
    }
    if (this.dots) animDots(this.dots);
  }

  // stuck child: the instrument to play next hops
  nudgeTarget() {
    if (this.busy || this.listening || !this.pat) return null;
    const d = this.drums[this.pat[this.i]];
    return d && d.visible ? d : null;
  }
  // a stuck child: the instrument to play next squashes (a hop would throw its little things off); at step 2 it glows
  nudge(step) {
    const d = this.nudgeTarget();
    if (!d) return;
    this.squash(d, 0.85, 1);
    this.s.wait(0.3).then(() => { if (!this.dead && d.visible) this.squash(d, 0.9, 1); });
    if (step >= 2) { const stop = fx.halo(d, 1.6); this.s.wait(3).then(stop); }
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
    for (const d of Object.values(this.drums)) { d.userData.off = d.userData.kind !== k && !this.pat.slice(this.i).includes(d.userData.kind); d.userData.tap.enabled = d.visible && !d.userData.off; }
  }
  nextRound() { for (const d of Object.values(this.drums || {})) d.userData.off = false; super.nextRound(); }

  // ---------- finale: the band she built, and she leads it from the big drum ----------
  creationView() {
    // the band on its riser, the big instrument in front, Pip whole at the left. High and far enough that the
    // tallest big instrument (the bell's A-frame, 2.7 high at z 1.2) projects below the band's instruments and feet
    // (riser top 1.5 at z -2.7), and Pip + the band stay inside the middle 75% of the width (the photo is a centre
    // 4:3 crop of the canvas).
    return { pos: new T.Vector3(-0.5, 6.45, 8.9), look: new T.Vector3(-0.5, 1.75, -2.4) };
  }
  // the beat board (a prop, not her work) settles away so the photo is the band on its riser and her big instrument
  onFinale() { if (this.dots) this.fadeAway(this.dots, 0.6); }
  creationObjects() { return [...this.tray.items(), this.drums.B].filter(Boolean); }
  onAdmirePoke(obj) {
    if (obj === this.drums.B) {
      // the big drum leads: it booms and every band member plays one beat after it, in a little ripple
      input.press(obj, 140);
      playInstrument(this.kind, true);
      strike(this.s, obj, true);
      this.jumpBits(obj, true, 0.8);
      this.band.forEach((m, j) => this.s.wait(0.12 + j * 0.09).then(() => { if (!this.dead) this.memberPlay(m, true); }));
      return;
    }
    const m = this.band.find((x) => x === obj);
    if (m) { input.press(m, 140); this.memberPlay(m, true); }
  }
}
