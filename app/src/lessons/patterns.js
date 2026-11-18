// Game 6 — Pattern parade. Topics mt_ZjIFGc6zPW "Finding the repeating unit" and mt_WXW0hjNhph "Patterns & sequences".
// A parade of beach things stands in a row and plays its pattern as a little tune (shell, star, shell, star…);
// the child drags (or taps) the thing that comes next (or the one that's missing) into the empty spot.
// Each level has its own stage: Level 1 a boardwalk where the things pop onto the planks one per beat (the leader
// waits at the head of the parade all level), Level 2 a toy train where each thing rides in its own wagon, Level 3
// striped circus podiums that rise out of the sand and catch the things Gull throws.
// The child's work stays: every finished parade hops to the back of the beach (small) and waits there, singing when
// poked, so the level ends with all six parades on the beach ("Look what you made!" frames them all).
// Captions are words only (no emoji): "Shell, star, shell, star, ...?"; voiced lines are the short instructions.
import * as T from '../three.js';
import { Lesson, shuffle } from '../engine/lesson.js';
import { geo, blobShadow } from '../engine/toon.js';
import { hop } from '../engine/actors.js';
import { makeCrab, makeBucket, makeBeachBall, makeShell, makeSeaStar, makeDuck, makeGull } from '../engine/beach.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';
import { project, setCamera } from '../engine/stage.js';
import { makeBoardwalk, makeTrack, makeCart, makeEngine, makePodium, makeChoiceTowel, makeParadeFlag } from './patterns-stage.js';

const NOTE = { shell: 0, star: 2, crab: 4, ball: 5, bucket: 7 };
// NAME: spoken names (voiced lines); SAY: the short chant words for the caption-only pattern lines
const NAME = { shell: 'shell', star: 'starfish', crab: 'crab', ball: 'beach ball', bucket: 'bucket' };
const SAY = { shell: 'shell', star: 'star', crab: 'crab', ball: 'ball', bucket: 'bucket' };
const ROW_Y = 2.25, ROW_Z = -1.2, TOWEL_Z = 3.7, CHOICE_S = 1.15, BEAT = 0.4;
// crab body scale per stage: the walk stage has 1.7-wide slots; a wagon is 1.3 wide inside; a podium top 1.25
const CRAB_S = { walk: 0.46, train: 0.34, podium: 0.36 };
// the finished parades wait at the back of the beach, small, in two rows of three
const BACK_S = 0.55, BACK_SP = 0.85;
const BACK = [[-4.7, -3.7], [0.5, -3.7], [5.7, -3.7], [-4.7, -5.2], [0.5, -5.2], [5.7, -5.2]];
// for the finale photo the waiting parades hop forward onto the open sand in front of the stage (behind the stage
// they are hidden by it from any camera in front)
const FRONT = [[-3.0, 0.9], [3.1, 0.9], [-3.0, 2.4], [3.1, 2.4], [0.05, 3.9]];
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// One look per round so no two parades feel the same: towel stripes, item colours and (on the train) the driver.
const THEMES = [
  { towel: 0x4ab0ff, bucket: 0x4a90ff, shell: 0xff9ec0, star: 0xff9f3f, crab: 0xff5a4a, ball: [0xff5a5a, 0xffd23f, 0x4a90ff], leader: 'duck', flag: 0xff5a5a },
  { towel: 0xff7a9c, bucket: 0x5fd068, shell: 0xffd0a0, star: 0xff6f9c, crab: 0xff7a3a, ball: [0xa77bff, 0x5fd068, 0xff9f3f], leader: 'gull', flag: 0xffd23f },
  { towel: 0x5fd068, bucket: 0xff5a5a, shell: 0xc9a7ff, star: 0xffc23f, crab: 0xff5a4a, ball: [0x4a90ff, 0xff8fc0, 0xffd23f], leader: 'duck', flag: 0x4a90ff },
  { towel: 0xffb020, bucket: 0xa77bff, shell: 0xff9ec0, star: 0xff9f3f, crab: 0xff6a5a, ball: [0xff5a5a, 0x5fd068, 0x4a90ff], leader: 'gull', flag: 0x5fd068 },
  { towel: 0xa77bff, bucket: 0xffb020, shell: 0xa8e0ff, star: 0xff7a5c, crab: 0xff5a4a, ball: [0xffd23f, 0x4a90ff, 0xff8fc0], leader: 'duck', flag: 0xff8fc0 },
  { towel: 0xff5a5a, bucket: 0x4ab0ff, shell: 0xffe08a, star: 0xffa53f, crab: 0xff7a3a, ball: [0x5fd068, 0xff5a5a, 0xa77bff], leader: 'gull', flag: 0xa77bff },
];
// wagons are cream and teal: never the colour of the bucket riding in them
const WAGON = [0xfff0d2, 0x7fd8e0];

// The "?" over the empty slot: a crisp round badge (white disc, ink rim, bold coral "?" in the app's rounded font),
// drawn once to a canvas and shown as a sprite, so it reads clearly on every stage, day or night.
let qTex = null;
function questionBadge() {
  if (!qTex) {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const x = c.getContext('2d');
    x.beginPath(); x.arc(128, 128, 112, 0, Math.PI * 2);
    x.fillStyle = '#ffffff'; x.fill();
    x.lineWidth = 14; x.strokeStyle = '#2a2440'; x.stroke();
    x.fillStyle = '#ff5a5a';
    x.font = '800 180px "Baloo 2", "Arial Rounded MT Bold", "Nunito", system-ui, sans-serif';
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText('?', 128, 140);
    qTex = new T.CanvasTexture(c);
    qTex.colorSpace = T.SRGBColorSpace;
    qTex.userData.shared = true;   // kept across plays (disposeTree skips shared textures)
  }
  const sp = new T.Sprite(new T.SpriteMaterial({ map: qTex, depthWrite: false }));
  sp.scale.setScalar(0.85);
  return sp;
}

// A pattern thing. Its group origin is exactly where its bottom rests (measured from the model's own bounds), so it
// sits on planks, wagon floors and podium tops without hovering or sinking. A soft contact shadow sits under it.
function makeItem(kind, th, stage) {
  const g = new T.Group();
  let m;
  if (kind === 'shell') { m = makeShell(th.shell, 1.15); m.rotation.x = 1.1; }
  else if (kind === 'star') m = makeSeaStar(th.star, 0.55);
  else if (kind === 'crab') { m = makeCrab(th.crab); m.scale.setScalar(CRAB_S[stage]); }
  else if (kind === 'ball') m = makeBeachBall(0.48, th.ball);
  else m = makeBucket(th.bucket, 0.42, 0.6);
  if (kind !== 'crab') {   // (the crab stands on its own feet at y = 0)
    m.updateMatrixWorld(true);
    const box = new T.Box3().setFromObject(m);
    if (!box.isEmpty()) m.position.y -= box.min.y - 0.01;
  }
  g.add(m);
  const sh = blobShadow(kind === 'crab' ? 0.55 : 0.4);
  sh.material = sh.material.clone();
  g.add(sh);
  g.userData.kind = kind;
  g.userData.inner = m;
  g.userData.shadow = sh;
  return g;
}
const setShadow = (o, v) => { if (o.userData.shadow) o.userData.shadow.visible = v; };

// The parade leader holds a little flag planted beside it (never through its body).
function makeLeader(kind, flagCol) {
  const g = new T.Group();
  const bird = kind === 'duck' ? makeDuck(0.7) : makeGull();
  if (kind === 'gull') bird.scale.setScalar(0.6);
  bird.rotation.y = Math.PI / 2 - 0.35; // faces the way the parade marches
  g.add(bird);
  const flag = makeParadeFlag(flagCol);
  flag.position.set(-0.55, 0, -0.45);   // behind and beside the bird: the pole stands clear of wing and body
  g.add(flag);
  g.userData.flag = flag;
  g.userData.bird = bird;
  return g;
}

// The smallest repeating unit of a sequence (for the "listen again" replay after a wrong tap).
function period(seq) {
  for (let p = 1; p < seq.length; p++) if (seq.every((k, i) => i < p || k === seq[i - p])) return p;
  return seq.length;
}

// Level tables: seq is the full pattern; gap is the index the child fills (default: the last one).
// Level 3 meets the missing-middle pattern in round 5, so she has one more round after it.
const PLANS = [
  [
    { seq: ['shell', 'star', 'shell', 'star', 'shell'], choices: ['shell', 'star'] },
    { seq: ['crab', 'ball', 'crab', 'ball', 'crab'], choices: ['crab', 'ball'] },
    { seq: ['star', 'shell', 'star', 'shell', 'star', 'shell'], choices: ['shell', 'star'] },
    { seq: ['bucket', 'crab', 'bucket', 'crab', 'bucket'], choices: ['bucket', 'crab'] },
    { seq: ['ball', 'shell', 'ball', 'shell', 'ball', 'shell'], choices: ['shell', 'ball'] },
    { seq: ['shell', 'crab', 'shell', 'crab', 'shell'], choices: ['shell', 'crab'] },
  ],
  [
    { seq: ['shell', 'star', 'shell', 'star', 'shell', 'star'], choices: ['star', 'shell', 'crab'] },
    { seq: ['crab', 'bucket', 'crab', 'bucket', 'crab'], choices: ['crab', 'bucket', 'ball'] },
    { seq: ['ball', 'star', 'ball', 'star', 'ball', 'star'], choices: ['star', 'ball', 'shell'] },
    { seq: ['shell', 'crab', 'shell', 'crab', 'shell'], choices: ['shell', 'crab', 'bucket'] },
    { seq: ['star', 'star', 'crab', 'star', 'star', 'crab'], choices: ['crab', 'star', 'ball'] },
    { seq: ['bucket', 'ball', 'ball', 'bucket', 'ball', 'ball'], choices: ['ball', 'bucket', 'shell'] },
  ],
  [
    { seq: ['shell', 'shell', 'star', 'shell', 'shell', 'star'], choices: ['star', 'shell', 'crab'] },
    { seq: ['crab', 'ball', 'ball', 'crab', 'ball', 'ball'], choices: ['ball', 'crab', 'star'] },
    { seq: ['shell', 'star', 'crab', 'shell', 'star', 'crab'], choices: ['crab', 'shell', 'star'] },
    { seq: ['bucket', 'bucket', 'ball', 'bucket', 'bucket', 'ball', 'bucket'], choices: ['bucket', 'ball', 'crab'] },
    { seq: ['star', 'crab', 'star', 'crab', 'star', 'crab'], gap: 1, choices: ['crab', 'star', 'bucket'] },
    { seq: ['ball', 'crab', 'shell', 'ball', 'crab', 'shell', 'ball'], choices: ['ball', 'crab', 'shell'] },
  ],
];

const STAGE = ['walk', 'train', 'podium'];
const TOWEL_COLS = [null, 0xffb020, 0xa77bff];
const LEADER = { walk: ['duck', 0xff5a5a], podium: ['gull', 0xffd23f] };   // one leader stays all level

export default class PatternsLesson extends Lesson {
  build() {
    setCamera(new T.Vector3(0, 3.2, 12.4), new T.Vector3(0, 1.95, 0));
    this.pip.position.set(-5.3, 0, 0.6);   // in front of the stage's left end, whole on screen
    this.plan = PLANS[this.level];
    this.stage = STAGE[this.level];
    if (this.stage === 'walk') { this.walk = makeBoardwalk(ROW_Y, ROW_Z); this.walk.scale.x = 12 / 13; this.root.add(this.walk); }
    else if (this.stage === 'train') { const tr = makeTrack(ROW_Y, ROW_Z); tr.scale.x = 0.93; this.root.add(tr); }
    // striped towel holding the choices (its colour changes every round)
    const towel = makeChoiceTowel(7, 1.8);
    towel.position.set(0, 0.045, TOWEL_Z);   // just above the sand's little ripples
    this.root.add(towel);
    this.towel = towel;
    this.row = [];
    this.choices = [];
    this.bases = [];     // per-slot wagons / podiums (levels 2 and 3)
    this.kept = [];      // every finished parade's things, waiting at the back of the beach
    this.keptLines = []; // the same, one array per finished parade
    this.lines = 0;      // finished parades so far
    this.leader = null;
    if (LEADER[this.stage]) {   // the leader waits at the head of the parade all level (no long walks in and out)
      const [kind, col] = LEADER[this.stage];
      this.leader = makeLeader(kind, col);
      this.leader.visible = false;
      this.root.add(this.leader);
    }
    this.tidyScenery();
    // the first train is already standing on the track when the game opens
    if (this.stage === 'train') { const items = this.makeRowItems(0); this.next = { r: 0, items, train: this.rollIn(items, 0, { instant: true }) }; }
  }

  // scenery that read as part of the parade: the low sunset sun behind a wagon, a sailboat behind the empty wagon,
  // glowing jellyfish hovering between the podiums
  tidyScenery() {
    const g = this.meadow;
    if (!g) return;
    for (const o of g.children) {
      const p = o.position;
      if (this.stage === 'train') {
        if (Math.abs(p.z + 48) < 0.5 && Math.abs(p.x + 4) < 0.5) p.y += 4.2;     // the big low sun rises clear of the train
        if (Math.abs(p.z + 24) < 0.5 && Math.abs(p.x - 8.5) < 0.5) p.x = 17;     // the near sailboat sails out of the way
      }
      if (this.stage === 'walk' && Math.abs(p.z + 44) < 0.5 && Math.abs(p.x + 23) < 0.5) p.x = -13;   // the sun out from behind the palm fronds
      // the far islet and its little palm sat right behind the leader (it seemed to stand on a sand heap, the flag
      // merged with the palm): they move out to the right edge of the sea
      if (this.stage === 'walk' && Math.abs(p.z + 30) < 0.5 && Math.abs(p.x - 13) < 0.5) p.x = 25;
      if (this.stage === 'podium' && Math.abs(p.y - 0.35) < 0.01 && p.z < -9 && p.z > -18 && Math.abs(p.x) < 6) o.visible = false;   // jellyfish
    }
  }

  nudgeTarget() { return this.choices.find((x) => x.userData.kind === this.answer() && x.parent) || null; }
  answer() { const p = this.plan[this.round]; return p.seq[p.gap ?? p.seq.length - 1]; }
  gapIndex() { const p = this.plan[this.round]; return p.gap ?? p.seq.length - 1; }

  slotX(i, n) { const sp = Math.min(1.7, 11.5 / n); return (i - (n - 1) / 2) * sp; }
  // where a thing stands (world y): on the planks, on its wagon's floor, or on its podium
  surfY() { return ROW_Y + (this.stage === 'train' ? 0.25 : 0); }   // train: the wagon floor (wagons ride at ROW_Y - 0.2, floor at 0.45)
  // a thing's size in the row (the walk stage has room for bigger things; the crab is already big)
  rowScale(kind) { return this.stage === 'walk' && kind !== 'crab' ? 1.15 : 1; }
  choiceScale(kind) { return CHOICE_S * (kind === 'crab' ? CRAB_S.walk / CRAB_S[this.stage] : 1); }

  // Grab area that matches what you see: measured from the item's own bounds at its towel size.
  measure(c) {
    const s0 = c.scale.x;
    c.scale.setScalar(c.userData.baseScale);
    c.updateMatrixWorld(true);
    const box = new T.Box3().setFromObject(c.userData.inner);
    c.scale.setScalar(s0);
    const centre = box.getCenter(new T.Vector3());
    const size = box.getSize(new T.Vector3());
    c.userData.hitOffset = centre.sub(c.position);
    return { radius: (Math.max(size.x, size.y) / 2) * 0.9, offset: c.userData.hitOffset };
  }
  hitPoint(c) { return c.position.clone().add(c.userData.hitOffset || new T.Vector3(0, 0.5, 0)); }
  gapPoint() { return this.slotPos.clone().add(new T.Vector3(0, 0.6, 0)); }

  clearChoices() {
    for (const c of this.choices) { if (c.userData.drag) input.remove(c.userData.drag); c.userData.drag = null; }
  }

  // An arc from where it is to `to` (no physics: lands exactly, every time). Calm: about walking pace.
  // `to` may be a function (a target that is still moving: a wagon rolling in, a podium rising)
  async hopTo(o, to, dur = 0.6, apex = 0.8) {
    const at = typeof to === 'function' ? to : () => to;
    const from = o.position.clone();
    const t0 = at();
    const top = Math.max(0, Math.max(from.y, t0.y) + apex - (from.y + t0.y) / 2);
    setShadow(o, false);
    await this.s.anim(dur, (_, t) => {
      const e = Ease.inOut(t), q = at();
      o.position.set(from.x + (q.x - from.x) * e, from.y + (q.y - from.y) * t + 4 * top * t * (1 - t), from.z + (q.z - from.z) * e);
    });
    if (this.dead) return;
    o.position.copy(at());
    setShadow(o, true);
  }
  // a gentle grow (no elastic boing)
  grow(o, scale, dur = 0.4) {
    o.scale.setScalar(0.001);
    o.visible = true;
    return this.s.anim(dur, (_, p) => o.scale.setScalar(Math.max(0.001, scale * Ease.back(p))));
  }
  squash(o, amt = 0.12, dur = 0.22) {
    const s0 = o.scale.x;
    return this.s.anim(dur, (_, p) => { const k = 1 - Math.sin(p * Math.PI) * amt; o.scale.set(s0 / Math.sqrt(k), s0 * k, s0 / Math.sqrt(k)); }).then(() => o.scale.setScalar(s0));
  }

  async startRound(r) {
    this.busy = true;
    const p = this.plan[r];
    const th = THEMES[r % THEMES.length];
    const gap = this.gapIndex();
    this.clearChoices();
    for (const o of this.choices) this.root.remove(o);
    for (const o of this.row) if (!o.userData.kept) this.root.remove(o);
    for (const b of this.bases) if (!b.userData.leaving) this.root.remove(b);
    if (this.marker) this.root.remove(this.marker);
    this.row = []; this.choices = []; this.bases = [];
    this.towel.userData.setColor(TOWEL_COLS[this.level] && r % 2 ? TOWEL_COLS[this.level] : th.towel);
    const n = p.seq.length;
    const SY = this.surfY();
    // the empty slot: a pulsing ring (dark rim, so it reads on the planks) with a question mark
    const marker = new T.Group();
    const rim = new T.Mesh(geo.ring(0.5, 0.78, 32), new T.MeshBasicMaterial({ color: 0x2a2440 }));
    const ring = new T.Mesh(geo.ring(0.56, 0.72, 32), new T.MeshBasicMaterial({ color: 0xffffff }));
    for (const m of [rim, ring]) m.rotation.x = -Math.PI / 2;
    rim.position.y = SY + 0.015; ring.position.y = SY + 0.025;
    const q = new T.Group();
    q.add(questionBadge());
    marker.add(rim, ring, q);
    marker.position.set(this.slotX(gap, n), 0, ROW_Z);
    marker.userData = { q, ring, rim, pulse: 0, near: 0, qy: SY + 1.0 };
    marker.visible = false;
    this.root.add(marker);
    this.marker = marker;
    this.slotPos = new T.Vector3(this.slotX(gap, n), SY, ROW_Z);

    // caption only: the pattern in words, so a grown-up can chant it ("Shell, star, shell, star, ...?")
    this.say(cap(p.seq.map((k, i) => (i === gap ? '...?' : SAY[k])).join(', ')), { voice: false });

    // (on the train stage the next train may already be rolling in behind the last one)
    const pre = this.next && this.next.r === r ? this.next : null;
    this.next = null;
    const items = pre ? pre.items : this.makeRowItems(r);
    this.row = items;

    // Rule 0: the "?" and the choices are there at once and take touches at once; the parade pops on / rolls in /
    // rises underneath and sings as it comes. place() waits for it before the finished tune.
    const ringNow = this.stage === 'walk' || (pre && this.stage === 'train' && pre.train.done);
    marker.visible = true;
    rim.visible = ring.visible = !!ringNow;   // the ring lies on the surface: shown once its wagon / podium is there
    const showRing = () => { if (marker.parent) { rim.visible = ring.visible = true; } };
    this.grow(marker, 1, 0.3);
    this.makeChoices(p, th);
    let arrive;
    this.arrived = false;
    this.arrClock = 0; this.hurry = false;   // the arrival's own clock: runs 5x if she answers before it is done
    this.gapTarget = () => this.slotPos;   // where the answer lands (a moving wagon / rising podium while arriving)
    this.raiseGap = null;
    if (this.stage === 'walk') arrive = this.arriveWalk(items, n);
    else if (this.stage === 'train') {
      const tr = pre ? pre.train : this.rollIn(items, r);
      this.bases = tr.carts; this.engine = tr.eng; this.train = tr;
      const cart = tr.carts[gap];
      this.gapTarget = () => new T.Vector3(cart.position.x, cart.position.y + 0.45, ROW_Z);
      arrive = tr.arrived.then(() => { showRing(); return this.dead ? null : this.trainTune(items, n); });
    } else arrive = this.arrivePodiums(items, n, th, showRing);
    this.arrival = arrive.then(() => { this.arrived = true; });
    this.busy = false;
    if (window.__qa) console.log('QA round-ready', this.level, r, Math.round(performance.now() - this.cur.t0), 'since-answer', this.qaAct ? Math.round(performance.now() - this.qaAct) : -1);
    // the instruction now; the hand demo (and, for a missing-middle pattern, the hand on the "?") once the row is all
    // there, so the hand never points at a half-built parade
    this.prompt();
    this.arrival.then(() => {
      if (this.dead || this.busy || this.round !== r) return;
      if (p.gap !== undefined && p.gap < n - 1) fx.ghostPath([this.gapPoint()], { mode: 'tap', maxDur: 1.2 });
      if (!this.demoDone) { this.demoDone = true; this.playDemo(); }
    });
  }

  makeRowItems(r) {
    const p = this.plan[r], th = THEMES[r % THEMES.length], n = p.seq.length, gap = p.gap ?? n - 1;
    const items = [];
    for (let i = 0; i < n; i++) {
      if (i === gap) continue;
      const it = makeItem(p.seq[i], th, this.stage);
      it.userData.slot = i;
      it.userData.hx = this.slotX(i, n);
      it.userData.baseScale = this.rowScale(p.seq[i]);
      it.visible = false;   // nothing shows until it is in place (no heap at the world origin)
      this.root.add(it);
      items.push(it);
    }
    return items;
  }

  makeChoices(p, th) {
    const xs = p.choices.length === 2 ? [-2.2, 2.2] : [-2.2, 0, 2.2];   // on the towel's white stripes
    shuffle(p.choices).forEach((k, i) => {
      const c = makeItem(k, th, this.stage);
      c.position.set(xs[i], 0.06, TOWEL_Z);
      c.userData.baseScale = this.choiceScale(k);
      c.visible = false;
      this.root.add(c);
      this.choices.push(c);
      const { radius, offset } = this.measure(c);
      c.userData.drag = input.addDrag(c, {
        radius, offset, minY: 0.06,
        zones: () => (this.marker && this.marker.visible && !this.busy ? [{ pos: this.gapPoint(), radius: 1.0, obj: this.marker, onNear: (kk) => { this.marker.userData.near = kk; } }] : []),
        onPick: () => setShadow(c, false),
        onDrop: (z, info) => this.dropChoice(c, z, info),
      });
      this.s.wait(i * 0.12).then(() => { if (c.parent && !c.userData.gone) this.grow(c, c.userData.baseScale, 0.35); });
    });
  }

  // Level 1: the leader waits at the head of the parade; the things pop onto the planks one per beat, each singing
  // its note as it lands (that is the tune), and the empty spot gives a soft tick.
  async arriveWalk(items, n) {
    await this.placeLeader(new T.Vector3(this.slotX(n - 1, n) + 2.0, ROW_Y, ROW_Z));
    const beat = 0.3;
    const lands = [];
    for (let i = 0; i < n; i++) {
      const it = items.find((o) => o.userData.slot === i);
      const t0 = (this.lines ? 0.5 : 0.15) + i * beat;   // (after the first round: the last parade is hopping off)
      if (!it) { this.at(t0 + 0.3).then(() => { sfx.tick(); this.pulseMarker(); }); continue; }
      lands.push(this.at(t0).then(async () => {
        if (this.dead) return;
        it.position.set(it.userData.hx, ROW_Y + 0.9, ROW_Z);
        this.grow(it, it.userData.baseScale, this.hurry ? 0.12 : 0.25);
        setShadow(it, false);
        await this.s.anim(this.hurry ? 0.15 : 0.3, (_, t) => { it.position.y = ROW_Y + 0.9 * (1 - t * t); });
        it.position.y = ROW_Y;
        setShadow(it, true);
        sfx.note(NOTE[it.userData.kind]);
        this.squash(it, 0.1, 0.18);
      }));
    }
    await Promise.all(lands);
  }

  // The level's one leader: shown at its spot at the first round, then it walks along the planks / sand to the new
  // head of the parade when a round is longer or shorter.
  async placeLeader(at) {
    const L = this.leader;
    if (!L) return;
    if (!L.visible) { L.position.copy(at); this.grow(L, 1, 0.4); if (LEADER[this.stage][0] === 'duck') sfx.quack(); else sfx.gull(); return; }
    if (L.position.distanceTo(at) > 0.05) this.s.tween(L.position, { x: at.x, y: at.y, z: at.z }, Math.max(0.4, L.position.distanceTo(at) / 2.2), Ease.inOut);
  }

  // Level 2: the train rolls in with every thing riding in its own wagon (from round 2 on it rolls in right behind
  // the last train while that one leaves). Returns { carts, eng, arrived }.
  rollIn(items, r, { instant = false } = {}) {
    const p = this.plan[r], th = THEMES[r % THEMES.length], n = p.seq.length;
    const sp = Math.min(1.7, 11.5 / n);
    const carts = [];
    const D = 15, dur = 3.0, Y = ROW_Y - 0.2;   // under 15 units/s even at its fastest
    for (let i = 0; i < n; i++) {
      const c = makeCart(WAGON[i % 2]);
      c.userData.hx = this.slotX(i, n);
      c.userData.slot = i;
      c.position.set(c.userData.hx - D, Y, ROW_Z);   // placed before it is added: never a frame at the origin
      this.root.add(c);
      carts.push(c);
    }
    const eng = makeEngine(th.towel);
    eng.userData.hx = this.slotX(n - 1, n) + sp * 0.5 + 0.95;
    eng.position.set(eng.userData.hx - D, Y, ROW_Z);
    this.root.add(eng);
    carts.push(eng);
    // the driver sits up in the cab
    const driver = makeLeader(th.leader, th.flag);
    driver.userData.flag.parent.remove(driver.userData.flag);
    driver.userData.bird.scale.multiplyScalar(0.62);
    driver.userData.bird.rotation.y = 0.35;
    driver.position.copy(eng.userData.seat).add(new T.Vector3(0.05, 0.12, 0.08));
    eng.add(driver);
    const riders = items.map((it) => ({ it, cart: carts[it.userData.slot] }));
    for (const { it } of riders) { it.scale.setScalar(it.userData.baseScale); it.visible = true; }
    const place = () => { for (const { it, cart } of riders) if (!it.userData.hopping2) it.position.set(cart.position.x, cart.position.y + 0.45, ROW_Z); };
    place();
    const roll = (e) => {
      for (const c of carts) { c.position.x = c.userData.hx - D * (1 - e); c.userData.spin?.(-e * 30); }
      place();
      eng.userData.chimney.scale.y = 1 + Math.abs(Math.sin(e * 30)) * 0.3 * (1 - e);
    };
    if (instant) { roll(1); return { carts, eng, arrived: Promise.resolve(), done: true }; }   // the first train is already waiting
    const tr = { carts, eng, done: false, riders };
    tr.arrived = this.s.anim(dur, roll, Ease.inOut).then(() => { tr.done = true; });
    return tr;
  }
  // as it stops: left to right, each wagon bumps and its thing sings (the empty wagon ticks)
  async trainTune(items, n) {
    const carts = this.bases;
    for (let i = 0; i < n; i++) {
      if (this.dead) return;
      hop(this.s, carts[i], 0.08, 0.25);
      const it = items.find((o) => o.userData.slot === i);
      if (it) { sfx.note(NOTE[it.userData.kind]); hop(this.s, it, 0.35, 0.28); } else { sfx.tick(); this.pulseMarker(); }
      await this.wait(this.hurry ? 0.06 : 0.28);
    }
  }

  // Level 3: the podiums rise out of the sand one per beat, left to right, each carrying its thing up like a little
  // stage lift; each sings its note as it arrives (the empty podium ticks). Gull, who waits beside the row all level,
  // bobs along to the tune. About 2-2.4 s in all.
  async arrivePodiums(items, n, th, showRing = () => {}) {
    const cols = [th.towel, th.flag, th.bucket];
    const hx = this.slotX(n - 1, n) + 1.75;
    await this.placeLeader(new T.Vector3(hx, 0, ROW_Z + 1.6));
    const DOWN = -ROW_Y - 0.15, beat = 0.3, D0 = this.lines ? 0.75 : 0.15;   // (the last podiums sink first)
    const rises = [];
    const rise = (pd, it, dur) => this.s.anim(dur, (e) => { const y0 = pd.userData.y0; pd.position.y = y0 * (1 - e); if (it) it.position.y = ROW_Y + y0 * (1 - e); }, Ease.inOut);
    for (let i = 0; i < n; i++) {
      const pd = makePodium(cols[i % 3], ROW_Y);
      pd.position.set(this.slotX(i, n), DOWN, ROW_Z);   // under the sand; it rises up
      this.root.add(pd);
      this.bases.push(pd);
      const it = items.find((o) => o.userData.slot === i);
      if (it) { it.scale.setScalar(it.userData.baseScale); it.position.set(it.userData.hx, DOWN + ROW_Y, ROW_Z); setShadow(it, false); }
      if (!it) {   // she answered before this podium came up: it rises at once to catch her piece
        this.raiseGap = () => { if (pd.userData.risen) return; pd.userData.risen = true; pd.userData.y0 = pd.position.y; rise(pd, null, 0.35).then(() => showRing()); };
        this.gapTarget = () => new T.Vector3(pd.position.x, pd.position.y + ROW_Y, ROW_Z);
      }
      rises.push(this.at(D0 + i * beat).then(async () => {
        if (this.dead || pd.userData.risen) return;
        pd.userData.risen = true;
        pd.userData.y0 = DOWN;
        if (it) it.visible = true;
        await rise(pd, it, this.hurry ? 0.4 : 0.45);
        pd.position.y = 0;
        if (this.leader && i % 2 === 0) hop(this.s, this.leader, 0.15, 0.25);
        if (it) { it.position.y = ROW_Y; setShadow(it, true); sfx.note(NOTE[it.userData.kind]); this.squash(it, 0.1, 0.18); }
        else { sfx.tick(); showRing(); this.pulseMarker(); }
      }));
    }
    await Promise.all(rises);
  }

  // Play the parade as a tune: each thing hops and sings its note in turn. null = the empty slot ("what?").
  async playTune(list, beat = BEAT, { big = null } = {}) {
    for (const o of list) {
      if (this.dead) return;
      if (o) {
        sfx.note(NOTE[o.userData.kind]);
        hop(this.s, o, o === big ? 0.6 : 0.35, Math.max(0.24, beat * 1.3));
      } else if (this.marker) {
        sfx.tick();
        this.pulseMarker();
      }
      await this.wait(beat);
    }
  }

  pulseMarker() { if (this.marker) this.marker.userData.pulse = 1; }

  promptText() { return this.plan[this.round]?.gap !== undefined ? "Tap the one that's missing!" : 'Tap the one that comes next!'; }

  // A choice was let go: a tap (no move) is the easy fallback; a drop on the "?" places it; anywhere else it goes home.
  dropChoice(c, z, { tapped }) {
    const t = c.userData.drag;
    if (this.busy || this.dead || !this.choices.includes(c)) { if (t) input.sendHome(t).then(() => setShadow(c, true)); return; }
    if (tapped) { setShadow(c, true); this.pick(c); return; }
    if (z && c.userData.kind === this.answer()) { this.place(c, false); return; }
    input.sendHome(t).then(() => setShadow(c, true));
    if (z) this.wrongPick(c);
  }

  // Tap on a choice (also the autoplay hook)
  pick(c) {
    if (this.busy || !this.choices.includes(c)) return;
    if (c.userData.kind !== this.answer()) { this.wrongPick(c); return; }
    this.place(c, true);
  }

  // The right thing goes into the gap: a hop at walking pace after a tap, a short settle after a drag. It lands with
  // its own note, a held breath, then the whole parade sings its pattern slowly (the new one hops highest).
  async place(c, tapped) {
    this.busy = true;
    this.qaAct = performance.now();
    this.wrongTok = null;
    input.lock(1800);
    this.clearChoices();
    const others = this.choices.filter((x) => x !== c);
    this.choices = [];
    for (const o of others) { o.userData.gone = true; this.fadeAway(o, 0.5).then(() => this.root.remove(o)); }
    const k = c.userData.kind;
    const m = this.marker;
    this.s.tween(m.scale, { x: 0.001, y: 0.001, z: 0.001 }, 0.25).then(() => { m.visible = false; });
    const target = this.rowScale(k);
    const gap = this.gapIndex();
    // never a wait: if the parade is still arriving, the gap's podium comes up at once / the piece hops onto its
    // wagon as it rolls (and rides along)
    this.raiseGap?.();
    if (!this.arrived) this.hurry = true;   // the rest of the parade arrives quickly (it never makes her wait)
    const to = this.gapTarget;
    const dur = tapped ? Math.max(0.8, c.position.distanceTo(to()) / 6) : 0.45;   // a hop, never a throw
    this.s.tween(c.scale, { x: target, y: target, z: target }, dur, Ease.inOut);
    c.userData.baseScale = target;
    c.userData.slot = gap;
    const hopP = this.hopTo(c, to, dur, tapped ? 0.9 : 0.3).then(() => {
      c.scale.setScalar(target);
      if (this.stage === 'train' && this.train && !this.train.done) this.train.riders.push({ it: c, cart: this.train.carts[gap] });
    });
    this.row.push(c);
    const ordered = this.row.slice().sort((a, b) => a.userData.slot - b.userData.slot);
    // the leader waves its flag (the train's engine gives a little bump)
    const flag = this.leader?.userData.flag;
    if (this.stage === 'train') hop(this.s, this.engine, 0.12, 0.35);
    else if (flag) this.s.anim(0.9, (_, pr) => { flag.rotation.z = Math.sin(pr * Math.PI * 4) * 0.25 * (1 - pr); }).then(() => (flag.rotation.z = 0));
    // The finished parade sings while the piece travels, timed so the new thing's own note sounds as it lands
    // (one pass, at most 1.5 s). If the parade is still arriving, its arrival is the tune: the piece just lands.
    const n = ordered.length, beat = Math.min(0.3, 1.5 / n);
    const tuneP = this.arrived
      ? this.wait(Math.max(0, dur - gap * beat)).then(() => this.playTune(ordered, beat, { big: c }))
      : hopP.then(() => { sfx.note(NOTE[k]); this.squash(c, 0.14, 0.24); });
    const p = this.plan[this.round];
    this.busy = false;
    this.success(this.slotPos.clone().add(new T.Vector3(0, 1, 0)), cap(p.seq.map((x) => SAY[x]).join(', ')) + '!',
      { payoff: Promise.race([Promise.all([hopP, tuneP, this.stage === 'train' ? null : this.arrival]), this.wait(2.0)]), still: 0 });
  }

  // Wrong: the thing shakes its head with a soft off-note, the empty spot pulses and the bit of the parade just before
  // the gap sings again. Two short voiced lines: what she picked, then what to find.
  wrongPick(c) {
    this.wrong(c);
    const k = c.userData.kind, ans = this.answer();
    this.redirecting = true;
    this.redirect(null);
    this.redirecting = false;
    const tok = (this.wrongTok = {});
    // one after the other (the second waits for the first, so neither cuts the other off)
    this.say(`That's the ${NAME[k]}!`).then(() => { if (this.wrongTok === tok && !this.busy && !this.dead) this.say(`Find the ${NAME[ans]}!`, { repeat: true }); });
  }
  // the errorless step after a 2nd wrong answer: the "Find the ..." line is the instruction then (no prompt on top)
  errorless() {
    if (this.errorlessOn) return;
    this.errorlessOn = true;
    this.makeErrorless();
    if (!this.redirecting) this.prompt();
  }

  wrong(c) {
    const inner = c.userData.inner, ry0 = inner.rotation.y;
    sfx.nope?.();
    this.s.anim(0.55, (_, pr) => { inner.rotation.y = ry0 + Math.sin(pr * Math.PI * 4) * 0.45 * (1 - pr); }).then(() => { inner.rotation.y = ry0; });
    // replay the unit just before the gap (or just after it, for a missing-middle pattern), then "?"
    const p = this.plan[this.round], gap = this.gapIndex(), per = period(p.seq);
    const idx = [];
    if (gap >= per) for (let i = gap - per; i < gap; i++) idx.push(i);
    else for (let i = gap + 1; i <= gap + per && i < p.seq.length; i++) idx.push(i);
    const list = idx.map((i) => this.row.find((o) => o.userData.slot === i)).filter(Boolean);
    if (gap >= per) list.push(null); else list.unshift(null);
    this.s.wait(0.6).then(() => { if (!this.busy) this.playTune(list, BEAT); });
  }

  // Tapping a parade thing (in the row or waiting at the back) is never an answer: it sings its note and hops.
  pokeAt(x, y) {
    if (super.pokeAt(x, y)) return true;
    const min = Math.min(innerWidth, innerHeight) * 0.07;
    for (const o of this.row) {
      if (!o.visible) continue;
      const p = project(o.getWorldPosition(new T.Vector3()).add(new T.Vector3(0, 0.5, 0)));
      if (Math.hypot(p.x - x, p.y - y) < min) { this.sing(o); return true; }
    }
    return false;
  }
  sing(o) {
    if (o.userData.hopping) return;
    o.userData.hopping = true;
    sfx.note(NOTE[o.userData.kind]);
    hop(this.s, o, 0.35 * (o.userData.kept ? BACK_S : 1), 0.3).then(() => { o.userData.hopping = false; });
  }
  onAdmirePoke(obj) { if (obj.userData.kind) this.sing(obj); else super.onAdmirePoke(obj); }

  // the hand: drag the right thing into the gap
  showHint(glow = true) {
    const c = this.choices.find((x) => x.userData.kind === this.answer());
    if (!c) return;
    if (glow) this.addHalo(c, 1.0);
    fx.ghostPath([this.hitPoint(c), this.gapPoint()], { mode: 'drag' });
  }
  // Level 3 shows the same move (a scan over everything looked like "tap all of these")
  demoL3() { this.showHint(false); }

  makeErrorless() {
    for (const c of this.choices) if (c.userData.kind !== this.answer() && c.userData.drag) {
      c.userData.drag.enabled = false;
      this.s.tween(c.scale, { x: 0.55, y: 0.55, z: 0.55 }, 0.4);
    }
  }

  // Round transition: the finished parade hops to the back of the beach (small) and stays there; the train chugs
  // off empty (tap the engine and it goes at once), the empty podiums sink back into the sand.
  async afterSuccess() {
    if (this.round >= this.totalRounds) return;   // the last parade stays on its stage for the finale
    // nothing here is waited for: the parade hops to the back, the train / podiums go, and the next round (its
    // choices live at once) arrives at the same time
    if (this.stage === 'train' && this.train && !this.train.done) await this.train.arrived;   // (rare: answered while it rolled in)
    const line = this.row.slice().sort((a, b) => a.userData.slot - b.userData.slot);
    this.toBack(line, this.lines++);
    if (this.stage === 'train') {
      this.engineLeaves();
      const r = this.round, items = this.makeRowItems(r);
      this.next = { r, items, train: this.rollIn(items, r) };   // rolls in right behind the leaving train
    } else if (this.stage === 'podium') {
      // each podium sinks once its thing has hopped up off it
      this.bases.forEach((pd, i) => {
        pd.userData.leaving = true;
        this.s.wait(0.25 + i * 0.1).then(() => this.s.tween(pd.position, { y: -ROW_Y - 0.1 }, 0.5, Ease.inOut)).then(() => this.root.remove(pd));
      });
    }
  }

  // each thing hops over the back of the stage to its spot at the back, left to right, at an easy pace
  async toBack(line, idx) {
    const [cx, z] = BACK[Math.min(idx, BACK.length - 1)];
    const n = line.length;
    this.keptLines.push(line);
    const jobs = line.map((o, i) => this.wait(i * 0.1).then(async () => {
      if (this.dead) return;
      o.userData.kept = true;
      o.userData.inner.rotation.y = 0;
      const to = new T.Vector3(cx + (i - (n - 1) / 2) * BACK_SP, 0, z);
      const s0 = o.scale.x, s1 = s0 * BACK_S;
      this.s.anim(1.6, (_, p) => o.scale.setScalar(s0 + (s1 - s0) * Ease.inOut(p)));
      await this.hopTo(o, to, 1.6, 1.6);
      o.userData.baseScale = s1;
      this.kept.push(o);
      this.pokeable(o, { fn: () => this.sing(o) });
    }));
    await Promise.all(jobs);
  }

  engineLeaves() {
    const eng = this.engine, carts = this.bases;
    if (!eng) return;
    sfx.trumpetHi?.();
    for (const c of carts) { c.userData.leaving = true; c.userData.x0 = c.position.x; }
    this.s.anim(3.0, (e) => {
      for (const c of carts) { c.position.x = c.userData.x0 + 14 * e; c.userData.spin?.(-e * 30); }
      eng.userData.chimney.scale.y = 1 + Math.abs(Math.sin(e * 30)) * 0.3;
    }, Ease.inOut).then(() => { for (const c of carts) this.root.remove(c); });
  }

  // resolves when the arrival clock reaches t (seconds)
  at(t) { return new Promise((res) => { const chk = () => { if (this.dead) return; if (this.arrClock >= t) res(); else this.s.wait(0.016).then(chk); }; chk(); }); }

  update(dt, t) {
    this.arrClock = (this.arrClock || 0) + dt * (this.hurry ? 5 : 1);
    const m = this.marker;
    if (m && m.visible) {
      const u = m.userData;
      u.pulse = Math.max(0, u.pulse - dt * 2.2);
      const k = 1 + Math.sin(t * 6) * 0.06 + u.pulse * 0.5 + u.near * 0.25;
      u.q.position.y = u.qy + Math.sin(t * 4) * 0.1 + u.pulse * 0.4;
      u.q.scale.setScalar(1 + u.pulse * 0.5);
      u.ring.scale.setScalar(k);
      u.rim.scale.setScalar(k);
      u.ring.material.color.setRGB(1, 1 - Math.max(u.pulse, u.near) * 0.25, 1 - Math.max(u.pulse, u.near) * 0.7);
    }
  }

  // "Look what you made!": the last parade on its stage and all the others waiting at the back, seen from above
  // the stage so every one of them shows.
  creationView() {
    // pulled back on narrower screens (4:3), so the engine, the podium ends and Pip stay in the photo
    const k = Math.max(1, 1.6 / (innerWidth / innerHeight));
    return { pos: [0, 1.25 + 4.15 * k, 0.9 + 12.3 * k], look: [0, 1.25, 0.9] };
  }
  creationObjects() { return [...this.kept, ...this.row]; }
  onFinale() {
    // the leader waves, and every parade that waited at the back hops forward onto the sand in front of the stage,
    // one parade after another, so the photo shows all of them with the last one still on its stage
    const flag = this.leader?.userData.flag;
    if (flag) this.s.anim(1.2, (_, pr) => { flag.rotation.z = Math.sin(pr * Math.PI * 5) * 0.25 * (1 - pr); }).then(() => (flag.rotation.z = 0));
    this.keptLines.forEach((line, li) => {
      const [cx, z] = FRONT[Math.min(li, FRONT.length - 1)];
      const n = line.length;
      line.forEach((o, i) => this.wait(0.2 + li * 0.25 + i * 0.06).then(() => {
        if (this.dead) return;
        this.hopTo(o, new T.Vector3(cx + (i - (n - 1) / 2) * BACK_SP, z > 3 ? 0.09 : 0, z), 1.9, 3.4);   // high over the stage; the front line stands on the towel
      }));
    });
  }
}
