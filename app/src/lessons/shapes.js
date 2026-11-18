// Lesson 3 — Shape house. Topic mt_KJeEeTutJI "2-D shapes".
// Drag each shape to its matching window. Later pieces are small, tilted or upside-down: a shape is still a shape.
// Level 1 is a cottage, Level 2 a toy train, Level 3 a castle; every round brings a new piece look, entrance and gag.
// Pieces arrive with real physics (dropped, tossed by Pip, rolled in, popped out of a chimney/funnel/tower).
// A wrong window: a soft bump and the piece floats back. The right one: a held breath, it sinks in with a wooden tok
// (the level's rising note) and STAYS seated in its window, the window and a roof lamp light, an accessory pops on,
// and a friend peeks out. The building fills up window by window; at the end dusk falls and the windows glow in the
// order she filled them, the door opens and a friend steps out and waves.
import * as T from '../three.js';
import { Lesson } from '../engine/lesson.js';
import { toon, basic } from '../engine/toon.js';
import { C, popIn, popOut, wiggle, shake, makeAnimal, hop, wave } from '../engine/actors.js';
import { camera, scene } from '../engine/stage.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { physics } from '../engine/physics.js';
import { Ease } from '../engine/tween.js';
import { SYM, makeHole, makePiece, pieceFace, lightWindow } from './shapes-parts.js';
import { THEMES, WALL_Z, addGag } from './shapes-themes.js';
import { frame, calmBackdrop, isTree, retint } from './view-tools.js';

// accessories that change a piece's outline: they arrive as the payoff (on the lit window), never on the piece
const LATE_GAGS = ['hat', 'crown', 'bow', 'flower'];

const HOLE_Y = 3.2;
const SPAWN = new T.Vector3(0, 0.95, 4);
const LAYOUT = { 2: [-2.2, 2.2], 3: [-3, 0, 3], 4: [-3.6, -1.2, 1.2, 3.6] };
// four windows on the train / castle: closer together and a little smaller, so none hangs off the building
const LAYOUT4 = { train: [-3.0, -1.0, 1.0, 3.0], castle: [-3.1, -1.05, 1.05, 3.1] };
const NAME = { circle: 'circle', square: 'square', triangle: 'triangle', rect: 'rectangle' };
const Cap = (k) => NAME[k][0].toUpperCase() + NAME[k].slice(1);
const ALL = ['circle', 'square', 'triangle', 'rect'];

// Per level: facade theme, piece look, which windows appear when, and six rounds.
// Round: kind, s (scale), rot (tilt), col, enter (door | spout | drop | toss | roll), gag (the accessory that pops onto
// the lit window: hat | crown | bow | flower; others are ignored), peek (the friend who looks out of that window).
// holes: the windows from that round on (in order, left to right); L3 swaps them about twice.
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
    theme: 'castle', deco: 'gem', holes: { 0: ['circle', 'square', 'triangle'], 2: ALL, 3: ALL.slice().reverse(), 5: ['square', 'rect', 'circle', 'triangle'] },
    rounds: [
      { kind: 'circle', s: 1, rot: 0, col: 0x9b6bd9, enter: 'door', gag: 'crown', peek: 'bear', spill: 'coins' },
      { kind: 'triangle', s: 1, rot: 0, col: 0x3bc6d9, enter: 'spout', gag: 'sneeze', peek: 'frog', spill: 'gems' },
      { kind: 'rect', s: 1, rot: 0, col: 0xff5aa8, enter: 'drop', gag: 'bow', peek: 'cat', spill: 'coins' },
      { kind: 'square', s: 0.7, rot: 0.6, col: 0x5ad97a, enter: 'toss', gag: 'wink', peek: 'elephant', spill: 'stars' },
      { kind: 'triangle', s: 0.8, rot: Math.PI, col: 0xffb03b, enter: 'roll', gag: 'glasses', peek: 'cat', spill: 'gems' }, // (a white bunny vanished on the snow)
      { kind: 'rect', s: 0.8, rot: Math.PI / 2, col: 0x4a90ff, enter: 'door', gag: 'crown', peek: 'hedgehog', spill: 'coins' },
    ],
  },
];

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
    this.fitted = [];
    this.holeScale = 1;
    this.setHoles(this.holeKinds[0], false);
    // the camera stands back a little for the tall castle (tower tips under the Home / settings buttons) and looks a
    // little higher, so the caption never touches the roof
    frame(0, 3.5, P.theme === 'castle' ? 14.2 : 13.2, 0, 2.8, 0);
    calmBackdrop(this.meadow, { hide: (o) => (isTree(o) && Math.abs(o.position.x) < 8) || (Math.abs(o.position.x) > 8.5 && o.position.z > -9) });
    this.pip.position.set(-5.6, 0, 0.6); // not pressed against the frame edge
    this.admireTime = 6;
    this.demoDur = 3.0; // the demo's piece ride takes about 2.9 s (engine: playDemo's window) // the dusk show of her windows needs a little longer than the usual 4 s
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

  // Windows that stay keep their light, their accessory and the piece seated in them, and move to their new place;
  // only new ones pop in. A window that has far to go shrinks a little (never below 0.6) and, if it moves right, passes
  // in FRONT of the others, so two windows never pass through each other.
  setHoles(kinds, animate = true) {
    const theme = this.P.theme;
    const xs = kinds.length === 4 && LAYOUT4[theme] ? LAYOUT4[theme] : LAYOUT[kinds.length];
    const bs = kinds.length === 4 && LAYOUT4[theme] ? 0.85 : 1;
    this.holeScale = bs;
    if (animate) this.movingUntil = performance.now() + 1500; // (no drops while windows move: they float home)
    const old = this.holes;
    let added = null;
    this.holes = kinds.map((k, i) => {
      const x = xs[i];
      const keep = old.find((h) => h.userData.kind === k);
      if (keep) {
        if (!animate) { keep.position.x = x; keep.scale.setScalar(bs); }
        else if (Math.abs(keep.position.x - x) < 1.5) { this.s.tween(keep.position, { x }, 0.7, Ease.inOut); this.s.tween(keep.scale, { x: bs, y: bs, z: bs }, 0.7, Ease.inOut); }
        else {
          const x0 = keep.position.x, z0 = keep.position.z, s0 = keep.scale.x, fwd = x > x0 ? 1.3 : 0;
          this.s.anim(1.0, (e, q) => {
            const dip = Math.sin(q * Math.PI);
            keep.position.x = x0 + (x - x0) * e;
            keep.position.z = z0 + fwd * dip;
            keep.scale.setScalar((s0 + (bs - s0) * e) * (1 - 0.4 * dip));
          }, Ease.inOut).then(() => { keep.position.z = z0; keep.scale.setScalar(bs); });
        }
        return keep;
      }
      const h = makeHole(k, this.th.hole);
      h.position.set(x, this.P.theme === 'castle' ? HOLE_Y + 0.25 : HOLE_Y, WALL_Z); // (castle: the ledges clear the gate arch)
      if (this.litKinds.has(k)) lightWindow(h);
      this.house.add(h);
      added = h;
      // a new window grows in once the moving ones have made room
      if (animate) { h.scale.setScalar(0.001); this.s.wait(0.85).then(() => popIn(this.s, h, bs, 0.6, { sound: false })); }
      else h.scale.setScalar(bs);
      return h;
    });
    for (const h of old) if (!this.holes.includes(h)) { if (animate) popOut(this.s, h, 0.4).then(() => this.house.remove(h)); else this.house.remove(h); }
    return added;
  }

  zones() {
    const still = !(performance.now() < (this.movingUntil || 0));
    return this.holes.map((h) => ({ obj: h, radius: 1.3, hole: h, enabled: h.userData.enabled !== false && still }));
  }

  async startRound(r) {
    const R = this.plan[r];
    // (new windows / the castle's swaps were laid out at the end of the last round: prepNext)
    const bs = this.holeScale;
    // (windows shrunk by the last round's errorless step grow back; never touch one that is moving to a new place)
    for (const h of this.holes) { h.userData.enabled = true; if (h.userData.shrunk) { h.userData.shrunk = false; this.s.tween(h.scale, { x: bs, y: bs, z: bs }, 0.4, Ease.inOut); } }
    // the cue (and the glow on a window that has just arrived) waits until the windows have settled
    const prep = this.prepP || Promise.resolve();
    this.prepP = null;
    prep.then(() => {
      if (this.dead || this.round !== r) return;
      if (this.demoDone) this.cue();
      if (this.newHole) { const stop = fx.halo(this.newHole, 1.3); this.newHole = null; this.s.wait(1.4).then(stop); }
    });

    const p = makePiece(R.kind, R.col, this.P.deco);
    p.userData.scale = R.s;
    p.userData.rot = R.rot;
    p.userData.inner.rotation.z = R.rot;
    p.userData.gag = null; // (no sneezes / winks / glasses before she acts: the accessory is the window's reward)
    this.root.add(p);
    this.piece = p;
    this.magnet = null;
    // no Go! and no grabbing until the piece has landed (a drag before addDrag was silently ignored)
    this.busy = true;
    await this.enter(p, R.enter, R.s);
    if (this.dead || this.piece !== p) return;
    this.busy = false;
    p.userData.ready = true;
    this.target = input.addDrag(p, {
      radius: 1.0,
      minY: 0.6,
      zones: () => this.zones(),
      onPick: () => {
        this.stopRide();
        this.unphys(p);
        this.s.stop(p.position); // a regrab mid-way home must not fight the homeward tween
        p.quaternion.identity();
        pieceFace(p, 'oh');
        // shrink / grow to the window's size as it lifts, so it visibly fits its hole
        const sc = this.fitScale(p);
        this.s.tween(p.scale, { x: sc, y: sc, z: sc }, 0.15, Ease.back);
      },
      onMove: (_t, z) => this.pull(z),
      onDrop: (z, info) => this.drop(z, info),
    });
    if (!this.demoDone) this.cue();
  }

  // Lay out the next round's windows while this round's peek plays (rule 0: she can act ~1.5 s into a round), then
  // give them a moment to settle so the next name is said for a window she can already see.
  async prepNext() {
    const kinds = this.holeKinds[this.round];
    if (!kinds || this.round === 0 || this.round >= this.totalRounds) return;
    this.newHole = this.setHoles(kinds, true);
    await this.wait(this.newHole ? 1.45 : 1.0);
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
  async settle(p, dur = 0.3) {
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
    const pr = physics.toss(p, this.restAt(), { arc, time, maxT: time + 0.3, spin: 0 });
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
      await s.tween(th.door.rotation, { [ax]: th.doorOpen }, 0.35, Ease.inOut);
      p.scale.setScalar(scale * 0.7);
      const P = SPAWN, d0 = th.doorPos;
      await s.anim(0.6, (e, q) => {
        p.position.z = d0.z + (P.z - d0.z) * e;
        p.position.y = d0.y + (P.y - d0.y) * e + Math.sin(q * Math.PI) * 1.2;
        p.scale.setScalar(scale * (0.7 + 0.3 * e));
      });
      sfx.land();
      s.tween(th.door.rotation, { [ax]: 0 }, 0.5, Ease.inOut);
    } else if (how === 'spout') {
      // pops out of the chimney / funnel / tower top and bounces down onto the grass
      const top = th.spoutTop;
      p.scale.setScalar(scale);
      sfx.whoosh();
      s.anim(0.45, (_, q) => { const k = Math.sin(q * Math.PI) * 0.3; th.spout.scale.set(1 + k, 1 - k * 0.5, 1 + k); });
      await this.tossTo(p, top.clone().add(new T.Vector3(0, 0.6, 0.9)), { arc: 1.8, time: 0.6, spinZ: 3 });
      await this.settle(p);
    } else if (how === 'toss') {
      // Pip throws it in (it starts beside Pip, never on top of his face)
      const pip = this.pip;
      hop(s, pip, 0.3, 0.35);
      sfx.swoosh();
      const from = pip.position.clone().add(new T.Vector3(1.8, 1.4, 0.6));
      await this.tossTo(p, from, { arc: 1.6, time: 0.6, spinZ: -5 });
      await this.settle(p);
    } else if (how === 'roll') {
      // rolls in from the side along the grass
      sfx.swoosh();
      await this.tossTo(p, new T.Vector3(-8, 1.2, SPAWN.z), { arc: 0.4, time: 0.7, spinZ: -7 });
      await this.settle(p);
    } else {
      // dropped from the sky: falls, bounces, tips
      p.scale.setScalar(scale);
      sfx.whoosh();
      await this.tossTo(p, new T.Vector3(SPAWN.x + 0.6, 6.0, SPAWN.z), { arc: 0, time: 0.55, spinZ: 2 });
      await this.settle(p);
    }
    if (this.piece !== p) return;
    this.unphys(p);
    p.userData.inner.rotation.z = p.userData.rot;
    p.position.copy(SPAWN);
    p.quaternion.identity();
    p.scale.setScalar(scale);
  }

  promptText() {
    const k = this.plan[this.round]?.kind;
    return k ? `${Cap(k)}! Put it in the ${NAME[k]} window!` : '';
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
      if (this.magnet !== right) { pieceFace(p, 'happy'); this.s.anim(0.3, (_, q) => right.userData.rim.scale.setScalar(1.3 + Math.sin(q * Math.PI) * 0.15)); }
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
    this.s.tween(p.position, { x: SPAWN.x, y: SPAWN.y, z: SPAWN.z }, 0.5, Ease.inOut);
    this.s.tween(p.scale, { x: s, y: s, z: s }, 0.3);
    this.s.tween(p.userData.inner.rotation, { z: p.userData.rot }, 0.3);
  }

  async drop(zone, { tapped }) {
    const p = this.piece;
    this.magnet = null;
    this.stopRide(); // a drop always ends the demo ride (it must never move the piece afterwards)
    if (zone && performance.now() < (this.movingUntil || 0)) zone = null; // (a window is still moving)
    if (!p || !p.userData.ready || p.userData.done || this.busy) return; // ignore drops before the piece has arrived
    this.unphys(p);
    // the lift-up shrink (onPick) may still be tweening: stop it, or a quick tap leaves the piece window-sized
    this.s.stop(p.scale); this.s.stop(p.position);
    p.quaternion.identity();
    if (!zone) {
      pieceFace(p, 'happy');
      if (tapped && physics.ok) return this.boing(p);
      this.goHome(p);
      return;
    }
    const hole = zone.hole;
    const kind = p.userData.kind;
    if (hole.userData.kind !== kind) return this.bump(p, hole);
    input.remove(this.target);
    p.userData.done = true;
    const lamp = this.lamps[this.round];
    const R = this.plan[this.round];
    this.payoffP = this.fit(p, hole, lamp, R); // resolves once the piece is going in; the rest plays on
    this.success(hole.getWorldPosition(new T.Vector3()), `${Cap(kind)}!`, { still: 0 });
  }

  // tapped: a real physics hop, then back to its spot
  async boing(p) {
    const sc = p.userData.scale;
    p.position.copy(SPAWN); p.scale.setScalar(sc);
    p.userData.inner.rotation.z = p.userData.rot;
    if (!this.phys(p)) return wiggle(this.s, p, 0.4);
    physics.poke(p, 0.9);
    physics.body(p)?.setAngvel({ x: 0, y: 0, z: (Math.random() < 0.5 ? -1 : 1) * 4 }, true);
    await this.wait(0.9);
    if (this.piece === p && physics.has(p)) this.settle(p);
  }

  // Wrong window: a soft bump. The piece floats up to just short of the window, the window gives a small wobble with
  // one soft thud, and the piece floats back to its spot (no stars, no dizzy face, nothing to chase).
  async bump(p, hole) {
    const s = this.s;
    this.redirect(`That's the ${NAME[hole.userData.kind]}. Find the ${NAME[p.userData.kind]}!`);
    pieceFace(p, 'oh');
    const w = hole.getWorldPosition(new T.Vector3());
    const at = this.overHole(hole, w.z + 1.0);
    await s.tween(p.position, { x: at.x, y: at.y - 0.25, z: at.z }, 0.3, Ease.inOut);
    if (this.piece !== p || p.userData.done) return;
    sfx.land();
    shake(s, hole, 0.05, 0.3);
    await this.wait(0.15);
    if (this.piece !== p || p.userData.done || input.dragging()) return;
    this.goHome(p);
    await this.wait(0.5);
    if (this.piece === p && !p.userData.done) pieceFace(p, 'happy');
  }

  // The right window: the piece turns to fit and floats over it, a held breath, then it sinks in with a wooden tok
  // (the level's rising note) and STAYS seated there. The window and one roof lamp light on the same beat, the
  // window's accessory pops on, and then one friend peeks out of the window and waves.
  async fit(p, hole, lamp, R) {
    const s = this.s, inner = p.userData.inner, sym = SYM[p.userData.kind];
    const wp = hole.getWorldPosition(new T.Vector3());
    const ws = hole.scale.x;
    pieceFace(p, 'happy');
    s.tween(inner.rotation, { z: Math.round(inner.rotation.z / sym) * sym }, 0.25, Ease.inOut);
    s.tween(p.scale, { x: ws, y: ws, z: ws }, 0.25, Ease.inOut);
    await s.tween(p.position, { x: wp.x, y: wp.y, z: wp.z + 0.6 }, 0.25, Ease.inOut);
    // a window that already holds a piece (each shape comes twice a level): the earlier one hops down onto the
    // window box, small, and sits there for the rest of the level (her work never disappears)
    const prev = hole.userData.seated;
    if (prev) {
      const n = (hole.userData.onLedge = (hole.userData.onLedge || 0) + 1);
      const from = prev.position.clone(), to = new T.Vector3((n % 2 ? -1 : 1) * 0.62, -0.74, 0.45), k0 = prev.scale.x, k1 = k0 * 0.42;
      s.anim(0.5, (e, q) => { prev.position.lerpVectors(from, to, e); prev.position.y += Math.sin(q * Math.PI) * 0.35; prev.scale.setScalar(k0 + (k1 - k0) * e); }, Ease.inOut);
    }
    await this.beat(p, 0.3, { squash: 0.06 });
    if (this.dead) return;
    // from here on nothing is awaited by the round: it sinks in, the lights and the peek play while the next
    // piece is already arriving (rule 0)
    this.seat(p, hole, wp, lamp, R);
  }
  async seat(p, hole, wp, lamp, R) {
    const s = this.s;
    await s.tween(p.position, { z: wp.z + 0.05 }, 0.15, Ease.in);
    if (this.dead) return;
    hole.attach(p); // seated: it moves with its window from now on
    hole.userData.seated = p;
    sfx.step(Math.max(0, this.round - 1), this.totalRounds);
    this.fitted.push({ kind: p.userData.kind, col: R.col, hole, piece: p });
    lightWindow(hole);
    this.litKinds.add(hole.userData.kind);
    if (lamp) {
      if (lamp.userData.model) retint(lamp, this.th.lampOn); else lamp.material = toon(this.th.lampOn);
      const l0 = lamp.scale.x;
      s.anim(0.35, (_, q) => lamp.scale.setScalar(l0 * (1 + Math.sin(q * Math.PI) * 0.18))).then(() => lamp.scale.setScalar(l0));
    }
    // the party hat / crown / bow / flower pops onto the lit window on the same beat (one per window: if this window
    // already wears one, it goes onto the next lit window that has none)
    if (LATE_GAGS.includes(R.gag)) {
      const tgt = !hole.userData.gags ? hole : this.holes.find((h) => h.userData.lit && !h.userData.gags) || null;
      if (tgt) {
        tgt.updateMatrixWorld(true);
        const top = (new T.Box3().setFromObject(tgt.userData.rim).max.y - tgt.getWorldPosition(new T.Vector3()).y) / tgt.scale.y;
        const g = addGag(tgt, R.gag, top + 0.05);
        if (g) {
          g.position.z += 0.38; // on the front of the frame, clear of the roof / merlons behind the window row
          g.position.x += 0.45; // and off to one side, so it never hides the roof lamp above the window
          tgt.userData.gags = 1;
          const k = 1.4;
          g.scale.setScalar(0.001);
          popIn(s, g, k, 0.45, { sound: false });
        }
      }
    }
    this.s.wait(0.35).then(() => { if (!this.dead) this.peek(hole, R.peek); });
  }
  // the next round's windows are laid out while this one's lights and peek play; the next prompt waits for them
  async afterSuccess() {
    this.prepP = this.prepNext();
  }

  // a friend pops up behind the window ledge, waves and ducks back down (no sound: the tok has just played)
  async peek(hole, kind) {
    const s = this.s;
    const a = makeAnimal(kind);
    const K = 0.6;
    a.position.set(0, -1.7, 0.3);
    a.scale.setScalar(0.001);
    a.userData.baseScale = K;
    hole.add(a);
    await s.anim(0.5, (_, q) => { const e = Ease.out(q); a.scale.setScalar(Math.max(0.001, K * e)); a.position.y = -1.7 + 0.85 * e; });
    if (!a.parent) return;
    const arm = a.userData.arms?.[1];
    if (arm) { const r0 = arm.rotation.z; s.anim(0.9, (_, q) => { arm.rotation.z = r0 - 1.2 + Math.sin(q * Math.PI * 4) * 0.3; }).then(() => { arm.rotation.z = r0; }); }
    await s.wait(1.0);
    await s.anim(0.4, (_, q) => { a.position.y = -0.85 - q * 0.85; a.scale.setScalar(Math.max(0.001, K * (1 - q))); });
    hole.remove(a);
  }

  // The demo: a ghost hand drags from the piece to its window AND the real piece rides along under it: it lifts,
  // takes the window's size, turns to fit, hovers over the window, then floats back (it never goes in).
  showHint(glow = true) {
    const p = this.piece;
    if (!p || !p.userData.ready || p.userData.done) return;
    const hole = this.holes.find((h) => h.userData.kind === p.userData.kind);
    if (!hole) return;
    if (glow) this.addHalo(hole, 1.3);
    const over = this.overHole(hole, p.position.z);
    fx.ghostPath([SPAWN.clone().add(new T.Vector3(0, -0.5 * p.userData.scale, 0)), over.clone().add(new T.Vector3(0, -0.55, 0))], { mode: 'drag', maxDur: 3.0 });
    this.ride(p, over);
  }
  async ride(p, over) {
    const tok = (this.riding = {});
    const s = this.s, inner = p.userData.inner, sym = SYM[p.userData.kind];
    const home = SPAWN.clone(), sc0 = p.userData.scale, sc1 = this.fitScale(p), r0 = p.userData.rot, r1 = Math.round(r0 / sym) * sym;
    const go = (dur, fn) => s.anim(dur, (e) => { if (this.riding === tok) fn(e); }, Ease.inOut);
    const off = input.onAny(() => { off(); if (this.riding !== tok) return; this.riding = null; s.wait(0.06).then(() => { if (!input.dragging() && !p.userData.done && this.piece === p) this.goHome(p); }); });
    this.offs.push(off);
    const lift = home.clone(); lift.y += 0.35;
    await go(0.55, () => {});
    await go(0.25, (e) => p.position.lerpVectors(home, lift, e));
    await go(1.0, (e) => { p.position.lerpVectors(lift, over, e); p.scale.setScalar(sc0 + (sc1 - sc0) * e); inner.rotation.z = r0 + (r1 - r0) * e; });
    await go(0.4, () => {});
    await go(0.6, (e) => { p.position.lerpVectors(over, home, e); p.scale.setScalar(sc1 + (sc0 - sc1) * e); inner.rotation.z = r1 + (r0 - r1) * e; });
    off();
    if (this.riding === tok) { this.riding = null; p.position.copy(home); p.scale.setScalar(sc0); inner.rotation.z = r0; }
  }
  stopRide() { this.riding = null; }

  makeErrorless() {
    const k = this.piece?.userData.kind, bs = this.holeScale;
    for (const h of this.holes) if (h.userData.kind !== k) {
      h.userData.enabled = false;
      h.userData.shrunk = true;
      this.s.tween(h.scale, { x: 0.5 * bs, y: 0.5 * bs, z: 0.5 * bs }, 0.4);
    }
  }

  // ---- the ending: dusk falls, the windows glow one by one in the order she filled them, the door opens and a
  // friend steps out and waves. The seated pieces are pokeable (each sounds its note).
  creationView() {
    // fitted to the 4:3 photo: the whole building, side to side
    if (this.P.theme === 'castle') return { pos: [0, 3.7, 13.6], look: [0, 3.1, -2] };
    if (this.P.theme === 'train') return { pos: [1.2, 3.4, 13.4], look: [1.2, 2.9, -2] }; // the engine too
    return { pos: [0, 3.4, 11.4], look: [0, 2.9, -2] };
  }
  creationObjects() { return this.fitted.map((f) => f.piece); }
  onFinale() {
    const s = this.s;
    // dusk: the light and the sky dim slowly (restored by the next game's setSky / dispose)
    const lights = scene.children.filter((l) => l.isLight).map((l) => [l, l.intensity]);
    s.anim(1.4, (e) => { for (const [l, i0] of lights) l.intensity = i0 * (1 - 0.45 * e); scene.backgroundIntensity = 1 - 0.4 * e; }, Ease.inOut);
    s.wait(0.3).then(() => this.fitted.forEach((f, i) => s.wait(1.3 + i * 0.5).then(() => {
      if (this.dead) return;
      f.hole.userData.hole.material = basic(0xfff1a8);
      sfx.step(i, this.fitted.length, { soft: true });
      const h = f.hole, k0 = h.scale.x;
      s.anim(0.4, (_, q) => h.scale.setScalar(k0 * (1 + Math.sin(q * Math.PI) * 0.08))).then(() => h.scale.setScalar(k0));
    })));
    // the door opens and a friend steps out and waves (the train has no door: the friend walks up beside it); it
    // arrives early, so the photo at the end of the admire never catches it mid-walk
    s.wait(0.3).then(async () => {
      if (this.dead) return;
      const kind = this.P.theme === 'castle' ? 'cat' : this.P.theme === 'train' ? 'frog' : 'bunny';
      const a = makeAnimal(kind);
      a.scale.setScalar(0.75); a.userData.baseScale = 0.75;
      const th = this.th;
      let to;
      if (this.door) {
        s.tween(this.door.rotation, { [th.doorAxis]: th.doorOpen }, 0.5, Ease.inOut);
        a.position.set(th.doorPos.x, 0, WALL_Z + 0.2);
        to = new T.Vector3(th.doorPos.x + 0.9, 0, 1.6);
      } else {
        a.position.set(8.5, 0, 2.2);
        to = new T.Vector3(3.4, 0, 2.2);
      }
      this.root.add(a);
      await this.walkTo(a, to, { speed: 1.8 });
      if (this.dead) return;
      const arm = a.userData.arms?.[1];
      if (arm) { const r0 = arm.rotation.z; await s.anim(1.0, (_, q) => { arm.rotation.z = r0 - 1.2 + Math.sin(q * Math.PI * 4) * 0.3; }); arm.rotation.z = r0; }
    });
  }
  dispose() {
    scene.backgroundIntensity = 1;
    super.dispose();
  }
}
