// Real rigid-body physics (Rapier, vendored WASM) for props: things that fall, bounce, roll, tumble into
// baskets and pile up. Characters are not simulated; they use squash-and-stretch animation.
//
//   await physics.ready()                       // once at boot (main.js does this)
//   physics.ground(y = 0)                       // a floor (call per lesson; physics.clear() removes everything)
//   physics.add(obj, { shape: 'ball', r })      // simulate an Object3D (its parent should be un-rotated / at origin scale)
//   physics.container(pos, { r, h, wall })      // a bowl/bucket/basket: floor + ring of walls things can land in
//   physics.box(pos, size, rotY)                // a static box (table, shelf, stool)
//   await physics.toss(obj, target, { arc })    // launch obj on an arc so it lands at target, then let it settle
//   physics.poke(obj, strength)                 // a jump/spin impulse (for tapping props)
//   physics.remove(obj); physics.removeStatic(body); physics.clear()
//   physics.moveStatic(body, pos, rotY); physics.add(obj, { rot: [false, false, true] }); toss(..., { angvel })
//   physics.add(obj, { planar: true })        // only moves in its z plane (piles that never hide each other)
//   physics.slab(pos, size, quat)             // a static cuboid with any rotation (e.g. a slope tilted about z)
//   physics.kinematic(obj, { size }); physics.moveKinematic(obj)   // code-moved bodies that push dynamic ones
//   physics.hinge(obj, anchor); physics.freeze(obj)                // a revolute joint; turn a body fixed in place
//
// Bounces and landings play soft sounds automatically (sfx.land / thunk), throttled.
import * as T from '../three.js';
import RAPIER, { init as rapierInit } from '../../vendor/rapier.es.js';
import { onFrame, onBeforeRender, onAfterRender } from './stage.js';
import { sfx } from './audio.js';

let R = null, world = null;
const bodies = new Map(); // obj -> { body, collider, prevVy }
const kins = new Map();   // obj -> { body, world } kinematic bodies moved by code (see physics.kinematic)
let statics = [];
const _v = new T.Vector3(), _q = new T.Quaternion(), _pq = new T.Quaternion(), _ps = new T.Vector3();

export const physics = {
  async ready() {
    if (R) return;
    try { await rapierInit(); R = RAPIER; newWorld(); } catch (e) { console.warn('physics unavailable', e); }
  },
  get ok() { return !!world; },

  ground(y = 0, friction = 0.9) {
    if (!world) return;
    const b = world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(0, y - 0.5, 0));
    statics.push(b);
    world.createCollider(R.ColliderDesc.cuboid(60, 0.5, 60).setFriction(friction).setRestitution(0.35), b);
    // invisible playpen walls just outside the view, so nothing bounces away forever or into the camera
    for (const [x, z, hx, hz] of [[-14, 0, 0.5, 30], [14, 0, 0.5, 30], [0, 8, 30, 0.5], [0, -14, 30, 0.5]]) {
      world.createCollider(R.ColliderDesc.cuboid(hx, 12, hz).setTranslation(x, 12, z).setRestitution(0.3).setFriction(0.5), b);
    }
  },

  box(pos, size, rotY = 0) {
    if (!world) return null;
    const q = new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), rotY);
    const b = world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(pos.x, pos.y, pos.z).setRotation(q));
    statics.push(b);
    world.createCollider(R.ColliderDesc.cuboid(size.x / 2, size.y / 2, size.z / 2).setFriction(0.8).setRestitution(0.3), b);
    return b;
  },

  // An open container: floor disc + ring of thin wall boxes (r = inner radius at the top, h = wall height).
  container(pos, { r = 1, h = 1, wall = 0.08, floor = 0.1, n = 14 } = {}) {
    if (!world) return null;
    const b = world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(pos.x, pos.y, pos.z));
    statics.push(b);
    world.createCollider(R.ColliderDesc.cylinder(floor / 2, r).setTranslation(0, floor / 2, 0).setRestitution(0.2).setFriction(1), b);
    const seg = (2 * Math.PI * r) / n;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const q = new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), a); // long side along the rim tangent
      world.createCollider(R.ColliderDesc.cuboid(seg * 0.6, h / 2, wall / 2)
        .setTranslation(Math.sin(a) * (r + wall / 2), h / 2, Math.cos(a) * (r + wall / 2))
        .setRotation(q).setRestitution(0.25).setFriction(0.8), b);
    }
    return b;
  },

  add(obj, { shape = 'auto', r = null, size = null, mass = 1, bounce = 0.45, friction = 0.7, spin = true, sleep = true, planar = false, rot = null } = {}) {
    if (!world) return null;
    physics.remove(obj);
    obj.updateMatrixWorld(true);
    obj.getWorldPosition(_v); obj.getWorldQuaternion(_q);
    const desc = R.RigidBodyDesc.dynamic().setTranslation(_v.x, _v.y, _v.z).setRotation(_q).setCanSleep(sleep)
      .setLinearDamping(0.15).setAngularDamping(0.6).setCcdEnabled(true);
    const body = world.createRigidBody(desc);
    if (!spin) body.lockRotations(true, true);
    // planar: stays in its z plane (moves only sideways/up-down, spins only face-on) so piles never hide each other
    // rot: [x, y, z] booleans - which axes it may spin around
    if (rot) body.setEnabledRotations(!!rot[0], !!rot[1], !!rot[2], true);
    if (planar) { body.setEnabledTranslations(true, true, false, true); body.setEnabledRotations(false, false, true, true); }
    let cd;
    // 'auto' (default): the object's real shape as a convex hull (a carrot rolls like a carrot, a box tips over
    // its edge), unless a ball radius r was given. Falls back to a ball if the hull can't be built.
    if (shape === 'auto') shape = r != null ? 'ball' : 'hull';
    if (shape === 'hull') {
      const pts = hullPoints(obj, _v, _q);
      cd = pts ? R.ColliderDesc.convexHull(pts) : null;
      if (!cd) shape = 'ball';
    }
    if (cd) { /* hull */ } else if (shape === 'box') {
      const s = size || boundsSize(obj);
      cd = R.ColliderDesc.cuboid(s.x / 2, s.y / 2, s.z / 2).setTranslation(0, s.y / 2 - centerY(obj), 0);
    } else {
      const rr = r ?? boundsRadius(obj);
      cd = R.ColliderDesc.ball(rr);
    }
    cd.setRestitution(bounce).setFriction(friction).setDensity(mass).setActiveEvents(R.ActiveEvents.CONTACT_FORCE_EVENTS);
    const collider = world.createCollider(cd, body);
    bodies.set(obj, { body, collider, prevVy: 0, lastSnd: 0, squashT: 0, squashAmp: 0, noSquash: !!obj.userData.noSquash });
    return body;
  },

  // move a static body returned by box() / container() (e.g. containers that swap places)
  moveStatic(b, pos, rotY = null) {
    if (!world || !b) return;
    b.setTranslation({ x: pos.x, y: pos.y, z: pos.z }, true);
    if (rotY !== null) { const q = new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), rotY); b.setRotation(q, true); }
  },

  // remove one static collider body returned by box() / container()
  removeStatic(b) {
    if (!world || !b) return;
    world.removeRigidBody(b);
    statics = statics.filter((x) => x !== b);
  },

  remove(obj) {
    const e = bodies.get(obj);
    if (!e || !world) return;
    world.removeRigidBody(e.body);
    bodies.delete(obj);
  },
  has(obj) { return bodies.has(obj); },
  body(obj) { return bodies.get(obj)?.body; },

  impulse(obj, v, torque = null) {
    const e = bodies.get(obj); if (!e) return;
    e.body.wakeUp();
    const m = e.body.mass();
    e.body.applyImpulse({ x: v.x * m, y: v.y * m, z: v.z * m }, true);
    if (torque) e.body.applyTorqueImpulse({ x: torque.x * m, y: torque.y * m, z: torque.z * m }, true);
  },

  // A happy hop for a tapped prop: up, a little sideways, and a spin.
  poke(obj, k = 1) {
    if (!bodies.has(obj)) return;
    const s = () => (Math.random() - 0.5) * 2;
    physics.impulse(obj, { x: s() * 1.2 * k, y: (4.5 + Math.random() * 1.5) * k, z: s() * 0.6 * k }, { x: s() * 0.25, y: s() * 0.3, z: s() * 0.25 });
  },

  // Throw obj on a ballistic arc that lands at `target` (world), then let it bounce and settle.
  // Resolves when it has come to rest (or after maxT seconds).
  async toss(obj, target, { arc = 1.2, time = null, maxT = 2.2, spin = 1, angvel = null, soft = true, ...addOpts } = {}) {
    if (!world) { obj.position.copy(obj.parent ? obj.parent.worldToLocal(target.clone()) : target); return; }
    if (!bodies.has(obj)) physics.add(obj, addOpts);
    const e = bodies.get(obj);
    const p = e.body.translation();
    const g = 9.81 * 1.6;
    // a true ballistic arc whose top is `arc` above the higher end, landing exactly on target
    const apex = Math.max(p.y, target.y) + Math.max(0.05, arc);
    const vy = Math.sqrt(2 * g * (apex - p.y));
    const t = time ?? (vy + Math.sqrt(2 * g * (apex - target.y))) / g;
    const vx = (target.x - p.x) / t, vz = (target.z - p.z) / t;
    const vyy = time ? (target.y - p.y + 0.5 * g * t * t) / t : vy;
    e.body.setLinvel({ x: vx, y: vyy, z: vz }, true);
    e.body.setAngvel(angvel || { x: (Math.random() - 0.5) * 6 * spin, y: (Math.random() - 0.5) * 4 * spin, z: (Math.random() - 0.5) * 6 * spin }, true);
    e.soft = soft; // first landing kills most sideways speed so it stays where it was thrown
    const t0 = performance.now();
    await new Promise((res) => {
      const check = () => {
        if (!bodies.has(obj)) return res();
        const el = (performance.now() - t0) / 1000;
        if ((el > 0.35 && e.body.isSleeping()) || el > maxT) return res();
        const v = e.body.linvel();
        if (el > t + 0.25 && Math.hypot(v.x, v.y, v.z) < 0.25) return res();
        requestAnimationFrame(check);
      };
      requestAnimationFrame(check);
    });
  },

  // ---- additions (Roll & push); purely additive: nothing above behaves differently ----
  // The Rapier module itself (enums such as CoefficientCombineRule, RigidBodyType), or null before ready().
  get rapier() { return R; },
  // A static cuboid with a full rotation (e.g. a slope tilted about z). quat: THREE.Quaternion or {x, y, z, w}.
  slab(pos, size, quat = null, { friction = 0.8, bounce = 0.3 } = {}) {
    if (!world) return null;
    const q = quat || { x: 0, y: 0, z: 0, w: 1 };
    const b = world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(pos.x, pos.y, pos.z).setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }));
    statics.push(b);
    world.createCollider(R.ColliderDesc.cuboid(size.x / 2, size.y / 2, size.z / 2).setFriction(friction).setRestitution(bounce), b);
    return b;
  },
  // A kinematic (position-based) body that follows obj: code moves obj (tweens), then calls moveKinematic(obj) so the
  // body follows and pushes / carries the dynamic bodies it meets. size: cuboid [x, y, z] (centred on obj + offset),
  // or points: a convex hull (in obj's frame). Not part of the dynamic sync loop (no landing sounds, no squash).
  kinematic(obj, { size = null, points = null, offset = null, friction = 0.8, bounce = 0.1 } = {}) {
    if (!world) return null;
    physics.removeKinematic(obj);
    obj.updateMatrixWorld(true);
    obj.getWorldPosition(_v); obj.getWorldQuaternion(_q);
    const body = world.createRigidBody(R.RigidBodyDesc.kinematicPositionBased().setTranslation(_v.x, _v.y, _v.z).setRotation(_q));
    let cd;
    if (points) cd = R.ColliderDesc.convexHull(points instanceof Float32Array ? points : new Float32Array(points));
    if (!cd) { const s = size || [1, 1, 1]; cd = R.ColliderDesc.cuboid(s[0] / 2, s[1] / 2, s[2] / 2); }
    if (offset) cd.setTranslation(offset[0], offset[1], offset[2]);
    cd.setFriction(friction).setRestitution(bounce);
    world.createCollider(cd, body);
    kins.set(obj, { body, world });
    return body;
  },
  // Move a kinematic body to obj's current world pose (or to pos / quat when given); it gets there on the next step.
  moveKinematic(obj, pos = null, quat = null) {
    const k = kins.get(obj);
    if (!k || k.world !== world) return;
    if (!pos || !quat) { obj.updateMatrixWorld(true); obj.getWorldPosition(_v); obj.getWorldQuaternion(_q); }
    const p = pos || _v, q = quat || _q;
    k.body.setNextKinematicTranslation({ x: p.x, y: p.y, z: p.z });
    k.body.setNextKinematicRotation({ x: q.x, y: q.y, z: q.z, w: q.w });
  },
  removeKinematic(obj) {
    const k = kins.get(obj);
    if (!k) return;
    kins.delete(obj);
    if (k.world === world && world) world.removeRigidBody(k.body);
  },
  kinematicBody(obj) { const k = kins.get(obj); return k && k.world === world ? k.body : null; },
  // A hinge: obj's dynamic body (physics.add it first) turns about a fixed world point `anchor` around `axis`
  // (default z, for things that stay in the picture plane). Returns the Rapier joint (null without physics).
  hinge(obj, anchor, { axis = { x: 0, y: 0, z: 1 } } = {}) {
    const e = bodies.get(obj);
    if (!world || !e) return null;
    const fixedB = world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(anchor.x, anchor.y, anchor.z));
    statics.push(fixedB);
    const t = e.body.translation(), r = e.body.rotation();
    const inv = new T.Quaternion(r.x, r.y, r.z, r.w).invert();
    const local = new T.Vector3(anchor.x - t.x, anchor.y - t.y, anchor.z - t.z).applyQuaternion(inv);
    const ax = new T.Vector3(axis.x, axis.y, axis.z).applyQuaternion(inv).normalize();
    const jd = R.JointData.revolute({ x: 0, y: 0, z: 0 }, { x: local.x, y: local.y, z: local.z }, { x: ax.x, y: ax.y, z: ax.z });
    return world.createImpulseJoint(jd, fixedB, e.body, true);
  },
  // Turn a simulated body into a fixed one where it is (it stays in place, others land on it), or back (on = false).
  freeze(obj, on = true) {
    const e = bodies.get(obj);
    if (!e || !world) return;
    e.body.setBodyType(on ? R.RigidBodyType.Fixed : R.RigidBodyType.Dynamic, true);
  },

  clear() {
    if (!world) return;
    bodies.clear();
    statics = [];
    world.free();
    newWorld();
  },
};

function newWorld() {
  world = new R.World({ x: 0, y: -9.81 * 1.6, z: 0 }); // a little floatier-snappy than real life
  world.timestep = 1 / 60;
}

function boundsRadius(obj) {
  const b = new T.Box3().setFromObject(obj);
  const s = b.getSize(new T.Vector3());
  return Math.max(0.08, Math.max(s.x, s.y, s.z) / 2);
}
// Points of all visible meshes under obj, in obj's frame (world scale), thinned to <= ~240 for a fast hull.
function hullPoints(obj, pos, quat) {
  obj.updateMatrixWorld(true);
  const inv = new T.Matrix4().compose(pos, quat, new T.Vector3(1, 1, 1)).invert();
  const all = [];
  const p = new T.Vector3();
  obj.traverse((m) => {
    if (!m.isMesh || m.userData.outline || !m.geometry?.attributes?.position) return;
    for (let o = m; o && o !== obj.parent; o = o.parent) if (!o.visible) return; // hidden (incl. hidden parents)
    const a = m.geometry.attributes.position;
    const step = Math.max(1, Math.floor(a.count / 160));
    for (let i = 0; i < a.count; i += step) { p.fromBufferAttribute(a, i).applyMatrix4(m.matrixWorld).applyMatrix4(inv); all.push(p.x, p.y, p.z); }
  });
  if (all.length < 12) return null;
  return new Float32Array(all.length > 720 ? all.filter((_, i) => Math.floor(i / 3) % Math.ceil(all.length / 720) === 0) : all);
}
function boundsSize(obj) { return new T.Box3().setFromObject(obj).getSize(new T.Vector3()); }
function centerY(obj) { const b = new T.Box3().setFromObject(obj); obj.getWorldPosition(_v); return _v.y - b.min.y; }

let acc = 0;
onFrame((dt) => {
  if (!world || !bodies.size) return;
  acc += Math.min(dt, 0.05);
  let steps = 0;
  while (acc >= world.timestep && steps < 5) { world.step(); acc -= world.timestep; steps++; }
  const now = performance.now();
  for (const [obj, e] of bodies) {
    if (!obj.parent) { physics.remove(obj); continue; }
    const t = e.body.translation(), r = e.body.rotation();
    _v.set(t.x, t.y, t.z);
    obj.parent.updateMatrixWorld(true);
    obj.parent.worldToLocal(_v);
    obj.position.copy(_v);
    obj.parent.getWorldQuaternion(_pq).invert();
    obj.quaternion.set(r.x, r.y, r.z, r.w).premultiply(_pq);
    // landing sounds: a sudden change from falling to not falling
    const vy = e.body.linvel().y;
    if (t.y < -3) { // fell out of the world: pop it back in, gently
      e.body.setTranslation({ x: Math.max(-9, Math.min(9, t.x)), y: 2.5, z: Math.max(-6, Math.min(4, t.z)) }, true);
      e.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }
    if (e.prevVy < -2.2 && vy > e.prevVy + 2 && now - e.lastSnd > 140) {
      e.lastSnd = now;
      if (!e.noSquash) { e.squashT = 0.0001; e.squashAmp = Math.min(1, -e.prevVy / 8); }
      const hard = Math.min(1, -e.prevVy / 9);
      if (!obj.userData.quiet) { if (hard > 0.5) sfx.thunk ? sfx.thunk() : sfx.land(); else if (hard > 0.3) sfx.land && sfx.land(); } // soft landings stay silent
      if (e.soft) { const v = e.body.linvel(); e.body.setLinvel({ x: v.x * 0.3, y: v.y, z: v.z * 0.3 }, true); e.soft = false; }
    }
    e.prevVy = vy;
  }
});

// Impact squash (visual only): a quick jelly squish when something lands hard, applied just for the render.
onBeforeRender((dt) => {
  for (const [obj, e] of bodies) {
    if (!e.squashT) continue;
    e.squashT += dt / 0.24;
    if (e.squashT >= 1) { e.squashT = 0; continue; }
    const p = e.squashT, k = 1 - 0.28 * e.squashAmp * Math.sin(p * Math.PI) * (1 - p * 0.4);
    e.pre = e.pre || new T.Vector3();
    e.pre.copy(obj.scale);
    obj.scale.set(obj.scale.x / Math.sqrt(k), obj.scale.y * k, obj.scale.z / Math.sqrt(k));
    e.squashing = true;
  }
});
onAfterRender(() => {
  for (const [obj, e] of bodies) if (e.squashing) { obj.scale.copy(e.pre); e.squashing = false; }
});
