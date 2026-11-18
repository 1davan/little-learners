// Lesson 2 — Apple count. Topics mt_WcfaSfVT33 "One-to-one counting" and mt_dmNvjroCPT "How many in total?".
// Tap each thing once: its number is said and shown, and it tumbles (real physics) into the container, piling up.
// The last number is said, the pile jumps once per number (a slow recount with small numerals), then the TOTAL is
// said with the noun ("Three apples!"). The friend looks at the pile and at her; she taps the friend, it sniffs the
// pile happily (mmm, tummy pat) and the round's pile goes into a little bowl with its number tag that hops onto the
// keepsake shelf at the back. The shelf of bowls (one per round) is what the level builds and the finale shows.
// Each level is its own little world: L1 the orchard (Hedgehog, apples, a wicker basket), L2 the berry patch
// (Bunny, strawberries and berries, a blue pail), L3 the tea party (Bear, cookies, cupcakes, donuts, a mixing bowl).
// Every round has a new host (tree, bush, patch, balloons, table, cake stand…) and a twist (ladybug, frog visitor,
// golden one, super-bouncy).
import * as T from '../three.js';
import { Lesson } from '../engine/lesson.js';
import { makeAnimal, popIn, hop, wiggle, setFace } from '../engine/actors.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';
import { physics } from '../engine/physics.js';
import { makeHost } from './counting-hosts.js';
import { makeItem, makeLadybug, makeContainer, PLURAL } from './counting-items.js';
import { frame, calmBackdrop, isTree } from './view-tools.js';
import { camera, getLook, project } from '../engine/stage.js';
import { makeTray } from '../engine/keepsake.js';
import { prop } from './view-tools.js';
import { mesh, geo } from '../engine/toon.js';

// Camera per host so the things to count are big: high for the tree's fruit, low for the blanket / patch / tray.
// (the tree camera stands back a little so both the crown, under the caption, and the whole basket fit)
const CAMS = {
  tree: [0, 4.4, 14.8, 0, 3.0, 0], balloons: [0, 4.1, 13.6, 0, 2.9, 0],
  blanket: [0, 5.2, 13.6, 0, 1.0, 2.4], tray: [0, 5.2, 13.6, 0, 1.0, 2.4], patch: [0, 5.2, 13.6, 0, 1.0, 2.4],
  other: [0, 3.6, 13, 0, 2.1, 0],
};

const WORDS = ['One', 'Two', 'Three', 'Four', 'Five'];
const NUM_COL = ['#ff5a5a', '#ff9f3f', '#5fd068', '#4a90ff', '#a77bff'];
const BOX = new T.Vector3(0, 0, 3.2);
const HOME = new T.Vector3(4.4, 0, 2.2); // beside the container, behind every host's front things (never in the patch)
const HOME_RY = -0.6;
// the keepsake shelf at the back: one bowl per round. It stands on tall posts, so the bowls show over every host
// (a low shelf vanished behind the bush and the table)
const SHELF = [0, 2.35, -3.6];
const tmp = new T.Vector3();

// Per level: who eats, what they eat from, and 6 rounds. Counts are the learning plan (L1 to 3, L2 to 4, L3 to 5).
// host: tree | blossom | bush | patch | balloons | blanket | table | stand | tray
// twist: ladybug (sits on one, flies off) | frog (a visitor watches) | golden (one sparkles at the start) | bouncy
// (the old per-round payoff field `pay` is no longer used: every round ends the same calm way)
export const PLANS = [
  { eater: 'hedgehog', scale: 1, box: 'basket', rounds: [
    { n: 1, item: 'apple', host: 'tree', pay: 'trot' },
    { n: 2, item: 'apple', host: 'bush', twist: 'ladybug', pay: 'juggle' },
    { n: 3, item: 'pear', host: 'blossom', twist: 'bouncy', pay: 'roll' },
    { n: 2, item: 'orange', host: 'balloons', twist: 'frog', pay: 'leap' },
    { n: 3, item: 'plum', host: 'blanket', pay: 'worm' },
    { n: 3, item: 'apple', host: 'tree', layout: 'arc', twist: 'golden', pay: 'spin' },
  ] },
  { eater: 'bunny', scale: 0.9, box: 'pail', rounds: [
    { n: 2, item: 'strawberry', host: 'patch', pay: 'leap' },
    { n: 3, item: 'blueberry', host: 'bush', twist: 'ladybug', pay: 'juggle' },
    { n: 3, item: 'cherry', host: 'blossom', twist: 'bouncy', pay: 'spin' },
    { n: 4, item: 'strawberry', host: 'patch', layout: 'scatter', pay: 'worm' },
    { n: 3, item: 'lemon', host: 'balloons', layout: 'arc', twist: 'frog', pay: 'leap' },
    { n: 4, item: 'strawberry', host: 'patch', layout: 'arc', twist: 'golden', pay: 'trot' },
  ] },
  { eater: 'bear', scale: 0.78, box: 'bowl', rounds: [
    { n: 3, item: 'cookie', host: 'table', pay: 'trot' },
    { n: 4, item: 'cupcake', host: 'stand', twist: 'ladybug', pay: 'leap' },
    { n: 3, item: 'donut', host: 'balloons', layout: 'scatter', twist: 'frog', pay: 'juggle' },
    { n: 4, item: 'cookie', host: 'tray', layout: 'scatter', twist: 'bouncy', pay: 'spin' },
    { n: 5, item: 'cupcake', host: 'table', twist: 'golden', pay: 'trot' },
    { n: 4, item: 'sweet', host: 'stand', twist: 'ladybug', pay: 'leap' },
  ] },
];
const HOST_SND = { tree: 'sparkle', blossom: 'twinkle', bush: 'rustle', patch: 'rustle', balloons: 'whoosh', blanket: 'swoosh', table: 'swoosh', stand: 'twinkle', tray: 'thunk' };

// A physics cup built from static boxes: an octagon floor and a ring of tangent walls.
// (physics.container's walls come out rotated radially, leaving gaps, so this lesson builds its own.)
function cup(pos, r, h, n = 16, wall = 0.3) {
  const seg = (2 * Math.PI * (r + wall / 2)) / n;
  for (const a of [0, Math.PI / 4]) physics.box(new T.Vector3(pos.x, pos.y - 0.1, pos.z), new T.Vector3(r * 2, 0.2, r * 2 * 0.83), a);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    physics.box(new T.Vector3(pos.x + Math.sin(a) * (r + wall / 2), pos.y + h / 2, pos.z + Math.cos(a) * (r + wall / 2)), new T.Vector3(seg * 1.15, h, wall), a);
  }
}

export default class CountingLesson extends Lesson {
  build() {
    this.theme = PLANS[this.level] || PLANS[0];
    this.plan = this.theme.rounds;
    const c = makeContainer(this.theme.box);
    this.box = c;
    c.obj.position.copy(BOX);
    this.root.add(c.obj);
    // invisible walls rise well above the rim so a lively bounce never escapes
    // invisible walls rise a little above the rim so a lively bounce never escapes
    cup(new T.Vector3(BOX.x, c.phys.y, BOX.z), c.phys.r, c.phys.h + 0.3);
    this.hog = makeAnimal(this.theme.eater);
    this.hog.scale.setScalar(this.theme.scale);
    this.hog.userData.baseScale = this.theme.scale;
    this.hog.position.copy(HOME);
    this.hog.rotation.y = HOME_RY;
    this.root.add(this.hog);
    this.hogLook = null;
    this.fruits = [];
    // no scenery trees / leaf litter between or behind the things to count; weather falls behind the play area
    // (also no snowman / pumpkins at the near flanks: the snowman sat behind Pip and under the Home button)
    calmBackdrop(this.meadow, { hide: (o) => (isTree(o) && (Math.abs(o.position.x) < 10 || o.position.z > -12)) || (o.userData.flower && o.position.z > -6 && Math.abs(o.position.x) < 9) || (Math.abs(o.position.x) > 8.5 && o.position.z > -9) });
    this.pip.position.set(-6.5, 0, -2);
    frame(...CAMS.other);
    // the bear's rest pose holds its arms straight out (it read as a T-pose): let them hang
    const arms = this.hog.userData.arms;
    if (this.theme.eater === 'bear' && arms && arms.length === 2) { arms[0].rotation.z = -0.9; arms[1].rotation.z = 0.9; }
    this.tray = makeTray(this, this.totalRounds, SHELF, { style: 'shelf', spacing: 1.3, fit: 1.25 });
    for (const sx of [-1, 1]) {
      const post = mesh(geo.box(0.26, SHELF[1] + 0.36, 0.26), 0xa86f3c, { outline: 0.02 });
      post.position.set(SHELF[0] + sx * (this.totalRounds * 1.3 / 2 - 0.1), (SHELF[1] + 0.36) / 2, SHELF[2]);
      this.root.add(post);
    }
  }

  // glide the camera to frame this round's host
  frameHost(kind) {
    const to = CAMS[kind] || CAMS.other;
    const p0 = camera.position.clone(), l0 = getLook().clone();
    this.s.anim(0.8, (e) => frame(
      p0.x + (to[0] - p0.x) * e, p0.y + (to[1] - p0.y) * e, p0.z + (to[2] - p0.z) * e,
      l0.x + (to[3] - l0.x) * e, l0.y + (to[4] - l0.y) * e, l0.z + (to[5] - l0.z) * e), Ease.inOut);
  }

  // stuck child: the next thing to count hops
  nudgeTarget() { return this.fruits.find((f) => !f.userData.counted && f.userData.tap) || null; }

  get base() { return this.theme.scale; }

  async startRound(r) {
    const R = this.plan[r];
    this.R = R;
    this.n = R.n; this.kind = R.item; this.count = 0;
    this.hogLook = null;
    this.feeding = false;
    // swap the host: the old one settles away slowly (it is not something she made); her counted things are on the shelf
    const old = this.host;
    if (old) this.fadeAway(old.obj, 0.45).then(() => this.root.remove(old.obj));
    this.frameHost(R.host === 'blossom' ? 'tree' : R.host);
    const host = makeHost(R.host === 'blossom' ? 'tree' : R.host, R.host === 'blossom' ? 1 : 0);
    this.host = host;
    this.root.add(host.obj);
    popIn(this.s, host.obj, host.obj.scale.x, 0.6, { sound: false });
    sfx[HOST_SND[R.host]]?.();

    this.fruits = [];
    const slots = host.slots(R.n, R.layout);
    const goldI = R.twist === 'golden' ? Math.floor(Math.random() * R.n) : -1;
    for (let i = 0; i < R.n; i++) {
      const f = makeItem(R.item);
      if (host.decorate) host.decorate(f, i);
      f.position.copy(slots[i]);
      if (host.restY) {
        // treats on a plate / tray / stand sit right on it (no floating, no sinking)
        f.updateMatrixWorld(true);
        const bb = new T.Box3().setFromObject(f);
        f.position.y = host.restY(f.position) + (f.position.y - bb.min.y);
      }
      f.userData.home = f.position.clone();
      f.userData.ph = i * 1.3;
      f.scale.setScalar(0.001);
      this.root.add(f);
      this.fruits.push(f);
      if (R.host === 'balloons') {
        const y = f.position.y;
        f.position.y = -2;
        f.scale.setScalar(1);
        this.s.wait(i * 0.15).then(() => { if (!f.userData.counted) this.s.tween(f.position, { y }, 0.85, Ease.out); });
      } else if (R.host === 'patch') {
        // berries poke up out of the leaves
        const y = f.position.y;
        f.position.y = y - 0.6;
        this.s.wait(0.1 + i * 0.15).then(() => { if (f.userData.counted) return; f.scale.setScalar(1); this.s.tween(f.position, { y }, 0.5, Ease.out); });
      } else this.s.wait(i * 0.1).then(() => popIn(this.s, f, 1, 0.5, { sound: false })).catch(() => {});
      f.userData.tap = input.addTap(f, { radius: 0.85, onTap: () => this.tapFruit(f) });
    }
    if (R.twist === 'ladybug') this.addBug();
    if (R.twist === 'frog') this.addFrog();
    // the golden one: it looks like the others (a gold lump was unreadable) and simply sparkles once at the start
    if (R.twist === 'golden') this.s.wait(0.7).then(() => { const g = this.fruits[goldI]; if (g && !g.userData.counted) { sfx.sparkle(); const stop = fx.halo(g, 0.8); this.s.wait(1.6).then(stop); } });
    // the prompt starts right away; the very first round waits until the fruit is in place for the demo
    if (this.demoDone) { this.cue(); return; }
    await this.wait(0.7 + R.n * 0.15);
    this.cue();
  }

  promptText() {
    if (this.n === 1) return `Tap the ${this.kind}!`;
    return `Count the ${PLURAL[this.kind] || this.kind + 's'}!`;
  }

  addBug() {
    const f = this.fruits[Math.floor(Math.random() * this.fruits.length)];
    const b = makeLadybug();
    const r = f.userData.r || 0.45;
    // on the fruit's upper-front shoulder (it sat on the stalk), twice as big so it reads
    b.position.set(0.2, r * 0.75, r * 0.55);
    b.rotation.set(-0.5, 0.6, 0);
    b.scale.setScalar(1.9);
    f.add(b);
    f.userData.bug = b;
    this.bug = null;
  }

  addFrog() {
    const fr = makeAnimal('frog');
    fr.scale.setScalar(0.6);
    fr.userData.baseScale = 0.6;
    fr.position.set(-2.7, 0, 4.0); // clear of Pip and of the container
    fr.rotation.y = 0.5;
    this.root.add(fr);
    this.frog = fr;
    popIn(this.s, fr, 0.6, 0.4, { sound: false });
    this.s.wait(0.3).then(() => { sfx.ribbit(); hop(this.s, fr, 0.4, 0.5); });
  }

  update(dt, t) {
    // balloons bob, fruit on the tree sways, the ladybug wanders on its fruit
    for (const f of this.fruits) {
      if (f.userData.counted) continue;
      const b = f.userData.balloon;
      if (b) { b.rotation.z = Math.sin(t * 1.6 + f.userData.ph) * 0.12; b.position.y = 1.95 + Math.sin(t * 1.8 + f.userData.ph) * 0.1; }
      else if (this.host?.kind === 'tree') f.rotation.z = Math.sin(t * 2 + f.userData.ph) * 0.06;
      if (f.userData.bug) f.userData.bug.rotation.y = 0.6 + Math.sin(t * 1.5) * 0.8;
    }
    // the eater keeps an eye on the fruit (turns toward what was just tapped, or the next one), but never turns its
    // back or full profile to the child
    const h = this.hog;
    if (!h.userData.eating) {
      const look = this.hogLook || this.fruits.find((f) => !f.userData.counted);
      let ry = HOME_RY;
      if (look === 'child') ry = -0.25;
      else if (look) { look.getWorldPosition(tmp); ry = Math.atan2(tmp.x - h.position.x, tmp.z - h.position.z + 3) * 0.8; }
      ry = T.MathUtils.clamp(ry, -0.9, 0.9);
      h.rotation.y += (ry - h.rotation.y) * Math.min(1, dt * 6);
    }
    if (this.frog && !this.frog.userData.busyAnim) {
      const look = this.hogLook || this.fruits.find((f) => !f.userData.counted);
      if (look && look.isObject3D) { look.getWorldPosition(tmp); const ry = T.MathUtils.clamp(Math.atan2(tmp.x - this.frog.position.x, tmp.z - this.frog.position.z + 3) * 0.7, -0.9, 0.9); this.frog.rotation.y += (ry - this.frog.rotation.y) * Math.min(1, dt * 5); }
    }
  }

  // a numeral over a counted thing: above it, or beside it when "above" would sit under the caption or the frame top
  showNumber(at, text, col, size, r = 0.45) {
    const up = at.clone().add(new T.Vector3(0, r + 0.75, 0));
    const p = project(up);
    const where = p.y < innerHeight * 0.2 ? at.clone().add(new T.Vector3(-(r + 0.65), 0.1, 0.2)) : up;
    fx.float(where, text, { color: col, size });
  }

  async tapFruit(f) {
    if (f.userData.counted || this.busy) return;
    f.userData.counted = true;
    input.remove(f.userData.tap);
    input.lock(650); // one number at a time: a quick double tap never skips a spoken number
    this.clearHints();
    const i = this.count++;
    const last = this.count === this.n;
    // one tap, one number: the number is said every time (she asked for it) and shown over the thing
    this.say(`${WORDS[i]}!`, { repeat: true });
    f.getWorldPosition(tmp);
    this.showNumber(tmp.clone(), String(i + 1), NUM_COL[i], 11, f.userData.r || 0.45);
    this.release(f, i);
    // the eater follows it with its eyes, delighted
    this.hogLook = f;
    if (this.hog.userData.face) { setFace(this.hog.userData.face, 'joy'); this.s.wait(0.35).then(() => { if (this.hog.userData.face && !this.feeding) setFace(this.hog.userData.face, 'happy'); }); }
    hop(this.s, this.hog, 0.12 + i * 0.04, 0.45);
    if (!last) return;

    // last one: the pile jumps once per number (a slow, silent recount with small numerals), then the total is said.
    // The friend (and the basket) can be tapped AT ONCE (rule 0); the round moves on when she has tapped it and the
    // recount has finished jumping.
    this.recountP = this.recount();
    this.feedP = this.awaitFeed();
    this.success(new T.Vector3(BOX.x, 2, BOX.z), '', { payoff: Promise.all([this.recountP, this.feedP]), still: 0 });
  }

  // her tap on the friend or the basket (a slow hand demo the first time; it happens by itself 5 s after the recount)
  awaitFeed() {
    const h = this.hog;
    return new Promise((res) => {
      let done = false;
      const fin = (v) => { if (done) return; done = true; this.endWaiting = false; input.remove(t1); input.remove(t2); stopHalo(); res(v); };
      this.endStep = () => fin(true); this.endWaiting = true; // (autoplay: tools/autoplay.js taps the friend)
      const t1 = input.addTap(h, { radius: 1.3, onTap: () => fin(true) });
      const t2 = input.addTap(this.box.obj, { radius: 1.3, onTap: () => fin(true) });
      const stopHalo = fx.halo(h, 1.1);
      if (!this.feedShown) {
        this.feedShown = true;
        this.s.wait(0.9).then(() => { if (done) return; const hp = h.getWorldPosition(new T.Vector3()); hp.y += 0.9 * this.base; fx.ghostHand(hp); });
      }
      this.recountP.then(() => this.s.wait(5)).then(() => fin(false));
    });
  }

  async recount() {
    const n = this.n;
    await this.wait(0.9); // everything has landed
    for (let k = 0; k < n; k++) {
      if (this.dead) return;
      const q = this.fruits[k];
      if (physics.has(q)) physics.impulse(q, { x: 0, y: 2.0, z: 0 });
      q.getWorldPosition(tmp);
      fx.float(new T.Vector3(BOX.x + (k - (n - 1) / 2) * 0.55, 2.6, BOX.z), String(k + 1), { color: NUM_COL[k], size: 7 });
      await this.wait(0.45);
    }
    if (this.dead) return;
    const total = `${WORDS[n - 1]} ${n === 1 ? this.kind : PLURAL[this.kind] || this.kind + 's'}!`;
    this.say(total, { repeat: true });
    if (this.hog.userData.face) setFace(this.hog.userData.face, 'joy');
  }

  // The round's ending (SATISFACTION 2, her action): the friend looks at the pile, then at her; she taps the friend
  // (or the basket) and it sniffs the pile happily - mmm, a tummy pat - and the pile goes into a little bowl with the
  // round's number, which hops onto the keepsake shelf at the back and stays there for the level.
  async afterSuccess() {
    const tapped = await this.feedP; // (already settled: success() waited for the recount and her tap)
    this.recountP = this.feedP = null;
    if (this.dead) return;
    // The friend sniffs the pile happily (mmm, a joyful face, a tummy wiggle) and the pile goes into its bowl and onto
    // the shelf, all WHILE the next host springs up (nothing here is awaited: she can count again at once).
    const h = this.hog, b = this.base, x0 = HOME.x;
    const list = this.fruits.slice(), n = this.n, kind = this.kind;
    this.feeding = true;
    sfx.mmm();
    if (h.userData.face) setFace(h.userData.face, 'joy');
    this.hogLook = this.box.obj;
    this.s.anim(0.6, (_, p) => { const k = Math.sin(p * Math.PI); h.position.x = x0 - k * 0.35; h.rotation.x = k * 0.18; })
      .then(() => { h.position.x = x0; h.rotation.x = 0; return this.s.anim(0.5, (_, p) => { const k = Math.sin(p * Math.PI * 2) * 0.06 * (1 - p); h.scale.set(b * (1 + k), b * (1 - k), b * (1 + k)); }); })
      .then(() => { h.scale.setScalar(b); if (h.userData.face) setFace(h.userData.face, 'happy'); this.feeding = false; this.hogLook = null; });
    this.toShelf(list, n, kind);
    // the frog visitor walks off now, so it's gone before the next round's things appear where it stood
    if (this.frog) { const fr = this.frog; this.frog = null; this.walkTo(fr, new T.Vector3(-11, 0, fr.position.z), { speed: 2.6, faceCamera: false }).then(() => this.root.remove(fr)); }
    if (this.bug) { this.root.remove(this.bug); this.bug = null; }
    void tapped;
  }

  // the counted pile settles into a little bowl (in counting order) and the bowl hops onto the next shelf spot
  async toShelf(list, n, kind) {
    const bowl = this.makeBowl(n);
    const c = this.box.phys;
    bowl.position.set(BOX.x, c.y + c.h + 0.2, BOX.z);
    this.root.add(bowl);
    const spots = bowlSpots(n);
    const moves = list.map((q, k) => {
      physics.remove(q);
      q.userData.counted = true;
      bowl.userData.inner.attach(q);
      const from = q.position.clone(), q0 = q.quaternion.clone(), s0 = q.scale.x, to = spots[k];
      return this.wait(k * 0.08).then(() => this.s.anim(0.55, (e, p) => {
        q.position.lerpVectors(from, to, e); q.position.y += Math.sin(p * Math.PI) * 0.5;
        q.quaternion.slerpQuaternions(q0, new T.Quaternion(), e);
        q.scale.setScalar(s0 + (0.5 - s0) * e);
      }, Ease.inOut));
    });
    await Promise.all(moves);
    await this.tray.add(bowl, { dur: 1.1, arc: 2.6 }); // a high arc: it clears the host on its way to the shelf
    // a poke on a bowl says its own total again
    this.pokeable(bowl, { fn: () => { input.press(bowl, 140); this.say(`${WORDS[n - 1]} ${n === 1 ? kind : PLURAL[kind] || kind + 's'}!`, { repeat: true }); } });
  }

  makeBowl(n) {
    const g = new T.Group();
    const pm = prop('prop_woodbowl');
    if (pm) {
      pm.updateMatrixWorld(true);
      const bb = new T.Box3().setFromObject(pm), sz = bb.getSize(new T.Vector3());
      const k = 1.15 / Math.max(sz.x, sz.z);
      pm.scale.multiplyScalar(k);
      pm.position.y = -bb.min.y * k;
      g.add(pm);
      g.userData.top = sz.y * k;
    } else {
      const b = mesh(geo.cyl(0.5, 0.36, 0.3, 24, true), 0xc98b4f, { outline: 0.02 });
      b.position.y = 0.15; g.add(b);
      g.userData.top = 0.3;
    }
    const inner = new T.Group();
    inner.position.y = Math.max(0.12, g.userData.top * 0.55);
    g.add(inner);
    g.userData.inner = inner;
    // the round's number on a round tag at the bowl's front
    const tag = numberTag(String(n), NUM_COL[n - 1]);
    tag.position.set(0, 0.2, 0.62);
    g.add(tag);
    return g;
  }

  // How a tapped thing leaves its host, then it is thrown with real physics into the container and piles up.
  // One sound per tap: the pluck on the level's rising notes (a balloon's own pop instead of a note).
  async release(f, i) {
    const s = this.s, kind = this.R.host, R = this.R;
    s.stop(f.position); s.stop(f.scale);
    f.rotation.z = 0;
    f.scale.setScalar(1);
    if (f.userData.bug) this.flyBug(f);
    if (kind === 'balloons' && f.userData.balloon) {
      // pop! the balloon bursts and the fruit drops
      const b = f.userData.balloon;
      sfx.pop();
      await s.anim(0.18, (_, p) => b.scale.setScalar(1 + p * 0.4));
      f.remove(b);
      f.userData.balloon = null;
    } else {
      sfx.step(i, Math.max(3, this.n));
      if (kind === 'bush') {
        wiggle(s, this.host.obj, 0.03, 0.3);
        await s.tween(f.position, { y: f.position.y + 0.6 }, 0.3, Ease.out);
      } else if (kind === 'tree' || kind === 'blossom') {
        // a little pluck: stretch down on its stalk, snap, the branch springs back
        await s.anim(0.25, (_, p) => f.scale.set(1 - p * 0.1, 1 + p * 0.15, 1 - p * 0.1));
        f.scale.setScalar(1);
        wiggle(s, this.host.obj, 0.015, 0.4);
      } else if (kind === 'patch') {
        // pull! it stretches, then pops out of the ground
        await s.anim(0.3, (_, p) => f.scale.set(1 - p * 0.15, 1 + p * 0.3, 1 - p * 0.15));
        f.scale.setScalar(1);
      } else {
        // on a plate / table / stand: a little hop up first
        await s.anim(0.25, (_, p) => { f.position.y = f.userData.home.y + Math.sin(p * Math.PI / 2) * 0.3; });
      }
    }
    if (this.dead) return;
    const c = this.box.phys;
    // things on the ground (patch, blanket, tray) spring straight up first, so the throw comes down over the rim
    if (f.position.y < 1.5) await s.tween(f.position, { y: c.y + c.h + 1.3 }, 0.35, Ease.out);
    if (this.dead) return;
    const target = new T.Vector3(BOX.x + (i - (this.n - 1) / 2) * 0.22 + (Math.random() - 0.5) * 0.15, c.y + c.h + 1.05, BOX.z + (Math.random() - 0.5) * 0.3);
    const bouncy = R.twist === 'bouncy';
    // treats (hull shapes) only spin about their up axis: a cupcake never lands upside-down
    const opts = { ...(f.userData.hull ? { shape: 'hull', rot: [false, true, false] } : { r: f.userData.r || 0.45 }), bounce: bouncy ? 0.62 : 0.3, friction: 0.8, time: bouncy ? 0.75 : 0.65, arc: kind === 'tree' || kind === 'blossom' ? 0.3 : 1.4, maxT: 1.4 };
    await this.throwIn(f, target, opts);
    // the container gives a soft squashy "got it" when it lands (no extra sound)
    s.wait(0.28).then(() => {
      if (this.dead) return;
      const b = this.box.obj;
      s.anim(0.35, (_, p) => { const k = Math.sin(p * Math.PI) * 0.06; b.scale.set(1 + k, 1 - k, 1 + k); }).then(() => b.scale.setScalar(1));
    });
  }

  // Throw f on an arc to a point above the container; over it, f loses its sideways speed and drops straight in.
  // While flying it passes through other flying things (so two quick taps never knock each other out),
  // and anything that still ends up outside hops back in.
  async throwIn(f, target, opts, tries = 2) {
    const s = this.s, c = this.box.phys;
    const fly = (on) => { try { physics.body(f)?.collider(0)?.setCollisionGroups(on ? 0x00020001 : 0xffffffff); } catch (e) { /* older physics */ } };
    const done = physics.toss(f, target, opts);
    fly(true);
    await s.wait(opts.time);
    const body = physics.body(f);
    if (body && !this.dead) { const v = body.linvel(); body.setLinvel({ x: v.x * 0.1, y: -3, z: v.z * 0.1 }, true); }
    s.wait(0.25).then(() => fly(false));
    done.then(() => {
      if (this.dead || !physics.has(f) || tries <= 0) return;
      f.getWorldPosition(tmp);
      if (Math.hypot(tmp.x - BOX.x, tmp.z - BOX.z) > c.r + 0.15) {
        this.throwIn(f, new T.Vector3(BOX.x, c.y + c.h + 1.5, BOX.z), { ...opts, bounce: 0.2, time: 0.6, maxT: 0.9 }, tries - 1);
      }
    });
  }

  flyBug(f) {
    const b = f.userData.bug;
    f.userData.bug = null;
    b.getWorldPosition(tmp);
    const ws = b.getWorldScale(new T.Vector3()).x;
    f.remove(b);
    b.position.copy(tmp);
    b.scale.setScalar(ws);
    this.root.add(b);
    this.bug = b;
    sfx.buzz();
    // it flies off sideways and a little up (never out through the top of the frame, never onto the friend)
    const p0 = tmp.clone(), dir = p0.x > 0 ? -1 : 1, top = Math.min(6, p0.y + 2.2);
    this.s.anim(1.6, (_, p) => {
      b.position.set(p0.x + dir * p * 7, p0.y + (top - p0.y) * Math.sin(p * Math.PI / 2) + Math.sin(p * 12) * 0.2, p0.z - p * 2 + Math.cos(p * 9) * 0.3);
      b.rotation.z = Math.sin(p * 30) * 0.4;
    }).then(() => { if (this.bug === b) { this.root.remove(b); this.bug = null; } });
  }

  showHint(glow = true) {
    const next = this.fruits.find((f) => !f.userData.counted);
    if (!next) return;
    if (glow) this.addHalo(next, 0.85);
    wiggle(this.s, next, 0.4, 0.8);
    // the fingertip rests on the thing's lower edge, so the hand does not cover it
    const p = next.getWorldPosition(new T.Vector3());
    p.y -= (next.userData.r || 0.45) * 0.7;
    fx.ghostHand(p);
  }

  // ---- the ending: the shelf of bowls she filled; each bowl says its own total when poked ----
  creationView() { return this.tray.view(); }
  creationObjects() { return []; } // the bowls are already pokeable (they say their totals)
  onFinale() {
    this.fadeAway(this.box.obj, 0.5); // the empty container and the last host step aside: the photo is the shelf
    if (this.host) this.fadeAway(this.host.obj, 0.5);
    const h = this.hog;
    if (h.userData.face) setFace(h.userData.face, 'joy');
    this.hogLook = this.tray.group;
  }
}

// where n things sit in a bowl (local to the bowl's inner group): a ring, the first in front
function bowlSpots(n) {
  if (n === 1) return [new T.Vector3(0, 0.05, 0)];
  const out = [];
  const r = n <= 3 ? 0.24 : 0.3;
  for (let k = 0; k < n; k++) {
    const a = Math.PI + (k / n) * Math.PI * 2;
    out.push(new T.Vector3(Math.sin(a) * r, 0.05 + (k % 2) * 0.04, -Math.cos(a) * r * 0.7));
  }
  return out;
}

// a round number tag (a canvas sprite that always faces the camera)
const tagCache = {};
function numberTag(text, col) {
  const key = text + col;
  if (!tagCache[key]) {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const x = c.getContext('2d');
    x.fillStyle = '#fff8ec'; x.beginPath(); x.arc(64, 64, 58, 0, Math.PI * 2); x.fill();
    x.lineWidth = 8; x.strokeStyle = '#3a2838'; x.stroke();
    x.fillStyle = col; x.font = 'bold 84px "Baloo 2", "Arial Rounded MT Bold", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(text, 64, 70);
    const tex = new T.CanvasTexture(c);
    tex.userData = { shared: true };
    tagCache[key] = new T.SpriteMaterial({ map: tex, depthWrite: false });
    tagCache[key].userData = { shared: true };
  }
  const sp = new T.Sprite(tagCache[key]);
  sp.scale.setScalar(0.42);
  return sp;
}
