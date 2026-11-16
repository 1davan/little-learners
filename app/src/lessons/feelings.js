// Lesson 4 — Feelings. Topic mt_LhkP_KKIRS "Naming basic emotions".
// A short story shows Pip feeling something; the child finds the friend whose face shows the same feeling.
// Then comes a little "fix the feeling" moment: a hug for sad, a big breath for angry, a cuddle for scared,
// a happy dance for happy — and the story gets put right (a new balloon, the tower rebuilt…).
// Each level has its own stage and story set: L1 a picnic hill, L2 a toy table, L3 a tree stump in the garden.
// Falling, tumbling and bouncing props use real physics; tapping a loose prop makes it hop.
import * as T from '../three.js';
import { Lesson, shuffle } from '../engine/lesson.js';
import { makeAnimal, setFace, popIn, popOut, hop } from '../engine/actors.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';
import { physics } from '../engine/physics.js';
import { project, screenRadius } from '../engine/stage.js';
import { makeFlower } from '../engine/scenery.js';
import { STORIES } from './feelings-stories.js';
import { TOP, makeStage, stagePhysics, makeBasket, flowerProp } from './feelings-props.js';
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
const FACE_ICON = { happy: '😊', sad: '😢', angry: '😠', scared: '😨' };
// fix-the-feeling moves rotate, so the payoff is never the same twice in a row
const FIXES = {
  sad: [['hug', 'Sad. 😢 Big hug!'], ['pat', 'Sad. 😢 Pat pat, all better!'], ['flower', 'Sad. 😢 A flower for you!']],
  angry: [['breath', 'Angry! 😠 Big breath…'], ['stomp', 'Angry! 😠 Stomp it out!'], ['breath', 'Angry! 😠 Breathe in… and out.']],
  scared: [['cuddle', "Scared! 😨 It's okay. Cuddle!"], ['brave', 'Scared! 😨 We are brave together!'], ['cuddle', "Scared! 😨 I'm here with you."]],
  happy: [['dance', 'Happy! 😊 Happy dance!'], ['five', 'Happy! 😊 High five!'], ['dance', 'Happy! 😊 Spin spin!']],
};
const SOUND = { happy: 'giggle', sad: 'aww', angry: 'grr', scared: 'gasp' };
const STAGE_C = new T.Vector3(0, 0, -3.2);
const PIP_POS = new T.Vector3(0, TOP, -3.2);
const HEAD_S = 1.22; // bigger heads → bigger, easier-to-read faces

export default class FeelingsLesson extends Lesson {
  build() {
    const L = this.level;
    this.lv = PLANS[L];
    this.plan = this.lv.rounds;
    const stage = makeStage(this.lv.stage, STAGE_C);
    this.root.add(stage);
    stagePhysics(this.lv.stage, STAGE_C);
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
    this.fixTurn = {};
    // a higher camera looks down over the friends in front, so nobody ever hides Pip's face or the hug payoff
    frame(0, 4.7, 13.2, 0, 2.6, 0);
    calmBackdrop(this.meadow);
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
  pokeAt(x, y) {
    if (this.dead) return false;
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
    if (best) { physics.poke(best, 0.8); sfx.boing(); return true; }
    return super.pokeAt(x, y);
  }

  clearProps() {
    for (const p of [...this.props.children]) {
      physics.remove(p);
      popOut(this.s, p, 0.2).then(() => this.props.remove(p));
    }
    this.dynProps = [];
  }

  async startRound(r) {
    this.busy = true;
    const [emo, others, storyId] = this.plan[r];
    this.emo = emo;
    // last round's friends hop away; their tap targets go too (a stale one must never answer a tap)
    for (const f of this.friends) {
      if (f.userData.tap) input.remove(f.userData.tap);
      sfx.swoosh();
      if (f.userData.col) { physics.removeStatic(f.userData.col); f.userData.col = null; }
      popOut(this.s, f, 0.2).then(() => this.root.remove(f));
    }
    this.friends = [];
    this.clearProps();
    await this.wait(0.22);
    setFace(this.pip.userData.face, 'calm');
    this.pip.userData.head.rotation.x = 0;
    this.pip.position.copy(PIP_POS);
    this.pip.rotation.set(0, 0, 0);

    this.fix = await STORIES[storyId](this, PIP_POS);
    await this.wait(0.1);
    // friends appear, each showing a feeling — different animals every round
    const feelings = shuffle([emo, ...others]);
    const kinds = [];
    for (let i = 0; i < feelings.length; i++) kinds.push(this.lv.kinds[(this.kindTurn++) % this.lv.kinds.length]);
    const two = feelings.length === 2;
    // two friends stand either side of Pip's stage; with three, the middle one stands further forward and smaller,
    // so (seen from the raised camera) its head stays below the stage top and never covers Pip
    const xs = two ? [-4.4, 4.4] : [-4.7, 0, 4.7];
    const zs = two ? [2.3, 2.3] : [2.2, 4.4, 2.2];
    const ss = two ? [1.22, 1.22] : [1.15, 0.82, 1.15];
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
      // friends bounce in from the side, one after another
      const x1 = xs[i];
      const x0 = x1 + (x1 < 0 ? -2.5 : x1 > 0 ? 2.5 : 0);
      a.position.x = x0;
      this.s.wait(i * 0.1).then(() => {
        if (this.dead) return;
        popIn(this.s, a, S, 0.35);
        this.s.anim(0.35, (e, p) => { a.position.x = x0 + (x1 - x0) * e; a.position.y = Math.sin(p * Math.PI) * 0.6; }, Ease.out).then(() => {
          a.position.set(x1, 0, zs[i]);
          // a static body where the friend stands, so a ball or lid that rolls off the stage bumps them, never passes through
          if (!this.dead && this.friends.includes(a) && !a.userData.col) a.userData.col = physics.box(new T.Vector3(x1, S, zs[i]), new T.Vector3(1.1 * S, 2 * S, 0.9 * S));
        });
      });
      this.s.wait(0.25 + i * 0.12).then(() => { if (!this.dead) sfx[SOUND[f]](); });
    });
    await this.wait(0.35);
    this.busy = false;
    this.cue();
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

  promptText() { return `Pip is ${SAY_FEEL[this.emo]} ${FACE_ICON[this.emo]}. Who else is ${SAY_FEEL[this.emo]}?`; }

  async tapFriend(a) {
    if (this.busy || !this.friends.includes(a)) return;
    const f = a.userData.feeling;
    sfx[SOUND[f]]();
    if (f !== this.emo) {
      hop(this.s, a, 0.4);
      fx.float(a.getWorldPosition(new T.Vector3()).add(new T.Vector3(0, 3.6, 0)), FACE_ICON[f], { size: 6 });
      this.redirect(`${a.userData.label} is ${SAY_FEEL[f]} ${FACE_ICON[f]}. Find ${SAY_FEEL[this.emo]} ${FACE_ICON[this.emo]}!`);
      return;
    }
    this.busy = true;
    input.lock(3000);
    fx.float(a.getWorldPosition(new T.Vector3()).add(new T.Vector3(0, 3.4, 0)), FACE_ICON[f], { size: 7 });
    // the friend hops over to Pip's left on the stage (props are on the right)
    if (a.userData.col) { physics.removeStatic(a.userData.col); a.userData.col = null; }
    const from = a.position.clone(), s0 = a.scale.x;
    const to = new T.Vector3(PIP_POS.x - 1.8, TOP, PIP_POS.z + 0.8); // beside Pip, not inside (the hug leans in)
    sfx.swoosh();
    await this.s.anim(0.4, (e, p) => {
      a.position.lerpVectors(from, to, e);
      a.position.y += Math.sin(p * Math.PI) * 1.6;
      a.scale.setScalar(s0 + (1.0 - s0) * e);
    }, Ease.inOut);
    a.userData.baseScale = 1.0;
    a.rotation.y = 0.6;
    sfx.land();
    const list = FIXES[this.emo];
    const k = (this.fixTurn[this.emo] = ((this.fixTurn[this.emo] ?? -1) + 1) % list.length);
    const [move, line] = list[k];
    this.fixP = this.fixFeeling(a, move);
    this.busy = false;
    this.success(a.getWorldPosition(new T.Vector3()).add(new T.Vector3(0, 2, 0)), line);
  }

  // Pip's celebration in this game IS the fix-the-feeling moment (played from tapFriend).
  celebrate() {}

  async fixFeeling(a, move) {
    const pip = this.pip, s = this.s;
    const top = PIP_POS.clone().add(new T.Vector3(-0.7, 2.4, 0.6));
    const storyFix = this.fix ? Promise.resolve(this.fix()) : Promise.resolve();
    const cheer = () => { setFace(pip.userData.face, 'happy'); setFace(a.userData.face, 'happy'); pip.userData.head.rotation.x = 0; };
    const PS = 1.2;
    const hearts = (sym = '♥', col = '#ff6f9c') => { for (let i = 0; i < 3; i++) s.wait(i * 0.1).then(() => fx.float(top.clone().add(new T.Vector3((i - 1) * 0.8, 0, 0)), sym, { color: col, size: 6 })); };
    if (move === 'hug' || move === 'cuddle') {
      // a squeezy hug: both lean in and squash together, hearts pop out
      const ax = a.position.x, pr = pip.rotation.z, ar = a.rotation.z;
      sfx.mmm();
      await s.anim(0.25, (e) => { a.position.x = ax + 0.5 * e; pip.rotation.z = pr + 0.2 * e; a.rotation.z = ar - 0.2 * e; }, Ease.out);
      hearts();
      await s.anim(0.3, (_, p) => { const k = 1 + Math.sin(p * Math.PI) * 0.12; pip.scale.set(PS * k, PS / k, PS * k); a.scale.set(k, 1 / k, k); });
      cheer(); sfx.twinkle();
      await s.anim(0.2, (e) => { a.position.x = ax + 0.5 * (1 - e); pip.rotation.z = pr + 0.2 * (1 - e); a.rotation.z = ar - 0.2 * (1 - e); });
      pip.scale.setScalar(PS); a.scale.setScalar(1);
    } else if (move === 'pat') {
      // the friend pats Pip's head: pat, pat, pat
      const arm = a.userData.arms?.[1] || a.userData.arms?.[0];
      const r0 = arm ? arm.rotation.z : 0;
      for (let i = 0; i < 3; i++) {
        sfx.tap();
        if (arm) s.anim(0.18, (_, p) => { arm.rotation.z = r0 - Math.sin(p * Math.PI) * 1.2; });
        await s.anim(0.18, (_, p) => { const k = 1 - Math.sin(p * Math.PI) * 0.1; pip.scale.set(PS / Math.sqrt(k), PS * k, PS / Math.sqrt(k)); });
      }
      if (arm) arm.rotation.z = r0;
      pip.scale.setScalar(PS);
      cheer(); hearts(); sfx.twinkle();
    } else if (move === 'flower') {
      // the friend gives Pip a flower
      const fl = flowerProp(0xff8fc0, 1);
      fl.position.copy(a.position).add(new T.Vector3(0.8, 0.9, 0.4));
      this.props.add(fl);
      sfx.pop();
      await popIn(s, fl, 2.2, 0.3, { sound: false });
      await s.tween(fl.position, { x: PIP_POS.x - 0.45, y: TOP + 0.9 }, 0.25, Ease.out);
      cheer(); hearts('✿', '#ff8fc0'); sfx.twinkle();
      await hop(s, pip, 0.4, 0.3);
    } else if (move === 'breath') {
      // a big breath in… and out
      sfx.swoosh();
      await s.anim(0.35, (e) => { pip.scale.setScalar(PS * (1 + 0.2 * e)); a.scale.setScalar(1 + 0.2 * e); }, Ease.out);
      sfx.whoosh();
      fx.float(top, '💨', { size: 6 });
      setFace(pip.userData.face, 'calm'); setFace(a.userData.face, 'calm');
      await s.anim(0.35, (e) => { pip.scale.setScalar(PS * (1.2 - 0.2 * e)); a.scale.setScalar(1.2 - 0.2 * e); }, Ease.inOut);
      cheer();
    } else if (move === 'stomp') {
      // stomp stomp the cross away… then a giggle
      for (let i = 0; i < 2; i++) {
        await Promise.all([hop(s, pip, 0.3, 0.2), hop(s, a, 0.3, 0.2)]);
        sfx.drumLoud();
      }
      cheer(); sfx.giggle(); hearts('☺', '#ffb020');
      await Promise.all([hop(s, pip, 0.5, 0.3), hop(s, a, 0.5, 0.3)]);
    } else if (move === 'brave') {
      // puff up tall and brave together, with a star
      sfx.trumpetHi ? sfx.trumpetHi() : sfx.twinkle();
      cheer();
      await s.anim(0.35, (e) => { pip.scale.set(PS, PS * (1 + 0.25 * e), PS); a.scale.set(1, 1 + 0.25 * e, 1); }, Ease.back);
      fx.float(top, '⭐', { size: 7 });
      await s.anim(0.3, (e) => { pip.scale.set(PS, PS * (1.25 - 0.25 * e), PS); a.scale.set(1, 1.25 - 0.25 * e, 1); });
      pip.scale.setScalar(PS); a.scale.setScalar(1);
    } else if (move === 'five') {
      // jump up and high-five
      const ax = a.position.x;
      sfx.boing2();
      await Promise.all([
        hop(s, pip, 0.8, 0.36),
        s.anim(0.36, (_, p) => { a.position.x = ax + Math.sin(p * Math.PI) * 0.6; a.position.y = TOP + Math.sin(p * Math.PI) * 0.8; }),
      ]);
      a.position.set(ax, TOP, a.position.z);
      sfx.pop(); fx.confetti(top.clone(), 16);
      cheer();
    } else {
      // happy: a little spin dance together
      sfx.giggle();
      fx.float(top, '✨', { color: '#ffd23f', size: 6 });
      const r0 = pip.rotation.y, a0 = a.rotation.y;
      cheer();
      await Promise.all([
        s.anim(0.6, (e) => { pip.rotation.y = r0 + e * Math.PI * 2; a.rotation.y = a0 - e * Math.PI * 2; }, Ease.inOut),
        hop(s, pip, 0.6, 0.3).then(() => hop(s, pip, 0.4, 0.28)),
        hop(s, a, 0.6, 0.3).then(() => hop(s, a, 0.4, 0.28)),
      ]);
      pip.rotation.y = r0; a.rotation.y = a0;
    }
    await Promise.race([storyFix, s.wait(0.5)]);
  }

  async afterSuccess() {
    setFace(this.pip.userData.face, 'happy');
    this.pip.userData.head.rotation.x = 0;
    for (const f of this.friends) setFace(f.userData.face, 'happy');
    if (this.fixP) await Promise.race([this.fixP, this.wait(0.35)]);
    this.fixP = null;
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
    fx.ghostHand(a.userData.head.getWorldPosition(new T.Vector3()));
  }

  choicePoints() { return this.friends.map((a) => a.userData.head.getWorldPosition(new T.Vector3())); }

  makeErrorless() {
    for (const a of this.friends) if (a.userData.feeling !== this.emo) {
      a.userData.tap.enabled = false;
      const k = a.userData.baseScale * 0.6;
      this.s.tween(a.scale, { x: k, y: k, z: k }, 0.4);
    }
  }

  onFinale() {
    for (const a of this.friends) { setFace(a.userData.face, 'happy'); hop(this.s, a, 0.8); }
    for (const o of this.dynProps) physics.poke(o, 1.2);
  }
}
