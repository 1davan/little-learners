// Game 9 — Touch Bear's nose. Topic mt_83gRQ9OPkc "Body parts & senses".
// A big friendly bear in swim shorts; the child touches the body part Pip names. Every part reacts when touched,
// and the reaction gets bigger each time that part is touched again. After a right answer Bear touches its own part
// (boop!) and gets a bit of beach gear on it: sunglasses, a flower, a swim ring, flippers…
import * as T from '../three.js';
import { Lesson } from '../engine/lesson.js';
import { makeAnimal, setFace, popIn, hop, wiggle } from '../engine/actors.js';
import { partAnchors } from '../engine/beach.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';
import { GEAR } from './body-gear.js';

const SCALE = 2.15;
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
const PLANS = [
  { live: ['nose', 'tummy', 'ears', 'feet'], rounds: [['bear', 'nose'], ['bear', 'tummy'], ['bear', 'ears'], ['bear', 'feet'], ['bear', 'nose'], ['bear', 'tummy']] },
  { live: Object.keys(PARTS), rounds: [['bear', 'eyes'], ['bear', 'hands'], ['bear', 'mouth'], ['bear', 'ears'], ['bear', 'feet'], ['bear', 'nose']] },
  { live: Object.keys(PARTS), rounds: [['bear', 'eyes'], ['bear', 'nose'], ['bear', 'ears'], ['bear', 'mouth'], ['bunny', 'ears'], ['bunny', 'feet']], senses: true },
];
const NAME = { bear: 'Bear', bunny: 'Bunny' };
const cap = (w) => w[0].toUpperCase() + w.slice(1);

export default class BodyLesson extends Lesson {
  build() {
    this.cfg = PLANS[this.level];
    this.kind = null;
  }

  spawnFriend(kind) {
    if (this.friend) this.root.remove(this.friend);
    for (const t of this.taps || []) input.remove(t);
    const f = makeAnimal(kind);
    f.position.set(0.4, 0, 0.6);
    f.scale.setScalar(SCALE);
    f.userData.baseScale = SCALE;
    this.root.add(f);
    this.friend = f;
    this.kind = kind;
    this.anchors = partAnchors(f);
    this.count = {};
    this.gear = {};
    const ud = f.userData;
    this.armHome = (ud.arms || []).map((a) => ({ p: a.position.clone(), r: a.rotation.clone() }));
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
      await popIn(this.s, f, SCALE, 0.2);
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
    const pt = (a, dx = 0, dy = 0, dz = 0.12) => this.wp(a).add(new T.Vector3(dx * SCALE, dy * SCALE, dz * SCALE));
    let goals;
    if (name === 'nose') goals = [null, pt('nose', 0.08, -0.03)];
    else if (name === 'mouth') goals = [null, pt('mouth', 0.1, -0.03)];
    else if (name === 'eyes') goals = [pt('eyeL', -0.03, -0.02, 0.15), pt('eyeR', 0.03, -0.02, 0.15)];
    else if (name === 'ears') goals = [pt('earL', 0.05, -0.15, 0.1), pt('earR', -0.05, -0.15, 0.1)];
    else if (name === 'tummy') goals = [pt('tummy', -0.22, 0, 0.08), pt('tummy', 0.22, 0, 0.08)];
    else if (name === 'hands') goals = [pt('tummy', -0.1, 0.45, 0.35), pt('tummy', 0.1, 0.45, 0.35)];
    else goals = [pt('footL', 0, 0.25, 0.1), pt('footR', 0, 0.25, 0.1)];
    const local = goals.map((g, i) => (g && arms[i] ? arms[i].parent.worldToLocal(g) : null));
    const bend = name === 'feet';
    const pats = name === 'tummy' || name === 'hands' ? 2 : 1;
    if (bend) s.tween(f.rotation, { x: 0.35 }, 0.2, Ease.out);
    await s.anim(0.2, (e) => local.forEach((l, i) => { if (l) arms[i].position.lerpVectors(home[i].p, l, e); }), Ease.out);
    for (let k = 0; k < pats; k++) {
      if (name === 'hands') sfx.drumSoft(); else sfx.tap();
      if (name === 'nose' || name === 'mouth') sfx.squeak();
      // little squish on contact
      await s.anim(0.14, (_, p) => local.forEach((l, i) => { if (l) arms[i].position.lerpVectors(l, home[i].p, Math.sin(p * Math.PI) * 0.18); }));
    }
    if (name === 'eyes') { sfx.pop(); fx.float(this.wp('eyeR').add(new T.Vector3(0.5, 0.6, 0.5)), '👀', { size: 5 }); } // peekaboo!
    if (bend) s.tween(f.rotation, { x: 0 }, 0.2, Ease.out);
    await s.anim(0.2, (e) => local.forEach((l, i) => { if (l) arms[i].position.lerpVectors(l, home[i].p, e); }), Ease.inOut);
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
    sfx.sparkle();
    if (!list[0].eat) this.gear[name] = made;
  }

  touch(name, a) {
    if (this.busy) return;
    const ok = name === this.part;
    this.react(name, a, { correct: ok });
    const who = NAME[this.kind];
    if (!ok) {
      this.redirect(`That's ${who}'s ${PARTS[name].word}. Find ${PARTS[this.part].word}!`);
      return;
    }
    const w = PARTS[name].word;
    this.success(this.wp(a), `${cap(w)}!`);
    this.s.wait(0.12).then(() => this.addGear(name));
    this.s.wait(name === 'hands' ? 0.05 : 0.3).then(() => this.selfTouch(name));
  }

  targetAnchor() { return this.anchors[PARTS[this.part].anchors[0]]; }
  showHint(glow = true) {
    if (!this.anchors) return;
    const a = this.targetAnchor();
    if (glow) this.addHalo(a, PARTS[this.part].r * SCALE * 0.5 + 0.3);
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
