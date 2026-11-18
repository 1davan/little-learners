// Shape puzzles. Topics mt_KJeEeTutJI "2-D shapes", mt_95zxYqpP7m "Trying a new approach", mt_QR3vxbN1o4 "Planning a
// task", mt_AzNSWFgtxC "Remembering visual forms" and mt_XjwUlmxdCT "Combining simple shapes" (docs/design/puzzles.md).
// The whole picture board is always in view (one fixed camera fitted to the board for any window shape). A toy
// cupboard in the board's lower band holds one wooden shape; the child presses it into its hole and the picture grows,
// one piece a puzzle, into a whole garden, rocket night or robot. Between puzzles the cupboard's roll-up door drops while
// the friend still beams, the next set goes in out of sight, and the door rolls up again: she can touch the next piece
// about a second after the last one clicked in. Pip stands beside the cupboard and watches.
// Ten puzzles a level. From puzzle to puzzle the shape gets a little harder to get to or the hole a little harder to
// find: more holes, a lid over the hole, the shape shut in a box, a block in the hole, then tools (string, key, peg).
//   Level 1  the sunny garden: circle, square, triangle; one step (fit), the question that grows is "which hole?"
//   Level 2  the rocket night: + rectangle, star; hidden things (lids, boxes, blocks in holes)
//   Level 3  the robot's party: + heart, big and small; tools (a string lifts the glass, a key, a peg frees a ball)
// Every new action gets a slow hand demo (and again after 8 s stuck; a touch ends it), 20 s or two wrong holes leave
// only the right hole open, 30 s does the preparing step by itself (never the fit). Nothing placed is ever taken away.
// Calm: one rising note per fitted piece (the level's tune), soft wood and glass sounds, no boings, no confetti.
import * as T from '../three.js';
import { Lesson } from '../engine/lesson.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { camera, project, setCamera } from '../engine/stage.js';
import { toonUnique } from '../engine/toon.js';
import { Ease } from '../engine/tween.js';
import { setFace } from '../engine/actors.js';
import { LEVELS, SLOT, SYM, SAY_STEP } from './puzzles-plan.js';
import { boardTexture } from './puzzles-art.js';
import {
  LAYOUT, layoutReady, makeBoard, makeFrame, SHUTTER_RISE, CUP_UP, makePiece, pieceExtent, setFriendFace, makeStand, makeLid,
  makePlug, makeBox, BOX, setBoxDoor, makeCup, makeCase, CASE, updateCase, makeLockbox, keyholeOf, KEY_IN, HOOK, makeHook, makeKeyRest,
  makeKey, makeRamp, RAMP, rampFloor, makePeg, PEG_HEAD, CUPBOARD, DECK, PLANE, FRONT, SEAT_Z, FLOOR_CLOSED, FLOOR_OPEN, STAND_TOP,
} from './puzzles-parts.js';
import { psfx } from './puzzles-sound.js';
import { scMesh } from '../engine/scenery.js';

const V = (x, y, z) => new T.Vector3(x, y, z);
const glideEase = (t) => (1 - Math.cos(Math.PI * t)) / 2;   // gentle in-out for things travelling along a path
const PIP_AT = [-3.4, 0.8, 0.62];             // Pip stands on the ledge, left of the cupboard
const STAND_Z = 0.5, LEAN = -0.17;             // pieces lean back a little in their stands
const TRAY = { x: 2.83, x0: 2.1, y: 1.07, groove: 0.73, front: 0.93 };
const HINT_DEMO = 8, HINT_ERRORLESS = 20, HINT_SELF = 30;
// the whole picture is always on screen: the board's box (+ the ledge) framed below the caption / Go! / buttons
const VIEW_BOX = { x0: -7.0, x1: 7.0, y0: 0.42, y1: 5.3 };
const VIEW_BAND = { top: 0.15, bottom: 0.97, side: 0.03 };

export default class PuzzlesLesson extends Lesson {
  get totalRounds() { return 10; }
  async start() { await layoutReady; return super.start(); }

  // ================================================================================================ build
  build() {
    this.L = LEVELS[this.level] || LEVELS[0];
    this.lay = LAYOUT.levels[this.level];
    this.finaleRain = false;
    this.admireTime = 5;
    const art = (this.art = boardTexture(this.level, this.lay.holes));
    const B = (this.boardObj = makeBoard(this.level, art.tex));
    this.root.add(B.group);
    this.holes = B.holes;
    this.H = Object.fromEntries(this.holes.map((h) => [h.id, h]));
    for (const h of this.holes) {
      h.anchor = new T.Object3D();
      h.anchor.position.set(h.x, h.y, 0.05);
      h.anchor.userData = { kind: h.shape, size: [h.sx, h.sy], open: false, id: h.id };
      this.root.add(h.anchor);
      h.baseCol = new T.Color(0xf3dfbf);
    }
    this.filled = new Set();
    // Level 1: the first five holes' floors are tinted in their piece's colour
    // every floor has its own colour: plain wood while closed (the hole is only its dotted outline), a dark recess once
    // open. Level 1: the first six holes' floors take their piece's colour when they open (a colour cue)
    for (const h of this.holes) { h.closedCol = new T.Color(0xf3dfbf); h.floor.material = toonUnique(0xf3dfbf, { vertexColors: true }); h.floorS0 = h.floor.scale.clone(); }
    if (this.L.tint) this.L.puzzles.slice(0, 6).forEach((pz) => { this.H[pz.hole].tintCol = new T.Color(pz.color).lerp(new T.Color(0xffffff), 0.3); });
    for (const h of this.holes) { h.openCol = (h.tintCol || h.closedCol).clone().lerp(new T.Color(0x7a5434), 0.25); h.baseCol = h.closedCol; }
    // the toy cupboard in the board's lower band: its roll-up door, and the frame everything for a puzzle sits in
    this.shutter = B.group.userData.parts?.shutter || null;
    if (this.shutter) this.shutter.userData.y0 = this.shutter.position.y;
    this.cart = makeFrame();
    this.root.add(this.cart);
    this.load = this.cart.userData.load;
    // Pip stands on the ledge beside the cupboard (his top at y 2.2 or lower), watching the picture
    const pip = this.pip;
    pip.userData.noWalk = true;
    pip.position.set(...PIP_AT);
    pip.rotation.y = 0.35;
    this.fitPip();
    // lids and plugs that sit on the board from the start of the level (their holes' floors are already down)
    for (const pl of this.L.plugs || []) this.addPlug(this.H[pl.hole]);
    for (const ld of this.L.lids || []) this.addLid(this.H[ld.hole], ld.crooked);
    // touching a waiting lid or plug before its puzzle: it rattles softly (its real drag comes in its own puzzle)
    for (const h of this.holes) for (const o of [h.lid, h.plug]) if (o) this.pokeable(o, { fn: () => { psfx.lidLift(); this.rattle(o, 0.07, false); } });
    this.placed = [];
    this.taught = new Set();
    this.said = new Set();
    this.helpRun = 0;
    this.phase = 'intro';
    this.frameView();
    this.hideBehindBoard();
    this.pokeable(this.pip, { fn: (o) => input.press(o, 140) });
    this.offs.push(input.onAny(() => { this.stuck = 0; this.demoAt8 = false; this.helpedSelf = false; }));
    // the first puzzle is in the cupboard, its door up, from the very first frame
    if (this.shutter) this.shutter.position.y = this.shutter.userData.y0 + SHUTTER_RISE;
    this.loadCart(this.L.puzzles[0]);
    this.unloadCart();
    this.loaded = true;
    this.openHoles(this.L.puzzles[0]);
    this.opened = true;
    this.timing = [];
    this.levelT0 = this.roundT0 = performance.now();
  }
  // the world's scenery (sun, clouds, the digger...) is hidden wherever it would peek out cut off behind the board
  hideBehindBoard() {
    const m = this.meadow;
    if (!m) return;
    camera.updateMatrixWorld(true);
    const rect = (b) => {
      let x0 = 1, x1 = -1, y0 = 1, y1 = -1;
      for (let i = 0; i < 8; i++) {
        const v = V(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z).project(camera);
        x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y);
      }
      return { x0, x1, y0, y1 };
    };
    const B = rect(new T.Box3(V(-6.8, 0.75, 0), V(6.8, 5.2, 0)));
    const box = new T.Box3();
    m.updateMatrixWorld(true);
    const clouds = new Set(m.userData.clouds || []);
    for (const o of m.children) {
      if (!o.visible) continue;
      if (clouds.has(o)) {
        // a drifting cloud whose height crosses the board would slide behind it: it stays away
        box.setFromObject(o);
        const r = rect(box);
        if (box.max.z < -0.3 && r.y1 > B.y0 && r.y0 < B.y1) o.visible = false;
        continue;
      }
      box.setFromObject(o);
      if (box.isEmpty() || box.max.z > -0.3) continue;              // in front of the board or level with it
      const r = rect(box);
      if ((r.x1 - r.x0) * (r.y1 - r.y0) > 1.2) continue;             // ground, sky, hills: the backdrop itself
      const over = r.x1 > B.x0 && r.x0 < B.x1 && r.y1 > B.y0 && r.y0 < B.y1;
      const inside = r.x0 >= B.x0 && r.x1 <= B.x1 && r.y0 >= B.y0 && r.y1 <= B.y1;
      if (over && !inside) o.visible = false;
    }
  }
  fitPip() {
    const pip = this.pip;
    pip.scale.setScalar(1);
    pip.updateMatrixWorld(true);
    const b = new T.Box3().setFromObject(pip);
    const top = b.max.y - pip.getWorldPosition(V(0, 0, 0)).y;
    const k = top > 0 ? Math.min(1, (2.2 - PIP_AT[1] - 0.02) / top) : 0.5;
    pip.scale.setScalar(k);
    pip.userData.baseScale = k;
  }

  // ================================================================================================ camera
  // One fixed view for the whole level (and the finale): the board's real box fitted into the screen band below the
  // caption and the Go! badge, for this window's aspect. Recomputed if the window changes shape.
  fitView() {
    const t = Math.tan((camera.fov * Math.PI) / 360), a = camera.aspect;
    const w = VIEW_BOX.x1 - VIEW_BOX.x0, h = VIEW_BOX.y1 - VIEW_BOX.y0;
    const band = VIEW_BAND.bottom - VIEW_BAND.top;
    const d = Math.max(h / (band * 2 * t), w / ((1 - 2 * VIEW_BAND.side) * 2 * t * a));
    // the box's middle sits at the middle of the band (screen y measured from the top)
    const ndc = 1 - 2 * ((VIEW_BAND.top + VIEW_BAND.bottom) / 2);
    const yc = (VIEW_BOX.y0 + VIEW_BOX.y1) / 2 - ndc * d * t;
    const cx = (VIEW_BOX.x0 + VIEW_BOX.x1) / 2;
    return [V(cx, yc, d), V(cx, yc, 0)];
  }
  frameView() { const [pos, look] = this.fitView(); this.viewAspect = camera.aspect; this.viewFov = camera.fov; setCamera(pos, look); }
  wholeView() { return this.fitView(); }
  creationView() { const [pos, look] = this.fitView(); return { pos, look, dur: 0.01 }; }
  puzzleHoles(pz) {
    const s = new Set([pz.hole, ...pz.open, ...(pz.show || [])]);
    for (const st of pz.steps) if (st.hole) s.add(st.hole);
    for (const e of pz.extra || []) if (e.hole) s.add(e.hole);
    return [...s];
  }
  // cupboard (cart) coordinates -> world
  W(x, y, z) { return this.cart.localToWorld(V(x, y, z)); }

  // ================================================================================================ rounds
  get pz() { return this.L.puzzles[this.round]; }
  async startRound(r) {
    this.busy = true;
    this.phase = 'arrive';
    const pz = this.pz;
    this.cur.helped = false;
    this.tapsOnPiece = 0;
    // the set is already in the cupboard (loaded behind the closed door during the last fit, or at the start)
    if (!this.loaded) { this.loadCart(pz); this.unloadCart(); }
    this.loaded = false;
    // the holes open (floors sink); quiet adapting after two puzzles that needed help: only its own hole
    if (!this.opened) this.openHoles(pz);
    this.opened = false;
    // the "watch this" hiding moves (a piece shut in its box, cups lower and swap, a cup over the key): short
    await (this.hideP || this.hideMoves(pz));
    this.hideP = null;
    if (this.dead) return;
    this.setupSteps(pz);
    this.phase = 'step';
    this.stuck = 0; this.demoAt8 = false; this.helpedSelf = false;
    this.busy = false;
    this.idle = 0;
    // the instruction and the hand demo play while she can already touch (a touch ends the hand)
    // (the very first puzzle waits 1.4 s with its words, so they don't talk over "Let's make a picture!"; touches
    // are open all the while)
    const teachNow = () => {
      if (this.dead || this.round !== r || this.phase !== 'step') return;
      if (pz.say) { this.say(pz.say); this.promptAt = performance.now(); }
      const w = this.want();
      const teach = (pz.teach || []).filter((k) => !this.taught.has(k));
      if (teach.length && w) {
        const k = teach[0] === 'choose' ? 'choose' : w.kind;
        this.taught.add(teach[0]);
        if (k !== 'choose') this.taught.add(k);
        this.demo(k);
      }
    };
    if (r === 0) this.s.wait(1.4).then(teachNow); else teachNow();
    this.waitReady = r;                 // update() logs when touches are really open (the engine's gate too)
  }
  openHoles(pz) {
    const opens = this.helpRun >= 2 ? [pz.hole] : pz.open;
    for (const id of opens) { const h = this.H[id]; if (!h.open && !h.filled) this.openHole(h, 0.35); }
  }

  // ---------------------------------------------------------------- the cart's load
  slotX(s) { return SLOT[s]; }
  loadCart(pz) {
    const load = this.load;
    // last puzzle's tray contents and empty fittings go (the cupboard door is down: out of sight)
    for (const o of [...load.children]) { load.remove(o); }
    this.fits = {};
    this.key = null; this.peg = null; this.cups = null; this.trayLid = null;
    this.piece = makePiece(pz);
    const p = this.piece, u = p.userData;
    u.spin.rotation.z = ((pz.rot || 0) * Math.PI) / 180;
    u.startRot = u.spin.rotation.z;
    // where the piece rests, in cart space
    if (pz.at) {
      const x = this.clearX(this.slotX(pz.at), this.halfWidth(p));
      const st = makeStand(); st.position.set(x, DECK, STAND_Z); load.add(st);
      this.placeOnStand(p, x);
      u.homeKind = 'stand';
    }
    for (const f of pz.fit || []) {
      if (f.kind === 'box') {
        const b = makeBox(f.color);
        const two = pz.fit.filter((g) => g.kind === 'box').length > 1, k = two ? 0.9 : 1;
        b.scale.set(k, 1, 1);
        b.position.set(this.clearX(this.slotX(f.at), BOX.W * k), DECK, 0.55);
        load.add(b);
        b.userData.fid = f.id; b.userData.hasPiece = !!f.piece;
        this.fits[f.id] = b;
        if (f.piece) {
          if (f.rot) u.spin.rotation.z = u.startRot = (f.rot * Math.PI) / 180;
          // starts with its door up (out of sight) and the piece showing inside; the door slides down while she watches
          setBoxDoor(b, 1);
          const e = pieceExtent(p);
          p.position.set(b.position.x, DECK + 0.09 - e.lo + 0.005, 0.55);
          u.homeKind = 'box'; u.box = b;
        } else if (f.watch === undefined && pz.fit.some((g) => g.piece)) {
          setBoxDoor(b, 1);
        }
      } else if (f.kind === 'cups') {
        // the star stands on the cupboard floor at B; two cups wait up in the cupboard's top above B and C
        const e = pieceExtent(p);
        const cx = (s) => this.slotX(s) * 1.2;
        p.position.set(cx(f.piece), DECK - e.lo + 0.005, 0.66);
        u.homeKind = 'deck';
        this.cups = f.at.map((s) => {
          const c = makeCup(0x7fc8ff);
          c.position.set(cx(s), DECK, 0.66);
          c.scale.set(1.12, 1.25, 1.1);
          c.userData.slide.position.y = CUP_UP;
          c.userData.lifted = true;
          load.add(c);
          return c;
        });
        this.cups[0].userData.covers = p;
        this.fits.cupB = this.cups[0]; this.fits.cupC = this.cups[1];
      } else if (f.kind === 'case') {
        const c = makeCase();
        c.position.set(0, DECK, 0.5);
        load.add(c);
        const st = makeStand(); st.position.set(0, DECK, STAND_Z); load.add(st);
        this.placeOnStand(p, 0);
        u.homeKind = 'stand'; u.inCase = c;
        this.fits.case = c;
      } else if (f.kind === 'lock') {
        // the lock box stands left (clear of the wall); its big padlock lies on its side at the box's right, keyhole
        // facing right, so the key goes in from the right lying flat, in full view
        const lb = makeLockbox(!!f.wide), S = lb.userData.S;
        lb.position.set(-1.15, DECK, 0.45);
        load.add(lb);
        const e = pieceExtent(p);
        p.position.set(-1.15, DECK + 0.06 - e.lo + 0.004, 0.45);       // on the box's floor
        u.homeKind = 'deck'; u.inLock = lb; u.noLean = true;
        this.fits.lock = lb;
        const key = (this.key = makeKey());
        key.userData.lockbox = lb;
        if (f.key === 'hook') {
          // the key's bow hangs on the hook's peg (it slides off forward), its shaft pointing down
          const hk = makeHook(); hk.position.set(1.75, DECK, 0.42); load.add(hk);
          key.position.set(1.75, DECK + HOOK.y + 0.05 - 0.18, 0.42 + HOOK.z);
          key.userData.turn.rotation.z = Math.PI / 2;
          key.userData.homeKind = 'hook';
        } else {
          // lying on its side: the bow stands on the floor, the shaft rests on a little block
          const rest = makeKeyRest(); rest.position.set(1.55 - 0.7, DECK, 0.62); load.add(rest);
          key.position.set(1.55, DECK + 0.4 + 0.004, 0.62);
          key.userData.turn.rotation.z = 0;
          key.userData.homeKind = 'deck';
        }
        load.add(key);
      } else if (f.kind === 'cup') {
        const c = makeCup(0x7fc8ff);
        c.position.set(1.55 - 0.29, DECK, 0.62);
        c.scale.set(1.5, 1.08, 1.1);                   // a wide cup: the big key lies under it
        c.userData.slide.position.y = CUP_UP;
        c.userData.lifted = true;
        c.userData.covers = this.key;
        load.add(c);
        this.fits[f.id] = c;
        this.cups = [c];
      } else if (f.kind === 'ramp') {
        const r = makeRamp(); r.position.set(0, DECK, 0.5); load.add(r);
        const e = pieceExtent(p);
        p.position.set(RAMP.ball, DECK + rampFloor(RAMP.ball) - e.lo + 0.005, 0.5);
        u.homeKind = 'tube';
        const peg = (this.peg = makePeg());
        peg.position.set(RAMP.pegX, DECK + rampFloor(RAMP.pegX) - 0.02, 0.5);
        load.add(peg);
        this.fits.ramp = r;
      }
    }
    load.add(p);
    for (const c of this.cups || []) if (c.userData.covers === p) c.userData.covers = p;
  }
  // a piece leaning back in a stand at cart x: its lowest point sits in the groove (the centre moves back a little)
  placeOnStand(p, x, lean = LEAN) {
    const e = pieceExtent(p);
    p.rotation.x = lean;
    p.position.set(x, DECK + STAND_TOP - e.lo * Math.cos(lean) + 0.004, STAND_Z - e.lo * Math.sin(lean));
  }
  // half the piece's width as it stands; a resting place keeps 0.2 clear of the cupboard's left wall and of the tray
  halfWidth(p) { p.updateMatrixWorld(true); const b = new T.Box3().setFromObject(p); return (b.max.x - b.min.x) / 2; }
  clearX(x, hw) { return Math.min(Math.max(x, CUPBOARD.x0 + 0.2 + hw), TRAY.x0 - 0.2 - hw); }
  // at the start of the turn: the piece (and the key, the lids that will come off) live in world space
  unloadCart() {
    const p = this.piece;
    this.root.attach(p);
    if (this.key) this.root.attach(this.key);
    p.userData.home = this.homeOf(p);
    if (this.key) this.key.userData.home = this.homeOf(this.key);
  }
  // rest pose + the way out of it (lift, then forward to the front plane): the way home is the reverse
  homeOf(o) {
    const u = o.userData, pos = o.position.clone();
    const out = [];
    const kind = u.homeKind;
    // lifted just enough to clear the stand's lip, never so far that it would touch the cupboard's top on the way out
    const top = u.piece ? pos.y + pieceExtent(o).hi : pos.y + 0.4;
    if (kind === 'stand') { out.push(pos.clone().add(V(0, Math.max(0.03, Math.min(0.17, 2.31 - top)), 0))); }
    else if (kind === 'box') { out.push(pos.clone().add(V(0, 0.07, 0))); }
    else if (kind === 'deck') { out.push(pos.clone().add(V(0, u.inLock ? 0.04 : 0.09, 0))); }
    else if (kind === 'hook') { out.push(pos.clone().add(V(0, 0.03, 0))); out.push(pos.clone().add(V(0, 0.03, 0.45))); }
    else if (kind === 'cradle' || kind === 'tube') { out.push(pos.clone().add(V(0, 0.26, 0))); }
    const last = out.length ? out[out.length - 1] : pos;
    out.push(V(last.x, last.y, FRONT));
    return { pos, rotX: o.rotation.x, out };
  }

  // ---------------------------------------------------------------- holes
  openHole(h, dur = 0.4) {
    h.open = true; h.anchor.userData.open = true;
    const z0 = h.floor.position.z, c0 = h.floor.material.color.clone();
    h.baseCol = h.openCol;
    return this.s.anim(dur, (e) => { h.floor.position.z = z0 + (FLOOR_OPEN - z0) * e; h.floor.material.color.copy(c0).lerp(h.openCol, e); }, Ease.inOut);
  }
  closeHole(h, dur = 0.4) {
    h.open = false; h.anchor.userData.open = false;
    const z0 = h.floor.position.z, c0 = h.floor.material.color.clone();
    h.baseCol = h.closedCol;
    return this.s.anim(dur, (e) => { h.floor.position.z = z0 + (FLOOR_CLOSED - z0) * e; h.floor.material.color.copy(c0).lerp(h.closedCol, e); }, Ease.inOut);
  }
  addLid(h, crooked) {
    const lid = makeLid(h);
    const [dx, dy, a] = crooked || [0, 0, 0];
    lid.position.set(h.x + dx, h.y + dy, 0);
    lid.rotation.z = (a * Math.PI) / 180;
    // it lies inside the picture frame: never over the rim (a top-row lid moves down a touch)
    const ca = Math.abs(Math.cos(lid.rotation.z)), sa = Math.abs(Math.sin(lid.rotation.z));
    const ey = (lid.userData.w * sa + lid.userData.h * ca) / 2, ex = (lid.userData.w * ca + lid.userData.h * sa) / 2;
    const yTop = 5.2 - 0.12 - 0.01, xIn = 6.8 - 0.12 - 0.01;
    if (lid.position.y + ey > yTop) lid.position.y = yTop - ey;
    if (lid.position.x + ex > xIn) lid.position.x = xIn - ex;
    if (lid.position.x - ex < -xIn) lid.position.x = -xIn + ex;
    this.root.add(lid);
    this.placeFeet(lid);
    h.lid = lid; lid.userData.hole = h;
    lid.userData.rest = { pos: lid.position.clone(), rz: lid.rotation.z };
    h.open = true; h.anchor.userData.open = true;
    h.floor.position.z = FLOOR_OPEN;
    if (h.openCol) { h.baseCol = h.openCol; h.floor.material.color.copy(h.openCol); }
  }
  // four feet where the lid stands on bare board (never over a recess)
  placeFeet(lid) {
    const u = lid.userData, w = u.w, hh = u.h;
    lid.updateMatrixWorld(true);
    const cands = [];
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
      const k = 1 / Math.max(Math.abs(c) / (w / 2 - 0.08), Math.abs(s) / (hh / 2 - 0.08));
      cands.push([c * k, s * k, a]);
    }
    const ok = cands.filter(([x, y]) => {
      const wp = lid.localToWorld(V(x, y, 0));
      return this.holes.every((h) => polyDist(h.poly, wp.x, wp.y) > 0.07);
    });
    const feet = [];
    for (const q of [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4]) {
      let best = null, bd = Infinity;
      for (const c of ok) { const d = Math.abs(((c[2] - q + Math.PI * 3) % (Math.PI * 2)) - Math.PI); if (d < bd && !feet.includes(c)) { bd = d; best = c; } }
      if (best) feet.push(best);
    }
    for (const [x, y] of feet) {
      const f = scMeshSafe('prop_pz_lid', 'foot');
      if (!f) continue;
      f.position.set(x, y, 0);
      lid.add(f);
    }
  }
  addPlug(h) {
    // a plug sits on the open floor: a circle or square hole takes the full 0.6 bung; a small triangle a smaller one
    let s = 1, oy = 0;
    if (h.shape === 'triangle') { const b = h.sx + 0.08, ht = h.sy + 0.08, leg = Math.hypot(b / 2, ht); const r = (b * ht) / (b + 2 * leg); s = Math.min(1, (r * 2 - 0.08) / 0.6); oy = -(ht / 2) + r; }
    const pl = makePlug(s);
    pl.position.set(h.x, h.y + oy, 0);
    this.root.add(pl);
    h.plug = pl; pl.userData.hole = h;
    pl.userData.rest = pl.position.clone();
    h.open = true; h.anchor.userData.open = true;
    h.floor.position.z = FLOOR_OPEN;
    if (h.openCol) { h.baseCol = h.openCol; h.floor.material.color.copy(h.openCol); }
  }

  // ---------------------------------------------------------------- hiding moves before the turn
  // "watch where it goes": first a look (the piece wiggles, Pip turns to it, 0.5 s), then it is hidden slowly
  async hideMoves(pz) {
    const watch = (pz.fit || []).filter((f) => f.watch);
    if (!watch.length) return;
    const shown = this.key && watch.some((f) => f.over === 'key') ? this.key : this.piece;
    this.pipWatch(shown.getWorldPosition(V(0, 0, 0)));
    const r0 = shown.rotation.z;
    await this.s.anim(0.35, (_, t) => { shown.rotation.z = r0 + Math.sin(t * Math.PI * 3) * 0.07 * (1 - t); });
    shown.rotation.z = r0;
    await this.wait(0.15);
    const close = (b, dur) => { const k0 = b.userData.doorK; return this.s.anim(dur, (e) => setBoxDoor(b, k0 * (1 - e)), Ease.inOut); };
    for (const f of watch) {
      if (f.kind === 'box') {
        psfx.lidLift();
        // two boxes: the empty one shuts first, a pause, then the one with the piece (her eye ends on it)
        const empty = Object.values(this.fits).filter((x) => x.userData.box && !x.userData.hasPiece);
        if (empty.length) { await Promise.all(empty.map((x) => close(x, 0.35))); await this.wait(0.15); }
        await close(this.fits[f.id], empty.length ? 0.45 : 0.5);
        this.piece.visible = false;          // shut in its box (out of sight; it is there again when the box opens)
        this.piece.userData.home = this.homeOf(this.piece);
      } else if (f.kind === 'cups') {
        psfx.lidLift();
        await Promise.all(this.cups.map((c) => this.slideCup(c, 0, 0.45)));
        this.piece.visible = false;
      } else if (f.kind === 'cup' && f.over === 'key') {
        psfx.lidLift();
        await this.slideCup(this.fits[f.id], 0, 0.45);
        this.key.visible = false;
      }
    }
  }
  slideCup(c, y, dur) { const sl = c.userData.slide, y0 = sl.position.y; c.userData.lifted = y > 0.1; return this.s.anim(dur, (e) => { sl.position.y = y0 + (y - y0) * e; }, Ease.inOut); }
  // ================================================================================================ steps
  setupSteps(pz) {
    this.steps = pz.steps.map((s) => ({ ...s, needs: s.needs || [] }));
    this.done = new Set();
    // a lid that already came off (L2 P9 -> P10) is already done
    for (const s of this.steps) if (s.kind === 'lid' && !this.H[s.hole].lid) this.done.add(s.id);
    this.targets = [];
    const p = this.piece;
    // the piece: draggable unless something shuts it away (box, cup, glass, lock, peg)
    const gated = this.steps.some((s) => ['box', 'cup', 'ring', 'key', 'peg'].includes(s.kind));
    p.userData.free = !gated;
    this.addPieceDrag(p);
    // tap fallback: tapping an open hole sends the waiting piece there
    this.holeTaps = this.puzzleHoles(pz).map((id) => {
      const h = this.H[id];
      const t = input.addTap(h.anchor, { radius: Math.max(h.sx, h.sy) * 0.42, onTap: () => this.tapHole(h), press: false });
      this.targets.push(t);
      return t;
    });
    // lids and plugs in play this puzzle (plus the optional panel lid in L2 P9)
    const lidHoles = [...this.steps.filter((s) => s.kind === 'lid').map((s) => s.hole), ...(pz.extra || []).filter((e) => e.kind === 'lid').map((e) => e.hole)];
    for (const id of lidHoles) { const lid = this.H[id].lid; if (lid) this.addLidDrag(lid); }
    for (const s of this.steps.filter((x) => x.kind === 'plug')) { const pl = this.H[s.hole].plug; if (pl) this.addPlugDrag(pl); }
    for (const b of Object.values(this.fits).filter((x) => x.userData.box)) this.addBoxDrag(b);
    for (const c of this.cups || []) this.addCupDrag(c);
    if (this.fits.case) this.addRingDrag(this.fits.case);
    if (this.key) this.addKeyDrag(this.key);
    if (this.peg) this.addPegDrag(this.peg);
    // touching a piece that is still behind glass / locked / held by the peg
    const blocked = input.addTap(p, { radius: 0.7, onTap: () => this.blockedTap(), press: false });
    blocked.enabled = false;
    p.userData.blockedTap = blocked;
    this.targets.push(blocked);
    this.refreshTargets();
  }
  live(s) { return !this.done.has(s.id) && s.needs.every((n) => this.done.has(n)); }
  // the current step: { kind, obj }
  want() {
    if (!this.steps) return null;
    const s = this.steps.find((x) => this.live(x) && x.kind !== 'fit') || this.steps.find((x) => this.live(x));
    if (!s) return null;
    return { kind: s.kind, obj: this.stepObj(s), id: s.id };
  }
  stepObj(s) {
    switch (s.kind) {
      case 'lid': return this.H[s.hole].lid;
      case 'plug': return this.H[s.hole].plug;
      case 'box': return this.fits[s.obj];
      case 'cup': return this.cups.find((c) => c.userData.covers === this.piece || c.userData.covers === this.key) || this.fits[s.obj];
      case 'ring': return this.fits.case;
      case 'key': return this.key;
      case 'peg': return this.peg;
      default: return this.piece;
    }
  }
  stepDone(id) {
    if (this.done.has(id)) return;
    this.done.add(id);
    this.refreshTargets();
    this.idle = 0; this.ladder = 0; this.stuck = 0; this.helpedSelf = false; this.demoAt8 = false;
    const pz = this.pz, w = this.want();
    if (!w) return;
    // a new kind of step shows up mid-puzzle (L3 P3: the block under the lid)
    const later = pz.sayLater && pz.sayLater[w.kind];
    if (later) this.say(later);
    if ((pz.teach || []).includes(w.kind) && !this.taught.has(w.kind)) { this.taught.add(w.kind); this.demo(w.kind); }
  }
  // which targets are on: the piece only when free; in errorless mode only the current step's object
  refreshTargets() {
    const w = this.want(), p = this.piece;
    const strict = this.errorlessOn && this.steps.length > 1;
    for (const t of this.targets) {
      const o = t.obj;
      let on = true;
      if (o === p) on = t === p.userData.blockedTap ? !p.userData.free && this.blockedKind() !== null : !!p.userData.free;
      else if (t.kind === 'tap' && this.holeTaps.includes(t)) { const h = this.holes.find((x) => x.anchor === o); on = !!p.userData.free && h.open && !h.filled && !h.lid && !h.plug; }
      else if ((o.userData.target || o).userData.used) on = false;
      const real = o.userData.target || o;
      if (strict && w && on && real !== w.obj && !(w.kind === 'fit' && (o === p || this.holeTaps.includes(t)))) on = false;
      if (this.animN > 0) on = false;
      t.enabled = on;
    }
  }
  canAct() { return this.phase === 'step' && !this.busy && !this.dead && !(this.animN > 0); }
  // an animation of ours is running: every target rests until it ends (counted, they nest)
  hold(k, kind = '') {
    const was = this.animN || 0;
    this.animN = Math.max(0, was + k);
    if (!was && this.animN) { this.holdT0 = performance.now(); this.holdKind = kind; }
    if (was && !this.animN && this.timing && this.phase === 'step') {
      const sec = (performance.now() - this.holdT0) / 1000;
      if (sec > 0.5) this.timing.push({ lock: this.holdKind || 'anim', s: +sec.toFixed(2) });
    }
    if (this.steps) this.refreshTargets();
  }

  // ================================================================================================ the piece
  addPieceDrag(p) {
    const u = p.userData;
    const e = pieceExtent(p);
    u.drag = input.addDrag(p, {
      radius: Math.max(0.45, Math.max(u.pz.size[0], u.pz.size[1]) * 0.55),
      zones: () => this.pieceZones(),
      minY: DECK + 0.3,
      onPick: () => this.pick(p),
      onDrop: (z, info) => this.dropPiece(z, info),
      magnet: 0.3,
    });
    this.targets.push(u.drag);
    u.drag.minY = DECK - e.lo + 0.02;
  }
  pieceZones() {
    if (!this.pz) return [];
    return this.puzzleHoles(this.pz).map((id) => this.H[id]).filter((h) => !h.filled && (h.open || h.lid || h.plug)).map((h) => ({
      hole: h.anchor, h, right: h.id === this.pz.hole, pos: V(h.x, h.y, PLANE), radius: Math.max(h.sx, h.sy) * 0.55 + 0.12,
      onNear: (k) => this.nearHole(h, k),
    }));
  }
  zones() { return this.pieceZones(); }
  // carried near the right (open, clear) hole: the piece turns toward the hole's angle, the floor warms a little
  nearHole(h, k) {
    const p = this.piece;
    if (!p || h.id !== this.pz.hole) return;
    const clear = h.open && !h.lid && !h.plug;
    const u = p.userData;
    const goal = this.targetAngle(p, h);
    const m = clear ? Math.min(1, k / 0.7) : 0;
    u.spin.rotation.z = u.startRot + (goal - u.startRot) * Ease.inOut(m);
    // the right hole warms and opens a touch toward her
    h.floor.material.color.copy(h.baseCol).lerp(new T.Color(0xffc47a), 0.45 * m);
    if (h.floorS0) h.floor.scale.set(h.floorS0.x * (1 + 0.04 * m), h.floorS0.y * (1 + 0.04 * m), h.floorS0.z);
  }
  targetAngle(p, h) {
    const sym = SYM[p.userData.pz.shape];
    const a = (h.a * Math.PI) / 180, s0 = p.userData.startRot;
    if (!sym) return s0;
    const step = (sym * Math.PI) / 180;
    return a + Math.round((s0 - a) / step) * step;
  }
  pick(o) {
    const u = o.userData;
    fx.clearHands();
    this.clearHints();
    this.carry = o;
    // grabbed while walking home: it stops right there under her finger
    if (u.homing) { u.homeTok = null; u.homing = false; u.parked = false; return; }
    if (u.parked !== false) this.unpark(o);
  }
  // lift the thing out of its resting place along its way out, then it is free to follow the finger
  unpark(o, { dur = 0.26 } = {}) {
    const u = o.userData, h = u.home;
    u.parked = false;
    if (!h) return Promise.resolve();
    const pts = [o.position.clone(), ...h.out];
    const rx0 = o.rotation.x;
    u.unparking = true;
    const curve = new T.CatmullRomCurve3(dedupePts(pts), false, 'centripetal');
    dur = Math.max(dur, Math.min(0.6, curve.getLength() / 4.5));        // out of the cupboard at a calm, quick pace
    return this.s.anim(dur, (e) => { o.position.copy(curve.getPointAt(e)); o.rotation.x = rx0 * (1 - e); }, glideEase).then(() => { u.unparking = false; });
  }
  // walk home: forward to the front plane, across, then back into the resting place
  // (quick, 8 units/s, at most 0.8 s, and she can grab it on the way: nothing waits for it)
  goHome(o, { dur = 0.35 } = {}) {
    const u = o.userData, h = u.home;
    if (!h) return Promise.resolve();
    u.homing = true;
    const tok = (u.homeTok = {});
    const p0 = o.position.clone();
    const pts = [p0];
    if (Math.abs(p0.z - FRONT) > 0.05) pts.push(V(p0.x, p0.y, FRONT));
    const back = [...h.out].reverse();
    if (back[0].distanceTo(pts[pts.length - 1]) > 0.05) pts.push(back[0]);
    for (const q of back.slice(1)) pts.push(q);
    pts.push(h.pos.clone());
    const curve = new T.CatmullRomCurve3(dedupePts(pts), false, 'centripetal');
    dur = Math.max(dur, Math.min(0.8, curve.getLength() / 8.0));
    const rx1 = h.rotX, rx0 = o.rotation.x, sp = u.spin, s0 = sp ? sp.rotation.z : 0, s1 = u.startRot ?? s0;
    return this.s.anim(dur, (e) => {
      if (u.homeTok !== tok) return;
      o.position.copy(curve.getPointAt(e));
      if (e > 0.6) o.rotation.x = rx0 + (rx1 - rx0) * ((e - 0.6) / 0.4);
      if (sp) sp.rotation.z = s0 + (s1 - s0) * e;
    }, glideEase).then(() => { if (u.homeTok !== tok) return; o.position.copy(h.pos); o.rotation.x = rx1; u.homing = false; u.parked = true; });
  }
  dropPiece(zone, { tapped } = {}) {
    const p = this.piece;
    this.carry = null;
    if (!p) return;
    if (this.phase !== 'step' || this.busy) { this.goHome(p); return; }
    const only = this.onlyHole();
    if (tapped && !zone) {
      // a tap on the piece: with one clear hole open it glides in by itself (she caused it); otherwise it presses in
      // and the hand shows the drag
      if (only) { this.goTo(p, only); return; }
      this.goHome(p);
      this.demo('fit');
      return;
    }
    this.tapsOnPiece = 0;
    // forgiving drop: with only one hole to go to, a let-go anywhere above the cupboard finishes the fit
    if (!zone && only && p.position.y + pieceExtent(p).lo > CUPBOARD.y1) { this.goTo(p, only); return; }
    if (!zone) { this.goHome(p); return; }
    this.tryFit(zone.h);
  }
  // the one clear open hole, when the puzzle (or errorless help) leaves only one to go to
  onlyHole() {
    const zs = this.pieceZones().filter((z) => z.h.open && !z.h.lid && !z.h.plug);
    if (zs.length === 1 && zs[0].right) return zs[0].h;
    if (this.errorlessOn) { const h = this.H[this.pz.hole]; if (h.open && !h.lid && !h.plug) return h; }
    return null;
  }
  goTo(p, h) { this.travelTo(p, h, 0.6).then(() => { if (!this.dead) this.tryFit(h); }); }
  // autoplay hook: drop the piece on a zone
  drop(zone, info = {}) {
    if (!this.canAct() || !this.piece.userData.free || !zone) return;
    this.travelTo(this.piece, zone.h).then(() => { if (!this.dead) this.tryFit(zone.h); });
  }
  tapHole(h) {
    const p = this.piece;
    if (!this.canAct() || !p.userData.free || p.userData.homing) return;
    this.travelTo(p, h).then(() => this.tryFit(h));
  }
  // the piece goes to a hole by itself (tap fallback): out of its rest, along the front, up to the hole
  async travelTo(p, h, dur = 0.8) {
    this.hold(1);
    if (p.userData.parked !== false) await this.unpark(p, { dur: 0.25 });
    const p0 = p.position.clone();
    const pts = [p0, V(p0.x, Math.max(p0.y, 2.6), FRONT), V(h.x, h.y, PLANE + 0.3), V(h.x, h.y, PLANE)];
    const c = new T.CatmullRomCurve3(dedupePts(pts), false, 'centripetal');
    dur = Math.max(dur, Math.min(1.2, c.getLength() / 6.0));
    await this.s.anim(dur, (e) => p.position.copy(c.getPointAt(e)), glideEase);
    this.hold(-1);
  }
  async tryFit(h) {
    const p = this.piece, pz = this.pz;
    if (!p || this.dead) return;
    this.idle = 0;
    const right = h.id === pz.hole;
    if (h.lid || h.plug) return this.bump(h, h.lid ? SAY_STEP.lid : SAY_STEP.plug);
    if (!right) {
      const tooBig = h.shape === pz.shape && Math.max(h.sx, h.sy) < Math.max(pz.size[0], pz.size[1]);
      return this.wrongHole(h, tooBig, this.H[pz.hole]);
    }
    return this.fit(h);
  }
  // the right hole: hover a breath, then sink in with one wooden note; the friend beams, Pip nods
  async fit(h) {
    const p = this.piece, u = p.userData, pz = this.pz;
    this.hold(1);
    this.phase = 'fit';
    for (const t of this.targets) t.enabled = false;
    fx.clearHands(); this.clearHints();
    const goal = this.targetAngle(p, h);
    const p0 = p.position.clone(), s0 = u.spin.rotation.z, rx0 = p.rotation.x;
    const pay = (async () => {
      await this.s.anim(0.25, (e) => {
        p.position.set(p0.x + (h.x - p0.x) * e, p0.y + (h.y - p0.y) * e, p0.z + (PLANE - p0.z) * e);
        u.spin.rotation.z = s0 + (goal - s0) * e;
        p.rotation.x = rx0 * (1 - e);
      }, Ease.inOut);
      await this.wait(0.15);
      await this.s.anim(0.18, (e) => { p.position.z = PLANE + (SEAT_Z - PLANE) * e; }, Ease.in);
      p.position.set(h.x, h.y, SEAT_Z);
      u.spin.rotation.z = goal;
      h.filled = p; this.filled.add(h.id);
      sfx.step(this.placed.length, 10);
      this.placed.push(p);
      this.art.draw(this.filled);
      const f0 = h.floor.scale.clone();
      this.s.anim(0.25, (_, t) => { const k = 1 - 0.02 * Math.sin(t * Math.PI); p.scale.set(1, 1, k); h.floor.scale.set(f0.x, f0.y, f0.z * k); }).then(() => { p.scale.set(1, 1, 1); h.floor.scale.copy(f0); });
      if (!this.friend && pz.deco && ['sun', 'moon', 'robot'].includes(pz.deco)) this.friend = p;
      this.friendJoy();
      this.pokeable(p, { note: this.placed.length - 1, of: 10 });
      if (this.dead) return;
      // straight on: while the friend still beams, the cupboard door drops, the next set goes in, the door rolls up
      // the shape's name at her click (always spoken: it is the word she is learning), the picture word after it
      this.say(pz.name, { repeat: true });
      const last = this.round >= this.totalRounds;
      if (pz.word) this.s.wait(last ? 0.6 : 0.9).then(() => { if (!this.dead) this.say(pz.word, { voice: false }); });
      if (!last) await this.swapSet(this.L.puzzles[this.round]);
      else await this.wait(1.6);
    })();
    this.payoffP = pay;
    this.hold(-1);
    const hp = V(h.x, h.y, 0);
    this.success(hp, '', { still: 0 });
  }
  friendJoy(sec = 1.0) {
    const f = this.friend;
    if (!f) return;
    setFriendFace(f, 'joy');
    this.s.wait(sec).then(() => { if (!this.finaleOn) setFriendFace(f, 'calm'); });
  }
  // a wrong hole: the piece goes there, stops against the rim, rocks once, and walks home
  // a wrong hole: the piece goes there, stops against the rim, rocks once, and walks home (grabbable on the way)
  async wrongHole(h, tooBig, target) {
    const p = this.piece;
    this.hold(1, 'wrong');
    this.pipTilt();
    const p0 = p.position.clone();
    await this.s.anim(0.25, (e) => p.position.set(p0.x + (h.x - p0.x) * e, p0.y + (h.y - p0.y) * e, p0.z + (PLANE - p0.z) * e), Ease.inOut);
    await this.s.anim(0.15, (e) => { p.position.z = PLANE + (0.2 - PLANE) * e; }, Ease.out);
    sfx.nope();
    const r0 = p.rotation.z;
    await this.s.anim(0.3, (_, t) => { p.rotation.z = r0 + Math.sin(t * Math.PI * 2) * 0.105 * (1 - t); });
    p.rotation.z = r0;
    const cover = target && (target.lid || target.plug);
    if (tooBig) this.sayOnce('Too big!');
    else if (cover) { this.rattle(cover, 0.07); this.sayOnce(target.lid ? SAY_STEP.lid : SAY_STEP.plug); }   // its hole is under that
    else this.sayOnce('Try another hole!');
    this.countWrong();
    this.hold(-1);
    this.goHome(p);
  }
  // pushed at a covered or plugged hole: it bumps and walks home; the lid / plug rattles and its knob glows
  async bump(h, line) {
    const p = this.piece, cover = h.lid || h.plug;
    this.hold(1, 'bump');
    const p0 = p.position.clone();
    await this.s.anim(0.25, (e) => p.position.set(p0.x + (h.x - p0.x) * e, p0.y + (h.y - p0.y) * e, p0.z + (PLANE + 0.05 - p0.z) * e), Ease.inOut);
    sfx.nope();
    this.rattle(cover, 0.07);
    this.sayOnce(line);
    this.countWrong();
    await this.wait(0.12);
    this.hold(-1);
    this.goHome(p);
  }
  // a halo round the middle of a thing (not its feet)
  addHalo(obj, r) {
    if (!obj) return;
    let a = obj.userData.haloAt;
    if (!a) {
      obj.updateMatrixWorld(true);
      const b = new T.Box3().setFromObject(obj);
      a = obj.userData.haloAt = new T.Object3D();
      if (!b.isEmpty()) a.position.copy(obj.worldToLocal(b.getCenter(V(0, 0, 0))));
      obj.add(a);
    }
    super.addHalo(a, r);
  }
  rattle(o, amt = 0.07, glow = true) {
    if (!o || o.userData.rattling || o.userData.used) return;
    o.userData.rattling = true;
    const r0 = o.rotation.z;
    this.s.anim(glow ? 0.6 : 0.3, (_, t) => { o.rotation.z = r0 + Math.sin(t * Math.PI * 4) * amt * (1 - t * 0.5); }).then(() => { o.rotation.z = r0; o.userData.rattling = false; });
    if (!glow) return;
    const stop = fx.halo(o, 0.5);
    this.s.wait(1.5).then(stop);
  }
  // a wrong try counts (two in a puzzle bring the errorless help) without the engine's 0.7 s touch lock
  countWrong() { this.cur.wrong++; if (this.cur.wrong >= 2) this.errorless(); }
  sayOnce(line) { const first = !this.said.has(line); this.said.add(line); this.say(line, { voice: first }); }
  pipTilt() {
    const h = this.pip?.userData?.head;
    if (!h || this.pip.userData.busyAnim) return;
    const z0 = h.rotation.z;
    this.s.anim(0.7, (_, t) => { h.rotation.z = z0 + Math.sin(t * Math.PI) * 0.22; }).then(() => { h.rotation.z = z0; });
  }
  // Pip only nods (the face friend is the one who beams)
  pipWatch(pos = null) {
    const h = this.pip?.userData?.head;
    if (!h || this.pip.userData.busyAnim) return;
    const x0 = h.rotation.x;
    this.s.wait(0.2).then(() => this.s.anim(0.5, (_, p) => { h.rotation.x = x0 + Math.sin(p * Math.PI) * 0.22; })).then(() => { h.rotation.x = x0; });
  }
  // the piece is behind glass, locked in, or held in the tube by the peg
  blockedKind() {
    const u = this.piece?.userData;
    if (!u || u.free) return null;
    if (u.inCase && !this.fits.case.userData.latched) return 'glass';
    if (u.inLock && this.fits.lock.userData.locked) return 'lock';
    if (u.homeKind === 'tube') return 'peg';
    return null;
  }
  blockedTap() {
    if (!this.canAct()) return;
    const k = this.blockedKind(), p = this.piece;
    if (!k) return;
    this.idle = 0;
    // the piece wiggles where it is
    const r0 = p.rotation.z;
    this.s.anim(0.45, (_, t) => { p.rotation.z = r0 + Math.sin(t * Math.PI * 3) * 0.06 * (1 - t); }).then(() => { p.rotation.z = r0; });
    if (k === 'glass') {
      psfx.glassTink();
      this.glint(this.fits.case.userData.pane);
      const r = this.fits.case.userData.ring;
      const y0 = r.position.y;
      this.s.anim(0.5, (_, t) => { r.position.y = y0 + Math.sin(t * Math.PI) * 0.06; }).then(() => { r.position.y = y0; });
      this.sayOnce(SAY_STEP.ring);
    } else if (k === 'lock') {
      psfx.glassTink();
      const lb = this.fits.lock.userData;
      this.rattle(lb.pad, 0.08);
      this.sayOnce(SAY_STEP.key);
    } else {
      sfx.nope();
      this.rattle(this.peg, 0.05);
      this.sayOnce(SAY_STEP.peg);
    }
  }
  // a white glint slides across the glass
  glint(pane) {
    if (!pane) return;
    const g = new T.Mesh(new T.PlaneGeometry(0.16, 1.2), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }));
    g.rotation.z = -0.5;
    g.position.set(-0.8, 0.65, 0.3);
    pane.add(g);
    this.s.anim(0.4, (e, t) => { g.position.x = -0.8 + 1.6 * e; g.material.opacity = Math.sin(t * Math.PI) * 0.7; }).then(() => { pane.remove(g); g.geometry.dispose(); g.material.dispose(); });
  }

  // ================================================================================================ lids and plugs
  addLidDrag(lid) {
    const u = lid.userData;
    u.home = { pos: u.rest.pos.clone(), rotX: 0, out: [V(u.rest.pos.x, u.rest.pos.y, 0.35)] };
    u.freeZ = 0.35;
    u.drag = input.addDrag(lid, {
      radius: Math.max(u.w, u.h) * 0.5,
      zones: () => [{ pos: V(u.rest.pos.x, u.rest.pos.y, 0.35), radius: 0.6, own: true }],
      minY: DECK + u.h * 0.5,
      sound: false,
      onPick: () => { if (!this.canAct()) return; psfx.lidLift(); this.pick(lid); },
      onDrop: (z, info) => this.dropLid(lid, z, info),
    });
    this.targets.push(u.drag);
  }
  async dropLid(lid, zone, { tapped } = {}) {
    this.carry = null;
    const u = lid.userData;
    if (!this.canAct() && !this.selfHelping) { this.goHomeLid(lid); return; }
    if (zone && zone.own && !tapped) { await this.goHomeLid(lid); return; }       // peekaboo: back over its hole
    await this.toTray(lid, 'lid');
  }
  goHomeLid(lid) {
    const u = lid.userData, p0 = lid.position.clone(), to = u.rest.pos;
    return this.s.anim(0.35, (e) => { lid.position.lerpVectors(p0, to, e); }, Ease.inOut).then(() => { lid.position.copy(to); lid.rotation.z = u.rest.rz; u.parked = true; });
  }
  // into the tidy tray on the cart: toward the camera first, then across, and it leans in the tray's groove
  // (the hole is free at once: the step counts the moment she lets go, and only the flying thing itself rests)
  async toTray(o, kind) {
    const u = o.userData, h = u.hole;
    u.used = true;
    fx.clearHands(); this.clearHints();
    if (kind === 'lid') { h.lid = null; } else if (kind === 'plug') { h.plug = null; }
    if (kind === 'lid' || kind === 'plug') {
      const st = this.steps && this.steps.find((s) => s.kind === kind && s.hole === h.id);
      if (st) this.stepDone(st.id); else if (this.steps) this.refreshTargets();
    }
    const p0 = o.position.clone(), rz0 = o.rotation.z, rx0 = o.rotation.x, ry0 = o.rotation.y;
    // the tray pose (world): lids lean 25 degrees back in the groove; plugs stand on edge in front; the peg lies down
    let to, rx = 0, ry = 0, rz = 0;
    if (kind === 'lid') {
      const hh = u.h, lean = -0.44;
      const by = -hh / 2, bz = 0.12;
      const y = by * Math.cos(lean) - bz * Math.sin(lean), z = by * Math.sin(lean) + bz * Math.cos(lean);
      to = this.W(TRAY.x, TRAY.y + 0.02 - y, TRAY.groove - z);
      rx = lean;
      this.trayLid = o;
    } else if (kind === 'plug') {
      const s = o.scale.x;
      to = this.W(TRAY.x - 0.35, TRAY.y + 0.3 * s + 0.01, TRAY.front + 0.07);
      rx = 0;
    } else {
      to = this.W(TRAY.x + 0.25, TRAY.y + 0.12 + 0.01, TRAY.front + 0.02);
      rz = Math.PI / 2;
    }
    const pts = dedupePts([p0, V(p0.x, p0.y, Math.max(p0.z + 0.3, kind === 'peg' ? FRONT : 0.65)), V(p0.x, p0.y, FRONT), V(to.x, Math.max(to.y + 0.6, 2.6), FRONT), V(to.x, to.y + 0.12, FRONT), V(to.x, to.y + 0.06, to.z + 0.3), to]);
    const c = new T.CatmullRomCurve3(pts, false, 'centripetal');
    const fl = this.s.anim(Math.max(0.6, Math.min(1.5, c.getLength() / 6.0)), (e) => {
      o.position.copy(c.getPointAt(e));
      o.rotation.set(rx0 + (rx - rx0) * e, ry0 + (ry - ry0) * e, rz0 + (rz - rz0) * e);
    }, glideEase);
    (this.flying ||= new Set()).add(fl);            // the cupboard door waits for it (it lands behind the door's line)
    await fl;
    this.flying.delete(fl);
    o.position.copy(to);
    sfx.land();
    this.load.attach(o);
  }
  addPlugDrag(pl) {
    const u = pl.userData;
    u.home = { pos: u.rest.clone(), rotX: 0, out: [V(u.rest.x, u.rest.y, 0.42)] };
    u.freeZ = PLANE;
    u.drag = input.addDrag(pl, {
      radius: 0.45,
      zones: () => [{ pos: V(u.rest.x, u.rest.y, 0.4), radius: 0.5, own: true }],
      minY: DECK + 0.4,
      onPick: () => { if (!this.canAct()) return; this.pick(pl); },
      onDrop: (z, info) => this.dropPlug(pl, z, info),
    });
    this.targets.push(u.drag);
  }
  async dropPlug(pl, zone, { tapped } = {}) {
    this.carry = null;
    const u = pl.userData;
    if (tapped) {
      // a tap: the block wiggles, then the hand shows the drag
      await this.goHome(pl, { dur: 0.3 });
      this.rattle(pl, 0.06);
      this.s.wait(0.5).then(() => { if (this.want()?.obj === pl) this.demo('plug'); });
      return;
    }
    if (zone && zone.own) { await this.goHome(pl, { dur: 0.35 }); return; }
    await this.toTray(pl, 'plug');
  }

  // ================================================================================================ box, cups, ring, key, peg
  // a proxy drag target (in world space) for things that move in a constrained way on the cart
  proxyDrag(obj, at, { radius = 0.7, onPick, onMove, onDrop }) {
    const px = new T.Object3D();
    this.root.add(px);
    const place = () => { obj.updateMatrixWorld(true); px.position.copy(obj.localToWorld(at.clone())); };
    place();
    const t = input.addDrag(px, {
      radius, magnet: 0, feel: false, sound: false, zones: () => [],
      // the travel counts from the first move (the engine carries a drag a little above the finger)
      onPick: () => { place(); t.start = null; onPick && onPick(); },
      onMove: () => { if (!t.start) t.start = px.position.clone(); onMove && onMove(px.position.clone().sub(t.start)); },
      onDrop: (z, info) => { const d = t.start ? px.position.clone().sub(t.start) : V(0, 0, 0); place(); onDrop && onDrop(d, info); },
    });
    t.place = place;
    px.userData.target = obj;
    this.targets.push(t);
    return t;
  }
  addBoxDrag(b) {
    const u = b.userData;
    u.drag = this.proxyDrag(b, V(0, BOX.H - 0.3, BOX.D), {
      radius: 0.85,
      onPick: () => { if (!this.canAct() || u.opened) return; u.dragging = true; psfx.lidLift(); },
      onMove: (d) => { if (!u.dragging) return; if (u.hasPiece) this.piece.visible = true; setBoxDoor(b, Math.max(0, Math.min(0.9, d.y / 0.9))); },
      onDrop: (d, { tapped }) => {
        if (!u.dragging && !tapped) return;
        u.dragging = false;
        if (u.opened) return;
        if (tapped || d.y > 0.25) this.openBox(b, { fromDrag: !tapped });
        else { const k0 = u.doorK; this.s.anim(0.3, (e) => setBoxDoor(b, k0 * (1 - e)), Ease.inOut).then(() => { if (!u.opened && u.hasPiece) this.piece.visible = false; }); }
      },
    });
    u.drag.obj.userData.target = b;
  }
  async openBox(b, { fromDrag = false } = {}) {
    const u = b.userData;
    if (u.opened || !this.canAct()) return;
    u.opened = true; u.used = true;
    this.hold(1);
    this.refreshTargets();
    fx.clearHands(); this.clearHints();
    if (!fromDrag) await this.beat(b, 0.4);
    psfx.boxOpen();
    if (u.hasPiece) this.piece.visible = true;            // it is in there, behind the flap
    const k0 = u.doorK;
    await this.s.anim(0.45, (e) => setBoxDoor(b, k0 + (1 - k0) * e), Ease.inOut);
    if (u.hasPiece) {
      const p = this.piece;
      p.userData.home = this.homeOf(p);
      p.userData.free = true;
      this.sayOnce('Here it is!');
      this.hold(-1);
      const st = this.steps.find((s) => s.kind === 'box');
      if (st) this.stepDone(st.id);
    } else {
      this.sayOnce('Not in here!');
      this.countWrong();
      this.hold(-1);
      this.refreshTargets();
    }
  }
  addCupDrag(c) {
    const u = c.userData;
    u.drag = this.proxyDrag(c, V(0, 0.55, 0.3), {
      radius: 0.75,
      onPick: () => { if (!this.canAct() || u.lifted) return; u.dragging = true; },
      onMove: (d) => { if (!u.dragging) return; u.slide.position.y = Math.max(0, Math.min(0.85, d.y * 0.9)); if (u.covers) u.covers.visible = true; },
      onDrop: (d, { tapped }) => {
        if (!u.dragging && !tapped) return;
        u.dragging = false;
        if (u.lifted) return;
        if (tapped || d.y > 0.3) this.liftCup(c, { fromDrag: !tapped });
        else this.slideCup(c, 0, 0.3);
      },
    });
  }
  async liftCup(c, { fromDrag = false } = {}) {
    const u = c.userData;
    if (u.lifted || !this.canAct()) return;
    u.lifted = true; u.used = true;
    this.hold(1);
    this.refreshTargets();
    fx.clearHands(); this.clearHints();
    if (!fromDrag) await this.beat(c, 0.45);
    psfx.lidLift();
    const y0 = u.slide.position.y;
    if (u.covers) u.covers.visible = true;
    await this.s.anim(0.5, (e) => { u.slide.position.y = y0 + (CUP_UP - y0) * e; }, Ease.inOut);
    const under = u.covers;
    if (under) {
      under.visible = true;
      if (under === this.piece) under.userData.free = true;
      under.userData.home = this.homeOf(under);
      this.sayOnce('Here it is!');
      this.hold(-1);
      const st = this.steps.find((s) => s.kind === 'cup');
      if (st) this.stepDone(st.id);
    } else {
      this.sayOnce('Not in here!');
      this.countWrong();
      this.hold(-1);
      this.refreshTargets();
    }
  }
  addRingDrag(cs) {
    const u = cs.userData;
    const ringLocal = V(CASE.ringX, CASE.ringY, CASE.ringZ);
    u.drag = this.proxyDrag(cs, ringLocal, {
      radius: 0.65,
      onPick: () => { if (!this.canAct() || u.latched) return; u.dragging = true; u.tick = 0; fx.clearHands(); this.clearHints(); },
      onMove: (d) => { if (u.dragging) this.setPull(cs, Math.max(0, Math.min(1, -d.y / CASE.travel))); },
      onDrop: (d, { tapped }) => {
        if (!u.dragging) return;
        u.dragging = false;
        if (u.latched) return;
        if (tapped) { this.autoPull(cs); return; }
        if (u.pull >= 0.97) this.latch(cs);
        else { const k0 = u.pull; this.s.anim(0.6, (e) => this.setPull(cs, k0 * (1 - e), true), Ease.inOut); }
      },
    });
    u.drag.obj.userData.isRingProxy = true;
  }
  setPull(cs, k, quiet = false) {
    const u = cs.userData;
    u.pull = k;
    updateCase(cs);
    const n = Math.floor((k * CASE.travel) / 0.2 + 1e-6);
    if (!quiet && n > (u.tick || 0)) { u.tick = n; psfx.ratchet(n); }
    if (quiet) u.tick = n;
  }
  async autoPull(cs, dur = 1.2) {
    const u = cs.userData;
    if (u.latched || !this.canAct()) return;
    this.hold(1);
    fx.clearHands(); this.clearHints();
    const k0 = u.pull;
    await this.s.anim(dur * (1 - k0), (e) => this.setPull(cs, k0 + (1 - k0) * e), Ease.inOut);
    this.hold(-1);
    await this.latch(cs);
  }
  async latch(cs) {
    const u = cs.userData;
    if (u.latched) return;
    u.latched = true; u.used = true;
    this.hold(1);
    this.refreshTargets();
    this.setPull(cs, 1, true);
    await this.beat(null, 0.3);
    psfx.latch();
    const p = this.piece;
    p.userData.free = true;
    p.userData.home = this.homeOf(p);
    this.hold(-1);
    const st = this.steps.find((s) => s.kind === 'ring');
    if (st) this.stepDone(st.id);
  }
  addKeyDrag(key) {
    const u = key.userData;
    u.freeZ = PLANE;
    u.drag = input.addDrag(key, {
      radius: 0.65,
      zones: () => [{ pos: this.keyholeWorld(), radius: 0.6, lock: true, onNear: (k) => this.keyNear(k) }],
      minY: DECK + 0.3,
      onPick: () => { if (!this.canAct()) return; this.pick(key); },
      onDrop: (z, info) => this.dropKey(z, info),
    });
    this.targets.push(u.drag);
  }
  // the padlock's keyhole (underneath its body), and where the key's bow is when the key is in it
  keyholeAt() { return keyholeOf(this.fits.lock); }
  keyholeWorld() { return this.keyholeAt().add(V(KEY_IN, 0, 0)); }
  keyNear(k) {
    const t = this.key.userData.turn;
    if (t.userData.z0 === undefined) t.userData.z0 = t.rotation.z;
    t.rotation.z = t.userData.z0 * (1 - Ease.inOut(Math.min(1, k / 0.7)));      // lying flat, shaft toward the lock
  }
  async dropKey(zone, { tapped } = {}) {
    this.carry = null;
    const key = this.key;
    if (!this.canAct()) { this.goHome(key); return; }
    if (tapped && !zone) { await this.keyToLock(); return; }
    if (zone && zone.lock) { await this.unlock(); return; }
    const t = key.userData.turn, z0 = t.userData.z0 ?? t.rotation.z, z1 = t.rotation.z;
    t.userData.z0 = undefined;
    this.s.anim(0.5, (e) => { t.rotation.z = z1 + (z0 - z1) * e; });
    await this.goHome(key);
  }
  async keyToLock() {
    if (!this.canAct()) return;
    const key = this.key;
    this.hold(1, 'key');
    const kh = this.keyholeWorld(), p0 = key.position.clone(), t = key.userData.turn, z0 = t.rotation.z;
    // in one glide: off its rest (the hook's peg: forward), across in front, and in from the right into the keyhole
    const parked = key.userData.parked !== false;
    const out = parked ? (key.userData.home?.out || []).slice(0, -1) : [];
    key.userData.parked = false;
    const c = new T.CatmullRomCurve3(dedupePts([p0, ...out, V(kh.x + 0.4, kh.y + 0.05, kh.z + 0.3), V(kh.x + 0.12, kh.y, kh.z), V(kh.x, kh.y, kh.z)]), false, 'centripetal');
    await this.s.anim(Math.max(0.4, Math.min(0.6, c.getLength() / 4.5)), (e) => { key.position.copy(c.getPointAt(e)); t.rotation.z = z0 * (1 - Math.min(1, e * 1.4)); }, glideEase);
    this.hold(-1);
    await this.unlock({ inside: true });
  }
  // the key slides into the padlock from below, turns a quarter, beat, the padlock opens and the door swings aside
  async unlock({ inside = false } = {}) {
    const key = this.key, lb = this.fits.lock, L = lb.userData;
    if (!L.locked) return;
    L.locked = false;
    key.userData.used = true;
    this.hold(1, 'unlock');
    fx.clearHands(); this.clearHints();
    const t = key.userData.turn, r = key.userData.roll;
    const to = this.keyholeWorld();
    if (!inside) {
      // from where she let go (in front): glide back to the keyhole's right, lying flat, then slide in
      const p0 = key.position.clone(), z0 = t.rotation.z, a = V(to.x + 0.12, to.y, to.z);
      const slide = Math.max(0.18, Math.min(0.4, p0.distanceTo(a) / 3.5));
      await this.s.anim(slide, (e) => { key.position.lerpVectors(p0, a, e); t.rotation.z = z0 * (1 - e); }, glideEase);
      await this.s.anim(0.1, (e) => { key.position.x = a.x - 0.12 * e; }, Ease.out);
    }
    key.position.copy(to); t.rotation.z = 0;
    L.pad.attach(key);
    sfx.tick();
    // a quarter turn, the shackle pops, the glass front slides up into the cupboard's top
    await this.s.anim(0.2, (e) => { r.rotation.x = (Math.PI / 2) * e; }, Ease.inOut);
    psfx.latch();
    await this.s.anim(0.1, (e) => { L.shackle.position.x = -0.1 * e; }, Ease.out);
    const up = 1.62;                                   // fully up into the cupboard's hidden top (both sizes)
    await this.s.anim(0.32, (e) => { L.door.position.y = up * e; }, glideEase);
    const p = this.piece;
    p.userData.free = true;
    p.userData.home = this.homeOf(p);
    this.hold(-1);
    const st = this.steps.find((s) => s.kind === 'key');
    if (st) this.stepDone(st.id);
  }
  addPegDrag(peg) {
    const u = peg.userData;
    u.drag = this.proxyDrag(peg, V(0, PEG_HEAD, 0), {
      radius: 0.6,
      onPick: () => { if (!this.canAct() || u.used) return; u.dragging = true; },
      onMove: (d) => { if (u.dragging && d.length() > 0.4) { u.dragging = false; input.remove(u.drag); this.pullPeg(); } },
      onDrop: (d, { tapped }) => { if (!u.dragging) return; u.dragging = false; if (tapped || d.length() > 0.25) this.pullPeg(); },
    });
  }
  async pullPeg() {
    const peg = this.peg;
    if (!peg || peg.userData.used || !this.canAct()) return;
    peg.userData.used = true;
    fx.clearHands(); this.clearHints();
    sfx.pup();
    this.root.attach(peg);
    // up out of the track, then to the tidy tray
    const p0 = peg.position.clone();
    this.hold(1, 'peg');
    await this.s.anim(0.2, (e) => { peg.position.y = p0.y + 0.15 * e; }, Ease.out);
    peg.userData.hole = null;
    this.toTray(peg, 'peg');                 // it flies to the tray while the ball starts to go
    await this.beat(null, 0.1);
    await this.rollBall();
    this.hold(-1);
    const st = this.steps.find((s) => s.kind === 'peg');
    if (st) this.stepDone(st.id);
  }
  // the ball rolls out of the clear tube and down the slope into the cradle (it rolls: turn = distance / radius)
  async rollBall() {
    const p = this.piece, u = p.userData;
    const r = u.pz.size[0] / 2, dur = 0.95;
    const x0 = RAMP.ball, x1 = RAMP.cradle;
    psfx.roll(dur);
    // in the cupboard's frame: along the slope, turning by distance / radius
    const at = (x) => this.W(x, DECK + rampFloor(x) + r + 0.005, 0.5);
    await this.s.anim(dur, (_, t) => {
      const x = x0 + (x1 - x0) * t * t;            // speeding up as gravity does
      p.position.copy(at(x));
      u.spin.rotation.z = u.startRot - (x - x0) / r;
    });
    // in the cradle: free at once; a little rock settles it (grabbing it ends the rock)
    p.position.copy(at(x1));
    const rest = u.spin.rotation.z;
    u.startRot = rest;
    u.homeKind = 'cradle';
    u.home = this.homeOf(p);
    u.free = true;
    this.s.anim(0.3, (_, t) => { if (u.parked === false) return; const x = x1 + Math.sin(t * Math.PI * 2) * 0.05 * (1 - t); p.position.copy(at(x)); u.spin.rotation.z = rest - (x - x1) / r; }).then(() => { if (u.parked !== false) { p.position.copy(at(x1)); u.spin.rotation.z = rest; } });
  }

  // ================================================================================================ help
  // the slow hand demo on the real objects (touches wait while it plays)
  // (a touch ends it at once; the real object moves part of the way with the hand, so she sees what will happen)
  demo(kind) {
    if (this.dead) return;
    this.demoing = true;
    this.lastDemo = performance.now();
    fx.clearHands();
    this.showHint(true, kind);
    const id = (this.demoId = (this.demoId || 0) + 1);
    const end = () => { if (this.demoId !== id) return; this.demoId++; this.demoing = false; fx.clearHands(); this.stopDemoMove(); offTouch(); };
    const offTouch = input.onAny(() => end());
    this.offs.push(offTouch);
    this.s.wait(0.35).then(() => { if (this.demoId === id) this.demoMove(kind); });
    this.s.wait(2.5).then(() => { if (this.demoId === id) { end(); this.idle = Math.min(this.idle, 0.5); } });
  }
  // the thing the hand is working moves a little and eases back (never the hidden piece, never a cup)
  demoMove(kind) {
    const w = this.want();
    if (!w || !w.obj || this.animN > 0) return;
    const o = w.obj, tok = (this.dmTok = {});
    const back = (fn, dur) => this.s.anim(dur, (e) => { if (this.dmTok === tok) fn(e); }, Ease.inOut);
    if (kind === 'lid' || kind === 'plug') {
      const p0 = o.position.clone(), tray = this.W(TRAY.x, TRAY.y + 0.8, 0.8);
      const lift = kind === 'plug' ? 0.32 : 0.15, dx = Math.sign(tray.x - p0.x) * 0.5;
      this.dmRestore = () => o.position.copy(p0);
      back((e) => { o.position.set(p0.x + dx * Math.max(0, e * 1.6 - 0.6), p0.y, p0.z + lift * Math.min(1, e * 1.6)); }, 0.6)
        .then(() => this.s.wait(0.25)).then(() => back((e) => { o.position.set(p0.x + dx * (1 - e), p0.y, p0.z + lift * (1 - e)); }, 0.45))
        .then(() => { if (this.dmTok === tok) { o.position.copy(p0); this.dmTok = null; } });
    } else if (kind === 'ring') {
      const cs = this.fits.case;
      this.dmRestore = () => this.setPull(cs, 0, true);
      back((e) => this.setPull(cs, 0.35 * e, true), 0.6).then(() => this.s.wait(0.25))
        .then(() => back((e) => this.setPull(cs, 0.35 * (1 - e), true), 0.4)).then(() => { if (this.dmTok === tok) { this.setPull(cs, 0, true); this.dmTok = null; } });
    } else if (kind === 'key') {
      const k = this.key, p0 = k.position.clone(), kh = this.keyholeWorld();
      const mid = V(p0.x, p0.y + 0.1, p0.z + 0.45), to = mid.clone().lerp(V(kh.x, kh.y, mid.z), 0.3);
      this.dmRestore = () => k.position.copy(p0);
      back((e) => { k.position.copy(e < 0.4 ? p0.clone().lerp(mid, e / 0.4) : mid.clone().lerp(to, (e - 0.4) / 0.6)); }, 0.7)
        .then(() => this.s.wait(0.2)).then(() => back((e) => { k.position.copy(e < 0.6 ? to.clone().lerp(mid, e / 0.6) : mid.clone().lerp(p0, (e - 0.6) / 0.4)); }, 0.5))
        .then(() => { if (this.dmTok === tok) { k.position.copy(p0); this.dmTok = null; } });
    } else if (kind === 'peg') {
      const pg = this.peg, y0 = pg.position.y;
      this.dmRestore = () => { pg.position.y = y0; };
      back((e) => { pg.position.y = y0 + 0.08 * e; }, 0.35).then(() => this.s.wait(0.2)).then(() => back((e) => { pg.position.y = y0 + 0.08 * (1 - e); }, 0.35))
        .then(() => { if (this.dmTok === tok) { pg.position.y = y0; this.dmTok = null; } });
    } else if (kind === 'box') {
      this.dmRestore = () => setBoxDoor(o, 0);
      back((e) => setBoxDoor(o, 0.12 * e), 0.45).then(() => this.s.wait(0.2))
        .then(() => back((e) => setBoxDoor(o, 0.12 * (1 - e)), 0.4)).then(() => { if (this.dmTok === tok) { setBoxDoor(o, 0); this.dmTok = null; } });
    }
  }
  stopDemoMove() { if (this.dmTok) { this.dmTok = null; if (this.dmRestore) this.dmRestore(); } this.dmRestore = null; }
  showHint(glow = false, kind = null) {
    // the engine's 12 s call: we already showed it at 8 s
    if (kind === null && this.lastDemo && performance.now() - this.lastDemo < 6000) return;
    const w = this.want();
    if (!w) return;
    kind = kind || w.kind;
    const W = (o, dx = 0, dy = 0, dz = 0) => o.getWorldPosition(V(0, 0, 0)).add(V(dx, dy, dz));
    const p = this.piece, h = this.H[this.pz.hole];
    if (kind === 'fit') fx.ghostPath([W(p), V(h.x, h.y, PLANE)], { mode: 'drag', maxDur: 2.4 });
    else if (kind === 'choose') fx.ghostPath(this.pz.open.map((id) => V(this.H[id].x, this.H[id].y, PLANE)), { mode: 'scan', maxDur: 2.4 });
    else if (kind === 'lid' || kind === 'plug') {
      const o = w.obj;
      fx.ghostPath([W(o, 0, 0, 0.3), this.W(TRAY.x, TRAY.y + 0.6, 0.8)], { mode: 'drag', maxDur: 2.4 });
    } else if (kind === 'box') fx.ghostPath([W(w.obj, 0, BOX.H - 0.3, BOX.D)], { mode: 'tap' });
    else if (kind === 'cup') {
      if (this.cups.length > 1) fx.ghostPath(this.cups.map((c) => W(c, 0, 0.6, 0.3)), { mode: 'scan', maxDur: 2.4 });
      else fx.ghostPath([W(w.obj, 0, 0.6, 0.3)], { mode: 'tap' });
    } else if (kind === 'ring') {
      const r = this.fits.case.userData.ring, a = W(r);
      fx.ghostPath([a, a.clone().add(V(0, -CASE.travel, 0))], { mode: 'drag', maxDur: 2.4 });
    } else if (kind === 'key') {
      // the finger rests under the bow (the key itself stays in view)
      const lying = Math.abs(this.key.userData.turn.rotation.z) < 0.3, dy = -0.42;
      const a = W(this.key, lying ? 0 : 0.42, dy, 0.25), b = this.keyholeWorld().add(V(0, dy, 0.25));
      fx.ghostPath([a, b], { mode: 'drag', maxDur: 2.4 });
    } else if (kind === 'peg') { const a = W(this.peg, 0, PEG_HEAD, 0); fx.ghostPath([a, a.clone().add(V(0, 0.6, 0))], { mode: 'drag', maxDur: 2.2 }); }
    if (glow && w.obj && kind !== 'choose' && !(kind === 'cup' && this.cups.length > 1)) this.addHalo(w.obj, 0.55);
  }
  // what a stuck child hears: the current preparing step's name (every puzzle, wordless ones too), or the first fit's line
  promptText() {
    if (this.phase !== 'step') return '';
    const pz = this.pz, w = this.want();
    if (!w) return '';
    if (w.kind !== 'fit') return SAY_STEP[w.kind] || '';
    return /in its hole!$/.test(pz.say || '') ? pz.say : '';
  }
  // the stuck cues are spoken (a fresh reminder at most every 10 s), not just captioned
  prompt() {
    const t = this.promptText();
    if (!t) return;
    const now = performance.now();
    const rep = now - (this.promptAt ?? 0) > 10000;
    this.promptAt = now;
    this.say(t, { repeat: rep });
  }
  nudgeTarget() { return this.want()?.obj || null; }
  // the 6 s cue bobs the current step's object (the demo itself comes at 8 s)
  nudge(step) { if (step === 1) this.bob(this.want()?.obj); }
  bob(o) {
    if (!o || o.userData.bobbing || o.userData.homing || o.userData.parked === false) return;
    o.userData.bobbing = true;
    const y0 = o.position.y;
    this.s.anim(0.6, (_, t) => { o.position.y = y0 + Math.sin(t * Math.PI) * 0.12; }).then(() => { o.position.y = y0; o.userData.bobbing = false; });
  }
  // 20 s or two wrong tries: only the right hole stays open, it glows; chain puzzles: only the current step's object
  makeErrorless() {
    this.cur.helped = true;
    const pz = this.pz;
    for (const id of this.puzzleHoles(pz)) {
      const h = this.H[id];
      if (id !== pz.hole && h.open && !h.filled && !h.lid && !h.plug) this.closeHole(h);
    }
    const t = this.H[pz.hole];
    this.addHalo(t.anchor, Math.max(t.sx, t.sy) * 0.75);
    this.refreshTargets();
  }
  // 30 s: the preparing step does itself, slowly (never the fit)
  selfHelp() {
    const w = this.want();
    if (!w || w.kind === 'fit' || !this.canAct()) return;
    this.cur.helped = true;
    this.selfHelping = true;
    this.act(w.obj, { slow: true });
    this.selfHelping = false;
  }
  // autoplay / tap fallback: do the current step on obj (a wrong object redirects)
  act(obj, { slow = false } = {}) {
    if (!this.canAct() || !obj) return;
    const w = this.want();
    const u = obj.userData;
    if (u.lid) return this.toTray(obj, 'lid');
    if (u.plug) return this.toTray(obj, 'plug');
    if (u.box) return this.openBox(obj);
    if (u.cup) return this.liftCup(obj);
    if (u.glassCase) return this.autoPull(obj, 1.2);
    if (u.key || u.lockbox) return this.keyToLock();
    if (obj === this.peg || u.ramp) return this.pullPeg();
    if (obj === this.piece && w && w.kind === 'fit' && u.free) return this.tapHole(this.H[this.pz.hole]);
    if (obj === this.piece) return this.blockedTap();
  }

  // ================================================================================================ round end
  // the change between puzzles (inside the fit's payoff, about 0.8 s): anything swung out folds back in, the roll-up
  // door drops, the next set is put in its place out of sight, the next holes start to sink and the door rolls up
  async swapSet(next) {
    this.roundT0 = performance.now();
    this.helpRun = this.cur.helped ? this.helpRun + 1 : 0;
    this.phase = 'leave';
    await this.wait(0.1);
    const tidy = [];
    for (const f of Object.values(this.fits || {})) {
      const u = f.userData;
      // (box doors and lock-box fronts slide up into the cupboard's hidden top: nothing sticks out to tidy)
      if (u.box && u.doorK > 0.01 && u.doorK < 0.99) { const k0 = u.doorK; tidy.push(this.s.anim(0.25, (e) => setBoxDoor(f, k0 * (1 - e)), glideEase)); }
    }
    if (this.flying && this.flying.size) tidy.push(...this.flying);   // a lid still gliding into the tray lands first
    if (tidy.length) await Promise.all(tidy);
    await this.moveShutter(0, 0.35);
    if (this.dead) return;
    this.loadCart(next);
    this.unloadCart();
    this.loaded = true;
    this.openHoles(next);
    this.opened = true;
    await this.moveShutter(1, 0.4);
    // the new puzzle is in view: a "watch this" hiding move plays now, with the door fully up (startRound waits for it)
    this.roundT0 = performance.now();
    this.hideP = this.hideMoves(next);
  }
  moveShutter(up, dur) {
    const sh = this.shutter;
    if (!sh) return this.wait(dur);
    const y0 = sh.position.y, y1 = sh.userData.y0 + (up ? SHUTTER_RISE : 0);
    return this.s.anim(dur, (e) => { sh.position.y = y0 + (y1 - y0) * e; }, Ease.inOut);
  }
  async afterSuccess() {
    for (const t of this.targets || []) input.remove(t);
    this.targets = [];
    this.steps = null;
    this.carry = null;
    if (this.roundT0 === undefined) this.roundT0 = performance.now();
  }

  // ================================================================================================ finale
  onFinale() {
    this.finaleOn = true;
    if (this.friend) setFriendFace(this.friend, 'joy');
    this.timing.push({ level: this.level + 1, total: +((performance.now() - this.levelT0) / 1000).toFixed(1) });
    console.log('PZTIMING ' + JSON.stringify(this.timing));
  }
  // the whole picture is already in view: nothing moves; effects hush for the admiring
  async showOff() { this.frameView(); await this.wait(0.1); fx.clearHands(); this.clearHints(); await this.moveShutter(0, 0.45); }
  creationObjects() { return [...this.placed].sort((a, b) => a.position.x - b.position.x); }
  // the admire: the level's own line ("You made a garden!") instead of a second "made" line on top of it
  async admire() {
    const list = (this.creationObjects() || []).filter(Boolean);
    list.forEach((o, i) => this.pokeable(o, { note: i, of: list.length, admire: true }));
    this.pipWatch(V(0, 3.4, 0));
    this.say(this.L.finale);
    await this.wait(Math.max(4, this.admireTime ?? 4));
  }
  onAdmirePoke(obj, i, n) {
    super.onAdmirePoke(obj, i, n);
    if (obj === this.friend) this.blink(obj);
  }
  blink(p) {
    const f = p.userData.face;
    if (!f) return;
    const eyes = f.userData.arcs && f.userData.arcs[0]?.visible ? f.userData.arcs : f.userData.eyes;
    const s0 = eyes.map((e) => e.scale.y);
    this.s.anim(0.2, (_, t) => eyes.forEach((e, i) => { e.scale.y = s0[i] * (1 - 0.9 * Math.sin(t * Math.PI)); })).then(() => eyes.forEach((e, i) => { e.scale.y = s0[i]; }));
  }

  // ================================================================================================ every frame
  update(dt, t) {
    if (camera.aspect !== this.viewAspect || camera.fov !== this.viewFov) { this.frameView(); this.hideBehindBoard(); }   // the window changed shape
    this.carryPlane(dt);
    if (this.waitReady !== undefined && this.waitReady !== null && !this.busy && !input.locked()) {
      this.timing.push({ round: this.waitReady + 1, ready: +((performance.now() - this.roundT0) / 1000).toFixed(2) });
      this.waitReady = null;
    }
    // the friend blinks now and then
    if (this.friend && this.friend.userData.face && !this.finaleOn) {
      this.blinkT = (this.blinkT ?? 3) - dt;
      if (this.blinkT <= 0) { this.blinkT = 3 + Math.random() * 3; if (this.friend.userData.face.userData.emotion !== 'joy') this.blink(this.friend); }
    }
    // stuck: 8 s the demo for the current step again (and its object bobs); 30 s the preparing step does itself
    // (our own clock: it keeps running through the hand demos; any touch resets it)
    if (this.phase === 'step' && !this.busy && !(this.animN > 0) && !input.dragging()) {
      this.stuck = (this.stuck || 0) + dt;
      if (this.stuck >= HINT_DEMO && !this.demoAt8 && !this.demoing) { this.demoAt8 = true; const w = this.want(); if (w) { this.bob(w.obj); this.demo(w.kind); } }
      if (this.stuck >= HINT_ERRORLESS && !this.errorlessOn) { this.cur.hints++; this.errorless(); }
      if (this.stuck >= HINT_SELF && !this.helpedSelf && !this.demoing) { this.helpedSelf = true; this.selfHelp(); }
    }
  }
  // the thing being carried: in front of every fitting while it is over the cupboard opening, else in the free plane just
  // in front of the board's lids. The screen point under the finger stays put as z changes.
  carryPlane(dt) {
    const o = this.carry;
    if (!o || !input.dragging() || o.userData.unparking) return;
    const u = o.userData;
    let hw = 0.4, lo = -0.4, hi = 0.4;
    if (u.piece) { const e = pieceExtent(o); hw = Math.max(-e.l, e.r); lo = e.lo; hi = e.hi; }
    else if (u.lid) { hw = u.w / 2; lo = -u.h / 2; hi = u.h / 2; }
    const x = o.position.x, y = o.position.y, m = 0.3;
    const over = (x0, x1, y0, y1) => x + hw > x0 - m && x - hw < x1 + m && y + lo < y1 + m && y + hi > y0 - m;
    // (everything on the cupboard floor, raised panes and cups included, is behind the board face or in the opening)
    const front = over(CUPBOARD.x0, CUPBOARD.x1, 0.6, CUPBOARD.y1 + 0.1) || y + lo < 0.9;
    const zt = front ? FRONT : (u.freeZ ?? PLANE);
    const z = o.position.z;
    if (Math.abs(zt - z) < 1e-3) return;
    const nz = z + Math.sign(zt - z) * Math.min(Math.abs(zt - z), dt * 5);
    // keep the screen point: slide along the camera ray to the new plane
    const cam = camera.position, d = o.position.clone().sub(cam);
    const k = (nz - cam.z) / d.z;
    o.position.set(cam.x + d.x * k, Math.max(u.drag?.minY ?? 0, cam.y + d.y * k), nz);
  }
  dispose() { super.dispose(); }
}

// helpers
function dedupePts(pts) { const out = []; for (const p of pts) if (!out.length || out[out.length - 1].distanceTo(p) > 1e-3) out.push(p); if (out.length === 1) out.push(out[0].clone().add(V(0, 0, 1e-3))); return out; }
function polyDist(poly, x, y) {
  let best = Infinity, inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    const dx = xi - xj, dy = yi - yj, L = dx * dx + dy * dy || 1e-9;
    const tt = Math.max(0, Math.min(1, ((x - xj) * dx + (y - yj) * dy) / L));
    best = Math.min(best, Math.hypot(x - (xj + dx * tt), y - (yj + dy * tt)));
  }
  return inside ? -best : best;
}
function scMeshSafe(kind, layer) { return scMesh(kind, layer, { ink: 0.012 }); }
