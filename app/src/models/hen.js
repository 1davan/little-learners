// Hen. Contract: userData { head, face, body, wings[2], kind: 'hen' }.
import * as T from '../three.js';
import { mesh, geo, ink, blobShadow, toon, basic } from '../engine/toon.js';
import { C, makeFace } from '../engine/faces.js';

export function makeHen() {
  const g = new T.Group();
  const body = mesh(geo.sphere(0.8, 20, 14), 0xfffaf0, { outline: 0.04 });
  body.position.y = 0.85; body.scale.set(1, 0.95, 1.05);
  const head = mesh(geo.sphere(0.5, 18, 14), 0xfffaf0, { outline: 0.035 });
  head.position.y = 1.85;
  const face = makeFace(0.5, { mouth: false });
  head.add(face);
  const beak = mesh(geo.cone(0.12, 0.28, 10), 0xffb020, { outline: 0.018 });
  beak.rotation.x = Math.PI / 2; beak.position.set(0, -0.06, 0.52);
  const wattle = mesh(geo.sphere(0.08, 10, 8), 0xff4b4b, { outline: 0.012 });
  wattle.scale.set(1, 1.5, 0.7); wattle.position.set(0, -0.24, 0.45);
  head.add(beak, wattle);
  for (let i = -1; i <= 1; i++) {
    const c = mesh(geo.sphere(0.11, 10, 8), 0xff4b4b, { outline: 0.014 });
    c.position.set(0, 0.5 + (i === 0 ? 0.06 : 0), i * 0.12);
    head.add(c);
  }
  const wings = [];
  for (const s of [-1, 1]) {
    const w = mesh(geo.sphere(0.32, 14, 10), 0xf3ead8, { outline: 0.025 });
    w.scale.set(0.5, 0.9, 1); w.position.set(s * 0.78, 0.95, 0); w.rotation.z = s * 0.3;
    g.add(w); wings.push(w);
    const foot = mesh(geo.sphere(0.14, 10, 8), 0xffb020, { outline: 0.018 });
    foot.scale.set(1.2, 0.5, 1.5); foot.position.set(s * 0.3, 0.06, 0.2);
    g.add(foot);
  }
  const tail = mesh(geo.cone(0.3, 0.6, 8), 0xf3ead8, { outline: 0.025 });
  tail.position.set(0, 1.25, -0.75); tail.rotation.x = -0.8;
  g.add(body, head, tail, blobShadow(0.9));
  g.userData = { head, face, body, wings, kind: 'hen' };
  return g;
}

