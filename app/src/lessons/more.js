// Game 8 — Which has more? Topic mt__h7hvT4tEb "Comparing groups: more or fewer" (more only: "fewer" is an
// adult word, it belongs in an older pack).
// Two groups of beach snacks drop into two holders; she taps the one with more. Both groups hop up into two rows
// and pair up, one bead link at a time, so the extras with no partner stand out ("More!"). Then SHE feeds the
// hungry friend: every tap on it (or on a snack in the row, or a drag of a snack to its mouth) is one gulp, and the
// friend gets a little rounder with every snack and stays round all level. The group she did not pick hops back into
// its holder. Finale: the too-full friend tries one flap, sits down, burps softly and dozes; her pokes make it burp.
// Each level has its own look: Level 1 picnic stalls with Gull, Level 2 big glass jars with Duck,
// Level 3 beach wagons with Crab. (Level 2 jars are open-topped here: nothing hovers over them.)
//
// Test hooks (tools/autoplay.js): busy, phase ('choose' | 'feed' | other), rightSide(), pick(side), feedNext().
import * as T from '../three.js';
import { Lesson } from '../engine/lesson.js';
import { setFace } from '../engine/actors.js';
import { makeGull, makeDuck, makeCrab, partAnchors } from '../engine/beach.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';
import { setCamera, project, screenRadius } from '../engine/stage.js';
import { propModel } from '../engine/prop-models.js';
import { makeThing, NAME, STRIPES, makeHolder, HOLDER, HALF } from './more-items.js';

// [left count, right count, kind, options] — a new thing every round, always "which has MORE".
// Level 1: big, easy differences. Level 2: closer counts. Level 3: still a clear ratio (2:5, 2:1...), with a size
// trap (the group with fewer is drawn bigger) and a spacing trap (the group with fewer is spread wider).
const PLANS = [
  [[1, 4, 'fish'], [5, 1, 'shell'], [2, 6, 'star'], [3, 1, 'icecream'], [1, 5, 'ball'], [6, 2, 'cookie']],
  [[2, 4, 'shell'], [5, 3, 'icecream'], [3, 6, 'fish'], [4, 2, 'ball'], [3, 5, 'star'], [6, 4, 'cookie']],
  [[2, 5, 'cookie'], [6, 3, 'star'], [3, 6, 'ball', { scale: [1.35, 0.7] }], [2, 5, 'fish'], [4, 2, 'icecream'], [3, 6, 'shell', { spread: [1.35, 0.75] }]],
];
const WHO = ['Gull', 'Duck', 'Crab'];
// Per level: holders' x, the eater (on the sand in the gap, in front) and Pip (behind it, in the gap), the camera,
// the two match-up rows (in front of the holders, above them), how much rounder the eater gets per round.
const LOOK = [
  { rackX: 3.75, eater: { make: () => makeGull(), k: 1.05, at: [0.25, 0, 1.75], call: 'gull' }, pip: [-1.05, 0, -1.7, 0.78],
    cam: [0, 4.5, 12.5], look: [0, 3.5, 0], rows: [5.55, 4.55], rowZ: 2.7, grow: 0.05 },
  { rackX: 3.85, eater: { make: () => makeDuck(1), k: 0.75, at: [0.25, 0, 1.9], call: 'quack' }, pip: [-1.1, 0, -2.2, 0.72],
    cam: [0, 5.1, 11.5], look: [0, 2.5, 0], rows: [4.7, 3.7], rowZ: 2.7, grow: 0.045 },
  { rackX: 3.9, eater: { make: () => makeCrab(0xff6a3a), k: 0.56, at: [0.55, 0, 2.5], call: 'squeak' }, pip: [-1.1, 0, -2.6, 0.72],
    cam: [0, 5.4, 11.5], look: [0, 2.5, 0], rows: [4.8, 3.8], rowZ: 2.7, grow: 0.045 },
];
const RACK_Z = 0.8;

export default class MoreLesson extends Lesson {
  build() {
    const L = (this.L = LOOK[this.level]);
    this.voiceLines = true;
    setCamera(new T.Vector3(...L.cam), new T.Vector3(...L.look));
    this.plan = PLANS[this.level];
    this.hkind = HOLDER[this.level];
    this.racks = [makeHolder(this.hkind), makeHolder(this.hkind)];
    this.racks[0].position.set(-L.rackX, 0, RACK_Z);
    this.racks[1].position.set(L.rackX, 0, RACK_Z);
    this.root.add(...this.racks);
    // the holders are answer targets all level; enabled only while she chooses
    this.rackTaps = this.racks.map((rk, side) => {
      const t = input.addTap(rk, { radius: 2.3, offset: new T.Vector3(0, rk.userData.mid, 0.4), onTap: () => this.pick(side) });
      t.enabled = false;
      return t;
    });
    // the hungry friend stands on the sand in the gap between the holders, facing her
    const E = L.eater;
    const g = (this.eater = E.make());
    g.scale.setScalar(E.k);
    g.userData.baseScale = E.k;
    g.userData.noWalk = true;
    g.position.set(...E.at);
    this.root.add(g);
    this.belly = 1;            // how round the friend is (grows every round, never shrinks)
    this.fedCount = 0;         // snacks eaten this level (the level's gulps climb the tune)
    this.levelTotal = this.plan.reduce((s, p) => s + Math.max(p[0], p[1]), 0);
    this.shapeEater();
    this.anchors = partAnchors(g);
    this.eaterTap = input.addTap(g, { radius: 1.6 * E.k * (this.level === 2 ? 1.3 : 1), offset: new T.Vector3(0, this.level === 2 ? 0.6 : 1.0, 0), onTap: () => this.tapEater() });
    this.eaterTap.enabled = false;
    // Pip watches from behind, in the gap
    const [px, py, pz, pk] = L.pip;
    this.pip.position.set(px, py, pz);
    this.pip.scale.setScalar(pk);
    this.pip.userData.baseScale = pk;
    this.pip.rotation.y = 0.15;
    this.groups = [[], []];
    this.links = [];
    this.leftover = [];
    this.phase = 'idle';
    this.mood = { t: 0, next: 2, look: 0, tilt: 0 };
    this.hideBackdrop();
  }

  // backdrop scenery that lines up with the holders (a lantern post or a boat seen "inside" a jar, the bonfire
  // behind a wagon) stays out of this lesson; the low sun moves out from behind the rows
  hideBackdrop() {
    for (const o of this.meadow?.children || []) {
      const p = o.position;
      // the low sunset sun sat right behind a jar lid and the match-up rows: it sets further left here
      // (the sunset sun goes just off the left edge, its glow still lighting that side; its glitter path on the sea
      // bends after it)
      if (p.z < -40 && Math.abs(p.x) < 9 && p.y < 6) { p.x = -38; continue; }
      if (this.level === 1 && p.z < -6 && p.z > -42 && Math.abs(p.x + 4) < 1.2 && Math.abs(p.y - 0.1) < 0.05) { p.x += -34 * (-p.z / 48); continue; }
      // the night moon sat under the hold button: a little lower and further right
      if (p.z < -40 && Math.abs(p.x - 23) < 0.5 && p.y > 9) { p.x = 25; p.y = 5.5; continue; }
      if (p.z < -32 || p.z > 0.5 || Math.abs(p.x) > (p.z < -15 ? 16 : 9)) continue;
      // lantern posts, sailboats and the bonfire that stand up behind a holder or a friend
      const b = new T.Box3().setFromObject(o);
      if (!b.isEmpty() && b.max.y > 0.9 && b.max.x - b.min.x < 6) o.visible = false;
    }
  }

  // the friend's shape: base size times how round it is now (wider and deeper, a little taller)
  shapeEater(sq = 1) {
    const g = this.eater, k = g.userData.baseScale, b = this.belly;
    sq *= this.sit || 1;   // (sat down, full, in the finale)
    const by = 1 + (b - 1) * 0.35;
    g.scale.set(k * b / Math.sqrt(sq), k * by * sq, k * b / Math.sqrt(sq));
  }

  nudgeTarget() { return null; }
  rightSide() { const [l, r] = this.plan[this.round]; return l > r ? 0 : 1; }

  // ---------------- a round ----------------
  async startRound(r) {
    this.busy = true;
    this.phase = 'drop';
    const [l, rr, kind, opts] = this.plan[r];
    this.kind = kind;
    // last round's leftovers (the group she did not pick, back in its holder) settle away first; they are not
    // hers (the snacks she fed stay inside the friend, who keeps getting rounder)
    for (const t of this.leftover) this.fadeAway(t, 0.45).then(() => this.root.remove(t));
    this.leftover = [];
    for (const lk of this.links) this.root.remove(lk);
    this.links = [];
    // fresh colours for a fresh thing
    const [ca, cb] = STRIPES[kind];
    this.paint(ca, cb);
    for (const rk of this.racks) this.s.anim(0.5, (_, p) => { const k = Math.sin(p * Math.PI) * 0.04; rk.scale.set(1 + k, 1 - k, 1); }).then(() => rk.scale.setScalar(1));
    // one size for both groups (from the bigger one), so neither looks like more just by being bigger
    const n = Math.max(l, rr);
    const k = this.groupScale(n, kind);
    const t0 = 0.1;
    const fall = 0.42;
    this.groups = [this.dropGroup(0, l, kind, k, opts, t0, fall), this.dropGroup(1, rr, kind, k, opts, t0, fall)];
    this.eaterExcited();
    const dropTime = t0 + (n - 1) * 0.1 + fall + 0.05;   // (the next round's choice opens within ~1.1 s)
    await this.wait(dropTime);
    if (this.dead) return;
    this.phase = 'choose';
    for (const t of this.rackTaps) t.enabled = true;
    this.busy = false;
    this.cue();
  }

  // the size every thing in this round is drawn at: as big as fits n side by side between the holder's walls
  groupScale(n, kind) {
    const rk = this.racks[0];
    const fit = (2 * rk.userData.inner - 0.15) / (Math.max(2, n) * 2 * (HALF[kind] || 0.4) * 1.08);
    return Math.min(1.45, fit);
  }

  // The things drop in one after another, both holders together, each straight into its own spot on the holder's
  // floor (a short fall with a soft landing squash: they stand in a neat, countable line).
  dropGroup(side, n, kind, k0, opts, t0, fall) {
    const rk = this.racks[side], u = rk.userData;
    const scale = Math.min(k0 * (opts?.scale?.[side] ?? 1), this.groupScale(n, kind));
    const spread = opts?.spread?.[side] ?? 1;
    const half = (HALF[kind] || 0.4) * scale;
    const room = u.inner - half - 0.05;
    const step = n > 1 ? Math.min(Math.max(2 * half * 1.03, 2 * half * 1.12 * spread), (2 * room) / (n - 1)) : 0;   // (packed close, never overlapping)
    const items = [];
    for (let i = 0; i < n; i++) {
      const t = makeThing(kind, this.level);
      t.scale.setScalar(scale);
      t.userData.k = scale;
      t.position.set(0, 0, 0);
      this.root.add(t);
      t.updateMatrixWorld(true);
      const bb = new T.Box3().setFromObject(t);
      t.userData.foot1 = -bb.min.y / scale;        // from its origin down to its bottom (per unit of scale)
      t.userData.h1 = (bb.max.y - bb.min.y) / scale;
      t.userData.homeK = scale;
      const x = rk.position.x + (i - (n - 1) / 2) * step;
      const home = new T.Vector3(x, u.floorY + t.userData.foot1 * scale + 0.01, RACK_Z);
      t.userData.home = home;
      const from = new T.Vector3(x, u.dropY, RACK_Z);
      t.position.copy(from);
      t.visible = false;
      this.s.wait(t0 + i * 0.1).then(() => {
        if (!t.parent || this.dead) return;
        t.visible = true;
        // (it swells in from small as it starts to fall, so it never just appears full size in mid-air)
        this.s.anim(fall, (e, p) => { t.position.lerpVectors(from, home, e); t.scale.setScalar(scale * Math.min(1, 0.35 + p * 3)); }, Ease.in).then(() => {
          if (!t.parent) return;
          t.position.copy(home);
          this.squash(t, 0.16);
          if (side === 0 || i >= this.groups[0].length) sfx.pup && sfx.pup();
        });
      });
      items.push(t);
    }
    return items;
  }
  squash(o, amt = 0.15, dur = 0.24) {
    const k = o.userData.k ?? o.scale.x;
    return this.s.anim(dur, (_, p) => { const w = Math.sin(p * Math.PI) * (1 - p * 0.3) * amt; o.scale.set(k * (1 + w * 0.5), k * (1 - w), k * (1 + w * 0.5)); }).then(() => o.scale.setScalar(k));
  }

  // repaint the coloured parts of the holders (their first-level toon meshes in the holder's own colour)
  paint(ca, cb) {
    this.racks.forEach((rk, side) => {
      if (!rk.userData.paintParts) {
        rk.userData.paintParts = [];
        rk.traverse((o) => { if (o.isMesh && o.material?.type === 'MeshToonMaterial' && o.material.color.getHex() === rk.userData.col) { o.material = o.material.clone(); rk.userData.paintParts.push(o); } });
      }
      for (const o of rk.userData.paintParts) o.material.color.setHex(side ? cb : ca);
    });
  }

  promptText() {
    if (this.phase === 'feed') return `Feed ${WHO[this.level]}! Tap ${WHO[this.level]}!`;
    if (this.phase !== 'choose' && this.phase !== 'drop') return '';
    return `Tap the one with more ${NAME[this.kind]}!`;
  }
  prompt(opts = {}) {
    const t = this.promptText();
    if (!t) return;
    // the feeding line is spoken the first time only; after that it is a caption (she knows what to do)
    if (this.phase === 'feed' && this.fedOnce) { this.say(t, { voice: false }); return; }
    this.say(t, opts);
  }

  // ---------------- the friend's personality ----------------
  eaterExcited() {
    this.s.wait(0.3).then(() => { if (!this.dead) { sfx[this.L.eater.call]?.(); this.bounce(0.18); this.flap(0.6, 0.7); } });
  }
  flap(dur, amt = 0.8) { this.flapUntil = this.time + dur; this.flapAmt = Math.min(0.6, amt); }   // (small: the round friend's wings never reach a holder)
  // a little bounce that keeps the friend's roundness (hop() would reset its scale)
  bounce(h = 0.2, dur = 0.42) {
    const g = this.eater, y0 = this.L.eater.at[1];
    if (this.bouncing) return Promise.resolve();
    this.bouncing = true;
    return this.s.anim(dur, (_, p) => {
      const pre = p < 0.2 ? Math.sin((p / 0.2) * Math.PI) : 0;
      g.position.y = y0 + Math.max(0, Math.sin(((p - 0.2) / 0.8) * Math.PI)) * h * (p > 0.2 ? 1 : 0);
      this.shapeEater(1 - pre * 0.08 + (p > 0.2 && p < 0.7 ? 0.05 : 0));
    }).then(() => { g.position.y = y0; this.shapeEater(); this.bouncing = false; });
  }
  // (Crab turns only a little: a wide crab turned side-on merges its eyes into one blob)
  lookAt(side) { const a = this.level === 2 ? 0.2 : 0.3; this.mood.look = side === null ? 0 : side ? -a : a; this.mood.hold = 1.4; }

  // ---------------- her choice ----------------
  async pick(side) {
    if (this.busy || this.dead || this.phase !== 'choose') return;
    const right = this.rightSide();
    if (side !== right) {
      // the friend looks at the wrong one, shakes its head, then looks at the right one
      this.lookAt(side);
      this.s.wait(0.35).then(() => { if (!this.dead) this.sayNo(this.eater); });
      this.s.wait(1.1).then(() => { if (!this.dead && this.phase === 'choose') this.lookAt(right); });
      const rk = this.racks[side];
      this.wobble(rk);
      this.redirect('Not that one! Find more!');
      return;
    }
    this.busy = true;
    this.phase = 'match';
    for (const t of this.rackTaps) t.enabled = false;
    this.say('More!', { voice: false });   // her choice is confirmed at once (spoken when the extras stand out)
    fx.clearHands();
    this.clearHints();
    input.lock(400);
    this.lookAt(side);
    sfx[this.L.eater.call]?.();
    this.flap(0.5, 0.8);
    this.bounce(0.2);
    await this.matchUp(side);
    if (this.dead) return;
    this.startFeed(side);
  }
  wobble(rk) {
    const z0 = rk.rotation.z;
    this.s.anim(0.55, (_, p) => { rk.rotation.z = z0 + Math.sin(p * Math.PI * 3) * 0.035 * (1 - p); }).then(() => (rk.rotation.z = z0));
  }

  // where row slot i sits (both rows share the same columns, so pairs stand one above the other)
  slotX(i, n) { const sp = Math.min(1.2, 6.6 / n); return (i - (n - 1) / 2) * sp; }
  rowScale(n) {
    const sp = Math.min(1.2, 6.6 / n);
    return Math.min(1.0, (sp * 0.82) / (2 * (HALF[this.kind] || 0.4)));
  }
  // a path out of the holder that never passes through it: forward from under the stall's awning, straight up out
  // of an open jar or wagon. (A cubic curve A -> c1 -> c2 -> B.)
  exitPath(t, to) {
    const A = t.position.clone(), B = to.clone();
    let c1, c2;
    if (this.hkind === 'tray') { c1 = new T.Vector3(A.x, A.y + 0.15, B.z + 0.3); c2 = new T.Vector3(B.x, A.y + 0.6, B.z); }
    else {
      const top = this.hkind === 'jar' ? 3.0 : 2.4;
      c1 = new T.Vector3(A.x, top, A.z); c2 = new T.Vector3(B.x, Math.max(top + 0.6, B.y + 0.5), A.z + 0.2);
    }
    return (e) => {
      const u = 1 - e;
      return new T.Vector3()
        .addScaledVector(A, u * u * u).addScaledVector(c1, 3 * u * u * e).addScaledVector(c2, 3 * u * e * e).addScaledVector(B, e * e * e);
    };
  }

  // Both groups hop up into two rows, one above the other (left holder's on top), and pair up one at a time;
  // the extras with no partner wiggle and glow: "More!"
  async matchUp(side) {
    const L = this.L;
    const [Lg, Rg] = this.groups;
    for (const t of [...Lg, ...Rg]) { t.visible = true; t.scale.setScalar(t.userData.k); }
    const n = Math.max(Lg.length, Rg.length), m = Math.min(Lg.length, Rg.length);
    const k = this.rowScale(n);
    const moves = [];
    [Lg, Rg].forEach((grp, row) => grp.forEach((t, i) => {
      const to = new T.Vector3(this.slotX(i, n), L.rows[row] + (t.userData.foot1 - t.userData.h1 * 0.5) * k, L.rowZ);
      const path = this.exitPath(t, to), s0 = t.userData.k;
      t.userData.rowAt = to;
      moves.push(this.s.wait(i * 0.03 + row * 0.05).then(() => this.s.anim(0.6, (e) => {
        t.position.copy(path(e));
        t.scale.setScalar(s0 + (k - s0) * e);
      }, Ease.inOut)).then(() => { t.userData.k = k; t.scale.setScalar(k); }));
    }));
    await Promise.all(moves);
    if (this.dead) return;
    await this.wait(0.1);
    const step = Math.min(0.3, 0.9 / Math.max(1, m));   // (the whole match-up stays under 2 s: rule 0)
    // a bead link joins each pair, one at a time, each on the next note
    for (let i = 0; i < m; i++) {
      if (this.dead) return;
      const top = Lg[i], bot = Rg[i];
      const y0 = bot.position.y + (bot.userData.h1 - bot.userData.foot1) * k + 0.01;   // just above the lower one
      const y1 = top.position.y - top.userData.foot1 * k - 0.01;                       // just under the upper one
      const lk = makeLink(Math.max(0.2, y1 - y0));
      lk.position.set(this.slotX(i, n), y0, L.rowZ + 0.05);
      this.root.add(lk);
      this.links.push(lk);
      this.s.anim(0.25, (e) => lk.scale.set(1, Math.max(0.001, e), 1), Ease.out);
      sfx.step(i, Math.max(m, 2), { soft: true });
      this.squash(top, 0.12, 0.3); this.squash(bot, 0.12, 0.3);
      await this.wait(step);
    }
    // the extras: nobody to hold hands with. They wiggle and glow, and that is "More!"
    const bigger = Lg.length > Rg.length ? Lg : Rg;
    const extras = bigger.slice(m);
    await this.wait(0.1);
    this.say('More!', { voice: true });
    extras.forEach((e, i) => {
      this.s.wait(i * 0.08).then(() => {
        const r0 = e.rotation.z;
        this.s.anim(0.9, (_, p) => { e.rotation.z = r0 + Math.sin(p * Math.PI * 4) * 0.22 * (1 - p); }).then(() => (e.rotation.z = r0));
      });
      const stop = fx.halo(e, 0.55 * e.userData.h1 * k + 0.25);
      this.s.wait(1.6).then(stop);
    });
    // feeding opens right now (rule 0); the pairs stay up to look at until her first gulp (or 1.2 s), then the group
    // she did not pick hops home into its holder (the chosen row stays up: it is the friend's dinner)
    this.otherRow = this.groups[1 - side];
    this.leftover = this.otherRow;
    this.feedRow = this.groups[side].slice();
    this.tidied = false;
    this.s.wait(1.2).then(() => this.tidyMatch());
  }
  tidyMatch() {
    if (this.tidied || this.dead) return;
    this.tidied = true;
    for (const lk of this.links) this.s.anim(0.3, (e) => lk.scale.set(1, Math.max(0.001, 1 - e), 1)).then(() => { lk.visible = false; });
    (this.otherRow || []).forEach((t, i) => this.goHome(t, i * 0.05));
  }
  // back into its own spot in its holder, along the reverse of the way out
  goHome(t, delay = 0) {
    const home = t.userData.home, A = t.position.clone();
    const path = this.exitPath({ position: home.clone() }, A);
    const s0 = t.scale.x, s1 = t.userData.homeK;
    return this.s.wait(delay).then(() => this.s.anim(0.7, (e) => {
      t.position.copy(path(1 - e));
      t.scale.setScalar(s0 + (s1 - s0) * e);
    }, Ease.inOut)).then(() => { t.position.copy(home); t.userData.k = s1; t.scale.setScalar(s1); this.squash(t, 0.1); });
  }

  // ---------------- she feeds the friend ----------------
  startFeed(side) {
    if (this.dead) return;
    this.phase = 'feed';
    this.idle = 0; this.ladder = 0;
    this.feedSide = side;
    this.feedTaps = this.feedRow.map((t) => input.addDrag(t, {
      radius: Math.max(0.6, t.userData.h1 * t.userData.k * 0.8), offset: new T.Vector3(0, (t.userData.h1 * 0.5 - t.userData.foot1) * t.userData.k, 0),
      zones: () => [{ pos: this.mouthPos(), radius: 1.3, obj: this.eater, onNear: (kk) => this.openWide(kk) }],
      sound: false, magnet: 0.35,
      onDrop: (z, { tapped }) => { if (z || tapped) this.feed(t); else input.sendHome(t.userData.dragT, { to: t.userData.rowAt, dur: 0.45 }); },
    }));
    this.feedRow.forEach((t, i) => { t.userData.dragT = this.feedTaps[i]; });
    this.eaterTap.enabled = true;
    this.busy = false;
    this.prompt();
    if (!this.fedOnce) {
      // the first time: the hand shows it, slowly, on the real friend
      this.feedDemo = fx.ghostPath([this.eaterCenter()], { mode: 'tap', maxDur: 2.4 });
      const off = input.onAny(() => { off(); fx.clearHands(); });
      this.offs.push(off);
    }
    this.fedOnce = true;
  }
  eaterCenter() { return this.eater.position.clone().add(new T.Vector3(0, this.level === 2 ? 0.6 : 1.0, 0.3)); }
  mouthPos() { return this.anchors.mouth.getWorldPosition(new T.Vector3()); }
  openWide(k) { this.wide = k; }
  tapEater() {
    if (this.phase !== 'feed' || this.dead) return;
    this.feedNext();
  }
  // the next snack in the row (the one nearest the friend goes first)
  feedNext() {
    if (this.phase !== 'feed') return;
    const left = this.feedRow.filter((t) => !t.userData.eaten && !t.userData.flying);
    if (!left.length) return;
    const ex = this.eater.position.x;
    left.sort((a, b) => Math.abs(a.position.x - ex) - Math.abs(b.position.x - ex));
    this.feed(left[0]);
  }
  feed(t) {
    if (this.phase !== 'feed' || t.userData.eaten || t.userData.flying || this.dead) return;
    const now = performance.now();
    if (now - (this.lastFeed || 0) < 330) { input.sendHome(t.userData.dragT, { to: t.userData.rowAt, dur: 0.35 }); return; }   // one gulp at a time
    this.lastFeed = now;
    this.idle = 0;
    fx.clearHands();
    this.clearHints();
    t.userData.flying = true;
    input.remove(t.userData.dragT);
    this.tidyMatch();
    const g = this.eater, s = this.s;
    const A = t.position.clone(), M = this.mouthPos();
    const C = new T.Vector3((A.x + M.x) / 2, Math.max(A.y, M.y) + 0.6, (A.z + M.z) / 2 + 0.2);
    const s0 = t.scale.x;
    this.lookAt(null);
    this.wide = 1;
    s.anim(0.45, (e) => {
      const u = 1 - e;
      t.position.set(u * u * A.x + 2 * u * e * C.x + e * e * M.x, u * u * A.y + 2 * u * e * C.y + e * e * M.y, u * u * A.z + 2 * u * e * C.z + e * e * M.z);
      t.scale.setScalar(Math.max(0.001, s0 * (1 - e * 0.8)));
    }, Ease.inOut).then(() => {
      if (this.dead) return;
      t.visible = false;
      t.userData.eaten = true;
      t.userData.flying = false;
      this.wide = 0;
      // one gulp: the snack goes down, the friend swells a little (and stays that much rounder)
      sfx.step(this.fedCount++, this.levelTotal);
      // (quick gulps one after another each add their share: the swell always heads for the running total)
      this.bellyGoal = (this.bellyGoal ?? this.belly) + this.L.grow / this.feedRow.length;
      const b0 = this.belly, b1 = this.bellyGoal, tok = (this.swellTok = (this.swellTok || 0) + 1);
      s.anim(0.36, (_, p) => {
        if (tok !== this.swellTok) return;
        this.belly = b0 + (b1 - b0) * Math.min(1, p * 1.6);
        this.shapeEater(1 + Math.sin(p * Math.PI) * (p < 0.5 ? 0.07 : -0.05));
      }).then(() => { if (tok === this.swellTok) { this.belly = this.bellyGoal; this.shapeEater(); } });
      const face = g.userData.face;
      if (face) { setFace(face, 'joy'); s.wait(0.5).then(() => { if (face.userData.emotion === 'joy' && this.phase !== 'done') setFace(face, 'happy'); }); }
      if (this.feedRow.every((x) => x.userData.eaten)) this.fedAll();
    });
  }
  async fedAll() {
    if (this.phase !== 'feed') return;
    this.phase = 'done';
    this.eaterTap.enabled = false;
    for (const t of this.feedTaps || []) input.remove(t);
    this.feedTaps = [];
    // full and happy: a contented wing pat, then quiet
    if (this.dead) return;
    this.flap(0.35, 0.5);
    this.success(this.mouthPos(), '', { still: 0.2 });   // (the last swell, then ~0.8 s where nothing new happens)
  }
  async afterSuccess() {
    this.lookAt(null);
  }

  // ---------------- hints ----------------
  // a stuck child: while choosing, the friend looks from one holder to the other (no hop: with two choices a hop
  // would give the answer away); at the second step the answer hops and glows. While feeding: the friend bounces.
  nudge(step) {
    if (this.phase === 'feed') { this.bounce(0.22); this.flap(0.4, 0.6); return; }
    if (this.phase !== 'choose') return;
    if (step < 2) {
      this.lookAt(0);
      this.s.wait(0.8).then(() => { if (!this.dead && this.phase === 'choose') this.lookAt(1); });
      this.s.wait(1.6).then(() => { if (!this.dead && this.phase === 'choose') this.lookAt(null); });
      return;
    }
    const rk = this.racks[this.rightSide()];
    const y0 = rk.position.y;
    this.s.anim(0.5, (_, p) => { rk.position.y = y0 + Math.sin(p * Math.PI) * 0.3; }).then(() => (rk.position.y = y0));
    const a = new T.Object3D(); a.position.copy(this.center(this.rightSide())); this.root.add(a);
    const stop = fx.halo(a, 2.2); this.s.wait(3).then(() => { stop(); this.root.remove(a); });
  }
  center(side) { return new T.Vector3(this.racks[side].position.x, this.racks[side].userData.mid, RACK_Z + 0.4); }
  showHint(glow = true) {
    if (this.phase === 'feed') { fx.ghostPath([this.eaterCenter()], { mode: 'tap' }); return; }
    const side = this.rightSide();
    if (glow) {
      const a = new T.Object3D(); a.position.copy(this.center(side)); this.root.add(a);
      this.addHalo(a, 2.2);
    }
    fx.ghostPath([this.center(side)], { mode: 'tap' });
  }
  choicePoints() { return [this.center(0), this.center(1)]; }
  makeErrorless() {
    if (this.phase === 'feed') {
      // stuck at feeding: the friend helps itself, one snack at a time
      const go = () => { if (this.dead || this.phase !== 'feed') return; this.feedNext(); this.s.wait(0.6).then(go); };
      go();
      return;
    }
    if (this.phase !== 'choose') return;
    const wrong = 1 - this.rightSide();
    this.rackTaps[wrong].enabled = false;
    this.s.tween(this.racks[wrong].scale, { x: 0.8, y: 0.8, z: 0.8 }, 0.5);
  }

  update(dt, t) {
    this.time = t;
    const g = this.eater, w = g.userData.wings, mo = this.mood;
    // wings (or claws): a lazy idle sway, or a flap when excited; wide open while a snack comes to the mouth
    const flapping = this.flapUntil && t < this.flapUntil;
    const a = flapping ? Math.sin(t * 13) * this.flapAmt : Math.sin(t * 2.6) * 0.1 + (this.wide || 0) * 0.35;
    if (w && w.length === 2) {
      for (const [i, wb] of w.entries()) { const r0 = (wb.userData.rz0m ??= wb.rotation.z); wb.rotation.z = r0 + (i ? -a : a); }
    }
    const claws = g.userData.claws;
    if (claws && claws.length === 2 && !(w && w.length)) {
      for (const [i, c] of claws.entries()) { const r0 = (c.userData.rz0m ??= c.rotation.z); c.rotation.z = r0 + (i ? -a : a) * 0.5; }
    }
    // idle life: now and then it glances at a holder or at her and tilts its head
    if (mo.hold > 0) mo.hold -= dt;
    else if (this.phase === 'choose' || this.phase === 'drop' || this.phase === 'feed') {
      mo.t += dt;
      if (mo.t > mo.next) {
        mo.t = 0; mo.next = 1.8 + Math.random() * 2.2;
        const r = Math.random();
        mo.look = this.phase === 'feed' ? 0 : (r < 0.3 ? 1 : r < 0.6 ? -1 : 0) * (this.level === 2 ? 0.18 : 0.25);
        mo.tilt = Math.random() < 0.5 ? (Math.random() - 0.5) * 0.3 : 0;
      }
    }
    g.rotation.y += (mo.look - g.rotation.y) * Math.min(1, dt * 5);
    g.rotation.z += (mo.tilt * 0.4 - g.rotation.z) * Math.min(1, dt * 5);
  }

  // A poke on the friend: its own little reaction (the generic poke would reset its roundness to its old size).
  pokeAt(x, y) {
    if (this.dead) return false;
    const c = project(this.eaterCenter()), k = this.eater.scale.y;
    const r = Math.max(screenRadius(this.eaterCenter(), 1.1 * k * (this.level === 2 ? 1.6 : 1)), Math.min(innerWidth, innerHeight) * 0.07);
    if (Math.hypot(c.x - x, c.y - y) < r) {
      if (this.phase === 'end') this.burp();
      else if (!this.bouncing) { this.bounce(0.15); this.flap(0.3, 0.5); }
      return true;
    }
    const all = this.chars;
    this.chars = (all || []).filter((ch) => ch !== this.eater);
    try { return super.pokeAt(x, y); } finally { this.chars = all; }
  }

  // ---------------- finale: the friend she fed, round and full ----------------
  creationView() {
    const g = this.eater;
    g.updateMatrixWorld(true);
    const b = new T.Box3().setFromObject(g), c = b.getCenter(new T.Vector3()), h = b.max.y - b.min.y;
    // the round friend fills about half the screen height
    // (the low, wide Crab is framed from further and higher, so Pip reads as standing back on the beach behind it,
    // not riding on it)
    const crab = this.level === 2;
    const d = crab ? Math.max(6.5, h * 5) : Math.max(4.2, h * 2.6);
    return { pos: new T.Vector3(c.x, c.y + d * (crab ? 0.42 : 0.22), b.max.z + d), look: new T.Vector3(c.x, c.y + h * (crab ? 0.6 : 0.05), c.z) };
  }
  creationObjects() { return [this.eater]; }
  onAdmirePoke(obj) {
    if (obj !== this.eater || this.burping) return;
    this.burp();
  }
  burp() {
    if (this.burping) return;
    this.burping = true;
    this.burps = (this.burps || 0) + 1;
    const face = this.eater.userData.face;
    if (face) setFace(face, 'joy');
    sfx.mmm();
    this.s.anim(0.4, (_, p) => this.shapeEater(1 + Math.sin(p * Math.PI) * 0.06)).then(() => {
      this.shapeEater();
      if (face) setFace(face, this.dozing ? 'calm' : 'happy');
      if (this.dozing && face?.userData?.eyes) face.userData.eyes.forEach((e) => (e.scale.y = 0.15));
      this.burping = false;
    });
  }
  onFinale() {
    this.phase = 'end';
    // the last group she did not pick settles away: the frame is the friend she fed, nothing else
    for (const t of this.leftover) this.fadeAway(t, 0.5);
    for (const t of this.rackTaps) input.remove(t);
    input.remove(this.eaterTap);
    for (const t of this.feedTaps || []) input.remove(t);
    this.admireTime = 5;
    // the engine locks answers for the finale; pokes on the round friend must still reach it
    this.s.wait(0.1).then(() => { if (!this.dead) { input.unlock(); input.setReady(null); } });
    // too full to fly: one flap, a tiny lift that doesn't take off, sits down, a soft burp, dozes
    (async () => {
      const g = this.eater, y0 = this.L.eater.at[1];
      this.lookAt(null);
      this.flap(0.7, 0.9);
      await this.s.anim(0.6, (_, p) => { g.position.y = y0 + Math.sin(p * Math.PI) * 0.12; });
      if (this.dead) return;
      g.position.y = y0;
      await this.s.anim(0.35, (e) => this.shapeEater(1 - e * 0.07), Ease.out);   // settles down, round
      this.sit = 0.93;
      await this.wait(0.35);
      if (this.dead) return;
      this.burp();
      await this.wait(0.9);
      if (this.dead) return;
      this.dozing = true;
      const face = g.userData.face;
      if (face) setFace(face, 'calm');
      const eyes = face?.userData?.eyes || [];
      const ey = eyes.map((e) => e.scale.y);
      this.s.anim(0.6, (e) => eyes.forEach((x, i) => (x.scale.y = ey[i] * (1 - e * 0.85))));
    })();
  }
}

// A string of round beads between two partners (Blender bead props; code fallback: plain toon beads)
function makeLink(len) {
  const g = new T.Group();
  const n = Math.max(2, Math.round(len / 0.17));
  const k = Math.max(0.6, Math.min(1.0, len / n / 0.2));
  for (let i = 0; i < n; i++) {
    let b = propModel('prop_morebead', { tint: 0xffc83a, size: k });
    if (!b) { b = new T.Mesh(new T.SphereGeometry(0.1 * k, 12, 10), new T.MeshToonMaterial({ color: 0xffc83a })); }
    b.position.y = (i + 0.5) * (len / n);
    g.add(b);
  }
  return g;
}
