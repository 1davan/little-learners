// Lesson 2 — Apple count. Topics mt_WcfaSfVT33 "One-to-one counting" and mt_dmNvjroCPT "How many in total?".
// Tap each fruit once: it hops into the basket as its number is said. The last number is stressed as the total.
import * as T from '../three.js';
import { Lesson } from '../engine/lesson.js';
import { mesh, geo, basic } from '../engine/toon.js';
import { C, makeAnimal, popIn, hop, wiggle, setFace } from '../engine/actors.js';
import { makeTree } from '../engine/scenery.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';

const WORDS = ['One', 'Two', 'Three', 'Four', 'Five'];
const FRUIT = {
  apple: { one: 'apple', many: 'apples' },
  orange: { one: 'orange', many: 'oranges' },
  pear: { one: 'pear', many: 'pears' },
  plum: { one: 'plum', many: 'plums' },
};
const BASKET = new T.Vector3(0, 0, 3.2);

function makeFruit(kind) {
  const g = new T.Group();
  let body;
  if (kind === 'pear') {
    body = mesh(geo.sphere(0.45, 20, 14), 0x9ed64a, { outline: 0.035 });
    const top = mesh(geo.sphere(0.3, 16, 12), 0x9ed64a, { outline: 0.03 });
    top.position.y = 0.42;
    g.add(top);
  } else if (kind === 'orange') {
    body = mesh(geo.sphere(0.5, 20, 14), C.orange, { outline: 0.035 });
  } else if (kind === 'plum') {
    body = mesh(geo.sphere(0.46, 20, 14), 0x9b5de5, { outline: 0.035 });
    body.scale.set(0.95, 1.05, 0.95);
  } else {
    body = mesh(geo.sphere(0.5, 20, 14), 0xff4b4b, { outline: 0.035 });
    body.scale.set(1.05, 0.95, 1);
  }
  g.add(body);
  const hi = new T.Mesh(geo.sphere(0.1, 8, 6), basic(0xffffff));
  hi.position.set(-0.18, 0.18, 0.42);
  g.add(hi);
  const stem = mesh(geo.cyl(0.04, 0.05, 0.28, 6), C.trunk, { outline: 0.012 });
  stem.position.y = kind === 'pear' ? 0.78 : 0.52;
  const leaf = mesh(geo.sphere(0.14, 10, 8), C.leaf, { outline: 0.015 });
  leaf.scale.set(1.4, 0.35, 0.8);
  leaf.position.set(0.15, stem.position.y + 0.05, 0);
  leaf.rotation.z = 0.5;
  g.add(stem, leaf);
  return g;
}

function makeBasket() {
  const g = new T.Group();
  const b = mesh(geo.cyl(1.5, 1.1, 1.0, 24), 0xc98b4f, { outline: 0.04 });
  b.position.y = 0.5;
  const rim = mesh(geo.torus(1.5, 0.12, Math.PI * 2, 8, 32), 0xa86f3a, { outline: 0.03 });
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 1.0;
  const inside = new T.Mesh(geo.circle(1.42, 28), basic(0x6b4424));
  inside.rotation.x = -Math.PI / 2;
  inside.position.y = 0.97;
  for (let i = 0; i < 3; i++) {
    const band = mesh(geo.torus(1.3 + i * 0.07, 0.04, Math.PI * 2, 6, 32), 0xa86f3a, { outline: 0 });
    band.rotation.x = Math.PI / 2;
    band.position.y = 0.25 + i * 0.25;
    g.add(band);
  }
  g.add(b, rim, inside);
  return g;
}

export default class CountingLesson extends Lesson {
  build() {
    const L = this.level;
    this.plan = L === 0
      ? [[1, 'apple'], [2, 'apple'], [3, 'apple'], [2, 'orange'], [3, 'pear'], [3, 'apple', 'arc']]
      : L === 1
        ? [[2, 'apple'], [3, 'apple'], [3, 'orange'], [4, 'pear'], [3, 'plum', 'arc'], [4, 'apple']]
        : [[3, 'apple'], [4, 'orange'], [3, 'pear', 'scatter'], [4, 'plum', 'scatter'], [5, 'apple'], [4, 'orange', 'scatter']];
    this.tree = makeTree(2.1);
    this.tree.position.set(0, 0, -2.5);
    this.root.add(this.tree);
    this.basket = makeBasket();
    this.basket.position.copy(BASKET);
    this.root.add(this.basket);
    this.hog = makeAnimal('hedgehog');
    this.hog.position.set(4.6, 0, 2.6);
    this.hog.rotation.y = -0.6;
    this.root.add(this.hog);
    this.fruits = [];
  }

  async startRound(r) {
    const [n, kind, layout] = this.plan[r];
    this.n = n; this.kind = kind; this.count = 0;
    this.fruits = [];
    for (let i = 0; i < n; i++) {
      const f = makeFruit(kind);
      let x = (i - (n - 1) / 2) * 1.9, y = 5.0;
      if (layout === 'arc') y = 5.6 - Math.abs(i - (n - 1) / 2) * 0.7;
      if (layout === 'scatter') { x += (i % 2 ? 0.4 : -0.3); y = 4.4 + ((i * 7) % 3) * 0.6; }
      f.position.set(x, y, 0.9);
      f.userData.home = f.position.clone();
      this.root.add(f);
      this.fruits.push(f);
      popIn(this.s, f, 1, 0.4 + i * 0.08);
      f.userData.tap = input.addTap(f, { radius: 0.85, onTap: () => this.tapFruit(f) });
    }
    sfx.sparkle();
    await this.wait(0.3);
    this.cue();
  }

  promptText() { return `Count the ${FRUIT[this.kind].many}!`; }

  async tapFruit(f) {
    if (f.userData.counted || this.busy) return;
    f.userData.counted = true;
    input.remove(f.userData.tap);
    this.clearHints();
    const i = this.count++;
    sfx.note(i);
    const last = this.count === this.n;
    const word = WORDS[i];
    // fly into the basket in an arc
    const from = f.position.clone();
    const slot = new T.Vector3(BASKET.x + (i - (this.n - 1) / 2) * 0.62, 1.25 + (i % 2) * 0.08, BASKET.z + (i % 2 ? -0.25 : 0.2));
    // the number pops up big over the fruit as it flies (no voice: the numeral carries the count)
    fx.float(from.clone().add(new T.Vector3(0, 0.9, 0)), String(i + 1), { color: ['#ff5a5a', '#ff9f3f', '#5fd068', '#4a90ff', '#a77bff'][i], size: 11 });
    this.s.anim(0.42, (e) => {
      f.position.lerpVectors(from, slot, e);
      f.position.y += Math.sin(e * Math.PI) * 1.4;
      f.rotation.z = e * Math.PI * 2;
    }, Ease.inOut).then(() => { sfx.pop(); f.rotation.z = 0; });
    if (!last) { this.say(`${word}!`); return; }

    // last one: stress the total while the fruit lands, recount fast, the hedgehog munches — no dead air
    this.busy = true;
    input.lock(2500);
    const name = this.n === 1 ? FRUIT[this.kind].one : FRUIT[this.kind].many;
    this.say(this.n === 1 ? `${word} ${name}!` : `${word}! ${word} ${name}!`);
    await this.wait(0.6);
    this.fruits.forEach((q, k) => this.s.wait(k * 0.12).then(() => { hop(this.s, q, 0.35, 0.22); sfx.note(k); }));
    this.s.wait(this.n * 0.12 + 0.05).then(() => { fx.float(new T.Vector3(BASKET.x, 2.6, BASKET.z), String(this.n), { color: '#ffd23f', size: 18 }); sfx.twinkle(); });
    // hedgehog trots to the basket while the recount plays
    const h = this.hog, hx = h.position.x;
    setFace(h.userData.face, 'happy');
    sfx.patter();
    await this.s.tween(h.position, { x: BASKET.x + 2.1 }, 0.4 + this.n * 0.06, Ease.inOut);
    sfx.chomp();
    for (const q of this.fruits) this.s.tween(q.scale, { x: 0.001, y: 0.001, z: 0.001 }, 0.25, Ease.in);
    hop(this.s, h, 0.4);
    await this.wait(0.3);
    for (const q of this.fruits) this.root.remove(q);
    this.s.tween(h.position, { x: hx }, 0.6, Ease.inOut);
    this.busy = false;
    this.success(new T.Vector3(BASKET.x, 2, BASKET.z), 'Yum yum!');
  }

  showHint(glow = true) {
    const next = this.fruits.find((f) => !f.userData.counted);
    if (!next) return;
    if (glow) this.addHalo(next, 0.85);
    wiggle(this.s, next, 0.4, 0.8);
    fx.ghostHand(next.position.clone());
  }

  onFinale() {
    hop(this.s, this.hog, 0.8).then(() => hop(this.s, this.hog, 0.8));
  }
}
