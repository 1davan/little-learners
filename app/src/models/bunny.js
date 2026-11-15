// Bunny. Contract: userData { head, face (from makeFace, for emotions), body, arms[2], kind: 'bunny', anchors }; feet at y=0, faces +z, ~2.4 units tall (ears reach higher).
import * as T from '../three.js';
import { mesh, geo, ink, blobShadow, toon, basic } from '../engine/toon.js';
import { C, makeFace } from '../engine/faces.js';

const FUR = 0xfbf6f1;      // warm white
const CREAM = 0xffe6d4;    // belly / muzzle
const PINK = 0xffa3c2;     // inner ears, pads
const NOSE = 0xff7fae;
const TOOTH = 0xffffff;

function shared(g) { g.userData.shared = true; return g; }
// capsule with its base at y=0 so rotation pivots from the root
function baseCapsule(r, len, cap = 8, rad = 18) {
  const g = new T.CapsuleGeometry(r, len, cap, rad);
  g.translate(0, len / 2 + r, 0);
  return shared(g);
}
// capsule hanging down from y=0 (shoulder pivot)
function hangCapsule(r, len) {
  const g = new T.CapsuleGeometry(r, len, 8, 16);
  g.translate(0, -(len / 2 + r * 0.6), 0);
  return shared(g);
}
const EAR_LO = baseCapsule(0.15, 0.5);
const EAR_LO_IN = baseCapsule(0.09, 0.48);
const EAR_TIP = baseCapsule(0.15, 0.22);
const EAR_TIP_IN = baseCapsule(0.09, 0.2);
const ARM = hangCapsule(0.14, 0.24);
const TOOTH_G = shared(new T.BoxGeometry(0.07, 0.08, 0.03));

const R = 0.68, HEAD_Y = 1.8;

export function makeBunny() {
  const g = new T.Group();

  // ---- body: small pear, cream belly patch ----
  const body = mesh(geo.sphere(0.62, 24, 18), FUR, { outline: 0.035 });
  body.position.y = 0.7;
  body.scale.set(1, 1.08, 0.92);
  const belly = mesh(geo.sphere(0.44, 20, 14), CREAM, { outline: 0 });
  belly.position.set(0, -0.06, 0.38);
  belly.scale.set(1, 1.1, 0.5);
  body.add(belly);

  // ---- cotton tail: a cluster of puffs ----
  const tail = new T.Group();
  tail.position.set(0, 0.42, -0.58);
  const puff = mesh(geo.sphere(0.2, 16, 12), 0xffffff, { outline: 0.025 });
  tail.add(puff);
  for (const [x, y, z] of [[0.12, 0.08, -0.04], [-0.12, 0.06, -0.03], [0, -0.1, -0.05], [0.02, 0.14, -0.06]]) {
    const p = mesh(geo.sphere(0.12, 12, 10), 0xffffff, { outline: 0.02 });
    p.position.set(x, y, z);
    tail.add(p);
  }
  g.add(tail);

  // ---- head ----
  const head = new T.Group();
  head.position.y = HEAD_Y;
  const skull = mesh(geo.sphere(R, 32, 24), FUR, { outline: 0.035 });
  head.add(skull);
  // fluffy cheeks for a rounder, wider bunny face
  for (const s of [-1, 1]) {
    const ck = mesh(geo.sphere(0.32, 20, 14), FUR, { outline: 0.03 });
    ck.position.set(s * 0.36, -0.24, 0.24);
    ck.scale.set(1.05, 0.85, 0.85);
    head.add(ck);
  }

  const face = makeFace(R, { noseColor: null });
  head.add(face);
  const fp = face.userData;
  for (const c of fp.cheeks) { c.position.z += 0.1; c.position.y -= 0.04; c.position.x *= 1.08; }
  for (const t of fp.tears) t.position.z += 0.04;

  // muzzle: two puffy whisker pads
  const muzzle = new T.Group();
  muzzle.position.set(0, -0.12, 0.6);
  for (const s of [-1, 1]) {
    const pad = mesh(geo.sphere(0.13, 18, 12), CREAM, { outline: 0.018 });
    pad.position.set(s * 0.1, 0, 0);
    pad.scale.set(1.05, 0.85, 0.8);
    muzzle.add(pad);
    // whiskers
    for (const k of [-1, 1]) {
      const w = ink(geo.cyl(0.009, 0.009, 0.34, 5));
      w.rotation.z = Math.PI / 2 + s * k * 0.18;
      w.position.set(s * 0.33, k * 0.04, -0.02);
      muzzle.add(w);
    }
  }
  // twitchy nose
  const nose = mesh(geo.sphere(0.065, 16, 12), NOSE, { outline: 0.012 });
  nose.position.set(0, 0.085, 0.07);
  nose.scale.set(1.35, 0.9, 0.8);
  const shine = new T.Mesh(geo.sphere(0.018, 8, 6), basic(0xffffff));
  shine.position.set(-0.025, 0.025, 0.05);
  nose.add(shine);
  muzzle.add(nose);
  const t0 = Math.random() * 3;
  nose.onBeforeRender = () => {
    const t = performance.now() / 1000 + t0;
    const ph = t % 2.6;
    const w = ph < 0.45 ? Math.sin(ph * 42) * (1 - ph / 0.45) : 0;
    nose.position.y = 0.085 + w * 0.012;
    nose.scale.set(1.35 - w * 0.08, 0.9 + w * 0.1, 0.8);
    muzzle.children[0].position.y = w * 0.006; muzzle.children[3].position.y = w * 0.006;
  };
  // buck teeth
  for (const s of [-1, 1]) {
    const tooth = mesh(TOOTH_G, TOOTH, { hull: 1.12, outline: 0 });
    tooth.position.set(s * 0.038, -0.11, 0.07);
    muzzle.add(tooth);
  }
  head.add(muzzle);

  // mouth shapes move down below the teeth, onto the chin
  for (const k of ['smile', 'frown', 'oh', 'flat']) {
    const m = fp[k];
    m.scale.setScalar(0.75);
    m.position.y -= 0.1;
    m.position.z += 0.04;
  }

  // ---- ears: long, pink inside, tips flop ----
  const ears = [];
  for (const s of [-1, 1]) {
    const ear = new T.Group();
    ear.position.set(s * 0.26, 0.5, -0.08);
    ear.rotation.z = -s * 0.2;
    ear.rotation.x = -0.12;
    const lo = mesh(EAR_LO, FUR, { outline: 0.03 });
    lo.scale.set(1.15, 1, 0.55);
    const loIn = mesh(EAR_LO_IN, PINK, { outline: 0 });
    loIn.scale.set(1.15, 1, 0.4);
    loIn.position.set(0, 0.06, 0.05);
    ear.add(lo, loIn);
    const tip = new T.Group();
    tip.position.y = 0.72;
    // one ear flops a lot, the other just a little
    tip.rotation.z = s > 0 ? -1.1 : 0.35;
    tip.rotation.x = s > 0 ? 0.25 : 0.15;
    const hi = mesh(EAR_TIP, FUR, { outline: 0.03 });
    hi.scale.set(1.15, 1, 0.55);
    const hiIn = mesh(EAR_TIP_IN, PINK, { outline: 0 });
    hiIn.scale.set(1.15, 1, 0.4);
    hiIn.position.set(0, 0.0, 0.05);
    tip.add(hi, hiIn);
    ear.add(tip);
    head.add(ear);
    ears.push(ear);
  }

  // ears follow the mood: droop when sad, perk up when scared, flatten back when angry
  const EAR_POSE = { sad: [1.05, -0.45], angry: [0.55, -0.6], scared: [0.05, 0.05] };
  for (const e of ears) e.userData.r0 = [e.rotation.z, e.rotation.x];
  skull.onBeforeRender = () => {
    const pose = EAR_POSE[face.userData.emotion];
    for (const e of ears) {
      const s = Math.sign(e.position.x), [z0, x0] = e.userData.r0;
      const tz = pose ? -s * pose[0] : z0, tx = pose ? pose[1] : x0;
      e.rotation.z += (tz - e.rotation.z) * 0.18;
      e.rotation.x += (tx - e.rotation.x) * 0.18;
    }
  };

  // ---- arms: stubby, swing from the shoulder ----
  const arms = [];
  for (const s of [-1, 1]) {
    const arm = mesh(ARM, FUR, { outline: 0.028 });
    arm.position.set(s * 0.5, 1.05, 0.16);
    arm.rotation.z = s * 0.45;
    const pad = mesh(geo.sphere(0.07, 12, 8), PINK, { outline: 0 });
    pad.position.set(0, -0.4, 0.12);
    pad.scale.set(1, 0.8, 0.5);
    arm.add(pad);
    g.add(arm); arms.push(arm);
  }

  // ---- big bunny feet ----
  const feet = [];
  for (const s of [-1, 1]) {
    const foot = mesh(geo.sphere(0.27, 20, 14), FUR, { outline: 0.03 });
    foot.position.set(s * 0.32, 0.14, 0.34);
    foot.scale.set(0.95, 0.55, 1.85);
    foot.rotation.y = s * 0.12;
    g.add(foot); feet.push(foot);
    // toe beans on the front of the foot
    for (const k of [-1, 0, 1]) {
      const bean = mesh(geo.sphere(0.045, 10, 8), PINK, { outline: 0 });
      bean.position.set(s * 0.32 + k * 0.09 + s * 0.05, 0.18, 0.34 + 0.44 - Math.abs(k) * 0.035);
      bean.scale.set(1, 0.8, 0.6);
      g.add(bean);
    }
  }

  g.add(body, head, blobShadow(0.95));

  const anchors = {
    nose: [0, HEAD_Y - 0.03, 0.82],
    eyeL: [-0.245, HEAD_Y + 0.08, 0.7], eyeR: [0.245, HEAD_Y + 0.08, 0.7],
    mouth: [0, HEAD_Y - 0.34, 0.78],
    tummy: [0, 0.72, 0.72],
    handL: [-0.72, 0.68, 0.36], handR: [0.72, 0.68, 0.36],
    footL: [-0.36, 0.18, 0.86], footR: [0.36, 0.18, 0.86],
    earL: [-0.4, HEAD_Y + 0.95, 0.12], earR: [0.4, HEAD_Y + 0.95, 0.12],
  };
  g.userData = { head, face, body, arms, ears, kind: 'bunny', anchors };
  return g;
}
