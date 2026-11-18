// Snack chef. Topics mt_F62VTeHB4- "Preparing simple healthy snacks", mt_QhLAeAlHI0 "Balanced diet and food groups",
// mt_EWiY8-opdd "Keeping food safe and clean" and mt_WcfaSfVT33 "One-to-one counting".
// A level is three snacks for three hungry friends in a cosy kitchen. Each snack is two rounds:
//   1. wash hands: the friend steps up to the sink and puts its paws down into the basin, under the tap.
//      Level 1: tap the tap (the friend soaps its paws), then rub the paws (the rinse plays by itself).
//      Level 2: soap -> rub -> rinse. Level 3: soap -> rub -> rinse -> towel. Doing a step too early: "Soap first!".
//   2. make the plate: the friend steps over to the plate. Drag (or tap) food onto it; every piece is counted out loud.
//      Level 1: the three strawberries / bananas / apples from the fruit bowl onto a plain plate.
//      Level 2: one fruit and one veg onto a two-part plate (a second fruit is "Now a veg!").
//      Level 3: one food from each group onto a four-part plate; fruit must be washed in the sink first, and the
//      dairy food is in the fridge (tap it open; it shuts again to keep things cold).
//   When the plate is full: a held breath, the friend gasps, then eats it, two bites a piece (crumbs stay on the
//   plate), pats its tummy, and carries its plate to the table in the dining corner, where it sits. The next friend
//   is already waiting by the sink. The finale shows the three friends at the table with their plates.
// Feel: the camera is close on the station in use (the sink, then the plate) and glides between them; every new kind
// of action gets one slow ghost-hand demo the first time it comes up, and again when the child is stuck for ~8 s.
// Rule 0: input opens as each round starts (a tap on the tap while the friend steps up is kept and done on arrival).
import * as T from '../three.js';
import { Lesson } from '../engine/lesson.js';
import { makeAnimal, setFace, hop } from '../engine/actors.js';
import { makeCreature, hasCreature } from '../engine/creature.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { project, setCamera, camera, getLook } from '../engine/stage.js';
import { physics } from '../engine/physics.js';
import { Ease } from '../engine/tween.js';
import { toon, geo } from '../engine/toon.js';
import { FOOD, GROUPS, PLANS, NUM_COL, makeFood } from './snack-foods.js';
import {
  makeKitchen, makePlate, fitBehindCounter, propBack, COUNTER_BACK, SINK, BASIN_FLOOR, PLATE, BOWL, BOWL_IN, BOARD, FRIDGE,
  FRIDGE_SHELVES, TOP, SEATS, SEAT_Z, TABLE, TABLE_TOP, PIP_HOST, TOWEL_STAND, TOWEL_STAND_H,
} from './snack-kitchen.js';
import { makeWater, makeFoam, bubbles, droplets, dollop } from './snack-wash.js';
import { solve, samples, vert, occupancy } from './snack-reach.js';

// A camera that frames the box [x0, x1, y0, y1] (at depth z) tightly, looking down onto the worktop by `pitch`.
function fitView([x0, x1, y0, y1], z = -0.6, { pitch = 0.3, minH = 5.0, pad = 1.08 } = {}) {
  const t = Math.tan(T.MathUtils.degToRad(camera.fov / 2));
  const h = Math.max(minH, y1 - y0, (x1 - x0) / Math.max(0.8, camera.aspect)) * pad;
  const d = h / 2 / t;
  const look = new T.Vector3((x0 + x1) / 2, (y0 + y1) / 2, z);
  return { pos: look.clone().add(new T.Vector3(0, Math.sin(pitch) * d, Math.cos(pitch) * d)), look, h };
}
const FS = { bear: 1.56, bunny: 1.48, pig: 1.56, cat: 1.54, frog: 1.45, monkey: 1.43 };   // friend scales (similar heights)
// each friend has its own lane behind the counter, from its real shape (fitLane): it walks sideways along u.laneZ
// and steps forward to u.standZ at a station, facing us (and steps back again before walking on)
const ENTER_X = -11.5;    // off the left of every picture
// the next friend waits here, behind the counter's left end (its legs hidden by the cupboards; it walks in from the
// left while the camera is on the plate, so it is never seen standing beside the counter)
const WAIT_X = -6.1;
const toStation = (f, x, z = f.userData.standZ) => {
  const u = f.userData, p = f.position, pts = [];
  if (Math.abs(p.x - x) > 0.05 && p.z > u.laneZ + 0.02) pts.push(new T.Vector3(p.x, 0, u.laneZ));
  pts.push(new T.Vector3(x, 0, Math.abs(p.x - x) > 0.05 ? u.laneZ : p.z), new T.Vector3(x, 0, z));
  return pts;
};
const WALK = 2.3;                                       // walking speed (units / s): a calm walk
const SAY = {
  tap: 'Wash hands first! Tap the tap!', soap: 'Wash hands first! Tap the soap!', rub: 'Rub the hands!',
  rinse: 'Now rinse! Tap the tap!', dry: 'Tap the towel!',
};
const STUCK = 8;                                        // seconds without a touch before the hand shows it again
const EARLY = { soap: 'Soap first!', rub: 'Rub the hands first!', rinse: 'Rinse first!', dry: 'Tap the towel!' };
const ASK = { fruit: 'a fruit', veg: 'a veg', grain: 'bread', dairy: 'milk or cheese' };
const COUNT = ['One!', 'Two!', 'Three!', 'Four!'];
const BOARD_SPOTS = [-0.4, 0.4];
// the inside colour a bite shows
const BITE = { strawberry: 0xffd1d6, banana: 0xfff6c8, apple: 0xfff6dc, orange: 0xffd08a, pear: 0xf7f7d0, carrot: 0xffb066, cucumber: 0xe8f8c8,
  broccoli: 0xb6e08a, peas: 0xd8f2a8, corn: 0xfff09a, bread: 0xfff0c8, cracker: 0xffe2a8, cheese: 0xfff2a6, milk: 0xffffff, yogurt: 0xffffff };
const CRUMB = { strawberry: 0xff4a5e, banana: 0xffe07a, apple: 0xfff1c9, orange: 0xffa133, pear: 0xd9ec8a, carrot: 0xff8a2a, cucumber: 0x8fd16a,
  broccoli: 0x5fae48, peas: 0x8fd16a, corn: 0xffd23f, bread: 0xd99a4e, cracker: 0xe0a85a, cheese: 0xffd65a, milk: 0xffffff, yogurt: 0xfff4f8 };
// a pose: arm swings (x = forward/back, plain = in/out) and the body's forward lean; y lowers the friend (sitting)
function newPose() { return { armL: 0, armR: 0, armLx: 0, armRx: 0, lean: 0, head: 0, y: 0, stretch: 1 }; }
const bump = (p) => Math.sin(Math.PI * Math.min(1, Math.max(0, p)));
const lerpPose = (P, A, B, e) => {
  for (const k of ['armL', 'armR', 'armLx', 'armRx', 'lean', 'head']) P[k] = (A[k] || 0) + ((B[k] || 0) - (A[k] || 0)) * e;
  P.stretch = (A.stretch || 1) + ((B.stretch || 1) - (A.stretch || 1)) * e;
};
const poseOf = (H, c0 = 0) => ({ armL: H ? H.l : c0, armR: H ? H.r : c0, armLx: H ? H.lx : 0, armRx: H ? H.rx : 0, lean: H ? H.lean : 0, head: H ? H.head || 0 : 0, stretch: H ? H.stretch || 1 : 1 });

export default class SnackLesson extends Lesson {
  get totalRounds() { return (this.plan || PLANS[this.level] || PLANS[0]).snacks.length * 2; }
  build() {
    this.plan = PLANS[this.level] || PLANS[0];
    this.meadow.visible = false;
    const K = (this.K = makeKitchen(this.plan.look, { snack: true }));
    this.root.add(K.group);
    this.propBack = propBack(K);
    // the camera starts close on the sink. Pip is the host: he waits at the table in the dining corner (out of the
    // working pictures, so he never stands in front of a station or in a friend's way)
    this.atStation = 'sink';   // (not this.station: that is the tap handler below)
    const v = this.viewFor('sink');
    setCamera(v.pos, v.look);
    this.view = v;
    this.pip.position.copy(PIP_HOST);   // (set before the first frame is drawn)
    this.pip.rotation.y = -0.75;
    this.shown = new Set();   // the kinds of action already demonstrated (each gets one slow demo)
    this.reshown = 0;
    // static colliders: the worktop round the sink hole, the inside of the fruit bowl and the sink basin
    const wt = (x0, x1, z0, z1) => physics.box(new T.Vector3((x0 + x1) / 2, TOP - 0.3, (z0 + z1) / 2), new T.Vector3(x1 - x0, 0.6, z1 - z0));
    wt(SINK.x + 0.68, 4.45, -1.175, 1.175); wt(-7.25, SINK.x - 0.68, -1.175, 1.175);
    wt(SINK.x - 0.68, SINK.x + 0.68, SINK.z + 0.51, 1.175); wt(SINK.x - 0.68, SINK.x + 0.68, -1.175, SINK.z - 0.51);
    physics.container(new T.Vector3(BOWL.x, TOP + BOWL_IN.floor - 0.1, BOWL.z), { r: BOWL_IN.r, h: BOWL_IN.h });
    physics.container(new T.Vector3(SINK.x, BASIN_FLOOR, SINK.z), { r: 0.42, h: 0.42 });
    // Levels 1-2: the fridge just holds a few dairy things to peek at (Level 3 restocks it for each snack)
    if (!this.plan.fridge) ['milk', 'cheese', 'yogurt'].forEach((kind, i) => {
      const f = makeFood(kind);
      if (!f) return;
      f.position.set(FRIDGE.x + [-0.4, 0.35, 0.3][i], FRIDGE_SHELVES[i ? 1 : 0] + f.userData.h / 2, FRIDGE.z + 0.05);
      this.root.add(f);
    });
    // the plate: each friend gets a fresh one when its plate round starts (the eaten ones go to the table)
    this.plate = null;
    // the water, the foam on the paws and the tap targets
    this.water = makeWater(K.spout, BASIN_FLOOR);
    this.root.add(this.water.group);
    this.foam = makeFoam();
    this.root.add(this.foam.group);
    this.handsSpot = new T.Object3D();
    this.root.add(this.handsSpot);
    const st = (obj, name, radius, off) => obj && input.addTap(obj, { radius, offset: off, onTap: () => this.station(name) });
    this.taps = {
      tap: st(K.tap, 'tap', 0.7, new T.Vector3(-0.25, 0.5, 0.15)),
      soap: st(K.soap, 'soap', 0.6, new T.Vector3(0, 0.4, 0)),
      towel: st(K.towel, 'towel', 0.6, new T.Vector3(0, -0.3, 0.08)),
      hands: input.addTap(this.handsSpot, { radius: 0.75, onTap: () => { this.rubHeld = this.phase === 'wash' && this.step === 'rub'; this.rubDist = 0; this.station('hands'); } }),
      fridge: st(K.fridge, 'fridge', 1.2, new T.Vector3(0, 2.3, 0.6)),
    };
    // rubbing with the finger held down (as the hand demo shows it) keeps rubbing: every ~120 px of back-and-forth
    // after the first rub counts as another rub (a tap tap tap on the hands works too); the foam grows under the finger
    const cv = document.getElementById('c');
    let lx = 0, ly = 0;
    const down = (e) => { lx = e.clientX; ly = e.clientY; };
    const move = (e) => {
      if (this.rubHeld) { const d = Math.hypot(e.clientX - lx, e.clientY - ly); this.rubDist += d; this.rubLive = Math.min(1, (this.rubLive || 0) + d / 160); }
      lx = e.clientX; ly = e.clientY;
    };
    const up = () => { this.rubHeld = false; };
    cv.addEventListener('pointerdown', down); cv.addEventListener('pointermove', move);
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    this.offs.push(() => { cv.removeEventListener('pointerdown', down); cv.removeEventListener('pointermove', move); cv.removeEventListener('pointerup', up); cv.removeEventListener('pointercancel', up); });
    this.foods = [];          // this snack's choices (on the counter / in the fridge)
    this.onPlate = [];
    this.leftovers = [];
    this.crowd = new Set();   // the friends in the kitchen (washing / eating / waiting / at the table)
    this.seated = [];         // [{ f, plate }] the fed friends at the table, with their plates
    this.phase = 'idle';
    this.step = null;
    this.doorAmt = 0;
    this.fridgeOpen = false;
    // the first friend is already at the side of the sink when the game opens
    this.nextF = this.makeFriend(this.plan.snacks[0].friend);
    this.nextF.position.set(WAIT_X, 0, this.nextF.userData.laneZ);
    this.nextF.userData.prepP = this.toSink(this.nextF);   // (it steps up to the sink during the intro)
  }

  // ---------------- the camera ----------------
  // the box to frame for a station: the sink (the soap, the basin and tap, the towel below and the friend's face) or
  // the plate with where its food comes from (the bowl; the board at Levels 2-3; the sink while a fruit still needs
  // washing; the fridge once only the dairy food is missing)
  viewFor(station) {
    // (tall enough that the bunny's ears end below the caption)
    if (station === 'sink') return fitView([SINK.x - 2.2, SINK.x + 1.55, 0.9, 5.05], -0.95, { pitch: 0.58, minH: 4.2, pad: 1.03 });
    if (station === 'table') return fitView([SEATS[0] - 1.6, PIP_HOST.x + 1.2, 0.6, 4.6], 1.2, { pitch: 0.24, minH: 4.6, pad: 1.03 });
    let x0 = PLATE.x - 1.55, x1 = (this.plan.want ? BOARD.x + 1.0 : BOWL.x + 1.15);
    if (this.plan.washFruit && this.missing().includes('fruit')) x0 = SINK.x - 1.55;   // (the soap whole, not cut)
    if (this.plan.fridge && this.missing().length === 1 && this.missing()[0] === 'dairy') { x0 = PLATE.x - 1.45; x1 = FRIDGE.x + 3.0; }
    return fitView([x0, x1, 0.6, 4.9], -0.4, { pitch: 0.36 });
  }
  // glide the camera to a station (eased, ~0.9 s)
  async goStation(station, dur = 0.9) {
    const v = this.viewFor(station);
    this.atStation = station;
    if (this.view && v.pos.distanceTo(this.view.pos) < 0.05 && v.look.distanceTo(this.view.look) < 0.05) return;
    this.view = v;
    const tok = (this.camTok = (this.camTok || 0) + 1);
    const p0 = camera.position.clone(), l0 = getLook().clone();
    this.camMoving = true;
    await this.s.anim(dur, (e) => { if (tok === this.camTok) setCamera(p0.clone().lerp(v.pos, e), l0.clone().lerp(v.look, e)); }, Ease.inOut);
    if (tok === this.camTok) this.camMoving = false;
  }

  // ---------------- the friend ----------------
  get snack() { return this.plan.snacks[Math.floor(this.round / 2)] || this.plan.snacks[this.plan.snacks.length - 1]; }
  makeFriend(kind) {
    const f = kind === 'monkey' || !['bear', 'bunny', 'cat', 'frog', 'pig'].includes(kind) ? (hasCreature(kind) ? makeCreature(kind) : makeAnimal('bear')) : makeAnimal(kind);
    const k = FS[kind] || 1.4;
    f.scale.setScalar(k);
    f.userData.baseScale = k;
    f.rotation.y = Math.PI / 2;
    this.root.add(f);
    const u = f.userData;
    u.kind = u.kind || kind;
    u.gait = 'walk';          // (no hopping about the kitchen, even for the bunny and the frog)
    u.shadow = this.shadow(f);
    // rest pose of the arms, and each hand in its arm bone's frame (from the hand anchors)
    f.position.set(0, 0, 0); f.rotation.y = 0;
    f.updateMatrixWorld(true);
    u.rest = (u.arms || []).map((b) => b.rotation.clone());
    u.handLocal = (u.arms || []).map((b, i) => {
      const a = u.anchors?.[i ? 'handR' : 'handL'];
      const w = a ? f.localToWorld(new T.Vector3(a[0], a[1], a[2])) : b.localToWorld(new T.Vector3(0, 0.6, 0));
      return b.worldToLocal(w);
    });
    this.fitLane(f);
    { const w = Math.max(1.0, (u.sideW || 0.6) * 2.0); u.shadow.scale.set(w, w * 0.8, 1); }
    this.measure(f);
    this.springs(f);
    this.thinInk(f);
    // its sink pose is searched now, in the background, while it walks in
    u.sinkP = this.sinkPoses(f).then((r) => (u.sink = r));
    f.rotation.y = Math.PI / 2;
    f.position.set(ENTER_X, 0, u.laneZ);
    // every friend keeps its own pose (P), so one eating and leaving never moves the next one's arms
    u.P = newPose();
    u.P.armL = u.P.armR = u.carry;   // walks with the paws tucked in, clear of the worktop
    this.crowd.add(f);
    return f;
  }
  fitLane(f) { fitBehindCounter(f, this.propBack); }
  // a soft round shadow on the floor under a friend (update() keeps it under its feet)
  shadow(f) {
    if (!this._shTex) {
      const c = document.createElement('canvas'); c.width = c.height = 64;
      const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 4, 32, 32, 31);
      gr.addColorStop(0, 'rgba(90,60,40,0.42)'); gr.addColorStop(0.7, 'rgba(90,60,40,0.22)'); gr.addColorStop(1, 'rgba(90,60,40,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
      this._shTex = new T.CanvasTexture(c);
    }
    const m = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: this._shTex, transparent: true, depthWrite: false, fog: false }));
    m.rotation.x = -Math.PI / 2;
    m.renderOrder = 1;
    const w = (f.userData.sideW || 0.6) * 2.1;
    m.scale.set(w, w * 0.75, 1);
    this.root.add(m);
    return m;
  }
  // from the real shape at rest (facing us at the origin): how far the head and tummy reach forward low down (for
  // the plate it carries) and how far back it goes
  measure(f) {
    const u = f.userData, S = samples(f);
    let headLow = 0, back = 0, headBottom = 9;
    const lowY = TOP + 0.95;
    for (const s of S.head) { const v = vert(s); headBottom = Math.min(headBottom, v.y); if (v.y < lowY) headLow = Math.max(headLow, v.z); back = Math.min(back, v.z); }
    for (const s of S.body) { const v = vert(s); back = Math.min(back, v.z); }
    u.headLow = headLow; u.backZ = back; u.headBottom = headBottom;
  }
  // the floppy ears keep their shape (a little bounce, never flat)
  springs(f) {
    const u = f.userData;
    for (const s of u.springs || []) {
      if (!/^ear/.test(s.b.name)) continue;
      // (every kind: the engine's ear springs sag flat with torn ink while a friend leans or carries)
      s.k *= u.kind === 'bunny' ? 2.6 : 3.2; s.grav *= 0.15; s.damp *= 1.5;
    }
    // the cat's short ears stay rigid (springing, they fold into a dark crease when its head turns)
    if (u.kind === 'cat' && u.springs) u.springs.splice(0, u.springs.length, ...u.springs.filter((sp) => !/^ear/.test(sp.b.name)));
  }
  // a thinner ink outline (the engine's, at 70 %): where an arm crosses the tummy at the sink, two full-width outlines
  // read as heavy doubled lines
  thinInk(f) {
    const cache = (SnackLesson._ink ||= new Map());
    f.traverse((m) => {
      if (!m.isMesh || !m.material || m.material.side !== T.BackSide) return;
      const key = String(m.material.customProgramCacheKey?.() || '');
      const th = parseFloat(key.replace('skin-outline', ''));
      if (!/^skin-outline/.test(key) || !(th > 0)) return;
      const t2 = +(th * 0.7).toFixed(4);
      if (!cache.has(t2)) {
        const mat = new T.MeshBasicMaterial({ color: m.material.color, side: T.BackSide });
        mat.onBeforeCompile = (sh) => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', `vec3 transformed = position + normal * ${t2.toFixed(4)};`); };
        mat.customProgramCacheKey = () => 'skin-outline' + t2;
        mat.userData.shared = true;
        cache.set(t2, mat);
      }
      m.material = cache.get(t2);
    });
  }
  get P() { return this.friend ? this.friend.userData.P : (this._noP || (this._noP = newPose())); }
  hand(i, f = this.friend) {
    const u = f?.userData;
    if (!u?.arms) return f ? f.localToWorld(new T.Vector3(0, 1.0, 0.7)) : new T.Vector3();
    return u.arms[i].localToWorld(u.handLocal[i].clone());
  }
  handsMid(f = this.friend) { return this.hand(0, f).add(this.hand(1, f)).multiplyScalar(0.5); }
  // the friend's mouth (world): the code face's smile, just in front of it
  mouth(f = this.friend) {
    const fc = f.userData.face, m = fc?.userData?.smile || fc?.userData?.joy;
    if (m) { f.updateMatrixWorld(true); return m.getWorldPosition(new T.Vector3()).add(new T.Vector3(0, -0.02, 0.12)); }
    const a = f.userData.anchors?.mouth;
    return a ? f.localToWorld(new T.Vector3(a[0], a[1], a[2] + 0.1)) : f.localToWorld(new T.Vector3(0, 1.6, 0.6));
  }
  face(emo, back = 0.7, f = this.friend) {
    const fc = f?.userData.face;
    if (!fc) return;
    setFace(fc, emo);
    if (back) this.s.wait(back).then(() => { if (fc.userData.emotion === emo) setFace(fc, 'happy'); });
  }
  // walk along points (ground), turning to face the way it goes (a time-based turn, never a snap), then stop
  async walk(f, pts, speed = WALK) {
    for (const to of pts) {
      const from = f.position.clone();
      const d = from.distanceTo(to);
      if (d < 0.01) continue;
      const yaw = Math.atan2(to.x - from.x, to.z - from.z), r0 = f.rotation.y;
      let dy = yaw - r0; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2;
      if (d < 0.9 && Math.abs(to.x - from.x) < 0.02) dy = 0;   // a little step forward or back: no turning round
      const dur = d / speed, turn = Math.min(dur, Math.max(0.35, Math.abs(dy) * 0.3));
      if (Math.abs(dy) > 0.01 && turn > dur * 0.6) {
        // a short leg: turn first (on the spot), then step
        await this.s.anim(turn, (e) => { f.rotation.y = r0 + dy * e; }, Ease.inOut);
        await this.s.anim(dur, (e) => { f.position.lerpVectors(from, to, e); }, Ease.inOut);
      } else {
        await this.s.anim(dur, (e, p) => {
          f.position.lerpVectors(from, to, e);
          f.rotation.y = r0 + dy * Ease.inOut(Math.min(1, (p * dur) / turn));
        }, Ease.inOut);
      }
    }
  }
  async turnTo(f, yaw, dur = 0.4) {
    const r0 = f.rotation.y;
    let dy = yaw - r0; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2;
    if (Math.abs(dy) < 0.01) return;
    await this.s.anim(Math.max(dur, Math.abs(dy) * 0.3), (e) => { f.rotation.y = r0 + dy * e; }, Ease.inOut);
  }
  turnFront(f, dur = 0.4) { return this.turnTo(f, 0, dur); }
  pose(dur, fn, f = this.friend) { const P = f ? f.userData.P : newPose(); return this.s.anim(dur, (_, p) => fn(p, P)); }
  // ease this friend's pose to B over dur
  poseTo(f, B, dur = 0.7) { const P = f.userData.P, A = { ...P }; return this.s.anim(dur, (e) => lerpPose(P, A, B, e), Ease.inOut); }

  // ---------------- reaching into the sink ----------------
  // The water falls near the back of the basin (the tap is at its back right corner). The paws go down into the
  // basin right under it; the head stays clear of the tap, the soap and the basin. Searched once per kind.
  sinkKeepOut() {
    if (this._ko) return this._ko;
    const K = this.K;
    K.group.updateMatrixWorld(true);
    // the real shapes of the tap (with its lever) and the soap: the head keeps ~0.1 away, the arms just off them
    const tapNear = occupancy(K.tap, 0.05, 4), tapOn = occupancy(K.tap, 0.04, 0);
    const soapNear = occupancy(K.soap, 0.05, 1), soapOn = occupancy(K.soap, 0.04, 0);
    const standNear = K.towelRail ? occupancy(K.towelRail, 0.05, 3) : { has: () => false }, tapAway = occupancy(K.tap, 0.05, 2);
    const inBasin = (v) => Math.abs(v.x - SINK.x) < 0.6 && Math.abs(v.z - SINK.z) < 0.45;
    const inSlab = (v) => v.z > COUNTER_BACK + 0.02 && v.y < TOP - 0.015 && v.y > TOP - 0.12;
    // under the rim, an arm may only be inside the basin's opening (never through its back wall or floor)
    const inOpening = (v) => Math.abs(v.x - SINK.x) < 0.56 && Math.abs(v.z - SINK.z) < 0.4 && v.y > BASIN_FLOOR + 0.08;
    const nearBasin = (v) => Math.abs(v.x - SINK.x) < 0.72 && v.z > SINK.z - 0.56 && v.y < TOP - 0.06;
    this._ko = {
      // the head: never near the tap or the soap, never down at the basin, never low over the worktop
      head: (v) => tapNear.has(v) || soapNear.has(v) || (v.z > COUNTER_BACK - 0.05 && v.y < TOP + (inBasin(v) ? 0.5 : 0.3)),
      // arms and tummy: never through the worktop slab (what she would see). Below the slab, against the cupboard's
      // back, nothing shows (the worktop hides it from above, the cupboard from the front).
      arm: (v) => tapOn.has(v) || soapOn.has(v) || (inSlab(v) && !inBasin(v)) || (nearBasin(v) && !inOpening(v)),
      body: (v) => inSlab(v),
      // at the towel: the head clear of the stand too; the arms well off the tap
      headT: (v) => tapNear.has(v) || soapNear.has(v) || standNear.has(v) || (v.z > COUNTER_BACK - 0.05 && v.y < TOP + 0.3),
      armAway: (v) => tapAway.has(v) || soapOn.has(v) || (inSlab(v) && !inBasin(v)) || (nearBasin(v) && !inOpening(v)),
    };
    return this._ko;
  }
  async sinkPoses(f) {
    const u = f.userData, sp = this.K.spout;
    if (!u.arms || u.rest.length !== 2) return null;
    const ko = this.sinkKeepOut();
    const at = new T.Vector3(sp.x, 0, u.standZ);
    // a step closer, or a step back to lean further in (leaning pushes the tummy forward)
    const maxDz = Math.max(0, COUNTER_BACK - 0.03 - (u.standZ + u.fit.rest.front));
    const dzs = [-0.3, -0.2, -0.1, 0, maxDz * 0.5, maxDz];
    const W = (dx, y, dz = 0, g = 0.16) => [new T.Vector3(sp.x + dx - g, y, sp.z + dz), new T.Vector3(sp.x + dx + g, y, sp.z + dz)];
    // a friend with a low, long face (the pig) keeps its paws a little higher, so it need not bow its head over the tap
    const lift = { pig: 0.04, frog: 0.04 }[u.kind] || 0;
    const stretch = { pig: 1.22, frog: 1.2 }[u.kind] || 1;
    // the paws: down in the basin (their middles just under the rim), right under the spout
    const wash = await solve(f, {
      key: 'wash', at, dzs, dxs: [-0.15, 0, 0.15, 0.3], leans: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6],
      goals: () => W(0, TOP + 0.03 + lift, 0.06), headBad: ko.head, maxHead: 4, stretch, armBad: ko.arm, bodyBad: ko.body, leanCost: 0.15, headTilt: 0.9,
    });
    const fixed = { at: new T.Vector3(sp.x + wash.dx, 0, u.standZ + wash.dz), dxs: [0], dzs: [0], headBad: ko.head, armBad: ko.arm, bodyBad: ko.body, headTilt: 0.9, stretch };
    // shaking the drops off: paws lifted just out of the water; drying: paws up and to the left, clear of the spout,
    // so the towel can hang over them above the basin (never down into it)
    // lifted: the paws held up over the basin's back left corner, clear of the spout (for stepping up to the sink and
    // away from it, and on the way to the towel). The shake itself happens down in the basin (drops fly into the sink).
    const shake = await solve(f, { ...fixed, key: 'lift', armBad: ko.armAway, leans: [0, 0.1, 0.2, 0.3, 0.4, 0.5], goals: () => W(-0.36, TOP + 0.38, -0.1, 0.14) });
    // rinsing: the paws go a little deeper, so the water falls a good way from the spout onto them
    const rinse = await solve(f, { ...fixed, key: 'rinse', leans: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6], goals: () => W(-0.26, TOP - 0.04 + lift, 0.1, 0.14) });
    // the towel: it steps over to the stand, takes the towel off the bar with both paws, and holds it up a little
    // over the worktop's back edge to dry its paws in it (never over the basin)
    const bar = TOWEL_STAND.clone().add(new T.Vector3(0, TOWEL_STAND_H, 0));
    const T2 = (y, dz, g = 0.12) => [new T.Vector3(bar.x - g, y, bar.z + dz), new T.Vector3(bar.x + g, y, bar.z + dz)];
    const atT = { at: new T.Vector3(bar.x, 0, u.standZ), dxs: [0, 0.15, 0.3], dzs: [-0.1, 0, maxDz * 0.5, maxDz], headBad: ko.headT, armBad: ko.armAway, bodyBad: ko.body, headTilt: 0.9, stretch, maxHead: 4 };
    const take = await solve(f, { ...atT, key: 'take', leans: [0, 0.1, 0.2, 0.3, 0.4], goals: () => T2(bar.y + 0.06, 0.03) });
    const atD = { ...atT, at: new T.Vector3(bar.x + take.dx, 0, u.standZ + take.dz), dxs: [0], dzs: [0] };
    const dry = await solve(f, { ...atD, key: 'dryT', leans: [0, 0.1, 0.2, 0.3, 0.4], goals: () => T2(bar.y + 0.16, -0.06) });
    return { wash, shake, rinse, take, dry, towelAt: atD.at };
  }
  // the carry pose: paws forward under the near rim of the plate it holds (searched facing us at the origin)
  async carryPose(f, R) {
    const u = f.userData;
    if (!u.arms || u.rest.length !== 2) return null;
    // held low, at tummy height (below every chin): behind the counter nothing is in its way
    const reach = Math.max(u.fit.rest.front, u.headLow) + 0.06;
    const y = TOP + 0.22;
    u.carryAt = { reach: reach + R, y };
    return solve(f, {
      key: `carry${R.toFixed(2)}`, at: new T.Vector3(0, 0, 0), leans: [0],
      goals: () => [new T.Vector3(-0.3, y + 0.04, reach + 0.08), new T.Vector3(0.3, y + 0.04, reach + 0.08)],
    });
  }

  // ---------------- rounds ----------------
  async startRound(r) {
    const plan = this.plan, snack = this.snack;
    if (r % 2 === 0) {
      // the wash: the next friend is already waiting at the side of the sink; it steps up and puts its paws into the
      // basin. Input is open at once (rule 0): a tap on the tap / soap while it steps up is kept and done on arrival.
      this.phase = 'walk';
      this.onPlate = [];
      this.step = plan.wash[0];
      this.queued = null;
      this.rubs = 0;
      this.goStation('sink');
      let f = this.nextF;
      if (!f || f.userData.kind !== snack.friend) f = this.makeFriend(snack.friend);
      this.nextF = null;
      this.friend = f;
      this.scanChars();
      this.busy = false;
      this.idle = 0;
      this.roundT0 = performance.now();
      if (this.plateDoneT) console.log(`TIMING snack plate done -> wash round starts ${((this.roundT0 - this.plateDoneT) / 1000).toFixed(2)}s`);
      // it stepped up to the sink while the last friend ate (or is just finishing doing so): input is open at once,
      // and a touch meanwhile gets an answer straight away and is done on arrival
      f.userData.prepP = f.userData.prepP || this.toSink(f);
      await f.userData.prepP;
      f.userData.prepP = null;
      if (this.dead) return;
      this.H = f.userData.sink?.wash;
      this.phase = 'wash';
      this.idle = 0;
      this.logReady('wash');
      if (this.queued) { const q = this.queued; this.queued = null; this.wash(q); }
      else { this.prompt(); this.teach(0.3); }
    } else {
      // the plate: the food drops into the bowl / onto the board at once; the friend steps over to the plate while
      // the camera glides along. Food can be moved straight away.
      this.phase = 'plate';
      this.roundT0 = performance.now();
      const f = this.friend;
      const spotBusy = () => this.seated.some((s) => !s.f.userData.walkingOff && !s.f.userData.seated);
      if (!this.plate) (async () => {
        await this.wait(0.55);
        for (let t = 0; spotBusy() && t < 4 && !this.dead; t += 0.1) await this.wait(0.1);
        if (!this.dead && !this.plate && this.phase === 'plate') this.plate = this.newPlate(true);
      })();
      // the next friend comes in to wait behind the counter's left end (out of this picture)
      const next = this.plan.snacks[Math.floor(this.round / 2) + 1];
      if (next && !this.nextF) { const n = (this.nextF = this.makeFriend(next.friend)); n.userData.walkP = this.walk(n, [new T.Vector3(WAIT_X, 0, n.userData.laneZ)], WALK); }
      this.restock(snack);
      this.goStation('plate', 1.0);
      this.busy = false;
      this.idle = 0;
      this.arriveP = this.toPlate(f).then(() => this.logReady('plate'));
      this.prompt();
      this.teach(1.0);
    }
  }
  // timing log (FEEL rule 0): input opens with the round (the Go! gate adds 0.3 s); this is when the friend is in place
  logReady(what) {
    if (!this.roundT0) return;
    const t = (performance.now() - this.roundT0) / 1000;
    console.log(`READY snack r${this.round} ${what}: input open 0.30s, friend in place ${t.toFixed(2)}s`);
    if (what === 'wash' && this.plateDoneT) { console.log(`TIMING snack plate done -> next friend in place, its step playable ${((performance.now() - this.plateDoneT) / 1000).toFixed(2)}s`); this.plateDoneT = 0; }
  }
  // from the waiting spot to the sink: a few steps, turn to us, paws down into the basin under the tap
  async toSink(f) {
    const u = f.userData;
    if (!u.sink) await u.sinkP;
    const H = u.sink?.wash;
    const x = this.K.spout.x + (H ? H.dx : 0), z = u.standZ + (H ? H.dz : 0);
    if (u.walkP) { await u.walkP; u.walkP = null; }
    // along its lane to the sink, turn to us; paws up while still back in the lane (nothing in front of them there),
    // a step up to the counter with the paws held above it, then down into the water: an arm never sweeps through
    // the counter, the basin or the tap
    await this.walk(f, [new T.Vector3(f.position.x, 0, u.laneZ), new T.Vector3(x, 0, u.laneZ)], WALK);
    if (this.dead) return;
    u.noLook = true;              // at the sink the head stays still (it never nods down onto the tap)
    await this.turnFront(f, 0.35);
    const W = poseOf(H, u.carry), S = u.sink?.shake ? poseOf(u.sink.shake) : W;
    await this.armsUp(f, S, 0.5);
    await this.walk(f, [new T.Vector3(x, 0, z)], WALK * 0.8);
    await this.poseTo(f, W, 0.4);
    u.atSink = true;
  }
  // from the sink to the plate: paws up out of the basin into the carry tuck, a few steps right, turn to us
  // from hanging down to a pose with the paws held forward: out to the sides first, then forward (so the paws come
  // up in front without sweeping low through what is in front of the friend)
  armsUp(f, B, dur = 0.5) {
    const P = f.userData.P, A = { ...P };
    return this.s.anim(dur, (_, p) => {
      const a = Ease.inOut(Math.min(1, p / 0.6)), b = Ease.inOut(Math.max(0, (p - 0.3) / 0.7));
      P.armL = A.armL + (B.armL - A.armL) * a; P.armR = A.armR + (B.armR - A.armR) * a;
      P.armLx = A.armLx + (B.armLx - A.armLx) * b; P.armRx = A.armRx + (B.armRx - A.armRx) * b;
      P.lean = A.lean + (B.lean - A.lean) * b; P.head = (A.head || 0) + ((B.head || 0) - (A.head || 0)) * b;
      P.stretch = (A.stretch || 1) + ((B.stretch || 1) - (A.stretch || 1)) * a;
    });
  }
  async toPlate(f) {
    const u = f.userData, wasAt = u.atSink;
    u.atSink = false;
    const c0 = u.carry, S = u.sink?.shake ? poseOf(u.sink.shake) : { ...u.P };
    // (from the sink) up out of the basin, a step back into its lane with the paws still held up, then tucked in
    if (wasAt) await this.poseTo(f, S, 0.35);
    await this.walk(f, [new T.Vector3(f.position.x, 0, u.laneZ)], WALK * 0.8);
    await this.poseTo(f, { ...newPose(), armL: c0, armR: c0 }, 0.4);
    Object.assign(u.P, newPose(), { armL: c0, armR: c0 });
    u.noLook = false;
    // (the last friend may still be finishing up at the plate)
    for (let t = 0; this.seated.some((s) => !s.f.userData.walkingOff && !s.f.userData.seated) && t < 4 && !this.dead; t += 0.1) await this.wait(0.1);
    await this.walk(f, toStation(f, PLATE.x), WALK);
    if (this.dead) return;
    await this.turnFront(f, 0.35);
    this.face('joy', 0.6, f);   // "ooh, food!"
  }

  // ---------------- show how ----------------
  // the kind of thing the child does next; each kind gets a slow ghost-hand demo the first time it comes up
  actionKind() {
    if (this.phase === 'wash' || (this.phase === 'walk' && this.round % 2 === 0)) return this.step;
    if (this.phase !== 'plate') return null;
    const f = this.bestFood();
    if (!f) return null;
    if (f.userData.where === 'fridge' && !this.fridgeOpen) return 'fridge';
    return this.needsWash(f) ? 'sinkfruit' : 'plate';
  }
  async teach(delay = 0.6) {
    const kind = this.actionKind();
    if (!kind || this.shown.has(kind)) return;
    this.shown.add(kind);
    await this.wait(delay);
    while ((this.camMoving || (kind === 'rub' && this.phase !== 'wash')) && !this.dead) await this.wait(0.1);
    if (this.dead || this.busy || this.actionKind() !== kind) return;
    this.demo();
  }
  // stuck: true when it is a repeat for a stuck child (then the hint ladder keeps counting afterwards)
  demo(stuck = false) {
    fx.clearHands();
    const dur = this.showHint(false);
    if (!dur) return;
    this.demoing = true;
    const tok = (this.demoTok = (this.demoTok || 0) + 1);
    this.s.wait(dur).then(() => { if (tok === this.demoTok) { this.demoing = false; if (!stuck) this.idle = 0; } });
  }
  plateText() {
    const s = this.snack;
    if (!this.plan.want) return `Put 3 ${FOOD[s.foods[0]].many} on the plate!`;
    if (this.plan.want.length === 2) return 'A fruit and a veg, please!';
    return 'Fill up the plate!';
  }
  promptText() {
    if (this.phase === 'wash' || (this.phase === 'walk' && this.round % 2 === 0)) return SAY[this.step] || '';
    if (this.phase !== 'plate') return this.plateText();
    // what is still missing
    const miss = this.missing();
    if (!this.plan.want) return this.plateText();
    if (!miss.length) return '';
    if (!this.onPlate.length) return this.plateText();
    if (this.plan.washFruit && miss.length === 1 && miss[0] === 'fruit' && this.foods.some((f) => f.userData.group === 'fruit' && !f.userData.washed && !f.userData.placed)) return 'Wash a fruit in the sink!';
    if (miss[0] === 'dairy' && miss.length === 1 && this.plan.fridge) return 'Now milk or cheese! Look in the fridge!';
    return `Now ${ASK[miss[0]]}!`;
  }

  // ---------------- food on the counter ----------------
  restock(snack) {
    // last snack's spare food hops off the counter (back into the cupboard)
    this.clearLeftovers();
    let fruitI = 0, boardI = 0;
    const spots = BOWL_IN.spots;
    snack.foods.forEach((kind) => {
      const f = makeFood(kind);
      if (!f) return;
      const u = f.userData;
      if (u.group === 'fruit') {
        const [dx, dz] = spots[fruitI++ % spots.length];
        u.where = 'bowl';
        // fruit drops into the bowl one after another, tumbles and settles there (real physics)
        const spot = new T.Vector3(BOWL.x + dx, TOP + BOWL_IN.floor + u.h / 2 + 0.02, BOWL.z + dz);
        f.position.set(spot.x, spot.y + 0.9, spot.z);
        f.rotation.set(0, Math.random() * 6, 0);
        u.home = spot;
        this.root.add(f);
        f.visible = false;
        const i = fruitI;
        this.s.wait(0.15 + i * 0.35).then(() => {
          if (this.dead || u.placed || !f.parent || u.picked) return;
          f.visible = true;
          const y0 = f.position.y, r0 = f.rotation.y;
          // falls in, one soft bounce, settles on its own spot
          return this.s.anim(0.55, (_, p) => {
            if (u.picked) return;
            const fall = Math.min(1, p / 0.6), b = p > 0.6 ? Math.sin((p - 0.6) / 0.4 * Math.PI) * 0.09 : 0;
            f.position.y = y0 + (spot.y - y0) * fall * fall + b;
            f.rotation.y = r0 + p * 0.6;
          }).then(() => { if (!u.picked && !u.placed) { f.position.copy(spot); sfx.land?.(); } });
        });
      } else {
        u.where = 'board';
        const x = BOARD.x + BOARD_SPOTS[boardI++ % 2];
        f.position.set(x, TOP + 0.1 + u.h / 2, BOARD.z);
        // long foods lie across the board (never over its ends)
        if (FOOD[kind].across) f.rotation.y = Math.PI / 2;
        u.home = f.position.clone();
        this.root.add(f);
        f.visible = false;
        this.s.wait(0.3 + boardI * 0.3).then(() => { if (this.dead || !f.parent) return; this.popSoft(f); });
      }
      this.addFood(f);
    });
    // the dairy foods wait in the fridge (Level 3)
    (snack.fridge || []).forEach((kind, i) => {
      const f = makeFood(kind);
      if (!f) return;
      f.userData.where = 'fridge';
      f.position.set(FRIDGE.x + (i ? 0.38 : -0.38), FRIDGE_SHELVES[i % 2 === 0 ? 1 : 0] + f.userData.h / 2, FRIDGE.z + 0.05);
      f.userData.home = f.position.clone();
      this.root.add(f);
      this.addFood(f);
      f.userData.drag.enabled = false;
    });
  }
  // a gentle pop-in (a little past full size, then settle; never the big elastic overshoot)
  popSoft(f, dur = 0.45) {
    const k = f.scale.x || 1;
    f.scale.setScalar(0.001); f.visible = true;
    return this.s.anim(dur, (_, p) => { f.scale.setScalar(Math.max(0.001, k * (p < 0.6 ? Ease.out(p / 0.6) * 1.08 : 1.08 - 0.08 * Ease.inOut((p - 0.6) / 0.4)))); })
      .then(() => f.scale.setScalar(k));
  }
  // the spare food of the last snack hops back into the cupboard (it was never the child's)
  clearLeftovers() {
    for (const f of this.foods) if (!f.userData.placed) this.leftovers.push(f);
    this.foods = [];
    for (const f of this.leftovers) this.removeFood(f);
    this.leftovers = [];
  }
  addFood(f) {
    const u = f.userData;
    u.drag = input.addDrag(f, {
      radius: 0.6, minY: TOP + 0.15, offset: new T.Vector3(0, u.h * 0.5, 0),
      zones: () => this.zonesFor(f),
      onPick: () => this.pickFood(f),
      onDrop: (z, info) => this.drop(f, z, info),
    });
    this.foods.push(f);
  }
  removeFood(f) {
    const u = f.userData;
    if (u.drag) input.remove(u.drag);
    physics.remove(f);
    u.busy = true;
    const a = f.position.clone(), k = f.scale.x;
    this.s.anim(0.55, (e, p) => { f.position.set(a.x, a.y + Math.sin(p * Math.PI) * 0.4, a.z); f.scale.setScalar(Math.max(0.01, k * (1 - e))); }, Ease.inOut)
      .then(() => { this.root.remove(f); });
  }
  zonesFor(f) {
    const z = [{ id: 'plate', pos: PLATE.clone().add(new T.Vector3(0, 0.3, 0)), radius: 1.3 }];
    if (this.plan.washFruit && f.userData.group === 'fruit') z.push({ id: 'sink', pos: SINK.clone().add(new T.Vector3(0, 0.1, 0)), radius: 0.9 });
    return z;
  }
  pickFood(f) {
    const u = f.userData;
    if (u.inPhysics) { physics.remove(f); u.inPhysics = false; }
    if (!u.picked) u.home = f.position.clone();
    u.picked = true;
    // a tumbled fruit turns upright smoothly in the hand
    const q0 = f.quaternion.clone(), qi = new T.Quaternion();
    this.s.anim(0.15, (e) => f.quaternion.slerpQuaternions(q0, qi, e));
    this.s.stop(f.scale);
    this.s.tween(f.scale, { x: 1.12, y: 1.12, z: 1.12 }, 0.25, Ease.out);
    fx.clearHands();
    if (this.phase === 'plate' && this.friend) this.face('happy', 0.8);
  }
  goBack(f) {
    const u = f.userData;
    u.busy = true;
    if (u.drag) u.drag.enabled = false;
    const a = f.position.clone(), b = u.home || a;
    return this.s.anim(0.6, (e, p) => { f.position.lerpVectors(a, b, e); f.position.y += Math.sin(p * Math.PI) * 0.6; f.scale.setScalar(1.12 - 0.12 * e); }, Ease.inOut)
      .then(() => { u.busy = false; u.picked = false; if (u.drag && (u.where !== 'fridge' || this.fridgeOpen)) u.drag.enabled = true; });
  }
  needsWash(f) { return !!this.plan.washFruit && f.userData.group === 'fruit' && !f.userData.washed; }
  // the groups still missing from the plate (Levels 2-3); Level 1: nothing to sort
  missing() { return (this.plan.want || []).filter((g) => !this.onPlate.some((f) => f.userData.group === g)); }
  fits(f) {
    if (!this.plan.want) return this.onPlate.length < 3;
    return this.missing().includes(f.userData.group);
  }

  // test hooks: drop a food on the plate / into the sink
  put(f) { return this.drop(f, this.zonesFor(f)[0], { tapped: false }); }
  rinseFood(f) { return this.drop(f, { id: 'sink' }, { tapped: false }); }

  async drop(f, zone, { tapped } = {}) {
    const u = f.userData;
    fx.clearHands();
    if (u.busy || u.placed) return;
    if (this.phase !== 'plate' || this.busy || this.dead) {
      this.goBack(f);
      if ((this.phase === 'wash' || this.phase === 'walk') && !this.busy && this.round % 2 === 0) { this.say('Wash hands first!', { max: 1.2 }); this.nudge(2); }
      return;
    }
    if (!zone && !tapped) { this.goBack(f); return; }
    const where = zone ? zone.id : (this.needsWash(f) ? 'sink' : 'plate');
    if (where === 'sink') { this.washFood(f); return; }
    if (!this.fits(f)) {
      // the calm face and the food flying home say "not that"; the line says what is missing
      this.goBack(f);
      this.face('calm', 0.8);
      this.redirect(this.promptText());
      return;
    }
    if (this.needsWash(f)) {
      this.goBack(f);
      this.redirect('Wash the fruit first!');
      this.addHalo(this.K.tap, 0.9);
      return;
    }
    await this.placeOnPlate(f);
  }

  // where a food goes on the plate (plate space), by level
  slotFor(f, n = this.onPlate.length) {
    const P = this.plate, k = P?.userData.k || 1;
    if (!this.plan.want) {
      const S = [[-0.3, -0.2], [0.3, -0.2], [0, 0.28]][n % 3];
      return new T.Vector3(S[0] * k, 0, S[1] * k);
    }
    const G = GROUPS[f.userData.group];
    const sec = this.plan.want.length === 2 ? G.sec2 : G.sec4;
    return new T.Vector3(sec[0] * k, 0, sec[1] * k);
  }
  slotWorld(f, n) {
    const l = this.slotFor(f, n);
    return new T.Vector3(PLATE.x + l.x, TOP + (this.plate?.userData.floor || 0.1) + f.userData.h / 2 * this.plateScale(), PLATE.z + l.z);
  }
  plateScale() { return this.plan.want && this.plan.want.length === 4 ? 0.82 : this.plan.want ? 0.92 : 1; }
  async placeOnPlate(f) {
    const u = f.userData;
    u.busy = true;
    u.placed = true;
    input.remove(u.drag);
    physics.remove(f);
    u.inPhysics = false;
    const n = this.onPlate.length;
    const to = this.slotWorld(f, n);
    this.onPlate.push(f);
    this.clearHints();
    this.idle = 0;
    const a = f.position.clone(), k0 = f.scale.x, q0 = f.quaternion.clone(), qi = new T.Quaternion();
    const ks = this.plateScale();
    // up first (clear of the bowl and its other fruit), then across along the front of the worktop (in front of the
    // friend, below its face), then down onto its spot: never through anything. From up in the fridge it comes down
    // to that height first.
    const up = TOP + 0.85, front = Math.max(a.z, to.z) + 0.45;
    await this.s.anim(a.y > up + 0.2 ? 1.0 : 0.8, (_, p) => {
      const rise = Ease.inOut(Math.min(1, p / 0.25)), across = Ease.inOut(Math.min(1, Math.max(0, (p - 0.15) / 0.65))), fall = Ease.inOut(Math.max(0, (p - 0.75) / 0.25));
      const fwd = Math.sin(Math.min(1, Math.max(0, (p - 0.1) / 0.75)) * Math.PI);
      f.position.set(a.x + (to.x - a.x) * across, 0, a.z + (to.z - a.z) * across + (front - Math.max(a.z, to.z)) * fwd);
      f.position.y = (a.y + (up - a.y) * rise) * (1 - fall) + to.y * fall;
      f.scale.setScalar(k0 + (ks - k0) * across);
      f.quaternion.slerpQuaternions(q0, qi, across);
    });
    f.quaternion.identity();
    // the food now rides on the plate (it goes where the plate goes)
    const P = this.plate;
    if (P) { P.updateMatrixWorld(true); P.attach(f); } else f.position.copy(to);
    // land: a soft plop, a squash, the plate dips a little, and the count (a note that rises with it)
    const s0 = f.scale.clone();
    this.s.anim(0.3, (_, p) => { const q = 1 - 0.22 * Math.sin(p * Math.PI); f.scale.set(s0.x / Math.sqrt(q), s0.y * q, s0.z / Math.sqrt(q)); }).then(() => f.scale.copy(s0));
    this.tipPlate(to);
    sfx.note(n);
    this.say(COUNT[n] || '', { repeat: true, max: 0.8 });
    fx.float(to.clone().add(new T.Vector3(1.25, 0.3, 0.6)), String(n + 1), { color: NUM_COL[n % NUM_COL.length], size: 5 });
    this.face('joy', 0.9);
    if (u.where === 'fridge') this.shutFridge();
    if (this.complete()) {
      this.phase = 'done';
      this.busy = true;
      this.plateDoneT = performance.now();
      this.finishPlate();
      return;
    }
    // the empty sections glow for a moment (what is still missing), silently
    if (this.plan.want) this.haloMissing();
    // Level 3: once only the dairy food is missing, the camera takes in the fridge
    if (this.plan.fridge || this.plan.washFruit) this.goStation('plate');
    this.teach(1.0);
  }
  // the plate dips toward where the food landed, then settles
  tipPlate(at) {
    const P = this.plate;
    if (!P) return;
    const dx = at.x - PLATE.x, dz = at.z - PLATE.z, L = Math.hypot(dx, dz) || 1;
    this.s.anim(0.45, (_, p) => { const k = Math.sin(p * Math.PI) * (1 - p) * 0.07; P.rotation.set(dz / L * k, 0, -dx / L * k); }).then(() => P.rotation.set(0, 0, 0));
  }
  haloMissing() {
    const P = this.plate;
    if (!P) return;
    const stops = [];
    for (const g of this.missing()) {
      const G = GROUPS[g], sec = this.plan.want.length === 2 ? G.sec2 : G.sec4, k = P.userData.k || 1;
      const o = new T.Object3D();
      o.position.set(sec[0] * k, 0.1, sec[1] * k);
      P.add(o);
      stops.push(fx.halo(o, this.plan.want.length === 2 ? 0.55 : 0.45), () => P.remove(o));
    }
    this.s.wait(2).then(() => stops.forEach((s) => s()));
  }
  complete() { return this.plan.want ? this.missing().length === 0 : this.onPlate.length >= 3; }
  doneText() {
    if (!this.plan.want) return `${this.onPlate.length} ${FOOD[this.onPlate[0].userData.food].many}!`;
    if (this.plan.want.length === 2) return 'A fruit and a veg!';
    return 'A healthy plate!';
  }
  // the plate is full: a held breath, the friend gasps and looks at her, then eats it (the round's payoff)
  async finishPlate() {
    const f = this.friend, plate = this.plate, foods = this.onPlate.slice();
    await this.arriveP;
    if (this.dead) return;
    if (this.plateDoneT) console.log(`TIMING snack plate done -> its friend at the plate ${((performance.now() - this.plateDoneT) / 1000).toFixed(2)}s`);
    await this.wait(0.1);
    await this.beat(plate, 0.4);
    this.face('joy', 0.9, f);          // a happy gasp
    hop(this.s, f, 0.12, 0.35);
    let bitten; const firstBite = new Promise((r) => { bitten = r; });
    this.eatP = this.eat(f, plate, foods, bitten);
    // the next friend (waiting behind the counter's left end) steps up to the sink and gets its paws ready while this
    // one eats, so the next round is playable as soon as it starts
    const n = this.nextF;
    if (n) n.userData.prepP = this.toSink(n);
    this.busy = false;
    // the payoff we wait for is the happy gasp and the first bite (the rest of the eating carries on meanwhile)
    const last = this.round + 1 >= this.totalRounds;
    this.payoffP = last ? this.eatP : firstBite;
    this.success(plate.position.clone().add(new T.Vector3(0, 0.5, 0)), this.doneText(), last ? {} : { still: 0.2 });
  }

  // Level 3: wash a fruit under the tap before it goes on the plate
  async washFood(f) {
    const u = f.userData;
    if (!this.needsWash(f)) { this.goBack(f); return; }
    u.busy = true;
    this.busy = true;
    this.clearHints();
    input.remove(u.drag);
    // drop it in the basin: it lands and rolls about in there (real physics)
    f.scale.setScalar(1);
    this.setTap(true);
    await physics.toss(f, new T.Vector3(SINK.x + 0.1, BASIN_FLOOR + 0.3, SINK.z), { r: Math.max(0.2, u.r * 0.85), arc: 0.6, maxT: 0.8 });
    if (this.dead) return;
    sfx.splash();
    droplets(this.s, this.root, new T.Vector3(SINK.x, TOP + 0.1, SINK.z), 6);
    physics.poke(f, 0.25);
    await this.wait(1.1);          // time to watch the water rinse it
    this.setTap(false);
    physics.remove(f);
    u.washed = true;
    const sc = project(f.position.clone().add(new T.Vector3(0, 0.4, 0)));
    fx.sparkle(sc.x, sc.y);
    this.say('Clean fruit!', { voice: false, max: 1 });
    await this.wait(0.5);
    this.busy = false;
    if (this.fits(f)) { await this.placeOnPlate(f); return; }
    // a second fruit: washed, it hops back to the bowl
    u.drag = input.addDrag(f, { radius: 0.6, minY: TOP + 0.15, offset: new T.Vector3(0, u.h * 0.5, 0), zones: () => this.zonesFor(f), onPick: () => this.pickFood(f), onDrop: (z, info) => this.drop(f, z, info) });
    await this.goBack(f);
  }

  // ---------------- the fridge ----------------
  async station(name) {
    if (this.dead) return;
    if (name === 'fridge') return this.tapFridge();
    const washRound = this.round % 2 === 0;
    const step = { tap: this.step === 'tap' ? 'tap' : 'rinse', hands: 'rub', towel: 'dry', soap: 'soap' }[name];
    // the friend is still stepping up to the sink: the right first step is kept (the tap starts running at once)
    if (this.phase === 'walk' && washRound && !this.busy && step === this.step) {
      if (!this.queued) {
        this.queued = step; this.idle = 0; this.clearHints(); fx.clearHands();
        if (step === 'tap') this.setTap(true);
        if (step === 'soap') this.preSoap();
      }
      return;
    }
    if (this.phase !== 'wash' || this.busy || this.plan.wash.indexOf(step) < 0) {
      // nothing to do with this right now: it just bobs (no sound), so every touch does something
      this.bob(name);
      return;
    }
    return this.wash(step);
  }
  bob(name) {
    if (name === 'hands') { if (this.friend) { this.face('joy', 0.5); hop(this.s, this.friend, 0.06, 0.3); } return; }
    const o = { tap: this.K.tap, soap: this.K.soap, towel: this.K.towel }[name];
    if (!o || o.userData.bobbing) return;
    o.userData.bobbing = true;
    const y0 = o.position.y;
    this.s.anim(0.6, (_, p) => { o.position.y = y0 + Math.sin(p * Math.PI) * 0.08; }).then(() => { o.position.y = y0; o.userData.bobbing = false; });
  }
  async tapFridge() {
    const can = this.plan.fridge && this.phase === 'plate' && !this.busy && this.missing().includes('dairy');
    if (this.fridgeOpen || this.fridgeBusy) return;
    if (can) return this.openFridge();
    // a peek: open, a breath of cold, shut
    this.fridgeBusy = true;
    await this.swingDoor(1, 0.6);
    fx.float(FRIDGE.clone().add(new T.Vector3(0, 3.0, 1.4)), '❄', { color: '#7fc8ff', size: 6 });
    await this.wait(0.8);
    await this.swingDoor(0, 0.6);
    sfx.thunk();
    this.fridgeBusy = false;
  }
  async openFridge() {
    if (this.fridgeOpen) return;
    this.fridgeOpen = true;
    this.clearHints();
    fx.clearHands();
    sfx.swoosh();
    await this.swingDoor(1, 0.7);
    for (const f of this.foods) if (f.userData.where === 'fridge' && !f.userData.placed) { f.userData.drag.enabled = true; hop(this.s, f, 0.15, 0.5); }
    this.idle = 0;
    this.teach(0.7);
  }
  shutFridge() {
    if (!this.fridgeOpen) return;
    this.fridgeOpen = false;
    for (const f of this.foods) if (f.userData.where === 'fridge' && f.userData.drag) f.userData.drag.enabled = false;
    this.s.wait(0.5).then(() => this.swingDoor(0, 0.6)).then(() => { sfx.thunk(); });
  }
  swingDoor(to, dur) {
    const from = this.doorAmt;
    return this.s.anim(dur, (e) => { this.doorAmt = from + (to - from) * e; }, Ease.inOut);
  }

  // ---------------- washing hands ----------------
  setTap(on) {
    if (this.water.on === !!on) return;
    this.water.set(on);
    const h = this.K.handle;
    if (h) { const r0 = h.rotation.y; this.s.anim(0.5, (e) => { h.rotation.y = r0 + ((on ? 1.2 : 0) - r0) * e; }, Ease.inOut); }
    if (on) { sfx.pour(); this.pourT = 0; }
  }
  // do (or try) a wash step: 'tap' (Level 1: water on, the friend soaps itself), 'soap', 'rub', 'rinse', 'dry'
  async wash(what) {
    if (this.phase !== 'wash' || this.busy || this.dead) return;
    const want = this.step;
    if (what !== want) {
      if (!this.plan.wash.includes(what)) { this.bob({ rub: 'hands', dry: 'towel', rinse: 'tap' }[what] || what); return; }
      this.face('calm', 0.8);
      this.redirect(EARLY[want] || SAY[want]);
      return;
    }
    this.busy = true;
    this.idle = 0;
    this.clearHints();
    fx.clearHands();
    if (want === 'tap') await this.wetAndSoap();
    else if (want === 'soap') { this.say('Soap!', { voice: false }); await this.doSoap(); }
    else if (want === 'rub') { await this.doRub(); if ((this.rubs || 0) < 3) { this.busy = false; this.idle = 0; return; } }
    else if (want === 'rinse') { this.say('Rinse!', { voice: false }); await this.doRinse(); }
    else if (want === 'dry') { this.say('Dry dry dry!', { voice: false }); await this.doDry(); }
    if (this.dead) return;
    // Level 1: after the rubbing the rinse plays by itself
    if (want === 'rub' && this.plan.autoRinse) { await this.wait(0.3); this.say('Rinse!', { voice: false }); await this.doRinse(); if (this.dead) return; }
    const i = this.plan.wash.indexOf(want);
    const next = this.plan.wash[i + 1];
    if (next) {
      this.step = next;
      await this.wait(0.35);      // a moment to see what just happened
      this.busy = false;
      this.idle = 0;
      this.prompt();
      this.teach(0.4);
      return;
    }
    // all clean!
    this.step = null;
    this.phase = 'done';
    this.face('joy', 1.2);
    this.busy = false;
    this.success(this.handsMid(), 'Clean hands!');
  }
  // Level 1's tap: water runs over the paws, then the friend squeezes the soap onto them by itself
  // a small side-step with the paws still in the basin: under the water, the paws sit just left of the spout's tip
  // (never under it), and the water pours onto them in a curve and runs off into the basin
  sidestep(f, dx, dur = 0.35) {
    if (!f) return Promise.resolve();
    const x0 = f.position.x, x1 = x0 + dx;
    f.userData.stepped = (f.userData.stepped || 0) + dx;
    return this.s.anim(dur, (e) => { f.position.x = x0 + (x1 - x0) * e; }, Ease.inOut);
  }
  async wetAndSoap() {
    const f = this.friend;
    await this.sidestep(f, -0.38);
    this.setTap(true);
    await this.rubAnim(0.9, 0.6, 1);
    this.setTap(false);
    await this.sidestep(f, 0.38);
    await this.wait(0.25);
    this.say('Soap!', { voice: false });
    await this.doSoap();
  }
  // the pump squishes and a blob of soap waits on the nozzle (a touch on the soap before the friend is ready)
  preSoap() {
    const pump = this.K.pump;
    if (pump) {
      const y0 = pump.userData.y0 ?? (pump.userData.y0 = pump.position.y);
      this.s.anim(0.6, (_, p) => { pump.position.y = y0 - bump(p) * 0.1; }).then(() => { pump.position.y = y0; });
    }
    sfx.squeak();
    if (this.waitBlob) return;
    const b = new T.Mesh(geo.sphere(0.09, 12, 10), this._soapMat || (this._soapMat = toon(0xffd6ea)));
    b.position.copy(this.K.soap.localToWorld(new T.Vector3(0.22, 0.6, 0)));
    b.scale.setScalar(0.001);
    this.root.add(b);
    this.waitBlob = b;
    this.s.wait(0.25).then(() => this.s.anim(0.3, (e) => b.scale.set(e, e * 0.8, e)));
  }
  async doSoap() {
    const pump = this.K.pump, pre = this.waitBlob;
    if (!pre) {
      if (pump) {
        const y0 = pump.userData.y0 ?? (pump.userData.y0 = pump.position.y);
        this.s.anim(0.7, (_, p) => { pump.position.y = y0 - bump(p) * 0.1; }).then(() => { pump.position.y = y0; });
      }
      await this.wait(0.3);
      sfx.squeak();
    }
    const from = pre ? pre.position.clone() : this.K.soap.localToWorld(new T.Vector3(0.22, 0.6, 0));
    if (pre) { this.root.remove(pre); this.waitBlob = null; }
    await dollop(this.s, this.root, from, this.handsMid().add(new T.Vector3(0, 0.08, 0)), 0.7);
    this.foam.set(0.25);
    this.face('joy', 0.8);
    await this.wait(0.25);
    this.rubs = 0;
  }
  // one rub: the paws go round each other and the foam grows (three rubs = all soapy). Rubbing under the finger
  // also grows the foam bit by bit as she moves (update()).
  async doRub() {
    this.rubs = (this.rubs || 0) + 1;
    sfx.scrub();
    this.say('Rub rub rub!', { voice: false });
    bubbles(this.s, this.root, this.handsMid(), 2);
    this.foam.set(Math.max(this.foam.level, 0.25 + this.rubs * 0.25));
    this.face('joy', 0.8);
    await this.rubAnim(0.9, 1, 2);
  }
  rubAnim(dur, k = 1, cycles = 2, base = this.H) {
    const H = poseOf(base, this.friend?.userData.carry);
    return this.pose(dur, (p, P) => {
      const w = Math.sin(p * Math.PI * 2 * cycles);
      P.armL = H.armL - 0.07 * k * w; P.armR = H.armR + 0.07 * k * w;
      P.armLx = H.armLx + 0.08 * k * w; P.armRx = H.armRx - 0.08 * k * w;
    }).then(() => { Object.assign(this.P, H); });
  }
  async doRinse() {
    // a side-step left: the paws just beside the spout's tip, so the water pours a good way onto them
    const f = this.friend;
    await this.sidestep(f, -0.38);
    this.setTap(true);
    await this.wait(0.35);
    // the bubbles wash away under the water, slowly enough to watch
    const f0 = this.foam.level;
    const rub = this.rubAnim(1.6, 0.6, 3);
    let n = 0;
    let m = 0;
    await this.s.anim(1.6, (_, p) => {
      this.foam.set(f0 * (1 - Math.min(1, p * 1.4)) ** 1.5);
      if (p > n * 0.35 && n < 2) { n++; bubbles(this.s, this.root, this.handsMid(), 1); }
      if (f0 > 0.1 && p > m * 0.22 && m < 5) { m++; this.foamOff(); }
    });
    await rub;
    this.foam.set(0);
    this.setTap(false);
    await this.wait(0.25);
    await this.shake();
  }
  // a lump of foam washed off the paws: it slides down into the basin and melts away
  foamOff() {
    const at = this.handsMid().add(new T.Vector3((Math.random() - 0.5) * 0.3, 0.02, 0.06));
    const b = new T.Mesh(geo.sphere(0.06 + Math.random() * 0.03, 10, 8), this._foamMat || (this._foamMat = toon(0xffffff)));
    b.scale.y = 0.75;
    b.position.copy(at);
    this.root.add(b);
    const end = new T.Vector3(at.x + (Math.random() - 0.5) * 0.2, BASIN_FLOOR + 0.05, at.z + 0.05);
    const k = b.scale.x;
    this.s.anim(0.7, (e) => { b.position.lerpVectors(at, end, e); b.scale.setScalar(Math.max(0.001, k * (1 - e * 0.85))); b.scale.y *= 0.75; }, Ease.in)
      .then(() => this.root.remove(b));
  }
  // a shake down in the basin (drops fly into the sink), under the spout but well below it
  async shake() {
    // (still side-stepped: the paws are to the left of the spout's tip, never under it)
    const f = this.friend, u = f.userData, W = poseOf(this.H, u.carry);
    await this.poseTo(f, W, 0.25);
    droplets(this.s, this.root, this.handsMid(), 6);
    await this.pose(0.8, (p, P) => { const w = Math.sin(p * Math.PI * 6) * bump(p); P.armL = W.armL + 0.07 * w; P.armR = W.armR - 0.07 * w; P.armLx = W.armLx - 0.05 * Math.abs(w); P.armRx = W.armRx - 0.05 * Math.abs(w); });
    await this.poseTo(f, W, 0.2);
  }
  // the towel: when she taps it, the friend (paws up out of the water) steps over to the stand, takes the towel off
  // the bar with both paws, holds it up a little over the worktop's back edge and rubs its paws dry in it (the towel
  // folds round them), then hangs it back on the bar. The towel is only ever on its stand or in the friend's paws.
  async doDry() {
    const t = this.K.towel, f = this.friend;
    if (!t || !f) return;
    const u = f.userData, Sk = u.sink;
    if (!Sk?.take) return;
    this.drying = true;
    t.scale.setScalar(t.userData.s0 ?? 1);
    u.atSink = false;
    const S = poseOf(Sk.shake), Tk = poseOf(Sk.take), D = poseOf(Sk.dry), W = poseOf(this.H, u.carry);
    // paws up (already, after the shake), a step back, along to the stand, a step up
    await this.poseTo(f, S, 0.3);
    const x0 = f.position.x, z0 = f.position.z, at = Sk.towelAt;
    await this.walk(f, [new T.Vector3(x0, 0, u.laneZ + (z0 - u.laneZ) * 0.4)], WALK * 0.8);
    await this.turnTo(f, -Math.PI / 2, 0.3);
    await this.walk(f, [new T.Vector3(at.x, 0, f.position.z)], WALK * 0.8);
    await this.turnFront(f, 0.3);
    await this.walk(f, [new T.Vector3(at.x, 0, at.z)], WALK * 0.8);
    // reach for the towel and take it (it comes off the bar into the paws)
    await this.poseTo(f, Tk, 0.5);
    const a = t.position.clone();
    const B = t.userData.bones || {}, fF = B.flapF, fB = B.flapB;
    const fF0 = fF ? fF.rotation.x : 0, fB0 = fB ? fB.rotation.x : 0;
    const gap = this.hand(0).distanceTo(this.hand(1));
    const wide = Math.max(1, Math.min(1.45, (gap + 0.4) / 0.5));
    // folded round the paws: the flaps open round them, a little wider, folded a little shorter
    const wrap = (k) => { if (fF) fF.rotation.x = fF0 - 0.5 * k; if (fB) fB.rotation.x = fB0 + 0.5 * k; t.scale.set(1 + (wide - 1) * k, 1 - 0.2 * k, 1 + 0.6 * k); };
    const hold = () => this.handsMid().add(new T.Vector3(0, 0.1, 0.02));
    const g0 = t.position.clone();
    sfx.rustle();
    await this.s.anim(0.3, (e) => { t.position.lerpVectors(g0, hold(), e); wrap(e * 0.4); });
    this.face('joy', 1.0);
    // lift it a little and rub the paws in it
    await this.s.anim(0.45, (e) => { lerpPose(u.P, Tk, D, Ease.inOut(e)); t.position.copy(hold()); wrap(0.4 + 0.6 * e); });
    await this.s.anim(1.3, (_, p) => {
      const w = Math.sin(p * Math.PI * 4);
      u.P.armL = D.armL - 0.06 * w; u.P.armR = D.armR + 0.06 * w; u.P.armLx = D.armLx + 0.05 * w; u.P.armRx = D.armRx - 0.05 * w;
      t.position.copy(hold()); t.rotation.z = Math.sin(p * Math.PI * 4) * 0.05;
    });
    t.rotation.z = 0;
    // back onto the bar
    await this.s.anim(0.45, (e) => { lerpPose(u.P, D, Tk, Ease.inOut(e)); t.position.copy(hold()); wrap(1 - 0.6 * e); });
    const g1 = t.position.clone();
    await this.s.anim(0.3, (e) => { t.position.lerpVectors(g1, a, e); wrap(0.4 * (1 - e)); });
    t.position.copy(a); wrap(0);
    this.drying = false;
    // paws back in, a step back, and back to the sink spot
    await this.poseTo(f, S, 0.35);
    await this.walk(f, [new T.Vector3(at.x, 0, u.laneZ + (at.z - u.laneZ) * 0.4)], WALK * 0.8);
    await this.poseTo(f, { ...newPose(), armL: u.carry, armR: u.carry }, 0.3);
    void W; void x0;
  }

  // ---------------- eating, then off to the table ----------------
  async afterSuccess() {
    if (this.round % 2 === 1) return;          // the wash round just ended: off to the plate (next round)
    // the plate round just ended: once it has eaten, the friend carries its plate to the table (the next friend is
    // already waiting by the sink); the last friend's walk is watched from the table before the finale
    const f = this.friend, plate = this.plate, i = this.seated.length, eatP = this.eatP;
    this.friend = null;
    this.plate = null;
    this.seated.push({ f, plate });
    const last = this.round >= this.totalRounds;
    // the spare food goes once it has eaten (before the plate is lifted past the bowl)
    const spare = this.foods.filter((x) => !x.userData.placed);
    this.foods = this.foods.filter((x) => x.userData.placed);
    // it finishes eating (and then takes its plate to the table) while the next round already plays
    const go = eatP.then(() => { if (this.dead) return; spare.forEach((x) => this.removeFood(x)); return this.toTable(f, plate, i); });
    if (last) await go;    // (toTable glides the camera to the table as this friend arrives at its seat)
  }
  newPlate(pop = false) {
    const p = makePlate(this.plan.plate);
    if (!p) return null;
    p.position.copy(PLATE);
    this.root.add(p);
    if (pop) { const k = p.scale.x; p.scale.setScalar(0.001); this.s.anim(0.45, (_, q) => p.scale.setScalar(Math.max(0.001, k * Ease.out(q)))); }
    return p;
  }
  // two bites a piece: up to the mouth, a bite (it gets smaller, a bite mark shows, crumbs fall on the plate), a
  // second bite, then the rest goes back down onto its spot on the plate and stays there; then a tummy pat. The
  // finale shows every plate with its bitten pieces: what she served, and how many.
  async eat(f, plate, foods, bitten = null) {
    const u = f.userData;
    await this.poseTo(f, { ...u.P, lean: 0.14 }, 0.3);
    for (const food of foods) {
      const k = food.scale.clone();
      plate.updateMatrixWorld(true);
      const local = food.position.clone();
      const spot = food.getWorldPosition(new T.Vector3()), m = this.mouth(f);
      this.root.attach(food);
      const lift = spot.clone().setY(Math.max(spot.y + 0.4, m.y - 0.3));
      const near = m.clone().add(new T.Vector3(0, -0.04 - food.userData.h * 0.3, 0.06 + food.userData.r * 0.6));
      await this.s.anim(0.4, (_, p) => {
        if (p < 0.4) food.position.lerpVectors(spot, lift, Ease.inOut(p / 0.4));
        else food.position.lerpVectors(lift, near, Ease.inOut((p - 0.4) / 0.6));
      });
      for (let bite = 0; bite < 2; bite++) {
        sfx.chomp();
        this.face('joy', 0.4, f);
        this.crumbs(plate, food, spot, bite ? 2 : 3);
        const s0 = food.scale.clone(), s1 = k.clone().multiplyScalar(bite ? 0.68 : 0.82);
        await this.s.anim(0.14, (e) => food.scale.lerpVectors(s0, s1, e));
        if (bitten) { bitten(); bitten = null; }
        await this.wait(0.26);
      }
      // the rest goes back on the plate
      await this.s.anim(0.35, (e) => { food.position.lerpVectors(near, spot.clone().setY(spot.y - food.userData.h * 0.16), e); }, Ease.inOut);
      if (plate.parent) { plate.attach(food); food.position.y = local.y - food.userData.h * 0.16 / (plate.scale.y || 1); }
      await this.wait(0.08);
    }
    await this.poseTo(f, { ...u.P, lean: 0 }, 0.3);
    // a tummy pat
    const c0 = u.carry, A = { ...u.P };
    await this.pose(0.75, (p, P) => { const w = bump(p), pat = Math.abs(Math.sin(p * Math.PI * 3)); P.armL = A.armL + (-0.45 - A.armL) * w + pat * 0.12 * w; P.armR = A.armR + (-0.45 - A.armR) * w + pat * 0.12 * w; P.armLx = A.armLx * (1 - w) - 0.35 * w; P.armRx = A.armRx * (1 - w) - 0.35 * w; }, f);
    Object.assign(u.P, newPose(), { armL: c0, armR: c0 });
    this.face('joy', 1.0, f);
  }
  // a bite mark: a little round notch of the food's inside colour, with an ink rim, on its top edge facing the friend
  biteMark(food, i) {
    const col = BITE[food.userData.food] ?? 0xfff1d6;
    const mat = (this._biteMat ||= {})[col] || (this._biteMat[col] = toon(col));
    const inner = food.children[0];
    if (!inner) return;
    const h = food.userData.h, r = food.userData.r;
    const g = new T.Group();
    const disc = new T.Mesh(geo.sphere(1, 14, 10), mat);
    const ink = new T.Mesh(geo.sphere(1.12, 14, 10), new T.MeshBasicMaterial({ color: 0x3a2a2a, side: T.BackSide }));
    g.add(ink, disc);
    const sz = Math.max(0.07, Math.min(r, h) * 0.42);
    g.scale.set(sz, sz * 0.75, sz * 0.5);
    // on the back top edge (toward the friend's mouth), the second a little to one side
    g.position.set((i ? 0.35 : -0.1) * r, h * 0.28, -r * 0.82);
    g.rotation.y = i ? 0.5 : -0.2;
    food.add(g);
  }
  // crumbs of a food stay on the plate (they ride on it to the table)
  crumbs(plate, food, at, n) {
    const col = CRUMB[food.userData.food] ?? 0xe0b070;
    const mat = this._crumbMat?.[col] || ((this._crumbMat = this._crumbMat || {})[col] = toon(col));
    plate.updateMatrixWorld(true);
    const floorY = TOP + (plate.userData.floor || 0.1);
    for (let i = 0; i < n; i++) {
      const c = new T.Mesh(geo.sphere(0.035 + Math.random() * 0.02, 7, 5), mat);
      c.scale.y = 0.6;
      const dest = new T.Vector3(at.x + (Math.random() - 0.5) * 0.3, floorY + 0.015, at.z + (Math.random() - 0.5) * 0.3);
      const from = food.position.clone();
      c.position.copy(from);
      this.root.add(c);
      this.s.anim(0.35 + Math.random() * 0.15, (e) => { c.position.lerpVectors(from, dest, e); c.position.y += Math.sin(e * Math.PI) * 0.1; }, Ease.in)
        .then(() => { if (plate.parent) plate.attach(c); else this.root.remove(c); });
    }
  }
  // off to the table with the plate: it turns to walk right, holds the plate out in front (the plate rises off the
  // worktop to its paws), walks behind the counter and the fridge to its seat, turns to us, steps up to the table,
  // puts the plate down and sits. The plate never passes through anything (the spare food is gone first).
  async toTable(f, plate, i) {
    const u = f.userData;
    u.toTable = true;
    const R = (plate.userData.R || 1.0);
    const C = await this.carryPose(f, R);
    const ca = u.carryAt;
    // it turns to walk off while the paws come out and the plate rises off the worktop to them
    const turn = this.turnTo(f, Math.PI / 2, 0.45);
    if (C) this.poseTo(f, poseOf(C), 0.6);
    const hold = () => f.localToWorld(new T.Vector3(0, ca.y / f.scale.x, ca.reach / f.scale.x));
    // a little up, then low and straight back to the paws behind the counter (well clear of the fruit bowl, and
    // always below the friend's face)
    const a = plate.position.clone(), up = TOP + 0.32;
    await this.s.anim(1.05, (_, p) => {
      const tgt = hold();
      const r = Ease.inOut(Math.min(1, p / 0.3)), m = Ease.inOut(Math.min(1, Math.max(0, (p - 0.25) / 0.55))), d = Ease.inOut(Math.max(0, (p - 0.75) / 0.25));
      plate.position.set(a.x + (tgt.x - a.x) * m, a.y + (up - a.y) * r + (tgt.y - up) * d, a.z + (tgt.z - a.z) * m);
      plate.rotation.y = (Math.PI / 2) * m;
    });
    await turn;
    if (this.dead) return;
    plate.userData.holder = f;    // update() keeps it in the paws from now on
    u.walkingOff = true;
    const seatX = SEATS[i] ?? SEATS[SEATS.length - 1];
    const last = i === this.plan.snacks.length - 1;
    if (!last) await this.walk(f, [new T.Vector3(f.position.x, 0, u.laneZ), new T.Vector3(seatX, 0, u.laneZ)], WALK * 1.1);
    else {
      // the last one: we watch it carry its plate off along the counter; out of the picture it hurries on, and the
      // camera reaches the table as it comes to its seat (it is never seen walking behind the friends already there)
      await this.walk(f, [new T.Vector3(f.position.x, 0, u.laneZ), new T.Vector3(4.9, 0, u.laneZ)], WALK * 1.1);
      if (this.dead) return;
      await this.walk(f, [new T.Vector3(seatX - 0.6, 0, u.laneZ)], 4.5);
      this.goStation('table', 0.9);
      await this.walk(f, [new T.Vector3(seatX, 0, u.laneZ)], WALK);
    }
    if (this.dead) return;
    await this.turnFront(f, 0.6);
    await this.walk(f, [new T.Vector3(seatX, 0, SEAT_Z)], WALK);
    // the plate goes down on the table in front of it
    plate.userData.holder = null;
    const b = plate.position.clone(), to = new T.Vector3(seatX, TABLE_TOP, TABLE.z), r0 = plate.rotation.y;
    await this.s.anim(0.6, (e) => { plate.position.lerpVectors(b, to, e); plate.rotation.y = r0 * (1 - e); }, Ease.inOut);
    sfx.thunk?.();
    // paws back down; it stays standing at the table (the cloth hides its legs), the same height as its friends, so
    // the next one walking in behind never looks higher up than them
    await this.poseTo(f, { ...newPose(), armL: u.carry * 0.5, armR: u.carry * 0.5 }, 0.5);
    u.seated = true;
    this.face('joy', 1.0, f);
  }

  // ---------------- hints ----------------
  stationObj(step) { return { tap: this.K.tap, rinse: this.K.tap, soap: this.K.soap, rub: this.handsSpot, dry: this.K.towel }[step]; }
  nudgeTarget() {
    if (this.phase === 'wash') return this.step === 'rub' ? null : this.stationObj(this.step);
    if (this.phase !== 'plate') return null;
    const f = this.bestFood();
    if (!f) return null;
    if (f.userData.where === 'fridge' && !this.fridgeOpen) return this.K.fridge;
    return f;
  }
  // the food a helper would pick next
  bestFood() {
    const ok = this.foods.filter((f) => !f.userData.placed && !f.userData.busy && f.visible && this.fits(f));
    return ok.find((f) => f.userData.where !== 'fridge') || ok[0] || null;
  }
  // the slow ghost-hand demo of the next action; returns how long it takes (s)
  showHint(glow = true) {
    if (this.phase === 'wash' || (this.phase === 'walk' && this.round % 2 === 0)) {
      if (this.step === 'rub') {
        if (this.phase !== 'wash') return 0;
        // press on the paws and rub back and forth
        const m = this.handsMid();
        if (glow) this.addHalo(this.handsSpot, 0.6);
        fx.ghostPath([m.clone().add(new T.Vector3(0.7, 0.35, 0.4)), m.clone().add(new T.Vector3(0, 0.05, 0.1))], { mode: 'rub', maxDur: 4 });
        return 3.0;
      }
      const o = this.stationObj(this.step);
      if (!o) return 0;
      if (glow) this.addHalo(o, 0.8);
      const p = o.getWorldPosition(new T.Vector3());
      if (this.step === 'dry') p.add(new T.Vector3(0, -0.3, 0.1));
      else if (this.step === 'soap') p.y += 0.45;
      else p.add(new T.Vector3(-0.25, 0.55, 0.15));
      fx.ghostPath([p], { mode: 'tap', maxDur: 4 });
      return 2.0;
    }
    const f = this.bestFood();
    if (!f) return 0;
    if (f.userData.where === 'fridge' && !this.fridgeOpen) {
      if (glow) this.addHalo(this.K.fridge, 1.4);
      fx.ghostPath([FRIDGE.clone().add(new T.Vector3(0, 2.3, 0.7))], { mode: 'tap', maxDur: 4 });
      return 2.0;
    }
    if (glow) this.addHalo(f, 0.7);
    // pick it up, lift it, and set it down on the plate (or in the sink)
    const from = f.position.clone().add(new T.Vector3(0, 0.3, 0));
    const to = this.needsWash(f) ? SINK.clone().add(new T.Vector3(0, 0.3, 0)) : this.slotWorld(f, this.onPlate.length).add(new T.Vector3(0, 0.2, 0));
    const mid = from.clone().lerp(to, 0.5); mid.y = Math.max(from.y, to.y) + 0.9;
    fx.ghostPath([from, mid, to], { mode: 'drag', maxDur: 4.5 });
    return 3.6;
  }
  // a stuck child: the target glows (no bouncing, no boing)
  nudge(step) {
    const o = this.nudgeTarget();
    if (!o) { if (step >= 2 && this.phase === 'wash' && this.step === 'rub') { const stop = fx.halo(this.handsSpot, 0.6); this.s.wait(3).then(stop); } return; }
    if (this.phase === 'plate' && this.foods.includes(o) && !o.userData.inPhysics) {
      const y0 = o.position.y;
      this.s.anim(0.9, (_, p) => { o.position.y = y0 + Math.sin(p * Math.PI) * 0.25; }, Ease.inOut).then(() => { o.position.y = y0; });
    }
    if (step >= 2) { const stop = fx.halo(o, o === this.K.fridge ? 1.4 : 0.9); this.s.wait(3).then(stop); }
  }
  demoL3() { this.showHint(false); }
  makeErrorless() {
    if (this.phase === 'wash') { const o = this.stationObj(this.step); if (o) this.addHalo(o, this.step === 'rub' ? 0.6 : 0.9); return; }
    if (this.phase !== 'plate') return;
    for (const f of this.foods) if (!f.userData.placed && this.fits(f)) this.addHalo(f, 0.7);
    if (this.plan.fridge && this.missing().includes('dairy') && !this.fridgeOpen) this.addHalo(this.K.fridge, 1.4);
  }

  // ---------------- the finale: the three friends at the table with their plates ----------------
  creationView() { const v = this.viewFor('table'); return { pos: v.pos, look: v.look, dur: 1.0 }; }
  creationObjects() { return this.seated.map((s) => s.plate).filter(Boolean); }
  onAdmirePoke(obj, i, n) {
    input.press(obj, 140);
    sfx.step(i ?? 0, n || 3, { soft: true });
    const s = this.seated.find((x) => x.plate === obj);
    if (s) this.face('joy', 0.8, s.f);
  }

  // ---------------- every frame ----------------
  update(dt, t) {
    this.K.update(dt, t);
    // the water stops on the paws when they are under it (with a little splash there), else it runs to the floor
    const f = this.friend;
    const onPaws = f && f.userData.atSink && this.phase !== 'plate';
    if (onPaws) { f.updateMatrixWorld(true); this.water.landAt(this.handsMid().add(new T.Vector3(0.05, 0.08, 0))); } else this.water.landAt(null);
    this.water.update(dt, t);
    if (this.water.on) { this.pourT = (this.pourT || 0) + dt; if (this.pourT > 1.3) { this.pourT = 0; sfx.pour(); } }
    // stuck for a while: the hand shows it again, slowly (at ~8 s and once more at ~18 s of no touching)
    if ((this.phase === 'wash' || this.phase === 'plate') && !this.busy && !this.demoing && !input.dragging()) {
      if (this.idle < 0.5) this.reshown = 0;
      else if (this.reshown < 2 && this.idle > [STUCK, STUCK + 10][this.reshown]) { this.reshown++; this.demo(true); }
    }
    for (const c of this.crowd) {
      const u = c.userData, P = u.P, r = u.rest;
      if (u.shadow) { u.shadow.position.set(c.position.x, 0.012, c.position.z + 0.05); u.shadow.visible = c.position.y > -0.2 && !!c.parent; }
      if (u.arms && r.length === 2) {
        u.arms[0].rotation.set(r[0].x + P.armLx, r[0].y, r[0].z + P.armL);
        u.arms[1].rotation.set(r[1].x + P.armRx, r[1].y, r[1].z - P.armR);
        const k = P.stretch || 1;
        if (u.arms[0].scale.y !== k) u.arms.forEach((a) => a.scale.set(1, k, 1));
      }
      if (u.body && u.body !== c && u.body.isBone) u.body.rotation.x = P.lean;
      // the head's own tip (only while posed: otherwise the engine's look-at and pokes own it)
      const h = u.head && u.head.isBone && u.head !== u.body ? u.head : null;
      if (h && (P.head || u.headSet)) { h.rotation.x = P.head || 0; u.headSet = !!P.head; }
    }
    // a carried plate stays in its friend's paws
    for (const s of this.seated) {
      const p = s.plate, h = p?.userData.holder;
      if (!h) continue;
      const ca = h.userData.carryAt;
      h.updateMatrixWorld(true);
      p.position.copy(h.localToWorld(new T.Vector3(0, ca.y / h.scale.x, ca.reach / h.scale.x)));
      p.rotation.y = h.rotation.y;
    }
    // rubbing under the finger: the foam grows as she moves, and a rub counts every ~120 px
    if (this.rubHeld && (this.phase !== 'wash' || this.step !== 'rub')) this.rubHeld = false;
    else if (this.rubHeld) {
      if (this.rubLive > 0) { this.foam.set(Math.min(1, this.foam.level + this.rubLive * 0.08)); this.rubLive = 0; }
      if (!this.busy && this.rubDist > 120) { this.rubDist = 0; this.idle = 0; this.wash('rub'); }
    }
    if (f && f.userData.atSink) {
      const m = this.handsMid();
      this.handsSpot.position.copy(m);
      this.foam.group.position.copy(m).add(new T.Vector3(-0.02, -0.05, 0.05));
      this.foam.group.scale.setScalar(f.scale.x / 1.4);
    }
    this.foam.update(dt, t);
    // the fridge door
    if (this.K.door) this.K.door.rotation.y = 1.5 * this.doorAmt;   // swings open to the right
    // the wash station that is next gently swells and settles (a slow breath, no jiggle); on the rub step, the paws
    const washing = (this.phase === 'wash' || this.phase === 'walk') && this.round % 2 === 0 && !this.busy && !this.queued;
    const jig = washing && this.step !== 'rub' ? this.stationObj(this.step) : null;
    for (const o of [this.K.tap, this.K.soap, this.K.towel]) {
      if (!o || (o === this.K.towel && this.drying)) continue;
      const u = o.userData;
      if (u.s0 == null) u.s0 = o.scale.x;
      u.jigK = (u.jigK || 0) + ((o === jig ? 1 : 0) - (u.jigK || 0)) * Math.min(1, dt * 3);
      o.scale.setScalar(u.s0 * (1 + 0.05 * u.jigK * (0.5 - 0.5 * Math.cos(t * 2.6))));
    }
    const rubGlow = washing && this.phase === 'wash' && this.step === 'rub';
    if (rubGlow && !this.rubHalo) this.rubHalo = fx.halo(this.handsSpot, 0.6);
    else if (!rubGlow && this.rubHalo) { this.rubHalo(); this.rubHalo = null; }
  }
}
