// Beach-world props built from primitives: crab, bucket, beach ball, shell, sponge, duck, bubbles.
import * as T from '../three.js';
import { mesh, geo, ink, basic, blobShadow, toon } from './toon.js';
import { C, makeFace } from './actors.js';

export function makeCrab(color = 0xff5a4a) {
  const g = new T.Group();
  const body = mesh(geo.sphere(0.7, 20, 14), color, { outline: 0.035 });
  body.scale.set(1.25, 0.7, 0.95);
  body.position.y = 0.55;
  g.add(body);
  // eyes on stalks
  const eyes = [];
  for (const s of [-1, 1]) {
    const stalk = mesh(geo.cyl(0.05, 0.06, 0.45, 8), color, { outline: 0.015 });
    stalk.position.set(s * 0.28, 1.05, 0.35);
    const eye = mesh(geo.sphere(0.17, 12, 10), 0xffffff, { outline: 0.02 });
    eye.position.set(s * 0.28, 1.32, 0.38);
    const pupil = ink(geo.sphere(0.085, 10, 8));
    pupil.position.set(0, 0, 0.12);
    eye.add(pupil);
    g.add(stalk, eye); eyes.push(eye);
  }
  const smile = ink(geo.torus(0.18, 0.04, Math.PI, 6, 16));
  smile.rotation.z = Math.PI;
  smile.position.set(0, 0.62, 0.66);
  g.add(smile);
  // claws
  const claws = [];
  for (const s of [-1, 1]) {
    const arm = mesh(geo.cyl(0.07, 0.08, 0.5, 8), color, { outline: 0.015 });
    arm.position.set(s * 0.95, 0.65, 0.2);
    arm.rotation.z = s * 0.9;
    const claw = new T.Group();
    const top = mesh(geo.sphere(0.25, 12, 8), color, { outline: 0.02 });
    top.scale.set(1, 0.6, 0.7);
    top.position.y = 0.08;
    const bot = mesh(geo.sphere(0.2, 12, 8), color, { outline: 0.02 });
    bot.scale.set(1, 0.5, 0.7);
    bot.position.y = -0.1;
    claw.add(top, bot);
    claw.position.set(s * 1.2, 0.95, 0.25);
    g.add(arm, claw); claws.push(claw);
  }
  // legs
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
    const leg = mesh(geo.cyl(0.04, 0.05, 0.5, 6), color, { outline: 0.012 });
    leg.position.set(s * (0.6 + i * 0.12), 0.22, -0.15 + i * 0.18);
    leg.rotation.z = s * 1.0;
    g.add(leg);
  }
  g.add(blobShadow(0.9));
  g.userData = { body, eyes, claws, kind: 'crab' };
  return g;
}

export function makeBucket(color = 0x4a90ff, r = 1.0, h = 1.3) {
  const g = new T.Group();
  const outer = mesh(geo.cyl(r, r * 0.8, h, 28, true), color, { outline: 0.03 });
  outer.material = new T.MeshToonMaterial({ color, gradientMap: outer.material.gradientMap, side: T.DoubleSide });
  outer.position.y = h / 2;
  const bottom = new T.Mesh(geo.circle(r * 0.8, 28), toon(color));
  bottom.rotation.x = -Math.PI / 2;
  bottom.position.y = 0.03;
  const inside = new T.Mesh(geo.cyl(r * 0.96, r * 0.77, h * 0.98, 28, true), new T.MeshBasicMaterial({ color: new T.Color(color).multiplyScalar(0.55), side: T.BackSide }));
  inside.position.y = h / 2 + 0.01;
  const rim = mesh(geo.torus(r, 0.08, Math.PI * 2, 8, 32), new T.Color(color).offsetHSL(0, 0, 0.12).getHex(), { outline: 0.02 });
  rim.rotation.x = Math.PI / 2;
  rim.position.y = h;
  const handle = mesh(geo.torus(r * 0.95, 0.04, Math.PI, 6, 24), 0xffd23f, { outline: 0.012 });
  handle.position.y = h;
  handle.rotation.y = 0.25;
  g.add(outer, bottom, inside, rim, handle, blobShadow(r * 1.05));
  g.userData = { r, h, kind: 'bucket' };
  return g;
}

export function makeBeachBall(r = 0.5, cols = [C.red, C.yellow, C.blue]) {
  const g = new T.Group();
  const segs = 6;
  for (let i = 0; i < segs; i++) {
    const m = mesh(new T.SphereGeometry(r, 8, 14, (i / segs) * Math.PI * 2, (Math.PI * 2) / segs), i % 2 ? 0xffffff : cols[Math.floor(i / 2) % cols.length], { outline: 0 });
    g.add(m);
  }
  const ol = mesh(geo.sphere(r, 20, 14), 0xffffff, { outline: 0.03 });
  ol.material = new T.MeshBasicMaterial({ visible: false });
  g.add(ol);
  const cap = mesh(geo.sphere(r * 0.18, 10, 8), 0xffffff, { outline: 0.01 });
  cap.position.y = r * 0.97;
  g.add(cap);
  g.rotation.x = 0.4;
  return g;
}

export function makeShell(color = 0xffb6c9, s = 1) {
  const g = new T.Group();
  const base = mesh(geo.sphere(0.45, 16, 10), color, { outline: 0.025 });
  base.scale.set(1, 0.42, 0.85);
  g.add(base);
  for (let i = -2; i <= 2; i++) {
    const rib = new T.Mesh(geo.box(0.04, 0.05, 0.7), basic(new T.Color(color).multiplyScalar(0.75).getHex()));
    rib.position.set(i * 0.15, 0.17, 0);
    rib.rotation.y = i * 0.25;
    g.add(rib);
  }
  g.scale.setScalar(s);
  return g;
}

export function makeSponge() {
  const g = new T.Group();
  const s = mesh(geo.box(1.1, 0.55, 0.75), 0xffe066, { hull: 1.06 });
  const top = mesh(geo.box(1.1, 0.16, 0.75), 0x6fd08c, { hull: 1.06 });
  top.position.y = 0.36;
  g.add(s, top);
  for (let i = 0; i < 6; i++) {
    const h = new T.Mesh(geo.sphere(0.06, 6, 4), basic(0xd9b640));
    h.position.set(-0.4 + (i % 3) * 0.4, -0.1 + Math.floor(i / 3) * 0.2, 0.38);
    g.add(h);
  }
  return g;
}

export function makeDuck(s = 1) {
  const g = new T.Group();
  const body = mesh(geo.sphere(0.5, 16, 12), C.yellow, { outline: 0.03 });
  body.scale.set(1.2, 0.8, 0.9);
  body.position.y = 0.4;
  const head = mesh(geo.sphere(0.32, 14, 10), C.yellow, { outline: 0.025 });
  head.position.set(0.3, 0.9, 0);
  const beak = mesh(geo.sphere(0.14, 10, 8), C.orange, { outline: 0.015 });
  beak.scale.set(1.4, 0.5, 1);
  beak.position.set(0.6, 0.85, 0);
  const eye = ink(geo.sphere(0.05, 8, 6));
  eye.position.set(0.42, 1.0, 0.25);
  g.add(body, head, beak, eye);
  g.scale.setScalar(s);
  g.userData = { body, head, kind: 'duck', baseScale: s };
  return g;
}

const bubbleMat = new T.MeshToonMaterial({ color: 0xdff6ff, transparent: true, opacity: 0.75 });
bubbleMat.userData.shared = true;
export function makeBubble(r = 0.2) {
  const b = new T.Mesh(geo.sphere(r, 12, 10), bubbleMat);
  const hi = new T.Mesh(geo.sphere(r * 0.25, 6, 4), basic(0xffffff));
  hi.position.set(-r * 0.4, r * 0.4, r * 0.8);
  b.add(hi);
  return b;
}

export { makeFace };

export function makeGull() {
  const g = new T.Group();
  const body = mesh(geo.sphere(0.5, 16, 12), 0xffffff, { outline: 0.03 });
  body.scale.set(1.3, 0.85, 0.9);
  body.position.y = 0.6;
  const head = mesh(geo.sphere(0.32, 14, 10), 0xffffff, { outline: 0.025 });
  head.position.set(0, 1.15, 0.2);
  const beak = mesh(geo.cone(0.09, 0.35, 8), C.orange, { outline: 0.012 });
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, 1.1, 0.55);
  for (const s of [-1, 1]) {
    const e = ink(geo.sphere(0.055, 8, 6));
    e.position.set(s * 0.15, 1.22, 0.45);
    head.parent; g.add(e);
  }
  const wings = [];
  for (const s of [-1, 1]) {
    const w = mesh(geo.sphere(0.4, 12, 8), 0xa4abbd, { outline: 0.02 });
    w.scale.set(1.3, 0.2, 0.6);
    w.position.set(s * 0.65, 0.75, -0.05);
    g.add(w); wings.push(w);
  }
  for (const s of [-1, 1]) {
    const leg = mesh(geo.cyl(0.03, 0.03, 0.3, 6), C.orange, { outline: 0 });
    leg.position.set(s * 0.15, 0.15, 0);
    g.add(leg);
  }
  g.add(body, head, beak);
  g.userData = { head, wings, kind: 'gull' };
  return g;
}

// Named body-part anchors on an animal from makeAnimal() (group-local, scale 1). Used by "Pip's nose" and "Splash wash".
const EARS = { bear: [0.5, 2.3, -0.05], bunny: [0.28, 2.75, -0.05], cat: [0.4, 2.42, 0], frog: [0.25, 2.28, 0.38] };
export function partAnchors(animal) {
  const kind = animal.userData.kind;
  const P = {
    nose: [0, 1.76, 0.68], eyeL: [-0.245, 1.88, 0.63], eyeR: [0.245, 1.88, 0.63], mouth: [0, 1.6, 0.65], tummy: [0, 0.8, 0.72],
    handL: [-0.75, 0.85, 0.3], handR: [0.75, 0.85, 0.3], footL: [-0.35, 0.12, 0.42], footR: [0.35, 0.12, 0.42],
  };
  const e = EARS[kind] || EARS.bear;
  P.earL = [-e[0], e[1], e[2] + 0.15]; P.earR = [e[0], e[1], e[2] + 0.15];
  const out = {};
  for (const [k, v] of Object.entries(P)) { const o = new T.Object3D(); o.position.set(...v); animal.add(o); out[k] = o; }
  return out;
}
