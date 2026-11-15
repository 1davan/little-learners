// One renderer, one scene, one camera for the whole app lifetime.
import * as T from '../three.js';
import { updateTweens } from './tween.js';

const canvas = document.getElementById('c');
export const renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

export const scene = new T.Scene();
export const camera = new T.PerspectiveCamera(40, 1, 0.1, 300);
export const CAM_HOME = { pos: new T.Vector3(0, 3.6, 16), look: new T.Vector3(0, 2.4, 0) };
const look = CAM_HOME.look.clone();

export function setCamera(pos = CAM_HOME.pos, lookAt = CAM_HOME.look) {
  camera.position.copy(pos);
  look.copy(lookAt);
  camera.lookAt(look);
  camera.updateMatrixWorld();
}
export function getLook() { return look; }
export function lookAtNow() { camera.lookAt(look); }

// Sky gradient background.
const SKIES = {
  meadow: ['#5bb8f5', '#b6e4ff', '#fff1cf'],
  beach: ['#2fa9e3', '#93def5', '#ffe0b0'],
  farm: ['#5fb4f0', '#c9ecff', '#fff0c2'],
};
// per world: fog/horizon colour and the light bounced up from the ground
const AIR = {
  meadow: { fog: 0xe6f4ea, ground: 0x9fd07a },
  beach: { fog: 0xf2ecd9, ground: 0xf0d59a },
  farm: { fog: 0xf3eed2, ground: 0xb8d98a },
};
const skyCache = {};
export function setSky(theme = 'meadow') {
  skyCache[theme] = skyCache[theme] || skyTexture(SKIES[theme] || SKIES.meadow);
  scene.background = skyCache[theme];
  const air = AIR[theme] || AIR.meadow;
  scene.fog = new T.Fog(air.fog, 30, 75);
  hemi.groundColor.setHex(air.ground);
}
function skyTexture([a, b, c3]) {
  const c = document.createElement('canvas');
  c.width = 4; c.height = 256;
  const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, 256);
  grd.addColorStop(0, a);
  grd.addColorStop(0.55, b);
  grd.addColorStop(1, c3);
  g.fillStyle = grd; g.fillRect(0, 0, 4, 256);
  const tex = new T.CanvasTexture(c);
  tex.colorSpace = T.SRGBColorSpace;
  return tex;
}
// Warm sky fill, warm key light from the front-right and a cool rim light from behind-left
// (the rim gives every rounded toon shape a bright edge so it pops off the background).
const hemi = new T.HemisphereLight(0xfff7e8, 0x9fc28a, 1.45);
scene.add(hemi);
const sun = new T.DirectionalLight(0xfff1d6, 2.5);
sun.position.set(5, 12, 9);
scene.add(sun);
const rim = new T.DirectionalLight(0xcfe6ff, 1.3);
rim.position.set(-7, 6, -9);
scene.add(rim);
setSky('meadow');

const frameFns = new Set();
export function onFrame(fn) { frameFns.add(fn); return () => frameFns.delete(fn); }

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  // Keep at least ~16.4 world units of width visible at the stage plane, whatever the screen shape.
  const minHalfWidth = 8.4;
  const fov = Math.max(40, (2 * Math.atan(minHalfWidth / (16 * camera.aspect)) * 180) / Math.PI);
  camera.fov = fov;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();
setCamera();

const clock = new T.Clock();
let running = true;
function loop() {
  requestAnimationFrame(loop);
  if (!running) return;
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  updateTweens(dt);
  for (const f of frameFns) f(dt, t);
  camera.lookAt(look);
  camera.updateMatrixWorld();
  renderer.render(scene, camera);
}
document.addEventListener('visibilitychange', () => { running = !document.hidden; clock.getDelta(); });
canvas.addEventListener('webglcontextlost', () => setTimeout(() => location.reload(), 500));
loop();

// ---- screen <-> world helpers ----
const _v = new T.Vector3();
export function project(v3) {
  _v.copy(v3).project(camera);
  return { x: ((_v.x + 1) / 2) * window.innerWidth, y: ((1 - _v.y) / 2) * window.innerHeight };
}
export function worldPos(obj, out = new T.Vector3()) { return obj.getWorldPosition(out); }
const _right = new T.Vector3();
export function screenRadius(pos, r) {
  _right.setFromMatrixColumn(camera.matrixWorld, 0).multiplyScalar(r).add(pos);
  const a = project(pos), b = project(_right);
  return Math.hypot(a.x - b.x, a.y - b.y);
}
const ray = new T.Raycaster();
const plane = new T.Plane(new T.Vector3(0, 0, 1), 0);
export function screenToPlaneZ(x, y, z) {
  const ndc = new T.Vector2((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  plane.constant = -z;
  const out = new T.Vector3();
  return ray.ray.intersectPlane(plane, out) ? out : null;
}
