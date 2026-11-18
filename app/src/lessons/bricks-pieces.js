// Brick letters pieces: the chunky toy brick (Blender prop_brick, stretched to any length here), the faint slot
// outlines of a letter, the letter board and the builder bear's hard hat.
//
// The brick is modelled in Blender in letter orientation (long axis x, width y, studs facing the camera +z): a hard
// bevelled block and ONE stud. A brick of length L keeps its rounded ends rigid and stretches only the straight middle,
// then gets one stud every ~0.62 along it, so a 1-stud cube and a 6-stud plank are both crisp. Normals are rebuilt
// analytically (rounded box / rounded cylinder) so flat faces shade dead flat under the toon ramp.
import * as T from '../three.js';
import { garmentProp } from '../engine/creature.js';
import { propModel } from '../engine/prop-models.js';
import { mesh, geo, toon, toonUnique, INK } from '../engine/toon.js';

export const BW = 0.62, BD = 0.5;        // brick width (stroke thickness) and depth at scale 1
const BL0 = 2.0, BR = 0.11;               // template body length and edge radius
const SR = 0.2, SB = 0.055;               // stud radius and top-edge radius
export const PITCH = 0.62;                // one stud per this much length
export const BRICK_COLS = [0xff4f4f, 0x3f8cff, 0xffd23a, 0x4cc75a, 0xff9a2e, 0x9b6dff, 0xff7fbf, 0x2fc4b8];
export const hexCss = (c) => '#' + c.toString(16).padStart(6, '0');

// ---------- the template (from the GLB), baked to plain position + index arrays ----------
let TPL = null;
function bake(layer) {
  const g = garmentProp('prop_brick', layer);
  if (!g) return null;
  g.updateMatrixWorld(true);
  let src = null;
  g.traverse((o) => { if (o.isMesh && !o.userData.outline) src = o; });
  const gg = new T.BufferGeometry();
  gg.setAttribute('position', src.geometry.attributes.position.clone());
  gg.setAttribute('normal', src.geometry.attributes.normal.clone());
  gg.setIndex(src.geometry.index.clone());
  gg.applyMatrix4(src.matrixWorld);
  gg.computeBoundingBox();
  return gg;
}
function template() {
  if (TPL !== null) return TPL;
  const body = bake('prop_brick'), stud = bake('stud');
  if (!body || !stud) { TPL = false; return TPL; }
  // body centred on the origin; the stud centred on x = y = 0 with its foot sunk 0.03 into the front face
  const c = body.boundingBox.getCenter(new T.Vector3());
  body.translate(-c.x, -c.y, -c.z);
  const sb = stud.boundingBox;
  stud.translate(-(sb.min.x + sb.max.x) / 2, -(sb.min.y + sb.max.y) / 2, BD / 2 - 0.03 - sb.min.z);
  stud.computeBoundingBox();
  TPL = { body, stud, top: stud.boundingBox.max.z };
  return TPL;
}

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
// whole studs only, with room between them so their ink rings never touch on a short brick
export const studsFor = (L) => Math.max(1, Math.floor(L / 0.56));

// A fresh geometry for a brick of length L (model units).
export function brickGeometry(L) {
  const tp = template();
  if (!tp) { const b = new T.BoxGeometry(L, BW, BD); return b; }
  const bp = tp.body.attributes.position.array, sp = tp.stud.attributes.position.array, sn = tp.stud.attributes.normal.array;
  const bi = tp.body.index.array, si = tp.stud.index.array;
  const n = studsFor(L);
  const nb = bp.length / 3, ns = sp.length / 3;
  const pos = new Float32Array((nb + ns * n) * 3), nrm = new Float32Array((nb + ns * n) * 3);
  const idx = new (nb + ns * n > 65000 ? Uint32Array : Uint16Array)(bi.length + si.length * n);
  // body: rigid rounded ends, stretched straight middle
  const a = BL0 / 2 - BR - 0.004, d = L / 2 - BL0 / 2, k = (a + d) / a;
  const hx = L / 2 - BR, hy = BW / 2 - BR, hz = BD / 2 - BR;
  for (let i = 0; i < nb; i++) {
    let x = bp[i * 3];
    const y = bp[i * 3 + 1], z = bp[i * 3 + 2];
    x = x > a ? x + d : x < -a ? x - d : x * k;
    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
    let ex = x - clamp(x, -hx, hx), ey = y - clamp(y, -hy, hy), ez = z - clamp(z, -hz, hz);
    const l = Math.hypot(ex, ey, ez) || 1;
    nrm[i * 3] = ex / l; nrm[i * 3 + 1] = ey / l; nrm[i * 3 + 2] = ez / l;
  }
  idx.set(bi, 0);
  // studs, evenly along the top face
  const zt = tp.top - SB, ri = SR - SB, zb = BD / 2 - 0.03;
  for (let s = 0; s < n; s++) {
    const cx = -L / 2 + (L / n) * (s + 0.5), o = nb + s * ns;
    for (let i = 0; i < ns; i++) {
      const x = sp[i * 3], y = sp[i * 3 + 1], z = sp[i * 3 + 2], j = (o + i) * 3;
      pos[j] = x + cx; pos[j + 1] = y; pos[j + 2] = z;
      const r = Math.hypot(x, y), q = Math.min(r, ri), dz = z - clamp(z, zb, zt);
      let ex = r > 1e-6 ? (x / r) * (r - q) : 0, ey = r > 1e-6 ? (y / r) * (r - q) : 0;
      let l = Math.hypot(ex, ey, dz);
      if (l < 1e-6) { nrm[j] = sn[i * 3]; nrm[j + 1] = sn[i * 3 + 1]; nrm[j + 2] = sn[i * 3 + 2]; continue; }
      nrm[j] = ex / l; nrm[j + 1] = ey / l; nrm[j + 2] = dz / l;
    }
    for (let i = 0; i < si.length; i++) idx[bi.length + s * si.length + i] = si[i] + o;
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.BufferAttribute(pos, 3));
  g.setAttribute('normal', new T.BufferAttribute(nrm, 3));
  g.setIndex(new T.BufferAttribute(idx, 1));
  g.computeBoundingSphere();
  return g;
}

// A brick: a Group (its origin = the brick's centre) holding the toon mesh and its ink outline.
// k = uniform scale (the level's brick size); lengths are in world units.
export function makeBrick(col, len, k = 1) {
  const b = new T.Group();
  const m = mesh(new T.BufferGeometry(), col, { outline: 0.024 });
  b.add(m);
  b.scale.setScalar(k);
  b.userData.m = m;
  b.userData.col = col;
  b.userData.k = k;
  setBrickLength(b, len);
  return b;
}
export function setBrickLength(b, len) {
  const L = Math.max(0.36, len / b.userData.k);
  const studs = studsFor(L);
  if (b.userData.L && Math.abs(b.userData.L - L) < 0.004 && b.userData.studs === studs) return;
  const g = brickGeometry(L);
  const m = b.userData.m, o = m.children[0];
  const old = m.geometry;
  m.geometry = g; o.geometry = g;
  old.dispose();
  b.userData.L = L;
  b.userData.studs = studs;
}
export const brickLength = (b) => b.userData.L * b.userData.k;

// ---------- the faint letter: one soft rounded slot per brick ----------
function rrect(w, h, r) {
  const s = new T.Shape();
  const x = -w / 2, y = -h / 2;
  r = Math.min(r, w / 2 - 0.001, h / 2 - 0.001);
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
// slot: { x, y, ang, len } in board space; w = brick width. A fill a touch darker than the board and a dashed rim.
export function makeSlot(len, w, fill, rim) {
  const g = new T.Group();
  const f = new T.Mesh(new T.ShapeGeometry(rrect(len + 0.04, w + 0.04, 0.13), 6), toonUnique(fill));
  g.add(f);
  // dashes around the rim
  const dash = toonUnique(rim);
  const per = 2 * (len + w), n = Math.max(6, Math.round(per / 0.26));
  const pts = [];
  const hw = len / 2 - 0.09, hh = w / 2 - 0.09;
  for (let i = 0; i < n; i++) {
    // walk the inset rectangle's perimeter
    let s = (i / n) * 2 * (2 * hw + 2 * hh);
    let x, y, a;
    if (s < 2 * hw) { x = -hw + s; y = -hh; a = 0; }
    else if ((s -= 2 * hw) < 2 * hh) { x = hw; y = -hh + s; a = Math.PI / 2; }
    else if ((s -= 2 * hh) < 2 * hw) { x = hw - s; y = hh; a = 0; }
    else { s -= 2 * hw; x = -hw; y = hh - s; a = Math.PI / 2; }
    pts.push([x, y, a]);
  }
  const dg = new T.PlaneGeometry(0.11, 0.035);
  for (const [x, y, a] of pts) { const d = new T.Mesh(dg, dash); d.position.set(x, y, 0.004); d.rotation.z = a; g.add(d); }
  g.userData.fill = f; g.userData.dash = dash; g.userData.dg = dg;
  return g;
}

// A Blender prop that must hold perfectly still (the creature motion layer gives every model an idle sway and a
// look toward the finger; a board or a hat should do neither).
export function still(pm) {
  const m = pm && pm.userData.model;
  if (m) { m.userData.body = m; m.userData.head = m; m.userData.noLook = true; m.userData.noWalk = true; }
  return pm;
}

// ---------- the board ----------
export const BOARD = { faceZ: 0.12, w: 6.0, y0: 0.9, y1: 6.5 };
export function makeBoard() {
  const pm = still(propModel('prop_letterboard'));
  if (pm) return pm;
  // code fallback (plywood panel between two posts)
  const g = new T.Group();
  const panel = mesh(geo.box(6, 5.7, 0.24), 0xf7e4bf, { hull: 1.01 }); panel.position.set(0, 3.7, 0); g.add(panel);
  for (const s of [-1, 1]) { const p = mesh(geo.box(0.48, 6.9, 0.48), 0xd8924f, { hull: 1.03 }); p.position.set(s * 3.25, 3.45, 0.02); g.add(p); }
  const top = mesh(geo.box(6.3, 0.68, 0.52), 0xffc21a, { hull: 1.03 }); top.position.set(0, 6.68, 0.08); g.add(top);
  return g;
}

// ---------- the bear's hard hat ----------
export function makeHardHat() {
  const pm = still(propModel('prop_hardhat'));
  if (pm) return pm;
  const g = new T.Group();
  const dome = mesh(new T.SphereGeometry(0.5, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), 0xffc21a, { outline: 0.02 }); dome.position.y = 0.06; g.add(dome);
  const brim = mesh(geo.cyl(0.64, 0.64, 0.08, 24), 0xffc21a, { outline: 0.02 }); brim.position.set(0, 0.04, 0.08); brim.scale.z = 1.18; g.add(brim);
  return g;
}
export { INK };
