// Game 10 — Splash wash. Topic mt_vbbxnY7ZDT "Keeping clean and healthy".
// A messy friend needs a wash: rub each messy spot with the sponge until it's clean. Level 3: dip the sponge in water first.
// Each round brings a different mess (sand, mud, paint, jam, grass, chocolate). Rubbing builds foam and makes the
// friend squirm and giggle; a clean spot lets go of bubbles you can pop; a clean friend does a shake-dry, a twirl
// or a splash-jump. Each level has its own wash spot: Level 1 a sponge on a rock, Level 2 a pink sponge on a wooden tub
// with a rubber duck, Level 3 a bucket to dip in and a beach shower. Real physics: the mess prop drops in, crumbs of mess
// fall off and bounce on the sand as you scrub, the sponge falls and tumbles when you let go, and water drops fly and bounce.
import * as T from '../three.js';
import { Lesson } from '../engine/lesson.js';
import { mesh, geo, toonUnique } from '../engine/toon.js';
import { makeAnimal, setFace, popIn, popOut, hop, wiggle } from '../engine/actors.js';
import { partAnchors, makeSponge, makeBucket, makeMelon, makeWaterDrop } from '../engine/beach.js';
import { input } from '../engine/input.js';
import { project, screenRadius, setCamera, camera } from '../engine/stage.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';
import { MESS, makeMess, setMessLook, makeFoam, makeCause, makeDrop, makeSoapBubble, makeCrumb, makeStation } from './wash-mess.js';
import { physics } from '../engine/physics.js';

const SCALE = 2.2;
const MAX_H = 5.5;                 // tallest a friend may stand (bunny ears stay below the caption)
const CAM = { pos: new T.Vector3(0, 3.3, 12.6), look: new T.Vector3(0, 2.3, 0) };
const HOMES = [new T.Vector3(4.7, 1.0, 3), new T.Vector3(4.7, 1.25, 3), new T.Vector3(4.7, 1.0, 3)];
let SPONGE_HOME = HOMES[0];
const BUCKET_POS = new T.Vector3(-4.2, 0, 3.2);
const CAUSE_AT = new T.Vector3(-3.0, 0, 1.4);
const WORD = { tummy: 'tummy', handL: 'hand', handR: 'hand', footL: 'foot', footR: 'foot', nose: 'nose', earL: 'ear', earR: 'ear' };
const NAME = { bear: 'Bear', bunny: 'Bunny', cat: 'Kitty', frog: 'Froggy' };
const NEED = [0.35, 0.6, 0.8]; // how much rubbing each spot needs (fraction of screen size travelled)
const DAB = [0.5, 0.25, 0]; // how much one tap on a spot cleans
const FOAM_MAX = 8;
const PLANS = [
  [['bear', ['tummy']], ['bear', ['tummy', 'handR']], ['bunny', ['tummy', 'footL']], ['cat', ['handL', 'handR']], ['frog', ['tummy', 'footR']], ['bear', ['handL', 'handR'], 'snack']],
  [['bear', ['tummy', 'handR']], ['bunny', ['tummy', 'footL', 'footR']], ['cat', ['nose', 'handL', 'handR']], ['frog', ['tummy', 'earL', 'footR']], ['bear', ['nose', 'tummy', 'footL', 'footR']], ['bunny', ['handL', 'handR', 'tummy'], 'snack']],
  [['bear', ['tummy', 'handL', 'handR']], ['bunny', ['earL', 'tummy', 'footR']], ['cat', ['nose', 'handL', 'footL', 'footR']], ['frog', ['tummy', 'handL', 'handR', 'footL']], ['bear', ['earL', 'earR', 'nose', 'tummy']], ['cat', ['handL', 'handR', 'nose', 'tummy'], 'snack']],
];
// a different mess every round (per level)
const MESSES = [
  ['sand', 'mud', 'paint', 'jam', 'grass', 'choc'],
  ['mud', 'paint', 'sand', 'grass', 'jam', 'choc'],
  ['paint', 'jam', 'mud', 'sand', 'grass', 'choc'],
];

export default class WashLesson extends Lesson {
  build() {
    setCamera(CAM.pos, CAM.look);
    this.pip.position.set(-5.9, 0, -4.6);   // back, so the Level 3 bucket doesn't hide him (and clear of the sunset/night lantern post at x -7.8)
    this.plan = PLANS[this.level];
    this.need = NEED[this.level];
    SPONGE_HOME = HOMES[this.level];
    // where the sponge rests: a rock, a wooden tub or a rock under the shower (with physics shapes)
    this.station = makeStation(this.level, SPONGE_HOME);
    this.root.add(this.station);
    for (const [x, y, z, sx, sy, sz] of this.station.userData.statics) physics.box(new T.Vector3(x, y, z), new T.Vector3(sx, sy, sz));
    this.sponge = makeSponge();
    // the sponge's colours per level (Level 2: a pink sponge with a blue scrubber); dry = a paler shade
    this.spongeCol = [0xffd23f, 0xff9ec8, 0xffd23f][this.level];
    this.sponge.userData.setColors(this.spongeCol, [0x6fd08c, 0x7fd0ff, 0x6fd08c][this.level]);
    this.showerDrops = [];
    this.showerT = 0;
    this.crumbs = [];
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
      onPick: () => { this.holdSponge(); this.last = null; this.s.tween(this.sponge.scale, { x: 1.15, y: 1.15, z: 1.15 }, 0.12); },
      onMove: () => this.rub(),
      onDrop: (_z, info) => this.dropSponge(info),
    });
    this.bubbles = [];
    this.lastScrub = 0;
    this.lastGiggle = 0;
    this.tickle = 0;
    // bubbles pop on a tap that hits nothing else, so they never steal a grab of the sponge
    this.offs.push(input.onMiss((x, y) => this.popAt(x, y)));
  }

  // take the sponge out of the physics world (to carry or tween it), upright again
  holdSponge() {
    const sp = this.sponge;
    physics.remove(sp);
    sp.rotation.set(0, 0, 0);
    sp.position.z = SPONGE_HOME.z;
  }

  // a crumb of the mess falls off the spot and bounces on the sand (the oldest shrinks away, so the sand stays tidy)
  shedCrumb(at, kind = this.mess) {
    if (this.crumbs.length > 16) { const old = this.crumbs.shift(); physics.remove(old); popOut(this.s, old, 0.15).then(() => this.root.remove(old)); }
    const c = makeCrumb(kind);
    c.position.copy(at).add(new T.Vector3((Math.random() - 0.5) * 0.4, 0, 0.5));
    this.root.add(c);
    this.crumbs.push(c);
    physics.add(c, { shape: 'ball', r: c.userData.r, bounce: 0.45 });
    physics.impulse(c, { x: (Math.random() - 0.5) * 3, y: 1 + Math.random() * 2, z: 1 + Math.random() }, { x: Math.random(), y: 0, z: Math.random() });
  }

  setWet(w) {
    this.wet = w;
    const c = new T.Color(this.spongeCol);
    if (!w) c.lerp(new T.Color(0xffffff), 0.6);   // a dry sponge is pale; dipped it's full colour
    this.sponge.userData.setColors(c.getHex(), null);
  }

  dirty() { return (this.spots || []).filter((s) => !s.clean); }

  async startRound(r) {
    this.busy = true;
    const [kind, parts] = this.plan[r];
    this.mess = MESSES[this.level][r];
    for (const t of this.spotTaps || []) input.remove(t);
    const f = makeAnimal(kind);
    // fit every friend to the same height budget (a bunny's ears used to run off the top, behind the caption)
    f.updateMatrixWorld(true);
    const h = new T.Box3().setFromObject(f).getSize(new T.Vector3()).y || 2.3;
    this.fs = Math.min(SCALE, MAX_H / h);
    f.scale.setScalar(this.fs);
    f.userData.baseScale = this.fs;
    f.position.set(-8, 0, 0.3);
    f.rotation.y = 0.9;   // walks in facing the way it goes, then turns to us
    this.root.add(f);
    this.friend = f;
    this.tickle = 0;
    // "eek, icky!": a surprised face for a moment, then a giggle (no tears: getting clean is fun)
    setFace(f.userData.face, 'scared');
    this.s.wait(0.9).then(() => { if (this.friend === f && !this.tickle) setFace(f.userData.face, 'calm'); });
    // the thing that made the mess pops up beside the spot the friend runs to
    this.cause = makeCause(this.mess);
    this.cause.position.copy(CAUSE_AT);
    // the mess-maker drops in from the sky and bounces (kept upright), once the friend has walked past its spot
    const cause = this.cause;
    cause.position.y = 4;
    this.s.wait(0.6).then(() => {
      if (this.cause !== cause || this.dead) return;
      this.root.add(cause);
      physics.add(cause, { shape: 'box', spin: false, bounce: 0.35 });
      sfx.whoosh();
      this.s.wait(0.75).then(() => { if (cause.parent && this.cause === cause) { physics.remove(cause); this.s.tween(cause.position, { y: 0 }, 0.08); } });
    });
    // walk in along the sand (the motion layer gives each friend its own gait), then turn to face us
    sfx.patter();
    this.s.anim(0.85, (e) => { f.position.x = -8 + 8 * e; }, Ease.out)
      .then(() => { f.position.y = 0; this.s.tween(f.rotation, { y: 0 }, 0.2); });
    if (this.level === 2) this.showerT = 0.9;   // the beach shower gives a little splash of a welcome
    await this.wait(0.18);
    const anchors = partAnchors(f);
    this.hugSurface(f, parts.map((n) => anchors[n]), parts);
    this.spots = parts.map((name, i) => {
      const sp = makeMess(this.mess, anchors[name].userData.curve);
      sp.position.z = 0.03;
      sp.rotation.z = (i % 2 ? 1 : -1) * 0.3;
      sp.userData.k = name === 'tummy' ? 1 : /hand/.test(name) ? 0.25 : /foot/.test(name) ? 0.3 : 0.4; // smaller splats on hands, feet, ears and noses (paw-sized, so they stay inside the paw's outline)
      anchors[name].add(sp);
      this.s.wait(0.06 * i).then(() => popIn(this.s, sp, sp.userData.k, 0.3, { sound: false }));
      return { name, obj: sp, anchor: anchors[name], done: 0, clean: false, foam: [] };
    });
    sfx[MESS[this.mess].snd]();
    // bits of the mess drip off as the friend arrives
    this.s.wait(0.2).then(() => { for (const sp of this.spots) this.shedCrumb(sp.anchor.getWorldPosition(new T.Vector3())); });
    this.s.wait(0.5).then(() => {
      if (this.friend !== f) return;
      sfx.giggle();
      fx.float(f.position.clone().add(new T.Vector3(1.3, f.userData.baseScale * 2.0, 0.6)), 'icky!', { color: '#ff8fc0', size: 4.5 });
    });
    this.spotTaps = this.spots.map((s) => (s.tap = input.addTap(s.anchor, { radius: 0.6, onTap: () => this.dab(s) })));
    this.washedOnce = 0;
    await this.wait(0.15);
    this.busy = false;
    this.cue();
  }

  // Move each spot anchor onto the friend's skin where we see it (a ray from the camera), and turn it so its +z
  // is the surface normal (leaning a little towards us): the mess then lies flat on the body like a real splat.
  hugSurface(f, list, names = []) {
    const meshes = [];
    f.traverse((o) => { if (o.isMesh && o.visible && !o.userData.outline && !(o.material && o.material.transparent)) meshes.push(o); });
    const end = f.position.x, ry = f.rotation.y;
    f.position.x = 0; f.rotation.y = 0;        // measure where the friend will stand, facing us (it is still walking in)
    f.updateMatrixWorld(true);
    const ray = new T.Raycaster(), Z = new T.Vector3(0, 0, 1);
    const inv = new T.Matrix4().copy(f.matrixWorld).invert();
    const nm = new T.Matrix3();
    for (const [ai, a] of list.entries()) {
      const w = a.getWorldPosition(new T.Vector3());
      const dir = w.clone().sub(camera.position).normalize();
      ray.set(camera.position, dir);
      const hit = ray.intersectObjects(meshes, false).find((h) => h.face && h.point.distanceTo(w) < 0.9 * this.fs);
      if (!hit) continue;
      const n = hit.face.normal.clone().applyMatrix3(nm.getNormalMatrix(hit.object.matrixWorld)).normalize();
      n.lerp(dir.clone().negate(), 0.35).normalize();
      a.position.copy(hit.point.clone().applyMatrix4(inv));
      // the normal in the friend's own space (it is only scaled uniformly and turned about y)
      const nl = n.clone().transformDirection(inv);
      a.quaternion.setFromUnitVectors(Z, nl);
      // how the body curves away under the spot: four rays round it, fitted as z = a x² + b x + c y² + d y in the
      // spot's own frame, so the mess bends onto the fur (makeMess) instead of sticking out flat
      a.updateMatrixWorld(true);
      const D = names[ai] === 'tummy' ? 0.22 : 0.13, zs = [];   // paws, ears and noses curve away sooner
      for (const [dx, dy] of [[D, 0], [-D, 0], [0, D], [0, -D]]) {
        const o = a.localToWorld(new T.Vector3(dx, dy, 0.5)), e = a.localToWorld(new T.Vector3(dx, dy, -0.5));
        ray.set(o, e.sub(o).normalize());
        const h = ray.intersectObjects(meshes, false).find((x) => x.face);
        zs.push(h ? Math.max(-0.4, Math.min(0.2, a.worldToLocal(h.point.clone()).z)) : -0.2);
      }
      a.userData.curve = { a: (zs[0] + zs[1]) / (2 * D * D), b: (zs[0] - zs[1]) / (2 * D), c: (zs[2] + zs[3]) / (2 * D * D), d: (zs[2] - zs[3]) / (2 * D) };
    }
    f.position.x = end; f.rotation.y = ry;
    f.updateMatrixWorld(true);
  }

  who() { return NAME[this.friend?.userData.kind] || 'friend'; }
  promptText() {
    const d = this.dirty()[0];
    if (!d) return '';
    if (this.level === 2 && !this.wet) return 'Dip, dip! Water first.';
    return `${MESS[this.mess].adj} ${WORD[d.name]}! Rub rub rub!`;
  }

  // called while the sponge is dragged: rubbing near a dirty spot cleans it
  rub() {
    const sp = this.sponge;
    const p = project(sp.position);
    const m = Math.min(window.innerWidth, window.innerHeight);
    if (this.level === 2 && !this.wet) {
      const b = project(BUCKET_POS.clone().setY(0.9));
      if (Math.hypot(p.x - b.x, p.y - b.y) < m * 0.13) this.dip();
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

  dip() {
    this.setWet(true);
    this.washedOnce = 0;
    sfx.splash();
    this.splashAt(BUCKET_POS.clone().setY(1.0), 10, 3.2);
    wiggle(this.s, this.water, 0.12, 0.4);
    this.say('Splash! Now rub!');
  }

  scrub(s, amt) {
    if (s.clean) return;
    const before = s.done;
    s.done = Math.min(this.need, s.done + amt);
    const p = s.done / this.need;
    setMessLook(s.obj, p, s.obj.userData.k);
    const now = performance.now();
    if (now - this.lastScrub > 120) { sfx.scrub(); this.lastScrub = now; }
    this.lastRub = now;
    // foam builds up as you rub
    const want = Math.ceil(p * FOAM_MAX);
    while (s.foam.length < want) this.addFoam(s);
    // the friend squirms and giggles: it tickles!
    this.tickle = 1;
    if (now - this.lastGiggle > 1100 && p < 1) {
      this.lastGiggle = now;
      sfx.giggle();
      const f = this.friend;
      setFace(f.userData.face, 'happy');
      fx.float(f.position.clone().add(new T.Vector3(1.2, 4.6, 0.5)), 'hee', { color: '#ff8fc0', size: 4.5 });
    }
    if (Math.floor(p * 4) > Math.floor((before / this.need) * 4)) { sfx.bubble(); this.shedCrumb(s.anchor.getWorldPosition(new T.Vector3())); }
    if (s.done >= this.need) this.cleaned(s);
  }

  addFoam(s) {
    const n = s.foam.length;
    const puff = makeFoam();
    const a = n * 2.4 + Math.random(), r = 0.1 + (n / FOAM_MAX) * 0.32;
    puff.position.set(Math.cos(a) * r * 1.2, Math.sin(a) * r, 0.22 + (n % 3) * 0.05);
    s.anchor.add(puff);
    s.foam.push(puff);
    popIn(this.s, puff, 1, 0.22, { sound: false });
  }

  dab(s) {
    if (this.busy || s.clean) return;
    const wp = s.anchor.getWorldPosition(new T.Vector3());
    this.holdSponge();
    this.s.tween(this.sponge.position, { x: wp.x + 0.3, y: wp.y + 0.2, z: wp.z + 0.8 }, 0.25, Ease.out);
    const amt = this.errorlessOn ? 1 : DAB[this.level];
    if (!amt || (this.level === 2 && !this.wet)) { wiggle(this.s, this.sponge, 0.3); return; }
    this.scrub(s, amt * this.need);
  }

  cleaned(s) {
    if (s.clean) return;
    s.clean = true;
    this.clearHints();
    if (s.tap) { input.remove(s.tap); s.tap = null; }
    s.anchor.remove(s.obj);
    const wp = s.anchor.getWorldPosition(new T.Vector3());
    // the foam turns into bubbles you can pop, and the clean spot sparkles
    s.foam.forEach((puff, i) => {
      const pw = puff.getWorldPosition(new T.Vector3());
      s.anchor.remove(puff);
      if (i % 3 === 0) this.addBubble(pw, 0.2 + Math.random() * 0.14);
    });
    s.foam = [];
    fx.confetti(wp, 10);
    sfx.note(this.spots.indexOf(s) * 2);
    sfx.sparkle();
    this.washedOnce++;
    if (this.level === 2 && this.washedOnce >= 2) this.setWet(false);
    const left = this.dirty();
    if (!left.length) return this.allClean();
    this.say(`Clean ${WORD[s.name]}! ${this.level === 2 && !this.wet ? 'Dip again!' : 'More!'}`);
    this.idle = 0;
  }

  // ---- bubbles ----
  addBubble(pos, r) {
    const b = makeSoapBubble(r);
    b.position.copy(pos);
    b.position.z += 0.5;
    this.root.add(b);
    b.userData.life = 3.2 + Math.random() * 1.2;
    b.userData.ph = Math.random() * 6;
    b.userData.vx = (Math.random() - 0.5) * 2.2;
    b.userData.r = r;
    this.bubbles.push(b);
    b.userData.k = r;
    popIn(this.s, b, r, 0.25, { sound: false });
  }
  popBubble(b, loud = true) {
    const i = this.bubbles.indexOf(b);
    if (i < 0) return;
    this.bubbles.splice(i, 1);
    if (loud) {
      sfx.pop();
      fx.confetti(b.position, 6);
      fx.float(b.position.clone(), '✦', { color: '#7fd0ff', size: 5 });
    }
    const k = b.userData.k * 1.6;
    this.s.tween(b.scale, { x: k, y: k, z: k }, 0.08).then(() => this.root.remove(b));
  }
  popAt(x, y) {
    if (this.dead) return false;
    let best = null, bd = Infinity;
    for (const b of this.bubbles) {
      const c = project(b.position);
      const r = Math.max(screenRadius(b.position, b.userData.r) * 1.6, Math.min(innerWidth, innerHeight) * 0.05);
      const d = Math.hypot(c.x - x, c.y - y) / r;
      if (d < 1 && d < bd) { bd = d; best = b; }
    }
    if (!best) return false;
    this.popBubble(best);
    return true;
  }

  // water drops fly out as real little balls, bounce on the sand, then dry up
  splashAt(pos, n = 14, up = 3.5) {
    n = Math.min(n, 14);
    for (let i = 0; i < n; i++) {
      const d = makeDrop();
      d.position.copy(pos).add(new T.Vector3((Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.4, 0.3));
      this.root.add(d);
      physics.add(d, { shape: 'ball', r: 0.09, bounce: 0.55, mass: 0.3 });
      const a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 3;
      physics.impulse(d, { x: Math.cos(a) * sp, y: up * (0.7 + Math.random() * 0.6), z: Math.abs(Math.sin(a)) * sp * 0.5 + 0.6 });
      this.s.wait(0.7 + Math.random() * 0.3).then(() => { physics.remove(d); return this.s.tween(d.scale, { x: 0.01, y: 0.01, z: 0.01 }, 0.2); }).then(() => this.root.remove(d));
    }
  }

  allClean() {
    if (this.level === 2) { this.showerT = 0.8; sfx.pour(); }   // a rinse from the beach shower
    this.busy = true;
    input.lock(1200);
    this.payoff = this.dryOff();
    this.busy = false;
    this.success(this.friend.position.clone().add(new T.Vector3(0, 3.5, 0))); // praise word only: keeps the next round close
  }

  // a different "all clean!" move each round: shake-dry, twirl, or a big splash-jump (called before the round moves on)
  async dryOff() {
    const k = this.round % 3;
    if (k === 0) return this.shakeDry();
    const f = this.friend;
    const snack = this.plan[this.round]?.[2] === 'snack';
    setFace(f.userData.face, 'happy');
    this.tickle = 0;
    f.rotation.z = 0;
    this.holdSponge();
    this.s.tween(this.sponge.position, { x: SPONGE_HOME.x, y: SPONGE_HOME.y, z: SPONGE_HOME.z }, 0.45, Ease.out);
    this.s.tween(this.sponge.scale, { x: 1, y: 1, z: 1 }, 0.3);
    if (k === 1) {
      // twirl with sparkles flying off
      sfx.twinkle();
      const r0 = f.rotation.y;
      for (let i = 0; i < 5; i++) this.s.wait(i * 0.1).then(() => fx.float(f.position.clone().add(new T.Vector3(Math.cos(i * 1.3) * 1.4, 1.5 + i * 0.5, 0.6)), '✨', { size: 5 }));
      await this.s.anim(0.6, (e) => { f.rotation.y = r0 + e * Math.PI * 2; f.position.y = Math.sin(e * Math.PI) * 0.5; }, Ease.inOut);
      f.rotation.y = r0; f.position.y = 0;
      sfx.land();
    } else {
      // jump up and land with a splash of drops
      await hop(this.s, f, 1.1, 0.5);
      sfx.splash();
      this.splashAt(f.position.clone().add(new T.Vector3(0, 0.3, 0.5)), 14, 2.5);
    }
    if (snack) await this.snack();
    else fx.float(f.position.clone().add(new T.Vector3(-0.9, 4.4, 0.5)), '♥', { color: '#ff5a7a', size: 6 });
  }

  // a slice of watermelon is thrown to the clean friend: chomp!
  async snack() {
    const f = this.friend;
    const apple = makeMelon(0.75);
    const from = new T.Vector3(-7, 1, 2), to = new T.Vector3(f.position.x + 0.9, 3.2, f.position.z + 1.2);
    apple.position.copy(from);
    this.root.add(apple);
    sfx.swoosh();
    await this.s.anim(0.35, (_, t) => { apple.position.lerpVectors(from, to, t); apple.position.y += 4 * 1.5 * t * (1 - t); apple.rotation.z = t * 6; });
    sfx.chomp();
    await this.s.tween(apple.scale, { x: 0.001, y: 0.001, z: 0.001 }, 0.15);   // chomped
    this.root.remove(apple);
    fx.float(f.position.clone().add(new T.Vector3(0.6, 4.2, 0.5)), '♥', { color: '#ff5a7a', size: 6 });
  }

  // the clean friend shakes itself dry like a puppy, then sparkles
  async shakeDry() {
    const f = this.friend;
    const snack = this.plan[this.round]?.[2] === 'snack'; // called before success() advances the round
    setFace(f.userData.face, 'happy');
    this.tickle = 0;
    f.rotation.z = 0;
    this.holdSponge();
    this.s.tween(this.sponge.position, { x: SPONGE_HOME.x, y: SPONGE_HOME.y, z: SPONGE_HOME.z }, 0.45, Ease.out);
    this.s.tween(this.sponge.scale, { x: 1, y: 1, z: 1 }, 0.3);
    // anticipation squash
    const SC = f.userData.baseScale;
    await this.s.anim(0.1, (_, p) => { const k = 1 - 0.12 * p; f.scale.set(SC / Math.sqrt(k), SC * k, SC / Math.sqrt(k)); });
    sfx.swoosh();
    sfx.splash();
    this.splashAt(f.position.clone().add(new T.Vector3(0, 2.4, 0.6)), 14, 3);
    const r0 = f.rotation.y;
    await this.s.anim(0.5, (_, p) => {
      const k = 1 - p, w = Math.sin(p * Math.PI * 12);
      f.rotation.y = r0 + w * 0.45 * k;
      const sq = 1 + Math.abs(w) * 0.07 * k;
      f.scale.set(SC * sq, SC / sq, SC * sq);
    });
    f.rotation.y = r0; f.scale.setScalar(SC);
    sfx.twinkle();
    fx.float(f.position.clone().add(new T.Vector3(-0.9, 4.4, 0.5)), '✨', { size: 6 });
    if (snack) await this.snack();
    else hop(this.s, f, 0.5, 0.35, { sound: true });
  }

  async afterSuccess() {
    if (this.payoff) await this.payoff;
    this.payoff = null;
    // the friend skips off, the messy prop goes too
    sfx.patter();
    const f = this.friend, c = this.cause;
    f.position.y = 0;
    f.rotation.y = 0.9;   // turns and walks off along the sand
    // (Level 3 steps back first, then walks off between the beach shower post at (6.4, -0.8), the palm at (10, -2.5) and the lantern at (8.6, -5.2))
    const zf = this.level === 2 ? -3.8 : 0, z0 = f.position.z;
    this.s.anim(1.1, (e) => { f.position.x = 10 * e; f.position.z = z0 + zf * Math.min(1, e / 0.4); }, Ease.in).then(() => this.root.remove(f));
    if (c) { physics.remove(c); popOut(this.s, c, 0.2).then(() => this.root.remove(c)); }
    for (const cr of this.crumbs.splice(0)) { physics.remove(cr); popOut(this.s, cr, 0.15).then(() => this.root.remove(cr)); }
    // let it get clear of the middle before the next friend walks in, so the two never pass through each other
    await this.s.wait(0.7);
  }

  // let go: the sponge falls with real physics, bounces and tumbles to rest (on the sand, the rock or the tub)
  dropSponge() {
    const sp = this.sponge;
    this.last = null;
    sp.scale.setScalar(1);
    const p = project(sp.position);
    if (p.x < 0 || p.x > window.innerWidth || p.y > window.innerHeight * 0.95) { this.s.tween(sp.position, { x: SPONGE_HOME.x, y: SPONGE_HOME.y, z: SPONGE_HOME.z }, 0.4, Ease.out); return; }
    physics.add(sp, { shape: 'box', bounce: 0.3, friction: 0.9 });
    physics.impulse(sp, { x: (Math.random() - 0.5) * 1.5, y: 0.5, z: 0 }, { x: 0, y: 0, z: (Math.random() - 0.5) * 1.5 });
  }

  // Level 3: the beach shower runs for a moment: drops fall from its rose and splash on its tray
  updateShower(dt) {
    const rose = this.station.userData.rose;
    if (!rose) return;
    if (this.showerT > 0) {
      if (Math.floor(this.showerT * 20) !== Math.floor((this.showerT - dt) * 20)) {
        const d = makeWaterDrop(0.07, 0x9fdcff);
        d.position.set(rose.x + (Math.random() - 0.5) * 0.5, rose.y, rose.z + (Math.random() - 0.5) * 0.5);
        d.userData.vy = -1.5;
        this.root.add(d);
        this.showerDrops.push(d);
        if (Math.random() < 0.2) sfx.bubble();
      }
      this.showerT -= dt;
    }
    for (let i = this.showerDrops.length - 1; i >= 0; i--) {
      const d = this.showerDrops[i];
      d.userData.vy -= dt * 14;
      d.position.y += d.userData.vy * dt;
      if (d.position.y < 0.12) { this.showerDrops.splice(i, 1); this.s.tween(d.scale, { x: d.scale.x * 2, y: 0.002, z: d.scale.z * 2 }, 0.12).then(() => this.root.remove(d)); }
    }
  }

  update(dt, t) {
    this.updateShower(dt);
    // squirm while being scrubbed
    const f = this.friend;
    if (f && this.tickle > 0) {
      this.tickle = Math.max(0, this.tickle - dt * 1.6);
      f.rotation.z = Math.sin(t * 22) * 0.07 * this.tickle;
      if (this.tickle === 0) f.rotation.z = 0;
    }
    // the sponge squishes while it rubs
    if (input.dragging() && performance.now() - (this.lastRub || 0) < 160) {
      const w = Math.sin(t * 34) * 0.1;
      this.sponge.scale.set(1.15 * (1 + w), 1.15 * (1 - w), 1.15);
    }
    // bubbles drift up and wobble
    for (const b of this.bubbles.slice()) {
      const u = b.userData;
      u.life -= dt;
      b.position.y += dt * 0.95;
      b.position.x += dt * (u.vx + Math.sin(t * 2 + u.ph) * 0.4);
      const w = 1 + Math.sin(t * 5 + u.ph) * 0.06;
      if (b.scale.x > u.k * 0.9 && b.scale.x < u.k * 1.2) b.scale.set(u.k * w, u.k / w, u.k);
      if (u.life <= 0 || b.position.y > 9) this.popBubble(b, false);
    }
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

  nudgeTarget() {
    if (this.level === 2 && !this.wet) return this.water || this.sponge;
    if (!this.dirty().length) return null;
    this.holdSponge();               // out of the physics world, so the hop shows
    return this.sponge;
  }

  makeErrorless() {
    // the sponge floats to the next spot and spots need half the rubbing
    this.need *= 0.5;
    if (this.level === 2) this.setWet(true);
    const d = this.dirty()[0];
    if (d) { const wp = d.anchor.getWorldPosition(new T.Vector3()); this.holdSponge(); this.s.tween(this.sponge.position, { x: wp.x + 0.6, y: wp.y, z: wp.z + 0.9 }, 0.6, Ease.inOut); }
  }

  nextRound() { this.need = NEED[this.level]; super.nextRound(); }

  onFinale() {
    // a shower of bubbles floats up; one giant bubble pops at the top
    for (let i = 0; i < 10; i++) this.addBubble(new T.Vector3(-5 + i * 1.1, 1 + Math.random() * 2, 1), 0.25 + Math.random() * 0.25);
    const b = makeSoapBubble(0.9);
    b.position.set(0, 3, 2);
    this.root.add(b);
    this.s.tween(b.position, { y: 7 }, 1.6, Ease.out).then(() => { sfx.pop(); fx.confetti(b.position, 30); this.root.remove(b); });
    hop(this.s, this.pip, 0.6);
  }
}
