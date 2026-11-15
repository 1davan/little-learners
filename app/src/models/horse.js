// Horse. Contract: userData { head, face (from makeFace), body, arms[2], kind: 'horse' }; feet at y=0, faces +z.
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

export function makeHorse() {
  const g = makeBiped('horse');
  const { head, face, body } = g.userData;
  const parts = face.userData;

    snout(head, 0xe8c39c, 0.44, 0.34, 0.6, -0.24, 0x6b3f28);
    for (const s of [-1, 1]) {
      const ear = mesh(geo.cone(0.12, 0.34, 6), 0xb87a4b, { outline: 0.018 });
      ear.position.set(s * 0.3, 0.68, -0.05); ear.rotation.z = -s * 0.25;
      head.add(ear);
    }
    for (let i = 0; i < 5; i++) {
      const m = mesh(geo.sphere(0.14, 10, 8), 0x5a3420, { outline: 0.015 });
      m.position.set(0, 0.62 - i * 0.16, -0.25 - i * 0.12); m.scale.set(0.8, 1.2, 1);
      head.add(m);
    }
  g.userData.kind = 'horse';
  return g;
}
