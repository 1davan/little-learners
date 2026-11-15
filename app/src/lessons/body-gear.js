// Bear's nose — beach gear that pops onto a body part after the child finds it.
// Built in the friend's model space (scale 1, ~2.4 units tall, facing +z).
import * as T from '../three.js';
import { mesh, geo, ink, basic } from '../engine/toon.js';
import { C } from '../engine/actors.js';

function sunglasses(span) {
  const g = new T.Group();
  for (const s of [-1, 1]) {
    const lens = mesh(geo.cyl(0.15, 0.15, 0.05, 20), 0x2a2440, { outline: 0.02 });
    lens.rotation.x = Math.PI / 2;
    lens.position.x = s * span / 2;
    const shine = new T.Mesh(geo.sphere(0.04, 6, 4), basic(0xffffff));
    shine.position.set(s * span / 2 - 0.05, 0.05, 0.03);
    shine.scale.z = 0.3;
    const frame = mesh(geo.torus(0.155, 0.03, Math.PI * 2, 6, 20), C.red, { outline: 0 });
    frame.position.x = s * span / 2;
    g.add(lens, shine, frame);
  }
  const bridge = mesh(geo.box(Math.max(0.05, span - 0.3), 0.04, 0.04), C.red, { outline: 0 });
  bridge.position.y = 0.05;
  g.add(bridge);
  return g;
}

function sunscreen() {
  const b = mesh(geo.sphere(0.11, 12, 8), 0xffffff, { outline: 0.012 });
  b.scale.set(1.3, 0.9, 0.7);
  return b;
}

function flower() {
  const g = new T.Group();
  for (let i = 0; i < 5; i++) {
    const p = mesh(geo.sphere(0.1, 10, 8), C.pink, { outline: 0.01 });
    const a = (i / 5) * Math.PI * 2;
    p.position.set(Math.cos(a) * 0.1, Math.sin(a) * 0.1, 0);
    p.scale.set(1, 1, 0.4);
    g.add(p);
  }
  const mid = mesh(geo.sphere(0.06, 8, 6), C.yellow, { outline: 0.008 });
  mid.position.z = 0.03;
  g.add(mid);
  return g;
}

function swimRing() {
  const g = new T.Group();
  const cols = [C.red, 0xffffff];
  for (let i = 0; i < 8; i++) {
    const seg = mesh(geo.torus(0.88, 0.17, Math.PI / 4, 8, 6), cols[i % 2], { outline: 0.015 });
    seg.rotation.z = (i / 8) * Math.PI * 2;
    g.add(seg);
  }
  g.rotation.x = Math.PI / 2;
  return g;
}

function spade() {
  const g = new T.Group();
  const handle = mesh(geo.cyl(0.035, 0.035, 0.55, 8), C.yellow, { outline: 0.01 });
  handle.position.y = 0.2;
  const blade = mesh(geo.box(0.22, 0.24, 0.04), C.blue, { hull: 1.08, outline: 0 });
  blade.position.y = -0.15;
  g.add(handle, blade);
  g.rotation.z = 0.5;
  return g;
}

function flipper() {
  const f = mesh(geo.cone(0.22, 0.6, 4), C.green, { outline: 0.015 });
  f.rotation.x = Math.PI / 2;
  f.scale.set(1.2, 1, 0.25);
  return f;
}

function iceLolly() {
  const g = new T.Group();
  const stick = mesh(geo.box(0.05, 0.25, 0.02), 0xe0b98c, { hull: 1.1, outline: 0 });
  stick.position.y = -0.2;
  const pop = mesh(geo.box(0.18, 0.3, 0.08), C.orange, { hull: 1.06, outline: 0 });
  pop.position.y = 0.05;
  g.add(stick, pop);
  return g;
}

// name → list of { make, at: anchor name, on: 'head'|'root'|'hand', off: [x,y,z] }
export const GEAR = {
  eyes: [{ make: (span) => sunglasses(span), at: 'eyes', on: 'head', off: [0, 0, 0.09] }],
  nose: [{ make: sunscreen, at: 'nose', on: 'head', off: [0, 0.01, 0.05] }],
  ears: [{ make: flower, at: 'earL', on: 'head', off: [0.05, -0.08, 0.15] }],
  mouth: [{ make: iceLolly, at: 'mouth', on: 'head', off: [0.12, -0.1, 0.2], eat: true }],
  tummy: [{ make: swimRing, at: 'tummy', on: 'root', off: [0, -0.1, -0.62] }],
  hands: [{ make: spade, at: 'handR', on: 'hand', off: [0.05, 0.05, 0.12] }],
  feet: [{ make: flipper, at: 'footL', on: 'root', off: [0, -0.05, 0.25] }, { make: flipper, at: 'footR', on: 'root', off: [0, -0.05, 0.25] }],
};
