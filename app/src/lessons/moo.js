// Game 11 — Who says moo? Topic mt_ppENoD8vf1 "Local plants & animals".
// An animal sound plays; tap the animal that makes it. Every animal answers with its own voice when tapped.
// Each round the animals stand in different farm spots (pen, hay, barn, pond…); a sound bubble by Pip shows the call
// (it plays only once the narrator has finished, so she always hears it clearly). The right animal does its own
// signature move (cow chews, pig rolls in the mud and stays muddy, sheep poofs, hen lays an egg, horse clip-clops,
// duck splashes); then SHE feeds it: its favourite treat pops up in Pip's feed bowl and she drags it to the animal's
// mouth (the mouth opens as it comes near; a tap on the treat makes it hop over by itself). The animal chews three
// times, then walks to the straw bed by the fence at the back, where the friends she found stay all level: the farm
// chorus she "conducts" in the finale by poking them (each one calls).
// Each level is a different place: a sunny meadow with a rainbow (flowers, tree, pond, hay), the barnyard (pen, trough,
// barn door, mud) and the garden with hedges, pumpkins and a hay cart.
import * as T from '../three.js';
import { Lesson, shuffle } from '../engine/lesson.js';
import { popIn, popOut, hop, setFace, wiggle } from '../engine/actors.js';
import { makeFarmAnimal } from '../engine/farm.js';
import { makeDuck } from '../engine/beach.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';
import { physics } from '../engine/physics.js';
import { voiceIdle } from '../engine/speech.js';
import { makeTray } from '../engine/keepsake.js';
import { disposeTree } from '../engine/toon.js';
import { SPOT_POOLS, makeSpot, makeSoundBubble, setBubble, SIGNATURE, makeTreat, makeBackdrop, makeFeedBowl, makeHayStack, HAY_STACK } from './moo-farm.js';
import { calmBackdrop } from './view-tools.js';
import { camera } from '../engine/stage.js';
import { makeHay } from '../engine/scenery.js';

const SOUND = { cow: 'moo', pig: 'oink', sheep: 'baa', duck: 'quack', hen: 'cluck', horse: 'neigh' };
const WORD = { cow: 'moo', pig: 'oink', sheep: 'baa', duck: 'quack', hen: 'cluck cluck', horse: 'neigh' };
const NAME = { cow: 'Cow', pig: 'Pig', sheep: 'Sheep', duck: 'Duck', hen: 'Hen', horse: 'Horse' };
const COL = { cow: '#7a6cff', pig: '#ff6f9a', sheep: '#8b7a85', duck: '#ffb020', hen: '#ff4b4b', horse: '#a0623a' };
// (shifted right a little, so the leftmost animal never stands in front of Pip's hay bale)
const XS = { 2: [-2.1, 3.1], 3: [-3.1, 0.6, 4.3], 4: [-3.8, -1.05, 1.7, 4.45] };
const BUBBLE_AT = new T.Vector3(-3.6, 4.4, -3.4);
// Camera per row size: close on the animals (they fill ~40% of the screen height), Pip and the bubble still in view.
// The four-animal rows of Level 3 glide back out a little.
const VIEWS = {
  2: { pos: new T.Vector3(-1.2, 3.05, 9.7), look: new T.Vector3(-1.2, 1.95, 0) },
  3: { pos: new T.Vector3(-0.8, 3.15, 10.5), look: new T.Vector3(-0.8, 2.0, 0) },
  4: { pos: new T.Vector3(-0.6, 3.4, 11.6), look: new T.Vector3(-0.6, 2.1, 0) },
};
// The hay stack by the fence where every animal she found stays (the farm chorus): up above the row's heads, so the
// chorus never peeks out from behind the animals she is choosing between, and well right of Pip. The found animal walks
// straight back to the lane behind the row (STACK_Z + LANE), along it, and hops up the step onto the top.
const STACK_X = 1.9, STACK_Z = -2.55, LANE = 0.32;
const TRAY_AT = [STACK_X, HAY_STACK.top.y - 0.07, STACK_Z + HAY_STACK.top.z];   // (the tray's rug top is 0.07 up)
// Pip's feed bowl, on the grass in front of the middle of the row
const BOWL_AT = new T.Vector3(0.45, 0, 2.55);
const FEED_HINT = 3.0;   // s without feeding: the hand shows the drag
const FEED_AUTO = 8.0;   // s: the treat hops over by itself (the game never stalls)

// [target, ...others]
const PLANS = [
  [['cow', 'duck'], ['duck', 'cow'], ['pig', 'sheep'], ['sheep', 'hen'], ['cow', 'pig'], ['hen', 'horse']],
  [['cow', 'pig', 'duck'], ['sheep', 'hen', 'cow'], ['horse', 'duck', 'pig'], ['pig', 'sheep', 'horse'], ['hen', 'duck', 'cow'], ['duck', 'hen', 'sheep']],
  [['horse', 'cow', 'sheep'], ['hen', 'duck', 'pig'], ['sheep', 'cow', 'horse', 'pig'], ['duck', 'hen', 'sheep', 'cow'], ['pig', 'horse', 'hen', 'duck'], ['cow', 'sheep', 'pig', 'horse']],
];

function makeOne(kind) {
  if (kind === 'duck') return makeDuck(1.7);
  return makeFarmAnimal(kind);
}
const NOT_FIRST = ['barn', 'tree']; // tall spots never stand in slot 0, right beside Pip's bale

export default class MooLesson extends Lesson {
  build() {
    this.plan = PLANS[this.level];
    this.animals = [];
    this.spots = [];
    this.lastSpots = [];
    this.leaving = [];
    // Pip sits up on a big hay bale at the back-left, above the animals' heads, so no animal ever hides Pip
    // (or the sound bubble beside it) and the row of animals can fill the frame
    const bale = makeHay(1.7); bale.position.set(-6.3, 0, -3.5); bale.rotation.y = 0.35;
    this.pipStand = new T.Group(); this.pipStand.position.set(-6.3, 2.3, -3.5);
    this.root.add(bale, this.pipStand);
    this.pipStand.add(this.pip);
    this.pip.position.set(0, 0, 0);
    this.view = null;
    this.setView(this.plan[0].length, 0);
    // farm flowers and sunflowers in the scenery stay out of the band around the animals; the dirt path across the
    // front is hidden too (with the close camera it was a flat tan band along the bottom of the screen: grass instead)
    calmBackdrop(this.meadow, { hide: (o) => (o.userData.flower && o.position.z > -5 && Math.abs(o.position.x) < 11) || (o.isMesh && Math.abs(o.position.z - 4.4) < 0.01 && o.position.y < 0.05) });
    this.bubble = makeSoundBubble();
    this.bubble.position.copy(BUBBLE_AT);
    this.root.add(this.bubble);
    // tapping the sound bubble plays the call again
    this.offs.push(() => input.remove(this.bubbleTap));
    this.bubbleTap = input.addTap(this.bubble, { radius: 1.2, onTap: () => this.playCall() });
    this.pool = SPOT_POOLS[this.level];
    this.backdrop = makeBackdrop(this.level);
    this.root.add(this.backdrop);
    // the farm chorus: every animal she finds climbs the hay stack by the fence and stays up there all level
    this.stack = makeHayStack();
    this.stack.position.set(STACK_X, 0, STACK_Z);
    this.root.add(this.stack);
    this.tray = makeTray(this, 6, TRAY_AT, { style: 'rug', spacing: 1.4 });
    for (const c of this.tray.group.children.slice(0, 2)) c.visible = false; // (the bales are the floor; the spot marks stay)
    // Pip's feed bowl: the treat she gives the animal pops up in it (standing ON the grass, never sunk into it)
    this.bowl = makeFeedBowl();
    this.bowl.position.copy(BOWL_AT);
    this.bowl.rotation.y = 0.3;
    this.root.add(this.bowl);
    this.bowl.updateMatrixWorld(true);
    const bb = new T.Box3().setFromObject(this.bowl);
    if (bb.min.y < 0.01) this.bowl.position.y += 0.01 - bb.min.y;
    // a low invisible kerb in front of the row: a rolling egg stops by the animals, never off the front of the screen
    physics.box(new T.Vector3(0, 0.3, 1.45), { x: 18, y: 0.6, z: 0.2 });
  }

  // the camera for a row of n animals (glides when the row size changes)
  setView(n, dur = 0.9) {
    const v = VIEWS[n] || VIEWS[3];
    if (this.view === v) return;
    this.view = v;
    if (!dur) { this.glideCamera(v.pos, v.look, 0.01); return; }
    this.glideCamera(v.pos, v.look, dur);
  }

  async startRound(r) {
    this.busy = true;
    this.solved = false;
    this.roundT0 = performance.now();
    // last round's animals and spots already left at the end of afterSuccess (faded, or walked to the straw bed)
    for (const o of this.leaving) { physics.remove(o); if (o.parent) o.parent.remove(o); disposeTree(o); }
    this.leaving = [];
    this.actRoot = new T.Group();
    this.root.add(this.actRoot);
    const [target, ...others] = this.plan[r];
    this.target = target;
    this.setView(others.length + 1);
    // shuffle positions, but never put the answer in the same place twice running
    let kinds;
    do { kinds = shuffle([target, ...others]); } while (kinds.indexOf(target) === this.lastIdx && kinds.length > 1 && Math.random() < 0.85);
    this.lastIdx = kinds.indexOf(target);
    // new farm spots every round: none of last round's spots come back
    const pool = kinds.length === 4 ? this.pool.filter((k) => k !== 'tree') : this.pool;
    const fresh = shuffle(pool.filter((k) => !this.lastSpots.includes(k)));
    const spots = fresh.length >= kinds.length ? fresh.slice(0, kinds.length) : fresh.concat(shuffle(pool.filter((k) => !fresh.includes(k)))).slice(0, kinds.length);
    // tall spots (barn door, tree) never stand in the slot right beside Pip's bale
    if (NOT_FIRST.includes(spots[0])) { const j = spots.findIndex((k) => !NOT_FIRST.includes(k)); if (j > 0) [spots[0], spots[j]] = [spots[j], spots[0]]; }
    this.lastSpots = spots;
    const xs = XS[kinds.length];
    const four = kinds.length === 4;
    this.spots = spots.map((k, i) => {
      const sp = makeSpot(k, { side: -1 }); // (the tree goes on the side toward the middle: never cut by the frame edge)
      sp.position.set(xs[i], 0, 0.4 - Math.abs(xs[i]) * 0.08 - 0.05);
      sp.scale.setScalar(four ? 0.72 : 1);
      this.root.add(sp);
      popIn(this.s, sp, sp.scale.x, 0.35, { sound: false });
      return sp;
    });
    this.animals = kinds.map((k, i) => {
      const a = makeOne(k);
      a.position.set(xs[i], 0, 0.4 - Math.abs(xs[i]) * 0.08);
      if (spots[i] === 'pond') a.position.y = -0.04; // feet just in the water
      a.rotation.y = -xs[i] * 0.05;
      a.userData.home = a.position.clone();
      a.userData.baseScale = a.userData.baseScale ?? 1;
      a.userData.spot = spots[i];
      this.root.add(a);
      this.s.wait(0.1 + i * 0.15).then(() => popIn(this.s, a, a.userData.baseScale, 0.5, { sound: false }));
      a.scale.setScalar(0.001);
      a.userData.tap = input.addTap(a, { radius: 1.3, offset: new T.Vector3(0, 1.2, 0), onTap: () => this.tapAnimal(a) });
      return a;
    });
    // Level 1: the animal's face in its colour. Level 2: a plain note first (she listens), the face comes back as the
    // hint when she is stuck. Level 3: always just the note, no colour clue.
    this.setBubbleFor(this.level === 0);
    // the bubble is up from the start (silent); its call plays once the narrator has asked the question
    this.s.stop(this.bubble.scale);
    popIn(this.s, this.bubble, this.bubble.userData.size, 0.45, { sound: false });
    await this.wait(0.3);
    this.busy = false;
    this.cue();
  }
  setBubbleFor(face) { setBubble(this.bubble, this.target, face ? COL[this.target] : '#4a90ff', !face); }

  // where the animal's head is in the world (for notes and hints)
  headPos(a) {
    const h = a.userData.head;
    const p = h && h !== a ? h.getWorldPosition(new T.Vector3()) : a.getWorldPosition(new T.Vector3()).add(new T.Vector3(0, 1.8, 0));
    return p;
  }
  head(a) { return a.position.clone().add(new T.Vector3(0, a.userData.kind === 'duck' ? 1.6 : 2.5, 0.3)); }
  // the animal's mouth in the world (its 'mouth' anchor, rest pose)
  mouthPos(a) {
    const m = a.userData.anchors && a.userData.anchors.mouth;
    a.updateMatrixWorld(true);
    if (m) return a.localToWorld(new T.Vector3(m[0], m[1], m[2] + 0.12));
    return this.headPos(a).add(new T.Vector3(0, -0.2, 0.5));
  }
  // the animal answers in its own voice: its call, a happy open face, a little wiggle and head tilt (right or wrong)
  voice(a, { note = true } = {}) {
    const k = a.userData.kind;
    sfx[SOUND[k]]();
    if (note) {
      const s = a.getWorldScale(new T.Vector3()).y;
      fx.float(this.headPos(a).add(new T.Vector3(0.75 * s, 0.85 * s, 0)), '♪', { color: COL[k], size: 6 });
    }
    const f = a.userData.face;
    if (f) { setFace(f, 'joy'); this.s.wait(0.7).then(() => { if (f.userData.emotion === 'joy') setFace(f, 'happy'); }); }
    wiggle(this.s, a, 0.1, 0.5);
    const h = a.userData.head;
    if (h && h !== a && !a.userData.tilting) {
      a.userData.tilting = true;
      const z0 = h.rotation.z;
      this.s.anim(0.6, (_, p) => { h.rotation.z = z0 + Math.sin(p * Math.PI) * 0.18; }).then(() => { h.rotation.z = z0; a.userData.tilting = false; });
    }
  }

  // The sound bubble: it swells for a held breath (silent), then the call plays and the bubble wobbles in time.
  playCall() {
    const t = this.target, b = this.bubble, k = b.userData.size;
    // (a replay queued by a wrong tap or the prompt never brings the bubble back once the round is solved)
    if (this.busy || this.dead || this.solved || this.calling) return;
    this.calling = true;
    const tok = (this.callTok = (this.callTok || 0) + 1);
    const was = b.visible && b.scale.x > k * 0.5;
    b.visible = true;
    this.s.stop(b.scale);
    this.s.anim(0.38, (_, p) => {
      if (this.solved || tok !== this.callTok) return;
      const e = was ? 1 + Math.sin(p * Math.PI * 0.5) * 0.08 : Ease.back(Math.min(1, p / 0.7)) * (1 + Math.max(0, p - 0.7) * 0.25);
      b.scale.set(k * e, k * e, 1);
    }).then(() => {
      if (this.dead || this.solved || tok !== this.callTok || t !== this.target) { this.calling = false; return; }
      sfx[SOUND[t]]();
      wiggle(this.s, this.pip, 0.12, 0.4);
      const k0 = b.scale.x / k;
      this.s.anim(0.75, (_, p) => {
        if (this.solved) return; // the right animal was tapped mid-wobble: let the bubble's pop-out win
        const e = k0 + (1 - k0) * Math.min(1, p * 3);
        const w = 1 + Math.sin(p * Math.PI * 6) * 0.07 * (1 - p);
        b.scale.set(k * e * w, k * e / w, 1);
      }).then(() => { this.calling = false; });
    });
  }
  // the call plays once the narrator has finished (never on top of the question)
  callSoon(extra = 0.2) {
    const t = this.target, r = this.round;
    this.wait(0.1).then(() => voiceIdle(extra)).then(() => { if (!this.dead && t === this.target && r === this.round && !this.solved) this.playCall(); });
  }

  promptText() { return this.level === 2 ? 'Listen! Who is it?' : `Who says ${WORD[this.target]}?`; }
  prompt(opts = {}) {
    this.say(this.promptText(), { max: 1.5, ...opts });
    this.callSoon(0.2);
  }

  async tapAnimal(a) {
    if (this.busy || this.solved) return;
    const k = a.userData.kind;
    if (k !== this.target) {
      if (a.userData.answering) return;
      a.userData.answering = true;
      // the animal calls first in its own voice, then the narrator names it, then the call to find plays again
      this.voice(a);
      const t = this.target, r = this.round;
      this.wait(0.7).then(() => {
        a.userData.answering = false;
        if (this.dead || this.solved || t !== this.target || r !== this.round) return;
        this.redirect(`${NAME[k]} says ${WORD[k]}!`);
        this.wait(0.1).then(() => voiceIdle(0.4)).then(() => { if (!this.dead && t === this.target && r === this.round && !this.solved) this.playCall(); });
      });
      return;
    }
    this.busy = true;
    this.solved = true;
    this.goPending = false; // she is already playing: no Go! badge now (and the feeding drag is never held back by it)
    input.lock(900);
    fx.clearHands();
    for (const o of this.animals) if (o.userData.tap) input.remove(o.userData.tap);
    // the bubble pops; the animal answers in its own voice and does its signature move (the one reaction);
    // the others just turn their heads to watch
    popOut(this.s, this.bubble, 0.2);
    this.voice(a, { note: false });
    this.found = a;
    this.animals.forEach((o) => {
      if (o === a) return;
      this.s.tween(o.rotation, { y: Math.atan2(a.position.x - o.position.x, 2.5) * 0.3 }, 0.6, Ease.inOut);
    });
    this.payoffP = SIGNATURE[k](this.s, a, this.actRoot);
    this.busy = false; // success() takes over (it sets busy itself)
    this.success(this.head(a), '', { still: 0.6 });
  }

  // ---------------- she feeds it ----------------
  // From the moment the treat lands at the mouth: one bite in place (facing her), then the animal walks back to the
  // lane behind the row, still chewing, while the other animals and the spots fade; as soon as it is in the lane the
  // next row comes in (tappable ~1.7 s after the treat landed), and it walks on along the lane and hops up the hay stack
  // to its place in the chorus behind the new row. Nothing it passes is still there: the old row has gone, the new
  // row's props all stay in front of the lane.
  async afterSuccess() {
    const a = this.found;
    if (!a || this.dead) return;
    const t = await this.feed(a);           // resolves when the treat is AT the mouth
    if (this.dead) return;
    this.feedLandAt = performance.now();
    const chew = this.chew(a, t);
    const gone = [...this.animals.filter((o) => o !== a), ...this.spots, this.actRoot];
    for (const o of gone) { o.traverse((c) => physics.remove(c)); this.fadeAway(o, 0.5); }
    this.leaving.push(...gone);
    await this.wait(0.45);                  // the first bite, in place
    if (this.dead) return;
    a.userData.home = null;
    const i = this.sent = (this.sent ?? -1) + 1;
    await this.walkBack(a, i);
    if (this.dead) return;
    const climb = this.climb(a, i, chew);
    this.found = null;
    if (this.round >= this.totalRounds) await this.alive(climb); // the last one is up there before the finale looks
  }
  // the scale an animal has on the stack (the tray's fit: a spot is 1.4 wide)
  chorusScale(a) {
    a.updateMatrixWorld(true);
    const bx = new T.Box3().setFromObject(a), sz = bx.getSize(new T.Vector3());
    return a.scale.x * Math.min(1, (1.4 * 0.85) / (Math.max(sz.x, sz.z) || 1));
  }
  // straight back from its spot to the lane behind the row, shrinking a little toward its size on the stack
  async walkBack(a, i) {
    const from = a.position.clone(), to = new T.Vector3(from.x, 0, STACK_Z + LANE);
    a.userData.chorusK = this.chorusScale(a);
    const k0 = a.scale.x, k1 = k0 + (a.userData.chorusK - k0) * 0.5;
    const dur = Math.max(0.6, from.distanceTo(to) / 2.6);
    const yaw0 = a.rotation.y;
    this.s.tween(a.rotation, { y: Math.PI * (from.x < this.tray.spot(i).x ? 0.85 : -0.85) }, 0.3, Ease.inOut);
    await this.s.anim(dur, (e) => { a.position.lerpVectors(from, to, e); a.scale.setScalar(k0 + (k1 - k0) * e); }, Ease.inOut);
    a.userData.baseScale = k1;
    void yaw0;
  }
  // along the lane to below its place, two hops up (the step, then the top), turn to face her, settle into the chorus
  async climb(a, i, chew) {
    const spot = this.tray.spot(i);
    const k0 = a.scale.x, k1 = a.userData.chorusK ?? k0;
    const p0 = a.position.clone(), p1 = new T.Vector3(spot.x, 0, STACK_Z + LANE);
    const along = Math.abs(p1.x - p0.x);
    if (along > 0.05) {
      await this.s.tween(a.rotation, { y: Math.sign(p1.x - p0.x) * Math.PI / 2 }, 0.25, Ease.inOut);
      await this.s.anim(Math.max(0.4, along / 2.4), (e) => { a.position.lerpVectors(p0, p1, e); a.scale.setScalar(k0 + (k1 - k0) * e); }, Ease.inOut);
    }
    a.scale.setScalar(k1); a.userData.baseScale = k1;
    await this.s.tween(a.rotation, { y: Math.PI }, 0.2, Ease.inOut);
    const hopTo = async (to) => {
      const from = a.position.clone();
      await this.s.anim(0.5, (e, p) => { a.position.lerpVectors(from, to, e); a.position.y += Math.sin(p * Math.PI) * 0.55; }, Ease.inOut);
      a.position.copy(to);
    };
    await hopTo(new T.Vector3(spot.x, HAY_STACK.step.y, STACK_Z + HAY_STACK.step.z));
    await hopTo(new T.Vector3(spot.x, HAY_STACK.top.y, STACK_Z + HAY_STACK.top.z));
    await this.s.tween(a.rotation, { y: 0 }, 0.35, Ease.inOut);
    await chew;
    // in order, so every animal keeps the place it walked to
    this.chorusChain = (this.chorusChain || Promise.resolve()).then(() => (this.dead ? null : this.tray.add(a, { dur: 0.2, arc: 0 })));
    return this.chorusChain;
  }
  feed(a) {
    return new Promise((resolve) => {
      const k = a.userData.kind;
      const t = makeTreat(k, 0);
      this.bowl.updateMatrixWorld(true);
      t.position.copy(this.bowl.localToWorld(this.bowl.userData.seat.clone()));
      t.scale.multiplyScalar({ apple: 1.0, corn: 1.2, carrot: 1.25 }[t.userData.treat] ?? 1.35); // big enough to see and grab, never bigger than the bowl
      t.rotation.y = 0.4;
      this.root.add(t);
      this.treat = t;
      t.userData.feedable = true;
      popIn(this.s, t, t.scale.x, 0.45, { sound: false });
      sfx.pop();
      const f = a.userData.face;
      let done = false, open = false;
      const mouthOpen = (on) => {
        if (open === on || done) return;
        open = on;
        if (f) setFace(f, on ? 'joy' : 'happy'); // the big open smile: mouth open, ready to eat
        const h = a.userData.head;
        if (h && h !== a) this.s.tween(h.rotation, { x: on ? 0.16 : 0 }, 0.25, Ease.out);
      };
      // (the zone is where the treat's bottom goes: the treat then sits AT the mouth, not over the eyes)
      const zones = () => [{ pos: this.mouthPos(a).add(new T.Vector3(0, -0.35, 0)), radius: 1.15, onNear: (kk) => mouthOpen(kk > 0.15) }];
      const finish = (how) => {
        if (done) return;
        done = true;
        t.userData.feedable = false;
        input.remove(drag);
        fx.clearHands();
        clearInterval(timer);
        this.treat = null;
        this.land(a, t, how).then(() => resolve(t));
      };
      const drag = input.addDrag(t, {
        radius: 0.85, offset: new T.Vector3(0, 0.15, 0), zones, autoHome: true, magnet: 0.35,
        onPick: () => { fx.clearHands(); idle0 = performance.now(); },
        onDrop: (z, { tapped }) => {
          idle0 = performance.now();
          if (z) finish('drop');
          else if (tapped) finish('hop');
          else mouthOpen(false);
        },
      });
      // a stuck child: the hand shows the drag after 3 s, the treat hops over by itself after 8 s
      let idle0 = performance.now(), hinted = false;
      this.feedTap = () => finish('hop');
      const timer = setInterval(() => {
        if (this.dead) { clearInterval(timer); return; }
        if (done || input.dragging()) { idle0 = performance.now(); return; }
        const s = (performance.now() - idle0) / 1000;
        if (s > FEED_HINT && !hinted) {
          hinted = true;
          fx.ghostPath([t.getWorldPosition(new T.Vector3()).add(new T.Vector3(0, 0.25, 0)), this.mouthPos(a)], { mode: 'drag', maxDur: 2.6 });
        }
        if (s > FEED_AUTO) finish('hop');
      }, 200);
    });
  }
  // the treat reaches the mouth (it hops over at walking pace when it was tapped) and rides on the head from then on
  async land(a, t, how) {
    this.feedTap = null;
    // held at the lips: its middle just below and in front of the mouth, a little smaller (never over the eyes)
    const bb = new T.Box3().setFromObject(t), ht = bb.max.y - bb.min.y;
    const s0 = t.scale.clone(), s1 = s0.clone().multiplyScalar(0.75);
    const to = this.mouthPos(a).add(new T.Vector3(0, -ht * 0.3, 0.14));
    const from = t.position.clone();
    const f = a.userData.face;
    if (f) setFace(f, 'joy');
    const h = a.userData.head && a.userData.head !== a ? a.userData.head : null;
    if (h) this.s.tween(h.rotation, { x: 0.16 }, 0.25, Ease.out);
    if (how === 'hop') {
      // little hops toward the mouth, about 2.5 units a second
      const dist = from.distanceTo(to);
      const dur = Math.max(0.8, dist / 2.5), hops = Math.max(2, Math.round(dist / 1.6));
      await this.s.anim(dur, (e, p) => {
        t.position.lerpVectors(from, to, e);
        t.scale.lerpVectors(s0, s1, e);
        t.position.y += Math.abs(Math.sin(p * Math.PI * hops)) * 0.55 * (1 - p * 0.5);
      }, Ease.inOut);
    } else {
      await this.s.anim(0.3, (e) => { t.position.lerpVectors(from, to, e); t.scale.lerpVectors(s0, s1, e); }, Ease.out);
    }
    if (this.dead) return;
    if (h) h.attach(t); else a.attach(t);
  }
  // three chews, head down, the treat going in bites (one chomp sound); it keeps chewing as it walks off
  async chew(a, t) {
    const f = a.userData.face;
    const h = a.userData.head && a.userData.head !== a ? a.userData.head : null;
    const k0 = t.scale.clone();
    sfx.chomp();
    const x0 = h ? 0.16 : 0;
    for (let i = 0; i < 3; i++) {
      const kk = [0.62, 0.3, 0.001][i];
      let bit = false;
      await this.s.anim(0.42, (_, p) => {
        if (h) h.rotation.x = x0 + 0.12 + Math.sin(p * Math.PI) * 0.12;
        if (p > 0.45 && !bit) { bit = true; t.scale.copy(k0).multiplyScalar(kk); if (f) setFace(f, 'happy'); }
      });
      if (f && i < 2) setFace(f, 'joy');
    }
    t.visible = false;
    if (t.parent) t.parent.remove(t);
    disposeTree(t);
    if (f) setFace(f, 'joy');
    if (h) await this.s.tween(h.rotation, { x: 0 }, 0.35, Ease.inOut);
    if (f) this.s.wait(0.6).then(() => { if (f.userData.emotion === 'joy') setFace(f, 'happy'); });
  }

  // stuck child: step 1 only plays the call again (the engine repeats the question; at Level 2 the animal's face
  // comes back into the bubble as the hint); step 2 the animal hops, glows, and the hand shows the tap
  nudge(step) {
    if (this.busy || this.solved) return;
    if (step <= 1) { if (this.level === 1) this.setBubbleFor(true); return; }
    super.nudge(step);
  }
  nudgeTarget() { return this.busy ? null : this.animals.find((a) => a.userData.kind === this.target) || null; }

  showHint(glow = true) {
    const a = this.animals.find((x) => x.userData.kind === this.target);
    if (!a) return;
    if (glow) this.addHalo(a, 1.4);
    fx.ghostPath([this.head(a).add(new T.Vector3(0, -0.8, 0))], { mode: 'tap' });
  }
  choicePoints() { return this.animals.map((a) => this.head(a).add(new T.Vector3(0, -0.8, 0))); }

  makeErrorless() {
    for (const a of this.animals) if (a.userData.kind !== this.target) {
      a.userData.tap.enabled = false;
      const k = (a.userData.baseScale ?? 1) * 0.7;
      this.s.tween(a.scale, { x: k, y: k, z: k }, 0.4);
      a.userData.baseScale = k;
    }
  }

  update(dt, t) {
    // a slow bob for the sound bubble while it waits
    const b = this.bubble;
    if (b.visible && !this.busy) b.position.y = BUBBLE_AT.y + Math.sin(t * 2.2) * 0.12;
    for (const sp of this.spots) if (sp.userData.ring) { const p = (t % 2.5) / 2.5; sp.userData.ring.scale.setScalar(0.6 + p); sp.userData.ring.material.opacity = 0.6 * (1 - p); }
    // the waiting treat breathes in its bowl
    const tr = this.treat;
    if (tr && tr.userData.feedable && !tr.userData.dragging) tr.rotation.y = 0.4 + Math.sin(t * 2) * 0.12;
  }

  // ---------------- the finale: the farm chorus on the hay stack ----------------
  // close on the chorus: its whole width (plus a little margin) fills the screen at any screen shape
  creationView() {
    const c = this.tray.group.getWorldPosition(new T.Vector3());
    const halfW = (6 * 1.4 + 0.6) / 2 + 0.5;
    const tanV = Math.tan((camera.fov * Math.PI) / 360);
    const d = Math.max(halfW / (tanV * camera.aspect), 1.6 / tanV);
    return { pos: new T.Vector3(c.x, c.y + 1.0 + d * 0.16, c.z + d), look: new T.Vector3(c.x, c.y + 0.95, c.z) };
  }
  creationObjects() { return this.tray.items(); }
  // she conducts the choir in the finale: each animal she pokes presses in and calls in its own voice. During play a
  // poke on the chorus only gets a press and a little wiggle, no call (a call there would sound like an answer).
  onAdmirePoke(a) {
    input.press(a, 140);
    if (this.finaleOn) this.voice(a); else wiggle(this.s, a, 0.08, 0.4);
  }
  onFinale() { this.finaleOn = true; }
}
