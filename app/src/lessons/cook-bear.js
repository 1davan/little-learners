// Cook a soup: Bear's paws really hold things.
// Bear's arms are single bones (shoulder -> paw), so a paw can only be where the arm reaches: on a sphere round the
// shoulder. To put a paw on a tool, Bear shuffles along his step and leans in (plan()), and every frame - after the
// engine's motion layer has swayed him - each holding arm is aimed at its goal and stretched a touch (0.88..1.18)
// to land on it (apply()). The game then moves the held thing by the last tiny error, so the paw is always on the
// handle and nothing is ever "held by nobody".
//   rig.hold(i, goalFn, dur)   arm i (0 = Bear's left, at -x; 1 = right, at +x) reaches for goalFn() (world point)
//   rig.free(i, dur)           the arm goes back to its tucked pose
//   rig.plan([{ i, p }, ...])  where to stand and how far to lean so those paws can reach those points
//   rig.paw[i]                 the paw's centre (world), valid after apply()
//   rig.look(p | null)         Bear looks at what he is doing (or back at the child)
import * as T from '../three.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const _a = new T.Vector3(), _b = new T.Vector3(), _q = new T.Quaternion(), _q2 = new T.Quaternion();
const LEANS = Array.from({ length: 21 }, (_, k) => k * 0.025);   // 0 .. 0.5 rad

export class BearRig {
  // f: the bear (already scaled), raise: the step height, z: where he stands, limits: { back, low } (see clipOK)
  constructor(f, { raise, z, x = 0, tuck = -0.42, top = 1.15, levels = [0.03, 0.2, 0.5, 1.0] }) {
    const u = f.userData;
    this.f = f; this.u = u;
    this.arms = u.arms;
    this.body = u.body && u.body !== f && u.body.isBone ? u.body : null;
    this.head = u.head && u.head !== u.body && u.head.isBone ? u.head : null;
    this.raise = raise; this.top = top; this.levels = levels;
    this.limits = null;       // per level: how far forward (world z) the body may reach below it (null = anywhere)
    this.x = x; this.xTo = x; this.vx = 0;
    this.z = z; this.zTo = z;
    this.lean = 0; this.leanTo = 0;
    this.goal = [null, null]; this.last = [new T.Vector3(), new T.Vector3()];
    this.w = [0, 0]; this.wTo = [0, 0]; this.wRate = [3, 3];
    this.paw = [new T.Vector3(), new T.Vector3()];
    this.sy = [1, 1];
    this.lookAt = null; this.hy = 0; this.hx = 0;
    this.sl = 0; this.slTo = 0; this.by0 = this.body ? this.body.position.y : 0;
    const rest = (u.rest || this.arms.map((b) => b.rotation.clone()));
    // the tucked idle pose, and the paw centre in each arm bone's own space (from the hand anchors at rest)
    this.tuck = rest.map((r, i) => new T.Quaternion().setFromEuler(new T.Euler(r.x, r.y, r.z + (i ? -tuck : tuck), r.order)));
    const p0 = f.position.clone(), r0 = f.rotation.y;
    f.position.set(0, raise, 0); f.rotation.y = 0;
    if (this.body) this.body.rotation.set(0, 0, 0);
    this.arms.forEach((a, i) => a.rotation.copy(rest[i]));
    f.updateMatrixWorld(true);
    const anchors = {};
    f.traverse((o) => { if (o.name === 'anchor_handL' || o.name === 'anchor_handR') anchors[o.name] = o; });
    this.pawL = this.arms.map((a, i) => {
      const an = anchors[i ? 'anchor_handR' : 'anchor_handL'];
      const w = an ? an.getWorldPosition(new T.Vector3()) : a.localToWorld(new T.Vector3(0, 0.72, 0));
      const l = a.worldToLocal(w);
      // the anchor sits on the paw's front: its centre is a little further in along the arm
      return new T.Vector3(l.x * 0.5, l.y * 0.97, l.z * 0.5);
    });
    this.ws = this.arms[0].getWorldScale(new T.Vector3()).x;
    this.La = this.pawL[0].length() * this.ws;
    // per lean: the shoulders (relative to the root), and how far forward the low part of the body reaches
    this.table = LEANS.map((lean) => {
      if (this.body) this.body.rotation.x = lean;
      f.updateMatrixWorld(true);
      const sh = this.arms.map((a) => a.getWorldPosition(new T.Vector3()));
      return { lean, sh, ...this.scanFront(f) };
    });
    if (this.body) this.body.rotation.x = 0;
    this.arms.forEach((a, i) => a.quaternion.copy(this.tuck[i]));
    f.position.copy(p0); f.rotation.y = r0;
    f.updateMatrixWorld(true);
  }
  // the furthest-forward point of the body (not the arms) below each level (world y = top + level), relative to the root
  scanFront(f) {
    const v = new T.Vector3();
    const front = this.levels.map(() => -9);
    f.traverse((m) => {
      if (!m.isSkinnedMesh || m.userData.outline || !m.visible) return;
      const sk = m.skeleton, idx = this.arms.map((a) => sk.bones.indexOf(a));
      const pos = m.geometry.attributes.position, si = m.geometry.attributes.skinIndex, sw = m.geometry.attributes.skinWeight;
      for (let k = 0; k < pos.count; k += 2) {
        let aw = 0;
        for (let j = 0; j < 4; j++) if (idx.includes(si.getComponent(k, j))) aw += sw.getComponent(k, j);
        if (aw > 0.25) continue;
        m.getVertexPosition(k, v); v.applyMatrix4(m.matrixWorld);
        this.levels.forEach((l, j) => { if (v.y < this.top + l) front[j] = Math.max(front[j], v.z); });
      }
    });
    return { front };
  }
  // can Bear lean this far standing at z? (this.limits[j]: nothing of the body below level j may reach past it)
  clipOK(t, z = this.z, limits = this.limits) {
    if (!limits) return true;
    return limits.every((lim, j) => lim === null || lim === undefined || z + t.front[j] < lim);
  }
  // the furthest back Bear can stand at lean 0 and still keep his body behind these limits
  standZ(limits) { const t = this.table[0]; return Math.min(...limits.map((lim, j) => (lim === null || lim === undefined ? 9 : lim - t.front[j] - 0.01))); }

  // Where to stand (x) and how far to lean so the paws reach these world points.
  plan(goals, { leanMax = 0.5, z = this.zTo } = {}) {
    if (!goals.length) return null;
    const La = this.La, dxMin = 0.3, dxMax = 0.6;
    let best = null;
    for (const t of this.table) {
      if (t.lean > leanMax + 1e-6) break;
      if (t.lean > 0 && !this.clipOK(t, z)) continue;
      let x, err = 0;
      if (goals.length === 1) {
        const { i, p } = goals[0], S = t.sh[i], side = i ? 1 : -1;
        const dz = p.z - (z + S.z), dy = p.y - S.y;
        const r2 = La * La - dz * dz - dy * dy;
        const dx = clamp(Math.sqrt(Math.max(0, r2)), dxMin, dxMax);
        x = p.x - side * dx - S.x;
        err = Math.abs(Math.hypot(dx, dz, dy) - La);
      } else {
        x = goals.reduce((s, g) => s + g.p.x - t.sh[g.i].x, 0) / goals.length;
        for (const { i, p } of goals) { const S = t.sh[i]; err += Math.abs(Math.hypot(p.x - (x + S.x), p.z - (z + S.z), p.y - S.y) - La); }
        err /= goals.length;
      }
      const score = err + t.lean * 0.12;
      if (!best || score < best.score - 1e-4) best = { score, x, lean: t.lean, err };
    }
    if (!best) return null;
    this.xTo = best.x;
    this.leanTo = best.lean;
    return best;
  }
  // arm i reaches for goal (a function returning a world point, or a point), taking dur seconds
  hold(i, goal, dur = 0.35) { this.goal[i] = goal; this.wTo[i] = 1; this.wRate[i] = 1 / Math.max(0.05, dur); }
  free(i, dur = 0.35) { if (this.goal[i]) this.last[i].copy(this.goalPoint(i)); this.goal[i] = null; this.wTo[i] = 0; this.wRate[i] = 1 / Math.max(0.05, dur); }
  held(i) { return !!this.goal[i] && this.w[i] > 0.999; }
  goalPoint(i) { const g = this.goal[i]; return g ? (typeof g === 'function' ? g() : g) : this.last[i]; }
  look(p) { this.lookAt = p ? p.clone() : null; }
  // a happy sigh: the shoulders drop a little (1) and come back (0)
  slump(v) { this.slTo = v; }

  // every frame (game update): shuffle along the step, lean, reach
  update(dt) {
    const f = this.f;
    // walk at a calm pace toward xTo (eased in and out; the motion layer adds the steps)
    const dx = this.xTo - this.x;
    const want = clamp(dx * 3.2, -2.2, 2.2);
    this.vx += clamp(want - this.vx, -dt * 7, dt * 7);
    if (Math.abs(dx) < 0.004 && Math.abs(this.vx) < 0.05) { this.x = this.xTo; this.vx = 0; } else this.x += this.vx * dt;
    this.z += clamp(this.zTo - this.z, -dt * 1.2, dt * 1.2);
    f.position.set(this.x, this.raise, this.z);
    this.lean += clamp(this.leanTo - this.lean, -dt * 0.9, dt * 0.9);
    if (this.body) this.body.rotation.x = this.lean;
    this.sl += clamp(this.slTo - this.sl, -dt * 2.5, dt * 2.5);
    if (this.body) this.body.position.y = this.by0 - this.sl * 0.045;
    for (let i = 0; i < 2; i++) this.w[i] = clamp(this.w[i] + clamp(this.wTo[i] - this.w[i], -dt * this.wRate[i], dt * this.wRate[i]), 0, 1);
    // the head: looks at the work (the engine's look-around is off while it does)
    const h = this.head, u = this.u;
    if (h) {
      let ty = 0, tx = 0;
      if (this.lookAt) {
        u.noLook = true;
        f.updateMatrixWorld(true);
        const hp = h.getWorldPosition(_a);
        const d = _b.copy(this.lookAt).sub(hp);
        ty = clamp(Math.atan2(d.x, Math.max(0.2, d.z)), -0.6, 0.6);
        tx = clamp(-Math.atan2(d.y, Math.hypot(d.x, d.z)) * 0.5 - this.lean * 0.8, -0.15, 0.2);
      }
      const k = Math.min(1, dt * 5);
      this.hy += (ty - this.hy) * k; this.hx += (tx - this.hx) * k;
      if (u.noLook) { h.rotation.y = this.hy; h.rotation.x = this.hx; }
      if (!this.lookAt && Math.abs(this.hy) < 0.01 && Math.abs(this.hx) < 0.01 && u.noLook) { u.noLook = false; h.rotation.x = 0; h.rotation.y = 0; }
    }
  }
  // just before the render (after the motion layer): aim and stretch the arms; rig.paw[i] is where each paw is
  apply() {
    const f = this.f;
    f.updateMatrixWorld(true);
    for (let i = 0; i < 2; i++) {
      const a = this.arms[i], w = this.w[i], base = this.tuck[i];
      if (w < 1e-4) {
        a.quaternion.copy(base); a.scale.set(1, 1, 1); this.sy[i] = 1;
      } else {
        const G = this.goalPoint(i);
        const d = a.parent.worldToLocal(_a.copy(G)).sub(a.position);
        const v = this.pawL[i];
        let sy = Math.sqrt(Math.max(0, d.lengthSq() - v.x * v.x - v.z * v.z)) / Math.abs(v.y);
        sy = clamp(sy, 0.88, 1.18);
        const sv = _b.set(v.x, v.y * sy, v.z).applyQuaternion(base).normalize();
        _q.setFromUnitVectors(sv, d.normalize()).multiply(base);
        a.quaternion.slerpQuaternions(base, _q, w);
        const s = 1 + (sy - 1) * w;
        a.scale.set(1, s, 1);
        this.sy[i] = s;
      }
      a.updateMatrixWorld(true);
      this.paw[i].copy(this.pawL[i]).applyMatrix4(a.matrixWorld);
    }
  }
}
