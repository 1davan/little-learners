// Shared colour palette and expressive faces (eyes, brows, mouth shapes) used by every character model.
import * as T from '../three.js';
import { ink, toon, basic, mesh, geo } from './toon.js';

export const C = {
  red: 0xff5a5a, blue: 0x4a90ff, yellow: 0xffd23f, green: 0x5fd068, orange: 0xff9f3f, purple: 0xa77bff,
  pink: 0xff8fc0, brown: 0xa8754d, lightBrown: 0xe0b98c, white: 0xfaf6ee, grey: 0xa4abbd, darkGrey: 0x7b8398,
  leaf: 0x58c45e, trunk: 0x8a5a3b, sky: 0x9ad8ff, tear: 0x7fd0ff, cheek: 0xff9eb5,
};

// ---------- faces ----------
export function makeFace(R, { mouth = true, noseColor = null } = {}) {
  const f = new T.Group();
  const zAt = (x, y) => Math.sqrt(Math.max(0.0001, R * R - x * x - y * y));
  const eyeR = 0.14 * R;
  const eyes = [], brows = [], tears = [], cheeks = [];
  for (const s of [-1, 1]) {
    const x = s * 0.36 * R, y = 0.12 * R;
    const e = ink(geo.sphere(eyeR, 14, 10));
    e.position.set(x, y, zAt(x, y) - eyeR * 0.35);
    const hi = new T.Mesh(geo.sphere(eyeR * 0.38, 8, 6), basic(0xffffff));
    hi.position.set(eyeR * 0.3, eyeR * 0.38, eyeR * 0.75);
    e.add(hi);
    e.userData.s = s;
    f.add(e); eyes.push(e);

    const b = ink(geo.box(0.36 * R, 0.075 * R, 0.08 * R));
    b.userData = { s, x, y: 0.43 * R };
    b.position.set(x, 0.43 * R, zAt(x, 0.43 * R));
    f.add(b); brows.push(b);

    const t = new T.Mesh(geo.sphere(0.075 * R, 10, 8), toon(C.tear));
    t.scale.set(1, 1.5, 0.7);
    t.position.set(x + s * 0.06 * R, -0.12 * R, zAt(x, -0.12 * R));
    t.userData.y0 = t.position.y;
    t.visible = false;
    f.add(t); tears.push(t);

    const ch = new T.Mesh(geo.sphere(0.12 * R, 12, 8), toon(C.cheek));
    ch.scale.set(1.2, 0.7, 0.4);
    ch.position.set(s * 0.58 * R, -0.12 * R, zAt(s * 0.58 * R, -0.12 * R) - 0.02 * R);
    f.add(ch); cheeks.push(ch);
  }
  const parts = { eyes, brows, tears, cheeks, R };
  if (noseColor !== null) {
    const n = mesh(geo.sphere(0.1 * R, 12, 8), noseColor, { outline: 0.012 * R });
    n.scale.set(1.2, 0.85, 0.8);
    n.position.set(0, -0.06 * R, zAt(0, -0.06 * R));
    f.add(n);
  }
  if (mouth) {
    const my = -0.3 * R;
    const z = zAt(0, my) + 0.01 * R;
    parts.smile = ink(geo.torus(0.2 * R, 0.045 * R, Math.PI, 6, 20));
    parts.smile.rotation.z = Math.PI;
    parts.smile.position.set(0, my + 0.05 * R, z - 0.04 * R);
    parts.frown = ink(geo.torus(0.17 * R, 0.045 * R, Math.PI, 6, 20));
    parts.frown.position.set(0, my - 0.12 * R, z - 0.02 * R);
    parts.oh = ink(geo.torus(0.09 * R, 0.04 * R, Math.PI * 2, 6, 18));
    parts.oh.position.set(0, my - 0.02 * R, z);
    parts.flat = ink(geo.box(0.3 * R, 0.06 * R, 0.06 * R));
    parts.flat.position.set(0, my - 0.02 * R, z - 0.01 * R);
    f.add(parts.smile, parts.frown, parts.oh, parts.flat);
  }
  f.userData = parts;
  setFace(f, 'happy');
  return f;
}

const FACE = {
  happy: { brow: 0.0, browY: 0.12, eye: [1, 1], mouth: 'smile', tears: false, cheeks: true },
  sad: { brow: -0.5, browY: 0.0, eye: [1, 0.85], mouth: 'frown', tears: true, cheeks: false },
  angry: { brow: 0.6, browY: -0.06, eye: [1.05, 0.75], mouth: 'flat', tears: false, cheeks: false },
  scared: { brow: -0.3, browY: 0.14, eye: [1.35, 1.35], mouth: 'oh', tears: false, cheeks: false },
  calm: { brow: 0.0, browY: 0.08, eye: [1, 1], mouth: 'smile', tears: false, cheeks: false },
};

export function setFace(face, emo) {
  const p = face.userData, d = FACE[emo] || FACE.happy;
  face.userData.emotion = emo;
  // happy faces read friendlier without brows; brows appear for the feelings that need them
  for (const b of p.brows) b.visible = emo !== 'happy' && emo !== 'calm';
  for (const b of p.brows) {
    b.rotation.z = b.userData.s * d.brow; // + = inner ends down (cross), - = inner ends up (worried)
    b.position.y = b.userData.y + d.browY * p.R;
  }
  for (const e of p.eyes) e.scale.set(d.eye[0], d.eye[1], 1);
  for (const t of p.tears) t.visible = d.tears;
  for (const c of p.cheeks) c.visible = d.cheeks;
  if (p.smile) for (const k of ['smile', 'frown', 'oh', 'flat']) p[k].visible = k === d.mouth;
  if (emo === 'angry' && p.flat) { p.flat.visible = false; p.frown.visible = true; p.frown.scale.set(1, 0.5, 1); }
  else if (p.frown) p.frown.scale.set(1, 1, 1);
}

