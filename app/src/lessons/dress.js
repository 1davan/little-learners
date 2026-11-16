// Dress Monkey. Topics mt_83gRQ9OPkc "Body parts & senses" (where clothes go) and, at Level 3,
// mt_Dj2xr8CoI0 "Dressing for the weather".
// Monkey wants something (a picture bubble shows the bare body part glowing; the window shows the weather).
// Tap the wardrobe: the doors creak open and clothes hop out. Drag one onto Monkey: it snaps on with a puff and
// Monkey shows it off (every garment has its own move). Wrong body part → it bounces back with a gentle word.
// The outfit builds up through the level (a new hat knocks the old one off, with real physics). Last round:
// Monkey admires the outfit in the mirror and dances with its reflection.
import * as T from '../three.js';
import { Lesson, shuffle } from '../engine/lesson.js';
import { popIn, popOut, setFace, breathe } from '../engine/actors.js';
import { makeCreature, garmentProp, hasCreature } from '../engine/creature.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { physics } from '../engine/physics.js';
import { project, setCamera } from '../engine/stage.js';
import { mesh, geo } from '../engine/toon.js';
import { Ease } from '../engine/tween.js';
import { CLOTHES, SLOTS, PLANS, WEATHER, layerOf } from './dress-clothes.js';
import { makeRoom, makeBubble, setBubble, makeGlow, puff, makeRail, makeCard, RAIL, WALL_Z, MIRROR } from './dress-room.js';
import { MOVES, WANT, newPose } from './dress-moves.js';
import { msfx } from './dress-sound.js';

const MS = 1.7;                                    // Monkey's scale
const HOME = new T.Vector3(-2.6, 0, 1.2);          // where Monkey stands (on the rug)
const WARD = { pos: new T.Vector3(4.6, 0, -2.5), rot: -0.24, scale: 1.5 };
const BUBBLE_AT = new T.Vector3(-0.2, 4.6, 2.0);
// how a garment is turned for display (shoes three-quarters; the cape shows its back, where the cape is)
const SHOW_RY = { feet: -0.75, cape: 2.7 };
const showRy = (name) => SHOW_RY[name] ?? SHOW_RY[CLOTHES[name].slot] ?? 0;
const CAM = { pos: new T.Vector3(1.6, 3.5, 13.2), look: new T.Vector3(1.6, 2.75, 0) };
const DISC_Y = 2.75;                               // the backing discs on the rail hang at about Monkey's chest/face height
const COLD = new Set(['snowy', 'windy', 'rainy', 'night']);


// A garment as a free prop. Mittens come as a pair far apart (on the hands), so their two halves are pulled
// together for display (the halves share the template's buffers; the split index is cached and never disposed).
const splitCache = new Map();
function half(geo, side) {
  const key = geo.uuid + side;
  if (splitCache.has(key)) return splitCache.get(key);
  const idx = geo.index.array, x = geo.attributes.position;
  const out = [];
  for (let i = 0; i < idx.length; i += 3) {
    const cx = x.getX(idx[i]) + x.getX(idx[i + 1]) + x.getX(idx[i + 2]);
    if ((cx < 0) === (side < 0)) out.push(idx[i], idx[i + 1], idx[i + 2]);
  }
  const g = new T.BufferGeometry();
  for (const [k, a] of Object.entries(geo.attributes)) g.setAttribute(k, a);
  g.setIndex(out);
  g.userData.shared = true;
  g.userData.split = true;
  splitCache.set(key, g);
  return g;
}
// A shoe layer is only the shell that covers the monkey's foot, so on its own it reads as an empty bowl.
// Fill each one out into a whole little shoe: a sock-coloured foot inside, a sole, and a welly gets its tall leg.
const SHOE = { wellies: { fill: 0x2f8a3a, sole: 0x24642c, shaft: 0x3fae4a, cuff: 0x2f8a3a, tall: 1.5 }, sneakers: { fill: 0xffffff, sole: 0xf2efe9, shaft: 0xffffff, cuff: 0xff4b4b, tall: 0.55 } };
function fillShoe(h, name) {
  const look = SHOE[name] || SHOE.sneakers;
  const idx = h.geometry.index.array, pos = h.geometry.attributes.position;
  const b = new T.Box3(), v = new T.Vector3();
  for (let i = 0; i < idx.length; i++) b.expandByPoint(v.fromBufferAttribute(pos, idx[i]));
  const c = b.getCenter(new T.Vector3()), sz = b.getSize(new T.Vector3());
  const foot = mesh(geo.sphere(0.5, 16, 12), look.fill, { outline: 0 });
  foot.scale.set(sz.x * 0.9, sz.y * 0.9, sz.z * 0.9); foot.position.copy(c);
  const sole = mesh(geo.sphere(0.5, 18, 8), look.sole, { outline: 0.01 });
  sole.scale.set(sz.x * 1.08, Math.max(0.05, sz.y * 0.22), sz.z * 1.1); sole.position.set(c.x, b.min.y + sz.y * 0.06, c.z);
  h.add(foot, sole);
  if (look.shaft) {
    const H = sz.y * look.tall, r = Math.min(sz.x, sz.z) * 0.42;
    const shaft = mesh(geo.cyl(r, r * 0.92, H, 16), look.shaft, { outline: 0.012 });
    shaft.position.set(c.x, b.max.y - sz.y * 0.2 + H / 2, c.z - sz.z * 0.18);
    const top = mesh(geo.cyl(r * 1.08, r * 1.08, sz.y * 0.16, 16), look.cuff, { outline: 0.01 });
    top.position.set(0, H / 2, 0);
    shaft.add(top);
    h.add(shaft);
  }
}
// world-space box of the drawn (indexed) triangles under obj — the split mitten/shoe halves share their
// template's whole vertex buffer, so the usual Box3.setFromObject would measure the pair as one piece
function boxOf(obj) {
  const b = new T.Box3(), v = new T.Vector3();
  obj.updateMatrixWorld(true);
  obj.traverse((m) => {
    if (!m.isMesh || m.userData.outline || !m.visible) return;
    const pos = m.geometry.attributes.position, idx = m.geometry.index;
    const n = idx ? idx.count : pos.count;
    for (let i = 0; i < n; i += 3) b.expandByPoint(v.fromBufferAttribute(pos, idx ? idx.array[i] : i).applyMatrix4(m.matrixWorld));
  });
  return b;
}
// Fit a prop (scale + position) so its drawn shape fills a w×h box centred on `centre` (world; prop at the root).
function fitProp(p, w, h, maxK) {
  const pos0 = p.position.clone(), k0 = p.scale.x;
  p.position.set(0, 0, 0); p.scale.setScalar(1);
  const sz = boxOf(p).getSize(new T.Vector3());
  const k = Math.min(maxK, w / sz.x, h / sz.y);
  p.scale.setScalar(k);
  const c = boxOf(p).getCenter(new T.Vector3());
  p.position.copy(pos0); p.scale.setScalar(k0);
  return { k, off: c.negate() };      // place the prop at centre + off (at scale k) to centre it
}
function makeProp(name) {
  const p = garmentProp('monkey', layerOf(name));
  const slot = CLOTHES[name].slot;
  if (slot === 'hands') return mittenPair(p);
  if (slot !== 'feet') return p;
  // a pair shows as one snug object (shoes side by side)
  const inner = p.children[0], pull = 0.06;
  for (const c of [...inner.children]) {
    for (const sd of [-1, 1]) {
      const h = new T.Mesh(half(c.geometry, sd), c.material);
      h.position.copy(c.position); h.quaternion.copy(c.quaternion); h.scale.copy(c.scale);
      h.position.x -= sd * pull;
      h.userData.outline = c.userData.outline;
      h.userData.pull = -sd * pull;
      inner.add(h);
      if (slot === 'feet' && !c.userData.outline) fillShoe(h, name);
    }
    inner.remove(c);
  }
  p.userData.size.x -= pull * 2;
  return p;
}

// Mittens are worn out on the hands, pointing sideways with the openings facing each other (that read as a bikini
// top!). On the rail they stand up side by side like the 🧤 picture, fingers up, each with a white wool cuff.
// Each half sits in a pivot at its own centre; userData.rest/disp/rz let the drop slide them back to the worn pose.
function mittenPair(p) {
  const inner = p.children[0];
  const pivots = {};
  for (const c of [...inner.children]) {
    for (const sd of [-1, 1]) {
      const h = new T.Mesh(half(c.geometry, sd), c.material);
      h.position.copy(c.position); h.quaternion.copy(c.quaternion); h.scale.copy(c.scale);
      h.userData.outline = c.userData.outline;
      if (!pivots[sd]) {
        const pv = (pivots[sd] = new T.Group());
        h.updateMatrix();
        const b = new T.Box3(), v = new T.Vector3(), idx = h.geometry.index.array, pos = h.geometry.attributes.position;
        for (let i = 0; i < idx.length; i++) b.expandByPoint(v.fromBufferAttribute(pos, idx[i]).applyMatrix4(h.matrix));
        const ctr = b.getCenter(new T.Vector3()), sz = b.getSize(new T.Vector3());
        pv.userData.ctr = ctr;
        pv.userData.rest = ctr.clone();
        pv.userData.rz = sd * Math.PI / 2;
        pv.userData.disp = new T.Vector3(sd * (sz.y * 0.55 + 0.03), ctr.y, ctr.z);
        pv.position.copy(pv.userData.disp);
        pv.rotation.z = pv.userData.rz;
        // the wool cuff at the wrist end (towards the body before turning)
        const cuff = mesh(geo.cyl(Math.min(sz.y, sz.z) * 0.42, Math.min(sz.y, sz.z) * 0.42, sz.x * 0.26, 16), 0xffffff, { outline: 0.01 });
        cuff.rotation.z = Math.PI / 2;
        cuff.position.set(-sd * sz.x * 0.46, 0, 0);
        pv.add(cuff);
        inner.add(pv);
      }
      const pv = pivots[sd];
      h.position.sub(pv.userData.ctr);
      pv.add(h);
    }
    inner.remove(c);
  }
  return p;
}

// The wardrobe's outline shell, minus everything inside the cabinet (model space, bind pose; see wardrobe.py):
// a copy of the shared outline material that discards fragments whose rest position lies in the hollow.
function hideInnerOutline(w) {
  w.traverse((o) => {
    if (!o.isSkinnedMesh || !o.userData.outline || o.userData.innerCut) return;
    const src = o.material;
    const th = parseFloat(String(src.customProgramCacheKey?.() || '').replace('skin-outline', '')) || 0.028;
    const m = new T.MeshBasicMaterial({ color: src.color, side: T.BackSide });
    m.onBeforeCompile = (sh) => {
      sh.vertexShader = 'varying vec3 vRest;\n' + sh.vertexShader.replace('#include <begin_vertex>', `vec3 transformed = position + normal * ${th.toFixed(4)}; vRest = position;`);
      sh.fragmentShader = 'varying vec3 vRest;\n' + sh.fragmentShader.replace('void main() {', 'void main() {\n if (abs(vRest.x) < 1.23 && vRest.y > 0.33 && vRest.y < 3.03 && vRest.z > -0.55 && vRest.z < 0.64) discard;');
    };
    m.customProgramCacheKey = () => 'wardrobe-outline' + th;
    o.material = m;
    o.userData.innerCut = true;
  });
}

function doorHeart() {
  const s = new T.Shape();
  s.moveTo(0, -0.3);
  s.bezierCurveTo(-0.08, -0.2, -0.34, -0.05, -0.34, 0.12);
  s.bezierCurveTo(-0.34, 0.28, -0.12, 0.34, 0, 0.18);
  s.bezierCurveTo(0.12, 0.34, 0.34, 0.28, 0.34, 0.12);
  s.bezierCurveTo(0.34, -0.05, 0.08, -0.2, 0, -0.3);
  const geo = new T.ShapeGeometry(s, 16);
  const g = new T.Group();
  const ink = new T.Mesh(geo, new T.MeshBasicMaterial({ color: 0x3a2838, side: T.DoubleSide }));
  ink.scale.setScalar(1.1); ink.position.set(0, -0.005, -0.004);
  const h = new T.Mesh(geo, new T.MeshBasicMaterial({ color: 0xff8fbd, side: T.DoubleSide }));
  const shine = new T.Mesh(new T.CircleGeometry(0.05, 12), new T.MeshBasicMaterial({ color: 0xffd6e8 }));
  shine.position.set(-0.17, 0.15, 0.004);
  g.add(ink, h, shine);
  return g;
}

export default class DressLesson extends Lesson {
  build() {
    this.plan = PLANS[this.level];
    this.meadow.visible = false;
    this.room = makeRoom();
    this.root.add(this.room.group);
    physics.box(new T.Vector3(0, 6, WALL_Z - 0.5), new T.Vector3(44, 12, 1));
    physics.box(new T.Vector3(-9.5, 6, 0), new T.Vector3(1, 12, 20));
    physics.box(new T.Vector3(9.5, 6, 0), new T.Vector3(1, 12, 20));
    // Pip watches from the front corner
    setCamera(CAM.pos, CAM.look);
    this.pip.position.set(-4.75, 0, 0.2);
    this.pip.rotation.y = 0.6;
    // Monkey
    const m = (this.monkey = makeCreature('monkey'));
    m.scale.setScalar(MS);
    m.userData.baseScale = MS;
    m.position.copy(HOME);
    this.baseRot = 0.12;
    this.root.add(m);
    const u = m.userData;
    this.rest = { arms: (u.arms || []).map((b) => b.rotation.clone()), legs: ['legL', 'legR'].map((k) => u.bones[k]?.rotation.clone()) };
    this.P = newPose();
    this.worn = {};
    this.tickle = input.addTap(m, { radius: 1.5, offset: new T.Vector3(0, 2.2, 0), onTap: () => this.tickleMonkey() });
    // the wardrobe
    const w = (this.wardrobe = makeCreature('wardrobe'));
    w.position.copy(WARD.pos); w.rotation.y = WARD.rot; w.scale.setScalar(WARD.scale);
    this.root.add(w);
    this.doors = [w.userData.bones.doorL, w.userData.bones.doorR];
    // a crisp pink heart on each door (a flat decal riding on the door bone)
    this.doors.forEach((d, i) => { if (d) { const h = doorHeart(); h.position.set(i ? -0.64 : 0.64, 1.86, 0.075); d.add(h); } });
    this.doorAmt = 0;
    // no ink inside the open cabinet: the outline shell of the inner walls showed through as scribbles
    hideInnerOutline(w);
    // the clothes rail (rolls in when the wardrobe opens)
    this.rail = makeRail();
    this.rail.position.set(0, 0, RAIL.z);
    this.rail.visible = false;
    this.root.add(this.rail);
    this.wardTap = input.addTap(w, { radius: 2.3, offset: new T.Vector3(0, 2.6, 0.6), onTap: () => this.open() });
    // bubble + glows
    this.bubble = makeBubble();
    this.bubble.position.copy(BUBBLE_AT);
    this.root.add(this.bubble);
    this.glows = [makeGlow(), makeGlow()];
    for (const g of this.glows) { g.visible = false; this.root.add(g); }
    this.choices = [];
    this.tumbling = [];
    this.phase = 'idle';
    // the reflection (only shown in the final mirror dance)
    this.mirrorMonkey = null;
    // Level 3 starts in a plain room; Level 1/2 too. The first weather comes with round 1.
    this.room.setWeather(this.plan[0].weather);
  }

  // ---------------- helpers ----------------
  at(x = 0, y = 0, z = 0) { return this.monkey.position.clone().add(new T.Vector3(x, y, z)); }
  kick(x, y, z) { this.monkey.userData.kick?.(new T.Vector3(x, y, z)); }
  get slot() { return this.spec?.ask; }
  get want() { return this.spec?.want; }
  zone() { return { id: 'monkey', obj: this.monkey, pos: this.at(0, 2.1, 0.3), radius: 2.0 }; }
  anchorWorld(name) {
    const a = this.monkey.userData.anchors[name];
    if (!a) return this.at(0, 2, 0);
    return this.monkey.localToWorld(new T.Vector3(a[0], a[1], a[2] + 0.05));
  }
  isRight(name) { const g = CLOTHES[name]; return g.slot === this.slot && (!this.want || this.want === name); }

  // ---------------- rounds ----------------
  async startRound(r) {
    this.busy = true;
    const spec = (this.spec = this.plan[r]);
    // tidy up: last round's leftovers hop back into the wardrobe, doors shut, fallen clothes vanish
    this.clearChoices();
    for (const t of this.tumbling) { physics.remove(t); popOut(this.s, t, 0.2).then(() => this.root.remove(t)); }
    this.tumbling = [];
    if (this.doorAmt > 0) { await this.wait(0.12); await this.swingDoors(0, 0.2); sfx.thunk(); }
    this.phase = 'closed';
    // the weather changes outside
    if (this.room.kind !== spec.weather) { sfx.swoosh(); this.room.setWeather(spec.weather); }
    // what Monkey wants: picture bubble + glow on the body part + a gesture
    const icon = this.level === 2 || spec.want ? WEATHER[spec.weather].icon : SLOTS[spec.ask].icon;
    // a named garment: its own little 3-D picture in the bubble; otherwise the picture monkey with the part ringed
    setBubble(this.bubble, SLOTS[spec.ask].part, icon, !!spec.want);
    this.setBubbleGarment(spec.want);
    popIn(this.s, this.bubble, this.bubble.userData.size, 0.4, { sound: false });
    sfx.bloop(4);
    this.glowOn = true;
    this.gesture();
    await this.wait(0.1);
    this.busy = false;
    if (r === 0 && !this.demoDone) this.cue(); // words + the one demo: tap the wardrobe (then the move shows itself)
    else this.prompt();
  }
  setBubbleGarment(name) {
    if (this.bubbleProp) { this.bubble.remove(this.bubbleProp); this.bubbleProp = null; }
    if (!name) return;
    const p = makeProp(name);
    const tilt = CLOTHES[name].slot === 'feet' || CLOTHES[name].slot === 'legs' ? 0.35 : 0.12;
    p.userData.ry = showRy(name);
    p.rotation.set(tilt, p.userData.ry, 0);
    const fit = fitProp(p, 0.62, 0.58, 10);
    p.scale.setScalar(fit.k);
    p.position.copy(fit.off).add(new T.Vector3(0, 0.02, 0.3));
    this.bubble.add(p);
    this.bubbleProp = p;
  }
  gesture() {
    const spec = this.spec;
    if (!spec) return;
    this.wanting = WANT[spec.ask](this, COLD.has(spec.weather));
  }
  promptText() {
    const spec = this.spec;
    if (!spec) return '';
    return spec.say;
  }
  prompt() {
    this.say(this.promptText(), { max: 1.5 });
    // re-shown cue: Monkey gestures again and the bubble wobbles
    if (this.phase === 'closed' || this.phase === 'open') {
      const b = this.bubble, k = b.userData.size;
      this.s.anim(0.5, (_, p) => { const w = 1 + Math.sin(p * Math.PI * 4) * 0.08 * (1 - p); b.scale.set(k * w, k / w, 1); });
      if (this.idle > 1) this.gesture();
    }
  }

  // ---------------- the wardrobe ----------------
  swingDoors(to, dur = 0.4) {
    const from = this.doorAmt;
    return this.s.anim(dur, (e) => { this.doorAmt = from + (to - from) * e; }, to > from ? Ease.back : Ease.in);
  }
  async open() {
    if (this.phase !== 'closed' || this.busy || this.dead) {
      if (this.phase === 'open') { sfx.bloop(1); this.wobbleWardrobe(); }
      return;
    }
    this.phase = 'opening';
    this.busy = true;
    this.idle = 0;
    fx.clearHands();
    msfx.creak();
    this.wobbleWardrobe();
    this.swingDoors(1, 0.42);
    await this.wait(0.12);
    // the clothes for this round hop out, one after another
    const spec = this.spec;
    const names = shuffle([...spec.right, ...spec.wrong]);
    // never put a right one in the same place twice running
    const n = names.length;
    const spots = this.spots(n);
    const from = this.wardrobe.localToWorld(new T.Vector3(0, 1.9, 0.3));
    this.showRail(true);
    this.choices = names.map((name, i) => this.makeChoice(name, spots[i], from, i));
    this.cards = this.choices.map((c) => c.userData.card);
    await this.wait(0.12 + n * 0.09 + 0.3);
    if (this.dead) return;
    this.phase = 'open';
    this.busy = false;
    this.idle = 0;
    if (this.errorlessOn) this.makeErrorless();
  }
  showRail(on) {
    const r = this.rail;
    this.s.stop(r.scale);
    if (on) {
      r.visible = true;
      r.scale.set(1, 0.01, 1);
      sfx.swoosh();
      this.s.tween(r.scale, { y: 1 }, 0.3, Ease.back);
    } else if (r.visible) this.s.tween(r.scale, { y: 0.01 }, 0.22, Ease.in).then(() => { r.visible = false; });
  }
  wobbleWardrobe() {
    const w = this.wardrobe, k = WARD.scale;
    this.s.anim(0.4, (_, p) => { const q = 1 + Math.sin(p * Math.PI * 3) * 0.05 * (1 - p); w.scale.set(k / Math.sqrt(q), k * q, k / Math.sqrt(q)); }).then(() => w.scale.setScalar(k));
  }
  // the hooks on the rail (x positions); every choice hangs in front of its own light disc
  spots(n) {
    const xs = { 2: [2.9, 5.5], 3: [1.6, 4.2, 6.8], 4: [1.3, 3.25, 5.2, 7.15] }[n] || [1.3, 3.25, 5.2, 7.15];
    return xs.map((x) => new T.Vector3(x, DISC_Y, RAIL.z));
  }
  makeChoice(name, spot, from, i) {
    const g = CLOTHES[name];
    const p = makeProp(name);
    const s = p.userData.size;
    const ud = p.userData;
    const tilt = g.slot === 'feet' ? 0.35 : g.slot === 'head' ? 0.3 : g.slot === 'legs' ? 0.3 : 0.12;
    ud.ry = showRy(name);
    p.rotation.set(tilt, ud.ry, 0);
    // big and upright, facing us, filling its backing disc (up to twice the worn size, so glasses read too)
    const fit = fitProp(p, 1.55, 1.45, MS * 2);
    const k = fit.k;
    const c = spot.clone().add(fit.off).add(new T.Vector3(0, 0, 0.4));
    Object.assign(ud, { name, slot: g.slot, spot: c, k, idx: i, garment: layerOf(name), tilt });
    // its backing card hangs from the rail
    const card = (ud.card = makeCard(RAIL.y - spot.y));
    card.position.set(spot.x, RAIL.y, RAIL.z);
    card.scale.setScalar(0.01);
    this.root.add(card);
    this.s.wait(0.05 + i * 0.09).then(() => this.s.tween(card.scale, { x: 1, y: 1, z: 1 }, 0.3, Ease.back));
    p.position.copy(from);
    p.scale.setScalar(0.01);
    this.root.add(p);
    ud.busy = true;
    this.s.wait(0.05 + i * 0.09).then(() => {
      sfx.bloop(i * 2);
      const a = from.clone(), b = ud.spot.clone(), r0 = Math.random() < 0.5 ? -1 : 1;
      this.s.anim(0.42, (e, q) => {
        p.position.lerpVectors(a, b, e);
        p.position.y += Math.sin(q * Math.PI) * 1.4;
        p.rotation.y = ud.ry + (1 - e) * Math.PI * 2 * r0;
        p.scale.setScalar(Math.max(0.01, k * Math.min(1, q * 2)));
      }, Ease.out).then(() => {
        msfx.flop();
        this.squash(p, k);
        ud.busy = false;
      });
    });
    ud.drag = input.addDrag(p, {
      radius: 0.9, minY: 0, offset: new T.Vector3(0, s.y * k * 0.5, 0),
      zones: () => (ud.enabled === false ? [] : [this.zone()]),
      onPick: () => this.onPick(p),
      onMove: (_t, z) => this.onHover(z),
      onDrop: (z, info) => this.drop(p, z, info),
    });
    return p;
  }
  squash(p, k, amt = 0.25) {
    return this.s.anim(0.3, (_, q) => { const sq = 1 - Math.sin(q * Math.PI) * amt * (1 - q * 0.5); p.scale.set(k / Math.sqrt(sq), k * sq, k / Math.sqrt(sq)); }).then(() => p.scale.setScalar(k));
  }
  async clearChoices() {
    const list = this.choices;
    this.choices = [];
    for (const c of this.cards || []) popOut(this.s, c, 0.18).then(() => this.root.remove(c));
    this.cards = [];
    this.showRail(false);
    if (!list.length) return;
    const into = this.wardrobe.localToWorld(new T.Vector3(0, 1.9, 0.0));
    list.forEach((p, i) => {
      input.remove(p.userData.drag);
      p.userData.busy = true;
      const a = p.position.clone(), k = p.scale.x;
      this.s.wait(i * 0.05).then(() => this.s.anim(0.3, (e) => {
        p.position.lerpVectors(a, into, e); p.position.y += Math.sin(e * Math.PI) * 1.2;
        p.scale.setScalar(Math.max(0.01, k * (1 - e * 0.9)));
      }, Ease.in)).then(() => this.root.remove(p));
    });
    sfx.swoosh();
    await this.wait(0.3 + list.length * 0.05);
  }

  // ---------------- dragging ----------------
  onPick(p) {
    const ud = p.userData;
    this.carrying = p;
    ud.busy = true;
    this.s.stop(p.scale);
    p.rotation.y = 0;
    this.s.tween(p.scale, { x: ud.k * 1.12, y: ud.k * 1.12, z: ud.k * 1.12 }, 0.15, Ease.back);
    msfx.hmm();
  }
  onHover(z) {
    const on = !!z;
    if (on === this.hovering) return;
    this.hovering = on;
    if (on) {
      sfx.tick();
      setFace(this.monkey.userData.face, 'scared');                     // big round "ooh?" eyes
      this.s.wait(0.5).then(() => { if (!this.hovering && this.monkey.userData.face) setFace(this.monkey.userData.face, 'happy'); });
    } else setFace(this.monkey.userData.face, 'happy');
  }
  goBack(p) {
    const ud = p.userData;
    ud.busy = true;
    const a = p.position.clone(), b = ud.spot;
    return this.s.anim(0.4, (e, q) => { p.position.lerpVectors(a, b, e); p.position.y += Math.sin(q * Math.PI) * 1.0; }, Ease.out)
      .then(() => { p.scale.setScalar(ud.k); msfx.flop(); return this.squash(p, ud.k, 0.18); })
      .then(() => { ud.busy = false; });
  }

  put(choice) { return this.drop(choice, this.zone(), { tapped: false }); } // test hook: drop a choice on Monkey

  async drop(p, zone, { tapped } = {}) {
    const ud = p.userData;
    this.carrying = null;
    this.hovering = false;
    if (this.busy || this.dead || this.phase !== 'open') { this.goBack(p); return; }
    if (!zone) {
      this.goBack(p);
      if (tapped) { sfx.bloop(3); fx.float(p.position.clone().add(new T.Vector3(0, 1.4, 0)), '♪', { color: CLOTHES[ud.name].col, size: 5 }); }
      return;
    }
    const name = ud.name, g = CLOTHES[name];
    if (!this.isRight(name)) {
      this.goBack(p);
      // Monkey shakes its head and giggles: "not there!"
      msfx.chatter();
      this.s.anim(0.55, (_, q) => { this.P.headY = Math.sin(q * Math.PI * 4) * 0.35 * (1 - q); }).then(() => { this.P.headY = 0; });
      const spec = this.spec;
      const find = spec.want ? `Find the ${CLOTHES[spec.want].word}!` : `Find ${SLOTS[spec.ask].kind}!`;
      const why = g.slot !== spec.ask ? (g.go || SLOTS[g.slot].go) : (spec.why?.[name] || `That's the ${g.word}.`);
      // one short line: the reason and the redirect together only when they fit
      this.redirect(why.length + find.length < 31 ? `${why} ${find}` : why);
      return;
    }
    // ---- right! it snaps on ----
    this.busy = true;
    input.lock(900);
    this.phase = 'dressed';
    this.glowOn = false;
    for (const c of this.choices) input.remove(c.userData.drag);
    this.choices = this.choices.filter((c) => c !== p);
    const old = this.worn[g.slot];
    // fly into the worn place (the prop's origin is the garment's bottom centre in the monkey's rest pose)
    const inner = p.children[0];
    const local = new T.Vector3(-inner.position.x, -inner.position.y, -inner.position.z);
    const target = this.monkey.localToWorld(local.clone());
    const a = p.position.clone(), k0 = p.scale.x, r0 = p.rotation.y, rz0 = p.rotation.z, rx0 = p.rotation.x;
    for (const h of inner.children) h.userData.x0 = h.position.x;
    const cuffs = [];
    inner.traverse((o) => { if (o.isMesh && o.parent.userData.rz && !o.geometry.userData.split) cuffs.push(o); });
    this.P.headX = 0; this.P.headY = 0;
    await this.s.anim(0.2, (e) => {
      p.position.lerpVectors(a, target, e);
      p.scale.setScalar(k0 + (MS - k0) * e);
      p.rotation.y = r0 + (this.monkey.rotation.y - r0) * e;
      p.rotation.z = rz0 * (1 - e);
      p.rotation.x = rx0 * (1 - e);
      for (const h of inner.children) {
        if (h.userData.pull) h.position.x = h.userData.x0 + h.userData.pull * e;
        if (h.userData.rest) { h.position.lerpVectors(h.userData.disp, h.userData.rest, e); h.rotation.z = h.userData.rz * (1 - e); }
      }
      for (const c of cuffs) c.scale.setScalar(Math.max(0.01, 1 - e));
    }, Ease.inOut);
    if (old) this.tumble(old);
    this.root.remove(p);
    this.monkey.userData.wear(layerOf(name), true);
    this.worn[g.slot] = name;
    const mid = this.anchorWorld(SLOTS[g.slot].anchors[0]);
    puff(this.s, this.root, mid, 0.9);
    msfx.puff();
    sfx.sparkle();
    const sc = project(mid);
    fx.sparkle(sc.x, sc.y);
    popOut(this.s, this.bubble, 0.2);
    this.kick(0, 3, 0);
    // Monkey's own move for this garment, then the usual praise (names the garment)
    this.react = MOVES[g.move](this);
    this.s.wait(0.15).then(() => msfx.ooh());
    this.busy = false;
    const word = g.word[0].toUpperCase() + g.word.slice(1);
    this.success(this.at(0, 3.8, 0.5), `${word}!`);
  }

  // the garment that was on falls off with real physics (a toddler-pleasing tumble)
  tumble(name) {
    const L = layerOf(name);
    this.monkey.userData.wear(L, false);
    const p = garmentProp('monkey', L);
    if (!p) return;
    const inner = p.children[0];
    const local = new T.Vector3(-inner.position.x, -inner.position.y, -inner.position.z);
    p.position.copy(this.monkey.localToWorld(local));
    p.rotation.y = this.monkey.rotation.y;
    p.scale.setScalar(MS);
    this.root.add(p);
    this.tumbling.push(p);
    msfx.whee();
    if (physics.ok) {
      physics.add(p, { shape: 'box', bounce: 0.45, friction: 0.8 });
      physics.impulse(p, { x: -2.2 - Math.random(), y: 6.5, z: 2.2 }, { x: (Math.random() - 0.5) * 0.6, y: 0.3, z: 0.7 });
    } else {
      const a = p.position.clone();
      this.s.anim(0.6, (e, q) => { p.position.set(a.x - e * 2.5, Math.max(0, a.y + q * 4 - q * q * 8), a.z + e * 1.5); p.rotation.z = e * 2; });
    }
    delete this.worn[CLOTHES[name].slot];
  }

  async afterSuccess() {
    if (this.react) await this.react;
    this.react = null;
    this.P = Object.assign(this.P, newPose());
    if (this.round >= this.totalRounds) await this.mirrorDance();
  }

  tickleMonkey() {
    if (this.dead || this.react || this.tickling) return;
    this.tickling = true;
    msfx.chatter();
    this.kick(2, 3, 0);
    const f = this.monkey.userData.face;
    if (f) { setFace(f, 'scared'); this.s.wait(0.5).then(() => setFace(f, 'happy')); }
    this.s.anim(0.5, (_, p) => { this.P.y = Math.sin(p * Math.PI) * 0.5; this.P.tilt = Math.sin(p * Math.PI * 4) * 0.12; })
      .then(() => { this.P.y = 0; this.P.tilt = 0; this.tickling = false; sfx.land(); });
  }

  // ---------------- the mirror finale ----------------
  async mirrorDance() {
    const m = this.monkey;
    // tidy the room first: leftovers hop back into the wardrobe, fallen clothes vanish, doors shut
    this.clearChoices();
    for (const t of this.tumbling) { physics.remove(t); popOut(this.s, t, 0.2).then(() => this.root.remove(t)); }
    this.tumbling = [];
    this.swingDoors(0, 0.3).then(() => sfx.thunk());
    // Pip hops out of the way so the mirror is in full view
    const pp = this.pip.position, p0 = pp.clone();
    this.s.anim(0.5, (e, q) => { pp.set(p0.x + (0.6 - p0.x) * e, Math.sin(q * Math.PI) * 0.6, p0.z + (2.6 - p0.z) * e); }, Ease.inOut).then(() => { pp.y = 0; this.pip.rotation.y = -0.5; });
    const r = (this.mirrorMonkey = makeCreature('monkey'));
    r.scale.setScalar(MS);
    for (const k of Object.keys(m.userData.layers)) r.userData.wear(k, m.userData.layers[k].mesh.visible);
    // the mirror Monkey stands just behind the glass, facing out, mirrored (a toddler-friendly mirror: you see its face)
    r.position.set(MIRROR.x, 0, WALL_Z - 1.6);
    r.scale.set(-MS, MS, MS);
    r.visible = false;
    this.root.add(r);
    const pairs = [];
    const rb = r.userData.bones;
    for (const [k, b] of Object.entries(m.userData.bones)) if (rb[k] && !/^(tail|ear|tuft|mane)/.test(k)) pairs.push([b, rb[k]]);
    this.reflPairs = pairs;
    // walk to the mirror (little hops), turn to face it
    const a = m.position.clone(), b = new T.Vector3(MIRROR.x + 2.4, 0, WALL_Z + 2.6);
    const face = Math.atan2(MIRROR.x - b.x, WALL_Z - b.z);   // turn to look into the mirror
    sfx.patter();
    msfx.ooh();
    await this.s.anim(0.7, (e, q) => {
      m.position.lerpVectors(a, b, e);
      this.P.y = Math.abs(Math.sin(q * Math.PI * 3)) * 0.35;
      this.baseRot = 0.12 + (face - 0.12) * Ease.inOut(q);
    }, Ease.inOut);
    this.P.y = 0;
    // the glass clears: there's Monkey!
    const gl = this.room.glass;
    r.visible = true;
    sfx.twinkle();
    this.s.tween(gl.material, { opacity: 0.12 }, 0.3);
    await this.wait(0.2);
    msfx.ooh();
    fx.float(new T.Vector3(MIRROR.x, 5.6, WALL_Z + 0.5), '♥', { color: '#ff3d7f', size: 7 });
    const f = m.userData.face;
    if (f) setFace(f, 'scared');
    await this.wait(0.3);
    if (f) setFace(f, 'happy');
    // dance together
    sfx.note(0); this.s.wait(0.25).then(() => sfx.note(4)); this.s.wait(0.5).then(() => sfx.note(7));
    await this.s.anim(1.0, (_, p) => {
      this.P.y = Math.abs(Math.sin(p * Math.PI * 4)) * 0.45;
      this.P.armL = 2.2 * Math.max(0, Math.sin(p * Math.PI * 4));
      this.P.armR = 2.2 * Math.max(0, -Math.sin(p * Math.PI * 4));
      this.P.tilt = Math.sin(p * Math.PI * 4) * 0.12;
    });
    Object.assign(this.P, newPose());
  }
  onFinale() {
    const m = this.monkey;
    msfx.ooh();
    this.s.anim(2.4, (_, p) => {
      this.P.y = Math.abs(Math.sin(p * Math.PI * 8)) * 0.4;
      this.P.armL = this.P.armR = 1.6 + Math.sin(p * Math.PI * 16) * 0.6;
      this.P.spin = p < 0.4 ? Ease.inOut(p / 0.4) * Math.PI * 2 : 0;
    }).then(() => Object.assign(this.P, newPose()));
  }

  // ---------------- hints ----------------
  nudgeTarget() {
    if (this.phase === 'closed') return this.wardrobe;
    if (this.phase !== 'open') return null;
    return this.choices.find((c) => this.isRight(c.userData.name) && !c.userData.busy) || null;
  }
  showHint(glow = true) {
    if (this.phase === 'closed') {
      fx.ghostPath([this.wardrobe.localToWorld(new T.Vector3(0, 1.75, 0.9))], { mode: 'tap' });
      return;
    }
    const p = this.choices.find((c) => this.isRight(c.userData.name));
    if (!p) return;
    if (glow) this.addHalo(p, 1.1);
    fx.ghostPath([p.position.clone().add(new T.Vector3(0, 0.6, 0)), this.zone().pos], { mode: 'drag' });
  }
  demoL3() {
    if (this.phase === 'closed') return this.showHint(false);
    const p = this.choices[0];
    if (!p) return;
    const a = p.position.clone().add(new T.Vector3(0, 0.6, 0));
    fx.ghostPath([a, a.clone().add(new T.Vector3(-1.2, 1.6, 0))], { mode: 'drag' });
  }
  makeErrorless() {
    if (this.phase === 'closed') { this.open(); return; }
    for (const c of this.choices) {
      if (this.isRight(c.userData.name)) { this.addHalo(c, 1.1); continue; }
      c.userData.enabled = false;
      input.remove(c.userData.drag);
      const k = c.userData.k * 0.6;
      c.userData.k = k;
      this.s.tween(c.scale, { x: k, y: k, z: k }, 0.4);
    }
  }

  // ---------------- every frame ----------------
  update(dt, t) {
    const m = this.monkey, u = m.userData, P = this.P;
    this.room.update(dt, t);
    breathe(m, t, 0.7);
    // pose → rig
    const ra = this.rest.arms;
    if (u.arms) {
      u.arms[0].rotation.set(ra[0].x + P.armLx, ra[0].y, ra[0].z + P.armL);
      u.arms[1].rotation.set(ra[1].x + P.armRx, ra[1].y, ra[1].z - P.armR);
    }
    ['legL', 'legR'].forEach((k, i) => { const b = u.bones[k], r = this.rest.legs[i]; if (b && r) b.rotation.set(r.x + (i ? P.legR : P.legL), r.y, r.z); });
    // the head follows what you carry
    let look = 0;
    if (this.carrying && input.dragging()) look = Math.max(-0.6, Math.min(0.6, (this.carrying.position.x - m.position.x) * 0.12));
    this.lookY = (this.lookY || 0) + (look - (this.lookY || 0)) * Math.min(1, dt * 6);
    if (u.head) {
      u.head.rotation.x = P.headX + (this.carrying ? 0.1 : 0);
      u.head.rotation.y = P.headY + this.lookY;
      u.head.rotation.z += P.headZ;
    }
    m.rotation.y = this.baseRot + P.spin;
    m.rotation.z = P.tilt;
    m.rotation.x = P.lean;
    m.position.y = P.y;
    const sq = P.sq;
    m.scale.set(MS / Math.sqrt(sq), MS * sq, MS / Math.sqrt(sq));
    // the wardrobe doors
    if (this.doors[0]) { this.doors[0].rotation.y = -1.95 * this.doorAmt; this.doors[1].rotation.y = 1.95 * this.doorAmt; }
    // closed wardrobe invites a tap: a little jiggle every couple of seconds
    if (this.phase === 'closed' && !this.busy) {
      const w = this.wardrobe, ph = t % 2.6;
      w.rotation.z = ph < 0.5 ? Math.sin(ph / 0.5 * Math.PI * 3) * 0.025 * (1 - ph / 0.5) : 0;
    } else this.wardrobe.rotation.z = 0;
    // clothes on the rail turn and sway a little on their hooks
    for (const c of this.choices) {
      const ud = c.userData;
      if (ud.card) ud.card.rotation.z = Math.sin(t * 1.3 + ud.idx * 1.7) * 0.025;
      if (ud.busy || (this.carrying === c)) continue;
      c.rotation.y = ud.ry + Math.sin(t * 0.9 + ud.idx) * 0.3;
    }
    if (this.bubbleProp) this.bubbleProp.rotation.y = this.bubbleProp.userData.ry + Math.sin(t * 1.2) * 0.4;
    // body-part glow on Monkey + bubble bob
    const spec = this.spec;
    const parts = spec && this.glowOn ? SLOTS[spec.ask].anchors : [];
    this.glows.forEach((g, i) => {
      g.visible = !!parts[i];
      if (!g.visible) return;
      g.position.copy(this.anchorWorld(parts[i]));
      const k = (spec.ask === 'body' ? 1.5 : spec.ask === 'legs' ? 1.5 : spec.ask === 'head' ? 1.6 : 1.0) * (1 + Math.sin(t * 5) * 0.1);
      g.scale.setScalar(k);
      // soft: it marks the spot without washing out what Monkey already wears
      g.material.opacity = 0.2 + Math.sin(t * 5) * 0.08;
    });
    if (this.bubble.visible && this.phase !== 'dressed') this.bubble.position.y = BUBBLE_AT.y + Math.sin(t * 2.2) * 0.1;
    // the reflection copies Monkey, mirrored in the wall
    const r = this.mirrorMonkey;
    if (r && r.visible) {
      for (const [a, b] of this.reflPairs) { b.quaternion.copy(a.quaternion); b.position.copy(a.position); b.scale.copy(a.scale); }
      r.position.y = m.position.y;
      r.rotation.set(m.rotation.x, P.spin, -m.rotation.z);
      r.scale.set(-m.scale.x, m.scale.y, m.scale.z);
      const fe = u.face?.userData?.emotion, rf = r.userData.face;
      if (rf && fe && rf.userData.emotion !== fe) setFace(rf, fe);
    }
  }
}
