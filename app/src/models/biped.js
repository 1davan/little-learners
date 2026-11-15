// Shared chibi body used as a starting point by bear, bunny, cat, frog, cow, pig, sheep and horse.
import * as T from '../three.js';
import { mesh, geo, ink, blobShadow, toon, basic } from '../engine/toon.js';
import { C, makeFace } from '../engine/faces.js';

export const ANIMALS = {
  bear: { color: C.brown, belly: C.lightBrown, nose: 0x3b2a2a },
  bunny: { color: C.white, belly: 0xffe3ec, nose: C.pink },
  cat: { color: C.orange, belly: 0xffe0b8, nose: C.pink },
  frog: { color: C.green, belly: 0xc8f5b0, nose: null },
  cow: { color: 0xfaf6ee, belly: 0xffd9e2, nose: null },
  pig: { color: 0xffa8bf, belly: 0xffc9d6, nose: null },
  sheep: { color: 0xfaf6ee, belly: 0xfff6e6, nose: null },
  horse: { color: 0xb87a4b, belly: 0xe8c39c, nose: null },
};

export function makeBiped(kind = 'bear') {
  const a = ANIMALS[kind];
  const g = new T.Group();
  const bodyR = 0.75, R = 0.68;
  const body = mesh(geo.sphere(bodyR, 20, 14), a.color, { outline: 0.04 });
  body.position.y = bodyR * 0.95;
  body.scale.set(1, 1.05, 0.9);
  const belly = mesh(geo.sphere(0.5, 16, 12), a.belly, { outline: 0 });
  belly.scale.set(1, 1.1, 0.45);
  belly.position.set(0, 0.7, 0.48);
  const head = mesh(geo.sphere(R, 22, 16), a.color, { outline: 0.035 });
  head.position.y = bodyR * 1.9 + R * 0.55;
  const face = makeFace(R, { noseColor: a.nose });
  head.add(face);
  if (kind === 'bear') {
    for (const s of [-1, 1]) {
      const e = mesh(geo.sphere(0.22, 14, 10), a.color, { outline: 0.025 });
      e.position.set(s * 0.5, 0.5, -0.05);
      const inner = mesh(geo.sphere(0.12, 10, 8), a.belly, { outline: 0 });
      inner.position.set(0, 0, 0.12); inner.scale.z = 0.5;
      e.add(inner); head.add(e);
    }
  } else if (kind === 'bunny') {
    for (const s of [-1, 1]) {
      const e = mesh(geo.sphere(0.2, 14, 10), a.color, { outline: 0.025 });
      e.scale.set(0.9, 3, 0.6);
      e.position.set(s * 0.28, 0.95, -0.05);
      e.rotation.z = -s * 0.15;
      const inner = mesh(geo.sphere(0.1, 10, 8), C.pink, { outline: 0 });
      inner.position.set(0, 0, 0.13); inner.scale.set(1, 1, 0.4);
      e.add(inner); head.add(e);
    }
  } else if (kind === 'cat') {
    for (const s of [-1, 1]) {
      const e = mesh(geo.cone(0.22, 0.42, 4), a.color, { outline: 0.025 });
      e.position.set(s * 0.4, 0.62, 0);
      e.rotation.z = -s * 0.35;
      head.add(e);
    }
  } else if (kind === 'frog') {
    for (const e of face.userData.eyes) { e.position.y += 0.3; e.scale.multiplyScalar(1.2); }
    for (const s of [-1, 1]) {
      const bump = mesh(geo.sphere(0.2, 14, 10), a.color, { outline: 0.025 });
      bump.position.set(s * 0.25, 0.48, 0.38);
      head.add(bump);
    }
  }
  const arms = [];
  for (const s of [-1, 1]) {
    const arm = mesh(geo.sphere(0.22, 12, 10), a.color, { outline: 0.025 });
    arm.scale.set(0.8, 1.3, 0.8);
    arm.position.set(s * 0.72, 0.85, 0.15);
    arm.rotation.z = s * 0.4;
    g.add(arm); arms.push(arm);
    const foot = mesh(geo.sphere(0.24, 12, 10), a.color, { outline: 0.025 });
    foot.scale.set(1, 0.55, 1.3);
    foot.position.set(s * 0.35, 0.1, 0.2);
    g.add(foot);
  }
  g.add(body, belly, head, blobShadow(0.95));
  g.userData = { head, face, body, arms, kind };
  return g;
}

