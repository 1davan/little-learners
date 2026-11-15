// Game 14 — Barn band. Topic mt_2mb17lUCPD "Creating and shaping musical sound".
// Pip plays a few beats; the child copies them. Level 2 adds a quiet drum (loud vs quiet); Level 3 mixes them.
import * as T from '../three.js';
import { Lesson } from '../engine/lesson.js';
import { hop, popIn, wiggle, setFace } from '../engine/actors.js';
import { makeDrum, makeFarmAnimal } from '../engine/farm.js';
import { makeHay } from '../engine/scenery.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';

const PLANS = [
  ['B', 'BB', 'BB', 'BBB', 'B', 'BBB'],
  ['BB', 'ss', 'B', 'sss', 'BBB', 'ss'],
  ['Bs', 'sB', 'BBs', 'ssB', 'BsB', 'BBss'],
];
const BEAT = 0.5;
const NUM = ['1', '2', '3', '4', '5'];

export default class BandLesson extends Lesson {
  build() {
    this.plan = PLANS[this.level];
    this.pip.position.set(-6.9, 0, -0.8);
    // Pip's own little hay drum
    this.pipDrum = makeHay(0.85); this.pipDrum.position.set(-5.1, 0, -0.2); this.pipDrum.rotation.y = Math.PI / 2;
    this.root.add(this.pipDrum);
    const big = makeDrum(0xd94f3d, 1.55, 1.4); big.position.set(-0.6, 0, 1.3);
    const small = makeDrum(0x4a90ff, 0.85, 0.8); small.position.set(3.9, 0, 1.8);
    big.userData.kind = 'B'; small.userData.kind = 's';
    this.drums = { B: big, s: small };
    this.root.add(big, small);
    small.visible = this.level > 0;
    for (const d of [big, small]) {
      d.userData.tap = input.addTap(d, { radius: d === big ? 1.7 : 1.1, offset: new T.Vector3(0, d.userData.h, 0), onTap: () => this.hit(d.userData.kind) });
      d.userData.tap.enabled = d.visible;
    }
    // the audience
    this.fans = [['cow', 6.4, -2.8, 0.8], ['hen', 7.6, -0.8, 0.7], ['pig', -2.9, -3.4, 0.7]].map(([k, x, z, s]) => {
      const a = makeFarmAnimal(k); a.position.set(x, 0, z); a.scale.setScalar(s); a.userData.baseScale = s; a.rotation.y = -x * 0.06;
      this.root.add(a); return a;
    });
  }

  async startRound(r) {
    this.busy = true;
    this.pat = this.plan[r].split('');
    this.i = 0;
    this.listening = false;
    this.lastHit = 0;
    for (const d of Object.values(this.drums)) d.scale.setScalar(1);
    await this.wait(0.2);
    this.busy = false;
    this.cue();
  }

  promptText() {
    if (this.level === 0) return 'Copy Pip! ' + this.pat.map(() => 'Boom!').join(' ');
    if (this.level === 1) return this.pat[0] === 'B' ? 'Loud drum! Copy Pip!' : 'Quiet drum! Copy Pip!';
    return 'Listen… now you!';
  }

  // the prompt is Pip playing the beats (each also flashes the drum to copy), then "Your turn!"
  async prompt() {
    const token = (this.playTok = (this.playTok || 0) + 1);
    this.listening = true;
    this.i = 0;
    for (const d of Object.values(this.drums)) d.userData.tap.enabled = false;
    await this.say(this.promptText(), { max: this.level === 0 ? 0.6 : 1.3 });
    for (const k of this.pat) {
      if (this.dead || token !== this.playTok) return;
      this.pipHit(k);
      await this.wait(BEAT);
    }
    if (this.dead || token !== this.playTok) return;
    this.listening = false;
    for (const d of Object.values(this.drums)) d.userData.tap.enabled = d.visible && !d.userData.off;
    this.say('Your turn!', { max: 0.6 });
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

  pipHit(k) {
    const loud = k === 'B';
    (loud ? sfx.drumLoud : sfx.drumSoft)();
    const pip = this.pip, w = pip.userData.wings[1];
    this.s.anim(0.22, (_, p) => { w.rotation.z = 0.3 + Math.sin(p * Math.PI) * 1.3; });
    hop(this.s, pip, loud ? 0.3 : 0.12, 0.22);
    this.squash(this.pipDrum, loud ? 0.75 : 0.9, 0.85);
    // light the drum to copy
    const d = this.drums[k];
    this.squash(d, 0.94, 1);
    fx.float(this.pipDrum.position.clone().add(new T.Vector3(0, 1.8, 0)), loud ? '♪' : '♩', { color: loud ? '#ff5a5a' : '#4a90ff', size: loud ? 8 : 5 });
  }

  squash(o, k, base) {
    this.s.anim(0.25, (_, p) => { const q = 1 - (1 - k) * Math.sin(p * Math.PI) * (1 - p * 0.3); o.scale.set(base / Math.sqrt(q), base * q, base / Math.sqrt(q)); }).then(() => o.scale.setScalar(base));
  }

  hit(k) {
    if (this.busy || this.listening) return;
    const d = this.drums[k];
    const loud = k === 'B';
    (loud ? sfx.drumLoud : sfx.drumSoft)();
    this.squash(d, loud ? 0.72 : 0.82, 1);
    this.lastHit = performance.now();
    this.idle = 0;
    for (const f of this.fans) hop(this.s, f, loud ? 0.35 : 0.15, 0.3);
    if (k !== this.pat[this.i]) {
      fx.float(d.position.clone().add(new T.Vector3(0, d.userData.h + 1.2, 0)), '♪', { color: '#9a95a6' });
      this.redirect(k === 'B' ? "That's loud. Tap quiet!" : "That's quiet. Tap loud!");
      return;
    }
    this.clearHints();
    fx.float(d.position.clone().add(new T.Vector3(0, d.userData.h + 1.4, 0)), NUM[this.i], { color: loud ? '#ff5a5a' : '#4a90ff', size: 8 });
    this.i++;
    if (this.i < this.pat.length) return;
    // whole pattern copied: the band plays
    this.busy = true;
    input.lock(1200);
    this.fans.forEach((f, j) => this.s.wait(0.15 + j * 0.18).then(() => { hop(this.s, f, 0.6, 0.4); sfx[{ cow: 'moo', hen: 'cluck', pig: 'oink' }[f.userData.kind]](); }));
    this.busy = false;
    this.success(d.position.clone().add(new T.Vector3(0, 3, 0)), 'What a band!');
  }

  update() {
    // a gentle "one more!" if the child stopped part-way
    if (!this.busy && !this.listening && this.i > 0 && this.i < this.pat.length && this.lastHit && performance.now() - this.lastHit > 2500) {
      this.lastHit = 0;
      this.say(this.pat.length - this.i === 1 ? 'One more!' : 'More!', { max: 0.6 });
    }
  }

  showHint(glow = true) {
    const k = this.pat[this.i] || this.pat[0];
    const d = this.drums[k];
    if (glow) this.addHalo(d, 1.6);
    fx.ghostPath([d.position.clone().add(new T.Vector3(0, d.userData.h, 0.3))], { mode: 'tap' });
  }
  choicePoints() { return Object.values(this.drums).filter((d) => d.visible).map((d) => d.position.clone().add(new T.Vector3(0, d.userData.h, 0.3))); }
  makeErrorless() {
    // only the drum needed next can be played
    const k = this.pat[this.i];
    for (const d of Object.values(this.drums)) { d.userData.off = d.userData.kind !== k && !this.pat.slice(this.i).includes(d.userData.kind); d.userData.tap.enabled = d.visible && !d.userData.off && !this.listening; }
  }
  nextRound() { for (const d of Object.values(this.drums || {})) d.userData.off = false; super.nextRound(); }

  onFinale() {
    for (let i = 0; i < 6; i++) this.s.wait(i * 0.3).then(() => { (i % 2 ? sfx.drumSoft : sfx.drumLoud)(); for (const f of this.fans) hop(this.s, f, 0.4, 0.28); });
  }
}
