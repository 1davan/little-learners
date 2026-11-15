// Cow. Contract: userData { head, face (from makeFace), body, arms[2], kind: 'cow' }; feet at y=0, faces +z, ~2.5 units tall.
// Extras: userData.mouth (Group; set mouth.scale.y from 0 = closed to 1 = wide-open "moo"), userData.tail, userData.ears, userData.bell.
// Built standalone (no biped.js).
import * as T from '../three.js';
import { mesh, geo, ink, blobShadow, toon, basic } from '../engine/toon.js';
import { C, makeFace } from '../engine/faces.js';

const WHITE = 0xfffaf0;
const PATCH = 0x4a3848;   // warm dark "black" for the patches (lighter than the ink so outlines still read)
const PINK = 0xffb3c4;
const PINK_DEEP = 0xf08aa3;
const HOOF = 0x6a4c58;
const HORN = 0xfff0c8;
const COLLAR = 0x4a90ff;
const GOLD = 0xffcc3a;

function shared(g) { g.userData.shared = true; return g; }

// ---------- patch geometry: wobbly blobs that lie exactly on a sphere's surface ----------
// Each spot is { dir: [x,y,z], size: angular radius (rad), seed }. All spots are merged into one geometry.
function spherePatches(radius, spots, rings = 7, spokes = 36) {
  const pos = [], nrm = [], idx = [];
  const c = new T.Vector3(), u = new T.Vector3(), v = new T.Vector3(), d = new T.Vector3(), up = new T.Vector3();
  for (const sp of spots) {
    c.set(...sp.dir).normalize();
    up.set(0, 1, 0); if (Math.abs(c.y) > 0.9) up.set(1, 0, 0);
    u.crossVectors(up, c).normalize(); v.crossVectors(c, u);
    const base = pos.length / 3;
    // centre vertex
    pos.push(c.x * radius, c.y * radius, c.z * radius); nrm.push(c.x, c.y, c.z);
    for (let r = 1; r <= rings; r++) {
      for (let k = 0; k < spokes; k++) {
        const ph = (k / spokes) * Math.PI * 2;
        const s = sp.seed || 0;
        const edge = sp.size * (1 + 0.16 * Math.sin(3 * ph + s) + 0.09 * Math.sin(5 * ph + s * 2.3) + 0.05 * Math.sin(2 * ph + s * 0.7));
        const a = edge * (r / rings);
        d.copy(c).multiplyScalar(Math.cos(a))
          .addScaledVector(u, Math.cos(ph) * Math.sin(a))
          .addScaledVector(v, Math.sin(ph) * Math.sin(a));
        pos.push(d.x * radius, d.y * radius, d.z * radius); nrm.push(d.x, d.y, d.z);
      }
    }
    for (let k = 0; k < spokes; k++) {
      const k2 = (k + 1) % spokes;
      idx.push(base, base + 1 + k, base + 1 + k2);
    }
    for (let r = 1; r < rings; r++) {
      const a0 = base + 1 + (r - 1) * spokes, a1 = base + 1 + r * spokes;
      for (let k = 0; k < spokes; k++) {
        const k2 = (k + 1) % spokes;
        idx.push(a0 + k, a1 + k, a1 + k2, a0 + k, a1 + k2, a0 + k2);
      }
    }
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new T.Float32BufferAttribute(nrm, 3));
  g.setIndex(idx);
  return shared(g);
}

// ---------- shared custom geometry (built once) ----------
const BODY_R = 0.72, HEAD_R = 0.68;

const BODY_SPOTS = spherePatches(BODY_R * 1.006, [
  { dir: [0.75, 0.35, 0.55], size: 0.42, seed: 1.2 },   // front-right shoulder
  { dir: [-0.85, 0.05, -0.45], size: 0.55, seed: 2.7 }, // left flank, wraps round the back
  { dir: [0.45, 0.55, -0.75], size: 0.45, seed: 4.1 },  // upper back right
  { dir: [-0.35, -0.45, 0.85], size: 0.22, seed: 0.4 }, // small one low on the tummy
  { dir: [0.7, -0.55, -0.4], size: 0.28, seed: 5.3 },   // low back right
]);
const HEAD_SPOTS = spherePatches(HEAD_R * 1.006, [
  { dir: [-0.62, 0.72, 0.3], size: 0.36, seed: 3.3 },   // over the left ear / brow
  { dir: [0.35, 0.55, -0.75], size: 0.3, seed: 1.9 },   // back of the head
  { dir: [0.5, 0.78, 0.38], size: 0.27, seed: 0.8 },    // forehead, top right
]);
// ear: a soft flattened leaf shape (lathe) pointing along +x
const EAR = shared(new T.LatheGeometry(
  [[0.0, 0.0], [0.07, 0.03], [0.12, 0.1], [0.14, 0.2], [0.12, 0.3], [0.07, 0.37], [0.0, 0.4]].map(([x, y]) => new T.Vector2(x, y)), 18));
// horn: short curved cone along a small arc
class HornCurve extends T.Curve {
  getPoint(t, out = new T.Vector3()) { return out.set(Math.sin(t * 0.9) * 0.1, t * 0.2, 0); }
}
const HORN_G = (() => {
  const g = new T.TubeGeometry(new HornCurve(), 10, 1, 10, false);
  // taper the tube: radius 0.065 at the base to 0.025 at the tip, with a rounded tip
  const p = g.attributes.position, curve = new HornCurve(), c = new T.Vector3();
  for (let i = 0; i < p.count; i++) {
    const ring = Math.floor(i / 11), t = ring / 10;
    curve.getPoint(t, c);
    const rad = 0.068 * (1 - t) + 0.028 * t;
    p.setXYZ(i, c.x + (p.getX(i) - c.x) * rad, c.y + (p.getY(i) - c.y) * rad, c.z + (p.getZ(i) - c.z) * rad);
  }
  g.computeVertexNormals();
  return shared(g);
})();
// tail: a gentle S-curve hanging down from the rump
const TAIL_G = shared(new T.TubeGeometry(new T.CatmullRomCurve3([
  new T.Vector3(0, 0, 0), new T.Vector3(0.02, 0.05, -0.18), new T.Vector3(0.08, -0.08, -0.32),
  new T.Vector3(0.1, -0.3, -0.36), new T.Vector3(0.12, -0.48, -0.32),
]), 16, 0.035, 8, false));
// bell: lathe profile, opening downwards
const BELL_G = shared(new T.LatheGeometry(
  [[0.0, 0.0], [0.11, 0.0], [0.14, 0.0], [0.135, 0.01], [0.11, 0.06], [0.1, 0.12], [0.085, 0.17], [0.05, 0.195], [0.0, 0.2]]
    .map(([x, y]) => new T.Vector2(x, y)), 20));
// limbs: a capsule whose origin is at the top (shoulder / hip), so rotation.z swings it
const ARM_G = (() => { const g = new T.CapsuleGeometry(0.15, 0.26, 6, 14); g.translate(0, -0.2, 0); return shared(g); })();
const LEG_G = shared(new T.CapsuleGeometry(0.18, 0.16, 6, 16));
const HOOF_G = shared(new T.CylinderGeometry(0.175, 0.2, 0.15, 18));
const MUZZLE_G = shared(new T.SphereGeometry(0.3, 28, 20));

export function makeCow() {
  const g = new T.Group();

  // ---------- body ----------
  const body = mesh(geo.sphere(BODY_R, 24, 18), WHITE, { outline: 0.04 });
  body.position.y = 0.84;
  body.scale.set(1.04, 1, 0.94);
  const bodySpots = new T.Mesh(BODY_SPOTS, toon(PATCH));
  body.add(bodySpots);

  // ---------- legs + hooves ----------
  for (const s of [-1, 1]) {
    const leg = mesh(LEG_G, WHITE, { outline: 0.03 });
    leg.position.set(s * 0.34, 0.3, 0.08);
    const hoof = mesh(HOOF_G, HOOF, { outline: 0.025 });
    hoof.position.set(0, -0.2, 0);
    const cleft = ink(geo.box(0.03, 0.12, 0.06));
    cleft.position.set(0, 0.0, 0.185);
    hoof.add(cleft);
    leg.add(hoof);
    g.add(leg);
  }

  // ---------- arms (front legs) with hooves ----------
  const arms = [];
  for (const s of [-1, 1]) {
    const arm = mesh(ARM_G, WHITE, { outline: 0.028 });
    arm.position.set(s * 0.66, 1.18, 0.12);
    arm.rotation.z = s * 0.38;
    const hoof = mesh(geo.cyl(0.14, 0.155, 0.12, 16), HOOF, { outline: 0.02 });
    hoof.position.set(0, -0.48, 0);
    arm.add(hoof);
    if (s < 0) { // a spot on one arm, for fun
      const sp = new T.Mesh(geo.sphere(0.1, 12, 8), toon(PATCH));
      sp.scale.set(1, 1.3, 0.5); sp.position.set(-0.08, -0.18, 0.1); sp.rotation.y = -0.6;
      arm.add(sp);
    }
    g.add(arm); arms.push(arm);
  }

  // ---------- tail with a tuft ----------
  const tail = mesh(TAIL_G, WHITE, { outline: 0.018 });
  tail.position.set(0, 0.95, -0.6);
  const tuft = mesh(geo.sphere(0.09, 14, 10), PATCH, { outline: 0.018 });
  tuft.scale.set(0.9, 1.5, 0.9);
  tuft.position.set(0.12, -0.56, -0.31);
  tail.add(tuft);
  g.add(tail);

  // ---------- collar + bell ----------
  const collar = mesh(geo.torus(0.47, 0.07, Math.PI * 2, 8, 32), COLLAR, { outline: 0.015 });
  collar.rotation.x = Math.PI / 2 - 0.18;
  collar.position.set(0, 1.4, 0.04);
  g.add(collar);
  const bell = mesh(BELL_G, GOLD, { outline: 0.018 });
  bell.position.set(0, 1.0, 0.6);
  bell.rotation.x = 0.25;
  bell.scale.setScalar(1.25);
  const loop = mesh(geo.torus(0.045, 0.018, Math.PI * 2, 6, 14), GOLD, { outline: 0.01 });
  loop.position.set(0, 0.22, 0);
  const clapper = ink(geo.sphere(0.045, 10, 8));
  clapper.position.set(0, -0.01, 0.02);
  const shine = new T.Mesh(geo.sphere(0.03, 8, 6), basic(0xfff6c8));
  shine.scale.set(0.7, 1.4, 0.5); shine.position.set(-0.06, 0.1, 0.08);
  const rim = new T.Mesh(geo.torus(0.12, 0.018, Math.PI * 2, 6, 24), toon(0xe0a92a));
  rim.rotation.x = Math.PI / 2; rim.position.y = 0.03;
  bell.add(loop, clapper, shine, rim);
  g.add(bell);

  // ---------- head ----------
  const head = mesh(geo.sphere(HEAD_R, 28, 20), WHITE, { outline: 0.035 });
  head.position.y = 1.86;
  head.scale.set(1.04, 0.97, 1);
  head.add(new T.Mesh(HEAD_SPOTS, toon(PATCH)));

  const face = makeFace(HEAD_R);
  face.rotation.x = -0.16; // lift eyes, brows and cheeks to make room for the big muzzle
  head.add(face);
  const parts = face.userData;
  for (const ch of parts.cheeks) { ch.position.x *= 1.04; ch.position.y -= 0.02; }

  // big pink muzzle
  const muzzle = mesh(MUZZLE_G, PINK, { outline: 0.022 });
  muzzle.scale.set(1.62, 1.08, 1.0);
  muzzle.position.set(0, -0.27, 0.5);
  head.add(muzzle);
  // nostrils (placed in head space on the muzzle surface, so they stay round)
  const mz = (x, y) => { // point on the muzzle ellipsoid front, in head space
    const lx = x / (0.3 * 1.62), ly = (y + 0.27) / (0.3 * 1.08);
    return 0.5 + 0.3 * Math.sqrt(Math.max(0.0001, 1 - lx * lx - ly * ly));
  };
  for (const s of [-1, 1]) {
    const x = s * 0.17, y = -0.17;
    const n = new T.Mesh(geo.sphere(0.06, 14, 10), toon(0x8a3c55));
    n.scale.set(0.85, 1.15, 0.4);
    n.position.set(x, y, mz(x, y) - 0.012);
    n.rotation.set(-0.35, s * 0.35, -s * 0.35);
    head.add(n);
    const rimN = new T.Mesh(geo.sphere(0.075, 14, 10), toon(PINK_DEEP));
    rimN.scale.set(0.85, 1.15, 0.3);
    rimN.position.set(x, y + 0.008, mz(x, y) - 0.022);
    rimN.rotation.copy(n.rotation);
    head.add(rimN);
  }
  // muzzle highlight
  const mhi = new T.Mesh(geo.sphere(0.06, 10, 8), basic(0xffd8e2));
  mhi.scale.set(1.8, 0.7, 0.4);
  mhi.position.set(-0.2, -0.08, mz(-0.2, -0.08) - 0.01);
  head.add(mhi);

  // move the face's mouth shapes down onto the muzzle
  const my = -0.37;
  for (const k of ['smile', 'frown', 'oh', 'flat']) {
    const m = parts[k];
    const dy = m.position.y - (-0.3 * HEAD_R);
    head.add(m);
    m.scale.multiplyScalar(1.15);
    m.position.set(0, my + dy, mz(0, my + dy) - 0.035);
    m.rotation.x = 0.45;
  }
  // an opening mouth for mooing: dark oval + tongue, scale.y 0 (closed) .. 1 (open)
  const mouth = new T.Group();
  mouth.position.set(0, my - 0.02, mz(0, my - 0.02) - 0.03);
  mouth.rotation.x = 0.5;
  const hole = new T.Mesh(geo.sphere(0.11, 16, 12), toon(0x6a2a40));
  hole.scale.set(1.15, 1, 0.35);
  const tongue = new T.Mesh(geo.sphere(0.07, 12, 8), toon(0xff7a98));
  tongue.scale.set(1.2, 0.7, 0.5); tongue.position.set(0, -0.05, 0.02);
  mouth.add(hole, tongue);
  mouth.scale.y = 0.001; // closed; scale.y up to 1 opens it
  head.add(mouth);

  // little horns
  for (const s of [-1, 1]) {
    const horn = mesh(HORN_G, HORN, { outline: 0.016 });
    horn.position.set(s * 0.3, 0.5, -0.02);
    horn.scale.setScalar(1.45);
    horn.rotation.set(-0.15, 0, -s * 0.35);
    horn.scale.x *= s; // curve outwards on both sides
    head.add(horn);
  }
  // tuft of hair between the horns
  for (const [x, y, z, r] of [[-0.07, 0.66, 0.12, 0.07], [0.06, 0.67, 0.13, 0.075], [0, 0.7, 0.05, 0.08]]) {
    const t = mesh(geo.sphere(r, 12, 10), WHITE, { outline: 0.012 });
    t.position.set(x, y, z);
    head.add(t);
  }

  // floppy ears, sticking out sideways and drooping
  const ears = [];
  for (const s of [-1, 1]) {
    const pivot = new T.Group();
    pivot.position.set(s * 0.6, 0.3, 0.0);
    pivot.rotation.set(0.3, -s * 0.2, -s * (Math.PI / 2 + 0.7));
    const ear = mesh(EAR, s < 0 ? PATCH : WHITE, { outline: 0.02 });
    ear.scale.set(1.15, 1.45, 0.42);
    const inner = new T.Mesh(EAR, toon(PINK));
    inner.scale.set(0.68, 0.8, 0.55);
    inner.position.set(0, 0.07, 0.11);
    ear.add(inner);
    pivot.add(ear);
    head.add(pivot);
    ears.push(pivot);
  }

  g.add(body, head, blobShadow(0.95));
  g.userData = {
    head, face, body, arms, kind: 'cow', mouth, tail, ears, bell,
    anchors: {
      nose: [0, 1.7, 0.78], mouth: [0, 1.5, 0.74], eyeL: [-0.255, 2.03, 0.61], eyeR: [0.255, 2.03, 0.61],
      earL: [-0.9, 1.98, 0.1], earR: [0.9, 1.98, 0.1], tummy: [0, 0.75, 0.7],
      handL: [-0.82, 0.78, 0.2], handR: [0.82, 0.78, 0.2], footL: [-0.34, 0.12, 0.3], footR: [0.34, 0.12, 0.3],
    },
  };
  return g;
}
