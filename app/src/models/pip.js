// Pip the chick: narrator and mascot. Contract: userData { head, face, body, wings[2], kind: 'pip' }; feet at y=0, faces +z.
// head: origin at its centre, radius HR (hats are added later at local y ≈ 0.45–0.62).
// wings[i]: pivot groups at the shoulders, animated by rotation.z (rest ≈ ∓0.3).
import * as T from '../three.js';
import { mesh, geo, blobShadow } from '../engine/toon.js';
import { makeFace } from '../engine/faces.js';

const YEL = 0xffd23f, YEL_D = 0xffbd2e, CREAM = 0xffeea0, FLUFF = 0xfff7cf, BEAK = 0xff9a32, BEAK_D = 0xf07a28, FOOT = 0xff9f3f;
const HR = 0.62;

function shared(g) { g.userData.shared = true; return g; }

// Teardrop feather: round base at y=0, pointed tip at y=1, max radius ≈ 0.5.
const FEATHER = shared(new T.LatheGeometry(
  Array.from({ length: 15 }, (_, i) => {
    const t = i / 14;
    return new T.Vector2(Math.max(0.0001, 1.3 * Math.sqrt(t) * Math.pow(1 - t, 1.15)), t);
  }), 16));
// Lens-shaped eye (slightly tall oval, flattened in depth).
const EYE_R = 0.125;
const EYE = shared(new T.SphereGeometry(EYE_R, 24, 16).scale(1, 1.12, 0.55));
const HI_BIG = shared(new T.SphereGeometry(EYE_R * 0.34, 12, 8));
const HI_SMALL = shared(new T.SphereGeometry(EYE_R * 0.16, 8, 6));
// Toe: little capsule.
// Tapered tube along a curve: radius r0 at the base, rounding to a point at the tip.
function taperTube(pts, r0, seg = 20, rad = 12) {
  const curve = new T.CatmullRomCurve3(pts.map((p) => new T.Vector3(...p)));
  const g = new T.TubeGeometry(curve, seg, r0, rad, false);
  const pos = g.attributes.position, v = new T.Vector3();
  for (let i = 0; i <= seg; i++) {
    const t = i / seg, c = curve.getPointAt(t);
    const k = Math.max(0.02, Math.pow(1 - t, 0.7) * (t < 0.15 ? 0.85 + t : 1));
    for (let j = 0; j <= rad; j++) {
      const idx = i * (rad + 1) + j;
      v.fromBufferAttribute(pos, idx).sub(c).multiplyScalar(k).add(c);
      pos.setXYZ(idx, v.x, v.y, v.z);
    }
  }
  g.computeVertexNormals();
  return shared(g);
}
const CURL = taperTube([[0, -0.05, -0.04], [0, 0.14, -0.03], [0, 0.29, 0.04], [0, 0.33, 0.15], [0, 0.26, 0.21], [0, 0.2, 0.16]], 0.1, 28);
const WISP = taperTube([[0, -0.04, 0], [0.02, 0.1, -0.02], [0.08, 0.2, -0.02], [0.16, 0.24, 0.0]], 0.07, 16);
const TOE = shared(new T.CapsuleGeometry(0.045, 0.12, 4, 10));

function feather(color, w, len, outline = 0.016) {
  const f = mesh(FEATHER, color, { outline });
  f.scale.set(w, len, w);
  return f;
}

export function makePip() {
  const g = new T.Group();
  const zOn = (r, x, y) => Math.sqrt(Math.max(0.0001, r * r - x * x - y * y));

  // ---------- body: small round egg; belly + fluffy chest ride on it so they breathe with it ----------
  const BR = 0.6;
  const body = mesh(geo.sphere(BR, 28, 20), YEL, { outline: 0.04 });
  body.position.y = 0.7;
  body.scale.set(1.06, 0.98, 1);
  const belly = mesh(geo.sphere(0.5, 24, 16), CREAM, { outline: 0 });
  belly.scale.set(0.96, 1.08, 0.44);
  belly.position.set(0, -0.02, 0.41);
  body.add(belly);
  // fluffy chest: a soft cloud of cream puffs at the top of the belly, scalloped along the lower edge
  for (const [x, y, r] of [[-0.22, 0.3, 0.13], [0, 0.33, 0.15], [0.22, 0.3, 0.13], [-0.33, 0.16, 0.11], [-0.12, 0.14, 0.13],
    [0.12, 0.14, 0.13], [0.33, 0.16, 0.11]]) {
    const p = mesh(geo.sphere(r, 16, 12), FLUFF, { outline: 0.01 });
    p.scale.set(1.1, 0.9, 0.5);
    const u = x / 0.46, v = (y + 0.02) / 0.52;
    p.position.set(x, y, 0.41 + 0.22 * Math.sqrt(Math.max(0.05, 1 - u * u - v * v)) - 0.01);
    p.rotation.y = Math.asin(x / BR);
    body.add(p);
  }

  // ---------- head ----------
  const head = mesh(geo.sphere(HR, 32, 24), YEL, { outline: 0.035 });
  head.position.y = 1.62;
  // cheek fluffs on the sides of the head
  for (const s of [-1, 1]) {
    for (const [y, a, l] of [[-0.12, 1.9, 0.22], [-0.27, 2.3, 0.18]]) {
      const f = feather(YEL, 0.14, l, 0.014);
      f.position.set(s * 0.54, y, 0.02);
      f.rotation.set(0, 0, -s * a);
      head.add(f);
    }
  }
  // signature tuft: a big curl that sweeps up and flicks forward, with two little side wisps
  const curl = mesh(CURL, YEL, { outline: 0.018 });
  curl.position.set(0, HR - 0.08, 0.04);
  curl.rotation.y = 0.6; // turned a little so the curl reads from the front as well as the side
  head.add(curl);
  for (const s of [-1, 1]) {
    const f = mesh(WISP, YEL, { outline: 0.016 });
    f.position.set(s * 0.1, HR - 0.1, -0.04);
    f.rotation.set(-0.15, 0, -s * 0.55);
    f.scale.x = s;
    head.add(f);
  }
  // back-of-head feather so the side view has a soft curl
  const nape = feather(YEL, 0.15, 0.24, 0.014);
  nape.position.set(0, 0.2, -0.52);
  nape.rotation.x = -2.0;
  head.add(nape);

  // face: standard expressive face, with eyes enlarged and set low
  const face = makeFace(HR, { mouth: false });
  const fp = face.userData;
  for (const e of fp.eyes) {
    const s = e.userData.s, x = s * 0.235, y = 0.03;
    e.geometry = EYE;
    e.position.set(x, y, zOn(HR, x, y) - EYE_R * 0.12);
    e.rotation.set(-Math.asin(y / HR) * 0.8, Math.asin(x / HR) * 0.9, 0);
    const hi = e.children[0];
    hi.geometry = HI_BIG;
    hi.position.set(EYE_R * 0.32, EYE_R * 0.42, EYE_R * 0.42);
    const hi2 = new T.Mesh(HI_SMALL, hi.material);
    hi2.position.set(-EYE_R * 0.34, -EYE_R * 0.42, EYE_R * 0.4);
    e.add(hi2);
  }
  for (const b of fp.brows) {
    const s = b.userData.s;
    b.userData.x = s * 0.25; b.userData.y = 0.2;
    b.position.set(s * 0.25, 0.2, zOn(HR, s * 0.25, 0.3) + 0.005);
    b.scale.set(0.85, 0.9, 1);
    b.rotation.y = s * 0.4;
  }
  for (const t of fp.tears) {
    const s = Math.sign(t.position.x), x = s * 0.29, y = -0.1;
    t.position.set(x, y, zOn(HR, x, y));
    t.userData.y0 = y;
  }
  for (const c of fp.cheeks) {
    const s = Math.sign(c.position.x), x = s * 0.37, y = -0.13;
    c.position.set(x, y, zOn(HR, x, y) - 0.02);
    c.rotation.y = s * 0.6;
    c.scale.multiplyScalar(1.35);
  }
  head.add(face);

  // beak: chunky two-part beak that reads clearly from the front and side
  const upper = mesh(geo.cone(0.13, 0.24, 20), BEAK, { outline: 0.018 });
  upper.rotation.x = Math.PI / 2;
  upper.scale.set(1.15, 1, 0.72);
  upper.position.set(0, -0.1, HR + 0.06);
  const lower = mesh(geo.cone(0.09, 0.14, 16), BEAK_D, { outline: 0.014 });
  lower.rotation.x = Math.PI / 2 + 0.25;
  lower.scale.set(1.1, 1, 0.6);
  lower.position.set(0, -0.17, HR + 0.0);
  head.add(upper, lower);

  // ---------- wings: pivot at the shoulder, wing hangs down from it ----------
  const wings = [];
  for (const s of [-1, 1]) {
    const pivot = new T.Group();
    pivot.position.set(s * 0.58, 0.98, 0.05);
    pivot.rotation.z = s * 0.3;
    const inner = new T.Group();
    inner.rotation.z = -s * 0.22; // cancel most of the rest flare so the wing hugs the body
    pivot.add(inner);
    const w = mesh(geo.sphere(0.3, 22, 16), YEL_D, { outline: 0.026 });
    w.scale.set(0.42, 1, 0.78);
    w.position.set(s * 0.05, -0.24, 0);
    w.rotation.z = -s * 0.15;
    inner.add(w);
    // feathery scalloped tips at the bottom of the wing
    for (const [z, l] of [[0.1, 0.2], [-0.05, 0.24], [-0.18, 0.18]]) {
      const f = feather(YEL_D, 0.13, l, 0.014);
      f.position.set(s * 0.1, -0.42, z);
      f.rotation.set(Math.PI - z * 2, 0, -s * 0.5);
      inner.add(f);
    }
    g.add(pivot);
    wings.push(pivot);

    // ---------- tiny legs + three-toed feet ----------
    const leg = mesh(geo.cyl(0.045, 0.05, 0.16, 10), FOOT, { outline: 0.014 });
    leg.position.set(s * 0.24, 0.1, 0.12);
    g.add(leg);
    const foot = new T.Group();
    foot.position.set(s * 0.25, 0.045, 0.16);
    foot.rotation.y = s * 0.25;
    for (const a of [-0.55, 0, 0.55]) {
      const toe = mesh(TOE, FOOT, { outline: 0.014 });
      toe.position.set(Math.sin(a) * 0.1, 0, Math.cos(a) * 0.1);
      toe.rotation.set(Math.PI / 2, a, 0, 'YXZ'); // lay the capsule flat, then fan it
      foot.add(toe);
    }
    g.add(foot);
  }

  // little tail tuft at the back
  for (const [x, a, l] of [[0, 0, 0.32], [-0.1, 0.45, 0.25], [0.1, -0.45, 0.25]]) {
    const f = feather(YEL_D, 0.16, l, 0.016);
    f.position.set(x, 0.62, -0.55);
    f.rotation.set(-0.9, 0, a);
    g.add(f);
  }

  g.add(body, head, blobShadow(0.85));
  g.userData = { head, face, body, wings, kind: 'pip' };
  return g;
}
