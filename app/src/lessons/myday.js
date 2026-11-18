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
// Feel: the camera frames the thing in use tightly (the sink, the bath, the bed...) and glides when Bunny moves on;
// every new kind of action gets a slow ghost-hand demo the first time it comes up (Level 3: only if the child waits
// a few seconds, so the choice stays theirs) and again when the child is stuck for ~8 s.
//
// Test hooks: phase ('step' while waiting for the child), want() (key of the thing this step needs), act(key) (use
// that thing for this step: the right one plays the step, a wrong one gets a gentle redirect), items (all keys).
import * as T from '../three.js';
import { Lesson } from '../engine/lesson.js';
import { setFace, popIn, makeAnimal } from '../engine/actors.js';
import { propModel, propAnchor } from '../engine/prop-models.js';
import { input } from '../engine/input.js';
import { sfx, hushEffects } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { physics } from '../engine/physics.js';
import { project, screenRadius, setCamera, scene, camera, getLook, onFrame } from '../engine/stage.js';
import { Ease } from '../engine/tween.js';
import { makeHouse, makeItems, viewTex, SPOTS, SINK, BATH, BED, BIN, STOOL_TOP, TISSUE_HOME, PATH_NODES, PATH_EDGES } from './myday-house.js';
import { ROUTINES, PLANS, NEED } from './myday-plans.js';
import { makeStream, makeBathWater, makeFoam, makeSoapBubble, makeDrop, makeMess, makeTuft, makeZ, makeTwinkle } from './myday-fx.js';

const BS = 1.45;                                   // Bunny's scale
const DRAG_Z = 0.9;                                // things are carried in this plane, in front of the furniture
const TAP_THINGS = ['tap', 'bathtap', 'clock', 'drapes', 'lamp'];
const ROOM_OF = { tap: 'bath', bathtap: 'bath', soap: 'bath', cup: 'bath', brush: 'bath', paste: 'bath', towel: 'bath', bigtowel: 'bath',
  sponge: 'bath', bottle: 'bath', tissue: 'bath', hairbrush: 'bath', clock: 'bed', drapes: 'bed', lamp: 'bed', duvet: 'bed', teddy: 'bed' };
// Lying in bed: on its back, tipped a little toward us, head on the pillow (feet toward the foot of the bed). The pose
// is a rotation about the feet: first the body tips over toward the headboard (rz), then it rolls back so the face
// turns up toward the ceiling and us (roll). STAND: where Bunny stands on the mattress before lying down.
const LIE = { feet: new T.Vector3(BED.x + 1.3, 1.32, BED.z + 0.12), rz: Math.PI / 2 - 0.28, roll: 0.95, arms: { armX: 1.2, armIn: 1.25 } };
const STAND = new T.Vector3(BED.x + 0.2, 1.02, BED.z + 0.12);   // (lying down, Bunny settles back toward the foot)
// the duvet's shapes (each its own model, never stretched): made (spread on the bed), over (tucked over Bunny lying in
// bed), folded (folded up at the foot of the bed), floor (kicked off, in a heap on the floor)
const DUVET = {
  made: { p: [BED.x + 0.45, 1.02, BED.z], r: [0, 0, 0] },
  over: { p: [BED.x + 0.9, 1.02, BED.z], r: [0, 0, 0] },
  folded: { p: [BED.x + 1.85, 1.02, BED.z], r: [0, 0, 0] },
  floor: { p: [9.4, 0.0, 0.35], r: [0, -0.3, 0] },        // off the foot of the bed, clear of Bunny's way
};
const LAYING = (q = new T.Quaternion()) => {
  // world rotation of a body lying like Bunny (y up the body -> toward the headboard, face up and toward us)
  const qz = new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 0, 1), LIE.rz);
  const qx = new T.Quaternion().setFromAxisAngle(new T.Vector3(1, 0, 0), -LIE.roll);
  return q.copy(qx).multiply(qz);
};

// Pip watches from the back of the bathroom (between the bath and the sink), clear of every spot Bunny walks to
const PIP_AT = { bath: new T.Vector3(-7.7, 0, -3.6), tub: new T.Vector3(-12.5, 0, -3.75), bed: new T.Vector3(13.2, 0, -2.9) }, PIP_FRONT = 0.9;
const STUCK = 8;                                   // seconds without a touch before the hand shows it again
const BUNNY_AT = new Set(['hands', 'mouth', 'nose', 'earL', 'earR', 'head', 'body', 'bunny']);   // targets on Bunny
// A camera that frames the box [x0, x1, y0, y1] (at depth z) tightly, looking a little down.
function fitView([x0, x1, y0, y1], z = -1.4, { pitch = 0.24, minH = 5.4, pad = 1.08 } = {}) {
  const t = Math.tan(T.MathUtils.degToRad(camera.fov / 2));
  const h = Math.max(minH, y1 - y0, (x1 - x0) / Math.max(0.8, camera.aspect)) * pad;
  const d = h / 2 / t;
  const look = new T.Vector3((x0 + x1) / 2, (y0 + y1) / 2, z);
  return { pos: look.clone().add(new T.Vector3(0, Math.sin(pitch) * d, Math.cos(pitch) * d)), look };
}

// how a thing is held while carried, and its business end (wrapper-local) - the brush head goes to the mouth
const CARRY = {
  brush: { rot: [0.1, Math.PI, 0.25], tip: [0.44, 0.16, 0] },
  paste: { rot: [Math.PI / 2, 0, -0.2, 'ZYX'] },
  hairbrush: { rot: [0, 0, Math.PI / 2 - 0.3], tip: [0.26, 0, 0.07] },
  teddy: { rot: [0, 0, 0] },
  tissue: { rot: [0, 0, 0] },
};
// rArmX / rArmIn: extra swing on the right arm only (holding the brush, the cup, the tissue)
const newPose = () => ({ armX: 0, armIn: 0, rArmX: 0, rArmIn: 0, rub: 0, headX: 0, headY: 0, headZ: 0, lean: 0, tilt: 0, sq: 1, bend: 0, reach: 1 });
// Washing at the basin (Bunny on its step stool, tummy against the back rim; solved against prop_md_sink and checked
// from the side): IN = leaning over, both paws down inside the bowl under the spout (below the rim, above the floor);
// OUT = paws held up together just over the bowl (to be dried); REST = arms down.
const PAWS = {
  in: { armX: -1.35, armIn: 1.15, bend: 0.3, reach: 1 },
  out: { armX: -1.6, armIn: 1.1, bend: 0.35, reach: 1 },
  show: { armX: -2.0, armIn: 0.7, bend: 0.1, reach: 1 },      // paws up beside the chin: "look, messy paws!"
  rest: { armX: 0, armIn: 0, bend: 0, reach: 1 },
  bath: { armX: -0.45, armIn: 0.55, bend: 0, reach: 1 },      // in the bath: paws in front, inside the tub
};
// where the toothbrush and the paste lie while the cup is in use (relative to the sink: on the left wing of the rim)
const LEDGE = { brush: { p: [-1.5, 1.86, -0.08], r: [0, 0.12, 0] }, paste: { p: [-1.5, 1.86, 0.2], r: [0, -0.1, 0] } };
// lying down, the ears stand up off the pillow (world directions for the ear roots): long bunny ears, never through
// the headboard
const EAR_LIE = { earL1: [-0.3, 1, 0.32], earR1: [0.12, 1, -0.12] };
const WATER_Y = 1.27;                              // the bath water's level when full (just under the rim)
// the step follow-ups that move Bunny (they run on while her next step is already live)
const HUG = { armX: -1.0, armIn: 0.9 };            // Bunny's arms round Teddy
const MOVES = new Set(['hopIn', 'hopOut', 'intoBed', 'getUp']);
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
    this.sinkStream = makeStream(this.sinkSpout, SINK.y + 1.4, 0.075);
    this.bathStream = makeStream(spout(h.bath), 0.65, 0.09);
    h.group.add(this.sinkStream, this.bathStream);
    // the bath water: a soft blue surface with a light rim, just inside the tub's inner wall, rising as it fills
    this.water = makeBathWater(1.9, 0.84);
    this.water.position.set(BATH.x, 0.62, BATH.z);
    this.water.visible = false;
    h.group.add(this.water);
    // the tub's inner floor (found on the model): Bunny stands on it in the bath, its legs inside the tub, hidden
    // under the water, never through its bottom
    h.group.updateMatrixWorld(true);
    const down = new T.Raycaster(new T.Vector3(SPOTS.bath.x, 3, SPOTS.bath.z), new T.Vector3(0, -1, 0));
    const floorHit = down.intersectObject(h.bath, true).filter((x) => x.point.y < 0.9 && x.object.material?.side !== T.BackSide)[0];
    this.bathSpot = SPOTS.bath.clone().setY(floorHit ? floorHit.point.y + 0.03 : 0.62);
    this.duck = propModel('prop_duckie', { size: 0.5 });
    this.duck.visible = false;
    h.group.add(this.duck);
    this.bathFoam = [];
    // the bin is a real hollow container: a used tissue is thrown in and lands at the bottom
    physics.container(new T.Vector3(BIN.x, 0, BIN.z), { r: 0.42, h: 0.92, floor: 0.08 });
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
    // the hand towel wrapped round the paws while drying, and the big towel round Bunny's shoulders (each shown in
    // place of the hanging towel while it is in use)
    this.towelWrap = propModel('prop_md_towelwrap', { tint: [0x5fc8a8, 0xff9ec4, 0x7fb8ff][this.level] });
    this.towelWrap.visible = false; this.root.add(this.towelWrap);
    this.cape = propModel('prop_md_bathcape', { tint: 0xffa64a });
    this.cape.visible = false; this.cape.scale.setScalar(1 / BS); b.add(this.cape);
    this.foam = [];          // foam puffs on Bunny (paws, mouth, head)
    this.bubbles = [];       // soap bubbles in the air (pop them!)
    this.mess = [];          // little splats of paint / mud / jam on the paws
    this.tufts = [];         // ruffled tufts of fur on the ears (brushed smooth one by one)
    this.zs = [];
    this.offs.push(input.onMiss((x, y) => this.popAt(x, y)));
    // drag + tap targets
    for (const k of this.items) {
      const I = this.it[k];
      I.obj.userData.key = k;
      I.tok = 0;
      if (TAP_THINGS.includes(k)) {
        const r = k === 'drapes' ? 1.6 : k === 'lamp' ? 0.8 : 0.6;
        const off = k === 'drapes' ? new T.Vector3(0, 1.8, 0) : k === 'clock' ? new T.Vector3(0, 0.5, 0) : k === 'lamp' ? new T.Vector3(0, 0.6, 0) : null;
        I.tap = input.addTap(I.obj, { radius: r, offset: off, onTap: () => this.tapThing(k) });
        if (k === 'drapes') I.tap2 = input.addTap(h.drapes[1], { radius: r, offset: off, onTap: () => this.tapThing(k) });
      } else {
        const off = { towel: new T.Vector3(0, -0.4, 0), bigtowel: new T.Vector3(0, -0.5, 0), brush: new T.Vector3(0, 0.1, 0), duvet: new T.Vector3(0, 0.3, 0), teddy: new T.Vector3(0, 0.5, 0), bottle: new T.Vector3(0, 0.45, 0), sponge: new T.Vector3(0, 0.2, 0) }[k] || null;
        I.drag = this.redrag(k, { radius: k === 'duvet' ? 1.5 : k === 'teddy' || k === 'bigtowel' ? 0.9 : 0.55, offset: off });
      }
    }
    this.room = this.level === 1 ? 'bed' : 'bath';
    this.phase = 'idle';
    this.dim = 0;
    this.shown = new Set();   // the kinds of action already demonstrated
    this.reshown = 0;
    this.setupLevel();
    // the camera starts close on where the first routine happens (no wide establishing shot)
    const R0 = ROUTINES[this.plan[0].r];
    const v = (this.view = this.viewFor(R0.steps, R0.spot));
    setCamera(v.pos, v.look);
    // Pip watches from the bathroom all level (it never walks across the front of the house: it would pass right by
    // the camera); in the bedroom Bunny is on its own
    this.pipRoom = 'bath';
    this.pip.position.copy(R0.room === 'bath' ? this.pipSpot(v, 'bath') : PIP_AT.bath);
    this.pip.rotation.y = 0.35;
  }

  // ---------------- the starting picture per level ----------------
  setupLevel() {
    const b = this.bunny, h = this.house;
    // Level 2 starts early (curtains closed, Bunny asleep under the duvet); Level 3's bed is turned down for the night
    this.setDrapes(this.level === 1 ? 0 : 1, true);
    this.setDuvet(this.level === 1 ? 'over' : this.level === 2 ? 'folded' : 'made', true);
    const t = this.it.teddy;
    t.home = new T.Vector3(11.0, 0, 0.0);          // on the rug past the foot of the bed
    t.rot = new T.Euler(0, -0.3, 0);
    t.obj.position.copy(t.home); t.rn.rotation.copy(t.rot);
    t.obj.userData.still = true;   // a stuffed toy: it never sways or looks about
    if (this.level === 1) {
      // asleep in bed, the alarm clock about to ring
      this.lieDown();
      this.sleep(true);
    } else {
      // beside the step stool, ready to hop up onto it at the start of the first round
      b.position.copy(PATH_NODES.sinkR);
      b.rotation.y = -1.2;
      this.spot = null; this.node = 'sinkR';
    }
    if (this.level === 2) this.dimLights(0.25);   // evening: the lamp is on, the room a little dimmer
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
      case 'bin': return { pos: BIN.clone().setY(1.0), r: 0.8 };
      case 'bath': return { pos: new T.Vector3(BATH.x + 0.4, 1.4, BATH.z), r: 1.6 };
      case 'bed': return { pos: new T.Vector3(BED.x + 0.3, 1.3, BED.z), r: 2.2 };
      case 'pillow': return { pos: new T.Vector3(BED.x - 1.85, 1.45, BED.z), r: 1.0 };
      case 'bunny': return { pos: this.spot === 'inBed' ? this.lyingMid() : b.localToWorld(new T.Vector3(0, 1.0, 0.5)), r: 1.5 };
    }
    return { pos: b.position.clone(), r: 1 };
  }
  // the middle of Bunny lying in bed (its tummy)
  lyingMid() { return this.bunny.localToWorld(new T.Vector3(0, 0.75, 0.3)); }
  // drop zones: every target this routine uses (so a wrong thing dropped on Bunny is noticed)
  zones() {
    if (this.phase !== 'step' || !this.steps) return [];
    const ids = [...new Set(this.steps.filter((s) => s.at).map((s) => s.at))];
    return ids.map((id) => { const t = this.target(id); return { id, pos: t.pos, radius: t.r }; });
  }
  at(x = 0, y = 0, z = 0) { return this.bunny.position.clone().add(new T.Vector3(x, y, z)); }

  // ---------------- camera ----------------
  // Bunny's box (world) when at a spot: standing (on the floor, the stool, in the bath) or lying in bed
  bunnyBox(spot) {
    if (spot === 'inBed') return [BED.x - 2.9, BED.x + 2.8, 0.4, 3.9];   // (the whole bed, head to foot)
    const p = spot === 'sink' ? SPOTS.sink : spot === 'bath' ? this.bathSpot : spot ? SPOTS[spot] : this.bunny.position;
    return [p.x - 1.2, p.x + 1.2, p.y - 0.1, p.y + 4.7];   // ear tips included
  }
  // what a step needs on screen: Bunny whole (ears and feet), the thing to use and where it goes. The thing being
  // worked on fills about half the picture; nothing she needs is cut by the frame edge.
  viewFor(steps, spot) {
    let [x0, x1, y0, y1] = this.bunnyBox(spot);
    const zs = [];
    const add = (p, rx = 0.9, up = 0.8, down = 0.6) => { x0 = Math.min(x0, p.x - rx); x1 = Math.max(x1, p.x + rx); y0 = Math.min(y0, p.y - down); y1 = Math.max(y1, p.y + up); zs.push(p.z); };
    for (const st of steps) {
      const I = this.it[st.use];
      if (!I) continue;
      const p = (I.home || I.obj.position).clone();
      if (st.use === 'drapes') { p.y += 1.8; add(p, 1.4, 1.9, 1.9); }
      else if (st.use === 'towel') add(p, 0.6, 0.3, 0.9);        // (it hangs below its bar)
      else if (st.use === 'bigtowel') add(p, 0.8, 0.4, 1.1);
      else if (st.use === 'duvet') add(p, 1.6, 0.8, 0.9);
      else add(p, 0.8);
      const fixed = { bin: BIN.clone().setY(1.0), bath: new T.Vector3(BATH.x, 1.2, BATH.z), bed: new T.Vector3(BED.x, 1.3, BED.z), pillow: new T.Vector3(BED.x - 1.85, 1.45, BED.z) }[st.at];
      if (fixed) add(fixed, st.at === 'bath' ? 2.2 : st.at === 'bed' ? 2.7 : 0.9, st.at === 'bath' ? 0.9 : 0.8, st.at === 'bath' ? 1.3 : 0.6);
    }
    // at the sink the hand towel hanging under the basin is always whole in the picture (never cut by the frame)
    if (spot === 'sink') { const tw = this.it.towel; add(tw.home, 0.6, 0.3, 0.95); }
    // at the bath the whole tub is in the picture (tap, water, Bunny in it or beside it)
    if (spot === 'mat' || spot === 'bath') add(new T.Vector3(BATH.x, 0.9, BATH.z), 2.4, 1.0, 1.0);
    // frame at Bunny's depth, so a Bunny standing near the front is not cut by the frame edge
    // (things on the floor nearer the front would fall below a frame set at Bunny's depth: the frame reaches lower)
    const bz = spot === 'inBed' ? BED.z : spot === 'sink' ? SPOTS.sink.z : spot === 'bath' ? this.bathSpot.z : spot ? SPOTS[spot].z : this.bunny.position.z;
    const fz = Math.max(-2.2, Math.min(0.3, bz));
    const front = Math.max(0, ...zs.map((z) => z - fz));
    return fitView([x0, x1, Math.max(-0.2, y0) - front * 0.45, y1 + 0.3], fz, { pitch: spot === 'inBed' ? 0.3 : 0.24 });
  }
  // glide the camera to frame these steps (eased); Pip walks along to the side of the new picture
  async glideTo(v, dur = 0.9, room = this.room) {
    if (this.view && v.pos.distanceTo(this.view.pos) < 0.3 && v.look.distanceTo(this.view.look) < 0.3) return;
    this.view = v;
    const tok = (this.camTok = (this.camTok || 0) + 1);
    const p0 = camera.position.clone(), l0 = getLook().clone();
    if (room === this.pipRoom) this.pipWalk(this.pipSpot(v, room));
    this.camMoving = true;
    await this.s.anim(dur, (e) => { if (tok === this.camTok) setCamera(p0.clone().lerp(v.pos, e), l0.clone().lerp(v.look, e)); }, Ease.inOut);
    if (tok === this.camTok) this.camMoving = false;
  }
  // ---- nobody stands in the way ----
  // screen rectangle (px) of an object, or of a sphere at a point
  rectOf(obj, k = 1) {
    const b = new T.Box3().setFromObject(obj);
    if (b.isEmpty()) return null;
    const r = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
    for (let i = 0; i < 8; i++) {
      const p = project(new T.Vector3(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z));
      r.x0 = Math.min(r.x0, p.x); r.x1 = Math.max(r.x1, p.x); r.y0 = Math.min(r.y0, p.y); r.y1 = Math.max(r.y1, p.y);
    }
    const cx = (r.x0 + r.x1) / 2, cy = (r.y0 + r.y1) / 2, hw = (r.x1 - r.x0) / 2 * k, hh = (r.y1 - r.y0) / 2 * k;
    return { x0: cx - hw, x1: cx + hw, y0: cy - hh, y1: cy + hh };
  }
  rectAt(pos, rad) {
    const c = project(pos), r = screenRadius(pos, rad);
    return { x0: c.x - r, x1: c.x + r, y0: c.y - r, y1: c.y + r };
  }
  // what the child must be able to see and reach for these steps: each thing to use, and each drop spot off Bunny
  // (each with its distance from the camera)
  targetRects(steps) {
    const out = [], cam = camera.position;
    const push = (r, p) => { if (r) { r.d = cam.distanceTo(p); out.push(r); } };
    for (const st of steps) {
      const I = this.it[st.use];
      if (!I) continue;
      if (st.use === 'drapes') for (const d of this.house.drapes) push(this.rectOf(d, 0.8), d.getWorldPosition(new T.Vector3()));
      else push(this.rectOf(I.obj), I.obj.getWorldPosition(new T.Vector3()));
      if (st.at && !BUNNY_AT.has(st.at) && st.at !== 'brush') { const t = this.target(st.at); push(this.rectAt(t.pos, t.r * 0.6), t.pos); }
    }
    return out;
  }
  // Before a step: if Pip would be in front of (or overlapping on screen) anything the child needs, Pip walks out of
  // the picture first (Bunny's spots are chosen so Bunny never is).
  async keepClear(steps) {
    const T0 = this.targetRects(steps);
    const hit = (a) => a && T0.some((b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0);
    const p = this.pip, at = p.position.clone();
    const dest = this.pipDest || at;
    p.position.copy(dest); p.updateMatrixWorld(true);
    const blocked = hit(this.rectOf(p, 0.85));
    p.position.copy(at); p.updateMatrixWorld(true);
    if (blocked) {
      // out of the picture on the room's outer side, along its own strip
      const v = this.view, t = Math.tan(T.MathUtils.degToRad(camera.fov / 2));
      const halfW = t * camera.aspect * (v.pos.z - dest.z);
      const out = this.room === 'bed' ? new T.Vector3(Math.max(dest.x, v.look.x + halfW + 1.3), 0, dest.z) : new T.Vector3(Math.min(dest.x, v.look.x - halfW - 1.3), 0, dest.z);
      this.pipDest = out;
      await this.pipWalk(out);
    }
  }
  // Pip is either wholly in the picture or wholly out of it (never cut by the frame edge), on its own clear strip of
  // floor at the back of the room (away from the plants, the bed, the cabinet and Bunny's walkways)
  pipSpot(v, room) {
    // (at the bath, Pip peeps over the far end of the tub, where Bunny never stands in front of it)
    const p = room === 'bath' && v.look.x < -7.2 ? PIP_AT.tub.clone() : PIP_AT[room].clone();
    const t = Math.tan(T.MathUtils.degToRad(camera.fov / 2));
    const halfW = t * camera.aspect * (v.pos.z - p.z), R = 0.9;
    const lo = v.look.x - halfW, hi = v.look.x + halfW;
    const clamp = (x) => (room === 'bed' ? Math.min(13.4, Math.max(11.6, x)) : Math.min(-7.3, Math.max(-12.6, x)));
    const ok = (x) => (x - R > lo + 0.1 && x + R < hi - 0.1) || x + R < lo || x - R > hi;
    let x = clamp(p.x);
    if (!ok(x)) {
      const cands = [lo + R + 0.3, hi - R - 0.3, lo - R - 0.4, hi + R + 0.4].map(clamp).filter(ok);
      if (cands.length) x = cands.reduce((m, c) => (Math.abs(c - p.x) < Math.abs(m - p.x) ? c : m));
    }
    p.x = x;
    return p;
  }
  // Pip walks there (into another room: out to the front, across, and back in)
  async pipWalk(to) {
    const p = this.pip, tok = (this.pipTok = (this.pipTok || 0) + 1);
    this.pipDest = to.clone();
    const cross = Math.sign(to.x) !== Math.sign(p.position.x);
    const legs = cross ? [new T.Vector3(p.position.x, 0, PIP_FRONT), new T.Vector3(to.x, 0, PIP_FRONT), to] : [to];
    // into the other room: Pip lets Bunny go first (it never walks through Bunny on the way out)
    if (cross) { await this.wait(2.4); if (tok !== this.pipTok) return; }
    for (const b of legs) {
      const a = p.position.clone(), d = a.distanceTo(b);
      if (d < 0.05) continue;
      const r0 = p.rotation.y, yaw = Math.atan2(b.x - a.x, b.z - a.z);
      let dy = yaw - r0; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2;
      await this.s.anim(Math.max(0.6, d / 2.6), (e, q) => {
        if (tok !== this.pipTok) return;
        p.position.lerpVectors(a, b, e);
        p.rotation.y = r0 + dy * Math.min(1, q * 4);
      }, Ease.inOut);
      if (tok !== this.pipTok) return;
    }
    const r0 = p.rotation.y, end = to.x > 0 ? -0.35 : 0.35;   // turn to watch Bunny
    let dy = end - r0; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2;
    this.s.anim(0.4, (e) => { if (tok === this.pipTok) p.rotation.y = r0 + dy * e; });
  }

  // ---------------- Bunny moves ----------------
  // Every move is a walk (along the walkways, at a toddler's pace) or one small hop (up onto the stool, over the bath
  // rim, up onto the mattress). Bunny never slides, zips or snaps.
  async hopTo(to, h = 1.0, dur = 0.5, face = 0) {
    const b = this.bunny, a = b.position.clone();
    const ry0 = b.rotation.y;
    let dy = face - ry0; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2;   // shortest turn
    dur = Math.max(0.6, dur * 1.35);             // a calm hop
    await this.s.anim(0.12, (_, p) => { this.P.sq = 1 - 0.12 * p; });
    await this.s.anim(dur, (e, q) => {
      b.position.lerpVectors(a, to, e);
      b.position.y += Math.sin(q * Math.PI) * h;
      b.rotation.y = ry0 + dy * Math.min(1, e * 1.3);
      this.P.sq = q < 0.5 ? 0.88 + q * 0.4 : 1.08 - (q - 0.5) * 0.16;
    }, Ease.inOut);
    await this.s.anim(0.2, (_, p) => { this.P.sq = 1 - 0.1 * Math.sin(p * Math.PI); });
    this.P.sq = 1;
  }
  // the shortest walkway (node names) from any of `from` to any of `to`
  route(from, to) {
    const adj = {};
    for (const [a, b] of PATH_EDGES) { (adj[a] ||= []).push(b); (adj[b] ||= []).push(a); }
    const dist = {}, prev = {}, todo = new Set(Object.keys(PATH_NODES));
    for (const n of todo) dist[n] = Infinity;
    for (const [n, d0] of from) dist[n] = d0;
    while (todo.size) {
      let u = null;
      for (const n of todo) if (u === null || dist[n] < dist[u]) u = n;
      todo.delete(u);
      for (const v of adj[u] || []) { const d = dist[u] + PATH_NODES[u].distanceTo(PATH_NODES[v]); if (d < dist[v]) { dist[v] = d; prev[v] = u; } }
    }
    let end = null;
    for (const [n, d1] of to) if (end === null || dist[n] + d1 < dist[end[0]] + end[1]) end = [n, d1];
    const path = [];
    for (let n = end[0]; n; n = prev[n]) path.unshift(n);
    return path;
  }
  // which walkway node each spot is reached from (the stool from either side; the bath over its rim from beside it)
  static NODES = { sink: ['sinkR', 'sinkL'], bath: ['mat'], inBed: ['bedFront'], mat: ['mat'], rug: ['rug'], bedside: ['bedside'] };
  // get Bunny to a spot like a real toddler: off the stool / out of the bath / out of bed with one hop, then one
  // smooth walk along the walkways (never through furniture), then up onto the stool / into the bath / into bed
  async goTo(spot) {
    const b = this.bunny;
    if (spot === this.spot) return;
    const from = this.spot;
    const here = b.position.clone().setY(0);
    const starts = from ? MydayLesson.NODES[from].map((n) => [n, PATH_NODES[n].distanceTo(here)]) : [[this.node || 'bathDoor', 0]];
    const path = this.route(starts, MydayLesson.NODES[spot].map((n) => [n, 0]));
    const pts = path.map((n) => PATH_NODES[n].clone());
    const yawTo = (p, q) => Math.atan2(q.x - p.x, q.z - p.z);
    // leave where we are (hop down off the stool to the side, out over the bath rim, out of bed at the front)
    if (from === 'sink') await this.hopTo(pts[0], 0.7, 0.45, yawTo(SPOTS.sink, pts[1] || pts[0]));
    else if (from === 'bath') { this.tuckTail(false); this.pawsAt = null; this.s.tween(this.P, { ...PAWS.rest }, 0.4, Ease.inOut); await this.hopTo(pts[0], 1.6, 0.6, yawTo(this.bathSpot, pts[1] || pts[0])); }
    else if (from === 'inBed') await this.getOutOfBed(pts[0]);
    this.spot = null;
    if (this.dead) return;
    // into the other room through the doorway: the camera glides over with Bunny (as long as the walk itself)
    const room = spot === 'inBed' || spot === 'bedside' || spot === 'rug' ? 'bed' : 'bath';
    const hopAfter = spot === 'sink' || spot === 'bath' || spot === 'inBed';
    if (room !== this.room) {
      this.room = room;
      const R = this.routine;
      this.glideTo(this.viewFor(R && R.spot === spot ? (this.level === 2 ? R.steps : R.steps.slice(0, 1)) : [], spot), 1.0, room);
      this.say(room === 'bed' ? 'To the bedroom!' : 'To the bathroom!', { voice: false, max: 1.0 });
    }
    await this.walkPath(pts, { faceUs: !hopAfter });
    this.node = path[path.length - 1];
    if (this.dead) return;
    // straight on up, without stopping to turn first
    if (spot === 'sink') await this.hopTo(SPOTS.sink.clone(), 0.7, 0.45, 0);
    else if (spot === 'bath') {
      await this.hopTo(this.bathSpot.clone(), 1.6, 0.6, 0);
      this.tuckTail(true);   // tail and feet under the water (they would poke through the tub's walls)
      this.paws('rest', 0.4);
      this.splash(new T.Vector3(this.bathSpot.x, 1.35, this.bathSpot.z + 0.5), 8, 2.2);
      sfx.splash();
    } else if (spot === 'inBed') await this.climbIntoBed();
    this.spot = spot;
  }
  // in the bath the tail and the long feet are tucked away under the water (they would poke through the tub's walls)
  tuckTail(on) { const B = this.bunny.userData.bones || {}; for (const k of ['tail1', 'legL', 'legR']) if (B[k]) B[k].scale.setScalar(on ? 0.01 : 1); }
  walkTime(pts, speed = 2.4) {
    let L = 0, a = this.bunny.position.clone().setY(0);
    for (const p of pts) { L += a.distanceTo(p); a = p; }
    return L / speed + 0.4;
  }
  // one continuous walk through the points, easing in and out, turning smoothly; faceUs: turn to face the camera at
  // the end (not when a hop follows: the hop turns). Bunny walks at a calm toddler pace wherever we can see it; out of
  // the picture (between the rooms, while the camera has gone on ahead) it hurries, so it walks in at the new place
  // almost at once.
  async walkPath(pts, { speed = 3.0, faceUs = true } = {}) {
    const b = this.bunny;
    const P = [b.position.clone().setY(0), ...pts.map((p) => p.clone().setY(0))].filter((p, i, a) => i === 0 || p.distanceTo(a[i - 1]) > 0.02);
    if (P.length >= 2) {
      const L = [0];
      for (let i = 1; i < P.length; i++) L.push(L[i - 1] + P[i].distanceTo(P[i - 1]));
      const total = L[L.length - 1];
      let yaw = b.rotation.y, d = 0, v = 0;
      const n = new T.Vector3();
      await new Promise((res) => {
        const off = onFrame((dt) => {
          if (this.dead) { off(); return; }
          dt = Math.min(dt, 0.05);
          n.copy(b.position).setY(1.6).project(camera);
          const seen = Math.abs(n.x) < 1.25 && Math.abs(n.y) < 1.3;
          const top = seen ? speed : speed * 3;
          const want = Math.min(top, Math.sqrt(2 * 2.2 * Math.max(0, total - d)) + 0.15);   // eases into the stop
          v += Math.max(-7 * dt, Math.min(4 * dt, want - v));
          d = Math.min(total, d + v * dt);
          let i = 1;
          while (i < L.length - 1 && L[i] < d) i++;
          const k = (d - L[i - 1]) / Math.max(1e-6, L[i] - L[i - 1]);
          b.position.lerpVectors(P[i - 1], P[i], Math.min(1, k));
          // face the way it goes (looking a little ahead round corners)
          const ahead = P[Math.min(P.length - 1, k > 0.7 ? i + 1 : i)];
          const yw = Math.atan2(ahead.x - b.position.x, ahead.z - b.position.z);
          let dy = yw - yaw; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2;
          if (b.position.distanceTo(ahead) > 0.05) yaw += dy * Math.min(1, dt * 8);
          b.rotation.y = yaw;
          if (d >= total - 1e-4) { off(); res(); }
        });
        this.offs.push(off);
      });
    }
    // keep the heading in (-pi, pi] so a later turn never spins the long way round
    b.rotation.y = Math.atan2(Math.sin(b.rotation.y), Math.cos(b.rotation.y));
    if (!faceUs) return;
    const r0 = b.rotation.y;
    await this.s.anim(0.4, (e) => { b.rotation.y = r0 * (1 - e); }, Ease.inOut);
  }
  // ---- in and out of bed: hop up onto the mattress standing, then lie down in place (and the other way round) ----
  // k: 0 = standing on the mattress facing us, 1 = lying with the head on the pillow
  layAt(k) {
    const b = this.bunny;
    this.lieK = k;
    const q = LAYING();
    b.quaternion.identity().slerp(q, k);
    b.position.lerpVectors(STAND, LIE.feet, k);
  }
  async climbIntoBed() {
    const b = this.bunny;
    b.userData.noWalk = true;
    await this.hopTo(STAND.clone(), 1.0, 0.5, 0);
    this.bedAnim = true;
    this.s.tween(this.P, { ...(this.teddyHeld ? HUG : LIE.arms) }, 0.8, Ease.inOut);
    await this.s.anim(0.8, (e) => this.layAt(e), Ease.inOut);
    this.bedAnim = false;
    this.spot = 'inBed';
  }
  lieDown() {
    Object.assign(this.P, LIE.arms);
    this.layAt(1);
    this.spot = 'inBed';
    this.bunny.userData.noWalk = true;
  }
  async getOutOfBed(to = PATH_NODES.bedFront) {
    const b = this.bunny;
    this.bedAnim = true;
    this.s.tween(this.P, { armIn: 0, armX: 0 }, 0.7, Ease.inOut);
    await this.s.anim(0.7, (e) => this.layAt(1 - e), Ease.inOut);
    b.rotation.set(0, 0, 0);
    this.lieK = 0;
    this.bedAnim = false;
    b.userData.noWalk = false;
    await this.hopTo(to.clone(), 1.0, 0.5, 0);
  }
  sleep(on) {
    const u = this.bunny.userData, f = u.face;
    u.still = on; u.noLook = on;
    this.sleeping = on;
    if (!f) return;
    setFace(f, on ? 'calm' : 'happy');
    for (const e of f.userData.eyes || []) e.scale.y = on ? 0.12 : 1;
  }
  // ---------------- rounds ----------------
  // Rule 0: her turn starts as the round starts. If Bunny has to go somewhere first, it sets off and the camera eases
  // straight over to where the routine happens (Bunny walks in), while the first thing to use is already live. A step
  // she does before Bunny is in place plays as soon as Bunny gets there (this.arriving: Bunny in place and the set-up
  // done - messy paws shown, the sneeze coming).
  async startRound(r) {
    this.busy = true;
    this.phase = 'moving';
    this.goPending = false;
    const spec = this.plan[r];
    const R = (this.routine = ROUTINES[spec.r]);
    this.steps = R.steps;
    this.si = 0;
    // Level 3: the round's question comes first, so the walk to the next place is part of the answer
    if (this.level === 2 && R.ask) this.say(R.ask, { max: 0.1 });
    this.goal = R.spot;
    const prev = this.arriving || Promise.resolve();
    const go = prev.then(() => (this.dead || this.spot === R.spot ? null : this.goTo(R.spot)));
    if (spec.intro) this.say(spec.intro, { voice: false, max: 1.0 });
    if (spec.r === 'wake') this.ringing = true;
    this.setArriving(go.then(async () => {
      if (this.dead) return;
      if (spec.r === 'bedtime') setFace(this.bunny.userData.face, 'calm');
      // the set-up, once Bunny is there: messy paws held up to see, ruffled fur, a sneeze coming
      if (spec.mess) { this.paws('show', 0.5); this.addMess(spec.mess); }
      if (spec.r === 'hair') this.addTufts();
      if (R.pre === 'ahh') await this.ahh();
      else if (spec.mess) await this.wait(0.7);
      if (!this.dead && this.phase === 'step' && !this.busy && this.step) this.armTo(this.step);
    }));
    this.startStep();
  }
  // Bunny on its way (away: not yet in place for this step); a newer move replaces the old one in the chain
  setArriving(p) {
    const t = (this.arrTok = (this.arrTok || 0) + 1);
    this.away = true;
    this.arriving = p.then(() => { if (t === this.arrTok) this.away = false; });
  }
  async startStep() {
    if (this.dead) return;
    const st = this.step;
    // the camera takes in this step (Level 3: the whole routine, so every choice is in the picture). Her turn starts
    // straight away (the things stay where they are while the camera eases over); if Pip would stand in front of
    // anything she needs once the camera is there, Pip walks out of the picture.
    const show = this.level === 2 ? this.steps : [st];
    this.glideTo(this.viewFor(show, this.goal ?? this.spot), 1.0).then(() => { if (!this.dead) this.keepClear(show); });
    this.phase = 'step';
    this.busy = false;
    this.idle = 0;
    this.reshown = 0;
    this.rubbed = 0;
    this.clearHints();
    // Levels 1-2: the thing to use glows; Level 3: nothing (the child chooses; it glows once she is stuck)
    if (this.level < 2) this.addHalo(this.it[st.use].obj, this.haloR(st.use));
    if ((this.level < 2 || st.at === 'hands' || st.use === 'tap') && this.spot === this.goal) this.armTo(st);
    this.prompt();
    // her turn: 'Go!' every step, as soon as the step is laid out (taps never wait for the voice)
    this.goPending = true; this.goT0 = performance.now();
    // Levels 1-2: the slow hand demo the first time each kind of action comes up (Level 3: see update())
    const key = this.actionKey();
    if (this.level < 2 && key && !this.shown.has(key)) { this.shown.add(key); this.demo(); }
    this.logReady?.();
  }
  haloR(k) { return k === 'drapes' || k === 'duvet' ? 1.6 : k === 'bigtowel' || k === 'teddy' ? 0.9 : k === 'tap' || k === 'bathtap' ? 0.45 : 0.6; }
  // each kind of action (tap the tap, rub the soap on the paws, drop the duvet on the bed...) is shown once
  // (turning the tap on and turning it on again to rinse are the same action: shown once)
  actionKey(st = this.step) { return st ? `${st.how}:${st.use}:${st.at || ''}` : null; }
  // the slow hand demo on the real thing (stuck: a repeat for a stuck child; the hint ladder keeps counting)
  demo(stuck = false) {
    fx.clearHands();
    const dur = this.showHint(stuck && this.level === 2);   // (Levels 1-2 already glow)
    if (!dur) return;
    this.demoing = true;
    const tok = (this.demoTok = (this.demoTok || 0) + 1);
    this.s.wait(dur).then(() => { if (tok === this.demoTok) { this.demoing = false; if (!stuck) this.idle = 0; } });
  }
  // Level 3's first look: a slow scan over the things this routine uses (it never shows which one is next)
  scan() {
    const pts = this.choicePoints();
    if (pts.length < 2) return;
    fx.clearHands();
    fx.ghostPath(pts, { mode: 'scan' });
    this.demoing = true;
    const tok = (this.demoTok = (this.demoTok || 0) + 1);
    this.s.wait(2.5).then(() => { if (tok === this.demoTok) { this.demoing = false; this.idle = 0; } });
  }
  promptText() {
    const st = this.step;
    if (!st) return '';
    if (this.level === 2) return this.si === 0 ? this.routine.ask : 'What comes next?';
    return st.say;
  }
  // Bunny gets ready for the step: paws down in the basin for the water and the soap, up over it for the towel
  armTo(st) { return this.paws(st.at === 'hands' ? (st.use === 'towel' ? 'out' : 'in') : st.use === 'tap' ? 'in' : 'rest'); }
  paws(kind, dur = 0.7) {
    if (kind !== 'rest' && kind !== 'show' && this.spot !== 'sink') kind = 'rest';
    if (kind === 'rest' && this.spot === 'bath') kind = 'bath';   // (in the tub the paws stay inside it, over the water)
    if (kind === this.pawsAt) return Promise.resolve();     // (already there)
    this.pawsAt = kind;
    return this.s.tween(this.P, { ...PAWS[kind] }, dur, Ease.inOut);
  }
  async completeStep() {
    const st = this.step;
    this.clearHints();
    // the moves between steps (into the bath, out onto the mat, into bed, up out of bed) don't hold up her next turn:
    // the next thing is live at once and its step plays when Bunny is in place
    if (st.then === 'getUp') this.setDuvet('floor', false);   // (where the duvet will be: the next picture frames it)
    if (st.then && MOVES.has(st.then)) { const m = st.then; if (m === 'hopIn') this.goal = 'bath'; else if (m === 'hopOut') this.goal = 'mat'; this.setArriving((this.arriving || Promise.resolve()).then(() => !this.dead && this[m]())); }
    else if (st.then) await this[st.then]();
    if (this.dead) return;
    this.si++;
    if (this.si < this.steps.length) {
      // a moment to see what just happened (no extra fanfare: the step's own sound and change are enough)
      await this.wait(0.6);
      if (this.dead) return;
      this.startStep();
      return;
    }
    // the whole routine is done: Bunny's own contented reaction is the payoff (success() waits for it)
    this.phase = 'done';
    this.busy = false;
    // if the next routine happens somewhere else, Bunny sets off straight away with a happy face (no time lost
    // standing about), so it is there, or nearly, when her next turn starts
    const next = this.plan[this.round + 1] && ROUTINES[this.plan[this.round + 1].r];
    if (next && next.spot !== this.spot && next.spot !== this.goal) {
      const f = this.bunny.userData.face;
      if (f) { setFace(f, 'joy'); this.s.wait(1.0).then(() => setFace(f, 'happy')); }
      this.goal = next.spot;
      this.setArriving((this.arriving || Promise.resolve()).then(() => !this.dead && this.goTo(next.spot)));
      this.payoffP = this.wait(0.3);
    } else this.payoffP = this.react(this.routine);
    this.success(this.at(0, 3.6, 0.6), this.routine.done);
  }
  async afterSuccess() {
    if (this.spot !== 'inBed' && !this.teddyHeld) { this.s.tween(this.P, { ...PAWS.rest, rub: 0, rArmX: 0, rArmIn: 0, headX: 0 }, 0.6, Ease.inOut); this.pawsAt = 'rest'; }
    this.clearFoam();
    // (the soap bubbles are hers: they float up and pop by themselves, or she pops them)
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
    if (o.userData.wobbling) return;
    o.userData.wobbling = true;
    const r0 = o.rotation.z;
    this.s.anim(0.8, (_, p) => { o.rotation.z = r0 + Math.sin(p * Math.PI * 4) * 0.08 * (1 - p); }).then(() => { o.rotation.z = r0; o.userData.wobbling = false; });
  }
  tapThing(k) {
    if (this.dead) return;
    if (this.phase !== 'step' || this.busy) { if (!this.busy) this.wobble(this.it[k].obj); return; }
    if (!this.check(k)) return;
    this.run();
  }
  // (drag targets are only live while it is her turn - see update() - so a thing that is busy in a step's little
  // show, like the tissue at Bunny's nose, can never be grabbed out of it)
  pick(k) {
    const I = this.it[k], o = I.obj;
    I.tok++;                                     // a flight home / to a spot stops right here
    if (o.parent !== this.house.group) this.house.group.attach(o);   // (the used tissue rides in Bunny's paw)
    o.updateMatrixWorld(true);
    this.s.stop(o.position); this.s.stop(o.scale); this.s.stop(I.rn.rotation); this.s.stop(I.rn.quaternion);
    I.carrying = true;
    this.last = null;
    this.wrongRub = 0;
    o.position.z = DRAG_Z + (k === 'duvet' ? 0.6 : 0);
    // carried the way you hold it, a little bigger
    const cr = CARRY[k]?.rot;
    if (cr) I.rn.rotation.set(cr[0], cr[1], cr[2], cr[3] || 'XYZ');
    const k0 = I.scale || 1;
    if (k === 'duvet') { this.showDuvet('folded'); o.scale.setScalar(0.75); }
    else this.s.tween(o.scale, { x: k0 * 1.08, y: k0 * 1.08, z: k0 * 1.08 }, 0.25);
    if (k === 'cup') this.brushesOut();
    fx.clearHands();
    if (k === this.want()) { this.clearHints(); if (this.level < 2) this.bunny.userData.lookAmt = 1; }
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
          if (this.wrongRub > 0.25) { this.wrongRub = -99; this.wrong(k); input.remove(this.it[k].drag); this.it[k].drag = this.redrag(k); this.it[k].carrying = false; this.home(k); }
        }
      }
    }
    this.last = p;
  }
  drop(k, zone, { tapped } = {}) {
    const I = this.it[k];
    if (k === 'towel' && this.phase === 'step') this.unwrap();
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
  // make a drag target (again, when a carry is cancelled from inside the move handler)
  redrag(k, opt = {}) {
    const I = this.it[k];
    const radius = opt.radius ?? I.drag?.radius ?? 0.55, offset = opt.offset ?? I.drag?.offset ?? null;
    const snd = { towel: 'rustle', bigtowel: 'rustle', duvet: 'swoosh', teddy: 'squeak' }[k];
    return input.addDrag(I.obj, { radius, offset, minY: 0.3, sound: snd, zones: () => this.zones(), onPick: () => this.pick(k), onMove: (_t, z) => this.carry(k, z), onDrop: (z, info) => this.drop(k, z, info) });
  }
  // fly back to where it lives (an arc), and settle; a later pick or flight cancels it (tok)
  home(k, dur = 0.6) {
    const I = this.it[k], o = I.obj, rn = I.rn;
    if (!I.home) return Promise.resolve();
    if (o.parent !== this.house.group) this.house.group.attach(o);
    const tok = ++I.tok;
    const a = o.position.clone(), b = I.home.clone(), k0 = I.scale || 1;
    dur = Math.max(dur, a.distanceTo(b) / 4);         // long trips glide (Teddy across the bedroom), never whizz
    const lift = k === 'teddy' ? Math.max(0.6, Math.min(2.2, a.distanceTo(b) * 0.3)) : 0.6;
    const qa = rn.quaternion.clone(), qb = new T.Quaternion().setFromEuler(I.rot);
    const s0 = o.scale.clone();
    if (k === 'duvet') this.showDuvet(this.duvetState);
    return this.s.anim(dur, (e, q) => {
      if (tok !== I.tok) return;
      o.position.lerpVectors(a, b, e);
      o.position.y += Math.sin(q * Math.PI) * lift;
      rn.quaternion.slerpQuaternions(qa, qb, e);
      o.scale.lerpVectors(s0, new T.Vector3(k0, k0, k0), e);
    }, Ease.inOut).then(() => {
      if (tok !== I.tok) return;
      o.position.copy(b); if (rn !== o) o.rotation.z = 0; rn.rotation.copy(I.rot); o.scale.setScalar(k0);   // (the drag's lean is on the wrapper)
      if (k === 'cup') this.brushesIn();
      I.onHome?.(); I.onHome = null;
    });
  }
  // fly to a point beside a target (for the step's little show)
  flyTo(k, pos, dur = 0.55, rot = null) {
    const I = this.it[k], o = I.obj, rn = I.rn, a = o.position.clone();
    const tok = ++I.tok;
    const qa = rn.quaternion.clone(), qb = rot ? new T.Quaternion().setFromEuler(rot) : qa;
    dur = Math.max(0.5, dur * 1.8);               // calm: things glide, they don't zip
    return this.s.anim(dur, (e, q) => { if (tok !== I.tok) return; o.position.lerpVectors(a, pos, e); o.position.y += Math.sin(q * Math.PI) * 0.4; rn.quaternion.slerpQuaternions(qa, qb, e); }, Ease.inOut);
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
      const I = this.it[k], o0 = I.obj, cr = CARRY[k]?.rot;
      if (k === 'cup') this.brushesOut();
      if (cr) I.rn.rotation.set(cr[0], cr[1], cr[2], cr[3] || 'XYZ');
      o0.updateMatrixWorld(true);
      const t = this.target(st.at).pos.add(new T.Vector3(0, 0, 0.6)).sub(this.tipOf(k).sub(o0.position));
      this.flyTo(k, t, 0.3).then(async () => {
        this.busy = false;
        const o = I.obj, x0 = o.position.x;
        for (let i = 0; i < 10 && this.phase === 'step' && this.step === st; i++) {
          await this.s.anim(0.32, (_, p) => { o.position.x = x0 + Math.sin(p * Math.PI * 2) * 0.28; });
          this.rub(this.need / 5);
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
    if (now - (this.lastScrub || 0) > 420) { (st.use === 'towel' || st.use === 'bigtowel' ? sfx.rustle : sfx.scrub)(); this.lastScrub = now; }
    this.P.rub = 1;
    this.rubT = 0.5;
    this.holdT = 0.6;
    fx.clearHands();
    this[st.act + 'Tick']?.(p, before / this.need);
    if (now - (this.lastGiggle || 0) > 1300 && p < 1) { this.lastGiggle = now; setFace(this.bunny.userData.face, 'joy'); }
    if (this.rubbed >= this.need) this.run();
  }
  async run() {
    const st = this.step;
    this.busy = true;
    // (a rub finishes while she is still holding the thing: the game takes it from her finger for the little show)
    const I = this.it[st.use];
    if (I?.carrying && I.drag) { input.remove(I.drag); I.drag = this.redrag(st.use); I.carrying = false; }
    this.phase = 'acting';
    this.clearHints();
    fx.clearHands();
    input.lock(400);
    // a step done on Bunny before Bunny is in place plays as soon as it gets there (things off Bunny play at once;
    // the sink tap turns the water on at once and Bunny puts its paws under it when it arrives)
    if (this.away && BUNNY_AT.has(st.at) && st.act !== 'cuddle') await this.arriving;   // (Teddy can be given to Bunny on the way)
    else if (st.at === 'bed' || st.at === 'pillow') while (!this.dead && (this.spot === 'inBed' || this.bedAnim || this.bunny.position.y > 0.5)) await this.wait(0.1);   // (Bunny is out of bed first)
    if (this.dead) return;
    if (st.at === 'hands' || (st.use === 'tap' && st.act !== 'wet')) await this.armTo(st);
    await this[st.act](st);
    if (this.dead) return;
    if (st.how !== 'tap' && !['tissue'].includes(st.use) && !['gargle', 'spreadDuvet', 'teddyPillow', 'cuddle', 'tuckIn', 'dry', 'dryBody'].includes(st.act)) await this.home(st.use, 0.6);
    await this.completeStep();
  }

  // ---- washing paws ----
  spinKnob(k, back = true) {
    const o = this.it[k].obj, r0 = o.rotation.y;
    return this.s.anim(0.5, (e) => { o.rotation.y = r0 + e * Math.PI; }, Ease.inOut).then(() => { if (back) o.rotation.y = r0; });
  }
  // the water runs from the spout right down onto the paws in the bowl
  waterOnPaws() {
    this.sinkStream.userData.setLen(Math.max(0.15, this.sinkSpout.y - (this.hands().y + 0.16)));
    this.sinkStream.userData.set(true);
  }
  async wet() {
    this.spinKnob('tap');
    if (this.away) {
      // Bunny is still on its way: the water runs into the basin, and the paws go under it when Bunny is there
      this.sinkStream.userData.setLen(this.sinkSpout.y - SINK.y - 1.4);
      this.sinkStream.userData.set(true);
      sfx.pour();
      await this.arriving;
      if (this.dead) return;
    }
    await this.paws('in', 0.4);
    this.waterOnPaws();
    sfx.pour();
    this.P.rub = 0.6; this.rubT = 1.8;            // the paws turn about under the water
    for (let i = 0; i < 4; i++) { await this.wait(0.4); this.splash(this.hands().add(new T.Vector3(0, 0.12, 0.15)), 2, 0.9); }
    this.sinkStream.userData.set(false);
    await this.spinKnob('tap');
  }
  // rubbing the soap: the foam grows on the paws, and each little splat of mess the soap rubs over goes (foam where it
  // was); bubbles drift up now and then (never more than a few, never over Pip)
  latherTick(p) {
    const want = Math.ceil(p * 8);
    while (this.foam.filter((f) => f.userData.where === 'hands').length < want) this.addFoam('hands');
    const left = this.mess.filter((m) => !m.userData.gone);
    const keep = Math.ceil(this.messN * (1 - p) - 0.01);
    if (left.length > keep) {
      const tip = this.tipOf('soap');
      const near = left.reduce((a, m) => (m.getWorldPosition(new T.Vector3()).distanceTo(tip) < a.getWorldPosition(new T.Vector3()).distanceTo(tip) ? m : a));
      this.cleanSplat(near);
    }
    if (Math.floor(p * 3) > Math.floor((this.lastP || 0) * 3)) this.addBubble(this.hands().add(new T.Vector3(0.9 + Math.random() * 0.4, 0.4, 0.4)), 0.17 + Math.random() * 0.06);
    this.lastP = p;
  }
  async lather() {
    this.lastP = 0;
    this.latherTick(1);
    for (const m of this.mess.slice()) this.cleanSplat(m);
    await this.wait(0.5);
  }
  async rinse() {
    this.spinKnob('tap');
    await this.paws('in', 0.4);
    this.waterOnPaws();
    sfx.pour();
    // the foam slides off into the basin under the water, slowly enough to watch
    this.P.rub = 1; this.rubT = 1.6;
    const list = this.foam.filter((f) => f.userData.where === 'hands');
    list.forEach((f, i) => this.s.wait(0.25 + i * 0.14).then(() => this.dropFoam(f)));
    for (const m of this.mess.slice()) this.cleanSplat(m);
    for (let i = 0; i < 4; i++) { await this.wait(0.42); this.splash(this.hands().add(new T.Vector3(0, 0.12, 0.15)), 2, 0.9); }
    this.sinkStream.userData.set(false);
    await this.spinKnob('tap');
  }
  async autoRinse() {
    this.say('Rinse!', { voice: false, max: 0.6 });
    await this.rinse();
  }
  // as soon as the towel touches the paws it wraps round them (the soft roll), and her rubbing jiggles it
  dryTick(p) {
    const w = this.towelWrap, I = this.it.towel;
    if (!this.wrapOn) {
      this.wrapOn = true;
      this.paws('out', 0.3);
      I.obj.visible = false;
      w.visible = true; w.scale.setScalar(0.72); w.rotation.set(0, 0, 0);
    }
    const h = this.hands();
    this.wrapJig = ((this.wrapJig || 0) + 1) % 4;
    w.position.set(h.x + (this.wrapJig - 1.5) * 0.03, h.y + 0.02, h.z + 0.04);
    w.rotation.z = (this.wrapJig - 1.5) * 0.06;
    if (Math.random() < 0.12) this.splash(h.add(new T.Vector3(0, 0.1, 0.2)), 1, 0.8);
  }
  // she let go before the paws were dry: the towel unwraps (and goes home with the rest of the drop)
  unwrap() {
    if (!this.wrapOn) return;
    this.wrapOn = false;
    const w = this.towelWrap, I = this.it.towel;
    I.obj.position.copy(w.position); I.obj.visible = true; w.visible = false;
  }
  async dry() {
    // the towel wraps round both paws (held up over the bowl), rubs them dry, then goes back to its bar
    const I = this.it.towel, w = this.towelWrap;
    await this.paws('out', 0.35);
    const at = this.hands().add(new T.Vector3(0, 0.02, 0.04));
    if (this.wrapOn) { w.position.copy(at); w.visible = true; I.obj.visible = false; } else await this.swapShape(I.obj, w, at, 0.72);
    this.wrapOn = false;
    sfx.rustle();
    this.P.rub = 1; this.rubT = 1.2;
    await this.s.anim(1.2, (_, p) => {
      const h = this.hands();
      w.rotation.z = Math.sin(p * Math.PI * 4) * 0.1;
      w.position.set(h.x + Math.sin(p * Math.PI * 4) * 0.05, h.y + 0.02, h.z + 0.04);
    });
    await this.swapShape(w, I.obj, I.obj.position.copy(w.position).clone(), I.scale || 1);
    this.home('towel', 0.7);
    // Bunny looks at its clean, dry paws: two soft claps
    const a0 = this.P.armIn;
    await this.s.anim(0.9, (_, p) => { this.P.armIn = a0 - Math.abs(Math.sin(p * Math.PI * 2)) * 0.22; this.P.headX = 0.2 * bump(p); });
    this.P.armIn = a0; this.P.headX = 0;
  }
  // one thing turns into another soft shape in place (the hanging towel into the wrap and back): a quick soft pinch
  async swapShape(from, to, at, k1) {
    const s0 = from.scale.clone();
    await this.s.anim(0.14, (e) => from.scale.copy(s0).multiplyScalar(1 - 0.35 * e));
    from.visible = false; from.scale.copy(s0);
    to.position.copy(at); to.rotation.set(0, 0, 0); to.visible = true;
    await this.s.anim(0.2, (e) => to.scale.setScalar(k1 * (0.65 + 0.35 * Ease.out(e))));
  }

  // ---- teeth ----
  async squeeze() {
    const tube = this.it.paste.obj, brushHead = this.target('brush').pos;
    await this.flyTo('paste', brushHead.clone().add(new T.Vector3(0.35, 0.35, 0.3)), 0.25, new T.Euler(0, 0, 2.5));
    sfx.squeak();
    const s0 = tube.scale.clone();
    await this.s.anim(0.6, (_, p) => { tube.scale.set(s0.x, s0.y * (1 - 0.3 * bump(p)), s0.z * (1 + 0.15 * bump(p))); });
    tube.scale.copy(s0);
    const L = this.it.brush.obj.userData.model.userData.layers.paste;
    if (L) { L.mesh.visible = true; L.outline.visible = true; }
    await this.wait(0.3);
  }
  scrubTick(p) {
    const want = Math.min(3, Math.ceil(p * 3));
    while (this.foam.filter((f) => f.userData.where === 'mouth').length < want) this.addFoam('mouth');
  }
  async scrub() {
    setFace(this.bunny.userData.face, 'joy');
    const L = this.it.brush.obj.userData.model.userData.layers.paste;
    if (L) { L.mesh.visible = false; L.outline.visible = false; }
    await this.wait(0.3);
  }
  // the toothbrush and the paste stand in the cup; while the cup is in use they lie on the basin's left wing
  brushesOut() {
    for (const k of ['brush', 'paste']) {
      const I = this.it[k], L = LEDGE[k];
      if (I.carrying || I.out) continue;
      I.out = true;
      I.cupHome = I.cupHome || { home: I.home.clone(), rot: I.rot.clone() };
      I.home = new T.Vector3(SINK.x + L.p[0], L.p[1], SINK.z + L.p[2]); I.rot = new T.Euler(...L.r);
      this.home(k, 0.45);
    }
  }
  brushesIn() {
    for (const k of ['brush', 'paste']) {
      const I = this.it[k];
      if (!I.out || I.carrying) continue;
      I.out = false;
      I.home = I.cupHome.home.clone(); I.rot = I.cupHome.rot.clone();
      this.home(k, 0.45);
    }
  }
  // the cup in Bunny's paw: right arm up, the cup just under the mouth, tipped toward it
  cupAt() { return this.handPos(1).lerp(this.headAt('mouth'), 0.45).add(new T.Vector3(0, -0.14, 0.2)); }
  async gargle() {
    this.brushesOut();
    const I = this.it.cup;
    this.s.tween(this.P, { rArmX: -1.9, rArmIn: 0.6 }, 0.45, Ease.inOut);
    await this.wait(0.45);
    await this.flyTo('cup', this.cupAt(), 0.2, new T.Euler(0, 0.5, 0.75));
    // gargle gargle (the cup stays in the paw while the head tips back)
    sfx.bubble(); this.s.wait(0.35).then(() => sfx.bubble());
    await this.s.anim(1.0, (_, p) => {
      this.P.headX = -0.22 * bump(p); this.P.headZ = Math.sin(p * Math.PI * 4) * 0.04;
      I.obj.position.copy(this.cupAt());
    });
    this.P.headZ = 0;
    this.home('cup', 0.6);
    this.s.tween(this.P, { rArmX: 0, rArmIn: 0 }, 0.5, Ease.inOut);
    // lean over the basin and spit: the foam goes, two or three drops land in the bowl
    await this.s.anim(0.45, (_, p) => { this.P.headX = 0.28 * Ease.inOut(p); });
    sfx.splash();
    this.foam.filter((f) => f.userData.where === 'mouth').forEach((f) => this.dropFoam(f));
    for (let i = 0; i < 3; i++) {
      const d = makeDrop(0.05);
      const a = this.headAt('mouth').add(new T.Vector3(0, -0.05, 0.1));
      d.position.copy(a); this.root.add(d);
      const to = new T.Vector3(SINK.x - 0.2 + i * 0.2, SINK.y + 1.42, SINK.z - 0.4);
      this.s.wait(i * 0.08).then(() => this.s.anim(0.4, (e, q) => { d.position.lerpVectors(a, to, e); d.position.y += Math.sin(q * Math.PI) * 0.12; })).then(() => this.root.remove(d));
    }
    await this.wait(0.3);
    await this.s.anim(0.45, (_, p) => { this.P.headX = 0.28 * (1 - Ease.inOut(p)); });
    // a big shiny smile
    setFace(this.bunny.userData.face, 'joy');
    await this.wait(0.4);
  }

  // ---- sneeze ----
  async ahh() {
    const f = this.bunny.userData.face;
    this.say('Ah... ah...', { voice: false, max: 1.0 });
    sfx.gasp();
    setFace(f, 'scared');
    await this.s.anim(1.1, (_, p) => { this.P.headX = -0.25 * p; this.P.headZ = Math.sin(p * Math.PI * 5) * 0.04; });
    this.ahhing = true;
  }
  async atchoo() {
    const I = this.it.tissue, o = I.obj, nose = this.target('nose').pos;
    await this.flyTo('tissue', nose.clone().add(new T.Vector3(0.0, -0.1, 0.32)), 0.2, new T.Euler(0, 0, 0));
    // ATCHOO!
    sfx.whoosh();
    fx.float(this.at(1.3, 4.3, 0.6), 'Atchoo!', { color: '#4a90ff', size: 6 });
    this.bunny.userData.kick?.(new T.Vector3(0, 1.2, 2));
    await this.s.anim(0.5, (_, p) => { this.P.headX = -0.25 + 0.55 * bump(p); this.P.sq = 1 - 0.08 * bump(p); o.scale.setScalar((I.scale || 1) * (1 + 0.2 * bump(p))); });
    this.ahhing = false;
    setFace(this.bunny.userData.face, 'happy');
    this.P.headZ = 0;
    this.s.tween(this.P, { headX: 0 }, 0.3);
    // the used tissue scrunches up and Bunny holds it out in its right paw, at its side, clear of the tap
    await this.s.tween(o.scale, { x: 0.7, y: 0.7, z: 0.7 }, 0.3);
    I.scale = 0.7;
    await this.s.tween(this.P, { rArmX: -1.95, rArmIn: -0.15 }, 0.45, Ease.inOut);
    const paw = this.handPos(1).add(new T.Vector3(0.05, 0.1, 0.22));
    await this.flyTo('tissue', paw, 0.25, new T.Euler(0.3, 0.4, 0.6));
    // it stays in the paw (it moves with Bunny) until it goes in the bin
    o.position.copy(this.handPos(1).add(new T.Vector3(0.05, 0.1, 0.22)));
    this.bunny.userData.arms[1].attach(o);
    I.home = paw; I.rot = new T.Euler(0.3, 0.4, 0.6);
  }
  async binIt() {
    const I = this.it.tissue, o = I.obj, lid = this.house.lid;
    if (o.parent !== this.house.group) this.house.group.attach(o);
    this.s.tween(this.P, { rArmX: 0, rArmIn: 0 }, 0.5, Ease.inOut);
    // the lid flips up, the tissue drops in, the lid shuts
    this.s.tween(lid.rotation, { x: -1.6 }, 0.4, Ease.inOut);
    await this.wait(0.4);
    // a real throw: up over the rim and down into the bin
    await physics.toss(o, new T.Vector3(BIN.x, 0.25, BIN.z + 0.05), { arc: 0.7, shape: 'ball', r: 0.13, bounce: 0.15, maxT: 0.8 });
    physics.remove(o);
    o.visible = false;
    sfx.thunk();
    await this.wait(0.2);
    await this.s.tween(lid.rotation, { x: 0 }, 0.4, Ease.inOut);
    // a fresh tissue peeps up out of the box
    I.home = TISSUE_HOME.clone();
    I.rot = new T.Euler(-0.25, -0.2, 0.15);
    I.scale = 1;
    o.position.copy(I.home).add(new T.Vector3(0, -0.25, 0)); o.rotation.set(0, 0, 0); I.rn.rotation.copy(I.rot); o.scale.setScalar(1);
    o.visible = true;
    this.s.tween(o.position, { y: I.home.y }, 0.5, Ease.out);
  }

  // ---- bath ----
  async fill() {
    this.spinKnob('bathtap');
    this.bathStream.userData.set(true);
    this.water.visible = true;
    this.water.position.y = 0.62;
    sfx.pour();
    this.s.wait(1.0).then(() => sfx.pour());
    await this.s.anim(2.0, (e) => { this.water.position.y = 0.62 + e * (WATER_Y - 0.62); this.water.userData.setLevel(this.water.position.y); }, Ease.out);
    this.bathStream.userData.set(false);
    this.spinKnob('bathtap');
    // the rubber duck bobs up
    this.duck.position.set(BATH.x - 1.0, WATER_Y, BATH.z + 0.2);
    this.duck.rotation.y = 0.6;
    popIn(this.s, this.duck, 1, 0.6, { sound: false });
    await this.wait(0.4);
  }
  async pourBubbles() {
    await this.flyTo('bottle', new T.Vector3(BATH.x + 0.1, 2.15, BATH.z + 0.45), 0.3, new T.Euler(0, 0, 2.2));
    sfx.pour();
    // soft heaps of foam on the water, inside the tub's walls, leaving the duck and Bunny's place clear
    const spots = [];
    for (let tries = 0; spots.length < 13 && tries < 200; tries++) {
      const x = (Math.random() * 2 - 1) * 1.35, z = (Math.random() * 2 - 1) * 0.4;
      if (Math.hypot((x + 1.0) / 1.3, z / 0.5) < 0.45) continue;                       // the duck
      if (spots.some(([a, b]) => Math.hypot(a - x, b - z) < 0.34)) continue;
      spots.push([x, z]);
    }
    spots.forEach(([x, z], i) => this.s.wait(i * 0.1).then(() => {
      const f = makeFoam(0.2 + Math.random() * 0.12);
      f.position.set(BATH.x + x, WATER_Y + 0.02, BATH.z + z);
      f.scale.y = 0.75;
      this.root.add(f);
      this.bathFoam.push(f);
      popIn(this.s, f, 1, 0.45, { sound: false });
      if (i % 6 === 2) this.addBubble(f.position.clone().add(new T.Vector3(0, 0.5, 0.3)), 0.18 + Math.random() * 0.08);
    }));
    await this.wait(1.5);
  }
  async hopIn() {
    this.goal = 'bath';
    await this.goTo('bath');
    setFace(this.bunny.userData.face, 'joy');
    this.s.wait(0.9).then(() => setFace(this.bunny.userData.face, 'happy'));
    this.armTo(this.step);
  }
  soapyTick(p) {
    const want = Math.ceil(p * 6);
    while (this.foam.filter((f) => f.userData.where === 'top').length < want) this.addFoam('top');
  }
  async soapy() {
    for (let i = 0; i < 2; i++) this.addBubble(this.headAt('top').add(new T.Vector3(1.2 + i * 0.6, 0.3 + i * 0.3, 0.4)), 0.18 + Math.random() * 0.06);
    await this.wait(0.5);
  }
  async hopOut() {
    // splash the foam off, out over the rim onto the mat; the bath drains away
    this.foam.filter((f) => f.userData.where === 'top').forEach((f) => this.dropFoam(f));
    this.goal = 'mat';
    await this.goTo('mat');
    this.drain();
  }
  drain() {
    const w = this.water, y0 = w.position.y;
    for (const f of this.bathFoam.splice(0)) this.s.anim(1.6, (e) => { f.scale.setScalar(Math.max(0.001, 1 - e)); f.position.y = w.position.y + 0.02; }).then(() => this.root.remove(f));
    this.s.tween(this.duck.scale, { x: 0.001, y: 0.001, z: 0.001 }, 1.2).then(() => { this.duck.visible = false; });
    this.s.anim(1.8, (e) => { w.position.y = y0 - e * (y0 - 0.62); w.userData.setLevel(w.position.y); }).then(() => { w.visible = false; });
  }
  dryBodyTick(p) { if (Math.random() < 0.25) this.splash(this.at(0, 2.2, 0.6), 1, 1.2); }
  async dryBody() {
    // the big towel wraps round Bunny's shoulders: a cosy wiggle dry, then it goes back over the bath's rim
    const I = this.it.bigtowel, c = this.cape;
    this.s.tween(this.P, { armX: -0.45, armIn: 0.55 }, 0.3, Ease.inOut);    // paws in front of the tummy
    await this.swapShape(I.obj, c, new T.Vector3(0, 0, 0), 1 / BS);
    sfx.rustle();
    setFace(this.bunny.userData.face, 'joy');
    await this.s.anim(1.1, (_, p) => { this.P.tilt = Math.sin(p * Math.PI * 5) * 0.07 * (1 - p); c.rotation.y = Math.sin(p * Math.PI * 5) * 0.06 * (1 - p); });
    this.P.tilt = 0; c.rotation.y = 0;
    await this.wait(0.4);
    const wp = this.bunny.localToWorld(new T.Vector3(0, 1.0, 0.3));
    await this.swapShape(c, I.obj, wp, I.scale || 1);
    this.s.tween(this.P, { armX: 0, armIn: 0 }, 0.4, Ease.inOut);
    this.home('bigtowel', 0.8);
    setFace(this.bunny.userData.face, 'happy');
  }

  // ---- hair: ruffled tufts of fur on the ears, brushed smooth one by one ----
  addTufts() {
    const u = this.bunny.userData;
    this.tufts = [];
    for (const side of ['L', 'R']) {
      const bone = u.bones[`ear${side}2`] || u.bones[`ear${side}1`];
      if (!bone) continue;
      for (let i = 0; i < 3; i++) {
        const t = makeTuft(0.3 + i * 0.03);
        const s = side === 'L' ? -1 : 1;
        // along the outer edge of the ear, pointing out
        t.position.set(s * (0.13 + 0.02 * i), -0.1 + i * 0.18, 0.02);
        t.rotation.z = s * (-0.9 - 0.2 * i);
        t.userData.side = side;
        t.userData.k = 1 / BS;
        t.scale.setScalar(0.001);
        bone.add(t);
        this.s.wait(0.1 + i * 0.12).then(() => this.s.tween(t.scale, { x: t.userData.k, y: t.userData.k, z: t.userData.k }, 0.3, Ease.out));
        this.tufts.push(t);
      }
    }
  }
  smoothTuft(t) {
    if (t.userData.gone) return;
    t.userData.gone = true;
    const r0 = t.rotation.z, k = t.userData.k;
    this.s.anim(0.35, (e) => { t.rotation.z = r0 * (1 - e); t.scale.set(k * (1 - e * 0.9), k * (1 - e), k); }, Ease.inOut).then(() => t.parent && t.parent.remove(t));
  }
  fluffTick(p, before) {
    const side = this.step.at === 'earL' ? 'L' : 'R';
    const mine = this.tufts.filter((t) => t.userData.side === side && !t.userData.gone);
    const keep = 3 - Math.floor(p * 3 + 0.001);
    if (mine.length > keep) {
      const tip = this.tipOf('hairbrush');
      mine.sort((a, b) => a.getWorldPosition(new T.Vector3()).distanceTo(tip) - b.getWorldPosition(new T.Vector3()).distanceTo(tip));
      this.smoothTuft(mine[0]);
    }
  }
  async fluff(st) {
    const side = st.at === 'earL' ? 'L' : 'R';
    for (const t of this.tufts.filter((x) => x.userData.side === side)) this.smoothTuft(t);
    // a happy little shake of the head: smooth, soft ears
    await this.s.anim(0.6, (_, p) => { this.P.headZ = Math.sin(p * Math.PI * 2) * 0.06 * (1 - p); });
    this.P.headZ = 0;
  }

  // ---- bedroom ----
  async wakeUp() {
    this.ringing = false;
    const c = this.house.clock;
    c.rotation.z = 0; c.position.y = 1.4;
    sfx.tick();
    for (const z of this.zs.splice(0)) this.s.tween(z.scale, { x: 0.001, y: 0.001, z: 0.001 }, 0.3).then(() => this.root.remove(z));
    // eyes open, a big yawn and a stretch
    this.sleep(false);
    setFace(this.bunny.userData.face, 'scared');
    sfx.aww();
    await this.s.anim(1.2, (_, p) => { this.P.armX = -0.5 * bump(p); this.P.armIn = -0.7 * bump(p); this.P.sq = 1 + 0.04 * bump(p); });
    setFace(this.bunny.userData.face, 'happy');
  }
  setDrapes(open, now = false) {
    const W = this.house.drapes, x = BED.x;
    const pose = (d, o) => ({ px: x + d.userData.side * (o ? 1.95 : 0.78), sx: o ? 0.62 : 1.0 });
    const go = W.map((d) => {
      const to = pose(d, open);
      if (now) { d.position.x = to.px; d.scale.x = to.sx; return null; }
      const px0 = d.position.x, sx0 = d.scale.x;
      return this.s.anim(0.9, (e) => { d.position.x = px0 + (to.px - px0) * e; d.scale.x = sx0 + (to.sx - sx0) * e; }, Ease.inOut);
    });
    this.drapesOpen = !!open;
    return now ? Promise.resolve() : Promise.all(go);
  }
  async openDrapes() {
    sfx.swoosh();
    await this.setDrapes(1);
    // morning light
    for (const w of [this.house.bedWin, this.house.bathWin]) { w.material.map = viewTex('day'); w.material.needsUpdate = true; }
  }
  async getUp() {
    // out of bed: the duvet slides off onto the floor first, then Bunny sits up, hops down and goes round to the head
    // of the bed (the camera takes in the whole bed first, so Bunny never walks up close to it)
    await this.duvetTo('floor', 1.0);
  }
  showDuvet(state) {
    const parts = this.it.duvet.parts;
    for (const k in parts) parts[k].visible = k === state;
  }
  setDuvet(state, now = true) {
    const I = this.it.duvet, S = DUVET[state];
    I.home = new T.Vector3(...S.p); I.rot = new T.Euler(...S.r);
    I.scale = 1;
    this.duvetState = state;
    if (now) { I.obj.position.copy(I.home); I.rn.rotation.copy(I.rot); I.obj.scale.setScalar(1); this.showDuvet(state); }
  }
  // the duvet moves (an arc) and changes shape on the way, with a soft pinch
  duvetTo(state, dur = 0.8) {
    const I = this.it.duvet, o = I.obj, rn = I.rn;
    const tok = ++I.tok;
    const a = o.position.clone(), qa = rn.quaternion.clone(), sa = o.scale.x;
    this.setDuvet(state, false);
    const qb = new T.Quaternion().setFromEuler(I.rot);
    let swapped = false;
    return this.s.anim(dur, (e, q) => {
      if (tok !== I.tok) return;
      o.position.lerpVectors(a, I.home, e); o.position.y += Math.sin(q * Math.PI) * 0.7;
      rn.quaternion.slerpQuaternions(qa, qb, e);
      if (!swapped && q > 0.5) { swapped = true; this.showDuvet(state); }
      o.scale.setScalar((sa + (1 - sa) * e) * (1 - 0.2 * Math.sin(q * Math.PI)));
    }, Ease.inOut).then(() => { if (tok === I.tok) { o.position.copy(I.home); rn.rotation.copy(I.rot); o.scale.setScalar(1); this.showDuvet(state); } });
  }
  async spreadDuvet() {
    sfx.swoosh();
    await this.duvetTo('made', 0.9);
  }
  // Teddy sits on the pillow, leaning back on the headboard
  async teddyPillow() {
    const t = this.it.teddy;
    t.home = new T.Vector3(BED.x - 2.15, 1.32, BED.z + 0.05); t.rot = new T.Euler(-0.25, 0.25, 0);
    t.sit = true;
    await this.home('teddy', 0.7);
    sfx.squeak();
  }
  async closeDrapes() {
    sfx.swoosh();
    await this.setDrapes(0);
    this.dimLights(0.45);
  }
  async intoBed() {
    this.goal = 'inBed';
    await this.goTo('inBed');
    setFace(this.bunny.userData.face, 'calm');
  }
  // Teddy goes into Bunny's arms, against its tummy, wherever Bunny is (Bunny may still be on its way to bed: it
  // carries Teddy there). Teddy then belongs to Bunny: it lies down with it and stays under the duvet with it.
  async cuddle() {
    const I = this.it.teddy, o = I.obj, b = this.bunny;
    I.sit = false;
    I.tok++;
    if (o.parent !== this.house.group) this.house.group.attach(o);
    const local = new T.Vector3(-0.18, 0.3, 0.6), lq = new T.Quaternion().setFromEuler(new T.Euler(0.2, 0, 0));
    const a = o.position.clone(), qa = o.quaternion.clone(), wq = new T.Quaternion();
    sfx.squeak();
    await this.s.anim(Math.max(0.7, a.distanceTo(b.position) / 5), (e, q) => {
      b.updateMatrixWorld(true);
      o.position.lerpVectors(a, b.localToWorld(local.clone()), e);
      o.position.y += Math.sin(q * Math.PI) * 0.8;
      o.quaternion.slerpQuaternions(qa, b.getWorldQuaternion(wq).multiply(lq), e);
    }, Ease.inOut);
    b.add(o);
    o.position.copy(local); o.quaternion.copy(lq); o.scale.setScalar((I.scale || 0.42) / BS);
    this.teddyHeld = true;
    // a hug
    sfx.mmm();
    setFace(b.userData.face, 'joy');
    await this.s.tween(this.P, { ...HUG }, 0.6, Ease.inOut);
    setFace(b.userData.face, this.spot === 'inBed' ? 'calm' : 'happy');
    await this.wait(0.3);
  }
  async tuckIn() {
    sfx.swoosh();
    await this.duvetTo('over', 0.9);
    setFace(this.bunny.userData.face, 'calm');
  }
  async lightsOff() {
    const h = this.house;
    sfx.tick();
    h.shade.material.color.setHex(0x8a7a6a);
    h.pool.visible = false;
    this.dimLights(0.7);
    // glow-in-the-dark stars come out on the wall above the bed, Bunny's eyes close
    for (let i = 0; i < 9; i++) {
      const s = makeTwinkle(0.12 + Math.random() * 0.08, [0xffe27a, 0xbfe8ff, 0xffc2e0][i % 3]);
      s.position.set(BED.x - 3.6 + i * 0.9 + Math.random() * 0.3, 3.3 + ((i * 7) % 5) * 0.32, -4.55);
      this.root.add(s);
      s.visible = false;
      const k = s.scale.x;
      this.s.wait(0.3 + i * 0.16).then(() => { s.visible = true; s.scale.setScalar(0.001); this.s.tween(s.scale, { x: k, y: k, z: k }, 0.4, Ease.out); });
    }
    this.sleep(true);
    await this.wait(1.4);
  }
  dimLights(k) {
    if (!this.lights) { this.lights = []; scene.traverse((o) => { if (o.isLight) this.lights.push([o, o.intensity]); }); }
    for (const [l, i0] of this.lights) l.intensity = i0 * (1 - k);
    this.dim = k;
  }

  // ---------------- payoffs ----------------
  // Bunny's own reaction when a routine is done (no twirl, no confetti): a contented look at its clean paws, a big
  // smile, a cosy wiggle; asleep, a few slow Zs. Animated back to where it was, never snapped.
  react(R) {
    const f = this.bunny.userData.face;
    if (this.sleeping) {
      for (let i = 0; i < 3; i++) this.s.wait(i * 0.35).then(() => this.floatZ());
      return this.wait(1.0);
    }
    if (f) { setFace(f, 'joy'); this.s.wait(1.1).then(() => setFace(f, 'happy')); }
    const P = this.P;
    if (this.spot === 'sink' && (R === ROUTINES.hands || R === ROUTINES.sneeze)) {
      // paws up in front: a look at them, nice and clean
      const a = { ...P };
      return this.s.tween(P, { armX: -1.25, armIn: 1.0, bend: 0.12, headX: 0.25 }, 0.5, Ease.inOut)
        .then(() => this.wait(0.5))
        .then(() => this.s.tween(P, { armX: a.armX, armIn: a.armIn, bend: a.bend, headX: 0 }, 0.5, Ease.inOut));
    }
    // a contented little wiggle
    return this.s.anim(1.0, (_, p) => { P.tilt = this.spot === 'inBed' ? 0 : Math.sin(p * Math.PI * 3) * 0.05 * (1 - p); P.headZ = Math.sin(p * Math.PI * 2) * 0.07 * (1 - p); })
      .then(() => { P.tilt = 0; P.headZ = 0; });
  }
  floatZ() {
    const z = makeZ(0.25 + Math.random() * 0.1);
    const a = this.headAt('top').add(new T.Vector3(0.3, 0.4, 0.4));
    z.position.copy(a);
    this.root.add(z);
    this.zs.push(z);
    this.s.anim(1.8, (e) => { z.position.set(a.x + e * 0.6 + Math.sin(e * 6) * 0.15, a.y + e * 1.2, a.z); z.scale.setScalar((0.25 + 0.1) * Math.sin(Math.min(1, e * 1.4) * Math.PI)); }).then(() => { this.root.remove(z); this.zs = this.zs.filter((x) => x !== z); });
  }
  tickle() {
    if (this.dead || this.sleeping || this.tickling || this.spot === 'inBed') return;
    this.tickling = true;
    sfx.giggle();
    const f = this.bunny.userData.face;
    if (f) { setFace(f, 'joy'); this.s.wait(0.6).then(() => setFace(f, 'happy')); }
    this.s.anim(0.45, (_, p) => { this.P.tilt = Math.sin(p * Math.PI * 4) * 0.06; this.P.sq = 1 + 0.04 * Math.sin(p * Math.PI * 2); }).then(() => { this.P.tilt = 0; this.P.sq = 1; this.tickling = false; });
  }

  // ---------------- foam, bubbles, drops, mess ----------------
  addFoam(where) {
    const u = this.bunny.userData;
    const n = this.foam.filter((x) => x.userData.where === where).length;
    const f = makeFoam(where === 'mouth' ? 0.06 + 0.015 * n : 0.08 + Math.random() * 0.05);
    f.userData.where = where;
    const sc = 1 / BS;
    if (where === 'hands') {
      const i = n % 2, bone = u.arms[i], tip = this.handTip[i];
      const a = n * 2.3;
      f.position.copy(tip).add(new T.Vector3(Math.cos(a) * 0.1, Math.sin(a) * 0.1, 0.06));
      f.scale.setScalar(sc);
      bone.add(f);
    } else {
      const base = where === 'mouth' ? this.headPt.mouth : this.headPt.top;
      const a = n * 2.1, r = where === 'mouth' ? 0.05 + n * 0.03 : Math.min(0.28, 0.12 + n * 0.04);
      f.position.copy(base).add(new T.Vector3(Math.cos(a) * r * (where === 'mouth' ? 1.6 : 1.3), Math.sin(a) * r * 0.45 + (where === 'mouth' ? -0.03 : -0.02), where === 'mouth' ? 0.03 : 0));
      f.scale.set(sc, sc * (where === 'mouth' ? 0.7 : 0.85), sc);
      u.head.add(f);
    }
    this.foam.push(f);
    const k = f.scale.clone();
    f.scale.multiplyScalar(0.001);
    this.s.tween(f.scale, { x: k.x, y: k.y, z: k.z }, 0.22, Ease.out);
  }
  dropFoam(f) {
    this.foam = this.foam.filter((x) => x !== f);
    const w = f.getWorldPosition(new T.Vector3());
    f.parent && f.parent.remove(f);
    f.position.copy(w); f.scale.setScalar(1);
    this.root.add(f);
    const y1 = this.spot === 'bath' ? WATER_Y : this.spot === 'sink' ? SINK.y + 1.42 : 0.05;
    this.s.anim(0.4, (e) => { f.position.y = w.y + (y1 - w.y) * e; f.scale.setScalar(1 - e * 0.7); }, Ease.in).then(() => this.root.remove(f));
  }
  clearFoam() { for (const f of this.foam.slice()) this.dropFoam(f); }
  // a few small glossy splats on each paw pad (paint, mud or jam)
  addMess(kind) {
    this.mess = [];
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      const m = makeMess(kind, i * 3 + j * 1.7 + Math.random());
      m.userData.k = j ? 0.75 : 1;
      m.userData.arm = i;
      m.userData.off = new T.Vector2((j ? 0.07 : -0.03) * (i ? 1 : -1), j ? -0.06 : 0.03);
      m.scale.setScalar(0.001);
      this.root.add(m);
      this.s.wait(0.08 * (i * 2 + j)).then(() => this.s.tween(m.scale, { x: m.userData.k, y: m.userData.k, z: m.userData.k }, 0.3, Ease.out));
      this.mess.push(m);
    }
    this.messN = this.mess.length;
    this.placeMess();
  }
  // the splats sit on the side of each paw we can see (always facing the camera), so the mess is always readable
  placeMess() {
    const cam = camera.position, up = new T.Vector3(0, 1, 0);
    for (const m of this.mess) {
      const h = this.handPos(m.userData.arm);
      const d = cam.clone().sub(h).normalize();
      const right = new T.Vector3().crossVectors(up, d).normalize(), u2 = new T.Vector3().crossVectors(d, right);
      m.position.copy(h).addScaledVector(d, 0.19).addScaledVector(right, m.userData.off.x).addScaledVector(u2, m.userData.off.y);
      m.lookAt(cam);
    }
  }
  // a splat is rubbed away: it shrinks and fades, a puff of foam where it was
  cleanSplat(m) {
    if (m.userData.gone) return;
    m.userData.gone = true;
    const k = m.scale.x;
    this.s.anim(0.4, (e) => { m.scale.setScalar(Math.max(0.001, k * (1 - e))); m.traverse((o) => { if (o.material) o.material.opacity = 1 - e; }); })
      .then(() => { m.parent && m.parent.remove(m); this.mess = this.mess.filter((x) => x !== m); });
  }
  addBubble(pos, r) {
    // a few at a time, never in a heap, drifting up and away to the right (Pip watches from the other side)
    if (this.bubbles.length >= 4 || this.bubbles.some((b) => b.position.distanceTo(pos) < 0.8)) return;
    const b = makeSoapBubble(r);
    b.position.copy(pos);
    this.root.add(b);
    Object.assign(b.userData, { life: 3.6 + Math.random() * 1.2, ph: Math.random() * 6, vx: 0.25 + Math.random() * 0.35, k: r });
    this.bubbles.push(b);
    b.scale.setScalar(0.001);
    this.s.tween(b.scale, { x: r, y: r, z: r }, 0.25, Ease.out);
  }
  popBubble(b, loud = true) {
    const i = this.bubbles.indexOf(b);
    if (i < 0) return;
    this.bubbles.splice(i, 1);
    if (loud) sfx.pop();
    const k = b.userData.k * 1.5;
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
  // water drops fly out a little, fall and dry up
  splash(pos, n = 8, up = 2.5) {
    for (let i = 0; i < Math.min(n, 10); i++) {
      const r = 0.045 + Math.random() * 0.025;
      const d = makeDrop(r);
      d.position.copy(pos);
      this.root.add(d);
      const v = new T.Vector3((Math.random() - 0.5) * 1.8, up * (0.6 + Math.random() * 0.5), 0.4 + Math.random() * 0.6);
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
  // a stuck child: the thing to use gently bobs or wobbles, then glows (no boing)
  nudge(step) {
    const st = this.step;
    if (!st || this.phase !== 'step') return;
    const o = this.targetObj(st);
    if (!o) return;
    if (this.level === 2 && step < 2) return;   // Level 3: the choice stays the child's a little longer
    if (TAP_THINGS.includes(st.use) || st.use === 'duvet' || st.use === 'teddy' || this.it[st.use].carrying) this.wobble(o);
    else if (!o.userData.bobbing) {
      o.userData.bobbing = true;
      const y0 = o.position.y;
      this.s.anim(0.9, (_, p) => { o.position.y = y0 + Math.sin(p * Math.PI) * 0.25; }, Ease.inOut).then(() => { o.position.y = y0; o.userData.bobbing = false; });
    }
    if (step >= 2) { const stop = fx.halo(o, this.haloR(st.use)); this.s.wait(3).then(stop); }
  }
  // the slow ghost-hand demo on the real thing; returns how long it takes (s)
  showHint(glow = true) {
    const st = this.step;
    if (!st || this.phase !== 'step') return 0;
    const o = this.targetObj(st);
    const from = o.getWorldPosition(new T.Vector3()).add(new T.Vector3(0, st.use === 'drapes' ? 1.8 : st.use === 'teddy' ? 0.5 : st.use === 'towel' ? -0.35 : st.use === 'bigtowel' ? -0.45 : 0.3, 0));
    if (glow) this.addHalo(o, this.haloR(st.use));
    if (st.how === 'tap') { fx.ghostPath([from], { mode: 'tap', maxDur: 4 }); return 2.0; }
    // pick it up, carry it over (lifted a little), then let go there / rub there
    const to = this.target(st.at).pos;
    const mid = from.clone().lerp(to, 0.5); mid.y = Math.max(from.y, to.y) + 0.6;
    fx.ghostPath([from, mid, to], { mode: st.how === 'rub' ? 'rub' : 'drag', maxDur: 5 });
    return st.how === 'rub' ? 4.0 : 3.4;
  }
  // Level 3's look: the hand hops over the things this routine uses (in a jumbled order), never showing which is next
  choicePoints() {
    const keys = [...new Set((this.steps || []).map((st) => st.use))];
    const order = keys.length > 1 ? [...keys.slice(1), keys[0]] : keys;
    return order.map((k) => this.it[k].obj.getWorldPosition(new T.Vector3()).add(new T.Vector3(0, k === 'drapes' ? 1.8 : 0.3, 0)));
  }
  makeErrorless() {
    const st = this.step;
    if (!st || this.phase !== 'step') return;
    this.need *= 0.5;
    this.addHalo(this.targetObj(st), this.haloR(st.use));
  }
  nextRound() { this.need = NEED[this.level]; super.nextRound(); }

  // ---------------- the ending ----------------
  // bedtime ends quietly (no rain, no chime, a silent sticker) over the sleeping Bunny
  get quietEnding() { return !!this.sleeping; }
  // the picture of what she did: clean, happy Bunny (about half the screen), or Bunny asleep in the dark room
  creationView() {
    const v = this.spot === 'inBed' ? fitView(this.bunnyBox('inBed'), BED.z, { pitch: 0.3, minH: 4.6 }) : fitView(this.bunnyBox(this.spot), this.spot === 'sink' ? -1.2 : this.bunny.position.z, { minH: 8.0, pad: 1.0 });
    return { pos: v.pos, look: v.look, dur: 1.2 };
  }
  creationObjects() { return [this.bunny]; }
  onAdmirePoke() { if (this.sleeping) this.floatZ(); else this.tickle(); }
  async showOff() {
    hushEffects(0.5, { cut: true });
    if (this.sleeping) {
      // a slow pull back from the bed: the dark room, the night light of the stars, Bunny fast asleep
      const v = fitView([BED.x - 4.4, BED.x + 3.4, 0, 5.4], BED.z, { pitch: 0.24 });
      await this.glideCamera(v.pos, v.look, 2.5);
      return;
    }
    const v = this.creationView();
    await this.glideCamera(v.pos, v.look, v.dur);
  }
  onFinale() {
    if (this.sleeping) return;
    // a few soap bubbles to pop while she looks (spaced out, below the caption)
    for (let i = 0; i < 5; i++) this.s.wait(i * 0.3).then(() => this.addBubble(this.at(-2.6 + i * 1.3, 2.0 + (i % 2) * 0.6, 1.2), 0.2 + Math.random() * 0.08));
  }
  dispose() {
    if (this.lights) for (const [l, i0] of this.lights) l.intensity = i0;
    super.dispose();
  }

  // ---------------- every frame ----------------
  update(dt, t) {
    const b = this.bunny, u = b.userData, P = this.P;
    // only her turn has live drag targets (nothing can be grabbed out of a step's little show)
    const live = this.phase === 'step' && !this.busy;
    for (const k of this.items) { const I = this.it[k]; if (I.drag) I.drag.enabled = (live || !!I.carrying) && !(k === 'teddy' && this.teddyHeld); }
    // show how: the first time each kind of action comes up (Level 3: only a look over the choices, after a few
    // seconds of waiting), and the real demo again for a stuck child (~8 s, 18 s, 28 s without a touch)
    if (live && !this.demoing && !this.camMoving && !input.dragging()) {
      const key = this.actionKey();
      if (this.idle < 0.5) this.reshown = 0;
      if (key && !this.shown.has(key) && this.idle >= (this.level === 2 ? 4 : 0.7)) { this.shown.add(key); if (this.level === 2) this.scan(); else this.demo(); }
      else if (this.reshown < 3 && this.idle > STUCK + this.reshown * 10) { this.reshown++; this.demo(true); }
    }
    this.sinkStream.userData.update(dt, t);
    this.bathStream.userData.update(dt, t);
    this.water.userData.update?.(dt, t);
    // holding the toothbrush: the right paw comes up to it while she brushes
    if (this.holdT > 0) this.holdT -= dt;
    const hold = this.step?.use === 'brush' && this.phase === 'step' && this.holdT > 0 ? 1 : 0;
    this.holdK = (this.holdK || 0) + (hold - (this.holdK || 0)) * Math.min(1, dt * 6);
    // pose -> rig
    const ra = this.rest.arms;
    if (this.rubT > 0) { this.rubT -= dt; if (this.rubT <= 0) P.rub = 0; }
    const w = Math.sin(t * 11) * 0.1 * P.rub;
    const rx = P.rArmX - 1.9 * this.holdK, rin = P.rArmIn + 0.6 * this.holdK;
    u.arms[0].rotation.set(ra[0].x + P.armX + w, ra[0].y, ra[0].z - P.armIn);
    u.arms[1].rotation.set(ra[1].x + P.armX + rx - w, ra[1].y, ra[1].z + P.armIn + rin);
    for (const a of u.arms) a.scale.set(1, P.reach, 1);
    if (u.body && u.body !== b && u.body.isBone) u.body.rotation.x = P.bend;
    if (u.head) { u.head.rotation.x = P.headX; u.head.rotation.y = P.headY; u.head.rotation.z = P.headZ; }
    if (this.spot !== 'inBed' && !this.bedAnim) { b.rotation.x = P.lean; b.rotation.z = P.tilt; }
    // lying down, the ears stand up off the pillow (lying back they would go through the headboard)
    const lie = this.lieK || 0;
    if (lie > 0.001 || this.lastLie > 0.001) {
      this.lastLie = lie;
      // each ear root turns so the ear stands up off the pillow, a little apart (a world direction)
      b.updateMatrixWorld(true);
      for (const k of ['earL1', 'earR1']) {
        const e = u.bones[k];
        if (!e) continue;
        e.quaternion.copy(e.userData.q0);
        e.updateMatrixWorld(true);
        const pq = e.parent.getWorldQuaternion(new T.Quaternion()), wq = e.getWorldQuaternion(new T.Quaternion());
        const axis = new T.Vector3(0, 1, 0).applyQuaternion(wq);
        const want = new T.Vector3(...EAR_LIE[k]).normalize();
        const r = new T.Quaternion().setFromUnitVectors(axis, want);
        const lq = pq.invert().multiply(r.multiply(wq));
        e.quaternion.slerp(lq, lie);
      }
    }
    const sq = P.sq;
    b.scale.set(BS / Math.sqrt(sq), BS * sq, BS / Math.sqrt(sq) * (1 - 0.16 * lie));   // (lying, the tummy relaxes)
    // lying, the legs lie out flat (the feet don't stick up under the duvet)
    for (const k of ['legL', 'legR']) if (u.bones[k]) u.bones[k].rotation.x = (u.bones[k].userData.r0x ??= u.bones[k].rotation.x) + 1.2 * lie;
    // sleeping: slow breathing and the odd Z
    if (this.sleeping) {
      this.zT = (this.zT || 0) - dt;
      if (this.zT <= 0) { this.zT = 2.6; this.floatZ(); }
      if (u.body) u.body.scale.y = 1 + Math.sin(t * 1.6) * 0.025;
    }
    // Teddy sitting on the pillow: legs out in front
    const ted = this.it.teddy.obj.userData;
    for (const k of ['legL', 'legR']) if (ted.bones?.[k]) ted.bones[k].rotation.x = this.it.teddy.sit ? -1.35 : 0;
    // the alarm clock rings and jiggles (in short bursts with quiet gaps, not a constant rattle)
    const c = this.house.clock;
    if (this.ringing) {
      const ph = t % 1.8, on = ph < 0.6;
      c.rotation.z = on ? Math.sin(t * 30) * 0.06 : 0;
      c.position.y = 1.4 + (on ? Math.abs(Math.sin(t * 15)) * 0.04 : 0);
      this.ringT = (this.ringT || 0) - dt;
      if (this.ringT <= 0) { this.ringT = 1.8; for (let i = 0; i < 3; i++) this.s.wait(i * 0.12).then(() => sfx.tick()); }
    }
    // the duck bobs in the bath
    if (this.duck.visible) { this.duck.position.y = this.water.position.y + Math.sin(t * 2) * 0.03; this.duck.rotation.z = Math.sin(t * 1.7) * 0.08; }
    // mess splats stay on the paws as they move
    if (this.mess.length) { b.updateMatrixWorld(true); this.placeMess(); }
    // bubbles drift up and wobble
    for (const bb of this.bubbles.slice()) {
      const q = bb.userData;
      q.life -= dt;
      bb.position.y += dt * 0.7;
      bb.position.x += dt * (q.vx + Math.sin(t * 2 + q.ph) * 0.3);
      const ww = 1 + Math.sin(t * 5 + q.ph) * 0.06;
      if (bb.scale.x > q.k * 0.9 && bb.scale.x < q.k * 1.2) bb.scale.set(q.k * ww, q.k / ww, q.k);
      if (q.life <= 0 || bb.position.y > 9.5) this.popBubble(bb, false);
    }
  }
}
