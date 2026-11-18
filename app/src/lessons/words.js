// Word world (docs/design/words.md). Topics mt_NP101Zl-4g "Using New Vocabulary", mt_mB7DVai-Uf "Listening and
// responding", mt_oL9s_bufDp "Sorting & Categorising Words" (also mt_6-MYToNZ39, mt_6lHBTwQPrS, mt_yBJyCfhtem,
// mt_xppl18avyY, mt_zVLOm6U7bh, mt_83gRQ9OPkc).
// She walks Pip through two little corners ("nooks") of one place. Everything she taps comes alive and says its name
// (the second tap says a little more). Then Pip asks "Where's the cup?" and her tap takes its photo, which goes on
// the photo line. At the end she taps every photo into her own word book, which keeps them for ever.
//   Level 1: meet six things, then find each one out of two.   Level 2: find out of three, plus two "again" rounds.
//   Level 3: find out of three, then a long toy train of toys she knows waits at the rug and she takes each one home.
// Which words come today is decided by the planner (words-plan.js): new words arrive a couple at a time, each one
// comes back at its place's next turn, then at widening gaps; a word only appears once its model is built.
// Rule 0 (FEEL-BRIEF): every round takes her touch at once. The camera glides and Pip walks while she already plays;
// the photo flies to its peg while the next question is asked; the train is parked with every load before she arrives.
import * as T from '../three.js';
import { Lesson } from '../engine/lesson.js';
import { input } from '../engine/input.js';
import { fx, HAND_SVG } from '../engine/fx.js';
import { sfx } from '../engine/audio.js';
import { setCamera, camera, project } from '../engine/stage.js';
import { Ease } from '../engine/tween.js';
import { setFace } from '../engine/actors.js';
import { voiceBusy } from '../engine/speech.js';
import { store } from '../engine/store.js';
import { toon } from '../engine/toon.js';
import { BY_ID, NOOKS, NOOK_WORDS, PLACE_BY_ID, PLACES, HOMES, LINES } from './words-list.js';
import * as P from './words-plan.js';
import * as S from './words-scene.js';

const V = (x, y, z) => new T.Vector3(x, y, z);
// camera views: look point, distance, elevation (words.md 6.3: elevation 0.30-0.45, never a cut)
function view(lx, ly, lz, d, el = 0.36) { const look = V(lx, ly, lz); return { look, pos: look.clone().add(V(0, Math.sin(el) * d, Math.cos(el) * d)) }; }
const SAME_GAP = 4000;          // the same line is never spoken twice within 4 s (caption only)
const MEET_IDLE = 4;            // all three met and no touch for 4 s: on to the next nook
const MEET_MAX = 15;            // ... or 15 s after all three are met, even if she keeps tapping
const SORT_DEMO = 8;            // stuck in Tidy: the drag demo again after 8 s
const PIP_SCALE = 0.52;
const CZ = -2.55;               // Pip's ledge behind the easel (clear of its back legs)
const PIP_BOOK_X = 3.75;        // where Pip watches the book from: the end of nook A's ledge, clear of the photos and the easel
const BOOK_CARD = 1.8;          // in the book phase the photos of the half she is filling grow from 1.2 to this (easy to tap)
const BG = { animals: 0xe9f6d8, home: 0xfff0d6, food: 0xffe8d6, toys: 0xe4efff, vehicles: 0xe6f2f8, clothes: 0xf6e6ff, body: 0xffeede, outdoors: 0xdff3ff, people: 0xfff3d6 };
// listen rounds only for sounds a 2-year-old links to one thing (W20)
const LISTEN = new Set(['woof', 'meow', 'moo', 'quack', 'oink', 'baa', 'neigh', 'cluck', 'cheep', 'tweet', 'buzz', 'ribbit', 'hoot', 'trumpet', 'monkey', 'ring', 'choo', 'neenaw', 'honk', 'bell']);

export default class WordsLesson extends Lesson {
  get totalRounds() { return this.plan ? this.plan.finds.length + (this.sortN || 0) : 6; }

  // ================================================================ build
  build() {
    this.voiceLines = false;
    this.storage = (() => { try { return window.localStorage; } catch (e) { return null; } })();
    this.mem = P.loadMemory(this.storage);
    this.mem.taught = this.mem.taught || {};
    this.today = P.dayNumber();
    const force = window.__wordsForce || null;
    this.plan = P.planVisit(this.mem, { level: this.level, avail: S.available, today: this.today, force });
    if (!this.plan) { this.plan = P.planVisit(P.blankMemory(), { level: this.level, avail: S.available, today: this.today }); }
    const plan = this.plan;
    this.place = PLACE_BY_ID[plan.place];
    // the place line is the game's greeting (one greeting, not two: W11, W12)
    this.placeLine = this.place.id === 'body' ? (NOOKS[plan.nooks[0]].char ? 'Hello, Bear!' : "Let's look at me!") : this.place.line;
    this.meta = { ...this.meta, intro: this.placeLine };
    this.sortN = plan.sort ? plan.sort.loads.length * 3 : 0;
    this.bg = BG[plan.place] || 0xfff3d6;
    this.meadow.visible = false;
    this.root.add(S.makeBackdrop());
    // ---- the two nooks
    this.nk = ['A', 'B'].map((k, n) => {
      const id = plan.nooks[n], cx = S.NOOK_X[n];
      const set = S.makeNookSet(id, cx);
      this.root.add(set.group);
      return { key: k, id, n, cx, N: NOOKS[id], set, things: [], slots: plan.slots[k] };
    });
    // Pip's ledge: one run behind each nook, and a short run behind the easel joining them
    for (const nk of this.nk) this.root.add(S.makeLedgeRun(nk.N.ledge, nk.cx - (nk.n ? 3.8 : 4.4), nk.cx + 4.4));
    const join = S.makeLedgeRun(this.nk[0].N.ledge, 3.9, 9.2); join.position.z = CZ; this.root.add(join);
    // ---- the things (or, in a Me nook, the parts of one big bear)
    this.things = [];
    for (const nk of this.nk) this.buildThings(nk);
    // ---- photo line, easel and book
    const xs = [...this.nk[0].things, ...this.nk[1].things].map((t) => t.userData.slotX);
    this.line = S.makeLine(xs);
    this.root.add(this.line);
    this.pegs = this.line.userData.pegs;
    this.easel = S.makeEasel();
    this.easel.position.set(S.EASEL_X, 0, -0.7);
    this.root.add(this.easel);
    this.book = S.makeBook();
    this.book.position.copy(this.easel.position).add(this.easel.userData.rest);
    this.root.add(this.book);
    this.root.updateMatrixWorld(true);
    this.buildPages();
    S.setBookOpen(this.book, 0);
    this.viewfinder = S.makeViewfinder();
    this.root.add(this.viewfinder);
    // ---- Pip on the ledge behind nook A, between the middle and right things, with his camera
    const pip = this.pip;
    pip.scale.setScalar(PIP_SCALE); pip.userData.baseScale = PIP_SCALE;
    pip.position.set(this.gapX(this.nk[0], 1), S.LEDGE.y, S.LEDGE.z);
    pip.rotation.y = 0;
    this.cam = S.makePipCamera();
    const body = pip.userData.body || pip;
    this.pipCamRest = V(0, 0.95, 0.62);
    this.cam.position.copy(this.pipCamRest);
    body.add(this.cam);
    // ---- Level 3: the tidy rug, homes and the train already parked with every load
    if (plan.sort) this.buildTidy();
    // Pip's path along the ledges (he never walks through the air or the easel): x -> z knots
    this.knots = [[-1e3, S.LEDGE.z], [3.85, S.LEDGE.z], [4.25, CZ], [8.85, CZ], [9.25, S.LEDGE.z], [16.7, S.LEDGE.z]];
    this.knots.push(...(plan.sort ? [[18.3, -3.3], [1e3, -3.3]] : [[1e3, S.LEDGE.z]]));
    // ---- camera: close on nook A (words.md 3.3)
    this.camNow = this.trioView(this.nk[0]);
    setCamera(this.camNow.pos, this.camNow.look);
    this.setGoSide(this.camNow);
    this.phase = 'arrive';
    this.res = { firsts: 0, finds: 0, sortFirst: 0, sorts: 0, sortMisses: 0 };
    this.lastLine = new Map();
    this.tapTimes = [];
    this.photos = new Map();   // word id -> card on the line
    this.missed = new Set();
    this.foundLog = [];
    this.listenN = 0;
    this.lastTouch = performance.now();
    this.offs.push(input.onAny(() => { this.lastTouch = performance.now(); this.sortStuck = 0; this.stopHand(); }));
    // leaving early (the 45 s idle exit, or the parent) still keeps what the visit did (W19); then the memory is saved
    this.offs.push(() => this.closeVisit());
    this.offs.push(() => this.saveMem());
    this.offs.push(() => this.stopHand());
    this.offs.push(() => S.disposePhotos());
    // warm the photo look up now (its shaders compile here, at load, not at her first find)
    try { const t0 = this.things.find((t) => !t.userData.isPart); if (t0) { S.photoTexture(t0, { bg: this.bg, size: 64 }); S.disposePhotos(); } } catch (e) { /* */ }
    // older photos of today's two pages are drawn quietly in the background (words.md 8.2)
    this.queueOldPhotos();
  }

  buildThings(nk) {
    const N = nk.N;
    if (N.char) {
      // one big character in the middle; the three words are three of its parts (words.md 8.4)
      const w0 = BY_ID[nk.slots[0]];
      const big = S.makeThing(w0, 'B');
      big.position.set(nk.cx, 0, -0.25);
      this.root.add(big);
      nk.big = big;
      nk.slots.forEach((id, i) => {
        const w = BY_ID[id], mo = S.modelOf(w);
        const tgt = S.partTarget(big, mo.part);
        const t = new T.Group();      // a light handle for the part (the bear itself moves)
        t.userData = { w, word: id, part: mo.part, big, target: tgt, inner: big.userData.inner, pose: big.userData.pose, model: big.userData.model, h: big.userData.h, isPart: true };
        this.root.add(t);
        this.finishThing(nk, t, i);
      });
      return;
    }
    nk.slots.forEach((id, i) => {
      const w = BY_ID[id];
      const t = S.makeThing(w);
      if (!t) return;
      const x = nk.cx + S.SLOT_DX[i];
      let y = 0;
      if (w.size === 'S' && N.stand) {
        const st = S.makeStand(N.stand, N.kind === 'in' && N.stand === 'prop_blk_cube' ? 0x7fb8f0 : null);   // a white cube is tinted (never white on a pale floor)
        if (st) { st.position.set(x, 0, 0); nk.set.group.add(st); st.position.x -= nk.cx; y = st.userData.top; t.userData.stand = st; }
      }
      // the sky things stand up high on stems (sun, moon, star...)
      if (N.sky) { y = 0.95; const st = S.makeStem(y + 0.05); st.position.set(x, 0, 0); this.root.add(st); }
      t.position.set(x, y, 0);
      this.root.add(t);
      this.root.updateMatrixWorld(true);
      // a body part: on a character standing in a slot ('friends' nook), or on the word's own prop (finger, toes,
      // teeth, tongue): the target, the ring and the tap are that part only
      if (t.userData.part) t.userData.target = S.partTarget(t, t.userData.part);
      this.finishThing(nk, t, i);
    });
  }
  finishThing(nk, t, i) {
    const u = t.userData;
    u.nk = nk; u.slot = i; u.taps = 0; u.met = false;
    u.slotX = nk.cx + S.SLOT_DX[i];
    if (u.isPart) {
      const p = u.target.getWorldPosition(V(0, 0, 0));
      u.slotX = p.x;
      u.ring = S.makePartRing(0.22 * (nk.big.userData.h / 3.3));
      u.ring.position.copy(p).add(V(0, 0, 0.18));
      this.root.add(u.ring);
      u.tap = input.addTap(u.target, { radius: 0.32, onTap: () => this.tapThing(t) });
    } else {
      if (u.target) {
        const pr = S.partRadius(u.target);
        u.ring = S.makePartRing(pr ? Math.min(0.42, Math.max(0.2, pr * 1.05)) : 0.2);
        this.root.add(u.ring);
        u.tap = input.addTap(u.target, { radius: pr ? Math.max(0.32, pr + 0.1) : 0.3, onTap: () => this.tapThing(t) });
      } else {
        u.ring = S.makeRing(0.9);
        u.ring.position.set(t.position.x, 0, 0);
        this.root.add(u.ring);
        u.tap = input.addTap(t, { radius: Math.max(0.62, Math.min(0.85, Math.max(u.h, u.wid) * 0.5)), offset: V(0, u.h * 0.5, 0.1), onTap: () => this.tapThing(t) });
      }
    }
    u.tap.enabled = false;
    u.peg = this.things.length;
    nk.things.push(t);
    this.things.push(t);
  }
  gapX(nk, side) { return nk.N.char ? nk.cx + 2.45 : nk.cx + (side ? 1.2 : -1.2); }

  // ---- the word book: two pages (nook A left, nook B right), 12 fixed places each, rebuilt from the memory
  buildPages() {
    const pages = this.book.userData.pages, cover = this.book.userData.cover;
    this.places = new Map();      // word id -> { page, idx, slot (Object3D), photo }
    pages.updateMatrixWorld(true);
    const pq = pages.getWorldQuaternion(new T.Quaternion());
    this.nk.forEach((nk, page) => {
      // the left page rides on the cover, so shutting the book covers it
      const parent = page === 0 && cover ? cover : pages;
      parent.updateMatrixWorld(true);
      const iq = parent.getWorldQuaternion(new T.Quaternion()).invert();
      (NOOK_WORDS[nk.id] || []).slice(0, 12).forEach((id, idx) => {
        const slot = new T.Group();
        const wp = pages.localToWorld(S.bookPlace(page, idx));
        slot.position.copy(parent.worldToLocal(wp));
        slot.quaternion.copy(iq).multiply(pq);
        parent.add(slot);
        const empty = S.makeEmptyPlace();
        slot.add(empty);
        this.places.set(id, { page, idx, slot, empty, photo: null });
      });
    });
  }
  setPlacePhoto(id, tex) {
    const pl = this.places.get(id);
    if (!pl || !tex) return null;
    if (pl.photo) { pl.slot.remove(pl.photo); }
    const card = S.makeCard(tex);
    card.scale.setScalar(S.PLACE_SIZE / 0.62);
    pl.slot.add(card);
    pl.empty.visible = false;
    pl.photo = card;
    if (P.box(this.mem, id) >= 4) card.userData.star.visible = true;
    card.userData.word = id;
    return card;
  }
  // a quiet photo of a word for its book place (a body part: close on that part, shown)
  renderPlace(id) {
    try {
      const w = BY_ID[id], m = S.modelOf(w);
      if (!m) return;
      let c = null;
      if (m.part) {
        const big = S.makeThing(w, 'B');
        big.updateMatrixWorld(true);
        const tg = S.partTarget(big, m.part); big.updateMatrixWorld(true);
        const pr = S.partRadius(tg);
        S.partPose(big, m.part, 1);
        c = S.photoTexture(big, { bg: this.bg, size: 128, focus: tg.getWorldPosition(V(0, 0, 0)), radius: pr ? pr * S.partZoom(m.part) : big.userData.h * 0.16, el: S.partElevation(m.part) });
      } else { const t = S.makeThing(w); c = S.photoTexture(t, { bg: this.bg, size: 128 }); }
      this.setPlacePhoto(id, c);
    } catch (e) { console.warn('old photo', id, e); }
  }
  queueOldPhotos() {
    // only the words that will be asked today are left for her own photos (W8)
    const asked = new Set(this.plan.finds.map((f) => f.word).filter(Boolean));
    const todo = [...this.places.keys()].filter((id) => !asked.has(id) && P.box(this.mem, id) >= 1 && S.available(id)).slice(0, 18);
    let i = 0;
    const next = () => {
      if (this.dead || i >= todo.length) return;
      this.renderPlace(todo[i++]);
      this.s.wait(0.25).then(next);
    };
    this.s.wait(1.5).then(next);
  }

  buildTidy() {
    const sort = this.plan.sort;
    const g = new T.Group();
    g.position.x = S.TIDY_X;
    this.root.add(g);
    this.tidy = { group: g };
    const mat = new T.Mesh(new T.CylinderGeometry(1, 1, 0.05, 56), toon(0xf6d6e2));
    mat.scale.set(5.2, 1, 2.3); mat.position.set(0, 0.03, -0.9); g.add(mat);
    const n = sort.groups.length;
    const hx = n === 2 ? [-1.85, 1.85] : [-3.3, 0, 3.3];
    this.homes = sort.groups.map((grp, i) => {
      const h = S.makeHome(grp, HOMES[grp].model);
      h.position.set(S.TIDY_X + hx[i], 0, -1.5);
      this.root.add(h);
      h.userData.said = false;
      h.userData.onNear = (k, obj) => { if (obj?.userData?.toy?.group === grp && !h.userData.shut) S.homeNear(h, k); };
      return h;
    });
    // Pip's fence from nook B's end to behind the rug; the track along the front of the rug
    const lg = S.makeLedgeRun('fence', 17.8, S.TIDY_X + 4.7); lg.position.z = -3.3;
    this.root.add(lg);
    this.tidyPipX = S.TIDY_X + (n === 2 ? 0 : 1.65);
    // the train (engine + three carts, 0.8 size so it fits the view with the homes) stands at the rug from the start;
    // the toy chest at the end of the line holds the next loads: they hop out into the empty carts (rule 0: nothing
    // arrives from far away, and all of it is in frame)
    const TK = 0.8;
    const tr = S.makeTrack(S.TIDY_X - 2.75, S.TIDY_X + 5.6, 1.25); if (tr) this.root.add(tr);
    this.train = S.makeTrain(3);
    this.train.scale.setScalar(TK);
    this.train.position.set(S.TIDY_X + 4.1 * TK, 0.07, 1.25);   // the middle cart in front of the rug's middle
    this.root.add(this.train);
    this.chest = S.makeToyChest();
    if (this.chest) { this.chest.position.set(S.TIDY_X - 3.55, 0, 1.2); this.root.add(this.chest); }
    this.root.updateMatrixWorld(true);
    const carts = this.train.userData.carts;
    this.toys = [];
    sort.loads.forEach((load, k) => load.forEach((t, j) => {
      const toy = S.makeThing(BY_ID[t.id], 'T');
      if (!toy) return;
      toy.userData.toy = t; toy.userData.load = k; toy.userData.cart = carts[j];
      // load 0 rides in the carts; the later loads wait (out of sight) inside the chest
      toy.userData.inCart = k === 0;
      if (k > 0) { toy.visible = false; if (this.chest) toy.position.copy(this.chest.position).add(V(0, 0.1, 0)); }
      this.root.add(toy);
      this.toys.push(toy);
    }));
    this.placeToys();
    for (const toy of this.toys) {
      toy.userData.drag = input.addDrag(toy, {
        radius: 0.6, offset: V(0, 0.4, 0),
        zones: () => this.homes.filter((h) => !h.userData.shut).map((h) => ({ obj: h, pos: h.position.clone().add(V(0, 1.2, 0.3)), radius: 1.3, home: h, onNear: h.userData.onNear })),
        onPick: () => this.pickToy(toy),
        onDrop: (z, info) => this.dropToy(toy, z, info),
      });
      toy.userData.drag.enabled = false;
    }
    // her tap on the engine: a toot and a little bounce
    const eng = this.train.userData.engine;
    if (eng) this.engineTap = input.addTap(eng, { radius: 1.0, offset: V(0, 0.8, 0), onTap: () => this.tootTrain() });
  }

  // ================================================================ voice
  // Every line through here: the same line never twice within 4 s (caption only; force skips that); the engine's
  // 30 s rule is bypassed with repeat: true, because naming on every tap is the point of this game.
  speak(line, { voice = true, max, force = false } = {}) {
    if (!line) return Promise.resolve();
    const now = performance.now(), last = this.lastLine.get(line) || -1e9;
    const v = voice && (force || now - last > SAME_GAP) && !this.hushVoice;
    if (v) this.lastLine.set(line, now);
    return this.say(line, { voice: v, repeat: true, max });
  }
  promptText() {
    if (this.phase === 'meet') return LINES.what;
    if (this.phase === 'find' && this.target) return this.target.userData.w.where;
    if (this.phase === 'sort') return LINES.take;
    if (this.phase === 'book') return LINES.book;
    return '';
  }
  // the inactivity ladder re-shows the prompt as a caption (the first "What's that?" of a visit is voiced)
  prompt() {
    const t = this.promptText();
    if (!t) return;
    const voice = this.phase === 'meet' ? !this.whatSaid : false;
    if (this.phase === 'meet') this.whatSaid = true;
    this.speak(t, { voice });
  }
  // the Go! badge again (before nook B and before the first question): the engine shows it once the round is open
  armGo() { this.goPending = true; this.goT0 = performance.now(); }

  // ================================================================ hand demos (slow; words.md 3.3, FEEL-BRIEF 2)
  // A slow ghost hand: floats in, presses (tap) or carries (drag), lets go. DOM only; at the press, onPress runs;
  // during the carry onCarry(m) runs (0..1); onEnd runs once when it ends or a touch stops it.
  hand(from3, to3 = null, { onPress = null, onCarry = null, onEnd = null, dur = 1 } = {}) {
    this.stopHand();
    const a = project(from3), b = to3 ? project(to3) : null;
    const el = document.createElement('div');
    el.className = 'ghost-hand';
    el.innerHTML = HAND_SVG;
    document.getElementById('fx').appendChild(el);
    const sx = a.x + 110, sy = a.y + 150;
    const F = to3
      ? [[sx, sy, 0, 0], [a.x, a.y, 0, 0.9 * dur], [a.x, a.y, 1, 0.3], [b.x, b.y, 1, 1.4 * dur], [b.x, b.y, 0, 0.3], [b.x, b.y, 0, 0.5]]
      : [[sx, sy, 0, 0], [a.x, a.y, 0, 0.95 * dur], [a.x, a.y, 1, 0.28], [a.x, a.y, 0, 0.3], [a.x, a.y, 0, 0.55]];
    const total = F.reduce((s, f) => s + f[3], 0);
    const t0 = performance.now();
    let pressed = false, stop = false, ended = false, carried = false;
    const ease = (m) => (m < 0.5 ? 2 * m * m : 1 - (-2 * m + 2) ** 2 / 2);
    const step = (now) => {
      if (stop) return;
      const t = (now - t0) / 1000;
      let acc = 0, i = 1;
      while (i < F.length && acc + F[i][3] < t) { acc += F[i][3]; i++; }
      if (i >= F.length) { this.stopHand(); return; }
      const A = F[i - 1], B = F[i], m = B[3] ? ease(Math.min(1, (t - acc) / B[3])) : 1;
      const x = A[0] + (B[0] - A[0]) * m, y = A[1] + (B[1] - A[1]) * m, pr = B[2] && (A[2] || m > 0.5);
      el.style.transform = `translate(${x}px, ${y}px) scale(${pr ? 0.86 : 1})`;
      el.style.opacity = t < 0.25 ? t * 4 * 0.85 : t > total - 0.4 ? Math.max(0, (total - t) / 0.4) * 0.85 : 0.85;
      if (pr && !pressed) {
        pressed = true;
        const r = document.createElement('div'); r.className = 'tap-ripple'; r.style.left = x + 'px'; r.style.top = y + 'px';
        document.getElementById('fx').appendChild(r); setTimeout(() => r.remove(), 600);
        if (onPress) try { onPress(); } catch (e) { console.error(e); }
      }
      if (onCarry && to3) {
        try { if (i === 3) onCarry(m); else if (i > 3 && !carried) { carried = true; onCarry(1); } } catch (e) { console.error(e); }
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    this.handStop = () => { stop = true; el.remove(); if (!ended) { ended = true; if (onEnd) try { onEnd(); } catch (e) { console.error(e); } } };
    return new Promise((res) => this.s.wait(total + 0.1).then(res));
  }
  stopHand() { if (this.handStop) { const f = this.handStop; this.handStop = null; f(); } }
  centreOf(t) {
    const u = t.userData;
    if (u.target) return u.target.getWorldPosition(V(0, 0, 0));
    return t.position.clone().add(V(0, u.h * 0.5, 0.2));
  }

  // ================================================================ camera
  // A view that fits these world points: at most mx of the width, clear of the caption and buttons at the top
  // (the review: things about 90% of the width, never cut by an edge; their photos on the line in frame too).
  fitView(pts, { el = 0.34, mx = 0.9, top = 0.7, bottom = 0.9, avoid = [] } = {}) {
    const box = new T.Box3().setFromPoints(pts), c = box.getCenter(V(0, 0, 0));
    const cam = camera.clone(); cam.aspect = camera.aspect; cam.fov = camera.fov; cam.updateProjectionMatrix();
    const span = (d, ly) => {
      const v = view(c.x, ly, c.z, d, el);
      cam.position.copy(v.pos); cam.lookAt(v.look); cam.updateMatrixWorld();
      let lo = 9, hi = -9, wx = 0;
      for (const p of pts) { const q = p.clone().project(cam); if (q.z > 1) return null; wx = Math.max(wx, Math.abs(q.x)); lo = Math.min(lo, q.y); hi = Math.max(hi, q.y); }
      return { lo, hi, wx };
    };
    const ok = (r) => r && r.wx <= mx && r.hi - r.lo <= top + bottom;
    let a = 1.5, b = 40;
    for (let i = 0; i < 28; i++) { const m = (a + b) / 2; if (ok(span(m, c.y))) b = m; else a = m; }
    // slide the look point up or down so the points sit between the bottom margin and the top one
    const th = Math.tan((cam.fov * Math.PI) / 360);
    let ly = c.y;
    for (let i = 0; i < 6; i++) {
      const r = span(b, ly); if (!r) break;
      ly += ((r.lo + r.hi) / 2 - (top - bottom) / 2) * b * th;
    }
    // avoid: points that must not be cut by an edge (a neighbour's photo): slide sideways until they are out of frame
    if (avoid.length) {
      const inX = (lx) => { const v = view(lx, ly, c.z, b, el); cam.position.copy(v.pos); cam.lookAt(v.look); cam.updateMatrixWorld(); return [Math.max(...pts.map((p) => Math.abs(p.clone().project(cam).x))), Math.min(...avoid.map((p) => Math.abs(p.clone().project(cam).x)))]; };
      const away = Math.sign(c.x - avoid.reduce((a, p) => a + p.x, 0) / avoid.length) || 1;
      let lx = c.x;
      let clear = false;
      for (let i = 0; i < 30; i++) { const [inMax, outMin] = inX(lx); if (outMin > 1.02) { clear = true; break; } if (inMax > 0.97) break; lx += away * 0.08; }
      // it cannot be pushed out: take it fully in instead (never a photo cut by the edge)
      if (!clear) return this.fitView([...pts, ...avoid], { el, mx, top, bottom });
      return view(lx, ly, c.z, b, el);
    }
    return view(c.x, ly, c.z, b, el);
  }
  // Which top corner the Go! badge uses this round: the one where Pip and the hanging photos are not, judged in
  // the view the camera is going to (engine: this.goSide = 'left' puts it under the home button).
  setGoSide(v) {
    const cam = camera.clone(); cam.aspect = camera.aspect; cam.fov = camera.fov; cam.updateProjectionMatrix();
    cam.position.copy(v.pos); cam.lookAt(v.look); cam.updateMatrixWorld();
    const pts = [];
    const pg = this.pipGoal || this.pip.position;
    for (const dx of [-0.5, 0, 0.5]) for (const dy of [0.2, 0.8, 1.4]) pts.push(V(pg.x + dx, pg.y + dy, pg.z));
    for (const c of this.photos?.values() || []) if (c.visible && c.parent === this.root) { const p = c.getWorldPosition(V(0, 0, 0)); for (const dx of [-0.37, 0.37]) for (const dy of [-0.44, 0.44]) pts.push(V(p.x + dx, p.y + dy, p.z)); }
    let right = 0, left = 0;
    for (const p of pts) { const q = p.clone().project(cam); if (q.y > 0.4 && q.y < 0.82) { if (q.x > 0.6) right++; if (q.x < -0.6) left++; } }
    this.goSide = right > left ? 'left' : 'right';
  }
  boxPts(o, pad = 0) {
    const b = new T.Box3().setFromObject(o);
    if (b.isEmpty()) return [];
    b.expandByScalar(pad);
    const out = [];
    for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) out.push(V(x, y, z));
    return out;
  }
  // the photo line above these slots: the peg tops and where a hanging photo ends
  linePts(things) {
    const out = [];
    for (const t of things) { const pg = this.pegs[t.userData.peg]; if (!pg) continue; out.push(V(pg.x - 0.4, pg.y + 0.14, pg.z), V(pg.x + 0.4, pg.y + 0.14, pg.z), V(pg.x, pg.y - 0.95, pg.z)); }
    return out;
  }
  trioView(nk) {
    if (nk.N.char) return this.charView(nk);
    return this.fitView([...nk.things.flatMap((t) => [...this.boxPts(t), ...(t.userData.stand ? this.boxPts(t.userData.stand) : [])]), ...this.linePts(nk.things)]);
  }
  pairView(nk, pair) {
    const two = pair.map((i) => nk.things[i]);
    return this.fitView([...two.flatMap((t) => [...this.boxPts(t), ...(t.userData.stand ? this.boxPts(t.userData.stand) : [])]), ...this.linePts(two)], { el: 0.33 });
  }
  charView(nk) {
    // the big bear: 'face' frames head and neck; 'body' frames shoulders to toes (words.md 8.4)
    const H = nk.big.userData.h;
    if (nk.N.frame === 'face') return view(nk.cx, H * 0.7, -0.2, 4.6, 0.3);
    return view(nk.cx, H * 0.36, -0.2, 6.6, 0.32);
  }
  // the homes, the three carts with the engine, and the toy chest: all inside 92% of the width
  tidyView() { return this.fitView([...this.homes.flatMap((h) => this.boxPts(h)), ...this.boxPts(this.train), ...(this.chest ? this.boxPts(this.chest) : [])], { mx: 0.92 }); }
  // one half of the line (its photos) and the book, all in frame before "Tap a picture!"
  // one half of the line (its photos, grown for tapping) and the book, all in frame before "Tap a picture!"; the
  // other half's nearest photo is kept fully out of frame rather than cut by the edge (QA-FINAL-B)
  lineView(n) {
    const mine = this.nk[n].things.filter((t) => this.photos.has(t.userData.word));
    const pts = [];
    for (const t of mine) { const pg = this.pegs[t.userData.peg]; const hw = 0.31 * BOOK_CARD + 0.05, hh = 0.74 * BOOK_CARD; pts.push(V(pg.x - hw, pg.y + 0.14, pg.z), V(pg.x + hw, pg.y + 0.14, pg.z), V(pg.x - hw, pg.y - hh, pg.z), V(pg.x + hw, pg.y - hh, pg.z)); }
    const other = this.nk[1 - n].things.filter((t) => this.photos.has(t.userData.word) && !this.photos.get(t.userData.word).userData.inBook)
      .sort((a, b) => Math.abs(a.userData.slotX - S.EASEL_X) - Math.abs(b.userData.slotX - S.EASEL_X)).slice(0, 1);   // the nearest one
    const avoid = other.flatMap((t) => { const pg = this.pegs[t.userData.peg]; return [V(pg.x - 0.42, pg.y + 0.1, pg.z), V(pg.x + 0.42, pg.y + 0.1, pg.z), V(pg.x - 0.42, pg.y - 0.92, pg.z), V(pg.x + 0.42, pg.y - 0.92, pg.z)]; });
    return this.fitView([...pts, ...this.boxPts(this.easel)], { el: 0.3, top: 0.66, avoid });
  }
  // the photos of one half grow on their pegs so they are easy to tap (they swing a little as they do)
  growCards(n) {
    for (const t of this.nk[n].things) {
      const c = this.photos.get(t.userData.word);
      if (!c || c.userData.inBook || c.userData.grown || !c.userData.hung) continue;
      c.userData.grown = true;
      const pg = this.pegs[t.userData.peg];
      const s0 = c.scale.x;
      this.s.anim(0.5, (e, p) => {
        if (c.userData.inBook) return;
        const k = s0 + (BOOK_CARD - s0) * e;
        c.scale.setScalar(k);
        c.position.set(pg.x, pg.y - 0.02 - (c.userData.h * k) / 2, pg.z);
        c.rotation.z = Math.sin(p * Math.PI * 3) * 0.06 * (1 - p);
      }, Ease.out).then(() => { if (!c.userData.inBook) c.rotation.z = 0; });
      if (c.userData.tap) c.userData.tap.radius = 0.55 * BOOK_CARD / 1.2;
    }
  }
  // the finale: close on her photos in the book (the filled places only), not on a page of empty boxes
  bookView() {
    const pts = [];
    for (const pl of this.places.values()) if (pl.photo) { const p = pl.slot.getWorldPosition(V(0, 0, 0)); const h = S.PLACE_SIZE * 0.7; pts.push(V(p.x - h, p.y - h, p.z), V(p.x + h, p.y + h, p.z)); }
    if (!pts.length) return view(S.EASEL_X, this.book.position.y + 0.9, this.book.position.z - 0.2, 4.25, 0.3);
    return this.fitView(pts, { el: 0.3, mx: 0.86, top: 0.62, bottom: 0.8 });
  }
  glide(v, dur = 0.8) {
    const p0 = this.camNow.pos.clone(), l0 = this.camNow.look.clone();
    this.camNow = { pos: v.pos.clone(), look: v.look.clone() };
    const id = (this.camId = (this.camId || 0) + 1);
    const cp = V(0, 0, 0), cl = V(0, 0, 0);
    return this.s.anim(dur, (e) => { if (this.camId === id) setCamera(cp.lerpVectors(p0, v.pos, e), cl.lerpVectors(l0, v.look, e)); }, Ease.inOut);
  }
  // glide time for a move: same nook 0.8 s, any longer move 1.2 s (the prompt waits for it)
  glideTime(v) { const d = this.camNow.look.distanceTo(v.look); return d < 3 ? 0.8 : 1.2; }
  // Pip hops along the ledges at walking pace (never through the air or the easel). A later call takes over from
  // wherever he is (no snap); the camera never waits for him.
  zAt(x) {
    const K = this.knots;
    for (let i = 1; i < K.length; i++) if (x <= K[i][0]) { const [x0, z0] = K[i - 1], [x1, z1] = K[i]; return z0 + (z1 - z0) * ((x - x0) / Math.max(1e-6, x1 - x0)); }
    return K[K.length - 1][1];
  }
  pipTo(x, { speed = 3.0 } = {}) {
    const pip = this.pip, id = (this.pipId = (this.pipId || 0) + 1);
    const y = S.LEDGE.y;
    const p0 = pip.position.clone();
    const pts = [p0];
    const dir = Math.sign(x - p0.x);
    const mids = this.knots.filter(([kx]) => Math.abs(kx) < 1e3 && (dir > 0 ? kx > p0.x + 0.05 && kx < x - 0.05 : kx < p0.x - 0.05 && kx > x + 0.05));
    if (dir < 0) mids.reverse();
    for (const [kx, kz] of mids) pts.push(V(kx, y, kz));
    pts.push(V(x, y, this.zAt(x)));
    this.pipGoal = pts[pts.length - 1];
    const seg = []; let len = 0;
    for (let i = 1; i < pts.length; i++) { const d = pts[i].distanceTo(pts[i - 1]); seg.push(d); len += d; }
    if (len < 0.05) return Promise.resolve();
    const dur = Math.max(0.4, len / speed), tt = 0.25, tb = 0.3;
    const yaw0 = pip.rotation.y, head = Math.atan2(x - p0.x, 0.0001);
    const at = (d) => { let i = 0; while (i < seg.length - 1 && d > seg[i]) { d -= seg[i]; i++; } const k = Math.min(1, d / Math.max(1e-6, seg[i])); return pts[i].clone().lerp(pts[i + 1], k); };
    return this.s.anim(tt + dur + tb, (_, p) => {
      if (this.pipId !== id || this.dead) return;
      const t = p * (tt + dur + tb);
      if (t < tt) pip.rotation.y = yaw0 + (head - yaw0) * Ease.inOut(t / tt);
      else if (t < tt + dur) { pip.rotation.y = head; pip.position.copy(at(Ease.inOut((t - tt) / dur) * len)); }
      else { pip.position.copy(pts[pts.length - 1]); pip.rotation.y = head * (1 - Ease.inOut(Math.min(1, (t - tt - dur) / tb))); }
    });
  }

  // ================================================================ rounds
  async startRound(r) {
    if (r === 0 && !this.metDone) { await this.meetPhase(); if (this.dead) return; }
    const nf = this.plan.finds.length;
    if (r < nf) return this.findRound(r);
    return this.sortRound(r - nf);
  }

  // ---------------------------------------------------------------- Meet (words.md 3.4)
  async meetPhase() {
    // her things answer at once (the greeting is the engine's intro line, while Pip waves)
    await this.meetNook(0);
    if (this.dead) return;
    // nook B's things answer while the camera glides over to them; Pip hops along the ledge behind
    this.phase = 'walk';
    for (const t of this.nk[0].things) t.userData.tap.enabled = false;
    this.speak(LINES.come);
    const to = this.trioView(this.nk[1]);
    this.pipTo(this.gapX(this.nk[1], 0), { speed: 3.6 });
    this.glide(to, this.glideTime(to));
    this.setGoSide(to);
    this.armGo();
    await this.meetNook(1);
    if (this.dead) return;
    this.metDone = true;
    // every met thing counts as a round for the session stats (words.md 8.1)
    for (let i = 0; i < 6; i++) this.records.push({ firstTry: true, wrong: 0, hints: 0, ms: 0 });
    P.beginVisit(this.mem, this.plan);
    this.saveMem();
  }
  meetNook(n) {
    const nk = this.nk[n];
    this.meetN = n;
    this.phase = 'meet';
    for (const t of nk.things) t.userData.tap.enabled = true;
    this.busy = false;
    this.idle = 0; this.ladder = 0;
    this.errorlessOn = false;     // nook A's errorless must not leak into nook B (W1)
    this.allMetAt = 0;
    this.lastTouch = performance.now();
    // the first three visits: a slow hand taps nook A's middle thing, which really reacts and names itself (W10)
    if (n === 0 && (this.mem.taught.meet || 0) < 3) {
      this.mem.taught.meet = (this.mem.taught.meet || 0) + 1;
      const mid = nk.things[1] || nk.things[0];
      this.demoing = true;
      this.s.wait(0.3).then(() => {
        if (this.dead || this.phase !== 'meet' || mid.userData.met) { this.demoing = false; return; }
        this.hand(this.centreOf(mid), null, { onPress: () => this.tapThing(mid, { demo: true }), onEnd: () => { this.demoing = false; this.idle = 0; } });
      });
    } else if (n === 0 && !this.whatSaid) { this.whatSaid = true; this.speak(LINES.what); }   // W22
    return new Promise((res) => { this.meetDone = res; });
  }
  // the meet phase waits for: all three met and 4 s without a touch (or 15 s after all three are met: W16)
  checkMeet() {
    if (this.phase !== 'meet' || !this.meetDone) return;
    const nk = this.nk[this.meetN];
    if (!nk.things.every((t) => t.userData.met)) return;
    const now = performance.now();
    if (!this.allMetAt) this.allMetAt = now;
    const long = now - this.allMetAt > MEET_MAX * 1000;
    if (nk.things.some((t) => t.userData.reacting) || (voiceBusy() && !long)) { this.lastTouch = Math.max(this.lastTouch, now - 2500); return; }
    if (now - this.lastTouch < MEET_IDLE * 1000 && !long) return;
    const done = this.meetDone; this.meetDone = null;
    done();
  }
  tapThing(t, { demo = false } = {}) {
    if (this.dead) return;
    if (this.phase === 'find') return this.findTap(t);
    if (this.phase !== 'meet' && this.phase !== 'walk' && !demo) return;
    const u = t.userData;
    if (u.reacting) return;          // mid-reaction: the press-in only
    // mashing: more than 3 taps in 1.2 s, reactions still play but the voice rests until a 0.6 s pause
    const now = performance.now();
    this.tapTimes = this.tapTimes.filter((x) => now - x < 1200); this.tapTimes.push(now);
    const mashing = this.tapTimes.length > 3 || now - (this.mashUntil || 0) < 0;
    if (this.tapTimes.length > 3) this.mashUntil = now + 600;
    u.taps++;
    const nameTap = u.taps % 2 === 1;
    const line = nameTap ? u.w.name : u.w.about;
    if (!mashing) this.speak(line);
    if (!nameTap && !mashing) S.signature(u.w.sound);
    if (nameTap) P.heard(this.mem, u.word, this.plan.turn);
    this.doReact(t);
    if (!u.met) this.markMet(t);
  }
  doReact(t) {
    const u = t.userData;
    u.reacting = true;
    const kind = u.isPart || u.target ? 'part' : u.w.react;
    const host = u.isPart ? u.big : t;
    return S.react(this.s, host, kind, { part: u.part }).then(() => { u.reacting = false; });
  }
  markMet(t) {
    const u = t.userData;
    u.met = true;
    const r = u.ring;
    if (r) { const o0 = r.material.opacity; this.s.anim(0.5, (_, p) => { r.material.opacity = o0 * (1 - p); }).then(() => { r.visible = false; }); }
  }

  // ---------------------------------------------------------------- Find (words.md 3.5)
  async findRound(r) {
    const f = this.plan.finds[r];
    const nk = f.nook === 'A' ? this.nk[0] : this.nk[1];
    // round 0 also held the Meet: a fresh slate for the first question (W1), and its own Go! (W2)
    if (r === 0) { this.cur = { wrong: 0, hints: 0, t0: performance.now() }; this.errorlessOn = false; this.armGo(); }
    const cur = this.cur;
    for (const t of this.things) t.userData.tap.enabled = false;
    // the "again" rounds (Level 2): the word she is least sure of in that nook, never one found in the last two rounds
    let target;
    if (f.again) {
      const recent = this.foundLog.slice(-2);
      let pool = nk.things.filter((t) => !recent.includes(t.userData.word));
      if (!pool.length) pool = nk.things.slice();
      const missed = pool.filter((t) => this.missed.has(t.userData.word));
      target = missed[0] || pool.slice().sort((a, b) => P.box(this.mem, a.userData.word) - P.box(this.mem, b.userData.word) || (this.plan.isNew.includes(b.userData.word) ? 1 : 0) - (this.plan.isNew.includes(a.userData.word) ? 1 : 0))[0];
    } else target = nk.things[f.target];
    this.target = target;
    this.findNk = nk;
    const choices = f.pair ? f.pair.map((i) => nk.things[i]) : nk.things.slice();
    this.choices = choices;
    cur.askAt = 0;
    // the camera glides to the round's view and Pip hops along; her choices answer at once (rule 0)
    this.camNk = nk;
    const v = f.pair && !nk.N.char ? this.pairView(nk, f.pair) : this.trioView(nk);
    const gx = f.pair && !nk.N.char ? nk.cx + (S.SLOT_DX[f.pair[0]] + S.SLOT_DX[f.pair[1]]) / 2 : this.gapX(nk, 1);
    const gt = this.glideTime(v);
    this.pipTo(gx, { speed: gt > 1 ? 3.6 : 2.6 });
    const gl = this.glide(v, gt);
    this.setGoSide(v);
    const first = !this.findStarted;
    if (first) { this.findStarted = true; this.liftCamera(true); this.speak(LINES.pictures); }
    this.phase = 'find';
    for (const t of choices) t.userData.tap.enabled = true;
    this.busy = false;
    this.idle = 0; this.ladder = 0;
    // Me nooks: pair rounds halo the two live parts for 1.5 s (words.md 8.4)
    if (f.pair && nk.N.char) for (const t of choices) { const stop = fx.halo(t.userData.target, 0.5); this.s.wait(1.5).then(stop); }
    const live = () => this.cur === cur && !cur.done && !this.dead;
    // the question only once its things are in frame (the glide is at most 1.2 s; they answer taps meanwhile)
    await gl;
    if (first) await this.wait(0.3);
    if (!live()) return;
    // a listen round (Level 2): its own sound first, then the question (at most two a visit)
    const w = target.userData.w;
    if (this.level === 1 && LISTEN.has(w.sound) && this.listenN < 2 && !f.again) { this.listenN++; S.signature(w.sound); await this.wait(1.1); if (!live()) return; }
    cur.askAt = performance.now();
    // the first Find round ever: after the question, a slow hand taps the right thing; a touch ends it
    if (!this.mem.taught.find) {
      this.mem.taught.find = 1;
      await this.speak(w.where, { max: 2.6 });
      if (!live()) return;
      this.demoing = true;
      await this.hand(this.centreOf(target), null, { dur: 1.1, onPress: () => { if (this.cur === cur) cur.shown = true; }, onEnd: () => { this.demoing = false; } });
    } else {
      this.speak(w.where, { max: 2.6 });
    }
  }
  // Pip holds his camera up in both wings, in front of his beak and below his eyes, a little bigger (QA words 3)
  async liftCamera(up) {
    const c = this.cam; if (!c) return;
    if (c.userData.s0 === undefined) c.userData.s0 = c.scale.x;
    const from = c.position.clone(), to = up ? V(0, 1.05, 1.05) : this.pipCamRest;
    const s0 = c.scale.x, s1 = c.userData.s0 * (up ? 1.4 : 1);
    const w = this.pip.userData.wings || [];
    for (const b of w) if (b.userData.rz0 === undefined) b.userData.rz0 = b.rotation.z;
    const w0 = w.map((b) => b.rotation.z), w1 = w.map((b, i) => b.userData.rz0 + (up ? (i ? -0.35 : 0.35) : 0));
    await this.s.anim(0.6, (e) => {
      c.position.lerpVectors(from, to, e); c.scale.setScalar(s0 + (s1 - s0) * e);
      w.forEach((b, i) => { b.rotation.z = w0[i] + (w1[i] - w0[i]) * e; });
    }, Ease.inOut);
  }
  // before the question is heard, a tap is only a look (no score): the round is already open (rule 0)
  early() { return !this.cur.askAt || performance.now() - this.cur.askAt < 600; }
  findTap(t) {
    if (this.busy || this.cur.done || this.phase !== 'find' || this.dead) return;
    if (!this.choices.includes(t)) return;
    if (this.cur.dimmed && t !== this.target) return;
    if (performance.now() < (this.wrongLock || 0)) return;
    if (t === this.target) return this.found(t);
    // wrong: it wobbles softly and says its OWN name, then the question once more (no "no", no buzzer)
    this.wrongLock = performance.now() + 600;
    const u = t.userData, host = u.isPart ? u.big : t;
    const P0 = host.userData.pose;
    this.s.anim(0.55, (_, p) => { P0.rotation.z = Math.sin(p * Math.PI * 3) * 0.08 * (1 - p); }).then(() => { P0.rotation.z = 0; });
    this.speak(u.w.name);
    P.heard(this.mem, u.word, this.plan.turn);
    if (this.early()) return;
    this.cur.wrong++;
    this.missed.add(this.target.userData.word);
    const n = this.cur.wrong;
    // the first repeat is always spoken (W21)
    this.s.wait(1.4).then(() => { if (!this.busy && this.phase === 'find' && !this.cur.done) this.speak(this.target.userData.w.where, { voice: n === 1, force: n === 1 }); });
    if (n === 2) this.nudge(2);
    if (n >= 3) this.errorless();
  }
  found(t) {
    if (this.cur.done) return;
    this.cur.done = true;   // success() sets busy itself
    this.stopHand();
    const u = t.userData, w = u.w;
    const firstTry = this.cur.wrong === 0 && this.cur.hints === 0 && !this.errorlessOn;
    this.res.finds++; if (firstTry) this.res.firsts++;
    // a find that the photos (elimination), the demo hand, or a tap before the question answered is practice, not a
    // test: it never raises the word's box (W6)
    const elim = !this.photos.has(u.word) && this.choices.every((c) => c === t || this.photos.has(c.userData.word));
    if (firstTry && (elim || this.cur.shown || this.early())) P.practised(this.mem, w.id, this.plan.turn);
    else P.found(this.mem, w.id, firstTry, this.plan.turn, this.today);
    this.foundLog.push(u.word);
    this.payoffP = this.photoMoment(t);
    // the last photo: once the shutter has gone the camera starts for the line and the book
    if (!this.plan.sort && this.res.finds >= this.plan.finds.length) this.payoffP.then(() => this.preBook());
    this.success(this.centreOf(t), '', { still: 0.3 });
  }
  // The beat, the viewfinder, the shutter, the name (the payoff: about 0.8 s), then the card flies up to its peg by
  // itself while the next round already asks (words.md 3.5 table; rule 0).
  photoMoment(t) {
    const u = t.userData, host = u.isPart ? u.big : t;
    const c = this.centreOf(t);
    const vf = this.viewfinder;
    const pr = u.target && !u.isPart ? S.partRadius(u.target) : 0;
    // four thin corners, 1.1x the thing, closing in from 1.35x (they never reach a neighbour)
    const sz = pr ? Math.min(1.1, Math.max(0.6, pr * 2.6)) : u.isPart || u.target ? 0.7 : Math.min(1.75, Math.max(u.h, u.wid) * 1.1);
    vf.position.copy(c).add(V(0, 0, u.isPart ? 0.3 : u.target ? 0.35 : Math.min(0.5, (u.dep || 1) * 0.5)));
    vf.quaternion.copy(camera.quaternion);
    vf.visible = true; vf.userData.mat.opacity = 0.95;
    const beat = this.beat(host, 0.35);
    this.s.anim(0.35, (e) => S.setFinder(vf, sz * (1.25 - 0.25 * e), sz * (1.25 - 0.25 * e)), Ease.out);
    // the photo is taken inside the beat, of the thing exactly as it is (a lit lamp is lit; a part is shown)
    let canvas = null;
    try {
      if (pr) {
        S.partPose(t, u.part, 1);
        canvas = S.photoTexture(host, { bg: this.bg, focus: c, radius: pr * S.partZoom(u.part), el: S.partElevation(u.part) });
        S.partPose(t, u.part, 0);
      } else canvas = u.isPart || u.target ? S.photoTexture(host, { bg: this.bg, focus: c, radius: (u.isPart ? u.big.userData.h : u.h) * 0.17 }) : S.photoTexture(t, { bg: this.bg });
    } catch (e) { console.warn(e); }
    // the card is hers from this moment (so the next round already knows it has a photo)
    const again = this.photos.has(u.word);
    let card = null;
    if (!again) {
      card = S.makeCard(canvas);
      card.scale.setScalar(1.2);
      card.visible = false;
      card.userData.word = u.word;
      this.photos.set(u.word, card);
    }
    let early;
    const earlyP = new Promise((res) => { early = res; });
    (async () => {
      await beat;
      if (this.dead) return;
      sfx.shutter();
      this.s.anim(0.35, (_, p) => { vf.userData.mat.opacity = 0.95 * (p < 0.3 ? 1 - p / 0.3 * 0.8 : p < 0.5 ? 1 : 1 - (p - 0.5) / 0.5); }).then(() => { vf.visible = false; });
      this.doReact(t);
      this.speak(u.w.name);
      P.heard(this.mem, u.word, this.plan.turn);
      await this.wait(0.45);
      early();
      if (again) {
        // already on the line: a small gold star floats from the thing onto its photo, and the same peg note
        const cd = this.photos.get(u.word);
        const star = cd.userData.star.clone(); star.visible = true;
        this.root.add(star);
        const from = c.clone(), to = cd.userData.star.getWorldPosition(V(0, 0, 0));
        await this.s.anim(0.6, (e) => { star.position.lerpVectors(from, to, e); star.position.y += Math.sin(e * Math.PI) * 0.6; star.scale.setScalar(1 + (1 - e) * 1.5); }, Ease.inOut);
        this.root.remove(star);
        cd.userData.star.visible = true;
        sfx.step(this.photos.size - 1, 6);
        await this.swingCard(cd);
        return;
      }
      // the card slides up from behind the thing (0.4 s), then arcs to its own peg
      const peg = this.pegs[u.peg];
      const start = u.isPart ? V(c.x, Math.min(c.y, u.big.userData.h * 0.6), u.big.position.z - 1.1) : V(t.position.x, t.position.y + u.h * 0.5, t.position.z - Math.max(0.45, (u.dep || 1) * 0.55));
      card.position.copy(start);
      card.visible = true;
      this.root.add(card);
      const up = start.clone().add(V(0, u.isPart ? u.big.userData.h * 0.55 : u.h * 0.5 + 0.55, 0));
      await this.s.anim(0.4, (e) => { if (!card.userData.inBook) card.position.lerpVectors(start, up, e); }, Ease.out);
      if (card.userData.inBook) return;   // she already tapped it into the book: it flies from where it is
      const hang = V(peg.x, peg.y - 0.02 - (card.userData.h * 1.2) / 2, peg.z);
      const p0 = card.position.clone();
      await this.s.anim(0.8, (e) => { if (card.userData.inBook) return; card.position.lerpVectors(p0, hang, e); card.position.y += Math.sin(e * Math.PI) * 0.45; }, Ease.inOut);
      if (card.userData.inBook) return;
      card.userData.hung = true;
      if (this.phase === 'book') this.growCards(this.bookHalfB ? 1 : 0);
      sfx.step(this.photos.size - 1, Math.max(6, this.plan.finds.length - (this.level === 1 ? 2 : 0)));
      await this.swingCard(card);
    })().catch((e) => { console.error(e); early(); });
    return earlyP;
  }
  async swingCard(card) {
    await this.s.anim(0.9, (_, p) => { if (!card.userData.inBook) card.rotation.z = Math.sin(p * Math.PI * 4) * 0.105 * (1 - p); });
    if (!card.userData.inBook) card.rotation.z = 0;
  }
  nudgeTarget() {
    if (this.phase === 'meet') return this.nk[this.meetN].things.find((t) => !t.userData.met) || null;
    if (this.phase === 'find') return this.target;
    if (this.phase === 'sort') return this.curToy && !this.curToy.userData.sorted ? this.curToy : null;
    return null;
  }
  // a stuck child: one silent look-at-me bob (small, inside its slot); from the second step the cream ring too
  // (Tidy: the toy bobs "pick me"; from the second step its home opens wide and glows: W5)
  nudge(step) {
    const t = this.nudgeTarget();
    if (!t) return;
    const u = t.userData, host = u.isPart ? u.big : t, P0 = host.userData.pose;
    if (P0 && !u.reacting) this.s.anim(0.7, (_, p) => { P0.position.y = Math.sin(p * Math.PI) * 0.16; }).then(() => { P0.position.y = 0; });
    if (step >= 2 && this.phase === 'find') {
      if (u.ring) { u.ring.visible = true; u.ring.material.opacity = 0.45; this.s.wait(3.5).then(() => { if (u.met) u.ring.visible = false; }); }
      else { const stop = fx.halo(u.target || t, 0.8); this.s.wait(3).then(stop); }
    }
    if (step >= 2 && this.phase === 'sort') {
      const h = this.homeOf(t);
      if (h && !h.userData.shut) {
        S.homeNear(h, 1);
        const stop = fx.halo(h.userData.mid || h, 1.6);
        this.s.wait(3).then(() => { stop(); if (!h.userData.shut) S.homeNear(h, 0); });
      }
    }
  }
  showHint() {
    // (Tidy has its own 8 s drag demo: no second demo from the ladder)
    if (this.phase === 'meet') {
      const t = this.nudgeTarget();
      if (t) this.hand(this.centreOf(t), null, { onPress: () => this.tapThing(t, { demo: true }) });
    } else if (this.phase === 'find' && this.target) {
      this.cur.hints++;
      this.hand(this.centreOf(this.target), null, { dur: 1.1 });
    }
  }
  makeErrorless() {
    if (this.phase === 'meet') {
      // the unmet things name themselves, one at a time, 5 s apart, and count as met
      const nk = this.nk[this.meetN];
      const left = nk.things.filter((t) => !t.userData.met);
      left.forEach((t, i) => this.s.wait(i * 5).then(() => { if (this.phase === 'meet' && !t.userData.met) this.tapThing(t, { demo: true }); }));
    } else if (this.phase === 'find') {
      // the others dim and stop answering; the hand taps the right one
      this.cur.dimmed = true;
      for (const t of this.choices) if (t !== this.target) { this.dim(t, 0.6); }
      this.hand(this.centreOf(this.target), null, { dur: 1.1 });
    } else if (this.phase === 'sort') {
      // the wrong homes really close their doors and take nothing (W5)
      const right = this.homeOf(this.curToy);
      for (const h of this.homes) if (h !== right) this.shutHome(h, true);
    }
  }
  shutHome(h, shut) {
    if (!!h.userData.shut === shut) return Promise.resolve();
    if (!shut) h.userData.shut = false;
    const ds = h.userData.doors;
    const from = ds.map((d) => d.rotation.y);
    const to = ds.map((d) => (shut ? d.userData.closed ?? d.userData.open0 : d.userData.open0));
    if (shut) h.userData.shut = true;
    return this.s.anim(0.4, (e) => ds.forEach((d, i) => { d.rotation.y = from[i] + (to[i] - from[i]) * e; }), Ease.inOut);
  }
  dim(t, k) {
    const host = t.userData.isPart ? null : t;
    if (!host) return;
    host.traverse((o) => { if (o.isMesh && o.material && !o.userData.outline) { o.userData.dimMat = o.userData.dimMat || o.material.clone(); if (!o.userData.preDim) o.userData.preDim = o.material; o.material = o.userData.dimMat; if (o.material.color) o.material.color.multiplyScalar(k); } });
  }
  undim(t) { t.traverse((o) => { if (o.userData.preDim) { o.material = o.userData.preDim; o.userData.preDim = null; o.userData.dimMat = null; } }); }
  async afterSuccess() {
    for (const t of this.things) this.undim(t);
    this.errorlessOn = false;
    if (this.phase === 'sort') {
      // the carts are empty: the next toys hop out of the toy chest into them (in the background, ~1.1 s)
      this.refillP = this.refill();
      if (this.round >= this.totalRounds) this.preBook();
      return;
    }
    // the last Find round: what she did not get asked was still practised; save
    if (this.round === this.plan.finds.length) {
      const asked = new Set(this.plan.finds.map((f) => f.word).filter(Boolean));
      for (const t of this.things) if (!asked.has(t.userData.word)) P.practised(this.mem, t.userData.word, this.plan.turn);
      this.saveMem();
      this.liftCamera(false);
      if (!this.plan.sort) this.preBook();
    }
  }

  // ---------------------------------------------------------------- Tidy (Level 3, words.md 3.6)
  // the first unsorted toy of the front load (the one the prompts and the demo use)
  frontToy() {
    const left = this.toys.filter((t) => !t.userData.sorted && (t.userData.inCart || t.userData.flying));
    if (!left.length) return null;
    const k = Math.min(...left.map((t) => t.userData.load));
    return left.find((t) => t.userData.load === k);
  }
  async sortRound(i) {
    const sort = this.plan.sort;
    this.phase = 'sort';
    this.sortStuck = 0;
    this.cur.lineN = 0;
    const first = !this.tidyStarted;
    let glideP = null;
    if (first) {
      this.tidyStarted = true;
      for (const t of this.things) t.userData.tap.enabled = false;
      this.speak(LINES.tidy);
      const to = this.tidyView();
      this.pipTo(this.tidyPipX, { speed: 3.4 });       // Pip walks over along the fence while she already plays
      glideP = this.glide(to, this.glideTime(to));
      this.setGoSide(to);
    }
    this.curToy = this.frontToy();
    for (const toy of this.toys) if (!toy.userData.sorted && toy.userData.inCart && toy.userData.drag) toy.userData.drag.enabled = true;
    this.busy = false;
    this.idle = 0; this.ladder = 0;
    const cur = this.cur, toy = this.curToy;
    const live = () => this.cur === cur && !cur.done && !this.dead && toy && !toy.userData.sorted;
    if (glideP) await glideP;
    if (this.refillP) await this.refillP;     // the first new toy is in its cart 0.8 s after the last one went home
    if (!live()) return;
    // every toy: it bobs, says its name, and "Take it home!" (voiced for the first two of a visit: W4)
    if (!toy.userData.drag.obj.userData.dragging) this.bob(toy);
    await this.speak(BY_ID[toy.userData.toy.id].name, { max: 1.6 });
    if (!live()) return;
    const t = this.mem.taught;
    const demo = first && ((t.sort || 0) < 3 || sort.stage > (t.sortStage || 0));
    if (demo && !input.dragging()) await this.sortDemo(true);
    else this.speak(LINES.take, { voice: this.res.sorts < 2 });
  }
  bob(toy) {
    const P0 = toy.userData.pose; if (!P0) return;
    this.s.anim(0.7, (_, p) => { P0.position.y = Math.sin(p * Math.PI) * 0.16; }).then(() => { P0.position.y = 0; });
  }
  placeToys() {
    if (!this.train) return;
    const top = this.train.userData.top * this.train.scale.y, y = this.train.position.y;
    for (const toy of this.toys) {
      const u = toy.userData;
      if (u.sorted || u.flying || u.demo || !u.inCart || u.drag?.obj?.userData?.dragging) continue;
      const c = u.cart; if (!c) continue;
      const p = c.getWorldPosition(V(0, 0, 0));
      toy.position.set(p.x, y + top, p.z);
      if (u.drag) u.drag.home.copy(toy.position);
    }
  }
  cartPos(toy) { const p = toy.userData.cart.getWorldPosition(V(0, 0, 0)); p.y = this.train.position.y + this.train.userData.top * this.train.scale.y; return p; }
  // back to its cart on a low arc (0.5 s), following the cart if the train is rolling
  floatHome(toy, dur = 0.5) {
    const u = toy.userData;
    if (u.sorted) return Promise.resolve();
    u.flying = true;
    const from = toy.position.clone();
    return this.s.anim(dur, (e, p) => { if (u.sorted || u.drag?.obj?.userData?.dragging) return; toy.position.lerpVectors(from, this.cartPos(toy), e); toy.position.y += Math.sin(p * Math.PI) * 0.45; }, Ease.inOut)
      .then(() => { u.flying = false; });
  }
  // a little chug forward and back (her tap on the engine, or a new load): the wheels turn about their own z (the axle)
  chug(dx = 0.35) {
    if (this.trainMoving) return Promise.resolve();
    const tr = this.train, ud = tr.userData, x0 = tr.position.x;
    const w0 = ud.wheels.map((b) => b.rotation.z);
    this.trainMoving = true;
    return this.s.anim(0.8, (_, p) => {
      tr.position.x = x0 + Math.sin(p * Math.PI) * dx;
      ud.wheels.forEach((b, i) => (b.rotation.z = w0[i] - (tr.position.x - x0) * 2.2 / tr.scale.x));
    }).then(() => { tr.position.x = x0; ud.wheels.forEach((b, i) => (b.rotation.z = w0[i])); this.trainMoving = false; });
  }
  // the front load is all put away: the chest opens and the next three toys hop into the carts, 0.25 s apart
  refill() {
    const left = this.toys.filter((t) => !t.userData.sorted && !t.userData.inCart && !t.userData.flying);
    if (!left.length || this.toys.some((t) => t.userData.inCart && !t.userData.sorted)) return null;
    const k = Math.min(...left.map((t) => t.userData.load));
    const next = left.filter((t) => t.userData.load === k);
    const ch = this.chest, lid = ch?.userData.lid;
    const l0 = lid ? lid.rotation.x : 0;
    if (lid) this.s.anim(0.3, (e) => { lid.rotation.x = l0 - e * 1.1; }, Ease.out);
    S.toot();
    const hops = next.map((toy, j) => this.s.wait(0.2 + j * 0.25).then(() => {
      const u = toy.userData;
      u.flying = true;
      const from = ch ? ch.position.clone().add(V(0, ch.userData.top * 0.55, 0)) : toy.position.clone();
      toy.position.copy(from); toy.visible = true;
      return this.s.anim(0.6, (e, p) => { toy.position.lerpVectors(from, this.cartPos(toy), e); toy.position.y += Math.sin(p * Math.PI) * 0.9; }, Ease.inOut)
        .then(() => { u.flying = false; u.inCart = true; this.placeToys(); if (this.phase === 'sort' && !this.busy && !u.sorted) u.drag.enabled = true; });
    }));
    return Promise.all(hops).then(() => { if (lid) this.s.anim(0.35, (e) => { lid.rotation.x = l0 - (1 - e) * 1.1; }, Ease.inOut); this.chug(0.25); });
  }
  tootTrain() {
    const now = performance.now();
    if (now - (this.tootAt || 0) < 900) return;
    this.tootAt = now;
    S.toot();
    this.chug(0.3);
  }
  homeOf(toy) { return toy && this.homes.find((h) => h.userData.group === toy.userData.toy.group); }
  pickToy(toy) {
    this.curToy = toy;
    this.stopHand();
    toy.userData.flying = false;
    const w = toy.userData.toy;
    this.speak(BY_ID[w.id].name);
    P.heard(this.mem, w.id, this.plan.turn);
  }
  async dropToy(toy, z) {
    const home = z?.home;
    for (const h of this.homes) if (!h.userData.shut) S.homeNear(h, 0);
    if (!home || this.busy || this.cur.done || this.phase !== 'sort') { this.floatHome(toy); return; }   // on nothing: back to its cart, silently
    const w = toy.userData.toy;
    const right = home.userData.group === w.group;
    if (!right) {
      // the home shakes its head; the toy floats back to its cart; "Where do animals go?"
      this.cur.wrong++; this.res.sortMisses++;
      this.s.anim(0.55, (_, p) => { home.rotation.y = Math.sin(p * Math.PI * 4) * 0.06 * (1 - p); }).then(() => { home.rotation.y = 0; });
      this.floatHome(toy);
      this.speak(HOMES[w.group].ask, { voice: this.cur.wrong === 1, force: this.cur.wrong === 1 });
      if (this.cur.wrong === 2) { const rh = this.homeOf(toy); S.homeNear(rh, 1); if (!rh.userData.ring) { rh.userData.ring = S.makeRing(1.4); rh.userData.ring.position.set(rh.position.x, 0, rh.position.z + 0.6); this.root.add(rh.userData.ring); } }
      if (this.cur.wrong >= 3) this.errorless();
      return;
    }
    // right: onto the next free spot on its shelves; it turns to face her and plays its reaction once
    this.cur.done = true;
    for (const t of this.toys) if (t.userData.drag) t.userData.drag.enabled = false;
    input.remove(toy.userData.drag);
    toy.userData.sorted = true;
    this.curToy = toy;
    const first = this.cur.wrong === 0 && this.cur.hints === 0;
    this.res.sorts++; if (first) this.res.sortFirst++;
    const spot = home.userData.spots[home.userData.filled++] || V(0, 0.2, 0);
    const to = home.localToWorld(spot.clone());
    const from = toy.position.clone();
    this.payoffP = (async () => {
      await this.s.anim(Math.max(0.6, Math.min(0.9, from.distanceTo(to) / 3.2)), (e) => { toy.position.lerpVectors(from, to, e); toy.position.y += Math.sin(e * Math.PI) * 0.35; }, Ease.inOut);
      toy.rotation.y = 0;
      this.s.anim(0.25, (e) => toy.scale.setScalar(1 - 0.12 * e));
      sfx.step(this.res.sorts - 1, this.sortN);
      S.react(this.s, toy, BY_ID[w.id].react === 'part' ? 'hop' : BY_ID[w.id].react);
      if (home.userData.ring) { this.root.remove(home.userData.ring); home.userData.ring = null; }
      this.speak(HOMES[w.group].line, { voice: !home.userData.said });
      home.userData.said = true;
      for (const h of this.homes) { if (h.userData.shut) this.shutHome(h, false); else S.homeNear(h, 0); }
    })();
    if (this.res.sorts >= this.sortN) this.payoffP.then(() => this.preBook());
    this.success(to, '', { still: 0.3, watch: true });
  }
  // The drag demo: a slow hand picks up the real toy and carries it to its home (the doors open wide), lets go,
  // and the toy floats back to its cart: "your turn". A touch ends it at once (W10).
  async sortDemo(first = false) {
    const toy = this.frontToy();
    if (!toy || toy.userData.flying || toy.userData.demo || input.dragging()) return;
    const home = this.homeOf(toy);
    if (first) this.speak(LINES.take);
    this.demoing = true;
    const u = toy.userData;
    u.demo = true;
    const a = toy.position.clone(), grab = a.clone().add(V(0, 0.4, 0)), b = home.position.clone().add(V(0, 1.2, 0.3));
    const bt = b.clone().sub(V(0, 0.4, 0));
    await this.hand(grab, b, {
      dur: 1.2,
      onCarry: (m) => {
        if (!u.demo || u.drag.obj.userData.dragging) return;
        toy.position.lerpVectors(a, bt, m); toy.position.y += Math.sin(m * Math.PI) * 0.3;
        if (!home.userData.shut) S.homeNear(home, m);
      },
      onEnd: () => {
        this.demoing = false;
        if (!home.userData.shut) S.homeNear(home, 0);
        if (u.demo) { u.demo = false; if (!u.sorted && !u.drag.obj.userData.dragging) this.floatHome(toy, 0.6); }
      },
    });
    this.sortStuck = 0;
  }

  // ================================================================ every frame
  update(dt, t) {
    this.checkMeet();
    // unmet things breathe 3% and their rings pulse slowly; met things are still
    for (const th of this.things) {
      const u = th.userData;
      if (u.ring && u.ring.visible && !u.met) {
        u.ring.material.opacity = 0.28 + Math.sin(t * (Math.PI * 2 / 3) + u.slot) * 0.08;
        if (u.target) { u.target.getWorldPosition(u.ring.position); u.ring.position.z += 0.18; u.ring.quaternion.copy(camera.quaternion); }
      }
      if (!u.met && !u.reacting && !u.isPart && u.pose) { const k = 1 + Math.sin(t * 1.8 + u.slot * 1.3) * 0.015; u.pose.scale.set(1 + (k - 1) * 0.5, k, 1 + (k - 1) * 0.5); }
      // rain keeps falling under its cloud (drops fade in under the cloud and out at the ground)
      const drops = u.inner?.userData?.drops;
      if (drops) for (const d of drops) { const ph = (t * 0.6 + d.userData.ph) % 1; d.position.set(d.userData.x, d.userData.top * (1 - ph), d.userData.z); d.scale.setScalar(ph < 0.1 ? ph * 10 : ph > 0.85 ? (1 - ph) / 0.15 : 1); }
    }
    if (this.train) this.placeToys();
    // the tidy demo comes back when she is stuck for 8 s (the lesson's own timer; any touch resets it: W5)
    if (this.phase === 'sort' && !this.busy && !this.demoing && !input.dragging()) {
      this.sortStuck = (this.sortStuck || 0) + dt;
      if (this.sortStuck > SORT_DEMO) { this.sortStuck = -6; this.sortDemo(); }
    }
  }

  // ================================================================ the Book (words.md 3.7) and the finale
  async finale() {
    if (!this.bookDone) {
      this.bookDone = true;
      await this.bookPhase();
      if (this.dead) return;
    }
    return super.finale();
  }
  async bookPhase() {
    this.phase = 'book';
    for (const t of this.things) t.userData.tap.enabled = false;
    for (const toy of this.toys || []) if (toy.userData.drag) toy.userData.drag.enabled = false;
    // every word she met today has its place filled (W8): the ones not asked get their quiet photo now
    for (const t of this.things) { const id = t.userData.word; if (!this.photos.has(id) && !this.places.get(id)?.photo) this.renderPlace(id); }
    // the photos on the line are tappable at once; the camera glides to the line, the book opens, Pip hops over
    const cards = [...this.photos.values()];
    this.bookLeft = cards.slice();
    for (const c of cards) c.userData.tap = input.addTap(c, { radius: 0.55, onTap: () => this.bookTap(c) });
    this.growCards(0);
    this.bookOpenP = this.s.anim(0.8, (e) => S.setBookOpen(this.book, e), Ease.inOut);
    if (!this.bookGlide) this.preBook();
    this.bookN = 0;
    this.busy = false;
    this.idle = 0; this.ladder = 0;
    this.armGo();
    // "Tap a picture!" once the photos are in frame (the glide started during the last payoff)
    await this.bookGlide;
    if (this.dead) return;
    this.speak(LINES.book);
    // the first time ever: the hand shows it on the first photo (a touch ends it)
    const c0 = this.bookLeft.find((c) => c.userData.hung !== false);
    if (!this.mem.taught.book && c0 && !this.dead) {
      this.mem.taught.book = 1;
      this.demoing = true;
      await this.hand(c0.getWorldPosition(V(0, 0, 0)), null, { dur: 1.0, onPress: () => this.bookTap(c0, true), onEnd: () => { this.demoing = false; } });
    }
    // nook A's half, then nook B's; if she waits 8 s the rest go on their own, one every 1.5 s
    await new Promise((res) => { this.bookDoneRes = res; this.bookIdle = 0; if (!this.bookLeft.length && !this.busyCard) { this.bookDoneRes = null; res(); } });
    this.saveMem();
  }
  // the camera starts for the line and the book during the last round's payoff, and Pip walks over
  preBook() {
    if (this.bookGlide) return;
    const v = this.lineView(0);
    this.bookGlide = this.glide(v, this.glideTime(v));
    this.pipTo(PIP_BOOK_X, { speed: 3.4 });
    this.setGoSide(v);
  }
  bookTap(card, demo = false) {
    if (this.dead || card.userData.inBook || this.phase !== 'book') return;
    // a tap while another card flies waits its turn (W18)
    if (this.busyCard && !demo) { this.bookQueue = this.bookQueue || []; if (!this.bookQueue.includes(card)) this.bookQueue.push(card); return; }
    card.userData.inBook = true;
    if (card.userData.tap) { card.userData.tap.enabled = false; input.remove(card.userData.tap); }
    this.bookIdle = 0;
    this.bookLeft = this.bookLeft.filter((c) => c !== card);
    const id = card.userData.word;
    const pl = this.places.get(id);
    this.busyCard = true;
    this.speak(BY_ID[id].name);
    P.heard(this.mem, id, this.plan.turn);
    // the card drops into its own fixed place on its nook's page (0.7 s arc), once the cover is open
    Promise.resolve(this.bookOpenP).then(() => {
      if (this.dead) return;
      const from = card.position.clone();
      const target = pl ? pl.slot.getWorldPosition(V(0, 0, 0)) : this.book.position.clone();
      const q0 = card.quaternion.clone(), q1 = pl ? pl.slot.getWorldQuaternion(new T.Quaternion()) : q0;
      const s0 = card.scale.x, s1 = S.PLACE_SIZE / 0.62;
      return this.s.anim(0.7, (e) => {
        card.position.lerpVectors(from, target, e); card.position.y += Math.sin(e * Math.PI) * 0.5;
        card.quaternion.copy(q0).slerp(q1, e); card.scale.setScalar(s0 + (s1 - s0) * e);
      }, Ease.inOut).then(() => {
        sfx.pup();
        if (pl) {
          // it becomes the page's photo for good
          this.root.remove(card);
          pl.slot.add(card); card.position.set(0, 0, 0); card.quaternion.identity(); card.scale.setScalar(s1);
          if (pl.photo && pl.photo !== card) pl.slot.remove(pl.photo);
          pl.photo = card; pl.empty.visible = false;
          if (P.box(this.mem, id) >= 4) card.userData.star.visible = true;
        }
        this.busyCard = false;
        this.bookN++;
        const nx = this.bookQueue?.shift();
        if (nx) { this.bookTap(nx); return; }
        const leftA = this.bookLeft.filter((c) => this.places.get(c.userData.word)?.page === 0);
        if (!this.bookLeft.length) { this.s.wait(0.6).then(() => { const r = this.bookDoneRes; this.bookDoneRes = null; r && r(); }); }
        else if (!leftA.length && !this.bookHalfB) { this.bookHalfB = true; const v1 = this.lineView(1); this.glide(v1, 1.2); this.setGoSide(v1); this.growCards(1); }
      });
    });
  }
  tick(dt, t) {
    super.tick(dt, t);
    if (this.phase === 'book' && this.bookDoneRes && !this.busyCard && !this.demoing) {
      this.bookIdle = (this.bookIdle || 0) + dt;
      if (this.bookIdle > 8 && this.bookLeft.length) {
        this.bookIdle = 6.5;   // then one every 1.5 s
        const leftA = this.bookLeft.filter((c) => this.places.get(c.userData.word)?.page === 0);
        this.bookTap((leftA[0] || this.bookLeft[0]), true);
      }
    }
  }
  onFinale() {
    // the finale frames her photos close up: Pip steps back along the fence so he is not cut by the edge
    this.pipTo(2.6, { speed: 2.4 });
    const pf = this.pip.userData.face;
    if (pf) setFace(pf, 'joy');
    this.pipWatch(this.book.position);
  }
  creationView() { return this.bookView(); }
  creationObjects() { return [...this.places.values()].map((p) => p.photo).filter(Boolean); }
  get admireTime() { return 6; }
  get finaleRain() { return false; }
  // poking a photo in the book: it presses, plays its note, and the voice says its name (one more quiet review)
  onAdmirePoke(obj, i, n) {
    input.press(obj, 140);
    sfx.step(i ?? 0, n || 6, { soft: true });
    const id = obj.userData.word;
    if (id && BY_ID[id]) this.speak(BY_ID[id].name);
  }
  // taps on empty space are not answers; no boings from the scenery here
  pokeAt(x, y) {
    if (this.pokeables.length && this.pokeAtPokeable(x, y)) return true;
    return true;
  }
  mash() {}
  saveMem() { if (this.mem) P.saveMemory(this.storage, this.mem); }

  // the visit is over (or left early): adapt, count, save (words.md 8.6 rule 8). No sticker: that is the finale's.
  closeVisit() {
    if (!this.metDone || this.ended || !this.mem) return;
    this.ended = true;
    P.endVisit(this.mem, this.plan, this.res);
    this.saveMem();
  }
  async timeout() {
    // the 45 s idle exit keeps the visit's results: the word memory's visit count and pace, and the session record
    if (this.metDone && !this.ended && this.records.length) { try { store.record(this.meta.id, this.records); } catch (e) { /* */ } }
    this.closeVisit();
    return super.timeout();
  }
  async takePhoto() {
    if (!this.ended) {
      // the drag demo counts good visits (3 of them), and comes back when a new home appears (W10)
      const t = this.mem.taught;
      if (this.res.sorts && this.res.sortFirst >= this.res.sorts - 1) t.sort = (t.sort || 0) + 1;
      if (this.plan.sort) t.sortStage = Math.max(t.sortStage || 0, this.plan.sort.stage || 0);
      this.closeVisit();
    }
    return super.takePhoto();
  }

  // ================================================================ autoplay hooks (tools/autoplay.js)
  meetAll() { if (this.phase !== 'meet') return false; for (const t of this.nk[this.meetN].things) if (!t.userData.met) { this.tapThing(t); return true; } this.lastTouch = 0; this.allMetAt = 1; return true; }
  findRight() { if (this.phase !== 'find' || this.busy || this.cur.done) return false; this.found(this.target); return true; }
  findWrong() { if (this.phase !== 'find' || this.busy) return false; const w = this.choices.find((t) => t !== this.target); if (w) this.findTap(w); return true; }
  sortRight() {
    if (this.phase !== 'sort' || this.busy) return false;
    const toy = this.frontToy();
    if (!toy) return false;
    this.pickToy(toy);
    const h = this.homeOf(toy);
    this.dropToy(toy, { home: h }, { tapped: false });
    return true;
  }
  sortWrong() {
    if (this.phase !== 'sort' || this.busy) return false;
    const toy = this.frontToy();
    const h = toy && this.homes.find((x) => x !== this.homeOf(toy) && !x.userData.shut);
    if (!h) return false;
    this.pickToy(toy); this.dropToy(toy, { home: h }, { tapped: false });
    return true;
  }
  bookAll() { if (this.phase !== 'book' || !this.bookLeft?.length || this.busyCard) return false; const leftA = this.bookLeft.filter((c) => this.places.get(c.userData.word)?.page === 0); this.bookTap(leftA[0] || this.bookLeft[0]); return true; }
}
// Reset in the parent panel also forgets the word memory; the panel shows one line about the words (words.md 8.5).
store.onReset?.(() => { try { localStorage.removeItem(P.KEY); } catch (e) { /* */ } });
store.addParentNote?.(() => {
  let m; try { m = P.loadMemory(localStorage); } catch (e) { return ''; }
  const st = P.stats(m);
  const places = PLACES.map((p) => `${p.name} ${st.byPlace[p.id] || 0}`).join(' · ');
  return `<p><b>Word world:</b> Words met ${st.met} of ${st.total} · known ${st.known}<br><span class="muted">${places}</span></p>`;
});
