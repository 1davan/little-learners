// Game 6 — Pattern parade. Topics mt_ZjIFGc6zPW "Finding the repeating unit" and mt_WXW0hjNhph "Patterns & sequences".
// A parade of beach things marches onto the boardwalk and plays its pattern as a little tune (shell, star, shell, star…);
// the child taps what comes next (or what's missing). The finished parade plays its tune and marches off.
import * as T from '../three.js';
import { Lesson, shuffle } from '../engine/lesson.js';
import { mesh, geo, basic, ink } from '../engine/toon.js';
import { popIn, popOut, hop } from '../engine/actors.js';
import { makeStarfish } from '../engine/scenery.js';
import { makeCrab, makeBucket, makeBeachBall, makeShell, makeDuck, makeGull } from '../engine/beach.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';
import { project } from '../engine/stage.js';

const NOTE = { shell: 0, star: 2, crab: 4, ball: 5, bucket: 7 };
const NAME = { shell: 'shell', star: 'starfish', crab: 'crab', ball: 'beach ball', bucket: 'bucket' };
const ICON = { shell: '🐚', star: '⭐', crab: '🦀', ball: '🏐', bucket: '🪣' };
const ROW_Y = 2.25, ROW_Z = -1.2, TOWEL_Z = 3.2, CHOICE_S = 1.15, BEAT = 0.17;

// One look per round so no two parades feel the same: towel stripes, item colours and who leads the parade.
const THEMES = [
  { towel: 0x4ab0ff, bucket: 0x4a90ff, shell: 0xff9ec0, star: 0xff9f3f, crab: 0xff5a4a, ball: [0xff5a5a, 0xffd23f, 0x4a90ff], leader: 'duck', flag: 0xff5a5a },
  { towel: 0xff7a9c, bucket: 0x5fd068, shell: 0xffd0a0, star: 0xff6f9c, crab: 0xff7a3a, ball: [0xa77bff, 0x5fd068, 0xff9f3f], leader: 'gull', flag: 0xffd23f },
  { towel: 0x5fd068, bucket: 0xff5a5a, shell: 0xc9a7ff, star: 0xffc23f, crab: 0xff5a4a, ball: [0x4a90ff, 0xff8fc0, 0xffd23f], leader: 'duck', flag: 0x4a90ff },
  { towel: 0xffb020, bucket: 0xa77bff, shell: 0xff9ec0, star: 0xff9f3f, crab: 0xff6a5a, ball: [0xff5a5a, 0x5fd068, 0x4a90ff], leader: 'gull', flag: 0x5fd068 },
  { towel: 0xa77bff, bucket: 0xffb020, shell: 0xa8e0ff, star: 0xff7a5c, crab: 0xff5a4a, ball: [0xffd23f, 0x4a90ff, 0xff8fc0], leader: 'duck', flag: 0xff8fc0 },
  { towel: 0xff5a5a, bucket: 0x4ab0ff, shell: 0xffe08a, star: 0xffa53f, crab: 0xff7a3a, ball: [0x5fd068, 0xff5a5a, 0xa77bff], leader: 'gull', flag: 0xa77bff },
];

function makeItem(kind, th = THEMES[0]) {
  const g = new T.Group();
  let m;
  if (kind === 'shell') { m = makeShell(th.shell, 1.15); m.rotation.x = 1.1; m.position.y = 0.45; }
  else if (kind === 'star') { m = makeStarfish(th.star, 0.55); m.position.y = 0.55; }
  else if (kind === 'crab') { m = makeCrab(th.crab); m.scale.setScalar(0.55); }
  else if (kind === 'ball') { m = makeBeachBall(0.48, th.ball); m.position.y = 0.5; }
  else { m = makeBucket(th.bucket, 0.42, 0.6); m.position.y = 0.02; }
  g.add(m);
  g.userData.kind = kind;
  g.userData.inner = m;
  return g;
}

function makeLeader(th) {
  const g = new T.Group();
  const bird = th.leader === 'duck' ? makeDuck(0.7) : makeGull();
  if (th.leader === 'gull') bird.scale.setScalar(0.6);
  bird.rotation.y = Math.PI / 2 - 0.35; // faces the way the parade marches
  g.add(bird);
  // a little parade flag on a stick
  const stick = mesh(geo.cyl(0.035, 0.035, 1.5, 6), 0xa86f3a, { outline: 0.012 });
  stick.position.set(-0.35, 0.95, 0.3);
  const flag = new T.Mesh(geo.box(0.55, 0.36, 0.03), basic(th.flag));
  flag.position.set(-0.07, 1.5, 0.3);
  g.add(stick, flag);
  g.userData.flag = flag;
  g.userData.bird = bird;
  return g;
}

// The smallest repeating unit of a sequence (for the "listen again" replay after a wrong tap).
function period(seq) {
  for (let p = 1; p < seq.length; p++) if (seq.every((k, i) => i < p || k === seq[i - p])) return p;
  return seq.length;
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
    // striped towel holding the choices (its colour changes every round)
    const towel = new T.Group();
    this.stripes = [];
    for (let i = 0; i < 7; i++) {
      const stripe = new T.Mesh(geo.box(1.0, 0.06, 1.8), i % 2 ? basic(0xffffff) : new T.MeshBasicMaterial({ color: 0x4ab0ff }));
      stripe.position.x = -3 + i;
      towel.add(stripe);
      if (!(i % 2)) this.stripes.push(stripe);
    }
    towel.position.set(0, 0.03, TOWEL_Z);
    this.root.add(towel);
    this.towel = towel;
    this.row = [];
    this.choices = [];
    this.leader = null;
  }

  answer() { const p = this.plan[this.round]; return p.seq[p.gap ?? p.seq.length - 1]; }
  gapIndex() { const p = this.plan[this.round]; return p.gap ?? p.seq.length - 1; }

  slotX(i, n) { const sp = Math.min(1.7, 11.5 / n); return (i - (n - 1) / 2) * sp; }

  // Tap area that matches what you see: measured from the item's own bounds at its towel size.
  fitTap(c) {
    const s0 = c.scale.x;
    c.scale.setScalar(CHOICE_S);
    c.updateMatrixWorld(true);
    const box = new T.Box3().setFromObject(c);
    c.scale.setScalar(s0);
    const centre = box.getCenter(new T.Vector3());
    const size = box.getSize(new T.Vector3());
    const offset = centre.sub(c.position);
    // input.js scales radius by 1.25; aim for ~1.1× the visible half-size so neighbours never overlap
    const radius = (Math.max(size.x, size.y) / 2) * 0.9;
    c.userData.hitOffset = offset;
    return input.addTap(c, { radius, offset, onTap: () => this.pick(c) });
  }
  hitPoint(c) { return c.position.clone().add(c.userData.hitOffset || new T.Vector3(0, 0.5, 0)); }

  clearChoices() {
    // Old tap targets must go too: a stale one from an earlier round used to win the hit test
    // (that is how a tap on the bucket was answered with "That's star").
    for (const c of this.choices) { if (c.userData.tap) input.remove(c.userData.tap); c.userData.tap = null; }
  }

  async startRound(r) {
    this.busy = true;
    const p = this.plan[r];
    const th = THEMES[r % THEMES.length];
    const gap = this.gapIndex();
    this.clearChoices();
    for (const o of this.choices) this.root.remove(o);
    for (const o of this.row) if (!o.userData.leaving) this.root.remove(o);
    if (this.leader && !this.leader.userData.leaving) this.root.remove(this.leader);
    if (this.marker) this.root.remove(this.marker);
    this.row = []; this.choices = [];
    this.stripes.forEach((s) => s.material.color.setHex(th.towel));
    const n = p.seq.length;
    // the empty slot: a pulsing ring with a question mark
    const marker = new T.Group();
    const ring = new T.Mesh(geo.ring(0.55, 0.7, 32), new T.MeshBasicMaterial({ color: 0xffffff })); // own material: it changes colour
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
    marker.userData = { q, ring, pulse: 0 };
    marker.visible = false;
    this.root.add(marker);
    this.marker = marker;
    this.slotPos = new T.Vector3(this.slotX(gap, n), ROW_Y, ROW_Z);

    // caption: the pattern in pictures, so a grown-up can chant it
    this.say(p.seq.map((k, i) => (i === gap ? '❓' : ICON[k])).join(' '), { rate: 0.8 });

    // the parade marches in from the left behind its leader, stepping to a drum beat
    const items = [];
    for (let i = 0; i < n; i++) {
      if (i === gap) continue;
      const it = makeItem(p.seq[i], th);
      it.userData.slot = i;
      it.userData.hx = this.slotX(i, n);
      this.root.add(it);
      items.push(it);
    }
    const leader = makeLeader(th);
    leader.userData.hx = this.slotX(n - 1, n) + 1.45;
    this.root.add(leader);
    this.leader = leader;
    const marchers = [...items, leader];
    const D = 13, dur = 0.85;
    for (const m of marchers) m.position.set(m.userData.hx - D, ROW_Y, ROW_Z);
    for (let k = 0; k < 5; k++) this.s.wait(k * BEAT).then(() => (k % 2 ? sfx.drumSoft() : sfx.tick()));
    if (th.leader === 'duck') sfx.quack(); else sfx.gull();
    await this.s.anim(dur, (e, raw) => {
      for (const m of marchers) {
        m.position.x = m.userData.hx - D * (1 - e);
        m.position.y = ROW_Y + Math.abs(Math.sin(raw * Math.PI * 7)) * 0.28 * (1 - raw);
      }
    }, Ease.out);
    for (const m of marchers) m.position.y = ROW_Y;
    sfx.land();
    this.row = items;
    // the marker drops into the empty spot
    marker.visible = true;
    popIn(this.s, marker, 1, 0.3, { sound: false });

    // the choices pop onto the towel while the parade plays its tune
    const xs = p.choices.length === 2 ? [-1.9, 1.9] : [-2.8, 0, 2.8];
    shuffle(p.choices).forEach((k, i) => {
      const c = makeItem(k, th);
      c.position.set(xs[i], 0.1, TOWEL_Z);
      c.userData.baseScale = CHOICE_S;
      this.root.add(c);
      this.choices.push(c);
      c.userData.tap = this.fitTap(c);
      c.userData.tap.enabled = false;
      popIn(this.s, c, CHOICE_S, 0.35 + i * 0.08);
    });
    await this.playTune(p.seq.map((k, i) => (i === gap ? null : items.find((o) => o.userData.slot === i))), 0.22);
    for (const c of this.choices) if (c.userData.tap) c.userData.tap.enabled = true;
    this.busy = false;
    this.cue();
  }

  // Play the parade as a tune: each thing hops and sings its note in turn. null = the empty slot ("what?").
  async playTune(list, beat = BEAT, { big = null } = {}) {
    for (const o of list) {
      if (this.dead) return;
      if (o) {
        sfx.note(NOTE[o.userData.kind]);
        hop(this.s, o, o === big ? 0.75 : 0.42, Math.max(0.24, beat * 1.4));
        fx.float(o.getWorldPosition(new T.Vector3()).add(new T.Vector3(0, 1.1, 0)), '♪', { color: '#ff7a59', size: 4.5 });
      } else if (this.marker) {
        sfx.tick();
        this.pulseMarker();
      }
      await this.wait(beat);
    }
  }

  pulseMarker() { if (this.marker) this.marker.userData.pulse = 1; }

  promptText() { return this.plan[this.round]?.gap !== undefined ? "What's missing? ❓" : 'What comes next? ❓'; }

  async pick(c) {
    if (this.busy || !this.choices.includes(c)) return;
    const k = c.userData.kind;
    sfx.note(NOTE[k]);
    const ans = this.answer();
    if (k !== ans) {
      this.wrong(c);
      this.redirect(`That's the ${NAME[k]} ${ICON[k]}. Find the ${NAME[ans]} ${ICON[ans]}!`);
      return;
    }
    this.busy = true;
    input.lock(3000);
    this.clearChoices();
    // fly into the slot with a little spin
    const from = c.position.clone();
    const to = this.slotPos;
    const inner = c.userData.inner, ry0 = inner.rotation.y;
    sfx.swoosh();
    await this.s.anim(0.45, (e) => {
      c.position.lerpVectors(from, to, e);
      c.position.y += Math.sin(e * Math.PI) * 2;
      c.scale.setScalar(CHOICE_S + (1 - CHOICE_S) * e);
      inner.rotation.y = ry0 + e * Math.PI * 2;
    }, Ease.inOut);
    inner.rotation.y = ry0;
    c.userData.baseScale = 1;
    this.marker.visible = false;
    sfx.pop();
    c.userData.slot = this.gapIndex();
    this.row.push(c);
    this.choices = this.choices.filter((x) => x !== c);
    for (const o of this.choices) popOut(this.s, o, 0.22);
    // the leader waves its flag, and the finished parade plays the whole pattern as a tune
    const ordered = this.row.slice().sort((a, b) => a.position.x - b.position.x);
    const flag = this.leader.userData.flag;
    this.s.anim(0.9, (_, pr) => { flag.rotation.z = Math.sin(pr * Math.PI * 6) * 0.5; });
    hop(this.s, this.leader, 0.5, 0.35);
    this.playTune(ordered, 0.15, { big: c }).then(() => { if (!this.dead) sfx.drumLoud(); });
    const p = this.plan[this.round];
    this.busy = false;
    this.success(to.clone().add(new T.Vector3(0, 1, 0)), p.seq.map((x) => ICON[x]).join(' ') + '!');
  }

  // Wrong tap: the thing shakes its head "no", the empty slot pulses, and the last bit of the parade sings again.
  wrong(c) {
    const inner = c.userData.inner, ry0 = inner.rotation.y, x0 = c.position.x;
    this.s.anim(0.5, (_, pr) => {
      const w = Math.sin(pr * Math.PI * 6) * (1 - pr);
      inner.rotation.y = ry0 + w * 0.6;
      c.position.x = x0 + w * 0.18;
    }).then(() => { inner.rotation.y = ry0; c.position.x = x0; });
    fx.float(this.hitPoint(c).add(new T.Vector3(0, 0.9, 0)), '✕', { color: '#ff5a5a', size: 6 });
    // replay the unit just before the gap (or just after it, for a missing-middle pattern), then "?"
    const p = this.plan[this.round], gap = this.gapIndex(), per = period(p.seq);
    const idx = [];
    if (gap >= per) for (let i = gap - per; i < gap; i++) idx.push(i);
    else for (let i = gap + 1; i <= gap + per && i < p.seq.length; i++) idx.push(i);
    const list = idx.map((i) => this.row.find((o) => o.userData.slot === i)).filter(Boolean);
    if (gap >= per) list.push(null); else list.unshift(null);
    this.s.wait(0.25).then(() => this.playTune(list, 0.2));
  }

  // Tapping a parade member is never an answer: it just sings its note and hops.
  pokeAt(x, y) {
    if (super.pokeAt(x, y)) return true;
    if (this.busy) return false;
    const min = Math.min(innerWidth, innerHeight) * 0.07;
    for (const o of this.row) {
      const p = project(o.getWorldPosition(new T.Vector3()).add(new T.Vector3(0, 0.5, 0)));
      if (Math.hypot(p.x - x, p.y - y) < min) { sfx.note(NOTE[o.userData.kind]); hop(this.s, o, 0.4, 0.3); return true; }
    }
    return false;
  }

  showHint(glow = true) {
    const c = this.choices.find((x) => x.userData.kind === this.answer());
    if (!c) return;
    if (glow) this.addHalo(c, 1.0);
    fx.ghostPath([this.hitPoint(c)], { mode: 'tap' });
  }

  choicePoints() { return [this.slotPos.clone().add(new T.Vector3(0, 0.6, 0)), ...this.choices.map((c) => this.hitPoint(c))]; }

  makeErrorless() {
    for (const c of this.choices) if (c.userData.kind !== this.answer() && c.userData.tap) {
      c.userData.tap.enabled = false;
      this.s.tween(c.scale, { x: 0.55, y: 0.55, z: 0.55 }, 0.4);
    }
  }

  // Round transition: the finished parade marches off to the right; the next one marches in from the left.
  async afterSuccess() {
    if (this.round >= this.totalRounds) return; // the finale marches the last parade off
    this.marchOff([...this.row, this.leader].filter(Boolean), 0.75);
    await this.wait(0.15);
  }

  marchOff(list, dur, dist = 13) {
    sfx.swoosh();
    for (const o of list) {
      o.userData.leaving = true;
      const x0 = o.position.x;
      this.s.anim(dur, (e, raw) => {
        o.position.x = x0 + dist * e;
        o.position.y = ROW_Y + Math.abs(Math.sin(raw * Math.PI * 8)) * 0.3;
      }, Ease.in).then(() => { this.root.remove(o); });
    }
    for (let k = 0; k < 4; k++) this.s.wait(k * BEAT).then(() => (k % 2 ? sfx.drumSoft() : sfx.tick()));
  }

  update(dt, t) {
    const m = this.marker;
    if (m) {
      const u = m.userData;
      u.pulse = Math.max(0, u.pulse - dt * 2.2);
      const k = 1 + Math.sin(t * 6) * 0.08 + u.pulse * 0.7;
      u.q.position.y = ROW_Y + 0.9 + Math.sin(t * 4) * 0.12 + u.pulse * 0.5;
      u.q.scale.setScalar(1 + u.pulse * 0.6);
      u.ring.scale.setScalar(k);
      u.ring.material.color.setRGB(1, 1 - u.pulse * 0.25, 1 - u.pulse * 0.7);
    }
    // the waiting parade sways to the beat and the flag flutters
    if (!this.busy) this.row.forEach((o, i) => { o.rotation.z = Math.sin(t * 5 + i * 1.3) * 0.06; });
    if (this.leader) this.leader.userData.flag.rotation.y = Math.sin(t * 7) * 0.3;
  }

  onFinale() {
    // the last parade marches off for good, singing its tune as it goes
    const list = [...this.row, this.leader].filter(Boolean);
    const ordered = this.row.slice().sort((a, b) => b.position.x - a.position.x);
    ordered.forEach((o, i) => this.s.wait(0.5 + i * 0.18).then(() => sfx.note(NOTE[o.userData.kind])));
    this.s.wait(0.5).then(() => this.marchOff(list, 2.4, 16));
  }
}
