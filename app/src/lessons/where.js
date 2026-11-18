// Game 7 — Where's Crab? Topics mt_qeZYF6HZ4o "Positional language" and mt_VY3rBq8RyP "Prepositions".
// Drag a beach friend IN, ON or UNDER a beach thing. Every round is a tiny story ("Rain!", "Sleepy!") with its own
// place: bucket, sandcastle, swim ring, towel, picnic basket, deck chair, umbrella, boat, treasure chest, box, sun hat.
// She hears the word as it happens ("Under the umbrella!"); a wrong place is named back to her ("Oops, that's ON!")
// before the instruction again. Her work stays: after each round the place she used glides to the back of the beach
// with the friend still in, on or under it, so the beach fills up all level; the finale is 10 s of free play (drag the
// friend anywhere: every place says its word), then the photo of the whole beach.
import * as T from '../three.js';
import { Lesson } from '../engine/lesson.js';
import { popIn, popOut, hop, setFace } from '../engine/actors.js';
import { makeCrab, makeDuck, makeGull } from '../engine/beach.js';
import { makeSailboat } from '../engine/scenery.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';
import { physics } from '../engine/physics.js';
import { project, screenRadius, setCamera, camera } from '../engine/stage.js';
import { geo, basic } from '../engine/toon.js';
import { makeProp, makeBit, PROP_NAME, splashCrown, zoneIds, makeRainCloud, makeRainbow, makeSoftDrop } from './where-props.js';

const SPAWN = new T.Vector3(0.6, 0, 4.6);   // the friend's home spot: in front, clear of both props
const L = -2.7, R = 3.2;   // L leaves Pip (x -6.5) room: an open box's flap or the umbrella canopy never reach him
// the places she has used wait at the back of the beach, small, with their friend still in / on / under them
const KEEP_Z = -4.4, KEEP_S = 0.42, KEEP_X = [-4.9, -2.8, -0.7, 1.4, 3.5, 5.6];   // six spots, well behind the play area

// Who can be placed or can watch. size = scale; call = their sound.
const CAST = {
  crab: { name: 'Crab', say: 'the crab', make: () => makeCrab(), size: 1, call: 'squeak' },
  baby: { name: 'Baby Crab', say: 'the baby crab', make: () => { const g = makeCrab(0xff9f3f); g.scale.multiplyScalar(0.72); return g; }, size: 0.7, call: 'cheep' },
  duck: { name: 'Duck', say: 'the duck', make: () => makeDuck(1.6), size: 1.6, call: 'quack' },
  gull: { name: 'Gull', say: 'the gull', make: () => makeGull(), size: 1, call: 'gull' },
};

// The little story of each round: the caption line shown with the round (caption only).
const STORY = {
  swim: { line: 'Swim time!' }, look: { line: 'Sea view!' }, sleep: { line: 'Sleepy!' }, picnic: { line: 'Picnic!' },
  sun: { line: 'So hot!' }, rain: { line: 'Rain!' }, hide: { line: 'Hide!' }, treasure: { line: 'Treasure!' },
  sail: { line: 'Sail away!' }, ball: { line: 'Ball game!' }, float: { line: 'Splash!' },
};

// Each round: want, story, props [[kind, mode, x]], who (placed), pal (the seeker in a hide story), bits (loose things),
// twist. Every round's zones have unique ids (in/on/under), so zones() never offers two "on"s.
// Level 1: the crab family on the sand, one place at a time. Level 2: Duck and Gull's beach day, two places.
// Level 3: the treasure cove, two places that each offer two spots (exact place counts), and a swap at the end.
const PLANS = [
  [
    { want: 'in', story: 'swim', props: [['bucket', 'up', 2.6]], bits: ['shell', 'shell', 'star'] },
    { want: 'on', story: 'look', props: [['castle', null, -2.4]], bits: ['shell', 'star'] },
    { want: 'in', story: 'float', props: [['ring', null, 2.4]], who: 'baby', bits: ['ball'] },
    { want: 'on', story: 'sleep', props: [['towel', null, -2.2]], bits: ['shell', 'shell'] },
    { want: 'in', story: 'picnic', props: [['basket', null, 2.4]], bits: ['melon'] },
    { want: 'on', story: 'sun', props: [['chair', null, -2.2]], bits: ['ball', 'star'] },
  ],
  [
    { want: 'under', story: 'rain', props: [['umbrella', null, L], ['bucket', 'up', R]], who: 'duck', bits: ['ball'] },
    { want: 'in', story: 'sail', props: [['castle', null, L], ['boat', null, R]], bits: ['shell', 'star'] },
    { want: 'on', story: 'look', props: [['box', 'open', L], ['chest', 'shut', R]], who: 'gull', bits: ['shell', 'shell'] },
    { want: 'under', story: 'sun', props: [['ring', null, L], ['chair', null, R]], bits: ['ball'] },
    { want: 'in', story: 'sleep', props: [['box', 'open', L], ['towel', null, R]], who: 'duck', bits: ['star', 'shell'] },
    { want: 'under', story: 'hide', props: [['basket', null, L], ['hat', null, R]], pal: 'gull', bits: ['melon', 'shell'] },
  ],
  [
    { want: 'under', story: 'hide', props: [['bucket', 'down', L], ['ring', null, R]], pal: 'gull', bits: ['coin', 'shell'] },
    { want: 'on', story: 'look', props: [['umbrella', null, L], ['basket', null, R]], who: 'gull', bits: ['star', 'coin'] },
    { want: 'in', story: 'treasure', props: [['chair', null, L], ['chest', 'open', R]], who: 'baby', bits: ['coin', 'coin'] },
    { want: 'under', story: 'rain', props: [['boat', null, -2.6], ['box', 'shut', R]], who: 'duck', bits: ['shell', 'ball'] },
    { want: 'on', story: 'ball', props: [['hat', null, L], ['bucket', 'up', R]], bits: ['ball', 'coin'] },
    { want: 'in', story: 'sail', props: [['boat', null, -2.6], ['bucket', 'down', R]], twist: 'swap', bits: ['shell', 'coin'] },
  ],
];
const WORD = { in: 'In', on: 'On', under: 'Under' };
const placeLine = (id, kind) => `${WORD[id]} the ${PROP_NAME[kind]}!`;

export default class WhereLesson extends Lesson {
  build() {
    // closer in: the props and the friend are big, the sand in front is used
    setCamera(new T.Vector3(0, 3.2, 12.6), new T.Vector3(0, 1.8, 0));
    this.pip.position.set(-6.5, 0, -0.8);
    this.plan = PLANS[this.level];
    this.props = [];
    this.kept = [];      // the places she used, waiting at the back with their friend
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
  tossBit(kind, to, { from = null, delay = 0, arc = 1.5, time = 0.75 } = {}) {
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

  // a bit that landed in a bobbing boat stops simulating and rides on the deck (a child of the boat's bob group)
  stow(b, cont) {
    const ride = cont.userData.ride;
    if (!b.parent || !physics.has(b) || b.userData.inside !== cont || !ride) return;
    const lp = ride.worldToLocal(b.getWorldPosition(new T.Vector3()));
    if (Math.abs(lp.x) > 0.9 || Math.abs(lp.z) > 0.5 || lp.y > 1.2) return;   // bounced out: it stays a loose bit
    const lift = b.position.y - (cont.position.y + cont.userData.deckY);   // how high it rests above the deck collider
    physics.remove(b);
    ride.attach(b);
    b.position.y = cont.userData.zones.in.seat.y + lift;   // the same height above the moving deck
  }
  // a friend IN something that moves by itself (the bobbing boat) becomes its child, so it rides along
  board(ch, z) {
    const ride = z.obj.userData.ride;
    if (!ride || !z.def.seat) return false;
    ride.attach(ch);
    return true;
  }
  unboard(ch) {
    if (!ch || !ch.parent || ch.parent === this.root) return;
    this.root.attach(ch);
    ch.rotation.x = 0; ch.rotation.z = 0;
  }

  clearBits() {
    for (const b of this.bits) { physics.remove(b); popOut(this.s, b, 0.35).then(() => b.parent?.remove(b)); }
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

  // The round's places grow in place on the sand (nothing falls from the sky or hovers). They wait for `after` (the
  // last round's place stepping back out of the way); resolves when they are all there.
  setProps(spec, after = null) {
    for (const p of this.props) if (!this.kept.includes(p)) this.fadeAway(p, 0.4).then(() => this.root.remove(p));
    this.props = [];
    this.zoneList = [];
    const grows = [];
    spec.props.forEach(([kind, mode, x], i) => {
      const p = makeProp(kind, mode);
      // the umbrella is a little smaller when a friend must stand ON it, so its head stays clear of the caption
      const k = kind === 'umbrella' && spec.want === 'on' ? 0.8 : 1;
      p.userData.baseS = k;
      p.position.set(x, 0, 0);
      p.rotation.y = x < 0 ? 0.12 : -0.12;
      p.scale.setScalar(k);
      p.updateMatrixWorld(true);
      p.scale.setScalar(0.001);
      p.visible = false;
      this.root.add(p);
      this.props.push(p);
      grows.push(Promise.resolve(after).then(() => this.wait(i * 0.05)).then(() => {
        if (!p.parent || this.dead) return;
        p.visible = true;
        return this.s.anim(0.28, (_, q) => p.scale.setScalar(Math.max(0.001, k * Ease.back(q))));
      }).then(() => { p.scale.setScalar(k); p.updateMatrixWorld(true); }));
      this.addZones(p);
    });
    return Promise.all(grows);
  }
  addZones(p) {
    for (const [id, z] of Object.entries(p.userData.zones)) {
      this.zoneList.push({
        id, prop: p.userData.prop, obj: p, def: z, radius: z.radius,
        pos: () => p.localToWorld(z.pos.clone()),
        rest: () => p.localToWorld(z.rest.clone()),
        onNear: (k) => this.near(p, k),
      });
    }
  }

  // after the drop: freeze the props exactly on the sand and give them static colliders
  settleProps() { for (const p of this.props) p.updateMatrixWorld(true); }

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
    const propsP = this.setProps(spec, this.clearP);
    this.clearP = null;
    const want = spec.want;
    // Level 1: only the place we want is live
    for (const z of this.zoneList) z.enabled = this.level > 0 || z.id === want;
    // the seeker of a hide-and-seek story watches from the back of the beach
    if (this.pal) { const o = this.pal; this.pal = null; this.fadeAway(o, 0.4).then(() => this.root.remove(o)); }
    if (spec.pal) {
      const night = this.level === 2;
      const pal = this.spawnChar(spec.pal, night ? new T.Vector3(5.8, 0, 0.6) : new T.Vector3(6.4, 0, -1.9));   // clear of the campfire at night
      pal.rotation.y = -0.4;
      this.pal = pal;
      popIn(this.s, pal, pal.userData.baseScale, 0.6, { sound: false });
    }
    // the one to place walks (crabs scuttle) in along the sand from the right while the props land
    const who = spec.who || 'crab';
    // home spot: in front, beside a lone prop (never covering it), centred between two
    this.home = SPAWN.clone();
    if (spec.props.length === 1) {
      const px = spec.props[0][2];
      this.home.x = px - Math.sign(px) * (spec.props[0][0] === 'chair' ? 3.45 : 2.6);   // clear of the prop's side (the big chair is 4 wide)
    }
    const X0 = 6.4;   // just off the right edge at the front of the beach
    const ch = this.spawnChar(who, new T.Vector3(X0, 0, this.home.z));
    ch.rotation.y = who === 'crab' || who === 'baby' ? 0 : -0.9;
    this.char = this.crab = ch;
    const hx = this.home.x;
    // a swap round: the two things swap places while the friend walks in — watch carefully!
    let swapP = null;
    if (spec.twist === 'swap') {
      const [a, b] = this.props;
      const xa = a.position.x, xb = b.position.x;
      swapP = propsP.then(() => {
        sfx.whoosh();
        return this.s.anim(0.9, (e) => { a.position.x = xa + (xb - xa) * e; b.position.x = xb + (xa - xb) * e; a.position.z = Math.sin(e * Math.PI) * 1.2; b.position.z = -Math.sin(e * Math.PI) * 1.2; }, Ease.inOut);
      });
    }
    // walks / scuttles in at an easy pace (under 5 units/s; the motion layer adds the gait); about 1.35 s
    await this.s.anim(Math.max(0.95, (X0 - hx) / 5.2), (e) => { ch.position.x = X0 + (hx - X0) * e; }, Ease.inOut);
    if (!swapP) await propsP;   // (normally already there; a swap round lets her start while they swap)
    if (this.dead) return;
    this.s.tween(ch.rotation, { y: 0 }, 0.4, Ease.inOut);
    sfx[CAST[who].call]();
    // the picture instruction appears over the friend once it has arrived (Level 3: only when she needs it)
    if (this.level < 2) this.showThought(spec);
    this.settleProps();
    const settled = () => { for (const p of this.props) { p.updateMatrixWorld(true); this.addStatics(p); } this.dropBits(spec); };
    if (swapP) swapP.then(() => { if (!this.dead && this.spec === spec) settled(); }); else settled();
    this.startStory(spec);
    this.makeDraggable(ch);
    this.busy = false;
    if (window.__qa) console.log('QA round-ready', this.level, r, Math.round(performance.now() - this.cur.t0), 'since-answer', this.qaAct ? Math.round(performance.now() - this.qaAct) : -1);
    this.cue();
  }

  makeDraggable(ch, { free = false } = {}) {
    this.drag = input.addDrag(ch, {
      radius: 1.1 * CAST[ch.userData.who].size, minY: 0, offset: new T.Vector3(0, 0.6, 0),
      zones: () => this.zones(),
      onPick: () => this.onPick(),
      onMove: (_t, z) => this.onHover(z),
      onDrop: (z, info) => (free ? this.freeDrop(z, info) : this.drop(z, info)),
    });
  }

  // loose bits rain in: onto the sand, or into a container that is NOT the one the friend goes into
  // (so the friend never lands on top of a shell, and nothing needs knocking out of its way)
  dropBits(spec) {
    const want = this.wantZone()?.obj;
    const cont = this.props.find((p) => p !== want && p.userData.phys?.some((d) => d.cont));
    (spec.bits || []).forEach((kind, i) => {
      let to;
      if (cont && i < 2 && kind !== 'ball') {
        to = cont.localToWorld(new T.Vector3((i - 0.5) * 0.5, 0.6, 0));
        const b = this.tossBit(kind, to, { delay: 0.1 + i * 0.3 });
        b.userData.inside = cont;
        if (cont.userData.ride) this.s.wait(1.5 + i * 0.3).then(() => this.stow(b, cont));
      } else {
        // on open sand only: never on a prop's footprint (a starfish landed in the boat's pool, in front of the sailor)
        const half = { boat: 3.0, chair: 2.2, umbrella: 2.1, hat: 2.5, castle: 1.9 };
        const free = (x) => this.props.every((p) => Math.abs(x - p.position.x) > (half[p.userData.prop] || 1.5) + 0.35);
        const xs = [-0.9, 0.9, 0, -1.8, 1.8, -5.2, 5.4].filter(free);
        const x = xs.length ? xs[(i + this.round) % xs.length] : 0;
        to = new T.Vector3(x + (Math.random() - 0.5) * 0.3, 0.3, 2.3 + (i % 2) * 0.5);
        this.tossBit(kind, to, { delay: 0.1 + i * 0.3 });
      }
    });
  }

  onPick() {
    if (this.freeOn && this.freeAt) this.leaveSpot();
    const ch = this.char, base = ch.userData.baseScale;
    if (this.homeTok) this.homeTok.dead = true;   // grabbed again while hopping home: the finger wins
    ch.rotation.set(0, 0, 0);
    this.carrying = true;
    sfx[CAST[ch.userData.who].call]();
    this.s.tween(ch.scale, { x: base * 1.12, y: base * 1.12, z: base * 1.12 }, 0.15, Ease.back);
  }

  // a little hello from the prop when the friend is carried over it (a soft lean; no sound per hover)
  onHover(z) {
    const id = z ? z.obj.uuid : null;
    if (id === this.hoverId) return;
    this.hoverId = id;
  }
  near(p, k) {
    const w = p.userData.wobble;
    if (!w) return;
    const u = w.userData;
    if (u.nearK === undefined) u.nearK = 0;
    u.nearK = k;
    w.scale.set(1 + k * 0.05, 1 - k * 0.04, 1 + k * 0.05);   // it leans up to meet the friend
  }

  promptText() {
    const spec = this.plan[this.round];
    if (!spec) return '';
    const p = spec.props.find(([k, m]) => zoneIds(k, m).includes(spec.want));
    // one plain spoken-style instruction: "Put the crab ON the bucket!"
    return `Put ${CAST[spec.who || 'crab'].say} ${spec.want.toUpperCase()} the ${PROP_NAME[p[0]]}!`;
  }

  goHome() {
    const ch = this.char, base = ch.userData.baseScale;
    this.carrying = false;
    const tok = (this.homeTok = {});
    this.arc(ch, this.home || SPAWN, 0.8, 0.6, tok).then((done) => { if (done) sfx.land(); });
    this.s.tween(ch.scale, { x: base, y: base, z: base }, 0.3);
  }

  // A ballistic hop (constant gravity: straight-line ground speed plus a parabola), then a squashy landing.
  // tok: picking the friend up again mid-hop cancels it (tok.dead), so the hop never fights the finger
  async arc(obj, to, apex = 1, dur = 0.4, tok = null) {
    const from = obj.position.clone();
    const top = Math.max(0, Math.max(from.y, to.y) + apex - (from.y + to.y) / 2);
    await this.s.anim(dur, (_, t) => {
      if (tok?.dead) return;
      obj.position.lerpVectors(from, to, t);
      obj.position.y += 4 * top * t * (1 - t);
    });
    if (tok?.dead) return false;
    obj.position.copy(to);
    return true;
  }
  // an arc whose length sets its time (never faster than about 5 units/s: a hop, not a throw)
  hopDur(obj, to, min = 0.6) { return Math.max(min, obj.getWorldPosition(new T.Vector3()).distanceTo(to) / 5); }
  async squash(obj, amt = 0.25, dur = 0.16) {
    const base = obj.userData.baseScale ?? 1;
    await this.s.anim(dur, (_, p) => { const k = 1 - Math.sin(p * Math.PI) * amt; obj.scale.set(base / Math.sqrt(k), base * k, base / Math.sqrt(k)); });
    obj.scale.setScalar(base);
  }

  async drop(zone, { tapped }) {
    const ch = this.char;
    this.hoverId = null;
    if (!zone) { this.goHome(); if (tapped) { sfx[CAST[ch.userData.who].call](); this.squash(ch, 0.12, 0.25); } return; }
    const want = this.target();
    const wz = this.wantZone();
    // the exact place at every level (praising ON when we asked for UNDER would teach the wrong word)
    if (zone.id !== want) {
      this.goHome();
      const w = zone.obj.userData.wobble;
      if (w) this.sayNo(w);
      if (this.thought) this.pulseThought(); else this.showThought(this.spec);
      // she hears where she put it, then the instruction again (voiced even if it was said a moment ago)
      this.redirecting = true;
      this.redirect(null);
      this.redirecting = false;
      const tok = (this.wrongTok = {});
      this.say(`Oops, that's ${zone.id.toUpperCase()}!`).then(() => { if (this.wrongTok === tok && !this.busy && !this.dead) this.say(this.promptText(), { repeat: true }); });
      return;
    }
    // Right. Rule 0: the next round begins while this one pays off. Everything this round still does works on its
    // own copies (ctx), never on this.char / this.spec, which the next round takes over.
    this.qaAct = performance.now();
    this.wrongTok = null;
    fx.clearHands();
    input.remove(this.drag);
    this.drag = null;
    this.busy = true;
    this.carrying = false;
    if (this.homeTok) this.homeTok.dead = true;
    this.hideThought();
    const last = this.round >= this.totalRounds - 1;
    const ctx = { ch, spec: this.spec, wz, pal: this.pal, hadRain: !!this.rain, last };
    this.pal = null;
    this.stopStory();   // the rain stops now (the next round may bring its own cloud)
    // the other place fades now (it was only a choice), except at the end: the finale's free play uses both
    if (!last) {
      for (const p of this.props) if (p !== wz.obj) { const o = p; this.fadeAway(o, 0.4).then(() => this.root.remove(o)); }
      this.props = [];          // (the next round's setProps must not touch this round's place: it is hers now)
      this.kept.push(wz.obj);
    }
    let clear;
    this.clearP = last ? null : new Promise((res) => { clear = res; });
    const placed = this.placeIn(ch, wz);
    this.station = placed.then((rest) => this.afterPlaced(ctx, rest, clear));
    await Promise.race([placed, this.wait(0.3)]);
    if (this.dead) return;
    this.busy = false;
    this.success(wz.rest().add(new T.Vector3(0, 1.6, 0)), '', { payoff: this.wait(0.01), still: 0 });
  }

  // The friend is in its place: the word, the friend's gag and the story; the place (with the friend in, on or under
  // it) then steps back out of the front row at once and glides to its keepsake spot at the back of the beach.
  async afterPlaced(ctx, rest, clear) {
    const { ch, wz, last } = ctx, prop = wz.obj;
    if (this.dead) return;
    this.say(placeLine(wz.id, wz.prop), { voice: true });   // the word, at the moment it happens
    if (!last && ch.parent === this.root) prop.attach(ch);   // (a boat's sailor already rides on its deck)
    const gag = this.gag(ch, wz, rest, ctx.spec);
    const story = this.storyPayoff(ctx, rest);
    if (last) { await Promise.all([gag, story]); return; }   // the last place stays in front for the free play
    // one step back (0.55 s), so the next round's places can grow where it stood, then the slow glide (1.1 s)
    const s0 = prop.scale.x;
    const p0 = prop.position.clone(), p1 = new T.Vector3(p0.x, 0, -2.8);
    this.s.wait(0.1).then(() => clear?.());   // the next places start growing as it moves out of their way
    await this.s.anim(0.55, (e) => { prop.position.lerpVectors(p0, p1, e); prop.scale.setScalar(s0 + (0.7 - s0) * e); }, Ease.inOut);
    const k = this.kept.indexOf(prop);
    const to = new T.Vector3(KEEP_X[Math.min(k, KEEP_X.length - 1)], 0, KEEP_Z);
    await this.s.anim(1.6, (e) => { prop.position.lerpVectors(p1, to, e); prop.scale.setScalar(0.7 + (KEEP_S - 0.7) * e); }, Ease.inOut);
    await Promise.all([gag, story]);
    if (ch.userData.claws && wz.id !== 'in') this.clawsUp(ch, 0, 0.3);
    this.pokeable(prop, { fn: () => { input.press(prop, 140); sfx.tap(); } });
  }

  // The friend goes into its place (it is still in the beach's own space). Resolves with the spot (world) when it is
  // really there: in, on, or hidden under with the cover down.
  async placeIn(ch, wz) {
    const want = wz.id;
    const rest = wz.rest();
    const fit = wz.def.fit ?? 1;   // a container's friend shrinks a little to sit inside cleanly
    const base = ch.userData.baseScale;
    if (want === 'in') {
      this.s.tween(ch.scale, { x: base * fit, y: base * fit, z: base * fit }, 0.4);
      const rimY = wz.obj.position.y + (wz.def.rim ?? 1) * wz.obj.scale.y;
      wz.obj.userData.flop?.(this.s);
      for (const c of wz.obj.userData.coins || []) this.s.wait(0.3).then(() => popOut(this.s, c, 0.3));
      // a boat: hop aboard (the arc runs in the bobbing boat's own space, so it lands right on the moving deck)
      const aboard = this.board(ch, wz);
      const to = aboard ? wz.def.seat : rest, top = aboard ? wz.def.seat.y + (rimY - rest.y) : rimY;
      await this.arc(ch, to, Math.max(0.6, top + 0.8 - to.y), this.hopDur(ch, aboard ? wz.obj.userData.ride.localToWorld(to.clone()) : to, 0.6));
      sfx.thunk();
      this.squash(ch, 0.3);
      this.clawsUp(ch, 1);   // claws wave up out of the top instead of poking through the walls
    } else if (want === 'on') {
      this.s.tween(ch.scale, { x: base * fit, y: base * fit, z: base * fit }, 0.4);
      await this.arc(ch, rest, 0.9, this.hopDur(ch, rest));
      sfx.land();
    } else {
      await this.hideUnder(ch, wz, rest);
    }
    return rest;
  }

  // the friend's little gag in its place, in whatever space the friend now lives in (the beach, the place, a deck)
  gag(ch, wz, rest, spec) {
    const restL = ch.parent ? ch.parent.worldToLocal(rest.clone()) : rest.clone();
    if (wz.id === 'in') return this.gagIn(ch, wz, rest, spec);
    if (wz.id === 'on') return this.gagOn(ch, restL, wz.def.fit ?? 1);
    return this.peek(ch, wz, restL);
  }

  // ---- gags (each ≤ ~1.4 s) ----
  gagIn(ch, z, rest, spec) {
    const s = this.s, base = ch.userData.baseScale * (z.def.fit ?? 1);
    const rimY = z.obj.position.y + (z.def.rim ?? 1) * z.obj.scale.y;
    const wet = ['swim', 'float', 'sail'].includes(spec?.story);
    if (wet) splashCrown(s, this.root, new T.Vector3(rest.x, rimY, rest.z), 1.0);
    if (z.obj.userData.spin) { // the swim ring spins round with the friend in it (the friend rides along on it)
      const r0 = z.obj.rotation.y, own = ch.parent === this.root;
      s.anim(1.4, (e) => { z.obj.rotation.y = r0 + e * Math.PI * 2; if (own) ch.rotation.y = e * Math.PI * 2; }, Ease.inOut).then(() => { z.obj.rotation.y = r0; if (own) ch.rotation.y = 0; });
    }
    // bob up, blink, settle back (from where it landed, in its own space)
    const y0 = ch.position.y;
    return s.anim(1.2, (_, p) => {
      ch.position.y = y0 + Math.sin(p * Math.PI * 2) * 0.25 * (1 - p);
      const k = 1 + Math.sin(p * Math.PI * 3) * 0.1 * (1 - p);
      ch.scale.set(base / Math.sqrt(k), base * k, base / Math.sqrt(k));
    }).then(() => { ch.scale.setScalar(base); ch.position.y = y0; });
  }

  // claws (crab) lifted by `amt` (0 = rest pose), tweened; they stay up until reset with amt 0
  clawsUp(ch, amt, dur = 0.4) {
    for (const [i, c] of (ch.userData.claws || []).entries()) {
      const r0 = c.userData.r0;
      if (r0) this.s.tween(c.rotation, { z: r0.z + (i ? -1 : 1) * amt }, dur, Ease.out);
    }
  }

  gagOn(ch, rest, fit = 1) {
    const s = this.s, base = ch.userData.baseScale * fit, ud = ch.userData;
    // land squash, wobble wobble (balancing!)… then claws up: ta-da!
    const claws = ud.claws || ud.wings || [];
    const c0 = claws.map((c) => c.rotation.z);
    return s.anim(1.4, (_, p) => {
      const sq = p < 0.15 ? 1 - Math.sin((p / 0.15) * Math.PI) * 0.25 : 1;
      ch.scale.set(base / Math.sqrt(sq), base * sq, base / Math.sqrt(sq));
      ch.rotation.z = p < 0.6 ? Math.sin(p * Math.PI * 3) * 0.25 * (1 - p / 0.6) : 0;
      ch.position.x = rest.x - ch.rotation.z * 0.3;
      const up = p > 0.55 ? Ease.back(Math.min(1, (p - 0.55) / 0.2)) : 0;
      claws.forEach((c, i) => { c.rotation.z = c0[i] + (i ? -1 : 1) * up * 0.8; });
      if (p > 0.55) ch.position.y = rest.y + Math.sin(Math.min(1, (p - 0.55) / 0.3) * Math.PI) * 0.3;
    }).then(() => { ch.rotation.z = 0; ch.scale.setScalar(base); ch.position.copy(rest); claws.forEach((c, i) => (c.rotation.z = c0[i])); });
  }

  // UNDER, part 1: the friend shrinks to fit and tucks its claws in, the cover lifts, it walks under at walking pace,
  // crouches as the cover comes down (thump). Resolves with the cover down.
  async hideUnder(ch, z, rest) {
    const s = this.s, base = ch.userData.baseScale;
    const cover = z.obj.userData.cover;
    const fit = z.def.fit ?? 1;
    this.clawsUp(ch, 1, 0.3);
    s.tween(ch.scale, { x: base * fit, y: base * fit, z: base * fit }, 0.3, Ease.inOut);
    const lifted = cover.lift(s, 0.25);
    const from = ch.position.clone();
    if (from.y > 0.05) await this.arc(ch, new T.Vector3(from.x, 0, from.z), 0.3, 0.3);   // down onto the sand first
    const d = Math.hypot(rest.x - ch.position.x, rest.z - ch.position.z);
    await Promise.all([lifted, s.tween(ch.position, { x: rest.x, y: rest.y, z: rest.z }, Math.max(0.4, d / 6), Ease.inOut)]);
    s.tween(ch.scale, { x: base * fit, y: base * 0.62 * fit, z: base * fit }, 0.25, Ease.inOut);
    await cover.drop(s, 0.25);
    for (const b of this.bits) if (physics.has(b) && b.position.distanceTo(z.obj.position) < 3) physics.poke(b, 0.6);
  }
  // UNDER, part 2: it nudges forward and peeks out, blinks and glances left and right; the cover settles back down
  async peek(ch, z, rest) {
    const s = this.s, ud = ch.userData;
    const cover = z.obj.userData.cover;
    const fwd = cover.hides ? (ud.eyes ? 0.75 : 0.45) : 0.12;
    s.tween(ch.position, { z: rest.z + fwd }, 0.35, Ease.inOut);
    await cover.tip(s);
    const eyes = ud.eyes || [];
    const ey = eyes.map((e) => e.scale.y);
    await s.anim(1.0, (_, p) => {
      const b = Math.abs(Math.sin(p * Math.PI * 2));
      eyes.forEach((e, i) => { e.scale.y = ey[i] * (p < 0.4 ? Math.max(0.15, 1 - b * 0.9) : 1); e.rotation.y = p > 0.4 ? Math.sin((p - 0.4) / 0.6 * Math.PI * 2) * 0.6 : 0; });
      if (ud.head && !eyes.length) ud.head.rotation.y = Math.sin(p * Math.PI * 2) * 0.5;
    });
    eyes.forEach((e, i) => { e.scale.y = ey[i]; e.rotation.y = 0; });
    await cover.settle?.(s);   // the cover rests low again (just the eyes peeping out), never left hovering
  }

  // ---- the round's little story: a set-up beat when the round starts, a payoff after the right answer ----
  // Every payoff is a model or the friend itself reacting (no emoji floats).
  startStory(spec) {
    const k = spec.story;
    if (k === 'rain') {
      // a grumpy little cloud drizzles over the beach until everyone is under cover
      const cloud = makeRainCloud();
      if (cloud.userData.model?.userData.face) setFace(cloud.userData.model.userData.face, 'angry');
      cloud.position.set(0, 4.9, -3.0);
      this.root.add(cloud);
      popIn(this.s, cloud, 1.2, 0.4, { sound: false });
      sfx.thunder?.();
      this.rain = { cloud, acc: 0 };
    } else if (k === 'hide' && this.pal) {
      // the seeker turns three-quarters away and covers its eyes with its wings to count
      const pal = this.pal, w = pal.userData.wings || [];
      this.s.tween(pal.rotation, { y: 2.2 }, 0.6, Ease.inOut);
      w.forEach((x, i) => this.s.tween(x.rotation, { z: x.userData.r0.z + (i ? -1 : 1) * 1.1 }, 0.5, Ease.inOut));
    } else if (k === 'sleep') {
      // a big slow yawn-stretch
      const ch = this.char, b = ch.userData.baseScale;
      sfx.aww();
      this.s.wait(0.3).then(() => this.s.anim(1.2, (_, p) => { const k2 = 1 + Math.sin(p * Math.PI) * 0.1; ch.scale.set(b / Math.sqrt(k2), b * k2, b / Math.sqrt(k2)); })).then(() => { if (!this.carrying) ch.scale.setScalar(b); });
    }
  }

  stopStory() {
    if (this.storyTimer) { this.storyTimer(); this.storyTimer = null; }
    if (this.rain) {
      const c = this.rain.cloud;
      this.rain = null;
      const face = c.userData.model?.userData.face;
      if (face) setFace(face, 'happy');   // all done raining: it cheers up and floats away
      this.s.tween(c.position, { x: c.position.x + 12, y: c.position.y + 0.8 }, 3.0, Ease.inOut).then(() => this.root.remove(c));
    }
  }

  // the story pays off because of what she did; resolves when it has been seen. Works only on its own ctx.
  storyPayoff(ctx, rest) {
    const { ch, spec, wz: z } = ctx, k = spec.story, s = this.s;
    const face = ch.userData.face;
    const joy = (sec = 1.4) => { if (face) { setFace(face, 'joy'); s.wait(sec).then(() => setFace(face, 'happy')); } };
    if (k === 'rain' && ctx.hadRain) {
      // the cloud drifts off and a small rainbow comes up far behind the beach, then fades
      const bow = makeRainbow();
      bow.position.set(0, 0.9, -7);
      this.root.add(bow);
      joy();
      return popIn(s, bow, 0.55, 0.9, { sound: false }).then(() => s.wait(1.2)).then(() => this.fadeAway(bow, 0.6)).then(() => this.root.remove(bow));
    }
    if (k === 'sun') {   // in the shade at last: a long happy sigh
      joy(1.6);
      sfx.aww();
      const b = ch.scale.clone();
      return s.anim(1.2, (_, p) => { const k2 = 1 - Math.sin(p * Math.PI) * 0.08; ch.scale.set(b.x / Math.sqrt(k2), b.y * k2, b.z / Math.sqrt(k2)); }).then(() => ch.scale.copy(b));
    }
    if (k === 'hide' && ctx.pal) {
      const pal = ctx.pal, w = pal.userData.wings || [];
      w.forEach((x) => s.tween(x.rotation, { z: x.userData.r0.z }, 0.4, Ease.inOut));
      return s.tween(pal.rotation, { y: -0.4 }, 0.6, Ease.inOut).then(() => {
        sfx.gasp();
        const h = pal.userData.head;
        return h ? s.anim(1.0, (_, p) => { h.rotation.y = Math.sin(p * Math.PI * 2) * 0.5; }).then(() => (h.rotation.y = 0)) : s.wait(0.8);
      }).then(() => this.fadeAway(pal, 0.5)).then(() => this.root.remove(pal));   // the seeker goes (it was only watching)
    }
    if (k === 'sleep') {
      const eyes = ch.userData.eyes || [];
      const ey = eyes.map((e) => e.scale.y);
      return s.wait(0.25).then(() => {
        eyes.forEach((e) => (e.scale.y *= 0.15));
        [0, 0.5, 1.0].forEach((d, i) => s.wait(d).then(() => { if (!i) sfx.mmm(); fx.float(rest.clone().add(new T.Vector3(0.4 + i * 0.3, 1.2 + i * 0.3, 0)), 'z', { color: '#6a7bff', size: 4 + i * 1.5 }); }));
        return s.wait(1.4);
      }).then(() => eyes.forEach((e, i) => (e.scale.y = ey[i])));
    }
    if (k === 'picnic') { joy(1.6); sfx.mmm?.(); return s.wait(1.2); }   // a happy "mmm" in the picnic basket
    if (k === 'treasure') {
      // gold coins jump up out of the chest in a little fountain and drop back in
      sfx.twinkle();
      const coins = [];
      for (let i = 0; i < 5; i++) {
        const c = makeBit('coin');
        const x = (i - 2) * 0.32;
        c.position.set(x, 0.9, 0.1);
        c.userData.x = x;
        z.obj.add(c);
        coins.push(c);
      }
      return s.anim(1.1, (_, p) => coins.forEach((c, i) => {
        const q = Math.max(0, Math.min(1, (p - i * 0.08) / 0.7));
        c.position.set(c.userData.x * (1 + q * 0.6), 0.9 + Math.sin(q * Math.PI) * 1.3, 0.1);
        c.rotation.y = q * 6;
      })).then(() => { coins.forEach((c) => z.obj.remove(c)); joy(1.2); });
    }
    if (k === 'ball') {
      // a beach ball bounces onto the hat's brim beside the friend (never through it) and rolls off, then goes
      const ball = makeBit('ball');
      const brim = z.obj.localToWorld(new T.Vector3(1.8, 0.45, 0.9));
      const a = new T.Vector3(-8, 3, 2), off = brim.clone().add(new T.Vector3(1.8, -0.1, 1.2));
      off.y = 0.38;
      ball.position.copy(a);
      this.root.add(ball);
      sfx.bloop?.(1);
      return s.anim(1.0, (_, p) => { ball.position.lerpVectors(a, brim, p); ball.position.y += Math.sin(p * Math.PI) * 2.2; })
        .then(() => s.anim(0.7, (_, p) => { ball.position.lerpVectors(brim, off, p); ball.position.y += Math.sin(p * Math.PI) * 0.6; ball.rotation.z -= 0.15; }))
        .then(() => s.wait(0.6)).then(() => this.fadeAway(ball, 0.5)).then(() => this.root.remove(ball));
    }
    if (k === 'sail') {
      sfx.trumpetHi?.();
      if (z.obj.userData.sail) return z.obj.userData.sail(s);   // rocks and drifts in its pool; the sailor rides along
      return s.wait(1.2);
    }
    if (k === 'look') {
      // up high, the friend shades its eyes and looks: a real little sailboat glides past out at sea
      const boat = makeSailboat(0xffffff, 0xff8fb0);
      boat.position.set(-14, 0, -12);
      boat.scale.setScalar(0.9);
      this.root.add(boat);
      s.tween(boat.position, { x: 14 }, 9, (t) => t).then(() => { if (boat.parent) this.root.remove(boat); });
      const h = ch.userData.head;
      joy(1.6);
      if (h) return s.anim(1.6, (_, p) => { h.rotation.y = Math.sin(p * Math.PI * 2) * 0.45; }).then(() => (h.rotation.y = 0));
      return s.wait(1.4);
    }
    joy();
    return s.wait(0.6);
  }

  // (the round change happens during the payoff: see drop() and afterPlaced())
  async afterSuccess() {}

  // tapping a loose shell / ball / coin makes it jump
  pokeAtBits(x, y) {
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
    if (best.userData.bit === 'ball') sfx.bloop(1); else if (best.userData.bit === 'coin') sfx.twinkle(); else sfx.bloop(Math.floor(Math.random() * 4));
    return true;
  }

  // ---- alive while carried: legs paddle, claws snap, eyes look at the nearest thing ----
  update(dt, t) {
    for (const p of this.props) p.userData.tick?.(dt, t);   // the boat bobs on its pool
    for (const p of this.kept) p.userData.tick?.(dt, t);
    // rain from the story cloud: soft drops across the beach
    if (this.rain) {
      const c = this.rain.cloud;
      c.position.x = Math.sin(t * 0.5) * 4.5;
      this.rain.acc += dt;
      while (this.rain.acc > 0.05) {
        this.rain.acc -= 0.05;
        const d = makeSoftDrop(0.07, 0x9cc8ff);
        d.position.set((Math.random() - 0.5) * 10, 5.2, -2 + Math.random() * 5);
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
    this.animThought(dt);
  }

  // ---- the picture instruction: a thought bubble over the friend with a tiny looping demo of the goal ----
  // (a mini friend hops IN the mini bucket / onto it / scoots UNDER it), so the goal reads without words.
  showThought(spec) {
    this.hideThought(true);
    const want = spec.want;
    const pk = spec.props.find(([k, m]) => zoneIds(k, m).includes(want));
    const who = spec.who || 'crab';
    const g = new T.Group();
    // the bubble: a white cloud-pill with a dark edge, and two little puffs trailing down to the friend
    const W = 1.7, H = 1.2;
    const edge = new T.Mesh(geo.circle(1, 40), basic(0x3a2838));
    edge.scale.set(W + 0.07, H + 0.07, 1);
    edge.position.z = -1.0;
    const fill = new T.Mesh(geo.circle(1, 40), basic(0xffffff));
    fill.scale.set(W, H, 1);
    fill.position.z = -0.98;
    g.add(edge, fill);
    for (const [x, y, r] of [[-0.62, -1.45, 0.21], [-0.95, -1.82, 0.13]]) {
      const e2 = new T.Mesh(geo.circle(r + 0.05, 20), basic(0x3a2838));
      const f2 = new T.Mesh(geo.circle(r, 20), basic(0xffffff));
      e2.position.set(x, y, -1.0); f2.position.set(x, y, -0.98);
      g.add(e2, f2);
    }
    // the mini scene, tipped toward the camera so you can see into containers
    const scene = new T.Group();
    scene.rotation.x = 0.28;
    g.add(scene);
    const prop = makeProp(pk[0], pk[1]);
    const z = prop.userData.zones[want];
    const fr = CAST[who].make();
    fr.userData.noLook = true; fr.userData.noWalk = true; fr.userData.mini = true;
    // size everything to fit the bubble (tall umbrella vs. a flat towel); a tall prop is cropped to its top part
    const pb = new T.Box3().setFromObject(prop), fb = new T.Box3().setFromObject(fr);
    const cover = prop.userData.cover;
    const hides = want === 'under' && cover?.hides;
    const fh = (fb.max.y - fb.min.y) * (z.fit ?? 1);   // the friend's height as it sits there
    const lift0 = hides ? fh * 0.92 : 0;               // a covering prop hovers so the friend shows beneath it
    const tall = want === 'on' ? Math.max(pb.max.y, z.rest.y + fh) : Math.max(Math.min(pb.max.y, 2.6) + lift0, z.rest.y + fh);
    const fw = fb.max.x - fb.min.x;
    const k = Math.min(0.7, 1.95 / Math.max(1.2, tall), 2.5 / Math.max(1, pb.max.x - pb.min.x + fw * 0.6));
    prop.scale.setScalar(k);
    scene.add(prop, fr);
    const lift = lift0 * k;
    const sz = fr.scale.x * k * (z.fit ?? 1) * (want === 'in' ? 0.85 : 1);   // inside: a touch smaller, claws clear of the walls
    fr.scale.setScalar(0.001);
    const rest = z.rest.clone().multiplyScalar(k);
    if (hides) rest.z += 0.18;   // nudged forward a touch so it peeks out
    const start = new T.Vector3(pb.min.x * k - 0.12 - fw * k * 0.35, 0, 0.5 * k);
    const midY = Math.min(tall, pb.max.y + lift0) * k / 2;
    // centred on the prop and the spot the friend ends up in
    scene.position.set(-((pb.min.x + pb.max.x) / 2) * k + 0.25, -midY - 0.05, 0);
    g.userData = { t: 0, prop, fr, sz, rest, start, lift, want, k, rim: (z.rim ?? 1) * k, topY: Math.max(pb.max.y * k, rest.y) };
    if (want === 'in' && fr.userData.claws) for (const [i, c] of fr.userData.claws.entries()) c.rotation.z += (i ? -1 : 1) * 1;   // mini claws up too
    const at = this.char ? this.char.position : (this.home || SPAWN);
    g.position.set(Math.max(-2.2, Math.min(2.6, at.x + 0.9)), 3.45, 3.0);
    g.scale.setScalar(0.5);
    this.root.add(g);
    this.thought = g;
    this.s.tween(g.scale, { x: 0.88, y: 0.88, z: 0.88 }, 0.4, Ease.out);
  }

  animThought(dt) {
    const g = this.thought;
    if (!g) return;
    const u = g.userData, P = 3.0;
    u.t += dt;
    const t = u.t % P;
    const fr = u.fr;
    // 0-0.3 pop in beside the thing, 0.5-1.0 hop / scoot to the spot, hold with a happy bounce, 2.65-3.0 shrink away
    if (t < 0.3) fr.scale.setScalar(u.sz * Ease.back(t / 0.3));
    else if (t < 2.65) fr.scale.setScalar(u.sz);
    else fr.scale.setScalar(u.sz * Math.max(0.001, 1 - (t - 2.65) / 0.35));
    if (u.lift) u.prop.position.y = u.lift * Math.min(1, Math.max(0, (t - 0.25) / 0.25));
    const e = Math.min(1, Math.max(0, (t - 0.5) / 0.5));
    const ee = Ease.inOut ? Ease.inOut(e) : e;
    fr.position.lerpVectors(u.start, u.rest, ee);
    if (u.want !== 'under') {
      const top = (u.want === 'on' ? u.rest.y : u.rim) + 0.25;
      fr.position.y += 4 * Math.max(0, top - (u.start.y + u.rest.y) / 2) * e * (1 - e);
    }
    if (t > 1.1 && t < 2.6) fr.position.y = u.rest.y + Math.abs(Math.sin((t - 1.1) * Math.PI * 2)) * 0.06;
    if (u.pulse > 0) { u.pulse = Math.max(0, u.pulse - dt * 2.5); const s2 = 0.88 * (1 + Math.sin(u.pulse * Math.PI) * 0.18); g.scale.setScalar(s2); }
  }

  pulseThought() {
    if (!this.thought) return;
    const u = this.thought.userData;
    u.pulse = 1;
    if ((u.t % 3.0) < 2.65) u.t = Math.floor(u.t / 3.0) * 3.0 + 2.65;   // finish this loop (shrink away), then replay it
  }

  hideThought(now = false) {
    const g = this.thought;
    if (!g) return;
    this.thought = null;
    if (now) { this.root.remove(g); return; }
    // pops like a soap bubble (a quick swell, then gone) rather than shrinking through a tiny unreadable dot
    g.userData.pulse = 0;
    this.s.tween(g.scale, { x: 1.0, y: 1.0, z: 1.0 }, 0.15, Ease.out).then(() => { this.root.remove(g); });
  }

  // the friend to place (it's the drag target; a tap on it already wiggles), and the tiny friend in the bubble never
  // take a poke: a poke's squash restores the height and scale captured mid-hop
  pokeAt(x, y) {
    const all = this.chars;
    this.chars = (all || []).filter((c) => !c.userData.mini && c !== this.char && !(this.busy && c === this.pal));
    try { return this.pokeAtBits(x, y); } finally { this.chars = all; }
  }

  // the idle nudge hops the friend, but never while a finger has it (the hop would yank it back down);
  // Level 3 shows the picture only now, when she seems unsure
  nudge(step) {
    const o = this.nudgeTarget();
    if (!o || this.carrying || input.dragging()) { super.nudge(step); return; }
    const y0 = o.position.y;
    this.s.anim(0.5, (_, p) => { if (!this.carrying) o.position.y = y0 + Math.sin(p * Math.PI) * 0.45; }).then(() => { if (!this.carrying) o.position.y = y0; });
    if (this.thought) this.pulseThought(); else if (this.spec) this.showThought(this.spec);
    if (step >= 2) { const stop = fx.halo(o, 1.3); this.s.wait(3).then(stop); }
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

  // the errorless step after a 2nd wrong drop: the repeated instruction is already on its way (no prompt on top)
  errorless() {
    if (this.errorlessOn) return;
    this.errorlessOn = true;
    this.makeErrorless();
    if (!this.redirecting) this.prompt();
  }

  makeErrorless() {
    const want = this.wantZone();
    for (const z of this.zoneList) if (z !== want) z.enabled = false;
    for (const p of this.props) if (p !== want.obj) this.s.tween(p.scale, { x: 0.6, y: 0.6, z: 0.6 }, 0.4);
  }

  // ---- finale: 10 s of free play, then the last place joins the keepsake row and the photo frames the whole row ----
  onFinale() { this.stopStory(); }
  async showOff() {
    if (this.station) await this.alive(Promise.race([this.station, this.wait(4)]));   // the last friend has settled in
    await this.freePlay(10);
    await this.finalKeep();
    await super.showOff();
  }
  async freePlay(sec) {
    const ch = this.char;
    if (!ch || !ch.parent || this.dead) return;
    // every place on the front props is open now; she can pick the friend up from where it is
    for (const z of this.zoneList) z.enabled = true;
    for (const p of this.props) this.s.tween(p.scale, { x: p.userData.baseS ?? 1, y: p.userData.baseS ?? 1, z: p.userData.baseS ?? 1 }, 0.3);
    this.freeAt = this.lastZone();
    this.home = new T.Vector3(ch.getWorldPosition(new T.Vector3()).x, 0, 3.2);
    input.unlock();
    this.freeOn = true;
    this.makeDraggable(ch, { free: true });
    const stop = fx.halo(ch, 1.2);
    this.s.wait(2).then(stop);
    let t = 0;
    while (t < sec && !this.dead) {
      await this.wait(0.25);
      t += 0.25;
      if (t >= sec && (this.carrying || this.freeBusy)) t -= 0.25;   // let a move in progress finish
    }
    this.freeOn = false;
    if (this.drag) { input.remove(this.drag); this.drag = null; }
    if (this.carrying) { this.carrying = false; this.goHome(); await this.wait(0.65); }
    input.lock(100000);
  }
  // The friend's place joins the keepsake row: the other prop fades; if the friend ended on the sand it hops back into
  // the round's place first; then the place (friend and all) glides to the last spot in the row.
  async finalKeep() {
    const ch = this.char;
    if (!ch || this.dead) return;
    let z = this.freeAt;
    if (!z) { z = this.lastZone(); const rest = await this.placeIn(ch, z); await this.gag(ch, z, rest, this.spec); }
    const prop = z.obj;
    for (const p of this.props) if (p !== prop) { const o = p; this.fadeAway(o, 0.4).then(() => this.root.remove(o)); }
    if (ch.parent === this.root) prop.attach(ch);
    this.props = [];
    this.kept.push(prop);
    const to = new T.Vector3(KEEP_X[Math.min(this.kept.length - 1, KEEP_X.length - 1)], 0, KEEP_Z);
    const p0 = prop.position.clone(), s0 = prop.scale.x;
    await this.s.anim(1.9, (e) => { prop.position.lerpVectors(p0, to, e); prop.scale.setScalar(s0 + (KEEP_S - s0) * e); }, Ease.inOut);
  }
  // picked up from its place: out from under a cover (it lifts clear), out of a boat, claws down
  leaveSpot() {
    const ch = this.char, wz = this.freeAt;
    this.freeAt = null;
    this.unboard(ch);
    this.clawsUp(ch, 0, 0.3);
    if (wz && wz.id === 'under') { const c = wz.obj.userData.cover; if (c?.open) c.open(this.s).then(() => c.reset(this.s)); }
  }
  lastZone() { const d = this.plan[this.totalRounds - 1]; return this.zoneList.find((z) => z.id === d.want); }
  async freeDrop(z, { tapped }) {
    if (!this.freeOn || this.freeBusy) return;
    if (!z) { this.goHome(); if (tapped) sfx[CAST[this.char.userData.who].call](); return; }
    this.freeBusy = true;
    this.carrying = false;
    input.remove(this.drag); this.drag = null;
    this.say(placeLine(z.id, z.prop), { repeat: true });   // every place says its word
    const ch = this.char;
    const rest = await this.placeIn(ch, z);
    await this.gag(ch, z, rest, this.spec);
    this.freeAt = z;
    this.home = new T.Vector3(z.obj.position.x - Math.sign(z.obj.position.x || 1) * 0.4, 0, 3.2);
    if (this.freeOn && !this.dead) this.makeDraggable(ch, { free: true });
    this.freeBusy = false;
  }
  // the photo frames the whole keepsake row (from its real bounds and the camera's field of view)
  creationView() {
    const box = new T.Box3();
    for (const p of this.kept) if (p.parent) box.expandByObject(p);
    if (box.isEmpty()) return { pos: [0, 5.6, 13.2], look: [0, 0.9, -1.4] };
    const c = box.getCenter(new T.Vector3()), sz = box.getSize(new T.Vector3());
    const vf = (camera.fov * Math.PI) / 180, asp = innerWidth / innerHeight;
    const halfW = sz.x / 2 + 0.9, halfH = Math.max(sz.y, 1.2) / 2 + 0.9;
    const d = Math.max(halfW / (Math.tan(vf / 2) * asp), halfH / Math.tan(vf / 2)) * 1.05;
    const look = new T.Vector3(c.x, Math.max(0.5, c.y * 0.8), c.z);
    const dir = new T.Vector3(0, 0.36, 1).normalize();   // a little from above, so nothing in front hides the row
    return { pos: look.clone().addScaledVector(dir, d), look };
  }
  creationObjects() { return [...this.kept]; }
}
