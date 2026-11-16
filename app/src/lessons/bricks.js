// Brick letters (World 5: the building site). Topics mt_frDIaXzWbx "Knowing all letters", mt_WcfaSfVT33 "One-to-one
// counting" and mt_yqAL6O5i_v "Counting objects to 20".
// Chunky toy bricks stand in two tidy rows on a low, wide two-step stand at the front (a long baseplate in front, a
// row of giant grey bricks behind it), so every brick is always fully in view and in reach. Bear the builder and Pip
// stand at the far left, clear of the stand; the letter board is behind it with the faint outline of a capital letter.
// Every tap on ANY brick on the stand (or on the letter's empty outline) sends a brick hopping over on an arc to click
// into the next slot of the letter, with a big counting number (1, 2, 3 …) and a plastic click that climbs the
// scale. When the last slot is filled the letter wiggles and glows, "A is for Apple!" shows and the picture pops out
// beside it; then the bricks hop back to free spots on the stand and Bear throws in any extra bricks the next letter
// needs. Every brick has its own spot on the stand (no physics heap), so none can ever end up hidden or out of reach.
// Levels: A–G (5, 5, 5, 5, 5, 6, 7 bricks), H–N (8 … 14), O–T (15 … 20). One round per letter.
//
// Test hooks: bricks (bricks on the heap, tappable), tapBrick(b), need (bricks this letter takes), placed (clicked in).
import * as T from '../three.js';
import { Lesson } from '../engine/lesson.js';
import { makeAnimal, setFace, popIn, popOut, hop } from '../engine/actors.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { physics } from '../engine/physics.js';
import { project, setCamera, screenRadius } from '../engine/stage.js';
import { Ease } from '../engine/tween.js';
import { glow } from '../engine/scenery.js';
import { blobShadow } from '../engine/toon.js';
import { layoutLetter, bricksFor } from './bricks-letters.js';
import { makeBrick, setBrickLength, brickLength, makeSlot, makeBoard, makeHardHat, BRICK_COLS, BW, BD, BOARD, hexCss } from './bricks-pieces.js';
import { WORDS, makeWord, showWord } from './bricks-words.js';
import { bsfx } from './bricks-sound.js';

// Level 1: A–G, Level 2: H–N, Level 3: O–T. Later letters take more, smaller bricks: the board letter grows a
// little and the bricks shrink a little so even T's 20 bricks stay chunky.
// pl = a brick's length while it waits on the stand (shorter at Level 3 so 10 fit in a row).
const LEVELS = [
  { letters: 'ABCDEFG', H: 4.5, k: 1.0, pl: 1.3 },
  { letters: 'HIJKLMN', H: 4.75, k: 0.9, pl: 1.15 },
  { letters: 'OPQRST', H: 5.0, k: 0.8, pl: 0.8 },
];
const CAM = { pos: new T.Vector3(0.5, 3.9, 16.6), look: new T.Vector3(0.5, 3.0, 0) };
const BX = 2.75, BZ = -1.0;                                // the letter board (its face is at BZ + BOARD.faceZ)
// The stand: a low baseplate in front (z FRONT) and a step of giant bricks behind it (z BACK), between x0 and x1.
// The back row stands high enough that it shows fully above the front row, and low enough to stay under the letter.
const STAND = { x0: -3.85, x1: 5.45, front: 3.2, back: 2.15, plateK: 0.62, stepK: 1.5 };
const GREY = 0xb9bdc8;
const PIC = new T.Vector3(7.55, 0, 0.3);                  // where the picture pops out (right of the board, clear of the stand)
const BEAR = new T.Vector3(-7.3, 0, -1.7);                // Bear and Pip: far left, never in front of the stand
const FLY = 0.35;                                         // one hop, pile → letter

export default class BricksLesson extends Lesson {
  get totalRounds() { return (this.cfg || LEVELS[this.level] || LEVELS[0]).letters.length; }

  build() {
    this.cfg = LEVELS[this.level] || LEVELS[0];
    setCamera(CAM.pos, CAM.look);
    // Pip watches from the far left, beside the stand: never in front of a brick
    this.pip.position.set(-7.0, 0, 1.7);
    this.pip.rotation.y = 0.55;
    // the board
    const board = (this.board = makeBoard());
    board.position.set(BX, 0, BZ);
    this.root.add(board);
    physics.box(new T.Vector3(BX, 3.6, BZ - 0.05), new T.Vector3(6.9, 7.2, 0.4));
    this.buildStand();
    this.faceZ = BZ + BOARD.faceZ;
    // Bear the builder, in a hard hat
    const bear = (this.bear = makeAnimal('bear'));
    bear.position.copy(BEAR);
    bear.rotation.y = 0.55;
    bear.scale.setScalar(1.05);
    this.root.add(bear);
    const hat = makeHardHat();
    hat.scale.setScalar(1.12);
    hat.position.set(0, 0.88, 0.02);
    hat.rotation.x = -0.12;
    (bear.userData.head || bear).add(hat);
    // ears tucked under the hat (they would poke through its brim)
    for (const e of ['earL1', 'earR1']) bear.userData.bones?.[e]?.scale.setScalar(0.3);
    this.bearArms = bear.userData.arms ? bear.userData.arms.map((a) => a.rotation.clone()) : null;
    // the glow behind a finished letter
    this.halo = glow(0xffe27a, 1, 0);
    this.halo.position.set(BX, 3.6, this.faceZ + 0.05);
    this.root.add(this.halo);
    this.pile = [];         // bricks standing on the stand (tappable)
    this.placedBricks = [];
    this.slots = [];
    this.ghosts = [];
    this.next = 0;
    this.placed = 0;
    this.need = 0;
    this.phase = 'idle';
    this.colI = Math.floor(Math.random() * BRICK_COLS.length);
  }

  // ---------------- helpers ----------------
  get bricks() { return this.pile.slice(); }
  get letter() { return this.cfg.letters[this.round] || ''; }

  // The two-step stand, sized for this level's longest letter: one spot per brick, front row first.
  buildStand() {
    const cfg = this.cfg, maxN = Math.max(...[...cfg.letters].map(bricksFor));
    const cols = Math.ceil(maxN / 2);
    const sp = Math.min((STAND.x1 - STAND.x0) / cols, cfg.pl + 0.8);
    const len = cols * sp + 0.3, cx = (STAND.x0 + STAND.x1) / 2;
    // front: two long, low baseplates side by side (studs up)
    const studsUp = (b) => { b.rotation.x = -Math.PI / 2; b.userData.noSquash = true; this.root.add(b); return b; };
    const pk = STAND.plateK, pd = BW * pk;
    for (const dz of [-pd / 2, pd / 2]) studsUp(makeBrick(GREY, len, pk)).position.set(cx, (BD / 2) * pk, STAND.front + dz);
    // back: a step of giant bricks, alternating two greys so it reads as toy bricks, not a wall
    const gk = STAND.stepK, n = Math.max(2, Math.round(len / 3.2)), gl = len / n;
    for (let i = 0; i < n; i++) studsUp(makeBrick(i % 2 ? 0xa9afbd : GREY, gl - 0.04, gk)).position.set(cx - len / 2 + gl * (i + 0.5), (BD / 2) * gk, STAND.back);
    // bricks stand on the stud tops (top of the stud = BD/2 + the stud's height, ~0.12 model units)
    this.root.updateMatrixWorld(true);
    const top = (k) => (BD + 0.12) * k;
    const h = BW * cfg.k;   // a standing brick's height
    this.spots = [];
    for (const [z, y] of [[STAND.front, top(pk)], [STAND.back, top(gk)]]) {
      for (let c = 0; c < cols; c++) {
        const x = cx - (cols * sp) / 2 + sp * (c + 0.5) + (Math.random() - 0.5) * 0.03;
        this.spots.push({ p: new T.Vector3(x, y + h / 2 + 0.01, z), rz: (Math.random() - 0.5) * 0.08, b: null });
      }
    }
  }
  claimSpot(b) {
    const s = this.spots.find((q) => !q.b);
    if (!s) return null;
    s.b = b;
    b.userData.spot = s;
    return s;
  }
  freeSpot(b) { const s = b.userData.spot; if (s && s.b === b) s.b = null; b.userData.spot = null; }
  setState(b, st) { b.userData.state = st; b.userData.tap.enabled = st !== 'move'; }
  // hop a brick on an arc onto its spot on the stand; it becomes tappable the moment it lands
  async hopTo(b, sp, { dur = 0.42, arc = 1.1, spin = 0 } = {}) {
    const id = (b.userData.mv = (b.userData.mv || 0) + 1);
    this.setState(b, 'move');
    const a = b.position.clone(), r0 = b.rotation.z, k = this.cfg.k;
    const r1 = sp.rz + Math.round((r0 - sp.rz) / (Math.PI * 2)) * Math.PI * 2 + spin * Math.PI * 2;
    b.rotation.x = b.rotation.y = 0;
    await this.s.anim(dur, (_, q) => {
      if (b.userData.mv !== id) return;
      b.position.lerpVectors(a, sp.p, q);
      b.position.y += Math.sin(q * Math.PI) * arc;
      b.rotation.z = r0 + (r1 - r0) * Ease.out(q);
    });
    if (this.dead || b.userData.mv !== id) return;
    b.position.copy(sp.p);
    b.rotation.z = sp.rz;
    this.pile.push(b);
    this.setState(b, 'pile');
    bsfx.clack();
    // a little landing squash (it only gets shorter and a touch wider: never into a neighbour)
    this.s.anim(0.18, (_, q) => { if (b.userData.mv !== id) return; const w = Math.sin(q * Math.PI) * (1 - q * 0.5); b.scale.set(k * (1 + 0.04 * w), k * (1 - 0.16 * w), k); }).then(() => { if (b.userData.mv === id) b.scale.setScalar(k); });
  }
  slotWorld(s, i) {
    // every brick lies flush on the board face (the letter layout never lets two bricks overlap)
    return new T.Vector3(BX - this.lay.W / 2 + s.x, this.base + s.y, this.faceZ + (BD / 2) * this.cfg.k + 0.002);
  }
  newBrick() {
    const col = BRICK_COLS[this.colI++ % BRICK_COLS.length];
    const b = makeBrick(col, this.cfg.pl, this.cfg.k);
    b.userData.noSquash = true;
    this.root.add(b);
    b.userData.tap = input.addTap(b, { radius: Math.max(0.45, this.cfg.pl / 2), onTap: () => this.tapBrick(b) });
    this.setState(b, 'move');
    return b;
  }

  // ---------------- rounds ----------------
  async startRound(r) {
    this.busy = true;
    const ch = this.letter;
    const N = (this.need = bricksFor(ch));
    this.next = 0;
    this.placed = 0;
    this.placedBricks = [];
    // the picture of the last letter pops away
    if (this.pic) { const p = this.pic; this.pic = null; popOut(this.s, p, 0.22).then(() => this.root.remove(p)); }
    // the faint outline of the new letter fades in on the board
    this.clearGhosts();
    const H = this.cfg.H, t = BW * this.cfg.k;
    this.lay = layoutLetter(ch, N, { H, t });
    this.base = BOARD.y0 + (BOARD.y1 - BOARD.y0 - H) / 2 - 0.08;
    this.slots = this.lay.slots;
    this.ghosts = this.slots.map((s, i) => {
      const g = makeSlot(s.len, t, 0xead3a6, 0xc9a978);
      const p = this.slotWorld(s, 0);
      g.position.set(p.x, p.y, this.faceZ + 0.004);
      g.rotation.z = s.ang;
      g.scale.setScalar(0.01);
      this.root.add(g);
      // tapping the letter's empty outline sends a brick too (a toddler often taps where the brick should go)
      g.userData.tap = input.addTap(g, { radius: Math.max(0.4, s.len / 2), onTap: () => this.tapBoard() });
      this.s.wait(0.02 * i).then(() => this.s.tween(g.scale, { x: 1, y: 1, z: 1 }, 0.25, Ease.back));
      return g;
    });
    sfx.swoosh();
    // Bear throws in the bricks the stand is missing (the first letter: all of them)
    const missing = N - this.spots.filter((q) => q.b).length;
    if (missing > 0) this.throwIn(missing);
    this.phase = 'build';
    await this.wait(0.15);
    if (this.dead) return;
    this.busy = false;
    // the one demo, once the first bricks have landed (skipped if the child is already tapping)
    if (r === 0 && !this.demoDone) { await this.wait(0.55 + Math.min(0.5, missing * 0.05)); if (this.dead) return; if (this.demoDone || this.next > 0) this.prompt(); else this.cue(); }
    else this.prompt();
  }
  promptText() {
    const ch = this.letter;
    if (!ch) return '';
    return this.round === 0 ? `Let's make ${ch}! Tap the bricks!` : `Now ${ch}! ${this.need} bricks!`;
  }
  prompt() { const t = this.promptText(); if (t) this.say(t, { max: 1.5 }); }

  clearGhosts() {
    for (const g of this.ghosts) { const gg = g; input.remove(gg.userData.tap); popOut(this.s, gg, 0.15).then(() => { this.root.remove(gg); gg.userData.fill.geometry.dispose(); gg.userData.fill.material.dispose(); gg.userData.dash.dispose(); gg.userData.dg.dispose(); }); }
    this.ghosts = [];
  }

  // Bear tosses n new bricks onto the stand, one after another (each gets its spot right away, so the count is
  // always right even while they are still in the air).
  throwIn(n) {
    const arms = this.bear.userData.arms;
    for (let i = 0; i < n; i++) {
      const b = this.newBrick(), sp = this.claimSpot(b);
      b.visible = false;
      this.s.wait(0.05 + i * 0.07).then(() => {
        if (this.dead) return;
        b.position.set(BEAR.x + 0.9, 2.3, BEAR.z + 0.6);
        b.rotation.z = Math.random() * 3;
        b.visible = true;
        bsfx.hop();
        this.hopTo(b, sp, { dur: 0.5, arc: 1.4 + Math.random() * 0.6, spin: Math.random() < 0.5 ? -1 : 1 });
        // the arm swing
        if (arms) {
          const a = arms[1], r0 = this.bearArms[1];
          this.s.anim(0.18, (_, p) => { a.rotation.z = r0.z - Math.sin(p * Math.PI) * 1.6; }).then(() => { a.rotation.z = r0.z; });
        }
      });
    }
    this.bear.userData.kick?.(new T.Vector3(0, 3, 0));
  }

  // ---------------- tapping a brick ----------------
  tapBrick(b) {
    if (this.dead) return;
    const placedAt = this.placedBricks.indexOf(b);
    if (placedAt >= 0) return this.tapPlaced(b, placedAt);
    if (this.phase !== 'build' || this.next >= this.need || this.demoing) return;
    const k = this.pile.indexOf(b);
    if (k < 0) return;
    this.pile.splice(k, 1);
    this.freeSpot(b);
    this.idle = 0;
    this.demoDone = true;   // already tapping: no need to show how
    this.clearHints();
    fx.clearHands();
    const i = this.next++;
    this.fly(b, this.slots[i], i);
  }

  // a tap on the letter's empty outline: the stand brick nearest the board goes
  tapBoard() {
    if (this.dead || this.phase !== 'build' || !this.pile.length) return;
    let best = null;
    for (const b of this.pile) if (!best || b.position.x > best.position.x + 0.01 || (Math.abs(b.position.x - best.position.x) < 0.01 && b.position.z > best.position.z)) best = b;
    this.tapBrick(best);
  }

  async fly(b, slot, i) {
    const id = (b.userData.mv = (b.userData.mv || 0) + 1);
    this.setState(b, 'move');
    bsfx.hop();
    const a = b.position.clone(), r0 = b.rotation.z;
    const p1 = this.slotWorld(slot, i);
    // land square on the stroke, with one cheerful cartwheel on the way
    let r1 = slot.ang;
    while (r1 - r0 > Math.PI) r1 -= Math.PI * 2;
    while (r1 - r0 < -Math.PI) r1 += Math.PI * 2;
    r1 -= Math.PI * 2;
    const L0 = brickLength(b), L1 = slot.len, k = this.cfg.k;
    const h = 1.6 + a.distanceTo(p1) * 0.12;
    // it arcs over to a spot right in front of its slot (clear of every brick already in), turned and sized,
    // then presses straight in: it never sweeps through a neighbour
    const front = p1.clone(); front.z = this.faceZ + (BD + 0.12) * k + (BD / 2) * k + 0.08;
    const S1 = 0.76;
    b.rotation.x = b.rotation.y = 0;
    await this.s.anim(FLY, (e, q) => {
      if (q < S1) {
        const u = Ease.out(q / S1);
        b.position.lerpVectors(a, front, u);
        b.position.y += Math.sin((q / S1) * Math.PI) * h;
        b.rotation.z = r0 + (r1 - r0) * u;
        setBrickLength(b, L0 + (L1 - L0) * Math.min(1, u * 1.25));
        b.scale.setScalar(k * (1 + Math.sin((q / S1) * Math.PI) * 0.16));
      } else {
        const u = Ease.in((q - S1) / (1 - S1));
        b.position.set(p1.x, p1.y, front.z + (p1.z - front.z) * u);
        b.rotation.z = r1;
        setBrickLength(b, L1);
        b.scale.setScalar(k);
      }
    });
    if (this.dead || b.userData.mv !== id) return;
    b.position.copy(p1);
    b.rotation.set(0, 0, slot.ang);
    setBrickLength(b, L1);
    b.scale.setScalar(k);
    this.click(b, slot, i);
  }

  click(b, slot, i) {
    this.placedBricks[i] = b;
    this.setState(b, 'board');
    b.userData.rest = { p: b.position.clone(), r: b.rotation.z };
    this.placed++;
    const n = this.placed;
    bsfx.click(i);
    // pressed in: a quick squash into the board and back
    const k = this.cfg.k;
    // only ever shrinks a touch (never grows into a neighbour)
    this.s.anim(0.2, (_, q) => { const w = Math.sin(q * Math.PI) * (1 - q * 0.4); b.scale.set(k * (1 - 0.05 * w), k * (1 - 0.05 * w), k * (1 - 0.22 * w)); }).then(() => b.scale.setScalar(k));
    const g = this.ghosts[i];
    if (g) g.visible = false;
    const top = b.position.clone().add(new T.Vector3(0, 0.25, 0.6));
    const last = n === this.need;
    fx.float(top, String(n), { color: hexCss(b.userData.col), size: last ? 15 : 11 });
    const sc = project(b.position);
    fx.sparkle(sc.x, sc.y);
    // Bear nods along with the count
    const bh = this.bear.userData.head;
    if (bh) this.s.anim(0.25, (_, q) => { bh.rotation.x = Math.sin(q * Math.PI) * 0.22; }).then(() => { bh.rotation.x = 0; });
    if (last) this.complete();
  }

  tapPlaced(b, i) {
    if (b.userData.wig) return;
    b.userData.wig = true;
    bsfx.clack();
    const r = b.userData.rest;
    fx.float(b.position.clone().add(new T.Vector3(0, 0.25, 0.6)), String(i + 1), { color: hexCss(b.userData.col), size: 9 });
    // it lifts off the board toward you and clicks back (straight out and in: never into a neighbour)
    if (this.phase !== 'build') { b.userData.wig = false; return; }
    this.s.anim(0.3, (_, q) => { b.position.z = r.p.z + Math.sin(q * Math.PI) * 0.35; }).then(() => { b.position.z = r.p.z; b.userData.wig = false; });
  }

  // ---------------- the finished letter ----------------
  complete() {
    this.phase = 'done';
    const ch = this.letter, W = WORDS[ch];
    bsfx.tada();
    // the letter wiggles and glows
    const cx = BX, cy = this.base + this.cfg.H / 2;
    const list = this.placedBricks.slice();
    this.halo.scale.setScalar(this.cfg.H * 1.9);
    this.s.anim(1.25, (_, p) => {
      const th = Math.sin(p * Math.PI * 4) * 0.07 * (1 - p), sc = 1 + Math.sin(Math.min(1, p * 2.5) * Math.PI) * 0.07;
      const c = Math.cos(th), s = Math.sin(th);
      for (const b of list) {
        if (b.userData.state !== 'board') continue;   // already hopping back to the stand
        const r = b.userData.rest;
        const dx = (r.p.x - cx) * sc, dy = (r.p.y - cy) * sc;
        b.position.set(cx + dx * c - dy * s, cy + dx * s + dy * c, r.p.z);
        b.rotation.z = r.r + th;
      }
      this.halo.material.opacity = Math.sin(Math.min(1, p * 1.6) * Math.PI) * 0.6;
    }).then(() => {
      for (const b of list) { if (b.userData.state !== 'board') continue; const r = b.userData.rest; b.position.copy(r.p); b.rotation.z = r.r; }
      this.halo.material.opacity = 0;
    });
    for (let j = 0; j < 4; j++) this.s.wait(0.1 + j * 0.12).then(() => { const b = list[(j * 5) % list.length]; if (!b) return; const sc = project(b.position); fx.sparkle(sc.x, sc.y); });
    // Bear cheers
    const bf = this.bear.userData.face;
    if (bf) { setFace(bf, 'joy'); this.s.wait(1.3).then(() => setFace(bf, 'happy')); }
    const arms = this.bear.userData.arms;
    if (arms) this.s.anim(0.9, (_, p) => { const up = Math.sin(Math.min(1, p * 1.4) * Math.PI) * 2.2; arms[0].rotation.z = this.bearArms[0].z + up; arms[1].rotation.z = this.bearArms[1].z - up; }).then(() => { arms[0].rotation.z = this.bearArms[0].z; arms[1].rotation.z = this.bearArms[1].z; });
    hop(this.s, this.bear, 0.35, 0.4);
    // the picture pops out beside the letter
    this.s.wait(0.18).then(() => this.showPicture(ch));
    this.success(new T.Vector3(cx, cy + 1.2, this.faceZ + 1), `${ch} is for ${W.word}!`);
  }
  showPicture(ch) {
    if (this.dead) return;
    const g = makeWord(ch);
    const W = WORDS[ch];
    g.position.set(PIC.x, W.float || 0, PIC.z);
    const sh = blobShadow(0.85);
    sh.position.y = 0.02 - (W.float || 0);
    g.add(sh);
    this.root.add(g);
    this.pic = g;
    // out from behind the board edge, landing on its spot
    const from = new T.Vector3(BX + 3.0, 3.2, BZ + 0.6), to = g.position.clone();
    g.position.copy(from);
    g.scale.setScalar(0.01);
    sfx.pop();
    this.s.anim(0.32, (e, q) => {
      g.position.lerpVectors(from, to, e);
      g.position.y += Math.sin(q * Math.PI) * 1.2;
      g.scale.setScalar(Math.max(0.01, Ease.back(Math.min(1, q * 1.4))));
    }, Ease.out).then(() => { g.position.copy(to); g.scale.setScalar(1); if (!this.dead && this.pic === g) showWord(this.s, g); });
  }

  async afterSuccess() {
    await this.wait(0.3);
    if (this.dead) return;
    this.tumble();
    await this.wait(0.42);
  }
  // all the bricks pop off the board and hop back to free spots on the stand (spots are claimed right away)
  tumble() {
    const list = this.placedBricks.filter(Boolean);
    this.placedBricks = [];
    bsfx.rattle(list.length);
    const PL = this.cfg.pl, k = this.cfg.k;
    list.forEach((b, j) => {
      const sp = this.claimSpot(b);
      const id = (b.userData.mv = (b.userData.mv || 0) + 1);
      this.setState(b, 'move');
      this.s.wait(j * 0.03).then(() => {
        if (this.dead || b.userData.mv !== id) return;
        const z0 = b.position.z, L0 = brickLength(b), z1 = z0 + 0.9;
        // pop straight off the board toward us; only once clear of the letter does it go back to a stand brick
        this.s.anim(0.12, (e) => { if (b.userData.mv !== id) return; b.position.z = z0 + (z1 - z0) * e; setBrickLength(b, L0 + (PL - L0) * Math.max(0, (e - 0.6) / 0.4)); }).then(() => {
          if (this.dead || b.userData.mv !== id) return;
          setBrickLength(b, PL);
          b.scale.setScalar(k);
          if (sp) this.hopTo(b, sp, { dur: 0.4, arc: 0.8 + Math.random() * 0.5 });
        });
      });
    });
  }

  // ---------------- every tap counts ----------------
  // Taps that hit no target (and every tap while the engine rests after fast tapping) still pick the nearest stand
  // brick, so a toddler tapping quickly is never ignored mid-letter.
  pokeAt(x, y) {
    if (!this.dead && this.phase === 'build' && !this.demoing && this.next < this.need) {
      let best = null, bd = Infinity;
      for (const b of this.pile) {
        const p = project(b.position);
        const r = Math.max(screenRadius(b.position, 0.75), Math.min(innerWidth, innerHeight) * 0.07);
        const d = Math.hypot(p.x - x, p.y - y) / r;
        if (d < 1 && d < bd) { bd = d; best = b; }
      }
      if (best) { this.tapBrick(best); return true; }
    }
    return super.pokeAt(x, y);
  }

  // ---------------- hints ----------------
  // the front-row brick nearest the middle of the stand
  nudgeTarget() {
    if (this.phase !== 'build') return null;
    let best = null, bd = Infinity;
    const cx = (STAND.x0 + STAND.x1) / 2;
    for (const b of this.pile) { const d = Math.abs(b.position.x - cx) + (b.position.z < STAND.front - 0.5 ? 50 : 0); if (d < bd) { bd = d; best = b; } }
    return best;
  }
  nudge(step) {
    const b = this.nudgeTarget();
    if (!b) return super.nudge(step);
    sfx.boing && sfx.boing();
    // it hops up and lands back on its spot (it stays tappable all the way)
    const sp = b.userData.spot, id = b.userData.mv;
    if (sp) this.s.anim(0.45, (_, q) => { if (b.userData.mv !== id) return; b.position.y = sp.p.y + Math.sin(q * Math.PI) * 0.5; b.rotation.z = sp.rz + Math.sin(q * Math.PI * 2) * 0.25; }).then(() => { if (b.userData.mv === id) { b.position.copy(sp.p); b.rotation.z = sp.rz; } });
    if (step >= 2) { const stop = fx.halo(b, 0.9); this.s.wait(3).then(stop); }
  }
  // fast tapping is how this game is played: Pip giggles along instead of looking scared
  mash() {
    sfx.giggle();
    const pf = this.pip.userData.face;
    if (pf) { setFace(pf, 'joy'); this.s.wait(0.7).then(() => { if (pf.userData.emotion === 'joy') setFace(pf, 'happy'); }); }
    hop(this.s, this.pip, 0.35, 0.3);
  }
  showHint(glowOn = true) {
    const b = this.nudgeTarget();
    if (!b) return;
    if (glowOn) this.addHalo(b, 0.9);
    fx.ghostPath([b.position.clone()], { mode: 'tap' });
  }
  makeErrorless() { const b = this.nudgeTarget(); if (b) this.addHalo(b, 0.9); }

  // ---------------- every frame ----------------
  update(dt, t) {
    // the next slot breathes softly so you can see where the brick will go
    for (let i = 0; i < this.ghosts.length; i++) {
      const g = this.ghosts[i];
      if (!g.visible) continue;
      const on = i === this.next && this.phase === 'build';
      const m = g.userData.fill.material;
      const k = on ? 0.5 + 0.5 * Math.sin(t * 6) : 0;
      m.color.setHex(0xead3a6).lerp(_hi, k * 0.85);
    }
  }
}
const _hi = new T.Color(0xfff6c8);
