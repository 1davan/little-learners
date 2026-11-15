// Hedgehog. Contract: userData { head, face, body, kind: 'hedgehog' }.
import * as T from '../three.js';
import { mesh, geo, ink, blobShadow, toon, basic } from '../engine/toon.js';
import { C, makeFace } from '../engine/faces.js';

export function makeHedgehog() {
  const g = new T.Group();
  const body = mesh(geo.sphere(0.9, 20, 14), 0x7a5236, { outline: 0.04 });
  body.scale.set(1.15, 0.85, 1);
  body.position.y = 0.8;
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2 * 3.0;
    const v = 0.25 + (i % 7) / 9;
    const dir = new T.Vector3(Math.cos(a) * Math.sin(v * 2), Math.cos(v * 2) * 0.9 + 0.2, -Math.abs(Math.sin(a)) * 0.9 - 0.1).normalize();
    const sp = mesh(geo.cone(0.16, 0.5, 6), 0x5a3a26, { outline: 0.015 });
    sp.position.copy(dir).multiplyScalar(0.8);
    sp.position.y += 0.8;
    sp.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir);
    g.add(sp);
  }
  const R = 0.55;
  const head = mesh(geo.sphere(R, 18, 14), 0xf0c99a, { outline: 0.03 });
  head.position.set(0, 0.85, 0.6);
  const face = makeFace(R, { noseColor: 0x2a2020 });
  head.add(face);
  for (const s of [-1, 1]) {
    const foot = mesh(geo.sphere(0.18, 10, 8), 0xf0c99a, { outline: 0.02 });
    foot.scale.set(1, 0.6, 1.3);
    foot.position.set(s * 0.45, 0.1, 0.45);
    g.add(foot);
  }
  g.add(body, head, blobShadow(1.1));
  g.userData = { head, face, body, kind: 'hedgehog' };
  return g;
}

