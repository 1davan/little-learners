// Which has more? — the things that hang on the towels. A different snack or beach thing every round.
import * as T from '../three.js';
import { mesh, geo, ink, basic, blobShadow, toonUnique } from '../engine/toon.js';
import { C } from '../engine/actors.js';
import { makeBeachBall, makeShell, makeSeaStar } from '../engine/beach.js';
import { propModel } from '../engine/prop-models.js';

function fish(col) {
  const pm = propModel('prop_fish');
  if (pm) return pm;
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
  const pm = propModel('prop_icecream', { tint: col, size: 0.95 });
  if (pm) return pm;
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
  const pm = propModel('prop_cookie');
  if (pm) return pm;
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
  star: () => makeSeaStar(0xff9f3f, 0.4),
  ball: () => makeBeachBall(0.36),
  fish: () => fish(C.blue),
  icecream: () => iceCream(0xffb6d9),
  cookie: () => cookie(),
};
// half-width of each thing at scale 1 (to fit a group between a holder's walls)
export const HALF = { shell: 0.42, star: 0.4, ball: 0.38, fish: 0.55, icecream: 0.32, cookie: 0.36 };
export const NAME = { shell: 'shells', star: 'stars', ball: 'balls', fish: 'fish', icecream: 'ice creams', cookie: 'cookies' };
// towel stripe colour for each kind, so the scene changes with the thing
export const STRIPES = { shell: [C.red, C.blue], star: [C.purple, C.green], ball: [C.yellow, C.purple], fish: [C.orange, 0x3fb6e0], icecream: [C.green, C.pink], cookie: [C.blue, C.red] };

export function makeThing(kind) {
  const g = new T.Group();
  g.add(MAKE[kind]());
  g.userData.kind = kind;
  return g;
}

// ---- the two holders the groups tumble into: a different one per level ----
// Each holder: a group sitting on the sand (origin at the floor of the sand), userData { floorY, W, statics, mid }.
// statics are prop-local physics boxes [cx, cy, cz, sx, sy, sz]; the bodies move in the x/y plane only, so no
// front/back walls are needed.
export const HOLDER = { 0: 'tray', 1: 'jar', 2: 'cart' };

export function makeHolder(kind, col = C.blue) {
  const g = new T.Group();
  const W = 4.1;
  let floorY;
  if (kind === 'tray') {
    floorY = 1.35;
    const wood = 0xc98b4f;
    for (const x of [-1.8, 1.8]) for (const z of [-0.35, 0.35]) {
      const leg = mesh(geo.cyl(0.08, 0.1, floorY, 8), wood, { outline: 0.015 });
      leg.position.set(x, floorY / 2, z);
      g.add(leg);
    }
    const top = mesh(geo.box(W + 0.3, 0.14, 1.2), col, { hull: 1.03, outline: 0 });
    top.position.y = floorY - 0.07;
    const lip = mesh(geo.box(W + 0.3, 0.22, 0.08), 0xffffff, { hull: 1.06, outline: 0 });
    lip.position.set(0, floorY + 0.05, 0.6);
    // a painted back board, so the group stands out like goods on a little beach stall
    const board = mesh(geo.box(W + 0.3, 2.3, 0.1), col, { hull: 1.02, outline: 0 });
    board.position.set(0, floorY + 1.15, -0.62);
    const awning = new T.Group();
    for (let i = 0; i < 6; i++) {
      const a = mesh(geo.box((W + 0.5) / 6, 0.12, 0.7), i % 2 ? 0xffffff : col, { outline: 0 });
      a.position.set(-(W + 0.5) / 2 + (W + 0.5) / 12 + (i * (W + 0.5)) / 6, floorY + 2.35, -0.3);
      a.rotation.x = 0.35;
      awning.add(a);
    }
    g.add(top, lip, board, awning);
    for (const x of [-W / 2 - 0.1, W / 2 + 0.1]) {
      const side = mesh(geo.box(0.12, 0.5, 1.2), 0xffffff, { hull: 1.06, outline: 0 });
      side.position.set(x, floorY + 0.2, 0);
      g.add(side);
    }
    g.add(blobShadow(1.8));
  } else if (kind === 'jar') {
    floorY = 0.14;
    const H = 3.0;
    const glass = new T.Mesh(geo.box(W + 0.2, H, 1.1), new T.MeshBasicMaterial({ color: 0xd8f4ff, transparent: true, opacity: 0.22, depthWrite: false }));
    glass.position.y = H / 2;
    const edgeMat = basic(0xffffff);
    for (const x of [-W / 2 - 0.1, W / 2 + 0.1]) {
      const e = new T.Mesh(geo.box(0.1, H, 0.1), edgeMat); e.position.set(x, H / 2, 0.55); g.add(e);
      const shine = new T.Mesh(geo.box(0.06, H * 0.6, 0.02), basic(0xffffff, { transparent: true, opacity: 0.6 }));
      shine.position.set(x * 0.85, H * 0.55, 0.57); g.add(shine);
    }
    const base = mesh(geo.box(W + 0.3, floorY, 1.2), 0xbfe6f5, { hull: 1.04, outline: 0 });
    base.position.y = floorY / 2;
    const lid = mesh(geo.box(W + 0.45, 0.22, 1.25), col, { hull: 1.05, outline: 0 });
    lid.position.y = H + 0.11;
    const knob = mesh(geo.sphere(0.18, 10, 8), col, { outline: 0.015 });
    knob.position.y = H + 0.3;
    g.add(base, glass, lid, knob, blobShadow(1.7));
    g.userData.lid = lid;
  } else { // cart: a little beach wagon with big wheels
    floorY = 0.75;
    const bed = mesh(geo.box(W + 0.2, 0.14, 1.2), 0xa86f3a, { hull: 1.03, outline: 0 });
    bed.position.y = floorY - 0.07;
    const front = mesh(geo.box(W + 0.2, 0.28, 0.1), col, { hull: 1.05, outline: 0 });
    front.position.set(0, floorY + 0.04, 0.6);
    const back = front.clone(); back.position.z = -0.6;
    g.add(bed, front, back);
    for (const x of [-W / 2 - 0.05, W / 2 + 0.05]) {
      const side = mesh(geo.box(0.12, 0.5, 1.2), col, { hull: 1.05, outline: 0 });
      side.position.set(x, floorY + 0.15, 0);
      g.add(side);
    }
    const wheels = [];
    for (const x of [-1.4, 1.4]) {
      const w = mesh(geo.cyl(0.38, 0.38, 0.16, 18), 0x3a2838, { outline: 0.015 });
      w.rotation.x = Math.PI / 2;
      w.position.set(x, 0.38, 0.68);
      const hub = mesh(geo.cyl(0.14, 0.14, 0.18, 10), 0xffd23f, { outline: 0 });
      hub.rotation.x = Math.PI / 2;
      hub.position.set(x, 0.38, 0.7);
      g.add(w, hub);
      wheels.push(w);
    }
    const handle = mesh(geo.cyl(0.05, 0.05, 1.6, 8), 0x3a2838, { outline: 0.01 });
    handle.rotation.z = 1.1;
    handle.position.set(W / 2 + 0.7, floorY + 0.25, 0);
    g.add(handle, blobShadow(1.7));
    g.userData.wheels = wheels;
  }
  // Blender stall / glass jar / wagon (same layout, tinted with the holder colour) replace the code-built ones
  const pm = propModel({ tray: 'prop_stall', jar: 'prop_jar', cart: 'prop_wagon' }[kind], { tint: col });
  if (pm) {
    g.clear(); g.add(pm, blobShadow(kind === 'tray' ? 1.8 : 1.7)); g.userData.wheels = [];
    const L = pm.userData.model.userData.layers;
    if (L.glass) { // see-through walls: no ink outline (it would show through the glass), no depth write
      L.glass.mesh.material = toonUnique(0xd8f4ff, { vertexColors: true, transparent: true, opacity: 0.2, depthWrite: false });
      L.glass.outline.visible = false;
      L.glass.mesh.renderOrder = 2;
    }
    if (L.shine) { L.shine.mesh.material = toonUnique(0xffffff, { vertexColors: true, transparent: true, opacity: 0.7, depthWrite: false }); L.shine.outline.visible = false; L.shine.mesh.renderOrder = 3; }
    g.userData.lid = pm;
  }
  g.userData.floorY = floorY;
  g.userData.col = new T.Color(col).getHex();
  g.userData.W = W;
  g.userData.mid = floorY + 0.8;
  // the inside walls of each model (x of their inner faces), where things drop in from (under the stall's awning,
  // through the jar's lifted lid, out of the sky into the open wagon), and the floor + two side walls that match the
  // model exactly (the walls stand a little above the rims, so a bouncing thing never escapes or perches on one)
  const inner = { tray: 2.08, jar: 2.12, cart: 2.02 }[kind];
  g.userData.inner = inner;
  g.userData.dropY = { tray: floorY + 1.75, jar: 3.55, cart: 6.5 }[kind];
  const wallH = { tray: 2.1, jar: 3.2, cart: 1.6 }[kind];
  g.userData.statics = [[0, floorY - 0.1, 0, W + 0.4, 0.2, 1.4], [-inner - 0.1, floorY + wallH / 2, 0, 0.2, wallH, 1.4], [inner + 0.1, floorY + wallH / 2, 0, 0.2, wallH, 1.4]];
  return g;
}

// Gull's wooden perch (Level 1): a mooring post with a rope coil; she stands on its top at y 2.6
export function makePost() {
  const pm = propModel('prop_post');
  if (pm) return pm;
  const g = new T.Group();
  const post = mesh(geo.cyl(0.15, 0.17, 2.6, 10), 0xa86f3a, { outline: 0.02 });
  post.position.y = 1.3;
  g.add(post);
  return g;
}
