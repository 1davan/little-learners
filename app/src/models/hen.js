// Hen. Contract: userData { head, face, body, wings[2], kind: 'hen' }.
// A plump cream hen: big round head with a three-lobed red comb, wattle and two-part beak,
// fluffy chest, feathered wings that pivot at the shoulder and a tall fanned tail.
import * as T from '../three.js';
import { mesh, geo, blobShadow, basic } from '../engine/toon.js';
import { makeFace, setFace } from '../engine/faces.js';

const COL = {
  body: 0xfdecd2, wing: 0xf6dfb8, tip: 0xedb67c, tail: 0xf6dfbd, tail2: 0xefc28e,
  comb: 0xff4f55, beak: 0xffbe3a, beakLo: 0xff9f2e, leg: 0xffaa33,
};

function sharedGeo(g) { g.userData.shared = true; return g; }
// geometry with the origin at the top (wings pivot at the shoulder) or at the base (feathers)
const WING_G = sharedGeo(new T.SphereGeometry(0.36, 22, 16).translate(0, -0.27, 0));
const FEATHER_G = sharedGeo(new T.SphereGeometry(0.2, 18, 12).translate(0, 0.17, 0));
const COMB_G = sharedGeo(new T.SphereGeometry(0.13, 18, 12).translate(0, 0.07, 0));
const TOE_G = sharedGeo(new T.CapsuleGeometry(0.045, 0.14, 4, 10).rotateX(Math.PI / 2).translate(0, 0, 0.1));

export function makeHen() {
  const g = new T.Group();

  // ---- body: plump, a little egg-shaped and chesty ----
  const body = mesh(geo.sphere(0.8, 28, 20), COL.body, { outline: 0.04 });
  body.position.set(0, 0.92, -0.04);
  body.scale.set(1.04, 0.94, 1.08);
  // ---- head ----
  const R = 0.56;
  const head = mesh(geo.sphere(R, 28, 20), COL.body, { outline: 0.035 });
  head.position.set(0, 1.86, 0.12);
  // face built a size up for bigger eyes, then every part snapped back onto the head sphere
  const face = makeFace(R * 1.3, { mouth: false });
  const zOn = (x, y) => Math.sqrt(Math.max(0.0001, R * R - x * x - y * y));
  const fp = face.userData, eyeR = 0.14 * R * 1.3;
  for (const e of fp.eyes) { e.position.x *= 0.88; e.position.y -= 0.02; e.position.z = zOn(e.position.x, e.position.y) - eyeR * 0.45; }
  for (const b of fp.brows) { b.userData.y -= 0.05; b.position.x *= 0.85; b.scale.x = 0.75; b.position.z = zOn(b.position.x, b.userData.y + 0.02) - 0.012; }
  for (const t of fp.tears) t.position.z = zOn(t.position.x, t.position.y) + 0.01;
  for (const c of fp.cheeks) { c.position.x *= 0.95; c.position.z = zOn(c.position.x, c.position.y) - 0.012; }
  for (const e of fp.eyes) {
    const sp = new T.Mesh(geo.sphere(eyeR * 0.17, 8, 6), basic(0xffffff));
    sp.position.set(-eyeR * 0.35, -eyeR * 0.38, eyeR * 0.82);
    e.add(sp);
  }
  setFace(face, 'happy'); // re-apply so the moved brows take their new height
  head.add(face);
  // beak: chunky upper half and a smaller lower half
  const beak = mesh(geo.cone(0.13, 0.26, 18), COL.beak, { outline: 0.018 });
  beak.rotation.x = Math.PI / 2; beak.scale.set(1.25, 1, 0.75);
  beak.position.set(0, -0.06, R + 0.08);
  const beakLo = mesh(geo.cone(0.09, 0.16, 14), COL.beakLo, { outline: 0.014 });
  beakLo.rotation.x = Math.PI / 2 + 0.25; beakLo.scale.set(1.2, 1, 0.6);
  beakLo.position.set(0, -0.13, R + 0.02);
  head.add(beak, beakLo);
  // wattle: a soft red double drop under the beak
  for (const [x, r, y] of [[-0.035, 0.08, -0.27], [0.04, 0.07, -0.25]]) {
    const w = mesh(geo.sphere(r, 16, 12), COL.comb, { outline: 0.014 });
    w.scale.set(0.9, 1.5, 0.7);
    w.position.set(x, y, R - 0.07);
    head.add(w);
  }
  // comb: three chunky lobes across the crown, front to back
  for (const [z, sc, tilt] of [[0.2, 0.9, 0.55], [0.03, 1.15, 0.1], [-0.15, 0.95, -0.4]]) {
    const c = mesh(COMB_G, COL.comb, { outline: 0.018 });
    c.position.set(0, Math.sqrt(R * R - z * z) - 0.05, z);
    c.scale.set(0.85 * sc, 1.3 * sc, 0.95 * sc);
    c.rotation.x = tilt;
    head.add(c);
  }

  // ---- wings: pivot at the shoulder, with darker feather tips ----
  const wings = [];
  for (const s of [-1, 1]) {
    const w = mesh(WING_G, COL.wing, { outline: 0.028 });
    w.position.set(s * 0.74, 1.22, -0.06);
    w.scale.set(0.42, 1, 1.05);
    w.rotation.z = s * 0.18;
    for (const [y, z, r] of [[-0.5, -0.12, 0.13], [-0.46, -0.3, 0.12], [-0.38, 0.06, 0.11]]) {
      const t = mesh(geo.sphere(r, 14, 10), COL.tip, { outline: 0.012 });
      t.position.set(s * 0.02, y, z);
      t.scale.set(1, 1.2, 1);
      w.add(t);
    }
    g.add(w); wings.push(w);
  }

  // ---- tail: a tall fan of rounded feathers swept up and back ----
  const tail = new T.Group();
  tail.position.set(0, 1.18, -0.72);
  tail.rotation.x = -0.55;
  const fan = [[-0.62, 0.85, COL.tail2], [-0.3, 1.05, COL.tail], [0, 1.15, COL.tail2], [0.3, 1.05, COL.tail], [0.62, 0.85, COL.tail2]];
  for (const [a, len, col] of fan) {
    const f = mesh(FEATHER_G, col, { outline: 0.022 });
    f.rotation.z = a;
    f.scale.set(0.62, 1.6 * len, 0.42);
    f.position.set(-Math.sin(a) * 0.08, 0, Math.abs(a) * 0.1);
    tail.add(f);
  }

  // ---- legs and three-toed feet ----
  for (const s of [-1, 1]) {
    const leg = mesh(geo.cyl(0.055, 0.06, 0.3, 12), COL.leg, { outline: 0.014 });
    leg.position.set(s * 0.27, 0.18, 0.08);
    g.add(leg);
    for (const a of [-0.55, 0, 0.55]) {
      const toe = mesh(TOE_G, COL.leg, { outline: 0.014 });
      toe.position.set(s * 0.27, 0.045, 0.08);
      toe.rotation.y = a + s * 0.12;
      g.add(toe);
    }
  }

  g.add(body, head, tail, blobShadow(0.95));
  g.userData = { head, face, body, wings, kind: 'hen' };
  return g;
}
