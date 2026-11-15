// Cel-shaded materials, inked outlines and cached geometry.
import * as T from '../three.js';

export const INK = 0x3a2838; // warm dark plum, softer than black

const grad = new T.DataTexture(new Uint8Array([120, 172, 222, 255]), 4, 1, T.RedFormat);
grad.minFilter = grad.magFilter = T.NearestFilter;
grad.generateMipmaps = false;
grad.needsUpdate = true;

function shared(x) { x.userData.shared = true; return x; }

const matCache = new Map();
export function toon(color, opts = {}) {
  const key = color + '|' + JSON.stringify(opts);
  if (!matCache.has(key)) matCache.set(key, shared(new T.MeshToonMaterial({ color, gradientMap: grad, ...opts })));
  return matCache.get(key);
}
// Un-cached toon material (for things that fade or change colour individually).
export function toonUnique(color, opts = {}) {
  return new T.MeshToonMaterial({ color, gradientMap: grad, ...opts });
}
export const inkMat = shared(new T.MeshBasicMaterial({ color: INK }));
const basicCache = new Map();
export function basic(color, opts = {}) {
  const key = color + '|' + JSON.stringify(opts);
  if (!basicCache.has(key)) basicCache.set(key, shared(new T.MeshBasicMaterial({ color, ...opts })));
  return basicCache.get(key);
}

const outlineCache = new Map();
function outlineMat(th) {
  if (!outlineCache.has(th)) {
    const m = new T.MeshBasicMaterial({ color: INK, side: T.BackSide });
    m.onBeforeCompile = (s) => {
      s.vertexShader = s.vertexShader.replace('#include <begin_vertex>', `vec3 transformed = position + normal * ${th.toFixed(4)};`);
    };
    m.customProgramCacheKey = () => 'outline' + th;
    outlineCache.set(th, shared(m));
  }
  return outlineCache.get(th);
}
const hullMat = shared(new T.MeshBasicMaterial({ color: INK, side: T.BackSide }));

const geoCache = new Map();
function cg(key, make) {
  if (!geoCache.has(key)) geoCache.set(key, shared(make()));
  return geoCache.get(key);
}
export const geo = {
  sphere: (r = 1, w = 20, h = 14) => cg(`s${r},${w},${h}`, () => new T.SphereGeometry(r, w, h)),
  box: (x = 1, y = 1, z = 1) => cg(`b${x},${y},${z}`, () => new T.BoxGeometry(x, y, z)),
  cyl: (rt = 1, rb = 1, h = 1, seg = 20, open = false) => cg(`c${rt},${rb},${h},${seg},${open}`, () => new T.CylinderGeometry(rt, rb, h, seg, 1, open)),
  cone: (r = 1, h = 1, seg = 16) => cg(`k${r},${h},${seg}`, () => new T.ConeGeometry(r, h, seg)),
  torus: (r = 1, t = 0.2, arc = Math.PI * 2, rs = 10, ts = 28) => cg(`t${r},${t},${arc},${rs},${ts}`, () => new T.TorusGeometry(r, t, rs, ts, arc)),
  circle: (r = 1, seg = 32) => cg(`ci${r},${seg}`, () => new T.CircleGeometry(r, seg)),
  ring: (r1 = 0.8, r2 = 1, seg = 40) => cg(`r${r1},${r2},${seg}`, () => new T.RingGeometry(r1, r2, seg)),
};

/**
 * A toon mesh with an inked outline child.
 * outline: thickness for smooth geometry (normal push). hull: scale factor for hard-edged geometry.
 */
export function mesh(g, color, { outline = 0.035, hull = 0, mat = null } = {}) {
  const m = new T.Mesh(g, mat || toon(color));
  if (hull) {
    const o = new T.Mesh(g, hullMat);
    o.scale.setScalar(hull);
    o.userData.outline = true;
    m.add(o);
  } else if (outline) {
    const o = new T.Mesh(g, outlineMat(outline));
    o.userData.outline = true;
    m.add(o);
  }
  return m;
}
export function ink(g) { return new T.Mesh(g, inkMat); }

// Soft round shadow: radial alpha texture so the edge fades instead of a hard disc.
function shadowTex() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(32, 32, 4, 32, 32, 32);
  r.addColorStop(0, 'rgba(40,30,50,0.42)'); r.addColorStop(0.6, 'rgba(40,30,50,0.22)'); r.addColorStop(1, 'rgba(40,30,50,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  return new T.CanvasTexture(c);
}
const shadowMat = shared(new T.MeshBasicMaterial({ map: shadowTex(), transparent: true, depthWrite: false, fog: false }));
export function blobShadow(r = 1) {
  const s = new T.Mesh(geo.circle(1.25, 28), shadowMat);
  s.rotation.x = -Math.PI / 2;
  s.scale.setScalar(r);
  s.position.y = 0.02;
  s.renderOrder = -1;
  return s;
}

// Dispose everything under root that is not a shared cached resource.
export function disposeTree(root) {
  root.traverse((o) => {
    if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose();
    const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    for (const m of mats) if (!m.userData.shared) m.dispose();
  });
}
