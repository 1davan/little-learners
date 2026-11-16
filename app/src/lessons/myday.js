// My day (World 4: Home). Topics mt_vbbxnY7ZDT "Keeping clean and healthy", mt_2eVg4Tt5r0 "Keeping up a healthy
// routine" and mt_-vvVxpOHG2 "Ordering events in time".
// Bunny (a toddler stand-in) lives in a little doll's house: a bathroom on the left, a bedroom on the right. Each round
// is one real routine and the child does every step for Bunny, in order: turn on the tap, rub soap on the paws, rinse,
// dry with the towel; toothpaste on the brush, brush brush brush, rinse with the cup; a tissue for a sneeze, then the
// bin, then wash hands; fill the bath, pour in bubbles, sponge, towel; brush the fluffy ears; wake up, open the
// curtains, make the bed; close the curtains, cuddle Teddy, tuck in, lights off. Bunny walks between rooms (the camera
// follows), sits in the bath, climbs into bed. Rubbing builds foam you can see on the paws; bubbles float up and pop.
// Level 1: the bathroom on a sunny day, one routine per round, the thing to use glows.
// Level 2: a morning in order (wake up in the bedroom, make the bed, then the bathroom), a nudge only when stuck.
// Level 3: the evening - nothing glows, the child picks what comes next (a wrong pick gets "The tap first!"), and
// the day ends with bedtime and lights off.
//
// Test hooks: phase ('step' while waiting for the child), want() (key of the thing this step needs), act(key) (use
// that thing for this step: the right one plays the step, a wrong one gets a gentle redirect), items (all keys).
import * as T from '../three.js';
import { Lesson } from '../engine/lesson.js';
import { setFace, popIn, popOut, makeAnimal } from '../engine/actors.js';
import { propModel, propAnchor } from '../engine/prop-models.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { physics } from '../engine/physics.js';
import { project, screenRadius, setCamera, scene } from '../engine/stage.js';
import { Ease } from '../engine/tween.js';
import { makeHouse, makeItems, viewTex, CAMS, SPOTS, SINK, BATH, BED, STOOL_TOP } from './myday-house.js';
import { ROUTINES, PLANS, NEED } from './myday-plans.js';
import { makeStream, makeFoam, makeSoapBubble, makeDrop, makeMess, setMessLook, makeZ, makeTwinkle } from './myday-fx.js';

const BS = 1.45;                                   // Bunny's scale
const DRAG_Z = 0.9;                                // things are carried in this plane, in front of the furniture
const TAP_THINGS = ['tap', 'bathtap', 'clock', 'drapes', 'lamp'];
const ROOM_OF = { tap: 'bath', bathtap: 'bath', soap: 'bath', cup: 'bath', brush: 'bath', paste: 'bath', towel: 'bath', bigtowel: 'bath',
  sponge: 'bath', bottle: 'bath', tissue: 'bath', hairbrush: 'bath', clock: 'bed', drapes: 'bed', lamp: 'bed', duvet: 'bed', teddy: 'bed' };
const LIE = { pos: new T.Vector3(BED.x + 1.05, 1.95, BED.z + 0.05), rz: Math.PI / 2 };   // lying in bed, head on the pillow
const DUVET = {
  made: { p: [BED.x + 0.5, 1.05, BED.z], r: [0, 0, 0], s: [1, 1, 1] },
  over: { p: [BED.x + 0.75, 1.0, BED.z + 0.05], r: [0, 0, 0], s: [1.02, 3.6, 1.06] },
  floor: { p: [5.5, 0.02, 0.35], r: [0.08, 0.45, 0.06], s: [0.5, 2.0, 0.55] },
  folded: { p: [BED.x + 1.95, 1.05, BED.z], r: [0, 0, 0], s: [0.32, 2.4, 1.0] },
};

// how a thing is held while carried, and its business end (wrapper-local) - the brush head goes to the mouth
const CARRY = {
  brush: { rot: [0.1, Math.PI, 0.25], tip: [0.44, 0.16, 0] },
  paste: { rot: [Math.PI / 2, 0, -0.2, 'ZYX'] },
  hairbrush: { rot: [0, 0, Math.PI / 2 - 0.3], tip: [0.26, 0, 0.07] },
  teddy: { rot: [0, 0, 0] },
  tissue: { rot: [0, 0, 0] },
};
const newPose = () => ({ armX: 0, armIn: 0, rub: 0, headX: 0, headY: 0, headZ: 0, lean: 0, tilt: 0, sq: 1 });
const bump = (p) => Math.sin(Math.PI * Math.min(1, Math.max(0, p)));

export default class MydayLesson extends Lesson {
  build() {
    this.plan = PLANS[this.level] || PLANS[0];
    this.need = NEED[this.level];
    this.meadow.visible = false;
    const h = (this.house = makeHouse(this.level));
    this.root.add(h.group);
    this.it = makeItems(h, this.level);
    // tap things: the sink tap and the bath tap (chrome cross handles), the clock, the curtains, the lamp
    const knob = (prop) => { const k = propModel('prop_md_knob', { size: 1.35 }); const a = propAnchor(prop, 'knob'); prop.updateMatrixWorld(true); k.position.copy(a.getWorldPosition(new T.Vector3())); prop.remove(a); h.group.add(k); return k; };
    this.it.tap = { key: 'tap', obj: knob(h.sink) };
    this.it.bathtap = { key: 'bathtap', obj: knob(h.bath) };
    this.it.clock = { key: 'clock', obj: h.clock };
    this.it.drapes = { key: 'drapes', obj: h.drapes[0] };
    this.it.lamp = { key: 'lamp', obj: h.lamp };
    this.items = Object.keys(this.it);
    // water: the sink's and the bath's streams, the bath's water and its duck
    const spout = (prop) => { const a = propAnchor(prop, 'spout'); prop.updateMatrixWorld(true); const p = a.getWorldPosition(new T.Vector3()); prop.remove(a); return p; };
    this.sinkSpout = spout(h.sink);
    this.sinkStream = makeStream(this.sinkSpout, SINK.y + 1.36, 0.075);
    this.bathStream = makeStream(spout(h.bath), 0.65, 0.09);
    h.group.add(this.sinkStream, this.bathStream);
    this.water = new T.Mesh(new T.CircleGeometry(1, 40), new T.MeshToonMaterial({ color: 0x8fdcff }));
    this.water.rotation.x = -Math.PI / 2;
    this.water.scale.set(1.85, 0.85, 1);
    this.water.position.set(BATH.x, 0.62, BATH.z);
    this.water.visible = false;
    h.group.add(this.water);
    this.duck = propModel('prop_duckie', { size: 0.5 });
    this.duck.visible = false;
    h.group.add(this.duck);
    this.bathFoam = [];
    // the bin is a real hollow container: a used tissue is thrown in and lands at the bottom
    physics.container(new T.Vector3(h.bin.position.x, 0, h.bin.position.z), { r: 0.42, h: 0.92, floor: 0.08 });
    // Bunny
    const b = (this.bunny = makeAnimal('bunny'));
    b.scale.setScalar(BS);
    b.userData.baseScale = BS;
    this.root.add(b);
    const u = b.userData;
    this.rest = { arms: u.arms.map((a) => a.rotation.clone()), head: u.head.rotation.clone() };
    this.P = newPose();
    b.updateMatrixWorld(true);
    // hand tips in arm-bone space, face points in head-bone space (from the model's anchors)
    const local = (bone, name) => bone.worldToLocal(b.localToWorld(new T.Vector3(...u.anchors[name])));
    this.handTip = [local(u.arms[0], 'handL'), local(u.arms[1], 'handR')];
    this.headPt = { mouth: local(u.head, 'mouth'), nose: local(u.head, 'nose'), earL: local(u.head, 'earL'), earR: local(u.head, 'earR') };
    for (const k of ['earL', 'earR']) this.headPt[k].multiplyScalar(0.8);
    this.headPt.top = u.head.worldToLocal(b.localToWorld(new T.Vector3(0, 2.25, 0.2)));
    this.headPt.face = u.head.worldToLocal(b.localToWorld(new T.Vector3(0, 1.6, 0.6)));
    this.tickleT = input.addTap(b, { radius: 1.3, offset: new T.Vector3(0, 2.6, 0.3), onTap: () => this.tickle() });
    this.foam = [];          // foam puffs on Bunny (paws, mouth, head)
    this.bubbles = [];       // soap bubbles in the air (pop them!)
    this.mess = [];
    this.zs = [];
    this.offs.push(input.onMiss((x, y) => this.popAt(x, y)));
    // drag + tap targets
    for (const k of this.items) {
      const I = this.it[k];
      I.obj.userData.key = k;
      if (TAP_THINGS.includes(k)) {
        const r = k === 'drapes' ? 1.6 : k === 'lamp' ? 0.8 : 0.6;
        const off = k === 'drapes' ? new T.Vector3(0, 1.8, 0) : k === 'clock' ? new T.Vector3(0, 0.5, 0) : k === 'lamp' ? new T.Vector3(0, 0.6, 0) : null;
        I.tap = input.addTap(I.obj, { radius: r, offset: off, onTap: () => this.tapThing(k) });
        if (k === 'drapes') I.tap2 = input.addTap(h.drapes[1], { radius: r, offset: off, onTap: () => this.tapThing(k) });
      } else {
        const off = { towel: new T.Vector3(0, -0.6, 0), bigtowel: new T.Vector3(0, -0.8, 0), brush: new T.Vector3(0, 0.1, 0), duvet: new T.Vector3(0, 0.2, 0), teddy: new T.Vector3(0, 0.5, 0), bottle: new T.Vector3(0, 0.45, 0), sponge: new T.Vector3(0, 0.2, 0) }[k] || null;
        I.drag = input.addDrag(I.obj, {
          radius: k === 'duvet' ? 1.5 : k === 'teddy' || k === 'bigtowel' ? 0.9 : 0.55, offset: off, minY: 0.3,
          zones: () => this.zones(),
          onPick: () => this.pick(k),
          onMove: (_t, z) => this.carry(k, z),
          onDrop: (z, info) => this.drop(k, z, info),
        });
      }
    }
    this.room = this.level === 1 ? 'bed' : 'bath';
    this.cam = { from: null, to: null, t: 1 };
    this.setRoom(this.room, true);
    this.pip.position.set(this.room === 'bath' ? -12.2 : 13.4, 0, 1.4);
    this.pip.rotation.y = this.room === 'bath' ? 0.5 : -0.5;
    this.phase = 'idle';
    this.dim = 0;
    this.setupLevel();
  }

  // ---------------- the starting picture per level ----------------
  setupLevel() {
    const b = this.bunny, h = this.house;
    this.setDrapes(this.level === 1 ? 0 : 1, true);   // Level 2 starts with the curtains closed (it's early)
    this.setDuvet(this.level === 1 ? 'over' : this.level === 2 ? 'folded' : 'made', true);
    if (this.level === 1) {
      // asleep in bed, the alarm clock about to ring
      this.lieDown(true);
      this.sleep(true);
    } else {
      b.position.set(-1.6, 0, 2.2);    // walks in through the doorway at the start of the first round
      b.rotation.y = -1.2;
    }
    if (this.level === 2) {
      // evening: the lamp is on, the room a little dimmer
      this.dimLights(0.25);
    }
    h.shade.material.color.setHex(this.level === 2 ? 0xfff1c0 : 0xfff6e0);
  }

  // ---------------- helpers ----------------
  get step() { return this.steps?.[this.si]; }
  want() { return this.phase === 'step' && this.step ? this.step.use : null; }
  handPos(i) { return this.bunny.userData.arms[i].localToWorld(this.handTip[i].clone()); }
  hands() { return this.handPos(0).add(this.handPos(1)).multiplyScalar(0.5); }
  headAt(name) { return this.bunny.userData.head.localToWorld(this.headPt[name].clone()); }
  // where each kind of target is (world), and how big it is
  target(id) {
    const b = this.bunny;
    switch (id) {
      case 'hands': return { pos: this.hands(), r: 0.75 };
      case 'mouth': case 'nose': return { pos: this.headAt(id), r: 0.55 };
      case 'earL': case 'earR': return { pos: this.headAt(id), r: 0.7 };
      case 'head': return { pos: this.headAt('top'), r: 1.0 };
      case 'body': return { pos: b.localToWorld(new T.Vector3(0, 1.0, 0.4)), r: 1.2 };
      case 'brush': return { pos: this.it.brush.rn.localToWorld(new T.Vector3(0.4, 0.15, 0)), r: 0.6 };
      case 'bin': return { pos: this.house.bin.position.clone().setY(1.0), r: 0.8 };
      case 'bath': return { pos: new T.Vector3(BATH.x + 0.4, 1.4, BATH.z), r: 1.6 };
      case 'bed': return { pos: new T.Vector3(BED.x + 0.3, 1.3, BED.z), r: 2.2 };
      case 'pillow': return { pos: new T.Vector3(BED.x - 1.85, 1.45, BED.z), r: 1.0 };
      case 'bunny': return { pos: b.localToWorld(new T.Vector3(0, 1.0, 0.5)), r: 1.5 };
    }
    return { pos: b.position.clone(), r: 1 };
  }
  // drop zones: every target this routine uses (so a wrong thing dropped on Bunny is noticed)
  zones() {
    if (this.phase !== 'step' || !this.steps) return [];
    const ids = [...new Set(this.steps.filter((s) => s.at).map((s) => s.at))];
    return ids.map((id) => { const t = this.target(id); return { id, pos: t.pos, radius: t.r }; });
  }
  at(x = 0, y = 0, z = 0) { return this.bunny.position.clone().add(new T.Vector3(x, y, z)); }

  // ---------------- camera + rooms ----------------
  setRoom(room, now = false) {
    this.room = room;
    const c = CAMS[room];
    if (now) { setCamera(c.pos, c.look); this.cam.t = 1; this.cam.to = c; return Promise.resolve(); }
    const from = { pos: this.camPos ? this.camPos.clone() : CAMS[room === 'bath' ? 'bed' : 'bath'].pos.clone(), look: this.camLook ? this.camLook.clone() : CAMS[room === 'bath' ? 'bed' : 'bath'].look.clone() };
    return this.s.anim(1.3, (e) => {
      const p = from.pos.clone().lerp(c.pos, e), l = from.look.clone().lerp(c.look, e);
      setCamera(p, l); this.camPos = p; this.camLook = l;
    }, Ease.inOut).then(() => { this.camPos = c.pos.clone(); this.camLook = c.look.clone(); });
  }

  // ---------------- Bunny moves ----------------
  async walk(to, speed = 2.8) {
    const b = this.bunny;
    const d = Math.hypot(to.x - b.position.x, to.z - b.position.z);
    if (d < 0.05) return;
    const a = Math.atan2(to.x - b.position.x, to.z - b.position.z);
    this.s.tween(b.rotation, { y: a }, 0.15);
    const x0 = b.position.x, z0 = b.position.z;
    sfx.patter();
    await this.s.anim(d / speed, (e) => { b.position.x = x0 + (to.x - x0) * e; b.position.z = z0 + (to.z - z0) * e; });
    this.s.tween(b.rotation, { y: 0 }, 0.2);
  }
  async hopTo(to, h = 1.0, dur = 0.5, face = 0) {
    const b = this.bunny, a = b.position.clone();
    const ry0 = b.rotation.y;
    sfx.boing2 && sfx.boing2();
    await this.s.anim(0.08, (_, p) => { this.P.sq = 1 - 0.18 * p; });
    await this.s.anim(dur, (e, q) => {
      b.position.lerpVectors(a, to, e);
      b.position.y += Math.sin(q * Math.PI) * h;
      b.rotation.y = ry0 + (face - ry0) * e;
      this.P.sq = q < 0.5 ? 0.9 + q * 0.4 : 1.1 - (q - 0.5) * 0.2;
    }, Ease.inOut);
    sfx.land();
    await this.s.anim(0.18, (_, p) => { this.P.sq = 1 - 0.15 * Math.sin(p * Math.PI); });
    this.P.sq = 1;
  }
  onStool() { return Math.abs(this.bunny.position.y - STOOL_TOP) < 0.05 && Math.abs(this.bunny.position.x - SPOTS.sink.x) < 0.1; }
  // get Bunny to a spot, walking (and hopping onto the stool / into the bath / up into bed) like a real toddler
  async goTo(spot) {
    const b = this.bunny;
    if (spot === this.spot) return;
    const from = this.spot;
    // leave where we are
    if (from === 'sink') await this.hopTo(new T.Vector3(spot === 'mat' ? -6.6 : -2.0, 0, -2.3), 0.9, 0.42);
    else if (from === 'bath') await this.hopTo(SPOTS.mat.clone(), 2.2, 0.6);
    else if (from === 'inBed') await this.getOutOfBed(spot === 'rug' ? SPOTS.rug : SPOTS.bedside);
    this.spot = null;
    // change rooms through the doorway
    const room = spot === 'inBed' || spot === 'bedside' || spot === 'rug' ? 'bed' : 'bath';
    if (room !== this.room) {
      // through the doorway (the camera follows, Pip skips along behind)
      this.setRoom(room);
      this.pipFollow(room);
      this.say(room === 'bed' ? 'To the bedroom!' : 'To the bathroom!', { max: 1.0 });
      if (room === 'bed') {
        if (b.position.z < 0) await this.walk(new T.Vector3(b.position.x, 0, 0.6), 3.5);
        await this.walk(SPOTS.bedDoor, 4.2);
      } else await this.walk(SPOTS.bathDoor, 4.2);
    }
    if (spot === 'sink') {
      if (b.position.z > -2.0 || b.position.x < -5) await this.walk(new T.Vector3(b.position.x < -5 ? -6.6 : -2.0, 0, -2.3), 3.0);
      await this.hopTo(SPOTS.sink.clone(), 0.9, 0.45);
    } else if (spot === 'mat') {
      if (b.position.x > -5 && b.position.z > -2) await this.walk(new T.Vector3(-2.0, 0, 0.6));
      await this.walk(SPOTS.mat);
    } else if (spot === 'bath') {
      await this.hopTo(SPOTS.bath.clone(), 2.2, 0.6);
      this.splash(new T.Vector3(BATH.x + 0.2, 1.3, BATH.z + 0.5), 12, 3);
      sfx.splash();
    } else if (spot === 'inBed') {
      await this.walk(SPOTS.bedside);
      await this.climbIntoBed();
    } else await this.walk(SPOTS[spot]);
    this.spot = spot;
  }
  async climbIntoBed() {
    const b = this.bunny;
    const a = b.position.clone(), rz0 = b.rotation.z;
    this.bedAnim = true;
    b.userData.noWalk = true;
    sfx.boing2 && sfx.boing2();
    await this.s.anim(0.6, (e, q) => {
      b.position.lerpVectors(a, LIE.pos, e);
      b.position.y += Math.sin(q * Math.PI) * 1.2;
      b.rotation.z = rz0 + (LIE.rz - rz0) * Ease.inOut(Math.min(1, q * 1.4));
    }, Ease.inOut);
    sfx.land();
    this.spot = 'inBed';
    this.bedAnim = false;
  }
  lieDown(now) {
    const b = this.bunny;
    b.position.copy(LIE.pos); b.rotation.set(0, 0, LIE.rz);
    this.spot = 'inBed';
    b.userData.noWalk = true;
  }
  async getOutOfBed(to = SPOTS.bedside) {
    const b = this.bunny;
    const a = b.position.clone();
    this.bedAnim = true;
    await this.s.anim(0.7, (e, q) => {
      b.position.lerpVectors(a, to, e);
      b.position.y += Math.sin(q * Math.PI) * 1.0;
      b.rotation.z = LIE.rz * (1 - Ease.inOut(Math.min(1, q * 1.5)));
    }, Ease.inOut);
    b.rotation.z = 0;
    sfx.land();
    b.userData.noWalk = false;
    this.bedAnim = false;
  }
  sleep(on) {
    const u = this.bunny.userData, f = u.face;
    u.still = on; u.noLook = on;
    if (!f) return;
    setFace(f, on ? 'calm' : 'happy');
    for (const e of f.userData.eyes || []) e.scale.y = on ? 0.12 : 1;
    this.sleeping = on;
  }
  pipFollow(room) {
    const p = this.pip, s = this.s;
    const out = room === 'bed' ? -15 : 16, inn = room === 'bed' ? 16.5 : -15.5, to = room === 'bed' ? 13.4 : -12.2;
    const x0 = p.position.x;
    s.anim(0.9, (e) => { p.position.x = x0 + (out - x0) * e; }).then(() => {
      p.position.x = inn;
      p.rotation.y = room === 'bed' ? -0.5 : 0.5;
      return s.anim(0.9, (e) => { p.position.x = inn + (to - inn) * e; }, Ease.out);
    });
  }

  // ---------------- rounds ----------------
  async startRound(r) {
    this.busy = true;
    this.phase = 'moving';
    const spec = this.plan[r];
    const R = (this.routine = ROUTINES[spec.r]);
    this.steps = R.steps;
    this.si = 0;
    // Bunny goes where this routine happens
    if (this.spot !== R.spot) {
      if (R.spot === 'inBed' && this.spot === null) this.lieDown(true);
      else await this.goTo(R.spot);
    }
    if (this.dead) return;
    // the set-up: messy paws, a sneeze coming, an alarm clock ringing
    if (spec.mess) this.addMess(spec.mess);
    if (spec.intro) this.say(spec.intro, { max: 1.0 });
    if (R.pre === 'ahh') await this.ahh();
    if (spec.r === 'wake') this.ringing = true;
    if (spec.intro || spec.mess) await this.wait(0.5);
    this.startStep();
  }
  startStep() {
    if (this.dead) return;
    this.phase = 'step';
    this.busy = false;
    this.idle = 0;
    this.rubbed = 0;
    this.clearHints();
    const st = this.step;
    // Level 1: the thing to use glows; Level 2: only a nudge when stuck; Level 3: nothing (the child chooses)
    if (this.level === 0) this.addHalo(this.it[st.use].obj, st.use === 'drapes' ? 1.6 : st.use === 'duvet' ? 1.6 : 0.9);
    if (this.level < 2) this.armTo(st);
    if (this.round === 0 && this.si === 0 && !this.demoDone) this.cue();
    else this.prompt();
  }
  promptText() {
    const st = this.step;
    if (!st) return '';
    if (this.level === 2) return this.si === 0 ? this.routine.ask : 'What comes next?';
    return st.say;
  }
  // Bunny gets ready for the step: paws out over the basin for washing, a big open mouth for brushing...
  armTo(st) {
    const P = this.P;
    const paws = st.at === 'hands';
    this.s.tween(P, { armX: paws ? -1.15 : 0, armIn: paws ? 0.95 : 0 }, 0.3);
  }
  async completeStep() {
    const st = this.step;
    this.clearHints();
    if (st.then) await this[st.then]();
    if (this.dead) return;
    this.si++;
    if (this.si < this.steps.length) {
      sfx.note(this.si * 2);
      const tp = this.target(this.steps[this.si - 1].at || 'body').pos;
      fx.confetti(tp, 12);
      await this.wait(0.15);
      this.startStep();
      return;
    }
    // the whole routine is done
    this.phase = 'done';
    this.busy = false;
    this.payoff = this.cheer(this.routine);
    this.success(this.at(0, 3.6, 0.6), this.routine.done);
  }
  async afterSuccess() {
    if (this.payoff) await this.payoff;
    this.payoff = null;
    this.s.tween(this.P, { armX: 0, armIn: 0, rub: 0 }, 0.25);
    this.clearFoam();
    for (const b of this.bubbles.slice(0, Math.max(0, this.bubbles.length - 4))) this.popBubble(b, false);
  }

  // ---------------- input ----------------
  // the right thing for this step, or a gentle redirect (the hint names what comes next)
  check(k) {
    if (this.busy || this.phase !== 'step') return false;
    if (k === this.want()) return true;
    if (ROOM_OF[k] && ROOM_OF[k] !== this.room) return false;
    this.wrong(k);
    return false;
  }
  wrong(k) {
    const o = this.it[k]?.obj;
    if (o && TAP_THINGS.includes(k)) this.wobble(o);
    this.redirect(this.step.hint);
    // Bunny shakes its head a little: not that one
    this.s.anim(0.5, (_, p) => { this.P.headY = Math.sin(p * Math.PI * 4) * 0.3 * (1 - p); }).then(() => (this.P.headY = 0));
  }
  wobble(o) {
    const r0 = o.rotation.z;
    this.s.anim(0.4, (_, p) => { o.rotation.z = r0 + Math.sin(p * Math.PI * 4) * 0.12 * (1 - p); }).then(() => (o.rotation.z = r0));
  }
  tapThing(k) {
    if (this.dead) return;
    if (this.phase !== 'step' || this.busy) { if (!this.busy) this.wobble(this.it[k].obj); sfx.tick(); return; }
    if (!this.check(k)) return;
    this.run();
  }
  pick(k) {
    const I = this.it[k], o = I.obj;
    o.updateMatrixWorld(true);
    this.s.stop(o.position); this.s.stop(o.scale); this.s.stop(I.rn.rotation); this.s.stop(I.rn.quaternion);
    I.carrying = true;
    this.last = null;
    this.rubbed = 0;
    this.wrongRub = 0;
    o.position.z = DRAG_Z + (k === 'duvet' ? 0.6 : 0);
    // carried the way you hold it, a little bigger
    const cr = CARRY[k]?.rot;
    if (cr) I.rn.rotation.set(cr[0], cr[1], cr[2], cr[3] || 'XYZ');
    const k0 = I.scale || 1;
    this.s.tween(o.scale, { x: k0 * 1.12, y: k0 * 1.12, z: k0 * 1.12 }, 0.12);
    if (k === 'duvet') this.s.tween(o.scale, { x: 0.6, y: 1.3, z: 0.6 }, 0.15);
    if (this.level < 2 && k === this.want()) this.bunny.userData.lookAmt = 1;
  }
  // the business end of a thing (world): the brush head, the paddle of the hairbrush, else its middle
  tipOf(k) {
    const I = this.it[k], t = CARRY[k]?.tip;
    return t ? I.rn.localToWorld(new T.Vector3(...t)) : I.obj.position.clone();
  }
  // while carrying: rubbing near the target counts for rub steps
  carry(k, zone) {
    const st = this.step, o = this.it[k].obj;
    const p = project(this.tipOf(k)), p0 = project(o.position);
    const m = Math.min(innerWidth, innerHeight);
    if (this.last && this.phase === 'step' && !this.busy && st) {
      const travel = Math.min(0.08, Math.hypot(p.x - this.last.x, p.y - this.last.y) / m);
      if (travel > 0.002) {
        if (k === this.want() && st.how === 'rub') {
          const t = this.target(st.at);
          const c = project(t.pos);
          const r = Math.max(screenRadius(t.pos, t.r) * 1.2, m * 0.12);
          // forgiving: the business end (brush head) or where the finger holds it
          if (Math.min(Math.hypot(p.x - c.x, p.y - c.y), Math.hypot(p0.x - c.x, p0.y - c.y)) < r) this.rub(travel);
        } else if (k !== this.want() && zone) {
          // rubbing Bunny with the wrong thing: after a moment, a gentle "not yet"
          this.wrongRub += travel;
          if (this.wrongRub > 0.25) { this.wrongRub = -99; this.wrong(k); this.home(k); input.remove(this.it[k].drag); this.it[k].drag = this.redrag(k); }
        }
      }
    }
    this.last = p;
  }
  drop(k, zone, { tapped } = {}) {
    const I = this.it[k];
    I.carrying = false;
    this.last = null;
    if (this.dead) return;
    const st = this.step;
    if (this.phase === 'step' && !this.busy && st) {
      if (k === this.want() && st.how === 'drop' && zone && zone.id === st.at) { this.run(); return; }
      if (k !== this.want() && zone && ROOM_OF[k] === this.room) { this.home(k); this.wrong(k); return; }
      if (tapped && k === this.want() && st.how !== 'tap') { this.home(k); this.prompt(); return; }
    }
    this.home(k);
  }
  // re-make a drag target (used when a carry is cancelled from inside the move handler)
  redrag(k) {
    const I = this.it[k];
    return input.addDrag(I.obj, { radius: I.drag?.radius ?? 0.55, offset: I.drag?.offset ?? null, minY: 0.3, zones: () => this.zones(), onPick: () => this.pick(k), onMove: (_t, z) => this.carry(k, z), onDrop: (z, info) => this.drop(k, z, info) });
  }
  // fly back to where it lives (an arc), and settle with a little squash
  home(k, dur = 0.4) {
    const I = this.it[k], o = I.obj, rn = I.rn;
    if (!I.home) return Promise.resolve();
    const a = o.position.clone(), b = I.home.clone(), k0 = I.scale || 1;
    const qa = rn.quaternion.clone(), qb = new T.Quaternion().setFromEuler(I.rot);
    const s0 = o.scale.clone();
    return this.s.anim(dur, (e, q) => {
      o.position.lerpVectors(a, b, e);
      o.position.y += Math.sin(q * Math.PI) * 0.8;
      rn.quaternion.slerpQuaternions(qa, qb, e);
      o.scale.lerpVectors(s0, new T.Vector3(k0, k0, k0), e);
    }, Ease.out).then(() => { o.position.copy(b); rn.rotation.copy(I.rot); o.rotation.z = 0; o.scale.setScalar(k0); sfx.land(); });
  }
  // fly to a point beside a target (for the step's little show)
  flyTo(k, pos, dur = 0.3, rot = null) {
    const o = this.it[k].obj, rn = this.it[k].rn, a = o.position.clone();
    const qa = rn.quaternion.clone(), qb = rot ? new T.Quaternion().setFromEuler(rot) : qa;
    return this.s.anim(dur, (e, q) => { o.position.lerpVectors(a, pos, e); o.position.y += Math.sin(q * Math.PI) * 0.4; rn.quaternion.slerpQuaternions(qa, qb, e); }, Ease.out);
  }

  // ---------------- doing the step ----------------
  // test hook / the shared path: use thing k for the current step
  act(k) {
    if (this.dead || this.busy || this.phase !== 'step') return;
    if (k !== this.want()) { if (ROOM_OF[k] === this.room || !ROOM_OF[k]) this.wrong(k); return; }
    const st = this.step;
    if (st.how === 'rub') {
      // the thing goes to the spot and rubs there by itself
      this.busy = true;
      const o0 = this.it[k].obj, cr = CARRY[k]?.rot;
      if (cr) this.it[k].rn.rotation.set(cr[0], cr[1], cr[2], cr[3] || 'XYZ');
      o0.updateMatrixWorld(true);
      const t = this.target(st.at).pos.add(new T.Vector3(0, 0, 0.6)).sub(this.tipOf(k).sub(o0.position));
      this.flyTo(k, t, 0.3).then(async () => {
        this.busy = false;
        const o = this.it[k].obj, x0 = o.position.x;
        for (let i = 0; i < 12 && this.phase === 'step' && this.step === st; i++) {
          await this.s.anim(0.08, (_, p) => { o.position.x = x0 + Math.sin(p * Math.PI * 2) * 0.35; });
          this.rub(this.need / 6);
        }
      });
      return;
    }
    this.run();
  }
  rub(amt) {
    const st = this.step;
    if (this.busy || this.phase !== 'step' || st.how !== 'rub') return;
    const before = this.rubbed;
    this.rubbed = Math.min(this.need, this.rubbed + amt);
    const p = this.rubbed / this.need;
    const now = performance.now();
    if (now - (this.lastScrub || 0) > 120) { sfx.scrub(); this.lastScrub = now; }
    this.P.rub = 1;
    this.rubT = 0.4;
    this[st.act + 'Tick']?.(p, before / this.need);
    if (now - (this.lastGiggle || 0) > 1300 && p < 1) { this.lastGiggle = now; sfx.giggle(); setFace(this.bunny.userData.face, 'joy'); }
    if (this.rubbed >= this.need) this.run();
  }
  async run() {
    const st = this.step;
    this.busy = true;
    this.phase = 'acting';
    this.clearHints();
    fx.clearHands();
    input.lock(400);
    await this[st.act](st);
    if (this.dead) return;
    if (st.how !== 'tap' && st.use !== 'tissue' && st.act !== 'gargle' && st.act !== 'spreadDuvet' && st.act !== 'teddyPillow' && st.act !== 'cuddle' && st.act !== 'tuckIn') await this.home(st.use, 0.35);
    await this.completeStep();
  }

  // ---- washing paws ----
  spinKnob(k, back = true) {
    const o = this.it[k].obj, r0 = o.rotation.y;
    sfx.tick();
    return this.s.anim(0.3, (e) => { o.rotation.y = r0 + e * Math.PI; }, Ease.out).then(() => { if (back) o.rotation.y = r0; });
  }
  // the water runs onto the paws (under the spout)
  waterOnPaws() {
    this.sinkStream.userData.setLen(Math.max(0.1, this.sinkSpout.y - this.hands().y - 0.02));
    this.sinkStream.userData.set(true);
  }
  async wet() {
    this.spinKnob('tap');
    this.s.wait(0.12).then(() => this.waterOnPaws());
    sfx.pour();
    await this.s.tween(this.P, { armX: -1.15, armIn: 0.95 }, 0.25);
    for (let i = 0; i < 3; i++) { this.splash(this.hands(), 4, 1.5); await this.wait(0.2); }
    this.sinkStream.userData.set(false);
    this.spinKnob('tap');
    fx.float(this.hands().add(new T.Vector3(1.0, 0.3, 0.8)), '💧', { size: 5 });
  }
  latherTick(p) {
    const want = Math.ceil(p * 10);
    while (this.foam.filter((f) => f.userData.where === 'hands').length < want) this.addFoam('hands');
    for (const m of this.mess) setMessLook(m, p * 0.6, m.userData.k);
    if (Math.floor(p * 4) > Math.floor((this.lastP || 0) * 4)) { sfx.bubble(); this.addBubble(this.hands().add(new T.Vector3((Math.random() < 0.5 ? -1 : 1) * (0.8 + Math.random() * 0.4), 0.1, 0.5)), 0.16 + Math.random() * 0.1); }
    this.lastP = p;
  }
  async lather() {
    this.lastP = 0;
    this.latherTick(1);
    sfx.sparkle();
    for (let i = 0; i < 3; i++) this.addBubble(this.hands().add(new T.Vector3([-1.1, 1.0, 1.4][i], 0.2 + i * 0.2, 0.6)), 0.2 + i * 0.05);
    await this.wait(0.15);
  }
  async rinse() {
    this.spinKnob('tap');
    this.s.wait(0.12).then(() => this.waterOnPaws());
    sfx.pour();
    await this.s.tween(this.P, { armX: -1.15, armIn: 0.95 }, 0.2);
    // the foam slides off into the basin, the mess is gone
    const list = this.foam.filter((f) => f.userData.where === 'hands');
    list.forEach((f, i) => this.s.wait(i * 0.05).then(() => this.dropFoam(f)));
    for (const m of this.mess) this.s.tween(m.scale, { x: 0.01, y: 0.01, z: 0.01 }, 0.4).then(() => m.parent && m.parent.remove(m));
    this.mess = [];
    for (let i = 0; i < 3; i++) { this.splash(this.hands(), 4, 1.5); await this.wait(0.22); }
    this.sinkStream.userData.set(false);
    this.spinKnob('tap');
    sfx.sparkle();
  }
  async autoRinse() {
    this.say('Rinse!', { max: 0.6 });
    await this.rinse();
  }
  dryTick(p) {
    if (Math.random() < 0.3) this.splash(this.hands(), 1, 1.2);
  }
  async dry() {
    const hp = this.hands();
    sfx.twinkle();
    fx.float(hp.clone().add(new T.Vector3(-0.4, 0.5, 0.8)), '✨', { size: 6 });
    fx.float(hp.clone().add(new T.Vector3(0.5, 0.7, 0.8)), '✨', { size: 5 });
    // Bunny claps its clean dry paws
    await this.s.anim(0.5, (_, p) => { this.P.armIn = 0.9 + Math.abs(Math.sin(p * Math.PI * 3)) * 0.35; });
    sfx.pop();
  }

  // ---- teeth ----
  async squeeze() {
    const tube = this.it.paste.obj, brushHead = this.target('brush').pos;
    await this.flyTo('paste', brushHead.clone().add(new T.Vector3(0.35, 0.35, 0.3)), 0.25, new T.Euler(0, 0, 2.5));
    sfx.squeak && sfx.squeak();
    const s0 = tube.scale.clone();
    await this.s.anim(0.3, (_, p) => { tube.scale.set(s0.x, s0.y * (1 - 0.3 * bump(p)), s0.z * (1 + 0.15 * bump(p))); });
    tube.scale.copy(s0);
    const L = this.it.brush.obj.userData.model.userData.layers.paste;
    if (L) { L.mesh.visible = true; L.outline.visible = true; }
    sfx.bloop(5);
    fx.float(brushHead.clone().add(new T.Vector3(0, 0.5, 0.5)), '✨', { size: 5 });
  }
  scrubTick(p) {
    setFace(this.bunny.userData.face, 'joy');
    const want = Math.ceil(p * 6);
    while (this.foam.filter((f) => f.userData.where === 'mouth').length < want) this.addFoam('mouth');
  }
  async scrub() {
    sfx.sparkle();
    const m = this.target('mouth').pos;
    fx.float(m.clone().add(new T.Vector3(0.6, 0.3, 0.8)), '✨', { size: 6 });
    const L = this.it.brush.obj.userData.model.userData.layers.paste;
    if (L) { L.mesh.visible = false; L.outline.visible = false; }
  }
  async gargle() {
    const m = this.target('mouth').pos;
    await this.flyTo('cup', m.clone().add(new T.Vector3(0.25, -0.25, 0.55)), 0.25, new T.Euler(0, 0.5, 0.9));
    // gargle gargle
    for (let i = 0; i < 5; i++) this.s.wait(i * 0.09).then(() => sfx.bubble());
    await this.s.anim(0.5, (_, p) => { this.P.headX = -0.25 * bump(p); this.P.headZ = Math.sin(p * Math.PI * 6) * 0.06; });
    this.home('cup', 0.3);
    // lean over the basin and spit, the foam goes
    await this.s.anim(0.18, (_, p) => { this.P.lean = 0.3 * p; this.P.headX = 0.3 * p; });
    sfx.splash();
    this.foam.filter((f) => f.userData.where === 'mouth').forEach((f) => this.dropFoam(f));
    for (let i = 0; i < 6; i++) {
      const d = makeDrop(0.07);
      const a = this.headAt('mouth').add(new T.Vector3(0, -0.1, 0.2));
      d.position.copy(a); this.root.add(d);
      const to = new T.Vector3(SINK.x + (Math.random() - 0.5) * 0.4, SINK.y + 1.4, SINK.z - 0.2);
      this.s.wait(i * 0.03).then(() => this.s.anim(0.3, (e, q) => { d.position.lerpVectors(a, to, e); d.position.y += Math.sin(q * Math.PI) * 0.2; })).then(() => this.root.remove(d));
    }
    await this.s.anim(0.25, (_, p) => { this.P.lean = 0.3 * (1 - p); this.P.headX = 0.3 * (1 - p); });
    // a big shiny smile
    setFace(this.bunny.userData.face, 'joy');
    sfx.chime();
    fx.float(this.headAt('mouth').add(new T.Vector3(0.5, 0.2, 0.8)), '✨', { size: 7 });
    await this.wait(0.2);
  }

  // ---- sneeze ----
  async ahh() {
    const f = this.bunny.userData.face;
    this.say('Ah... ah...', { max: 1.0 });
    sfx.gasp();
    setFace(f, 'scared');
    await this.s.anim(0.7, (_, p) => { this.P.headX = -0.25 * p; this.P.headZ = Math.sin(p * Math.PI * 5) * 0.04; });
    this.ahhing = true;
  }
  async atchoo() {
    const I = this.it.tissue, o = I.obj, nose = this.target('nose').pos;
    await this.flyTo('tissue', nose.clone().add(new T.Vector3(0.05, -0.12, 0.25)), 0.2, new T.Euler(0, 0, 0));
    // ATCHOO!
    sfx.whoosh(); sfx.pop();
    fx.float(this.at(0.9, 4.0, 0.6), 'Atchoo!', { color: '#4a90ff', size: 6 });
    this.bunny.userData.kick?.(new T.Vector3(0, 2, 4));
    await this.s.anim(0.3, (_, p) => { this.P.headX = -0.25 + 0.65 * bump(p); this.P.sq = 1 - 0.1 * bump(p); o.scale.setScalar((I.scale || 1) * (1 + 0.3 * bump(p))); });
    this.ahhing = false;
    setFace(this.bunny.userData.face, 'happy');
    this.P.headX = 0; this.P.headZ = 0;
    // the used tissue scrunches up, Bunny holds it out
    await this.s.tween(o.scale, { x: 0.6, y: 0.6, z: 0.6 }, 0.15);
    I.home = this.handPos(1).add(new T.Vector3(0.25, 0.2, 0.7));
    I.rot = new T.Euler(0.3, 0.4, 0.6);
    I.scale = 0.6;
    await this.home('tissue', 0.25);
  }
  async binIt() {
    const I = this.it.tissue, o = I.obj, lid = this.house.lid, bin = this.house.bin;
    // the lid flips up, the tissue drops in, the lid shuts
    sfx.tick();
    this.s.tween(lid.rotation, { x: -1.6 }, 0.18, Ease.out);
    // a real throw: up over the rim and down into the bin
    await this.wait(0.12);
    await physics.toss(o, new T.Vector3(bin.position.x, 0.25, bin.position.z + 0.05), { arc: 0.7, shape: 'ball', r: 0.13, bounce: 0.15, maxT: 0.8 });
    physics.remove(o);
    o.visible = false;
    sfx.thunk();
    await this.s.tween(lid.rotation, { x: 0 }, 0.15, Ease.in);
    sfx.land();
    // a fresh tissue pops up out of the box
    I.home = new T.Vector3(-1.62, 2.12, -3.0);
    I.rot = new T.Euler(-0.25, -0.2, 0.15);
    I.scale = 1;
    o.position.copy(I.home); o.rotation.set(0, 0, 0); I.rn.rotation.copy(I.rot);
    popIn(this.s, o, 1, 0.35);
  }

  // ---- bath ----
  async fill() {
    this.spinKnob('bathtap');
    this.bathStream.userData.set(true);
    this.water.visible = true;
    this.water.position.y = 0.62;
    sfx.pour();
    this.s.wait(0.6).then(() => sfx.pour());
    await this.s.anim(1.3, (e) => { this.water.position.y = 0.62 + e * 0.55; this.water.scale.set(1.85 + e * 0.15, 0.85 + e * 0.04, 1); }, Ease.out);
    this.bathStream.userData.set(false);
    this.spinKnob('bathtap');
    // the rubber duck bobs up
    this.duck.position.set(BATH.x - 0.9, 1.17, BATH.z + 0.25);
    this.duck.rotation.y = 0.6;
    popIn(this.s, this.duck, 1, 0.4);
    sfx.squeak && sfx.squeak();
  }
  async pourBubbles() {
    const bt = this.it.bottle.obj;
    await this.flyTo('bottle', new T.Vector3(BATH.x + 0.6, 2.6, BATH.z + 0.6), 0.3, new T.Euler(0, 0, 2.2));
    sfx.pour();
    for (let i = 0; i < 16; i++) {
      this.s.wait(i * 0.05).then(() => {
        const f = makeFoam(0.22 + Math.random() * 0.2);
        const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random());
        f.position.set(BATH.x + Math.cos(a) * r * 1.7, 1.2 + Math.random() * 0.15, BATH.z + Math.sin(a) * r * 0.7);
        this.root.add(f);
        this.bathFoam.push(f);
        popIn(this.s, f, 1, 0.3, { sound: false });
        if (i % 4 === 0) { sfx.bubble(); this.addBubble(f.position.clone().add(new T.Vector3(0, 0.5, 0.4)), 0.2 + Math.random() * 0.12); }
      });
    }
    await this.wait(0.85);
  }
  async hopIn() {
    await this.goTo('bath');
    setFace(this.bunny.userData.face, 'joy');
    this.s.wait(0.6).then(() => setFace(this.bunny.userData.face, 'happy'));
    this.armTo(this.step);
  }
  soapyTick(p) {
    const want = Math.ceil(p * 8);
    while (this.foam.filter((f) => f.userData.where === 'top').length < want) this.addFoam('top');
  }
  async soapy() {
    sfx.sparkle();
    for (let i = 0; i < 4; i++) this.addBubble(this.headAt('top').add(new T.Vector3((i - 1.5) * 0.5, 0.6, 0.5)), 0.2 + Math.random() * 0.15);
    await this.wait(0.2);
  }
  async hopOut() {
    // splash the foam off, out onto the mat; the bath drains away
    this.foam.filter((f) => f.userData.where === 'top').forEach((f) => this.dropFoam(f));
    await this.goTo('mat');
    this.drain();
  }
  drain() {
    const w = this.water;
    sfx.pour();
    for (const f of this.bathFoam.splice(0)) popOut(this.s, f, 0.5).then(() => this.root.remove(f));
    popOut(this.s, this.duck, 0.3);
    this.s.anim(1.2, (e) => { w.position.y = 1.17 - e * 0.55; }).then(() => { w.visible = false; });
  }
  dryBodyTick(p) { if (Math.random() < 0.35) this.splash(this.at(0, 2.0, 0.6), 1, 1.5); }
  async dryBody() {
    // a shake-dry wiggle and sparkles
    sfx.swoosh();
    await this.s.anim(0.45, (_, p) => { this.P.tilt = Math.sin(p * Math.PI * 8) * 0.12 * (1 - p); });
    this.P.tilt = 0;
    sfx.twinkle();
    fx.float(this.at(-0.8, 3.8, 0.6), '✨', { size: 6 });
    fx.float(this.at(0.8, 3.3, 0.6), '✨', { size: 5 });
  }

  // ---- hair ----
  fluffTick(p, before) {
    if (Math.floor(p * 3) > Math.floor(before * 3)) this.bunny.userData.kick?.(new T.Vector3(this.step.at === 'earL' ? 2 : -2, 1, 1));
  }
  async fluff(st) {
    sfx.twinkle();
    fx.float(this.target(st.at).pos.add(new T.Vector3(0, 0.4, 0.6)), '✨', { size: 6 });
    this.bunny.userData.kick?.(new T.Vector3(0, 3, 1));
    await this.wait(0.2);
  }

  // ---- bedroom ----
  async wakeUp() {
    this.ringing = false;
    const c = this.house.clock;
    c.rotation.z = 0; c.position.y = 1.4;
    sfx.tick();
    fx.float(c.position.clone().add(new T.Vector3(0, 1.3, 0.3)), '♪', { color: '#ff6b6b', size: 5 });
    for (const z of this.zs.splice(0)) popOut(this.s, z, 0.2);
    // eyes open, a big yawn and a stretch
    this.sleep(false);
    setFace(this.bunny.userData.face, 'scared');
    sfx.aww();
    await this.s.anim(0.7, (_, p) => { this.P.armX = -0.4 * bump(p); this.P.armIn = -0.9 * bump(p); this.P.sq = 1 + 0.06 * bump(p); });
    setFace(this.bunny.userData.face, 'happy');
  }
  setDrapes(open, now = false) {
    const W = this.house.drapes, x = BED.x;
    const pose = (d, o) => ({ px: x + d.userData.side * (o ? 1.85 : 0.8), sx: o ? 0.9 : 1.75 });
    const go = W.map((d) => {
      const to = pose(d, open);
      if (now) { d.position.x = to.px; d.scale.set(to.sx, 3.55, 1); return null; }
      return this.s.anim(0.5, (e) => { d.position.x += (to.px - d.position.x) * e; d.scale.x += (to.sx - d.scale.x) * e; d.scale.y = 3.55; }, Ease.inOut);
    });
    this.drapesOpen = !!open;
    return now ? Promise.resolve() : Promise.all(go);
  }
  async openDrapes() {
    sfx.swoosh();
    await this.setDrapes(1);
    // sunshine!
    for (const w of [this.house.bedWin, this.house.bathWin]) { w.material.map = viewTex('day'); w.material.needsUpdate = true; }
    sfx.twinkle();
    fx.float(new T.Vector3(BED.x, 6.3, -4.0), '☀️', { size: 8 });
  }
  async getUp() {
    this.bunny.userData.noWalk = false;
    // out of bed; the duvet slides off onto the floor
    this.s.wait(0.25).then(() => this.duvetTo('floor', 0.5)).then(() => sfx.thunk());
    await this.goTo('rug');
  }
  setDuvet(state, now = true) {
    const I = this.it.duvet, S = DUVET[state];
    I.home = new T.Vector3(...S.p); I.rot = new T.Euler(...S.r); I.homeScale = new T.Vector3(...S.s);
    I.scale = 1;
    this.duvetState = state;
    if (now) { I.obj.position.copy(I.home); I.rn.rotation.copy(I.rot); I.obj.scale.copy(I.homeScale); }
  }
  duvetTo(state, dur = 0.45) {
    const I = this.it.duvet, o = I.obj, rn = I.rn;
    const a = o.position.clone(), qa = rn.quaternion.clone(), sa = o.scale.clone();
    this.setDuvet(state, false);
    const qb = new T.Quaternion().setFromEuler(I.rot);
    return this.s.anim(dur, (e, q) => {
      o.position.lerpVectors(a, I.home, e); o.position.y += Math.sin(q * Math.PI) * 0.8;
      rn.quaternion.slerpQuaternions(qa, qb, e);
      o.scale.lerpVectors(sa, I.homeScale, e);
    }, Ease.inOut).then(() => { o.position.copy(I.home); rn.rotation.copy(I.rot); o.rotation.z = 0; o.scale.copy(I.homeScale); });
  }
  async spreadDuvet() {
    sfx.swoosh();
    await this.duvetTo('made', 0.45);
    sfx.sparkle();
    fx.float(new T.Vector3(BED.x, 2.4, BED.z + 1.2), '✨', { size: 6 });
  }
  async teddyPillow() {
    const t = this.it.teddy;
    t.home = new T.Vector3(BED.x - 1.85, 1.3, BED.z + 0.1); t.rot = new T.Euler(0, 0.3, 0);
    await this.home('teddy', 0.4);
    sfx.squeak && sfx.squeak();
    fx.float(t.home.clone().add(new T.Vector3(0, 1.2, 0.5)), '♥', { color: '#ff5a7a', size: 6 });
  }
  async closeDrapes() {
    sfx.swoosh();
    await this.setDrapes(0);
    this.dimLights(0.45);
  }
  async intoBed() {
    if (this.duvetState !== 'folded') this.duvetTo('folded', 0.3);
    await this.goTo('inBed');
    setFace(this.bunny.userData.face, 'calm');
  }
  async cuddle() {
    const t = this.it.teddy;
    t.home = this.bunny.localToWorld(new T.Vector3(0.1, 0.95, 0.65)); t.rot = new T.Euler(0, 0, LIE.rz * 0.35);
    await this.home('teddy', 0.35);
    // a hug
    sfx.mmm();
    this.s.tween(this.P, { armX: -1.2, armIn: 1.0 }, 0.3);
    fx.float(t.home.clone().add(new T.Vector3(0.6, 0.9, 0.6)), '♥', { color: '#ff5a7a', size: 7 });
    await this.wait(0.35);
  }
  async tuckIn() {
    sfx.swoosh();
    await this.duvetTo('over', 0.5);
    setFace(this.bunny.userData.face, 'calm');
    sfx.mmm();
  }
  async lightsOff() {
    const h = this.house;
    sfx.tick(); sfx.thunk();
    h.shade.material.color.setHex(0x8a7a6a);
    h.pool.visible = false;
    this.dimLights(0.7);
    // glow-in-the-dark stars come out on the walls, Bunny's eyes close
    for (let i = 0; i < 9; i++) {
      const s = makeTwinkle(0.12 + Math.random() * 0.1, [0xffe27a, 0xbfe8ff, 0xffc2e0][i % 3]);
      s.position.set(BED.x - 5 + i * 1.25 + Math.random() * 0.5, 4.6 + Math.random() * 2.6, -4.55);
      this.root.add(s);
      popIn(this.s, s, s.scale.x, 0.3, { sound: false });
      this.s.wait(i * 0.06).then(() => sfx.note(i % 7));
    }
    this.sleep(true);
    await this.wait(0.4);
  }
  dimLights(k) {
    if (!this.lights) { this.lights = []; scene.traverse((o) => { if (o.isLight) this.lights.push([o, o.intensity]); }); }
    for (const [l, i0] of this.lights) l.intensity = i0 * (1 - k);
    this.dim = k;
  }

  // ---------------- payoffs ----------------
  async cheer(R) {
    const b = this.bunny;
    const f = b.userData.face;
    if (this.sleeping) {
      // lights out: Zzz float up
      for (let i = 0; i < 3; i++) this.s.wait(i * 0.35).then(() => this.floatZ());
      return this.wait(0.9);
    }
    if (f) { setFace(f, 'joy'); this.s.wait(0.9).then(() => setFace(f, 'happy')); }
    const y0 = b.position.y;
    if (this.spot === 'sink' || this.spot === 'inBed' || this.spot === 'bath') {
      // a little bounce on the spot, paws up
      return this.s.anim(0.7, (_, p) => { if (this.spot !== 'inBed') b.position.y = y0 + Math.abs(Math.sin(p * Math.PI * 2)) * 0.3; this.P.armX = -0.3 * bump(p); this.P.armIn = -0.8 * bump(p); }).then(() => { b.position.y = y0; });
    }
    // a twirl and a hop
    sfx.twinkle();
    const r0 = b.rotation.y;
    return this.s.anim(0.7, (e) => { b.rotation.y = r0 + e * Math.PI * 2; b.position.y = y0 + Math.sin(e * Math.PI) * 0.6; }, Ease.inOut).then(() => { b.rotation.y = r0; b.position.y = y0; sfx.land(); });
  }
  floatZ() {
    const z = makeZ(0.25 + Math.random() * 0.1);
    const a = this.headAt('top').add(new T.Vector3(-0.3, 0.3, 0.4));
    z.position.copy(a);
    this.root.add(z);
    this.zs.push(z);
    this.s.anim(1.6, (e) => { z.position.set(a.x - e * 0.8 + Math.sin(e * 6) * 0.2, a.y + e * 1.6, a.z); z.material && (z.material.opacity = 1 - e); }).then(() => { this.root.remove(z); this.zs = this.zs.filter((x) => x !== z); });
  }
  tickle() {
    if (this.dead || this.sleeping || this.tickling) return;
    this.tickling = true;
    sfx.giggle();
    this.bunny.userData.kick?.(new T.Vector3(2, 3, 0));
    const f = this.bunny.userData.face;
    if (f) { setFace(f, 'joy'); this.s.wait(0.6).then(() => setFace(f, 'happy')); }
    this.s.anim(0.45, (_, p) => { this.P.tilt = Math.sin(p * Math.PI * 4) * 0.08; this.P.sq = 1 + 0.05 * Math.sin(p * Math.PI * 2); }).then(() => { this.P.tilt = 0; this.P.sq = 1; this.tickling = false; });
  }

  // ---------------- foam, bubbles, drops, mess ----------------
  addFoam(where) {
    const u = this.bunny.userData;
    const f = makeFoam(where === 'mouth' ? 0.05 + Math.random() * 0.04 : 0.08 + Math.random() * 0.07);
    f.userData.where = where;
    const n = this.foam.filter((x) => x.userData.where === where).length;
    const sc = 1 / BS;
    if (where === 'hands') {
      const i = n % 2, bone = u.arms[i], tip = this.handTip[i];
      const a = n * 2.3;
      f.position.copy(tip).add(new T.Vector3(Math.cos(a) * 0.12, Math.sin(a) * 0.12, 0.08));
      f.scale.setScalar(sc);
      bone.add(f);
    } else {
      const base = where === 'mouth' ? this.headPt.mouth : this.headPt.top;
      const a = n * 2.1, r = where === 'mouth' ? 0.06 + n * 0.015 : 0.2 + n * 0.05;
      f.position.copy(base).add(new T.Vector3(Math.cos(a) * r * 1.4, Math.sin(a) * r * (where === 'mouth' ? 0.6 : 0.5) + (where === 'mouth' ? -0.03 : 0), 0.05));
      f.scale.setScalar(sc);
      u.head.add(f);
    }
    this.foam.push(f);
    popIn(this.s, f, f.scale.x, 0.22, { sound: false });
  }
  dropFoam(f) {
    this.foam = this.foam.filter((x) => x !== f);
    const w = f.getWorldPosition(new T.Vector3());
    f.parent && f.parent.remove(f);
    f.position.copy(w); f.scale.setScalar(1);
    this.root.add(f);
    const y1 = this.spot === 'bath' ? 1.17 : SINK.y + 1.4;
    this.s.anim(0.35, (e) => { f.position.y = w.y + (y1 - w.y) * e; f.scale.setScalar(1 - e * 0.7); }, Ease.in).then(() => this.root.remove(f));
  }
  clearFoam() { for (const f of this.foam.slice()) this.dropFoam(f); }
  addMess(kind) {
    const u = this.bunny.userData;
    this.mess = [0, 1].map((i) => {
      const m = makeMess(kind, i * 3 + Math.random());
      m.position.copy(this.handTip[i]).add(new T.Vector3(0, 0, 0.12));
      m.userData.k = 0.85 / BS * 1.6;
      m.scale.setScalar(m.userData.k);
      u.arms[i].add(m);
      popIn(this.s, m, m.userData.k, 0.3, { sound: false });
      return m;
    });
    sfx.crunch();
  }
  addBubble(pos, r) {
    const b = makeSoapBubble(r);
    b.position.copy(pos);
    this.root.add(b);
    Object.assign(b.userData, { life: 3.4 + Math.random() * 1.2, ph: Math.random() * 6, vx: (Math.sign(pos.x - this.bunny.position.x) || 1) * (0.3 + Math.random() * 0.7), k: r });
    this.bubbles.push(b);
    popIn(this.s, b, r, 0.25, { sound: false });
  }
  popBubble(b, loud = true) {
    const i = this.bubbles.indexOf(b);
    if (i < 0) return;
    this.bubbles.splice(i, 1);
    if (loud) { sfx.pop(); fx.confetti(b.position, 6); }
    const k = b.userData.k * 1.6;
    this.s.tween(b.scale, { x: k, y: k, z: k }, 0.08).then(() => this.root.remove(b));
  }
  popAt(x, y) {
    if (this.dead) return false;
    let best = null, bd = Infinity;
    for (const b of this.bubbles) {
      const c = project(b.position);
      const r = Math.max(screenRadius(b.position, b.userData.k) * 1.6, Math.min(innerWidth, innerHeight) * 0.05);
      const d = Math.hypot(c.x - x, c.y - y) / r;
      if (d < 1 && d < bd) { bd = d; best = b; }
    }
    if (!best) return false;
    this.popBubble(best);
    return true;
  }
  // water drops fly out, bounce off and dry up
  splash(pos, n = 8, up = 2.5) {
    for (let i = 0; i < Math.min(n, 12); i++) {
      const r = 0.06 + Math.random() * 0.03;
      const d = makeDrop(r);
      d.position.copy(pos);
      this.root.add(d);
      const v = new T.Vector3((Math.random() - 0.5) * 2.4, up * (0.6 + Math.random() * 0.6), 0.6 + Math.random());
      const a = pos.clone();
      this.s.anim(0.5, (_, p) => { const t = p * 0.5; d.position.set(a.x + v.x * t, a.y + v.y * t - 6 * t * t, a.z + v.z * t); d.scale.setScalar(r * (1 - p * 0.5)); }).then(() => this.root.remove(d));
    }
  }

  // ---------------- hints ----------------
  targetObj(st) { return this.it[st.use]?.obj; }
  nudgeTarget() {
    const st = this.step;
    if (this.phase !== 'step' || !st) return null;
    const o = this.targetObj(st);
    // the nudge hops the object: only for loose things (not the tap or the curtains)
    return TAP_THINGS.includes(st.use) || st.use === 'duvet' || st.use === 'teddy' ? null : o;
  }
  nudge(step) {
    const st = this.step;
    if (st && (TAP_THINGS.includes(st.use) || st.use === 'duvet' || st.use === 'teddy')) {
      const o = this.targetObj(st);
      sfx.boing && sfx.boing();
      this.wobble(o);
      if (step >= 2) { const stop = fx.halo(o, 1.3); this.s.wait(3).then(stop); }
      return;
    }
    super.nudge(step);
  }
  showHint(glow = true) {
    const st = this.step;
    if (!st || this.phase !== 'step') return;
    const o = this.targetObj(st);
    const from = o.getWorldPosition(new T.Vector3()).add(new T.Vector3(0, st.use === 'drapes' ? 1.8 : 0.3, 0));
    if (glow) this.addHalo(o, 1.0);
    if (st.how === 'tap') { fx.ghostPath([from], { mode: 'tap' }); return; }
    fx.ghostPath([from, this.target(st.at).pos], { mode: st.how === 'rub' ? 'rub' : 'drag' });
  }
  // Level 3's demo hops over the things this routine uses (in a jumbled order), without showing which is first
  choicePoints() {
    const keys = [...new Set((this.steps || []).map((st) => st.use))];
    const order = keys.length > 1 ? [...keys.slice(1), keys[0]] : keys;
    return order.map((k) => this.it[k].obj.getWorldPosition(new T.Vector3()).add(new T.Vector3(0, k === 'drapes' ? 1.8 : 0.3, 0)));
  }
  makeErrorless() {
    const st = this.step;
    if (!st || this.phase !== 'step') return;
    this.need *= 0.5;
    this.addHalo(this.targetObj(st), 1.1);
  }
  nextRound() { this.need = NEED[this.level]; super.nextRound(); }

  dispose() {
    if (this.lights) for (const [l, i0] of this.lights) l.intensity = i0;
    super.dispose();
  }
  onFinale() {
    if (this.sleeping) { for (let i = 0; i < 4; i++) this.s.wait(i * 0.4).then(() => this.floatZ()); return; }
    for (let i = 0; i < 8; i++) this.addBubble(this.at(-3 + i * 0.8, 1.5 + Math.random() * 2, 1.2), 0.25 + Math.random() * 0.2);
  }

  // ---------------- every frame ----------------
  update(dt, t) {
    const b = this.bunny, u = b.userData, P = this.P;
    this.sinkStream.userData.update(dt, t);
    this.bathStream.userData.update(dt, t);
    // pose -> rig
    const ra = this.rest.arms;
    if (this.rubT > 0) { this.rubT -= dt; if (this.rubT <= 0) P.rub = 0; }
    const w = Math.sin(t * 20) * 0.14 * P.rub;
    u.arms[0].rotation.set(ra[0].x + P.armX + w, ra[0].y, ra[0].z - P.armIn);
    u.arms[1].rotation.set(ra[1].x + P.armX - w, ra[1].y, ra[1].z + P.armIn);
    if (u.head) {
      u.head.rotation.x = P.headX;
      u.head.rotation.y = P.headY;
      u.head.rotation.z += P.headZ;
    }
    if (this.spot !== 'inBed' && !this.bedAnim) { b.rotation.x = P.lean; b.rotation.z = P.tilt; }
    // lying down, the ears tip up off the pillow (they would poke through the headboard)
    const lie = Math.min(1, Math.abs(b.rotation.z) / LIE.rz);
    if (lie > 0.01 || this.lastLie > 0.01) {   // every frame while lying (the ear springs take it as their rest)
      this.lastLie = lie;
      for (const k of ['earL1', 'earR1']) { const e = u.bones[k]; if (e) { e.quaternion.copy(e.userData.q0); e.rotateZ(-1.6 * lie); } }
    }
    const sq = P.sq;
    b.scale.set(BS / Math.sqrt(sq), BS * sq, BS / Math.sqrt(sq));
    // sleeping: slow breathing and Zzz
    if (this.sleeping) {
      this.zT = (this.zT || 0) - dt;
      if (this.zT <= 0) { this.zT = 1.4; this.floatZ(); }
      if (u.body) u.body.scale.y = 1 + Math.sin(t * 1.6) * 0.03;
    }
    // the alarm clock rings and jiggles
    const c = this.house.clock;
    if (this.ringing) {
      c.rotation.z = Math.sin(t * 50) * 0.08;
      c.position.y = 1.4 + Math.abs(Math.sin(t * 25)) * 0.05;
      this.ringT = (this.ringT || 0) - dt;
      if (this.ringT <= 0) { this.ringT = 1.1; for (let i = 0; i < 6; i++) this.s.wait(i * 0.05).then(() => sfx.tick()); }
    }
    // the duck bobs in the bath
    if (this.duck.visible) { this.duck.position.y = this.water.position.y + Math.sin(t * 2) * 0.03; this.duck.rotation.z = Math.sin(t * 1.7) * 0.08; }
    // mess splats stay flat on the paws, facing out (the arm bones turn as the paws come up)
    if (this.mess.length) {
      const qr = b.getWorldQuaternion(new T.Quaternion());
      this.mess.forEach((m, i) => m.quaternion.copy(u.arms[i].getWorldQuaternion(new T.Quaternion()).invert().multiply(qr)));
    }
    // bubbles drift up and wobble
    for (const bb of this.bubbles.slice()) {
      const q = bb.userData;
      q.life -= dt;
      bb.position.y += dt * 0.8;
      bb.position.x += dt * (q.vx + Math.sin(t * 2 + q.ph) * 0.4);
      const ww = 1 + Math.sin(t * 5 + q.ph) * 0.06;
      if (bb.scale.x > q.k * 0.9 && bb.scale.x < q.k * 1.2) bb.scale.set(q.k * ww, q.k / ww, q.k);
      if (q.life <= 0 || bb.position.y > 9.5) this.popBubble(bb, false);
    }
  }
}
