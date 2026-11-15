// Sheep. Contract: userData { head, face (from makeFace), body, arms[2], kind: 'sheep' }; feet at y=0, faces +z.
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

export function makeSheep() {
  const g = makeBiped('sheep');
  const { head, face, body } = g.userData;
  const parts = face.userData;

    // woolly puffs over the body and on top of the head; dark face
    head.material = toon(0x5a4650);
    for (let i = 0; i < 12; i++) {
      const a = i * 2.4, y = 0.55 + (i % 4) * 0.28;
      const p = mesh(geo.sphere(0.3, 12, 10), 0xfaf6ee, { outline: 0.02 });
      p.position.set(Math.cos(a) * 0.62, y, Math.sin(a) * 0.55 - 0.05);
      if (p.position.z > 0.3 && Math.abs(p.position.x) < 0.35) p.position.z = 0.3;
      g.add(p);
    }
    for (let i = 0; i < 4; i++) {
      const p = mesh(geo.sphere(0.2, 10, 8), 0xfaf6ee, { outline: 0.018 });
      p.position.set(-0.27 + i * 0.18, 0.58, -0.05);
      head.add(p);
    }
    for (const s of [-1, 1]) {
      const ear = mesh(geo.sphere(0.13, 10, 8), 0x5a4650, { outline: 0.015 });
      ear.scale.set(1.7, 0.6, 0.7); ear.position.set(s * 0.66, 0.15, 0); ear.rotation.z = s * 0.4;
      head.add(ear);
    }
    for (const c of parts.cheeks) c.visible = false;
  g.userData.kind = 'sheep';
  return g;
}
