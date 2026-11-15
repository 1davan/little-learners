// Duckling-style duck (Who says moo?, the tub in the Splash wash home icon). Faces +z.
// Contract: userData { body, head, face, wings[2], kind: 'duck', baseScale }; makeDuck(s) scales it.
import * as T from '../three.js';
import { mesh, geo, ink, blobShadow, toon, basic } from '../engine/toon.js';
import { C, makeFace } from '../engine/faces.js';

const YEL = 0xffd23f, YEL_DK = 0xffbe2e, BELLY = 0xfff0a0, BILL = 0xff9a3c, BILL_DK = 0xf07c2a;

function shared(g) { g.userData.shared = true; return g; }
// Ellipsoid with its pivot moved to the top edge (wing hangs from the shoulder).
function pivotEllipsoid(rx, ry, rz, dy, dz = 0) {
  const g = new T.SphereGeometry(1, 20, 14);
  g.scale(rx, ry, rz); g.translate(0, dy, dz);
  return shared(g);
}
const WING = pivotEllipsoid(0.08, 0.2, 0.24, -0.14, -0.06);
// Webbed foot: a flat rounded fan pointing +z.
const FOOT = (() => {
  const s = new T.Shape();
  s.moveTo(0, -0.04);
  s.quadraticCurveTo(-0.13, 0.02, -0.12, 0.16);
  s.quadraticCurveTo(-0.06, 0.13, -0.04, 0.19);
  s.quadraticCurveTo(0, 0.15, 0.04, 0.19);
  s.quadraticCurveTo(0.06, 0.13, 0.12, 0.16);
  s.quadraticCurveTo(0.13, 0.02, 0, -0.04);
  const g = new T.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 2, curveSegments: 8 });
  g.rotateX(Math.PI / 2); g.translate(0, 0.055, 0);
  return shared(g);
})();

export function makeDuck(s = 1) {
  const g = new T.Group();

  // Round pear body, a little tipped up at the tail.
  const body = mesh(geo.sphere(0.42, 24, 18), YEL, { outline: 0.03 });
  body.scale.set(1.0, 0.86, 1.12);
  body.position.set(0, 0.42, -0.02);
  const belly = mesh(geo.sphere(0.34, 20, 14), BELLY, { outline: 0 });
  belly.scale.set(0.95, 0.9, 0.75);
  belly.position.set(0, -0.06, 0.18);
  body.add(belly);
  // Perky tail flick.
  const tail = mesh(geo.cone(0.14, 0.34, 16), YEL, { outline: 0.02 });
  tail.scale.set(1.2, 1, 0.6);
  tail.position.set(0, 0.6, -0.48);
  tail.rotation.x = -0.75;
  g.add(body, tail);

  // Big round head.
  const R = 0.37;
  const head = mesh(geo.sphere(R, 26, 20), YEL, { outline: 0.03 });
  head.position.set(0, 0.98, 0.08);
  const face = makeFace(R, { mouth: false });
  head.add(face);
  // Wide duck bill: upper and lower halves, set low on the face.
  const bill = new T.Group();
  bill.position.set(0, -0.14 * R, 0.84 * R);
  const top = mesh(geo.sphere(0.17, 20, 12), BILL, { outline: 0.016 });
  top.scale.set(0.88, 0.34, 1.05);
  top.position.set(0, 0.015, 0.1);
  const low = mesh(geo.sphere(0.13, 16, 10), BILL_DK, { outline: 0.014 });
  low.scale.set(0.74, 0.3, 0.88);
  low.position.set(0, -0.035, 0.08);
  for (const sd of [-1, 1]) { // nostrils
    const n = ink(geo.sphere(0.012, 6, 4));
    n.position.set(sd * 0.045, 0.06, 0.1);
    top.add(n);
  }
  bill.add(low, top);
  head.add(bill);
  // Fluffy duckling head tuft.
  for (const [x, ry, rz, sc] of [[0, 0, 0, 1], [-0.06, 0, 0.5, 0.8], [0.06, 0, -0.5, 0.8]]) {
    const t = mesh(geo.sphere(0.06, 12, 8), YEL, { outline: 0.014 });
    t.scale.set(0.7 * sc, 1.6 * sc, 0.7 * sc);
    t.position.set(x, R + 0.04 * sc, -0.03);
    t.rotation.set(-0.3, ry, rz);
    head.add(t);
  }
  g.add(head);

  // Little wings hanging from the shoulders (rotation.z flaps them out).
  const wings = [];
  for (const sd of [-1, 1]) {
    const w = mesh(WING, YEL_DK, { outline: 0.02 });
    w.position.set(sd * 0.39, 0.58, -0.02);
    w.rotation.set(0.25, 0, sd * 0.18);
    g.add(w); wings.push(w);
  }

  // Webbed feet poking out the front.
  for (const sd of [-1, 1]) {
    const f = mesh(FOOT, BILL, { outline: 0.012 });
    f.position.set(sd * 0.17, 0, 0.12);
    f.rotation.y = sd * 0.25;
    g.add(f);
  }

  g.scale.setScalar(s);
  g.userData = { body, head, face, wings, kind: 'duck', baseScale: s };
  return g;
}
