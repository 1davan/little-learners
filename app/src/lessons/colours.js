// Lesson 1 — Colour tubes. Topic mt_xppl18avyY "Sorting into categories".
// Drag each toy into the tube of the same colour. The toys change every round (ball, fish, car, balloon…)
// so colour is the only constant. The tubes have faces: they watch the toy, open wide, and GULP.
import * as T from '../three.js';
import { Lesson } from '../engine/lesson.js';
import { popIn, wiggle, hop } from '../engine/actors.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';
import { makeTube, makeItem } from './colours-items.js';

const cap = (s) => s[0].toUpperCase() + s.slice(1);
const LAYOUT = { 2: [-3, 3], 3: [-4.5, 0, 4.5], 4: [-5.4, -1.8, 1.8, 5.4] };
const SPAWN = new T.Vector3(0, 0.85, 4);
const HEX = { red: '#ff5a5a', blue: '#4a90ff', yellow: '#ffc800', green: '#3fb84a' };
const tmp = new T.Vector3(), tmp2 = new T.Vector3();

export default class ColoursLesson extends Lesson {
  get totalRounds() { return 8; }

  build() {
    const L = this.level;
    // [colour, toy theme] — same colour order as before; the toy changes every round
    this.plan = L === 0
      ? [['red', 'ball'], ['blue', 'balloon'], ['red', 'fish'], ['yellow', 'star'], ['blue', 'car'], ['yellow', 'duck'], ['red', 'flower'], ['blue', 'block']]
      : L === 1
        ? [['red', 'ball'], ['blue', 'car'], ['yellow', 'star'], ['green', 'fish'], ['blue', 'balloon'], ['green', 'flower'], ['yellow', 'duck'], ['red', 'heart']]
        : [['green', 'block'], ['red', 'car'], ['yellow', 'fish'], ['blue', 'duck'], ['green', 'balloon'], ['red', 'star'], ['yellow', 'flower'], ['blue', 'heart']];
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
      if (animate) this.s.tween(t.position, { x: xs[i] }, 0.45, Ease.inOut);
      else t.position.x = xs[i];
    });
  }

  zones() {
    return this.tubes.map((t) => ({ obj: t.userData.glass, pos: new T.Vector3(t.position.x, 2.3, t.position.z), radius: 1.6, tube: t, enabled: t.userData.enabled !== false }));
  }

  async startRound(r) {
    const [color, theme] = this.plan[r];
    this.hover = null;
    for (const t of this.tubes) { t.userData.enabled = true; this.s.tween(t.scale, { x: 1, y: 1, z: 1 }, 0.3); }
    // the prompt starts straight away (the one-time demo needs the toy in place, so round 1 waits for it)
    if (this.demoDone) this.cue();
    // a new colour tube hops in when first needed
    if (!this.tubes.find((t) => t.userData.color === color)) {
      this.busy = true;
      const t = this.addTube(color);
      this.layout();
      sfx.sparkle();
      fx.float(new T.Vector3(0, 4.2, -1), '★', { color: HEX[color], size: 9 });
      this.s.wait(0.45).then(() => hop(this.s, t, 0.5, 0.35, { sound: true }));
      await this.wait(0.2);
      this.busy = false;
    }
    // harder level: the tubes shuffle places halfway through
    if (this.level === 2 && r === 4) { this.tubes.reverse(); this.layout(); sfx.swoosh(); await this.wait(0.35); }

    const item = makeItem(color, theme);
    this.root.add(item);
    this.item = item;
    await this.enter(item, theme);
    if (this.dead || this.item !== item) return;
    item.userData.ready = true;
    this.target = input.addDrag(item, {
      radius: 0.9,
      zones: () => this.zones(),
      onPick: () => { sfx.bloop(2); this.s.tween(item.scale, { x: 1.2, y: 1.2, z: 1.2 }, 0.15, Ease.back); },
      onMove: (_t, z) => this.onHover(z),
      onDrop: (z, info) => this.drop(z, info),
    });
    if (!this.demoDone) this.cue();
  }

  // Each toy arrives its own way: same task, new surprise.
  async enter(item, theme) {
    const b = item.userData.body, s = this.s, P = SPAWN;
    item.position.copy(P);
    if (theme === 'balloon') {
      item.position.set(P.x + 2.5, -1.5, P.z);
      sfx.whoosh();
      await s.anim(0.55, (e, p) => { item.position.x = P.x + 2.5 * (1 - e); item.position.y = -1.5 + (P.y + 1.5) * e; b.rotation.z = Math.sin(p * Math.PI * 3) * 0.25 * (1 - p); }, Ease.out);
      sfx.bloop(4);
    } else if (theme === 'fish') {
      sfx.splash();
      await s.anim(0.55, (e, p) => { item.position.x = 8 * (1 - p); item.position.y = P.y + Math.sin(p * Math.PI) * 2.6; b.rotation.z = (1 - p) * Math.PI * 2; }, Ease.linear);
      b.rotation.z = 0;
      sfx.land();
      s.anim(0.3, (_, p) => { b.scale.set(1 + Math.sin(p * Math.PI) * 0.2, 1 - Math.sin(p * Math.PI) * 0.2, 1); });
    } else if (theme === 'car') {
      item.position.x = -9;
      sfx.patter();
      await s.anim(0.55, (e, p) => { item.position.x = -9 * (1 - e); b.position.y = Math.abs(Math.sin(p * Math.PI * 5)) * 0.08; }, Ease.out);
      b.position.y = 0;
      sfx.highBoing();
      s.anim(0.3, (_, p) => { b.rotation.z = Math.sin(p * Math.PI) * 0.15; });
    } else if (theme === 'star') {
      item.position.y = 9;
      sfx.twinkle();
      await s.tween(item.position, { y: P.y }, 0.5, Ease.bounce);
      sfx.land();
    } else if (theme === 'flower') {
      b.scale.set(0.001, 0.001, 0.001);
      sfx.rustle();
      await s.anim(0.45, (_, p) => { const k = Ease.elastic(p); b.scale.set(k, k, k); b.rotation.z = (1 - p) * 2; });
      b.rotation.z = 0; b.scale.setScalar(1);
      sfx.sparkle();
    } else if (theme === 'duck') {
      item.position.x = 8;
      sfx.squeak();
      await s.anim(0.55, (e, p) => { item.position.x = 8 * (1 - e); b.rotation.z = Math.sin(p * Math.PI * 8) * 0.2; b.position.y = Math.abs(Math.sin(p * Math.PI * 8)) * 0.1; }, Ease.out);
      b.rotation.z = 0; b.position.y = 0;
      sfx.squeak();
    } else if (theme === 'block') {
      item.position.set(8, P.y + 2, P.z);
      await s.anim(0.5, (e, p) => { item.position.x = 8 * (1 - e); item.position.y = P.y + Math.abs(Math.cos(p * Math.PI * 1.5)) * 2 * (1 - p); b.rotation.z = (1 - e) * Math.PI * 2; }, Ease.out);
      b.rotation.z = 0;
      sfx.thunk();
    } else if (theme === 'heart') {
      sfx.boing();
      await popIn(s, b, 1, 0.45, { sound: false });
    } else {
      // ball: rolls in with little bounces
      item.position.x = 9;
      sfx.swoosh();
      await s.anim(0.55, (e, p) => { item.position.x = 9 * (1 - e); b.rotation.z = e * Math.PI * 3; item.position.y = P.y + Math.abs(Math.sin(p * Math.PI * 3)) * 0.5 * (1 - p); }, Ease.out);
      b.rotation.z = 0;
      sfx.land();
    }
    item.position.copy(P);
  }

  promptText() {
    const c = this.plan[this.round]?.[0];
    return c ? `${cap(c)}! Put it with ${c}.` : '';
  }

  // the tube under the dragged toy opens wide in anticipation: "ooh!"
  onHover(z) {
    const t = z ? z.tube : null;
    if (t !== this.hover && t) sfx.bloop(1);
    this.hover = t;
  }

  update(dt, t) {
    const item = this.item;
    const dragging = input.dragging();
    if (item && !item.userData.inTube) {
      item.getWorldPosition(tmp);
      // idle life on the toy itself (inner body, so dragging is untouched)
      const b = item.userData.body;
      if (!this.busy && item.userData.theme === 'balloon') b.position.y = Math.sin(t * 2.5) * 0.08;
      if (!this.busy && item.userData.theme === 'fish' && !dragging) b.rotation.z = Math.sin(t * 6) * 0.06;
    }
    for (const tube of this.tubes) {
      const u = tube.userData;
      // pupils follow the toy
      u.face.getWorldPosition(tmp2);
      const dx = item ? T.MathUtils.clamp((tmp.x - tmp2.x) * 0.03, -0.08, 0.08) : 0;
      const dy = item ? T.MathUtils.clamp((tmp.y - tmp2.y) * 0.03, -0.07, 0.07) : 0;
      for (const p of u.eyes) { p.position.x += (dx - p.position.x) * 0.2; p.position.y += (dy - p.position.y) * 0.2; }
      // mouth: open when the toy hovers over this tube (or forced during a gulp / wrong answer)
      const want = u.forceOpen ?? (dragging && this.hover === tube ? 1 : 0);
      u.open += (want - u.open) * Math.min(1, dt * 14);
      const o = Math.max(0.001, u.open);
      u.mouth.scale.set(0.7 + o * 0.5, o, 0.25);
      u.smile.visible = o < 0.25;
    }
  }

  goHome(item) {
    this.s.tween(item.position, { x: SPAWN.x, y: SPAWN.y, z: SPAWN.z }, 0.5, Ease.back);
    this.s.tween(item.scale, { x: 1, y: 1, z: 1 }, 0.3);
  }

  async drop(zone, { tapped }) {
    const item = this.item;
    this.hover = null;
    if (!item || !item.userData.ready || item.userData.inTube || this.busy) return; // ignore drops before the toy has arrived
    if (!zone) {
      this.goHome(item);
      if (tapped) { wiggle(this.s, item, 0.4); sfx.squeak(); }
      return;
    }
    const tube = zone.tube;
    const color = item.userData.color;
    if (tube.userData.color !== color) {
      // the tube clamps its mouth shut and shakes "no no", the toy boings back home
      const u = tube.userData;
      u.forceOpen = 0;
      sfx.boing();
      this.goHome(item);
      const ry = u.body.rotation.y;
      this.s.anim(0.55, (_, p) => { u.body.rotation.y = ry + Math.sin(p * Math.PI * 4) * 0.35 * (1 - p); }).then(() => { u.body.rotation.y = ry; u.forceOpen = null; });
      this.redirect(`That's ${tube.userData.color}. Find ${color}!`);
      return;
    }
    // correct: praise starts now; the gulp plays during the celebration
    input.remove(this.target);
    const n = tube.userData.count++;
    tube.userData.body.attach(item); // part of the tube now, so the stack moves when tubes re-arrange
    item.userData.inTube = true;
    this.success(new T.Vector3(tube.position.x, 3.4, tube.position.z), `${cap(color)}!`);
    this.gulp(tube, item, n);
  }

  // stretch up with the mouth wide → toy drops in → GULP (squash, swallow ring) → happy squint + blush
  async gulp(tube, item, n) {
    const u = tube.userData, s = this.s, b = u.body, p = item.position;
    u.forceOpen = 1.2;
    sfx.gasp();
    s.tween(item.scale, { x: 0.82, y: 0.82, z: 0.82 }, 0.2);
    s.anim(0.22, (_, q) => { b.scale.set(1 - q * 0.06, 1 + q * 0.12, 1 - q * 0.06); });
    await s.tween(p, { x: 0, y: 4.0, z: 0 }, 0.22, Ease.out);
    const endY = 0.32 + 0.4 + n * 0.72;
    await s.tween(p, { y: endY }, 0.22, Ease.in);
    sfx.lowBoing();
    sfx.pop();
    u.forceOpen = 0;
    u.bulge.visible = true;
    // squash + bulge ring sliding down the glass
    s.anim(0.4, (_, q) => {
      const k = Math.sin(q * Math.PI) * (1 - q * 0.4);
      b.scale.set(1 + k * 0.14, 1 - k * 0.16, 1 + k * 0.14);
      u.bulge.position.y = 3.0 - q * (3.0 - Math.max(0.6, endY));
      u.bulge.scale.setScalar(1 + Math.sin(q * Math.PI) * 0.1);
    }).then(() => { b.scale.set(1, 1, 1); u.bulge.visible = false; });
    // happy squint + puffed cheeks
    s.anim(0.5, (_, q) => {
      const k = Math.sin(q * Math.PI);
      for (const w of u.whites) w.scale.y = 1 - k * 0.7;
      for (const c of u.cheeks) c.scale.set(1 + k * 0.8, 0.6 + k * 0.5, 0.3);
    }).then(() => { for (const w of u.whites) w.scale.y = 1; u.forceOpen = null; });
    this.s.wait(0.15).then(() => sfx.mmm());
    fx.float(new T.Vector3(tube.position.x + 0.9, 3.6, tube.position.z), '♥', { color: HEX[u.color], size: 7 });
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
    // every tube does a happy hop, then the tallest one burps a star
    this.tubes.forEach((t, i) => this.s.wait(0.3 + i * 0.15).then(() => hop(this.s, t, 0.6, 0.4, { sound: true })));
    const tallest = this.tubes.reduce((a, b) => (b.userData.count > a.userData.count ? b : a));
    this.s.wait(1.6).then(() => {
      wiggle(this.s, tallest, 0.2, 1);
      sfx.boing2();
      fx.float(new T.Vector3(tallest.position.x, 4, tallest.position.z), '★', { color: HEX[tallest.userData.color], size: 12 });
      this.say(`Look! So much ${tallest.userData.color}!`);
    });
  }
}
