// Sheep. Contract: userData { head, face (from makeFace), body, arms[2], kind: 'sheep' }; feet at y=0, faces +z.
// Standalone chibi: a cloud of overlapping wool puffs, a dark face with a pale muzzle, a woolly fringe and sideways ears.
import * as T from '../three.js';
import { mesh, geo, blobShadow, toon, basic } from '../engine/toon.js';
import { makeFace } from '../engine/faces.js';

const WOOL = 0xfff9f0;      // warm cream wool
const WOOL_CORE = 0xf1e7d6; // slightly deeper fill between the puffs
const SKIN = 0x5b4653;      // dark plum-cocoa face and legs
const MUZZLE = 0x8a707c;    // softer muzzle so the mouth reads
const HOOF = 0x3f2f3a;
const EAR_IN = 0xff9eb5;
const BROW = 0xc7aeb6;      // light brows so they read on the dark face

function shared(g) { g.userData.shared = true; return g; }
// Stubby leg: a capsule hanging down from its pivot (origin at the top).
const LEG_GEO = shared(new T.CapsuleGeometry(0.11, 0.2, 6, 16).translate(0, -0.15, 0));
const ARM_GEO = shared(new T.CapsuleGeometry(0.1, 0.2, 6, 16).translate(0, -0.14, 0));

// Evenly spread points on a unit sphere (golden spiral).
function spiral(n) {
  const out = [], ga = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (2 * (i + 0.5)) / n, r = Math.sqrt(1 - y * y), a = i * ga;
    out.push([Math.cos(a) * r, y, Math.sin(a) * r]);
  }
  return out;
}

export function makeSheep() {
  const g = new T.Group();

  // ---------- wool body: a core plus overlapping puffs (the whole group breathes) ----------
  const body = new T.Group();
  body.position.y = 0.22;
  const BC = 0.66; // body centre height inside the group
  const core = mesh(geo.sphere(0.62, 22, 16), WOOL_CORE, { outline: 0 });
  core.scale.set(1.2, 0.98, 1.06);
  core.position.y = BC;
  body.add(core);
  for (const [x, y, z] of spiral(26)) {
    if (y < -0.8) continue; // underside hidden anyway
    const r = 0.25 + 0.05 * (1 - Math.abs(y));
    const p = mesh(geo.sphere(r, 20, 14), WOOL, { outline: 0.026 });
    p.position.set(x * 0.74, BC + y * 0.54, z * 0.66);
    body.add(p);
  }
  // tail puff
  const tail = mesh(geo.sphere(0.17, 16, 12), WOOL, { outline: 0.025 });
  tail.position.set(0, BC + 0.15, -0.82);
  body.add(tail);
  g.add(body);

  // ---------- legs ----------
  for (const s of [-1, 1]) {
    const leg = mesh(LEG_GEO, SKIN, { outline: 0.025 });
    leg.position.set(s * 0.3, 0.42, 0.12);
    const hoof = mesh(geo.sphere(0.13, 16, 10), HOOF, { outline: 0.02 });
    hoof.scale.set(1, 0.6, 1.15);
    hoof.position.set(0, -0.34, 0.03);
    leg.add(hoof);
    g.add(leg);
  }
  // front legs ("arms"), pivot at the shoulder inside the wool
  const arms = [];
  for (const s of [-1, 1]) {
    const arm = mesh(ARM_GEO, SKIN, { outline: 0.025 });
    arm.position.set(s * 0.74, 0.8, 0.36);
    arm.rotation.z = s * 0.6;
    const hoof = mesh(geo.sphere(0.115, 16, 10), HOOF, { outline: 0.018 });
    hoof.scale.set(1, 0.75, 1);
    hoof.position.set(0, -0.31, 0);
    arm.add(hoof);
    g.add(arm); arms.push(arm);
  }

  // ---------- head ----------
  const R = 0.66;
  const head = mesh(geo.sphere(R, 28, 20), SKIN, { outline: 0.035 });
  head.position.set(0, 1.72, 0.12);
  head.scale.set(1.04, 0.96, 1);
  g.add(head);

  const face = makeFace(R);
  const fp = face.userData;
  // white eye discs behind the ink pupils so the eyes pop on the dark face (children, so they blink too)
  for (const e of fp.eyes) {
    e.position.y -= 0.03;
    const w = new T.Mesh(geo.sphere(0.14 * R * 1.5, 18, 12), basic(0xffffff));
    w.scale.set(1, 1.05, 0.45);
    w.position.set(0, 0, -0.03);
    e.add(w);
  }
  for (const b of fp.brows) b.material = toon(BROW);
  for (const c of fp.cheeks) c.position.y -= 0.02;
  head.add(face);

  // muzzle patch carrying the mouth
  const muzzle = mesh(geo.sphere(0.26, 22, 14), MUZZLE, { outline: 0.018 });
  muzzle.scale.set(1.25, 0.85, 0.6);
  muzzle.position.set(0, -0.2, 0.5);
  head.add(muzzle);
  for (const k of ['smile', 'frown', 'oh', 'flat']) if (fp[k]) fp[k].position.z += 0.05;
  for (const s of [-1, 1]) {
    const n = new T.Mesh(geo.sphere(0.035, 10, 8), toon(HOOF));
    n.scale.set(1.3, 0.8, 0.6);
    n.position.set(s * 0.085, -0.13, 0.655);
    head.add(n);
  }

  // ears sticking out sideways, slightly drooped
  for (const s of [-1, 1]) {
    const ear = mesh(geo.sphere(0.14, 18, 12), SKIN, { outline: 0.022 });
    ear.scale.set(1.9, 0.75, 0.6);
    ear.position.set(s * 0.74, 0.12, 0.0);
    ear.rotation.z = -s * 0.3;
    ear.rotation.y = -s * 0.25;
    const inner = new T.Mesh(geo.sphere(0.1, 14, 10), toon(EAR_IN));
    inner.scale.set(1.0, 0.65, 0.5);
    inner.position.set(s * 0.02, 0, 0.08);
    ear.add(inner);
    head.add(ear);
  }

  // woolly fringe / cap
  const capPts = [
    [0, 0.66, 0.05, 0.24], [-0.3, 0.56, 0.2, 0.2], [0.3, 0.56, 0.2, 0.2], [-0.12, 0.54, 0.36, 0.2], [0.14, 0.55, 0.35, 0.19],
    [-0.42, 0.45, -0.12, 0.2], [0.42, 0.45, -0.12, 0.2], [-0.2, 0.55, -0.32, 0.22], [0.2, 0.55, -0.32, 0.22],
  ];
  for (const [x, y, z, r] of capPts) {
    const p = mesh(geo.sphere(r, 18, 12), WOOL, { outline: 0.022 });
    p.position.set(x, y, z);
    head.add(p);
  }

  g.add(blobShadow(1.0));
  g.userData = { head, face, body, arms, kind: 'sheep' };
  g.userData.anchors = {
    nose: [0, 1.6, 0.78], mouth: [0, 1.5, 0.78], eyeL: [-0.25, 1.77, 0.7], eyeR: [0.25, 1.77, 0.7], tummy: [0, 0.85, 0.8],
    handL: [-0.92, 0.54, 0.4], handR: [0.92, 0.54, 0.4], footL: [-0.3, 0.08, 0.3], footR: [0.3, 0.08, 0.3],
    earL: [-0.95, 1.82, 0.2], earR: [0.95, 1.82, 0.2],
  };
  return g;
}
