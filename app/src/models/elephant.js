// Elephant. Contract: userData { head, face, body, trunk[3 segments], legs, kind: 'elephant' }.
import * as T from '../three.js';
import { mesh, geo, ink, blobShadow, toon, basic } from '../engine/toon.js';
import { C, makeFace } from '../engine/faces.js';

export function makeElephant() {
  const g = new T.Group();
  const col = C.grey;
  const body = mesh(geo.sphere(1, 22, 16), col, { outline: 0.04 });
  body.scale.set(1.15, 0.9, 1);
  body.position.set(0, 1.15, -0.4);
  const legs = [];
  for (const [x, z] of [[-0.6, 0.1], [0.6, 0.1], [-0.55, -0.8], [0.55, -0.8]]) {
    const l = mesh(geo.cyl(0.26, 0.3, 0.8, 14), col, { outline: 0.03 });
    l.position.set(x, 0.4, z);
    g.add(l); legs.push(l);
  }
  const R = 0.75;
  const head = mesh(geo.sphere(R, 22, 16), col, { outline: 0.035 });
  head.position.set(0, 1.85, 0.45);
  const face = makeFace(R, { mouth: false });
  for (const e of face.userData.eyes) e.position.y += 0.08;
  head.add(face);
  for (const s of [-1, 1]) {
    const ear = mesh(geo.sphere(0.6, 16, 12), col, { outline: 0.03 });
    ear.scale.set(1, 1.15, 0.22);
    ear.position.set(s * 0.85, 0.05, -0.25);
    ear.rotation.y = -s * 0.5;
    const inner = mesh(geo.sphere(0.42, 14, 10), C.pink, { outline: 0 });
    inner.position.z = 0.25; inner.scale.z = 0.4;
    ear.add(inner);
    head.add(ear);
  }
  // Trunk: three stacked tapered segments curling forward.
  let parent = head, y = -0.25, z = 0.62, r = 0.22;
  const trunk = [];
  for (let i = 0; i < 3; i++) {
    const seg = mesh(geo.cyl(r * 0.85, r, 0.42, 14), col, { outline: 0.025 });
    seg.position.set(0, y, z);
    seg.rotation.x = 0.2 + i * 0.25;
    parent.add(seg); trunk.push(seg);
    parent = seg; y = -0.36; z = 0.04; r *= 0.85;
  }
  for (const s of [-1, 1]) {
    const tusk = mesh(geo.cone(0.07, 0.3, 8), C.white, { outline: 0.015 });
    tusk.position.set(s * 0.25, -0.45, 0.5);
    tusk.rotation.x = Math.PI * 0.85;
    head.add(tusk);
  }
  g.add(body, head, blobShadow(1.3));
  g.userData = { head, face, body, trunk, legs, kind: 'elephant' };
  return g;
}

