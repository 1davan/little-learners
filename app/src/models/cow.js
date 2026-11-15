// Cow. Contract: userData { head, face (from makeFace), body, arms[2], kind: 'cow' }; feet at y=0, faces +z.
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

export function makeCow() {
  const g = makeBiped('cow');
  const { head, face, body } = g.userData;
  const parts = face.userData;

    snout(head, 0xffc0cf, 0.48, 0.3);
    for (const s of [-1, 1]) {
      const horn = mesh(geo.cone(0.08, 0.28, 8), 0xfff1c9, { outline: 0.015 });
      horn.position.set(s * 0.32, 0.62, -0.05); horn.rotation.z = -s * 0.5;
      const ear = mesh(geo.sphere(0.16, 10, 8), 0xfaf6ee, { outline: 0.02 });
      ear.scale.set(1.6, 0.6, 0.6); ear.position.set(s * 0.68, 0.28, -0.05); ear.rotation.z = s * 0.3;
      head.add(horn, ear);
    }
    // black spots
    for (const [x, y, z, r] of [[0.45, 1.0, 0.45, 0.24], [-0.5, 0.6, 0.4, 0.2], [0.1, 1.25, -0.5, 0.3]]) {
      const sp = new T.Mesh(geo.sphere(r, 12, 8), toon(0x3a2838));
      sp.scale.set(1, 0.9, 0.35); sp.position.set(x, y, z); sp.lookAt(0, 0.8, 0); sp.position.multiplyScalar(1.02);
      g.add(sp);
    }
    const spot = new T.Mesh(geo.sphere(0.2, 12, 8), toon(0x3a2838)); spot.scale.set(1, 0.8, 0.4); spot.position.set(-0.32, 0.35, 0.5); head.add(spot);
    const bell = mesh(geo.sphere(0.13, 10, 8), 0xffd23f, { outline: 0.015 }); bell.position.set(0, 1.42, 0.62); g.add(bell);
  g.userData.kind = 'cow';
  return g;
}
