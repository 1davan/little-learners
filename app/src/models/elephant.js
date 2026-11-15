// Elephant. Contract: userData { head, face, body, trunk[segments, each the child of the previous], legs, kind: 'elephant' }.
// A chunky baby elephant: big head, huge floppy pink-lined ears, curly trunk, toenails, a tufted tail.
import * as T from '../three.js';
import { mesh, geo, toon, blobShadow } from '../engine/toon.js';
import { makeFace } from '../engine/faces.js';

const SKIN = 0xa9b3d2;   // soft lavender-blue grey
const LIGHT = 0xc4cbe4;  // belly / trunk tip
const DARK = 0x8a93b5;   // wrinkles, hair, tail tuft
const WRINKLE = 0x939dc0;
const PINK = 0xffaec8;   // inner ears
const NAIL = 0xfff3e0;   // toenails

function shared(g) { g.userData.shared = true; return g; }

// Stubby leg: slight flare at the foot with a rounded sole edge (top is hidden inside the body).
const LEG_GEO = shared(new T.LatheGeometry([
  [0.0, 0.0], [0.2, 0.0], [0.27, 0.02], [0.3, 0.07], [0.305, 0.14], [0.29, 0.28], [0.27, 0.46], [0.26, 0.62], [0.2, 0.72], [0.0, 0.74],
].map(([x, y]) => new T.Vector2(x, y)), 22));

// Little curved tail.
const TAIL_GEO = shared(new T.TubeGeometry(new T.CatmullRomCurve3([
  new T.Vector3(0, 0, 0), new T.Vector3(0, -0.08, -0.12), new T.Vector3(0.04, -0.24, -0.2), new T.Vector3(0.1, -0.38, -0.18),
]), 12, 0.045, 8, false));

// Trunk segments: length, radius at top, radius at bottom, rest bend (rotation.x, negative curls forward/up).
// twist: rotation.z, so the curl swings a little to one side and reads as a curl from the front.
const TRUNK = [
  [0.28, 0.23, 0.2, -0.1, 0],
  [0.25, 0.2, 0.175, 0.08, 0],
  [0.21, 0.175, 0.155, -0.5, 0.22],
  [0.18, 0.155, 0.14, -0.95, 0.25],
  [0.15, 0.14, 0.13, -1.1, 0.25],
];

export function makeElephant() {
  const g = new T.Group();

  // ---- body ----
  const body = mesh(geo.sphere(0.8, 24, 18), SKIN, { outline: 0.04 });
  body.scale.set(1.05, 0.88, 1.15);
  body.position.set(0, 0.98, -0.32);
  const belly = mesh(geo.sphere(0.6, 20, 14), LIGHT, { outline: 0 });
  belly.scale.set(0.8, 0.8, 0.5);
  belly.position.set(0, -0.12, 0.62);
  body.add(belly);

  // tail with a darker tuft
  const tail = mesh(TAIL_GEO, SKIN, { outline: 0.018 });
  tail.position.set(0, 0.1, -0.86);
  body.add(tail);
  tail.scale.set(1 / 1.05, 1 / 0.88, 1 / 1.15);
  const tuft = mesh(geo.sphere(0.09, 12, 8), DARK, { outline: 0.015 });
  tuft.scale.set(0.8, 1.3, 0.8);
  tuft.position.set(0.1, -0.42, -0.18);
  tail.add(tuft);

  // ---- legs with toenails ----
  const legs = [];
  for (const [x, z] of [[-0.42, 0.18], [0.42, 0.18], [-0.44, -0.78], [0.44, -0.78]]) {
    const l = mesh(LEG_GEO, SKIN, { outline: 0.03 });
    l.position.set(x, 0, z);
    for (const a of [-0.55, 0, 0.55]) {
      const n = mesh(geo.sphere(0.075, 12, 8), NAIL, { outline: 0.012 });
      n.scale.set(1, 0.85, 0.55);
      n.position.set(Math.sin(a) * 0.29, 0.09, Math.cos(a) * 0.29);
      n.rotation.y = a;
      l.add(n);
    }
    g.add(l); legs.push(l);
  }

  // ---- head ----
  const R = 0.8;
  const head = mesh(geo.sphere(R, 28, 20), SKIN, { outline: 0.035 });
  head.position.set(0, 1.76, 0.36);

  const face = makeFace(R, { mouth: false });
  // bigger, sparkly eyes
  const k = 1.4;
  for (const e of face.userData.eyes) {
    const r0 = 0.14 * R;
    e.geometry = geo.sphere(r0 * k, 18, 14);
    e.position.z -= r0 * 0.25;
    const hi = e.children[0];
    hi.position.multiplyScalar(k); hi.scale.setScalar(k);
    const hi2 = new T.Mesh(geo.sphere(r0 * 0.18, 8, 6), hi.material);
    hi2.position.set(-r0 * 0.35, -r0 * 0.45, r0 * 1.15);
    e.add(hi2);
  }
  for (const b of face.userData.brows) b.userData.y += 0.04;
  for (const c of face.userData.cheeks) { c.position.x *= 1.05; c.position.y -= 0.03; c.scale.multiplyScalar(1.2); }
  head.add(face);

  // tuft of baby hair on top
  for (const [x, rz, s] of [[-0.09, 0.45, 0.85], [0.0, 0, 1.1], [0.09, -0.45, 0.85]]) {
    const h = mesh(geo.torus(0.1, 0.03, Math.PI * 1.3, 6, 14), DARK, { outline: 0 });
    h.position.set(x, R * 0.97, 0.18);
    h.rotation.set(-0.2, 0, Math.PI * 0.35 + rz);
    h.scale.setScalar(s);
    head.add(h);
  }

  // huge floppy ears with pink insides
  for (const s of [-1, 1]) {
    const pivot = new T.Group();
    pivot.position.set(s * 0.6, 0.12, -0.18);
    pivot.rotation.set(0.08, -s * 0.4, -s * 0.3);
    const ear = mesh(geo.sphere(1, 24, 16), SKIN, { outline: 0.03 });
    ear.scale.set(0.66, 0.76, 0.11);
    ear.position.set(s * 0.5, -0.14, 0);
    const inner = mesh(geo.sphere(1, 22, 14), PINK, { outline: 0 });
    inner.scale.set(0.72, 0.72, 0.55);
    inner.position.set(s * 0.06, -0.04, 0.5);
    ear.add(inner);
    pivot.add(ear);
    head.add(pivot);
  }

  // curly trunk: a chain of pivots, each hanging down from the previous
  const trunk = [];
  let parent = head;
  for (let i = 0; i < TRUNK.length; i++) {
    const [len, rt, rb, bend, twist] = TRUNK[i];
    const seg = new T.Group();
    if (i === 0) seg.position.set(0, -0.16, 0.68);
    else seg.position.y = -TRUNK[i - 1][0];
    seg.rotation.set(bend, 0, twist);
    const tube = mesh(geo.cyl(rb, rt, len, 18, true), SKIN, { outline: 0.025 });
    tube.position.y = -len / 2;
    const joint = mesh(geo.sphere(rb, 18, 12), i === TRUNK.length - 1 ? LIGHT : SKIN, { outline: 0.025 });
    joint.position.y = -len;
    seg.add(tube, joint);
    if (i === 0) { const root = mesh(geo.sphere(rt * 1.05, 18, 12), SKIN, { outline: 0 }); root.position.y = 0.02; seg.add(root); }
    if (i < 2) {
      const w = mesh(geo.torus(rt * 0.99, 0.012, Math.PI, 6, 18), WRINKLE, { outline: 0 });
      w.rotation.set(Math.PI / 2, 0, 0);
      w.position.y = -len * 0.55;
      seg.add(w);
    }
    parent.add(seg); trunk.push(seg);
    parent = seg;
  }
  // nostrils on the tip
  const tip = trunk[trunk.length - 1];
  for (const s of [-1, 1]) {
    const n = new T.Mesh(geo.sphere(0.03, 8, 6), toon(0x5a4060));
    n.scale.set(1, 0.6, 1);
    n.position.set(s * 0.045, -TRUNK[TRUNK.length - 1][0] - 0.12, 0.02);
    tip.add(n);
  }

  const shadow = blobShadow(1.3);
  shadow.position.z = -0.25;
  g.add(body, head, shadow);
  g.userData = { head, face, body, trunk, legs, kind: 'elephant' };
  return g;
}
