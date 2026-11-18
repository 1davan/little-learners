// Brick letters (World 5: the building site). Topics mt_frDIaXzWbx "Knowing all letters", mt_WcfaSfVT33 "One-to-one
// counting" and mt_yqAL6O5i_v "Counting objects to 20".
// Chunky toy bricks stand in two tidy rows on a low, wide two-step stand at the front (a long baseplate in front, a
// row of giant grey bricks behind it), so every brick is always fully in view and in reach. Bear the builder and Pip
// stand at the far left, clear of the stand; the letter board is behind it with the faint outline of a capital letter.
// Bear throws in exactly the bricks the letter needs, each one already the length of its place in the letter (bricks
// never stretch). Tap a brick (or drag it up to the board, or tap the letter's outline) and it hops over and clicks
// into its place; every click is counted out loud ("One!", "Two!" …) with a plastic click that climbs the scale, and
// the number shows beside the board. When the last brick is in there is a held breath, the letter wiggles and glows,
// "A is for Apple!" is said and the picture pops out beside it. The finished letter stays a moment (tap its bricks to
// count them again), then shrinks up onto the top of the board, where every letter of the level stands in a row: the
// sign is what the level's finale shows. The last letter also stays on the board.
// Levels: A–G (5 bricks each), H–N (6 … 8), O–T (8 … 10). One round per letter.
//
// Test hooks: bricks (bricks on the stand, tappable), tapBrick(b), need (bricks this letter takes), placed (clicked in).
import * as T from '../three.js';
import { Lesson } from '../engine/lesson.js';
import { makeAnimal, setFace, hop } from '../engine/actors.js';
import { input } from '../engine/input.js';
import { fx } from '../engine/fx.js';
import { physics } from '../engine/physics.js';
import { project, setCamera, screenRadius } from '../engine/stage.js';
import { Ease } from '../engine/tween.js';
import { glow } from '../engine/scenery.js';
import { blobShadow } from '../engine/toon.js';
import { layoutLetter, bricksFor, LETTERS } from './bricks-letters.js';
import { makeBrick, makeSlot, makeBoard, makeHardHat, BRICK_COLS, BW, BD, BOARD, hexCss } from './bricks-pieces.js';
import { WORDS, makeWord, showWord } from './bricks-words.js';
import { bsfx } from './bricks-sound.js';

// Level 1: A–G, Level 2: H–N, Level 3: O–T. H = the letter's height on the board, k = the bricks' size.
const LEVELS = [
  { letters: 'ABCDEFG', H: 4.5, k: 1.0 },
  { letters: 'HIJKLMN', H: 4.75, k: 0.9 },
  { letters: 'OPQRST', H: 5.0, k: 0.9 },
];
// the camera sits a little higher than the board's middle so the sign row on top of the board stays clear of the caption
const CAM = { pos: new T.Vector3(0.5, 4.75, 16.9), look: new T.Vector3(0.5, 3.85, 0) };
const BX = 2.75, BZ = -1.0;                                // the letter board (its face is at BZ + BOARD.faceZ)
// The stand: a low baseplate in front (z FRONT) and a step of giant bricks behind it (z BACK), between x0 and x1.
const STAND = { x0: -3.85, x1: 5.45, front: 3.2, back: 2.15, plateK: 0.62, stepK: 1.5 };
const ROW = STAND.x1 - STAND.x0 - 0.3;                     // room for bricks along one row of the stand
const GREY = 0xb9bdc8;
const PIC = new T.Vector3(8.0, 0, 0.3);                   // where the picture pops out (right of the board, clear of the stand)
const BEAR = new T.Vector3(-4.95, 0, -2.4);                // Bear and Pip: far left, side by side, never in front of the stand
const PIP = new T.Vector3(-6.75, 0, 1.55);
const FLY = 0.75;                                         // one hop, stand → letter (slow enough to follow)
const GAP = 1.15;                                         // quick taps queue up: one brick at a time, each counted out loud
const SIGN_K = 0.18;                                      // a finished letter's size on the sign on top of the board
const SIGN_GAP = 0.13;
const NUMS = ['One!', 'Two!', 'Three!', 'Four!', 'Five!', 'Six!', 'Seven!', 'Eight!', 'Nine!', 'Ten!'];
const NUM_AT = new T.Vector3(BX + 3.85, 5.7, 0);          // the count number shows here, beside the board (never on the letter)

export default class BricksLesson extends Lesson {
  get totalRounds() { return (this.cfg || LEVELS[this.level] || LEVELS[0]).letters.length; }

  build() {
    this.cfg = LEVELS[this.level] || LEVELS[0];
    setCamera(CAM.pos, CAM.look);
    // Pip watches from the far left, beside Bear (never in front of him or of a brick)
    this.pip.position.copy(PIP);
    this.pip.rotation.y = 0.55;
    // the board
    const board = (this.board = makeBoard());
    board.position.set(BX, 0, BZ);
    this.root.add(board);
    physics.box(new T.Vector3(BX, 3.6, BZ - 0.05), new T.Vector3(6.9, 7.2, 0.4));
    this.buildStand();
    this.faceZ = BZ + BOARD.faceZ;
    NUM_AT.z = this.faceZ + 0.6;
    // Bear the builder, in a hard hat
    const bear = (this.bear = makeAnimal('bear'));
    bear.position.copy(BEAR);
    bear.rotation.y = 0.45;
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
    // the glow behind a finished letter: a soft disc lying flat on the board (a camera-facing sprite would tilt
    // behind the board face and show a hard edge)
    this.halo = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: glow(0xffffff).material.map, color: 0xffe27a, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
    this.halo.position.set(BX, 3.6, this.faceZ + 0.006);
    this.root.add(this.halo);
    // the sign: every finished letter of the level stands on top of the board's header, in a row
    this.signY = this.boardTop();
    this.signX = this.signLayout();
    this.minis = [];
    this.pile = [];         // bricks standing on the stand (tappable)
    this.placedBricks = [];
    this.slots = [];
    this.ghosts = [];
    this.placed = 0;
    this.queued = 0;
    this.need = 0;
    this.phase = 'idle';
    this.colI = Math.floor(Math.random() * BRICK_COLS.length);
    this.moveScenery();
  }

  // the top of the board's yellow header (the sign row stands on it)
  boardTop() {
    let top = BOARD.y1 + 0.52;
    this.board.updateMatrixWorld(true);
    const b = new T.Box3();
    this.board.traverse((o) => { if (o.isMesh && !o.userData.outline && o.name !== 'prop_letterboard') b.expandByObject(o); });
    // the post caps stick up a little at the very ends; the header itself is about 0.12 lower
    if (!b.isEmpty() && b.max.y > 6.8 && b.max.y < 7.4) top = b.max.y - 0.12;
    return Math.max(6.95, Math.min(7.1, top));
  }
  // where each letter of the level stands on the sign: centred, packed by each letter's real width
  signLayout() {
    const ws = [...this.cfg.letters].map((ch) => (LETTERS[ch] ? LETTERS[ch](this.cfg.H, BW * this.cfg.k / 2).W : this.cfg.H * 0.8) * SIGN_K);
    const tot = ws.reduce((a, w) => a + w, 0) + SIGN_GAP * (ws.length - 1);
    let x = BX - tot / 2;
    return ws.map((w) => { const c = x + w / 2; x += w + SIGN_GAP; return c; });
  }
  // the scenery's digger (and at night the right-hand work light) stand right behind the picture spot: move them aside
  moveScenery() {
    const g = this.meadow;
    if (!g) return;
    for (const o of g.children) {
      const u = o.userData || {};
      if (u.arm && o.position.x > 8) o.position.x = 17.5;
      else if (u.beam && o.position.x > 8) o.position.x = 14.2;
    }
  }

  // ---------------- helpers ----------------
  get bricks() { return this.pile.slice(); }
  get letter() { return this.cfg.letters[this.round] || ''; }

  // The two-step stand: a long baseplate in front and a step of giant bricks behind it, the same size every level.
  buildStand() {
    const len = ROW + 0.6, cx = (STAND.x0 + STAND.x1) / 2;
    this.standX = cx;
    // front: two long, low baseplates side by side (studs up)
    const studsUp = (b) => { b.rotation.x = -Math.PI / 2; b.userData.noSquash = true; this.root.add(b); return b; };
    const pk = STAND.plateK, pd = BW * pk;
    for (const dz of [-pd / 2, pd / 2]) studsUp(makeBrick(GREY, len, pk)).position.set(cx, (BD / 2) * pk, STAND.front + dz);
    // back: a step of giant bricks, alternating two greys so it reads as toy bricks, not a wall
    const gk = STAND.stepK, n = Math.max(2, Math.round(len / 3.2)), gl = len / n;
    for (let i = 0; i < n; i++) studsUp(makeBrick(i % 2 ? 0xa9afbd : GREY, gl - 0.04, gk)).position.set(cx - len / 2 + gl * (i + 0.5), (BD / 2) * gk, STAND.back);
    // bricks stand on the stud tops (top of the stud = BD/2 + the stud's height, ~0.12 model units)
    const top = (k) => (BD + 0.12) * k;
    const h = BW * this.cfg.k;   // a standing brick's height
    this.rowY = [top(pk) + h / 2 + 0.01, top(gk) + h / 2 + 0.01];
  }
  // Where this letter's bricks stand: shared out over the two rows (longest first, to the emptier row), then each row
  // in writing order from the left, evenly spaced and centred. Every brick gets its own spot, square on the studs.
  layoutStand(lens) {
    const rows = [[], []], used = [0, 0];
    const order = lens.map((l, i) => i).sort((a, b) => lens[b] - lens[a]);
    for (const i of order) { const r = used[0] <= used[1] ? 0 : 1; rows[r].push(i); used[r] += lens[i] + 0.35; }
    const spots = [];
    rows.forEach((row, r) => {
      row.sort((a, b) => a - b);
      const sum = row.reduce((a, i) => a + lens[i], 0);
      const gap = row.length > 1 ? Math.min(0.9, (ROW - sum) / (row.length - 1)) : 0;
      const w = sum + gap * Math.max(0, row.length - 1);
      let x = this.standX - w / 2;
      for (const i of row) {
        spots[i] = { p: new T.Vector3(x + lens[i] / 2, this.rowY[r], r ? STAND.back : STAND.front), rz: 0, b: null };
        x += lens[i] + gap;
      }
    });
    return spots;
  }
  setState(b, st) {
    b.userData.state = st;
    const on = st === 'pile';
    if (b.userData.drag) b.userData.drag.enabled = on;
  }
  // hop a brick on an arc onto its spot on the stand; it becomes tappable the moment it lands
  async hopTo(b, sp, { dur = 0.7, arc = 1.1, spin = 0, quiet = false } = {}) {
    const id = (b.userData.mv = (b.userData.mv || 0) + 1);
    this.setState(b, 'move');
    const a = b.position.clone(), r0 = b.rotation.z, k = this.cfg.k;
    const r1 = sp.rz + Math.round((r0 - sp.rz) / (Math.PI * 2)) * Math.PI * 2 + spin * Math.PI * 2;
    b.rotation.x = b.rotation.y = 0;
    await this.s.anim(dur, (_, q) => {
      if (b.userData.mv !== id) return;
      b.position.lerpVectors(a, sp.p, Ease.out(q));
      b.position.y += Math.sin(q * Math.PI) * arc;
      b.rotation.z = r0 + (r1 - r0) * Ease.inOut(q);
    });
    if (this.dead || b.userData.mv !== id) return;
    b.position.copy(sp.p);
    b.rotation.z = sp.rz;
    if (!this.pile.includes(b)) this.pile.push(b);
    if (b.userData.drag) b.userData.drag.home = sp.p.clone();
    this.setState(b, 'pile');
    if (!quiet) bsfx.clack();
    // a little landing squash (it only gets shorter and a touch wider: never into a neighbour)
    this.s.anim(0.3, (_, q) => { if (b.userData.mv !== id) return; const w = Math.sin(q * Math.PI) * (1 - q * 0.5); b.scale.set(k * (1 + 0.02 * w), k * (1 - 0.16 * w), k); }).then(() => { if (b.userData.mv === id) b.scale.setScalar(k); });
  }
  slotWorld(s) {
    // every brick lies flush on the board face (the letter layout never lets two bricks overlap)
    return new T.Vector3(BX - this.lay.W / 2 + s.x, this.base + s.y, this.faceZ + (BD / 2) * this.cfg.k + 0.002);
  }
  // A brick made for one place in the letter (its length never changes). Tap it, or drag it up to the board.
  newBrick(slotI, len) {
    const col = BRICK_COLS[this.colI++ % BRICK_COLS.length];
    const b = makeBrick(col, len, this.cfg.k);
    b.userData.noSquash = true;
    b.userData.slotI = slotI;
    this.root.add(b);
    b.userData.drag = input.addDrag(b, {
      radius: Math.max(0.5, len / 2), sound: false, minY: 0.4,
      zones: () => this.brickZones(b),
      onPick: () => { this.idle = 0; this.carrying = b; },
      onDrop: (z, info) => this.dropBrick(b, z, info),
    });
    this.setState(b, 'move');
    return b;
  }
  // a carried brick's target: its own place in the letter (generous, so anywhere on the letter counts)
  brickZones(b) {
    if (this.phase !== 'build' || b.userData.state !== 'pile') return [];
    const s = this.slots[b.userData.slotI];
    if (!s || s.taken) return [];
    return [{ pos: this.slotWorld(s), radius: Math.max(1.6, s.len * 0.75), slot: s }];
  }
  dropBrick(b, zone, info) {
    this.carrying = null;
    if (this.dead || b.userData.state !== 'pile') return;
    if (info && info.tapped) { this.tapBrick(b); return; }
    if (zone && this.phase === 'build') { this.tapBrick(b); return; }
    // let go somewhere else: it hops back to its spot on the stand
    const sp = b.userData.spot;
    if (sp) { const k = this.pile.indexOf(b); if (k >= 0) this.pile.splice(k, 1); this.hopTo(b, sp, { dur: 0.5, arc: 0.4, quiet: true }); }
  }

  // ---------------- rounds ----------------
  async startRound(r) {
    this.busy = true;
    const ch = this.letter;
    const N = (this.need = bricksFor(ch));
    this.placed = 0;
    this.queued = 0;
    this.placedBricks = [];
    // the picture of the last letter goes (gently, once its little show is over)
    const lastPic = this.picShow;
    this.picShow = null;
    if (lastPic) lastPic.then((p) => (p && !this.dead ? this.wait(0.3).then(() => this.fadeAway(p, 0.5)).then(() => this.root.remove(p)) : null));
    // the faint outline of the new letter fades in on the board
    this.clearGhosts();
    const H = this.cfg.H, t = BW * this.cfg.k;
    // (its bricks may already be on the stand: Bear threw them in while the last letter went up to the sign)
    const pre = this.pre && this.pre.ch === ch ? this.pre : null;
    this.pre = null;
    this.lay = pre ? pre.lay : layoutLetter(ch, N, { H, t });
    this.base = BOARD.y0 + (BOARD.y1 - BOARD.y0 - H) / 2 - 0.08;
    this.slots = pre ? pre.slots : this.lay.slots.map((s, i) => ({ ...s, i, taken: false }));
    this.ghosts = this.slots.map((s, i) => {
      const g = makeSlot(s.len, t, 0xead3a6, 0xc9a978);
      const p = this.slotWorld(s);
      g.position.set(p.x, p.y, this.faceZ + 0.004);
      g.rotation.z = s.ang;
      g.scale.setScalar(0.01);
      this.root.add(g);
      // tapping the letter's empty outline sends that place's brick (a toddler often taps where the brick should go)
      g.userData.tap = input.addTap(g, { radius: Math.max(0.4, s.len / 2), press: false, onTap: () => this.tapBoard(i) });
      this.s.wait(0.04 * i).then(() => this.s.tween(g.scale, { x: 1, y: 1, z: 1 }, 0.45, Ease.out));
      return g;
    });
    // Bear throws in this letter's bricks, each one made for its place
    if (!pre) this.throwIn(this.layoutStand(this.slots.map((s) => s.len)), this.slots);
    this.phase = 'build';
    // the intro names the letter once; the reminders after it name the action ("Tap a brick!")
    this.say(r === 0 ? `Let's make ${ch}! Tap the bricks!` : `Let's make ${ch}!`, { max: 1.5 });
    this.saidAt = r;
    await this.wait(0.15);
    if (this.dead) return;
    this.busy = false;
    // the tap demo the first time, once the first bricks have landed (skipped if the child is already tapping)
    if (r === 0 && !this.demoDone) {
      await this.wait(1.0);
      if (this.dead || this.demoDone || this.placed > 0 || this.queued) return;
      this.demoDone = true;
      this.playDemo();
    }
  }
  promptText() {
    const ch = this.letter;
    if (!ch) return '';
    if (this.saidAt === this.round) return 'Tap a brick!';
    return this.round === 0 ? `Let's make ${ch}! Tap the bricks!` : `Let's make ${ch}!`;
  }
  prompt(opts = {}) { const t = this.promptText(); if (t) this.say(t, { max: 1.5, ...opts }); }

  clearGhosts() {
    for (const g of this.ghosts) { const gg = g; input.remove(gg.userData.tap); this.fadeAway(gg, 0.3).then(() => { this.root.remove(gg); gg.userData.fill.geometry.dispose(); gg.userData.fill.material.dispose(); gg.userData.dash.dispose(); gg.userData.dg.dispose(); }); }
    this.ghosts = [];
  }

  // Bear tosses the letter's bricks onto the stand, one after another (each knows its spot right away).
  throwIn(spots, slots) {
    const arms = this.bear.userData.arms, n = spots.length;
    slots.forEach((s, i) => {
      const b = this.newBrick(i, s.len), sp = spots[i];
      sp.b = b;
      b.userData.spot = sp;
      b.visible = false;
      this.s.wait(0.05 + i * Math.min(0.2, 2.0 / n)).then(() => {
        if (this.dead) return;
        // (a long brick leaves from beside Bear's paw, never across Bear)
        b.position.set(BEAR.x + 0.95 + Math.max(0, s.len / 2 - 0.5), 2.2, BEAR.z + 0.7);
        b.rotation.z = s.len < 1.8 ? Math.random() * 2 : 0;
        b.visible = true;
        // short bricks turn over once on the way; long ones just tilt (they would sweep through their neighbours)
        this.hopTo(b, sp, { dur: 0.8, arc: 1.4 + Math.random() * 0.5, spin: s.len < 1.8 ? (Math.random() < 0.5 ? -1 : 1) : 0, quiet: i % 3 !== 0 && i !== n - 1 });
        // the arm swing
        if (arms) {
          const a = arms[1], r0 = this.bearArms[1];
          this.s.anim(0.3, (_, p) => { a.rotation.z = r0.z - Math.sin(p * Math.PI) * 1.6; }).then(() => { a.rotation.z = r0.z; });
        }
      });
    });
    this.bear.userData.kick?.(new T.Vector3(0, 3, 0));
  }

  // ---------------- tapping a brick ----------------
  tapBrick(b) {
    if (this.dead) return;
    const placedAt = this.placedBricks.indexOf(b);
    if (placedAt >= 0) return this.tapPlaced(b);
    if (this.phase !== 'build' || this.placed + this.queued >= this.need) return;
    const k = this.pile.indexOf(b);
    if (k < 0) return;
    const slot = this.slots[b.userData.slotI];
    if (!slot || slot.taken) return;
    if (this.demoing) { fx.clearHands(); this.demoing = false; }
    this.pile.splice(k, 1);
    slot.taken = true;
    this.idle = 0;
    this.demoDone = true;   // already tapping: no need to show how
    this.clearHints();
    fx.clearHands();
    // one brick at a time: each lands as the count before it has been said
    const now = performance.now() / 1000;
    const at = Math.max(now, (this.flyAt || 0) + GAP);
    this.flyAt = at;
    this.setState(b, 'move');
    this.queued = (this.queued || 0) + 1;
    const go = () => { this.queued--; if (!this.dead) this.fly(b, slot); };
    if (at - now < 0.02) go();
    else { b.userData.mv = (b.userData.mv || 0) + 1; this.s.wait(at - now).then(go); }
  }

  // a tap on the letter's empty outline: that place's brick goes (or, if it is not on the stand, the next one)
  tapBoard(i) {
    if (this.dead || this.phase !== 'build' || !this.pile.length) return;
    const s = this.slots[i];
    const own = s && !s.taken ? this.pile.find((b) => b.userData.slotI === i) : null;
    this.tapBrick(own || this.nextBrick() || this.pile[0]);
  }
  // the brick for the first empty place in writing order (the hint target)
  nextBrick() {
    for (const s of this.slots) if (!s.taken) { const b = this.pile.find((q) => q.userData.slotI === s.i); if (b) return b; }
    return this.pile[0] || null;
  }

  async fly(b, slot) {
    const id = (b.userData.mv = (b.userData.mv || 0) + 1);
    this.setState(b, 'move');
    const a = b.position.clone(), r0 = b.rotation.z;
    const p1 = this.slotWorld(slot);
    // land square on the stroke; short bricks turn over once on the way (in a plane in front of the board)
    let r1 = slot.ang;
    while (r1 - r0 > Math.PI) r1 -= Math.PI * 2;
    while (r1 - r0 < -Math.PI) r1 += Math.PI * 2;
    if (slot.len < 1.8) r1 -= Math.PI * 2;
    const k = this.cfg.k;
    const h = 1.6 + a.distanceTo(p1) * 0.12;
    // it arcs over to a spot right in front of its place (clear of every brick already in), turned,
    // then presses straight in: it never sweeps through a neighbour
    const front = p1.clone(); front.z = this.faceZ + (BD + 0.12) * k + (BD / 2) * k + 0.08;
    const S1 = 0.76;
    b.rotation.x = b.rotation.y = 0;
    await this.s.anim(FLY, (e, q) => {
      if (q < S1) {
        const u = q / S1;
        b.position.lerpVectors(a, front, Ease.out(u));
        b.position.y += Math.sin(u * Math.PI) * h;
        b.rotation.z = r0 + (r1 - r0) * Ease.inOut(u);
        b.scale.setScalar(k * (1 + Math.sin(u * Math.PI) * 0.1));
      } else {
        const u = Ease.in((q - S1) / (1 - S1));
        b.position.set(p1.x, p1.y, front.z + (p1.z - front.z) * u);
        b.rotation.z = r1;
        b.scale.setScalar(k);
      }
    });
    if (this.dead || b.userData.mv !== id) return;
    b.position.copy(p1);
    b.rotation.set(0, 0, slot.ang);
    b.scale.setScalar(k);
    this.click(b, slot);
  }

  click(b, slot) {
    const i = slot.i;
    this.placedBricks[i] = b;
    this.setState(b, 'board');
    b.userData.rest = { p: b.position.clone(), r: b.rotation.z };
    this.placed++;
    const n = this.placed;
    b.userData.count = n;
    bsfx.click(n - 1);
    // the count, out loud (repeat: the same numbers come back every letter)
    if (NUMS[n - 1]) this.say(NUMS[n - 1], { voice: true, repeat: true, max: 0.6 });
    // pressed in: a quick squash into the board and back (only ever shrinks a touch, never into a neighbour)
    const k = this.cfg.k;
    this.s.anim(0.3, (_, q) => { const w = Math.sin(q * Math.PI) * (1 - q * 0.4); b.scale.set(k * (1 - 0.05 * w), k * (1 - 0.05 * w), k * (1 - 0.22 * w)); }).then(() => b.scale.setScalar(k));
    // its neighbours in the letter feel it: a tiny knock toward us and back
    for (const j of [i - 1, i + 1]) {
      const nb = this.placedBricks[j];
      if (!nb || nb.userData.state !== 'board' || nb.userData.wig) continue;
      const z0 = nb.userData.rest.p.z;
      this.s.wait(0.05).then(() => this.s.anim(0.25, (_, q) => { if (nb.userData.state === 'board' && !nb.userData.wig) nb.position.z = z0 + Math.sin(q * Math.PI) * 0.06; }).then(() => { if (nb.userData.state === 'board' && !nb.userData.wig) nb.position.z = z0; }));
    }
    const g = this.ghosts[i];
    if (g) g.visible = false;
    const last = n === this.need;
    this.countNum(n, b.userData.col, last ? 10 : 8);
    // Bear nods along with the count
    const bh = this.bear.userData.head;
    if (bh) this.s.anim(0.4, (_, q) => { bh.rotation.x = Math.sin(q * Math.PI) * 0.22; }).then(() => { bh.rotation.x = 0; });
    if (last) this.complete();
  }

  // One count number at a time, always in the same place beside the board (never over the letter).
  countNum(n, col, size) {
    if (this.numEl) this.numEl.remove();
    const host = document.getElementById('fx');
    fx.float(NUM_AT, String(n), { color: hexCss(col), size });
    const el = host && host.lastElementChild;
    if (el) el.style.textShadow = '0 0 0.5vmin #fff, 0 0 0.5vmin #fff, 0 0 0.9vmin #fff, 0 0.5vmin 0 rgba(42,36,64,.35)';
    this.numEl = el;
  }

  // a tap on a brick already in the letter: it lifts toward her and clicks back, and its count is said again
  tapPlaced(b) {
    if (b.userData.wig || b.userData.state !== 'board') return;
    b.userData.wig = true;
    bsfx.clack();
    const order = b.userData.count || 1;
    if (NUMS[order - 1]) this.say(NUMS[order - 1], { voice: true, repeat: true, max: 0.6 });
    this.countNum(order, b.userData.col, 8);
    const r = b.userData.rest;
    // straight out and in: never into a neighbour
    this.s.anim(0.45, (_, q) => { if (b.userData.state === 'board') b.position.z = r.p.z + Math.sin(q * Math.PI) * 0.35; }).then(() => { if (b.userData.state === 'board') b.position.z = r.p.z; b.userData.wig = false; });
  }

  // ---------------- the finished letter ----------------
  async complete() {
    this.phase = 'done';
    const ch = this.letter, W = WORDS[ch];
    // the next letter's bricks: Bear throws them in at once, so the first one can be tapped while this letter is
    // still going up to the sign (her wait from the last click stays under 1.5 s)
    if (this.round + 1 < this.totalRounds) this.prepareLetter(this.cfg.letters[this.round + 1]);
    // the held breath before the reveal
    await this.beat(null, 0.4);
    if (this.dead) return;
    bsfx.tada();
    // the letter wiggles and glows
    const cx = BX, cy = this.base + this.cfg.H / 2;
    const list = this.placedBricks.filter(Boolean);
    this.halo.scale.set(this.lay.W + 2.6, this.cfg.H + 2.6, 1);
    this.halo.position.set(cx, cy, this.faceZ + 0.006);
    this.s.anim(1.6, (_, p) => {
      const th = Math.sin(p * Math.PI * 3) * 0.07 * (1 - p), sc = 1 + Math.sin(Math.min(1, p * 2.5) * Math.PI) * 0.07;
      const co = Math.cos(th), si = Math.sin(th);
      for (const b of list) {
        if (b.userData.state !== 'board' || b.userData.wig) continue;
        const r = b.userData.rest;
        const dx = (r.p.x - cx) * sc, dy = (r.p.y - cy) * sc;
        b.position.set(cx + dx * co - dy * si, cy + dx * si + dy * co, r.p.z);
        b.rotation.z = r.r + th;
      }
      this.halo.material.opacity = Math.sin(Math.min(1, p * 1.6) * Math.PI) * 0.55;
    }).then(() => {
      for (const b of list) { if (b.userData.state !== 'board') continue; const r = b.userData.rest; b.position.copy(r.p); b.rotation.z = r.r; }
      this.halo.material.opacity = 0;
    });
    // Bear is delighted (face and arms; no hop: one celebration at a time)
    const bf = this.bear.userData.face;
    if (bf) { setFace(bf, 'joy'); this.s.wait(1.3).then(() => setFace(bf, 'happy')); }
    const arms = this.bear.userData.arms;
    if (arms) this.s.anim(1.2, (_, p) => { const up = Math.sin(Math.min(1, p * 1.4) * Math.PI) * 2.2; arms[0].rotation.z = this.bearArms[0].z + up; arms[1].rotation.z = this.bearArms[1].z - up; }).then(() => { arms[0].rotation.z = this.bearArms[0].z; arms[1].rotation.z = this.bearArms[1].z; });
    // the picture comes out beside the letter once the ta-da has rung; the round waits for its little show
    // (the round goes on once the picture has landed; its show carries on while the next letter is laid out)
    // (it resolves with the picture once its show is over; the next round fades it then)
    this.picShow = this.wait(0.6).then(() => this.showPicture(ch));
    this.payoffP = this.wait(0.35);
    this.success(new T.Vector3(cx, cy + 1.2, this.faceZ + 1), `${ch} is for ${W.word}!`, { voice: true, still: 0.1 });
  }
  showPicture(ch) {
    if (this.dead) return Promise.resolve(null);
    const g = makeWord(ch);
    const W = WORDS[ch];
    g.position.set(PIC.x, W.float || 0, PIC.z);
    const sh = blobShadowFor(g, W);
    if (sh) g.add(sh);
    this.root.add(g);
    // out from behind the board edge, landing on its spot
    const from = new T.Vector3(BX + 3.0, 3.2, BZ + 0.6), to = g.position.clone();
    g.position.copy(from);
    g.scale.setScalar(0.01);
    return this.s.anim(0.6, (e, q) => {
      g.position.lerpVectors(from, to, e);
      g.position.y += Math.sin(q * Math.PI) * 1.2;
      g.scale.setScalar(Math.max(0.01, Ease.out(Math.min(1, q * 1.4))));
    }, Ease.out).then(() => { g.position.copy(to); g.scale.setScalar(1); if (!this.dead) return showWord(this.s, g); }).then(() => g);
  }

  // The finished letter stays a moment (its bricks can be tapped and counted again), then it shrinks up onto the
  // sign on top of the board, where it stays all level. The last letter also stays on the board.
  async afterSuccess() {
    const idx = this.round - 1, last = this.round >= this.totalRounds;
    // the next letter's bricks: Bear throws them in now, while this letter goes up, so she never waits for them
    await this.wait(0.05);
    if (this.dead) return;
    const list = this.placedBricks.filter(Boolean);
    const cx = BX, cy = this.base + this.cfg.H / 2, z = this.faceZ;
    const g = new T.Group();
    g.position.set(cx, cy, z);
    this.root.add(g);
    if (last) {
      // a copy goes up to the sign; the real letter stays on the board for the finale
      for (const b of list) {
        const m = makeBrick(b.userData.col, b.userData.L * b.userData.k, this.cfg.k);
        m.position.copy(b.userData.rest.p).sub(g.position);
        m.rotation.set(0, 0, b.userData.rest.r);
        g.add(m);
      }
    } else {
      // the letter itself goes up: its bricks stop being answers and travel together
      for (const b of list) {
        input.remove(b.userData.drag);
        b.userData.drag = null;
        b.userData.state = 'sign';
        b.position.copy(b.userData.rest.p); b.rotation.set(0, 0, b.userData.rest.r); b.scale.setScalar(this.cfg.k);
        g.attach(b);
      }
      this.placedBricks = [];
    }
    this.minis.push(g);
    this.pokeable(g, { note: idx, of: this.totalRounds });
    // up and onto the sign: a gentle arc, shrinking as it goes, standing on the header's top
    const H = this.cfg.H;
    const to = new T.Vector3(this.signX[idx] ?? BX, this.signY + (H * SIGN_K) / 2 + 0.01, BZ + 0.08);
    const from = g.position.clone();
    bsfx.hop();
    const flyP = this.s.anim(0.85, (e, q) => {
      g.position.lerpVectors(from, to, e);
      g.position.z += Math.sin(q * Math.PI) * 0.8;          // out toward us and back in: never through the header
      g.scale.setScalar(1 + (SIGN_K - 1) * e);
    }, Ease.inOut).then(() => { g.position.copy(to); g.scale.setScalar(SIGN_K); bsfx.clack(); });
    // the next round's bricks start coming while it settles (no waiting); the finale waits for it to land
    if (last) await flyP;
    else await this.wait(0.1);
  }

  // lay out a letter's places and throw its bricks onto the (empty) stand ahead of its round
  prepareLetter(ch) {
    if (!ch) return;
    const H = this.cfg.H, t = BW * this.cfg.k;
    const lay = layoutLetter(ch, bricksFor(ch), { H, t });
    const slots = lay.slots.map((s, i) => ({ ...s, i, taken: false }));
    this.pre = { ch, lay, slots };
    this.throwIn(this.layoutStand(slots.map((s) => s.len)), slots);
  }

  // ---------------- every tap counts ----------------
  // Taps that hit no target (and every tap while the engine rests after fast tapping) still pick the nearest stand
  // brick, so a toddler tapping quickly is never ignored mid-letter.
  pokeAt(x, y) {
    if (!this.dead && this.phase === 'build' && this.placed + (this.queued || 0) < this.need) {
      let best = null, bd = Infinity;
      for (const b of this.pile) {
        const p = project(b.position);
        const r = Math.max(screenRadius(b.position, 0.75), Math.min(innerWidth, innerHeight) * 0.07);
        const d = Math.hypot(p.x - x, p.y - y) / r;
        if (d < 1 && d < bd) { bd = d; best = b; }
      }
      if (best) { this.tapBrick(best); return true; }
    }
    // a brick already in the finished letter (before it goes up): count it again
    if (!this.dead && this.phase === 'done') {
      for (const b of this.placedBricks) {
        if (!b || b.userData.state !== 'board') continue;
        const p = project(b.position);
        if (Math.hypot(p.x - x, p.y - y) < Math.max(screenRadius(b.position, 0.6), Math.min(innerWidth, innerHeight) * 0.05)) { this.tapPlaced(b); return true; }
      }
    }
    return super.pokeAt(x, y);
  }

  // ---------------- hints ----------------
  // the brick for the next place in writing order
  nudgeTarget() {
    if (this.phase !== 'build') return null;
    return this.nextBrick();
  }
  nudge(step) {
    const b = this.nudgeTarget();
    if (!b) return super.nudge(step);
    // it hops up and lands back on its spot (it stays tappable all the way)
    const sp = b.userData.spot, id = b.userData.mv;
    if (sp) this.s.anim(0.7, (_, q) => { if (b.userData.mv !== id || this.carrying === b) return; b.position.y = sp.p.y + Math.sin(q * Math.PI) * 0.5; b.rotation.z = sp.rz + Math.sin(q * Math.PI * 2) * 0.12; }).then(() => { if (b.userData.mv === id && this.carrying !== b && b.userData.state === 'pile') { b.position.copy(sp.p); b.rotation.z = sp.rz; } });
    if (step >= 2) { const stop = fx.halo(b, 0.75); this.s.wait(3).then(stop); }
  }
  // fast tapping is how this game is played: Pip enjoys it (no sound)
  mash() {
    const pf = this.pip.userData.face;
    if (pf) { setFace(pf, 'joy'); this.s.wait(0.7).then(() => { if (pf.userData.emotion === 'joy') setFace(pf, 'happy'); }); }
    hop(this.s, this.pip, 0.3, 0.35);
  }
  showHint(glowOn = true) {
    const b = this.nudgeTarget();
    if (!b) return;
    if (glowOn) this.addHalo(b, 0.75);
    fx.ghostPath([b.position.clone()], { mode: 'tap' });
  }
  makeErrorless() { const b = this.nudgeTarget(); if (b) this.addHalo(b, 0.75); }

  // ---------------- the finale: the sign of letters (and the last letter on the board) ----------------
  creationView() { return { pos: new T.Vector3(BX + 0.9, 5.0, 14.4), look: new T.Vector3(BX + 0.9, 4.05, BZ) }; }
  creationObjects() { return this.minis.slice(); }
  onFinale() {
    const bf = this.bear.userData.face;
    if (bf) { setFace(bf, 'joy'); this.s.wait(1.4).then(() => setFace(bf, 'happy')); }
  }

  // ---------------- every frame ----------------
  update(dt, t) {
    // the next place breathes softly so you can see where a brick goes; the very last one breathes slower
    const nb = this.phase === 'build' ? this.nextBrick() : null;
    const nextI = nb ? nb.userData.slotI : -1;
    const left = this.need - this.placed - (this.queued || 0);
    const sp = left <= 1 ? 1.7 : 3;
    for (let i = 0; i < this.ghosts.length; i++) {
      const g = this.ghosts[i];
      if (!g.visible) continue;
      const on = i === nextI || (this.carrying && this.carrying.userData.slotI === i);
      const m = g.userData.fill.material;
      const k = on ? 0.5 + 0.5 * Math.sin(t * sp) : 0;
      m.color.setHex(0xead3a6).lerp(_hi, k * 0.85);
    }
  }
}
const _hi = new T.Color(0xfff6c8);

// a soft shadow under the picture (on the sand, also under a floating one)
function blobShadowFor(g, W) {
  const sh = blobShadow(0.85);
  sh.position.y = 0.02 - (W.float || 0);
  return sh;
}
