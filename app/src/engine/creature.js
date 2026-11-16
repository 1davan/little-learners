// Rigged creatures built in Blender (tools/blender) and loaded from app/assets/models/*.glb.
// Each one is a single smooth skinned mesh with a skeleton. On top of the skeleton the game adds:
//  - toon shading from the painted vertex colours, plus an inked outline that bends with the skin
//  - the expressive code face (eyes, brows, mouth, tears) mounted on the head bone, so setFace() works
//  - spring physics on floppy chains (ears, tails, trunks, manes): they lag, swing and settle on every move
//  - procedural life: breathing, idle head motion and a soft look toward the finger
import * as T from '../three.js';
import { GLTFLoader } from '../../vendor/addons/GLTFLoader.js';
import { clone as skClone } from '../../vendor/addons/SkeletonUtils.js';
import { toon, toonUnique, INK } from './toon.js';
import { makeFace } from './faces.js';
import { scene, onFrame, onBeforeRender, onAfterRender, camera } from './stage.js';

const templates = new Map();
const SPRING_RE = /^(ear|tail|trunk|antenna|mane|comb|wattle|tuft|forelock|cheek|wing|bell)/;

export async function loadCreatures() {
  let list = [];
  try { list = await (await fetch('assets/models/index.json')).json(); } catch (e) { console.warn('no creature models', e); return; }
  const loader = new GLTFLoader();
  await Promise.all(list.map(async (kind) => {
    try {
      const gltf = await loader.loadAsync(`assets/models/${kind}.glb`);
      templates.set(kind, prepare(gltf.scene, kind));
    } catch (e) { console.error('model failed', kind, e); }
  }));
}
export function hasCreature(kind) { return templates.has(kind); }
export function creatureKinds() { return [...templates.keys()]; }

// ---------- materials ----------
const skinMat = toon(0xffffff, { vertexColors: true });
const outlineMats = new Map();
function outlineMat(th) {
  if (!outlineMats.has(th)) {
    const m = new T.MeshBasicMaterial({ color: INK, side: T.BackSide });
    m.onBeforeCompile = (s) => { s.vertexShader = s.vertexShader.replace('#include <begin_vertex>', `vec3 transformed = position + normal * ${th.toFixed(4)};`); };
    m.customProgramCacheKey = () => 'skin-outline' + th;
    m.userData.shared = true;
    outlineMats.set(th, m);
  }
  return outlineMats.get(th);
}

function prepare(root, kind) {
  // creature settings saved on the armature in Blender (extras) -> root.userData
  root.traverse((o) => { if (o !== root && o.userData && o.userData.kind) Object.assign(root.userData, o.userData); });
  root.traverse((o) => {
    if (o.isMesh) {
      o.material = skinMat;
      o.geometry.userData.shared = true;
      o.frustumCulled = false; // skinned bounds don't follow bones
    }
  });
  return root;
}

// ---------- making one ----------
export function makeCreature(kind) {
  const tpl = templates.get(kind);
  const inner = skClone(tpl);
  const g = new T.Group();
  g.add(inner);
  const bones = {}, anchors = {};
  let skin = null, faceNode = null;
  const skins = [];
  inner.traverse((o) => {
    if (o.isBone) bones[o.name.replace(/[._]/g, '')] = o; // ear.L.1 -> earL1
    if (o.isSkinnedMesh) skins.push(o);
    if (o.name === 'face_anchor') faceNode = o;
  });
  skin = skins.find((m) => m.name === kind) || skins.find((m) => !/^cloth/.test(m.name)) || skins[0];
  // outline: a second skinned mesh on the same skeleton, pushed out along normals, back faces only
  const layers = {};
  const th = (tpl.userData.outline ?? 0.028);
  for (const m of skins) {
    const ol = new T.SkinnedMesh(m.geometry, outlineMat(m === skin ? th : th * 0.8));
    ol.bind(m.skeleton, m.bindMatrix);
    ol.frustumCulled = false;
    ol.userData.outline = true;
    m.parent.add(ol);
    ol.position.copy(m.position); ol.quaternion.copy(m.quaternion); ol.scale.copy(m.scale);
    if (m !== skin) {
      const name = m.name.replace(/\.\d+$/, '');
      layers[name] = { mesh: m, outline: ol };
      if (/^cloth/.test(name)) { m.visible = false; ol.visible = false; }
    }
  }
  g.updateMatrixWorld(true);
  // anchors as model-space points (rest pose) for the body-part game
  inner.traverse((o) => {
    if (o.name.startsWith('anchor_')) { const p = o.getWorldPosition(new T.Vector3()); anchors[o.name.slice(7)] = [p.x, p.y, p.z]; }
  });
  const u = g.userData;
  u.kind = kind;
  u.creature = true;
  u.bones = bones;
  u.skin = skin;
  u.layers = layers; // garments / accessories modelled on the same skeleton
  u.wear = (name, on = true) => { const l = layers[name]; if (l) { l.mesh.visible = on; l.outline.visible = on; } return !!l; };
  u.body = bones.body || inner;
  u.head = bones.head || u.body;
  u.anchors = anchors;
  const pair = (a, b) => (bones[a] && bones[b] ? [bones[a], bones[b]] : undefined);
  u.arms = pair('armL', 'armR');
  u.wings = pair('wingL', 'wingR');
  u.claws = pair('clawL', 'clawR');
  const trunk = Object.keys(bones).filter((n) => /^trunk\d/.test(n)).sort().map((n) => bones[n]);
  if (trunk.length) u.trunk = trunk;
  if (bones.tail1) u.tail = bones.tail1;
  if (faceNode) {
    const x = faceNode.userData || {};
    const R = x.R || 0.6;
    const fo = { mouth: x.mouth !== 0 && x.mouth !== false, noseColor: x.noseColor ?? null };
    for (const k of ['eyeX', 'eyeY', 'eyeSize', 'browY', 'cheekColor']) if (typeof x[k] === 'number') fo[k] = x[k];
    if (x.cheeks === 0 || x.cheeks === false) fo.cheeks = false;
    const face = makeFace(R, fo);
    if (x.faceScale) face.scale.setScalar(x.faceScale);
    // optional mouth offset (for muzzles that stick out): face(..., mouthY=, mouthZ=) in Blender
    if (x.mouthY || x.mouthZ) for (const k of ['smile', 'frown', 'oh', 'flat', 'joy']) { const m = face.userData[k]; if (m) { m.position.y += x.mouthY || 0; m.position.z += x.mouthZ || 0; } }
    faceNode.add(face);
    u.face = face;
    u.eyes = face.userData.eyes;
  }
  // rest pose for every bone, so reactions can blend back to it
  for (const b of Object.values(bones)) b.userData.q0 = b.quaternion.clone();
  u.springs = makeSprings(bones);
  u.kick = (dir, amt = 1) => kick(u.springs, dir, amt);
  u.look = new T.Vector3(); // where the head wants to look (world), set by poke / pointer
  u.lookAmt = 0;
  live.add(g);
  return g;
}

// ---------- spring bones ----------
// Each floppy bone keeps a simulated tip point. Every frame the tip is pulled toward where the bone's rest
// pose would put it, with momentum and damping, plus a little gravity; then the bone is turned to point at it.
const MAX_SWING = 0.9, _qi = new T.Quaternion(), _turn = new T.Quaternion();
const _v = new T.Vector3(), _w = new T.Vector3(), _q = new T.Quaternion(), _pq = new T.Quaternion(), _d = new T.Vector3(), Y = new T.Vector3(0, 1, 0);
function makeSprings(bones) {
  const list = [];
  for (const [name, b] of Object.entries(bones)) {
    if (!SPRING_RE.test(name)) continue;
    if (/^wing/.test(name)) continue; // wings are driven by games
    const child = b.children.find((c) => c.isBone);
    const len = child ? child.position.length() : 0.35;
    const depth = (name.match(/(\d)$/) || [0, 1])[1] | 0;
    const stiff = /^trunk/.test(name) ? 1.7 : /^tail/.test(name) ? 0.9 : 1;
    list.push({ b, len: Math.max(0.1, len), tip: null, vel: new T.Vector3(), k: (90 - depth * 18) * stiff, damp: /^trunk/.test(name) ? 10 : 7.5, grav: 1.2, base: b.quaternion.clone(), lastQ: null });
  }
  // parents first
  list.sort((a, c) => depthOf(a.b) - depthOf(c.b));
  return list;
}
function depthOf(o) { let d = 0; while (o.parent) { d++; o = o.parent; } return d; }
function kick(springs, dir, amt) {
  for (const s of springs) { if (!s.tip) continue; s.vel.addScaledVector(dir, amt * (0.8 + Math.random() * 0.5)); }
}
function stepSprings(springs, dt) {
  for (const s of springs) {
    const b = s.b;
    // the pose the game wants (if a game rotated this bone since last frame, that's the new base),
    // springs then swing around it
    if (s.lastQ && !b.quaternion.equals(s.lastQ)) s.base.copy(b.quaternion);
    b.quaternion.copy(s.base);
    b.updateMatrixWorld(true);
    const head = b.getWorldPosition(_v);
    b.getWorldQuaternion(_q);
    const rest = _w.copy(Y).applyQuaternion(_q).multiplyScalar(s.len).add(head); // rest tip (world)
    if (!s.tip) { s.tip = rest.clone(); continue; }
    // spring toward rest + damping + gravity
    _d.copy(rest).sub(s.tip).multiplyScalar(s.k);
    _d.y -= s.grav;
    s.vel.addScaledVector(_d, dt);
    s.vel.multiplyScalar(Math.exp(-s.damp * dt));
    s.tip.addScaledVector(s.vel, dt);
    // keep length
    _d.copy(s.tip).sub(head);
    const L = _d.length() || 1;
    s.tip.copy(head).addScaledVector(_d, s.len / L);
    // turn the bone toward the tip: rotation from rest dir to tip dir, in parent space
    b.parent.getWorldQuaternion(_pq).invert();
    const restDir = _w.copy(rest).sub(head).normalize().applyQuaternion(_pq);
    const tipDir = _d.normalize().applyQuaternion(_pq);
    const turn = _turn.setFromUnitVectors(restDir, tipDir);
    // never swing further than ~50° from the pose (stops ears smearing into the head on a hard shove)
    const ang = 2 * Math.acos(Math.min(1, Math.abs(turn.w)));
    if (ang > MAX_SWING) {
      turn.slerp(_qi, 1 - MAX_SWING / ang);
      s.vel.multiplyScalar(0.5);
      s.tip.copy(head).add(_w.copy(restDir).applyQuaternion(turn).applyQuaternion(_pq.invert()).multiplyScalar(s.len));
    }
    b.quaternion.premultiply(turn);
    b.updateMatrixWorld(true);
    if (!s.lastQ) s.lastQ = new T.Quaternion();
    s.lastQ.copy(b.quaternion);
  }
}

// ---------- per-frame life ----------
const live = new Set();
function inScene(o) { while (o.parent) o = o.parent; return o === scene; }
onFrame((dt) => {
  const h = Math.min(dt, 1 / 30);
  for (const g of live) {
    if (!inScene(g)) { g.userData._gone = (g.userData._gone || 0) + 1; if (g.userData._gone > 240) live.delete(g); continue; }
    g.userData._gone = 0;
    if (!g.visible) continue;
    g.updateMatrixWorld(true);
    stepSprings(g.userData.springs, h);
  }
});

// Use the Blender model when one has been built for this kind, else the older code-built model.
export function orCreature(kind, fallback) {
  return (...args) => {
    if (!templates.has(kind)) return fallback(...args);
    const g = makeCreature(kind);
    const opts = templates.get(kind).userData;
    // optional first argument, as the older makers took: a scale (chick, duck) or a body colour (crab)
    const arg = typeof args[0] === 'number' ? args[0] : opts.argDefault;
    if (typeof arg === 'number') {
      if (opts.argMode === 'scale') { g.scale.setScalar(arg * (opts.argScale || 1)); g.userData.baseScale = g.scale.x; }
      if (opts.argMode === 'tint' && g.userData.skin) {
        // vertex colours painted white/grey in the tint zones get multiplied by the material colour
        g.userData.skin.material = toonUnique(arg, { vertexColors: true });
      }
    }
    return g;
  };
}

// A garment layer as a free-standing prop (rest shape, centred on its own bounds, bottom at y=0) for wardrobes,
// shelves and dragging. kind = the creature that owns it, name = the layer name (e.g. 'cloth_hat_party').
export function garmentProp(kind, name) {
  const tpl = templates.get(kind);
  if (!tpl) return null;
  let src = null;
  tpl.traverse((o) => { if (o.isSkinnedMesh && o.name.replace(/\.\d+$/, '') === name) src = o; });
  if (!src) return null;
  tpl.updateMatrixWorld(true);
  const g = new T.Group();
  const m = new T.Mesh(src.geometry, skinMat);
  m.applyMatrix4(src.matrixWorld); // bind pose = rest pose
  const ol = new T.Mesh(src.geometry, outlineMat(0.02));
  ol.applyMatrix4(src.matrixWorld);
  ol.userData.outline = true;
  const inner = new T.Group(); inner.add(m, ol);
  const box = new T.Box3().setFromObject(m);
  const c = box.getCenter(new T.Vector3());
  inner.position.set(-c.x, -box.min.y, -c.z);
  g.add(inner);
  g.userData.garment = name;
  g.userData.size = box.getSize(new T.Vector3());
  return g;
}

// ---------- motion layer: gaits, look-at, idle life ----------
// Purely visual offsets applied just before each render and undone right after, so games keep full control of
// positions/rotations and never fight these. Characters that a game slides around automatically walk with their
// own gait; heads follow the child's finger; idle characters sway and glance around.
const GAIT = {
  hop: ['bunny', 'frog', 'chick', 'pip'],
  waddle: ['duck', 'hen', 'gull', 'pig'],
  scuttle: ['crab'],
  stomp: ['elephant'],
};
const gaitOf = (u) => u.gait || Object.keys(GAIT).find((k) => GAIT[k].includes(u.kind)) || 'walk';
const attention = { p: new T.Vector3(0, 1.5, 8), t: -99 };
window.addEventListener('pointerdown', (e) => noteAttention(e), true);
window.addEventListener('pointermove', (e) => { if (e.buttons || e.pointerType === 'mouse') noteAttention(e); }, true);
const _ray = new T.Raycaster(), _pl = new T.Plane(new T.Vector3(0, 0, 1), -1);
function noteAttention(e) {
  if (!cameraRef) return;
  _ray.setFromCamera({ x: (e.clientX / innerWidth) * 2 - 1, y: -(e.clientY / innerHeight) * 2 + 1 }, cameraRef);
  const hit = new T.Vector3();
  if (_ray.ray.intersectPlane(_pl, hit)) { attention.p.copy(hit); attention.t = performance.now() / 1000; }
}
let cameraRef = camera;
export function setMotionCamera(cam) { cameraRef = cam; }

const _wp = new T.Vector3(), _wq = new T.Quaternion(), _inv = new T.Quaternion(), _d2 = new T.Vector3(), _e = new T.Euler();
const saved = [];
function save(o) { saved.push(o, o.position.clone(), o.quaternion.clone()); }

onBeforeRender((dt, t) => {
  if (dt <= 0) return;
  const now = performance.now() / 1000;
  for (const g of live) {
    if (!g.visible || g.userData._gone) continue;
    if (/^prop_/.test(g.userData.kind) || g.userData.still) continue; // props don't walk, sway or look around
    const u = g.userData, b = u.bones || {};
    const m = u.motion || (u.motion = { prev: null, v: new T.Vector3(), walk: 0, phase: Math.random() * 6, yaw: 0, pitch: 0, ph: Math.random() * 6, glance: 0, gp: new T.Vector3(), lastStep: 0 });
    g.getWorldPosition(_wp);
    const sc = g.getWorldScale(_d2).y || 1;
    if (!m.prev) { m.prev = _wp.clone(); continue; }
    // smoothed ground speed in model units per second
    const vx = (_wp.x - m.prev.x) / dt / sc, vz = (_wp.z - m.prev.z) / dt / sc, vy = (_wp.y - m.prev.y) / dt / sc;
    m.prev.copy(_wp);
    m.v.lerp(_d2.set(vx, vy, vz), Math.min(1, dt * 10));
    const speed = Math.hypot(m.v.x, m.v.z);
    const airborne = Math.abs(m.v.y) > 1.2; // a game hop/throw already moves it: don't add steps on top
    m.walk += ((speed > 0.35 && !airborne && !u.noWalk ? 1 : 0) - m.walk) * Math.min(1, dt * 7);
    const gait = gaitOf(u);
    const rate = gait === 'hop' ? 2.2 : gait === 'scuttle' ? 4.5 : gait === 'stomp' ? 1.3 : gait === 'waddle' ? 2.6 : 2.0;
    m.phase += dt * (rate * Math.PI) * (0.6 + Math.min(1.6, speed * 0.35)) * (m.walk > 0.05 ? 1 : 0);
    const w = m.walk, s1 = Math.sin(m.phase), c1 = Math.cos(m.phase);
    // travel direction in the creature's own frame (for leaning into the move)
    g.getWorldQuaternion(_wq); _inv.copy(_wq).invert();
    const lv = _d2.set(m.v.x, 0, m.v.z).applyQuaternion(_inv);
    const body = u.body !== g && u.body?.isBone ? u.body : null;
    if (body && (w > 0.01 || true)) {
      save(body);
      let bob = 0, roll = 0;
      if (gait === 'hop') bob = Math.abs(s1) * 0.32 * w;
      else if (gait === 'waddle') { bob = Math.abs(s1) * 0.06 * w; roll = s1 * 0.16 * w; }
      else if (gait === 'scuttle') { bob = Math.abs(Math.sin(m.phase * 2)) * 0.04 * w; roll = s1 * 0.05 * w; }
      else if (gait === 'stomp') { bob = Math.abs(s1) * 0.07 * w; roll = s1 * 0.07 * w; }
      else { bob = Math.abs(s1) * 0.09 * w; roll = s1 * 0.06 * w; }
      // idle sway when standing (alive, never statue-still)
      const idle = 1 - w;
      roll += Math.sin(t * 0.9 + m.ph) * 0.022 * idle;
      const lean = Math.max(-0.18, Math.min(0.18, lv.z * 0.035)) * w;
      body.position.y += bob;
      body.rotation.z += roll - Math.max(-0.12, Math.min(0.12, lv.x * 0.025)) * w;
      body.rotation.x += lean + (gait === 'hop' ? -c1 * 0.08 * w : 0);
      // a footfall: ears and tails bounce
      const step = Math.floor(m.phase / Math.PI);
      if (w > 0.5 && step !== m.lastStep) { m.lastStep = step; u.kick && u.kick(new T.Vector3(0, gait === 'hop' ? -5 : gait === 'stomp' ? -0.8 : -2.2, 0)); }
    }
    // legs and arms swing
    if (w > 0.01) {
      const legs = [['legL', 'legR'], ['legFL', 'legFR'], ['legBR', 'legBL']];
      const amp = gait === 'hop' ? 0 : gait === 'waddle' ? 0.35 : gait === 'scuttle' ? 0.3 : 0.55;
      for (const [a, c] of legs) {
        if (b[a]) { save(b[a]); b[a].rotation.x += s1 * amp * w; }
        if (b[c]) { save(b[c]); b[c].rotation.x -= s1 * amp * w; }
      }
      if (gait === 'hop') for (const n of ['legL', 'legR', 'legBL', 'legBR']) if (b[n]) { save(b[n]); b[n].rotation.x += -Math.max(0, c1) * 0.6 * w; }
      const arms = u.arms || u.wings;
      if (arms) {
        save(arms[0]); save(arms[1]);
        if (u.wings && !u.arms) { const f = (gait === 'waddle' ? 0.35 : 0.25) * w * (0.5 + 0.5 * Math.abs(s1)); arms[0].rotation.z += f; arms[1].rotation.z -= f; }
        else { arms[0].rotation.x -= s1 * 0.45 * w; arms[1].rotation.x += s1 * 0.45 * w; }
      }
    }
    // look-at: toward the child's finger for a few seconds after a touch, otherwise mostly at the child (camera)
    // with the odd glance around
    const head = u.head !== g && u.head?.isBone && u.head !== u.body ? u.head : null;
    if (head && !u.noLook) {
      let tgt;
      if (now - attention.t < 2.5) tgt = attention.p;
      else {
        if (now > m.glance) { m.glance = now + 2 + Math.random() * 4; m.gp.set((Math.random() - 0.5) * 12, 1 + Math.random() * 3, Math.random() < 0.6 ? 12 : 0); }
        tgt = m.gp;
      }
      head.getWorldPosition(_d2);
      const dir = tgt.clone().sub(_d2).applyQuaternion(_inv);
      const yaw = Math.max(-0.5, Math.min(0.5, Math.atan2(dir.x, Math.max(0.3, dir.z))));
      const pitch = Math.max(-0.25, Math.min(0.2, -Math.atan2(dir.y, Math.hypot(dir.x, dir.z)) * 0.6));
      m.yaw += (yaw - m.yaw) * Math.min(1, dt * 4);
      m.pitch += (pitch - m.pitch) * Math.min(1, dt * 4);
      save(head);
      head.rotation.y += m.yaw * 0.75;
      if (u.kind !== 'crab') head.rotation.x += m.pitch; // the crab's 'head' is its whole shell: yaw only
    }
  }
});
onAfterRender(() => {
  for (let i = 0; i < saved.length; i += 3) { saved[i].position.copy(saved[i + 1]); saved[i].quaternion.copy(saved[i + 2]); }
  saved.length = 0;
});
