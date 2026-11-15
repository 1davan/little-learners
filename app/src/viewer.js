// Dev-only model viewer: shows one character from the front, three-quarter and side, for checking models.
// Use from the console / tools/snap.js:  __ll.router.go('viewer', { kind: 'crab', emo: 'happy', bg: 'meadow' })
import * as T from './three.js';
import { scene, onFrame, setSky, setCamera } from './engine/stage.js';
import { scope } from './engine/tween.js';
import { disposeTree, mesh, geo } from './engine/toon.js';
import { makeAnimal, makePip, setFace, breathe } from './engine/actors.js';
import { makeFarmAnimal } from './engine/farm.js';
import { makeCrab, makeDuck, makeGull } from './engine/beach.js';

export function makeModel(kind) {
  if (kind === 'pip') return makePip();
  if (kind === 'crab') return makeCrab();
  if (kind === 'duck') return makeDuck(1.6);
  if (kind === 'gull') return makeGull();
  if (kind === 'hen' || kind === 'chick') { const m = makeFarmAnimal(kind); if (kind === 'chick') m.scale.setScalar(1.4); return m; }
  return makeAnimal(kind);
}

export class Viewer {
  constructor(router, opts = {}) { this.opts = opts; this.root = new T.Group(); this.s = scope(); this.offs = []; }
  async start() {
    scene.add(this.root);
    setSky(this.opts.bg || 'meadow');
    const floor = mesh(geo.cyl(30, 30, 0.2, 40), 0x9fd07a, { outline: 0 }); floor.position.y = -0.1; this.root.add(floor);
    const close = !!this.opts.close;
    setCamera(new T.Vector3(0, close ? 2.2 : 2.6, close ? 6.5 : 12), new T.Vector3(0, close ? 1.6 : 1.5, 0));
    const list = this.opts.kinds;
    if (list) setCamera(new T.Vector3(0, 3, 17), new T.Vector3(0, 1.4, 0));
    const angles = list ? list.map(() => -0.3) : close ? [0] : [0, -0.75, -Math.PI / 2];
    const xs = list ? list.map((_, i) => (i - (list.length - 1) / 2) * 2.9) : close ? [0] : [-5, 0, 5];
    this.models = angles.map((a, i) => {
      const m = makeModel(list ? list[i] : this.opts.kind || 'bear');
      m.position.set(xs[i], 0, 0);
      m.rotation.y = a;
      if (this.opts.emo && m.userData.face) setFace(m.userData.face, this.opts.emo);
      this.root.add(m);
      return m;
    });
    this.offs.push(onFrame((dt, t) => { if (this.opts.animate) for (const m of this.models) breathe(m, t); }));
  }
  dispose() { this.s.kill(); for (const f of this.offs) f(); scene.remove(this.root); disposeTree(this.root); }
}
