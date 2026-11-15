// Beach-world props built from primitives: crab, bucket, beach ball, shell, sponge, duck, bubbles.
import * as T from '../three.js';
import { mesh, geo, ink, basic, blobShadow, toon } from './toon.js';
import { C, makeFace } from './faces.js';
import { makeCrab } from '../models/crab.js';
import { makeDuck } from '../models/duck.js';
import { makeGull } from '../models/gull.js';
export { makeCrab, makeDuck, makeGull };

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

const EARS = { bear: [0.5, 2.3, -0.05], bunny: [0.28, 2.75, -0.05], cat: [0.4, 2.42, 0], frog: [0.25, 2.28, 0.38] };
export function partAnchors(animal) {
  const kind = animal.userData.kind;
  const P = {
    nose: [0, 1.76, 0.68], eyeL: [-0.245, 1.88, 0.63], eyeR: [0.245, 1.88, 0.63], mouth: [0, 1.6, 0.65], tummy: [0, 0.8, 0.72],
    handL: [-0.75, 0.85, 0.3], handR: [0.75, 0.85, 0.3], footL: [-0.35, 0.12, 0.42], footR: [0.35, 0.12, 0.42],
  };
  const e = EARS[kind] || EARS.bear;
  P.earL = [-e[0], e[1], e[2] + 0.15]; P.earR = [e[0], e[1], e[2] + 0.15];
  // a model can publish its own anchor points (scale-1, model space): userData.anchors = { nose: [x,y,z], ... }
  Object.assign(P, animal.userData.anchors || {});
  const out = {};
  for (const [k, v] of Object.entries(P)) { const o = new T.Object3D(); o.position.set(...v); animal.add(o); out[k] = o; }
  return out;
}
