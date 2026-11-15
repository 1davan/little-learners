// Colour tubes helpers: tubes with faces that gulp, and the themed toys that get sorted.
// Every toy is built so its colour dominates (only white / ink details), because colour is the one thing to match.
import * as T from '../three.js';
import { mesh, geo, toonUnique, basic, ink } from '../engine/toon.js';
import { C } from '../engine/actors.js';

export const COL = { red: C.red, blue: C.blue, yellow: C.yellow, green: C.green };

// ---------------- tube with a face ----------------
export function makeTube(color) {
  const g = new T.Group();
  const body = new T.Group(); // squash/stretch happens on this, so layout tweens on g stay clean
  g.add(body);
  const glass = new T.Mesh(geo.cyl(0.95, 0.95, 3, 28, true), toonUnique(COL[color], { transparent: true, opacity: 0.3, side: T.DoubleSide, depthWrite: false }));
  glass.position.y = 1.65;
  const base = mesh(geo.cyl(1.08, 1.12, 0.32, 28), COL[color], { outline: 0.04 });
  base.position.y = 0.16;
  const rim = mesh(geo.torus(0.97, 0.13, Math.PI * 2, 10, 32), COL[color], { outline: 0.03 });
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 3.15;
  body.add(glass, base, rim);

  // face, on a solid colour "label" so it reads against the scenery
  const face = new T.Group();
  face.position.set(0, 2.3, 0.97);
  body.add(face);
  const eyes = [], whites = [];
  for (const s of [-1, 1]) {
    const w = mesh(geo.sphere(0.26, 16, 12), 0xffffff, { outline: 0.03 });
    w.position.set(s * 0.34, 0.3, 0);
    const p = ink(geo.sphere(0.13, 12, 8));
    p.position.set(0, 0, 0.17);
    const shine = new T.Mesh(geo.sphere(0.04, 6, 4), basic(0xffffff));
    shine.position.set(0.05, 0.05, 0.11);
    p.add(shine);
    w.add(p);
    face.add(w);
    eyes.push(p); whites.push(w);
  }
  const smile = ink(geo.torus(0.22, 0.05, Math.PI, 6, 20));
  smile.rotation.z = Math.PI;
  smile.position.set(0, -0.08, 0.02);
  const mouth = ink(geo.sphere(0.26, 18, 12)); // open "ooh / gulp" mouth, scaled by update()
  mouth.position.set(0, -0.12, 0);
  mouth.scale.set(1, 0.001, 0.25);
  const tongue = new T.Mesh(geo.sphere(0.14, 10, 8), basic(0xff7a8a));
  tongue.position.set(0, -0.45, 0.6);
  tongue.scale.set(1, 0.6, 0.3);
  mouth.add(tongue);
  const cheeks = [];
  for (const s of [-1, 1]) {
    const c = new T.Mesh(geo.sphere(0.13, 10, 8), basic(C.cheek));
    c.position.set(s * 0.58, -0.05, -0.02);
    c.scale.set(1, 0.6, 0.3);
    face.add(c);
    cheeks.push(c);
  }
  face.add(smile, mouth);
  // a ring that slides down the glass when the tube swallows ("gulp")
  const bulge = mesh(geo.torus(1.0, 0.12, Math.PI * 2, 8, 28), COL[color], { outline: 0.025 });
  bulge.rotation.x = Math.PI / 2;
  bulge.visible = false;
  body.add(bulge);
  g.userData = { color, count: 0, eyes, whites, glass, body, face, smile, mouth, cheeks, bulge, open: 0, forceOpen: null };
  return g;
}

// ---------------- themed toys ----------------
function hiLight(parent, x, y, z, r = 0.08) {
  const h = new T.Mesh(geo.sphere(r, 8, 6), basic(0xffffff));
  h.position.set(x, y, z);
  parent.add(h);
}
const extrudeCache = {};
function flatShape(key, build, depth = 0.3) {
  if (!extrudeCache[key]) {
    const s = new T.Shape();
    build(s);
    const g = new T.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 2, curveSegments: 24 });
    g.center();
    g.userData.shared = true;
    extrudeCache[key] = g;
  }
  return extrudeCache[key];
}

const MAKE = {
  ball(c, b) {
    const m = mesh(geo.sphere(0.44, 22, 16), c, { outline: 0.035 });
    const band = new T.Mesh(geo.torus(0.445, 0.05, Math.PI * 2, 6, 30), basic(0xffffff));
    band.rotation.y = Math.PI / 2;
    m.add(band);
    hiLight(m, -0.16, 0.2, 0.36, 0.09);
    b.add(m);
  },
  block(c, b) {
    const m = mesh(geo.box(0.78, 0.78, 0.78), c, { hull: 1.07 });
    const inset = new T.Mesh(geo.box(0.5, 0.5, 0.02), basic(0xffffff, { transparent: true, opacity: 0.45 }));
    inset.position.z = 0.4;
    m.add(inset);
    b.add(m);
  },
  balloon(c, b) {
    const m = mesh(geo.sphere(0.42, 22, 16), c, { outline: 0.035 });
    m.scale.set(1, 1.18, 1);
    m.position.y = 0.12;
    const knot = mesh(geo.cone(0.09, 0.14, 10), c, { outline: 0.015 });
    knot.position.y = -0.4;
    const string = ink(geo.cyl(0.012, 0.012, 0.45, 4));
    string.position.y = -0.62;
    hiLight(m, -0.15, 0.2, 0.34, 0.08);
    b.add(m, knot, string);
  },
  fish(c, b) {
    const m = mesh(geo.sphere(0.4, 20, 14), c, { outline: 0.035 });
    m.scale.set(1.25, 0.85, 0.7);
    const tail = mesh(geo.cone(0.3, 0.4, 3), c, { outline: 0.03 });
    tail.rotation.z = Math.PI / 2;
    tail.position.x = -0.58;
    const fin = mesh(geo.cone(0.14, 0.25, 3), c, { outline: 0.02 });
    fin.position.set(0, 0.36, 0);
    const eye = mesh(geo.sphere(0.1, 10, 8), 0xffffff, { outline: 0.02 });
    eye.position.set(0.28, 0.08, 0.24);
    const p = ink(geo.sphere(0.05, 8, 6));
    p.position.set(0.03, 0, 0.07);
    eye.add(p);
    const mouth = ink(geo.torus(0.06, 0.02, Math.PI, 4, 10));
    mouth.position.set(0.44, -0.08, 0.16);
    mouth.rotation.set(0, 0.6, Math.PI);
    b.add(m, tail, fin, eye, mouth);
  },
  car(c, b) {
    const body = mesh(geo.box(1.0, 0.36, 0.6), c, { hull: 1.06 });
    body.position.y = -0.02;
    const cab = mesh(geo.box(0.55, 0.3, 0.52), c, { hull: 1.08 });
    cab.position.set(-0.05, 0.3, 0);
    const win = new T.Mesh(geo.box(0.42, 0.18, 0.54), basic(0xe8f6ff));
    win.position.set(-0.05, 0.31, 0);
    const lamp = new T.Mesh(geo.sphere(0.06, 8, 6), basic(0xffffff));
    lamp.position.set(0.5, 0.0, 0.2);
    b.add(body, cab, win, lamp);
    for (const x of [-0.3, 0.3]) for (const z of [-0.3, 0.3]) {
      const w = ink(geo.cyl(0.15, 0.15, 0.1, 14));
      w.rotation.x = Math.PI / 2;
      w.position.set(x, -0.22, z);
      const hub = new T.Mesh(geo.cyl(0.06, 0.06, 0.11, 8), basic(0xffffff));
      w.add(hub);
      b.add(w);
    }
    b.userData.wheels = true;
  },
  flower(c, b) {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const p = mesh(geo.sphere(0.2, 12, 10), c, { outline: 0.02 });
      p.position.set(Math.cos(a) * 0.27, Math.sin(a) * 0.27, 0);
      p.scale.set(1, 1, 0.5);
      b.add(p);
    }
    const mid = mesh(geo.sphere(0.17, 14, 10), 0xffffff, { outline: 0.02 });
    mid.scale.z = 0.6;
    mid.position.z = 0.06;
    for (const s of [-1, 1]) { const e = ink(geo.sphere(0.03, 6, 4)); e.position.set(s * 0.06, 0.03, 0.1); mid.add(e); }
    b.add(mid);
  },
  star(c, b) {
    const g = flatShape('star', (s) => {
      for (let i = 0; i < 10; i++) {
        const a = Math.PI / 2 + (i / 10) * Math.PI * 2, r = i % 2 ? 0.22 : 0.52;
        if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r); else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      s.closePath();
    });
    const m = mesh(g, c, { hull: 1.07 });
    for (const s of [-1, 1]) { const e = ink(geo.sphere(0.045, 6, 4)); e.position.set(s * 0.09, 0.04, 0.2); m.add(e); }
    b.add(m);
  },
  heart(c, b) {
    const g = flatShape('heart', (s) => {
      s.moveTo(0, -0.45);
      s.bezierCurveTo(-0.15, -0.3, -0.5, -0.1, -0.5, 0.15);
      s.bezierCurveTo(-0.5, 0.42, -0.15, 0.48, 0, 0.25);
      s.bezierCurveTo(0.15, 0.48, 0.5, 0.42, 0.5, 0.15);
      s.bezierCurveTo(0.5, -0.1, 0.15, -0.3, 0, -0.45);
    });
    const m = mesh(g, c, { hull: 1.07 });
    hiLight(m, -0.22, 0.2, 0.18, 0.06);
    b.add(m);
  },
  duck(c, b) {
    const body = mesh(geo.sphere(0.38, 18, 14), c, { outline: 0.035 });
    body.scale.set(1.25, 0.8, 0.95);
    body.position.y = -0.12;
    const head = mesh(geo.sphere(0.24, 16, 12), c, { outline: 0.03 });
    head.position.set(0.22, 0.25, 0);
    const beak = mesh(geo.sphere(0.1, 10, 8), 0xffffff, { outline: 0.015 });
    beak.scale.set(1.4, 0.5, 1);
    beak.position.set(0.2, -0.03, 0);
    head.add(beak);
    for (const s of [-1, 1]) { const e = ink(geo.sphere(0.04, 6, 4)); e.position.set(0.1, 0.07, s * 0.17); head.add(e); }
    const tail = mesh(geo.cone(0.1, 0.22, 8), c, { outline: 0.015 });
    tail.position.set(-0.48, 0.0, 0);
    tail.rotation.z = 0.9;
    b.add(body, head, tail);
  },
};
export const THEMES = Object.keys(MAKE);

// A toy: outer group (dragged, carries userData.color) with an inner body that idles / flips.
export function makeItem(color, theme) {
  const g = new T.Group();
  const b = new T.Group();
  g.add(b);
  (MAKE[theme] || MAKE.ball)(COL[color], b);
  g.userData = { color, theme, body: b };
  return g;
}
