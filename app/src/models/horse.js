// Horse. Contract: userData { head, face (from makeFace), body, arms[2], kind: 'horse' }; feet at y=0, faces +z.
// A chibi pony built standalone: long soft muzzle with nostrils, white blaze, pointy ears, flowing mane, forelock and tail, hooves.
import * as T from '../three.js';
import { mesh, geo, blobShadow, toon } from '../engine/toon.js';
import { makeFace } from '../engine/faces.js';

const COAT = 0xc9844f;     // warm chestnut
const MUZZLE = 0xf4d2b0;   // soft peach-cream
const BLAZE = 0xfff8ec;    // white blaze
const MANE = 0x6f3a2c;     // chocolate mane
const MANE_HI = 0x81432f;
const HOOF = 0x5e3d34;
const INNER_EAR = 0xffb3a8;
const NOSTRIL = 0x7a4434;

function shared(g) { g.computeVertexNormals(); g.userData.shared = true; return g; }

// Teardrop tuft: round end at y=0, tapering to a point at y=-1. `bend` curls the tip toward +z.
function tuftGeo(bend, segs = 14) {
  const pts = [];
  const n = 16;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const r = 0.6 * Math.sqrt(Math.sin(Math.PI * 0.5 * Math.min(1, t / 0.36))) * Math.pow(1 - t, 0.8);
    pts.push(new T.Vector2(Math.max(r, 0.0001), 0.12 - t * 1.12));
  }
  pts[0].x = 0.0001; pts[n].x = 0.0001;
  const g = new T.LatheGeometry(pts, segs);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    p.setZ(i, p.getZ(i) + bend * y * y);
  }
  return shared(g);
}
const TUFT_CURL = tuftGeo(0.55);
const TUFT_SOFT = tuftGeo(0.18);

// Pointy leaf-shaped ear: rounded base, sharp tip at y=1.
function earGeo() {
  const pts = [];
  const n = 14;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const r = 0.5 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.5 + 0.0) * 0.5 + 0.0), 0.7) * Math.pow(1 - t, 0.75);
    pts.push(new T.Vector2(Math.max(r, 0.0001), t));
  }
  pts[0].x = 0.0001;
  return shared(new T.LatheGeometry(pts, 16));
}
const EAR = earGeo();

// Limb capsule whose origin sits at the top (shoulder/hip) so rotation.z swings from the joint.
function limbGeo(r, len) {
  const g = new T.CapsuleGeometry(r, len, 6, 16);
  g.translate(0, -len / 2, 0);
  g.userData.shared = true;
  return g;
}
const ARM = limbGeo(0.15, 0.3);
const LEG = limbGeo(0.19, 0.16);

// A hair lock from point `a` (round end) to point `b` (tip), `w` wide; the tip curls toward `out`.
const _x = new T.Vector3(), _y = new T.Vector3(), _z = new T.Vector3(), _m = new T.Matrix4();
function lock(parent, a, b, w, col, out = [0, 0, 1], { geom = TUFT_CURL, depth = 0.85, outline = 0.025 } = {}) {
  const A = new T.Vector3(...a), B = new T.Vector3(...b);
  _y.subVectors(A, B); const L = _y.length(); _y.normalize();
  _z.set(...out); _z.addScaledVector(_y, -_z.dot(_y)).normalize();
  _x.crossVectors(_y, _z);
  _m.makeBasis(_x, _y, _z);
  const m = mesh(geom, col, { outline });
  m.quaternion.setFromRotationMatrix(_m);
  m.position.copy(A);
  m.scale.set(w, L / 1.0, w * depth);
  parent.add(m);
  return m;
}

export function makeHorse() {
  const g = new T.Group();
  const R = 0.66;

  // ---- body ----
  const body = mesh(geo.sphere(0.6, 24, 18), COAT, { outline: 0.04 });
  body.position.y = 0.76;
  body.scale.set(1, 1.08, 0.98);
  const belly = mesh(geo.sphere(0.4, 20, 14), MUZZLE, { outline: 0 });
  belly.scale.set(1, 1.15, 0.45);
  belly.position.set(0, 0.68, 0.43);

  // ---- legs with hooves ----
  for (const s of [-1, 1]) {
    const leg = mesh(LEG, COAT, { outline: 0.03 });
    leg.position.set(s * 0.3, 0.42, 0.08);
    g.add(leg);
    const hoof = mesh(geo.cyl(0.19, 0.23, 0.17, 20), HOOF, { outline: 0.025 });
    hoof.position.set(s * 0.3, 0.085, 0.1);
    g.add(hoof);
  }

  // ---- arms (front legs) swinging from the shoulder, with little hooves ----
  const arms = [];
  for (const s of [-1, 1]) {
    const arm = mesh(ARM, COAT, { outline: 0.028 });
    arm.position.set(s * 0.52, 1.08, 0.12);
    arm.rotation.z = s * 0.38;
    const hoof = mesh(geo.cyl(0.14, 0.165, 0.13, 18), HOOF, { outline: 0.02 });
    hoof.position.set(0, -0.44, 0);
    arm.add(hoof);
    g.add(arm); arms.push(arm);
  }

  // ---- head ----
  const head = mesh(geo.sphere(R, 28, 20), COAT, { outline: 0.035 });
  head.position.set(0, 1.74, 0.04);
  const face = makeFace(R, { mouth: true });
  head.add(face);
  const fp = face.userData;

  // eyes a touch bigger, cheeks pushed out beside the muzzle
  for (const e of fp.eyes) e.scale.multiplyScalar(1.12);
  for (const c of fp.cheeks) { c.position.x *= 1.08; c.position.y -= 0.03; }

  // muzzle: long, soft and rounded, angled forward and down like a pony's nose
  const muzzle = mesh(geo.sphere(0.3, 28, 20), MUZZLE, { outline: 0.025 });
  muzzle.scale.set(1.18, 1.1, 1.7);
  muzzle.position.set(0, -0.26, 0.45);
  muzzle.rotation.x = 0.3;
  head.add(muzzle);
  for (const s of [-1, 1]) {
    const n = new T.Mesh(geo.sphere(0.05, 12, 8), toon(NOSTRIL));
    n.scale.set(0.6, 1.2, 0.3);
    n.position.set(s * 0.15, 0.11, 0.245);
    n.rotation.set(-0.5, s * 0.55, s * 0.6);
    muzzle.add(n);
  }
  // mouth lives on the muzzle front
  fp.smile.position.set(0, -0.44, 0.93);
  fp.smile.scale.set(0.72, 0.72, 1);
  fp.frown.position.set(0, -0.56, 0.86);
  fp.frown.scale.set(0.7, 0.7, 1);
  fp.oh.position.set(0, -0.5, 0.9);
  fp.oh.scale.set(0.9, 0.9, 1);
  fp.flat.position.set(0, -0.5, 0.9);
  fp.flat.scale.set(0.8, 1, 1);
  for (const k of ['smile', 'frown', 'oh', 'flat']) fp[k].rotation.x = 0.55;

  // white blaze: a stripe from the forehead running down onto the muzzle
  const blaze = mesh(geo.sphere(0.3, 24, 16), BLAZE, { outline: 0 });
  blaze.scale.set(0.36, 1.2, 0.5);
  blaze.position.set(0, 0.14, 0.52);
  blaze.rotation.x = -0.32;
  head.add(blaze);

  // pointy ears with pink insides
  for (const s of [-1, 1]) {
    const ear = mesh(EAR, COAT, { outline: 0.02 });
    ear.scale.set(0.3, 0.46, 0.16);
    ear.position.set(s * 0.34, 0.47, 0.02);
    ear.rotation.set(-0.05, s * -0.35, -s * 0.38);
    const inner = mesh(EAR, INNER_EAR, { outline: 0 });
    inner.scale.set(0.6, 0.78, 0.6);
    inner.position.set(0, 0.08, 0.32);
    ear.add(inner);
    head.add(ear);
  }

  // hair: a soft cap over the back of the head that the mane and forelock grow from
  const cap = mesh(geo.sphere(0.6, 24, 18), MANE, { outline: 0.03 });
  cap.position.set(0, 0.1, -0.25);
  head.add(cap);

  // forelock: a big soft bang from the crown swept over the forehead to one side
  const bang = { geom: TUFT_SOFT };
  lock(head, [0.02, 0.66, 0.16], [0.17, 0.42, 0.64], 0.42, MANE, [0, 0.6, 1], bang);
  lock(head, [-0.14, 0.62, 0.16], [-0.13, 0.46, 0.6], 0.32, MANE_HI, [0, 0.6, 1], bang);
  lock(head, [0.2, 0.6, 0.14], [0.36, 0.36, 0.52], 0.32, MANE_HI, [0.4, 0.6, 1], bang);

  // mane: locks flowing from the crown down the back of the head and neck
  for (let i = 0; i < 5; i++) {
    const phi = 0.45 + i * 0.36, r = R - 0.02, side = i % 2 ? 1 : -1;
    const P = [side * 0.07, r * Math.cos(phi) + 0.08, -r * Math.sin(phi) - 0.12];
    const outv = [0, Math.cos(phi), -Math.sin(phi)];
    const len = 0.45 + i * 0.04;
    lock(head, P, [P[0] + side * 0.05, P[1] - len * 0.8 + outv[1] * 0.08, P[2] - len * 0.45 + outv[2] * 0.08],
      0.36, i % 2 ? MANE_HI : MANE, outv);
  }
  // side locks peeking out behind the ears so the mane frames the face from the front
  for (const s of [-1, 1]) {
    lock(head, [s * 0.44, 0.36, -0.18], [s * 0.64, -0.12, -0.22], 0.3, MANE, [s, 0.2, -0.3]);
  }
  // mane carries on down the back of the neck onto the body
  lock(g, [0.04, 1.42, -0.5], [0.0, 1.0, -0.62], 0.34, MANE, [0, 0.3, -1]);
  lock(g, [-0.06, 1.3, -0.52], [-0.06, 0.92, -0.6], 0.28, MANE_HI, [0, 0.3, -1]);

  // ---- tail: a flowing fan of locks that flicks up at the tip ----
  const tail = new T.Group();
  tail.position.set(0, 0.8, -0.5);
  lock(tail, [0, 0, 0], [0, -0.6, -0.42], 0.42, MANE, [0, 0.5, -1], { outline: 0.03 });
  lock(tail, [-0.08, 0, 0], [-0.22, -0.52, -0.3], 0.32, MANE_HI, [-0.5, 0.3, -1], { outline: 0.03 });
  lock(tail, [0.08, 0, 0], [0.22, -0.52, -0.3], 0.32, MANE_HI, [0.5, 0.3, -1], { outline: 0.03 });
  g.add(tail);

  g.add(body, belly, head, blobShadow(0.9));

  const hy = head.position.y, hz = head.position.z;
  g.userData = {
    head, face, body, arms, kind: 'horse',
    anchors: {
      nose: [0, hy - 0.38, hz + 0.94], mouth: [0, hy - 0.47, hz + 0.9],
      eyeL: [-0.24, hy + 0.08, hz + 0.6], eyeR: [0.24, hy + 0.08, hz + 0.6],
      earL: [-0.43, hy + 0.68, hz + 0.06], earR: [0.43, hy + 0.68, hz + 0.06],
      tummy: [0, 0.72, 0.66],
      handL: [-0.72, 0.72, 0.22], handR: [0.72, 0.72, 0.22],
      footL: [-0.3, 0.1, 0.32], footR: [0.3, 0.1, 0.32],
    },
  };
  return g;
}
