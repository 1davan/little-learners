// Lesson 4 — Feelings. Topic mt_LhkP_KKIRS "Naming basic emotions".
// A short story shows Pip feeling something, and at that moment the feeling is named ("Pip is sad.").
// The child finds a friend whose face shows the same feeling ("Find a sad friend!"). The friend walks over and
// hops up beside Pip, and then SHE does the comforting: press and hold Pip for a hug (sad, scared: his face
// goes sad, calm, happy under her finger), press and hold for a big breath (angry: they puff up, let go and
// they breathe out), or tap Pip for a happy dance (happy). Then the story gets put right (a new balloon, the
// tower rebuilt…) and the friend goes to sit beside the hill, where it stays for the level (the finale's crowd).
// Each level has its own stage and story set: L1 a picnic hill, L2 a toy table, L3 a tree stump in the garden.
// Falling, tumbling and bouncing props use real physics; tapping a loose prop makes it hop.
import * as T from '../three.js';
import { Lesson, shuffle } from '../engine/lesson.js';
import { makeAnimal, setFace, hop, poke } from '../engine/actors.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';
import { physics } from '../engine/physics.js';
import { project, screenRadius } from '../engine/stage.js';
import { STORIES } from './feelings-stories.js';
import { TOP, makeStage, stagePhysics, makeBasket } from './feelings-props.js';
import { frame, calmBackdrop } from './view-tools.js';

// Per level: the stage Pip stands on, the friends who visit, and one round per row:
// [Pip's feeling, the other friends' feelings, the story that makes Pip feel it].
const PLANS = [
  {
    stage: 'picnic', kinds: ['bear', 'bunny', 'cat', 'hedgehog'],
    rounds: [
      ['happy', ['sad'], 'giftDrop'],
      ['sad', ['happy'], 'iceDrop'],
      ['angry', ['happy'], 'cupTower'],
      ['sad', ['angry'], 'balloonAway'],
      ['scared', ['happy', 'sad'], 'thunder'],
      ['happy', ['angry', 'scared'], 'cupcake'],
    ],
  },
  {
    stage: 'toytable', kinds: ['frog', 'cat', 'pig', 'bunny'],
    rounds: [
      ['sad', ['happy'], 'ballRoll'],
      ['angry', ['sad'], 'blockTower'],
      ['scared', ['happy', 'angry'], 'jackBox'],
      ['happy', ['sad', 'angry'], 'ballsBurst'],
      ['angry', ['scared', 'happy'], 'frogTakes'],
      ['scared', ['sad', 'angry'], 'spider'],
    ],
  },
  {
    stage: 'stump', kinds: ['hedgehog', 'sheep', 'bear', 'bunny'],
    rounds: [
      ['sad', ['happy', 'scared'], 'petals'],
      ['angry', ['sad', 'happy'], 'acorns'],
      ['scared', ['sad', 'angry'], 'mole'],
      ['happy', ['scared', 'sad'], 'butterfly'],
      ['angry', ['scared', 'happy'], 'potTower'],
      ['scared', ['angry', 'sad'], 'bee'],
    ],
  },
];

const KIND_NAME = { bear: 'Bear', bunny: 'Bunny', cat: 'Kitty', frog: 'Froggy', hedgehog: 'Hedgehog', pig: 'Piggy', sheep: 'Sheep' };
const SAY_FEEL = { happy: 'happy', sad: 'sad', angry: 'angry', scared: 'scared' };
const A = (e) => (e === 'angry' ? 'an' : 'a');
const FACE_ICON = { happy: '😊', sad: '😢', angry: '😠', scared: '😨' };
// her comforting gesture per feeling, and the instruction (voiced)
const GESTURE = { sad: 'hug', scared: 'hug', angry: 'breath', happy: 'tap' };
const GESTURE_LINE = { hug: 'Give Pip a hug!', breath: 'Big breath with Pip!', tap: 'Tap Pip! Happy dance!' };
const SOUND = { happy: 'giggle', sad: 'aww', angry: 'grr', scared: 'gasp' };
const STAGE_C = new T.Vector3(0, 0, -3.2);
const PIP_POS = new T.Vector3(0, TOP, -3.2);
const HEAD_S = 1.22; // bigger heads → bigger, easier-to-read faces
// where the chosen friend stands on the stage (Pip's left; the story props are on his right), and where it steps up
// from (the stage's front foot)
const ON_STAGE = { picnic: [-2.4, 1.0], toytable: [-1.9, 0.2], stump: [-2.2, 0.5] }; // (picnic: clear of the basket)
const FOOT_Z = { picnic: 2.0, toytable: -0.6, stump: 0.9 };
// the friends who stayed gather on the grass at the stage's left (the side they hop down), two rows of three
const SLOTS = [[-6.4, -4.6], [-8.0, -4.6], [-7.2, -6.2], [-9.6, -4.6], [-8.8, -6.2], [-10.4, -6.2]]; // 1.6 apart
// the finale: they all walk into one row in front of the stage, at least 1.7 apart, facing the child
const ROW_Z = 2.4, ROW_DX = 1.7, ROW_CX = -3.0;
const rowSpot = (i, n) => new T.Vector3(ROW_CX + (i - (n - 1) / 2) * ROW_DX, 0, ROW_Z);
const CAM_WIDE = [[0, 4.7, 13.2], [0, 2.6, 0]];
const CAM_STORY = [[0, 4.3, 9.6], [0, 3.1, -1.5]]; // Pip and the story big while it plays and while she comforts

export default class FeelingsLesson extends Lesson {
  build() {
    const L = this.level;
    this.lv = PLANS[L];
    this.plan = this.lv.rounds;
    const stage = (this.stage = makeStage(this.lv.stage, STAGE_C));
    this.root.add(stage);
    stagePhysics(this.lv.stage, STAGE_C);
    // Pip's body is solid for the story props: rain, a flying lid or a ball bounce off him, never pass through
    physics.box(new T.Vector3(PIP_POS.x, TOP + 1.2, PIP_POS.z), new T.Vector3(1.4, 2.4, 1.1));
    if (this.lv.stage === 'stump') {
      // a basket on the grass (a real physics container: acorns can be thrown in)
      const b = makeBasket(0xd9a066, 0.75, 0.6);
      this.basketPos = new T.Vector3(3.4, 0, -0.4);
      b.position.copy(this.basketPos);
      this.root.add(b);
      // a tight cup of static boxes (physics.container's walls leave gaps): floor on the straw bed, walls at the rim
      const bp = this.basketPos, bed = b.userData.bed ?? 0.1, r = 0.62, n = 12, seg = (2 * Math.PI * (r + 0.1)) / n;
      physics.box(new T.Vector3(bp.x, bed - 0.1, bp.z), new T.Vector3(r * 2, 0.2, r * 2));
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        physics.box(new T.Vector3(bp.x + Math.sin(a) * (r + 0.1), 0.45, bp.z + Math.cos(a) * (r + 0.1)), new T.Vector3(seg * 1.15, 0.9, 0.2), a);
      }
    }
    this.pip.position.copy(PIP_POS);
    this.pip.rotation.y = 0;
    this.pip.scale.setScalar(1.2);
    this.pip.userData.baseScale = 1.2;
    this.friends = [];
    this.dynProps = [];
    this.props = new T.Group();
    this.root.add(this.props);
    this.kindTurn = Math.floor(Math.random() * this.lv.kinds.length);
    this.stayed = []; // friends who comforted Pip and stay beside the stage
    this.shown = {};  // which comforting gestures have had their slow hand demo
    // a higher camera looks down over the friends in front, so nobody ever hides Pip's face or the hug payoff
    frame(...CAM_WIDE[0], ...CAM_WIDE[1]);
    // (no snowman / pumpkins at the near flanks: they were cut by the frame edge or hid behind a friend)
    calmBackdrop(this.meadow, { hide: (o) => Math.abs(o.position.x) > 6 && o.position.z > -9 });
    this.offs.push(this.listenPip());
  }

  // the height of the stage's top under a friend's feet (the highest point under its footprint), never below TOP
  standY(x, z) {
    if (!this.stage) return TOP;
    this.stage.updateMatrixWorld(true);
    const rc = new T.Raycaster(), dn = new T.Vector3(0, -1, 0);
    let y = TOP;
    for (const [dx, dz] of [[0, 0], [0.35, 0], [-0.35, 0], [0, 0.35], [0, -0.35]]) {
      rc.set(new T.Vector3(x + dx, TOP + 2, z + dz), dn);
      const h = rc.intersectObject(this.stage, true).find((q) => q.object.material?.side !== T.BackSide && q.point.y < TOP + 0.5);
      if (h) y = Math.max(y, h.point.y);
    }
    return y;
  }
  // stuck child: the friend who feels the same as Pip hops
  nudgeTarget() { return this.busy ? null : this.friends.find((f) => f.userData.feeling === this.emo) || null; }

  // ---- story context helpers (used by feelings-stories.js) ----
  // simulate a prop with physics and make it hop when tapped
  dyn(obj, opts) {
    physics.add(obj, opts);
    if (!this.dynProps.includes(obj)) this.dynProps.push(obj);
  }
  get P() { return PIP_POS; }

  // A tap that hits nothing else: loose physics props hop, then characters giggle (base class).
  // While she comforts Pip, a touch on Pip (or the friend) belongs to the comforting, not to a poke.
  pokeAt(x, y) {
    if (this.dead) return false;
    if (this.comforting && this.hitPip(x, y)) return true;
    const wp = new T.Vector3();
    let best = null, bd = Infinity;
    for (const o of this.dynProps) {
      if (!o.parent || !o.visible || !physics.has(o)) continue;
      o.getWorldPosition(wp);
      const c = project(wp);
      const r = Math.max(screenRadius(wp, 0.6), Math.min(innerWidth, innerHeight) * 0.06);
      const d = Math.hypot(c.x - x, c.y - y) / r;
      if (d < 1 && d < bd) { bd = d; best = o; }
    }
    if (best) { physics.poke(best, 0.7); sfx.pop(); return true; }
    return super.pokeAt(x, y);
  }

  // last round's story props settle away slowly (0.5 s); they are not something she made
  clearProps() {
    for (const p of [...this.props.children]) {
      physics.remove(p);
      this.fadeAway(p, 0.5).then(() => this.props.remove(p));
    }
    this.dynProps = [];
  }

  async startRound(r) {
    this.busy = true;
    const [emo, others, storyId] = this.plan[r];
    this.emo = emo;
    // the friends who were not chosen walk off at the sides (the chosen one already sits by the stage)
    for (const f of this.friends) {
      if (f.userData.tap) input.remove(f.userData.tap);
      if (f.userData.col) { physics.removeStatic(f.userData.col); f.userData.col = null; }
      if (this.stayed.includes(f)) continue;
      const out = new T.Vector3(f.position.x < 0 ? -11 : 11, 0, f.position.z);
      this.walkTo(f, out, { speed: 3, faceCamera: false }).then(() => this.root.remove(f));
    }
    this.friends = [];
    this.glideCamera(...CAM_WIDE, 0.6);

    // The story (one quick moment, about 1.5-2 s) plays WHILE the friends step in: she can tap a friend from the
    // start of the round (rule 0). At the story's peak Pip's face changes, the feeling is named, and the prompt
    // follows. A friend tapped early is fine: the story simply completes before the comforting starts.
    // (the last round's story is still being put right while the new friends step in: it finishes first)
    this.fix = null;
    const round = r, prevFix = this.fixP;
    this.fixP = null;
    this.storyP = (async () => {
      if (prevFix) await prevFix;
      if (this.dead) return null;
      this.clearProps();
      setFace(this.pip.userData.face, 'calm');
      this.pip.userData.head.rotation.x = 0;
      this.pip.position.copy(PIP_POS);
      this.pip.rotation.set(0, 0, 0);
      return STORIES[storyId](this, PIP_POS);
    })().then((fix) => {
      this.fix = fix;
      if (this.dead || this.round !== round) return;
      this.say(`Pip is ${SAY_FEEL[emo]}.`);
      if (!this.busy) this.cue();
    });
    // friends appear, each showing a feeling — different animals every round
    const feelings = shuffle([emo, ...others]);
    const kinds = [];
    for (let i = 0; i < feelings.length; i++) kinds.push(this.lv.kinds[(this.kindTurn++) % this.lv.kinds.length]);
    const two = feelings.length === 2;
    // two friends stand either side of Pip's stage; with three, the middle one stands further forward and smaller,
    // so (seen from the raised camera) its head stays below the stage top and never covers Pip
    const xs = two ? [-3.9, 3.9] : [-4.0, 0, 4.0];
    const zs = two ? [2.3, 2.3] : [2.2, 3.3, 2.2];
    const ss = two ? [1.05, 1.05] : [1.0, 0.75, 1.0];
    feelings.forEach((f, i) => {
      const a = makeAnimal(kinds[i]);
      const S = ss[i];
      a.position.set(xs[i], 0, zs[i]);
      a.rotation.y = -xs[i] * 0.04;
      if (a.userData.head) a.userData.head.scale.multiplyScalar(HEAD_S);
      setFace(a.userData.face, f);
      a.userData.feeling = f;
      a.userData.label = KIND_NAME[kinds[i]] || 'Friend';
      a.userData.baseScale = S;
      this.root.add(a);
      this.friends.push(a);
      a.userData.tap = this.fitTap(a, S);
      a.scale.setScalar(0.001);
      // friends step in from just beside their place, one after another, growing smoothly (no overshoot)
      const x1 = xs[i];
      const x0 = x1 + (x1 < 0 ? -1.2 : x1 > 0 ? 1.2 : 0);
      const z0 = x1 === 0 ? zs[i] + 1.0 : zs[i];
      a.position.set(x0, 0, z0);
      this.s.wait(i * 0.25).then(() => {
        if (this.dead) return;
        this.s.anim(0.6, (e) => { a.scale.setScalar(Math.max(0.001, S * e)); a.position.x = x0 + (x1 - x0) * e; a.position.z = z0 + (zs[i] - z0) * e; }, Ease.out).then(() => {
          a.position.set(x1, 0, zs[i]);
          a.scale.setScalar(S);
          // a static body where the friend stands, so a ball or lid that rolls off the stage bumps them, never passes through
          if (!this.dead && this.friends.includes(a) && !a.userData.col) a.userData.col = physics.box(new T.Vector3(x1, S, zs[i]), new T.Vector3(1.1 * S, 2 * S, 0.9 * S));
        });
      });
    });
    await this.wait(0.25 * (feelings.length - 1) + 0.35);
    this.busy = false; // taps open now; the prompt comes at the story's peak
  }

  // Tap area = the friend's visible body at its final size.
  fitTap(a, S) {
    a.scale.setScalar(S);
    a.updateMatrixWorld(true);
    const box = new T.Box3().setFromObject(a);
    const c = box.getCenter(new T.Vector3()).sub(a.position), size = box.getSize(new T.Vector3());
    a.userData.hitC = c;
    return input.addTap(a, { radius: Math.max(size.x, size.y) / 2 * 0.85, offset: c, onTap: () => this.tapFriend(a) });
  }

  promptText() { return `Find ${A(this.emo)} ${SAY_FEEL[this.emo]} friend!`; }

  async tapFriend(a) {
    if (this.busy || !this.friends.includes(a)) return;
    const f = a.userData.feeling;
    sfx[SOUND[f]]();
    if (f !== this.emo) {
      hop(this.s, a, 0.4);
      fx.float(a.getWorldPosition(new T.Vector3()).add(new T.Vector3(0, 3.0, 0)), FACE_ICON[f], { size: 6 });
      this.redirect(`That one is ${SAY_FEEL[f]}. Find ${A(this.emo)} ${SAY_FEEL[this.emo]} friend!`);
      return;
    }
    for (const o of this.friends) if (o.userData.tap) o.userData.tap.enabled = false;
    if (a.userData.col) { physics.removeStatic(a.userData.col); a.userData.col = null; }
    // the others wave bye and walk off at the sides (so the close-up of the comforting has nobody in front)
    for (const o of this.friends) if (o !== a) {
      if (o.userData.col) { physics.removeStatic(o.userData.col); o.userData.col = null; }
      setFace(o.userData.face, 'happy');
      const out = new T.Vector3(o.position.x < 0 ? -11 : 11, 0, o.position.z);
      this.walkTo(o, out, { speed: 3, faceCamera: false }).then(() => { this.root.remove(o); this.friends = this.friends.filter((x) => x !== o); });
    }
    this.chosen = a;
    // it walks to the foot of the stage and hops up beside Pip (on his left: the story props are on his right)
    const st = this.lv.stage;
    const [ox, oz] = ON_STAGE[st];
    const to = new T.Vector3(PIP_POS.x + ox, TOP, PIP_POS.z + oz);
    to.y = this.standY(to.x, to.z); // on the stage's real top (the stump's rings stand a little proud of TOP)
    const foot = new T.Vector3(to.x, 0, FOOT_Z[st]);
    const go = (async () => {
      await this.walkTo(a, foot, { speed: 3.0, faceCamera: false });
      if (this.dead) return;
      const from = a.position.clone(), s0 = a.scale.x;
      sfx.land();
      // up first, then over (it clears the stage's front slope instead of hopping through it)
      await this.s.anim(1.0, (_, p) => {
        const up = 1 - (1 - p) ** 2, over = Ease.inOut(p); // (a gentler take-off: no jump in speed)
        a.position.set(from.x + (to.x - from.x) * over, from.y + (to.y - from.y) * up + Math.sin(p * Math.PI) * 1.2, from.z + (to.z - from.z) * over);
        a.scale.setScalar(s0 + (1.0 - s0) * p);
      });
      a.position.copy(to);
      a.userData.baseScale = 1.0;
      await this.s.tween(a.rotation, { y: 0.6 }, 0.3, Ease.inOut);
    })();
    this.arriveP = go;
    // the comforting starts at once (it is on Pip, who is already there): the friend joins in when it arrives
    this.success(a.getWorldPosition(new T.Vector3()).add(new T.Vector3(0, 2, 0)), '', { payoff: this.storyP, still: 0 });
  }

  // Pip's reaction in this game IS the comforting moment (played from afterSuccess).
  celebrate() {}

  // ---- her comforting gesture ----
  // pointer listeners of our own: press and hold needs the down and the up (input only gives taps and drags)
  listenPip() {
    const cv = document.getElementById('c');
    const down = (e) => { const c = this.comforting; if (!c || c.auto || !this.hitPip(e.clientX, e.clientY)) return; c.idle = 0; this.comfortDown(); };
    const up = () => { const c = this.comforting; if (c && c.holding) this.comfortUp(); };
    cv.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => { cv.removeEventListener('pointerdown', down); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); };
  }
  hitPip(x, y) {
    const near = (o, h, r) => {
      const wp = o.getWorldPosition(new T.Vector3()); wp.y += h;
      const c = project(wp);
      const rr = Math.max(screenRadius(wp, r), Math.min(innerWidth, innerHeight) * 0.1);
      return Math.hypot(c.x - x, c.y - y) < rr;
    };
    return near(this.pip, 1.3 * this.pip.scale.y, 1.3) || (this.chosen && near(this.chosen, 1.0, 1.0));
  }
  // the slow hand demo of the gesture: a long press (hug, breath) or two taps (dance) on Pip
  comfortDemo(kind) {
    const h = this.pip.userData.head.getWorldPosition(new T.Vector3());
    h.y -= 0.35;
    if (kind === 'tap') fx.ghostPath([h], { mode: 'tap' });
    else fx.ghostPath([h, h, h], { mode: 'drag', maxDur: 2.6 }); // a press held for about 1.5 s
  }
  async comfort(a) {
    const kind = GESTURE[this.emo];
    const c = (this.comforting = { kind, a, prog: 0, puff: 0, holding: false, taps: 0, anim: false, idle: 0, said: 0, auto: false, ready: false, x0: a.position.x, ar: a.rotation.z, pr: this.pip.rotation.z });
    const done = new Promise((res) => { c.res = res; });
    (this.arriveP || Promise.resolve()).then(() => { c.x0 = a.position.x; c.ar = a.rotation.z; c.ready = true; });
    this.glideCamera(...CAM_STORY, 0.9);
    this.say(GESTURE_LINE[kind]);
    if (!this.shown[kind]) { this.shown[kind] = true; this.s.wait(0.6).then(() => { if (this.comforting === c && !c.holding && !c.taps) this.comfortDemo(kind); }); }
    this.endStep = () => this.autoComfort(); this.endWaiting = true; // (autoplay: tools/autoplay.js)
    await done;
    this.endWaiting = false;
    this.comforting = null;
    fx.clearHands();
  }
  comfortDown() {
    const c = this.comforting;
    fx.clearHands();
    if (c.kind === 'tap') { this.danceStep(); return; }
    c.holding = true;
    if (c.kind === 'hug') sfx.mmm();
  }
  comfortUp() {
    const c = this.comforting;
    c.holding = false;
    if (c.kind === 'breath' && c.puff > 0.45 && !c.anim) this.breatheOut();
  }
  // happy: each tap is one spin-hop together; three and the dance is done
  async danceStep() {
    const c = this.comforting, pip = this.pip, a = c.a, s = this.s;
    if (c.anim) return;
    c.anim = true;
    if (c.taps === 0) sfx.giggle();
    const r0 = pip.rotation.y, a0 = a.rotation.y, withA = c.ready; // (the friend joins in once it has arrived)
    await Promise.all([
      s.anim(0.7, (e) => { pip.rotation.y = r0 + e * Math.PI * 2; if (withA) a.rotation.y = a0 - e * Math.PI * 2; }, Ease.inOut),
      hop(s, pip, 0.45, 0.7), withA ? hop(s, a, 0.45, 0.7) : null,
    ]);
    pip.rotation.y = r0; if (withA) a.rotation.y = a0;
    c.anim = false;
    if (++c.taps >= 3) this.comfortDone();
  }
  // angry: let go after a big breath in -> they breathe out (whoosh), deflate and calm down
  async breatheOut() {
    const c = this.comforting, s = this.s, pip = this.pip, a = c.a, PS = pip.userData.baseScale || 1.2;
    c.anim = true;
    sfx.whoosh();
    const p0 = c.puff;
    setFace(pip.userData.face, 'calm'); setFace(a.userData.face, 'calm');
    await s.anim(1.0, (e) => { c.puff = p0 * (1 - e); }, Ease.inOut);
    c.puff = 0;
    pip.scale.setScalar(PS); if (c.ready) a.scale.setScalar(1);
    this.comfortDone();
  }
  comfortDone() {
    const c = this.comforting;
    if (!c || c.finished) return;
    c.finished = true;
    const pip = this.pip, a = c.a;
    setFace(pip.userData.face, 'happy'); setFace(a.userData.face, 'happy');
    pip.userData.head.rotation.x = 0;
    // they let go of the hug gently
    const ax = a.position.x, pr = pip.rotation.z, ar = a.rotation.z, withA = c.ready;
    this.s.anim(0.45, (e) => { pip.rotation.z = pr + (c.pr - pr) * e; if (withA) { a.position.x = ax + (c.x0 - ax) * e; a.rotation.z = ar + (c.ar - ar) * e; } }, Ease.inOut)
      .then(() => { pip.scale.setScalar(pip.userData.baseScale || 1.2); if (withA) a.scale.setScalar(1); c.res(); });
  }
  // nothing from her for a while: the gesture plays by itself (and autoplay uses this too)
  async autoComfort() {
    const c = this.comforting;
    if (!c || c.auto || c.finished) return;
    c.auto = true;
    fx.clearHands();
    if (c.kind === 'tap') { while (this.comforting === c && !c.finished && !this.dead) { if (!c.anim) this.danceStep(); await this.wait(0.1); } return; }
    c.holding = true;
    if (c.kind === 'hug') { sfx.mmm(); while (this.comforting === c && c.prog < 1 && !this.dead) await this.wait(0.05); return; }
    while (this.comforting === c && c.puff < 0.95 && !this.dead) await this.wait(0.05);
    c.holding = false;
    if (!c.anim) this.breatheOut();
  }
  // the gesture under her finger, every frame
  comfortTick(dt) {
    const c = this.comforting, pip = this.pip, a = c.a, PS = pip.userData.baseScale || 1.2;
    if (c.finished) return;
    if (!c.holding && !c.anim && !c.auto) {
      c.idle += dt;
      if (c.idle > 6 && c.said < 1) { c.said = 1; this.say(GESTURE_LINE[c.kind], { repeat: true }); this.comfortDemo(c.kind); }
      if (c.idle > 11) this.autoComfort();
    }
    if (c.kind === 'hug') {
      // holding: they squeeze together and Pip's face goes sad -> calm -> happy over 1.5 s of hugging
      if (c.holding) c.prog = Math.min(1, c.prog + dt / 1.5);
      const k = c.holding ? 1 : 0;
      c.lean = (c.lean || 0) + (k - (c.lean || 0)) * Math.min(1, dt * 6);
      pip.rotation.z = c.pr + 0.12 * c.lean;
      const sq = 1 + 0.07 * c.lean * (0.6 + 0.4 * Math.sin(performance.now() / 160));
      pip.scale.set(PS * sq, PS / sq, PS * sq);
      if (c.ready) { // the friend joins the hug once it has arrived
        a.position.x = c.x0 + (Math.min(c.x0 + 0.35, PIP_POS.x - 1.45) - c.x0) * c.lean; // leans in, never into Pip
        a.rotation.z = c.ar - 0.15 * c.lean;
        a.scale.set(sq, 1 / sq, sq);
      }
      const face = c.prog > 0.66 ? 'happy' : c.prog > 0.33 ? 'calm' : this.emo;
      if (pip.userData.face && pip.userData.face.userData.emotion !== face) { setFace(pip.userData.face, face); if (c.prog > 0.33) pip.userData.head.rotation.x = 0; }
      if (c.prog >= 1) this.comfortDone();
    } else if (c.kind === 'breath') {
      // holding: both slowly puff up (a big breath in)
      if (c.holding) c.puff = Math.min(1, c.puff + dt / 1.2);
      else if (!c.anim) c.puff = Math.max(0, c.puff - dt / 0.6);
      pip.scale.setScalar(PS * (1 + 0.2 * c.puff)); if (c.ready) a.scale.setScalar(1 + 0.2 * c.puff);
    }
  }

  // The round's ending: her comforting, then the story is put right, then the friend goes to sit beside the stage.
  async afterSuccess() {
    const a = this.chosen;
    this.chosen = null;
    for (const f of this.friends) if (f !== a) setFace(f.userData.face, 'happy');
    if (!a || this.dead) return;
    if (this.storyP) await this.storyP; // (tapped early: the story completes first)
    if (this.dead) return;
    await this.comfort(a);
    if (this.dead) return;
    // the story is put right and the friend goes to sit with the others WHILE the next round's friends step in
    const fix = this.fix;
    this.fixP = fix ? this.wait(0.2).then(() => Promise.race([Promise.resolve(fix()), this.wait(3)])) : null;
    this.stayed.push(a);
    (this.arriveP || Promise.resolve()).then(() => this.toSlot(a));
  }

  // the friend hops down off the stage's left side and walks (round the back, for the right-hand slots) to its place
  async toSlot(a) {
    const i = this.stayed.indexOf(a);
    const [sx, sz] = SLOTS[i % SLOTS.length];
    const from = a.position.clone(), s0 = a.scale.x, S = 0.8;
    const down = new T.Vector3(-5.0, 0, PIP_POS.z - 0.2);
    sfx.land();
    // over first, then down (clear of the stage's side slope)
    await this.s.anim(0.85, (_, p) => { const over = Ease.out(p), dn = Ease.in(p); a.position.set(from.x + (down.x - from.x) * over, from.y * (1 - dn) + Math.sin(p * Math.PI) * 0.25, from.z + (down.z - from.z) * over); a.scale.setScalar(s0 + (S - s0) * p); });
    a.position.copy(down);
    a.userData.baseScale = S;
    if (this.dead) return;
    if (this.finaleNow) return this.toRow(a); // (the level ended meanwhile: straight into the finale row)
    await this.walkTo(a, new T.Vector3(sx, 0, sz), { speed: 2.4, faceCamera: false });
    if (this.finaleNow) return this.toRow(a);
    await this.s.tween(a.rotation, { y: 0.45 }, 0.4, Ease.inOut);
    a.userData.seated = true;
  }
  // the finale row in front of the stage (via a point clear of the stage's left side and the flowers)
  async toRow(a) {
    const n = this.stayed.length, i = a.userData.rowI ?? this.stayed.indexOf(a), spot = rowSpot(i, n);
    if (a.userData.rowDelay) await this.wait(a.userData.rowDelay); // (one after another: a little queue, never a clump)
    if (this.dead) return;
    if (a.position.z < 1.5) await this.walkTo(a, new T.Vector3(-6.4, 0, 2.6), { speed: 3.6, faceCamera: false });
    if (this.dead) return;
    await this.walkTo(a, spot, { speed: 3.6, faceCamera: true });
  }

  update(dt, t) {
    // wings on bees and butterflies
    for (const p of this.props.children) {
      const w = p.userData.wings;
      if (!w) continue;
      const k = Math.sin(t * (p.userData.flap || 10)) * 0.7;
      if (!w[0] || !w[1]) continue;
      if (w[0].isGroup || w[0].isBone) { w[0].rotation.z = k; w[1].rotation.z = -k; } else { w[0].rotation.x = k; w[1].rotation.x = -k; }
    }
    if (this.comforting) this.comfortTick(dt);
    // friends act out their feeling while waiting
    this.friends.forEach((a, i) => {
      const h = a.userData.head;
      if (!h || this.busy) return;
      const f = a.userData.feeling;
      if (f === 'sad') h.rotation.x = 0.25 + Math.sin(t * 1.5 + i) * 0.05;
      else if (f === 'angry') h.rotation.z = Math.sin(t * 22 + i) * 0.04;
      else if (f === 'scared') h.position.x = Math.sin(t * 40 + i) * 0.03;
      else if (f === 'happy') h.rotation.z = Math.sin(t * 4 + i) * 0.15;
    });
  }

  showHint(glow = true) {
    const a = this.friends.find((f) => f.userData.feeling === this.emo);
    if (!a) return;
    if (glow) this.addHalo(a.userData.head, 1.3);
    // point at the tummy: the face (the answer) stays visible
    const p = a.getWorldPosition(new T.Vector3()); p.y += 0.7 * a.scale.y;
    fx.ghostHand(p);
  }

  choicePoints() { return this.friends.map((a) => { const p = a.getWorldPosition(new T.Vector3()); p.y += 0.7 * a.scale.y; return p; }); }

  makeErrorless() {
    for (const a of this.friends) if (a.userData.feeling !== this.emo) {
      a.userData.tap.enabled = false;
      const k = a.userData.baseScale * 0.6;
      this.s.tween(a.scale, { x: k, y: k, z: k }, 0.4);
    }
  }

  // ---- the ending: Pip on his stage with every friend who stayed; a poke makes a friend giggle ----
  // framed from the row of friends plus Pip on his stage, so it fills about 60% of the height and fits the 4:3 photo
  creationView() {
    const n = Math.max(1, this.stayed.length);
    const half = Math.max(3.4, ((n - 1) * ROW_DX) / 2 + 1.0);
    const cx = Math.min(0, ROW_CX + 0.4);
    const look = new T.Vector3(cx * 0.6, 2.5, -0.6);
    const dist = Math.max(12.0, (half + Math.abs(cx * 0.4) + 0.6) / 0.484);
    return { pos: [look.x, look.y + dist * 0.22, look.z + dist], look: [look.x, look.y, look.z] };
  }
  creationObjects() { return this.stayed.slice(); }
  onAdmirePoke(obj) { setFace(obj.userData.face, 'joy'); poke(this.s, obj); this.s.wait(0.8).then(() => { if (obj.userData.face) setFace(obj.userData.face, 'happy'); }); }
  onFinale() {
    setFace(this.pip.userData.face, 'happy');
    this.finaleNow = true;
    this.admireTime = 5;
    for (const a of this.friends) if (!this.stayed.includes(a)) this.walkTo(a, new T.Vector3(a.position.x < 0 ? -11 : 11, 0, a.position.z), { speed: 3, faceCamera: false });
    // everyone who stayed walks into one row in front of the stage and turns to the child: the one nearest the
    // stage goes first, to the far (right) end, the others follow in a queue
    const order = this.stayed.slice().sort((p, q) => q.position.x - p.position.x);
    const n = order.length;
    order.forEach((a, k) => { a.userData.rowI = n - 1 - k; a.userData.rowDelay = k * 0.35; });
    for (const a of this.stayed) { setFace(a.userData.face, 'happy'); if (a.userData.seated) this.toRow(a); }
  }
}
