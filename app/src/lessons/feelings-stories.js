// Story vignettes for the Feelings game. Each story makes Pip feel something and returns a `fix` function:
// the little "make it better" moment that plays after the child finds the matching friend
// (a new balloon, the tower built again, the spider climbing away…).
// Stories are grouped by level stage (picnic hill / toy table / tree stump) and picked per round from PLANS.
// Things that fall, tumble and bounce use real rigid-body physics (ctx.dyn → physics.add).
import * as T from '../three.js';
import { toon } from '../engine/toon.js';
import { C, makeAnimal, setFace, popIn, popOut, hop, shake, wiggle } from '../engine/actors.js';
import { makeCloud, makeFlower } from '../engine/scenery.js';
import { mesh, geo } from '../engine/toon.js';
import { physics } from '../engine/physics.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';
import { prop } from './view-tools.js';
import {
  TOP, makeBalloon, makeCone, makeScoop, makeGift, makeStar, makeCup, makeBlock, makePot, makeBall, makeCupcake,
  makeSpider, makeJack, makeAcorn, makeBee, makeButterfly, makeMole, makeRaindrop, makePetal, makePumpkinBall, flowerProp,
} from './feelings-props.js';

const V = (x, y, z) => new T.Vector3(x, y, z);
const wpos = (o) => o.getWorldPosition(new T.Vector3());

// Pip shows the feeling: face, sound, a body move and a floating symbol.
export async function feel(ctx, emo) {
  const pip = ctx.pip, s = ctx.s, head = wpos(pip.userData.head).add(V(0.4, 1.0, 0.3));
  setFace(pip.userData.face, emo);
  if (emo === 'sad') {
    sfx.aww(); fx.float(head, '💧', { size: 5 });
    await s.tween(pip.userData.head.rotation, { x: 0.3 }, 0.35);
  } else if (emo === 'angry') {
    sfx.grr(); fx.float(head, '💢', { size: 5 });
    for (let k = 0; k < 3; k++) { await hop(s, pip, 0.2, 0.17); sfx.thunk(); }
  } else if (emo === 'scared') {
    sfx.gasp(); fx.float(head, '❗', { color: '#ff5a5a', size: 6 });
    await shake(s, pip, 0.14, 0.55);
  } else {
    sfx.giggle(); fx.float(head, '♥', { color: '#ff6f9c', size: 6 });
    await hop(s, pip, 0.6, 0.38, { sound: true });
  }
}

// Put a set of tumbled physics props back where they started (quick, with a note per piece).
async function rebuild(ctx, items) {
  for (let i = 0; i < items.length; i++) {
    const { o, p, q } = items[i];
    physics.remove(o);
    const p0 = o.position.clone(), q0 = o.quaternion.clone();
    sfx.note(i * 2);
    await ctx.s.anim(0.16, (e) => { o.position.lerpVectors(p0, p, e); o.position.y += Math.sin(e * Math.PI) * 0.6; o.quaternion.slerpQuaternions(q0, q, e); }, Ease.out);
  }
  for (const { o } of items) ctx.dyn(o, { shape: 'box', bounce: 0.2 });
}

// A tower of physics boxes. Returns [{o, p, q}] (their home transforms, for rebuild()).
function tower(ctx, x, z, makers, h) {
  const items = [];
  makers.forEach((mk, i) => {
    const o = mk();
    o.position.set(x + (i % 2 ? 0.04 : -0.04), TOP + h / 2 + i * (h + 0.02), z);
    o.scale.setScalar(0.001);
    ctx.props.add(o);
    items.push({ o, p: o.position.clone(), q: o.quaternion.clone() });
  });
  return items;
}

// ============ Level 1: the picnic hill ============
export const STORIES = {
  // happy: a present drops out of the sky, bounces, and the lid pops off
  giftDrop: async (ctx, P) => {
    const gift = makeGift(C.purple, C.yellow);
    gift.position.set(P.x + 1.7, P.y + 7, P.z + 0.6);
    ctx.props.add(gift);
    ctx.dyn(gift, { shape: 'box', spin: false, bounce: 0.35 });
    sfx.swoosh();
    physics.toss(gift, V(P.x + 1.7, TOP, P.z + 0.6), { arc: 0, time: 0.4, maxT: 0.8, spin: 0 });
    await ctx.wait(0.75);
    physics.remove(gift);
    sfx.tick(); await wiggle(ctx.s, gift, 0.2, 0.22);
    sfx.tick(); await wiggle(ctx.s, gift, 0.2, 0.22);
    const lid = gift.userData.lid;
    ctx.props.attach(lid);
    ctx.dyn(lid, { shape: 'box', bounce: 0.4 });
    physics.impulse(lid, { x: 1.6, y: 6.5, z: 0.6 }, { x: 0.2, y: 0.4, z: -2.5 });
    sfx.pop();
    const star = makeStar();
    star.position.y = 0.9;
    gift.add(star);
    ctx.s.tween(star.position, { y: 2.0 }, 0.35, Ease.back);
    fx.confetti(wpos(gift).add(V(0, 1.4, 0)), 18);
    sfx.twinkle();
    await feel(ctx, 'happy');
    return () => { sfx.sparkle(); return ctx.s.anim(0.6, (_, p) => { star.rotation.y = p * Math.PI * 4; star.position.y = 2.0 + Math.sin(p * Math.PI) * 0.6; }); };
  },

  // sad: the ice-cream scoop rolls off the cone and splats
  iceDrop: async (ctx, P) => {
    const ice = new T.Group();
    const cone = makeCone(); const scoop = makeScoop(C.green); scoop.position.y = 1.05;
    ice.add(cone, scoop);
    ice.position.set(P.x + 1.2, P.y, P.z + 0.7);
    ctx.props.add(ice);
    await popIn(ctx.s, ice, 1, 0.3);
    sfx.mmm();
    await ctx.s.tween(ice.rotation, { z: -0.45 }, 0.25, Ease.in);
    ctx.props.attach(scoop);
    ctx.dyn(scoop, { shape: 'ball', r: 0.38, bounce: 0.2 });
    physics.impulse(scoop, { x: 2.4, y: 1.5, z: 0.3 });
    sfx.whoosh();
    await ctx.wait(0.5);
    sfx.splash();
    await feel(ctx, 'sad');
    // fix: the cone stands up and a fresh scoop drops on with a bounce
    return async () => {
      ctx.s.tween(ice.rotation, { z: 0 }, 0.2);
      popOut(ctx.s, scoop, 0.15);
      const ns = makeScoop(C.pink); ns.position.y = 3.5;
      ice.add(ns);
      sfx.whoosh();
      await ctx.s.tween(ns.position, { y: 1.05 }, 0.45, Ease.bounce);
      sfx.pop();
    };
  },

  // angry: a bouncing ball knocks over the tower of picnic cups
  cupTower: async (ctx, P) => {
    const x = P.x + 1.9, z = P.z + 0.6;
    const items = tower(ctx, x, z, [() => makeCup(C.blue), () => makeCup(C.yellow), () => makeCup(C.red), () => makeCup(C.green)], 0.6);
    for (let i = 0; i < items.length; i++) { await popIn(ctx.s, items[i].o, 1, 0.14, { sound: false }); sfx.note(i); }
    for (const { o } of items) ctx.dyn(o, { shape: 'box', bounce: 0.2 });
    const ball = makeBall(0.4, [C.orange, C.white]);
    ball.position.set(P.x + 9, P.y + 2.5, z);
    ctx.props.add(ball);
    sfx.boing();
    physics.toss(ball, V(x, TOP + 1.3, z), { arc: 1.5, time: 0.5, maxT: 0.8, bounce: 0.6, mass: 2 });
    await ctx.wait(0.55);
    sfx.crunch();
    await ctx.wait(0.35);
    await feel(ctx, 'angry');
    return () => rebuild(ctx, items);
  },

  // sad: the balloon slips away into the sky
  balloonAway: async (ctx, P) => {
    const balloon = makeBalloon(C.blue);
    ctx.props.add(balloon);
    balloon.position.set(P.x + 1.3, P.y + 2.6, P.z + 0.3);
    await popIn(ctx.s, balloon, 1, 0.3);
    await ctx.wait(0.2);
    sfx.whoosh();
    ctx.s.anim(2.0, (e, p) => { balloon.position.y = P.y + 2.6 + e * 11; balloon.position.x = P.x + 1.3 + Math.sin(p * 9) * 0.5 + p * 3; }, Ease.in);
    await hop(ctx.s, ctx.pip, 0.8, 0.4);
    await feel(ctx, 'sad');
    return async () => {
      const nb = makeBalloon(C.red);
      nb.position.set(P.x + 1.3, P.y + 2.6, P.z + 0.3);
      ctx.props.add(nb);
      sfx.pop();
      await popIn(ctx.s, nb, 1, 0.35);
    };
  },

  // scared: a thunder cloud rolls in and the rain comes down
  thunder: async (ctx, P) => {
    const cloud = makeCloud(P.x - 12, P.y + 4.4, P.z + 0.2, 1);
    const grey = toon(0x8790a8);
    cloud.traverse((o) => { if (o.isMesh && !o.userData.outline) o.material = grey; });
    const bolt = makeBolt();
    bolt.position.set(0.2, -0.8, 0.6);
    bolt.visible = false;
    cloud.add(bolt);
    ctx.props.add(cloud);
    sfx.rustle();
    await ctx.s.tween(cloud.position, { x: P.x + 0.6 }, 0.7, Ease.out);
    bolt.visible = true;
    document.body.classList.add('flash');
    sfx.thunder();
    setTimeout(() => document.body.classList.remove('flash'), 180);
    sfx.patter();
    const drops = [];
    for (let i = 0; i < 9; i++) {
      const d = makeRaindrop();
      d.position.set(P.x + 0.6 + (Math.random() - 0.5) * 3.6, P.y + 3.4 + Math.random() * 0.6, P.z + 0.3 + Math.random() * 0.8);
      ctx.props.add(d);
      ctx.dyn(d, { shape: 'ball', r: 0.09, bounce: 0.15, mass: 0.3 });
      drops.push(d);
    }
    ctx.s.wait(0.25).then(() => { bolt.visible = false; });
    await feel(ctx, 'scared');
    // fix: the cloud turns white and floats away; the puddles dry up
    return async () => {
      cloud.traverse((o) => { if (o.isMesh && o.material === grey) o.material = toon(0xffffff); });
      sfx.twinkle();
      for (const d of drops) popOut(ctx.s, d, 0.2);
      await ctx.s.tween(cloud.position, { x: P.x + 14, y: P.y + 7 }, 0.6, Ease.in);
    };
  },

  // happy: a birthday cupcake bounces down and its candle lights up
  cupcake: async (ctx, P) => {
    const cake = makeCupcake();
    cake.position.set(P.x + 1.6, P.y + 7, P.z + 0.7);
    cake.scale.setScalar(1.3);
    ctx.props.add(cake);
    ctx.dyn(cake, { shape: 'box', spin: false, bounce: 0.4 });
    sfx.swoosh();
    physics.toss(cake, V(P.x + 1.6, TOP, P.z + 0.7), { arc: 0, time: 0.4, maxT: 0.8, spin: 0 });
    await ctx.wait(0.75);
    physics.remove(cake);
    cake.userData.flame.visible = true;
    sfx.pop(); sfx.twinkle();
    fx.float(wpos(cake).add(V(0, 2.2, 0)), '🎉', { size: 6 });
    await feel(ctx, 'happy');
    return async () => {
      sfx.whoosh();
      fx.float(wpos(cake).add(V(-0.4, 1.8, 0)), '💨', { size: 5 });
      await ctx.wait(0.2);
      cake.userData.flame.visible = false;
      fx.confetti(wpos(cake).add(V(0, 1.6, 0)), 22);
      sfx.sparkle();
      await wiggle(ctx.s, cake, 0.25, 0.4);
    };
  },

  // ============ Level 2: the toy table ============
  // sad: Pip's ball rolls off the table and bounces away
  ballRoll: async (ctx, P) => {
    const ball = makeBall(0.45, [C.blue, C.yellow, C.red]);
    ball.position.set(P.x + 1.2, TOP + 0.45, P.z + 0.7);
    ctx.props.add(ball);
    await popIn(ctx.s, ball, 1, 0.3);
    ctx.dyn(ball, { shape: 'ball', r: 0.45, bounce: 0.65 });
    sfx.boing();
    physics.impulse(ball, { x: 4.2, y: 1.2, z: 0.2 }, { x: 0, y: 0, z: -2 });
    await ctx.s.tween(ctx.pip.rotation, { y: -0.6 }, 0.3);
    await ctx.wait(0.45);
    await feel(ctx, 'sad');
    ctx.s.tween(ctx.pip.rotation, { y: 0 }, 0.3);
    // fix: the ball comes bouncing back up onto the table
    return async () => {
      sfx.boing();
      await physics.toss(ball, V(P.x + 1.4, TOP + 0.5, P.z + 0.7), { arc: 2, time: 0.5, maxT: 0.75 });
    };
  },

  // angry: a ball comes flying and knocks the block tower down
  blockTower: async (ctx, P) => {
    const x = P.x + 1.9, z = P.z + 0.6;
    const cols = [C.red, C.yellow, C.blue, C.green, C.purple];
    const items = tower(ctx, x, z, cols.map((c) => () => makeBlock(c, 0.6)), 0.6);
    for (let i = 0; i < items.length; i++) { await popIn(ctx.s, items[i].o, 1, 0.14, { sound: false }); sfx.note(i); }
    for (const { o } of items) ctx.dyn(o, { shape: 'box', bounce: 0.15 });
    const ball = makeBall(0.38, [C.purple, C.white]);
    ball.position.set(P.x + 9, P.y + 3, z);
    ctx.props.add(ball);
    sfx.boing();
    physics.toss(ball, V(x, TOP + 1.9, z), { arc: 1.4, time: 0.45, maxT: 0.8, bounce: 0.6, mass: 2 });
    await ctx.wait(0.5);
    sfx.crunch();
    await ctx.wait(0.35);
    await feel(ctx, 'angry');
    return () => rebuild(ctx, items);
  },

  // scared: the jack-in-the-box springs out — BOING!
  jackBox: async (ctx, P) => {
    const jb = makeJack();
    jb.position.set(P.x + 1.6, TOP, P.z + 0.7);
    jb.rotation.y = -0.3;
    ctx.props.add(jb);
    await popIn(ctx.s, jb, 1, 0.3);
    const { crank, lidPivot, jack, jackFace } = jb.userData;
    const ax = jb.userData.crankAxis || 'x';
    for (let i = 0; i < 4; i++) { sfx.note(i * 2); await ctx.s.tween(crank.rotation, { [ax]: crank.rotation[ax] + Math.PI / 2 }, 0.13); }
    sfx.boing();
    lidPivot.rotation.x = -2.2;
    jack.visible = true;
    if (jackFace) setFace(jackFace, 'joy');
    ctx.s.anim(0.5, (e) => { jack.scale.set(1, Math.max(0.05, e), 1); }, Ease.elastic);
    jb.rotation.y = 0;
    ctx.dyn(jb, { shape: 'box', spin: false, bounce: 0.3, size: V(1, 1, 1) });
    physics.impulse(jb, { x: 0.3, y: 4, z: 0 });
    await feel(ctx, 'scared');
    // fix: the clown giggles, waves and tucks back in
    return async () => {
      physics.remove(jb);
      sfx.giggle();
      await wiggle(ctx.s, jack, 0.35, 0.35);
      sfx.squeak();
      await ctx.s.anim(0.25, (e) => jack.scale.set(1, Math.max(0.05, 1 - e), 1));
      jack.visible = false;
      sfx.tick();
      await ctx.s.tween(lidPivot.rotation, { x: 0 }, 0.15);
    };
  },

  // happy: the toy box lid flies off and bouncy balls burst out everywhere
  ballsBurst: async (ctx, P) => {
    const box = makeGift(C.green, C.red);
    box.position.set(P.x + 1.7, TOP, P.z + 0.6);
    ctx.props.add(box);
    await popIn(ctx.s, box, 1.1, 0.3);
    sfx.tick(); await wiggle(ctx.s, box, 0.2, 0.2);
    sfx.tick(); await wiggle(ctx.s, box, 0.2, 0.2);
    const lid = box.userData.lid;
    ctx.props.attach(lid);
    ctx.dyn(lid, { shape: 'box', bounce: 0.4 });
    physics.impulse(lid, { x: -0.5, y: 6, z: 0.6 }, { x: 1.5, y: 0.3, z: 1 });
    ctx.dyn(box, { shape: 'box', spin: false, bounce: 0.1, mass: 6, size: V(1.1, 0.8, 1.1) });
    sfx.pop();
    const balls = [];
    [C.red, C.blue, C.yellow, C.pink, C.green, C.orange].forEach((col, i) => {
      const b = makeBall(0.2, [col]);
      b.position.set(P.x + 1.7 + (i % 3 - 1) * 0.25, TOP + 1.4 + (i > 2 ? 0.35 : 0), P.z + 0.6);
      ctx.props.add(b);
      ctx.dyn(b, { shape: 'ball', r: 0.2, bounce: 0.8, mass: 0.4 });
      physics.impulse(b, { x: (i - 2.5) * 0.9, y: 6 + Math.random() * 2, z: Math.random() * 1.2 });
      balls.push(b);
      ctx.s.wait(0.05 * i).then(() => sfx.boing2());
    });
    await ctx.wait(0.3);
    await feel(ctx, 'happy');
    // fix: all the balls do a happy bounce together
    return async () => {
      for (const b of balls) physics.poke(b, 0.9);
      sfx.twinkle();
      await ctx.wait(0.5);
    };
  },

  // angry: a cheeky frog hops in and grabs Pip's ball
  frogTakes: async (ctx, P) => {
    const ball = makeBall(0.4, [C.orange, C.yellow]);
    ball.position.set(P.x + 1.4, TOP + 0.4, P.z + 0.8);
    ctx.props.add(ball);
    await popIn(ctx.s, ball, 1, 0.3);
    ctx.dyn(ball, { shape: 'ball', r: 0.4, bounce: 0.5 });
    const frog = makeAnimal('frog');
    frog.scale.setScalar(0.7);
    frog.userData.baseScale = 0.7;
    frog.position.set(P.x + 12, TOP, P.z + 0.8);
    frog.rotation.y = -Math.PI / 2;
    ctx.props.add(frog);
    sfx.ribbit();
    const hopTo = (x0, x1, d) => ctx.s.anim(d, (e, p) => { frog.position.x = x0 + (x1 - x0) * e; frog.position.y = TOP + Math.abs(Math.sin(p * Math.PI * 3)) * 0.7; });
    await hopTo(P.x + 12, P.x + 2.3, 0.5);
    sfx.pop();
    physics.remove(ball);
    frog.add(ball);
    ball.position.set(0, 1.6, 0.4);
    ball.quaternion.identity();
    frog.rotation.y = Math.PI / 2;
    hopTo(P.x + 2.3, P.x + 13, 0.7);
    await ctx.wait(0.35);
    await feel(ctx, 'angry');
    // fix: the frog comes back and throws the ball to Pip
    return async () => {
      frog.rotation.y = -Math.PI / 2;
      sfx.ribbit();
      await hopTo(P.x + 13, P.x + 3.2, 0.4);
      ctx.props.attach(ball);
      sfx.boing();
      physics.toss(ball, V(P.x + 1.2, TOP + 0.4, P.z + 0.8), { arc: 1.6, time: 0.4, maxT: 0.6, r: 0.4, shape: 'ball' });
      await hop(ctx.s, frog, 0.5, 0.3);
    };
  },

  // scared: a spider drops down on its thread
  spider: async (ctx, P) => {
    const sp = makeSpider();
    sp.position.set(P.x + 1.5, P.y + 9, P.z + 0.6);
    ctx.props.add(sp);
    sfx.whoosh();
    await ctx.s.tween(sp.position, { y: P.y + 1.6 }, 0.6, Ease.bounce);
    sfx.boing();
    await wiggle(ctx.s, sp, 0.3, 0.3);
    await feel(ctx, 'scared');
    return async () => {
      await wiggle(ctx.s, sp, 0.3, 0.25);
      sfx.whoosh();
      await ctx.s.tween(sp.position, { y: P.y + 10 }, 0.45, Ease.in);
    };
  },

  // ============ Level 3: the tree stump in the garden ============
  // sad: the flower droops and its petals drop off one by one
  petals: async (ctx, P) => {
    const g = new T.Group();
    const pot = makePot(0xd9774a); pot.position.y = 0.3;
    const fl = flowerProp(C.pink, 2.1); fl.position.y = 0.5;
    g.add(pot, fl);
    g.position.set(P.x + 1.6, TOP, P.z + 0.7);
    ctx.props.add(g);
    await popIn(ctx.s, g, 1, 0.35);
    sfx.aww();
    await ctx.s.tween(fl.rotation, { z: -1.0 }, 0.55, Ease.inOut);
    const head = wpos(fl).add(V(1.2, 0.6, 0.2));
    const petals = [];
    for (let i = 0; i < 4; i++) {
      const pt = makePetal();
      pt.rotation.set(Math.random() * 3, Math.random() * 3, 0);
      pt.position.copy(head).add(V((Math.random() - 0.5) * 0.4, 0, (Math.random() - 0.5) * 0.3));
      ctx.props.add(pt);
      ctx.dyn(pt, { shape: 'ball', r: 0.12, bounce: 0.15, mass: 0.2 });
      physics.impulse(pt, { x: 0.4 + Math.random(), y: 0.5, z: Math.random() * 0.5 });
      petals.push(pt);
    }
    await feel(ctx, 'sad');
    // fix: a drink of water and it stands up again, with brand new petals
    return async () => {
      sfx.pour();
      for (const p of petals) popOut(ctx.s, p, 0.2);
      await ctx.s.tween(fl.rotation, { z: 0 }, 0.45, Ease.back);
      sfx.twinkle();
    };
  },

  // angry: acorns rain down — one bonks Pip right on the head!
  acorns: async (ctx, P) => {
    const nuts = [];
    const headY = wpos(ctx.pip.userData.head).y + 0.7;
    sfx.rustle();
    for (let i = 0; i < 6; i++) {
      const a = makeAcorn();
      a.scale.setScalar(1.3);
      const bonk = i === 2;
      a.position.set(bonk ? P.x : P.x - 1.6 + i * 0.7, P.y + 7 + i * 0.4, P.z + (bonk ? 0.2 : 0.7));
      ctx.props.add(a);
      nuts.push(a);
      if (!bonk) ctx.dyn(a, { shape: 'ball', r: 0.26, bounce: 0.5, mass: 0.5 });
      else {
        ctx.s.tween(a.position, { y: headY }, 0.5, Ease.in).then(() => {
          sfx.thunk(); fx.float(V(P.x, headY + 0.6, P.z + 0.5), '💥', { size: 5 });
          ctx.s.anim(0.2, (_, p) => { const k = 1 - Math.sin(p * Math.PI) * 0.2; ctx.pip.scale.set(1.2 / Math.sqrt(k), 1.2 * k, 1.2 / Math.sqrt(k)); });
          ctx.dyn(a, { shape: 'ball', r: 0.26, bounce: 0.6, mass: 0.5 });
          physics.impulse(a, { x: 2.2, y: 3, z: 0.6 });
        });
      }
    }
    await ctx.wait(0.75);
    await feel(ctx, 'angry');
    // fix: every acorn gets tossed into the basket on the ground
    return async () => {
      const b = ctx.basketPos;
      nuts.forEach((a, i) => ctx.s.wait(i * 0.06).then(() => {
        if (!a.parent) return;
        sfx.swoosh();
        physics.toss(a, V(b.x + (Math.random() - 0.5) * 0.3, b.y + 0.5, b.z + (Math.random() - 0.5) * 0.3), { arc: 2, time: 0.5, maxT: 0.8, shape: 'ball', r: 0.26 });
      }));
      await ctx.wait(0.7);
      sfx.twinkle();
    };
  },

  // scared: the ground rumbles and a mole pops out — BOO!
  mole: async (ctx, P) => {
    const m = makeMole();
    m.position.set(P.x + 1.6, TOP, P.z + 0.7);
    ctx.props.add(m);
    await popIn(ctx.s, m, 1.2, 0.3);
    sfx.rustle();
    await shake(ctx.s, m, 0.12, 0.45);
    const mole = m.userData.mole;
    sfx.boing();
    ctx.s.tween(mole.position, { y: 0 }, 0.3, Ease.back);
    for (let i = 0; i < 5; i++) {
      const d = mesh(geo.sphere(0.13, 8, 6), 0x7a5232, { outline: 0.01 });
      d.position.copy(wpos(m)).add(V(0, 0.4, 0));
      ctx.props.add(d);
      ctx.dyn(d, { shape: 'ball', r: 0.13, bounce: 0.3, mass: 0.3 });
      physics.impulse(d, { x: (Math.random() - 0.5) * 4, y: 4 + Math.random() * 2, z: Math.random() * 1.5 });
    }
    await feel(ctx, 'scared');
    // fix: the mole waves hello and ducks back down
    return async () => {
      sfx.squeak();
      await wiggle(ctx.s, mole, 0.3, 0.35);
      sfx.whoosh();
      await ctx.s.tween(mole.position, { y: -0.8 }, 0.25, Ease.in);
    };
  },

  // happy: a butterfly flutters in and lands on Pip's head
  butterfly: async (ctx, P) => {
    const b = makeButterfly(C.purple);
    b.userData.flap = 18;
    b.position.set(P.x + 9, P.y + 4, P.z + 1);
    ctx.props.add(b);
    const to = wpos(ctx.pip.userData.head).add(V(0, 0.75, 0));
    sfx.twinkle();
    const from = b.position.clone();
    await ctx.s.anim(0.9, (e, p) => { b.position.lerpVectors(from, to, e); b.position.y += Math.sin(p * Math.PI * 4) * 0.5 * (1 - p); }, Ease.inOut);
    b.userData.flap = 3;
    await feel(ctx, 'happy');
    // fix: it flutters a happy loop around Pip
    return async () => {
      b.userData.flap = 18;
      sfx.sparkle();
      await ctx.s.anim(0.7, (_, p) => { const a = p * Math.PI * 2; b.position.set(to.x + Math.sin(a) * 1.4, to.y + Math.sin(a * 2) * 0.4 + 0.3, to.z + Math.cos(a) * 0.8); });
      b.userData.flap = 3;
    };
  },

  // angry: a rolling pumpkin knocks over the stack of flower pots
  potTower: async (ctx, P) => {
    const x = P.x + 1.9, z = P.z + 0.6;
    const items = tower(ctx, x, z, [() => makePot(0xd9774a), () => makePot(0x5fb0d0), () => makePot(0xd9774a), () => makePot(0x9b7bd8)], 0.68); // 0.68: the pots are 0.67 tall (no overlap)
    for (let i = 0; i < items.length; i++) { await popIn(ctx.s, items[i].o, 1, 0.14, { sound: false }); sfx.note(i); }
    for (const { o } of items) ctx.dyn(o, { shape: 'box', bounce: 0.15 });
    const pk = makePumpkinBall();
    pk.position.set(P.x + 9, P.y + 2.5, z);
    ctx.props.add(pk);
    sfx.lowBoing();
    physics.toss(pk, V(x, TOP + 0.9, z), { arc: 1.2, time: 0.5, maxT: 0.8, shape: 'ball', r: 0.52, bounce: 0.35, mass: 3 });
    await ctx.wait(0.55);
    sfx.crunch();
    await ctx.wait(0.35);
    await feel(ctx, 'angry');
    return () => rebuild(ctx, items);
  },

  // scared: a buzzy bee zooms round and round Pip
  bee: async (ctx, P) => {
    const b = makeBee();
    b.userData.flap = 40;
    b.position.set(P.x - 9, P.y + 3, P.z + 1);
    ctx.props.add(b);
    const c = P.clone().add(V(0, 1.4, 0.4));
    sfx.buzz();
    const from = b.position.clone();
    await ctx.s.anim(0.5, (e) => b.position.lerpVectors(from, c.clone().add(V(-1.6, 0.3, 0)), e), Ease.out);
    sfx.buzz();
    ctx.s.anim(1.0, (_, p) => {
      const a = Math.PI + p * Math.PI * 4, r = 1.6 - p * 0.4;
      b.position.set(c.x + Math.cos(a) * r, c.y + Math.sin(p * 30) * 0.2, c.z + Math.sin(a) * r * 0.6);
      b.rotation.y = -a;
    });
    await ctx.wait(0.3);
    await feel(ctx, 'scared');
    // fix: the bee finds a flower to sit on and stays happy there
    return async () => {
      const fl = flowerProp(C.yellow, 1);
      fl.scale.setScalar(2.4);
      fl.position.set(P.x + 2.0, TOP, P.z + 0.8);
      ctx.props.add(fl);
      popIn(ctx.s, fl, 2.4, 0.3);
      sfx.buzz();
      const f0 = b.position.clone(), to = V(P.x + 2.0, TOP + 1.5, P.z + 0.9);
      await ctx.s.anim(0.45, (e) => { b.position.lerpVectors(f0, to, e); b.rotation.y = 0; }, Ease.inOut);
      b.userData.flap = 6;
      sfx.twinkle();
    };
  },
};

function makeBolt() {
  const pm = prop('prop_m_bolt'); // Blender lightning bolt (top at y 0, hangs down like the old one)
  if (pm) return pm;
  const s = new T.Shape();
  s.moveTo(0, 0); s.lineTo(0.5, 0); s.lineTo(0.1, -0.8); s.lineTo(0.55, -0.8); s.lineTo(-0.3, -2.1); s.lineTo(0, -1.0); s.lineTo(-0.4, -1.0); s.closePath();
  return mesh(new T.ExtrudeGeometry(s, { depth: 0.15, bevelEnabled: false }), C.yellow, { hull: 1.05 });
}
