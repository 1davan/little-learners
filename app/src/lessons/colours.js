// Lesson 1 — Colour tubes. Topic mt_xppl18avyY "Sorting into categories".
// Drag each object into the tube of the same colour. Later objects change shape so colour is the only constant.
import * as T from '../three.js';
import { Lesson } from '../engine/lesson.js';
import { mesh, geo, toonUnique, basic, ink } from '../engine/toon.js';
import { C, popIn, wiggle } from '../engine/actors.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';

const COL = { red: C.red, blue: C.blue, yellow: C.yellow, green: C.green };
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const LAYOUT = { 2: [-3, 3], 3: [-4.5, 0, 4.5], 4: [-5.4, -1.8, 1.8, 5.4] };
const SPAWN = new T.Vector3(0, 0.75, 4);

function makeTube(color) {
  const g = new T.Group();
  const glass = new T.Mesh(geo.cyl(0.95, 0.95, 3, 28, true), toonUnique(COL[color], { transparent: true, opacity: 0.3, side: T.DoubleSide, depthWrite: false }));
  glass.position.y = 1.65;
  const base = mesh(geo.cyl(1.08, 1.12, 0.32, 28), COL[color], { outline: 0.04 });
  base.position.y = 0.16;
  const rim = mesh(geo.torus(0.97, 0.13, Math.PI * 2, 10, 32), COL[color], { outline: 0.03 });
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 3.15;
  g.add(glass, base, rim);
  // googly eyes on the glass
  const eyes = [];
  for (const s of [-1, 1]) {
    const w = mesh(geo.sphere(0.24, 16, 12), 0xffffff, { outline: 0.03 });
    w.position.set(s * 0.33, 2.55, 0.92);
    const p = ink(geo.sphere(0.12, 12, 8));
    p.position.set(0, 0, 0.16);
    w.add(p);
    g.add(w); eyes.push(p);
  }
  const smile = ink(geo.torus(0.22, 0.05, Math.PI, 6, 20));
  smile.rotation.z = Math.PI;
  smile.position.set(0, 2.18, 0.97);
  g.add(smile);
  g.userData = { color, count: 0, eyes, glass };
  return g;
}

function makeItem(color, shape) {
  let m;
  const c = COL[color];
  if (shape === 'box') m = mesh(geo.box(0.75, 0.75, 0.75), c, { hull: 1.07 });
  else if (shape === 'cone') { m = mesh(geo.cone(0.46, 0.8, 20), c, { outline: 0.035 }); }
  else if (shape === 'torus') { m = mesh(geo.torus(0.3, 0.15, Math.PI * 2, 12, 28), c, { outline: 0.03 }); }
  else if (shape === 'star') m = mesh(geo.sphere(0.42, 6, 4), c, { outline: 0.03 });
  else m = mesh(geo.sphere(0.42, 22, 16), c, { outline: 0.035 });
  // a highlight so it reads as a toy
  const hi = new T.Mesh(geo.sphere(0.09, 8, 6), basic(0xffffff));
  hi.position.set(-0.15, 0.2, 0.36);
  if (shape === 'sphere') m.add(hi);
  m.userData = { color, shape };
  return m;
}

export default class ColoursLesson extends Lesson {
  get totalRounds() { return 8; }

  build() {
    const L = this.level;
    this.plan = L === 0
      ? [['red', 'sphere'], ['blue', 'sphere'], ['red', 'sphere'], ['yellow', 'sphere'], ['blue', 'sphere'], ['yellow', 'box'], ['red', 'cone'], ['blue', 'torus']]
      : L === 1
        ? [['red', 'sphere'], ['blue', 'box'], ['yellow', 'sphere'], ['green', 'sphere'], ['blue', 'cone'], ['green', 'torus'], ['yellow', 'cone'], ['red', 'box']]
        : [['green', 'box'], ['red', 'cone'], ['yellow', 'torus'], ['blue', 'box'], ['green', 'cone'], ['red', 'torus'], ['yellow', 'box'], ['blue', 'cone']];
    this.tubes = [];
    for (const c of ['red', 'blue']) this.addTube(c, false);
    this.layout(false);
  }

  addTube(color, animate = true) {
    const t = makeTube(color);
    t.position.set(0, 0, -1);
    this.root.add(t);
    this.tubes.push(t);
    if (animate) popIn(this.s, t);
    return t;
  }

  layout(animate = true) {
    const xs = LAYOUT[this.tubes.length];
    this.tubes.forEach((t, i) => {
      if (animate) this.s.tween(t.position, { x: xs[i] }, 0.6, Ease.inOut);
      else t.position.x = xs[i];
    });
  }

  zones() {
    return this.tubes.map((t) => ({ obj: t.userData.glass, pos: new T.Vector3(t.position.x, 2.3, t.position.z), radius: 1.6, tube: t, enabled: t.userData.enabled !== false }));
  }

  async startRound(r) {
    const [color, shape] = this.plan[r];
    for (const t of this.tubes) { t.userData.enabled = true; this.s.tween(t.scale, { x: 1, y: 1, z: 1 }, 0.3); }
    // new colour tube appears when first needed
    if (!this.tubes.find((t) => t.userData.color === color)) {
      this.busy = true;
      this.addTube(color);
      this.layout();
      sfx.sparkle();
      await this.say(`${cap(color)}!`, { max: 0.9 });
      this.busy = false;
    }
    // harder level: swap tubes around halfway through
    if (this.level === 2 && r === 4) { this.tubes.reverse(); this.layout(); sfx.whoosh(); await this.wait(0.45); }

    const item = makeItem(color, shape);
    item.position.set(9, SPAWN.y, SPAWN.z);
    this.root.add(item);
    this.item = item;
    sfx.whoosh();
    await this.s.anim(0.9, (e) => { item.position.x = 9 * (1 - e); item.rotation.z = e * Math.PI * 2; }, Ease.out);
    item.rotation.z = 0;
    this.target = input.addDrag(item, {
      radius: 0.9,
      zones: () => this.zones(),
      onPick: () => this.s.tween(item.scale, { x: 1.2, y: 1.2, z: 1.2 }, 0.15),
      onMove: (_t, z) => this.lookAt(z),
      onDrop: (z, info) => this.drop(z, info),
    });
    this.cue();
  }

  promptText() {
    const c = this.plan[this.round]?.[0];
    return c ? `${cap(c)}! Put it with ${c}.` : '';
  }

  // tubes' eyes follow the dragged item
  lookAt(z) {
    for (const t of this.tubes) for (const p of t.userData.eyes) {
      const want = z && z.tube === t ? 0.1 : 0;
      p.position.y += (want - p.position.y) * 0.3;
    }
  }

  goHome(item) {
    this.s.tween(item.position, { x: SPAWN.x, y: SPAWN.y, z: SPAWN.z }, 0.5, Ease.back);
    this.s.tween(item.scale, { x: 1, y: 1, z: 1 }, 0.3);
  }

  async drop(zone, { tapped }) {
    const item = this.item;
    if (!zone) {
      this.goHome(item);
      if (tapped) { wiggle(this.s, item, 0.4); }
      return;
    }
    const tube = zone.tube;
    const color = item.userData.color;
    if (tube.userData.color !== color) {
      // lean away, roll back home, name both colours
      this.goHome(item);
      const r0 = tube.rotation.z;
      this.s.anim(0.6, (_, p) => { tube.rotation.z = r0 + Math.sin(p * Math.PI) * 0.25 * Math.sign(tube.position.x - item.position.x || 1); });
      this.redirect(`That's ${tube.userData.color}. Find ${color}!`);
      return;
    }
    // correct: hop over the rim and drop in
    input.remove(this.target);
    this.busy = true;
    const n = tube.userData.count++;
    // become part of the tube so the stack moves with it when tubes re-arrange
    tube.attach(item);
    const p = item.position;
    await this.s.tween(p, { x: 0, y: 3.9, z: 0 }, 0.35, Ease.out);
    this.s.tween(item.scale, { x: 1, y: 1, z: 1 }, 0.2);
    await this.s.tween(p, { y: 0.32 + 0.42 + n * 0.78 }, 0.45, Ease.bounce);
    sfx.pop();
    sfx.mmm();
    this.s.anim(0.4, (_, q) => { tube.scale.y = 1 - Math.sin(q * Math.PI) * 0.12; tube.scale.x = tube.scale.z = 1 + Math.sin(q * Math.PI) * 0.08; });
    this.busy = false;
    this.success(new T.Vector3(tube.position.x, 3.4, tube.position.z), `${cap(color)} with ${color}!`);
  }

  showHint(glow = true) {
    const item = this.item;
    if (!item) return;
    const tube = this.tubes.find((t) => t.userData.color === item.userData.color);
    if (glow) this.addHalo(tube.userData.glass, 1.6);
    fx.ghostHand(item.position.clone(), new T.Vector3(tube.position.x, 2.6, tube.position.z));
  }

  makeErrorless() {
    const color = this.item?.userData.color;
    for (const t of this.tubes) if (t.userData.color !== color) {
      t.userData.enabled = false;
      this.s.tween(t.scale, { x: 0.6, y: 0.6, z: 0.6 }, 0.4);
    }
  }

  onFinale() {
    const tallest = this.tubes.reduce((a, b) => (b.userData.count > a.userData.count ? b : a));
    this.s.wait(2.5).then(() => { wiggle(this.s, tallest, 0.2, 1); this.say(`Look! So much ${tallest.userData.color}!`); });
  }
}
