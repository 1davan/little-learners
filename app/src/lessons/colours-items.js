// Colour tubes helpers: containers with faces that gulp (glass tube / wicker basket / toy bucket, one style per level),
// and the themed things that get sorted (bouncy toys / fruit / craft things).
// Every item is built so its colour dominates (only white / ink details), because colour is the one thing to match.
// Each item carries userData.phys: the rigid-body options it is simulated with when it falls into a container.
import * as T from '../three.js';
import { mesh, geo, toon, toonUnique, basic, ink } from '../engine/toon.js';
import { C } from '../engine/actors.js';
import { prop } from './view-tools.js';

export const COL = { red: C.red, blue: C.blue, yellow: C.yellow, green: C.green };
const tint = (c, k) => new T.Color(c).lerp(new T.Color(0xffffff), k).getHex();
const shade = (c, k) => new T.Color(c).lerp(new T.Color(0x000000), k).getHex();

// ---------------- containers with a face ----------------
// style: 'tube' (tall glass, L1), 'basket' (short wicker, L2), 'bucket' (tapered toy bucket with a handle, L3)
const STYLE = {
  tube: { r: 0.95, rb: 0.95, h: 3.0, faceY: 2.3 },
  basket: { r: 1.25, rb: 1.0, h: 1.5, faceY: 0.95 },
  bucket: { r: 1.15, rb: 0.88, h: 1.9, faceY: 1.15 },
};
export function containerDims(style) { return STYLE[style] || STYLE.tube; }

// Blender walls per style (tinted to the container's colour): model, scale, physics inner radius / floor, face depth.
const MODEL = {
// floor: a raised false floor (physics + a dark disc) so the pile shows over the rim from the low camera.
  tube: { kind: 'prop_m_ctube', inner: 0.84, floor: 2.45, faceZ: 0.02 },
  basket: { kind: 'prop_m_cbasket', size: 0.94, inner: 0.8, floor: 0.85, faceZ: 0.03 }, // 0.94: four in a row never touch
  bucket: { kind: 'prop_bucket', size: [1.15, 1.9 / 1.3, 1.15], hide: ['deco'], inner: 0.85, floor: 1.15, faceZ: 0.05 },
};

export function makeTube(color, style = 'tube') {
  const S = containerDims(style), c = COL[color];
  const g = new T.Group();
  const body = new T.Group(); // squash/stretch happens on this, so layout tweens on g stay clean
  g.add(body);
  const baseH = 0.32;
  let glass;
  const M = MODEL[style] || MODEL.tube;
  const pm = prop(M.kind, { tint: c, size: M.size, hide: M.hide });
  if (pm) {
    body.add(pm);
    // (the bucket's handle stays upright: its bone also carries the top of the rim, which would bulge if it turned)
    const ins = new T.Mesh(geo.circle(M.inner + 0.04, 28), toon(shade(c, 0.5)));
    ins.rotation.x = -Math.PI / 2; ins.position.y = M.floor;
    body.add(ins);
    glass = new T.Object3D(); // tap / hint / halo target in the middle of the wall
    glass.position.y = S.h / 2 + 0.1;
    body.add(glass);
  } else if (style === 'tube') {
    // opaque, saturated wall (a see-through tube let the grass show through: red read as brown)
    glass = mesh(geo.cyl(0.95, 0.95, 3, 28, true), 0, { outline: 0.04, mat: toonUnique(c, { side: T.DoubleSide }) });
    glass.position.y = 1.65;
    const inner = new T.Mesh(geo.cyl(0.9, 0.9, 0.2, 28), toon(shade(c, 0.45)));
    inner.position.y = 2.95; // dark inside visible over the rim
    const shineL = new T.Mesh(geo.box(0.12, 2.3, 0.02), basic(0xffffff, { transparent: true, opacity: 0.55 }));
    shineL.position.set(-0.62, 1.55, 0.7); shineL.rotation.y = -0.72;
    body.add(inner, shineL);
    const base = mesh(geo.cyl(1.08, 1.12, baseH, 28), c, { outline: 0.04 });
    base.position.y = baseH / 2;
    body.add(glass, base);
  } else {
    // opaque wall, open top, a darker inside and a floor disc
    const wallMat = toonUnique(style === 'basket' ? tint(c, 0.12) : c, { side: T.DoubleSide });
    glass = mesh(geo.cyl(S.r, S.rb, S.h, 28, true), 0, { outline: 0.04, mat: wallMat });
    glass.position.y = S.h / 2 + 0.05;
    const floor = new T.Mesh(geo.cyl(S.rb, S.rb, 0.12, 24), toon(shade(c, 0.35)));
    floor.position.y = 0.11;
    body.add(glass, floor);
    if (style === 'basket') {
      // woven bands and little side handles
      for (let i = 0; i < 3; i++) {
        const y = 0.3 + i * 0.42, k = y / S.h, rr = S.rb + (S.r - S.rb) * k + 0.03;
        const band = new T.Mesh(geo.torus(rr, 0.05, Math.PI * 2, 6, 32), toon(shade(c, 0.18)));
        band.rotation.x = Math.PI / 2; band.position.y = y + 0.05;
        body.add(band);
      }
      for (const s of [-1, 1]) {
        const ear = mesh(geo.torus(0.24, 0.07, Math.PI, 6, 14), shade(c, 0.1), { outline: 0.02 });
        ear.position.set(s * (S.r + 0.02), S.h - 0.15, 0);
        ear.rotation.set(0, Math.PI / 2, s * Math.PI / 2);
        body.add(ear);
      }
    } else {
      // bucket: a handle that rests tilted behind the opening + white stripe
      const handle = mesh(geo.torus(S.r * 0.98, 0.05, Math.PI, 6, 22), 0xb8c4d0, { outline: 0.02 });
      handle.position.set(0, S.h, -0.1);
      handle.rotation.x = -1.0;
      const stripe = new T.Mesh(geo.cyl(S.rb + (S.r - S.rb) * 0.3 + 0.03, S.rb + (S.r - S.rb) * 0.18 + 0.03, 0.16, 28, true), basic(0xffffff));
      stripe.position.y = 0.45;
      body.add(handle, stripe);
    }
  }
  const mouthY = (style === 'tube' ? 3.15 : S.h + 0.05);
  if (!pm) {
    const rim = mesh(geo.torus(S.r + 0.02, style === 'basket' ? 0.14 : 0.12, Math.PI * 2, 10, 32), style === 'basket' ? shade(c, 0.15) : c, { outline: 0.03 });
    rim.rotation.x = Math.PI / 2;
    rim.position.y = mouthY;
    body.add(rim);
  }

  // face
  const face = new T.Group();
  const fr = S.rb + (S.r - S.rb) * (S.faceY / S.h);
  face.position.set(0, S.faceY, fr + (pm ? M.faceZ : 0.02));
  face.rotation.x = -Math.atan2(S.r - S.rb, S.h); // lean back with a tapered wall
  body.add(face);
  const eyes = [], whites = [];
  for (const s of [-1, 1]) {
    const w = mesh(geo.sphere(0.26, 16, 12), 0xffffff, { outline: 0.03 });
    w.position.set(s * 0.34, 0.3, 0);
    const p = ink(geo.sphere(0.13, 12, 8));
    p.position.set(0, 0, 0.17);
    const shine = new T.Mesh(geo.sphere(0.04, 6, 4), basic(0xffffff));
    shine.position.set(0.05, 0.05, 0.11);
    p.add(shine);
    w.add(p);
    face.add(w);
    eyes.push(p); whites.push(w);
  }
  const smile = ink(geo.torus(0.22, 0.05, Math.PI, 6, 20));
  smile.rotation.z = Math.PI;
  smile.position.set(0, -0.08, 0.02);
  const mouth = ink(geo.sphere(0.26, 18, 12)); // open "ooh / gulp" mouth, scaled by the lesson
  mouth.position.set(0, -0.12, 0);
  mouth.scale.set(1, 0.001, 0.25);
  const tongue = new T.Mesh(geo.sphere(0.14, 10, 8), basic(0xff7a8a));
  tongue.position.set(0, -0.45, 0.6);
  tongue.scale.set(1, 0.6, 0.3);
  mouth.add(tongue);
  const cheeks = [];
  for (const s of [-1, 1]) {
    const ch = new T.Mesh(geo.sphere(0.13, 10, 8), basic(C.cheek));
    ch.position.set(s * 0.58, -0.05, -0.02);
    ch.scale.set(1, 0.6, 0.3);
    face.add(ch);
    cheeks.push(ch);
  }
  face.add(smile, mouth);
  // a ring that slides down the wall when it swallows ("gulp")
  const bulge = mesh(geo.torus(1, 0.12, Math.PI * 2, 8, 28), c, { outline: 0.025 }); // radius set per height (wallR)
  bulge.rotation.x = Math.PI / 2;
  bulge.visible = false;
  body.add(bulge);
  const phys = pm ? { r: M.inner, floor: M.floor } : { r: S.rb - 0.02, floor: style === 'tube' ? 0.32 : 0.17 };
  const wallR = (y) => (S.rb + (S.r - S.rb) * Math.min(1, y / S.h)) + (style === 'basket' && pm ? 0.12 : 0.06);
  g.userData = { color, style, dims: S, phys: null, physDims: phys, wallR, mouthY, count: 0, items: [], eyes, whites, glass, body, face, smile, mouth, cheeks, bulge, open: 0, forceOpen: null };
  return g;
}

// ---------------- items ----------------
function hiLight(parent, x, y, z, r = 0.08) {
  const h = new T.Mesh(geo.sphere(r, 8, 6), basic(0xffffff));
  h.position.set(x, y, z);
  parent.add(h);
}
const extrudeCache = {};
function flatShape(key, build, depth = 0.3) {
  if (!extrudeCache[key]) {
    const s = new T.Shape();
    build(s);
    const g = new T.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 2, curveSegments: 24 });
    g.center();
    g.userData.shared = true;
    extrudeCache[key] = g;
  }
  return extrudeCache[key];
}
const wedgeCache = {};
function wedge(i) {
  if (!wedgeCache[i]) { wedgeCache[i] = new T.SphereGeometry(0.447, 10, 14, (i / 6) * Math.PI * 2, Math.PI / 3); wedgeCache[i].userData.shared = true; }
  return wedgeCache[i];
}
function eyesOn(m, z, y = 0.06, sp = 0.12, r = 0.05) {
  for (const s of [-1, 1]) { const e = ink(geo.sphere(r, 8, 6)); e.position.set(s * sp, y, z); m.add(e); }
}

const BALL = { shape: 'ball', r: 0.44, bounce: 0.62 };
const MAKE = {
  // ---- Level 1: bouncy toys ----
  ball(c, b) {
    const m = mesh(geo.sphere(0.44, 22, 16), c, { outline: 0.035 });
    const band = new T.Mesh(geo.torus(0.445, 0.05, Math.PI * 2, 6, 30), basic(0xffffff));
    band.rotation.y = Math.PI / 2;
    m.add(band);
    hiLight(m, -0.16, 0.2, 0.36, 0.09);
    b.add(m);
    return BALL;
  },
  beachball(c, b) {
    const m = mesh(geo.sphere(0.44, 24, 16), c, { outline: 0.035 });
    for (const i of [0, 2, 4]) m.add(new T.Mesh(wedge(i), basic(0xffffff)));
    const cap = new T.Mesh(geo.cyl(0.1, 0.1, 0.03, 12), basic(0xffffff));
    cap.position.y = 0.445; m.add(cap);
    m.rotation.x = 0.5;
    b.add(m);
    return { ...BALL, bounce: 0.7 };
  },
  smiley(c, b) {
    const m = mesh(geo.sphere(0.44, 22, 16), c, { outline: 0.035 });
    eyesOn(m, 0.41, 0.1, 0.13, 0.055);
    const sm = ink(geo.torus(0.15, 0.035, Math.PI, 6, 16));
    sm.rotation.z = Math.PI; sm.position.set(0, -0.04, 0.4);
    m.add(sm);
    hiLight(m, -0.2, 0.24, 0.3, 0.07);
    b.add(m);
    return { ...BALL, bounce: 0.6 };
  },
  pompom(c, b) {
    const core = mesh(geo.sphere(0.34, 16, 12), c, { outline: 0.03 });
    b.add(core);
    for (let i = 0; i < 14; i++) {
      const y = 1 - (i / 13) * 2, rr = Math.sqrt(1 - y * y), a = i * 2.4;
      const f = mesh(geo.sphere(0.16, 10, 8), c, { outline: 0.02 });
      f.position.set(Math.cos(a) * rr * 0.33, y * 0.33, Math.sin(a) * rr * 0.33);
      b.add(f);
    }
    eyesOn(b, 0.46, 0.05, 0.1, 0.05);
    return { shape: 'ball', r: 0.45, bounce: 0.25, friction: 1 };
  },
  dotty(c, b) {
    const m = mesh(geo.sphere(0.44, 22, 16), c, { outline: 0.035 });
    for (let i = 0; i < 9; i++) {
      const y = 1 - (i / 8) * 2, rr = Math.sqrt(1 - y * y), a = i * 2.4;
      const d = new T.Mesh(geo.sphere(0.07, 8, 6), basic(0xffffff));
      d.position.set(Math.cos(a) * rr * 0.43, y * 0.43, Math.sin(a) * rr * 0.43);
      d.scale.setScalar(0.9);
      m.add(d);
    }
    b.add(m);
    return BALL;
  },
  star(c, b) {
    const g = flatShape('star', (s) => {
      for (let i = 0; i < 10; i++) {
        const a = Math.PI / 2 + (i / 10) * Math.PI * 2, r = i % 2 ? 0.22 : 0.52;
        if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r); else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      s.closePath();
    });
    const m = mesh(g, c, { hull: 1.07 });
    eyesOn(m, 0.2, 0.04, 0.09, 0.045);
    b.add(m);
    return { shape: 'ball', r: 0.42, bounce: 0.5 };
  },

  // ---- Level 2: fruit ----
  apple(c, b) {
    const m = mesh(geo.sphere(0.42, 22, 16), c, { outline: 0.035 });
    m.scale.set(1.05, 0.92, 1);
    const stem = ink(geo.cyl(0.03, 0.04, 0.2, 6));
    stem.position.set(0.02, 0.44, 0); stem.rotation.z = -0.2;
    const leaf = mesh(geo.sphere(0.1, 10, 8), shade(c, 0.25), { outline: 0.015 });
    leaf.scale.set(1.6, 0.35, 0.8); leaf.position.set(0.15, 0.46, 0); leaf.rotation.z = 0.5;
    hiLight(m, -0.16, 0.16, 0.34, 0.08);
    b.add(m, stem, leaf);
    return { shape: 'ball', r: 0.42, bounce: 0.38 };
  },
  blueberry(c, b) {
    const m = mesh(geo.sphere(0.42, 22, 16), c, { outline: 0.035 });
    const crown = new T.Group();
    for (let i = 0; i < 5; i++) {
      const p = mesh(geo.cone(0.07, 0.14, 4), shade(c, 0.4), { outline: 0 });
      const a = (i / 5) * Math.PI * 2;
      p.position.set(Math.cos(a) * 0.08, 0, Math.sin(a) * 0.08);
      p.rotation.set(Math.sin(a) * 0.6, 0, -Math.cos(a) * 0.6);
      crown.add(p);
    }
    crown.position.y = 0.4;
    hiLight(m, -0.16, 0.18, 0.34, 0.09);
    eyesOn(m, 0.4, 0.0, 0.12, 0.045);
    b.add(m, crown);
    return { shape: 'ball', r: 0.42, bounce: 0.45 };
  },
  banana(c, b) {
    const m = mesh(geo.torus(0.42, 0.15, Math.PI * 0.75, 12, 20), c, { outline: 0.03 });
    m.rotation.z = Math.PI * 1.12;
    m.position.y = 0.3;
    const tip = ink(geo.sphere(0.07, 8, 6));
    tip.position.set(0.42, 0, 0); m.add(tip);
    const tip2 = ink(geo.cyl(0.05, 0.06, 0.14, 6));
    tip2.position.set(Math.cos(Math.PI * 0.75) * 0.42, Math.sin(Math.PI * 0.75) * 0.42, 0); m.add(tip2);
    b.add(m);
    return { shape: 'ball', r: 0.4, bounce: 0.3 };
  },
  pear(c, b) {
    const lo = mesh(geo.sphere(0.4, 20, 14), c, { outline: 0.035 });
    lo.position.y = -0.1;
    const hi = mesh(geo.sphere(0.25, 16, 12), c, { outline: 0.03 });
    hi.position.y = 0.26;
    const stem = ink(geo.cyl(0.03, 0.035, 0.2, 6));
    stem.position.y = 0.55; stem.rotation.z = 0.25;
    hiLight(lo, -0.15, 0.12, 0.33, 0.08);
    b.add(lo, hi, stem);
    return { shape: 'ball', r: 0.44, bounce: 0.3 };
  },
  plum(c, b) {
    const m = mesh(geo.sphere(0.42, 22, 16), c, { outline: 0.035 });
    m.scale.set(0.92, 1.05, 0.92);
    const crease = new T.Mesh(geo.torus(0.42, 0.018, Math.PI, 4, 20), basic(shade(c, 0.35)));
    crease.rotation.y = Math.PI / 2 - 0.4; m.add(crease);
    const stem = ink(geo.cyl(0.025, 0.03, 0.14, 6)); stem.position.y = 0.46; m.add(stem);
    hiLight(m, -0.15, 0.2, 0.33, 0.08);
    b.add(m);
    return { shape: 'ball', r: 0.42, bounce: 0.42 };
  },
  grapes(c, b) {
    const P = [[0, 0.22], [-0.2, 0.22], [0.2, 0.22], [-0.1, 0.02], [0.1, 0.02], [0, -0.18], [-0.2, -0.02], [0.2, -0.02]];
    for (const [x, y] of P) {
      const g = mesh(geo.sphere(0.15, 12, 10), c, { outline: 0.02 });
      g.position.set(x, y, Math.abs(x) < 0.05 ? 0.08 : 0);
      hiLight(g, -0.05, 0.05, 0.12, 0.035);
      b.add(g);
    }
    const stem = ink(geo.cyl(0.03, 0.03, 0.2, 6)); stem.position.y = 0.43; b.add(stem);
    return { shape: 'ball', r: 0.4, bounce: 0.25, friction: 1 };
  },

  // ---- Level 3: craft corner ----
  block(c, b) {
    const m = mesh(geo.box(0.78, 0.78, 0.78), c, { hull: 1.07 });
    const inset = new T.Mesh(geo.box(0.5, 0.5, 0.02), basic(0xffffff, { transparent: true, opacity: 0.45 }));
    inset.position.z = 0.4;
    m.add(inset);
    b.add(m);
    return { shape: 'box', size: new T.Vector3(0.82, 0.82, 0.82), bounce: 0.3, friction: 0.9 };
  },
  crayon(c, b) {
    const g = new T.Group();
    const stick = mesh(geo.cyl(0.17, 0.17, 0.85, 14), c, { outline: 0.03 });
    const paper = new T.Mesh(geo.cyl(0.175, 0.175, 0.42, 14), basic(0xffffff));
    const band = ink(geo.cyl(0.18, 0.18, 0.04, 14)); band.position.y = 0.12;
    const band2 = ink(geo.cyl(0.18, 0.18, 0.04, 14)); band2.position.y = -0.12;
    const tip = mesh(geo.cone(0.17, 0.32, 14), c, { outline: 0.03 });
    tip.position.y = 0.58;
    g.add(stick, paper, band, band2, tip);
    g.rotation.z = -Math.PI / 2 + 0.25;
    b.add(g);
    return { shape: 'box', size: new T.Vector3(1.2, 0.38, 0.38), bounce: 0.25, friction: 0.8 };
  },
  paintpot(c, b) {
    const pot = mesh(geo.cyl(0.36, 0.33, 0.55, 20), c, { outline: 0.035 });
    const label = new T.Mesh(geo.cyl(0.37, 0.355, 0.2, 20, true), basic(0xffffff));
    const paint = new T.Mesh(geo.cyl(0.3, 0.3, 0.04, 20), toon(tint(c, 0.1)));
    paint.position.y = 0.28;
    const rim = mesh(geo.torus(0.33, 0.05, Math.PI * 2, 6, 20), c, { outline: 0.02 });
    rim.rotation.x = Math.PI / 2; rim.position.y = 0.28;
    const drip = mesh(geo.sphere(0.07, 8, 6), c, { outline: 0.015 });
    drip.scale.set(1, 1.6, 0.6); drip.position.set(0.12, 0.16, 0.36);
    eyesOn(label, 0.37, 0.0, 0.11, 0.045);
    pot.add(label);
    b.add(pot, paint, rim, drip);
    return { shape: 'box', size: new T.Vector3(0.74, 0.6, 0.74), bounce: 0.2, friction: 0.9 };
  },
  car(c, b) {
    const body = mesh(geo.box(1.0, 0.36, 0.6), c, { hull: 1.06 });
    body.position.y = -0.02;
    const cab = mesh(geo.box(0.55, 0.3, 0.52), c, { hull: 1.08 });
    cab.position.set(-0.05, 0.3, 0);
    const win = new T.Mesh(geo.box(0.42, 0.18, 0.54), basic(0xe8f6ff));
    win.position.set(-0.05, 0.31, 0);
    const lamp = new T.Mesh(geo.sphere(0.06, 8, 6), basic(0xffffff));
    lamp.position.set(0.5, 0.0, 0.2);
    b.add(body, cab, win, lamp);
    for (const x of [-0.3, 0.3]) for (const z of [-0.3, 0.3]) {
      const w = ink(geo.cyl(0.15, 0.15, 0.1, 14));
      w.rotation.x = Math.PI / 2;
      w.position.set(x, -0.22, z);
      const hub = new T.Mesh(geo.cyl(0.06, 0.06, 0.11, 8), basic(0xffffff));
      w.add(hub);
      b.add(w);
    }
    return { shape: 'box', size: new T.Vector3(1.0, 0.75, 0.66), bounce: 0.25, friction: 0.9 };
  },
  brush(c, b) {
    const g = new T.Group();
    const handle = mesh(geo.cyl(0.07, 0.1, 0.75, 10), c, { outline: 0.025 });
    handle.position.y = -0.2;
    const ferrule = new T.Mesh(geo.cyl(0.12, 0.1, 0.2, 12), basic(0xe8ecf2));
    ferrule.position.y = 0.26;
    const bristle = mesh(geo.sphere(0.14, 12, 10), c, { outline: 0.025 });
    bristle.scale.set(1, 1.9, 0.75); bristle.position.y = 0.5;
    g.add(handle, ferrule, bristle);
    g.rotation.z = -0.9;
    b.add(g);
    return { shape: 'box', size: new T.Vector3(1.0, 0.45, 0.3), bounce: 0.25 };
  },
  button(c, b) {
    const m = mesh(geo.cyl(0.46, 0.46, 0.16, 28), c, { outline: 0.03 });
    m.rotation.x = Math.PI / 2;
    const ring = new T.Mesh(geo.torus(0.36, 0.035, Math.PI * 2, 6, 28), basic(tint(c, 0.4)));
    ring.position.y = 0.085; ring.rotation.x = Math.PI / 2; m.add(ring);
    for (const [x, z] of [[-0.1, -0.1], [0.1, -0.1], [-0.1, 0.1], [0.1, 0.1]]) {
      const h = new T.Mesh(geo.cyl(0.05, 0.05, 0.18, 8), basic(0xffffff));
      h.position.set(x, 0, z); m.add(h);
    }
    b.add(m);
    return { shape: 'box', size: new T.Vector3(0.92, 0.92, 0.2), bounce: 0.4, friction: 0.7 };
  },
};
export const THEMES = Object.keys(MAKE);

// Blender models for the items (tinted to the item's colour). [kind, scale, options, extra rotation].
// The physics (userData.phys) stays the code item's, so they pile up exactly as before.
const PROP = {
  ball: ['prop_m_toyball', 1, { hide: ['dots'], face: false }],
  beachball: ['prop_m_beachball', 1, {}, [0.35, 0, 0]],
  smiley: ['prop_m_toyball', 1, { hide: ['band', 'dots', 'star'] }],
  pompom: ['prop_m_pompom', 1.02, {}],
  dotty: ['prop_m_toyball', 1, { hide: ['band', 'star'], face: false }],
  star: ['prop_m_puffstar', 1.0, {}],
  apple: ['prop_m_apple', 0.9, {}],
  blueberry: ['prop_m_blueberry', 0.98, {}],
  banana: ['prop_m_banana', 0.95, {}, [0, 0, -0.1]],
  pear: ['prop_m_pear', 0.92, {}],
  plum: ['prop_m_plum', 0.95, {}],
  grapes: ['prop_m_grapes', 0.95, {}],
  block: ['prop_m_block', 1.0, {}, [0, 0.35, 0]],
  crayon: ['prop_m_crayon', 1.0, {}, [0, 0, 0.25]],
  paintpot: ['prop_m_paintpot', 1.0, {}],
  car: ['prop_m_car', 1.0, {}, [0, -0.25, 0]],
  brush: ['prop_m_brush', 0.95, {}, [0, 0, -0.9]],
  button: ['prop_m_button', 1.0, {}],
};
const PHYS = {
  ball: BALL, beachball: { ...BALL, bounce: 0.7 }, smiley: { ...BALL, bounce: 0.6 }, pompom: { shape: 'ball', r: 0.45, bounce: 0.25, friction: 1 },
  dotty: BALL, star: { shape: 'ball', r: 0.42, bounce: 0.5 },
  apple: { shape: 'ball', r: 0.42, bounce: 0.38 }, blueberry: { shape: 'ball', r: 0.42, bounce: 0.45 }, banana: { shape: 'ball', r: 0.4, bounce: 0.3 },
  pear: { shape: 'ball', r: 0.44, bounce: 0.3 }, plum: { shape: 'ball', r: 0.42, bounce: 0.42 }, grapes: { shape: 'ball', r: 0.4, bounce: 0.25, friction: 1 },
  block: { shape: 'box', size: new T.Vector3(0.82, 0.82, 0.82), bounce: 0.3, friction: 0.9 },
  crayon: { shape: 'box', size: new T.Vector3(1.2, 0.38, 0.38), bounce: 0.25, friction: 0.8 },
  paintpot: { shape: 'box', size: new T.Vector3(0.8, 0.6, 0.8), bounce: 0.2, friction: 0.9 },
  car: { shape: 'box', size: new T.Vector3(1.0, 0.62, 0.7), bounce: 0.25, friction: 0.9 },
  brush: { shape: 'box', size: new T.Vector3(1.0, 0.45, 0.3), bounce: 0.25 },
  button: { shape: 'box', size: new T.Vector3(0.92, 0.92, 0.2), bounce: 0.4, friction: 0.7 },
};

// An item: outer group (dragged / simulated, carries userData.color) with an inner body that idles / flips.
export function makeItem(color, theme) {
  const g = new T.Group();
  const b = new T.Group();
  g.add(b);
  const P = PROP[theme];
  const pm = P && prop(P[0], { tint: COL[color], ...P[2] });
  if (pm) {
    pm.scale.setScalar(P[1]);
    if (P[3]) pm.rotation.set(...P[3]);
    b.add(pm);
    g.userData = { color, theme, body: b, phys: PHYS[theme] };
    return g;
  }
  const phys = (MAKE[theme] || MAKE.ball)(COL[color], b);
  g.userData = { color, theme, body: b, phys };
  return g;
}
