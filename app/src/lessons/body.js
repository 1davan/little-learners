// Game 9 — Touch Bear's nose. Topic mt_83gRQ9OPkc "Body parts & senses".
// A big friendly friend on the beach; the child touches the body part Pip names. Every part reacts when touched, and
// the reaction grows each time that part is touched again. A right touch: she hears the word ("Nose!"), the friend
// touches its own part, and a bit of beach gear for that part waits on the sand: she drags it onto the part herself
// (a tap floats it over). The gear stays, so the friend gets kitted out over the level (sunglasses, sun cream, flowers,
// a lolly, a swim ring, a spade, flippers). Feet kick a beach ball away, hands bat one with the spade.
// When a new friend comes, the old one walks to the back-left (smaller) wearing its gear and stays. The finale frames
// every friend of the level; her taps on ears, tummy and feet play "head, tummy, toes".
// Level 1: Bear on a striped towel under a big umbrella. Level 2: Bunny then Kitty at the paddling pool.
// Level 3: Froggy, Kitty and Bear at the rock pool, with a sense line for eyes, nose, ears and mouth.
//
// Test hooks: busy, part, phase ('touch' | 'gear' | other = busy), touch(part, anchor), putOn(), friends.
import * as T from '../three.js';
import { Lesson } from '../engine/lesson.js';
import { makeAnimal, setFace, hop } from '../engine/actors.js';
import { partAnchors } from '../engine/beach.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';
import { GEAR, makeSet, makeToy } from './body-gear.js';
import { physics } from '../engine/physics.js';
import { project, screenRadius, setCamera, camera } from '../engine/stage.js';
import { blobShadow } from '../engine/toon.js';

const SCALE = 2.15;
const MAX_H = 5.2;                 // tallest a friend may stand (a bunny's or kitty's ears stay clear of the caption)
// where the friend of the round stands (Level 2: a little right, so the sunset sun never sits behind its head)
const HOMES = [new T.Vector3(0.4, 0, 0.6), new T.Vector3(1.4, 0, 0.6), new T.Vector3(0.4, 0, 0.6)];
// the friends still to come wait at the back right, smaller, and walk forward when it is their turn
const WAITS = [[], [new T.Vector3(5.4, 0, -3.0)], [new T.Vector3(5.0, 0, -4.2), new T.Vector3(7.0, 0, -2.4)]];
// the friends already met wait at the back-left, smaller, in their gear (first, second)
// Level 2: Bunny goes paddling in the pool (it walks to the rim and hops in; the water hides its feet);
// Level 3: Froggy and then Kitty stand behind the rock pool
const BACKS = [[], [{ at: new T.Vector3(-3.9, 0.43, -1.7), edge: new T.Vector3(-2.15, 0, -0.8), pool: true }],
  [{ at: new T.Vector3(-4.6, 0, -3.6) }, { at: new T.Vector3(-2.6, 0, -4.6) }]];
const BACK_K = 0.7;
// where the gear waits for her on the sand (right of the friend, clear of the towel, the pool and the rocks)
const GEAR_AT = new T.Vector3(3.2, 0, 2.15);   // open sand at the front right, below the waiting friends
// where a kicked or batted ball comes to rest
// (behind the gear spot, so a ball never hides the gear; clear of the waiting friends, the rocks and the frame edge)
const BALL_REST = [[new T.Vector3(4.55, 0, 0.3), new T.Vector3(4.05, 0, 1.1)], [new T.Vector3(4.55, 0, 0.3), new T.Vector3(4.05, 0, 1.1)],
  [new T.Vector3(4.55, 0, 0.3), new T.Vector3(4.05, 0, 1.1)]];
const PIP_AT = [[-6.4, 0, -2.8], [-5.5, 0, 1.0], [-6.6, 0, -0.2]];
// part name -> anchors it covers, tap radius (world units), the word
const PARTS = {
  nose: { anchors: ['nose'], r: 0.55, word: 'nose' },
  eyes: { anchors: ['eyeL', 'eyeR'], r: 0.5, word: 'eyes' },
  ears: { anchors: ['earL', 'earR'], r: 0.9, word: 'ears' },
  mouth: { anchors: ['mouth'], r: 0.5, word: 'mouth' },
  tummy: { anchors: ['tummy'], r: 1.0, word: 'tummy' },
  hands: { anchors: ['handL', 'handR'], r: 0.85, word: 'hands' },
  feet: { anchors: ['footL', 'footR'], r: 0.85, word: 'feet' },
};
// wrong part: say what she touched, then what to find (two short voiced lines)
const THAT = { nose: "That's the nose!", eyes: 'Those are the eyes!', ears: 'Those are the ears!', mouth: "That's the mouth!", tummy: "That's the tummy!", hands: 'Those are the hands!', feet: 'Those are the feet!' };
const SENSE = { eyes: 'We see with our eyes!', nose: 'We smell with our nose!', ears: 'We hear with our ears!', mouth: 'We eat with our mouth!' };
// the gear step's instruction names the gear AND the part again (she practises the word a second time)
const GEAR_LINE = { eyes: 'Sunglasses on the eyes!', nose: 'Sun cream on the nose!', ears: 'Flowers on the ears!', mouth: 'Lolly for the mouth!', tummy: 'Swim ring on the tummy!', hands: 'Spade in the hands!', feet: 'Flippers on the feet!' };
// [friend, part] per round. Level 1 never asks for the tummy twice (the swim ring would cover it).
const PLANS = [
  { live: ['nose', 'tummy', 'ears', 'feet'], rounds: [['bear', 'nose'], ['bear', 'ears'], ['bear', 'tummy'], ['bear', 'feet'], ['bear', 'nose'], ['bear', 'ears']] },
  { live: Object.keys(PARTS), rounds: [['bunny', 'eyes'], ['bunny', 'hands'], ['bunny', 'mouth'], ['cat', 'ears'], ['cat', 'feet'], ['cat', 'nose']] },
  { live: Object.keys(PARTS), rounds: [['frog', 'eyes'], ['frog', 'mouth'], ['cat', 'nose'], ['cat', 'ears'], ['bear', 'hands'], ['bear', 'feet']], senses: true },
];
const NAME = { bear: 'Bear', bunny: 'Bunny', cat: 'Kitty', frog: 'Froggy' };
const cap = (w) => w[0].toUpperCase() + w.slice(1);
const V = (a) => new T.Vector3(a[0], a[1], a[2]);

export default class BodyLesson extends Lesson {
  build() {
    // closer in: the friend is big, and fits under the caption
    setCamera(new T.Vector3(0, 3.3, 12.6), new T.Vector3(0, 2.3, 0));
    this.pip.position.set(...PIP_AT[this.level]);
    this.pip.rotation.y = 0.45;
    this.fs = SCALE;
    this.cfg = PLANS[this.level];
    this.home = HOMES[this.level];
    this.kind = null;
    this.phase = 'busy';
    this.set = makeSet(this.level);
    this.root.add(this.set);
    for (const d of this.set.userData.statics) {
      if (Array.isArray(d)) { const [x, y, z, sx, sy, sz] = d; physics.box(new T.Vector3(x, y, z), new T.Vector3(sx, sy, sz)); }
      else physics.container(new T.Vector3(...d.cont), { r: d.r, h: d.h });
    }
    // a play-pen for the beach ball: it never rolls up to the camera or off the right edge
    physics.box(new T.Vector3(0, 1, 3.4), new T.Vector3(20, 2, 0.2));
    physics.box(new T.Vector3(7.2, 1, -1), new T.Vector3(0.2, 2, 9));
    physics.box(new T.Vector3(5.05, 1, 1.4), new T.Vector3(0.2, 2, 4.6));   // nearer the camera the frame is narrower
    this.friends = [];      // every friend met this level (the current one last)
    this.balls = [];
    this.gearN = 0;         // gear put on so far (its note climbs the level's tune)
    // the first friend is already standing there when the game opens (she can touch it at once); the others of the
    // level wait at the back right for their turn
    const kinds = [...new Set(this.cfg.rounds.map((r) => r[0]))];
    const first = this.makeFriend(kinds[0]);
    this.groundY = this.standY(this.home);
    first.position.set(this.home.x, this.groundY, this.home.z);
    this.setCurrent(first);
    this.waiting = kinds.slice(1).map((k, i) => {
      const f = this.makeFriend(k), at = WAITS[this.level][i];
      f.position.copy(at);
      f.scale.setScalar(f.userData.fs * BACK_K);
      f.userData.baseScale = f.userData.fs * BACK_K;
      f.rotation.y = -0.3;
      return f;
    });
  }

  // ---------------- the friends ----------------
  makeFriend(kind) {
    const f = makeAnimal(kind);
    f.userData.noLook = true; // tap targets are rest-pose anchors, so the head stays facing the child
    f.updateMatrixWorld(true);
    const h = new T.Box3().setFromObject(f).getSize(new T.Vector3()).y || 2.3;
    const fs = Math.min(SCALE, MAX_H / h);
    f.scale.setScalar(fs);
    f.userData.baseScale = fs;
    f.userData.fs = fs;
    // a soft contact shadow, so pale feet never melt into the sand
    const sh = blobShadow(0.62);
    sh.position.y = 0.015;
    f.add(sh);
    // its body-part points (rest pose, model space) and the gear it has been given
    f.userData.parts = partAnchors(f);
    f.userData.gear = {};
    this.root.add(f);
    return f;
  }
  // this friend is the one being asked about now: its parts take taps
  setCurrent(f) {
    this.friends.push(f);
    this.friend = f;
    this.fs = f.userData.fs;
    this.kind = f.userData.kind;
    this.anchors = f.userData.parts;
    this.gear = f.userData.gear;
    const ud = f.userData;
    this.armHome = (ud.arms || []).map((a) => ({ p: a.position.clone(), r: a.rotation.clone() }));
    this.armRestQ = (ud.arms || []).map((a) => a.quaternion.clone());   // the modelled pose (the hand anchors match it)
    // taps: every part answers (Level 1's non-live parts only react, with no redirect)
    for (const t of this.taps || []) input.remove(t);
    this.taps = [];
    for (const [name, p] of Object.entries(PARTS)) {
      for (const a of p.anchors) this.taps.push(Object.assign(input.addTap(this.anchors[a], { radius: p.r, press: false, onTap: () => this.touch(name, a) }), { part: name }));
    }
  }
  // the top of whatever the friend stands on at p (the Level 1 towel), else the sand
  standY(p) {
    this.set.updateMatrixWorld(true);
    const rc = new T.Raycaster(new T.Vector3(p.x, 2, p.z), new T.Vector3(0, -1, 0));
    const top = rc.intersectObject(this.set, true).find((q) => q.object.material?.side !== T.BackSide && q.point.y < 0.4);
    return top ? top.point.y + 0.01 : 0;
  }
  // a solid core where the friend stands, so the ball bumps into its legs instead of rolling through them
  friendCore() {
    if (this.friendCol) physics.removeStatic(this.friendCol);
    const f = this.friend;
    f.updateMatrixWorld(true);
    const bb = new T.Box3().setFromObject(f);
    const cw = Math.min(2.4, (bb.max.x - bb.min.x) * 0.55), ch = (bb.max.y - bb.min.y) * 0.8;
    this.friendCol = physics.box(new T.Vector3(f.position.x, ch / 2, f.position.z), new T.Vector3(cw, ch, 1.4));
  }

  // The old friend walks to the back-left (smaller, still in its gear) while the next one walks forward from the back
  // right, growing to full size as it comes.
  async swapFriend(kind) {
    const old = this.friend;
    for (const t of this.taps || []) input.remove(t);
    this.taps = [];
    const B = BACKS[this.level], spot = B[Math.min(B.length - 1, this.friends.length - 1)];
    const k0 = old.userData.fs, k1 = k0 * BACK_K, HOME = this.home;
    old.userData.baseScale = k1;
    const walkOld = spot.pool
      ? this.walkTo(old, spot.edge, { speed: 3, faceCamera: false }).then(() => this.hopInto(old, spot.at))
      : this.walkTo(old, spot.at, { speed: 3 });
    this.s.anim(1.4, (e) => { old.scale.setScalar(k0 + (k1 - k0) * e); }, Ease.inOut);
    const i = this.waiting.findIndex((w) => w.userData.kind === kind);
    const f = i >= 0 ? this.waiting.splice(i, 1)[0] : this.makeFriend(kind);
    const n0 = f.scale.x, n1 = f.userData.fs;
    f.userData.baseScale = n1;
    this.s.anim(1.4, (e) => { f.scale.setScalar(n0 + (n1 - n0) * e); }, Ease.inOut);
    f.userData.walking = true;
    const walkNew = this.walkTo(f, new T.Vector3(HOME.x, this.groundY, HOME.z), { speed: 3 });
    // the new friend is the one to touch from the moment it sets off (rule 0: her next answer never waits for the walk)
    this.setCurrent(f);
    await Promise.all([walkOld, walkNew]);
    f.userData.walking = false;
    old.rotation.y = 0.25;
    this.friendCore();
  }
  // a hop over the paddling pool's rim into the water (a splash), then it turns to face the child
  async hopInto(f, to) {
    const a = f.position.clone(), head = Math.atan2(to.x - a.x, to.z - a.z);
    await this.s.tween(f.rotation, { y: head }, 0.2, Ease.inOut);
    await this.s.anim(0.6, (e, p) => { f.position.lerpVectors(a, to, e); f.position.y += Math.sin(p * Math.PI) * 1.2; }, Ease.inOut);
    sfx.splash();
    await this.s.tween(f.rotation, { y: 0.25 }, 0.35, Ease.inOut);
  }

  async startRound(r) {
    this.busy = true;
    this.phase = 'busy';
    const [kind, part] = this.cfg.rounds[r];
    this.part = part;
    for (const t of this.taps || []) t.enabled = true;
    if (kind !== this.kind) await this.swapFriend(kind);   // (normally already done in afterSuccess)
    if (r === 0) this.friendCore();
    setFace(this.friend.userData.face, 'happy');
    this.phase = 'touch';
    this.busy = false;
    if (this.hello !== this.friend) {
      // hello to every new friend, then the instruction (taps are open all the while)
      this.hello = this.friend;
      if (!this.friend.userData.walking) hop(this.s, this.friend, 0.35, 0.5);
      const hi = this.say(`Hello ${NAME[kind]}!`, { voice: true });
      // the intro line may still be playing: wait for it, so the hello is heard before the prompt
      this.alive(hi).then(() => { if (this.phase === 'touch' && this.round === r) this.cue(); });
      return;
    }
    this.cue();
  }

  promptText() {
    if (this.phase === 'gear') return GEAR_LINE[this.part] || '';
    const w = PARTS[this.part]?.word;
    if (!w) return '';
    const who = NAME[this.kind];
    if (this.cfg.senses && SENSE[this.part]) return `${SENSE[this.part]} Touch ${who}'s ${w}!`;
    return `${cap(w)}! Touch ${who}'s ${w}.`;
  }

  wp(a, f = this.friend) { return f.userData.parts[a].getWorldPosition(new T.Vector3()); }

  // ---------------- touching ----------------
  touch(name, a) {
    if (this.busy || this.dead) return;
    this.idle = 0;
    // between answers (the gear is waiting): a touch only makes the part react; touching the gear's own part puts it on
    if (this.phase === 'gear') {
      if (name === this.part) return this.putOn();
      this.react(name, a);
      return;
    }
    if (this.phase !== 'touch') return;
    if (!this.cfg.live.includes(name)) { this.react(name, a); return; }   // Level 1: not asked here, it just reacts
    const ok = name === this.part;
    this.react(name, a, { correct: ok });
    if (!ok) {
      this.redirect('');
      // what she touched, then what to find: both voiced, the second after the first
      const want = `Touch the ${PARTS[this.part].word}!`;
      this.say(THAT[name], { repeat: true }).then(() => { if (!this.dead && this.phase === 'touch') this.say(want, { repeat: true }); });
      return;
    }
    this.rightTouch(name, a);
  }

  async rightTouch(name, a) {
    this.busy = true;
    this.phase = 'busy';
    this.clearHints();
    fx.clearHands();
    this.demoing = false;
    this.hitAnchor = a;
    // the word, at the moment it happens
    this.say(`${cap(PARTS[name].word)}!`, { voice: true, repeat: true });
    this.selfP = this.wait(name === 'hands' ? 0.1 : 0.35).then(() => !this.dead && this.selfTouch(name));
    if (this.gear[name] || !GEAR[name]) {
      // already wearing it (a repeat round): a proud little bounce of the gear is the payoff
      await this.selfP;
      if (this.dead) return;
      this.bounceGear(name);
      this.busy = false;
      this.success(this.wp(a), '', { payoff: this.wait(0.7), still: 0.4 });
      return;
    }
    await this.wait(0.45);
    if (this.dead) return;
    this.offerGear(name);
  }

  // ---------------- the gear: she puts it on ----------------
  // Where a piece of gear ends up: its parent and its world matrix there (friend's rest pose).
  gearPlace(d, f = this.friend) {
    const ud = f.userData, A = ud.parts;
    const parent = { head: ud.head, body: ud.body, handL: ud.arms?.[0], handR: ud.arms?.[1], legL: ud.bones?.legL, legR: ud.bones?.legR }[d.on] || f;
    let pos, span = 0.5;
    if (d.at === 'eyes') { pos = A.eyeL.position.clone().add(A.eyeR.position).multiplyScalar(0.5); span = A.eyeL.position.distanceTo(A.eyeR.position); }
    else pos = A[d.at].position.clone();
    pos.add(V(d.off));
    f.updateMatrixWorld(true);
    const local = new T.Matrix4().compose(pos, new T.Quaternion().setFromEuler(new T.Euler(...(d.rot || [0, 0, 0]))), new T.Vector3(1, 1, 1));
    const world = f.matrixWorld.clone().multiply(local);
    return { parent, world, span };
  }
  offerGear(name) {
    const list = GEAR[name];
    const carrier = new T.Group();
    carrier.userData.noPoke = true;
    const pieces = [];
    list.forEach((d) => {
      const pl = this.gearPlace(d);
      // a tool (the sun cream bottle) is what she carries; it squeezes the real gear on at the part
      const tool = d.tool ? d.tool() : null;
      const g = tool || d.make(pl.span);
      g.userData.noPoke = true;
      g.userData.isTool = !!tool;
      if (!tool) {
        const p = new T.Vector3(), q = new T.Quaternion(), sc = new T.Vector3();
        pl.world.decompose(p, q, sc);
        g.quaternion.copy(q); g.scale.copy(sc);
      }
      carrier.add(g);
      pieces.push({ g, d });
    });
    // lay the pieces side by side on the sand, centred on the carrier
    let x = 0;
    const boxes = pieces.map(({ g }) => { g.updateMatrixWorld(true); return new T.Box3().setFromObject(g); });
    const widths = boxes.map((b) => b.max.x - b.min.x);
    const gap = 0.25, total = widths.reduce((s, w) => s + w, 0) + gap * (pieces.length - 1);
    let h = 0;
    pieces.forEach(({ g }, i) => {
      const b = boxes[i], c = b.getCenter(new T.Vector3());
      g.position.set(-total / 2 + x + widths[i] / 2 - c.x, -b.min.y, -c.z);
      x += widths[i] + gap;
      h = Math.max(h, b.max.y - b.min.y);
    });
    // on the sand to the right, its left edge clear of the friend (the swim ring is wide)
    this.friend.updateMatrixWorld(true);
    const fr = Math.max(this.wp('handR').x, this.wp('footR').x) + 0.3 * this.fs;   // its right side (paw / foot)
    // something wide (the swim ring) waits a little smaller on the sand, and grows to size as it goes on
    // (and a little smaller still if that is what it takes to lie on open sand between the friend and x 4.5)
    const k = Math.max(0.5, Math.min(1, 2.9 / total, (4.5 - (fr + 0.35)) / total));
    carrier.position.copy(GEAR_AT);
    // clear of the friend on its left, and never past x 4.5 on its right (the frame edge, the resting balls)
    carrier.position.x = Math.min(4.5 - (total * k) / 2, Math.max(GEAR_AT.x, fr + 0.35 + (total * k) / 2));
    carrier.userData.h = h * k;
    this.root.add(carrier);
    this.carrier = carrier;
    this.pieces = pieces;
    // it pops onto the sand with a soft sound, then waits
    carrier.scale.setScalar(0.001);
    this.s.anim(0.45, (_, p) => carrier.scale.setScalar(Math.max(0.001, k * Ease.back(p))));
    sfx.pop();
    const home = carrier.position.clone();
    this.carrierHome = home;
    this.gearDrag = input.addDrag(carrier, {
      radius: Math.max(0.7, Math.min(1.3, Math.max(total, h) * k * 0.6)),
      offset: new T.Vector3(0, (h * k) / 2, 0),
      minY: 0,
      autoHome: true,
      zones: () => this.gearZones(),
      onDrop: (zone, info) => {
        if (this.phase !== 'gear') return;
        if (zone || info?.tapped) return this.putOn();
        carrier.position.copy(home);
      },
    });
    this.phase = 'gear';
    this.busy = false;
    this.idle = 0;
    this.ladder = 0;
    this.errorlessOn = false;
    this.say(GEAR_LINE[name], { voice: true });
    // the first time: a slow hand shows the drag on the real things
    if (!this.gearTaught) { this.gearTaught = true; this.s.wait(0.5).then(() => { if (this.phase === 'gear') this.showHint(false); }); }
  }
  gearZones() {
    const f = this.friend, A = PARTS[this.part].anchors;
    const z = A.map((a) => ({ pos: this.wp(a), radius: 1.1 }));
    // anywhere on the friend counts too (it then goes to the right place)
    z.push({ pos: f.position.clone().add(new T.Vector3(0, 1.2 * this.fs, 0.4)), radius: 1.8 * this.fs / SCALE });
    return z;
  }
  // The gear flies onto the part (from wherever she let go) and stays there.
  async putOn() {
    if (this.phase !== 'gear' || this.dead) return;
    this.phase = 'busy';
    this.busy = true;
    this.clearHints();
    fx.clearHands();
    this.demoing = false;
    if (this.gearDrag) { input.remove(this.gearDrag); this.gearDrag = null; }
    const name = this.part, f = this.friend, carrier = this.carrier, pieces = this.pieces;
    await this.selfP;   // the friend's own touch has finished: arms are home
    if (this.dead) return;
    const made = [];
    const fly = pieces.map(({ g, d }, i) => {
      // into world space, then along an arc to its spot (via the mouth for the lolly)
      this.root.attach(g);
      const p0 = g.position.clone();
      const end = () => { const pl = this.gearPlace(d); const p = new T.Vector3(), q = new T.Quaternion(), sc = new T.Vector3(); pl.world.decompose(p, q, sc); return { p, q, sc, pl }; };
      const via = d.via ? this.wp(d.via).add(new T.Vector3(0.05 * this.fs, -0.02 * this.fs, 0.2 * this.fs)) : null;
      if (g.userData.isTool) return this.useTool(g, d, made);
      return this.wait(i * 0.12).then(async () => {
        let e1 = end();
        const leg = (from, to, dur, arc) => {
          const qa = g.quaternion.clone(), sa = g.scale.clone();
          return this.s.anim(dur, (e, p) => {
            const tgt = to === 'end' ? (e1 = end()).p : to;
            g.position.lerpVectors(from, tgt, e);
            g.position.y += Math.sin(p * Math.PI) * arc;
            g.quaternion.slerpQuaternions(qa, e1.q, e);
            g.scale.lerpVectors(sa, e1.sc, e);
          }, Ease.inOut);
        };
        if (via) {
          await leg(p0, via, 0.5, 0.4);
          // a bite
          sfx.chomp();
          const head = f.userData.head;
          if (head) { const x0 = head.rotation.x; await this.s.anim(0.25, (_, p) => { head.rotation.x = x0 + Math.sin(p * Math.PI) * 0.12; }); head.rotation.x = x0; }
          setFace(f.userData.face, 'joy');
          await leg(via.clone(), 'end', 0.4, 0.1);
        } else if (d.under) {
          // the swim ring: it slides along the sand to beside the friend, the friend hops and it slides in under
          // its feet, then it rises round the legs to the waist (never through the body or over the ears)
          const fp = f.position, side = new T.Vector3(fp.x + 3.7, 0.22, fp.z + 0.15), mid = new T.Vector3(fp.x, 0.22, fp.z + 0.15);
          const fin = end();
          const legTo = (from, to, dur, arc) => {
            const qa = g.quaternion.clone(), sa = g.scale.clone();
            return this.s.anim(dur, (e, p) => { g.position.lerpVectors(from, to, e); g.position.y += Math.sin(p * Math.PI) * arc; g.quaternion.slerpQuaternions(qa, fin.q, e); g.scale.lerpVectors(sa, fin.sc, e); }, Ease.inOut);
          };
          await legTo(p0, side, 0.6, 0.3);   // (full size by now, its left edge clear of the friend's feet)
          if (this.dead) return;
          hop(this.s, f, 0.75, 0.8);
          await this.wait(0.1);
          await legTo(side, mid, 0.5, 0);    // under the feet while they are up in the air
          if (this.dead) return;
          await this.wait(0.3);              // landed inside it
          await leg(mid, 'end', 0.5, 0);
        } else await leg(p0, 'end', 0.75, 0.6);
        // settle onto its bone exactly
        e1 = end();
        e1.pl.parent.updateMatrixWorld(true);
        const local = e1.pl.parent.matrixWorld.clone().invert().multiply(e1.pl.world);
        e1.pl.parent.add(g);
        local.decompose(g.position, g.quaternion, g.scale);
        made.push(g);
      });
    });
    sfx.step(this.gearN++, 7, { soft: true });
    await Promise.all(fly);
    if (this.dead) return;
    this.root.remove(carrier);
    this.carrier = null; this.pieces = null;
    this.gear[name] = made;
    // the friend is pleased with it (one small nod, joy face)
    setFace(f.userData.face, 'joy');
    this.s.wait(1.0).then(() => { if (f.userData.face?.userData.emotion === 'joy') setFace(f.userData.face, 'happy'); });
    const head = f.userData.head;
    if (head) { const x0 = head.rotation.x; this.s.anim(0.5, (_, p) => { head.rotation.x = x0 + Math.sin(p * Math.PI) * 0.15; }).then(() => { head.rotation.x = x0; }); }
    this.busy = false;
    const at = this.wp(PARTS[name].anchors[0]);
    // feet kick a ball away, hands bat one with the spade (they practise the part); the rest just admire
    const next = this.cfg.rounds[this.round + 1];
    if (next && next[0] !== this.kind) {
      // the next friend's turn: a short look at the new gear, then the swap is the payoff (rule 0: no extra wait)
      // (the swap starts here; the next round opens about a second later, while the new friend is still walking)
      this.swapP = this.wait(0.4).then(() => !this.dead && this.swapFriend(next[0]));
      this.success(at, '', { payoff: this.wait(0.65), still: 0 });
      return;
    }
    const pay = name === 'feet' ? this.kickBall() : name === 'hands' ? this.batBall() : this.wait(0.6);
    this.success(at, '', { payoff: pay, still: 0.5 });
  }
  // test hook (QA shots): put a part's gear straight on, no flight
  dressNow(name) {
    if (this.gear[name]) return;
    this.gear[name] = GEAR[name].map((d) => {
      const pl = this.gearPlace(d), g = d.make(pl.span);
      pl.parent.updateMatrixWorld(true);
      pl.parent.add(g);
      pl.parent.matrixWorld.clone().invert().multiply(pl.world).decompose(g.position, g.quaternion, g.scale);
      return g;
    });
  }
  // the tool goes to the part, tips and squeezes; the gear appears there (it grows on), and the tool goes back down
  // to the sand and away (it is not hers: only what it put on stays)
  async useTool(t, d, made) {
    const f = this.friend, at = this.wp(d.at);
    const p0 = t.position.clone(), q0 = t.quaternion.clone();
    const to = at.clone().add(new T.Vector3(0.55, 0.12, 0.45 * this.fs));
    const qTip = new T.Quaternion().setFromEuler(new T.Euler(0, 0, 1.25));   // nozzle leaning toward the part
    await this.s.anim(0.75, (e, p) => { t.position.lerpVectors(p0, to, e); t.position.y += Math.sin(p * Math.PI) * 0.6; t.quaternion.slerpQuaternions(q0, qTip, e); }, Ease.inOut);
    if (this.dead) return;
    // the squeeze
    const k = t.scale.clone();
    sfx.squeak();
    await this.s.anim(0.3, (_, p) => { const w = Math.sin(p * Math.PI) * 0.16; t.scale.set(k.x * (1 + w), k.y * (1 - w), k.z * (1 + w)); });
    t.scale.copy(k);
    const pl = this.gearPlace(d), g = d.make(pl.span);
    pl.parent.updateMatrixWorld(true);
    pl.parent.add(g);
    pl.parent.matrixWorld.clone().invert().multiply(pl.world).decompose(g.position, g.quaternion, g.scale);
    const gs = g.scale.clone();
    this.s.anim(0.35, (_, p) => { const e = Math.max(0.001, Ease.back(p)); g.scale.set(gs.x * e, gs.y * e, gs.z * e); });
    made.push(g);
    setFace(f.userData.face, 'joy');
    // back down to the sand, then it goes
    const back = (this.carrierHome || p0).clone().setY(0);
    this.s.anim(0.6, (e, p) => { t.position.lerpVectors(to, back, e); t.position.y += Math.sin(p * Math.PI) * 0.4; t.quaternion.slerpQuaternions(qTip, q0, e); }, Ease.inOut)
      .then(() => this.fadeAway(t, 0.5)).then(() => t.parent?.remove(t));
    await this.wait(0.35);
  }
  bounceGear(name) {
    for (const g of this.gear[name] || []) {
      const k = g.scale.clone();
      this.s.anim(0.6, (_, p) => { const e = 1 + Math.sin(p * Math.PI) * 0.25; g.scale.set(k.x * e, k.y * e, k.z * e); }).then(() => g.scale.copy(k));
    }
    sfx.step(this.gearN, 7, { soft: true });
  }

  // ---------------- the beach ball (feet and hands) ----------------
  newBall() {
    // never more than two balls about: the oldest goes (slowly) when a new one comes
    while (this.balls.length >= 2) { const o = this.balls.shift(); physics.remove(o); this.fadeAway(o, 0.5).then(() => this.root.remove(o)); }
    const b = makeToy('ball');
    b.userData.noPoke = true;
    this.root.add(b);
    this.balls.push(b);
    return b;
  }
  // once it has landed it rolls only a little and stops (sand), so it stays where it came down, in view
  settleBall(b) {
    this.s.wait(0.75).then(() => { const bd = physics.body(b); if (bd) { bd.setLinearDamping(2.2); bd.setAngularDamping(2.2); } });
  }
  restSpot() { const R = BALL_REST[this.level]; return R[(this.ballN = ((this.ballN ?? -1) + 1)) % R.length].clone().setY(0.45); }
  async kickBall() {
    const f = this.friend, legR = f.userData.bones?.legR;
    const foot = this.wp('footR');
    const b = this.newBall();
    b.position.set(6.6, 0.42, foot.z + 0.35);
    // it rolls in along the sand (in front of any ball already resting there) and stops by the right foot
    const to = new T.Vector3(foot.x + 1.05, 0.42, foot.z + 0.35), from = b.position.clone();
    await this.s.anim(0.7, (e) => { b.position.lerpVectors(from, to, e); b.rotation.z = (from.x - b.position.x) / 0.42; }, Ease.out);
    if (this.dead) return;
    // the kick: the right leg swings, thunk, the ball flies to the back right and stays there (tap to bounce it)
    if (legR) { const x0 = legR.rotation.x; this.s.anim(0.45, (_, p) => { legR.rotation.x = x0 - Math.sin(p * Math.PI) * 0.6; }).then(() => { legR.rotation.x = x0; }); }
    await this.wait(0.2);
    sfx.thunk();
    // (the round goes on while it flies; it comes to rest on the sand and stays, tap it to bounce it)
    physics.toss(b, this.restSpot(), { arc: 1.4, maxT: 1.6, r: 0.42, bounce: 0.35, spin: 0.6 });
    this.settleBall(b);
    await this.wait(0.35);
  }
  async batBall() {
    const f = this.friend, arm = f.userData.arms?.[1];
    const hand = this.wp('handR');
    const b = this.newBall();
    b.position.set(6.6, 3.2, hand.z + 0.5);
    // tossed in from the right to the spade...
    const to = hand.clone().add(new T.Vector3(0.9, 0.1, 0.5)), from = b.position.clone();
    await this.s.anim(0.7, (e, p) => { b.position.lerpVectors(from, to, e); b.position.y += Math.sin(p * Math.PI) * 0.8; }, Ease.inOut);
    if (this.dead) return;
    // ...and batted back out to the back right
    if (arm) { const z0 = arm.rotation.z; this.s.anim(0.4, (_, p) => { arm.rotation.z = z0 - Math.sin(p * Math.PI) * 0.5; }).then(() => { arm.rotation.z = z0; }); }
    await this.wait(0.12);
    sfx.tap();
    physics.toss(b, this.restSpot(), { arc: 1.2, maxT: 1.6, r: 0.42, bounce: 0.35, spin: 0.6 });
    this.settleBall(b);
    await this.wait(0.5);
  }

  pokeAt(x, y) {
    if (this.dead) return false;
    // the finale: "head, tummy, toes" on any friend
    if (this.finaleOn && this.pokeParts(x, y)) return true;
    // a ball bounces
    const wp = new T.Vector3();
    for (const t of this.balls) {
      if (!physics.has(t)) continue;
      t.getWorldPosition(wp);
      const c = project(wp);
      if (Math.hypot(c.x - x, c.y - y) < Math.max(screenRadius(wp, 0.55), Math.min(innerWidth, innerHeight) * 0.06)) {
        physics.poke(t, 0.7); sfx.bloop(Math.floor(Math.random() * 4));
        return true;
      }
    }
    // the friend of the round answers only through its parts (a generic poke on top of a part's reaction left arms and
    // head in odd poses); the friends at the back take the normal character poke
    const all = this.chars;
    this.chars = (all || []).filter((c) => c !== this.friend);
    try { return super.pokeAt(x, y); } finally { this.chars = all; }
  }

  // ---------------- reactions ----------------
  // Every part does something when touched, and it gets sillier each time (tier 1 -> 2 -> 3).
  react(name, a, { correct = false, f = this.friend } = {}) {
    const s = this.s, ud = f.userData;
    // fast tapping: while a reaction runs, more taps stay silent (it would capture the head / arm mid-move)
    const now = performance.now() / 1000;
    if (now < (ud.animUntil || 0)) return;
    ud.animUntil = now + 1.0;
    const cnt = ud.count || (ud.count = {});
    const tier = Math.min(3, (cnt[name] = (cnt[name] || 0) + 1));
    const head = ud.head, face = ud.face, body = ud.body;
    const eyes = face?.userData?.eyes || [];
    if (name === 'nose') {
      if (tier === 1) { sfx.squeak(); s.anim(0.35, (_, p) => head?.scale.setScalar(1 + Math.sin(p * Math.PI) * 0.06)); }
      else if (tier === 2) {
        // sniff sniff
        sfx.tick(); s.wait(0.16).then(() => sfx.tick()); s.wait(0.34).then(() => sfx.mmm());
        if (head) s.anim(0.5, (_, p) => { head.rotation.x = -Math.abs(Math.sin(p * Math.PI * 2)) * 0.12; }).then(() => (head.rotation.x = 0));
      } else {
        // ah... ah... choo! (a surprised face only when it was the wrong part)
        sfx.gasp();
        if (face) setFace(face, correct ? 'joy' : 'scared');
        if (head) s.anim(0.7, (_, p) => { head.rotation.x = p < 0.6 ? -Math.sin((p / 0.6) * Math.PI / 2) * 0.3 : -0.3 + Ease.back((p - 0.6) / 0.4) * 0.5 * (1 - (p - 0.6) / 0.4 * 0.4); }).then(() => { head.rotation.x = 0; if (face) setFace(face, 'happy'); });
        s.wait(0.42).then(() => { sfx.whoosh(); ud.kick?.(new T.Vector3(0, 2, -3), 1); });
      }
    } else if (name === 'eyes') {
      const ey = eyes.map((e) => e.scale.y);
      if (tier < 3) {
        sfx.pop(); if (tier === 2) s.wait(0.2).then(() => sfx.pop());
        s.anim(0.2 * tier + 0.15, (_, p) => eyes.forEach((e, i) => { e.scale.y = ey[i] * Math.max(0.1, Math.abs(Math.cos(p * Math.PI * tier))); })).then(() => eyes.forEach((e, i) => (e.scale.y = ey[i])));
      } else {
        // big wow eyes
        sfx.pop();
        const ex = eyes.map((e) => e.scale.x);
        s.anim(0.7, (_, p) => { const k = 1 + Math.sin(p * Math.PI) * 0.5; eyes.forEach((e, i) => { e.scale.x = ex[i] * k; e.scale.y = ey[i] * k; }); }).then(() => eyes.forEach((e, i) => { e.scale.x = ex[i]; e.scale.y = ey[i]; }));
      }
    } else if (name === 'ears') {
      // the ears flick (their springs), the head tilts; never a squash of the head
      sfx.note([5, 7, 9][tier - 1]);
      const side = a === 'earR' ? -1 : 1;
      ud.kick?.(new T.Vector3(side * (2 + tier * 1.5), 2 + tier, 0), 1);
      if (head) { const z0 = head.rotation.z; s.anim(0.5 + tier * 0.1, (_, p) => { head.rotation.z = z0 + Math.sin(p * Math.PI * (tier === 3 ? 2 : 1)) * 0.18 * side; }).then(() => { head.rotation.z = z0; }); }
    } else if (name === 'mouth') {
      if (tier === 1) { sfx.mmm(); if (face) { setFace(face, 'joy'); s.wait(0.6).then(() => setFace(face, 'happy')); } }
      else if (tier === 2) { sfx.chomp(); if (head) s.anim(0.5, (_, p) => { head.rotation.x = Math.abs(Math.sin(p * Math.PI * 2)) * 0.08; }).then(() => (head.rotation.x = 0)); }
      else { sfx.giggle(); if (face) { setFace(face, 'joy'); s.wait(0.8).then(() => setFace(face, 'happy')); } hop(s, f, 0.3, 0.45); }
    } else if (name === 'tummy') {
      const amt = [0, 0.06, 0.09, 0.12][tier];
      sfx.giggle();
      if (body) s.anim(0.4 + tier * 0.1, (_, p) => { body.scale.x = (body.userData.sx0 ??= body.scale.x) * (1 + Math.sin(p * Math.PI * 6) * amt * (1 - p)); }).then(() => (body.scale.x = body.userData.sx0));
      if (tier === 3 && face) { setFace(face, 'joy'); s.wait(0.8).then(() => setFace(face, 'happy')); }
    } else if (name === 'hands') {
      if (correct) { sfx.note(3); return; } // the self-touch clap does the rest
      const arms = ud.arms || [];
      const i = a === 'handL' ? 0 : 1, arm = arms[i];
      // a wave of the touched paw (bigger each time); never the arm holding gear across the face
      if (arm) { sfx.note(2 + tier); const r0 = arm.rotation.z; s.anim(0.6, (_, p) => { arm.rotation.z = r0 + Math.sin(p * Math.PI) * (i ? 1 : -1) * (0.6 + tier * 0.25); }).then(() => (arm.rotation.z = r0)); }
    } else if (name === 'feet') {
      sfx.thunk();
      if (tier === 1) this.stomp(f, 1);
      else this.stomp(f, 2);
    }
  }
  // a stomp: one foot lifts and comes down, then (n = 2) the other
  async stomp(f, n = 2) {
    const b = f.userData.bones || {};
    const legs = [b.legL, b.legR].filter(Boolean);
    if (!legs.length) return hop(this.s, f, 0.25, 0.4);
    for (let i = 0; i < n; i++) {
      const l = legs[i % legs.length], x0 = l.rotation.x;
      await this.s.anim(0.36, (_, p) => { l.rotation.x = x0 - Math.sin(p * Math.PI) * 0.45; });
      l.rotation.x = x0;
      if (i > 0) sfx.thunk();
    }
  }

  // The friend touches its own part with its paws (the confirmation). Feet: it stomps them instead (a bend forward
  // tipped the whole friend and its swim ring into the towel).
  async selfTouch(name, f = this.friend) {
    const s = this.s, ud = f.userData;
    if (name === 'feet') { await this.stomp(f, 2); return; }
    const arms = ud.arms || [];
    if (!arms.length || f !== this.friend) return;
    const home = this.armHome;
    const pt = (a, dx = 0, dy = 0, dz = 0.12) => this.wp(a).add(new T.Vector3(dx * this.fs, dy * this.fs, dz * this.fs));
    // goals sit just in front of / beside the part (the arm swings there). A paw that holds gear stays down.
    const holds = (i) => (i === 0 ? !!this.gear.mouth : !!this.gear.hands);
    let goals;
    // face parts: the paw comes up in front of the cheek on its OWN side (an arm swung across the chest broke the
    // body's ink outline into dark streaks); the head bows to meet it
    if (name === 'nose') goals = [null, pt('nose', 0.3, -0.12, 0.3)];
    else if (name === 'mouth') goals = [pt('mouth', -0.3, -0.02, 0.28), null];
    else if (name === 'eyes') goals = [pt('eyeL', -0.22, -0.12, 0.3), pt('eyeR', 0.22, -0.12, 0.3)];
    else if (name === 'ears') goals = [pt('earL', -0.3, -0.22, 0.25), pt('earR', 0.3, -0.22, 0.25)];
    else if (name === 'tummy') goals = [pt('tummy', -0.3, 0, 0.35), pt('tummy', 0.3, 0, 0.35)];
    else goals = [pt('tummy', -0.12, 0.45, 0.7), pt('tummy', 0.12, 0.45, 0.7)];   // hands: a clap in front
    if (name === 'nose' && holds(1)) goals = [pt('nose', -0.3, -0.12, 0.3), null];
    goals = goals.map((g, i) => (g && holds(i) ? null : g));
    f.updateMatrixWorld(true);
    // Reach by ROTATING each arm about its shoulder so the paw points at the goal (moving the bone stretched the skin),
    // plus at most a small slide when the goal is beyond the paw's reach.
    const reach = goals.map((g, i) => {
      const ar = arms[i];
      if (!g || !ar) return null;
      const hand = this.anchors[i ? 'handR' : 'handL'];
      const q0 = new T.Quaternion().setFromEuler(home[i].r);
      if (!hand) return { q0, q1: q0, p1: ar.parent.worldToLocal(g.clone()) };
      const sh = home[i].p;
      const v0 = ar.parent.worldToLocal(hand.getWorldPosition(new T.Vector3())).sub(sh);
      const v1 = ar.parent.worldToLocal(g.clone()).sub(sh);
      // the swing is clamped (never more than ~70 degrees from the modelled pose, never across the body)
      const qd = new T.Quaternion().setFromUnitVectors(v0.clone().normalize(), v1.clone().normalize());
      const ang = 2 * Math.acos(Math.min(1, Math.abs(qd.w))), MAXA = 2.2;
      if (ang > MAXA) qd.slerp(new T.Quaternion(), 1 - MAXA / ang);
      const q1 = qd.multiply(this.armRestQ[i]);
      const lim = 0.15;
      const slide = Math.max(-lim, Math.min(lim, v1.length() - v0.length()));
      return { q0, q1, p1: sh.clone().add(v1.normalize().multiplyScalar(slide)) };
    });
    if (!reach.some(Boolean)) { hop(s, f, 0.25, 0.4); return; }
    // for the face parts the head bows to meet the paws (short arms never reach a nose on their own)
    const head = ud.head && ud.head !== f ? ud.head : null, hx0 = head ? head.rotation.x : 0;
    const bow = { nose: 0.2, mouth: 0.15, eyes: 0.16 }[name] || 0;
    const pose = (k) => {
      reach.forEach((r, i) => {
        if (!r) return;
        arms[i].quaternion.slerpQuaternions(r.q0, r.q1, k);
        arms[i].position.lerpVectors(home[i].p, r.p1, k);
      });
      if (head && bow) head.rotation.x = hx0 + bow * Math.min(1, k);
      ink.value = inkOff ? Math.min(1, k * 1.5) : 0;
    };
    const ink = this.armInk(f), inkOff = ['nose', 'mouth', 'eyes'].includes(name);   // (a paw at the face)
    const pats = name === 'tummy' || name === 'hands' ? 2 : 1;
    await s.anim(0.6, (e) => pose(e), Ease.inOut);
    for (let k = 0; k < pats; k++) {
      if (name === 'hands') sfx.drumSoft(); else sfx.tap();
      await s.anim(0.3, (_, p) => pose(1 - Math.sin(p * Math.PI) * 0.18));
    }
    await s.wait(0.15);
    await s.anim(0.5, (e) => pose(1 - e), Ease.inOut);
    arms.forEach((ar, i) => { if (reach[i]) { ar.position.copy(home[i].p); ar.rotation.copy(home[i].r); } });
    if (head && bow) head.rotation.x = hx0;
    ink.value = 0;
  }

  // While a paw is raised the arm's ink outline (a pushed-out back-face copy of the skin) folds into the torso and
  // shows as dark streaks down the body. Each friend's outline gets its own material whose push shrinks to almost
  // nothing on the arm-weighted skin while the reach is on (uniform 0..1); the rest of the outline is unchanged.
  armInk(f) {
    if (f.userData.armInk) return f.userData.armInk;
    const k = { value: 0 };
    f.userData.armInk = k;
    const arms = f.userData.arms || [];
    f.traverse((o) => {
      if (!o.isSkinnedMesh || !o.userData.outline || !o.skeleton) return;
      const key = o.material?.customProgramCacheKey?.() || '';
      const th = /outline/.test(key) ? parseFloat((key.match(/([\d.]+)$/) || [])[1]) : NaN;   // 'skin-outline0.032'
      if (!(th > 0)) return;
      const ia = o.skeleton.bones.indexOf(arms[0]), ib = o.skeleton.bones.indexOf(arms[1]);
      if (ia < 0 && ib < 0) return;
      const m = new T.MeshBasicMaterial({ color: o.material.color, side: T.BackSide });
      m.onBeforeCompile = (sh) => {
        sh.uniforms.uInkK = k; sh.uniforms.uArmA = { value: ia }; sh.uniforms.uArmB = { value: ib };
        sh.vertexShader = 'uniform float uInkK;\nuniform float uArmA;\nuniform float uArmB;\n' + sh.vertexShader.replace('#include <begin_vertex>',
          `float wa = 0.0;
          for (int i = 0; i < 4; i++) { float si = skinIndex[i]; if (abs(si - uArmA) < 0.5 || abs(si - uArmB) < 0.5) wa += skinWeight[i]; }
          vec3 transformed = position + normal * ${th.toFixed(4)} * (1.0 - 1.2 * uInkK * clamp(wa * 3.0, 0.0, 1.0));`);
      };
      m.customProgramCacheKey = () => 'armink' + th;
      o.material = m;
    });
    return k;
  }

  async afterSuccess() {
    // lay out the next round while this one settles: a new friend walks in now
    this.swapP = null;
    const next = this.cfg.rounds[this.round];
    if (next && next[0] !== this.kind) await this.swapFriend(next[0]);
  }

  // ---------------- hints ----------------
  targetAnchor() { return this.anchors[PARTS[this.part].anchors[0]]; }
  nudgeTarget() { return this.anchors && !this.busy ? this.targetAnchor() : null; }
  // a stuck child: a halo rings the part (the anchors are invisible, so a hop showed nothing); in the gear step the
  // gear gives a slow bob
  nudge(step) {
    if (this.phase === 'gear' && this.carrier) {
      const c = this.carrier, y0 = c.position.y;
      if (!c.userData.dragging) this.s.anim(0.6, (_, p) => { c.position.y = y0 + Math.sin(p * Math.PI) * 0.3; }).then(() => { if (!c.userData.dragging) c.position.y = y0; });
      if (step >= 2) { const stop = fx.halo(this.targetAnchor(), PARTS[this.part].r * this.fs * 0.5 + 0.3); this.s.wait(3).then(stop); }
      return;
    }
    const a = this.nudgeTarget();
    if (!a) return super.nudge(step);
    const stop = fx.halo(a, PARTS[this.part].r * this.fs * 0.5 + 0.3);
    this.s.wait(step >= 2 ? 3 : 1.6).then(stop);
  }
  showHint(glow = true) {
    if (!this.anchors) return;
    const a = this.targetAnchor();
    if (this.phase === 'gear' && this.carrier) {
      // the hand picks up the gear and carries it to the part
      const from = this.carrier.position.clone().add(new T.Vector3(0, (this.carrier.userData.h || 0.4) / 2, 0));
      fx.ghostPath([from, a.getWorldPosition(new T.Vector3())], { mode: 'drag', maxDur: 2.6 });
      return;
    }
    if (glow) this.addHalo(a, PARTS[this.part].r * this.fs * 0.5 + 0.3);
    fx.ghostPath([a.getWorldPosition(new T.Vector3())], { mode: 'tap' });
  }
  // Level 3 uses the same demo as Level 1 (the hand taps the part once): a scan over three parts was copied as
  // "tap the first one"
  demoL3() { this.showHint(false); }
  makeErrorless() {
    // stuck on the gear for 20 s: it floats on by itself
    if (this.phase === 'gear') { this.putOn(); return; }
    for (const t of this.taps) if (t.part !== this.part) t.enabled = false;
  }

  // ---------------- finale: every friend of the level, in their gear ----------------
  creationView() {
    const box = new T.Box3();
    for (const f of this.friends) box.expandByObject(f);
    const c = box.getCenter(new T.Vector3()), sz = box.getSize(new T.Vector3());
    // fit the friends' box (with a margin, and room for the caption) in the camera's view
    const vf = Math.tan((camera.fov * Math.PI) / 360);
    const dH = (sz.y * 0.5 + 0.9) / vf, dW = (sz.x * 0.5 + 1.0) / (vf * camera.aspect);
    const d = Math.max(9, dH, dW) + box.max.z - c.z;
    const look = new T.Vector3(c.x, c.y + 0.35, c.z);
    return { pos: new T.Vector3(c.x, look.y + d * 0.12, c.z + d), look };
  }
  creationObjects() { return this.friends.slice(); }
  onFinale() {
    // answers are over: all part taps go, and her taps on ears, tummy and feet (any friend) play "head, tummy, toes"
    for (const t of this.taps || []) input.remove(t);
    this.taps = [];
    this.finaleOn = true;
    for (const f of this.friends) setFace(f.userData.face, 'happy');
    this.admireTime = 6;
    // the engine locks input for the whole finale; pokes must still reach the friends' parts
    this.s.wait(0.1).then(() => { if (!this.dead) { input.unlock(); input.setReady(null); } });
  }
  // tap on a part of any friend during the finale: ears (head), tummy, feet, each with its note
  pokeParts(x, y) {
    let best = null, bd = Infinity;
    for (const f of this.friends) {
      const k = f.scale.x;
      for (const name of ['ears', 'tummy', 'feet', 'nose', 'eyes', 'mouth', 'hands']) {
        for (const a of PARTS[name].anchors) {
          const p = this.wp(a, f), c = project(p);
          const r = Math.max(screenRadius(p, PARTS[name].r * k * 0.45), Math.min(innerWidth, innerHeight) * 0.04);
          const d = Math.hypot(c.x - x, c.y - y) / r;
          if (d < 1 && d < bd) { bd = d; best = { f, name, a }; }
        }
      }
    }
    if (!best) return false;
    const { f, name, a } = best;
    const ud = f.userData;
    if (performance.now() / 1000 < (ud.animUntil || 0)) return true;
    ud.count = {};   // keep it to the small, friendly reaction
    this.react(name, a, { f, correct: true });
    return true;
  }
}
