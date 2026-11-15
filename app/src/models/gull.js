// Seagull. Contract: userData { head, wings[2], kind: 'gull' }.
import * as T from '../three.js';
import { mesh, geo, ink, blobShadow, toon, basic } from '../engine/toon.js';
import { C, makeFace } from '../engine/faces.js';

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
