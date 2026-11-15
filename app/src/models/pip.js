// Pip the chick: narrator and mascot. Contract: userData { head, face, body, wings[2], kind: 'pip' }; feet at y=0, faces +z.
import * as T from '../three.js';
import { mesh, geo, ink, blobShadow, toon, basic } from '../engine/toon.js';
import { C, makeFace } from '../engine/faces.js';

export function makePip() {
  const g = new T.Group();
  const body = mesh(geo.sphere(0.78, 22, 16), C.yellow, { outline: 0.04 });
  body.position.y = 0.8;
  body.scale.set(1, 0.95, 0.95);
  const head = mesh(geo.sphere(0.58, 22, 16), C.yellow, { outline: 0.035 });
  head.position.y = 1.78;
  const face = makeFace(0.58, { mouth: false });
  head.add(face);
  const beak = mesh(geo.cone(0.13, 0.3, 12), C.orange, { outline: 0.02 });
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, -0.08, 0.6);
  head.add(beak);
  for (let i = -1; i <= 1; i++) {
    const tuft = mesh(geo.sphere(0.1, 10, 8), C.yellow, { outline: 0.02 });
    tuft.position.set(i * 0.09, 0.58, 0);
    tuft.scale.set(0.8, 1.6, 0.8);
    tuft.rotation.z = -i * 0.4;
    head.add(tuft);
  }
  const wings = [];
  for (const s of [-1, 1]) {
    const w = mesh(geo.sphere(0.3, 14, 10), 0xffc21a, { outline: 0.025 });
    w.scale.set(0.5, 1, 0.8);
    w.position.set(s * 0.76, 0.95, 0);
    w.rotation.z = s * 0.3;
    g.add(w); wings.push(w);
    const foot = mesh(geo.sphere(0.16, 12, 8), C.orange, { outline: 0.02 });
    foot.scale.set(1.2, 0.5, 1.5);
    foot.position.set(s * 0.32, 0.06, 0.2);
    g.add(foot);
  }
  const belly = mesh(geo.sphere(0.5, 16, 12), 0xfff0a8, { outline: 0 });
  belly.scale.set(1, 1, 0.5);
  belly.position.set(0, 0.7, 0.5);
  g.add(body, head, belly, blobShadow(0.9));
  g.userData = { head, face, body, wings, kind: 'pip' };
  return g;
}

