// Shape house helpers: shape outlines, window holes (with a flower box an animal can peek over), and pieces with faces.
import * as T from '../three.js';
import { mesh, geo, toon, basic, ink } from '../engine/toon.js';
import { C } from '../engine/actors.js';

export const SYM = { circle: Math.PI / 32, square: Math.PI / 2, triangle: (Math.PI * 2) / 3, rect: Math.PI };

function outline2D(kind) {
  const s = new T.Shape();
  if (kind === 'circle') s.absarc(0, 0, 0.68, 0, Math.PI * 2, false);
  else if (kind === 'square') { s.moveTo(-0.62, -0.62); s.lineTo(0.62, -0.62); s.lineTo(0.62, 0.62); s.lineTo(-0.62, 0.62); s.closePath(); }
  else if (kind === 'rect') { s.moveTo(-0.9, -0.45); s.lineTo(0.9, -0.45); s.lineTo(0.9, 0.45); s.lineTo(-0.9, 0.45); s.closePath(); }
  else { const h = 1.45; s.moveTo(-0.84, -h / 3); s.lineTo(0.84, -h / 3); s.lineTo(0, (2 * h) / 3); s.closePath(); }
  return s;
}
const shapeGeoCache = {};
export function shapeGeo(kind, depth) {
  const key = kind + depth;
  if (!shapeGeoCache[key]) {
    const g = new T.ExtrudeGeometry(outline2D(kind), { depth, bevelEnabled: depth > 0.15, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 2, curveSegments: 40 });
    g.translate(0, 0, -depth / 2);
    g.userData.shared = true;
    shapeGeoCache[key] = g;
  }
  return shapeGeoCache[key];
}

export const DARK = 0x3a2f5b, LIT = 0xffe27a;

export function makeHole(kind) {
  const g = new T.Group();
  const rim = new T.Mesh(shapeGeo(kind, 0.08), toon(0xf3d7a6));
  rim.scale.set(1.3, 1.3, 1);
  const hole = new T.Mesh(shapeGeo(kind, 0.08), basic(DARK));
  hole.scale.set(1.12, 1.12, 1);
  hole.position.z = 0.06;
  const edge = new T.Mesh(shapeGeo(kind, 0.08), basic(0x2a2440));
  edge.scale.set(1.36, 1.36, 1);
  edge.position.z = -0.03;
  g.add(edge, rim, hole);
  // flower box under the window: the peeking animal hides behind it
  const box = mesh(geo.box(1.7, 0.36, 0.5), 0xb5764a, { hull: 1.05 });
  box.position.set(0, -1.12, 0.3);
  const cols = [C.pink, C.yellow, C.purple, C.red];
  for (let i = 0; i < 4; i++) {
    const f = mesh(geo.sphere(0.12, 10, 8), cols[(i + kind.length) % 4], { outline: 0.015 });
    f.position.set(-0.6 + i * 0.4, 0.26, 0.05);
    const c = new T.Mesh(geo.sphere(0.05, 6, 4), basic(0xffffff));
    c.position.z = 0.1;
    f.add(c);
    box.add(f);
  }
  g.add(box);
  g.userData = { kind, hole, rim, lit: false };
  return g;
}

export function lightWindow(h, on = true) {
  h.userData.lit = on;
  h.userData.hole.material = basic(on ? LIT : DARK);
}

// A piece: outer group is what's dragged (userData.kind); the inner mesh carries the tilt and the face.
export function makePiece(kind, color) {
  const g = new T.Group();
  const m = mesh(shapeGeo(kind, 0.32), color, { hull: 1.08 });
  const hi = new T.Mesh(geo.sphere(0.09, 8, 6), basic(0xffffff));
  hi.position.set(kind === 'triangle' ? -0.2 : -0.32, kind === 'triangle' ? 0.35 : 0.25, 0.24);
  hi.scale.z = 0.3;
  m.add(hi);
  // a little face
  const fy = kind === 'triangle' ? 0.02 : 0.08;
  const eyes = [];
  for (const s of [-1, 1]) {
    const w = new T.Mesh(geo.sphere(0.1, 10, 8), basic(0xffffff));
    w.position.set(s * 0.18, fy + 0.06, 0.23);
    w.scale.z = 0.4;
    const p = ink(geo.sphere(0.055, 8, 6));
    p.position.z = 0.07;
    w.add(p);
    m.add(w); eyes.push(w);
  }
  const smile = ink(geo.torus(0.1, 0.025, Math.PI, 4, 14));
  smile.rotation.z = Math.PI;
  smile.position.set(0, fy - 0.1, 0.24);
  const oh = ink(geo.sphere(0.07, 10, 8));
  oh.position.set(0, fy - 0.13, 0.22);
  oh.scale.z = 0.3;
  oh.visible = false;
  m.add(smile, oh);
  g.add(m);
  g.userData = { kind, inner: m, eyes, smile, oh };
  return g;
}

// faces: 'happy' | 'oh' | 'dizzy'
export function pieceFace(p, mood) {
  const u = p.userData;
  u.smile.visible = mood === 'happy';
  u.oh.visible = mood !== 'happy';
  for (const e of u.eyes) e.scale.y = mood === 'dizzy' ? 0.35 : 1;
}

// who peeks out of each window, with their voice
export const PEEKERS = [['bunny', 'boing2'], ['cat', 'meow'], ['frog', 'ribbit'], ['bear', 'mmm'], ['elephant', 'trumpet'], ['hedgehog', 'squeak']];
