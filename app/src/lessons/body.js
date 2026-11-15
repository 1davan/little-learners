// Game 9 — Touch Bear's nose. Topic mt_83gRQ9OPkc "Body parts & senses".
// A big friendly bear in swim shorts; the child touches the body part Pip names. Every part reacts when touched.
import * as T from '../three.js';
import { Lesson } from '../engine/lesson.js';
import { mesh, geo } from '../engine/toon.js';
import { makeAnimal, setFace, popIn, hop, wiggle } from '../engine/actors.js';
import { partAnchors } from '../engine/beach.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';

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

function makeShorts() {
  const s = mesh(geo.cyl(0.74, 0.7, 0.32, 20), 0x4a90ff, { outline: 0.03 });
  s.position.y = 0.3;
  return s;
}

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
      if (r > 0) await this.say(`Hello ${NAME[kind]}!`, { max: 1.0 });
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
    return `${w[0].toUpperCase() + w.slice(1)}! Touch ${who}'s ${w}.`;
  }

  // every part does something fun when touched
  react(name, a) {
    const f = this.friend, s = this.s;
    const ud = f.userData;
    if (name === 'nose') { sfx.squeak(); s.anim(0.4, (_, p) => ud.head.scale.setScalar(1 + Math.sin(p * Math.PI) * 0.08)); }
    else if (name === 'eyes') { sfx.pop(); for (const e of ud.face.userData.eyes) s.anim(0.35, (_, p) => { e.scale.y = Math.max(0.1, Math.abs(Math.cos(p * Math.PI))); }); }
    else if (name === 'ears') { sfx.note(5); wiggle(s, ud.head, 0.2, 0.6); }
    else if (name === 'mouth') { sfx.mmm(); setFace(ud.face, 'scared'); s.wait(0.6).then(() => setFace(ud.face, 'happy')); }
    else if (name === 'tummy') { sfx.giggle(); s.anim(0.6, (_, p) => { ud.body.scale.x = 1 + Math.sin(p * Math.PI * 6) * 0.06 * (1 - p); }); }
    else if (name === 'hands') { sfx.note(3); const arm = ud.arms?.[a === 'handL' ? 0 : 1]; if (arm) { const r0 = arm.rotation.z; s.anim(0.7, (_, p) => { arm.rotation.z = r0 + Math.sin(p * Math.PI) * (a === 'handL' ? -1.4 : 1.4); }); } }
    else if (name === 'feet') { sfx.lowBoing(); hop(s, f, 0.3, 0.3); }
  }

  touch(name, a) {
    if (this.busy) return;
    this.react(name, a);
    const who = NAME[this.kind];
    if (name !== this.part) {
      this.redirect(`That's ${who}'s ${PARTS[name].word}. Find ${PARTS[this.part].word}!`);
      return;
    }
    const w = PARTS[name].word;
    this.success(this.anchors[a].getWorldPosition(new T.Vector3()), `${w[0].toUpperCase() + w.slice(1)}! That's ${who}'s ${w}!`);
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
    // head… tummy… toes!
    const f = this.friend;
    (async () => {
      for (const [w, n] of [['Head', 0], ['Tummy', 2], ['Toes', 4]]) {
        sfx.note(n);
        hop(this.s, f, 0.4, 0.35);
        hop(this.s, this.pip, 0.4, 0.35);
        await this.wait(0.5);
      }
    })();
  }
}
