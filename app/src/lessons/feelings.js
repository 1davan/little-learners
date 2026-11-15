// Lesson 4 — Feelings. Topic mt_LhkP_KKIRS "Naming basic emotions".
// A short story shows Pip feeling something; the child finds the friend whose face shows the same feeling.
// Then comes a little "fix the feeling" moment: a hug for sad, a big breath for angry, a cuddle for scared,
// a happy dance for happy — and the story gets put right (a new balloon, the tower rebuilt…).
import * as T from '../three.js';
import { Lesson, shuffle } from '../engine/lesson.js';
import { mesh, geo } from '../engine/toon.js';
import { makeAnimal, setFace, popIn, popOut, hop } from '../engine/actors.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';
import { nextStory } from './feelings-stories.js';

const KINDS = ['bear', 'bunny', 'cat', 'frog', 'hedgehog'];
const KIND_NAME = { bear: 'Bear', bunny: 'Bunny', cat: 'Kitty', frog: 'Froggy', hedgehog: 'Hedgehog' };
const SAY_FEEL = { happy: 'happy', sad: 'sad', angry: 'angry', scared: 'scared' };
const FACE_ICON = { happy: '😊', sad: '😢', angry: '😠', scared: '😨' };
const MATCH_LINE = { happy: 'Happy! 😊 Happy dance!', sad: 'Sad. 😢 Big hug!', angry: 'Angry! 😠 Big breath…', scared: "Scared! 😨 It's okay. Cuddle!" };
const SOUND = { happy: 'giggle', sad: 'aww', angry: 'grr', scared: 'gasp' };
const PIP_POS = new T.Vector3(0, 3.0, -3.2);
const HEAD_S = 1.22; // bigger heads → bigger, easier-to-read faces

export default class FeelingsLesson extends Lesson {
  build() {
    const L = this.level;
    this.plan = L === 0
      ? [['happy', ['sad']], ['sad', ['happy']], ['angry', ['happy']], ['sad', ['angry']], ['scared', ['happy', 'sad']], ['happy', ['angry', 'scared']]]
      : [['sad', ['happy']], ['angry', ['sad']], ['scared', ['happy']], ['happy', ['sad', 'angry']], ['angry', ['scared', 'happy']], ['scared', ['sad', 'angry']]];
    // Pip stands on a little hill in the middle so the story is easy to see
    const hill = mesh(geo.sphere(1, 28, 14), 0x7cc95c, { outline: 0.02 });
    hill.scale.set(3.4, 3.0, 2.4);
    hill.position.set(0, 0, -3.4);
    this.root.add(hill);
    this.pip.position.copy(PIP_POS);
    this.pip.rotation.y = 0;
    this.pip.scale.setScalar(1.2);
    this.pip.userData.baseScale = 1.2;
    this.friends = [];
    this.props = new T.Group();
    this.root.add(this.props);
    this.kindTurn = Math.floor(Math.random() * KINDS.length);
  }

  async startRound(r) {
    this.busy = true;
    const [emo, others] = this.plan[r];
    this.emo = emo;
    // last round's friends hop away; their tap targets go too (a stale one must never answer a tap)
    for (const f of this.friends) {
      if (f.userData.tap) input.remove(f.userData.tap);
      popOut(this.s, f, 0.2).then(() => this.root.remove(f));
    }
    this.friends = [];
    for (const p of [...this.props.children]) popOut(this.s, p, 0.2).then(() => this.props.remove(p));
    await this.wait(0.2);
    this.props.clear();
    setFace(this.pip.userData.face, 'calm');
    this.pip.userData.head.rotation.x = 0;

    this.fix = await this.story(emo);
    // friends appear, each showing a feeling — different animals every round
    const feelings = shuffle([emo, ...others]);
    const kinds = [];
    for (let i = 0; i < feelings.length; i++) kinds.push(KINDS[(this.kindTurn++) % KINDS.length]);
    const two = feelings.length === 2;
    // three friends: the middle one stands a step forward and a bit smaller so Pip's story stays visible
    if (!two && kinds[1] === 'bunny') [kinds[0], kinds[1]] = [kinds[1], kinds[0]];
    const xs = two ? [-3.4, 3.4] : [-5.0, 0, 5.0];
    const zs = two ? [2.0, 2.0] : [2.4, 3.6, 2.4];
    const ss = two ? [1.35, 1.35] : [1.15, 1.0, 1.15];
    feelings.forEach((f, i) => {
      const a = makeAnimal(kinds[i]);
      const S = ss[i];
      a.position.set(xs[i], 0, zs[i]);
      a.rotation.y = -xs[i] * 0.04;
      if (a.userData.head) a.userData.head.scale.multiplyScalar(HEAD_S);
      setFace(a.userData.face, f);
      a.userData.feeling = f;
      a.userData.label = KIND_NAME[kinds[i]];
      a.userData.baseScale = S;
      this.root.add(a);
      this.friends.push(a);
      a.userData.tap = this.fitTap(a, S);
      popIn(this.s, a, S, 0.35 + i * 0.1);
      this.s.wait(0.25 + i * 0.12).then(() => { if (!this.dead) sfx[SOUND[f]](); });
    });
    await this.wait(0.3);
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

  async story(emo) {
    const fix = await nextStory(emo)(this, PIP_POS);
    await this.wait(0.1);
    return fix;
  }

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
    // the friend hurries over to Pip (shrinking a little so they fit on the hill)
    const side = a.position.x < 0 ? -1 : 1;
    const from = a.position.clone(), s0 = a.scale.x;
    const to = new T.Vector3(PIP_POS.x + side * 1.5, PIP_POS.y - 0.55, PIP_POS.z + 0.9);
    sfx.swoosh();
    await this.s.anim(0.42, (e, p) => {
      a.position.lerpVectors(from, to, e);
      a.position.y += Math.sin(p * Math.PI) * 1.2;
      a.scale.setScalar(s0 + (1.0 - s0) * e);
    }, Ease.inOut);
    a.userData.baseScale = 1.0;
    a.rotation.y = -side * 0.6;
    sfx.land();
    this.fixP = this.fixFeeling(a);
    this.busy = false;
    this.success(a.getWorldPosition(new T.Vector3()).add(new T.Vector3(0, 2, 0)), MATCH_LINE[this.emo]);
  }

  // Pip's celebration in this game IS the fix-the-feeling moment (played from tapFriend).
  celebrate() {}

  async fixFeeling(a) {
    const pip = this.pip, emo = this.emo, s = this.s;
    const top = PIP_POS.clone().add(new T.Vector3(0, 2.2, 0.5));
    const storyFix = this.fix ? Promise.resolve(this.fix()) : Promise.resolve();
    const cheer = () => { setFace(pip.userData.face, 'happy'); setFace(a.userData.face, 'happy'); pip.userData.head.rotation.x = 0; };
    if (emo === 'sad' || emo === 'scared') {
      // a squeezy hug: both lean in and squash together, hearts pop out
      const side = Math.sign(a.position.x - PIP_POS.x);
      const ax = a.position.x, pr = pip.rotation.z, ar = a.rotation.z;
      sfx.mmm();
      await s.anim(0.3, (e) => { a.position.x = ax - side * 0.5 * e; pip.rotation.z = pr - side * 0.2 * e; a.rotation.z = ar + side * 0.2 * e; }, Ease.out);
      for (let i = 0; i < 3; i++) s.wait(i * 0.12).then(() => fx.float(top.clone().add(new T.Vector3((i - 1) * 0.8, 0, 0)), '♥', { color: '#ff6f9c', size: 6 }));
      await s.anim(0.3, (_, p) => { const k = 1 + Math.sin(p * Math.PI) * 0.12; pip.scale.set(1.2 * k, 1.2 / k, 1.2 * k); a.scale.set(k, 1 / k, k); });
      cheer();
      sfx.twinkle();
      await s.anim(0.2, (e) => { a.position.x = ax - side * 0.5 * (1 - e); pip.rotation.z = pr - side * 0.2 * (1 - e); a.rotation.z = ar + side * 0.2 * (1 - e); });
      pip.scale.setScalar(1.2); a.scale.setScalar(1);
    } else if (emo === 'angry') {
      // a big breath in… and out
      sfx.swoosh();
      await s.anim(0.4, (e) => { pip.scale.setScalar(1.2 * (1 + 0.2 * e)); a.scale.setScalar(1 + 0.2 * e); }, Ease.out);
      sfx.whoosh();
      fx.float(top, '💨', { size: 6 });
      setFace(pip.userData.face, 'calm'); setFace(a.userData.face, 'calm');
      await s.anim(0.35, (e) => { pip.scale.setScalar(1.2 * (1.2 - 0.2 * e)); a.scale.setScalar(1.2 - 0.2 * e); }, Ease.inOut);
      cheer();
    } else {
      // happy: a little dance together
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
    await Promise.race([storyFix, s.wait(0.6)]);
  }

  async afterSuccess() {
    setFace(this.pip.userData.face, 'happy');
    this.pip.userData.head.rotation.x = 0;
    for (const f of this.friends) setFace(f.userData.face, 'happy');
    if (this.fixP) await Promise.race([this.fixP, this.wait(0.4)]);
    this.fixP = null;
  }

  update(dt, t) {
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
  }
}
