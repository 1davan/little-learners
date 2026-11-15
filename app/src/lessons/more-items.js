// Which has more? — the things that hang on the towels. A different snack or beach thing every round.
import * as T from '../three.js';
import { mesh, geo, ink, basic } from '../engine/toon.js';
import { C } from '../engine/actors.js';
import { makeStarfish } from '../engine/scenery.js';
import { makeBeachBall, makeShell } from '../engine/beach.js';

function fish(col) {
  const g = new T.Group();
  const body = mesh(geo.sphere(0.32, 14, 10), col, { outline: 0.02 });
  body.scale.set(1.3, 0.85, 0.6);
  const tail = mesh(geo.cone(0.22, 0.3, 3), col, { outline: 0.015 });
  tail.rotation.z = Math.PI / 2;
  tail.position.x = -0.5;
  const eye = ink(geo.sphere(0.05, 8, 6));
  eye.position.set(0.22, 0.06, 0.18);
  const stripe = new T.Mesh(geo.box(0.06, 0.4, 0.05), basic(0xffffff));
  stripe.position.set(0.02, 0, 0.17);
  g.add(body, tail, eye, stripe);
  return g;
}

function iceCream(col) {
  const g = new T.Group();
  const cone = mesh(geo.cone(0.22, 0.55, 12), 0xe0a860, { outline: 0.02 });
  cone.rotation.x = Math.PI;
  cone.position.y = -0.2;
  const scoop = mesh(geo.sphere(0.27, 14, 10), col, { outline: 0.02 });
  scoop.position.y = 0.14;
  const cherry = mesh(geo.sphere(0.08, 8, 6), C.red, { outline: 0.01 });
  cherry.position.y = 0.42;
  g.add(cone, scoop, cherry);
  return g;
}

function cookie() {
  const g = new T.Group();
  const c = mesh(geo.cyl(0.34, 0.34, 0.1, 18), 0xd9a066, { outline: 0.02 });
  c.rotation.x = Math.PI / 2;
  g.add(c);
  for (let i = 0; i < 5; i++) {
    const chip = ink(geo.sphere(0.05, 6, 4));
    const a = i * 1.3;
    chip.position.set(Math.cos(a) * 0.18 * (i % 2 ? 1 : 0.5), Math.sin(a) * 0.18 * (i % 2 ? 1 : 0.5), 0.06);
    g.add(chip);
  }
  return g;
}

const MAKE = {
  shell: () => { const m = makeShell(0xff9ec0, 0.85); m.rotation.x = 1.3; return m; },
  star: () => makeStarfish(0xff9f3f, 0.4),
  ball: () => makeBeachBall(0.36),
  fish: () => fish(C.blue),
  icecream: () => iceCream(0xffb6d9),
  cookie: () => cookie(),
};
export const NAME = { shell: 'shells', star: 'stars', ball: 'balls', fish: 'fish', icecream: 'ice creams', cookie: 'cookies' };
// towel stripe colour for each kind, so the scene changes with the thing
export const STRIPES = { shell: [C.red, C.blue], star: [C.purple, C.green], ball: [C.yellow, C.purple], fish: [C.orange, 0x3fb6e0], icecream: [C.green, C.pink], cookie: [C.blue, C.red] };

export function makeThing(kind) {
  const g = new T.Group();
  g.add(MAKE[kind]());
  g.userData.kind = kind;
  return g;
}
