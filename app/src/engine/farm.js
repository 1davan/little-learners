// Farm animals (cow, pig, sheep, horse built on the chibi animal body; hen and chick custom) and farm props.
import * as T from '../three.js';
import { mesh, geo, toon, ink, blobShadow, basic } from './toon.js';
import { makeAnimal, makeFace, C } from './actors.js';

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

export function makeFarmAnimal(kind) {
  if (kind === 'hen') return makeHen();
  if (kind === 'chick') return makeChick();
  const g = makeAnimal(kind);
  const { head, face, body } = g.userData;
  // move the mouth down a bit so it sits under the snout
  const parts = face.userData;
  if (kind === 'cow') {
    snout(head, 0xffc0cf, 0.48, 0.3);
    for (const s of [-1, 1]) {
      const horn = mesh(geo.cone(0.08, 0.28, 8), 0xfff1c9, { outline: 0.015 });
      horn.position.set(s * 0.32, 0.62, -0.05); horn.rotation.z = -s * 0.5;
      const ear = mesh(geo.sphere(0.16, 10, 8), 0xfaf6ee, { outline: 0.02 });
      ear.scale.set(1.6, 0.6, 0.6); ear.position.set(s * 0.68, 0.28, -0.05); ear.rotation.z = s * 0.3;
      head.add(horn, ear);
    }
    // black spots
    for (const [x, y, z, r] of [[0.45, 1.0, 0.45, 0.24], [-0.5, 0.6, 0.4, 0.2], [0.1, 1.25, -0.5, 0.3]]) {
      const sp = new T.Mesh(geo.sphere(r, 12, 8), toon(0x3a2838));
      sp.scale.set(1, 0.9, 0.35); sp.position.set(x, y, z); sp.lookAt(0, 0.8, 0); sp.position.multiplyScalar(1.02);
      g.add(sp);
    }
    const spot = new T.Mesh(geo.sphere(0.2, 12, 8), toon(0x3a2838)); spot.scale.set(1, 0.8, 0.4); spot.position.set(-0.32, 0.35, 0.5); head.add(spot);
    const bell = mesh(geo.sphere(0.13, 10, 8), 0xffd23f, { outline: 0.015 }); bell.position.set(0, 1.42, 0.62); g.add(bell);
  } else if (kind === 'pig') {
    snout(head, 0xff8fae, 0.3, 0.22, 0.66, -0.12, 0x9c3b56);
    for (const s of [-1, 1]) {
      const ear = mesh(geo.cone(0.18, 0.32, 4), 0xffa8bf, { outline: 0.02 });
      ear.position.set(s * 0.42, 0.58, 0.05); ear.rotation.set(0.4, 0, -s * 0.5);
      head.add(ear);
    }
    const tail = mesh(geo.torus(0.1, 0.035, Math.PI * 1.6, 6, 12), 0xffa8bf, { outline: 0.01 });
    tail.position.set(0, 0.8, -0.72);
    g.add(tail);
    g.userData.tail = tail;
  } else if (kind === 'sheep') {
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
  } else if (kind === 'horse') {
    snout(head, 0xe8c39c, 0.44, 0.34, 0.6, -0.24, 0x6b3f28);
    for (const s of [-1, 1]) {
      const ear = mesh(geo.cone(0.12, 0.34, 6), 0xb87a4b, { outline: 0.018 });
      ear.position.set(s * 0.3, 0.68, -0.05); ear.rotation.z = -s * 0.25;
      head.add(ear);
    }
    for (let i = 0; i < 5; i++) {
      const m = mesh(geo.sphere(0.14, 10, 8), 0x5a3420, { outline: 0.015 });
      m.position.set(0, 0.62 - i * 0.16, -0.25 - i * 0.12); m.scale.set(0.8, 1.2, 1);
      head.add(m);
    }
  }
  g.userData.kind = kind;
  return g;
}

function makeHen() {
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

export function makeChick(s = 0.55) {
  const g = new T.Group();
  const inner = new T.Group();
  const body = mesh(geo.sphere(0.6, 18, 14), 0xffe14d, { outline: 0.035 });
  body.position.y = 0.6;
  const face = makeFace(0.6, { mouth: false });
  face.position.set(0, 0.12, 0);
  body.add(face);
  const beak = mesh(geo.cone(0.1, 0.22, 10), C.orange, { outline: 0.015 });
  beak.rotation.x = Math.PI / 2; beak.position.set(0, 0.0, 0.62);
  body.add(beak);
  const tuft = mesh(geo.sphere(0.09, 8, 6), 0xffe14d, { outline: 0.015 });
  tuft.scale.set(0.8, 1.7, 0.8); tuft.position.set(0, 0.62, 0);
  body.add(tuft);
  const wings = [];
  for (const sd of [-1, 1]) {
    const w = mesh(geo.sphere(0.2, 10, 8), 0xffcf1a, { outline: 0.018 });
    w.scale.set(0.5, 1, 0.8); w.position.set(sd * 0.58, 0.55, 0); w.rotation.z = sd * 0.4;
    inner.add(w); wings.push(w);
    const foot = mesh(geo.sphere(0.11, 8, 6), C.orange, { outline: 0.014 });
    foot.scale.set(1.2, 0.5, 1.4); foot.position.set(sd * 0.22, 0.05, 0.15);
    inner.add(foot);
  }
  inner.add(body, blobShadow(0.7));
  g.add(inner);
  g.scale.setScalar(s);
  g.userData = { body, face, wings, kind: 'chick', baseScale: s };
  return g;
}

// ---------- props ----------
export function makePot(col = 0xd9774a) {
  const g = new T.Group();
  // upside-down flowerpot: wide rim at the bottom
  const pot = mesh(geo.cyl(0.85, 1.2, 1.7, 22), col, { outline: 0.035 });
  pot.position.y = 0.85;
  const rim = mesh(geo.cyl(1.32, 1.32, 0.34, 22), col, { outline: 0.03 });
  rim.position.y = 0.17;
  const hole = new T.Mesh(geo.circle(0.22, 16), toon(0x5a3420));
  hole.rotation.x = -Math.PI / 2; hole.position.y = 1.71;
  const band = new T.Mesh(geo.cyl(1.0, 1.06, 0.12, 22), toon(0xffffff));
  band.position.y = 1.0; band.scale.set(1.02, 1, 1.02);
  g.add(pot, rim, hole, band, blobShadow(1.3));
  g.userData.kind = 'pot';
  return g;
}

export function makeCarrot(s = 1) {
  const g = new T.Group();
  const c = mesh(geo.cone(0.22, 1.0, 12), 0xff8a2a, { outline: 0.025 });
  c.rotation.x = Math.PI;
  for (let i = 0; i < 3; i++) {
    const line = new T.Mesh(geo.torus(0.13 - i * 0.03, 0.012, Math.PI, 4, 10), basic(0xd96a14));
    line.position.y = -0.05 - i * 0.22; line.rotation.x = Math.PI / 2;
    c.add(line);
  }
  const tops = new T.Group(); tops.position.y = 0.5;
  for (let i = -1; i <= 1; i++) {
    const l = mesh(geo.sphere(0.12, 8, 6), 0x4fb84a, { outline: 0.012 });
    l.scale.set(0.6, 2.2, 0.6); l.position.set(i * 0.08, 0.2, 0); l.rotation.z = -i * 0.4;
    tops.add(l);
  }
  g.add(c, tops);
  g.scale.setScalar(s);
  return g;
}

export function makeDrum(col = 0xd94f3d, r = 1.2, h = 1.2) {
  const g = new T.Group();
  const shell = mesh(geo.cyl(r, r * 0.95, h, 24), col, { outline: 0.035 });
  shell.position.y = h / 2;
  const skin = mesh(geo.cyl(r * 1.02, r * 1.02, 0.08, 24), 0xfff6e6, { outline: 0.02 });
  skin.position.y = h + 0.02;
  for (const y of [0.12, h - 0.12]) { const b = mesh(geo.torus(r * 1.0, 0.06, Math.PI * 2, 6, 28), 0xffd23f, { outline: 0 }); b.rotation.x = Math.PI / 2; b.position.y = y; g.add(b); }
  // zig-zag cords
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const c = new T.Mesh(geo.box(0.05, h * 0.8, 0.05), basic(0xfff6e6));
    c.position.set(Math.cos(a) * r * 1.0, h / 2, Math.sin(a) * r * 1.0);
    c.rotation.set(0, -a, i % 2 ? 0.5 : -0.5);
    g.add(c);
  }
  g.add(shell, skin, blobShadow(r * 1.1));
  g.userData = { skin, shell, r, h };
  return g;
}

export function makeWateringCan() {
  const g = new T.Group();
  const body = mesh(geo.cyl(0.55, 0.6, 0.9, 18), 0x4a90ff, { outline: 0.03 });
  body.position.y = 0.45;
  const spout = mesh(geo.cyl(0.06, 0.1, 1.1, 10), 0x4a90ff, { outline: 0.02 });
  spout.position.set(0.75, 0.75, 0); spout.rotation.z = -0.9;
  const rose = mesh(geo.cyl(0.16, 0.08, 0.14, 12), 0x3a78d8, { outline: 0.015 });
  rose.position.set(1.2, 1.08, 0); rose.rotation.z = -0.9;
  const handle = mesh(geo.torus(0.35, 0.06, Math.PI, 6, 14), 0x3a78d8, { outline: 0.015 });
  handle.position.set(-0.1, 0.9, 0);
  g.add(body, spout, rose, handle);
  g.userData.rose = rose;
  return g;
}

export function makeSeedBag() {
  const g = new T.Group();
  const b = mesh(geo.box(0.9, 1.1, 0.3), 0xfff1c9, { hull: 1.06, outline: 0 });
  b.position.y = 0.55;
  const pic = new T.Mesh(geo.circle(0.25, 16), toon(0xff5a5a)); pic.position.set(0, 0.65, 0.16);
  const ctr = new T.Mesh(geo.circle(0.1, 12), toon(0xffd23f)); ctr.position.set(0, 0.65, 0.17);
  const stem = new T.Mesh(geo.box(0.05, 0.3, 0.01), toon(0x4fb84a)); stem.position.set(0, 0.32, 0.16);
  g.add(b, pic, ctr, stem);
  return g;
}

export function makeSeed() {
  const s = mesh(geo.sphere(0.16, 10, 8), 0x7a4a26, { outline: 0.015 });
  s.scale.set(0.8, 1.15, 0.8);
  return s;
}
