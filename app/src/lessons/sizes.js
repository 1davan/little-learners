// Lesson 5 — Big and small. Topics mt_NtJYlJdUe9 "Measurable attributes" and mt_uhuxX8sg9f "Comparing lengths & heights".
// Two (later three) of the same thing stand on one ground line; tap the big one or the small one.
import * as T from '../three.js';
import { Lesson, shuffle } from '../engine/lesson.js';
import { mesh, geo, basic, blobShadow } from '../engine/toon.js';
import { C, makeAnimal, popIn, hop, wiggle } from '../engine/actors.js';
import { makeTree } from '../engine/scenery.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';
import { camera } from '../engine/stage.js';

const NOUN = { elephant: 'elephant', tree: 'tree', ball: 'ball', bear: 'bear' };

function makeBall() {
  const g = new T.Group();
  const b = mesh(geo.sphere(1, 24, 18), C.red, { outline: 0.035 });
  b.position.y = 1;
  const stripe = mesh(geo.torus(1.0, 0.12, Math.PI * 2, 8, 36), C.yellow, { outline: 0 });
  stripe.position.y = 1;
  stripe.rotation.y = Math.PI / 2;
  const hi = new T.Mesh(geo.sphere(0.18, 8, 6), basic(0xffffff));
  hi.position.set(-0.4, 1.45, 0.75);
  g.add(b, stripe, hi, blobShadow(1));
  return g;
}

function makeThing(kind) {
  if (kind === 'tree') return makeTree(1);
  if (kind === 'ball') return makeBall();
  return makeAnimal(kind);
}
// visual centre height (at scale 1), for hit areas and confetti
const CENTER_Y = { elephant: 1.6, tree: 2.2, ball: 1, bear: 1.5 };

export default class SizesLesson extends Lesson {
  build() {
    const L = this.level;
    // [kind, ask, sizes]
    this.plan = L === 0
      ? [['elephant', 'big', [1.5, 0.6]], ['ball', 'big', [1.5, 0.6]], ['elephant', 'small', [1.5, 0.6]], ['tree', 'big', [1.4, 0.85]], ['ball', 'small', [1.4, 0.7]], ['elephant', 'big', [1.35, 0.9, 0.5]]]
      : L === 1
        ? [['elephant', 'small', [1.4, 0.7]], ['tree', 'big', [1.35, 0.85]], ['ball', 'small', [1.3, 0.8]], ['bear', 'big', [1.5, 0.9]], ['elephant', 'small', [1.35, 0.9, 0.5]], ['ball', 'big', [1.4, 0.95, 0.55]]]
        : [['tree', 'small', [1.3, 0.85]], ['bear', 'big', [1.35, 0.95, 0.6]], ['ball', 'small', [1.4, 0.95, 0.55]], ['elephant', 'big', [1.3, 1.0, 0.6]], ['tree', 'small', [1.4, 0.95, 0.6]], ['bear', 'small', [1.5, 1.0, 0.6]]];
    this.pip.position.set(-7.4, 0, -2.5);
    this.things = [];
  }

  async startRound(r) {
    this.busy = true;
    const [kind, ask, sizes] = this.plan[r];
    this.kind = kind; this.ask = ask;
    for (const t of this.things) this.root.remove(t);
    this.things = [];
    const order = shuffle(sizes.map((s, i) => i));
    const xs = sizes.length === 2 ? [-3.4, 3.4] : [-4.6, 0.2, 4.8];
    const maxS = Math.max(...sizes), minS = Math.min(...sizes);
    order.forEach((idx, slot) => {
      const s = sizes[idx];
      const t = makeThing(kind);
      t.position.set(xs[slot], 0, 0);
      t.rotation.y = -xs[slot] * 0.05;
      t.userData.size = s;
      t.userData.baseScale = s;
      t.userData.role = s === maxS ? 'big' : s === minS ? 'small' : 'middle';
      this.root.add(t);
      this.things.push(t);
      popIn(this.s, t, s, 0.45 + slot * 0.1);
      t.userData.tap = input.addTap(t, { radius: Math.max(1.1, 1.3 * s), offset: new T.Vector3(0, CENTER_Y[kind] * s, 0), onTap: () => this.tapThing(t) });
    });
    sfx.boing();
    await this.wait(0.35);
    this.busy = false;
    this.cue();
  }

  promptText() {
    const n = NOUN[this.kind];
    return this.ask === 'big' ? `Big! Where is the big ${n}?` : `Small! Where is the small ${n}?`;
  }
  prompt() {
    // big words in a low voice, small words in a high voice
    this.say(this.promptText(), this.ask === 'big' ? { pitch: 0.75, rate: 0.85 } : { pitch: 1.6, rate: 1.0 });
  }

  voice(t) {
    const big = t.userData.role === 'big', small = t.userData.role === 'small';
    if (this.kind === 'elephant') big ? sfx.trumpet() : small ? sfx.squeak() : sfx.boing();
    else if (this.kind === 'ball') big ? sfx.lowBoing() : small ? sfx.highBoing() : sfx.boing();
    else if (this.kind === 'tree') { sfx.rustle(); big ? sfx.note(0) : sfx.note(5); }
    else big ? sfx.grr() : sfx.squeak();
  }

  async tapThing(t) {
    if (this.busy) return;
    this.voice(t);
    const role = t.userData.role;
    if (role !== this.ask) {
      hop(this.s, t, 0.3 / t.userData.size + 0.2);
      this.redirect(role === 'middle' ? `That's the middle one. Find ${this.ask}!` : `That's the ${role} one. Find ${this.ask}!`);
      return;
    }
    this.busy = true;
    input.lock(2500);
    if (role === 'big') {
      // stomp! the camera shakes a little
      await hop(this.s, t, 0.5, 0.5);
      const y0 = camera.position.y;
      this.s.anim(0.4, (_, p) => { camera.position.y = y0 + Math.sin(p * Math.PI * 6) * 0.12 * (1 - p); }).then(() => { camera.position.y = y0; });
      sfx.lowBoing();
    } else {
      hop(this.s, t, 1.0, 0.35);
      await hop(this.s, t, 1.0, 0.35);
    }
    this.busy = false;
    const n = NOUN[this.kind];
    const pos = t.getWorldPosition(new T.Vector3()).add(new T.Vector3(0, CENTER_Y[this.kind] * t.userData.size, 0));
    this.success(pos, role === 'big' ? `Big ${n}!` : `Small ${n}!`);
  }

  showHint(glow = true) {
    const t = this.things.find((x) => x.userData.role === this.ask);
    if (!t) return;
    const c = t.getWorldPosition(new T.Vector3()).add(new T.Vector3(0, CENTER_Y[this.kind] * t.userData.size, 0));
    if (glow) {
      const anchor = new T.Object3D();
      anchor.position.copy(c);
      this.root.add(anchor);
      this.addHalo(anchor, 1.3 * t.userData.size + 0.3);
    }
    wiggle(this.s, t, 0.15, 0.8);
    fx.ghostHand(c);
  }

  choicePoints() { return this.things.map((t) => t.getWorldPosition(new T.Vector3()).add(new T.Vector3(0, CENTER_Y[this.kind] * t.userData.size, 0))); }

  makeErrorless() {
    for (const t of this.things) if (t.userData.role !== this.ask) t.userData.tap.enabled = false;
  }

  onFinale() {
    // parade: biggest to smallest hop in turn
    const sorted = this.things.slice().sort((a, b) => b.userData.size - a.userData.size);
    sorted.forEach((t, i) => this.s.wait(0.4 + i * 0.35).then(() => { hop(this.s, t, 0.8); this.voice(t); }));
  }
}
