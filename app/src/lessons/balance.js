// Fill & balance (World 5: the building site). Topics mt_zkFbMLpu3U "Comparing capacity", mt_-P1kdZhHbL "Measuring
// mass and weight" and mt_lMz9nAs7VO "Early maths vocabulary".
// A see-saw plank rocks on a big brick in the sandpit; clear toy pails ride its ends. On the left are a sand heap with
// a scoop in it and a water tub with a jug. Drag the scoop or the jug over a pail and it tips: a stream of sand or
// water pours in and the level rises behind the clear wall, past the dashed HALF mark up to the FULL line with its
// star (each mark lights up and dings). The plank is a damped spring driven by the weights on its ends, so the end
// you fill sinks, bumps on the sand and throws the other end up; water stays level and sloshes as it swings.
// Tapping the scoop or jug pours for you. Tipping out a pail of sand leaves a castle; water splashes out.
//   Level 1 (sunny sandpit): one pail against Chick on the other end - fill it up, then tip it out (three pails).
//   Level 2 (brick yard): two pails - fill one HALF way, which is heavy?, fill one FULL, which is full?, tip out the
//     half full one, which is light? (each round flows from the one before).
//   Level 3 (night site): make the see-saw balance by pouring just enough (it slows near the point, the spirit level's
//     bubble centres; too much and you tip a little out) and "which holds more / less?" with a pour-across proof.
//
// Test hooks: phase ('play' when waiting for the child), task ('fill' | 'empty' | 'pick' | 'balance' | 'more'),
// pails (every pail you can tap this round), target() (the pail to act on), goal() (the level to pour it to),
// pourInto(pail, level) (pours with the scoop/jug as a drag would, then lets go), tapPail(pail).
import * as T from '../three.js';
import { Lesson } from '../engine/lesson.js';
import { setFace, hop, popIn, popOut } from '../engine/actors.js';
import { makeChick } from '../engine/farm.js';
import { makeCreature, hasCreature } from '../engine/creature.js';
import { input } from '../engine/input.js';
import { cursor } from '../engine/cursor.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { setCamera, project, camera, getLook } from '../engine/stage.js';
import { Ease } from '../engine/tween.js';
import { toonUnique } from '../engine/toon.js';
import { Pail, SeeSaw, SEESAW, Stream, PAIL, makeCastle, makeHeap, makeTub, makePourer, spoutWorld, spoutOffset, MATS } from './balance-props.js';
import { pourSound, bal } from './balance-sound.js';

const RED = 0xff5a5a, BLUE = 0x3f8cff, YELLOW = 0xffc21a, GREEN = 0x4cc75a, PINK = 0xff7fbf, PURPLE = 0x9b6dff, TEAL = 0x2fc4b8, ORANGE = 0xff9a2e;
const PLANS = [
  // Level 1: one pail against Chick: fill it right up, then tip it out (a new pail every two rounds)
  [
    { task: 'fill', side: 0, goal: 1, mat: 'sand', say: 'Fill the bucket with sand!' },
    { task: 'empty', side: 0, say: 'Now tip it out!' },
    { task: 'fill', side: 0, goal: 1, mat: 'water', pail: [BLUE, 1], say: 'Fill it up with water!' },
    { task: 'empty', side: 0, say: 'Make it empty!' },
    { task: 'fill', side: 0, goal: 1, mat: 'sand', pail: [YELLOW, 1.3], say: 'Fill the big bucket up!' },
    { task: 'empty', side: 0, say: 'Tip it out!' },
  ],
  // Level 2: two pails; half and full, heavy and light (each round carries on from the last)
  [
    { task: 'fill', side: 0, goal: 0.5, mat: 'sand', say: 'Fill it half way! To the line!' },
    { task: 'pick', ask: 'heavy', say: 'Which bucket is heavy?' },
    { task: 'fill', side: 1, goal: 1, mat: 'water', say: 'Fill it to the star!' },
    { task: 'pick', ask: 'full', say: 'Which bucket is full?' },
    { task: 'empty', ask: 'half', say: 'Tip out the half full one!' },
    { task: 'pick', ask: 'light', say: 'Which bucket is light?' },
  ],
  // Level 3: balance the see-saw by pouring just enough; which holds more / less (proved by pouring one into the other)
  [
    { task: 'balance', side: 1, pre: [1, 0], preMat: 'sand', mat: 'sand', say: 'Make the see-saw flat!' },
    { task: 'more', ask: 'more', cands: [[GREEN, 1.25, 1.2], [PINK, 0.72, 0.72]], mat: 'sand', say: 'Pour the little one in the big one!', line: 'The big one holds more!' },
    { task: 'balance', side: 0, pre: [0, 0.5], preMat: 'water', mat: 'water', say: 'Make it flat with water!' },
    { task: 'more', ask: 'more', cands: [[PURPLE, 1.35, 0.78], [YELLOW, 0.66, 1.3]], mat: 'water', say: 'Pour the tall one in the wide one!', line: 'The wide one holds more!' },
    { task: 'balance', side: 1, pre: [0.75, 0], preMat: 'sand', mat: 'sand', say: 'Make it flat again!' },
    { task: 'more', ask: 'less', cands: [[RED, 1.2, 1.1], [BLUE, 0.75, 0.7]], mat: 'sand', say: 'Pour the big one in the little one!', line: 'The little one holds less!' },
  ],
];
// The camera opens wide on the yard (sand heap, water tub, see-saw), then works close on the see-saw: the scoop or jug
// is brought over to stand right by the pail it pours into, so everything you do is in the close-up.
const CAMS = {
  wide: { pos: new T.Vector3(0.0, 5.6, 15.2), look: new T.Vector3(0.0, 1.85, 0) },
  main: { pos: new T.Vector3(2.2, 4.5, 10.0), look: new T.Vector3(2.2, 1.5, 0) },
};
const _cp = new T.Vector3(), _cl = new T.Vector3();
const SS = new T.Vector3(2.2, 0, -0.7);           // the see-saw's brick
const HEAP = new T.Vector3(-6.7, 0, -2.6);        // the sand heap (the scoop rests on its front), out to the left
const TUB = new T.Vector3(-6.5, 0, 0.9);          // the water tub (the jug stands beside it), out to the left
const PIP = new T.Vector3(8.7, 0, -2.5);          // beyond the right end of the see-saw (never behind the plank), watching
const DRAG_Z = SS.z + 0.2;                        // carried pourers move in this plane, just in front of the pails
const FRONT = [new T.Vector3(1.35, 0, 2.3), new T.Vector3(3.35, 0, 2.3)];   // where the "holds more" pails stand (clear of the plank)
// castles stand in front of the see-saw's two ends (never in front of the pivot, where the scoop / jug waits, nor
// where the "holds more" pails stand)
const SPOTS = [new T.Vector3(-0.75, 0, 2.85), new T.Vector3(5.2, 0, 2.85), new T.Vector3(-1.6, 0, 1.9), new T.Vector3(6.0, 0, 1.9)];
const READY_Z = 1.45;                             // a scoop or jug brought over waits on the sand here, beside its pail
const RATE = 0.5;                                 // pour speed: a unit pail fills in about 2 s
const AUTO_RATE = 0.85;
const V = (x, y, z) => new T.Vector3(x, y, z);

// the wet-sand splotch: white with soft alpha, tinted by the material colour (drawn once, shared by every puddle)
let _wet = null;
function wetTex() {
  if (_wet) return _wet;
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  const blobs = [[64, 64, 44], [40, 58, 26], [88, 70, 28], [62, 40, 24], [70, 90, 22], [30, 76, 14], [100, 48, 13]];
  for (const [x, y, rr] of blobs) {
    const gr = g.createRadialGradient(x, y, rr * 0.55, x, y, rr);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, rr, 0, Math.PI * 2); g.fill();
  }
  _wet = new T.CanvasTexture(c);
  _wet.colorSpace = T.SRGBColorSpace;
  return _wet;
}

export default class BalanceLesson extends Lesson {
  build() {
    setCamera(CAMS.wide.pos, CAMS.wide.look);
    this.feelInit();
    this.pip.position.copy(PIP);
    this.pip.rotation.y = -0.65;
    this.pip.scale.setScalar(0.85);
    this.pip.userData.baseScale = 0.85;
    const lv = this.level;
    this.plans = PLANS[lv] || PLANS[0];
    // the sources
    const heap = (this.heap = makeHeap());
    heap.position.copy(HEAP);
    heap.rotation.y = 0.25;
    this.root.add(heap);
    const tub = (this.tub = makeTub(lv === 1 ? 0x4cc75a : BLUE));
    tub.position.copy(TUB);
    this.root.add(tub);
    // the see-saw
    const ss = (this.ss = new SeeSaw());
    ss.g.position.copy(SS);
    this.root.add(ss.g);
    ss.tol = lv === 2 ? 0.05 : 0;
    ss.onBump = (side, sp) => this.bump(side, sp);
    this.stream = new Stream(this.root);
    // the pails (Level 1: one, against Chick on the other end)
    this.plank = [];
    this.cands = [];
    this.castles = [];
    if (lv === 0) {
      this.seat(this.newPail(RED, 1), 0);
      // the weight on the other end: Frog (green, so never mistaken for Pip watching nearby)
      const ch = (this.chick = hasCreature('frog') ? makeCreature('frog') : makeChick(0.8));
      ch.userData.noWalk = true;
      if (ch.userData.creature) { const b = new T.Box3().setFromObject(ch), h = b.max.y - b.min.y; if (h > 0.01) ch.scale.multiplyScalar(1.2 / h); }
      ch.rotation.y = -0.35;
      ch.position.set(0, 0, 0.05);
      ss.seats[1].add(ch);
    } else {
      this.seat(this.newPail(lv === 1 ? RED : ORANGE, 1), 0);
      this.seat(this.newPail(lv === 1 ? BLUE : TEAL, 1), 1);
      const pre = this.plans[0].pre;
      if (pre) this.seatPails.forEach((p, i) => { if (pre[i]) p.set(pre[i], this.plans[0].preMat); });
      // start the plank where its weights already put it
      const [mL, mR] = this.masses();
      ss.theta = Math.max(-SEESAW.TMAX, Math.min(SEESAW.TMAX, ((mL - mR) / ss.sense) * SEESAW.TMAX));
    }
    // the scoop rests on the heap, the jug stands by the tub
    this.pourers = {};
    this.homes = {
      scoop: { p: V(HEAP.x + 1.2, 0.85, HEAP.z + 1.3), r: -0.55 },
      jug: { p: V(TUB.x + 1.15, 0, TUB.z + 0.75), r: 0 },
    };
    this.sources = {};
    for (const type of ['scoop', 'jug']) {
      const P = makePourer(type);
      const H = this.homes[type];
      H.p.y += P.userData.P.grip[1] * P.userData.P.k;
      P.position.copy(H.p);
      P.userData.tilt.rotation.z = H.r;
      this.sources[type] = { p: H.p.clone(), r: H.r };
      this.root.add(P);
      this.pourers[type] = P;
      this.addPourDrag(P);
    }
    // the first round's scoop / jug already waits beside its pail when the game opens (no flight to wait for)
    const p0 = this.plans[0];
    if (p0 && (p0.task === 'fill' || p0.task === 'balance') && this.plank[p0.side]) {
      const type = p0.mat === 'water' ? 'jug' : 'scoop', P = this.pourers[type];
      this.root.updateMatrixWorld(true);
      const side = p0.side ? 1 : -1;
      const H = this.restOn(P, this.plank[p0.side].g.getWorldPosition(new T.Vector3()).x - side * 1.25, READY_Z, 0);
      this.homes[type] = H;
      P.position.copy(H.p);
      P.userData.tilt.rotation.z = H.r;
    }
    this.finger = new T.Vector3();
    this.blend = 0;
    this.hover = null;
    this.dragP = null;
    this.phase = 'setup';
    this.task = null;
    this.sticky = false;
    this.marks = new Map();
    this.creakT = 0;
    this.puddles = [];
    this.spills = [];
  }

  // ---------------- pails ----------------
  newPail(col, sx, sy = sx) {
    const p = new Pail(col, sx, sy);
    p.tapT = input.addTap(p.g, { radius: 0.95 * sx, offset: V(0, 0.75 * sy, 0), onTap: () => this.tapPail(p) });
    return p;
  }
  seat(p, side) {
    this.ss.seats[side].add(p.g);
    p.g.position.set(0, 0, 0);
    p.g.rotation.set(0, side ? -0.2 : 0.2, 0);
    p.side = side;
    this.plank[side] = p;
    return p;
  }
  get seatPails() { return this.plank.filter(Boolean); }
  masses() {
    const L = this.plank[0], R = this.plank[1];
    const mL = L && L.g.parent === this.ss.seats[0] ? L.mass : 0;
    let mR = R && R.g.parent === this.ss.seats[1] ? R.mass : 0;
    if (this.chick) mR = 0.3 * (L ? L.cap : 1);
    return [mL, mR];
  }

  // ---------------- the scoop and the jug ----------------
  addPourDrag(P) {
    const u = P.userData;
    u.drag = input.addDrag(P, {
      radius: 0.85,
      minY: 0.6,
      offset: V(0.62 * u.P.k, -0.05, 0),
      zones: () => this.zones(),
      onPick: () => this.pick(P),
      onMove: (_t, z) => { this.finger.copy(P.position); this.hover = z && z.ok ? z.pail : null; this.hoverWrong = z && !z.ok ? z.pail : null; },
      onDrop: (z, info) => this.release(P, z, info),
    });
    u.drag.enabled = this.phase === 'play' && this.pourTask;
  }
  get pourTask() { return this.task === 'fill' || this.task === 'balance'; }
  zones() {
    if (!this.pourTask) return [];
    return this.seatPails.map((p) => ({ pos: p.mouth(), radius: 1.2 * p.sx, pail: p, ok: p === this.target() }));
  }
  enablePourers(on) { for (const P of Object.values(this.pourers)) if (P.userData.drag) P.userData.drag.enabled = on; }
  pick(P) {
    if (this.auto) return;
    const u = P.userData;
    u.mv = (u.mv || 0) + 1;      // cancels a hop home
    this.dragP = P;
    this.blend = 0;
    this.hover = null;
    this.finger.copy(P.position);   // it is carried in its own plane, in front of the plank (never snapped into it)
    this.idle = 0;
    this.endDemo();
    this.clearHints();   // no halo over the pail while she pours
  }
  release(P, zone, info) {
    if (this.dragP !== P || this.auto) return;
    const wasOver = this.hover;
    this.dragP = null;
    this.hover = null;
    this.stopPour();
    if (info && info.tapped) { this.tapPourer(P); return; }
    // letting go over the bucket in a fill round finishes the pour (the scoop stays tipped and empties itself)
    const p = this.target();
    if (this.phase === 'play' && this.task === 'fill' && wasOver && wasOver === p && p.level < this.goal() - 0.002) {
      this.autoPour(P, p, this.goal(), { rate: RATE }).then(() => this.afterPour(p));
      return;
    }
    this.goHome(P);
    if (this.phase !== 'play') return;
    if (!wasOver && zone && !zone.ok) { this.redirect('Pour in this one!'); this.hopPail(this.target()); }
    else if (this.task === 'balance' && (wasOver || this.pouredSome)) this.checkBalance(true);
  }
  // tapping the scoop or jug pours for you, into the right pail
  tapPourer(P) {
    if (this.phase !== 'play' || !this.pourTask || this.auto) { this.goHome(P); return; }
    const p = this.target();
    this.autoPour(P, p, this.goal(), { rate: AUTO_RATE * 0.8 }).then(() => this.afterPour(p));
  }
  async goHome(P) {
    const u = P.userData, H = this.homes[u.type];
    const id = (u.mv = (u.mv || 0) + 1);
    const a = P.position.clone(), r0 = u.tilt.rotation.z, rz0 = P.rotation.z;
    // a curve up and forward over the see-saw (never through the plank or a pail), then down to its spot
    const far = Math.abs(a.x - H.p.x) > 1.5;
    // always out toward us first (in front of the plank and the pails), then over and down to its spot
    const c = V((a.x + H.p.x) / 2, Math.max(a.y, H.p.y) + (far ? 1.5 : 0.7), Math.max(a.z, H.p.z) + (far ? 1.4 : 1.0));
    const dur = far ? Math.min(1.3, 0.8 + Math.abs(a.x - H.p.x) * 0.06) : 0.7;
    await this.s.anim(dur, (e) => {
      if (u.mv !== id) return;
      const i = 1 - e;
      P.position.set(i * i * a.x + 2 * i * e * c.x + e * e * H.p.x, i * i * a.y + 2 * i * e * c.y + e * e * H.p.y, i * i * a.z + 2 * i * e * c.z + e * e * H.p.z);
      u.tilt.rotation.z = r0 + (H.r - r0) * Math.min(1, e * 1.6);
      P.rotation.z = rz0 * (1 - e);
    }, Ease.inOut);
    if (u.mv !== id || this.dead) return;
    P.position.copy(H.p);
    u.tilt.rotation.z = H.r;
  }
  // a scoop or jug resting on the flat sand at (x, z): its lowest point just touches the sand
  restOn(P, x, z, r = 0) {
    const t = P.userData.tilt, p0 = P.position.clone(), r0 = t.rotation.z, rz0 = P.rotation.z;
    P.position.set(x, 0, z); P.rotation.z = 0; t.rotation.z = r;
    P.updateMatrixWorld(true);
    const y = -new T.Box3().setFromObject(P).min.y + 0.02;
    P.position.copy(p0); t.rotation.z = r0; P.rotation.z = rz0;
    P.updateMatrixWorld(true);
    return { p: V(x, y, z), r };
  }
  // bring the scoop / jug for this pour over from its heap / tub to wait beside the pail (it scoops or dips first)
  async bringPourer(P, pail) {
    const u = P.userData, src = this.sources[u.type];
    const side = pail.side ? 1 : -1;
    // beside its pail, toward the middle but well short of the pivot brick (and in front of it)
    const x = pail.g.getWorldPosition(_v).x - side * 1.25;
    const H = this.restOn(P, x, READY_Z, 0);
    if (this.homes[u.type].p.distanceTo(H.p) < 0.4) return;   // already there (or as good as)
    this.homes[u.type] = H;
    if (u.type === 'scoop') { bal.scoop(); this.puff(V(src.p.x, 0.9, HEAP.z + 1.2), MATS.sand.grain, 8); }
    else { bal.dip(); this.drops(V(TUB.x + 0.6, 0.7, TUB.z + 0.3), 8); }
    await this.goHome(P);
  }
  // the scoop and jug go back to the heap and the tub (all but `keep`)
  parkPourers(keep = null) {
    for (const [type, P] of Object.entries(this.pourers)) {
      if (type === keep) continue;
      const src = this.sources[type];
      if (this.homes[type].p.distanceTo(src.p) < 0.01) continue;
      this.homes[type] = { p: src.p.clone(), r: src.r };
      this.goHome(P);
    }
  }
  // pour with the scoop/jug as a hand would: fly over the pail, tip, pour to `goal`, let go
  async autoPour(P, pail, goal, { rate = AUTO_RATE, setup = false } = {}) {
    const u = P.userData;
    u.mv = (u.mv || 0) + 1;
    this.enablePourers(false);
    this.auto = { P, pail, goal, rate };
    this.dragP = P;
    this.blend = 0;
    this.hover = null;
    const from = P.position.clone();
    const to = pail.mouth().add(V(-1.0, 0.55, 0));
    to.z = DRAG_Z;
    // up and over (a high arc in front of the plank), then in over the pail
    const c = V((from.x + to.x) / 2, Math.max(from.y, to.y) + 1.2, Math.max(from.z, to.z) + 0.8);
    await this.s.anim(Math.abs(from.x - to.x) > 3 ? 1.0 : 0.75, (e) => { const i = 1 - e; this.finger.set(i * i * from.x + 2 * i * e * c.x + e * e * to.x, i * i * from.y + 2 * i * e * c.y + e * e * to.y, i * i * from.z + 2 * i * e * c.z + e * e * to.z); }, Ease.inOut);
    if (this.dead) return;
    this.hover = pail;
    for (let k = 0; k < 120 && !this.dead && this.auto && pail.level < goal - 0.002; k++) await this.wait(0.05);
    if (this.dead) return;
    this.hover = null;
    await this.wait(0.35);
    if (this.dead) return;
    this.auto = null;
    this.dragP = null;
    this.stopPour();
    this.goHome(P);
    if (!setup) this.enablePourers(this.phase === 'play' && this.pourTask);
  }
  stopPour() { this.stream.stop(); pourSound.stop(); }

  // every frame while a pourer is carried (or auto-pours): glide into the pouring pose over the pail, tip, pour
  pourStep(dt) {
    const P = this.dragP;
    if (!P) return;
    const u = P.userData;
    const hover = this.hover;
    this.blend = Math.max(0, Math.min(1, this.blend + (hover ? dt / 0.3 : -dt / 0.2)));
    const e = Ease.inOut(this.blend);
    const tiltTo = hover ? u.P.pour : -0.12;
    u.tilt.rotation.z += (tiltTo - u.tilt.rotation.z) * Math.min(1, dt * (hover ? 5 : 7));
    if (hover) {
      // the spout over the pail's opening, a little to the left so the stream curves in to the middle
      const m = hover.mouth();
      this.snap = (this.snap || new T.Vector3()).set(m.x - 0.2 * hover.sx, m.y + 0.48, DRAG_Z).sub(spoutOffset(P, u.P.pour));
    }
    if (this.snap && this.blend > 0) P.position.lerpVectors(this.finger, this.snap, e);
    else P.position.copy(this.finger);
    // only over a pail does it move back into the pouring plane (above the mouth, clear of the brick)
    P.position.z = this.finger.z + (DRAG_Z - this.finger.z) * (this.snap ? e : 0);
    const tipped = u.tilt.rotation.z < u.P.pour * 0.8;
    const p = hover;
    let pouring = !!p && this.blend > 0.85 && tipped && this.canPour(p);
    if (pouring) {
      const mat = u.mat;
      let rate = (this.auto ? this.auto.rate : RATE) / p.cap;
      const goal = this.stickyGoal(p);
      if (this.task === 'balance' && !this.auto) {
        const d = Math.abs(this.balanceLevel(p) - p.level);
        if (d < 0.16) rate *= 0.4;     // it slows as you get near the balance point
      }
      let amt = rate * dt;
      let reached = false;
      if (goal !== null && p.level + amt >= goal) { amt = Math.max(0, goal - p.level); reached = true; }
      const before = p.level;
      p.add(amt, mat);
      p.wob = 1;
      this.pouredSome = true;
      this.marksCrossed(p, before);
      this.stream.start(mat, Math.min(1.25, 0.85 + 0.25 * p.sx));
      pourSound.start(mat);
      pourSound.update(dt, p.level);
      if (reached) { pouring = false; this.goalReached(p); }
    }
    if (!pouring) this.stopPour();
    const sp = spoutWorld(P, _a);
    if (p) this.lastLand = p.surface(this.lastLand || new T.Vector3());
    if (this.lastLand) this.stream.aim(sp, _x, this.lastLand);
  }
  canPour(p) {
    if (this.auto && this.auto.pail === p) return p.level < this.auto.goal - 0.001;
    return this.phase === 'play' && this.pourTask && p === this.target() && p.level < 0.999 && !this.reached;
  }
  // where a pour has to stop by itself (null: keep going while held)
  stickyGoal(p) {
    if (this.auto) return this.auto.goal;
    if (this.task === 'fill') return this.goal();
    if (this.task === 'balance' && this.sticky) return this.balanceLevel(p);
    return 1;
  }
  marksCrossed(p, before) {
    if (before < 0.5 && p.level >= 0.5 - 1e-4) { p.flash('half'); bal.ding(false); }
    if (before < 0.999 && p.level >= 0.999) { p.flash('full'); bal.ding(true); }
  }
  goalReached(p) {
    if (this.auto) return;   // autoPour finishes by itself
    this.reached = true;
    // the scoop/jug lets go by itself and goes home
    const P = this.dragP;
    if (P) {
      input.remove(P.userData.drag);
      cursor.setGrab(false);
      this.dragP = null;
      this.hover = null;
      this.stopPour();
      this.goHome(P);
      this.addPourDrag(P);
    }
    this.afterPour(p);
  }
  // a pour into the target has finished (by itself, by a tap, or by the test hook)
  afterPour(p) {
    if (this.phase !== 'play' || this.dead) return;
    if (this.task === 'fill') {
      const half = this.goal() < 0.99;
      if (Math.abs(p.level - this.goal()) > 0.01) return;
      this.phase = 'done';
      this.enablePourers(false);
      this.happyPail(p);
      this.success(p.mouth().add(V(0, 0.6, 0.6)), half ? 'Half full!' : (this.level === 0 ? "It's full!" : 'Full right up!'), { voice: true });
    } else if (this.task === 'balance') this.checkBalance(this.reached);   // a pour that stopped at the brim counts as a let-go
  }

  // ---------------- balance ----------------
  other(p) { return this.plank[1 - p.side]; }
  balanceLevel(p) { const o = this.other(p); return Math.max(0, Math.min(1, (o.mass - 0.3 * p.cap) / p.cap)); }
  checkBalance(fromRelease) {
    if (this.phase !== 'play') return;
    const p = this.target(), d = p.level - this.balanceLevel(p);
    if (Math.abs(d) * p.cap <= this.ss.tol + 1e-4) {
      this.phase = 'done';
      this.enablePourers(false);
      if (!this.wasNear) bal.balance();
      // balance is stillness: a held breath (the bubble centres), then both pails give a happy squash
      const pos = this.ss.g.position.clone().add(V(0, 2.2, 1));
      this.payoffP = this.beat(this.ss.g, 0.5, { squash: 0.03 }).then(() => { for (const q of this.seatPails) this.happyPail(q); return this.wait(1.0); });
      this.success(pos, 'It balances!', { voice: true });
    } else if (d > 0 && fromRelease) {
      this.over = true;
      this.redirect('Too much! Tap the bucket!');
      this.s.wait(1.2).then(() => { if (!this.dead && this.over && this.phase === 'play' && !this.dragP) this.teachNow(); });
    } else if (fromRelease && !this.saidMore) {
      this.saidMore = true;
      this.say('A little bit more!', { max: 1.2 });
    }
  }
  // too much in the balance pail: tapping it tips a little out onto the sand
  async tipLittle(p) {
    if (p.tipping) return;
    p.tipping = true;
    const g = p.g, rz0 = g.rotation.z, side = p.side ? 1 : -1;
    const to = Math.max(this.balanceLevel(p), p.level - 0.14);
    const startL = p.level;
    // lean outwards over the plank end (rocking on the outer edge of its base) and let a little run over the rim
    const px = side * (PAIL.RB + 0.085) * p.sx, y0 = g.position.y, x0 = g.position.x;
    const lean = (a) => { g.rotation.z = rz0 + a; g.position.x = x0 + px - px * Math.cos(a); g.position.y = y0 - px * Math.sin(a); };
    await this.s.anim(0.5, (e) => lean(-side * 0.9 * e), Ease.inOut);
    const m = p.mouth(), land = V(m.x + side * 0.9, 0.02, m.z + 0.2);
    this.stream.aim(p.mouth(_b).add(V(side * 0.15 * p.sx, -0.05, 0)), V(side, 0, 0), land);
    this.stream.start(p.mat === 'water' ? 'water' : 'sand', 0.8);
    pourSound.start(p.mat === 'water' ? 'water' : 'sand');
    await this.s.anim(0.6, (e) => { p.level = startL + (to - startL) * e; this.stream.aim(p.mouth(_b).add(V(side * 0.15 * p.sx, -0.05, 0)), V(side, 0, 0), land); });
    this.stopPour();
    if (p.mat === 'water') this.puddle(land, 0.5); else this.puff(land, MATS.sand.grain, 6);
    await this.s.anim(0.5, (e) => lean(-side * 0.9 * (1 - e)), Ease.inOut);
    lean(0);
    p.tipping = false;
    if (Math.abs(p.level - this.balanceLevel(p)) * p.cap <= this.ss.tol + 1e-4) { this.over = false; this.checkBalance(false); }
    else if (p.level > this.balanceLevel(p)) this.say('Tap it again!', { max: 1 });
  }

  // ---------------- tapping pails ----------------
  tapPail(p) {
    if (this.dead) return;
    this.idle = 0;
    if (this.phase !== 'play') { this.wigglePail(p); return; }
    this.endDemo();
    const t = this.task;
    if (t === 'fill' || t === 'balance') {
      if (p !== this.target()) { this.redirect(t === 'fill' ? 'Pour it in this one!' : 'Pour in this one!'); this.hopPail(this.target()); return; }
      if (t === 'balance' && p.level > this.balanceLevel(p) + 1e-3) { this.tipLittle(p); return; }
      if (this.auto || this.dragP) return;
      const P = this.pourers[this.plan.mat === 'water' ? 'jug' : 'scoop'];
      this.autoPour(P, p, this.goal(), { rate: AUTO_RATE * 0.8 }).then(() => this.afterPour(p));
      return;
    }
    if (t === 'empty') {
      if (p !== this.target()) { this.redirect(this.plan.ask === 'half' ? 'Find the half full one!' : 'This one!'); this.wigglePail(p); return; }
      this.phase = 'done';
      this.payoff = this.tipOut(p);
      return;
    }
    if (t === 'pick') {
      if (p !== this.target()) { this.redirect(WRONG[this.plan.ask] || 'Try the other one!'); this.wigglePail(p); this.hopPail(this.target()); return; }
      this.phase = 'done';
      this.pickPayoff(p);
      return;
    }
    if (t === 'more') {
      // no wrong answer: tapping either pail pours the full one into the empty one, and she sees which holds more
      this.phase = 'done';
      this.payoff = this.pourAcross();
      return;
    }
    if (t === 'tipall') {
      if (p.level <= 0.01 || p.tippedOut) { this.wigglePail(p); return; }
      p.tippedOut = true;
      this.tipOut(p, { quiet: true }).then(() => this.checkTipped());
      return;
    }
  }

  // ---------------- payoffs ----------------
  happyPail(p) {
    const g = p.g, s0 = g.scale.x;
    this.s.anim(0.36, (_, q) => { const k = Math.sin(q * Math.PI) * (1 - q * 0.4); g.scale.set(s0 * (1 + 0.1 * k), s0 * (1 - 0.12 * k + 0.2 * Math.sin(q * Math.PI * 2) * q), s0 * (1 + 0.1 * k)); }).then(() => g.scale.setScalar(s0));
  }
  wigglePail(p) {
    const g = p.g, r0 = g.rotation.z;
    this.s.anim(0.5, (_, q) => { g.rotation.z = r0 + Math.sin(q * Math.PI * 3) * 0.08 * (1 - q); }).then(() => (g.rotation.z = r0));
  }
  hopPail(p) {
    if (!p || p.hopping) return;
    p.hopping = true;
    const g = p.g, y0 = g.position.y;
    this.s.anim(0.6, (_, q) => { g.position.y = y0 + Math.sin(q * Math.PI) * 0.35; }).then(() => { g.position.y = y0; p.hopping = false; });
  }
  pickPayoff(p) {
    const ask = this.plan.ask;
    this.happyPail(p);
    if (ask === 'heavy') { this.ss.kick((p.side ? -1 : 1) * 1.6); bal.clonk(0.7); }
    if (ask === 'light') { this.ss.kick((p.side ? 1 : -1) * 1.8); bal.whee(); }
    if (ask === 'full') { p.flash('full'); bal.ding(true); }
    const line = { heavy: 'Heavy goes down!', light: 'Light goes up!', full: 'That one is full!' }[ask] || '';
    this.success(p.mouth().add(V(0, 0.6, 0.6)), line, { voice: true });
  }
  // Tip a pail out in front of the see-saw: sand turns out as a castle, water splashes out in a puddle.
  async tipOut(p, { quiet = false } = {}) {
    const g = p.g, seat = g.parent, side = p.side;
    const sand = p.mat !== 'water';
    // sand turns out as a castle in a tidy row at the front; water is poured out just in front of its end of the plank
    const spot = sand ? this.freeSpot(side) : V(g.getWorldPosition(_v).x + (side ? -0.4 : 0.2), 0, SS.z + 2.0);
    const L = p.level;
    this.root.attach(g);
    const a = g.position.clone(), r0 = g.rotation.clone();
    const H = PAIL.H * p.sy;
    if (sand) {
      // up and over: it lands upside down on the spot
      const to = V(spot.x, H, spot.z);
      await this.s.anim(0.9, (e, q) => {
        g.position.lerpVectors(a, to, e);
        g.position.y += Math.sin(q * Math.PI) * 1.4;
        g.rotation.set(r0.x * (1 - e), r0.y * (1 - e), r0.z + (Math.PI - r0.z) * e);
      }, Ease.inOut);
      if (this.dead) return;
      g.position.copy(to);
      bal.plop();
      this.puff(V(spot.x, 0.1, spot.z), MATS.sand.grain, 10);
      // squash on landing, then a little pat-pat pause before it lifts
      const s0 = g.scale.x;
      await this.s.anim(0.25, (_, q) => { const k = Math.sin(q * Math.PI); g.scale.set(s0 * (1 + 0.08 * k), s0 * (1 - 0.1 * k), s0 * (1 + 0.08 * k)); });
      g.scale.setScalar(s0);
      await this.wait(0.45);
      if (this.dead) return;
      // the castle appears as the pail lifts away
      const c = makeCastle(p.sx, p.sy, L);
      c.position.copy(spot);
      c.rotation.y = (Math.random() - 0.5) * 0.4;
      this.root.add(c);
      this.castles.push(c);
      p.set(0);
      const up = V(spot.x, H + 1.1, spot.z);
      if (!quiet) {
        if (this.level === 0) this.success(V(spot.x, 1.8, spot.z + 0.5), this.round === 1 ? 'A sand castle!' : 'Another sand castle!');
        else this.success(V(spot.x, 1.8, spot.z + 0.5), "Now it's empty!", { voice: true });
      }
      await this.s.anim(0.6, (e) => { g.position.lerpVectors(to, up, e); }, Ease.inOut);
      const cs = c.scale.clone();
      this.s.anim(0.45, (_, q) => { const k = Math.sin(q * Math.PI) * (1 - q); c.scale.set(cs.x * (1 + 0.12 * k), cs.y * (1 - 0.15 * k + 0.1 * Math.sin(q * Math.PI * 2)), cs.z * (1 + 0.12 * k)); }).then(() => c.scale.copy(cs));
      // and back onto the plank, the right way up
      seat.attach(g);
      const b = g.position.clone(), rz = g.rotation.z;
      await this.s.anim(0.9, (e, q) => {
        g.position.lerpVectors(b, _zero, e);
        g.position.y += Math.sin(q * Math.PI) * 0.8;
        g.rotation.set(0, (side ? -0.2 : 0.2) * e, rz * (1 - e));
      }, Ease.inOut);
    } else {
      // hop off to the front, lean over and pour it out
      const to = V(spot.x, 0, spot.z);
      await this.s.anim(0.8, (e, q) => {
        g.position.lerpVectors(a, to, e);
        g.position.y += Math.sin(q * Math.PI) * 1.0;
        g.rotation.set(r0.x * (1 - e), r0.y * (1 - e), r0.z * (1 - e));
      }, Ease.inOut);
      if (this.dead) return;
      // it rolls over onto its side about the outer edge of its base, so it lies on the sand (never sinks into it)
      const dir = side ? -1 : 1, px = dir * (PAIL.RB + 0.085) * p.sx;   // it rolls over toward the middle (never off the edge)
      const roll = (a) => { g.rotation.z = a; g.position.x = spot.x + px - px * Math.cos(a); g.position.y = -px * Math.sin(a); };
      await this.s.anim(0.5, (e) => roll(-dir * 1.7 * e), Ease.inOut);
      const land = V(spot.x + px + dir * (PAIL.H * p.sy + 0.35), 0.02, spot.z + 0.15);
      const lip = () => g.localToWorld(_b.set(dir * 0.55, PAIL.H * 1.02, 0));
      this.stream.aim(lip(), V(dir, 0, 0), land);
      this.stream.start('water', 1.25);
      pourSound.start('water');
      this.puddle(land, 0.9 * p.sx);
      if (!quiet) this.success(V(spot.x, 1.8, spot.z + 0.5), this.level === 0 ? 'All empty!' : "Now it's empty!", { voice: true });
      await this.s.anim(1.0, (e) => { p.level = L * (1 - e); this.stream.aim(lip(), V(dir, 0, 0), land); });
      p.set(0);
      this.stopPour();
      this.drops(land, 10);
      await this.s.anim(0.5, (e) => roll(-dir * 1.7 * (1 - e)), Ease.inOut);
      roll(0);
      seat.attach(g);
      const b = g.position.clone(), rz = g.rotation.z;
      await this.s.anim(0.85, (e, q) => {
        g.position.lerpVectors(b, _zero, e);
        g.position.y += Math.sin(q * Math.PI) * 0.9;
        g.rotation.set(0, (side ? -0.2 : 0.2) * e, rz * (1 - e));
      }, Ease.inOut);
    }
    if (this.dead) return;
    g.position.set(0, 0, 0);
    g.rotation.set(0, side ? -0.2 : 0.2, 0);
    this.ss.kick(side ? -0.4 : 0.4);
  }
  freeSpot(side) {
    const used = this.castles.map((c) => c.position).concat(this.puddles.filter((q) => q.userData.alive).map((q) => q.position));
    // its own side first (a short flight, never across the other seat), then the other side, then the back row
    const order = side ? [1, 0, 3, 2] : [0, 1, 2, 3];
    for (const i of order) if (!used.some((u) => Math.hypot(u.x - SPOTS[i].x, u.z - SPOTS[i].z) < 1.6)) return SPOTS[i].clone();
    return SPOTS[order[0]].clone();
  }
  // "holds more / less": the full pail pours itself into the empty one. Into a bigger one, it all goes in with room to
  // spare; into a smaller one, it fills it to the top and the rest runs over the rim onto the sand (a little heap stays).
  async pourAcross() {
    const full = this.cands.find((c) => c.level > 0.5) || this.capOrder()[1];
    const into = this.cands.find((c) => c !== full);
    if (!full || !into) return;
    const g = full.g, a = g.position.clone(), r0 = g.rotation.z;
    const dir = into.g.position.x > a.x ? 1 : -1;
    const bm = into.mouth();
    // where it pours from: tipped over (by TIP), its lip just over the middle of the other pail's mouth; its foot is
    // placed so the lip lands there, so the tipped pail never dips into the other one
    const TIP = 1.9, ang = -dir * TIP;
    const lx = dir * (PAIL.R + 0.02) * full.sx, ly = PAIL.H * 0.97 * full.sy;
    const lipOff = V(lx * Math.cos(ang) - ly * Math.sin(ang), lx * Math.sin(ang) + ly * Math.cos(ang), 0);
    const to = V(bm.x - dir * 0.12, bm.y + 0.3, bm.z + 0.25).sub(lipOff);
    this.happyPail(full);
    await this.s.anim(0.9, (e, q) => { g.position.lerpVectors(a, to, e); g.position.y += Math.sin(q * Math.PI) * 0.5; g.rotation.z = r0 + ang * Ease.inOut(Math.max(0, (q - 0.4) / 0.6)); }, Ease.inOut);
    if (this.dead) return;
    const lip = () => g.localToWorld(_b.set(lx, ly, 0));
    const mat = full.mat || 'sand';
    this.stream.start(mat, 1.1);
    pourSound.start(mat);
    const L0 = full.level, B0 = into.level, amount = full.cap * L0, room = into.cap * (1 - B0);
    const fillE = Math.min(1, room / Math.max(1e-6, amount));   // the part of the pour that fits
    // over the rim: where the spill lands (on the sand in front of the little pail), and the heap it leaves
    const spill = V(bm.x + dir * 0.15, 0.03, bm.z + PAIL.R * into.sx + 0.35);
    let heap = null;
    const dur = fillE < 1 ? 2.0 : 1.3;
    await this.s.anim(dur, (e) => {
      full.level = L0 * (1 - e);
      if (e <= fillE) {
        const before = into.level;
        into.add(B0 + (amount * e) / into.cap - into.level, mat);
        into.wob = 1;
        this.marksCrossed(into, before);
        this.stream.aim(lip(), V(dir, 0, 0), into.surface());
        pourSound.update(1 / 60, into.level);
      } else {
        // it's full: the rest runs over the rim and onto the sand
        if (into.level < 1) { const before = into.level; into.add(1 - into.level, mat); this.marksCrossed(into, before); }
        this.stream.aim(lip(), V(dir, 0, 0.6), spill);
        if (!heap && mat !== 'water') {
          heap = makeHeap({ bare: true });
          heap.position.copy(spill).setY(0);
          heap.scale.setScalar(0.01);
          this.root.add(heap);
          this.spills.push(heap);
        }
        const k = (e - fillE) / Math.max(1e-6, 1 - fillE);
        if (heap) heap.scale.setScalar(0.05 + 0.2 * k);
        if (Math.random() < 0.3) this.puff(spill, MATS.sand.grain, 2);
      }
    });
    full.set(0);
    this.stopPour();
    if (mat === 'water' && fillE < 1) this.puddle(spill, 0.7);
    this.success(into.mouth().add(V(0, 0.8, 0.6)), this.plan.line, { voice: true });
    this.happyPail(into);
    await this.s.anim(0.8, (e, q) => { g.position.lerpVectors(to, a, e); g.position.y += Math.sin(q * Math.PI) * 0.4; g.rotation.z = r0 + ang * (1 - e); }, Ease.inOut);
    g.position.copy(a);
    g.rotation.z = r0;
  }
  capOrder() { const c = this.cands.slice().sort((x, y) => y.cap - x.cap); return [c[0], c[c.length - 1]]; }

  // ---------------- see-saw life ----------------
  bump(side, sp) {
    const k = Math.min(1, sp / 2);
    if (k > 0.3) bal.clonk(0.4 + 0.4 * k);
    const x = SS.x + side * (SEESAW.PL - 0.2);
    this.puff(V(x, 0.05, SS.z + 0.4), MATS.sand.grain, 4 + Math.round(6 * k));
    this.puff(V(x, 0.05, SS.z - 0.4), MATS.sand.grain, 3 + Math.round(4 * k));
    // the other end flies up: Chick gets a ride
    if (this.chick && side < 0 && k > 0.25) {
      if (k > 0.5) sfx.cheep();
      const f = this.chick.userData.face;
      if (f) { setFace(f, 'joy'); this.s.wait(1.2).then(() => { if (f.userData.emotion === 'joy') setFace(f, 'happy'); }); }
      hop(this.s, this.chick, 0.35 + 0.4 * k, 0.4);
      const w = this.chick.userData.wings;
      if (w) { const r = w.map((x) => x.rotation.z); this.s.anim(0.6, (_, q) => w.forEach((x, i) => (x.rotation.z = r[i] + (i ? -1 : 1) * Math.abs(Math.sin(q * Math.PI * 4)) * 0.9 * (1 - q)))).then(() => w.forEach((x, i) => (x.rotation.z = r[i]))); }
    }
  }
  puff(pos, col, n = 8) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = 0.6 + Math.random() * 1.2;
      this.stream.bits.spawn(pos, _v.set(Math.cos(a) * sp, 1 + Math.random() * 1.6, Math.sin(a) * sp * 0.6), { life: 0.5, s: 0.03 + Math.random() * 0.03, col, floor: 0.02, bounce: 1 });
    }
  }
  drops(pos, n = 8) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = 0.5 + Math.random() * 1.0;
      this.stream.bits.spawn(pos, _v.set(Math.cos(a) * sp, 1.8 + Math.random() * 1.5, Math.sin(a) * sp * 0.6), { life: 0.6, s: 0.03 + Math.random() * 0.025, col: Math.random() < 0.5 ? 0xd8f6ff : 0x8fdcff, floor: 0.02 });
    }
  }
  // a dark wet patch on the sand that dries away
  // (an organic splotch with a soft rim, not a flat ellipse: a few overlapping blobs in a cached alpha texture)
  puddle(pos, r = 0.8) {
    const m = new T.Mesh(new T.PlaneGeometry(2, 2), toonUnique(0xc79a57, { map: wetTex(), transparent: true, opacity: 0, depthWrite: false }));
    m.rotation.x = -Math.PI / 2;
    m.rotation.z = Math.random() * Math.PI * 2;
    m.position.set(pos.x, 0.025, pos.z);
    m.scale.set(0.01, 0.01, 1);
    m.renderOrder = 1;
    m.userData.alive = true;
    this.root.add(m);
    this.puddles.push(m);
    this.s.anim(0.4, (e) => { m.scale.set(r * 1.3 * e, r * e, 1); m.material.opacity = 0.75 * e; }, Ease.out)
      .then(() => this.s.wait(2.2))
      .then(() => this.s.anim(1.2, (e) => { m.material.opacity = 0.75 * (1 - e); }))
      .then(() => { m.userData.alive = false; this.root.remove(m); m.material.dispose(); this.puddles = this.puddles.filter((q) => q !== m); });
  }

  // ---------------- rounds ----------------
  target() {
    const t = this.task, plan = this.plan;
    if (!plan) return null;
    if (t === 'fill' || t === 'balance') return this.plank[plan.side];
    if (t === 'empty') {
      if (plan.ask === 'half') return this.seatPails.find((p) => Math.abs(p.level - 0.5) < 0.12) || this.plank[0];
      return this.plank[plan.side || 0];
    }
    if (t === 'pick') {
      const ps = this.seatPails;
      if (plan.ask === 'heavy') return ps.slice().sort((a, b) => b.mass - a.mass)[0];
      if (plan.ask === 'light') return ps.slice().sort((a, b) => a.mass - b.mass)[0];
      if (plan.ask === 'full') return ps.find((p) => p.level > 0.98) || ps[0];
    }
    if (t === 'more') return this.cands.find((c) => c.level > 0.5) || this.cands[0] || null;   // the full one pours
    if (t === 'tipall') return this.seatPails.find((p) => p.level > 0.01 && !p.tippedOut) || null;
    return null;
  }
  goal() {
    const p = this.target();
    if (this.task === 'balance') return p ? this.balanceLevel(p) : 1;
    return this.plan?.goal ?? 1;
  }
  get tapPails() { return this.task === 'more' ? this.cands : this.seatPails; }

  async startRound(r) {
    this.busy = true;
    this.phase = 'setup';
    this.reached = false;
    this.sticky = false;
    this.over = false;
    this.saidMore = false;
    this.pouredSome = false;
    this.payoff = null;
    const plan = (this.plan = this.plans[r]);
    this.task = null;
    this.enablePourers(false);
    for (const p of [...this.seatPails, ...this.cands]) { p.g.visible = true; if (p.tapT) p.tapT.enabled = true; p.g.scale.setScalar(1); }
    // the opening shot shows the whole yard for a moment, then the camera moves in on the see-saw
    // the opening: a short look at the whole yard while the camera eases in; she can already pour (rule 0)
    const opening = r === 0 ? this.glide(CAMS.main, 1.2) : null;
    const pourType = plan.task === 'fill' || plan.task === 'balance' ? (plan.mat === 'water' ? 'jug' : 'scoop') : null;
    this.parkPourers(pourType);
    // the scoop / jug sets off for the pail's side while the round is laid out (it waits beside the seat, so the
    // pail can be swapped meanwhile); Level 3 brings it after the tip-out instead, so nothing is in the way
    const early = pourType && this.level < 2 && this.plank[plan.side] ? this.bringPourer(this.pourers[pourType], this.plank[plan.side]) : null;
    await this.setup(plan, r);
    if (this.dead) return;
    this.task = plan.task;
    this.ss.tol = this.task === 'balance' ? 0.05 : 0;
    for (const p of this.seatPails) if (p.tapT) p.tapT.enabled = this.task !== 'more';
    for (const p of this.cands) if (p.tapT) p.tapT.enabled = this.task === 'more';
    // the scoop / jug comes over to stand by the pail it pours into
    if (early) await early;
    else if (pourType) await this.bringPourer(this.pourers[pourType], this.target());
    if (this.dead) return;
    this.enablePourers(this.pourTask);
    this.phase = 'play';
    this.busy = false;
    // "this one": the pail to fill hops (when there is a choice of two)
    if (this.pourTask && this.seatPails.length > 1) this.hopPail(this.target());
    // (the first round's words and hand demo wait for the camera to settle, so the hand lands on the real scoop;
    // she can pour already)
    if (opening) { await opening; if (this.dead || this.phase !== 'play' || this.round !== r) return; }
    this.cue();
  }
  promptText() { return this.task === 'tipall' ? 'Tip them out!' : this.plan?.say || ''; }
  // what the child is being asked to do (each new kind gets its own slow hand demo)
  action() {
    if (this.phase !== 'play' || this.busy) return null;
    if (this.pourTask) return this.over ? 'tip' : 'pour';
    return this.task === 'empty' || this.task === 'tipall' ? 'empty' : this.task === 'more' ? 'pourover' : 'choose';
  }
  prompt() { const t = this.promptText(); if (t) this.say(t, { max: 1.6 }); }

  async setup(plan, r) {
    const lv = this.level;
    if (lv === 0 && plan.pail) {
      // the old pail hops off behind the see-saw, a new one drops onto the plank
      const old = this.plank[0];
      this.root.attach(old.g);
      // (it shrinks away as it goes, gently, without a spin)
      const a = old.g.position.clone(), to = V(a.x - 1.2, a.y + 2.2, a.z - 1.5);
      input.remove(old.tapT);
      this.s.anim(0.8, (e) => { old.g.position.lerpVectors(a, to, e); old.g.scale.setScalar(Math.max(0.001, 1 - e)); }, Ease.inOut)
        .then(() => this.root.remove(old.g));
      await this.wait(0.35);
      if (this.dead) return;
      const p = this.seat(this.newPail(plan.pail[0], plan.pail[1]), 0);
      p.g.position.y = 3.2;
      await this.s.anim(0.7, (e) => { p.g.position.y = 3.2 * (1 - e); }, Ease.inOut);
      p.g.position.y = 0;
      sfx.thunk();
      this.ss.kick(0.6);
      this.happyPail(p);
      await this.wait(0.15);
      return;
    }
    if (lv === 2) {
      // clear away the last round's "which holds more?" pails
      if (this.cands.length) {
        const old = this.cands;
        this.cands = [];
        old.forEach((c, i) => { input.remove(c.tapT); this.s.wait(i * 0.15).then(() => popOut(this.s, c.g, 0.4)).then(() => this.root.remove(c.g)); });
        await this.wait(0.6);
      }
      if (plan.task === 'balance' && r > 0) {
        // she tips both pails out herself (sand turns out as castles, water splashes out), then the starting weight
        // is poured into one of them
        await this.tipAll();
        if (this.dead) return;
        const side = plan.pre[0] ? 0 : 1, L = plan.pre[side];
        const P = this.pourers[plan.preMat === 'water' ? 'jug' : 'scoop'];
        await this.autoPour(P, this.plank[side], L, { rate: 1.4, setup: true });
        await this.wait(0.3);
      }
      if (plan.task === 'more') {
        const order = Math.random() < 0.5 ? [0, 1] : [1, 0];
        const caps = plan.cands.map(([c, sx, sy]) => sx * sx * sy);
        const smallI = caps[0] < caps[1] ? 0 : 1, bigI = 1 - smallI;
        // the one that pours: the little one into the big one ("more"), the big one into the little one ("less")
        const fullI = plan.ask === 'less' ? bigI : smallI;
        plan.cands.forEach(([col, sx, sy], i) => {
          const p = this.newPail(col, sx, sy);
          const at = FRONT[order[i]];
          p.g.position.copy(at);
          p.g.rotation.y = at.x < SS.x ? 0.15 : -0.15;
          if (i === fullI) p.set(1, plan.mat);
          p.tick(0, 0);
          this.root.add(p.g);
          this.cands.push(p);
          p.g.scale.setScalar(0.01);
          this.s.wait(i * 0.25).then(() => popIn(this.s, p.g, 1, 0.55, { sound: i === 0 }));
        });
        await this.wait(1.0);
      }
    }
  }
  // Level 3, before a new balance: "Tip them out!" - she taps each full pail on the plank and it tips out (sand makes a
  // castle that stays, water splashes out); the round goes on once both are empty.
  async tipAll() {
    const list = this.seatPails.filter((p) => p.level > 0.01);
    if (!list.length) return;
    for (const p of this.seatPails) p.tippedOut = false;
    this.task = 'tipall';
    for (const p of this.seatPails) if (p.tapT) p.tapT.enabled = true;
    const done = new Promise((res) => (this.tipDone = res));
    this.phase = 'play';
    this.busy = false;
    this.cue();
    await done;
    this.tipDone = null;
    this.busy = true;
    this.phase = 'setup';
    this.task = null;
    this.clearHints();
    await this.wait(0.3);
  }
  checkTipped() {
    if (this.task === 'tipall' && this.seatPails.every((p) => p.level <= 0.01) && this.tipDone) this.tipDone();
  }
  // the payoff animation (castle, splash, pour-across) finishes before the next round sets up
  async afterSuccess() { if (this.payoff) await this.payoff; this.payoff = null; }

  // ---------------- hints ----------------
  pourerFor() { return this.pourers[this.plan?.mat === 'water' ? 'jug' : 'scoop']; }
  nudgeTarget() {
    if (this.phase !== 'play') return null;
    if (this.pourTask) return this.over ? this.target()?.g : this.pourerFor();
    return this.target()?.g || null;
  }
  // a stuck child: the scoop/jug (or the pail to tap) gives a slow, quiet bob where it stands
  nudge(step) {
    const o = this.nudgeTarget();
    if (this.task === 'pick') { for (const p of this.tapPails) this.hopPail(p); return; }
    const pail = o && o.userData && o.userData.pail;
    if (pail) { this.hopPail(pail); if (step >= 2) { const stop = fx.halo(pail.mid, 0.6 * Math.max(pail.sx, pail.sy)); this.s.wait(3).then(stop); } return; }
    const P = o && o.userData && o.userData.tilt ? o : null;
    if (!P || this.dragP === P) return hop(this.s, this.pip, 0.4, 0.6);
    const t = P.userData.tilt;
    this.s.anim(0.7, (_, q) => { t.position.y = Math.sin(q * Math.PI) * 0.35; t.rotation.x = Math.sin(q * Math.PI * 2) * 0.08; }).then(() => { t.position.y = 0; t.rotation.x = 0; });
    if (step >= 2) { const stop = fx.halo(P, 1.0); this.s.wait(3).then(stop); }
  }
  // the slow hand on the real thing: carry the scoop/jug up over the pail (it tips and pours by itself); tap the
  // pail to tip it out; or, for a "which one?" question, point at each pail in turn
  showHint(glowOn = true) {
    const t = this.target();
    if (!t) return;
    if (this.task === 'pick') { fx.ghostPath(this.tapPails.map((p) => p.mouth().add(V(0, -0.35, 0.3))), { mode: 'scan', maxDur: 3.4 }); return; }
    if (this.pourTask && !this.over) {
      const P = this.pourerFor();
      const from = P.position.clone().add(V(0.3, 0.1, 0));
      const to = t.mouth().add(V(-0.45, 0.7, 0.3));
      if (glowOn) this.addHalo(t.mid, 0.75 * Math.max(t.sx, t.sy));
      // carry it over the pail and keep pressing there a while: the pour needs the finger held
      fx.ghostPath([from, from.clone().add(V(0, 1.2, 0)), to, to.clone().add(V(0.15, -0.05, 0)), to.clone().add(V(0.05, 0, 0)), to.clone().add(V(-0.05, 0, 0))], { mode: 'drag', maxDur: 5.2 });
    } else {
      if (glowOn) this.addHalo(t.mid, 0.6 * Math.max(t.sx, t.sy));
      fx.ghostPath([t.mouth().add(V(0, -0.4, 0.3))], { mode: 'tap', maxDur: 3.4 });
    }
  }
  choicePoints() { return null; }
  makeErrorless() {
    const t = this.target();
    if (!t) return;
    if (this.pourTask) { this.sticky = true; this.addHalo(t.mid, 0.75 * Math.max(t.sx, t.sy)); return; }
    this.addHalo(t.mid, 0.6 * Math.max(t.sx, t.sy));
    if (this.task === 'more' || this.task === 'tipall') return;   // nothing to switch off: there is no wrong pail
    for (const p of this.tapPails) if (p !== t && p.tapT) { p.tapT.enabled = false; this.s.tween(p.g.scale, { x: 0.85, y: 0.85, z: 0.85 }, 0.5); }
  }

  // ---------------- feel: camera stations, slow hand demos ----------------
  feelInit() {
    this.taught = new Set();
    this.demoAt = 8;
    this.demoId = 0;
    this.offs.push(input.onAny(() => { this.demoAt = 8; this.endDemo(); }));
  }
  // glide the camera to a station, eased (the latest glide wins)
  glide(c, dur = 0.85) {
    const id = (this.camId = (this.camId || 0) + 1);
    const p0 = camera.position.clone(), l0 = getLook().clone();
    if (p0.distanceTo(c.pos) < 0.01 && l0.distanceTo(c.look) < 0.01) return Promise.resolve();
    return this.s.anim(dur, (e) => { if (this.camId === id) setCamera(_cp.lerpVectors(p0, c.pos, e), _cl.lerpVectors(l0, c.look, e)); }, Ease.inOut);
  }
  // a slow hand demo on the real thing; any touch ends it
  demo(dur = 4.4) {
    if (this.dead) return;
    fx.clearHands();
    this.demoing = true;
    const id = ++this.demoId;
    this.showHint(this.task !== 'pick' && this.task !== 'more');
    this.s.wait(dur).then(() => { if (this.demoId === id) this.endDemo(); });
  }
  endDemo() { if (!this.demoing) return; this.demoing = false; this.demoId++; fx.clearHands(); }
  // say what to do; the first time each kind of action comes up, show it slowly
  cue() {
    if (this.dead || this.busy) return;
    this.prompt();
    this.demoAt = 8;
    this.teachNow();
  }
  teachNow() {
    const k = this.action();
    if (k && !this.taught.has(k)) { this.taught.add(k); this.demo(); }
  }
  // stuck for about 8 s: show it again (and again every ~14 s)
  stuckCheck() {
    if (this.busy || this.demoing || this.dragP || this.auto || input.dragging() || !this.action()) return;
    if (this.idle >= this.demoAt) { this.demoAt = this.idle + 14; this.demo(); }
  }

  // ---------------- the finale: the sandpit with her castles and the see-saw ----------------
  creationView() { return { pos: V(2.2, 4.9, 12.2), look: V(2.2, 1.1, 1.0) }; }
  creationObjects() { return [...this.castles, ...this.spills]; }

  // ---------------- test hooks ----------------
  // every pail the child can tap this round (this.plank holds the two on the see-saw)
  get pails() { return this.tapPails; }
  async pourInto(p, level = this.goal()) {
    if (this.phase !== 'play' || !this.pourTask || this.auto) return;
    const P = this.pourerFor();
    this.sticky = true;
    await this.autoPour(P, p, level, { rate: AUTO_RATE });
    if (this.task === 'balance') this.checkBalance(false); else this.afterPour(p);
  }

  // ---------------- every frame ----------------
  update(dt, t) {
    this.stuckCheck();
    this.pourStep(dt);
    const [mL, mR] = this.masses();
    const ss = this.ss;
    ss.step(dt, mL, mR);
    // a wooden creak when it swings
    this.creakT -= dt;
    if (Math.abs(ss.omega) > 0.9 && this.creakT <= 0) { this.creakT = 2.0; bal.creak(); }
    // water keeps level with the world: the plank's tilt plus the pail's own lean
    const tilt = (p) => Math.max(-0.9, Math.min(0.9, (p.g.parent === ss.seats[p.side] ? ss.theta : 0) + p.g.rotation.z));
    for (const p of this.seatPails) p.tick(dt, t, tilt(p), ss.acc * 0.002);
    for (const p of this.cands) p.tick(dt, t, tilt(p));
    this.stream.update(dt, t);
    // the balance bubble: lights green when level
    if (this.task === 'balance' && this.phase === 'play') {
      const p = this.target();
      if (p) {
        const near = Math.abs(p.level - this.balanceLevel(p)) * p.cap <= ss.tol + 1e-4;
        if (near && !this.wasNear) bal.balance();
        this.wasNear = near;
      }
    }
  }

  dispose() { pourSound.stop(); super.dispose(); }
}
const WRONG = { heavy: "That's the light one!", light: "That's the heavy one!", full: "That one isn't full yet!" };
const _a = new T.Vector3(), _b = new T.Vector3(), _v = new T.Vector3(), _x = new T.Vector3(1, 0, 0), _zero = new T.Vector3();
