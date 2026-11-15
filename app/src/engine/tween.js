// Tiny tween/timer system. Every lesson owns a scope; killing it stops all its animations and timers.
export const Ease = {
  linear: (t) => t,
  out: (t) => 1 - (1 - t) ** 3,
  in: (t) => t * t * t,
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
  back: (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2; },
  elastic: (t) => (t === 0 || t === 1 ? t : 2 ** (-10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1),
  bounce: (t) => {
    const n1 = 7.5625, d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },
};

const scopes = new Set();

export function scope() {
  const s = {
    items: [],
    dead: false,
    // Animate numeric props of target (e.g. obj.position) to values in props.
    tween(target, props, dur = 0.4, ease = Ease.out) {
      if (s.dead) return new Promise(() => {});
      return new Promise((res) => {
        const from = {};
        for (const k in props) from[k] = target[k];
        s.items.push({
          target, t: 0, dur: Math.max(dur, 0.0001), res,
          update: (p) => { const e = ease(p); for (const k in props) target[k] = from[k] + (props[k] - from[k]) * e; },
        });
      });
    },
    // Call fn(easedProgress, rawProgress) every frame for dur seconds.
    anim(dur, fn, ease = Ease.linear) {
      if (s.dead) return new Promise(() => {});
      return new Promise((res) => {
        s.items.push({ t: 0, dur: Math.max(dur, 0.0001), res, update: (p) => fn(ease(p), p) });
      });
    },
    wait(sec) {
      if (s.dead) return new Promise(() => {});
      return new Promise((res) => s.items.push({ t: 0, dur: sec, res, update: () => {} }));
    },
    every(sec, fn) {
      const item = { t: 0, dur: Infinity, repeat: sec, acc: 0, update: () => {} };
      item.tick = (dt) => { item.acc += dt; if (item.acc >= sec) { item.acc -= sec; fn(); } };
      s.items.push(item);
      return () => { item.done = true; };
    },
    stop(target) { s.items = s.items.filter((i) => i.target !== target); },
    kill() { s.dead = true; s.items = []; scopes.delete(s); },
  };
  scopes.add(s);
  return s;
}

export function updateTweens(dt) {
  for (const s of scopes) {
    if (s.dead) continue;
    const list = s.items;
    s.items = [];
    const keep = [];
    for (const it of list) {
      if (it.done) continue;
      if (it.tick) { it.tick(dt); keep.push(it); continue; }
      it.t += dt;
      const p = Math.min(1, it.t / it.dur);
      it.update(p);
      if (p >= 1) it.res && it.res();
      else keep.push(it);
    }
    // Items added during callbacks were pushed onto s.items; keep them too.
    s.items = keep.concat(s.items);
  }
}

// App-wide scope for things that outlive lessons.
export const global = scope();
