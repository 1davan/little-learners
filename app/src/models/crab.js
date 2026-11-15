// Crab (Where's Crab?, Pattern parade). Contract: userData { body, eyes, claws[2], kind: 'crab' }; sits on y=0, faces +z.
// claws[i] pivots at its shoulder (rotation.z snaps/waves the whole arm + pincer); eyes[i] is an eye-stalk group pivoting at its base.
import * as T from '../three.js';
import { mesh, geo, ink, blobShadow, basic } from '../engine/toon.js';
import { C } from '../engine/faces.js';

function shared(g) { g.userData.shared = true; return g; }
const MOUTH = shared(new T.CircleGeometry(0.15, 24, Math.PI, Math.PI));
const TONGUE = shared(new T.CircleGeometry(0.075, 18, Math.PI, Math.PI));
const CAPS_ARM = shared(new T.CapsuleGeometry(0.085, 0.26, 6, 14));
const LEG_R = 0.068;
const legGeo = new Map(); // capsule per (rounded) body length, so the round caps never get stretched
function capsLeg(len) {
  const k = Math.round(len * 50) / 50;
  if (!legGeo.has(k)) legGeo.set(k, shared(new T.CapsuleGeometry(LEG_R, Math.max(0.01, k), 4, 12)));
  return legGeo.get(k);
}
const CAPS_STALK = shared(new T.CapsuleGeometry(0.055, 0.22, 4, 10));

// Shell ellipsoid: centre (0, SY, 0), radii (RX, RY, RZ).
const SY = 0.56, RX = 0.82, RY = 0.5, RZ = 0.64;
// Point on the shell surface in front (z > 0) at (x, y), pushed out by `out`.
function onShell(x, y, out = 0) {
  const u = x / RX, v = (y - SY) / RY;
  const z = RZ * Math.sqrt(Math.max(0, 1 - u * u - v * v));
  const n = new T.Vector3(x / (RX * RX), (y - SY) / (RY * RY), z / (RZ * RZ)).normalize();
  return { p: new T.Vector3(x, y, z).addScaledVector(n, out), n };
}
// Orient a flat (XY-plane) mesh so it lies on the shell, facing outward.
function stick(m, x, y, out = 0.005) {
  const { p, n } = onShell(x, y, out);
  m.position.copy(p);
  m.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), n);
  return m;
}
// A leg segment capsule spanning a -> b (in the XY plane).
function seg(a, b, color) {
  const d = b.clone().sub(a), len = d.length();
  const m = mesh(capsLeg(len - LEG_R), color, { outline: 0.018 });
  m.position.set((a.x + b.x) / 2, (a.y + b.y) / 2, 0);
  m.rotation.z = Math.atan2(d.y, d.x) - Math.PI / 2;
  return m;
}
const tint = (c, to, k) => new T.Color(c).lerp(new T.Color(to), k).getHex();

export function makeCrab(color = 0xff5a4a) {
  const g = new T.Group();
  const light = tint(color, 0xfff3e0, 0.6);   // belly / underside
  const spot = tint(color, 0xffffff, 0.35);   // shell freckles
  const dark = tint(color, 0x7a1f30, 0.18);   // pincer tips

  // ---- shell + belly ----
  const body = mesh(geo.sphere(1, 36, 24), color, { outline: 0.03 });
  body.scale.set(RX, RY, RZ);
  body.position.y = SY;
  g.add(body);
  const belly = mesh(geo.sphere(1, 32, 18), light, { outline: 0 });
  belly.scale.set(RX * 0.9, RY * 0.62, RZ * 0.92);
  belly.position.set(0, SY - 0.2, 0.05);
  g.add(belly);
  // freckles on the shell top
  for (const [x, y, r] of [[-0.42, 0.92, 0.07], [0.46, 0.9, 0.06], [-0.18, 1.0, 0.045], [0.25, 1.0, 0.05]]) {
    const { p, n } = onShell(x, y, -0.01);
    const d = mesh(geo.sphere(r, 14, 10), spot, { outline: 0 });
    d.scale.set(1, 1, 0.35);
    d.position.copy(p);
    d.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), n);
    g.add(d);
  }

  // ---- face on the shell front ----
  const mouth = stick(new T.Mesh(MOUTH, basic(0x3a2838)), 0, 0.54);
  const tongue = new T.Mesh(TONGUE, basic(0xff7f96));
  tongue.position.set(0, -0.07, 0.003);
  mouth.add(tongue);
  g.add(mouth);
  for (const s of [-1, 1]) {
    const ch = mesh(geo.sphere(0.1, 16, 10), C.cheek, { outline: 0 });
    stick(ch, s * 0.36, 0.58, -0.02);
    ch.scale.set(1.25, 0.8, 0.3);
    g.add(ch);
  }

  // ---- googly eyes on stalks (eyes[i] pivots at the stalk base) ----
  const eyes = [];
  for (const s of [-1, 1]) {
    const e = new T.Group();
    e.position.set(s * 0.24, 0.92, 0.28);
    e.rotation.z = -s * 0.18;
    e.rotation.x = 0.12;
    const stalk = mesh(CAPS_STALK, color, { outline: 0.02 });
    stalk.position.y = 0.17;
    const ball = mesh(geo.sphere(0.2, 28, 20), 0xffffff, { outline: 0.025 });
    ball.position.y = 0.44;
    const pupil = ink(geo.sphere(0.115, 20, 14));
    pupil.scale.set(1, 1.1, 0.6);
    pupil.position.set(-s * 0.025, -0.01, 0.15);
    const hi = mesh(geo.sphere(0.04, 12, 8), 0xffffff, { outline: 0 });
    hi.position.set(0.035, 0.05, 0.07);
    const hi2 = mesh(geo.sphere(0.018, 8, 6), 0xffffff, { outline: 0 });
    hi2.position.set(-0.04, -0.045, 0.07);
    pupil.add(hi, hi2);
    ball.add(pupil);
    e.add(stalk, ball);
    g.add(e); eyes.push(e);
  }

  // ---- chunky pincers (claws[i] pivots at the shoulder) ----
  const claws = [];
  for (const s of [-1, 1]) {
    const c = new T.Group();
    c.position.set(s * 0.66, 0.48, 0.22);
    const arm = mesh(CAPS_ARM, color, { outline: 0.022 });
    arm.rotation.z = -s * 0.85;           // points up and out
    arm.position.set(s * 0.17, 0.15, 0);
    const hand = new T.Group();           // the pincer, opening upward
    hand.position.set(s * 0.34, 0.36, 0.02);
    hand.rotation.z = -s * 0.25;
    const palm = mesh(geo.sphere(0.24, 28, 20), color, { outline: 0.03 });
    palm.scale.set(0.95, 0.9, 0.72);
    // big outer finger and smaller inner finger, a clear V-notch between
    const outer = mesh(geo.sphere(0.13, 22, 16), color, { outline: 0.025 });
    outer.scale.set(1, 1.9, 0.85);
    outer.position.set(s * 0.1, 0.27, 0);
    outer.rotation.z = -s * 0.22;
    const inner = mesh(geo.sphere(0.1, 20, 14), color, { outline: 0.022 });
    inner.scale.set(1, 1.7, 0.85);
    inner.position.set(-s * 0.13, 0.2, 0);
    inner.rotation.z = s * 0.55;
    const tipO = mesh(geo.sphere(0.075, 12, 8), dark, { outline: 0 });
    tipO.scale.set(1, 0.7, 1);
    tipO.position.set(0, 0.092, 0.012);
    outer.add(tipO);
    const tipI = mesh(geo.sphere(0.06, 12, 8), dark, { outline: 0 });
    tipI.scale.set(1, 0.7, 1);
    tipI.position.set(0, 0.072, 0.01);
    inner.add(tipI);
    hand.add(palm, outer, inner);
    c.add(arm, hand);
    g.add(c); claws.push(c);
  }

  // ---- 3 little bent legs per side (knee up, toe on the ground) ----
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
    const leg = new T.Group();
    leg.position.set(s * (0.6 - i * 0.04), 0.27, 0.16 - i * 0.2);
    leg.rotation.y = s * (-0.5 + i * 0.45);
    const r = 1 + i * 0.12;                         // back legs reach a bit further out
    const K = new T.Vector2(s * 0.2 * r, 0.06), F = new T.Vector2(s * 0.3 * r, -0.2);
    leg.add(seg(new T.Vector2(0, 0), K, color), seg(K, F, color));
    g.add(leg);
  }

  g.add(blobShadow(0.95));
  g.userData = { body, eyes, claws, kind: 'crab' };
  return g;
}
