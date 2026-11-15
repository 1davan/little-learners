// Game 7 — Where's Crab? Topics mt_qeZYF6HZ4o "Positional language" and mt_VY3rBq8RyP "Prepositions".
// Drag Crab IN the bucket, ON the stool or UNDER the stool.
import * as T from '../three.js';
import { Lesson } from '../engine/lesson.js';
import { mesh, geo } from '../engine/toon.js';
import { popIn, hop, wiggle } from '../engine/actors.js';
import { makeCrab, makeBucket } from '../engine/beach.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';

const SPAWN = new T.Vector3(0, 0, 3.6);
const BUCKET_X = -3.6, STOOL_X = 3.2;
const LINE = {
  in: { prompt: 'In! Put Crab in the bucket.', done: 'In! Crab is in the bucket!' },
  on: { prompt: 'On! Put Crab on the stool.', done: 'On! Crab is on the stool!' },
  under: { prompt: 'Under! Put Crab under the stool.', done: 'Under! Crab is under the stool!' },
};
const PLANS = [
  ['in', 'on', 'in', 'on', 'in', 'on'],
  ['in', 'on', 'under', 'in', 'under', 'on'],
  ['on', 'under', 'in', 'under', 'on', 'under'],
];

export default class WhereLesson extends Lesson {
  build() {
    this.plan = PLANS[this.level];
    this.bucket = makeBucket(0x4a90ff, 1.3, 1.8);
    this.bucket.position.set(BUCKET_X, 0, 0);
    this.stool = new T.Group();
    const seat = mesh(geo.box(3, 0.25, 2), 0xff8fc0, { hull: 1.03 });
    seat.position.y = 2.2;
    this.stool.add(seat);
    for (const [x, z] of [[-1.3, -0.8], [1.3, -0.8], [-1.3, 0.8], [1.3, 0.8]]) {
      const leg = mesh(geo.cyl(0.12, 0.12, 2.1, 10), 0xffffff, { outline: 0.02 });
      leg.position.set(x, 1.05, z);
      this.stool.add(leg);
    }
    this.stool.position.set(STOOL_X, 0, 0);
    this.root.add(this.bucket, this.stool);
    this.zoneList = [
      { id: 'in', prop: 'bucket', pos: () => new T.Vector3(this.bucket.position.x, 1.9, 0), rest: () => new T.Vector3(this.bucket.position.x, 0.9, 0), radius: 1.5 },
      { id: 'on', prop: 'stool', pos: () => new T.Vector3(this.stool.position.x, 2.75, 0), rest: () => new T.Vector3(this.stool.position.x, 2.33, 0), radius: 1.4 },
      { id: 'under', prop: 'stool', pos: () => new T.Vector3(this.stool.position.x, 0.6, 0.3), rest: () => new T.Vector3(this.stool.position.x, 0, 0), radius: 1.3 },
    ];
  }

  zones() {
    return this.zoneList.filter((z) => z.enabled !== false).map((z) => ({ ...z, pos: z.pos() }));
  }

  target() { return this.plan[this.round]; }

  async startRound(r) {
    this.busy = true;
    const want = this.plan[r];
    const wantProp = want === 'in' ? 'bucket' : 'stool';
    // Level 1: only the prop we need is out, so only one place is live
    for (const z of this.zoneList) z.enabled = this.level > 0 || z.id === want;
    this.bucket.visible = this.level > 0 || wantProp === 'bucket';
    this.stool.visible = this.level > 0 || wantProp === 'stool';
    this.bucket.scale.setScalar(1); this.stool.scale.setScalar(1);
    // Level 3, last round: bucket and stool swap sides first
    if (this.level === 2 && r === 5) {
      sfx.whoosh();
      this.s.tween(this.bucket.position, { x: STOOL_X }, 0.8, Ease.inOut);
      await this.s.tween(this.stool.position, { x: BUCKET_X }, 0.8, Ease.inOut);
    }
    const crab = makeCrab();
    crab.position.set(9, 0, SPAWN.z);
    this.root.add(crab);
    this.crab = crab;
    sfx.squeak();
    await this.s.anim(1.0, (e) => { crab.position.x = 9 * (1 - e); crab.rotation.z = Math.sin(e * 30) * 0.08; }, Ease.out);
    crab.rotation.z = 0;
    this.drag = input.addDrag(crab, {
      radius: 1.1, minY: 0, offset: new T.Vector3(0, 0.6, 0),
      zones: () => this.zones(),
      onPick: () => { sfx.squeak(); this.s.tween(crab.scale, { x: 1.1, y: 1.1, z: 1.1 }, 0.15); },
      onDrop: (z, info) => this.drop(z, info),
    });
    this.busy = false;
    this.cue();
  }

  promptText() { const w = this.target(); return w ? LINE[w].prompt : ''; }

  goHome() {
    this.s.tween(this.crab.position, { x: SPAWN.x, y: SPAWN.y, z: SPAWN.z }, 0.5, Ease.back);
    this.s.tween(this.crab.scale, { x: 1, y: 1, z: 1 }, 0.3);
  }

  async drop(zone, { tapped }) {
    const crab = this.crab;
    if (!zone) { this.goHome(); if (tapped) { wiggle(this.s, crab, 0.3); } return; }
    const want = this.target();
    const wantProp = want === 'in' ? 'bucket' : 'stool';
    // Level 2: dropping anywhere on the right thing counts; Level 3 needs the exact place
    const ok = zone.id === want || (this.level === 1 && zone.prop === wantProp);
    if (!ok) { this.goHome(); this.redirect(`That's ${zone.id}. Find ${want}!`); return; }
    input.remove(this.drag);
    this.busy = true;
    const z = this.zoneList.find((q) => q.id === want);
    const rest = z.rest();
    this.s.tween(crab.scale, { x: 1, y: 1, z: 1 }, 0.2);
    if (want === 'in') {
      await this.s.tween(crab.position, { x: rest.x, y: 3.0, z: rest.z }, 0.28, Ease.out);
      await this.s.tween(crab.position, { y: rest.y }, 0.25, Ease.in);
      sfx.splash();
    } else if (want === 'on') {
      await this.s.tween(crab.position, { x: rest.x, y: rest.y + 0.8, z: rest.z }, 0.35, Ease.out);
      await this.s.tween(crab.position, { y: rest.y }, 0.3, Ease.bounce);
      sfx.boing();
    } else {
      await this.s.tween(crab.position, { x: rest.x, y: rest.y, z: rest.z + 0.4 }, 0.45, Ease.inOut);
      sfx.whoosh();
    }
    sfx.tap(); this.s.wait(0.12).then(() => sfx.tap()); this.s.wait(0.24).then(() => sfx.tap());
    for (const c of crab.userData.claws) this.s.anim(0.8, (_, p) => { c.rotation.z = Math.sin(p * Math.PI * 6) * 0.5; });
    this.busy = false;
    this.success(rest.clone().add(new T.Vector3(0, 1.4, 0)), LINE[want].done);
  }

  async afterSuccess() {
    const crab = this.crab;
    sfx.patter();
    hop(this.s, crab, 0.6);
    this.s.tween(crab.position, { x: -10, y: 0 }, 0.7, Ease.in).then(() => this.root.remove(crab));
  }

  showHint(glow = true) {
    const z = this.zoneList.find((q) => q.id === this.target());
    if (!z || !this.crab) return;
    const at = z.pos();
    if (glow) {
      const anchor = new T.Object3D();
      anchor.position.copy(at);
      this.root.add(anchor);
      this.addHalo(anchor, 1.2);
    }
    fx.ghostPath([this.crab.position.clone().add(new T.Vector3(0, 0.6, 0)), at], { mode: 'drag' });
  }

  // Level 3 demo: show "pick Crab up and move", without showing where
  demoL3() {
    if (!this.crab) return;
    const p = this.crab.position.clone().add(new T.Vector3(0, 0.6, 0));
    fx.ghostPath([p, p.clone().add(new T.Vector3(0, 1.8, 0))], { mode: 'drag' });
  }

  makeErrorless() {
    const want = this.target();
    for (const z of this.zoneList) if (z.id !== want) z.enabled = false;
    const other = want === 'in' ? this.stool : this.bucket;
    this.s.tween(other.scale, { x: 0.6, y: 0.6, z: 0.6 }, 0.4);
  }

  onFinale() {
    // Crab shows off: in, on, under
    const crab = makeCrab();
    crab.position.copy(SPAWN);
    this.root.add(crab);
    this.bucket.visible = this.stool.visible = true;
    const seq = ['in', 'on', 'under'];
    (async () => {
      await this.wait(1.5);
      for (const w of seq) {
        const z = this.zoneList.find((q) => q.id === w).rest();
        await this.s.tween(crab.position, { x: z.x, y: z.y + (w === 'under' ? 0 : 1.5), z: z.z + (w === 'under' ? 0.4 : 0) }, 0.5, Ease.inOut);
        await this.s.tween(crab.position, { y: z.y }, 0.25, Ease.in);
        sfx.note(seq.indexOf(w) * 2);
        await this.wait(0.4);
      }
    })();
  }
}
