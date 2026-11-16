// Game 7 — Where's Crab? Topics mt_qeZYF6HZ4o "Positional language" and mt_VY3rBq8RyP "Prepositions".
// Drag a beach friend IN, ON or UNDER a beach thing. Every round is a tiny story ("Uh-oh, rain!", "Crab is sleepy…")
// with its own place: bucket, sandcastle, swim ring, towel, picnic basket, deck chair, umbrella, boat, treasure chest,
// box, sun hat. Each level has its own cast and set of places. The props drop onto the sand with real physics, loose
// shells / balls / coins tumble around and pile into the containers, and every position has its own payoff:
// in → the bits inside get bumped out (splash!), on → wobbly ta-da balance, under → the prop covers the friend and its eyes peek out.
import * as T from '../three.js';
import { Lesson } from '../engine/lesson.js';
import { popIn, popOut, hop, wiggle, setFace } from '../engine/actors.js';
import { makeCrab, makeDuck, makeGull, makeWaterDrop } from '../engine/beach.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';
import { physics } from '../engine/physics.js';
import { project, screenRadius, setCamera } from '../engine/stage.js';
import { mesh, geo, basic } from '../engine/toon.js';
import { makeProp, makeBit, PROP_NAME, splashCrown, zoneIds, makeRainCloud, makeRainbow } from './where-props.js';

const SPAWN = new T.Vector3(0.6, 0, 3.6);
const L = -3.4, R = 3.2;

// Who can be placed or can watch. size = scale; call = their sound.
const CAST = {
  crab: { name: 'Crab', make: () => makeCrab(), size: 1, call: 'squeak' },
  baby: { name: 'Baby Crab', make: () => makeCrab(0xff9f3f), size: 0.7, call: 'cheep' },
  duck: { name: 'Duck', make: () => makeDuck(1.6), size: 1.6, call: 'quack' },
  gull: { name: 'Gull', make: () => makeGull(), size: 1, call: 'gull' },
};

// The little story of each round: the caption line ({who} = the friend), and the gag that plays after a right answer.
const STORY = {
  swim: { line: 'Swim time!' },
  look: { line: 'Sea view!' },
  sleep: { line: 'Sleepy!' },
  picnic: { line: 'Picnic!' },
  sun: { line: 'So hot!' },
  rain: { line: 'Rain!' },
  hide: { line: 'Hide!' },
  treasure: { line: 'Treasure!' },
  sail: { line: 'Sail away!' },
  ball: { line: 'Ball game!' },
  float: { line: 'Splash!' },
};

// Each round: want, story, props [[kind, mode, x]], who (placed), pal (watches and joins in), bits (loose things), twist.
// Every round's zones have unique ids (in/on/under), so zones() never offers two "on"s.
// Level 1: the crab family on the sand, one place at a time. Level 2: Duck and Gull's beach day, two places.
// Level 3: the treasure cove, two places that each offer two spots (exact place counts), and a swap at the end.
const PLANS = [
  [
    { want: 'in', story: 'swim', props: [['bucket', 'up', 2.6]], bits: ['shell', 'shell', 'star'] },
    { want: 'on', story: 'look', props: [['castle', null, -2.4]], pal: 'gull', bits: ['shell', 'star'] },
    { want: 'in', story: 'float', props: [['ring', null, 2.4]], who: 'baby', pal: 'crab', bits: ['ball'] },
    { want: 'on', story: 'sleep', props: [['towel', null, -2.2]], bits: ['shell', 'shell'] },
    { want: 'in', story: 'picnic', props: [['basket', null, 2.4]], pal: 'baby', bits: ['melon'] },
    { want: 'on', story: 'sun', props: [['chair', null, -2.2]], pal: 'gull', bits: ['ball', 'star'] },
  ],
  [
    { want: 'under', story: 'rain', props: [['umbrella', null, L], ['bucket', 'up', R]], who: 'duck', bits: ['ball'] },
    { want: 'in', story: 'sail', props: [['castle', null, L], ['boat', null, R]], pal: 'gull', bits: ['shell', 'star'] },
    { want: 'on', story: 'look', props: [['box', 'open', L], ['chest', 'shut', R]], who: 'gull', bits: ['shell', 'shell'] },
    { want: 'under', story: 'sun', props: [['ring', null, L], ['chair', null, R]], pal: 'baby', bits: ['ball'] },
    { want: 'in', story: 'sleep', props: [['box', 'open', L], ['towel', null, R]], who: 'duck', bits: ['star', 'shell'] },
    { want: 'under', story: 'hide', props: [['basket', null, L], ['hat', null, R]], pal: 'gull', bits: ['melon', 'shell'] },
  ],
  [
    { want: 'under', story: 'hide', props: [['bucket', 'down', L], ['ring', null, R]], pal: 'gull', bits: ['coin', 'shell'] },
    { want: 'on', story: 'look', props: [['umbrella', null, L], ['basket', null, R]], who: 'gull', bits: ['star', 'coin'] },
    { want: 'in', story: 'treasure', props: [['chair', null, L], ['chest', 'open', R]], who: 'baby', pal: 'crab', bits: ['coin', 'coin'] },
    { want: 'under', story: 'rain', props: [['boat', null, L], ['box', 'shut', R]], who: 'duck', bits: ['shell', 'ball'] },
    { want: 'on', story: 'ball', props: [['hat', null, L], ['bucket', 'up', R]], pal: 'baby', bits: ['ball', 'coin'] },
    { want: 'in', story: 'sail', props: [['boat', null, L], ['bucket', 'down', R]], twist: 'swap', pal: 'duck', bits: ['shell', 'coin'] },
  ],
];
const WORD = { in: 'In', on: 'On', under: 'Under' };

export default class WhereLesson extends Lesson {
  build() {
    // closer in: the props and the friend are big, the sand in front is used
    setCamera(new T.Vector3(0, 3.2, 12.6), new T.Vector3(0, 1.8, 0));
    this.pip.position.set(-6.5, 0, -0.8);
    this.plan = PLANS[this.level];
    this.props = [];
    this.zoneList = [];
    this.bits = [];
    this.drops = [];
    this.statics = []; // this round's static colliders (props' surfaces); swapped per round, never physics.clear()
  }

  zones() {
    return this.zoneList.filter((z) => z.enabled !== false).map((z) => ({ ...z, pos: z.pos() }));
  }

  nudgeTarget() { return this.drag && !this.busy ? this.char : null; }
  target() { return this.plan[this.round]?.want; }
  wantZone() { return this.zoneList.find((q) => q.id === this.target()); }

  // ---- physics helpers ----
  // Loose bit thrown in from the sky so it lands at `to`, bouncing and tumbling.
  tossBit(kind, to, { from = null, delay = 0, arc = 1.5, time = 0.55 } = {}) {
    const b = makeBit(kind);
    b.position.copy(from || new T.Vector3(to.x + (Math.random() - 0.5) * 3, 8.5 + Math.random(), to.z - 1));
    b.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    this.root.add(b);
    this.bits.push(b);
    b.visible = false;
    this.s.wait(delay).then(() => {
      if (!b.parent) return;
      b.visible = true;
      physics.toss(b, to, { arc, time, shape: b.userData.shape, r: b.userData.r ?? undefined, bounce: kind === 'ball' ? 0.7 : 0.4 });
    });
    return b;
  }

  clearBits() {
    for (const b of this.bits) { physics.remove(b); popOut(this.s, b, 0.15).then(() => this.root.remove(b)); }
    this.bits = [];
  }

  // Static shapes for the props, so bits land on and in them. Each round removes the last round's shapes one by one
  // (never physics.clear(): that would freeze anything still flying).
  addStatics(p) {
    for (const d of p.userData.phys || []) {
      if (d.box) this.statics.push(physics.box(p.localToWorld(new T.Vector3(...d.box)), new T.Vector3(...d.size), p.rotation.y));
      else if (d.cont) this.statics.push(physics.container(p.localToWorld(new T.Vector3(...d.cont)), { r: d.r, h: d.h }));
    }
  }
  dropStatics() { for (const b of this.statics) physics.removeStatic(b); this.statics = []; }

  setProps(spec) {
    for (const p of this.props) popOut(this.s, p, 0.18).then(() => this.root.remove(p));
    this.props = [];
    this.zoneList = [];
    spec.props.forEach(([kind, mode, x], i) => {
      const p = makeProp(kind, mode);
      p.position.set(x, 2.6 + i * 0.9, 0);
      p.rotation.y = x < 0 ? 0.12 : -0.12;
      this.root.add(p);
      p.visible = false;
      this.props.push(p);
      // it drops onto the sand and bounces (rigid body, kept upright)
      this.s.wait(0.05 + i * 0.12).then(() => {
        if (!p.parent) return;
        p.visible = true;
        sfx.whoosh();
        physics.add(p, { shape: 'box', spin: false, bounce: 0.32, friction: 1 });
      });
      for (const [id, z] of Object.entries(p.userData.zones)) {
        this.zoneList.push({
          id, prop: kind, obj: p, def: z, radius: z.radius,
          pos: () => p.localToWorld(z.pos.clone()),
          rest: () => p.localToWorld(z.rest.clone()),
        });
      }
    });
  }

  // after the drop: freeze the props exactly on the sand and give them static colliders
  settleProps() {
    for (const p of this.props) {
      physics.remove(p);
      p.visible = true;
      this.s.tween(p.position, { y: 0 }, 0.08);
      p.updateMatrixWorld(true);
    }
  }

  spawnChar(who, at) {
    const c = CAST[who];
    const g = c.make();
    g.userData.baseScale = g.scale.x;
    g.userData.who = who;
    g.position.copy(at);
    this.root.add(g);
    const ud = g.userData;
    // crab legs aren't in the model contract: use them if published, else find the thin low cylinders
    ud.legs = ud.legs || (ud.kind === 'crab' ? g.children.filter((m) => m.isMesh && m.geometry?.type === 'CylinderGeometry' && m.position.y < 0.4) : []);
    for (const l of ud.legs) l.userData.rx0 = l.rotation.x;
    ud.eyeQ = (ud.eyes || []).map((e) => e.quaternion.clone());
    for (const w of [...(ud.wings || []), ...(ud.claws || [])]) w.userData.r0 = w.rotation.clone();
    return g;
  }

  async startRound(r) {
    this.busy = true;
    const spec = this.plan[r];
    this.spec = spec;
    this.clearBits();
    this.stopStory();
    this.dropStatics();
    this.setProps(spec);
    const want = spec.want;
    // Level 1: only the place we want is live
    for (const z of this.zoneList) z.enabled = this.level > 0 || z.id === want;
    // the pal watches from the back of the beach
    if (this.pal) { this.root.remove(this.pal); this.pal = null; }
    if (spec.pal) {
      const pal = this.spawnChar(spec.pal, new T.Vector3(7.0, 0, -1.0));   // clear of the right-hand prop
      pal.rotation.y = -0.4;
      this.pal = pal;
      popIn(this.s, pal, pal.userData.baseScale, 0.4, { sound: false });
      this.s.wait(0.3).then(() => sfx[CAST[spec.pal].call]());
    }
    // the one to place walks (crabs scuttle) in along the sand from the right while the props land
    const who = spec.who || 'crab';
    const ch = this.spawnChar(who, new T.Vector3(8.5, 0, SPAWN.z));
    ch.rotation.y = who === 'crab' || who === 'baby' ? 0 : -0.9;
    this.char = this.crab = ch;
    sfx.patter();
    await this.s.anim(0.8, (e) => { ch.position.x = 8.5 + (SPAWN.x - 8.5) * e; }, Ease.out);
    this.s.tween(ch.rotation, { y: 0 }, 0.2);
    sfx[CAST[who].call]();
    await this.wait(0.05);
    this.settleProps();
    if (spec.twist === 'swap') {
      // the two things swap places first — watch carefully!
      const [a, b] = this.props;
      const xa = a.position.x, xb = b.position.x;
      sfx.whoosh();
      this.s.anim(0.7, (e) => { a.position.x = xa + (xb - xa) * e; b.position.x = xb + (xa - xb) * e; a.position.z = Math.sin(e * Math.PI) * 1.2; b.position.z = -Math.sin(e * Math.PI) * 1.2; }, Ease.inOut);
      await this.wait(0.72);
      for (const p of this.props) p.updateMatrixWorld(true);
    }
    for (const p of this.props) this.addStatics(p);
    this.dropBits(spec);
    this.startStory(spec);
    this.drag = input.addDrag(ch, {
      radius: 1.1 * CAST[who].size, minY: 0, offset: new T.Vector3(0, 0.6, 0),
      zones: () => this.zones(),
      onPick: () => this.onPick(),
      onMove: (_t, z) => this.onHover(z),
      onDrop: (z, info) => this.drop(z, info),
    });
    this.busy = false;
    this.cue();
  }

  // loose bits rain in: the first ones into a container (if there is one), the rest onto the sand
  dropBits(spec) {
    const cont = this.props.find((p) => p.userData.phys?.some((d) => d.cont));
    (spec.bits || []).forEach((kind, i) => {
      let to;
      if (cont && i < 2 && kind !== 'ball') {
        to = cont.localToWorld(new T.Vector3((i - 0.5) * 0.5, 0.6, 0));
        const b = this.tossBit(kind, to, { delay: 0.05 + i * 0.12 });
        b.userData.inside = cont;
      } else {
        const side = this.props.length === 1 ? -Math.sign(this.props[0].position.x || 1) : (i % 2 ? 1 : -1);
        to = new T.Vector3(side * (1.2 + i * 0.9) + 0.4, 0.3, 1.8 + (i % 2) * 0.6);
        this.tossBit(kind, to, { delay: 0.05 + i * 0.12 });
      }
    });
  }

  onPick() {
    const ch = this.char, base = ch.userData.baseScale;
    this.carrying = true;
    sfx[CAST[ch.userData.who].call]();
    this.s.tween(ch.scale, { x: base * 1.12, y: base * 1.12, z: base * 1.12 }, 0.15, Ease.back);
  }

  // a little hello from the prop when the friend is carried over it
  onHover(z) {
    const id = z ? z.obj.uuid : null;
    if (id === this.hoverId) return;
    this.hoverId = id;
    if (!z) return;
    sfx.tick();
    const w = z.obj.userData.wobble;
    if (w) this.s.anim(0.25, (_, p) => { const k = Math.sin(p * Math.PI) * 0.06; w.scale.set(1 + k, 1 - k, 1 + k); }).then(() => w.scale.setScalar(1));
  }

  promptText() {
    const spec = this.plan[this.round];
    if (!spec) return '';
    const p = spec.props.find(([k, m]) => zoneIds(k, m).includes(spec.want));
    const who = CAST[spec.who || 'crab'].name;
    const thing = PROP_NAME[p[0]];   // short words keep one line
    const line = (STORY[spec.story]?.line || `${WORD[spec.want]}!`).replace('{who}', who);
    // one short line (two-line bubbles covered heads): the story bit only when it fits
    const core = `${who} ${spec.want.toUpperCase()} the ${thing}!`;
    return line.length + core.length < 29 ? `${line} ${core}` : core;
  }

  goHome() {
    const ch = this.char, base = ch.userData.baseScale;
    this.carrying = false;
    this.arc(ch, SPAWN, 0.8, 0.4).then(() => sfx.land());
    this.s.tween(ch.scale, { x: base, y: base, z: base }, 0.3);
  }

  // A ballistic hop (constant gravity: straight-line ground speed plus a parabola), then a squashy landing.
  async arc(obj, to, apex = 1, dur = 0.4) {
    const from = obj.position.clone();
    const top = Math.max(0, Math.max(from.y, to.y) + apex - (from.y + to.y) / 2);
    await this.s.anim(dur, (_, t) => {
      obj.position.lerpVectors(from, to, t);
      obj.position.y += 4 * top * t * (1 - t);
    });
    obj.position.copy(to);
  }
  async squash(obj, amt = 0.25, dur = 0.16) {
    const base = obj.userData.baseScale ?? 1;
    await this.s.anim(dur, (_, p) => { const k = 1 - Math.sin(p * Math.PI) * amt; obj.scale.set(base / Math.sqrt(k), base * k, base / Math.sqrt(k)); });
    obj.scale.setScalar(base);
  }

  async drop(zone, { tapped }) {
    const ch = this.char;
    this.hoverId = null;
    if (!zone) { this.goHome(); if (tapped) { sfx[CAST[ch.userData.who].call](); wiggle(this.s, ch, 0.3); } return; }
    const want = this.target();
    const wz = this.wantZone();
    // Level 2: dropping anywhere on the right thing counts; Level 3 needs the exact place
    const ok = zone.id === want || (this.level === 1 && zone.prop === wz.prop);
    if (!ok) {
      this.goHome();
      const w = zone.obj.userData.wobble;
      if (w) wiggle(this.s, w, 0.12, 0.4);
      this.redirect(`That's ${zone.id}. Find ${want}!`);
      return;
    }
    input.remove(this.drag);
    this.busy = true;
    this.carrying = false;
    const rest = wz.rest();
    const fit = wz.def.fit ?? 1;   // a container's friend shrinks a little to sit inside cleanly
    const base = ch.userData.baseScale;
    this.s.tween(ch.scale, { x: base * fit, y: base * fit, z: base * fit }, 0.2);
    let gag;
    if (want === 'in') {
      const rimY = wz.obj.position.y + (wz.def.rim ?? 1);
      wz.obj.userData.flop?.(this.s);
      // the treasure on top jumps out to make room (the story payoff throws coins out of the chest)
      for (const c of wz.obj.userData.coins || []) this.s.wait(0.3).then(() => popOut(this.s, c, 0.15));
      await this.arc(ch, rest, Math.max(0.6, rimY + 0.8 - rest.y), 0.38);
      sfx.thunk();
      this.bumpBits(wz.obj);
      this.squash(ch, 0.3);
      gag = this.gagIn(wz, rest);
    } else if (want === 'on') {
      await this.arc(ch, rest, 0.9, 0.36);
      sfx.land();
      gag = this.gagOn(rest);
    } else {
      gag = this.gagUnder(wz, rest);
      await this.wait(0.4);
    }
    this.busy = false;
    this.success(rest.clone().add(new T.Vector3(0, 1.6, 0)), `${WORD[want]}!`);
    this.palJoins(wz, rest);
    this.storyPayoff(wz, rest);
    await gag;
  }

  // things sitting in the container get knocked out by the landing friend
  bumpBits(prop) {
    for (const b of this.bits) {
      if (b.userData.inside !== prop || !physics.has(b)) continue;
      const dir = b.position.x >= prop.position.x ? 1 : -1;
      physics.impulse(b, { x: dir * (1.5 + Math.random()), y: 7 + Math.random() * 1.5, z: 1.2 + Math.random() }, { x: Math.random() - 0.5, y: 0, z: Math.random() - 0.5 });
      b.userData.inside = null;
    }
  }

  // ---- gags (each ≤ ~0.9 s) ----
  gagIn(z, rest) {
    const ch = this.char, s = this.s, base = ch.userData.baseScale * (z.def.fit ?? 1);
    const rimY = z.obj.position.y + (z.def.rim ?? 1);
    const wet = ['swim', 'float', 'sail'].includes(this.spec.story);
    if (wet) splashCrown(s, this.root, new T.Vector3(rest.x, rimY, rest.z), 1.0);
    else { sfx.pop(); fx.float(new T.Vector3(rest.x, rimY + 1.2, rest.z), '♪', { color: '#ff7a59', size: 5 }); }
    if (z.obj.userData.spin) { // the swim ring spins round with the friend in it
      const r0 = z.obj.rotation.y;
      s.anim(0.8, (e) => { z.obj.rotation.y = r0 + e * Math.PI * 2; ch.rotation.y = e * Math.PI * 2; }, Ease.inOut).then(() => { z.obj.rotation.y = r0; ch.rotation.y = 0; });
    }
    // bob up, blink, settle back
    return s.anim(0.8, (_, p) => {
      ch.position.y = rest.y + Math.sin(p * Math.PI * 2) * 0.25 * (1 - p);
      const k = 1 + Math.sin(p * Math.PI * 3) * 0.1 * (1 - p);
      ch.scale.set(base / Math.sqrt(k), base * k, base / Math.sqrt(k));
    }).then(() => { ch.scale.setScalar(base); ch.position.y = rest.y; });
  }

  gagOn(rest) {
    const ch = this.char, s = this.s, base = ch.userData.baseScale, ud = ch.userData;
    sfx.boing();
    // land squash, wobble wobble (balancing!)… then claws up: ta-da!
    const claws = ud.claws || ud.wings || [];
    const c0 = claws.map((c) => c.rotation.z);
    s.wait(0.55).then(() => { sfx.twinkle(); fx.float(rest.clone().add(new T.Vector3(0, 2.2 * base, 0)), '✨', { color: '#ffb020', size: 6 }); });
    return s.anim(0.85, (_, p) => {
      const sq = p < 0.15 ? 1 - Math.sin((p / 0.15) * Math.PI) * 0.25 : 1;
      ch.scale.set(base / Math.sqrt(sq), base * sq, base / Math.sqrt(sq));
      ch.rotation.z = p < 0.6 ? Math.sin(p * Math.PI * 5) * 0.3 * (1 - p / 0.6) : 0;
      ch.position.x = rest.x - ch.rotation.z * 0.3;
      const up = p > 0.55 ? Ease.back(Math.min(1, (p - 0.55) / 0.2)) : 0;
      claws.forEach((c, i) => { c.rotation.z = c0[i] + (i ? -1 : 1) * up * 0.8; });
      if (p > 0.55) ch.position.y = rest.y + Math.sin(Math.min(1, (p - 0.55) / 0.3) * Math.PI) * 0.3;
    }).then(() => { ch.rotation.z = 0; ch.scale.setScalar(base); ch.position.copy(rest); claws.forEach((c, i) => (c.rotation.z = c0[i])); });
  }

  async gagUnder(z, rest) {
    const ch = this.char, s = this.s, base = ch.userData.baseScale, ud = ch.userData;
    const cover = z.obj.userData.cover;
    await cover.lift(s);
    sfx.patter();
    await s.tween(ch.position, { x: rest.x, y: rest.y, z: rest.z }, 0.2, Ease.inOut);
    // squash down low (and small enough to fit right under it), so only the eyes will show
    const fit = z.def.fit ?? 1;
    s.tween(ch.scale, { x: base * fit, y: base * 0.62 * fit, z: base * fit }, 0.12);
    await cover.drop(s);
    // anything resting near the prop jumps from the thump
    for (const b of this.bits) if (physics.has(b) && b.position.distanceTo(z.obj.position) < 3) physics.poke(b, 0.6);
    // nudge forward and peek out
    const fwd = cover.hides ? (ud.eyes ? 0.75 : 0.45) : 0.5;
    s.tween(ch.position, { z: rest.z + fwd }, 0.15, Ease.out);
    await cover.tip(s);
    sfx.pop();
    const eyes = ud.eyes || [];
    const ey = eyes.map((e) => e.scale.y);
    await s.anim(0.45, (_, p) => {
      // blink twice and glance left, right
      const b = Math.abs(Math.sin(p * Math.PI * 2));
      eyes.forEach((e, i) => { e.scale.y = ey[i] * (p < 0.4 ? Math.max(0.15, 1 - b * 0.9) : 1); e.rotation.y = p > 0.4 ? Math.sin((p - 0.4) / 0.6 * Math.PI * 2) * 0.6 : 0; });
      if (ud.head && !eyes.length) ud.head.rotation.y = Math.sin(p * Math.PI * 2) * 0.5;
    });
    eyes.forEach((e, i) => { e.scale.y = ey[i]; e.rotation.y = 0; });
    sfx.giggle();
  }

  // ---- the round's little story: a set-up beat when the round starts, a payoff after the right answer ----
  startStory(spec) {
    const k = spec.story;
    const wz = this.wantZone();
    if (!wz) return;
    const at = wz.obj.position;
    if (k === 'rain') {
      // a grumpy little cloud drizzles over the beach until everyone is under cover
      const cloud = makeRainCloud();
      if (cloud.userData.model?.userData.face) setFace(cloud.userData.model.userData.face, 'angry');
      cloud.position.set(0, 5.0, -0.5);
      this.root.add(cloud);
      popIn(this.s, cloud, 1.2, 0.4, { sound: false });
      sfx.thunder?.();
      this.rain = { cloud, acc: 0 };
    } else if (k === 'sun') {
      this.storyTimer = this.s.every(1.3, () => {
        if (this.char) fx.float(this.char.position.clone().add(new T.Vector3(0.5, 1.4, 0)), '💦', { size: 4 });
      });
      fx.float(new T.Vector3(at.x, 5.5, 0), '☀️', { size: 9 });
    } else if (k === 'hide' && this.pal) {
      // the seeker turns around and counts
      const pal = this.pal;
      this.s.tween(pal.rotation, { y: Math.PI }, 0.3, Ease.out);
      this.storyTimer = this.s.every(0.9, () => { sfx.tick(); fx.float(pal.position.clone().add(new T.Vector3(0, 2, 0)), '🙈', { size: 4.5 }); });
    } else if (k === 'sleep') {
      fx.float(this.char.position.clone().add(new T.Vector3(0.5, 1.6, 0)), '🥱', { size: 5 });
      sfx.aww();
    } else if (k === 'picnic' || k === 'treasure') {
      fx.float(new T.Vector3(at.x, 3.2, at.z), k === 'picnic' ? '🍉' : '💰', { size: 7 });
      sfx.twinkle();
    } else if (k === 'ball') {
      fx.float(new T.Vector3(at.x, 3.6, at.z), '⚽', { size: 6 });
    }
  }

  stopStory() {
    if (this.storyTimer) { this.storyTimer(); this.storyTimer = null; }
    if (this.rain) {
      const c = this.rain.cloud;
      this.rain = null;
      const face = c.userData.model?.userData.face;
      if (face) setFace(face, 'happy');   // all done raining: it cheers up and floats away
      this.s.tween(c.position, { x: c.position.x + 12, y: c.position.y + 0.8 }, 0.8, Ease.in).then(() => this.root.remove(c));
    }
  }

  storyPayoff(z, rest) {
    const k = this.spec.story, s = this.s;
    const hadRain = !!this.rain;
    this.stopStory();
    if (k === 'rain' && hadRain) {
      // the cloud blows away and a rainbow pops up
      const bow = makeRainbow();
      bow.position.set(rest.x, 0.9, -2.5);
      this.root.add(bow);
      sfx.sparkle();
      popIn(s, bow, 1, 0.4, { sound: false });
      this.storyObj = bow;
    } else if (k === 'sun') {
      sfx.aww();
      fx.float(rest.clone().add(new T.Vector3(0.6, 1.8, 0)), '😎', { size: 6 });
    } else if (k === 'hide' && this.pal) {
      const pal = this.pal;
      this.s.tween(pal.rotation, { y: -0.4 }, 0.25, Ease.out);
      s.wait(0.3).then(() => { sfx.gasp(); fx.float(rest.clone().add(new T.Vector3(0, 1.3, 0.8)), '👀', { size: 6 }); });
    } else if (k === 'sleep') {
      const eyes = this.char.userData.eyes || [];
      const ey = eyes.map((e) => e.scale.y);
      s.wait(0.25).then(() => {
        eyes.forEach((e) => (e.scale.y *= 0.15));
        [0, 0.25, 0.5].forEach((d, i) => s.wait(d).then(() => { sfx.mmm(); fx.float(rest.clone().add(new T.Vector3(0.4 + i * 0.3, 1.2 + i * 0.3, 0)), 'z', { color: '#6a7bff', size: 4 + i * 1.5 }); }));
        return s.wait(0.6);
      }).then(() => eyes.forEach((e, i) => (e.scale.y = ey[i])));
    } else if (k === 'picnic') {
      // snacks get thrown into the basket
      ['melon', 'sandwich'].forEach((b, i) => {
        const to = z.obj.localToWorld(new T.Vector3((i - 0.5) * 0.9, 0.8, 0.2));
        this.tossBit(b, to, { from: new T.Vector3(-7 + i, 2.5, 2), delay: 0.1 + i * 0.15, arc: 2, time: 0.5 });
      });
      s.wait(0.6).then(() => sfx.chomp());
    } else if (k === 'treasure') {
      // gold coins jump out of the chest
      sfx.sparkle();
      for (let i = 0; i < 6; i++) {
        const from = z.obj.localToWorld(new T.Vector3((i - 2.5) * 0.25, 1.2, 0));
        const to = z.obj.localToWorld(new T.Vector3((i - 2.5) * 0.7, 0.2, 1.5 + (i % 2) * 0.5));
        this.tossBit('coin', to, { from, delay: i * 0.05, arc: 2.5, time: 0.5 });
      }
    } else if (k === 'ball') {
      // a beach ball bounces onto the hat and boings off
      const to = rest.clone().add(new T.Vector3(0.4, 1.2, 0));
      this.tossBit('ball', to, { from: new T.Vector3(-8, 3, 2), delay: 0.15, arc: 2, time: 0.45 });
      s.wait(0.6).then(() => sfx.boing());
    } else if (k === 'sail') {
      // the boat rocks off a little way with its sailor, toot toot
      const boat = z.obj, ch = this.char, x0 = boat.position.x, cx = ch.position.x;
      sfx.trumpetHi?.();
      s.anim(0.85, (_, p) => {
        const dx = Math.sin(p * Math.PI) * 0.9;
        boat.position.x = x0 + dx; ch.position.x = cx + dx;
        boat.rotation.z = Math.sin(p * Math.PI * 4) * 0.08; ch.rotation.z = boat.rotation.z;
      }).then(() => { boat.position.x = x0; ch.position.x = cx; boat.rotation.z = 0; ch.rotation.z = 0; });
    } else if (k === 'look') {
      s.wait(0.3).then(() => fx.float(rest.clone().add(new T.Vector3(-1, 2.6, 0)), '⛵', { size: 6 }));
    }
    // everyone loose on the sand does a happy hop
    s.wait(0.35).then(() => { for (const b of this.bits) if (physics.has(b) && Math.random() < 0.6) physics.poke(b, 0.5); });
  }

  // the watching friend hops over to join in
  palJoins(z, rest) {
    const pal = this.pal;
    if (!pal) return;
    const s = this.s, who = pal.userData.who;
    const side = rest.x > 0 ? -1 : 1;
    const to = new T.Vector3(rest.x + side * 2.0, 0, rest.z + 1.3);   // beside the prop, never inside it
    if (z.id === 'on') to.set(rest.x + side * 1.9, 0, z.obj.position.z + 1.6);
    s.wait(0.15).then(() => {
      sfx[CAST[who].call]();
      const from = pal.position.clone();
      // hop round the front of the props (a curve through the open sand), never through them
      const ctl = new T.Vector3((from.x + to.x) / 2, 0, 4.4);
      pal.rotation.y = to.x < from.x ? -0.6 : 0.6;
      s.anim(0.55, (e, p) => {
        const u = 1 - e;
        pal.position.set(u * u * from.x + 2 * u * e * ctl.x + e * e * to.x, Math.abs(Math.sin(p * Math.PI * 3)) * 0.5, u * u * from.z + 2 * u * e * ctl.z + e * e * to.z);
      }, Ease.inOut).then(() => { pal.position.y = 0; pal.rotation.y = side > 0 ? -0.3 : 0.3; sfx.land(); hop(s, pal, 0.4, 0.3); });
    });
  }

  // Off they go: anyone up on (or in, or under) a prop hops down onto the sand first, then they walk / scuttle away
  // along the beach to the left (the motion layer gives each its gait); the next round starts while they leave.
  async afterSuccess() {
    const ch = this.char, pal = this.pal;
    this.pal = null;
    if (this.storyObj) { const o = this.storyObj; this.storyObj = null; popOut(this.s, o, 0.25).then(() => this.root.remove(o)); }
    for (const p of this.props) p.userData.cover?.reset();
    sfx.patter();
    const hops = [];
    for (const g of [ch, pal]) {
      if (!g) continue;
      const base = g.userData.baseScale;
      g.rotation.set(0, 0, 0);
      const ground = new T.Vector3(g.position.x, 0, Math.max(g.position.z, 1.9));
      if (g.position.y > 0.05 || g.position.z < 1.8) {
        this.s.tween(g.scale, { x: base, y: base, z: base }, 0.3);
        hops.push(this.arc(g, ground, 0.7, 0.3).then(() => sfx.land()));
      } else g.scale.setScalar(base);
    }
    await Promise.all(hops);
    for (const g of [ch, pal]) {
      if (!g) continue;
      const crab = g.userData.who === 'crab' || g.userData.who === 'baby';
      g.rotation.y = crab ? 0 : -Math.PI / 2 + 0.35;   // birds face the way they walk; crabs scuttle sideways
      const x0 = g.position.x, d = x0 + 12;
      this.s.anim(d / 9, (e) => { g.position.x = x0 - d * e; }).then(() => this.root.remove(g));
    }
  }

  // tapping a loose shell / ball / coin makes it jump
  pokeAt(x, y) {
    if (super.pokeAt(x, y)) return true;
    let best = null, bd = Infinity;
    const wp = new T.Vector3();
    for (const b of this.bits) {
      if (!physics.has(b)) continue;
      b.getWorldPosition(wp);
      const c = project(wp);
      const r = Math.max(screenRadius(wp, 0.5), Math.min(innerWidth, innerHeight) * 0.06);
      const d = Math.hypot(c.x - x, c.y - y) / r;
      if (d < 1 && d < bd) { bd = d; best = b; }
    }
    if (!best) return false;
    physics.poke(best, 1);
    if (best.userData.bit === 'ball') sfx.boing(); else if (best.userData.bit === 'coin') sfx.twinkle(); else sfx.bloop(Math.floor(Math.random() * 4));
    return true;
  }

  // ---- alive while carried: legs paddle, claws snap, eyes look at the nearest thing ----
  update(dt, t) {
    // rain from the story cloud
    if (this.rain) {
      const c = this.rain.cloud;
      c.position.x = Math.sin(t * 0.6) * 2.5;
      this.rain.acc += dt;
      while (this.rain.acc > 0.06) {
        this.rain.acc -= 0.06;
        const d = makeWaterDrop(0.075, 0x7fb8ff);
        d.position.set(c.position.x + (Math.random() - 0.5) * 2.6, c.position.y - 0.5, c.position.z + Math.random() * 2);
        this.root.add(d);
        this.drops.push(d);
      }
    }
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const d = this.drops[i];
      d.position.y -= dt * 9;
      if (d.position.y < 0.05) { this.root.remove(d); this.drops.splice(i, 1); }
    }
    const ch = this.char;
    if (!ch || !ch.parent) return;
    const ud = ch.userData;
    const carrying = this.carrying && input.dragging();
    for (const l of ud.legs || []) l.rotation.x = l.userData.rx0 + (carrying ? Math.sin(t * 22 + l.position.z * 9) * 0.6 : 0);
    if (carrying) {
      for (const [i, c] of (ud.claws || []).entries()) c.rotation.x = c.userData.r0.x + Math.sin(t * 14 + i * 2) * 0.3;
      if (ud.wings) ud.wings.forEach((w, i) => { w.rotation.z = w.userData.r0.z + (i ? -1 : 1) * Math.sin(t * 18) * 0.5; });
      this.wasCarrying = true;
    } else if (this.wasCarrying) {
      this.wasCarrying = false;
      for (const w of [...(ud.wings || []), ...(ud.claws || [])]) { w.rotation.x = w.userData.r0.x; w.rotation.z = w.userData.r0.z; }
    }
    // look at the nearest prop
    let near = null, nd = Infinity;
    if (carrying) for (const p of this.props) { const d = p.position.distanceTo(ch.position); if (d < nd) { nd = d; near = p; } }
    const look = near ? near.localToWorld(new T.Vector3(0, 1.2, 0)) : null;
    const k = Math.min(1, dt * 10);
    (ud.eyes || []).forEach((e, i) => {
      if (look) {
        const q0 = e.quaternion.clone();
        e.lookAt(look);
        const q1 = e.quaternion.clone();
        e.quaternion.copy(q0).slerp(q1, k);
      } else if (ud.eyeQ?.[i]) e.quaternion.slerp(ud.eyeQ[i], k);
    });
    if (!ud.eyes && ud.head) {
      const yaw = look ? Math.atan2(look.x - ch.position.x, 3) : 0;
      ud.head.rotation.y += (yaw - ud.head.rotation.y) * k;
    }
    // the boat rocks on its puddle
    for (const p of this.props) if (p.userData.rock) p.userData.rock.rotation.z = Math.sin(t * 1.8) * 0.04;
  }

  showHint(glow = true) {
    const z = this.wantZone();
    if (!z || !this.char) return;
    const at = z.pos();
    if (glow) {
      const anchor = new T.Object3D();
      anchor.position.copy(at);
      this.root.add(anchor);
      this.addHalo(anchor, 1.2);
    }
    fx.ghostPath([this.char.position.clone().add(new T.Vector3(0, 0.6, 0)), at], { mode: 'drag' });
  }

  // Level 3 demo: show "pick it up and move", without showing where
  demoL3() {
    if (!this.char) return;
    const p = this.char.position.clone().add(new T.Vector3(0, 0.6, 0));
    fx.ghostPath([p, p.clone().add(new T.Vector3(0, 1.8, 0))], { mode: 'drag' });
  }

  makeErrorless() {
    const want = this.wantZone();
    for (const z of this.zoneList) if (z !== want) z.enabled = false;
    for (const p of this.props) if (p !== want.obj) this.s.tween(p.scale, { x: 0.6, y: 0.6, z: 0.6 }, 0.4);
  }

  onFinale() {
    // Crab shows off on every spot that's left: in, on, under
    this.stopStory();
    const crab = this.spawnChar('crab', SPAWN.clone());
    for (const p of this.props) { p.userData.cover?.reset(); p.scale.setScalar(1); }
    (async () => {
      await this.wait(1.2);
      let i = 0;
      for (const z of this.zoneList) {
        const r = z.rest();
        const under = z.id === 'under';
        const k = z.def.fit ?? 1;
        this.s.tween(crab.scale, { x: k, y: k, z: k }, 0.3);
        await this.arc(crab, r.clone().add(new T.Vector3(0, 0, under ? 0.9 : 0)), under ? 0.6 : 1.4, 0.45);
        sfx.note(i++ * 2);
        await this.wait(0.3);
      }
      hop(this.s, crab, 0.8, 0.45, { sound: true });
    })();
  }
}
