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
import { input } from '../engine/input.js';
import { cursor } from '../engine/cursor.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { setCamera, project } from '../engine/stage.js';
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
    { task: 'fill', side: 0, goal: 1, mat: 'sand', pail: [YELLOW, 1.1], say: 'Fill the big bucket up!' },
    { task: 'empty', side: 0, say: 'Tip it out!' },
  ],
  // Level 2: two pails; half and full, heavy and light (each round carries on from the last)
  [
    { task: 'fill', side: 0, goal: 0.5, mat: 'sand', say: 'Fill this bucket half way!' },
    { task: 'pick', ask: 'heavy', say: 'Which bucket is heavy?' },
    { task: 'fill', side: 1, goal: 1, mat: 'water', say: 'Fill this one right up!' },
    { task: 'pick', ask: 'full', say: 'Which bucket is full?' },
    { task: 'empty', ask: 'half', say: 'Tip out the half full one!' },
    { task: 'pick', ask: 'light', say: 'Which bucket is light?' },
  ],
  // Level 3: balance the see-saw by pouring just enough; which holds more / less (proved by pouring one into the other)
  [
    { task: 'balance', side: 1, pre: [1, 0], preMat: 'sand', mat: 'sand', say: 'Make the see-saw balance!' },
    { task: 'more', ask: 'more', cands: [[GREEN, 1.25, 1.2], [PINK, 0.72, 0.72]], mat: 'sand', say: 'Which one holds more?', line: 'The big one holds more!' },
    { task: 'balance', side: 0, pre: [0, 0.5], preMat: 'water', mat: 'water', say: 'Balance it with water!' },
    { task: 'more', ask: 'more', cands: [[PURPLE, 1.35, 0.78], [TEAL, 0.66, 1.3]], mat: 'water', say: 'Which one holds more?', line: 'The wide one holds more!' },
    { task: 'balance', side: 1, pre: [0.75, 0], preMat: 'sand', mat: 'sand', say: 'Make it balance again!' },
    { task: 'more', ask: 'less', cands: [[ORANGE, 1.2, 1.1], [BLUE, 0.75, 0.7]], mat: 'sand', say: 'Which one holds less?', line: 'The small one holds less!' },
  ],
];
const CAM = { pos: new T.Vector3(0.3, 4.9, 12.6), look: new T.Vector3(0.3, 1.85, 0) };
const SS = new T.Vector3(2.2, 0, -0.7);           // the see-saw's brick
const HEAP = new T.Vector3(-5.2, 0, -2.4);        // the sand heap (the scoop rests on its front)
const TUB = new T.Vector3(-4.3, 0, 1.2);          // the water tub (the jug stands beside it)
const PIP = new T.Vector3(-6.75, 0, -0.6);
const DRAG_Z = SS.z + 0.2;                        // carried pourers move in this plane, just in front of the pails
const FRONT = [new T.Vector3(0.5, 0, 2.5), new T.Vector3(3.9, 0, 2.5)];   // where "which holds more?" pails stand
const SPOTS = [new T.Vector3(3.5, 0, 3.4), new T.Vector3(1.2, 0, 3.7), new T.Vector3(5.5, 0, 3.0), new T.Vector3(-0.8, 0, 3.8)];
const RATE = 0.75;                                // pour speed: a unit pail fills in about 1.3 s
const AUTO_RATE = 1.5;
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
    setCamera(CAM.pos, CAM.look);
    this.pip.position.copy(PIP);
    this.pip.rotation.y = 0.6;
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
      const ch = (this.chick = makeChick(0.8));
      ch.userData.noWalk = true;
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
    for (const type of ['scoop', 'jug']) {
      const P = makePourer(type);
      const H = this.homes[type];
      H.p.y += P.userData.P.grip[1] * P.userData.P.k;
      P.position.copy(H.p);
      P.userData.tilt.rotation.z = H.r;
      this.root.add(P);
      this.pourers[type] = P;
      this.addPourDrag(P);
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
    this.finger.copy(P.position);
    P.position.z = DRAG_Z;
    this.idle = 0;
    this.demoDone = true;
    fx.clearHands();
    if (u.type === 'scoop') { bal.scoop(); this.puff(V(P.position.x, 0.9, HEAP.z + 1.2), MATS.sand.grain, 8); }
    else { bal.dip(); this.drops(V(TUB.x + 0.6, 0.7, TUB.z + 0.3), 8); }
  }
  release(P, zone, info) {
    if (this.dragP !== P || this.auto) return;
    const wasOver = this.hover;
    this.dragP = null;
    this.hover = null;
    this.stopPour();
    if (info && info.tapped) { this.tapPourer(P); return; }
    this.goHome(P);
    if (this.phase !== 'play') return;
    if (this.task === 'balance' && (wasOver || this.pouredSome)) this.checkBalance(true);
    else if (!wasOver && zone && !zone.ok) this.redirect(this.task === 'fill' ? 'Pour it in this one!' : 'This one!'), this.hopPail(this.target());
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
    const c = V((a.x + H.p.x) / 2, Math.max(a.y, H.p.y) + (far ? 1.5 : 0.7), far ? Math.max(a.z, H.p.z) + 1.4 : (a.z + H.p.z) / 2);
    const dur = far ? 0.48 : 0.34;
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
    sfx.land();
    if (u.type === 'scoop') this.puff(V(H.p.x + 0.3, 0.7, H.p.z), MATS.sand.grain, 5);
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
    const to = pail.mouth().add(V(-1.0, 0.9, 0));
    to.z = DRAG_Z;
    if (u.type === 'scoop') bal.scoop(); else bal.dip();
    // up and over (a high arc in front of the plank), then in over the pail
    const c = V((from.x + to.x) / 2, Math.max(from.y, to.y) + 1.2, Math.max(from.z, to.z) + 0.8);
    await this.s.anim(0.4, (e) => { const i = 1 - e; this.finger.set(i * i * from.x + 2 * i * e * c.x + e * e * to.x, i * i * from.y + 2 * i * e * c.y + e * e * to.y, i * i * from.z + 2 * i * e * c.z + e * e * to.z); }, Ease.inOut);
    if (this.dead) return;
    this.hover = pail;
    for (let k = 0; k < 120 && !this.dead && this.auto && pail.level < goal - 0.002; k++) await this.wait(0.05);
    if (this.dead) return;
    this.hover = null;
    await this.wait(0.12);
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
    this.blend = Math.max(0, Math.min(1, this.blend + (hover ? dt / 0.16 : -dt / 0.12)));
    const e = Ease.inOut(this.blend);
    const tiltTo = hover ? u.P.pour : -0.12;
    u.tilt.rotation.z += (tiltTo - u.tilt.rotation.z) * Math.min(1, dt * (hover ? 9 : 12));
    if (hover) {
      // the spout over the pail's opening, a little to the left so the stream curves in to the middle
      const m = hover.mouth();
      this.snap = (this.snap || new T.Vector3()).set(m.x - 0.2 * hover.sx, m.y + 0.48, DRAG_Z).sub(spoutOffset(P, u.P.pour));
    }
    if (this.snap && this.blend > 0) P.position.lerpVectors(this.finger, this.snap, e);
    else P.position.copy(this.finger);
    P.position.z = DRAG_Z;
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
    if (before < 0.999 && p.level >= 0.999) { p.flash('full'); bal.ding(true); const m = p.mouth(); const s = project(m); fx.sparkle(s.x, s.y); }
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
      this.success(p.mouth().add(V(0, 0.6, 0.6)), half ? 'Half full!' : (this.level === 0 ? "It's full!" : 'Full right up!'));
    } else if (this.task === 'balance') this.checkBalance(false);
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
      bal.balance();
      this.s.wait(0.25).then(() => { for (const q of this.seatPails) this.happyPail(q); });
      const pos = this.ss.g.position.clone().add(V(0, 2.2, 1));
      this.success(pos, 'It balances!');
    } else if (d > 0 && fromRelease) {
      this.over = true;
      this.redirect('Too much! Tap it to tip some out.');
      this.hopPail(p);
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
    await this.s.anim(0.18, (e) => lean(-side * 0.9 * e));
    const m = p.mouth(), land = V(m.x + side * 0.9, 0.02, m.z + 0.2);
    this.stream.aim(p.mouth(_b).add(V(side * 0.15 * p.sx, -0.05, 0)), V(side, 0, 0), land);
    this.stream.start(p.mat === 'water' ? 'water' : 'sand', 0.8);
    pourSound.start(p.mat === 'water' ? 'water' : 'sand');
    await this.s.anim(0.3, (e) => { p.level = startL + (to - startL) * e; this.stream.aim(p.mouth(_b).add(V(side * 0.15 * p.sx, -0.05, 0)), V(side, 0, 0), land); });
    this.stopPour();
    if (p.mat === 'water') this.puddle(land, 0.5); else this.puff(land, MATS.sand.grain, 6);
    await this.s.anim(0.2, (e) => lean(-side * 0.9 * (1 - e)));
    lean(0);
    p.tipping = false;
    if (Math.abs(p.level - this.balanceLevel(p)) * p.cap <= this.ss.tol + 1e-4) { this.over = false; this.checkBalance(false); }
    else if (p.level > this.balanceLevel(p)) this.say('A bit more out!', { max: 1 });
  }

  // ---------------- tapping pails ----------------
  tapPail(p) {
    if (this.dead) return;
    this.idle = 0;
    if (this.phase !== 'play' || this.demoing) { this.wigglePail(p); return; }
    this.demoDone = true;
    fx.clearHands();
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
      if (p !== this.target()) { this.redirect(WRONG[this.plan.ask] || 'Try the other one!'); this.wigglePail(p); return; }
      this.phase = 'done';
      this.pickPayoff(p);
      return;
    }
    if (t === 'more') {
      if (p !== this.target()) { this.redirect(this.plan.ask === 'less' ? 'Hmm, that one holds lots! Try again.' : 'Hmm, let\'s look again!'); this.wigglePail(p); return; }
      this.phase = 'done';
      this.payoff = this.pourAcross();
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
    sfx.tap();
    this.s.anim(0.3, (_, q) => { g.rotation.z = r0 + Math.sin(q * Math.PI * 3) * 0.08 * (1 - q); }).then(() => (g.rotation.z = r0));
  }
  hopPail(p) {
    if (!p || p.hopping) return;
    p.hopping = true;
    const g = p.g, y0 = g.position.y;
    sfx.boing && sfx.boing();
    this.s.anim(0.4, (_, q) => { g.position.y = y0 + Math.sin(q * Math.PI) * 0.45; }).then(() => { g.position.y = y0; p.hopping = false; });
  }
  pickPayoff(p) {
    const ask = this.plan.ask;
    this.happyPail(p);
    if (ask === 'heavy') { this.ss.kick((p.side ? -1 : 1) * 1.6); bal.clonk(0.7); }
    if (ask === 'light') { this.ss.kick((p.side ? 1 : -1) * 1.8); bal.whee(); }
    if (ask === 'full') { p.flash('full'); bal.ding(true); }
    const line = { heavy: 'Heavy goes down!', light: 'Light goes up!', full: 'That one is full!' }[ask] || '';
    this.success(p.mouth().add(V(0, 0.6, 0.6)), line);
  }
  // Tip a pail out in front of the see-saw: sand turns out as a castle, water splashes out in a puddle.
  async tipOut(p) {
    const g = p.g, seat = g.parent, side = p.side;
    const sand = p.mat !== 'water';
    // sand turns out as a castle in a tidy row at the front; water is poured out just in front of its end of the plank
    const spot = sand ? this.freeSpot(side) : V(g.getWorldPosition(_v).x + 0.2, 0, SS.z + 2.0);
    const L = p.level;
    this.root.attach(g);
    const a = g.position.clone(), r0 = g.rotation.clone();
    const H = PAIL.H * p.sy;
    sfx.swoosh();
    if (sand) {
      // up and over: it lands upside down on the spot
      const to = V(spot.x, H, spot.z);
      await this.s.anim(0.42, (e, q) => {
        g.position.lerpVectors(a, to, e);
        g.position.y += Math.sin(q * Math.PI) * 1.4;
        g.rotation.set(r0.x * (1 - e), r0.y * (1 - e), r0.z + (Math.PI - r0.z) * e);
      }, Ease.inOut);
      if (this.dead) return;
      g.position.copy(to);
      bal.plop();
      this.puff(V(spot.x, 0.1, spot.z), MATS.sand.grain, 12);
      // squash on landing
      const s0 = g.scale.x;
      await this.s.anim(0.14, (_, q) => { const k = Math.sin(q * Math.PI); g.scale.set(s0 * (1 + 0.08 * k), s0 * (1 - 0.1 * k), s0 * (1 + 0.08 * k)); });
      g.scale.setScalar(s0);
      // the castle appears as the pail lifts away
      const c = makeCastle(p.sx, p.sy * Math.max(0.5, L));
      c.position.copy(spot);
      c.rotation.y = (Math.random() - 0.5) * 0.4;
      this.root.add(c);
      this.castles.push(c);
      p.set(0);
      const up = V(spot.x, H + 1.1, spot.z);
      this.success(V(spot.x, 1.8, spot.z + 0.5), this.level === 0 ? (this.round === 1 ? 'A sand castle!' : 'Empty!') : "Now it's empty!");
      await this.s.anim(0.22, (e) => { g.position.lerpVectors(to, up, e); }, Ease.out);
      sfx.pop();
      const cs = c.scale.clone();
      this.s.anim(0.3, (_, q) => { const k = Math.sin(q * Math.PI) * (1 - q); c.scale.set(cs.x * (1 + 0.12 * k), cs.y * (1 - 0.15 * k + 0.1 * Math.sin(q * Math.PI * 2)), cs.z * (1 + 0.12 * k)); }).then(() => c.scale.copy(cs));
      // and back onto the plank, the right way up
      seat.attach(g);
      const b = g.position.clone(), rz = g.rotation.z;
      await this.s.anim(0.4, (e, q) => {
        g.position.lerpVectors(b, _zero, e);
        g.position.y += Math.sin(q * Math.PI) * 0.8;
        g.rotation.set(0, (side ? -0.2 : 0.2) * e, rz * (1 - e));
      }, Ease.inOut);
    } else {
      // hop off to the front, lean over and pour it out
      const to = V(spot.x, 0, spot.z);
      await this.s.anim(0.34, (e, q) => {
        g.position.lerpVectors(a, to, e);
        g.position.y += Math.sin(q * Math.PI) * 1.0;
        g.rotation.set(r0.x * (1 - e), r0.y * (1 - e), r0.z * (1 - e));
      }, Ease.inOut);
      if (this.dead) return;
      sfx.land();
      // it rolls over onto its side about the outer edge of its base, so it lies on the sand (never sinks into it)
      const dir = 1, px = dir * (PAIL.RB + 0.085) * p.sx;
      const roll = (a) => { g.rotation.z = a; g.position.x = spot.x + px - px * Math.cos(a); g.position.y = -px * Math.sin(a); };
      await this.s.anim(0.2, (e) => roll(-dir * 1.7 * e));
      const land = V(spot.x + px + dir * (PAIL.H * p.sy + 0.35), 0.02, spot.z + 0.15);
      const lip = () => g.localToWorld(_b.set(dir * 0.55, PAIL.H * 1.02, 0));
      this.stream.aim(lip(), V(dir, 0, 0), land);
      this.stream.start('water', 1.25);
      pourSound.start('water');
      bal.splash();
      this.puddle(land, 0.9 * p.sx);
      this.success(V(spot.x, 1.8, spot.z + 0.5), this.level === 0 ? 'All empty!' : "Now it's empty!");
      await this.s.anim(0.45, (e) => { p.level = L * (1 - e); this.stream.aim(lip(), V(dir, 0, 0), land); });
      p.set(0);
      this.stopPour();
      this.drops(land, 10);
      await this.s.anim(0.18, (e) => roll(-dir * 1.7 * (1 - e)));
      roll(0);
      seat.attach(g);
      const b = g.position.clone(), rz = g.rotation.z;
      await this.s.anim(0.36, (e, q) => {
        g.position.lerpVectors(b, _zero, e);
        g.position.y += Math.sin(q * Math.PI) * 0.9;
        g.rotation.set(0, (side ? -0.2 : 0.2) * e, rz * (1 - e));
      }, Ease.inOut);
    }
    if (this.dead) return;
    g.position.set(0, 0, 0);
    g.rotation.set(0, side ? -0.2 : 0.2, 0);
    sfx.land();
    this.ss.kick(side ? -0.6 : 0.6);
  }
  freeSpot(side) {
    const used = this.castles.map((c) => c.position).concat(this.puddles.filter((q) => q.userData.alive).map((q) => q.position));
    const order = [0, 1, 2, 3];
    for (const i of order) if (!used.some((u) => Math.hypot(u.x - SPOTS[i].x, u.z - SPOTS[i].z) < 1.6)) return SPOTS[i].clone();
    return SPOTS[order[0]].clone();
  }
  // "which holds more?": the small one, full, pours itself into the big one - which still has lots of room
  async pourAcross() {
    const [big, small] = this.capOrder();
    const g = small.g, a = g.position.clone(), r0 = g.rotation.z;
    const dir = big.g.position.x > a.x ? 1 : -1;
    const bm = big.mouth();
    const H = PAIL.H * small.sy;
    const to = V(bm.x - dir * (0.75 + 0.6 * small.sx), bm.y + 0.4, bm.z + 0.35);
    const pick = this.target();
    this.happyPail(pick);
    this.success(pick.mouth().add(V(0, 0.8, 0.6)), this.plan.line);
    await this.s.anim(0.32, (e, q) => { g.position.lerpVectors(a, to, e); g.position.y += Math.sin(q * Math.PI) * 0.5; g.rotation.z = r0 - dir * 1.9 * Math.max(0, (q - 0.4) / 0.6); }, Ease.inOut);
    if (this.dead) return;
    const lip = () => g.localToWorld(_b.set(dir * 0.72, PAIL.H * 0.97, 0));
    const mat = small.mat || 'sand';
    this.stream.start(mat, 1.1);
    pourSound.start(mat);
    const L0 = small.level, B0 = big.level, add = (small.cap * L0) / big.cap;
    await this.s.anim(0.6, (e) => {
      small.level = L0 * (1 - e);
      const before = big.level;
      big.add(B0 + add * e - big.level, mat);
      big.wob = 1;
      this.marksCrossed(big, before);
      this.stream.aim(lip(), V(dir, 0, 0), big.surface());
      pourSound.update(1 / 60, big.level);
    });
    small.set(0);
    this.stopPour();
    await this.s.anim(0.3, (e, q) => { g.position.lerpVectors(to, a, e); g.position.y += Math.sin(q * Math.PI) * 0.4; g.rotation.z = (r0 - dir * 1.9) * (1 - e) + r0 * e; }, Ease.inOut);
    g.position.copy(a);
    g.rotation.z = r0;
    sfx.land();
  }
  capOrder() { const c = this.cands.slice().sort((x, y) => y.cap - x.cap); return [c[0], c[c.length - 1]]; }

  // ---------------- see-saw life ----------------
  bump(side, sp) {
    const k = Math.min(1, sp / 2);
    bal.clonk(0.5 + 0.5 * k);
    const x = SS.x + side * (SEESAW.PL - 0.2);
    this.puff(V(x, 0.05, SS.z + 0.4), MATS.sand.grain, 4 + Math.round(6 * k));
    this.puff(V(x, 0.05, SS.z - 0.4), MATS.sand.grain, 3 + Math.round(4 * k));
    // the other end flies up: Chick gets a ride
    if (this.chick && side < 0 && k > 0.25) {
      sfx.cheep();
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
    if (t === 'more') { const [big, small] = this.capOrder(); return plan.ask === 'less' ? small : big; }
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
    // the new task is said right away, while the pails get ready (a new pail, tipping out, the starting pour)
    if (r > 0) this.prompt();
    await this.setup(plan, r);
    if (this.dead) return;
    this.task = plan.task;
    this.ss.tol = this.task === 'balance' ? 0.05 : 0;
    for (const p of this.seatPails) if (p.tapT) p.tapT.enabled = this.task !== 'more';
    for (const p of this.cands) if (p.tapT) p.tapT.enabled = this.task === 'more';
    this.enablePourers(this.pourTask);
    this.phase = 'play';
    this.busy = false;
    // "this one": the pail to fill hops (when there is a choice of two)
    if ((this.task === 'fill' || this.task === 'balance') && this.seatPails.length > 1) this.hopPail(this.target());
    if (r === 0 && !this.demoDone) this.cue();
    else if (r === 0) this.prompt();
  }
  promptText() { return this.plan?.say || ''; }
  prompt() { const t = this.promptText(); if (t) this.say(t, { max: 1.6 }); }

  async setup(plan, r) {
    const lv = this.level;
    if (lv === 0 && plan.pail) {
      // the old pail hops off behind the see-saw, a new one drops onto the plank
      const old = this.plank[0];
      this.root.attach(old.g);
      const a = old.g.position.clone(), to = V(SS.x - 5.8, 0, SS.z - 3.2);
      input.remove(old.tapT);
      sfx.swoosh();
      this.s.anim(0.45, (e, q) => { old.g.position.lerpVectors(a, to, e); old.g.position.y += Math.sin(q * Math.PI) * 1.6; old.g.rotation.z = q * 2.5; }, Ease.inOut)
        .then(() => popOut(this.s, old.g, 0.2)).then(() => this.root.remove(old.g));
      await this.wait(0.2);
      const p = this.seat(this.newPail(plan.pail[0], plan.pail[1]), 0);
      p.g.position.y = 3.2;
      await this.s.anim(0.32, (e) => { p.g.position.y = 3.2 * (1 - e); }, Ease.in);
      p.g.position.y = 0;
      sfx.thunk();
      this.ss.kick(0.9);
      this.happyPail(p);
      await this.wait(0.1);
      return;
    }
    if (lv === 2) {
      // clear away the last round's "which holds more?" pails
      if (this.cands.length) {
        const old = this.cands;
        this.cands = [];
        old.forEach((c, i) => { input.remove(c.tapT); this.s.wait(i * 0.06).then(() => popOut(this.s, c.g, 0.22)).then(() => this.root.remove(c.g)); });
        await this.wait(0.2);
      }
      if (plan.task === 'balance' && r > 0) {
        // tip both pails out, then pour the starting weight into one of them
        await this.dumpAll();
        const side = plan.pre[0] ? 0 : 1, L = plan.pre[side];
        const P = this.pourers[plan.preMat === 'water' ? 'jug' : 'scoop'];
        await this.autoPour(P, this.plank[side], L, { rate: 2.4, setup: true });
        await this.wait(0.1);
      }
      if (plan.task === 'more') {
        const order = Math.random() < 0.5 ? [0, 1] : [1, 0];
        const caps = plan.cands.map(([c, sx, sy]) => sx * sx * sy);
        const smallI = caps[0] < caps[1] ? 0 : 1;
        plan.cands.forEach(([col, sx, sy], i) => {
          const p = this.newPail(col, sx, sy);
          const at = FRONT[order[i]];
          p.g.position.copy(at);
          p.g.rotation.y = at.x < SS.x ? 0.15 : -0.15;
          if (i === smallI) p.set(1, plan.mat);
          p.tick(0, 0);
          this.root.add(p.g);
          this.cands.push(p);
          p.g.scale.setScalar(0.01);
          this.s.wait(i * 0.1).then(() => popIn(this.s, p.g, 1, 0.38));
        });
        await this.wait(0.45);
      }
    }
  }
  // flip each pail on the plank right over in the air: what's in it drops out onto the sand
  async dumpAll() {
    const list = this.seatPails.filter((p) => p.level > 0.01);
    if (!list.length) return;
    sfx.swoosh();
    await Promise.all(list.map((p, i) => this.s.wait(i * 0.08).then(async () => {
      const g = p.g, side = p.side ? 1 : -1;
      const mat = p.mat;
      let dropped = false;
      await this.s.anim(0.5, (e, q) => {
        g.position.y = Math.sin(q * Math.PI) * 1.4;
        g.rotation.z = side * e * Math.PI * 2;
        if (!dropped && q > 0.45) {
          dropped = true;
          const w = g.localToWorld(_b.set(0, PAIL.H * 0.6, 0));
          if (mat === 'water') { this.drops(w, 12); bal.splash(); } else { this.puff(w, MATS.sand.grain, 14); bal.plop(); }
          p.set(0);
        }
      }, Ease.inOut);
      g.position.y = 0; g.rotation.z = 0;
    })));
    sfx.land();
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
  // a stuck child: the scoop/jug (or the pail to tap) does a little hop where it stands
  nudge(step) {
    const o = this.nudgeTarget();
    const pail = o && o.userData && o.userData.pail;
    if (pail) { this.hopPail(pail); if (step >= 2) { const stop = fx.halo(pail.mid, Math.max(pail.sx, pail.sy)); this.s.wait(3).then(stop); } return; }
    const P = o && o.userData && o.userData.tilt ? o : null;
    if (!P || this.dragP === P) return super.nudge(step);
    sfx.boing && sfx.boing();
    const t = P.userData.tilt;
    this.s.anim(0.5, (_, q) => { t.position.y = Math.sin(q * Math.PI) * 0.45; t.rotation.x = Math.sin(q * Math.PI * 2) * 0.1; }).then(() => { t.position.y = 0; t.rotation.x = 0; });
    if (step >= 2) { const stop = fx.halo(P, 1.0); this.s.wait(3).then(stop); }
  }
  showHint(glowOn = true) {
    const t = this.target();
    if (!t) return;
    if (this.pourTask) {
      const P = this.pourerFor();
      const from = P.position.clone().add(V(0.5, 0.2, 0));
      const to = t.mouth().add(V(-0.6, 0.7, 0.4));
      if (glowOn) this.addHalo(t.mid, 1.0 * Math.max(t.sx, t.sy));
      fx.ghostPath([from, to], { mode: 'drag' });
    } else {
      if (glowOn) this.addHalo(t.mid, 1.0 * Math.max(t.sx, t.sy));
      fx.ghostPath([t.mouth().add(V(0, -0.4, 0.3))], { mode: 'tap' });
    }
  }
  choicePoints() {
    if (this.task === 'more') return this.cands.map((p) => p.mouth().add(V(0, -0.3, 0.3)));
    return null;
  }
  makeErrorless() {
    const t = this.target();
    if (!t) return;
    if (this.pourTask) { this.sticky = true; this.addHalo(t.mid, 1.0 * Math.max(t.sx, t.sy)); return; }
    this.addHalo(t.mid, 1.0 * Math.max(t.sx, t.sy));
    for (const p of this.tapPails) if (p !== t && p.tapT) { p.tapT.enabled = false; this.s.tween(p.g.scale, { x: 0.85, y: 0.85, z: 0.85 }, 0.3); }
  }

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
    this.pourStep(dt);
    const [mL, mR] = this.masses();
    const ss = this.ss;
    ss.step(dt, mL, mR);
    // a wooden creak when it swings
    this.creakT -= dt;
    if (Math.abs(ss.omega) > 0.7 && this.creakT <= 0) { this.creakT = 0.5; bal.creak(); }
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
        if (near && !this.wasNear) { bal.balance(); const s = project(ss.bubble.getWorldPosition(_v)); fx.sparkle(s.x, s.y); }
        this.wasNear = near;
      }
    }
  }

  dispose() { pourSound.stop(); super.dispose(); }
}
const WRONG = { heavy: 'That one is light! Heavy goes down.', light: 'That one is heavy! Light goes up.', full: "That one isn't full yet!" };
const _a = new T.Vector3(), _b = new T.Vector3(), _v = new T.Vector3(), _x = new T.Vector3(1, 0, 0), _zero = new T.Vector3();
