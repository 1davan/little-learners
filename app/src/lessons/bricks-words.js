// Brick letters: the picture word for every letter A–T ("A is for Apple!"), each a Blender model (prop_word_* or an
// existing creature/prop), and the little show it puts on when it pops out next to the finished letter.
import * as T from '../three.js';
import { makeCreature, hasCreature } from '../engine/creature.js';
import { propModel } from '../engine/prop-models.js';
import { mesh, geo } from '../engine/toon.js';
import { setFace } from '../engine/actors.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';
import { bsfx } from './bricks-sound.js';

// kind: a Blender prop; creature: an animal; float: hovers above the ground; show: its pop-out move; fit: height
export const WORDS = {
  A: { word: 'Apple', kind: 'prop_word_apple', show: 'bounce', col: 0xff4f4f },
  B: { word: 'Ball', kind: 'prop_word_ball', show: 'bounce', col: 0x3f8cff },
  C: { word: 'Cat', creature: 'cat', show: 'call', call: 'meow', col: 0xff9a2e },
  D: { word: 'Duck', creature: 'duck', show: 'call', call: 'quack', col: 0xffd23a },
  E: { word: 'Egg', kind: 'prop_word_egg', show: 'wobble', col: 0xf2e8d8, fit: 2.3 },
  F: { word: 'Fish', kind: 'prop_fish', show: 'flip', float: 0.55, col: 0x3f8cff, fit: 1.6, wide: 2.8 },
  G: { word: 'Grapes', kind: 'prop_word_grapes', show: 'jiggle', col: 0x9b6dff },
  H: { word: 'Hat', kind: 'prop_hat', show: 'spin', col: 0xffd23a, fit: 1.4, wide: 2.8 },
  I: { word: 'Ice cream', kind: 'prop_word_icecream', show: 'wobble', col: 0xff7fbf },
  J: { word: 'Jellyfish', kind: 'prop_word_jellyfish', show: 'float', float: 0.9, col: 0xff7fbf, look: true },
  K: { word: 'Kite', kind: 'prop_word_kite', show: 'fly', float: 1.2, col: 0xff4f4f },
  L: { word: 'Leaf', kind: 'prop_word_leaf', show: 'flutter', float: 0.9, col: 0x4cc75a, fit: 2.4 },
  M: { word: 'Moon', kind: 'prop_word_moon', show: 'rock', float: 1.0, col: 0xffd23a, look: true },
  N: { word: 'Nest', kind: 'prop_word_nest', show: 'wobble', col: 0xd8924f, fit: 1.7, wide: 2.8 },
  O: { word: 'Octopus', kind: 'prop_word_octopus', show: 'wobble', col: 0xff7fbf, look: true },
  P: { word: 'Pig', creature: 'pig', show: 'call', call: 'oink', col: 0xff9ec4 },
  Q: { word: 'Queen', kind: 'prop_word_queen', show: 'wobble', col: 0xffc21a, look: true },
  R: { word: 'Rabbit', creature: 'bunny', show: 'call', call: 'hop', col: 0xf2e8d8 },
  S: { word: 'Sun', kind: 'prop_word_sun', show: 'spin', float: 1.0, col: 0xffc21a, look: true },
  T: { word: 'Tree', kind: 'prop_word_tree', show: 'sway', col: 0x4cc75a, fit: 3.1 },
};

// World-space box of the drawn shape (skinned meshes measured in their rest pose).
function boxOf(o) {
  o.updateMatrixWorld(true);
  const b = new T.Box3();
  o.traverse((m) => { if (m.isMesh && !m.userData.outline && m.visible) b.expandByObject(m); });
  return b;
}

// The picture for a letter: a Group whose origin is the bottom centre of the model, scaled to fit about h tall.
export function makeWord(ch) {
  const W = WORDS[ch];
  let inner = null;
  if (W.creature && hasCreature(W.creature)) inner = makeCreature(W.creature);
  else if (W.kind) {
    inner = propModel(W.kind);
    // a picture breathes a little but never turns to follow the finger
    if (inner?.userData.model && !W.look) inner.userData.model.userData.noLook = true;
  }
  if (!inner) {
    // never a hole in the game: a plain toy ball in the word's colour
    inner = new T.Group();
    const s = mesh(geo.sphere(0.9, 24, 18), W.col, { outline: 0.03 }); s.position.y = 0.9; inner.add(s);
  }
  const g = new T.Group();
  g.add(inner);
  const b = boxOf(inner), sz = b.getSize(new T.Vector3());
  const k = Math.min((W.fit || 2.8) / Math.max(0.01, sz.y), (W.wide || 2.7) / Math.max(0.01, sz.x));
  inner.scale.multiplyScalar(k);
  const b2 = boxOf(inner), c = b2.getCenter(new T.Vector3());
  inner.position.x -= c.x; inner.position.z -= c.z; inner.position.y -= b2.min.y;
  g.userData = { inner, ch, w: W, k, h: b2.getSize(new T.Vector3()).y, creature: !!(W.creature && inner.userData.creature) };
  return g;
}

// Its pop-out show (about 1.3 s, calm; no boings: the letter's ta-da has just rung, only creatures call out). s = tween scope, g = makeWord() group already placed and popped in.
export function showWord(s, g) {
  const u = g.userData, W = u.w, inner = u.inner;
  const y0 = g.position.y;
  const face = inner.userData.face || inner.userData.model?.userData.face;
  switch (W.show) {
    case 'bounce': {
      return s.anim(1.3, (_, p) => {
        const hops = [[0, 0.5, 1.1], [0.5, 0.85, 0.45], [0.85, 1, 0.12]];
        let y = 0;
        for (const [a, b2, h] of hops) if (p >= a && p < b2) { const q = (p - a) / (b2 - a); y = Math.sin(q * Math.PI) * h; }
        g.position.y = y0 + y;
        const land = Math.min(1, Math.min(...hops.map(([a]) => Math.abs(p - a))) / 0.05);
        const sq = 1 - (1 - land) * 0.18;
        inner.scale.set(u.k / Math.sqrt(sq), u.k * sq, u.k / Math.sqrt(sq));
        inner.rotation.y = p * Math.PI * 2;
      }).then(() => { g.position.y = y0; inner.scale.setScalar(u.k); inner.rotation.y = 0; });
    }
    case 'call': {
      const call = { meow: sfx.meow, quack: sfx.quack, oink: sfx.oink }[W.call];
      if (call) call();
      if (face) { setFace(face, 'joy'); s.wait(1.2).then(() => setFace(face, 'happy')); }
      const arms = inner.userData.arms || inner.userData.wings, r0 = arms ? arms.map((a) => a.rotation.z) : null;
      // (creatures only: props have no limbs)
      inner.userData.kick?.(new T.Vector3(0, 4, 0));
      return s.anim(1.3, (_, p) => {
        const hop = W.call === 'hop' ? Math.abs(Math.sin(p * Math.PI * 3)) * 0.6 : Math.sin(Math.min(1, p * 2) * Math.PI) * 0.5;
        g.position.y = y0 + hop * (1 - p * 0.3);
        if (arms) arms.forEach((a, i) => (a.rotation.z = r0[i] + (i ? -1 : 1) * Math.sin(p * Math.PI) * 1.4));
        inner.rotation.y = Math.sin(p * Math.PI * 2) * 0.35;
      }).then(() => { g.position.y = y0; inner.rotation.y = 0; if (arms) arms.forEach((a, i) => (a.rotation.z = r0[i])); });
    }
    case 'wobble':
      // rocks on its round bottom (lifted as it tips, so it rolls on the ground instead of sinking in)
      return s.anim(1.3, (_, p) => { const r = Math.sin(p * Math.PI * 4) * 0.28 * (1 - p); inner.rotation.z = r; g.position.y = y0 + Math.abs(Math.sin(r)) * 0.35; }).then(() => { inner.rotation.z = 0; g.position.y = y0; });
    case 'flip':
      return s.anim(1.2, (e, p) => { inner.rotation.z = e * Math.PI * 2; g.position.y = y0 + Math.sin(p * Math.PI) * 0.9; }, Ease.inOut).then(() => { inner.rotation.z = 0; g.position.y = y0; });
    case 'jiggle':
      return s.anim(1.2, (_, p) => { const w = 1 + Math.sin(p * Math.PI * 4) * 0.12 * (1 - p); inner.scale.set(u.k * w, (u.k / w), u.k * w); }).then(() => inner.scale.setScalar(u.k));
    case 'spin':
      return s.anim(1.3, (e, p) => { inner.rotation.y = e * Math.PI * 2; g.position.y = y0 + Math.sin(p * Math.PI) * 0.4; }, Ease.inOut).then(() => { inner.rotation.y = 0; g.position.y = y0; });
    case 'float':
      return s.anim(1.3, (_, p) => { g.position.y = y0 + Math.sin(p * Math.PI * 2) * 0.3; const w = 1 + Math.sin(p * Math.PI * 4) * 0.1; inner.scale.set(u.k * w, u.k / w, u.k * w); }).then(() => { g.position.y = y0; inner.scale.setScalar(u.k); });
    case 'fly':
      return s.anim(1.3, (_, p) => { g.position.y = y0 + Math.sin(p * Math.PI) * 0.8; inner.rotation.z = Math.sin(p * Math.PI * 3) * 0.3; }).then(() => { g.position.y = y0; inner.rotation.z = 0; });
    case 'flutter':
      return s.anim(1.3, (_, p) => { g.position.y = y0 + (1 - p) * 0.7; inner.rotation.z = Math.sin(p * Math.PI * 3) * 0.45 * (1 - p * 0.5); g.position.x += Math.cos(p * Math.PI * 3) * 0.01; }).then(() => { g.position.y = y0; inner.rotation.z = 0; });
    case 'rock':
      return s.anim(1.3, (_, p) => { inner.rotation.z = Math.sin(p * Math.PI * 3) * 0.3 * (1 - p); }).then(() => { inner.rotation.z = 0; });
    case 'hoot':
      bsfx.hoot();
      if (face) { setFace(face, 'joy'); s.wait(1.2).then(() => setFace(face, 'happy')); }
      return s.anim(1.3, (_, p) => { g.position.y = y0 + Math.abs(Math.sin(p * Math.PI * 2)) * 0.3; inner.rotation.z = Math.sin(p * Math.PI * 2) * 0.18; }).then(() => { g.position.y = y0; inner.rotation.z = 0; });
    case 'sparkle':
      return s.anim(1.3, (e, p) => { inner.rotation.y = e * Math.PI * 2; g.position.y = y0 + Math.sin(p * Math.PI) * 0.35; }, Ease.inOut).then(() => { inner.rotation.y = 0; g.position.y = y0; });
    case 'sway':
    default:
      return s.anim(1.3, (_, p) => { const r = Math.sin(p * Math.PI * 3) * 0.12 * (1 - p); inner.rotation.z = r; g.position.y = y0 + Math.abs(Math.sin(r)) * 0.3; }).then(() => { inner.rotation.z = 0; g.position.y = y0; });
  }
}
export { fx };
