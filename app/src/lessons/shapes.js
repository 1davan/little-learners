// Lesson 3 — Shape house. Topic mt_KJeEeTutJI "2-D shapes".
// Drag each shape to its matching window. Later pieces are small, tilted or upside-down: a shape is still a shape.
// Level 1 is a cottage, Level 2 a toy train, Level 3 a castle; every round brings a new piece look, entrance and gag.
// Pieces arrive with real physics (dropped, tossed by Pip, rolled in, popped out of a chimney/funnel/tower),
// a wrong window bonks them off to tumble on the grass, and a filled window spills goodies that bounce and pile up.
import * as T from '../three.js';
import { Lesson } from '../engine/lesson.js';
import { toon, basic } from '../engine/toon.js';
import { C, popIn, popOut, wiggle, shake, makeAnimal, hop } from '../engine/actors.js';
import { camera } from '../engine/stage.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { physics } from '../engine/physics.js';
import { Ease } from '../engine/tween.js';
import { SYM, makeHole, makePiece, pieceFace, lightWindow } from './shapes-parts.js';
import { THEMES, WALL_Z, makeGoodie, addGag } from './shapes-themes.js';
import { frame, calmBackdrop, isTree, retint } from './view-tools.js';

// accessories that change a piece's outline: they arrive as the payoff (on the lit window), never on the piece
const LATE_GAGS = ['hat', 'crown', 'bow', 'flower'];

const HOLE_Y = 3.2;
const SPAWN = new T.Vector3(0, 0.95, 4);
const LAYOUT = { 2: [-2.2, 2.2], 3: [-3, 0, 3], 4: [-3.6, -1.2, 1.2, 3.6] };
const NAME = { circle: 'circle', square: 'square', triangle: 'triangle', rect: 'rectangle' };
const Cap = (k) => NAME[k][0].toUpperCase() + NAME[k].slice(1);
const ALL = ['circle', 'square', 'triangle', 'rect'];
const PEEK_SND = { bunny: 'boing2', cat: 'meow', frog: 'ribbit', bear: 'mmm', elephant: 'trumpet', hedgehog: 'squeak' };

// Per level: facade theme, piece look, which windows appear when, and six rounds.
// Round: kind, s (scale), rot (tilt), col, enter (door | spout | drop | toss | roll), gag (piece accessory or antic),
// peek (friend in the window), spill (goodies that tumble out of the filled window).
const PLANS = [
  {
    theme: 'house', deco: 'face', holes: { 0: ['circle', 'square'], 2: ['circle', 'square', 'triangle'] },
    rounds: [
      { kind: 'circle', s: 1, rot: 0, col: C.red, enter: 'door', gag: 'hat', peek: 'bunny', spill: 'flowers' },
      { kind: 'square', s: 1, rot: 0, col: C.blue, enter: 'spout', gag: 'sneeze', peek: 'cat', spill: 'apples' },
      { kind: 'triangle', s: 1, rot: 0, col: C.yellow, enter: 'drop', gag: 'bow', peek: 'frog', spill: 'balls' },
      { kind: 'square', s: 0.7, rot: 0.5, col: C.green, enter: 'toss', gag: 'glasses', peek: 'bear', spill: 'flowers' },
      { kind: 'triangle', s: 0.85, rot: Math.PI, col: C.orange, enter: 'roll', gag: 'flower', peek: 'hedgehog', spill: 'apples' },
      { kind: 'circle', s: 1.15, rot: 0, col: C.purple, enter: 'door', gag: 'wink', peek: 'elephant', spill: 'stars' },
    ],
  },
  {
    theme: 'train', deco: 'dots', holes: { 0: ['circle', 'square', 'triangle'], 2: ALL },
    rounds: [
      { kind: 'circle', s: 1, rot: 0, col: C.orange, enter: 'spout', gag: 'hat', peek: 'cat', spill: 'balls' },
      { kind: 'triangle', s: 1, rot: 0, col: C.pink, enter: 'roll', gag: 'sneeze', peek: 'bunny', spill: 'candy' },
      { kind: 'rect', s: 1, rot: 0, col: C.green, enter: 'toss', gag: 'glasses', peek: 'elephant', spill: 'balls' },
      { kind: 'square', s: 0.7, rot: 0.6, col: C.red, enter: 'drop', gag: 'bow', peek: 'frog', spill: 'candy' },
      { kind: 'triangle', s: 0.8, rot: Math.PI, col: C.blue, enter: 'spout', gag: 'wink', peek: 'hedgehog', spill: 'stars' },
      { kind: 'rect', s: 0.8, rot: Math.PI / 2, col: C.purple, enter: 'roll', gag: 'flower', peek: 'bear', spill: 'balls' },
    ],
  },
  {
    theme: 'castle', deco: 'gem', holes: { 0: ['circle', 'square', 'triangle'], 2: ALL, 3: ALL },
    rounds: [
      { kind: 'circle', s: 1, rot: 0, col: 0x9b6bd9, enter: 'door', gag: 'crown', peek: 'bear', spill: 'coins' },
      { kind: 'triangle', s: 1, rot: 0, col: 0x3bc6d9, enter: 'spout', gag: 'sneeze', peek: 'frog', spill: 'gems' },
      { kind: 'rect', s: 1, rot: 0, col: 0xff5aa8, enter: 'drop', gag: 'bow', peek: 'cat', spill: 'coins' },
      { kind: 'square', s: 0.7, rot: 0.6, col: 0x5ad97a, enter: 'toss', gag: 'wink', peek: 'elephant', spill: 'stars' },
      { kind: 'triangle', s: 0.8, rot: Math.PI, col: 0xffb03b, enter: 'roll', gag: 'glasses', peek: 'bunny', spill: 'gems' },
      { kind: 'rect', s: 0.8, rot: Math.PI / 2, col: 0x4a90ff, enter: 'door', gag: 'crown', peek: 'hedgehog', spill: 'coins' },
    ],
  },
];

const PAYOFF = ['spin', 'bounce', 'flash']; // what the window does when it fills (rotates per round, never twice in a row)

export default class ShapesLesson extends Lesson {
  build() {
    const P = PLANS[this.level];
    this.P = P;
    this.plan = P.rounds;
    this.holeKinds = P.holes;
    const th = THEMES[P.theme]();
    this.th = th;
    this.house = th.group;
    this.door = th.door;
    this.lamps = th.lamps;
    this.root.add(this.house);
    // the facade is solid for things that bounce
    physics.box(th.wallBox[0], th.wallBox[1]);
    this.holes = [];
    this.litKinds = new Set();
    this.goodies = [];
    this.fitted = [];
    this.setHoles(this.holeKinds[0], false);
    frame(0, 3.5, 13.2, 0, 2.5, 0);
    calmBackdrop(this.meadow, { hide: (o) => (isTree(o) && Math.abs(o.position.x) < 8) });
    this.pip.position.set(-6.4, 0, 0.6);
  }

  // stuck child: the piece hops
  nudgeTarget() { const p = this.piece; return p && p.userData.ready && !p.userData.done ? p : null; }

  // the scale at which the piece (on its drag plane) looks the same size as its window on screen, so it visibly fits
  fitScale(p) {
    const hole = this.holes.find((h) => h.userData.kind === p.userData.kind) || this.holes[0];
    if (!hole) return p.userData.scale;
    const hz = hole.getWorldPosition(new T.Vector3()).z, cz = camera.position.z;
    return 0.98 * hole.scale.x * (cz - p.position.z) / (cz - hz);
  }

  // Windows that stay keep their light and their party hat / crown and slide to their new place; only new ones pop in.
  setHoles(kinds, animate = true) {
    const xs = LAYOUT[kinds.length];
    const old = this.holes;
    this.holes = kinds.map((k, i) => {
      // the train's last window would overlap the engine: shift the row left a little
      const x = xs[i] + (this.P.theme === 'train' && kinds.length === 4 ? -0.4 : 0);
      const keep = old.find((h) => h.userData.kind === k);
      if (keep) {
        if (animate) this.s.tween(keep.position, { x }, 0.35, Ease.inOut); else keep.position.x = x;
        return keep;
      }
      const h = makeHole(k, this.th.hole);
      h.position.set(x, HOLE_Y, WALL_Z);
      if (this.litKinds.has(k)) lightWindow(h);
      this.house.add(h);
      if (animate) popIn(this.s, h);
      return h;
    });
    for (const h of old) if (!this.holes.includes(h)) { if (animate) popOut(this.s, h, 0.2).then(() => this.house.remove(h)); else this.house.remove(h); }
  }

  zones() {
    return this.holes.map((h) => ({ obj: h, radius: 1.3, hole: h, enabled: h.userData.enabled !== false }));
  }

  async startRound(r) {
    const R = this.plan[r];
    if (this.demoDone) this.cue();
    const kinds = this.holeKinds[r];
    if (kinds) {
      this.setHoles(this.level === 2 && r >= 3 ? kinds.slice().reverse() : kinds, r > 0);
      if (r > 0) sfx.sparkle();
    }
    for (const h of this.holes) { h.userData.enabled = true; h.scale.setScalar(1); }

    const p = makePiece(R.kind, R.col, this.P.deco);
    p.userData.scale = R.s;
    p.userData.rot = R.rot;
    p.userData.inner.rotation.z = R.rot;
    p.updateMatrixWorld(true);
    const top = new T.Box3().setFromObject(p).max.y;
    p.userData.gag = LATE_GAGS.includes(R.gag) ? null : addGag(p, R.gag, top);
    this.root.add(p);
    this.piece = p;
    this.magnet = null;
    await this.enter(p, R.enter, R.s);
    if (this.dead || this.piece !== p) return;
    p.userData.ready = true;
    this.antic(p, R.gag);
    this.target = input.addDrag(p, {
      radius: 1.0,
      minY: 0.6,
      zones: () => this.zones(),
      onPick: () => {
        this.unphys(p);
        p.quaternion.identity();
        pieceFace(p, 'oh');
        sfx.pick();
        // shrink / grow to the window's size as it lifts, so it visibly fits its hole
        const sc = this.fitScale(p);
        this.s.tween(p.scale, { x: sc, y: sc, z: sc }, 0.15, Ease.back);
      },
      onMove: (_t, z) => this.pull(z),
      onDrop: (z, info) => this.drop(z, info),
    });
    if (!this.demoDone) this.cue();
  }

  // ---- physics helpers: pieces only spin in the picture plane, so they roll and tumble but stay readable ----
  phys(p) {
    const sc = p.userData.scale;
    p.scale.setScalar(sc);
    const opts = p.userData.kind === 'circle' ? { shape: 'ball', r: 0.7 * sc, bounce: 0.4 } : { shape: 'box', bounce: 0.35 };
    const b = physics.add(p, { ...opts, friction: 0.8 });
    if (b) b.setEnabledRotations(false, false, true, true);
    return b;
  }
  unphys(p) { if (physics.has(p)) physics.remove(p); p.userData.settling = false; }
  // after physics: hop back up to the spawn spot, standing straight
  async settle(p, dur = 0.18) {
    this.unphys(p);
    if (this.piece !== p || p.userData.done) return;
    p.userData.settling = true;
    const from = p.position.clone(), q0 = p.quaternion.clone(), id = new T.Quaternion(), inner = p.userData.inner, r0 = inner.rotation.z;
    await this.s.anim(dur, (e, q) => {
      if (!p.userData.settling) return; // picked up meanwhile
      p.position.lerpVectors(from, SPAWN, e);
      p.position.y += Math.sin(q * Math.PI) * 0.4;
      p.quaternion.slerpQuaternions(q0, id, e);
      inner.rotation.z = r0 + (p.userData.rot - r0) * e;
    }, Ease.out);
    if (!p.userData.settling) return;
    p.userData.settling = false;
    p.position.copy(SPAWN);
    p.quaternion.identity();
    inner.rotation.z = p.userData.rot;
  }
  restAt() { return new T.Vector3(SPAWN.x, 0.75 * this.piece.userData.scale, SPAWN.z); }
  async tossTo(p, from, { arc = 1.5, time = 0.55, spinZ = -6 } = {}) {
    p.position.copy(from);
    p.updateMatrixWorld(true);
    if (!physics.ok || !this.phys(p)) { p.position.copy(SPAWN); return; }
    const pr = physics.toss(p, this.restAt(), { arc, time, maxT: Math.min(0.62, time + 0.12), spin: 0 });
    physics.body(p)?.setAngvel({ x: 0, y: 0, z: spinZ }, true);
    await pr;
  }

  // the piece arrives a different way each round
  async enter(p, how, scale) {
    const s = this.s, th = this.th;
    p.position.copy(SPAWN);
    if (how === 'door' && !th.door) how = 'drop';
    if (how === 'door') {
      p.position.copy(th.doorPos);
      p.scale.setScalar(0.001);
      sfx.tick();
      const ax = th.doorAxis;
      await s.tween(th.door.rotation, { [ax]: th.doorOpen }, 0.2, Ease.out);
      if (ax === 'x') sfx.thunk();
      p.scale.setScalar(scale * 0.7);
      sfx.boing();
      const P = SPAWN, d0 = th.doorPos;
      await s.anim(0.42, (e, q) => {
        p.position.z = d0.z + (P.z - d0.z) * e;
        p.position.y = d0.y + (P.y - d0.y) * e + Math.sin(q * Math.PI) * 1.2;
        p.scale.setScalar(scale * (0.7 + 0.3 * e));
      });
      sfx.land();
      s.tween(th.door.rotation, { [ax]: 0 }, 0.25, Ease.back).then(() => sfx.thunk());
    } else if (how === 'spout') {
      // pops out of the chimney / funnel / tower top and bounces down onto the grass
      const top = th.spoutTop;
      p.scale.setScalar(scale);
      sfx.whoosh();
      s.anim(0.25, (_, q) => { const k = Math.sin(q * Math.PI) * 0.3; th.spout.scale.set(1 + k, 1 - k * 0.5, 1 + k); });
      fx.float(top.clone().add(new T.Vector3(0, 0.5, 0.5)), '☁', { color: '#ffffff', size: 8 });
      await this.tossTo(p, top.clone().add(new T.Vector3(0, 0.6, 0.9)), { arc: 2.2, time: 0.5, spinZ: 5 });
      await this.settle(p);
    } else if (how === 'toss') {
      // Pip throws it in
      const pip = this.pip;
      hop(s, pip, 0.4, 0.3);
      sfx.swoosh();
      const from = pip.position.clone().add(new T.Vector3(0.9, 1.4, 0.6));
      await this.tossTo(p, from, { arc: 2.0, time: 0.5, spinZ: -8 });
      await this.settle(p);
    } else if (how === 'roll') {
      // rolls in from the side along the grass
      sfx.swoosh();
      await this.tossTo(p, new T.Vector3(-9.5, 1.2, SPAWN.z), { arc: 0.4, time: 0.5, spinZ: -10 });
      await this.settle(p);
    } else {
      // dropped from the sky: falls, bounces, tips
      p.scale.setScalar(scale);
      sfx.whoosh();
      await this.tossTo(p, new T.Vector3(SPAWN.x + 0.6, 6.5, SPAWN.z), { arc: 0, time: 0.4, spinZ: 3 });
      await this.settle(p);
    }
    if (this.piece !== p) return;
    this.unphys(p);
    p.userData.inner.rotation.z = p.userData.rot;
    p.position.copy(SPAWN);
    p.quaternion.identity();
    p.scale.setScalar(scale);
  }

  // a small personality moment once the piece has arrived
  antic(p, gag) {
    const s = this.s, sc = p.userData.scale;
    if (gag === 'sneeze') {
      s.wait(0.2).then(async () => {
        if (p.userData.done || input.dragging()) return;
        pieceFace(p, 'oh');
        await s.anim(0.25, (_, q) => p.scale.set(sc * (1 - q * 0.08), sc * (1 + q * 0.1), sc));
        sfx.pop(); sfx.giggle();
        fx.float(p.position.clone().add(new T.Vector3(0.6, 0.4, 0.3)), '💨', { color: '#ffffff', size: 5 });
        await s.anim(0.2, (_, q) => { const k = Math.sin(q * Math.PI) * 0.2; p.scale.set(sc * (1 + k), sc * (1 - k), sc); p.position.x = SPAWN.x - k; });
        if (!p.userData.done && !input.dragging()) { p.scale.setScalar(sc); p.position.x = SPAWN.x; pieceFace(p, 'happy'); }
      });
    } else if (gag === 'wink') {
      s.wait(0.25).then(async () => {
        const e = p.userData.eyes[1];
        sfx.twinkle();
        await s.anim(0.35, (_, q) => { e.scale.y = 1 - Math.sin(q * Math.PI) * 0.9; });
        e.scale.y = 1;
      });
    } else if (gag === 'hat' || gag === 'crown' || gag === 'flower' || gag === 'bow') {
      const g = p.userData.gag;
      if (g) { sfx.boing2(); s.anim(0.4, (_, q) => { g.rotation.z = (gag === 'hat' ? -0.25 : 0) + Math.sin(q * Math.PI * 4) * 0.3 * (1 - q); }); }
    } else if (gag === 'glasses') {
      const g = p.userData.gag;
      if (g) { const y0 = g.position.y; sfx.tick(); s.anim(0.4, (_, q) => { g.position.y = y0 + Math.abs(Math.sin(q * Math.PI * 2)) * 0.12; }).then(() => { g.position.y = y0; }); }
    }
  }

  promptText() {
    const k = this.plan[this.round]?.kind;
    return k ? `${Cap(k)}! Where does the ${NAME[k]} go?` : '';
  }

  // where the piece (at its own depth) must be on screen to sit over the window
  overHole(h, z) {
    const w = h.getWorldPosition(new T.Vector3());
    const c = camera.position;
    const k = (c.z - z) / (c.z - w.z);
    return new T.Vector3(c.x + (w.x - c.x) * k, c.y + (w.y - c.y) * k, z);
  }

  // magnet: near the right window the piece is tugged toward it and turns to fit
  pull(z) {
    const p = this.piece;
    const right = z && z.hole.userData.kind === p.userData.kind ? z.hole : null;
    if (right) {
      const want = this.overHole(right, p.position.z);
      const d = Math.hypot(want.x - p.position.x, want.y - p.position.y);
      const k = Math.max(0, 1 - d / 2.2) * 0.65;
      p.position.x += (want.x - p.position.x) * k;
      p.position.y += (want.y - p.position.y) * k;
      if (this.magnet !== right) { sfx.bloop(4); pieceFace(p, 'happy'); this.s.anim(0.3, (_, q) => right.userData.rim.scale.setScalar(1.3 + Math.sin(q * Math.PI) * 0.15)); }
    } else if (this.magnet) pieceFace(p, 'oh');
    this.magnet = right;
  }

  update(dt) {
    const p = this.piece;
    if (!p || p.userData.done) return;
    const inner = p.userData.inner, sym = SYM[p.userData.kind];
    if (input.dragging() && this.magnet) {
      const fit = Math.round(inner.rotation.z / sym) * sym;
      inner.rotation.z += (fit - inner.rotation.z) * Math.min(1, dt * 8);
    } else if (input.dragging()) inner.rotation.z += (p.userData.rot - inner.rotation.z) * Math.min(1, dt * 5);
  }

  goHome(p) {
    const s = p.userData.scale;
    this.s.tween(p.position, { x: SPAWN.x, y: SPAWN.y, z: SPAWN.z }, 0.5, Ease.back);
    this.s.tween(p.scale, { x: s, y: s, z: s }, 0.3);
    this.s.tween(p.userData.inner.rotation, { z: p.userData.rot }, 0.3);
  }

  async drop(zone, { tapped }) {
    const p = this.piece;
    this.magnet = null;
    if (!p || !p.userData.ready || p.userData.done || this.busy) return; // ignore drops before the piece has arrived
    this.unphys(p);
    p.quaternion.identity();
    if (!zone) {
      pieceFace(p, 'happy');
      if (tapped && physics.ok) return this.boing(p);
      this.goHome(p);
      sfx.land();
      return;
    }
    const hole = zone.hole;
    const kind = p.userData.kind;
    if (hole.userData.kind !== kind) return this.bonk(p, hole);
    input.remove(this.target);
    p.userData.done = true;
    const lamp = this.lamps[this.round];
    const R = this.plan[this.round];
    this.success(hole.getWorldPosition(new T.Vector3()), `${Cap(kind)}!`);
    this.fit(p, hole, lamp, R);
  }

  // tapped: a real physics hop, then back to its spot
  async boing(p) {
    const sc = p.userData.scale;
    p.position.copy(SPAWN); p.scale.setScalar(sc);
    p.userData.inner.rotation.z = p.userData.rot;
    sfx.boing2();
    if (!this.phys(p)) return wiggle(this.s, p, 0.4);
    physics.poke(p, 1.1);
    physics.body(p)?.setAngvel({ x: 0, y: 0, z: (Math.random() < 0.5 ? -1 : 1) * 7 }, true);
    await this.wait(0.75);
    if (this.piece === p && physics.has(p)) this.settle(p);
  }

  // BONK: flies at the wrong window, splats flat, sees stars, then falls off and tumbles on the grass
  async bonk(p, hole) {
    const s = this.s, sc = p.userData.scale;
    this.redirect(`That's the ${NAME[hole.userData.kind]}. Find the ${NAME[p.userData.kind]}!`);
    pieceFace(p, 'oh');
    const w = hole.getWorldPosition(new T.Vector3());
    await s.tween(p.position, { x: w.x, y: w.y, z: w.z + 0.5 }, 0.16, Ease.in);
    if (this.piece !== p || p.userData.done) return;
    sfx.thunk();
    sfx.boing();
    shake(s, hole, 0.12);
    pieceFace(p, 'dizzy');
    for (let i = 0; i < 3; i++) s.wait(i * 0.08).then(() => fx.float(new T.Vector3(w.x + (i - 1) * 0.5, w.y + 0.6, w.z + 0.5), '★', { color: '#ffd23f', size: 5 }));
    await s.anim(0.12, (_, q) => { const k = Math.sin(q * Math.PI); p.scale.set(sc * (1 + k * 0.35), sc * (1 - k * 0.35), sc * (1 - k * 0.5)); });
    if (this.piece !== p || p.userData.done || input.dragging()) return;
    p.scale.setScalar(sc);
    p.position.z = w.z + 0.9;
    if (!this.phys(p)) { this.goHome(p); return; }
    const b = physics.body(p);
    b.setLinvel({ x: (SPAWN.x - w.x) * 0.5 + (Math.random() - 0.5), y: 1.5, z: 0 }, true);
    b.setAngvel({ x: 0, y: 0, z: (w.x > 0 ? 1 : -1) * 6 }, true);
    await this.wait(0.7);
    if (this.piece !== p || p.userData.done || !physics.has(p)) return;
    await this.settle(p, 0.3);
    if (this.piece === p && !p.userData.done) pieceFace(p, 'happy');
  }

  async fit(p, hole, lamp, R) {
    const s = this.s, inner = p.userData.inner, sym = SYM[p.userData.kind];
    const wp = hole.getWorldPosition(new T.Vector3());
    pieceFace(p, 'happy');
    s.tween(inner.rotation, { z: Math.round(inner.rotation.z / sym) * sym }, 0.18, Ease.out);
    s.tween(p.scale, { x: 1, y: 1, z: 1 }, 0.18, Ease.out);
    await s.tween(p.position, { x: wp.x, y: wp.y, z: wp.z + 0.6 }, 0.18, Ease.back);
    await s.tween(p.position, { z: wp.z + 0.1 }, 0.1, Ease.in);
    sfx.thunk();
    fx.confetti(wp.clone(), 14);
    s.tween(p.scale, { x: 0.001, y: 0.001, z: 0.001 }, 0.12, Ease.in).then(() => this.root.remove(p));
    this.fitted.push({ kind: p.userData.kind, col: R.col, hole });
    lightWindow(hole);
    this.litKinds.add(hole.userData.kind);
    if (lamp) { if (lamp.userData.model) retint(lamp, this.th.lampOn); else lamp.material = toon(this.th.lampOn); popIn(s, lamp, 1.3, 0.35, { sound: false }); }
    // the party hat / crown / bow / flower is the reward: it pops onto the lit window
    if (LATE_GAGS.includes(R.gag)) {
      hole.updateMatrixWorld(true);
      const top = (new T.Box3().setFromObject(hole.userData.rim).max.y - hole.getWorldPosition(new T.Vector3()).y) / hole.scale.y;
      const g = addGag(hole, R.gag, top + 0.05);
      // it sits on the front of the frame, clear of the roof / merlons behind the window row
      if (g) {
        g.position.z += 0.38;
        // a window that already wears something gets the new one perched on its left shoulder (never stacked through it)
        const n = (hole.userData.gags = (hole.userData.gags || 0) + 1);
        if (n > 1) { g.position.x -= 0.62; g.position.y -= hole.userData.kind === 'triangle' ? 0.75 : 0.32; g.rotation.z += 0.5; }
        s.wait(0.25).then(() => { sfx.boing2(); popIn(s, g, n > 1 ? 1.2 : 1.5, 0.35, { sound: false }); });
        g.scale.setScalar(0.001);
      }
    }
    // payoff: the window reacts, the facade cheers, a friend peeks, goodies tumble out
    this.windowPayoff(hole, PAYOFF[this.round % PAYOFF.length]);
    this.th.hooray(s);
    this.peek(hole, R.peek);
    s.wait(0.15).then(() => this.spill(hole, R.spill));
  }

  windowPayoff(hole, how) {
    const s = this.s;
    if (how === 'spin') s.anim(0.45, (e) => { hole.userData.rim.rotation.z = e * Math.PI * 2; }, Ease.out).then(() => { hole.userData.rim.rotation.z = 0; });
    else if (how === 'bounce') s.anim(0.35, (_, q) => hole.scale.setScalar(1 + Math.sin(q * Math.PI) * 0.18));
    else {
      const m = hole.userData.hole;
      const cols = [0xff9ad5, 0x9ae6ff, 0xb6ff9a, 0xffe27a];
      sfx.twinkle();
      for (let i = 0; i < cols.length; i++) s.wait(0.05 + i * 0.1).then(() => { m.material = basic(cols[i]); });
    }
  }

  // goodies tumble out of the window, bounce on the grass and pile up in front of the house
  spill(hole, type) {
    if (!physics.ok || this.dead) return;
    const w = hole.getWorldPosition(new T.Vector3());
    sfx.pop();
    for (let i = 0; i < 4; i++) {
      this.s.wait(i * 0.06).then(() => {
        const g = makeGoodie(type);
        g.position.set(w.x + (i - 1.5) * 0.25, w.y - 0.2, WALL_Z + 0.7);
        this.root.add(g);
        this.goodies.push(g);
        if (this.goodies.length > 22) { const old = this.goodies.shift(); physics.remove(old); this.root.remove(old); }
        const tgt = new T.Vector3(w.x + (Math.random() - 0.5) * 2.6, 0.2, 0.6 + Math.random() * 1.4);
        physics.toss(g, tgt, { arc: 1.4, time: 0.45, maxT: 1.5, shape: type === 'coins' ? 'box' : 'ball', r: 0.18, bounce: 0.55 });
        // they twinkle away once landed, so no litter on the play area looks like something to touch
        this.s.wait(1.5 + i * 0.05).then(() => { if (this.dead || !g.parent) return; physics.remove(g); popOut(this.s, g, 0.2).then(() => { this.root.remove(g); const k = this.goodies.indexOf(g); if (k >= 0) this.goodies.splice(k, 1); }); });
        if (i === 0) sfx.tick();
      });
    }
  }

  // a friend pops up behind the window ledge, says hello, waves and ducks back down
  async peek(hole, kind) {
    const s = this.s;
    const a = makeAnimal(kind);
    const K = 0.42;
    a.position.set(0, -1.95, 0.22);
    a.scale.setScalar(0.001);
    a.userData.baseScale = K;
    hole.add(a);
    await s.anim(0.2, (_, q) => { const e = Ease.back(q); a.scale.setScalar(Math.max(0.001, K * e)); a.position.y = -1.95 + 1.0 * e; });
    if (!a.parent) return;
    const snd = PEEK_SND[kind];
    sfx[snd] && sfx[snd]();
    hop(s, a, 0.25, 0.3);
    const arm = a.userData.arms?.[1];
    if (arm) { const r0 = arm.rotation.z; s.anim(0.5, (_, q) => { arm.rotation.z = r0 + 1.6 + Math.sin(q * Math.PI * 5) * 0.4; }).then(() => { arm.rotation.z = r0; }); }
    await s.wait(0.55);
    await s.anim(0.18, (_, q) => { a.position.y = -0.95 - q; a.scale.setScalar(Math.max(0.001, K * (1 - q))); });
    hole.remove(a);
  }

  showHint(glow = true) {
    const p = this.piece;
    if (!p) return;
    const hole = this.holes.find((h) => h.userData.kind === p.userData.kind);
    if (!hole) return;
    if (glow) this.addHalo(hole, 1.3);
    fx.ghostHand(SPAWN.clone(), hole.getWorldPosition(new T.Vector3()));
  }

  makeErrorless() {
    const k = this.piece?.userData.kind;
    for (const h of this.holes) if (h.userData.kind !== k) {
      h.userData.enabled = false;
      this.s.tween(h.scale, { x: 0.5, y: 0.5, z: 0.5 }, 0.4);
    }
  }

  onFinale() {
    for (const h of this.holes) lightWindow(h);
    if (this.door) this.s.tween(this.door.rotation, { [this.th.doorAxis]: this.th.doorOpen }, 0.3, Ease.out);
    this.th.hooray(this.s);
    // every shape the child fitted comes tumbling back out of its window and piles up on the grass
    this.fitted.forEach((f, i) => this.s.wait(0.1 + i * 0.12).then(() => {
      if (this.dead || !physics.ok) return;
      const p = makePiece(f.kind, f.col, this.P.deco);
      p.userData.scale = 0.8;
      const w = f.hole.getWorldPosition(new T.Vector3());
      p.position.set(w.x, w.y, WALL_Z + 0.9);
      p.scale.setScalar(0.8);
      this.root.add(p);
      sfx.pop();
      if (this.phys(p)) physics.body(p).setLinvel({ x: (Math.random() - 0.5) * 3, y: 3, z: 3 + Math.random() }, true);
    }));
    ['bunny', 'bear'].forEach((k, i) => {
      const a = makeAnimal(k);
      // out to the sides (the shapes tumble down in the middle), each with a body the shapes bump into
      a.position.set(i ? 5.4 : -5.4, 0, 3);
      physics.box(new T.Vector3(a.position.x, 1.0, 3), new T.Vector3(1.2, 2.0, 1.0));
      a.scale.setScalar(0.9);
      a.userData.baseScale = 0.9;
      this.root.add(a);
      popIn(this.s, a, 0.9).then(() => hop(this.s, a, 0.7)).then(() => hop(this.s, a, 0.7));
    });
  }
}
