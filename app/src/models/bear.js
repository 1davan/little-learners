// Bear. Contract: userData { head, face (from makeFace, for emotions), body, arms[2], kind: 'bear', anchors }; feet at y=0, faces +z, ~2.45 units tall.
// Built standalone (no biped.js): chunky chibi teddy with a big muzzle + nose, round tummy patch, padded paws and feet.
import * as T from '../three.js';
import { mesh, geo, ink, blobShadow, toon, basic } from '../engine/toon.js';
import { C, makeFace } from '../engine/faces.js';

const FUR = 0xb37a4c;      // warm honey-brown
const FUR_DARK = 0x9a6440; // ears' rim / tail tip accents
const CREAM = 0xf6dcb4;    // muzzle, tummy
const PAD = 0xe39a8c;      // rosy paw pads
const NOSE = 0x4b2f3e;     // dark warm cocoa-plum

function shared(g) { g.userData.shared = true; return g; }
const ARM_GEO = shared(new T.CapsuleGeometry(0.155, 0.26, 8, 20));
const LEG_GEO = shared(new T.CapsuleGeometry(0.17, 0.12, 8, 20));

const Z = new T.Vector3(0, 0, 1);
// Put m on the surface of an ellipsoid (centre c, radii r) in direction u, facing out along the surface normal.
function onSurf(m, c, r, u, push = 0) {
  const d = new T.Vector3(...u).normalize();
  const p = new T.Vector3(c[0] + r[0] * d.x, c[1] + r[1] * d.y, c[2] + r[2] * d.z);
  const n = new T.Vector3(d.x / r[0], d.y / r[1], d.z / r[2]).normalize();
  m.position.copy(p).addScaledVector(n, push);
  m.quaternion.setFromUnitVectors(Z, n);
  return m;
}
function blob(r, color, sc, outline = 0, seg = 20) {
  const m = mesh(geo.sphere(r, seg, Math.round(seg * 0.7)), color, { outline });
  if (sc) m.scale.set(...sc);
  return m;
}

export function makeBear() {
  const g = new T.Group();

  // ---------- body (group at the floor so breathing scales up from the feet) ----------
  const body = new T.Group();
  const BC = [0, 0.72, 0], BR = [0.64, 0.66, 0.58];
  const torso = blob(1, FUR, BR, 0.04 / 0.62, 28);
  torso.position.set(...BC);
  body.add(torso);
  // round tummy patch, gently domed
  const tummy = blob(1, CREAM, [0.42, 0.45, 0.22], 0.025, 28);
  onSurf(tummy, BC, BR, [0, -0.12, 1], -0.165);
  body.add(tummy);
  // little tail
  const tail = blob(0.14, FUR, null, 0.025, 16);
  tail.position.set(0, 0.42, -0.56);
  body.add(tail);
  g.add(body);

  // ---------- legs + feet ----------
  const feet = [];
  for (const s of [-1, 1]) {
    const leg = mesh(LEG_GEO, FUR, { outline: 0.03 });
    leg.position.set(s * 0.3, 0.24, 0.08);
    g.add(leg);
    const FC = [s * 0.32, 0.13, 0.2], FR = [0.22, 0.14, 0.3];
    const foot = blob(1, FUR, FR, 0.03 / 0.2, 24);
    foot.position.set(...FC);
    foot.rotation.y = s * 0.12;
    g.add(foot);
    // big sole pad on the front of the foot + three toe beans
    const pad = blob(1, PAD, [0.1, 0.075, 0.03], 0, 18);
    onSurf(pad, FC, FR, [0, -0.05, 1], -0.008);
    g.add(pad);
    for (const t of [-1, 0, 1]) {
      const bean = blob(1, PAD, [0.038, 0.034, 0.02], 0, 12);
      onSurf(bean, FC, FR, [t * 0.42, 0.62, 0.75 - Math.abs(t) * 0.08], -0.004);
      g.add(bean);
    }
    feet.push(pad);
  }

  // ---------- arms (pivot at the shoulder, animated by rotation.z) ----------
  const arms = [], palms = [];
  for (const s of [-1, 1]) {
    const arm = new T.Group();
    arm.position.set(s * 0.5, 1.1, 0.06);
    arm.rotation.set(-0.42, 0, s * 0.62);
    const limb = mesh(ARM_GEO, FUR, { outline: 0.03 });
    limb.position.y = -0.24;
    arm.add(limb);
    const paw = blob(1, FUR, [0.2, 0.19, 0.18], 0.03 / 0.19, 22);
    paw.position.set(0, -0.46, 0.02);
    arm.add(paw);
    const palm = blob(1, PAD, [0.1, 0.09, 0.03], 0, 18);
    onSurf(palm, [0, -0.46, 0.02], [0.2, 0.19, 0.18], [0, -0.25, 1], -0.008);
    arm.add(palm);
    g.add(arm); arms.push(arm); palms.push(palm);
  }

  // ---------- head (group at the neck so sway pivots there) ----------
  const R = 0.66;
  const head = new T.Group();
  head.position.set(0, 1.5, 0.04);
  const skull = new T.Group(); // squash/stretch for a wide, cuddly head; the face lives inside so it matches
  skull.position.y = 0.3;
  skull.scale.set(1.08, 0.97, 1);
  head.add(skull);
  skull.add(blob(R, FUR, null, 0.035, 32));

  // ears: round, with rosy-cream inner
  const ears = [];
  for (const s of [-1, 1]) {
    const e = blob(0.21, FUR, [1, 0.95, 0.62], 0.028, 22);
    e.position.set(s * 0.47, 0.46, -0.06);
    e.rotation.z = -s * 0.3;
    const inner = blob(0.13, 0xf3bfa8, [1, 0.95, 0.35], 0, 18);
    inner.position.set(0, -0.01, 0.12);
    e.add(inner);
    skull.add(e); ears.push(e);
  }

  // muzzle
  const MC = [0, -0.2, 0.48], MR = [0.33, 0.24, 0.27];
  const muzzle = blob(1, CREAM, MR, 0.016 / 0.25, 28);
  muzzle.position.set(...MC);
  skull.add(muzzle);

  // big shiny nose
  const nose = blob(1, NOSE, [0.155, 0.108, 0.095], 0.014 / 0.11, 22);
  onSurf(nose, MC, MR, [0, 0.62, 0.78], -0.02);
  nose.quaternion.identity();
  skull.add(nose);
  const shine = new T.Mesh(geo.sphere(1, 12, 8), basic(0xffffff)); // nose is unit-sphere scaled, so this is in unit space
  shine.scale.set(0.3, 0.2, 0.2);
  shine.position.set(-0.3, 0.5, 0.75);
  nose.add(shine);
  // philtrum line from nose to mouth
  const phil = ink(geo.box(0.022, 0.07, 0.02));
  onSurf(phil, MC, MR, [0, 0.12, 1], 0.0);
  skull.add(phil);

  // ---------- face (from makeFace so setFace drives emotions) ----------
  const face = makeFace(R, { noseColor: null });
  skull.add(face);
  const fp = face.userData;
  const zAt = (x, y) => Math.sqrt(Math.max(0.0001, R * R - x * x - y * y));
  const eyeR = 0.14 * R, EYE_K = 1.42;
  // enlarge eyes via a wrapper so setFace / blink can still scale the eye itself
  for (const e of fp.eyes) {
    const s = e.userData.s, x = s * 0.25, y = 0.07;
    const w = new T.Group();
    w.position.set(x, y, zAt(x, y) - eyeR * EYE_K * 0.2);
    w.rotation.y = s * 0.28; w.rotation.x = -0.1;
    w.scale.set(EYE_K, EYE_K, EYE_K * 0.6);
    face.remove(e); w.add(e); face.add(w);
    e.position.set(0, 0, 0);
    // second little sparkle
    const hi2 = new T.Mesh(geo.sphere(eyeR * 0.17, 8, 6), basic(0xffffff));
    hi2.position.set(-eyeR * 0.35, -eyeR * 0.35, eyeR * 0.85);
    e.add(hi2);
  }
  for (const b of fp.brows) {
    const s = b.userData.s, x = s * 0.25;
    b.userData.x = x; b.userData.y = 0.245;
    b.position.set(x, 0.245, zAt(x, 0.3) + 0.005);
    b.rotation.y = s * 0.3;
    b.scale.set(0.92, 1.2, 1);
  }
  for (const c of fp.cheeks) {
    const s = c.position.x > 0 ? 1 : -1, x = s * 0.43, y = -0.13;
    c.position.set(x, y, zAt(x, y) - 0.01);
    c.rotation.y = s * 0.6;
    c.scale.set(1.25, 0.8, 0.4);
  }
  for (const t of fp.tears) {
    const s = t.position.x > 0 ? 1 : -1, x = s * 0.34, y = -0.06;
    t.position.set(x, y, zAt(x, y) + 0.01);
    t.userData.y0 = y;
    t.scale.set(1.2, 1.7, 0.8);
  }
  // mouth shapes sit on the muzzle under the nose (z follows the muzzle surface)
  const muzZ = (x, y) => MC[2] + MR[2] * Math.sqrt(Math.max(0, 1 - (x / MR[0]) ** 2 - ((y - MC[1]) / MR[1]) ** 2));
  fp.smile.position.set(0, -0.215, muzZ(0.08, -0.27) + 0.012);
  fp.smile.rotation.x = -0.15;
  fp.smile.scale.set(0.85, 0.85, 1);
  fp.frown.position.set(0, -0.345, muzZ(0.1, -0.34) + 0.01);
  fp.frown.rotation.x = 0.5;
  fp.oh.position.set(0, -0.275, muzZ(0, -0.275) + 0.002);
  fp.flat.position.set(0, -0.28, muzZ(0, -0.28) - 0.01);
  // a tiny pink tongue tucked in the happy smile (smile's local space; it is rotated PI)
  const tongue = blob(1, 0xff8a9a, [0.055, 0.032, 0.02], 0, 14);
  tongue.position.set(0, 0.075, -0.004);
  fp.smile.add(tongue);

  g.add(head, blobShadow(0.95));

  // ---------- anchors (scale-1 model space, just in front of each part) ----------
  g.updateMatrixWorld(true);
  const at = (o, push = 0.06, local = [0, 0, 0]) => {
    const p = o.localToWorld(new T.Vector3(...local));
    const n = new T.Vector3(0, 0, 1).transformDirection(o.matrixWorld);
    p.addScaledVector(n, push);
    return [+p.x.toFixed(3), +p.y.toFixed(3), +p.z.toFixed(3)];
  };
  const fwd = (o, push = 0.08) => { const p = o.getWorldPosition(new T.Vector3()); return [+p.x.toFixed(3), +p.y.toFixed(3), +(p.z + push).toFixed(3)]; };
  const eyeW = fp.eyes.map((e) => fwd(e, 0.1));
  g.userData = {
    head, face, body, arms, kind: 'bear',
    anchors: {
      nose: fwd(nose, 0.12),
      eyeL: eyeW[0], eyeR: eyeW[1],
      mouth: fwd(fp.smile, 0.06).map((v, i) => (i === 1 ? +(v - 0.06).toFixed(3) : v)),
      tummy: at(tummy, 0.06, [0, 0, 1]),
      handL: at(palms[0], 0.07, [0, 0, 1]), handR: at(palms[1], 0.07, [0, 0, 1]),
      footL: at(feet[0], 0.07, [0, 0, 1]), footR: at(feet[1], 0.07, [0, 0, 1]),
      earL: fwd(ears[0], 0.2), earR: fwd(ears[1], 0.2),
    },
  };
  return g;
}
