// Cat. Contract: userData { head, face (from makeFace, for emotions), body, arms[2], kind: 'cat' }; feet at y=0, faces +z, ~2.4 units tall.
// Orange tabby: pointy ears with pink insides, tabby stripes, cream muzzle + pink nose, whiskers, curled striped tail.
import * as T from '../three.js';
import { mesh, geo, ink, blobShadow, toon, basic } from '../engine/toon.js';
import { C, makeFace } from '../engine/faces.js';

const FUR = 0xffa142;
const STRIPE = 0xe8742a;
const CREAM = 0xfff1dc;
const PINK = 0xffa9c6;
const NOSE = 0xff7fa6;

const shared = (g) => { g.userData.shared = true; return g; };

// Arm: capsule hanging from a shoulder pivot at the origin (so rotation.z swings it from the shoulder).
const ARM_GEO = shared(new T.CapsuleGeometry(0.15, 0.24, 6, 16).translate(0, -0.2, 0));
// Rounded-triangle nose, point down.
const NOSE_GEO = shared((() => {
  const s = new T.Shape();
  const w = 0.085, h = 0.07, r = 0.03;
  s.moveTo(-w + r, h * 0.5);
  s.lineTo(w - r, h * 0.5);
  s.quadraticCurveTo(w, h * 0.5, w - r * 0.4, h * 0.5 - r * 0.8);
  s.lineTo(r * 0.5, -h * 0.5 + r * 0.3);
  s.quadraticCurveTo(0, -h * 0.5 - r * 0.2, -r * 0.5, -h * 0.5 + r * 0.3);
  s.lineTo(-w + r * 0.4, h * 0.5 - r * 0.8);
  s.quadraticCurveTo(-w, h * 0.5, -w + r, h * 0.5);
  const g = new T.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.02, bevelSegments: 4, curveSegments: 6 });
  g.translate(0, 0, -0.03);
  return g;
})());
// Curled tail: rises from the lower back, sweeps up and curls over at the tip.
const TAIL_CURVE = new T.CatmullRomCurve3([
  new T.Vector3(0, 0.42, -0.45),
  new T.Vector3(0.12, 0.38, -0.78),
  new T.Vector3(0.3, 0.62, -0.98),
  new T.Vector3(0.42, 1.02, -0.98),
  new T.Vector3(0.36, 1.32, -0.86),
  new T.Vector3(0.18, 1.36, -0.78),
  new T.Vector3(0.12, 1.18, -0.82),
]);
const TAIL_GEO = shared(new T.TubeGeometry(TAIL_CURVE, 48, 0.1, 14, false));

// Head dims: sphere of radius R scaled into a slightly wide, soft cat skull.
const R = 0.7, SX = 1.12, SY = 0.95, SZ = 0.98;

export function makeCat() {
  const g = new T.Group();

  // ---------- body ----------
  const bodyR = 0.6;
  const body = mesh(geo.sphere(bodyR, 24, 18), FUR, { outline: 0.04 });
  body.position.y = 0.66;
  body.scale.set(1, 1.08, 0.92);
  // cream bib + tummy
  const belly = mesh(geo.sphere(0.44, 20, 14), CREAM, { outline: 0 });
  belly.scale.set(0.95, 1.15, 0.5);
  belly.position.set(0, -0.06, 0.4);
  body.add(belly);
  // tabby stripes on the back and sides (in body-local unit space)
  for (const s of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const st = mesh(geo.sphere(0.2, 14, 10), STRIPE, { outline: 0 });
      const a = 0.95 + i * 0.42; // around the body from side towards back
      const y = 0.22 - i * 0.02;
      st.position.set(s * Math.sin(a) * bodyR * 0.93, y, Math.cos(a) * bodyR * 0.93);
      st.scale.set(0.2, 0.8, 0.28);
      st.lookAt(new T.Vector3(st.position.x * 3, y, st.position.z * 3));
      st.rotateZ(s * 0.25);
      body.add(st);
    }
  }
  // back stripe
  const spine = mesh(geo.sphere(0.2, 14, 10), STRIPE, { outline: 0 });
  spine.position.set(0, 0.3, -bodyR * 0.88);
  spine.scale.set(0.3, 1.0, 0.25);
  body.add(spine);

  // ---------- tail ----------
  const tail = mesh(TAIL_GEO, FUR, { outline: 0.025 });
  const tip = mesh(geo.sphere(0.1, 14, 10), CREAM, { outline: 0.025 });
  tip.position.copy(TAIL_CURVE.getPointAt(1));
  tail.add(tip);
  for (const t of [0.42, 0.6, 0.78]) {
    const ring = mesh(geo.torus(0.1, 0.035, Math.PI * 2, 8, 20), STRIPE, { outline: 0 });
    ring.position.copy(TAIL_CURVE.getPointAt(t));
    ring.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), TAIL_CURVE.getTangentAt(t));
    tail.add(ring);
  }

  // ---------- head (Group pivoting at the neck so sway looks natural) ----------
  const head = new T.Group();
  head.position.y = 1.2;
  const hc = new T.Group(); // head centre
  hc.position.y = 0.56;
  head.add(hc);
  const skull = mesh(geo.sphere(R, 28, 22), FUR, { outline: 0.035 });
  skull.scale.set(SX, SY, SZ);
  hc.add(skull);
  // fluffy cheek tufts on the sides
  for (const s of [-1, 1]) {
    const tuft = mesh(geo.sphere(0.2, 16, 12), FUR, { outline: 0.03 });
    tuft.position.set(s * 0.66, -0.26, 0.08);
    tuft.scale.set(1.0, 0.75, 0.9);
    tuft.rotation.z = s * 0.5;
    hc.add(tuft);
  }
  // forehead tabby "M" stripes (skull-local unit sphere coords)
  const onSkull = (x, y) => new T.Vector3(x, y, Math.sqrt(Math.max(0, R * R - x * x - y * y)));
  for (const [x, y, len, rz] of [[0, 0.66, 1.5, 0], [-0.17, 0.62, 1.15, 0.22], [0.17, 0.62, 1.15, -0.22]]) {
    const st = mesh(geo.sphere(0.1, 12, 8), STRIPE, { outline: 0 });
    const p = onSkull(x, R * y);
    st.position.copy(p).multiplyScalar(0.975);
    st.lookAt(p.clone().multiplyScalar(3));
    st.scale.set(0.38, len, 0.35);
    st.rotateZ(rz);
    skull.add(st);
  }
  // side-of-head stripes
  for (const s of [-1, 1]) for (const [y, rz] of [[0.16, 0.2], [-0.02, 0.05]]) {
    const st = mesh(geo.sphere(0.1, 12, 8), STRIPE, { outline: 0 });
    const p = new T.Vector3(s * 0.94 * R, y, 0);
    p.z = Math.sqrt(Math.max(0, R * R - p.x * p.x - y * y)) * 0.25;
    p.setLength(R * 0.985);
    st.position.copy(p);
    st.lookAt(p.clone().multiplyScalar(3));
    st.scale.set(1.0, 0.3, 0.3);
    st.rotateZ(s * rz);
    skull.add(st);
  }

  // ears: soft cones flattened front-to-back, pink inner
  const ears = [];
  for (const s of [-1, 1]) {
    const ear = new T.Group();
    ear.position.set(s * 0.46, 0.44, -0.02);
    ear.rotation.set(-0.12, 0, -s * 0.42);
    const outer = mesh(geo.cone(0.3, 0.52, 24), FUR, { outline: 0.03 });
    outer.position.y = 0.2;
    outer.scale.set(1, 1, 0.5);
    const inner = mesh(geo.cone(0.19, 0.36, 20), PINK, { outline: 0 });
    inner.position.set(0, 0.15, 0.08);
    inner.scale.set(1, 1, 0.4);
    ear.add(outer, inner);
    hc.add(ear);
    ears.push(ear);
  }

  // muzzle: two cream puffs + chin
  const MZ_Y = -0.2;
  const muzzle = new T.Group();
  muzzle.position.set(0, MZ_Y, 0);
  for (const s of [-1, 1]) {
    const puff = mesh(geo.sphere(0.17, 18, 14), CREAM, { outline: 0.018 });
    puff.position.set(s * 0.12, 0, 0.6);
    puff.scale.set(1.05, 0.85, 0.75);
    muzzle.add(puff);
  }
  const chin = mesh(geo.sphere(0.12, 16, 12), CREAM, { outline: 0.015 });
  chin.position.set(0, -0.12, 0.56);
  chin.scale.set(1.1, 0.7, 0.7);
  muzzle.add(chin);
  hc.add(muzzle);
  const noseY = MZ_Y + 0.09;
  const nose = mesh(NOSE_GEO, NOSE, { hull: 1.14, outline: 0 });
  nose.position.set(0, noseY, 0.73);
  nose.rotation.x = -0.25;
  const noseHi = new T.Mesh(geo.sphere(0.018, 8, 6), basic(0xffffff));
  noseHi.position.set(-0.03, 0.012, 0.05);
  nose.add(noseHi);
  hc.add(nose);

  // whiskers: three per side fanning out from the muzzle
  for (const s of [-1, 1]) {
    for (const [dy, a] of [[0.04, 0.16], [-0.02, 0], [-0.08, -0.16]]) {
      const w = ink(geo.cyl(0.009, 0.006, 0.38, 6));
      w.rotation.z = Math.PI / 2 - s * a;
      w.rotation.y = -s * 0.35;
      w.position.set(s * (0.24 + 0.17), MZ_Y + dy, 0.6 - 0.06);
      hc.add(w);
    }
  }

  // ---------- face (shared emotion rig) ----------
  const face = makeFace(R, { noseColor: null });
  const fp = face.userData;
  // re-seat every face part from the sphere onto the wider skull
  const zS = (x, y) => Math.sqrt(Math.max(0.0001, R * R - x * x - y * y));
  const zE = (x, y) => SZ * Math.sqrt(Math.max(0.0001, R * R - (x / SX) ** 2 - (y / SY) ** 2));
  for (const c of face.children) c.position.z += zE(c.position.x, c.position.y) - zS(c.position.x, c.position.y);
  // bigger, lower eyes with a second sparkle
  const eyeR = 0.14 * R * 1.4;
  for (const e of fp.eyes) {
    const x = e.userData.s * 0.37 * R, y = 0.08 * R;
    e.geometry = geo.sphere(eyeR, 22, 16);
    e.position.set(x, y, zE(x, y) - eyeR * 0.38);
    const hi = e.children[0];
    hi.geometry = geo.sphere(eyeR * 0.36, 12, 8);
    hi.position.set(eyeR * 0.32, eyeR * 0.4, eyeR * 0.78);
    const hi2 = new T.Mesh(geo.sphere(eyeR * 0.16, 8, 6), basic(0xffffff));
    hi2.position.set(-eyeR * 0.35, -eyeR * 0.38, eyeR * 0.82);
    e.add(hi2);
  }
  // brows a touch above the bigger eyes
  for (const b of fp.brows) {
    b.geometry = geo.box(0.26 * R, 0.07 * R, 0.08 * R);
    b.userData.y = 0.46 * R;
    b.position.x = b.userData.s * 0.38 * R;
    b.position.z = zE(b.position.x, 0.5 * R) + 0.005;
  }
  for (const t of fp.tears) { t.position.x = Math.sign(t.position.x) * 0.5 * R; t.position.y = -0.14 * R; t.position.z = zE(t.position.x, t.position.y) + 0.01; t.userData.y0 = t.position.y; }
  for (const ch of fp.cheeks) { ch.position.x = Math.sign(ch.position.x) * 0.6 * R; ch.position.y = -0.12 * R; ch.position.z = zE(ch.position.x, ch.position.y) - 0.005; }
  // mouth parts sit on the muzzle, below the nose
  const mY = MZ_Y - 0.1;
  // happy: a cat "ω" mouth built from two little smiles hanging off a short philtrum line
  face.remove(fp.smile);
  const smile = new T.Group();
  for (const s of [-1, 1]) {
    const arc = ink(geo.torus(0.06, 0.016, Math.PI, 6, 16));
    arc.rotation.z = Math.PI;
    arc.position.set(s * 0.06, 0.0, 0);
    smile.add(arc);
  }
  const phil = ink(geo.cyl(0.014, 0.014, 0.07, 6));
  phil.position.set(0, 0.03, 0);
  smile.add(phil);
  smile.position.set(0, mY + 0.02, 0.705);
  smile.rotation.x = -0.35;
  face.add(smile);
  fp.smile = smile;
  fp.frown.geometry = geo.torus(0.085, 0.02, Math.PI, 6, 18);
  fp.frown.position.set(0, mY - 0.06, 0.685);
  fp.frown.rotation.x = -0.4;
  fp.oh.geometry = geo.torus(0.05, 0.02, Math.PI * 2, 6, 18);
  fp.oh.position.set(0, mY - 0.04, 0.69);
  fp.oh.rotation.x = -0.4;
  fp.flat.geometry = geo.box(0.14, 0.025, 0.03);
  fp.flat.position.set(0, mY - 0.03, 0.69);
  // open "oh" mouth gets a pink inside
  const ohIn = new T.Mesh(geo.circle(0.05, 18), toon(0xd85a7a));
  ohIn.position.z = -0.005;
  fp.oh.add(ohIn);
  hc.add(face);

  // ---------- arms (pivot at shoulder) ----------
  const arms = [];
  const paws = [];
  for (const s of [-1, 1]) {
    const arm = mesh(ARM_GEO, FUR, { outline: 0.025 });
    arm.position.set(s * 0.5, 0.98, 0.16);
    arm.rotation.z = s * 0.42;
    const paw = mesh(geo.sphere(0.16, 16, 12), CREAM, { outline: 0.02 });
    paw.position.set(0, -0.36, 0.02);
    paw.scale.set(1, 0.9, 1);
    arm.add(paw);
    g.add(arm); arms.push(arm); paws.push(paw);
  }

  // ---------- feet with toe beans ----------
  const feet = [];
  for (const s of [-1, 1]) {
    const foot = mesh(geo.sphere(0.22, 18, 12), FUR, { outline: 0.025 });
    foot.scale.set(1, 0.6, 1.3);
    foot.position.set(s * 0.3, 0.12, 0.2);
    const toes = mesh(geo.sphere(0.16, 16, 12), CREAM, { outline: 0 });
    toes.position.set(0, 0.0, 0.1);
    toes.scale.set(1.05, 0.95, 0.9);
    foot.add(toes);
    g.add(foot); feet.push(foot);
  }

  g.add(body, tail, head, blobShadow(0.95));

  // anchors for the body-part and wash games (scale-1 model space)
  g.updateMatrixWorld(true);
  const wp = (o, off = [0, 0, 0]) => o.localToWorld(new T.Vector3(...off)).toArray().map((v) => +v.toFixed(3));
  const eL = fp.eyes.find((e) => e.userData.s < 0), eR = fp.eyes.find((e) => e.userData.s > 0);
  const anchors = {
    nose: wp(nose, [0, 0, 0.04]),
    eyeL: wp(eL), eyeR: wp(eR),
    mouth: wp(smile),
    tummy: wp(belly, [0, 0, 0.4]),
    handL: wp(paws[0], [0, 0, 0.12]), handR: wp(paws[1], [0, 0, 0.12]),
    footL: wp(feet[0], [0, 0, 0.2]), footR: wp(feet[1], [0, 0, 0.2]),
    earL: wp(ears[0], [0, 0.2, 0.1]), earR: wp(ears[1], [0, 0.2, 0.1]),
  };
  g.userData = { head, face, body, arms, kind: 'cat', anchors };
  return g;
}
