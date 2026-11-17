// Game 9 — Touch Bear's nose. Topic mt_83gRQ9OPkc "Body parts & senses".
// A big friendly bear in swim shorts; the child touches the body part Pip names. Every part reacts when touched,
// and the reaction gets bigger each time that part is touched again. After a right answer Bear touches its own part
// (boop!) and gets a bit of beach gear on it: sunglasses, a flower, a swim ring, flippers…
// Each level has its own friends and beach spot (Level 1: Bear on a towel under the umbrella; Level 2: Bunny and Kitty
// at the paddling pool; Level 3: Froggy, Kitty and Bear at the rock pool), and every right answer brings a shower of
// beach toys that bounce and roll with real physics (feet kick a ball away, hands bat one back). Tap a toy to bounce it.
import * as T from '../three.js';
import { Lesson } from '../engine/lesson.js';
import { makeAnimal, setFace, popIn, popOut, hop, wiggle } from '../engine/actors.js';
import { partAnchors } from '../engine/beach.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';
import { GEAR, makeSet, makeToy } from './body-gear.js';
import { physics } from '../engine/physics.js';
import { project, screenRadius, setCamera } from '../engine/stage.js';

const SCALE = 2.15;
const MAX_H = 5.5;                 // tallest a friend may stand (a bunny's ears stay below the caption)
// part name → anchors it covers, tap radius (world units), what Pip calls it
const PARTS = {
  nose: { anchors: ['nose'], r: 0.55, word: 'nose' },
  eyes: { anchors: ['eyeL', 'eyeR'], r: 0.5, word: 'eyes' },
  ears: { anchors: ['earL', 'earR'], r: 0.9, word: 'ears' },
  mouth: { anchors: ['mouth'], r: 0.5, word: 'mouth' },
  tummy: { anchors: ['tummy'], r: 1.0, word: 'tummy' },
  hands: { anchors: ['handL', 'handR'], r: 0.85, word: 'hands' },
  feet: { anchors: ['footL', 'footR'], r: 0.85, word: 'feet' },
};
const SENSE = { eyes: 'We see with our eyes!', nose: 'We smell with our nose!', ears: 'We hear with our ears!', mouth: 'We eat with our mouth!' };
// [friend, part] per round
// toys: what showers down after each right answer (a different one every round)
const PLANS = [
  { live: ['nose', 'tummy', 'ears', 'feet'], rounds: [['bear', 'nose'], ['bear', 'tummy'], ['bear', 'ears'], ['bear', 'feet'], ['bear', 'nose'], ['bear', 'tummy']],
    toys: ['flower', 'ball', 'shell', 'ball', 'star', 'duck'] },
  { live: Object.keys(PARTS), rounds: [['bunny', 'eyes'], ['bunny', 'hands'], ['bunny', 'mouth'], ['cat', 'ears'], ['cat', 'feet'], ['cat', 'nose']],
    toys: ['star', 'ball', 'duck', 'shell', 'ball', 'flower'] },
  { live: Object.keys(PARTS), rounds: [['frog', 'eyes'], ['frog', 'mouth'], ['cat', 'nose'], ['cat', 'ears'], ['bear', 'hands'], ['bear', 'feet']], senses: true,
    toys: ['star', 'spade', 'flower', 'duck', 'ball', 'ball'] },
];
const NAME = { bear: 'Bear', bunny: 'Bunny', cat: 'Kitty', frog: 'Froggy' };
const cap = (w) => w[0].toUpperCase() + w.slice(1);

export default class BodyLesson extends Lesson {
  build() {
    // closer in: the friend is big, and fits under the caption
    setCamera(new T.Vector3(0, 3.3, 12.6), new T.Vector3(0, 2.3, 0));
    this.pip.position.set(-6.4, 0, -2.8);
    this.fs = SCALE;
    this.cfg = PLANS[this.level];
    this.kind = null;
    this.set = makeSet(this.level);
    this.root.add(this.set);
    for (const d of this.set.userData.statics) {
      if (Array.isArray(d)) { const [x, y, z, sx, sy, sz] = d; physics.box(new T.Vector3(x, y, z), new T.Vector3(sx, sy, sz)); }
      else physics.container(new T.Vector3(...d.cont), { r: d.r, h: d.h });
    }
    this.toys = [];
  }

  // ---- physics toys ----
  toss(kind, from, to, { delay = 0, time = 0.5, arc = 1.5 } = {}) {
    const t = makeToy(kind);
    t.position.copy(from);
    t.visible = false;
    this.root.add(t);
    this.toys.push(t);
    const go = this.s.wait(delay).then(() => {
      if (!t.parent) return;
      t.visible = true;
      const p = physics.toss(t, to, { time, arc, shape: t.userData.shape, r: t.userData.r ?? undefined, bounce: kind === 'ball' ? 0.7 : 0.4 });
      if (kind !== 'ball') physics.body(t)?.setAngularDamping(4); // shells and apples settle where they land instead of rolling off
      return p;
    });
    return { t, go };
  }
  clearToys(keep = 6) {
    // the oldest toys pop away so the beach never gets too cluttered
    while (this.toys.length > keep) { const t = this.toys.shift(); physics.remove(t); popOut(this.s, t, 0.2).then(() => this.root.remove(t)); }
  }
  // After a right answer: a little shower of this round's toy lands beside the friend; feet kick a ball, hands bat one.
  toyShower(part) {
    const kind = this.cfg.toys[this.round - 1] || 'shell'; // success() has already moved the round on
    const s = this.s;
    if (part === 'feet') {
      const foot = this.wp('footR');
      const { t, go } = this.toss('ball', new T.Vector3(7, 4, 2), new T.Vector3(foot.x + 0.7, 0.45, foot.z + 0.4), { time: 0.4, arc: 1 });
      go.then(() => s.wait(0.05)).then(() => { sfx.boing(); physics.impulse(t, { x: 7, y: 7, z: -1 }, { x: 0, y: 0, z: -3 }); });
      return;
    }
    if (part === 'hands') {
      const hand = this.wp('handR');
      const { t } = this.toss('ball', new T.Vector3(7, 3, 1.5), hand.clone().add(new T.Vector3(0.2, 0, 0.5)), { time: 0.38, arc: 1 });
      s.wait(0.4).then(() => { if (physics.has(t)) { sfx.boing(); physics.impulse(t, { x: 4, y: 6, z: 0.5 }, { x: 0, y: 0, z: 2 }); } });
      return;
    }
    const n = kind === 'ball' ? 2 : 5;
    for (let i = 0; i < n; i++) {
      const side = i % 2 ? 1 : -1;
      const to = new T.Vector3(0.4 + side * (2.4 + Math.random() * 1.6), 0.3, 0.4 + Math.random() * 1.0);
      this.toss(kind, new T.Vector3(to.x + side * 1.5, 9, to.z - 1), to, { delay: i * 0.06, time: 0.45, arc: 0.5 });
    }
    s.wait(0.5).then(() => sfx.bloop(2));
  }
  pokeAt(x, y) {
    // the friend only reacts through its body parts: a generic poke (squash, arm wave, nap…) on top of a part's
    // reaction or the self-touch left arms and head in odd poses, and a napping friend can't play
    const all = this.chars;
    this.chars = (all || []).filter((c) => c !== this.friend);
    let hit;
    try { hit = super.pokeAt(x, y); } finally { this.chars = all; }
    if (hit) return true;
    const wp = new T.Vector3();
    for (const t of this.toys) {
      if (!physics.has(t)) continue;
      t.getWorldPosition(wp);
      const c = project(wp);
      if (Math.hypot(c.x - x, c.y - y) < Math.max(screenRadius(wp, 0.5), Math.min(innerWidth, innerHeight) * 0.06)) {
        physics.poke(t, 1); t.userData.toy === 'ball' ? sfx.boing() : sfx.bloop(Math.floor(Math.random() * 4));
        return true;
      }
    }
    return false;
  }

  spawnFriend(kind) {
    if (this.friend) this.root.remove(this.friend);
    for (const t of this.taps || []) input.remove(t);
    const f = makeAnimal(kind);
    f.userData.noLook = true; // tap targets are rest-pose anchors, so the head stays facing the child
    f.position.set(0.4, 0, 0.6);
    f.updateMatrixWorld(true);
    const h = new T.Box3().setFromObject(f).getSize(new T.Vector3()).y || 2.3;
    this.fs = Math.min(SCALE, MAX_H / h);
    f.scale.setScalar(this.fs);
    f.userData.baseScale = this.fs;
    this.root.add(f);
    this.friend = f;
    this.kind = kind;
    this.anchors = partAnchors(f);
    this.count = {};
    this.gear = {};
    const ud = f.userData;
    this.armHome = (ud.arms || []).map((a) => ({ p: a.position.clone(), r: a.rotation.clone() }));
    this.armRestQ = (ud.arms || []).map((a) => a.quaternion.clone());   // the modelled pose (the hand anchors match it)
    this.taps = [];
    for (const name of this.cfg.live) {
      const p = PARTS[name];
      for (const a of p.anchors) this.taps.push(Object.assign(input.addTap(this.anchors[a], { radius: p.r, onTap: () => this.touch(name, a) }), { part: name }));
    }
    return f;
  }

  async startRound(r) {
    this.busy = true;
    const [kind, part] = this.cfg.rounds[r];
    this.part = part;
    for (const t of this.taps || []) t.enabled = true;
    if (kind !== this.kind) {
      if (this.friend) { sfx.whoosh(); await this.s.tween(this.friend.scale, { x: 0.001, y: 0.001, z: 0.001 }, 0.22, Ease.in); }
      const f = this.spawnFriend(kind);
      await popIn(this.s, f, this.fs, 0.2);
      if (r > 0) { hop(this.s, f, 0.5, 0.35, { sound: true }); await this.say(`Hello ${NAME[kind]}!`, { max: 0.6 }); }
    }
    setFace(this.friend.userData.face, 'happy');
    this.busy = false;
    this.cue();
  }

  promptText() {
    const w = PARTS[this.part]?.word;
    if (!w) return '';
    const who = NAME[this.kind];
    if (this.cfg.senses && SENSE[this.part]) return `${SENSE[this.part]} Touch ${who}'s ${w}!`;
    return `${cap(w)}! Touch ${who}'s ${w}.`;
  }

  wp(a) { return this.anchors[a].getWorldPosition(new T.Vector3()); }

  // Every part does something fun when touched, and it gets sillier each time (tier 1 → 2 → 3).
  react(name, a, { correct = false } = {}) {
    const f = this.friend, s = this.s, ud = f.userData;
    // Fast tapping: a reaction that starts while another still runs would capture the head / arm mid-move and
    // "restore" it there (head left crooked, arm stuck up). While one runs, a tap just squeaks and sparkles.
    const now = performance.now() / 1000;
    if (now < (this.animUntil || 0)) {
      sfx.bloop(Math.floor(Math.random() * 4));
      fx.float(this.wp(a).add(new T.Vector3(0, 0.4, 0.3)), '✨', { color: '#ffb020', size: 4 });
      if (!correct) return;
      this.count[name] = (this.count[name] || 0) + 1;
      return;
    }
    this.animUntil = now + 0.8;
    const tier = Math.min(3, (this.count[name] = (this.count[name] || 0) + 1));
    const head = ud.head, face = ud.face, body = ud.body;
    const eyes = face?.userData?.eyes || [];
    const above = (a2, dy = 0.5) => this.wp(a2).add(new T.Vector3(0, dy, 0.3));
    if (name === 'nose') {
      if (tier === 1) { sfx.squeak(); s.anim(0.35, (_, p) => head?.scale.setScalar(1 + Math.sin(p * Math.PI) * 0.08)); }
      else if (tier === 2) {
        // sniff sniff
        sfx.tick(); s.wait(0.16).then(() => sfx.tick()); s.wait(0.34).then(() => sfx.mmm());
        if (head) s.anim(0.5, (_, p) => { head.rotation.x = -Math.abs(Math.sin(p * Math.PI * 2)) * 0.15; }).then(() => (head.rotation.x = 0));
      } else {
        // ah… ah… CHOO!
        sfx.gasp();
        if (face) setFace(face, 'scared');
        if (head) s.anim(0.7, (_, p) => { head.rotation.x = p < 0.6 ? -Math.sin((p / 0.6) * Math.PI / 2) * 0.35 : -0.35 + Ease.back((p - 0.6) / 0.4) * 0.6 * (1 - (p - 0.6) / 0.4 * 0.4); }).then(() => { head.rotation.x = 0; if (face) setFace(face, 'happy'); });
        s.wait(0.42).then(() => { sfx.pop(); sfx.whoosh(); fx.float(above('nose', 0.2), '💦', { size: 7 }); wiggle(s, f, 0.12, 0.3); });
      }
    } else if (name === 'eyes') {
      const ey = eyes.map((e) => e.scale.y);
      if (tier < 3) {
        sfx.pop(); if (tier === 2) s.wait(0.2).then(() => sfx.pop());
        s.anim(0.2 * tier + 0.15, (_, p) => eyes.forEach((e, i) => { e.scale.y = ey[i] * Math.max(0.1, Math.abs(Math.cos(p * Math.PI * tier))); })).then(() => eyes.forEach((e, i) => (e.scale.y = ey[i])));
      } else {
        // big wow eyes
        sfx.twinkle();
        const ex = eyes.map((e) => e.scale.x);
        s.anim(0.7, (_, p) => { const k = 1 + Math.sin(p * Math.PI) * 0.7; eyes.forEach((e, i) => { e.scale.x = ex[i] * k; e.scale.y = ey[i] * k; }); }).then(() => eyes.forEach((e, i) => { e.scale.x = ex[i]; e.scale.y = ey[i]; }));
        fx.float(above('eyeR'), '✨', { color: '#ffb020', size: 6 });
      }
    } else if (name === 'ears') {
      if (tier === 1) { sfx.note(5); if (head) wiggle(s, head, 0.2, 0.5); }
      else if (tier === 2) { sfx.highBoing(); if (head) wiggle(s, head, 0.4, 0.6); fx.float(above(a), '♪', { color: '#a77bff', size: 6 }); }
      else { sfx.boing(); if (head) s.anim(0.6, (e) => { head.rotation.y = e * Math.PI * 2; }, Ease.inOut).then(() => (head.rotation.y = 0)); fx.float(above(a), '♫', { color: '#a77bff', size: 7 }); }
    } else if (name === 'mouth') {
      if (tier === 1) { sfx.mmm(); if (face) { setFace(face, 'scared'); s.wait(0.5).then(() => setFace(face, 'happy')); } }
      else if (tier === 2) { sfx.chomp(); if (head) s.anim(0.5, (_, p) => { head.scale.y = 1 - Math.abs(Math.sin(p * Math.PI * 2)) * 0.1; }).then(() => (head.scale.y = 1)); }
      else { sfx.giggle(); s.wait(0.3).then(() => sfx.giggle()); hop(s, f, 0.4, 0.35); if (head) wiggle(s, head, 0.3, 0.7); fx.float(above('mouth'), '😄', { size: 6 }); }
    } else if (name === 'tummy') {
      const amt = [0, 0.06, 0.1, 0.14][tier];
      sfx.giggle();
      if (body) s.anim(0.4 + tier * 0.1, (_, p) => { body.scale.x = (body.userData.sx0 ??= body.scale.x) * (1 + Math.sin(p * Math.PI * 6) * amt * (1 - p)); }).then(() => (body.scale.x = body.userData.sx0));
      if (tier >= 2) wiggle(s, f, 0.1 * tier, 0.6);
      if (tier === 3) { s.wait(0.3).then(() => sfx.giggle()); fx.float(above('tummy'), '♥', { color: '#ff5a8a', size: 7 }); }
    } else if (name === 'hands') {
      if (correct) { sfx.note(3); return; } // the self-touch clap does the rest
      const arms = ud.arms || [];
      const arm = arms[a === 'handL' ? 0 : 1];
      if (tier === 1 && arm) { sfx.note(3); const r0 = arm.rotation.z; s.anim(0.6, (_, p) => { arm.rotation.z = r0 + Math.sin(p * Math.PI) * (a === 'handL' ? -1.4 : 1.4); }).then(() => (arm.rotation.z = r0)); }
      else if (tier === 2) { this.selfTouch('hands'); }
      else { sfx.sparkle(); arms.forEach((ar, i) => { const r0 = ar.rotation.z; s.anim(0.7, (_, p) => { ar.rotation.z = r0 + Math.sin(p * Math.PI) * (i ? 2.2 : -2.2); }).then(() => (ar.rotation.z = r0)); }); hop(s, f, 0.6, 0.45, { sound: true }); }
    } else if (name === 'feet') {
      if (tier === 1) { sfx.lowBoing(); hop(s, f, 0.3, 0.3); }
      else if (tier === 2) { sfx.thunk(); hop(s, f, 0.2, 0.22).then(() => { sfx.thunk(); hop(s, f, 0.2, 0.22); }); }
      else {
        sfx.boing();
        hop(s, f, 0.9, 0.6, { sound: true });
        const r0 = f.rotation.y;
        s.anim(0.5, (e) => { f.rotation.y = r0 + e * Math.PI * 2; }, Ease.inOut).then(() => (f.rotation.y = r0));
      }
    }
  }

  // Bear touches its own part with its paws: boop!
  async selfTouch(name) {
    const f = this.friend, s = this.s, ud = f.userData;
    const arms = ud.arms || [];
    if (!arms.length) return;
    const home = this.armHome;
    // which paw goes where (world points), per part
    const pt = (a, dx = 0, dy = 0, dz = 0.12) => this.wp(a).add(new T.Vector3(dx * this.fs, dy * this.fs, dz * this.fs));
    let goals;
    // (goals sit just in front of / beside the part: the arm swings there, so a goal on the surface buried the paw)
    if (name === 'nose') goals = [null, pt('nose', 0.1, -0.05, 0.3)];
    else if (name === 'mouth') goals = [null, pt('mouth', 0.12, -0.05, 0.3)];
    else if (name === 'eyes') goals = [pt('eyeL', -0.05, -0.04, 0.35), pt('eyeR', 0.05, -0.04, 0.35)];
    else if (name === 'ears') goals = [pt('earL', -0.3, -0.22, 0.25), pt('earR', 0.3, -0.22, 0.25)];
    else if (name === 'tummy') goals = [pt('tummy', -0.3, 0, 0.35), pt('tummy', 0.3, 0, 0.35)];
    else if (name === 'hands') goals = [pt('tummy', -0.12, 0.45, 0.7), pt('tummy', 0.12, 0.45, 0.7)];
    else goals = [pt('footL', 0, 0.25, 0.1), pt('footR', 0, 0.25, 0.1)];
    // Reach by ROTATING each arm about its shoulder so the paw points at the goal (moving the bone instead stretched
    // the skin into wide blobs), plus at most a small slide when the goal is beyond the paw's reach.
    f.updateMatrixWorld(true);
    const reach = goals.map((g, i) => {
      const ar = arms[i];
      if (!g || !ar) return null;
      const hand = this.anchors[i ? 'handR' : 'handL'];
      const q0 = new T.Quaternion().setFromEuler(home[i].r);
      if (!hand) return { q0, q1: q0, p1: ar.parent.worldToLocal(g.clone()) };
      const sh = home[i].p;
      const v0 = ar.parent.worldToLocal(hand.getWorldPosition(new T.Vector3())).sub(sh);
      const v1 = ar.parent.worldToLocal(g.clone()).sub(sh);
      const q1 = new T.Quaternion().setFromUnitVectors(v0.clone().normalize(), v1.clone().normalize()).multiply(this.armRestQ[i]);
      const slide = Math.max(-0.15, Math.min(0.15, v1.length() - v0.length()));
      return { q0, q1, p1: sh.clone().add(v1.normalize().multiplyScalar(slide)) };
    });
    const pose = (k) => reach.forEach((r, i) => {
      if (!r) return;
      arms[i].quaternion.slerpQuaternions(r.q0, r.q1, k);
      arms[i].position.lerpVectors(home[i].p, r.p1, k);
    });
    const bend = name === 'feet';
    const pats = name === 'tummy' || name === 'hands' ? 2 : 1;
    if (bend) s.tween(f.rotation, { x: 0.35 }, 0.2, Ease.out);
    await s.anim(0.2, (e) => pose(e), Ease.out);
    for (let k = 0; k < pats; k++) {
      if (name === 'hands') sfx.drumSoft(); else sfx.tap();
      if (name === 'nose' || name === 'mouth') sfx.squeak();
      // little squish on contact
      await s.anim(0.14, (_, p) => pose(1 - Math.sin(p * Math.PI) * 0.18));
    }
    if (name === 'eyes') { sfx.pop(); fx.float(this.wp('eyeR').add(new T.Vector3(0.5, 0.6, 0.5)), '👀', { size: 5 }); } // peekaboo!
    if (bend) s.tween(f.rotation, { x: 0 }, 0.2, Ease.out);
    await s.anim(0.2, (e) => pose(1 - e), Ease.inOut);
    arms.forEach((ar, i) => { ar.position.copy(home[i].p); ar.rotation.copy(home[i].r); });
  }

  // Pop a bit of beach gear onto the part (it stays for the rest of the game)
  addGear(name) {
    const f = this.friend, ud = f.userData, s = this.s;
    const list = GEAR[name];
    if (!list) return;
    if (this.gear[name]) {
      // already wearing it: give it a proud bounce
      sfx.twinkle();
      for (const g of this.gear[name]) { const k = g.scale.x; s.anim(0.35, (_, p) => g.scale.setScalar(k * (1 + Math.sin(p * Math.PI) * 0.4))).then(() => g.scale.setScalar(k)); }
      return;
    }
    f.updateMatrixWorld(true);
    const made = [];
    for (const d of list) {
      let pos, span = 0.5;
      if (d.at === 'eyes') {
        const l = this.anchors.eyeL.position, r = this.anchors.eyeR.position;
        pos = l.clone().add(r).multiplyScalar(0.5);
        span = l.distanceTo(r);
      } else pos = this.anchors[d.at].position.clone();
      pos.add(new T.Vector3(...d.off));
      const g = d.make(span);
      const parent = d.on === 'head' ? ud.head : d.on === 'hand' ? ud.arms?.[1] : null;
      if (parent) {
        parent.add(g);
        g.position.copy(parent.worldToLocal(f.localToWorld(pos.clone())));
        const ws = parent.getWorldScale(new T.Vector3()), fs = f.getWorldScale(new T.Vector3());
        g.userData.k = new T.Vector3(fs.x / ws.x, fs.y / ws.y, fs.z / ws.z);
      } else {
        f.add(g);
        g.position.copy(pos);
        g.userData.k = new T.Vector3(1, 1, 1);
      }
      const k = g.userData.k;
      g.scale.set(0.001, 0.001, 0.001);
      s.anim(0.35, (_, p) => { const e = Math.max(0.001, Ease.elastic(p)); g.scale.set(k.x * e, k.y * e, k.z * e); });
      made.push(g);
      if (d.eat) {
        // a snack for the mouth: chomp chomp, gone
        s.wait(0.4).then(() => { sfx.chomp(); return s.anim(0.3, (_, p) => g.scale.set(k.x * (1 - p) + 0.001, k.y * (1 - p) * (1 - p) + 0.001, k.z)); }).then(() => { g.parent?.remove(g); sfx.mmm(); });
      }
    }
    if (name === 'tummy') {
      // arms rest on top of the swim ring (hanging down, they vanished inside its tube); this becomes their home pose
      (ud.arms || []).forEach((ar, i) => {
        const z = (this.armHome[i]?.r.z ?? ar.rotation.z) + (i ? -1 : 1) * 0.62;
        if (this.armHome[i]) this.armHome[i].r.z = z;
        s.tween(ar.rotation, { z }, 0.3, Ease.back);
      });
    }
    sfx.sparkle();
    if (!list[0].eat) this.gear[name] = made;
  }

  touch(name, a) {
    if (this.busy) return;
    const ok = name === this.part;
    this.react(name, a, { correct: ok });
    const who = NAME[this.kind];
    if (!ok) {
      this.redirect(`That's the ${PARTS[name].word}. Find ${PARTS[this.part].word}!`);
      return;
    }
    const w = PARTS[name].word;
    this.success(this.wp(a), `${cap(w)}!`);
    this.clearToys();
    this.toyShower(name);
    this.s.wait(0.12).then(() => this.addGear(name));
    this.s.wait(name === 'hands' ? 0.05 : 0.3).then(() => this.selfTouch(name));
  }

  // a stuck child: the part's spot hops (invisible) and, at the second nudge, its halo rings the part
  nudgeTarget() { return this.anchors && !this.busy ? this.targetAnchor() : null; }
  // the anchors are invisible, so hopping one (the base nudge) showed nothing: ring the part with a halo instead
  nudge(step) {
    const a = this.nudgeTarget();
    if (!a) return super.nudge(step);
    sfx.boing && sfx.boing();
    const stop = fx.halo(a, PARTS[this.part].r * this.fs * 0.5 + 0.3);
    this.s.wait(step >= 2 ? 3 : 1.6).then(stop);
  }
  targetAnchor() { return this.anchors[PARTS[this.part].anchors[0]]; }
  showHint(glow = true) {
    if (!this.anchors) return;
    const a = this.targetAnchor();
    if (glow) this.addHalo(a, PARTS[this.part].r * this.fs * 0.5 + 0.3);
    fx.ghostPath([a.getWorldPosition(new T.Vector3())], { mode: 'tap' });
  }
  choicePoints() {
    // scan top-to-bottom over the target and two other parts
    const others = this.cfg.live.filter((p) => p !== this.part).slice(0, 2);
    return [this.part, ...others].map((p) => this.anchors[PARTS[p].anchors[0]].getWorldPosition(new T.Vector3())).sort((x, y) => y.y - x.y);
  }
  makeErrorless() { for (const t of this.taps) if (t.part !== this.part) t.enabled = false; }

  onFinale() {
    // head… tummy… toes! Bear touches each one
    const f = this.friend;
    (async () => {
      for (const [part, n] of [['ears', 0], ['tummy', 2], ['feet', 4]]) {
        sfx.note(n);
        this.selfTouch(part);
        hop(this.s, this.pip, 0.4, 0.35);
        await this.wait(0.8);
      }
      hop(this.s, f, 0.6, 0.4, { sound: true });
    })();
  }
}
