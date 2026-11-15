// Bunny. Contract: userData { head, face (from makeFace, for emotions), body, arms[2], kind: 'bunny' }; feet at y=0, faces +z, ~2.4 units tall.
import * as T from '../three.js';
import { mesh, geo, ink, blobShadow, toon, basic } from '../engine/toon.js';
import { C, makeFace } from '../engine/faces.js';
import { makeBiped } from './biped.js';

export function makeBunny() {
  return makeBiped('bunny');
}
