// Shape house facades, one per level: L1 a cottage, L2 a toy train, L3 a castle.
// Each facade gives: windows style, a door (optional), a spout things pop out of, six progress lamps,
// a physics wall, a little "hooray" action, and the goodies that tumble out of a filled window.
import * as T from '../three.js';
import { mesh, geo, toon, basic } from '../engine/toon.js';
import { C } from '../engine/actors.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';
import { prop } from './view-tools.js';
import { toonUnique } from '../engine/toon.js';

// a Blender facade part placed in the theme group (null when not built: callers keep the code-built part)
function part(g, kind, x, y, z, opts) { const w = prop(kind, opts); if (w) { w.position.set(x, y, z); g.add(w); } return w; }
function layerTint(w, name, col) { const l = w && w.userData.layers[name]; if (l) l.mesh.material = toonUnique(col, { vertexColors: true }); }

export const WALL_Z = -1;

// Blender bulbs: hung higher so they clear the window frames (they hang from the eaves / sit on the train roof)
const BULB_Y = { 4.35: 4.47, 4.2: 4.47 };
function lamps(g, y, z, col = 0xdde4ef, onRoof = false) {
  const out = [];
  for (let i = 0; i < 6; i++) {
    // fairy-light bulbs (the game re-tints one per round as it lights up)
    const b = part(g, 'prop_m_lamp', -3.75 + i * 1.5, onRoof ? 5.42 : (BULB_Y[y] ?? y), onRoof ? WALL_Z - 0.2 : z, { tint: col });
    if (b) { if (onRoof) b.userData.model.rotation.z = Math.PI; else b.rotation.z = (i % 2 ? 0.08 : -0.08); out.push(b); continue; }
    const l = mesh(geo.sphere(0.24, 14, 10), col, { outline: 0.025 });
    l.position.set(-3.75 + i * 1.5, y, z);
    g.add(l);
    out.push(l);
  }
  return out;
}

function house() {
  const g = new T.Group();
  if (part(g, 'prop_m_cottage', 0, 0, WALL_Z - 0.35)) {
    const chimney = part(g, 'prop_m_chimney', 3, 5.8, WALL_Z - 0.35);
    const hinge = new T.Group();
    hinge.position.set(-0.7, 0.85, WALL_Z); // the Blender door is 1.7 tall (clear of the window box above)
    part(hinge, 'prop_m_door', 0.7, 0, 0);
    g.add(hinge);
    return houseTheme(g, chimney, hinge);
  }
  const wall = mesh(geo.box(9.4, 4.6, 0.6), 0xfff1d6, { hull: 1.015 });
  wall.position.set(0, 2.3, WALL_Z - 0.35);
  const roofShape = new T.Shape();
  roofShape.moveTo(-5.4, 0); roofShape.lineTo(5.4, 0); roofShape.lineTo(0, 2.4); roofShape.closePath();
  const roofGeo = new T.ExtrudeGeometry(roofShape, { depth: 1.2, bevelEnabled: false });
  roofGeo.translate(0, 0, -0.6);
  const roof = mesh(roofGeo, 0xff6b5a, { hull: 1.02 });
  roof.position.set(0, 4.6, WALL_Z - 0.35);
  const chimney = mesh(geo.box(0.7, 1.4, 0.7), 0xd9594a, { hull: 1.06 });
  chimney.position.set(3, 5.8, WALL_Z - 0.35);
  const hinge = new T.Group();
  hinge.position.set(-0.7, 0.95, WALL_Z);
  const door = mesh(geo.box(1.4, 1.9, 0.15), 0x9a6a44, { hull: 1.05 });
  door.position.x = 0.7;
  const knob = mesh(geo.sphere(0.1, 8, 6), C.yellow, { outline: 0.02 });
  knob.position.set(1.15, 0, 0.12);
  hinge.add(door, knob);
  const doorway = mesh(geo.box(1.4, 1.9, 0.05), 0x3a2f5b, { outline: 0 });
  doorway.position.set(0, 0.95, WALL_Z - 0.06);
  g.add(wall, roof, chimney, doorway, hinge);
  return houseTheme(g, chimney, hinge);
}
function houseTheme(g, chimney, hinge) {
  return {
    id: 'house', group: g, door: hinge, doorAxis: 'y', doorOpen: -1.6, doorPos: new T.Vector3(0, 0.9, WALL_Z + 0.3),
    spout: chimney, spoutTop: new T.Vector3(3, 6.6, WALL_Z - 0.35),
    lamps: lamps(g, 4.35, WALL_Z + 0.05), lampOn: C.yellow,
    hole: { rim: 0xf3d7a6, box: 0xb5764a, flowers: true },
    wallBox: [new T.Vector3(0, 2.3, WALL_Z - 0.35), new T.Vector3(9.4, 4.6, 0.6)],
    // chimney puffs a cloud
    hooray(s) {
      s.anim(0.6, (_, q) => { const k = Math.sin(q * Math.PI) * 0.25; chimney.scale.set(1 + k, 1 - k * 0.6, 1 + k); });
      for (let i = 0; i < 3; i++) s.wait(i * 0.25).then(() => fx.float(new T.Vector3(3 + (i - 1) * 0.3, 6.7, WALL_Z), '☁', { color: '#ffffff', size: 6 + i * 2 }));
    },
  };
}

function train() {
  const g = new T.Group();
  if (part(g, 'prop_m_train', 0, 0, WALL_Z - 0.35)) {
    const funnel = part(g, 'prop_m_funnel', 6.9, 3.85, WALL_Z - 0.35);
    const wheels = [];
    for (const x of [-3.6, -1.2, 1.2, 3.6, 5.4, 6.9]) {
      const w = new T.Group();
      w.position.set(x, 0.62, WALL_Z + 0.15);
      part(w, 'prop_m_wheel', 0, 0, 0);
      g.add(w);
      wheels.push(w);
    }
    return trainTheme(g, funnel, wheels);
  }
  const body = mesh(geo.box(9.4, 3.3, 0.7), 0x4a90ff, { hull: 1.015 });
  body.position.set(0, 3.05, WALL_Z - 0.35);
  const stripe = mesh(geo.box(9.5, 0.22, 0.72), C.yellow, { outline: 0 });
  stripe.position.set(0, 1.75, WALL_Z - 0.34);
  const roof = mesh(geo.box(10, 0.4, 1.3), 0xff5a5a, { hull: 1.03 });
  roof.position.set(0, 4.9, WALL_Z - 0.35);
  const base = mesh(geo.box(9.8, 0.4, 1.0), 0x4a3a5a, { hull: 1.03 });
  base.position.set(0, 1.25, WALL_Z - 0.35);
  g.add(body, stripe, roof, base);
  // the engine at the front, with a funnel
  const boiler = mesh(geo.cyl(1.05, 1.05, 2.2, 22), 0x3bb273, { hull: 1.03 });
  boiler.rotation.z = Math.PI / 2;
  boiler.position.set(6.4, 2.35, WALL_Z - 0.35);
  const cab = mesh(geo.box(1.4, 2.6, 1.3), 0x3bb273, { hull: 1.03 });
  cab.position.set(5.2, 2.7, WALL_Z - 0.35);
  const cabRoof = mesh(geo.box(1.7, 0.3, 1.5), 0xff5a5a, { hull: 1.04 });
  cabRoof.position.set(5.2, 4.1, WALL_Z - 0.35);
  const funnel = mesh(geo.cyl(0.42, 0.3, 1.2, 16), 0x4a3a5a, { hull: 1.05 });
  funnel.position.set(6.9, 3.85, WALL_Z - 0.35);
  const lampF = mesh(geo.sphere(0.25, 12, 8), C.yellow, { outline: 0.02 });
  lampF.position.set(7.55, 2.35, WALL_Z - 0.35);
  g.add(boiler, cab, cabRoof, funnel, lampF);
  // wheels that spin
  const wheels = [];
  for (const x of [-3.6, -1.2, 1.2, 3.6, 5.4, 6.9]) {
    const w = new T.Group();
    const tyre = mesh(geo.cyl(0.62, 0.62, 0.25, 20), 0x4a3a5a, { hull: 1.06 });
    tyre.rotation.x = Math.PI / 2;
    const hub = mesh(geo.cyl(0.3, 0.3, 0.27, 12), C.red, { outline: 0 });
    hub.rotation.x = Math.PI / 2;
    const spoke = mesh(geo.box(1.0, 0.12, 0.28), C.yellow, { outline: 0 });
    w.add(tyre, hub, spoke);
    w.position.set(x, 0.62, WALL_Z + 0.15);
    g.add(w);
    wheels.push(w);
  }
  return trainTheme(g, funnel, wheels);
}
function trainTheme(g, funnel, wheels) {
  return {
    id: 'train', group: g, door: null,
    spout: funnel, spoutTop: new T.Vector3(6.9, 4.6, WALL_Z - 0.35),
    lamps: lamps(g, 4.32, WALL_Z + 0.05, 0xdde4ef, !!funnel?.userData?.model), lampOn: C.yellow,
    hole: { rim: C.yellow, box: 0x2f6fd6, flowers: false },
    wallBox: [new T.Vector3(0, 2.9, WALL_Z - 0.35), new T.Vector3(9.4, 3.6, 0.7)],
    // toot toot: wheels spin, the train rocks, steam puffs
    hooray(s) {
      const r0 = wheels.map((w) => w.rotation.z);
      s.anim(1.2, (e) => wheels.forEach((w, i) => (w.rotation.z = r0[i] - e * Math.PI * 4)), Ease.inOut);
      s.anim(0.9, (_, q) => { g.position.x = Math.sin(q * Math.PI * 3) * 0.06 * (1 - q); });
      for (let i = 0; i < 3; i++) s.wait(i * 0.25).then(() => fx.float(new T.Vector3(6.9 + i * 0.2, 4.7, WALL_Z), '☁', { color: '#ffffff', size: 5 + i * 2 }));
    },
  };
}

function castle() {
  const g = new T.Group();
  if (part(g, 'prop_m_castlewall', 0, 0, WALL_Z - 0.35)) {
    const flags = [], towers = [];
    for (const sx of [-1, 1]) {
      const t = part(g, 'prop_m_tower', sx * 5.9, 0, WALL_Z - 0.35);
      layerTint(t, 'roof', sx < 0 ? 0x9b6bd9 : 0x4a90ff);
      const flagPivot = new T.Group();
      flagPivot.position.set(sx * 5.9, 7.95, WALL_Z - 0.35);
      part(flagPivot, 'prop_m_flag', 0.03, 0, 0, { tint: sx < 0 ? C.pink : C.yellow });
      g.add(flagPivot);
      flags.push(flagPivot); towers.push(t);
    }
    const hinge = new T.Group();
    hinge.position.set(0, 0.05, WALL_Z + 0.02);
    part(hinge, 'prop_m_bridge', 0, 0, 0);
    g.add(hinge);
    return castleTheme(g, hinge, towers, flags);
  }
  const stone = 0xd8d2e6;
  const wall = mesh(geo.box(9.4, 4.6, 0.7), stone, { hull: 1.015 });
  wall.position.set(0, 2.3, WALL_Z - 0.35);
  g.add(wall);
  for (let i = 0; i < 8; i++) {
    const c = mesh(geo.box(0.7, 0.6, 0.7), stone, { hull: 1.04 });
    c.position.set(-4.35 + i * 1.243, 4.9, WALL_Z - 0.35);
    g.add(c);
  }
  // stone dabs
  for (let i = 0; i < 10; i++) {
    const d = mesh(geo.box(0.5, 0.22, 0.05), 0xc2bad6, { outline: 0 });
    d.position.set(-4 + ((i * 2.3) % 8.2), 0.5 + ((i * 1.7) % 1.2), WALL_Z + 0.01);
    g.add(d);
  }
  const flags = [];
  const towers = [];
  for (const sx of [-1, 1]) {
    const t = mesh(geo.cyl(1.05, 1.15, 5.6, 20), stone, { hull: 1.03 });
    t.position.set(sx * 5.9, 2.8, WALL_Z - 0.35);
    const cone = mesh(geo.cone(1.35, 1.8, 20), sx < 0 ? 0x9b6bd9 : 0x4a90ff, { hull: 1.04 });
    cone.position.set(sx * 5.9, 6.5, WALL_Z - 0.35);
    const pole = mesh(geo.cyl(0.04, 0.04, 0.9, 6), 0x5a4a3a, { outline: 0 });
    pole.position.set(sx * 5.9, 7.7, WALL_Z - 0.35);
    const flagPivot = new T.Group();
    flagPivot.position.set(sx * 5.9, 7.95, WALL_Z - 0.35);
    const flag = mesh(geo.box(0.7, 0.4, 0.04), sx < 0 ? C.pink : C.yellow, { outline: 0.015 });
    flag.position.x = 0.35;
    flagPivot.add(flag);
    const win = mesh(geo.box(0.35, 0.8, 0.05), 0x3a2f5b, { outline: 0 });
    win.position.set(sx * 5.9, 4.4, WALL_Z + 0.75);
    g.add(t, cone, pole, flagPivot, win);
    flags.push(flagPivot);
    towers.push(t);
  }
  // drawbridge gate
  const arch = mesh(new T.CircleGeometry(0.9, 20, 0, Math.PI), 0x3a2f5b, { outline: 0 });
  arch.position.set(0, 1.4, WALL_Z - 0.03);
  const gap = mesh(geo.box(1.8, 1.4, 0.06), 0x3a2f5b, { outline: 0 });
  gap.position.set(0, 0.7, WALL_Z - 0.03);
  const hinge = new T.Group();
  hinge.position.set(0, 0.05, WALL_Z + 0.02);
  const bridge = mesh(geo.box(1.8, 2.2, 0.15), 0xa8763e, { hull: 1.05 });
  bridge.position.y = 1.1;
  for (let i = 0; i < 3; i++) {
    const plank = mesh(geo.box(1.82, 0.06, 0.17), 0x7c5428, { outline: 0 });
    plank.position.y = -0.55 + i * 0.6;
    bridge.add(plank);
  }
  hinge.add(bridge);
  g.add(arch, gap, hinge);
  return castleTheme(g, hinge, towers, flags);
}
function castleTheme(g, hinge, towers, flags) {
  return {
    id: 'castle', group: g, door: hinge, doorAxis: 'x', doorOpen: 1.45, doorPos: new T.Vector3(0, 0.9, WALL_Z + 0.4),
    spout: towers[1], spoutTop: new T.Vector3(5.9, 7.4, WALL_Z - 0.35),
    lamps: lamps(g, 4.2, WALL_Z + 0.05, 0xdde4ef), lampOn: 0xffb03b,
    hole: { rim: 0xb9b0cc, box: 0x9a90b0, flowers: false },
    wallBox: [new T.Vector3(0, 2.3, WALL_Z - 0.35), new T.Vector3(9.4, 4.6, 0.7)],
    // flags flap, fireworks pop over the towers
    hooray(s) {
      // the flags flap (quietly: the success chime is the sound, the window's confetti the effect)
      const r0 = flags.map((f) => f.rotation.y);
      s.anim(1.2, (_, q) => flags.forEach((f, i) => (f.rotation.y = r0[i] + Math.sin(q * Math.PI * 4) * 0.5 * (1 - q))));
    },
  };
}

export const THEMES = { house, train, castle };

// ---- goodies that tumble out of a filled window (physics bodies) ----
const GOODIE = {
  flowers: () => {
    const g = new T.Group();
    const cols = [C.pink, C.purple, C.red, C.yellow];
    const col = cols[Math.floor(Math.random() * cols.length)];
    for (let i = 0; i < 5; i++) {
      const p = mesh(geo.sphere(0.09, 8, 6), col, { outline: 0.012 });
      const a = (i / 5) * Math.PI * 2;
      p.position.set(Math.cos(a) * 0.1, Math.sin(a) * 0.1, 0);
      g.add(p);
    }
    g.add(mesh(geo.sphere(0.07, 8, 6), 0xffffff, { outline: 0 }));
    return g;
  },
  apples: () => {
    const g = new T.Group();
    g.add(mesh(geo.sphere(0.17, 12, 10), Math.random() < 0.5 ? C.red : C.green, { outline: 0.02 }));
    const st = mesh(geo.cyl(0.02, 0.02, 0.12, 5), 0x6b4a2a, { outline: 0 });
    st.position.y = 0.18;
    g.add(st);
    return g;
  },
  balls: () => mesh(geo.sphere(0.17, 12, 10), [C.red, C.blue, C.yellow, C.green, C.orange][Math.floor(Math.random() * 5)], { outline: 0.02 }),
  stars: () => mesh(new T.OctahedronGeometry(0.2), C.yellow, { outline: 0.02 }),
  coins: () => { const m = mesh(geo.cyl(0.18, 0.18, 0.06, 14), 0xffc93b, { outline: 0.015 }); m.rotation.x = Math.PI / 2; const g = new T.Group(); g.add(m); return g; },
  gems: () => mesh(new T.OctahedronGeometry(0.19), [0x9b6bd9, 0x3bc6d9, 0xff5aa8, 0x5ad97a][Math.floor(Math.random() * 4)], { outline: 0.02 }),
  candy: () => {
    const g = new T.Group();
    const col = [C.pink, C.orange, C.purple][Math.floor(Math.random() * 3)];
    g.add(mesh(geo.sphere(0.13, 10, 8), col, { outline: 0.02 }));
    for (const sx of [-1, 1]) { const w = mesh(geo.cone(0.1, 0.14, 8), col, { outline: 0.015 }); w.rotation.z = sx * Math.PI / 2; w.position.x = sx * 0.17; g.add(w); }
    return g;
  },
};
// Blender goodies: [kind, scale, tint options]
const GOODIE_PROP = {
  flowers: () => ['prop_m_flower', 0.42, { tint: [C.pink, C.purple, C.red, C.yellow][Math.floor(Math.random() * 4)] }, -0.12],
  apples: () => ['prop_m_apple', 0.36, { tint: Math.random() < 0.5 ? 0xff4b4b : 0x9ed64a }],
  balls: () => ['prop_m_toyball', 0.4, { tint: [C.red, C.blue, C.yellow, C.green, C.orange][Math.floor(Math.random() * 5)], hide: ['dots', 'star'], face: false }],
  stars: () => ['prop_m_puffstar', 0.42, { tint: C.yellow }],
  coins: () => ['prop_m_coin', 1.0, {}],
  gems: () => ['prop_m_gem', 1.0, { tint: [0x9b6bd9, 0x3bc6d9, 0xff5aa8, 0x5ad97a][Math.floor(Math.random() * 4)] }],
  candy: () => ['prop_m_sweet', 0.42, { tint: [C.pink, C.orange, C.purple][Math.floor(Math.random() * 3)] }],
};
export function makeGoodie(type) {
  const P = (GOODIE_PROP[type] || GOODIE_PROP.balls)();
  const pm = prop(P[0], P[2]);
  if (pm) { pm.scale.setScalar(P[1]); if (P[3]) pm.position.y = P[3]; const g = new T.Group(); g.add(pm); return g; }
  return (GOODIE[type] || GOODIE.balls)();
}

// ---- per-round accessories (gags) on a piece; top = local y of the piece's top edge ----
const GAG_PROP = { hat: ['prop_m_partyhat', 1, [0, 0, -0.25], 0], bow: ['prop_m_bow', 1, [0, 0, 0], 0.08], crown: ['prop_m_crown', 1, [0, 0, 0], 0],
  flower: ['prop_m_flower', 0.72, [0, 0, 0.1], 0, { tint: C.pink }], glasses: ['prop_m_glasses', 1, [0, 0, 0], 0] };
export function addGag(p, gag, top) {
  const G = GAG_PROP[gag];
  const pm = G && prop(G[0], G[4] || {});
  if (pm) {
    const g = new T.Group();
    pm.scale.setScalar(G[1]);
    g.add(pm);
    g.rotation.set(...G[2]);
    if (gag === 'glasses') { g.position.set(0, (p.userData.kind === 'triangle' ? 0.08 : 0.14), 0.3); p.userData.inner.add(g); return g; }
    g.position.y = top - 0.05 + G[3];
    p.add(g);
    return g;
  }
  const g = new T.Group();
  if (gag === 'hat') {
    const hat = mesh(geo.cone(0.28, 0.5, 14), C.pink, { outline: 0.02 });
    hat.position.y = 0.25;
    const pom = mesh(geo.sphere(0.08, 8, 6), C.yellow, { outline: 0.015 });
    pom.position.y = 0.52;
    g.add(hat, pom);
    g.rotation.z = -0.25;
  } else if (gag === 'bow') {
    for (const sx of [-1, 1]) { const b = mesh(geo.cone(0.14, 0.26, 10), C.red, { outline: 0.015 }); b.rotation.z = sx * Math.PI / 2; b.position.x = sx * 0.13; g.add(b); }
    g.add(mesh(geo.sphere(0.07, 8, 6), C.red, { outline: 0.015 }));
    g.position.y = 0.05;
  } else if (gag === 'flower') {
    const st = mesh(geo.cyl(0.025, 0.025, 0.35, 5), 0x3bb273, { outline: 0 });
    st.position.y = 0.17;
    g.add(st);
    const f = GOODIE.flowers(); f.position.y = 0.38; g.add(f);
  } else if (gag === 'crown') {
    const band = mesh(geo.cyl(0.26, 0.26, 0.18, 12, true), 0xffc93b, { outline: 0.02 });
    band.position.y = 0.1;
    g.add(band);
    for (let i = 0; i < 5; i++) { const sp = mesh(geo.cone(0.06, 0.16, 6), 0xffc93b, { outline: 0.012 }); const a = (i / 5) * Math.PI * 2; sp.position.set(Math.cos(a) * 0.22, 0.26, Math.sin(a) * 0.22); g.add(sp); }
  } else if (gag === 'glasses') {
    for (const sx of [-1, 1]) { const r = mesh(geo.torus(0.12, 0.03, Math.PI * 2, 6, 14), 0x3a2838, { outline: 0 }); r.position.set(sx * 0.18, 0, 0); g.add(r); }
    const br = mesh(geo.box(0.12, 0.03, 0.03), 0x3a2838, { outline: 0 });
    g.add(br);
    // sits on the eyes, not the top
    g.position.set(0, (p.userData.kind === 'triangle' ? 0.08 : 0.14), 0.3);
    p.userData.inner.add(g);
    return g;
  } else return null;
  g.position.y += top - 0.05;
  p.add(g);
  return g;
}

export { toon, basic };
