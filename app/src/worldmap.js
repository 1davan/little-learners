// World map: the overview the app opens on. Five toy islands in a calm sea, one per world, joined by stepping stones
// in play order, each with its landmark (a flower meadow, a palm beach, the red barn, a cosy house, a tower crane) and
// one little pedestal per game in that game's colour; a label under each island names the world and shows its games.
// Tap an island (or its label): the camera flies down to it and that world's page opens. On a world page the 🗺️ dot
// (bottom right) comes back here. Level 1/2/3 changes the map's look too: sunny day · golden sunset · starry night,
// and each island wears its own world's level look (autumn meadow, snowy meadow, harvest farm...).
// Every landmark, island and pedestal is a Blender model (tools/blender/creatures/prop_map_island, prop_house,
// prop_crane, plus the shared scenery props).
import * as T from './three.js';
import { scene, onFrame, camera, getLook, setSky, setCamera, project } from './engine/stage.js';
import { scope, Ease } from './engine/tween.js';
import { input } from './engine/input.js';
import { speech } from './engine/speech.js';
import { sfx, setAmbience } from './engine/audio.js';
import { fx } from './engine/fx.js';
import { store } from './engine/store.js';
import { mesh, geo, toon, disposeTree } from './engine/toon.js';
import { makePip, hop, dance, breathe } from './engine/actors.js';
import {
  makeTree, makeFlower, makePalm, makeBarn, makeSilo, makeHay, makeSunflower, makeStarfish, makePumpkin, makeSnowman,
  makeCloud, makeSun, makeMoon, scProp, scInstances, glow, addStars, driftClouds,
} from './engine/scenery.js';
import { theme } from './engine/theme.js';
import { physics } from './engine/physics.js';
import { setLevelHandler, setUiWorld, renderShelf, renderPages } from './engine/ui.js';
import { WORLDS } from './lessons/meta.js';
import { makeBrick } from './lessons/bricks-pieces.js';
import { makeBeachBall } from './engine/beach.js';
const ARRIVE = { meadow: 'The meadow!', beach: 'The beach!', farm: 'The farm!', dressup: 'Home!', build: 'The building site!' };

let greeted = false;
const CAM = { pos: new T.Vector3(0, 15.5, 21), look: new T.Vector3(0, 0.2, -1.6) };
// island centres (x, z) and radius, in play order: a zig-zag path from left to right
const SPOTS = [[-9.6, 2.0, 2.8], [-5.0, -5.9, 2.8], [0, 1.6, 2.9], [5.0, -5.9, 2.8], [9.6, 2.0, 2.8]];
const HALF_W = 12.9; // the map's half width that must fit on screen (the camera backs off on narrow screens)
const OVAL = 0.86; // the island model is a little oval (z radius = 0.86 x)
const RISE = 0.85; // island top above the water
// island cap colour per world and level
const TOP = {
  meadow: [0x8fdc6c, 0xe2c062, 0xf4f8ff], beach: [0xf6dc9b, 0xf6d49b, 0xd8c8a8], farm: [0x9bd45a, 0xe0c45e, 0x8fcc5a],
  dressup: [0xa6e07a, 0xa6e07a, 0x8fc86a], build: [0xf3d79a, 0xe8c48e, 0xb8ad9e],
};
const SEA = [[0x56c4ee, 0x8fdcf5], [0x8f9fdc, 0xffb8c8], [0x24357a, 0x3f58a8]];

// ---- landmarks: built around (0, 0, 0) = the island's top centre, front toward +z, about 5 x 4 units ----
function meadowLand(g, level) {
  const tint = [0x5cc45a, 0xf7953a, 0x5cc45a][level];
  const t = makeTree(0.6, tint, { snow: level === 2 }); t.position.set(-0.9, 0, -0.9); g.add(t);
  const t2 = makeTree(0.42, level === 1 ? 0xffc23a : 0x6fcf5a, { snow: level === 2 }); t2.position.set(1.4, 0, -1.2); g.add(t2);
  if (level === 2) { const s = makeSnowman(0.55); s.position.set(1.1, 0, 0.1); g.add(s); return; }
  const cols = level === 1 ? [0xff8a1f, 0xe8503a, 0xffc23a, 0xffffff] : [0xff6fa8, 0xffd23f, 0xffffff, 0xb197fc, 0xff5a5a];
  [[0.2, -0.2], [0.75, 0.25], [1.45, -0.15], [-0.4, 0.45], [1.9, 0.5], [0.3, 0.75], [-1.7, 0.15], [-2.1, -0.4], [1.0, -0.6]].forEach(([x, z], i) => {
    const f = makeFlower(cols[i % cols.length]); f.position.set(x, 0, z); f.rotation.y = i; f.scale.setScalar(0.9); g.add(f);
  });
  if (level === 1) { const p = makePumpkin(0.4); p.position.set(-1.6, 0, 0.6); g.add(p); }
}
function beachLand(g, level) {
  const palm = makePalm(0.62, 0.3, level === 1 ? 0x5fb84a : 0x3fbf5a); palm.position.set(-1.0, 0, -0.7); g.add(palm);
  g.userData.palm = palm;
  const castle = scProp('prop_castle', { door: {}, flag: {}, roof: {}, shells: { ink: 0.014 } }, { ink: 0.024 });
  if (castle) { castle.scale.setScalar(0.48); castle.position.set(1.1, 0, -0.5); castle.rotation.y = -0.4; g.add(castle); }
  const ball = makeBeachBall(0.3); ball.position.set(-1.9, 0.3, 0.2); ball.rotation.set(0.4, 0.6, 0.2); g.add(ball);
  const st = makeStarfish(0xff8a5c, 0.22); st.position.set(0.1, 0.03, 0.45); st.rotation.y = 0.5; g.add(st);
}
function farmLand(g, level) {
  const barn = makeBarn(); barn.scale.setScalar(0.42); barn.position.set(-0.45, 0, -0.75); g.add(barn);
  const silo = makeSilo(); silo.scale.setScalar(0.42); silo.position.set(1.35, 0, -1.05); g.add(silo);
  const hay = makeHay(0.42); hay.position.set(1.7, 0, 0.1); hay.rotation.y = -0.5; g.add(hay);
  if (level === 1) [[-2.0, 0.3], [-1.6, 0.75]].forEach(([x, z], i) => { const p = makePumpkin(0.38 - i * 0.06); p.position.set(x, 0, z); g.add(p); });
  else { const f = makeSunflower(1.1); f.scale.setScalar(0.7); f.position.set(-2.0, 0, 0.0); g.add(f); }
}
function homeLand(g, level) {
  const night = level === 2;
  const house = scProp('prop_house', { trim: {}, glass: night ? { glow: true, tint: 0xffd68a } : {}, roof: {}, flowers: { ink: 0.014 } }, { ink: 0.026 });
  if (house) { house.scale.setScalar(0.62); house.position.set(0, 0, -0.75); g.add(house); }
  if (night) for (const x of [-0.67, 0.67]) { const gl = glow(0xffd68a, 1.3, 0.55); gl.position.set(x, 0.9, 0.2); g.add(gl); }
  const t = makeTree(0.4, 0x5cc45a); t.position.set(-1.95, 0, -0.9); g.add(t);
  // a stepping-stone path to the door
  for (let i = 0; i < 3; i++) { const s = mesh(geo.cyl(0.17, 0.19, 0.05, 14), 0xe2d6c4, { outline: 0.012 }); s.position.set((i % 2 ? 0.08 : -0.08), 0.03, 0.35 + i * 0.36); g.add(s); }
  [[-1.2, 0.2, 0xff6fa8], [1.25, 0.2, 0xffd23f], [1.6, -0.1, 0xb197fc], [-1.55, -0.05, 0xffffff]].forEach(([x, z, c], i) => {
    const f = makeFlower(c); f.position.set(x, 0, z); f.rotation.y = i; f.scale.setScalar(0.8); g.add(f);
  });
}
function buildLand(g, level) {
  const crane = scProp('prop_crane', { metal: {}, glass: level === 2 ? { glow: true, tint: 0xffe39a } : {}, load: {} }, { ink: 0.03 });
  if (crane) {
    crane.scale.setScalar(0.5); crane.position.set(-0.9, 0, -0.85); g.add(crane);
    g.userData.crane = crane;
    if (level === 2) { const l = glow(0xff3a3a, 1.2, 0.8); l.position.set(-0.9, 3.95, -0.85); g.add(l); g.userData.lamp = l; }
  }
  const pile = scProp('prop_sandpile', { shells: {}, handle: {}, blade: {} }, { ink: 0.022 });
  if (pile) { pile.scale.setScalar(0.62); pile.position.set(1.45, 0, -0.6); g.add(pile); }
  const k = 0.3, cols = [0xff4f4f, 0x3f8cff, 0xffd23a, 0x4cc75a];
  [[0, 0], [0.62, 0], [0.31, 0.19]].forEach(([x, y], i) => {
    const b = makeBrick(cols[i], 0.55, k); b.rotation.set(-Math.PI / 2, 0, 0.1); // studs up, lying on the ground
    b.position.set(1.15 + x * 1.1, 0.08 + y * 0.6, 0.55 - y * 0.3); g.add(b);
  });
}
const LANDS = { meadow: meadowLand, beach: beachLand, farm: farmLand, dressup: homeLand, build: buildLand };

export class WorldMap {
  constructor(router, opts = {}) {
    this.router = router;
    this.opts = opts;
    this.root = new T.Group();
    this.s = scope();
    this.offs = [];
    this.anims = [];
    this.idle = 0;
    this.dead = false;
  }

  async start() {
    physics.clear();
    this.level = store.level();
    const lv = this.level;
    scene.add(this.root);
    setSky('map', lv);
    setAmbience('meadow');
    // back the camera off along its line of sight until the whole archipelago fits the screen's width
    const hHalf = Math.atan(Math.tan(T.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
    const dist = CAM.pos.distanceTo(CAM.look), k = Math.max(1, HALF_W / (Math.tan(hHalf) * dist));
    this.cam = CAM.pos.clone().sub(CAM.look).multiplyScalar(k).add(CAM.look);
    setCamera(this.cam, CAM.look);
    this.buildSea(lv);
    this.islands = WORLDS.map((w, i) => this.buildIsland(w, i, lv));
    this.buildPaths();
    this.buildSky(lv);
    // Pip bobs in a swim ring in the bay at the front (the sea hides the bottom half)
    const boat = new T.Group(); boat.position.set(-4.8, 0, 6.0); this.root.add(boat);
    const ring = scProp('prop_ring', { white: {} }, { ink: 0.03 });
    if (ring) { ring.scale.setScalar(0.6); ring.position.y = 0.02; boat.add(ring); }
    this.boat = boat;
    this.pip = makePip(); this.pip.scale.setScalar(0.5); this.pip.userData.baseScale = 0.5;
    this.pip.position.set(0, -0.12, 0); this.pip.rotation.y = 0.25;
    boat.add(this.pip);
    input.addTap(this.pip, { radius: 0.9, offset: new T.Vector3(0, 0.5, 0), onTap: () => this.tapPip(), onRelease: true });
    this.makeLabels();
    this.offs.push(input.onAny(() => { this.idle = 0; }));
    this.offs.push(onFrame((dt, t) => this.tick(dt, t)));
    setUiWorld('map');
    setLevelHandler(() => { if (!this.dead && !this.picking) this.router.go('map', { relevel: true }); });
    renderShelf([]);
    renderPages(-1);

    // coming back from a world page: start low over that island and pull back to the whole map
    const from = this.opts.from && WORLDS.findIndex((w) => w.id === this.opts.from);
    if (from >= 0) {
      const [x, z] = SPOTS[from];
      camera.position.set(x * 0.9, 6, z + 8.5); getLook().set(x, 1.2, z);
      this.picking = true;
      this.s.tween(getLook(), { x: CAM.look.x, y: CAM.look.y, z: CAM.look.z }, 0.9, Ease.inOut);
      await this.s.tween(camera.position, { x: this.cam.x, y: this.cam.y, z: this.cam.z }, 0.9, Ease.inOut);
      this.picking = false;
    } else await this.s.wait(0.4);
    if (this.dead) return;
    if (this.opts.relevel) { sfx.sparkle(); dance(this.s, this.pip); speech.say(`Level ${lv + 1}! ${theme('map', lv).name}!`); }
    else if (!greeted) { greeted = true; dance(this.s, this.pip); speech.say("Hi! I'm Pip! Where shall we play? Tap a world!"); }
    else speech.say('Tap a world!');
  }

  buildSea(lv) {
    const [deep, shallow] = SEA[lv];
    const sea = new T.Mesh(geo.circle(70, 64), toon(deep)); sea.rotation.x = -Math.PI / 2; this.root.add(sea);
    // a lighter lagoon round the islands, and soft foam rings that breathe on every shore
    const lag = new T.Mesh(geo.circle(1, 48), toon(shallow)); lag.rotation.x = -Math.PI / 2; lag.scale.set(15.5, 9.5, 1); lag.position.set(0, 0.01, -1.6); this.root.add(lag);
    this.foam = [];
    SPOTS.forEach(([x, z, r], i) => {
      const f = new T.Mesh(geo.ring(r * 1.08, r * 1.22, 48), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, depthWrite: false }));
      f.rotation.x = -Math.PI / 2; f.scale.set(1, OVAL, 1); f.position.set(x, 0.02, z); f.userData.ph = i * 1.3;
      this.root.add(f); this.foam.push(f);
    });
    // glints on the water
    const glints = [];
    for (let i = 0; i < 26; i++) glints.push({ x: (Math.random() - 0.5) * 34, y: 0.03, z: -12 + Math.random() * 18, s: [0.6 + Math.random() * 0.6, 1, 0.12] });
    const gm = new T.InstancedMesh(geo.circle(0.5, 10), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: lv === 2 ? 0.35 : 0.55, depthWrite: false }), glints.length);
    const m4 = new T.Matrix4(), q = new T.Quaternion().setFromEuler(new T.Euler(-Math.PI / 2, 0, 0));
    glints.forEach((g, i) => { m4.compose(new T.Vector3(g.x, g.y, g.z), q, new T.Vector3(...g.s)); gm.setMatrixAt(i, m4); });
    this.root.add(gm);
  }

  buildIsland(w, i, lv) {
    const [x, z, r] = SPOTS[i];
    const g = new T.Group(); g.position.set(x, 0, z); this.root.add(g);
    const isl = scProp('prop_map_island', { top: { tint: TOP[w.id][lv] }, sand: {} }, { ink: 0.02 });
    if (isl) { isl.scale.set(r, RISE / 0.6, r); isl.position.y = 0.55 * (RISE / 0.6) - 0.02; g.add(isl); }
    else { const c = mesh(geo.cyl(r, r * 1.05, RISE, 40), TOP[w.id][lv], { outline: 0.03 }); c.scale.z = OVAL; c.position.y = RISE / 2; g.add(c); }
    const land = new T.Group(); land.position.y = RISE + 0.06; g.add(land);
    (LANDS[w.id] || (() => {}))(land, lv);
    // one soft pedestal per game, in the game's colour, in an arc along the front of the island
    const n = w.lessons.length, gap = n > 4 ? 0.76 : 0.9;
    w.lessons.forEach((l, k) => {
      const px = (k - (n - 1) / 2) * gap, pz = r * OVAL * 0.62 - Math.abs(k - (n - 1) / 2) * 0.12;
      const col = new T.Color(l.color).getHex();
      const p = scProp('prop_icon_pedestal', { prop_icon_pedestal: { tint: col }, piping: { tint: new T.Color(col).lerp(new T.Color(0xffffff), 0.7).getHex() }, stitch: { ink: 0 } }, { ink: 0.03 });
      const ped = p || mesh(geo.cyl(1.35, 1.45, 0.22, 24), col, { outline: 0.03 });
      ped.scale.setScalar(0.27); ped.position.set(px, 0, pz); ped.userData.ph = k * 0.6 + i;
      land.add(ped);
      (g.userData.peds ||= []).push(ped);
    });
    g.userData.world = w; g.userData.index = i; g.userData.land = land;
    input.addTap(g, { radius: r * 0.95, offset: new T.Vector3(0, 1.4, 0), onTap: () => this.pick(i), onRelease: true });
    return g;
  }

  // stepping stones across the water from each island to the next, in play order
  buildPaths() {
    const items = [];
    for (let i = 0; i + 1 < SPOTS.length; i++) {
      const [x0, z0, r0] = SPOTS[i], [x1, z1, r1] = SPOTS[i + 1];
      const d = Math.hypot(x1 - x0, z1 - z0), ux = (x1 - x0) / d, uz = (z1 - z0) / d;
      const a = r0 * 1.12, b = d - r1 * 1.12, n = Math.max(2, Math.round((b - a) / 0.75));
      for (let k = 0; k <= n; k++) {
        const t = a + ((b - a) * k) / n, side = Math.sin(k * 2.1) * 0.18;
        items.push({ x: x0 + ux * t - uz * side, y: 0.02, z: z0 + uz * t + ux * side, ry: k * 1.7, s: [0.14, 0.12, 0.14] });
      }
    }
    const stones = scInstances('prop_rock', 'prop_rock', items, { tint: [0xe8d6b0, 0xe8c8b8, 0x9aa0c0][this.level], ink: 0.06 });
    if (stones) this.root.add(stones);
  }

  buildSky(lv) {
    // the camera looks down on the sea, so the sky things float low over the far water, like a toy diorama
    if (lv === 2) {
      const stars = new T.Group(); addStars(stars, 60, { x: 30, y: [3.5, 9], z: [-26, -14] }); this.root.add(stars);
      this.anims.push(...stars.userData.anim);
      this.root.add(makeMoon(13.5, 5.2, -15, 0.42));
    } else if (lv === 1) this.root.add(makeSun(-13.5, 4.6, -16, 0xffb45a, { halo: 0xffc080, haloSize: 9, size: 0.6 }));
    else this.root.add(makeSun(-13.5, 5.2, -15, 0xfff1a0, { haloSize: 7, size: 0.45 }));
    const col = [0xffffff, 0xffe0c8, 0x6070b0][lv];
    [[-6, 4.6, -14, 0.55], [3, 5.4, -16, 0.7], [16, 4.4, -14, 0.5], [-20, 5.2, -16, 0.6]].forEach(([x, y, z, s]) => this.root.add(makeCloud(x, y, z, s, col)));
    this.root.userData.clouds = this.root.children.filter((c) => c.userData.cloud);
  }

  // DOM labels: the world's name and one coloured bubble per game, pinned under each island
  makeLabels() {
    const box = document.createElement('div');
    box.id = 'map-labels';
    this.labels = WORLDS.map((w, i) => {
      const el = document.createElement('div');
      el.className = 'map-label';
      el.innerHTML = `<b>${w.icon} ${w.name}</b><span>${w.lessons.map((l) => `<i style="--c:${l.color}">${l.icon}</i>`).join('')}</span>`;
      el.addEventListener('pointerdown', (e) => { e.stopPropagation(); this.idle = 0; this.pick(i); });
      box.appendChild(el);
      return el;
    });
    document.getElementById('ui').appendChild(box);
    this.labelBox = box;
  }

  tick(dt, t) {
    driftClouds(this.root, dt);
    for (const f of this.foam) { const k = 1 + Math.sin(t * 1.1 + f.userData.ph) * 0.035; f.scale.set(k, OVAL * k, 1); f.material.opacity = 0.45 + Math.sin(t * 1.1 + f.userData.ph) * 0.15; }
    this.boat.position.y = Math.sin(t * 1.3) * 0.05; this.boat.rotation.z = Math.sin(t * 1.1) * 0.05;
    this.boat.position.x = -4.8 + Math.sin(t * 0.25) * 0.6;
    for (const f of this.anims) f(dt, t);
    breathe(this.pip, t);
    for (const g of this.islands) {
      for (const p of g.userData.peds || []) p.position.y = Math.abs(Math.sin(t * 1.6 + p.userData.ph)) * 0.05;
      const lamp = g.userData.land.userData.lamp;
      if (lamp) lamp.material.opacity = Math.sin(t * 3) > 0 ? 0.85 : 0.1;
    }
    // labels follow their islands (and hide while the camera flies)
    const v = new T.Vector3();
    this.islands.forEach((g, i) => {
      const [x, z, r] = SPOTS[i];
      // the back-row labels lean outward a little so they sit in open water, clear of the farm island in front
      const p = project(v.set(x + (z < 0 ? Math.sign(x) * 0.9 : 0), 0, z + r * OVAL * 1.05));
      this.labels[i].style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, 0)`;
    });
    this.idle += dt;
    if (this.idle > 10 && !this.picking) {
      this.idle = 0;
      this.islands.forEach((g, i) => this.s.wait(i * 0.25).then(() => { if (!this.dead) { hop(this.s, g.userData.land, 0.35, 0.4); sfx.note(i); } }));
      speech.say('Tap a world!');
    }
  }

  tapPip() {
    sfx.giggle();
    dance(this.s, this.pip);
    speech.say(['Ahoy! Tap a world!', 'Hee hee! Where shall we go?', 'Pick an island!'][Math.floor(Math.random() * 3)]);
  }

  async pick(i) {
    if (this.picking || this.dead) return;
    this.picking = true;
    input.lock(5000);
    const g = this.islands[i], w = WORLDS[i];
    sfx.boing();
    hop(this.s, g.userData.land, 0.5, 0.45);
    fx.confetti(g.position.clone().add(new T.Vector3(0, 2, 0)), 30);
    speech.say(ARRIVE[w.id] || `${w.name}!`);
    this.labelBox.classList.add('gone');
    const [x, z] = SPOTS[i];
    this.s.tween(getLook(), { x, y: 1.2, z }, 0.8, Ease.inOut);
    await this.s.tween(camera.position, { x: x * 0.9, y: 6, z: z + 8.5 }, 0.85, Ease.inOut);
    input.unlock();
    this.router.go('home', { page: i, fromMap: true });
  }

  dispose() {
    physics.clear();
    this.dead = true;
    setLevelHandler(null);
    this.s.kill();
    input.clear();
    for (const f of this.offs) f();
    this.labelBox?.remove();
    scene.remove(this.root);
    disposeTree(this.root);
  }
}
