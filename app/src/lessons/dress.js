// Dress Monkey. Topics mt_83gRQ9OPkc "Body parts & senses" (where clothes go) and, at Level 3,
// mt_Dj2xr8CoI0 "Dressing for the weather".
// A level dresses Monkey in ONE whole outfit (sunny day / party / snowy day), one garment per round.
// The wardrobe stands open all game. Each round: Monkey points at the next bare body part (thought bubble with the
// real garment in it; on Levels 1-2 the part glows too) and ONE garment hops out of the wardrobe onto the rail, on its
// own wooden hanger. Drag it onto Monkey: it is pulled on (0.6 s, one soft cloth sound) and Monkey shows it off (every
// garment has its own move). The grab area is the whole garment, the drop area all of Monkey plus a wide margin.
// Level 1: anywhere on Monkey, or just tap it. Levels 2-3: it must land on the right body part (judged generously);
// a wrong part bounces it back with a gentle word and a hand demo; a tap only wiggles it and repeats the prompt.
// The emptied hanger slides to the end of the rail, so the rail shows how far the outfit has come.
// Head to toe dressed -> Monkey walks to the mirror; "Look what you made!" frames him (three-quarter, face to the
// child) beside his reflection, and each poke strikes one of his outfit's poses, which the reflection copies.
import * as T from '../three.js';
import { Lesson } from '../engine/lesson.js';
import { popIn, popOut, setFace, breathe } from '../engine/actors.js';
import { voiceKey } from '../engine/speech.js';
import { makeCreature, garmentProp, hasCreature } from '../engine/creature.js';
import { input } from '../engine/input.js';
import { sfx, hushEffects } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { project, setCamera, screenRadius } from '../engine/stage.js';
import { mesh, geo } from '../engine/toon.js';
import { Ease } from '../engine/tween.js';
import { CLOTHES, SLOTS, PLANS, WEATHER, layerOf } from './dress-clothes.js';
import { makeRoom, makeBubble, setBubble, makeGlow, makeRail, makeHanger, makeClip, HANGER, RAIL, WALL_Z, MIRROR } from './dress-room.js';
import { MOVES, WANT, newPose } from './dress-moves.js';
import { msfx } from './dress-sound.js';

const MS = 1.7;                                    // Monkey's scale
const HOME = new T.Vector3(-2.6, 0, 1.2);          // where Monkey stands (on the rug)
const WARD = { pos: new T.Vector3(4.6, 0, -2.5), rot: -0.24, scale: 1.5 };
// up and to the right of Monkey's head, clear of the caption (even a long one), the Go! badge and the home button;
// the trail of dots runs down-left toward his ear and stops short of it
const BUBBLE_AT = new T.Vector3(-0.5, 4.88, 2.0);
// how a garment is turned for display (shoes three-quarters; the cape shows its back, where the cape is)
const SHOW_RY = { feet: -0.75, cape: 2.7 };
const showRy = (name) => SHOW_RY[name] ?? SHOW_RY[CLOTHES[name].slot] ?? 0;
const CAM = { pos: new T.Vector3(1.6, 3.5, 13.2), look: new T.Vector3(1.6, 2.75, 0) };
const HOOK_X = 3.3;                                // where this round's hanger hooks onto the rail
const PARK_X = 6.5;                               // emptied hangers slide along to the rail's right end and bunch up
// the finale: Monkey beside the mirror, three-quarter to the child; his reflection stands behind the glass facing out
const MIRROR_AT = new T.Vector3(MIRROR.x + 3.05, 0, WALL_Z + 2.2);
const MIRROR_RY = -0.62;                           // body turned a little toward the mirror, face still to the child
const REFL_RY = 0.5;
const SHOW = { pos: new T.Vector3(-2.7, 4.2, 8.7), look: new T.Vector3(-4.5, 2.95, -3.0) };
// how each garment hangs on the rail: a coat hanger inside tops; everything else pegged to a trouser hanger
// (clips: x as a fraction of the garment's drawn width; 'pair' = one clip on each half of a pair)
const HANG = {
  tshirt: { coat: true }, dress: { coat: true }, jumper: { coat: true }, dungarees: { coat: true }, raincoat: { coat: true },
  pyjamas: { coat: true }, hoodie: { coat: true },
  shorts: { clips: [-0.3, 0.3], front: true }, tutu: { clips: [-0.28, 0.28], front: true }, scarf: { clips: [-0.22, 0.22], front: true },
  sneakers: { clips: 'pair' }, wellies: { clips: 'pair' }, mittens: { clips: 'pair' },
};
const hangOf = (name) => HANG[name] || { clips: [0] };
// Voice: a new line until its clip is recorded falls back to the older, already-voiced wording (no robot voice).
let voiceIdx = null;
fetch('assets/voice/index.json').then((r) => r.json()).then((j) => { voiceIdx = j; }).catch(() => { voiceIdx = {}; });
const voiced = (text) => !voiceIdx || !!voiceIdx[voiceKey(text)];
const COLD = new Set(['snowy', 'windy', 'rainy', 'night']);
const TOPS = ['tshirt', 'raincoat', 'dress', 'jumper', 'cape', 'pyjamas', 'hoodie'];

// Dungarees worn under a top: their bib and straps would poke through the top's front, so while a top is on, only
// the triangles below the top's hem are drawn (the covered part is simply not there). Shared, cached geometry.
const trimCache = new Map();
function trimmedUnder(geom, cutY) {
  const key = geom.uuid + ':' + cutY.toFixed(3);
  if (trimCache.has(key)) return trimCache.get(key);
  const idx = geom.index.array, pos = geom.attributes.position;
  const out = [];
  for (let i = 0; i < idx.length; i += 3) {
    const lo = Math.min(pos.getY(idx[i]), pos.getY(idx[i + 1]), pos.getY(idx[i + 2]));
    if (lo < cutY) out.push(idx[i], idx[i + 1], idx[i + 2]);
  }
  const g = new T.BufferGeometry();
  for (const [k, a] of Object.entries(geom.attributes)) g.setAttribute(k, a);
  g.setIndex(out);
  g.boundingSphere = geom.boundingSphere; g.boundingBox = geom.boundingBox;
  g.userData.shared = true;
  trimCache.set(key, g);
  return g;
}
function minY(geom) {
  const idx = geom.index.array, pos = geom.attributes.position;
  let m = Infinity;
  for (let i = 0; i < idx.length; i++) m = Math.min(m, pos.getY(idx[i]));
  return m;
}
// (the shorts' waistband poked through the T-shirt's hem the same way; a slimmer overlap keeps no gap at the hem)
const UNDER = { cloth_body_dungarees: 0.12, cloth_legs_shorts: 0.05 };
function fitLayers(monkey) {
  const L = monkey.userData.layers;
  const top = TOPS.map((n) => L['cloth_body_' + n]).find((l) => l && l.mesh.visible);
  for (const [name, lap] of Object.entries(UNDER)) {
    const d = L[name];
    if (!d) continue;
    d.orig = d.orig || d.mesh.geometry;
    const g = top ? trimmedUnder(d.orig, minY(top.mesh.geometry) + lap) : d.orig;
    d.mesh.geometry = g; d.outline.geometry = g;
  }
}


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
const SHOE = { wellies: { fill: 0x2f8a3a, sole: 0x24642c, shaft: 0x3fae4a, cuff: 0x2f8a3a, tall: 1.5 }, sneakers: { fill: 0xfff6e8, sole: null, shaft: null, k: 0.72 } };
function fillShoe(h, name) {
  const look = SHOE[name] || SHOE.sneakers;
  const idx = h.geometry.index.array, pos = h.geometry.attributes.position;
  const b = new T.Box3(), v = new T.Vector3();
  for (let i = 0; i < idx.length; i++) b.expandByPoint(v.fromBufferAttribute(pos, idx[i]));
  const c = b.getCenter(new T.Vector3()), sz = b.getSize(new T.Vector3());
  const foot = mesh(geo.sphere(0.5, 16, 12), look.fill, { outline: 0 });
  const fk = look.k || 0.9;
  foot.scale.set(sz.x * fk, sz.y * fk, sz.z * fk); foot.position.copy(c);
  h.add(foot);
  if (look.sole) {
    const sole = mesh(geo.sphere(0.5, 18, 8), look.sole, { outline: 0.01 });
    sole.scale.set(sz.x * 1.08, Math.max(0.05, sz.y * 0.22), sz.z * 1.1); sole.position.set(c.x, b.min.y + sz.y * 0.06, c.z);
    h.add(sole);
  }
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
// layers worn together with a garment (the party dress's bow is its own crisp layer)
const EXTRA = { dress: ['cloth_body_dressbow'] };
const layersOf = (name) => [layerOf(name), ...(EXTRA[name] || [])];
// garments shown on the rail and in the bubble as a dedicated "laid flat" shape (the worn shorts are a wide shell
// that reads as a tub on its own); the pull-on swaps to the worn shell halfway
const DISPLAY = { shorts: 'cloth_legs_shortsflat', tutu: 'cloth_legs_tutuflat' };
function displayProp(name) {
  const p = DISPLAY[name] && garmentProp('monkey', DISPLAY[name]);
  if (!p) return makeProp(name);
  p.userData.display = true;
  return p;
}
function makeProp(name) {
  const p = garmentProp('monkey', layerOf(name));
  // the extra layers' meshes sit in the same model space: put them in the same (centred) inner group
  for (const x of EXTRA[name] || []) { const e = garmentProp('monkey', x); if (e) for (const m of [...e.children[0].children]) p.children[0].add(m); }
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
// top!). On the rail they hang side by side from their white wool cuffs, fingers down, as mittens hang on a line.
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
        pv.userData.rz = -sd * Math.PI / 2;   // hung up by the cuffs, fingers down (as mittens hang on a line)
        pv.userData.disp = new T.Vector3(sd * (sz.y * 0.55 + 0.03), ctr.y, ctr.z);
        pv.position.copy(pv.userData.disp);
        pv.rotation.z = pv.userData.rz;
        pv.userData.ry = sd * 1.25;            // turned so each thumb sticks out to the side: they read as mittens
        pv.rotation.y = pv.userData.ry;
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
// a copy of the shared outline material that discards fragments whose rest position lies in the hollow, and the
// shell over the middle of each door's face (it showed through the flat door as black wedges; the doors' outer
// edges, the gap between them and the panels keep their own ink).
function hideInnerOutline(w) {
  w.traverse((o) => {
    if (!o.isSkinnedMesh || !o.userData.outline || o.userData.innerCut) return;
    const src = o.material;
    const th = parseFloat(String(src.customProgramCacheKey?.() || '').replace('skin-outline', '')) || 0.028;
    const m = new T.MeshBasicMaterial({ color: src.color, side: T.BackSide });
    m.onBeforeCompile = (sh) => {
      sh.vertexShader = 'varying vec3 vRest;\n' + sh.vertexShader.replace('#include <begin_vertex>', `vec3 transformed = position + normal * ${th.toFixed(4)}; vRest = position;`);
      sh.fragmentShader = 'varying vec3 vRest;\n' + sh.fragmentShader.replace('void main() {', 'void main() {\n if (abs(vRest.x) < 1.23 && vRest.y > 0.33 && vRest.y < 3.03 && vRest.z > -0.55 && vRest.z < 0.64) discard;\n if (vRest.z > 0.6 && abs(vRest.x) > 0.07 && abs(vRest.x) < 1.2 && vRest.y > 0.4 && vRest.y < 2.98) discard;');
    };
    m.customProgramCacheKey = () => 'wardrobe-outline' + th;
    o.material = m;
    o.userData.innerCut = true;
  });
}

// wardrobe.glb has one stray cream (cabinet-inside colour) triangle on the front of the left door, which read as a
// pale wedge stuck on the purple. Any door-bone vertex painted cream takes the door's
// main colour. Runs once on the shared geometry; a no-op once the model itself is fixed.
function fixDoorPaint(w) {
  w.traverse((o) => {
    if (!o.isSkinnedMesh || o.userData.outline || o.geometry.userData.doorFixed) return;
    const g = o.geometry, P = g.attributes.position, C = g.attributes.color, S = g.attributes.skinIndex;
    const bones = o.skeleton?.bones || [];
    const door = new Set(bones.map((b, i) => (/^door/.test(b.name) ? i : -1)).filter((i) => i >= 0));
    if (!C || !S || !door.size) return;
    g.userData.doorFixed = true;
    const isCream = (i) => C.getX(i) > 0.95 && C.getY(i) > 0.85 && C.getZ(i) > 0.6;
    const odd = [], ok = [];
    for (let i = 0; i < P.count; i++) {
      if (!door.has(S.getX(i))) continue;
      (P.getZ(i) > 0.7 && isCream(i) ? odd : ok).push(i);
    }
    if (!odd.length || odd.length > 12) return;      // only ever a stray triangle or two, never a whole painted area
    // the door's main colour: the commonest colour on the door fronts
    const count = new Map();
    for (const j of ok) if (P.getZ(j) > 0.7) { const k = [C.getX(j), C.getY(j), C.getZ(j)].map((v) => v.toFixed(3)).join(); count.set(k, (count.get(k) || 0) + 1); }
    const main = [...count.entries()].sort((a, b) => b[1] - a[1])[0];
    if (!main) return;
    const [r, gg, b] = main[0].split(',').map(Number);
    for (const i of odd) C.setXYZ(i, r, gg, b);
    C.needsUpdate = true;
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
  // one round per garment of the level's outfit
  get totalRounds() { return (PLANS[this.level] || PLANS[0]).items.length; }
  build() {
    this.voiceLines = false; // the 'Hat on!' praise lines show as captions; only the instructions are spoken
    this.plan = PLANS[this.level] || PLANS[0];
    this.meadow.visible = false;
    this.room = makeRoom();
    this.root.add(this.room.group);
    // Pip watches from the back, between Monkey and the rail's left post (clear of both)
    setCamera(CAM.pos, CAM.look);
    this.pip.position.set(-0.3, 0, -2.4);
    this.pip.rotation.y = -0.35;
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
    this.worn = [];
    this.tickle = input.addTap(m, { radius: 1.5, offset: new T.Vector3(0, 2.2, 0), onTap: () => this.tickleMonkey() });
    // the wardrobe
    const w = (this.wardrobe = makeCreature('wardrobe'));
    w.position.copy(WARD.pos); w.rotation.y = WARD.rot; w.scale.setScalar(WARD.scale);
    this.root.add(w);
    fixDoorPaint(w);
    this.doors = [w.userData.bones.doorL, w.userData.bones.doorR];
    // a crisp pink heart on each door (a flat decal riding on the door bone)
    this.doors.forEach((d, i) => { if (d) { const h = doorHeart(); h.position.set(i ? -0.64 : 0.64, 1.86, 0.075); d.add(h); } });
    this.doorAmt = 1;                     // the wardrobe stands open all game: no tap-to-open step
    // no ink inside the open cabinet: the outline shell of the inner walls showed through as scribbles
    hideInnerOutline(w);
    // the clothes rail in front of it (stays up all game); emptied hangers bunch up at its right end
    this.rail = makeRail();
    this.rail.position.set(0, 0, RAIL.z);
    this.root.add(this.rail);
    this.empties = [];
    this.rigs = [];
    // bubble + glows
    this.bubble = makeBubble();
    this.bubble.position.copy(BUBBLE_AT);
    this.root.add(this.bubble);
    this.glows = [makeGlow(), makeGlow()];
    for (const g of this.glows) { g.visible = false; this.root.add(g); }
    this.choices = [];
    this.phase = 'idle';
    // the reflection (only shown at the mirror)
    this.mirrorMonkey = null;
    // the outfit's weather shows in the window all level long
    this.room.setWeather(this.plan.weather);
    this.cold = COLD.has(this.plan.weather);
    // the first garment hops onto the rail while Pip says hello, so the first round is ready at once (rule 0)
    this.pending = this.deal(0);
  }

  // ---------------- helpers ----------------
  at(x = 0, y = 0, z = 0) { return this.monkey.position.clone().add(new T.Vector3(x, y, z)); }
  kick(x, y, z) { this.monkey.userData.kick?.(new T.Vector3(x, y, z)); }
  // the garment this round and the body part it goes on
  get want() { return this.spec?.name; }
  get slot() { return this.spec ? this.spec.part || CLOTHES[this.spec.name].slot : undefined; }
  // Levels 2-3: it must go on the right body part (judged where it lands). Level 2 still shows the part glowing.
  get parts() { return !!this.plan.parts; }
  get hidePart() { return this.parts && !this.plan.glow; }
  // The drop area: all of Monkey (about 4.5 tall at this scale) plus a wide margin all round.
  // On Levels 2-3 the body part is then judged from where the garment was let go (see partAt).
  zone() { return { id: 'monkey', obj: this.monkey, pos: this.at(0, 2.4, 0.4), radius: 3.2 }; }
  zones() { return [this.zone()]; }
  // test hook helper: a zone for one body part (Levels 2-3), or the whole Monkey
  zoneFor(part) { return this.parts ? { id: part, pos: this.anchorWorld(SLOTS[part].anchors[0]) } : this.zone(); }
  // which body part a garment let go at `world` lands on. Generous: the right part wins if it is
  // nearly as close as the nearest one (on screen), or close enough by itself.
  partAt(world) {
    // judged between the garment's middle and the finger (the carried garment rides a little above the finger)
    const m = Math.min(innerWidth, innerHeight), c = project(world);
    c.y += m * 0.03;
    const dist = (a) => { const q = project(this.anchorWorld(a)); return Math.hypot(q.x - c.x, q.y - c.y); };
    let best = null, bd = Infinity;
    for (const [part, sl] of Object.entries(SLOTS)) for (const a of sl.anchors) { const d = dist(a); if (d < bd) { bd = d; best = part; } }
    const ok = [this.slot, ...(this.spec.alsoOk || [])];
    const ds = Math.min(...ok.flatMap((p) => SLOTS[p].anchors.map(dist)));
    return ds <= bd * 1.5 || ds < m * 0.08 ? this.slot : best;
  }
  // a body part that is not this garment's (test hook for a wrong drop on Levels 2-3)
  wrongPart() { const bad = [this.slot, ...(this.spec.alsoOk || [])]; return ['head', 'feet', 'hands'].find((p) => !bad.includes(p)); }
  anchorWorld(name) {
    const a = this.monkey.userData.anchors[name];
    if (!a) return this.at(0, 2, 0);
    return this.monkey.localToWorld(new T.Vector3(a[0], a[1], a[2] + 0.05));
  }
  isRight(name) { return name === this.want; }
  // a line to speak: the new wording once it has a recorded clip, else the older voiced wording
  line(text, fallback) { return fallback && !voiced(text) && voiced(fallback) ? fallback : text; }

  // ---------------- rounds ----------------
  async startRound(r) {
    this.busy = true;
    const spec = (this.spec = this.plan.items[r]);
    this.phase = 'opening';
    this.stuckDemo = false;
    this.wrongDemo = false;
    const t0 = performance.now();
    // the thought bubble shows the garment itself (one design at every level; the weather level adds its badge)
    setBubble(this.bubble, this.plan.parts && !this.plan.glow ? this.plan.weather : null);
    this.setBubbleGarment(spec.name);
    popIn(this.s, this.bubble, this.bubble.userData.size, 0.5, { sound: false });
    // Levels 1-2: the body part glows on Monkey; Level 3: finding it is the child's job
    this.glowOn = !this.hidePart;
    // Monkey shows which part is bare (once his show-off move from the last round has finished)
    const react = this.react;
    Promise.resolve(react).then(() => { if (!this.dead && this.spec === spec && this.phase !== 'dressed') this.gesture(); });
    // this round's ONE garment: already hopped onto the rail during the last round's show-off, or now
    const d = this.pending && this.pending.r === r ? this.pending : this.deal(r);
    this.pending = null;
    await d.landed;
    const left = 0.32 - (performance.now() - t0) / 1000;      // (the engine opens taps 0.3 s after the round starts)
    if (left > 0) await this.wait(left);
    if (this.dead) return;
    this.choices = [d.holder];
    d.holder.userData.drag.enabled = true;
    this.phase = 'open';
    this.busy = false;
    this.idle = 0;
    if (r === 0 && !this.demoDone) this.cue(); // the words + a slow hand demo of the drag, onto the real garment
    else this.prompt();
    if (this.errorlessOn) this.makeErrorless();
  }
  setBubbleGarment(name) {
    if (this.bubbleProp) { this.bubble.remove(this.bubbleProp); this.bubbleProp = null; }
    if (!name) return;
    const p = displayProp(name);
    const tilt = { shorts: 0, tutu: 0 }[name] ?? (CLOTHES[name].slot === 'feet' ? 0.35 : 0.12);
    p.userData.ry = showRy(name);
    p.rotation.set(tilt, p.userData.ry, 0);
    const fit = fitProp(p, 0.6, 0.56, 10);
    p.scale.setScalar(fit.k);
    const c = this.bubble.userData.centre;
    p.position.copy(fit.off).add(new T.Vector3(c.x, c.y, 0.3));
    this.bubble.add(p);
    this.bubbleProp = p;
  }
  gesture() {
    const spec = this.spec;
    if (!spec) return;
    this.wanting = WANT[this.slot](this, this.cold);
  }
  promptText() {
    const spec = this.spec;
    if (!spec) return '';
    return this.line(spec.say, spec.fallback);
  }
  prompt(opts) {
    this.say(this.promptText(), { max: 1.5, ...(opts || {}) });
    // re-shown cue: Monkey gestures again and the bubble wobbles
    if (this.phase === 'open') {
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
  // the wardrobe is always open: a tap on it just gives it a happy wobble
  open() { if (!this.dead) this.wobbleWardrobe(); }
  wobbleWardrobe(dur = 0.6) {
    const w = this.wardrobe, k = WARD.scale;
    return this.s.anim(dur, (_, p) => { const q = 1 + Math.sin(p * Math.PI * 2) * 0.05 * (1 - p); w.scale.set(k / Math.sqrt(q), k * q, k / Math.sqrt(q)); }).then(() => w.scale.setScalar(k));
  }
  // the held breath before the garment comes out: the wardrobe draws in (silent), then lets go
  async wardrobeBeat() {
    const w = this.wardrobe, k = WARD.scale;
    await this.s.anim(0.3, (e) => w.scale.set(k * (1 + 0.035 * e), k * (1 - 0.06 * e), k * (1 + 0.035 * e)), Ease.out);
    this.s.anim(0.35, (_, p) => { const q = 1 - 0.06 * Math.cos(p * Math.PI * 1.5) * (1 - p); w.scale.set(k / Math.sqrt(q), k * q, k / Math.sqrt(q)); }).then(() => w.scale.setScalar(k));
  }

  // ---------------- the rail: garments on hangers ----------------
  // Deal round r's garment: last round's empty hanger slides along to the end of the rail, the wardrobe takes a
  // breath, and the garment hops out on its own hanger and hooks onto the rail. Returns { r, holder, landed }.
  deal(r) {
    const name = this.plan.items[r].name;
    const rig = this.makeRig(name);
    const holder = rig.userData.holder;
    const d = { r, holder, rig };
    // the previous hanger (empty now) moves up the rail
    this.parkEmpties();
    d.landed = (async () => {
      await this.wardrobeBeat();
      if (this.dead) return;
      const from = this.wardrobe.localToWorld(new T.Vector3(0, 2.2, 0.2));
      const to = rig.userData.hook.clone();
      rig.visible = holder.visible = true;
      const r0 = Math.random() < 0.5 ? -1 : 1;
      await this.s.anim(0.7, (e, q) => {
        rig.position.lerpVectors(from, to, e);
        rig.position.y += Math.sin(q * Math.PI) * 1.1 + (1 - e) * 0.25;
        rig.rotation.y = (1 - e) * 0.8 * r0;
        const k = Math.max(0.01, Math.min(1, q * 1.6));
        rig.scale.setScalar(k * rig.userData.hs);
        holder.scale.setScalar(k);
      }, Ease.out);
      rig.position.copy(to); rig.rotation.y = 0; rig.scale.setScalar(rig.userData.hs); holder.scale.setScalar(1);
      msfx.tok();
      rig.userData.swing = 0.09 * r0;          // it swings a little on its hook and settles
      holder.userData.busy = false;
    })();
    return d;
  }
  parkEmpties() {
    const list = this.empties;
    list.forEach((rig, i) => {
      const x = PARK_X - (list.length - 1 - i) * 0.2;
      if (Math.abs(rig.position.x - x) < 0.01) return;
      const x0 = rig.position.x;
      if (i === list.length - 1) msfx.slide();
      this.s.anim(0.6, (e) => { rig.position.x = x0 + (x - x0) * e; }, Ease.inOut).then(() => { rig.userData.swing = 0.05; });
      rig.userData.swing = -0.05;
    });
  }
  // A hanger rig (hook on the rail) and the garment's holder (a draggable group whose origin is the garment's visible
  // centre, so the garment stays under the finger). While the holder is on its hanger it follows the rig's swing.
  makeRig(name) {
    const g = CLOTHES[name], hang = hangOf(name);
    const p = displayProp(name);
    const tilt = g.slot === 'feet' ? 0.3 : g.slot === 'head' ? 0.55 : name === 'tutu' ? 0.05 : name === 'shorts' ? 0.05 : 0.14;   // trousers and skirts seen a little from below: leg holes and the skirt's shape show
    p.rotation.set(tilt, showRy(name), 0);
    // big and upright, facing us (up to twice the worn size, so small things read too)
    const fit = fitProp(p, 2.35, 2.0, MS * 2.5);
    p.scale.setScalar(fit.k);
    p.position.copy(fit.off);
    const size = boxOf(p).getSize(new T.Vector3());
    const holder = new T.Group();
    holder.add(p);
    const ud = holder.userData;
    Object.assign(ud, { name, slot: g.slot, k: 1, idx: 0, garment: layerOf(name), prop: p, busy: true, onHanger: true });
    // the hanger
    const rig = new T.Group();
    const hook = new T.Vector3(HOOK_X, RAIL.y, RAIL.z);
    const kind = hang.coat ? 'coat' : 'clip';
    rig.add(makeHanger(kind));
    // a coat hanger sits inside the top's shoulders; clips hold the top edge of everything else
    let hs, top;
    if (hang.coat) {
      hs = Math.max(0.7, Math.min(1.15, size.x * 0.62 / 1.56));
      top = HANGER.coatY * hs + 0.1;                 // the garment's top edge just above the hanger's shoulders
    } else {
      hs = 1;
      const xs = hang.clips === 'pair' ? [-0.27, 0.27] : hang.clips;
      for (const fx_ of xs) {
        const c = makeClip();
        c.scale.setScalar(0.8);
        c.position.set(fx_ * size.x, HANGER.clipY, 0.0);
        rig.add(c);
      }
      top = HANGER.clipY - HANGER.clipLen * 0.8 + 0.1;  // the clips' jaws hold the top 0.1 of it
    }
    rig.scale.setScalar(hs);
    ud.off = new T.Vector3(0, top / hs - size.y / 2 / hs, 0.04 / hs);    // holder centre in the rig's local frame
    // clips grip the front edge of a waistband; anything else at the middle of its top
    if (!hang.coat && hang.front) for (const c of rig.children.slice(1)) c.position.z = size.z * 0.5 - 0.04;
    Object.assign(rig.userData, { hook, hs, holder, swing: 0, ang: 0, vel: 0 });
    holder.userData.rig = rig;
    rig.position.copy(hook);
    rig.visible = holder.visible = false;
    holder.position.copy(rig.localToWorld(ud.off.clone()));
    this.root.add(rig, holder);
    this.rigs.push(rig);
    ud.spot = rig.localToWorld(ud.off.clone());
    // grab: the whole garment (radius ~1.4 around its centre, x1.25 in the engine), at any time
    ud.drag = input.addDrag(holder, {
      radius: 1.4, minY: 0.6, sound: false,
      zones: () => (ud.enabled === false ? [] : this.zones()),
      onPick: () => this.onPick(holder),
      onMove: (_t, z) => this.onHover(z),
      onDrop: (z, info) => this.drop(holder, z, info),
    });
    ud.drag.enabled = false; // grabbable once it has hooked onto the rail
    return rig;
  }
  squash(p, k, amt = 0.25) {
    return this.s.anim(0.3, (_, q) => { const sq = 1 - Math.sin(q * Math.PI) * amt * (1 - q * 0.5); p.scale.set(k / Math.sqrt(sq), k * sq, k / Math.sqrt(sq)); }).then(() => p.scale.setScalar(k));
  }
  clearChoices() {
    const list = this.choices;
    this.choices = [];
    for (const p of list) { input.remove(p.userData.drag); p.userData.busy = true; }
  }

  // ---------------- dragging ----------------
  onPick(p) {
    const ud = p.userData;
    this.carrying = p;
    ud.busy = true;
    ud.onHanger = false;
    this.s.stop(p.scale);
    p.rotation.set(0, 0, 0);
    // lifted off its hanger: the hanger swings, one soft cloth sound
    if (ud.rig) ud.rig.userData.swing = 0.07;
    msfx.flop();
  }
  onHover(z) {
    const on = !!z;
    if (on === this.hovering) return;
    this.hovering = on;
    const f = this.monkey.userData.face;
    if (!f) return;
    setFace(f, on ? 'joy' : 'happy');                      // delighted: "for me?"
  }
  goBack(p) {
    const ud = p.userData;
    ud.busy = true;
    const a = p.position.clone(), b = ud.rig ? ud.rig.localToWorld(ud.off.clone()) : ud.spot;
    return this.s.anim(0.6, (e, q) => { p.position.lerpVectors(a, b, e); p.position.y += Math.sin(q * Math.PI) * 0.8; }, Ease.inOut)
      .then(() => { p.scale.setScalar(ud.k); ud.onHanger = true; if (ud.rig) ud.rig.userData.swing = 0.06; msfx.tok(); })
      .then(() => { ud.busy = false; });
  }
  // a tap on the garment (Levels 2-3): it wiggles on its hanger and the words come again (no answer given away)
  wiggle(p) {
    const rig = p.userData.rig;
    if (rig) rig.userData.swing = 0.12;
    this.prompt();
  }

  // test hook: drop a choice on Monkey (Levels 2-3: on `part`; default: the right body part)
  put(choice, part = this.slot) { return this.drop(choice, this.zoneFor(part), { tapped: false }); }

  async drop(p, zone, { tapped } = {}) {
    const ud = p.userData;
    this.carrying = null;
    this.hovering = false;
    const f0 = this.monkey.userData.face;
    if (f0 && f0.userData.emotion === 'joy' && !this.react) setFace(f0, 'happy');
    if (this.busy || this.dead || this.phase !== 'open') { this.goBack(p); return; }
    if (!zone && tapped) {
      // Level 1: a tap on the garment puts it on Monkey. Levels 2-3: it only wiggles and the prompt repeats.
      if (!this.parts) zone = this.zone();
      else { this.goBack(p).then(() => this.wiggle(p)); return; }
    }
    if (!zone) { this.goBack(p); return; }
    const name = ud.name, g = CLOTHES[name];
    const part = !this.parts ? this.slot : zone.id === 'monkey' ? this.partAt(p.position) : zone.id;
    if (part !== this.slot && !(this.spec.alsoOk || []).includes(part)) {
      this.goBack(p);
      // Monkey shakes his head with a giggle ("not there!") and points at the right part, which now glows
      msfx.chatter();
      this.s.anim(0.55, (_, q) => { this.P.headY = Math.sin(q * Math.PI * 4) * 0.35 * (1 - q); }).then(() => { this.P.headY = 0; this.gesture(); });
      this.glowOn = true;
      const say = `Oops! ${this.spec.where}`;
      this.redirect(this.line(say, this.spec.where));
      // and the hand shows where it goes (once per round; the 8 s / 12 s ladder still applies)
      if (!this.wrongDemo) {
        this.wrongDemo = true;
        this.s.wait(0.9).then(() => { if (!this.dead && this.phase === 'open' && !this.carrying && !this.demoing) { this.demoing = true; this.showHint(false); this.s.wait(2.5).then(() => { this.demoing = false; }); } });
      }
      return;
    }
    // ---- right! it is pulled on ----
    this.busy = true;
    this.goPending = false;                    // no late "Go!" badge over the show-off (or the mirror)
    input.lock(1300);
    this.phase = 'dressed';
    this.glowOn = false;
    fx.clearHands();
    this.clearChoices();
    const r = this.round;
    const rig = ud.rig;
    if (rig) { rig.userData.swing = 0.06; this.empties.push(rig); }
    const holder = p;
    p = ud.prop;
    this.root.attach(p);
    this.root.remove(holder);
    input.remove(ud.drag);
    await this.pullOn(p, this.slot, p.userData.display ? makeProp(name) : null);
    if (this.dead) return;
    for (const l of layersOf(name)) this.monkey.userData.wear(l, true);
    fitLayers(this.monkey);
    this.worn.push(name);
    popOut(this.s, this.bubble, 0.25);
    // a beat of stillness, then Monkey's own move for this garment (the character reacts, not the screen)
    this.react = this.wait(0.3).then(() => (this.dead ? null : MOVES[g.move](this))).then(() => { this.react = null; });
    // the next garment is laid out on the rail while he shows this one off
    if (r + 1 < this.totalRounds) this.s.wait(0.5).then(() => { if (!this.dead) this.pending = this.deal(r + 1); });
    else this.s.wait(0.6).then(() => { if (!this.dead) this.parkEmpties(); });
    this.busy = false;
    this.payoffP = this.wait(0.75);
    this.success(this.at(0, 3.8, 0.5), this.spec.done, { still: 0.3 });
  }
  // The pull-on (0.6 s): the garment comes in from where you would put it on from (a hat from above, a top from the
  // front, trousers from below), a little stretched, and settles snug with one soft cloth sound; Monkey helps
  // (arms push through sleeves, a foot wiggles in, he ducks into a hat).
  async pullOn(p, slot, worn = null) {
    const m = this.monkey;
    const shown = p;                                  // what is carried in (a display shape swaps to the worn shell)
    if (worn) { worn.visible = false; this.root.add(worn); }
    const inner = (worn || p).children[0];
    const target = m.localToWorld(new T.Vector3(-inner.position.x, -inner.position.y, -inner.position.z));
    const pre = target.clone().add(new T.Vector3(...({ head: [0, 1.1, 0.35], body: [0, 0.35, 1.3], legs: [0, -0.35, 1.2], feet: [0, -0.1, 1.2],
      eyes: [0, 0.1, 1.3], neck: [0, 0.6, 1.0], hands: [0, 0.1, 1.2] }[slot] || [0, 0.3, 1.2])));
    const a = p.position.clone(), k0 = p.scale.x, r0 = p.rotation.y, rz0 = p.rotation.z, rx0 = p.rotation.x;
    if (worn) worn.rotation.y = this.monkey.rotation.y;
    for (const h of inner.children) h.userData.x0 = h.position.x;
    const cuffs = [];
    inner.traverse((o) => { if (o.isMesh && o.parent.userData.rz !== undefined && !o.geometry.userData.split) cuffs.push(o); });
    this.P.headX = 0; this.P.headY = 0;
    const P = this.P, ry = this.monkey.rotation.y;
    let sounded = false;
    await this.s.anim(0.6, (_, q) => {
      // 0..0.55: carried to just in front of / above its place; 0.55..1: slid on and settling snug
      const e1 = Ease.inOut(Math.min(1, q / 0.55)), e2 = Ease.out(Math.max(0, (q - 0.55) / 0.45));
      if (worn && q >= 0.55 && !worn.visible) { shown.visible = false; worn.visible = true; p = worn; }
      if (q < 0.55) p.position.lerpVectors(a, pre, e1); else p.position.lerpVectors(pre, target, e2);
      const stretch = 1 + 0.08 * Math.sin(Math.min(1, q / 0.55) * Math.PI / 2) * (1 - e2);
      const k = k0 + (MS - k0) * e1;
      p.scale.set(k * stretch, k * (q < 0.55 ? 1 : 1 + 0.04 * (1 - e2)), k * stretch);
      p.rotation.y = r0 + (ry - r0) * e1;
      p.rotation.z = rz0 * (1 - e1);
      p.rotation.x = rx0 * (1 - e1);
      for (const h of inner.children) {
        if (h.userData.pull) h.position.x = h.userData.x0 + h.userData.pull * e1;
        if (h.userData.rest) { h.position.lerpVectors(h.userData.disp, h.userData.rest, e1); h.rotation.z = h.userData.rz * (1 - e1); h.rotation.y = (h.userData.ry || 0) * (1 - e1); }
      }
      for (const c of cuffs) c.scale.setScalar(Math.max(0.01, 1 - e1));
      // Monkey helps
      const b = Math.sin(Math.max(0, (q - 0.45) / 0.55) * Math.PI);
      if (slot === 'head') P.sq = 1 - 0.07 * b;
      else if (slot === 'legs') P.y = 0.12 * b;
      else if (slot === 'feet') { P.legL = -0.25 * Math.sin(q * Math.PI * 2) * b; P.legR = 0.25 * Math.sin(q * Math.PI * 2) * b; }
      else if (slot === 'eyes' || slot === 'neck') P.headX = -0.08 * b;
      if (q > 0.55 && !sounded) { sounded = true; msfx.cloth(); }
    });
    this.root.remove(shown);
    if (worn) this.root.remove(worn);
    Object.assign(P, newPose());
    if (slot === 'body' || slot === 'hands') {
      // arms push through the sleeves / into the mittens (the worn layer moves with the arms)
      this.s.anim(0.45, (_, q) => { const b = Math.sin(q * Math.PI); P.armL = P.armR = 0.5 * b; P.sq = 1 + 0.03 * b; })
        .then(() => { P.armL = P.armR = 0; P.sq = 1; });
    }
  }

  async afterSuccess() {
    this.P = Object.assign(this.P, newPose());
    if (this.round >= this.totalRounds) {
      while (this.react) await this.react;
      await this.toMirror();
    }
  }

  tickleMonkey() {
    if (this.dead || this.react || this.tickling) return;
    this.tickling = true;
    msfx.chatter();
    this.kick(2, 3, 0);
    const f = this.monkey.userData.face;
    if (f) { setFace(f, 'joy'); this.s.wait(0.6).then(() => setFace(f, 'happy')); }
    this.s.anim(0.8, (_, p) => { this.P.y = Math.sin(p * Math.PI) * 0.5; this.P.tilt = Math.sin(p * Math.PI * 3) * 0.12; })
      .then(() => { this.P.y = 0; this.P.tilt = 0; this.tickling = false; });
  }

  // ---------------- the mirror ending ----------------
  // Monkey walks over to the wall mirror and turns three-quarter to the child; the glass clears and there he is.
  // Then the engine's finale frames the two of them ("Look what you made!"); each poke strikes one of his outfit's
  // poses and the reflection copies it; the photo is taken in that frame.
  async toMirror() {
    const m = this.monkey;
    this.clearChoices();
    this.swingDoors(0, 0.6).then(() => sfx.thunk());
    // Pip walks over to the rail side, out of the picture
    this.walkTo(this.pip, new T.Vector3(5.2, 0, -1.2), { speed: 2.4 }).then(() => { this.pip.rotation.y = -0.6; });
    const r = (this.mirrorMonkey = makeCreature('monkey'));
    r.scale.setScalar(MS);
    for (const k of Object.keys(m.userData.layers)) r.userData.wear(k, m.userData.layers[k].mesh.visible);
    fitLayers(r);
    // the reflection stands just behind the glass, facing out (a toddler-friendly mirror: you see its face).
    // Not a negative-scale clone (that broke the face decals): the same model, its pose mirrored bone by bone.
    r.position.set(MIRROR.x, 0, WALL_Z - 1.3);
    r.rotation.y = REFL_RY;
    r.visible = false;
    r.userData.noLook = true;
    this.root.add(r);
    const pairs = [];
    const rb = r.userData.bones;
    const other = (k) => k.replace(/([LR])(\d*)$/, (_, s, n) => (s === 'L' ? 'R' : 'L') + n);
    for (const [k, b] of Object.entries(m.userData.bones)) { const t = rb[other(k)]; if (t && !/^(tail|ear|tuft|mane)/.test(k)) pairs.push([b, t]); }
    this.reflPairs = pairs;
    // walk to the mirror (the motion layer gives him his gait), turning to face it, then three-quarter to the child
    const a = m.position.clone(), b = MIRROR_AT.clone();
    const head = Math.atan2(b.x - a.x, b.z - a.z);
    await this.s.anim(0.3, (e) => { this.baseRot = 0.12 + (head - 0.12) * e; }, Ease.inOut);
    await this.s.anim(a.distanceTo(b) / 2.4, (e) => { m.position.lerpVectors(a, b, e); }, Ease.inOut);
    await this.s.anim(0.5, (e) => { this.baseRot = head + (MIRROR_RY - head) * e; }, Ease.inOut);
    // the camera moves in on him and the mirror (after the walk, so the walk is seen whole in the room view)
    this.glideCamera(SHOW.pos, SHOW.look, 1.0);
    // the glass clears: there he is!
    const gl = this.room.glass;
    r.visible = true;
    this.s.tween(gl.material, { opacity: 0.12 }, 0.6);
    await this.wait(0.4);
    msfx.ooh();
    const f = m.userData.face;
    if (f) { setFace(f, 'joy'); this.s.wait(0.9).then(() => setFace(f, 'happy')); }
    await this.s.anim(0.6, (_, q) => { this.P.y = Math.sin(q * Math.PI) * 0.25; this.P.armL = this.P.armR = 1.2 * Math.sin(q * Math.PI); });
    Object.assign(this.P, newPose());
  }
  creationView() { return { pos: SHOW.pos, look: SHOW.look, dur: 0.4 }; }
  creationObjects() { return [this.monkey, this.mirrorMonkey].filter(Boolean); }
  get admireTime() { return 6; }
  // a poke on Monkey (or his reflection): he strikes the next of his outfit's poses and the reflection copies it
  onAdmirePoke() {
    if (this.dead || this.posing) return;
    const moves = [...new Set(this.worn.map((n) => CLOTHES[n].move))].slice(0, 4);
    if (!moves.length) return;
    const mv = moves[(this.poseI = ((this.poseI ?? -1) + 1)) % moves.length];
    this.posing = MOVES[mv](this).then(() => { this.posing = null; });
  }
  async showOff() {
    hushEffects(0.4, { cut: true });
    await this.glideCamera(SHOW.pos, SHOW.look, 0.4);
    // pokes on Monkey or his reflection (the engine's finale lock swallows every touch, so listen here as well;
    // a poke while a pose is still playing is ignored, so the two paths never double up)
    const cv = document.querySelector('canvas');
    if (cv && !this.admireOff) {
      const down = (e) => { if (!this.dead && this.hitMonkey(e.clientX, e.clientY)) this.onAdmirePoke(); };
      cv.addEventListener('pointerdown', down);
      this.admireOff = () => cv.removeEventListener('pointerdown', down);
      this.offs.push(this.admireOff);
    }
  }
  hitMonkey(x, y) {
    for (const o of [this.monkey, this.mirrorMonkey]) {
      if (!o || !o.visible) continue;
      const c = o.position.clone().add(new T.Vector3(0, 2.2, 0));
      const q = project(c), r = screenRadius(c, 2.1);
      if (Math.hypot(q.x - x, q.y - y) < r) return true;
    }
    return false;
  }

  // ---------------- hints ----------------
  nudgeTarget() {
    if (this.phase !== 'open') return null;
    return this.choices.find((c) => !c.userData.busy) || null;
  }
  // the hand picks the garment up from its middle and carries it slowly to where it goes on Monkey
  showHint(glow = true) {
    const p = this.choices[0];
    if (!p || this.phase !== 'open') return;
    if (glow) this.addHalo(p, 1.1);
    fx.ghostPath([p.position.clone(), this.anchorWorld(SLOTS[this.slot].anchors[0])], { mode: 'drag', maxDur: 2.4 });
  }
  demoL3() { this.showHint(false); }
  makeErrorless() {
    // the one garment glows, and so does the body part it goes on
    this.glowOn = true;
    for (const c of this.choices) this.addHalo(c, 1.1);
  }

  // ---------------- every frame ----------------
  update(dt, t) {
    const m = this.monkey, u = m.userData, P = this.P;
    this.room.update(dt, t);
    breathe(m, t, 0.7);
    // pose -> rig
    const ra = this.rest.arms;
    if (u.arms) {
      // in a top, arms only swing a little forward/in: further, the shoulder skin pokes out at the armpit
      const top = this.worn.some((n) => TOPS.includes(n));
      // and they rise only to about shoulder height: higher, the sleeve drags the top's shoulder up with it
      // (the party dress's puff sleeves are the most fragile: they lift its bodice early)
      const up = this.worn.includes('dress') ? 0.8 : 1.35;
      const fx_ = (v) => (top ? Math.max(-0.5, v) : v), inw = (v) => (top ? Math.min(up, Math.max(-0.15, v)) : v);
      u.arms[0].rotation.set(ra[0].x + fx_(P.armLx), ra[0].y, ra[0].z + inw(P.armL));
      u.arms[1].rotation.set(ra[1].x + fx_(P.armRx), ra[1].y, ra[1].z - inw(P.armR));
    }
    ['legL', 'legR'].forEach((k, i) => { const b = u.bones[k], r = this.rest.legs[i]; if (b && r) b.rotation.set(r.x + (i ? P.legR : P.legL), r.y, r.z); });
    // the head follows what you carry
    let look = 0;
    if (this.carrying && input.dragging()) look = Math.max(-0.6, Math.min(0.6, (this.carrying.position.x - m.position.x) * 0.12));
    this.lookY = (this.lookY || 0) + (look - (this.lookY || 0)) * Math.min(1, dt * 6);
    if (u.head) {
      // in a top, the head tips and nods less: further, the neck skin pushes through the collar
      const top_ = this.worn.some((n) => TOPS.includes(n));
      const hx = top_ ? Math.max(-0.18, Math.min(0.25, P.headX)) : P.headX, hz = top_ ? Math.max(-0.14, Math.min(0.14, P.headZ)) : P.headZ;
      u.head.rotation.x = hx + (this.carrying ? 0.1 : 0);
      // in a twirl the head "spots" the child (turns back toward us), so the face never shows side-on
      u.head.rotation.y = P.headY + this.lookY - Math.sin(P.spin) * 0.6;
      u.head.rotation.z += hz;
    }
    // snowy day: Monkey shivers a little until he is dressed (less with every garment)
    let shiver = 0;
    if (this.cold && !this.mirrorMonkey) shiver = Math.sin(t * 31) * 0.016 * Math.max(0, 1 - this.worn.length / this.totalRounds) * (this.react ? 0.3 : 1);
    m.rotation.y = this.baseRot + P.spin;
    m.rotation.z = P.tilt + shiver;
    m.rotation.x = P.lean;
    m.position.y = P.y;
    const sq = P.sq;
    m.scale.set(MS / Math.sqrt(sq), MS * sq, MS / Math.sqrt(sq));
    // the wardrobe doors
    if (this.doors[0]) { this.doors[0].rotation.y = -1.95 * this.doorAmt; this.doors[1].rotation.y = 1.95 * this.doorAmt; }
    // hangers swing a little on the rail (a damped pendulum), and a garment on its hanger swings with it
    for (const rig of this.rigs) {
      const ru = rig.userData;
      if (ru.swing) { ru.vel += ru.swing * 9; ru.swing = 0; }
      ru.vel += (-ru.ang * 22 - ru.vel * 2.6) * Math.min(dt, 0.05);
      ru.ang += ru.vel * Math.min(dt, 0.05);
      rig.rotation.z = ru.ang + Math.sin(t * 1.1 + rig.position.x) * 0.012;
      const h = ru.holder;
      if (h && h.parent && h.userData.onHanger && !h.userData.dragging && h !== this.carrying) {
        rig.updateMatrixWorld();
        h.position.copy(rig.localToWorld(h.userData.off.clone()));
        h.rotation.set(0, Math.sin(t * 0.8) * 0.12, rig.rotation.z);
      }
    }
    // stuck for ~8 s: the hand shows the drag again, slowly, once per garment
    if (this.phase === 'open' && !this.busy && !this.demoing && !this.carrying && !this.stuckDemo && this.idle > 8) {
      this.stuckDemo = true;
      this.demoing = true;
      this.showHint(false);
      this.s.wait(2.5).then(() => { this.demoing = false; });
    }
    if (this.bubbleProp) this.bubbleProp.rotation.y = this.bubbleProp.userData.ry + Math.sin(t * 1.2) * 0.4;
    // body-part glow on Monkey + bubble bob
    const spec = this.spec, slot = this.slot;
    const parts = spec && this.glowOn && this.phase !== 'dressed' && !this.mirrorMonkey ? SLOTS[slot].anchors : [];
    this.glows.forEach((g, i) => {
      g.visible = !!parts[i];
      if (!g.visible) return;
      g.position.copy(this.anchorWorld(parts[i]));
      const k = (slot === 'body' ? 1.5 : slot === 'legs' ? 1.5 : slot === 'head' ? 1.6 : 1.0) * (1 + Math.sin(t * 2.5) * 0.1);
      g.scale.setScalar(k);
      // soft: it marks the spot without washing out what Monkey already wears
      g.material.opacity = 0.2 + Math.sin(t * 2.5) * 0.08;
    });
    if (this.bubble.visible && this.phase !== 'dressed') this.bubble.position.y = BUBBLE_AT.y + Math.sin(t * 2.2) * 0.1;
    // the reflection copies Monkey, mirrored (left and right swapped)
    const r = this.mirrorMonkey;
    if (r && r.visible) {
      for (const [a, b] of this.reflPairs) b.quaternion.set(a.quaternion.x, -a.quaternion.y, -a.quaternion.z, a.quaternion.w);
      r.position.y = m.position.y;
      r.rotation.set(m.rotation.x, REFL_RY - P.spin, -m.rotation.z);
      r.scale.copy(m.scale);
      const fe = u.face?.userData?.emotion, rf = r.userData.face;
      if (rf && fe && rf.userData.emotion !== fe) setFace(rf, fe);
    }
  }
}
