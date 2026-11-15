// Baby chick (hides in Peekaboo pots). Contract: userData { body, face, wings, kind: 'chick', baseScale }.
// A fluffy egg-shaped chick with huge sparkly eyes, a tiny beak, a curly head tuft, tiny wings and orange feet.
// At scale 0.6 it stays well inside an upside-down flowerpot (about 0.85 world units tall, 0.5 wide each side).
import * as T from '../three.js';
import { mesh, geo, blobShadow, basic } from '../engine/toon.js';
import { makeFace, setFace } from '../engine/faces.js';

const COL = { body: 0xffdc45, belly: 0xfff1a0, wing: 0xffc52a, beak: 0xff9a2e, feet: 0xff9a2e };

function sharedGeo(g) { g.userData.shared = true; return g; }

// egg profile: half-height B, half-width A, a little wider near the bottom
const A = 0.6, B = 0.7, K = 0.14;
const eggR = (y) => {
  const c = Math.min(1, Math.max(-1, -y / B));
  return A * Math.sqrt(1 - c * c) * (1 + K * c);
};
const eggZ = (x, y) => Math.sqrt(Math.max(0.0001, eggR(y) ** 2 - x * x));
const EGG_G = sharedGeo((() => {
  const pts = [];
  const N = 32;
  for (let i = 0; i <= N; i++) {
    const th = (i / N) * Math.PI;
    pts.push(new T.Vector2(Math.max(0.0001, A * Math.sin(th) * (1 + K * Math.cos(th))), -Math.cos(th) * B));
  }
  return new T.LatheGeometry(pts, 36);
})());
const WING_G = sharedGeo(new T.SphereGeometry(0.2, 18, 12).translate(0, -0.15, 0));
const TUFT_G = sharedGeo(new T.SphereGeometry(0.07, 14, 10).translate(0, 0.06, 0));
const TOE_G = sharedGeo(new T.CapsuleGeometry(0.045, 0.1, 4, 10).rotateX(Math.PI / 2).translate(0, 0, 0.08));

export function makeChick(s = 0.55) {
  const g = new T.Group();
  const inner = new T.Group();

  const body = mesh(EGG_G, COL.body, { outline: 0.035 });
  body.position.y = B + 0.06;

  // ---- face: big eyes; every part is snapped onto the egg surface ----
  const FR = 0.9;
  const face = makeFace(FR, { mouth: false });
  const fy = 0.02;
  face.position.set(0, fy, 0);
  const fp = face.userData;
  for (const e of fp.eyes) e.position.x *= 0.8;
  for (const t of fp.tears) t.position.x *= 0.8;
  for (const e of fp.eyes) e.position.z = eggZ(e.position.x, e.position.y + fy) - 0.14 * FR * 0.5;
  for (const b of fp.brows) {
    b.userData.y -= 0.11;
    b.position.x *= 0.72; b.scale.x = 0.65;
    b.position.z = eggZ(b.position.x, b.userData.y + fy + 0.03) - 0.015;
  }
  for (const t of fp.tears) t.position.z = eggZ(t.position.x, t.position.y + fy) + 0.01;
  for (const c of fp.cheeks) { c.position.x *= 0.92; c.position.z = eggZ(c.position.x, c.position.y + fy) - 0.012; c.scale.set(1.15, 0.7, 0.4); }
  // second little sparkle in each eye
  for (const e of fp.eyes) {
    const er = 0.14 * FR;
    const sp = new T.Mesh(geo.sphere(er * 0.17, 8, 6), basic(0xffffff));
    sp.position.set(-er * 0.35, -er * 0.38, er * 0.82);
    e.add(sp);
  }
  setFace(face, 'happy'); // re-apply so the moved brows take their new height
  body.add(face);

  // tiny beak, just under the eyes
  const by = -0.04;
  const beak = mesh(geo.cone(0.085, 0.16, 14), COL.beak, { outline: 0.014 });
  beak.rotation.x = Math.PI / 2; beak.scale.set(1.25, 1, 0.8);
  beak.position.set(0, by, eggZ(0, by) + 0.05);
  body.add(beak);

  // soft pale belly patch
  const belly = mesh(EGG_G, COL.belly, { outline: 0 });
  belly.scale.set(0.74, 0.55, 0.8);
  belly.position.set(0, -0.28, 0.12);
  body.add(belly);

  // curly fluff tuft on top
  for (const [x, rz, sc] of [[-0.06, 0.55, 0.85], [0, -0.05, 1.15], [0.06, -0.6, 0.85]]) {
    const t = mesh(TUFT_G, COL.body, { outline: 0.014 });
    t.position.set(x, B - 0.04, -0.02);
    t.rotation.set(-0.2, 0, rz);
    t.scale.set(0.8 * sc, 1.9 * sc, 0.8 * sc);
    body.add(t);
  }
  // fluffy little cheek puffs on the sides of the head
  for (const sd of [-1, 1]) {
    const p = mesh(geo.sphere(0.12, 14, 10), COL.body, { outline: 0.016 });
    p.position.set(sd * (eggR(0.22) - 0.04), 0.22, -0.05);
    p.scale.set(0.8, 0.9, 1);
    body.add(p);
  }
  // little tail flick at the back
  for (const [x, rz] of [[-0.05, 0.5], [0.05, -0.5]]) {
    const t = mesh(TUFT_G, COL.wing, { outline: 0.014 });
    t.position.set(x, -0.22, -eggZ(0, -0.22) + 0.06);
    t.rotation.set(-1.1, 0, rz);
    t.scale.set(0.9, 1.6, 0.9);
    body.add(t);
  }

  // ---- tiny wings (pivot at the shoulder) ----
  const wings = [];
  for (const sd of [-1, 1]) {
    const w = mesh(WING_G, COL.wing, { outline: 0.018 });
    w.position.set(sd * (eggR(-0.02) - 0.03), body.position.y - 0.02, -0.02);
    w.scale.set(0.45, 1, 0.8);
    w.rotation.z = sd * 0.35;
    inner.add(w); wings.push(w);
    // feet: three stubby toes
    for (const a of [-0.5, 0, 0.5]) {
      const toe = mesh(TOE_G, COL.feet, { outline: 0.014 });
      toe.position.set(sd * 0.2, 0.045, 0.12);
      toe.rotation.y = a + sd * 0.1;
      inner.add(toe);
    }
  }

  inner.add(body, blobShadow(0.62));
  g.add(inner);
  g.scale.setScalar(s);
  g.userData = { body, face, wings, kind: 'chick', baseScale: s };
  return g;
}
