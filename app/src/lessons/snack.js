// Snack chef. Topics mt_F62VTeHB4- "Preparing simple healthy snacks", mt_QhLAeAlHI0 "Balanced diet and food groups",
// mt_EWiY8-opdd "Keeping food safe and clean" and mt_WcfaSfVT33 "One-to-one counting".
// A level is three snacks for three hungry friends in a cosy kitchen. Each snack is two rounds:
//   1. wash hands: the friend walks to the sink and holds out its hands. Level 1: tap the tap and watch (soap, rub,
//      rinse, shake happen by themselves). Level 2: soap → rub → rinse. Level 3: soap → rub → rinse → towel.
//      Doing a step too early gets a gentle "Soap first!".
//   2. make the plate: the friend walks to the plate. Drag (or tap) food onto it; every piece is counted out loud with
//      a big number. Level 1: the three strawberries / bananas / apples from the fruit bowl onto a plain plate.
//      Level 2: one fruit and one veg onto a two-part plate (a second fruit is "We have a fruit! Now a veg!").
//      Level 3: one food from each group onto a four-part plate; fruit must be washed in the sink first, and the
//      dairy food is in the fridge (tap it open; it shuts again to keep things cold).
//   Then the friend eats it all up, chomp by chomp, and walks off; the next friend walks in.
import * as T from '../three.js';
import { Lesson } from '../engine/lesson.js';
import { makeAnimal, setFace, popIn, popOut, hop } from '../engine/actors.js';
import { makeCreature, hasCreature } from '../engine/creature.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { project, setCamera } from '../engine/stage.js';
import { physics } from '../engine/physics.js';
import { Ease } from '../engine/tween.js';
import { FOOD, GROUPS, PLANS, NUM_COL, makeFood } from './snack-foods.js';
import { makeKitchen, makePlate, SINK, BASIN_FLOOR, PLATE, LANE_Z, BOWL, BOARD, FRIDGE, FRIDGE_SHELVES, TOP } from './snack-kitchen.js';
import { makeWater, makeFoam, bubbles, droplets, dollop } from './snack-wash.js';

const CAM = { pos: new T.Vector3(-0.6, 5.5, 12.9), look: new T.Vector3(-0.6, 2.05, -0.6) };
const FS = { bear: 1.56, bunny: 1.48, pig: 1.56, cat: 1.54, frog: 1.45, monkey: 1.43 };   // friend scales (similar heights)
const ENTER = new T.Vector3(-10.8, 0, LANE_Z);
const AT_SINK = new T.Vector3(SINK.x, 0, LANE_Z);
const AT_PLATE = new T.Vector3(PLATE.x, 0, LANE_Z);
const EXIT = [new T.Vector3(4.9, 0, LANE_Z), new T.Vector3(11, 0, 0.6)];   // round the counter end, in front of the fridge
const WALK = 3.4;                                       // walking speed (units / s)
const SAY = {
  tap: 'Wash hands first! Tap the tap!', soap: 'Wash hands first! Tap the soap!', rub: 'Rub rub rub!',
  rinse: 'Now rinse! Tap the tap!', dry: 'Dry with the towel!',
};
const EARLY = { soap: 'Soap first!', rub: 'Rub the soap first!', rinse: 'Rinse first!', dry: 'Dry hands now!' };
const ASK = { fruit: 'a fruit', veg: 'a veg', grain: 'bread', dairy: 'milk or cheese' };
const HAVE = { fruit: 'a fruit', veg: 'a veg', grain: 'bread', dairy: 'dairy' };
const BOWL_SPOTS = [[-0.3, -0.12], [0.3, -0.12], [0.0, 0.26]];
const BOARD_SPOTS = [-0.42, 0.42];

function newPose() { return { armL: 0, armR: 0, armLx: 0, armRx: 0, lean: 0, y: 0 }; }
const HX = -1.25, HZ = -0.85;                         // hands held out over the basin: forward, and in together
const bump = (p) => Math.sin(Math.PI * Math.min(1, Math.max(0, p)));

export default class SnackLesson extends Lesson {
  get totalRounds() { return (this.plan || PLANS[this.level] || PLANS[0]).snacks.length * 2; }
  build() {
    this.plan = PLANS[this.level] || PLANS[0];
    this.meadow.visible = false;
    setCamera(CAM.pos, CAM.look);
    const K = (this.K = makeKitchen(this.plan.look));
    this.root.add(K.group);
    // Pip watches from the floor in front of the fridge
    this.pip.position.set(4.7, 0, 2.7);
    this.pip.rotation.y = -0.55;
    // static colliders: the worktop, the inside of the fruit bowl and the sink basin
    // (the worktop in four pieces round the sink hole)
    const wt = (x0, x1, z0, z1) => physics.box(new T.Vector3((x0 + x1) / 2, TOP - 0.3, (z0 + z1) / 2), new T.Vector3(x1 - x0, 0.6, z1 - z0));
    wt(SINK.x + 0.68, 4.45, -1.175, 1.175); wt(-7.25, SINK.x - 0.68, -1.175, 1.175);
    wt(SINK.x - 0.68, SINK.x + 0.68, SINK.z + 0.51, 1.175); wt(SINK.x - 0.68, SINK.x + 0.68, -1.175, SINK.z - 0.51);
    physics.container(new T.Vector3(BOWL.x, TOP + 0.2, BOWL.z), { r: 0.68, h: 0.32 });
    physics.container(new T.Vector3(SINK.x, BASIN_FLOOR, SINK.z), { r: 0.42, h: 0.42 });
    // Levels 1-2: the fridge just holds a few dairy things to peek at (Level 3 restocks it for each snack)
    if (!this.plan.fridge) ['milk', 'cheese', 'yogurt'].forEach((kind, i) => {
      const f = makeFood(kind);
      if (!f) return;
      f.position.set(FRIDGE.x + [-0.4, 0.35, 0.3][i], FRIDGE_SHELVES[i ? 1 : 0] + f.userData.h / 2, FRIDGE.z + 0.05);
      this.root.add(f);
    });
    // the plate for this level
    this.plate = makePlate(this.plan.plate);
    if (this.plate) { this.plate.position.copy(PLATE); this.root.add(this.plate); }
    // the water, the foam on the hands and the tap targets
    this.water = makeWater(K.spout, BASIN_FLOOR);
    this.root.add(this.water.group);
    this.foam = makeFoam();
    this.root.add(this.foam.group);
    this.handsSpot = new T.Object3D();
    this.root.add(this.handsSpot);
    const st = (obj, name, radius, off) => obj && input.addTap(obj, { radius, offset: off, onTap: () => this.station(name) });
    this.taps = {
      tap: st(K.tap, 'tap', 0.75, new T.Vector3(0.4, 0.55, 0)),
      soap: st(K.soap, 'soap', 0.6, new T.Vector3(0, 0.4, 0)),
      towel: st(K.towel, 'towel', 0.6, new T.Vector3(0, -0.4, 0.05)),
      hands: input.addTap(this.handsSpot, { radius: 0.75, onTap: () => this.station('hands') }),
      fridge: st(K.fridge, 'fridge', 1.2, new T.Vector3(0, 2.3, 0.6)),
    };
    this.foods = [];          // this snack's choices (on the counter / in the fridge)
    this.onPlate = [];
    this.leftovers = [];
    this.crowd = new Set();   // the friends in the kitchen (one washing / eating, one maybe walking off)
    this.phase = 'idle';
    this.step = null;
    this.doorAmt = 0;
    this.fridgeOpen = false;
  }

  // ---------------- the friend ----------------
  get snack() { return this.plan.snacks[Math.floor(this.round / 2)] || this.plan.snacks[this.plan.snacks.length - 1]; }
  makeFriend(kind) {
    const f = kind === 'monkey' || !['bear', 'bunny', 'cat', 'frog', 'pig'].includes(kind) ? (hasCreature(kind) ? makeCreature(kind) : makeAnimal('bear')) : makeAnimal(kind);
    const k = FS[kind] || 1.4;
    f.scale.setScalar(k);
    f.userData.baseScale = k;
    f.position.copy(ENTER);
    f.rotation.y = Math.PI / 2;
    this.root.add(f);
    const u = f.userData;
    // rest pose of the arms, and each hand in its arm bone's frame (from the hand anchors)
    f.updateMatrixWorld(true);
    // every friend keeps its own pose (P), so one eating and leaving never moves the next one's arms
    u.rest = (u.arms || []).map((b) => b.rotation.clone());
    u.handLocal = (u.arms || []).map((b, i) => {
      const a = u.anchors[i ? 'handR' : 'handL'];
      const w = a ? f.localToWorld(new T.Vector3(a[0], a[1], a[2])) : b.localToWorld(new T.Vector3(0, 0.6, 0));
      return b.worldToLocal(w);
    });
    u.P = newPose();
    this.crowd.add(f);
    return f;
  }
  get P() { return this.friend ? this.friend.userData.P : (this._noP || (this._noP = newPose())); }
  hand(i, f = this.friend) {
    const u = f?.userData;
    if (!u?.arms) return f ? f.localToWorld(new T.Vector3(0, 1.0, 0.7)) : new T.Vector3();
    return u.arms[i].localToWorld(u.handLocal[i].clone());
  }
  // where the celebration confetti pops: low on the worktop off to the friend's right, so it fans up beside them
  // instead of raining over their face
  besideFriend(p) { return new T.Vector3(p.x + 2.1, TOP + 0.35, Math.max(p.z, 0) + 0.7); }
  handsMid(f = this.friend) { return this.hand(0, f).add(this.hand(1, f)).multiplyScalar(0.5); }
  mouth(f = this.friend) {
    const a = f.userData.anchors.mouth;
    return a ? f.localToWorld(new T.Vector3(a[0], a[1], a[2] + 0.1)) : f.localToWorld(new T.Vector3(0, 1.6, 0.6));
  }
  face(emo, back = 0.7, f = this.friend) {
    const fc = f?.userData.face;
    if (!fc) return;
    setFace(fc, emo);
    if (back) this.s.wait(back).then(() => { if (fc.userData.emotion === emo) setFace(fc, 'happy'); });
  }
  // walk along points (ground), turning to face the way it goes, then turn to face us
  async walk(f, pts, speed = WALK) {
    for (const to of pts) {
      const from = f.position.clone();
      const d = from.distanceTo(to);
      if (d < 0.01) continue;
      const yaw = Math.atan2(to.x - from.x, to.z - from.z), r0 = f.rotation.y;
      let dy = yaw - r0; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2;
      await this.s.anim(d / speed, (e, p) => {
        f.position.lerpVectors(from, to, e);
        f.rotation.y = r0 + dy * Math.min(1, p * 4);
      }, Ease.inOut);
    }
  }
  async turnFront(f, dur = 0.25) {
    const r0 = f.rotation.y;
    await this.s.anim(dur, (e) => { f.rotation.y = r0 * (1 - e); }, Ease.out);
  }
  pose(dur, fn, f = this.friend) { const P = f ? f.userData.P : newPose(); return this.s.anim(dur, (_, p) => fn(p, P)); }

  // ---------------- rounds ----------------
  async startRound(r) {
    this.busy = true;
    const plan = this.plan, snack = this.snack;
    if (r % 2 === 0) {
      // a new snack: a friend walks in to the sink, the food for its plate appears
      this.phase = 'walk';
      this.clearPlate();
      this.restock(snack);
      this.friend = this.makeFriend(snack.friend);
      this.scanChars();
      this.step = plan.wash[0];
      await this.walk(this.friend, [AT_SINK], 4.2);
      if (this.dead) return;
      this.turnFront(this.friend);
      // hands out over the basin
      await this.pose(0.3, (p, P) => { P.armLx = P.armRx = HX * p; P.armL = P.armR = HZ * p; P.lean = 0.24 * p; });
      this.phase = 'wash';
      this.busy = false;
      this.idle = 0;
      if (r === 0 && !this.demoDone) this.cue(); else this.prompt();
    } else {
      // plate time: the friend walks over to the plate
      this.phase = 'walk';
      Object.assign(this.P, newPose());
      await this.walk(this.friend, [AT_PLATE], 4.2);
      if (this.dead) return;
      await this.turnFront(this.friend);
      this.phase = 'plate';
      this.busy = false;
      this.idle = 0;
      this.face('scared', 0.5);   // "ooh, food!"
      this.prompt();
    }
  }
  plateText() {
    const s = this.snack;
    if (!this.plan.want) return `Put 3 ${FOOD[s.foods[0]].many} on the plate!`;
    if (this.plan.want.length === 2) return 'A fruit and a veg, please!';
    return 'One of each, please!';
  }
  promptText() {
    if (this.phase === 'wash' || (this.phase === 'walk' && this.round % 2 === 0)) return SAY[this.step] || '';
    if (this.phase !== 'plate') return this.plateText();
    // what is still missing
    const miss = this.missing();
    if (!this.plan.want) return this.plateText();
    if (!miss.length) return '';
    if (this.plan.washFruit && miss.includes('fruit') && this.foods.some((f) => f.userData.group === 'fruit' && !f.userData.washed && !f.userData.placed)) {
      if (miss.length === 1) return 'Wash a fruit in the sink!';
    }
    if (miss.length === 1) return miss[0] === 'dairy' && this.plan.fridge ? 'Now milk or cheese! Look in the fridge!' : `Now ${ASK[miss[0]]}!`;
    return this.plateText();
  }

  // ---------------- food on the counter ----------------
  restock(snack) {
    // last snack's leftovers hop off the counter (back into the cupboard)
    for (const f of this.foods) if (!f.userData.placed) this.leftovers.push(f);
    this.foods = [];
    for (const f of this.leftovers) this.removeFood(f);
    this.leftovers = [];
    let fruitI = 0, boardI = 0;
    snack.foods.forEach((kind, i) => {
      const f = makeFood(kind);
      if (!f) return;
      const u = f.userData;
      if (u.group === 'fruit') {
        const [dx, dz] = BOWL_SPOTS[fruitI++ % 3];
        u.where = 'bowl';
        // fruit drops into the bowl one after another, tumbles and settles there (real physics)
        const spot = new T.Vector3(BOWL.x + dx, TOP + 0.25 + u.h / 2, BOWL.z + dz);
        f.position.set(spot.x, spot.y + 0.9, spot.z);
        f.rotation.set(0, Math.random() * 6, 0);
        u.home = spot;
        this.root.add(f);
        f.visible = false;
        this.s.wait(0.12 + fruitI * 0.22).then(() => {
          if (this.dead || u.placed || !f.parent || u.picked) return;
          f.visible = true;
          u.inPhysics = true;
          physics.add(f, { r: Math.max(0.2, Math.min(u.h, u.r * 2) * 0.45), bounce: 0.12, friction: 0.9, rot: [false, true, false] });
          return this.wait(1.1);
        }).then(() => {
          // anything that bounced out hops back into the bowl
          if (this.dead || u.placed || u.picked || !u.inPhysics) return;
          const d = Math.hypot(f.position.x - BOWL.x, f.position.z - BOWL.z);
          if (d < 0.75 && f.position.y > TOP) return;
          physics.remove(f); u.inPhysics = false;
          const a = f.position.clone();
          this.s.anim(0.35, (e, p) => { f.position.lerpVectors(a, spot, e); f.position.y += Math.sin(p * Math.PI) * 0.6; }, Ease.out).then(() => sfx.land());
        });
      } else {
        u.where = 'board';
        const x = BOARD.x + BOARD_SPOTS[boardI++ % 2];
        f.position.set(x, TOP + 0.1 + u.h / 2, BOARD.z);
        u.home = f.position.clone();
        this.root.add(f);
        popIn(this.s, f, 1, 0.4, { sound: true });
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
    this.s.anim(0.3, (e, p) => { f.position.set(a.x, a.y + Math.sin(p * Math.PI) * 0.5, a.z); f.scale.setScalar(Math.max(0.01, k * (1 - e))); }, Ease.in)
      .then(() => { this.root.remove(f); });
  }
  zonesFor(f) {
    const z = [{ id: 'plate', pos: PLATE.clone().add(new T.Vector3(0, 0.3, 0)), radius: 1.35 }];
    if (this.plan.washFruit && f.userData.group === 'fruit') z.push({ id: 'sink', pos: SINK.clone().add(new T.Vector3(0, 0.1, 0)), radius: 0.9 });
    return z;
  }
  pickFood(f) {
    const u = f.userData;
    if (u.inPhysics) { physics.remove(f); u.inPhysics = false; }
    if (!u.picked) u.home = f.position.clone();
    u.picked = true;
    f.quaternion.identity();
    this.s.stop(f.scale);
    this.s.tween(f.scale, { x: 1.15, y: 1.15, z: 1.15 }, 0.15, Ease.back);
    if (this.phase === 'plate') this.face('scared', 0.6);
  }
  goBack(f) {
    const u = f.userData;
    u.busy = true;
    if (u.drag) u.drag.enabled = false;
    const a = f.position.clone(), b = u.home || a;
    return this.s.anim(0.38, (e, p) => { f.position.lerpVectors(a, b, e); f.position.y += Math.sin(p * Math.PI) * 0.7; f.scale.setScalar(1.15 - 0.15 * e); }, Ease.out)
      .then(() => { sfx.land(); u.busy = false; u.picked = false; if (u.drag && (u.where !== 'fridge' || this.fridgeOpen)) u.drag.enabled = true; });
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
    if (u.busy || u.placed) return;
    if (this.phase !== 'plate' || this.busy || this.dead) {
      this.goBack(f);
      if (this.phase === 'wash' && !this.busy) { this.say('Wash hands first!', { max: 1.2 }); this.nudge(1); }
      return;
    }
    if (!zone && !tapped) { this.goBack(f); return; }
    const where = zone ? zone.id : (this.needsWash(f) ? 'sink' : 'plate');
    if (where === 'sink') { this.washFood(f); return; }
    if (!this.fits(f)) {
      this.goBack(f);
      const miss = this.missing();
      this.face('calm', 0.8);
      this.redirect(`We have ${HAVE[u.group]}! Now ${ASK[miss[0]] || 'eat'}!`);
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

  // where a food goes on the plate (world), by level
  slotFor(f) {
    const P = this.plate, k = P?.userData.k || 1.15;
    const y = TOP + (P?.userData.floor || 0.1) + f.userData.h / 2 * this.plateScale();
    if (!this.plan.want) {
      const i = this.onPlate.length;
      const S = [[-0.48, -0.18], [0.48, -0.18], [0, 0.42]][i % 3];
      return new T.Vector3(PLATE.x + S[0], y, PLATE.z + S[1]);
    }
    const G = GROUPS[f.userData.group];
    const sec = this.plan.want.length === 2 ? G.sec2 : G.sec4;
    return new T.Vector3(PLATE.x + sec[0] * k, y, PLATE.z + sec[1] * k);
  }
  plateScale() { return this.plan.want && this.plan.want.length === 4 ? 0.9 : 1; }
  async placeOnPlate(f) {
    const u = f.userData;
    u.busy = true;
    u.placed = true;
    input.remove(u.drag);
    physics.remove(f);
    u.inPhysics = false;
    const to = this.slotFor(f);
    this.onPlate.push(f);
    this.clearHints();
    this.idle = 0;
    const a = f.position.clone(), k0 = f.scale.x, q0 = f.quaternion.clone(), qi = new T.Quaternion();
    const ks = this.plateScale();
    sfx.swoosh();
    await this.s.anim(0.34, (e, p) => {
      f.position.lerpVectors(a, to, e);
      f.position.y += Math.sin(p * Math.PI) * 0.9;
      f.scale.setScalar(k0 + (ks - k0) * e);
      f.quaternion.slerpQuaternions(q0, qi, e);
    }, Ease.out);
    f.quaternion.identity();
    // land: a squash, a sound and the count
    sfx.land();
    this.s.anim(0.22, (_, p) => { const q = 1 - 0.25 * Math.sin(p * Math.PI); f.scale.set(ks / Math.sqrt(q), ks * q, ks / Math.sqrt(q)); }).then(() => f.scale.setScalar(ks));
    const n = this.onPlate.length;
    sfx.note(n - 1);
    // the count rises beside the plate (in the open, not over the friend's face)
    fx.float(to.clone().add(new T.Vector3(1.6, 0.35, 0.9)), String(n), { color: NUM_COL[(n - 1) % NUM_COL.length], size: 9 });
    this.face('joy', 0.6);
    hop(this.s, this.friend, 0.25, 0.3);
    if (u.where === 'fridge') this.shutFridge();
    if (this.complete()) {
      this.phase = 'done';
      await this.wait(0.25);
      this.success(this.besideFriend(this.plate.position), this.doneText());
    }
  }
  complete() { return this.plan.want ? this.missing().length === 0 : this.onPlate.length >= 3; }
  doneText() {
    if (!this.plan.want) return `${this.onPlate.length} ${FOOD[this.onPlate[0].userData.food].many}!`;
    if (this.plan.want.length === 2) return 'A fruit and a veg!';
    return 'A healthy plate!';
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
    droplets(this.s, this.root, new T.Vector3(SINK.x, TOP + 0.1, SINK.z), 10);
    physics.poke(f, 0.35);
    await this.wait(0.5);
    this.setTap(false);
    physics.remove(f);
    u.washed = true;
    sfx.sparkle();
    const sc = project(f.position.clone().add(new T.Vector3(0, 0.4, 0)));
    fx.sparkle(sc.x, sc.y);
    fx.float(f.position.clone().add(new T.Vector3(0, 0.9, 0)), '✨', { color: '#5ab4ff', size: 6 });
    this.say('Clean fruit!', { max: 1 });
    await this.wait(0.15);
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
    if (this.phase !== 'wash' || this.busy) {
      // a friendly jiggle, nothing else
      const o = { tap: this.K.tap, soap: this.K.soap, towel: this.K.towel }[name];
      if (o) { sfx.bloop(2); const y0 = o.position.y; this.s.anim(0.3, (_, p) => { o.position.y = y0 + Math.sin(p * Math.PI) * 0.12; }).then(() => { o.position.y = y0; }); }
      if (name === 'hands' && this.friend) this.face('joy', 0.5);
      return;
    }
    const step = { tap: this.step === 'tap' ? 'tap' : 'rinse', hands: 'rub', towel: 'dry', soap: 'soap' }[name];
    return this.wash(step);
  }
  async tapFridge() {
    const can = this.plan.fridge && this.phase === 'plate' && !this.busy && this.missing().includes('dairy');
    if (this.fridgeOpen || this.fridgeBusy) return;
    if (can) return this.openFridge();
    // a peek: open, "brr!", shut
    this.fridgeBusy = true;
    sfx.swoosh();
    await this.swingDoor(1, 0.35);
    fx.float(FRIDGE.clone().add(new T.Vector3(0, 3.0, 1.4)), '❄', { color: '#7fc8ff', size: 6 });
    await this.wait(0.5);
    await this.swingDoor(0, 0.3);
    sfx.thunk();
    this.fridgeBusy = false;
  }
  async openFridge() {
    if (this.fridgeOpen) return;
    this.fridgeOpen = true;
    this.clearHints();
    sfx.swoosh();
    await this.swingDoor(1, 0.4);
    sfx.twinkle();
    for (const f of this.foods) if (f.userData.where === 'fridge' && !f.userData.placed) { f.userData.drag.enabled = true; hop(this.s, f, 0.2, 0.3); }
  }
  shutFridge() {
    if (!this.fridgeOpen) return;
    this.fridgeOpen = false;
    for (const f of this.foods) if (f.userData.where === 'fridge' && f.userData.drag) f.userData.drag.enabled = false;
    this.s.wait(0.3).then(() => this.swingDoor(0, 0.3)).then(() => { sfx.thunk(); });
  }
  swingDoor(to, dur) {
    const from = this.doorAmt;
    return this.s.anim(dur, (e) => { this.doorAmt = from + (to - from) * e; }, to > from ? Ease.back : Ease.in);
  }

  // ---------------- washing hands ----------------
  setTap(on) {
    this.water.set(on);
    const h = this.K.handle;
    if (h) { const r0 = h.rotation.y; this.s.anim(0.2, (e) => { h.rotation.y = r0 + ((on ? 1.4 : 0) - r0) * e; }); }
    if (on) { sfx.pour(); this.pourT = 0; }
  }
  // do (or try) a wash step: 'tap' (Level 1 does the lot), 'soap', 'rub', 'rinse', 'dry'
  async wash(what) {
    if (this.phase !== 'wash' || this.busy || this.dead) return;
    const want = this.step;
    if (what !== want) {
      if (!this.plan.wash.includes(what)) return;
      this.face('calm', 0.6);
      this.redirect(EARLY[want] || SAY[want]);
      return;
    }
    this.busy = true;
    this.idle = 0;
    this.clearHints();
    fx.clearHands();
    if (want === 'tap') await this.washAll();
    else if (want === 'soap') await this.doSoap();
    else if (want === 'rub') { await this.doRub(); if ((this.rubs || 0) < 3) { this.busy = false; return; } }
    else if (want === 'rinse') await this.doRinse();
    else if (want === 'dry') await this.doDry();
    if (this.dead) return;
    const i = this.plan.wash.indexOf(want);
    const next = this.plan.wash[i + 1];
    if (next) {
      this.step = next;
      this.busy = false;
      this.idle = 0;
      this.prompt();
      return;
    }
    // all clean!
    this.step = null;
    this.phase = 'done';
    sfx.sparkle();
    const m = this.handsMid();
    const sc = project(m);
    fx.sparkle(sc.x, sc.y);
    this.face('joy', 0.9);
    this.busy = false;
    this.success(this.besideFriend(m), 'Clean hands!');
  }
  async doSoap() {
    const pump = this.K.pump;
    sfx.squeak();
    if (pump) this.s.anim(0.3, (_, p) => { pump.position.y = (pump.userData.y0 ?? (pump.userData.y0 = pump.position.y)) - bump(p) * 0.1; });
    const from = this.K.soap.localToWorld(new T.Vector3(0.22, 0.6, 0));
    await this.wait(0.1);
    await dollop(this.s, this.root, from, this.handsMid());
    sfx.bubble();
    this.foam.set(0.3);
    this.face('joy', 0.5);
    await this.wait(0.15);
    this.rubs = 0;
  }
  // one rub: the hands go round each other and the foam grows (three rubs = all soapy)
  async doRub() {
    this.rubs = (this.rubs || 0) + 1;
    sfx.scrub(); this.s.wait(0.12).then(() => sfx.scrub());
    bubbles(this.s, this.root, this.handsMid(), 3);
    this.foam.set(0.3 + this.rubs * 0.24);
    this.giggle();
    await this.rubAnim(0.36);
  }
  rubAnim(dur, k = 1) {
    return this.pose(dur, (p, P) => {
      const w = Math.sin(p * Math.PI * 4);
      P.armL = HZ - 0.15 * k * w; P.armR = HZ + 0.15 * k * w;
      P.armLx = HX + 0.15 * k * w; P.armRx = HX - 0.15 * k * w;
    }).then(() => { const P = this.P; P.armL = P.armR = HZ; P.armLx = P.armRx = HX; });
  }
  giggle() { if (Math.random() < 0.5) sfx.giggle(); this.face('joy', 0.4); }
  async doRinse() {
    this.setTap(true);
    await this.wait(0.15);
    // the bubbles wash away under the water
    const f0 = this.foam.level;
    const rub = this.rubAnim(0.8, 0.7);
    await this.s.anim(0.8, (_, p) => { this.foam.set(f0 * (1 - p)); if (Math.random() < 0.15) bubbles(this.s, this.root, this.handsMid(), 1); });
    await rub;
    this.foam.set(0);
    this.setTap(false);
    await this.shake();
  }
  async shake() {
    sfx.boing2();
    const m = this.handsMid();
    droplets(this.s, this.root, m, 8);
    this.s.wait(0.2).then(() => droplets(this.s, this.root, this.handsMid(), 6));
    await this.pose(0.45, (p, P) => { const w = Math.sin(p * Math.PI * 8) * bump(p); P.armL = HZ + 0.4 * w; P.armR = HZ - 0.4 * w; P.armLx = P.armRx = HX; });
  }
  async doDry() {
    const t = this.K.towel;
    if (!t) return;
    const a = t.position.clone(), r0 = t.rotation.clone();
    const to = this.handsMid().add(new T.Vector3(0, 0.12, 0.4));
    sfx.whoosh();
    await this.s.anim(0.3, (e, p) => { t.position.lerpVectors(a, to, e); t.position.y += Math.sin(p * Math.PI) * 0.6; }, Ease.out);
    sfx.rustle();
    this.giggle();
    const rub = this.rubAnim(0.55, 1);
    await this.s.anim(0.55, (_, p) => { t.rotation.z = Math.sin(p * Math.PI * 6) * 0.25; t.position.x = to.x + Math.sin(p * Math.PI * 6) * 0.12; });
    await rub;
    sfx.swoosh();
    await this.s.anim(0.3, (e, p) => { t.position.lerpVectors(to, a, e); t.position.y += Math.sin(p * Math.PI) * 0.6; t.rotation.z = 0; }, Ease.inOut);
    t.position.copy(a); t.rotation.copy(r0);
    sfx.land();
  }
  // Level 1: one tap and the friend does the whole wash by itself (soap, rub, rinse, shake)
  async washAll() {
    this.setTap(true);
    await this.wait(0.3);
    this.setTap(false);
    await this.doSoap();
    for (let i = 0; i < 2; i++) { await this.doRub(); }
    this.foam.set(1);
    await this.doRinse();
  }

  // ---------------- eating ----------------
  async afterSuccess() {
    if (this.round % 2 === 1) return;          // the wash round just ended: off to the plate (next round)
    // the plate round just ended: the friend eats it all up, then waves and walks off - while the next friend
    // already walks in at the other end (the last snack is eaten before the sticker)
    const f = this.friend, foods = this.onPlate.slice();
    this.onPlate = [];
    this.friend = null;
    this.phase = 'eat';
    const done = this.eatAndGo(f, foods);
    if (this.round >= this.totalRounds) await done; else await this.wait(0.45);
  }
  async eatAndGo(f, foods) {
    await this.pose(0.2, (p, P) => { P.lean = 0.2 * p; }, f);
    for (const food of foods) {
      const a = food.position.clone(), m = this.mouth(f), k = food.scale.x;
      this.s.anim(0.28, (e, p) => {
        food.position.lerpVectors(a, m, e);
        food.position.y += Math.sin(p * Math.PI) * 0.5;
        food.scale.setScalar(Math.max(0.01, k * (1 - e * 0.7)));
      }, Ease.in).then(() => {
        sfx.chomp();
        this.face('joy', 0.5, f);
        this.root.remove(food);
      });
      await this.wait(0.15);
    }
    await this.wait(0.2);
    sfx.mmm();
    fx.float(this.mouth(f).add(new T.Vector3(0, 0.8, 0.3)), 'Yum!', { color: '#ff7a3d', size: 7 });
    Object.assign(f.userData.P, newPose());
    // wave bye-bye and walk off round the end of the counter
    this.pose(0.6, (p, P) => { P.armR = 2.3 * bump(p) + Math.sin(p * Math.PI * 6) * 0.3 * bump(p); }, f);
    this.wait(0.3).then(() => this.walk(f, EXIT)).then(() => { this.crowd.delete(f); this.root.remove(f); });
  }
  clearPlate() { this.onPlate = []; }

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
    const ok = this.foods.filter((f) => !f.userData.placed && !f.userData.busy && this.fits(f));
    return ok.find((f) => f.userData.where !== 'fridge') || ok[0] || null;
  }
  showHint(glow = true) {
    if (this.phase === 'wash' || (this.phase === 'walk' && this.round % 2 === 0)) {
      const o = this.stationObj(this.step);
      if (this.step === 'rub') { fx.ghostPath([this.handsMid(), this.handsMid().add(new T.Vector3(0.5, 0, 0)), this.handsMid()], { mode: 'drag' }); return; }
      if (!o) return;
      if (glow) this.addHalo(o, 0.8);
      const p = o.getWorldPosition(new T.Vector3());
      p.y += this.step === 'dry' ? -0.3 : 0.6;
      fx.ghostPath([p], { mode: 'tap' });
      return;
    }
    const f = this.bestFood();
    if (!f) return;
    if (glow) this.addHalo(f, 0.7);
    const from = f.position.clone().add(new T.Vector3(0, 0.4, 0));
    const to = this.needsWash(f) ? SINK.clone().add(new T.Vector3(0, 0.3, 0)) : PLATE.clone().add(new T.Vector3(0, 0.3, 0));
    fx.ghostPath([from, to], { mode: 'drag' });
  }
  demoL3() { this.showHint(false); }
  makeErrorless() {
    if (this.phase === 'wash') { const o = this.stationObj(this.step); if (o) this.addHalo(o, 0.9); return; }
    if (this.phase !== 'plate') return;
    for (const f of this.foods) if (!f.userData.placed && this.fits(f)) this.addHalo(f, 0.7);
    if (this.plan.fridge && this.missing().includes('dairy') && !this.fridgeOpen) this.addHalo(this.K.fridge, 1.4);
  }

  // ---------------- every frame ----------------
  update(dt, t) {
    this.K.update(dt, t);
    this.water.update(dt, t);
    if (this.water.on) { this.pourT = (this.pourT || 0) + dt; if (this.pourT > 0.6) { this.pourT = 0; sfx.pour(); } }
    for (const c of this.crowd) {
      const u = c.userData, P = u.P, r = u.rest;
      if (u.arms && r.length === 2) {
        u.arms[0].rotation.set(r[0].x + P.armLx, r[0].y, r[0].z + P.armL);
        u.arms[1].rotation.set(r[1].x + P.armRx, r[1].y, r[1].z - P.armR);
      }
      if (u.body && u.body !== c && u.body.isBone) u.body.rotation.x = P.lean;
    }
    const f = this.friend;
    if (f) {
      f.updateMatrixWorld(true);
      const m = this.handsMid();
      this.handsSpot.position.copy(m);
      this.foam.group.position.copy(m).add(new T.Vector3(0, 0.05, 0.05));
      this.foam.group.scale.setScalar(f.scale.x / 1.4);
    }
    this.foam.update(dt, t);
    // the fridge door
    if (this.K.door) this.K.door.rotation.y = 1.5 * this.doorAmt;   // swings open to the right
    // the wash station that is next gives a little jiggle every couple of seconds
    const jig = this.phase === 'wash' && !this.busy ? this.stationObj(this.step) : null;
    for (const o of [this.K.tap, this.K.soap, this.K.towel]) {
      if (!o) continue;
      if (o === jig) { const ph = t % 2.4; o.rotation.z = ph < 0.4 ? Math.sin(ph / 0.4 * Math.PI * 3) * 0.05 * (1 - ph / 0.4) : 0; o.userData.jig = true; }
      else if (o.userData.jig) { o.rotation.z = 0; o.userData.jig = false; }
    }
  }
}
