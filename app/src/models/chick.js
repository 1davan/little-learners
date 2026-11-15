// Baby chick (hides in Peekaboo pots). Contract: userData { body, face, wings, kind: 'chick', baseScale }.
import * as T from '../three.js';
import { mesh, geo, ink, blobShadow, toon, basic } from '../engine/toon.js';
import { C, makeFace } from '../engine/faces.js';

export function makeChick(s = 0.55) {
  const g = new T.Group();
  const inner = new T.Group();
  const body = mesh(geo.sphere(0.6, 18, 14), 0xffe14d, { outline: 0.035 });
  body.position.y = 0.6;
  const face = makeFace(0.6, { mouth: false });
  face.position.set(0, 0.12, 0);
  body.add(face);
  const beak = mesh(geo.cone(0.1, 0.22, 10), C.orange, { outline: 0.015 });
  beak.rotation.x = Math.PI / 2; beak.position.set(0, 0.0, 0.62);
  body.add(beak);
  const tuft = mesh(geo.sphere(0.09, 8, 6), 0xffe14d, { outline: 0.015 });
  tuft.scale.set(0.8, 1.7, 0.8); tuft.position.set(0, 0.62, 0);
  body.add(tuft);
  const wings = [];
  for (const sd of [-1, 1]) {
    const w = mesh(geo.sphere(0.2, 10, 8), 0xffcf1a, { outline: 0.018 });
    w.scale.set(0.5, 1, 0.8); w.position.set(sd * 0.58, 0.55, 0); w.rotation.z = sd * 0.4;
    inner.add(w); wings.push(w);
    const foot = mesh(geo.sphere(0.11, 8, 6), C.orange, { outline: 0.014 });
    foot.scale.set(1.2, 0.5, 1.4); foot.position.set(sd * 0.22, 0.05, 0.15);
    inner.add(foot);
  }
  inner.add(body, blobShadow(0.7));
  g.add(inner);
  g.scale.setScalar(s);
  g.userData = { body, face, wings, kind: 'chick', baseScale: s };
  return g;
}

