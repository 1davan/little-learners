// Beach-world props: crab, duck, gull, bucket, beach ball, shell, starfish, coin, snacks, sponge, bubbles.
// The props are Blender models (tools/blender/creatures/prop_*.py); each builder keeps its old code model as a fallback.
import * as T from '../three.js';
import { mesh, geo, ink, basic, blobShadow, toon, toonUnique } from './toon.js';
import { C, makeFace } from './faces.js';
import { makeCrab as crabCode } from '../models/crab.js';
import { makeDuck as duckCode } from '../models/duck.js';
import { makeGull as gullCode } from '../models/gull.js';
import { orCreature } from './creature.js';
import { propModel } from './prop-models.js';
export const makeCrab = orCreature('crab', crabCode);
export const makeDuck = orCreature('duck', duckCode);
export const makeGull = orCreature('gull', gullCode);

export function makeBucket(color = 0x4a90ff, r = 1.0, h = 1.3) {
  const pm = propModel('prop_bucket', { tint: color, size: [r, h / 1.3, r] });
  if (pm) { pm.add(blobShadow(r * 1.05)); Object.assign(pm.userData, { r, h, kind: 'bucket' }); return pm; }
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

// ---- Blender-built beach bits (tools/blender/creatures/prop_*.py). Each builder falls back to its old code model. ----

// recolour one named layer of a Blender prop (layers are separate meshes on the model: g1, white, scrub...)
export function layerColor(w, name, color) {
  const l = w?.userData?.model?.userData?.layers?.[name];
  if (l) l.mesh.material = toon(color, { vertexColors: true });
  return !!l;
}
// the tinted main skin of a Blender prop (argMode 'tint'); safe to change later (e.g. a sponge getting wet)
export function skinColor(w, color) {
  const sk = w?.userData?.model?.userData?.skin;
  if (sk) sk.material.color.setHex(color);
}

// Beach ball, radius r, centred on its middle; cols = the three coloured gores.
export function makeBeachBall(r = 0.5, cols = [C.red, C.yellow, C.blue]) {
  const pm = propModel('prop_beachball', { size: r });
  if (pm) {
    cols.forEach((c, i) => layerColor(pm, 'g' + (i + 1), c));
    pm.rotation.x = 0.4;
    pm.userData.kind = 'ball';
    return pm;
  }
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

// Scallop shell lying flat (convex side up, hinge toward the camera), about 0.9*s wide, centred on the origin.
export function makeShell(color = 0xffb6c9, s = 1) {
  const pm = propModel('prop_seashell', { tint: color, size: 0.53 });
  if (pm) {
    const g = new T.Group();
    pm.rotation.x = -Math.PI / 2;
    pm.position.y = -0.04;
    g.add(pm);
    g.scale.setScalar(s);
    g.userData.kind = 'shell';
    return g;
  }
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

// Chunky starfish with a little face, standing upright facing +z, arm tips at radius r, centred on its middle.
export function makeSeaStar(col = 0xff8a5c, r = 0.35) {
  const pm = propModel('prop_seastar', { tint: col, size: r });
  if (pm) { pm.userData.kind = 'star'; return pm; }
  const sh = new T.Shape();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    i ? sh.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : sh.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  sh.closePath();
  const g = new T.ExtrudeGeometry(sh, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 1 });
  g.userData.shared = false;
  return mesh(g, col, { hull: 1.08 });
}

// Gold coin standing upright facing +z, radius r, centred.
export function makeCoin(r = 0.18) {
  const pm = propModel('prop_coin', { size: r });
  if (pm) return pm;
  const m = mesh(geo.cyl(r, r, r / 3, 14), 0xffc23f, { outline: 0.012 });
  m.rotation.x = Math.PI / 2;
  return m;
}

// Watermelon slice standing upright facing +z, about 1.2*s wide, centred.
export function makeMelon(s = 0.3) {
  const pm = propModel('prop_melon', { size: s });
  if (pm) return pm;
  const g = new T.Group();
  const m = mesh(new T.CylinderGeometry(0.55 * s / 0.3 * 0.3, 0.55 * s / 0.3 * 0.3, 0.3 * s, 16, 1, false, -0.6, 1.2), 0xff5a6e, { outline: 0.015 });
  m.rotation.x = Math.PI / 2;
  g.add(m);
  return g;
}

// Triangle sandwich lying flat, about 0.95*s across, origin at its bottom.
export function makeSandwich(s = 0.6) {
  const pm = propModel('prop_sandwich', { size: s });
  if (pm) return pm;
  const m = new T.Group();
  const bread = mesh(new T.CylinderGeometry(0.32, 0.32, 0.1, 3), 0xf2d6a0, { outline: 0.015 });
  const fill = mesh(new T.CylinderGeometry(0.3, 0.3, 0.06, 3), 0x7fc24a, { outline: 0 }); fill.position.y = 0.08;
  const bread2 = bread.clone(); bread2.position.y = 0.16;
  m.add(bread, fill, bread2);
  return m;
}

export function makeSponge() {
  const pm = propModel('prop_sponge');
  if (pm) {
    const g = new T.Group();
    pm.position.y = -0.3;
    g.add(pm);
    g.userData.setColors = (body, top) => { if (body != null) skinColor(pm, body); if (top != null) layerColor(pm, 'scrub', top); };
    g.userData.model = pm.userData.model;
    return g;
  }
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
  g.userData.setColors = (body, top2) => { if (body != null) s.material = toonUnique(body); if (top2 != null) top.material = toonUnique(top2); };
  return g;
}

// A water drop: a soft teardrop (point up) with a white glint, r = its round part's radius. Shared geometry, so
// showers of them are cheap (splashes, rain, shaking dry).
const dropGeo = (() => {
  const pts = [];
  for (let i = 0; i <= 12; i++) { const a = -Math.PI / 2 + (i / 12) * Math.PI; pts.push(new T.Vector2(Math.cos(a), Math.sin(a))); }
  for (let i = 1; i <= 6; i++) { const t = i / 6; pts.push(new T.Vector2(Math.cos(Math.PI / 2 * 0.92) * (1 - t) ** 1.6 + 0.0001, 1 + t * 1.15)); }
  const g = new T.LatheGeometry(pts, 14);
  g.userData.shared = true;
  return g;
})();
const glintGeo = geo.sphere(0.32, 8, 6);
export function makeWaterDrop(r = 0.1, color = 0x7fd0ff) {
  const d = mesh(dropGeo, color, { outline: 0.18 });
  const hi = new T.Mesh(glintGeo, basic(0xffffff));
  hi.position.set(-0.35, 0.3, 0.75);
  hi.scale.set(0.7, 1, 0.5);
  d.add(hi);
  d.scale.setScalar(r);
  return d;
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
