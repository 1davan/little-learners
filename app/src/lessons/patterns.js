// Game 6 — Pattern parade. Topics mt_ZjIFGc6zPW "Finding the repeating unit" and mt_WXW0hjNhph "Patterns & sequences".
// A row of beach things is chanted (shell, star, shell, star…); the child taps what comes next (or what's missing).
import * as T from '../three.js';
import { Lesson, shuffle } from '../engine/lesson.js';
import { mesh, geo, basic, ink } from '../engine/toon.js';
import { C, popIn, hop, shake } from '../engine/actors.js';
import { makeStarfish } from '../engine/scenery.js';
import { makeCrab, makeBucket, makeBeachBall, makeShell } from '../engine/beach.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';

const NOTE = { shell: 0, star: 2, crab: 4, ball: 5, bucket: 7 };
const ROW_Y = 2.25, ROW_Z = -1.2, TOWEL_Z = 3.2;

function makeItem(kind) {
  const g = new T.Group();
  let m;
  if (kind === 'shell') { m = makeShell(0xff9ec0, 1.15); m.rotation.x = 1.1; m.position.y = 0.45; }
  else if (kind === 'star') { m = makeStarfish(0xff9f3f, 0.55); m.position.y = 0.55; }
  else if (kind === 'crab') { m = makeCrab(); m.scale.setScalar(0.55); }
  else if (kind === 'ball') { m = makeBeachBall(0.48); m.position.y = 0.5; }
  else { m = makeBucket(C.blue, 0.42, 0.6); m.position.y = 0.02; }
  g.add(m);
  g.userData.kind = kind;
  return g;
}

// Level tables: seq is the full pattern; gap is the index the child fills (default: the last one).
const PLANS = [
  [
    { seq: ['shell', 'star', 'shell', 'star', 'shell'], choices: ['shell', 'star'] },
    { seq: ['crab', 'ball', 'crab', 'ball', 'crab'], choices: ['crab', 'ball'] },
    { seq: ['star', 'shell', 'star', 'shell', 'star', 'shell'], choices: ['shell', 'star'] },
    { seq: ['bucket', 'crab', 'bucket', 'crab', 'bucket'], choices: ['bucket', 'crab'] },
    { seq: ['ball', 'shell', 'ball', 'shell', 'ball', 'shell'], choices: ['shell', 'ball'] },
    { seq: ['shell', 'crab', 'shell', 'crab', 'shell'], choices: ['shell', 'crab'] },
  ],
  [
    { seq: ['shell', 'star', 'shell', 'star', 'shell', 'star'], choices: ['star', 'shell', 'crab'] },
    { seq: ['crab', 'bucket', 'crab', 'bucket', 'crab'], choices: ['crab', 'bucket', 'ball'] },
    { seq: ['ball', 'star', 'ball', 'star', 'ball', 'star'], choices: ['star', 'ball', 'shell'] },
    { seq: ['shell', 'crab', 'shell', 'crab', 'shell'], choices: ['shell', 'crab', 'bucket'] },
    { seq: ['star', 'star', 'crab', 'star', 'star', 'crab'], choices: ['crab', 'star', 'ball'] },
    { seq: ['bucket', 'ball', 'ball', 'bucket', 'ball', 'ball'], choices: ['ball', 'bucket', 'shell'] },
  ],
  [
    { seq: ['shell', 'shell', 'star', 'shell', 'shell', 'star'], choices: ['star', 'shell', 'crab'] },
    { seq: ['crab', 'ball', 'ball', 'crab', 'ball', 'ball'], choices: ['ball', 'crab', 'star'] },
    { seq: ['shell', 'star', 'crab', 'shell', 'star', 'crab'], choices: ['crab', 'shell', 'star'] },
    { seq: ['bucket', 'bucket', 'ball', 'bucket', 'bucket', 'ball', 'bucket'], choices: ['bucket', 'ball', 'crab'] },
    { seq: ['ball', 'crab', 'shell', 'ball', 'crab', 'shell', 'ball'], choices: ['ball', 'crab', 'shell'] },
    { seq: ['star', 'crab', 'star', 'crab', 'star', 'crab'], gap: 1, choices: ['crab', 'star', 'bucket'] },
  ],
];

export default class PatternsLesson extends Lesson {
  build() {
    this.plan = PLANS[this.level];
    // a wooden boardwalk shelf the parade walks along
    const shelf = new T.Group();
    const plank = mesh(geo.box(13, 0.3, 1.4), 0xc98b4f, { hull: 1.02 });
    plank.position.y = ROW_Y - 0.15;
    shelf.add(plank);
    for (const x of [-5.8, -2, 2, 5.8]) {
      const post = mesh(geo.cyl(0.14, 0.16, ROW_Y, 10), 0xa86f3a, { outline: 0.02 });
      post.position.set(x, ROW_Y / 2 - 0.15, 0);
      shelf.add(post);
    }
    shelf.position.z = ROW_Z;
    this.root.add(shelf);
    // striped towel holding the choices
    const towel = new T.Group();
    for (let i = 0; i < 7; i++) {
      const stripe = new T.Mesh(geo.box(1.0, 0.06, 1.8), basic(i % 2 ? 0xffffff : 0x4ab0ff));
      stripe.position.x = -3 + i;
      towel.add(stripe);
    }
    towel.position.set(0, 0.03, TOWEL_Z);
    this.root.add(towel);
    this.row = [];
    this.choices = [];
  }

  answer() { const p = this.plan[this.round]; return p.seq[p.gap ?? p.seq.length - 1]; }
  gapIndex() { const p = this.plan[this.round]; return p.gap ?? p.seq.length - 1; }

  slotX(i, n) { const sp = Math.min(1.7, 11.5 / n); return (i - (n - 1) / 2) * sp; }

  async startRound(r) {
    this.busy = true;
    const p = this.plan[r];
    const gap = this.gapIndex();
    for (const o of [...this.row, ...this.choices]) this.root.remove(o);
    if (this.marker) this.root.remove(this.marker);
    this.row = []; this.choices = [];
    const n = p.seq.length;
    // the empty slot: a pulsing ring with a question mark
    const marker = new T.Group();
    const ring = new T.Mesh(geo.ring(0.55, 0.7, 32), basic(0xffffff));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = ROW_Y + 0.02;
    const q = new T.Group();
    const arc = ink(geo.torus(0.2, 0.07, Math.PI * 1.4, 6, 16));
    arc.rotation.z = -0.5; arc.position.y = 0.15;
    const dot = ink(geo.sphere(0.08, 8, 6)); dot.position.y = -0.3;
    q.add(arc, dot);
    q.position.y = ROW_Y + 0.9;
    marker.add(ring, q);
    marker.position.set(this.slotX(gap, n), 0, ROW_Z);
    marker.userData.q = q;
    this.root.add(marker);
    this.marker = marker;
    this.slotPos = new T.Vector3(this.slotX(gap, n), ROW_Y, ROW_Z);

    // chant the pattern as each item pops in
    const words = p.seq.map((k, i) => (i === gap ? null : k));
    const chant = words.slice(0, p.gap === undefined ? gap : n).map((w) => w || 'what?').join(', ');
    this.say(chant + '…', { rate: 0.8 });
    for (let i = 0; i < n; i++) {
      if (i === gap) { await this.wait(0.42); continue; }
      const it = makeItem(p.seq[i]);
      it.position.set(this.slotX(i, n), ROW_Y, ROW_Z);
      this.root.add(it);
      this.row.push(it);
      popIn(this.s, it, 1, 0.3);
      sfx.note(NOTE[p.seq[i]]);
      await this.wait(0.42);
    }
    // the choices on the towel
    const xs = p.choices.length === 2 ? [-1.9, 1.9] : [-2.7, 0, 2.7];
    shuffle(p.choices).forEach((k, i) => {
      const c = makeItem(k);
      c.position.set(xs[i], 0.1, TOWEL_Z);
      c.scale.setScalar(1.15);
      c.userData.baseScale = 1.15;
      this.root.add(c);
      this.choices.push(c);
      popIn(this.s, c, 1.15, 0.35 + i * 0.08);
      c.userData.tap = input.addTap(c, { radius: 1.0, offset: new T.Vector3(0, 0.55, 0), onTap: () => this.pick(c) });
    });
    await this.wait(0.3);
    this.busy = false;
    this.cue();
  }

  promptText() { return this.plan[this.round]?.gap !== undefined ? "What's missing?" : 'What comes next?'; }

  async pick(c) {
    if (this.busy) return;
    const k = c.userData.kind;
    sfx.note(NOTE[k]);
    if (k !== this.answer()) {
      shake(this.s, c, 0.15);
      this.redirect(`That's ${k}. Find ${this.answer()}!`);
      return;
    }
    this.busy = true;
    input.lock(3000);
    // fly into the slot
    const from = c.position.clone();
    const to = this.slotPos;
    this.marker.visible = false;
    await this.s.anim(0.6, (e) => {
      c.position.lerpVectors(from, to, e);
      c.position.y += Math.sin(e * Math.PI) * 2;
      const sc = 1.15 + (1 - 1.15) * e; c.scale.setScalar(sc);
    }, Ease.inOut);
    sfx.pop();
    this.row.push(c);
    this.choices = this.choices.filter((x) => x !== c);
    for (const o of this.choices) this.s.tween(o.scale, { x: 0.001, y: 0.001, z: 0.001 }, 0.3);
    // the whole parade hops in a wave and the chant plays again, complete
    const p = this.plan[this.round];
    const ordered = this.row.slice().sort((a, b) => a.position.x - b.position.x);
    ordered.forEach((o, i) => this.s.wait(i * 0.22).then(() => { hop(this.s, o, 0.5, 0.3); sfx.note(NOTE[o.userData.kind]); }));
    await this.wait(0.2);
    this.busy = false;
    this.success(to.clone().add(new T.Vector3(0, 1, 0)), p.seq.join(', ') + '!');
  }

  showHint(glow = true) {
    const c = this.choices.find((x) => x.userData.kind === this.answer());
    if (!c) return;
    const at = c.position.clone().add(new T.Vector3(0, 0.6, 0));
    if (glow) this.addHalo(c, 1.0);
    fx.ghostPath([at], { mode: 'tap' });
  }

  choicePoints() { return [this.slotPos.clone().add(new T.Vector3(0, 0.6, 0)), ...this.choices.map((c) => c.position.clone().add(new T.Vector3(0, 0.6, 0)))]; }

  makeErrorless() {
    for (const c of this.choices) if (c.userData.kind !== this.answer()) {
      c.userData.tap.enabled = false;
      this.s.tween(c.scale, { x: 0.55, y: 0.55, z: 0.55 }, 0.4);
    }
  }

  update(dt, t) {
    if (this.marker) { this.marker.userData.q.position.y = ROW_Y + 0.9 + Math.sin(t * 4) * 0.12; this.marker.children[0].scale.setScalar(1 + Math.sin(t * 6) * 0.08); }
  }

  onFinale() {
    // conga line marches off to the right
    const ordered = this.row.slice().sort((a, b) => b.position.x - a.position.x);
    ordered.forEach((o, i) => this.s.wait(0.6 + i * 0.15).then(() => {
      this.s.anim(2.2, (e) => { o.position.x += 0.12; o.position.y = ROW_Y + Math.abs(Math.sin(e * 18)) * 0.3; });
      sfx.note(NOTE[o.userData.kind]);
    }));
  }
}
