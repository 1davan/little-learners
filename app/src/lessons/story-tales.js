// What happens next? The six little stories. Each step is a tiny 3D scene built inside a story card (on the turf:
// y = 0 is the grass, the frame's inside is about x ±0.95, y 0..1.5, z -0.38..0.45), plus a short act that plays
// when the finished story runs in order (the egg wobbles, the shell cracks, the chick hops out…).
//   tale = { id, tint, line, ask, lines: { key: line }, three: [step keys], four: [step keys],
//            steps: { key: { build(d, st), act(s, st) } } }
//   line = the ending (voiced when she tells the finished story), ask = the story's own question for its last card,
//   lines = what the narrator says as each earlier card shows its moment ("An egg!", "Crack, crack!").
// build(d, st) adds the scene to group d and keeps what the act needs in st.
import * as T from '../three.js';
import { setFace } from '../engine/actors.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';
import { project } from '../engine/stage.js';
import { prop, critter } from './story-props.js';

const wpos = (o) => o.getWorldPosition(new T.Vector3());
const sparkleAt = (o, dy = 0) => { const p = wpos(o); p.y += dy; const c = project(p); fx.sparkle(c.x, c.y); };
// a quick hop of one thing inside a card (with a squash on landing)
function bounce(s, o, h = 0.25, dur = 0.36) {
  const y0 = o.position.y, k = o.scale.x;
  return s.anim(dur, (_, p) => {
    o.position.y = y0 + Math.sin(p * Math.PI) * h;
    const sq = p > 0.82 ? Math.sin(((p - 0.82) / 0.18) * Math.PI) * 0.12 : 0;
    o.scale.set(k * (1 + sq * 0.5), k * (1 - sq), k * (1 + sq * 0.5));
  }).then(() => { o.position.y = y0; o.scale.setScalar(k); });
}
function wobble(s, o, amt = 0.25, dur = 0.45, n = 3) {
  const r0 = o.rotation.z;
  return s.anim(dur, (_, p) => { o.rotation.z = r0 + Math.sin(p * Math.PI * 2 * n) * amt * (1 - p); }).then(() => { o.rotation.z = r0; });
}
function pulse(s, o, amt = 0.15, dur = 0.35) {
  const k = o.scale.x;
  return s.anim(dur, (_, p) => o.scale.setScalar(k * (1 + Math.sin(p * Math.PI) * amt))).then(() => o.scale.setScalar(k));
}
function joy(s, c, sec = 1.2) {
  const f = c.userData.face || c.userData.model?.userData.face;
  if (!f) return;
  setFace(f, 'joy');
  s.wait(sec).then(() => { if (f.userData.emotion === 'joy') setFace(f, 'happy'); });
}
function flap(s, c, dur = 0.5) {
  const w = c.userData.wings || c.userData.model?.userData.wings;
  if (!w) return Promise.resolve();
  const r0 = w.map((x) => x.rotation.z);
  return s.anim(dur, (_, p) => { const a = Math.abs(Math.sin(p * Math.PI * 4)) * 0.9 * (1 - p * 0.3); w[0].rotation.z = r0[0] + a; w[1].rotation.z = r0[1] - a; })
    .then(() => { w[0].rotation.z = r0[0]; w[1].rotation.z = r0[1]; });
}
// put a hat-like thing on a creature's head bone, at a point given in the creature's own (scaled) space
function onHead(c, obj, at, worldScale) {
  c.updateMatrixWorld(true);
  const head = c.userData.head || c;
  const p = c.localToWorld(new T.Vector3(...at));
  head.worldToLocal(p);
  obj.position.copy(p);
  const hs = head.getWorldScale(new T.Vector3()).y;
  obj.scale.setScalar(worldScale / hs);
  head.add(obj);
}

// ---------------------------------------------------------------- 1. the egg hatches
const nest = (d, x = -0.04, s = 0.84) => d.add(prop('prop_st_nest', { s, at: [x, 0, 0.04] }));
const NEST_IN = 0.12;   // the nest's hollow floor (at s 0.84)
const chick = {
  id: 'chick', tint: 0xffc93a, line: 'The chick hatched!', ask: 'Who comes out?',
  lines: { egg: 'An egg!', crack: 'Crack, crack!' },
  three: ['egg', 'crack', 'chick'], four: ['hen', 'egg', 'crack', 'chick'],
  steps: {
    hen: {
      build(d, st) { nest(d); st.hen = critter('hen', { s: 0.5, at: [-0.04, 0.12, 0.12] }); d.add(st.hen); },
      act(s, st) { sfx.cluck(); joy(s, st.hen); flap(s, st.hen, 0.55); return bounce(s, st.hen, 0.12, 0.4); },
    },
    egg: {
      build(d, st) { nest(d); st.egg = prop('prop_word_egg', { s: 0.3, at: [-0.04, NEST_IN - 0.01, 0.05] }); d.add(st.egg); },
      act(s, st) { sfx.tick(); return wobble(s, st.egg, 0.12, 0.5, 2); },
    },
    crack: {
      build(d, st) { nest(d); st.egg = prop('prop_st_eggcrack', { s: 0.75, at: [-0.04, NEST_IN - 0.01, 0.05] }); d.add(st.egg); },
      act(s, st) { sfx.crunch(); sparkleAt(st.egg, 0.4); return wobble(s, st.egg, 0.22, 0.5, 4); },
    },
    chick: {
      build(d, st) {
        nest(d, -0.42, 0.62);
        d.add(prop('prop_st_shell', { s: 0.55, at: [-0.42, 0.08, 0.05] }));
        st.chick = critter('chick', { s: 0.68, at: [0.3, 0, 0.1], ry: -0.25 });
        const cap = new T.Group(), top = prop('prop_st_shelltop', { at: [0, -0.48, 0] });
        cap.add(top);
        cap.rotation.z = -0.32;
        onHead(st.chick, cap, [0.05, 0.9, 0.02], 0.5);
        d.add(st.chick);
      },
      act(s, st) { sfx.cheep(); joy(s, st.chick); flap(s, st.chick, 0.45); return bounce(s, st.chick, 0.3, 0.4); },
    },
  },
};

// ---------------------------------------------------------------- 2. a seed grows into a flower
const soil = (d) => d.add(prop('prop_st_soil', { s: 1.45, at: [0, 0, 0.06] }));
const SOIL_TOP = 0.3;
const flower = {
  id: 'flower', tint: 0xff8fc0, line: 'The flower grew!', ask: 'What grows?',
  lines: { seed: 'A little seed!', sprout: 'A tiny sprout!' },
  three: ['seed', 'sprout', 'flower'], four: ['seed', 'sprout', 'bud', 'flower'],
  steps: {
    seed: {
      build(d, st) { soil(d); st.seed = prop('prop_farmseed', { s: 0.95, at: [0, SOIL_TOP + 0.13, 0.08], r: [0, 0, 0.35] }); d.add(st.seed); },
      act(s, st) { sfx.pop(); return bounce(s, st.seed, 0.22, 0.34); },
    },
    sprout: {
      build(d, st) { soil(d); st.sp = prop('prop_st_sprout', { s: 1.8, at: [0, SOIL_TOP - 0.03, 0.08] }); d.add(st.sp); },
      act(s, st) {
        sfx.rustle(); const k = st.sp.scale.x;
        return s.anim(0.45, (_, p) => { st.sp.scale.set(k, k * (0.55 + 0.45 * Ease.elastic(p)), k); }).then(() => st.sp.scale.setScalar(k));
      },
    },
    bud: {
      build(d, st) {
        soil(d);
        d.add(prop('prop_st_stem', { s: 0.78, at: [0, SOIL_TOP - 0.03, 0.08] }));
        st.bud = prop('prop_growbud', { s: 1.05, at: [0, SOIL_TOP + 0.68, 0.08], tint: 0xff7fae }); d.add(st.bud);
      },
      act(s, st) { sfx.twinkle(); return pulse(s, st.bud, 0.25, 0.45); },
    },
    flower: {
      build(d, st) {
        soil(d);
        d.add(prop('prop_st_stem', { s: 0.92, at: [0, SOIL_TOP - 0.03, 0.08] }));
        st.bloom = prop('prop_bloom_daisy', { s: 0.44, at: [0, SOIL_TOP + 0.94, 0.14] }); d.add(st.bloom);
      },
      act(s, st) {
        sfx.sparkle(); joy(s, st.bloom); sparkleAt(st.bloom);
        const r0 = st.bloom.rotation.z;
        return Promise.all([pulse(s, st.bloom, 0.2, 0.45), s.anim(0.45, (e) => { st.bloom.rotation.z = r0 + e * Math.PI * 2; }, Ease.out).then(() => { st.bloom.rotation.z = r0; })]);
      },
    },
  },
};

// ---------------------------------------------------------------- 3. caterpillar to butterfly
const butterfly = {
  id: 'butterfly', tint: 0xa98cff, line: 'A butterfly!', ask: 'Who comes out?',
  lines: { cat: 'A caterpillar!', cocoon: 'It goes to sleep!' },
  three: ['cat', 'cocoon', 'fly'], four: ['eggs', 'cat', 'cocoon', 'fly'],
  steps: {
    eggs: {
      build(d, st) { st.leaf = prop('prop_st_leafbed', { s: 1.02, at: [0.1, 0, 0.08] }); st.leaf.userData.model?.userData.wear('cloth_eggs', true); d.add(st.leaf); },
      act(s, st) { sfx.twinkle(); sparkleAt(st.leaf, 0.2); return pulse(s, st.leaf, 0.08, 0.4); },
    },
    cat: {
      build(d, st) {
        d.add(prop('prop_st_leafbed', { s: 1.02, at: [0.1, 0, 0.08] }));
        st.cat = prop('prop_st_caterpillar', { s: 0.45, at: [0.02, 0.1, 0.14], r: [0, -0.15, 0] }); d.add(st.cat);
      },
      act(s, st) {
        sfx.chomp(); joy(s, st.cat, 0.8);
        const k = st.cat.scale.x, x0 = st.cat.position.x;
        return s.anim(0.5, (_, p) => { const w = Math.sin(p * Math.PI * 2); st.cat.scale.set(k * (1 - 0.1 * Math.abs(w)), k * (1 + 0.12 * Math.abs(w)), k); st.cat.position.x = x0 + p * 0.06; })
          .then(() => { st.cat.scale.setScalar(k); st.cat.position.x = x0; });
      },
    },
    cocoon: {
      build(d, st) { st.br = prop('prop_st_branch', { s: 1.0, at: [0, 0, 0.0] }); st.br.userData.model?.userData.wear('cloth_cocoon', true); d.add(st.br); },
      act(s, st) {
        sfx.rustle();
        const b = st.br.userData.bones?.cocoon;
        if (!b) return pulse(s, st.br, 0.05, 0.4);
        const r0 = b.rotation.z;
        return s.anim(0.6, (_, p) => { b.rotation.z = r0 + Math.sin(p * Math.PI * 3) * 0.25 * (1 - p); }).then(() => { b.rotation.z = r0; });
      },
    },
    fly: {
      build(d, st) {
        d.add(prop('prop_st_branch', { s: 1.0, at: [0, 0, 0.0] }));
        // in the air below the twig, open wings to the camera (clear of the leaves and the frame)
        st.bf = prop('prop_m_butterfly', { s: 1.02, at: [0.38, 0.48, 0.16], r: [-1.35, 0, -0.18], tint: 0xff8fc0 }); d.add(st.bf);
      },
      act(s, st) {
        sfx.twinkle(); sparkleAt(st.bf, 0.35);
        // the wings beat about their resting (open) pose and settle back open
        const w = st.bf.userData.model?.userData.wings, y0 = st.bf.position.y;
        const r0 = w ? w.map((x) => x.rotation.z) : null;
        return s.anim(0.7, (_, p) => {
          st.bf.position.y = y0 + Math.sin(p * Math.PI) * 0.07;
          if (w) { const a = Math.abs(Math.sin(p * Math.PI * 3)) * 0.55; w[0].rotation.z = r0[0] + a; w[1].rotation.z = r0[1] - a; }
        }).then(() => { st.bf.position.y = y0; if (w) { w[0].rotation.z = r0[0]; w[1].rotation.z = r0[1]; } });
      },
    },
  },
};

// ---------------------------------------------------------------- 4. the apple falls and Bunny eats it
const tree = (d) => d.add(prop('prop_m_tree', { s: 0.3, at: [-0.5, 0, 0], tint: 0x67c94f, hide: ['snow'] }));
const APPLE_ON_TREE = [-0.28, 0.86, 0.34];
// Bunny holds the bitten apple in both paws in front of its chest, head bowed to it (the apple rides in Bunny's own
// space, so it stays in the paws whatever Bunny does)
const EAT_TILT = 0.16;
function holdApple(st) {
  const u = st.bun.userData, a = u.arms;
  if (a) { a[0].rotation.x -= 1.2; a[0].rotation.z -= 0.9; a[1].rotation.x -= 1.2; a[1].rotation.z += 0.9; }
  u.noLook = true;
  if (u.head) u.head.rotation.x = EAT_TILT;
  st.apple = prop('prop_st_applebite', { s: 0.5 / 0.36, at: [0, 0.8, 0.5], r: [0.1, -1.0, 0] });
  st.bun.add(st.apple);
}
const apple = {
  id: 'apple', tint: 0xff6a5a, line: 'Yum! Bunny ate the apple!', ask: 'Who eats it?',
  lines: { tree: 'An apple tree!', fall: 'The apple falls!' },
  three: ['tree', 'fall', 'eat'], four: ['tree', 'fall', 'eat', 'core'],
  steps: {
    tree: {
      build(d, st) { tree(d); st.apple = prop('prop_farmapple', { s: 0.5, at: APPLE_ON_TREE }); d.add(st.apple); },
      act(s, st) { sfx.rustle(); return wobble(s, st.apple, 0.3, 0.5, 3); },
    },
    fall: {
      build(d, st) { tree(d); st.apple = prop('prop_farmapple', { s: 0.5, at: [0.45, 0.13, 0.16], r: [0, 0, 0.5] }); d.add(st.apple); },
      act(s, st) {
        const a = st.apple, to = a.position.clone(), from = new T.Vector3(...APPLE_ON_TREE), r1 = a.rotation.z;
        a.position.copy(from);
        return s.anim(0.42, (_, p) => {
          a.position.lerpVectors(from, to, p);
          a.position.y = from.y + (to.y - from.y) * (p * p) + (p > 0.8 ? Math.sin(((p - 0.8) / 0.2) * Math.PI) * 0.06 : 0);
          a.rotation.z = r1 * p;
        }).then(() => { a.position.copy(to); a.rotation.z = r1; sfx.thunk(); });
      },
    },
    eat: {
      build(d, st) {
        tree(d);
        st.bun = critter('bunny', { s: 0.36, at: [0.36, 0, -0.02], ry: -0.3 }); d.add(st.bun);
        holdApple(st);
      },
      act(s, st) {
        sfx.crunch(); s.wait(0.25).then(() => sfx.crunch());
        const h = st.bun.userData.head;
        if (h) s.anim(0.5, (_, p) => { h.rotation.x = EAT_TILT + Math.abs(Math.sin(p * Math.PI * 2)) * 0.18; }).then(() => { h.rotation.x = EAT_TILT; });
        return pulse(s, st.apple, -0.12, 0.5);
      },
    },
    core: {
      build(d, st) {
        tree(d);
        st.bun = critter('bunny', { s: 0.36, at: [0.36, 0, -0.02], ry: -0.3 }); d.add(st.bun);
        st.core = prop('prop_st_core', { s: 0.5, at: [0.08, 0.13, 0.22], r: [0, 0, 0.15] }); d.add(st.core);
      },
      act(s, st) { sfx.mmm(); joy(s, st.bun); return bounce(s, st.bun, 0.22, 0.4); },
    },
  },
};

// ---------------------------------------------------------------- 5. sun, rain, rainbow
const sky = (k, o) => prop(k, o);
const rain = {
  id: 'rain', tint: 0x4aa8ff, line: 'A rainbow!', ask: 'What comes now?',
  lines: { sun: 'Sunny day!', rain: 'Rain!' },
  three: ['sun', 'rain', 'rainbow'], four: ['sun', 'cloud', 'rain', 'rainbow'],
  steps: {
    sun: {
      build(d, st) {
        st.sun = sky('prop_word_sun', { s: 0.42, at: [0, 0.4, -0.12] }); d.add(st.sun);
        d.add(prop('prop_scene_flower', { s: 0.75, at: [-0.55, 0, 0.18] }), prop('prop_scene_flower', { s: 0.7, at: [0.56, 0, 0.12] }));
      },
      act(s, st) { sfx.twinkle(); joy(s, st.sun); return pulse(s, st.sun, 0.12, 0.45); },
    },
    cloud: {
      build(d, st) {
        st.sun = sky('prop_word_sun', { s: 0.34, at: [-0.55, 0.75, -0.24] }); d.add(st.sun);
        st.cloud = sky('prop_cloud', { s: 0.4, at: [0.25, 0.85, 0.12] }); d.add(st.cloud);
        const f = st.cloud.userData.model?.userData.face; if (f) setFace(f, 'sad');
      },
      act(s, st) {
        sfx.whoosh(); const x0 = st.cloud.position.x;
        return s.anim(0.5, (_, p) => { st.cloud.position.x = x0 + Math.sin(p * Math.PI) * -0.25; }).then(() => { st.cloud.position.x = x0; });
      },
    },
    rain: {
      build(d, st) {
        d.add(prop('prop_icon_puddle', { s: 0.36, at: [0, 0.0, 0.12] }));
        st.cloud = sky('prop_cloud', { s: 0.42, at: [0, 0.95, 0.0] }); d.add(st.cloud);
        const f = st.cloud.userData.model?.userData.face; if (f) setFace(f, 'sad');
        st.drops = [[-0.35, 0.5, 0.15], [0.05, 0.34, 0.2], [0.4, 0.56, 0.12], [-0.12, 0.62, 0.1], [0.22, 0.18, 0.18]].map((at) => {
          const o = prop('prop_m_drop', { s: 1.3, at }); d.add(o); o.userData.y0 = at[1]; return o;
        });
      },
      act(s, st) {
        sfx.patter();
        return s.anim(0.7, (_, p) => {
          st.drops.forEach((o, i) => { const u = (p * 1.6 + i * 0.23) % 1; o.position.y = 0.66 - u * 0.61; });
        }).then(() => st.drops.forEach((o) => { o.position.y = o.userData.y0; }));
      },
    },
    rainbow: {
      build(d, st) {
        st.bow = sky('prop_rainbow', { s: 0.25, at: [0.04, 0.135, -0.15] }); d.add(st.bow);
        st.sun = sky('prop_word_sun', { s: 0.24, at: [-0.5, 0.74, -0.2] }); d.add(st.sun);
      },
      act(s, st) { sfx.sparkle(); joy(s, st.sun); sparkleAt(st.bow, 0.6); return pulse(s, st.bow, 0.12, 0.45); },
    },
  },
};

// ---------------------------------------------------------------- 6. Piggy gets muddy and has a bath
// a muddy pig is still a pink pig: the pig's own mud splat layers (tools/blender/creatures/pig.py), on body and head
function muddy(c) {
  const wear = c.userData.wear || c.userData.model?.userData.wear;
  if (wear) { wear('cloth_mud', true); wear('cloth_mud_head', true); }
}
const pig = {
  id: 'pig', tint: 0x7fd36a, line: 'Piggy is clean!', ask: 'What does piggy need?',
  lines: { mud: 'A mud puddle!', muddy: 'Muddy piggy!' },
  three: ['mud', 'muddy', 'bath'], four: ['mud', 'muddy', 'bath', 'dry'],
  steps: {
    mud: {
      build(d, st) {
        d.add(prop('prop_mud', { s: 0.36, at: [0.55, 0, 0.12] }));
        st.pig = critter('pig', { s: 0.44, at: [-0.32, 0, 0.06], ry: 0.45 }); d.add(st.pig);
      },
      act(s, st) { sfx.oink(); joy(s, st.pig); return bounce(s, st.pig, 0.2, 0.36); },
    },
    muddy: {
      build(d, st) {
        st.mud = prop('prop_mud', { s: 0.5, at: [0.04, 0, 0.1] }); d.add(st.mud);
        st.pig = critter('pig', { s: 0.46, at: [0.04, 0.02, 0.06], ry: -0.15 }); muddy(st.pig); d.add(st.pig);
      },
      act(s, st) { sfx.splash(); joy(s, st.pig); return wobble(s, st.pig, 0.18, 0.5, 3); },
    },
    bath: {
      build(d, st) {
        d.add(prop('prop_metaltub', { s: 0.48, at: [0, 0, 0.05] }));
        st.pig = critter('pig', { s: 0.42, at: [0, 0.04, 0.05] }); d.add(st.pig);
        st.foam = prop('prop_st_foam', { s: 0.48, at: [0, 0, 0.05] }); d.add(st.foam);
      },
      act(s, st) {
        sfx.bubble(); s.wait(0.15).then(() => sfx.bubble()); s.wait(0.3).then(() => sfx.bubble());
        joy(s, st.pig); sparkleAt(st.foam, 0.4);
        return pulse(s, st.foam, 0.08, 0.5);
      },
    },
    dry: {
      build(d, st) {
        d.add(prop('prop_metaltub', { s: 0.38, at: [0.4, 0, -0.02] }));
        st.pig = critter('pig', { s: 0.42, at: [-0.45, 0, 0.08], ry: 0.25 }); d.add(st.pig);
      },
      act(s, st) { sfx.sparkle(); joy(s, st.pig); sparkleAt(st.pig, 0.8); return bounce(s, st.pig, 0.25, 0.4); },
    },
  },
};

export const TALES = { chick, flower, butterfly, apple, rain, pig };
export const TALE_IDS = Object.keys(TALES);
