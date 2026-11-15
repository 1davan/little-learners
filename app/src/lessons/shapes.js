// Lesson 3 — Shape house. Topic mt_KJeEeTutJI "2-D shapes".
// Drag each shape to its matching hole. Later pieces are small, tilted or upside-down: a shape is still a shape.
import * as T from '../three.js';
import { Lesson } from '../engine/lesson.js';
import { mesh, geo, toon, basic } from '../engine/toon.js';
import { C, popIn, wiggle, shake, makeAnimal, hop } from '../engine/actors.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';

const SYM = { circle: Math.PI / 32, square: Math.PI / 2, triangle: (Math.PI * 2) / 3, rect: Math.PI };
const HOLE_Y = 3.2, WALL_Z = -1;
const SPAWN = new T.Vector3(0, 0.95, 4);
const LAYOUT = { 2: [-2.2, 2.2], 3: [-3, 0, 3], 4: [-3.6, -1.2, 1.2, 3.6] };

function outline2D(kind) {
  const s = new T.Shape();
  if (kind === 'circle') s.absarc(0, 0, 0.68, 0, Math.PI * 2, false);
  else if (kind === 'square') { s.moveTo(-0.62, -0.62); s.lineTo(0.62, -0.62); s.lineTo(0.62, 0.62); s.lineTo(-0.62, 0.62); s.closePath(); }
  else if (kind === 'rect') { s.moveTo(-0.9, -0.45); s.lineTo(0.9, -0.45); s.lineTo(0.9, 0.45); s.lineTo(-0.9, 0.45); s.closePath(); }
  else { const h = 1.45; s.moveTo(-0.84, -h / 3); s.lineTo(0.84, -h / 3); s.lineTo(0, (2 * h) / 3); s.closePath(); }
  return s;
}
const shapeGeoCache = {};
function shapeGeo(kind, depth) {
  const key = kind + depth;
  if (!shapeGeoCache[key]) {
    const g = new T.ExtrudeGeometry(outline2D(kind), { depth, bevelEnabled: depth > 0.15, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 2, curveSegments: 40 });
    g.translate(0, 0, -depth / 2);
    g.userData.shared = true;
    shapeGeoCache[key] = g;
  }
  return shapeGeoCache[key];
}

function makeHole(kind) {
  const g = new T.Group();
  const rim = new T.Mesh(shapeGeo(kind, 0.08), toon(0xf3d7a6));
  rim.scale.set(1.3, 1.3, 1);
  const hole = new T.Mesh(shapeGeo(kind, 0.08), basic(0x3a2f5b));
  hole.scale.set(1.12, 1.12, 1);
  hole.position.z = 0.06;
  const edge = new T.Mesh(shapeGeo(kind, 0.08), basic(0x2a2440));
  edge.scale.set(1.36, 1.36, 1);
  edge.position.z = -0.03;
  g.add(edge, rim, hole);
  g.userData = { kind, hole };
  return g;
}

function makePiece(kind, color) {
  const m = mesh(shapeGeo(kind, 0.32), color, { hull: 1.08 });
  const hi = new T.Mesh(geo.sphere(0.09, 8, 6), basic(0xffffff));
  hi.position.set(-0.25, 0.22, 0.24);
  hi.scale.z = 0.3;
  m.add(hi);
  m.userData = { kind };
  return m;
}

const NAME = { circle: 'circle', square: 'square', triangle: 'triangle', rect: 'rectangle' };
const PIECE_COL = { circle: C.red, square: C.blue, triangle: C.yellow, rect: C.green };

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
    const door = mesh(geo.box(1.4, 1.9, 0.15), 0x9a6a44, { hull: 1.05 });
    door.position.set(0, 0.95, WALL_Z);
    const knob = mesh(geo.sphere(0.1, 8, 6), C.yellow, { outline: 0.02 });
    knob.position.set(0.45, 0.95, WALL_Z + 0.12);
    house.add(wall, roof, chimney, door, knob);
    this.root.add(house);
    this.house = house;
    this.door = door;

    // lamps along the top of the wall: one lights per success
    this.lamps = [];
    for (let i = 0; i < 6; i++) {
      const l = mesh(geo.sphere(0.24, 14, 10), 0x8a8fa0, { outline: 0.025 });
      l.position.set(-3.75 + i * 1.5, 4.35, WALL_Z + 0.05);
      house.add(l);
      this.lamps.push(l);
    }
    this.holes = [];
    this.setHoles(this.holeKinds[0], false);
  }

  setHoles(kinds, animate = true) {
    for (const h of this.holes) this.house.remove(h);
    const xs = LAYOUT[kinds.length];
    this.holes = kinds.map((k, i) => {
      const h = makeHole(k);
      h.position.set(xs[i], HOLE_Y, WALL_Z);
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
    const kinds = this.holeKinds[r];
    if (kinds) {
      this.busy = true;
      this.setHoles(this.level === 2 && r >= 3 ? kinds.slice().reverse() : kinds, r > 0);
      if (r > 0) { sfx.sparkle(); await this.wait(0.35); }
      this.busy = false;
    }
    for (const h of this.holes) { h.userData.enabled = true; h.scale.setScalar(1); }

    const p = makePiece(kind, col || PIECE_COL[kind]);
    p.userData.scale = scale;
    p.position.copy(SPAWN);
    p.rotation.z = rot;
    this.root.add(p);
    this.piece = p;
    sfx.boing();
    await popIn(this.s, p, scale);
    this.target = input.addDrag(p, {
      radius: 1.0,
      minY: 0.6,
      zones: () => this.zones(),
      onPick: () => this.s.tween(p.scale, { x: scale * 1.12, y: scale * 1.12, z: scale * 1.12 }, 0.15),
      onDrop: (z, info) => this.drop(z, info),
    });
    this.cue();
  }

  promptText() {
    const k = this.piece?.userData.kind;
    return k ? `${NAME[k][0].toUpperCase() + NAME[k].slice(1)}! Where does the ${NAME[k]} go?` : '';
  }

  goHome(p) {
    const s = p.userData.scale;
    this.s.tween(p.position, { x: SPAWN.x, y: SPAWN.y, z: SPAWN.z }, 0.5, Ease.back);
    this.s.tween(p.scale, { x: s, y: s, z: s }, 0.3);
  }

  async drop(zone, { tapped }) {
    const p = this.piece;
    if (!zone) {
      this.goHome(p);
      if (tapped) { wiggle(this.s, p, 0.4); }
      return;
    }
    const hole = zone.hole;
    const kind = p.userData.kind;
    if (hole.userData.kind !== kind) {
      // bonk! it bounces off the wrong hole with a spin
      sfx.boing();
      const rz0 = p.rotation.z;
      this.s.anim(0.5, (_, q) => { p.rotation.z = rz0 + q * Math.PI * 2; }).then(() => { p.rotation.z = rz0; });
      this.goHome(p);
      shake(this.s, hole, 0.12);
      this.redirect(`That's the ${NAME[hole.userData.kind]}. Find the ${NAME[kind]}!`);
      return;
    }
    // correct: snap upright, fit, and slide in
    input.remove(this.target);
    this.busy = true;
    const sym = SYM[kind];
    const rz = Math.round(p.rotation.z / sym) * sym;
    const wp = hole.getWorldPosition(new T.Vector3());
    this.s.tween(p.rotation, { z: rz }, 0.28, Ease.out);
    this.s.tween(p.scale, { x: 1, y: 1, z: 1 }, 0.28, Ease.out);
    await this.s.tween(p.position, { x: wp.x, y: wp.y, z: wp.z + 0.6 }, 0.28, Ease.back);
    sfx.whoosh();
    await this.s.tween(p.position, { z: wp.z + 0.1 }, 0.18, Ease.in);
    sfx.thunk();
    fx.confetti(wp.clone(), 18);
    await this.s.tween(p.scale, { x: 0.001, y: 0.001, z: 0.001 }, 0.18, Ease.in);
    this.root.remove(p);
    const lamp = this.lamps[this.round];
    if (lamp) { lamp.material = toon(C.yellow); popIn(this.s, lamp, 1.3); }
    this.busy = false;
    this.success(wp, `${NAME[kind][0].toUpperCase() + NAME[kind].slice(1)} goes in!`);
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
    // friends come out of the house to wave
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
