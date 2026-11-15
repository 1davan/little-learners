// Game 7 — Where's Crab? Topics mt_qeZYF6HZ4o "Positional language" and mt_VY3rBq8RyP "Prepositions".
// Drag a beach friend IN, ON or UNDER a beach thing. Every round swaps the props (bucket, sandcastle, boat,
// umbrella, towel, box) and sometimes the friend; each position has its own gag:
// in → splash crown, on → wobbly ta-da balance, under → the prop covers the friend and its eyes peek out.
import * as T from '../three.js';
import { Lesson } from '../engine/lesson.js';
import { popIn, popOut, hop, wiggle } from '../engine/actors.js';
import { makeCrab, makeDuck, makeGull } from '../engine/beach.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';
import { makeProp, PROP_NAME, splashCrown, zoneIds } from './where-props.js';

const SPAWN = new T.Vector3(0.6, 0, 3.6);
const L = -3.4, R = 3.2;

// Who can be placed or can watch. size = scale; call = their sound.
const CAST = {
  crab: { name: 'Crab', make: () => makeCrab(), size: 1, call: 'squeak' },
  baby: { name: 'Baby Crab', make: () => makeCrab(0xff9f3f), size: 0.7, call: 'cheep' },
  duck: { name: 'Duck', make: () => makeDuck(1.6), size: 1.6, call: 'quack' },
  gull: { name: 'Gull', make: () => makeGull(), size: 1, call: 'gull' },
};

// Each round: want, props [[kind, mode, x]], who (placed), pal (watches and joins in), twist.
// Every round's zones have unique ids (in/on/under), so zones() never offers two "on"s.
const PLANS = [
  [
    { want: 'in', props: [['bucket', 'up', 2.6]] },
    { want: 'on', props: [['castle', null, -2.4]] },
    { want: 'in', props: [['boat', null, 2.4]], who: 'duck' },
    { want: 'on', props: [['towel', null, -2.2]], pal: 'gull' },
    { want: 'in', props: [['box', 'open', 2.4]], pal: 'baby' },
    { want: 'on', props: [['umbrella', null, -2.2]] },
  ],
  [
    { want: 'in', props: [['bucket', 'up', L], ['castle', null, R]] },
    { want: 'on', props: [['boat', null, L], ['castle', null, R]], pal: 'gull' },
    { want: 'under', props: [['bucket', 'up', L], ['umbrella', null, R]] },
    { want: 'in', props: [['towel', null, L], ['boat', null, R]], who: 'duck' },
    { want: 'under', props: [['box', 'open', L], ['bucket', 'down', R]], pal: 'baby' },
    { want: 'on', props: [['boat', null, L], ['box', 'shut', R]], who: 'gull' },
  ],
  [
    { want: 'on', props: [['boat', null, L], ['bucket', 'down', R]] },
    { want: 'under', props: [['umbrella', null, L], ['box', 'open', R]], pal: 'gull' },
    { want: 'in', props: [['umbrella', null, L], ['bucket', 'up', R]], who: 'baby', pal: 'crab' },
    { want: 'under', props: [['boat', null, L], ['box', 'shut', R]], who: 'duck' },
    { want: 'on', props: [['bucket', 'up', L], ['umbrella', null, R]] },
    { want: 'in', props: [['boat', null, L], ['bucket', 'down', R]], twist: 'swap' },
  ],
];
const WORD = { in: 'In', on: 'On', under: 'Under' };

export default class WhereLesson extends Lesson {
  build() {
    this.plan = PLANS[this.level];
    this.props = [];
    this.zoneList = [];
  }

  zones() {
    return this.zoneList.filter((z) => z.enabled !== false).map((z) => ({ ...z, pos: z.pos() }));
  }

  target() { return this.plan[this.round]?.want; }
  wantZone() { return this.zoneList.find((q) => q.id === this.target()); }

  setProps(spec) {
    const old = this.props;
    for (const p of old) popOut(this.s, p, 0.18).then(() => this.root.remove(p));
    this.props = [];
    this.zoneList = [];
    spec.props.forEach(([kind, mode, x], i) => {
      const p = makeProp(kind, mode);
      p.position.set(x, 0, 0);
      p.rotation.y = x < 0 ? 0.12 : -0.12;
      this.root.add(p);
      this.s.wait(0.08 + i * 0.1).then(() => { sfx.bloop(i * 2); popIn(this.s, p, 1, 0.4, { sound: false }); });
      p.scale.setScalar(0.001);
      this.props.push(p);
      for (const [id, z] of Object.entries(p.userData.zones)) {
        this.zoneList.push({
          id, prop: kind, obj: p, def: z, radius: z.radius,
          pos: () => p.localToWorld(z.pos.clone()),
          rest: () => p.localToWorld(z.rest.clone()),
        });
      }
    });
  }

  spawnChar(who, at) {
    const c = CAST[who];
    const g = c.make();
    g.userData.baseScale = g.scale.x;
    g.userData.who = who;
    g.position.copy(at);
    this.root.add(g);
    const ud = g.userData;
    // crab legs aren't in the model contract: use them if published, else find the thin low cylinders
    ud.legs = ud.legs || (ud.kind === 'crab' ? g.children.filter((m) => m.isMesh && m.geometry?.type === 'CylinderGeometry' && m.position.y < 0.4) : []);
    for (const l of ud.legs) l.userData.rx0 = l.rotation.x;
    ud.eyeQ = (ud.eyes || []).map((e) => e.quaternion.clone());
    for (const w of [...(ud.wings || []), ...(ud.claws || [])]) w.userData.r0 = w.rotation.clone();
    return g;
  }

  async startRound(r) {
    this.busy = true;
    const spec = this.plan[r];
    this.spec = spec;
    this.setProps(spec);
    const want = spec.want;
    // Level 1: only the place we want is live
    for (const z of this.zoneList) z.enabled = this.level > 0 || z.id === want;
    // the pal watches from the back of the beach
    if (this.pal) { this.root.remove(this.pal); this.pal = null; }
    if (spec.pal) {
      const pal = this.spawnChar(spec.pal, new T.Vector3(6.3, 0, -0.6));
      pal.rotation.y = -0.4;
      this.pal = pal;
      popIn(this.s, pal, pal.userData.baseScale, 0.4, { sound: false });
      this.s.wait(0.3).then(() => sfx[CAST[spec.pal].call]());
    }
    // the one to place scuttles in from the right
    const who = spec.who || 'crab';
    const ch = this.spawnChar(who, new T.Vector3(10, 0, SPAWN.z));
    this.char = this.crab = ch;
    sfx.patter();
    await this.s.anim(0.45, (e, p) => { ch.position.x = 10 + (SPAWN.x - 10) * e; ch.rotation.z = Math.sin(p * 28) * 0.1 * (1 - p); }, Ease.out);
    ch.rotation.z = 0;
    sfx[CAST[who].call]();
    if (spec.twist === 'swap') {
      // the two things swap places first — watch carefully!
      const [a, b] = this.props;
      const xa = a.position.x, xb = b.position.x;
      sfx.whoosh();
      this.s.anim(0.7, (e) => { a.position.x = xa + (xb - xa) * e; b.position.x = xb + (xa - xb) * e; a.position.z = Math.sin(e * Math.PI) * 1.2; b.position.z = -Math.sin(e * Math.PI) * 1.2; }, Ease.inOut);
      await this.wait(0.72);
    }
    this.drag = input.addDrag(ch, {
      radius: 1.1 * CAST[who].size, minY: 0, offset: new T.Vector3(0, 0.6, 0),
      zones: () => this.zones(),
      onPick: () => this.onPick(),
      onMove: (_t, z) => this.onHover(z),
      onDrop: (z, info) => this.drop(z, info),
    });
    this.busy = false;
    this.cue();
  }

  onPick() {
    const ch = this.char, base = ch.userData.baseScale;
    this.carrying = true;
    sfx[CAST[ch.userData.who].call]();
    this.s.tween(ch.scale, { x: base * 1.12, y: base * 1.12, z: base * 1.12 }, 0.15, Ease.back);
  }

  // a little hello from the prop when the friend is carried over it
  onHover(z) {
    const id = z ? z.obj.uuid : null;
    if (id === this.hoverId) return;
    this.hoverId = id;
    if (!z) return;
    sfx.tick();
    const w = z.obj.userData.wobble;
    if (w) this.s.anim(0.25, (_, p) => { const k = Math.sin(p * Math.PI) * 0.06; w.scale.set(1 + k, 1 - k, 1 + k); }).then(() => w.scale.setScalar(1));
  }

  promptText() {
    const spec = this.plan[this.round];
    if (!spec) return '';
    const p = spec.props.find(([k, m]) => zoneIds(k, m).includes(spec.want));
    const who = CAST[spec.who || 'crab'].name;
    const thing = PROP_NAME[p[0]];
    return `${WORD[spec.want]}! Put ${who} ${spec.want} the ${thing}.`;
  }

  goHome() {
    const ch = this.char, base = ch.userData.baseScale;
    this.carrying = false;
    this.s.tween(ch.position, { x: SPAWN.x, y: SPAWN.y, z: SPAWN.z }, 0.45, Ease.back);
    this.s.tween(ch.scale, { x: base, y: base, z: base }, 0.3);
  }

  async drop(zone, { tapped }) {
    const ch = this.char;
    this.hoverId = null;
    if (!zone) { this.goHome(); if (tapped) { sfx[CAST[ch.userData.who].call](); wiggle(this.s, ch, 0.3); } return; }
    const want = this.target();
    const wz = this.wantZone();
    // Level 2: dropping anywhere on the right thing counts; Level 3 needs the exact place
    const ok = zone.id === want || (this.level === 1 && zone.prop === wz.prop);
    if (!ok) {
      this.goHome();
      const w = zone.obj.userData.wobble;
      if (w) wiggle(this.s, w, 0.12, 0.4);
      this.redirect(`That's ${zone.id}. Find ${want}!`);
      return;
    }
    input.remove(this.drag);
    this.busy = true;
    this.carrying = false;
    const rest = wz.rest();
    const base = ch.userData.baseScale;
    this.s.tween(ch.scale, { x: base, y: base, z: base }, 0.15);
    let gag;
    if (want === 'in') {
      await this.s.tween(ch.position, { x: rest.x, y: rest.y + 2.2, z: rest.z }, 0.22, Ease.out);
      await this.s.tween(ch.position, { y: rest.y }, 0.2, Ease.in);
      gag = this.gagIn(wz, rest);
    } else if (want === 'on') {
      await this.s.tween(ch.position, { x: rest.x, y: rest.y + 1.0, z: rest.z }, 0.25, Ease.out);
      await this.s.tween(ch.position, { y: rest.y }, 0.16, Ease.in);
      gag = this.gagOn(rest);
    } else {
      gag = this.gagUnder(wz, rest);
      await this.wait(0.4);
    }
    this.busy = false;
    this.success(rest.clone().add(new T.Vector3(0, 1.6, 0)), `${WORD[want]}!`);
    this.palJoins(wz, rest);
    await gag;
  }

  // ---- gags (each ≤ ~0.9 s) ----
  gagIn(z, rest) {
    const ch = this.char, s = this.s, base = ch.userData.baseScale;
    const rimY = z.obj.position.y + (z.def.rim ?? 1);
    splashCrown(s, this.root, new T.Vector3(rest.x, rimY, rest.z), 1.0);
    // bob up out of the water, blink, settle back
    return s.anim(0.8, (_, p) => {
      ch.position.y = rest.y + Math.sin(p * Math.PI * 2) * 0.25 * (1 - p);
      const k = 1 + Math.sin(p * Math.PI * 3) * 0.1 * (1 - p);
      ch.scale.set(base / Math.sqrt(k), base * k, base / Math.sqrt(k));
    }).then(() => { ch.scale.setScalar(base); ch.position.y = rest.y; });
  }

  gagOn(rest) {
    const ch = this.char, s = this.s, base = ch.userData.baseScale, ud = ch.userData;
    sfx.boing();
    // land squash, wobble wobble (balancing!)… then claws up: ta-da!
    const claws = ud.claws || ud.wings || [];
    const c0 = claws.map((c) => c.rotation.z);
    s.wait(0.55).then(() => { sfx.twinkle(); fx.float(rest.clone().add(new T.Vector3(0, 2.2 * base, 0)), '✨', { color: '#ffb020', size: 6 }); });
    return s.anim(0.85, (_, p) => {
      const sq = p < 0.15 ? 1 - Math.sin((p / 0.15) * Math.PI) * 0.25 : 1;
      ch.scale.set(base / Math.sqrt(sq), base * sq, base / Math.sqrt(sq));
      ch.rotation.z = p < 0.6 ? Math.sin(p * Math.PI * 5) * 0.3 * (1 - p / 0.6) : 0;
      ch.position.x = rest.x - ch.rotation.z * 0.3;
      const up = p > 0.55 ? Ease.back(Math.min(1, (p - 0.55) / 0.2)) : 0;
      claws.forEach((c, i) => { c.rotation.z = c0[i] + (i ? -1 : 1) * up * 0.8; });
      if (p > 0.55) ch.position.y = rest.y + Math.sin(Math.min(1, (p - 0.55) / 0.3) * Math.PI) * 0.3;
    }).then(() => { ch.rotation.z = 0; ch.scale.setScalar(base); ch.position.copy(rest); claws.forEach((c, i) => (c.rotation.z = c0[i])); });
  }

  async gagUnder(z, rest) {
    const ch = this.char, s = this.s, base = ch.userData.baseScale, ud = ch.userData;
    const cover = z.obj.userData.cover;
    await cover.lift(s);
    sfx.patter();
    await s.tween(ch.position, { x: rest.x, y: rest.y, z: rest.z }, 0.2, Ease.inOut);
    // squash down low, so only the eyes will show
    s.tween(ch.scale, { y: base * 0.62 }, 0.12);
    await cover.drop(s);
    // nudge forward and peek out
    const fwd = cover.hides ? (ud.eyes ? 0.75 : 0.45) : 0.5;
    s.tween(ch.position, { z: rest.z + fwd }, 0.15, Ease.out);
    await cover.tip(s);
    sfx.pop();
    const eyes = ud.eyes || [];
    const ey = eyes.map((e) => e.scale.y);
    await s.anim(0.45, (_, p) => {
      // blink twice and glance left, right
      const b = Math.abs(Math.sin(p * Math.PI * 2));
      eyes.forEach((e, i) => { e.scale.y = ey[i] * (p < 0.4 ? Math.max(0.15, 1 - b * 0.9) : 1); e.rotation.y = p > 0.4 ? Math.sin((p - 0.4) / 0.6 * Math.PI * 2) * 0.6 : 0; });
      if (ud.head && !eyes.length) ud.head.rotation.y = Math.sin(p * Math.PI * 2) * 0.5;
    });
    eyes.forEach((e, i) => { e.scale.y = ey[i]; e.rotation.y = 0; });
    sfx.giggle();
  }

  // the watching friend hops over to join in
  palJoins(z, rest) {
    const pal = this.pal;
    if (!pal) return;
    const s = this.s, who = pal.userData.who;
    const side = rest.x > 0 ? -1 : 1;
    const to = new T.Vector3(rest.x + side * 1.9, 0, rest.z + 1.0);
    if (z.id === 'on') to.set(rest.x + side * 1.7, 0, rest.z + 1.2);
    s.wait(0.15).then(() => {
      sfx[CAST[who].call]();
      const from = pal.position.clone();
      pal.rotation.y = side > 0 ? -0.6 : 0.6;
      s.anim(0.45, (e, p) => {
        pal.position.lerpVectors(from, to, e);
        pal.position.y = Math.abs(Math.sin(p * Math.PI * 2)) * 0.6;
      }, Ease.inOut).then(() => { pal.position.y = 0; pal.rotation.y = side > 0 ? -0.3 : 0.3; sfx.land(); hop(s, pal, 0.4, 0.3); });
    });
  }

  async afterSuccess() {
    const ch = this.char, pal = this.pal;
    this.pal = null;
    sfx.patter();
    for (const g of [ch, pal]) {
      if (!g) continue;
      const base = g.userData.baseScale;
      g.scale.setScalar(base);
      g.rotation.y = 0.6;
      this.s.tween(g.position, { x: -12, y: g.position.y + 0.5 }, 0.6, Ease.in).then(() => this.root.remove(g));
    }
  }

  // ---- alive while carried: legs paddle, claws snap, eyes look at the nearest thing ----
  update(dt, t) {
    const ch = this.char;
    if (!ch || !ch.parent) return;
    const ud = ch.userData;
    const carrying = this.carrying && input.dragging();
    for (const l of ud.legs || []) l.rotation.x = l.userData.rx0 + (carrying ? Math.sin(t * 22 + l.position.z * 9) * 0.6 : 0);
    if (carrying) {
      for (const [i, c] of (ud.claws || []).entries()) c.rotation.x = c.userData.r0.x + Math.sin(t * 14 + i * 2) * 0.3;
      if (ud.wings) ud.wings.forEach((w, i) => { w.rotation.z = w.userData.r0.z + (i ? -1 : 1) * Math.sin(t * 18) * 0.5; });
      this.wasCarrying = true;
    } else if (this.wasCarrying) {
      this.wasCarrying = false;
      for (const w of [...(ud.wings || []), ...(ud.claws || [])]) { w.rotation.x = w.userData.r0.x; w.rotation.z = w.userData.r0.z; }
    }
    // look at the nearest prop
    let near = null, nd = Infinity;
    if (carrying) for (const p of this.props) { const d = p.position.distanceTo(ch.position); if (d < nd) { nd = d; near = p; } }
    const look = near ? near.localToWorld(new T.Vector3(0, 1.2, 0)) : null;
    const k = Math.min(1, dt * 10);
    (ud.eyes || []).forEach((e, i) => {
      if (look) {
        const q0 = e.quaternion.clone();
        e.lookAt(look);
        const q1 = e.quaternion.clone();
        e.quaternion.copy(q0).slerp(q1, k);
      } else if (ud.eyeQ?.[i]) e.quaternion.slerp(ud.eyeQ[i], k);
    });
    if (!ud.eyes && ud.head) {
      const yaw = look ? Math.atan2(look.x - ch.position.x, 3) : 0;
      ud.head.rotation.y += (yaw - ud.head.rotation.y) * k;
    }
    // the boat rocks on its puddle
    for (const p of this.props) if (p.userData.rock) p.userData.rock.rotation.z = Math.sin(t * 1.8) * 0.04;
  }

  showHint(glow = true) {
    const z = this.wantZone();
    if (!z || !this.char) return;
    const at = z.pos();
    if (glow) {
      const anchor = new T.Object3D();
      anchor.position.copy(at);
      this.root.add(anchor);
      this.addHalo(anchor, 1.2);
    }
    fx.ghostPath([this.char.position.clone().add(new T.Vector3(0, 0.6, 0)), at], { mode: 'drag' });
  }

  // Level 3 demo: show "pick it up and move", without showing where
  demoL3() {
    if (!this.char) return;
    const p = this.char.position.clone().add(new T.Vector3(0, 0.6, 0));
    fx.ghostPath([p, p.clone().add(new T.Vector3(0, 1.8, 0))], { mode: 'drag' });
  }

  makeErrorless() {
    const want = this.wantZone();
    for (const z of this.zoneList) if (z !== want) z.enabled = false;
    for (const p of this.props) if (p !== want.obj) this.s.tween(p.scale, { x: 0.6, y: 0.6, z: 0.6 }, 0.4);
  }

  onFinale() {
    // Crab shows off on every spot that's left: in, on, under
    const crab = this.spawnChar('crab', SPAWN.clone());
    for (const p of this.props) { p.userData.cover?.reset(); p.scale.setScalar(1); }
    (async () => {
      await this.wait(1.2);
      let i = 0;
      for (const z of this.zoneList) {
        const r = z.rest();
        const under = z.id === 'under';
        await this.s.tween(crab.position, { x: r.x, y: r.y + (under ? 0 : 1.5), z: r.z + (under ? 0.9 : 0) }, 0.45, Ease.inOut);
        await this.s.tween(crab.position, { y: r.y }, 0.2, Ease.in);
        sfx.note(i++ * 2);
        await this.wait(0.3);
      }
      hop(this.s, crab, 0.8, 0.45, { sound: true });
    })();
  }
}
