// Blender-built props (tools/blender/creatures/prop_*.py -> app/assets/models/prop_*.glb).
// propModel(kind, opts) returns null when that model isn't built (callers then fall back to their code-built prop), else a
// plain Group wrapping the creature-style model, so callers may freely replace the wrapper's userData / scale / rotation.
//   tint: colour for tintable props (argMode 'tint'), size: uniform or [x, y, z] scale of the model inside the wrapper.
// The wrapper's userData gets { model, bones } (bones of the model: lid, flapL, handle... for moving parts).
import * as T from '../three.js';
import { hasCreature, orCreature } from './creature.js';

const makers = new Map();
export function propModel(kind, { tint, size } = {}) {
  if (!hasCreature(kind)) return null;
  if (!makers.has(kind)) makers.set(kind, orCreature(kind, () => null));
  const m = makers.get(kind)(tint);
  if (size !== undefined) { if (Array.isArray(size)) m.scale.set(size[0], size[1], size[2]); else m.scale.setScalar(size); }
  const w = new T.Group();
  w.add(m);
  w.userData.model = m;
  w.userData.bones = m.userData.bones;
  return w;
}

// An empty at one of the model's anchors (Blender c.anchor), in wrapper space, so e.g. a spout can say where water leaves.
export function propAnchor(w, name) {
  const m = w.userData.model;
  const a = m && m.userData.anchors[name];
  const o = new T.Object3D();
  if (a) o.position.set(a[0] * m.scale.x, a[1] * m.scale.y, a[2] * m.scale.z);
  w.add(o);
  return o;
}
