// Crab (Where's Crab?, Pattern parade). Contract: userData { body, eyes, claws[2], kind: 'crab' }; sits on y=0, faces +z.
import * as T from '../three.js';
import { mesh, geo, ink, blobShadow, toon, basic } from '../engine/toon.js';
import { C, makeFace } from '../engine/faces.js';

export function makeCrab(color = 0xff5a4a) {
  const g = new T.Group();
  const body = mesh(geo.sphere(0.7, 20, 14), color, { outline: 0.035 });
  body.scale.set(1.25, 0.7, 0.95);
  body.position.y = 0.55;
  g.add(body);
  // eyes on stalks
  const eyes = [];
  for (const s of [-1, 1]) {
    const stalk = mesh(geo.cyl(0.05, 0.06, 0.45, 8), color, { outline: 0.015 });
    stalk.position.set(s * 0.28, 1.05, 0.35);
    const eye = mesh(geo.sphere(0.17, 12, 10), 0xffffff, { outline: 0.02 });
    eye.position.set(s * 0.28, 1.32, 0.38);
    const pupil = ink(geo.sphere(0.085, 10, 8));
    pupil.position.set(0, 0, 0.12);
    eye.add(pupil);
    g.add(stalk, eye); eyes.push(eye);
  }
  const smile = ink(geo.torus(0.18, 0.04, Math.PI, 6, 16));
  smile.rotation.z = Math.PI;
  smile.position.set(0, 0.62, 0.66);
  g.add(smile);
  // claws
  const claws = [];
  for (const s of [-1, 1]) {
    const arm = mesh(geo.cyl(0.07, 0.08, 0.5, 8), color, { outline: 0.015 });
    arm.position.set(s * 0.95, 0.65, 0.2);
    arm.rotation.z = s * 0.9;
    const claw = new T.Group();
    const top = mesh(geo.sphere(0.25, 12, 8), color, { outline: 0.02 });
    top.scale.set(1, 0.6, 0.7);
    top.position.y = 0.08;
    const bot = mesh(geo.sphere(0.2, 12, 8), color, { outline: 0.02 });
    bot.scale.set(1, 0.5, 0.7);
    bot.position.y = -0.1;
    claw.add(top, bot);
    claw.position.set(s * 1.2, 0.95, 0.25);
    g.add(arm, claw); claws.push(claw);
  }
  // legs
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
    const leg = mesh(geo.cyl(0.04, 0.05, 0.5, 6), color, { outline: 0.012 });
    leg.position.set(s * (0.6 + i * 0.12), 0.22, -0.15 + i * 0.18);
    leg.rotation.z = s * 1.0;
    g.add(leg);
  }
  g.add(blobShadow(0.9));
  g.userData = { body, eyes, claws, kind: 'crab' };
  return g;
}

