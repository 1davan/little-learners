// Brick letters: every uppercase letter A–T as stroke polylines (centre lines, in writing order), and the layout
// that spreads N bricks along those strokes. Each brick is a straight block spanning one piece of a stroke, turned
// along it, so a 5-brick letter (long bricks) and a 20-brick letter (short bricks) both read as the same letter.
//
//   layoutLetter('B', 5, { H, t }) → { W, H, slots: [{ x, y, ang, len, stroke, k }] }   (letter-local: origin at the
//   bottom-left of the letter box, y up; x/y = brick centre, ang = its direction, len = its length incl. caps)
//
// Stroke ends: cap > 0 extends a free end past its centre-line point (square stroke ends that reach the letter box);
// cap = 0 butts it against the stroke it joins, with a thin seam, like real bricks.

const DEG = Math.PI / 180;
// points on an ellipse arc (degrees, either direction)
function arc(cx, cy, rx, ry, a0, a1, n = 18) {
  const out = [];
  for (let i = 0; i <= n; i++) { const a = (a0 + (a1 - a0) * (i / n)) * DEG; out.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); }
  return out;
}
// alt: a simpler path used when the stroke gets only one or two bricks (so a 5-brick B still reads as B)
const S = (pts, cap0 = 0, cap1 = 0, alt = null) => ({ pts, cap0, cap1, alt });

// Each letter: (H, c, brick) → { W, strokes }. c = half the stroke thickness. brick = true for Brick letters' block layout
// (a few joints get a little more room there, so no two bricks overlap; the plain strokes, e.g. the Letter friends
// station sign, are unchanged).
export const LETTERS = {
  A(H, c, brick) {
    const W = 0.9 * H, ax0 = W / 2, ay = H - c * 0.45;
    const l0 = [c * 1.1, c], r0 = [W - c * 1.1, c];
    // the legs end side by side at the top, their inner top corners just touching on the centre line
    let th = Math.atan2(ay - c, ax0 - l0[0]);
    for (let i = 0; i < 3; i++) th = Math.atan2(ay - c, ax0 - c * Math.sin(th) - l0[0]);
    const ax = ax0 - c * Math.sin(th) * 1.02;
    // the cross bar butts against the inner edges of the legs
    const yb = 0.34 * H;
    const xAt = (p, q, y) => p[0] + (q[0] - p[0]) * ((y - p[1]) / (q[1] - p[1]));
    const inset = c / Math.sin(th) + (brick ? 0.08 : 0.02);
    const rt = [W - ax, ay];
    return { W, strokes: [S([l0, [ax, ay]], c, 0), S([r0, rt], c, 0), S([[xAt(l0, [ax, ay], yb) + inset, yb], [xAt(r0, rt, yb) - inset, yb]])] };
  },
  B(H, c) {
    const W = 0.74 * H, my = 0.52 * H, bx = 0.44 * W;
    const ryU = (H - c - my) / 2, ryL = (my - c) / 2;
    const up = [[2 * c, H - c], ...arc(bx, my + ryU, W * 0.88 - c - bx, ryU, 90, -90), [2 * c, my]];
    const lo = [...arc(bx, c + ryL, W - c - bx, ryL, 90, -90), [2 * c, c]];
    const loFew = [[2 * c, my - c * 0.4], ...arc(bx, c + ryL, W - c - bx, ryL, 60, -90).slice(1), [2 * c, c]];
    return { W, strokes: [S([[c, c], [c, H - c]], c, c), S(up), S(lo, 0, 0, loFew)] };
  },
  C(H, c) {
    const W = 0.84 * H;
    return { W, strokes: [S(arc(W / 2, H / 2, W / 2 - c, H / 2 - c, 42, 318, 28), c * 0.6, c * 0.6)] };
  },
  D(H, c) {
    const W = 0.8 * H, bx = 0.36 * W;
    return { W, strokes: [S([[c, c], [c, H - c]], c, c), S([[2 * c, H - c], ...arc(bx, H / 2, W - c - bx, H / 2 - c, 90, -90, 20), [2 * c, c]])] };
  },
  E(H, c) {
    const W = 0.66 * H;
    return { W, strokes: [S([[c, H - c], [c, c]], c, c), S([[2 * c, H - c], [W - c, H - c]], 0, c), S([[2 * c, H / 2], [W * 0.9 - c, H / 2]], 0, c), S([[2 * c, c], [W - c, c]], 0, c)] };
  },
  F(H, c) {
    const W = 0.64 * H;
    return { W, strokes: [S([[c, H - c], [c, c]], c, c), S([[2 * c, H - c], [W - c, H - c]], 0, c), S([[2 * c, 0.52 * H], [W * 0.88 - c, 0.52 * H]], 0, c)] };
  },
  G(H, c, brick) {
    const W = 0.86 * H, rx = W / 2 - c, ry = H / 2 - c;
    return { W, strokes: [S(arc(W / 2, H / 2, rx, ry, 40, 360, 30), c * 0.6, 0), S([[W - 2 * c - (brick ? 0.08 : 0), H / 2], [W * 0.54, H / 2]], 0, c)] };
  },
  H(H, c) {
    const W = 0.8 * H;
    return { W, strokes: [S([[c, H - c], [c, c]], c, c), S([[W - c, H - c], [W - c, c]], c, c), S([[2 * c, H / 2], [W - 2 * c, H / 2]])] };
  },
  I(H, c) {
    const W = 0.56 * H;
    return { W, strokes: [S([[c, H - c], [W - c, H - c]], c, c), S([[W / 2, H - 2 * c], [W / 2, 2 * c]]), S([[c, c], [W - c, c]], c, c)] };
  },
  J(H, c) {
    const W = 0.66 * H, sx = W - 2.2 * c, rx = (sx - c) / 2, cy = 0.34 * H;
    return { W, strokes: [S([[0.3 * W, H - c], [W - c, H - c]], c, c), S([[sx, H - 2 * c], [sx, cy], ...arc(sx - rx, cy, rx, cy - c, 0, -170, 16).slice(1)], 0, c * 0.6)] };
  },
  K(H, c, brick) {
    const W = 0.78 * H, jy = 0.42 * H;
    const arm = [[W - c * 1.1, H - c], [2.6 * c, jy]];
    const m = [arm[0][0] + (arm[1][0] - arm[0][0]) * 0.62, arm[0][1] + (arm[1][1] - arm[0][1]) * 0.62];
    const leg = brick ? [m[0] + c * 0.95, m[1] - c * 1.35] : [m[0] + c * 0.5, m[1] - c * 0.6];
    return { W, strokes: [S([[c, H - c], [c, c]], c, c), S(arm, c, 0), S([leg, [W - c * 1.1, c]], 0, c)] };
  },
  L(H, c) {
    const W = 0.62 * H;
    return { W, strokes: [S([[c, H - c], [c, c]], c, c), S([[2 * c, c], [W - c, c]], 0, c)] };
  },
  M(H, c) {
    const W = 0.96 * H, vy = 0.3 * H;
    // both legs first, then the V hangs between them (the V's ends give way to the legs)
    return { W, strokes: [S([[c, c], [c, H - c]], c, c), S([[W - c, H - c], [W - c, c]], c, c), S([[c * 1.6, H - c * 1.6], [W / 2, vy]], 0, c * 0.4), S([[W / 2, vy], [W - c * 1.6, H - c * 1.6]], 0, 0)] };
  },
  N(H, c) {
    const W = 0.82 * H;
    return { W, strokes: [S([[c, c], [c, H - c]], c, c), S([[W - c, c], [W - c, H - c]], c, c), S([[c * 1.7, H - c * 1.3], [W - c * 1.7, c * 1.3]])] };
  },
  O(H, c) {
    const W = 0.86 * H;
    return { W, strokes: [S(arc(W / 2, H / 2, W / 2 - c, H / 2 - c, 90, 450, 36))] };
  },
  P(H, c) {
    const W = 0.7 * H, my = 0.44 * H, bx = 0.42 * W, ry = (H - c - my) / 2;
    return { W, strokes: [S([[c, H - c], [c, c]], c, c), S([[2 * c, H - c], ...arc(bx, my + ry, W - c - bx, ry, 90, -90), [2 * c, my]])] };
  },
  Q(H, c, brick) {
    const W = 0.88 * H, rx = W / 2 - c, ry = H / 2 - c, a = -52 * DEG, k = brick ? 1.15 : 0.6;
    const p0 = [W / 2 + (rx + c * k) * Math.cos(a), H / 2 + (ry + c * k) * Math.sin(a)];
    return { W, strokes: [S(arc(W / 2, H / 2, rx, ry, 90, 450, 36)), S([[p0[0] - c * 0.3, p0[1] + c * 0.3], [W - c * 0.3, c * 0.1]], 0, c * 0.5)] };
  },
  R(H, c) {
    const W = 0.74 * H, my = 0.46 * H, bx = 0.4 * W, ry = (H - c - my) / 2;
    return { W, strokes: [S([[c, H - c], [c, c]], c, c), S([[2 * c, H - c], ...arc(bx, my + ry, W * 0.95 - c - bx, ry, 90, -90), [2 * c, my]]), S([[0.42 * W, my - c], [W - c * 1.1, c]], 0, c)] };
  },
  S(H, c) {
    const W = 0.74 * H, rx = W / 2 - c, ry = (H - 2 * c) / 4;
    const top = arc(W / 2, H - c - ry, rx, ry, 20, 270, 18);
    const bot = arc(W / 2, c + ry, rx, ry, 90, -160, 18);
    // the two lobes meet at the middle of the spine
    return { W, strokes: [S([...top, ...bot.slice(1)], c * 0.5, c * 0.5)] };
  },
  T(H, c) {
    const W = 0.96 * H;
    return { W, strokes: [S([[c, H - c], [W - c, H - c]], c, c), S([[W / 2, H - 2 * c], [W / 2, c]], 0, c)] };
  },
  // U to Z (added for Letter friends; the same rules, so Brick letters could go on to Z)
  U(H, c) {
    const W = 0.8 * H, cy = 0.42 * H;
    return { W, strokes: [S([[c, H - c], [c, cy], ...arc(W / 2, cy, W / 2 - c, cy - c, 180, 360, 20).slice(1), [W - c, H - c]], c, c)] };
  },
  V(H, c) {
    // A upside down without its bar: the legs meet at the bottom, their inner corners just touching
    const W = 0.9 * H, ax0 = W / 2, ay = c * 0.45;
    const l0 = [c * 1.1, H - c], r0 = [W - c * 1.1, H - c];
    let th = Math.atan2(H - c - ay, ax0 - l0[0]);
    for (let i = 0; i < 3; i++) th = Math.atan2(H - c - ay, ax0 - c * Math.sin(th) - l0[0]);
    const ax = ax0 - c * Math.sin(th) * 1.02;
    return { W, strokes: [S([l0, [ax, ay]], c, 0), S([r0, [W - ax, ay]], c, 0)] };
  },
  W(H, c) {
    const W = 1.16 * H, my = 0.72 * H;
    const xs = [c * 1.1, 0.27 * W, 0.5 * W, 0.73 * W, W - c * 1.1];
    return { W, strokes: [S([[xs[0], H - c], [xs[1], c]], c, c * 0.5), S([[xs[2], my], [xs[1], c]], c * 0.4, 0),
      S([[xs[2], my], [xs[3], c]], 0, c * 0.5), S([[xs[4], H - c], [xs[3], c]], c, 0)] };
  },
  X(H, c) {
    const W = 0.86 * H;
    return { W, strokes: [S([[c * 1.1, H - c], [W - c * 1.1, c]], c, c), S([[W - c * 1.1, H - c], [W / 2, H / 2]], c, 0), S([[W / 2, H / 2], [c * 1.1, c]], 0, c)] };
  },
  Y(H, c) {
    const W = 0.9 * H, jy = 0.45 * H;
    return { W, strokes: [S([[c * 1.1, H - c], [W / 2, jy]], c, 0), S([[W - c * 1.1, H - c], [W / 2, jy]], c, 0), S([[W / 2, jy], [W / 2, c]], 0, c)] };
  },
  Z(H, c) {
    const W = 0.8 * H;
    return { W, strokes: [S([[c, H - c], [W - c, H - c]], c, c), S([[W - c * 1.7, H - 2 * c], [c * 1.7, 2 * c]]), S([[c, c], [W - c, c]], c, c)] };
  },
};

// a polyline's length and a point at arc length s
function measure(pts) {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return cum;
}
function at(pts, cum, s) {
  let i = 1;
  while (i < cum.length - 1 && cum[i] < s) i++;
  const k = (s - cum[i - 1]) / Math.max(1e-9, cum[i] - cum[i - 1]);
  return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k];
}

// Spread n bricks over the strokes in proportion to their length (at least one each, largest remainder first).
function allot(lens, n) {
  const tot = lens.reduce((a, b) => a + b, 0);
  const want = lens.map((l) => (l / tot) * n);
  const k = want.map((w) => Math.max(1, Math.floor(w)));
  let left = n - k.reduce((a, b) => a + b, 0);
  const order = want.map((w, i) => [w - Math.floor(w), i]).sort((a, b) => b[0] - a[0]);
  for (let j = 0; left > 0; j = (j + 1) % order.length) { k[order[j][1]]++; left--; }
  while (left < 0) { const i = k.indexOf(Math.max(...k)); k[i]--; left++; }
  return k;
}

export const SEAM = 0.08;      // the thin gap between neighbouring bricks
export function layoutLetter(ch, n, { H = 4.6, t = 0.62 } = {}) {
  const c = t / 2;
  const def = LETTERS[ch](H, c, true);
  // stroke paths with their caps folded in (a cap stretches the end segment), so all bricks of a stroke are equal
  const path = (st, pts) => {
    const P = pts.map((p) => p.slice());
    const ext = (i, j, d) => { const dx = P[i][0] - P[j][0], dy = P[i][1] - P[j][1], l = Math.hypot(dx, dy) || 1; P[i][0] += (dx / l) * d; P[i][1] += (dy / l) * d; };
    ext(0, 1, st.cap0); ext(P.length - 1, P.length - 2, st.cap1);
    return P;
  };
  let paths = def.strokes.map((st) => path(st, st.pts));
  const lens = () => paths.map((p) => { const m = measure(p); return m[m.length - 1]; });
  const per = allot(lens(), n);
  paths = paths.map((p, i) => (def.strokes[i].alt && per[i] <= 2 ? path(def.strokes[i], def.strokes[i].alt) : p));
  // a stroke's k bricks along its path, the path shortened by cut0 / cut1 at its ends
  const bricksOf = (st, si, pts0, k, cut0, cut1) => {
    const out = [];
    const c0 = measure(pts0), L0 = c0[c0.length - 1];
    const pts = [at(pts0, c0, cut0)];
    for (let i = 1; i < pts0.length - 1; i++) if (c0[i] > cut0 && c0[i] < L0 - cut1) pts.push(pts0[i]);
    pts.push(at(pts0, c0, L0 - cut1));
    const cum = measure(pts), Ls = cum[cum.length - 1];
    for (let j = 0; j < k; j++) {
      const a = at(pts, cum, (Ls * j) / k), b = at(pts, cum, (Ls * (j + 1)) / k);
      const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
      const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
      // free stroke ends stay square to the letter box; every joint gets half a seam
      const e0 = j === 0 && st.cap0 > 0 ? 0 : -SEAM / 2;
      const e1 = j === k - 1 && st.cap1 > 0 ? 0 : -SEAM / 2;
      const len = d + e0 + e1;
      const mx = (a[0] + b[0]) / 2 + (Math.cos(ang) * (e1 - e0)) / 2, my = (a[1] + b[1]) / 2 + (Math.sin(ang) * (e1 - e0)) / 2;
      out.push({ x: mx, y: my, ang, len, stroke: si, k: j, grp: st.grp ?? 'S' + si, a, b });
    }
    return out;
  };
  // Stroke by stroke: where a stroke's end runs into an earlier stroke, that end is pulled back a little at a time
  // and the stroke's bricks are spread again, so the join is a neat butt with every brick the same length.
  const slots = [];
  const near = (p, o) => { const c = Math.cos(o.ang) * o.len / 2, s = Math.sin(o.ang) * o.len / 2; return segDist(p, p, [o.x - c, o.y - s], [o.x + c, o.y + s]); };
  def.strokes.forEach((st, si) => {
    let cut0 = 0, cut1 = 0, bs = null;
    for (let it = 0; it < 120; it++) {
      bs = bricksOf(st, si, paths[si], per[si], cut0, cut1);
      let m0 = false, m1 = false;
      const p0 = bs[0].a, p1 = bs[bs.length - 1].b;
      for (const br of bs) {
        for (const o of slots) {
          if (gap(o, br, t) >= CLEAR) continue;
          // pull back whichever end of the stroke the collision is at (a crossing in the middle is left to untangle)
          const d0 = near(p0, o), d1 = near(p1, o);
          if (Math.min(d0, d1) > t * 1.6) continue;
          if (d0 <= d1) m0 = true; else m1 = true;
        }
      }
      if (!m0 && !m1) break;
      if (m0) cut0 += 0.02;
      if (m1) cut1 += 0.02;
    }
    for (const br of bs) { delete br.a; delete br.b; slots.push(br); }
  });
  untangle(slots, t);
  return { W: def.W, H, slots };
}

// ---------- no brick may poke into another ----------
// Each brick is a rounded rectangle (corner radius R). Wherever two overlap (corners of chords on a curve, a stroke
// running into another one), the brick end that runs into the other is trimmed, a hundredth at a time, until a thin
// seam separates them: within a stroke both neighbours give a little, across strokes the later stroke gives way.
const R = 0.11, CLEAR = 0.012;
function core(s, t) {
  const c = Math.cos(s.ang), n = Math.sin(s.ang), hl = Math.max(0.001, s.len / 2 - R), hw = Math.max(0.001, t / 2 - R);
  return [[-hl, -hw], [hl, -hw], [hl, hw], [-hl, hw]].map(([u, v]) => [s.x + u * c - v * n, s.y + u * n + v * c]);
}
function segDist(a, b, c, d) {
  const cross = (o, p, q) => (p[0] - o[0]) * (q[1] - o[1]) - (p[1] - o[1]) * (q[0] - o[0]);
  const d1 = cross(c, d, a), d2 = cross(c, d, b), d3 = cross(a, b, c), d4 = cross(a, b, d);
  if (((d1 > 0) !== (d2 > 0)) && ((d3 > 0) !== (d4 > 0))) return 0;
  const pd = (p, q, r) => {
    const dx = r[0] - q[0], dy = r[1] - q[1], l2 = dx * dx + dy * dy || 1e-9;
    const k = Math.max(0, Math.min(1, ((p[0] - q[0]) * dx + (p[1] - q[1]) * dy) / l2));
    return Math.hypot(p[0] - q[0] - k * dx, p[1] - q[1] - k * dy);
  };
  return Math.min(pd(a, c, d), pd(b, c, d), pd(c, a, b), pd(d, a, b));
}
function inside(p, poly) {
  let s = 0;
  for (let i = 0; i < 4; i++) { const a = poly[i], b = poly[(i + 1) % 4]; const c = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]); s += c > 0 ? 1 : -1; }
  return Math.abs(s) === 4;
}
function gap(a, b, t) {
  const A = core(a, t), B = core(b, t);
  if (A.some((p) => inside(p, B)) || B.some((p) => inside(p, A))) return -1;
  let m = Infinity;
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) m = Math.min(m, segDist(A[i], A[(i + 1) % 4], B[j], B[(j + 1) % 4]));
  return m - 2 * R;
}
// shorten s by d at the end nearest point p (its centre moves away from p)
function trim(s, p, d) {
  const c = Math.cos(s.ang), n = Math.sin(s.ang);
  const e1 = [s.x + c * s.len / 2, s.y + n * s.len / 2], e0 = [s.x - c * s.len / 2, s.y - n * s.len / 2];
  const sg = Math.hypot(e1[0] - p[0], e1[1] - p[1]) < Math.hypot(e0[0] - p[0], e0[1] - p[1]) ? 1 : -1;
  s.len -= d; s.x -= (c * sg * d) / 2; s.y -= (n * sg * d) / 2;
}
function untangle(slots, t) {
  for (let j = 0; j < slots.length; j++) {
    for (let i = 0; i < j; i++) {
      const a = slots[i], b = slots[j];
      for (let it = 0; it < 120 && gap(a, b, t) < CLEAR; it++) {
        const same = a.grp === b.grp;
        if (b.len > t * 0.55) trim(b, [a.x, a.y], 0.01);
        if ((same || b.len <= t * 0.55) && a.len > t * 0.55) trim(a, [b.x, b.y], 0.01);
        if (a.len <= t * 0.55 && b.len <= t * 0.55) break;
      }
    }
  }
}

// bricks per letter: never more than ten (counting to ten is the goal; the letters bring the progression, not the number)
const COUNT = { A: 5, B: 5, C: 5, D: 5, E: 5, F: 5, G: 5, H: 6, I: 6, J: 6, K: 7, L: 7, M: 8, N: 8, O: 8, P: 8, Q: 9, R: 9, S: 10, T: 10 };
export const bricksFor = (ch) => COUNT[ch] || Math.min(10, Math.max(5, ch.charCodeAt(0) - 64));
