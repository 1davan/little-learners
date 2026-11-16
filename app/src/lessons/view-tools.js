// Shared framing helpers for the meadow + farm games (colours, counting, shapes, feelings, sizes, moo, grow, share, band).
// Nothing here edits the engine: it only moves the camera, and tidies / re-lights the scenery group a lesson owns.
import * as T from '../three.js';
import { scene, setCamera } from '../engine/stage.js';
import { mesh, geo, toon, toonUnique } from '../engine/toon.js';
import { propModel } from '../engine/prop-models.js';

// Closer camera so the play area fills the frame (the default 0,3.6,16 leaves targets tiny and the bottom third empty).
export function frame(x = 0, y = 3.3, z = 12.8, lx = 0, ly = 1.8, lz = 0) {
  setCamera(new T.Vector3(x, y, z), new T.Vector3(lx, ly, lz));
}

// Calm the backdrop around the play area:
//  - weather (falling leaves / snow / rain) is pushed back so it falls behind the play plane, never across the toys
//  - fallen ground litter (leaves) inside `box` is removed so nothing looks touchable near the targets
//  - opts.hide(obj) → true hides that direct child of the scenery (e.g. trees standing between targets)
export function calmBackdrop(meadow, { box = { x0: -9, x1: 9, z0: -5, z1: 9 }, weatherZ = -8, hide = null } = {}) {
  if (!meadow) return;
  const m = new T.Matrix4(), p = new T.Vector3(), q = new T.Quaternion(), s = new T.Vector3();
  for (const o of meadow.children) {
    if (o.isInstancedMesh) {
      const cone = o.geometry && o.geometry.type === 'ConeGeometry';
      if (!o.frustumCulled && !cone) { o.position.z += weatherZ; continue; } // falling weather (animated in local space)
      if (o.frustumCulled && o.instanceColor) {
        // static fallen leaves: squash the ones in the play box to nothing
        for (let i = 0; i < o.count; i++) {
          o.getMatrixAt(i, m); m.decompose(p, q, s);
          if (p.x > box.x0 && p.x < box.x1 && p.z > box.z0 && p.z < box.z1) { m.compose(p, q, s.setScalar(0)); o.setMatrixAt(i, m); }
        }
        o.instanceMatrix.needsUpdate = true;
      }
      continue;
    }
    if (hide && hide(o)) o.visible = false;
  }
}

// Is a scenery child a tree (trunk + leafy top from makeTree / makePine)?
export function isTree(o) { return !!(o.userData && o.userData.top) || (o.isGroup && o.children.some((c) => c.geometry && c.geometry.type === 'ConeGeometry') && o.children.length >= 3 && o.children.length <= 8 && o.position.y === 0 && !o.userData.flower); }

// Neutral white light for colour-critical games: the autumn / harvest themes tint the key and fill lights orange,
// which turns red-vs-yellow into mud. The next setSky() (every lesson / home start) restores the theme lights.
export function trueLights() {
  for (const l of scene.children) {
    if (l.isHemisphereLight) { l.color.setHex(0xffffff); l.groundColor.setHex(0xc8d0c0); l.intensity = 1.5; }
    else if (l.isDirectionalLight) { if (l.intensity > 2) { l.color.setHex(0xffffff); l.intensity = 2.4; } else { l.color.setHex(0xe8f0ff); } }
  }
}

// A soft neutral play mat (rounded, slightly raised) that sits under the play area so colours and shapes read
// against a calm, even ground instead of grass / leaves / snow.
export function makeMat(w, d, color = 0xe2d7bd, edge = 0xbfae8c) {
  const g = new T.Group();
  const rim = new T.Mesh(geo.cyl(1, 1, 0.05, 48), toon(edge));
  rim.scale.set(w / 2 + 0.18, 1, d / 2 + 0.18); rim.position.y = 0.02;
  const top = new T.Mesh(geo.cyl(1, 1, 0.06, 48), toon(color));
  top.scale.set(w / 2, 1, d / 2); top.position.y = 0.035;
  g.add(rim, top);
  g.userData.mat = true;
  return g;
}
export { mesh };

// A Blender-built prop (tools/blender/creatures/prop_*.py) for the meadow games, or null when it isn't built (callers
// keep their code-built fallback). Props are still things: no idle sway / gait / look-at from the creature motion layer.
// Gloss stickers (layers 'shine*') drop their ink outline; extra tintable layers ('tint*') share the body's tint.
//   hide: layer names to hide (e.g. the toy ball's 'dots'); face: false hides a mounted code face.
export function prop(kind, { tint, size, hide = [], face = true } = {}) {
  const w = propModel(kind, tint === undefined ? { size } : { tint, size });
  if (!w) return null;
  const m = w.userData.model, u = m.userData;
  u.body = m; u.noWalk = true; u.noLook = true;
  for (const [name, l] of Object.entries(u.layers || {})) {
    if (/^shine/.test(name)) l.outline.visible = false;
    if (/^tint/.test(name)) l.mesh.material = u.skin.material;
    if (hide.includes(name)) { l.mesh.visible = false; l.outline.visible = false; }
  }
  if (u.face && !face) u.face.visible = false;
  w.userData.layers = u.layers || {};
  w.userData.face = face ? u.face : null;
  return w;
}

// Recolour a tintable prop (and its 'tint*' layers), e.g. a lamp lighting up or a golden fruit.
export function retint(w, col) {
  const u = w.userData.model?.userData;
  if (!u || !u.skin) return;
  u.skin.material = toonUnique(col, { vertexColors: true });
  for (const [name, l] of Object.entries(u.layers || {})) if (/^tint/.test(name)) l.mesh.material = u.skin.material;
}
