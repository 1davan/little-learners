// Frog. Contract: userData { head, face (from makeFace, for emotions), body, arms[2], kind: 'frog' }; feet at y=0, faces +z, ~2.4 units tall.
// Also publishes userData.anchors (body-part spots for Splash wash).
import * as T from '../three.js';
import { mesh, geo, ink, blobShadow, toon, basic } from '../engine/toon.js';
import { C, makeFace } from '../engine/faces.js';

const COL = {
  skin: 0x72d65c, dark: 0x3e9f4c, belly: 0xeaf8c6, pad: 0xa6e67e, eye: 0xfffdf4, mouth: 0x3a2838,
  tongue: 0xff7f9e, ear: 0x5cc254,
};

// ---------- head shape (ellipsoid) ----------
const HR = 0.68;
const HS = [1.3, 0.84, 1.05]; // head scale
const HA = HR * HS[0], HB = HR * HS[1], HC = HR * HS[2];
const surfZ = (x, y, lift = 0) => HC * Math.sqrt(Math.max(0.0001, 1 - (x / HA) ** 2 - (y / HB) ** 2)) + lift;

function shared(g) { g.userData.shared = true; return g; }

// A tube that hugs the front of the head along y = f(x); centred on its own mid-height so setFace's scale.y squash stays put.
function mouthTube(halfW, f, r, lift = 0.012) {
  const pts = [];
  const n = 24;
  let ys = 0;
  for (let i = 0; i <= n; i++) { const x = -halfW + (2 * halfW * i) / n; ys += f(x); }
  const yc = ys / (n + 1);
  for (let i = 0; i <= n; i++) {
    const x = -halfW + (2 * halfW * i) / n, y = f(x);
    pts.push(new T.Vector3(x, y - yc, surfZ(x, y, lift)));
  }
  const g = new T.TubeGeometry(new T.CatmullRomCurve3(pts), 40, r, 8, false);
  // round caps
  return { g: shared(g), yc };
}
const SMILE_W = 0.5;
const SMILE = mouthTube(SMILE_W, (x) => -0.14 - 0.13 * (1 - (x / SMILE_W) ** 2), 0.034);
const FROWN = mouthTube(0.3, (x) => -0.28 + 0.09 * (1 - (x / 0.3) ** 2), 0.034);
const FLAT = mouthTube(0.26, () => -0.22, 0.032);
const CAP = shared(new T.SphereGeometry(0.038, 10, 8));

// Smooth normals for non-indexed extruded shapes (so the toon shading is soft and the outline has no cracks).
function smoothNormals(g) {
  const pos = g.attributes.position, nor = g.attributes.normal;
  const map = new Map(), key = (i) => `${pos.getX(i).toFixed(4)},${pos.getY(i).toFixed(4)},${pos.getZ(i).toFixed(4)}`;
  for (let i = 0; i < pos.count; i++) {
    const k = key(i); const v = map.get(k) || [0, 0, 0];
    v[0] += nor.getX(i); v[1] += nor.getY(i); v[2] += nor.getZ(i); map.set(k, v);
  }
  for (let i = 0; i < pos.count; i++) {
    const v = map.get(key(i)); const l = Math.hypot(...v) || 1;
    nor.setXYZ(i, v[0] / l, v[1] / l, v[2] / l);
  }
  return g;
}

// Webbed foot: a fan of three toes joined by scalloped webbing, lying in XZ with toes toward +z, heel at the origin.
function webShape(L, spread, w) {
  const s = new T.Shape();
  const ang = [-spread, 0, spread];
  const tips = ang.map((a) => new T.Vector2(Math.sin(a) * L, Math.cos(a) * L));
  const perp = ang.map((a) => new T.Vector2(Math.cos(a), -Math.sin(a)));
  const dir = ang.map((a) => new T.Vector2(Math.sin(a), Math.cos(a)));
  const P = (v) => [v.x, v.y];
  s.moveTo(-0.11, -0.02);
  for (let i = 0; i < 3; i++) {
    const l = tips[i].clone().addScaledVector(perp[i], -w);
    const r = tips[i].clone().addScaledVector(perp[i], w);
    const c = tips[i].clone().addScaledVector(dir[i], w * 1.3);
    if (i === 0) s.lineTo(...P(l.clone().addScaledVector(dir[i], -L * 0.25)));
    s.quadraticCurveTo(...P(l), ...P(l));
    s.bezierCurveTo(...P(l.clone().addScaledVector(dir[i], w * 1.2)), ...P(r.clone().addScaledVector(dir[i], w * 1.2)), ...P(r));
    if (i < 2) {
      const nl = tips[i + 1].clone().addScaledVector(perp[i + 1], -w);
      const mid = tips[i].clone().add(tips[i + 1]).multiplyScalar(0.5 * 0.62);
      s.quadraticCurveTo(...P(mid), ...P(nl));
    } else {
      s.lineTo(...P(r.clone().addScaledVector(dir[i], -L * 0.25)));
    }
  }
  s.lineTo(0.11, -0.02);
  s.quadraticCurveTo(0, -0.12, -0.11, -0.02);
  const g = new T.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 3, curveSegments: 10 });
  g.translate(0, 0, -0.02);
  g.rotateX(Math.PI / 2); // shape +y -> +z, thickness along y
  smoothNormals(g);
  return { g: shared(g), tips: tips.map((t) => new T.Vector3(t.x, 0, t.y)) };
}
const FOOT = webShape(0.36, 0.62, 0.055);
const HAND = webShape(0.24, 0.62, 0.04);

const ARM = shared(new T.CapsuleGeometry(0.12, 0.26, 6, 14).translate(0, -0.2, 0));

// put a flattened blob on an ellipsoid surface (a, b, c radii), facing out along the normal
function onEllipsoid(o, a, b, c, dx, dy, dz, sink = 0) {
  const l = Math.hypot(dx, dy, dz); dx /= l; dy /= l; dz /= l;
  const p = new T.Vector3(a * dx, b * dy, c * dz);
  const n = new T.Vector3(p.x / (a * a), p.y / (b * b), p.z / (c * c)).normalize();
  o.position.copy(p).addScaledVector(n, -sink);
  o.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), n);
  return o;
}

export function makeFrog() {
  const g = new T.Group();

  // ----- body -----
  const BR = 0.7, BS = [1.08, 0.98, 0.92];
  const body = mesh(geo.sphere(BR, 28, 20), COL.skin, { outline: 0.035 });
  body.position.y = 0.7;
  body.scale.set(...BS);
  g.add(body);
  const belly = mesh(geo.sphere(0.56, 24, 16), COL.belly, { outline: 0 });
  belly.scale.set(1, 1.0, 0.45);
  belly.position.set(0, -0.02, 0.45);
  body.add(belly);
  // back spots
  for (const [dx, dy, dz, r] of [[0.55, 0.45, -0.5, 0.12], [-0.6, 0.2, -0.55, 0.14], [0.1, 0.65, -0.7, 0.1], [-0.2, -0.05, -1, 0.13], [0.85, -0.1, 0.25, 0.08], [-0.86, 0.35, 0.2, 0.085], [0.7, 0.55, 0.3, 0.06]]) {
    const sp = new T.Mesh(geo.sphere(r, 14, 10), toon(COL.dark));
    sp.scale.set(1, 1, 0.3);
    body.add(onEllipsoid(sp, BR, BR, BR, dx, dy, dz, 0.01));
  }

  // ----- haunches (folded back legs) -----
  for (const s of [-1, 1]) {
    const thigh = mesh(geo.sphere(0.36, 22, 16), COL.skin, { outline: 0.03 });
    thigh.scale.set(0.78, 0.68, 1.12);
    thigh.position.set(s * 0.6, 0.3, -0.02);
    thigh.rotation.y = s * 0.35;
    const ts = new T.Mesh(geo.sphere(0.085, 12, 8), toon(COL.dark));
    ts.scale.set(1, 1, 0.3);
    thigh.add(onEllipsoid(ts, 0.36, 0.36, 0.36, s * 0.8, 0.6, -0.1, 0.01));
    g.add(thigh);
    // webbed feet, splayed forward/out
    const foot = mesh(FOOT.g, COL.skin, { outline: 0.022 });
    foot.position.set(s * 0.5, 0.045, 0.3);
    foot.rotation.y = s * 0.45;
    for (const t of FOOT.tips) {
      const pad = mesh(geo.sphere(0.07, 14, 10), COL.pad, { outline: 0.018 });
      pad.scale.set(1, 0.7, 1);
      pad.position.copy(t).setY(0.02);
      foot.add(pad);
    }
    g.add(foot);
  }

  // ----- arms (pivot at the shoulder) -----
  const arms = [];
  for (const s of [-1, 1]) {
    const arm = mesh(ARM, COL.skin, { outline: 0.028 });
    arm.position.set(s * 0.6, 1.0, 0.24);
    arm.rotation.z = s * 0.42;
    arm.rotation.x = -0.1;
    const hand = mesh(HAND.g, COL.skin, { outline: 0.018 });
    hand.position.set(0, -0.36, 0.05);
    hand.rotation.set(1.15, 0, -s * 0.3);
    arm.add(hand);
    g.add(arm); arms.push(arm);
  }

  // ----- head -----
  const head = new T.Group();
  head.position.y = 1.58;
  g.add(head);
  const skull = mesh(geo.sphere(HR, 32, 24), COL.skin, { outline: 0.035 });
  skull.scale.set(...HS);
  head.add(skull);
  // head spots
  for (const [dx, dy, dz, r] of [[0.0, 0.8, 0.1, 0.085], [0.3, 0.55, -0.75, 0.1], [-0.45, 0.6, -0.6, 0.085], [0.75, 0.2, -0.45, 0.075], [0.82, 0.35, 0.35, 0.06], [-0.84, 0.3, 0.3, 0.07]]) {
    const sp = new T.Mesh(geo.sphere(r, 14, 10), toon(COL.dark));
    sp.scale.set(1, 1, 0.3);
    head.add(onEllipsoid(sp, HA, HB, HC, dx, dy, dz, 0.01));
  }
  // ear drums (tympanum) on the sides
  const ears = [];
  for (const s of [-1, 1]) {
    const ear = new T.Mesh(geo.sphere(0.1, 16, 10), toon(COL.ear));
    ear.scale.set(1, 1, 0.25);
    head.add(onEllipsoid(ear, HA, HB, HC, s * 0.9, 0.12, -0.25, 0.008));
    ears.push(ear);
  }
  // nostrils
  for (const s of [-1, 1]) {
    const n = ink(geo.sphere(0.022, 8, 6));
    n.scale.set(1.3, 0.8, 0.6);
    n.position.set(s * 0.085, 0.05, surfZ(s * 0.085, 0.05, -0.004));
    head.add(n);
  }

  // big bulging eyes on top
  const EX = 0.38, EY = 0.42, EZ = 0.18;
  const sockets = [];
  for (const s of [-1, 1]) {
    const bulb = mesh(geo.sphere(0.3, 28, 20), COL.skin, { outline: 0.032 });
    bulb.position.set(s * EX, EY, EZ);
    const white = mesh(geo.sphere(0.235, 28, 20), COL.eye, { outline: 0.016 });
    white.position.set(0, 0.03, 0.12);
    bulb.add(white);
    head.add(bulb);
    sockets.push(bulb);
  }

  // ----- face (expressions) -----
  const face = makeFace(HR, { noseColor: null });
  head.add(face);
  const p = face.userData;
  const PUP = 0.13;
  const pupGeo = geo.sphere(PUP, 22, 16), hiGeo = geo.sphere(PUP * 0.36, 12, 8), hi2Geo = geo.sphere(PUP * 0.16, 8, 6);
  for (const e of p.eyes) {
    const s = e.userData.s;
    e.geometry = pupGeo;
    e.position.set(s * (EX - 0.025), EY + 0.02, EZ + 0.12 + 0.235 - PUP * 0.55);
    const hi = e.children[0];
    hi.geometry = hiGeo;
    hi.position.set(PUP * 0.32, PUP * 0.38, PUP * 0.72);
    const hi2 = new T.Mesh(hi2Geo, basic(0xffffff));
    hi2.position.set(-PUP * 0.35, -PUP * 0.4, PUP * 0.85);
    e.add(hi2);
  }
  for (const b of p.brows) {
    const s = b.userData.s;
    b.geometry = geo.box(0.26, 0.055, 0.05);
    b.userData.x = s * EX;
    b.userData.y = EY + 0.2;
    b.position.set(s * EX, b.userData.y, EZ + 0.29);
  }
  for (const t of p.tears) {
    const x = t.position.x > 0 ? 0.47 : -0.47, y = 0.12;
    t.geometry = geo.sphere(0.06, 12, 10);
    t.position.set(x, y, surfZ(x, y, 0.02));
    t.userData.y0 = y;
  }
  for (const c of p.cheeks) {
    const s = Math.sign(c.position.x);
    const x = s * 0.64, y = -0.05;
    c.geometry = geo.sphere(0.11, 16, 10);
    c.scale.set(1.25, 0.7, 0.35);
    c.position.set(x, y, surfZ(x, y, -0.015));
    c.lookAt(new T.Vector3(x / (HA * HA), y / (HB * HB), surfZ(x, y) / (HC * HC)).normalize().add(c.position));
  }
  // wide smile with little round corners
  const fit = (m, M) => { m.geometry = M.g; m.rotation.set(0, 0, 0); m.position.set(0, M.yc, 0); m.scale.set(1, 1, 1); };
  fit(p.smile, SMILE); fit(p.frown, FROWN); fit(p.flat, FLAT);
  for (const s of [-1, 1]) {
    const y = -0.14 - SMILE.yc;
    const cap = ink(CAP); cap.position.set(s * SMILE_W, y, surfZ(s * SMILE_W, -0.14, 0.012)); p.smile.add(cap);
  }
  p.oh.geometry = geo.torus(0.07, 0.03, Math.PI * 2, 8, 20);
  p.oh.position.set(0, -0.24, surfZ(0, -0.24, 0.01));
  p.oh.rotation.set(0, 0, 0);
  const ohIn = new T.Mesh(geo.circle(0.07, 20), toon(0x8a3a5a));
  ohIn.position.z = -0.01; p.oh.add(ohIn);

  g.add(blobShadow(1.0));

  // body-part anchor points (model space, scale 1)
  g.updateMatrixWorld(true);
  const wp = (o, off = [0, 0, 0]) => o.localToWorld(new T.Vector3(...off)).toArray();
  const anchors = {
    nose: [0, 1.58 + 0.05, surfZ(0, 0.05) + 0.02],
    eyeL: wp(sockets[0], [0, 0.03, 0.36]), eyeR: wp(sockets[1], [0, 0.03, 0.36]),
    mouth: [0, 1.58 - 0.24, surfZ(0, -0.24) + 0.02],
    tummy: wp(belly, [0, 0, 0.56]),
    handL: wp(arms[0], [0, -0.42, 0.08]), handR: wp(arms[1], [0, -0.42, 0.08]),
    earL: wp(ears[0]), earR: wp(ears[1]),
  };
  const feet = g.children.filter((o) => o.geometry === FOOT.g);
  anchors.footL = wp(feet[0], [0, 0.06, 0.2]); anchors.footR = wp(feet[1], [0, 0.06, 0.2]);

  g.userData = { head, face, body, arms, kind: 'frog', anchors };
  return g;
}
