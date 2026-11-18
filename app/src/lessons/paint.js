// Paint & mix (docs/design/paint.md). Topics mt_6msyXavNJf (making and controlling marks), mt_-STxLMqeqF (mixing
// paint colours), mt_2Kn5ianVWN (composing visual artwork), mt_r-BgS-lqTe (following instructions).
// A calm painting table: touch a pot and the brush dips itself; rub the wooden toy and real paint goes on just above
// her finger (paint-canvas.js); when it is done she hangs it on the gallery wall, which fills up all level.
//   Level 1: free painting, one new thing per round (dip, rub, hang; colours; splat; two parts; stamp; mirror; choice)
//   Level 2: paint it the colour asked ("Paint the duck yellow!"), the friend or a picture card shows it
//   Level 3: make the colour: dab two paints into the dish, stir with her own rubbing, then paint
// The parent's rules (they override the design doc where they differ):
//  - NOTHING paints by itself. Paint goes on only exactly under her finger / the mouse pointer while it is pressed on
//    the toy (every pointer sample, coalesced events included, joined by dabs every 9 px: no gaps), or as one splat
//    where she taps. Touching a pot only dips the brush. Demos are a ghost hand only; hints never paint.
//  - The round ends only when SHE says so: once she has painted enough a little gallery sign rises over the easel
//    and glows ("Hang it up!"); she taps it, then drags her toy to its peg on the wall.
//  - She can act within ~0.3 s of every round start (the next toy is set up while the last one settles on its peg).
// The brush comes to her finger (no pick-up step), its tip glued to the pointer, and lies down on the easel ledge
// when she lifts. Works the same with touch, a mouse or a touchpad (pointer events).
// Autoplay / QA hooks: phase, want(), act(key), pots, coverage(part, colour)  (section 8.5).
import * as T from '../three.js';
import { Lesson, shuffle } from '../engine/lesson.js';
import { makeAnimal, setFace, hop } from '../engine/actors.js';
import { makeDuck, makeCrab } from '../engine/beach.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { project, screenRadius, camera } from '../engine/stage.js';
import { Ease } from '../engine/tween.js';
import { showGo } from '../engine/ui.js';
import { toonUnique, geo, toon } from '../engine/toon.js';
import { loadShapes, shapeOf, COLOURS, NAME, mixOf, RECIPE, RECIPE_LINE, hex, partAt, inPoly } from './paint-shapes.js';
import { PaintSurface, makeToy, screenToToy, toyWorld, toyLocal, toyCentreWorld, WOODS, blankTexture, setToyTexture, drawPicture, FRONT, N as CN } from './paint-canvas.js';
import * as S from './paint-studio.js';
import { psfx } from './paint-sound.js';

const V = (x = 0, y = 0, z = 0) => new T.Vector3(x, y, z);
const TIP_PX = 0;               // paint lands exactly under her finger / the mouse pointer (the parent's rule)
const HOVER_Y = 0.6;            // the brush's tip height while it is carried over the table
const TAP_T = 0.4, TAP_D = 0.12;   // (a 2-year-old's tap takes 0.2 - 0.45 s)
const STUCK = 8;                // seconds without the right action -> the hand shows it again
const WALL_Y = 3.05;            // the gallery wall's foot (its peg rows at 1.75 + 1.6 and + 3.1)
const WALL_Z = -1.7;
const MEADOW_Y = -1.25;         // the meadow ground, under the table top
const W_UP = new T.Vector3(0, 1, 0);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---------------------------------------------------------------- the 24 rounds
const L1 = [
  { toy: 'ball', pots: ['red'], free: 0.25, say: 'Touch the paint!', rub: 'Rub the ball!' },
  { toy: 'star', pots: ['red', 'yellow'], free: 0.25, say: 'Paint the star!' },
  { toy: 'heart', pots: ['yellow', 'blue'], free: 0.25, say: 'Paint the heart!' },
  { toy: 'fish', pots: ['red', 'yellow', 'blue'], free: 0.25, splats: 3, teach: 'splat', say: 'Tap, tap, tap!' },
  { toy: 'boat', pots: ['red', 'yellow', 'blue'], free: 0.25, say: 'Paint the boat!' },
  { toy: 'car', pots: ['red', 'yellow', 'blue', 'green'], free: 0.25, orStamps: 4, teach: 'stamp', say: 'Tap the stamp!' },
  { toy: 'butterfly', pots: ['red', 'yellow', 'blue', 'green'], free: 0.25, say: 'Paint the butterfly!' },
  { choose: ['cat', 'bunny', 'bird'], pots: ['red', 'yellow', 'blue', 'green', 'pink'], free: 0.25, say: 'Which one?', paint: 'Paint it!' },
];
const L2 = [
  { toy: 'duck', friend: 'duck', pots: ['yellow', 'blue'], fixed: true, steps: [{ part: 'body', col: 'yellow', say: 'Paint the duck yellow!', cap: 'Duck is yellow!' }] },
  { toy: 'frog', friend: 'frog', pots: ['red', 'green'], fixed: true, steps: [{ part: 'body', col: 'green', say: 'Paint the frog green!', cap: 'Frog is green!' }] },
  { toy: 'pig', friend: 'pig', pots: ['pink', 'yellow', 'blue'], steps: [{ part: 'body', col: 'pink', say: 'Paint the pig pink!', cap: 'Pig is pink!' }] },
  { toy: 'crab', friend: 'crab', pots: ['green', 'yellow', 'red'], steps: [{ part: 'body', col: 'red', say: 'Paint the crab red!', cap: 'Crab is red!' }] },
  { toy: 'apple', card: { apple: 'red', leaf: 'green' }, pots: ['red', 'green', 'yellow'], clip: true,
    steps: [{ part: 'apple', col: 'red', say: 'Paint the apple red!', cap: 'The apple is red!' }, { part: 'leaf', col: 'green', say: 'Now the leaf. Green!', cap: 'The leaf is green!' }] },
  { toy: 'flower', card: { bloom: 'pink', stem: 'green' }, pots: ['pink', 'green', 'blue', 'yellow'], clip: true,
    steps: [{ part: 'bloom', col: 'pink', say: 'Paint the flower pink!', cap: 'The flower is pink!' }, { part: 'stem', col: 'green', say: 'Now the stem. Green!', cap: 'The stem is green!' }] },
  { toy: 'mushroom', card: { cap: 'red' }, cardSpots: 'white', pots: ['red', 'white', 'blue'], clip: true, stamp: true,
    steps: [{ part: 'cap', col: 'red', say: 'Paint the top red!', cap: 'The top is red!' }, { spots: 3, col: 'white', say: 'Stamp three white spots!', cap: 'The top is red!' }] },
  { toy: 'pip', friend: 'pip', pots: ['yellow', 'orange', 'blue', 'green', 'red'], clip: true, stamp: true,
    steps: [{ part: 'body', col: 'yellow', say: 'Paint Pip yellow!', cap: 'Pip is yellow!' }, { part: 'beak', col: 'orange', say: 'Now the beak. Orange!', cap: 'The beak is orange!' }] },
];
const L3 = [
  { toy: 'goldfish', open: ['red', 'yellow'], intro: ["Let's make orange!"], look: true,
    steps: [{ part: 'body', col: 'orange', say: 'Paint the fish orange!', cap: 'The fish is orange!' }] },
  { toy: 'frog', friend: 'frog', open: ['blue', 'yellow'], intro: ["Let's make green!"], steps: [{ part: 'body', col: 'green', say: 'Paint the frog green!', cap: 'Frog is green!' }] },
  { toy: 'grapes', card: { body: 'purple' }, open: ['red', 'blue'], intro: ["Let's make purple!"], steps: [{ part: 'body', col: 'purple', say: 'Paint the grapes purple!', cap: 'The grapes are purple!' }] },
  { toy: 'turtle', card: { body: 'green' }, open: ['red', 'yellow', 'blue'], choice: true, intro: ["Let's make green!"], steps: [{ part: 'body', col: 'green', say: 'Paint the turtle green!', cap: 'The turtle is green!' }] },
  { toy: 'pumpkin', card: { body: 'orange' }, open: ['red', 'yellow', 'blue'], choice: true, intro: ["Let's make orange!"], steps: [{ part: 'body', col: 'orange', say: 'Paint the pumpkin orange!', cap: 'The pumpkin is orange!' }] },
  { toy: 'pig', friend: 'pig', open: ['red', 'white'], intro: ["Let's make pink!"], steps: [{ part: 'body', col: 'pink', say: 'Paint the pig pink!', cap: 'Pig is pink!' }] },
  { toy: 'carrot', card: { root: 'orange', top: 'green' }, open: ['red', 'yellow', 'blue'], choice: true, clip: true,
    steps: [{ part: 'root', col: 'orange', intro: ["Let's make orange!"], say: 'Paint the carrot orange!', cap: 'The carrot is orange!' }, { part: 'top', col: 'green', intro: ['Now the top. Make green!'], say: 'Paint the top green!', cap: 'The top is green!' }] },
  { toy: 'rainbow', open: ['red', 'yellow', 'blue'], rainbow: 3, clip: true, say: 'Paint a rainbow!' },
];
const NEED = { green: "Let's make green!", orange: "Let's make orange!", purple: "Let's make purple!", pink: "Let's make pink!" };
const L3_POTS = ['red', 'yellow', 'blue', 'white'];
const SAUCER = { orange: [-0.3, 0.3], green: [0.25, 0.3], purple: [0.8, 0.3], pink: [1.35, 0.3] };   // round 8's full saucers, in front of the easel
const CUP_X = -0.86;            // the stamp's cup stands at the ledge's left end (the right end is where the 'hang it up' sign stands)
const BRUSH_TIP = [-0.62, -0.3];   // where the lying brush's tip may rest along the ledge (clear of the cup and of the sign)
const SPARE = 0.54;
const HOOK_UP = 0.85, HANG_Z = -0.25;   // the gallery hook: 1.0 above the toy's easel peg, on the drag plane in front of the board
const SIGN_K = 1.1;              // the 'hang it up' sign's size (its frame 0.47 x 0.36: about 12 % of the screen high)             // spare and used dishes are small (saucer size): the stack is tidy, the dish grows as it comes
const FRIEND_SCALE = { duck: 0.86, frog: 0.5, pig: 0.45, crab: 0.42, pip: 0.42 };
const CALL = { duck: 'quack', frog: 'ribbit', pig: 'oink', pip: 'cheep' };

function crit(x, v, target, w, dt) { const e = Math.exp(-w * dt), d = x - target, k = v + w * d; return [target + (d + k * dt) * e, (v - w * k * dt) * e]; }

export default class PaintLesson extends Lesson {
  get totalRounds() { return 8; }
  async start() { await loadShapes(); return super.start(); }

  // ================================================================ building the studio
  build() {
    const lv = this.level;
    this.rounds = [L1, L2, L3][lv] || L1;
    this.meadow.position.y = MEADOW_Y;
    this.finaleRain = false;
    this.admireTime = 5;
    this.shown = new Set();          // demos already shown in this play of the level
    this.said = new Set();           // voiced-once-per-level lines (colour names, More paint!, recipes)
    this.hung = [];                  // finished toys on the wall, in order
    this.sat = [];                   // friends who sat for a portrait (they come back for the finale)
    this.phase = 'busy';
    // Layout (audit P1, measured): the easel stands on a 0.15 riser, the pots come close in front of it (no tool block:
    // the brush rests on the ledge, the stamp in its cup at the ledge's right end), the 'hang it up' sign sits in the
    // board's top-right corner; the camera looks in low (~14 degrees) so the toy is about half the screen high.
    // Level 3 has two stations: the paint view (easel, the mixing dish as the paint source, the saucers) and the mix
    // view (dish, pots behind it, the stack of spare dishes).
    const L = (this.L = lv < 2
      ? { easel: V(0, 0.15, -0.6), pip: V(-1.6, 0, -0.85), friend: V(1.6, 0, -0.75), potZ: 0.35, gap: 0.6 }
      : { easel: V(0.7, 0.15, -0.6), pip: V(-2.0, 0, -1.15), friend: V(2.3, 0, -0.75), potZ: -0.5, potX: [-2.36, -1.8, -1.24, -0.68], dish: V(-1.15, 0, 0.3), stack: V(-3.12, 0, 0.6), used: V(-3.05, 0, -0.06) });
    const add = (o, p) => { if (!o) return null; if (p) o.position.copy(p); this.root.add(o); return o; };
    add(S.makeTable());
    this.easel = add(S.makeEasel(), L.easel);
    this.wall = add(S.makeWall(), V(0, WALL_Y, WALL_Z));
    this.cup = add(S.makeStampCup(), V(L.easel.x + CUP_X, L.easel.y + S.LEDGE_TOP, L.easel.z + 0.11));
    if (this.cup) this.cup.visible = false;
    this.surface = new PaintSurface();
    // Pip watches from the left end of the table
    this.pip.scale.setScalar(0.42);
    this.pip.userData.baseScale = 0.42;
    this.pip.position.copy(L.pip);
    this.pip.rotation.y = 0.45;
    // the tools
    const brush = S.makeBrush();
    this.brush = { kind: 'brush', obj: add(brush), col: null, load: 0, mode: 'rest', glide: null, depth: 5, onToy: 0, lean: 0 };
    const stamp = S.makeStamp();
    this.stamp = { kind: 'stamp', obj: add(stamp), col: null, load: 0, prints: 0, mode: 'block', glide: null, depth: 5, onToy: 0, lean: 0 };
    this.tool = this.brush;
    this.stamp.obj.visible = false;   // it arrives in its cup in its first round (Level 1 round 6, Level 2 round 7)
    this.placeTool(this.stamp, this.blockPose(this.stamp));
    this.brush.obj.position.set(this.L.easel.x, 0, this.L.easel.z);   // (restPose reads where it is)
    this.placeTool(this.brush, this.restPose(this.brush));             // the brush lies on the easel ledge
    this.tipS = { x: innerWidth / 2, y: innerHeight / 2, vx: 0, vy: 0 };
    // the pots
    this.pots = [];
    if (lv < 2) {
      const all = [...new Set(this.rounds.flatMap((r) => r.pots))];
      for (const k of all) this.makePotFor(k);
      // pot order: shuffled per session within each round's list, except where the answer's side is fixed
      this.potOrder = this.rounds.map((r) => (r.fixed ? r.pots.slice() : shuffle(r.pots)));
    } else {
      L3_POTS.forEach((k, i) => { const p = this.makePotFor(k); p.home = V(L.potX[i], 0, L.potZ); p.obj.position.copy(p.home); });
      this.makeDishes();
    }
    // QA hook: window.__paintFrom = n starts at round n with blank toys already on the wall (tools/qa only)
    const from = Math.max(0, Math.min(7, window.__paintFrom | 0));
    for (let i = 0; i < from; i++) {
      const rd = this.rounds[i], key = rd.toy || rd.choose[0];
      const t = makeToy(key);
      setToyTexture(t, blankTexture(key, WOODS[i % 3], i + 1));
      t.group.position.copy(this.wallPose(i));
      t.off = true;
      this.root.add(t.group);
      this.hung.push(t);
    }
    this.round = from;
    // the first toy hangs on the easel already; the level opens straight in the paint view
    this.setupRound(from, true);
    this.views();
    const v = this.view.paint;
    this.glideCamera(v.pos, v.look, 0.01);
    // pointer handling for the tools (raw events: the brush comes to wherever she touches)
    const cv = document.getElementById('c');
    const down = (e) => this.onDown(e), move = (e) => this.onMove(e), up = (e) => this.onUp(e);
    cv.addEventListener('pointerdown', down);
    cv.addEventListener('pointermove', move);
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);
    this.offs.push(() => { cv.removeEventListener('pointerdown', down); cv.removeEventListener('pointermove', move); cv.removeEventListener('pointerup', up); cv.removeEventListener('pointercancel', up); });
    this.offs.push(() => this.surface.dispose());
    const onResize = () => { this.views(); };
    window.addEventListener('resize', onResize);
    this.offs.push(() => window.removeEventListener('resize', onResize));
  }

  makePotFor(k) {
    const obj = S.makePot(k);
    const lid = S.makeLid();
    obj.add(lid);
    const p = { key: k, obj, lid, open: true, home: null, bob: 0 };
    this.parkLid(p, true);
    obj.position.set(4.8, 0, this.L.potZ);
    obj.visible = false;
    this.root.add(obj);
    this.pots.push(p);
    return p;
  }
  // a lid parked flat on the table behind its pot (hidden by the pot from the camera)
  // (a parked lid waits out of sight behind its pot; it is carried in from there and goes back there)
  parkLid(p, now = false) {
    const to = V(0, 0.02, -0.58);
    p.open = true;
    if (now) { p.lid.position.copy(to); p.lid.rotation.set(0, 0, 0); p.lid.visible = false; return Promise.resolve(); }
    return this.arc(p.lid, to, 0.6, 0.35).then(() => this.s.anim(0.2, (e) => p.lid.scale.setScalar(Math.max(0.001, 1 - e)))).then(() => { p.lid.visible = false; p.lid.scale.setScalar(1); });
  }
  lidOn(p, now = false) {
    p.open = false;
    const to = V(0, S.RIM_Y, 0);
    p.lid.visible = true;
    if (now) { p.lid.position.copy(to); p.lid.scale.setScalar(1); return Promise.resolve(); }
    p.lid.position.set(0, 0.02, -0.58);
    p.lid.scale.setScalar(0.001);
    return this.s.anim(0.2, (e) => p.lid.scale.setScalar(Math.max(0.001, e))).then(() => this.arc(p.lid, to, 0.6, 0.35)).then(() => psfx.tok());
  }
  // move a thing to `to` (its parent's space) on a low arc
  arc(o, to, dur = 0.6, h = 0.3, ease = Ease.inOut) {
    const a = o.position.clone(), b = to.clone();
    return this.s.anim(dur, (e, p) => { o.position.lerpVectors(a, b, e); o.position.y += Math.sin(p * Math.PI) * h; }, ease);
  }

  // ---- Level 3: the dish, the stack of spare dishes and the saucer row ----
  makeDishes() {
    const L = this.L;
    this.stack = [];
    for (let i = 0; i < 10; i++) {
      const d = S.makeDish();
      d.position.copy(L.stack).add(V(0, i * 0.05 * SPARE, 0));
      d.scale.setScalar(SPARE);
      this.root.add(d);
      this.stack.push(d);
    }
    this.saucers = [];        // { obj, col, full, dots }
    this.dish = null;
    this.takeDish(true);
  }
  // the mixing spot: tipped 20 degrees toward the camera
  // (lifted so its near lip, r 0.5 tipped down 0.17, stays above the table top)
  dishPose() { return { pos: this.L.dish.clone().add(V(0, 0.2, 0)), rx: 0.35 }; }
  takeDish(now = false) {
    let d = this.stack.pop();
    if (!d) {
      // (more than ten mixes: a fresh dish rises out from under the stack spot)
      d = S.makeDish(); d.position.copy(this.L.stack).add(V(0, -0.12, 0)); d.scale.setScalar(SPARE); this.root.add(d);
    }
    const st = { obj: d, a: null, b: null, res: null, prog: 0, ready: false, made: false, full: false, last: null, ang: 0 };
    this.clearWell(st);
    this.dish = st;
    const P = this.dishPose();
    if (now) { d.position.copy(P.pos); d.rotation.x = P.rx; d.scale.setScalar(1); return Promise.resolve(); }
    const r0 = d.rotation.x, k0 = d.scale.x;
    const a = d.position.clone();
    return this.s.anim(0.8, (e, p) => { d.position.lerpVectors(a, P.pos, e); d.position.y += Math.sin(p * Math.PI) * 0.35; d.rotation.x = r0 + (P.rx - r0) * e; d.scale.setScalar(k0 + (1 - k0) * e); }, Ease.inOut);
  }
  clearWell(st) {
    const c = st.obj.userData.ctx;
    if (!c) return;
    c.globalAlpha = 1; c.fillStyle = '#ffffff'; c.fillRect(0, 0, 128, 128);
    st.obj.userData.tex.needsUpdate = true;
  }
  // a used dish leaves the mixing spot for the one tidy pile of used dishes behind the spare stack, shrinking to a saucer
  async dishToSaucer(st) {
    if (!st) return;
    const col = st.res || st.a || 'orange';
    const nest = this.saucers.filter((s) => !s.full).length;
    const d = st.obj, a = d.position.clone(), b = this.L.used.clone().add(V(0, nest * 0.05 * SPARE, 0));
    const r0 = d.rotation.x, k0 = d.scale.x;
    if (this.dish === st) this.dish = null;
    // what is left in it is a thin smear
    this.smear(st);
    const sc = { obj: d, col, full: false, st };
    this.saucers.push(sc);
    await this.s.anim(0.9, (e, p) => { d.position.lerpVectors(a, b, e); d.position.y += Math.sin(p * Math.PI) * 0.4; d.rotation.x = r0 * (1 - e); d.scale.setScalar(k0 + (SPARE - k0) * e); }, Ease.inOut);
  }
  smear(st) {
    const c = st.obj.userData.ctx;
    if (!c) return;
    const col = COLOURS[st.res || st.a || 'white'];
    c.globalAlpha = 1; c.fillStyle = '#ffffff'; c.fillRect(0, 0, 128, 128);
    c.globalAlpha = 0.7; c.fillStyle = col;
    c.beginPath(); c.arc(64, 64, 52, 0.3, 2.9); c.arc(64, 74, 40, 2.9, 0.3, true); c.closePath(); c.fill();
    c.globalAlpha = 1;
    st.obj.userData.tex.needsUpdate = true;
    st.full = false;
  }
  fillWell(st, col, streaks = true) {
    const c = st.obj.userData.ctx;
    if (!c) return;
    c.globalAlpha = 1; c.fillStyle = COLOURS[col]; c.fillRect(0, 0, 128, 128);
    if (streaks) {
      c.strokeStyle = 'rgba(255,255,255,0.22)'; c.lineWidth = 5;
      for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(64, 64, 18 + i * 14, i * 2, i * 2 + 2.2); c.stroke(); }
    }
    st.obj.userData.tex.needsUpdate = true;
  }
  // the recipe dots on the dish rim nearest the camera
  addDots(st) {
    const out = [];
    const pa = RECIPE[st.res];
    if (!pa) return out;
    [[-0.17, 0.095, 0.455], [0.17, 0.095, 0.455]].forEach((p, i) => {
      const dot = S.makeDot(pa[i]);
      dot.position.set(p[0], p[1], p[2]);
      dot.scale.setScalar(0.001);
      st.obj.add(dot);
      this.s.anim(0.3, (e) => dot.scale.setScalar(Math.max(0.001, e)), Ease.out);
      out.push(dot);
    });
    st.dots = out;
    return out;
  }

  // ================================================================ cameras
  views() {
    const lv = this.level, r = Math.min(this.round, 7), rd = this.rounds[r];
    const pts = [];
    const E = this.L.easel;
    const B = (sl, x) => S.boardPoint(sl, x, S.TOY_PROUD + FRONT).add(E);
    // the board window the toy lives in (x +-0.8, slant 0.2 .. 1.6: the board's top edge may go under the caption)
    for (const x of [-0.8, 0.8]) for (const sl of [0.2, 1.6]) pts.push(B(sl, x));
    // its hang ring (always clear of the caption), and the toy itself, wherever it sticks out
    pts.push(this.pegPose().add(V(0, 0.1, 0)));
    // (where it WILL hang on the easel peg: it may still be on its way there)
    if (this.toy) {
      const t = this.toy, d = (this._fitDummy = this._fitDummy || new T.Object3D()), k = t.k || 1;
      d.position.copy(this.pegPose()); d.rotation.set(-S.LEAN, 0, 0); d.scale.set(k, k, 1); d.updateMatrixWorld(true);
      for (const [u, v] of t.sh.outline) if (u < 0.08 || u > 0.92 || v > 0.92 || v < 0.08) pts.push(d.localToWorld(toyLocal(t, u, v)));
    }
    const potPts = (xs, z) => { for (const x of xs) for (const y of [0.05, S.RIM_Y]) for (const dz of [-S.POT_R, S.POT_R]) pts.push(V(x - S.POT_R, y, z + dz), V(x + S.POT_R, y, z + dz)); };
    if (lv < 2) {
      // framed for this round's pots (fewer pots: closer in)
      const n = rd.pots.length, half = ((n - 1) * this.L.gap) / 2;
      potPts([-half, half], this.L.potZ);
    } else {
      // the paint station: the mixing dish (her paint source) and the saucers; the pots only in the rainbow round
      const D = this.L.dish;
      pts.push(V(D.x - 0.5, 0, D.z), V(D.x + 0.5, 0.2, D.z), V(D.x, 0, D.z + 0.5));
      // every open pot whole (audit: nothing she may need is cut by the edge)
      this.L.potX.forEach((x, i) => { if ((rd.open || []).includes(L3_POTS[i])) potPts([x], this.L.potZ); });
      if (rd.rainbow) for (const k of ['orange', 'green', 'purple']) pts.push(V(SAUCER[k][0] - 0.28, 0.05, SAUCER[k][1] + 0.28), V(SAUCER[k][0] + 0.28, 0.05, SAUCER[k][1] + 0.28));
    }
    // Pip and the friend stay whole in the picture
    const pp = this.L.pip;
    pts.push(V(pp.x - 0.42, 1.1, pp.z), V(pp.x - 0.42, 0, pp.z + 0.35));
    if (rd.friend || rd.card) { const f = this.L.friend; pts.push(V(f.x + 0.5, 1.25, f.z), V(f.x + 0.5, 0, f.z + 0.3)); }
    this.view = this.view || {};
    // (Level 3 looks in a little lower: the pots are framed by the mix view, the tipped dish still shows its colour,
    // and the table's depth takes less of the screen, so the toy is bigger)
    this.view.paint = this.fit(lv === 2 ? V(0, 0.85, 5.0) : V(0, 1.25, 5.0), V(E.x, 0.95, -0.3), pts, 32, this.capTop(), 14);
    // the mix close-up (Level 3): the dish, the pots behind it, the stack of spare dishes, Pip
    if (lv === 2) {
      const mp = [];
      const D = this.L.dish;
      // the tipped dish (lifted 0.2: near lip at the table, far lip up at 0.45)
      mp.push(V(D.x - 0.55, 0.25, D.z), V(D.x + 0.55, 0.25, D.z), V(D.x, 0.02, D.z + 0.52), V(D.x, 0.45, D.z - 0.5));
      // Pip's head stays in the picture (never cut at the top edge); the spare stack and the used pile whole
      mp.push(V(this.L.pip.x, 1.2, this.L.pip.z));
      for (const c of [this.L.stack, this.L.used]) mp.push(V(c.x - 0.3, 0, c.z + 0.3), V(c.x - 0.3, 0.4, c.z - 0.3));
      for (const x of this.L.potX) for (const z of [-0.29, 0.29]) mp.push(V(x - 0.3, 0, this.L.potZ + z), V(x + 0.3, 0.65, this.L.potZ + z));
      mp.push(V(D.x, 0, D.z + 0.62), V(D.x - 0.6, 0.1, D.z + 0.3), V(D.x + 0.6, 0.1, D.z + 0.3));   // (the near rim and its recipe dots)
      this.view.mix = this.fit(V(0.15, 2.2, 3.6), V(D.x - 0.3, 0.25, D.z - 0.3), mp, 56, this.capTop());
    }
  }
  // the hang view: the camera stays close - the board, and the gallery hook just above it with her toy on it
  hangView() {
    const E = this.L.easel, pts = [];
    const B = (sl, x) => S.boardPoint(sl, x, S.TOY_PROUD + FRONT).add(E);
    for (const x of [-0.9, 0.9]) for (const sl of [0.25, 1.6]) pts.push(B(sl, x));
    const h = this.hookPeg();
    pts.push(h.clone().add(V(0, 0.55, 0)));   // (the cords' knot: the caption never sits on the hook)
    const t = this.toy;
    if (t) {
      const k = t.k || 1;
      t.group.updateMatrixWorld(true);
      for (const [u, v] of t.sh.outline) {
        const l = toyLocal(t, u, v);
        pts.push(this.hookToy().add(V(l.x * k, l.y * k, 0)));   // on the hook
        pts.push(toyWorld(t, u, v));                           // and still on the easel: its bottom never cut
      }
    }
    return this.fit(this.level === 2 ? V(0, 0.85, 5.0) : V(0, 1.25, 5.0), V(E.x, 1.4, -0.3), pts, 32, this.capTop());
  }
  creationView() {
    const pts = [];
    for (const y of S.WALL_PEGS_Y) for (const x of S.WALL_PEGS_X) pts.push(V(x - 0.7, WALL_Y + y + 0.25, WALL_Z), V(x + 0.7, WALL_Y + y - 1.4, WALL_Z));
    // every hung toy whole, whatever it sticks out
    for (const t of this.hung) { t.group.updateMatrixWorld(true); for (const [u, v] of t.sh.outline) pts.push(toyWorld(t, u, v)); }
    const side = Math.max(64, (innerWidth - innerHeight * 4 / 3) / 2 + 40);   // (the keepsake photo is a centred 4:3 crop)
    const v = this.fit(V(0, 0.15, 8.4), V(0, WALL_Y + 2.35, WALL_Z), pts, 64, this.capTop(), 64, side);
    return { pos: v.pos, look: v.look, dur: 1.2 };
  }
  // the caption bubble's height (style.css #caption: top 2.4vmin + about 10.5vmin): nothing she needs goes under it
  capTop() { return Math.round(this.minSide() * 0.135); }
  // the camera distance (along dir from look, look re-centred on the points) that fits every point with a margin
  // (top: a bigger top margin, so the caption bubble never covers the subject)
  fit(dir, look, pts, margin = 40, top = margin, bottom = margin, side = margin) {
    const cam = (this.fitCam = this.fitCam || camera.clone());
    cam.fov = camera.fov; cam.aspect = camera.aspect; cam.updateProjectionMatrix();
    const D = dir.clone().normalize();
    const L = look.clone();
    const W = innerWidth, H = innerHeight;
    const proj = (p) => { const v = p.clone().project(cam); if (v.z > 1 || v.z < -1) return [-1e9, -1e9]; return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H]; };   // (behind the camera: never 'inside')
    const place = (d) => { cam.position.copy(L).addScaledVector(D, d); cam.lookAt(L); cam.updateMatrixWorld(); };
    let best = 30;
    for (let it = 0; it < 3; it++) {
      let lo = 1.5, hi = 40;
      for (let i = 0; i < 28; i++) {
        const d = (lo + hi) / 2;
        place(d);
        const ok = pts.every((p) => { const [x, y] = proj(p); return x >= side && x <= W - side && y >= top && y <= H - bottom; });
        if (ok) hi = d; else lo = d;
      }
      best = hi;
      place(best);
      // re-centre the look point on the points' screen bbox
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      for (const p of pts) { const [x, y] = proj(p); x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      const dx = ((x0 + x1) / 2 - W / 2) / W, dy = ((y0 + y1) / 2 - (H + top - bottom) / 2) / H;
      const right = V(1, 0, 0).applyQuaternion(cam.quaternion), up = V(0, 1, 0).applyQuaternion(cam.quaternion);
      const vh = 2 * best * Math.tan((cam.fov * Math.PI) / 360);
      if (it < 2) L.addScaledVector(right, dx * vh * cam.aspect).addScaledVector(up, -dy * vh);
    }
    return { pos: L.clone().addScaledVector(D, best), look: L };
  }

  // ================================================================ rounds
  get rd() { return this.rounds[this.round] || this.rounds[this.rounds.length - 1]; }
  stepNow() { const st = this.rd.steps; return st ? st[Math.min(this.stepI || 0, st.length - 1)] : null; }

  // put round r's toy on the easel, its pots in the row, its friend or card in place (now = no animation)
  setupRound(r, now = false) {
    const rd = this.rounds[r];
    const jobs = [];
    // the toy (or the three to choose from)
    if (rd.choose) jobs.push(this.bringChoices(rd, now));
    else jobs.push(this.bringToy(rd.toy, r, now));
    this.toyP = jobs[0];
    // the pots
    jobs.push(this.setPots(r, now));
    // the friend or the card
    jobs.push(this.setFriend(r, now));
    if ((rd.stamp || rd.teach === 'stamp' || (this.level === 0 && r > 5)) && !this.stamp.obj.visible) {
      // the stamp arrives in its hole in the tool block (it rises into it)
      const st = this.stamp.obj, to = this.blockPose(this.stamp).pos;
      st.visible = true;
      if (this.cup) this.cup.visible = true;
      this.bobThing(st, 3);
      if (now) st.position.copy(to);
      else { st.position.copy(to).add(V(0, -0.3, 0)); jobs.push(this.s.anim(0.5, (e) => st.position.copy(to).add(V(0, -0.3 * (1 - e), 0)), Ease.out)); }
    }
    return Promise.all(jobs);
  }
  woodFor(r) { return { tone: WOODS[(r * 7 + this.level) % 3], seed: r * 13 + this.level * 101 + 1 }; }
  pegPose(local = false) {
    const p = S.boardPoint(S.PEG_S, 0, S.TOY_PROUD);
    // the ring's top inner edge rests on the peg: its centre is 0.008 below the peg's centre (along the board)
    p.add(V(0, -0.008 * Math.cos(S.LEAN), 0.008 * Math.sin(S.LEAN)));
    if (!local) p.add(this.L.easel);
    return p;
  }
  bringToy(key, r, now) {
    const toy = makeToy(key);
    if (!toy) { console.error('paint: no toy', key); return Promise.resolve(); }
    const w = this.woodFor(r);
    toy.wood = w;
    setToyTexture(toy, blankTexture(key, w.tone, w.seed));
    this.root.add(toy.group);
    toy.group.rotation.x = -S.LEAN;
    toy.k = this.toyScale(toy);
    toy.group.scale.set(toy.k, toy.k, 1);
    this.toy = toy;
    const to = this.pegPose();
    if (now) { toy.group.position.copy(to); return Promise.resolve(); }
    // it rises from behind the easel board, over its top edge and settles onto the peg
    const E = this.L.easel;
    const top = E.y + 1.95 + 0.15 + toy.sh.size[1] * toy.k;   // its bottom clears the board's top edge
    const a = V(E.x, E.y + 1.55, E.z - 0.95), b = V(E.x, top, E.z - 0.8), c = V(to.x, top - 0.15, to.z + 0.12);
    toy.group.position.copy(a);
    return this.s.anim(0.9, (e) => {
      // a smooth path: a -> b (up behind the board) -> c (forward over the top) -> peg
      const q = e;
      if (q < 0.5) { const k = Ease.inOut(q / 0.5); toy.group.position.lerpVectors(a, b, k); }
      else if (q < 0.85) { const k = Ease.inOut((q - 0.5) / 0.35); toy.group.position.lerpVectors(b, c, k); }
      else { const k = Ease.out((q - 0.85) / 0.15); toy.group.position.lerpVectors(c, to, k); }
    }, (x) => x).then(() => toy.group.position.copy(to));
  }
  // on the easel a toy is shown bigger, a wide one up to nearly the board's width (1.9 of 2.0) so it is as big as it can be
  // (its thickness stays, so the paint plane does not move)
  toyScale(toy) { const [w, h] = toy.sh.size; return Math.min(1.9 / w, 1.3 / h); }
  toyBottom(toy) { const vmin = Math.min(...toy.sh.outline.map((p) => p[1])); return (vmin - 0.5) * toy.S - toy.hy; }
  // Level 1 round 8: three blank toys stand small on the easel ledge
  bringChoices(rd, now) {
    // the brush stands itself in the block so the ledge is free for the three toys
    if (this.brush.mode !== 'block') { this.brush.mode = 'block'; this.toolGlide(this.brush, this.blockPose(this.brush), now ? 0.01 : 0.6, Ease.inOut, 0.2); }
    this.choices = rd.choose.map((k, i) => {
      const toy = makeToy(k);
      const w = this.woodFor(7 + i);
      toy.wood = w;
      setToyTexture(toy, blankTexture(k, w.tone, w.seed));
      toy.group.rotation.x = -S.LEAN;
      toy.group.scale.set(0.5, 0.5, 1);
      // pinned on the board face, side by side, their rings at slant 1.25 (the ledge stays free for the tools)
      const at = S.boardPoint(1.25, (i - 1) * 0.64, S.TOY_PROUD).add(this.L.easel);
      toy.stand = at.clone();
      this.root.add(toy.group);
      toy.group.position.copy(at);
      if (!now) {
        // each one rises from behind the board's top edge and drops onto its spot (she can tap them as they land)
        const a = at.clone().add(V(0, 0.2, -0.9));
        toy.group.position.copy(a);
        this.s.wait(i * 0.12).then(() => this.arc(toy.group, at, 0.6, 1.1));   // (high enough to clear the board top)
      }
      return toy;
    });
    this.toy = null;
    return this.wait(now ? 0 : 0.5);
  }

  async setPots(r, now) {
    const rd = this.rounds[r];
    const jobs = [];
    if (this.level < 2) {
      const order = this.potOrder[r];
      const n = order.length, gap = this.L.gap;
      for (const p of this.pots) {
        const i = order.indexOf(p.key);
        if (i >= 0) {
          const to = V((i - (n - 1) / 2) * gap, 0, this.L.potZ);
          p.home = to;
          if (!p.open) jobs.push(this.parkLid(p, now));
          if (now || !p.obj.visible) {
            if (now) { p.obj.position.copy(to); p.obj.visible = true; continue; }
            // a new pot slides in along the front of the table from its left end
            p.obj.position.set(-3.0, 0, this.L.potZ); p.obj.visible = true;
            p.obj.scale.setScalar(0.001);
            jobs.push(this.s.anim(0.25, (e) => p.obj.scale.setScalar(Math.max(0.001, e)), Ease.out).then(() => this.arc(p.obj, to, 0.8, 0.12)));
          } else if (p.obj.position.distanceTo(to) > 0.01) jobs.push(this.arc(p.obj, to, 0.7, 0.12));
        } else if (p.obj.visible) {
          // a pot that is not needed slides away to the left end and is put away
          jobs.push(this.arc(p.obj, V(-3.0, 0, this.L.potZ), 0.8, 0.12).then(() => this.s.anim(0.25, (e) => p.obj.scale.setScalar(Math.max(0.001, 1 - e)))).then(() => { p.obj.visible = false; p.obj.scale.setScalar(1); }));
        }
      }
    } else {
      for (const p of this.pots) {
        const open = (rd.open || []).includes(p.key);
        p.obj.visible = true;
        if (open && !p.open) jobs.push(this.parkLid(p, now));
        else if (!open && p.open) jobs.push(this.lidOn(p, now));
      }
    }
    await Promise.all(jobs);
  }

  // friends walk in and out along the back edge of the table (they hop up from the meadow at its right end)
  async setFriend(r, now) {
    const rd = this.rounds[r];
    const want = rd.friend || (rd.card ? 'card' : null);
    const cur = this.friend;
    const jobs = [];
    if (cur && cur.userData.who !== want) {
      this.friend = null;
      jobs.push(Promise.resolve(this.reactP).then(() => this.friendLeave(cur)));
      this.leaveP = Promise.resolve(this.reactP).then(() => this.wait(0.3));
    } else if (cur && cur.userData.who === 'card' && want === 'card') {
      // the same stand gets the new picture
      cur.userData.setPicture(drawPicture(rd.toy, rd.card, { spots: rd.cardSpots }));
      return;
    } else if (cur) return;
    if (!want) { await Promise.all(jobs); return; }
    let f;
    if (want === 'card') {
      f = S.makeCardStand();
      f.userData.setPicture(drawPicture(rd.toy, rd.card, { spots: rd.cardSpots }));
      f.userData.who = 'card';
      this.cardTap = input.addTap(f, { radius: 0.5, offset: V(0, 0.6, 0), onTap: () => {} });
    } else if (want === 'pip') {
      // Pip himself sits for his portrait on a little stool right of the easel
      this.friend = this.pip;
      jobs.push(this.pipToStool(now));
      await Promise.all(jobs);
      return;
    } else {
      f = want === 'duck' ? makeDuck(FRIEND_SCALE.duck) : want === 'crab' ? makeCrab() : makeAnimal(want);
      if (want === 'crab' || want === 'frog' || want === 'pig') { f.scale.setScalar(FRIEND_SCALE[want]); f.userData.baseScale = FRIEND_SCALE[want]; }
      f.userData.who = want;
      this.sat.push(f);
    }
    this.friend = f;
    this.root.add(f);
    const spot = want === 'crab' ? this.L.friend.clone().add(V(0.25, 0, 0)) : this.L.friend;   // (the crab is wide)
    if (now) { f.position.copy(spot); f.rotation.y = -0.35; return; }
    if (want === 'card') {
      // the card stand slides in along the back of the table
      f.position.set(3.05, 0, spot.z);
      f.scale.setScalar(0.001);
      jobs.push(this.s.anim(0.3, (e) => f.scale.setScalar(Math.max(0.001, e)), Ease.out).then(() => this.arc(f, spot, 0.9, 0.1)));
    } else jobs.push(this.friendArrive(f, spot));
    await Promise.all(jobs);
  }
  async walk(f, to, speed = 1.5) {
    const a = f.position.clone(), d = Math.hypot(to.x - a.x, to.z - a.z);
    if (d < 0.01) return;
    const yaw = Math.atan2(to.x - a.x, to.z - a.z), r0 = f.rotation.y;
    let dy = yaw - r0; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2;
    if (f.userData.who === 'crab') dy = 0;   // the crab scuttles sideways
    await this.s.anim(d / speed, (e, p) => { f.position.lerpVectors(a, to, e); f.rotation.y = r0 + dy * Math.min(1, p * 5); }, Ease.inOut);
  }
  turnTo(f, yaw, dur = 0.4) {
    const r0 = f.rotation.y;
    let dy = yaw - r0; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2;
    return this.s.anim(dur, (e) => { f.rotation.y = r0 + dy * e; }, Ease.inOut);
  }
  // (audit P15) a friend arrives on its own lane (z -0.45) while the one leaving uses the back edge (z -1.05):
  // they never pass through each other
  async friendArrive(f, spot) {
    if (!f.userData.wasHere) { f.position.set(4.6, MEADOW_Y, -0.45); f.userData.wasHere = true; }
    f.visible = true;
    f.rotation.y = -Math.PI / 2;
    if (this.leaveP) await this.leaveP;   // (just its first steps: it starts 0.3 s after the leaver)
    await this.walk(f, V(4.3, MEADOW_Y, -0.45), 2);
    await this.arc(f, V(3.0, 0, -0.45), 1.0, 0.6);   // (a slow hop: never a jump, even on a slow frame)
    await this.walk(f, V(spot.x, 0, -0.45), 1.8);
    await this.walk(f, spot, 1.5);
    await this.turnTo(f, -0.35);
  }
  async friendLeave(f) {
    if (f.userData.who === 'card') {
      await this.arc(f, V(3.05, 0, f.position.z), 0.8, 0.1);
      await this.s.anim(0.3, (e) => f.scale.setScalar(Math.max(0.001, 1 - e)));
      f.visible = false;
      if (this.cardTap) { input.remove(this.cardTap); this.cardTap = null; }
      return;
    }
    await this.walk(f, V(f.position.x, 0, -1.05));
    await this.walk(f, V(3.0, 0, -1.05));
    await this.arc(f, V(4.3, MEADOW_Y, -1.05), 1.0, 0.5);
    await this.walk(f, V(6.0, MEADOW_Y, -1.05), 2);
    f.visible = false;
    f.userData.wasHere = true;   // (it comes back for the finale from here, never from a fresh start spot)
  }
  async pipToStool(now) {
    const pip = this.pip;
    if (!now && this.pipBusyP) await this.pipBusyP;
    if (!this.stool) { this.stool = S.makeStool(); if (this.stool) { this.root.add(this.stool); this.stool.position.set(3.05, 0, this.L.friend.z); } }
    const top = V(this.L.friend.x + 0.05, 0.35, this.L.friend.z);
    pip.userData.who = 'pip';
    if (now) { if (this.stool) this.stool.position.copy(this.L.friend).add(V(0.05, 0, 0)); pip.position.copy(top); pip.rotation.y = -0.35; return; }
    // the stool slides in along the back of the table; Pip walks along the back edge behind the easel and hops up
    if (this.stool) {
      const st = this.stool, to = this.L.friend.clone().add(V(0.05, 0, 0));
      st.position.set(3.05, 0, to.z);
      this.s.anim(0.9, (e) => st.position.lerpVectors(V(3.05, 0, to.z), to, e), Ease.inOut);
    }
    await this.walk(pip, V(pip.position.x, 0, -1.35), 1.8);
    await this.walk(pip, V(top.x, 0, -1.35), 1.8);
    await this.turnTo(pip, 0, 0.3);
    await this.arc(pip, top, 0.7, 0.45);
    await this.turnTo(pip, -0.35, 0.35);
  }

  async startRound(r) {
    this.busy = true;
    const rd = this.rd;
    this.stepI = 0;
    this.redirected = false;
    this.wrongMixes = 0;
    this.roundT = 0;
    this.doneT = 0;
    this.lastTouch = performance.now();
    this.countedRings = [];
    this.bobPot = null;
    this.doneReady = false;
    this.saidAll = false;
    this.roundStartT = performance.now();
    this.readyLogged = false;
    if (r > 0) {
      this.views();
      const v = this.view.paint;
      this.glideCamera(v.pos, v.look, 0.7);
      if (this.toyP) await this.alive(Promise.race([this.toyP, this.wait(1.2)]));
      if (this.dead) return;
    }
    if (rd.choose) return this.startChoose();
    if (this.toy) this.surface.attach(this.toy, { tone: this.toy.wood.tone, seed: this.toy.wood.seed });
    if (this.level === 2 && rd.rainbow) this.saucerCue();
    await this.beginStep(true);
  }
  async beginStep(first = false) {
    const rd = this.rd, st = this.stepNow();
    this.busy = true;
    this.wrongLifts = 0;
    this.errorlessOn = false;
    this.phaseNote = null;
    // Level 3: is the colour asked for still to be made?
    if (this.level === 2 && st && st.col && !this.hasColour(st.col)) {
      const lines = st.intro || (first ? rd.intro : null) || [];
      if (rd.look && first) this.pipLookAlongPots();
      (async () => { for (const l of lines) { if (this.dead) return; await this.say(l, { max: 2.6 }); } })();
      this.ask = { part: st.part, col: st.col };
      this.instr = lines[lines.length - 1] || 'Stir!';
      await this.mixTurn();
      return;
    }
    this.ask = st && st.part ? { part: st.part, col: st.col } : null;
    let line = st ? st.say : rd.say;
    if (rd.rainbow) line = rd.say;
    this.instr = line;
    // the asked part's outline pulses once when asked (two-part toys)
    if (this.ask && Object.keys(this.toy.sh.parts).length > 1) this.pulseOutline(this.ask.part);
    if (st && st.spots) this.bobThing(this.stamp.obj, 3);
    await this.liveRound(line, st && st.tail ? false : true);
  }
  // her turn: say the instruction, show any new action, then Go!
  async liveRound(line, voice = true) {
    this.roundLive = true;
    this.busy = false;
    this.idle = 0;
    this.stuck = 0;
    if (line) this.say(line, { voice });
    await this.teachFor();
  }
  // the first time an action is needed in this play of the level, the hand shows it on the real things
  async teachFor() {
    const rd = this.rd;
    this.refreshPhase();
    const sp = this.stepNow();
    if (sp && sp.spots && !this.shown.has('stamp')) return this.teach('stamp');
    if (this.round === 0 && this.level === 0 && !this.shown.has('dip')) return this.teach('dip');
    if (this.level > 0 && this.phase === 'dip' && !this.shown.has('dip')) return this.teach('dip');
    if (rd.teach === 'splat' && !this.shown.has('splat')) return this.teach('splat');
    if (rd.teach === 'stamp' && !this.shown.has('stamp')) return this.teach('stamp');
    if (this.phase === 'dip' && !this.shown.has('dip')) return this.teach('dip');
    if (this.phase === 'paint' && !this.shown.has('rub')) return this.teach('rub');
  }

  // ================================================================ the hit tests
  minSide() { return Math.min(innerWidth, innerHeight); }
  potAt(x, y, list = this.pots) {
    let best = null, bd = 1;
    for (const p of list) {
      if (!p.obj.visible) continue;
      const c = p.obj.getWorldPosition(V()).add(V(0, 0.3, 0));
      const s = project(c), r = Math.max(screenRadius(c, 0.45), this.minSide() * 0.05);
      const d = Math.hypot(s.x - x, s.y - y) / r;
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  }
  dishAt(x, y) {
    if (!this.dish) return false;
    const c = this.dish.obj.getWorldPosition(V()).add(V(0, 0.05, 0));
    const s = project(c);
    return Math.hypot(s.x - x, s.y - y) < screenRadius(c, 0.6);
  }
  saucerAt(x, y) {
    for (const sc of (this.saucers || []).slice().reverse()) {
      const c = sc.obj.getWorldPosition(V());
      const s = project(c);
      if (Math.hypot(s.x - x, s.y - y) < screenRadius(c, 0.32)) return sc;
    }
    return null;
  }
  // a tool waiting in its place: the stamp in its cup, or the brush on the ledge while the stamp is in use
  blockAt(x, y) {
    const near = (o, dy, r) => { const c = o.getWorldPosition(V()).add(V(0, dy, 0)); const p = project(c); return Math.hypot(p.x - x, p.y - y) < Math.max(screenRadius(c, r), this.minSide() * 0.06); };
    if (this.stamp.obj.visible && (this.stamp.mode === 'block' || this.stamp.mode === 'rest') && !this.stamp.glide && near(this.stamp.obj, 0.15, 0.2)) return 'stamp';
    if (this.tool === this.stamp && this.brush.mode === 'block' && !this.brush.glide && near(this.brush.obj, 0.0, 0.3)) {
      const c = this.brush.obj.localToWorld(V(0, 0.45, 0)), p = project(c);
      if (Math.hypot(p.x - x, p.y - y) < Math.max(screenRadius(c, 0.5), this.minSide() * 0.06)) return 'brush';
    }
    return null;
  }
  // the board (with the toy on it) under a screen point
  onBoard(x, y) {
    const E = this.L.easel;
    const n = V(0, Math.sin(S.LEAN), Math.cos(S.LEAN));
    const o = S.boardPoint(0, 0, 0.17).add(E);
    const hit = rayPlane(x, y, n, o);
    if (!hit) return false;
    const l = hit.sub(E);
    const s = (l.y - S.BOARD_Y0) * Math.cos(S.LEAN) - l.z * Math.sin(S.LEAN);
    return Math.abs(l.x) < S.BOARD_W / 2 + 0.1 && s > -0.25 && s < S.BOARD_H + 0.1;
  }
  // pokes on the play things are play, not pokes
  pokeAt(x, y) {
    if (this.phase !== 'busy' && this.phase !== 'hang' && (this.onBoard(x, y) || this.potAt(x, y) || this.dishAt(x, y) || this.blockAt(x, y) || this.saucerAt(x, y))) return true;
    return super.pokeAt(x, y);
  }
  mash() {}     // tapping a lot is how splats are made: Pip is not startled by it

  // ================================================================ pointer
  ready() { return !this.dead && this.roundLive && !this.demoing && !this.toolBusy; }
  // can she act now? (a demo can be interrupted 1.3 s in; the hang drag counts too)
  canAct() {
    if (this.dead) return false;
    if (this.hangLive) return !this.demoing || performance.now() > (this.demoLock || 0);
    return this.roundLive && !this.toolBusy && (!this.demoing || performance.now() > (this.demoLock || 0));
  }
  onDown(e) {
    // her touch takes over from a demo's scripted brush
    if (this.g && this.g.fake && this.g.down && this.demoing && !this.auto && performance.now() > (this.demoLock || 0)) this.cancelFake();
    if (this.g && this.g.down) return;   // one finger
    if (this.demoing && performance.now() > (this.demoLock || 0)) { this.demoing = false; fx.clearHands(); }
    if (!this.ready() || (this.auto && !this.demoKey)) return;
    const x = e.clientX, y = e.clientY;
    let target = null, pot = null, which = null, saucer = null;
    if (this.phase === 'pickToy') { const t = this.choiceAt(x, y); if (t) this.choose(t); return; }
    if (this.doneReady && this.signAt(x, y)) { this.lastTouch = performance.now(); this.doneTap(); return; }
    if ((which = this.blockAt(x, y))) target = 'block';
    else if ((pot = this.potAt(x, y))) target = 'pot';
    else if (this.dishAt(x, y)) target = 'dish';
    else if ((saucer = this.saucerAt(x, y))) target = 'saucer';
    else if (this.onBoard(x, y)) target = 'toy';
    if (!target) return;
    this.lastTouch = performance.now();
    this.doneT = 0;
    this.stuck = 0;
    fx.clearHands();
    this.g = { id: e.pointerId, x, y, x0: x, y0: y, t0: performance.now(), tStill: performance.now(), down: true, travel: 0, target, pot, which, saucer, overPot: pot, wrong: false };
    if (target === 'block') { this.g.down = false; this.swapTo(which); return; }
    if (target === 'pot' && !pot.open) { this.g.down = false; this.wobbleLid(pot); return; }
    if (target === 'saucer') { this.g.down = false; this.touchSaucer(saucer); return; }
    this.pickUp();
    if (target === 'pot') this.dip(pot);
    else if (target === 'dish') this.touchDish(true);
    else if (target === 'toy') this.paintTo(x, y);
  }
  onMove(e) {
    const g = this.g;
    if (!g || !g.down || e.pointerId !== g.id || g.fake) return;
    // every pointer sample (coalesced events too), so a fast stroke is continuous
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : null;
    for (const ev of evs && evs.length ? evs : [e]) { this.fingerTo(ev.clientX, ev.clientY); this.paintTo(ev.clientX, ev.clientY); }
  }
  fingerTo(x, y) {
    const g = this.g;
    const d = Math.hypot(x - g.x, y - g.y);
    if (d > 1.5) g.tStill = performance.now();
    // the brush's tip is glued to the pointer (no lag: the paint is under her finger, and so is the brush)
    this.tipS.vx = this.tipS.vx * 0.7 + (x - this.tipS.x) * 60 * 0.3;
    this.tipS.x = x; this.tipS.y = y;
    g.travel += d / this.pxPerUnit();
    g.x = x; g.y = y;
    this.lastTouch = performance.now();
    this.idle = 0;
    // drag through a pot: it dips (once per entry)
    const pot = this.potAt(x, y);
    if (pot !== g.overPot) {
      g.overPot = pot;
      if (pot && pot.open && !this.dipping && !this.stroking) this.dip(pot);
      else if (pot && !pot.open && !this.stroking) this.wobbleLid(pot);
    }
    if (!g.overDish && this.dishAt(x, y)) { g.overDish = true; this.touchDish(false); }
    else if (g.overDish && !this.dishAt(x, y)) g.overDish = false;
  }
  onUp(e) {
    const g = this.g;
    if (!g || !g.down || (e && e.pointerId !== g.id) || (g.fake && e)) return;
    g.down = false;
    this.lastTouch = performance.now();
    const tap = performance.now() - g.t0 < TAP_T * 1000 && g.travel < TAP_D;
    const still = g.travel < TAP_D;
    this.endStroke();
    if (this.stirring) { this.stirRelease(tap); }
    else if (g.target === 'toy' && (tap || (this.tool === this.stamp && still))) this.tapToy(g);
    else if (g.target === 'dish' && tap && this.dish && this.dish.b && !this.dish.made) this.stirTap();
    this.afterGesture(g);
    if (!this.toolBusy) this.setDown();
  }
  pxPerUnit() {
    const c = this.toy ? toyCentreWorld(this.toy) : this.L.easel.clone().add(V(0, 1, 0));
    return Math.max(1, screenRadius(c, 1));
  }

  // ================================================================ the tools
  // a pose { pos, quat } for the tool's origin (its tip / sponge face)
  quatUp(up) { return new T.Quaternion().setFromUnitVectors(W_UP, up.clone().normalize()); }
  restPose(tool) {
    if (tool === this.stamp || !tool.obj.visible) return this.blockPose(tool);
    // the brush lies on the easel ledge, tip to the left, below where it was
    const E = this.L.easel;
    const tx = this.sign && this.sign.visible ? BRUSH_TIP[0] : clamp(tool.obj.position.x - E.x, BRUSH_TIP[0], BRUSH_TIP[1]);
    const q = this.quatUp(V(1, 0.02, 0));
    return { pos: V(E.x + tx, E.y + S.LEDGE_TOP + 0.087, E.z + 0.11), quat: q };
  }
  // where a tool waits when it is not the one in use: the stamp in its cup, the brush lying on the ledge's left part
  blockPose(tool) {
    const E = this.L.easel;
    if (tool === this.stamp) return { pos: V(E.x + CUP_X, E.y + S.LEDGE_TOP + 0.05, E.z + 0.11), quat: new T.Quaternion() };
    return { pos: V(E.x + BRUSH_TIP[0], E.y + S.LEDGE_TOP + 0.087, E.z + 0.11), quat: this.quatUp(V(1, 0.02, 0)) };
  }
  placeTool(tool, pose) { tool.obj.position.copy(pose.pos); tool.obj.quaternion.copy(pose.quat); }
  // glide a tool to a pose (or a pose function, re-evaluated every frame). Resolves true at the end.
  toolGlide(tool, target, dur, ease = Ease.inOut, arcH = 0) {
    if (tool.glide) tool.glide.res(false);
    return new Promise((res) => { tool.glide = { p0: tool.obj.position.clone(), q0: tool.obj.quaternion.clone(), target, dur, t: 0, ease, arcH, res }; });
  }
  // the finger came down: the active tool glides to it (0.3 s)
  pickUp() {
    const tool = this.tool, g = this.g;
    this.tipS.x = g.x; this.tipS.y = g.y - this.minSide() * TIP_PX; this.tipS.vx = 0; this.tipS.vy = 0;
    const p = this.surfacePoint(this.tipS.x, this.tipS.y);
    tool.depth = p ? p.depth : camera.position.distanceTo(this.L.easel);
    tool.onToy = p && p.onToy ? 1 : 0;
    tool.mode = 'held';
    tool.arrived = false;
    this.toolGlide(tool, () => this.heldPose(tool), 0.12, Ease.out).then((ok) => { if (ok) tool.arrived = true; });
  }
  setDown() {
    const tool = this.tool;
    if (tool.mode !== 'held') return;
    tool.mode = 'rest';
    tool.arrived = false;
    const pose = this.restPose(tool);
    this.toolGlide(tool, pose, 0.45, Ease.inOut, 0.12);
  }
  async swapTo(which) {
    const want = which === 'stamp' ? this.stamp : this.brush;
    if (this.tool === want) {
      // a touch on the active tool standing in the block: it bobs
      this.bobThing(want.obj, 1);
      return;
    }
    this.toolBusy = true;
    const old = this.tool;
    this.tool = want;
    this.bobThing(want.obj, 1);
    want.mode = 'rest';
    old.mode = 'block';
    await this.toolGlide(old, this.blockPose(old), 0.5, Ease.inOut, 0.2);
    // the brush now stands in the block; the stamp waits in its hole, ready
    this.toolBusy = false;
    if (want === this.stamp) { this.usedStamp = true; }
  }
  wobbleLid(p) {
    psfx.tok();
    const l = p.lid, z0 = l.rotation.z;
    this.s.anim(0.45, (_, q) => { l.rotation.z = z0 + Math.sin(q * Math.PI * 3) * 0.08 * (1 - q); }).then(() => { l.rotation.z = z0; });
  }
  bobThing(o, times = 1, h = 0.06) {
    if (!o || o.userData._bob) return;
    o.userData._bob = true;
    const y0 = o.position.y;
    this.s.anim(0.8 * times, (_, p) => { o.position.y = y0 + Math.abs(Math.sin(p * Math.PI * times)) * h; }).then(() => { o.position.y = y0; o.userData._bob = false; });
  }

  // where the tip ray meets a surface: the toy's plane over the board, the dish, or the hover height over the table
  surfacePoint(sx, sy) {
    const ray = screenRay(sx, sy);
    if (this.toy && this.toyOnEasel()) {
      const n = V(0, Math.sin(S.LEAN), Math.cos(S.LEAN));
      const o = S.boardPoint(0, 0, S.TOY_PROUD + FRONT).add(this.L.easel);
      const hit = ray.intersectPlane(new T.Plane().setFromNormalAndCoplanarPoint(n, o), V());
      if (hit) {
        const l = hit.clone().sub(this.L.easel);
        const s = (l.y - S.BOARD_Y0) * Math.cos(S.LEAN) - l.z * Math.sin(S.LEAN);
        if (Math.abs(l.x) < S.BOARD_W / 2 + 0.05 && s > 0.05 && s < S.BOARD_H + 0.05) return { p: hit, depth: hit.distanceTo(ray.origin), onToy: true, n };
      }
    }
    if (this.dish) {
      const d = this.dish.obj;
      d.updateMatrixWorld(true);
      const n = V(0, 1, 0).applyQuaternion(d.quaternion);
      const o = d.localToWorld(V(0, S.WELL_Y + 0.004, 0));
      const hit = ray.intersectPlane(new T.Plane().setFromNormalAndCoplanarPoint(n, o), V());
      if (hit && hit.distanceTo(o) < 0.5) return { p: hit, depth: hit.distanceTo(ray.origin), onDish: true, n, local: d.worldToLocal(hit.clone()) };
    }
    const hit = ray.intersectPlane(new T.Plane(V(0, 1, 0), -HOVER_Y), V());
    if (hit) return { p: hit, depth: hit.distanceTo(ray.origin) };
    return null;
  }
  toyOnEasel() { return this.toy && !this.toy.off; }
  // the tool held at the finger: tip on the surface under it, leaning away from the direction of travel
  heldPose(tool) {
    const ray = screenRay(this.tipS.x, this.tipS.y);
    const pos = ray.origin.clone().addScaledVector(ray.direction, tool.depth);
    const bu = V(0, Math.cos(S.LEAN), -Math.sin(S.LEAN)), bn = V(0, Math.sin(S.LEAN), Math.cos(S.LEAN));
    let up;
    if (tool === this.brush) {
      const onT = bu.clone().multiplyScalar(Math.cos(0.95)).addScaledVector(bn, Math.sin(0.95));
      const off = V(0, Math.cos(0.42), Math.sin(0.42));
      up = off.lerp(onT, tool.onToy).normalize();
      if (tool.onDish) up = V(0, 1, 0).lerp(V(0, 0.82, 0.57), 1).normalize();
      // painting near the top of the screen: the handle tips down to the right, so it never leaves the picture
      const hi = clamp((innerHeight * 0.42 - this.tipS.y) / (innerHeight * 0.22), 0, 1);
      if (hi > 0) up.lerp(V(0.5, -0.2, 0.84).normalize(), hi * 0.75).normalize();
    } else {
      const onT = bn.clone().multiplyScalar(Math.cos(0.35)).addScaledVector(bu, Math.sin(0.35));
      up = V(0, 1, 0).lerp(onT, tool.onToy).normalize();
    }
    // lean: rotate about the view axis
    const fwd = V(0, 0, -1).applyQuaternion(camera.quaternion);
    up.applyAxisAngle(fwd, tool.lean - (tool === this.brush ? 0.22 : 0));
    const q = this.quatUp(up);
    // the bristles touch the surface at the tip point: lift the origin off it so the head sits on it
    if (tool === this.brush) pos.addScaledVector(tool.onToy > 0.5 ? bn : V(0, 1, 0), 0.07 * Math.max(tool.onToy, tool.onDish ? 1 : 0));
    else pos.addScaledVector(bn, 0.03 * tool.onToy);
    return { pos, quat: q };
  }
  updateTools(dt) {
    const g = this.g;
    // the tip's screen point follows the finger on a critically damped ~12 Hz spring
    if (g && g.down) {
      this.tipS.x = g.x; this.tipS.y = g.y;
      this.tipS.vx *= Math.max(0, 1 - dt * 8);
      const tool = this.tool;
      const p = this.surfacePoint(this.tipS.x, this.tipS.y);
      if (p) {
        const k = Math.min(1, dt * 14);
        tool.depth += (p.depth - tool.depth) * k;
        tool.onToy += ((p.onToy ? 1 : 0) - tool.onToy) * Math.min(1, dt * 10);
        tool.onDish = !!p.onDish;
        tool.surf = p;
      }
      tool.lean += (clamp(this.tipS.vx * 0.0005, -0.26, 0.26) - tool.lean) * Math.min(1, dt * 8);
    } else for (const tool of [this.brush, this.stamp]) tool.lean *= Math.max(0, 1 - dt * 6);
    for (const tool of [this.brush, this.stamp]) {
      const G = tool.glide;
      if (G) {
        G.t += dt;
        const e = G.ease(Math.min(1, G.t / G.dur));
        const tg = typeof G.target === 'function' ? G.target() : G.target;
        tool.obj.position.lerpVectors(G.p0, tg.pos, e);
        if (G.arcH) tool.obj.position.y += Math.sin(Math.min(1, G.t / G.dur) * Math.PI) * G.arcH;
        if (tg.quat) tool.obj.quaternion.slerpQuaternions(G.q0, tg.quat, e);
        if (G.t >= G.dur) { tool.glide = null; G.res(true); }
      } else if (tool.mode === 'held') this.placeTool(tool, this.heldPose(tool));
      else if (tool.mode === 'block' && tool.obj.visible) this.placeTool(tool, this.blockPose(tool));
    }
  }

  // ================================================================ dipping
  async dip(pot, auto = false, keep = false) {
    const tool = this.tool;
    if (this.dipping || !pot) return;
    if (!pot.open) { this.wobbleLid(pot); return; }
    this.dipping = true;
    this.toolBusy = true;
    tool.mode = 'dip';
    tool.arrived = false;
    fx.clearHands();
    const c = pot.obj.getWorldPosition(V());
    const qUp = new T.Quaternion();
    const above = V(c.x, S.RIM_Y + 0.12, c.z), low = V(c.x, S.PAINT_Y - 0.02, c.z);
    if (tool === this.stamp) { above.y = S.RIM_Y + 0.08; low.y = S.PAINT_Y + 0.002; }
    await this.toolGlide(tool, { pos: above, quat: qUp }, 0.2, Ease.out);
    if (this.dead) return;
    // the rim lights
    this.potGlow(pot);
    await this.toolGlide(tool, { pos: low, quat: qUp }, 0.25, Ease.inOut);
    if (this.dead) return;
    psfx.plip();
    const sf = pot.obj.userData.surface;
    if (sf) this.s.anim(0.3, (_, p) => { const k = Math.sin(p * Math.PI); sf.scale.set(1 + 0.03 * k, 1 - 0.06 * k, 1 + 0.03 * k); }).then(() => sf.scale.set(1, 1, 1));
    await this.wait(0.15);
    this.loadTool(tool, pot.key);
    this.lastPot = pot;
    this.bobPot = null;
    this.drop(pot.key, low);
    await this.toolGlide(tool, { pos: above, quat: qUp }, 0.2, Ease.out);
    if (this.dead) return;
    this.dipping = false;
    this.toolBusy = false;
    this.dips = (this.dips || 0) + 1;
    if (!auto) this.afterDip(pot.key);
    if (this.g && this.g.down && !auto) { tool.mode = 'held'; this.toolGlide(tool, () => this.heldPose(tool), 0.25, Ease.out).then((ok) => { if (ok) tool.arrived = true; }); }
    else if (!keep) { tool.mode = 'held'; this.setDown(); }
  }
  loadTool(tool, col, quiet = false) {
    tool.col = col;
    tool.load = 1;
    if (tool === this.stamp) {
      tool.prints = 6; tool.obj.userData.setTip(col);
      // Level 1 round 6: after her first stamp dip
      if (this.rd && this.rd.teach === 'stamp' && !this.said.has('stampx')) { this.said.add('stampx'); this.s.wait(0.7).then(() => this.say('Stamp, stamp, stamp!')); }
    }
    else tool.obj.userData.setTip(col, 1);
    // the colour's name: voiced once per colour per level, a caption after that
    const k = 'c:' + col;
    const first = !this.said.has(k);
    this.said.add(k);
    if (!quiet) this.say(NAME[col], { voice: first && this.level < 2, max: 0.6 });
  }
  drop(col, at) {
    const m = new T.Mesh(geo.sphere(0.025, 10, 8), toon(hex(col)));
    m.position.copy(at).add(V(0, -0.01, 0));
    this.root.add(m);
    this.s.anim(0.3, (e) => { m.position.y = at.y - 0.01 - e * 0.05; m.scale.setScalar(Math.max(0.001, 1 - e * 0.6)); }, Ease.in).then(() => { this.root.remove(m); });
  }
  potGlow(p) {
    // the rim lights a little (8% brighter) while the brush is in it
    const m = p.obj.userData.parts?.[p.obj.userData.parts ? 'skin' : ''];
    if (!m) return;
    const old = m.material;
    m.material = toon(0xffffff, { vertexColors: true, emissive: 0x2a2620 });
    this.s.wait(0.7).then(() => { m.material = old; });
  }
  afterDip(col) {
    // a stuck child who dips but never paints: the rub demo (once)
    if (this.roundLive && this.phase !== 'busy' && !this.shown.has('rub') && !this.demoing && this.rd && !this.rd.choose) this.s.wait(1.2).then(() => { if (!this.shown.has('rub') && this.phase === 'paint' && !(this.g && this.g.down) && performance.now() - this.lastTouch > 1100) this.teach('rub'); });
    if (this.rd && this.rd.rub && this.round === 0 && !this.saidRub) { this.saidRub = true; this.instr = this.rd.rub; this.say(this.rd.rub); }
  }

  // ================================================================ painting
  // Paint goes on ONLY here: under the pointer, while her finger / mouse button is down on the toy. A segment from
  // the last point to this one is filled with dabs every 9 px, so fast strokes have no gaps.
  paintTo(x, y) {
    const g = this.g, tool = this.tool;
    if (!g || !g.down || !this.toy || this.surface.toy !== this.toy || tool.mode !== 'held' || this.dipping || this.toolBusy) { this.endStroke(); return; }
    if (tool === this.stamp) return;
    const hit = screenToToy(this.toy, x, y);
    if (!hit || hit.u < -0.1 || hit.u > 1.1 || hit.v < -0.1 || hit.v > 1.1) return;
    if (!this.stroking) {
      if (!hit.part) return;            // rubbing on the board paints nothing
      this.stroking = { part: hit.part, t0: performance.now() };
      this.surface.begin(this.rd.clip ? hit.part : null);
      const now = performance.now();
      if (tool.col && tool.load > 0 && now - (this.swishT || 0) > 800) { this.swishT = now; psfx.swish(); }
    }
    if (!tool.col || tool.load <= 0) { this.emptyBrush(); return; }
    const sp = Math.abs(this.tipS.vx);
    const dry = tool.load < 0.15;
    const size = dry ? 0.6 : 1 + clamp((sp - 500) / 2500, -0.12, 0.12);
    const d = this.surface.strokeTo(hit.u, hit.v, tool.col, { size, dry, world: 0.22 / (this.toy.k || 1) });
    if (d > 0 && hit.part) {
      const rate = ((this.level === 0 ? 0.22 : 0.165) / this.toy.sh.size[0]) * (0.17 / 0.22) * (this.toy.k || 1);
      tool.load = Math.max(0, tool.load - d * rate);
      tool.obj.userData.setTip(tool.load > 0 ? tool.col : null, tool.load);
      this.noteMark(hit.part, tool.col);
      if (tool.load <= 0) this.emptyBrush();
    }
  }
  endStroke() { if (this.stroking) { this.stroking = null; this.surface.end(); } }
  noteMark(part, col) {
    if (this.g) this.g.marked = true;
    if (this.ask && part === this.ask.part && col !== this.ask.col) this.g && (this.g.wrong = true);
  }
  // Level 3: once the asked colour is mixed, the dish is where the paint comes from
  paintSource() { return this.level === 2 && this.dish?.made && this.ask && this.dish.res === this.ask.col ? this.dish : null; }
  emptyBrush() {
    const tool = this.tool;
    tool.load = 0;
    tool.col = null;
    tool.obj.userData.setTip(null, 0);
    if (this.paintSource()) this.bobDish = true;
    else if (!this.bobPot && this.lastPot) this.bobPot = this.lastPot;
    if (!this.said.has('more')) { this.said.add('more'); this.say('More paint!'); }
    else if (!this.moreShownT || performance.now() - this.moreShownT > 6000) { this.moreShownT = performance.now(); this.say('More paint!', { voice: false, max: 0.8 }); }
  }
  // a tap on the toy: the brush splats, the stamp prints
  async tapToy(g) {
    const tool = this.tool;
    const tx = g.x, ty = g.y;
    const hit = screenToToy(this.toy, tx, ty);
    if (!hit || !hit.part) return;
    this.toolBusy = true;
    // the mark is there at once, exactly where she tapped; the tool presses on it
    this.tipS.x = tx; this.tipS.y = ty;
    const p = this.surfacePoint(tx, ty);
    if (p) { tool.depth = p.depth; tool.onToy = p.onToy ? 1 : 0; tool.onDish = false; }
    const pose = this.heldPose(tool);
    tool.mode = 'press';
    if (tool.glide) { tool.glide.res(false); tool.glide = null; }
    tool.obj.quaternion.copy(pose.quat);
    const n = V(0, Math.sin(S.LEAN), Math.cos(S.LEAN));
    const base = pose.pos;
    this.s.anim(0.1, (e) => tool.obj.position.copy(base).addScaledVector(n, -0.03 * e));
    const clip = this.rd.clip ? hit.part : null;
    if (tool === this.stamp) {
      if (tool.col && tool.prints > 0) {
        let u = hit.u, v = hit.v, ring = -1;
        // Level 2 round 7: a white stamp snaps to the nearest empty ring and is counted
        const st = this.stepNow();
        if (st && st.spots && tool.col === st.col) {
          let bd = 0.35;   // (any print on the cap snaps to the nearest empty ring)
          (this.toy.sh.rings || []).forEach(([ru, rv], i) => { if (this.countedRings.includes(i)) return; const d = Math.hypot(ru - u, rv - v); if (d < bd) { bd = d; ring = i; } });
          if (ring >= 0) { u = this.toy.sh.rings[ring][0]; v = this.toy.sh.rings[ring][1]; }
        }
        this.surface.begin(ring >= 0 ? null : clip);
        this.surface.stamp(u, v, tool.col, 0.24 / (this.toy.k || 1));
        this.surface.end();
        psfx.pat(true);
        tool.prints--;
        this.stamps = (this.stamps || 0) + 1;
        this.noteMark(partAt(this.toy.sh, u, v), tool.col);
        if (tool.prints <= 0) { tool.col = null; tool.obj.userData.setTip(null); this.bobPot = this.bobPot || this.lastPot; }
        if (ring >= 0 && this.countedRings.length < 3) {
          this.countedRings.push(ring);
          const n2 = this.countedRings.length;
          this.say(['One.', 'Two.', 'Three!'][n2 - 1], { max: 0.8 });
        }
      } else this.emptyBrush();
    } else if (tool.col && tool.load > 0 && this.spotTap(hit, tool)) {
      // (the spots step: a white brush tap on the cap is a spot too)
      psfx.pat(true);
      tool.load = Math.max(0, tool.load - 0.08);
      tool.obj.userData.setTip(tool.load > 0 ? tool.col : null, tool.load);
    } else if (tool.col && tool.load > 0) {
      this.surface.begin(clip);
      this.surface.splat(hit.u, hit.v, tool.col, Math.random(), 0.32 / (this.toy.k || 1));
      this.surface.end();
      psfx.pat();
      tool.load = Math.max(0, tool.load - 0.08);
      tool.obj.userData.setTip(tool.load > 0 ? tool.col : null, tool.load);
      this.noteMark(hit.part, tool.col);
      if (tool.load <= 0) this.emptyBrush();
    } else this.emptyBrush();
    this.pressToy();
    await this.wait(0.1);
    await this.s.anim(0.12, (e) => tool.obj.position.copy(base).addScaledVector(n, -0.03 * (1 - e)));
    this.toolBusy = false;
    tool.mode = 'held';
    if (!(this.g && this.g.down)) this.setDown();
  }
  // a white tap with the brush in the spots step: it prints a spot on the nearest empty ring (counted)
  spotTap(hit, tool) {
    const st = this.stepNow();
    if (!st || !st.spots || tool.col !== st.col || hit.part !== 'cap') return false;
    let ring = -1, bd = 0.35;
    (this.toy.sh.rings || []).forEach(([ru, rv], i) => { if (this.countedRings.includes(i)) return; const d = Math.hypot(ru - hit.u, rv - hit.v); if (d < bd) { bd = d; ring = i; } });
    if (ring < 0) return false;
    const [u, v] = this.toy.sh.rings[ring];
    this.surface.begin(null); this.surface.stamp(u, v, tool.col, 0.24 / (this.toy.k || 1)); this.surface.end();
    this.countedRings.push(ring);
    this.say(['One.', 'Two.', 'Three!'][this.countedRings.length - 1], { max: 0.8 });
    return true;
  }
  pressToy() {
    const t = this.toy?.group;
    if (!t) return;
    const k0 = this.toy.k || 1;
    this.s.anim(0.22, (_, p) => { const k = Math.sin(p * Math.PI) * 0.03; t.scale.set(k0 * (1 - k * 0.3), k0 * (1 - k * 0.3), 1 - k); }).then(() => t.scale.set(k0, k0, 1));
  }
  afterGesture(g) {
    // a wrong colour in a directed round: once per round, when her finger lifts
    if (g.wrong && this.ask) {
      this.wrongLifts = (this.wrongLifts || 0) + 1;
      if (this.wrongLifts === 1) {
        this.redirected = true;
        const who = this.friend && this.friend.visible ? this.friend : this.pip;
        this.redirect('', { obj: who });
        if (who && who.userData.face) { setFace(who.userData.face, 'calm'); this.s.wait(1.2).then(() => setFace(who.userData.face, 'happy')); }
        this.say(this.stepNow().cap);
        this.rightPotBob = true;
        if (this.paintSource()) this.bobDish = true;
      } else if (this.wrongLifts === 2) this.errorless();   // lids on the wrong pots (Level 3: the mixing help)
    }
  }

  // ================================================================ round end and hanging up
  updateDone(dt) {
    if (!this.roundLive || !this.toy || this.surface.toy !== this.toy || this.phase === 'busy' || this.phase === 'hang' || this.dipping || this.toolBusy) { this.doneOK = false; return; }
    const g = this.g;
    const rd = this.rd, st = this.stepNow(), sf = this.surface;
    const steps = rd.steps || [];
    const last = !steps.length || this.stepI >= steps.length - 1;
    let ok = false;
    if (rd.free !== undefined) {
      // (the round table's numbers: free = coverage, splats = taps, orStamps = dots)
      ok = sf.coverage() >= rd.free;                                            // she has painted some
      if (rd.splats) ok = ok || sf.splats >= rd.splats;                         // (or made three splats)
      if (rd.orStamps) ok = ok || sf.stamps >= rd.orStamps;                     // (or four dots)
    }
    else if (rd.rainbow) ok = Object.keys(this.toy.sh.parts).filter((p) => sf.coverage(p) >= 0.35).length >= rd.rainbow;   // (bands a third painted)
    else if (st && st.spots) ok = this.countedRings.length >= 3;
    else if (st && st.tail) ok = true;
    else if (st && st.part) ok = sf.coverage(st.part, st.col) >= 0.6;
    this.doneOK = ok;
    const since = (performance.now() - this.lastTouch) / 1000;
    const up = !g || !g.down || since > 4;    // (a finger resting still for 4 s counts as lifted)
    if (ok && !last) { if (up && since >= 1.2) this.finishStep(); return; }
    if (ok && !this.doneReady && up && since >= 0.6) this.readyToHang();
    // a gentle word if she stops early (never anything done for her)
    if (!ok && !this.doneReady && up && since >= 6 && sf.coverage() > 0.03 && !this.saidAll) {
      this.saidAll = true;
      if (st && st.spots) this.say(st.say, { voice: false });
      else if (rd.splats) this.say('Tap, tap, tap!', { voice: false });
      else if (rd.orStamps && this.tool === this.stamp) this.say('Stamp, stamp, stamp!', { voice: false });
      else {
        const first = !this.said.has('all');
        this.said.add('all');
        this.say('Paint it all!', { voice: first });
      }
    }
  }
  // her toy is ready to hang whenever SHE wants: the little gallery sign rises over the easel and glows
  readyToHang() {
    this.doneReady = true;
    const st = this.stepNow();
    if (st && (st.part || st.spots)) this.reactP = this.react();     // the friend sees itself in its colour
    this.showSign(true);
    this.instr = 'Hang it up!';
    const first = !this.said.has('hang');
    this.said.add('hang');
    this.say('Hang it up!', { voice: first });
    if (!this.shown.has('done')) this.s.wait(0.8).then(() => { if (this.doneReady && !(this.g && this.g.down)) this.teach('done'); });
  }
  // the sign sits in the board's top-right corner just in front of the board (behind the toy's plane, so it never
  // cuts into the toy); it drops in from above the board
  // the 'hang it up' sign: big (about 12 % of the screen high), standing on the easel ledge's right end, or, when the
  // toy reaches down into that corner, in a top corner of the board (below the caption). It pops up where it stands.
  signPose() {
    const E = this.L.easel, sp = this.signSpot || { ledge: true };
    if (sp.ledge) return { pos: V(E.x + 0.74, E.y + S.LEDGE_TOP, E.z + 0.11), rx: 0 };
    return { pos: S.boardPoint(sp.sl, sp.x, 0.014).add(E), rx: -S.LEAN };
  }
  pickSignSpot() {
    const t = this.toy, E = this.L.easel;
    const spots = [{ ledge: true }, { sl: 1.0, x: 0.74 }, { sl: 1.0, x: -0.74 }];
    this.signSpot = spots[0];
    if (!t || !t.group.parent) return;
    t.group.updateMatrixWorld(true);
    const k = t.group.scale.x, K = SIGN_K;
    let best = null, bestD = -1;
    for (const sp of spots) {
      this.signSpot = sp;
      const P = this.signPose();
      // the sign's frame: its middle (0.32 up the post) and four corners (0.43 x 0.33, at scale K)
      const up = sp.ledge ? V(0, 1, 0) : V(0, Math.cos(S.LEAN), -Math.sin(S.LEAN));
      const c = P.pos.clone().addScaledVector(up, 0.32 * K);
      const probe = [c];
      for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) probe.push(c.clone().add(V(dx * 0.215 * K, 0, 0)).addScaledVector(up, dy * 0.165 * K));
      let d = 1e9;
      for (const q of probe) {
        const l = t.group.worldToLocal(q.clone());
        const u = (l.x + t.hx) / t.S + 0.5, v = (l.y + t.hy) / t.S + 0.5;
        if (inPoly(u, v, t.sh.outline)) { d = 0; break; }
        if (q === c) for (const [a, b] of t.sh.outline) d = Math.min(d, Math.hypot(a - u, b - v) * t.S * k);
      }
      if (d >= 0.3) return;
      if (d > bestD) { bestD = d; best = sp; }
    }
    this.signSpot = best;
  }
  showSign(on) {
    if (!this.sign) {
      this.sign = S.makeHangSign();
      if (!this.sign) return;
      this.sign.scale.setScalar(0.001);
      this.sign.visible = false;
      this.root.add(this.sign);
    }
    const sg = this.sign;
    if (this.stopSignGlow) { this.stopSignGlow(); this.stopSignGlow = null; }
    if (on) {
      if (!sg.visible) {
        this.pickSignSpot();
        const P = this.signPose();
        sg.position.copy(P.pos); sg.rotation.set(P.rx, 0, 0);
        sg.scale.setScalar(0.001);
        // the brush lies down at the ledge's left part, clear of the sign
        if (this.signSpot.ledge && this.tool === this.brush && this.brush.mode === 'rest') { sg.visible = true; this.toolGlide(this.brush, this.restPose(this.brush), 0.35, Ease.inOut, 0.08); }
      }
      sg.visible = true;
      const k0 = sg.scale.x;
      // it pops up where it stands (a small overshoot), then glows
      this.s.anim(0.45, (e) => sg.scale.setScalar(Math.max(0.001, k0 + (SIGN_K - k0) * e)), Ease.out).then(() => {
        if (!this.doneReady) return;
        const mid = new T.Object3D(); mid.position.set(0, 0.32, 0.06); sg.add(mid);
        this.stopSignGlow = fx.halo(mid, 0.42);
      });
    } else {
      const k0 = sg.scale.x;
      this.s.anim(0.3, (e) => sg.scale.setScalar(Math.max(0.001, k0 * (1 - e))), Ease.inOut).then(() => { if (!this.doneReady) sg.visible = false; });
    }
  }
  // a big target: the sign and a ring round it; a touch on her toy outside the sign itself stays painting
  signAt(x, y) {
    if (!this.sign || !this.sign.visible || this.sign.scale.x < SIGN_K * 0.5) return false;
    const c = this.sign.localToWorld(V(0, 0.32, 0));
    const s2 = project(c);
    const d = Math.hypot(s2.x - x, s2.y - y);
    if (d > Math.max(screenRadius(c, 0.34), this.minSide() * 0.1)) return false;
    if (d > screenRadius(c, 0.2) && this.toy && this.toyOnEasel()) {
      const hit = screenToToy(this.toy, x, y);
      if (hit && hit.part) return false;
    }
    return true;
  }
  // she taps the sign: her toy is finished
  doneTap() {
    if (!this.doneReady || !this.roundLive) return;
    this.doneReady = false;
    this.roundLive = false;
    this.busy = true;
    fx.clearHands();
    this.clearHints();
    this.rightPotBob = false;
    input.press(this.sign, 140);
    psfx.pat(true);
    this.showSign(false);
    this.stepT = performance.now();
    this.hangPhase();
  }
  // one step of a two-step round is done (the toy is NOT finished: the next instruction comes at once)
  async finishStep() {
    if (!this.roundLive) return;
    this.roundLive = false;
    this.busy = true;
    fx.clearHands();
    this.clearHints();
    this.rightPotBob = false;
    const rd = this.rd;
    const st = this.stepNow();
    // the friend sees itself in its own colour (directed steps)
    if (st && (st.part || st.spots)) this.reactP = this.react();
    this.stepT = performance.now();
    if (rd.steps && this.stepI < rd.steps.length - 1) {
      this.stepI++;
      // Level 3 carrot: the first dish goes to the saucer row as the second dish arrives
      if (this.level === 2 && this.dish && this.dish.made) { const old = this.dish; this.dishToSaucer(old); await this.takeDish(); }
      if (this.dead) return;
      await this.beginStep();
      return;
    }
    await this.hangPhase();
  }
  async react() {
    const f = this.friend;
    const c = toyCentreWorld(this.toy);
    if (!f || !f.visible) { this.pipWatch(c); await this.wait(0.9); return; }
    if (f.userData.who === 'card') { input.press(f, 160); this.pipWatch(c); await this.wait(0.9); return; }
    const who = f.userData.who;
    if (who === 'pip') {
      // Pip fluffs up on his stool
      const k = f.scale.x;
      await this.s.anim(0.5, (_, p) => f.scale.setScalar(k * (1 + Math.sin(p * Math.PI) * 0.08)));
      f.scale.setScalar(k);
      if (f.userData.face) setFace(f.userData.face, 'joy');
      sfx.cheep();
      await this.wait(0.9);
      if (f.userData.face) setFace(f.userData.face, 'happy');
      return;
    }
    // it stays at its spot beside the easel (never in front of the toy): a look at the toy, then at the child, joy, its call
    await this.turnTo(f, Math.atan2(c.x - f.position.x, c.z - f.position.z) * 0.6, 0.35);
    await this.wait(0.35);
    await this.turnTo(f, 0, 0.35);
    if (f.userData.face) setFace(f.userData.face, 'joy');
    await this.wait(0.3);
    if (who === 'frog') hop(this.s, f, 0.35, 0.4);
    if (who === 'crab') { const cl = f.userData.claws; if (cl) { const r0 = cl.map((b) => b.rotation.z); this.s.anim(0.6, (_, p) => cl.forEach((b, i) => (b.rotation.z = r0[i] + (i ? -1 : 1) * Math.abs(Math.sin(p * Math.PI * 2)) * 0.5))).then(() => cl.forEach((b, i) => (b.rotation.z = r0[i]))); } }
    else if (CALL[who]) sfx[CALL[who]]();
    await this.wait(1.0);
    if (f.userData.face) setFace(f.userData.face, 'happy');
    await this.turnTo(f, -0.35, 0.3);
  }
  nextPeg() { return this.hung.length; }
  pegWorld(i) { return this.wall.userData.pegs[i].clone().add(this.wall.position); }
  // where a toy hangs on wall peg i (group origin = ring centre, its back 0.03 off the wall)
  wallPose(i) { const p = this.pegWorld(i); return V(p.x, p.y - 0.008, WALL_Z + S.TOY_PROUD); }
  // the gallery hook comes down on its cord 1.0 above the toy's easel peg, in front of the board: a short lift for her
  hookPeg() { const p = this.pegPose(); return V(this.L.easel.x, p.y + HOOK_UP, HANG_Z); }
  hookToy() { return this.hookPeg().add(V(0, -0.008, 0)); }
  moveHook(down, dur) {
    if (!this.hook) {
      this.hook = S.makeHook();
      if (!this.hook) return Promise.resolve();
      this.hook.position.copy(this.hookPeg()).add(V(0, 4.5, 0));
      this.root.add(this.hook);
    }
    const hk = this.hook, a = hk.position.clone(), b = this.hookPeg().add(V(0, down ? 0 : 4.5, 0));
    hk.visible = true;
    return this.s.anim(dur, (e) => hk.position.lerpVectors(a, b, e), down ? Ease.out : Ease.in);
  }
  async hangPhase() {
    this.phase = 'hang';
    const toy = this.toy;
    this.endStroke();
    if (this.tool.mode === 'held') this.setDown();
    if (this.brush.mode === 'rest' && this.brush.obj.visible) this.toolGlide(this.brush, this.blockPose(this.brush), 0.4, Ease.inOut, 0.08);
    // the picture is finished: it gets its own texture, the working set is free
    this.surface.freeze();
    // the gallery hook comes down on its cord while the toy gives its little squash; the camera eases up a little
    const hookP = this.moveHook(true, 0.7);
    await this.beat(toy.group, 0.45);
    if (this.dead) return;
    const hv = this.hangView();
    this.glideCamera(hv.pos, hv.look, 0.6);
    await hookP;
    if (this.dead) return;
    const hk = this.hook;
    this.stopPegGlow = hk ? fx.halo(hk, 0.4) : null;
    this.instr = 'Hang it up!';
    if (this.friend && this.friend.visible && this.friend.userData.head) this.turnTo(this.friend, -0.15, 0.4);
    // the toy can now be dragged up onto the hook (or tapped: it goes there itself on a short arc)
    const centre = toyCentreWorld(toy).sub(toy.group.position);
    this.toyDrag = input.addDrag(toy.group, {
      radius: 0.8, offset: centre, sound: false, magnet: 0.3,
      zones: () => [{ obj: hk, pos: this.hookToy().add(centre), radius: 0.6, onNear: (k) => { this.pegNear = k; } }],
      onPick: () => this.liftToy(),
      onDrop: (z, info) => this.dropToy(z, info),
    });
    if (hk) this.pegTap = input.addTap(hk, { radius: 0.45, onTap: () => this.carryToPeg() });
    this.busy = false;
    this.idle = 0; this.stuck = 0;
    this.hangLive = true;
    if (!this.shown.has('hang')) await this.teach('hang');
  }
  liftToy() {
    const t = this.toy.group;
    fx.clearHands();
    this.stuck = 0;
    // upright, and onto a drag plane in front of the board (no clipping through it); it keeps its size
    this.s.stop(t.rotation);
    this.s.tween(t.rotation, { x: 0 }, 0.25, Ease.out);
    const z0 = t.position.z;
    this.s.anim(0.25, (e) => { t.position.z = z0 + (HANG_Z - z0) * e; }, Ease.out);
  }
  async dropToy(zone, { tapped } = {}) {
    if (!this.hangLive) return;
    if (zone) return this.slideToPeg();
    if (tapped) return this.carryToPeg();
    // a drop anywhere else: it goes back to the easel peg
    const t = this.toy.group, to = this.pegPose();
    const a = t.position.clone(), r0 = t.rotation.x;
    await this.s.anim(0.6, (e, p) => { t.position.lerpVectors(a, to, e); t.position.y += Math.sin(p * Math.PI) * 0.15; t.rotation.x = r0 + (-S.LEAN - r0) * e; }, Ease.inOut);
    if (this.toyDrag) this.toyDrag.home = t.position.clone();
  }
  async carryToPeg() {
    if (!this.hangLive) return;
    this.hangLive = false;
    this.disableHang();
    const t = this.toy.group, to = this.hookToy();
    const a = t.position.clone(), r0 = t.rotation.x;
    // a short slow lift: forward off the board and up onto the hook
    await this.s.anim(0.7, (e, p) => {
      t.position.lerpVectors(a, to, e);
      t.position.z += Math.sin(p * Math.PI) * 0.1;
      t.rotation.x = r0 * (1 - e);
    }, Ease.inOut);
    this.onPeg();
  }
  async slideToPeg() {
    if (!this.hangLive) return;
    this.hangLive = false;
    this.disableHang();
    const t = this.toy.group, to = this.hookToy();
    const a = t.position.clone(), r0 = t.rotation.x;
    await this.s.anim(0.3, (e) => { t.position.lerpVectors(a, to, e); t.rotation.x = r0 * (1 - e); }, Ease.out);
    this.onPeg();
  }
  disableHang() {
    if (this.toyDrag) { input.remove(this.toyDrag); this.toyDrag = null; }
    if (this.pegTap) { input.remove(this.pegTap); this.pegTap = null; }
    if (this.stopPegGlow) { this.stopPegGlow(); this.stopPegGlow = null; }
    fx.clearHands();
  }
  // on the hook: one small wobble and a rising note; a moment later the cord pulls it up to its peg on the gallery wall
  // (out of the picture), while the next blank toy is already rising behind the board
  onPeg() {
    const toy = this.toy, t = toy.group, i = this.nextPeg();
    t.position.copy(this.hookToy());
    t.rotation.set(0, 0, 0);
    const settle = this.s.anim(0.3, (_, p) => { t.rotation.z = Math.sin(p * Math.PI * 2) * 0.05 * (1 - p); }).then(() => { t.rotation.z = 0; });
    sfx.step(this.round, this.totalRounds);
    toy.off = true;
    this.hung.push(toy);
    toy.who = this.friend && this.friend.userData.who !== 'card' ? this.friend : null;
    this.toy = null;
    this.phase = 'busy';
    this.pegT = performance.now();
    this.s.wait(0.4).then(() => {
      const hk = this.hook, a = t.position.clone(), h0 = hk ? hk.position.clone() : null;
      return this.s.anim(0.8, (e) => { const dy = e * 4.5; t.position.copy(a).add(V(0, dy, 0)); if (hk) hk.position.copy(h0).add(V(0, dy, 0)); }, Ease.in);
    }).then(() => {
      // (above the picture now) it takes its place on the wall, at wall size
      t.position.copy(this.wallPose(i));
      t.scale.set(1, 1, 1);
    });
    // the next round is set up WHILE the toy goes up (the parent's rule: she can act again within about 1.5 s, never
    // more than 2 s with nothing to touch): the next blank toy, the pots, the friend, the dishes
    const next = this.round + 1;
    if (next < this.totalRounds) {
      if (this.level === 2 && this.dish && (this.dish.a || this.dish.made)) { const old = this.dish; this.dishToSaucer(old); this.takeDish(); }
      this.toyP = this.wait(0.6).then(() => { this.setupRound(next); return this.toyP; });
      if (this.level === 2 && this.rounds[next].rainbow) this.refillSaucers();
    }
    this.payoffP = settle;
    this.success(t.getWorldPosition(V()), '', { still: 1.0 });
  }
  async afterSuccess() {
    this.tool = this.brush;
    if (this.stamp.mode !== 'block' && this.stamp.obj.visible) { this.stamp.mode = 'block'; this.toolGlide(this.stamp, this.blockPose(this.stamp), 0.5, Ease.inOut, 0.15); }
  }

  // ================================================================ Level 1 round 8: which one?
  async startChoose() {
    this.phase = 'pickToy';
    this.instr = 'Which one?';
    this.roundLive = true;
    this.busy = false;
    this.say('Which one?');
    if (!this.shown.has('pick')) this.teach('pick');
  }
  choiceAt(x, y) {
    let best = null, bd = 1;
    for (const t of this.choices || []) {
      const c = toyCentreWorld(t), s = project(c), r = Math.max(screenRadius(c, 0.4), this.minSide() * 0.06);
      const d = Math.hypot(s.x - x, s.y - y) / r;
      if (d < bd) { bd = d; best = t; }
    }
    return best;
  }
  async choose(toy) {
    if (this.phase !== 'pickToy' || !this.choices) return;
    this.phase = 'busy';
    this.roundLive = false;
    this.busy = true;
    fx.clearHands();
    const others = this.choices.filter((t) => t !== toy);
    this.choices = null;
    // the chosen one hops onto the peg (0.6 s arc) growing to full size
    const t = toy.group, a = t.position.clone(), to = this.pegPose();
    const k0 = t.scale.x, k1 = (toy.k = this.toyScale(toy));
    const hopP = this.s.anim(0.6, (e, p) => { t.position.lerpVectors(a, to, e); t.position.y += Math.sin(p * Math.PI) * 0.5; const k = k0 + (k1 - k0) * e; t.scale.set(k, k, 1); }, Ease.inOut);
    // the other two go back the way they came: up over the board's top edge and down behind it (never across the
    // chosen one)
    others.forEach((o) => {
      const g = o.group, b = (o.stand || g.position).clone().add(V(0, 0.15, -0.95));
      this.arc(g, b, 0.6, 1.1).then(() => { g.visible = false; });
    });
    await hopP;
    if (this.dead) return;
    this.toy = toy;
    this.surface.attach(toy, { tone: toy.wood.tone, seed: toy.wood.seed });
    this.ask = null;
    this.instr = 'Paint it!';
    await this.liveRound('Paint it!');
  }

  // ================================================================ Level 3: mixing
  hasColour(col) {
    if (this.dish && this.dish.made && this.dish.res === col) return true;
    if (this.tool.col === col && this.tool.load > 0) return true;
    if (this.level < 2) return this.pots.some((p) => p.key === col && p.obj.visible);
    return (this.saucers || []).some((s) => s.full && s.col === col) || this.pots.some((p) => p.key === col && p.open);
  }
  recipeFor(col) {
    const open = this.pots.filter((p) => p.open).map((p) => p.key);
    const r = RECIPE[col];
    return r && r.every((k) => open.includes(k)) ? r : null;
  }
  async mixTurn() {
    const v = this.view.mix;
    if (v) this.glideCamera(v.pos, v.look, 0.8);
    this.mixing = true;
    this.roundLive = true;
    this.busy = false;
    this.idle = 0; this.stuck = 0;
    if (!this.shown.has('dish')) await this.teach('dish');
    void v;
  }
  // the brush touches the dish
  async touchDish(fromDown, keep = false) {
    const st = this.dish, tool = this.tool;
    if (!st || this.dipping || tool !== this.brush) return;
    if (st.made) {
      // the dish works like a pot
      return this.dipDish();
    }
    if (st.a && st.b) { this.stirring = true; return; }
    if (!tool.col || tool.load <= 0) return;
    const col = tool.col;
    this.dipping = true;
    this.toolBusy = true;
    tool.mode = 'dip';
    tool.arrived = false;
    if (!st.a && !st.b && this.view.mix) this.glideCamera(this.view.mix.pos, this.view.mix.look, 0.8);
    const d = st.obj;
    d.updateMatrixWorld(true);
    const n = V(0, 1, 0).applyQuaternion(d.quaternion);
    const side = !st.a ? -0.2 : 0.2;
    const spot = d.localToWorld(V(side, S.WELL_Y + 0.01, 0.0));
    const q = this.quatUp(n.clone().lerp(V(0, 0, 1), 0.3));
    await this.toolGlide(tool, { pos: spot.clone().addScaledVector(n, 0.14), quat: q }, 0.2, Ease.out);
    await this.toolGlide(tool, { pos: spot.clone().addScaledVector(n, 0.02), quat: q }, 0.25, Ease.inOut);
    if (this.dead) return;
    psfx.plip();
    if (!st.a) { st.a = col; this.puddle(st, col, 'left'); }
    else if (col === st.a) this.puddleSwell(st);
    else { st.b = col; this.puddle(st, col, 'right'); st.res = mixOf(st.a, st.b); }
    tool.col = null; tool.load = 0; tool.obj.userData.setTip(null, 0);
    await this.toolGlide(tool, { pos: spot.clone().addScaledVector(n, 0.16), quat: q }, 0.2, Ease.out);
    this.dipping = false;
    this.toolBusy = false;
    if (this.g && this.g.down && !this.auto) { tool.mode = 'held'; this.toolGlide(tool, () => this.heldPose(tool), 0.25, Ease.out).then((ok) => { if (ok) tool.arrived = true; }); }
    else if (!keep) { tool.mode = 'held'; this.setDown(); }
    if (st.b && this.g && this.g.down) { this.stirring = true; st.last = null; }   // (rubbing straight on stirs)
    if (st.b && !this.shown.has('stir')) { this.instr = 'Stir!'; this.say('Stir!'); this.s.wait(0.4).then(() => { if (!this.stirring) this.teach('stir'); }); }
    else if (st.b) { this.instr = 'Stir!'; this.say('Stir!'); }
  }
  async dipDish() {
    const st = this.dish, tool = this.tool;
    if (this.dipping) return;
    this.dipping = true; this.toolBusy = true; tool.mode = 'dip'; tool.arrived = false;
    const d = st.obj;
    const n = V(0, 1, 0).applyQuaternion(d.quaternion);
    const spot = d.localToWorld(V(0, S.WELL_Y + 0.01, 0));
    const q = this.quatUp(n.clone().lerp(V(0, 0, 1), 0.3));
    await this.toolGlide(tool, { pos: spot.clone().addScaledVector(n, 0.14), quat: q }, 0.2, Ease.out);
    await this.toolGlide(tool, { pos: spot.clone().addScaledVector(n, 0.02), quat: q }, 0.25, Ease.inOut);
    if (this.dead) return;
    psfx.plip();
    await this.wait(0.12);
    this.loadTool(tool, st.res);
    await this.toolGlide(tool, { pos: spot.clone().addScaledVector(n, 0.16), quat: q }, 0.2, Ease.out);
    this.dipping = false; this.toolBusy = false;
    if (this.g && this.g.down && !this.auto) { tool.mode = 'held'; this.toolGlide(tool, () => this.heldPose(tool), 0.25, Ease.out).then((ok) => { if (ok) tool.arrived = true; }); }
    else { tool.mode = 'held'; this.setDown(); }
  }
  touchSaucer(sc) {
    if (sc.full) {
      // (Level 3 round 8: Pip has filled it again) it works like a pot
      this.pickUp();
      const fake = { key: sc.col, obj: sc.obj, open: true };
      this.dipSaucer(fake);
      return;
    }
    // a used-up saucer holds only a smear: its recipe dots pulse once and its recipe is said (how to get it back)
    for (const d of sc.st?.dots || []) { const k = d.scale.x; this.s.anim(0.5, (_, p) => d.scale.setScalar(k * (1 + Math.sin(p * Math.PI) * 0.5))).then(() => d.scale.setScalar(k)); }
    if (RECIPE_LINE[sc.col]) this.say(RECIPE_LINE[sc.col]);
  }
  async dipSaucer(p) {
    const tool = this.tool;
    this.dipping = true; this.toolBusy = true; tool.mode = 'dip'; tool.arrived = false;
    const c = p.obj.getWorldPosition(V());
    const q = new T.Quaternion();
    await this.toolGlide(tool, { pos: c.clone().add(V(0, 0.2, 0)), quat: q }, 0.2, Ease.out);
    await this.toolGlide(tool, { pos: c.clone().add(V(0, 0.04, 0)), quat: q }, 0.22, Ease.inOut);
    psfx.plip();
    this.loadTool(tool, p.key);
    await this.toolGlide(tool, { pos: c.clone().add(V(0, 0.22, 0)), quat: q }, 0.2, Ease.out);
    this.dipping = false; this.toolBusy = false;
    if (!(this.g && this.g.down)) { tool.mode = 'held'; this.setDown(); }
    else { tool.mode = 'held'; this.toolGlide(tool, () => this.heldPose(tool), 0.25, Ease.out).then((ok) => { if (ok) tool.arrived = true; }); }
  }
  // the puddles: a lumpy shape covering the left 55 %, then the right 55 % with a wavy edge
  puddle(st, col, side) {
    const c = st.obj.userData.ctx;
    if (!c) return;
    const tex = st.obj.userData.tex;
    let k = 0;
    const draw = () => {
      c.save();
      c.fillStyle = COLOURS[col];
      c.beginPath();
      const r = 52 * k;
      if (side === 'left') {
        for (let i = 0; i <= 24; i++) { const a = Math.PI / 2 + (i / 24) * Math.PI, rr = r * (1 + Math.sin(i * 1.7) * 0.06); c.lineTo(64 + Math.cos(a) * rr, 64 + Math.sin(a) * rr); }
        for (let i = 0; i <= 10; i++) { const y = 64 + r - (i / 10) * 2 * r; c.lineTo(64 + 7 * k + Math.sin(i * 1.3) * 4, y); }
      } else {
        for (let i = 0; i <= 24; i++) { const a = -Math.PI / 2 + (i / 24) * Math.PI, rr = r * (1 + Math.sin(i * 2.1) * 0.06); c.lineTo(64 + Math.cos(a) * rr, 64 + Math.sin(a) * rr); }
        for (let i = 0; i <= 10; i++) { const y = 64 + r - (i / 10) * 2 * r; c.lineTo(64 - 7 * k + Math.sin(i * 1.9 + 1) * 5, y); }
      }
      c.closePath(); c.fill(); c.restore();
      tex.needsUpdate = true;
    };
    this.s.anim(0.4, (e) => { k = e; draw(); }, Ease.out);
  }
  puddleSwell(st) {
    const w = st.obj.userData.well;
    if (!w) return;
    this.s.anim(0.5, (_, p) => w.scale.set(1 + Math.sin(p * Math.PI) * 0.1, 1, 1 + Math.sin(p * Math.PI) * 0.1)).then(() => w.scale.set(1, 1, 1));
  }
  // stirring: her own rubbing smears the two colours into spiral streaks; progress = distance rubbed / 3.2
  updateStir(dt) {
    const st = this.dish;
    if (!st || !st.b || st.made || !this.stirring) return;
    const tool = this.tool;
    const g = this.g;
    if (!g || !g.down || tool.mode !== 'held' || this.dipping) return;
    const sp = tool.surf;
    if (!sp || !sp.onDish) { st.last = null; return; }
    const l = sp.local;
    if (Math.hypot(l.x, l.z) > 0.42) { st.last = null; return; }
    if (st.last) {
      const d = Math.hypot(l.x - st.last.x, l.z - st.last.z);
      if (d > 0.0005) {
        const a0 = Math.atan2(st.last.z, st.last.x), a1 = Math.atan2(l.z, l.x);
        let da = a1 - a0; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
        const r = Math.hypot(l.x, l.z);
        const dth = r > 0.12 ? da : d / 0.3;
        this.addStir(d, dth, l);
      }
    }
    st.last = l.clone();
  }
  addStir(d, dth, at) {
    const st = this.dish;
    if (!st || st.made) return;
    if (!st.ready) {
      st.prog += d / 2.0;   // (one slow circle is about 1.7: the beat comes at 0.85)
      if (this.stirSnd === undefined || performance.now() - this.stirSnd > 260) { this.stirSnd = performance.now(); psfx.squish(Math.min(1, d * 12)); }
      const c = st.obj.userData.ctx;
      if (c) {
        // smear: the canvas onto itself, rotated about the centre
        c.save();
        c.globalAlpha = 0.9;
        c.translate(64, 64); c.rotate(dth * 0.6); c.translate(-64, -64);
        c.drawImage(st.obj.userData.canvas, 0, 0, 128, 128);
        c.restore();
        // fresh streaks of both parents under the tip
        const px = 64 + (at.x / 0.704) * 128, py = 64 + (at.z / 0.704) * 128;
        c.globalAlpha = 1;
        const rr = Math.max(0.5, 5 * (1 - st.prog));   // the parent streaks thin out as she stirs
        c.fillStyle = COLOURS[st.a]; c.beginPath(); c.arc(px - 3, py, rr, 0, 7); c.fill();
        c.fillStyle = COLOURS[st.b]; c.beginPath(); c.arc(px + 3, py + 2, rr, 0, 7); c.fill();
        c.globalAlpha = Math.min(0.2, 1.5 * d); c.fillStyle = COLOURS[st.res]; c.fillRect(0, 0, 128, 128);   // by distance, not frames
        c.globalAlpha = 1;
        st.obj.userData.tex.needsUpdate = true;
      }
    }
    if (st.prog >= 0.85 && !st.beat) {
      st.beat = true;
      this.beat(st.obj, 0.45).then(() => { st.ready = true; if (!(this.g && this.g.down)) this.revealMix(); });
    }
  }
  stirRelease(tap) {
    const st = this.dish;
    this.stirring = false;
    if (!st || st.made) return;
    if (tap) this.stirTap();
    else if (st.ready) this.revealMix();
  }
  // tap fallback: the brush stirs one slow half-circle by itself (0.6 s) and adds 20 %
  async stirTap() {
    const st = this.dish, tool = this.brush;
    if (!st || !st.b || st.made || this.stirAnim) return;
    this.stirAnim = true;
    this.toolBusy = true;
    tool.mode = 'dip';
    const d = st.obj;
    const n = V(0, 1, 0).applyQuaternion(d.quaternion);
    const q = this.quatUp(n.clone().lerp(V(0, 0, 1), 0.3));
    const a0 = st.ang || 0;
    let last = null;
    await this.toolGlide(tool, { pos: d.localToWorld(V(Math.cos(a0) * 0.25, S.WELL_Y + 0.02, Math.sin(a0) * 0.25)).addScaledVector(n, 0.05), quat: q }, 0.2, Ease.out);
    await this.s.anim(0.6, (e) => {
      const a = a0 + e * Math.PI, l = V(Math.cos(a) * 0.25, 0, Math.sin(a) * 0.25);
      tool.obj.position.copy(d.localToWorld(V(l.x, S.WELL_Y + 0.02, l.z))).addScaledVector(n, 0.05);
      if (last) this.addStir(0.12 * 2.0 * (e - last.e), (e - last.e) * Math.PI, l);   // (12 % a tap: rubbing is quicker)
      last = { e };
    }, Ease.inOut);
    st.ang = a0 + Math.PI;
    this.stirAnim = false;
    this.toolBusy = false;
    if (st.ready) this.revealMix();
    if (!(this.g && this.g.down)) { tool.mode = 'held'; this.setDown(); }
  }
  async revealMix() {
    const st = this.dish;
    if (!st || st.made || this.revealing) return;
    this.revealing = true;
    st.made = true;
    // the last streaks melt and the whole dish is the new colour
    const c = st.obj.userData.ctx;
    await this.s.anim(0.3, () => { if (c) { c.globalAlpha = 0.35; c.fillStyle = COLOURS[st.res]; c.fillRect(0, 0, 128, 128); c.globalAlpha = 1; st.obj.userData.tex.needsUpdate = true; } });
    this.fillWell(st, st.res);
    sfx.step(this.round, this.totalRounds, { soft: true });
    this.addDots(st);
    this.lastPot = null;
    const want = this.ask && this.ask.col;
    // (a wrong mix never loads the brush: she can't paint the turtle orange while the line plays)
    if (!want || st.res === want) { this.loadTool(this.brush, st.res, true); this.said.add('c:' + st.res); }
    const line = RECIPE_LINE[st.res];
    const first = !this.said.has('r:' + st.res);
    this.said.add('r:' + st.res);
    this.revealing = false;
    await this.say(line, { voice: first, max: 3 });
    if (this.dead) return;
    if (!want || st.res === want) this.s.wait(0.2).then(() => { const v = this.view.paint; this.glideCamera(v.pos, v.look, 0.9); });
    if (want && st.res !== want) {
      // made honestly, but not what we need: it joins the saucer row, a fresh dish comes, try again
      const f = this.friend;
      if (f && f.userData.face) setFace(f.userData.face, 'calm');
      this.say(NEED[want]);
      this.wrongMixes++;
      this.brush.col = null; this.brush.load = 0; this.brush.obj.userData.setTip(null, 0);
      await this.wait(0.8);
      await this.dishToSaucer(st);
      await this.takeDish();
      if (f && f.userData.face) setFace(f.userData.face, 'happy');
      if (this.wrongMixes >= 3) this.mixErrorless();
      return;
    }
    // the right colour: paint!
    this.mixing = false;
    const s2 = this.stepNow();
    this.instr = s2.say;
    this.say(s2.say);
    if (this.ask && Object.keys(this.toy.sh.parts).length > 1) this.pulseOutline(this.ask.part);
    if (!this.shown.has('rub')) this.s.wait(1.2).then(() => { if (this.phase === 'paint') this.teach('rub'); });
  }
  mixErrorless() {
    const want = this.ask && this.ask.col;
    const r = want && RECIPE[want];
    if (!r) return;
    const st = this.dish;
    if (st && st.a && st.b) { this.demo('stir'); return; }   // (the hand shows the stirring; she stirs)
    for (const p of this.pots) if (p.open && !r.includes(p.key)) this.lidOn(p);
  }
  saucersFull() {
    for (const sc of this.saucers || []) if (['orange', 'green', 'purple'].includes(sc.col)) sc.full = true;
  }
  // Level 3 round 8 (as the seventh toy goes up): three spare dishes come off the stack already full of orange, green
  // and purple, and settle in a row in front of the easel
  refillSaucers() {
    ['orange', 'green', 'purple'].forEach((col, i) => {
      let d = this.stack.pop();
      if (!d) { d = S.makeDish(); d.position.copy(this.L.stack).add(V(0, -0.12, 0)); d.scale.setScalar(SPARE); this.root.add(d); }
      const st = { obj: d, res: col, a: col };
      this.fillWell(st, col);
      const sc = { obj: d, col, full: true, st };
      this.saucers.push(sc);
      const to = V(SAUCER[col][0], 0, SAUCER[col][1]);
      this.s.wait(i * 0.2).then(() => this.arc(d, to, 0.9, 0.45));
    });
  }
  // round 8 starts: the three full saucers bob once in turn, one plip each - the cue that they are paint again
  saucerCue() {
    (this.saucers || []).filter((x) => x.full).forEach((sc, i) => this.s.wait(0.3 + i * 0.35).then(() => { this.bobThing(sc.obj, 1, 0.05); psfx.plip(); }));
  }
  pipLookAlongPots() {
    const pip = this.pip, r0 = pip.rotation.y;
    this.s.anim(2.0, (_, p) => { pip.rotation.y = r0 + Math.sin(p * Math.PI * 2) * 0.35; }).then(() => { pip.rotation.y = r0; });
  }

  // ================================================================ showing how
  async teach(key) {
    if (this.shown.has(key) || this.dead) return;
    this.shown.add(key);
    if (key === 'dish') this.shown.add('dip');
    await this.demo(key, false);   // (the parent's rule: a demo is a ghost hand only - it never paints her toy)
  }
  // the hand demo on the real objects (real = the tool really does it too, the first time)
  glideCamera(pos, look, dur = 0.9) { this.glideEnd = performance.now() + dur * 1000; return super.glideCamera(pos, look, dur); }
  // the sign's middle in the world, at its full size (it may still be popping up)
  signCentre() {
    const P = this.signPose(), up = P.rx ? V(0, Math.cos(S.LEAN), -Math.sin(S.LEAN)) : V(0, 1, 0);
    return P.pos.clone().addScaledVector(up, 0.32 * SIGN_K).add(V(0, 0, 0.05));
  }
  async demo(key, real = false) {
    if (this.demoing || this.dead) return;
    // (a hand that starts while the camera is still gliding would point at where things WERE on the screen)
    const left = (this.glideEnd || 0) - performance.now();
    if (left > 0) { await this.wait(Math.min(1.2, left / 1000 + 0.05)); if (this.demoing || this.dead) return; }
    this.demoing = true;
    this.demoKey = key;
    this.lastDemoT = performance.now();
    // (a touch ends the demo hand at once - the engine's rule 0; only the first 0.3 s are kept clear)
    this.demoLock = performance.now();
    fx.clearHands();
    const tool = this.tool;
    const pot = this.demoPot();
    const T3 = (o, dy = 0) => o.getWorldPosition(V()).add(V(0, dy, 0));
    try {
      if (key === 'dip' && this.paintSource()) {
        fx.ghostPath([T3(this.dish.obj, 0.08)], { mode: 'tap', maxDur: 1.8 });
        await this.wait(1.8);
      } else if (key === 'dip' && pot) {
        fx.ghostPath([T3(pot.obj, 0.35)], { mode: 'tap', maxDur: 1.8 });
        if (real) { await this.wait(0.45); this.auto = true; await this.dip(pot, true); this.auto = false; await this.wait(0.45); }
        else await this.wait(1.8);
      } else if (key === 'rub' && this.toy) {
        const pts = this.zigzag(this.ask ? this.ask.part : null);
        fx.ghostPath(pts.map((p) => p.w), { mode: 'drag', maxDur: 2.6 });
        if (real && this.tool.col) await this.fakeDrag(pts, 2.6, { demo: true });
        else await this.wait(2.6);
      } else if (key === 'splat' && this.toy) {
        const a = this.partPoint(0.35, 0.55), b = this.partPoint(0.62, 0.42);
        fx.ghostPath([a.w, b.w], { mode: 'scan', maxDur: 2.4 });
        if (real && !this.tool.col && pot) { this.auto = true; await this.dip(pot, true, true); this.auto = false; }
        if (real && this.tool.col) {
          await this.wait(0.55); await this.fakeTap(a);
          await this.wait(0.5); await this.fakeTap(b);
          await this.wait(0.3);
        } else await this.wait(2.4);
      } else if (key === 'stamp') {
        const sp = T3(this.stamp.obj, 0.15);
        const p2 = pot ? T3(pot.obj, 0.35) : sp;
        const ring = this.stepNow()?.spots && this.toy ? this.toy.sh.rings.find((_, i) => !this.countedRings.includes(i)) : null;
        const c = ring ? { w: toyWorld(this.toy, ring[0], ring[1]) } : this.partPoint(0.5, 0.5);
        fx.ghostPath([sp, p2, c.w], { mode: 'scan', maxDur: 2.6 });
        // (for real only the swap: the stamp is now the active tool; the dip and the print are hers)
        if (real) { await this.wait(0.45); await this.swapTo('stamp'); await this.wait(1.5); }
        else await this.wait(2.6);
      } else if (key === 'dish' && this.dish) {
        const r = this.recipeFor(this.ask.col) || (this.rd.open || []).slice(0, 2);
        const p1 = this.pots.find((p) => p.key === r[0] && p.open);
        if (p1) {
          fx.ghostPath([T3(p1.obj, 0.35), T3(this.dish.obj, 0.1)], { mode: 'scan', maxDur: 2.2 });
          if (real) { await this.wait(0.45); this.auto = true; await this.dip(p1, true, true); await this.touchDish(false, true); this.auto = false; await this.toolHome(); }
          else await this.wait(2.2);
        }
      } else if (key === 'stir' && this.dish) {
        const d = this.dish.obj, pts = [];
        for (let i = 0; i <= 10; i++) { const a = (i / 10) * Math.PI * 2; pts.push(d.localToWorld(V(Math.cos(a) * 0.26, 0.05, Math.sin(a) * 0.26))); }
        fx.ghostPath(pts, { mode: 'drag', maxDur: 2.6 });
        if (real) {
          // the brush really goes round once, slowly (a little of the mixing)
          const tool2 = this.brush;
          tool2.mode = 'dip';
          const n = V(0, 1, 0).applyQuaternion(d.quaternion), q = this.quatUp(n.clone().lerp(V(0, 0, 1), 0.3));
          await this.toolGlide(tool2, { pos: d.localToWorld(V(0.26, S.WELL_Y + 0.02, 0)).addScaledVector(n, 0.05), quat: q }, 0.35, Ease.out);
          let le = 0;
          await this.s.anim(2.0, (e) => {
            const a = e * Math.PI * 2, l = V(Math.cos(a) * 0.26, 0, Math.sin(a) * 0.26);
            tool2.obj.position.copy(d.localToWorld(V(l.x, S.WELL_Y + 0.02, l.z))).addScaledVector(n, 0.05);
            this.addStir(Math.min(0.15, (e - le) * 1.6 * 0.35), (e - le) * Math.PI * 2, l); le = e;
          }, Ease.inOut);
          await this.toolHome();
        } else await this.wait(2.6);
      } else if (key === 'pick' && this.choices) {
        fx.ghostPath(this.choices.map((t) => toyCentreWorld(t)), { mode: 'scan', maxDur: 2.4 });
        await this.wait(2.4);
      } else if (key === 'done' && this.sign) {
        fx.ghostPath([this.signCentre()], { mode: 'tap', maxDur: 1.8 });
        await this.wait(1.8);
      } else if (key === 'hang' && this.toy) {
        fx.ghostPath([toyCentreWorld(this.toy), this.hookToy().add(toyCentreWorld(this.toy).sub(this.toy.group.position))], { mode: 'drag', maxDur: 2.4 });
        await this.wait(2.4);
      } else await this.wait(0.2);
    } catch (e) { console.error(e); }
    this.auto = false;
    this.demoing = false;
    this.demoKey = null;
    this.idle = 0;
    this.stuck = 0;
    if (!this.dead && !this.goPending) showGo();
  }
  async toolHome() {
    const tool = this.tool;
    tool.mode = 'held';
    this.setDown();
    await this.wait(0.45);
  }
  demoPot() {
    const st = this.stepNow();
    const want = st && st.col;
    const vis = this.pots.filter((p) => p.obj.visible && p.open);
    return vis.find((p) => p.key === want) || (this.lastPot && vis.includes(this.lastPot) ? this.lastPot : vis[0]);
  }
  // a point on the toy (unit square), nudged into the asked part
  partPoint(u, v, part = this.ask ? this.ask.part : null) {
    const sh = this.toy.sh;
    let best = [u, v], bd = 1e9;
    for (let j = 0; j < 24; j++) for (let i = 0; i < 24; i++) {
      const a = (i + 0.5) / 24, b = (j + 0.5) / 24, p = partAt(sh, a, b);
      if (!p || (part && p !== part)) continue;
      const d = (a - u) ** 2 + (b - v) ** 2;
      if (d < bd) { bd = d; best = [a, b]; }
    }
    return { u: best[0], v: best[1], w: toyWorld(this.toy, best[0], best[1]) };
  }
  // a slow zigzag across the toy (or the asked part)
  zigzag(part, rows = 3) {
    const sh = this.toy.sh;
    let u0 = 1, u1 = 0, v0 = 1, v1 = 0;
    for (let j = 0; j < 24; j++) for (let i = 0; i < 24; i++) {
      const a = (i + 0.5) / 24, b = (j + 0.5) / 24, p = partAt(sh, a, b);
      if (!p || (part && p !== part)) continue;
      u0 = Math.min(u0, a); u1 = Math.max(u1, a); v0 = Math.min(v0, b); v1 = Math.max(v1, b);
    }
    const pts = [];
    for (let r = 0; r <= rows; r++) {
      const v = v1 - ((v1 - v0) * (r + 0.5)) / (rows + 1.2);
      const u = r % 2 ? u0 + (u1 - u0) * 0.22 : u0 + (u1 - u0) * 0.78;
      pts.push(this.partPoint(u, v, part));
    }
    return pts;
  }
  // a back-and-forth sweep over the whole part (or toy), row by row, about one brush width apart
  coverPath(part = null, gap = 0.12) {
    const sh = this.toy.sh, n = 48;
    const rows = [];
    const dv = gap / this.toy.S;
    for (let v = 0.98; v > 0.02; v -= dv) {
      let a = null, b = null;
      for (let i = 0; i < n; i++) {
        const u = (i + 0.5) / n, p = partAt(sh, u, v);
        if (p && (!part || p === part)) { if (a === null) a = u; b = u; }
      }
      if (a !== null) rows.push([a, b, v]);
    }
    const pts = [];
    rows.forEach(([a, b, v], i) => {
      const [u0, u1] = i % 2 ? [b, a] : [a, b];
      for (const u of [u0, u1]) pts.push({ u, v, w: toyWorld(this.toy, u, v) });
    });
    return pts;
  }
  // drive the real gesture along toy points (unit square), as a finger would (demos, autoplay)
  fakeDrag(pts, dur, { demo = false } = {}) {
    if (this.g && this.g.down && !this.g.fake) return Promise.resolve();   // her own finger is down: it wins
    return new Promise((res) => {
      const scr = pts.map((p) => { const s = project(p.w); return { x: s.x, y: s.y + this.minSide() * TIP_PX }; });
      this.g = { fake: true, id: -1, x: scr[0].x, y: scr[0].y, x0: scr[0].x, y0: scr[0].y, t0: performance.now() - 400, tStill: performance.now(), down: true, travel: 1, target: 'toy', overPot: null };
      this.pickUp();
      // sample the polyline evenly by length
      const L = [0];
      for (let i = 1; i < scr.length; i++) L.push(L[i - 1] + Math.hypot(scr[i].x - scr[i - 1].x, scr[i].y - scr[i - 1].y));
      const tot = L[L.length - 1] || 1;
      const t0 = performance.now() + 300;
      this.fakeRes = res;
      this.fake = (now) => {
        const e = Ease.inOut(clamp((now - t0) / (dur * 1000 - 300), 0, 1));
        const s = e * tot;
        let k = 1; while (k < L.length - 1 && L[k] < s) k++;
        const f = (s - L[k - 1]) / Math.max(1e-6, L[k] - L[k - 1]);
        const x = scr[k - 1].x + (scr[k].x - scr[k - 1].x) * f, y = scr[k - 1].y + (scr[k].y - scr[k - 1].y) * f;
        this.fingerTo(x, y);
        this.paintTo(x, y);
        this.g.tStill = now;
        this.lastTouch = now;
        this.idle = 0;
        if (e >= 1) {
          this.fake = null;
          this.endStroke();
          if (this.g) { this.g.down = false; this.afterGesture(this.g); }
          if (!demo || true) this.setDown();
          res();
        }
      };
    });
  }
  cancelFake() {
    this.fake = null;
    this.endStroke();
    if (this.g) this.g.down = false;
    if (this.fakeRes) { const r = this.fakeRes; this.fakeRes = null; r(); }
  }
  async fakeTap(p) {
    if (this.g && this.g.down && !this.g.fake) return;   // her own finger is down: it wins
    const s = project(p.w);
    const g = { fake: true, id: -1, x: s.x, y: s.y + this.minSide() * TIP_PX, x0: s.x, y0: s.y, t0: performance.now(), tStill: performance.now(), down: false, travel: 0, target: 'toy' };
    this.g = g;
    this.pickUp();
    await this.tapToy(g);
    this.afterGesture(g);
  }

  // ================================================================ hints
  promptText() { return this.instr || ''; }
  prompt() { const t = this.promptText(); if (t) this.say(t, { voice: false }); }
  showHint() {
    // the engine's 12 s step: the hand again (only if it hasn't just been shown)
    if (performance.now() - (this.lastDemoT || 0) < 6000) return;
    const k = this.actionKey();
    if (k) this.demo(k, false);
  }
  actionKey() {
    if (this.doneReady) return 'done';
    const sp = this.stepNow();
    if (sp && sp.spots) return 'stamp';
    switch (this.phase) {
      case 'pickToy': return 'pick';
      case 'dip': return this.tool === this.stamp ? 'stamp' : 'dip';
      case 'paint': return this.rd.teach === 'splat' && this.surface.splats < this.rd.splats ? 'splat' : this.tool === this.stamp ? 'stamp' : 'rub';
      case 'mixA': case 'mixB': return 'dish';
      case 'stir': return 'stir';
      case 'hang': return 'hang';
      default: return null;
    }
  }
  nudgeTarget() {
    if (this.doneReady && this.sign) return this.sign;
    const sp = this.stepNow();
    if (sp && sp.spots && this.tool !== this.stamp) return this.stamp.obj;
    switch (this.phase) {
      case 'dip': { const src = this.paintSource(); if (src) return src.obj; const p = this.rightPot() || this.lastPot || this.demoPot(); return p ? p.obj : null; }
      case 'mixA': case 'mixB': { const k = this.want(); if (k === 'dish') return this.dish?.obj || null; const p = this.pots.find((q) => q.key === k); return p ? p.obj : null; }
      case 'stir': return this.dish?.obj || null;
      case 'hang': return this.hook || null;
      case 'paint': return this.toy?.group || null;
      default: return null;
    }
  }
  nudge(step) {
    if (this.phase === 'pickToy' && this.choices) { this.choices.forEach((t, i) => this.s.wait(i * 0.35).then(() => this.bobThing(t.group, 1, 0.08))); return; }
    const o = this.nudgeTarget();
    if (!o) return;
    if (this.toy && o === this.toy.group) this.pulseOutline(this.ask ? this.ask.part : null);
    else if (o !== this.hook) this.bobThing(o, 2);
    if (step >= 2 && o !== this.toy?.group) { const stop = fx.halo(o, 0.55); this.s.wait(3).then(stop); }
  }
  rightPot() {
    const st = this.stepNow();
    const want = st && st.col;
    if (!want) return null;
    return this.pots.find((p) => p.key === want && p.obj.visible && p.open) || null;
  }
  makeErrorless() {
    const st = this.stepNow();
    if (this.mixing && this.level === 2) { this.mixErrorless(); return; }
    if (this.phase === 'hang') { this.demo('hang'); return; }
    if (this.phase === 'pickToy') {
      // which one? a glow on all three and the hand scans them again (never chosen for her)
      for (const t of this.choices || []) { const stop = fx.halo(t.group, 0.5); this.s.wait(3).then(stop); }
      this.demo('pick');
      return;
    }
    if (st && st.spots && this.tool !== this.stamp) this.swapTo('stamp');   // (a tool swap, not painting)
    if (st && st.col && this.level >= 1) {
      // directed: lids go onto the wrong pots, leaving only the right one open
      const right = this.rightPot();
      if (right) for (const p of this.pots) if (p !== right && p.obj.visible && p.open) this.lidOn(p);
      return;
    }
    // free: the hand shows it again and the pot she used bobs (nothing is ever painted for her)
    const k = this.actionKey();
    if (k) this.demo(k);
    const p = this.demoPot();
    if (p) this.bobThing(p.obj, 3);
  }
  async helpOnce() {
    if (this.auto || this.demoing || !this.toy) return;
    this.auto = true;
    const pot = this.demoPot();
    if (pot && (!this.tool.col || this.tool.load <= 0.1)) await this.dip(pot, true, true);
    if (this.tool === this.brush && this.tool.col) await this.fakeDrag(this.zigzag(null, 2), 2.4);
    this.auto = false;
  }
  // a soft glowing outline round the toy (or one part) that pulses once
  pulseOutline(part = null) {
    const toy = this.toy;
    if (!toy) return;
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d');
    const P = part && toy.sh.parts[part] && part !== toy.sh.rest ? toy.sh.parts[part] : toy.sh.outline;
    g.lineJoin = 'round';
    g.beginPath(); P.forEach(([u, v], i) => (i ? g.lineTo(u * 256, (1 - v) * 256) : g.moveTo(u * 256, (1 - v) * 256))); g.closePath();
    g.strokeStyle = 'rgba(255,240,170,0.55)'; g.lineWidth = 16; g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.95)'; g.lineWidth = 5; g.stroke();
    const tex = new T.CanvasTexture(c);
    tex.colorSpace = T.SRGBColorSpace;
    const m = new T.Mesh(new T.PlaneGeometry(toy.S, toy.S), new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0 }));
    m.position.copy(toyLocal(toy, 0.5, 0.5)).add(V(0, 0, 0.006));
    m.renderOrder = 3;
    toy.group.add(m);
    this.s.anim(1.3, (_, p) => { m.material.opacity = Math.sin(p * Math.PI) * 0.95; }).then(() => { toy.group.remove(m); m.geometry.dispose(); tex.dispose(); m.material.dispose(); });
  }

  // ================================================================ phase, hooks
  refreshPhase() {
    if (this.phase === 'hang' || this.phase === 'pickToy') return;
    if (!this.roundLive || this.dead) { this.phase = 'busy'; return; }
    const st = this.dish;
    if (this.level === 2 && this.mixing && st && !st.made) {
      this.phase = !st.a ? 'mixA' : !st.b ? 'mixB' : 'stir';
      return;
    }
    const tool = this.tool;
    const s2 = this.stepNow();
    if (!tool.col || (tool === this.brush ? tool.load <= 0 : tool.prints <= 0)) { this.phase = 'dip'; return; }
    if (s2 && s2.col && tool.col !== s2.col && this.level >= 1) { this.phase = 'dip'; return; }
    this.phase = 'paint';
  }
  want() {
    const st = this.stepNow();
    if (this.doneReady && this.roundLive) return 'done';
    switch (this.phase) {
      case 'hang': return 'peg';
      case 'pickToy': return this.choices && this.choices[0] ? this.choices[0].key : null;
      case 'paint':
        // (the stamp has made its spots: back to the brush to paint the rest)
        if (this.tool === this.stamp && !(st && st.spots) && (this.surface.stamps || 0) >= 3 && !this.doneOK) return 'brush';
        return 'toy';
      case 'stir': return 'dish';
      case 'mixA': case 'mixB': {
        const r = this.recipeFor(this.ask.col) || [];
        const d = this.dish;
        const need = r.find((k) => k !== d.a);
        if (this.tool.col === need && this.tool.load > 0) return 'dish';
        return need || r[0];
      }
      case 'dip': {
        if (st && st.spots && this.tool !== this.stamp) return 'stamp';
        if (this.dish && this.dish.made && this.ask && this.dish.res === this.ask.col) return 'dish';
        const right = this.rightPot();
        if (right) return right.key;
        const vis = this.pots.filter((p) => p.obj.visible && p.open);
        const prev = this.tool.col;
        return (vis.find((p) => p.key !== prev) || vis[0] || {}).key || null;
      }
      default: return null;
    }
  }
  get potsInfo() { return this.pots.map((p) => ({ key: p.key, open: p.open && p.obj.visible, obj: p.obj })); }
  coverage(part = null, col = null) { return this.surface.toy ? this.surface.coverage(part, col) : 0; }
  // do the current step as a child would, start to finish (autoplay / QA)
  async act(key) {
    if (this.auto || this.dead || this.demoing || this.toolBusy || this.dipping || (this.g && this.g.down)) return;
    if (!key) return;
    this.idle = 0;
    // (the round is already done: let the pause that ends it run)
    if (key === 'toy' && this.doneOK) return;
    this.auto = true;
    try {
      if (COLOURS[key]) {
        const pot = this.pots.find((p) => p.key === key && p.obj.visible);
        if (pot && pot.open) await this.dip(pot, true);
        else if (pot) this.wobbleLid(pot);
        // a wrong colour key (directed rounds) also paints one stroke, so the redirect can be tested
        const st = this.stepNow();
        if (this.toy && st && st.col && key !== st.col && this.tool.col === key && !this.mixing) await this.fakeDrag(this.zigzag(st.part, 1), 1.6);
      } else if (key === 'stamp' || key === 'brush') await this.swapTo(key);
      else if (key === 'dish') {
        const st = this.dish;
        if (st && st.made) await this.dipDish();
        else if (st && st.a && st.b) await this.autoStir();
        else await this.touchDish(false);
      } else if (key === 'toy') {
        const st = this.stepNow(), rd = this.rd;
        if (st && st.spots) {
          for (const ring of this.toy.sh.rings) {
            if (this.countedRings.length >= 3) break;
            if (this.stamp.prints <= 0) break;
            await this.fakeTap({ u: ring[0], v: ring[1], w: toyWorld(this.toy, ring[0], ring[1]) });
            await this.wait(0.35);
          }
        } else if (this.tool === this.stamp) {
          // dot, dot, dot: three prints spread over the toy
          for (const [u, v] of [[0.32, 0.5], [0.5, 0.42], [0.68, 0.52]]) { if (this.stamp.prints <= 0) break; await this.fakeTap(this.partPoint(u, v)); await this.wait(0.35); }
        } else if (rd.teach === 'splat' && this.surface.splats < rd.splats) {
          await this.fakeTap(this.partPoint(0.4, 0.5)); await this.wait(0.3); await this.fakeTap(this.partPoint(0.6, 0.45));
        } else if (rd.rainbow) {
          const parts = Object.keys(this.toy.sh.parts).filter((p) => this.surface.coverage(p) < 0.5);
          if (parts.length) await this.fakeDrag(this.arcPath(parts[0]), 2.2);
        } else {
          const part = st && st.part ? st.part : null;
          const P = this.coverPath(part);
          await this.fakeDrag(P, Math.min(6, 1.2 + P.length * 0.22));
        }
      } else if (key === 'done') {
        this.doneTap();
      } else if (key === 'peg') {
        if (this.hangLive) await this.carryToPeg();
      } else if (this.phase === 'pickToy') {
        const t = (this.choices || []).find((c) => c.key === key);
        if (t) await this.choose(t);
      }
    } catch (e) { console.error('paint act', e); }
    this.auto = false;
  }
  arcPath(part) {
    const P = this.toy.sh.parts[part];
    const pts = [];
    // follow the band's own middle (rainbow)
    const sh = this.toy.sh;
    const keys = Object.keys(sh.parts);
    const b = keys.indexOf(part);
    const cx = 0.5;
    let vmin = 1;
    for (const p of sh.outline) vmin = Math.min(vmin, p[1]);
    const R1 = 0.65 / sh.S, R0 = 0.17 / sh.S, w = (R1 - R0) / 4, r = R1 - w * (b + 0.5);
    const cy = vmin + 0.0;
    void P;
    for (let i = 0; i <= 8; i++) { const a = Math.PI * (0.06 + 0.88 * i / 8); const u = cx + Math.cos(a) * r, v = cy + Math.sin(a) * r; pts.push({ u, v, w: toyWorld(this.toy, u, v) }); }
    return pts;
  }
  async autoStir() {
    const st = this.dish;
    if (!st || !st.b) return;
    while (!st.made && !this.dead) {
      if (st.ready) { this.revealMix(); break; }
      await this.stirTap();
      await this.wait(0.05);
    }
  }

  // ================================================================ every frame
  update(dt, t) {
    if (this.fake) this.fake(performance.now());
    if (this.canAct()) {
      const now = performance.now();
      if (this.roundStartT && !this.readyLogged) { this.readyLogged = true; console.log('PAINT_READY L' + (this.level + 1) + ' r' + (this.round + 1), Math.round(now - this.roundStartT), 'ms after round start', this.pegT ? Math.round(now - this.pegT) + ' ms after the last toy was hung' : ''); this.pegT = 0; }
      if (this.stepT) { console.log('PAINT_STEP L' + (this.level + 1) + ' r' + (this.round + 1), Math.round(now - this.stepT), 'ms'); this.stepT = 0; }
    }
    this.updateTools(dt);
    this.updateStir(dt);
    this.surface.flush();
    this.refreshPhase();
    this.updateDone(dt);
    // the last-used pot bobs slowly while the brush is empty (0.06 up and down, 1.6 s)
    for (const p of this.pots) {
      const want = (this.bobPot === p && this.phase === 'dip') || (this.rightPotBob && this.rightPot() === p && this.phase === 'dip');
      p.bob = want ? p.bob + dt : 0;
      if (p.home && !p.obj.userData._bob && this.roundLive) p.obj.position.y = want ? Math.abs(Math.sin((p.bob / 1.6) * Math.PI)) * 0.06 : 0;
    }
    if (this.bobDish && this.dish && this.phase === 'dip' && this.paintSource() && !this.dish.obj.userData._bob) this.bobThing(this.dish.obj, 1, 0.04);
    if (this.phase !== 'dip') this.bobDish = false;
    // stuck: the hand shows the needed action again after 8 s without it
    const waiting = (this.roundLive || this.hangLive) && !this.demoing && !this.auto && !this.toolBusy && !(this.g && this.g.down) && this.phase !== 'busy';
    if (waiting) {
      this.stuck = (this.stuck || 0) + dt;
      if (this.stuck > STUCK) {
        this.stuck = -4;
        const k = this.actionKey();
        if (k) this.demo(k, false);
      }
    }
    if (this.hangLive && this.hook && !this.toyDrag?.dragging) {
      // the hook sways a little on its cord
      this.hook.rotation.z = Math.sin(t * 1.6) * 0.03;
    }
  }

  // ================================================================ the finale: the wall of eight
  onFinale() {
    for (const tool of [this.brush, this.stamp]) { tool.mode = 'block'; if (tool.obj.visible) this.toolGlide(tool, this.blockPose(tool), 0.6, Ease.inOut, 0.2); }
    // Pip goes to the left end of the table and turns to face the wall
    const pip = this.pip;
    const end = V(-2.6, 0, -0.9);
    (async () => {
      if (pip.position.y > 0.01) {
        // down off the stool, then round behind the easel (never through it)
        await this.arc(pip, V(pip.position.x, 0, -1.35), 0.7, 0.45);
        await this.walk(pip, V(end.x, 0, -1.35), 1.8);
      }
      await this.walk(pip, end, 1.6);
      await this.turnTo(pip, Math.PI * 0.85, 0.5);
    })();
    // friends who sat for their portraits come back and stand at the right end of the table, facing the wall
    this.sat.forEach((f, i) => {
      if (f.visible && f === this.friend) { this.walk(f, V(this.L.easel.x + 1.45 + (i % 2) * 0.85, 0, -1.12 + Math.floor(i / 2) * 0.55)).then(() => this.turnTo(f, Math.PI * 0.9)); return; }
      (async () => {
        await this.wait(i * 0.6);
        await this.friendArrive(f, V(this.L.easel.x + 1.45 + (i % 2) * 0.85, 0, -1.12 + Math.floor(i / 2) * 0.55));
        await this.turnTo(f, Math.PI * 0.9);
      })();
    });
  }
  creationObjects() { return this.hung.map((t) => t.group); }
  onAdmirePoke(obj, i, n) {
    const t = obj;
    // it presses in against the wall and springs back, and sounds its note
    this.s.anim(0.25, (_, p) => { const k = Math.sin(p * Math.PI) * 0.06; t.scale.set(1 - k * 0.4, 1 - k * 0.4, 1 - k); }).then(() => t.scale.set(1, 1, 1));
    sfx.step(i, n);
    const toy = this.hung[i];
    const f = toy && toy.who;
    const now = performance.now();
    if (f && f.visible && now - (this.callT || 0) > 1500) {
      this.callT = now;
      if (f.userData.head) { const h = f.userData.head, y0 = h.rotation.y; this.s.anim(0.6, (_, p) => { h.rotation.y = y0 + Math.sin(p * Math.PI) * 0.4; }).then(() => { h.rotation.y = y0; }); }
      const c = CALL[f.userData.who];
      if (c) sfx[c]();
    }
  }
}

// ---------------------------------------------------------------- small helpers
const _ray = new T.Raycaster();
function screenRay(x, y) {
  _ray.setFromCamera({ x: (x / innerWidth) * 2 - 1, y: -(y / innerHeight) * 2 + 1 }, camera);
  return _ray.ray.clone();
}
function rayPlane(x, y, n, o) {
  const r = screenRay(x, y);
  return r.intersectPlane(new T.Plane().setFromNormalAndCoplanarPoint(n, o), V());
}
