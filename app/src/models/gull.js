// Friendly cartoon seagull (perches on the post in "Which has more?"). Faces +z.
// Contract: userData { head, wings[2], kind: 'gull' }. Wings flap by rotation.z (pivot at the shoulder).
import * as T from '../three.js';
import { mesh, geo, ink, blobShadow, toon, basic } from '../engine/toon.js';
import { C, makeFace } from '../engine/faces.js';

const WHITE = 0xfbf8f2, GREY = 0xb3bccb, GREY_DK = 0x8d97ab, TIP = 0x4a4258, BEAK = 0xffd23f, SPOT = 0xff5a5a, FEET = 0xff9f3f;

function shared(g) { g.userData.shared = true; return g; }
// Folded wing: an ellipsoid whose origin sits at its top-front edge, so rotation.z swings it out from the shoulder.
const WING = (() => {
  const g = new T.SphereGeometry(1, 22, 14);
  g.scale(0.1, 0.3, 0.42); g.rotateX(0.35); g.translate(0, -0.22, -0.16);
  return shared(g);
})();
const WINGTIP = (() => {
  const g = new T.SphereGeometry(1, 16, 10);
  g.scale(0.07, 0.13, 0.2); g.rotateX(0.9); g.translate(0, -0.36, -0.46);
  return shared(g);
})();
// Webbed foot: rounded fan pointing +z.
const FOOT = (() => {
  const s = new T.Shape();
  s.moveTo(0, -0.03);
  s.quadraticCurveTo(-0.12, 0.02, -0.11, 0.15);
  s.quadraticCurveTo(-0.05, 0.12, -0.035, 0.18);
  s.quadraticCurveTo(0, 0.14, 0.035, 0.18);
  s.quadraticCurveTo(0.05, 0.12, 0.11, 0.15);
  s.quadraticCurveTo(0.12, 0.02, 0, -0.03);
  const g = new T.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2, curveSegments: 8 });
  g.rotateX(Math.PI / 2); g.translate(0, 0.045, 0);
  return shared(g);
})();
// Chunky cartoon beak: a lathe with a rounded hooked tip, pointing +z.
const BEAK_GEO = (() => {
  const pts = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    pts.push(new T.Vector2(0.095 * Math.sqrt(1 - t * t * 0.9) + 0.006, 0.36 * t));
  }
  const g = new T.LatheGeometry(pts, 18);
  g.scale(1.05, 1, 0.8); // the y axis becomes the beak length after rotation
  g.rotateX(Math.PI / 2);
  return shared(g);
})();

function bigEye(r) {
  const e = new T.Group();
  const white = mesh(geo.sphere(r, 20, 14), 0xffffff, { outline: 0.018 });
  white.scale.set(1, 1.12, 0.55);
  const pupil = ink(geo.sphere(r * 0.7, 16, 12));
  pupil.scale.set(1, 1.1, 0.5);
  pupil.position.set(0, -r * 0.08, r * 0.3);
  const hi = new T.Mesh(geo.sphere(r * 0.24, 10, 8), basic(0xffffff));
  hi.position.set(r * 0.22, r * 0.25, r * 0.6);
  const hi2 = new T.Mesh(geo.sphere(r * 0.11, 8, 6), basic(0xffffff));
  hi2.position.set(-r * 0.2, -r * 0.3, r * 0.58);
  e.add(white, pupil, hi, hi2);
  return e;
}

export function makeGull() {
  const g = new T.Group();

  // Plump white body with a grey back (mantle) layered on top.
  const body = mesh(geo.sphere(0.46, 24, 18), WHITE, { outline: 0.03 });
  body.scale.set(1.0, 0.92, 1.15);
  body.position.set(0, 0.66, -0.04);
  const mantle = mesh(geo.sphere(0.44, 22, 16), GREY_DK, { outline: 0 });
  mantle.scale.set(0.97, 0.78, 0.95);
  mantle.position.set(0, 0.1, -0.15);
  body.add(mantle);
  // Tail: grey wedge with a white edge.
  const tail = mesh(geo.sphere(0.2, 16, 10), GREY, { outline: 0.02 });
  tail.scale.set(1.1, 0.35, 1.3);
  tail.position.set(0, 0.62, -0.55);
  tail.rotation.x = -0.35;
  g.add(body, tail);

  // Big round head with huge friendly eyes.
  const R = 0.38;
  const head = mesh(geo.sphere(R, 26, 20), WHITE, { outline: 0.03 });
  head.position.set(0, 1.2, 0.12);
  const zAt = (x, y) => Math.sqrt(Math.max(0.0001, R * R - x * x - y * y));
  for (const sd of [-1, 1]) {
    const x = sd * 0.38 * R, y = 0.12 * R;
    const e = bigEye(0.135);
    e.position.set(x, y, zAt(x, y) - 0.035);
    e.rotation.y = sd * 0.38;
    head.add(e);
    const brow = ink(geo.box(0.12, 0.025, 0.03));
    brow.position.set(sd * 0.38 * R, 0.66 * R, zAt(sd * 0.38 * R, 0.66 * R) - 0.01);
    brow.rotation.set(-0.5, sd * 0.35, sd * 0.08);
    head.add(brow);
    const ch = new T.Mesh(geo.sphere(0.055, 12, 8), toon(C.cheek));
    ch.scale.set(1.2, 0.7, 0.4);
    const cx = sd * 0.62 * R, cy = -0.2 * R;
    ch.position.set(cx, cy, zAt(cx, cy) - 0.005);
    ch.rotation.y = sd * 0.6;
    head.add(ch);
  }
  // Yellow beak with the classic red spot, plus a lower mandible.
  const beak = mesh(BEAK_GEO, BEAK, { outline: 0.014 });
  beak.position.set(0, -0.22 * R, R * 0.8);
  beak.rotation.x = 0.04;
  const lower = mesh(geo.sphere(0.06, 14, 10), BEAK, { outline: 0.012 });
  lower.scale.set(1.1, 0.55, 1.7);
  lower.position.set(0, -0.055, 0.13);
  const spot = new T.Mesh(geo.sphere(0.022, 10, 8), toon(SPOT));
  spot.position.set(0, -0.075, 0.24);
  beak.add(lower, spot);
  // Hooked tip.
  const hook = mesh(geo.sphere(0.04, 12, 8), BEAK, { outline: 0 });
  hook.scale.set(1, 0.9, 1.2);
  hook.scale.set(1, 1, 1.1);
  hook.position.set(0, -0.018, 0.34);
  beak.add(hook);
  head.add(beak);
  // A little cowlick of feathers.
  for (const [x, rz, sc] of [[0, 0, 1], [-0.05, 0.55, 0.75], [0.05, -0.55, 0.75]]) {
    const t = mesh(geo.sphere(0.055, 12, 8), WHITE, { outline: 0.013 });
    t.scale.set(0.7 * sc, 1.6 * sc, 0.7 * sc);
    t.position.set(x, R + 0.035 * sc, -0.06);
    t.rotation.set(-0.45, 0, rz);
    head.add(t);
  }
  g.add(head);

  // Grey wings with dark wingtips and white spots, folded along the sides.
  const wings = [];
  for (const sd of [-1, 1]) {
    const w = mesh(WING, GREY, { outline: 0.02 });
    w.position.set(sd * 0.42, 0.88, 0.04);
    w.rotation.z = 0;
    w.rotateZ(sd * 0.12);
    const tip = mesh(WINGTIP, TIP, { outline: 0 });
    tip.position.x = sd * 0.008;
    const dot = new T.Mesh(geo.sphere(0.03, 8, 6), toon(WHITE));
    dot.position.set(sd * 0.05, -0.42, -0.52);
    w.add(tip, dot);
    g.add(w); wings.push(w);
  }

  // Short orange legs and webbed feet.
  for (const sd of [-1, 1]) {
    const leg = mesh(geo.cyl(0.035, 0.03, 0.3, 10), FEET, { outline: 0.01 });
    leg.position.set(sd * 0.15, 0.18, 0.0);
    const f = mesh(FOOT, FEET, { outline: 0.01 });
    f.position.set(sd * 0.15, 0, 0.02);
    f.rotation.y = sd * 0.2;
    g.add(leg, f);
  }

  g.userData = { head, wings, kind: 'gull' };
  return g;
}
