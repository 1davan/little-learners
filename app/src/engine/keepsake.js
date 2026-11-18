// Keepsake tray (docs/SATISFACTION.md E5): visible, lasting progress for pick-the-answer games whose rounds have no
// natural build-up (sizes, moo, pots, more, feelings...). A low wooden shelf (or a rug) IN THE 3D SCENE with n empty
// spots; tray.add(obj) carries the round's thing to the next spot, where it stays all level, breathing and pokeable.
// In the finale, frame it with creationView() { return tray.view(); } and creationObjects() { return tray.items(); }.
//
//   import { makeTray } from '../engine/keepsake.js';
//   this.tray = makeTray(this, 6, [0, 0, -3.2], { style: 'shelf' });   // in build(); 'this' = the lesson
//   ...
//   await this.tray.add(thing);           // in afterSuccess(): arcs (or walks) it onto the next spot
//
// makeTray(owner, n, pos, opts)
//   owner: the lesson (preferred: the tray goes in lesson.root, its items become pokeable and it is cleaned up with
//          the lesson), or any Object3D to add it to.
//   n:     number of spots.  pos: centre of the tray on the ground ([x, y, z] or Vector3, in owner.root space).
//   opts:  style 'shelf' (low plank on legs, default) | 'rug' (soft oval rug on the ground)
//          spacing (1.25), color, fit (max item width per spot, default spacing * 0.85),
//          scale (force an item scale; default: shrink to fit the spot, never grow)
// tray.add(obj, { walk, dur, arc }) -> Promise   obj keeps its world look; it is re-parented onto the tray.
//          walk: true for characters (moves along the ground at walking pace, turns to the camera on arrival);
//          otherwise it arcs (0.6-1.2 s). Landing plays sfx.step(index, n) (the level's rising note).
// tray.items()   the placed objects, in order.     tray.count / tray.full / tray.next() (index of the next spot)
// tray.spot(i)   world position of spot i.          tray.view(margin)  { pos, look } camera framing for the finale
// tray.group     the tray's Object3D.
import * as T from '../three.js';
import { mesh, geo } from './toon.js';
import { onFrame } from './stage.js';
import { sfx } from './audio.js';

const _box = new T.Box3(), _sz = new T.Vector3();

export function makeTray(owner, n, pos, opts = {}) {
  const lesson = owner && owner.root && owner.s ? owner : null;
  const parent = lesson ? lesson.root : owner;
  const s = lesson ? lesson.s : null;
  const { style = 'shelf', spacing = 1.25, color = style === 'rug' ? 0xf2b8a2 : 0xc98b4f } = opts;
  const fitW = opts.fit ?? spacing * 0.85;
  const width = n * spacing + 0.4;
  const g = new T.Group();
  g.name = 'keepsake-tray';
  if (Array.isArray(pos)) g.position.set(pos[0], pos[1] || 0, pos[2]); else if (pos) g.position.copy(pos);
  let topY;
  if (style === 'rug') {
    const rug = mesh(geo.cyl(1, 1, 0.06, 40), color, { outline: 0.02 });
    rug.scale.set(width / 2, 1, 0.9);
    rug.position.y = 0.03;
    const trim = mesh(geo.torus(1, 0.035, Math.PI * 2, 6, 48), 0xfff3e0, { outline: 0 });
    trim.rotation.x = Math.PI / 2; trim.scale.set(width / 2 - 0.08, 0.82, 1); trim.position.y = 0.065;
    g.add(rug, trim);
    topY = 0.07;
  } else {
    const plank = mesh(geo.box(width, 0.16, 0.95), color, { outline: 0.03 });
    plank.position.y = 0.36;
    g.add(plank);
    for (const sx of [-1, 1]) {
      const leg = mesh(geo.box(0.22, 0.3, 0.7), 0xa86f3c, { outline: 0.02 });
      leg.position.set(sx * (width / 2 - 0.35), 0.15, 0);
      g.add(leg);
    }
    topY = 0.44;
  }
  // empty spots: soft round dimples, so the child can see how many are still to fill
  const marks = [];
  const local = [];
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * spacing;
    local.push(new T.Vector3(x, topY, 0));
    const m = new T.Mesh(geo.circle(0.32, 24), new T.MeshBasicMaterial({ color: 0x3a2838, transparent: true, opacity: 0.13, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(x, topY + 0.006, 0);
    g.add(m);
    marks.push(m);
  }
  parent.add(g);

  const placed = []; // slot groups (each holds one item, breathes gently)
  const anim = (dur, fn) => (s ? s.anim(dur, fn) : new Promise((res) => { let t = 0; const off = onFrame((dt) => { t += dt; const p = Math.min(1, t / dur); fn(p, p); if (p >= 1) { off(); res(); } }); }));
  const offBreath = onFrame((_dt, t) => {
    for (let i = 0; i < placed.length; i++) { const sl = placed[i]; if (!sl.userData.landing) sl.scale.y = 1 + Math.sin(t * 2 + i * 1.3) * 0.015; }
  });
  if (lesson) lesson.offs.push(offBreath);

  const tray = {
    group: g,
    get count() { return placed.length; },
    get full() { return placed.length >= n; },
    next() { return Math.min(placed.length, n - 1); },
    spot(i) { return g.localToWorld(local[Math.max(0, Math.min(n - 1, i))].clone()); },
    items() { return placed.map((sl) => sl.children[0]).filter(Boolean); },
    slots() { return placed.slice(); },
    view(margin = 1) {
      const c = g.getWorldPosition(new T.Vector3());
      const d = Math.max(5.5, (width * 0.95 + 2.5) * margin);
      return { pos: new T.Vector3(c.x, c.y + topY + 1.6 + d * 0.12, c.z + d), look: new T.Vector3(c.x, c.y + topY + 0.7, c.z) };
    },
    async add(obj, { walk = false, dur, arc = 0.9 } = {}) {
      if (placed.length >= n) return;
      const i = placed.length;
      const slot = new T.Group();
      slot.position.copy(local[i]);
      slot.userData.landing = true;
      g.add(slot);
      placed.push(slot);
      marks[i].visible = false;
      // fit: measure the item's world size, shrink to fit the spot (never grow)
      obj.updateMatrixWorld(true);
      _box.setFromObject(obj); _box.getSize(_sz);
      const w = Math.max(_sz.x, _sz.z) || 1;
      const below = obj.getWorldPosition(new T.Vector3()).y - _box.min.y; // origin height above its lowest point
      const want = opts.scale ?? Math.min(1, fitW / w);
      // re-parent into the slot, keeping its world transform, then travel to the slot origin
      slot.attach(obj);
      const from = obj.position.clone(), to = new T.Vector3(0, Math.max(0, below * want), 0); // rest on its lowest point
      const scale0 = obj.scale.clone(), scale1 = scale0.clone().multiplyScalar(want);
      const yaw0 = obj.rotation.y;
      const dist = from.length();
      const time = dur ?? (walk ? Math.min(2.2, Math.max(0.8, dist / 2.4)) : Math.min(1.2, Math.max(0.6, dist / 4)));
      const heading = Math.atan2(to.x - from.x, to.z - from.z);
      await anim(time, (_e, p) => {
        const e = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
        obj.position.lerpVectors(from, to, e);
        if (walk) {
          obj.rotation.y = yaw0 + (heading - yaw0) * Math.min(1, p * 4) * (p < 0.8 ? 1 : (1 - p) / 0.2);
          if (from.y > to.y + 0.05) obj.position.y = from.y + (to.y - from.y) * Math.min(1, p * 1.6) + Math.sin(Math.min(1, p * 1.6) * Math.PI) * 0.35;
        } else obj.position.y += Math.sin(p * Math.PI) * arc;
        obj.scale.lerpVectors(scale0, scale1, e);
      });
      obj.position.copy(to);
      obj.scale.copy(scale1);
      if (walk) obj.rotation.y = 0;
      sfx.step(i, n, { soft: true });
      // a small landing squash on the slot (the item's own transform stays clean)
      await anim(0.28, (_e, p) => { const q = Math.sin(p * Math.PI) * (1 - p * 0.4) * 0.1; slot.scale.set(1 + q * 0.5, 1 - q, 1 + q * 0.5); });
      slot.scale.set(1, 1, 1);
      slot.userData.landing = false;
      if (lesson && lesson.pokeable) lesson.pokeable(obj, { note: i, of: n });
    },
    dispose() { offBreath(); },
  };
  return tray;
}
