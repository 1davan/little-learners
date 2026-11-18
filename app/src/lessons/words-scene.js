// Word world: everything you can see. Model availability (the "ship on what exists" gate), the things in their
// slots (fitted to the slot box), the 19 reactions (words.md 8.3), the nook sets, Pip's ledge, the photo cards
// (rendered from the real thing into a canvas texture, words.md 8.2), the photo line, the word book and easel,
// the Level 3 homes and the toy train, and the few soft sounds the game makes.
import * as T from '../three.js';
import { makeCreature, hasCreature } from '../engine/creature.js';
import { mesh, geo, toon, toonUnique, basic, INK } from '../engine/toon.js';
import { renderer } from '../engine/stage.js';
import { setFace } from '../engine/actors.js';
import { Ease } from '../engine/tween.js';
import { sfx, sharedCtx, cueOut, effectsHushed } from '../engine/audio.js';
import { prop } from './view-tools.js';
import { BY_ID, NOOKS } from './words-list.js';

// ---------------------------------------------------------------- layout (world units, words.md 6.2)
export const NOOK_X = [0, 12.5];          // nook A, nook B centres
export const SLOT_DX = [-2.4, 0, 2.4];  // left, middle, right
export const EASEL_X = 6.55;   // nearer nook B, so nook A's close views never show its legs (nook B's ledge starts 0.6 later)
export const TIDY_X = 26;            // the tidy rug, just past nook B
export const LEDGE = { y: 1.5, z: -1.75 };
export const LINE = { y: 3.25, z: -2.45 };
export const STAND_TOP = 0.5;
const FIT = { S: [1.2, 1.4], M: [1.5, 1.5], L: [1.72, 1.62], T: [0.78, 0.82], B: [3.2, 3.0] };   // [height, width] per size class

// ---------------------------------------------------------------- availability
const anchorCache = new Map(), boneCache = new Map();
function probe(kind) {
  if (anchorCache.has(kind)) return;
  if (!hasCreature(kind)) { anchorCache.set(kind, null); boneCache.set(kind, new Set()); return; }
  const c = makeCreature(kind);
  anchorCache.set(kind, { ...c.userData.anchors });
  boneCache.set(kind, new Set(Object.keys(c.userData.bones || {})));
}
export function anchorsOf(kind) { probe(kind); return anchorCache.get(kind); }
// Parts shown on a word's own prop by their bones (the named part wiggles and is the tap): finger on the hand,
// toes on the foot, teeth and tongue in the mouth (VOCAB.md: no separate model; tools/blender prop_words_body.py).
export const PROP_PART = {
  finger: { bones: ['finger2'], show: { finger1: 1.0, finger3: 1.25, finger4: 1.3, finger5: 1.3 }, el: 0.12, zoom: 1.7 },
  toes: { bones: ['toes1', 'toes2', 'toes3', 'toes4', 'toes5'], layers: ['toe1', 'toe2', 'toe3', 'toe4', 'toe5'], show: {}, el: 0.55, zoom: 1.1 },
  teeth: { bones: [], layers: ['teeth'], show: { jaw: 0.17 }, el: 0.1, zoom: 1.3 },
  tongue: { bones: ['tongue'], layers: ['tongue'], show: { jaw: 0.2, tongue: -0.4 }, el: 0.1, zoom: 1.4 },   // more tears the lips
};
// a body word's anchor: spread left / middle / right on the big bear (the right eye and leg, words.md 8.4)
const PART_PREF = { eyeL: ['eyeR', 'eyeL'], legL: ['legR', 'legL'] };
function partOf(kind, part) {
  const a = anchorsOf(kind);
  if (!a) return null;
  for (const p of PART_PREF[part] || [part]) if (a[p]) return p;
  const pp = PROP_PART[part], b = boneCache.get(kind);
  if (pp && b && pp.bones.every((n) => b.has(n)) && Object.keys(pp.show).every((n) => b.has(n))) return part;
  return null;
}
// composed things: the game builds them from existing models (VOCAB.md R* rows)
const COMPOSE = {
  '@blocks': ['prop_m_block'], '@blueberry': ['prop_m_blueberry'], '@present': ['prop_m_giftbox'], '@paint': ['prop_m_paintpot'],
  '@bed': ['prop_md_bed'], '@bin': ['prop_md_bin'], '@money': ['prop_coin'], '@picture': ['prop_frame'], '@train': ['prop_engine'], '@rain': ['prop_cloud'],
};
export function modelOf(w) {
  for (const m of w.models) {
    if (m.startsWith('@')) { if ((COMPOSE[m] || []).every(hasCreature)) return { compose: m }; continue; }
    const [kind, part] = m.split('#');
    if (!hasCreature(kind)) continue;
    if (part) { const p = partOf(kind, part); if (!p) continue; return { kind, part: p }; }
    return { kind };
  }
  return null;
}
export const available = (id) => !!(BY_ID[id] && modelOf(BY_ID[id]));

// ---------------------------------------------------------------- helpers
const V = (x, y, z) => new T.Vector3(x, y, z);
function boxOf(o) {
  o.updateMatrixWorld(true);
  const b = new T.Box3();
  o.traverse((m) => { if (m.isMesh && !m.userData.outline && m.visible && !m.userData.noFit) b.expandByObject(m); });
  return b;
}
const isChar = (kind) => !!kind && !kind.startsWith('prop_');
// Reused models that are built white and take their colour from a tint (VOCAB.md "tinted ..." rows and the
// engine's tint-only props). A tint is ignored by models that are not tint-mode, so listing extra kinds is safe.
const TINT = {
  prop_m_cup: 0x3f8cff, prop_bal_jug: 0xffd23a, prop_m_balloon: 0xff4f4f, prop_m_puffstar: 0xffd23a, prop_engine: 0x3f8cff,
  prop_traincart: 0xffd23a, prop_m_car: 0x3f8cff, prop_lolly: 0xff9a2e, prop_m_orange: 0xff9a2e, prop_m_pear: 0x9bd64a,
  prop_m_plum: 0x9b6dff, prop_m_blueberry: 0x3f8cff, prop_m_block: 0xff4f4f, prop_m_crayon: 0xff4f4f, prop_m_paintpot: 0x3f8cff,
  prop_m_giftbox: 0xff7fbf, prop_m_giftlid: 0xff7fbf, prop_m_toyball: 0xff4f4f, prop_m_cherry: 0xff4f4f, prop_m_lemon: 0xffd23a,
};
function plainProp(kind, opts = {}) {
  const t = opts.tint ?? TINT[kind];
  const w = prop(kind, { ...opts, ...(t !== undefined ? { tint: t } : {}), hide: [...(opts.hide || []), 'snow'] });
  if (!w) return null;
  return w;
}
function tintSkin(w, col) {
  const u = w.userData.model?.userData || w.userData;
  if (u.skin) u.skin.material = toonUnique(col, { vertexColors: true });
}
function composed(id) {
  const g = new T.Group();
  const add = (kind, x, y, z, s = 1, o = {}) => { const p = plainProp(kind, o); if (!p) return null; p.position.set(x, y, z); p.scale.setScalar(s); g.add(p); return p; };
  switch (id) {
    case '@blocks': { const c = [0xff4f4f, 0xffd23a, 0x3f8cff]; let y = 0; for (let i = 0; i < 3; i++) { const b = add('prop_m_block', (i - 1) * 0.04, y, 0, 1, { tint: c[i] }); if (b) { b.rotation.y = i * 0.35; const h = boxOf(b).getSize(V(0, 0, 0)).y; y += h * 0.98; } } break; }
    case '@blueberry': { const pts = [[-0.32, 0, 0.1], [0.32, 0, 0.1], [0, 0, -0.2]]; for (const [x, y, z] of pts) add('prop_m_blueberry', x, y, z); const t = add('prop_m_blueberry', 0, 0, 0); if (t) { const h = boxOf(t).getSize(V(0, 0, 0)).y; t.position.set(0, h * 0.72, 0.02); } break; }
    case '@present': { const b = add('prop_m_giftbox', 0, 0, 0); if (b && hasCreature('prop_m_giftlid')) { const h = boxOf(b).max.y; const l = add('prop_m_giftlid', 0, h * 0.98, 0); if (l) l.userData.lid = true; } break; }
    case '@paint': { add('prop_m_paintpot', 0, 0, 0); if (hasCreature('prop_m_brush')) { const br = add('prop_m_brush', 0.12, 0.35, 0); if (br) br.rotation.z = -0.35; } break; }
    case '@bed': { add('prop_md_bed', 0, 0, 0); break; }
    case '@bin': { const b = add('prop_md_bin', 0, 0, 0); if (b && hasCreature('prop_md_binlid')) { const h = boxOf(b).max.y; const l = add('prop_md_binlid', 0, h * 0.97, 0); if (l) l.userData.lid = true; } break; }
    case '@money': { const c1 = add('prop_coin', -0.25, 0, 0); if (c1) { const h = boxOf(c1).getSize(V(0, 0, 0)).y; add('prop_coin', -0.25, h * 0.95, 0.02); add('prop_coin', -0.24, h * 1.9, -0.02); const e = add('prop_coin', 0.42, 0, 0); if (e) { e.rotation.x = Math.PI / 2; const eb = boxOf(e); e.position.y -= eb.min.y; } } break; }
    case '@picture': {
      const f = add('prop_frame', 0, 0, 0);
      if (f) {
        const b = boxOf(f); f.position.y -= b.min.y;
        const c = document.createElement('canvas'); c.width = 128; c.height = 100;
        const x = c.getContext('2d');
        x.fillStyle = '#bfe6ff'; x.fillRect(0, 0, 128, 100); x.fillStyle = '#8fdc6c'; x.beginPath(); x.ellipse(64, 104, 90, 34, 0, 0, Math.PI * 2); x.fill();
        x.fillStyle = '#ffd23a'; x.beginPath(); x.arc(100, 26, 13, 0, 7); x.fill();
        x.fillStyle = '#ff4f4f'; x.fillRect(34, 46, 34, 26); x.beginPath(); x.moveTo(30, 48); x.lineTo(51, 30); x.lineTo(72, 48); x.fill(); x.fillStyle = '#b07a4a'; x.fillRect(47, 58, 9, 14);
        const tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace;
        const sz = b.getSize(V(0, 0, 0));
        const pic = new T.Mesh(new T.PlaneGeometry(sz.x * 0.7, sz.y * 0.68), new T.MeshBasicMaterial({ map: tex, toneMapped: false }));
        pic.position.set(0, sz.y / 2 - b.min.y - b.min.y + (b.min.y), b.max.z + 0.012);
        pic.position.y = sz.y / 2;
        pic.userData.noFit = true;
        g.add(pic);
        // a little foot so the frame stands up on its stand
        const leg = mesh(geo.box(0.08, sz.y * 0.8, 0.08), 0xb07a4a, { hull: 1.06, outline: 0 });
        leg.position.set(0, sz.y * 0.4, -0.25); leg.rotation.x = 0.35; g.add(leg);
      }
      break;
    }
    case '@train': { const e = add('prop_engine', 0, 0, 0); if (e) { const b = boxOf(e); e.position.y -= b.min.y; } break; }
    case '@rain': {
      const c = add(hasCreature('prop_word_cloud') ? 'prop_word_cloud' : 'prop_cloud', 0, 0, 0);
      if (c) {
        tintSkin(c, 0xb8c6d9);
        const b = boxOf(c); const sz = b.getSize(V(0, 0, 0));
        c.position.y = -b.min.y + sz.y * 0.9;
        const drops = [];
        for (let i = 0; i < 6; i++) {
          const d = mesh(geo.sphere(0.09 * sz.x / 1.6, 12, 10), 0x3f8cff, { outline: 0.012 });
          d.scale.set(1, 1.35, 1);
          d.userData.noFit = true;
          d.userData.ph = i / 6; d.userData.x = (i - 2.5) * sz.x * 0.13; d.userData.top = sz.y * 0.95; d.userData.z = (i % 2 ? 0.1 : -0.1);
          g.add(d); drops.push(d);
        }
        g.userData.drops = drops;
      }
      break;
    }
    default: break;
  }
  return g;
}

// ---------------------------------------------------------------- a thing in its slot
const YAW = { bee: -0.75, foot: -1.15, toes: -1.15 };
// thing (at the slot) -> pose (reactions move this) -> inner (the fitted model). origin: bottom centre.
export function makeThing(w, size = w.size) {
  const m = modelOf(w);
  if (!m) return null;
  let inner, creature = false;
  if (m.compose) inner = composed(m.compose);
  else if (isChar(m.kind) || (m.part && !PROP_PART[m.part])) { inner = makeCreature(m.kind); creature = isChar(m.kind); }
  else inner = plainProp(m.kind);
  if (!inner) return null;
  const pose = new T.Group(); pose.add(inner);
  const g = new T.Group(); g.add(pose);
  // long things (vehicles, fish, tools) turn about 25 degrees toward the camera (VOCAB.md model contract)
  let b = boxOf(inner), sz = b.getSize(V(0, 0, 0));
  if (!creature && sz.x > sz.z * 1.45 && sz.x > sz.y * 1.1) inner.rotation.y = -0.42;
  // things that only read from the side: the bee shows its stripes, the foot its profile (not a cone, toes first)
  if (YAW[w.id] !== undefined) inner.rotation.y = YAW[w.id];
  b = boxOf(inner); sz = b.getSize(V(0, 0, 0));
  const [H, Wd] = FIT[size] || FIT.M;
  const k = Math.min(H / Math.max(0.01, sz.y), Wd / Math.max(0.01, sz.x), (Wd * 1.05) / Math.max(0.01, sz.z));
  inner.scale.multiplyScalar(k);
  b = boxOf(inner);
  const c = b.getCenter(V(0, 0, 0));
  inner.position.x -= c.x; inner.position.z -= c.z; inner.position.y -= b.min.y;
  const fin = boxOf(inner).getSize(V(0, 0, 0));
  const mu = inner.userData.model?.userData || inner.userData;
  if (mu) { mu.noWalk = true; if (!creature) mu.noLook = true; }
  g.userData = { w, word: w.id, inner, pose, k, h: fin.y, wid: fin.x, dep: fin.z, creature, model: mu, part: m.part || null, kind: m.kind || m.compose };
  return g;
}
// The world point a body-part word is touched at (its anchor), as an Object3D on the character.
// For a prop part (PROP_PART) the target sits at the middle of that part (its layers' meshes, or the vertices its
// bones carry) and remembers the part's size: userData.r, in the inner model's own units.
export function partTarget(charThing, part) {
  const inner = charThing.userData.inner;
  const a = inner.userData.anchors?.[part];
  const o = new T.Object3D();
  const pp = PROP_PART[part];
  if (pp) {
    inner.updateMatrixWorld(true);
    const pts = partPoints(inner, pp);
    if (pts.length) {
      const c = V(0, 0, 0); for (const p of pts) c.add(p); c.divideScalar(pts.length);
      let r = 0; for (const p of pts) r = Math.max(r, p.distanceTo(c));
      const k = inner.getWorldScale(V(0, 0, 0)).x || 1;
      o.position.copy(inner.worldToLocal(c.clone()));
      o.userData.r = r / k;
    }
  } else if (a) o.position.set(a[0], a[1], a[2]);
  inner.add(o);
  return o;
}
// world points of a prop part: every vertex of its own layers, or every vertex its bones carry (weight >= 0.5)
function partPoints(inner, pp) {
  const mu = inner.userData.model?.userData || inner.userData;
  const out = [], v = V(0, 0, 0);
  const meshes = [];
  inner.traverse((m) => { if (m.isSkinnedMesh && !m.userData.outline) meshes.push(m); });
  const layerMeshes = (pp.layers || []).map((n) => mu.layers?.[n]?.mesh).filter(Boolean);
  if (layerMeshes.length) {
    for (const m of layerMeshes) { const pos = m.geometry.attributes.position; for (let i = 0; i < pos.count; i += 2) { m.getVertexPosition(i, v); out.push(m.localToWorld(v.clone())); } }
    return out;
  }
  const bones = pp.bones.map((n) => mu.bones?.[n]).filter(Boolean);
  for (const m of meshes) {
    const idx = bones.map((b) => m.skeleton.bones.indexOf(b)).filter((i) => i >= 0);
    if (!idx.length) continue;
    const si = m.geometry.attributes.skinIndex, sw = m.geometry.attributes.skinWeight, pos = m.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let w = 0;
      for (let j = 0; j < 4; j++) if (idx.includes(si.getComponent(i, j))) w += sw.getComponent(i, j);
      if (w >= 0.5) { m.getVertexPosition(i, v); out.push(m.localToWorld(v.clone())); }
    }
  }
  return out;
}
// the part's size in world units (for its ring, its tap and its photo)
export function partRadius(target) { const r = target?.userData?.r; return r ? r * target.parent.getWorldScale(V(0, 0, 0)).x : 0; }
// Pose a prop part so it shows (k = 0 rest .. 1 shown): the other fingers curl so the pointing one stands out,
// the jaw drops to show the teeth, the tongue pokes out. Bone rests are remembered on first use.
export function partPose(thing, part, k) {
  const pp = PROP_PART[part]; if (!pp) return;
  const mu = thing.userData.model || {}, b = mu.bones || {};
  for (const [n, amt] of Object.entries(pp.show)) {
    const bone = b[n]; if (!bone) continue;
    if (bone.userData.rx0 === undefined) bone.userData.rx0 = bone.rotation.x;
    bone.rotation.x = bone.userData.rx0 + amt * k;
  }
}
export const partElevation = (part) => PROP_PART[part]?.el ?? 0.12;
export const partZoom = (part) => PROP_PART[part]?.zoom ?? 1.35;

// The pale cream ring under an unmet thing (words.md 3.3): 0.9 radius, 35% opacity, slow 3 s pulse.
export function makeRing(r = 0.9) {
  const m = new T.Mesh(new T.RingGeometry(r * 0.72, r, 48), new T.MeshBasicMaterial({ color: 0xfff3d6, transparent: true, opacity: 0.35, depthWrite: false, side: T.DoubleSide, fog: false }));
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.075;
  m.renderOrder = 2;
  return m;
}
// a small soft ring standing up, facing the camera (for body parts: the ring sits ON the part)
export function makePartRing(r = 0.3) {
  const m = new T.Mesh(new T.RingGeometry(r * 0.7, r, 40), new T.MeshBasicMaterial({ color: 0xfff3d6, transparent: true, opacity: 0.6, depthWrite: false, depthTest: false, side: T.DoubleSide, fog: false }));
  m.renderOrder = 6;
  return m;
}

// ---------------------------------------------------------------- the reactions (words.md 8.3)
// Each is 0.6-0.9 s, ends exactly where it began (glow toggles and stays) and stays inside the slot box.
const fxMat = (c, o = 1) => new T.MeshBasicMaterial({ color: c, transparent: true, opacity: o, depthWrite: false, fog: false });
function bits(s, parent, { n = 3, col = 0xffffff, from, rise = 0.5, spread = 0.35, dur = 0.8, r = 0.06, fall = false }) {
  const list = [];
  for (let i = 0; i < n; i++) {
    const m = new T.Mesh(geo.sphere(r, 10, 8), fxMat(col, 0.95));
    m.position.copy(from);
    parent.add(m);
    list.push(m);
    const a = (i / n) * Math.PI * 2 + 0.4, dx = Math.cos(a) * spread * 0.6, dz = Math.sin(a) * spread * 0.3 + 0.1;
    s.anim(dur, (_, p) => {
      const y = fall ? -p * rise : Math.sin(p * Math.PI) * rise;
      m.position.set(from.x + dx * p, from.y + y, from.z + dz * p);
      m.material.opacity = 0.95 * (1 - Math.max(0, p - 0.6) / 0.4);
      m.scale.setScalar(fall ? 1 : 0.6 + p * 0.8);
    }).then(() => { parent.remove(m); m.material.dispose(); });
  }
}
function boneOf(u, names) { const b = u?.bones || {}; for (const n of names) if (b[n]) return b[n]; return null; }
function emissiveOn(thing, on) {
  const inner = thing.userData.inner;
  inner.traverse((o) => {
    if (!o.isMesh || o.userData.outline || !o.material || o.userData.noFit) return;
    if (!o.userData.glowMat) {
      const m0 = o.material;
      if (!m0.isMeshToonMaterial) return;
      o.userData.baseMat = m0;
      o.userData.glowMat = toonUnique(m0.color.getHex(), { vertexColors: m0.vertexColors, emissive: 0xffe9a8, emissiveIntensity: 0 });
    }
    o.material = o.userData.glowMat;
  });
  return (k) => inner.traverse((o) => { if (o.userData.glowMat) o.userData.glowMat.emissiveIntensity = k * 0.55; });
}
export function setGlow(thing, k) { emissiveOn(thing, true)(k); }

export function react(s, thing, kind, { part = null } = {}) {
  const u = thing.userData, P = u.pose, mu = u.model || {}, h = u.h || 1;
  const done = () => { P.position.set(0, 0, 0); P.rotation.set(0, 0, 0); P.scale.set(1, 1, 1); };
  const sq = (k) => P.scale.set(1 / Math.sqrt(k), k, 1 / Math.sqrt(k));
  const joy = (sec = 1) => { const f = mu.face; if (f) { setFace(f, 'joy'); s.wait(sec).then(() => { if (f.userData.emotion === 'joy') setFace(f, 'happy'); }); } };
  const kick = (amt = 3) => mu.kick && mu.kick(V(0, amt, 0));
  switch (kind) {
    case 'creature': case 'figure': {
      joy(1.0); kick(3.5);
      const head = mu.head && mu.head !== mu.body ? mu.head : null, hx = head ? head.rotation.x : 0;
      const arms = mu.arms, r0 = arms ? arms.map((a) => a.rotation.z) : null;
      return s.anim(0.8, (_, p) => {
        const lift = Math.sin(Math.min(1, p / 0.7) * Math.PI);
        P.position.y = lift * 0.14;
        sq(p < 0.12 ? 1 - p * 0.6 : p > 0.82 ? 1 - Math.sin((p - 0.82) / 0.18 * Math.PI) * 0.05 : 1 + lift * 0.03);
        if (head) head.rotation.x = hx + Math.sin(p * Math.PI * 2) * 0.12;
        if (arms) arms.forEach((a, i) => (a.rotation.z = r0[i] + (i ? -1 : 1) * Math.sin(p * Math.PI) * 0.6));
      }).then(() => { done(); if (head) head.rotation.x = hx; if (arms) arms.forEach((a, i) => (a.rotation.z = r0[i])); });
    }
    case 'hop':
      return s.anim(0.7, (_, p) => {
        if (p < 0.15) sq(1 - (p / 0.15) * 0.08);
        else if (p < 0.75) { const q = (p - 0.15) / 0.6; P.position.y = Math.sin(q * Math.PI) * 0.18; sq(0.92 + Math.sin(q * Math.PI) * 0.1); }
        else { P.position.y = 0; sq(1 - Math.sin(((p - 0.75) / 0.25) * Math.PI) * 0.05); }
      }).then(done);
    case 'flutter': {
      const w = mu.wings || [boneOf(mu, ['wingL', 'wingL1']), boneOf(mu, ['wingR', 'wingR1'])].filter(Boolean);
      const r0 = w.map((b) => b.rotation.z);
      kick(2);
      return s.anim(0.85, (_, p) => {
        P.position.y = Math.sin(p * Math.PI) * 0.3;
        P.rotation.z = Math.sin(p * Math.PI * 4) * 0.06;
        w.forEach((b, i) => (b.rotation.z = r0[i] + (i ? -1 : 1) * Math.abs(Math.sin(p * Math.PI * 4)) * 0.7));
      }).then(() => { done(); w.forEach((b, i) => (b.rotation.z = r0[i])); });
    }
    case 'wriggle':
      kick(2);
      return s.anim(0.8, (_, p) => { P.rotation.z = Math.sin(p * Math.PI * 4) * 0.12 * Math.sin(p * Math.PI); P.scale.x = 1 + Math.sin(p * Math.PI * 4) * 0.05; }).then(done);
    case 'roll': {
      const r = Math.max(0.3, h / 2), dx = 0.28;
      return s.anim(0.85, (e, p) => { const x = Math.sin(p * Math.PI) * dx; P.position.x = x; P.rotation.z = -x / r; P.position.y = 0; }, Ease.linear).then(done);
    }
    case 'spin':
      return s.anim(0.85, (e) => { P.rotation.y = e * Math.PI * 2; P.position.y = Math.sin(e * Math.PI) * 0.08; }, Ease.inOut).then(done);
    case 'drive': {
      const wh = ['wheelF', 'wheelB', 'wheelF1', 'wheelB1'].map((n) => mu.bones?.[n]).filter(Boolean);
      const w0 = wh.map((b) => b.rotation.z); // the axle is each wheel bone's z
      const yaw = u.inner.rotation.y, dir = V(Math.cos(yaw), 0, -Math.sin(yaw));
      return s.anim(0.85, (_, p) => {
        const d = (p < 0.4 ? Ease.inOut(p / 0.4) : p < 0.55 ? 1 : 1 - Ease.inOut((p - 0.55) / 0.45)) * 0.3;
        P.position.set(dir.x * d, 0, dir.z * d);
        wh.forEach((b, i) => (b.rotation.z = w0[i] - d * 4));
      }).then(() => { done(); wh.forEach((b, i) => (b.rotation.z = w0[i])); });
    }
    case 'tip': {
      const top = V(0, h * 0.95, 0.15);
      s.wait(0.3).then(() => bits(s, thing, { n: 3, col: 0x9fd9ff, from: top, rise: 0.35, spread: 0.5, dur: 0.5, r: 0.05 }));
      return s.anim(0.85, (_, p) => { P.rotation.x = Math.sin(p * Math.PI) * 0.6; P.position.z = Math.sin(p * Math.PI) * 0.05; }).then(done);
    }
    case 'nibble':
      bits(s, thing, { n: 3, col: 0xf3d9ae, from: V(0, h * 0.75, 0.3), rise: h * 0.7, spread: 0.3, dur: 0.7, r: 0.04, fall: true });
      return s.anim(0.7, (_, p) => { const q = p < 0.5 ? Math.sin((p / 0.5) * Math.PI) : Math.sin(((p - 0.5) / 0.5) * Math.PI); sq(1 - q * 0.07); }).then(done);
    case 'open': {
      const names = ['lid', 'door', 'doorL', 'flap', 'jaw', 'page', 'cover', 'piece', 'pull', 'bucket', 'stick', 'boom', 'hood', 'blade', 'blades', 'ladder', 'bed', 'head', 'tongue'];
      // the word mouth: its jaw drops (+x) to open wide, its lips never pass through each other
      if (mu.kind === 'prop_word_mouth' && mu.bones?.jaw) return reactPart(s, thing, 'mouth');
      let bone = boneOf(mu, names);
      // a composed thing with a lid part (present, bin)
      let lid = null; u.inner.traverse((o) => { if (o.userData?.lid) lid = o; });
      if (bone) {
        const r0 = bone.rotation.x;
        return s.anim(0.9, (_, p) => { const k = p < 0.35 ? Ease.out(p / 0.35) : p < 0.65 ? 1 : 1 - Ease.inOut((p - 0.65) / 0.35); bone.rotation.x = r0 - k * 0.7; }).then(() => { bone.rotation.x = r0; done(); });
      }
      if (lid) {
        const y0 = lid.position.y;
        return s.anim(0.9, (_, p) => { const k = p < 0.35 ? Ease.out(p / 0.35) : p < 0.65 ? 1 : 1 - Ease.inOut((p - 0.65) / 0.35); lid.position.y = y0 + k * 0.25; lid.rotation.z = k * 0.25; }).then(() => { lid.position.y = y0; lid.rotation.z = 0; done(); });
      }
      return react(s, thing, 'squish');
    }
    case 'glow': {
      const set = emissiveOn(thing, true);
      u.lit = !u.lit;
      const from = u.lit ? 0 : 1, to = u.lit ? 1 : 0;
      return s.anim(0.6, (_, p) => { set(from + (to - from) * Math.min(1, p / 0.5)); sq(1 + Math.sin(p * Math.PI) * 0.04); }).then(() => { set(to); P.scale.set(1, 1, 1); });
    }
    case 'ring':
      return s.anim(0.6, (_, p) => { P.rotation.z = Math.sin(p * Math.PI * 10) * 0.07 * (1 - p); P.position.y = Math.sin(p * Math.PI) * 0.04; }).then(done);
    case 'sway':
      kick(1.5);
      return s.anim(0.85, (_, p) => { const a = 0.21; P.rotation.z = p < 0.33 ? Ease.inOut(p / 0.33) * a : p < 0.75 ? a - Ease.inOut((p - 0.33) / 0.42) * a * 2 : -a + Ease.inOut((p - 0.75) / 0.25) * a; }).then(done);
    case 'float':
      return s.anim(0.9, (e, p) => { P.position.y = Math.sin(p * Math.PI) * 0.4; P.position.x = Math.sin(p * Math.PI * 2) * 0.12; P.rotation.z = Math.sin(p * Math.PI * 2) * 0.06; }, Ease.linear).then(done);
    case 'squish':
      return s.anim(0.85, (_, p) => { const k = p < 0.35 ? Ease.out(p / 0.35) : 1 - Ease.inOut((p - 0.35) / 0.65); sq(1 - k * 0.18); }).then(done);
    case 'splash':
      bits(s, thing, { n: 6, col: 0x7fd0ff, from: V(0, h * 0.75, 0.2), rise: 0.5, spread: 0.7, dur: 0.75, r: 0.055 });
      return s.anim(0.75, (_, p) => sq(1 - Math.sin(p * Math.PI) * 0.06)).then(done);
    case 'puff':
      for (let i = 0; i < 3; i++) s.wait(i * 0.16).then(() => bits(s, thing, { n: 1, col: 0xffffff, from: V((i - 1) * 0.18, h * 0.95, 0.1), rise: 0.6, spread: 0.1, dur: 0.75, r: 0.12 }));
      return s.anim(0.85, (_, p) => sq(1 - Math.sin(p * Math.PI) * 0.05)).then(done);
    case 'wave': {
      joy(1.0); kick(2);
      const arm = boneOf(mu, ['armR', 'armL']), fingers = ['finger1', 'finger2', 'finger3', 'finger4', 'finger5'].map((n) => mu.bones?.[n]).filter(Boolean);
      const a0 = arm ? arm.rotation.z : 0, f0 = fingers.map((f) => f.rotation.x);
      return s.anim(0.85, (_, p) => {
        const k = Math.sin(p * Math.PI);
        if (arm) arm.rotation.z = a0 + (arm === mu.bones?.armR ? -1 : 1) * k * (1.4 + Math.sin(p * Math.PI * 6) * 0.25);
        else P.rotation.z = Math.sin(p * Math.PI * 4) * 0.12 * k;
        fingers.forEach((f, i) => (f.rotation.x = f0[i] + Math.sin(p * Math.PI * 4 + i) * 0.3 * k));
        P.position.y = k * 0.05;
      }).then(() => { if (arm) arm.rotation.z = a0; fingers.forEach((f, i) => (f.rotation.x = f0[i])); done(); });
    }
    case 'part': return reactPart(s, thing, part);
    default: return react(s, thing, 'hop');
  }
}
// The big character moves the named part (words.md 7.5 Me): blink, nod, puff, pat, lift, kick, flop.
function reactPart(s, thing, part) {
  const u = thing.userData, mu = u.model || {}, b = mu.bones || {};
  const face = mu.face;
  if (face) { setFace(face, 'joy'); s.wait(1.0).then(() => { if (face.userData.emotion === 'joy') setFace(face, 'happy'); }); }
  const head = mu.head && mu.head !== mu.body ? mu.head : null;
  const rot = (bone, ax, amt, dur = 0.85, n = 1) => {
    if (!bone) return s.wait(dur);
    const r0 = bone.rotation[ax];
    return s.anim(dur, (_, p) => { bone.rotation[ax] = r0 + Math.sin(p * Math.PI * n) * amt * (n > 1 ? Math.sin(p * Math.PI) : 1); }).then(() => { bone.rotation[ax] = r0; });
  };
  // a part of a word's own prop: it shows itself (curl the other fingers, open the jaw), wiggles, and settles back
  const PP = PROP_PART[part];
  if (PP || part === 'mouth') {
    const wig = PP ? PP.bones.map((n) => b[n]).filter(Boolean) : [];
    const w0 = wig.map((x) => x.rotation.x);
    const showK = (p) => (p < 0.22 ? Ease.out(p / 0.22) : p < 0.78 ? 1 : 1 - Ease.inOut((p - 0.78) / 0.22));
    if (part === 'mouth') {
      const jaw = b.jaw, j0 = jaw.rotation.x;
      return s.anim(0.9, (_, p) => { jaw.rotation.x = j0 + showK(p) * 0.2; }).then(() => { jaw.rotation.x = j0; });
    }
    return s.anim(1.1, (_, p) => {
      partPose(thing, part, showK(p));
      const k = Math.sin(Math.min(1, Math.max(0, (p - 0.15) / 0.7)) * Math.PI);
      wig.forEach((x, i) => {
        if (part === 'finger') x.rotation.x = w0[i] + Math.abs(Math.sin(p * Math.PI * 3)) * 0.55 * k;          // the finger wiggles
        else if (part === 'toes') x.rotation.x = w0[i] + Math.max(0, Math.sin(p * Math.PI * 4 - i * 0.7)) * 0.5 * k;  // a toe ripple
        else if (part === 'tongue') x.rotation.x = (x.userData.rx0 ?? w0[i]) + PP.show.tongue * showK(p) + Math.sin(p * Math.PI * 6) * 0.06 * k;
      });
    }).then(() => { partPose(thing, part, 0); wig.forEach((x, i) => { if (part !== 'tongue') x.rotation.x = w0[i]; }); });
  }
  switch (part) {
    case 'nose': return rot(head, 'x', 0.12, 0.8, 4);
    case 'eyeL': case 'eyeR': {
      const eyes = face?.userData?.eyes || [];
      const y0 = eyes.map((e) => e.scale.y);
      return s.anim(0.8, (_, p) => { const k = Math.abs(Math.sin(p * Math.PI * 2)); eyes.forEach((e, i) => (e.scale.y = y0[i] * (1 - k * 0.88))); }).then(() => eyes.forEach((e, i) => (e.scale.y = y0[i])));
    }
    case 'head': return rot(head, 'x', 0.22, 0.85, 2);
    case 'cheek': return s.anim(0.8, (_, p) => { if (face) face.scale.x = (face.userData.sx0 ?? (face.userData.sx0 = face.scale.x)) * (1 + Math.sin(p * Math.PI) * 0.1); }).then(() => { if (face) face.scale.x = face.userData.sx0; });
    case 'tummy': {
      const arms = mu.arms, r0 = arms ? arms.map((a) => a.rotation.z) : [];
      return s.anim(0.85, (_, p) => { if (arms) arms.forEach((a, i) => (a.rotation.z = r0[i] + (i ? 1 : -1) * Math.abs(Math.sin(p * Math.PI * 2)) * 0.35)); }).then(() => { if (arms) arms.forEach((a, i) => (a.rotation.z = r0[i])); });
    }
    case 'armL': case 'armR': { const a = b[part]; return rot(a, 'z', (part === 'armL' ? 1 : -1) * 1.5, 0.9); }
    case 'legL': case 'legR': return rot(b[part], 'x', -0.5, 0.85, 2);
    case 'earL': case 'earR': mu.kick && mu.kick(V(part === 'earL' ? -3 : 3, 4, 0)); return rot(b[part + '1'] || b[part], 'z', 0.3, 0.8, 2);
    case 'hair': mu.kick && mu.kick(V(3, 3, 0)); return rot(head, 'z', 0.12, 0.8, 2);
    case 'elbowL': case 'elbowR': return rot(b[part.replace('elbow', 'arm')], 'z', 0.8, 0.85, 2);
    case 'kneeL': case 'kneeR': return rot(b[part.replace('knee', 'leg')], 'x', -0.6, 0.85, 1);
    default: return rot(head, 'x', 0.15, 0.8, 2);
  }
}

// ---------------------------------------------------------------- the few sounds (words.md 7.3)
// The game's own soft signature sounds that the engine does not have: one each, synthesized, quiet.
let wctx = null, wout = null;
function ac() { if (!wctx) { wctx = sharedCtx(); wout = wctx.createGain(); wout.gain.value = 0.55; wout.connect(cueOut()); } return wctx; }
function tone(f0, f1, t0, dur, { type = 'sine', vol = 0.3 } = {}) {
  const c = ac(), o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, c.currentTime + t0); o.frequency.exponentialRampToValueAtTime(f1, c.currentTime + t0 + dur);
  g.gain.setValueAtTime(0.0001, c.currentTime + t0); g.gain.exponentialRampToValueAtTime(vol, c.currentTime + t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + t0 + dur);
  o.connect(g); g.connect(wout); o.start(c.currentTime + t0); o.stop(c.currentTime + t0 + dur + 0.05);
}
function noise(t0, dur, { vol = 0.2, freq = 900 } = {}) {
  const c = ac(), n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = c.createBufferSource(); s.buffer = buf;
  const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 0.8;
  const g = c.createGain(); g.gain.value = vol;
  s.connect(f); f.connect(g); g.connect(wout); s.start(c.currentTime + t0);
}
const OWN = {
  tweet: () => { tone(2600, 3400, 0, 0.09, { vol: 0.12 }); tone(2700, 3600, 0.14, 0.09, { vol: 0.12 }); },
  hoot: () => { tone(420, 380, 0, 0.32, { vol: 0.22 }); tone(400, 360, 0.42, 0.45, { vol: 0.2 }); },
  ring: () => { for (let i = 0; i < 6; i++) tone(i % 2 ? 1250 : 1480, i % 2 ? 1250 : 1480, i * 0.07, 0.07, { type: 'triangle', vol: 0.08 }); },
  choo: () => { noise(0, 0.22, { vol: 0.25, freq: 1400 }); noise(0.32, 0.26, { vol: 0.22, freq: 1200 }); },
  neenaw: () => { tone(660, 660, 0, 0.32, { type: 'triangle', vol: 0.09 }); tone(520, 520, 0.36, 0.32, { type: 'triangle', vol: 0.09 }); },
  toot: () => { tone(392, 392, 0, 0.32, { type: 'triangle', vol: 0.14 }); tone(523, 523, 0.02, 0.3, { type: 'sine', vol: 0.06 }); },
  tune: () => { [523.25, 659.25, 783.99].forEach((f, i) => tone(f, f, i * 0.17, 0.3, { type: 'triangle', vol: 0.1 })); },
};
// one signature sound (about taps and listen rounds only; never on a name tap)
export function signature(name) {
  if (!name) return;
  try {
    if (OWN[name]) { if (!effectsHushed()) OWN[name](); return; }
    if (sfx[name]) sfx[name]();
  } catch (e) { /* audio unavailable */ }
}
export const toot = () => { try { if (!effectsHushed()) OWN.toot(); } catch (e) { /* */ } };

// ---------------------------------------------------------------- the set
function roundRect(w, h, r) {
  const s = new T.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
function slab(w, h, d, r, col, { outline = 0.02 } = {}) {
  const g = new T.ExtrudeGeometry(roundRect(w, h, r), { depth: d, bevelEnabled: true, bevelThickness: Math.min(0.04, d / 3), bevelSize: Math.min(0.04, r / 2), bevelSegments: 3, curveSegments: 8 });
  g.translate(0, 0, -d / 2);
  return mesh(g, col, { outline });
}
// a soft oval mat on the ground under the slots
function groundMat(w, d, col) {
  const g = new T.Group();
  const shade = new T.Color(col).multiplyScalar(0.86).getHex();
  const rim = new T.Mesh(geo.cyl(1, 1, 0.05, 56), toon(shade)); rim.scale.set(w / 2 + 0.2, 1, d / 2 + 0.2); rim.position.y = 0.012;
  const top = new T.Mesh(geo.cyl(1, 1, 0.05, 56), toon(col)); top.scale.set(w / 2, 1, d / 2); top.position.y = 0.03;
  rim.userData.noPoke = top.userData.noPoke = true;
  g.add(rim, top);
  return g;
}
// an indoor rug under the three things: a soft coloured oval with a cream border (never white on white)
function rugMat(w, d, wall) {
  const g = new T.Group();
  const col = new T.Color(wall).multiplyScalar(0.8).lerp(new T.Color(0xff9ec4), 0.35).getHex();
  const rim = new T.Mesh(geo.cyl(1, 1, 0.05, 56), toon(0xfff3d6)); rim.scale.set(w / 2 + 0.2, 1, d / 2 + 0.2); rim.position.y = 0.03;
  const top = new T.Mesh(geo.cyl(1, 1, 0.05, 56), toon(col)); top.scale.set(w / 2, 1, d / 2); top.position.y = 0.05;
  rim.userData.noPoke = top.userData.noPoke = true;
  g.add(rim, top);
  return g;
}
// The stand a small thing sits on: an existing prop scaled so its top is at STAND_TOP.
const STAND = {
  prop_hayroll: { w: 1.25 }, prop_m_stump: { w: 1.35 }, prop_crate: { w: 1.45 }, prop_md_stool: { w: 1.3 }, prop_blk_cube: { w: 1.0 },
  prop_cakestand: { w: 1.3 }, prop_rock: { w: 1.3 }, prop_m_mound: { w: 1.3 }, prop_md_table: { w: 1.2 }, prop_wicker: { w: 1.4 },
};
export function makeStand(kind, tint = null) {
  if (!kind) return null;
  let k = kind;
  if (k === 'prop_cakestand') k = 'prop_wicker';        // the tiered cake stand is too tall: a picnic basket
  if (k === 'prop_md_table') k = 'prop_md_stool';
  const p = plainProp(k);
  if (!p) return null;
  if (tint) tintSkin(p, tint);
  const b = boxOf(p), sz = b.getSize(V(0, 0, 0));
  const want = STAND[k]?.w || 1.3;
  const sy = STAND_TOP / Math.max(0.01, sz.y), sx = want / Math.max(sz.x, sz.z);
  p.scale.set(sx, sy, sx);
  const b2 = boxOf(p);
  p.position.y -= b2.min.y;
  const g = new T.Group(); g.add(p);
  g.userData.top = STAND_TOP;
  return g;
}
// Pip's ledge: a long run behind both nooks (and the tidy rug). Styles: fence, hedge, shelf (indoor sideboard), wall.
export function makeLedgeRun(style, x0, x1) {
  const g = new T.Group();
  const len = x1 - x0;
  const model = { fence: 'prop_wg_rail', hedge: 'prop_wg_hedge', log: 'prop_wg_hedge', shelf: 'prop_wg_sideboard', wall: 'prop_wg_wall', boardwalk: 'prop_wg_rail' }[style] || 'prop_wg_rail';
  const seg = hasCreature(model) ? model : null;
  if (seg) {
    const probe = plainProp(seg); const sz = boxOf(probe).getSize(V(0, 0, 0));
    const n = Math.max(1, Math.round(len / sz.x));
    const sx = len / n / sz.x, sy = LEDGE.y / sz.y;
    for (let i = 0; i < n; i++) {
      const p = i ? plainProp(seg) : probe;
      p.scale.set(sx, sy, 1);
      const b = boxOf(p); p.position.y -= b.min.y;
      p.position.x = x0 + (i + 0.5) * (len / n);
      g.add(p);
    }
  } else {
    // code fallback until the Blender ledge exists: a chunky rounded beam on posts
    const col = { hedge: 0x4cc75a, shelf: 0xd8924f, wall: 0xe8c9a0 }[style] || 0xd8924f;
    const beam = slab(len, 0.3, 0.6, 0.12, col); beam.rotation.x = -Math.PI / 2; beam.position.set((x0 + x1) / 2, LEDGE.y - 0.15, 0); g.add(beam);
    for (let x = x0 + 0.4; x < x1; x += 2.2) { const p = mesh(geo.cyl(0.13, 0.15, LEDGE.y - 0.25, 14), col, { outline: 0.02 }); p.position.set(x, (LEDGE.y - 0.25) / 2, 0); g.add(p); }
  }
  // outdoors Pip stands on a wooden plank laid along the top (never on a thin rail or the hedge's leaves)
  if (style !== 'shelf' && style !== 'wall') {
    const plank = slab(len - 0.1, 0.46, 0.1, 0.08, 0xd8924f, { outline: 0.015 });
    plank.rotation.x = -Math.PI / 2;
    plank.position.set((x0 + x1) / 2, LEDGE.y - 0.03, 0);
    g.add(plank);
  }
  g.position.z = LEDGE.z;
  g.traverse((o) => { o.userData.noPoke = true; });
  return g;
}
// One nook's corner: ground, wall (indoor), set dressing, stands. Returns { group, slots[], stands[] }.
export function makeNookSet(nookId, cx) {
  const N = NOOKS[nookId];
  const g = new T.Group();
  g.position.x = cx;
  if (N.kind === 'in') {
    const wall = slab(10.2, 6.2, 0.3, 0.3, N.wall || 0xfff0d2, { outline: 0.02 });
    wall.position.set(0, 3.0, -3.55);
    const base = slab(10.2, 0.45, 0.36, 0.12, new T.Color(N.wall || 0xfff0d2).multiplyScalar(0.82).getHex(), { outline: 0.015 });
    base.position.set(0, 0.22, -3.36);
    const floor = slab(10.2, 7.0, 0.12, 0.25, 0xe2b27a, { outline: 0.015 });
    floor.rotation.x = -Math.PI / 2; floor.position.set(0, -0.04, 0.0);
    // floorboards: thin darker lines across the floor
    for (let i = -3; i <= 3; i++) { const ln = new T.Mesh(geo.box(10.0, 0.012, 0.035), toon(0xc8955e)); ln.position.set(0, 0.025, i * 0.95); g.add(ln); }
    const cornice = slab(10.5, 0.28, 0.42, 0.1, new T.Color(N.wall || 0xfff0d2).multiplyScalar(0.86).getHex(), { outline: 0.015 });
    cornice.position.set(0, 6.05, -3.4);
    // short side returns make it a corner of a room, not a panel on the meadow
    for (const sx of [-1, 1]) { const side = slab(0.26, 6.2, 0.3, 0.08, new T.Color(N.wall || 0xfff0d2).multiplyScalar(0.93).getHex(), { outline: 0.02 }); side.rotation.y = Math.PI / 2; side.position.set(sx * 5.0, 3.0, -3.45); g.add(side); }   // clear of Pip's path behind the easel
    // a window with sky and a cross frame
    const win = new T.Group();
    const frame = slab(1.7, 1.15, 0.1, 0.1, 0xd8924f, { outline: 0.015 }); win.add(frame);
    const sky = new T.Mesh(new T.PlaneGeometry(1.45, 0.9), new T.MeshBasicMaterial({ color: 0x9fd8ff, toneMapped: false })); sky.position.z = 0.1; win.add(sky);
    const hill = new T.Mesh(new T.CircleGeometry(0.5, 24, 0, Math.PI), new T.MeshBasicMaterial({ color: 0x8fdc6c, toneMapped: false })); hill.scale.set(1.45, 0.5, 1); hill.position.set(0.1, -0.45, 0.105); win.add(hill);
    const bar1 = new T.Mesh(geo.box(0.07, 0.9, 0.04), toon(0xd8924f)); bar1.position.z = 0.12; win.add(bar1);
    const bar2 = new T.Mesh(geo.box(1.45, 0.07, 0.04), toon(0xd8924f)); bar2.position.z = 0.12; win.add(bar2);
    win.position.set(-2.9, 2.5, -3.35); g.add(win);     // low on the wall, where the close views see all of it
    g.add(wall, base, floor, cornice);
  }
  const gm = N.kind === 'in' ? rugMat(8.0, 3.6, N.wall || 0xfff0d2) : groundMat(8.0, 3.6, N.ground);
  gm.position.z = 0.1;
  g.add(gm);
  for (const [kind, dx, z, s = 1, y = 0] of N.dress || []) {
    const p = plainProp(kind);
    if (!p) continue;
    p.scale.multiplyScalar(s);
    const b = boxOf(p);
    p.position.set(dx - (b.min.x + b.max.x) / 2 + 0, y ? y - (b.min.y + b.max.y) / 2 : -b.min.y, z);
    p.userData.noPoke = true;
    g.add(p);
  }
  const slots = SLOT_DX.map((dx) => V(cx + dx, 0, 0));
  g.traverse((o) => { o.userData.noPoke = true; });
  return { group: g, slots, nook: N };
}
// The world around the nooks: a wide soft ground, distant hills and trees (the farm sky comes from setSky).
export function makeBackdrop() {
  const g = new T.Group();
  const ground = new T.Mesh(geo.box(140, 0.2, 90), toon(0x9bd45a)); ground.position.set(10, -0.13, -20);
  g.add(ground);
  const hills = [[-14, -26, 1.8, 0x86c44e], [6, -32, 2.4, 0x7cbf4a], [26, -27, 2.0, 0x8fcf58], [42, -33, 2.4, 0x86c44e], [-30, -34, 2.2, 0x7cbf4a]];
  for (const [x, z, s, c] of hills) {
    const h = mesh(geo.sphere(6, 28, 16), c, { outline: 0 }); h.scale.set(s * 1.4, s * 0.55, s); h.position.set(x, -0.5, z); g.add(h);
  }
  for (const [x, z, s] of [[-9, -12, 1.2], [3, -15, 1.3], [16, -13, 1.1], [29, -14, 1.3], [-20, -16, 1.2], [38, -12, 1.1]]) {
    const t = plainProp(Math.round(x) % 2 ? 'prop_scene_pine' : 'prop_scene_tree');
    if (t) { t.scale.setScalar(s); t.position.set(x, 0, z); g.add(t); }
  }
  g.traverse((o) => { o.userData.noPoke = true; });
  return g;
}

// ---------------------------------------------------------------- photos (words.md 8.2)
let pScene = null, pCam = null;
function photoRig() {
  if (pScene) return;
  pScene = new T.Scene();
  pScene.add(new T.HemisphereLight(0xfff7e8, 0x9fc28a, 1.6));
  const sun = new T.DirectionalLight(0xfff1d6, 2.4); sun.position.set(4, 8, 9); pScene.add(sun);
  const rim = new T.DirectionalLight(0xcfe6ff, 1.0); rim.position.set(-6, 5, -8); pScene.add(rim);
  pCam = new T.PerspectiveCamera(28, 1, 0.05, 60);
}
// Render obj alone on a pastel ground, from a three-quarter angle (or framed on a body part).
// focus: a world point to centre on; radius: how much around it to show.
// photoTexture renders straight into a small render target of its own and returns its texture: no pixel read-back
// and no canvas, so taking a photo never stalls the frame (about 1-3 ms). disposePhotos() frees them all.
const photoTargets = [];
function framePhoto(obj, { bg, focus, radius, el: elv }) {
  photoRig();
  const parent = obj.parent, pos = obj.position.clone(), quat = obj.quaternion.clone(), scl = obj.scale.clone();
  obj.updateMatrixWorld(true);
  const wq = obj.getWorldQuaternion(new T.Quaternion()), ws = obj.getWorldScale(V(0, 0, 0)), wp = obj.getWorldPosition(V(0, 0, 0));
  const f = focus ? focus.clone().sub(wp) : null;
  pScene.add(obj);
  obj.position.set(0, 0, 0); obj.quaternion.copy(wq); obj.scale.copy(ws);
  obj.updateMatrixWorld(true);
  const b = boxOf(obj), c = f || b.getCenter(V(0, 0, 0)), sz = b.getSize(V(0, 0, 0));
  const R = radius || Math.max(sz.x, sz.y, sz.z * 0.8) * 0.52;
  const d = R / Math.tan((pCam.fov * Math.PI) / 360) * 1.08;
  const yaw = focus ? 0.12 : 0.38, el = elv ?? (focus ? 0.12 : 0.3);
  pCam.position.set(c.x + Math.sin(yaw) * Math.cos(el) * d, c.y + Math.sin(el) * d, c.z + Math.cos(yaw) * Math.cos(el) * d);
  pCam.lookAt(c);
  pCam.updateMatrixWorld();
  pScene.background = new T.Color(bg);
  return () => { if (parent) parent.add(obj); else pScene.remove(obj); obj.position.copy(pos); obj.quaternion.copy(quat); obj.scale.copy(scl); obj.updateMatrixWorld(true); };
}
export function photoTexture(obj, { bg = 0xfff3d6, size = 256, focus = null, radius = null, el = null } = {}) {
  const putBack = framePhoto(obj, { bg, focus, radius, el });
  const rt = new T.WebGLRenderTarget(size, size, { samples: 4 });
  rt.texture.colorSpace = T.SRGBColorSpace;
  const prevRT = renderer.getRenderTarget();
  try { renderer.setRenderTarget(rt); renderer.render(pScene, pCam); } catch (e) { console.warn('photo', e); }
  renderer.setRenderTarget(prevRT);
  putBack();
  photoTargets.push(rt);
  return rt.texture;
}
export function disposePhotos() { for (const rt of photoTargets.splice(0)) rt.dispose(); }
// The old read-back path (a canvas); kept for tools. The game uses photoTexture.
export function photoCanvas(obj, { bg = 0xfff3d6, size = 256, focus = null, radius = null, el = null } = {}) {
  const putBack = framePhoto(obj, { bg, focus, radius, el });
  const rt = new T.WebGLRenderTarget(size, size, { samples: 4 });
  rt.texture.colorSpace = T.SRGBColorSpace;
  const prevRT = renderer.getRenderTarget();
  let canvas = null;
  try {
    renderer.setRenderTarget(rt);
    renderer.render(pScene, pCam);
    const buf = new Uint8Array(size * size * 4);
    renderer.readRenderTargetPixels(rt, 0, 0, size, size, buf);
    canvas = document.createElement('canvas'); canvas.width = canvas.height = size;
    const x = canvas.getContext('2d'), img = x.createImageData(size, size);
    for (let y = 0; y < size; y++) img.data.set(buf.subarray((size - 1 - y) * size * 4, (size - y) * size * 4), y * size * 4);
    x.putImageData(img, 0, 0);
  } catch (e) { console.warn('photo', e); }
  renderer.setRenderTarget(prevRT);
  rt.dispose();
  putBack();
  return canvas;
}
export function canvasTex(c) { const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t; }
// A plain pastel square (a photo place not earned yet shows a faint dotted square instead, see makeBookPage).
// The photo card: a rounded white card, a 0.5 square picture, and a gold star sticker hidden until earned.
const CARD_W = 0.62, CARD_H = 0.74;
export function makeCard(tex) {
  const g = new T.Group();
  const card = slab(CARD_W, CARD_H, 0.03, 0.07, 0xfffaf0, { outline: 0.012 });
  g.add(card);
  const pic = new T.Mesh(new T.PlaneGeometry(0.5, 0.5), new T.MeshBasicMaterial({ map: tex, toneMapped: false }));
  pic.position.set(0, 0.04, 0.035);
  g.add(pic);
  const star = mesh(new T.ExtrudeGeometry(starShape(0.1), { depth: 0.02, bevelEnabled: false }), 0xffd23a, { outline: 0.01 });
  star.position.set(0.22, 0.28, 0.04); star.visible = false;
  g.add(star);
  g.userData = { pic, star, card, h: CARD_H, w: CARD_W };
  return g;
}
function starShape(r) {
  const s = new T.Shape();
  for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r; const x = Math.cos(a) * rr, y = Math.sin(a) * rr; if (i) s.lineTo(x, y); else s.moveTo(x, y); }
  return s;
}

// ---------------------------------------------------------------- viewfinder (four thin corners) and the line
export function makeViewfinder() {
  const g = new T.Group();
  const mat = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, depthTest: false, fog: false });
  const corners = [];
  for (let i = 0; i < 4; i++) {
    const c = new T.Group();
    const a = new T.Mesh(geo.box(0.26, 0.045, 0.02), mat), b = new T.Mesh(geo.box(0.045, 0.26, 0.02), mat);
    a.position.set(0.13, 0, 0); b.position.set(0, 0.13, 0);
    c.add(a, b);
    c.rotation.z = (i * Math.PI) / 2;
    c.renderOrder = 7; a.renderOrder = b.renderOrder = 7;
    g.add(c); corners.push(c);
  }
  g.userData = { corners, mat };
  g.visible = false;
  return g;
}
// place the four corners on a w x h rectangle (they point inward)
export function setFinder(vf, w, h) {
  const [c0, c1, c2, c3] = vf.userData.corners;
  c0.position.set(-w / 2, -h / 2, 0); c1.position.set(w / 2, -h / 2, 0); c2.position.set(w / 2, h / 2, 0); c3.position.set(-w / 2, h / 2, 0);
}
// The photo line: a string in a shallow curve with a wooden peg above every slot of both nooks.
export function makeLine(xs) {
  const g = new T.Group();
  const x0 = xs[0] - 1.6, x1 = xs[xs.length - 1] + 1.6;
  const pts = [];
  for (let i = 0; i <= 60; i++) { const x = x0 + ((x1 - x0) * i) / 60; const seg = Math.abs(((x - x0) / (x1 - x0)) * 2 - 1); pts.push(V(x, LINE.y - (1 - seg * seg) * 0.25, LINE.z)); }
  const str = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 120, 0.022, 6, false), toon(0xfffaf0));
  g.add(str);
  // posts at both ends hold it up
  for (const x of [x0, x1]) { const p = mesh(geo.cyl(0.07, 0.08, LINE.y + 0.1, 10), 0xd8924f, { outline: 0.015 }); p.position.set(x, (LINE.y + 0.1) / 2, LINE.z); g.add(p); }
  const yAt = (x) => { const seg = Math.abs(((x - x0) / (x1 - x0)) * 2 - 1); return LINE.y - (1 - seg * seg) * 0.25; };
  const pegs = xs.map((x) => {
    const peg = hasCreature('prop_wg_peg') ? plainProp('prop_wg_peg') : null;
    let o = peg;
    if (!o) {
      o = new T.Group();
      const a = mesh(geo.box(0.08, 0.34, 0.06), 0xd8924f, { hull: 1.08, outline: 0 }); a.position.set(-0.035, -0.12, 0);
      const b2 = mesh(geo.box(0.08, 0.34, 0.06), 0xc47f3f, { hull: 1.08, outline: 0 }); b2.position.set(0.035, -0.12, 0);
      o.add(a, b2);
    } else {
      const bb = boxOf(o); const s = 0.36 / Math.max(0.01, bb.getSize(V(0, 0, 0)).y); o.scale.setScalar(s);
      const b2 = boxOf(o); o.position.y -= b2.max.y;
      const w = new T.Group(); w.add(o); o = w;
    }
    o.position.set(x, yAt(x) + 0.06, LINE.z + 0.03);
    g.add(o);
    return { obj: o, x, y: yAt(x), z: LINE.z + 0.05 };
  });
  g.userData = { pegs };
  g.traverse((o) => { o.userData.noPoke = true; });
  return g;
}

// ---------------------------------------------------------------- the word book on its easel
const BOOK_W = 3.6, BOOK_H = 2.1;
export function makeEasel() {
  const g = new T.Group();
  if (hasCreature('prop_wg_easel')) {
    const e = plainProp('prop_wg_easel');
    g.add(e);
    const m = e.userData.model;
    g.userData.bar = m.userData.anchors?.bar ? V(...m.userData.anchors.bar) : V(0, 3.15, -0.55);
    g.userData.rest = m.userData.anchors?.book ? V(...m.userData.anchors.book) : V(0, 1.0, 0.05);
  } else {
    const wood = 0xd8924f;
    for (const s of [-1, 1]) { const l = mesh(geo.box(0.16, 3.2, 0.16), wood, { hull: 1.06, outline: 0 }); l.position.set(s * 1.5, 1.55, -0.2); l.rotation.z = s * 0.08; g.add(l); }
    const back = mesh(geo.box(0.16, 3.2, 0.16), wood, { hull: 1.06, outline: 0 }); back.position.set(0, 1.5, -0.75); back.rotation.x = -0.3; g.add(back);
    const shelf = mesh(geo.box(3.7, 0.12, 0.42), wood, { hull: 1.04, outline: 0 }); shelf.position.set(0, 0.85, 0.05); g.add(shelf);
    const bar = mesh(geo.box(3.5, 0.18, 0.3), wood, { hull: 1.05, outline: 0 }); bar.position.set(0, 3.1, -0.45); g.add(bar);
    g.userData.bar = V(0, 3.2, -0.45);
    g.userData.rest = V(0, 0.92, 0.05);
  }
  g.traverse((o) => { o.userData.noPoke = true; });
  return g;
}
// The book, standing open on the easel (tilted back 25 degrees). Rest pose is OPEN; the cover swings shut over
// the right page (bone 'cover' on the Blender book; a hinged group in the fallback).
export function makeBook() {
  const g = new T.Group();
  const tilt = new T.Group(); tilt.rotation.x = -0.35; g.add(tilt);
  let cover = null, pages = new T.Group();
  if (hasCreature('prop_wg_book')) {
    const b = plainProp('prop_wg_book');
    tilt.add(b);
    const m = b.userData.model;
    cover = m.userData.bones?.cover || null;
  } else {
    const back = slab(BOOK_W + 0.16, BOOK_H + 0.16, 0.08, 0.08, 0x3f8cff, { outline: 0.02 }); back.position.set(0, BOOK_H / 2, -0.04); tilt.add(back);
    const pl = slab(BOOK_W / 2 - 0.04, BOOK_H, 0.06, 0.04, 0xfffaf0, { outline: 0.012 }); pl.position.set(-BOOK_W / 4, BOOK_H / 2, 0.03); tilt.add(pl);
    const pr = pl.clone(); pr.position.x = BOOK_W / 4; tilt.add(pr);
    const hinge = new T.Group(); hinge.position.set(0, 0, 0.02); tilt.add(hinge);
    const cv = slab(BOOK_W / 2 + 0.08, BOOK_H + 0.16, 0.07, 0.08, 0x3f8cff, { outline: 0.02 }); cv.position.set(-BOOK_W / 4 - 0.04, BOOK_H / 2, 0); hinge.add(cv);
    const st = mesh(new T.ExtrudeGeometry(starShape(0.32), { depth: 0.03, bevelEnabled: false }), 0xffd23a, { outline: 0.012 }); st.position.set(-BOOK_W / 4, BOOK_H / 2, -0.06); st.rotation.y = Math.PI; hinge.add(st);
    cover = hinge; cover.userData.fallback = true;
  }
  pages.position.set(0, 0, 0.09);
  tilt.add(pages);
  g.userData = { tilt, cover, pages };
  return g;
}
// Close the book (k = 1) or open it (k = 0): the cover swings about the spine.
export function setBookOpen(book, open) {
  const c = book.userData.cover;
  if (!c) return;
  if (c.userData.fallback) { c.rotation.y = (1 - open) * Math.PI * 0.97; return; }
  const q0 = c.userData.q0 || (c.userData.q0 = c.quaternion.clone());
  c.quaternion.copy(q0).multiply(new T.Quaternion().setFromAxisAngle(V(0, 1, 0), (1 - open) * Math.PI * 0.97));
}
// a book page place: page 0 = left (nook A), 1 = right (nook B); idx 0..11 in a 4 x 3 grid. Book-local point.
export function bookPlace(page, idx) {
  const col = idx % 4, row = Math.floor(idx / 4);
  const pw = BOOK_W / 2, cw = (pw - 0.22) / 4, ch = (BOOK_H - 0.3) / 3;
  const x = (page ? 0.11 : -pw + 0.11) + cw * (col + 0.5) + (page ? 0.04 : -0.04);
  const y = BOOK_H - 0.15 - ch * (row + 0.5);
  return V(x, y, 0.02);
}
export const PLACE_SIZE = 0.4;
// a faint dotted square for a place not yet earned
export function makeEmptyPlace() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d');
  x.strokeStyle = 'rgba(176,122,74,0.55)'; x.lineWidth = 3; x.setLineDash([6, 6]);
  x.strokeRect(6, 6, 52, 52);
  const m = new T.Mesh(new T.PlaneGeometry(PLACE_SIZE, PLACE_SIZE * 1.15), new T.MeshBasicMaterial({ map: canvasTex(c), transparent: true, depthWrite: false, toneMapped: false }));
  return m;
}

// ---------------------------------------------------------------- Level 3: the homes and the train
const HOME_W = 2.3, HOME_H = 2.85;
const HOME_COL = { animals: 0xd94f3d, food: 0xd8a35a, toys: 0x3f8cff, clothes: 0x9b6dff, vehicles: 0x4cc75a };
export function makeHome(group, model) {
  const g = new T.Group();
  let doors = [], sign = null;
  if (hasCreature(model)) {
    const p = plainProp(model);
    const b = boxOf(p), s = HOME_H / Math.max(0.01, b.getSize(V(0, 0, 0)).y);
    p.scale.setScalar(s);
    const b2 = boxOf(p); p.position.y -= b2.min.y;
    g.add(p);
    const bones = p.userData.model.userData.bones || {};
    doors = ['doorL', 'doorR'].map((n) => bones[n]).filter(Boolean);
    for (const d of doors) { d.userData.side = d === bones.doorL ? -1 : 1; d.userData.closed = d.rotation.y; d.userData.open0 = d.rotation.y + d.userData.side * 1.6; d.rotation.y = d.userData.open0; }
    sign = bones.sign || null;
    g.userData.anchors = p.userData.model.userData.anchors || {};
    g.userData.scale = s;
  } else {
    // code fallback: an open cubby in the group's colour with two shelves
    const col = HOME_COL[group] || 0xd8924f;
    const back = slab(HOME_W, HOME_H, 0.12, 0.1, col); back.position.set(0, HOME_H / 2, -0.45); g.add(back);
    for (const s of [-1, 1]) { const side = mesh(geo.box(0.14, HOME_H, 0.9), col, { hull: 1.04, outline: 0 }); side.position.set(s * (HOME_W / 2 - 0.07), HOME_H / 2, 0); g.add(side); }
    for (const y of [0.07, 1.15, HOME_H - 0.07]) { const sh = mesh(geo.box(HOME_W, 0.14, 0.9), 0xf3d9ae, { hull: 1.03, outline: 0 }); sh.position.set(0, y, 0); g.add(sh); }
    const roof = mesh(geo.cone(1.45, 0.7, 4), col, { outline: 0.02 }); roof.rotation.y = Math.PI / 4; roof.scale.set(1.15, 1, 0.6); roof.position.set(0, HOME_H + 0.35, 0); g.add(roof);
    for (const s of [-1, 1]) {
      const hinge = new T.Group(); hinge.position.set(s * HOME_W / 2, 0, 0.45); g.add(hinge);
      const d = mesh(geo.box(HOME_W / 2 - 0.05, HOME_H - 0.1, 0.08), new T.Color(col).multiplyScalar(0.85).getHex(), { hull: 1.04, outline: 0 });
      d.position.set(-s * (HOME_W / 4), HOME_H / 2, 0); hinge.add(d);
      hinge.rotation.y = s * 1.75;   // standing open
      hinge.userData.open0 = hinge.rotation.y; hinge.userData.side = s; hinge.userData.closed = 0;
      doors.push(hinge);
    }
  }
  // shelf spots: two shelves of three, in home-local space
  const spots = [];
  const k = g.userData.scale || 1;   // the Blender cubby is 2.4 tall: its shelf spots scale with it
  for (const [x, y] of [[-0.5, 0.14], [0.5, 0.14], [0, 1.22], [-0.6, 1.22], [0.6, 1.22], [0, 0.14]]) spots.push(V(x * k, y * k, 0.05 * k));
  // the middle of the home (for its halo)
  const mid = new T.Object3D(); mid.position.set(0, HOME_H * 0.5, 0.3); g.add(mid);
  g.userData = { ...g.userData, group, doors, sign, spots, filled: 0, mid };
  return g;
}
// doors open wider (k 0..1) as her toy comes near (words.md 3.6 step 5)
export function homeNear(home, k) {
  if (home.userData.shut) return;      // a closed (errorless) home keeps its doors shut
  for (const d of home.userData.doors) {
    if (d.userData.open0 === undefined) d.userData.open0 = d.rotation.y;
    const side = d.userData.side ?? (d.name?.endsWith('R') ? 1 : -1);
    d.rotation.y = d.userData.open0 + side * k * 0.5;
  }
  const s = home.userData.sign;
  if (s) { if (s.userData.r0 === undefined) s.userData.r0 = s.rotation.x; s.rotation.x = s.userData.r0 + k * 0.26; }
}
// the toy train: an engine pulling three flat carts (existing models), wheels turning as it rolls
export function makeTrain(nCarts = 3) {
  const g = new T.Group();
  const add = (kind, x) => { const p = plainProp(kind); if (!p) return null; const b = boxOf(p); p.position.set(x, -b.min.y, 0); g.add(p); return p; };
  const add2 = (kind, x, o) => { const p = plainProp(kind, o); if (!p) return null; const b = boxOf(p); p.position.set(x, -b.min.y, 0); g.add(p); return p; };
  const engine = hasCreature('prop_word_train') ? add2('prop_word_train', 0) : add2('prop_engine', 0, { tint: 0x3f8cff });
  if (engine) { const b = boxOf(engine), s = 1.6 / Math.max(0.01, b.getSize(V(0, 0, 0)).y); if (s < 1) { engine.scale.multiplyScalar(s); engine.position.y = -boxOf(engine).min.y + engine.position.y; } }
  const carts = [];
  const CART = [0xff4f4f, 0xffd23a, 0x4cc75a];
  for (let i = 0; i < nCarts; i++) { const c = add2('prop_traincart', -2.1 - i * 2.0, { tint: CART[i % 3] }); if (c) carts.push(c); }
  // a flat deck inside each open cart: the toys stand on it (and the wheel tops never show through the floor)
  let deckTop = 0.7;
  for (const [i, c] of carts.entries()) {
    const b = boxOf(c), sz = b.getSize(V(0, 0, 0)), cc = b.getCenter(V(0, 0, 0));
    const deck = slab(sz.x * 0.8, sz.z * 0.72, 0.06, 0.08, new T.Color(CART[i % 3]).multiplyScalar(0.82).getHex(), { outline: 0.01 });
    deck.rotation.x = -Math.PI / 2;
    deckTop = b.max.y - 0.1;
    deck.position.set(cc.x - g.position.x, deckTop - 0.03, cc.z);
    g.add(deck);
  }
  if (engine) engine.rotation.y = 0;
  const wheels = [];
  g.traverse((o) => { const b = o.userData?.model?.userData?.bones; if (b) for (const n of ['wheelF', 'wheelB']) if (b[n]) wheels.push(b[n]); });
  g.userData = { engine, carts, wheels, top: deckTop };
  g.traverse((o) => { o.userData.noPoke = true; });
  return g;
}
// the toy chest at the end of the track: the next toys wait inside and hop out into the carts (lid on bone 'lid')
export function makeToyChest() {
  const p = plainProp('prop_chest');
  if (!p) return null;
  const b = boxOf(p), s = 1.05 / Math.max(0.01, b.getSize(V(0, 0, 0)).y);
  p.scale.setScalar(s);
  const b2 = boxOf(p); p.position.y -= b2.min.y;
  const g = new T.Group(); g.add(p);
  const bones = p.userData.model.userData.bones || {};
  g.userData = { lid: bones.lid || null, top: boxOf(p).max.y, inner: 0.45 };
  g.traverse((o) => { o.userData.noPoke = true; });
  return g;
}
// the train track along the front of the tidy rug (the existing toy track, repeated)
export function makeTrack(x0, x1, z) {
  const kind = hasCreature('prop_lt_track') ? 'prop_lt_track' : null;   // a low toy track tile (Letter friends)
  if (!kind) return null;
  const g = new T.Group();
  const probe = plainProp(kind); const L = boxOf(probe).getSize(V(0, 0, 0)).x;
  const n = Math.max(1, Math.round((x1 - x0) / (L * 0.98)));
  for (let i = 0; i < n; i++) { const p = i ? plainProp(kind) : probe; const b = boxOf(p); p.position.set(x0 + (i + 0.5) * ((x1 - x0) / n), -b.min.y, z); g.add(p); }
  g.traverse((o) => { o.userData.noPoke = true; });
  return g;
}
// Sky things hang on thin wooden stems rising from a little grassy mound (words.md 6.2 sky nook)
export function makeStem(h) {
  const g = new T.Group();
  const stem = mesh(geo.cyl(0.045, 0.06, h, 10), 0xb07a4a, { outline: 0.012 });
  stem.position.y = h / 2;
  g.add(stem);
  const m = plainProp('prop_m_mound');
  if (m) { const b = boxOf(m), sz = b.getSize(V(0, 0, 0)); m.scale.multiplyScalar(0.7 / Math.max(sz.x, sz.z)); const b2 = boxOf(m); m.position.y -= b2.min.y; g.add(m); }
  g.traverse((o) => { o.userData.noPoke = true; });
  return g;
}
// Pip's little camera on a neck strap (words.md 7.2 w_camera)
export function makePipCamera() {
  if (hasCreature('prop_wg_camera')) {
    const c = plainProp('prop_wg_camera');
    const b = boxOf(c), s = 0.42 / Math.max(0.01, b.getSize(V(0, 0, 0)).x);
    c.scale.setScalar(s);
    return c;
  }
  const g = new T.Group();
  const body = slab(0.42, 0.28, 0.16, 0.06, 0xff4f4f, { outline: 0.012 }); g.add(body);
  const lens = mesh(geo.cyl(0.08, 0.09, 0.08, 20), 0x3a2838, { outline: 0.01 }); lens.rotation.x = Math.PI / 2; lens.position.set(0, -0.01, 0.1); g.add(lens);
  const glass = mesh(geo.circle(0.055, 20), 0x8fd3ff, { outline: 0 }); glass.position.set(0, -0.01, 0.145); g.add(glass);
  const btn = mesh(geo.cyl(0.04, 0.04, 0.05, 12), 0xffd23a, { outline: 0.008 }); btn.position.set(0.13, 0.16, 0); g.add(btn);
  return g;
}
export { INK, basic };
