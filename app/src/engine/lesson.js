// Base class for every lesson. Owns: round flow, the inactivity hint ladder, mash handling,
// success/redirect feedback, per-round records, the finale + sticker, and cleanup.
import * as T from '../three.js';
import { scene, onFrame, setSky } from './stage.js';
import { scope, Ease } from './tween.js';
import { input } from './input.js';
import { speech } from './speech.js';
import { sfx } from './audio.js';
import { fx } from './fx.js';
import { store } from './store.js';
import { disposeTree, mesh, geo } from './toon.js';
import { makePip, dance, wave, breathe, wiggle, setFace, poke, canPoke, hop } from './actors.js';
import { project, screenRadius, camera } from './stage.js';
import { makeScenery, animateScenery } from './scenery.js';
import { physics } from './physics.js';
import { setAmbience } from './audio.js';
import { pokeScenery } from './react.js';
import { awardSticker } from './ui.js';
import { dressPip } from './piphat.js';

const PRAISE = ['Yay!', 'You did it!', 'Wow!', 'Hooray!', 'Great job!', 'Super!', 'Brilliant!', 'Yes!', 'Amazing!', 'Well done!'];
const LADDER = [6, 12, 20, 45]; // seconds of no touching → show the cue again, glow + hand, errorless, go home

export class Lesson {
  constructor(router, meta) {
    this.router = router;
    this.meta = meta;
    this.root = new T.Group();
    this.s = scope();
    this.round = 0;
    this.records = [];
    this.dead = false;
    this.busy = true;
    this.offs = [];
    this.stopHints = [];
    this.level = store.level(); // 0,1,2 = Level 1,2,3 chosen by the parent
    this.praiseIdx = Math.floor(Math.random() * PRAISE.length);
  }

  // ---- override points ----
  get totalRounds() { return 6; }
  build() {}
  startRound(_r) {}
  promptText() { return ''; }
  showHint(_glow) {} // ghost hand demo of the action; glow=true also adds a halo on the answer
  makeErrorless() {}
  update(_dt, _t) {}

  // ---- lifecycle ----
  async start() {
    scene.add(this.root);
    physics.clear(); physics.ground(0);
    setSky(this.meta.world, store.level());
    setAmbience(this.meta.world);
    this.meadow = makeScenery(this.meta.world, store.level());
    this.root.add(this.meadow);
    this.pip = makePip();
    this.pip.position.set(-6.9, 0, -0.5);
    this.pip.rotation.y = 0.35;
    this.root.add(this.pip);
    dressPip(this.pip, this.meta.world, store.level()); // the world's hat (sun hat, straw hat...), same as on the home page
    this.build();
    this.offs.push(input.onAny(() => { this.idle = 0; this.ladder = 0; }));
    this.offs.push(input.onMash(() => this.mash()));
    this.offs.push(input.onMiss((x, y) => this.pokeAt(x, y)));
    this.scanChars();
    this.offs.push(onFrame((dt, t) => this.tick(dt, t)));
    await this.wait(0.15);
    wave(this.s, this.pip);
    sfx.hello();
    // the intro line shows while the first round is already being set up (play within ~3.5 s of tapping)
    this.say(this.meta.intro, { max: 2.2 });
    await this.wait(0.6);
    this.nextRound();
  }

  alive(p) { return new Promise((res) => p.then((v) => { if (!this.dead) res(v); })); }
  // Speak. opts.max (seconds) caps how long the caller waits — speech keeps playing, the game moves on.
  say(text, opts = {}) {
    const p = speech.say(text, opts);
    return this.alive(opts.max ? Promise.race([p, this.s.wait(opts.max)]) : p);
  }
  wait(sec) { return this.s.wait(sec); }

  nextRound() {
    if (this.dead) return;
    if (this.round >= this.totalRounds) return this.finale();
    this.cur = { wrong: 0, hints: 0, t0: performance.now() };
    this.idle = 0;
    this.ladder = 0;
    this.errorlessOn = false;
    this.busy = false;
    if (this.round > 0) sfx.roundStart();
    this.startRound(this.round);
  }

  prompt() { const t = this.promptText(); if (t) this.say(t); }
  // The cue: say the instruction AND show the move with the ghost hand, so a grown-up and child can copy it.
  // Lessons call this right at the start of every round; it repeats after inactivity.
  // Level 3 shows the gesture without giving the answer away (scan over the choices), if the lesson provides choicePoints().
  // The parent asked for exactly ONE demo per game: it plays at the start of the first round, can't be
  // interrupted (touches are ignored while it runs), lasts at most 2.5 s, and never repeats until the game is reopened.
  cue() {
    if (this.dead || this.busy) return;
    this.prompt();
    if (this.demoDone) return;
    this.demoDone = true;
    this.playDemo();
  }
  playDemo() {
    this.demoing = true;
    input.lock(2500);
    if (this.level === 2 && this.demoL3) this.demoL3();
    else this.showHint(false);
    this.s.wait(2.5).then(() => { fx.clearHands(); this.demoing = false; this.idle = 0; });
  }
  demoL3() {
    const pts = this.choicePoints && this.choicePoints();
    if (pts && pts.length) fx.ghostPath(pts, { mode: 'scan' });
    else this.showHint(false);
  }

  // Every character in the scene (Pip, animals) gets idle life and can be poked.
  scanChars() {
    const list = [];
    this.root.traverse((o) => { if (o.userData && o.userData.kind && canPoke(o)) list.push(o); });
    this.chars = list;
  }
  pokeAt(x, y) {
    if (this.dead) return false;
    let best = null, bd = Infinity;
    const wp = new T.Vector3();
    for (const c of this.chars || []) {
      if (!c.visible || !c.parent) continue;
      c.getWorldPosition(wp);
      const k = c.getWorldScale(new T.Vector3()).y;
      wp.y += 1.1 * k;
      const p = project(wp);
      const r = Math.max(screenRadius(wp, 1.25 * k), Math.min(innerWidth, innerHeight) * 0.07);
      const d = Math.hypot(p.x - x, p.y - y) / r;
      if (d < 1 && d < bd) { bd = d; best = c; }
    }
    if (!best) return pokeScenery(this.s, this.meadow, camera, x, y);
    poke(this.s, best);
    return true;
  }

  tick(dt, t) {
    if (this.dead) return;
    this.charT = (this.charT || 0) + dt;
    if (this.charT > 0.5) { this.charT = 0; this.scanChars(); }
    for (let i = 0; i < this.chars.length; i++) if (this.chars[i] !== this.pip) breathe(this.chars[i], t, i * 1.7);
    breathe(this.pip, t);
    animateScenery(this.meadow, dt, t);
    this.update(dt, t);
    if (this.busy || this.demoing || input.dragging()) return;
    this.idle += dt;
    if (this.ladder < LADDER.length && this.idle >= LADDER[this.ladder]) {
      const lvl = ++this.ladder;
      // no repeated hand demos: inactivity only re-shows the words, then narrows the choices
      if (lvl === 1 || lvl === 2) { this.prompt(); this.nudge(lvl); }
      else if (lvl === 3) { this.cur.hints++; this.errorless(); }
      else this.timeout();
    }
  }

  hint() { this.prompt(); }
  // A stuck child gets a visual nudge, not just words: at 6 s the answer hops with a sound, at 12 s it also glows.
  // Lessons expose the answer via nudgeTarget() (an Object3D); without one, Pip bounces encouragingly.
  nudge(step) {
    const o = this.nudgeTarget ? this.nudgeTarget() : null;
    sfx.boing && sfx.boing();
    if (!o) { hop(this.s, this.pip, 0.5, 0.4); return; }
    const y0 = o.position.y;
    this.s.anim(0.5, (_, p) => { o.position.y = y0 + Math.sin(p * Math.PI) * 0.45; }).then(() => (o.position.y = y0));
    if (step >= 2) { const stop = fx.halo(o, 1.3); this.s.wait(3).then(stop); }
  }
  addHalo(obj, r) { this.stopHints.push(fx.halo(obj, r)); }
  clearHints() { for (const f of this.stopHints) f(); this.stopHints = []; }
  errorless() { if (this.errorlessOn) return; this.errorlessOn = true; this.makeErrorless(); this.prompt(); }

  // Correct answer. pos: world position for confetti. line: what the narrator says after the praise word.
  async success(pos, line = '') {
    if (this.busy || this.dead) return;
    this.busy = true;
    input.lock(700);
    this.clearHints();
    fx.confetti(pos);
    sfx.chime();
    this.celebrate();
    // Pip beams: happy-closed eyes and a big open smile for a moment
    const pf = this.pip?.userData?.face;
    if (pf) { setFace(pf, 'joy'); this.s.wait(1.1).then(() => { if (pf.userData.emotion === 'joy') setFace(pf, 'happy'); }); }
    this.records.push({ firstTry: this.cur.wrong === 0 && this.cur.hints === 0, wrong: this.cur.wrong, hints: this.cur.hints, ms: performance.now() - this.cur.t0 });
    this.round++;
    const praise = PRAISE[this.praiseIdx++ % PRAISE.length];
    // Keep the celebration short: the next round starts ~1 s after a correct answer, while praise finishes.
    const text = line ? `${praise} ${line}` : praise;
    // captions only (no voice), so the praise never holds the game up: the caption stays on screen while play continues
    this.say(text);
    await this.wait(0.85);
    await this.afterSuccess();
    this.nextRound();
  }
  async afterSuccess() {}
  // Pip rotates through little celebration moves so it never feels the same twice in a row.
  celebrate() {
    const pip = this.pip, s = this.s;
    const m = (this.celebI = ((this.celebI ?? Math.floor(Math.random() * 4)) + 1) % 4);
    if (m === 0) dance(s, pip);
    else if (m === 1) hop(s, pip, 0.9, 0.45, { sound: true }).then(() => hop(s, pip, 0.5, 0.35));
    else if (m === 2) {
      const w = pip.userData.wings, r0 = w.map((x) => x.rotation.z);
      sfx.giggle();
      s.anim(0.8, (_, p) => { w.forEach((x, i) => (x.rotation.z = r0[i] + (i ? 1 : -1) * Math.abs(Math.sin(p * Math.PI * 4)) * 1.1)); }).then(() => w.forEach((x, i) => (x.rotation.z = r0[i])));
      hop(s, pip, 0.4, 0.35);
    } else {
      // a cartwheel spin around Pip's middle, in the picture plane (never swings toward the camera)
      const r0 = pip.rotation.z, x0 = pip.position.x, c = 1.2 * pip.scale.y;
      s.anim(0.6, (_, p) => {
        const a = Ease.inOut(p) * Math.PI * 2;
        pip.rotation.z = r0 + a;
        pip.position.x = x0 + c * Math.sin(a);
        pip.position.y = c - c * Math.cos(a) + Math.sin(p * Math.PI) * 0.9;
      }).then(() => { pip.rotation.z = r0; pip.position.x = x0; pip.position.y = 0; sfx.land(); });
    }
  }

  // Gentle redirect after a wrong choice — never a failure.
  redirect(line) {
    if (this.dead) return;
    this.cur.wrong++;
    sfx.boop();
    input.lock(700);
    this.say(line);
    if (this.cur.wrong >= 2) this.errorless();
  }

  mash() {
    sfx.giggle();
    setFace(this.pip.userData.face, 'scared');
    this.s.wait(0.7).then(() => setFace(this.pip.userData.face, 'happy'));
    wiggle(this.s, this.pip, 0.3, 0.8);
  }

  async timeout() {
    this.busy = true;
    await this.say('Bye bye! See you soon!');
    this.router.go('home');
  }

  async finale() {
    this.busy = true;
    input.lock(100000);
    store.record(this.meta.id, this.records);
    store.addSticker(this.meta.id);
    sfx.fanfare();
    fx.rain();
    setFace(this.pip.userData.face, 'happy');
    dance(this.s, this.pip).then(() => dance(this.s, this.pip));
    this.onFinale();
    this.say('You did it! A sticker!');
    await this.wait(0.8);
    await this.alive(awardSticker(this.meta));
    input.unlock();
    this.router.go('home', { newSticker: this.meta.id });
  }
  onFinale() {}

  dispose() {
    physics.clear();
    this.dead = true;
    fx.clearHands();
    this.s.kill();
    this.clearHints();
    input.clear();
    speech.stop();
    for (const f of this.offs) f();
    scene.remove(this.root);
    disposeTree(this.root);
  }
}

export function shuffle(a) {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
}
