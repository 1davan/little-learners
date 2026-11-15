// Lesson 3 — Shape house. Topic mt_KJeEeTutJI "2-D shapes".
// Drag each shape to its matching window. Later pieces are small, tilted or upside-down: a shape is still a shape.
// Near the right window the piece is pulled in like a magnet and turns to fit; a wrong window gives a funny BONK.
// Every filled window lights up and a friend peeks out over the flower box.
import * as T from '../three.js';
import { Lesson } from '../engine/lesson.js';
import { mesh, geo, toon } from '../engine/toon.js';
import { C, popIn, wiggle, shake, makeAnimal, hop } from '../engine/actors.js';
import { camera } from '../engine/stage.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';
import { SYM, makeHole, makePiece, pieceFace, lightWindow, PEEKERS } from './shapes-parts.js';

const HOLE_Y = 3.2, WALL_Z = -1;
const SPAWN = new T.Vector3(0, 0.95, 4);
const LAYOUT = { 2: [-2.2, 2.2], 3: [-3, 0, 3], 4: [-3.6, -1.2, 1.2, 3.6] };
const NAME = { circle: 'circle', square: 'square', triangle: 'triangle', rect: 'rectangle' };
const Cap = (k) => NAME[k][0].toUpperCase() + NAME[k].slice(1);
const PIECE_COL = { circle: C.red, square: C.blue, triangle: C.yellow, rect: C.green };
const ENTRANCES = ['door', 'chimney', 'tumble', 'drop', 'chimney', 'door'];
const tmp = new T.Vector3();

export default class ShapesLesson extends Lesson {
  build() {
    const L = this.level;
    // [kind, scale, rotation, colour override]
    this.plan = L === 0
      ? [['circle', 1, 0], ['square', 1, 0], ['triangle', 1, 0], ['square', 0.7, 0.5], ['triangle', 0.85, Math.PI], ['circle', 1.15, 0, C.purple]]
      : [['circle', 1, 0], ['triangle', 1, 0], ['rect', 1, 0], ['square', 0.7, 0.6], ['triangle', 0.8, Math.PI], ['rect', 0.8, Math.PI / 2, C.orange]];
    const all = ['circle', 'square', 'triangle', 'rect'];
    this.holeKinds = L === 0
      ? { 0: ['circle', 'square'], 2: ['circle', 'square', 'triangle'] }
      : { 0: ['circle', 'square', 'triangle'], 2: all, ...(L === 2 ? { 3: all } : {}) };

    // the house
    const house = new T.Group();
    const wall = mesh(geo.box(9.4, 4.6, 0.6), 0xfff1d6, { hull: 1.015 });
    wall.position.set(0, 2.3, WALL_Z - 0.35);
    const roofShape = new T.Shape();
    roofShape.moveTo(-5.4, 0); roofShape.lineTo(5.4, 0); roofShape.lineTo(0, 2.4); roofShape.closePath();
    const roofGeo = new T.ExtrudeGeometry(roofShape, { depth: 1.2, bevelEnabled: false });
    roofGeo.translate(0, 0, -0.6);
    const roof = mesh(roofGeo, 0xff6b5a, { hull: 1.02 });
    roof.position.set(0, 4.6, WALL_Z - 0.35);
    const chimney = mesh(geo.box(0.7, 1.4, 0.7), 0xd9594a, { hull: 1.06 });
    chimney.position.set(3, 5.8, WALL_Z - 0.35);
    this.chimney = chimney;
    // door on a hinge so it can swing open
    const hinge = new T.Group();
    hinge.position.set(-0.7, 0.95, WALL_Z);
    const door = mesh(geo.box(1.4, 1.9, 0.15), 0x9a6a44, { hull: 1.05 });
    door.position.x = 0.7;
    const knob = mesh(geo.sphere(0.1, 8, 6), C.yellow, { outline: 0.02 });
    knob.position.set(1.15, 0, 0.12);
    hinge.add(door, knob);
    const doorway = mesh(geo.box(1.4, 1.9, 0.05), 0x3a2f5b, { outline: 0 });
    doorway.position.set(0, 0.95, WALL_Z - 0.06);
    house.add(wall, roof, chimney, doorway, hinge);
    this.root.add(house);
    this.house = house;
    this.door = hinge;

    // lamps along the top of the wall: one lights per success
    this.lamps = [];
    for (let i = 0; i < 6; i++) {
      const l = mesh(geo.sphere(0.24, 14, 10), 0x8a8fa0, { outline: 0.025 });
      l.position.set(-3.75 + i * 1.5, 4.35, WALL_Z + 0.05);
      house.add(l);
      this.lamps.push(l);
    }
    this.holes = [];
    this.litKinds = new Set();
    this.peekI = 0;
    this.setHoles(this.holeKinds[0], false);
  }

  setHoles(kinds, animate = true) {
    for (const h of this.holes) this.house.remove(h);
    const xs = LAYOUT[kinds.length];
    this.holes = kinds.map((k, i) => {
      const h = makeHole(k);
      h.position.set(xs[i], HOLE_Y, WALL_Z);
      if (this.litKinds.has(k)) lightWindow(h);
      this.house.add(h);
      if (animate) popIn(this.s, h);
      return h;
    });
  }

  zones() {
    return this.holes.map((h) => ({ obj: h, radius: 1.3, hole: h, enabled: h.userData.enabled !== false }));
  }

  async startRound(r) {
    const [kind, scale, rot, col] = this.plan[r];
    if (this.demoDone) this.cue();
    const kinds = this.holeKinds[r];
    if (kinds) {
      this.setHoles(this.level === 2 && r >= 3 ? kinds.slice().reverse() : kinds, r > 0);
      if (r > 0) sfx.sparkle();
    }
    for (const h of this.holes) { h.userData.enabled = true; h.scale.setScalar(1); }

    const p = makePiece(kind, col || PIECE_COL[kind]);
    p.userData.scale = scale;
    p.userData.rot = rot;
    p.userData.inner.rotation.z = rot;
    this.root.add(p);
    this.piece = p;
    this.magnet = null;
    await this.enter(p, ENTRANCES[r % ENTRANCES.length], scale);
    if (this.dead || this.piece !== p) return;
    p.userData.ready = true;
    this.target = input.addDrag(p, {
      radius: 1.0,
      minY: 0.6,
      zones: () => this.zones(),
      onPick: () => { pieceFace(p, 'oh'); this.s.tween(p.scale, { x: scale * 1.12, y: scale * 1.12, z: scale * 1.12 }, 0.15, Ease.back); },
      onMove: (_t, z) => this.pull(z),
      onDrop: (z, info) => this.drop(z, info),
    });
    if (!this.demoDone) this.cue();
  }

  // the piece arrives a different way each round
  async enter(p, how, scale) {
    const s = this.s, P = SPAWN;
    p.position.copy(P);
    if (how === 'door') {
      p.position.set(0, 0.9, WALL_Z + 0.3);
      p.scale.setScalar(0.001);
      sfx.tick();
      await s.tween(this.door.rotation, { y: -1.6 }, 0.18, Ease.out);
      p.scale.setScalar(scale * 0.7);
      sfx.boing();
      await s.anim(0.42, (e, q) => {
        p.position.z = WALL_Z + 0.3 + (P.z - WALL_Z - 0.3) * e;
        p.position.y = 0.9 + (P.y - 0.9) * e + Math.sin(q * Math.PI) * 1.2;
        p.scale.setScalar(scale * (0.7 + 0.3 * e));
      });
      s.tween(this.door.rotation, { y: 0 }, 0.25, Ease.back).then(() => sfx.thunk());
    } else if (how === 'chimney') {
      p.position.set(this.chimney.position.x, 6.2, WALL_Z - 0.35);
      p.scale.setScalar(scale);
      sfx.whoosh();
      fx.float(new T.Vector3(this.chimney.position.x, 6.8, WALL_Z), '☁', { color: '#ffffff', size: 8 });
      await s.anim(0.6, (e, q) => {
        p.position.x = this.chimney.position.x * (1 - e);
        p.position.z = WALL_Z - 0.35 + (P.z - WALL_Z + 0.35) * e;
        p.position.y = 6.2 + (P.y - 6.2) * e + Math.sin(q * Math.PI) * 1.5;
        p.userData.inner.rotation.z = p.userData.rot + (1 - e) * Math.PI * 2;
      });
      sfx.land();
    } else if (how === 'tumble') {
      p.position.x = -9;
      p.scale.setScalar(scale);
      sfx.swoosh();
      await s.anim(0.55, (e, q) => {
        p.position.x = -9 * (1 - e);
        p.position.y = P.y + Math.abs(Math.sin(q * Math.PI * 3)) * 0.6 * (1 - q);
        p.userData.inner.rotation.z = p.userData.rot - (1 - e) * Math.PI * 3;
      }, Ease.out);
      sfx.land();
    } else {
      // drop from the sky with a squashy landing
      p.position.y = 9;
      p.scale.setScalar(scale);
      sfx.whoosh();
      await s.tween(p.position, { y: P.y }, 0.4, Ease.in);
      sfx.thunk();
      await s.anim(0.22, (_, q) => { const k = Math.sin(q * Math.PI) * 0.25; p.scale.set(scale * (1 + k), scale * (1 - k), scale); });
    }
    p.userData.inner.rotation.z = p.userData.rot;
    p.position.copy(P);
    p.scale.setScalar(scale);
  }

  promptText() {
    const k = this.plan[this.round]?.[0];
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
    // turn toward a fitting angle while the magnet holds it; ease back to the tilt otherwise
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
    if (!zone) {
      pieceFace(p, 'happy');
      this.goHome(p);
      if (tapped) { wiggle(this.s, p, 0.4); sfx.boing2(); }
      return;
    }
    const hole = zone.hole;
    const kind = p.userData.kind;
    if (hole.userData.kind !== kind) return this.bonk(p, hole);
    // correct: praise starts now; the piece clicks in and a friend peeks out
    input.remove(this.target);
    p.userData.done = true;
    const lamp = this.lamps[this.round];
    this.success(hole.getWorldPosition(new T.Vector3()), `${Cap(kind)}!`);
    this.fit(p, hole, lamp);
  }

  // BONK: flies at the wrong window, splats flat, sees stars, wobbles home dizzy
  async bonk(p, hole) {
    const s = this.s, sc = p.userData.scale;
    this.redirect(`That's the ${NAME[hole.userData.kind]}. Find the ${NAME[p.userData.kind]}!`);
    pieceFace(p, 'oh');
    const w = hole.getWorldPosition(new T.Vector3());
    await s.tween(p.position, { x: w.x, y: w.y, z: w.z + 0.45 }, 0.16, Ease.in);
    sfx.thunk();
    sfx.boing();
    shake(s, hole, 0.12);
    pieceFace(p, 'dizzy');
    for (let i = 0; i < 3; i++) s.wait(i * 0.08).then(() => fx.float(new T.Vector3(w.x + (i - 1) * 0.5, w.y + 0.6, w.z + 0.5), '★', { color: '#ffd23f', size: 5 }));
    await s.anim(0.14, (_, q) => { const k = Math.sin(q * Math.PI); p.scale.set(sc * (1 + k * 0.35), sc * (1 - k * 0.35), sc * (1 - k * 0.5)); });
    p.scale.setScalar(sc);
    const from = p.position.clone(), inner = p.userData.inner, r0 = inner.rotation.z;
    await s.anim(0.45, (e, q) => {
      p.position.lerpVectors(from, SPAWN, e);
      p.position.y += Math.sin(q * Math.PI) * 1.2;
      inner.rotation.z = r0 + Math.sin(q * Math.PI * 4) * 0.4 * (1 - q);
    }, Ease.out);
    p.position.copy(SPAWN);
    inner.rotation.z = p.userData.rot;
    sfx.land();
    s.wait(0.3).then(() => { if (this.piece === p && !p.userData.done) pieceFace(p, 'happy'); });
  }

  async fit(p, hole, lamp) {
    const s = this.s, inner = p.userData.inner, sym = SYM[p.userData.kind];
    const wp = hole.getWorldPosition(new T.Vector3());
    pieceFace(p, 'happy');
    s.wait(0.2).then(() => this.peek(hole));
    s.tween(inner.rotation, { z: Math.round(inner.rotation.z / sym) * sym }, 0.2, Ease.out);
    s.tween(p.scale, { x: 1, y: 1, z: 1 }, 0.2, Ease.out);
    await s.tween(p.position, { x: wp.x, y: wp.y, z: wp.z + 0.6 }, 0.2, Ease.back);
    await s.tween(p.position, { z: wp.z + 0.1 }, 0.12, Ease.in);
    sfx.thunk();
    fx.confetti(wp.clone(), 14);
    s.tween(p.scale, { x: 0.001, y: 0.001, z: 0.001 }, 0.12, Ease.in).then(() => this.root.remove(p));
    // window lights up, the lamp too
    lightWindow(hole);
    this.litKinds.add(hole.userData.kind);
    s.anim(0.25, (_, q) => hole.scale.setScalar(1 + Math.sin(q * Math.PI) * 0.12));
    if (lamp) { lamp.material = toon(C.yellow); popIn(s, lamp, 1.3, 0.35, { sound: false }); }
  }

  // a friend pops up behind the flower box, says hello, waves and ducks back down
  async peek(hole) {
    const s = this.s;
    const [kind, snd] = PEEKERS[this.peekI++ % PEEKERS.length];
    const a = makeAnimal(kind);
    const K = 0.42;
    a.position.set(0, -1.95, 0.22);
    a.scale.setScalar(0.001);
    a.userData.baseScale = K;
    hole.add(a);
    await s.anim(0.22, (_, q) => { const e = Ease.back(q); a.scale.setScalar(Math.max(0.001, K * e)); a.position.y = -1.95 + 1.0 * e; });
    if (!a.parent) return;
    sfx[snd] && sfx[snd]();
    hop(s, a, 0.25, 0.3);
    const arm = a.userData.arms?.[1];
    if (arm) { const r0 = arm.rotation.z; s.anim(0.5, (_, q) => { arm.rotation.z = r0 + 1.6 + Math.sin(q * Math.PI * 5) * 0.4; }).then(() => { arm.rotation.z = r0; }); }
    await s.wait(0.65);
    await s.anim(0.2, (_, q) => { a.position.y = -0.95 - q; a.scale.setScalar(Math.max(0.001, K * (1 - q))); });
    hole.remove(a);
  }

  showHint(glow = true) {
    const p = this.piece;
    if (!p) return;
    const hole = this.holes.find((h) => h.userData.kind === p.userData.kind);
    if (!hole) return;
    if (glow) this.addHalo(hole, 1.3);
    fx.ghostHand(p.position.clone(), hole.getWorldPosition(new T.Vector3()));
  }

  makeErrorless() {
    const k = this.piece?.userData.kind;
    for (const h of this.holes) if (h.userData.kind !== k) {
      h.userData.enabled = false;
      this.s.tween(h.scale, { x: 0.5, y: 0.5, z: 0.5 }, 0.4);
    }
  }

  onFinale() {
    // friends come out of the house to wave, every window lit
    for (const h of this.holes) lightWindow(h);
    this.s.tween(this.door.rotation, { y: -1.6 }, 0.3, Ease.out);
    const kinds = ['bunny', 'bear'];
    kinds.forEach((k, i) => {
      const a = makeAnimal(k);
      a.position.set(i ? 2.3 : -2.3, 0, 1.2);
      a.scale.setScalar(0.9);
      a.userData.baseScale = 0.9;
      this.root.add(a);
      popIn(this.s, a, 0.9).then(() => hop(this.s, a, 0.7)).then(() => hop(this.s, a, 0.7));
    });
  }
}
