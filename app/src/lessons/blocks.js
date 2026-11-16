// Block builder (World 5: the building site). Topics mt_Qcp2d_kuta "3-D shapes" and mt_XjwUlmxdCT "Combining simple
// shapes".
// A little model stands on the display stand at the left. On the blueprint build mat its shape waits as soft white
// ghost outlines, one per block. The loose painted wooden blocks (cube, long block, cylinder, cone, roof, arch, ball)
// hop out of the toy box into the tray at the front. Drag a block onto the ghost of the same shape: it flies over, drops
// in with real physics (a wooden "tok", a little squash) and settles; its twin on the stand gives a hop. Blocks above
// wait for the ones underneath ("Bottom first!"). The finished build gets a xylophone run and a little gag (a flag pops
// up, a rocket blasts off), then Bear stomps and the whole thing topples with physics before the blocks hop back into
// the toy box.
// Levels: L1 2–3 blocks, every block in the tray is needed (a block dropped on the wrong ghost finds its own).
//         L2 4–5 blocks, mostly with a roof, plus one spare block that isn't needed; it must go on its own shape.
//         L3 5-block models and the twist: "Which one rolls?" (tap a block on the ramp; physics shows who rolls) and
//         "Which one stacks?" (a ball put on the tower really rolls off; the cube stacks).
//
// Test hooks: kind ('build' | 'roll' | 'stack'), blocks (loose tray blocks, b.userData.shape), zones() (z.shape,
// z.open; 'any' on the stack round), drop(block, zone), choices + answer + tapChoice(b) (roll rounds), slots.
import * as T from '../three.js';
import { Lesson, shuffle } from '../engine/lesson.js';
import { makeAnimal, setFace, popIn, popOut, hop } from '../engine/actors.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { physics } from '../engine/physics.js';
import { project, setCamera } from '../engine/stage.js';
import { Ease } from '../engine/tween.js';
import { glow } from '../engine/scenery.js';
import { blobShadow, geo, toonUnique, disposeTree } from '../engine/toon.js';
import { makeHardHat } from './bricks-pieces.js';
import {
  SHAPES, COL, MODELS, PLANS, MAT, STAND, TRAY, TOYBOX, RAMP, rampGeo, rampY, supportsOf, hexCss,
  makeBlock, makeGhost, setGhost, makeMat, makeStand, makeTray, makeToyBox, makeRamp, makeFlag,
} from './blocks-pieces.js';
import { ksfx } from './blocks-sound.js';

const K = 1.25;                                           // world size of one block unit on the mat
const KT = 0.9;                                           // ... waiting in the tray (nearer the camera)
const KR = 1.0;                                           // ... on the ramp (three lanes)
const MINI = 0.4;                                         // the model on the stand
const CAM = { pos: new T.Vector3(0.8, 6.0, 13.4), look: new T.Vector3(0.8, 1.5, -0.8) };
const MATP = new T.Vector3(1.0, 0, -1.4);
const STANDP = new T.Vector3(-5.0, 0, -1.5);
const TRAYP = new T.Vector3(0.8, 0, 3.0);
const BOXP = new T.Vector3(6.6, 0, -1.6);
const BEARP = new T.Vector3(-7.6, 0, -3.4);
const PIPP = new T.Vector3(8.3, 0, -2.6);
const RYAW = 0.2;                                         // the ramp's turn (so its side profile shows)
const GAP = 0.4;                                          // between blocks in the tray
const FIXED = 1, DYNAMIC = 0;                             // Rapier body types
const name = (shape) => SHAPES[shape].name;
const an = (shape) => (/^[aeiou]/.test(name(shape)) ? 'an ' : 'a ') + name(shape);

export default class BlocksLesson extends Lesson {
  get totalRounds() { return (PLANS[this.level] || PLANS[0]).rounds.length; }

  build() {
    this.plan = PLANS[this.level] || PLANS[0];
    setCamera(CAM.pos, CAM.look);
    // the corner: blueprint mat in the middle, the model stand at the left, the tray in front, the toy box at the right
    const mat = (this.mat = makeMat(this.plan.felt));
    mat.position.copy(MATP);
    this.root.add(mat);
    const st = makeStand();
    st.position.copy(STANDP);
    st.add(blobShadow(1.2));
    this.root.add(st);
    const tray = makeTray();
    tray.position.copy(TRAYP);
    this.root.add(tray);
    const box = (this.toybox = makeToyBox());
    box.position.copy(BOXP);
    box.rotation.y = -0.2;
    box.add(blobShadow(1.5));
    this.root.add(box);
    // colliders: the mat top, the tray (floor + rims), the stand and the toy box (things that topple or roll bump them)
    physics.box(new T.Vector3(MATP.x, MAT.top / 2, MATP.z), new T.Vector3(MAT.w, MAT.top, MAT.d));
    physics.box(new T.Vector3(TRAYP.x, TRAY.floor / 2, TRAYP.z), new T.Vector3(TRAY.len, TRAY.floor, TRAY.d));
    for (const s of [-1, 1]) {
      physics.box(new T.Vector3(TRAYP.x, TRAY.rim / 2, TRAYP.z + s * (TRAY.d / 2 - 0.07)), new T.Vector3(TRAY.len, TRAY.rim, 0.14));
      physics.box(new T.Vector3(TRAYP.x + s * (TRAY.len / 2 - 0.07), TRAY.rim / 2, TRAYP.z), new T.Vector3(0.14, TRAY.rim, TRAY.d));
    }
    physics.box(new T.Vector3(STANDP.x, STAND.top / 2, STANDP.z), new T.Vector3(STAND.r * 1.6, STAND.top, STAND.r * 1.6));
    physics.box(new T.Vector3(BOXP.x, TOYBOX.h / 2, BOXP.z), new T.Vector3(TOYBOX.w, TOYBOX.h, TOYBOX.d), -0.2);
    // Bear the builder (hard hat) beside the stand, Pip by the toy box
    const bear = (this.bear = makeAnimal('bear'));
    bear.position.copy(BEARP);
    bear.rotation.y = 0.6;
    this.root.add(bear);
    const hat = makeHardHat();
    hat.scale.setScalar(1.12);
    hat.position.set(0, 0.88, 0.02);
    hat.rotation.x = -0.12;
    (bear.userData.head || bear).add(hat);
    for (const e of ['earL1', 'earR1']) bear.userData.bones?.[e]?.scale.setScalar(0.3);
    this.bearArms = bear.userData.arms ? bear.userData.arms.map((a) => a.rotation.clone()) : null;
    this.pip.position.copy(PIPP);
    this.pip.rotation.y = -0.55;
    // the model on the stand turns to face us
    this.mini = new T.Group();
    this.mini.position.set(STANDP.x, STAND.top, STANDP.z + 0.1);
    this.mini.rotation.y = Math.atan2(CAM.pos.x - STANDP.x, CAM.pos.z - STANDP.z) * 0.8;
    this.root.add(this.mini);
    // the glow behind a finished build, and the "?" glow on the stack round
    this.halo = glow(0xffe27a, 1, 0);
    this.halo.position.set(MATP.x, 2, MATP.z - 0.9);
    this.root.add(this.halo);
    this.topGlow = glow(0xffffff, 1.6, 0);
    this.root.add(this.topGlow);
    this.slots = [];
    this.loose = [];
    this.placedB = [];
    this.choices = [];
    this.strays = [];
    this.minis = [];
    this.kind = 'build';
    this.phase = 'idle';
    this.dropN = 0;
    this.knockDir = 1;
  }

  // ---------------- helpers ----------------
  get blocks() { return this.loose.filter((b) => b.userData.state === 'tray'); }
  get spec() { return this.plan.rounds[this.round]; }
  get answer() { const s = this.spec; return s && (s.answer || null); }
  slotCenter(s) { return new T.Vector3(MATP.x + s.x * K, MAT.top + (s.y + SHAPES[s.shape].h / 2) * K, MATP.z); }
  isOpen(s) { return s.sup.every((q) => q.filled); }
  zones() {
    if (this.phase !== 'build') return [];
    if (this.kind === 'stack') return this.topZone ? [this.topZone] : [];
    return this.slots.filter((s) => !s.filled).map((s) => ({ id: s.i, slot: s, shape: s.shape, open: this.isOpen(s), pos: this.slotCenter(s), radius: Math.max(0.75, SHAPES[s.shape].w * 0.6) * K }));
  }
  // the next sensible move: a loose block and where it goes
  pair() {
    if (this.kind === 'roll') return null;
    const loose = this.blocks.filter((b) => !b.userData.extra);
    if (this.kind === 'stack') { const b = loose.find((x) => x.userData.shape === this.answer); return b && this.topZone ? { b, z: this.topZone } : null; }
    const zs = this.zones().filter((z) => z.open).sort((a, c) => a.slot.y - c.slot.y);
    for (const z of zs) { const b = loose.find((x) => x.userData.shape === z.shape); if (b) return { b, z }; }
    return null;
  }

  // move a block along an arc (cancels any move before it)
  fly(b, to, { dur = 0.4, arc = 1.0, spin = 0, scale = K, rot = null } = {}) {
    const id = (b.userData.mv = (b.userData.mv || 0) + 1);
    const a = b.position.clone(), k0 = b.scale.x;
    const q0 = b.quaternion.clone(), q1 = rot ? new T.Quaternion().setFromEuler(rot) : new T.Quaternion();
    return this.s.anim(dur, (e, q) => {
      if (b.userData.mv !== id) return;
      b.position.lerpVectors(a, to, e);
      b.position.y += Math.sin(q * Math.PI) * arc;
      b.quaternion.slerpQuaternions(q0, q1, e);
      if (spin) b.rotateY(spin * Math.PI * 2 * e);
      b.scale.setScalar(k0 + (scale - k0) * e);
    }, Ease.out).then(() => {
      if (b.userData.mv !== id || this.dead) return false;
      b.position.copy(to); b.quaternion.copy(q1); b.scale.setScalar(scale);
      return true;
    });
  }
  squash(b, amt = 0.18) {
    const k = b.scale.x;
    return this.s.anim(0.22, (_, q) => { const w = 1 - Math.sin(q * Math.PI) * amt * (1 - q * 0.5); b.scale.set(k / Math.sqrt(w), k * w, k / Math.sqrt(w)); }).then(() => b.scale.setScalar(k));
  }
  // physics: pin a body still exactly at a pose / let it go again
  freeze(b, pos = b.position, quat = b.quaternion) {
    const body = physics.body(b);
    if (!body) { b.position.copy(pos); b.quaternion.copy(quat); return; }
    body.setBodyType(FIXED, true);
    body.setTranslation({ x: pos.x, y: pos.y, z: pos.z }, true);
    body.setRotation({ x: quat.x, y: quat.y, z: quat.z, w: quat.w }, true);
    b.position.copy(pos); b.quaternion.copy(quat);
  }
  unfreeze(b, spin = true) {
    const body = physics.body(b);
    if (!body) return null;
    body.setBodyType(DYNAMIC, true);
    if (spin) body.lockRotations(false, true);
    body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    body.wakeUp();
    return body;
  }
  // a frozen block's pose can still be shown off (hop, shake): move its fixed body
  moveFixed(b, p) { const body = physics.body(b); if (body) body.setTranslation({ x: p.x, y: p.y, z: p.z }, true); else b.position.copy(p); }

  // ---------------- the tray ----------------
  newBlock(shape, col, extra = false) {
    const b = makeBlock(shape, col, KT);
    b.userData.extra = extra;
    b.userData.state = 'move';
    this.root.add(b);
    b.userData.drag = input.addDrag(b, {
      radius: Math.max(0.62, SHAPES[shape].w * 0.55) * KT, minY: TRAY.floor + SHAPES[shape].h * KT / 2,
      zones: () => this.zones(),
      onPick: () => this.onPick(b),
      onMove: (_t, z) => this.onHover(b, z),
      onDrop: (z, info) => this.drop(b, z, info),
    });
    b.userData.drag.enabled = false;
    return b;
  }
  // lay a row of blocks out along the tray, centred
  traySpots(list) {
    const ws = list.map((b) => SHAPES[b.userData.shape].w * KT);
    const tot = ws.reduce((a, w) => a + w, 0) + GAP * (list.length - 1);
    let x = TRAYP.x - tot / 2;
    return list.map((b, i) => { const p = new T.Vector3(x + ws[i] / 2, TRAY.floor + SHAPES[b.userData.shape].h * KT / 2 + 0.005, TRAYP.z); x += ws[i] + GAP; return p; });
  }
  // blocks hop out of the toy box into the tray, one after another
  fromBox(list, delay = 0) {
    const spots = this.traySpots(list);
    list.forEach((b, i) => {
      b.userData.spot = spots[i];
      b.visible = false;
      this.s.wait(delay + 0.05 + i * 0.07).then(() => {
        if (this.dead) return;
        b.position.copy(BOXP).add(new T.Vector3(0, TOYBOX.h, 0));
        b.scale.setScalar(KT * 0.4);
        b.rotation.set(0, 0, 0);
        b.visible = true;
        sfx.bloop(i % 4);
        this.fly(b, spots[i], { dur: 0.42, arc: 1.6, spin: i % 2 ? 1 : -1, scale: KT }).then((ok) => {
          if (!ok) return;
          ksfx.knock();
          this.squash(b, 0.16);
          b.userData.state = 'tray';
          b.userData.drag.enabled = !this.errorlessOn || !b.userData.extra;
        });
      });
    });
  }
  goBack(b) {
    b.userData.state = 'move';
    b.userData.drag.enabled = false;
    return this.fly(b, b.userData.spot, { dur: 0.36, arc: 0.9, scale: KT }).then((ok) => {
      if (!ok) return;
      ksfx.knock();
      this.squash(b, 0.14);
      b.userData.state = 'tray';
      b.userData.drag.enabled = !(this.errorlessOn && b.userData.extra);
    });
  }

  // ---------------- rounds ----------------
  async startRound(r) {
    this.busy = true;
    const spec = this.spec;
    this.kind = spec.build ? 'build' : spec.roll ? 'roll' : 'stack';
    this.phase = 'setup';
    this.dropN = 0;
    sfx.swoosh();
    if (this.kind === 'build') this.setupBuild(MODELS[spec.build]);
    else if (this.kind === 'roll') this.setupRoll(spec);
    else this.setupStack(spec);
    this.phase = this.kind === 'roll' ? 'roll' : 'build';
    await this.wait(0.12);
    if (this.dead) return;
    this.busy = false;
    // the one demo waits for the first blocks to land in the tray; later rounds just say what to build
    if (r === 0 && !this.demoDone) { await this.wait(0.7); if (this.dead) return; this.cue(); }
    else this.prompt();
  }
  promptText() {
    const s = this.spec;
    if (!s) return '';
    if (this.kind === 'roll') return 'Which one rolls? Tap it!';
    if (this.kind === 'stack') return 'Which one stacks? Put it on top!';
    const m = MODELS[s.build];
    return this.round === 0 ? `Let's build ${m.name}! Copy it!` : `Now ${m.name}!`;
  }
  prompt() { const t = this.promptText(); if (t) this.say(t, { max: 1.5 }); }

  setupBuild(model) {
    this.model = model;
    const slots = (this.slots = model.slots.map((s, i) => ({ ...s, i, filled: false, block: null })));
    const sup = supportsOf(slots);
    slots.forEach((s, i) => { s.sup = sup[i]; s.ready = new Promise((res) => (s.done = res)); });
    // the ghosts fade in on the mat, bottom first
    const order = slots.slice().sort((a, b) => a.y - b.y || a.x - b.x);
    for (const s of slots) {
      const g = (s.ghost = makeGhost(s.shape, K));
      g.position.copy(this.slotCenter(s));
      g.scale.setScalar(0.01);
      this.root.add(g);
      this.s.wait(0.05 + order.indexOf(s) * 0.06).then(() => this.s.tween(g.scale, { x: K, y: K, z: K }, 0.3, Ease.back));
    }
    this.showMini(slots);
    // the blocks for it (and on Levels 2-3 one spare) hop into the tray
    const list = shuffle(slots).map((s) => this.newBlock(s.shape, s.col));
    if (this.plan.extra) {
      const used = new Set(slots.map((s) => s.shape));
      const spare = shuffle(['cube', 'cyl', 'cone', 'ball', 'cuboid', 'roof', 'arch'].filter((k) => !used.has(k)))[0];
      if (spare) list.splice(Math.floor(Math.random() * (list.length + 1)), 0, this.newBlock(spare, shuffle([COL.green, COL.pink, COL.sky, COL.orange])[0], true));
    }
    this.loose = list;
    this.fromBox(list, 0.15);
  }
  // the little model on the stand: each mini block pops in, bottom first
  showMini(slots, { mark = null } = {}) {
    if (!slots.length) { this.s.wait(0.4).then(() => fx.float(new T.Vector3(STANDP.x, STAND.top + 0.4, STANDP.z + 0.3), '?', { color: '#ffffff', size: 11 })); return; }
    const xs = slots.flatMap((s) => [s.x - SHAPES[s.shape].w / 2, s.x + SHAPES[s.shape].w / 2]);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const order = slots.slice().sort((a, b) => a.y - b.y || a.x - b.x);
    this.minis = slots.map((s) => {
      const m = makeBlock(s.shape, s.col, MINI);
      m.position.set((s.x - cx) * MINI, (s.y + SHAPES[s.shape].h / 2) * MINI, 0);
      m.userData.rest = m.position.clone();
      m.visible = false;
      this.mini.add(m);
      const k = order.indexOf(s);
      this.s.wait(0.1 + k * 0.08).then(() => { if (this.dead) return; ksfx.tick(k); popIn(this.s, m, MINI, 0.32, { sound: false }); });
      return m;
    });
    // the stand gives the new model one turn so you can see it all round
    const r0 = this.mini.userData.r0 ?? (this.mini.userData.r0 = this.mini.rotation.y);
    this.s.anim(0.9, (e) => { this.mini.rotation.y = r0 + e * Math.PI * 2; }, Ease.inOut).then(() => { this.mini.rotation.y = r0; });
    if (mark) { const q = new T.Vector3(mark.x, mark.y, 0); this.mini.localToWorld(q); this.s.wait(0.5).then(() => fx.float(q, '?', { color: '#ffffff', size: 9 })); }
  }

  // ---------------- dragging ----------------
  onPick(b) {
    if (b.userData.state !== 'tray') return;
    this.carrying = b;
    this.idle = 0;
    fx.clearHands();
    this.s.stop(b.scale);
    this.s.tween(b.scale, { x: KT * 1.12, y: KT * 1.12, z: KT * 1.12 }, 0.14, Ease.back);
    // what is it called? (the caption names the shape)
    this.say(`${an(b.userData.shape)[0].toUpperCase()}${an(b.userData.shape).slice(1)}!`, { max: 0.6 });
  }
  onHover(b, z) {
    const on = z && (z.shape === 'any' || z.shape === b.userData.shape) && z.open ? z : null;
    if ((on && on.id) === (this.hoverZ && this.hoverZ.id) && !!on === !!this.hoverZ) return;
    this.hoverZ = on;
    if (on) sfx.tick();
  }

  async drop(b, zone, { tapped = false } = {}) {
    this.carrying = null;
    this.hoverZ = null;
    if (this.dead || b.userData.state !== 'tray') return;
    this.s.stop(b.scale);
    b.scale.setScalar(KT);
    if (this.phase !== 'build' || this.busy) { this.goBack(b); return; }
    if (!zone) {
      this.goBack(b);
      if (tapped) { ksfx.knock(); fx.float(b.position.clone().add(new T.Vector3(0, 0.9, 0.3)), '♪', { color: hexCss(b.userData.col), size: 6 }); }
      return;
    }
    const shape = b.userData.shape, nm = name(shape);
    if (this.kind === 'stack') {
      if (shape === this.answer) return this.place(b, this.topSlot);
      return this.rollOff(b);
    }
    let slot = zone.slot;
    const mine = this.slots.filter((s) => !s.filled && s.shape === shape);
    const open = mine.find((s) => this.isOpen(s));
    // the same shape higher up (a second cube on a tower): it goes to the one that is ready
    if (slot.shape === shape && !this.isOpen(slot) && open) slot = open;
    if (slot.shape !== shape) {
      // Level 1 is forgiving: a needed block dropped anywhere on the build goes to its own spot
      const own = open || mine[0];
      if (this.level === 0 && own) slot = own;
      else {
        this.goBack(b);
        if (b.userData.extra) { this.redirect(`We don't need ${an(shape)}!`); return; }
        this.flashGhosts(shape);
        this.redirect(`Find the ${nm} shape!`);
        return;
      }
    }
    if (!this.isOpen(slot)) {
      this.goBack(b);
      this.flashGhosts(null, slot.sup.filter((q) => !q.filled));
      this.redirect('Bottom first!');
      return;
    }
    this.place(b, slot);
  }
  flashGhosts(shape, list = null) {
    const gs = (list || this.slots.filter((s) => !s.filled && s.shape === shape)).map((s) => s.ghost).filter(Boolean);
    for (const g of gs) g.userData.flash = 1.2;
  }

  // a block flies over its slot and drops in with physics, then settles, pinned
  async place(b, slot) {
    slot.filled = true;
    slot.block = b;
    b.userData.state = 'placed';
    b.userData.drag.enabled = false;
    input.remove(b.userData.drag);
    this.loose = this.loose.filter((x) => x !== b);
    this.idle = 0;
    this.clearHints();
    fx.clearHands();
    const p = this.slotCenter(slot);
    const above = p.clone().add(new T.Vector3(0, 0.55, 0));
    sfx.swoosh();
    const ok = await this.fly(b, above, { dur: 0.26, arc: 1.2 });
    if (!ok || this.dead) return;
    // wait for whatever it stands on
    await Promise.all(slot.sup.map((q) => q.ready));
    if (this.dead) return;
    if (slot.ghost) { const g = slot.ghost; slot.ghost = null; popOut(this.s, g, 0.12).then(() => this.gone(g)); }
    if (physics.ok) {
      physics.add(b, { spin: false, bounce: 0.12, friction: 0.9 });
      physics.body(b).setLinvel({ x: 0, y: -1.5, z: 0 }, true);
      const t0 = performance.now();
      while (!this.dead) {
        await this.wait(1 / 60);
        const el = (performance.now() - t0) / 1000;
        const body = physics.body(b);
        if (!body) break;
        const v = body.linvel();
        if ((el > 0.16 && Math.abs(v.y) < 0.25) || el > 0.6) break;
      }
      if (this.dead) return;
      this.freeze(b, p, new T.Quaternion());
    } else {
      await this.fly(b, p, { dur: 0.12, arc: 0 });
      this.squash(b, 0.2);
    }
    this.placedB.push(b);
    const n = this.dropN++;
    ksfx.tok(n);
    const sc = project(p);
    fx.sparkle(sc.x, sc.y);
    // its twin on the stand hops, Bear nods
    const m = this.minis[slot.i];
    if (m) this.s.anim(0.3, (_, q) => { m.position.y = m.userData.rest.y + Math.sin(q * Math.PI) * 0.25; }).then(() => m.position.copy(m.userData.rest));
    const bh = this.bear.userData.head;
    if (bh) this.s.anim(0.25, (_, q) => { bh.rotation.x = Math.sin(q * Math.PI) * 0.22; }).then(() => { bh.rotation.x = 0; });
    slot.done();
    if (this.slots.every((s) => s.filled) && this.phase === 'build') {
      await Promise.all(this.slots.map((s) => s.ready));
      if (!this.dead && this.phase === 'build') this.complete();
    }
  }

  // the stack twist: a ball put on the tower rolls straight off (physics), then hops back to the tray
  async rollOff(b) {
    b.userData.state = 'placed';
    b.userData.drag.enabled = false;
    const top = this.slotCenter(this.topSlot).add(new T.Vector3(0.12, 0.6, 0));
    const ok = await this.fly(b, top, { dur: 0.26, arc: 1.2 });
    if (!ok || this.dead) return;
    this.redirect(`Oops! The ${name(b.userData.shape)} rolls off!`);
    if (physics.ok) {
      physics.add(b, { shape: 'ball', r: 0.5 * K, bounce: 0.3, friction: 0.8 });
      physics.body(b).setLinvel({ x: 1.6, y: -0.5, z: 0.25 }, true);
      ksfx.roll(0.8);
      await this.wait(0.8);
      if (this.dead || b.userData.state === 'gone') return;
      physics.remove(b);
    }
    if (b.userData.state === 'gone') return;
    sfx.boing && sfx.boing();
    b.userData.state = 'tray';
    this.goBack(b);
  }

  // ---------------- the finished build ----------------
  complete() {
    this.phase = 'done';
    const list = this.slots.map((s) => s.block).filter(Boolean).sort((a, c) => a.position.y - c.position.y);
    const topY = Math.max(...list.map((b) => b.position.y + (b.userData.h * K) / 2));
    const xs = list.map((b) => b.position.x);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    // a xylophone run up the build: each block hops in turn
    ksfx.run(list.length);
    list.forEach((b, i) => this.s.wait(i * 0.07).then(() => {
      const rest = b.position.clone();
      this.s.anim(0.22, (_, q) => { this.moveFixed(b, rest.clone().add(new T.Vector3(0, Math.sin(q * Math.PI) * 0.18, 0))); }).then(() => this.moveFixed(b, rest));
    }));
    // the glow behind it
    this.halo.position.set(cx, topY / 2 + 0.2, MATP.z - 0.9);
    this.halo.scale.setScalar(Math.max(3.5, topY * 1.8));
    this.s.anim(1.0, (_, p) => { this.halo.material.opacity = Math.sin(Math.min(1, p * 1.4) * Math.PI) * 0.55; }).then(() => { this.halo.material.opacity = 0; });
    this.gag(this.model?.gag, list, cx, topY);
    // Bear cheers
    const bf = this.bear.userData.face;
    if (bf) { setFace(bf, 'joy'); this.s.wait(1.2).then(() => setFace(bf, 'happy')); }
    const arms = this.bear.userData.arms;
    if (arms) this.s.anim(0.8, (_, p) => { const up = Math.sin(Math.min(1, p * 1.4) * Math.PI) * 2.2; arms[0].rotation.z = this.bearArms[0].z + up; arms[1].rotation.z = this.bearArms[1].z - up; }).then(() => { arms[0].rotation.z = this.bearArms[0].z; arms[1].rotation.z = this.bearArms[1].z; });
    this.success(new T.Vector3(cx, topY + 0.8, MATP.z + 0.5), this.kind === 'stack' ? 'The cube stacks!' : `You built ${this.model.name}!`);
    // while the praise shows, Bear stomps and the build topples (real physics)
    this.crashP = this.s.wait(0.42).then(() => this.topple());
  }
  gag(kind, list, cx, topY) {
    const top = list[list.length - 1];
    if (kind === 'flag' && top) {
      const f = (this.flag = makeFlag([COL.red, COL.yellow, COL.blue, COL.pink][this.round % 4]));
      const y = top.userData.shape === 'cone' || top.userData.shape === 'roof' ? top.position.y + top.userData.h * K / 2 - 0.12 : top.position.y + top.userData.h * K / 2;
      f.position.set(top.position.x, y, top.position.z);
      this.root.add(f);
      this.s.wait(0.25).then(() => { if (!this.dead) { sfx.pop(); popIn(this.s, f, 1, 0.4, { sound: false }); } });
    } else if (kind === 'rocket') {
      // the rocket rumbles, lifts off a little in a puff of smoke and lands again
      ksfx.blast();
      const rest = list.map((b) => b.position.clone());
      this.s.anim(0.75, (_, p) => {
        const lift = Math.sin(p * Math.PI) * 0.7, sh = Math.sin(p * 70) * 0.03 * (1 - p);
        list.forEach((b, i) => this.moveFixed(b, rest[i].clone().add(new T.Vector3(sh, lift, 0))));
      }).then(() => { list.forEach((b, i) => this.moveFixed(b, rest[i])); sfx.land(); });
      for (let i = 0; i < 6; i++) this.s.wait(0.04 + i * 0.07).then(() => this.puff(new T.Vector3(cx + (i % 2 ? 0.55 : -0.55) + (Math.random() - 0.5) * 0.3, MAT.top + 0.25, MATP.z + 0.5 + Math.random() * 0.3)));
    } else if (kind === 'leaves') {
      for (let i = 0; i < 3; i++) this.s.wait(0.1 + i * 0.12).then(() => fx.float(new T.Vector3(cx + (i - 1) * 0.5, MAT.top + topY + 0.2, MATP.z + 0.5), '♥', { color: '#4cc75a', size: 7 }));
      sfx.twinkle();
    } else {
      sfx.twinkle();
    }
  }

  // take something out of the scene for good (its own materials / geometry freed; shared ones are kept)
  gone(o) { if (o.parent) o.parent.remove(o); disposeTree(o); }
  // a soft white smoke puff that swells, drifts up and fades
  puff(p) {
    if (this.dead) return;
    const m = new T.Mesh(geo.sphere(0.32, 14, 10), toonUnique(0xffffff, { transparent: true, opacity: 0.9 }));
    m.position.copy(p);
    this.root.add(m);
    this.s.anim(0.6, (e) => { m.scale.setScalar(0.5 + e * 1.3); m.position.y = p.y + e * 0.7; m.material.opacity = 0.9 * (1 - e); }, Ease.out).then(() => { this.root.remove(m); m.material.dispose(); });
  }

  async afterSuccess() {
    // Bear stomps, the build topples over (real physics), then everything hops back into the toy box
    if (this.crashP) { await this.crashP; this.crashP = null; }
    else {
      // let the roll play out: until it reaches the tray or slows right down (at most ~0.8 s more)
      const b = this.choices.find((c) => c.userData.state === 'rolling');
      for (let i = 0; i < 48 && b && !this.dead; i++) {
        const body = physics.body(b);
        if (!body) break;
        const v = body.linvel();
        if (b.position.z > TRAYP.z - 1.3 || (i > 10 && Math.hypot(v.x, v.y, v.z) < 0.3)) break;
        await this.wait(1 / 60);
      }
      await this.wait(0.2);
    }
    if (this.dead) return;
    this.sweep();
    await this.wait(0.15);
  }
  async topple() {
    const list = this.placedB.slice();
    if (!list.length || !physics.ok || this.dead) return;
    hop(this.s, this.bear, 0.45, 0.3);
    await this.wait(0.28);
    if (this.dead) return;
    sfx.thunk();
    ksfx.crash(list.length);
    const d = (this.knockDir = -this.knockDir);
    const base = Math.min(...list.map((b) => b.position.y));
    for (const b of list) {
      const body = this.unfreeze(b);
      if (!body) continue;
      const up = (b.position.y - base) / K;
      physics.impulse(b, { x: d * (0.6 + up * 0.9) + (Math.random() - 0.5) * 0.6, y: 1.2 + Math.random() * 0.8, z: -(0.8 + up * 0.9) - Math.random() * 0.5 },
        { x: -(0.6 + Math.random() * 0.5), y: (Math.random() - 0.5) * 0.4, z: -d * (0.5 + Math.random() * 0.4) });
    }
    if (this.flag) { const f = this.flag; this.flag = null; popOut(this.s, f, 0.18).then(() => this.gone(f)); }
    await this.wait(0.42);
  }
  // clear the round: every block hops into the toy box, the model and the ghosts pop away, the ramp folds away
  sweep() {
    const all = [...this.placedB, ...this.loose, ...this.choices, ...this.strays];
    this.placedB = []; this.loose = []; this.choices = []; this.strays = [];
    const into = BOXP.clone().add(new T.Vector3(0, TOYBOX.h * 0.7, 0));
    all.forEach((b, i) => {
      if (b.userData.drag) input.remove(b.userData.drag);
      if (b.userData.tap) input.remove(b.userData.tap);
      physics.remove(b);
      b.userData.state = 'gone';
      this.s.wait(i * 0.035).then(() => this.fly(b, into, { dur: 0.36, arc: 1.4 + Math.random() * 0.6, scale: K * 0.3 })).then(() => {
        this.root.remove(b);
        if (i % 2 === 0) ksfx.knock();
      });
    });
    for (const s of this.slots) if (s.ghost) { const g = s.ghost; s.ghost = null; popOut(this.s, g, 0.15).then(() => this.gone(g)); }
    this.slots = [];
    for (const m of this.minis) { const mm = m; popOut(this.s, mm, 0.18).then(() => this.mini.remove(mm)); }
    this.minis = [];
    this.topZone = null; this.topSlot = null;
    this.topGlow.material.opacity = 0;
    if (this.flag) { const f = this.flag; this.flag = null; popOut(this.s, f, 0.15).then(() => this.gone(f)); }
    if (this.ramp) {
      const r = this.ramp, h = this.rampHelper;
      this.ramp = null; this.rampHelper = null;
      physics.remove(h); this.gone(h);
      this.s.wait(0.2).then(() => popOut(this.s, r, 0.25)).then(() => this.root.remove(r));
    }
  }

  // ---------------- Level 3: which one rolls? ----------------
  setupRoll(spec) {
    // the ramp unfolds on the mat
    // (turned a little so its side shows the slope)
    const r = (this.ramp = makeRamp());
    r.position.set(MATP.x, MAT.top, MATP.z - 0.1);
    r.rotation.y = RYAW;
    this.root.add(r);
    popIn(this.s, r, 1, 0.4);
    const h = (this.rampHelper = new T.Mesh(rampGeo(), new T.MeshBasicMaterial({ visible: false })));
    h.position.copy(r.position);
    h.rotation.y = RYAW;
    this.root.add(h);
    if (physics.ok) { physics.add(h, { friction: 1.0, bounce: 0.1 }); physics.body(h).setBodyType(FIXED, true); }
    // the three blocks sit high on the slope, one in each lane
    const a = RAMP.ang, zl = -0.45, yaw = new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), RYAW);
    const n = new T.Vector3(0, Math.cos(a), Math.sin(a)).applyQuaternion(yaw);
    const lanes = RAMP.lanes;
    this.choices = shuffle(spec.roll).map(([shape, col], i) => {
      const b = makeBlock(shape, col, KR);
      b.userData.state = 'move';
      this.root.add(b);
      const lying = shape === 'cyl';
      const rot = new T.Euler().setFromQuaternion(yaw.clone().multiply(new T.Quaternion().setFromEuler(new T.Euler(a, 0, lying ? Math.PI / 2 : 0))));
      const at = new T.Vector3(lanes[i], rampY(zl), zl).applyQuaternion(yaw).add(r.position).addScaledVector(n, 0.5 * KR + 0.01);
      b.userData.tap = input.addTap(b, { radius: 0.75, onTap: () => this.tapChoice(b) });
      b.userData.tap.enabled = false;
      b.visible = false;
      this.s.wait(0.25 + i * 0.1).then(() => {
        if (this.dead) return;
        b.position.copy(BOXP).add(new T.Vector3(0, TOYBOX.h, 0));
        b.scale.setScalar(KR * 0.4);
        b.visible = true;
        sfx.bloop(i);
        this.fly(b, at, { dur: 0.42, arc: 1.4, rot, scale: KR }).then((ok) => {
          if (!ok) return;
          ksfx.knock();
          if (physics.ok) {
            physics.add(b, shape === 'ball' ? { shape: 'ball', r: 0.5 * KR, friction: 1.0, bounce: 0.1 } : { friction: 1.0, bounce: 0.1 });
            this.freeze(b, at, b.quaternion);
          }
          b.userData.state = 'ramp';
          b.userData.tap.enabled = true;
        });
      });
      return b;
    });
    this.showMini([]);
  }
  tapChoice(b) {
    if (this.dead || this.phase !== 'roll' || b.userData.state !== 'ramp' || this.busy) return;
    this.idle = 0;
    this.clearHints();
    fx.clearHands();
    const shape = b.userData.shape;
    const down = new T.Vector3(0, -Math.sin(RAMP.ang), Math.cos(RAMP.ang)).applyAxisAngle(new T.Vector3(0, 1, 0), RYAW);   // down the slope, toward us
    if (shape === this.answer) {
      this.phase = 'done';
      b.userData.state = 'rolling';
      b.userData.tap.enabled = false;
      const body = this.unfreeze(b);
      if (body) body.setLinvel({ x: down.x * 1.2, y: down.y * 1.2, z: down.z * 1.2 }, true);
      ksfx.roll(1.2);
      const bf = this.bear.userData.face;
      if (bf) { setFace(bf, 'joy'); this.s.wait(1.2).then(() => setFace(bf, 'happy')); }
      this.success(b.position.clone().add(new T.Vector3(0, 1, 1.4)), `The ${name(shape)} rolls!`);
      return;
    }
    // it gets a little push... and stays put (it's flat underneath)
    b.userData.state = 'test';
    const body = this.unfreeze(b, false);
    if (body) body.setLinvel({ x: down.x * 0.7, y: down.y * 0.7, z: down.z * 0.7 }, true);
    ksfx.knock();
    this.redirect(`The ${name(shape)} stays still!`);
    this.s.wait(0.6).then(() => {
      if (this.dead || b.userData.state !== 'test') return;
      this.freeze(b);
      b.userData.state = 'ramp';
      if (this.errorlessOn) b.userData.tap.enabled = false;
    });
  }
  choicePoints() { return this.kind === 'roll' ? this.choices.map((c) => c.position.clone()) : null; }

  // ---------------- Level 3: which one stacks? ----------------
  setupStack(spec) {
    // a two-cube tower hops onto the mat
    const slots = (this.slots = [{ shape: 'cube', x: 0, y: 0, col: spec.tower[0] }, { shape: 'cube', x: 0, y: 1, col: spec.tower[1] }]
      .map((s, i) => ({ ...s, i, filled: true, sup: [], ready: Promise.resolve(), done() {} })));
    slots.forEach((s, i) => {
      const b = makeBlock('cube', s.col, K);
      b.userData.state = 'placed';
      this.root.add(b);
      s.block = b;
      const p = this.slotCenter(s);
      b.visible = false;
      this.s.wait(0.1 + i * 0.14).then(() => {
        if (this.dead) return;
        b.position.copy(BOXP).add(new T.Vector3(0, TOYBOX.h, 0));
        b.scale.setScalar(K * 0.4);
        b.visible = true;
        this.fly(b, p, { dur: 0.4, arc: 1.6 }).then((ok) => {
          if (!ok) return;
          ksfx.tok(i);
          if (physics.ok) { physics.add(b, { spin: false, bounce: 0.1 }); this.freeze(b, p, new T.Quaternion()); }
          this.placedB.push(b);
        });
      });
    });
    // the top: a "?" glow where the next block goes
    const top = (this.topSlot = { shape: this.answer, x: 0, y: 2, i: 2, sup: slots, filled: false, ready: Promise.resolve(), done() {} });
    slots.push(top);
    this.topZone = { id: 'top', slot: top, shape: 'any', open: true, pos: this.slotCenter(top), radius: 1.1 * K };
    this.topGlow.position.copy(this.slotCenter(top));
    this.model = { name: 'a tower', gag: 'flag' };
    this.showMini(slots.slice(0, 2).map((s) => ({ shape: 'cube', x: 0, y: s.y, col: s.col })), { mark: new T.Vector3(0, 2.5 * MINI, 0) });
    // a ball and a cube in the tray
    this.loose = shuffle(spec.stack).map(([shape, col]) => this.newBlock(shape, col));
    this.fromBox(this.loose, 0.3);
  }

  // ---------------- hints ----------------
  nudgeTarget() {
    if (this.kind === 'roll') return this.phase === 'roll' ? this.choices.find((c) => c.userData.shape === this.answer) || null : null;
    return this.phase === 'build' ? this.pair()?.b || null : null;
  }
  nudge(step) {
    const b = this.nudgeTarget();
    if (!b) return super.nudge(step);
    sfx.boing && sfx.boing();
    if (this.kind === 'roll') {
      // a pinned block on the ramp: a happy wobble in size
      this.s.anim(0.45, (_, q) => b.scale.setScalar(KR * (1 + Math.sin(q * Math.PI * 2) * 0.1 * (1 - q)))).then(() => b.scale.setScalar(KR));
    } else if (b.userData.state === 'tray' && b.userData.spot) {
      const sp = b.userData.spot, id = b.userData.mv;
      this.s.anim(0.45, (_, q) => { if (b.userData.mv !== id || b.userData.state !== 'tray' || this.carrying === b) return; b.position.y = sp.y + Math.sin(q * Math.PI) * 0.5; }).then(() => { if (b.userData.mv === id && b.userData.state === 'tray' && this.carrying !== b) b.position.copy(sp); });
    }
    if (step >= 2) { const stop = fx.halo(b, 0.9); this.s.wait(3).then(stop); }
  }
  showHint(glowOn = true) {
    if (this.kind === 'roll') {
      const b = this.nudgeTarget();
      if (b) { if (glowOn) this.addHalo(b, 0.9); fx.ghostPath([b.position.clone()], { mode: 'tap' }); }
      return;
    }
    const pr = this.pair();
    if (!pr) return;
    if (glowOn) this.addHalo(pr.b, 0.9);
    fx.ghostPath([pr.b.position.clone(), pr.z.pos.clone()], { mode: 'drag' });
  }
  makeErrorless() {
    if (this.kind === 'roll') {
      for (const c of this.choices) if (c.userData.shape !== this.answer && c.userData.tap) c.userData.tap.enabled = false;
    } else {
      for (const b of this.loose) if ((b.userData.extra || (this.kind === 'stack' && b.userData.shape !== this.answer)) && b.userData.drag) b.userData.drag.enabled = false;
    }
    const t = this.nudgeTarget();
    if (t) this.addHalo(t, 0.9);
  }
  onFinale() { hop(this.s, this.bear, 0.6, 0.4).then(() => hop(this.s, this.bear, 0.4, 0.35)); }

  // ---------------- every frame ----------------
  update(dt, t) {
    // ghosts: open spots glow softly; ones still waiting for their base are fainter; the carried block's own
    // shape lights up in its colour, and brightest under the finger
    const car = this.carrying && input.dragging() ? this.carrying : null;
    for (const s of this.slots) {
      const g = s.ghost;
      if (!g) continue;
      const open = this.isOpen(s);
      const fl = g.userData.flash || 0;
      if (fl > 0) g.userData.flash = Math.max(0, fl - dt);
      let fill = open ? 0.26 : 0.14, rim = open ? 0.75 : 0.45, col = 0xffffff;
      if (car && car.userData.shape === s.shape) {
        const k = 0.5 + 0.5 * Math.sin(t * 7);
        col = car.userData.col;
        fill = (open ? 0.32 : 0.14) + k * 0.12;
        rim = open ? 0.95 : 0.4;
        if (this.hoverZ && this.hoverZ.slot === s) { fill = 0.6; rim = 1; }
      }
      if (fl > 0) { const k = 0.5 + 0.5 * Math.sin(t * 14); fill = Math.max(fill, 0.25 + k * 0.3); rim = 1; }
      setGhost(g, fill, rim, col);
    }
    // the "?" spot on top of the stack tower
    if (this.topZone && this.phase === 'build') {
      this.topGlow.material.opacity = 0.35 + Math.sin(t * 4) * 0.15 + (this.hoverZ === this.topZone ? 0.3 : 0);
      this.topGlow.scale.setScalar(1.6 + Math.sin(t * 4) * 0.1);
    } else this.topGlow.material.opacity = 0;
  }
}
