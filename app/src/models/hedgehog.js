// Hedgehog. Contract: userData { head, face, body, kind: 'hedgehog' }.
// Feet at y=0, faces +z, ~1.8 units tall. A round cream-faced hedgehog under a neat cap of soft, swept-back spine tufts.
import * as T from '../three.js';
import { mesh, geo, ink, blobShadow, toon, basic } from '../engine/toon.js';
import { C, makeFace } from '../engine/faces.js';

const SPINE_LIGHT = 0xa8714a, SPINE_MID = 0x92603e, SPINE_DARK = 0x7c5034, SPINE_BASE = 0x6f472f;
const CREAM = 0xffe4c2, TAN = 0xf2c69a, PAW = 0xe0a682, PINK = 0xffa9b8, NOSE = 0x4a2f3e;

// A soft tuft: a rounded teardrop spike (lathe), wide at the root, blunt rounded tip.
const SPIKE = (() => {
  const pts = [new T.Vector2(0, -0.06), new T.Vector2(0.11, -0.045), new T.Vector2(0.165, -0.005)];
  const L = 0.36, rt = 0.05; // length to the centre of the rounded tip, tip radius
  for (let i = 1; i <= 8; i++) {
    const t = i / 8;
    pts.push(new T.Vector2(rt + (0.17 - rt) * Math.pow(1 - t, 1.15), t * L));
  }
  for (let i = 1; i <= 5; i++) {
    const q = (i / 5) * Math.PI / 2;
    pts.push(new T.Vector2(rt * Math.cos(q) + 0.0001, L + rt * Math.sin(q)));
  }
  const g = new T.LatheGeometry(pts, 14);
  g.computeVertexNormals();
  g.userData.shared = true;
  return g;
})();

// Spine mass (the dome under the tufts): centre and radii.
const MC = new T.Vector3(0, 0.84, -0.2);
const MR = new T.Vector3(0.86, 0.78, 0.86);

function surf(a, b) {
  // a: angle from +z (front), b: angle around the z axis (0 = right side, 90° = top)
  const u = new T.Vector3(Math.sin(a) * Math.cos(b), Math.sin(a) * Math.sin(b), Math.cos(a));
  const p = new T.Vector3(u.x * MR.x, u.y * MR.y, u.z * MR.z).add(MC);
  const n = new T.Vector3(u.x / MR.x, u.y / MR.y, u.z / MR.z).normalize();
  return { p, n };
}

function tuft(parent, a, b, color, len = 1, width = 1, sweep = 1.0) {
  const { p, n } = surf(a, b);
  // swept back (towards -z) and slightly up, like a combed cap
  const back = new T.Vector3(0, 0.12, -1);
  back.addScaledVector(n, -back.dot(n)).normalize(); // backward along the surface
  const dir = n.clone().multiplyScalar(0.6 / sweep).add(back).normalize();
  const z = n.clone().sub(dir.clone().multiplyScalar(n.dot(dir))).normalize(); // thickness along the surface normal
  const x = new T.Vector3().crossVectors(dir, z).normalize();
  const m = mesh(SPIKE, color, { outline: 0.018 });
  m.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(x, dir, z));
  m.scale.set(width * 1.05, len, 0.72);
  m.position.copy(p).addScaledVector(n, -0.05);
  parent.add(m);
  return m;
}

export function makeHedgehog() {
  const g = new T.Group();
  const D = Math.PI / 180;

  // ---- body: spine dome + layered tufts + soft cream tummy (breathes as one) ----
  const body = new T.Group();
  const mass = mesh(geo.sphere(1, 28, 20), SPINE_BASE, { outline: 0.03 });
  mass.scale.copy(MR);
  mass.position.copy(MC);
  body.add(mass);
  const tummy = mesh(geo.sphere(0.5, 22, 16), CREAM, { outline: 0.025 });
  tummy.scale.set(1.05, 0.85, 0.9);
  tummy.position.set(0, 0.42, 0.18);
  body.add(tummy);

  // rows from the forehead to the rump; alternate rows staggered half a step, shingled front-over-back
  const rows = [
    { a: 40, n: 5, span: [25, 155], col: SPINE_LIGHT, len: 1.0, w: 1.1 },
    { a: 64, n: 6, span: [5, 175], col: SPINE_MID, len: 1.05, w: 1.1 },
    { a: 90, n: 7, span: [-5, 185], col: SPINE_LIGHT, len: 1.05, w: 1.1 },
    { a: 116, n: 6, span: [0, 180], col: SPINE_MID, len: 1.0, w: 1.1 },
    { a: 142, n: 5, span: [15, 165], col: SPINE_DARK, len: 0.9, w: 1.05 },
  ];
  for (const r of rows) {
    for (let i = 0; i < r.n; i++) {
      const b = r.span[0] + (r.span[1] - r.span[0]) * (i / (r.n - 1));
      tuft(body, r.a * D, b * D, r.col, r.len * (0.72 + 0.28 * Math.sin(Math.max(0, b) * D)), r.w);
    }
  }
  // two tiny back tufts near the tail
  tuft(body, 170 * D, 70 * D, SPINE_DARK, 0.6, 0.9, 0.6);
  tuft(body, 170 * D, 110 * D, SPINE_DARK, 0.6, 0.9, 0.6);

  // ---- head: big cream face peeking out under the cap ----
  const R = 0.56;
  const head = mesh(geo.sphere(R, 28, 20), CREAM, { outline: 0.03 });
  head.position.set(0, 0.86, 0.36);

  // forelock: a little three-tuft quiff on the brow
  for (const [fx, rz, ln] of [[-0.11, 0.55, 0.75], [0.0, 0.0, 0.95], [0.11, -0.55, 0.75]]) {
    const f = mesh(SPIKE, SPINE_LIGHT, { outline: 0.018 });
    f.position.set(fx, 0.42, 0.22);
    f.rotation.set(0.55, 0, rz);
    f.scale.set(0.95, ln, 0.6);
    head.add(f);
  }

  // round little ears tucked into the spines
  for (const s of [-1, 1]) {
    const ear = mesh(geo.sphere(0.13, 18, 12), TAN, { outline: 0.02 });
    ear.scale.set(1, 1, 0.5);
    ear.position.set(s * 0.42, 0.34, 0.12);
    ear.rotation.set(0, s * 0.5, s * -0.3);
    const inner = mesh(geo.sphere(0.08, 14, 10), PINK, { outline: 0 });
    inner.scale.set(1, 1, 0.5);
    inner.position.set(0, -0.005, 0.06);
    ear.add(inner);
    head.add(ear);
  }

  const face = makeFace(R, { mouth: true });
  // bigger, lower eyes with two sparkles each (geometry swap keeps setFace/blink scaling intact)
  const eyeR = 0.2 * R;
  const zAt = (x, y) => Math.sqrt(Math.max(0.0001, R * R - x * x - y * y));
  for (const e of face.userData.eyes) {
    const s = e.userData.s, x = s * 0.33 * R, y = 0.06 * R;
    e.geometry = geo.sphere(eyeR, 22, 16);
    e.position.set(x, y, zAt(x, y) - eyeR * 0.4);
    const hi = e.children[0];
    hi.scale.setScalar(1.35);
    hi.position.set(eyeR * 0.32, eyeR * 0.38, eyeR * 0.78);
    const hi2 = new T.Mesh(geo.sphere(eyeR * 0.18, 10, 8), basic(0xffffff));
    hi2.position.set(-eyeR * 0.3, -eyeR * 0.35, eyeR * 0.85);
    e.add(hi2);
  }
  for (const b of face.userData.brows) { b.userData.y = 0.4 * R; b.scale.set(0.85, 1, 1); }
  for (const c of face.userData.cheeks) {
    const s = c.position.x > 0 ? 1 : -1, x = s * 0.6 * R, y = -0.16 * R;
    c.position.set(x, y, zAt(x, y) - 0.03 * R);
  }
  for (const t of face.userData.tears) t.position.x += t.position.x > 0 ? 0.03 * R : -0.03 * R;
  // little pointed snout with a shiny button nose
  const snout = mesh(geo.sphere(0.2 * R, 20, 14), CREAM, { outline: 0.012 });
  snout.scale.set(1.15, 0.85, 1.0);
  snout.position.set(0, -0.1 * R, zAt(0, -0.1 * R) - 0.06 * R);
  face.add(snout);
  const nose = mesh(geo.sphere(0.1 * R, 16, 12), NOSE, { outline: 0 });
  nose.scale.set(1.2, 0.95, 0.9);
  nose.position.set(0, 0.04 * R, 0.17 * R);
  snout.add(nose);
  const nhi = new T.Mesh(geo.sphere(0.035 * R, 8, 6), basic(0xffffff));
  nhi.position.set(0.035 * R, 0.04 * R, 0.07 * R);
  nose.add(nhi);
  head.add(face);

  // ---- tiny paws ----
  for (const s of [-1, 1]) {
    const fp = mesh(geo.sphere(0.12, 16, 12), PAW, { outline: 0.02 });
    fp.scale.set(1, 0.65, 1.25);
    fp.position.set(s * 0.26, 0.08, 0.56);
    g.add(fp);
    const bp = mesh(geo.sphere(0.14, 16, 12), PAW, { outline: 0.02 });
    bp.scale.set(1, 0.6, 1.3);
    bp.position.set(s * 0.5, 0.08, -0.2);
    g.add(bp);
  }
  // little hands held up at the chest, ready to munch
  for (const s of [-1, 1]) {
    const hand = mesh(geo.sphere(0.085, 16, 12), PAW, { outline: 0.02 });
    hand.scale.set(0.9, 1.1, 0.8);
    hand.position.set(s * 0.2, 0.34, 0.64);
    hand.rotation.z = s * 0.4;
    g.add(hand);
  }

  g.add(body, head, blobShadow(1.05));
  g.userData = { head, face, body, kind: 'hedgehog' };
  return g;
}
