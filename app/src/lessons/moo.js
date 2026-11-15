// Game 11 — Who says moo? Topic mt_ppENoD8vf1 "Local plants & animals".
// An animal sound plays; tap the animal that makes it. Every animal answers with its own voice when tapped.
import * as T from '../three.js';
import { Lesson } from '../engine/lesson.js';
import { popIn, popOut, hop, setFace, wiggle } from '../engine/actors.js';
import { makeFarmAnimal } from '../engine/farm.js';
import { makeDuck } from '../engine/beach.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';

const SOUND = { cow: 'moo', pig: 'oink', sheep: 'baa', duck: 'quack', hen: 'cluck', horse: 'neigh' };
const WORD = { cow: 'moo', pig: 'oink', sheep: 'baa', duck: 'quack', hen: 'cluck cluck', horse: 'neigh' };
const NAME = { cow: 'Cow', pig: 'Pig', sheep: 'Sheep', duck: 'Duck', hen: 'Hen', horse: 'Horse' };
const COL = { cow: '#3a2838', pig: '#ff6f9a', sheep: '#8b7a85', duck: '#ffb020', hen: '#ff4b4b', horse: '#a0623a' };
const XS = { 2: [-2.7, 2.7], 3: [-4.1, 0, 4.1], 4: [-5.2, -1.75, 1.75, 5.2] };

// [target, ...others]
const PLANS = [
  [['cow', 'duck'], ['duck', 'cow'], ['pig', 'sheep'], ['sheep', 'hen'], ['cow', 'pig'], ['hen', 'horse']],
  [['cow', 'pig', 'duck'], ['sheep', 'hen', 'cow'], ['horse', 'duck', 'pig'], ['pig', 'sheep', 'horse'], ['hen', 'duck', 'cow'], ['duck', 'hen', 'sheep']],
  [['horse', 'cow', 'sheep'], ['hen', 'duck', 'pig'], ['sheep', 'cow', 'horse', 'pig'], ['duck', 'hen', 'sheep', 'cow'], ['pig', 'horse', 'hen', 'duck'], ['cow', 'sheep', 'pig', 'horse']],
];

function makeOne(kind) {
  if (kind === 'duck') {
    const g = new T.Group();
    const d = makeDuck(1.7);
    d.rotation.y = -1.2;
    g.add(d);
    g.userData = { kind: 'duck', body: d.userData.body, head: d.userData.head };
    return g;
  }
  return makeFarmAnimal(kind);
}

export default class MooLesson extends Lesson {
  build() {
    this.plan = PLANS[this.level];
    this.animals = [];
    this.pip.position.set(-7.7, 0, -2.2);
  }

  async startRound(r) {
    this.busy = true;
    for (const a of this.animals) popOut(this.s, a, 0.18).then(() => this.root.remove(a));
    const [target, ...others] = this.plan[r];
    this.target = target;
    // shuffle positions, but never put the answer in the same place twice running
    let kinds;
    do { kinds = [target, ...others].sort(() => Math.random() - 0.5); } while (kinds.indexOf(target) === this.lastIdx && kinds.length > 1 && Math.random() < 0.85);
    this.lastIdx = kinds.indexOf(target);
    const xs = XS[kinds.length];
    this.animals = kinds.map((k, i) => {
      const a = makeOne(k);
      a.position.set(xs[i], 0, 0.4 - Math.abs(xs[i]) * 0.08);
      a.rotation.y = -xs[i] * 0.05;
      a.userData.home = a.position.clone();
      a.userData.baseScale = 1;
      this.root.add(a);
      popIn(this.s, a, 1, 0.4);
      a.userData.tap = input.addTap(a, { radius: 1.3, offset: new T.Vector3(0, 1.2, 0), onTap: () => this.tapAnimal(a) });
      return a;
    });
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

  promptText() { return this.level === 2 ? 'Listen! Who is it?' : `Who says ${WORD[this.target]}?`; }
  prompt() {
    const t = this.target;
    this.say(this.promptText(), { max: 1.5 }).then(() => {
      if (this.busy || this.dead || t !== this.target) return;
      sfx[SOUND[t]]();
      fx.float(this.pip.position.clone().add(new T.Vector3(0.6, 3.2, 0)), '♪', { color: COL[t], size: 9 });
    });
  }

  async tapAnimal(a) {
    if (this.busy) return;
    const k = a.userData.kind;
    hop(this.s, a, 0.45, 0.4, { sound: true });
    this.voice(a);
    if (k !== this.target) {
      this.redirect(`That's ${NAME[k]}. ${WORD[k]}! Who says ${WORD[this.target]}?`);
      return;
    }
    this.busy = true;
    input.lock(1500);
    // the animal trots forward and says it again, the others bob along
    const h = a.userData.home;
    this.s.tween(a.position, { z: h.z + 1.6 }, 0.35, Ease.back);
    this.animals.forEach((o, i) => { if (o !== a) this.s.wait(0.1 + i * 0.08).then(() => hop(this.s, o, 0.25, 0.3)); });
    await this.wait(0.45);
    this.voice(a, 1.5);
    for (const o of this.animals) if (o.userData.tap) input.remove(o.userData.tap);
    this.busy = false;
    this.success(this.head(a), `${NAME[k]} says ${WORD[k]}!`);
  }

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
      this.s.tween(a.scale, { x: 0.7, y: 0.7, z: 0.7 }, 0.4);
      a.userData.baseScale = 0.7;
    }
  }

  onFinale() {
    // farm chorus
    this.animals.forEach((a, i) => this.s.wait(0.3 + i * 0.45).then(() => { hop(this.s, a, 0.6); this.voice(a); }));
  }
}
