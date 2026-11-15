// Lesson 4 — Feelings. Topic mt_LhkP_KKIRS "Naming basic emotions".
// A short story shows Pip feeling something; the child finds the friend whose face shows the same feeling.
import * as T from '../three.js';
import { Lesson, shuffle } from '../engine/lesson.js';
import { mesh, geo, toon, basic } from '../engine/toon.js';
import { C, makeAnimal, setFace, popIn, hop, shake } from '../engine/actors.js';
import { makeCloud } from '../engine/scenery.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';

const KINDS = ['bear', 'bunny', 'cat', 'frog'];
const KIND_NAME = { bear: 'Bear', bunny: 'Bunny', cat: 'Kitty', frog: 'Froggy' };
const SAY_FEEL = { happy: 'happy', sad: 'sad', angry: 'angry', scared: 'scared' };
const MATCH_LINE = { happy: 'Happy! Big smile!', sad: 'Sad. Big hug!', angry: 'Angry! Take a big breath.', scared: "Scared! It's okay. Hug!" };
const SOUND = { happy: 'giggle', sad: 'aww', angry: 'grr', scared: 'gasp' };
const PIP_POS = new T.Vector3(0, 2.6, -3.2);

export default class FeelingsLesson extends Lesson {
  build() {
    const L = this.level;
    this.plan = L === 0
      ? [['happy', ['sad']], ['sad', ['happy']], ['angry', ['happy']], ['sad', ['angry']], ['scared', ['happy', 'sad']], ['happy', ['angry', 'scared']]]
      : [['sad', ['happy']], ['angry', ['sad']], ['scared', ['happy']], ['happy', ['sad', 'angry']], ['angry', ['scared', 'happy']], ['scared', ['sad', 'angry']]];
    // Pip stands on a little hill in the middle so the story is easy to see
    const hill = mesh(geo.sphere(1, 28, 14), 0x7cc95c, { outline: 0.02 });
    hill.scale.set(3.4, 2.6, 2.4);
    hill.position.set(0, 0, -3.4);
    this.root.add(hill);
    this.pip.position.copy(PIP_POS);
    this.pip.rotation.y = 0;
    this.pip.scale.setScalar(1.2);
    this.pip.userData.baseScale = 1.2;
    this.friends = [];
    this.props = new T.Group();
    this.root.add(this.props);
  }

  async startRound(r) {
    this.busy = true;
    const [emo, others] = this.plan[r];
    this.emo = emo;
    // clear previous friends and props
    for (const f of this.friends) this.root.remove(f);
    this.friends = [];
    this.props.clear();
    setFace(this.pip.userData.face, 'calm');
    this.pip.userData.head.rotation.x = 0;

    await this.story(emo);
    // friends appear, each showing a feeling
    const feelings = shuffle([emo, ...others]);
    const kinds = shuffle(KINDS);
    const xs = feelings.length === 2 ? [-3.2, 3.2] : [-4.6, 0, 4.6];
    feelings.forEach((f, i) => {
      const a = makeAnimal(kinds[i]);
      a.position.set(xs[i], 0, 1.6);
      a.rotation.y = -xs[i] * 0.04;
      setFace(a.userData.face, f);
      a.userData.feeling = f;
      a.userData.label = KIND_NAME[kinds[i]];
      this.root.add(a);
      this.friends.push(a);
      popIn(this.s, a, 1, 0.35 + i * 0.1);
      a.userData.tap = input.addTap(a, { radius: 1.25, offset: new T.Vector3(0, 1.4, 0), onTap: () => this.tapFriend(a) });
    });
    await this.wait(0.3);
    this.busy = false;
    this.cue();
  }

  promptText() { return `Pip is ${SAY_FEEL[this.emo]}. Who else is ${SAY_FEEL[this.emo]}?`; }

  // Little story vignettes that cause the feeling.
  async story(emo) {
    const pip = this.pip;
    const face = pip.userData.face;
    if (emo === 'happy' || emo === 'sad') {
      const balloon = new T.Group();
      const b = mesh(geo.sphere(0.6, 20, 14), emo === 'happy' ? C.red : C.blue, { outline: 0.035 });
      b.scale.set(1, 1.15, 1);
      const hi = new T.Mesh(geo.sphere(0.12, 8, 6), basic(0xffffff)); hi.position.set(-0.22, 0.3, 0.5);
      const knot = mesh(geo.cone(0.1, 0.16, 8), emo === 'happy' ? C.red : C.blue, { outline: 0.015 }); knot.position.y = -0.72; knot.rotation.x = Math.PI;
      const string = new T.Mesh(geo.cyl(0.015, 0.015, 1.6, 4), basic(0x555555)); string.position.y = -1.55;
      balloon.add(b, hi, knot, string);
      this.props.add(balloon);
      if (emo === 'happy') {
        balloon.position.set(PIP_POS.x + 1.3, 10, PIP_POS.z);
        await this.s.tween(balloon.position, { y: PIP_POS.y + 3.6 }, 1.0, Ease.out);
        setFace(face, 'happy');
        sfx.giggle();
        await hop(this.s, pip, 0.6);
        hop(this.s, pip, 0.6);
      } else {
        balloon.position.set(PIP_POS.x + 1.3, PIP_POS.y + 3.6, PIP_POS.z);
        await this.wait(0.4);
        sfx.whoosh();
        this.s.tween(balloon.position, { y: 14, x: PIP_POS.x + 4 }, 2.2, Ease.in);
        await this.wait(0.5);
        setFace(face, 'sad');
        sfx.aww();
        await this.s.tween(pip.userData.head.rotation, { x: 0.3 }, 0.6);
      }
    } else if (emo === 'angry') {
      const tower = new T.Group();
      const cols = [C.blue, C.yellow, C.red];
      cols.forEach((c, i) => { const bl = mesh(geo.box(0.8, 0.8, 0.8), c, { hull: 1.07 }); bl.position.y = 0.4 + i * 0.82; tower.add(bl); });
      tower.position.set(PIP_POS.x + 1.8, PIP_POS.y - 0.1, PIP_POS.z + 0.4);
      this.props.add(tower);
      await popIn(this.s, tower);
      await this.wait(0.4);
      // a bouncy ball knocks it over
      const ball = mesh(geo.sphere(0.35, 16, 12), C.purple, { outline: 0.03 });
      ball.position.set(PIP_POS.x + 6, PIP_POS.y + 0.4, PIP_POS.z + 0.4);
      this.props.add(ball);
      sfx.boing();
      await this.s.tween(ball.position, { x: PIP_POS.x + 2.1 }, 0.6, Ease.in);
      sfx.pop();
      this.s.tween(ball.position, { x: PIP_POS.x + 7, y: PIP_POS.y + 2 }, 0.8, Ease.out);
      tower.children.forEach((bl, i) => {
        this.s.tween(bl.position, { x: 0.6 + i * 0.9, y: 0.4 }, 0.5 + i * 0.1, Ease.bounce);
        this.s.tween(bl.rotation, { z: -1.2 - i * 0.4 }, 0.5 + i * 0.1, Ease.out);
      });
      await this.wait(0.8);
      setFace(face, 'angry');
      sfx.grr();
      for (let k = 0; k < 3; k++) await hop(this.s, pip, 0.2, 0.18);
    } else if (emo === 'scared') {
      const cloud = makeCloud(PIP_POS.x - 12, PIP_POS.y + 4.6, PIP_POS.z, 1);
      cloud.traverse((o) => { if (o.isMesh && !o.userData.outline) o.material = toon(0x8790a8); });
      const boltShape = new T.Shape();
      boltShape.moveTo(0, 0); boltShape.lineTo(0.5, 0); boltShape.lineTo(0.1, -0.8); boltShape.lineTo(0.55, -0.8); boltShape.lineTo(-0.3, -2.1); boltShape.lineTo(0, -1.0); boltShape.lineTo(-0.4, -1.0); boltShape.closePath();
      const bolt = mesh(new T.ExtrudeGeometry(boltShape, { depth: 0.15, bevelEnabled: false }), C.yellow, { hull: 1.05 });
      bolt.position.set(0.2, -0.8, 0.6);
      bolt.visible = false;
      cloud.add(bolt);
      this.props.add(cloud);
      await this.s.tween(cloud.position, { x: PIP_POS.x }, 1.0, Ease.out);
      bolt.visible = true;
      document.body.classList.add('flash');
      sfx.thunder();
      setTimeout(() => document.body.classList.remove('flash'), 180);
      setFace(face, 'scared');
      sfx.gasp();
      await shake(this.s, pip, 0.12, 0.8);
      bolt.visible = false;
    }
    await this.wait(0.15);
  }

  async tapFriend(a) {
    if (this.busy) return;
    const f = a.userData.feeling;
    sfx[SOUND[f]]();
    if (f !== this.emo) {
      hop(this.s, a, 0.4);
      this.redirect(`${a.userData.label} is ${SAY_FEEL[f]}. Find ${SAY_FEEL[this.emo]}!`);
      return;
    }
    this.busy = true;
    input.lock(3000);
    // the friend runs over for a hug, and everyone feels better
    const home = a.position.clone();
    await this.s.tween(a.position, { x: PIP_POS.x + (home.x < 0 ? -1.4 : 1.4), y: PIP_POS.y - 0.5, z: PIP_POS.z + 0.9 }, 0.6, Ease.inOut);
    hop(this.s, a, 0.4);
    await hop(this.s, this.pip, 0.4);
    this.busy = false;
    const line = MATCH_LINE[this.emo];
    this.success(a.getWorldPosition(new T.Vector3()).add(new T.Vector3(0, 2, 0)), line);
  }

  async afterSuccess() {
    setFace(this.pip.userData.face, 'happy');
    this.pip.userData.head.rotation.x = 0;
    for (const f of this.friends) setFace(f.userData.face, 'happy');
    await this.wait(0.3);
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
    if (glow) this.addHalo(a.userData.head, 1.1);
    fx.ghostHand(a.userData.head.getWorldPosition(new T.Vector3()));
  }

  choicePoints() { return this.friends.map((a) => a.userData.head.getWorldPosition(new T.Vector3())); }

  makeErrorless() {
    for (const a of this.friends) if (a.userData.feeling !== this.emo) {
      a.userData.tap.enabled = false;
      this.s.tween(a.scale, { x: 0.6, y: 0.6, z: 0.6 }, 0.4);
    }
  }

  onFinale() {
    for (const a of this.friends) { setFace(a.userData.face, 'happy'); hop(this.s, a, 0.8); }
  }
}
