// Pig. Contract: userData { head, face (from makeFace), body, arms[2], kind: 'pig' }; feet at y=0, faces +z.
import * as T from '../three.js';
import { mesh, geo, ink, blobShadow, toon, basic } from '../engine/toon.js';
import { C, makeFace } from '../engine/faces.js';
import { makeBiped } from './biped.js';

function snout(head, col, w = 0.42, h = 0.3, z = 0.62, y = -0.18, nostrils = 0x7a3b4a) {
  const s = mesh(geo.sphere(0.3, 16, 12), col, { outline: 0.02 });
  s.scale.set(w / 0.3, h / 0.3, 0.6);
  s.position.set(0, y, z);
  for (const x of [-1, 1]) {
    const n = new T.Mesh(geo.sphere(0.045, 8, 6), toon(nostrils));
    n.scale.set(1, 1.4, 0.5);
    n.position.set(x * w * 0.38, 0.02, 0.27);
    s.add(n);
  }
  head.add(s);
  return s;
}

export function makePig() {
  const g = makeBiped('pig');
  const { head, face, body } = g.userData;
  const parts = face.userData;

    snout(head, 0xff8fae, 0.3, 0.22, 0.66, -0.12, 0x9c3b56);
    for (const s of [-1, 1]) {
      const ear = mesh(geo.cone(0.18, 0.32, 4), 0xffa8bf, { outline: 0.02 });
      ear.position.set(s * 0.42, 0.58, 0.05); ear.rotation.set(0.4, 0, -s * 0.5);
      head.add(ear);
    }
    const tail = mesh(geo.torus(0.1, 0.035, Math.PI * 1.6, 6, 12), 0xffa8bf, { outline: 0.01 });
    tail.position.set(0, 0.8, -0.72);
    g.add(tail);
    g.userData.tail = tail;
  g.userData.kind = 'pig';
  return g;
}
