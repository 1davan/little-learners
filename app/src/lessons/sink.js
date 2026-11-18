// Sink or float lab (World 2: the beach). Topics mt_auVZZEuXjs "Describing material properties", mt_Wa44s-f8Ws
// "Simple tests and experiments" and mt_MRQcEvyPJv "Did it happen as predicted?".
// A glass water tank stands on the beach. Each round a thing pops onto the crate beside it. She DRAGS it over the
// water and lets go (Crab covers its eyes and peeks while she holds it up: the held breath), and it drops in at her
// finger: real rigid-body physics plus a buoyancy force (an upward push that grows with how much of it is under the
// water line, applied at the centre of the wet part, with water drag), so a duck splashes, dips and bobs up to float,
// a log wallows and settles low, a key plunges and clunks onto the sandy floor with bubbles. A tap on the thing is the
// easy fallback: it arcs over by itself. While it is in the water she can poke it under (a floater pops back up).
// Then she drags it out of the water straight into a tub, named by its colour: the BLUE tub (sign: a duck on the
// water) for things that float, the ORANGE tub (sign: a stone on the floor of the water) for things that sink. Tapping
// a tub is the fallback (it hops out, dripping, and arcs in). Everything she sorted stays in the tubs: the blue tub has
// water in it (floaters bob on it), the orange tub a sandy bed (sinkers lie on it), so it all shows over the rims.
// Level 1: obvious things (duck, rock, beach ball, stone, sponge, shell): drop, watch, sort.
// Level 2: guess first (tap a tub or its sign), then test, with "You were right!" / "Surprise!" when it lands.
// Level 3: surprises (a big log floats, a tiny coin sinks, a big apple floats, a tiny marble sinks), plus two tests on
//          the sand: "Which one rolls?" (an orange or a block down a toy slide) and "Which one bounces?" (a bouncy
//          ball or the rock); the pair swaps sides at random.
//
// Test hooks: phase ('guess' | 'drop' | 'watch' | 'sort' | 'pick' | other = busy), item (item.userData.floats),
// guess(floats), dropIn() (the tap fallback), sort(floats) (the tap fallback), choices (x.userData.right), pick(x),
// timing ([{ round, step, ms }] round start / step start to input-ready).
import * as T from '../three.js';
import { Lesson, shuffle } from '../engine/lesson.js';
import { setFace, popIn, hop, wiggle } from '../engine/actors.js';
import { makeCrab, makeBucket, makeBubble } from '../engine/beach.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { physics } from '../engine/physics.js';
import { setCamera, camera, getLook } from '../engine/stage.js';
import { Ease } from '../engine/tween.js';
import { propModel } from '../engine/prop-models.js';
import { blobShadow } from '../engine/toon.js';
import { ITEMS, TUB_COL, makeItem, samplePoints, makeTank, animateWater, TANK, makeSign, SIGN_Y, makeRamp, RAMP } from './sink-items.js';

const PLANS = [
  ['duck', 'rock', 'ball', 'stone', 'sponge', 'shell'],
  ['apple', 'key', 'leaf', 'marble', 'block', 'gem'],
  ['log', 'roll', 'coin', 'bounce', 'bigapple', 'tinymarble'],
];
// Level 3 tests: two different answers (an orange rolls, a bouncy ball bounces), and the sides are shuffled
const TESTS = {
  roll: { pair: ['orange', 'block'], right: 'orange', ask: 'Which one rolls? Tap one!', yes: 'The orange rolls!', no: "The block can't roll! Try the other one!" },
  bounce: { pair: ['bouncy', 'rock'], right: 'bouncy', ask: 'Which one bounces? Tap one!', yes: 'The ball bounces!', no: "Thud! The rock can't bounce! Try the other one!" },
};
// The lab, left to right: the tank, the crate (where each thing waits), the two tubs; Pip watches from behind the
// tubs. The camera works close up and glides between stations: TANK (tank + crate: drop it in), TUBS (crate + tubs +
// signs: guess), LAB (tank + tubs: drag it out of the water into a tub), TEST (Level 3 slide / bounce on the sand).
const cam = (x, y, z, d, up = 0.25) => ({ pos: new T.Vector3(x, y + d * up, z + d), look: new T.Vector3(x, y, z) });
const CAMS = {
  tank: cam(-3.0, 1.55, 0.3, 8.6),   // (Pip, behind the tubs, stays just out of this view, never cut by its edge)
  tubs: cam(3.75, 1.45, 0.4, 8.6),
  test: cam(2.3, 1.2, 2.7, 9.6),
  end: cam(4.95, 1.25, 0.7, 7.9, 0.3),
};
const TP = new T.Vector3(-3.0, 0, -0.2);           // the tank
const CRATE = new T.Vector3(0.55, 0, 0.75);        // the crate things wait on
const CRATE_K = 0.7, CRATE_TOP = 0.86 * CRATE_K;   // its straw bed
const TUBS = { float: new T.Vector3(3.35, 0, 0.85), sink: new T.Vector3(6.3, 0, 0.85) };
const TUB_R = 1.45, TUB_H = 0.85;   // roomy: three things (a log, a leaf...) lie side by side in each
const BED = { float: 0.5, sink: 0.58 };            // the water in the blue tub, the sand in the orange tub (tub space): high, so what sank shows over the rim
const PIP_AT = new T.Vector3(4.825, 0, -2.0);       // behind the gap between the two tubs and their signs: never in the way
// Crab walks with the action: in front between the tank and the crate while things go in, in front of the crate's
// right end while they are sorted (never in front of a tub or the tank, never cut by a station's edge)
const CRAB_TANK = new T.Vector3(-0.45, 0, 2.35);
const CRAB_TUBS = new T.Vector3(1.55, 0, 2.25);
const CRAB_TEST = new T.Vector3(-1.9, 0, 2.5);
const RAMP_AT = new T.Vector3(1.6, 0, 4.3);        // Level 3 slide (high end on the left, near the crate)
const DROP_AT = new T.Vector3(2.6, 0, 3.7);        // Level 3 bounce test: dropped onto the sand here
const _cp = new T.Vector3(), _cl = new T.Vector3();
const G = 9.81 * 1.6;                              // the physics world's gravity

export default class SinkLesson extends Lesson {
  build() {
    setCamera(CAMS[this.level === 0 ? 'tank' : 'tubs'].pos.clone().add(new T.Vector3(0, 0.4, 1.4)), CAMS[this.level === 0 ? 'tank' : 'tubs'].look);
    this.feelInit();
    this.plan = PLANS[this.level] || PLANS[0];
    this.timing = [];
    // Pip watches from behind the tubs
    this.pip.position.copy(PIP_AT);
    this.pip.rotation.y = 0;
    this.pip.scale.setScalar(0.8);
    this.pip.userData.baseScale = 0.8;
    // the tank and its colliders: a floor at the sand line and four walls a little above the glass
    const tank = (this.tank = makeTank());
    tank.position.copy(TP);
    this.root.add(tank);
    const { IX, IZ, FLOOR, TOP } = TANK, wh = TOP + 0.35;
    physics.box(new T.Vector3(TP.x, FLOOR - 0.2, TP.z), new T.Vector3(IX * 2 + 0.4, 0.4, IZ * 2 + 0.4));
    for (const s of [-1, 1]) {
      physics.box(new T.Vector3(TP.x + s * (IX + 0.1), wh / 2, TP.z), new T.Vector3(0.2, wh, IZ * 2 + 0.4));
      physics.box(new T.Vector3(TP.x, wh / 2, TP.z + s * (IZ + 0.1)), new T.Vector3(IX * 2 + 0.4, wh, 0.2));
    }
    this.waterY = TANK.WATER;
    this.tankTap = input.addTap(tank, { radius: 1.9, offset: new T.Vector3(0, 1.7, 0), onTap: () => this.tapTank(), press: false });
    // the crate the things wait on
    const crate = propModel('prop_crate', { tint: 0xf3d29a, size: CRATE_K });
    if (crate) { crate.position.copy(CRATE); crate.rotation.y = Math.PI + 0.12; /* its blank picture disc faces away */ crate.add(blobShadow(1.1)); this.root.add(crate); }
    physics.box(new T.Vector3(CRATE.x, CRATE_TOP / 2, CRATE.z), new T.Vector3(1.9, CRATE_TOP, 1.0), 0.12);
    // the two tubs (blue: floats, orange: sinks), each with its picture sign behind it, and a bed inside
    this.tubs = {};
    for (const [k, p] of Object.entries(TUBS)) {
      const floats = k === 'float';
      const tub = makeBucket(TUB_COL[k], TUB_R, TUB_H);
      tub.position.copy(p);
      tub.rotation.y = floats ? 0.25 : -0.25;
      // a tub, not a pail: no handle (it would cross the path of things going in)
      for (const [ln, hl] of Object.entries(tub.userData.model?.userData?.layers || {})) if (ln.startsWith('handle')) { hl.mesh.visible = false; if (hl.outline) hl.outline.visible = false; }
      this.root.add(tub);
      tub.updateMatrixWorld(true);
      tub.userData.bedY = BED[k];
      tub.userData.bedR = this.innerRadius(tub, BED[k]);
      this.root.add(this.makeBed(floats, p, tub.userData.bedR));
      physics.container(p, { r: tub.userData.bedR, h: TUB_H + 0.25, floor: BED[k] });
      const sign = makeSign(floats);
      if (sign) { sign.position.set(p.x + (floats ? -0.15 : 0.15), 0, p.z - 1.5); sign.rotation.y = floats ? 0.12 : -0.12; this.root.add(sign); }
      const board = new T.Object3D();
      board.position.set(0, SIGN_Y, 0);
      (sign || tub).add(board);
      Object.assign(tub.userData, { floats, sign, board, slots: [] });
      tub.userData.tapT = input.addTap(tub, { radius: 1.3, offset: new T.Vector3(0, 0.7, 0), onTap: () => this.tapSide(floats) });
      if (sign) sign.userData.tapT = input.addTap(sign, { radius: 0.75, offset: new T.Vector3(0, SIGN_Y, 0), onTap: () => this.tapSide(floats) });
      this.tubs[k] = tub;
    }
    // Crab, the lab helper (it faces the action itself: no automatic look-at, which rolled it onto its side)
    const crab = (this.crab = makeCrab());
    crab.scale.setScalar(0.5);
    crab.position.copy(this.level === 0 ? CRAB_TANK : CRAB_TUBS);
    crab.rotation.y = 0.25;
    crab.userData.noLook = true;
    this.root.add(crab);
    const cl = crab.userData.claws;
    this.crabArms = cl ? cl.map((c) => ({ z: c.rotation.z, y: c.rotation.y, x: c.rotation.x })) : null;
    this.peek = { k: 0, want: 0, t: 0 };
    // backdrop props that line up with the lab (a lantern post seen "inside" the tank, jellyfish behind the glass at
    // the water line, the bonfire behind the orange sign) stay out of this lesson
    for (const o of this.meadow?.children || []) {
      const p = o.position;
      if ([[-7.8, -4.8], [-3, -11], [4.5, -13], [0.5, -17], [8.6, -5.2], [10.2, -4.5]].some(([x, z]) => Math.abs(p.x - x) < 0.3 && Math.abs(p.z - z) < 0.3)) o.visible = false;
      // the low sunset sun (and its glitter path) sat right under the caption: it sets further left here;
      // the night moon sat under the hold button, cut by the top edge
      if (Math.abs(p.x + 4) < 0.5 && p.z < -40) p.x = -24;
      if (Math.abs(p.x - 23) < 0.5 && p.z < -40 && p.y > 8) { p.x = 14; p.y = 3.8; }   // (over its glitter path at x 14)
    }
    this.wet = [];       // things in the water: { obj, d, pts, ph, entered, t }
    this.phase = 'idle';
    this.choices = [];
    this.item = null;
  }

  // inner radius of a tub at height y (tub space), by casting a ray from its middle out to its wall
  innerRadius(tub, y) {
    const rc = new T.Raycaster();
    const o = tub.localToWorld(new T.Vector3(0, y, 0));
    let best = Infinity;
    for (const a of [0, 1.57, 3.14, 4.71]) {
      rc.set(o, new T.Vector3(Math.sin(a), 0, Math.cos(a)));
      const hit = rc.intersectObject(tub, true).find((h) => !h.object.userData.outline && h.object.visible);
      if (hit) best = Math.min(best, hit.distance);
    }
    if (!isFinite(best)) best = TUB_R * 0.85;
    return Math.max(0.6, Math.min(TUB_R * 0.95, best) - 0.03);
  }
  // the bed inside a tub: a blue water disc (float tub) or a sandy disc (sink tub)
  makeBed(floats, p, r) {
    const g = new T.Group();
    const m = new T.Mesh(new T.CircleGeometry(r, 40), new T.MeshBasicMaterial({ color: floats ? 0x5cc0f0 : 0xf2d590 }));
    m.rotation.x = -Math.PI / 2;
    g.add(m);
    if (floats) {
      const ring = new T.Mesh(new T.RingGeometry(r * 0.55, r * 0.62, 40), new T.MeshBasicMaterial({ color: 0x9fe0ff }));
      ring.rotation.x = -Math.PI / 2; ring.position.y = 0.004; g.add(ring);
    }
    g.position.set(p.x, floats ? BED.float : BED.sink, p.z);
    return g;
  }

  mark(step) {
    if (this.stepT0 == null) return;
    this.timing.push({ round: this.round, step, ms: Math.round(performance.now() - this.stepT0) });
    this.stepT0 = null;
  }

  // ---------------- rounds ----------------
  async startRound(r) {
    this.busy = true;
    this.stepT0 = performance.now();
    this.nextRoundReset();
    this.guessed = null;
    this.choices = [];
    const id = this.plan[r];
    if (id === 'roll' || id === 'bounce') return this.startTest(id);
    const it = (this.item = makeItem(id));
    if (!it) { this.busy = false; return; }
    // Level 1 starts at the tank (drop it in); Levels 2-3 at the tubs, where the guess signs are.
    // The thing pops onto the crate while the camera glides, so she can act as soon as the glide ends.
    const first = this.level === 0 ? CAMS.tank : CAMS.tubs;
    const gl = this.glide(first, r === 0 ? 0.8 : 0.85);
    this.walkCrab(this.level === 0 ? CRAB_TANK : CRAB_TUBS);
    this.root.add(it);
    this.placeOnCrate(it, 0);
    it.userData.q0 = it.quaternion.clone();
    this.addTargets(it);
    sfx.land();
    // it can be used as soon as it is on the crate (the crate is in view all through the glide); the prompt and any
    // demo hand wait for the camera
    await popIn(this.s, it, it.scale.x, 0.45, { sound: false });
    if (this.dead) return;
    const ph = this.level === 0 ? 'drop' : 'guess';
    this.setPhase(ph);
    this.busy = false;
    this.mark(this.phase);
    this.markNext();
    await gl;
    if (this.dead || this.phase !== ph || this.busy) return;
    this.cue();
  }
  // her last answer (a sort, or the right test pick) to the next thing she can use (round-to-round gap)
  markNext() {
    if (this.actT == null) return;
    this.timing.push({ round: this.round, step: 'next', ms: Math.round(performance.now() - this.actT) });
    this.actT = null;
  }

  // the thing's two targets: a drag (drop it in / pull it out) and a tap (hop on the crate / poke it in the water).
  // Only one is live at a time (setPhase).
  addTargets(it) {
    const rad = Math.max(0.6, it.userData.rad * 1.15);
    it.userData.tap = input.addTap(it, { radius: rad, offset: new T.Vector3(0, it.userData.cy, 0), onTap: () => this.tapItem(it), press: false });
    it.userData.drag = input.addDrag(it, {
      radius: rad, offset: new T.Vector3(0, it.userData.cy, 0), sound: false,
      zones: () => this.dragZones(),
      onPick: () => this.onPick(it),
      onMove: () => this.onCarry(it),
      onDrop: (zone, info) => this.onDropItem(it, zone, info),
    });
  }
  setPhase(ph) {
    if (ph !== this.phase) this.endDemo();
    this.phase = ph;
    // while it waits in the water to be sorted, the thing glows softly (it is behind tinted glass)
    if (this.sortGlow) { this.sortGlow(); this.sortGlow = null; }
    if (ph === 'sort' && this.item) this.sortGlow = fx.halo(this.item, Math.max(0.55, this.item.userData.rad * 1.3));
    // the tank itself is a target only to drop in (fallback) or to poke the thing in it; while sorting, a press on
    // the water must reach the thing in it
    if (this.tankTap) this.tankTap.enabled = ph === 'drop' || ph === 'watch';
    const it = this.item;
    if (!it) return;
    const drag = ph === 'drop' || ph === 'sort', tap = ph === 'guess' || ph === 'watch';
    if (it.userData.drag) it.userData.drag.enabled = drag;
    if (it.userData.tap) it.userData.tap.enabled = tap;
  }
  dropZone() { return { id: 'tank', pos: new T.Vector3(TP.x, TANK.TOP + 0.5, TP.z + 0.6), radius: 2.2 }; }
  tubZone(k) { const t = this.tubs[k]; return { id: k, tub: t, pos: t.position.clone().add(new T.Vector3(0, 0.8, 0)), radius: 1.35 }; }
  dragZones() {
    if (this.phase === 'drop') return [this.dropZone()];
    if (this.phase === 'sort') return [this.tubZone('float'), this.tubZone('sink')].filter((z) => !(this.errorlessOn && z.tub.userData.floats !== this.item?.userData.floats));
    return [];
  }

  promptText() {
    const d = this.item?.userData.item;
    if (this.phase === 'pick') return TESTS[this.test]?.ask || '';
    if (!d) return '';
    if (this.phase === 'guess') return d.big || d.small ? `A ${d.name}! Float or sink?` : `The ${d.name}! Float or sink?`;
    if (this.phase === 'drop') return this.level === 0 ? `Drop the ${d.name} in the water!` : "Drop it in! Let's see!";
    if (this.phase === 'sort') return this.level === 0 ? (d.floats ? 'It floats! Put it in the blue tub!' : 'It sinks! Put it in the orange tub!') : 'Where does it go? Tap a tub!';
    return '';
  }
  prompt(opts = {}) {
    const t = this.promptText();
    if (!t) return;
    this.say(t, { max: 1.6, ...opts });
    // "Float or sink?" alone doesn't say what to do: the action follows
    if (this.phase === 'guess') this.say('Tap a tub!', { max: 1.0, ...opts });
  }
  // what the child is being asked to do right now (each new kind gets its own slow hand demo)
  action() {
    if (this.busy) return null;
    if (this.phase === 'pick') return 'pick-' + this.test;
    return ['guess', 'drop', 'sort'].includes(this.phase) ? this.phase : null;
  }

  // where a thing sits on the crate (slot -1 / 1 for the two Level 3 test choices)
  placeOnCrate(it, slot) {
    it.position.set(0, 0, 0);
    this.root.updateMatrixWorld(true);
    const b = new T.Box3().setFromObject(it);
    const c = b.getCenter(new T.Vector3()), sz = b.getSize(new T.Vector3());
    it.userData.cy = c.y - b.min.y;                 // centre height above its bottom
    it.userData.rad = Math.max(sz.x, sz.y, sz.z) / 2;
    it.userData.wide = Math.max(sz.x, sz.z) / 2;
    it.userData.hx = sz.x / 2; it.userData.hz = sz.z / 2;   // its footprint (a log is long and thin)
    it.userData.off = new T.Vector3(c.x, b.min.y, c.z);
    it.position.set(CRATE.x - c.x + slot * 0.5, CRATE_TOP - b.min.y + 0.01, CRATE.z - c.z);
    it.userData.home = it.position.clone();
    if (it.userData.drag) it.userData.drag.home = it.position.clone();
  }
  squash(o, amt = 0.2) {
    const k = o.scale.clone();
    this.s.anim(0.22, (_, p) => { const w = Math.sin(p * Math.PI) * (1 - p * 0.3) * amt; o.scale.set(k.x * (1 + w * 0.5), k.y * (1 - w), k.z * (1 + w * 0.5)); }).then(() => o.scale.copy(k));
  }

  // ---------------- guess (Level 2 and 3) ----------------
  tapSide(floats) {
    if (this.dead || this.busy || this.demoing) return;
    if (this.phase === 'guess') return this.guess(floats);
    if (this.phase === 'sort') return this.sort(floats);
    if (this.phase === 'drop' || this.phase === 'watch') { const tub = this.tub(floats); wiggle(this.s, tub.userData.sign || tub, 0.08, 0.35); }
  }
  tub(floats) { return floats ? this.tubs.float : this.tubs.sink; }

  async guess(floats) {
    if (this.dead || this.phase !== 'guess' || this.busy) return;
    this.idle = 0;
    this.guessed = !!floats;
    this.lightSigns(false);
    this.endDemo();
    this.clearHints();
    const tub = this.tub(floats), sign = tub.userData.sign;
    sfx.pop();
    if (sign) hop(this.s, sign, 0.3, 0.6);
    this.stepT0 = performance.now();
    // her guess, said back to her (that is what makes "were you right?" mean something)
    this.say(floats ? 'You think it floats!' : 'You think it sinks!', { voice: true, max: 1.2 });
    this.addHalo(tub.userData.board, 0.85);
    // over to the tank to test it: the thing can be dragged as soon as the camera starts moving (it is on the crate,
    // in both views); the prompt and any demo hand wait until the camera has arrived
    this.setPhase('drop');
    this.busy = false;
    this.mark('drop');
    this.walkCrab(CRAB_TANK);
    await this.glide(CAMS.tank);
    if (this.dead || this.phase !== 'drop') return;
    this.cue();
  }
  // the signs breathe while a guess is wanted
  lightSigns(on) { this.signsLit = on; }

  // ---------------- drop it in ----------------
  tapItem(it) {
    if (this.dead || this.demoing) return;
    if (this.phase === 'pick') return this.pick(it);
    if (it !== this.item) return;
    if (this.phase === 'guess') { this.idle = 0; hop(this.s, it, 0.25, 0.5); this.prompt({ repeat: true }); return; }
    // in the water: push it under (a floater bobs straight back up)
    if (physics.has(it) && this.phase === 'watch') this.dunk(it);
  }
  tapTank() {
    if (this.dead || this.demoing) return;
    if (this.phase === 'drop') return this.dropIn();
    if (this.phase === 'watch' && this.item && physics.has(this.item)) this.dunk(this.item);
  }
  dunk(it) {
    if (it.userData.dunkT && performance.now() - it.userData.dunkT < 500) return;
    it.userData.dunkT = performance.now();
    this.idle = 0;
    physics.body(it)?.wakeUp();
    physics.impulse(it, { x: (Math.random() - 0.5) * 0.6, y: -5.5, z: 0 }, { x: (Math.random() - 0.5) * 0.4, y: 0, z: (Math.random() - 0.5) * 0.4 });
    const p = it.position;
    this.splash(p.x, p.z, 0.45);
  }

  // the drag: she picks it up off the crate (drop) or out of the water (sort)
  onPick(it) {
    this.endDemo();
    this.clearHints();
    this.idle = 0;
    this.lifted = false;
    if (this.sortGlow) { this.sortGlow(); this.sortGlow = null; }
    if (this.phase === 'sort' && physics.has(it)) {
      // held: out of the simulation (the finger moves it); it comes out of the water on the first move
      physics.remove(it);
      this.wet = this.wet.filter((w) => w.obj !== it);
      this.pickedWet = true;
    }
  }
  // while carried: kept above the tank's rim when it is over the tank (never through the glass)
  onCarry(it) {
    const { IX, TOP } = TANK;
    if (this.phase === 'sort' && this.pickedWet && !this.lifted) {
      // out of the water, dripping
      this.lifted = true;
      this.splash(it.position.x + it.userData.off.x, it.position.z + it.userData.off.z, 0.35, true);
      this.drips(it);
      const q0 = it.quaternion.clone(), q1 = it.userData.q0 || q0;
      this.s.anim(0.35, (e) => it.quaternion.slerpQuaternions(q0, q1, e));
    }
    const band = IX + it.userData.wide + 0.25;
    const minY = TOP + 0.12 - it.userData.off.y;
    if (Math.abs(it.position.x - TP.x) < band && it.position.y < minY) it.position.y = minY;
    // Crab peeks while it is held over the water, before the drop
    if (this.phase === 'drop') this.crabPeek(Math.abs(it.position.x - TP.x) < IX + 0.6);
  }
  onDropItem(it, zone, { tapped }) {
    if (this.dead) return;
    const ph = this.phase;
    if (ph === 'drop') {
      if (tapped) { this.dropIn(); return; }
      if (zone) { this.dropAt(it, it.position.x); return; }
      this.crabPeek(false);
      input.sendHome(it.userData.drag, { to: it.userData.home });
      return;
    }
    if (ph === 'sort') {
      // a tap on it in the water pokes it under; let go somewhere else and it drops back into the water
      const wasWet = this.pickedWet;
      this.pickedWet = false;
      if (!tapped && zone && zone.tub) { this.sort(zone.tub.userData.floats, { carried: true }); return; }
      if (wasWet || !physics.has(it)) this.backIntoWater(it, tapped);
    }
  }

  // tap fallback: a slow arc from the crate to just above the water, then let go
  async dropIn() {
    if (this.dead || this.phase !== 'drop' || this.busy || !this.item) return;
    const it = this.item;
    const a = it.position.clone();
    const b = new T.Vector3(TP.x + 0.4 + (Math.random() - 0.5) * 0.6 - it.userData.off.x, TANK.TOP + 0.2 - it.userData.off.y, TP.z - it.userData.off.z);
    this.setPhase('flying');
    this.busy = true;
    this.endDemo();
    this.clearHints();
    this.crabPeek(true);
    await this.s.anim(0.95, (e, q) => {
      it.position.lerpVectors(a, b, e);
      it.position.y += Math.sin(q * Math.PI) * 0.55;   // a low arc: it stays well under the caption
    }, Ease.inOut);
    if (this.dead) return;
    await this.beat(null, 0.3, { duck: 0.2 });
    this.release(it);
  }
  // her drop: it goes over the rim at her finger's x and falls in
  async dropAt(it, x) {
    if (this.dead || this.phase !== 'drop' || this.busy) return;
    this.setPhase('flying');
    this.busy = true;
    this.endDemo();
    this.clearHints();
    const { IX, TOP } = TANK;
    const lim = Math.max(0, IX - it.userData.wide - 0.08);
    const cx = Math.max(TP.x - lim, Math.min(TP.x + lim, x + it.userData.off.x)) - it.userData.off.x;
    const a = it.position.clone();
    // it settles to just over the rim first (held high, it would plunge to the floor and leap back out)
    const b = new T.Vector3(cx, TOP + 0.15 - it.userData.off.y, TP.z - it.userData.off.z);
    this.crabPeek(true);
    await this.s.anim(0.35, (e) => it.position.lerpVectors(a, b, e), Ease.out);
    if (this.dead) return;
    this.release(it);
  }
  // let go: real physics from here, with the water pushing up (see update)
  async release(it) {
    const d = it.userData.item;
    this.crabPeek(false);
    this.crabFace(TP.x);
    physics.add(it, { r: this.ballR(it), mass: 1, bounce: 0.15, friction: 0.6, sleep: false });
    physics.body(it)?.setLinvel({ x: 0, y: -1.5, z: 0 }, true);
    this.wet.push({ obj: it, d, pts: samplePoints(it), ph: Math.random() * 6, entered: false, t: 0, bub: 0 });
    // watch it (she can already poke it under): floaters settle into a bob, sinkers clunk onto the floor
    this.setPhase('watch');
    this.busy = false;
    this.stepT0 = performance.now();
    this.mark('watch');
    const t0 = performance.now();
    await new Promise((res) => {
      const chk = () => {
        if (this.dead) return;
        const el = (performance.now() - t0) / 1000, w = this.wetOf(it);
        const done = d.floats ? el > 1.7 : (w && w.floor) ? el > 1.0 : el > 2.0;
        if (done || el > 2.4) return res();
        requestAnimationFrame(chk);
      };
      requestAnimationFrame(chk);
    });
    if (this.dead) return;
    this.result(it);
  }
  ballR(it) {
    const d = it.userData.item;
    if (d.r === 'fit') return it.userData.rad * 0.94;
    return d.r ? d.r * (it.userData.k || 1) : null;
  }
  wetOf(o) { return this.wet.find((w) => w.obj === o); }
  async backIntoWater(it, tapped) {
    const { IX, TOP } = TANK;
    const lim = Math.max(0, IX - it.userData.wide - 0.08);
    const a = it.position.clone();
    const b = new T.Vector3(Math.max(TP.x - lim, Math.min(TP.x + lim, a.x)), Math.max(a.y, TOP + 0.2 - it.userData.off.y), TP.z - it.userData.off.z);
    // back over to the water at a calm pace (from a tub that is a few units away)
    const dur = Math.max(0.35, Math.min(1.1, a.distanceTo(b) / 7));
    if (!tapped) await this.s.anim(dur, (e, q) => { it.position.lerpVectors(a, b, e); it.position.y += Math.sin(q * Math.PI) * (0.3 + dur * 0.6); }, Ease.inOut);
    if (this.dead || !this.item || this.item !== it) return;
    physics.add(it, { r: this.ballR(it), mass: 1, bounce: 0.15, friction: 0.6, sleep: false });
    this.wet.push({ obj: it, d: it.userData.item, pts: it.userData.pts || samplePoints(it), ph: Math.random() * 6, entered: false, t: 0, bub: 0 });
    if (tapped) this.dunk(it);
    if (this.phase === 'sort' && !this.sortGlow) this.sortGlow = fx.halo(it, Math.max(0.55, it.userData.rad * 1.3));
  }

  // ---------------- what happened ----------------
  result(it) {
    const floats = it.userData.floats;
    const pf = this.pip.userData.face;
    let line = floats ? 'It floats!' : 'It sinks!';
    if (this.guessed !== null) {
      const right = this.guessed === floats;
      const bp = this.tub(this.guessed).userData.board.getWorldPosition(new T.Vector3());
      this.clearHints();
      if (right) {
        line = floats ? 'You were right! It floats!' : 'You were right! It sinks!';
        fx.float(bp.clone().add(new T.Vector3(0, 0.95, 0.3)), '✓', { color: '#3fbf5a', size: 12 });
      } else {
        line = floats ? 'Surprise! It floats!' : 'Surprise! It sinks!';
        sfx.gasp();
      }
      // either way it is a happy moment: a surprise is delight, not fear
      if (pf) { setFace(pf, 'joy'); this.s.wait(1.4).then(() => setFace(pf, 'happy')); }
    }
    this.crabCheer();
    it.userData.pts = this.wetOf(it)?.pts;
    // Level 1: the result and the sort are one line ("It floats! Put it in the blue tub!"); Levels 2-3: the result,
    // then "Where does it go? Tap a tub!" (queued behind it). She can drag it out at once; the camera widens to show
    // the tank and both tubs while she plays with it in the water.
    if (this.level !== 0) this.say(line, { max: 1.4 });
    this.stepT0 = performance.now();
    this.setPhase('sort');
    this.busy = false;
    this.mark('sort');
    this.walkCrab(CRAB_TUBS);
    this.prompt();
    // the hand demo is drawn where things are on screen: start it when the camera has arrived
    this.glide(this.labCam(), 0.9).then(() => { if (!this.dead && this.phase === 'sort') this.cue({ quiet: true }); });
  }

  // ---------------- sorting ----------------
  sort(floats, { carried = false } = {}) {
    if (this.dead || this.phase !== 'sort' || this.busy || !this.item) return;
    const it = this.item;
    this.idle = 0;
    this.endDemo();
    if (!!floats !== it.userData.floats) {
      const tub = this.tub(floats);
      this.sayNo(tub);
      // the redirect names the result and the right tub's colour
      this.redirect(it.userData.floats ? 'It floats! The blue tub!' : 'It sinks! The orange tub!');
      if (carried) this.backIntoWater(it, false);
      return;
    }
    this.putAway(it);
  }

  // a resting spot inside the tub: on the water (blue tub) or on the sand (orange tub), clear of what is there
  // its size and offsets at the way up it rests in a tub (a leaf lies flat on the water; the rest keep the crate pose)
  tubPose(it) {
    const d = it.userData.item, q = it.quaternion.clone(), p = it.position.clone();
    it.rotation.set(d.tubRx ?? d.rx ?? 0, d.ry || 0, 0);
    const qTub = it.quaternion.clone();
    it.position.set(0, 0, 0);
    it.updateMatrixWorld(true);
    const b = new T.Box3().setFromObject(it), c = b.getCenter(new T.Vector3()), sz = b.getSize(new T.Vector3());
    it.quaternion.copy(q); it.position.copy(p); it.updateMatrixWorld(true);
    return { q: qTub, cy: c.y - b.min.y, off: new T.Vector3(c.x, b.min.y, c.z), hx: sz.x / 2, hz: sz.z / 2 };
  }
  slotFor(tub, it) {
    const floats = tub.userData.floats, R = tub.userData.bedR;
    const P = (it.userData.tubPose = this.tubPose(it));
    const hx = P.hx * 0.92, hz = P.hz * 0.92;
    const used = tub.userData.slots;
    const overlap = (x, z, u) => Math.max(0, Math.min(x + hx, u.x + u.hx) - Math.max(x - hx, u.x - u.hx)) * Math.max(0, Math.min(z + hz, u.z + u.hz) - Math.max(z - hz, u.z - u.hz));
    const bed = tub.userData.bedY;
    let best = null, bs = Infinity;
    for (let gx = -R; gx <= R; gx += 0.08) for (let gz = -R; gz <= R; gz += 0.08) {
      // the footprint must lie inside the tub (its rounded corners against the round wall)
      if (Math.hypot(Math.abs(gx) + hx * 0.8, Math.abs(gz) + hz * 0.8) > R - 0.02 && Math.hypot(gx, gz) > 0.05) continue;
      // where it would rest: on the bed, or on top of whatever it overlaps (a flat leaf barely lifts it; an apple a lot)
      let yy = bed, over = 0;
      for (const u of used) { const o = overlap(gx, gz, u); if (o > 0.004) { over += o; yy = Math.max(yy, u.top); } }
      // lowest first (side by side on the bed), then toward the front (it shows over the rim) and the middle
      const score = (yy - bed) * 12 + over * 2 - gz * 0.3 + Math.hypot(gx, gz) * 0.15;
      if (score < bs) { bs = score; best = { x: gx, z: gz, y: yy }; }
    }
    if (!best) best = { x: 0, z: 0, y: bed };
    const y = best.y;
    const sink = floats && y === tub.userData.bedY ? Math.min(0.15, 0.4 * P.cy) : 0;   // a floater sits a little down in the water
    const p = new T.Vector3(tub.position.x + best.x - P.off.x, tub.position.y + y - P.off.y - sink, tub.position.z + best.z - P.off.z);
    used.push({ x: best.x, z: best.z, hx, hz, top: y + P.cy * 2 - sink });
    return p;
  }

  async putAway(it) {
    this.actT = performance.now();
    this.setPhase('away');
    this.busy = true;
    this.clearHints();
    const floats = it.userData.floats, tub = this.tub(floats);
    input.remove(it.userData.tap); input.remove(it.userData.drag);
    if (physics.has(it)) {
      physics.remove(it);
      this.wet = this.wet.filter((w) => w.obj !== it);
      this.splash(it.position.x + it.userData.off.x, it.position.z + it.userData.off.z, 0.35, true);
      this.drips(it);
    }
    this.crabFace(tub.position.x);
    // into its tub on a calm arc, the way up it had on the crate; it lands with one soft plop and STAYS there
    const target = this.slotFor(tub, it);
    const a = it.position.clone(), q0 = it.quaternion.clone(), q1 = it.userData.tubPose.q;
    const apex = Math.max(a.y, target.y) + 0.9;
    const dist = Math.hypot(target.x - a.x, target.z - a.z);
    const dur = Math.min(0.8, Math.max(0.45, dist / 7));
    await this.s.anim(dur, (e, q) => {
      it.position.lerpVectors(a, target, e);
      const lift = apex - (a.y + (target.y - a.y) * e);
      it.position.y += Math.sin(q * Math.PI) * Math.max(0.3, lift * 0.8);
      it.quaternion.slerpQuaternions(q0, q1, Math.min(1, e * 1.6));
    }, Ease.inOut);
    if (this.dead) return;
    it.position.copy(target);
    it.quaternion.copy(q1);
    sfx.bloop(floats ? 1 : 3);
    this.squash(it, 0.12);
    this.squash(tub, 0.05);
    if (floats) this.tubRipple(tub);
    // it sits in the tub for good (a floater bobs a little on the tub's water)
    if (floats) it.userData.bob = { y: target.y, ph: Math.random() * 6 };
    this.kept = this.kept || [];
    this.kept.push(it);
    this.pokeable(it, { fn: (o) => { input.press(o, 140); sfx.bloop(o.userData.floats ? 1 : 3); } });
    this.item = null;
    this.busy = false;   // success() takes it from here
    const pos = tub.position.clone().add(new T.Vector3(0, 1.4, 0.5));
    // Crab claps along while the next round is already being laid out (she never waits on the clap)
    this.crabCheer();
    this.success(pos, floats ? 'In the blue tub!' : 'In the orange tub!', { payoff: this.wait(0.15), still: 0.25 });
  }
  tubRipple(tub) {
    const ring = new T.Mesh(new T.RingGeometry(0.2, 0.28, 32), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(tub.position).setY(BED.float + 0.01);
    this.root.add(ring);
    this.s.anim(0.9, (e) => { ring.scale.setScalar(1 + e * 3); ring.material.opacity = 0.8 * (1 - e); }).then(() => { this.root.remove(ring); ring.geometry.dispose(); ring.material.dispose(); });
  }
  async afterSuccess() {
    if (this.choices.length || this.ramp) { this.clearTest(); await this.wait(0.2); }
    else await this.wait(0.05);
  }

  // ---------------- Level 3: which rolls? which bounces? ----------------
  async startTest(kind) {
    const T0 = TESTS[kind];
    this.test = kind;
    this.item = null;
    const gl = this.glide(CAMS.test, this.round === 0 ? 0.8 : 0.85);
    if (kind === 'roll') {
      const ramp = (this.ramp = makeRamp());
      if (ramp) {
        ramp.position.copy(RAMP_AT);
        this.root.add(ramp);
        popIn(this.s, ramp, 1, 0.5, { sound: false });
        // colliders in the slide's real shape: the sloping board, the landing, and a stop past its foot so the
        // orange stays in view
        const { X0, X1, HI, FLAT, T: TH } = RAMP;
        const run = X1 - (X0 + FLAT), rise = HI - 0.04, ang = Math.atan2(rise, run), L = Math.hypot(run, rise);
        const q = new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 0, 1), -ang);
        const mid = new T.Vector3(RAMP_AT.x + X0 + FLAT + run / 2, (HI + 0.04) / 2, RAMP_AT.z);
        const nrm = new T.Vector3(Math.sin(ang), Math.cos(ang), 0);
        this.rampCols = [
          physics.slab(mid.clone().addScaledVector(nrm, -TH), new T.Vector3(L + 0.1, TH * 2, RAMP.Z * 2), q, { friction: 0.9, bounce: 0.1 }),
          physics.box(new T.Vector3(RAMP_AT.x + X0 + FLAT / 2, (HI - TH) / 2, RAMP_AT.z), new T.Vector3(FLAT + 0.1, HI, RAMP.Z * 2)),
          physics.box(new T.Vector3(RAMP_AT.x + X1 + 1.9, 0.6, RAMP_AT.z), new T.Vector3(0.2, 1.2, 3)),
        ];
      }
    }
    // Crab watches from the side, well clear of the slide and of anything rolling
    this.walkCrab(CRAB_TEST);
    const order = shuffle(T0.pair);
    this.choices = order.map((id, i) => {
      const it = makeItem(id);
      it.scale.multiplyScalar(0.85);      // each squeezed a touch so the pair fits on the crate
      it.userData.k = it.scale.x;
      this.root.add(it);
      this.placeOnCrate(it, i ? 0.95 : -0.95);
      it.userData.right = id === T0.right;
      it.userData.q0 = it.quaternion.clone();
      it.userData.tap = input.addTap(it, { radius: Math.max(0.55, it.userData.rad * 1.1), offset: new T.Vector3(0, it.userData.cy, 0), onTap: () => this.tapItem(it) });
      popIn(this.s, it, it.scale.x, 0.45, { sound: i === 0 });
      return it;
    });
    await this.wait(0.45);
    if (this.dead) return;
    this.phase = 'pick';
    this.busy = false;
    this.mark('pick');
    this.markNext();
    await gl;
    if (this.dead || this.phase !== 'pick' || this.busy) return;
    this.cue();
  }
  choicePoints() { return this.choices.map((c) => c.position.clone().add(new T.Vector3(0, c.userData.cy, 0))); }

  async pick(x) {
    if (this.dead || this.phase !== 'pick' || this.busy || !this.choices.includes(x)) return;
    this.idle = 0;
    this.phase = 'testing';
    this.busy = true;
    this.endDemo();
    const d = x.userData.item;
    // to the slide's top (roll) or up over the sand (bounce), a held breath, then let go
    const a = x.position.clone();
    const R = this.ballR(x);
    // (its middle is at position + off + cy: placeOnCrate measured it)
    const mid = (c) => c.sub(new T.Vector3(x.userData.off.x, x.userData.off.y + x.userData.cy, x.userData.off.z));
    let b;
    if (this.test === 'roll') {
      const xs = RAMP_AT.x + RAMP.X0 + RAMP.FLAT + 0.45;
      const slope = (RAMP.HI - 0.04) / (RAMP.X1 - RAMP.X0 - RAMP.FLAT);
      const yTop = RAMP.HI - slope * (xs - RAMP_AT.x - RAMP.X0 - RAMP.FLAT);
      const th = Math.atan(slope), h = R || x.userData.cy;
      b = mid(new T.Vector3(xs + Math.sin(th) * h, yTop + Math.cos(th) * h + 0.03, RAMP_AT.z));
    } else {
      b = mid(new T.Vector3(DROP_AT.x, 3.2, DROP_AT.z));
    }
    await this.s.anim(0.85, (e, q) => { x.position.lerpVectors(a, b, e); x.position.y += Math.sin(q * Math.PI) * 0.8; }, Ease.inOut);
    if (this.dead) return;
    if (this.test === 'roll' && !R) x.rotation.z = -Math.atan((RAMP.HI - 0.04) / (RAMP.X1 - RAMP.X0 - RAMP.FLAT));   // the block sits flat on the slope
    await this.beat(x, 0.3, { squash: 0.06 });
    if (this.dead) return;
    if (this.test === 'roll') {
      physics.add(x, { r: R, mass: 1, bounce: 0.2, friction: 0.9 });
      const body = physics.body(x);
      if (body && d.rolls) { body.setLinearDamping(0.4); body.setAngularDamping(0.4); body.setLinvel({ x: 0.6, y: 0, z: 0 }, true); }
    } else {
      physics.add(x, { r: R, mass: 1, bounce: d.bounces ? 0.86 : 0.0, friction: 0.8, spin: false });
    }
    await this.wait(d.rolls || d.bounces ? 1.7 : 1.2);
    if (this.dead) return;
    const T0 = TESTS[this.test];
    if (x.userData.right) {
      for (const c of this.choices) input.remove(c.userData.tap);
      this.busy = false;
      this.phase = 'done';
      this.crabCheer();
      this.actT = performance.now();
      const p = x.position.clone().add(new T.Vector3(0, 1, 0));
      this.success(p, T0.yes, { payoff: this.wait(0.3), still: 0.25 });   // (it has just rolled / bounced: she watched it)
      return;
    }
    // it did not: say so, and it hops back to the crate to try the other one
    this.busy = false;
    this.phase = 'pick';
    this.redirect(T0.no);
    physics.remove(x);
    const c = x.position.clone(), h = x.userData.home.clone(), q0 = x.quaternion.clone(), q1 = x.userData.q0;
    this.s.anim(0.8, (e, q) => { x.position.lerpVectors(c, h, e); x.position.y += Math.sin(q * Math.PI) * 0.9; x.quaternion.slerpQuaternions(q0, q1, e); }, Ease.inOut).then(() => { if (!this.dead) { x.position.copy(h); x.quaternion.copy(q1); } });
  }

  // after a test: the two things roll away off to the left along the front (they were only borrowed), the slide
  // sinks away. Starts while the round's stillness ends, so the next round is not held up.
  clearTest() {
    const list = this.choices.splice(0);
    for (const c of list) {
      input.remove(c.userData.tap); physics.remove(c);
      const a = c.position.clone(), gy = -c.userData.off.y, m = new T.Vector3(Math.min(a.x, 5.5), gy, 3.75), b = new T.Vector3(-11, gy, 3.75), r0 = c.rotation.z;
      this.s.anim(0.35, (e, q) => { c.position.lerpVectors(a, m, e); c.position.y += Math.sin(q * Math.PI) * 0.4; }, Ease.inOut)
        .then(() => this.s.anim(0.6, (e) => { c.position.lerpVectors(m, b, e); c.rotation.z = r0 + e * 10; }, Ease.in))
        .then(() => this.root.remove(c));
    }
    for (const b of this.rampCols || []) physics.removeStatic(b);
    this.rampCols = null;
    if (this.ramp) { const r = this.ramp; this.ramp = null; this.fadeAway(r, 0.5).then(() => this.root.remove(r)); }
    this.test = null;
  }

  // ---------------- water: buoyancy, splashes, ripples, bubbles ----------------
  update(dt, t) {
    this.stuckCheck();
    dt = Math.min(dt, 0.05);
    // the water rises a little with what is in it
    let disp = 0;
    const { IX, IZ, FLOOR } = TANK;
    for (const w of this.wet) {
      const o = w.obj, body = physics.body(o);
      if (!body) continue;
      o.updateMatrixWorld(true);
      const e = o.matrixWorld.elements;
      let lo = Infinity, hi = -Infinity, cx = 0, cz = 0, n = 0;
      for (const p of w.pts) {
        const y = e[1] * p.x + e[5] * p.y + e[9] * p.z + e[13];
        if (y < lo) lo = y;
        if (y > hi) hi = y;
        if (y < this.waterY) { cx += e[0] * p.x + e[4] * p.y + e[8] * p.z + e[12]; cz += e[2] * p.x + e[6] * p.y + e[10] * p.z + e[14]; n++; }
      }
      const span = Math.max(0.05, hi - lo);
      const sub = Math.max(0, Math.min(1, (this.waterY - lo) / span));
      w.sub = sub;
      w.t += dt;
      const v = body.linvel();
      if (!w.entered && sub > 0.05) {
        w.entered = true;
        const k = Math.min(1.3, Math.max(0.35, -v.y / 5)) * (w.d.big ? 1.3 : w.d.small ? 0.6 : 1);
        this.splash(o.position.x, o.position.z, k);
      }
      disp += sub * (w.d.big ? 0.09 : w.d.small ? 0.005 : 0.03);
      if (sub > 0 && n) {
        const m = body.mass();
        const bob = w.d.floats ? 1 + 0.06 * Math.sin(t * 2.4 + w.ph) : 1;
        const J = m * G * w.d.b * bob * sub * dt;
        const cy = (lo + Math.min(this.waterY, hi)) / 2;
        body.applyImpulseAtPoint({ x: 0, y: J, z: 0 }, { x: cx / n, y: cy, z: cz / n }, true);
        // water drag: much thicker than air
        body.setLinearDamping(0.15 + 3.4 * sub);
        body.setAngularDamping(0.6 + 3.0 * sub);
        if (w.d.up && w.d.floats) {
          // upright floaters right themselves (a duck sits on its tummy, a leaf lies flat)
          const q = body.rotation();
          const ux = 2 * (q.x * q.y - q.w * q.z), uy = 1 - 2 * (q.x * q.x + q.z * q.z), uz = 2 * (q.y * q.z + q.w * q.x);
          w.r2 = w.r2 || Math.max(0.02, span * span * 0.25);
          const kk = m * w.r2 * 30 * sub * dt * (uy < 0 ? 2 : 1);
          // turn the object's up axis toward the sky: axis = up x worldUp = (-uz, 0, ux)
          body.applyTorqueImpulse({ x: -uz * kk, y: 0, z: ux * kk }, true);
          // and turn its face gently toward the camera (a duck's beak, not its back)
          const fx0 = 2 * (q.x * q.z + q.w * q.y), fz0 = 1 - 2 * (q.x * q.x + q.y * q.y);
          const yaw = Math.atan2(fx0, fz0), want = w.d.ry ?? 0;
          let dy = want - yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
          body.applyTorqueImpulse({ x: 0, y: dy * m * w.r2 * 4 * sub * dt, z: 0 }, true);
        }
      } else {
        body.setLinearDamping(0.15);
        body.setAngularDamping(0.6);
      }
      // a sinker on the floor: a few bubbles escape
      const onFloor = lo < FLOOR + 0.08 && Math.abs(v.y) < 0.4;
      if (!w.d.floats && sub > 0.5) {
        if (onFloor && !w.floor) { w.floor = true; this.bubbles(o, 4); }
        if (!onFloor && (w.bub -= dt) < 0) { w.bub = 0.12; this.bubbles(o, 1); }
      }
      // never through the glass (a guard: walls are colliders too)
      const p = body.translation();
      if (Math.abs(p.x - TP.x) > IX + 0.5 || Math.abs(p.z - TP.z) > IZ + 0.5) body.setTranslation({ x: TP.x, y: TANK.WATER + 0.5, z: TP.z }, true);
    }
    this.waterY += (TANK.WATER + disp - this.waterY) * Math.min(1, dt * 4);
    animateWater(this.tank, dt, t, this.waterY);
    // things floating in the blue tub bob gently
    for (const it of this.kept || []) if (it.userData.bob && !input.dragging()) it.position.y = it.userData.bob.y + Math.sin(t * 2 + it.userData.bob.ph) * 0.02;
    // the signs breathe while a guess is wanted
    for (const tub of Object.values(this.tubs)) {
      const s = tub.userData.sign;
      if (!s) continue;
      const k = this.signsLit && this.phase === 'guess' ? 1 + Math.sin(t * 2.6 + (tub.userData.floats ? 0 : 1.6)) * 0.03 : 1;
      s.scale.setScalar(k);
    }
    this.updateCrab(dt, t);
  }

  // a splash at world (x, z): a few small drops jump up from the surface and fall back, the surface ripples
  splash(x, z, k = 1, quiet = false) {
    const tp = this.tank.position;
    this.tank.userData.water.ripples.push({ x: x - tp.x, z: z - tp.z, t: 0, a: 0.07 * k });
    if (!quiet) sfx.splash();
    const n = Math.round(4 + 5 * k);
    for (let i = 0; i < n; i++) {
      const dr = this.drop(0.45 + Math.random() * 0.3);
      if (!dr) break;
      const a = Math.random() * Math.PI * 2, sp = (0.7 + Math.random() * 1.0) * k;
      const p0 = new T.Vector3(x + Math.cos(a) * 0.5, this.waterY + 0.02, Math.max(tp.z - TANK.IZ + 0.1, Math.min(tp.z + TANK.IZ - 0.05, z + Math.sin(a) * 0.3)));
      const vx = Math.cos(a) * sp, vz = Math.sin(a) * sp * 0.4, vy = (2.6 + Math.random() * 2.0) * Math.sqrt(k);
      dr.position.copy(p0);
      this.root.add(dr);
      const dur = (2 * vy) / G;
      this.s.anim(dur, (_, q) => {
        const tt = q * dur;
        dr.position.set(p0.x + vx * tt, p0.y + vy * tt - 0.5 * G * tt * tt, p0.z + vz * tt);
        dr.rotation.z = Math.atan2(vx, -(vy - G * tt)) * 0.6;
        dr.scale.setScalar(q > 0.85 ? Math.max(0.01, (1 - q) * 6.6) : 1);
      }).then(() => { this.root.remove(dr); });
    }
  }
  // one water drop, no ink outline (separate soft drops, not outlined blobs)
  drop(size) {
    const dr = propModel('prop_m_drop', { size });
    if (!dr) return null;
    dr.traverse((o) => { if (o.userData.outline) o.visible = false; });
    return dr;
  }
  // drops falling off something lifted out of the water
  drips(o) {
    for (let i = 0; i < 4; i++) {
      this.s.wait(i * 0.07).then(() => {
        if (this.dead) return;
        const dr = this.drop(0.5);
        if (!dr) return;
        const p0 = o.position.clone().add(new T.Vector3((o.userData.off?.x || 0) + (Math.random() - 0.5) * 0.4, o.userData.off?.y || 0, (o.userData.off?.z || 0) + (Math.random() - 0.5) * 0.2));
        dr.position.copy(p0);
        this.root.add(dr);
        const fall = Math.max(0.2, Math.min(1.2, p0.y - Math.min(p0.y - 0.2, this.waterY)));
        this.s.anim(Math.sqrt((2 * fall) / G), (_, q) => { dr.position.y = p0.y - fall * q * q; dr.scale.setScalar(q > 0.8 ? (1 - q) * 5 : 1); }).then(() => this.root.remove(dr));
      });
    }
  }
  bubbles(o, n) {
    for (let i = 0; i < n; i++) {
      const b = makeBubble(0.06 + Math.random() * 0.06);
      const p = o.position.clone().add(new T.Vector3((Math.random() - 0.5) * 0.3, 0.15, (Math.random() - 0.5) * 0.2));
      b.position.copy(p);
      this.root.add(b);
      const rise = Math.max(0.1, this.waterY - p.y - 0.05), dur = rise / 1.6, ph = Math.random() * 6;
      if (i === 0 && n > 2) sfx.bubble();
      this.s.anim(dur, (_, q) => { b.position.set(p.x + Math.sin(q * 9 + ph) * 0.06, p.y + rise * q, p.z); }).then(() => {
        this.s.anim(0.12, (_, q) => b.scale.setScalar(1 + q * 0.6)).then(() => { this.root.remove(b); });
      });
    }
  }

  // ---------------- Crab ----------------
  async walkCrab(to) {
    const c = this.crab;
    const id = (c.userData.walkId = (c.userData.walkId || 0) + 1);
    const a = c.position.clone(), dist = a.distanceTo(to);
    if (dist < 0.05) return;
    // a crab scuttles sideways
    c.rotation.y = 0;
    await this.s.anim(Math.max(0.6, dist / 1.8), (e) => { if (c.userData.walkId === id) c.position.lerpVectors(a, to, e); }, Ease.inOut);
    if (c.userData.walkId === id) this.crabFace(to.x < 1 ? TP.x : 4.7);
  }
  // turn a little toward x (never side-on)
  crabFace(x) { const c = this.crab; this.s.tween(c.rotation, { y: Math.max(-0.3, Math.min(0.3, (x - c.position.x) * 0.12)) }, 0.4); }
  // the held breath: while she holds the thing up over the water, Crab clasps its claws to its face and screws its
  // eyes shut, peeking now and then (one claw dips, the eyes pop open)
  crabPeek(on) { this.peek.want = on ? 1 : 0; }
  updateCrab(dt, t) {
    const cl = this.crab.userData.claws, A = this.crabArms, P = this.peek;
    if (!cl || !A || this.cheering) return;
    if (P.want === 0 && P.k === 0) return;
    P.k += (P.want - P.k) * Math.min(1, dt * 7);
    if (P.k < 0.004 && P.want === 0) P.k = 0;
    const peek = P.want ? Math.min(1, Math.max(0, Math.sin(t * 3.0) - 0.7) * 4) : 0;
    cl.forEach((c, i) => {
      const s = i ? -1 : 1, k = P.k * (1 - (i ? peek : 0) * 0.35);
      c.rotation.z = A[i].z + s * 1.8 * k;
      c.rotation.x = A[i].x + 1.1 * k;
      c.rotation.y = A[i].y;
    });
    const eyes = this.crab.userData.face?.userData?.eyes || [];
    this.eyeY ??= eyes.map((e) => e.scale.y);
    eyes.forEach((e, i) => { e.scale.y = this.eyeY[i] * (1 - 0.7 * P.k * (1 - peek)); });
  }
  async crabCheer() {
    const c = this.crab, cl = c.userData.claws, f = c.userData.face;
    if (f) { setFace(f, 'joy'); this.s.wait(1).then(() => setFace(f, 'happy')); }
    if (!cl || !this.crabArms) return;
    this.cheering = true;
    const A = this.crabArms;
    this.peek.k = 0; this.peek.want = 0;
    const eyes = this.crab.userData.face?.userData?.eyes || [];
    if (this.eyeY) eyes.forEach((e, i) => (e.scale.y = this.eyeY[i]));
    await this.s.anim(1.0, (_, p) => { const u = Math.abs(Math.sin(p * Math.PI * 2)) * 0.8; cl[0].rotation.z = A[0].z + u; cl[1].rotation.z = A[1].z - u; cl.forEach((x, i) => { x.rotation.y = A[i].y; x.rotation.x = A[i].x; }); });
    cl.forEach((x, i) => { x.rotation.z = A[i].z; x.rotation.y = A[i].y; x.rotation.x = A[i].x; });
    this.cheering = false;
  }

  // ---------------- hints ----------------
  nudgeTarget() {
    if (this.phase === 'drop' || this.phase === 'guess') return this.item;
    if (this.phase === 'sort' && this.item) return this.tub(this.item.userData.floats);
    if (this.phase === 'pick') return this.choices.find((c) => c.userData.right) || null;
    return null;
  }
  // a stuck child: the thing to use gives a slow, quiet bob (no boing)
  nudge(step) {
    const o = this.nudgeTarget();
    if (!o) return hop(this.s, this.pip, 0.4, 0.6);
    if (this.phase === 'guess') {
      for (const tub of Object.values(this.tubs)) if (tub.userData.sign) hop(this.s, tub.userData.sign, 0.25, 0.6);
      return;
    }
    if (this.phase === 'pick') { for (const c of this.choices) if (!physics.has(c)) hop(this.s, c, 0.3, 0.6); return; }
    if (o.userData.sign !== undefined) { if (o.userData.sign) hop(this.s, o.userData.sign, 0.3, 0.6); }
    else if (!physics.has(o)) hop(this.s, o, 0.35, 0.6);
    if (step >= 2) { const stop = fx.halo(o.userData.board || o, 0.8); this.s.wait(3).then(stop); }
  }
  // the slow hand: what to do, shown on the real thing (the game's own: see feelInit)
  handHint(glowOn = true) {
    const o = this.nudgeTarget();
    if (this.phase === 'guess') {
      const pts = Object.values(this.tubs).map((tb) => tb.userData.board.getWorldPosition(new T.Vector3()));
      fx.ghostPath(pts, { mode: 'scan', maxDur: 3.4 });
      return;
    }
    if (this.phase === 'pick') { fx.ghostPath(this.choicePoints(), { mode: 'scan', maxDur: 3.4 }); return; }
    if (!o) return;
    if (this.phase === 'drop') {
      // drag the thing up over the water
      const at = o.position.clone().add(o.userData.off).add(new T.Vector3(0, o.userData.cy, 0));
      if (glowOn) this.demoHalo(o, 0.6);
      fx.ghostPath([at, new T.Vector3(TP.x + 0.6, TANK.TOP + 0.4, TP.z + 0.6)], { mode: 'drag', maxDur: 3.4 });
      return;
    }
    if (this.phase === 'sort' && this.item) {
      // drag it out of the water into its tub
      const it = this.item, at = it.position.clone().add(it.userData.off).add(new T.Vector3(0, it.userData.cy, 0));
      if (glowOn) this.demoHalo(o, 0.8);
      fx.ghostPath([at, o.position.clone().add(new T.Vector3(0, 0.8, 0))], { mode: 'drag', maxDur: 3.4 });
      return;
    }
    const at = o.position.clone().add(new T.Vector3(0, 0.8, 0));
    if (glowOn) this.demoHalo(o, 0.8);
    fx.ghostPath([at], { mode: 'tap', maxDur: 3.4 });
  }
  makeErrorless() {
    const o = this.nudgeTarget();
    if (this.phase === 'guess') return;
    if (o) this.addHalo(o.userData.board || o, 0.8);
    // the wrong tub stops taking it: only the right one answers now
    if (this.phase === 'sort' && this.item) { const w = this.tub(!this.item.userData.floats); if (w.userData.tapT) w.userData.tapT.enabled = false; if (w.userData.sign?.userData.tapT) w.userData.sign.userData.tapT.enabled = false; }
    if (this.phase === 'pick') for (const c of this.choices) if (!c.userData.right && c.userData.tap) c.userData.tap.enabled = false;
  }
  nextRoundReset() { for (const tub of Object.values(this.tubs)) { if (tub.userData.tapT) tub.userData.tapT.enabled = true; if (tub.userData.sign?.userData.tapT) tub.userData.sign.userData.tapT.enabled = true; } }

  // ---------------- feel: camera stations, slow hand demos ----------------
  feelInit() {
    this.voiceLines = false;              // praise stays caption-only
    this.showHint = null;                 // the engine ladder's 12 s hand would stack on this game's own 8 s / 14 s demo
    this.taught = new Set();
    this.demoAt = 8;
    this.demoId = 0;
    this.offs.push(input.onAny(() => { this.demoAt = 8; this.endDemo(); }));
  }
  // glide the camera to a station, eased (the latest glide wins). A demo hand never runs across a glide: it is
  // cleared here, and a new one only starts once the camera has arrived (this.gliding).
  glide(c, dur = 0.85) {
    const id = (this.camId = (this.camId || 0) + 1);
    this.endDemo();
    const p0 = camera.position.clone(), l0 = getLook().clone();
    if (p0.distanceTo(c.pos) < 0.01 && l0.distanceTo(c.look) < 0.01) { this.gliding = false; return Promise.resolve(); }
    this.gliding = true;
    return this.s.anim(dur, (e) => { if (this.camId === id) setCamera(_cp.lerpVectors(p0, c.pos, e), _cl.lerpVectors(l0, c.look, e)); }, Ease.inOut)
      .then(() => { if (this.camId === id) this.gliding = false; });
  }
  // the LAB view (tank + both tubs, while she pulls the thing out of the water): as close as this screen allows. The
  // tank, both tubs and their signs must be fully in the picture: their real corners are projected through a copy of
  // the camera (its FOV and aspect) and the camera comes in until they would touch the edges.
  labCam() {
    const pts = [];
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      pts.push(new T.Vector3(TP.x + sx * (TANK.IX + 0.34), 0.3, TP.z + sz * (TANK.IZ + 0.32)), new T.Vector3(TP.x + sx * (TANK.IX + 0.12), TANK.TOP + 0.1, TP.z + sz * TANK.IZ));
    }
    for (const t of Object.values(TUBS)) for (let a = 0; a < 16; a++) for (const y of [0, TUB_H]) pts.push(new T.Vector3(t.x + Math.sin(a * 0.3927) * (TUB_R + 0.08), y, t.z + Math.cos(a * 0.3927) * (TUB_R + 0.08)));
    this.root.updateMatrixWorld(true);
    for (const t of Object.values(this.tubs)) if (t.userData.board) pts.push(t.userData.board.getWorldPosition(new T.Vector3()).add(new T.Vector3(0, 0.7, 0)));
    const x0 = TP.x - TANK.IX - 0.4, x1 = TUBS.sink.x + TUB_R + 0.25, cx = (x0 + x1) / 2;
    const cc = camera.clone();
    let c = null;
    for (let d = 8.5; d <= 15; d += 0.1) {
      c = cam(cx, 1.2, 0.35, d, 0.22);
      cc.position.copy(c.pos); cc.lookAt(c.look); cc.updateMatrixWorld(true);
      if (pts.every((p) => { const v = p.clone().project(cc); return Math.abs(v.x) < 0.965 && v.y < 0.8 && v.y > -0.97; })) break;
    }
    return c;
  }
  // a slow hand demo on the real thing; any touch ends it
  demo(dur = 3.6) {
    if (this.dead || this.gliding) return;
    fx.clearHands();
    this.demoing = true;
    const id = ++this.demoId;
    this.handHint(true);
    this.s.wait(dur).then(() => { if (this.demoId === id) this.endDemo(); });
  }
  endDemo() { for (const f of this.demoHalos || []) f(); this.demoHalos = []; if (!this.demoing) return; this.demoing = false; this.demoId++; fx.clearHands(); }
  demoHalo(o, r) { (this.demoHalos ||= []).push(fx.halo(o, r)); }
  // say what to do; the first time each kind of action comes up, show it slowly
  cue({ quiet = false } = {}) {
    if (this.dead || this.busy) return;
    if (this.phase === 'guess') this.lightSigns(true);
    if (!quiet) this.prompt();
    this.demoAt = 8;
    const k = this.action();
    if (k && !this.taught.has(k)) { this.taught.add(k); this.demo(); }
  }
  // stuck for about 8 s: show it again (and again every ~14 s)
  stuckCheck() {
    if (this.busy || this.demoing || this.gliding || input.dragging() || !this.action()) return;
    if (this.idle >= this.demoAt) { this.demoAt = this.idle + 14; this.demo(); }
  }

  dispose() {
    if (this.sortGlow) { this.sortGlow(); this.sortGlow = null; }
    this.endDemo();
    super.dispose();
  }

  // ---------------- the end: both tubs full of what she sorted ----------------
  creationView() { return { pos: CAMS.end.pos, look: CAMS.end.look, dur: 1.0 }; }
  creationObjects() { return this.kept || []; }
  onFinale() {
    // Crab walks over to the tubs and points at each one
    (async () => {
      await this.walkCrab(new T.Vector3(4.95, 0, 3.0));
      const cl = this.crab.userData.claws, A = this.crabArms;
      if (!cl || !A || this.dead) return;
      for (const i of [0, 1]) {
        if (this.dead) return;
        await this.s.anim(0.9, (_, p) => { cl[i].rotation.z = A[i].z + (i ? -1 : 1) * Math.sin(p * Math.PI) * 0.9; });
      }
    })();
  }
}
