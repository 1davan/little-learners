// Pig. Contract: userData { head, face (from makeFace), body, arms[2], tail, kind: 'pig' }; feet at y=0, faces +z.
import * as T from '../three.js';
import { mesh, geo, ink, blobShadow, toon, basic } from '../engine/toon.js';
import { makeFace } from '../engine/faces.js';

const PINK = 0xffa8bf, BELLY = 0xffd3de, SNOUT = 0xff8fae, INNER = 0xff7fa2, HOOF = 0xb0566f, NOSTRIL = 0x8e3550, CHEEK = 0xff6f96;

function shared(g) { g.userData.shared = true; return g; }

// Rounded puck for the snout disc (lathe around y, turned to face +z when placed).
const SNOUT_GEO = shared((() => {
  const r = 0.24, h = 0.2, e = 0.07, pts = [];
  pts.push(new T.Vector2(0, -h / 2));
  for (let i = 0; i <= 6; i++) { const a = -Math.PI / 2 + (i / 6) * Math.PI / 2; pts.push(new T.Vector2(r - e + Math.cos(a) * e, -h / 2 + e + Math.sin(a) * e)); }
  for (let i = 0; i <= 6; i++) { const a = (i / 6) * Math.PI / 2; pts.push(new T.Vector2(r - e + Math.cos(a) * e, h / 2 - e + Math.sin(a) * e)); }
  // slightly domed front face
  for (let i = 1; i <= 4; i++) { const x = (r - e) * (1 - i / 4); pts.push(new T.Vector2(x, h / 2 + 0.015 * (i / 4))); }
  const g = new T.LatheGeometry(pts, 32);
  g.rotateX(Math.PI / 2); // lathe axis y -> z, front face now at +z
  return g;
})());

// Rounded triangle ear (flat, softly bevelled).
function earGeo(w, hgt, depth, bev) {
  const s = new T.Shape(), r = w * 0.22;
  s.moveTo(-w / 2 + r, 0);
  s.lineTo(w / 2 - r, 0);
  s.quadraticCurveTo(w / 2, 0, w / 2 - r * 0.4, r * 0.9);
  s.lineTo(r * 0.5, hgt - r);
  s.quadraticCurveTo(0, hgt + r * 0.2, -r * 0.5, hgt - r);
  s.lineTo(-w / 2 + r * 0.4, r * 0.9);
  s.quadraticCurveTo(-w / 2, 0, -w / 2 + r, 0);
  const g = new T.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 3, curveSegments: 6 });
  g.translate(0, 0, -depth / 2);
  return shared(g);
}
// Bend everything above yFold forward (toward +z) so the ear tip flops over.
function bend(g, yFold, ang, len) {
  const p = g.attributes.position, v = new T.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const d = v.y - yFold;
    if (d <= 0) continue;
    const t = Math.min(1, d / len), a = ang * t * t * (3 - 2 * t);
    const y = d, z = v.z;
    p.setXYZ(i, v.x, yFold + y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a));
  }
  g.computeVertexNormals();
  return g;
}
const EAR_GEO = bend(earGeo(0.44, 0.52, 0.03, 0.03), 0.25, 1.65, 0.16);
const EAR_IN_GEO = (() => { const g = earGeo(0.27, 0.34, 0.01, 0.015); g.translate(0, 0.06, 0.035); return bend(g, 0.25, 1.65, 0.16); })();

// Curly corkscrew tail.
const TAIL_GEO = shared((() => {
  class Curl extends T.Curve {
    getPoint(t, out = new T.Vector3()) {
      const a = t * Math.PI * 3.2, r = 0.1 * (1 - t * 0.3);
      return out.set(Math.sin(a) * r, Math.cos(a) * r - 0.1 + t * 0.14, -t * 0.22);
    }
  }
  return new T.TubeGeometry(new Curl(), 48, 0.036, 8, false);
})());

export function makePig() {
  const g = new T.Group();

  // ---- body: round pink barrel with a pale belly ----
  const body = mesh(geo.sphere(0.66, 24, 18), PINK, { outline: 0.04 });
  body.position.y = 0.78;
  body.scale.set(1.05, 0.95, 0.95);
  const belly = mesh(geo.sphere(0.46, 20, 14), BELLY, { outline: 0 });
  belly.scale.set(1.05, 1, 0.42);
  belly.rotation.z = Math.PI / 2; // keep sphere poles off the front
  belly.position.set(0, -0.08, 0.49);
  body.add(belly);
  g.add(body);

  // ---- head ----
  const R = 0.72;
  const head = mesh(geo.sphere(R, 28, 20), PINK, { outline: 0.035 });
  head.position.y = 1.78;
  head.scale.set(1.08, 0.94, 1);
  g.add(head);
  const zAt = (x, y) => Math.sqrt(Math.max(0.0001, R * R - x * x - y * y));

  const face = makeFace(R, {});
  head.add(face);
  const p = face.userData;
  // eyes sit up and apart to make room for the big snout
  p.eyes.forEach((e) => {
    const x = e.userData.s * 0.44 * R, y = 0.26 * R, eR = 0.14 * R;
    e.scale.setScalar(1); e.position.set(x, y, zAt(x, y) - eR * 0.35);
  });
  for (const e of p.eyes) e.children[0].scale.setScalar(1.15);
  p.brows.forEach((b) => {
    const x = b.userData.s * 0.44 * R, y = 0.46 * R;
    b.userData.x = x; b.userData.y = y;
    b.position.set(x, y, zAt(x, y));
  });
  p.tears.forEach((t, i) => {
    const s = p.eyes[i].userData.s, x = s * 0.54 * R, y = 0.06 * R;
    t.position.set(x, y, zAt(x, y)); t.userData.y0 = y;
  });
  p.cheeks.forEach((c) => {
    const s = Math.sign(c.position.x), x = s * 0.68 * R, y = -0.1 * R;
    c.material = toon(CHEEK);
    c.position.set(x, y, zAt(x, y) - 0.03 * R);
  });
  for (const k of ['smile', 'frown', 'oh', 'flat']) {
    const m = p[k]; if (!m) continue;
    m.position.y = { smile: -0.34, frown: -0.45, oh: -0.4, flat: -0.42 }[k];
    m.position.z = zAt(0, m.position.y) - ({ oh: -0.01, frown: 0.0 }[k] ?? 0.03);
    if (k === 'smile' || k === 'oh') m.scale.setScalar(0.75);
    if (k === 'frown') { m.position.z = zAt(0, -0.38); m.rotation.x = 0.6; }
  }

  // big snout disc with nostrils
  const sn = mesh(SNOUT_GEO, SNOUT, { outline: 0.022 });
  const sy = -0.12 * R;
  sn.position.set(0, sy, zAt(0, sy) - 0.05);
  sn.scale.set(1.25, 0.95, 1);
  sn.rotation.x = -0.12;
  head.add(sn);
  for (const s of [-1, 1]) {
    const n = new T.Mesh(geo.sphere(0.05, 14, 10), toon(NOSTRIL));
    n.scale.set(0.8, 1.3, 0.45);
    n.position.set(s * 0.085, -0.005, 0.1);
    sn.add(n);
  }
  const shine = new T.Mesh(geo.sphere(0.04, 10, 8), basic(0xffd6e2));
  shine.scale.set(1.5, 0.45, 0.3);
  shine.position.set(-0.07, 0.15, 0.09);
  sn.add(shine);

  // floppy triangle ears flopping forward over the brow
  for (const s of [-1, 1]) {
    const pivot = new T.Group();
    pivot.position.set(s * 0.44, 0.48, 0.0);
    pivot.rotation.set(-0.05, s * 0.35, -s * 0.6);
    const ear = mesh(EAR_GEO, PINK, { outline: 0.02 });
    const inner = mesh(EAR_IN_GEO, INNER, { outline: 0 });
    ear.add(inner);
    pivot.add(ear);
    head.add(pivot);
  }

  // ---- stubby legs with hooves ----
  for (const s of [-1, 1]) {
    const leg = mesh(geo.cyl(0.17, 0.18, 0.26, 20), PINK, { outline: 0.025 });
    leg.position.set(s * 0.32, 0.2, 0.08);
    g.add(leg);
    const hoof = mesh(geo.cyl(0.185, 0.2, 0.12, 20), HOOF, { outline: 0.025 });
    hoof.position.set(s * 0.32, 0.06, 0.08);
    g.add(hoof);
    const notch = ink(geo.box(0.025, 0.1, 0.03));
    notch.position.set(0, 0, 0.19);
    hoof.add(notch);
  }

  // ---- arms (pivot at the shoulder) with little hooves ----
  const arms = [];
  for (const s of [-1, 1]) {
    const arm = new T.Group();
    arm.position.set(s * 0.6, 1.0, 0.12);
    arm.rotation.z = s * 0.45;
    const limb = mesh(geo.sphere(0.15, 16, 12), PINK, { outline: 0.025 });
    limb.scale.set(1, 1.55, 1);
    limb.position.y = -0.16;
    arm.add(limb);
    const hoof = mesh(geo.sphere(0.13, 16, 10), HOOF, { outline: 0.02 });
    hoof.scale.set(1, 0.6, 1);
    hoof.position.y = -0.36;
    arm.add(hoof);
    g.add(arm); arms.push(arm);
  }

  // ---- curly tail ----
  const tail = mesh(TAIL_GEO, PINK, { outline: 0.012 });
  tail.position.set(0, 0.85, -0.6);
  tail.scale.setScalar(1.3);
  g.add(tail);

  g.add(blobShadow(0.95));
  g.userData = { head, face, body, arms, tail, kind: 'pig' };
  return g;
}
