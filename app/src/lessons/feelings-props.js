// Props for the Feelings game: the three level stages (picnic hill, toy table, tree stump) and the
// little things the mini stories use (balloons, ice cream, blocks, a jack-in-the-box, acorns, a bee…).
import * as T from '../three.js';
import { mesh, geo, toon, basic, ink, blobShadow } from '../engine/toon.js';
import { C } from '../engine/actors.js';
import { makeFlower } from '../engine/scenery.js';
import { physics } from '../engine/physics.js';
import { propModel } from '../engine/prop-models.js';
import { hasCreature } from '../engine/creature.js';
import { prop } from './view-tools.js';
import { toonUnique } from '../engine/toon.js';

// A Blender prop inside a plain group (so popIn / tweens on the group keep the model's own scale and offset).
function wrapped(kind, opts, scale = 1, y = 0) {
  const pm = prop(kind, opts);
  if (!pm) return null;
  pm.scale.setScalar(scale); pm.position.y = y;
  const g = new T.Group(); g.add(pm); g.userData.pm = pm;
  return g;
}
function flowerProp(col, s = 1) { return prop('prop_m_flower', { tint: col, size: s * 0.9 }) || (() => { const f = makeFlower(col); f.scale.setScalar(s * 1.25); return f; })(); }

export const TOP = 3.0; // height of every stage's flat top (Pip stands here)

// ---------- stages: one per level, so each level looks clearly different ----------
// Every stage has a flat top at y = TOP so physics props can land, tumble and roll off its edge.
export function makeStage(kind, c) {
  const g = new T.Group();
  g.position.copy(c);
  const hill = kind === 'picnic' && prop('prop_m_hill');
  if (hill) {
    // the Blender picnic hill (blanket draped over the front), a picnic basket and flowers round the foot
    g.add(hill);
    const bk = propModel('prop_picnic');
    if (bk) { bk.scale.setScalar(0.55); bk.position.set(-2.35, TOP, -0.55); bk.rotation.y = 0.35; g.add(bk); } // back-left: clear of the friend who hops up
    // flowers on the grass just beyond the hill's foot (radius ~4.6), never inside it
    for (const [x, z, col] of [[-4.6, 2.0, C.pink], [4.5, 2.2, C.yellow], [4.95, 0.5, C.purple], [-5.0, 0.2, 0xffffff], [-5.1, 1.0, C.yellow], [5.1, 1.2, C.pink]]) {
      const f = flowerProp(col, 2.0); f.position.set(x, 0, z); f.rotation.y = x * 0.1; g.add(f);
    }
  } else if (kind === 'picnic') {
    // a grassy mound with a red-and-white picnic blanket and a basket
    const mound = mesh(geo.cyl(3.3, 4.1, TOP - 0.15, 32), 0x7cc95c, { outline: 0.03 });
    mound.position.y = (TOP - 0.15) / 2;
    const lip = mesh(geo.torus(3.3, 0.16, Math.PI * 2, 8, 40), 0x8fdc6c, { outline: 0.02 });
    lip.rotation.x = Math.PI / 2; lip.position.y = TOP - 0.15;
    const top = new T.Mesh(geo.cyl(3.3, 3.3, 0.14, 32), toon(0x8fdc6c)); top.position.y = TOP - 0.08;
    g.add(mound, lip, top);
    // checkered blanket
    const bl = new T.Group();
    for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) {
      const t = new T.Mesh(geo.box(0.8, 0.04, 0.6), toon((i + j) % 2 ? 0xffffff : 0xff5a5a));
      t.position.set((i - 2.5) * 0.8, 0, (j - 1) * 0.6);
      bl.add(t);
    }
    bl.position.set(0.2, TOP + 0.01, 0.6);
    g.add(bl);
    // the blanket's front flap hangs down over the edge so the checks are easy to see
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) {
      const t = new T.Mesh(geo.box(0.6, 0.5, 0.04), toon((i + j) % 2 ? 0xffffff : 0xff5a5a));
      t.position.set(0.2 + (i - 1.5) * 0.6, TOP - 0.3 - j * 0.5, 3.33);
      g.add(t);
    }
    // flowers and tufts dotted round the mound
    for (let i = 0; i < 9; i++) {
      const a = -1.3 + i * 0.33;
      if (Math.abs(a) < 0.45) continue;
      const f = makeFlower([C.pink, C.yellow, 0xffffff, C.purple][i % 4]);
      f.scale.setScalar(1.6);
      const y = 0.4 + (i % 3) * 0.6, r = 4.1 - 0.8 * y / (TOP - 0.15) + 0.02;
      f.position.set(Math.sin(a) * r, y, Math.cos(a) * r);
      g.add(f);
    }
    const basket = makeBasket(0xd9a066, 0.55, 0.5);
    basket.position.set(-2.3, TOP, 0.4);
    g.add(basket);
    for (const [x, z, col] of [[-3.9, 1.6, C.pink], [3.8, 1.8, C.yellow], [4.2, 0.6, C.purple], [-4.4, 0.2, 0xffffff]]) {
      const f = makeFlower(col); f.scale.setScalar(2.2); f.position.set(x, 0, z); g.add(f);
    }
  } else if (kind === 'toytable' && hasCreature('prop_m_playtable')) {
    // the Blender play table on a round stripy rug, with the stacking-rings toy at the left end
    const rug = prop('prop_m_rug');
    rug.scale.set(1.15, 1, 0.55); rug.position.set(0, 0.05, 0.6); // just above the meadow's ground patches (no z-fighting)
    g.add(rug, prop('prop_m_playtable'));
    const rings = prop('prop_m_rings');
    rings.position.set(-3.2, TOP, 0.0);
    g.add(rings);
  } else if (kind === 'toytable') {
    // a big wooden play table on a stripy rug, with stacking rings and a toy drum
    const rug = new T.Group();
    [0xffd23f, 0x4a90ff, 0xff8fc0, 0x5fd068].forEach((col, i) => {
      const r = new T.Mesh(geo.cyl(6.2 - i * 1.2, 6.2 - i * 1.2, 0.04, 40), toon(col));
      r.position.y = 0.02 + i * 0.01; rug.add(r);
    });
    rug.scale.set(1.15, 1, 0.55); rug.position.set(0, 0.05, 0.6); // just above the meadow's ground patches (no z-fighting)
    g.add(rug);
    const topB = mesh(geo.box(7.4, 0.36, 2.8), 0xe8a95c, { hull: 1.03 });
    topB.position.y = TOP - 0.18;
    const edge = mesh(geo.box(7.6, 0.14, 3.0), 0xff6f61, { hull: 1.03 });
    edge.position.y = TOP - 0.38;
    g.add(topB, edge);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const leg = mesh(geo.cyl(0.24, 0.2, TOP - 0.4, 12), [C.blue, C.green][(sx + sz + 2) / 2 % 2], { outline: 0.03 });
      leg.position.set(sx * 3.2, (TOP - 0.4) / 2, sz * 1.1);
      g.add(leg);
    }
    // stacking rings toy at the left end
    const rings = new T.Group();
    const pole = mesh(geo.cyl(0.06, 0.06, 1.1, 8), 0xf2d16b, { outline: 0.015 }); pole.position.y = 0.55; rings.add(pole);
    [C.red, C.orange, C.yellow, C.green].forEach((col, i) => {
      const r = mesh(geo.torus(0.36 - i * 0.06, 0.12, Math.PI * 2, 8, 20), col, { outline: 0.015 });
      r.rotation.x = Math.PI / 2; r.position.y = 0.12 + i * 0.22; rings.add(r);
    });
    rings.position.set(-3.2, TOP, 0.0);
    g.add(rings);
  } else if (kind === 'stump' && hasCreature('prop_m_stump')) {
    // the Blender tree stump with mushrooms at its roots
    g.add(prop('prop_m_stump'));
    // (the right-hand mushroom stays clear of the acorn basket on the grass at world (3.4, -0.4))
    for (const [x, z, s, col] of [[-3.8, 2.3, 0.5, C.red], [-4.9, 1.2, 0.36, C.orange], [4.7, 1.0, 0.44, C.red]]) {
      const m = prop('prop_m_mushroom', { tint: col }); m.scale.setScalar(s); m.position.set(x, 0, z); m.rotation.y = -x * 0.08; g.add(m);
    }
  } else {
    // a big tree stump with growth rings, mushrooms and a basket of leaves on the ground
    const stump = mesh(geo.cyl(3.1, 3.6, TOP - 0.05, 28), 0x9a6a43, { outline: 0.035 });
    stump.position.y = (TOP - 0.05) / 2;
    g.add(stump);
    const face = new T.Mesh(geo.cyl(3.1, 3.1, 0.1, 28), toon(0xe9c38f)); face.position.y = TOP - 0.04;
    g.add(face);
    for (let i = 1; i <= 3; i++) {
      const ring = new T.Mesh(geo.ring(i * 0.85 - 0.06, i * 0.85, 40), basic(0xc89a64));
      ring.rotation.x = -Math.PI / 2; ring.position.y = TOP + 0.015;
      g.add(ring);
    }
    // bark ridges
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const r = mesh(geo.box(0.28, TOP - 0.3, 0.2), 0x80553a, { hull: 1.04 });
      r.position.set(Math.sin(a) * 3.35, (TOP - 0.3) / 2, Math.cos(a) * 3.35);
      r.rotation.y = a;
      g.add(r);
    }
    for (const [x, z, s, col] of [[-3.8, 1.9, 1, C.red], [-4.4, 1.2, 0.7, C.orange], [3.9, 2.0, 0.85, C.red]]) {
      const m = makeMushroom(col); m.scale.setScalar(s); m.position.set(x, 0, z); g.add(m);
    }
  }
  return g;
}

// The physics for a stage: a flat top box (with a tiny rim on the back so things fall forward/sideways).
export function stagePhysics(kind, c) {
  const w = kind === 'toytable' ? 7.4 : kind === 'picnic' ? 6.4 : 6.0;
  const d = kind === 'toytable' ? 2.8 : 2.2;
  physics.box(new T.Vector3(c.x, TOP - 0.25, c.z), new T.Vector3(w, 0.5, d));
  physics.box(new T.Vector3(c.x, TOP + 0.4, c.z - d / 2 - 0.1), new T.Vector3(w, 0.8, 0.2));
}

// ---------- small props ----------
export function makeBasket(col = 0xd9a066, r = 0.6, h = 0.55) {
  const wk = propModel('prop_wicker'); // the straw-filled wicker basket (top radius 1.5, rim 1.0, straw bed 0.62)
  if (wk) { wk.scale.set(r / 1.5, h / 1.0, r / 1.5); wk.userData.bed = 0.62 * h; return wk; }
  const g = new T.Group();
  const b = mesh(geo.cyl(r, r * 0.8, h, 18, true), col, { outline: 0.025 });
  b.material.side = T.DoubleSide;
  b.position.y = h / 2;
  const base = new T.Mesh(geo.cyl(r * 0.8, r * 0.8, 0.04, 18), toon(0xb07e48)); base.position.y = 0.03;
  const rim = mesh(geo.torus(r, 0.06, Math.PI * 2, 6, 24), 0xb07e48, { outline: 0.012 });
  rim.rotation.x = Math.PI / 2; rim.position.y = h;
  const handle = mesh(geo.torus(r * 0.85, 0.05, Math.PI, 6, 18), 0xb07e48, { outline: 0.012 });
  handle.position.y = h;
  g.add(b, base, rim, handle);
  return g;
}

export function makeMushroom(col = C.red) {
  const pm = prop('prop_m_mushroom', { tint: col, size: 0.47 });
  if (pm) return pm;
  const g = new T.Group();
  const stem = mesh(geo.cyl(0.18, 0.24, 0.6, 12), 0xfff3dc, { outline: 0.02 }); stem.position.y = 0.3;
  const cap = mesh(geo.sphere(0.5, 16, 10, 0), col, { outline: 0.025 }); cap.scale.set(1, 0.6, 1); cap.position.y = 0.6;
  for (let i = 0; i < 4; i++) {
    const d = new T.Mesh(geo.sphere(0.08, 8, 6), basic(0xffffff));
    const a = i * 1.7;
    d.position.set(Math.cos(a) * 0.3, 0.83, Math.sin(a) * 0.3 + 0.1);
    g.add(d);
  }
  g.add(stem, cap);
  return g;
}

export function makeBalloon(col) {
  const w = wrapped('prop_m_balloon', { tint: col }, 1.2);
  if (w) return w;
  const balloon = new T.Group();
  const b = mesh(geo.sphere(0.6, 20, 14), col, { outline: 0.035 });
  b.scale.set(1, 1.15, 1);
  const hi = new T.Mesh(geo.sphere(0.12, 8, 6), basic(0xffffff)); hi.position.set(-0.22, 0.3, 0.5);
  const knot = mesh(geo.cone(0.1, 0.16, 8), col, { outline: 0.015 }); knot.position.y = -0.72; knot.rotation.x = Math.PI;
  const string = new T.Mesh(geo.cyl(0.015, 0.015, 1.6, 4), basic(0x555555)); string.position.y = -1.55;
  balloon.add(b, hi, knot, string);
  return balloon;
}

export function makeCone() {
  const w = wrapped('prop_m_cone', {});
  if (w) return w;
  const g = new T.Group();
  const cone = mesh(geo.cone(0.32, 1.0, 14), 0xe0a85a, { outline: 0.025 });
  cone.rotation.x = Math.PI; cone.position.y = 0.5;
  g.add(cone);
  return g;
}
export function makeScoop(col) {
  const w = wrapped('prop_m_scoop', { tint: col }, 1.0, -0.02);
  if (w) return w;
  const s = mesh(geo.sphere(0.38, 16, 12), col, { outline: 0.025 });
  const cherry = mesh(geo.sphere(0.1, 10, 8), C.red, { outline: 0.012 });
  cherry.position.y = 0.38;
  s.add(cherry);
  return s;
}

// A present whose origin is at its base; the lid is a separate child so it can fly off.
// recolour a model's white ribbon layer
function ribbon(w, col) { const l = w && w.userData.layers.ribbon; if (l) l.mesh.material = toonUnique(col, { vertexColors: true }); }
export function makeGift(col = C.purple, rib = C.yellow) {
  const gb = prop('prop_m_giftbox', { tint: col });
  if (gb) {
    const g = new T.Group();
    ribbon(gb, rib);
    const lid = new T.Group();
    const lm = prop('prop_m_giftlid', { tint: col });
    ribbon(lm, rib);
    lid.add(lm);
    lid.position.y = 0.9;
    g.add(gb, lid);
    g.userData.lid = lid;
    return g;
  }
  const g = new T.Group();
  const box = mesh(geo.box(1.0, 0.8, 1.0), col, { hull: 1.05 });
  box.position.y = 0.4;
  const rib1 = new T.Mesh(geo.box(0.18, 0.82, 1.02), toon(rib)); rib1.position.y = 0.4;
  const lid = new T.Group();
  const top = mesh(geo.box(1.12, 0.22, 1.12), col, { hull: 1.05 });
  const rib2 = new T.Mesh(geo.box(0.18, 0.24, 1.14), toon(rib));
  const bow = mesh(geo.torus(0.16, 0.06, Math.PI * 2, 6, 14), rib, { outline: 0.01 });
  bow.position.y = 0.2;
  lid.add(top, rib2, bow);
  lid.position.y = 0.9;
  g.add(box, rib1, lid);
  g.userData.lid = lid;
  return g;
}

export function makeStar(col = C.yellow) {
  const w = wrapped('prop_m_puffstar', { tint: col }, 0.8);
  if (w) return w;
  const s = mesh(geo.sphere(0.32, 5, 2), col, { outline: 0.02 });
  s.scale.set(1.3, 1.3, 0.5);
  return s;
}

export function makeBlock(col, s = 0.75) { return wrapped('prop_m_block', { tint: col }, s / 0.78) || mesh(geo.box(s, s, s), col, { hull: 1.07 }); }
export function makeCup(col) {
  const w = wrapped('prop_m_cup', { tint: col });
  if (w) return w;
  const c = mesh(geo.cyl(0.32, 0.24, 0.6, 14), col, { outline: 0.02 });
  const rim = new T.Mesh(geo.torus(0.3, 0.04, Math.PI * 2, 6, 18), toon(0xffffff));
  rim.rotation.x = Math.PI / 2; rim.position.y = 0.3;
  c.add(rim);
  return c;
}
export function makePot(col = 0xd9774a) {
  // the Blender flowerpot (unit: rim radius 1, 1.3 tall, base at 0), centred like the old one (-0.3 .. 0.37)
  const pm = propModel('prop_pot', { tint: col, size: [0.47, 0.67 / 1.3, 0.47] });
  if (pm) { pm.userData.model.position.y = -0.3; const g = new T.Group(); g.add(pm); return g; }
  const p = mesh(geo.cyl(0.42, 0.3, 0.6, 14), col, { outline: 0.025 });
  const rim = mesh(geo.cyl(0.47, 0.47, 0.14, 14), col, { outline: 0.02 }); rim.position.y = 0.3;
  p.add(rim);
  return p;
}

export function makeBall(r = 0.4, cols = [C.red, C.yellow, C.blue]) {
  const w = wrapped('prop_m_toyball', { tint: cols[0], hide: cols.length > 1 ? ['dots', 'star'] : ['dots', 'star', 'band'], face: false }, r / 0.44);
  if (w) return w;
  const g = new T.Group();
  const b = mesh(geo.sphere(r, 20, 14), cols[0], { outline: 0.03 });
  g.add(b);
  for (let i = 1; i < cols.length; i++) {
    const band = new T.Mesh(geo.torus(r * 1.005, r * 0.12, Math.PI * 2, 6, 24), toon(cols[i]));
    band.rotation.y = (i / cols.length) * Math.PI;
    g.add(band);
  }
  return g;
}

export function makeCupcake() {
  const w = wrapped('prop_m_cupcake', {}, 1.0, 0.44); // base at y 0, candle wick at ~1.28
  if (w) {
    const flame = new T.Mesh(geo.sphere(0.09, 8, 6), basic(0xffa020)); flame.scale.set(1, 1.6, 1); flame.position.y = 1.36;
    flame.visible = false;
    w.add(flame);
    w.userData.flame = flame;
    return w;
  }
  const g = new T.Group();
  const cup = mesh(geo.cyl(0.42, 0.3, 0.45, 14), C.blue, { outline: 0.02 }); cup.position.y = 0.22;
  const icing = mesh(geo.sphere(0.48, 16, 10), 0xffc4dc, { outline: 0.025 }); icing.scale.set(1, 0.65, 1); icing.position.y = 0.5;
  const candle = mesh(geo.cyl(0.05, 0.05, 0.4, 8), C.yellow, { outline: 0.01 }); candle.position.y = 0.95;
  const flame = new T.Mesh(geo.sphere(0.09, 8, 6), basic(0xffa020)); flame.scale.set(1, 1.6, 1); flame.position.y = 1.22;
  flame.visible = false;
  for (let i = 0; i < 6; i++) {
    const sp = new T.Mesh(geo.box(0.05, 0.12, 0.05), toon([C.red, C.yellow, C.green][i % 3]));
    sp.position.set(Math.cos(i) * 0.3, 0.72, Math.sin(i) * 0.3 + 0.05); sp.rotation.z = i;
    g.add(sp);
  }
  g.add(cup, icing, candle, flame);
  g.userData.flame = flame;
  return g;
}

export function makeSpider() {
  const w = wrapped('prop_m_spider', {});
  if (w) {
    const thread = new T.Mesh(geo.cyl(0.012, 0.012, 8, 4), basic(0xdddddd));
    thread.position.y = 4.3;
    w.add(thread);
    return w;
  }
  const g = new T.Group();
  const body = ink(geo.sphere(0.42, 16, 12));
  g.add(body);
  for (const s of [-1, 1]) {
    const e = new T.Mesh(geo.sphere(0.13, 10, 8), basic(0xffffff));
    e.position.set(s * 0.15, 0.08, 0.36);
    const p = ink(geo.sphere(0.06, 8, 6)); p.position.z = 0.09;
    e.add(p);
    g.add(e);
    for (let i = 0; i < 4; i++) {
      const leg = ink(geo.cyl(0.035, 0.035, 0.75, 5));
      leg.position.set(s * 0.45, -0.1 + (i - 1.5) * 0.06, (i - 1.5) * 0.18);
      leg.rotation.z = s * (1.0 + i * 0.12);
      g.add(leg);
    }
  }
  const thread = new T.Mesh(geo.cyl(0.012, 0.012, 8, 4), basic(0xdddddd));
  thread.position.y = 4.2;
  g.add(thread);
  return g;
}

// Jack-in-the-box: a box (origin at its base) with a crank and a clown head on a spring inside.
export function makeJack() {
  const jbox = prop('prop_m_jackbox');
  if (jbox) {
    const g = new T.Group();
    const lidPivot = new T.Group(); lidPivot.position.set(0, 1.0, -0.52);
    lidPivot.add(prop('prop_m_jacklid'));
    const jack = new T.Group(); jack.position.y = 0.1;
    const jm = prop('prop_m_jack'); jack.add(jm);
    jack.scale.set(1, 0.05, 1);
    jack.visible = false;
    g.add(jbox, lidPivot, jack);
    // the crank is a bone along -x: it spins about its own axis (rotation.y)
    Object.assign(g.userData, { crank: jbox.userData.bones.crank, crankAxis: 'y', lidPivot, jack, jackFace: jm.userData.face });
    return g;
  }
  const g = new T.Group();
  const box = mesh(geo.box(1.0, 1.0, 1.0), C.red, { hull: 1.05 }); box.position.y = 0.5;
  for (const [x, z, col] of [[0, 0.51, C.yellow], [0.51, 0, C.blue]]) {
    const st = new T.Mesh(geo.box(x ? 0.02 : 0.5, 0.5, z ? 0.02 : 0.5), toon(col));
    st.position.set(x, 0.5, z); g.add(st);
  }
  const crank = new T.Group();
  const arm = mesh(geo.box(0.06, 0.4, 0.06), C.yellow, { hull: 1.1 }); arm.position.y = 0.2;
  const knob = mesh(geo.sphere(0.09, 8, 6), C.yellow, { outline: 0.01 }); knob.position.y = 0.4;
  crank.add(arm, knob); crank.rotation.z = Math.PI / 2; crank.position.set(-0.55, 0.55, 0);
  const lid = mesh(geo.box(1.05, 0.12, 1.05), C.blue, { hull: 1.05 }); lid.position.y = 1.06;
  const lidPivot = new T.Group(); lidPivot.position.set(0, 1.0, -0.52); lid.position.set(0, 0.06, 0.52); lidPivot.add(lid);
  const jack = new T.Group();
  const spring = new T.Group();
  for (let i = 0; i < 6; i++) {
    const r = mesh(geo.torus(0.18, 0.04, Math.PI * 2, 6, 14), 0xdddddd, { outline: 0.008 });
    r.rotation.x = Math.PI / 2; r.position.y = i * 0.16; spring.add(r);
  }
  const head = mesh(geo.sphere(0.42, 16, 12), 0xfff0dd, { outline: 0.025 }); head.position.y = 1.15;
  const nose = mesh(geo.sphere(0.12, 10, 8), C.red, { outline: 0.012 }); nose.position.set(0, 1.12, 0.42);
  const hat = mesh(geo.cone(0.3, 0.55, 12), C.purple, { outline: 0.02 }); hat.position.y = 1.7;
  const pom = mesh(geo.sphere(0.1, 8, 6), C.yellow, { outline: 0.01 }); pom.position.y = 2.0;
  for (const s of [-1, 1]) {
    const e = ink(geo.sphere(0.06, 8, 6)); e.position.set(s * 0.14, 1.26, 0.38); jack.add(e);
    const hair = mesh(geo.sphere(0.17, 10, 8), C.orange, { outline: 0.012 }); hair.position.set(s * 0.4, 1.2, 0); jack.add(hair);
  }
  const smile = ink(geo.torus(0.14, 0.025, Math.PI, 4, 12)); smile.rotation.z = Math.PI; smile.position.set(0, 1.0, 0.39);
  jack.add(spring, head, nose, hat, pom, smile);
  jack.position.y = 0.1;
  jack.scale.set(1, 0.05, 1);
  jack.visible = false;
  g.add(box, crank, lidPivot, jack);
  Object.assign(g.userData, { crank, lidPivot, jack });
  return g;
}

export function makeAcorn() {
  const w = wrapped('prop_m_acorn', {});
  if (w) return w;
  const g = new T.Group();
  const nut = mesh(geo.sphere(0.2, 12, 10), 0xc98a4b, { outline: 0.015 }); nut.scale.set(1, 1.2, 1);
  const cap = mesh(geo.sphere(0.22, 12, 8, 0), 0x7a5232, { outline: 0.015 }); cap.scale.set(1, 0.6, 1); cap.position.y = 0.14;
  const st = mesh(geo.cyl(0.03, 0.03, 0.1, 5), 0x7a5232, { outline: 0.008 }); st.position.y = 0.3;
  g.add(nut, cap, st);
  return g;
}

export function makeBee() {
  const w = wrapped('prop_m_bee', {}, 0.9);
  if (w) { const b = w.userData.pm.userData.bones; w.userData.wings = [b.wingL, b.wingR]; w.userData.face = w.userData.pm.userData.face; w.userData.pm.rotation.y = 0.4; return w; }
  const g = new T.Group();
  const body = mesh(geo.sphere(0.34, 16, 12), C.yellow, { outline: 0.025 }); body.scale.set(1.3, 1, 1);
  g.add(body);
  for (const x of [-0.12, 0.16]) { const st = ink(geo.cyl(0.33, 0.33, 0.09, 14)); st.rotation.z = Math.PI / 2; st.position.x = x; st.scale.set(1, 1, 1.01); g.add(st); }
  const wings = [];
  for (const s of [-1, 1]) {
    const w = new T.Mesh(geo.sphere(0.24, 10, 8), basic(0xeaf6ff));
    w.scale.set(0.7, 0.25, 1); w.position.set(0, 0.34, s * 0.18);
    g.add(w); wings.push(w);
  }
  for (const s of [-1, 1]) { const e = ink(geo.sphere(0.055, 8, 6)); e.position.set(0.38, 0.08, s * 0.12); g.add(e); }
  g.userData.wings = wings;
  return g;
}

export function makeButterfly(col = C.pink) {
  const w = wrapped('prop_m_butterfly', { tint: col }, 1.1);
  if (w) { const b = w.userData.pm.userData.bones; w.userData.wings = [b.wingL, b.wingR]; w.userData.pm.rotation.x = 0.5; return w; }
  const g = new T.Group();
  const body = ink(geo.cyl(0.05, 0.05, 0.5, 6)); body.rotation.x = Math.PI / 2; g.add(body);
  const wings = [];
  for (const s of [-1, 1]) {
    const w = new T.Group();
    const a = mesh(geo.sphere(0.32, 12, 8), col, { outline: 0.015 }); a.scale.set(1, 0.12, 0.8); a.position.set(s * 0.3, 0, -0.08);
    const b = mesh(geo.sphere(0.22, 12, 8), C.yellow, { outline: 0.012 }); b.scale.set(1, 0.12, 0.8); b.position.set(s * 0.22, 0, 0.22);
    w.add(a, b); g.add(w); wings.push(w);
  }
  g.userData.wings = wings;
  return g;
}

export function makeMole() {
  const mound = prop('prop_m_dirt');
  if (mound) {
    const g = new T.Group();
    const mole = new T.Group();
    mole.add(prop('prop_m_mole'));
    mole.position.y = -0.8;
    g.add(mole, mound);
    g.userData.mole = mole;
    return g;
  }
  const g = new T.Group();
  const dirt = mesh(geo.sphere(0.6, 14, 8), 0x7a5232, { outline: 0.02 }); dirt.scale.set(1, 0.35, 1);
  const mole = new T.Group();
  const body = mesh(geo.sphere(0.45, 16, 12), 0x6b5a6e, { outline: 0.025 }); body.scale.set(1, 1.2, 1); body.position.y = 0.3;
  const nose = mesh(geo.sphere(0.12, 10, 8), C.pink, { outline: 0.012 }); nose.position.set(0, 0.42, 0.44);
  for (const s of [-1, 1]) {
    const e = ink(geo.sphere(0.05, 8, 6)); e.position.set(s * 0.14, 0.58, 0.37); mole.add(e);
    const paw = mesh(geo.sphere(0.13, 8, 6), C.pink, { outline: 0.01 }); paw.scale.set(1.2, 0.6, 1); paw.position.set(s * 0.34, 0.25, 0.32); mole.add(paw);
  }
  mole.add(body, nose);
  mole.position.y = -0.8;
  g.add(mole, dirt);
  g.userData.mole = mole;
  return g;
}

export function makeRaindrop() {
  const w = wrapped('prop_m_drop', {}, 1.0);
  if (w) return w;
  const d = mesh(geo.sphere(0.09, 8, 6), 0x7fd0ff, { outline: 0.01 });
  d.scale.set(1, 1.5, 1);
  return d;
}

export function makePetal() { return wrapped('prop_m_petal', {}) || (() => { const pt = mesh(geo.sphere(0.16, 8, 6), C.pink, { outline: 0.012 }); pt.scale.set(1, 0.4, 1); return pt; })(); }
// a pumpkin centred on its middle (rolls in as a ball, radius ~0.55)
export function makePumpkinBall() {
  const w = wrapped('prop_m_pumpkin', {}, 0.62, -0.46);
  if (w) return w;
  const pk = new T.Group();
  const body = mesh(geo.sphere(0.5, 16, 12), C.orange, { outline: 0.03 }); body.scale.set(1.15, 0.9, 1.15);
  const stem = mesh(geo.cyl(0.06, 0.08, 0.25, 6), 0x5a8a3a, { outline: 0.01 }); stem.position.y = 0.5;
  pk.add(body, stem);
  return pk;
}
export { blobShadow, flowerProp };
