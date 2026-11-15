// Home: one page per world (meadow, beach…) with five big, bouncy game objects. Tap one to play; swipe for the next world.
import * as T from './three.js';
import { scene, onFrame, camera, getLook, CAM_HOME, setSky } from './engine/stage.js';
import { scope, Ease } from './engine/tween.js';
import { input } from './engine/input.js';
import { speech } from './engine/speech.js';
import { sfx } from './engine/audio.js';
import { fx } from './engine/fx.js';
import { store } from './engine/store.js';
import { mesh, geo, toon, basic, disposeTree, ink } from './engine/toon.js';
import { C, makePip, makeAnimal, makeFace, hop, dance, breathe, popIn } from './engine/actors.js';
import { makeScenery, makeTree, animateScenery, makeStarfish } from './engine/scenery.js';
import { renderShelf, checkSleepy, setPageHandler, renderPages } from './engine/ui.js';
import { WORLDS } from './lessons/meta.js';
import { makeFarmAnimal, makeCarrot, makeDrum, makePot, makeChick } from './engine/farm.js';
import { makeSunflower } from './engine/scenery.js';
import { makeCrab, makeBucket, makeBeachBall, makeShell, makeSponge, makeDuck, makeBubble } from './engine/beach.js';

let greeted = false;

function iconColours() {
  const g = new T.Group();
  [[C.red, -0.75], [C.blue, 0], [C.yellow, 0.75]].forEach(([c, x], i) => {
    const glass = new T.Mesh(geo.cyl(0.36, 0.36, 1.6, 20, true), new T.MeshToonMaterial({ color: c, transparent: true, opacity: 0.35, side: T.DoubleSide, depthWrite: false }));
    glass.position.set(x, 0.95, 0);
    const base = mesh(geo.cyl(0.42, 0.44, 0.2, 20), c, { outline: 0.03 });
    base.position.set(x, 0.1, 0);
    const ball = mesh(geo.sphere(0.3, 16, 12), c, { outline: 0.03 });
    ball.position.set(x, 0.5 + i * 0.15, 0);
    const rim = mesh(geo.torus(0.37, 0.07, Math.PI * 2, 8, 24), c, { outline: 0.02 });
    rim.rotation.x = Math.PI / 2; rim.position.set(x, 1.75, 0);
    g.add(glass, base, ball, rim);
  });
  return g;
}
function iconCounting() {
  const t = makeTree(0.85);
  [[-0.6, 2.4], [0.5, 2.7], [0.1, 1.9]].forEach(([x, y]) => {
    const a = mesh(geo.sphere(0.3, 16, 12), 0xff4b4b, { outline: 0.03 });
    a.position.set(x / 0.85, y / 0.85, 1.25);
    t.add(a);
  });
  return t;
}
function iconShapes() {
  const g = new T.Group();
  const wall = mesh(geo.box(2.3, 1.7, 0.5), 0xfff1d6, { hull: 1.03 });
  wall.position.y = 0.85;
  const rs = new T.Shape(); rs.moveTo(-1.45, 0); rs.lineTo(1.45, 0); rs.lineTo(0, 1); rs.closePath();
  const rg = new T.ExtrudeGeometry(rs, { depth: 0.7, bevelEnabled: false }); rg.translate(0, 0, -0.35);
  const roof = mesh(rg, 0xff6b5a, { hull: 1.03 }); roof.position.y = 1.7;
  const c = mesh(geo.cyl(0.27, 0.27, 0.1, 24), C.red, { outline: 0.02 }); c.rotation.x = Math.PI / 2; c.position.set(-0.65, 1.0, 0.28);
  const sq = mesh(geo.box(0.5, 0.5, 0.1), C.blue, { hull: 1.08 }); sq.position.set(0.05, 1.0, 0.28);
  const tri = mesh(geo.cyl(0.32, 0.32, 0.1, 3), C.yellow, { outline: 0.02 }); tri.rotation.set(-Math.PI / 2, 0, 0); tri.position.set(0.7, 0.95, 0.28);
  g.add(wall, roof, c, sq, tri);
  return g;
}
function iconFeelings() {
  const g = new T.Group();
  const b = mesh(geo.sphere(0.95, 24, 18), 0xffc83a, { outline: 0.04 });
  b.position.y = 2.15;
  const face = makeFace(0.95);
  b.add(face);
  const string = new T.Mesh(geo.cyl(0.02, 0.02, 1.3, 4), basic(0x555555));
  string.position.y = 0.65;
  g.add(b, string);
  g.userData.face = face;
  return g;
}
function iconSizes() {
  const g = new T.Group();
  const big = makeAnimal('elephant'); big.scale.setScalar(0.72); big.position.x = -0.35;
  const small = makeAnimal('elephant'); small.scale.setScalar(0.36); small.position.set(0.95, 0, 0.5);
  g.add(big, small);
  return g;
}
// ---- beach world icons ----
function iconPatterns() {
  const g = new T.Group();
  const cols = [C.red, C.blue, C.red, C.blue];
  cols.forEach((c, i) => {
    const b = makeBeachBall(0.32, [c, c, c]);
    b.position.set(-0.85 + i * 0.57, 0.45 + Math.sin(i) * 0.05, 0);
    g.add(b);
  });
  const q = mesh(geo.sphere(0.32, 16, 12), 0xffffff, { outline: 0.03 });
  q.position.set(0, 1.25, 0.1);
  const qm = new T.Mesh(geo.torus(0.12, 0.04, Math.PI * 1.4, 6, 16), basic(0x2a2440));
  qm.position.set(0, 1.3, 0.42); qm.rotation.z = -0.4;
  const qd = new T.Mesh(geo.sphere(0.04, 6, 4), basic(0x2a2440)); qd.position.set(0, 1.08, 0.43);
  g.add(q, qm, qd);
  return g;
}
function iconWhere() {
  const g = new T.Group();
  const b = makeBucket(0x4a90ff, 0.75, 0.9);
  const crab = makeCrab();
  crab.scale.setScalar(0.6);
  crab.position.set(0, 0.92, 0.05);
  g.add(b, crab);
  return g;
}
function iconMore() {
  const g = new T.Group();
  const cols = [0xffb6c9, 0xffffff, 0xffd9a8, 0xd8b6ff, 0xffb6c9];
  const many = [[-0.95, 0.15, 0.2], [-0.55, 0.15, 0.35], [-0.75, 0.42, 0.25], [-1.15, 0.15, -0.1], [-0.45, 0.4, 0]];
  many.forEach(([x, y, z], i) => { const s = makeShell(cols[i], 0.7); s.position.set(x, y, z); g.add(s); });
  const one = makeShell(0xffd9a8, 0.7); one.position.set(0.85, 0.15, 0.2); g.add(one);
  return g;
}
function iconBody() {
  const b = makeAnimal('bear');
  b.scale.setScalar(0.85);
  return b;
}
function iconWash() {
  const g = new T.Group();
  const tub = makeBucket(0xffffff, 1.05, 0.7);
  g.add(tub);
  for (let i = 0; i < 6; i++) { const b = makeBubble(0.2 + (i % 3) * 0.06); b.position.set(-0.6 + (i % 3) * 0.6, 0.85 + Math.floor(i / 3) * 0.3, (i % 2) * 0.2); g.add(b); }
  const duck = makeDuck(0.6); duck.position.set(0.1, 0.75, 0.3); g.add(duck);
  const sp = makeSponge(); sp.scale.setScalar(0.55); sp.position.set(1.0, 1.55, 0.2); sp.rotation.z = -0.4; g.add(sp);
  return g;
}

// ---- farm world icons ----
function iconMoo() { const c = makeFarmAnimal('cow'); c.scale.setScalar(0.8); return c; }
function iconGrow() {
  const g = new T.Group();
  const pot = mesh(geo.cyl(0.7, 0.5, 0.8, 18), 0xd9774a, { outline: 0.03 }); pot.position.y = 0.4;
  const stem = mesh(geo.cyl(0.06, 0.08, 1.2, 8), 0x4f9e3a, { outline: 0.012 }); stem.position.y = 1.3;
  const sf = makeSunflower(0.01); sf.position.y = 1.85; sf.scale.setScalar(1.3);
  for (const s2 of [-1, 1]) { const l = mesh(geo.sphere(0.2, 10, 8), 0x58c45e, { outline: 0.012 }); l.scale.set(1.5, 0.35, 0.7); l.position.set(s2 * 0.28, 1.2, 0); l.rotation.z = s2 * 0.5; g.add(l); }
  g.add(pot, stem, sf);
  return g;
}
function iconShare() {
  const g = new T.Group();
  const b = makeAnimal('bunny'); b.scale.setScalar(0.7); g.add(b);
  const c = makeCarrot(0.9); c.position.set(0.75, 0.9, 0.5); c.rotation.z = -0.6; g.add(c);
  return g;
}
function iconBand() { const d = makeDrum(0xd94f3d, 1.0, 0.95); return d; }
function iconPots() {
  const g = new T.Group();
  const p = makePot(); p.scale.setScalar(0.8); p.rotation.z = 0.35; p.position.set(-0.3, 0.45, -0.2); g.add(p);
  const c = makeChick(0.75); c.position.set(0.55, 0, 0.35); g.add(c);
  return g;
}

const ICONS = { colours: iconColours, counting: iconCounting, shapes: iconShapes, feelings: iconFeelings, sizes: iconSizes,
  patterns: iconPatterns, where: iconWhere, more: iconMore, body: iconBody, wash: iconWash,
  moo: iconMoo, grow: iconGrow, share: iconShare, band: iconBand, pots: iconPots };
const SPOTS = [[-6, 0.4], [-3, -0.6], [0, -1], [3, -0.6], [6, 0.4]];
const CENTER_Y = { colours: 1, counting: 1.8, shapes: 1.1, feelings: 1.7, sizes: 1.1, patterns: 0.8, where: 1.0, more: 0.5, body: 1.2, wash: 0.9, moo: 1.4, grow: 1.1, share: 1.0, band: 0.6, pots: 0.8 };

function makeCrown() {
  const g = new T.Group();
  const band = mesh(geo.cyl(0.42, 0.42, 0.25, 16, true), C.yellow, { outline: 0.03 });
  g.add(band);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const p = mesh(geo.cone(0.12, 0.3, 6), C.yellow, { outline: 0.02 });
    p.position.set(Math.cos(a) * 0.38, 0.25, Math.sin(a) * 0.38);
    g.add(p);
  }
  return g;
}

export class Home {
  constructor(router, opts = {}) {
    this.router = router;
    this.opts = opts;
    this.root = new T.Group();
    this.s = scope();
    this.offs = [];
    this.idle = 0;
    this.dead = false;
  }

  async start() {
    this.page = this.opts.page || 0;
    this.world = WORLDS[this.page];
    scene.add(this.root);
    setSky(this.world.id);
    this.meadow = makeScenery(this.world.id);
    this.root.add(this.meadow);
    this.objects = this.world.lessons.map((l, i) => {
      const o = ICONS[l.id]();
      const [x, z] = SPOTS[i];
      o.position.set(x, 0, z);
      o.rotation.y = -x * 0.04;
      o.userData.lesson = l;
      o.userData.phase = i * 1.3;
      this.root.add(o);
      // small round pedestal in the lesson colour so each target reads as one big button
      const ped = mesh(geo.cyl(1.35, 1.45, 0.22, 28), new T.Color(l.color).getHex(), { outline: 0.03 });
      ped.position.set(x, 0.11, z);
      this.root.add(ped);
      if (store.stickers(l.id) >= 3) {
        const crown = makeCrown();
        crown.position.set(0, CENTER_Y[l.id] * 2 + 0.6, 0);
        o.add(crown);
      }
      input.addTap(o, { radius: 1.45, offset: new T.Vector3(0, CENTER_Y[l.id], 0), onTap: () => this.pick(o), onRelease: true });
      return o;
    });
    this.pip = makePip();
    this.pip.position.set(0, 0, 6.6);
    this.pip.scale.setScalar(0.55);
    this.pip.userData.baseScale = 0.55;
    this.root.add(this.pip);
    input.addTap(this.pip, { radius: 0.7, offset: new T.Vector3(0, 0.6, 0), onTap: () => this.tapPip(), onRelease: true });

    this.offs.push(input.onAny(() => { this.idle = 0; }));
    this.offs.push(onFrame((dt, t) => this.tick(dt, t)));
    this.offs.push(input.onSwipe((dir) => this.swipe(dir)));
    setPageHandler((dir) => this.swipe(dir));
    renderShelf(this.world.lessons, this.opts.newSticker || null);
    renderPages(this.page);
    // slide in from the side we swiped toward
    if (this.opts.from) {
      this.root.position.x = this.opts.from === 'left' ? 24 : -24;
      this.s.tween(this.root.position, { x: 0 }, 0.55, Ease.out);
    }

    if (checkSleepy()) return;
    await this.s.wait(0.4);
    if (this.opts.newSticker) { sfx.sparkle(); speech.say('Look! A new sticker! Tap another game!'); }
    else if (this.opts.from) { sfx.sparkle(); speech.say(['The meadow! Tap a game!', 'The beach! Tap a game!', 'The farm! Tap a game!'][this.page] || 'Tap a game!'); }
    else if (!greeted) { greeted = true; dance(this.s, this.pip); speech.say("Hi! I'm Pip! Tap a game! Swipe for more games!"); }
    else speech.say('Tap one!');
  }

  tick(dt, t) {
    animateScenery(this.meadow, dt, t);
    breathe(this.pip, t);
    for (const o of this.objects) {
      if (o.userData.busyAnim) continue;
      o.position.y = Math.abs(Math.sin(t * 1.6 + o.userData.phase)) * 0.12;
      if (o.userData.face) breathe(o, t, o.userData.phase);
    }
    this.idle += dt;
    if (this.idle > 10 && !this.picking) {
      this.idle = 0;
      this.objects.forEach((o, i) => this.s.wait(i * 0.25).then(() => { hop(this.s, o, 0.6, 0.42, { sound: true }); sfx.note(i); }));
      speech.say('Tap one!');
    }
  }

  async swipe(dir) {
    if (this.picking || this.dead) return;
    this.picking = true;
    // swiping left (or tapping ▶) goes to the next world; right goes back. Wraps around.
    const n = WORLDS.length;
    const next = dir === 'left' ? (this.page + 1) % n : (this.page - 1 + n) % n;
    sfx.whoosh();
    await this.s.tween(this.root.position, { x: dir === 'left' ? -24 : 24 }, 0.35, Ease.in);
    this.router.go('home', { page: next, from: dir });
  }

  tapPip() {
    sfx.giggle();
    dance(this.s, this.pip);
    speech.say(["Hi! I'm Pip!", 'Hee hee! That tickles!', 'Tap a game!'][Math.floor(Math.random() * 3)]);
  }

  async pick(o) {
    if (this.picking) return;
    this.picking = true;
    input.lock(5000);
    const l = o.userData.lesson;
    sfx.boing();
    fx.confetti(o.position.clone().add(new T.Vector3(0, CENTER_Y[l.id], 0)), 30);
    hop(this.s, o, 0.8);
    speech.say(l.name);
    // camera swoops in toward the chosen object
    const look = getLook();
    const target = o.position.clone().add(new T.Vector3(0, CENTER_Y[l.id], 0));
    this.s.tween(look, { x: target.x, y: target.y, z: target.z }, 0.65, Ease.inOut);
    await this.s.tween(camera.position, { x: target.x * 0.8, y: target.y + 1.5, z: target.z + 7 }, 0.7, Ease.inOut);
    input.unlock();
    this.router.go(l.id);
  }

  dispose() {
    this.dead = true;
    this.s.kill();
    input.clear();
    for (const f of this.offs) f();
    scene.remove(this.root);
    disposeTree(this.root);
  }
}
