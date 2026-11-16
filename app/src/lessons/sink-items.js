// Sink or float lab: the things to test, the water tank (Blender glass tank + a code water volume with a live, rippling
// surface), the two sorting signs and the ramp. Every object is a Blender prop (tools/blender/creatures/prop_*.py;
// this game's own are in prop_sinklab.py).
import * as T from '../three.js';
import { toonUnique, blobShadow } from '../engine/toon.js';
import { propModel } from '../engine/prop-models.js';
import { layerColor } from '../engine/beach.js';

// b = buoyancy (how hard the water pushes up when it is all under: > 1 floats, < 1 sinks; a floater settles with
// about 1/b of itself under water). up = keep it upright while it floats (a duck sits on the water, not on its side).
// rolls / bounces: for the Level 3 "which rolls? which bounces?" tests.
export const ITEMS = {
  duck: { kind: 'prop_duckie', name: 'duck', size: 0.85, floats: true, b: 1.8, up: true, rx: 0, ry: -0.5 },
  rock: { kind: 'prop_rock', name: 'rock', size: 0.36, tint: 0x9da3ad, floats: false, b: 0.25, bounces: false },
  ball: { kind: 'prop_m_beachball', name: 'beach ball', size: 1.2, tint: 0x7fd6ff, floats: true, b: 2.6, rolls: true, bounces: true, r: 0.53 },
  stone: { kind: 'prop_farmrock', name: 'stone', size: 0.62, floats: false, b: 0.25 },
  sponge: { kind: 'prop_sponge', name: 'sponge', size: 0.62, tint: 0xffd23f, floats: true, b: 1.9, scrub: 0x5fd068 },
  shell: { kind: 'prop_seashell', name: 'shell', size: 0.5, tint: 0xffb6c9, floats: false, b: 0.3 },
  apple: { kind: 'prop_m_apple', name: 'apple', size: 1.0, tint: 0xff4b4b, floats: true, b: 1.4, up: true },
  key: { kind: 'prop_sinkkey', name: 'key', size: 0.9, floats: false, b: 0.2 },
  leaf: { kind: 'prop_m_leaf', name: 'leaf', size: 1.7, tint: 0x5fd068, floats: true, b: 3, up: true },
  marble: { kind: 'prop_m_marble', name: 'marble', size: 1.0, tint: 0x4a90ff, floats: false, b: 0.2, r: 0.2 },
  block: { kind: 'prop_m_block', name: 'block', size: 0.95, tint: 0xf0b45a, floats: true, b: 1.8, rolls: false, up: true },
  gem: { kind: 'prop_m_gem', name: 'gem', size: 1.6, tint: 0xb07bff, floats: false, b: 0.2 },
  log: { kind: 'prop_sinklog', name: 'big log', size: 1.0, floats: true, b: 1.35, big: true, up: true },
  coin: { kind: 'prop_coin', name: 'tiny coin', size: 0.2, floats: false, b: 0.15, small: true },
  bigapple: { kind: 'prop_m_apple', name: 'big apple', size: 1.65, tint: 0x8ee04a, floats: true, b: 1.4, up: true, big: true },
  tinymarble: { kind: 'prop_m_marble', name: 'tiny marble', size: 0.7, tint: 0xff7a59, floats: false, b: 0.2, r: 0.14, small: true },
};

export function makeItem(id) {
  const d = ITEMS[id];
  const w = propModel(d.kind, { tint: d.tint, size: d.size });
  if (!w) return null;
  if (d.scrub) layerColor(w, 'scrub', d.scrub);
  // gloss stickers have no ink outline
  const L = w.userData.model?.userData?.layers || {};
  for (const [k, l] of Object.entries(L)) if (k.startsWith('shine') && l.outline) l.outline.visible = false;
  w.userData.id = id;
  w.userData.item = d;
  w.userData.floats = d.floats;
  w.userData.noSquash = false;
  w.rotation.set(d.rx || 0, d.ry || 0, 0);
  return w;
}

// Local sample points of an object's surface (in its own frame, at its world scale) for the water test.
export function samplePoints(obj, max = 90) {
  obj.updateMatrixWorld(true);
  const inv = obj.matrixWorld.clone().invert();
  const out = [];
  const p = new T.Vector3();
  obj.traverse((m) => {
    if (!m.isMesh || m.userData.outline || !m.geometry?.attributes?.position) return;
    for (let o = m; o && o !== obj.parent; o = o.parent) if (!o.visible) return;
    const a = m.geometry.attributes.position;
    const step = Math.max(1, Math.floor(a.count / 60));
    for (let i = 0; i < a.count; i += step) out.push(p.fromBufferAttribute(a, i).applyMatrix4(m.matrixWorld).applyMatrix4(inv).clone());
  });
  if (out.length > max) { const k = out.length / max; return Array.from({ length: max }, (_, i) => out[Math.floor(i * k)]); }
  return out;
}

// ---------------- the tank ----------------
// Inner box (world, relative to the tank's origin): x +-IX, z +-IZ, floor at FLOOR; water up to WATER.
export const TANK = { IX: 2.08, IZ: 0.93, FLOOR: 0.36, WATER: 2.05, TOP: 2.9 };

export function makeTank() {
  const g = new T.Group();
  const pm = propModel('prop_sinktank');
  if (pm) {
    const L = pm.userData.model.userData.layers;
    if (L.glass) {
      L.glass.mesh.material = toonUnique(0xd8f4ff, { vertexColors: true, transparent: true, opacity: 0.16, depthWrite: false });
      L.glass.outline.visible = false;
      L.glass.mesh.renderOrder = 4;
    }
    if (L.shine) { L.shine.mesh.material = toonUnique(0xffffff, { vertexColors: true, transparent: true, opacity: 0.75, depthWrite: false }); L.shine.outline.visible = false; L.shine.mesh.renderOrder = 5; }
    g.add(pm);
  }
  g.add(blobShadow(2.9));
  // the water: a see-through body (tints whatever is under the surface) and a lighter surface sheet that ripples
  const { IX, IZ, FLOOR, WATER } = TANK;
  const body = new T.Mesh(new T.BoxGeometry(IX * 2 - 0.02, WATER - FLOOR, IZ * 2 - 0.02),
    new T.MeshBasicMaterial({ color: 0x1f95e6, transparent: true, opacity: 0.5, depthWrite: false }));
  body.position.y = (WATER + FLOOR) / 2;
  body.renderOrder = 2;
  const NX = 28, NZ = 10;
  const sg = new T.PlaneGeometry(IX * 2 - 0.02, IZ * 2 - 0.02, NX, NZ);
  sg.rotateX(-Math.PI / 2);
  const surf = new T.Mesh(sg, new T.MeshBasicMaterial({ color: 0x8adcff, transparent: true, opacity: 0.55, depthWrite: false, side: T.DoubleSide }));
  surf.position.y = WATER;
  surf.renderOrder = 3;
  // a white foam line where the water meets the front glass
  const lip = new T.Mesh(new T.BoxGeometry(IX * 2 - 0.02, 0.05, 0.01), new T.MeshBasicMaterial({ color: 0xe8fbff, transparent: true, opacity: 0.85, depthWrite: false }));
  lip.position.set(0, WATER, IZ - 0.005);
  lip.renderOrder = 3;
  g.add(body, surf, lip);
  g.userData.water = { body, surf, lip, base: sg.attributes.position.array.slice(), ripples: [] };
  return g;
}

// ripple the surface: ripples = [{x, z, t, a}] in tank space; level = the water's height now
export function animateWater(tank, dt, t, level) {
  const w = tank.userData.water;
  if (!w) return;
  const pos = w.surf.geometry.attributes.position, a = pos.array, base = w.base;
  w.ripples = w.ripples.filter((r) => (r.t += dt) < 2.2);
  for (let i = 0; i < pos.count; i++) {
    const x = base[i * 3], z = base[i * 3 + 2];
    let y = Math.sin(x * 2.1 + t * 1.6) * 0.012 + Math.sin(z * 3.3 - t * 1.25 + x) * 0.01;
    for (const r of w.ripples) {
      const d = Math.hypot(x - r.x, z - r.z), front = r.t * 2.6;
      if (d > front) continue;
      y += r.a * Math.exp(-r.t * 2.2) * Math.sin((front - d) * 7) * Math.exp(-(front - d) * 0.9);
    }
    a[i * 3 + 1] = y;
  }
  pos.needsUpdate = true;
  w.surf.position.y = level;
  w.lip.position.y = level;
  const { FLOOR } = TANK;
  w.body.scale.y = (level - FLOOR) / (TANK.WATER - FLOOR);
  w.body.position.y = (level + FLOOR) / 2;
}

// ---------------- the signs and the ramp ----------------
export function makeSign(floats) {
  const pm = propModel(floats ? 'prop_sinksign_float' : 'prop_sinksign_sink');
  if (!pm) return null;
  pm.add(blobShadow(0.35));
  return pm;
}
export const SIGN_Y = 2.35; // centre of the board

export function makeRamp() {
  const pm = propModel('prop_sinkramp');
  if (!pm) return null;
  return pm;
}
export const RAMP = { X0: -1.6, X1: 1.6, HI: 1.05, FLAT: 0.4, Z: 0.65 };
