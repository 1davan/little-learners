// Story vignettes for the Feelings game. Each story makes Pip feel something and returns a `fix` function:
// the little "make it better" moment that plays after the child finds the matching friend
// (a new balloon, the tower built again, the spider climbing away…).
import * as T from '../three.js';
import { mesh, geo, toon, basic, ink } from '../engine/toon.js';
import { C, makeAnimal, setFace, popIn, popOut, hop, shake, wiggle } from '../engine/actors.js';
import { makeCloud, makeFlower } from '../engine/scenery.js';
import { sfx } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { Ease } from '../engine/tween.js';

function makeBalloon(col) {
  const balloon = new T.Group();
  const b = mesh(geo.sphere(0.6, 20, 14), col, { outline: 0.035 });
  b.scale.set(1, 1.15, 1);
  const hi = new T.Mesh(geo.sphere(0.12, 8, 6), basic(0xffffff)); hi.position.set(-0.22, 0.3, 0.5);
  const knot = mesh(geo.cone(0.1, 0.16, 8), col, { outline: 0.015 }); knot.position.y = -0.72; knot.rotation.x = Math.PI;
  const string = new T.Mesh(geo.cyl(0.015, 0.015, 1.6, 4), basic(0x555555)); string.position.y = -1.55;
  balloon.add(b, hi, knot, string);
  return balloon;
}

function makeCone() {
  const g = new T.Group();
  const cone = mesh(geo.cone(0.32, 1.0, 14), 0xe0a85a, { outline: 0.025 });
  cone.rotation.x = Math.PI; cone.position.y = 0.5;
  g.add(cone);
  return g;
}
function makeScoop(col) {
  const s = mesh(geo.sphere(0.38, 16, 12), col, { outline: 0.025 });
  const cherry = mesh(geo.sphere(0.1, 10, 8), C.red, { outline: 0.012 });
  cherry.position.y = 0.38;
  s.add(cherry);
  return s;
}

function makeGift() {
  const g = new T.Group();
  const box = mesh(geo.box(1.0, 0.8, 1.0), C.purple, { hull: 1.05 });
  box.position.y = 0.4;
  const rib1 = new T.Mesh(geo.box(0.18, 0.82, 1.02), toon(C.yellow)); rib1.position.y = 0.4;
  const lid = new T.Group();
  const top = mesh(geo.box(1.12, 0.22, 1.12), C.purple, { hull: 1.05 });
  const rib2 = new T.Mesh(geo.box(0.18, 0.24, 1.14), toon(C.yellow));
  const bow = mesh(geo.torus(0.16, 0.06, Math.PI * 2, 6, 14), C.yellow, { outline: 0.01 });
  bow.position.y = 0.2;
  lid.add(top, rib2, bow);
  lid.position.y = 0.9;
  g.add(box, rib1, lid);
  g.userData.lid = lid;
  return g;
}

function makeSpider() {
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

// ---------- the stories (ctx = the lesson; P = Pip's spot on the hill) ----------
export const STORIES = {
  happy: [
    // a balloon floats down to Pip
    async (ctx, P) => {
      const balloon = makeBalloon(C.red);
      ctx.props.add(balloon);
      balloon.position.set(P.x + 1.3, 10, P.z);
      sfx.swoosh();
      await ctx.s.tween(balloon.position, { y: P.y + 3.6 }, 0.8, Ease.out);
      setFace(ctx.pip.userData.face, 'happy');
      sfx.giggle();
      await hop(ctx.s, ctx.pip, 0.6);
      hop(ctx.s, ctx.pip, 0.6);
      return () => { sfx.twinkle(); return wiggle(ctx.s, balloon, 0.3, 0.6); };
    },
    // a present wobbles, the lid pops off and a star springs out
    async (ctx, P) => {
      const gift = makeGift();
      gift.position.set(P.x + 1.7, P.y - 0.25, P.z + 0.5);
      ctx.props.add(gift);
      await popIn(ctx.s, gift, 1, 0.35);
      sfx.tick(); await wiggle(ctx.s, gift, 0.18, 0.25);
      sfx.tick(); await wiggle(ctx.s, gift, 0.18, 0.25);
      const lid = gift.userData.lid;
      sfx.pop();
      ctx.s.tween(lid.position, { y: 2.4, x: 0.9 }, 0.4, Ease.out);
      ctx.s.tween(lid.rotation, { z: -1.2 }, 0.4);
      const star = mesh(geo.sphere(0.32, 5, 2), C.yellow, { outline: 0.02 });
      star.scale.set(1.3, 1.3, 0.5);
      star.position.y = 0.9;
      gift.add(star);
      ctx.s.tween(star.position, { y: 2.0 }, 0.4, Ease.back);
      fx.confetti(gift.getWorldPosition(new T.Vector3()).add(new T.Vector3(0, 1.4, 0)), 18);
      sfx.twinkle();
      setFace(ctx.pip.userData.face, 'happy');
      sfx.giggle();
      await hop(ctx.s, ctx.pip, 0.6);
      return () => ctx.s.anim(0.6, (_, p) => { star.rotation.y = p * Math.PI * 4; });
    },
    // an ice cream flies in and Pip has a lick
    async (ctx, P) => {
      const ice = new T.Group();
      const cone = makeCone(); const scoop = makeScoop(C.pink); scoop.position.y = 1.05;
      ice.add(cone, scoop);
      ice.position.set(P.x + 8, P.y + 0.3, P.z + 0.7);
      ctx.props.add(ice);
      sfx.swoosh();
      await ctx.s.tween(ice.position, { x: P.x + 1.2 }, 0.6, Ease.out);
      sfx.chomp();
      await ctx.s.tween(ctx.pip.rotation, { z: -0.25 }, 0.15).then(() => ctx.s.tween(ctx.pip.rotation, { z: 0 }, 0.2));
      setFace(ctx.pip.userData.face, 'happy');
      sfx.mmm();
      await hop(ctx.s, ctx.pip, 0.5);
      return () => { sfx.chomp(); return wiggle(ctx.s, ice, 0.2, 0.5); };
    },
  ],
  sad: [
    // the balloon floats away
    async (ctx, P) => {
      const balloon = makeBalloon(C.blue);
      ctx.props.add(balloon);
      balloon.position.set(P.x + 1.3, P.y + 3.6, P.z);
      await popIn(ctx.s, balloon, 1, 0.3);
      await ctx.wait(0.25);
      sfx.whoosh();
      ctx.s.tween(balloon.position, { y: 14, x: P.x + 4 }, 2.0, Ease.in);
      await ctx.wait(0.55);
      setFace(ctx.pip.userData.face, 'sad');
      sfx.aww();
      await ctx.s.tween(ctx.pip.userData.head.rotation, { x: 0.3 }, 0.4);
      // fix: a brand new balloon
      return async () => {
        const nb = makeBalloon(C.red);
        nb.position.set(P.x - 1.3, P.y + 3.6, P.z);
        ctx.props.add(nb);
        sfx.pop();
        await popIn(ctx.s, nb, 1, 0.35);
      };
    },
    // the ice cream scoop falls off: splat!
    async (ctx, P) => {
      const ice = new T.Group();
      const cone = makeCone(); const scoop = makeScoop(C.green); scoop.position.y = 1.05;
      ice.add(cone, scoop);
      ice.position.set(P.x + 1.2, P.y - 0.2, P.z + 0.7);
      ctx.props.add(ice);
      await popIn(ctx.s, ice, 1, 0.3);
      sfx.mmm();
      await ctx.s.tween(ice.rotation, { z: -0.5 }, 0.3, Ease.in);
      sfx.whoosh();
      await ctx.s.tween(scoop.position, { x: 1.4, y: -0.3 }, 0.4, Ease.in);
      scoop.scale.set(1.5, 0.35, 1.5);
      sfx.splash();
      setFace(ctx.pip.userData.face, 'sad');
      sfx.aww();
      await ctx.s.tween(ctx.pip.userData.head.rotation, { x: 0.3 }, 0.4);
      // fix: a fresh scoop lands on the cone
      return async () => {
        ice.rotation.z = 0;
        popOut(ctx.s, scoop, 0.15);
        const ns = makeScoop(C.yellow); ns.position.y = 1.05;
        ice.add(ns);
        sfx.pop();
        await popIn(ctx.s, ns, 1, 0.35);
      };
    },
    // the flower droops and its petals drop
    async (ctx, P) => {
      const fl = makeFlower(C.pink);
      fl.position.set(P.x + 1.5, P.y - 0.45, P.z + 0.7);
      ctx.props.add(fl);
      await popIn(ctx.s, fl, 2.6, 0.35);
      await ctx.wait(0.2);
      sfx.aww();
      await ctx.s.tween(fl.rotation, { z: -1.1 }, 0.7, Ease.inOut);
      setFace(ctx.pip.userData.face, 'sad');
      await ctx.s.tween(ctx.pip.userData.head.rotation, { x: 0.3 }, 0.4);
      // fix: a drink of water and it stands up again
      return async () => {
        sfx.pour();
        await ctx.s.tween(fl.rotation, { z: 0 }, 0.5, Ease.back);
        sfx.twinkle();
      };
    },
  ],
  angry: [
    // a ball knocks the block tower over
    async (ctx, P) => {
      const tower = new T.Group();
      [C.blue, C.yellow, C.red].forEach((c, i) => { const bl = mesh(geo.box(0.8, 0.8, 0.8), c, { hull: 1.07 }); bl.position.y = 0.4 + i * 0.82; tower.add(bl); });
      tower.position.set(P.x + 1.8, P.y - 0.1, P.z + 0.4);
      ctx.props.add(tower);
      await popIn(ctx.s, tower, 1, 0.35);
      const ball = mesh(geo.sphere(0.35, 16, 12), C.purple, { outline: 0.03 });
      ball.position.set(P.x + 7, P.y + 0.4, P.z + 0.4);
      ctx.props.add(ball);
      sfx.boing();
      await ctx.s.tween(ball.position, { x: P.x + 2.1 }, 0.5, Ease.in);
      sfx.pop();
      ctx.s.tween(ball.position, { x: P.x + 7, y: P.y + 2 }, 0.7, Ease.out);
      tower.children.forEach((bl, i) => {
        ctx.s.tween(bl.position, { x: 0.6 + i * 0.9, y: 0.4 }, 0.5 + i * 0.1, Ease.bounce);
        ctx.s.tween(bl.rotation, { z: -1.2 - i * 0.4 }, 0.5 + i * 0.1, Ease.out);
      });
      await ctx.wait(0.6);
      setFace(ctx.pip.userData.face, 'angry');
      sfx.grr();
      for (let k = 0; k < 3; k++) await hop(ctx.s, ctx.pip, 0.2, 0.18);
      // fix: build it again, block by block
      return async () => {
        for (let i = 0; i < tower.children.length; i++) {
          const bl = tower.children[i];
          ctx.s.tween(bl.rotation, { z: 0 }, 0.2);
          await ctx.s.tween(bl.position, { x: 0, y: 0.4 + i * 0.82 }, 0.2, Ease.out);
          sfx.note(i * 2);
        }
      };
    },
    // a frog hops in and takes Pip's ball
    async (ctx, P) => {
      const ball = mesh(geo.sphere(0.4, 16, 12), C.orange, { outline: 0.03 });
      ball.position.set(P.x + 1.4, P.y + 0.1, P.z + 0.8);
      ctx.props.add(ball);
      await popIn(ctx.s, ball, 1, 0.3);
      const frog = makeAnimal('frog');
      frog.scale.setScalar(0.7);
      frog.userData.baseScale = 0.7;
      frog.position.set(P.x + 12, P.y - 0.4, P.z + 0.8);
      frog.rotation.y = -Math.PI / 2;
      ctx.props.add(frog);
      sfx.ribbit();
      await ctx.s.anim(0.5, (e, p) => { frog.position.x = P.x + 12 - 9.9 * e; frog.position.y = P.y - 0.4 + Math.abs(Math.sin(p * Math.PI * 3)) * 0.7; });
      sfx.pop();
      frog.add(ball);
      ball.position.set(0, 1.1, 0.6);
      frog.rotation.y = Math.PI / 2;
      ctx.s.anim(0.7, (e, p) => { frog.position.x = P.x + 2.1 + 11 * e; frog.position.y = P.y - 0.4 + Math.abs(Math.sin(p * Math.PI * 3)) * 0.7; });
      await ctx.wait(0.35);
      setFace(ctx.pip.userData.face, 'angry');
      sfx.grr();
      for (let k = 0; k < 3; k++) await hop(ctx.s, ctx.pip, 0.2, 0.18);
      // fix: the frog brings the ball back
      return async () => {
        frog.rotation.y = -Math.PI / 2;
        sfx.ribbit();
        await ctx.s.anim(0.5, (e, p) => { frog.position.x = P.x + 13.1 - 11 * e; frog.position.y = P.y - 0.4 + Math.abs(Math.sin(p * Math.PI * 3)) * 0.7; });
        frog.remove(ball);
        ball.position.set(P.x + 1.4, P.y + 0.1, P.z + 0.8);
        ctx.props.add(ball);
        sfx.boing();
      };
    },
  ],
  scared: [
    // thunder!
    async (ctx, P) => {
      const cloud = makeCloud(P.x - 12, P.y + 3.6, P.z, 1);
      cloud.traverse((o) => { if (o.isMesh && !o.userData.outline) o.material = toon(0x8790a8); });
      const boltShape = new T.Shape();
      boltShape.moveTo(0, 0); boltShape.lineTo(0.5, 0); boltShape.lineTo(0.1, -0.8); boltShape.lineTo(0.55, -0.8); boltShape.lineTo(-0.3, -2.1); boltShape.lineTo(0, -1.0); boltShape.lineTo(-0.4, -1.0); boltShape.closePath();
      const bolt = mesh(new T.ExtrudeGeometry(boltShape, { depth: 0.15, bevelEnabled: false }), C.yellow, { hull: 1.05 });
      bolt.position.set(0.2, -0.8, 0.6);
      bolt.visible = false;
      cloud.add(bolt);
      ctx.props.add(cloud);
      await ctx.s.tween(cloud.position, { x: P.x }, 0.8, Ease.out);
      bolt.visible = true;
      document.body.classList.add('flash');
      sfx.thunder();
      setTimeout(() => document.body.classList.remove('flash'), 180);
      setFace(ctx.pip.userData.face, 'scared');
      sfx.gasp();
      await shake(ctx.s, ctx.pip, 0.12, 0.7);
      bolt.visible = false;
      // fix: the cloud turns white and floats away
      return async () => {
        cloud.traverse((o) => { if (o.isMesh && o.material === toon(0x8790a8)) o.material = toon(0xffffff); });
        sfx.twinkle();
        await ctx.s.tween(cloud.position, { x: P.x + 14, y: P.y + 6 }, 0.7, Ease.in);
      };
    },
    // a spider drops down on its thread
    async (ctx, P) => {
      const sp = makeSpider();
      sp.position.set(P.x + 1.5, P.y + 9, P.z + 0.6);
      ctx.props.add(sp);
      sfx.whoosh();
      await ctx.s.tween(sp.position, { y: P.y + 1.6 }, 0.6, Ease.bounce);
      sfx.boing();
      await wiggle(ctx.s, sp, 0.3, 0.3);
      setFace(ctx.pip.userData.face, 'scared');
      sfx.gasp();
      await shake(ctx.s, ctx.pip, 0.12, 0.6);
      // fix: the spider waves bye-bye and climbs back up
      return async () => {
        await wiggle(ctx.s, sp, 0.3, 0.25);
        sfx.whoosh();
        await ctx.s.tween(sp.position, { y: P.y + 10 }, 0.5, Ease.in);
      };
    },
  ],
};

// Pick a story for an emotion, rotating so the same one doesn't come back twice in a row.
const turn = {};
export function nextStory(emo) {
  const list = STORIES[emo];
  turn[emo] = ((turn[emo] ?? Math.floor(Math.random() * list.length)) + 1) % list.length;
  return list[turn[emo]];
}
