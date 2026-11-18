// Game 15 — Peekaboo pots. Topic mt_AzNSWFgtxC "Remembering visual forms".
// A friend hides under one of the covers; remember which one. Later the covers swap places.
// Each round a different friend (Chick, Piglet, Kitten…) hides under different things (flowerpots, hay bales,
// buckets, boxes). The wrong ones hide silly surprises; under the right one: "Peekaboo!", the friend hops out, runs
// to Pip for a hug, then climbs onto the watching bench at the back, where it stays for the rest of the level
// (the keepsake tray: the friends she found, all watching her play; the finale photo is that bench).
// (The hiding places are still called pots in the code and in the test hooks.)
// Each level is a different place with its own hiding things and friends: a garden bed (flowerpots, baskets, buckets),
// a straw farmyard pen (hay, boxes, buckets) and a vegetable patch with a scarecrow (pumpkins, barrels, baskets).
//
// Mechanics are calm and fully tweened (no physics): covers sit on the ground, one lifts straight up, the friend walks
// under it and it sets back down. Swaps are always between neighbours: one slides round the front, the other round the
// back, so they never pass through each other or anything else. Whatever hides under a cover travels with it.
// Characters always walk (≤ 3.2 units/s, their own gait), never fly or zip.
import * as T from '../three.js';
import { Lesson } from '../engine/lesson.js';
import { popIn, hop, wiggle, setFace } from '../engine/actors.js';
import { disposeTree, blobShadow } from '../engine/toon.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';
import { setCamera } from '../engine/stage.js';
import { makeTray } from '../engine/keepsake.js';
import { calmBackdrop } from './view-tools.js';
import { makeCover, COVER_SFX, HIDERS, makeHider, makePeek, GAGS, makeGag, gagShow, makeSet, makeBench, BENCH_TOP, BAIL_REST } from './pots-props.js';

const XS = { 2: [-1.6, 1.6], 3: [-2.85, 0, 2.85] }; // cover centres (neighbours swap without touching: centres stay >= 2.78 apart)
const POT_Z = 0.7;     // the row of covers
const LIFT = 1.7;      // how high a cover lifts (clear of the tallest friend, 1.53, and of every surprise's show)
const SWAP_Z = 1.4;    // a swap: one cover arcs round the front, the other round the back (covers are <= 2.64 across)
const FRONT_IN = 0.7;  // the friend says hello in front of its cover, a little toward the middle (always in frame)
const FRONT_Z = 2.4;   // (covers are held up while she says hello there)
const OUT_Z = 2.65;    // where a found friend hops out to: clear of its cover's rim as the cover comes back down
const LANE_Z = -1.75;  // the lane behind the covers (found friends walk to their seat on the bench from here)
const BENCH_Z = -3.0;  // the watching bench at the back (its seats are the keepsake tray)
const BENCH_X = 0;
const SEAT_GAP = 1.35;
const PIP_AT = new T.Vector3(-5.7, 0, -2.6);  // Pip's place in the finale: at the bench's left end, with the friends
const PIP_OFF = new T.Vector3(-11, 0, -2.6); // during play he waits off to the left (the camera is close on the covers)
const WALK = 3.4;      // walking pace, units/s (QA: never faster than 3.5)
// The round's show fits in 3.5 s at most: covers appear raised (0.35 s), the friend hops straight in (0.5 s), all the
// covers come down together (0.45 s), then up to two swaps of 0.95 s with 0.1 s between.
const SHOW = { grow: 0.35, hopAt: 0.3, hop: 0.5, dropAt: 0.85, drop: 0.45, swap: 0.95, gap: 0.1 };
// [covers, swaps, peek (a tail peeks out), frog decoy]
const PLANS = [
  [[2, 0, 1], [2, 0, 1], [2, 0, 0], [2, 0, 1], [2, 0, 0], [2, 0, 0]], // Level 1: always two big covers
  [[3, 0, 0], [3, 1, 0], [3, 1, 0], [3, 2, 0], [3, 1, 0], [3, 2, 0]],
  // Level 3's step up is two calm swaps every round plus the frog decoy twice (not more or quicker swaps)
  [[3, 2, 0], [3, 2, 0], [3, 2, 0, 1], [3, 2, 0], [3, 2, 0], [3, 2, 0, 1]],
];
// [who hides, under what] for each round. Each level has its own place, friends and things.
const THEMES = [
  [['chick', 'pot'], ['bunny', 'basket'], ['piglet', 'bucket'], ['chick', 'basket'], ['bunny', 'pot'], ['piglet', 'bucket']],
  [['kitten', 'hay'], ['piglet', 'box'], ['chick', 'bucket'], ['kitten', 'box'], ['piglet', 'hay'], ['chick', 'bucket']],
  [['hedgehog', 'pumpkin'], ['bunny', 'barrel'], ['kitten', 'basket'], ['hedgehog', 'barrel'], ['chick', 'pumpkin'], ['bunny', 'basket']],
];
// the silly surprises under the wrong ones, per level
const GAG_KINDS = [['ball', 'worm', 'sock', 'snail'], ['sock', 'ball', 'frog', 'worm'], ['snail', 'ball', 'worm', 'sock', 'frog']];
const smooth = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
const V = (x, y, z) => new T.Vector3(x, y, z);
const HEIGHT = { chick: 1.11, piglet: 1.28, kitten: 1.31, bunny: 1.53, hedgehog: 1.02, frog: 0.95 }; // measured, at game scale

export default class PotsLesson extends Lesson {
  build() {
    this.plan = PLANS[this.level];
    this.themes = THEMES[this.level];
    this.frameCovers();
    this.offs.push(() => removeEventListener('resize', this.onResize));
    this.onResize = () => { if (!this.finaleCam) this.frameCovers(); };
    addEventListener('resize', this.onResize);
    calmBackdrop(this.meadow, { hide: (o) => !!o.userData?.wl }); // no leaves, rain or butterflies across the covers and friends
    this.pip.position.copy(PIP_OFF); // (he walks in beside the bench for the finale)
    this.pip.rotation.y = 0.3;
    this.pots = [];
    this.gags = [];
    this.shadows = [];
    this.gagKinds = GAG_KINDS[this.level];
    this.gagI = Math.floor(Math.random() * this.gagKinds.length);
    this.set = makeSet(this.level);
    this.root.add(this.set);
    // the watching bench: every friend she finds climbs up and stays there all level
    this.bench = makeBench(this.level);
    this.bench.position.set(BENCH_X, 0, BENCH_Z);
    this.root.add(this.bench);
    this.tray = makeTray(this, 6, [BENCH_X, BENCH_TOP - 0.44, BENCH_Z], { style: 'shelf', spacing: SEAT_GAP, scale: 1 });
    // the bench itself is the shelf: keep only the tray's seat marks
    for (const ch of this.tray.group.children) if (!(ch.material && ch.material.isMeshBasicMaterial)) ch.visible = false;
  }

  // The camera is close on the covers: as close as the screen's shape allows with every cover (also mid-swap), the
  // friend's hello spot, the lifted covers and the bench all inside the frame (4:3 to 16:9).
  frameCovers() {
    const n = this.level === 0 ? 2 : 3, xs = XS[n];
    const a = innerWidth / Math.max(1, innerHeight);
    const cam = new T.PerspectiveCamera(Math.max(40, (2 * Math.atan(8.4 / (16 * a)) * 180) / Math.PI), a, 0.1, 300); // as stage.js
    // everything that must be inside the frame: the covers at rest and held up (front corners), a swap's front cover,
    // the friend's hello spot, and the friends on the bench
    const R = 1.32, H = [1.8, 2.15, 2.1][this.level], pts = []; // (H: the level's tallest cover)
    for (const x of [xs[0], xs[n - 1]]) for (const sx of [-1, 1]) {
      pts.push(V(x + sx * R, 0, POT_Z + R), V(x + sx * 1.15, LIFT + H, POT_Z + 0.6), V(x + sx * 1.15, LIFT + H, POT_Z - 1.15)); // (a cover's top is narrower than its rim)
      pts.push(V(x * FRONT_IN + sx * 0.6, 0, OUT_Z + 0.5), V(x * FRONT_IN + sx * 0.6, 1.6, OUT_Z));
    }
    if (n === 3) for (const sx of [-1, 1]) pts.push(V(sx * 1.43 + sx * R, 0, POT_Z + SWAP_Z + R), V(sx * 1.5 + sx * R, H, POT_Z + SWAP_Z + R));
    for (const sx of [-1, 1]) pts.push(V(BENCH_X + sx * 3.9, BENCH_TOP + 1.45, BENCH_Z));
    const fits = (pos, look) => {
      cam.position.copy(pos); cam.lookAt(look); cam.updateMatrixWorld(true);
      for (const p of pts) {
        const q = p.clone().project(cam);
        if (Math.abs(q.x) > 0.97 || q.y < -0.95 || q.y > 0.87) return false;
        if (q.y > 0.7 && Math.abs(q.x) > 0.84) return false; // the home button and the grown-ups' gear sit in the top corners
      }
      return true;
    };
    let best = null;
    for (let ly = 1.1; ly <= 2.41; ly += 0.05) {
      for (let d = 4; d < 16; d += 0.05) {
        const look = V(0, ly, POT_Z), pos = V(0, ly + d * 0.2, POT_Z + d);
        if (fits(pos, look)) { if (!best || d < best.d) best = { d, pos, look }; break; }
      }
    }
    if (best) setCamera(best.pos, best.look);
  }

  // pokes work all through the show (characters, the bench, scenery); only the covers wait. Whatever hides under a
  // cover, and the friend on its way to the bench, can't be poked (a poke would make it hop out through the cover).
  scanChars() {
    super.scanChars();
    const busy = new Set([this.chick, this.frog, this.walker].filter(Boolean));
    this.chars = this.chars.filter((c) => !busy.has(c));
  }

  nudgeTarget() { const p = this.hidePot; return p && p.userData.tap?.enabled && !this.busy ? p : null; }

  clearRound() {
    for (const p of this.pots) { input.remove(p.userData.tap); this.root.remove(p); disposeTree(p); }
    for (const sh of this.shadows) { this.root.remove(sh); disposeTree(sh); }
    for (const g of this.gags) { g.parent && g.parent.remove(g); disposeTree(g); }
    this.pots = [];
    this.shadows = [];
    this.gags = [];
    // (the found friend is on the bench now: it stays)
    if (this.tail) { this.tail.parent && this.tail.parent.remove(this.tail); disposeTree(this.tail); }
    this.chick = this.tail = this.frog = null;
  }

  async startRound(r) {
    this.busy = true;
    this.goT0 = Infinity; // no Go! badge (not even the engine's forced one) while the friend hides and the covers move
    input.setReady(() => true); // pokes stay live through the show; the covers themselves take no finger until it ends
    this.clearRound();
    const [n, swaps, peek, frog] = this.plan[r];
    const [who, cover] = this.themes[r];
    this.who = who;
    this.coverKind = cover;
    const xs = XS[n];
    // the covers pop up on the ground, side by side (each with its own ground shadow that stays on the ground)
    this.pots = xs.map((x, i) => {
      const p = makeCover(cover, i);
      p.position.set(x, LIFT, POT_Z); // they appear held up in the air, then all come down together
      p.rotation.x = -0.14;
      p.userData.slot = i;
      p.userData.base = 1;
      this.root.add(p);
      p.scale.setScalar(0.001);
      const sh = blobShadow(p.userData.shadow || 1.3);
      sh.position.set(x, 0, POT_Z);
      sh.userData.r = 1;
      this.root.add(sh);
      p.userData.sh = sh;
      this.shadows.push(sh);
      const mid = new T.Object3D(); mid.position.y = 0.9; p.add(mid); p.userData.mid = mid; // hint halos ring the middle
      this.grow(p, i === 0);
      if (p.userData.bail) p.userData.bail.rotation.x = BAIL_REST - 0.45;
      this.armPot(p, false);
      return p;
    });
    // choose a hiding place (not the same as last time if possible)
    let h;
    do { h = Math.floor(Math.random() * n); } while (n > 1 && h === this.lastHide && Math.random() < 0.8);
    this.lastHide = h;
    this.hidePot = this.pots[h];
    // the friend and the bit of them that peeks out
    const c = (this.chick = makeHider(who));
    this.root.add(c);
    c.visible = false;
    this.tail = makePeek(who);
    this.tail.visible = false;
    this.root.add(this.tail);
    // something silly under each of the others (the frog decoy takes one of them)
    const frogPot = frog ? this.pots.find((p) => p !== this.hidePot) : null;
    for (const p of this.pots) {
      if (p === this.hidePot) continue;
      const g = p === frogPot ? (this.frog = makeGag('frog')) : makeGag(this.gagKinds[this.gagI++ % this.gagKinds.length]);
      g.visible = false; // under its cover (shown as soon as her finger starts lifting it; the frog hops in later)
      g.position.set(p.position.x, 0, p.position.z);
      g.rotation.set(0, g.userData.gag === 'sock' ? 0.9 : 0, 0);
      this.root.add(g);
      p.userData.gag = g;
      this.gags.push(g);
    }
    // the show (<= 3.5 s): covers appear raised, the friend (and the frog) hops straight in under its cover, all the
    // covers come down together, then the swaps
    const hello = (o, p) => { o.position.set(p.position.x * FRONT_IN, 0, FRONT_Z); o.rotation.set(0, 0, 0); popIn(this.s, o, o.userData.baseScale, 0.3, { sound: false }); };
    hello(c, this.hidePot);
    this.call();
    if (c.userData.face) setFace(c.userData.face, 'happy');
    if (this.frog) { hello(this.frog, frogPot); this.s.wait(0.12).then(() => sfx.ribbit()); }
    await this.wait(SHOW.hopAt);
    if (this.dead) return;
    this.hopUnder(c, this.hidePot);
    if (this.frog) this.hopUnder(this.frog, frogPot);
    await this.wait(SHOW.dropAt - SHOW.hopAt);
    if (this.dead) return;
    this.say(`${this.name()} is hiding!`, { max: 1.2 });
    await Promise.all(this.pots.map((p) => this.drop(p)));
    if (this.dead) return;
    this.hidePot.userData.hidden = c;
    if (frogPot) frogPot.userData.hidden = this.frog;
    this.peek = !!peek;
    this.placeTail();
    // shuffle: neighbours swap, one arcing round the front and one round the back
    if (swaps) {
      this.say('Watch!', { max: 0.6 });
      for (let k = 0; k < swaps; k++) {
        let a = Math.floor(Math.random() * (n - 1));
        if (k === 0 && Math.random() < 0.7) { const hi = this.pots.indexOf(this.hidePot); a = hi === 0 ? 0 : hi === n - 1 ? n - 2 : hi - (Math.random() < 0.5 ? 1 : 0); }
        await this.swap(this.pots[a], this.pots[a + 1], SHOW.swap);
        if (this.dead) return;
        if (k < swaps - 1) await this.wait(SHOW.gap);
      }
    }
    this.setLive(true);
    // the Go! badge counts from now (the covers are live), never from the start of the hide and shuffle
    this.goT0 = performance.now();
    this.busy = false;
    this.cue();
  }

  // a cover comes up out of the ground gently (one small overshoot, never ballooning over its neighbours or Pip)
  grow(p, sound) {
    if (sound) sfx.bloop?.();
    return this.s.anim(SHOW.grow, (_, q) => { const k = Math.max(0.001, 1 - (1 - q) ** 3 + 0.07 * Math.sin(Math.PI * q) * q); p.scale.setScalar(k); })
      .then(() => p.scale.setScalar(1));
  }

  call(kind = this.who) { sfx[HIDERS[kind]?.call]?.(); }

  // the friend (or the frog) hops straight back from its hello spot to the middle of its raised cover, still facing her
  hopUnder(c, p) {
    const from = c.position.clone(), to = V(p.position.x, 0, p.position.z);
    c.userData.noWalk = true; // a hop, not a walk
    const arc = Math.max(0.12, Math.min(0.45, LIFT - 0.08 - (HEIGHT[c.userData.hider] ?? 1.3))); // head stays under the rim
    return this.s.anim(SHOW.hop, (e, q) => { c.position.lerpVectors(from, to, e); c.position.y = Math.sin(q * Math.PI) * arc; }, Ease.inOut)
      .then(() => { c.position.copy(to); c.userData.noWalk = false; });
  }
  // a raised cover comes down over its spot (every friend fits inside every cover, full size)
  async drop(p) {
    const y0 = p.position.y, r0 = p.rotation.x;
    const bail = p.userData.bail, b0 = bail ? bail.rotation.x : 0;
    await this.s.anim(SHOW.drop, (e) => { p.position.y = p.userData.liftY = y0 * (1 - e); p.rotation.x = r0 * (1 - e); if (bail) bail.rotation.x = b0 + (BAIL_REST - b0) * e; }, Ease.inOut);
    p.rotation.x = 0;
    this.land(p);
  }

  // set down with a soft thunk and a little squash
  land(p) {
    p.position.y = 0;
    sfx[COVER_SFX[this.coverKind]]?.();
    this.squash(p);
  }

  placeTail() {
    if (!this.tail) return;
    this.tail.visible = this.peek;
    const p = this.hidePot.position;
    this.tail.position.set(p.x + 0.75, 0.05, p.z + 1.05);
  }

  squash(p) {
    const b = p.userData.base ?? 1;
    this.s.anim(0.35, (_, q) => { const k = 1 - Math.sin(q * Math.PI) * 0.1; p.scale.set(b / Math.sqrt(k), b * k, b / Math.sqrt(k)); }).then(() => p.scale.setScalar(b));
  }

  // two neighbouring covers swap: out (front / back), across, and back into the row. Their centres stay > 2.8 apart.
  // Whatever hides under each one moves with it.
  async swap(a, b, dur) {
    const xa = a.position.x, xb = b.position.x;
    if (this.tail) this.tail.visible = false;
    sfx.swoosh();
    const follow = (p) => { const h = p.userData.hidden || p.userData.gag; if (h) h.position.set(p.position.x, 0, p.position.z); };
    await this.s.anim(dur, (_, e) => {
      const x = smooth(e), z = Math.sin(Math.PI * e); // centres stay > 2.9 apart all the way
      a.position.set(xa + (xb - xa) * x, 0, POT_Z + z * SWAP_Z);
      b.position.set(xb + (xa - xb) * x, 0, POT_Z - z * SWAP_Z);
      follow(a); follow(b);
    });
    a.position.set(xb, 0, POT_Z); b.position.set(xa, 0, POT_Z);
    follow(a); follow(b);
    const i = this.pots.indexOf(a), j = this.pots.indexOf(b);
    this.pots[i] = b; this.pots[j] = a;
    this.squash(a); this.squash(b);
    this.placeTail();
  }

  name() { return HIDERS[this.who]?.name || 'Chick'; }
  promptText() { return this.plan[this.round]?.[1] ? `Where's ${this.name()} now?` : `Where's ${this.name()}?`; }

  // straight up with a little peek (the front edge tips up a touch), or straight back down
  async lift(p, up = true) {
    if (up) {
      const b = p.userData.base ?? 1, h0 = p.position.y;
      if (h0 < 0.05) { // from the ground: a little squash first
        await this.s.anim(0.12, (_, q) => { const k = 1 - Math.sin(q * Math.PI / 2) * 0.08; p.scale.set(b / Math.sqrt(k), b * k, b / Math.sqrt(k)); });
        p.scale.setScalar(b);
      }
      const bail = p.userData.bail, b0 = BAIL_REST; // a bucket's bail swings out a little as it rises
      const f0 = h0 / LIFT;
      await this.s.anim(0.6 * (1 - f0) + 0.1, (e) => { const f = f0 + (1 - f0) * e; p.position.y = p.userData.liftY = f * LIFT; p.rotation.x = -0.14 * f; if (bail) bail.rotation.x = b0 - 0.45 * f; }, Ease.out);
    } else {
      const y0 = p.position.y, r0 = p.rotation.x;
      const bail = p.userData.bail, b0 = bail ? bail.rotation.x : 0, b1 = BAIL_REST;
      await this.s.anim(0.5, (e) => { p.position.y = p.userData.liftY = y0 * (1 - e); p.rotation.x = r0 * (1 - e); if (bail) bail.rotation.x = b0 + (b1 - b0) * Math.min(1, e * 1.4); }, Ease.inOut);
      p.rotation.x = 0;
      this.land(p);
    }
  }

  // ---- her finger on a cover ----
  // Her finger lifts it: drag up and the cover follows (a peek underneath), let go early and it drops back; past half
  // way it comes right up. A plain tap lifts it too (the easy fallback). Covers only take a finger while nothing moves.
  armPot(p, on) {
    if (p.userData.tap) input.remove(p.userData.tap);
    p.userData.tap = input.addDrag(p, {
      radius: 1.3, offset: new T.Vector3(0, 0.9, 0), minY: -10, feel: false, magnet: 0, sound: false, zones: () => [],
      onPick: () => this.pickPot(p), onMove: () => this.dragPot(p), onDrop: (_z, { tapped }) => this.dropPot(p, tapped),
    });
    p.userData.tap.enabled = on;
  }
  setLive(on) { for (const p of this.pots) if (p.userData.tap) p.userData.tap.enabled = on && !p.userData.off; }
  pickPot(p) {
    const ok = !this.busy && p.userData.tap?.enabled;
    p.userData.grab = ok ? { base: null, h: 0 } : null;
    if (ok) {
      fx.clearHands();
      if (this.tail) this.tail.visible = false;
      const g = p.userData.gag; // the surprise is there to peek at
      if (g) { g.position.set(p.position.x, 0, p.position.z); g.visible = true; }
    }
  }
  dragPot(p) {
    const g = p.userData.grab;
    const slotX = this.slotX(p);
    // (once it is coming up by itself the finger no longer moves it: keep it where the lift has it)
    if (!g || g.done) { p.position.x = slotX; p.position.y = g ? p.userData.liftY ?? p.position.y : 0; return; }
    const fy = p.position.y; // where the finger is (input put it there); the cover rises by how far it has moved up
    if (g.base === null) g.base = fy;
    const h = Math.max(0, Math.min(LIFT * 0.6, (fy - g.base) * 0.9));
    g.h = h;
    p.position.set(slotX, h, POT_Z);
    p.rotation.x = -0.14 * (h / LIFT);
    if (p.userData.bail) p.userData.bail.rotation.x = BAIL_REST - 0.45 * (h / LIFT);
    if (h > LIFT * 0.45) { g.done = true; p.userData.liftY = h; this.tapPot(p, true); } // past half way: up it comes
  }
  dropPot(p, tapped) {
    const g = p.userData.grab;
    p.userData.grab = null;
    if (!g || g.done) return;
    if (tapped || g.h < 0.05) { p.position.set(this.slotX(p), 0, POT_Z); if (tapped) this.tapPot(p); else this.tuck(p); return; }
    // let go early: it drops back down (no answer either way)
    this.busy = true;
    this.setLive(false);
    this.lift(p, false).then(() => { if (this.dead) return; this.tuck(p); this.placeTail(); this.busy = false; this.setLive(true); });
  }
  tuck(p) { const g = p.userData.gag; if (g && g.userData.gag !== 'frog') g.visible = false; } // the frog stays (a character)
  slotX(p) { const n = this.pots.length; return XS[n]?.[this.pots.indexOf(p)] ?? p.position.x; }

  async tapPot(p, lifting = false) {
    if (this.busy || !p.userData.tap?.enabled) return;
    this.busy = true;
    this.setLive(false);
    this.goPending = false; // she has already started: no late Go! badge over the reveal
    fx.clearHands(); // a tap ends any hint hand at once
    const isFriend = p === this.hidePot;
    if (this.tail) this.tail.visible = false;
    if (!isFriend) {
      // a silly surprise underneath (Frog sits under one on the hardest rounds)
      const g = p.userData.gag;
      if (g) { g.position.set(p.position.x, 0, p.position.z); g.visible = true; g.scale.setScalar(g.userData.baseScale); }
      await this.lift(p);
      if (this.dead) return;
      if (g) {
        sfx[GAGS[g.userData.gag].sfx]?.();
        if (g.userData.gag === 'frog') hop(this.s, g, 0.6);
        else gagShow(this.s, g);
      }
      // Pip laughs at it; the narrator names it (each has its own clip)
      wiggle(this.s, this.pip, 0.2, 0.7);
      this.redirect(g ? GAGS[g.userData.gag].line : 'Not here!');
      await this.wait(1.3);
      if (this.dead) return;
      // the cover goes back down over the surprise, then the round's own question again
      await this.lift(p, false);
      if (this.dead) return;
      this.tuck(p); // (the surprise stays under its cover)
      this.prompt();
      this.placeTail();
      this.busy = false;
      this.setLive(true);
      return;
    }
    this.clearHints();
    if (this.stopPeep) { this.stopPeep(); this.stopPeep = null; }
    // a held breath, then peekaboo! the cover lifts and there she is, full size, right where she hid
    const c = this.chick, u = c.userData;
    c.position.set(p.position.x, 0, p.position.z);
    c.rotation.set(0, 0, 0);
    c.scale.setScalar(u.baseScale ?? 1);
    if (!lifting) await this.beat(p, 0.4); // (a drag already held the breath in her finger)
    if (this.dead) return;
    await this.lift(p);
    if (this.dead) return;
    this.call();
    if (u.face) setFace(u.face, 'joy');
    // the reward is the friend: out from under the cover, its friends on the bench cheer, then it joins them
    this.foundP = this.found(c, p);
    this.payoffP = this.foundP;
    this.busy = false;
    this.success(c.position.clone().add(new T.Vector3(0, 1.6, 1.4)), 'Peekaboo!', { voice: true, watch: false });
  }

  // walk along a ground path at walking pace (the creature's own gait comes from the motion layer), eased at the ends
  walkPath(c, pts, speed = WALK) {
    const P = [c.position.clone(), ...pts];
    const L = [0];
    for (let i = 1; i < P.length; i++) L.push(L[i - 1] + P[i].distanceTo(P[i - 1]));
    const total = L[L.length - 1];
    if (total < 0.01) return Promise.resolve();
    // a walking-pace profile: 0.3 s to get going, a steady pace (never faster than `speed`), 0.3 s to stop
    const ta = Math.min(0.3, total / speed), dur = total / speed + ta;
    const dist = (t) => (t < ta ? (speed * t * t) / (2 * ta) : t > dur - ta ? total - (speed * (dur - t) ** 2) / (2 * ta) : speed * (t - ta / 2));
    const at = new T.Vector3();
    return this.s.anim(dur, (_, q) => {
      const d = Math.max(0, Math.min(total, dist(q * dur)));
      let i = 1;
      while (i < P.length - 1 && L[i] < d) i++;
      const k = (d - L[i - 1]) / Math.max(1e-6, L[i] - L[i - 1]);
      at.lerpVectors(P[i - 1], P[i], Math.min(1, k));
      c.position.set(at.x, at.y, at.z);
      // face the way it is going (turning smoothly), and face the child again as it stops
      const want = Math.atan2(P[i].x - P[i - 1].x, P[i].z - P[i - 1].z);
      let dy = want - c.rotation.y;
      while (dy > Math.PI) dy -= Math.PI * 2;
      while (dy < -Math.PI) dy += Math.PI * 2;
      c.rotation.y += dy * 0.3;
    }).then(() => c.position.copy(P[P.length - 1]));
  }

  // The found friend: a happy hop out to the front, the friends on the bench cheer (one little hop each, no sound),
  // its cover goes back down, all the covers go quietly, and it walks straight back to its seat on the bench.
  async found(c, p) {
    const s = this.s, u = c.userData;
    const from = c.position.clone(), out = V(from.x * FRONT_IN, 0, OUT_Z);
    c.userData.noWalk = true;
    const arc = Math.max(0.1, Math.min(0.45, LIFT - 0.08 - (HEIGHT[c.userData.hider] ?? 1.3))); // head stays under the rim
    await s.anim(0.6, (e, q) => { c.position.lerpVectors(from, out, e); c.position.y = Math.sin(q * Math.PI) * arc; }, Ease.inOut);
    c.position.copy(out);
    c.userData.noWalk = false;
    if (this.dead) return;
    this.tray.items().forEach((f, i) => s.wait(0.1 + i * 0.09).then(() => hop(s, f, 0.25, 0.4)));
    const lowered = this.lift(p, false);
    await hop(s, c, 0.35, 0.45); // a happy bounce
    if (u.face) setFace(u.face, 'happy');
    await lowered;
    if (this.dead) return;
    // the covers have done their job: they go quietly (0.5 s), and the way to the bench is clear
    for (const g of this.gags) g.visible = false;
    if (this.tail) this.tail.visible = false;
    await Promise.all(this.pots.map((q) => this.fadeAway(q, 0.5)));
    for (const sh of this.shadows) sh.visible = false;
    if (this.dead) return;
    this.benchP = this.toBench(c);
  }

  // the friend walks straight to the lane behind its seat, turns, crouches and hops up; it stays there all level.
  // `crossed` resolves once it is clear of the cover row (the next round's covers may come down then).
  toBench(c) {
    this.walker = c;
    const seat = this.tray.spot(this.tray.count);
    let crossed;
    this.crossedP = new Promise((res) => (crossed = res));
    const watch = this.s.every(0.05, () => { if (c.position.z < POT_Z - 2.0) { crossed(); watch(); } });
    const go = (async () => {
      await this.walkPath(c, [V(seat.x, 0, LANE_Z)]);
      crossed(); watch();
      if (this.dead) return;
      await this.s.tween(c.rotation, { y: Math.PI }, 0.25, Ease.inOut);
      const a = c.position.clone(), b = V(seat.x, seat.y, seat.z);
      const base = c.userData.baseScale ?? c.scale.x;
      await this.s.anim(0.12, (_, q) => { const k = 1 - Math.sin(q * Math.PI / 2) * 0.15; c.scale.set(base / Math.sqrt(k), base * k, base / Math.sqrt(k)); });
      c.scale.setScalar(base);
      c.userData.noWalk = true; // an arc through the air is a hop, not a walk
      await this.s.anim(0.55, (e, q) => { c.position.lerpVectors(a, b, e); c.position.y = a.y + (b.y - a.y) * e + Math.sin(q * Math.PI) * 0.7; }, Ease.inOut);
      c.position.copy(b);
      await this.s.tween(c.rotation, { y: 0 }, 0.3, Ease.inOut);
      c.userData.noWalk = false;
      if (this.dead) return;
      await this.tray.add(c, { dur: 0.15, arc: 0 });
      if (this.walker === c) this.walker = null;
    })();
    return go;
  }

  async afterSuccess() {
    // the friend is out, the covers are gone and it is on its way to the bench: the next round starts as soon as it is
    // clear of the cover row (it hops up onto its seat while the next friend hides)
    if (this.foundP) await this.alive(this.foundP);
    this.foundP = null;
    if (this.dead) return;
    this.chick = null;
    if (this.crossedP) await this.alive(this.crossedP);
    this.crossedP = null;
    if (this.round >= this.totalRounds && this.benchP) await this.alive(this.benchP); // the last one sits down first
  }

  // ground shadows stay on the ground: smaller and lighter as a cover rises
  update() {
    for (const p of this.pots) {
      const sh = p.userData.sh;
      if (!sh) continue;
      sh.position.set(p.position.x, 0, p.position.z);
      const k = 1 - Math.min(1, p.position.y / LIFT) * 0.45;
      sh.scale.setScalar(k * (p.scale.x || 1));
    }
  }

  // ---------------- hints ----------------
  center(p) { return p.position.clone().add(new T.Vector3(0, 1.0, 0.5)); }
  showHint(glow = true) {
    if (!this.hidePot) return;
    if (glow) { this.addHalo(this.hidePot.userData.mid || this.hidePot, 1.6); wiggle(this.s, this.hidePot, 0.08, 0.5); this.call(); }
    fx.ghostPath([this.center(this.hidePot)], { mode: 'tap' });
  }
  // A stuck child: first every cover gives a tiny wiggle (no answer given away in a memory game); then the right
  // cover hops and the friend's own call comes from under it.
  nudge(step) {
    if (this.busy || !this.hidePot) return;
    if (step <= 1) { this.pots.forEach((p, i) => this.s.wait(i * 0.12).then(() => wiggle(this.s, p, 0.05, 0.45))); return; }
    const p = this.hidePot, y0 = 0;
    this.s.anim(0.5, (_, q) => { if (!this.busy) p.position.y = y0 + Math.sin(q * Math.PI) * 0.35; }).then(() => { if (!this.busy) p.position.y = y0; });
    this.call();
    const stop = fx.halo(p.userData.mid || p, 1.6); this.stopHints.push(stop); this.s.wait(3).then(stop); // (a tap clears it at once)
  }
  // only Level 1's first cue points at the cover; from Level 2 the cue scans so the game stays a memory game.
  // A touch ends the demo at once; taps are never locked out while it plays.
  demoL3() { fx.ghostPath(this.pots.map((p) => this.center(p)), { mode: 'scan' }); }
  playDemo() {
    this.demoing = true;
    if (this.level >= 1) this.demoL3(); else this.showHint(false);
    const end = () => { off(); if (this.demoing) { fx.clearHands(); this.demoing = false; this.idle = 0; } };
    const off = input.onAny(end);
    this.offs.push(off);
    this.s.wait(2.5).then(end);
  }
  makeErrorless() {
    for (const p of this.pots) if (p !== this.hidePot) { p.userData.off = true; p.userData.tap.enabled = false; p.userData.base = 0.8; this.s.tween(p.scale, { x: 0.8, y: 0.8, z: 0.8 }, 0.3); }
    this.peek = true;
    if (!this.busy) this.placeTail();
    this.stopPeep = this.s.every(3, () => { if (!this.busy) wiggle(this.s, this.hidePot, 0.06, 0.6); });
  }
  nextRound() { if (this.stopPeep) { this.stopPeep(); this.stopPeep = null; } super.nextRound(); }

  // ---------------- finale: the friends she found, on their bench ----------------
  // Pip comes in from the left to sit with them for the photo (he waits off-frame while the camera is close on the covers)
  onFinale() {
    this.finaleCam = true;
    const pip = this.pip;
    this.walkPath(pip, [PIP_AT.clone()]).then(() => this.s.tween(pip.rotation, { y: 0.35 }, 0.3, Ease.inOut));
  }
  creationView() {
    // the whole bench of friends with Pip beside it (every friend and all of Pip inside the frame, 4:3 to 16:9)
    const cx = (PIP_AT.x - 1.0 + BENCH_X + (6 * SEAT_GAP) / 2 + 0.4) / 2;
    return { pos: V(cx, 4.0, BENCH_Z + 12.6), look: V(cx, 1.65, BENCH_Z + 0.6) };
  }
  creationObjects() { return this.tray.items(); }
  // poke a friend on the bench: it answers in its own voice with a little hop
  onAdmirePoke(o) {
    input.press(o, 140);
    const k = o.userData.hider;
    if (k) this.call(k);
    hop(this.s, o, 0.3, 0.4);
  }
}
