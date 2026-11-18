// Base class for every lesson. Owns: round flow, the inactivity hint ladder, mash handling,
// success/redirect feedback, per-round records, the finale ("look what you made" + photo + sticker), and cleanup.
//
// =====================================================================================================================
//  SATISFACTION API  (docs/SATISFACTION.md E1-E8; read docs/FEEL-BRIEF.md too). Quick reference for game authors.
// =====================================================================================================================
//
//  E1  QUIET SUCCESS (the default)
//      this.success(pos, line = '', opts = {})
//        Records the round, clears hints, shows `line` as a CAPTION ONLY, has Pip watch (pipWatch), then waits for
//        the game's payoff (see E6) plus 1 s of stillness, then afterSuccess() and the next round.
//        No confetti, no chime, no praise word, no Pip show. The reward is the game's own character reacting.
//        opts:
//          payoff:  Promise to wait for instead of this.payoffP (capped at 3 s)
//          still:   seconds of stillness after the payoff (default 0.5; may be 0 when the payoff already holds the
//                   finished thing still for about 1 s, rule 0)
//          voice:   true = also speak `line` (only for an instruction; praise stays caption-only)
//          praise:  true = prefix a praise word ("Yay!") to the caption
//          watch:   false = Pip does not react at all (e.g. Pip is busy being the story's character)
//          cheer:   true = the OLD loud success (confetti + chime + praise + Pip's celebrate() dance).
//                   Opt-in only, for a game that really wants it; avoid. (this.cheer = true does it for every round.)
//      this.pipWatch(pos)  Pip as audience: turns a little toward pos, one small nod or one clap, 'joy' face for 1 s.
//                          (A game that still overrides celebrate() gets that called instead - legacy, remove it.)
//      this.redirect(line, { obj })  Wrong choice. No boop. With obj, THAT object says no itself: a small head-shake
//                          (characters) or a soft wobble (props) and one soft sound (sfx.nope). Caption as before.
//      nextRound() no longer plays sfx.roundStart; mash() no longer giggles; nudge() no longer twinkles.
//
//  E2  GRAB FEEL (engine/input.js, automatic for every addDrag / addTap)
//      Drags: squash-and-lift on pick, spring-lagged carry with stretch, 30% magnet toward a zone within 1.2x its
//      radius, overshoot settle + landing squash on drop. Taps press in (0.94) and spring back. All of it is a
//      presentation layer: obj.position stays at the finger for game code, obj.scale is never touched.
//        input.addDrag(obj, { ..., sound, magnet = 0.3, feel = true, autoHome = false })
//          sound:    pick-up sound: default quiet sfx.pup; false = none; 'name' = sfx[name]; or a function(t)
//                    (do NOT also call sfx.pick in onPick)
//          autoHome: a drop on nothing walks the object home on a 0.5 s arc (no sound), then onDrop(null, {home:true})
//        zone.onNear(k, obj, zone)  or  zone.obj.userData.onNear(k, obj, zone)
//                    called on every move while the carried object is within 1.2x the zone (k = 0..1 closeness),
//                    and with k = 0 when it leaves or is dropped. Use it so targets open, lean or light up.
//        input.addTap(obj, { ..., press = true })   press: false opts out of the press-in.
//        input.sendHome(t, { dur, arc, to })        walk a drag target home on an arc (Promise).
//        input.press(obj, ms)                       the press squash on any object (e.g. a poked prop).
//
//  E3  "LOOK WHAT YOU MADE" FINALE  (finale() runs it; games provide the framing)
//      Sequence: onFinale() -> await showOff() -> admire (>= 4 s, pokes only) -> photo -> sticker -> home.
//      A game provides (all optional, but every game should provide the first two):
//        creationView()     -> { pos, look, dur? }  camera framing of the build-up object (Vector3 or [x,y,z]);
//                              showOff() glides there over 0.9 s while effects hush (music carries on).
//        creationObjects()  -> [Object3D]  the things the child made. During the admire they are pokeable: a poke
//                              presses them and sounds their note (sfx.step(i, n)), via onAdmirePoke(obj, i, n).
//        onAdmirePoke(obj, i, n)  override for a custom response (jiggle, light up, a sound of its own).
//        showOff()          override for a custom move (e.g. myday: slow pull-back in the dark). Call
//                           await super.showOff() or this.glideCamera() yourself.
//        onFinale()         still the game's hook, called first. Character admires in character; it must NOT start
//                           an automatic show the child cannot affect, and must not remove the creation.
//        admireTime         seconds of admiring (default 4, the minimum).
//        quietEnding        true = no rain, no resolve, silent sticker (bedtime).  finaleRain = false: no rain only.
//      The admire caption "Look what you made!" is voiced once per session. Confetti/rain: finale only, once.
//
//  E4  CREATION GALLERY (automatic): the finale photo (stage.snapshot(320), 4:3 JPEG) is saved with
//      store.addCreation(id, url) (last 3 per game). Home shows the latest beside each game's pedestal and in the
//      shelf's photo strip; tapping one shows it big ("You made this!"). Nothing for a game to do except frame
//      its creation well in creationView().
//
//  E5  KEEPSAKE TRAY (engine/keepsake.js) for pick-the-answer games with no natural build-up:
//        import { makeTray } from '../engine/keepsake.js';
//        this.tray = makeTray(this, this.totalRounds, [0, 0, -3], { style: 'shelf' | 'rug' });   // in build()
//        await this.tray.add(thing, { walk: isCharacter });   // in afterSuccess(): it moves there and STAYS
//        creationView() { return this.tray.view(); }   creationObjects() { return this.tray.items(); }
//      Tray items are pokeable all level (soft press + their note).
//
//  E6  BEAT + PAYOFF PROMISE
//      await this.beat(obj, dur = 0.45, { squash = 0.1, hush = true, duck = 0.3 })
//        Before every reveal (lid lifts, last brick, plop, first bite): obj squashes down 10% and holds, new sound
//        effects are silenced and the music dips 30% for dur; resolves at the release (obj springs back with one
//        small overshoot as the reveal starts). obj may be null (just the held breath).
//      this.payoffP = <Promise>   set it right BEFORE calling success(): success() waits for it (max 3 s), then
//        1 s of stillness. Use it instead of ad-hoc payP / fitP / gobP ... awaited in afterSuccess().
//        Without a payoffP (or opts.payoff) success() waits 0.4 s + 0.5 s (rule 0: no waiting).
//
//  E7  SOUND (engine/audio.js)
//      sfx.step(i, n, { vol, soft })  the level's tune: note i of a rising pentatonic run in the key of the world's
//        music (set automatically per world). Call it for each child action with the running count i and the
//        level's total n: actions climb and the last one lands on the top tonic. The ONE sound for an action is
//        the material sound or the step, not both stacked. sfx.resolve() is the 3-note finale resolve.
//      Not for routine use any more: sfx.chime, roundStart, boop, pick, fanfare, giggle-on-mash, twinkle.
//      The mix gate (automatic): nothing plays during a hush; <= 4 effects per 0.7 s; boings share a 1.2 s cooldown;
//        no effect starts within 0.25 s of one at the same or higher level (LEVEL table in audio.js). Musical sounds
//        (note, step, resolve, drums) are exempt. Every effect gets +-5% random volume and a little pitch wobble.
//      hushEffects(sec, { cut }) / duckMusic(k, sec) / effectsHushed() are exported for custom moments; game sound
//        modules with their own AudioContext (cook-sound.js etc.) should check effectsHushed() before playing.
//
//  E8  NEVER popOut THE CHILD'S WORK (rule for implementers)
//      Anything the child placed, filled, fed, built or found leaves in one of three ways only:
//        1. it STAYS (keep it, or put it on a keepsake tray / at the back of the scene),
//        2. a character CARRIES IT OFF at walking pace to somewhere still visible:  await this.walkTo(obj, to),
//        3. the CHILD removes it themselves (a tap/drag they choose to do).
//      Never popOut(), scale to 0.001, or root.remove() it in afterSuccess / clearRound / clear*. Props the child
//      did not make may go, slowly and after the stillness:  await this.fadeAway(obj, 0.5).
//
//  Other helpers:  this.glideCamera(pos, look, dur = 0.9)  eased camera glide (later calls cancel earlier ones).
//                  this.pokeable(obj, { note, of, fn })     make anything pokeable (soft press + note or fn(obj)).
// =====================================================================================================================
import * as T from '../three.js';
import { scene, onFrame, setSky, setCamera, getLook, snapshot } from './stage.js';
import { scope, Ease } from './tween.js';
import { input } from './input.js';
import { speech } from './speech.js';
import { sfx, hushEffects, duckMusic, setStepKey } from './audio.js';
import { fx } from './fx.js';
import { store } from './store.js';
import { disposeTree, mesh, geo } from './toon.js';
import { makePip, dance, wave, breathe, wiggle, setFace, poke, canPoke, hop } from './actors.js';
import { project, screenRadius, camera } from './stage.js';
import { makeScenery, animateScenery } from './scenery.js';
import { physics } from './physics.js';
import { setAmbience } from './audio.js';
import { pokeScenery } from './react.js';
import { voiceBusy } from './speech.js';
import { showGo } from './ui.js';
import { awardSticker, photoFlash } from './ui.js';
import { dressPip } from './piphat.js';

const PRAISE = ['Yay!', 'You did it!', 'Wow!', 'Hooray!', 'Great job!', 'Super!', 'Brilliant!', 'Yes!', 'Amazing!', 'Well done!'];
const LADDER = [5, 8, 20, 90]; // seconds of no touching → cue again + hop, cue + glow + hand demo (stuck ~8 s), errorless, go home (90 s: she has really walked away)
let lookSaid = false; // "Look what you made!" is voiced once per session, then caption-only
const V3 = (v) => (v && v.isVector3 ? v.clone() : Array.isArray(v) ? new T.Vector3(v[0], v[1], v[2]) : v ? new T.Vector3(v.x, v.y, v.z) : null);
const _bx = new T.Box3(), _sph = new T.Sphere();

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
    this.payoffP = null;   // E6: the round's payoff promise (success() waits for it)
    this.pokeables = [];   // [{ obj, note, of, fn }] things that answer a poke (tray items, the creation)
  }

  // ---- override points ----
  get totalRounds() { return 6; }
  build() {}
  startRound(_r) {}
  promptText() { return ''; }
  showHint(_glow) {} // ghost hand demo of the action; glow=true also adds a halo on the answer
  makeErrorless() {}
  update(_dt, _t) {}
  // finale override points (E3); see the API notes at the top of this file
  creationView() { return null; }     // { pos, look, dur? }
  creationObjects() { return []; }    // [Object3D]

  // ---- lifecycle ----
  async start() {
    scene.add(this.root);
    physics.clear(); physics.ground(0);
    setSky(this.meta.world, store.level());
    setAmbience(this.meta.world);
    setStepKey(this.meta.world);
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
  // opts.repeat: true = voice it even if it was spoken in the last 30 s (speech the child asked for by tapping).
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
    // 'Go!': taps open as soon as the round is laid out (rule 0: no waiting). They never wait for the voice
    // or the demo: a touch during the demo simply ends it.
    this.goPending = true; this.goT0 = performance.now();
    input.setReady(() => !this.goPending || this.canGo());
    this.startRound(this.round);
  }
  // shows the Go! badge when the round is really ready (called from tick)
  canGo() { return !this.busy && !this.listening && this.phase !== 'listen' && performance.now() - this.goT0 > 300; }
  checkGo() {
    if (!this.goPending || this.dead) return;
    const waited = performance.now() - this.goT0;
    if (!this.demoStart && this.demoing) this.demoStart = true;
    // the badge waits for the demo hand (max 2.5 s) so the two don't overlap; taps are already open (canGo)
    const ready = this.canGo() && (!this.demoing || waited > 2500);
    if (ready || waited > 3000) { this.goPending = false; showGo(this.goSide); } // a game sets goSide = 'left' if its action is top-right
  }

  prompt(opts = {}) { const t = this.promptText(); if (t) this.say(t, opts); }
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
    if (this.level === 2 && this.demoL3) this.demoL3();
    else this.showHint(false);
    // a touch ends the demo at once (she has got it); never lock her out while it plays
    const off = input.onAny(() => { off(); if (this.demoing) { fx.clearHands(); this.demoing = false; } });
    this.offs.push(off);
    this.s.wait(this.demoDur ?? 2.5).then(() => { off(); if (this.demoing) { fx.clearHands(); this.demoing = false; this.idle = 0; } }); // a game may set demoDur (s) for a longer item ride
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
  // Make anything pokeable (E5 tray items, the E3 creation): a poke presses it and plays its note.
  pokeable(obj, { note = null, of = 0, fn = null, admire = false } = {}) {
    if (!obj) return;
    const had = this.pokeables.find((p) => p.obj === obj);
    if (had) Object.assign(had, { note: note ?? had.note, of: of || had.of, fn: fn || had.fn, admire: admire || had.admire });
    else this.pokeables.push({ obj, note, of, fn, admire });
  }
  onPoke(p) {
    if (p.fn) p.fn(p.obj);
    else this.onAdmirePoke(p.obj, p.note, p.of);
  }
  // default response to a poke on the creation / a tray item: a soft press and the thing's own note
  onAdmirePoke(obj, i, n) {
    input.press(obj, 140);
    if (i !== null && i !== undefined) sfx.step(i, n || 6, { soft: true }); else sfx.tap();
  }
  pokeAtPokeable(x, y) {
    let best = null, bd = Infinity;
    for (const p of this.pokeables) {
      const o = p.obj;
      if (!o.parent || !o.visible) continue;
      let vis = true; for (let q = o; q; q = q.parent) if (!q.visible) { vis = false; break; }
      if (!vis) continue;
      _bx.setFromObject(o);
      if (_bx.isEmpty()) continue;
      _bx.getBoundingSphere(_sph);
      const c = project(_sph.center);
      const r = Math.max(screenRadius(_sph.center, _sph.radius * 0.9), Math.min(innerWidth, innerHeight) * 0.06);
      const d = Math.hypot(c.x - x, c.y - y) / r;
      if (d < 1 && d < bd) { bd = d; best = p; }
    }
    if (!best) return false;
    this.onPoke(best);
    return true;
  }
  pokeAt(x, y) {
    if (this.dead) return false;
    if (this.pokeables.length && this.pokeAtPokeable(x, y)) return true;
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
    this.checkGo();
    this.update(dt, t);
    if (this.busy || this.demoing || input.dragging()) return;
    this.idle += dt;
    if (this.ladder < LADDER.length && this.idle >= LADDER[this.ladder]) {
      const lvl = ++this.ladder;
      // no repeated hand demos: inactivity only re-shows the words, then narrows the choices
      if (lvl === 1 || lvl === 2) {
        this.prompt(lvl === 2 ? { repeat: true } : {}); this.nudge(lvl); // stuck ~8 s: she hears the instruction again
        // stuck for ~12 s: show the hand demo again, slowly (only when stuck; it never nags otherwise)
        if (lvl === 2 && this.showHint && !this.demoing) { this.demoing = true; try { this.showHint(false); } catch (e) { /* */ } this.s.wait(2.5).then(() => { this.demoing = false; }); }
      }
      else if (lvl === 3) { this.cur.hints++; this.errorless(); }
      else this.timeout();
    }
  }

  hint() { this.prompt(); }
  // A stuck child gets a visual nudge, not just words: at 6 s the answer hops (silently), at 12 s it also glows.
  // Lessons expose the answer via nudgeTarget() (an Object3D); without one, Pip bounces encouragingly.
  nudge(step) {
    const o = this.nudgeTarget ? this.nudgeTarget() : null;
    if (!o) { hop(this.s, this.pip, 0.5, 0.4); return; }
    const y0 = o.position.y;
    this.s.anim(0.5, (_, p) => { o.position.y = y0 + Math.sin(p * Math.PI) * 0.45; }).then(() => (o.position.y = y0));
    if (step >= 2) { const stop = fx.halo(o, 1.3); this.s.wait(3).then(stop); }
  }
  addHalo(obj, r) { this.stopHints.push(fx.halo(obj, r)); }
  clearHints() { for (const f of this.stopHints) f(); this.stopHints = []; }
  errorless() { if (this.errorlessOn) return; this.errorlessOn = true; this.makeErrorless(); this.prompt(); }

  // Correct answer (E1: quiet by default). pos: where it happened (Pip looks there). line: caption (not spoken).
  // See the API notes at the top of this file for opts.
  async success(pos, line = '', opts = {}) {
    if (this.busy || this.dead) return;
    this.busy = true;
    input.lock(700);
    this.clearHints();
    const loud = opts.cheer ?? this.cheer ?? false;
    if (loud) { if (pos) fx.confetti(pos); sfx.chime(); }
    const custom = this.celebrate !== Lesson.prototype.celebrate; // legacy per-game override
    if (opts.watch !== false) {
      if (custom) this.celebrate();
      else if (loud) { this.celebrate(); this.pipJoy(); }
      else this.pipWatch(pos);
    }
    this.records.push({ firstTry: this.cur.wrong === 0 && this.cur.hints === 0, wrong: this.cur.wrong, hints: this.cur.hints, ms: performance.now() - this.cur.t0 });
    this.round++;
    let text = line;
    if (opts.praise ?? loud) { const praise = PRAISE[this.praiseIdx++ % PRAISE.length]; text = line ? `${praise} ${line}` : praise; }
    if (text) this.say(text, { voice: !!opts.voice && this.voiceLines !== false });
    // E6: wait for the game's payoff (capped), then rule 6: at least 1 s where nothing new happens
    const pay = opts.payoff ?? this.payoffP;
    this.payoffP = null;
    if (pay) await this.alive(Promise.race([Promise.resolve(pay).catch((e) => console.error(e)), this.s.wait(3)]));
    else await this.wait(0.4);
    await this.wait(opts.still ?? 0.5); // rule 0: a short look at what she did, then straight on
    await this.afterSuccess();
    this.nextRound();
  }
  async afterSuccess() {}
  pipJoy(sec = 1.0) {
    const pf = this.pip?.userData?.face;
    if (pf) { setFace(pf, 'joy'); this.s.wait(sec).then(() => { if (pf.userData.emotion === 'joy') setFace(pf, 'happy'); }); }
  }
  // Pip is the audience, not the show: a small turn toward pos, one nod or one clap, a joyful face for 1 s.
  pipWatch(pos = null) {
    const pip = this.pip, s = this.s;
    if (!pip || !pip.parent || this.dead) return;
    this.pipJoy(1.0);
    const u = pip.userData;
    // turn a little toward what happened, then back
    if (pos && !this.watching) {
      this.watching = true;
      const wp = pip.getWorldPosition(new T.Vector3());
      const r0 = pip.rotation.y;
      const want = Math.atan2(pos.x - wp.x, (pos.z ?? 0) - wp.z + 2.5); // biased toward the camera so Pip never turns its back
      const to = r0 + Math.max(-0.45, Math.min(0.45, want - r0));
      s.tween(pip.rotation, { y: to }, 0.35, Ease.out)
        .then(() => s.wait(1.1))
        .then(() => s.tween(pip.rotation, { y: r0 }, 0.5, Ease.inOut))
        .then(() => { this.watching = false; });
    }
    if (u.busyAnim) return;
    const m = (this.watchI = ((this.watchI ?? 0) + 1) % 2);
    if (m === 0 && u.head) {
      // one small nod
      const h = u.head, x0 = h.rotation.x;
      s.wait(0.2).then(() => s.anim(0.5, (_, p) => { h.rotation.x = x0 + Math.sin(p * Math.PI) * 0.22; })).then(() => { h.rotation.x = x0; });
    } else if (u.wings) {
      // one clap of the wings
      const w = u.wings, r0 = w.map((x) => x.rotation.z);
      s.wait(0.2).then(() => s.anim(0.45, (_, p) => { const k = Math.sin(p * Math.PI); w.forEach((x, i) => (x.rotation.z = r0[i] + (i ? 1 : -1) * k * 0.7)); })).then(() => w.forEach((x, i) => (x.rotation.z = r0[i])));
    }
  }
  // The OLD loud celebration (Pip dances, hops, flaps or cartwheels). Only used with success(..., { cheer: true }).
  celebrate() {
    const pip = this.pip, s = this.s;
    const m = (this.celebI = ((this.celebI ?? Math.floor(Math.random() * 4)) + 1) % 4);
    if (m === 0) dance(s, pip);
    else if (m === 1) hop(s, pip, 0.9, 0.45, { sound: true }).then(() => hop(s, pip, 0.5, 0.35));
    else if (m === 2) {
      const w = pip.userData.wings, r0 = w.map((x) => x.rotation.z);
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

  // Gentle redirect after a wrong choice — never a failure. No boop: with opts.obj the wrong thing itself says no.
  redirect(line, opts = {}) {
    if (this.dead) return;
    this.cur.wrong++;
    input.lock(700);
    const obj = opts && opts.isObject3D ? opts : opts.obj;
    if (obj) this.sayNo(obj);
    if (line) this.say(line);
    if (this.cur.wrong >= 2) this.errorless();
  }
  // A small head-shake (characters) or a soft wobble (props), with one soft sound.
  sayNo(obj) {
    if (!obj || obj.userData._no) return;
    obj.userData._no = true;
    const k = obj.userData.kind;
    const isChar = typeof k === 'string' && !k.startsWith('prop_');
    sfx.nope();
    const head = isChar && obj.userData.head ? obj.userData.head : null;
    const tgt = head || obj;
    if (isChar) {
      const y0 = tgt.rotation.y;
      this.s.anim(0.55, (_, p) => { tgt.rotation.y = y0 + Math.sin(p * Math.PI * 4) * 0.28 * (1 - p); }).then(() => { tgt.rotation.y = y0; obj.userData._no = false; });
    } else {
      const z0 = obj.rotation.z;
      this.s.anim(0.55, (_, p) => { obj.rotation.z = z0 + Math.sin(p * Math.PI * 3) * 0.12 * (1 - p); }).then(() => { obj.rotation.z = z0; obj.userData._no = false; });
    }
  }

  // E6: the held breath before a reveal. Resolves at the release; see the API notes at the top.
  async beat(obj = null, dur = 0.45, { squash = 0.1, hush = true, duck = 0.3 } = {}) {
    if (this.dead) return;
    if (duck) duckMusic(1 - duck, dur + 0.15);
    if (hush) hushEffects(dur);
    if (!obj) { await this.wait(dur); return; }
    const s0 = obj.scale.clone();
    const set = (k) => obj.scale.set(s0.x * (1 + k * 0.5), s0.y * (1 - k), s0.z * (1 + k * 0.5));
    const down = Math.min(0.16, dur * 0.35);
    await this.s.anim(down, (e) => set(squash * e), Ease.out);
    await this.wait(Math.max(0, dur - down));
    // release: spring back with one small overshoot while the reveal starts
    this.s.anim(0.24, (_, p) => set(squash * Math.cos(p * Math.PI * 1.5) * (1 - p))).then(() => obj.scale.copy(s0));
  }

  // Camera glide (eased); later calls cancel earlier ones. pos/look: Vector3 or [x, y, z].
  glideCamera(pos, look, dur = 0.9) {
    const P = V3(pos), L = V3(look);
    if (!P || !L) return Promise.resolve();
    const tok = (this.camGlide = (this.camGlide || 0) + 1);
    const p0 = camera.position.clone(), l0 = getLook().clone();
    const cp = new T.Vector3(), cl = new T.Vector3();
    return this.s.anim(dur, (e) => { if (tok === this.camGlide) setCamera(cp.lerpVectors(p0, P, e), cl.lerpVectors(l0, L, e)); }, Ease.inOut);
  }
  // E8 helpers. Walk something (a character, or a thing a character carries) to `to` at walking pace and leave it there.
  async walkTo(obj, to, { speed = 2.4, faceCamera = true } = {}) {
    const T0 = obj.position.clone(), T1 = V3(to);
    const dist = Math.hypot(T1.x - T0.x, T1.z - T0.z) + Math.abs(T1.y - T0.y) * 0.5;
    const dur = Math.min(4, Math.max(0.4, dist / speed));
    const yaw0 = obj.rotation.y, head = Math.atan2(T1.x - T0.x, T1.z - T0.z);
    if (dist > 0.3) await this.s.tween(obj.rotation, { y: head }, 0.25, Ease.inOut);
    await this.s.anim(dur, (e) => obj.position.lerpVectors(T0, T1, e), Ease.inOut);
    if (faceCamera) await this.s.tween(obj.rotation, { y: 0 }, 0.3, Ease.inOut);
    else obj.rotation.y = yaw0;
  }
  // For props the child did NOT make only: a slow, gentle shrink-and-settle (default 0.5 s), then hidden.
  async fadeAway(obj, dur = 0.5) {
    if (!obj) return;
    const s0 = obj.scale.clone(), y0 = obj.position.y;
    await this.s.anim(dur, (e) => { const k = Math.max(0.001, 1 - e); obj.scale.set(s0.x * k, s0.y * k, s0.z * k); obj.position.y = y0 - e * 0.1; }, Ease.inOut);
    obj.visible = false;
    obj.scale.copy(s0); obj.position.y = y0;
  }

  mash() {
    setFace(this.pip.userData.face, 'scared');
    this.s.wait(0.7).then(() => setFace(this.pip.userData.face, 'happy'));
    wiggle(this.s, this.pip, 0.3, 0.8);
  }

  async timeout() {
    this.busy = true;
    await this.say('Bye bye! See you soon!');
    this.router.go('home');
  }

  // E3: "look what you made". onFinale() -> showOff() -> admire (pokes only) -> photo -> sticker -> home.
  async finale() {
    this.busy = true;
    input.lock(100000); // answers stay off; pokes (characters, scenery, the creation) still work
    fx.clearHands();
    this.clearHints();
    store.record(this.meta.id, this.records);
    store.addSticker(this.meta.id);
    const pf = this.pip?.userData?.face;
    if (pf) setFace(pf, 'happy');
    try { this.onFinale(); } catch (e) { console.error(e); }
    await this.alive(Promise.resolve(this.showOff()));
    await this.alive(Promise.resolve(this.admire()));
    await this.alive(this.takePhoto());
    const quiet = !!this.quietEnding;
    if (!quiet && this.finaleRain !== false) fx.rain();
    if (!quiet) sfx.resolve();
    this.say(quiet ? 'A sticker!' : 'You did it! A sticker!', { voice: !quiet });
    await this.alive(awardSticker(this.meta, { quiet, sparkle: false }));
    input.unlock();
    this.router.go('home', { newSticker: this.meta.id, newPhoto: this.photoUrl ? this.meta.id : null });
  }
  // Default show-off: effects stop (music carries on) and the camera glides to the game's creationView().
  async showOff() {
    hushEffects(0.5, { cut: true });
    const v = this.creationView();
    if (v && v.pos && v.look) await this.glideCamera(v.pos, v.look, v.dur ?? 0.9);
  }
  // Admire: >= admireTime s (default 4). The creation is pokeable; Pip watches; "Look what you made!".
  async admire() {
    const list = (this.creationObjects() || []).filter(Boolean);
    list.forEach((o, i) => this.pokeable(o, { note: i, of: list.length, admire: true }));
    let c = null;
    if (list.length) { _bx.makeEmpty(); for (const o of list) _bx.expandByObject(o); if (!_bx.isEmpty()) c = _bx.getCenter(new T.Vector3()); }
    const v = this.creationView();
    this.pipWatch(c || (v && V3(v.look)) || null);
    const first = !lookSaid && !this.quietEnding; // a bedtime ending stays hushed (and doesn't use up the once-per-session voice)
    if (first) lookSaid = true;
    this.say('Look what you made!', { voice: first });
    await this.wait(Math.max(4, this.admireTime ?? 4));
  }
  // Photo: a soft shutter, the white frame closes in and flies to the home button; saved to the gallery (E4).
  async takePhoto() {
    sfx.shutter();
    const url = await this.alive(snapshot(320));
    if (url) { store.addCreation(this.meta.id, url); this.photoUrl = url; }
    await this.alive(photoFlash(url));
  }
  onFinale() {}

  dispose() {
    input.setReady(null);
    physics.clear();
    this.dead = true;
    fx.clearHands();
    this.s.kill();
    this.clearHints();
    fx.clearHalos(); // rings whose stop timer was just killed with this.s
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
