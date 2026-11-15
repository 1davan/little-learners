// Rubber/farm duck. Contract: userData { body, head, kind: 'duck', baseScale }; makeDuck(s) scales it.
import * as T from '../three.js';
import { mesh, geo, ink, blobShadow, toon, basic } from '../engine/toon.js';
import { C, makeFace } from '../engine/faces.js';

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

