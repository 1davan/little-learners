// Game 10 — Splash wash. Topic mt_vbbxnY7ZDT "Keeping clean and healthy".
// A sandy friend needs a wash: rub each sandy spot with the sponge until it's clean. Level 3: dip the sponge in water first.
import * as T from '../three.js';
import { Lesson } from '../engine/lesson.js';
import { mesh, geo, toonUnique } from '../engine/toon.js';
import { makeAnimal, setFace, popIn, hop, wiggle, dance } from '../engine/actors.js';
import { partAnchors, makeSponge, makeBucket, makeBubble } from '../engine/beach.js';
import { input } from '../engine/input.js';
import { project, screenRadius } from '../engine/stage.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';

const SCALE = 2.2;
const SPONGE_HOME = new T.Vector3(4.7, 1.0, 3);
const BUCKET_POS = new T.Vector3(-4.6, 0, 3);
const WORD = { tummy: 'tummy', handL: 'hand', handR: 'hand', footL: 'foot', footR: 'foot', nose: 'nose', earL: 'ear', earR: 'ear' };
const NAME = { bear: 'Bear', bunny: 'Bunny', cat: 'Kitty', frog: 'Froggy' };
const NEED = [0.35, 0.6, 0.8]; // how much rubbing each spot needs (fraction of screen size travelled)
const DAB = [0.5, 0.25, 0]; // how much one tap on a spot cleans
const PLANS = [
  [['bear', ['tummy']], ['bear', ['tummy', 'handR']], ['bunny', ['tummy', 'footL']], ['cat', ['handL', 'handR']], ['frog', ['tummy', 'footR']], ['bear', ['handL', 'handR'], 'snack']],
  [['bear', ['tummy', 'handR']], ['bunny', ['tummy', 'footL', 'footR']], ['cat', ['nose', 'handL', 'handR']], ['frog', ['tummy', 'earL', 'footR']], ['bear', ['nose', 'tummy', 'footL', 'footR']], ['bunny', ['handL', 'handR', 'tummy'], 'snack']],
  [['bear', ['tummy', 'handL', 'handR']], ['bunny', ['earL', 'tummy', 'footR']], ['cat', ['nose', 'handL', 'footL', 'footR']], ['frog', ['tummy', 'handL', 'handR', 'footL']], ['bear', ['earL', 'earR', 'nose', 'tummy']], ['cat', ['handL', 'handR', 'nose', 'tummy'], 'snack']],
];

function makeSpot() {
  const g = new T.Group();
  const m = new T.Mesh(geo.sphere(0.34, 16, 10), toonUnique(0x8a5f2e, { transparent: true }));
  m.scale.set(1.35, 1, 0.4);
  g.add(m);
  for (let i = 0; i < 3; i++) {
    const sp = new T.Mesh(geo.sphere(0.07, 6, 4), toonUnique(0xd9b27a, { transparent: true }));
    sp.position.set(-0.15 + i * 0.15, (i % 2) * 0.1 - 0.05, 0.1);
    g.add(sp);
  }
  return g;
}
function setSpotLook(spot, p) {
  const k = Math.max(0, 1 - p);
  spot.scale.setScalar(0.3 + 0.7 * k);
  spot.traverse((o) => { if (o.material) o.material.opacity = 0.25 + 0.75 * k; });
}

export default class WashLesson extends Lesson {
  build() {
    this.plan = PLANS[this.level];
    this.need = NEED[this.level];
    // a flat rock for the sponge to rest on
    const rock = mesh(geo.sphere(1, 16, 10), 0xb7b2a6, { outline: 0.03 });
    rock.scale.set(1.1, 0.45, 0.8);
    rock.position.set(SPONGE_HOME.x, 0.2, SPONGE_HOME.z);
    this.root.add(rock);
    this.sponge = makeSponge();
    this.sponge.position.copy(SPONGE_HOME);
    this.root.add(this.sponge);
    if (this.level === 2) {
      this.water = makeBucket(0x4a90ff, 0.9, 1.0);
      this.water.position.copy(BUCKET_POS);
      const surf = new T.Mesh(geo.circle(0.85, 24), toonUnique(0x7fd8ee));
      surf.rotation.x = -Math.PI / 2; surf.position.y = 0.8;
      this.water.add(surf);
      this.root.add(this.water);
      this.wet = false;
      this.setWet(false);
    } else this.wet = true;
    this.dragT = input.addDrag(this.sponge, {
      radius: 1.0, minY: 0.5, zones: () => [],
      onPick: () => { this.last = null; this.s.tween(this.sponge.scale, { x: 1.15, y: 1.15, z: 1.15 }, 0.12); },
      onMove: () => this.rub(),
      onDrop: (_z, info) => this.dropSponge(info),
    });
    this.bubbles = [];
    this.lastScrub = 0;
  }

  setWet(w) {
    this.wet = w;
    this.sponge.children[0].material = toonUnique(w ? 0xffd23f : 0xfff3b0);
  }

  dirty() { return (this.spots || []).filter((s) => !s.clean); }

  async startRound(r) {
    this.busy = true;
    const [kind, parts] = this.plan[r];
    if (this.friend) this.root.remove(this.friend);
    for (const t of this.spotTaps || []) input.remove(t);
    const f = makeAnimal(kind);
    f.scale.setScalar(SCALE);
    f.userData.baseScale = SCALE;
    f.position.set(-9, 0, 0.3);
    this.root.add(f);
    this.friend = f;
    setFace(f.userData.face, 'sad');
    sfx.aww();
    await this.s.tween(f.position, { x: 0 }, 1.0, Ease.out);
    const anchors = partAnchors(f);
    this.spots = parts.map((name) => {
      const sp = makeSpot();
      sp.position.z = 0.12;
      anchors[name].add(sp);
      popIn(this.s, sp, 1, 0.3);
      return { name, obj: sp, anchor: anchors[name], done: 0, clean: false };
    });
    this.spotTaps = this.spots.map((s) => input.addTap(s.anchor, { radius: 0.6, onTap: () => this.dab(s) }));
    this.washedOnce = 0;
    await this.wait(0.4);
    this.busy = false;
    this.cue();
  }

  who() { return NAME[this.friend?.userData.kind] || 'friend'; }
  promptText() {
    const d = this.dirty()[0];
    if (!d) return '';
    if (this.level === 2 && !this.wet) return 'Dip, dip! Water first.';
    return `Rub rub rub! Wash ${this.who()}'s ${WORD[d.name]}.`;
  }

  // called while the sponge is dragged: rubbing near a dirty spot cleans it
  rub() {
    const sp = this.sponge;
    const p = project(sp.position);
    const m = Math.min(window.innerWidth, window.innerHeight);
    if (this.level === 2 && !this.wet) {
      const b = project(BUCKET_POS.clone().setY(0.9));
      if (Math.hypot(p.x - b.x, p.y - b.y) < m * 0.13) { this.setWet(true); this.washedOnce = 0; sfx.splash(); this.say('Splash! Now rub!'); }
      this.last = p;
      return;
    }
    if (this.last) {
      const travel = Math.min(0.08, Math.hypot(p.x - this.last.x, p.y - this.last.y) / m);
      for (const s of this.dirty()) {
        const wp = s.anchor.getWorldPosition(new T.Vector3());
        const c = project(wp);
        const r = Math.max(screenRadius(wp, 0.7) * 1.4, m * 0.11);
        if (Math.hypot(p.x - c.x, p.y - c.y) < r && travel > 0.002) this.scrub(s, travel);
      }
    }
    this.last = p;
  }

  scrub(s, amt) {
    const before = s.done;
    s.done = Math.min(this.need, s.done + amt);
    const p = s.done / this.need;
    setSpotLook(s.obj, p);
    const now = performance.now();
    if (now - this.lastScrub > 120) { sfx.scrub(); this.lastScrub = now; }
    if (Math.floor(p * 5) > Math.floor((before / this.need) * 5)) this.puff(s.anchor.getWorldPosition(new T.Vector3()));
    if (s.done >= this.need) this.cleaned(s);
  }

  dab(s) {
    if (this.busy || s.clean) return;
    const wp = s.anchor.getWorldPosition(new T.Vector3());
    this.s.tween(this.sponge.position, { x: wp.x + 0.3, y: wp.y + 0.2, z: wp.z + 0.8 }, 0.25, Ease.out);
    const amt = this.errorlessOn ? 1 : DAB[this.level];
    if (!amt || (this.level === 2 && !this.wet)) { wiggle(this.s, this.sponge, 0.3); return; }
    this.scrub(s, amt * this.need);
  }

  puff(wp) {
    sfx.bubble();
    for (let i = 0; i < 3; i++) {
      const b = makeBubble(0.12 + Math.random() * 0.1);
      b.position.copy(wp).add(new T.Vector3((Math.random() - 0.5) * 0.8, 0, 0.6));
      this.root.add(b);
      const y0 = b.position.y;
      this.s.anim(1.2 + Math.random() * 0.5, (_, q) => { b.position.y = y0 + q * 2; b.scale.setScalar(1 - q * 0.5); }).then(() => this.root.remove(b));
    }
  }

  cleaned(s) {
    if (s.clean) return;
    s.clean = true;
    this.clearHints();
    s.anchor.remove(s.obj);
    const wp = s.anchor.getWorldPosition(new T.Vector3());
    fx.confetti(wp, 12);
    sfx.note(this.spots.indexOf(s) * 2);
    this.washedOnce++;
    if (this.level === 2 && this.washedOnce >= 2) this.setWet(false);
    const left = this.dirty();
    if (!left.length) return this.allClean();
    this.say(`Clean ${WORD[s.name]}! ${this.level === 2 && !this.wet ? 'Dip again!' : 'More!'}`);
    this.idle = 0;
  }

  async allClean() {
    this.busy = true;
    input.lock(4000);
    const f = this.friend;
    setFace(f.userData.face, 'happy');
    this.s.tween(this.sponge.position, { x: SPONGE_HOME.x, y: SPONGE_HOME.y, z: SPONGE_HOME.z }, 0.5, Ease.out);
    this.s.tween(this.sponge.scale, { x: 1, y: 1, z: 1 }, 0.3);
    dance(this.s, f);
    this.puff(f.position.clone().add(new T.Vector3(0, 3, 0)));
    if (this.plan[this.round][2] === 'snack') {
      await this.say('Clean hands! Now eat!', { max: 1.1 });
      const apple = mesh(geo.sphere(0.45, 16, 12), 0xff4b4b, { outline: 0.03 });
      apple.position.set(f.position.x + 1.4, 2.4, f.position.z + 1.2);
      this.root.add(apple);
      await popIn(this.s, apple);
      sfx.chomp();
      await this.s.tween(apple.scale, { x: 0.001, y: 0.001, z: 0.001 }, 0.3);
    }
    this.busy = false;
    this.success(f.position.clone().add(new T.Vector3(0, 3.5, 0)), 'All clean!');
  }

  async afterSuccess() {
    sfx.patter();
    const f = this.friend;
    this.s.tween(f.position, { x: 10 }, 0.7, Ease.in);
  }

  dropSponge() {
    // the sponge stays where it was put, unless it fell off
    this.s.tween(this.sponge.scale, { x: 1, y: 1, z: 1 }, 0.15);
    this.last = null;
    const p = project(this.sponge.position);
    if (p.x < 0 || p.x > window.innerWidth || p.y > window.innerHeight * 0.95) this.s.tween(this.sponge.position, { x: SPONGE_HOME.x, y: SPONGE_HOME.y, z: SPONGE_HOME.z }, 0.4, Ease.out);
  }

  showHint(glow = true) {
    const d = this.dirty()[0];
    if (!d) return;
    const wp = d.anchor.getWorldPosition(new T.Vector3());
    if (glow) this.addHalo(d.anchor, 0.9);
    const pts = [this.sponge.position.clone()];
    if (this.level === 2 && !this.wet) pts.push(BUCKET_POS.clone().setY(1.2));
    pts.push(wp);
    fx.ghostPath(pts, { mode: 'rub' });
  }
  demoL3() { this.showHint(false); }

  makeErrorless() {
    // the sponge floats to the next spot and spots need half the rubbing
    this.need *= 0.5;
    if (this.level === 2) this.setWet(true);
    const d = this.dirty()[0];
    if (d) { const wp = d.anchor.getWorldPosition(new T.Vector3()); this.s.tween(this.sponge.position, { x: wp.x + 0.6, y: wp.y, z: wp.z + 0.9 }, 0.6, Ease.inOut); }
  }

  nextRound() { this.need = NEED[this.level]; super.nextRound(); }

  onFinale() {
    // one giant bubble floats up and pops
    const b = makeBubble(0.9);
    b.position.set(0, 3, 2);
    this.root.add(b);
    this.s.tween(b.position, { y: 7 }, 1.6, Ease.out).then(() => { sfx.pop(); this.root.remove(b); });
    hop(this.s, this.pip, 0.6);
  }
}
