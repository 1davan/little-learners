// Cook a soup: the kitchen. The Snack chef kitchen (walls, window, island counter with its sink, fridge) re-dressed for
// cooking: a little table-top stove with a pot on it at the left, the chopping board in the middle, the veg bowl at the
// right. All Blender props; the soup itself (a rippling surface, bubbles,
// steam, splashes) is code because it is liquid and air.
import * as T from '../three.js';
import { toon, toonUnique, basic, geo } from '../engine/toon.js';
import { scProp } from '../engine/scenery.js';
import { propModel } from '../engine/prop-models.js';
import { makeKitchen, TOP, LANE_Z } from './snack-kitchen.js';

export { TOP, LANE_Z };
export const COUNTER_BACK = -1.18;                           // the worktop's back edge (Bear stands just behind it)
// the low hob (prop_ck_hob): its panel centre, the burner (the pot stands over it) and the dial on top at the front right
export const HOB = new T.Vector3(-2.95, TOP, 0.0);
export const HOB_K = 1.0;
export const BURNER = new T.Vector3(HOB.x - 0.25, TOP, HOB.z - 0.1);
export const KNOB_AT = new T.Vector3(HOB.x + 0.95, TOP + 0.12, HOB.z + 0.5);
export const POT_K = 0.95;
export const POT_Y = TOP + 0.165 * HOB_K;                    // the pot stands on the low grate
export const POT = new T.Vector3(BURNER.x, POT_Y, BURNER.z);
export const POT_RIM = POT_Y + 0.88 * POT_K;
export const POT_IN = 0.9 * POT_K;                           // inner radius
export const POT_R = 0.97 * POT_K + 0.06;                    // the rim's outer edge
// the chopping board lies at the back of the worktop, where Bear can reach it (handle toward the veg bowl)
export const BOARD_K = 1.1;
export const BW = 0.85 * BOARD_K, BD = 0.5 * BOARD_K;       // the board's half length / depth
export const BOARD = new T.Vector3(-0.35, TOP, COUNTER_BACK + 0.08 + BD);
export const BOARD_TOP = 0.1 * BOARD_K;                      // above the counter
export const VBOWL = new T.Vector3(3.05, TOP, 0.0);
export const VBOWL_K = 1.38;
// the knife (scaled KNIFE_K) lies flat on its wooden rest on the worktop right of the board, blade pointing away
// from Bear and its handle toward him, low enough that his paw takes it well below his chin
export const KNIFE_K = 0.8;
export const KNIFE_GRIP = new T.Vector3(1.04, 0.26, 0);       // the middle of the handle (knife model space)
export const KBLOCK = new T.Vector3(BOARD.x + BW + 0.36 + 0.32, TOP, 0.0);
export const KNIFE_REST_Q = new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(new T.Vector3(0, 0, -1), new T.Vector3(1, 0, 0), new T.Vector3(0, -1, 0)));
export const KNIFE_REST = new T.Vector3(KBLOCK.x - 0.21 * KNIFE_K, TOP + 0.33 + 0.026 * KNIFE_K, 0.016);
export const KNIFE_LIFT = new T.Vector3(0, 0.22, -0.06);       // how it comes up off the rest
// Bear stands on his long kitchen step behind the counter (feet at STEP_Y)
export const STEP_Y = 1.0;
export const STEP = new T.Vector3(-1.2, 0, COUNTER_BACK - 0.62);
export const FRIEND_AT = new T.Vector3(BOARD.x + 0.35, STEP_Y, LANE_Z);

// the card's rows (card space, see prop_cook.py): the middle of row i, just in front of the paper
const TILT = 10 * Math.PI / 180, HC = 0.85;
export function cardRow(i, x = 0, z = 0.05) {
  const y = [0.52, 0.17, -0.18, -0.53][i];
  const cy = 0.62 + HC * Math.cos(TILT), cz = -HC * Math.sin(TILT);
  return new T.Vector3(x, cy + y * Math.cos(TILT) + z * Math.sin(TILT), cz - y * Math.sin(TILT) + z * Math.cos(TILT));
}
export const CARD_TILT = TILT;

export function makeCookKitchen(look = 'morning') {
  const K = makeKitchen(look);
  const g = K.group;
  for (const o of [K.soap, K.bowl, K.board]) if (o) o.visible = false;

  // ---- the stove: a knob on the front, a lamp beside it, flames under the pot ----
  const hob = scProp('prop_ck_hob', { trim: {}, well: { ink: 0.012 }, dish: { ink: 0.012 }, grate: {}, knob: {}, ridge: {}, pointer: { ink: 0.008 }, lamp: {} }, { ink: 0.02 });
  let knob = null, lamp = null;
  if (hob) {
    hob.scale.setScalar(HOB_K);
    hob.position.copy(HOB);
    g.add(hob);
    // the dial turns about its own vertical axis: re-hang it on a pivot there
    const km = hob.userData.parts.knob, kp = hob.userData.parts.pointer, kr = hob.userData.parts.ridge;
    if (km) {
      const C = new T.Vector3(0.95, 0.12, 0.5);
      knob = new T.Group();
      knob.position.copy(C);
      hob.add(knob);
      for (const m of [km, kr, kp]) if (m) { hob.remove(m); m.position.sub(C); knob.add(m); }
    }
    lamp = hob.userData.parts.lamp || null;
    if (lamp) lamp.material = toon(0xb9b2c0, { vertexColors: true });
  }
  // a ring of gas-flame tongues round the pot's bottom (the game flickers each one)
  const flame = new T.Group();
  flame.position.set(BURNER.x, TOP + 0.11 * HOB_K, BURNER.z);
  const NF = 16;
  for (let i = 0; i < NF; i++) {
    const tg = scProp('prop_ck_flame', { core: { ink: 0 } }, { ink: 0.008 });
    if (!tg) break;
    const a = (i / NF) * Math.PI * 2;
    const w = new T.Group();
    w.position.set(Math.sin(a) * (POT_R - 0.02), 0, Math.cos(a) * (POT_R - 0.02));
    w.rotation.set(0.18, a, 0, 'YXZ');          // leaning out a little from the pot's side
    tg.scale.setScalar(i % 2 ? 1.3 : 1.08);
    w.add(tg);
    w.userData.ph = Math.random() * 6;
    w.userData.k = tg.scale.x;
    flame.add(w);
  }
  flame.userData.base = [1, 1];
  flame.scale.set(0.001, 0.001, 0.001);
  flame.visible = false;
  g.add(flame);
  // a warm glow on the burner when it's lit
  const glowTex = radialTex('rgba(255,170,60,0.85)', 'rgba(255,120,40,0)');
  const glow = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, opacity: 0, fog: false }));
  glow.rotation.x = -Math.PI / 2;
  glow.scale.setScalar(2.9);
  glow.position.set(BURNER.x, TOP + 0.125 * HOB_K, BURNER.z);
  glow.renderOrder = 1;
  g.add(glow);

  // ---- the pot (red handles) ----
  const pot = scProp('prop_cookpot', { rim: {}, handles: { tint: 0xff6a50 } }, { ink: 0.024 });
  if (pot) { pot.scale.setScalar(POT_K); pot.position.copy(POT); g.add(pot); }

  // ---- the chopping board: a carrier (lifts, carries, tips) with the board model and a 'top' for the pieces ----
  const carrier = new T.Group();
  carrier.position.copy(BOARD);
  const board = scProp('prop_k_board', {}, { ink: 0.018 });
  if (board) { board.scale.setScalar(BOARD_K); carrier.add(board); }   // handle toward the veg bowl
  const top = new T.Group();
  top.position.y = BOARD_TOP;
  carrier.add(top);
  g.add(carrier);

  // ---- the veg bowl ----
  const vbowl = propModel('prop_woodbowl', { tint: 0x8fd3ff });
  if (vbowl) { vbowl.scale.setScalar(VBOWL_K); vbowl.position.copy(VBOWL); g.add(vbowl); const u = vbowl.userData.model.userData; u.noWalk = true; u.noLook = true; }

  // ---- the knife: a pivot at the middle of its cutting edge ----
  const knife = new T.Group();
  const km = scProp('prop_ck_knife', { spine: {}, handle: {}, rivets: {} }, { ink: 0.016 });
  if (km) { km.scale.setScalar(KNIFE_K); knife.add(km); }
  knife.position.copy(KNIFE_REST);
  knife.quaternion.copy(KNIFE_REST_Q);
  g.add(knife);

  // ---- the knife block ----
  const kblock = scProp('prop_ck_block', { band: {}, slot: { ink: 0.008 } }, { ink: 0.018 });
  if (kblock) { kblock.position.copy(KBLOCK); g.add(kblock); }

  // ---- Bear's step (behind the counter) ----
  const step = scProp('prop_ck_step', { frame: {}, stripe: {} }, { ink: 0.02 });
  if (step) { step.position.copy(STEP); g.add(step); }

  const soup = makeSoup(g);
  return { K, group: g, hob, knob, lamp, flame, glow, pot, carrier, board, top, vbowl, knife, kblock, soup, step };
}

export function radialTex(a, b) {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d');
  const r = x.createRadialGradient(32, 32, 2, 32, 32, 32);
  r.addColorStop(0, a); r.addColorStop(1, b);
  x.fillStyle = r; x.fillRect(0, 0, 64, 64);
  const t = new T.CanvasTexture(c);
  t.colorSpace = T.SRGBColorSpace;
  return t;
}

// ---------------- the soup ----------------
// A rippling surface inside the pot that rises a little with each vegetable and takes on their colours, bubbles and
// steam when the stove is on, splashes and rings where things drop in.
export function makeSoup(parent) {
  const g = new T.Group();
  g.position.copy(POT);
  parent.add(g);
  const R = POT_IN - 0.015;
  const sg = new T.RingGeometry(0, R, 48, 8);
  sg.rotateX(-Math.PI / 2);
  const base = sg.attributes.position.array.slice();
  const col = new T.Color(0xffd98a);           // a light golden broth to start
  const mat = toonUnique(col.getHex());
  const surf = new T.Mesh(sg, mat);
  surf.renderOrder = 0;
  g.add(surf);
  const steamTex = radialTex('rgba(255,255,255,0.75)', 'rgba(255,255,255,0)');
  const ringMat = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, depthWrite: false });
  const fx = [];      // { o, t, dur, kind, ... }
  const S = {
    group: g, R, level: 0.42 * POT_K, heat: 0, stir: 0, col, target: col.clone(),
    get y() { return this.level; },
    setLevel(l) { this.levelTo = l; },
    tint(hex, amt = 0.45) { this.target.lerp(new T.Color(hex), amt); },
    // a splash where something lands (local x, z): a ring and a few drops
    splash(x, z, big = 1) {
      const ring = new T.Mesh(geo.ring(0.8, 1, 32), ringMat.clone());
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(x, S.level + 0.012, z);
      ring.scale.setScalar(0.05);
      g.add(ring);
      fx.push({ o: ring, t: 0, dur: 0.6, kind: 'ring', s: 0.28 * big });
      for (let i = 0; i < Math.round(3 * big); i++) {
        const d = new T.Mesh(geo.sphere(0.035, 8, 6), toon(S.col.getHex()));
        d.position.set(x, S.level + 0.03, z);
        g.add(d);
        const a = Math.random() * Math.PI * 2, sp = 0.5 + Math.random() * 0.6;
        fx.push({ o: d, t: 0, dur: 0.5, kind: 'drop', v: new T.Vector3(Math.cos(a) * sp, 1.3 + Math.random() * 0.8, Math.sin(a) * sp) });
      }
    },
    update(dt, t) {
      // the level and colour ease toward their targets
      if (this.levelTo !== undefined) this.level += (this.levelTo - this.level) * Math.min(1, dt * 2);
      this.col.lerp(this.target, Math.min(1, dt * 1.2));
      mat.color.copy(this.col);
      // gentle waves (bigger when it bubbles or is stirred)
      const p = sg.attributes.position.array, amp = 0.006 + 0.012 * this.heat + 0.02 * this.stir;
      for (let i = 0; i < p.length; i += 3) {
        const x = base[i], z = base[i + 2], r = Math.hypot(x, z);
        p[i + 1] = this.level + amp * Math.sin(t * 2.4 + r * 7 + x * 2) * Math.min(1, (R - r) * 6);
      }
      sg.attributes.position.needsUpdate = true;
      // bubbles and steam while it cooks
      if (this.heat > 0.3) {
        if (Math.random() < dt * 4 * this.heat) {
          const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * (R - 0.15);
          const b = new T.Mesh(geo.sphere(1, 10, 8), toon(new T.Color().copy(this.col).lerp(new T.Color(0xffffff), 0.35).getHex()));
          b.position.set(Math.cos(a) * r, this.level, Math.sin(a) * r);
          b.scale.setScalar(0.001);
          g.add(b);
          fx.push({ o: b, t: 0, dur: 0.55 + Math.random() * 0.4, kind: 'bub', s: 0.04 + Math.random() * 0.04 });
        }
        if (Math.random() < dt * 2.6 * this.heat) {
          const m = new T.Sprite(new T.SpriteMaterial({ map: steamTex, transparent: true, depthWrite: false, opacity: 0 }));
          const a = Math.random() * Math.PI * 2, r = Math.random() * R * 0.7;
          m.position.set(Math.cos(a) * r, this.level + 0.2, Math.sin(a) * r);
          m.scale.setScalar(0.5);
          g.add(m);
          fx.push({ o: m, t: 0, dur: 2.2, kind: 'steam', dx: (Math.random() - 0.5) * 0.3 });
        }
      }
      for (let i = fx.length - 1; i >= 0; i--) {
        const f = fx[i];
        f.t += dt;
        const k = Math.min(1, f.t / f.dur);
        if (f.kind === 'ring') { f.o.scale.setScalar(0.05 + f.s * k * 3); f.o.material.opacity = 0.6 * (1 - k); }
        else if (f.kind === 'drop') { f.v.y -= 6 * dt; f.o.position.addScaledVector(f.v, dt); f.o.scale.setScalar(1 - k * 0.5); }
        else if (f.kind === 'bub') { const s = f.s * Math.sin(Math.min(1, k * 1.15) * Math.PI * 0.5); f.o.scale.set(s, s * 0.7, s); f.o.position.y = this.level; if (k >= 1 && Math.random() < 0.5) S.onPop && S.onPop(); }
        else if (f.kind === 'steam') { f.o.position.y += dt * 0.55; f.o.position.x += f.dx * dt; f.o.scale.setScalar(0.5 + k * 1.1); f.o.material.opacity = 0.42 * Math.sin(k * Math.PI); }
        if (k >= 1) { g.remove(f.o); if (f.o.material && !f.o.material.userData.shared) f.o.material.dispose(); fx.splice(i, 1); }
      }
    },
  };
  return S;
}
