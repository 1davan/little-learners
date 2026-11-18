// Apple count: the things you count, one look per level (orchard fruit, berry-patch berries, tea-party treats),
// a few visitors for the per-round twists (ladybug, butterfly) and the three containers (basket, pail, bowl).
import * as T from '../three.js';
import { mesh, geo, basic, ink, toon, blobShadow } from '../engine/toon.js';
import { C } from '../engine/actors.js';
import { makeFruit } from './counting-hosts.js';
import { propModel } from '../engine/prop-models.js';
import { prop, retint } from './view-tools.js';
import { toonUnique } from '../engine/toon.js';

const GOLD = 0xffd23f;
const shine = (g, x, y, z, r = 0.1) => { const h = new T.Mesh(geo.sphere(r, 8, 6), basic(0xffffff)); h.position.set(x, y, z); g.add(h); };

// Plural names for the caption.
export const PLURAL = {
  apple: 'apples', pear: 'pears', orange: 'oranges', plum: 'plums',
  strawberry: 'strawberries', blueberry: 'blueberries', cherry: 'cherries', lemon: 'lemons',
  cookie: 'cookies', cupcake: 'cupcakes', donut: 'donuts', sweet: 'sweets',
};

// Blender models: [kind, tint (null = painted colours), scale, physics radius, layers to hide]
const ITEM = {
  apple: ['prop_m_apple', 0xff4b4b, 1.0, 0.46], pear: ['prop_m_pear', 0x9ed64a, 1.0, 0.46], orange: ['prop_m_orange', C.orange, 0.98, 0.47],
  plum: ['prop_m_plum', 0x9b5de5, 1.0, 0.46], strawberry: ['prop_m_strawberry', 0xff3b4e, 1.0, 0.45], blueberry: ['prop_m_blueberry', 0x4a6cff, 1.0, 0.42],
  cherry: ['prop_m_cherry', 0xd8143a, 1.0, 0.42], lemon: ['prop_m_lemon', 0xfff04a, 1.0, 0.45], cookie: ['prop_cookie', null, 1.35, 0.47],
  cupcake: ['prop_m_cupcake', null, 1.0, 0.45, ['candle']], donut: ['prop_m_donut', null, 1.0, 0.48], sweet: ['prop_m_sweet', 0x9b5de5, 1.05, 0.42],
};
// a golden one: tintable models take a gold tint, painted ones turn solid gold (their stems / sprinkles keep colour)
function gild(w) { const u = w.userData.model?.userData; if (u?.skin) u.skin.material = toonUnique(GOLD); }

// Every item is a Group centred on its middle; userData.r is the physics ball radius.
export function makeItem(kind, { golden = false } = {}) {
  let g;
  const I = ITEM[kind];
  const pm = I && prop(I[0], { tint: I[1] === null ? undefined : (golden ? GOLD : I[1]), hide: I[4] });
  if (pm) {
    if (golden && I[1] === null) gild(pm);
    pm.scale.setScalar(I[2]);
    // a cookie lies (almost) flat on its plate / tray, tipped a little toward the child so its chips show
    if (kind === 'cookie') pm.rotation.x = -1.15;
    g = new T.Group();
    g.add(pm);
    g.userData.r = I[3];
    // treats pile up by their real shape (a convex hull), round fruit as balls
    if (I[1] === null || kind === 'sweet') g.userData.hull = true;
    if (golden) g.userData.golden = true;
    return g;
  }
  const col = (c) => (golden ? GOLD : c);
  if (kind === 'strawberry') {
    g = new T.Group();
    const b = mesh(geo.sphere(0.46, 18, 14), col(0xff3b4e), { outline: 0.035 });
    b.scale.set(1, 1.15, 1);
    b.rotation.x = Math.PI; // pointy end down (sphere is round; the cone tip below makes the shape)
    const tip = mesh(geo.cone(0.36, 0.42, 14), col(0xff3b4e), { outline: 0.03 });
    tip.rotation.x = Math.PI; tip.position.y = -0.42;
    g.add(b, tip);
    for (let i = 0; i < 9; i++) {
      const a = i * 2.4, yy = -0.25 + (i % 3) * 0.22;
      const s = new T.Mesh(geo.sphere(0.035, 6, 4), basic(0xfff2a8));
      s.position.set(Math.sin(a) * 0.36, yy, Math.cos(a) * 0.36 + 0.08);
      g.add(s);
    }
    for (let i = 0; i < 5; i++) {
      const l = mesh(geo.sphere(0.16, 8, 6), C.leaf, { outline: 0.012 });
      const a = (i / 5) * Math.PI * 2;
      l.scale.set(1.3, 0.3, 0.6);
      l.position.set(Math.sin(a) * 0.17, 0.5, Math.cos(a) * 0.17);
      l.rotation.y = -a;
      g.add(l);
    }
    shine(g, -0.17, 0.2, 0.4);
    g.userData.r = 0.45;
  } else if (kind === 'blueberry') {
    g = new T.Group();
    g.add(mesh(geo.sphere(0.42, 18, 14), col(0x4a6cff), { outline: 0.035 }));
    const crown = ink(geo.torus(0.1, 0.035, Math.PI * 2, 5, 5));
    crown.position.y = 0.4; crown.rotation.x = Math.PI / 2;
    g.add(crown);
    shine(g, -0.15, 0.17, 0.36);
    g.userData.r = 0.42;
  } else if (kind === 'cherry') {
    g = new T.Group();
    g.add(mesh(geo.sphere(0.42, 18, 14), col(0xd8143a), { outline: 0.035 }));
    const stem = mesh(geo.cyl(0.03, 0.035, 0.55, 6), 0x5d8a2e, { outline: 0.01 });
    stem.position.set(0.08, 0.6, 0); stem.rotation.z = -0.3;
    const leaf = mesh(geo.sphere(0.14, 10, 8), C.leaf, { outline: 0.012 });
    leaf.scale.set(1.5, 0.3, 0.7); leaf.position.set(0.28, 0.82, 0);
    g.add(stem, leaf);
    shine(g, -0.15, 0.17, 0.36);
    g.userData.r = 0.42;
  } else if (kind === 'lemon') {
    g = new T.Group();
    const b = mesh(geo.sphere(0.45, 18, 14), col(0xfff04a), { outline: 0.035 });
    b.scale.set(1.25, 0.9, 0.9);
    const n1 = mesh(geo.sphere(0.12, 8, 6), col(0xfff04a), { outline: 0.015 });
    n1.position.x = 0.58;
    g.add(b, n1);
    shine(g, -0.2, 0.17, 0.34);
    g.userData.r = 0.45;
  } else if (kind === 'cookie') {
    g = new T.Group();
    const d = mesh(geo.cyl(0.52, 0.52, 0.16, 22), col(0xd99a52), { outline: 0.035 });
    d.rotation.x = Math.PI / 2; // face the camera
    g.add(d);
    const chips = [[0.2, 0.18], [-0.22, 0.1], [0.05, -0.2], [-0.12, 0.3], [0.28, -0.12], [-0.28, -0.22]];
    for (const [x, y] of chips) {
      const c = new T.Mesh(geo.sphere(0.07, 6, 5), basic(golden ? 0xffffff : 0x5a3220));
      c.position.set(x, y, 0.08); c.scale.z = 0.5;
      const c2 = c.clone(); c2.position.set(-x, y, -0.08);
      g.add(c, c2);
    }
    g.userData.r = 0.45;
  } else if (kind === 'cupcake') {
    g = new T.Group();
    const cup = mesh(geo.cyl(0.4, 0.3, 0.42, 14), col(0x6ec6ff), { outline: 0.03 });
    cup.position.y = -0.22;
    const fr = mesh(geo.sphere(0.44, 16, 12), golden ? 0xfff6c8 : 0xffb3d1, { outline: 0.03 });
    fr.scale.set(1, 0.7, 1); fr.position.y = 0.08;
    const fr2 = mesh(geo.sphere(0.28, 14, 10), golden ? 0xfff6c8 : 0xffc6de, { outline: 0.025 });
    fr2.position.y = 0.32;
    const ch = mesh(geo.sphere(0.12, 10, 8), 0xe8143a, { outline: 0.015 });
    ch.position.y = 0.58;
    g.add(cup, fr, fr2, ch);
    g.userData.r = 0.44;
  } else if (kind === 'donut') {
    g = new T.Group();
    const ring = mesh(geo.torus(0.33, 0.17, Math.PI * 2, 10, 20), col(0xe0a45e), { outline: 0.03 });
    const ice = mesh(geo.torus(0.33, 0.15, Math.PI * 2, 10, 20), golden ? 0xfff6c8 : 0xff7ab8, { outline: 0 });
    ice.position.z = 0.05; ice.scale.z = 0.8;
    const ice2 = ice.clone(); ice2.position.z = -0.05;
    g.add(ring, ice, ice2);
    const SPR = [C.yellow, C.blue, 0xffffff, C.green, C.purple];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + 0.3;
      const s = new T.Mesh(geo.box(0.11, 0.035, 0.035), basic(SPR[i % SPR.length]));
      s.position.set(Math.cos(a) * 0.33, Math.sin(a) * 0.33, 0.2);
      s.rotation.z = a * 3;
      g.add(s);
    }
    g.userData.r = 0.48;
  } else if (kind === 'sweet') {
    g = new T.Group();
    const b = mesh(geo.sphere(0.36, 16, 12), col(0x9b5de5), { outline: 0.03 });
    g.add(b);
    for (const sx of [-1, 1]) {
      const w = mesh(geo.cone(0.22, 0.3, 10), col(0xc9a4ff), { outline: 0.02 });
      w.rotation.z = sx * Math.PI / 2; w.position.x = sx * 0.46;
      g.add(w);
    }
    shine(g, -0.12, 0.14, 0.3);
    g.userData.r = 0.42;
  } else {
    g = makeFruit(kind);
    if (golden) g.traverse((o) => { if (o.isMesh && o.material && !o.material.isMeshBasicMaterial && o.geometry?.parameters?.radius >= 0.3) o.material = toon(GOLD); });
    g.userData.r = 0.46;
  }
  if (golden) g.userData.golden = true;
  return g;
}

// A spotty ladybug that sits on one item and flies off when that item is tapped.
export function makeLadybug() {
  const pm = prop('prop_m_ladybug');
  if (pm) { pm.scale.setScalar(1.1); pm.position.y = 0.06; const g = new T.Group(); g.add(pm); return g; }
  const g = new T.Group();
  const shell = mesh(geo.sphere(0.2, 14, 10), 0xff3030, { outline: 0.02 });
  shell.scale.set(1, 0.6, 1.1);
  const head = mesh(geo.sphere(0.1, 10, 8), 0x2a2030, { outline: 0.012 });
  head.position.set(0, 0, 0.2);
  for (const [x, z] of [[0.09, 0.05], [-0.09, 0.05], [0.07, -0.1], [-0.07, -0.1]]) {
    const d = new T.Mesh(geo.sphere(0.045, 6, 4), basic(0x2a2030));
    d.position.set(x, 0.11, z);
    g.add(d);
  }
  for (const sx of [-1, 1]) {
    const e = new T.Mesh(geo.sphere(0.035, 6, 4), basic(0xffffff));
    e.position.set(sx * 0.045, 0.04, 0.28);
    g.add(e);
  }
  g.add(shell, head);
  return g;
}

// ---------- containers. Each returns { obj, phys: {y, r, h}, kind } (phys floor height, radius, wall height) ----------
export function makeContainer(kind) {
  // Blender containers (same rims and floors): a blue pail, a polka-dot bowl, the straw-filled wicker basket
  const pm = propModel({ pail: 'prop_bucket', bowl: 'prop_bowl' }[kind] || 'prop_wicker', kind === 'pail' ? { tint: 0x4fb0ff, size: [1.35, 1.1 / 1.3, 1.35] } : {});
  if (pm) {
    if (kind === 'pail') { // the fruit lands on a false floor at 0.72 (deep water-blue, as before)
      const f = new T.Mesh(geo.circle(1.15, 28), basic(0x23507a)); f.rotation.x = -Math.PI / 2; f.position.y = 0.72; pm.add(f);
      // (the handle stays upright: turning its bone would also lift the top of the pail's rim)
    }
    pm.add(blobShadow(kind === 'pail' ? 1.2 : 1.3));
    const phys = { pail: { y: 0.72, r: 1.12, h: 1.1 }, bowl: { y: 0.6, r: 1.2, h: 1.1 } }[kind] || { y: 0.62, r: 1.15, h: 1.1 };
    return { kind: kind === 'pail' || kind === 'bowl' ? kind : 'basket', obj: pm, phys };
  }
  if (kind === 'pail') {
    const g = new T.Group();
    const b = mesh(geo.cyl(1.35, 1.05, 1.1, 24), 0x4fb0ff, { outline: 0.04 });
    b.position.y = 0.55;
    const rim = mesh(geo.torus(1.35, 0.09, Math.PI * 2, 8, 32), 0x2f86d6, { outline: 0.025 });
    rim.rotation.x = Math.PI / 2; rim.position.y = 1.1;
    const inside = new T.Mesh(geo.circle(1.3, 28), basic(0x23507a));
    inside.rotation.x = -Math.PI / 2; inside.position.y = 0.72;
    const handle = mesh(geo.torus(1.3, 0.05, Math.PI, 6, 24), 0x8a8f99, { outline: 0.015 });
    handle.position.set(0, 1.1, -0.1); handle.rotation.x = -0.35;
    // a little flower sticker on the front
    for (let i = 0; i < 5; i++) {
      const p = new T.Mesh(geo.circle(0.13, 10), basic(0xffffff));
      const a = (i / 5) * Math.PI * 2;
      p.position.set(Math.cos(a) * 0.16, 0.6 + Math.sin(a) * 0.16, 1.24);
      g.add(p);
    }
    const mid = new T.Mesh(geo.circle(0.1, 10), basic(C.yellow));
    mid.position.set(0, 0.6, 1.25);
    g.add(b, rim, inside, handle, mid, blobShadow(1.2));
    return { kind, obj: g, phys: { y: 0.72, r: 1.12, h: 1.1 } };
  }
  if (kind === 'bowl') {
    const g = new T.Group();
    const b = mesh(geo.cyl(1.5, 0.85, 0.9, 28), 0x8fd3ff, { outline: 0.04 });
    b.position.y = 0.5;
    const foot = mesh(geo.cyl(0.8, 0.9, 0.12, 24), 0xfff6ee, { outline: 0.02 });
    foot.position.y = 0.06;
    g.add(foot);
    const band = mesh(geo.torus(1.36, 0.06, Math.PI * 2, 6, 32), 0xff7ab8, { outline: 0 });
    band.rotation.x = Math.PI / 2; band.position.y = 0.55;
    const rim = mesh(geo.torus(1.5, 0.08, Math.PI * 2, 8, 32), 0xfff6ee, { outline: 0.025 });
    rim.rotation.x = Math.PI / 2; rim.position.y = 0.95;
    const inside = new T.Mesh(geo.circle(1.45, 28), basic(0x5fa8d8));
    inside.rotation.x = -Math.PI / 2; inside.position.y = 0.6;
    // polka dots
    for (let i = 0; i < 6; i++) {
      const a = -0.9 + i * 0.36;
      const d = new T.Mesh(geo.circle(0.09, 10), basic(0xffffff));
      d.position.set(Math.sin(a) * 1.24, 0.72, Math.cos(a) * 1.24 + 0.04);
      d.rotation.y = a;
      g.add(d);
    }
    g.add(b, band, rim, inside, blobShadow(1.3));
    return { kind, obj: g, phys: { y: 0.6, r: 1.2, h: 1.1 } };
  }
  // the hedgehog's wicker basket, filled with straw so the fruit sits up where you can see it
  const g = new T.Group();
  const b = mesh(geo.cyl(1.5, 1.1, 1.0, 24), 0xc98b4f, { outline: 0.04 });
  b.position.y = 0.5;
  const rim = mesh(geo.torus(1.5, 0.12, Math.PI * 2, 8, 32), 0xa86f3a, { outline: 0.03 });
  rim.rotation.x = Math.PI / 2; rim.position.y = 1.0;
  const inside = new T.Mesh(geo.circle(1.42, 28), basic(0xe8c56a));
  inside.rotation.x = -Math.PI / 2; inside.position.y = 0.62;
  for (let i = 0; i < 3; i++) {
    const band = mesh(geo.torus(1.3 + i * 0.07, 0.04, Math.PI * 2, 6, 32), 0xa86f3a, { outline: 0 });
    band.rotation.x = Math.PI / 2; band.position.y = 0.25 + i * 0.25;
    g.add(band);
  }
  g.add(b, rim, inside, blobShadow(1.3));
  return { kind: 'basket', obj: g, phys: { y: 0.62, r: 1.15, h: 1.1 } };
}
