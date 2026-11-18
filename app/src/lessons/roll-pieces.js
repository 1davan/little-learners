// Roll & push: the toy-track models (tools/blender/creatures/prop_roll.py) as game objects, the track's measures, and
// the little 2-D geometry the hoglet rolls on.
//   World layout: the plinth top is at y = BASE; one step is 0.4; column ci (0..10) is centred at x = ci - 5.5 (c0 under
//   the log, c1..c10 the track); everything that rolls moves in the plane z = 0. The chute runs from x 5.0 into the nest.
import * as T from '../three.js';
import { scProp } from '../engine/scenery.js';
import { prop } from './view-tools.js';
import { propModel } from '../engine/prop-models.js';
import { toon, basic } from '../engine/toon.js';

export const BASE = 0.8;            // world y of the plinth top (track height 0)
export const STEP = 0.4;
export const R = 0.42;              // the hoglet's radius
export const colX = (ci) => ci - 5.5;
export const topY = (h) => BASE + h * STEP;
export const CHUTE_X = 5.0;         // the chute starts at the right edge of c10
export const NEST_X = 8.28;         // the nest's centre (world x); its rows are at z 0, -0.9, -1.8
export const NEST_ROWS = [{ z: 0, y: 0.3 }, { z: -0.9, y: 0.8 }, { z: -1.8, y: 1.3 }];   // the mat tops (half a ball per row)
export const NEST_COLS = [-0.88, 0.12, 1.12, 2.12, 3.12].map((x) => NEST_X + x);          // 1.0 apart: babies never touch
export const PAD_X = NEST_X - 1.82;  // the landing pad / lane at the nest's left end
export const COLORS = { red: 0xff4a4a, green: 0x3fc25a, purple: 0xa064f0 };
export const WOOD_TINT = [0xffffff, 0xffd9a0, 0x9cb6f2];      // birch, honey oak, periwinkle (per level: Level 3 is cool so its red, orange and yellow pieces stand out at sunset)

// the chute's top surface (world), from the lip at (5.0, track 1 step) curving down to its end above the nest pad
export function chutePts() {
  const pts = [];
  for (let i = 0; i <= 14; i++) { const t = i / 14; pts.push([CHUTE_X + 1.15 * t, topY(1) - 0.85 * (3 * t * t - 2 * t ** 3)]); }
  return pts;
}

// ---------------------------------------------------------------- models
const ink = (k) => ({ ink: k });
export function wood(kind, tint, inkW = 0.02) { return scProp(kind, {}, { tint, ink: inkW }); }

export function makeColumn(tint) {
  const g = new T.Group();
  const m = scProp('prop_rl_column', { rails: {}, lines: { ink: 0 } }, { tint, ink: 0.02 });
  if (m) g.add(m);
  g.userData.body = m;
  return g;
}
export function makeSlopeCap(tint) { return scProp('prop_rl_slope', { rails: {} }, { tint, ink: 0.02 }); }
export function makeLiftCap() { return scProp('prop_rl_lifttop', { arrows: {} }, ink(0.02)); }
export function makePlinth() { return scProp('prop_rl_plinth', { sockets: { ink: 0.012 }, foot: { ink: 0 } }, ink(0.024)); }
export function makeLog() { return scProp('prop_rl_log', { moss: {}, leaf: { ink: 0.012 }, win: { ink: 0 }, winrim: { ink: 0.012 } }, ink(0.024)); }
export function makeChute(tint) { return scProp('prop_rl_chute', {}, { tint, ink: 0.02 }); }
export function makeNest() { return scProp('prop_rl_nest', { mat: { ink: 0.014 }, lane: { ink: 0.014 }, rail: { ink: 0.02 } }, ink(0.022)); }
// (the nest's rows: tops at y 0.25 / 0.75 / 1.25, seats 1.0 apart, so every baby's face shows over the row in front)
export function makeCushion(tint) {
  const c = new T.Color(tint).lerp(new T.Color(0xffffff), 0.32).getHex();
  return scProp('prop_rl_cushion', { seat: { tint: c, ink: 0.01 } }, { tint, ink: 0.016 });
}

// a yellow tap block (n stacked): origin = bottom middle; vis bobs for hints
export function makePop(n = 1) {
  const g = new T.Group(), vis = new T.Group();
  for (let i = 0; i < n; i++) { const b = scProp('prop_rl_pop', { ring: { ink: 0.012 } }, ink(0.022)); if (b) { b.position.y = i; vis.add(b); } }
  g.add(vis);
  g.userData.vis = vis;
  return g;
}
export function makePlank() {
  const g = new T.Group(), vis = new T.Group();
  const p = scProp('prop_rl_plank', { ring: { ink: 0.012 } }, ink(0.02));
  if (p) vis.add(p);
  g.add(vis);
  g.userData.vis = vis;
  return g;
}
export function makeBox() { const g = new T.Group(), vis = new T.Group(); const m = scProp('prop_rl_box', { chev: { ink: 0.01 } }, ink(0.022)); if (m) vis.add(m); g.add(vis); g.userData.vis = vis; return g; }
export function makeRamp() { const g = new T.Group(), vis = new T.Group(); const m = scProp('prop_rl_ramp', { rails: { ink: 0.01 }, chev: { ink: 0.01 } }, ink(0.02)); if (m) vis.add(m); g.add(vis); g.userData.vis = vis; return g; }
export function makeCart() {
  const g = new T.Group(), vis = new T.Group();
  const m = scProp('prop_rl_cart', { rim: { ink: 0.012 }, chassis: { ink: 0.014 } }, ink(0.022));
  if (m) { m.scale.x = 0.94; vis.add(m); }   // a hair inside its collider: its corner never touches into what holds it
  const wheels = [];
  for (const [x, z] of [[-0.3, 0.62], [0.3, 0.62], [-0.3, -0.62], [0.3, -0.62]]) {
    const w = scProp('prop_rl_wheel', { hub: { ink: 0.008 } }, ink(0.014));
    if (!w) continue;
    const p = new T.Group();
    p.position.set(x, 0.16, z);
    if (z < 0) w.rotation.y = Math.PI;
    p.add(w);
    vis.add(p);
    wheels.push(p);
  }
  g.add(vis);
  g.userData.vis = vis;
  g.userData.wheels = wheels;
  return g;
}
// a door: the frame (static) and the leaf (slides up into the hood); origin = bottom middle on the track
export function makeDoor(color) {
  const g = new T.Group();
  const f = scProp('prop_rl_doorframe', {}, { tint: 0xffffff, ink: 0.018 });
  if (f) g.add(f);
  const leaf = new T.Group(), vis = new T.Group();
  const l = scProp('prop_rl_door', { window: { ink: 0.008 }, frame: { ink: 0.008 } }, { tint: COLORS[color] || color, ink: 0.018 });
  if (l) vis.add(l);
  leaf.add(vis);
  leaf.userData.vis = vis;
  g.add(leaf);
  g.userData.leaf = leaf;
  return g;
}
// a dome button for the plinth's front face (facing +z); dome sinks on press. arrow: the purple lift arrows
export function makeButton(color, arrow = false) {
  const g = new T.Group();
  const ring = scProp('prop_rl_button', { prop_rl_button: false, ring: {} }, { ink: 0.014 });
  if (ring) g.add(ring);
  const dome = new T.Group();
  const d = scProp('prop_rl_button', arrow ? { arrow: { ink: 0, tint: 0xffffff } } : {}, { tint: COLORS[color] || color, ink: 0.014 });
  if (d) dome.add(d);
  g.add(dome);
  g.userData.dome = dome;
  g.userData.vis = dome;
  return g;
}
// a flat cable strip of length len (along +y from the origin), tinted, facing +z; plus a bright overlay that "lights"
export function makeCable(color, len) {
  const g = new T.Group();
  const c = scProp('prop_rl_cable', {}, { tint: COLORS[color] || color, ink: 0 });
  if (c) { c.scale.set(1, len, 0.35); g.add(c); }      // thin, so it never pokes out of the plinth's slot
  const lit = new T.Mesh(new T.PlaneGeometry(0.06, 1), basic(0xfff6c0, { transparent: true, opacity: 0.85 }));
  lit.geometry.translate(0, 0.5, 0);
  lit.position.z = 0.0095;
  lit.scale.set(1, 0.0001, 1);
  lit.visible = false;
  g.add(lit);
  g.userData.lit = lit;
  g.userData.len = len;
  return g;
}
export function makeSeesaw() { const g = new T.Group(), vis = new T.Group(); const m = scProp('prop_rl_seesaw', { stripes: { ink: 0.006 } }, ink(0.02)); if (m) vis.add(m); g.add(vis); g.userData.vis = vis; return g; }
export function makePivot(tint) { return scProp('prop_rl_pivot', { saddle: {} }, { tint, ink: 0.022 }); }
export function makeHatch() {
  const g = new T.Group();
  const hole = scProp('prop_rl_hatch', { prop_rl_hatch: false, hole: { ink: 0 } }, ink(0.01));
  if (hole) g.add(hole);
  const door = new T.Group();
  const d = scProp('prop_rl_hatch', {}, ink(0.014));
  if (d) door.add(d);
  g.add(door);
  g.userData.door = door;
  return g;
}

// ---------------------------------------------------------------- the Thinkrolls-style pieces
// a stack of three fat cookies (origin = bottom middle); userData.cookies bottom to top
export function makeCookieStack() {
  const g = new T.Group(), vis = new T.Group();
  const cookies = [];
  for (let i = 0; i < 3; i++) {
    const c = new T.Group();
    const m = scProp('prop_rl_cookie', { chips: { ink: 0.01 } }, ink(0.018));
    const b = scProp('prop_rl_cookie_bit', { chips: { ink: 0.01 } }, ink(0.018));
    if (m) c.add(m);
    if (b) { b.visible = false; c.add(b); }
    c.position.y = i * 0.33;
    c.rotation.y = i * 1.3;
    c.userData = { whole: m, bit: b };
    vis.add(c);
    cookies.push(c);
  }
  g.add(vis);
  g.userData.vis = vis;
  g.userData.cookies = cookies;
  return g;
}
export function makeCrumb() { return scProp('prop_rl_crumb', { chips: { ink: 0 } }, ink(0.004)); }
export function makeJelly() { const g = new T.Group(), vis = new T.Group(); const m = scProp('prop_rl_jelly', { shine: { ink: 0 } }, ink(0.02)); if (m) vis.add(m); g.add(vis); g.userData.vis = vis; return g; }
// the balloon: origin = the bottom of its string (where it ties on); vis = balloon + string
export function makeBalloon() { const g = new T.Group(), vis = new T.Group(); const m = scProp('prop_rl_balloon', { shine: { ink: 0 }, string: { ink: 0.006 } }, ink(0.018)); if (m) vis.add(m); g.add(vis); g.userData.vis = vis; return g; }
export function makePeg() { return scProp('prop_rl_peg', {}, ink(0.012)); }
export function makeCrate() { const g = new T.Group(), vis = new T.Group(); const m = scProp('prop_rl_crate', { planks: { ink: 0.008 }, chev: { ink: 0.01 } }, ink(0.022)); if (m) vis.add(m); g.add(vis); g.userData.vis = vis; return g; }
export function makeStone() { const g = new T.Group(), vis = new T.Group(); const m = scProp('prop_rl_stone', { band: { ink: 0.01 }, chev: { ink: 0.01 } }, ink(0.022)); if (m) vis.add(m); g.add(vis); g.userData.vis = vis; return g; }
export function makeWater() {
  const g = scProp('prop_rl_water', { surf: { ink: 0 }, rim: { ink: 0 } }, { ink: 0 });
  if (!g) return new T.Group();
  g.traverse((o) => { if (o.isMesh && o.material) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.72; o.material.depthWrite = false; o.renderOrder = 2; } });
  return g;
}

// ---------------------------------------------------------------- the hoglet
// 12 looks: a head-thing (a small meadow prop sitting on the face cap, so it never rolls) and a quill tint
export const HEAD_THINGS = ['prop_m_leaf', 'prop_m_cherry', 'prop_m_flower', 'prop_m_acorn', 'prop_m_bow', 'prop_m_strawberry',
  'prop_m_blueberry', 'prop_m_mushroom', 'prop_m_petal', 'prop_m_pompom', 'prop_bloom_daisy', 'prop_clover', 'prop_m_partyhat', 'prop_m_crown',
  'prop_m_glasses'];
export const VARIANTS = HEAD_THINGS.length;   // 15 looks: every baby has its own head-thing (and quill colour)
export const QUILLS = [0x9a6644, 0x7d5236, 0xc08850, 0xd6b48a, 0xa39a92, 0x86766e];
export const NOTE_TINTS = [0x8fd46a, 0xffc94a, 0xff9f8a, 0x7cc8f0, 0xc9a2f0, 0xffb0cc];

// hog (Group at the ball centre) > ball (spins about z) + face (upright cap at z 0.36 with the code face and head-thing)
export function makeHoglet(v) {
  const hog = new T.Group();
  const ball = scProp('prop_rl_hogball', {}, { tint: QUILLS[v % QUILLS.length], ink: 0.014 }) || new T.Group();
  hog.add(ball);
  const lean = new T.Group();             // leans into the travel and squashes on landings (visual only)
  lean.position.z = 0.36;
  hog.add(lean);
  const look = new T.Group();             // turns a little toward what the hoglet looks at
  lean.add(look);
  const fw = prop('prop_rl_hogface');
  let face = null;
  if (fw) {
    look.add(fw);
    face = fw.userData.face;
    const u = fw.userData.model?.userData;
    const hd = u?.anchors?.head;
    const thing = propModel(HEAD_THINGS[v % HEAD_THINGS.length]);
    if (thing && hd) {
      const b = new T.Box3().setFromObject(thing), s = b.getSize(new T.Vector3());
      const k = 0.22 / Math.max(0.05, s.x, s.y, s.z);
      thing.scale.multiplyScalar(k);
      thing.updateMatrixWorld(true);
      const b2 = new T.Box3().setFromObject(thing);
      thing.position.set(hd[0] + 0.03, hd[1] - b2.min.y - 0.035, hd[2] - 0.02);
      thing.rotation.z = -0.25;
      const m = thing.userData.model?.userData;
      if (m) { m.noWalk = true; m.noLook = true; }
      fw.add(thing);
    }
  }
  hog.userData = { ball, lean, look, face, faceWrap: fw, v };
  return hog;
}

// ---------------------------------------------------------------- 2-D geometry (world x, y) for the rolling
// A polygon is { pts: [[x, y], ...] counter-clockwise }. contact(x, y) gives the height the ball's centre would sit at on
// the polygon's upward-facing edges at x (or -Infinity), counting only contacts low enough to roll onto (lips up to
// CLIMB); `wall` is set when something higher is in the way.
const CLIMB = 0.17;
const clamp1 = (v) => Math.max(-3, Math.min(3, v));
export function floorAt(polys, x, y, out = {}) {
  let best = -Infinity, wall = false, slope = 0;
  const bottom = y - R;
  for (const P of polys) {
    if (x + R < P.x0 || x - R > P.x1) continue;
    const pts = P.pts, n = pts.length;
    for (let i = 0; i < n; i++) {
      const a = pts[i], b = pts[(i + 1) % n];
      // outward normal of a CCW edge a->b is (dy, -dx): keep edges that face up
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const len = Math.hypot(dx, dy) || 1;
      if (-dx / len < 0.05) continue;     // n.y = -dx / len: facing up only
      // candidates: the tangent point and the two ends (within reach)
      const x0 = Math.min(a[0], b[0]), x1 = Math.max(a[0], b[0]);
      const m = dy / dx;
      let cands = 0, cv = -Infinity, cy = 0, cm = 0, cpx = 0;
      const tryP = (px, py, isTan) => {
        const u = px - x;
        if (Math.abs(u) > R) return;
        const v = py + Math.sqrt(Math.max(0, R * R - u * u));
        if (v > cv) { cv = v; cy = py; cm = isTan ? m : clamp1(u / Math.sqrt(Math.max(1e-6, R * R - u * u))); cpx = px; }
        cands++;
      };
      const k = Math.sqrt(1 + m * m);
      const pxT = x + (m * R) / k;
      if (pxT >= x0 && pxT <= x1) tryP(pxT, a[1] + m * (pxT - a[0]), true);
      tryP(a[0], a[1], false);
      tryP(b[0], b[1], false);
      if (!cands) continue;
      if (cy > y - 0.03) continue;          // a floor is always under the centre: anything higher is overhead
      // something high AHEAD (the hoglet always rolls to +x) is a wall; a corner behind it is the ledge it rolls off
      // (things above the centre - a raised door, a hood - are not in the way; depth() still stops a real overlap)
      if (cy - bottom > CLIMB && cpx > x + 0.002) { if (cv > y + 0.002 && cy < y) wall = true; continue; }
      if (cv > best) { best = cv; slope = cm; }
    }
  }
  out.y = best; out.wall = wall; out.slope = slope;
  return out;
}
// how deep a circle at (x, y) sinks into the nearest polygon edge (0 = clear)
export function depth(polys, x, y) {
  let d = 0;
  for (const P of polys) {
    if (x + R < P.x0 || x - R > P.x1) continue;
    const pts = P.pts, n = pts.length;
    for (let i = 0; i < n; i++) {
      const a = pts[i], b = pts[(i + 1) % n];
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy || 1)));
      const ex = a[0] + dx * t - x, ey = a[1] + dy * t - y;
      d = Math.max(d, R - Math.sqrt(ex * ex + ey * ey));
    }
  }
  return d;
}
// does a circle at (x, y) overlap any polygon edge (deeper than tol)?
export function overlaps(polys, x, y, tol = 0.01) {
  const r2 = (R - tol) * (R - tol);
  for (const P of polys) {
    if (x + R < P.x0 || x - R > P.x1) continue;
    const pts = P.pts, n = pts.length;
    for (let i = 0; i < n; i++) {
      const a = pts[i], b = pts[(i + 1) % n];
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy || 1)));
      const ex = a[0] + dx * t - x, ey = a[1] + dy * t - y;
      if (ex * ex + ey * ey < r2) return P;
    }
  }
  return null;
}
export function poly(pts, owner = null) {
  let x0 = Infinity, x1 = -Infinity;
  for (const p of pts) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); }
  return { pts, x0, x1, owner };
}
// a rectangle [x0, x1] x [y0, y1] turned by angle a about (cx, cy)
export function rectPoly(x0, x1, y0, y1, a = 0, cx = 0, cy = 0, owner = null) {
  const c = Math.cos(a), s = Math.sin(a);
  const P = (x, y) => { const u = x - cx, v = y - cy; return [cx + u * c - v * s, cy + u * s + v * c]; };
  return poly([P(x0, y0), P(x1, y0), P(x1, y1), P(x0, y1)], owner);
}

// ---------------------------------------------------------------- the home-page icon
// A little stretch of track: two columns and a slope, a hoglet ball rolling down toward a yellow block
export function makeRollIcon() {
  const g = new T.Group(), k = 0.55;
  const s = new T.Group();
  s.scale.setScalar(k);
  g.add(s);
  const tint = 0xffe0b0;
  [[-1, 2], [0, 1], [1, 1]].forEach(([x, h], i) => {
    const c = makeColumn(tint);
    c.position.set(x, h * 0.4 + 0.9, 0);
    // only the top bit shows: hide below the pedestal by scaling the column short
    if (c.userData.body) { c.userData.body.scale.y = (h * 0.4 + 0.9) / 3.2; }
    s.add(c);
    if (i === 0) { const cap = makeSlopeCap(tint); if (cap) { cap.position.set(0, 0, 0); c.add(cap); cap.position.y = 0; } }
  });
  const pop = makePop(1);
  pop.position.set(1, 1.3, 0);
  s.add(pop);
  const h = makeHoglet(0);
  h.position.set(-1.0, 1.7 + 0.2 + R / Math.cos(Math.atan(0.4)), 0);
  h.userData.ball.rotation.z = 0.4;
  s.add(h);
  g.userData.hog = h;
  return g;
}
